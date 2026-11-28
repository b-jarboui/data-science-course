// lesson 14.3.5
// Factor analysis: finding hidden shared traits
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Fixed chapter 14.3 teaching data.
//
// Restricted two-attribute Gaussian factor model:
//   Floral  = shared trait + Floral-specific noise
//   Jasmine = shared trait + Jasmine-specific noise
//
// Both factor loadings are fixed at 1.
// Both attribute-specific noise variances are equal.
// Shared trait and separate noises are assumed independent.
//
// Expectation-maximization learns the shared variance and
// separate noise variance using the eight observed score pairs.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  // ------------------------------------------------------------

  const TEAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

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

  const N = D.length;

  const mean = a =>
    a.reduce((s, v) => s + v, 0) / a.length;

  const sum = a =>
    a.reduce((s, v) => s + v, 0);

  const PAIRS = D.map(row => row.slice(0, 2));

  const MEANS = [
    mean(PAIRS.map(row => row[0])),
    mean(PAIRS.map(row => row[1]))
  ];

  const Z = PAIRS.map(row =>
    row.map((v, j) => v - MEANS[j])
  );

  const FLORAL_VAR = mean(Z.map(row => row[0] ** 2));
  const JASMINE_VAR = mean(Z.map(row => row[1] ** 2));

  const PRODUCTS = Z.map(row => row[0] * row[1]);

  const COV = mean(PRODUCTS);

  const CORR =
    COV / Math.sqrt(FLORAL_VAR * JASMINE_VAR);

  // Exact teaching-model solution:
  // shared variance = 8
  // separate noise variance = 2 for each attribute

  const SHARED_TARGET = COV;

  const NOISE_TARGET =
    FLORAL_VAR - SHARED_TARGET;

  const SHARED_PCT =
    SHARED_TARGET / FLORAL_VAR * 100;

  // ------------------------------------------------------------
  // Actual expectation-maximization calculations.
  //
  // q = shared trait variance
  // r = separate noise variance, the same for both attributes
  //
  // E-step:
  //   E[h | x,y] = q(x+y)/(r+2q)
  //   Var[h | x,y] = qr/(r+2q)
  //
  // M-step:
  //   qNew = mean(E[h² | x,y])
  //   rNew = mean expected squared residual,
  //          averaged over both observed attributes
  //
  // The loss is the negative Gaussian log-likelihood per tea,
  // excluding its constant term.
  //
  // No hard-coded optimization path is used.
  // ------------------------------------------------------------

  function modelLoss(q, r) {
    const determinant = r * (r + 2 * q);

    const traceTerm =
      ((q + r) * (FLORAL_VAR + JASMINE_VAR) -
        2 * q * COV) / determinant;

    return 0.5 * (
      Math.log(determinant) + traceTerm
    );
  }

  function expectation(q, r) {
    const denominator = r + 2 * q;

    const posteriorVariance =
      q * r / denominator;

    return Z.map(([x, y]) => {
      const m = q * (x + y) / denominator;

      return {
        m,
        v: posteriorVariance,
        secondMoment: m * m + posteriorVariance
      };
    });
  }

  function emStep(q, r) {
    const estimates = expectation(q, r);

    const qNew = mean(
      estimates.map(e => e.secondMoment)
    );

    const rNew = mean(
      estimates.map((e, i) => {
        const [x, y] = Z[i];

        const floralResidual =
          (x - e.m) ** 2 + e.v;

        const jasmineResidual =
          (y - e.m) ** 2 + e.v;

        return (
          floralResidual + jasmineResidual
        ) / 2;
      })
    );

    return {
      q: qNew,
      r: rNew,
      dq: qNew - q,
      dr: rNew - r,
      loss: modelLoss(qNew, rNew),
      estimates
    };
  }

  const HISTORY = [{
    q: 4,
    r: 4,
    dq: 0,
    dr: 0,
    loss: modelLoss(4, 4),
    estimates: expectation(4, 4)
  }];

  const MAX_ITER = 12;

  for (let i = 1; i <= MAX_ITER; i++) {
    const prev = HISTORY[i - 1];

    HISTORY.push(
      emStep(prev.q, prev.r)
    );
  }

  // First three iterations, rounded:
  //
  // 0: q = 4.00, r = 4.00, loss = 2.936
  // 1: q = 5.33, r = 3.33, loss = 2.864
  // 2: q = 6.49, r = 2.78, loss = 2.821
  // 3: q = 7.25, r = 2.42, loss = 2.801

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

  const SHARED = CYAN;
  const NOISE = PINK;
  const LOSS = GREEN;

  const ac = j => j < 6 ? CYAN : AMBER;

  const number = v =>
    v < 0 ? `−${Math.abs(v)}` : String(v);

  const fixed = (v, digits = 2) =>
    v.toFixed(digits).replace('-', '−');

  const signed = (v, digits = 2) =>
    v < 0
      ? `−${Math.abs(v).toFixed(digits)}`
      : `+${v.toFixed(digits)}`;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone:  8 × 14.22, content y = −5.5 ... 4.3
  // Laptop: 14.22 × 8, content y = −3.0 ... 2.3
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

  const pos = (x, y) => [x, y, 0];

  // ------------------------------------------------------------
  // Drawing helpers.
  // ------------------------------------------------------------

  function at(
    s, size, color, x, y,
    mono = false, maxw = null
  ) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pos(x, y));

    return t;
  }

  function line(a, b, color = MUTED, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function rect(
    x, y, w, h, color,
    opacity = 0.82, strokeWidth = 1
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
    color = CYAN, opacity = 0
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(
        0.13, w / 5, h / 5
      ),
      color,
      strokeWidth: 2
    });

    r.setFill(CARD, opacity);
    r.moveTo(pos(x, y));

    return r;
  }

  function glowDot(p, color = CYAN, radius = 0.09) {
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

    return new M.VGroup(halo, d);
  }

  function glowingBar(
    x, base, v, scale, width, color
  ) {
    const h = Math.max(
      Math.abs(v) * scale, 0.022
    );

    const y = base +
      (v < 0 ? -h / 2 : h / 2);

    return new M.VGroup(
      rect(
        x, y,
        width + 0.045,
        h + 0.025,
        color, 0.12, 0
      ),

      rect(
        x, y,
        width, h,
        color,
        v === 0 ? 0.22 : 0.84,
        1
      )
    );
  }

  function arrow(
    a, b, color = CYAN,
    width = 3, head = 0.17
  ) {
    const theta = Math.atan2(
      b[1] - a[1],
      b[0] - a[0]
    );

    const p1 = pos(
      b[0] - head * Math.cos(theta - Math.PI / 6),
      b[1] - head * Math.sin(theta - Math.PI / 6)
    );

    const p2 = pos(
      b[0] - head * Math.cos(theta + Math.PI / 6),
      b[1] - head * Math.sin(theta + Math.PI / 6)
    );

    return new M.VGroup(
      line(a, b, color, width),
      line(b, p1, color, width),
      line(b, p2, color, width)
    );
  }

  function tagAt(
    text, color, x, y,
    size = 17, maxw = MAIN_W - 0.4
  ) {
    const tag = pill(text, color, size);

    if (tag.getWidth() > maxw) {
      tag.scale(maxw / tag.getWidth());
    }

    tag.moveTo(pos(x, y));

    return tag;
  }

  function caption(text, color = MUTED) {
    return at(
      text, P ? 17 : 15,
      color,
      CX, P ? -4.32 : -2.42,
      false, MAIN_W - 0.4
    );
  }

  // ------------------------------------------------------------
  // Formula box.
  //
  // One formula box at a time.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = CYAN) {
    const size = P ? 20 : 20;
    const lh = P ? 0.33 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, INK]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, INK, true)
        .getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.64;
    const ht = rows.length * lh + 0.32;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(CARD, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.32;
    const top = BOXP[1] + ht / 2 - 0.16 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo(pos(
        left + ind + t.getWidth() / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.62 : 3.5;

    const scale = Math.min(
      1, maxw / wd, maxh / ht
    );

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;

    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Picture management.
  //
  // Never regroup objects that are already on screen.
  // ------------------------------------------------------------

  let picture = [];
  let focusNow = null;

  function clearFocus() {
    if (!focusNow) return [];

    const old = focusNow;

    focusNow = null;

    return [new M.FadeOut(old)];
  }

  function focus(g) {
    const a = clearFocus();

    focusNow = g;
    a.push(new M.FadeIn(g));

    return a;
  }

  function scene(...objects) {
    const a = [
      ...clearFocus(),
      ...picture.map(o => new M.FadeOut(o)),
      ...objects.map(o => new M.FadeIn(o))
    ];

    picture = objects.slice();

    return a;
  }

  function enter(...objects) {
    picture.push(...objects);

    return objects.map(o => new M.FadeIn(o));
  }

  function leave(...objects) {
    picture = picture.filter(
      o => !objects.includes(o)
    );

    return objects.map(o => new M.FadeOut(o));
  }

  function enterLagged(
    objects, lagRatio = 0.10, runTime = 1.2
  ) {
    picture.push(...objects);

    return [
      new M.LaggedStart(
        objects.map(o => new M.FadeIn(o)),
        { lagRatio, runTime }
      )
    ];
  }

  // ------------------------------------------------------------
  // Persistent tea roster.
  // ------------------------------------------------------------

  const roster = new M.VGroup(
    ...TEAS.map((name, i) => {
      const x = CX +
        (i - 3.5) * (P ? 0.78 : 0.76);

      const r = outline(
        x, ROSTER_Y,
        0.48, 0.30,
        MUTED, 0.35
      );

      const t = at(
        name, P ? 15 : 14,
        INK,
        x, ROSTER_Y,
        true
      );

      return new M.VGroup(r, t);
    })
  );

  // ------------------------------------------------------------
  // Original twelve-attribute tasting profiles.
  //
  // First six attributes: cyan.
  // Last six attributes: amber.
  // Floral–Jasmine difference: highlighted in pink.
  // ------------------------------------------------------------

  const SP = P ? 0.53 : 0.54;

  const px = j =>
    CX + (j - 5.5) * SP;

  const PROFILE_BASES = P
    ? [-0.55, -3.55]
    : [-0.02, -1.83];

  function tastingProfile(i, row) {
    const base = PROFILE_BASES[row];
    const scale = P ? 0.16 : 0.102;

    const parts = [
      at(
        `Tea ${TEAS[i]}`,
        P ? 19 : 16,
        INK,
        P ? CX - 2.71 : px(0) - 0.78,
        base + (P ? 2.02 : 0.5),
        false, P ? 1.20 : 0.75
      ),

      line(
        pos(px(0) - 0.30, base),
        pos(px(11) + 0.30, base),
        MUTED, 1.6
      )
    ];

    D[i].forEach((v, j) => {
      parts.push(
        glowingBar(
          px(j), base, v, scale,
          0.31, ac(j)
        )
      );

      parts.push(
        at(
          v, P ? 15 : 13,
          ac(j),
          px(j), base + v * scale + 0.17,
          true
        )
      );

      parts.push(
        at(
          SHORT[j],
          P ? 15 : 11,
          ac(j),
          px(j),
          base - 0.26,
          false, 0.48
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const profileA = tastingProfile(0, 0);
  const profileE = tastingProfile(4, 1);

  function firstTwoHighlight(row) {
    const base = PROFILE_BASES[row];

    return outline(
      (px(0) + px(1)) / 2,
      base + (P ? 0.59 : 0.43),
      SP * 2 + 0.07,
      P ? 1.65 : 1.30,
      PINK
    );
  }

  // ------------------------------------------------------------
  // 0–1: why do several flower smells change together?
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(profileA, profileE),
    new M.FadeIn(roster),
    ...fbox([
      ['Two different teas', INK],
      ['Flower smells often', CYAN],
      ['rise and fall together', CYAN]
    ]),
    ...say('WHY DO FLOWER SMELLS CHANGE TOGETHER?')
  );

  const highlightA = firstTwoHighlight(0);
  const highlightE = firstTwoHighlight(1);

  await until(S(1));

  await play(
    ...enter(highlightA, highlightE),
    ...fbox([
      ['A shared cause?', VIOLET],
      'Something we cannot',
      'measure directly?',
      ['A hidden trait?', VIOLET]
    ], VIOLET),
    ...say('COULD THERE BE A HIDDEN SHARED TRAIT?', VIOLET)
  );

  // ------------------------------------------------------------
  // Floral and Jasmine score table.
  //
  // Each row shows two glowing bars and their exact values.
  // Centered versions use a visible zero baseline.
  // ------------------------------------------------------------

  const TABLE_TOP = P ? 0.92 : 0.81;
  const ROW_PITCH = P ? 0.70 : 0.385;

  const TY = i =>
    TABLE_TOP - i * ROW_PITCH;

  const COLS = {
    tea: CX - 2.76,
    floral: CX - 1.02,
    jasmine: CX + 1.02,
    product: CX + 2.78
  };

  const CELL_W = P ? 1.68 : 1.64;

  function pairTableHeader(product = false) {
    const y = TABLE_TOP + (P ? 0.65 : 0.43);

    const parts = [
      at(
        'Tea', 16, INK,
        COLS.tea, y
      ),

      at(
        'Floral', P ? 19 : 17,
        CYAN,
        COLS.floral, y,
        false, CELL_W
      ),

      at(
        'Jasmine', P ? 19 : 17,
        CYAN,
        COLS.jasmine, y,
        false, CELL_W
      ),

      line(
        pos(CX - 3.20, y - 0.27),
        pos(CX + (product ? 3.30 : 2.10), y - 0.27),
        MUTED, 1.5
      )
    ];

    if (product) {
      parts.push(
        at(
          'Product',
          P ? 16 : 14,
          GREEN,
          COLS.product, y,
          false, 1.0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function pairCell(value, x, y, centered = false) {
    const h = ROW_PITCH * 0.86;

    const parts = [
      outline(
        x, y,
        CELL_W, h,
        MUTED, 0.35
      )
    ];

    if (centered) {
      const scale = P ? 0.12 : 0.115;
      const originX = x - 0.24;
      const w = Math.max(
        Math.abs(value) * scale, 0.02
      );

      const barX = originX +
        (value < 0 ? -w / 2 : w / 2);

      parts.push(
        line(
          pos(originX, y - h * 0.31),
          pos(originX, y + h * 0.31),
          MUTED, 1
        ),

        rect(
          barX, y,
          w, h * 0.48,
          CYAN, 0.80, 1
        )
      );
    } else {
      const left = x - CELL_W / 2 + 0.12;
      const trackW = CELL_W * 0.62;
      const w = trackW * value / 10;

      parts.push(
        rect(
          left + trackW / 2,
          y, trackW, h * 0.48,
          CARD, 0.80, 0
        ),

        rect(
          left + w / 2,
          y, w, h * 0.48,
          CYAN, 0.82, 1
        )
      );
    }

    parts.push(
      at(
        number(value),
        P ? 19 : 16,
        CYAN,
        x + CELL_W / 2 - 0.24,
        y, true, 0.39
      )
    );

    return new M.VGroup(...parts);
  }

  function pairRow(i, centered = false) {
    const values = centered ? Z[i] : PAIRS[i];
    const y = TY(i);

    return new M.VGroup(
      at(
        TEAS[i],
        P ? 20 : 17,
        INK,
        COLS.tea, y, true
      ),

      pairCell(
        values[0],
        COLS.floral, y,
        centered
      ),

      pairCell(
        values[1],
        COLS.jasmine, y,
        centered
      )
    );
  }

  function pairRowHighlight(
    i, color = CYAN,
    includeProduct = false
  ) {
    const left = CX - 3.12;

    const right = CX +
      (includeProduct ? 3.36 : 1.94);

    return outline(
      (left + right) / 2,
      TY(i),
      right - left,
      ROW_PITCH * 0.96,
      color
    );
  }

  function pairColumnHighlight(j, color = CYAN) {
    const x = j === 0
      ? COLS.floral
      : COLS.jasmine;

    return outline(
      x,
      (TY(0) + TY(7)) / 2,
      CELL_W + 0.10,
      TY(0) - TY(7) + ROW_PITCH * 0.95,
      color
    );
  }

  const pairRows = TEAS.map((_, i) =>
    pairRow(i)
  );

  const pairHead = pairTableHeader();

  // Phone only: empty placeholder rows A-H so the table fills the
  // screen while the scores arrive one by one.
  const ghostRows = P ? TEAS.map((name, i) => new M.VGroup(
    at(name, 20, MUTED, COLS.tea, TY(i), true),
    outline(COLS.floral, TY(i), CELL_W, ROW_PITCH * 0.86, MUTED, 0.12),
    outline(COLS.jasmine, TY(i), CELL_W, ROW_PITCH * 0.86, MUTED, 0.12)
  )) : [];

  const reveal = (...idx) =>
    P ? leave(...idx.map(i => ghostRows[i])) : [];

  // ------------------------------------------------------------
  // 2: focus on the two observed attributes.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...scene(pairHead, ...ghostRows),
    ...fbox([
      ['Our two attributes', CYAN],
      'Floral and Jasmine',
      '8 teas, 2 scores each'
    ]),
    ...say('FLORAL AND JASMINE SCORES')
  );

  // ------------------------------------------------------------
  // 3–8: reveal the eight original score pairs.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...reveal(0),
    ...enter(pairRows[0]),
    ...fbox([
      ['Tea A', INK],
      'Floral  = 1',
      ['Jasmine = 3', CYAN]
    ]),
    ...say('TEA A: 1 AND 3')
  );

  await until(S(4));

  await play(
    ...reveal(1),
    ...enter(pairRows[1]),
    ...fbox([
      ['Tea B', INK],
      'Floral  = 3',
      ['Jasmine = 1', CYAN]
    ]),
    ...say('TEA B: 3 AND 1')
  );

  await until(S(5));

  await play(
    ...reveal(2, 3),
    ...enterLagged(
      [pairRows[2], pairRows[3]],
      0.20, 1.0
    ),
    ...fbox([
      ['Tea C: 1, 3', CYAN],
      ['Tea D: 3, 1', CYAN],
      'The same two pairs'
    ]),
    ...say('C AND D REPEAT THE PAIRS')
  );

  await until(S(6));

  await play(
    ...reveal(4),
    ...enter(pairRows[4]),
    ...fbox([
      ['Tea E', INK],
      'Floral  = 7',
      ['Jasmine = 9', CYAN]
    ]),
    ...say('TEA E: 7 AND 9')
  );

  await until(S(7));

  await play(
    ...reveal(5),
    ...enter(pairRows[5]),
    ...fbox([
      ['Tea F', INK],
      'Floral  = 9',
      ['Jasmine = 7', CYAN]
    ]),
    ...say('TEA F: 9 AND 7')
  );

  await until(S(8));

  await play(
    ...reveal(6, 7),
    ...enterLagged(
      [pairRows[6], pairRows[7]],
      0.20, 1.0
    ),
    ...fbox([
      ['Tea G: 7, 9', CYAN],
      ['Tea H: 9, 7', CYAN],
      'The high pairs repeat'
    ]),
    ...say('G AND H REPEAT THE HIGH PAIRS')
  );

  // ------------------------------------------------------------
  // Scatterplot of original Floral and Jasmine scores.
  //
  // Both axes use the same spatial scale.
  // Coincident observations share an exact mathematical
  // location, with both tea letters shown beside the dot.
  // ------------------------------------------------------------

  const MAP_SIDE = P ? 5.40 : 3.53;

  const MAP_O = P
    ? [CX - MAP_SIDE / 2, -3.85, 0]
    : [CX - MAP_SIDE / 2, -2.29, 0];

  const MAP_U = MAP_SIDE / 10;

  const mp = (x, y) =>
    pos(
      MAP_O[0] + x * MAP_U,
      MAP_O[1] + y * MAP_U
    );

  function scatterAxes() {
    const parts = [];

    for (let v = 0; v <= 10; v += 2) {
      parts.push(
        line(
          mp(v, 0), mp(v, 10),
          CARD, 1
        ),

        line(
          mp(0, v), mp(10, v),
          CARD, 1
        )
      );

      parts.push(
        at(
          v, P ? 15 : 13, MUTED,
          mp(v, 0)[0],
          mp(v, 0)[1] - 0.21,
          true
        )
      );

      if (v !== 0) {
        parts.push(
          at(
            v, P ? 15 : 13, MUTED,
            mp(0, v)[0] - 0.23,
            mp(0, v)[1],
            true
          )
        );
      }
    }

    parts.push(
      arrow(
        mp(0, 0),
        mp(10.3, 0),
        CYAN, 2.4, 0.14
      ),

      arrow(
        mp(0, 0),
        mp(0, 10.3),
        CYAN, 2.4, 0.14
      )
    );

    parts.push(
      at(
        'Floral',
        P ? 18 : 16,
        CYAN,
        mp(7.6, 0)[0],
        mp(7.6, 0)[1] - 0.48
      ),

      at(
        'Jasmine',
        P ? 18 : 16,
        CYAN,
        mp(1.2, 10)[0],
        mp(1.2, 10)[1] + 0.25
      )
    );

    return new M.VGroup(...parts);
  }

  const COINCIDENT = [
    { names: ['A', 'C'], x: 1, y: 3 },
    { names: ['B', 'D'], x: 3, y: 1 },
    { names: ['E', 'G'], x: 7, y: 9 },
    { names: ['F', 'H'], x: 9, y: 7 }
  ];

  function scatterPair(pair) {
    const p = mp(pair.x, pair.y);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.20 : 0.16,
      color: CYAN
    });

    halo.setFill(CYAN, 0.18);

    const ring = new M.Circle({
      radius: P ? 0.115 : 0.09,
      color: CYAN,
      strokeWidth: 2
    });

    ring.moveTo(p);

    const center = new M.Dot({
      point: p,
      radius: P ? 0.065 : 0.052,
      color: INK
    });

    const dx = pair.x >= 8 ? -0.31 : 0.31;

    const label = at(
      pair.names.join(', '),
      P ? 17 : 14,
      INK,
      p[0] + dx,
      p[1] + 0.24,
      true
    );

    return new M.VGroup(
      halo, ring, center, label
    );
  }

  const scatter = scatterAxes();

  const scatterDots =
    COINCIDENT.map(scatterPair);

  // ------------------------------------------------------------
  // 9: place all eight observations on the scatterplot.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...scene(scatter),
    ...fbox([
      ['Across: Floral', CYAN],
      ['Up: Jasmine', CYAN],
      'One position for each pair'
    ]),
    ...say('DRAW THE OBSERVED SCORE PAIRS')
  );

  await play(
    ...enterLagged(
      scatterDots,
      0.17, 1.2
    )
  );

  // ------------------------------------------------------------
  // 10: high values tend to occur together.
  // ------------------------------------------------------------

  const trend = arrow(
    mp(0.5, 0.5),
    mp(9.6, 9.6),
    GREEN, 3
  );

  const lowRegion = outline(
    mp(2, 2)[0],
    mp(2, 2)[1],
    MAP_U * 3.25,
    MAP_U * 3.25,
    CYAN
  );

  const highRegion = outline(
    mp(8, 8)[0],
    mp(8, 8)[1],
    MAP_U * 3.25,
    MAP_U * 3.25,
    CYAN
  );

  await until(S(10));

  await play(
    ...enter(trend, lowRegion, highRegion),
    ...fbox([
      ['Low Floral → low Jasmine', CYAN],
      ['High Floral → high Jasmine', CYAN],
      ['They tend to move together', GREEN]
    ], GREEN),
    ...say('HIGH FLORAL, USUALLY HIGH JASMINE', GREEN)
  );

  // ------------------------------------------------------------
  // 11: the observed attributes are not identical.
  // ------------------------------------------------------------

  const equalLine = new M.DashedLine({
    start: mp(0, 0),
    end: mp(10, 10),
    color: MUTED
  });

  const contrasts = [
    line(mp(2, 2), mp(1, 3), PINK, 3),
    line(mp(2, 2), mp(3, 1), PINK, 3),
    line(mp(8, 8), mp(7, 9), PINK, 3),
    line(mp(8, 8), mp(9, 7), PINK, 3)
  ];

  await until(S(11));

  await play(
    ...leave(trend, lowRegion, highRegion),
    ...enter(equalLine, ...contrasts),
    ...fbox([
      ['Related, not identical', PINK],
      'A: Floral 1, Jasmine 3',
      'B: Floral 3, Jasmine 1'
    ], PINK),
    ...say('THE TWO SCORES ARE NOT ALWAYS EQUAL', PINK)
  );

  // ------------------------------------------------------------
  // Hidden-control model.
  //
  // The visual distinction is explicit:
  // dashed-outline controls = unobserved model quantities
  // solid cards = observed tasting scores
  //
  // This is a proposed statistical model, not a demonstrated
  // physical mechanism.
  // ------------------------------------------------------------

  const MODEL_TOP = P ? 0.6 : 0.90;
  const MODEL_BOTTOM = P ? -3.3 : -1.64;

  const OBS_X = [CX - 1.64, CX + 1.64];

  const NOISE_X = [CX - 2.48, CX + 2.48];

  const NOISE_Y = P ? -1.2 : 0.14;

  function hiddenControl(
    title, subtitle, x, y,
    color, width
  ) {
    const h = P ? 0.86 : 0.70;

    const frame = outline(
      x, y, width, h,
      color, 0.24
    );

    const dashes = [];

    const left = x - width / 2 + 0.12;
    const right = x + width / 2 - 0.12;

    dashes.push(
      new M.DashedLine({
        start: pos(left, y + h / 2),
        end: pos(right, y + h / 2),
        color
      }),

      new M.DashedLine({
        start: pos(left, y - h / 2),
        end: pos(right, y - h / 2),
        color
      })
    );

    return new M.VGroup(
      frame,
      ...dashes,

      at(
        title,
        P ? 17 : 15,
        color,
        x, y + 0.14,
        false, width - 0.15
      ),

      at(
        subtitle,
        P ? 15 : 12,
        MUTED,
        x, y - 0.17,
        false, width - 0.15
      )
    );
  }

  function observedCard(j, value = null) {
    const x = OBS_X[j];
    const y = MODEL_BOTTOM;

    const w = P ? 2.68 : 2.59;
    const h = P ? 1.15 : 0.93;

    const parts = [
      outline(
        x, y, w, h,
        CYAN, 0.78
      ),

      at(
        j === 0 ? 'Floral' : 'Jasmine',
        P ? 21 : 19,
        CYAN,
        x, y + 0.19
      ),

      at(
        value === null
          ? 'Observed score'
          : value,
        P ? 16 : 14,
        INK,
        x, y - 0.20,
        false, w - 0.2
      )
    ];

    return new M.VGroup(...parts);
  }

  function sharedLinks() {
    const parts = [];

    for (let j = 0; j < 2; j++) {
      const side = j === 0 ? -1 : 1;

      parts.push(
        arrow(
          pos(CX + side * 0.55, MODEL_TOP - 0.46),
          pos(
            OBS_X[j] - side * 0.36,
            MODEL_BOTTOM + (P ? 0.60 : 0.49)
          ),
          SHARED, 3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function noiseLinks() {
    const parts = [];

    for (let j = 0; j < 2; j++) {
      const side = j === 0 ? -1 : 1;

      parts.push(
        arrow(
          pos(
            NOISE_X[j],
            NOISE_Y - (P ? 0.46 : 0.39)
          ),
          pos(
            OBS_X[j] + side * 0.48,
            MODEL_BOTTOM + (P ? 0.60 : 0.49)
          ),
          NOISE, 2.5
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function modelPicture() {
    const shared = hiddenControl(
      'Shared trait',
      'Unobserved',
      CX, MODEL_TOP,
      SHARED, 2.40
    );

    const separate = [
      hiddenControl(
        'Floral noise',
        'Unobserved',
        NOISE_X[0], NOISE_Y,
        NOISE, 1.77
      ),

      hiddenControl(
        'Jasmine noise',
        'Unobserved',
        NOISE_X[1], NOISE_Y,
        NOISE, 1.77
      )
    ];

    const sharedArrows = sharedLinks();
    const noiseArrows = noiseLinks();

    const observed = [
      observedCard(0),
      observedCard(1)
    ];

    return {
      shared,
      separate,
      sharedArrows,
      noiseArrows,
      observed
    };
  }

  const model = modelPicture();

  // ------------------------------------------------------------
  // 12: imagine one hidden shared control.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...scene(
      model.shared,
      model.sharedArrows,
      ...model.observed
    ),
    ...fbox([
      ['One hidden control', SHARED],
      'Raises both scores',
      'or lowers both scores',
      'A possible shared trait'
    ]),
    ...say('ONE HIDDEN SHARED CONTROL')
  );

  // ------------------------------------------------------------
  // 13: separate controls for each attribute.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...enter(
      ...model.separate,
      model.noiseArrows
    ),
    ...fbox([
      ['Shared change', SHARED],
      'Affects both attributes',
      ['Separate changes', NOISE],
      'One for each attribute'
    ], NOISE),
    ...say('TWO SMALLER SEPARATE CONTROLS', NOISE)
  );

  // ------------------------------------------------------------
  // 14: distinguish observed and hidden quantities.
  // ------------------------------------------------------------

  const modelObservedOutline = outline(
    CX, MODEL_BOTTOM,
    6.13,
    P ? 1.29 : 1.07,
    GREEN
  );

  await until(S(14));

  await play(
    ...focus(modelObservedOutline),
    ...fbox([
      ['Observed: tasting scores', GREEN],
      ['Unobserved: controls', VIOLET],
      'We infer the controls',
      'from the score patterns'
    ], VIOLET),
    ...say('SCORES ARE OBSERVED; CONTROLS ARE HIDDEN', VIOLET)
  );

  // ------------------------------------------------------------
  // 15: name the shared factor.
  // ------------------------------------------------------------

  const factorTag = tagAt(
    'FACTOR = HIDDEN TRAIT',
    SHARED,
    CX,
    P ? -4.3 : -2.38,
    P ? 17 : 15
  );

  await until(S(15));

  await play(
    ...clearFocus(),
    ...enter(factorTag),
    new M.Indicate(
      model.shared,
      { color: SHARED }
    ),
    ...fbox([
      ['Factor', SHARED],
      'A hidden shared trait',
      'Used to explain related',
      'changes in observed scores'
    ]),
    ...say('FACTOR = HIDDEN SHARED TRAIT')
  );

  // ------------------------------------------------------------
  // 16: attribute-specific noise.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...leave(factorTag),
    new M.Indicate(
      model.separate[0],
      { color: NOISE }
    ),
    new M.Indicate(
      model.separate[1],
      { color: NOISE }
    ),
    ...fbox([
      ['Attribute-specific noise', NOISE],
      'Variation belonging to',
      'one attribute alone',
      'Not the shared factor'
    ], NOISE),
    ...say('ATTRIBUTE-SPECIFIC NOISE', NOISE)
  );

  // ------------------------------------------------------------
  // 17: factor analysis.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...fbox([
      ['Factor analysis', GREEN],
      'Explain observed relationships',
      'using hidden shared traits',
      'and separate variation'
    ], GREEN),
    ...say('FACTOR ANALYSIS', GREEN)
  );

  // ------------------------------------------------------------
  // 18–21: center both observed attributes.
  // ------------------------------------------------------------

  const rawPairHead = pairTableHeader();

  const rawPairRows = TEAS.map((_, i) =>
    pairRow(i)
  );

  const centeredHead = pairTableHeader();

  const centeredRows = TEAS.map((_, i) =>
    pairRow(i, true)
  );

  function pairMeanRow(centered = false) {
    const y = TY(7) - (P ? 0.62 : 0.42);

    return new M.VGroup(
      at(
        'Mean',
        P ? 16 : 14,
        GREEN,
        COLS.tea, y
      ),

      at(
        centered ? '0' : '5',
        20, GREEN,
        COLS.floral, y,
        true
      ),

      at(
        centered ? '0' : '5',
        20, GREEN,
        COLS.jasmine, y,
        true
      )
    );
  }

  const originalMeanRow = pairMeanRow(false);
  const zeroMeanRow = pairMeanRow(true);

  await until(S(18));

  await play(
    ...scene(
      rawPairHead,
      ...rawPairRows,
      originalMeanRow
    ),
    ...fbox([
      ['How much do they share?', GREEN],
      'Floral mean  = 5',
      'Jasmine mean = 5'
    ], GREEN),
    ...say('MEASURE THEIR SHARED VARIATION', GREEN)
  );

  await until(S(19));

  await play(
    ...scene(
      centeredHead,
      ...centeredRows,
      zeroMeanRow
    ),
    ...fbox([
      ['Centered score', CYAN],
      '= original score − 5',
      '1 becomes −4',
      '3 becomes −2'
    ]),
    ...say('SUBTRACT THE MEAN OF 5')
  );

  await until(S(20));

  await play(
    ...focus(pairColumnHighlight(0)),
    ...fbox([
      ['Centered Floral scores', CYAN],
      '−4, −2, −4, −2',
      '+2, +4, +2, +4',
      ['Each value occurs twice', GREEN]
    ]),
    ...say('FLORAL: −4, −2, +2, +4')
  );

  await until(S(21));

  await play(
    ...focus(pairColumnHighlight(1)),
    ...fbox([
      ['Centered Jasmine scores', CYAN],
      '−2, −4, −2, −4',
      '+4, +2, +4, +2',
      ['Same values, different order', GREEN]
    ]),
    ...say('JASMINE: THE SAME VALUES IN ANOTHER ORDER')
  );

  // ------------------------------------------------------------
  // 22–25: calculate the variance of each attribute.
  //
  // Four distinct centered values, each appearing twice.
  // Their squared distances:
  //   16, 4, 4, 16
  //
  // Since all four occur equally often:
  //   (16 + 4 + 4 + 16) / 4 = 10
  // ------------------------------------------------------------

  const DISTINCT = [-4, -2, 2, 4];

  const SQ_X = DISTINCT.map((_, i) =>
    CX + (i - 1.5) * 1.56
  );

  const SQ_Y = P ? -0.82 : -0.54;

  function squareTile(
    x, y, n, color
  ) {
    const cell = P ? 0.245 : 0.225;

    const parts = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        parts.push(
          rect(
            x + (
              c - (n - 1) / 2
            ) * cell,

            y + (
              r - (n - 1) / 2
            ) * cell,

            cell * 0.86,
            cell * 0.86,
            color, 0.82, 1
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function centeredValueCard(v, i) {
    const x = SQ_X[i];
    const y = P ? 0.78 : 0.75;

    return new M.VGroup(
      outline(
        x, y, 1.25,
        P ? 0.78 : 0.62,
        CYAN, 0.50
      ),

      at(
        number(v),
        P ? 24 : 21,
        CYAN,
        x, y, true
      )
    );
  }

  const valueCards = DISTINCT.map(
    centeredValueCard
  );

  const repeatedNote = at(
    'Each centered value appears twice',
    P ? 18 : 16,
    MUTED,
    CX,
    P ? -2.87 : -2.11,
    false, MAIN_W - 0.35
  );

  await until(S(22));

  await play(
    ...scene(
      ...valueCards,
      repeatedNote
    ),
    ...fbox([
      ['Variance', VIOLET],
      'Mean of squared distances',
      'from the mean',
      'Centered mean = 0'
    ], VIOLET),
    ...say('VARIANCE = MEAN SQUARED DISTANCE', VIOLET)
  );

  const squares = DISTINCT.map((v, i) =>
    squareTile(
      SQ_X[i], SQ_Y,
      Math.abs(v),
      CYAN
    )
  );

  const squareResults = DISTINCT.map((v, i) =>
    at(
      `${number(v)} squared = ${v * v}`,
      P ? 17 : 15,
      CYAN,
      SQ_X[i],
      SQ_Y - 0.78,
      false, 1.48
    )
  );

  const squareArrows = DISTINCT.map((_, i) =>
    arrow(
      pos(SQ_X[i], P ? 0.30 : 0.32),
      pos(SQ_X[i], SQ_Y + 0.58),
      VIOLET, 2, 0.12
    )
  );

  await until(S(23));

  await play(
    ...enter(...squareArrows),
    ...enterLagged(
      squares, 0.16, 1.4
    ),
    ...enter(...squareResults),
    ...fbox([
      ['Square each value', VIOLET],
      '(−4) × (−4) = 16',
      '(−2) × (−2) = 4',
      ['16, 4, 4, 16', CYAN]
    ], VIOLET),
    ...say('SQUARED DISTANCES: 16, 4, 4, 16')
  );

  const total40 = tagAt(
    '16 + 4 + 4 + 16 = 40',
    AMBER,
    CX,
    P ? -2.32 : -1.86,
    P ? 18 : 16
  );

  await until(S(24));

  await play(
    ...leave(repeatedNote),
    ...enter(total40),
    ...fbox([
      ['Total = 40', AMBER],
      'Four equally frequent values',
      ['40 ÷ 4 = 10', GREEN],
      'Equivalently: 80 ÷ 8'
    ], GREEN),
    ...say('40 DIVIDED BY 4 = 10', GREEN)
  );

  // ------------------------------------------------------------
  // Ten variance blocks for each observed attribute.
  // ------------------------------------------------------------

  const VAR_BLOCK_W = P ? 0.58 : 0.47;
  const VAR_BLOCK_STEP = P ? 0.68 : 0.55;

  const VAR_X = j =>
    CX + (j - 4.5) * VAR_BLOCK_STEP;

  const VAR_Y = P
    ? [-0.5, -3.2]
    : [0.33, -1.17];

  function varianceBlock(
    j, row, color = CYAN
  ) {
    const x = VAR_X(j);
    const y = VAR_Y[row];

    return new M.VGroup(
      rect(
        x, y,
        VAR_BLOCK_W + 0.045,
        VAR_BLOCK_W + 0.045,
        color, 0.12, 0
      ),

      rect(
        x, y,
        VAR_BLOCK_W,
        VAR_BLOCK_W,
        color, 0.86, 1
      )
    );
  }

  function varianceRowTitle(row, text = null) {
    return at(
      text === null
        ? `${row === 0 ? 'Floral' : 'Jasmine'} variance = 10`
        : text,
      P ? 20 : 18,
      CYAN,
      CX,
      VAR_Y[row] + 0.62,
      false, MAIN_W - 0.35
    );
  }

  const totalVarianceRows = [0, 1].map(row =>
    new M.VGroup(
      varianceRowTitle(row),

      ...Array.from(
        { length: 10 },
        (_, j) => varianceBlock(j, row)
      )
    )
  );

  await until(S(25));

  await play(
    ...scene(...totalVarianceRows),
    ...fbox([
      ['Floral variance  = 10', CYAN],
      ['Jasmine variance = 10', CYAN],
      'Same amount of spread'
    ]),
    ...say('BOTH ATTRIBUTES HAVE VARIANCE 10')
  );

  // ------------------------------------------------------------
  // 26–31: covariance.
  //
  // Multiply matching centered values.
  // Every product is exactly 8.
  // ------------------------------------------------------------

  const covHead = pairTableHeader(true);

  const covRows = TEAS.map((_, i) =>
    pairRow(i, true)
  );

  function productCell(i) {
    const x = COLS.product;
    const y = TY(i);

    return new M.VGroup(
      outline(
        x, y, 0.95,
        ROW_PITCH * 0.86,
        GREEN, 0.36
      ),

      at(
        PRODUCTS[i],
        P ? 20 : 17,
        GREEN,
        x, y, true
      )
    );
  }

  const productCells = TEAS.map(
    (_, i) => productCell(i)
  );

  await until(S(26));

  await play(
    ...scene(covHead, ...covRows),
    ...fbox([
      ['For each tea', VIOLET],
      'Centered Floral',
      '× centered Jasmine',
      'Then find their mean'
    ], VIOLET),
    ...say('MULTIPLY THE MATCHING CENTERED SCORES', VIOLET)
  );

  await until(S(27));

  await play(
    ...enter(productCells[0]),
    ...focus(
      pairRowHighlight(0, GREEN, true)
    ),
    ...fbox([
      ['Tea A', INK],
      '(−4) × (−2)',
      ['= 8', GREEN]
    ], GREEN),
    ...say('TEA A: −4 × −2 = 8', GREEN)
  );

  await until(S(28));

  await play(
    ...enter(productCells[1]),
    ...focus(
      pairRowHighlight(1, GREEN, true)
    ),
    ...fbox([
      ['Tea B', INK],
      '(−2) × (−4)',
      ['= 8', GREEN]
    ], GREEN),
    ...say('TEA B: −2 × −4 = 8', GREEN)
  );

  await until(S(29));

  await play(
    ...clearFocus(),
    ...enterLagged(
      productCells.slice(2),
      0.12, 1.1
    ),
    ...fbox([
      ['All eight products', GREEN],
      '8, 8, 8, 8',
      '8, 8, 8, 8'
    ], GREEN),
    ...say('EVERY PRODUCT IS 8', GREEN)
  );

  const productOutline = outline(
    COLS.product,
    (TY(0) + TY(7)) / 2,
    1.07,
    TY(0) - TY(7) + ROW_PITCH * 0.95,
    GREEN
  );

  await until(S(30));

  await play(
    ...focus(productOutline),
    ...fbox([
      ['Covariance', GREEN],
      'Mean of the products',
      'of centered scores',
      'Measures shared change'
    ], GREEN),
    ...say('COVARIANCE MEASURES SHARED CHANGE', GREEN)
  );

  const covMeanTag = tagAt(
    '64 ÷ 8 = 8',
    GREEN,
    CX,
    P ? -4.18 : -2.36,
    P ? 18 : 16
  );

  await until(S(31));

  await play(
    ...enter(covMeanTag),
    ...fbox([
      ['Covariance', GREEN],
      '(8 + 8 + … + 8) ÷ 8',
      ['= 64 ÷ 8 = 8', GREEN]
    ], GREEN),
    ...say('COVARIANCE = 8', GREEN)
  );

  // ------------------------------------------------------------
  // 32–34: explain the observed covariance under the
  // restricted factor-model assumptions.
  //
  // The shared factor has loading 1 for each attribute.
  // Both noise terms are independent of the shared factor
  // and independent of one another.
  //
  // Therefore:
  //   Cov(Floral, Jasmine) = shared variance
  //   Var(Floral) = shared variance + separate noise
  //   Var(Jasmine) = shared variance + separate noise
  // ------------------------------------------------------------

  const fittedModel = modelPicture();

  const weightLabels = new M.VGroup(
    at(
      '1', 17, SHARED,
      CX - 0.68,
      (MODEL_TOP + MODEL_BOTTOM) / 2 + 0.12,
      true
    ),

    at(
      '1', 17, SHARED,
      CX + 0.68,
      (MODEL_TOP + MODEL_BOTTOM) / 2 + 0.12,
      true
    )
  );

  const assumptionsTag = tagAt(
    'MODEL ASSUMPTIONS',
    VIOLET,
    CX,
    P ? -3.57 : -2.38,
    P ? 17 : 15
  );

  await until(S(32));

  await play(
    ...scene(
      fittedModel.shared,
      ...fittedModel.separate,
      fittedModel.sharedArrows,
      fittedModel.noiseArrows,
      ...fittedModel.observed,
      weightLabels,
      assumptionsTag
    ),
    ...fbox([
      ['Our model assumes', VIOLET],
      'Equal shared effects: 1, 1',
      'Equal noise variances',
      'Independent separate noises'
    ], VIOLET),
    ...say('EQUAL SHARED EFFECTS, INDEPENDENT NOISE', VIOLET)
  );

  const shared8Label = tagAt(
    'SHARED VARIANCE = 8',
    SHARED,
    CX,
    P ? -3.56 : -2.38,
    P ? 17 : 15
  );

  await until(S(33));

  await play(
    ...leave(assumptionsTag),
    ...enter(shared8Label),
    new M.Indicate(
      fittedModel.shared,
      { color: SHARED }
    ),
    ...fbox([
      ['Under these assumptions', INK],
      'Covariance = shared variance',
      ['Observed covariance = 8', GREEN],
      ['Shared variance = 8', SHARED]
    ]),
    ...say('SHARED TRAIT VARIANCE = 8')
  );

  const noise2Label = tagAt(
    '10 − 8 = 2 SEPARATE UNITS',
    NOISE,
    CX,
    P ? -4.3 : -2.38,
    P ? 17 : 15
  );

  await until(S(34));

  await play(
    ...leave(shared8Label),
    ...enter(noise2Label),
    new M.Indicate(
      fittedModel.separate[0],
      { color: NOISE }
    ),
    new M.Indicate(
      fittedModel.separate[1],
      { color: NOISE }
    ),
    ...fbox([
      ['Each attribute: variance 10', INK],
      ['Shared variance = 8', SHARED],
      ['Separate noise = 10 − 8', NOISE],
      ['= 2 for each attribute', NOISE]
    ], NOISE),
    ...say('EACH SEPARATE NOISE VARIANCE = 2', NOISE)
  );

  // ------------------------------------------------------------
  // 35–36: split each variance into eight shared units
  // and two separate units.
  //
  // Both bars have total length 10.
  // Pink blocks represent independent noise terms in the model,
  // not a second shared factor.
  // ------------------------------------------------------------

  function splitVariancePicture() {
    const parts = [];
    const blocks = [[], []];

    for (let row = 0; row < 2; row++) {
      parts.push(
        varianceRowTitle(
          row,
          `${row === 0 ? 'Floral' : 'Jasmine'}: total variance 10`
        )
      );

      for (let j = 0; j < 10; j++) {
        const b = varianceBlock(
          j, row,
          j < 8 ? SHARED : NOISE
        );

        blocks[row].push(b);
        parts.push(b);
      }

      const y = VAR_Y[row] - 0.50;

      parts.push(
        at(
          '8 shared',
          P ? 18 : 16,
          SHARED,
          (VAR_X(0) + VAR_X(7)) / 2,
          y
        ),

        at(
          '2 separate',
          P ? 15 : 13,
          NOISE,
          (VAR_X(8) + VAR_X(9)) / 2,
          y,
          false, 1.12
        )
      );
    }

    return {
      group: new M.VGroup(...parts),
      blocks
    };
  }

  const splitVariance = splitVariancePicture();

  await until(S(35));

  await play(
    ...scene(splitVariance.group),
    ...fbox([
      ['Floral: 8 + 2 = 10', CYAN],
      ['Jasmine: 8 + 2 = 10', CYAN],
      ['Shared blocks: 8', SHARED],
      ['Separate blocks: 2 each', NOISE]
    ]),
    ...say('8 SHARED BLOCKS AND 2 SEPARATE BLOCKS')
  );

  const shared80 = tagAt(
    '80% SHARED · 20% SEPARATE',
    GREEN,
    CX,
    P ? -3.53 : -2.26,
    P ? 18 : 16
  );

  await until(S(36));

  await play(
    ...enter(shared80),
    ...fbox([
      ['Shared fraction = 8 ÷ 10', SHARED],
      ['= 0.8 = 80%', GREEN],
      ['Separate fraction = 20%', NOISE],
      'For each attribute'
    ], GREEN),
    ...say('SHARED TRAIT EXPLAINS 80%', GREEN)
  );

  // ------------------------------------------------------------
  // Expectation-maximization dashboard.
  //
  // Left: current shared and separate variance estimates.
  // Right: actual negative log-likelihood curve.
  //
  // The two panels form one calculation picture.
  // Both variance estimates use the same scale.
  // ------------------------------------------------------------

  const BAR_LEFT = CX - 3.16;
  const BAR_W = P ? 2.72 : 2.67;
  const BAR_H = P ? 0.37 : 0.30;

  const BAR_Y = P
    ? [0.26, -1.41]
    : [0.38, -1.05];

  const EST_CENTER = BAR_LEFT + BAR_W / 2;

  const CHART_LEFT = CX + 0.47;
  const CHART_RIGHT = CX + 3.20;

  const CHART_TOP = P ? 0.73 : 0.75;
  const CHART_BOTTOM = P ? -2.85 : -1.94;

  const LOSS_MIN = 2.76;
  const LOSS_MAX = 2.96;

  const gx = step =>
    CHART_LEFT +
    step / MAX_ITER * (
      CHART_RIGHT - CHART_LEFT
    );

  const gy = loss =>
    CHART_BOTTOM +
    (loss - LOSS_MIN) /
    (LOSS_MAX - LOSS_MIN) *
    (CHART_TOP - CHART_BOTTOM);

  function estimateTrack(k) {
    const color = k === 0 ? SHARED : NOISE;
    const y = BAR_Y[k];

    const target = k === 0
      ? SHARED_TARGET
      : NOISE_TARGET;

    const tx = BAR_LEFT + BAR_W * target / 10;

    return new M.VGroup(
      at(
        k === 0 ? 'Shared variance' : 'Separate noise',
        P ? 18 : 16,
        color,
        EST_CENTER, y + 0.59,
        false, BAR_W + 0.15
      ),

      rect(
        EST_CENTER,
        y,
        BAR_W,
        BAR_H,
        CARD, 0.78, 0
      ),

      line(
        pos(BAR_LEFT, y - BAR_H / 2 - 0.07),
        pos(BAR_LEFT, y + BAR_H / 2 + 0.07),
        MUTED, 1.4
      ),

      line(
        pos(BAR_LEFT + BAR_W, y - BAR_H / 2 - 0.07),
        pos(BAR_LEFT + BAR_W, y + BAR_H / 2 + 0.07),
        MUTED, 1.4
      ),

      at(
        '0', P ? 15 : 12, MUTED,
        BAR_LEFT,
        y - 0.27,
        true
      ),

      at(
        '10', P ? 15 : 12, MUTED,
        BAR_LEFT + BAR_W,
        y - 0.27,
        true
      )
    );
  }

  function estimateFill(k, value) {
    const color = k === 0 ? SHARED : NOISE;
    const y = BAR_Y[k];

    const w = BAR_W * value / 10;

    return new M.VGroup(
      rect(
        BAR_LEFT + w / 2,
        y,
        w + 0.025,
        BAR_H + 0.055,
        color, 0.12, 0
      ),

      rect(
        BAR_LEFT + w / 2,
        y,
        w, BAR_H,
        color, 0.88, 1
      ),

      at(
        fixed(value),
        P ? 27 : 23,
        color,
        EST_CENTER,
        y - (P ? 0.60 : 0.47),
        true
      )
    );
  }

  function targetMarks() {
    const parts = [];

    [SHARED_TARGET, NOISE_TARGET].forEach((v, k) => {
      const x = BAR_LEFT + BAR_W * v / 10;
      const y = BAR_Y[k];

      parts.push(
        new M.DashedLine({
          start: pos(x, y - BAR_H / 2 - 0.04),
          end: pos(x, y + BAR_H / 2 + 0.19),
          color: GREEN
        }),

        at(
          `→ ${v}`,
          P ? 15 : 13,
          GREEN,
          x, y + 0.35,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function lossAxes() {
    const parts = [
      at(
        'Loss',
        P ? 20 : 18,
        LOSS,
        P ? (CHART_LEFT + CHART_RIGHT) / 2 : CHART_LEFT + 0.3,
        CHART_TOP + 0.48
      ),

      line(
        pos(CHART_LEFT, CHART_BOTTOM),
        pos(CHART_RIGHT, CHART_BOTTOM),
        MUTED, 1.6
      ),

      line(
        pos(CHART_LEFT, CHART_BOTTOM),
        pos(CHART_LEFT, CHART_TOP),
        MUTED, 1.6
      )
    ];

    for (const value of [2.8, 2.9]) {
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

    for (const i of [0, 3, 6, 12]) {
      parts.push(
        line(
          pos(gx(i), CHART_BOTTOM - 0.05),
          pos(gx(i), CHART_BOTTOM + 0.05),
          MUTED, 1.2
        ),

        at(
          i,
          P ? 15 : 12,
          MUTED,
          gx(i),
          CHART_BOTTOM - 0.18,
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
        CHART_BOTTOM - 0.42
      )
    );

    return new M.VGroup(...parts);
  }

  function iterationTag(step) {
    return tagAt(
      `ROUND ${step}`,
      VIOLET,
      EST_CENTER,
      P ? -3.25 : -2.15,
      P ? 17 : 15,
      BAR_W + 0.12
    );
  }

  function currentLossTag(step) {
    return at(
      `${P ? 'Loss ' : '= '}${fixed(HISTORY[step].loss, 3)}`,
      P ? 17 : 15,
      LOSS,
      P ? (CHART_LEFT + CHART_RIGHT) / 2 : CHART_LEFT + 1.15,
      P ? -3.80 : CHART_TOP + 0.48,
      true, 2.82
    );
  }

  function lossPoint(step) {
    return glowDot(
      pos(
        gx(step),
        gy(HISTORY[step].loss)
      ),
      LOSS,
      P ? 0.065 : 0.050
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

      LOSS, 2.6
    );
  }

  const estimateTracks = [
    estimateTrack(0),
    estimateTrack(1)
  ];

  let sharedFill = estimateFill(0, HISTORY[0].q);
  let noiseFill = estimateFill(1, HISTORY[0].r);

  const lossChart = lossAxes();

  let roundNow = iterationTag(0);

  let lossNow = currentLossTag(0);

  let displayedStep = 0;

  const lossPoints = [];
  const lossSegments = [];

  function setShared(value, runTime = 0.7) {
    return new M.Transform(
      sharedFill,
      estimateFill(0, value),
      { runTime }
    );
  }

  function setNoise(value, runTime = 0.7) {
    return new M.Transform(
      noiseFill,
      estimateFill(1, value),
      { runTime }
    );
  }

  function setRound(step, runTime = 0.5) {
    return new M.Transform(
      roundNow,
      iterationTag(step),
      { runTime }
    );
  }

  function plotLoss(step, runTime = 0.6) {
    const a = [];

    for (
      let i = displayedStep + 1;
      i <= step;
      i++
    ) {
      const segment = lossSegment(i);
      const point = lossPoint(i);

      lossSegments.push(segment);
      lossPoints.push(point);

      picture.push(segment, point);

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
        currentLossTag(step),
        { runTime }
      )
    );

    displayedStep = step;

    return a;
  }

  function emUpdateAnimations(
    step, runTime = 0.65
  ) {
    const h = HISTORY[step];

    return [
      setShared(h.q, runTime),
      setNoise(h.r, runTime),
      setRound(step, runTime),
      ...plotLoss(step, runTime)
    ];
  }

  // ------------------------------------------------------------
  // 37: how could a computer learn the amounts?
  // ------------------------------------------------------------

  const unknownTag = tagAt(
    'CAN THE COMPUTER LEARN BOTH AMOUNTS?',
    VIOLET,
    CX,
    P ? -3.60 : -2.30,
    P ? 16 : 14
  );

  await until(S(37));

  await play(
    ...leave(shared80),
    ...enter(unknownTag),
    ...fbox([
      ['Learning problem', VIOLET],
      'Start without the answers',
      'Estimate both variances',
      'Improve the model repeatedly'
    ], VIOLET),
    ...say('HOW CAN THE COMPUTER LEARN?', VIOLET)
  );

  // ------------------------------------------------------------
  // 38: initialize q = 4 and r = 4.
  //
  // Do not show the target markers yet.
  // The learning calculation does not use the target values.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...scene(
      ...estimateTracks,
      sharedFill,
      noiseFill,
      roundNow
    ),
    ...fbox([
      ['Starting estimates', VIOLET],
      ['Shared variance = 4', SHARED],
      ['Separate noise = 4', NOISE],
      'These are initial guesses'
    ], VIOLET),
    ...say('START WITH SHARED 4, SEPARATE 4', VIOLET)
  );

  // ------------------------------------------------------------
  // 39: introduce the model loss.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...enter(lossChart),
    ...fbox([
      ['Loss', LOSS],
      'Measures model mismatch',
      'Lower is better',
      'Gaussian model likelihood'
    ], LOSS),
    ...say('LOSS MEASURES HOW POORLY THE MODEL FITS', LOSS)
  );

  // ------------------------------------------------------------
  // 40: actual starting loss.
  // ------------------------------------------------------------

  const initialLossDot = lossPoint(0);

  lossPoints.push(initialLossDot);

  await until(S(40));

  await play(
    ...enter(initialLossDot, lossNow),
    ...fbox([
      ['Round 0', VIOLET],
      'Shared = 4.00',
      'Noise  = 4.00',
      [`Loss = ${fixed(HISTORY[0].loss, 3)}`, LOSS]
    ], LOSS),
    ...say('STARTING LOSS ≈ 2.94', LOSS)
  );

  // ------------------------------------------------------------
  // E-step picture.
  //
  // Estimate the hidden factor for every tea.
  // The central dot is its posterior mean.
  // The horizontal translucent interval represents one
  // posterior standard deviation on either side of that mean.
  //
  // These are uncertain estimates, not observed hidden values.
  // ------------------------------------------------------------

  const EST_TOP = P ? 0.85 : 0.80;
  const EST_PITCH = P ? 0.57 : 0.365;

  const ey = i =>
    EST_TOP - i * EST_PITCH;

  const EST_X0 = CX + 0.53;
  const EST_SCALE = P ? 0.42 : 0.40;

  const ex = value =>
    EST_X0 + EST_SCALE * value;

  function expectationFrame() {
    const top = EST_TOP + 0.47;
    const bottom = ey(7) - 0.28;

    const parts = [
      at(
        'Tea',
        P ? 16 : 14,
        INK,
        CX - 3.10, top
      ),

      at(
        'Floral',
        P ? 15 : 13,
        CYAN,
        CX - 2.24, top
      ),

      at(
        'Jasmine',
        P ? 15 : 13,
        CYAN,
        CX - 1.34, top
      ),

      at(
        'Estimated hidden trait',
        P ? 16 : 14,
        SHARED,
        CX + 1.02, top,
        false, 3.2
      ),

      new M.DashedLine({
        start: pos(ex(0), bottom),
        end: pos(ex(0), EST_TOP + 0.20),
        color: MUTED
      }),

      line(
        pos(ex(-4), bottom),
        pos(ex(4), bottom),
        MUTED, 1.5
      )
    ];

    for (const v of [-4, -2, 0, 2, 4]) {
      parts.push(
        at(
          number(v),
          P ? 15 : 12,
          MUTED,
          ex(v), bottom - 0.22,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function expectationRow(i, estimates) {
    const e = estimates[i];
    const y = ey(i);

    const sd = Math.sqrt(e.v);

    const left = ex(e.m - sd);
    const right = ex(e.m + sd);

    const p = pos(ex(e.m), y);

    const parts = [
      at(
        TEAS[i],
        P ? 18 : 15,
        INK,
        CX - 3.10, y, true
      ),

      at(
        number(Z[i][0]),
        P ? 17 : 14,
        CYAN,
        CX - 2.24, y, true
      ),

      at(
        number(Z[i][1]),
        P ? 17 : 14,
        CYAN,
        CX - 1.34, y, true
      ),

      rect(
        (left + right) / 2,
        y,
        right - left,
        P ? 0.20 : 0.15,
        VIOLET, 0.18, 0
      ),

      line(
        pos(left, y),
        pos(right, y),
        VIOLET, 1.5
      ),

      line(
        pos(left, y - 0.07),
        pos(left, y + 0.07),
        VIOLET, 1.5
      ),

      line(
        pos(right, y - 0.07),
        pos(right, y + 0.07),
        VIOLET, 1.5
      ),

      glowDot(
        p, SHARED,
        P ? 0.075 : 0.058
      ),

      at(
        fixed(e.m, 2),
        P ? 15 : 13,
        SHARED,
        CX + 2.85, y,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  const firstEstimates =
    HISTORY[1].estimates;

  const eFrame = expectationFrame();

  const eRows = TEAS.map((_, i) =>
    expectationRow(i, firstEstimates)
  );

  const uncertaintyNote = at(
    'Dot = estimate · interval = uncertainty',
    P ? 16 : 14,
    VIOLET,
    CX,
    P ? -4.32 : -2.48,
    false, MAIN_W - 0.35
  );

  // ------------------------------------------------------------
  // 41: the first expectation step.
  //
  // With q = 4 and r = 4:
  //
  // Tea A has centered values (−4, −2).
  // Posterior mean = 4 × (−4 − 2) / 12 = −2.
  //
  // Posterior variance = 4 × 4 / 12 = 1.333...
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...scene(
      eFrame,
      ...eRows,
      uncertaintyNote
    ),
    ...fbox([
      ['Step 1: estimate hidden traits', VIOLET],
      'Use both observed scores',
      'and current variances',
      ['Tea A: estimated trait −2', SHARED]
    ], VIOLET),
    ...say('ESTIMATE EACH TEA’S HIDDEN TRAIT', VIOLET)
  );

  // ------------------------------------------------------------
  // 42: the first maximization step.
  //
  // Update the shared variance using expected squared traits.
  // Update the noise variance using expected squared residuals.
  // The posterior variance must be included in both updates.
  // ------------------------------------------------------------

  function updateCard(
    title, lines, x, y,
    color, width = 3.05
  ) {
    const lh = P ? 0.47 : 0.39;
    const height = lh * lines.length + 0.83;

    const parts = [
      outline(
        x, y,
        width, height,
        color, 0.67
      ),

      at(
        title,
        P ? 19 : 17,
        color,
        x,
        y + height / 2 - 0.30,
        false, width - 0.20
      )
    ];

    lines.forEach((s, i) => {
      const entry = Array.isArray(s)
        ? s
        : [s, INK];

      parts.push(
        at(
          entry[0],
          P ? 17 : 15,
          entry[1],
          x,
          y + height / 2 - 0.80 - i * lh,
          true, width - 0.20
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const posteriorM = firstEstimates[0].m;
  const posteriorV = firstEstimates[0].v;

  const updateSharedCard = updateCard(
    'Shared variance',
    [
      'Trait estimate: −2',
      'Squared: 4',
      ['Uncertainty: 1.33', VIOLET],
      [`4 + 1.33 ≈ ${fixed(HISTORY[1].q)}`, SHARED]
    ],
    CX - 1.68,
    P ? -1.02 : -0.45,
    SHARED
  );

  const updateNoiseCard = updateCard(
    'Separate noise',
    [
      'Tea A residuals',
      '−4 − (−2) = −2',
      '−2 − (−2) = 0',
      ['Mean squares + 1.33', VIOLET]
    ],
    CX + 1.68,
    P ? -1.02 : -0.45,
    NOISE
  );

  const uncertaintyTag = tagAt(
    'INCLUDE THE UNCERTAINTY',
    VIOLET,
    CX,
    P ? -3.32 : -2.24,
    P ? 18 : 16
  );

  await until(S(42));

  await play(
    ...scene(
      updateSharedCard,
      updateNoiseCard,
      uncertaintyTag
    ),
    ...fbox([
      ['Step 2: update the variances', VIOLET],
      'Shared: expected trait squares',
      'Noise: expected residual squares',
      'Include posterior uncertainty'
    ], VIOLET),
    ...say('UPDATE BOTH VARIANCES USING THE ESTIMATES', VIOLET)
  );

  // ------------------------------------------------------------
  // Restore the learning dashboard.
  //
  // Fresh objects are constructed because the earlier dashboard
  // was removed while explaining the E-step and M-step.
  // ------------------------------------------------------------

  function restoreDashboard(step) {
    const h = HISTORY[step];

    const tracks = [
      estimateTrack(0),
      estimateTrack(1)
    ];

    sharedFill = estimateFill(0, h.q);
    noiseFill = estimateFill(1, h.r);

    roundNow = iterationTag(step);
    lossNow = currentLossTag(step);

    const chart = lossAxes();

    lossPoints.length = 0;
    lossSegments.length = 0;

    for (let i = 0; i <= step; i++) {
      lossPoints.push(lossPoint(i));

      if (i > 0) {
        lossSegments.push(lossSegment(i));
      }
    }

    displayedStep = step;

    return scene(
      ...tracks,
      sharedFill,
      noiseFill,
      roundNow,
      chart,
      ...lossSegments,
      ...lossPoints,
      lossNow
    );
  }

  let changeNow = null;

  function changeTag(text, color) {
    const next = tagAt(
      text,
      color,
      EST_CENTER,
      P ? -3.93 : 1.39,
      P ? 15 : 13,
      BAR_W + 0.22
    );

    const a = [];

    if (
      changeNow &&
      picture.includes(changeNow)
    ) {
      a.push(...leave(changeNow));
    }

    changeNow = next;
    a.push(...enter(next));

    return a;
  }

  function clearChange() {
    if (
      !changeNow ||
      !picture.includes(changeNow)
    ) {
      changeNow = null;
      return [];
    }

    const old = changeNow;

    changeNow = null;

    return leave(old);
  }

  // ------------------------------------------------------------
  // 43: first update, shared variance rises to 5.33.
  //
  // The round and loss are not marked complete until the
  // separate noise estimate has also been updated.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...restoreDashboard(0),
    ...fbox([
      ['Round 1: updating', VIOLET],
      ['Shared: 4.00 → 5.33', SHARED],
      ['Change: +1.33', SHARED]
    ]),
    ...say('SHARED VARIANCE RISES TO 5.33')
  );

  await play(
    setShared(HISTORY[1].q, 0.9),
    ...changeTag(
      `SHARED ${signed(HISTORY[1].dq)}`,
      SHARED
    )
  );

  // ------------------------------------------------------------
  // 44: finish the first update.
  //
  // Separate noise falls to 3.33.
  // Loss falls to 2.864.
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    setNoise(HISTORY[1].r, 0.9),
    setRound(1, 0.7),
    ...plotLoss(1, 0.8),
    ...changeTag(
      `NOISE ${signed(HISTORY[1].dr)}`,
      NOISE
    ),
    ...fbox([
      ['Round 1 complete', GREEN],
      [`Shared = ${fixed(HISTORY[1].q)}`, SHARED],
      [`Noise  = ${fixed(HISTORY[1].r)}`, NOISE],
      [`Loss   = ${fixed(HISTORY[1].loss, 3)}`, LOSS]
    ], GREEN),
    ...say('NOISE FALLS TO 3.33; LOSS FALLS', GREEN)
  );

  // ------------------------------------------------------------
  // 45: second E-step and M-step.
  //
  // The estimates are recomputed from the first-round
  // variances, rather than reusing the original estimates.
  // ------------------------------------------------------------

  const step2 = HISTORY[2];

  await until(S(45));

  await play(
    ...clearChange(),
    ...fbox([
      ['Round 2: estimate again', VIOLET],
      `Tea A trait ≈ ${fixed(step2.estimates[0].m)}`,
      'Then update both variances'
    ], VIOLET),
    ...say('REPEAT BOTH LEARNING STEPS', VIOLET)
  );

  await play(
    setShared(step2.q, 0.9),
    setNoise(step2.r, 0.9),
    setRound(2, 0.6),
    ...fbox([
      ['Round 2 update', VIOLET],
      [`Shared = ${fixed(step2.q)}`, SHARED],
      [`Change ${signed(step2.dq)}`, SHARED],
      [`Noise = ${fixed(step2.r)}`, NOISE],
      [`Change ${signed(step2.dr)}`, NOISE]
    ], VIOLET)
  );

  // ------------------------------------------------------------
  // 46: second loss value.
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...plotLoss(2, 0.8),
    ...fbox([
      ['Round 2 complete', GREEN],
      [`Shared = ${fixed(step2.q)}`, SHARED],
      [`Noise  = ${fixed(step2.r)}`, NOISE],
      [`Loss   = ${fixed(step2.loss, 3)}`, LOSS]
    ], GREEN),
    ...say('LOSS FALLS AGAIN TO ABOUT 2.82', GREEN)
  );

  // ------------------------------------------------------------
  // 47: third E-step and M-step.
  // ------------------------------------------------------------

  const step3 = HISTORY[3];

  await until(S(47));

  await play(
    ...fbox([
      ['Round 3: estimate again', VIOLET],
      `Tea A trait ≈ ${fixed(step3.estimates[0].m)}`,
      'Update both variances'
    ], VIOLET),
    ...say('THIRD ROUND OF LEARNING', VIOLET)
  );

  await play(
    setShared(step3.q, 0.9),
    setNoise(step3.r, 0.9),
    setRound(3, 0.6),
    ...fbox([
      ['Round 3 update', VIOLET],
      [`Shared = ${fixed(step3.q)}`, SHARED],
      [`Change ${signed(step3.dq)}`, SHARED],
      [`Noise = ${fixed(step3.r)}`, NOISE],
      [`Change ${signed(step3.dr)}`, NOISE]
    ], VIOLET)
  );

  // ------------------------------------------------------------
  // 48: third loss, then accelerate the repeated updates.
  //
  // Every displayed point is calculated from an actual EM step.
  // The loss curve grows as the model improves.
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...plotLoss(3, 0.65),
    ...fbox([
      ['Round 3 complete', GREEN],
      [`Shared = ${fixed(step3.q)}`, SHARED],
      [`Noise  = ${fixed(step3.r)}`, NOISE],
      [`Loss   = ${fixed(step3.loss, 3)}`, LOSS]
    ], GREEN),
    ...say('LOSS ≈ 2.80; KEEP IMPROVING', GREEN)
  );

  for (let i = 4; i <= 8; i++) {
    await play(
      ...emUpdateAnimations(i, 0.32)
    );
  }

  // ------------------------------------------------------------
  // 49: the estimates approach 8 and 2.
  //
  // These are limits of the restricted model, not artificially
  // substituted final iteration values.
  // ------------------------------------------------------------

  const modelTargets = targetMarks();

  await until(S(49));

  await play(
    ...enter(modelTargets),
    ...fbox([
      ['Approaching the solution', GREEN],
      ['Shared variance → 8', SHARED],
      ['Separate noise → 2', NOISE],
      'The changes become smaller'
    ], GREEN),
    ...say('SHARED APPROACHES 8; NOISE APPROACHES 2', GREEN)
  );

  for (let i = 9; i <= MAX_ITER; i++) {
    await play(
      ...emUpdateAnimations(i, 0.32)
    );
  }

  const lastStep = HISTORY[MAX_ITER];

  await play(
    ...fbox([
      [`Round ${MAX_ITER}`, GREEN],
      [`Shared ≈ ${fixed(lastStep.q)}`, SHARED],
      [`Noise  ≈ ${fixed(lastStep.r)}`, NOISE],
      [`Loss   ≈ ${fixed(lastStep.loss, 3)}`, LOSS]
    ], GREEN)
  );

  // ------------------------------------------------------------
  // Expectation-maximization cycle.
  //
  // Two alternating steps:
  // E: estimate the hidden traits and their uncertainty.
  // M: update the model variances.
  // ------------------------------------------------------------

  function emCyclePicture() {
    const y = P ? -0.60 : -0.35;

    const xE = CX - 1.82;
    const xM = CX + 1.82;

    const w = P ? 2.80 : 2.76;
    const h = P ? 1.65 : 1.42;

    const eCard = new M.VGroup(
      outline(
        xE, y, w, h,
        VIOLET, 0.68
      ),

      at(
        'E-STEP',
        P ? 22 : 19,
        VIOLET,
        xE, y + 0.46,
        true
      ),

      at(
        'Estimate traits',
        P ? 19 : 17,
        INK,
        xE, y + 0.04,
        false, w - 0.24
      ),

      at(
        'and uncertainty',
        P ? 17 : 15,
        MUTED,
        xE, y - 0.39,
        false, w - 0.24
      )
    );

    const mCard = new M.VGroup(
      outline(
        xM, y, w, h,
        GREEN, 0.68
      ),

      at(
        'M-STEP',
        P ? 22 : 19,
        GREEN,
        xM, y + 0.46,
        true
      ),

      at(
        'Update model',
        P ? 19 : 17,
        INK,
        xM, y + 0.04,
        false, w - 0.24
      ),

      at(
        'variance estimates',
        P ? 17 : 15,
        MUTED,
        xM, y - 0.39,
        false, w - 0.24
      )
    );

    const topY = y + h / 2 + 0.61;
    const bottomY = y - h / 2 - 0.58;

    const forward = new M.VGroup(
      line(
        pos(xE, y + h / 2),
        pos(xE, topY),
        VIOLET, 2.5
      ),

      line(
        pos(xE, topY),
        pos(xM, topY),
        VIOLET, 2.5
      ),

      arrow(
        pos(xM, topY),
        pos(xM, y + h / 2),
        VIOLET, 2.5
      )
    );

    const backward = new M.VGroup(
      line(
        pos(xM, y - h / 2),
        pos(xM, bottomY),
        GREEN, 2.5
      ),

      line(
        pos(xM, bottomY),
        pos(xE, bottomY),
        GREEN, 2.5
      ),

      arrow(
        pos(xE, bottomY),
        pos(xE, y - h / 2),
        GREEN, 2.5
      )
    );

    const repeat = at(
      'Repeat until changes become small',
      P ? 17 : 15,
      GREEN,
      CX,
      P ? -3.26 : -2.22,
      false, MAIN_W - 0.30
    );

    return {
      eCard,
      mCard,
      forward,
      backward,
      repeat
    };
  }

  const cycle = emCyclePicture();

  // ------------------------------------------------------------
  // 50: name the algorithm.
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    ...scene(
      cycle.eCard,
      cycle.mCard,
      cycle.forward,
      cycle.backward,
      cycle.repeat
    ),
    ...fbox([
      ['Expectation-maximization', VIOLET],
      'E: estimate hidden quantities',
      'M: update model parameters',
      ['Repeat to improve the fit', GREEN]
    ], VIOLET),
    ...say('EXPECTATION-MAXIMIZATION', VIOLET)
  );

  await play(
    new M.Indicate(
      cycle.eCard,
      { color: VIOLET }
    ),
    new M.Indicate(
      cycle.forward,
      { color: VIOLET }
    )
  );

  await play(
    new M.Indicate(
      cycle.mCard,
      { color: GREEN }
    ),
    new M.Indicate(
      cycle.backward,
      { color: GREEN }
    )
  );

  // ------------------------------------------------------------
  // 51: one short variance formula.
  //
  // Total variance = shared variance + separate noise variance
  //
  // This holds under the assumptions of our restricted model.
  // ------------------------------------------------------------

  const formulaVariance = splitVariancePicture();

  const formulaTag = tagAt(
    '10 = 8 + 2',
    GREEN,
    CX,
    P ? -3.55 : -2.29,
    P ? 24 : 20
  );

  await until(S(51));

  await play(
    ...scene(
      formulaVariance.group,
      formulaTag
    ),
    ...fbox([
      ['Total variance', INK],
      ['= shared variance', SHARED],
      ['  + separate noise variance', NOISE],
      ['10 = 8 + 2', GREEN]
    ], GREEN),
    ...say('TOTAL VARIANCE = SHARED + SEPARATE', GREEN)
  );

  // ------------------------------------------------------------
  // 52: general use of factor analysis.
  //
  // A conceptual many-attribute model.
  // No fitted twelve-attribute results are claimed.
  // ------------------------------------------------------------

  function generalFactorPicture() {
    const parts = [];

    const hiddenY = P ? 0.82 : 0.84;
    const observedY = P ? -1.82 : -1.22;

    const factorXs = [
      CX - 1.55,
      CX + 1.55
    ];

    const observedXs = Array.from(
      { length: 6 },
      (_, i) =>
        CX + (i - 2.5) * 1.04
    );

    const factorColors = [
      CYAN, AMBER
    ];

    for (let j = 0; j < 6; j++) {
      const k = j < 3 ? 0 : 1;
      const color = factorColors[k];

      parts.push(
        arrow(
          pos(
            factorXs[k],
            hiddenY - 0.40
          ),
          pos(
            observedXs[j],
            observedY + 0.43
          ),
          color, 2.1, 0.13
        )
      );

      const noiseY =
        observedY - (P ? 1.13 : 0.92);

      parts.push(
        glowDot(
          pos(observedXs[j], noiseY),
          NOISE, 0.065
        ),

        arrow(
          pos(observedXs[j], noiseY + 0.09),
          pos(observedXs[j], observedY - 0.43),
          NOISE, 1.7, 0.11
        )
      );
    }

    for (let k = 0; k < 2; k++) {
      parts.push(
        hiddenControl(
          `Hidden trait ${k + 1}`,
          'Illustrative',
          factorXs[k],
          hiddenY,
          factorColors[k],
          2.44
        )
      );
    }

    const names = [
      'Floral', 'Rose', 'Fruit',
      'Roast', 'Nut', 'Smoke'
    ];

    for (let j = 0; j < 6; j++) {
      const x = observedXs[j];

      parts.push(
        outline(
          x, observedY,
          0.91,
          P ? 0.81 : 0.70,
          j < 3 ? CYAN : AMBER,
          0.75
        ),

        at(
          names[j],
          P ? 15 : 12,
          j < 3 ? CYAN : AMBER,
          x, observedY,
          false, 0.82
        )
      );
    }

    parts.push(
      at(
        'Separate variation for each attribute',
        P ? 17 : 15,
        NOISE,
        CX,
        P ? -3.48 : -2.38,
        false, MAIN_W - 0.3
      )
    );

    if (P) {
      parts.push(
        at(
          'Illustration, not a fitted tea model',
          15, MUTED,
          CX, -4.16,
          false, MAIN_W - 0.3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const generalModel = generalFactorPicture();

  await until(S(52));

  await play(
    ...scene(generalModel),
    ...fbox([
      ['Many observed attributes', INK],
      'A few possible hidden traits',
      'Plus separate variation',
      ['Illustrative model', MUTED]
    ], GREEN),
    ...say('MANY ATTRIBUTES, A FEW HIDDEN TRAITS', GREEN)
  );

  // ------------------------------------------------------------
  // 53: a good fit does not prove a hidden trait exists.
  //
  // Distinguish the observed relationship from a proposed
  // explanation of that relationship.
  // ------------------------------------------------------------

  function evidencePicture() {
    const parts = [];

    const xL = CX - 1.70;
    const xR = CX + 1.70;

    const y = P ? -0.57 : -0.42;

    const w = P ? 3.03 : 2.98;
    const h = P ? 3.55 : 2.74;

    parts.push(
      outline(
        xL, y, w, h,
        GREEN, 0.52
      ),

      outline(
        xR, y, w, h,
        VIOLET, 0.40
      ),

      at(
        'OBSERVED',
        P ? 19 : 17,
        GREEN,
        xL, y + h / 2 - 0.29,
        true
      ),

      at(
        'PROPOSED MODEL',
        P ? 17 : 15,
        VIOLET,
        xR, y + h / 2 - 0.29,
        false, w - 0.20
      )
    );

    // Small factual scatterplot on the left.

    const side = P ? 1.84 : 1.48;
    const origin = pos(
      xL - side / 2,
      y - side / 2 + 0.02
    );

    const ep = (a, b) =>
      pos(
        origin[0] + a * side / 10,
        origin[1] + b * side / 10
      );

    parts.push(
      line(ep(0, 0), ep(10, 0), MUTED, 1.5),
      line(ep(0, 0), ep(0, 10), MUTED, 1.5)
    );

    for (const pair of COINCIDENT) {
      const p = ep(pair.x, pair.y);

      parts.push(
        glowDot(p, CYAN, 0.05),

        at(
          pair.names.join(''),
          P ? 15 : 10,
          INK,
          p[0] + (
            pair.x > 8 ? -0.15 : 0.15
          ),
          p[1] + 0.13,
          true
        )
      );
    }

    parts.push(
      at(
        'Scores change together',
        P ? 16 : 14,
        GREEN,
        xL, y - h / 2 + 0.27,
        false, w - 0.20
      )
    );

    // Proposed unobserved trait on the right.

    const r = P ? 0.37 : 0.30;

    const hidden = new M.Circle({
      radius: r,
      color: VIOLET,
      strokeWidth: 2
    });

    hidden.setFill(VIOLET, 0.14);

    hidden.moveTo(pos(
      xR, y + 0.35
    ));

    parts.push(
      hidden,

      at(
        '?',
        P ? 30 : 25,
        VIOLET,
        xR, y + 0.35,
        true
      )
    );

    const bottomY = y -
      (P ? 0.65 : 0.53);

    for (let j = 0; j < 2; j++) {
      const x = xR +
        (j - 0.5) * 1.17;

      parts.push(
        arrow(
          pos(xR, y + 0.35 - r),
          pos(x, bottomY + 0.20),
          VIOLET, 2, 0.12
        ),

        outline(
          x, bottomY,
          1.05, 0.40,
          CYAN, 0.58
        ),

        at(
          j === 0 ? 'Floral' : 'Jasmine',
          P ? 15 : 12,
          CYAN,
          x, bottomY,
          false, 0.96
        )
      );
    }

    parts.push(
      at(
        'Possible explanation',
        P ? 16 : 14,
        VIOLET,
        xR, y - h / 2 + 0.27,
        false, w - 0.20
      )
    );

    const note = tagAt(
      'GOOD FIT ≠ PROOF OF A HIDDEN TRAIT',
      AMBER,
      CX,
      P ? -3.32 : -2.28,
      P ? 17 : 14
    );

    parts.push(note);

    return new M.VGroup(...parts);
  }

  const evidence = evidencePicture();

  await until(S(53));

  await play(
    ...scene(evidence),
    ...fbox([
      ['A model can fit well', GREEN],
      'Without proving that its',
      'hidden traits really exist',
      ['An explanation, not proof', AMBER]
    ], AMBER),
    ...say('A GOOD FIT DOES NOT PROVE THE TRAIT EXISTS', AMBER)
  );

  // ------------------------------------------------------------
  // 54: final summary.
  //
  // One shared factor and two attribute-specific noise terms.
  // Shared variance 8, separate noise variance 2 per attribute.
  //
  // These values explain the observed covariance under the
  // assumptions of this particular two-attribute model.
  // ------------------------------------------------------------

  function summaryPicture() {
    const parts = [];

    const sharedY = P ? 0.82 : 0.91;
    const rowY = P ? -1.40 : -0.79;

    const sharedCard = new M.VGroup(
      outline(
        CX, sharedY,
        P ? 3.48 : 3.24,
        P ? 0.93 : 0.76,
        SHARED, 0.72
      ),

      at(
        'Hidden shared trait',
        P ? 21 : 18,
        SHARED,
        CX, sharedY + 0.16,
        false, 3.0
      ),

      at(
        'Variance = 8',
        P ? 19 : 16,
        INK,
        CX, sharedY - 0.19,
        true
      )
    );

    parts.push(sharedCard);

    const centers = [
      CX - 1.69,
      CX + 1.69
    ];

    for (let k = 0; k < 2; k++) {
      const x = centers[k];

      parts.push(
        arrow(
          pos(
            CX + (k === 0 ? -0.55 : 0.55),
            sharedY - (P ? 0.49 : 0.40)
          ),
          pos(x, rowY + 0.58),
          SHARED, 3
        )
      );

      const cardW = P ? 3.05 : 3.03;
      const cardH = P ? 1.22 : 1.02;

      parts.push(
        outline(
          x, rowY,
          cardW, cardH,
          CYAN, 0.70
        ),

        at(
          `${k === 0 ? 'Floral' : 'Jasmine'} variance = 10`,
          P ? 17 : 15,
          CYAN,
          x, rowY + 0.30,
          false, cardW - 0.20
        )
      );

      const step = cardW * 0.085;
      const bw = step * 0.88;
      const y = rowY - 0.17;

      for (let j = 0; j < 10; j++) {
        parts.push(
          rect(
            x + (j - 4.5) * step,
            y,
            bw,
            P ? 0.29 : 0.25,
            j < 8 ? SHARED : NOISE,
            0.86, 1
          )
        );
      }

      const noiseY =
        rowY - (P ? 1.25 : 0.91);

      parts.push(
        at(
          'Separate noise = 2',
          P ? 16 : 14,
          NOISE,
          x, noiseY,
          true, cardW
        )
      );
    }

    parts.push(
      tagAt(
        'SHARED CHANGE + SEPARATE VARIATION',
        GREEN,
        CX,
        P ? -3.86 : -2.40,
        P ? 17 : 14
      )
    );

    return new M.VGroup(...parts);
  }

  const finalPicture = summaryPicture();

  await until(S(54));

  await play(
    ...scene(finalPicture),
    ...fbox([
      ['Factor analysis', GREEN],
      ['Hidden traits explain sharing', SHARED],
      ['Noise allows separate change', NOISE],
      'A model, not proof of a cause'
    ], GREEN),
    ...say('HIDDEN SHARED TRAITS AND SEPARATE VARIATION', GREEN)
  );

  // Leave the final picture visible until narration ends.

  await until(E(54));

  // Integration notes:
  // All 55 narration beats are included.
  // All observed scores match the fixed chapter data.
  // Variances and covariance use division by N = 8.
  // The EM updates and loss values are calculated directly
  // from the restricted Gaussian factor model.
  // Posterior uncertainty is included in both variance updates.
  // This demonstration is fitted only to Floral and Jasmine,
  // not to all twelve attributes.
  //
  // Loss values exclude the Gaussian constant term, matching
  // the shared chapter data and narration.
  //
  // Actual browser playback, seek behavior, animation timing,
  // text metrics and phone/laptop rendering still require
  // verification inside the supplied live lesson engine.
}

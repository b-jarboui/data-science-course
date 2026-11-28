// lesson 14.3.2
// Explained variance: keeping the biggest patterns
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Fixed chapter 14.3 teaching data.
// Population variance, covariance-based PCA, unit-length directions.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data: identical to lesson 14.3.1.
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

  const mean = a =>
    a.reduce((s, v) => s + v, 0) / a.length;

  const sum = a =>
    a.reduce((s, v) => s + v, 0);

  const dot = (a, b) =>
    a.reduce((s, v, j) => s + v * b[j], 0);

  const MEANS = ATTRS.map((_, j) =>
    mean(D.map(row => row[j]))
  );

  const Z = D.map(row =>
    row.map((v, j) => v - MEANS[j])
  );

  // Unit-length principal directions.

  const U1 = ATTRS.map((_, j) =>
    j < 6 ? 1 / Math.sqrt(6) : 0
  );

  const U2 = ATTRS.map((_, j) =>
    j >= 6 ? 1 / Math.sqrt(6) : 0
  );

  const U3 = ATTRS.map((_, j) =>
    j === 0 ? 1 / Math.sqrt(2) :
    j === 1 ? -1 / Math.sqrt(2) : 0
  );

  const SCORES = Z.map(row => [
    dot(row, U1),
    dot(row, U2),
    dot(row, U3)
  ]);

  // Exact population variances: 54, 24, 2.

  const VARS = [0, 1, 2].map(j =>
    Math.round(mean(SCORES.map(row => row[j] ** 2)))
  );

  const TOTAL = sum(VARS);

  const RATIOS = VARS.map(v => v / TOTAL);
  const PCTS = RATIOS.map(v => v * 100);

  const KEEP1 = PCTS[0];                 // 67.5
  const KEEP2 = PCTS[0] + PCTS[1];       // 97.5
  const KEEP3 = sum(PCTS);               // 100

  const TARGET = 95;

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

  const PC_COLORS = [CYAN, AMBER, PINK];

  const ac = j => j < 6 ? CYAN : AMBER;

  const number = v =>
    v < 0 ? `−${Math.abs(v)}` : String(v);

  const signed = v =>
    v < 0 ? `−${Math.abs(v)}` :
    v > 0 ? `+${v}` : '0';

  const fmt = v =>
    Number(v.toFixed(4)).toString();

  const pct = v => `${fmt(v)}%`;

  const scoreText = v =>
    v.toFixed(2).replace('-', '−');

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone:  8 × 14.22; content y = −5.5 ... 4.3
  // Laptop: 14.22 × 8; content y = −3.0 ... 2.3
  //
  // Match lesson 14.3.1 and the approved arithmetic-mean scene.
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

  const say = (s, c = CYAN) => showA(s, c, PILL);

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
    x, y, w, h, color = CYAN, opacity = 0
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(0.13, w / 5, h / 5),
      color,
      strokeWidth: 2
    });

    r.setFill(CARD, opacity);
    r.moveTo(pos(x, y));

    return r;
  }

  function glowingBar(
    x, base, v, scale, width, color
  ) {
    const h = Math.max(Math.abs(v) * scale, 0.022);
    const y = base + (v < 0 ? -h / 2 : h / 2);

    const halo = rect(
      x, y,
      width + 0.045,
      h + 0.025,
      color, 0.12, 0
    );

    const bar = rect(
      x, y,
      width, h,
      color, v === 0 ? 0.22 : 0.84, 1
    );

    return new M.VGroup(halo, bar);
  }

  function glowDot(p, color = CYAN, radius = 0.09) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.2,
      color
    });

    halo.setFill(color, 0.17);

    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function arrow(
    a, b, color = CYAN,
    width = 3, head = 0.18
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

  function doubleArrow(a, b, color = CYAN, width = 3) {
    return new M.VGroup(
      arrow(a, b, color, width),
      arrow(b, a, color, width)
    );
  }

  // ------------------------------------------------------------
  // Formula box.
  //
  // Only one formula box is visible at a time.
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
      T('0000000000', size, INK, true).getWidth() / 10;

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
  // Main-picture management.
  //
  // Never regroup objects that are already visible.
  // Each object remains independently removable.
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
    picture = picture.filter(o => !objects.includes(o));

    return objects.map(o => new M.FadeOut(o));
  }

  function enterLagged(objects, lagRatio = 0.08, runTime = 1.2) {
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
  //
  // Every tea's letter remains visible throughout the lesson,
  // including during the variance calculations.
  // ------------------------------------------------------------

  const roster = new M.VGroup(
    ...TEAS.map((name, i) => {
      const x = CX + (i - 3.5) * (P ? 0.78 : 0.76);

      const r = outline(
        x, ROSTER_Y,
        0.48, 0.30,
        MUTED, 0.35
      );

      const t = at(
        name, P ? 15 : 14,
        INK, x, ROSTER_Y, true
      );

      return new M.VGroup(r, t);
    })
  );

  // ------------------------------------------------------------
  // Intro: a small tea guide with eight tea cards.
  // ------------------------------------------------------------

  function teaCard(i, x, y) {
    const w = P ? 1.72 : 1.42;
    const h = P ? 2.15 : 1.28;

    const parts = [
      outline(x, y, w, h, MUTED, 0.80),

      at(
        `Tea ${TEAS[i]}`,
        P ? 17 : 15,
        INK,
        x, y + h / 2 - 0.25
      )
    ];

    const base = y - h / 2 + 0.23;

    const spacing = w * 0.075;
    const scale = P ? 0.125 : 0.051;

    for (let j = 0; j < 12; j++) {
      parts.push(
        glowingBar(
          x + (j - 5.5) * spacing,
          base,
          D[i][j],
          scale,
          spacing * 0.65,
          ac(j)
        )
      );
    }

    parts.push(
      line(
        pos(x - w * 0.44, base),
        pos(x + w * 0.44, base),
        MUTED, 1
      )
    );

    return new M.VGroup(...parts);
  }

  function guidePicture() {
    const parts = [];

    const pitchX = P ? 1.84 : 1.61;
    const pitchY = P ? 2.5 : 1.49;

    const top = P ? -0.15 : 0.30;

    for (let i = 0; i < 8; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);

      parts.push(
        teaCard(
          i,
          CX + (col - 1.5) * pitchX,
          top - row * pitchY
        )
      );
    }

    parts.push(
      at(
        'TEA TASTING GUIDE',
        P ? 21 : 18,
        INK,
        CX, P ? 1.43 : 1.30,
        false, MAIN_W - 0.5
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // A single tasting profile: twelve glowing bars.
  // ------------------------------------------------------------

  const PROFILE_SP = P ? 0.535 : 0.54;

  const px = j =>
    CX + (j - 5.5) * PROFILE_SP;

  function profile(i) {
    const base = P ? -2.55 : -1.62;
    const scale = P ? 0.32 : 0.24;

    const parts = [
      at(
        `Tea ${TEAS[i]}`,
        21, INK,
        CX, P ? 1.25 : 1.13
      )
    ];

    for (const level of [0, 5, 10]) {
      const y = base + scale * level;

      parts.push(
        line(
          pos(px(0) - 0.32, y),
          pos(px(11) + 0.32, y),
          level === 0 ? MUTED : CARD,
          level === 0 ? 2 : 1
        )
      );

      parts.push(
        at(
          level, P ? 15 : 13, MUTED,
          px(0) - 0.48, y, true
        )
      );
    }

    D[i].forEach((v, j) => {
      parts.push(
        glowingBar(
          px(j), base, v,
          scale, 0.32, ac(j)
        )
      );

      parts.push(
        at(
          v, 17, ac(j),
          px(j), base + v * scale + 0.22,
          true
        )
      );

      parts.push(
        at(
          SHORT[j], 12, ac(j),
          px(j), base - 0.36,
          false, 0.48
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Eight teas × twelve original scores.
  // ------------------------------------------------------------

  const TABLE_SP = P ? 0.525 : 0.53;
  const TABLE_TOP = P ? 0.95 : 0.83;
  const ROW_PITCH = P ? 0.58 : 0.36;

  const tx = j =>
    CX + 0.24 + (j - 5.5) * TABLE_SP;

  const ty = i =>
    TABLE_TOP - i * ROW_PITCH;

  const TABLE_LABEL_X = tx(0) - 0.56;
  const HEADER_Y = TABLE_TOP + (P ? 0.59 : 0.45);

  function scoreTable() {
    const parts = [];

    for (let j = 0; j < 12; j++) {
      parts.push(
        at(
          SHORT[j], P ? 15 : 12,
          ac(j), tx(j), HEADER_Y,
          false, TABLE_SP * 0.93
        )
      );
    }

    for (let i = 0; i < 8; i++) {
      parts.push(
        at(
          TEAS[i], P ? 19 : 16,
          INK, TABLE_LABEL_X, ty(i),
          true
        )
      );

      for (let j = 0; j < 12; j++) {
        const v = D[i][j];
        const x = tx(j);
        const y = ty(i);

        const color = ac(j);

        parts.push(
          rect(
            x, y,
            TABLE_SP * 0.91,
            ROW_PITCH * 0.82,
            CARD, 0.55, 0
          )
        );

        parts.push(
          glowingBar(
            x - 0.135,
            y - (P ? 0.16 : 0.115),
            v,
            P ? 0.029 : 0.019,
            0.105,
            color
          )
        );

        parts.push(
          at(
            v, P ? 15 : 13,
            color, x + 0.09, y,
            true, 0.26
          )
        );
      }
    }

    const split = (tx(5) + tx(6)) / 2;

    parts.push(
      line(
        pos(split, HEADER_Y + 0.17),
        pos(split, ty(7) - ROW_PITCH * 0.44),
        MUTED, 1.5
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 0–4: too many numbers for a small guide.
  // ------------------------------------------------------------

  const guide = guidePicture();

  await until(S(0));

  await play(
    ...scene(guide),
    new M.FadeIn(roster),
    ...say('A SMALL GUIDE TO EIGHT TEAS')
  );

  const firstProfile = profile(0);

  await until(S(1));

  await play(
    ...scene(firstProfile),
    ...fbox([
      ['Tea A', INK],
      ['12 tasting scores', CYAN],
      'One for each attribute'
    ]),
    ...say('12 NUMBERS FOR EACH TEA')
  );

  const rawTable = scoreTable();

  await until(S(2));

  await play(
    ...scene(rawTable),
    ...fbox([
      ['8 teas × 12 scores', INK],
      ['= 96 numbers', AMBER],
      'A crowded little guide'
    ], AMBER),
    ...say('96 NUMBERS TO COMPARE', AMBER)
  );

  await until(S(3));

  await play(
    ...fbox([
      ['Could we use fewer?', GREEN],
      'Keep the big differences',
      'Lose as little as possible'
    ], GREEN),
    ...say('FEWER NUMBERS, LITTLE INFORMATION LOST', GREEN)
  );

  await until(S(4));

  await play(
    ...clearBox(),
    new M.Indicate(rawTable, { color: CYAN }),
    ...say('OUR ORIGINAL EIGHT TEAS')
  );

  // ------------------------------------------------------------
  // The three separate shared patterns.
  //
  // Display a representative signed change in each direction.
  // Every tea can have that change or its opposite.
  // These are pattern contributions, not complete tea profiles.
  // ------------------------------------------------------------

  const PATTERNS = [
    [3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2],
    [1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  const PATTERN_NAMES = [
    'First six change together',
    'Last six change together',
    'Floral and Jasmine differ'
  ];

  const PATTERN_BASE = P
    ? [0.55, -1.12, -2.81]
    : [0.75, -0.48, -1.71];

  function patternRow(k) {
    const values = PATTERNS[k];
    const color = PC_COLORS[k];
    const base = PATTERN_BASE[k];

    const scale = P ? 0.15 : 0.10;
    const parts = [];

    parts.push(
      at(
        PATTERN_NAMES[k],
        P ? 18 : 16,
        color,
        CX, base + (P ? 0.68 : 0.48),
        false, MAIN_W - 0.5
      )
    );

    parts.push(
      line(
        pos(px(0) - 0.32, base),
        pos(px(11) + 0.32, base),
        MUTED, 1.5
      )
    );

    for (let j = 0; j < 12; j++) {
      const v = values[j];
      const col = v === 0 ? MUTED : color;

      parts.push(
        glowingBar(
          px(j), base, v,
          scale, P ? 0.30 : 0.29,
          col
        )
      );

      parts.push(
        at(
          signed(v),
          P ? 15 : 12,
          col, px(j),
          base - (P ? 0.39 : 0.28),
          true, 0.47
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function patternOutline(k) {
    return outline(
      CX,
      PATTERN_BASE[k] + (P ? 0.13 : 0.09),
      6.72,
      P ? 1.36 : 1.08,
      PC_COLORS[k]
    );
  }

  function componentTag(k) {
    const tag = pill(
      `PC${k + 1}`,
      PC_COLORS[k],
      P ? 15 : 13
    );

    tag.moveTo(pos(
      CX - 2.77,
      PATTERN_BASE[k] + (P ? 0.68 : 0.48)
    ));

    return tag;
  }

  const patternRows = [0, 1, 2].map(patternRow);

  const patternHeaders = new M.VGroup(
    ...SHORT.map((s, j) =>
      at(
        s, P ? 15 : 11,
        ac(j), px(j),
        P ? -3.62 : -2.39,
        false, 0.48
      )
    )
  );

  // ------------------------------------------------------------
  // 5–9: recap the three principal components.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...scene(...patternRows, patternHeaders),
    ...fbox([
      ['Three patterns of change', GREEN],
      ['First shared pattern', CYAN],
      ['Second shared pattern', AMBER],
      ['Small remaining pattern', PINK]
    ], GREEN),
    ...say('THREE SEPARATE PATTERNS', GREEN)
  );

  await until(S(6));

  await play(
    ...focus(patternOutline(0)),
    ...fbox([
      ['First pattern', CYAN],
      'First six attributes',
      'All rise or fall together',
      ['+3 each, or −3 each', CYAN]
    ]),
    ...say('FIRST SIX RISE AND FALL TOGETHER')
  );

  await until(S(7));

  await play(
    ...focus(patternOutline(1)),
    ...fbox([
      ['Second pattern', AMBER],
      'Last six attributes',
      'All rise or fall together',
      ['+2 each, or −2 each', AMBER]
    ], AMBER),
    ...say('LAST SIX RISE AND FALL TOGETHER', AMBER)
  );

  await until(S(8));

  await play(
    ...focus(patternOutline(2)),
    ...fbox([
      ['Third pattern', PINK],
      'Floral +1, Jasmine −1',
      'Or the opposite',
      ['A small separate change', PINK]
    ], PINK),
    ...say('THE FLORAL–JASMINE DIFFERENCE', PINK)
  );

  const componentTags = [0, 1, 2].map(componentTag);

  await until(S(9));

  await play(
    ...clearFocus(),
    ...enter(...componentTags),
    ...fbox([
      ['Principal components', GREEN],
      'Separate directions',
      'of change in the data'
    ], GREEN),
    ...say('PRINCIPAL COMPONENTS', GREEN)
  );

  // ------------------------------------------------------------
  // Three proportional variance bars.
  //
  // All three use the same scale.
  // Reveal the values in narration order.
  // ------------------------------------------------------------

  const VAR_W = P ? 5.45 : 5.20;
  const VAR_LEFT = CX - VAR_W / 2 - 0.12;

  const VY = P
    ? [0.25, -1.38, -3.01]
    : [0.55, -0.65, -1.85];

  function varianceTrack(k) {
    const color = PC_COLORS[k];
    const y = VY[k];

    return new M.VGroup(
      at(
        `PC${k + 1}`,
        P ? 18 : 16,
        color,
        VAR_LEFT + 0.31,
        y + 0.45,
        true
      ),

      at(
        PATTERN_NAMES[k],
        P ? 16 : 14,
        MUTED,
        CX + 0.33,
        y + 0.45,
        false, 4.65
      ),

      rect(
        VAR_LEFT + VAR_W / 2,
        y,
        VAR_W,
        P ? 0.39 : 0.30,
        CARD, 0.75, 0
      )
    );
  }

  function varianceFill(k) {
    const color = PC_COLORS[k];
    const y = VY[k];

    const w = VAR_W * VARS[k] / VARS[0];
    const h = P ? 0.39 : 0.30;

    return new M.VGroup(
      rect(
        VAR_LEFT + w / 2,
        y, w + 0.035, h + 0.085,
        color, 0.14, 0
      ),

      rect(
        VAR_LEFT + w / 2,
        y, w, h,
        color, 0.89, 1
      ),

      at(
        VARS[k], P ? 25 : 22,
        color,
        VAR_LEFT + VAR_W + 0.42,
        y, true
      )
    );
  }

  const varianceTracks = [0, 1, 2].map(varianceTrack);
  const varianceFills = [0, 1, 2].map(varianceFill);

  // ------------------------------------------------------------
  // 10–13: the three variances.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...scene(...varianceTracks),
    ...fbox([
      ['Variance', VIOLET],
      'How much the positions',
      'spread along a direction',
      'Mean squared distance'
    ], VIOLET),
    ...say('VARIANCE MEASURES SPREAD', VIOLET)
  );

  await until(S(11));

  await play(
    ...enter(varianceFills[0]),
    ...fbox([
      ['PC1', CYAN],
      'First six change together',
      ['Variance = 54', CYAN]
    ]),
    ...say('PC1: VARIANCE 54')
  );

  await until(S(12));

  await play(
    ...enter(varianceFills[1]),
    ...fbox([
      ['PC1 = 54', CYAN],
      ['PC2 = 24', AMBER]
    ], AMBER),
    ...say('PC2: VARIANCE 24', AMBER)
  );

  await until(S(13));

  await play(
    ...enter(varianceFills[2]),
    ...fbox([
      ['PC1 = 54', CYAN],
      ['PC2 = 24', AMBER],
      ['PC3 = 2', PINK]
    ], PINK),
    ...say('PC3: VARIANCE 2', PINK)
  );

  // ------------------------------------------------------------
  // One glowing block per unit of variance.
  //
  // Initially:
  //   PC1 = 9 × 6 grid of cyan blocks
  //   PC2 = 6 × 4 grid of amber blocks
  //   PC3 = 2 × 1 grid of pink blocks
  //
  // Then all eighty actual block objects move into one bar.
  // ------------------------------------------------------------

  const GROUP_CX = P
    ? [CX - 1.96, CX + 0.76, CX + 2.83]
    : [CX - 1.88, CX + 0.76, CX + 2.72];

  const GRID_COLS = [9, 6, 2];
  const GRID_ROWS = [6, 4, 1];

  const GRID_STEP = P ? 0.30 : 0.25;
  const GRID_SIZE = GRID_STEP * 0.85;

  const GRID_BASE = P ? -3.3 : -1.40;

  function block(x, y, w, h, color, active = true) {
    const halo = rect(
      x, y,
      w + 0.015,
      h + 0.022,
      color,
      active ? 0.15 : 0.025,
      0
    );

    const b = rect(
      x, y,
      w, h,
      color,
      active ? 0.89 : 0.13,
      1
    );

    return new M.VGroup(halo, b);
  }

  function groupSlot(k, i) {
    const col = i % GRID_COLS[k];
    const row = Math.floor(i / GRID_COLS[k]);

    return pos(
      GROUP_CX[k] +
      (col - (GRID_COLS[k] - 1) / 2) * GRID_STEP,

      GRID_BASE + (row + 0.5) * GRID_STEP
    );
  }

  const groups = VARS.map((v, k) =>
    Array.from({ length: v }, (_, i) => {
      const p = groupSlot(k, i);

      return block(
        p[0], p[1],
        GRID_SIZE, GRID_SIZE,
        PC_COLORS[k]
      );
    })
  );

  function blockGroupTitle(k) {
    const color = PC_COLORS[k];

    return new M.VGroup(
      at(
        `PC${k + 1}`,
        P ? 20 : 18,
        color,
        GROUP_CX[k],
        GRID_BASE + 6 * GRID_STEP + 0.65,
        true
      ),

      at(
        `${VARS[k]} units`,
        P ? 18 : 16,
        color,
        GROUP_CX[k],
        GRID_BASE - 0.35,
        false, 2.25
      )
    );
  }

  const gridTitles = [0, 1, 2].map(blockGroupTitle);

  const gridFloor = line(
    pos(CX - 3.27, GRID_BASE),
    pos(CX + 3.27, GRID_BASE),
    MUTED, 1.5
  );

  const blockKey = new M.VGroup(
    block(
      CX - 1.10,
      P ? 1.25 : 1.04,
      0.25, 0.25,
      GREEN
    ),

    at(
      '1 block = 1 unit of variance',
      P ? 17 : 16,
      GREEN,
      CX + 0.25,
      P ? 1.25 : 1.04,
      false, 3.0
    )
  );

  // ------------------------------------------------------------
  // 14: introduce the variance blocks.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...scene(gridFloor, blockKey),
    ...fbox([
      ['One glowing block', GREEN],
      '= one unit of variance'
    ], GREEN),
    ...say('1 BLOCK = 1 UNIT OF VARIANCE', GREEN)
  );

  // ------------------------------------------------------------
  // 15–17: build the three groups.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...enter(gridTitles[0]),
    ...enterLagged(groups[0], 0.035, 1.7),
    ...fbox([
      ['PC1', CYAN],
      ['54 cyan blocks', CYAN]
    ]),
    ...say('54 CYAN BLOCKS')
  );

  await until(S(16));

  await play(
    ...enter(gridTitles[1]),
    ...enterLagged(groups[1], 0.055, 1.3),
    ...fbox([
      ['PC1: 54 blocks', CYAN],
      ['PC2: 24 blocks', AMBER]
    ], AMBER),
    ...say('24 AMBER BLOCKS', AMBER)
  );

  await until(S(17));

  await play(
    ...enter(gridTitles[2]),
    ...enterLagged(groups[2], 0.18, 0.75),
    ...fbox([
      ['PC1: 54 blocks', CYAN],
      ['PC2: 24 blocks', AMBER],
      ['PC3: 2 blocks', PINK]
    ], PINK),
    ...say('2 PINK BLOCKS', PINK)
  );

  // ------------------------------------------------------------
  // Join the same blocks into one proportional total-variance bar.
  //
  // Exactly eighty equal-width units.
  // No segment width is rounded or visually exaggerated.
  // ------------------------------------------------------------

  const BAR_W = P ? 6.62 : 6.52;
  const BAR_LEFT = CX - BAR_W / 2;

  const BAR_Y = P ? -2.35 : -0.42;
  const BAR_H = P ? 0.83 : 0.64;

  const UNIT_W = BAR_W / TOTAL;

  const ALL = groups.flat();

  const STARTS = [
    0,
    VARS[0],
    VARS[0] + VARS[1]
  ];

  const BOUNDARIES = [
    0,
    VARS[0],
    VARS[0] + VARS[1],
    TOTAL
  ];

  const bx = units =>
    BAR_LEFT + units * UNIT_W;

  const unitX = i =>
    bx(i + 0.5);

  function unitColor(i) {
    return i < VARS[0] ? CYAN :
      i < VARS[0] + VARS[1] ? AMBER :
      PINK;
  }

  function barUnit(i, active = true) {
    return block(
      unitX(i),
      BAR_Y,
      UNIT_W * 0.88,
      BAR_H,
      unitColor(i),
      active
    );
  }

  function barBackdrop() {
    return outline(
      CX, BAR_Y,
      BAR_W + 0.08,
      BAR_H + 0.09,
      MUTED, 0
    );
  }

  function bracket(a, b, y, label, color = INK) {
    const left = bx(a);
    const right = bx(b);

    const tick = 0.10;

    return new M.VGroup(
      line(
        pos(left, y),
        pos(right, y),
        color, 1.8
      ),

      line(
        pos(left, y - tick),
        pos(left, y + tick),
        color, 1.8
      ),

      line(
        pos(right, y - tick),
        pos(right, y + tick),
        color, 1.8
      ),

      at(
        label, P ? 19 : 17,
        color,
        (left + right) / 2,
        y + 0.29,
        false, MAIN_W - 0.45
      )
    );
  }

  function segmentLabel(k, text) {
    const color = PC_COLORS[k];

    const a = BOUNDARIES[k];
    const b = BOUNDARIES[k + 1];

    const center = bx((a + b) / 2);
    const bottom = BAR_Y - BAR_H / 2;

    if (k < 2) {
      return new M.VGroup(
        line(
          pos(center, bottom - 0.04),
          pos(center, bottom - 0.18),
          color, 1.5
        ),

        at(
          text, P ? 18 : 16,
          color,
          center, bottom - 0.40,
          true,
          (b - a) * UNIT_W - 0.12
        )
      );
    }

    // PC3 occupies exactly 2/80 of the bar.
    // Its label is offset rather than widening its segment.

    const labelX = bx(TOTAL) - 0.54;
    const labelY = bottom - 0.97;

    return new M.VGroup(
      line(
        pos(center, bottom - 0.04),
        pos(center, bottom - 0.72),
        PINK, 1.5
      ),

      line(
        pos(center, bottom - 0.72),
        pos(labelX, bottom - 0.72),
        PINK, 1.5
      ),

      at(
        text, P ? 18 : 16,
        PINK,
        labelX, labelY,
        true, 1.35
      )
    );
  }

  let segmentLabels = [
    segmentLabel(0, 'PC1: 54'),
    segmentLabel(1, 'PC2: 24'),
    segmentLabel(2, 'PC3: 2')
  ];

  function changeSegmentLabel(k, text) {
    const old = segmentLabels[k];
    const next = segmentLabel(k, text);

    segmentLabels[k] = next;

    return [
      ...leave(old),
      ...enter(next)
    ];
  }

  function segmentOutline(k, color = PC_COLORS[k]) {
    const a = BOUNDARIES[k];
    const b = BOUNDARIES[k + 1];

    return outline(
      bx((a + b) / 2),
      BAR_Y,
      (b - a) * UNIT_W + 0.07,
      BAR_H + 0.16,
      color
    );
  }

  const back = barBackdrop();

  // ------------------------------------------------------------
  // 18: join all eighty blocks into one bar.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...leave(gridFloor, blockKey, ...gridTitles),
    ...enter(back),
    new M.LaggedStart(
      ALL.map((b, i) =>
        new M.Transform(b, barUnit(i), {
          pathArc: -0.35
        })
      ),
      {
        lagRatio: 0.016,
        runTime: 1.9
      }
    ),
    ...say('JOIN THE THREE GROUPS')
  );

  await play(...enter(...segmentLabels));

  // ------------------------------------------------------------
  // 19–21: total variance = 54 + 24 + 2 = 80.
  // ------------------------------------------------------------

  let totalBracket = bracket(
    0, 78,
    BAR_Y + BAR_H / 2 + 0.43,
    '54 + 24 = 78',
    INK
  );

  await until(S(19));

  await play(
    ...enter(totalBracket),
    ...fbox([
      ['54', CYAN],
      ['+ 24', AMBER],
      ['= 78', INK]
    ]),
    ...say('54 + 24 = 78')
  );

  const full80 = bracket(
    0, TOTAL,
    BAR_Y + BAR_H / 2 + 0.43,
    '80 units',
    GREEN
  );

  await until(S(20));

  await play(
    ...leave(totalBracket),
    ...enter(full80),
    ...fbox([
      ['54 + 24 = 78', INK],
      ['78 + 2 = 80', PINK],
      ['Total = 80', GREEN]
    ], GREEN),
    ...say('78 + 2 = 80', GREEN)
  );

  totalBracket = full80;

  await until(S(21));

  await play(
    new M.Indicate(totalBracket, { color: GREEN }),
    ...fbox([
      ['Total variance', GREEN],
      '54 + 24 + 2',
      ['= 80', GREEN]
    ], GREEN),
    ...say('TOTAL VARIANCE = 80', GREEN)
  );

  // ------------------------------------------------------------
  // Visual comparisons with one-half and one-third.
  // ------------------------------------------------------------

  function referenceMark(units, label, color = MUTED) {
    const x = bx(units);

    return new M.VGroup(
      new M.DashedLine({
        start: pos(x, BAR_Y - BAR_H / 2 - 0.10),
        end: pos(x, BAR_Y + BAR_H / 2 + 0.58),
        color
      }),

      at(
        label,
        P ? 16 : 14,
        color,
        x,
        BAR_Y + BAR_H / 2 + 0.84,
        true, 1.70
      )
    );
  }

  function comparisonSpan(a, b, label, color = MUTED) {
    const y = BAR_Y + BAR_H / 2 + 0.36;

    return bracket(a, b, y, label, color);
  }

  // ------------------------------------------------------------
  // 22–25: look at the shares before calculating percentages.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...fbox([
      ['One whole bar', INK],
      ['Three coloured shares', GREEN],
      'Their lengths show variance'
    ], GREEN),
    ...say('LOOK AT EACH GROUP’S SHARE', GREEN)
  );

  const halfMark = referenceMark(
    TOTAL / 2,
    'halfway',
    GREEN
  );

  await until(S(23));

  await play(
    ...leave(totalBracket),
    ...enter(halfMark),
    ...focus(segmentOutline(0)),
    ...fbox([
      ['Half of 80 = 40', MUTED],
      ['PC1 = 54', CYAN],
      'More than half'
    ]),
    ...say('PC1: MORE THAN HALF')
  );

  const thirdSpan = comparisonSpan(
    VARS[0],
    VARS[0] + TOTAL / 3,
    'One-third of the whole',
    MUTED
  );

  // The one-third reference extends slightly beyond PC2.
  // It represents 80/3 units, not one-third of the remainder.

  await until(S(24));

  await play(
    ...leave(halfMark),
    ...enter(thirdSpan),
    ...focus(segmentOutline(1)),
    ...fbox([
      ['One-third ≈ 26.67', MUTED],
      ['PC2 = 24', AMBER],
      'Less than one-third'
    ], AMBER),
    ...say('PC2: LESS THAN ONE-THIRD', AMBER)
  );

  await until(S(25));

  await play(
    ...leave(thirdSpan),
    ...focus(segmentOutline(2)),
    ...fbox([
      ['PC3 = 2', PINK],
      'Only 2 of 80 units',
      'A very small share'
    ], PINK),
    ...say('PC3: A SMALL PART', PINK)
  );

  // ------------------------------------------------------------
  // 26–28: percentages and explained variance ratio.
  // ------------------------------------------------------------

  totalBracket = bracket(
    0, TOTAL,
    BAR_Y + BAR_H / 2 + 0.43,
    '100% = the whole bar',
    GREEN
  );

  await until(S(26));

  await play(
    ...clearFocus(),
    ...enter(totalBracket),
    ...fbox([
      ['Whole bar = 80 units', INK],
      ['Whole bar = 100%', GREEN],
      'Percentage = share of whole'
    ], GREEN),
    ...say('100% MEANS THE WHOLE BAR', GREEN)
  );

  await until(S(27));

  await play(
    ...fbox([
      ['Explained variance ratio', GREEN],
      'Share of total variance',
      'captured by a component'
    ], GREEN),
    ...say('EXPLAINED VARIANCE RATIO', GREEN)
  );

  await until(S(28));

  await play(
    ...fbox([
      ['Find each share', INK],
      ['PC1: 54 out of 80', CYAN],
      ['PC2: 24 out of 80', AMBER],
      ['PC3: 2 out of 80', PINK]
    ]),
    ...say('CALCULATE ALL THREE SHARES')
  );

  // ------------------------------------------------------------
  // 29–31: first explained variance percentage.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...focus(segmentOutline(0)),
    ...fbox([
      ['PC1 explained variance', CYAN],
      '54 ÷ 80',
      ['= 0.675', CYAN]
    ]),
    ...say('PC1: DIVIDE 54 BY 80')
  );

  await until(S(30));

  await play(
    ...fbox([
      ['54 ÷ 80 = 0.675', CYAN],
      'Multiply by 100',
      ['0.675 × 100 = 67.5', CYAN]
    ]),
    ...say('MULTIPLY BY 100')
  );

  await until(S(31));

  await play(
    ...changeSegmentLabel(
      0, `PC1: ${pct(PCTS[0])}`
    ),
    ...fbox([
      ['PC1 explained variance', CYAN],
      '54 ÷ 80 × 100',
      [`= ${pct(PCTS[0])}`, CYAN]
    ]),
    ...say('PC1 EXPLAINS 67.5%')
  );

  // ------------------------------------------------------------
  // 32–33: second explained variance percentage.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...focus(segmentOutline(1)),
    ...fbox([
      ['PC2 explained variance', AMBER],
      '24 ÷ 80 = 0.3',
      ['0.3 × 100 = 30', AMBER]
    ], AMBER),
    ...say('PC2: 24 ÷ 80 × 100', AMBER)
  );

  await until(S(33));

  await play(
    ...changeSegmentLabel(
      1, `PC2: ${pct(PCTS[1])}`
    ),
    ...fbox([
      ['PC2 explained variance', AMBER],
      '24 ÷ 80 × 100',
      [`= ${pct(PCTS[1])}`, AMBER]
    ], AMBER),
    ...say('PC2 EXPLAINS 30%', AMBER)
  );

  // ------------------------------------------------------------
  // 34–35: third explained variance percentage.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...focus(segmentOutline(2)),
    ...fbox([
      ['PC3 explained variance', PINK],
      '2 ÷ 80 = 0.025',
      ['0.025 × 100 = 2.5', PINK]
    ], PINK),
    ...say('PC3: 2 ÷ 80 × 100', PINK)
  );

  await until(S(35));

  await play(
    ...changeSegmentLabel(
      2, `PC3: ${pct(PCTS[2])}`
    ),
    ...fbox([
      ['PC3 explained variance', PINK],
      '2 ÷ 80 × 100',
      [`= ${pct(PCTS[2])}`, PINK]
    ], PINK),
    ...say('PC3 EXPLAINS 2.5%', PINK)
  );

  // ------------------------------------------------------------
  // 36: all three components explain 100%.
  //
  // The remaining nine orthogonal directions have zero variance.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...clearFocus(),
    new M.Indicate(totalBracket, { color: GREEN }),
    ...fbox([
      ['67.5%', CYAN],
      ['+ 30%', AMBER],
      ['+ 2.5%', PINK],
      [`= ${pct(KEEP3)}`, GREEN]
    ], GREEN),
    ...say('ALL THREE EXPLAIN 100%', GREEN)
  );

  // ------------------------------------------------------------
  // 37–42: choose how many components to keep.
  //
  // Goal: at least 95% of the total variance.
  //
  // The target is exactly 76 out of 80 variance units.
  // The original total bar remains visible.
  // Unretained components are dimmed, not removed from the
  // denominator.
  // ------------------------------------------------------------

  const targetUnits = TOTAL * TARGET / 100;

  function targetMarker() {
    const x = bx(targetUnits);

    const top = BAR_Y + BAR_H / 2 + 0.57;
    const bottom = BAR_Y - BAR_H / 2 - 0.12;

    const labelX = Math.min(
      x - 0.45,
      CX + BAR_W / 2 - 0.68
    );

    const labelY = top + 0.31;

    return new M.VGroup(
      new M.DashedLine({
        start: pos(x, bottom),
        end: pos(x, top),
        color: GREEN
      }),

      line(
        pos(x, top),
        pos(labelX, top),
        GREEN, 1.8
      ),

      at(
        '95% TARGET',
        P ? 17 : 15,
        GREEN,
        labelX, labelY,
        true, 1.70
      )
    );
  }

  const target = targetMarker();

  function keepAnimations(count) {
    const limit = sum(VARS.slice(0, count));

    return ALL.map((b, i) =>
      new M.Transform(
        b,
        barUnit(i, i < limit),
        { runTime: 0.65 }
      )
    );
  }

  function keptBracket(units, text, color = GREEN) {
    return bracket(
      0, units,
      BAR_Y + BAR_H / 2 + 0.23,
      text, color
    );
  }

  let statusNow = null;

  function status(text, color = GREEN) {
    const tag = pill(text, color, P ? 17 : 16);

    if (tag.getWidth() > MAIN_W - 0.55) {
      tag.scale(
        (MAIN_W - 0.55) / tag.getWidth()
      );
    }

    tag.moveTo(pos(
      CX,
      P ? -4.4 : -2.29
    ));

    const a = [];

    if (statusNow) {
      a.push(...leave(statusNow));
    }

    statusNow = tag;
    a.push(...enter(tag));

    return a;
  }

  // ------------------------------------------------------------
  // 37: set the 95% target.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...leave(totalBracket),
    ...enter(target),
    ...fbox([
      ['Our target', GREEN],
      'Keep at least 95%',
      'of the total variance'
    ], GREEN),
    ...say('TARGET: KEEP AT LEAST 95%', GREEN)
  );

  // ------------------------------------------------------------
  // 38: retain only PC1.
  // ------------------------------------------------------------

  let kept = keptBracket(
    VARS[0],
    'Keep PC1',
    CYAN
  );

  await until(S(38));

  await play(
    ...keepAnimations(1),
    ...enter(kept),
    ...fbox([
      ['Keep PC1', CYAN],
      'Set PC2 and PC3 aside',
      ['Variance kept: 54', CYAN]
    ]),
    ...say('KEEP ONLY PC1')
  );

  // ------------------------------------------------------------
  // 39: 67.5% is below the target.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...status(
      '67.5% < 95%: NOT ENOUGH',
      AMBER
    ),
    ...fbox([
      ['Retained: 67.5%', CYAN],
      ['Target: 95%', GREEN],
      ['Below target', AMBER]
    ], AMBER),
    ...say('ONE COMPONENT IS NOT ENOUGH', AMBER)
  );

  // ------------------------------------------------------------
  // 40: retain PC2 as well.
  // ------------------------------------------------------------

  const keepTwoBracket = keptBracket(
    VARS[0] + VARS[1],
    'Keep PC1 + PC2',
    GREEN
  );

  await until(S(40));

  await play(
    ...keepAnimations(2),
    ...leave(kept),
    ...enter(keepTwoBracket),
    ...status('NOW KEEP TWO COMPONENTS', GREEN),
    ...fbox([
      ['PC1: 54 units', CYAN],
      ['PC2: 24 units', AMBER],
      ['Together: 78 units', GREEN]
    ], GREEN),
    ...say('KEEP PC2 AS WELL', AMBER)
  );

  kept = keepTwoBracket;

  // ------------------------------------------------------------
  // 41: combined retained share = 97.5%.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...status('67.5% + 30% = 97.5%', GREEN),
    ...fbox([
      ['PC1: 67.5%', CYAN],
      ['PC2: 30%', AMBER],
      'Add the two shares',
      [`= ${pct(KEEP2)}`, GREEN]
    ], GREEN),
    ...say('67.5% + 30% = 97.5%', GREEN)
  );

  // ------------------------------------------------------------
  // 42: two components reach the target.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...status('97.5% ≥ 95%: TARGET REACHED', GREEN),
    ...fbox([
      ['Two components', GREEN],
      ['Keep 97.5% of variance', GREEN],
      ['Lose 2.5% of variance', PINK],
      '95% target reached'
    ], GREEN),
    ...say('TWO COMPONENTS ARE ENOUGH', GREEN)
  );

  // ------------------------------------------------------------
  // Two-dimensional principal-component score map.
  //
  // Unlike the preliminary group-mean map in 14.3.1, this map
  // uses actual unit-length principal-component scores.
  //
  // A, B: (−3√6, −2√6)
  // C, D: (−3√6, +2√6)
  // E, F: (+3√6, −2√6)
  // G, H: (+3√6, +2√6)
  //
  // The same spatial scale is used on both axes.
  // ------------------------------------------------------------

  const O = P
    ? [0, -1.36, 0]
    : [CX, -0.43, 0];

  const U = P ? 0.36 : 0.275;

  const XMAX = 9.05;
  const YMAX = 6.60;

  const mp = (x, y) =>
    pos(O[0] + U * x, O[1] + U * y);

  function mapAxes() {
    const parts = [];

    for (const x of [-8, -6, -4, -2, 2, 4, 6, 8]) {
      parts.push(
        line(
          mp(x, -YMAX),
          mp(x, YMAX),
          CARD, 1
        )
      );
    }

    for (const y of [-6, -4, -2, 2, 4, 6]) {
      parts.push(
        line(
          mp(-XMAX, y),
          mp(XMAX, y),
          CARD, 1
        )
      );
    }

    parts.push(
      doubleArrow(
        mp(-XMAX, 0),
        mp(XMAX, 0),
        CYAN, 2.5
      ),

      doubleArrow(
        mp(0, -YMAX),
        mp(0, YMAX),
        AMBER, 2.5
      )
    );

    for (const x of [-8, -4, 4, 8]) {
      parts.push(
        line(
          pos(mp(x, 0)[0], mp(x, 0)[1] - 0.055),
          pos(mp(x, 0)[0], mp(x, 0)[1] + 0.055),
          MUTED, 1.5
        ),

        at(
          number(x), P ? 15 : 13, MUTED,
          mp(x, 0)[0],
          mp(x, 0)[1] - 0.24,
          true
        )
      );
    }

    for (const y of [-4, 4]) {
      parts.push(
        line(
          pos(mp(0, y)[0] - 0.055, mp(0, y)[1]),
          pos(mp(0, y)[0] + 0.055, mp(0, y)[1]),
          MUTED, 1.5
        ),

        at(
          number(y), P ? 15 : 13, MUTED,
          mp(0, y)[0] - 0.24,
          mp(0, y)[1],
          true
        )
      );
    }

    parts.push(
      at(
        '0', P ? 15 : 13, MUTED,
        O[0] - 0.20,
        O[1] - 0.24,
        true
      ),

      at(
        'PC1',
        P ? 17 : 15,
        CYAN,
        mp(6.75, 0)[0],
        O[1] + 0.35,
        true
      ),

      at(
        'PC2',
        P ? 17 : 15,
        AMBER,
        O[0] + 0.44,
        mp(0, 5.95)[1],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const PAIRS = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7]
  ];

  function pairDot(pair) {
    const i = pair[0];
    const j = pair[1];

    const x = SCORES[i][0];
    const y = SCORES[i][1];

    const p = mp(x, y);

    const inward = x < 0 ? 1 : -1;
    const vertical = y < 0 ? 1 : -1;

    const halo = new M.Dot({
      point: p,
      radius: 0.23,
      color: CYAN
    });

    halo.setFill(CYAN, 0.18);

    const ring = new M.Circle({
      radius: 0.125,
      color: CYAN,
      strokeWidth: 2
    });

    ring.moveTo(p);

    const center = new M.Dot({
      point: p,
      radius: 0.072,
      color: INK
    });

    const a = at(
      TEAS[i],
      P ? 18 : 16,
      INK,
      p[0] + inward * 0.26,
      p[1] + vertical * 0.26,
      true
    );

    const b = at(
      TEAS[j],
      P ? 18 : 16,
      INK,
      p[0] + inward * 0.54,
      p[1] + vertical * 0.26,
      true
    );

    return new M.VGroup(
      halo, ring, center, a, b
    );
  }

  function mapCaption(text, color = GREEN) {
    return at(
      text, P ? 17 : 15,
      color,
      CX,
      P ? -4.35 : -2.44,
      false, MAIN_W - 0.40
    );
  }

  const axes = mapAxes();
  const pairs = PAIRS.map(pairDot);

  const mapNote = mapCaption(
    'Two principal-component scores per tea'
  );

  // ------------------------------------------------------------
  // 43: draw the two-component map.
  // ------------------------------------------------------------

  await until(S(43));

  statusNow = null;

  await play(
    ...scene(axes, mapNote),
    ...fbox([
      ['Horizontal: PC1', CYAN],
      ['Vertical: PC2', AMBER],
      ['97.5% variance retained', GREEN]
    ], GREEN),
    ...say('A MAP USING TWO COMPONENTS', GREEN)
  );

  await play(
    ...enterLagged(pairs, 0.18, 1.2)
  );

  // ------------------------------------------------------------
  // 44: two component scores instead of twelve original scores.
  // ------------------------------------------------------------

  const aX = SCORES[0][0];
  const aY = SCORES[0][1];

  const guideX = new M.DashedLine({
    start: mp(aX, 0),
    end: mp(aX, aY),
    color: CYAN
  });

  const guideY = new M.DashedLine({
    start: mp(0, aY),
    end: mp(aX, aY),
    color: AMBER
  });

  const scoreX = at(
    scoreText(aX),
    P ? 17 : 15,
    CYAN,
    mp(aX, 0)[0] + 0.17,
    mp(aX, 0)[1] + 0.29,
    true
  );

  const scoreY = at(
    scoreText(aY),
    P ? 17 : 15,
    AMBER,
    O[0] + 0.43,
    mp(0, aY)[1],
    true
  );

  const aGuides = new M.VGroup(
    guideX, guideY, scoreX, scoreY
  );

  await until(S(44));

  await play(
    ...enter(aGuides),
    new M.Indicate(pairs[0], { color: CYAN }),
    ...fbox([
      ['Tea A', INK],
      ['12 original scores', MUTED],
      [`PC1 = ${scoreText(aX)}`, CYAN],
      [`PC2 = ${scoreText(aY)}`, AMBER]
    ]),
    ...say('12 NUMBERS BECOME 2')
  );

  // ------------------------------------------------------------
  // 45: the small Floral–Jasmine difference disappears.
  //
  // A and B genuinely coincide in the two-component map.
  // Their third component scores have opposite signs.
  // ------------------------------------------------------------

  const aPairP = mp(aX, aY);

  const pairHighlight = new M.Circle({
    radius: P ? 0.37 : 0.32,
    color: PINK,
    strokeWidth: 3
  });

  pairHighlight.moveTo(aPairP);

  await until(S(45));

  await play(
    ...leave(aGuides),
    ...enter(pairHighlight),
    ...fbox([
      ['A and B: same map position', INK],
      ['A: Floral 1, Jasmine 3', PINK],
      ['B: Floral 3, Jasmine 1', PINK],
      'Difference no longer visible'
    ], PINK),
    ...say('THE SMALL PATTERN IS LOST', PINK)
  );

  // ------------------------------------------------------------
  // 46–49: formalize the calculation.
  //
  // Return to the total-variance bar.
  // Show the ratio before multiplying by 100.
  // ------------------------------------------------------------

  function staticShareBar(keepCount = 3) {
    const parts = [];

    const limit = sum(VARS.slice(0, keepCount));

    parts.push(
      outline(
        CX, BAR_Y,
        BAR_W + 0.08,
        BAR_H + 0.09,
        MUTED
      )
    );

    for (let i = 0; i < TOTAL; i++) {
      parts.push(barUnit(i, i < limit));
    }

    for (let k = 0; k < 3; k++) {
      parts.push(
        segmentLabel(
          k,
          `PC${k + 1}: ${pct(PCTS[k])}`
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const formulaBar = staticShareBar(3);

  const formulaWhole = bracket(
    0, TOTAL,
    BAR_Y + BAR_H / 2 + 0.43,
    'Total variance = 80',
    GREEN
  );

  await until(S(46));

  await play(
    ...scene(formulaBar, formulaWhole),
    ...fbox([
      ['One short formula', CYAN],
      'Find a component’s share',
      'of the total variance'
    ]),
    ...say('WRITE THE CALCULATION AS A FORMULA')
  );

  // ------------------------------------------------------------
  // 47: explained variance ratio = component variance ÷ total.
  // ------------------------------------------------------------

  await until(S(47));

  await play(
    ...focus(segmentOutline(0)),
    ...fbox([
      ['Explained variance ratio', CYAN],
      '= component variance',
      '  ÷ total variance',
      ['PC1: 54 ÷ 80 = 0.675', CYAN]
    ]),
    ...say('RATIO = COMPONENT VARIANCE ÷ TOTAL')
  );

  // ------------------------------------------------------------
  // 48: multiply the ratio by one hundred for the percentage.
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...fbox([
      ['Explained variance %', CYAN],
      '= explained ratio × 100',
      '0.675 × 100',
      ['= 67.5%', CYAN]
    ]),
    ...say('PERCENTAGE = RATIO × 100')
  );

  // ------------------------------------------------------------
  // 49: add retained component percentages.
  // ------------------------------------------------------------

  const formulaKeepTwo = staticShareBar(2);

  const combined = bracket(
    0, VARS[0] + VARS[1],
    BAR_Y + BAR_H / 2 + 0.43,
    'Combined share: 97.5%',
    GREEN
  );

  await until(S(49));

  await play(
    ...scene(formulaKeepTwo, combined),
    ...fbox([
      ['Combined retained share', GREEN],
      '= add kept percentages',
      '67.5% + 30%',
      ['= 97.5%', GREEN]
    ], GREEN),
    ...say('ADD THE SHARES YOU KEEP', GREEN)
  );

  // ------------------------------------------------------------
  // 50: use explained variance to choose the number of components.
  //
  // A compact cumulative-variance guide:
  //   1 component:  67.5%
  //   2 components: 97.5%
  //   3 components: 100%
  // ------------------------------------------------------------

  function choicePicture() {
    const parts = [];

    const w = P ? 5.60 : 5.25;
    const left = CX - w / 2 - 0.12;

    const yy = P
      ? [0.35, -1.30, -2.95]
      : [0.57, -0.63, -1.83];

    const h = P ? 0.36 : 0.29;

    const keptValues = [KEEP1, KEEP2, KEEP3];

    for (let k = 0; k < 3; k++) {
      const y = yy[k];

      parts.push(
        at(
          `${k + 1} component${k === 0 ? '' : 's'}`,
          P ? 18 : 16,
          INK,
          left + 0.95,
          y + 0.45,
          false, 2.15
        )
      );

      parts.push(
        rect(
          left + w / 2,
          y, w, h,
          CARD, 0.72, 0
        )
      );

      let start = left;

      for (let j = 0; j <= k; j++) {
        const width = w * RATIOS[j];

        parts.push(
          rect(
            start + width / 2,
            y,
            width,
            h,
            PC_COLORS[j],
            0.86, 1
          )
        );

        start += width;
      }

      parts.push(
        at(
          pct(keptValues[k]),
          P ? 20 : 18,
          keptValues[k] >= TARGET
            ? GREEN
            : AMBER,
          left + w + 0.44,
          y,
          true, 0.89
        )
      );
    }

    const targetX = left + w * TARGET / 100;

    parts.push(
      new M.DashedLine({
        start: pos(targetX, yy[2] - h / 2 - 0.11),
        end: pos(targetX, yy[0] + h / 2 + 0.48),
        color: GREEN
      }),

      at(
        '95%',
        P ? 15 : 14,
        GREEN,
        targetX,
        yy[0] + h / 2 + 0.65,
        true
      )
    );

    // Outline the smallest number of components meeting the target.

    const selected = outline(
      CX + 0.16,
      yy[1] + 0.12,
      w + 1.19,
      P ? 1.14 : 0.91,
      GREEN
    );

    parts.push(selected);

    return new M.VGroup(...parts);
  }

  const choices = choicePicture();

  await until(S(50));

  await play(
    ...scene(choices),
    ...fbox([
      ['Choose a smaller description', GREEN],
      ['1 component: 67.5%', CYAN],
      ['2 components: 97.5%', GREEN],
      ['3 components: 100%', INK]
    ], GREEN),
    ...say('CHOOSE HOW MANY COMPONENTS TO KEEP', GREEN)
  );

  // ------------------------------------------------------------
  // 51–53: high retained variance does not guarantee that
  // every important detail is preserved.
  //
  // Compare tea A with tea B.
  //
  // A: Floral 1, Jasmine 3
  // B: Floral 3, Jasmine 1
  //
  // They have identical PC1 and PC2 scores.
  // The discarded PC3 distinguishes them.
  // ------------------------------------------------------------

  function detailCard(i) {
    const x = CX + (i - 0.5) * 3.18;

    const cardY = P ? -0.48 : -0.36;
    const cardW = P ? 2.95 : 2.94;
    const cardH = P ? 2.90 : 2.35;

    const base = P ? -1.45 : -1.09;
    const scale = P ? 0.53 : 0.40;

    const parts = [
      outline(
        x, cardY,
        cardW, cardH,
        PINK, 0.55
      ),

      at(
        `Tea ${TEAS[i]}`,
        P ? 22 : 20,
        INK,
        x,
        cardY + cardH / 2 - 0.28
      )
    ];

    const xs = [x - 0.62, x + 0.62];

    const values = [
      D[i][0],
      D[i][1]
    ];

    for (let j = 0; j < 2; j++) {
      const v = values[j];

      parts.push(
        glowingBar(
          xs[j], base,
          v, scale,
          P ? 0.53 : 0.48,
          PINK
        ),

        at(
          v, P ? 20 : 18,
          PINK,
          xs[j],
          base + v * scale + 0.22,
          true
        ),

        at(
          ATTRS[j],
          P ? 15 : 14,
          PINK,
          xs[j], base - 0.27,
          false, 1.14
        )
      );
    }

    parts.push(
      line(
        pos(x - 1.19, base),
        pos(x + 1.19, base),
        MUTED, 1.5
      )
    );

    return new M.VGroup(...parts);
  }

  function detailPicture() {
    const cards = [
      detailCard(0),
      detailCard(1)
    ];

    const topNote = at(
      'SAME TWO COMPONENT SCORES',
      P ? 18 : 16,
      GREEN,
      CX,
      P ? 1.43 : 1.28,
      false, MAIN_W - 0.35
    );

    const scoreY = P ? -2.53 : -1.90;

    const scoreLine = new M.VGroup(
      at(
        `PC1 = ${scoreText(SCORES[0][0])}`,
        P ? 18 : 16,
        CYAN,
        CX - 1.49,
        scoreY,
        true
      ),

      at(
        `PC2 = ${scoreText(SCORES[0][1])}`,
        P ? 18 : 16,
        AMBER,
        CX + 1.49,
        scoreY,
        true
      )
    );

    const bottomNote = at(
      'Different Floral and Jasmine scores',
      P ? 18 : 15,
      PINK,
      CX,
      P ? -3.20 : -2.35,
      false, MAIN_W - 0.3
    );

    return {
      group: new M.VGroup(
        ...cards,
        topNote,
        scoreLine,
        bottomNote
      ),
      cards
    };
  }

  const details = detailPicture();

  // ------------------------------------------------------------
  // 51: 97.5% retained variance is not 97.5% of every detail.
  // ------------------------------------------------------------

  await until(S(51));

  await play(
    ...scene(details.group),
    ...fbox([
      ['97.5% of total variance', GREEN],
      'Does not mean we keep',
      'every important detail',
      ['A and B are different', PINK]
    ], AMBER),
    ...say('HIGH EXPLAINED VARIANCE ≠ EVERY DETAIL', AMBER)
  );

  // ------------------------------------------------------------
  // 52: a customer prefers jasmine to floral smells.
  // ------------------------------------------------------------

  function customerPreference() {
    const y = P ? -4.03 : -2.52;

    const tag = pill(
      'PREFERS JASMINE',
      PINK,
      P ? 18 : 15
    );

    tag.moveTo(pos(CX, y));

    return tag;
  }

  const customer = customerPreference();

  const teaAX = CX - 1.59;
  const teaBX = CX + 1.59;

  const jasmineBase = P ? -1.45 : -1.09;
  const jasmineScale = P ? 0.53 : 0.40;

  const jasmineA = outline(
    teaAX + 0.62,
    jasmineBase + 3 * jasmineScale / 2,
    0.75,
    3 * jasmineScale + 0.14,
    GREEN
  );

  const jasmineB = outline(
    teaBX + 0.62,
    jasmineBase + jasmineScale / 2,
    0.75,
    jasmineScale + 0.14,
    PINK
  );

  await until(S(52));

  await play(
    ...enter(customer, jasmineA, jasmineB),
    ...fbox([
      ['A customer’s preference', INK],
      ['Jasmine over Floral', PINK],
      ['Tea A: Jasmine 3', GREEN],
      'Tea B: Jasmine 1'
    ], PINK),
    ...say('A CUSTOMER PREFERS JASMINE', PINK)
  );

  // ------------------------------------------------------------
  // 53: the small discarded component may matter most.
  //
  // Show PC3's actual score for A and B.
  // ------------------------------------------------------------

  function smallPatternDetail() {
    const parts = [];

    const y = P ? -0.75 : -0.48;
    const x0 = CX - 2.67;
    const x1 = CX + 2.67;

    const scale = 1.54;

    const a = SCORES[0][2];
    const b = SCORES[1][2];

    const ax = CX + a * scale;
    const bx3 = CX + b * scale;

    parts.push(
      at(
        'PC3: Floral–Jasmine difference',
        P ? 21 : 18,
        PINK,
        CX,
        P ? 0.90 : 1.02,
        false, MAIN_W - 0.35
      ),

      line(
        pos(x0, y),
        pos(x1, y),
        PINK, 3
      ),

      line(
        pos(CX, y - 0.10),
        pos(CX, y + 0.10),
        MUTED, 2
      ),

      at(
        '0', 15, MUTED,
        CX, y - 0.29,
        true
      ),

      glowDot(pos(ax, y), PINK, 0.12),

      glowDot(pos(bx3, y), PINK, 0.12),

      at(
        'A', 22, INK,
        ax, y + 0.40,
        true
      ),

      at(
        'B', 22, INK,
        bx3, y + 0.40,
        true
      ),

      at(
        '−√2', 20, PINK,
        ax, y - 0.39,
        true
      ),

      at(
        '+√2', 20, PINK,
        bx3, y - 0.39,
        true
      ),

      at(
        'More Jasmine',
        P ? 18 : 16,
        GREEN,
        ax,
        y - 0.88,
        false, 2.45
      ),

      at(
        'More Floral',
        P ? 18 : 16,
        PINK,
        bx3,
        y - 0.88,
        false, 2.45
      ),

      at(
        'Only 2.5% of variance — useful here',
        P ? 18 : 16,
        PINK,
        CX,
        P ? -3.00 : -2.16,
        false, MAIN_W - 0.4
      )
    );

    return new M.VGroup(...parts);
  }

  const lostDetail = smallPatternDetail();

  await until(S(53));

  await play(
    ...scene(lostDetail),
    ...fbox([
      ['PC3 explains only 2.5%', PINK],
      'But it separates A and B',
      ['Useful for this customer', GREEN],
      'Small variance can matter'
    ], PINK),
    ...say('A SMALL PATTERN CAN BE IMPORTANT', PINK)
  );

  // ------------------------------------------------------------
  // 54: final visual summary.
  //
  // Retained variance: 97.5%.
  // Discarded variance: 2.5%.
  //
  // Explained variance guides compression.
  // The question determines which details are valuable.
  // ------------------------------------------------------------

  function summaryPicture() {
    const parts = [];

    const w = P ? 6.30 : 6.20;
    const left = CX - w / 2;

    const y = P ? 0.20 : 0.60;
    const h = P ? 0.67 : 0.49;

    parts.push(
      at(
        'TOTAL VARIANCE = 100%',
        P ? 19 : 17,
        INK,
        CX, y + 0.71,
        true
      )
    );

    const colors = PC_COLORS;

    let start = left;

    for (let k = 0; k < 3; k++) {
      const sw = w * RATIOS[k];

      parts.push(
        rect(
          start + sw / 2,
          y,
          sw, h,
          colors[k],
          0.88, 1
        )
      );

      start += sw;
    }

    parts.push(
      outline(
        CX, y,
        w + 0.05, h + 0.06,
        MUTED
      )
    );

    const retainedX =
      left + w * (KEEP2 / 100) / 2;

    const lostX =
      left + w * (KEEP2 / 100) +
      w * RATIOS[2] / 2;

    const keptY = y - h / 2 - 0.40;

    parts.push(
      line(
        pos(
          left,
          keptY + 0.18
        ),
        pos(
          left + w * KEEP2 / 100,
          keptY + 0.18
        ),
        GREEN, 2
      ),

      at(
        '97.5% kept',
        P ? 25 : 22,
        GREEN,
        retainedX,
        keptY - 0.11,
        true
      ),

      line(
        pos(lostX, y - h / 2),
        pos(lostX, keptY - 0.48),
        PINK, 1.5
      ),

      line(
        pos(lostX, keptY - 0.48),
        pos(lostX - 0.52, keptY - 0.48),
        PINK, 1.5
      ),

      at(
        '2.5% lost',
        P ? 17 : 15,
        PINK,
        lostX - 0.52,
        keptY - 0.72,
        true
      )
    );

    const rowY = P ? -2.75 : -1.67;

    const leftCardX = CX - 1.75;
    const rightCardX = CX + 1.75;

    parts.push(
      outline(
        leftCardX, rowY,
        2.68, P ? 1.30 : 0.89,
        GREEN, 0.56
      ),

      at(
        'KEEP BIG PATTERNS',
        P ? 16 : 14,
        GREEN,
        leftCardX,
        rowY + (P ? 0.29 : 0.21),
        false, 2.46
      ),

      at(
        'Fewer numbers',
        P ? 18 : 16,
        INK,
        leftCardX,
        rowY - (P ? 0.22 : 0.18),
        false, 2.47
      ),

      outline(
        rightCardX, rowY,
        2.68, P ? 1.30 : 0.89,
        PINK, 0.56
      ),

      at(
        'CHECK SMALL PATTERNS',
        P ? 15 : 13,
        PINK,
        rightCardX,
        rowY + (P ? 0.29 : 0.21),
        false, 2.46
      ),

      at(
        'Do they matter?',
        P ? 18 : 16,
        INK,
        rightCardX,
        rowY - (P ? 0.22 : 0.18),
        false, 2.47
      )
    );

    parts.push(
      at(
        'Your question decides which details matter.',
        P ? 17 : 15,
        INK,
        CX,
        P ? -4.06 : -2.42,
        false, MAIN_W - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  const finalPicture = summaryPicture();

  await until(S(54));

  await play(
    ...scene(finalPicture),
    ...fbox([
      ['Explained variance', GREEN],
      'Keep the largest patterns',
      'Check what gets discarded',
      ['Your question decides', PINK]
    ], GREEN),
    ...say('KEEP BIG PATTERNS. CHECK WHAT MATTERS.', GREEN)
  );

  // Leave the final picture visible until the narration ends.

  await until(E(54));

  // Integration note:
  // All 55 narration beats are included. The supplied engine
  // interface and approved animation conventions are used.
  // The original chapter data and unit-length PCA convention
  // are preserved throughout.
  //
  // Actual browser playback, seek behavior, animation timing,
  // text sizing and phone/laptop rendering still require
  // verification inside site/live/engine.js.
}

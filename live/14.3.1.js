// lesson 14.3.1
// Principal components: finding the biggest pattern
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Covariance-based PCA, using centered data and unit-length directions.
// Population variance: divide by the number of teas, not n - 1.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data: fixed for every lesson in chapter 14.3.
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

  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;

  const MEANS = ATTRS.map((_, j) => mean(D.map(row => row[j])));

  const Z = D.map(row => row.map((v, j) => v - MEANS[j]));

  const MAP = Z.map(row => [
    mean(row.slice(0, 6)),
    mean(row.slice(6, 12))
  ]);

  const U1 = ATTRS.map((_, j) => j < 6 ? 1 / Math.sqrt(6) : 0);
  const U2 = ATTRS.map((_, j) => j >= 6 ? 1 / Math.sqrt(6) : 0);
  const U3 = ATTRS.map((_, j) =>
    j === 0 ? 1 / Math.sqrt(2) :
    j === 1 ? -1 / Math.sqrt(2) : 0
  );

  const dot = (a, b) => a.reduce((s, v, j) => s + v * b[j], 0);

  const SCORES = Z.map(row => [
    dot(row, U1),
    dot(row, U2),
    dot(row, U3)
  ]);

  const VARS = [0, 1, 2].map(j =>
    Math.round(mean(SCORES.map(row => row[j] ** 2)))
  );

  const PINK = C.pink || '#F472B6';
  const CYAN = C.cyan;
  const AMBER = C.amber;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const INK = C.ink;
  const MUTED = C.muted;
  const CARD = C.card;

  const ac = j => j < 6 ? CYAN : AMBER;

  const signed = v =>
    v < 0 ? `−${Math.abs(v)}` : v > 0 ? `+${v}` : '0';

  const number = v => v < 0 ? `−${Math.abs(v)}` : String(v);

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

  const SAY_SIZE = P ? 17 : 17;

  const say = (s, c = CYAN) => showA(s, c, PILL);

  const pos = (x, y) => [x, y, 0];

  const at = (s, size, color, x, y, mono = false, maxw = null) => {
    const t = T(String(s), size, color, mono);
    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }
    t.moveTo(pos(x, y));
    return t;
  };

  function line(a, b, color = MUTED, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function rect(x, y, w, h, color, opacity = 0.8, strokeWidth = 1) {
    const r = new M.Rectangle({
      width: w,
      height: Math.max(h, 0.012),
      color,
      strokeWidth
    });
    r.setFill(color, opacity);
    r.moveTo(pos(x, y));
    return r;
  }

  function outline(x, y, w, h, color = CYAN, opacity = 0) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });
    r.setFill(CARD, opacity);
    r.moveTo(pos(x, y));
    return r;
  }

  function glowDot(p, color = CYAN, radius = 0.095) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.15,
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

  function glowingBar(x, base, v, scale, width, color) {
    const h = Math.max(Math.abs(v) * scale, 0.025);
    const y = base + (v < 0 ? -h / 2 : h / 2);

    const halo = rect(
      x, y, width + 0.045, h + 0.025,
      color, 0.11, 0
    );

    const bar = rect(
      x, y, width, h,
      color, v === 0 ? 0.25 : 0.82, 1
    );

    return new M.VGroup(halo, bar);
  }

  function arrow(a, b, color = CYAN, width = 4, head = 0.19) {
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);

    const p1 = pos(
      b[0] - head * Math.cos(angle - Math.PI / 6),
      b[1] - head * Math.sin(angle - Math.PI / 6)
    );

    const p2 = pos(
      b[0] - head * Math.cos(angle + Math.PI / 6),
      b[1] - head * Math.sin(angle + Math.PI / 6)
    );

    return new M.VGroup(
      line(a, b, color, width),
      line(b, p1, color, width),
      line(b, p2, color, width)
    );
  }

  function doubleArrow(a, b, color = CYAN, width = 4) {
    return new M.VGroup(
      arrow(a, b, color, width),
      arrow(b, a, color, width)
    );
  }

  // ------------------------------------------------------------
  // Formula box: one box at a time, matching the approved lesson.
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

    const cw = T('0000000000', size, INK, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
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
      const ind = cw *
        (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo(pos(
        left + ind + t.getWidth() / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.62 : 3.5;

    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

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
  // Only fresh objects are grouped together.
  // Objects already on screen are never regrouped.
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
    a.push(new M.Create(g));

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

  // ------------------------------------------------------------
  // Persistent tea letters.
  // ------------------------------------------------------------

  const roster = new M.VGroup(
    ...TEAS.map((name, i) => {
      const x = CX + (i - 3.5) * (P ? 0.78 : 0.76);

      const r = outline(x, ROSTER_Y, 0.48, 0.30, MUTED, 0.35);

      const t = at(name, P ? 15 : 14, INK, x, ROSTER_Y, true);

      return new M.VGroup(r, t);
    })
  );

  // ------------------------------------------------------------
  // Intro: tasting panel and tea cups.
  // ------------------------------------------------------------

  function person(x, y) {
    const head = new M.Circle({
      radius: 0.17,
      color: INK
    });

    head.setFill(INK, 0.88);
    head.moveTo(pos(x, y + 0.32));

    const body = new M.Arc({
      radius: 0.31,
      startAngle: 0,
      angle: Math.PI,
      color: INK
    });

    body.setFill(INK, 0.82);
    body.moveTo(pos(x, y - 0.03));

    return new M.VGroup(head, body);
  }

  function teaCup(x, y, name) {
    const w = P ? 0.75 : 0.65;
    const h = P ? 0.48 : 0.42;

    const body = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color: MUTED,
      strokeWidth: 2
    });

    body.setFill(CARD, 0.95);
    body.moveTo(pos(x, y));

    const handle = new M.Circle({
      radius: 0.13,
      color: MUTED,
      strokeWidth: 2
    });

    handle.moveTo(pos(x + w / 2 + 0.10, y + 0.015));

    const tea = rect(
      x, y + h / 2 - 0.095,
      w * 0.80, 0.075,
      AMBER, 0.78, 0
    );

    const saucer = line(
      pos(x - w * 0.65, y - h / 2 - 0.08),
      pos(x + w * 0.65, y - h / 2 - 0.08),
      MUTED, 2
    );

    const label = at(name, 17, INK, x, y - h / 2 - 0.30, true);

    return new M.VGroup(handle, body, tea, saucer, label);
  }

  const panel = new M.VGroup(
    ...Array.from({ length: 4 }, (_, i) =>
      person(CX + (i - 1.5) * 1.25, P ? 0.85 : 0.75)
    )
  );

  const cups = new M.VGroup(
    ...TEAS.map((name, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);

      return teaCup(
        CX + (col - 1.5) * (P ? 1.40 : 1.36),
        (P ? -0.65 : -0.38) - row * (P ? 1.55 : 1.13),
        name
      );
    })
  );

  // ------------------------------------------------------------
  // Twelve-attribute profile.
  // ------------------------------------------------------------

  const SP = P ? 0.535 : 0.54;
  const AX = j => CX + (j - 5.5) * SP;

  function tastingProfile(values, tea = 'A', centered = false) {
    const base = P ? -2.65 : -1.65;
    const scale = P ? 0.31 : 0.225;

    const parts = [];

    const y0 = centered ? base + scale * 5 : base;

    parts.push(
      line(
        pos(AX(0) - 0.34, y0),
        pos(AX(11) + 0.34, y0),
        MUTED, 2
      )
    );

    const levels = centered ? [-5, 0, 5] : [0, 5, 10];

    for (const level of levels) {
      const y = y0 + scale * level;

      parts.push(
        line(
          pos(AX(0) - 0.34, y),
          pos(AX(11) + 0.34, y),
          level === 0 ? MUTED : CARD,
          1
        )
      );

      parts.push(
        at(
          number(level), P ? 15 : 14, MUTED,
          AX(0) - 0.49, y, true
        )
      );
    }

    values.forEach((v, j) => {
      const color = ac(j);

      parts.push(glowingBar(AX(j), y0, v, scale, 0.31, color));

      const labelY = v >= 0
        ? y0 + v * scale + 0.21
        : y0 + v * scale - 0.21;

      parts.push(at(number(v), 16, color, AX(j), labelY, true));

      parts.push(
        at(SHORT[j], P ? 15 : 12, color, AX(j), base - 0.45, false, 0.50)
      );
    });

    parts.push(
      at(
        `Tea ${tea}`,
        20, INK, CX,
        P ? 1.25 : 1.08,
        false
      )
    );

    return new M.VGroup(...parts);
  }

  function scoreScale() {
    const y = P ? -3.85 : -2.32;
    const w = P ? 5.3 : 5.3;
    const x0 = CX - w / 2;
    const xx = v => x0 + v / 10 * w;

    const parts = [
      line(pos(x0, y), pos(x0 + w, y), MUTED, 3)
    ];

    for (let v = 0; v <= 10; v++) {
      parts.push(
        line(
          pos(xx(v), y - 0.06),
          pos(xx(v), y + 0.06),
          MUTED, 1
        )
      );
    }

    [0, 5, 10].forEach(v => {
      parts.push(at(v, 15, INK, xx(v), y - 0.24, true));
    });

    return {
      group: new M.VGroup(...parts),
      point: v => pos(xx(v), y),
      y,
      xx
    };
  }

  // ------------------------------------------------------------
  // Eight teas as eight rows of twelve glowing miniature bars.
  // Every score is also shown numerically.
  // ------------------------------------------------------------

  const TABLE_SP = P ? 0.525 : 0.53;
  const TABLE_TOP = P ? 0.95 : 0.83;
  const ROW_PITCH = P ? 0.58 : 0.36;

  const tx = j => CX + 0.24 + (j - 5.5) * TABLE_SP;
  const ty = i => TABLE_TOP - i * ROW_PITCH;

  const TABLE_LABEL_X = tx(0) - 0.56;
  const HEADER_Y = TABLE_TOP + (P ? 0.59 : 0.45);
  const MEAN_Y = ty(7) - (P ? 0.62 : 0.44);

  function tableCell(v, i, j, centered = false) {
    const x = tx(j);
    const y = ty(i);

    const color = ac(j);
    const barX = x - 0.135;

    const scale = centered
      ? (P ? 0.047 : 0.028)
      : (P ? 0.029 : 0.019);

    const base = centered
      ? y
      : y - (P ? 0.16 : 0.115);

    const parts = [
      rect(
        x, y,
        TABLE_SP * 0.91,
        ROW_PITCH * 0.82,
        CARD, 0.55, 0
      )
    ];

    if (centered) {
      parts.push(
        line(
          pos(barX - 0.07, base),
          pos(barX + 0.07, base),
          MUTED, 1
        )
      );
    }

    parts.push(
      glowingBar(barX, base, v, scale, 0.105, color)
    );

    parts.push(
      at(
        number(v), P ? 15 : 13,
        color, x + 0.092, y,
        true, 0.27
      )
    );

    return new M.VGroup(...parts);
  }

  function scoreTable(values, centered = false) {
    const parts = [];
    const cells = [];
    const labels = [];

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
      const label = at(
        TEAS[i], P ? 19 : 16,
        INK, TABLE_LABEL_X, ty(i), true
      );

      labels.push(label);
      parts.push(label);

      cells[i] = [];

      for (let j = 0; j < 12; j++) {
        const cell = tableCell(values[i][j], i, j, centered);
        cells[i].push(cell);
        parts.push(cell);
      }
    }

    const splitX = (tx(5) + tx(6)) / 2;

    parts.push(
      line(
        pos(splitX, HEADER_Y + 0.17),
        pos(splitX, ty(7) - ROW_PITCH * 0.44),
        MUTED, 1.5
      )
    );

    return {
      group: new M.VGroup(...parts),
      cells,
      labels
    };
  }

  function tableRegion(i0, i1, j0, j1, color = CYAN) {
    const left = tx(j0) - TABLE_SP * 0.49;
    const right = tx(j1) + TABLE_SP * 0.49;

    const top = ty(i0) + ROW_PITCH * 0.46;
    const bottom = ty(i1) - ROW_PITCH * 0.46;

    return outline(
      (left + right) / 2,
      (top + bottom) / 2,
      right - left,
      top - bottom,
      color
    );
  }

  function tableRow(i, color = CYAN) {
    const left = TABLE_LABEL_X - 0.23;
    const right = tx(11) + TABLE_SP * 0.49;

    return outline(
      (left + right) / 2,
      ty(i),
      right - left,
      ROW_PITCH * 0.92,
      color
    );
  }

  function meanRow(values, color = GREEN) {
    const parts = [
      at(
        'Mean', P ? 15 : 12,
        color, TABLE_LABEL_X, MEAN_Y,
        false, 0.58
      ),
      line(
        pos(TABLE_LABEL_X - 0.22, MEAN_Y + ROW_PITCH * 0.48),
        pos(tx(11) + TABLE_SP * 0.45, MEAN_Y + ROW_PITCH * 0.48),
        color, 1.5
      )
    ];

    values.forEach((v, j) => {
      parts.push(at(number(v), 16, color, tx(j), MEAN_Y, true));
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 0: a tea-tasting panel.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(panel, cups),
    new M.FadeIn(roster),
    ...say('A TEA-TASTING PANEL')
  );

  // ------------------------------------------------------------
  // 1–4: twelve attributes, with scores from zero to ten.
  // ------------------------------------------------------------

  const introProfile = tastingProfile(D[0], 'A');
  const scale = scoreScale();

  await until(S(1));

  await play(
    ...scene(introProfile),
    ...fbox([
      ['12 scores per tea', CYAN],
      'Taste and smell',
      'Each scored from 0 to 10'
    ]),
    ...say('12 SCORES FOR EACH TEA')
  );

  await until(S(2));

  await play(
    ...fbox([
      ['Attribute', CYAN],
      'One taste or smell',
      'that we score',
      ['Floral, jasmine, rose…', MUTED]
    ]),
    ...say('ATTRIBUTE = A SCORED FEATURE')
  );

  const zeroMarker = glowDot(scale.point(0), MUTED, 0.11);

  await until(S(3));

  await play(
    ...enter(scale.group, zeroMarker),
    ...fbox([
      ['0 = not noticeable', MUTED],
      'Original tasting score'
    ], MUTED),
    ...say('0 = CANNOT NOTICE IT', MUTED)
  );

  const tenMarker = glowDot(scale.point(10), AMBER, 0.11);

  await until(S(4));

  await play(
    ...leave(zeroMarker),
    ...enter(tenMarker),
    ...fbox([
      ['10 = very strong', AMBER],
      'Original tasting score'
    ], AMBER),
    ...say('10 = VERY STRONG', AMBER)
  );

  // ------------------------------------------------------------
  // 5–10: the eight original tasting profiles.
  // ------------------------------------------------------------

  const rawTable = scoreTable(D);

  await until(S(5));

  await play(
    ...scene(rawTable.group),
    ...clearBox(),
    ...say('8 TEAS × 12 ATTRIBUTES')
  );

  await until(S(6));

  await play(
    ...focus(tableRegion(0, 0, 0, 1, PINK)),
    ...fbox([
      ['Tea A', INK],
      ['Floral', PINK],
      ['Jasmine', PINK]
    ], PINK),
    ...say('TEA A: FLORAL AND JASMINE', PINK)
  );

  await until(S(7));

  await play(
    ...fbox([
      ['Tea A', INK],
      ['Floral  = 1', PINK],
      ['Jasmine = 3', PINK]
    ], PINK),
    new M.Indicate(rawTable.cells[0][0], { color: PINK }),
    new M.Indicate(rawTable.cells[0][1], { color: PINK }),
    ...say('1 AND 3', PINK)
  );

  await until(S(8));

  await play(
    ...focus(tableRegion(0, 0, 2, 5, CYAN)),
    ...fbox([
      ['Tea A', INK],
      'Rose     2',
      'Blossom  2',
      ['Honey, Fruit: 2, 2', CYAN]
    ]),
    ...say('THE NEXT FOUR ARE ALL 2')
  );

  await until(S(9));

  await play(
    ...focus(tableRegion(0, 0, 6, 11, AMBER)),
    ...fbox([
      ['Tea A', INK],
      'Roast, Toast, Nut',
      'Cocoa, Caramel, Smoke',
      ['3  3  3  3  3  3', AMBER]
    ], AMBER),
    ...say('THE LAST SIX ARE ALL 3', AMBER)
  );

  await until(S(10));

  await play(
    ...clearFocus(),
    ...clearBox(),
    ...say('COMPARE ALL EIGHT TEAS', GREEN)
  );

  // ------------------------------------------------------------
  // 11–13: two large shared patterns.
  // ------------------------------------------------------------

  const firstLow = tableRegion(0, 3, 0, 5, CYAN);
  const firstHigh = tableRegion(4, 7, 0, 5, CYAN);

  await until(S(11));

  await play(
    ...enter(firstLow, firstHigh),
    ...fbox([
      ['First six attributes', CYAN],
      'A–D: generally low',
      'E–H: generally high',
      ['They change together', CYAN]
    ]),
    ...say('FIRST SIX: RISE AND FALL TOGETHER')
  );

  const lastSix = tableRegion(0, 7, 6, 11, AMBER);

  await until(S(12));

  await play(
    ...leave(firstLow, firstHigh),
    ...enter(lastSix),
    ...fbox([
      ['Last six attributes', AMBER],
      'A, B, E, F: low',
      'C, D, G, H: high',
      ['They change together', AMBER]
    ], AMBER),
    ...say('LAST SIX: RISE AND FALL TOGETHER', AMBER)
  );

  await until(S(13));

  await play(
    ...leave(lastSix),
    ...fbox([
      ['12 numbers', MUTED],
      ['↓', INK],
      ['Fewer numbers?', GREEN]
    ], GREEN),
    ...say('CAN WE KEEP THE SHARED PATTERNS?', GREEN)
  );

  // ------------------------------------------------------------
  // 14–20: centering the data.
  // ------------------------------------------------------------

  const means = meanRow(MEANS, GREEN);

  await until(S(14));

  await play(
    ...enter(means),
    ...focus(tableRegion(0, 7, 0, 0, GREEN)),
    ...fbox([
      ['Mean of each attribute', GREEN],
      'Add its eight scores',
      'Divide by eight',
      ['Floral: 40 ÷ 8', GREEN]
    ], GREEN),
    ...say('FIND EACH ATTRIBUTE’S FAIR SHARE', GREEN)
  );

  await until(S(15));

  await play(
    ...clearFocus(),
    new M.Indicate(means, { color: GREEN }),
    ...fbox([
      ['40 ÷ 8 = 5', GREEN],
      'The mean is 5',
      'for all 12 attributes'
    ], GREEN),
    ...say('EVERY ATTRIBUTE HAS MEAN 5', GREEN)
  );

  const centeredTable = scoreTable(Z, true);
  const centeredMeans = meanRow(ATTRS.map(() => 0), GREEN);

  await until(S(16));

  await play(
    ...scene(centeredTable.group, centeredMeans),
    ...fbox([
      ['Centered score', CYAN],
      '= original score − mean',
      ['= original score − 5', GREEN]
    ]),
    ...say('SUBTRACT 5 FROM EVERY SCORE')
  );

  await until(S(17));

  await play(
    ...focus(tableRegion(0, 0, 0, 1, PINK)),
    ...fbox([
      ['Tea A', INK],
      ['Floral:  1 − 5 = −4', PINK],
      ['Jasmine: 3 − 5 = −2', PINK]
    ], PINK),
    ...say('TEA A: −4 AND −2', PINK)
  );

  const aFirst = tableRegion(0, 0, 2, 5, CYAN);
  const aLast = tableRegion(0, 0, 6, 11, AMBER);

  await until(S(18));

  await play(
    ...clearFocus(),
    ...enter(aFirst, aLast),
    ...fbox([
      ['Next four', CYAN],
      ['2 − 5 = −3', CYAN],
      ['Last six', AMBER],
      ['3 − 5 = −2', AMBER]
    ]),
    ...say('TEA A: FOUR −3s, THEN SIX −2s')
  );

  await until(S(19));

  await play(
    ...leave(aFirst, aLast),
    new M.Indicate(centeredMeans, { color: GREEN }),
    ...fbox([
      ['Before centering', MUTED],
      '0 = not noticeable',
      ['After centering', GREEN],
      '0 = the original mean'
    ], GREEN),
    ...say('ZERO NOW MARKS THE MEAN', GREEN)
  );

  await until(S(20));

  await play(
    ...fbox([
      ['Centering', GREEN],
      'Subtract each mean',
      ['New means = 0', GREEN]
    ], GREEN),
    ...say('CENTERING THE DATA', GREEN)
  );

  // ------------------------------------------------------------
  // Map of the means of the two centered attribute groups.
  //
  // Important: this is a group-mean map, not yet a map of
  // unit-length principal-component scores.
  // Both axes use exactly the same spatial scale.
  // ------------------------------------------------------------

  const O = P ? [0, -1.40, 0] : [CX, -0.50, 0];
  const U = P ? 0.86 : 0.65;

  const mp = (x, y) => pos(O[0] + U * x, O[1] + U * y);

  const XMAX = 3.85;
  const YMAX = 2.95;

  function mapAxes() {
    const parts = [];

    for (let i = -3; i <= 3; i++) {
      if (i !== 0) {
        parts.push(
          line(mp(i, -YMAX), mp(i, YMAX), CARD, 1)
        );
      }
    }

    for (let j = -2; j <= 2; j++) {
      if (j !== 0) {
        parts.push(
          line(mp(-XMAX, j), mp(XMAX, j), CARD, 1)
        );
      }
    }

    parts.push(
      line(mp(-XMAX, 0), mp(XMAX, 0), MUTED, 2),
      line(mp(0, -YMAX), mp(0, YMAX), MUTED, 2)
    );

    for (let v = -3; v <= 3; v++) {
      if (v === 0) continue;

      parts.push(
        line(mp(v, -0.07), mp(v, 0.07), MUTED, 1.5),
        at(
          number(v), P ? 15 : 13, MUTED,
          mp(v, -0.28)[0], mp(v, -0.28)[1],
          true
        )
      );
    }

    for (let v = -2; v <= 2; v++) {
      if (v === 0) continue;

      parts.push(
        line(mp(-0.07, v), mp(0.07, v), MUTED, 1.5),
        at(
          number(v), P ? 15 : 13, MUTED,
          mp(-0.25, v)[0], mp(-0.25, v)[1],
          true
        )
      );
    }

    parts.push(
      at(
        '0', P ? 15 : 14, MUTED,
        mp(-0.23, -0.27)[0], mp(-0.23, -0.27)[1],
        true
      )
    );

    const center = new M.Dot({
      point: O,
      radius: 0.055,
      color: INK
    });

    parts.push(center);

    return new M.VGroup(...parts);
  }

  function xAxisLabel() {
    return at(
      'Mean of first six',
      P ? 15 : 14,
      CYAN,
      mp(2.12, 0.54)[0],
      mp(2.12, 0.54)[1],
      false, P ? 2.65 : 2.45
    );
  }

  function yAxisLabel() {
    return at(
      'Mean of last six',
      P ? 15 : 14,
      AMBER,
      mp(-1.72, 2.65)[0],
      mp(-1.72, 2.65)[1],
      false, P ? 2.65 : 2.20
    );
  }

  // The two members of each pair occupy exactly the same
  // mathematical location. Only their text labels are offset.

  const PAIRS = [
    { names: ['A', 'B'], x: -3, y: -2 },
    { names: ['C', 'D'], x: -3, y:  2 },
    { names: ['E', 'F'], x:  3, y: -2 },
    { names: ['G', 'H'], x:  3, y:  2 }
  ];

  function pairDot(pair) {
    const p = mp(pair.x, pair.y);

    const inward = pair.x < 0 ? 1 : -1;
    const vertical = pair.y > 0 ? -1 : 1;

    const halo = new M.Dot({
      point: p,
      radius: 0.21,
      color: CYAN
    });

    halo.setFill(CYAN, 0.18);

    const outer = new M.Circle({
      radius: 0.12,
      color: CYAN,
      strokeWidth: 2
    });

    outer.moveTo(p);

    const d = new M.Dot({
      point: p,
      radius: 0.072,
      color: INK
    });

    const a = at(
      pair.names[0], 17, INK,
      p[0] + inward * 0.25,
      p[1] + vertical * 0.23,
      true
    );

    const b = at(
      pair.names[1], 17, INK,
      p[0] + inward * 0.51,
      p[1] + vertical * 0.23,
      true
    );

    return new M.VGroup(halo, outer, d, a, b);
  }

  function singleTea(i) {
    const p = mp(MAP[i][0], MAP[i][1]);

    return new M.VGroup(
      glowDot(p, CYAN, 0.10),
      at(
        TEAS[i], 19, INK,
        p[0] + 0.25, p[1] + 0.26,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // 21–27: construct the two-dimensional group-mean map.
  // ------------------------------------------------------------

  const axes = mapAxes();
  const xLab = xAxisLabel();
  const yLab = yAxisLabel();

  await until(S(21));

  await play(
    ...scene(axes),
    ...clearBox(),
    ...say('A MAP OF THE TWO SHARED PATTERNS')
  );

  const xArrow = arrow(mp(0, 0), mp(3.72, 0), CYAN, 3);

  await until(S(22));

  await play(
    ...enter(xLab, xArrow),
    ...fbox([
      ['Across = first six', CYAN],
      'Mean of centered scores',
      ['Tea A:', INK],
      ['−18 ÷ 6 = −3', CYAN]
    ]),
    ...say('HORIZONTAL: FIRST SIX SCORES')
  );

  const yArrow = arrow(mp(0, 0), mp(0, 2.85), AMBER, 3);

  await until(S(23));

  await play(
    ...enter(yLab, yArrow),
    ...fbox([
      ['Up = last six', AMBER],
      'Mean of centered scores',
      ['Tea A:', INK],
      ['−12 ÷ 6 = −2', AMBER]
    ], AMBER),
    ...say('VERTICAL: LAST SIX SCORES', AMBER)
  );

  const aDot = singleTea(0);

  const aGuideX = new M.DashedLine({
    start: mp(0, 0),
    end: mp(-3, 0),
    color: CYAN
  });

  const aGuideY = new M.DashedLine({
    start: mp(-3, 0),
    end: mp(-3, -2),
    color: AMBER
  });

  await until(S(24));

  await play(
    ...enter(aGuideX, aGuideY),
    ...fbox([
      ['Tea A', INK],
      ['Across = −3', CYAN],
      ['Up     = −2', AMBER],
      ['Position: (−3, −2)', GREEN]
    ], GREEN),
    ...say('3 LEFT, 2 DOWN', GREEN)
  );

  await play(
    ...enter(aDot),
    new M.Flash(aDot.submobjects[0].submobjects[1], {
      color: CYAN
    })
  );

  const pairs = PAIRS.map(pairDot);

  await until(S(25));

  picture = picture.filter(o => o !== aDot);
  picture.push(...pairs);

  await play(
    new M.FadeOut(aDot),
    ...leave(aGuideX, aGuideY),
    new M.LaggedStart(
      pairs.map(g => new M.FadeIn(g)),
      { lagRatio: 0.18, runTime: 1.5 }
    ),
    ...clearBox(),
    ...say('PLACE THE OTHER SEVEN TEAS')
  );

  await until(S(26));

  await play(
    new M.LaggedStart(
      pairs.map(g => new M.Indicate(g, { color: GREEN })),
      { lagRatio: 0.15, runTime: 1.5 }
    ),
    ...fbox([
      ['8 teas', INK],
      '4 map positions',
      ['2 teas at each corner', GREEN]
    ], GREEN),
    ...say('FOUR CORNERS, TWO TEAS EACH', GREEN)
  );

  await until(S(27));

  await play(
    ...fbox([
      ['Same map position', INK],
      ['A: Floral 1, Jasmine 3', PINK],
      ['B: Floral 3, Jasmine 1', PINK],
      'Small difference hidden'
    ], PINK),
    new M.Indicate(pairs[0], { color: PINK }),
    ...say('THE FLORAL–JASMINE DETAIL IS HIDDEN', PINK)
  );

  // ------------------------------------------------------------
  // Projection onto a line.
  //
  // For unit direction u = (cos θ, sin θ):
  //     signed position = point · u
  //     shadow = signed position × u
  //
  // One shadow per coincident pair is drawn. Each represents
  // two teas, and both teas enter the variance calculation.
  // ------------------------------------------------------------

  function projection(point, theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    const t = point[0] * c + point[1] * s;

    return {
      t,
      x: t * c,
      y: t * s
    };
  }

  function mapVariance(theta) {
    return mean(MAP.map(p => projection(p, theta).t ** 2));
  }

  function directionLine(theta, color = VIOLET) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    const length = Math.min(
      XMAX / Math.max(Math.abs(c), 1e-8),
      YMAX / Math.max(Math.abs(s), 1e-8)
    );

    return line(
      mp(-length * c, -length * s),
      mp(length * c, length * s),
      color, 4
    );
  }

  function shadowLine(pair, theta) {
    const q = projection([pair.x, pair.y], theta);

    let end = mp(q.x, q.y);
    const start = mp(pair.x, pair.y);

    // Avoid a degenerate zero-length line during a transform.
    if (Math.hypot(end[0] - start[0], end[1] - start[1]) < 0.001) {
      end = pos(end[0] + 0.001, end[1]);
    }

    return line(start, end, VIOLET, 1.6);
  }

  function shadowDot(pair, theta) {
    const q = projection([pair.x, pair.y], theta);
    return glowDot(mp(q.x, q.y), VIOLET, 0.085);
  }

  let theta = -Math.PI / 6;
  let trialLine = directionLine(theta);

  const shadowLines = PAIRS.map(pair => shadowLine(pair, theta));
  const shadowDots = PAIRS.map(pair => shadowDot(pair, theta));

  function turnTo(angle, runTime = 0.46) {
    theta = angle;

    return [
      new M.Transform(
        trialLine,
        directionLine(theta),
        { runTime }
      ),
      ...shadowLines.map((g, i) =>
        new M.Transform(
          g,
          shadowLine(PAIRS[i], theta),
          { runTime }
        )
      ),
      ...shadowDots.map((g, i) =>
        new M.Transform(
          g,
          shadowDot(PAIRS[i], theta),
          { runTime }
        )
      )
    ];
  }

  // ------------------------------------------------------------
  // 28–30: turn the line and watch the projected shadows.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...leave(xArrow, yArrow),
    ...enter(trialLine),
    ...fbox([
      ['A line through zero', VIOLET],
      'Drop each dot directly',
      'onto the line'
    ], VIOLET),
    ...say('EACH DOT CASTS A SHADOW', VIOLET)
  );

  picture.push(...shadowLines, ...shadowDots);

  await play(
    new M.LaggedStart(
      shadowLines.map(g => new M.Create(g)),
      { lagRatio: 0.15, runTime: 1.3 }
    ),
    new M.LaggedStart(
      shadowDots.map(g => new M.FadeIn(g)),
      { lagRatio: 0.15, runTime: 1.3 }
    )
  );

  await until(S(29));

  await play(
    ...turnTo(-Math.PI / 12, 0.48),
    ...say('TURN THE LINE', VIOLET)
  );

  for (const a of [
    0,
    Math.PI / 8,
    Math.PI / 4,
    3 * Math.PI / 8,
    Math.PI / 2
  ]) {
    await play(...turnTo(a, 0.46));
  }

  await until(S(30));

  await play(
    ...turnTo(Math.PI / 4, 0.65),
    ...fbox([
      ['Which direction?', VIOLET],
      'Small spread?',
      'Large spread?',
      ['Find the largest', GREEN]
    ], VIOLET),
    ...say('FIND THE GREATEST SHADOW SPREAD', GREEN)
  );

  // ------------------------------------------------------------
  // 31–34: squared distances and directional variance.
  // ------------------------------------------------------------

  const distanceLeft = doubleArrow(
    mp(-3, 0.63),
    mp(0, 0.63),
    CYAN, 2.5
  );

  const distanceRight = doubleArrow(
    mp(0, 0.63),
    mp(3, 0.63),
    CYAN, 2.5
  );

  const distanceLabels = new M.VGroup(
    at(
      '3', 17, CYAN,
      mp(-1.5, 0.91)[0], mp(-1.5, 0.91)[1],
      true
    ),
    at(
      '3', 17, CYAN,
      mp(1.5, 0.91)[0], mp(1.5, 0.91)[1],
      true
    )
  );

  await until(S(31));

  await play(
    ...turnTo(0, 0.7),
    ...enter(distanceLeft, distanceRight, distanceLabels),
    ...fbox([
      ['Distance from zero', CYAN],
      'Left shadows: 3',
      'Right shadows: 3',
      ['Square each distance', VIOLET]
    ], VIOLET),
    ...say('SQUARE EACH SHADOW’S DISTANCE', VIOLET)
  );

  await until(S(32));

  await play(
    ...fbox([
      ['Squaring a number', VIOLET],
      'Multiply it by itself',
      ['3 × 3 = 9', CYAN],
      ['(−3) × (−3) = 9', CYAN]
    ], VIOLET),
    ...say('SQUARING = MULTIPLY BY ITSELF', VIOLET)
  );

  await until(S(33));

  await play(
    ...leave(distanceLeft, distanceRight, distanceLabels),
    ...fbox([
      ['Map-direction variance', VIOLET],
      'Mean of squared positions',
      '(9 + 9 + … + 9) ÷ 8',
      [`= ${mapVariance(0).toFixed(0)}`, CYAN]
    ], VIOLET),
    ...say('VARIANCE = MEAN SQUARED DISTANCE', VIOLET)
  );

  const mapHorizontal = directionLine(0, CYAN);
  const mapVertical = directionLine(Math.PI / 2, AMBER);

  await until(S(34));

  await play(
    ...turnTo(Math.PI / 2, 0.55),
    ...fbox([
      ['Horizontal: variance 9', CYAN],
      ['Vertical:   variance 4', AMBER],
      ['Largest on map: 9', GREEN]
    ], GREEN),
    ...say('HORIZONTAL HAS THE GREATEST VARIANCE', CYAN)
  );

  await play(
    ...turnTo(0, 0.55),
    ...leave(trialLine),
    ...enter(mapHorizontal)
  );

  // ------------------------------------------------------------
  // Return from the 2D teaching map to the 12-dimensional data.
  //
  // The group means are ±3 and ±2.
  // Unit-length PCA positions are ±3√6 and ±2√6.
  // Their squared positions are 54 and 24 respectively.
  // ------------------------------------------------------------

  const returnTable = scoreTable(Z, true);

  await until(S(35));

  await play(
    ...scene(returnTable.group),
    ...fbox([
      ['Map: 2 group means', MUTED],
      ['Original data: 12 attributes', INK],
      'Consider all 12 changes'
    ]),
    ...say('RETURN TO ALL 12 ATTRIBUTES')
  );

  // ------------------------------------------------------------
  // Separate pattern vectors.
  //
  // These pictures show the contributions of a single shared
  // direction, not the full centered tasting profile.
  // ------------------------------------------------------------

  const PX = j => CX + (j - 5.5) * (P ? 0.535 : 0.54);

  function patternRow(values, base, title, patternColor) {
    const parts = [];

    const barScale = P ? 0.25 : 0.145;
    const maxBar = 3 * barScale;

    const titleY = base + maxBar + (P ? 0.30 : 0.23);
    const numY = base - maxBar - (P ? 0.24 : 0.18);

    parts.push(
      at(
        title, P ? 18 : 16,
        patternColor, CX, titleY,
        false, MAIN_W - 0.25
      )
    );

    parts.push(
      line(
        pos(PX(0) - 0.34, base),
        pos(PX(11) + 0.34, base),
        MUTED, 2
      )
    );

    for (let j = 0; j < 12; j++) {
      const v = values[j];
      const color = v === 0 ? MUTED : patternColor;

      parts.push(
        glowingBar(
          PX(j), base, v,
          barScale, P ? 0.33 : 0.31,
          color
        )
      );

      parts.push(
        at(
          signed(v), P ? 15 : 13,
          color, PX(j), numY,
          true, 0.49
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function twoPatterns(positive, negative, names, color) {
    const topBase = P ? 0.30 : 0.36;
    const bottomBase = P ? -2.12 : -1.28;

    const top = patternRow(
      positive, topBase,
      names[0], color
    );

    const bottom = patternRow(
      negative, bottomBase,
      names[1], color
    );

    const labels = new M.VGroup(
      ...SHORT.map((s, j) =>
        at(
          s, P ? 15 : 11,
          ac(j), PX(j),
          P ? -3.67 : -2.35,
          false, 0.50
        )
      )
    );

    return new M.VGroup(top, bottom, labels);
  }

  const firstPlus = ATTRS.map((_, j) => j < 6 ? 3 : 0);
  const firstMinus = firstPlus.map(v => -v);

  const firstPattern = twoPatterns(
    firstPlus,
    firstMinus,
    ['E, F, G, H: first shared change', 'A, B, C, D: opposite change'],
    CYAN
  );

  // ------------------------------------------------------------
  // 36: first shared direction, six equal contributions.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...scene(firstPattern),
    ...fbox([
      ['First shared direction', CYAN],
      '+3 or −3 in first six',
      '0 in the last six',
      ['One direction of change', CYAN]
    ]),
    ...say('FIRST SIX CHANGE BY +3 OR −3')
  );

  // ------------------------------------------------------------
  // Square tiles: picture of each squared contribution.
  //
  // Every tile is subdivided into unit squares.
  // ------------------------------------------------------------

  function squareTile(x, y, n, color) {
    const cell = P ? 0.205 : 0.175;
    const parts = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        parts.push(
          rect(
            x + (c - (n - 1) / 2) * cell,
            y + (r - (n - 1) / 2) * cell,
            cell * 0.88,
            cell * 0.88,
            color, 0.82, 1
          )
        );
      }
    }

    const label = at(
      String(n * n), 18, color,
      x, y - n * cell / 2 - 0.27,
      true
    );

    return new M.VGroup(...parts, label);
  }

  function squarePicture(n, indices, color, count = indices.length) {
    const spacing = P ? 0.94 : 0.94;
    const y = P ? -0.75 : -0.38;
    const parts = [];

    for (let k = 0; k < count; k++) {
      const j = indices[k];
      const x = CX + (k - (count - 1) / 2) * spacing;

      parts.push(squareTile(x, y, n, color));

      parts.push(
        at(
          SHORT[j], P ? 15 : 13,
          color, x, y + 0.68,
          false, 0.86
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function totalTag(s, color) {
    const tag = pill(s, color, 18);
    tag.moveTo(pos(CX, P ? -2.65 : -1.77));
    return tag;
  }

  // ------------------------------------------------------------
  // 37–39: first principal direction variance = 54.
  // ------------------------------------------------------------

  const oneNine = squarePicture(3, [0], CYAN, 1);

  await until(S(37));

  await play(
    ...scene(oneNine),
    ...fbox([
      ['One change of 3', CYAN],
      ['3 × 3 = 9', CYAN],
      '(−3)² is also 9'
    ]),
    ...say('3 × 3 = 9')
  );

  const sixNines = squarePicture(
    3, [0, 1, 2, 3, 4, 5], CYAN
  );

  const total54 = totalTag('54 SQUARED UNITS', CYAN);

  await until(S(38));

  await play(
    ...scene(sixNines, total54),
    ...fbox([
      ['Six equal contributions', CYAN],
      '9 + 9 + 9 + 9 + 9 + 9',
      ['6 × 9 = 54', CYAN]
    ]),
    ...say('SIX COPIES OF 9 MAKE 54')
  );

  function teaSquaredRow(value, color) {
    const y = P ? -3.75 : -2.26;
    const parts = [];

    TEAS.forEach((name, i) => {
      const x = CX + (i - 3.5) * (P ? 0.78 : 0.76);

      const box = outline(
        x, y, P ? 0.70 : 0.66,
        P ? 0.75 : 0.49,
        color, 0.42
      );

      parts.push(
        box,
        at(
          name, P ? 15 : 12, INK,
          x, y + (P ? 0.17 : 0.11),
          true
        ),
        at(
          value, P ? 19 : 15, color,
          x, y - (P ? 0.15 : 0.11),
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const all54 = teaSquaredRow(54, CYAN);

  await until(S(39));

  await play(
    ...enter(all54),
    ...fbox([
      ['Unit-direction position', MUTED],
      '±3√6; squared = 54',
      'Variance = (8 × 54) ÷ 8',
      [`= ${VARS[0]}`, CYAN]
    ]),
    ...say('FIRST DIRECTION: VARIANCE 54')
  );

  // ------------------------------------------------------------
  // 40–41: second principal direction variance = 24.
  // ------------------------------------------------------------

  const secondPlus = ATTRS.map((_, j) => j >= 6 ? 2 : 0);
  const secondMinus = secondPlus.map(v => -v);

  const secondPattern = twoPatterns(
    secondPlus,
    secondMinus,
    ['C, D, G, H: second shared change', 'A, B, E, F: opposite change'],
    AMBER
  );

  await until(S(40));

  await play(
    ...scene(secondPattern),
    ...fbox([
      ['Second shared direction', AMBER],
      '0 in the first six',
      '+2 or −2 in last six'
    ], AMBER),
    ...say('LAST SIX CHANGE BY +2 OR −2', AMBER)
  );

  const sixFours = squarePicture(
    2, [6, 7, 8, 9, 10, 11], AMBER
  );

  const total24 = totalTag('24 SQUARED UNITS', AMBER);
  const all24 = teaSquaredRow(24, AMBER);

  await until(S(41));

  await play(
    ...scene(sixFours, total24, all24),
    ...fbox([
      ['2 × 2 = 4', AMBER],
      '6 × 4 = 24',
      'Variance = (8 × 24) ÷ 8',
      [`= ${VARS[1]}`, AMBER]
    ], AMBER),
    ...say('SECOND DIRECTION: VARIANCE 24', AMBER)
  );

  // ------------------------------------------------------------
  // 42–43: third principal direction, Floral–Jasmine contrast.
  // ------------------------------------------------------------

  const thirdPlus = ATTRS.map((_, j) =>
    j === 0 ? 1 : j === 1 ? -1 : 0
  );

  const thirdMinus = thirdPlus.map(v => -v);

  const thirdPattern = twoPatterns(
    thirdPlus,
    thirdMinus,
    ['B, D, F, H: Floral +1, Jasmine −1',
     'A, C, E, G: Floral −1, Jasmine +1'],
    PINK
  );

  await until(S(42));

  await play(
    ...scene(thirdPattern),
    ...fbox([
      ['Remaining small pattern', PINK],
      'Floral and jasmine',
      'change in opposite ways',
      ['+1 and −1', PINK]
    ], PINK),
    ...say('FLORAL AND JASMINE: OPPOSITE CHANGES', PINK)
  );

  const twoOnes = squarePicture(1, [0, 1], PINK);
  const total2 = totalTag('2 SQUARED UNITS', PINK);
  const all2 = teaSquaredRow(2, PINK);

  await until(S(43));

  await play(
    ...scene(twoOnes, total2, all2),
    ...fbox([
      ['1 × 1 + 1 × 1 = 2', PINK],
      'Variance = (8 × 2) ÷ 8',
      [`= ${VARS[2]}`, PINK]
    ], PINK),
    ...say('THIRD DIRECTION: VARIANCE 2', PINK)
  );

  // ------------------------------------------------------------
  // Comparison of the three directional variances.
  // All three directions are mutually perpendicular.
  // ------------------------------------------------------------

  function varianceBars() {
    const maxWidth = P ? 5.15 : 4.95;
    const left = CX - maxWidth / 2 + 0.05;

    const names = [
      'First six together',
      'Last six together',
      'Floral–Jasmine'
    ];

    const colors = [CYAN, AMBER, PINK];

    const top = P ? 0.25 : 0.62;
    const pitch = P ? 1.43 : 1.00;

    const parts = [];
    const bars = [];

    for (let i = 0; i < 3; i++) {
      const y = top - i * pitch;
      const w = maxWidth * VARS[i] / 54;
      const h = P ? 0.36 : 0.29;

      parts.push(
        at(
          names[i], P ? 18 : 16,
          colors[i], CX, y + 0.45,
          false, MAIN_W - 0.4
        )
      );

      const track = rect(
        left + maxWidth / 2,
        y, maxWidth, h,
        CARD, 0.75, 0
      );

      const halo = rect(
        left + w / 2,
        y, w + 0.04, h + 0.09,
        colors[i], 0.12, 0
      );

      const bar = rect(
        left + w / 2,
        y, w, h,
        colors[i], 0.88, 1
      );

      const value = at(
        VARS[i], 20, colors[i],
        left + maxWidth + 0.40,
        y, true
      );

      bars.push(new M.VGroup(track, halo, bar, value));
      parts.push(bars[i]);
    }

    const baseY = top - 2 * pitch - 0.55;

    parts.push(
      at(
        'Variance along unit-length directions',
        P ? 15 : 14,
        MUTED, CX, baseY,
        false, MAIN_W - 0.3
      )
    );

    return {
      group: new M.VGroup(...parts),
      bars
    };
  }

  const comparison = varianceBars();

  // ------------------------------------------------------------
  // 44: three separate directions, three variances.
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...scene(comparison.group),
    ...fbox([
      ['First direction  = 54', CYAN],
      ['Second direction = 24', AMBER],
      ['Third direction  = 2', PINK],
      'Other directions = 0'
    ]),
    ...say('THREE SEPARATE DIRECTIONS')
  );

  // ------------------------------------------------------------
  // 45: all combinations of the three independent signs.
  // ------------------------------------------------------------

  function signCombinationTable() {
    const x = [
      CX - 2.05,
      CX - 0.72,
      CX + 0.65,
      CX + 2.02
    ];

    const yTop = P ? 0.95 : 0.80;
    const pitch = P ? 0.60 : 0.36;

    const colors = [INK, CYAN, AMBER, PINK];
    const heads = ['Tea', 'First', 'Second', 'Small'];

    const parts = [];

    heads.forEach((s, j) => {
      parts.push(
        at(s, P ? 17 : 15, colors[j], x[j], yTop + 0.45)
      );
    });

    for (let i = 0; i < 8; i++) {
      const y = yTop - i * pitch;

      const values = [
        TEAS[i],
        SCORES[i][0] > 0 ? '+3' : '−3',
        SCORES[i][1] > 0 ? '+2' : '−2',
        SCORES[i][2] > 0 ? '+1' : '−1'
      ];

      for (let j = 0; j < 4; j++) {
        const cell = outline(
          x[j], y,
          P ? 1.09 : 1.08,
          pitch * 0.83,
          colors[j], 0.24
        );

        parts.push(cell);

        parts.push(
          at(
            values[j], P ? 19 : 16,
            colors[j], x[j], y, true
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  const combinations = signCombinationTable();

  await until(S(45));

  await play(
    ...scene(combinations),
    ...fbox([
      ['8 equally frequent combinations', GREEN],
      'Two signs for each pattern',
      '2 × 2 × 2 = 8',
      'No shared cross-variation'
    ], GREEN),
    ...say('ALL EIGHT SIGN COMBINATIONS', GREEN)
  );

  // ------------------------------------------------------------
  // 46: mixing directions cannot exceed the largest variance.
  //
  // For a unit-length mixed direction aU1 + bU2 + cU3:
  // variance = 54a² + 24b² + 2c²,
  // with a² + b² + c² = 1.
  //
  // Illustrate this using an equal-length mixture of the first
  // two directions: variance = 39.
  // ------------------------------------------------------------

  const mixComparison = varianceBars();

  function mixExample() {
    const maxw = P ? 5.15 : 4.95;
    const x0 = CX - maxw / 2 + 0.05;
    const y = P ? -3.70 : -2.13;
    const h = P ? 0.31 : 0.23;

    const v1 = 54 / 2;
    const v2 = 24 / 2;

    const w1 = maxw * v1 / 54;
    const w2 = maxw * v2 / 54;

    return new M.VGroup(
      rect(x0 + maxw / 2, y, maxw, h, CARD, 0.65, 0),
      rect(x0 + w1 / 2, y, w1, h, CYAN, 0.88, 1),
      rect(x0 + w1 + w2 / 2, y, w2, h, AMBER, 0.88, 1),

      at(
        'Half of 54 + half of 24',
        P ? 16 : 14, INK,
        CX, y + 0.36,
        false, MAIN_W - 0.4
      ),

      at(
        '39', 19, GREEN,
        x0 + maxw + 0.40, y, true
      )
    );
  }

  const mix = mixExample();

  await until(S(46));

  await play(
    ...scene(mixComparison.group, mix),
    ...fbox([
      ['Unit-length mixture', GREEN],
      'Weighted mean of variances',
      'Example: 27 + 12 = 39',
      ['Cannot exceed 54', CYAN]
    ], GREEN),
    ...say('NO MIXTURE CAN BEAT 54', GREEN)
  );

  // ------------------------------------------------------------
  // 47–49: first and second principal components.
  //
  // Reuse the group-mean map to show directions visually.
  // The geometry agrees with the principal directions because
  // both attribute groups contain six attributes.
  // ------------------------------------------------------------

  function principalAxis(which) {
    if (which === 0) {
      return doubleArrow(
        mp(-3.75, 0),
        mp(3.75, 0),
        CYAN, 4
      );
    }

    return doubleArrow(
      mp(0, -2.85),
      mp(0, 2.85),
      AMBER, 4
    );
  }

  function rightAngle() {
    const k = 0.35;

    return new M.VGroup(
      line(mp(k, 0), mp(k, k), INK, 2),
      line(mp(k, k), mp(0, k), INK, 2)
    );
  }

  function componentLabel(text, color, x, y) {
    const tag = pill(text, color, P ? 15 : 14);
    tag.moveTo(mp(x, y));
    return tag;
  }

  const pcAxes = mapAxes();
  const pcPairs = PAIRS.map(pairDot);

  const pc1 = principalAxis(0);
  const pc2 = principalAxis(1);

  const pc1Tag = componentLabel('PC1', CYAN, 2.58, 0.60);
  const pc2Tag = componentLabel('PC2', AMBER, 0.66, 2.61);

  const perpendicular = rightAngle();

  await until(S(47));

  await play(
    ...scene(pcAxes, ...pcPairs, pc1, pc1Tag),
    ...fbox([
      ['Principal component 1', CYAN],
      'Direction of largest variance',
      ['First six change together', CYAN],
      ['Variance = 54', CYAN]
    ]),
    ...say('PC1: THE LARGEST PATTERN')
  );

  await until(S(48));

  await play(
    ...enter(pc2, pc2Tag, perpendicular),
    ...fbox([
      ['Principal component 2', AMBER],
      'At a right angle to PC1',
      'Largest remaining variance',
      ['Independent direction', AMBER]
    ], AMBER),
    ...say('PC2: AT A RIGHT ANGLE TO PC1', AMBER)
  );

  await until(S(49));

  await play(
    new M.Indicate(pc2, { color: AMBER }),
    ...fbox([
      ['PC1: first six together', CYAN],
      ['Variance = 54', CYAN],
      ['PC2: last six together', AMBER],
      ['Variance = 24', AMBER]
    ]),
    ...say('PC2 DESCRIBES THE LAST SIX', AMBER)
  );

  // ------------------------------------------------------------
  // 50: formula for variance along a unit-length direction.
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    ...fbox([
      ['Variance along a direction', VIOLET],
      'Sum of squared centered',
      'positions ÷ number of teas',
      ['PC1: (8 × 54) ÷ 8 = 54', CYAN]
    ], VIOLET),
    ...say('VARIANCE = SUM OF SQUARES ÷ COUNT', VIOLET)
  );

  // ------------------------------------------------------------
  // 51: Principal Component Analysis.
  // ------------------------------------------------------------

  await until(S(51));

  await play(
    ...fbox([
      ['PCA', GREEN],
      'Principal',
      'Component',
      'Analysis'
    ], GREEN),
    ...say('PRINCIPAL COMPONENT ANALYSIS', GREEN)
  );

  // ------------------------------------------------------------
  // 52: many attributes, fewer numbers.
  //
  // Show the original twelve scores and the two genuine
  // unit-length PCA scores, not the group-mean coordinates.
  // ------------------------------------------------------------

  function compressionPicture() {
    const parts = [];

    const topY = P ? 0.70 : 0.95;
    const base = P ? -0.92 : -0.20;

    parts.push(
      at('Tea A: original profile', 19, INK, CX, topY)
    );

    for (let j = 0; j < 12; j++) {
      parts.push(
        glowingBar(
          PX(j), base, D[0][j],
          P ? 0.27 : 0.24,
          0.31, ac(j)
        )
      );

      parts.push(
        at(
          D[0][j], 15, ac(j),
          PX(j), base + D[0][j] * (P ? 0.27 : 0.24) + 0.19,
          true
        )
      );

      parts.push(
        at(
          SHORT[j], P ? 15 : 11,
          ac(j), PX(j), base - 0.25,
          false, 0.49
        )
      );
    }

    parts.push(
      line(
        pos(PX(0) - 0.29, base),
        pos(PX(11) + 0.29, base),
        MUTED, 2
      )
    );

    const arrowTop = P ? -1.43 : -0.68;
    const arrowBottom = P ? -2.06 : -1.15;

    parts.push(
      arrow(
        pos(CX, arrowTop),
        pos(CX, arrowBottom),
        GREEN, 3
      )
    );

    const y = P ? -2.90 : -1.85;

    const colors = [CYAN, AMBER];

    const values = [
      SCORES[0][0].toFixed(2).replace('-', '−'),
      SCORES[0][1].toFixed(2).replace('-', '−')
    ];

    for (let j = 0; j < 2; j++) {
      const x = CX + (j - 0.5) * 2.35;

      const box = outline(
        x, y, 1.95,
        P ? 1.20 : 0.83,
        colors[j], 0.75
      );

      parts.push(box);

      parts.push(
        at(
          `PC${j + 1}`, 16, colors[j],
          x, y + (P ? 0.29 : 0.19)
        )
      );

      parts.push(
        at(
          values[j], P ? 26 : 22,
          colors[j],
          x, y - (P ? 0.18 : 0.16),
          true
        )
      );
    }

    parts.push(
      at(
        '12 original scores → 2 component scores',
        P ? 16 : 14,
        GREEN, CX,
        P ? -4.00 : -2.43,
        false, MAIN_W - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  const compressed = compressionPicture();

  await until(S(52));

  await play(
    ...scene(compressed),
    ...fbox([
      ['Many changing attributes', INK],
      'Find shared directions',
      'Keep useful components',
      ['Fewer numbers per tea', GREEN]
    ], GREEN),
    ...say('DESCRIBE MANY ATTRIBUTES WITH FEWER NUMBERS', GREEN)
  );

  // ------------------------------------------------------------
  // 53: largest variance does not mean greatest importance.
  //
  // Teas A and B have identical first two PCA scores, but
  // different Floral and Jasmine attributes.
  // ------------------------------------------------------------

  function importancePicture() {
    const parts = [];

    const xs = [CX - 1.68, CX + 1.68];
    const base = P ? -1.10 : -0.83;
    const scale = P ? 0.48 : 0.37;

    for (let k = 0; k < 2; k++) {
      const x = xs[k];
      const values = [D[k][0], D[k][1]];

      const card = outline(
        x,
        P ? -0.25 : -0.27,
        P ? 2.90 : 2.92,
        P ? 2.70 : 2.18,
        PINK,
        0.52
      );

      parts.push(card);

      parts.push(
        at(
          `Tea ${TEAS[k]}`,
          21, INK,
          x, P ? 0.95 : 0.62
        )
      );

      const barXs = [x - 0.54, x + 0.54];

      for (let j = 0; j < 2; j++) {
        parts.push(
          glowingBar(
            barXs[j], base, values[j],
            scale, 0.50, PINK
          )
        );

        parts.push(
          at(
            values[j], 18, PINK,
            barXs[j],
            base + values[j] * scale + 0.20,
            true
          )
        );

        parts.push(
          at(
            j === 0 ? 'Floral' : 'Jasmine',
            P ? 15 : 14,
            PINK, barXs[j], base - 0.27,
            false, 1.01
          )
        );
      }
    }

    parts.push(
      at(
        'Same first two component scores',
        P ? 18 : 16, CYAN,
        CX, P ? -2.35 : -1.76,
        false, MAIN_W - 0.35
      )
    );

    parts.push(
      at(
        'Different floral and jasmine smells',
        P ? 18 : 16, PINK,
        CX, P ? -2.96 : -2.16,
        false, MAIN_W - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  const importantDetail = importancePicture();

  await until(S(53));

  await play(
    ...scene(importantDetail),
    ...fbox([
      ['Large variance ≠ importance', AMBER],
      'A customer may care most',
      ['about jasmine versus floral', PINK],
      'Your question decides'
    ], AMBER),
    ...say('LARGEST VARIANCE IS NOT ALWAYS MOST IMPORTANT', AMBER)
  );

  // ------------------------------------------------------------
  // 54: final visual summary.
  // ------------------------------------------------------------

  const finalAxes = mapAxes();
  const finalPairs = PAIRS.map(pairDot);

  const finalPC1 = principalAxis(0);
  const finalPC2 = principalAxis(1);

  const finalTag1 = componentLabel(
    'PC1 · 54', CYAN, 2.35, 0.61
  );

  const finalTag2 = componentLabel(
    'PC2 · 24', AMBER, 0.91, 2.62
  );

  const finalRightAngle = rightAngle();

  await until(S(54));

  await play(
    ...scene(
      finalAxes,
      ...finalPairs,
      finalPC1,
      finalPC2,
      finalTag1,
      finalTag2,
      finalRightAngle
    ),
    ...fbox([
      ['Principal components', GREEN],
      'Largest patterns of change',
      'Many original attributes',
      ['Fewer descriptive numbers', GREEN]
    ], GREEN),
    ...say('PCA: LARGEST PATTERNS, FEWER NUMBERS', GREEN)
  );

  // Leave the final picture visible until the narration ends.
  await until(E(54));

  // Integration note: this scene follows the supplied engine
  // interface and approved animation conventions. Browser
  // playback and device rendering require verification in
  // the actual course engine.
}

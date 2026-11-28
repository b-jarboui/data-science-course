// lesson 13.1.2
// Multiclass softmax: turning scores into probabilities.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses exact shared chapter data and unrounded calculations.
// Try it beats are narrated previews of the separate interactive activity.
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

  const COLORS = [PLUM, APPLE, PEAR];
  const NAMES = ['Plum', 'Apple', 'Pear'];
  const LABELS = ['PLUM', 'APPLE', 'PEAR'];

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Phone content bounds: y = -5.5 to 4.3.
  // Laptop content bounds: y = -3.0 to 2.3.

  const SP = P ? 2.05 : 1.93;

  const colx = i => CX + (i - 1) * SP;

  const FR = P ? 0.17 : 0.145;

  const RAW_BASE = P ? -3.30 : -1.55;
  const RAW_SCALE = P ? 1.75 : 0.85;

  const EXP_BASE = P ? -3.85 : -1.65;
  const EXP_SCALE = P ? 0.60 : 0.32;

  const BW = P ? 0.98 : 0.90;

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

  // Illustrative scores from an already fitted sorter.
  // These scores are not calculated from an invented model.

  const SCORES = [2, 1, 0];

  const EXP = SCORES.map(s => Math.exp(s));

  const TOTAL = EXP.reduce((a, b) => a + b, 0);

  const PROBS = EXP.map(v => v / TOTAL);

  // Numerically stable softmax for the Try it demonstrations.
  // Subtracting the maximum prevents unnecessary overflow.

  function softmax(scores) {
    const maximum = Math.max(...scores);

    const values = scores.map(s =>
      Math.exp(s - maximum)
    );

    const total = values.reduce((a, b) => a + b, 0);

    return values.map(v => v / total);
  }

  function winner(scores) {
    const maximum = Math.max(...scores);

    const winners = scores
      .map((s, i) => s === maximum ? i : -1)
      .filter(i => i >= 0);

    return winners.length === 1
      ? winners[0]
      : -1;
  }

  const pct = p => `${(100 * p).toFixed(1)}%`;

  const num = n => n < 0
    ? '−' + String(Math.abs(n))
    : String(n);

  const fixed = (n, places = 2) =>
    n.toFixed(places);

  // ============================================================
  // BASIC VISUAL HELPERS
  // ============================================================

  function text(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);

    t.moveTo(p);

    return t;
  }

  function line(start, end, color = C.muted, width = 2) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function rect(w, h, p, color, opacity = 1, stroke = 1) {
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

  function rounded(w, h, p, color, opacity = 0.92) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.15,
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

  function reveal(objects, runTime = 1.0, lagRatio = 0.12) {
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
      T('0000000000', size, C.ink, true).getWidth() / 10;

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

    const left = BOXP[0] - wd / 2 + 0.325;

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

    const animations = [];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    animations.push(new M.FadeIn(g));

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

  // Construct the pear triangle using the same Line primitive
  // as the approved reference, without requiring extra APIs.

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

      const yy = top[1] + a * (left[1] - top[1]);
      const ww = r * 0.95 * a;

      fill.push(
        line(
          [x - ww, yy, 0],
          [x + ww, yy, 0],
          color,
          3
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
    const color =
      label === 'plum' ? PLUM :
      label === 'apple' ? APPLE :
      PEAR;

    const halo = new M.Dot({
      point: p,
      radius: r * 1.65,
      color
    });

    halo.setFill(color, 0.13);

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
      body = triangle(p, r * 1.12, color);
    }

    return new M.VGroup(halo, body);
  }

  function unknown(p, r = FR * 1.3) {
    const outer = new M.Dot({
      point: p,
      radius: r * 1.9,
      color: WHITE
    });

    outer.setFill(WHITE, 0.09);

    const inner = new M.Dot({
      point: p,
      radius: r * 1.4,
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

    return new M.VGroup(outer, inner, body);
  }

  function placeholder(p) {
    const d = new M.Circle({
      radius: FR * 0.75,
      color: C.muted,
      strokeWidth: 1.5
    });

    d.setFill(C.muted, 0.35);
    d.moveTo(p);

    return d;
  }

  // ============================================================
  // PACKING STATION AND THREE BASKETS
  // ============================================================

  const STATION_Y = P ? -0.30 : 0.72;
  const BASKET_Y = P ? -3.90 : -1.23;

  function station() {
    const belt = rounded(
      SP * 2 + 1.80,
      0.44,
      [CX, STATION_Y, 0],
      C.muted,
      0.9
    );

    const rollers = Array.from(
      { length: 12 },
      (_, i) => {
        const x = CX + (i - 5.5) * 0.45;

        const c = new M.Circle({
          radius: 0.105,
          color: C.muted,
          strokeWidth: 1.5
        });

        c.setFill(C.card, 1);
        c.moveTo([x, STATION_Y, 0]);

        return c;
      }
    );

    const title = text(
      'FRUIT PACKING STATION',
      18,
      C.ink,
      [CX, STATION_Y + 0.43, 0],
      true
    );

    return new M.VGroup(
      belt,
      ...rollers,
      title
    );
  }

  function basket(i) {
    const x = colx(i);
    const color = COLORS[i];

    const w = P ? 1.73 : 1.64;
    const h = P ? 1.45 : 1.30;

    const body = rounded(
      w,
      h,
      [x, BASKET_Y, 0],
      color,
      0.80
    );

    const rim = line(
      [x - w / 2 - 0.06, BASKET_Y + h / 2, 0],
      [x + w / 2 + 0.06, BASKET_Y + h / 2, 0],
      color,
      3
    );

    const slats = [-0.48, 0, 0.48].map(v =>
      line(
        [x + v, BASKET_Y - h / 2 + 0.05, 0],
        [x + v, BASKET_Y - h / 2 + 0.18, 0],
        color,
        1.5
      )
    );

    const label = tag(
      LABELS[i] + 'S',
      color,
      [x, BASKET_Y - h / 2 - 0.34, 0],
      P ? 16 : 17
    );

    return new M.VGroup(
      body,
      rim,
      ...slats,
      label
    );
  }

  function basketSlot(group, j) {
    const x =
      colx(group) +
      ((j % 2) - 0.5) * 0.62;

    const y =
      BASKET_Y +
      (0.5 - Math.floor(j / 2)) * 0.57;

    return [x, y, 0];
  }

  const packingStation = station();

  const baskets = [0, 1, 2].map(basket);

  const placeholders = DATA.map((_, i) =>
    placeholder(
      basketSlot(
        Math.floor(i / 4),
        i % 4
      )
    )
  );

  const knownFruits = DATA.map((d, i) =>
    fruit(
      d.label,
      basketSlot(
        Math.floor(i / 4),
        i % 4
      )
    )
  );

  function firmnessIndicator(value) {
    const y = P ? -0.35 : -0.12;

    const title = text(
      'Firmness',
      17,
      C.ink,
      [CX - 1.55, y, 0]
    );

    const steps = Array.from(
      { length: 4 },
      (_, i) => {
        const x = CX - 0.15 + i * 0.40;

        const block = rect(
          0.32,
          0.27,
          [x, y, 0],
          i < value ? C.cyan : C.muted,
          i < value ? 0.9 : 0.12,
          1.5
        );

        const label = text(
          String(i + 1),
          15,
          i < value ? WHITE : C.muted,
          [x, y, 0],
          true
        );

        return new M.VGroup(block, label);
      }
    );

    const soft = text(
      'soft',
      15,
      C.muted,
      [CX - 0.35, y - 0.28, 0]
    );

    const firm = text(
      'firm',
      15,
      C.muted,
      [CX + 1.25, y - 0.28, 0]
    );

    return new M.VGroup(
      title,
      ...steps,
      soft,
      firm
    );
  }

  // ============================================================
  // SCORE CARDS
  // ============================================================

  const CARD_Y = P ? -3.00 : -0.50;

  function scoreCard(i, value = null) {
    const x = colx(i);
    const c = COLORS[i];

    const w = P ? 1.74 : 1.65;
    const h = P ? 1.80 : 1.65;

    const body = rounded(
      w,
      h,
      [x, CARD_Y, 0],
      c,
      0.94
    );

    const icon = fruit(
      NAMES[i].toLowerCase(),
      [x, CARD_Y + 0.49, 0],
      FR
    );

    const label = text(
      NAMES[i],
      18,
      c,
      [x, CARD_Y + 0.12, 0]
    );

    const number = text(
      value === null ? '?' : num(value),
      P ? 34 : 32,
      value === null ? C.muted : c,
      [x, CARD_Y - 0.40, 0],
      true
    );

    return new M.VGroup(
      body,
      icon,
      label,
      number
    );
  }

  // ============================================================
  // BAR CHART HELPERS
  // ============================================================

  function bar(i, value, base, scale, display) {
    const c = COLORS[i];
    const x = colx(i);

    const h = Math.abs(value) * scale;
    const visibleHeight = Math.max(h, 0.018);

    const y = value === 0
      ? base + visibleHeight / 2
      : base + Math.sign(value) * visibleHeight / 2;

    const body = rect(
      BW,
      visibleHeight,
      [x, y, 0],
      c,
      value === 0 ? 0.90 : 0.82,
      1.2
    );

    const labelY = value >= 0
      ? base + h + 0.24
      : base + 0.25;

    const label = text(
      display === undefined ? num(value) : display,
      P ? 22 : 21,
      c,
      [x, labelY, 0],
      true
    );

    return new M.VGroup(body, label);
  }

  function rawBar(i, value) {
    return bar(
      i,
      value,
      RAW_BASE,
      RAW_SCALE
    );
  }

  function expBar(i, value) {
    return bar(
      i,
      value,
      EXP_BASE,
      EXP_SCALE,
      fixed(value, 3)
    );
  }

  function chartFrame(mode = 'raw') {
    const isRaw = mode === 'raw';

    const base = isRaw
      ? RAW_BASE
      : EXP_BASE;

    const labelY = isRaw
      ? (P ? -4.85 : -2.67)
      : base - 0.47;

    const titleY = P ? 1.20 : 1.20;

    const parts = [
      line(
        [colx(0) - 0.75, base, 0],
        [colx(2) + 0.75, base, 0],
        C.muted,
        2
      ),

      text(
        isRaw
          ? 'RAW SCORES'
          : 'POSITIVE NUMBERS: e RAISED TO SCORE',
        P ? 17 : 16,
        C.ink,
        [CX, titleY, 0],
        true
      ),

      text(
        '0',
        15,
        C.muted,
        [colx(0) - 0.95, base, 0],
        true
      )
    ];

    NAMES.forEach((name, i) => {
      parts.push(
        fruit(
          name.toLowerCase(),
          [colx(i), labelY + 0.31, 0],
          FR * 0.75
        )
      );

      parts.push(
        text(
          name,
          18,
          COLORS[i],
          [colx(i), labelY, 0]
        )
      );

      if (!isRaw) {
        parts.push(
          text(
            `score = ${SCORES[i]}`,
            P ? 18 : 15,
            C.muted,
            [colx(i), labelY - 0.29, 0],
            true
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  function barOutline(i, value, base, scale) {
    const h = Math.abs(value) * scale;

    const bottom = Math.min(
      base,
      base + value * scale
    );

    const top = Math.max(
      base,
      base + value * scale
    ) + 0.48;

    return rounded(
      BW + 0.36,
      Math.max(top - bottom + 0.12, 0.55),
      [
        colx(i),
        (top + bottom) / 2,
        0
      ],
      GOLD,
      0
    );
  }

  // ============================================================
  // ONE HUNDRED BLOCKS
  // ============================================================

  // A block represents exactly 1% of the whole.
  // Fill pieces use exact probabilities, including fractional
  // parts of the blocks where neighbouring shares meet.

  const GRID_COLS = 10;
  const GRID_ROWS = 10;

  const GPITCH = P ? 0.50 : 0.30;
  const GSIDE = GPITCH * 0.84;

  const GCY = P ? -1.55 : -0.40;

  function cellPosition(i) {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;

    return [
      CX + (col - (GRID_COLS - 1) / 2) * GPITCH,
      GCY + ((GRID_ROWS - 1) / 2 - row) * GPITCH,
      0
    ];
  }

  function neutralGrid() {
    const blocks = Array.from(
      { length: 100 },
      (_, i) => rect(
        GSIDE,
        GSIDE,
        cellPosition(i),
        C.muted,
        0.16,
        1
      )
    );

    return new M.VGroup(...blocks);
  }

  function neutralGridReveal() {
    const blocks = Array.from(
      { length: 100 },
      (_, i) => rect(
        GSIDE,
        GSIDE,
        cellPosition(i),
        C.muted,
        0.16,
        1
      )
    );

    const rows = Array.from(
      { length: 10 },
      (_, row) => new M.VGroup(
        ...blocks.slice(row * 10, row * 10 + 10)
      )
    );

    return {
      rows,
      animation: new M.LaggedStart(
        rows.map(r => new M.FadeIn(r)),
        { lagRatio: 0.09, runTime: 1.9 }
      )
    };
  }

  function coloredPieces(probs) {
    const pieces = [[], [], []];

    // Work in units of blocks, not rounded percentages.

    const edges = [
      0,
      100 * probs[0],
      100 * (probs[0] + probs[1]),
      100
    ];

    for (let k = 0; k < 100; k++) {
      const p = cellPosition(k);

      for (let i = 0; i < 3; i++) {
        const start = Math.max(k, edges[i]);
        const end = Math.min(k + 1, edges[i + 1]);

        const fraction = end - start;

        if (fraction <= 1e-10) continue;

        const localStart = start - k;

        const w = GSIDE * fraction;

        const x =
          p[0] -
          GSIDE / 2 +
          GSIDE * localStart +
          w / 2;

        pieces[i].push(
          rect(
            w,
            GSIDE,
            [x, p[1], 0],
            COLORS[i],
            0.92,
            0
          )
        );
      }
    }

    return pieces.map(a => new M.VGroup(...a));
  }

  function gridTitle(s = '100 BLOCKS = 100%') {
    return text(
      s,
      P ? 19 : 18,
      C.ink,
      [CX, P ? 1.17 : 1.22, 0],
      true
    );
  }

  function shareLegend(probs = null) {
    const y = P ? -4.75 : -2.37;

    return NAMES.map((name, i) => {
      const x = colx(i);
      const c = COLORS[i];

      const icon = fruit(
        name.toLowerCase(),
        [x - 0.44, y + 0.15, 0],
        FR * 0.75
      );

      const label = text(
        name,
        17,
        c,
        [x + 0.12, y + 0.15, 0]
      );

      const value = text(
        probs ? pct(probs[i]) : '?',
        P ? 23 : 22,
        probs ? c : C.muted,
        [x, y - 0.19, 0],
        true
      );

      return new M.VGroup(
        icon,
        label,
        value
      );
    });
  }

  function splitCellOutline(probs) {
    const boundary = probs[0] * 100;
    const k = Math.floor(boundary);

    const p = cellPosition(k);

    return rounded(
      GSIDE + 0.10,
      GSIDE + 0.10,
      p,
      GOLD,
      0
    );
  }

  // ============================================================
  // TRY IT PREVIEW HELPERS
  // ============================================================

  // The supplied scene API schedules narration animations.
  // These slider pictures demonstrate the separate interactive
  // activity; they do not install pointer handlers in the scene.

  function sliderRow(i, value, probability, lo, hi, y) {
    const c = COLORS[i];

    const x0 = CX - 1.45;
    const x1 = CX + 0.95;

    const t = Math.max(
      0,
      Math.min(1, (value - lo) / (hi - lo))
    );

    const kx = x0 + t * (x1 - x0);

    const track = rounded(
      x1 - x0,
      0.09,
      [(x0 + x1) / 2, y, 0],
      C.muted,
      0.85
    );

    const knob = new M.Circle({
      radius: 0.12,
      color: c,
      strokeWidth: 2
    });

    knob.setFill(c, 1);
    knob.moveTo([kx, y, 0]);

    const icon = fruit(
      NAMES[i].toLowerCase(),
      [CX - 2.65, y, 0],
      FR * 0.72
    );

    const name = text(
      NAMES[i],
      17,
      c,
      [CX - 2.12, y, 0]
    );

    const valueText = text(
      num(value),
      21,
      c,
      [CX + 1.38, y, 0],
      true
    );

    const probabilityText = text(
      pct(probability),
      P ? 20 : 19,
      c,
      [CX + 2.45, y, 0],
      true
    );

    const ticks = [];

    for (let j = 0; j <= 7; j++) {
      const xx = x0 + (x1 - x0) * j / 7;

      ticks.push(
        line(
          [xx, y - 0.045, 0],
          [xx, y + 0.045, 0],
          C.muted,
          0.8
        )
      );
    }

    const shareWidth = Math.max(
      0.001,
      (x1 - x0) * probability
    );

    const share = rect(
      shareWidth,
      0.10,
      [
        x0 + shareWidth / 2,
        y - 0.25,
        0
      ],
      c,
      0.88,
      0
    );

    return new M.VGroup(
      icon,
      name,
      track,
      ...ticks,
      knob,
      valueText,
      probabilityText,
      share
    );
  }

  function probabilityStrip(probs, y) {
    const w = P ? 5.55 : 5.40;
    const h = P ? 0.35 : 0.28;

    const x0 = CX - w / 2;

    let offset = 0;

    const pieces = probs.map((p, i) => {
      const width = p * w;

      const block = rect(
        Math.max(width, 0.001),
        h,
        [
          x0 + offset + width / 2,
          y,
          0
        ],
        COLORS[i],
        0.95,
        0
      );

      offset += width;

      return block;
    });

    const outline = rect(
      w,
      h,
      [CX, y, 0],
      C.ink,
      0,
      1
    );

    return new M.VGroup(...pieces, outline);
  }

  function sliderPanel(scores, lo = -2, hi = 5) {
    const probs = softmax(scores);

    const rowYs = P
      ? [0.35, -1.25, -2.85]
      : [0.55, -0.55, -1.65];

    const headingY = P ? 1.35 : 1.22;
    const stripY = P ? -4.45 : -2.43;

    const heading = text(
      'SCORE SLIDERS',
      P ? 18 : 16,
      C.muted,
      [CX - 0.20, headingY, 0],
      true
    );

    const probabilityHeading = text(
      'SHARE',
      P ? 18 : 15,
      C.muted,
      [CX + 2.45, headingY, 0],
      true
    );

    const rangeLeft = text(
      num(lo),
      P ? 18 : 15,
      C.muted,
      [CX - 1.45, headingY - 0.32, 0],
      true
    );

    const rangeRight = text(
      num(hi),
      P ? 18 : 15,
      C.muted,
      [CX + 0.95, headingY - 0.32, 0],
      true
    );

    const rows = scores.map((s, i) =>
      sliderRow(
        i,
        s,
        probs[i],
        lo,
        hi,
        rowYs[i]
      )
    );

    const strip = probabilityStrip(
      probs,
      stripY
    );

    const total = text(
      'TOTAL = 100%',
      P ? 18 : 15,
      C.muted,
      [CX, stripY - 0.34, 0],
      true
    );

    return new M.VGroup(
      heading,
      probabilityHeading,
      rangeLeft,
      rangeRight,
      ...rows,
      strip,
      total
    );
  }

  function sliderBox(scores, title = 'SOFTMAX') {
    const p = softmax(scores);
    const best = winner(scores);

    return fbox([
      [title, C.cyan],
      [`scores: ${scores.map(num).join(', ')}`, C.ink],
      [
        `${pct(p[0])} | ${pct(p[1])} | ${pct(p[2])}`,
        GOLD
      ],
      [
        best < 0
          ? 'equal shares: tie'
          : `prediction: ${NAMES[best].toLowerCase()}`,
        best < 0 ? GOLD : COLORS[best]
      ]
    ], best < 0 ? GOLD : COLORS[best]);
  }

  // ============================================================
  // BEATS 0–7: RETURN TO THE PACKING STATION
  // ============================================================

  // 0. Imagine we return to our fruit packing station.

  await until(S(0));

  await play(
    new M.FadeIn(packingStation),
    ...say('BACK AT THE FRUIT PACKING STATION')
  );

  // 1. Three baskets: plums, apples and pears.

  await until(S(1));

  await play(
    reveal(baskets, 1.65, 0.25),
    ...say('THREE DIFFERENT BASKETS', GOLD)
  );

  // 2. Twelve fruits already identified by the worker.

  await until(S(2));

  await play(
    reveal(placeholders, 1.7, 0.08),
    ...say('12 KNOWN FRUITS', C.green)
  );

  // 3. Four plums, shown as purple circles.

  await until(S(3));

  await play(
    ...remove(placeholders.slice(0, 4)),
    reveal(knownFruits.slice(0, 4), 1.0),
    ...say('4 PLUMS', PLUM)
  );

  // 4. Four apples, shown as orange squares.

  await until(S(4));

  await play(
    ...remove(placeholders.slice(4, 8)),
    reveal(knownFruits.slice(4, 8), 1.0),
    ...say('4 APPLES', APPLE)
  );

  // 5. Four pears, shown as green triangles.

  await until(S(5));

  await play(
    ...remove(placeholders.slice(8, 12)),
    reveal(knownFruits.slice(8, 12), 1.0),
    ...say('4 PEARS', PEAR)
  );

  // 6. An unknown fruit arrives as a white diamond.

  let query = unknown(
    [CX, STATION_Y, 0],
    FR * 1.4
  );

  await until(S(6));

  await play(
    new M.FadeIn(query),
    new M.Indicate(query, { color: WHITE }),
    ...fbox([
      ['NEW FRUIT', WHITE],
      ['label = unknown', C.muted]
    ]),
    ...say('A NEW FRUIT ARRIVES', WHITE)
  );

  // 7. Weight 150 grams, hue 4, firmness 3.

  const firmness = firmnessIndicator(
    NEW_FRUIT.firmness
  );

  await until(S(7));

  await play(
    new M.FadeIn(firmness),
    ...fbox([
      [`weight   = ${NEW_FRUIT.weight} g`, C.cyan],
      [`hue      = ${NEW_FRUIT.hue}`, GOLD],
      [`firmness = ${NEW_FRUIT.firmness}`, C.green]
    ]),
    ...say('THREE MEASUREMENTS')
  );

  // ============================================================
  // BEATS 8–13: ONE SCORE PER POSSIBLE LABEL
  // ============================================================

  let scoreCards = [
    scoreCard(0),
    scoreCard(1),
    scoreCard(2)
  ];

  const scoreQueryPosition = [
    CX,
    P ? 0.65 : 0.79,
    0
  ];

  // 8. The machine gives every possible label a score.

  await until(S(8));

  await play(
    new M.FadeOut(packingStation),
    new M.FadeOut(firmness),
    ...remove(baskets),
    ...remove(knownFruits),

    new M.Transform(
      query,
      unknown(scoreQueryPosition, FR * 1.35),
      { runTime: 1.0 }
    ),

    reveal(scoreCards, 1.35, 0.15),

    ...fbox([
      ['one unknown fruit', WHITE],
      ['three possible labels', C.cyan]
    ]),

    ...say('ONE SCORE FOR EACH LABEL')
  );

  // 9. A score shows how strongly the machine favours a label.

  await until(S(9));

  await play(
    ...fbox([
      ['SCORE', C.cyan],
      ['how strongly the machine', C.ink],
      ['favours a label', C.ink]
    ]),
    ...say('SCORE = STRENGTH OF PREFERENCE')
  );

  // 10. Imagine the machine has already calculated three scores.

  await until(S(10));

  await play(
    ...fbox([
      ['ALREADY FITTED SORTER', C.cyan],
      ['three calculated scores', C.ink]
    ]),
    ...say('OUR MACHINE HAS THREE SCORES')
  );

  // 11. Plum gets a score of two.

  await until(S(11));

  await play(
    new M.Transform(
      scoreCards[0],
      scoreCard(0, SCORES[0]),
      { runTime: 0.45 }
    ),
    ...say('PLUM = 2', PLUM)
  );

  // 12. Apple gets a score of one.

  await until(S(12));

  await play(
    new M.Transform(
      scoreCards[1],
      scoreCard(1, SCORES[1]),
      { runTime: 0.45 }
    ),
    ...say('APPLE = 1', APPLE)
  );

  // 13. Pear gets a score of zero.

  await until(S(13));

  await play(
    new M.Transform(
      scoreCards[2],
      scoreCard(2, SCORES[2]),
      { runTime: 0.45 }
    ),
    ...say('PEAR = 0', PEAR)
  );

  // ============================================================
  // BEATS 14–18: RAW SCORES ARE NOT PROBABILITIES
  // ============================================================

  let rawFrame = chartFrame('raw');

  let rawBars = SCORES.map((s, i) =>
    rawBar(i, s)
  );

  // 14. Draw the three scores as bars.

  await until(S(14));

  await play(
    ...remove(scoreCards),
    new M.FadeOut(query),
    new M.FadeIn(rawFrame),
    reveal(rawBars, 1.4, 0.18),

    ...fbox([
      ['plum  = 2', PLUM],
      ['apple = 1', APPLE],
      ['pear  = 0', PEAR]
    ]),

    ...say('THREE SCORES, THREE BARS')
  );

  // 15. Plum has the highest score.

  const bestOutline = barOutline(
    0,
    SCORES[0],
    RAW_BASE,
    RAW_SCALE
  );

  await until(S(15));

  await play(
    new M.Create(bestOutline),
    new M.Indicate(rawBars[0], { color: PLUM }),

    ...fbox([
      ['highest score = 2', PLUM],
      ['preferred label: plum', PLUM]
    ], PLUM),

    ...say('PLUM HAS THE HIGHEST SCORE', PLUM)
  );

  // 16. How strongly does the machine favour plum?

  await until(S(16));

  await play(
    new M.FadeOut(bestOutline),

    ...fbox([
      ['plum is preferred', PLUM],
      ['but by how much?', GOLD]
    ], GOLD),

    ...say('HOW STRONGLY DOES IT FAVOUR PLUM?', GOLD)
  );

  // 17. Raw scores cannot answer this as percentages yet.

  await until(S(17));

  await play(
    ...fbox([
      ['2, 1, 0', C.ink],
      ['are raw scores', C.cyan],
      ['NOT percentages', GOLD]
    ], GOLD),

    ...say('SCORES ARE NOT PROBABILITIES', GOLD)
  );

  // 18. A score can be negative, but a chance cannot.

  // Temporarily illustrate a hypothetical negative score.
  // The original fitted scores remain unchanged in SCORES.

  await until(S(18));

  await play(
    new M.Transform(
      rawBars[2],
      rawBar(2, -1),
      { runTime: 1.0 }
    ),

    ...fbox([
      ['example score = −1', PEAR],
      ['negative score: possible', C.ink],
      ['negative chance: impossible', GOLD]
    ], GOLD),

    ...say('A CHANCE CANNOT BE NEGATIVE', GOLD)
  );

  // ============================================================
  // BEATS 19–24: THE ONE HUNDRED BLOCK PICTURE
  // ============================================================

  let neutralRows = neutralGridReveal();

  let wholeTitle = gridTitle();

  let legends = shareLegend();

  // 19. Imagine one hundred little blocks.

  await until(S(19));

  await play(
    new M.FadeOut(rawFrame),
    ...remove(rawBars),

    new M.FadeIn(wholeTitle),
    neutralRows.animation,

    ...fbox([
      ['100 blocks', C.cyan],
      ['all possible outcomes', C.ink],
      ['1 block = 1%', GOLD]
    ]),

    ...say('100 BLOCKS = THE WHOLE CHANCE')
  );

  // 20. Share the blocks, favouring higher scores.

  await until(S(20));

  await play(
    reveal(legends, 1.1),

    ...fbox([
      ['higher score', C.ink],
      ['should get a larger share', GOLD]
    ], GOLD),

    ...say('SHARE THE BLOCKS AMONG 3 LABELS')
  );

  // 21. All three shares must use exactly 100 blocks.

  const gridOutline = rounded(
    10 * GPITCH + 0.12,
    10 * GPITCH + 0.12,
    [CX, GCY, 0],
    GOLD,
    0
  );

  await until(S(21));

  await play(
    new M.Create(gridOutline),

    ...fbox([
      ['plum + apple + pear', C.ink],
      ['= all 100 blocks', GOLD]
    ], GOLD),

    ...say('THE SHARES MUST ADD TO 100%', GOLD)
  );

  // 22. Each share is the machine's estimated chance.

  await until(S(22));

  await play(
    new M.FadeOut(gridOutline),

    ...fbox([
      ['each share represents', C.ink],
      ['an estimated chance', C.cyan],
      ['assigned by the machine', C.muted]
    ]),

    ...say('SHARE = PREDICTED CHANCE')
  );

  // 23. More than two labels: multiclass classification.

  await until(S(23));

  await play(
    new M.LaggedStart(
      legends.map((g, i) =>
        new M.Indicate(g, { color: COLORS[i] })
      ),
      { lagRatio: 0.20, runTime: 1.6 }
    ),

    ...fbox([
      ['MULTICLASS', C.cyan],
      ['CLASSIFICATION', C.cyan],
      ['more than two labels', C.ink]
    ]),

    ...say('MULTICLASS = MORE THAN TWO LABELS')
  );

  // 24. The method is called softmax.

  await until(S(24));

  await play(
    ...fbox([
      ['SOFTMAX', GOLD],
      ['scores → positive numbers', C.ink],
      ['positive numbers → shares', C.ink]
    ], GOLD),

    ...say('SOFTMAX', GOLD)
  );

  // ============================================================
  // BEATS 25–32: STEP ONE — MAKE EVERY NUMBER POSITIVE
  // ============================================================

  rawFrame = chartFrame('raw');

  rawBars = SCORES.map((s, i) =>
    rawBar(i, s)
  );

  // 25. Softmax begins by turning scores into positive numbers.

  await until(S(25));

  await play(
    ...remove(neutralRows.rows),
    ...remove(legends),
    new M.FadeOut(wholeTitle),

    new M.FadeIn(rawFrame),
    reveal(rawBars, 1.0),

    ...fbox([
      ['STEP 1', GOLD],
      ['turn every score into', C.ink],
      ['a positive number', C.green]
    ], GOLD),

    ...say('STEP 1: MAKE EVERY NUMBER POSITIVE', GOLD)
  );

  // 26. The special mathematical number e is about 2.72.

  await until(S(26));

  await play(
    ...fbox([
      ['e = 2.718281828…', GOLD],
      ['approximately 2.72', C.ink],
      ['a fixed mathematical number', C.muted]
    ], GOLD),

    ...say('MEET THE NUMBER e', GOLD)
  );

  // 27. The score tells us which power to raise e to.

  await until(S(27));

  await play(
    ...fbox([
      ['new number = eˢ', GOLD],
      ['s = the original score', C.ink]
    ], GOLD),

    ...say('RAISE e TO THE SCORE', GOLD)
  );

  // 28. Plum's score is two: multiply e by itself.

  const expFrame = chartFrame('exp');

  let expBars = [];

  const plumExpression = tag(
    'e × e',
    PLUM,
    [colx(0), EXP_BASE + 0.35, 0],
    19
  );

  await until(S(28));

  await play(
    new M.FadeOut(rawFrame),
    ...remove(rawBars),

    new M.FadeIn(expFrame),
    new M.FadeIn(plumExpression),

    ...fbox([
      ['PLUM', PLUM],
      ['score = 2', C.ink],
      ['e² = e × e', PLUM]
    ], PLUM),

    ...say('PLUM: MULTIPLY e BY ITSELF', PLUM)
  );

  // 29. Using the precise e gives about 7.39.

  expBars[0] = expBar(0, EXP[0]);

  await until(S(29));

  await play(
    new M.FadeOut(plumExpression),

    new M.FadeIn(
      expBars[0],
      { runTime: 1.15 }
    ),

    ...fbox([
      ['e² = e × e', C.ink],
      [`   = ${fixed(EXP[0], 3)}…`, PLUM],
      ['   ≈ 7.39', PLUM]
    ], PLUM),

    ...say('PLUM: e² ≈ 7.39', PLUM)
  );

  // 30. Apple's score is one: e¹ is approximately 2.72.

  expBars[1] = expBar(1, EXP[1]);

  await until(S(30));

  await play(
    new M.FadeIn(
      expBars[1],
      { runTime: 1.1 }
    ),

    ...fbox([
      ['APPLE', APPLE],
      ['e¹ = e', C.ink],
      [`   = ${fixed(EXP[1], 3)}… ≈ 2.72`, APPLE]
    ], APPLE),

    ...say('APPLE: e¹ ≈ 2.72', APPLE)
  );

  // 31. Pear's score is zero: e⁰ = 1.

  expBars[2] = expBar(2, EXP[2]);

  await until(S(31));

  await play(
    new M.FadeIn(
      expBars[2],
      { runTime: 1.1 }
    ),

    ...fbox([
      ['PEAR', PEAR],
      ['e⁰ = 1', PEAR],
      ['positive number to power 0', C.ink],
      ['gives 1', C.green]
    ], PEAR),

    ...say('PEAR: e⁰ = 1', PEAR)
  );

  // 32. All three bars are now positive.

  await until(S(32));

  await play(
    new M.LaggedStart(
      expBars.map((b, i) =>
        new M.Indicate(b, { color: COLORS[i] })
      ),
      { lagRatio: 0.18, runTime: 2.1 }
    ),

    ...fbox([
      [`plum  = ${fixed(EXP[0], 3)}`, PLUM],
      [`apple = ${fixed(EXP[1], 3)}`, APPLE],
      [`pear  = ${fixed(EXP[2], 3)}`, PEAR],
      ['all greater than zero', C.green]
    ], C.green),

    ...say('ALL THREE NUMBERS ARE POSITIVE', C.green)
  );

  // ============================================================
  // BEATS 33–38: STEP TWO — DIVIDE BY THE TOTAL
  // ============================================================

  // 33. Add the three bar heights to find their total.

  const plusY = EXP_BASE + (P ? 0.72 : 0.56);

  const plusSigns = [
    text(
      '+',
      26,
      GOLD,
      [(colx(0) + colx(1)) / 2, plusY, 0],
      true
    ),

    text(
      '+',
      26,
      GOLD,
      [(colx(1) + colx(2)) / 2, plusY, 0],
      true
    )
  ];

  await until(S(33));

  await play(
    reveal(plusSigns, 0.8),

    ...fbox([
      ['STEP 2', C.green],
      ['add the new numbers', C.ink]
    ], C.green),

    ...say('STEP 2: FIND THE TOTAL', C.green)
  );

  // 34. 7.39 + 2.72 + 1 ≈ 11.11.

  await until(S(34));

  await play(
    ...fbox([
      [
        `${fixed(EXP[0], 3)} + ${fixed(EXP[1], 3)}`,
        C.ink
      ],
      ['+ 1', C.ink],
      [`≈ ${fixed(TOTAL, 3)}`, GOLD],
      ['total ≈ 11.11', GOLD]
    ], GOLD),

    ...say('TOTAL ≈ 11.11', GOLD)
  );

  // 35. Find the fraction belonging to each fruit type.

  await until(S(35));

  await play(
    ...remove(plusSigns),

    ...fbox([
      ['each new number', C.ink],
      ['÷ the total', GOLD],
      ['= that label’s share', C.green]
    ], C.green),

    ...say('DIVIDE EACH NUMBER BY THE TOTAL', C.green)
  );

  // 36. Plum receives approximately 66.5%.

  await until(S(36));

  await play(
    new M.Indicate(expBars[0], { color: PLUM }),

    ...fbox([
      ['PLUM', PLUM],
      [`${fixed(EXP[0], 3)} ÷ ${fixed(TOTAL, 3)}`, C.ink],
      [`≈ ${fixed(PROBS[0], 3)}`, C.ink],
      [`≈ ${pct(PROBS[0])}`, PLUM]
    ], PLUM),

    ...say(`PLUM SHARE ≈ ${pct(PROBS[0])}`, PLUM)
  );

  // 37. Apple receives approximately 24.5%.

  await until(S(37));

  await play(
    new M.Indicate(expBars[1], { color: APPLE }),

    ...fbox([
      ['APPLE', APPLE],
      [`${fixed(EXP[1], 3)} ÷ ${fixed(TOTAL, 3)}`, C.ink],
      [`≈ ${fixed(PROBS[1], 3)}`, C.ink],
      [`≈ ${pct(PROBS[1])}`, APPLE]
    ], APPLE),

    ...say(`APPLE SHARE ≈ ${pct(PROBS[1])}`, APPLE)
  );

  // 38. Pear receives approximately 9.0%.

  await until(S(38));

  await play(
    new M.Indicate(expBars[2], { color: PEAR }),

    ...fbox([
      ['PEAR', PEAR],
      `1 ÷ ${fixed(TOTAL, 3)}`,
      `≈ ${fixed(PROBS[2], 3)}`,
      [`≈ ${pct(PROBS[2])}`, PEAR]
    ], PEAR),

    ...say(`PEAR SHARE ≈ ${pct(PROBS[2])}`, PEAR)
  );

  // ============================================================
  // BEATS 39–41: SHARE THE ONE HUNDRED BLOCKS
  // ============================================================

  let gridBack = neutralGrid();

  let shares = coloredPieces(PROBS);

  wholeTitle = gridTitle();

  legends = shareLegend(PROBS);

  const splitOutline = splitCellOutline(PROBS);

  // 39. Divide the blocks into coloured shares.
  // Each split uses the exact unrounded probability.

  await until(S(39));

  await play(
    new M.FadeOut(expFrame),
    ...remove(expBars),

    new M.FadeIn(gridBack),
    new M.FadeIn(wholeTitle),

    ...fbox([
      ['share all 100 blocks', C.ink],
      ['split a block if needed', GOLD]
    ], GOLD),

    ...say('WATCH THE 100 BLOCKS DIVIDE')
  );

  await play(
    new M.LaggedStart(
      shares.map(g =>
        new M.FadeIn(g)
      ),
      {
        lagRatio: 0.35,
        runTime: 2.25
      }
    ),

    reveal(legends, 1.2)
  );

  await play(
    new M.Create(splitOutline, {
      runTime: 0.65
    }),

    ...fbox([
      ['fractional blocks', GOLD],
      ['keep the shares precise', C.ink]
    ], GOLD)
  );

  // 40. The percentages add to 100%.

  await until(S(40));

  await play(
    new M.FadeOut(splitOutline),

    ...fbox([
      [
        `${pct(PROBS[0])} + ${pct(PROBS[1])}`,
        C.ink
      ],
      [`+ ${pct(PROBS[2])}`, C.ink],
      ['= 100%', C.green]
    ], C.green),

    ...say('ALL THE SHARES ADD TO 100%', C.green)
  );

  // 41. Each share is a predicted probability.

  await until(S(41));

  await play(
    new M.LaggedStart(
      legends.map((g, i) =>
        new M.Indicate(g, { color: COLORS[i] })
      ),
      { lagRatio: 0.22, runTime: 1.8 }
    ),

    ...fbox([
      ['PREDICTED PROBABILITY', C.cyan],
      ['the chance assigned', C.ink],
      ['by our machine', C.ink]
    ]),

    ...say('PREDICTED PROBABILITY')
  );

  // ============================================================
  // BEATS 42–45: THE SOFTMAX FORMULA
  // ============================================================

  // 42. Write both steps in one short formula.

  await until(S(42));

  await play(
    ...fbox([
      ['SOFTMAX: TWO STEPS', C.cyan],
      ['1. raise e to each score', GOLD],
      ['2. divide by the total', C.green]
    ]),

    ...say('BOTH STEPS IN ONE FORMULA')
  );

  // 43. Probability = e to the score divided by the sum
  // of the transformed scores for all labels.

  await until(S(43));

  await play(
    ...fbox([
      ['probability =', C.cyan],
      ['    eˢ', GOLD],
      ['──────────────', C.muted],
      ['eˢ¹ + eˢ² + eˢ³', C.ink]
    ]),

    ...say('PROBABILITY = NEW NUMBER ÷ TOTAL')
  );

  await play(
    ...fbox([
      ['for plum:', PLUM],
      ['        e²', GOLD],
      ['p = ───────────', C.ink],
      ['    e² + e¹ + e⁰', C.ink]
    ], PLUM)
  );

  // 44. Softmax provides one common comparison scale.

  await until(S(44));

  await play(
    ...fbox([
      ['one common scale', C.cyan],
      ['0% to 100%', GOLD],
      ['total = 100%', C.green]
    ]),

    ...say('COMPARE ANSWERS ON THE SAME SCALE')
  );

  // 45. The sorter predicts plum: the largest share.

  await until(S(45));

  await play(
    new M.Indicate(shares[0], { color: PLUM }),
    new M.Indicate(legends[0], { color: PLUM }),

    ...fbox([
      [`largest share = ${pct(PROBS[0])}`, PLUM],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM),

    ...say('PREDICTION: PLUM', PLUM)
  );

  // ============================================================
  // BEATS 46–47: PROBABILITY IS NOT A GUARANTEE
  // ============================================================

  // 46. A large share does not guarantee correctness.

  await until(S(46));

  await play(
    ...fbox([
      [`${pct(PROBS[0])} predicted chance`, PLUM],
      ['does not guarantee', C.ink],
      ['the machine is correct', GOLD]
    ], GOLD),

    ...say('HIGH PROBABILITY IS NOT A GUARANTEE', GOLD)
  );

  // 47. A poorly trained machine may be confidently wrong.
  // This is a separate hypothetical example, not the fixed
  // unknown fruit, whose true label remains unspecified.

  const WRONG_SCORES = [5, 0, 0];

  const WRONG_PROBS = softmax(WRONG_SCORES);

  const wrongQuery = unknown(
    [CX, P ? 0.76 : 0.70, 0],
    FR * 1.4
  );

  const resultY = P ? -1.35 : -0.68;

  function comparisonCard(x, heading, label, value, color) {
    const w = P ? 2.68 : 2.55;
    const h = P ? 1.65 : 1.55;

    const body = rounded(
      w,
      h,
      [x, resultY, 0],
      color,
      0.94
    );

    const title = text(
      heading,
      15,
      C.muted,
      [x, resultY + 0.49, 0],
      true
    );

    const symbol = fruit(
      label,
      [x - 0.56, resultY + 0.02, 0],
      FR
    );

    const name = text(
      label.toUpperCase(),
      22,
      color,
      [x + 0.20, resultY + 0.02, 0],
      true
    );

    const v = text(
      value,
      18,
      color,
      [x, resultY - 0.45, 0],
      true
    );

    return new M.VGroup(
      body,
      title,
      symbol,
      name,
      v
    );
  }

  const predictedCard = comparisonCard(
    CX - 1.48,
    'PREDICTION',
    'plum',
    pct(WRONG_PROBS[0]),
    PLUM
  );

  const actualCard = comparisonCard(
    CX + 1.48,
    'ACTUAL LABEL',
    'apple',
    'known afterwards',
    APPLE
  );

  const notEqual = text(
    '≠',
    28,
    GOLD,
    [CX, resultY, 0],
    true
  );

  const wrongNote = tag(
    'CONFIDENT, BUT WRONG',
    GOLD,
    [CX, P ? -2.85 : -2.00, 0],
    17
  );

  await until(S(47));

  await play(
    new M.FadeOut(gridBack),
    new M.FadeOut(wholeTitle),
    ...remove(shares),
    ...remove(legends),

    new M.FadeIn(wrongQuery),
    new M.FadeIn(predictedCard),

    ...fbox([
      ['HYPOTHETICAL EXAMPLE', GOLD],
      ['poorly trained machine', C.ink],
      [`plum: ${pct(WRONG_PROBS[0])}`, PLUM]
    ], GOLD),

    ...say('A MACHINE CAN BE CONFIDENTLY WRONG', GOLD)
  );

  await play(
    new M.FadeIn(actualCard),
    new M.FadeIn(notEqual),
    new M.FadeIn(wrongNote)
  );

  // ============================================================
  // BEATS 48–52: TRY IT PREVIEW
  // ============================================================

  let panel = sliderPanel(SCORES);

  // 48. Move the three score sliders and watch shares update.

  await until(S(48));

  await play(
    new M.FadeOut(wrongQuery),
    new M.FadeOut(predictedCard),
    new M.FadeOut(actualCard),
    new M.FadeOut(notEqual),
    new M.FadeOut(wrongNote),

    new M.FadeIn(panel),

    ...sliderBox(SCORES, 'STARTING SCORES'),

    ...say('TRY IT: MOVE THE SCORE SLIDERS', C.green)
  );

  const DEMO_SCORES = [2, 3, 0];

  await play(
    new M.Transform(
      panel,
      sliderPanel(DEMO_SCORES),
      { runTime: 1.25 }
    ),

    ...sliderBox(
      DEMO_SCORES,
      'APPLE SCORE INCREASES'
    )
  );

  await play(
    new M.Transform(
      panel,
      sliderPanel(SCORES),
      { runTime: 0.9 }
    ),

    ...sliderBox(
      SCORES,
      'ORIGINAL SCORES'
    )
  );

  // 49. Make all three fruit types receive equal shares.

  const EQUAL_SCORES = [0, 0, 0];

  const EQUAL_PROBS = softmax(EQUAL_SCORES);

  await until(S(49));

  await play(
    new M.Transform(
      panel,
      sliderPanel(EQUAL_SCORES),
      { runTime: 1.3 }
    ),

    ...fbox([
      ['scores: 0, 0, 0', C.ink],
      ['e⁰ = e⁰ = e⁰ = 1', GOLD],
      ['each share = 1/3', C.green],
      ['exactly equal shares', C.green]
    ], C.green),

    ...say('TRY IT: MAKE ALL SHARES EQUAL', C.green)
  );

  // 50. Increase plum's share above 90%.

  const HIGH_PLUM_SCORES = [4, 0, 0];

  const HIGH_PLUM_PROBS = softmax(
    HIGH_PLUM_SCORES
  );

  await until(S(50));

  await play(
    new M.Transform(
      panel,
      sliderPanel(HIGH_PLUM_SCORES),
      { runTime: 1.5 }
    ),

    ...fbox([
      ['scores: 4, 0, 0', C.ink],
      ['plum probability:', C.ink],
      [`${pct(HIGH_PLUM_PROBS[0])}`, PLUM],
      ['above 90%', C.green]
    ], PLUM),

    ...say('TRY IT: PLUM ABOVE 90%', C.green)
  );

  // 51. Add ten to every original score.
  // Restore [2, 1, 0] before demonstrating the common shift.

  const SHIFTED_SCORES = SCORES.map(s => s + 10);

  const SHIFTED_PROBS = softmax(SHIFTED_SCORES);

  await until(S(51));

  await play(
    new M.Transform(
      panel,
      sliderPanel(SCORES),
      { runTime: 0.8 }
    ),

    ...fbox([
      ['original scores: 2, 1, 0', C.ink],
      [
        `${pct(PROBS[0])} | ${pct(PROBS[1])} | ${pct(PROBS[2])}`,
        GOLD
      ]
    ]),

    ...say('TRY IT: ADD 10 TO EVERY SCORE', C.green)
  );

  await play(
    new M.Transform(
      panel,
      sliderPanel(SHIFTED_SCORES, 8, 15),
      { runTime: 1.2 }
    ),

    ...fbox([
      ['2, 1, 0 → 12, 11, 10', C.ink],
      [
        `${pct(SHIFTED_PROBS[0])} | ${pct(SHIFTED_PROBS[1])} | ${pct(SHIFTED_PROBS[2])}`,
        GOLD
      ],
      ['same probabilities', C.green]
    ], C.green)
  );

  // 52. Press New data to explore different starting scores.
  // Deterministic fresh examples keep narration replayable.

  const FRESH_1 = [-1, 1, 2];

  const FRESH_2 = [1, 3, 1];

  const newDataTag = tag(
    'NEW DATA',
    C.cyan,
    [
      CX,
      P ? -4.45 : -2.94,
      0
    ],
    P ? 17 : 14
  );

  // On laptop, avoid adding another object beneath the
  // probability strip; the formula box names the action.

  await until(S(52));

  await play(
    new M.Transform(
      panel,
      sliderPanel(FRESH_1),
      { runTime: 1.0 }
    ),

    ...(P ? [new M.FadeIn(newDataTag)] : []),

    ...sliderBox(FRESH_1, 'NEW DATA'),

    ...say('TRY IT: EXPLORE NEW DATA', C.green)
  );

  await play(
    new M.Transform(
      panel,
      sliderPanel(FRESH_2),
      { runTime: 1.1 }
    ),

    ...sliderBox(FRESH_2, 'ANOTHER SCORE SET')
  );

  // ============================================================
  // BEAT 53: RECAP — RESTORE THE ORIGINAL SCORES
  // ============================================================

  // Restore the exact lesson scores [2, 1, 0].
  // Rebuild the original unrounded probability shares.

  gridBack = neutralGrid();

  shares = coloredPieces(PROBS);

  legends = shareLegend(PROBS);

  wholeTitle = gridTitle();

  // 53. Softmax turns competing scores into predicted
  // probabilities that together make 100%.

  await until(S(53));

  await play(
    new M.FadeOut(panel),

    ...(P ? [new M.FadeOut(newDataTag)] : []),

    new M.FadeIn(gridBack),
    new M.FadeIn(wholeTitle),

    reveal(shares, 1.5, 0.18),
    reveal(legends, 1.1, 0.15),

    ...fbox([
      ['SOFTMAX', GOLD],
      ['scores → positive numbers', C.ink],
      ['divide by their total', C.ink],
      ['probabilities sum to 100%', C.green]
    ], C.green),

    ...say('SOFTMAX: SCORES BECOME PROBABILITIES')
  );

  await play(
    new M.LaggedStart(
      legends.map((g, i) =>
        new M.Indicate(g, {
          color: COLORS[i],
          runTime: 0.8
        })
      ),
      {
        lagRatio: 0.25,
        runTime: 1.8
      }
    ),

    ...fbox([
      [`plum  ≈ ${pct(PROBS[0])}`, PLUM],
      [`apple ≈ ${pct(PROBS[1])}`, APPLE],
      [`pear  ≈ ${pct(PROBS[2])}`, PEAR],
      ['total = 100%', C.green]
    ], C.green),

    ...say('TOGETHER: EXACTLY 100%', C.green)
  );
}

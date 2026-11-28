// lesson 7.1.8
// Effect size: how big is the difference?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared chapter data:
//   Target = 500 g.
//   Known individual bottle SD = 4 g.
//
// Morning inspection:
//   n = 16; mean = 502 g; SE = 1 g.
//   Departure = +2 g; z = +2; two-sided p ≈ 0.046.
//   Effect size = 2 g = 0.4% of target = 0.5 SD.
//
// Other factory's large audit:
//   n = 400; mean = 500.5 g; SE = 0.2 g.
//   Departure = +0.5 g; z = +2.5; two-sided p ≈ 0.012.
//   Effect size = 0.5 g = 0.1% of target = 0.125 SD.
//
// A sustained average excess of 2 g across one million bottles
// gives 2,000,000 g = 2,000 kg of extra juice.
//
// Observed departures are estimates of the true mean differences.
// Shifted population curves illustrate the corresponding effects;
// they do not establish the exact population means.
//
// Bottle fill differences are exaggerated when necessary for
// visibility. Quantitative rulers, bars and curves use proportional
// scales. The million-bottle illustration uses labelled groups.
//
// Browser rendering and narration synchronization have not been
// runtime-tested against site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Approved responsive layout.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.62, 0] : [4.3, -0.3, 0];

  const BASE = P ? -3.50 : -1.90;
  const CY = P ? -1.15 : -0.45;
  const W = P ? 6.55 : 7.05;

  const GOLD = C.amber;
  const RED = C.red || '#ff647c';

  const TARGET = 500;
  const SD = 4;
  const ALPHA = 0.05;

  const A = {
    name: 'MORNING BATCH',
    n: 16,
    mean: 502,
    delta: 2,
    se: 1,
    z: 2,
    p: 0.0455003,
    pLabel: '0.046',
    percent: 0.4,
    d: 0.5,
    color: C.cyan
  };

  const B = {
    name: 'LARGE AUDIT',
    n: 400,
    mean: 500.5,
    delta: 0.5,
    se: 0.2,
    z: 2.5,
    p: 0.0124193,
    pLabel: '0.012',
    percent: 0.1,
    d: 0.125,
    color: C.violet
  };

  const MILLION = 1000000;
  const EXTRA_GRAMS = A.delta * MILLION;
  const EXTRA_KG = EXTRA_GRAMS / 1000;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const signed = v =>
    v > 0 ? `+${v}` : String(v);

  // ------------------------------------------------------------
  // Primitive drawing helpers.
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false,
    maxw = W
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function rect(
    x, y, w, h,
    color = C.cyan,
    fill = C.card,
    opacity = 0.95,
    radius = 0.15
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: radius,
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function block(
    x, y, w, h,
    color,
    opacity = 0.85
  ) {
    const r = new M.Rectangle({
      width: Math.max(0.001, w),
      height: Math.max(0.001, h),
      color,
      strokeWidth: 0
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth
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

  function arrow(
    x1, y1, x2, y2,
    color = C.cyan,
    sw = 3
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    const h = Math.min(
      0.15,
      Math.hypot(x2 - x1, y2 - y1) * 0.4
    );

    const d = Math.PI / 6;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, sw),

      line(
        x2, y2,
        x2 - h * Math.cos(a - d),
        y2 - h * Math.sin(a - d),
        color, sw
      ),

      line(
        x2, y2,
        x2 - h * Math.cos(a + d),
        y2 - h * Math.sin(a + d),
        color, sw
      )
    );
  }

  function dot(
    x, y,
    color = C.cyan,
    radius = 0.095,
    opacity = 1
  ) {
    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, opacity);

    return d;
  }

  function glowDot(
    x, y,
    color = C.cyan,
    radius = 0.095
  ) {
    return new M.VGroup(
      dot(x, y, color, radius * 2.1, 0.14),
      dot(x, y, color, radius, 1)
    );
  }

  function tag(
    s, color,
    x, y,
    maxw = W
  ) {
    const p = pill(s, color);

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function heading(s, color = C.ink) {
    return txt(
      s,
      P ? 23 : 22,
      color,
      CX,
      P ? 1.06 : 1.15
    );
  }

  function bracket(
    x1, x2, y,
    label,
    color = GOLD,
    above = true
  ) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 3),

      line(
        x1, y - 0.09,
        x1, y + 0.09,
        color, 2
      ),

      line(
        x2, y - 0.09,
        x2, y + 0.09,
        color, 2
      ),

      txt(
        label,
        18,
        color,
        (x1 + x2) / 2,
        y + (above ? 0.28 : -0.28),
        true,
        Math.max(1.20, Math.abs(x2 - x1) + 0.30)
      )
    );
  }

  // ------------------------------------------------------------
  // Scene layers.
  // All groups are assembled before appearing on screen.
  // No already-visible objects are regrouped.
  // ------------------------------------------------------------

  const layers = new Map();

  function put(key, obj) {
    const a = [];

    if (layers.has(key)) {
      a.push(new M.FadeOut(layers.get(key)));
    }

    layers.set(key, obj);
    a.push(new M.FadeIn(obj));

    return a;
  }

  function drop(...keys) {
    const a = [];

    for (const key of keys) {
      if (!layers.has(key)) continue;

      a.push(new M.FadeOut(layers.get(key)));
      layers.delete(key);
    }

    return a;
  }

  function clear() {
    const a = Array.from(layers.values()).map(
      obj => new M.FadeOut(obj)
    );

    layers.clear();

    return a;
  }

  function scene(entries) {
    const a = clear();

    for (const [key, obj] of entries) {
      layers.set(key, obj);
      a.push(new M.FadeIn(obj));
    }

    return a;
  }

  function indicate(key, color = GOLD) {
    if (!layers.has(key)) return [];

    return [
      new M.Indicate(
        layers.get(key),
        { color }
      )
    ];
  }

  function morph(key, target, options = {}) {
    if (!layers.has(key)) {
      return put(key, target);
    }

    return [
      new M.Transform(
        layers.get(key),
        target,
        options
      )
    ];
  }

  // ------------------------------------------------------------
  // Formula box: approved reference style.
  // ------------------------------------------------------------

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(
      l => Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(
      ([s, c]) => T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 - 0.2 - lh / 2;

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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.85 : 3.5;

    const factor = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (factor < 1) {
      g.scale(factor);
    }

    g.moveTo(BOXP);

    return put('formula', g);
  }

  // ------------------------------------------------------------
  // Shared glowing juice bottle and scale.
  // ------------------------------------------------------------

  function bottle(
    x, y,
    s = 1,
    fill = 0.72,
    label = '',
    color = C.cyan
  ) {
    const w = 0.56 * s;
    const h = 1.12 * s;

    const halo = rect(
      x, y,
      w + 0.12 * s,
      h + 0.10 * s,
      color, color, 0.07,
      0.13 * s
    );

    const body = rect(
      x, y,
      w, h,
      color, C.card, 0.30,
      0.10 * s
    );

    const innerH = h - 0.12 * s;
    const juiceH = innerH * fill;

    const juice = new M.RoundedRectangle({
      width: w - 0.10 * s,
      height: juiceH,
      cornerRadius: 0.06 * s,
      color,
      strokeWidth: 1
    });

    juice.setFill(color, 0.65);

    juice.moveTo([
      x,
      y - innerH / 2 + juiceH / 2,
      0
    ]);

    const neck = rect(
      x,
      y + h / 2 + 0.065 * s,
      0.25 * s,
      0.15 * s,
      color, C.card, 0.90,
      0.035 * s
    );

    const cap = rect(
      x,
      y + h / 2 + 0.19 * s,
      0.34 * s,
      0.12 * s,
      color, color, 0.95,
      0.025 * s
    );

    const parts = [
      halo, body, juice, neck, cap
    ];

    if (label) {
      parts.push(
        block(
          x,
          y - 0.06 * s,
          0.48 * s,
          0.24 * s,
          C.card,
          0.95
        ),

        txt(
          label,
          Math.max(9, 13 * s),
          C.ink,
          x,
          y - 0.06 * s,
          true,
          0.40 * s
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function scale(
    x, y,
    s = 1,
    display = '? g'
  ) {
    return new M.VGroup(
      rect(
        x, y,
        1.55 * s,
        0.72 * s,
        C.cyan, C.card, 0.95,
        0.12 * s
      ),

      rect(
        x,
        y + 0.44 * s,
        1.85 * s,
        0.15 * s,
        C.muted, C.card, 1,
        0.05 * s
      ),

      rect(
        x, y,
        1.04 * s,
        0.36 * s,
        C.muted, C.card, 1,
        0.06 * s
      ),

      txt(
        display,
        19 * s,
        GOLD,
        x, y,
        true,
        0.90 * s
      )
    );
  }

  function tray(
    x, y,
    count = 16,
    cols = 4,
    s = 1,
    color = C.cyan
  ) {
    const rows = Math.ceil(count / cols);

    const dx = 0.52 * s;
    const dy = 0.51 * s;

    const w = cols * dx + 0.37 * s;
    const h = rows * dy + 0.31 * s;

    const parts = [
      rect(
        x, y,
        w, h,
        color, C.card, 0.85,
        0.12 * s
      )
    ];

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      parts.push(
        bottle(
          x + (col - (cols - 1) / 2) * dx,

          y +
            ((rows - 1) / 2 - row) * dy -
            0.04 * s,

          0.32 * s,
          0.65 + ((i * 7 + 2) % 5) * 0.035,
          '',
          color
        )
      );
    }

    parts.push(
      txt(
        `${count} BOTTLES`,
        Math.max(13, 18 * s),
        color,
        x,
        y + h / 2 + 0.27,
        true,
        w + 0.45
      )
    );

    return new M.VGroup(...parts);
  }

  function person(
    x, y,
    s = 1,
    color = C.cyan
  ) {
    const head = new M.Circle({
      radius: 0.24 * s,
      color: C.ink
    });

    head.setFill(C.ink, 0.90);

    head.moveTo([
      x,
      y + 0.36 * s,
      0
    ]);

    const body = new M.Arc({
      radius: 0.45 * s,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.85);

    body.moveTo([
      x,
      y - 0.22 * s,
      0
    ]);

    return new M.VGroup(head, body);
  }

  // ------------------------------------------------------------
  // Opening picture: the morning inspection produced evidence
  // of drift. A statistical alarm is not a measurement of size.
  // ------------------------------------------------------------

  function openingPicture() {
    const y = P ? -0.55 : -0.35;

    return new M.VGroup(
      tray(
        CX - 1.75,
        y + 0.10,
        16, 4,
        0.93
      ),

      arrow(
        CX - 0.48,
        y + 0.10,
        CX + 0.60,
        y + 0.10,
        C.cyan, 3
      ),

      scale(
        CX + 1.75,
        y - 0.30,
        0.95,
        '502 g'
      ),

      bottle(
        CX + 1.75,
        y + 0.67,
        0.76,
        0.82,
        '500 g'
      ),

      txt(
        'Batch mean',
        18, C.muted,
        CX + 1.75,
        y - 0.95
      ),

      tag(
        'p ≈ 0.046 < 0.05',
        C.green,
        CX,
        P ? -2.85 : -2.15
      ),

      txt(
        'Evidence of drift',
        20, C.violet,
        CX,
        P ? -3.40 : -2.69
      )
    );
  }

  function managerQuestion() {
    const y = CY;
    const bx = CX + 0.90;
    const mx = CX - 2.40;

    return new M.VGroup(
      person(mx, y + 0.25, 1.22),

      txt(
        'MANAGER',
        17, C.cyan,
        mx, y - 0.70,
        true
      ),

      rect(
        bx, y + 0.35,
        4.15, 1.80,
        C.violet, C.card, 0.95
      ),

      txt(
        'By how much?',
        27, C.violet,
        bx, y + 0.73,
        false, 3.80
      ),

      txt(
        'Does it matter?',
        24, C.ink,
        bx, y + 0.02,
        false, 3.80
      ),

      txt(
        'A different question from “is there a drift?”',
        18, C.muted,
        CX,
        y - 1.45,
        false, W
      )
    );
  }

  // ------------------------------------------------------------
  // Two questions.
  // Statistical surprise versus practical magnitude.
  // ------------------------------------------------------------

  function twoQuestions(
    showMagnitude = false
  ) {
    const dx = P ? 1.72 : 1.82;
    const w = P ? 3.08 : 3.25;
    const h = P ? 3.55 : 3.20;

    const y = CY;

    const x1 = CX - dx;
    const x2 = CX + dx;

    return new M.VGroup(
      rect(
        x1, y,
        w, h,
        C.cyan, C.card, 0.95
      ),

      rect(
        x2, y,
        w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'p-VALUE',
        23, C.cyan,
        x1, y + h / 2 - 0.40,
        true, w - 0.30
      ),

      txt(
        'EFFECT SIZE',
        22, C.violet,
        x2, y + h / 2 - 0.40,
        true, w - 0.30
      ),

      txt(
        '0.046',
        34, C.cyan,
        x1, y + 0.38,
        true, w - 0.35
      ),

      txt(
        showMagnitude ? '+2 g' : '?',
        34, C.violet,
        x2, y + 0.38,
        true, w - 0.35
      ),

      txt(
        'How surprising?',
        20, C.ink,
        x1, y - 0.40,
        false, w - 0.30
      ),

      txt(
        'How big?',
        20, C.ink,
        x2, y - 0.40,
        false, w - 0.30
      ),

      txt(
        'Assuming H₀',
        17, C.muted,
        x1, y - h / 2 + 0.31,
        false, w - 0.30
      ),

      txt(
        'Meaningful units',
        17, C.muted,
        x2, y - h / 2 + 0.31,
        false, w - 0.30
      )
    );
  }

  // ------------------------------------------------------------
  // Grams: compare the target and observed departure.
  // The scale readings represent the target and batch mean.
  // ------------------------------------------------------------

  function gramPicture(
    data = A,
    showDifference = true
  ) {
    const y = P ? -0.72 : -0.45;
    const dx = P ? 1.66 : 1.77;

    const x1 = CX - dx;
    const x2 = CX + dx;

    const parts = [
      scale(
        x1, y - 0.38,
        1.05,
        '500 g'
      ),

      bottle(
        x1,
        y + 0.74,
        0.91,
        0.72,
        '500 g',
        C.cyan
      ),

      scale(
        x2, y - 0.38,
        1.05,
        `${data.mean} g`
      ),

      bottle(
        x2,
        y + 0.74,
        0.91,
        0.72 + data.delta * 0.055,
        '500 g',
        C.violet
      ),

      txt(
        'LABEL TARGET',
        17, GOLD,
        x1, y - 1.04,
        true, 2.80
      ),

      txt(
        'BATCH MEAN',
        17, C.violet,
        x2, y - 1.04,
        true, 2.80
      )
    ];

    if (showDifference) {
      parts.push(
        arrow(
          x1 + 0.75,
          y + 0.35,
          x2 - 0.75,
          y + 0.35,
          C.violet, 3
        ),

        tag(
          `+${data.delta} g`,
          C.violet,
          CX,
          y + 0.83,
          1.70
        ),

        txt(
          `${data.mean} − 500 = ${data.delta} g`,
          24, C.violet,
          CX,
          y - 1.75,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Percentage of label target.
  //
  // The main bar uses a true 500 g scale.
  // The small excess strip is exactly delta / 500 of its width.
  // A separate magnified inset makes that strip readable.
  // ------------------------------------------------------------

  function percentPicture(
    data = A,
    showPercent = true
  ) {
    const x = CX;

    const y = P ? -0.70 : -0.20;
    const w = P ? 6.05 : 6.45;
    const h = 0.70;

    const left = x - w / 2;
    const right = x + w / 2;

    const fraction = data.delta / TARGET;
    const excessW = w * fraction;

    const parts = [
      block(
        x, y,
        w, h,
        C.cyan, 0.43
      ),

      block(
        right + excessW / 2,
        y,
        excessW,
        h,
        C.violet, 1
      ),

      line(
        right,
        y - h / 2 - 0.12,
        right,
        y + h / 2 + 0.12,
        GOLD, 2.5
      ),

      txt(
        '500 g',
        25, C.ink,
        x, y,
        true
      ),

      bracket(
        left,
        right,
        y + 0.69,
        'Whole label amount',
        GOLD
      ),

      txt(
        'True proportional scale',
        16, C.muted,
        x,
        y - 0.59
      )
    ];

    const ix = x + 0.75;
    const iy = P ? -2.35 : -1.68;

    const iw = P ? 3.85 : 3.70;
    const ih = P ? 1.60 : 1.40;

    parts.push(
      rect(
        ix, iy,
        iw, ih,
        C.violet, C.card, 0.98
      ),

      txt(
        'EXCESS — MAGNIFIED',
        15, C.violet,
        ix,
        iy + ih / 2 - 0.24,
        true, iw - 0.25
      ),

      arrow(
        right,
        y - h / 2 - 0.06,
        ix + iw / 2 - 0.25,
        iy + ih / 2,
        C.violet, 2
      ),

      txt(
        `${data.delta} out of 500 g`,
        22, C.violet,
        ix,
        iy + 0.04,
        true, iw - 0.30
      )
    );

    if (showPercent) {
      parts.push(
        txt(
          `${data.percent}%`,
          27, C.violet,
          ix,
          iy - 0.43,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // One million bottles.
  //
  // Ten crates each represent 100,000 bottles.
  // Each contributes 200 kg if the average excess is 2 g.
  // Total = 2,000 kg.
  // ------------------------------------------------------------

  function crate(x, y, color = C.cyan) {
    const w = 0.94;
    const h = 0.64;

    const parts = [
      rect(
        x, y,
        w, h,
        color, C.card, 0.95,
        0.05
      )
    ];

    for (let i = 0; i < 5; i++) {
      parts.push(
        bottle(
          x + (i - 2) * 0.16,
          y + 0.07,
          0.18,
          0.76,
          '',
          color
        )
      );
    }

    parts.push(
      block(
        x,
        y - 0.17,
        w - 0.05,
        0.22,
        color, 0.30
      ),

      txt(
        '100k',
        P ? 15 : 12, C.ink,
        x,
        y - 0.17,
        true, w - 0.10
      )
    );

    return new M.VGroup(...parts);
  }

  function tank(
    x, y,
    w, h,
    color = C.violet
  ) {
    return new M.VGroup(
      rect(
        x, y,
        w, h,
        color, C.card, 0.95,
        0.20
      ),

      rect(
        x,
        y - h * 0.08,
        w - 0.16,
        h * 0.70,
        color, color, 0.43,
        0.10
      ),

      rect(
        x,
        y + h / 2 + 0.10,
        w * 0.44,
        0.18,
        color, color, 0.75,
        0.05
      ),

      line(
        x - w / 2 + 0.10,
        y + h * 0.26,
        x + w / 2 - 0.10,
        y + h * 0.26,
        color, 2
      )
    );
  }

  function millionPicture() {
    const y = P ? -0.75 : -0.40;

    const x1 = CX - 1.82;
    const x2 = CX + 1.75;

    const parts = [];

    const dx = 0.95;
    const dy = 0.78;

    for (let i = 0; i < 10; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);

      parts.push(
        crate(
          x1 + (col - 0.5) * dx,
          y + (2 - row) * dy
        )
      );
    }

    parts.push(
      txt(
        '1,000,000 BOTTLES',
        19, C.cyan,
        x1,
        y + 2.08,
        true, 3.15
      ),

      arrow(
        x1 + 1.13,
        y,
        x2 - 1.15,
        y,
        C.violet, 3.5
      ),

      tank(
        x2,
        y + 0.34,
        1.90,
        2.10
      ),

      txt(
        '2,000',
        34, C.ink,
        x2, y + 0.42,
        true, 1.70
      ),

      txt(
        'kg',
        24, C.ink,
        x2, y - 0.13,
        true
      ),

      txt(
        'EXTRA JUICE',
        19, C.violet,
        x2,
        y + 2.08,
        true, 2.90
      ),

      txt(
        'Each crate represents 100,000 bottles',
        16, C.muted,
        CX,
        y - 2.12,
        false, W
      ),

      txt(
        'If the 2 g average excess persists',
        17, GOLD,
        CX,
        y - 2.53,
        false, W
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Individual bottle-weight distribution.
  //
  // This is NOT the sampling distribution of the batch mean.
  // The horizontal ruler is measured in grams.
  // Population standard deviation remains 4 g.
  // ------------------------------------------------------------

  const GLO = 484;
  const GHI = 518;

  const GW = P ? 6.50 : 6.95;
  const GH = P ? 2.65 : 2.12;

  const gx = v =>
    CX - GW / 2 +
    (v - GLO) / (GHI - GLO) * GW;

  const bottleDensity = (v, mu = TARGET) =>
    Math.exp(
      -0.5 * ((v - mu) / SD) ** 2
    );

  function gramAxis() {
    const parts = [
      line(
        gx(GLO), BASE,
        gx(GHI), BASE,
        C.muted, 2.5
      )
    ];

    [484, 488, 492, 496, 500, 504, 508, 512, 516]
      .forEach(v => {
        parts.push(
          line(
            gx(v),
            BASE - 0.075,
            gx(v),
            BASE + 0.075,
            C.muted
          ),

          txt(
            String(v),
            P ? 15 : 16,
            v === TARGET ? GOLD : C.muted,
            gx(v),
            BASE - 0.27,
            true
          )
        );
      });

    parts.push(
      txt(
        'Individual bottle weight (grams)',
        17, C.muted,
        CX,
        BASE - 0.71
      )
    );

    return new M.VGroup(...parts);
  }

  function bottleOutline(
    mu = TARGET,
    color = C.cyan,
    sw = 2.8
  ) {
    const parts = [];

    const n = 110;

    for (let i = 0; i < n; i++) {
      const a =
        GLO + (GHI - GLO) * i / n;

      const b =
        GLO + (GHI - GLO) * (i + 1) / n;

      parts.push(
        line(
          gx(a),
          BASE + GH * bottleDensity(a, mu),

          gx(b),
          BASE + GH * bottleDensity(b, mu),

          color,
          sw
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function bottleArea(
    mu = TARGET,
    color = C.cyan,
    opacity = 0.13
  ) {
    const parts = [];

    const n = 100;
    const step = (GHI - GLO) / n;

    for (let i = 0; i < n; i++) {
      const a = GLO + step * i;
      const b = a + step;
      const mid = (a + b) / 2;

      const h =
        GH * bottleDensity(mid, mu);

      parts.push(
        block(
          gx(mid),
          BASE + h / 2,
          (gx(b) - gx(a)) * 1.005,
          h,
          color,
          opacity
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function bottleTarget() {
    return new M.VGroup(
      line(
        gx(TARGET),
        BASE,
        gx(TARGET),
        BASE + GH + 0.08,
        GOLD, 3
      ),

      txt(
        '500 g target',
        17, GOLD,
        gx(TARGET) - 0.55,
        BASE + GH + 0.34,
        true, 2.30
      )
    );
  }

  function spreadGraph(
    showSpread = true
  ) {
    const parts = [
      bottleArea(TARGET),
      bottleOutline(TARGET),
      gramAxis(),
      bottleTarget()
    ];

    if (showSpread) {
      parts.push(
        bracket(
          gx(TARGET),
          gx(TARGET + SD),
          BASE + GH * 0.53,
          '4 g',
          GOLD
        ),

        dashed(
          gx(TARGET + SD),
          BASE,
          gx(TARGET + SD),
          BASE + GH * 0.53,
          GOLD
        ),

        heading(
          'Spread of individual bottles',
          C.cyan
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Compare departure with one full standard deviation.
  //
  // The displayed lengths are exactly proportional.
  // A departure of 2 g occupies 1/2 of the 4 g reference.
  // A departure of 0.5 g occupies 1/8 of the reference.
  // ------------------------------------------------------------

  function spreadRuler(
    data = A,
    showRatio = true
  ) {
    const x = CX;
    const y = CY + 0.30;

    const w = P ? 5.90 : 6.25;
    const left = x - w / 2;
    const right = x + w / 2;

    const sx = v =>
      left + v / SD * w;

    const parts = [
      rect(
        x, y,
        w, 0.64,
        GOLD, GOLD, 0.12,
        0.045
      ),

      bracket(
        left,
        right,
        y + 0.69,
        'ONE MACHINE SPREAD = 4 g',
        GOLD
      )
    ];

    for (let i = 1; i < 8; i++) {
      const xx = sx(i * 0.5);

      parts.push(
        line(
          xx,
          y - 0.32,
          xx,
          y + 0.32,
          GOLD, 1.2
        )
      );
    }

    const dw = w * data.delta / SD;

    parts.push(
      block(
        left + dw / 2,
        y - 1.02,
        dw, 0.60,
        C.violet, 0.80
      ),

      line(
        left,
        y + 0.38,
        left,
        y - 1.40,
        GOLD, 2.5
      ),

      txt(
        `${data.delta} g departure`,
        19, C.violet,
        left + dw / 2,
        y - 1.63,
        false,
        Math.max(1.75, dw + 0.15)
      )
    );

    [0, 1, 2, 3, 4].forEach(v => {
      parts.push(
        txt(
          `${v}`,
          17, C.muted,
          sx(v),
          y - 0.53,
          true
        )
      );
    });

    if (showRatio) {
      const label =
        data.delta === 2
          ? '½ OF A SPREAD'
          : '⅛ OF A SPREAD';

      parts.push(
        tag(
          label,
          C.violet,
          CX,
          y - 2.20
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Illustrate a population shift of the observed magnitude.
  //
  // Both distributions retain SD = 4 g.
  // The second curve is shifted horizontally by data.delta.
  // Gold target line remains fixed.
  // ------------------------------------------------------------

  function shiftedBottleGraph(
    data = A,
    showShift = true
  ) {
    const mu = TARGET + data.delta;

    const parts = [
      bottleArea(
        TARGET,
        C.cyan,
        0.10
      ),

      bottleArea(
        mu,
        C.violet,
        0.18
      ),

      bottleOutline(
        TARGET,
        C.cyan,
        2.3
      ),

      bottleOutline(
        mu,
        C.violet,
        3.1
      ),

      gramAxis(),
      bottleTarget(),

      dashed(
        gx(mu),
        BASE,
        gx(mu),
        BASE + GH,
        C.violet
      ),

      glowDot(
        gx(mu),
        BASE + GH,
        C.violet,
        0.09
      ),

      txt(
        'Shifted cloud',
        17, C.violet,
        gx(mu) + 0.95,
        BASE + GH + 0.34,
        false, 2.25
      ),

      bracket(
        gx(TARGET),
        gx(TARGET + SD),
        BASE + GH * 0.30,
        '4 g spread',
        GOLD
      )
    ];

    if (showShift) {
      parts.push(
        arrow(
          gx(TARGET),
          BASE + GH * 0.74,
          gx(mu),
          BASE + GH * 0.74,
          C.violet, 3
        ),

        txt(
          `+${data.delta} g`,
          19, C.violet,
          (gx(TARGET) + gx(mu)) / 2 + 0.15,
          BASE + GH * 0.88,
          true
        ),

        heading(
          `Illustrated shift: ${data.d} standard deviations`,
          C.violet
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Three effect-size units.
  // Same observed departure expressed in three different ways.
  // ------------------------------------------------------------

  function effectCards(data = A) {
    const w = P ? 6.30 : 6.70;
    const h = P ? 0.91 : 0.76;

    const top = P ? 0.52 : 0.80;
    const gap = P ? 1.27 : 1.06;

    const rows = [
      {
        name: 'GRAMS',
        value: `+${data.delta} g`,
        detail: 'Raw departure',
        color: C.cyan
      },

      {
        name: '% OF LABEL',
        value: `${data.percent}%`,
        detail: 'Relative to 500 g',
        color: GOLD
      },

      {
        name: 'MACHINE SPREADS',
        value: `${data.d}`,
        detail: 'Relative to SD = 4 g',
        color: C.violet
      }
    ];

    const parts = [];

    rows.forEach((r, i) => {
      const y = top - i * gap;

      parts.push(
        rect(
          CX, y,
          w, h,
          r.color, C.card, 0.95
        ),

        txt(
          r.name,
          P ? 18 : 16, r.color,
          CX - w / 2 + 1.30,
          y + 0.13,
          true, 2.30
        ),

        txt(
          r.detail,
          P ? 17 : 15, C.muted,
          CX - w / 2 + 1.30,
          y - 0.18,
          false, 2.30
        ),

        txt(
          r.value,
          30, r.color,
          CX + 1.48,
          y,
          true, 2.65
        )
      );
    });

    parts.push(
      txt(
        'Three ways to describe the same difference',
        18, C.muted,
        CX,
        top - 2 * gap - 0.76,
        false, W
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Another factory.
  // Same target and SD. Much larger sample.
  // ------------------------------------------------------------

  function factoryPicture(
    x, y,
    name,
    color,
    s = 1
  ) {
    const parts = [
      rect(
        x, y,
        2.35 * s,
        1.50 * s,
        color, C.card, 0.95,
        0.10 * s
      ),

      rect(
        x - 0.76 * s,
        y + 0.97 * s,
        0.29 * s,
        0.69 * s,
        color, C.card, 0.95,
        0.035 * s
      ),

      txt(
        name,
        17 * s,
        color,
        x,
        y + 0.44 * s,
        true,
        2.10 * s
      )
    ];

    for (let i = 0; i < 3; i++) {
      parts.push(
        rect(
          x + (i - 1) * 0.65 * s,
          y - 0.12 * s,
          0.39 * s,
          0.44 * s,
          color, color, 0.30,
          0.04 * s
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function factoryComparison() {
    const y = CY + 0.30;

    const dx = P ? 1.72 : 1.80;

    return new M.VGroup(
      factoryPicture(
        CX - dx,
        y + 0.22,
        'FACTORY A',
        C.cyan,
        0.94
      ),

      factoryPicture(
        CX + dx,
        y + 0.22,
        'FACTORY B',
        C.violet,
        0.94
      ),

      txt(
        'Target: 500 g',
        18, GOLD,
        CX - dx,
        y - 0.95,
        true, 3.0
      ),

      txt(
        'Target: 500 g',
        18, GOLD,
        CX + dx,
        y - 0.95,
        true, 3.0
      ),

      txt(
        'SD = 4 g',
        20, C.cyan,
        CX - dx,
        y - 1.39,
        true
      ),

      txt(
        'SD = 4 g',
        20, C.violet,
        CX + dx,
        y - 1.39,
        true
      ),

      tag(
        'SAME KIND OF MACHINE',
        GOLD,
        CX,
        y - 2.04
      )
    );
  }

  // ------------------------------------------------------------
  // Exact sample-size comparison.
  //
  // 4 × 4 = 16 bottle dots.
  // 20 × 20 = 400 bottle dots.
  // Every dot represents one bottle.
  // Both arrays use the same dot size and pitch.
  // ------------------------------------------------------------

  function bottleDotGrid(
    x, y,
    count, cols,
    pitch,
    color
  ) {
    const rows = Math.ceil(count / cols);

    const parts = [];

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      parts.push(
        dot(
          x + (col - (cols - 1) / 2) * pitch,

          y +
            ((rows - 1) / 2 - row) * pitch,

          color,
          pitch * 0.29,
          0.88
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function sampleComparison(
    showMeans = false
  ) {
    const y = P ? -1.20 : -0.60;

    const x1 = CX - 2.13;
    const x2 = CX + 1.30;

    const pitch = P ? 0.168 : 0.133;

    const parts = [
      bottleDotGrid(
        x1, y,
        16, 4,
        pitch,
        C.cyan
      ),

      bottleDotGrid(
        x2, y,
        400, 20,
        pitch,
        C.violet
      ),

      txt(
        'MORNING BATCH',
        17, C.cyan,
        x1,
        y + 20 * pitch / 2 + 0.43,
        true, 2.70
      ),

      txt(
        'LARGE AUDIT',
        17, C.violet,
        x2,
        y + 20 * pitch / 2 + 0.43,
        true, 3.10
      ),

      txt(
        '16',
        33, C.cyan,
        x1,
        y - 0.87,
        true
      ),

      txt(
        '400',
        31, C.violet,
        x2,
        y - 20 * pitch / 2 - 0.39,
        true
      ),

      txt(
        'One dot = one bottle',
        16, C.muted,
        CX,
        y - 20 * pitch / 2 - 0.90
      )
    ];

    if (showMeans) {
      parts.push(
        tag(
          '502 g',
          C.cyan,
          x1,
          y + 0.88,
          2.20
        ),

        tag(
          '500.5 g',
          C.violet,
          x2,
          y + 20 * pitch / 2 - 0.30,
          2.45
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Square root of 400.
  // A real square array of 400 dots has 20 rows and 20 columns.
  // ------------------------------------------------------------

  function root400Picture() {
    const y = P ? -1.25 : -0.56;

    const pitch = P ? 0.167 : 0.122;
    const side = 20 * pitch;

    const parts = [
      rect(
        CX, y,
        side + 0.14,
        side + 0.14,
        C.violet, C.card, 0.60,
        0.06
      ),

      bottleDotGrid(
        CX, y,
        400, 20,
        pitch,
        C.violet
      ),

      bracket(
        CX - side / 2,
        CX + side / 2,
        y - side / 2 - 0.20,
        '20 columns',
        GOLD,
        false
      ),

      line(
        CX - side / 2 - 0.21,
        y - side / 2,
        CX - side / 2 - 0.21,
        y + side / 2,
        GOLD, 2.5
      ),

      txt(
        '20',
        20, GOLD,
        CX - side / 2 - 0.55,
        y,
        true
      ),

      txt(
        'rows',
        16, GOLD,
        CX - side / 2 - 0.55,
        y - 0.34
      ),

      txt(
        '20 × 20 = 400',
        24, C.violet,
        CX,
        y + side / 2 + 0.43,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Two standard-error rulers.
  //
  // Same gram scale in each row.
  // Morning batch: 1 g per step.
  // Large audit: 0.2 g per step.
  // ------------------------------------------------------------

  function seRulerRow(
    data,
    y,
    showSteps = true
  ) {
    const w = P ? 7.0 : 6.40;

    const min = 499.6;
    const max = 502.4;

    const x = v =>
      CX - w / 2 +
      (v - min) / (max - min) * w;

    const parts = [
      line(
        x(min), y,
        x(max), y,
        C.muted, 2.5
      ),

      line(
        x(TARGET),
        y - 0.10,
        x(TARGET),
        y + 0.52,
        GOLD, 3
      ),

      txt(
        `${data.n} BOTTLES — SE = ${data.se} g`,
        19, data.color,
        CX,
        y + 0.89,
        true, w
      )
    ];

    for (let k = -20; k <= 20; k++) {
      const v = TARGET + k * data.se;

      if (v < min - 1e-8 || v > max + 1e-8) {
        continue;
      }

      parts.push(
        line(
          x(v),
          y - 0.09,
          x(v),
          y + 0.09,
          data.color, 2
        )
      );
    }

    (P ? [500, 501, 502] : [500, 500.5, 501, 501.5, 502])
      .forEach(v => {
        parts.push(
          txt(
            String(v),
            P ? 19 : 16,
            v === TARGET ? GOLD : C.muted,
            x(v),
            y - 0.30,
            true
          )
        );
      });

    parts.push(
      glowDot(
        x(data.mean),
        y,
        C.violet,
        0.105
      )
    );

    if (showSteps) {
      const steps = data.delta / data.se;
      const count = Math.ceil(steps);

      for (let i = 0; i < count; i++) {
        const from = TARGET + i * data.se;

        const to = Math.min(
          data.mean,
          from + data.se
        );

        parts.push(
          arrow(
            x(from) + 0.015,
            y + 0.34,
            x(to) - 0.015,
            y + 0.34,
            data.color,
            2.6
          )
        );
      }

      parts.push(
        txt(
          `${data.z} steps`,
          18, data.color,
          (x(TARGET) + x(data.mean)) / 2,
          y + 0.60,
          true, 2.20
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function seRulerComparison(
    showSteps = false
  ) {
    const y1 = P ? -0.4 : 0.00;
    const y2 = P ? -3.2 : -1.72;

    return new M.VGroup(
      seRulerRow(
        A,
        y1,
        showSteps
      ),

      seRulerRow(
        B,
        y2,
        showSteps
      ),

      txt(
        'Both rulers use the same physical gram scale',
        P ? 18 : 16, C.muted,
        CX,
        P ? -4.3 : -2.55,
        false, W
      )
    );
  }

  // ------------------------------------------------------------
  // Large audit: a close-up of its fine ruler.
  //
  // Two full 0.2 g steps and one half step.
  // 0.5 / 0.2 = 2.5.
  // ------------------------------------------------------------

  function fineRulerPicture() {
    const w = P ? 6.00 : 6.40;

    const y = P ? -2.38 : -1.43;

    const x = v =>
      CX - w / 2 +
      (v - 499.8) / 1.0 * w;

    const parts = [
      line(
        x(499.8),
        y,
        x(500.8),
        y,
        C.muted, 2.5
      ),

      line(
        x(500),
        y - 0.06,
        x(500),
        y + 2.02,
        GOLD, 3
      ),

      tag(
        '500 g TARGET',
        GOLD,
        x(500),
        y + 2.31,
        2.30
      )
    ];

    for (let i = -1; i <= 4; i++) {
      const v = 500 + 0.2 * i;

      parts.push(
        line(
          x(v),
          y - 0.10,
          x(v),
          y + 0.10,
          C.cyan, 2
        ),

        txt(
          v.toFixed(1),
          17, C.muted,
          x(v),
          y - 0.30,
          true
        )
      );
    }

    const values = [500, 500.2, 500.4, 500.5];

    for (let i = 0; i < 3; i++) {
      const a = values[i];
      const b = values[i + 1];

      parts.push(
        arrow(
          x(a) + 0.025,
          y + 0.73,
          x(b) - 0.025,
          y + 0.73,
          C.violet, 3.1
        ),

        txt(
          i < 2 ? '1 step' : '½',
          17, C.violet,
          (x(a) + x(b)) / 2,
          y + 1.02,
          true
        )
      );
    }

    parts.push(
      glowDot(
        x(500.5),
        y,
        C.violet,
        0.115
      ),

      line(
        x(500.5),
        y + 0.05,
        x(500.5),
        y + 1.43,
        C.violet, 2.5
      ),

      tag(
        '500.5 g',
        C.violet,
        x(500.5),
        y + 1.73,
        2.20
      ),

      txt(
        '2 + ½ = 2.5 steps',
        25, C.violet,
        CX,
        P ? 0.78 : 1.12,
        true
      ),

      txt(
        'Batch mean (grams)',
        17, C.muted,
        CX,
        y - 0.77
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Normal distribution of z under H₀.
  //
  // For either factory:
  //    Z ~ Normal(0, 1), if the null is true.
  //
  // Shade the two tails at the observed absolute z.
  // The graph is drawn on a common standardized scale.
  // ------------------------------------------------------------

  const ZLO = -4.5;
  const ZHI = 4.5;

  const ZW = P ? 6.55 : 7.05;
  const ZH = P ? 2.65 : 2.12;

  const zx = z =>
    CX - ZW / 2 +
    (z - ZLO) / (ZHI - ZLO) * ZW;

  const zDensity = z =>
    Math.exp(-0.5 * z * z);

  function zArea(
    lo, hi,
    color,
    opacity
  ) {
    const count = Math.max(
      12,
      Math.ceil((hi - lo) * 18)
    );

    const step = (hi - lo) / count;
    const parts = [];

    for (let i = 0; i < count; i++) {
      const a = lo + step * i;
      const b = a + step;

      const mid = (a + b) / 2;
      const h = ZH * zDensity(mid);

      parts.push(
        block(
          zx(mid),
          BASE + h / 2,
          (zx(b) - zx(a)) * 1.005,
          h,
          color,
          opacity
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function zOutline() {
    const parts = [];

    const count = 110;

    for (let i = 0; i < count; i++) {
      const a =
        ZLO + (ZHI - ZLO) * i / count;

      const b =
        ZLO + (ZHI - ZLO) * (i + 1) / count;

      parts.push(
        line(
          zx(a),
          BASE + ZH * zDensity(a),

          zx(b),
          BASE + ZH * zDensity(b),

          C.cyan,
          2.8
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function zAxis() {
    const parts = [
      line(
        zx(ZLO), BASE,
        zx(ZHI), BASE,
        C.muted, 2.5
      )
    ];

    for (let z = -4; z <= 4; z++) {
      parts.push(
        line(
          zx(z),
          BASE - 0.075,
          zx(z),
          BASE + 0.075,
          C.muted
        ),

        txt(
          signed(z),
          16,
          z === 0 ? GOLD : C.muted,
          zx(z),
          BASE - 0.28,
          true
        )
      );
    }

    parts.push(
      txt(
        'z: standard errors from target',
        17, C.muted,
        CX,
        BASE - 0.72
      )
    );

    return new M.VGroup(...parts);
  }

  function pGraph(data = A) {
    const parts = [
      zArea(
        ZLO, ZHI,
        C.cyan, 0.13
      ),

      zArea(
        ZLO, -data.z,
        C.violet, 0.90
      ),

      zArea(
        data.z, ZHI,
        C.violet, 0.90
      ),

      zOutline(),
      zAxis(),

      line(
        zx(0),
        BASE,
        zx(0),
        BASE + ZH + 0.08,
        GOLD, 3
      ),

      txt(
        'H₀: mean = 500 g',
        17, GOLD,
        CX,
        BASE + ZH + 0.35,
        true
      )
    ];

    [-data.z, data.z].forEach(z => {
      parts.push(
        dashed(
          zx(z),
          BASE,
          zx(z),
          BASE + ZH * 0.52,
          C.violet
        ),

        tag(
          `z = ${signed(z)}`,
          C.violet,
          zx(z),
          BASE + ZH * 0.52 + 0.29,
          2.0
        )
      );
    });

    parts.push(
      tag(
        `p ≈ ${data.pLabel}`,
        C.violet,
        CX,
        P ? 1.05 : 1.16
      ),

      txt(
        'Both extreme tails',
        17, C.muted,
        CX,
        BASE + ZH * 0.43,
        false, 2.60
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Two normal-curve panels.
  // The large audit has the smaller shaded two-sided p-value.
  // ------------------------------------------------------------

  function miniPGraph(
    x, y,
    w, h,
    data
  ) {
    const lo = -4;
    const hi = 4;

    const px = z =>
      x - w / 2 + 0.14 +
      (z - lo) / (hi - lo) *
        (w - 0.28);

    const by = y - h / 2 + 0.60;
    const peak = h * 0.38;

    const f = z =>
      peak * Math.exp(-0.5 * z * z);

    const parts = [
      rect(
        x, y,
        w, h,
        data.color, C.card, 0.95
      )
    ];

    // Split at exact observed boundaries so tail shading is
    // geometrically consistent with the probability label.
    const regions = [
      [lo, -data.z, C.violet, 0.92],
      [-data.z, data.z, C.cyan, 0.12],
      [data.z, hi, C.violet, 0.92]
    ];

    regions.forEach(([a0, b0, color, opacity]) => {
      const count = Math.max(
        8,
        Math.ceil((b0 - a0) * 12)
      );

      for (let i = 0; i < count; i++) {
        const a = a0 + (b0 - a0) * i / count;
        const b = a0 + (b0 - a0) * (i + 1) / count;
        const mid = (a + b) / 2;

        const bh = f(mid);

        parts.push(
          block(
            px(mid),
            by + bh / 2,
            (px(b) - px(a)) * 1.005,
            bh,
            color,
            opacity
          )
        );
      }
    });

    for (let i = 0; i < 80; i++) {
      const a = lo + (hi - lo) * i / 80;
      const b = lo + (hi - lo) * (i + 1) / 80;

      parts.push(
        line(
          px(a),
          by + f(a),
          px(b),
          by + f(b),
          C.cyan, 2.2
        )
      );
    }

    parts.push(
      line(
        px(lo), by,
        px(hi), by,
        C.muted, 2
      ),

      line(
        px(0), by,
        px(0), by + peak,
        GOLD, 2
      ),

      dashed(
        px(-data.z),
        by,
        px(-data.z),
        by + peak * 0.65,
        C.violet
      ),

      dashed(
        px(data.z),
        by,
        px(data.z),
        by + peak * 0.65,
        C.violet
      ),

      txt(
        data.name,
        16, data.color,
        x,
        y + h / 2 - 0.26,
        true, w - 0.18
      ),

      txt(
        `z = +${data.z}`,
        18, data.color,
        x,
        y + h / 2 - 0.66,
        true
      ),

      txt(
        `p ≈ ${data.pLabel}`,
        24, C.violet,
        x,
        by - 0.30,
        true, w - 0.20
      )
    );

    return new M.VGroup(...parts);
  }

  function pComparison() {
    const dx = P ? 1.70 : 1.81;

    const w = P ? 3.12 : 3.30;
    const h = P ? 3.40 : 3.04;

    return new M.VGroup(
      miniPGraph(
        CX - dx,
        CY,
        w, h,
        A
      ),

      miniPGraph(
        CX + dx,
        CY,
        w, h,
        B
      ),

      txt(
        '0.012 < 0.046',
        25, GOLD,
        CX,
        CY - h / 2 - 0.47,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Compare p-values on one common numerical scale.
  // Both are below the 5% significance threshold.
  // ------------------------------------------------------------

  function pValueBars() {
    const w = P ? 6.15 : 6.55;

    const left = CX - w / 2;
    const max = 0.06;

    const px = p =>
      left + p / max * w;

    const y1 = P ? -0.30 : 0.15;
    const y2 = P ? -2.00 : -1.35;

    const parts = [];

    [
      { data: A, y: y1 },
      { data: B, y: y2 }
    ].forEach(({ data, y }) => {
      const bw = w * data.p / max;

      parts.push(
        txt(
          data.name,
          18, data.color,
          CX - 1.63,
          y + 0.50,
          true, 3.15
        ),

        txt(
          `p ≈ ${data.pLabel}`,
          20, C.violet,
          CX + 1.88,
          y + 0.50,
          true, 2.60
        ),

        rect(
          CX, y,
          w, 0.40,
          C.muted, C.card, 0.95,
          0.035
        ),

        block(
          left + bw / 2,
          y,
          bw, 0.37,
          data.color, 0.80
        ),

        line(
          px(ALPHA),
          y - 0.28,
          px(ALPHA),
          y + 0.28,
          GOLD, 3
        )
      );
    });

    parts.push(
      txt(
        '0',
        16, C.muted,
        left,
        y2 - 0.41,
        true
      ),

      txt(
        '0.05',
        17, GOLD,
        px(ALPHA),
        y2 - 0.41,
        true
      ),

      txt(
        '0.06',
        16, C.muted,
        px(max),
        y2 - 0.41,
        true
      ),

      tag(
        'BOTH STATISTICALLY SIGNIFICANT',
        C.green,
        CX,
        y2 - 1.02
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Compare physical departures on a common gram scale.
  // 2 g is exactly four times 0.5 g.
  // ------------------------------------------------------------

  function effectComparison(
    unit = 'grams'
  ) {
    const w = P ? 5.90 : 6.25;
    const left = CX - w / 2;

    const y1 = P ? -0.25 : 0.25;
    const y2 = P ? -2.03 : -1.38;

    const h = 0.55;

    let max = 2;
    let labelA = '2 g';
    let labelB = '0.5 g';
    let valueA = A.delta;
    let valueB = B.delta;

    if (unit === 'percent') {
      max = 0.4;
      labelA = '0.4%';
      labelB = '0.1%';
      valueA = A.percent;
      valueB = B.percent;
    }

    if (unit === 'spread') {
      max = 0.5;
      labelA = '0.5 SD';
      labelB = '0.125 SD';
      valueA = A.d;
      valueB = B.d;
    }

    const parts = [];

    [
      {
        data: A,
        y: y1,
        value: valueA,
        label: labelA
      },

      {
        data: B,
        y: y2,
        value: valueB,
        label: labelB
      }
    ].forEach(d => {
      const bw = w * d.value / max;

      parts.push(
        txt(
          d.data.name,
          18, d.data.color,
          CX - 1.62,
          d.y + 0.63,
          true, 3.15
        ),

        txt(
          d.label,
          25, d.data.color,
          CX + 1.83,
          d.y + 0.63,
          true, 2.70
        ),

        rect(
          CX, d.y,
          w, h,
          C.muted, C.card, 0.95,
          0.04
        ),

        block(
          left + bw / 2,
          d.y,
          bw, h * 0.93,
          d.data.color, 0.85
        ),

        line(
          left,
          d.y - h / 2 - 0.07,
          left,
          d.y + h / 2 + 0.07,
          GOLD, 2.5
        )
      );
    });

    // Divide the reference into four equal portions.
    // The audit's effect occupies one such portion.
    for (let i = 1; i < 4; i++) {
      parts.push(
        line(
          left + w * i / 4,
          y1 - h / 2,
          left + w * i / 4,
          y1 + h / 2,
          C.card, 2
        )
      );
    }

    parts.push(
      txt(
        'Morning departure is 4 times larger',
        21, GOLD,
        CX,
        y2 - 0.88,
        false, W
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Complete contrast: effect magnitude and p-value can rank
  // the same two results in opposite orders.
  // ------------------------------------------------------------

  function contrastTable(
    highlight = 'none'
  ) {
    const w = P ? 6.40 : 6.80;

    const left = CX - w / 2;
    const xLabel = left + w * 0.19;
    const xA = left + w * 0.56;
    const xB = left + w * 0.84;

    const top = P ? 0.85 : 1.10;
    const gap = P ? 0.70 : 0.52;

    const rows = [
      ['Bottles', '16', '400', 'n'],
      ['Batch mean', '502 g', '500.5 g', 'mean'],
      ['SE', '1 g', '0.2 g', 'se'],
      ['z', '+2', '+2.5', 'z'],
      ['p-value', '0.046', '0.012', 'p'],
      ['Departure', '2 g', '0.5 g', 'effect'],
      ['% of label', '0.4%', '0.1%', 'percent'],
      ['Cohen’s d', '0.5', '0.125', 'd']
    ];

    const totalH =
      (rows.length + 1) * gap + 0.13;

    const centreY =
      top - rows.length * gap / 2;

    const parts = [
      rect(
        CX,
        centreY,
        w, totalH,
        C.muted, C.card, 0.95,
        0.10
      ),

      txt(
        'MEASURE',
        15, C.muted,
        xLabel, top,
        true, w * 0.35
      ),

      txt(
        'MORNING',
        16, C.cyan,
        xA, top,
        true, w * 0.26
      ),

      txt(
        'AUDIT',
        16, C.violet,
        xB, top,
        true, w * 0.26
      )
    ];

    rows.forEach((r, i) => {
      const y = top - (i + 1) * gap;

      const active =
        highlight === r[3] ||
        (
          highlight === 'effects' &&
          ['effect', 'percent', 'd'].includes(r[3])
        ) ||
        (
          highlight === 'contrast' &&
          ['p', 'effect'].includes(r[3])
        );

      if (active) {
        parts.push(
          block(
            CX, y,
            w - 0.13,
            gap * 0.88,
            GOLD, 0.12
          )
        );
      }

      parts.push(
        line(
          left + 0.10,
          y + gap / 2,
          left + w - 0.10,
          y + gap / 2,
          C.muted, 1
        ),

        txt(
          r[0],
          17,
          active ? GOLD : C.muted,
          xLabel, y,
          false, w * 0.35
        ),

        txt(
          r[1],
          18, C.cyan,
          xA, y,
          true, w * 0.25
        ),

        txt(
          r[2],
          18, C.violet,
          xB, y,
          true, w * 0.25
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Why sample size matters to statistical significance.
  //
  // z = departure / SE
  // SE = SD / sqrt(n)
  //
  // Effect size d uses SD, not SE:
  // d = departure / SD
  //
  // Therefore z = d × sqrt(n).
  // ------------------------------------------------------------

  function sampleSizeContrast() {
    const y = CY;

    const w = P ? 3.10 : 3.24;
    const h = P ? 3.78 : 3.45;

    const dx = P ? 1.72 : 1.82;

    const parts = [];

    [
      {
        x: CX - dx,
        data: A,
        title: 'SMALL SAMPLE'
      },

      {
        x: CX + dx,
        data: B,
        title: 'HUGE SAMPLE'
      }
    ].forEach(({ x, data, title }) => {
      parts.push(
        rect(
          x, y,
          w, h,
          data.color, C.card, 0.95
        ),

        txt(
          title,
          17, data.color,
          x,
          y + h / 2 - 0.32,
          true, w - 0.20
        ),

        txt(
          `n = ${data.n}`,
          22, data.color,
          x,
          y + 0.83,
          true
        ),

        txt(
          `Effect: ${data.delta} g`,
          20, C.violet,
          x,
          y + 0.30,
          true, w - 0.25
        ),

        line(
          x - w / 2 + 0.25,
          y - 0.04,
          x + w / 2 - 0.25,
          y - 0.04,
          C.muted, 1.5
        ),

        txt(
          `SE = ${data.se} g`,
          20, C.cyan,
          x,
          y - 0.37,
          true
        ),

        txt(
          `z = ${data.z}`,
          24, C.ink,
          x,
          y - 0.88,
          true
        ),

        txt(
          `p ≈ ${data.pLabel}`,
          21, C.green,
          x,
          y - h / 2 + 0.30,
          true
        )
      );
    });

    parts.push(
      txt(
        'More data can reveal a smaller effect',
        18, GOLD,
        CX,
        y - h / 2 - 0.43,
        false, W
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Statistical significance and true effect size.
  // A small sample may miss a meaningful drift.
  // This illustration refers to the 52% power example from
  // lesson 7.1.6, not to the observed morning decision.
  // ------------------------------------------------------------

  function detectabilityPicture() {
    const y = CY;

    const w = P ? 6.20 : 6.55;

    const parts = [
      heading(
        'Detection is not the same as magnitude',
        GOLD
      )
    ];

    const rows = [
      {
        y: y + 0.45,
        title: 'Huge sample',
        detail: 'Tiny effect can be significant',
        color: C.green,
        p: 0.012,
        n: 400
      },

      {
        y: y - 1.15,
        title: 'Small sample',
        detail: 'Meaningful effect may be missed',
        color: RED,
        p: null,
        n: 16
      }
    ];

    rows.forEach(r => {
      parts.push(
        rect(
          CX, r.y,
          w, 1.18,
          r.color, C.card, 0.95
        ),

        txt(
          r.title,
          20, r.color,
          CX - 1.45,
          r.y + 0.27,
          false, 2.65
        ),

        txt(
          `n = ${r.n}`,
          18, C.cyan,
          CX + 1.75,
          r.y + 0.27,
          true, 2.30
        ),

        txt(
          r.detail,
          18, C.ink,
          CX,
          r.y - 0.25,
          false, w - 0.35
        )
      );
    });

    parts.push(
      txt(
        'Recall: a true 2 g drift is missed about 48% of the time with n = 16.',
        17, C.muted,
        CX,
        y - 2.12,
        false, W
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Standardized effect-size formula.
  //
  // d = departure / standard deviation
  //
  // Use SD = 4 g, not the standard error of the sample mean.
  // ------------------------------------------------------------

  function effectFormula(
    numeric = false,
    named = false
  ) {
    const x = CX;
    const y = CY + 0.25;

    const w = P ? 6.35 : 6.70;
    const h = P ? 2.65 : 2.40;

    const numerator =
      numeric ? '2 g' : 'departure';

    const denominator =
      numeric ? '4 g' : 'standard deviation';

    const parts = [
      rect(
        x, y,
        w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'd =',
        32, C.violet,
        x - 2.35,
        y,
        true
      ),

      txt(
        numerator,
        27, C.violet,
        x + (numeric ? -0.35 : 0.65),
        y + 0.44,
        true, 3.55
      ),

      line(
        x - 1.23,
        y,
        x + (numeric ? 0.55 : 2.70),
        y,
        C.ink, 2.8
      ),

      txt(
        denominator,
        numeric ? 27 : 23,
        GOLD,
        x + (numeric ? -0.35 : 0.65),
        y - 0.43,
        true, 3.85
      )
    ];

    if (numeric) {
      parts.push(
        txt(
          '= 0.5',
          31, C.violet,
          x + 1.85,
          y,
          true, 2.20
        )
      );
    }

    parts.push(
      txt(
        'Use the machine SD, not the standard error.',
        18, GOLD,
        x,
        y - h / 2 - 0.43,
        false, W
      )
    );

    if (named) {
      parts.push(
        tag(
          'COHEN’S d',
          C.violet,
          CX,
          P ? 0.96 : 1.15
        ),

        txt(
          'Difference measured in standard deviations',
          17, C.muted,
          CX,
          y - h / 2 - 0.90,
          false, W
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Practical interpretation.
  // A small amount per bottle can matter at factory scale.
  // ------------------------------------------------------------

  function practicalPicture() {
    const x = CX;
    const y = CY;

    const dx = P ? 1.72 : 1.81;

    const w = P ? 3.08 : 3.25;
    const h = P ? 3.72 : 3.35;

    const x1 = x - dx;
    const x2 = x + dx;

    return new M.VGroup(
      rect(
        x1, y,
        w, h,
        C.cyan, C.card, 0.95
      ),

      rect(
        x2, y,
        w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'ONE BOTTLE',
        18, C.cyan,
        x1,
        y + h / 2 - 0.35,
        true
      ),

      txt(
        'ONE MILLION',
        18, C.violet,
        x2,
        y + h / 2 - 0.35,
        true
      ),

      bottle(
        x1,
        y + 0.24,
        1.00,
        0.81,
        '500 g'
      ),

      tank(
        x2,
        y + 0.24,
        1.30,
        1.22,
        C.violet
      ),

      txt(
        '+2 g',
        27, C.cyan,
        x1,
        y - 0.78,
        true
      ),

      txt(
        '+2,000 kg',
        26, C.violet,
        x2,
        y - 0.78,
        true, w - 0.25
      ),

      txt(
        'Small per bottle',
        17, C.muted,
        x1,
        y - h / 2 + 0.28,
        false, w - 0.25
      ),

      txt(
        'Potentially costly',
        17, GOLD,
        x2,
        y - h / 2 + 0.28,
        false, w - 0.25
      ),

      txt(
        'Practical importance depends on context.',
        18, GOLD,
        CX,
        y - h / 2 - 0.45,
        false, W
      )
    );
  }

  // ------------------------------------------------------------
  // Reporting template.
  // Report a p-value AND the observed effect in meaningful units.
  // ------------------------------------------------------------

  function reportCard() {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 4.40 : 3.75;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        C.green, C.card, 0.95
      ),

      txt(
        'MORNING INSPECTION REPORT',
        22, C.green,
        x,
        y + h / 2 - 0.38,
        true, w - 0.45
      ),

      txt(
        'Evidence against the target',
        18, C.muted,
        x,
        y + 0.91
      ),

      txt(
        'Two-sided p ≈ 0.046',
        25, C.cyan,
        x,
        y + 0.43,
        true
      ),

      line(
        x - w / 2 + 0.36,
        y + 0.01,
        x + w / 2 - 0.36,
        y + 0.01,
        C.muted, 1.5
      ),

      txt(
        'Estimated size of departure',
        18, C.muted,
        x,
        y - 0.38
      ),

      txt(
        '+2 g per bottle',
        27, C.violet,
        x,
        y - 0.84,
        true
      ),

      txt(
        '0.4% of target  •  d = 0.5',
        19, C.violet,
        x,
        y - 1.31,
        true, w - 0.40
      ),

      txt(
        'Report surprise and magnitude together.',
        17, C.green,
        x,
        y - h / 2 + 0.27,
        false, w - 0.40
      )
    );
  }

  // ------------------------------------------------------------
  // Common trap.
  // "Statistically significant" is a statement about a test,
  // not a judgement of practical importance.
  // ------------------------------------------------------------

  function significanceTrap() {
    const x = CX;
    const y = CY;

    const w = P ? 6.45 : 6.80;
    const h = P ? 4.20 : 3.70;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        RED, C.card, 0.95
      ),

      txt(
        'COMMON TRAP',
        23, RED,
        x,
        y + h / 2 - 0.40,
        true
      ),

      txt(
        'STATISTICALLY SIGNIFICANT',
        21, C.cyan,
        x,
        y + 0.72,
        true, w - 0.40
      ),

      txt(
        '≠',
        45, RED,
        x,
        y + 0.04,
        true
      ),

      txt(
        'PRACTICALLY IMPORTANT',
        23, C.violet,
        x,
        y - 0.63,
        true, w - 0.40
      ),

      txt(
        'A small p-value does not measure effect size.',
        18, C.ink,
        x,
        y - h / 2 + 0.31,
        false, w - 0.40
      )
    );
  }

  // ------------------------------------------------------------
  // Final counterexample: smaller p, smaller physical effect.
  // Two aligned cards make the reversed ordering explicit.
  // ------------------------------------------------------------

  function smallPNotBigEffect() {
    const x = CX;
    const y = CY;

    const w = P ? 3.08 : 3.25;
    const h = P ? 3.80 : 3.40;

    const dx = P ? 1.72 : 1.81;

    const parts = [];

    [
      { x: x - dx, data: A },
      { x: x + dx, data: B }
    ].forEach(({ x, data }) => {
      parts.push(
        rect(
          x, y,
          w, h,
          data.color, C.card, 0.95
        ),

        txt(
          data.name,
          17, data.color,
          x,
          y + h / 2 - 0.32,
          true, w - 0.20
        ),

        txt(
          `p ≈ ${data.pLabel}`,
          25, C.cyan,
          x,
          y + 0.73,
          true, w - 0.25
        ),

        txt(
          data === B
            ? 'Smaller p'
            : 'Larger p',
          17,
          data === B ? GOLD : C.muted,
          x,
          y + 0.22
        ),

        line(
          x - w / 2 + 0.25,
          y - 0.12,
          x + w / 2 - 0.25,
          y - 0.12,
          C.muted, 1.5
        ),

        txt(
          `+${data.delta} g`,
          31, C.violet,
          x,
          y - 0.62,
          true
        ),

        txt(
          data === A
            ? 'Bigger effect'
            : 'Smaller effect',
          18,
          data === A ? GOLD : C.muted,
          x,
          y - h / 2 + 0.33
        )
      );
    });

    parts.push(
      tag(
        'SMALL p DOES NOT MEAN BIG EFFECT',
        RED,
        CX,
        y - h / 2 - 0.48
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Preview equivalence testing.
  // Do not introduce numerical tolerance bounds yet.
  // ------------------------------------------------------------

  function equivalencePreview() {
    const x = CX;
    const y = CY;

    const w = P ? 6.20 : 6.55;

    const left = x - w / 2;
    const right = x + w / 2;

    // The shaded band is conceptual.
    // Its width is deliberately not labelled numerically.

    const bandW = w * 0.40;

    return new M.VGroup(
      heading(
        'Can we show the drift is small enough?',
        C.green
      ),

      rect(
        x,
        y + 0.30,
        bandW,
        1.52,
        C.green,
        C.green,
        0.15,
        0.04
      ),

      line(
        left,
        y,
        right,
        y,
        C.muted, 2.5
      ),

      line(
        x,
        y - 0.09,
        x,
        y + 1.35,
        GOLD, 3
      ),

      dashed(
        x - bandW / 2,
        y - 0.10,
        x - bandW / 2,
        y + 1.17,
        C.green
      ),

      dashed(
        x + bandW / 2,
        y - 0.10,
        x + bandW / 2,
        y + 1.17,
        C.green
      ),

      tag(
        '500 g TARGET',
        GOLD,
        x,
        y + 1.63
      ),

      txt(
        'Small enough to ignore?',
        19, C.green,
        x,
        y + 0.55,
        false, bandW - 0.15
      ),

      txt(
        'Too low',
        18, C.muted,
        left + 0.60,
        y - 0.48
      ),

      txt(
        'Too high',
        18, C.muted,
        right - 0.60,
        y - 0.48
      ),

      txt(
        'A different statistical question',
        21, C.ink,
        CX,
        y - 1.26
      ),

      tag(
        'NEXT: EQUIVALENCE',
        C.green,
        CX,
        y - 1.89
      )
    );
  }

  // ------------------------------------------------------------
  // Final recap.
  // ------------------------------------------------------------

  function finalRecap() {
    const x = CX;
    const y = CY;

    const w = P ? 6.45 : 6.80;
    const h = P ? 4.55 : 3.90;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'EFFECT SIZE',
        28, C.violet,
        x,
        y + h / 2 - 0.42,
        true
      ),

      txt(
        'How big is the departure?',
        24, C.ink,
        x,
        y + 0.86,
        false, w - 0.40
      ),

      txt(
        '2 g  =  0.4%  =  0.5 SD',
        24, C.violet,
        x,
        y + 0.25,
        true, w - 0.45
      ),

      line(
        x - w / 2 + 0.37,
        y - 0.13,
        x + w / 2 - 0.37,
        y - 0.13,
        C.muted, 1.5
      ),

      txt(
        'p-VALUE',
        23, C.cyan,
        x,
        y - 0.51,
        true
      ),

      txt(
        'How surprising are the data under H₀?',
        20, C.ink,
        x,
        y - 0.98,
        false, w - 0.45
      ),

      txt(
        'Different questions. Report both.',
        19, C.green,
        x,
        y - h / 2 + 0.30,
        false, w - 0.45
      )
    );
  }

  // ============================================================
  // 0. This morning's batch gave a p-value below 5%.
  //    Evidence of drift, not proof of the exact true mean.
  // ============================================================

  await until(S(0));
  await play(
    ...scene([
      ['opening', openingPicture()]
    ]),

    ...fbox([
      'Morning batch: n = 16',
      'mean = 502 g',
      ['p ≈ 0.046 < 0.05', C.green]
    ], C.green),

    ...say('OUR MORNING BATCH SHOWED EVIDENCE OF DRIFT', C.green)
  );

  // ============================================================
  // 1. Manager: by how much? Does it matter?
  // ============================================================

  await until(S(1));
  await play(
    ...scene([
      ['manager', managerQuestion()]
    ]),

    ...fbox([
      'Manager’s next question:',
      ['How big is the drift?', C.violet],
      ['Does it matter?', GOLD]
    ], C.violet),

    ...say('BY HOW MUCH? DOES IT MATTER?', GOLD)
  );

  // ============================================================
  // 2. The p-value measures surprise, not magnitude.
  // ============================================================

  await until(S(2));
  await play(
    ...scene([
      [
        'questions',
        twoQuestions(false)
      ]
    ]),

    ...fbox([
      ['p-value:', C.cyan],
      'How surprising under H₀?',
      ['Not how big.', C.violet]
    ]),

    ...say('A p-VALUE SAYS HOW SURPRISING, NOT HOW BIG')
  );

  // ============================================================
  // 3. Measure the difference directly in meaningful units.
  // ============================================================

  await until(S(3));
  await play(
    ...put(
      'questions',
      twoQuestions(true)
    ),

    ...fbox([
      'Measure the departure',
      'in meaningful units.',
      ['Start with grams.', C.violet]
    ], C.violet),

    ...say('MEASURE THE SIZE OF THE DIFFERENCE', C.violet)
  );

  // ============================================================
  // 4. The raw departure is 502 - 500 = +2 grams.
  // ============================================================

  await until(S(4));
  await play(
    ...scene([
      [
        'grams',
        gramPicture(A, true)
      ]
    ]),

    ...fbox([
      'Batch mean = 502 g',
      'Label target = 500 g',
      'Departure = 502 − 500',
      ['= +2 g', C.violet]
    ], C.violet),

    ...say('THE PLAINEST EFFECT SIZE: TWO GRAMS', C.violet)
  );

  // ============================================================
  // 5. Is two grams large relative to the bottle?
  // ============================================================

  await until(S(5));
  await play(
    ...scene([
      [
        'percent',
        percentPicture(A, false)
      ]
    ]),

    ...fbox([
      'Compare the departure',
      'with the whole bottle.',
      ['2 g out of 500 g', GOLD]
    ], GOLD),

    ...say('COMPARE TWO GRAMS WITH THE WHOLE BOTTLE', GOLD)
  );

  // ============================================================
  // 6. 2 / 500 × 100 = 0.4%.
  // ============================================================

  await until(S(6));
  await play(
    ...put(
      'percent',
      percentPicture(A, true)
    ),

    ...fbox([
      'Percent of the label',
      '= 2 ÷ 500 × 100',
      ['= 0.4%', C.violet]
    ], C.violet),

    ...say('TWO GRAMS IS 0.4% OF THE LABEL', C.violet)
  );

  // ============================================================
  // 7. A tiny per-bottle excess accumulates over a million.
  //    2 × 1,000,000 g = 2,000 kg.
  // ============================================================

  await until(S(7));
  await play(
    ...scene([
      ['million', millionPicture()]
    ]),

    ...fbox([
      '2 g × 1,000,000 bottles',
      '= 2,000,000 g',
      '= 2,000,000 ÷ 1,000 kg',
      ['= 2,000 kg extra juice', C.violet]
    ], C.violet),

    ...say('A MILLION BOTTLES: 2,000 kg OF EXTRA JUICE', GOLD)
  );

  // ============================================================
  // 8. Another useful reference unit is the machine's spread.
  // ============================================================

  await until(S(8));
  await play(
    ...scene([
      [
        'spread',
        spreadGraph(false)
      ]
    ]),

    ...fbox([
      'Another reference unit:',
      ['The machine’s own spread', C.cyan],
      'Individual bottle weights'
    ]),

    ...say('COMPARE WITH THE MACHINE’S NORMAL SPREAD')
  );

  // ============================================================
  // 9. Individual bottle SD is 4 grams.
  // ============================================================

  await until(S(9));
  await play(
    ...put(
      'spread',
      spreadGraph(true)
    ),

    ...fbox([
      'Known standard deviation',
      ['SD = 4 g', GOLD],
      'Spread of individual bottles'
    ], GOLD),

    ...say('THE MACHINE’S STANDARD DEVIATION IS 4 GRAMS', GOLD)
  );

  // ============================================================
  // 10. 2 grams / 4 grams = one half.
  // ============================================================

  await until(S(10));
  await play(
    ...scene([
      [
        'ruler',
        spreadRuler(A, false)
      ]
    ]),

    ...fbox([
      'Departure ÷ spread',
      '= 2 g ÷ 4 g',
      ['= 0.5', C.violet]
    ], C.violet),

    ...say('TWO DIVIDED BY FOUR IS ONE HALF', C.violet)
  );

  // ============================================================
  // 11. The estimated departure is half a standard deviation.
  // ============================================================

  await until(S(11));
  await play(
    ...put(
      'ruler',
      spreadRuler(A, true)
    ),

    ...fbox([
      '2 g departure',
      '4 g machine spread',
      ['Half of one spread', C.violet],
      ['0.5 standard deviations', C.violet]
    ], C.violet),

    ...say('HALF OF THE MACHINE’S NORMAL SPREAD', C.violet)
  );

  // ============================================================
  // 12. Picture the entire weight cloud sliding over by 2 g.
  //     Its standard deviation remains unchanged.
  // ============================================================

  await until(S(12));
  await play(
    ...scene([
      [
        'shiftedCloud',
        shiftedBottleGraph(A, true)
      ]
    ]),

    ...fbox([
      'Illustrate a 2 g mean shift',
      'SD stays 4 g.',
      ['Shift = 0.5 SD', C.violet],
      'Same spread, new centre.'
    ], C.violet),

    ...say('THE CLOUD HAS SHIFTED BY HALF A SPREAD', C.violet)
  );

  // ============================================================
  // 13. Name this idea: effect size.
  // ============================================================

  await until(S(13));
  await play(
    ...scene([
      [
        'effects',
        effectCards(A)
      ]
    ]),

    ...fbox([
      ['Effect size', C.violet],
      'Magnitude of a difference',
      'in meaningful units.'
    ], C.violet),

    ...say('THIS IS CALLED AN EFFECT SIZE', C.violet)
  );

  // ============================================================
  // 14. Grams, percentage, and standard deviations all measure
  //     effect magnitude.
  // ============================================================

  await until(S(14));
  await play(
    ...indicate(
      'effects',
      C.violet
    ),

    ...fbox([
      ['Raw effect = 2 g', C.cyan],
      ['Relative effect = 0.4%', GOLD],
      ['Standardized effect = 0.5', C.violet],
      'Same difference, three units.'
    ]),

    ...say('GRAMS, PERCENT, AND HOW MANY SPREADS')
  );

  // ============================================================
  // 15. Introduce the surprising comparison.
  // ============================================================

  await until(S(15));
  await play(
    ...scene([
      [
        'factories',
        factoryComparison()
      ]
    ]),

    ...say('NOW A SURPRISING CASE', GOLD)
  );

  // ============================================================
  // 16. Other factory: same SD, audit of 400 bottles.
  //     Show all 400 dots against the original 16.
  // ============================================================

  await until(S(16));
  await play(
    ...scene([
      [
        'samples',
        sampleComparison(false)
      ]
    ]),

    ...fbox([
      'Other factory',
      'Same target = 500 g',
      'Same known SD = 4 g',
      ['Audit n = 400', C.violet]
    ], C.violet),

    ...say('A HUGE AUDIT: 400 BOTTLES', C.violet)
  );

  // ============================================================
  // 17. Their observed mean is 500.5 g.
  //     Departure = only half a gram.
  // ============================================================

  await until(S(17));
  await play(
    ...scene([
      [
        'auditGrams',
        gramPicture(B, true)
      ]
    ]),

    ...fbox([
      'Audit mean = 500.5 g',
      'Target = 500 g',
      '500.5 − 500',
      ['= +0.5 g', C.violet]
    ], C.violet),

    ...say('THEIR DEPARTURE IS ONLY HALF A GRAM', C.violet)
  );

  // ============================================================
  // 18. Square root of 400 is 20.
  //     Show the exact 20-by-20 bottle array.
  // ============================================================

  await until(S(18));
  await play(
    ...scene([
      ['root400', root400Picture()]
    ]),

    ...fbox([
      'n = 400',
      '20 × 20 = 400',
      ['√400 = 20', GOLD]
    ], GOLD),

    ...say('THE SQUARE ROOT OF 400 IS 20', GOLD)
  );

  // ============================================================
  // 19. SE = 4 / 20 = 0.2 g.
  //     The 400-bottle ruler is five times finer.
  // ============================================================

  await until(S(19));
  await play(
    ...scene([
      [
        'rulers',
        seRulerComparison(false)
      ]
    ]),

    ...fbox([
      'SE = SD ÷ √n',
      'SE = 4 ÷ 20',
      ['= 0.2 g', C.cyan],
      'A much finer ruler.'
    ]),

    ...say('STANDARD ERROR = 0.2 GRAMS')
  );

  // ============================================================
  // 20. A half-gram departure is 2.5 standard errors.
  // ============================================================

  await until(S(20));
  await play(
    ...scene([
      ['fineRuler', fineRulerPicture()]
    ]),

    ...fbox([
      'z = departure ÷ SE',
      '= 0.5 ÷ 0.2',
      ['= +2.5', C.violet]
    ], C.violet),

    ...say('HALF A GRAM IS TWO AND A HALF STEPS', C.violet)
  );

  // ============================================================
  // 21. Two-sided p ≈ 0.012.
  //     Compare it with our morning p ≈ 0.046.
  // ============================================================

  await until(S(21));
  await play(
    ...scene([
      ['pComparison', pComparison()]
    ]),

    ...fbox([
      ['Morning z = +2', C.cyan],
      'p ≈ 0.046',
      ['Audit z = +2.5', C.violet],
      'p ≈ 0.012',
      ['0.012 < 0.046', GOLD]
    ], C.violet),

    ...say('THE LARGE AUDIT HAS THE SMALLER p-VALUE', C.violet)
  );

  // ============================================================
  // 22. The audit looks more statistically significant.
  //     Both results pass the 5% decision threshold.
  // ============================================================

  await until(S(22));
  await play(
    ...scene([
      ['pBars', pValueBars()]
    ]),

    ...fbox([
      'Both p-values < 0.05',
      ['Audit p is smaller.', C.violet],
      'Stronger evidence against H₀',
      'Not necessarily a larger effect.'
    ], C.violet),

    ...say('THE AUDIT LOOKS “MORE SIGNIFICANT”', GOLD)
  );

  // ============================================================
  // 23. But its raw effect is only 0.1% of the label.
  // ============================================================

  await until(S(23));
  await play(
    ...scene([
      [
        'auditPercent',
        percentPicture(B, true)
      ]
    ]),

    ...fbox([
      'Audit departure = 0.5 g',
      'Percent of label',
      '= 0.5 ÷ 500 × 100',
      ['= 0.1%', C.violet]
    ], C.violet),

    ...say('THE EFFECT IS ONLY 0.1% OF THE BOTTLE', C.violet)
  );

  // ============================================================
  // 24. In machine spreads:
  //     0.5 / 4 = 0.125, one eighth of a standard deviation.
  // ============================================================

  await until(S(24));
  await play(
    ...scene([
      [
        'auditSpread',
        spreadRuler(B, true)
      ]
    ]),

    ...fbox([
      'Departure ÷ SD',
      '= 0.5 ÷ 4',
      ['= 0.125', C.violet],
      ['= ⅛ of a spread', C.violet]
    ], C.violet),

    ...say('ONLY ONE EIGHTH OF A STANDARD DEVIATION', C.violet)
  );

  // ============================================================
  // 25. Our observed departure was four times larger.
  //     Compare like with like, on one gram scale.
  // ============================================================

  await until(S(25));
  await play(
    ...scene([
      [
        'effectComparison',
        effectComparison('grams')
      ]
    ]),

    ...fbox([
      ['Morning: 2 g', C.cyan],
      ['Audit: 0.5 g', C.violet],
      '2 ÷ 0.5 = 4',
      ['Our effect is 4 times bigger.', GOLD]
    ], GOLD),

    ...say('OUR MORNING DEPARTURE WAS FOUR TIMES BIGGER', GOLD)
  );

  // ============================================================
  // 26. Huge samples can make tiny effects significant.
  //     Small samples can miss meaningful effects.
  // ============================================================

  await until(S(26));
  await play(
    ...scene([
      [
        'detectability',
        detectabilityPicture()
      ]
    ]),

    ...fbox([
      'Larger n → smaller SE',
      'Small effects can give large z.',
      'Smaller n → lower power',
      ['Big effects can be missed.', RED]
    ], GOLD),

    ...say('SIGNIFICANCE ALSO DEPENDS ON SAMPLE SIZE', GOLD)
  );

  // ============================================================
  // 27. Formula for the standardized effect size.
  //     Use the individual-bottle SD, not the SE.
  // ============================================================

  await until(S(27));
  await play(
    ...scene([
      [
        'effectFormula',
        effectFormula(false, false)
      ]
    ]),

    ...fbox([
      'Standardized effect size',
      ['d = departure ÷ SD', C.violet],
      'SD = machine spread',
      ['Not standard error', GOLD]
    ], C.violet),

    ...say('EFFECT SIZE = DEPARTURE DIVIDED BY SPREAD', C.violet)
  );

  // ============================================================
  // 28. Our morning effect:
  //     d = 2 / 4 = 0.5.
  // ============================================================

  await until(S(28));
  await play(
    ...put(
      'effectFormula',
      effectFormula(true, false)
    ),

    ...fbox([
      'Morning batch',
      'd = 2 ÷ 4',
      ['= 0.5', C.violet],
      'Half a standard deviation.'
    ], C.violet),

    ...say('FOR OUR BATCH: d = 0.5', C.violet)
  );

  // ============================================================
  // 29. This standardized effect is often called Cohen's d.
  // ============================================================

  await until(S(29));
  await play(
    ...put(
      'effectFormula',
      effectFormula(true, true)
    ),

    ...fbox([
      ['Cohen’s d', C.violet],
      'Difference in SD units',
      'Morning d = 0.5',
      'Audit d = 0.125'
    ], C.violet),

    ...say('THIS MEASURE IS OFTEN CALLED COHEN’S d', C.violet)
  );

  // ============================================================
  // 30. Practical importance depends on magnitude and context.
  //     Recall the individual bottle versus total factory waste.
  // ============================================================

  await until(S(30));
  await play(
    ...scene([
      ['practice', practicalPicture()]
    ]),

    ...fbox([
      'Does the difference matter?',
      'Consider its real units.',
      'Consider the scale of use.',
      ['Consider the consequences.', GOLD]
    ], GOLD),

    ...say('EFFECT SIZE HELPS US JUDGE PRACTICAL IMPORTANCE', GOLD)
  );

  // ============================================================
  // 31. Always report both p-value and effect size.
  // ============================================================

  await until(S(31));
  await play(
    ...scene([
      ['report', reportCard()]
    ]),

    ...fbox([
      ['Report both:', C.green],
      ['p ≈ 0.046', C.cyan],
      ['Effect = +2 g', C.violet],
      '0.4% of label; d = 0.5'
    ], C.green),

    ...say('REPORT BOTH THE p-VALUE AND THE EFFECT SIZE', C.green)
  );

  // ============================================================
  // 32. Trap: statistically significant does not mean important.
  // ============================================================

  await until(S(32));
  await play(
    ...scene([
      ['trap', significanceTrap()]
    ]),

    ...fbox([
      'Statistically significant:',
      'Data unusual under H₀',
      'at the chosen cut-off.',
      ['NOT necessarily important.', RED]
    ], RED),

    ...say('TRAP: SIGNIFICANT DOES NOT MEAN IMPORTANT', RED)
  );

  // ============================================================
  // 33. A small p-value is not a big effect.
  //     Return to the two actual examples.
  // ============================================================

  await until(S(33));
  await play(
    ...scene([
      [
        'counterexample',
        smallPNotBigEffect()
      ]
    ]),

    ...fbox([
      'Audit: p ≈ 0.012',
      'Effect = 0.5 g',
      'Morning: p ≈ 0.046',
      'Effect = 2 g',
      ['Smaller p, smaller effect.', RED]
    ], RED),

    ...say('A SMALL p-VALUE IS NOT A BIG EFFECT', RED)
  );

  // ============================================================
  // 34. Preview equivalence.
  //     Can we demonstrate that a departure is sufficiently
  //     small to ignore, rather than merely fail to detect it?
  // ============================================================

  await until(S(34));
  await play(
    ...scene([
      ['preview', equivalencePreview()]
    ]),

    ...fbox([
      'Turn the question around.',
      'Can we demonstrate that',
      'the drift is small enough',
      ['to ignore?', C.green]
    ], C.green),

    ...say('NEXT: CAN WE SHOW A DRIFT IS SMALL ENOUGH?', C.green)
  );

  // ============================================================
  // 35. Final recap.
  //     Effect size measures magnitude in meaningful units.
  //     The p-value answers a different question.
  // ============================================================

  await until(S(35));
  await play(
    ...scene([
      ['recap', finalRecap()]
    ]),

    ...fbox([
      ['Effect size = how big', C.violet],
      ['p-value = how surprising', C.cyan],
      'd = departure ÷ SD',
      ['Report both.', C.green]
    ], C.green),

    ...say('EFFECT SIZE TELLS US HOW BIG THE DIFFERENCE IS', C.violet)
  );
}

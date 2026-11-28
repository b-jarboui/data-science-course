// lesson 7.1.2
// The test statistic.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter data: target = 500 g, known spread = 4 g,
// sample size = 16, standard error = 1 g, batch mean = 502 g.
// Individual bottle weights are illustrative and have exactly the stated mean.
// Browser rendering and narration synchronization require verification in the live engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Layout: approved laptop / phone conventions.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.62, 0] : [4.3, -0.3, 0];

  const BASE = P ? -3.40 : -1.85;
  const CY = P ? -1.15 : -0.45;

  const GOLD = C.amber;
  const RED = C.red || '#ff647c';

  const TARGET = 500;
  const SD = 4;
  const N = 16;
  const MEAN = 502;
  const SE = SD / Math.sqrt(N);
  const Z = (MEAN - TARGET) / SE;

  // Illustrative individual weights.
  // Sum = 8032 g; mean = 502 g.
  const D = [
    499, 505, 501, 509,
    495, 502, 506, 500,
    507, 501, 503, 498,
    502, 497, 504, 503
  ];

  const TOTAL = D.reduce((a, b) => a + b, 0);

  const say = (s, c = C.cyan, split = false) =>
    showA(s, c, split ? PILL : [0, PILL[1], 0]);

  // ------------------------------------------------------------
  // Primitive drawing helpers.
  // ------------------------------------------------------------

  function txt(s, size, color, x, y, mono = false, maxw = FW - 1) {
    const t = T(s, size, color, mono);

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

  function line(x1, y1, x2, y2, color = C.muted, sw = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(x1, y1, x2, y2, color = C.muted) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function arrow(x1, y1, x2, y2, color = C.cyan, sw = 3) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.15;
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

  function glowDot(x, y, color = C.cyan, radius = 0.095) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.1,
      color
    });

    halo.setFill(color, 0.15);

    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);
    const maxw = P ? FW - 1 : 11.8;

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);
    return p;
  }

  // ------------------------------------------------------------
  // Scene layers.
  // Only fresh objects are assembled into VGroups.
  // All play() calls are sequential.
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

  function morph(key, target, options = {}) {
    if (!layers.has(key)) {
      return put(key, target);
    }

    return [
      new M.Transform(layers.get(key), target, options)
    ];
  }

  function clear() {
    const a = Array.from(layers.values()).map(
      o => new M.FadeOut(o)
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

  function indicate(key, color = C.amber) {
    if (!layers.has(key)) return [];

    return [
      new M.Indicate(layers.get(key), { color })
    ];
  }

  // ------------------------------------------------------------
  // Formula box: approved reference style.
  // ------------------------------------------------------------

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

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

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

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
    const factor = Math.min(1, maxw / wd, maxh / ht);

    if (factor < 1) {
      g.scale(factor);
    }

    g.moveTo(BOXP);

    return put('formula', g);
  }

  // ------------------------------------------------------------
  // Shared bottle and scale visuals.
  // Fill differences are exaggerated for visibility.
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
      color, color, 0.07, 0.13 * s
    );

    const body = rect(
      x, y, w, h,
      color, C.card, 0.30, 0.10 * s
    );

    const innerH = h - 0.12 * s;
    const juiceH = innerH * fill;
    const juiceY = y - innerH / 2 + juiceH / 2;

    const juice = new M.RoundedRectangle({
      width: w - 0.10 * s,
      height: juiceH,
      cornerRadius: 0.06 * s,
      color,
      strokeWidth: 1
    });

    juice.setFill(color, 0.65);
    juice.moveTo([x, juiceY, 0]);

    const neck = rect(
      x, y + h / 2 + 0.065 * s,
      0.25 * s, 0.15 * s,
      color, C.card, 0.9, 0.035 * s
    );

    const cap = rect(
      x, y + h / 2 + 0.19 * s,
      0.34 * s, 0.12 * s,
      color, color, 0.95, 0.025 * s
    );

    const parts = [halo, body, juice, neck, cap];

    if (label) {
      const backing = new M.Rectangle({
        width: 0.48 * s,
        height: 0.24 * s,
        color: C.ink,
        strokeWidth: 1
      });

      backing.setFill(C.card, 0.95);
      backing.moveTo([x, y - 0.06 * s, 0]);

      parts.push(
        backing,

        txt(
          label,
          Math.max(9, 13 * s),
          C.ink,
          x, y - 0.06 * s,
          true, 0.40 * s
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function scale(x, y, s = 1, display = '? g') {
    const platform = rect(
      x, y + 0.44 * s,
      1.85 * s, 0.15 * s,
      C.muted, C.card, 1, 0.05 * s
    );

    const body = rect(
      x, y,
      1.55 * s, 0.72 * s,
      C.cyan, C.card, 0.95, 0.12 * s
    );

    const screen = rect(
      x, y,
      1.04 * s, 0.36 * s,
      C.muted, C.card, 1, 0.06 * s
    );

    const reading = txt(
      display, 19 * s, C.amber,
      x, y, true, 0.90 * s
    );

    return new M.VGroup(
      body, platform, screen, reading
    );
  }

  function tray(
    x, y,
    count = 16,
    cols = 4,
    color = C.cyan,
    compact = false,
    equal = false
  ) {
    const rows = Math.ceil(count / cols);

    const dx = compact ? 0.43 : 0.68;
    const dy = compact ? 0.43 : 0.65;
    const s = compact ? 0.27 : 0.42;

    const w = cols * dx + 0.28;
    const h = rows * dy + 0.32;

    const frame = rect(
      x, y, w, h,
      color, C.card, 0.85
    );

    const bottles = Array.from({ length: count }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const fill = equal
        ? 0.72
        : 0.62 + ((i * 7 + 3) % 6) * 0.035;

      return bottle(
        x + (col - (cols - 1) / 2) * dx,
        y + ((rows - 1) / 2 - row) * dy - 0.06,
        s,
        fill,
        '',
        color
      );
    });

    const lab = txt(
      `${count} BOTTLES`,
      18, color,
      x, y + h / 2 + 0.28,
      true, w + 0.3
    );

    return new M.VGroup(frame, ...bottles, lab);
  }

  // ------------------------------------------------------------
  // Recap cards.
  // ------------------------------------------------------------

  const STORY_W = P ? 6.25 : 5.35;
  const STORY_H = P ? 1.95 : 2.65;

  const STORY0 = P ? [0, 0.35] : [-3.0, -0.45];
  const STORY1 = P ? [0, -2.15] : [3.0, -0.45];

  function story(which, revealed = true) {
    const [x, y] = which === 0 ? STORY0 : STORY1;
    const color = which === 0 ? GOLD : C.violet;

    const frame = rect(
      x, y,
      STORY_W, STORY_H,
      revealed ? color : C.muted
    );

    const title = txt(
      which === 0 ? 'H₀ — NULL' : 'H₁ — ALTERNATIVE',
      P ? 22 : 24,
      revealed ? color : C.muted,
      x, y + (P ? 0.60 : 0.86),
      true, STORY_W - 0.5
    );

    const claim = txt(
      revealed
        ? (which === 0 ? 'mean = 500 g' : 'mean ≠ 500 g')
        : '?',
      P ? 28 : 31,
      revealed ? color : C.muted,
      x, y + 0.08,
      true, STORY_W - 0.5
    );

    const description = txt(
      revealed
        ? (which === 0 ? 'Nothing changed' : 'Drift up or down')
        : 'A competing claim',
      20, C.ink,
      x, y - (P ? 0.53 : 0.72),
      false, STORY_W - 0.5
    );

    return new M.VGroup(
      frame, title, claim, description
    );
  }

  // ------------------------------------------------------------
  // Number-line helpers.
  // ------------------------------------------------------------

  function axis(
    cx, width, y,
    lo, hi, ticks,
    unit,
    formatter = v => String(v)
  ) {
    const x = v =>
      cx - width / 2 +
      (v - lo) / (hi - lo) * width;

    const parts = [
      line(x(lo), y, x(hi), y, C.muted, 2.5)
    ];

    ticks.forEach(v => {
      parts.push(
        line(
          x(v), y - 0.075,
          x(v), y + 0.075,
          C.muted
        ),

        txt(
          formatter(v),
          P ? 17 : 18,
          C.muted,
          x(v), y - 0.30,
          true
        )
      );
    });

    parts.push(
      txt(
        unit, 17, C.muted,
        cx, y - 0.73,
        false, width
      )
    );

    return {
      x, y, lo, hi, width, cx,
      group: new M.VGroup(...parts)
    };
  }

  function targetLine(A, height = 2.0, label = true) {
    const parts = [
      line(
        A.x(TARGET), A.y - 0.06,
        A.x(TARGET), A.y + height,
        GOLD, 3
      )
    ];

    if (label) {
      parts.push(
        tag(
          'TARGET 500 g',
          GOLD,
          A.x(TARGET),
          A.y + height + 0.27,
          16
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function meanMarker(
    A, value,
    color = C.cyan,
    label = `${value} g`,
    height = 1.0
  ) {
    return new M.VGroup(
      dashed(
        A.x(value), A.y + 0.04,
        A.x(value), A.y + height,
        color
      ),

      glowDot(
        A.x(value), A.y + 0.13,
        color, 0.13
      ),

      tag(
        label, color,
        A.x(value),
        A.y + height + 0.26,
        17
      )
    );
  }

  function bracket(A, v1, v2, y, label, color = C.amber) {
    const x1 = A.x(v1);
    const x2 = A.x(v2);

    return new M.VGroup(
      line(x1, y, x2, y, color, 3),
      line(x1, y - 0.10, x1, y + 0.10, color, 2),
      line(x2, y - 0.10, x2, y + 0.10, color, 2),

      txt(
        label, 18, color,
        (x1 + x2) / 2,
        y + 0.27,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Sixteen measured bottles as sixteen glowing dots.
  // Repeated weights are stacked vertically.
  // ------------------------------------------------------------

  const RAW = axis(
    0,
    P ? 6.55 : 10.6,
    BASE,
    490, 514,
    [490, 494, 498, 502, 506, 510, 514],
    'bottle weight (grams)'
  );

  const RAW_SPLIT = axis(
    CX,
    P ? 6.55 : 7.05,
    BASE,
    490, 514,
    [490, 494, 498, 502, 506, 510, 514],
    'bottle weight (grams)'
  );

  function rawDots(A, values = D, equal = false) {
    const used = {};

    return new M.VGroup(
      ...values.map((v, i) => {
        if (equal) {
          const col = i % 4;
          const row = Math.floor(i / 4);

          return glowDot(
            A.x(MEAN) + (col - 1.5) * 0.23,
            A.y + 0.24 + row * 0.25,
            C.cyan, 0.085
          );
        }

        const level = used[v] || 0;
        used[v] = level + 1;

        return glowDot(
          A.x(v),
          A.y + 0.28 + level * 0.32,
          C.cyan, 0.105
        );
      })
    );
  }

  function rawNote(A) {
    return txt(
      'Illustrative weights; batch mean = 502 g',
      16, C.muted,
      A.cx,
      P ? -4.6 : -3.15,
      false, A.width
    );
  }

  function meanFlag(A) {
    const x = A.x(MEAN);

    return new M.VGroup(
      line(
        x, A.y + 0.05,
        x, A.y + 1.28,
        C.cyan, 3
      ),

      tag(
        'MEAN 502 g',
        C.cyan,
        x,
        A.y + 1.54,
        17
      )
    );
  }

  // ------------------------------------------------------------
  // Fair-share picture.
  // Every bar represents departure from a 490 g baseline,
  // not the entire bottle weight.
  // ------------------------------------------------------------

  function shareBars(equal = false) {
    const cx = CX;
    const w = P ? 6.25 : 7.0;
    const dx = w / 16;
    const bw = dx * 0.74;

    const y = P ? -3.45 : -2.05;
    const scaleH = P ? 0.19 : 0.14;

    const parts = [
      line(
        cx - w / 2, y,
        cx + w / 2, y,
        C.muted, 2
      ),

      txt(
        '490 g baseline',
        16, C.muted,
        cx, y - 0.28
      )
    ];

    const meanY = y + (MEAN - 490) * scaleH;

    D.forEach((v, i) => {
      const x = cx + (i - 7.5) * dx;
      const weight = equal ? MEAN : v;
      const h = (weight - 490) * scaleH;

      const b = new M.Rectangle({
        width: bw,
        height: h,
        color: C.cyan,
        strokeWidth: 1
      });

      b.setFill(C.cyan, 0.75);
      b.moveTo([x, y + h / 2, 0]);

      parts.push(b);
    });

    parts.push(
      dashed(
        cx - w / 2,
        meanY,
        cx + w / 2,
        meanY,
        GOLD
      ),

      tag(
        '502 g',
        GOLD,
        cx, meanY + 0.33,
        17
      ),

      txt(
        equal ? '16 equal shares' : '16 different weights',
        19,
        equal ? C.green : C.cyan,
        cx,
        P ? 0.45 : 1.17,
        false, w
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Normal-curve helpers.
  // Every bell is drawn from the same mathematical rule.
  // Curves shown here are illustrative distributions,
  // not observed histograms.
  // ------------------------------------------------------------

  function bell(
    A, mean, spread, height,
    color = C.cyan,
    opacity = 0.13
  ) {
    const n = 72;
    const step = (A.hi - A.lo) / n;
    const bw = A.width / n;

    const fill = [];
    const outline = [];

    const density = v =>
      height * Math.exp(
        -0.5 * ((v - mean) / spread) ** 2
      );

    for (let i = 0; i < n; i++) {
      const v0 = A.lo + step * i;
      const v1 = v0 + step;
      const vm = (v0 + v1) / 2;

      const h = Math.max(0.004, density(vm));

      const b = new M.Rectangle({
        width: bw * 1.01,
        height: h,
        color,
        strokeWidth: 0
      });

      b.setFill(color, opacity);
      b.moveTo([
        A.x(vm),
        A.y + h / 2,
        0
      ]);

      fill.push(b);

      outline.push(
        line(
          A.x(v0), A.y + density(v0),
          A.x(v1), A.y + density(v1),
          color, 2.6
        )
      );
    }

    return new M.VGroup(
      ...fill,
      ...outline
    );
  }

  // A wide individual-weight distribution versus a narrower
  // distribution of means from sixteen-bottle inspections.

  const DIST = axis(
    CX,
    P ? 6.55 : 7.05,
    BASE,
    484, 516,
    [484, 492, 500, 508, 516],
    'grams'
  );

  function distribution(
    spread,
    color = C.cyan,
    height = 2.0,
    label = ''
  ) {
    const parts = [
      bell(
        DIST,
        TARGET,
        spread,
        height,
        color
      )
    ];

    if (label) {
      parts.push(
        txt(
          label,
          P ? 20 : 21,
          color,
          CX,
          P ? 0.55 : 1.05,
          false, DIST.width
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function distributionTarget() {
    return new M.VGroup(
      line(
        DIST.x(TARGET), DIST.y,
        DIST.x(TARGET),
        DIST.y + (P ? 2.65 : 2.25),
        GOLD, 2.5
      ),

      tag(
        '500 g',
        GOLD,
        DIST.x(TARGET),
        DIST.y + (P ? 2.95 : 2.52),
        16
      )
    );
  }

  function sampleMeanDots() {
    const means = [
      499.2, 500.3, 499.8, 501.0,
      500.0, 498.9, 500.7, 499.6,
      500.5, 501.2, 499.4, 500.1
    ];

    return new M.VGroup(
      ...means.map((v, i) =>
        glowDot(
          DIST.x(v),
          DIST.y + 0.23 + (i % 4) * 0.20,
          C.cyan, 0.075
        )
      )
    );
  }

  // ------------------------------------------------------------
  // Generic ruler picture.
  // ------------------------------------------------------------

  function simpleRuler() {
    const x = CX;
    const y = CY;
    const w = P ? 6.35 : 6.75;
    const h = 0.86;
    const n = 8;

    const body = rect(
      x, y, w, h,
      C.amber, C.amber, 0.12, 0.07
    );

    const parts = [body];

    for (let i = 0; i <= n; i++) {
      const xx =
        x - w / 2 + 0.32 +
        i * (w - 0.64) / n;

      parts.push(
        line(
          xx, y + h / 2 - 0.04,
          xx, y + h / 2 - (i % 2 === 0 ? 0.40 : 0.24),
          C.amber, 2
        ),

        txt(
          String(i), 18, C.amber,
          xx, y - 0.21,
          true
        )
      );
    }

    const xx1 = x - w / 2 + 0.32 + 3 * (w - 0.64) / n;
    const xx2 = x - w / 2 + 0.32 + 4 * (w - 0.64) / n;

    parts.push(
      arrow(xx1, y - 0.85, xx2, y - 0.85, C.cyan, 3),

      txt(
        'ONE UNIT',
        18, C.cyan,
        (xx1 + xx2) / 2,
        y - 1.16,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Cancellation picture.
  // High and low weights balance when averaged.
  // ------------------------------------------------------------

  function cancellationPicture() {
    const x = CX;
    const y = P ? -0.9 : -0.30;
    const dx = P ? 1.75 : 1.85;

    const weights = [496, 504, 498, 502];
    const fills = [0.60, 0.82, 0.65, 0.77];

    const parts = [];

    weights.forEach((v, i) => {
      const xx = x + (i - 1.5) * dx;

      parts.push(
        bottle(
          xx, y,
          0.82,
          fills[i],
          '',
          C.cyan
        ),

        txt(
          `${v} g`,
          18, C.ink,
          xx, y - 0.78,
          true
        ),

        txt(
          `${v - TARGET > 0 ? '+' : ''}${v - TARGET}`,
          20,
          v < TARGET ? C.violet : C.amber,
          xx, y + 1.05,
          true
        )
      );
    });

    parts.push(
      txt(
        'Example: high and low values balance',
        18, C.muted,
        x, y - 1.35,
        false, P ? 6.5 : 7.0
      )
    );

    return new M.VGroup(...parts);
  }

  function cancellationMean() {
    const y = P ? -3.25 : -1.98;

    return new M.VGroup(
      arrow(
        CX - 1.45, y,
        CX - 0.42, y,
        C.violet, 3
      ),

      arrow(
        CX + 1.45, y,
        CX + 0.42, y,
        C.amber, 3
      ),

      glowDot(CX, y, C.green, 0.12),

      tag(
        'MEAN = 500 g',
        C.green,
        CX, y - 0.35,
        17
      )
    );
  }

  // ------------------------------------------------------------
  // Standard-error ruler.
  // The same horizontal gram scale is reused.
  // ------------------------------------------------------------

  const RULER_LO = 497;
  const RULER_HI = 503;
  const RULER_W = P ? 6.55 : 7.05;
  const RULER_Y = BASE;

  function rulerAxis(unit = 1) {
    const ticks = [];

    for (
      let v = RULER_LO;
      v <= RULER_HI + 0.001;
      v += unit
    ) {
      ticks.push(Number(v.toFixed(2)));
    }

    return axis(
      CX,
      RULER_W,
      RULER_Y,
      RULER_LO,
      RULER_HI,
      ticks,
      'batch mean (grams)',
      v => {
        if (unit < 1 && !Number.isInteger(v)) return '';
        return String(v);
      }
    );
  }

  function ruler(unit = 1, showZ = true) {
    const A = rulerAxis(unit);
    const zy = A.y + 0.65;

    const parts = [
      A.group,

      line(
        A.x(RULER_LO), zy,
        A.x(RULER_HI), zy,
        C.cyan, 2.8
      ),

      line(
        A.x(TARGET), A.y,
        A.x(TARGET), zy,
        GOLD, 3
      )
    ];

    const loZ = Math.round((RULER_LO - TARGET) / unit);
    const hiZ = Math.round((RULER_HI - TARGET) / unit);

    for (let z = loZ; z <= hiZ; z++) {
      const v = TARGET + z * unit;
      const x = A.x(v);

      parts.push(
        line(
          x, zy - 0.075,
          x, zy + 0.075,
          z === 0 ? GOLD : C.cyan,
          2
        )
      );

      if (showZ) {
        parts.push(
          txt(
            z > 0 ? `+${z}` : String(z),
            unit < 1 ? 15 : 18,
            z === 0 ? GOLD : C.cyan,
            x, zy + 0.25,
            true
          )
        );
      }
    }

    parts.push(
      txt(
        showZ ? 'standard errors from the target' : 'equal steps',
        17, C.cyan,
        CX, zy + 0.68,
        false, RULER_W
      ),

      tag(
        `1 STEP = ${unit} g`,
        C.green,
        CX,
        P ? 0.55 : 1.13,
        17
      )
    );

    return new M.VGroup(...parts);
  }

  function rulerPoint(value, color = C.cyan) {
    const A = rulerAxis(1);
    const y = A.y + 0.65;

    return new M.VGroup(
      dashed(
        A.x(value), A.y + 0.06,
        A.x(value), y + 0.05,
        color
      ),

      glowDot(
        A.x(value), y,
        color, 0.13
      ),

      tag(
        `${value} g`,
        color,
        A.x(value),
        A.y + 2.8,
        17
      )
    );
  }

  function distanceArrow(
    value,
    color = C.amber,
    label = null
  ) {
    const A = rulerAxis(1);
    const y = A.y + 2.05;

    const parts = [
      arrow(
        A.x(TARGET), y,
        A.x(value), y,
        color, 3.5
      )
    ];

    if (label) {
      parts.push(
        txt(
          label, 19, color,
          (A.x(TARGET) + A.x(value)) / 2,
          y + 0.30,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function measuredSteps(
    value,
    unit = 1,
    color = C.green
  ) {
    const A = rulerAxis(unit);
    const sign = Math.sign(value - TARGET);
    const count = Math.abs((value - TARGET) / unit);

    const n = Math.ceil(count);
    const y = A.y + 2.0;

    const parts = [];

    for (let i = 0; i < n; i++) {
      const fraction = Math.min(1, count - i);
      const v1 = TARGET + sign * i * unit;
      const v2 = v1 + sign * fraction * unit;

      parts.push(
        arrow(
          A.x(v1) + sign * 0.035, y,
          A.x(v2) - sign * 0.035, y,
          color, 3
        ),

        txt(
          fraction === 1 ? '1' : String(fraction),
          18, color,
          (A.x(v1) + A.x(v2)) / 2,
          y + 0.26,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function zBadge(value, color = C.green) {
    const sign = value > 0 ? '+' : '';
    const x = CX;
    const y = P ? -0.05 : 0.70;

    return tag(
      `z = ${sign}${value}`,
      color,
      x, y,
      25
    );
  }

  // ------------------------------------------------------------
  // Square-root picture: four rows of four.
  // ------------------------------------------------------------

  function squareRootPicture() {
    const x = CX;
    const y = P ? -1.35 : -0.42;
    const pitch = P ? 0.71 : 0.68;

    const parts = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        parts.push(
          bottle(
            x + (col - 1.5) * pitch,
            y + (1.5 - row) * pitch,
            0.40,
            0.72,
            '',
            C.cyan
          )
        );
      }
    }

    const w = 4 * pitch;
    const h = 4 * pitch;

    parts.push(
      line(
        x - w / 2, y - h / 2 - 0.17,
        x + w / 2, y - h / 2 - 0.17,
        C.amber, 2.5
      ),

      line(
        x - w / 2 - 0.18, y - h / 2,
        x - w / 2 - 0.18, y + h / 2,
        C.amber, 2.5
      ),

      txt(
        '4',
        23, C.amber,
        x, y - h / 2 - 0.42,
        true
      ),

      txt(
        '4',
        23, C.amber,
        x - w / 2 - 0.45, y,
        true
      ),

      tag(
        '4 × 4 = 16',
        C.green,
        x, y + h / 2 + 0.32,
        18
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Four grams divided into four equal parts.
  // ------------------------------------------------------------

  function spreadBlocks(divided = false) {
    const x = CX;
    const y = CY;
    const w = P ? 5.65 : 6.0;

    const parts = [];

    if (!divided) {
      const block = rect(
        x, y, w, 0.82,
        C.cyan, C.cyan, 0.28, 0.08
      );

      parts.push(
        block,

        txt(
          '4 grams',
          27, C.cyan,
          x, y,
          true
        )
      );
    } else {
      const gap = 0.12;
      const bw = (w - 3 * gap) / 4;

      for (let i = 0; i < 4; i++) {
        const xx = x + (i - 1.5) * (bw + gap);

        parts.push(
          rect(
            xx, y,
            bw, 0.82,
            C.green, C.green, 0.20, 0.08
          ),

          txt(
            '1 g',
            23, C.green,
            xx, y,
            true
          )
        );
      }

      parts.push(
        tag(
          'ONE STANDARD ERROR',
          C.green,
          x, y - 0.85,
          17
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Sign and standardized distance.
  // ------------------------------------------------------------

  function signedDirections() {
    const A = rulerAxis(1);
    const y = A.y + 2.03;

    return new M.VGroup(
      arrow(
        A.x(TARGET) - 0.1, y,
        A.x(497.25), y,
        C.violet, 3
      ),

      arrow(
        A.x(TARGET) + 0.1, y,
        A.x(502.75), y,
        C.green, 3
      ),

      txt(
        'MINUS',
        18, C.violet,
        A.x(498.5), y + 0.30,
        true
      ),

      txt(
        'PLUS',
        18, C.green,
        A.x(501.5), y + 0.30,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Different measurement units, one standardized ruler.
  // All examples here are schematic, not extra chapter data.
  // ------------------------------------------------------------

  function commonRulers() {
    const x = CX;
    const w = P ? 6.25 : 6.75;
    const y = P ? 0.30 : 0.85;
    const gap = P ? 1.22 : 1.05;

    const examples = [
      ['GRAMS', C.cyan],
      ['MINUTES', C.violet],
      ['EUROS', C.green]
    ];

    const parts = [];

    examples.forEach(([name, color], i) => {
      const yy = y - i * gap;
      const x1 = x - w / 2 + 1.85;
      const x2 = x + w / 2 - 0.30;

      const zx = z =>
        x1 + (z + 3) / 6 * (x2 - x1);

      parts.push(
        txt(
          name, 17, color,
          x - w / 2 + 0.75,
          yy,
          true, 1.55
        ),

        line(
          x1, yy,
          x2, yy,
          C.muted, 2
        ),

        line(
          zx(0), yy - 0.12,
          zx(0), yy + 0.12,
          GOLD, 3
        ),

        arrow(
          zx(0), yy,
          zx(2), yy,
          color, 3
        ),

        glowDot(
          zx(2), yy,
          color, 0.10
        ),

        txt(
          '+2 SE',
          17, color,
          zx(2), yy + 0.28,
          true
        )
      );
    });

    parts.push(
      txt(
        'Different units, same number of standard errors',
        17, C.muted,
        x, y - 2 * gap - 0.65,
        false, w
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Compare sample sizes using the same physical distance.
  // ------------------------------------------------------------

  function sampleComparison(show64 = false) {
    const w = P ? 7.0 : 7.6;
    const x = CX;

    const y1 = P ? -0.4 : 0.36;
    const y2 = P ? -3.6 : -1.75;

    function row(y, n, se, z, color) {
      const left = x - w / 2 + 0.48;
      const right = x + w / 2 - 0.48;

      const gx = v =>
        left + (v - 499) / 4 * (right - left);

      const parts = [
        txt(
          `${n} BOTTLES`,
          P ? 22 : 20, color,
          x, y + 0.72,
          true
        ),

        line(
          gx(499), y,
          gx(503), y,
          C.muted, 2.5
        ),

        line(
          gx(500), y - 0.13,
          gx(500), y + 0.20,
          GOLD, 3
        )
      ];

      for (let v = 499; v <= 503.001; v += se) {
        parts.push(
          line(
            gx(v), y - 0.07,
            gx(v), y + 0.07,
            color, 1.8
          )
        );
      }

      [499, 500, 501, 502, 503].forEach(v => {
        parts.push(
          txt(
            String(v),
            P ? 17 : 16, C.muted,
            gx(v), y - 0.3,
            true
          )
        );
      });

      const nSteps = Math.round(2 / se);

      for (let i = 0; i < nSteps; i++) {
        const v1 = 500 + i * se;
        const v2 = v1 + se;

        parts.push(
          arrow(
            gx(v1) + 0.025, y + 0.24,
            gx(v2) - 0.025, y + 0.24,
            color, 2.6
          )
        );
      }

      parts.push(
        glowDot(gx(502), y, color, 0.10),

        txt(
          `SE = ${se} g     z = +${z}`,
          P ? 21 : 20, color,
          x, y - 0.72,
          true, w
        )
      );

      return new M.VGroup(...parts);
    }

    const parts = [
      row(y1, 16, 1, 2, C.cyan)
    ];

    if (show64) {
      parts.push(
        row(y2, 64, 0.5, 4, C.green)
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Final standardized normal curve.
  // Preview of the p-value lesson, without shading tails yet.
  // ------------------------------------------------------------

  function zAxis() {
    return axis(
      CX,
      P ? 6.55 : 7.05,
      BASE,
      -4, 4,
      [-4, -3, -2, -1, 0, 1, 2, 3, 4],
      'z: standard errors from the target',
      v => v > 0 ? `+${v}` : String(v)
    );
  }

  function zCurve(mark = null, showDirections = false) {
    const A = zAxis();
    const h = P ? 2.45 : 2.15;

    const parts = [
      A.group,
      bell(A, 0, 1, h, C.cyan, 0.15),

      line(
        A.x(0), A.y,
        A.x(0), A.y + h + 0.06,
        GOLD, 2.8
      ),

      tag(
        'IF THE NULL IS TRUE',
        GOLD,
        CX, A.y + h + 0.35,
        16
      )
    ];

    if (mark !== null) {
      const color = mark < 0 ? C.violet : C.green;
      const mh = h * Math.exp(-0.5 * mark * mark);

      parts.push(
        line(
          A.x(mark), A.y,
          A.x(mark), A.y + mh + 0.15,
          color, 3
        ),

        glowDot(
          A.x(mark), A.y + mh,
          color, 0.12
        ),

        tag(
          `z = ${mark > 0 ? '+' : ''}${mark}`,
          color,
          A.x(mark),
          A.y + mh + 0.53,
          18
        )
      );
    }

    if (showDirections) {
      parts.push(
        txt(
          'SURPRISING',
          16, C.violet,
          A.x(-2.85),
          A.y + 0.75,
          true
        ),

        txt(
          'ORDINARY',
          17, C.cyan,
          A.x(0),
          A.y + 0.65,
          true
        ),

        txt(
          'SURPRISING',
          16, C.violet,
          A.x(2.85),
          A.y + 0.75,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 0-2. Recap the two hypotheses.
  // ============================================================

  await until(S(0));
  await play(
    ...scene([
      ['null', story(0, false)],
      ['alternative', story(1, false)]
    ]),
    ...say('TWO STORIES ABOUT ONE MACHINE')
  );

  await until(S(1));
  await play(
    ...put('null', story(0, true)),
    ...say('NULL: LONG-RUN MEAN = 500 g', GOLD)
  );

  await until(S(2));
  await play(
    ...put('alternative', story(1, true)),
    ...say('ALTERNATIVE: THE MEAN HAS DRIFTED', C.violet)
  );

  // ============================================================
  // 3. Weigh the morning sample.
  // ============================================================

  const TX = P ? 0 : -3.0;
  const TY = P ? 0.05 : -0.40;

  const SX = P ? 0 : 3.1;
  const SY = P ? -3.55 : -0.75;

  const scaleVisual = new M.VGroup(
    scale(SX, SY, 1.15, `${D[0]} g`),

    bottle(
      SX,
      SY + 1.15,
      0.86, 0.70,
      '500 g'
    ),

    txt(
      'One bottle at a time',
      18, C.muted,
      SX, SY - 0.80
    )
  );

  const weighArrow = P
    ? arrow(
        0, TY - 1.55,
        0, SY + 2.05,
        C.cyan, 3
      )
    : arrow(
        TX + 1.75, TY,
        SX - 1.25, TY,
        C.cyan, 3
      );

  await until(S(3));
  await play(
    ...scene([
      ['tray', tray(TX, TY)],
      ['scale', scaleVisual],
      ['arrow', weighArrow]
    ]),
    ...say('WEIGH THIS MORNING’S 16 BOTTLES')
  );

  // ============================================================
  // 4. Each bottle becomes a dot on a grams line.
  // ============================================================

  const dotLevels = {};
  const dotObjects = D.map(v => {
    const j = dotLevels[v] || 0;
    dotLevels[v] = j + 1;

    return glowDot(
      RAW.x(v),
      RAW.y + 0.28 + j * 0.32,
      C.cyan, 0.105
    );
  });

  const dotGroup = new M.VGroup(...dotObjects);

  await until(S(4));

  const rawStart = clear();

  layers.set('axis', RAW.group);
  layers.set('target', targetLine(RAW, 2.0));
  layers.set('dots', dotGroup);
  layers.set('note', rawNote(RAW));

  await play(
    ...rawStart,

    new M.Create(layers.get('axis')),
    new M.FadeIn(layers.get('target')),
    new M.FadeIn(layers.get('note')),

    new M.LaggedStart(
      [new M.FadeIn(dotGroup)],
      { lagRatio: 0.10, runTime: 1.5 }
    ),

    ...say('ONE DOT = ONE BOTTLE')
  );

  // ============================================================
  // 5-6. Mean = total divided by sixteen; fair share.
  // ============================================================

  await until(S(5));
  await play(
    ...scene([
      ['axis', RAW_SPLIT.group],
      ['target', targetLine(RAW_SPLIT, 2.0)],
      ['dots', rawDots(RAW_SPLIT)],
      ['mean', meanFlag(RAW_SPLIT)],
      ['note', rawNote(RAW_SPLIT)]
    ]),

    ...fbox([
      `total = ${TOTAL} g`,
      `count = ${N}`,
      [`${TOTAL} ÷ ${N} = ${MEAN} g`, C.cyan]
    ]),

    ...say('BATCH MEAN = 502 GRAMS', C.cyan, true)
  );

  await until(S(6));
  await play(
    ...scene([
      ['shares', shareBars(false)]
    ]),

    ...fbox([
      'Same total',
      '16 equal shares',
      ['502 g each', C.green]
    ], C.green),

    ...say('MEAN = THE FAIR SHARE', C.green, true)
  );

  await play(
    ...morph('shares', shareBars(true))
  );

  // ============================================================
  // 7. The raw departure is two grams.
  // ============================================================

  const DEPARTURE = axis(
    CX,
    P ? 6.55 : 7.05,
    BASE,
    496, 504,
    [496, 498, 500, 502, 504],
    'batch mean (grams)'
  );

  await until(S(7));
  await play(
    ...scene([
      ['axis', DEPARTURE.group],
      ['target', targetLine(DEPARTURE, 1.70)],
      [
        'mean',
        meanMarker(
          DEPARTURE,
          MEAN,
          C.cyan,
          '502 g',
          1.05
        )
      ],
      [
        'distance',
        bracket(
          DEPARTURE,
          TARGET,
          MEAN,
          DEPARTURE.y + 0.60,
          '+2 g',
          C.amber
        )
      ]
    ]),

    ...fbox([
      '502 − 500',
      ['= +2 g', C.amber],
      'Is that far?'
    ], C.amber),

    ...say('TWO GRAMS ABOVE THE TARGET', C.amber, true)
  );

  // ============================================================
  // 8-9. Distance needs a ruler.
  // ============================================================

  await until(S(8));
  await play(
    ...scene([
      ['axis', DIST.group],
      [
        'wide',
        distribution(
          4, C.violet,
          P ? 1.30 : 1.10,
          ''
        )
      ],
      [
        'narrow',
        distribution(
          1, C.cyan,
          P ? 2.30 : 2.00,
          ''
        )
      ],
      ['target', distributionTarget()]
    ]),

    ...fbox([
      ['More wobble: less unusual', C.violet],
      ['Less wobble: more unusual', C.cyan],
      'Same 2 g departure'
    ]),

    ...say('HOW MUCH DO BATCH MEANS WOBBLE?', C.cyan, true)
  );

  await until(S(9));
  await play(
    ...scene([
      ['ruler', simpleRuler()]
    ]),

    ...fbox([
      'To measure distance,',
      ['we need a unit.', C.amber]
    ], C.amber),

    ...say('FIRST FIND OUR UNIT OF DISTANCE', C.amber, true)
  );

  // ============================================================
  // 10-13. Known spread of individual bottle weights.
  // ============================================================

  await until(S(10));
  await play(
    ...scene([
      ['axis', DIST.group],
      ['target', distributionTarget()],
      ['means', sampleMeanDots()]
    ]),

    ...fbox([
      ['Assume mean = 500 g', GOLD],
      'Different samples',
      ['Different sample means', C.cyan]
    ]),

    ...say('EVEN A PERFECT MACHINE GIVES WOBBLE', C.cyan, true)
  );

  await until(S(11));
  await play(
    ...drop('means'),

    ...put(
      'distribution',
      distribution(
        SD, C.cyan,
        P ? 2.25 : 1.85,
        'Individual bottle weights'
      )
    ),

    ...put(
      'spread',
      bracket(
        DIST,
        TARGET,
        TARGET + SD,
        DIST.y + 0.55,
        '4 g',
        C.amber
      )
    ),

    ...fbox([
      'Years of records',
      ['Bottle spread = 4 g', C.amber]
    ], C.amber),

    ...say('ONE BOTTLE: TYPICAL SPREAD OF 4 g', C.amber, true)
  );

  await until(S(12));
  await play(
    ...indicate('spread', C.amber),

    ...fbox([
      'Standard deviation',
      ['SD = 4 g', C.amber]
    ], C.amber),

    ...say('STANDARD DEVIATION = INDIVIDUAL SPREAD', C.amber, true)
  );

  await until(S(13));
  await play(
    ...fbox([
      ['Known from records', C.green],
      'Standard deviation',
      ['SD = 4 g', C.amber]
    ], C.green),

    ...say('IN THIS CHAPTER: SD IS KNOWN', C.green, true)
  );

  // ============================================================
  // 14. High and low weights cancel when averaged.
  // ============================================================

  await until(S(14));
  await play(
    ...scene([
      ['bottles', cancellationPicture()],
      ['balance', cancellationMean()]
    ]),

    ...fbox([
      'Highs and lows',
      'partly cancel out.',
      ['Means wobble less.', C.green]
    ], C.green),

    ...say('AVERAGES ARE STEADIER THAN INDIVIDUALS', C.green, true)
  );

  // ============================================================
  // 15-18. Standard error = standard deviation / sqrt(n).
  // ============================================================

  await until(S(15));
  await play(
    ...scene([
      ['spreadBlocks', spreadBlocks(false)]
    ]),

    ...fbox([
      'standard error',
      ['= SD ÷ √n', C.cyan],
      '= 4 ÷ √16'
    ]),

    ...say('DIVIDE SPREAD BY THE SQUARE ROOT OF COUNT', C.cyan, true)
  );

  await until(S(16));
  await play(
    ...scene([
      ['square', squareRootPicture()]
    ]),

    ...fbox([
      '4 × 4 = 16',
      ['√16 = 4', C.green],
      'SE = 4 ÷ 4'
    ], C.green),

    ...say('SQUARE ROOT OF 16 = 4', C.green, true)
  );

  await until(S(17));
  await play(
    ...scene([
      ['spreadBlocks', spreadBlocks(true)]
    ]),

    ...fbox([
      'SE = 4 ÷ 4',
      ['SE = 1 g', C.green]
    ], C.green),

    ...say('FOUR GRAMS DIVIDED BY FOUR = ONE GRAM', C.green, true)
  );

  await until(S(18));
  await play(
    ...scene([
      ['axis', DIST.group],
      [
        'individual',
        distribution(
          SD, C.violet,
          P ? 1.22 : 1.05,
          ''
        )
      ],
      [
        'sampleMeans',
        distribution(
          SE, C.cyan,
          P ? 2.40 : 2.00,
          ''
        )
      ],
      ['target', distributionTarget()],
      [
        'individualLabel',
        txt(
          'Wide violet curve: single bottles, SD = 4 g',
          P ? 19 : 18, C.violet,
          CX,
          DIST.y - 1.2,
          false,
          DIST.width
        )
      ],
      [
        'sampleLabel',
        txt(
          'Narrow cyan curve: 16-bottle means, SE = 1 g',
          P ? 19 : 18, C.cyan,
          CX,
          DIST.y - (P ? 1.7 : 1.62),
          false,
          DIST.width
        )
      ]
    ]),

    ...fbox([
      ['Bottle SD = 4 g', C.violet],
      ['16-bottle SE = 1 g', C.cyan],
      ['SE = standard error', C.green]
    ], C.green),

    ...say('STANDARD ERROR = THE WOBBLE OF SAMPLE MEANS', C.green, true)
  );

  // ============================================================
  // 19-20. Build the standard-error ruler.
  // ============================================================

  await until(S(19));
  await play(
    ...scene([
      ['ruler', ruler(1, true)]
    ]),

    ...fbox([
      'Our new ruler',
      ['1 standard error', C.green],
      ['= 1 gram', C.green]
    ], C.green),

    ...say('ONE STEP = ONE STANDARD ERROR', C.green, true)
  );

  await until(S(20));
  await play(
    ...put('point', rulerPoint(MEAN)),

    ...fbox([
      `target = ${TARGET}`,
      `batch mean = ${MEAN}`,
      ['Measure the distance', C.amber]
    ], C.amber),

    ...say('MEASURE FROM 500 TO 502', C.amber, true)
  );

  // ============================================================
  // 21-23. Two grams equals two standard errors.
  // ============================================================

  await until(S(21));
  await play(
    ...drop('point'),

    ...put(
      'point',
      rulerPoint(MEAN, C.cyan)
    ),

    ...put(
      'departure',
      distanceArrow(MEAN, C.amber, '+2 g')
    ),

    ...fbox([
      'departure',
      '= mean − target',
      '= 502 − 500',
      ['= +2 g', C.amber]
    ], C.amber),

    ...say('DEPARTURE = BATCH MEAN MINUS TARGET', C.amber, true)
  );

  await until(S(22));
  await play(
    ...drop('departure'),

    ...put(
      'steps',
      measuredSteps(MEAN, SE, C.green)
    ),

    ...fbox([
      'distance ÷ step size',
      '= 2 g ÷ 1 g',
      ['= 2 steps', C.green]
    ], C.green),

    ...say('TWO GRAMS = TWO STEPS ON OUR RULER', C.green, true)
  );

  await until(S(23));
  await play(
    ...indicate('steps', C.green),

    ...fbox([
      ['+2 standard errors', C.green],
      'above the target'
    ], C.green),

    ...say('TWO STANDARD ERRORS ABOVE 500', C.green, true)
  );

  // ============================================================
  // 24-25. Give the number its name.
  // ============================================================

  await until(S(24));
  await play(
    ...drop('point', 'steps'),

    ...put('zBadge', zBadge(Z)),

    ...fbox([
      'test statistic',
      ['z = +2', C.green]
    ], C.green),

    ...say('TEST STATISTIC = +2', C.green, true)
  );

  const SQUEEZE_X1 = P ? -1.82 : -4.55;
  const SQUEEZE_X2 = P ? 1.90 : -0.55;
  const SQUEEZE_Y = P ? -1.05 : -0.40;

  const squeezedSample = new M.VGroup(
    ...Array.from({ length: N }, (_, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);

      return glowDot(
        SQUEEZE_X1 + (col - 1.5) * 0.34,
        SQUEEZE_Y + (1.5 - row) * 0.34,
        C.cyan,
        0.105
      );
    }),

    txt(
      '16 WEIGHTS',
      18, C.cyan,
      SQUEEZE_X1, SQUEEZE_Y - 1.05,
      true
    )
  );

  const squeezedNumber = new M.VGroup(
    rect(
      SQUEEZE_X2,
      SQUEEZE_Y,
      2.05, 1.50,
      C.green,
      C.green, 0.12
    ),

    txt(
      '+2', 42, C.green,
      SQUEEZE_X2,
      SQUEEZE_Y,
      true
    ),

    txt(
      'ONE NUMBER',
      18, C.green,
      SQUEEZE_X2,
      SQUEEZE_Y - 1.05,
      true
    )
  );

  await until(S(25));
  await play(
    ...scene([
      ['sample', squeezedSample],
      [
        'arrow',
        arrow(
          SQUEEZE_X1 + 0.80, SQUEEZE_Y,
          SQUEEZE_X2 - 1.20, SQUEEZE_Y,
          C.cyan, 3.5
        )
      ],
      ['statistic', squeezedNumber]
    ]),

    ...fbox([
      'Whole sample',
      ['→ one statistic', C.green],
      'Distance from H₀'
    ], C.green),

    ...say('SIXTEEN WEIGHTS BECOME ONE DISTANCE', C.green, true)
  );

  // ============================================================
  // 26-28. The sign gives the direction.
  // Another day's mean = 498.5 g.
  // ============================================================

  await until(S(26));
  await play(
    ...scene([
      ['ruler', ruler(1, true)],
      ['directions', signedDirections()]
    ]),

    ...fbox([
      ['+ means above target', C.green],
      ['− means below target', C.violet]
    ]),

    ...say('THE SIGN TELLS THE DIRECTION', C.cyan, true)
  );

  const OTHER_MEAN = 498.5;
  const OTHER_Z = (OTHER_MEAN - TARGET) / SE;

  await until(S(27));
  await play(
    ...drop('directions'),

    ...put(
      'point',
      rulerPoint(OTHER_MEAN, C.violet)
    ),

    ...put(
      'steps',
      measuredSteps(OTHER_MEAN, SE, C.violet)
    ),

    ...fbox([
      'Another day',
      '498.5 − 500 = −1.5',
      ['z = −1.5', C.violet]
    ], C.violet),

    ...say('ANOTHER BATCH: 498.5 g', C.violet, true)
  );

  await until(S(28));
  await play(
    ...drop('point'),

    ...put(
      'zBadge',
      zBadge(OTHER_Z, C.violet)
    ),

    ...indicate('steps', C.violet),

    ...fbox([
      ['−1.5 standard errors', C.violet],
      'below the target'
    ], C.violet),

    ...say('ONE AND A HALF STEPS BELOW 500', C.violet, true)
  );

  // ============================================================
  // 29-32. Formula: short version of the visual process.
  // ============================================================

  function formulaFlow(stage = 0) {
    const x = CX;
    const w = P ? 6.35 : 6.65;
    const h = 0.86;

    const y1 = P ? 0.30 : 0.90;
    const y2 = P ? -1.25 : -0.52;
    const y3 = P ? -2.80 : -1.92;

    const names = [
      stage >= 3 ? '502 − 500 = +2 g' : 'Batch mean − target',
      stage >= 3 ? 'Divide by 1 g' : 'Divide by standard error',
      stage >= 3
        ? 'z = +2'
        : (stage >= 2 ? 'z: standardized distance' : 'Distance in standard errors')
    ];

    const colors = [
      C.amber,
      C.cyan,
      C.green
    ];

    const ys = [y1, y2, y3];
    const parts = [];

    for (let i = 0; i < 3; i++) {
      parts.push(
        rect(
          x, ys[i], w, h,
          colors[i],
          C.card, 0.95
        ),

        txt(
          names[i],
          i === 2 ? 23 : 21,
          colors[i],
          x, ys[i],
          stage >= 3,
          w - 0.5
        )
      );
    }

    parts.push(
      arrow(
        x, y1 - h / 2 - 0.04,
        x, y2 + h / 2 + 0.04,
        C.muted, 2.5
      ),

      arrow(
        x, y2 - h / 2 - 0.04,
        x, y3 + h / 2 + 0.04,
        C.muted, 2.5
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(29));
  await play(
    ...scene([
      ['flow', formulaFlow(0)]
    ]),

    ...fbox([
      'Find the departure.',
      'Find the step size.',
      ['Divide.', C.green]
    ], C.green),

    ...say('THE FORMULA IS JUST OUR TWO STEPS', C.cyan, true)
  );

  await until(S(30));
  await play(
    ...put('flow', formulaFlow(1)),

    ...fbox([
      '    mean − target',
      'z = ─────────────',
      '    standard error'
    ]),

    ...say('z = DEPARTURE ÷ STANDARD ERROR', C.cyan, true)
  );

  await until(S(31));
  await play(
    ...put('flow', formulaFlow(2)),

    ...fbox([
      ['z = standardized distance', C.green],
      'For a sample mean',
      'Use its standard error.'
    ], C.green),

    ...say('STANDARDIZING A SAMPLE MEAN', C.green, true)
  );

  await until(S(32));
  await play(
    ...put('flow', formulaFlow(3)),

    ...fbox([
      'z = (502 − 500) ÷ 1',
      '  = 2 ÷ 1',
      ['  = +2', C.green]
    ], C.green),

    ...say('OUR MORNING BATCH: z = +2', C.green, true)
  );

  // ============================================================
  // 33-35. One common ruler, regardless of original units.
  // ============================================================

  await until(S(33));
  await play(
    ...scene([
      ['rulers', commonRulers()]
    ]),

    ...fbox([
      'Original units differ.',
      ['Standard errors', C.green],
      'give one common ruler.'
    ], C.green),

    ...say('PUT DIFFERENT TESTS ON THE SAME RULER', C.green, true)
  );

  await until(S(34));
  await play(
    ...indicate('rulers', C.cyan),

    ...fbox([
      'grams',
      'minutes',
      'euros',
      ['→ standard errors away', C.green]
    ], C.green),

    ...say('ALL BECOME STANDARDIZED DISTANCES', C.green, true)
  );

  await until(S(35));
  await play(
    ...scene([
      ['curve', zCurve(null, true)]
    ]),

    ...fbox([
      ['z near 0: ordinary', C.cyan],
      ['Large |z|: surprising', C.violet],
      'Either direction'
    ], C.violet),

    ...say('FAR FROM ZERO = MORE SURPRISING', C.violet, true)
  );

  // ============================================================
  // 36-38. Trap: same raw departure, different sample sizes.
  // 16 bottles: SE = 1 g, z = +2.
  // 64 bottles: SE = 0.5 g, z = +4.
  // ============================================================

  await until(S(36));
  await play(
    ...scene([
      ['comparison', sampleComparison(true)]
    ]),

    ...fbox([
      ['Both: raw departure = 2 g', C.amber],
      ['16 bottles: z = +2', C.cyan],
      ['64 bottles: z = +4', C.green]
    ], C.amber),

    ...say('TRAP: RAW GRAMS ALONE ARE NOT ENOUGH', RED, true)
  );

  await until(S(37));
  await play(
    ...indicate('comparison', C.green),

    ...fbox([
      'n = 64',
      '√64 = 8',
      'SE = 4 ÷ 8 = 0.5 g',
      ['z = 2 ÷ 0.5 = +4', C.green]
    ], C.green),

    ...say('MORE BOTTLES MAKE THE RULER FINER', C.green, true)
  );

  await until(S(38));
  await play(
    ...indicate('comparison', C.green),

    ...fbox([
      ['Same departure: 2 g', C.amber],
      ['16 bottles: 2 steps', C.cyan],
      ['64 bottles: 4 steps', C.green]
    ], C.green),

    ...say('SAME DISTANCE, MORE STANDARD ERRORS', C.green, true)
  );

  // ============================================================
  // 39. Preview the next lesson: how rare is z = +2?
  // Do not reveal the p-value yet.
  // ============================================================

  await until(S(39));
  await play(
    ...scene([
      ['curve', zCurve(Z)]
    ]),

    ...fbox([
      ['Observed z = +2', C.green],
      'If the null is true,',
      ['how rare is this?', C.amber]
    ], C.amber),

    ...say('NEXT: HOW SURPRISING IS z = +2?', C.amber, true)
  );

  // ============================================================
  // 40. Final recap.
  // ============================================================

  const recapX = CX;
  const recapY = P ? -1.10 : -0.40;
  const recapW = P ? 6.35 : 6.75;
  const recapH = P ? 3.55 : 3.45;

  const recap = new M.VGroup(
    rect(
      recapX, recapY,
      recapW, recapH,
      C.green, C.card, 0.95
    ),

    txt(
      'TEST STATISTIC',
      23, C.green,
      recapX,
      recapY + 1.25,
      true, recapW - 0.6
    ),

    txt(
      'How far from the null?',
      23, C.ink,
      recapX,
      recapY + 0.62,
      false, recapW - 0.6
    ),

    txt(
      'Measured in standard errors',
      20, C.cyan,
      recapX,
      recapY + 0.02,
      false, recapW - 0.6
    ),

    txt(
      'z = +2',
      36, C.green,
      recapX,
      recapY - 0.65,
      true
    ),

    txt(
      '+ above     − below',
      19, C.muted,
      recapX,
      recapY - 1.27,
      true, recapW - 0.6
    )
  );

  await until(S(40));
  await play(
    ...scene([
      ['recap', recap]
    ]),

    ...fbox([
      'z = (mean − target) ÷ SE',
      '  = (502 − 500) ÷ 1',
      ['  = +2', C.green]
    ], C.green),

    ...say('DISTANCE FROM THE NULL, IN STANDARD ERRORS', C.green, true)
  );
}

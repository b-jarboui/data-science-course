// lesson 7.1.3
// The p-value.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter data: target = 500 g, known spread = 4 g,
// sample size = 16, standard error = 1 g, batch mean = 502 g.
// Observed z = +2. Two-sided p = 0.0455 (approximately 0.046).
// The simulated dot hill is illustrative; probability labels use
// the standard normal distribution, not counts from that small hill.
// Browser rendering and narration synchronization have not been
// runtime-tested against site/live/engine.js.

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

  const P_RIGHT = 0.0228;
  const P_LEFT = 0.0228;
  const P_TWO = 0.0455;
  const ALPHA = 0.05;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Primitive drawing helpers.
  // All groups are assembled before appearing on screen.
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false,
    maxw = FW - 1
  ) {
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

  function arrow(
    x1, y1, x2, y2,
    color = C.cyan,
    sw = 3
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.16;
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

  function glowDot(
    x, y,
    color = C.cyan,
    radius = 0.095
  ) {
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
    const maxw = P ? FW - 1 : 7.2;

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function heading(s, color = C.ink) {
    return txt(
      s,
      P ? 22 : 23,
      color,
      CX,
      P ? 0.78 : 1.12,
      false,
      P ? 6.55 : 7.05
    );
  }

  // ------------------------------------------------------------
  // Scene layers.
  // No already-visible objects are regrouped.
  // Every helper returns animations for one sequential play().
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
      new M.Indicate(
        layers.get(key),
        { color }
      )
    ];
  }

  // ------------------------------------------------------------
  // Formula box: same style as the approved reference.
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
  // Shared juice bottle and scale.
  // Same cylinder-like glowing bottle style as lessons 7.1.1-2.
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
      x, y, w, h,
      color, C.card, 0.30,
      0.10 * s
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
      color, C.card, 0.9,
      0.035 * s
    );

    const cap = rect(
      x, y + h / 2 + 0.19 * s,
      0.34 * s, 0.12 * s,
      color, color, 0.95,
      0.025 * s
    );

    const parts = [
      halo, body, juice, neck, cap
    ];

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
          true,
          0.40 * s
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function scale(x, y, s = 1, display = '? g') {
    const platform = rect(
      x, y + 0.44 * s,
      1.85 * s, 0.15 * s,
      C.muted, C.card, 1,
      0.05 * s
    );

    const body = rect(
      x, y,
      1.55 * s, 0.72 * s,
      C.cyan, C.card, 0.95,
      0.12 * s
    );

    const screen = rect(
      x, y,
      1.04 * s, 0.36 * s,
      C.muted, C.card, 1,
      0.06 * s
    );

    const reading = txt(
      display,
      19 * s,
      GOLD,
      x, y,
      true,
      0.90 * s
    );

    return new M.VGroup(
      body, platform, screen, reading
    );
  }

  function tray(
    x, y,
    s = 1,
    color = C.cyan,
    showLabel = true
  ) {
    const dx = 0.52 * s;
    const dy = 0.51 * s;

    const w = 2.45 * s;
    const h = 2.35 * s;

    const frame = rect(
      x, y,
      w, h,
      color, C.card, 0.85,
      0.13 * s
    );

    const parts = [frame];

    for (let i = 0; i < N; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);

      const fill =
        0.65 + ((i * 7 + 2) % 5) * 0.035;

      parts.push(
        bottle(
          x + (col - 1.5) * dx,
          y + (1.5 - row) * dy - 0.04 * s,
          0.32 * s,
          fill,
          '',
          color
        )
      );
    }

    if (showLabel) {
      parts.push(
        txt(
          '16 BOTTLES',
          Math.max(12, 18 * s),
          color,
          x, y + h / 2 + 0.25 * s,
          true,
          w + 0.2
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Number line.
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
      line(
        x(lo), y,
        x(hi), y,
        C.muted, 2.5
      )
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
          P ? 16 : 18,
          C.muted,
          x(v), y - 0.30,
          true
        )
      );
    });

    parts.push(
      txt(
        unit,
        17, C.muted,
        cx, y - 0.74,
        false, width
      )
    );

    return {
      x, y, lo, hi, width, cx,
      group: new M.VGroup(...parts)
    };
  }

  const signed = v =>
    v > 0 ? `+${v}` : String(v);

  // ------------------------------------------------------------
  // Opening picture: 502 g is two standard errors above 500 g.
  // ------------------------------------------------------------

  function openingSample() {
    const tx = CX - 1.65;
    const sx = CX + 1.65;

    const ty = P ? -0.42 : -0.25;
    const sy = P ? -0.64 : -0.45;

    return new M.VGroup(
      tray(tx, ty, 0.94),

      arrow(
        tx + 1.28, ty,
        sx - 1.12, ty,
        C.cyan, 3
      ),

      scale(sx, sy, 1.0, '? g'),

      bottle(
        sx, sy + 1.0,
        0.78, 0.73,
        '500 g'
      ),

      txt(
        'Batch mean',
        18, C.muted,
        sx, sy - 0.67
      ),

      tag(
        '502 g',
        C.cyan,
        sx, sy - 1.14,
        21
      )
    );
  }

  function openingRuler() {
    const A = axis(
      CX,
      P ? 6.55 : 7.05,
      BASE,
      497, 503,
      [497, 498, 499, 500, 501, 502, 503],
      'batch mean (grams)'
    );

    const zy = A.y + 0.68;

    const parts = [
      A.group,

      line(
        A.x(497), zy,
        A.x(503), zy,
        C.cyan, 2.5
      ),

      line(
        A.x(500), A.y,
        A.x(500), A.y + 1.90,
        GOLD, 3
      ),

      tag(
        '500 g',
        GOLD,
        A.x(500),
        A.y + 2.17,
        17
      )
    ];

    for (let z = -3; z <= 3; z++) {
      const xx = A.x(TARGET + z * SE);

      parts.push(
        line(
          xx, zy - 0.09,
          xx, zy + 0.09,
          z === 0 ? GOLD : C.cyan
        ),

        txt(
          signed(z),
          18,
          z === 0 ? GOLD : C.cyan,
          xx, zy + 0.27,
          true
        )
      );
    }

    parts.push(
      glowDot(
        A.x(MEAN),
        zy,
        C.green, 0.13
      ),

      tag(
        '502 g',
        C.green,
        A.x(MEAN),
        A.y + 2.17,
        17
      ),

      arrow(
        A.x(500) + 0.035,
        A.y + 1.48,
        A.x(501) - 0.035,
        A.y + 1.48,
        C.green, 3
      ),

      arrow(
        A.x(501) + 0.035,
        A.y + 1.48,
        A.x(502) - 0.035,
        A.y + 1.48,
        C.green, 3
      ),

      txt(
        '1 SE',
        17, C.green,
        A.x(500.5),
        A.y + 1.75,
        true
      ),

      txt(
        '1 SE',
        17, C.green,
        A.x(501.5),
        A.y + 1.75,
        true
      ),

      txt(
        'z: standard errors from target',
        17, C.cyan,
        CX,
        zy + 0.66,
        false, A.width
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Hypothetical perfect machine.
  // The null is assumed true for the simulation.
  // ------------------------------------------------------------

  function perfectMachine() {
    const x = CX;
    const y = P ? -0.85 : -0.25;

    const tx = x - 1.85;
    const beltY = y - 1.65;
    const by = y - 0.96;

    const parts = [
      rect(
        tx, y + 0.70,
        1.55, 0.90,
        C.cyan, C.card, 0.95
      ),

      txt(
        'JUICE',
        19, C.cyan,
        tx, y + 0.70,
        true
      ),

      rect(
        tx, y + 0.02,
        0.24, 0.40,
        C.muted, C.card, 1,
        0.04
      ),

      line(
        tx, y - 0.18,
        tx, y - 0.32,
        C.cyan, 5
      ),

      line(
        tx - 1.0, y + 0.75,
        tx - 1.0, beltY,
        C.muted, 4
      ),

      line(
        tx - 1.0, y + 0.75,
        tx - 0.78, y + 0.75,
        C.muted, 4
      ),

      rect(
        x, beltY,
        6.10, 0.22,
        C.muted, C.card, 1,
        0.06
      )
    ];

    const fills = [
      0.68, 0.77, 0.72, 0.65
    ];

    for (let i = 0; i < 4; i++) {
      parts.push(
        bottle(
          tx + i * 1.25,
          by,
          0.86,
          fills[i],
          '500 g'
        )
      );
    }

    for (let i = 0; i < 9; i++) {
      const r = new M.Circle({
        radius: 0.065,
        color: C.muted
      });

      r.setFill(C.muted, 0.45);
      r.moveTo([
        x - 2.68 + i * 0.67,
        beltY,
        0
      ]);

      parts.push(r);
    }

    parts.push(
      tag(
        'TRUE MEAN = 500 g',
        GOLD,
        x + 0.95,
        y + 0.70,
        19
      ),

      txt(
        'Individual bottles still vary',
        17, C.muted,
        x + 0.95,
        y + 0.16,
        false, 3.65
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Repeated inspections.
  // Every inspection uses sixteen new bottles.
  // The three displayed z values are hypothetical examples.
  // ------------------------------------------------------------

  function inspectionRow() {
    const y = P ? -1.05 : -0.8;
    const dx = P ? 2.12 : 2.28;

    const values = [-0.6, 0.3, 1.1];
    const parts = [];

    values.forEach((v, i) => {
      const x = CX + (i - 1) * dx;

      parts.push(
        txt(
          `INSPECTION ${i + 1}`,
          15, C.muted,
          x, y + 1.28,
          true, dx - 0.12
        ),

        tray(
          x, y,
          0.72,
          C.cyan,
          false
        ),

        txt(
          '16 new bottles',
          16, C.muted,
          x, y - 1.05,
          false, dx - 0.15
        ),

        tag(
          `z = ${signed(v)}`,
          C.cyan,
          x, y - 1.57,
          18
        )
      );
    });

    parts.push(
      txt(
        'One inspection gives one z',
        19, C.ink,
        CX,
        P ? 0.83 : 1.12,
        false, 6.7
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Standard normal curve.
  // Horizontal axis: standardized inspection results under H₀.
  // Finite visible plotting window: -4.5 to +4.5.
  // Probability labels refer to the full normal distribution.
  // ------------------------------------------------------------

  const ZLO = -4.5;
  const ZHI = 4.5;
  const ZW = P ? 6.65 : 7.10;
  const H = P ? 2.65 : 2.18;

  const zx = z =>
    CX - ZW / 2 +
    (z - ZLO) / (ZHI - ZLO) * ZW;

  const density = z =>
    Math.exp(-0.5 * z * z);

  const curveY = z =>
    BASE + H * density(z);

  function normalAxis() {
    return axis(
      CX, ZW, BASE,
      ZLO, ZHI,
      [-4, -3, -2, -1, 0, 1, 2, 3, 4],
      'z: standard errors from target',
      signed
    ).group;
  }

  function normalOutline(
    color = C.cyan,
    width = 2.8
  ) {
    const parts = [];
    const n = 120;

    for (let i = 0; i < n; i++) {
      const a = ZLO + (ZHI - ZLO) * i / n;
      const b = ZLO + (ZHI - ZLO) * (i + 1) / n;

      parts.push(
        line(
          zx(a), curveY(a),
          zx(b), curveY(b),
          color, width
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function normalArea(
    lo = ZLO,
    hi = ZHI,
    color = C.cyan,
    opacity = 0.13
  ) {
    const parts = [];
    const n = Math.max(
      12,
      Math.ceil((hi - lo) * 18)
    );

    const step = (hi - lo) / n;

    for (let i = 0; i < n; i++) {
      const a = lo + step * i;
      const b = a + step;
      const mid = (a + b) / 2;

      const h = Math.max(
        0.002,
        H * density(mid)
      );

      const w = zx(b) - zx(a);

      const r = new M.Rectangle({
        width: w * 1.005,
        height: h,
        color,
        strokeWidth: 0
      });

      r.setFill(color, opacity);
      r.moveTo([
        zx(mid),
        BASE + h / 2,
        0
      ]);

      parts.push(r);
    }

    return new M.VGroup(...parts);
  }

  function nullLine(withLabel = true) {
    const parts = [
      line(
        zx(0), BASE,
        zx(0), BASE + H + 0.08,
        GOLD, 3
      )
    ];

    if (withLabel) {
      parts.push(
        tag(
          'H₀: TRUE MEAN = 500 g',
          GOLD,
          CX,
          BASE + H + 0.36,
          16
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function normalCurve(
    shade = 'none',
    nullLabel = true
  ) {
    const parts = [
      normalArea(
        ZLO, ZHI,
        C.cyan, 0.13
      )
    ];

    if (shade === 'left' || shade === 'both') {
      parts.push(
        normalArea(
          ZLO, -Z,
          C.violet, 0.82
        )
      );
    }

    if (shade === 'right' || shade === 'both') {
      parts.push(
        normalArea(
          Z, ZHI,
          C.violet, 0.82
        )
      );
    }

    parts.push(
      normalOutline(),
      normalAxis(),
      nullLine(nullLabel)
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Dot hill.
  // Deterministic illustrative inspection results.
  // Dot counts follow a bell-shaped envelope.
  // No random state: replay produces the same picture.
  // ------------------------------------------------------------

  function makeDotHill() {
    const positions = [];

    const bins = [
      -3.5, -3, -2.5, -2, -1.5, -1, -0.5,
      0,
      0.5, 1, 1.5, 2, 2.5, 3, 3.5
    ];

    const counts = [
      1, 1, 2, 3, 6, 11, 15,
      17,
      15, 11, 6, 3, 2, 1, 1
    ];

    const pitch = P ? 0.135 : 0.112;
    const radius = P ? 0.060 : 0.050;

    bins.forEach((v, k) => {
      for (let j = 0; j < counts[k]; j++) {
        positions.push({
          v,
          j,
          x: zx(v),
          y: BASE + 0.12 + j * pitch,
          radius
        });
      }
    });

    // Add the bottom rows first so the hill visibly builds upward.
    positions.sort((a, b) =>
      a.j - b.j ||
      Math.abs(a.v) - Math.abs(b.v) ||
      a.v - b.v
    );

    const chunks = [];
    const chunkSize = 5;

    for (let i = 0; i < positions.length; i += chunkSize) {
      const dots = positions.slice(i, i + chunkSize).map(p =>
        glowDot(
          p.x, p.y,
          C.cyan,
          p.radius
        )
      );

      chunks.push(
        new M.VGroup(...dots)
      );
    }

    return chunks;
  }

  function dotHillLabels() {
    return new M.VGroup(
      txt(
        'MOST RESULTS',
        17, C.cyan,
        CX,
        BASE + H + 0.30,
        true
      ),

      txt(
        'FEW',
        17, C.violet,
        zx(-3.0),
        BASE + 0.65,
        true
      ),

      txt(
        'FEW',
        17, C.violet,
        zx(3.0),
        BASE + 0.65,
        true
      ),

      arrow(
        zx(-3.0), BASE + 0.42,
        zx(-3.0), BASE + 0.19,
        C.violet, 2
      ),

      arrow(
        zx(3.0), BASE + 0.42,
        zx(3.0), BASE + 0.19,
        C.violet, 2
      )
    );
  }

  // ------------------------------------------------------------
  // Observed z and its equally distant negative counterpart.
  // ------------------------------------------------------------

  function zMarker(
    value,
    color = C.green,
    label = `z = ${signed(value)}`
  ) {
    const x = zx(value);
    const yy = curveY(value);

    const top = Math.max(
      yy + 0.10,
      BASE + 0.60
    );

    return new M.VGroup(
      line(
        x, BASE,
        x, top,
        color, 3
      ),

      glowDot(
        x, yy,
        color, 0.10
      ),

      tag(
        label,
        color,
        x, top + 0.28,
        17
      )
    );
  }

  function extremeBoundary(value) {
    const x = zx(value);

    return new M.VGroup(
      dashed(
        x, BASE,
        x, BASE + H * 0.50,
        C.violet
      ),

      glowDot(
        x,
        BASE + 0.05,
        C.violet,
        0.075
      )
    );
  }

  function extremeArrows() {
    const y = BASE + H * 0.68;

    return new M.VGroup(
      arrow(
        zx(-Z), y,
        zx(-4.20), y,
        C.violet, 3
      ),

      arrow(
        zx(Z), y,
        zx(4.20), y,
        C.violet, 3
      ),

      txt(
        'z ≤ −2',
        19, C.violet,
        zx(-3.05),
        y + 0.28,
        true
      ),

      txt(
        'z ≥ +2',
        19, C.violet,
        zx(3.05),
        y + 0.28,
        true
      )
    );
  }

  function equalDistances() {
    const y = BASE + H * 0.73;

    return new M.VGroup(
      arrow(
        zx(0) - 0.06, y,
        zx(-Z) + 0.05, y,
        GOLD, 3
      ),

      arrow(
        zx(0) + 0.06, y,
        zx(Z) - 0.05, y,
        GOLD, 3
      ),

      txt(
        '2 steps',
        17, GOLD,
        zx(-1),
        y + 0.30,
        true
      ),

      txt(
        '2 steps',
        17, GOLD,
        zx(1),
        y + 0.30,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Tail labels.
  // A tail's probability is its area, not its height.
  // ------------------------------------------------------------

  function tailLabel(side, text = '2.3%') {
    const sign = side === 'left' ? -1 : 1;

    const x = zx(sign * 3.10);
    const y = BASE + H * 0.38;

    const destX = zx(sign * 2.35);
    const destY = BASE + H * density(2.35) * 0.55;

    return new M.VGroup(
      tag(
        text,
        C.violet,
        x, y,
        19
      ),

      arrow(
        x, y - 0.22,
        destX, destY,
        C.violet, 2
      )
    );
  }

  function tailLabels() {
    return new M.VGroup(
      tailLabel('left'),
      tailLabel('right')
    );
  }

  function tailCutLabels() {
    return new M.VGroup(
      extremeBoundary(-Z),
      extremeBoundary(Z),

      txt(
        '−2',
        18, C.violet,
        zx(-Z),
        BASE + H * 0.54,
        true
      ),

      txt(
        '+2',
        18, C.violet,
        zx(Z),
        BASE + H * 0.54,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // A thousand-inspection picture.
  // 100 blocks, each representing ten inspections.
  // Four full blocks plus 60% of another represent 46 in 1000.
  // This avoids claiming the small illustrative dot hill has
  // exactly the theoretical tail percentage.
  // ------------------------------------------------------------

  function thousandPicture() {
    const cols = 20;
    const rows = 5;

    const dx = P ? 0.30 : 0.32;
    const dy = P ? 0.30 : 0.32;

    const bw = dx * 0.81;
    const bh = dy * 0.81;

    const yy = P ? -1.20 : -0.42;

    const parts = [];

    for (let i = 0; i < cols * rows; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = CX + (col - (cols - 1) / 2) * dx;
      const y = yy + ((rows - 1) / 2 - row) * dy;

      const b = new M.Rectangle({
        width: bw,
        height: bh,
        color: C.muted,
        strokeWidth: 1
      });

      b.setFill(C.cyan, 0.18);
      b.moveTo([x, y, 0]);
      parts.push(b);

      if (i < 5) {
        const fraction = i < 4 ? 1 : 0.6;
        const w = bw * fraction;

        const highlight = new M.Rectangle({
          width: w,
          height: bh,
          color: C.violet,
          strokeWidth: 0
        });

        highlight.setFill(C.violet, 0.95);
        highlight.moveTo([
          x - bw / 2 + w / 2,
          y,
          0
        ]);

        parts.push(highlight);
      }
    }

    parts.push(
      txt(
        '1,000 HYPOTHETICAL INSPECTIONS',
        20, C.ink,
        CX, yy + 1.24,
        true, 6.8
      ),

      txt(
        'Each block = 10 inspections',
        16, C.muted,
        CX, yy - 1.10
      ),

      tag(
        'ABOUT 46 AS EXTREME AS OURS',
        C.violet,
        CX, yy - 1.67,
        17
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // A rare result can have two explanations.
  // This does not assign probabilities to either explanation.
  // ------------------------------------------------------------

  function explanationCards() {
    const w = P ? 3.05 : 3.25;
    const h = P ? 2.65 : 2.70;

    const dx = P ? 1.72 : 1.82;
    const y = CY;

    const x1 = CX - dx;
    const x2 = CX + dx;

    const parts = [
      rect(
        x1, y, w, h,
        C.amber, C.card, 0.95
      ),

      rect(
        x2, y, w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'RARE FLUKE',
        20, C.amber,
        x1, y + 0.85,
        true, w - 0.3
      ),

      txt(
        'REAL DRIFT',
        20, C.violet,
        x2, y + 0.85,
        true, w - 0.3
      ),

      txt(
        'H₀ is true',
        20, C.ink,
        x1, y + 0.30,
        false, w - 0.4
      ),

      txt(
        'H₀ is false',
        20, C.ink,
        x2, y + 0.30,
        false, w - 0.4
      ),

      glowDot(
        x1, y - 0.28,
        GOLD, 0.15
      ),

      arrow(
        x2 - 0.40, y - 0.28,
        x2 + 0.40, y - 0.28,
        C.violet, 3
      ),

      txt(
        'Unusual sample',
        18, C.amber,
        x1, y - 0.86,
        false, w - 0.4
      ),

      txt(
        'Mean has moved',
        18, C.violet,
        x2, y - 0.86,
        false, w - 0.4
      ),

      txt(
        'OR',
        16, C.muted,
        CX, y,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Significance level: five in a hundred.
  // ------------------------------------------------------------

  function significanceGrid() {
    const cols = 10;
    const rows = 10;

    const dx = P ? 0.40 : 0.29;
    const dy = P ? 0.40 : 0.29;
    const r = P ? 0.085 : 0.065;

    const y = P ? -1.18 : -0.40;

    const parts = [];

    for (let i = 0; i < 100; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const color = i < 5
        ? C.amber
        : C.muted;

      const d = new M.Dot({
        point: [
          CX + (col - 4.5) * dx,
          y + (4.5 - row) * dy,
          0
        ],
        radius: r,
        color
      });

      d.setFill(
        color,
        i < 5 ? 1 : 0.44
      );

      parts.push(d);
    }

    parts.push(
      tag(
        '5 IN 100',
        GOLD,
        CX,
        y + 4.5 * dy + 0.44,
        20
      ),

      txt(
        'Chosen before testing',
        18, C.muted,
        CX,
        y - 4.5 * dy - 0.48
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Compare p with alpha.
  // A zoomed probability ruler makes their closeness visible.
  // ------------------------------------------------------------

  function probabilityRuler(
    observed = 0.046,
    second = null,
    showDecision = false
  ) {
    const lo = 0;
    const hi = 0.10;

    const w = P ? 6.30 : 6.75;
    const y = P ? -2.05 : -1.20;

    const px = v =>
      CX - w / 2 +
      (v - lo) / (hi - lo) * w;

    const parts = [
      rect(
        (px(0) + px(ALPHA)) / 2,
        y,
        px(ALPHA) - px(0),
        0.34,
        C.violet,
        C.violet,
        0.20,
        0.025
      ),

      rect(
        (px(ALPHA) + px(hi)) / 2,
        y,
        px(hi) - px(ALPHA),
        0.34,
        C.muted,
        C.muted,
        0.13,
        0.025
      ),

      line(
        px(lo), y,
        px(hi), y,
        C.muted, 2.5
      )
    ];

    for (let i = 0; i <= 10; i++) {
      const v = i / 100;

      parts.push(
        line(
          px(v), y - 0.08,
          px(v), y + 0.08,
          C.muted, 1.5
        )
      );

      if (i % 2 === 0) {
        parts.push(
          txt(
            v.toFixed(2),
            16, C.muted,
            px(v), y - 0.35,
            true
          )
        );
      }
    }

    parts.push(
      line(
        px(ALPHA), y - 0.10,
        px(ALPHA), y + 1.12,
        GOLD, 3
      ),

      tag(
        'α = 0.05',
        GOLD,
        px(ALPHA),
        y + 1.43,
        18
      ),

      glowDot(
        px(observed), y,
        C.violet, 0.105
      ),

      line(
        px(observed), y + 0.16,
        px(observed) - 0.75, y + 0.62,
        C.violet, 2
      ),

      tag(
        `p = ${observed.toFixed(3)}`,
        C.violet,
        px(observed) - 1.03,
        y + 0.88,
        17
      ),

      txt(
        'Probability (zoomed: 0 to 0.10)',
        17, C.muted,
        CX, y - 0.78,
        false, w
      )
    );

    if (second !== null) {
      parts.push(
        glowDot(
          px(second), y,
          C.cyan, 0.105
        ),

        line(
          px(second), y + 0.16,
          px(second) + 0.75, y + 0.62,
          C.cyan, 2
        ),

        tag(
          `p = ${second.toFixed(3)}`,
          C.cyan,
          px(second) + 1.03,
          y + 0.88,
          17
        )
      );
    }

    if (showDecision) {
      parts.push(
        txt(
          'REJECT H₀',
          18, C.violet,
          px(0.025),
          y + 0.35,
          true, w / 2 - 0.25
        ),

        txt(
          'DO NOT REJECT',
          17, C.muted,
          px(0.075),
          y + 0.35,
          true, w / 2 - 0.25
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Common probability scale from zero to one.
  // ------------------------------------------------------------

  function rarityScale(compare = false) {
    const w = P ? 6.45 : 6.75;
    const y = CY;

    const px = p =>
      CX - w / 2 + p * w;

    const parts = [
      line(
        px(0), y,
        px(1), y,
        C.muted, 3
      )
    ];

    for (let i = 0; i <= 10; i++) {
      const p = i / 10;

      parts.push(
        line(
          px(p), y - 0.09,
          px(p), y + 0.09,
          C.muted, 1.8
        )
      );

      if (i % 2 === 0) {
        parts.push(
          txt(
            p.toFixed(1),
            17, C.muted,
            px(p), y - 0.32,
            true
          )
        );
      }
    }

    parts.push(
      glowDot(
        px(P_TWO),
        y,
        C.violet,
        0.13
      ),

      tag(
        'p = 0.046',
        C.violet,
        px(0.17),
        y + 0.92,
        18
      ),

      arrow(
        px(0.17), y + 0.62,
        px(P_TWO), y + 0.16,
        C.violet, 2.5
      ),

      txt(
        'RARE UNDER H₀',
        18, C.violet,
        px(0.20),
        y - 0.92,
        true, w * 0.46
      ),

      txt(
        'LESS SURPRISING',
        18, C.cyan,
        px(0.80),
        y - 0.92,
        true, w * 0.46
      )
    );

    if (compare) {
      parts.push(
        glowDot(
          px(0.78),
          y,
          C.cyan,
          0.13
        ),

        tag(
          'LARGE p',
          C.cyan,
          px(0.78),
          y + 0.92,
          18
        ),

        arrow(
          px(0.78), y + 0.62,
          px(0.78), y + 0.16,
          C.cyan, 2.5
        ),

        txt(
          'Illustrative large p-value',
          P ? 17 : 16, C.muted,
          px(0.78),
          y - 1.34,
          false, w * 0.45
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // The p-value trap.
  // Distinguish:
  // P(extreme data | H₀ true)
  // from:
  // P(H₀ true | observed data).
  // ------------------------------------------------------------

  function misconceptionCard(stage = 0) {
    const x = CX;
    const y = CY;

    const w = P ? 6.45 : 6.85;
    const h = P ? 4.30 : 3.80;

    const parts = [
      rect(
        x, y, w, h,
        RED, C.card, 0.95
      ),

      txt(
        'COMMON MISINTERPRETATION',
        20, RED,
        x, y + h / 2 - 0.36,
        true, w - 0.5
      ),

      txt(
        stage === 2
          ? '“4.6% chance the machine is fine”'
          : '“Chance the null is true”',
        23, C.ink,
        x, y + 0.66,
        false, w - 0.75
      ),

      line(
        x - w / 2 + 0.40,
        y + 0.66,
        x + w / 2 - 0.40,
        y + 0.66,
        RED, 3.5
      ),

      txt(
        'NOT WHAT p MEANS',
        18, RED,
        x, y + 0.13,
        true, w - 0.5
      )
    ];

    if (stage >= 1) {
      parts.push(
        line(
          x - w / 2 + 0.40,
          y - 0.25,
          x + w / 2 - 0.40,
          y - 0.25,
          C.muted, 1.5
        ),

        txt(
          'ASSUME THE NULL IS TRUE',
          20, GOLD,
          x, y - 0.63,
          true, w - 0.5
        ),

        txt(
          'Then ask how rare the data would be.',
          21, C.green,
          x, y - 1.18,
          false, w - 0.6
        )
      );
    } else {
      parts.push(
        txt(
          'p does not tell us the probability',
          19, C.muted,
          x, y - 0.65,
          false, w - 0.6
        ),

        txt(
          'that either hypothesis is true.',
          19, C.muted,
          x, y - 1.10,
          false, w - 0.6
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Test result card.
  // Rejecting the null is evidence of drift, not proof of
  // a particular replacement mean.
  // ------------------------------------------------------------

  function decisionCard() {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 3.85 : 3.45;

    return new M.VGroup(
      rect(
        x, y, w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'STATISTICAL TEST RESULT',
        20, C.muted,
        x, y + h / 2 - 0.40,
        true, w - 0.5
      ),

      txt(
        '0.046 < 0.05',
        34, C.amber,
        x, y + 0.63,
        true, w - 0.6
      ),

      txt(
        'REJECT H₀',
        31, C.violet,
        x, y - 0.06,
        true, w - 0.6
      ),

      txt(
        'Evidence that the machine drifted',
        21, C.ink,
        x, y - 0.75,
        false, w - 0.6
      ),

      txt(
        'Not proof of its exact new mean',
        17, C.muted,
        x, y - h / 2 + 0.28,
        false, w - 0.6
      )
    );
  }

  // ------------------------------------------------------------
  // Final recap card.
  // ------------------------------------------------------------

  function finalRecap() {
    const x = CX;
    const y = CY;

    const w = P ? 6.45 : 6.85;
    const h = P ? 4.10 : 3.70;

    return new M.VGroup(
      rect(
        x, y, w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'THE p-VALUE',
        24, C.violet,
        x, y + h / 2 - 0.43,
        true
      ),

      txt(
        'Assume the null is true.',
        23, GOLD,
        x, y + 0.74,
        false, w - 0.6
      ),

      txt(
        'How rare would a result',
        22, C.ink,
        x, y + 0.13,
        false, w - 0.6
      ),

      txt(
        'at least this extreme be?',
        22, C.ink,
        x, y - 0.34,
        false, w - 0.6
      ),

      txt(
        'p ≈ 0.046',
        34, C.violet,
        x, y - 1.04,
        true
      ),

      txt(
        'Rarity of data, not truth of H₀',
        17, C.muted,
        x, y - h / 2 + 0.27,
        false, w - 0.6
      )
    );
  }

  // ============================================================
  // 0-1. Recap the sixteen-bottle inspection.
  // Batch mean = 502 g, z = +2.
  // ============================================================

  await until(S(0));
  await play(
    ...scene([
      ['sample', openingSample()]
    ]),

    ...fbox([
      'Our morning batch',
      `n = ${N}`,
      `mean = ${MEAN} g`,
      [`z = ${signed(Z)}`, C.green]
    ], C.green),

    ...say('OUR BATCH: z = +2', C.green)
  );

  await until(S(1));
  await play(
    ...scene([
      ['ruler', openingRuler()]
    ]),

    ...fbox([
      '502 − 500 = +2 g',
      '1 SE = 1 g',
      ['z = +2', C.green]
    ], C.green),

    ...say('TWO STANDARD ERRORS ABOVE TARGET', C.green)
  );

  // ============================================================
  // 2. Ask the central question.
  // How rare would this be if the machine were fine?
  // ============================================================

  await until(S(2));
  await play(
    ...put(
      'question',
      heading(
        'Would this result be rare?',
        GOLD
      )
    ),

    ...fbox([
      ['Assume H₀ is true', GOLD],
      'True mean = 500 g',
      ['Would z = +2 be rare?', C.violet]
    ], GOLD),

    ...say('IF THE MACHINE WERE FINE?', GOLD)
  );

  // ============================================================
  // 3-4. Imagine a perfect machine and repeat inspections.
  // ============================================================

  await until(S(3));
  await play(
    ...scene([
      ['machine', perfectMachine()]
    ]),

    ...fbox([
      ['Imagine H₀ is true', GOLD],
      'True mean = 500 g',
      'Known SD = 4 g'
    ], GOLD),

    ...say('IMAGINE A PERFECT MACHINE', GOLD)
  );

  await until(S(4));
  await play(
    ...scene([
      ['inspections', inspectionRow()]
    ]),

    ...fbox([
      '16 new bottles',
      'Find their mean',
      ['Calculate one z', C.cyan],
      'Repeat'
    ]),

    ...say('EVERY INSPECTION GIVES A NEW z')
  );

  // ============================================================
  // 5. Drop simulated z values onto a number line.
  // Build the hill from the bottom upward.
  // ============================================================

  const dotChunks = makeDotHill();

  await until(S(5));

  const hillStart = clear();

  const hillAxis = normalAxis();
  const hillZero = line(
    zx(0), BASE - 0.04,
    zx(0), BASE + H + 0.08,
    GOLD, 2.5
  );

  layers.set('axis', hillAxis);
  layers.set('zero', hillZero);

  dotChunks.forEach((g, i) => {
    layers.set(`dotChunk${i}`, g);
  });

  await play(
    ...hillStart,

    new M.FadeIn(hillAxis),
    new M.Create(hillZero),

    new M.LaggedStart(
      dotChunks.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.12,
        runTime: 2.65
      }
    ),

    ...fbox([
      'One dot = one z',
      'Repeat inspections',
      ['The dots form a hill', C.cyan]
    ]),

    ...say('DROP EACH z ON THE LINE')
  );

  // ============================================================
  // 6. Most results are near zero; few are far away.
  // ============================================================

  await until(S(6));
  await play(
    ...put(
      'hillLabels',
      dotHillLabels()
    ),

    ...fbox([
      ['Near zero: common', C.cyan],
      ['Far left: rare', C.violet],
      ['Far right: rare', C.violet]
    ]),

    ...say('MOST RESULTS LAND NEAR ZERO')
  );

  // ============================================================
  // 7-8. The normal curve under the null hypothesis.
  // ============================================================

  await until(S(7));
  await play(
    ...scene([
      ['curve', normalCurve('none', false)],
      [
        'heading',
        heading('The normal curve', C.cyan)
      ]
    ]),

    ...fbox([
      'Bell-shaped hill',
      ['Normal curve', C.cyan],
      'Centred at zero'
    ]),

    ...say('THE HILL IS A NORMAL CURVE')
  );

  await until(S(8));
  await play(
    ...scene([
      ['curve', normalCurve('none', true)]
    ]),

    ...fbox([
      ['If H₀ is true:', GOLD],
      'True mean = 500 g',
      ['z follows the normal curve', C.cyan]
    ], GOLD),

    ...say('THIS IS WHAT z LOOKS LIKE UNDER H₀', GOLD)
  );

  // ============================================================
  // 9. Mark the observed result, z = +2.
  // ============================================================

  await until(S(9));
  await play(
    ...put(
      'observed',
      zMarker(
        Z,
        C.green,
        'OUR z = +2'
      )
    ),

    ...fbox([
      'Our observed result',
      ['z = +2', C.green]
    ], C.green),

    ...say('MARK OUR RESULT: +2', C.green)
  );

  // ============================================================
  // 10-11. At least as far from zero.
  // Both directions count.
  // ============================================================

  await until(S(10));
  await play(
    ...put(
      'distance',
      arrow(
        zx(0) + 0.06,
        BASE + H * 0.72,
        zx(Z) - 0.05,
        BASE + H * 0.72,
        GOLD, 3
      )
    ),

    ...fbox([
      'How often is z',
      'at least this far',
      ['from zero?', C.violet]
    ], C.violet),

    ...say('AT LEAST THIS FAR FROM ZERO?', GOLD)
  );

  await until(S(11));
  await play(
    ...drop('distance', 'observed'),

    ...put(
      'extremes',
      extremeArrows()
    ),

    ...put(
      'boundaries',
      new M.VGroup(
        extremeBoundary(-Z),
        extremeBoundary(Z)
      )
    ),

    ...fbox([
      ['z ≥ +2', C.violet],
      'or',
      ['z ≤ −2', C.violet]
    ], C.violet),

    ...say('TWO OR MORE STEPS, EITHER SIDE', C.violet)
  );

  // ============================================================
  // 12. Why both directions?
  // The alternative was a drift up or down.
  // ============================================================

  await until(S(12));
  await play(
    ...fbox([
      ['H₀: mean = 500 g', GOLD],
      ['H₁: mean ≠ 500 g', C.violet],
      'Up OR down'
    ], C.violet),

    ...indicate('extremes', C.violet),

    ...say('OUR ALTERNATIVE ALLOWS BOTH DIRECTIONS', C.violet)
  );

  // ============================================================
  // 13. Equal distances are equally surprising.
  // ============================================================

  await until(S(13));
  await play(
    ...drop('extremes', 'boundaries'),

    ...put(
      'negative',
      zMarker(-Z, C.violet, 'z = −2')
    ),

    ...put(
      'positive',
      zMarker(Z, C.violet, 'z = +2')
    ),

    ...put(
      'distances',
      equalDistances()
    ),

    ...fbox([
      '−2 and +2',
      ['Same distance from zero', GOLD],
      'Equally surprising'
    ], GOLD),

    ...say('TWO BELOW IS AS SURPRISING AS TWO ABOVE', GOLD)
  );

  // ============================================================
  // 14. Shade both tails.
  // The shaded regions are all outcomes at least as extreme.
  // ============================================================

  await until(S(14));
  await play(
    ...scene([
      ['curve', normalCurve('both', true)],
      ['cuts', tailCutLabels()]
    ]),

    ...fbox([
      'Two-sided question',
      ['Shade z ≤ −2', C.violet],
      ['Shade z ≥ +2', C.violet]
    ], C.violet),

    ...say('SHADE BOTH EXTREME TAILS', C.violet)
  );

  // ============================================================
  // 15-16. Each tail contains about 2.3%.
  // ============================================================

  await until(S(15));
  await play(
    ...put(
      'rightTailLabel',
      tailLabel('right', '2.3%')
    ),

    ...fbox([
      'Right tail',
      'P(z ≥ +2 | H₀)',
      [`≈ ${P_RIGHT.toFixed(4)}`, C.violet],
      ['≈ 2.3%', C.violet]
    ], C.violet),

    ...say('RIGHT TAIL: ABOUT 2.3%', C.violet)
  );

  await until(S(16));
  await play(
    ...put(
      'leftTailLabel',
      tailLabel('left', '2.3%')
    ),

    ...fbox([
      'Left tail',
      'P(z ≤ −2 | H₀)',
      [`≈ ${P_LEFT.toFixed(4)}`, C.violet],
      ['≈ 2.3%', C.violet]
    ], C.violet),

    ...say('LEFT TAIL: ABOUT 2.3%', C.violet)
  );

  // ============================================================
  // 17. Add the two tails.
  // Approximately 46 inspections per thousand.
  // ============================================================

  await until(S(17));
  await play(
    ...scene([
      ['thousand', thousandPicture()]
    ]),

    ...fbox([
      'Left tail + right tail',
      '2.3% + 2.3%',
      ['≈ 4.6%', C.violet],
      ['≈ 46 in 1,000', C.violet]
    ], C.violet),

    ...say('TOGETHER: ABOUT 46 IN 1,000', C.violet)
  );

  // ============================================================
  // 18. Name this probability: the p-value.
  // ============================================================

  await until(S(18));
  await play(
    ...scene([
      ['curve', normalCurve('both', true)],
      ['cuts', tailCutLabels()],
      ['tailLabels', tailLabels()]
    ]),

    ...fbox([
      'Total shaded area',
      ['p-value ≈ 4.6%', C.violet]
    ], C.violet),

    ...say('THIS SHARE IS THE p-VALUE', C.violet)
  );

  // ============================================================
  // 19-20. Define p precisely.
  // Conditional on H₀ being true.
  // At least as extreme as the observed result.
  // ============================================================

  await until(S(19));
  await play(
    ...fbox([
      ['Assume H₀ is true', GOLD],
      'Chance of a result',
      'at least as extreme',
      ['as our observed result', C.violet]
    ], C.violet),

    ...say('HOW RARE, IF THE NULL WERE TRUE?', GOLD)
  );

  await until(S(20));
  await play(
    ...drop('tailLabels'),

    ...put(
      'distances',
      equalDistances()
    ),

    ...fbox([
      'Extreme means',
      'at least as far',
      ['from zero as our z', C.violet]
    ], C.violet),

    ...say('EXTREME = AT LEAST AS FAR FROM ZERO', C.violet)
  );

  // ============================================================
  // 21. Show the numerical p-value.
  // ============================================================

  await until(S(21));
  await play(
    ...drop('distances'),

    ...put(
      'tailLabels',
      tailLabels()
    ),

    ...fbox([
      `p = ${P_TWO.toFixed(4)}`,
      ['p ≈ 0.046', C.violet],
      'About 4.6%'
    ], C.violet),

    ...say('p ≈ 0.046', C.violet)
  );

  // ============================================================
  // 22. Small p: unusual data for a machine at 500 g.
  // ============================================================

  await until(S(22));
  await play(
    ...indicate(
      'tailLabels',
      C.violet
    ),

    ...fbox([
      ['If the machine is fine:', GOLD],
      'Results this extreme',
      ['are uncommon.', C.violet]
    ], C.violet),

    ...say('SMALL p: A FINE MACHINE RARELY DOES THIS', C.violet)
  );

  // ============================================================
  // 23. A rare fluke or a false null.
  // Do not attach posterior probabilities to the explanations.
  // ============================================================

  await until(S(23));
  await play(
    ...scene([
      ['explanations', explanationCards()]
    ]),

    ...fbox([
      'Two possibilities',
      ['A rare fluke', GOLD],
      'or',
      ['The null is wrong', C.violet]
    ], C.amber),

    ...say('A RARE FLUKE, OR REAL DRIFT?', GOLD)
  );

  // ============================================================
  // 24. Introduce the prespecified cut-off.
  // Five in a hundred.
  // ============================================================

  await until(S(24));
  await play(
    ...scene([
      ['grid', significanceGrid()]
    ]),

    ...fbox([
      'Choose before testing',
      '5 in 100',
      ['Cut-off = 0.05', GOLD]
    ], GOLD),

    ...say('CHOOSE A CUT-OFF IN ADVANCE', GOLD)
  );

  // ============================================================
  // 25. Give the cut-off its name.
  // ============================================================

  await until(S(25));
  await play(
    ...fbox([
      'Significance level',
      ['α = 0.05', GOLD],
      'Five percent'
    ], GOLD),

    ...say('CUT-OFF = SIGNIFICANCE LEVEL', GOLD)
  );

  // ============================================================
  // 26. Our p is slightly below alpha.
  // ============================================================

  await until(S(26));
  await play(
    ...scene([
      ['comparison', probabilityRuler(0.046)],
      [
        'heading',
        heading('Compare p with the chosen cut-off')
      ]
    ]),

    ...fbox([
      ['p ≈ 0.046', C.violet],
      ['α = 0.05', GOLD],
      ['0.046 < 0.05', C.green]
    ], C.green),

    ...say('OUR p IS JUST BELOW THE CUT-OFF', C.green)
  );

  // ============================================================
  // 27. Apply the statistical decision rule.
  // Reject H₀: evidence of drift.
  // ============================================================

  await until(S(27));
  await play(
    ...scene([
      [
        'comparison',
        probabilityRuler(
          0.046,
          null,
          true
        )
      ]
    ]),

    ...fbox([
      'Rule: reject if p < α',
      '0.046 < 0.05',
      ['REJECT H₀', C.violet],
      'Evidence of drift'
    ], C.violet),

    ...say('REJECT THE NULL', C.violet)
  );

  // ============================================================
  // 28. Rejecting is not estimating the new true mean.
  // ============================================================

  await until(S(28));
  await play(
    ...scene([
      ['decision', decisionCard()]
    ]),

    ...fbox([
      'H₀ fits the data poorly',
      'Evidence of a change',
      ['Exact true mean unknown', C.amber]
    ], C.amber),

    ...say('EVIDENCE OF DRIFT, NOT ITS EXACT SIZE', GOLD)
  );

  // ============================================================
  // 29-30. Short mathematical version.
  // p = P(|Z| ≥ 2 | H₀ true).
  // Uppercase Z denotes the hypothetical random test statistic.
  // ============================================================

  await until(S(29));
  await play(
    ...scene([
      ['curve', normalCurve('both', true)],
      ['cuts', tailCutLabels()],
      ['tailLabels', tailLabels()]
    ]),

    ...fbox([
      ['If H₀ is true:', GOLD],
      'p = chance that z is',
      ['at least this far out', C.violet]
    ], C.violet),

    ...say('THE p-VALUE IN SHORT', C.violet)
  );

  await until(S(30));
  await play(
    ...fbox([
      'p = P(|Z| ≥ 2 | H₀)',
      '  = P(Z ≤ −2 | H₀)',
      '  + P(Z ≥ +2 | H₀)',
      ['  ≈ 0.046', C.violet]
    ], C.violet),

    ...say('ADD THE AREAS BEYOND −2 AND +2', C.violet)
  );

  // ============================================================
  // 31. Convert how far into how rare.
  // A common probability scale from zero to one.
  // ============================================================

  await until(S(31));
  await play(
    ...scene([
      ['rarityScale', rarityScale(false)],
      [
        'heading',
        heading('How far becomes how rare', C.cyan)
      ]
    ]),

    ...fbox([
      'z measures distance',
      'p measures rarity',
      ['0 ≤ p ≤ 1', C.violet]
    ], C.violet),

    ...say('FROM DISTANCE TO RARITY')
  );

  // ============================================================
  // 32. Small p versus large p.
  // ============================================================

  await until(S(32));
  await play(
    ...put(
      'rarityScale',
      rarityScale(true)
    ),

    ...fbox([
      ['Small p:', C.violet],
      'Data clash with H₀',
      ['Large p:', C.cyan],
      'Data fit H₀ well enough'
    ]),

    ...say('SMALL p: MORE SURPRISING DATA', C.violet)
  );

  // ============================================================
  // 33-34. Common trap.
  // p is not the probability that the null is true.
  // ============================================================

  await until(S(33));
  await play(
    ...drop('heading'),

    ...put(
      'warning',
      heading(
        'What does p NOT tell us?',
        RED
      )
    ),

    ...say('THE MOST COMMON p-VALUE TRAP', RED)
  );

  await until(S(34));
  await play(
    ...scene([
      ['misconception', misconceptionCard(0)]
    ]),

    ...fbox([
      ['WRONG:', RED],
      'p = P(H₀ is true)',
      ['That is not a p-value.', RED]
    ], RED),

    ...say('p IS NOT THE CHANCE H₀ IS TRUE', RED)
  );

  // ============================================================
  // 35. The null is an assumption in the calculation.
  // ============================================================

  await until(S(35));
  await play(
    ...put(
      'misconception',
      misconceptionCard(1)
    ),

    ...fbox([
      ['Start by assuming H₀', GOLD],
      'Then calculate',
      ['P(extreme data | H₀)', C.green]
    ], C.green),

    ...say('ASSUME H₀, THEN MEASURE SURPRISE', GOLD)
  );

  // ============================================================
  // 36. The incorrect machine interpretation.
  // ============================================================

  await until(S(36));
  await play(
    ...put(
      'misconception',
      misconceptionCard(2)
    ),

    ...fbox([
      'p ≈ 0.046',
      ['NOT:', RED],
      '4.6% chance the',
      'machine is fine'
    ], RED),

    ...say('4.6% IS A CHANCE OF DATA, NOT OF H₀', RED)
  );

  // ============================================================
  // 37. A cut-off is not a magical boundary.
  // Nearby p-values give nearly the same strength of evidence.
  // 0.054 is an illustrative comparison, not another measured batch.
  // ============================================================

  await until(S(37));
  await play(
    ...scene([
      [
        'comparison',
        probabilityRuler(
          0.046,
          0.054,
          true
        )
      ],

      [
        'heading',
        heading(
          'Nearby p-values tell similar stories',
          C.amber
        )
      ]
    ]),

    ...fbox([
      ['p = 0.046: just below', C.violet],
      ['p = 0.054: just above', C.cyan],
      'Different decisions',
      ['Similar evidence', GOLD]
    ], GOLD),

    ...say('JUST BELOW 0.05 IS ONLY WEAK EVIDENCE', GOLD)
  );

  // ============================================================
  // 38. Preview one-sided tests.
  // Do not introduce the next lesson's decision rules yet.
  // ============================================================

  await until(S(38));
  await play(
    ...scene([
      ['curve', normalCurve('both', true)],
      ['cuts', tailCutLabels()],
      ['tailLabels', tailLabels()]
    ]),

    ...fbox([
      'We used both tails.',
      'What if only one',
      ['direction matters?', C.amber]
    ], C.amber),

    ...say('NEXT: WHEN CAN WE USE JUST ONE TAIL?', GOLD)
  );

  // ============================================================
  // 39. Final recap.
  // A p-value is the probability, under the null,
  // of a result at least as extreme as the observed result.
  // ============================================================

  await until(S(39));
  await play(
    ...scene([
      ['recap', finalRecap()]
    ]),

    ...fbox([
      ['Assume H₀ is true', GOLD],
      'p = P(|Z| ≥ 2 | H₀)',
      ['p ≈ 0.046', C.violet]
    ], C.violet),

    ...say('p = RARITY OF EXTREME DATA UNDER H₀', C.violet)
  );
}

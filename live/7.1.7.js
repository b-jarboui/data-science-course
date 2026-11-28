// lesson 7.1.7
// Sample size: planning an inspection with enough power.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared chapter data:
//   Label target = 500 g.
//   Known bottle standard deviation = 4 g.
//   Two-sided significance level = 0.05.
//   Critical z values = ±1.96.
//
// Planning goal:
//   Detect a real 2 g drift with at least 80% power.
//
//   n ≈ ((1.96 + 0.84) × 4 / 2)²
//     = (2.8 × 4 / 2)²
//     = 5.6²
//     = 31.36
//   Round up to 32 bottles.
//
// Check:
//   n = 16: SE = 1 g, shifted centre = +2, power ≈ 0.516.
//   n = 32: SE ≈ 0.707 g, shifted centre ≈ +2.828,
//           power ≈ 0.807.
//
// For a 1 g drift:
//   n ≈ (2.8 × 4 / 1)² = 125.44.
//   Round up to 126 bottles.
//
// The sample-size rule is the normal-quantile planning
// approximation specified in the narration. Power checks include
// both rejection tails. Calculations retain unrounded precision.
//
// The slider is a narrated animation, not an interactive control.
// Bottle fill differences are exaggerated for visual clarity.
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

  const BASE = P ? -3.65 : -1.95;
  const CY = P ? -1.15 : -0.45;

  const W = P ? 6.55 : 7.05;

  const GOLD = C.amber;
  const RED = C.red || '#ff647c';

  const TARGET = 500;
  const SD = 4;
  const DRIFT = 2;

  const ALPHA = 0.05;
  const GOAL = 0.80;

  const CUT = 1.96;
  const POWER_QUANTILE = 0.84;
  const REQUIRED_STEPS = CUT + POWER_QUANTILE;

  const N0 = 16;
  const N1 = 32;

  const SE0 = SD / Math.sqrt(N0);
  const SE1 = SD / Math.sqrt(N1);

  const SHIFT0 = DRIFT / SE0;
  const SHIFT1 = DRIFT / SE1;

  const RAW_N2 = (REQUIRED_STEPS * SD / 2) ** 2;
  const RAW_N1 = (REQUIRED_STEPS * SD / 1) ** 2;

  const PLAN_N2 = Math.ceil(RAW_N2);
  const PLAN_N1 = Math.ceil(RAW_N1);

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const pct = p => `${Math.round(p * 100)}%`;

  const signed = v =>
    v > 0 ? `+${v}` : String(v);

  // ------------------------------------------------------------
  // Normal CDF approximation and exact two-tail power check.
  // ------------------------------------------------------------

  function Phi(x) {
    const a = Math.abs(x);
    const t = 1 / (1 + 0.2316419 * a);

    const poly =
      0.319381530 * t -
      0.356563782 * t ** 2 +
      1.781477937 * t ** 3 -
      1.821255978 * t ** 4 +
      1.330274429 * t ** 5;

    const q =
      Math.exp(-a * a / 2) /
      Math.sqrt(2 * Math.PI) *
      poly;

    return x >= 0 ? 1 - q : q;
  }

  function standardError(n) {
    return SD / Math.sqrt(n);
  }

  function shiftedCentre(n, drift = DRIFT) {
    return drift / standardError(n);
  }

  function powerAtCentre(mu) {
    return Phi(-CUT - mu) + 1 - Phi(CUT - mu);
  }

  function power(n, drift = DRIFT) {
    return powerAtCentre(
      shiftedCentre(n, drift)
    );
  }

  const POWER16 = power(16);
  const POWER32 = power(32);
  const POWER126 = power(126, 1);

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

  function tag(s, color, x, y, maxw = W) {
    const p = pill(s, color);

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);
    return p;
  }

  function heading(s, color = C.ink) {
    return txt(
      s, P ? 23 : 22,
      color,
      CX,
      P ? 1.06 : 1.15,
      false,
      W
    );
  }

  function bracket(
    x1, x2, y,
    label,
    color = GOLD,
    labelAbove = true
  ) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 3),

      line(
        x1, y - 0.095,
        x1, y + 0.095,
        color
      ),

      line(
        x2, y - 0.095,
        x2, y + 0.095,
        color
      ),

      tag(
        label,
        color,
        (x1 + x2) / 2,
        y + (labelAbove ? 0.3 : -0.3)
      )
    );
  }

  // ------------------------------------------------------------
  // Layer management.
  // Each group is assembled before appearing on screen.
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

  function indicate(key, color = GOLD) {
    if (!layers.has(key)) return [];

    return [
      new M.Indicate(
        layers.get(key),
        { color }
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
  // Shared glowing juice bottles and scale.
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

    const juiceY =
      y - innerH / 2 + juiceH / 2;

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
    color = C.cyan,
    showLabel = true
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

    if (showLabel) {
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
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Reusable probability bar.
  // Green = real drift detected.
  // Red = real drift missed.
  // Gold marker = requested minimum power.
  // ------------------------------------------------------------

  function probabilityBar(
    x, y, w, h,
    probability,
    goal = null,
    showLabels = true
  ) {
    const left = x - w / 2;
    const pw = w * probability;
    const bw = w * (1 - probability);

    const parts = [
      rect(
        x, y,
        w, h,
        C.muted,
        C.card,
        0.95,
        0.04
      ),

      block(
        left + pw / 2,
        y,
        pw, h * 0.94,
        C.green, 0.83
      ),

      block(
        left + pw + bw / 2,
        y,
        bw, h * 0.94,
        RED, 0.65
      )
    ];

    if (showLabels) {
      parts.push(
        txt(
          pct(probability),
          22,
          C.ink,
          left + pw / 2,
          y,
          true,
          Math.max(0.45, pw - 0.1)
        ),

        txt(
          pct(1 - probability),
          19,
          C.ink,
          left + pw + bw / 2,
          y,
          true,
          Math.max(0.35, bw - 0.08)
        )
      );
    }

    if (goal !== null) {
      const gx = left + goal * w;

      parts.push(
        line(
          gx,
          y - h / 2 - 0.07,
          gx,
          y + h / 2 + 0.14,
          GOLD, 3
        ),

        txt(
          `${pct(goal)} goal`,
          16,
          GOLD,
          gx,
          y + h / 2 + 0.38,
          true,
          1.65
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Opening: last lesson's 16-bottle inspection.
  // ------------------------------------------------------------

  function openingPicture() {
    const y = P ? -0.55 : -0.30;

    const parts = [
      tray(
        CX - 1.70,
        y + 0.12,
        16, 4,
        0.84
      ),

      arrow(
        CX - 0.55,
        y + 0.12,
        CX + 0.65,
        y + 0.12,
        C.cyan, 3
      ),

      txt(
        '52%',
        46,
        C.green,
        CX + 1.80,
        y + 0.42,
        true
      ),

      txt(
        'POWER',
        20,
        C.green,
        CX + 1.80,
        y - 0.20,
        true
      ),

      txt(
        'True drift = +2 g',
        18,
        C.violet,
        CX + 1.80,
        y - 0.66
      ),

      probabilityBar(
        CX,
        P ? -2.85 : -1.93,
        P ? 6.20 : 6.55,
        0.46,
        POWER16
      ),

      txt(
        'Caught',
        17,
        C.green,
        CX - 1.60,
        P ? -3.32 : -2.35
      ),

      txt(
        'Missed',
        17,
        RED,
        CX + 1.65,
        P ? -3.32 : -2.35
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Manager and planning objective.
  // ------------------------------------------------------------

  function manager(x, y, s = 1) {
    const head = new M.Circle({
      radius: 0.26 * s,
      color: C.ink
    });

    head.setFill(C.ink, 0.90);

    head.moveTo([
      x,
      y + 0.38 * s,
      0
    ]);

    const body = new M.Arc({
      radius: 0.49 * s,
      startAngle: 0,
      angle: Math.PI,
      color: C.cyan
    });

    body.setFill(C.cyan, 0.90);

    body.moveTo([
      x,
      y - 0.26 * s,
      0
    ]);

    return new M.VGroup(head, body);
  }

  function managerPicture(showGoal = false) {
    const y = P ? -0.45 : -0.30;

    const bx = CX + 0.95;
    const mx = CX - 2.35;

    const parts = [
      manager(
        mx,
        y + 0.24,
        1.15
      ),

      txt(
        'MANAGER',
        17,
        C.cyan,
        mx,
        y - 0.70,
        true
      ),

      rect(
        bx,
        y + 0.30,
        4.30,
        1.55,
        C.violet,
        C.card,
        0.95
      ),

      txt(
        'A 2 g drift matters.',
        23,
        C.violet,
        bx,
        y + 0.64,
        false,
        3.95
      ),

      txt(
        'Catch it most of the time.',
        20,
        C.ink,
        bx,
        y + 0.05,
        false,
        3.95
      )
    ];

    if (showGoal) {
      parts.push(
        probabilityBar(
          CX,
          P ? -2.60 : -1.80,
          6.30,
          0.48,
          GOAL,
          null
        ),

        txt(
          '80 caught in 100',
          18,
          C.green,
          CX - 0.55,
          P ? -3.13 : -2.28
        ),

        txt(
          '20 missed',
          16,
          RED,
          CX + 2.48,
          P ? -3.13 : -2.28,
          false,
          1.30
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function goalGrid() {
    const dx = P ? 0.39 : 0.285;
    const dy = P ? 0.39 : 0.285;

    const y = P ? -1.20 : -0.60;

    const parts = [];

    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);

      const caught = i < 80;

      parts.push(
        dot(
          CX + (col - 4.5) * dx,
          y + (4.5 - row) * dy,
          caught ? C.green : RED,
          P ? 0.086 : 0.064,
          caught ? 1 : 0.65
        )
      );
    }

    parts.push(
      tag(
        'TARGET POWER: 80%',
        C.green,
        CX,
        y + 4.5 * dy + 0.42
      ),

      txt(
        '80 caught • 20 missed',
        18,
        C.ink,
        CX,
        y - 4.5 * dy - 0.43
      ),

      txt(
        'Long-run planning goal',
        16,
        C.muted,
        CX,
        y - 4.5 * dy - 0.79
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Question: how many bottles?
  // ------------------------------------------------------------

  function sampleQuestion() {
    const y = CY;

    return new M.VGroup(
      tray(
        CX - 1.75,
        y + 0.15,
        16, 4,
        0.86
      ),

      arrow(
        CX - 0.52,
        y + 0.15,
        CX + 0.55,
        y + 0.15,
        C.cyan, 3
      ),

      rect(
        CX + 1.80,
        y + 0.15,
        2.35,
        2.15,
        C.cyan,
        C.card,
        0.95
      ),

      txt(
        '?',
        53,
        C.cyan,
        CX + 1.80,
        y + 0.23,
        true
      ),

      txt(
        'BOTTLES',
        18,
        C.cyan,
        CX + 1.80,
        y - 0.57,
        true
      ),

      txt(
        'Current power: 52%',
        18,
        C.muted,
        CX - 1.75,
        y - 1.37,
        false,
        3.10
      ),

      txt(
        'Goal: 80% power',
        19,
        C.green,
        CX + 1.80,
        y - 1.37,
        false,
        3.10
      )
    );
  }

  // ------------------------------------------------------------
  // Standard normal hill coordinates.
  // All shifted distributions have unit standard deviation.
  //
  // Increasing n reduces the standard error in grams.
  // Consequently, a fixed physical drift becomes a larger
  // shift in standardized z units.
  // ------------------------------------------------------------

  const ZLO = -4.5;
  const ZHI = 6.5;

  const ZW = P ? 6.55 : 7.05;
  const H = P ? 2.75 : 2.08;

  const zx = z =>
    CX - ZW / 2 +
    (z - ZLO) / (ZHI - ZLO) * ZW;

  const density = (z, mu = 0) =>
    Math.exp(-0.5 * (z - mu) ** 2);

  const curveY = (z, mu = 0) =>
    BASE + H * density(z, mu);

  function normalAxis() {
    const parts = [
      line(
        zx(ZLO), BASE,
        zx(ZHI), BASE,
        C.muted, 2.5
      )
    ];

    for (let z = -4; z <= 6; z++) {
      const color = z === 0 ? GOLD : C.muted;

      parts.push(
        line(
          zx(z),
          BASE - 0.075,
          zx(z),
          BASE + 0.075,
          color
        ),

        txt(
          signed(z),
          P ? 16 : 17,
          color,
          zx(z),
          BASE - 0.27,
          true
        )
      );
    }

    parts.push(
      txt(
        'z: standard errors from the target',
        17,
        C.muted,
        CX,
        BASE - 0.70,
        false,
        ZW
      )
    );

    return new M.VGroup(...parts);
  }

  function outline(
    mu,
    color = C.violet,
    sw = 2.8
  ) {
    const parts = [];
    const n = 110;

    for (let i = 0; i < n; i++) {
      const a =
        ZLO + (ZHI - ZLO) * i / n;

      const b =
        ZLO + (ZHI - ZLO) * (i + 1) / n;

      parts.push(
        line(
          zx(a), curveY(a, mu),
          zx(b), curveY(b, mu),
          color, sw
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function area(
    mu,
    lo,
    hi,
    color,
    opacity = 0.20
  ) {
    const parts = [];

    const a0 = Math.max(lo, ZLO);
    const b0 = Math.min(hi, ZHI);

    const count = Math.max(
      12,
      Math.ceil((b0 - a0) * 17)
    );

    const step = (b0 - a0) / count;

    for (let i = 0; i < count; i++) {
      const a = a0 + i * step;
      const b = a + step;
      const mid = (a + b) / 2;

      const bh = Math.max(
        0.001,
        H * density(mid, mu)
      );

      parts.push(
        block(
          zx(mid),
          BASE + bh / 2,
          (zx(b) - zx(a)) * 1.005,
          bh,
          color,
          opacity
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function targetLine(showText = true) {
    const parts = [
      line(
        zx(0),
        BASE,
        zx(0),
        BASE + H + 0.08,
        GOLD, 3
      )
    ];

    if (showText) {
      parts.push(
        txt(
          '500 g target',
          17,
          GOLD,
          zx(0) - 0.6,
          BASE + H + 0.72,
          true,
          2.20
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function cutLines(showText = true) {
    const parts = [];

    [-CUT, CUT].forEach(z => {
      parts.push(
        dashed(
          zx(z),
          BASE,
          zx(z),
          BASE + H + 0.06,
          GOLD
        ),

        dot(
          zx(z),
          BASE + 0.035,
          GOLD,
          0.060
        )
      );

      if (showText) {
        parts.push(
          txt(
            z < 0 ? '−1.96' : '+1.96',
            17,
            GOLD,
            zx(z),
            BASE + H + 0.32,
            true,
            1.20
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  function shiftedLine(mu, label = null) {
    return new M.VGroup(
      dashed(
        zx(mu),
        BASE,
        zx(mu),
        BASE + H,
        C.violet
      ),

      glowDot(
        zx(mu),
        BASE + H,
        C.violet,
        0.095
      ),

      txt(
        label || `centre ${signed(Number(mu.toFixed(2)))}`,
        17,
        C.violet,
        zx(mu) + 0.2,
        BASE + H + 0.72,
        true,
        2.15
      )
    );
  }

  function shiftedHill(
    mu,
    shade = true,
    showNull = false
  ) {
    const parts = [];

    if (showNull) {
      parts.push(
        outline(
          0,
          C.cyan,
          1.8
        )
      );
    }

    parts.push(
      area(
        mu,
        ZLO,
        ZHI,
        C.violet,
        0.14
      )
    );

    if (shade) {
      parts.push(
        area(
          mu,
          -CUT,
          CUT,
          RED,
          0.56
        ),

        area(
          mu,
          ZLO,
          -CUT,
          C.green,
          0.87
        ),

        area(
          mu,
          CUT,
          ZHI,
          C.green,
          0.83
        )
      );
    }

    parts.push(
      outline(
        mu,
        C.violet,
        3
      ),

      shiftedLine(mu)
    );

    return new M.VGroup(...parts);
  }

  function graph(
    mu = SHIFT0,
    shade = true,
    showNull = true,
    title = ''
  ) {
    const parts = [
      shiftedHill(
        mu,
        shade,
        showNull
      ),

      normalAxis(),
      targetLine(),
      cutLines()
    ];

    if (title) {
      parts.push(
        heading(title)
      );
    }

    return new M.VGroup(...parts);
  }

  function graphPowerLabel(mu, p) {
    const x = zx(
      Math.min(5.05, mu + 1.45)
    );

    const y = BASE + H * 0.66;

    return new M.VGroup(
      tag(
        `${pct(p)} CAUGHT`,
        C.green,
        x, y,
        2.40
      ),

      arrow(
        x,
        y - 0.23,
        zx(mu + 0.55),
        BASE + H *
          density(mu + 0.55, mu) * 0.40,
        C.green,
        2.4
      )
    );
  }

  // ------------------------------------------------------------
  // Compare the same two-gram drift using different rulers.
  // Both rows use exactly the same physical gram scale.
  // ------------------------------------------------------------

  function rulerRow(
    n,
    y,
    highlight = false,
    showSteps = true
  ) {
    const se = standardError(n);
    const steps = DRIFT / se;

    const left = CX - W / 2 + 0.34;
    const right = CX + W / 2 - 0.34;

    const gx = v =>
      left + (v - 499) / 4 * (right - left);

    const color = highlight ? C.green : C.cyan;

    const parts = [
      line(
        gx(499), y,
        gx(503), y,
        C.muted,
        2.5
      ),

      line(
        gx(500),
        y - 0.08,
        gx(500),
        y + 0.50,
        GOLD, 3
      ),

      txt(
        `${n} BOTTLES`,
        19,
        color,
        CX,
        y + 0.92,
        true
      )
    ];

    for (let k = -10; k <= 10; k++) {
      const v = TARGET + k * se;

      if (v < 499 || v > 503) continue;

      parts.push(
        line(
          gx(v),
          y - 0.10,
          gx(v),
          y + 0.10,
          color,
          2
        )
      );
    }

    [499, 500, 501, 502, 503].forEach(v => {
      parts.push(
        txt(
          String(v),
          16,
          v === TARGET ? GOLD : C.muted,
          gx(v),
          y - 0.29,
          true
        )
      );
    });

    parts.push(
      glowDot(
        gx(502),
        y,
        C.violet,
        0.10
      ),

      txt(
        `SE = ${n === 16 ? '1.00' : se.toFixed(2)} g`,
        18,
        color,
        CX,
        y - 0.67,
        true
      )
    );

    if (showSteps) {
      const count = Math.ceil(steps);

      for (let i = 0; i < count; i++) {
        const from = TARGET + i * se;

        const to = Math.min(
          TARGET + DRIFT,
          from + se
        );

        parts.push(
          arrow(
            gx(from) + 0.025,
            y + 0.34,
            gx(to) - 0.025,
            y + 0.34,
            color,
            2.8
          )
        );
      }

      parts.push(
        txt(
          `${Number(steps.toFixed(2))} steps`,
          18,
          color,
          gx(501),
          y + 0.61,
          true,
          2.4
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function rulerComparison(showSteps = true) {
    const y1 = P ? -0.15 : 0.12;
    const y2 = P ? -2.65 : -1.79;

    return new M.VGroup(
      rulerRow(
        16,
        y1,
        false,
        showSteps
      ),

      rulerRow(
        32,
        y2,
        true,
        showSteps
      )
    );
  }

  // ------------------------------------------------------------
  // Animated sample-size slider.
  // Fixed range: 16 to 32 bottles.
  // Only its knob changes position.
  // ------------------------------------------------------------

  const SLIDER_Y = P ? 0.28 : 0.95;
  const SLIDER_W = P ? 4.20 : 4.00;

  function sliderX(n) {
    return CX - SLIDER_W / 2 +
      (n - 16) / 16 * SLIDER_W;
  }

  function sliderTrack() {
    const parts = [
      line(
        sliderX(16),
        SLIDER_Y,
        sliderX(32),
        SLIDER_Y,
        C.muted,
        5
      )
    ];

    [16, 20, 24, 28, 32].forEach(n => {
      parts.push(
        line(
          sliderX(n),
          SLIDER_Y - 0.095,
          sliderX(n),
          SLIDER_Y + 0.095,
          C.muted
        ),

        txt(
          String(n),
          15,
          C.muted,
          sliderX(n),
          SLIDER_Y - 0.25,
          true
        )
      );
    });

    parts.push(
      txt(
        'Number of bottles',
        17,
        C.ink,
        CX,
        SLIDER_Y + 0.38
      )
    );

    return new M.VGroup(...parts);
  }

  function sliderKnob(n) {
    return glowDot(
      sliderX(n),
      SLIDER_Y,
      C.cyan,
      0.13
    );
  }

  // Lowered hill used while the slider is visible.
  // The smaller vertical scale is purely a layout adjustment.

  function sliderHill(n) {
    const mu = shiftedCentre(n);
    const p = power(n);

    const h = P ? 2.00 : 1.40;
    const y = BASE;

    const f = z =>
      h * density(z, mu);

    const parts = [];
    const bins = 100;

    for (let i = 0; i < bins; i++) {
      const a = ZLO + (ZHI - ZLO) * i / bins;
      const b = ZLO + (ZHI - ZLO) * (i + 1) / bins;
      const mid = (a + b) / 2;

      const caught =
        mid < -CUT || mid > CUT;

      const bh = Math.max(
        0.001,
        f(mid)
      );

      parts.push(
        block(
          zx(mid),
          y + bh / 2,
          (zx(b) - zx(a)) * 1.005,
          bh,
          caught ? C.green : RED,
          caught ? 0.80 : 0.50
        ),

        line(
          zx(a), y + f(a),
          zx(b), y + f(b),
          C.violet, 2.6
        )
      );
    }

    parts.push(
      dashed(
        zx(mu),
        y,
        zx(mu),
        y + h,
        C.violet
      ),

      glowDot(
        zx(mu),
        y + h,
        C.violet,
        0.080
      ),

      txt(
        `centre +${mu.toFixed(2)}`,
        16,
        C.violet,
        zx(mu),
        y + h + 0.25,
        true,
        2.20
      ),

      tag(
        `${pct(p)} POWER`,
        p >= GOAL ? C.green : GOLD,
        zx(4.45),
        y + h * 0.45,
        2.0
      )
    );

    return new M.VGroup(...parts);
  }

  function sliderFixedGraph() {
    return new M.VGroup(
      normalAxis(),

      line(
        zx(0),
        BASE,
        zx(0),
        BASE + (P ? 2.05 : 1.45),
        GOLD, 3
      ),

      dashed(
        zx(-CUT),
        BASE,
        zx(-CUT),
        BASE + (P ? 2.05 : 1.45),
        GOLD
      ),

      dashed(
        zx(CUT),
        BASE,
        zx(CUT),
        BASE + (P ? 2.05 : 1.45),
        GOLD
      ),

      txt(
        '−1.96',
        15,
        GOLD,
        zx(-CUT),
        BASE + 0.23,
        true
      ),

      txt(
        '+1.96',
        15,
        GOLD,
        zx(CUT),
        BASE + 0.23,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Square-root picture for 32 bottles.
  //
  // An 8-by-4 array contains exactly 32 bottles.
  // A separate area-equivalent square shows sqrt(32),
  // without pretending that 32 is a perfect square.
  // ------------------------------------------------------------

  function root32Picture() {
    const y = P ? -0.90 : -0.42;

    const left = CX - 1.65;
    const right = CX + 1.85;

    const s = P ? 0.61 : 0.63;

    const side = 2.05;

    const parts = [
      tray(
        left,
        y,
        32,
        8,
        s
      ),

      arrow(
        CX - 0.25,
        y,
        CX + 0.56,
        y,
        C.cyan,
        3
      ),

      rect(
        right,
        y,
        side,
        side,
        C.green,
        C.green,
        0.12,
        0.04
      ),

      txt(
        'AREA 32',
        19,
        C.green,
        right,
        y,
        true,
        side - 0.25
      ),

      bracket(
        right - side / 2,
        right + side / 2,
        y - side / 2 - 0.20,
        '√32',
        GOLD,
        false
      ),

      txt(
        '≈ 5.66',
        23,
        GOLD,
        right,
        y + side / 2 + 0.36,
        true
      ),

      txt(
        'A square with area 32 has side √32',
        18,
        C.muted,
        CX,
        P ? -3.10 : -2.34,
        false,
        W
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Standard-error contraction.
  // Physical gram lengths are proportional.
  // ------------------------------------------------------------

  function standardErrorPicture() {
    const w = P ? 5.70 : 6.05;

    const y1 = P ? -0.20 : 0.43;
    const y2 = P ? -2.20 : -1.45;

    const left = CX - w / 2;

    const parts = [];

    [
      {
        n: 16,
        se: SE0,
        y: y1,
        color: C.cyan
      },

      {
        n: 32,
        se: SE1,
        y: y2,
        color: C.green
      }
    ].forEach(d => {
      const bw = w * d.se;

      parts.push(
        txt(
          `${d.n} BOTTLES`,
          19,
          d.color,
          CX,
          d.y + 0.72,
          true
        ),

        rect(
          CX,
          d.y,
          w,
          0.58,
          C.muted,
          C.card,
          0.95,
          0.04
        ),

        block(
          left + bw / 2,
          d.y,
          bw,
          0.54,
          d.color,
          0.70
        ),

        txt(
          `SE = ${d.se.toFixed(2)} g`,
          23,
          d.color,
          CX,
          d.y - 0.63,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Show the 80% goal crossing.
  // Both bars share the same probability scale.
  // ------------------------------------------------------------

  function goalComparison() {
    const y1 = P ? -0.25 : 0.18;
    const y2 = P ? -2.38 : -1.55;

    const w = P ? 6.20 : 6.50;
    const h = 0.50;

    return new M.VGroup(
      txt(
        '16 BOTTLES',
        19,
        C.cyan,
        CX - 1.80,
        y1 + 0.79,
        true,
        2.9
      ),

      probabilityBar(
        CX, y1,
        w, h,
        POWER16,
        GOAL
      ),

      txt(
        'Below the goal',
        18,
        GOLD,
        CX,
        y1 - 0.61
      ),

      txt(
        '32 BOTTLES',
        19,
        C.green,
        CX - 1.80,
        y2 + 0.79,
        true,
        2.9
      ),

      probabilityBar(
        CX, y2,
        w, h,
        POWER32,
        GOAL
      ),

      txt(
        'Goal passed!',
        20,
        C.green,
        CX,
        y2 - 0.61
      )
    );
  }

  // ------------------------------------------------------------
  // Direct planning rule: two distances.
  //
  // Distance 1: 1.96 from the original null centre
  //             to the right-hand critical boundary.
  //
  // Distance 2: 0.84 farther to the shifted centre.
  //
  // When the shifted centre is at 2.80, about 80% of that
  // distribution lies to the right of the boundary.
  // The tiny left rejection tail is retained in the power check.
  // ------------------------------------------------------------

  function planningHill(stage = 0) {
    const mu =
      stage === 0 ? CUT :
      REQUIRED_STEPS;

    const parts = [
      outline(
        0,
        C.cyan,
        2
      ),

      area(
        mu,
        ZLO,
        ZHI,
        C.violet,
        0.13
      )
    ];

    if (stage >= 3) {
      parts.push(
        area(
          mu,
          CUT,
          ZHI,
          C.green,
          0.85
        ),

        area(
          mu,
          ZLO,
          -CUT,
          C.green,
          0.85
        ),

        area(
          mu,
          -CUT,
          CUT,
          RED,
          0.30
        )
      );
    }

    parts.push(
      outline(
        mu,
        C.violet,
        3
      ),

      normalAxis(),
      targetLine(false),

      dashed(
        zx(CUT),
        BASE,
        zx(CUT),
        BASE + H + 0.10,
        GOLD
      ),

      dashed(
        zx(-CUT),
        BASE,
        zx(-CUT),
        BASE + H * 0.50,
        GOLD
      ),

      txt(
        '−1.96',
        15,
        GOLD,
        zx(-CUT),
        BASE + 0.24,
        true
      ),

      glowDot(
        zx(mu),
        BASE + H,
        C.violet,
        0.095
      )
    );

    if (stage >= 1) {
      const y1 = BASE + H * 0.50;

      parts.push(
        bracket(
          zx(0),
          zx(CUT),
          y1,
          '1.96',
          GOLD
        )
      );
    }

    if (stage >= 2) {
      const y2 = BASE + H * 0.76;

      parts.push(
        dashed(
          zx(mu),
          BASE,
          zx(mu),
          BASE + H,
          C.violet
        ),

        bracket(
          zx(CUT),
          zx(mu),
          y2,
          '0.84',
          C.violet
        ),

        txt(
          'New centre',
          16,
          C.violet,
          zx(mu) + 0.37,
          BASE + H + 0.30,
          false,
          1.90
        )
      );
    }

    if (stage >= 3) {
      parts.push(
        tag(
          '≈ 80% BEYOND',
          C.green,
          zx(5.1),
          BASE + H * 0.86,
          1.9
        ),

        arrow(
          zx(4.85),
          BASE + H * 0.72,
          zx(3.48),
          BASE + H *
            density(3.48, mu) * 0.33,
          C.green,
          2.3
        )
      );
    }

    if (stage >= 4) {
      const yy =
        P ? BASE + H + 0.92 : 1.15;

      parts.push(
        bracket(
          zx(0),
          zx(REQUIRED_STEPS),
          yy,
          '2.80 steps',
          C.green
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Normal-curve quantiles.
  // Compact probability sketches of the two input numbers.
  // ------------------------------------------------------------

  function quantilePanel(
    x, y, w, h,
    cut,
    mode
  ) {
    const left = x - w / 2 + 0.15;

    const gx = z =>
      left + (z + 3.5) / 7 * (w - 0.30);

    const gy = y - h / 2 + 0.55;
    const peak = h * 0.40;

    const f = z =>
      peak * Math.exp(-0.5 * z * z);

    const parts = [
      rect(
        x, y,
        w, h,
        mode === 'alpha' ? GOLD : C.green,
        C.card,
        0.95
      )
    ];

    const count = 64;

    for (let i = 0; i < count; i++) {
      const a = -3.5 + 7 * i / count;
      const b = -3.5 + 7 * (i + 1) / count;
      const mid = (a + b) / 2;

      const selected =
        mode === 'alpha'
          ? Math.abs(mid) >= cut
          : mid <= cut;

      const color =
        mode === 'alpha'
          ? RED
          : C.green;

      const bh = Math.max(
        0.001,
        f(mid)
      );

      parts.push(
        block(
          gx(mid),
          gy + bh / 2,
          (gx(b) - gx(a)) * 1.005,
          bh,
          selected ? color : C.cyan,
          selected ? 0.82 : 0.12
        ),

        line(
          gx(a), gy + f(a),
          gx(b), gy + f(b),
          C.cyan, 2
        )
      );
    }

    parts.push(
      line(
        gx(-3.5), gy,
        gx(3.5), gy,
        C.muted, 2
      ),

      dashed(
        gx(cut),
        gy,
        gx(cut),
        gy + peak + 0.04,
        GOLD
      ),

      txt(
        mode === 'alpha'
          ? '5% IN BOTH TAILS'
          : '80% BELOW',
        16,
        mode === 'alpha' ? GOLD : C.green,
        x,
        y + h / 2 - 0.28,
        true,
        w - 0.2
      ),

      txt(
        mode === 'alpha' ? '1.96' : '0.84',
        25,
        mode === 'alpha' ? GOLD : C.green,
        x,
        gy - 0.28,
        true
      )
    );

    if (mode === 'alpha') {
      parts.push(
        dashed(
          gx(-cut),
          gy,
          gx(-cut),
          gy + peak + 0.04,
          GOLD
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function quantilePicture() {
    const w = P ? 3.10 : 3.25;
    const h = P ? 2.85 : 2.70;

    const dx = P ? 1.70 : 1.80;

    return new M.VGroup(
      quantilePanel(
        CX - dx,
        CY,
        w, h,
        CUT,
        'alpha'
      ),

      quantilePanel(
        CX + dx,
        CY,
        w, h,
        POWER_QUANTILE,
        'power'
      ),

      txt(
        'Both numbers come from the normal curve',
        18,
        C.muted,
        CX,
        CY - h / 2 - 0.42,
        false,
        W
      )
    );
  }

  // ------------------------------------------------------------
  // Add two distances visually.
  // Exact proportional lengths: 1.96 and 0.84.
  // ------------------------------------------------------------

  function distanceAddition(showTotal = true) {
    const w = P ? 5.80 : 6.10;

    const y = CY;
    const h = 0.70;

    const left = CX - w / 2;
    const firstW = w * CUT / REQUIRED_STEPS;
    const secondW = w * POWER_QUANTILE / REQUIRED_STEPS;

    const firstX = left + firstW / 2;
    const secondX = left + firstW + secondW / 2;

    const parts = [
      block(
        firstX,
        y,
        firstW,
        h,
        GOLD,
        0.60
      ),

      block(
        secondX,
        y,
        secondW,
        h,
        C.violet,
        0.75
      ),

      txt(
        '1.96',
        27,
        C.ink,
        firstX,
        y,
        true
      ),

      txt(
        '0.84',
        25,
        C.ink,
        secondX,
        y,
        true,
        secondW - 0.16
      ),

      txt(
        'Reach the cut-off',
        18,
        GOLD,
        firstX,
        y - 0.68,
        false,
        firstW
      ),

      txt(
        'Go farther',
        17,
        C.violet,
        secondX,
        y - 0.68,
        false,
        secondW + 0.15
      ),

      txt(
        '0',
        17,
        C.muted,
        left,
        y + 0.57,
        true
      ),

      txt(
        '1.96',
        17,
        GOLD,
        left + firstW,
        y + 0.57,
        true
      )
    ];

    if (showTotal) {
      parts.push(
        bracket(
          left,
          left + w,
          y + 1.08,
          '2.80 standard errors',
          C.green
        ),

        txt(
          '1.96 + 0.84 = 2.80',
          26,
          C.green,
          CX,
          y - 1.48,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Arithmetic flow.
  //
  // Reveal one operation at a time:
  //   2.8 × 4
  //   11.2 ÷ 2
  //   5.6²
  //   round up to 32
  //
  // All boxes are laid out before being added.
  // ------------------------------------------------------------

  function arithmeticFlow(
    drift = 2,
    stage = 0
  ) {
    const multiplied =
      REQUIRED_STEPS * SD;

    const divided =
      multiplied / drift;

    const squared =
      divided ** 2;

    const rounded =
      Math.ceil(squared);

    const rows = [
      {
        label: 'MULTIPLY',
        text: `2.8 × 4 = ${multiplied.toFixed(1)}`,
        color: GOLD
      },

      {
        label: 'DIVIDE',
        text: `${multiplied.toFixed(1)} ÷ ${drift} = ${divided.toFixed(1)}`,
        color: C.violet
      },

      {
        label: 'SQUARE',
        text: `${divided.toFixed(1)}² = ${squared.toFixed(2)}`,
        color: C.cyan
      },

      {
        label: 'ROUND UP',
        text: `${squared.toFixed(2)} → ${rounded} bottles`,
        color: C.green
      }
    ];

    const w = P ? 6.35 : 6.65;
    const h = P ? 0.84 : 0.65;

    const top = P ? 0.80 : 1.00;
    const gap = P ? 1.20 : 0.91;

    const parts = [];

    rows.forEach((d, i) => {
      const y = top - i * gap;
      const visible = i < stage;

      const color = visible
        ? d.color
        : C.muted;

      parts.push(
        rect(
          CX, y,
          w, h,
          color, C.card,
          visible ? 0.95 : 0.40,
          0.10
        ),

        txt(
          d.label,
          15,
          color,
          CX - w / 2 + 1.03,
          y,
          true,
          1.70
        ),

        line(
          CX - w / 2 + 2.05,
          y - h * 0.32,
          CX - w / 2 + 2.05,
          y + h * 0.32,
          C.muted, 1.5
        ),

        txt(
          visible ? d.text : '…',
          21,
          color,
          CX + 0.95,
          y,
          true,
          w - 2.40
        )
      );

      if (i < rows.length - 1) {
        parts.push(
          arrow(
            CX,
            y - h / 2 - 0.015,
            CX,
            y - gap + h / 2 + 0.015,
            visible ? C.cyan : C.muted,
            2
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Squaring means multiplying a number by itself.
  // Illustrative square: its side length is 5.6.
  // Area is 31.36.
  // ------------------------------------------------------------

  function squarePicture() {
    const x = CX;
    const y = P ? -1.05 : -0.52;

    const side = P ? 3.05 : 2.45;

    const frame = rect(
      x, y,
      side, side,
      C.cyan,
      C.cyan,
      0.13,
      0.03
    );

    const parts = [frame];

    for (let i = 1; i <= 5; i++) {
      const offset =
        -side / 2 + side * i / 5.6;

      parts.push(
        line(
          x + offset,
          y - side / 2,
          x + offset,
          y + side / 2,
          C.cyan,
          1
        ),

        line(
          x - side / 2,
          y + offset,
          x + side / 2,
          y + offset,
          C.cyan,
          1
        )
      );
    }

    parts.push(
      rect(
        x, y,
        side * 0.73,
        0.70,
        C.cyan,
        C.card,
        0.97
      ),

      txt(
        '31.36',
        33,
        C.cyan,
        x, y,
        true,
        side * 0.65
      ),

      bracket(
        x - side / 2,
        x + side / 2,
        y - side / 2 - 0.16,
        '5.6',
        GOLD,
        false
      ),

      line(
        x - side / 2 - 0.19,
        y - side / 2,
        x - side / 2 - 0.19,
        y + side / 2,
        GOLD,
        2.5
      ),

      txt(
        '5.6',
        21,
        GOLD,
        x - side / 2 - 0.54,
        y,
        true
      ),

      txt(
        '5.6 × 5.6',
        23,
        C.cyan,
        x,
        y + side / 2 + 0.33,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Rounding up to an integer sample size.
  // Show the fractional answer between 31 and 32.
  // ------------------------------------------------------------

  function roundingPicture(
    raw = RAW_N2,
    rounded = PLAN_N2
  ) {
    const w = P ? 5.95 : 6.35;
    const y = P ? -2.75 : -1.88;

    const lower = Math.floor(raw);
    const upper = Math.ceil(raw);

    const left = CX - w / 2;
    const right = CX + w / 2;

    const gx = v =>
      left + (v - lower) /
        (upper - lower) * w;

    const parts = [
      line(
        left, y,
        right, y,
        C.muted,
        3
      ),

      line(
        left, y - 0.13,
        left, y + 0.13,
        C.muted,
        2.5
      ),

      line(
        right, y - 0.13,
        right, y + 0.13,
        C.green,
        3
      ),

      txt(
        String(lower),
        21,
        C.muted,
        left,
        y - 0.37,
        true
      ),

      txt(
        String(upper),
        23,
        C.green,
        right,
        y - 0.37,
        true
      ),

      glowDot(
        gx(raw),
        y,
        GOLD,
        0.105
      ),

      txt(
        raw.toFixed(2),
        20,
        GOLD,
        gx(raw),
        y + 0.33,
        true
      ),

      arrow(
        gx(raw) + 0.10,
        y + 0.75,
        right - 0.03,
        y + 0.75,
        C.green,
        3.5
      ),

      txt(
        'ROUND UP',
        18,
        C.green,
        (gx(raw) + right) / 2,
        y + 1.02,
        true,
        2.0
      ),

      txt(
        `${rounded} whole bottles`,
        28,
        C.green,
        CX,
        P ? 0.22 : 0.55,
        true
      ),

      txt(
        'No fractional bottles in an inspection',
        18,
        C.muted,
        CX,
        P ? -0.40 : -0.07
      )
    ];

    return new M.VGroup(...parts);
  }

  function plannedBatch(n = 32) {
    const y = P ? -1.6 : -0.55;

    const cols = n === 32 ? 8 : (P ? 14 : 18);
    const s = n === 32 ? 1.02 : (P ? 0.70 : 0.60);

    return new M.VGroup(
      tray(
        CX,
        y,
        n,
        cols,
        s,
        C.green,
        false
      ),

      tag(
        `${n} BOTTLES`,
        C.green,
        CX,
        P ? 0.83 : 1.10
      ),

      txt(
        `Power ≈ ${pct(power(n, n === 32 ? 2 : 1))}`,
        23,
        C.green,
        CX,
        P ? -4.0 : -2.2,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // General planning formula.
  // A real fraction is constructed from separate text objects
  // and a horizontal fraction bar.
  // ------------------------------------------------------------

  function generalFormulaPicture(
    showInputs = false
  ) {
    const x = CX;
    const y = CY + 0.28;

    const parts = [
      rect(
        x, y,
        P ? 6.45 : 6.75,
        P ? 2.65 : 2.45,
        C.cyan,
        C.card,
        0.95
      ),

      txt(
        'n ≈',
        31,
        C.cyan,
        x - 2.48,
        y,
        true
      ),

      txt(
        '(',
        58,
        C.ink,
        x - 1.70,
        y
      ),

      txt(
        '2.8 × spread',
        27,
        GOLD,
        x + 0.25,
        y + 0.42,
        true,
        3.25
      ),

      line(
        x - 1.40,
        y,
        x + 1.90,
        y,
        C.ink,
        2.7
      ),

      txt(
        'drift',
        28,
        C.violet,
        x + 0.25,
        y - 0.43,
        true
      ),

      txt(
        ')',
        58,
        C.ink,
        x + 2.15,
        y
      ),

      txt(
        '2',
        24,
        C.cyan,
        x + 2.62,
        y + 0.62,
        true
      ),

      txt(
        'Round the result UP',
        18,
        C.green,
        x,
        y - (P ? 1.65 : 1.53),
        false,
        W
      )
    ];

    if (showInputs) {
      parts.push(
        txt(
          'n = sample size = number of bottles',
          20,
          C.cyan,
          x,
          P ? 1.05 : 1.20,
          false,
          W
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Why the constant is 2.8.
  // This number applies to the specified test design.
  // ------------------------------------------------------------

  function designConstants() {
    const x = CX;
    const y = CY;

    const w = P ? 2.95 : 3.10;
    const h = P ? 2.10 : 1.95;

    const dx = P ? 1.65 : 1.75;

    return new M.VGroup(
      rect(
        x - dx, y + 0.35,
        w, h,
        GOLD,
        C.card,
        0.95
      ),

      txt(
        'TWO-SIDED',
        18,
        GOLD,
        x - dx,
        y + 1.02,
        true
      ),

      txt(
        'α = 5%',
        27,
        GOLD,
        x - dx,
        y + 0.45,
        true
      ),

      txt(
        '1.96',
        26,
        C.ink,
        x - dx,
        y - 0.25,
        true
      ),

      rect(
        x + dx, y + 0.35,
        w, h,
        C.green,
        C.card,
        0.95
      ),

      txt(
        'TARGET POWER',
        18,
        C.green,
        x + dx,
        y + 1.02,
        true
      ),

      txt(
        '80%',
        27,
        C.green,
        x + dx,
        y + 0.45,
        true
      ),

      txt(
        '0.84',
        26,
        C.ink,
        x + dx,
        y - 0.25,
        true
      ),

      txt(
        '+',
        28,
        C.ink,
        x,
        y + 0.35,
        true
      ),

      txt(
        '1.96 + 0.84 = 2.80',
        26,
        C.cyan,
        x,
        y - 1.25,
        true
      ),

      txt(
        'Different design goals give different constants.',
        17,
        C.muted,
        x,
        y - 1.82,
        false,
        W
      )
    );
  }

  // ------------------------------------------------------------
  // Planning timeline.
  // Choose the design BEFORE collecting data.
  // ------------------------------------------------------------

  function planningTimeline() {
    const x = CX;

    const items = [
      ['1', 'Meaningful drift', C.violet],
      ['2', 'Alpha and power', GOLD],
      ['3', 'Required sample size', C.green],
      ['4', 'Weigh the bottles', C.cyan]
    ];

    const w = P ? 6.15 : 6.50;
    const h = P ? 0.80 : 0.63;

    const gap = P ? 1.13 : 0.91;
    const top = P ? 0.75 : 1.00;

    const parts = [];

    items.forEach(([number, label, color], i) => {
      const y = top - i * gap;

      parts.push(
        rect(
          x, y,
          w, h,
          color,
          C.card,
          0.95
        ),

        glowDot(
          x - w / 2 + 0.41,
          y,
          color,
          0.12
        ),

        txt(
          number,
          15,
          C.ink,
          x - w / 2 + 0.41,
          y,
          true
        ),

        txt(
          label,
          21,
          color,
          x + 0.24,
          y,
          false,
          w - 1.35
        )
      );

      if (i < items.length - 1) {
        parts.push(
          arrow(
            x,
            y - h / 2 - 0.02,
            x,
            y - gap + h / 2 + 0.02,
            C.muted,
            2
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Too few, enough, and more than the stated goal requires.
  //
  // 64 is an illustrative over-planning comparison, not a
  // claim that collecting 64 bottles is always wasteful.
  // The cost depends on the factory's stated objective.
  // ------------------------------------------------------------

  function planningComparison() {
    const x = CX;
    const y = CY;

    const dx = P ? 2.18 : 2.26;

    const w = P ? 2.00 : 2.10;
    const h = P ? 3.25 : 2.95;

    const cases = [
      {
        n: 16,
        title: 'TOO FEW',
        color: RED,
        cols: 4,
        s: 0.49
      },

      {
        n: 32,
        title: 'GOAL MET',
        color: C.green,
        cols: 8,
        s: 0.40
      },

      {
        n: 64,
        title: 'EXTRA DATA',
        color: GOLD,
        cols: 8,
        s: 0.40
      }
    ];

    const parts = [];

    cases.forEach((d, i) => {
      const xx = x + (i - 1) * dx;

      parts.push(
        rect(
          xx, y,
          w, h,
          d.color,
          C.card,
          0.95
        ),

        txt(
          d.title,
          16,
          d.color,
          xx,
          y + h / 2 - 0.28,
          true,
          w - 0.20
        ),

        tray(
          xx,
          y + 0.13,
          d.n,
          d.cols,
          d.s,
          d.color,
          false
        ),

        txt(
          `${d.n} bottles`,
          17,
          d.color,
          xx,
          y - h / 2 + 0.62,
          true,
          w - 0.18
        ),

        txt(
          `${pct(power(d.n))} power`,
          17,
          d.color,
          xx,
          y - h / 2 + 0.27,
          true,
          w - 0.18
        )
      );
    });

    parts.push(
      txt(
        'Plan for the goal rather than guessing.',
        18,
        C.muted,
        x,
        y - h / 2 - 0.42,
        false,
        W
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Smaller meaningful drift.
  // Keep the gram scale fixed.
  // ------------------------------------------------------------

  function smallerDriftPicture(drift = 1) {
    const w = P ? 6.10 : 6.45;
    const y = BASE + 0.18;

    const gx = v =>
      CX - w / 2 +
      (v - 499) / 4 * w;

    const parts = [
      bottle(
        gx(500),
        P ? -0.56 : -0.20,
        0.95,
        0.70,
        '500 g',
        C.cyan
      ),

      bottle(
        gx(500 + drift),
        P ? -0.56 : -0.20,
        0.95,
        0.70 + drift * 0.06,
        '500 g',
        C.violet
      ),

      line(
        gx(499), y,
        gx(503), y,
        C.muted,
        2.5
      ),

      line(
        gx(500),
        y,
        gx(500),
        y + 0.75,
        GOLD,
        3
      ),

      line(
        gx(500 + drift),
        y,
        gx(500 + drift),
        y + 0.75,
        C.violet,
        3
      )
    ];

    [499, 500, 501, 502, 503].forEach(v => {
      parts.push(
        txt(
          String(v),
          17,
          v === 500 ? GOLD : C.muted,
          gx(v),
          y - 0.31,
          true
        )
      );
    });

    parts.push(
      bracket(
        gx(500),
        gx(500 + drift),
        y + 1.00,
        `+${drift} g`,
        C.violet
      ),

      heading(
        drift === 1
          ? 'A smaller drift is harder to see'
          : 'The original meaningful drift',
        C.violet
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Sample size versus meaningful drift.
  // The raw planning rule is inversely proportional to drift².
  // ------------------------------------------------------------

  function sampleSizeCurve() {
    const w = P ? 5.85 : 6.05;
    const h = P ? 3.45 : 2.55;

    const left = CX - w / 2 + 0.26;
    const y = BASE;

    const minD = 0.75;
    const maxD = 4.0;
    const maxN = 240;

    const gx = d =>
      left + (d - minD) /
        (maxD - minD) * w;

    const gy = n =>
      y + n / maxN * h;

    const required = d =>
      (REQUIRED_STEPS * SD / d) ** 2;

    const parts = [
      line(
        gx(minD), gy(0),
        gx(maxD), gy(0),
        C.muted, 2.5
      ),

      line(
        gx(minD), gy(0),
        gx(minD), gy(maxN),
        C.muted, 2.5
      )
    ];

    [0, 60, 120, 180, 240].forEach(n => {
      parts.push(
        dashed(
          gx(minD), gy(n),
          gx(maxD), gy(n),
          C.muted
        ),

        txt(
          String(n),
          15,
          C.muted,
          gx(minD) - 0.29,
          gy(n),
          true
        )
      );
    });

    [1, 2, 3, 4].forEach(d => {
      parts.push(
        txt(
          `${d} g`,
          16,
          C.muted,
          gx(d),
          y - 0.31,
          true
        )
      );
    });

    for (let i = 0; i < 110; i++) {
      const a =
        minD + (maxD - minD) * i / 110;

      const b =
        minD + (maxD - minD) * (i + 1) / 110;

      parts.push(
        line(
          gx(a), gy(required(a)),
          gx(b), gy(required(b)),
          C.cyan,
          3
        )
      );
    }

    [
      { drift: 1, n: PLAN_N1, raw: RAW_N1 },
      { drift: 2, n: PLAN_N2, raw: RAW_N2 }
    ].forEach(d => {
      parts.push(
        dashed(
          gx(d.drift),
          y,
          gx(d.drift),
          gy(d.raw),
          GOLD
        ),

        glowDot(
          gx(d.drift),
          gy(d.raw),
          C.green,
          0.105
        ),

        tag(
          `${d.n} bottles`,
          C.green,
          gx(d.drift) + 0.70,
          gy(d.raw) + 0.31,
          2.30
        )
      );
    });

    parts.push(
      txt(
        'Required sample size',
        18,
        C.cyan,
        CX,
        P ? 0.96 : 1.15
      ),

      txt(
        'Smallest meaningful drift',
        17,
        C.muted,
        CX,
        BASE - 0.72
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Exact visual comparison: 32 versus 126 bottles.
  //
  // One cyan dot = one bottle.
  // The larger array is approximately four times the size.
  // ------------------------------------------------------------

  function bottleDotGrid(
    x, y,
    n,
    cols,
    pitch,
    color
  ) {
    const rows = Math.ceil(n / cols);
    const parts = [];

    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      parts.push(
        dot(
          x + (col - (cols - 1) / 2) * pitch,
          y + ((rows - 1) / 2 - row) * pitch,
          color,
          pitch * 0.27,
          0.95
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fourfoldPicture() {
    const x1 = CX - 1.83;
    const x2 = CX + 1.68;

    const y = P ? -1.25 : -0.55;

    const pitch = P ? 0.24 : 0.23;

    return new M.VGroup(
      txt(
        '2 g DRIFT',
        19,
        C.violet,
        x1,
        y + 1.55,
        true
      ),

      txt(
        '1 g DRIFT',
        19,
        C.violet,
        x2,
        y + 1.55,
        true
      ),

      bottleDotGrid(
        x1, y,
        32,
        8,
        pitch,
        C.cyan
      ),

      bottleDotGrid(
        x2, y,
        126,
        14,
        pitch,
        C.green
      ),

      txt(
        '32 bottles',
        22,
        C.cyan,
        x1,
        y - 1.40,
        true,
        2.8
      ),

      txt(
        '126 bottles',
        22,
        C.green,
        x2,
        y - 1.40,
        true,
        3.3
      ),

      tag(
        'ABOUT 4 TIMES AS MANY',
        GOLD,
        CX,
        y - 2.04
      )
    );
  }

  // ------------------------------------------------------------
  // Inverse-square explanation.
  // Halve the drift -> double the ratio -> quadruple n.
  // ------------------------------------------------------------

  function inverseSquarePicture() {
    const x = CX;

    const top = P ? 0.65 : 0.93;
    const gap = P ? 1.40 : 1.13;

    const rows = [
      ['DRIFT', '2 g → 1 g', '÷ 2', C.violet],
      ['RATIO', '5.6 → 11.2', '× 2', GOLD],
      ['SQUARED', '31.36 → 125.44', '× 4', C.green]
    ];

    const w = P ? 6.35 : 6.65;
    const h = P ? 0.91 : 0.77;

    const parts = [];

    rows.forEach((d, i) => {
      const y = top - gap * i;
      const [label, value, factor, color] = d;

      parts.push(
        rect(
          x, y,
          w, h,
          color,
          C.card,
          0.95
        ),

        txt(
          label,
          15,
          color,
          x - w / 2 + 0.94,
          y,
          true,
          1.55
        ),

        txt(
          value,
          20,
          C.ink,
          x + 0.07,
          y,
          true,
          w - 3.0
        ),

        txt(
          factor,
          25,
          color,
          x + w / 2 - 0.64,
          y,
          true,
          1.05
        )
      );

      if (i < rows.length - 1) {
        parts.push(
          arrow(
            x,
            y - h / 2 - 0.03,
            x,
            y - gap + h / 2 + 0.03,
            C.muted,
            2.5
          )
        );
      }
    });

    parts.push(
      txt(
        '2² = 4',
        27,
        C.green,
        x,
        top - 2 * gap - 0.82,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Decide the smallest meaningful drift before testing.
  // ------------------------------------------------------------

  function meaningfulDriftCard() {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 4.15 : 3.65;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        GOLD,
        C.card,
        0.95
      ),

      txt(
        'WHAT REALLY MATTERS?',
        24,
        GOLD,
        x,
        y + h / 2 - 0.40,
        true,
        w - 0.5
      ),

      txt(
        'A 2 g drift?',
        28,
        C.violet,
        x - 1.55,
        y + 0.45,
        false,
        2.75
      ),

      txt(
        'A 1 g drift?',
        28,
        C.violet,
        x + 1.55,
        y + 0.45,
        false,
        2.75
      ),

      txt(
        '32 bottles',
        22,
        C.cyan,
        x - 1.55,
        y - 0.10,
        true
      ),

      txt(
        '126 bottles',
        22,
        C.green,
        x + 1.55,
        y - 0.10,
        true
      ),

      line(
        x - w / 2 + 0.4,
        y - 0.53,
        x + w / 2 - 0.4,
        y - 0.53,
        C.muted,
        1.5
      ),

      txt(
        'Choose the smallest drift that matters.',
        22,
        C.ink,
        x,
        y - 1.00,
        false,
        w - 0.55
      ),

      txt(
        'Do not demand detection of every tiny change.',
        17,
        C.muted,
        x,
        y - h / 2 + 0.28,
        false,
        w - 0.55
      )
    );
  }

  // ------------------------------------------------------------
  // Preview next lesson: practical effect size.
  // Do not reveal the calculations from lesson 7.1.8 yet.
  // ------------------------------------------------------------

  function effectPreview() {
    const x = CX;
    const y = CY;

    return new M.VGroup(
      scale(
        x - 1.45,
        y - 0.30,
        1.05,
        '500 g'
      ),

      bottle(
        x - 1.45,
        y + 0.77,
        0.86,
        0.70,
        '500 g'
      ),

      scale(
        x + 1.45,
        y - 0.30,
        1.05,
        '502 g'
      ),

      bottle(
        x + 1.45,
        y + 0.77,
        0.86,
        0.82,
        '500 g',
        C.violet
      ),

      bracket(
        x - 1.45,
        x + 1.45,
        y - 1.04,
        '+2 g',
        C.violet,
        false
      ),

      heading(
        'How big is two grams in practice?',
        GOLD
      ),

      txt(
        'Think beyond the statistical alarm.',
        19,
        C.muted,
        x,
        y - 1.80,
        false,
        W
      )
    );
  }

  // ------------------------------------------------------------
  // Final recap.
  // ------------------------------------------------------------

  function finalRecap() {
    const x = CX;
    const y = CY;

    const w = P ? 6.45 : 6.85;
    const h = P ? 4.55 : 3.90;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        C.green,
        C.card,
        0.95
      ),

      txt(
        'PLAN THE SAMPLE SIZE',
        25,
        C.green,
        x,
        y + h / 2 - 0.42,
        true,
        w - 0.50
      ),

      txt(
        'Smallest meaningful drift: 2 g',
        21,
        C.violet,
        x,
        y + 0.80,
        false,
        w - 0.55
      ),

      txt(
        'Two-sided α = 5% • Power goal = 80%',
        18,
        GOLD,
        x,
        y + 0.31,
        false,
        w - 0.55
      ),

      txt(
        '32 BOTTLES',
        36,
        C.green,
        x,
        y - 0.30,
        true
      ),

      txt(
        'Actual power ≈ 81%',
        21,
        C.green,
        x,
        y - 0.90,
        true
      ),

      txt(
        'Choose before collecting any data.',
        18,
        C.ink,
        x,
        y - h / 2 + 0.30,
        false,
        w - 0.50
      )
    );
  }

  // ============================================================
  // 0. Recap: 16 bottles detect a 2 g drift only about half
  //    the time.
  // ============================================================

  await until(S(0));
  await play(
    ...scene([
      ['opening', openingPicture()]
    ]),

    ...fbox([
      'From the last lesson',
      'True drift = +2 g',
      'n = 16',
      ['Power ≈ 52%', C.green]
    ], C.green),

    ...say('16 BOTTLES: ONLY ABOUT 52% POWER', GOLD)
  );

  // ============================================================
  // 1. The manager wants to catch a meaningful 2 g drift
  //    most of the time.
  // ============================================================

  await until(S(1));
  await play(
    ...scene([
      ['manager', managerPicture(false)]
    ]),

    ...fbox([
      'Manager’s goal',
      ['A 2 g drift matters.', C.violet],
      'Catch it reliably.'
    ], C.violet),

    ...say('A TWO-GRAM DRIFT MATTERS TO US', C.violet)
  );

  // ============================================================
  // 2. Set the power goal to 80%.
  // ============================================================

  await until(S(2));
  await play(
    ...scene([
      ['goal', goalGrid()]
    ]),

    ...fbox([
      'Catch a real +2 g drift',
      '80 times in 100',
      ['Target power = 0.80', C.green],
      ['= 80%', C.green]
    ], C.green),

    ...say('OUR TARGET IS 80% POWER', C.green)
  );

  // ============================================================
  // 3. How many bottles must each inspection weigh?
  // ============================================================

  await until(S(3));
  await play(
    ...scene([
      ['question', sampleQuestion()]
    ]),

    ...fbox([
      'Known SD = 4 g',
      'Meaningful drift = 2 g',
      'Desired power = 80%',
      ['Find n.', GOLD]
    ], GOLD),

    ...say('HOW MANY BOTTLES SHOULD WE WEIGH?', GOLD)
  );

  // ============================================================
  // 4. Return to the normal-hill picture.
  // ============================================================

  await until(S(4));
  await play(
    ...scene([
      [
        'graph',
        graph(
          SHIFT0,
          true,
          true
        )
      ]
    ]),

    ...say('LOOK AT THE MOVED HILL AGAIN')
  );

  // ============================================================
  // 5. More bottles shrink the standard error.
  //    Show a finer ruler on the same physical gram scale.
  // ============================================================

  await until(S(5));
  await play(
    ...scene([
      [
        'rulers',
        rulerComparison(false)
      ]
    ]),

    ...fbox([
      'Standard error',
      '= spread ÷ √n',
      ['Larger n → smaller SE', C.green]
    ], C.green),

    ...say('MORE BOTTLES MAKE THE RULER FINER', C.green)
  );

  // ============================================================
  // 6. The same 2 g drift covers more steps.
  // ============================================================

  await until(S(6));
  await play(
    ...put(
      'rulers',
      rulerComparison(true)
    ),

    ...fbox([
      ['Physical drift stays 2 g', C.violet],
      'Number of steps',
      '= drift ÷ SE',
      ['Smaller SE → more steps', C.green]
    ], C.green),

    ...say('SAME TWO GRAMS, MORE STANDARD ERRORS', C.green)
  );

  // ============================================================
  // 7. The shifted hill moves farther beyond the cut-off.
  //    Show the detection area expanding.
  // ============================================================

  await until(S(7));
  await play(
    ...scene([
      ['axis', normalAxis()],
      ['target', targetLine()],
      ['cuts', cutLines()],
      ['hill', shiftedHill(SHIFT0, true, true)]
    ]),

    ...fbox([
      'Cut-off remains +1.96',
      'More steps shift the hill.',
      ['More green area → more power', C.green]
    ], C.green),

    ...say('MORE OF THE HILL CROSSES THE ALARM CUT-OFF', C.green)
  );

  await play(
    ...morph(
      'hill',
      shiftedHill(
        SHIFT1,
        true,
        true
      )
    )
  );

  // ============================================================
  // 8. Introduce the narrated sample-size slider.
  // ============================================================

  await until(S(8));
  await play(
    ...scene([
      ['track', sliderTrack()],
      ['knob', sliderKnob(16)],
      ['hill', sliderHill(16)],
      ['fixed', sliderFixedGraph()]
    ]),

    ...fbox([
      'Change the sample size.',
      'Keep drift = 2 g.',
      'Keep α = 0.05.'
    ]),

    ...say('SLIDE THE NUMBER OF BOTTLES')
  );

  // ============================================================
  // 9. At n = 16:
  //    SE = 1 g; shifted centre = 2; power ≈ 52%.
  // ============================================================

  await until(S(9));
  await play(
    ...indicate(
      'knob',
      C.cyan
    ),

    ...fbox([
      'n = 16',
      'SE = 4 ÷ 4 = 1 g',
      ['Drift = 2 steps', C.violet],
      ['Power ≈ 52%', C.green]
    ], C.green),

    ...say('16 BOTTLES: TWO STEPS, 52% POWER', C.cyan)
  );

  // ============================================================
  // 10. Slide toward n = 32, then show sqrt(32) ≈ 5.66.
  // ============================================================

  await until(S(10));
  await play(
    ...morph(
      'knob',
      sliderKnob(24)
    ),

    ...put(
      'hill',
      sliderHill(24)
    ),

    ...say('INCREASE THE SAMPLE TO 32 BOTTLES')
  );

  await play(
    ...morph(
      'knob',
      sliderKnob(32)
    ),

    ...put(
      'hill',
      sliderHill(32)
    ),

    ...fbox([
      ['n = 32', C.cyan],
      '√32',
      ['≈ 5.66', GOLD]
    ], GOLD)
  );

  await play(
    ...scene([
      ['root', root32Picture()]
    ]),

    ...fbox([
      'n = 32',
      ['√32 ≈ 5.66', GOLD]
    ], GOLD)
  );

  // ============================================================
  // 11. Standard error = 4 / sqrt(32) ≈ 0.71 g.
  // ============================================================

  await until(S(11));
  await play(
    ...scene([
      ['standardError', standardErrorPicture()]
    ]),

    ...fbox([
      'SE = 4 ÷ √32',
      '≈ 4 ÷ 5.66',
      ['≈ 0.71 g', C.green]
    ], C.green),

    ...say('32 BOTTLES: STANDARD ERROR ≈ 0.71 g', C.green)
  );

  // ============================================================
  // 12. Two grams now covers about 2.83 standard errors.
  //     Calculate using the unrounded standard error.
  // ============================================================

  await until(S(12));
  await play(
    ...scene([
      ['rulers', rulerComparison(true)]
    ]),

    ...fbox([
      'Real drift = 2 g',
      'Steps = 2 ÷ (4 / √32)',
      ['≈ 2.83 steps', C.violet]
    ], C.violet),

    ...say('THE SAME TWO GRAMS NOW COVER 2.83 STEPS', C.violet)
  );

  // ============================================================
  // 13. Power is about 81%, exceeding the 80% goal.
  // ============================================================

  await until(S(13));
  await play(
    ...scene([
      ['comparison', goalComparison()]
    ]),

    ...fbox([
      'n = 32',
      `Power ≈ ${POWER32.toFixed(3)}`,
      ['≈ 81%', C.green],
      ['80% goal passed!', C.green]
    ], C.green),

    ...say('81% POWER — WE PASSED THE GOAL', C.green)
  );

  // ============================================================
  // 14. Ask for a direct planning rule.
  // ============================================================

  await until(S(14));
  await play(
    ...scene([
      [
        'planningHill',
        planningHill(0)
      ],

      [
        'heading',
        heading(
          'Can we calculate n directly?',
          GOLD
        )
      ]
    ]),

    ...fbox([
      'Instead of trial and error:',
      ['Calculate the sample size.', GOLD]
    ], GOLD),

    ...say('THERE IS A DIRECT RULE', GOLD)
  );

  // ============================================================
  // 15. The required shift consists of two distances.
  // ============================================================

  await until(S(15));
  await play(
    ...scene([
      [
        'distance',
        distanceAddition(false)
      ]
    ]),

    ...fbox([
      'Required drift in SE steps',
      '= first distance',
      '+ second distance',
      ['For 80% power', C.green]
    ], C.green),

    ...say('ADD TWO DISTANCES TO FIND THE REQUIRED SHIFT')
  );

  // ============================================================
  // 16. First distance: 1.96, from the null centre to the
  //     alarm cut-off.
  // ============================================================

  await until(S(16));
  await play(
    ...scene([
      ['planningHill', planningHill(1)]
    ]),

    ...fbox([
      'First distance',
      'From z = 0 to +1.96',
      ['= 1.96 steps', GOLD]
    ], GOLD),

    ...say('FIRST: 1.96 STEPS TO THE CUT-OFF', GOLD)
  );

  // ============================================================
  // 17. Second distance: 0.84.
  //     Move the hill past the cut-off.
  // ============================================================

  await until(S(17));
  await play(
    ...put(
      'planningHill',
      planningHill(2)
    ),

    ...fbox([
      'Second distance',
      'Move the centre farther',
      ['by 0.84 steps.', C.violet]
    ], C.violet),

    ...say('SECOND: ANOTHER 0.84 STEPS', C.violet)
  );

  // ============================================================
  // 18. When the centre is 0.84 beyond the cut-off,
  //     approximately 80% of the shifted hill lies beyond it.
  // ============================================================

  await until(S(18));
  await play(
    ...put(
      'planningHill',
      planningHill(3)
    ),

    ...fbox([
      'Centre 0.84 past the cut-off',
      'Right-tail area ≈ 0.80',
      ['≈ 80% detected', C.green]
    ], C.green),

    ...say('80% OF THE MOVED HILL IS NOW BEYOND THE CUT-OFF', C.green)
  );

  // ============================================================
  // 19. Both numbers are read from the normal curve.
  // ============================================================

  await until(S(19));
  await play(
    ...scene([
      ['quantiles', quantilePicture()]
    ]),

    ...fbox([
      ['1.96: two-sided α = 5%', GOLD],
      ['0.84: 80% normal quantile', C.green],
      'Both from the normal curve.'
    ], C.cyan),

    ...say('BOTH NUMBERS COME FROM THE NORMAL CURVE')
  );

  // ============================================================
  // 20. Add: 1.96 + 0.84 = 2.80.
  // ============================================================

  await until(S(20));
  await play(
    ...scene([
      ['distance', distanceAddition(true)]
    ]),

    ...fbox([
      '1.96 + 0.84',
      ['= 2.80', C.green]
    ], C.green),

    ...say('1.96 PLUS 0.84 EQUALS 2.80', C.green)
  );

  // ============================================================
  // 21. The required drift is approximately 2.8 SEs.
  // ============================================================

  await until(S(21));
  await play(
    ...scene([
      ['planningHill', planningHill(4)]
    ]),

    ...fbox([
      'Required standardized drift',
      ['≈ 2.8 standard errors', C.green],
      'For 80% power'
    ], C.green),

    ...say('THE DRIFT MUST COVER ABOUT 2.8 STANDARD ERRORS', C.green)
  );

  // ============================================================
  // 22. Prepare the arithmetic, one step at a time.
  // ============================================================

  await until(S(22));
  await play(
    ...scene([
      ['arithmetic', arithmeticFlow(2, 0)]
    ]),

    ...fbox([
      'Required steps = 2.8',
      'Bottle SD = 4 g',
      'Meaningful drift = 2 g'
    ]),

    ...say('NOW DO THE ARITHMETIC')
  );

  // ============================================================
  // 23. Multiply 2.8 by 4 = 11.2.
  // ============================================================

  await until(S(23));
  await play(
    ...put(
      'arithmetic',
      arithmeticFlow(2, 1)
    ),

    ...fbox([
      'Step 1: multiply',
      '2.8 × 4',
      ['= 11.2', GOLD]
    ], GOLD),

    ...say('MULTIPLY: 2.8 × 4 = 11.2', GOLD)
  );

  // ============================================================
  // 24. Divide 11.2 by the meaningful drift, 2 g.
  // ============================================================

  await until(S(24));
  await play(
    ...put(
      'arithmetic',
      arithmeticFlow(2, 2)
    ),

    ...fbox([
      'Step 2: divide by drift',
      '11.2 ÷ 2',
      ['= 5.6', C.violet]
    ], C.violet),

    ...say('DIVIDE: 11.2 ÷ 2 = 5.6', C.violet)
  );

  // ============================================================
  // 25. Square 5.6.
  //     5.6 × 5.6 = 31.36 ≈ 31.4.
  // ============================================================

  await until(S(25));
  await play(
    ...scene([
      ['square', squarePicture()]
    ]),

    ...fbox([
      'Step 3: square',
      '5.6² = 5.6 × 5.6',
      ['= 31.36', C.cyan],
      '≈ 31.4'
    ]),

    ...say('SQUARE: 5.6 × 5.6 = 31.36')
  );

  // ============================================================
  // 26. Round up to 32 whole bottles.
  // ============================================================

  await until(S(26));
  await play(
    ...scene([
      [
        'rounding',
        roundingPicture(
          RAW_N2,
          PLAN_N2
        )
      ]
    ]),

    ...fbox([
      'Step 4: round UP',
      '31.36 → 32',
      ['n = 32 bottles', C.green]
    ], C.green),

    ...say('ROUND UP TO 32 WHOLE BOTTLES', C.green)
  );

  await play(
    ...scene([
      ['batch', plannedBatch(32)]
    ]),

    ...fbox([
      ['32 bottles', C.green],
      `SE ≈ ${SE1.toFixed(2)} g`,
      `Power ≈ ${POWER32.toFixed(3)}`,
      ['Goal achieved', C.green]
    ], C.green)
  );

  // ============================================================
  // 27. Show the compact planning formula.
  // ============================================================

  await until(S(27));
  await play(
    ...scene([
      [
        'formulaPicture',
        generalFormulaPicture(false)
      ]
    ]),

    ...fbox([
      'n ≈ (2.8 × spread / drift)²',
      '  = (2.8 × 4 / 2)²',
      '  = 31.36',
      ['Round up to 32', C.green]
    ], C.green),

    ...say('SQUARE THE WHOLE RATIO')
  );

  // ============================================================
  // 28. n means the sample size: number of bottles.
  // ============================================================

  await until(S(28));
  await play(
    ...put(
      'formulaPicture',
      generalFormulaPicture(true)
    ),

    ...fbox([
      ['n = sample size', C.cyan],
      'Number of bottles',
      'we weigh per inspection.'
    ]),

    ...say('n IS THE NUMBER OF BOTTLES')
  );

  // ============================================================
  // 29. The constant 2.8 belongs to this specified design:
  //     two-sided alpha 5%, target power 80%.
  // ============================================================

  await until(S(29));
  await play(
    ...scene([
      ['constants', designConstants()]
    ]),

    ...fbox([
      ['Two-sided α = 0.05', GOLD],
      ['Target power = 0.80', C.green],
      '1.96 + 0.84',
      ['= 2.80', C.cyan]
    ]),

    ...say('2.8 COMES FROM OUR CHOSEN ALPHA AND POWER', GOLD)
  );

  // ============================================================
  // 30. Plan before collecting any data.
  // ============================================================

  await until(S(30));
  await play(
    ...scene([
      ['timeline', planningTimeline()]
    ]),

    ...fbox([
      'Before weighing bottles:',
      'Choose the meaningful drift.',
      'Choose α and power.',
      ['Calculate n.', C.green]
    ], C.green),

    ...say('PLAN THE INSPECTION BEFORE COLLECTING DATA', C.green)
  );

  // ============================================================
  // 31. Too few bottles may miss real problems.
  //     Far more than needed may waste time and resources.
  // ============================================================

  await until(S(31));
  await play(
    ...scene([
      ['comparison', planningComparison()]
    ]),

    ...fbox([
      ['Too few → low power', RED],
      ['Enough → goal met', C.green],
      ['Too many → extra cost', GOLD],
      'Plan for what matters.'
    ], GOLD),

    ...say('AVOID TOO LITTLE DATA OR UNNECESSARY EXTRA WORK', GOLD)
  );

  // ============================================================
  // 32. Trap: small drifts require much larger sample sizes.
  // ============================================================

  await until(S(32));
  await play(
    ...scene([
      ['sizeCurve', sampleSizeCurve()]
    ]),

    ...fbox([
      ['COMMON TRAP', RED],
      'Smaller drift',
      'is much harder to detect.',
      ['Required n rises sharply.', RED]
    ], RED),

    ...say('TRAP: SMALL DRIFTS ARE EXPENSIVE TO DETECT', RED)
  );

  // ============================================================
  // 33. Suppose the meaningful drift is only 1 g.
  //     Keep the same spread, alpha and target power.
  // ============================================================

  await until(S(33));
  await play(
    ...scene([
      ['drift', smallerDriftPicture(1)]
    ]),

    ...fbox([
      'New meaningful drift = 1 g',
      'Known SD = 4 g',
      'Two-sided α = 0.05',
      ['Power goal still 80%', C.green]
    ], C.violet),

    ...say('WHAT IF WE MUST DETECT A ONE-GRAM DRIFT?', C.violet)
  );

  // ============================================================
  // 34. Calculate:
  //     2.8 × 4 / 1 = 11.2.
  //     11.2² = 125.44 ≈ 125.4.
  // ============================================================

  await until(S(34));
  await play(
    ...scene([
      [
        'arithmetic',
        arithmeticFlow(1, 1)
      ]
    ]),

    ...fbox([
      'n ≈ (2.8 × 4 / 1)²',
      '2.8 × 4 = 11.2'
    ], GOLD),

    ...say('USE THE SAME RULE WITH A DRIFT OF 1 g', GOLD)
  );

  await play(
    ...put(
      'arithmetic',
      arithmeticFlow(1, 2)
    ),

    ...fbox([
      '11.2 ÷ 1',
      ['= 11.2', C.violet]
    ], C.violet)
  );

  await play(
    ...put(
      'arithmetic',
      arithmeticFlow(1, 3)
    ),

    ...fbox([
      '11.2²',
      '= 11.2 × 11.2',
      ['= 125.44', C.cyan],
      '≈ 125.4'
    ])
  );

  // ============================================================
  // 35. Round up to 126 whole bottles.
  // ============================================================

  await until(S(35));
  await play(
    ...scene([
      ['batch', plannedBatch(126)]
    ]),

    ...fbox([
      '125.44 → 126',
      ['n = 126 bottles', C.green],
      `Power ≈ ${pct(POWER126)}`
    ], C.green),

    ...say('ROUND UP TO 126 BOTTLES', C.green)
  );

  // ============================================================
  // 36. Halving the drift approximately quadruples n.
  //     Exact raw ratio: 125.44 / 31.36 = 4.
  //     Rounded integer ratio: 126 / 32 = 3.9375.
  // ============================================================

  await until(S(36));
  await play(
    ...scene([
      ['fourfold', fourfoldPicture()]
    ]),

    ...fbox([
      'Drift: 2 g → 1 g',
      'Sample: 32 → 126',
      ['About four times as many', GOLD]
    ], GOLD),

    ...say('HALF THE DRIFT, ABOUT FOUR TIMES THE BOTTLES', GOLD)
  );

  await play(
    ...scene([
      ['inverseSquare', inverseSquarePicture()]
    ]),

    ...fbox([
      'Divide by drift.',
      'Halve drift → double ratio.',
      'Then square the ratio.',
      ['2² = 4', C.green]
    ], C.green)
  );

  // ============================================================
  // 37. Decide which drift truly matters.
  //     Do not demand detection of every tiny change.
  // ============================================================

  await until(S(37));
  await play(
    ...scene([
      ['meaningful', meaningfulDriftCard()]
    ]),

    ...fbox([
      'Choose the smallest drift',
      ['that truly matters.', C.violet],
      'Balance detection and cost.',
      'Then calculate n.'
    ], GOLD),

    ...say('DECIDE FIRST WHICH DRIFT REALLY MATTERS', GOLD)
  );

  // ============================================================
  // 38. Preview effect size in practical units.
  // ============================================================

  await until(S(38));
  await play(
    ...scene([
      ['preview', effectPreview()]
    ]),

    ...fbox([
      'A drift can be detectable.',
      'But how BIG is it?',
      ['Next: practical effect size', C.violet]
    ], C.violet),

    ...say('NEXT: HOW BIG IS A DRIFT IN PRACTICE?', GOLD)
  );

  // ============================================================
  // 39. Final recap.
  //     Choose sample size before collecting data so the test
  //     has enough power for the smallest meaningful drift.
  // ============================================================

  await until(S(39));
  await play(
    ...scene([
      ['recap', finalRecap()]
    ]),

    ...fbox([
      'n ≈ (2.8 × spread / drift)²',
      'For α = 5%, power = 80%',
      ['2 g drift → 32 bottles', C.green],
      ['1 g drift → 126 bottles', C.violet],
      'Choose n before data.'
    ], C.green),

    ...say('PLAN ENOUGH DATA TO DETECT WHAT MATTERS', C.green)
  );
}

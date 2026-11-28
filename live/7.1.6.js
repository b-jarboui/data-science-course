// lesson 7.1.6
// Type II error and power.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared chapter data:
//   Label target = 500 g.
//   Known individual standard deviation = 4 g.
//   Sample size = 16 bottles.
//   Standard error = 1 g.
//   Two-sided significance level = 0.05.
//   Alarm cut-offs = -1.96 and +1.96.
//
// At true mean 502 g:
//   z distribution centres on +2.
//   Power ≈ 0.516.
//   Type II error probability ≈ 0.484.
//
// At true mean 503 g:
//   z distribution centres on +3.
//   Power ≈ 0.851.
//
// The simulation uses seeded normal draws of standardized sample
// means, equivalent to averaging independent normal bottle weights.
// Seed 2039 was selected to give an illustrative run close to the
// theoretical expectation: 517 alarms in 1,000 inspections.
// Theoretical probabilities and simulated frequencies are labelled
// separately. Other simulation runs will give different counts.
//
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
  const SE = SD / Math.sqrt(N);

  const ALPHA = 0.05;
  const CUT = 1.96;

  const STRICT_ALPHA = 0.01;
  const STRICT_CUT = 2.575829;

  const DRIFT_2 = 2;
  const DRIFT_3 = 3;

  const POWER_2 = 0.516;
  const BETA_2 = 0.484;

  const POWER_3 = 0.851;
  const BETA_3 = 0.149;

  const SIM_N = 1000;

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
    maxw = P ? 6.55 : 7.05
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

  function block(
    x, y, w, h,
    color,
    opacity = 0.85
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
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
      dot(
        x, y,
        color,
        radius * 2.1,
        0.15
      ),

      dot(
        x, y,
        color,
        radius,
        1
      )
    );
  }

  function tag(s, color, x, y) {
    const p = pill(s, color);
    const maxw = P ? FW - 1 : 6.90;

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
      P ? 1.10 : 1.15
    );
  }

  // ------------------------------------------------------------
  // Scene layers.
  // All VGroups are assembled before appearing on screen.
  // No already-visible objects are wrapped in new groups.
  // Every play() is awaited before the next play() begins.
  // ------------------------------------------------------------

  const layers = new Map();

  function put(key, obj) {
    const a = [];

    if (layers.has(key)) {
      a.push(
        new M.FadeOut(layers.get(key))
      );
    }

    layers.set(key, obj);
    a.push(new M.FadeIn(obj));

    return a;
  }

  function drop(...keys) {
    const a = [];

    for (const key of keys) {
      if (!layers.has(key)) continue;

      a.push(
        new M.FadeOut(layers.get(key))
      );

      layers.delete(key);
    }

    return a;
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

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
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
  // Shared juice bottles and weighing scale.
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
      halo,
      body,
      juice,
      neck,
      cap
    ];

    if (label) {
      const backing = new M.Rectangle({
        width: 0.48 * s,
        height: 0.24 * s,
        color: C.ink,
        strokeWidth: 1
      });

      backing.setFill(C.card, 0.95);

      backing.moveTo([
        x,
        y - 0.06 * s,
        0
      ]);

      parts.push(
        backing,

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
        x, y, w, h,
        color, C.card, 0.85,
        0.13 * s
      )
    ];

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const fill =
        0.65 + ((i * 7 + 2) % 5) * 0.035;

      parts.push(
        bottle(
          x + (col - (cols - 1) / 2) * dx,
          y + ((rows - 1) / 2 - row) * dy
            - 0.04 * s,
          0.32 * s,
          fill,
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
        y + h / 2 + 0.25,
        true,
        w + 0.45
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Alarm symbol.
  //
  // Red: alarm on a healthy machine.
  // Green: correctly detected real drift.
  // Muted / red: silence when drift is actually present.
  // ------------------------------------------------------------

  function alarm(
    x, y,
    active = true,
    color = RED,
    s = 1
  ) {
    const halo = new M.Circle({
      radius: 0.75 * s,
      color,
      strokeWidth: 1
    });

    halo.setFill(
      color,
      active ? 0.10 : 0.04
    );

    halo.moveTo([x, y, 0]);

    const dome = rect(
      x, y,
      0.86 * s,
      0.90 * s,
      color, color,
      active ? 0.42 : 0.08,
      0.23 * s
    );

    const foot = rect(
      x,
      y - 0.51 * s,
      1.14 * s,
      0.20 * s,
      color, C.card, 1,
      0.05 * s
    );

    const parts = [
      halo,
      dome,
      foot,

      txt(
        active ? '!' : '—',
        35 * s,
        color,
        x, y,
        true,
        0.75 * s
      )
    ];

    if (active) {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * i / 6;

        parts.push(
          line(
            x + 0.86 * s * Math.cos(a),
            y + 0.86 * s * Math.sin(a),
            x + 1.04 * s * Math.cos(a),
            y + 1.04 * s * Math.sin(a),
            color,
            3
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Factory machine.
  // A long-run mean of 502 g is a hypothetical true drift,
  // distinct from the observed morning batch mean of 502 g.
  // ------------------------------------------------------------

  function machine(trueMean = TARGET) {
    const x = CX;
    const y = P ? -0.65 : -0.18;

    const tx = x - 1.85;
    const beltY = y - 1.65;
    const by = y - 0.96;

    const drift = trueMean - TARGET;

    const color = drift === 0
      ? C.cyan
      : C.violet;

    const parts = [
      rect(
        tx,
        y + 0.70,
        1.55,
        0.90,
        color, C.card, 0.95
      ),

      txt(
        'JUICE',
        19,
        color,
        tx,
        y + 0.70,
        true
      ),

      rect(
        tx,
        y + 0.02,
        0.24,
        0.40,
        C.muted, C.card, 1,
        0.04
      ),

      line(
        tx,
        y - 0.18,
        tx,
        y - 0.32,
        color,
        5
      ),

      line(
        tx - 1.0,
        y + 0.75,
        tx - 1.0,
        beltY,
        C.muted,
        4
      ),

      line(
        tx - 1.0,
        y + 0.75,
        tx - 0.78,
        y + 0.75,
        C.muted,
        4
      ),

      rect(
        x,
        beltY,
        6.10,
        0.22,
        C.muted, C.card, 1,
        0.06
      )
    ];

    const fills = [
      0.68,
      0.77,
      0.72,
      0.65
    ];

    for (let i = 0; i < 4; i++) {
      const fill = Math.min(
        0.93,
        fills[i] + drift * 0.04
      );

      parts.push(
        bottle(
          tx + i * 1.25,
          by,
          0.86,
          fill,
          '500 g',
          color
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
        `TRUE MEAN = ${trueMean} g`,
        drift === 0 ? GOLD : C.violet,
        x + 1.05,
        y + 0.80
      ),

      txt(
        drift === 0
          ? 'No long-run drift'
          : `${signed(drift)} g of real drift`,
        19,
        drift === 0 ? GOLD : C.violet,
        x + 1.05,
        y + 0.22,
        true,
        3.6
      ),

      txt(
        'Known bottle SD = 4 g',
        17,
        C.muted,
        x,
        beltY - 0.45
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // The target and the hypothetical true mean.
  // ------------------------------------------------------------

  function meanShiftPicture(trueMean = 502) {
    const w = P ? 6.40 : 6.75;
    const y = P ? -2.70 : -1.55;

    const gx = v =>
      CX - w / 2 +
      (v - 497) / 7 * w;

    const parts = [
      line(
        gx(497), y,
        gx(504), y,
        C.muted, 2.5
      )
    ];

    for (let v = 497; v <= 504; v++) {
      parts.push(
        line(
          gx(v), y - 0.08,
          gx(v), y + 0.08,
          C.muted
        ),

        txt(
          String(v),
          17,
          v === TARGET ? GOLD : C.muted,
          gx(v),
          y - 0.30,
          true
        )
      );
    }

    parts.push(
      line(
        gx(TARGET), y,
        gx(TARGET), y + 2.10,
        GOLD, 3
      ),

      tag(
        'TARGET 500 g',
        GOLD,
        gx(TARGET) - 0.35,
        y + 2.39
      ),

      line(
        gx(trueMean), y,
        gx(trueMean), y + 1.35,
        C.violet, 3
      ),

      glowDot(
        gx(trueMean),
        y + 0.06,
        C.violet,
        0.12
      ),

      tag(
        `TRUE MEAN ${trueMean} g`,
        C.violet,
        gx(trueMean),
        y + 1.66
      ),

      arrow(
        gx(TARGET) + 0.06,
        y + 0.83,
        gx(trueMean) - 0.06,
        y + 0.83,
        C.violet,
        3.5
      ),

      txt(
        `${signed(trueMean - TARGET)} g`,
        21,
        C.violet,
        (gx(TARGET) + gx(trueMean)) / 2,
        y + 1.13,
        true
      ),

      txt(
        'Long-run mean (grams)',
        17,
        C.muted,
        CX,
        y - 0.75
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // One inspection of a drifted machine.
  // ------------------------------------------------------------

  function inspectionPicture(
    display = '? g',
    trueMean = 502
  ) {
    const x = CX;
    const y = CY;

    const tx = x - 1.80;
    const sx = x + 1.70;

    return new M.VGroup(
      tray(
        tx,
        y + 0.12,
        16, 4,
        0.95
      ),

      arrow(
        tx + 1.28,
        y + 0.12,
        sx - 1.12,
        y + 0.12,
        C.cyan,
        3
      ),

      scale(
        sx,
        y - 0.20,
        1.00,
        display
      ),

      bottle(
        sx,
        y + 0.82,
        0.80,
        trueMean > TARGET ? 0.82 : 0.72,
        '500 g',
        C.cyan
      ),

      txt(
        'Find the sample mean',
        18,
        C.ink,
        sx,
        y - 0.89,
        false,
        3.30
      ),

      tag(
        'ONE INSPECTION → ONE z',
        C.cyan,
        x,
        y - 1.82
      )
    );
  }

  // ------------------------------------------------------------
  // Standard-error ruler.
  // Still measured from the ORIGINAL null target of 500 g.
  // A drifted machine does not change the definition of z.
  // ------------------------------------------------------------

  function rulerPicture() {
    const w = P ? 6.45 : 6.80;
    const y = BASE;

    const gx = v =>
      CX - w / 2 +
      (v - 497) / 7 * w;

    const zy = y + 0.82;

    const parts = [
      line(
        gx(497), y,
        gx(504), y,
        C.muted, 2.5
      ),

      line(
        gx(497), zy,
        gx(504), zy,
        C.cyan, 2.5
      ),

      line(
        gx(500), y,
        gx(500), y + 2.05,
        GOLD, 3
      )
    ];

    for (let v = 497; v <= 504; v++) {
      const z = v - TARGET;

      parts.push(
        line(
          gx(v), y - 0.08,
          gx(v), y + 0.08,
          C.muted
        ),

        txt(
          String(v),
          17, C.muted,
          gx(v), y - 0.30,
          true
        ),

        line(
          gx(v), zy - 0.08,
          gx(v), zy + 0.08,
          C.cyan
        ),

        txt(
          signed(z),
          18,
          z === 0 ? GOLD : C.cyan,
          gx(v), zy + 0.26,
          true
        )
      );
    }

    parts.push(
      arrow(
        gx(500) + 0.04,
        y + 1.48,
        gx(501) - 0.04,
        y + 1.48,
        C.green,
        3
      ),

      txt(
        '1 SE',
        18,
        C.green,
        gx(500.5),
        y + 1.77,
        true
      ),

      tag(
        'TARGET',
        GOLD,
        gx(500),
        y + 2.34
      ),

      txt(
        '1 standard error = 1 gram',
        20,
        C.green,
        CX,
        P ? 0.72 : 1.13
      ),

      txt(
        'Batch mean (grams)',
        17,
        C.muted,
        CX,
        y - 0.75
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Common normal-curve coordinates.
  //
  // Under H₀:             Z ~ Normal(0, 1).
  // At true mean 502 g:   Z ~ Normal(2, 1).
  // At true mean 503 g:   Z ~ Normal(3, 1).
  //
  // The curves have equal spread and equal height.
  // Only the centre changes.
  // ------------------------------------------------------------

  const ZLO = -4.5;
  const ZHI = 6.5;

  const ZW = P ? 6.65 : 7.10;
  const H = P ? 2.65 : 2.18;

  const zx = z =>
    CX - ZW / 2 +
    (z - ZLO) / (ZHI - ZLO) * ZW;

  const density = (z, mu = 0) =>
    Math.exp(
      -0.5 * (z - mu) ** 2
    );

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
      const color = z === 0
        ? GOLD
        : C.muted;

      parts.push(
        line(
          zx(z), BASE - 0.075,
          zx(z), BASE + 0.075,
          color
        ),

        txt(
          signed(z),
          P ? 16 : 17,
          color,
          zx(z),
          BASE - 0.30,
          true
        )
      );
    }

    parts.push(
      txt(
        'z: standard errors from the original target',
        17,
        C.muted,
        CX,
        BASE - 0.74,
        false,
        ZW
      )
    );

    return new M.VGroup(...parts);
  }

  function normalOutline(
    mu,
    color = C.cyan,
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
          color,
          sw
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function normalArea(
    mu,
    lo,
    hi,
    color,
    opacity = 0.20
  ) {
    const parts = [];

    const a0 = Math.max(lo, ZLO);
    const b0 = Math.min(hi, ZHI);

    if (b0 <= a0) {
      return new M.VGroup();
    }

    const n = Math.max(
      12,
      Math.ceil((b0 - a0) * 18)
    );

    const step = (b0 - a0) / n;

    for (let i = 0; i < n; i++) {
      const a = a0 + step * i;
      const b = a + step;

      const mid = (a + b) / 2;

      const h = Math.max(
        0.001,
        H * density(mid, mu)
      );

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

  // ------------------------------------------------------------
  // Original target line and shifted true-mean line.
  // Gold always denotes the original null target.
  // Violet denotes the drifted distribution.
  // ------------------------------------------------------------

  function targetLine(
    showLabel = true
  ) {
    const parts = [
      line(
        zx(0), BASE,
        zx(0), BASE + H + 0.06,
        GOLD, 3
      )
    ];

    if (showLabel) {
      parts.push(
        txt(
          '500 g target',
          17,
          GOLD,
          zx(0),
          BASE + H + 0.72,
          true,
          2.20
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function centreLine(mu) {
    const color = mu === 0
      ? GOLD
      : C.violet;

    return new M.VGroup(
      dashed(
        zx(mu), BASE,
        zx(mu), BASE + H,
        color
      ),

      glowDot(
        zx(mu),
        BASE + H,
        color,
        0.095
      ),

      txt(
        mu === 0 ? ' ' : `${TARGET + mu * SE} g`,
        19,
        color,
        zx(mu) + 0.18,
        BASE + H + 0.72,
        true,
        1.80
      )
    );
  }

  // ------------------------------------------------------------
  // Fixed test cut-offs.
  // They do not move when the machine's true mean changes.
  // ------------------------------------------------------------

  function cutLines(cut = CUT) {
    const label = cut === CUT
      ? '1.96'
      : '2.576';

    const parts = [];

    [-cut, cut].forEach(z => {
      const color = GOLD;
      const top = BASE + H + 0.05;

      parts.push(
        dashed(
          zx(z), BASE,
          zx(z), top,
          color
        ),

        glowDot(
          zx(z),
          BASE + 0.035,
          color,
          0.065
        ),

        txt(
          `${z < 0 ? '−' : '+'}${label}`,
          17,
          color,
          zx(z) + (z > 0 ? -0.37 : 0),
          top + 0.30,
          true,
          1.55
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function cutoffBaseLabels(cut = CUT) {
    return new M.VGroup(
      txt(
        cut === CUT ? '−1.96' : '−2.576',
        16,
        GOLD,
        zx(-cut),
        BASE + 0.25,
        true
      ),

      txt(
        cut === CUT ? '+1.96' : '+2.576',
        16,
        GOLD,
        zx(cut),
        BASE + 0.25,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Null graph: false alarms.
  // Red shaded area = rejecting H₀ when H₀ is true.
  // ------------------------------------------------------------

  function nullGraph(
    cut = CUT,
    showLabels = true
  ) {
    const parts = [
      normalArea(
        0,
        ZLO,
        ZHI,
        C.cyan,
        0.13
      ),

      normalArea(
        0,
        ZLO,
        -cut,
        RED,
        0.85
      ),

      normalArea(
        0,
        cut,
        ZHI,
        RED,
        0.85
      ),

      normalOutline(
        0,
        C.cyan
      ),

      normalAxis(),
      targetLine(),
      cutLines(cut)
    ];

    if (showLabels) {
      parts.push(
        tag(
          cut === CUT
            ? 'FALSE ALARMS = 5%'
            : 'FALSE ALARMS = 1%',
          RED,
          CX,
          P ? -4.75 : -3.2
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Shifted normal distribution.
  //
  // mode = "plain": no decisions coloured.
  // mode = "power": green alarm regions.
  // mode = "both": green detection, red missed drift.
  //
  // With a false H₀, an alarm is a CORRECT decision.
  // With a false H₀, silence is a Type II error.
  // ------------------------------------------------------------

  function driftGraph(
    mu = DRIFT_2,
    mode = 'plain',
    cut = CUT,
    showNull = false,
    showCuts = true
  ) {
    const parts = [];

    if (showNull) {
      parts.push(
        normalArea(
          0,
          ZLO,
          ZHI,
          C.cyan,
          0.07
        ),

        normalOutline(
          0,
          C.cyan,
          1.8
        )
      );
    }

    parts.push(
      normalArea(
        mu,
        ZLO,
        ZHI,
        C.violet,
        0.15
      )
    );

    if (mode === 'both') {
      parts.push(
        normalArea(
          mu,
          -cut,
          cut,
          RED,
          0.67
        )
      );
    }

    if (
      mode === 'both' ||
      mode === 'power'
    ) {
      parts.push(
        normalArea(
          mu,
          ZLO,
          -cut,
          C.green,
          0.92
        ),

        normalArea(
          mu,
          cut,
          ZHI,
          C.green,
          0.82
        )
      );
    }

    parts.push(
      normalOutline(
        mu,
        C.violet,
        3
      ),

      normalAxis(),
      targetLine(true),
      centreLine(mu)
    );

    if (showCuts) {
      parts.push(
        cutLines(cut)
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Moving the sampling distribution.
  // Same shape and spread, different centre.
  // ------------------------------------------------------------

  function shiftArrow(mu = DRIFT_2) {
    const y = BASE + H + 0.3;

    return new M.VGroup(
      arrow(
        zx(0) + 0.05,
        y,
        zx(mu) - 0.05,
        y,
        C.violet,
        3.5
      ),

      txt(
        `SHIFT ${signed(mu)}`,
        18,
        C.violet,
        zx(mu) + 0.95,
        y,
        true,
        1.6
      )
    );
  }

  function centreExplanation(mu) {
    return new M.VGroup(
      txt(
        'Same spread, shifted centre',
        P ? 20 : 19,
        C.violet,
        CX,
        BASE - 1.2,
        false,
        ZW
      ),

      txt(
        `Centre of z = ${signed(mu)}`,
        19,
        C.violet,
        zx(mu) + (P ? 1.42 : 1.45),
        BASE + H * 1.0,
        true,
        P ? 2.2 : 2.4
      )
    );
  }

  // ------------------------------------------------------------
  // Zoomed view of +1.96 and +2.
  // The original graph remains at its correct scale.
  // The inset explicitly magnifies their small separation.
  // ------------------------------------------------------------

  function cutoffZoom() {
    const x = CX - 1.70;
    const y = P ? -0.10 : 0.15;

    const w = P ? 3.05 : 3.10;
    const h = P ? 1.75 : 1.50;

    const min = 1.88;
    const max = 2.08;

    const ix = z =>
      x - w / 2 + 0.30 +
      (z - min) / (max - min) *
      (w - 0.60);

    const yy = y - 0.12;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        GOLD, C.card, 0.98
      ),

      txt(
        'MAGNIFIED',
        15,
        C.muted,
        x,
        y + h / 2 - 0.26,
        true,
        w - 0.35
      ),

      line(
        ix(min), yy,
        ix(max), yy,
        C.muted,
        2
      ),

      line(
        ix(CUT),
        yy - 0.18,
        ix(CUT),
        yy + 0.29,
        GOLD,
        3
      ),

      line(
        ix(2),
        yy - 0.18,
        ix(2),
        yy + 0.29,
        C.violet,
        3
      ),

      txt(
        '1.96',
        17,
        GOLD,
        ix(CUT) - 0.18,
        yy - 0.36,
        true
      ),

      txt(
        '2.00',
        17,
        C.violet,
        ix(2) + 0.18,
        yy + 0.46,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Detection labels for the shifted distribution.
  // The tiny far-left alarm region is included in power.
  // ------------------------------------------------------------

  function powerLabel(
    mu,
    power,
    cut = CUT
  ) {
    const x = zx(
      Math.min(5.50, mu + 1.28)
    );

    const y = BASE + H * 0.62;

    return new M.VGroup(
      tag(
        `${Math.round(power * 100)}% CAUGHT`,
        C.green,
        x,
        y
      ),

      arrow(
        x,
        y - 0.26,
        zx(Math.max(cut + 0.30, mu + 0.35)),
        BASE + H * density(
          Math.max(cut + 0.30, mu + 0.35),
          mu
        ) * 0.45,
        C.green,
        2.4
      )
    );
  }

  function betaLabel(
    mu,
    beta
  ) {
    const x = zx(
      Math.min(0.35, mu - 1.60)
    );

    const y = BASE + H * 0.43;

    return new M.VGroup(
      tag(
        `${Math.round(beta * 100)}% MISSED`,
        RED,
        x,
        y
      ),

      arrow(
        x + 0.15,
        y - 0.25,
        zx(Math.min(CUT - 0.30, mu - 0.75)),
        BASE + H * density(
          Math.min(CUT - 0.30, mu - 0.75),
          mu
        ) * 0.43,
        RED,
        2.4
      )
    );
  }

  function alarmRegionsLabels() {
    return new M.VGroup(
      txt(
        'ALARM',
        17,
        C.green,
        zx(-3.15),
        BASE + 0.68,
        true
      ),

      txt(
        'ALARM',
        17,
        C.green,
        zx(4.85),
        BASE + 0.68,
        true
      ),

      txt(
        'NO ALARM',
        17,
        RED,
        zx(-0.22),
        BASE + 0.65,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Seeded normal simulation.
  // z = 2 + standard normal noise when true mean is 502 g.
  // ------------------------------------------------------------

  let rngState = 2039 >>> 0;

  function uniform() {
    rngState = (
      Math.imul(1664525, rngState) +
      1013904223
    ) >>> 0;

    return (
      rngState + 0.5
    ) / 4294967296;
  }

  function standardNormal() {
    const u1 = uniform();
    const u2 = uniform();

    return (
      Math.sqrt(-2 * Math.log(u1)) *
      Math.cos(2 * Math.PI * u2)
    );
  }

  const simulations = Array.from(
    { length: SIM_N },
    (_, i) => {
      const z =
        DRIFT_2 / SE +
        standardNormal();

      return {
        index: i,
        z,
        mean: TARGET + z * SE,
        alarm: Math.abs(z) > CUT
      };
    }
  );

  const detected = simulations.filter(
    d => d.alarm
  );

  const missed = simulations.filter(
    d => !d.alarm
  );

  const DETECTED_COUNT = detected.length;
  const MISSED_COUNT = missed.length;

  const OBS_POWER =
    DETECTED_COUNT / SIM_N;

  // ------------------------------------------------------------
  // Small illustrative dot hill.
  // Deterministic subsample of the actual simulation.
  // The full 1,000-result grid follows.
  // ------------------------------------------------------------

  function dotHill(
    count = 100,
    colourDecisions = false
  ) {
    const bins = new Map();
    const pitch = P ? 0.13 : 0.105;
    const radius = P ? 0.052 : 0.045;

    const parts = [];

    simulations.slice(0, count).forEach(d => {
      const bin =
        Math.round(d.z / 0.40) * 0.40;

      if (bin < ZLO || bin > ZHI) return;

      const key = bin.toFixed(2);
      const level = bins.get(key) || 0;

      bins.set(key, level + 1);

      const color = colourDecisions
        ? (d.alarm ? C.green : RED)
        : C.violet;

      parts.push(
        dot(
          zx(bin),
          BASE + 0.12 + level * pitch,
          color,
          radius,
          0.95
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Thousand-inspection grid.
  // 40 columns × 25 rows = 1,000 individual inspections.
  // Green dots = real drift correctly detected.
  // Red dots = missed real drift.
  // ------------------------------------------------------------

  const GC = 40;
  const GR = 25;

  const GDX = P ? 0.156 : 0.165;
  const GDY = P ? 0.145 : 0.105;

  const GY = P ? -1.65 : -0.75;
  const GRAD = P ? 0.044 : 0.038;

  function gridPosition(i) {
    const col = i % GC;
    const row = Math.floor(i / GC);

    return [
      CX + (col - (GC - 1) / 2) * GDX,
      GY + ((GR - 1) / 2 - row) * GDY,
      0
    ];
  }

  function simulationDot(
    d,
    showMisses = false
  ) {
    const color = d.alarm
      ? C.green
      : (showMisses ? RED : C.muted);

    const p = gridPosition(d.index);

    const obj = new M.Dot({
      point: p,
      radius: d.alarm
        ? GRAD * 1.08
        : GRAD,
      color
    });

    obj.setFill(
      color,
      d.alarm || showMisses
        ? 1
        : 0.38
    );

    return obj;
  }

  function simulationChunk(
    start,
    end,
    showMisses = false
  ) {
    return new M.VGroup(
      ...simulations
        .slice(start, end)
        .map(d =>
          simulationDot(d, showMisses)
        )
    );
  }

  function gridFrame(
    showMisses = false
  ) {
    const w = GC * GDX + 0.25;
    const h = GR * GDY + 0.25;

    const ly =
      GY - h / 2 - 0.28;

    return new M.VGroup(
      rect(
        CX, GY,
        w, h,
        C.muted, C.card, 0.75,
        0.12
      ),

      glowDot(
        CX - 2.60,
        ly,
        C.green,
        0.065
      ),

      txt(
        'Drift caught',
        17,
        C.green,
        CX - 1.50,
        ly
      ),

      glowDot(
        CX + 0.35,
        ly,
        showMisses ? RED : C.muted,
        0.065
      ),

      txt(
        showMisses
          ? 'Drift missed'
          : 'No alarm',
        17,
        showMisses ? RED : C.muted,
        CX + 1.53,
        ly
      )
    );
  }

  function simulationCounter(
    count,
    showMisses = false
  ) {
    const alarmCount = simulations
      .slice(0, count)
      .filter(d => d.alarm)
      .length;

    const missCount =
      count - alarmCount;

    const y =
      GY + GR * GDY / 2 + 0.40;

    return new M.VGroup(
      txt(
        count < SIM_N
          ? `${count} / 1,000`
          : '1,000 INSPECTIONS',
        P ? 20 : 19,
        C.cyan,
        CX - 1.65,
        y,
        true,
        3.1
      ),

      txt(
        `${alarmCount} CAUGHT`,
        P ? 20 : 19,
        C.green,
        CX + 1.50,
        y,
        true,
        3.0
      ),

      ...(showMisses
        ? [
            txt(
              `${missCount} MISSED`,
              18,
              RED,
              CX,
              GY - GR * GDY / 2 - 0.72,
              true
            )
          ]
        : [])
    );
  }

  function simulationGrid(
    showMisses = false
  ) {
    return new M.VGroup(
      gridFrame(showMisses),

      simulationChunk(
        0,
        SIM_N,
        showMisses
      ),

      simulationCounter(
        SIM_N,
        showMisses
      )
    );
  }

  // ------------------------------------------------------------
  // Proportional detection / missed-drift bar.
  // Uses theoretical probabilities rather than simulated counts.
  // ------------------------------------------------------------

  function powerBar(
    power = POWER_2,
    showMisses = true,
    drift = DRIFT_2
  ) {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.70;
    const h = P ? 0.92 : 0.84;

    const left = x - w / 2;

    const caughtW = w * power;
    const missedW = w * (1 - power);

    const caughtX =
      left + caughtW / 2;

    const missedX =
      left + caughtW + missedW / 2;

    const parts = [
      block(
        caughtX, y,
        caughtW, h,
        C.green, 0.78
      ),

      block(
        missedX, y,
        missedW, h,
        showMisses ? RED : C.muted,
        showMisses ? 0.78 : 0.15
      ),

      txt(
        `TRUE DRIFT = +${drift} g`,
        22,
        C.violet,
        x,
        y + 1.32,
        true
      ),

      txt(
        `${Math.round(power * 100)}%`,
        30,
        C.ink,
        caughtX,
        y,
        true,
        caughtW - 0.15
      ),

      txt(
        'DRIFT CAUGHT',
        17,
        C.green,
        caughtX,
        y - 0.78,
        true,
        Math.max(1.0, caughtW - 0.05)
      ),

      txt(
        'Theoretical long-run probabilities',
        17,
        C.muted,
        x,
        y - 1.48
      )
    ];

    if (showMisses) {
      parts.push(
        txt(
          `${Math.round((1 - power) * 100)}%`,
          30,
          C.ink,
          missedX,
          y,
          true,
          Math.max(0.45, missedW - 0.12)
        ),

        txt(
          'MISSED',
          17,
          RED,
          missedX,
          y - 0.78,
          true,
          Math.max(0.65, missedW)
        )
      );
    } else {
      parts.push(
        txt(
          '?',
          30,
          C.muted,
          missedX,
          y,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Type II error definition.
  // Truth and decision are distinct.
  // ------------------------------------------------------------

  function typeTwoCard(
    showName = true
  ) {
    const x = CX;
    const y = CY;

    const w = P ? 6.45 : 6.75;
    const h = P ? 4.25 : 3.65;

    return new M.VGroup(
      rect(
        x, y, w, h,
        RED, C.card, 0.95
      ),

      txt(
        showName
          ? 'TYPE II ERROR'
          : 'A MISSED DRIFT',
        27,
        RED,
        x,
        y + h / 2 - 0.43,
        true,
        w - 0.5
      ),

      txt(
        'TRUTH',
        17,
        C.muted,
        x - 1.60,
        y + 0.70,
        true
      ),

      txt(
        'H₀ IS FALSE',
        21,
        C.violet,
        x + 1.30,
        y + 0.70,
        true,
        3.0
      ),

      line(
        x - w / 2 + 0.40,
        y + 0.28,
        x + w / 2 - 0.40,
        y + 0.28,
        C.muted,
        1.5
      ),

      txt(
        'DECISION',
        17,
        C.muted,
        x - 1.60,
        y - 0.13,
        true
      ),

      txt(
        'DO NOT REJECT H₀',
        20,
        RED,
        x + 1.30,
        y - 0.13,
        true,
        3.25
      ),

      alarm(
        x - 1.55,
        y - 1.02,
        false,
        RED,
        0.52
      ),

      txt(
        'Machine has drifted,',
        19,
        C.ink,
        x + 0.85,
        y - 0.77,
        false,
        3.70
      ),

      txt(
        'but the test stays silent.',
        19,
        RED,
        x + 0.85,
        y - 1.16,
        false,
        3.70
      )
    );
  }

  // ------------------------------------------------------------
  // Power definition.
  // Correctly rejecting a false null.
  // ------------------------------------------------------------

  function powerCard() {
    const x = CX;
    const y = CY;

    const w = P ? 6.45 : 6.75;
    const h = P ? 4.20 : 3.65;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        C.green,
        C.card,
        0.95
      ),

      txt(
        'STATISTICAL POWER',
        25,
        C.green,
        x,
        y + h / 2 - 0.42,
        true,
        w - 0.50
      ),

      bottle(
        x - 1.65,
        y + 0.18,
        1.10,
        0.86,
        '500 g',
        C.violet
      ),

      alarm(
        x + 1.65,
        y + 0.20,
        true,
        C.green,
        0.77
      ),

      arrow(
        x - 0.90,
        y + 0.20,
        x + 0.70,
        y + 0.20,
        C.green,
        3
      ),

      txt(
        'Real drift',
        20,
        C.violet,
        x - 1.65,
        y - 0.75
      ),

      txt(
        'Alarm',
        20,
        C.green,
        x + 1.65,
        y - 0.75
      ),

      txt(
        'Chance of catching a real drift',
        22,
        C.green,
        x,
        y - h / 2 + 0.30,
        false,
        w - 0.5
      )
    );
  }

  // ------------------------------------------------------------
  // Power and beta are complements.
  // ------------------------------------------------------------

  function complementPicture() {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 0.90 : 0.82;

    const left = x - w / 2;

    const pw = w * POWER_2;
    const bw = w * BETA_2;

    const px = left + pw / 2;
    const bx = left + pw + bw / 2;

    return new M.VGroup(
      heading(
        'Every inspection has one of two outcomes'
      ),

      block(
        px, y,
        pw, h,
        C.green,
        0.75
      ),

      block(
        bx, y,
        bw, h,
        RED,
        0.75
      ),

      txt(
        'POWER',
        22,
        C.bg,
        px, y,
        true,
        pw - 0.18
      ),

      txt(
        'MISS',
        22,
        C.bg,
        bx, y,
        true
      ),

      txt(
        'Correct detection',
        19,
        C.green,
        px,
        y - 0.76,
        false,
        pw - 0.05
      ),

      txt(
        'Missed drift',
        19,
        RED,
        bx,
        y - 0.76,
        false,
        bw - 0.05
      ),

      line(
        left,
        y + 0.78,
        left + w,
        y + 0.78,
        GOLD,
        2.5
      ),

      line(
        left,
        y + 0.68,
        left,
        y + 0.88,
        GOLD,
        2
      ),

      line(
        left + w,
        y + 0.68,
        left + w,
        y + 0.88,
        GOLD,
        2
      ),

      txt(
        '100%',
        20,
        GOLD,
        x,
        y + 1.10,
        true
      ),

      txt(
        'Power + miss chance = 1',
        24,
        GOLD,
        x,
        y - 1.48,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Coin-flip analogy.
  // The coin represents a 50/50 benchmark, not the test itself.
  // ------------------------------------------------------------

  function coinComparison() {
    const x = CX;
    const y = CY;

    const r = P ? 0.62 : 0.55;
    const dx = P ? 1.60 : 1.72;

    const coinX = x - dx;
    const testX = x + dx;

    const coin = new M.Circle({
      radius: r,
      color: GOLD,
      strokeWidth: 3
    });

    coin.setFill(GOLD, 0.20);
    coin.moveTo([coinX, y + 0.28, 0]);

    const parts = [
      coin,

      txt(
        '½',
        34,
        GOLD,
        coinX,
        y + 0.28,
        true
      ),

      txt(
        'FAIR COIN',
        19,
        GOLD,
        coinX,
        y + 1.28,
        true
      ),

      txt(
        '50%',
        32,
        GOLD,
        coinX,
        y - 0.75,
        true
      ),

      alarm(
        testX,
        y + 0.28,
        true,
        C.green,
        0.60
      ),

      txt(
        'OUR TEST',
        19,
        C.green,
        testX,
        y + 1.28,
        true
      ),

      txt(
        '52%',
        32,
        C.green,
        testX,
        y - 0.75,
        true
      ),

      txt(
        'Only a little better than 50/50',
        21,
        C.ink,
        x,
        y - 1.48
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Power comparison for the two stated true drifts.
  // Bar lengths represent theoretical probabilities.
  // ------------------------------------------------------------

  function powerComparison(
    showThree = true
  ) {
    const w = P ? 6.25 : 6.65;
    const h = P ? 0.46 : 0.40;

    const top = P ? -0.05 : 0.47;
    const gap = P ? 2.10 : 1.55;

    const left = CX - w / 2;

    const cases = [
      {
        drift: 2,
        mean: 502,
        power: POWER_2
      },

      {
        drift: 3,
        mean: 503,
        power: POWER_3
      }
    ];

    const parts = [];

    cases.slice(
      0,
      showThree ? 2 : 1
    ).forEach((d, i) => {
      const y = top - i * gap;

      const pw = w * d.power;
      const bw = w * (1 - d.power);

      parts.push(
        txt(
          `TRUE MEAN ${d.mean} g — DRIFT +${d.drift} g`,
          19,
          C.violet,
          CX,
          y + 0.61,
          true,
          w
        ),

        block(
          left + pw / 2,
          y,
          pw,
          h,
          C.green,
          0.85
        ),

        block(
          left + pw + bw / 2,
          y,
          bw,
          h,
          RED,
          0.72
        ),

        txt(
          `${Math.round(d.power * 100)}% caught`,
          18,
          C.green,
          left + pw / 2,
          y - 0.48,
          false,
          pw - 0.05
        ),

        txt(
          `${Math.round((1 - d.power) * 100)}%`,
          17,
          RED,
          left + pw + bw / 2,
          y - 0.48,
          true,
          Math.max(0.65, bw)
        )
      );
    });

    const lastY =
      top - (showThree ? gap : 0);

    parts.push(
      txt(
        'Same test, same 16 bottles, same α = 0.05',
        17,
        C.muted,
        CX,
        lastY - 1.0,
        false,
        w
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Normal CDF approximation.
  // Used for the illustrative continuous power curve and
  // stricter-alpha comparison.
  // Accuracy is sufficient for the displayed rounding.
  // ------------------------------------------------------------

  function normalCDF(x) {
    const a = Math.abs(x);

    const t =
      1 / (1 + 0.2316419 * a);

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

    return x >= 0
      ? 1 - q
      : q;
  }

  function theoreticalPower(
    drift,
    cut = CUT,
    se = SE
  ) {
    const mu = drift / se;

    return (
      normalCDF(-cut - mu) +
      1 - normalCDF(cut - mu)
    );
  }

  const STRICT_POWER_2 =
    theoreticalPower(
      DRIFT_2,
      STRICT_CUT,
      SE
    );

  const STRICT_BETA_2 =
    1 - STRICT_POWER_2;

  // ------------------------------------------------------------
  // Power as a function of true drift.
  // Not one single universal number.
  // Symmetric for upward and downward drifts in this test.
  // ------------------------------------------------------------

  function powerCurve(
    markTwo = true,
    markThree = true
  ) {
    const w = P ? 6.05 : 6.35;
    const h = P ? 3.60 : 2.70;

    const y = BASE;
    const left = CX - w / 2 + 0.22;

    const gx = d =>
      left + d / 5 * w;

    const gy = p =>
      y + p * h;

    const parts = [
      line(
        gx(0), gy(0),
        gx(5), gy(0),
        C.muted,
        2.5
      ),

      line(
        gx(0), gy(0),
        gx(0), gy(1),
        C.muted,
        2.5
      )
    ];

    [0, 0.25, 0.5, 0.75, 1].forEach(p => {
      parts.push(
        dashed(
          gx(0),
          gy(p),
          gx(5),
          gy(p),
          C.muted
        ),

        txt(
          `${Math.round(p * 100)}%`,
          15,
          C.muted,
          gx(0) - 0.32,
          gy(p),
          true
        )
      );
    });

    for (let d = 0; d <= 5; d++) {
      parts.push(
        line(
          gx(d),
          gy(0) - 0.07,
          gx(d),
          gy(0) + 0.07,
          C.muted
        ),

        txt(
          String(d),
          16,
          C.muted,
          gx(d),
          gy(0) - 0.30,
          true
        )
      );
    }

    for (let i = 0; i < 100; i++) {
      const a = i / 100 * 5;
      const b = (i + 1) / 100 * 5;

      parts.push(
        line(
          gx(a),
          gy(theoreticalPower(a)),
          gx(b),
          gy(theoreticalPower(b)),
          C.green,
          3
        )
      );
    }

    // At zero drift, the rejection chance is alpha,
    // rather than detection of a real drift.

    parts.push(
      glowDot(
        gx(0),
        gy(ALPHA),
        GOLD,
        0.075
      ),

      txt(
        'α = 5%',
        16,
        GOLD,
        gx(0) + 0.65,
        gy(ALPHA) + 0.24,
        true
      )
    );

    function mark(d, p, label, offsetX = 0) {
      return new M.VGroup(
        dashed(
          gx(d),
          gy(0),
          gx(d),
          gy(p),
          C.violet
        ),

        glowDot(
          gx(d),
          gy(p),
          C.green,
          0.11
        ),

        tag(
          label,
          C.green,
          gx(d) + offsetX,
          gy(p) + 0.38
        )
      );
    }

    if (markTwo) {
      parts.push(
        mark(
          2,
          POWER_2,
          '52%',
          -0.22
        )
      );
    }

    if (markThree) {
      parts.push(
        mark(
          3,
          POWER_3,
          '85%',
          0.30
        )
      );
    }

    parts.push(
      txt(
        'True drift size (grams)',
        17,
        C.muted,
        CX,
        y - 0.75
      ),

      txt(
        'Chance of rejecting H₀',
        19,
        C.green,
        P ? CX : CX - 1.7,
        P ? 1.04 : 1.16
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // A test as a detector of real problems.
  // ------------------------------------------------------------

  function detectorPicture(
    lowPower = false
  ) {
    const x = CX;
    const y = CY;

    const w = P ? 6.30 : 6.70;
    const h = P ? 3.95 : 3.45;

    const left = x - 1.85;
    const right = x + 1.85;

    const parts = [
      rect(
        x, y, w, h,
        lowPower ? RED : C.green,
        C.card,
        0.95
      ),

      txt(
        lowPower
          ? 'LOW-POWER DETECTOR'
          : 'CAN THE TEST SEE THE PROBLEM?',
        21,
        lowPower ? RED : C.green,
        x,
        y + h / 2 - 0.36,
        true,
        w - 0.5
      ),

      bottle(
        left,
        y + 0.13,
        1.15,
        0.86,
        '500 g',
        C.violet
      ),

      alarm(
        right,
        y + 0.15,
        !lowPower,
        lowPower ? C.muted : C.green,
        0.75
      ),

      arrow(
        left + 0.70,
        y + 0.15,
        right - 0.85,
        y + 0.15,
        lowPower ? RED : C.green,
        3
      ),

      txt(
        'REAL DRIFT',
        18,
        C.violet,
        left,
        y - 0.82,
        true
      ),

      txt(
        lowPower
          ? 'SILENCE'
          : 'DETECTED',
        18,
        lowPower ? RED : C.green,
        right,
        y - 0.82,
        true
      ),

      txt(
        lowPower
          ? 'The problem exists, but the test misses it.'
          : 'Power measures the chance of this detection.',
        18,
        C.ink,
        x,
        y - h / 2 + 0.28,
        false,
        w - 0.5
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Silence can arise from either a healthy machine or
  // a drifted machine. It does not establish which is true.
  // ------------------------------------------------------------

  function silentTestTrap() {
    const x = CX;
    const y = CY;

    const w = P ? 3.10 : 3.25;
    const h = P ? 3.85 : 3.35;

    const dx = P ? 1.72 : 1.82;

    const x1 = x - dx;
    const x2 = x + dx;

    const parts = [];

    [
      {
        x: x1,
        mean: 500,
        color: C.cyan,
        fill: 0.72,
        label: 'HEALTHY MACHINE',
        result: 'Correct silence',
        resultColor: C.green
      },

      {
        x: x2,
        mean: 502,
        color: C.violet,
        fill: 0.86,
        label: 'DRIFTED MACHINE',
        result: 'Missed drift',
        resultColor: RED
      }
    ].forEach(d => {
      parts.push(
        rect(
          d.x, y,
          w, h,
          d.color,
          C.card,
          0.95
        ),

        txt(
          d.label,
          17,
          d.color,
          d.x,
          y + h / 2 - 0.32,
          true,
          w - 0.25
        ),

        txt(
          `Mean = ${d.mean} g`,
          18,
          d.color,
          d.x,
          y + h / 2 - 0.74,
          true,
          w - 0.25
        ),

        bottle(
          d.x - 0.66,
          y + 0.03,
          0.82,
          d.fill,
          '500 g',
          d.color
        ),

        alarm(
          d.x + 0.66,
          y + 0.03,
          false,
          C.muted,
          0.49
        ),

        txt(
          'NO ALARM',
          20,
          C.muted,
          d.x,
          y - 0.85,
          true
        ),

        txt(
          d.result,
          18,
          d.resultColor,
          d.x,
          y - h / 2 + 0.30,
          false,
          w - 0.25
        )
      );
    });

    parts.push(
      tag(
        'SAME DECISION, DIFFERENT TRUTHS',
        GOLD,
        x,
        y - h / 2 - 0.47
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Smaller alpha pushes the cut-offs outward.
  //
  // At fixed true mean 502 g and n = 16:
  // alpha = .05 -> power ≈ .516
  // alpha = .01 -> power ≈ .282
  // ------------------------------------------------------------

  function stricterCutoffPicture() {
    const parts = [
      normalArea(
        DRIFT_2,
        ZLO,
        ZHI,
        C.violet,
        0.14
      ),

      normalArea(
        DRIFT_2,
        -STRICT_CUT,
        STRICT_CUT,
        RED,
        0.58
      ),

      normalArea(
        DRIFT_2,
        ZLO,
        -STRICT_CUT,
        C.green,
        0.88
      ),

      normalArea(
        DRIFT_2,
        STRICT_CUT,
        ZHI,
        C.green,
        0.88
      ),

      normalOutline(
        DRIFT_2,
        C.violet
      ),

      normalAxis(),
      targetLine(false),
      centreLine(DRIFT_2),

      dashed(
        zx(CUT),
        BASE,
        zx(CUT),
        BASE + H + 0.05,
        C.muted
      ),

      dashed(
        zx(-CUT),
        BASE,
        zx(-CUT),
        BASE + H * 0.78,
        C.muted
      ),

      dashed(
        zx(STRICT_CUT),
        BASE,
        zx(STRICT_CUT),
        BASE + H + 0.05,
        GOLD
      ),

      dashed(
        zx(-STRICT_CUT),
        BASE,
        zx(-STRICT_CUT),
        BASE + H * 0.78,
        GOLD
      ),

      txt(
        '+1.96',
        18,
        C.muted,
        zx(CUT) - 0.42,
        BASE + H + 0.3,
        true
      ),

      txt(
        '+2.576',
        18,
        GOLD,
        zx(STRICT_CUT) + 0.55,
        BASE + H + 0.3,
        true
      ),

      arrow(
        zx(CUT) + 0.025,
        BASE + H * 0.80,
        zx(STRICT_CUT) - 0.025,
        BASE + H * 0.80,
        GOLD,
        3
      ),

      arrow(
        zx(-CUT) - 0.025,
        BASE + H * 0.60,
        zx(-STRICT_CUT) + 0.025,
        BASE + H * 0.60,
        GOLD,
        3
      ),

      tag(
        'STRICTER ALARM RULE',
        GOLD,
        CX,
        P ? -4.75 : -3.2
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Type I / Type II trade-off at fixed sample size.
  // Smaller alpha means fewer false alarms under H₀,
  // but more missed drifts at the specified alternative.
  // ------------------------------------------------------------

  function tradeoffPicture() {
    const x = CX;
    const y = CY;

    const w = P ? 3.10 : 3.25;
    const h = P ? 4.05 : 3.45;
    const dx = P ? 1.72 : 1.82;

    const cases = [
      {
        x: x - dx,
        alpha: ALPHA,
        beta: BETA_2,
        power: POWER_2,
        title: 'ORIGINAL RULE'
      },

      {
        x: x + dx,
        alpha: STRICT_ALPHA,
        beta: STRICT_BETA_2,
        power: STRICT_POWER_2,
        title: 'STRICTER RULE'
      }
    ];

    const parts = [];

    cases.forEach(d => {
      parts.push(
        rect(
          d.x, y,
          w, h,
          GOLD,
          C.card,
          0.95
        ),

        txt(
          d.title,
          18,
          GOLD,
          d.x,
          y + h / 2 - 0.33,
          true,
          w - 0.25
        ),

        txt(
          'False alarms',
          17,
          C.muted,
          d.x,
          y + 0.76
        ),

        txt(
          `${Math.round(d.alpha * 100)}%`,
          30,
          RED,
          d.x,
          y + 0.26,
          true
        ),

        line(
          d.x - w / 2 + 0.26,
          y - 0.10,
          d.x + w / 2 - 0.26,
          y - 0.10,
          C.muted,
          1.5
        ),

        txt(
          'Missed +2 g drifts',
          17,
          C.muted,
          d.x,
          y - 0.43,
          false,
          w - 0.25
        ),

        txt(
          `${Math.round(d.beta * 100)}%`,
          30,
          RED,
          d.x,
          y - 0.92,
          true
        ),

        txt(
          `Power ≈ ${Math.round(d.power * 100)}%`,
          17,
          C.green,
          d.x,
          y - h / 2 + 0.28,
          true,
          w - 0.25
        )
      );
    });

    parts.push(
      txt(
        'Same 16 bottles and same real +2 g drift',
        17,
        C.muted,
        x,
        y - h / 2 - 0.43,
        false,
        6.7
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // More data: preview the next lesson.
  // Do not reveal the required sample size in this lesson.
  // ------------------------------------------------------------

  function moreDataPicture() {
    const x = CX;
    const y = CY;

    const left = x - 1.80;
    const right = x + 1.80;

    const parts = [
      tray(
        left,
        y + 0.12,
        16,
        4,
        0.80
      ),

      txt(
        '52% power',
        20,
        C.green,
        left,
        y - 1.33,
        true
      ),

      arrow(
        left + 1.10,
        y + 0.12,
        right - 1.10,
        y + 0.12,
        C.cyan,
        3
      )
    ];

    const w = P ? 2.50 : 2.60;
    const h = P ? 2.15 : 2.00;

    parts.push(
      rect(
        right,
        y + 0.12,
        w, h,
        C.cyan,
        C.card,
        0.95
      ),

      txt(
        '?',
        48,
        C.cyan,
        right,
        y + 0.15,
        true
      ),

      txt(
        'MORE BOTTLES',
        18,
        C.cyan,
        right,
        y + h / 2 + 0.38,
        true,
        w + 0.30
      ),

      txt(
        'Higher power?',
        20,
        C.green,
        right,
        y - 1.33
      ),

      tag(
        'NEXT: HOW MANY BOTTLES?',
        GOLD,
        x,
        y - 2.02
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Final recap.
  // ------------------------------------------------------------

  function finalRecap() {
    const x = CX;
    const y = CY;

    const w = P ? 6.45 : 6.85;
    const h = P ? 4.55 : 3.85;

    return new M.VGroup(
      rect(
        x, y, w, h,
        C.green,
        C.card,
        0.95
      ),

      txt(
        'POWER AND TYPE II ERROR',
        23,
        C.ink,
        x,
        y + h / 2 - 0.40,
        true,
        w - 0.50
      ),

      txt(
        'POWER',
        26,
        C.green,
        x,
        y + 0.91,
        true
      ),

      txt(
        'Chance of catching a stated real drift',
        20,
        C.ink,
        x,
        y + 0.46,
        false,
        w - 0.60
      ),

      line(
        x - w / 2 + 0.40,
        y + 0.02,
        x + w / 2 - 0.40,
        y + 0.02,
        C.muted,
        1.5
      ),

      txt(
        'TYPE II ERROR',
        24,
        RED,
        x,
        y - 0.40,
        true
      ),

      txt(
        'Missing that real drift',
        20,
        C.ink,
        x,
        y - 0.85
      ),

      txt(
        'Power = 1 − miss chance',
        25,
        GOLD,
        x,
        y - h / 2 + 0.36,
        true
      )
    );
  }

  // ============================================================
  // 0. Last lesson: the machine was perfect.
  // We counted false alarms under a true null.
  // ============================================================

  await until(S(0));
  await play(
    ...scene([
      [
        'graph',
        nullGraph(CUT, true)
      ]
    ]),

    ...fbox([
      'Last lesson',
      ['True mean = 500 g', GOLD],
      ['Type I = false alarm', RED],
      'False-alarm chance = 5%'
    ], RED),

    ...say('LAST LESSON: FALSE ALARMS ON A PERFECT MACHINE', RED)
  );

  // ============================================================
  // 1. Flip the scenario.
  // Suppose the machine really has drifted.
  // ============================================================

  await until(S(1));
  await play(
    ...scene([
      [
        'machine',
        machine(502)
      ]
    ]),

    ...fbox([
      'Now change the truth.',
      ['H₀ is false.', C.violet],
      'A real drift exists.'
    ], C.violet),

    ...say('NOW SUPPOSE THE DRIFT IS REAL', C.violet)
  );

  // ============================================================
  // 2. The new hypothetical true mean is 502 grams.
  // Not merely a particular sample mean.
  // ============================================================

  await until(S(2));
  await play(
    ...scene([
      [
        'meanShift',
        meanShiftPicture(502)
      ]
    ]),

    ...fbox([
      'Original target = 500 g',
      ['True mean = 502 g', C.violet],
      ['Real drift = +2 g', C.violet]
    ], C.violet),

    ...say('TRUE LONG-RUN MEAN = 502 GRAMS', C.violet)
  );

  // ============================================================
  // 3. Will sixteen bottles reveal the real drift?
  // ============================================================

  await until(S(3));
  await play(
    ...scene([
      [
        'inspection',
        inspectionPicture()
      ]
    ]),

    ...fbox([
      'Real drift = +2 g',
      'Sample size = 16',
      ['Will the test notice?', GOLD]
    ], GOLD),

    ...say('WILL 16 BOTTLES BE ENOUGH?', GOLD)
  );

  // ============================================================
  // 4. Simulate a drifted machine.
  // Keep the individual spread at 4 grams.
  // ============================================================

  await until(S(4));
  await play(
    ...scene([
      [
        'machine',
        machine(502)
      ]
    ]),

    ...fbox([
      'Simulated machine',
      ['True mean = 502 g', C.violet],
      'Known SD = 4 g',
      '16 bottles per inspection'
    ], C.violet),

    ...say('SIMULATE A MACHINE WITH A REAL +2 g DRIFT', C.violet)
  );

  // ============================================================
  // 5. Each inspection gives one z using the same ruler.
  // The ruler is still measured from the original 500 g target.
  // ============================================================

  await until(S(5));
  await play(
    ...scene([
      [
        'ruler',
        rulerPicture()
      ]
    ]),

    ...fbox([
      'SE = 4 ÷ √16 = 1 g',
      'z = (mean − 500) ÷ 1',
      ['Same target, same ruler', GOLD]
    ]),

    ...say('ONE STANDARD ERROR IS STILL ONE GRAM')
  );

  // ============================================================
  // 6. Shift the distribution's centre from zero to +2.
  // Spread remains unchanged.
  // ============================================================

  await until(S(6));

  const shiftStart = clear();

  const shiftAxis = normalAxis();
  const shiftTarget = targetLine(true);
  const oldCurve = normalOutline(0, C.cyan);

  layers.set('axis', shiftAxis);
  layers.set('target', shiftTarget);
  layers.set('oldCurve', oldCurve);

  await play(
    ...shiftStart,

    new M.FadeIn(shiftAxis),
    new M.FadeIn(shiftTarget),
    new M.Create(oldCurve),

    ...fbox([
      'Old centre: z = 0',
      ['New centre: z = +2', C.violet],
      'Spread stays the same.'
    ], C.violet),

    ...say('THE HILL MOVES TWO STANDARD ERRORS RIGHT', C.violet)
  );

  const shiftedCurve = normalOutline(
    DRIFT_2,
    C.violet
  );

  layers.set('shiftedCurve', shiftedCurve);

  await play(
    new M.FadeIn(shiftedCurve),

    ...put(
      'shiftArrow',
      shiftArrow(DRIFT_2)
    ),

    ...put(
      'centre',
      centreLine(DRIFT_2)
    )
  );

  // ============================================================
  // 7. Keep exactly the same two-sided alarm rule.
  // ============================================================

  await until(S(7));
  await play(
    ...scene([
      [
        'graph',
        driftGraph(
          DRIFT_2,
          'plain',
          CUT,
          true,
          true
        )
      ]
    ]),

    ...fbox([
      ['Same alarm rule', GOLD],
      'z < −1.96',
      'or z > +1.96',
      'α remains 0.05'
    ], GOLD),

    ...say('KEEP THE SAME CUT-OFFS: ±1.96', GOLD)
  );

  // ============================================================
  // 8. +1.96 lies almost at the new centre of +2.
  // Magnify their small difference.
  // ============================================================

  await until(S(8));
  await play(
    ...scene([
      [
        'graph',
        driftGraph(
          DRIFT_2,
          'plain',
          CUT,
          false,
          true
        )
      ],

      [
        'zoom',
        cutoffZoom()
      ]
    ]),

    ...fbox([
      ['Cut-off = +1.96', GOLD],
      ['New centre = +2.00', C.violet],
      'Difference = 0.04',
      'Almost at the centre.'
    ], GOLD),

    ...say('THE CUT-OFF IS ALMOST AT THE NEW CENTRE', GOLD)
  );

  // ============================================================
  // 9. Roughly half the shifted distribution raises an alarm.
  // Green is now a correct decision.
  // ============================================================

  await until(S(9));
  await play(
    ...scene([
      [
        'graph',
        driftGraph(
          DRIFT_2,
          'power',
          CUT,
          false,
          true
        )
      ],

      [
        'powerLabel',
        powerLabel(
          DRIFT_2,
          POWER_2
        )
      ]
    ]),

    ...fbox([
      'Real drift = +2 g',
      'Roughly half of results',
      'cross the alarm threshold.',
      ['Green = drift caught', C.green]
    ], C.green),

    ...say('ROUGHLY HALF THE RESULTS RAISE AN ALARM', C.green)
  );

  // ============================================================
  // 10. Run one thousand inspections.
  // Animate four batches of actual generated results.
  // ============================================================

  const chunks = [
    simulationChunk(0, 250),
    simulationChunk(250, 500),
    simulationChunk(500, 750),
    simulationChunk(750, 1000)
  ];

  await until(S(10));

  const gridStart = clear();
  const frame = gridFrame(false);

  layers.set('gridFrame', frame);

  chunks.forEach((g, i) => {
    layers.set(`chunk${i}`, g);
  });

  await play(
    ...gridStart,

    new M.FadeIn(frame),

    new M.LaggedStart(
      chunks.map(g =>
        new M.FadeIn(g)
      ),
      {
        lagRatio: 0.35,
        runTime: 3.0
      }
    ),

    ...fbox([
      '1,000 simulated inspections',
      'True mean = 502 g',
      ['Green = real drift caught', C.green]
    ], C.green),

    ...say('RUN 1,000 INSPECTIONS OF THE DRIFTED MACHINE')
  );

  // ============================================================
  // 11. About 516 alarms out of one thousand.
  // Actual selected reproducible simulation gives 517.
  // Theoretical expected count is approximately 516.
  // ============================================================

  await until(S(11));
  await play(
    ...put(
      'counter',
      simulationCounter(
        SIM_N,
        false
      )
    ),

    ...fbox([
      ['Expected ≈ 516 in 1,000', C.green],
      `This run = ${DETECTED_COUNT}`,
      'Actual counts vary.'
    ], C.green),

    ...say('ABOUT 516 ALARMS IN 1,000 INSPECTIONS', C.green)
  );

  // ============================================================
  // 12. Translate the detection probability into a percentage.
  // ============================================================

  await until(S(12));
  await play(
    ...scene([
      [
        'powerBar',
        powerBar(
          POWER_2,
          false,
          DRIFT_2
        )
      ]
    ]),

    ...fbox([
      'Detection probability',
      '≈ 0.516',
      ['≈ 52%', C.green]
    ], C.green),

    ...say('ABOUT 52% CATCH THE DRIFT', C.green)
  );

  // ============================================================
  // 13. The remaining 48% stay silent.
  // The drift is real in every simulated inspection.
  // ============================================================

  await until(S(13));
  await play(
    ...scene([
      [
        'grid',
        simulationGrid(true)
      ]
    ]),

    ...fbox([
      ['True mean = 502 g', C.violet],
      `This run: ${MISSED_COUNT} misses`,
      ['Miss probability ≈ 0.484', RED],
      ['≈ 48%', RED]
    ], RED),

    ...say('THE OTHER 48% MISS A REAL DRIFT', RED)
  );

  // ============================================================
  // 14. Silence is an error when the null is false.
  // Introduce Type II error.
  // ============================================================

  await until(S(14));
  await play(
    ...scene([
      [
        'typeTwo',
        typeTwoCard(true)
      ]
    ]),

    ...fbox([
      'Real drift exists.',
      'The alarm stays silent.',
      ['TYPE II ERROR', RED]
    ], RED),

    ...say('THIS MISTAKE IS A TYPE II ERROR', RED)
  );

  // ============================================================
  // 15. Definition: fail to reject a false null.
  // Keeping the null does not prove it true.
  // ============================================================

  await until(S(15));
  await play(
    ...indicate(
      'typeTwo',
      RED
    ),

    ...fbox([
      ['H₀ is false', C.violet],
      ['Do not reject H₀', RED],
      'Type II error',
      ['= missed drift', RED]
    ], RED),

    ...say('TYPE II ERROR = FAILING TO REJECT A FALSE NULL', RED)
  );

  // ============================================================
  // 16. Name the chance of catching the real drift: power.
  // ============================================================

  await until(S(16));
  await play(
    ...scene([
      [
        'power',
        powerCard()
      ]
    ]),

    ...fbox([
      'Real drift exists.',
      'Test raises an alarm.',
      ['Chance = POWER', C.green]
    ], C.green),

    ...say('CHANCE OF CATCHING THE DRIFT = POWER', C.green)
  );

  // ============================================================
  // 17. Power is one minus the probability of a Type II error.
  // Introduce beta as the missed-drift probability.
  // ============================================================

  await until(S(17));
  await play(
    ...scene([
      [
        'complement',
        complementPicture()
      ]
    ]),

    ...fbox([
      ['miss chance = type II error', RED],
      'Power + miss chance = 1',
      ['Power = 1 − miss chance', C.green]
    ], C.green),

    ...say('POWER = ONE MINUS THE MISSED-DRIFT CHANCE', C.green)
  );

  // ============================================================
  // 18. Our numerical example: 52% power, 48% missed drift.
  // Shade the entire shifted distribution by decision.
  // ============================================================

  await until(S(18));
  await play(
    ...scene([
      [
        'graph',
        driftGraph(
          DRIFT_2,
          'both',
          CUT,
          false,
          true
        )
      ],

      [
        'powerLabel',
        powerLabel(
          DRIFT_2,
          POWER_2
        )
      ],

      [
        'betaLabel',
        betaLabel(
          DRIFT_2,
          BETA_2
        )
      ]
    ]),

    ...fbox([
      'True drift = +2 g',
      ['Power ≈ 0.516 = 52%', C.green],
      ['miss chance ≈ 0.484 = 48%', RED],
      'Power + miss chance = 1'
    ], C.green),

    ...say('52% CAUGHT, 48% MISSED', C.green)
  );

  // ============================================================
  // 19. This is only slightly better than a fair coin flip.
  // The comparison concerns detection probability.
  // ============================================================

  await until(S(19));
  await play(
    ...scene([
      [
        'coin',
        coinComparison()
      ]
    ]),

    ...fbox([
      'Coin flip = 50%',
      ['Our power ≈ 52%', C.green],
      'For a real +2 g drift,',
      'this is not very sensitive.'
    ], GOLD),

    ...say('LITTLE BETTER THAN A COIN FLIP', GOLD)
  );

  // ============================================================
  // 20. Power depends on the true size of the drift.
  // Start the power curve with the known 2 g example.
  // ============================================================

  await until(S(20));
  await play(
    ...scene([
      [
        'powerCurve',
        powerCurve(
          true,
          false
        )
      ]
    ]),

    ...fbox([
      'Power depends on',
      ['the true drift size.', C.violet],
      'At +2 g:',
      ['Power ≈ 52%', C.green]
    ], C.green),

    ...say('POWER DEPENDS ON THE SIZE OF THE DRIFT')
  );

  // ============================================================
  // 21. Move the true mean to 503 g.
  // Same spread, same sample size, same significance level.
  // ============================================================

  await until(S(21));
  await play(
    ...scene([
      [
        'machine',
        machine(503)
      ]
    ]),

    ...fbox([
      ['New true mean = 503 g', C.violet],
      ['Real drift = +3 g', C.violet],
      'SD = 4 g',
      'n = 16; SE = 1 g'
    ], C.violet),

    ...say('NOW INCREASE THE REAL DRIFT TO +3 GRAMS', C.violet)
  );

  // ============================================================
  // 22. The hill moves again, from +2 to +3.
  // The fixed cut-off is now well to the left of its centre.
  // ============================================================

  await until(S(22));
  await play(
    ...scene([
      [
        'graph',
        driftGraph(
          DRIFT_3,
          'plain',
          CUT,
          false,
          true
        )
      ],

      [
        'centreExplanation',
        centreExplanation(DRIFT_3)
      ]
    ]),

    ...fbox([
      'Centre of z',
      '= (503 − 500) ÷ 1',
      ['= +3', C.violet],
      ['Cut-off still +1.96', GOLD]
    ], C.violet),

    ...say('THE HILL NOW CENTRES AT +3', C.violet)
  );

  // ============================================================
  // 23. About 85% of the shifted distribution raises an alarm.
  // Both tails still count.
  // ============================================================

  await until(S(23));
  await play(
    ...scene([
      [
        'graph',
        driftGraph(
          DRIFT_3,
          'both',
          CUT,
          false,
          true
        )
      ],

      [
        'powerLabel',
        powerLabel(
          DRIFT_3,
          POWER_3
        )
      ],

      [
        'betaLabel',
        betaLabel(
          DRIFT_3,
          BETA_3
        )
      ]
    ]),

    ...fbox([
      'True drift = +3 g',
      ['Power ≈ 0.851', C.green],
      ['≈ 85% caught', C.green],
      ['≈ 15% missed', RED]
    ], C.green),

    ...say('A THREE-GRAM DRIFT GIVES ABOUT 85% POWER', C.green)
  );

  // ============================================================
  // 24. Bigger true drifts are easier to catch.
  // Compare the same test at two alternative means.
  // ============================================================

  await until(S(24));
  await play(
    ...scene([
      [
        'comparison',
        powerComparison(true)
      ]
    ]),

    ...fbox([
      ['+2 g drift: 52% power', C.cyan],
      ['+3 g drift: 85% power', C.green],
      'Same test and sample size.'
    ], C.green),

    ...say('BIGGER DRIFTS ARE EASIER TO CATCH', C.green)
  );

  // ============================================================
  // 25. Power is the rejection probability at a specified
  // true mean for which the null is false.
  // ============================================================

  await until(S(25));
  await play(
    ...scene([
      [
        'curve',
        powerCurve(
          true,
          true
        )
      ]
    ]),

    ...fbox([
      'Power',
      '= P(reject H₀)',
      ['at a stated true mean', C.violet],
      'For a false null.'
    ], C.green),

    ...say('POWER IS REJECTION CHANCE AT A SPECIFIC TRUE MEAN', C.green)
  );

  // ============================================================
  // 26. Always state which drift the power refers to.
  // A test has a power function, not one universal power.
  // ============================================================

  await until(S(26));
  await play(
    ...indicate(
      'curve',
      C.green
    ),

    ...fbox([
      'Do not just say:',
      '“The power is 85%.”',
      ['Power for WHICH drift?', GOLD],
      '+3 g here; +2 g gives 52%.'
    ], GOLD),

    ...say('ALWAYS ASK: POWER TO CATCH WHICH DRIFT?', GOLD)
  );

  // ============================================================
  // 27. Practical purpose of power.
  // Can our inspection detect the problem we care about?
  // ============================================================

  await until(S(27));
  await play(
    ...scene([
      [
        'detector',
        detectorPicture(false)
      ]
    ]),

    ...fbox([
      'Choose a meaningful drift.',
      'Ask whether the test',
      ['can reliably detect it.', C.green]
    ], C.green),

    ...say('POWER TELLS US WHETHER THE TEST CAN SEE THE PROBLEM', C.green)
  );

  // ============================================================
  // 28. A low-power test can miss genuine problems.
  // ============================================================

  await until(S(28));
  await play(
    ...scene([
      [
        'detector',
        detectorPicture(true)
      ]
    ]),

    ...fbox([
      'Low power',
      'Real problem exists.',
      ['Test often stays silent.', RED],
      ['High missed-drift chance', RED]
    ], RED),

    ...say('LOW POWER MEANS REAL PROBLEMS OFTEN GO UNNOTICED', RED)
  );

  // ============================================================
  // 29. Trap: a silent test is not proof of a healthy machine.
  // ============================================================

  await until(S(29));
  await play(
    ...scene([
      [
        'trap',
        silentTestTrap()
      ]
    ]),

    ...fbox([
      ['COMMON TRAP', RED],
      'No alarm',
      ['≠ proof of no drift', RED],
      'Silence has two explanations.'
    ], RED),

    ...say('TRAP: NO ALARM DOES NOT MEAN NO DRIFT', RED)
  );

  // ============================================================
  // 30. At 52% power, almost half of real 2 g drifts are missed.
  // Show the theoretical probability split again.
  // ============================================================

  await until(S(30));
  await play(
    ...scene([
      [
        'bar',
        powerBar(
          POWER_2,
          true,
          DRIFT_2
        )
      ]
    ]),

    ...fbox([
      ['Real drift = +2 g', C.violet],
      ['Power ≈ 52%', C.green],
      ['Missed drift ≈ 48%', RED],
      'Silence proves very little.'
    ], RED),

    ...say('ALMOST HALF OF REAL TWO-GRAM DRIFTS ARE MISSED', RED)
  );

  // ============================================================
  // 31. Smaller alpha moves cut-offs farther from zero.
  // With the same number of bottles, this lowers power.
  // Illustrative comparison: alpha 5% versus 1%.
  // ============================================================

  await until(S(31));
  await play(
    ...scene([
      [
        'strict',
        stricterCutoffPicture()
      ]
    ]),

    ...fbox([
      'α: 0.05 → 0.01',
      ['Cut-offs move outward.', GOLD],
      'Power: 52% → 28%',
      ['More real drifts missed.', RED]
    ], GOLD),

    ...say('LOWER ALPHA ALSO LOWERS POWER', GOLD)
  );

  // ============================================================
  // 32. Type I and Type II errors pull against one another
  // when sample size and the alternative are held fixed.
  // ============================================================

  await until(S(32));
  await play(
    ...scene([
      [
        'tradeoff',
        tradeoffPicture()
      ]
    ]),

    ...fbox([
      'With n fixed at 16:',
      ['α decreases: 5% → 1%', GOLD],
      ['misses rise: 48% → 72%', RED],
      'Reducing one raises the other.'
    ], GOLD),

    ...say('FEWER FALSE ALARMS, BUT MORE MISSED DRIFTS', GOLD)
  );

  // ============================================================
  // 33. More data provides a way to improve detection without
  // increasing alpha.
  // Leave the actual required sample size for lesson 7.1.7.
  // ============================================================

  await until(S(33));
  await play(
    ...scene([
      [
        'moreData',
        moreDataPicture()
      ]
    ]),

    ...fbox([
      ['The way out: more data', C.green],
      'Keep α = 0.05.',
      'Improve detection.',
      ['How many bottles?', GOLD]
    ], C.green),

    ...say('NEXT: HOW MANY BOTTLES DO WE NEED?', GOLD)
  );

  // ============================================================
  // 34. Final recap.
  //
  // Power is the chance of catching a real drift of a stated
  // size. Missing that drift is a Type II error.
  // ============================================================

  await until(S(34));
  await play(
    ...scene([
      [
        'recap',
        finalRecap()
      ]
    ]),

    ...fbox([
      ['Power = 1 − miss chance', C.green],
      '+2 g: power ≈ 52%',
      '+3 g: power ≈ 85%',
      ['Type II = missed drift', RED]
    ], C.green),

    ...say('POWER CATCHES REAL DRIFT; TYPE II ERROR MISSES IT', C.green)
  );
}

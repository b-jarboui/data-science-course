// lesson 7.1.5
// Type I error: false alarms.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter data:
//   Target = 500 g; known SD = 4 g; n = 16; SE = 1 g.
//   Morning batch mean = 502 g; z = +2; p ≈ 0.046.
//   Two-sided alpha = 0.05; cut-offs = ±1.96.
//   20 independent inspections:
//   P(no false alarms) = 0.95^20 ≈ 0.3585.
//   P(at least one false alarm) ≈ 0.6415.
//
// The simulation uses seeded standard normal draws, equivalent
// to drawing standardized means of 16 independent normal weights.
// Seed 2026 was selected for a reproducible illustrative run
// containing exactly 50 alarms in 1,000 inspections.
// This does not imply every simulation produces exactly 50 alarms.
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

  const ALPHA = 0.05;
  const CUT = 1.96;
  const SMALL_CUT = 2.575829;

  const SIM_N = 1000;
  const DAYS = 20;

  const NO_ALARM = 1 - ALPHA;
  const NONE_20 = Math.pow(NO_ALARM, DAYS);
  const ANY_20 = 1 - NONE_20;

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

    const maxw = P ? FW - 1 : 7.05;

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);
    return p;
  }

  function heading(s, color = C.ink) {
    return txt(
      s, P ? 22 : 23,
      color,
      CX,
      P ? 1.05 : 1.15
    );
  }

  // ------------------------------------------------------------
  // Scene layers.
  // Never regroup objects already on screen.
  // All animations are played sequentially.
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
      new M.Transform(
        layers.get(key),
        target,
        options
      )
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
    juice.moveTo([
      x, juiceY, 0
    ]);

    const neck = rect(
      x, y + h / 2 + 0.065 * s,
      0.25 * s, 0.15 * s,
      color, C.card, 0.90,
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
      backing.moveTo([
        x, y - 0.06 * s, 0
      ]);

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

  function scale(
    x, y,
    s = 1,
    display = '? g'
  ) {
    return new M.VGroup(
      rect(
        x, y,
        1.55 * s, 0.72 * s,
        C.cyan, C.card, 0.95,
        0.12 * s
      ),

      rect(
        x, y + 0.44 * s,
        1.85 * s, 0.15 * s,
        C.muted, C.card, 1,
        0.05 * s
      ),

      rect(
        x, y,
        1.04 * s, 0.36 * s,
        C.muted, C.card, 1,
        0.06 * s
      ),

      txt(
        display,
        19 * s,
        GOLD,
        x, y,
        true, 0.90 * s
      )
    );
  }

  function tray(
    x, y,
    s = 1,
    color = C.cyan,
    label = true
  ) {
    const dx = 0.52 * s;
    const dy = 0.51 * s;

    const w = 2.45 * s;
    const h = 2.35 * s;

    const parts = [
      rect(
        x, y, w, h,
        color, C.card, 0.85,
        0.13 * s
      )
    ];

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

    if (label) parts.push(
      txt(
        '16 BOTTLES',
        Math.max(15, 18 * s),
        color,
        x, y + h / 2 + 0.25 * s,
        true, w + 0.2
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Factory alarm symbol.
  // Drawn with simple lines and a glowing warning light.
  // ------------------------------------------------------------

  function alarm(
    x, y,
    active = true,
    s = 1
  ) {
    const color = active
      ? RED
      : C.green;

    const halo = new M.Circle({
      radius: 0.75 * s,
      color,
      strokeWidth: 1
    });

    halo.setFill(color, 0.07);
    halo.moveTo([x, y, 0]);

    const dome = rect(
      x, y,
      0.86 * s, 0.90 * s,
      color, color,
      active ? 0.42 : 0.10,
      0.23 * s
    );

    const foot = rect(
      x, y - 0.51 * s,
      1.14 * s, 0.20 * s,
      color, C.card, 1,
      0.05 * s
    );

    const parts = [
      halo,
      dome,
      foot,

      txt(
        active ? '!' : 'OK',
        35 * s,
        color,
        x, y,
        true, 0.75 * s
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
            RED, 3
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Shared filling machine.
  // A healthy machine has mean 500 g, not exactly 500 g
  // in every individual bottle.
  // ------------------------------------------------------------

  function perfectMachine(
    showTruth = true,
    alarmState = null
  ) {
    const x = CX;
    const y = P ? -0.65 : -0.18;

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

    if (showTruth) {
      parts.push(
        tag(
          'TRUE MEAN = 500 g',
          GOLD,
          x + 1.05,
          y + 0.80,
          18
        )
      );
    } else {
      parts.push(
        tag(
          'TRUE MEAN UNKNOWN',
          C.muted,
          x + 1.05,
          y + 0.80,
          17
        )
      );
    }

    if (alarmState !== null) {
      parts.push(
        alarm(
          x + 1.45,
          y - 0.12,
          alarmState,
          0.55
        )
      );
    } else {
      parts.push(
        txt(
          'Individual fills still vary',
          17, C.muted,
          x + 1.05,
          y + 0.22,
          false, 3.55
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Two-sided normal curve.
  // All probability labels refer to the full distribution.
  // The displayed window is -4.5 to +4.5.
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
    const parts = [
      line(
        zx(ZLO), BASE,
        zx(ZHI), BASE,
        C.muted, 2.5
      )
    ];

    for (let z = -4; z <= 4; z++) {
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
          P ? 16 : 18,
          color,
          zx(z), BASE - 0.30,
          true
        )
      );
    }

    parts.push(
      txt(
        'z: standard errors from target',
        17, C.muted,
        CX, BASE - 0.74,
        false, ZW
      )
    );

    return new M.VGroup(...parts);
  }

  function normalOutline(
    mean = 0,
    color = C.cyan
  ) {
    const parts = [];
    const n = 100;

    const f = z =>
      BASE + H *
      Math.exp(-0.5 * (z - mean) ** 2);

    for (let i = 0; i < n; i++) {
      const a = ZLO + (ZHI - ZLO) * i / n;
      const b = ZLO + (ZHI - ZLO) * (i + 1) / n;

      parts.push(
        line(
          zx(a), f(a),
          zx(b), f(b),
          color, 2.8
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
    const n = Math.max(
      12,
      Math.ceil((hi - lo) * 16)
    );

    const step = (hi - lo) / n;
    const parts = [];

    for (let i = 0; i < n; i++) {
      const a = lo + step * i;
      const b = a + step;
      const mid = (a + b) / 2;

      const h = Math.max(
        0.002,
        H * density(mid)
      );

      const r = new M.Rectangle({
        width: (zx(b) - zx(a)) * 1.005,
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

  function nullLine(showLabel = true) {
    const parts = [
      line(
        zx(0), BASE,
        zx(0), BASE + H + 0.07,
        GOLD, 3
      )
    ];

    if (showLabel) {
      parts.push(
        tag(
          'TRUE MEAN = 500 g',
          GOLD,
          CX,
          BASE + H + 0.35,
          16
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function cutoff(
    z,
    label = signed(z),
    color = GOLD
  ) {
    const x = zx(z);
    const top = BASE + H * 0.47;

    return new M.VGroup(
      dashed(
        x, BASE,
        x, top,
        color
      ),

      glowDot(
        x, BASE + 0.05,
        color, 0.065
      ),

      tag(
        label,
        color,
        x, top + 0.27,
        16
      )
    );
  }

  function tailLabel(
    side,
    label,
    boundary = CUT
  ) {
    const sign = side === 'left'
      ? -1
      : 1;

    const x = zx(sign * 3.25);
    const y = BASE + H * 0.25;

    const dest = sign *
      Math.min(3.90, boundary + 0.30);

    return new M.VGroup(
      tag(
        label,
        RED,
        x, y,
        17
      ),

      arrow(
        x, y - 0.18,
        zx(dest),
        BASE + H * density(dest) * 0.48,
        RED, 2
      )
    );
  }

  function graph(
    cut = CUT,
    shade = true,
    labels = false,
    title = 'Results when the null is true'
  ) {
    const parts = [
      normalArea(
        ZLO, ZHI,
        C.cyan, 0.12
      )
    ];

    if (shade) {
      parts.push(
        normalArea(
          ZLO, -cut,
          RED, 0.90
        ),

        normalArea(
          cut, ZHI,
          RED, 0.90
        )
      );
    }

    parts.push(
      normalOutline(),
      normalAxis(),
      nullLine(),

      cutoff(
        -cut,
        cut === CUT ? '−1.96' : '−2.576'
      ),

      cutoff(
        cut,
        cut === CUT ? '+1.96' : '+2.576'
      ),

      heading(title)
    );

    if (labels) {
      const label = cut === CUT
        ? '2.5%'
        : '0.5%';

      parts.push(
        tailLabel('left', label, cut),
        tailLabel('right', label, cut)
      );
    }

    return new M.VGroup(...parts);
  }

  function resultMarker(
    z,
    color,
    label
  ) {
    const x = zx(z);
    const top = Math.max(
      curveY(z) + 0.05,
      BASE + 0.58
    );

    return new M.VGroup(
      line(
        x, BASE,
        x, top,
        color, 3
      ),

      glowDot(
        x, curveY(z),
        color, 0.10
      ),

      tag(
        label,
        color,
        x, top + 0.29,
        17
      )
    );
  }

  // ------------------------------------------------------------
  // Morning batch alarm.
  // The real machine's true mean is unknown.
  // The perfect machine is a hypothetical scenario introduced
  // to explain false alarms.
  // ------------------------------------------------------------

  function morningAlarm() {
    const x = CX;
    const y = CY;

    const tx = x - 1.65;
    const ax = x + 1.70;

    return new M.VGroup(
      tray(
        tx, y + 0.10,
        0.95
      ),

      arrow(
        tx + 1.30, y + 0.10,
        ax - 1.10, y + 0.10,
        RED, 3
      ),

      alarm(
        ax, y + 0.30,
        true, 0.95
      ),

      tag(
        'MEAN = 502 g',
        C.cyan,
        tx,
        y - 1.55,
        17
      ),

      tag(
        'REJECT H₀',
        RED,
        ax,
        y - 1.02,
        19
      ),

      txt(
        'p ≈ 0.046',
        18, RED,
        ax,
        y - 1.50,
        true
      )
    );
  }

  function truthDecision(
    trueMean = 500,
    raised = true
  ) {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 3.85 : 3.45;

    const correct = !raised;
    const color = correct
      ? C.green
      : RED;

    return new M.VGroup(
      rect(
        x, y, w, h,
        color, C.card, 0.95
      ),

      txt(
        'HYPOTHETICAL INSPECTION',
        19, C.muted,
        x, y + h / 2 - 0.35,
        true, w - 0.5
      ),

      tag(
        `TRUTH: MEAN = ${trueMean} g`,
        GOLD,
        x, y + 0.74,
        19
      ),

      alarm(
        x - 1.65,
        y - 0.15,
        raised,
        0.67
      ),

      txt(
        raised ? 'ALARM' : 'NO ALARM',
        25, color,
        x + 0.90,
        y + 0.10,
        true, 3.25
      ),

      txt(
        raised
          ? 'We reject the null.'
          : 'We keep the null.',
        18, C.ink,
        x + 0.90,
        y - 0.42,
        false, 3.25
      ),

      tag(
        raised ? 'FALSE ALARM' : 'CORRECT DECISION',
        color,
        x,
        y - h / 2 + 0.36,
        19
      )
    );
  }

  // ------------------------------------------------------------
  // Computer simulation illustration.
  // ------------------------------------------------------------

  function computerPicture() {
    const x = CX;
    const y = CY;

    const w = P ? 5.90 : 6.25;
    const h = P ? 3.65 : 3.15;

    const monitor = rect(
      x, y + 0.18,
      w, h,
      C.cyan, C.card, 0.95
    );

    const screen = rect(
      x, y + 0.18,
      w - 0.35,
      h - 0.35,
      C.muted, C.card, 1,
      0.08
    );

    const stand = rect(
      x,
      y - h / 2 - 0.04,
      0.48, 0.50,
      C.muted, C.muted, 0.45,
      0.05
    );

    const foot = rect(
      x,
      y - h / 2 - 0.35,
      1.75, 0.18,
      C.muted, C.card, 1,
      0.05
    );

    const parts = [
      stand,
      foot,
      monitor,
      screen,

      txt(
        'SIMULATED FACTORY',
        22, C.cyan,
        x,
        y + h / 2 - 0.30,
        true, w - 0.6
      ),

      bottle(
        x - 1.90,
        y + 0.04,
        0.90,
        0.72,
        '500 g'
      ),

      arrow(
        x - 1.25,
        y + 0.04,
        x - 0.25,
        y + 0.04,
        C.cyan, 3
      ),

      txt(
        'We set the truth.',
        21, GOLD,
        x + 1.10,
        y + 0.43,
        false, 3.1
      ),

      txt(
        'Then repeat inspections.',
        18, C.ink,
        x + 1.10,
        y - 0.12,
        false, 3.1
      ),

      txt(
        'Pretend many times with known truth',
        17, C.muted,
        x,
        y - h / 2 + 0.60,
        false, w - 0.6
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Individual bottle-weight distribution.
  // Spread remains 4 grams.
  // ------------------------------------------------------------

  function bottleDistribution() {
    const w = P ? 6.55 : 7.05;
    const y = BASE;

    const lo = 484;
    const hi = 516;

    const gx = v =>
      CX - w / 2 +
      (v - lo) / (hi - lo) * w;

    const h = P ? 2.55 : 2.10;

    const f = v =>
      h * Math.exp(
        -0.5 * ((v - TARGET) / SD) ** 2
      );

    const parts = [];

    const n = 80;
    const step = (hi - lo) / n;

    for (let i = 0; i < n; i++) {
      const a = lo + step * i;
      const b = a + step;
      const mid = (a + b) / 2;

      const bh = Math.max(
        0.002,
        f(mid)
      );

      const r = new M.Rectangle({
        width: (gx(b) - gx(a)) * 1.005,
        height: bh,
        color: C.cyan,
        strokeWidth: 0
      });

      r.setFill(C.cyan, 0.13);

      r.moveTo([
        gx(mid),
        y + bh / 2,
        0
      ]);

      parts.push(
        r,

        line(
          gx(a), y + f(a),
          gx(b), y + f(b),
          C.cyan, 2.6
        )
      );
    }

    parts.push(
      line(
        gx(lo), y,
        gx(hi), y,
        C.muted, 2.5
      )
    );

    [484, 492, 500, 508, 516].forEach(v => {
      parts.push(
        line(
          gx(v), y - 0.075,
          gx(v), y + 0.075,
          C.muted
        ),

        txt(
          String(v), 17,
          v === TARGET ? GOLD : C.muted,
          gx(v), y - 0.30,
          true
        )
      );
    });

    parts.push(
      line(
        gx(TARGET), y,
        gx(TARGET), y + h + 0.08,
        GOLD, 3
      ),

      tag(
        'TRUE MEAN = 500 g',
        GOLD,
        gx(TARGET),
        y + h + 0.34,
        17
      ),

      line(
        gx(TARGET),
        y + 0.56,
        gx(TARGET + SD),
        y + 0.56,
        GOLD, 3
      ),

      line(
        gx(TARGET),
        y + 0.46,
        gx(TARGET),
        y + 0.66,
        GOLD, 2
      ),

      line(
        gx(TARGET + SD),
        y + 0.46,
        gx(TARGET + SD),
        y + 0.66,
        GOLD, 2
      ),

      txt(
        '4 g',
        19, GOLD,
        gx(TARGET + SD / 2),
        y + 0.85,
        true
      ),

      txt(
        'Individual bottle weights (grams)',
        17, C.muted,
        CX, y - 0.74,
        false, w
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // One inspection: sixteen bottles -> one z -> alarm rule.
  // ------------------------------------------------------------

  function inspectionPicture() {
    const x = CX;
    const y = CY;

    const tx = x - 1.85;
    const sx = x + 1.65;

    return new M.VGroup(
      tray(
        tx, y + 0.10,
        0.95
      ),

      scale(
        sx, y - 0.20,
        1.00,
        '? g'
      ),

      bottle(
        sx,
        y + 0.82,
        0.80,
        0.72,
        '500 g'
      ),

      arrow(
        tx + 1.28,
        y + 0.10,
        sx - 1.12,
        y + 0.10,
        C.cyan, 3
      ),

      txt(
        'Find the sample mean',
        18, C.ink,
        sx,
        y - 0.89,
        false, 3.30
      ),

      tag(
        'THEN COMPUTE z',
        C.green,
        sx,
        y - 1.36,
        17
      )
    );
  }

  // ------------------------------------------------------------
  // Reproducible normal simulation.
  //
  // Under the true null:
  //   mean of 16 bottles ~ Normal(500, 1²)
  //   z = (sample mean - 500) / 1 ~ Normal(0, 1)
  //
  // Drawing z directly is equivalent to simulating each
  // standardized sample mean.
  // ------------------------------------------------------------

  let rngState = 2026 >>> 0;

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
      const z = standardNormal();

      return {
        index: i,
        z,
        mean: TARGET + z * SE,
        alarm: Math.abs(z) > CUT
      };
    }
  );

  const alarms = simulations.filter(
    d => d.alarm
  );

  const ALARM_COUNT = alarms.length;

  const NO_ALARM_COUNT =
    SIM_N - ALARM_COUNT;

  const EXAMPLE = simulations.find(
    d => Math.abs(d.z) < 0.55
  );

  const EXAMPLE_Z = Number(
    EXAMPLE.z.toFixed(2)
  );

  // ------------------------------------------------------------
  // Thousand-inspection dot grid.
  //
  // 40 columns × 25 rows = 1,000 dots.
  // Each dot is one actual generated inspection result.
  // Red: |z| > 1.96.
  // Cyan: |z| ≤ 1.96.
  //
  // Batching avoids a separate animation per individual dot.
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

  function simulationDot(d) {
    const color = d.alarm
      ? RED
      : C.cyan;

    const dot = new M.Dot({
      point: gridPosition(d.index),
      radius: d.alarm
        ? GRAD * 1.10
        : GRAD,
      color
    });

    dot.setFill(
      color,
      d.alarm ? 1 : 0.58
    );

    return dot;
  }

  function simulationChunk(start, end) {
    return new M.VGroup(
      ...simulations
        .slice(start, end)
        .map(simulationDot)
    );
  }

  function gridFrame() {
    const w = GC * GDX + 0.25;
    const h = GR * GDY + 0.25;

    const frame = rect(
      CX, GY,
      w, h,
      C.muted, C.card, 0.75,
      0.12
    );

    const ly = GY - h / 2 - 0.28;

    return new M.VGroup(
      frame,

      glowDot(
        CX - 2.40, ly,
        C.cyan, 0.07
      ),

      txt(
        'No alarm',
        17, C.cyan,
        CX - 1.48, ly
      ),

      glowDot(
        CX + 0.52, ly,
        RED, 0.07
      ),

      txt(
        'False alarm',
        17, RED,
        CX + 1.67, ly
      )
    );
  }

  function counter(count) {
    const falseCount = simulations
      .slice(0, count)
      .filter(d => d.alarm)
      .length;

    const y =
      GY + GR * GDY / 2 + 0.40;

    return new M.VGroup(
      txt(
        `${count.toLocaleString('en-US')} / 1,000`,
        P ? 25 : 24,
        C.cyan,
        CX - 1.48,
        y,
        true, 3.0
      ),

      txt(
        `${falseCount} RED`,
        P ? 25 : 24,
        RED,
        CX + 1.75,
        y,
        true, 2.8
      )
    );
  }

  function alarmRings() {
    return new M.VGroup(
      ...alarms.map(d => {
        const ring = new M.Circle({
          radius: GRAD * 1.50,
          color: RED,
          strokeWidth: 1.5
        });

        ring.setFill(RED, 0);
        ring.moveTo(gridPosition(d.index));

        return ring;
      })
    );
  }

  // ------------------------------------------------------------
  // Five in one hundred / one in twenty.
  // Twenty cells, each representing five inspections.
  // ------------------------------------------------------------

  function oneInTwenty(
    title = 'ONE FALSE ALARM IN TWENTY',
    showExplanation = true
  ) {
    const cols = 10;
    const rows = 2;

    const dx = P ? 0.56 : 0.59;
    const dy = 0.63;

    const w = dx * 0.82;
    const h = dy * 0.80;

    const y = CY + 0.15;
    const parts = [];

    for (let i = 0; i < 20; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = CX + (col - 4.5) * dx;
      const yy = y + (0.5 - row) * dy;

      const color = i === 0
        ? RED
        : C.cyan;

      parts.push(
        rect(
          x, yy,
          w, h,
          color, color,
          i === 0 ? 0.85 : 0.14,
          0.07
        )
      );

      if (i === 0) {
        parts.push(
          txt(
            '!',
            22, C.ink,
            x, yy,
            true
          )
        );
      }
    }

    parts.push(
      tag(
        title,
        RED,
        CX,
        y + 1.12,
        18
      )
    );

    if (showExplanation) {
      parts.push(
        txt(
          'Expected proportion, not a fixed schedule',
          17, C.muted,
          CX, y - 1.01
        ),

        txt(
          '50 / 1,000 = 5 / 100 = 1 / 20',
          20, C.ink,
          CX, y - 1.54,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Type I error definition.
  // Known truth and test decision are separate.
  // ------------------------------------------------------------

  function typeOneCard(
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
          ? 'TYPE I ERROR'
          : 'A FALSE ALARM',
        27, RED,
        x,
        y + h / 2 - 0.43,
        true, w - 0.5
      ),

      txt(
        'TRUTH',
        17, C.muted,
        x - 1.55,
        y + 0.70,
        true
      ),

      txt(
        'H₀ IS TRUE',
        21, GOLD,
        x + 1.30,
        y + 0.70,
        true, 3.05
      ),

      line(
        x - w / 2 + 0.40,
        y + 0.28,
        x + w / 2 - 0.40,
        y + 0.28,
        C.muted, 1.5
      ),

      txt(
        'DECISION',
        17, C.muted,
        x - 1.55,
        y - 0.13,
        true
      ),

      txt(
        'REJECT H₀',
        21, RED,
        x + 1.30,
        y - 0.13,
        true, 3.05
      ),

      alarm(
        x - 1.55,
        y - 1.02,
        true,
        0.48
      ),

      txt(
        'Machine is fine,',
        19, C.ink,
        x + 0.82,
        y - 0.77,
        false, 3.70
      ),

      txt(
        'but the test says drift.',
        19, RED,
        x + 0.82,
        y - 1.16,
        false, 3.70
      )
    );
  }

  // ------------------------------------------------------------
  // Significance-level comparison.
  // Smaller alpha gives smaller red alarm regions.
  // ------------------------------------------------------------

  function alphaComparison() {
    const w = P ? 6.30 : 6.65;

    const parts = [];

    const y1 = P ? 0.20 : 0.73;
    const y2 = P ? -2.30 : -1.22;

    function row(y, cut, alpha, color) {
      const h = P ? 1.20 : 0.90;

      const x = z =>
        CX - w / 2 +
        (z + 4.5) / 9 * w;

      const f = z =>
        h * Math.exp(-0.5 * z * z);

      const items = [];

      const count = 90;

      for (let i = 0; i < count; i++) {
        const a = -4.5 + 9 * i / count;
        const b = -4.5 + 9 * (i + 1) / count;
        const mid = (a + b) / 2;

        const bh = Math.max(
          0.002,
          f(mid)
        );

        const alarmRegion =
          Math.abs(mid) > cut;

        const c = alarmRegion
          ? RED
          : C.cyan;

        const r = new M.Rectangle({
          width: (x(b) - x(a)) * 1.005,
          height: bh,
          color: c,
          strokeWidth: 0
        });

        r.setFill(
          c,
          alarmRegion ? 0.92 : 0.12
        );

        r.moveTo([
          x(mid),
          y + bh / 2,
          0
        ]);

        items.push(
          r,

          line(
            x(a), y + f(a),
            x(b), y + f(b),
            C.cyan, 2
          )
        );
      }

      items.push(
        line(
          x(-4.5), y,
          x(4.5), y,
          C.muted, 2
        ),

        line(
          x(0), y,
          x(0), y + h,
          GOLD, 2
        ),

        dashed(
          x(-cut), y,
          x(-cut), y + h * 0.55,
          GOLD
        ),

        dashed(
          x(cut), y,
          x(cut), y + h * 0.55,
          GOLD
        ),

        txt(
          `α = ${alpha.toFixed(2)}`,
          20, color,
          x(-3.1),
          y + h * 0.80,
          true, w * 0.34
        ),

        txt(
          `${Math.round(alpha * 100)}% alarms`,
          18, RED,
          x(3.1),
          y + h * 0.80,
          false, w * 0.34
        ),

        txt(
          `Cut-offs: ±${cut.toFixed(3)}`,
          17, C.muted,
          CX, y - 0.29,
          true
        )
      );

      return new M.VGroup(...items);
    }

    parts.push(
      row(y1 - 0.80, CUT, 0.05, GOLD),
      row(y2 - 0.35, SMALL_CUT, 0.01, C.green)
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Trade-off preview.
  // At a fixed true drift and sample size, pushing the
  // critical threshold outward reduces the chance of detection.
  // ------------------------------------------------------------

  function detectionTradeoff() {
    const parts = [
      normalArea(
        ZLO, ZHI,
        C.cyan, 0.10
      ),

      normalArea(
        ZLO, -SMALL_CUT,
        RED, 0.85
      ),

      normalArea(
        SMALL_CUT, ZHI,
        RED, 0.85
      ),

      normalOutline(
        0, C.cyan
      ),

      normalOutline(
        2, C.violet
      ),

      normalAxis(),

      line(
        zx(0), BASE,
        zx(0), BASE + H,
        GOLD, 2.5
      ),

      dashed(
        zx(CUT), BASE,
        zx(CUT), BASE + H * 0.78,
        C.muted
      ),

      dashed(
        zx(SMALL_CUT), BASE,
        zx(SMALL_CUT), BASE + H * 0.78,
        RED
      ),

      txt(
        'Healthy',
        17, C.cyan,
        zx(-0.90),
        BASE + H + 0.32
      ),

      txt(
        'Real drift',
        17, C.violet,
        zx(2.75),
        BASE + H + 0.32
      ),

      arrow(
        zx(CUT) + 0.025,
        BASE + H * 0.85,
        zx(SMALL_CUT) - 0.025,
        BASE + H * 0.85,
        RED, 2.5
      ),

      txt(
        'Stricter rule',
        17, RED,
        zx(2.70),
        BASE + H * 0.68,
        false, ZW * 0.36
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Calendar: twenty independent daily inspections.
  // No red day is predetermined.
  // ------------------------------------------------------------

  const CAL_COLS = P ? 4 : 5;
  const CAL_ROWS = P ? 5 : 4;

  const CAL_DX = P ? 1.62 : 1.24;
  const CAL_DY = P ? 1.02 : 0.70;

  const CAL_W = P ? 1.45 : 1.12;
  const CAL_H = P ? 0.86 : 0.60;

  const CAL_Y = P ? -1.7 : -0.65;
  const CAL_HALF = (CAL_ROWS - 1) / 2;

  function dayPosition(i) {
    const col = i % CAL_COLS;
    const row = Math.floor(i / CAL_COLS);

    return [
      CX + (col - (CAL_COLS - 1) / 2) * CAL_DX,
      CAL_Y + (CAL_HALF - row) * CAL_DY
    ];
  }

  function dayCell(i, mode = 'unknown') {
    const [x, y] = dayPosition(i);

    const color = mode === 'safe'
      ? C.green
      : C.cyan;

    const parts = [
      rect(
        x, y,
        CAL_W, CAL_H,
        color, C.card, 0.90,
        0.075
      ),

      txt(
        `DAY ${i + 1}`,
        P ? 17 : 15,
        color,
        x,
        y + CAL_H * 0.21,
        true, CAL_W - 0.10
      )
    ];

    if (mode === 'chance') {
      parts.push(
        txt(
          '5%',
          P ? 18 : 16, RED,
          x,
          y - CAL_H * 0.20,
          true
        )
      );
    } else if (mode === 'safe') {
      parts.push(
        txt(
          '0.95',
          P ? 18 : 16, C.green,
          x,
          y - CAL_H * 0.20,
          true
        )
      );
    } else {
      parts.push(
        txt(
          '?',
          17, C.muted,
          x,
          y - CAL_H * 0.20,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function calendar(mode = 'unknown') {
    const parts = [];

    for (let i = 0; i < DAYS; i++) {
      parts.push(
        dayCell(i, mode)
      );
    }

    parts.push(
      txt(
        '20 DAYS — ONE INSPECTION PER DAY',
        20, C.ink,
        CX,
        CAL_Y + CAL_HALF * CAL_DY + 0.64,
        true, 6.7
      ),

      txt(
        mode === 'safe'
          ? 'Every day must avoid a false alarm'
          : 'The machine is healthy on every day',
        17,
        mode === 'safe' ? C.green : GOLD,
        CX,
        CAL_Y - CAL_HALF * CAL_DY - 0.66,
        false, 6.7
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Single-day chance.
  // 95% no false alarm, 5% false alarm.
  // ------------------------------------------------------------

  function dailyProbability(
    highlight = 'alarm'
  ) {
    const x = CX;
    const y = CY;

    const cols = 20;
    const dx = P ? 0.285 : 0.30;

    const bw = dx * 0.83;
    const h = 0.82;

    const parts = [];

    for (let i = 0; i < cols; i++) {
      const xx =
        x + (i - 9.5) * dx;

      const color = i === 19
        ? RED
        : C.green;

      const b = new M.Rectangle({
        width: bw,
        height: h,
        color,
        strokeWidth: 1
      });

      const active =
        highlight === 'alarm'
          ? i === 19
          : i !== 19;

      b.setFill(
        color,
        active ? 0.85 : 0.20
      );

      b.moveTo([xx, y, 0]);

      parts.push(b);
    }

    const last = x + 9.5 * dx;

    parts.push(
      txt(
        'ONE DAY',
        24, C.ink,
        x, y + 1.35,
        true
      ),

      txt(
        '95%: no false alarm',
        22, C.green,
        x - dx / 2,
        y + 0.85,
        false, 5.1
      ),

      arrow(
        x + 1.55,
        y - 0.92,
        last,
        y - 0.46,
        RED, 2.4
      ),

      txt(
        '5%: false alarm',
        20, RED,
        x + 1.28,
        y - 1.22,
        false, 3.6
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Independence: separate daily inspections.
  // Yesterday's outcome does not change today's probability.
  // ------------------------------------------------------------

  function independencePicture() {
    const w = P ? 2.85 : 3.00;
    const h = P ? 2.75 : 2.70;

    const dx = P ? 1.75 : 1.87;

    const x1 = CX - dx;
    const x2 = CX + dx;

    const y = CY;

    return new M.VGroup(
      rect(
        x1, y,
        w, h,
        C.cyan, C.card, 0.95
      ),

      rect(
        x2, y,
        w, h,
        C.cyan, C.card, 0.95
      ),

      txt(
        'DAY 1',
        21, C.ink,
        x1,
        y + 0.94,
        true
      ),

      txt(
        'DAY 2',
        21, C.ink,
        x2,
        y + 0.94,
        true
      ),

      tray(
        x1,
        y - 0.02,
        0.55, C.cyan, false
      ),

      tray(
        x2,
        y - 0.02,
        0.55, C.cyan, false
      ),

      txt(
        'P(no alarm) = 0.95',
        17, C.green,
        x1,
        y - 1.00,
        true, w - 0.25
      ),

      txt(
        'P(no alarm) = 0.95',
        17, C.green,
        x2,
        y - 1.00,
        true, w - 0.25
      ),

      txt(
        '×',
        30, GOLD,
        CX,
        y + 0.05,
        true
      ),

      tag(
        'INDEPENDENT INSPECTIONS',
        GOLD,
        CX,
        y - h / 2 - 0.45,
        17
      )
    );
  }

  // ------------------------------------------------------------
  // Multiplication picture.
  // Twenty copies of 0.95.
  // ------------------------------------------------------------

  function multiplicationPicture() {
    const cols = 5;
    const rows = 4;

    const dx = P ? 1.23 : 1.30;
    const dy = P ? 0.72 : 0.55;

    const y = P ? -1.25 : -0.48;

    const parts = [];

    for (let i = 0; i < DAYS; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const xx = CX + (col - 2) * dx;
      const yy = y + (1.5 - row) * dy;

      parts.push(
        rect(
          xx, yy,
          0.88,
          P ? 0.49 : 0.40,
          C.green,
          C.green,
          0.12,
          0.06
        ),

        txt(
          '0.95',
          18, C.green,
          xx, yy,
          true
        )
      );

      if (col < cols - 1) {
        parts.push(
          txt(
            '×',
            18, GOLD,
            xx + dx / 2,
            yy,
            true
          )
        );
      }

      if (
        col === cols - 1 &&
        row < rows - 1
      ) {
        parts.push(
          txt(
            '×',
            17, GOLD,
            xx + 0.58,
            yy - dy / 2,
            true
          )
        );
      }
    }

    parts.push(
      heading(
        'All twenty days must be alarm-free',
        C.green
      ),

      txt(
        '20 factors, all multiplied together',
        18, C.muted,
        CX,
        y - 1.5 * dy - 0.58
      ),

      tag(
        '0.95²⁰',
        C.green,
        CX,
        y - 1.5 * dy - 1.10,
        22
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Probability shrinks with each additional independent day.
  // The vertical bar height is 0.95^k.
  // ------------------------------------------------------------

  function survivalBars() {
    const w = P ? 6.45 : 6.75;
    const y = BASE;

    const h = P ? 3.05 : 2.50;

    const dx = w / 21;
    const bw = dx * 0.76;

    const x = k =>
      CX - w / 2 + (k + 0.5) * dx;

    const parts = [
      line(
        CX - w / 2, y,
        CX + w / 2, y,
        C.muted, 2
      )
    ];

    for (let k = 0; k <= 20; k++) {
      const prob = Math.pow(NO_ALARM, k);
      const bh = h * prob;

      const color = k === 20
        ? GOLD
        : C.green;

      const r = new M.Rectangle({
        width: bw,
        height: bh,
        color,
        strokeWidth: 1
      });

      r.setFill(
        color,
        k === 20 ? 0.95 : 0.65
      );

      r.moveTo([
        x(k),
        y + bh / 2,
        0
      ]);

      parts.push(r);

      if (k % 5 === 0) {
        parts.push(
          txt(
            String(k),
            16, C.muted,
            x(k), y - 0.28,
            true
          )
        );
      }
    }

    parts.push(
      txt(
        'Independent daily inspections',
        17, C.muted,
        CX, y - 0.72
      ),

      txt(
        '100%',
        18, C.green,
        x(0) + 0.32,
        y + h + 0.27,
        true
      ),

      tag(
        '36%',
        GOLD,
        x(20) - 0.15,
        y + h * NONE_20 + 0.43,
        20
      ),

      txt(
        'Chance of no false alarms so far',
        19, C.green,
        CX,
        P ? 0.68 : 1.23
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Complement picture.
  //
  // These two outcomes exhaust all possibilities:
  //   zero false alarms
  //   one or more false alarms
  //
  // Probabilities are encoded by exact bar lengths.
  // ------------------------------------------------------------

  function complementPicture(
    showBoth = true
  ) {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.70;
    const h = P ? 0.95 : 0.88;

    const left = x - w / 2;
    const safeW = w * NONE_20;
    const alarmW = w * ANY_20;

    const boundary = left + safeW;

    const safe = new M.Rectangle({
      width: safeW,
      height: h,
      color: C.green,
      strokeWidth: 1
    });

    safe.setFill(
      C.green, 0.80
    );

    safe.moveTo([
      left + safeW / 2,
      y,
      0
    ]);

    const other = new M.Rectangle({
      width: alarmW,
      height: h,
      color: showBoth ? RED : C.muted,
      strokeWidth: 1
    });

    other.setFill(
      showBoth ? RED : C.muted,
      showBoth ? 0.80 : 0.15
    );

    other.moveTo([
      boundary + alarmW / 2,
      y,
      0
    ]);

    const parts = [
      safe,
      other,

      txt(
        '20 INDEPENDENT DAYS',
        22, C.ink,
        x, y + 1.50,
        true
      ),

      txt(
        '36%',
        30, C.ink,
        left + safeW / 2,
        y,
        true, safeW - 0.20
      ),

      txt(
        'NO FALSE ALARMS',
        17, C.green,
        left + safeW / 2,
        y - 0.85,
        true, safeW + 0.10
      ),

      txt(
        '0',
        16, C.muted,
        left,
        y + 0.70,
        true
      ),

      txt(
        '100%',
        16, C.muted,
        left + w,
        y + 0.70,
        true
      )
    ];

    if (showBoth) {
      parts.push(
        txt(
          '64%',
          30, C.ink,
          boundary + alarmW / 2,
          y,
          true
        ),

        txt(
          'AT LEAST ONE FALSE ALARM',
          17, RED,
          boundary + alarmW / 2,
          y - 0.85,
          true, alarmW - 0.10
        ),

        txt(
          '36% + 64% = 100%',
          21, C.ink,
          x,
          y - 1.45,
          true
        )
      );
    } else {
      parts.push(
        txt(
          '?',
          30, C.muted,
          boundary + alarmW / 2,
          y,
          true
        ),

        txt(
          'All remaining possibilities',
          17, C.muted,
          boundary + alarmW / 2,
          y - 0.85,
          false, alarmW - 0.10
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Probability of at least one false alarm over time.
  // Selected day counts use the exact formula 1 - 0.95^k.
  // ------------------------------------------------------------

  function accumulatingRisk() {
    const w = P ? 6.40 : 6.75;
    const y = BASE;
    const h = P ? 3.10 : 2.45;

    const x = k =>
      CX - w / 2 + k / 20 * w;

    const f = k =>
      1 - Math.pow(NO_ALARM, k);

    const parts = [
      line(
        x(0), y,
        x(20), y,
        C.muted, 2.5
      ),

      line(
        x(0), y,
        x(0), y + h,
        C.muted, 2
      ),

      dashed(
        x(0), y + h * 0.50,
        x(20), y + h * 0.50,
        GOLD
      ),

      txt(
        '50%',
        16, GOLD,
        x(0) + 0.36,
        y + h * 0.50 + 0.22,
        true
      )
    ];

    for (let i = 0; i < 80; i++) {
      const a = 20 * i / 80;
      const b = 20 * (i + 1) / 80;

      parts.push(
        line(
          x(a), y + h * f(a),
          x(b), y + h * f(b),
          RED, 3
        )
      );
    }

    [1, 5, 10, 15, 20].forEach(k => {
      const prob = f(k);

      parts.push(
        glowDot(
          x(k),
          y + h * prob,
          RED,
          k === 20 ? 0.12 : 0.075
        ),

        txt(
          String(k),
          16, C.muted,
          x(k), y - 0.30,
          true
        )
      );
    });

    parts.push(
      tag(
        '64%',
        RED,
        x(20) - 0.38,
        y + h * ANY_20 + 0.45,
        21
      ),

      txt(
        'Number of independent inspections',
        17, C.muted,
        CX, y - 0.74
      ),

      heading(
        'Chance of at least one false alarm',
        RED
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Follow-up inspection picture.
  // This illustrates a single isolated alarm, not a prediction
  // that alarms occur on a particular day.
  // ------------------------------------------------------------

  function followupPicture() {
    const x = CX;
    const y = CY;

    const w = P ? 1.78 : 1.90;
    const h = P ? 2.35 : 2.30;

    const dx = P ? 2.10 : 2.22;

    const parts = [];

    const outcomes = [
      { name: 'DAY 1', alarm: false },
      { name: 'DAY 2', alarm: true },
      { name: 'DAY 3', alarm: false }
    ];

    outcomes.forEach((d, i) => {
      const xx = x + (i - 1) * dx;

      const color = d.alarm
        ? RED
        : C.cyan;

      parts.push(
        rect(
          xx, y,
          w, h,
          color, C.card, 0.95
        ),

        txt(
          d.name,
          17, C.muted,
          xx,
          y + h / 2 - 0.30,
          true
        ),

        alarm(
          xx,
          y + 0.06,
          d.alarm,
          0.51
        ),

        txt(
          d.alarm ? 'ALARM' : 'NO ALARM',
          16, color,
          xx,
          y - h / 2 + 0.28,
          true, w - 0.20
        )
      );
    });

    parts.push(
      txt(
        'Illustrative sequence: one isolated alarm',
        17, C.muted,
        x,
        y - h / 2 - 0.40
      ),

      tag(
        'INVESTIGATE AND FOLLOW UP',
        GOLD,
        x,
        y - h / 2 - 0.92,
        17
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Preview the opposite error.
  // A drifted machine can fail to trigger an alarm.
  // Numerical power is reserved for lesson 7.1.6.
  // ------------------------------------------------------------

  function missedDriftPreview() {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 3.80 : 3.45;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'THE OPPOSITE MISTAKE',
        22, C.violet,
        x,
        y + h / 2 - 0.38,
        true, w - 0.5
      ),

      bottle(
        x - 1.65,
        y + 0.10,
        1.05,
        0.88,
        '500 g',
        C.violet
      ),

      txt(
        'Real drift',
        20, C.violet,
        x - 1.65,
        y - 0.83
      ),

      alarm(
        x + 1.65,
        y + 0.15,
        false,
        0.77
      ),

      txt(
        'No alarm',
        20, C.muted,
        x + 1.65,
        y - 0.83
      ),

      txt(
        'What if the test misses a real problem?',
        20, C.ink,
        x,
        y - h / 2 + 0.28,
        false, w - 0.5
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
    const h = P ? 4.30 : 3.70;

    return new M.VGroup(
      rect(
        x, y,
        w, h,
        RED, C.card, 0.95
      ),

      txt(
        'TYPE I ERROR',
        27, RED,
        x,
        y + h / 2 - 0.45,
        true
      ),

      txt(
        'A false alarm',
        26, RED,
        x,
        y + 0.73
      ),

      txt(
        'Reject H₀ when H₀ is true.',
        22, C.ink,
        x,
        y + 0.10,
        false, w - 0.55
      ),

      txt(
        'P(false alarm | H₀) = α',
        24, GOLD,
        x,
        y - 0.52,
        true, w - 0.55
      ),

      txt(
        'Here: α = 0.05',
        24, GOLD,
        x,
        y - 1.04,
        true
      ),

      txt(
        'Five in a hundred, in the long run',
        17, C.muted,
        x,
        y - h / 2 + 0.28,
        false, w - 0.55
      )
    );
  }

  // ============================================================
  // 0. Recap the morning batch and its statistical alarm.
  // ============================================================

  await until(S(0));
  await play(
    ...scene([
      ['morning', morningAlarm()]
    ]),

    ...fbox([
      'Morning batch',
      'Mean = 502 g',
      'z = +2',
      ['p ≈ 0.046 < 0.05', RED],
      ['Reject H₀', RED]
    ], RED),

    ...say('OUR TEST RAISED AN ALARM', RED)
  );

  // ============================================================
  // 1. What if the machine was fine all along?
  // Introduce this as a hypothetical truth, not a known fact
  // about the actual morning inspection.
  // ============================================================

  await until(S(1));
  await play(
    ...scene([
      ['machine', perfectMachine(true, null)]
    ]),

    ...fbox([
      ['What if H₀ is true?', GOLD],
      'True mean = 500 g',
      'Could an alarm still occur?'
    ], GOLD),

    ...say('WHAT IF THE MACHINE WAS FINE?', GOLD)
  );

  // ============================================================
  // 2. Alarm plus healthy machine = false alarm.
  // ============================================================

  await until(S(2));
  await play(
    ...scene([
      ['truth', truthDecision(500, true)]
    ]),

    ...fbox([
      ['Machine is healthy', GOLD],
      ['Test raises an alarm', RED],
      ['FALSE ALARM', RED]
    ], RED),

    ...say('THAT WOULD BE A FALSE ALARM', RED)
  );

  // ============================================================
  // 3. Introduce simulation.
  // ============================================================

  await until(S(3));
  await play(
    ...scene([
      ['computer', computerPicture()]
    ]),

    ...fbox([
      'Simulation',
      'Set a known truth.',
      'Pretend many times.',
      ['Count the outcomes.', C.cyan]
    ]),

    ...say('SIMULATION = PRETEND WITH KNOWN TRUTH')
  );

  // ============================================================
  // 4. Set the simulated machine's true mean to 500 grams.
  // ============================================================

  await until(S(4));
  await play(
    ...scene([
      ['machine', perfectMachine(true, null)]
    ]),

    ...fbox([
      'Simulated machine',
      ['True mean = 500 g', GOLD],
      ['H₀ is true by design', GOLD]
    ], GOLD),

    ...say('BUILD A PERFECT MACHINE: MEAN = 500 g', GOLD)
  );

  // ============================================================
  // 5. Preserve the real machine's known spread of 4 grams.
  // ============================================================

  await until(S(5));
  await play(
    ...scene([
      ['bottleSpread', bottleDistribution()]
    ]),

    ...fbox([
      ['True mean = 500 g', GOLD],
      'Individual bottles vary.',
      ['Known SD = 4 g', C.cyan]
    ]),

    ...say('SAME BOTTLE SPREAD: 4 GRAMS')
  );

  // ============================================================
  // 6. One inspection: sixteen bottles, one z.
  // ============================================================

  await until(S(6));
  await play(
    ...scene([
      ['inspection', inspectionPicture()]
    ]),

    ...fbox([
      'n = 16',
      'SE = 4 ÷ √16 = 1 g',
      'z = (mean − 500) ÷ 1',
      ['Apply two-sided rule', C.green]
    ], C.green),

    ...say('ONE INSPECTION: 16 BOTTLES → ONE z')
  );

  // ============================================================
  // 7. Alarm rule: outside ±1.96.
  // ============================================================

  await until(S(7));
  await play(
    ...scene([
      [
        'graph',
        graph(
          CUT,
          true,
          false,
          'Two-sided alarm rule'
        )
      ]
    ]),

    ...fbox([
      'Raise an alarm if:',
      ['z < −1.96', RED],
      'or',
      ['z > +1.96', RED]
    ], RED),

    ...say('ALARM IF z IS BEYOND ±1.96', RED)
  );

  // ============================================================
  // 8. Most inspections produce ordinary results.
  // Show one ordinary result from the reproducible simulation.
  // ============================================================

  await until(S(8));
  await play(
    ...put(
      'result',
      resultMarker(
        EXAMPLE_Z,
        C.green,
        `z = ${signed(EXAMPLE_Z)}`
      )
    ),

    ...fbox([
      ['One simulated inspection', C.muted],
      `z = ${signed(EXAMPLE_Z)}`,
      'Inside the cut-offs.',
      ['NO ALARM — CORRECT', C.green]
    ], C.green),

    ...say('MOST INSPECTIONS: NO ALARM', C.green)
  );

  // ============================================================
  // 9-10. Run one thousand simulated inspections.
  // Red dots are actual threshold crossings in the seeded run.
  //
  // Build the grid in four batches of 250.
  // Each play is awaited before the next one begins.
  // ============================================================

  const chunks = [
    simulationChunk(0, 250),
    simulationChunk(250, 500),
    simulationChunk(500, 750),
    simulationChunk(750, 1000)
  ];

  await until(S(9));

  const gridStart = clear();

  const frame = gridFrame();

  layers.set('gridFrame', frame);
  layers.set('chunk0', chunks[0]);

  await play(
    ...gridStart,

    new M.FadeIn(frame),

    new M.FadeIn(chunks[0]),

    ...put(
      'counter',
      counter(250)
    ),

    ...fbox([
      'Simulate 1,000 inspections.',
      'Each dot = one inspection.',
      ['Red = false alarm', RED]
    ], RED),

    ...say('RUN 1,000 INSPECTIONS')
  );

  layers.set('chunk1', chunks[1]);

  await play(
    new M.FadeIn(chunks[1]),

    ...put(
      'counter',
      counter(500)
    )
  );

  layers.set('chunk2', chunks[2]);

  await play(
    new M.FadeIn(chunks[2]),

    ...put(
      'counter',
      counter(750)
    )
  );

  // 10. Watch the counter reach one thousand.

  await until(S(10));

  layers.set('chunk3', chunks[3]);

  await play(
    new M.FadeIn(chunks[3]),

    ...put(
      'counter',
      counter(1000)
    ),

    ...say('250 → 500 → 750 → 1,000')
  );

  // ============================================================
  // 11. Exactly 50 false alarms in this illustrative seeded run.
  // Other runs can give different counts.
  // ============================================================

  await until(S(11));
  await play(
    ...put(
      'rings',
      alarmRings()
    ),

    ...fbox([
      `Inspections = ${SIM_N}`,
      [`No alarms   = ${NO_ALARM_COUNT}`, C.cyan],
      [`False alarms = ${ALARM_COUNT}`, RED],
      ['One simulated run', C.muted]
    ], RED),

    ...say(`${ALARM_COUNT} RED DOTS OUT OF 1,000`, RED)
  );

  // ============================================================
  // 12. Translate the proportion into familiar frequencies.
  // ============================================================

  await until(S(12));
  await play(
    ...scene([
      ['frequency', oneInTwenty()]
    ]),

    ...fbox([
      '50 ÷ 1,000 = 0.05',
      ['= 5 in 100', RED],
      ['= 1 in 20', RED]
    ], RED),

    ...say('FIVE IN A HUNDRED = ONE IN TWENTY', RED)
  );

  // ============================================================
  // 13. Every red dot is a mistake.
  // The machine's simulated true mean was exactly 500 g.
  // ============================================================

  await until(S(13));
  await play(
    ...scene([
      ['truth', truthDecision(500, true)]
    ]),

    ...fbox([
      ['Known truth: H₀ is true', GOLD],
      ['Test decision: reject H₀', RED],
      ['That decision is wrong.', RED]
    ], RED),

    ...say('EVERY RED DOT IS A FALSE ALARM', RED)
  );

  // ============================================================
  // 14. Name the mistake: Type I error.
  // ============================================================

  await until(S(14));
  await play(
    ...scene([
      ['typeOne', typeOneCard(true)]
    ]),

    ...fbox([
      ['Type I error', RED],
      'Also called:',
      ['False alarm', RED]
    ], RED),

    ...say('THIS IS CALLED A TYPE I ERROR', RED)
  );

  // ============================================================
  // 15. Formal definition, in plain language.
  // ============================================================

  await until(S(15));
  await play(
    ...indicate('typeOne', RED),

    ...fbox([
      'Type I error',
      ['H₀ is true', GOLD],
      ['We reject H₀', RED],
      '= false alarm'
    ], RED),

    ...say('REJECTING A TRUE NULL = TYPE I ERROR', RED)
  );

  // ============================================================
  // 16. Return to the normal curve.
  // Every red result crossed one of the two alarm cut-offs.
  // ============================================================

  await until(S(16));
  await play(
    ...scene([
      [
        'graph',
        graph(
          CUT,
          true,
          false,
          'Every alarm is outside ±1.96'
        )
      ]
    ]),

    ...fbox([
      ['True mean = 500 g', GOLD],
      'Red if z < −1.96',
      'or z > +1.96',
      ['These are false alarms.', RED]
    ], RED),

    ...say('RED DOTS COME FROM THE TWO EXTREME TAILS', RED)
  );

  // ============================================================
  // 17. The two tails contain five percent by design.
  // ============================================================

  await until(S(17));
  await play(
    ...put(
      'tailLabels',
      new M.VGroup(
        tailLabel(
          'left',
          '2.5%'
        ),

        tailLabel(
          'right',
          '2.5%'
        )
      )
    ),

    ...fbox([
      ['Left tail  = 2.5%', RED],
      ['Right tail = 2.5%', RED],
      ['Total      = 5%', GOLD]
    ], GOLD),

    ...say('THE TWO TAILS HOLD 5% BY DESIGN', GOLD)
  );

  // ============================================================
  // 18. False-alarm chance equals the chosen significance level.
  // ============================================================

  await until(S(18));
  await play(
    ...indicate(
      'tailLabels',
      RED
    ),

    ...fbox([
      'When H₀ is true:',
      ['P(false alarm)', RED],
      '= significance level',
      ['= 0.05', GOLD]
    ], GOLD),

    ...say('FALSE-ALARM CHANCE = SIGNIFICANCE LEVEL', GOLD)
  );

  // ============================================================
  // 19. Introduce the Greek letter alpha.
  // ============================================================

  await until(S(19));
  await play(
    ...put(
      'alpha',
      tag(
        'α = 0.05',
        GOLD,
        CX,
        P ? -4.75 : -3.2,
        25
      )
    ),

    ...fbox([
      'α = alpha',
      'Significance level',
      ['α = 0.05 = 5%', GOLD]
    ], GOLD),

    ...say('ALPHA IS THE SIGNIFICANCE LEVEL', GOLD)
  );

  // ============================================================
  // 20. Short formula for a Type I error.
  // The conditioning on a true null is essential.
  // ============================================================

  await until(S(20));
  await play(
    ...fbox([
      ['If H₀ is true:', GOLD],
      'P(Type I error)',
      '= P(reject H₀ | H₀ true)',
      ['= α', GOLD]
    ], GOLD),

    ...say('P(TYPE I ERROR | H₀ TRUE) = α', GOLD)
  );

  // ============================================================
  // 21. Alpha is a design choice made in advance.
  // ============================================================

  await until(S(21));
  await play(
    ...scene([
      [
        'budget',
        oneInTwenty(
          'CHOSEN FALSE-ALARM RATE',
          false
        )
      ]
    ]),

    ...fbox([
      'Choose α in advance.',
      ['α = 0.05', GOLD],
      'Accept about 5 false',
      'alarms per 100 tests.'
    ], GOLD),

    ...say('YOU CHOOSE THE FALSE-ALARM RATE', GOLD)
  );

  // ============================================================
  // 22. Smaller alpha means fewer false alarms.
  // Compare 5% with 1%, both two-sided.
  // ============================================================

  await until(S(22));
  await play(
    ...scene([
      ['comparison', alphaComparison()]
    ]),

    ...fbox([
      ['α = 0.05: 5 in 100', GOLD],
      ['α = 0.01: 1 in 100', C.green],
      'Smaller red tails',
      ['Fewer false alarms', C.green]
    ], C.green),

    ...say('SMALLER ALPHA: FEWER FALSE ALARMS', C.green)
  );

  // ============================================================
  // 23. The trade-off: a stricter alarm threshold can make
  // a genuine drift harder to detect.
  // ============================================================

  await until(S(23));
  await play(
    ...scene([
      ['tradeoff', detectionTradeoff()]
    ]),

    ...fbox([
      'Smaller α',
      'Cut-offs farther out',
      ['Fewer false alarms', C.green],
      ['Harder to catch real drift', C.violet]
    ], C.violet),

    ...say('BUT REAL DRIFTS BECOME HARDER TO CATCH', C.violet)
  );

  // ============================================================
  // 24. Practical meaning of alpha.
  // ============================================================

  await until(S(24));
  await play(
    ...scene([
      [
        'graph',
        graph(
          CUT,
          true,
          true,
          'False alarms on a healthy machine'
        )
      ]
    ]),

    ...fbox([
      ['When the machine is fine:', GOLD],
      'How often will the test',
      'raise a false alarm?',
      ['Answer: α', RED]
    ], GOLD),

    ...say('ALPHA TELLS US HOW OFTEN FALSE ALARMS OCCUR', GOLD)
  );

  // ============================================================
  // 25. Factory planning: roughly one in twenty inspections.
  // This is an expected rate, not a regular schedule.
  // ============================================================

  await until(S(25));
  await play(
    ...scene([
      ['planning', oneInTwenty()]
    ]),

    ...fbox([
      ['Healthy machine', GOLD],
      'False-alarm rate = 5%',
      ['About 1 in 20 tests', RED],
      'Not necessarily every 20th.'
    ], GOLD),

    ...say('PLAN FOR ABOUT ONE FALSE ALARM IN TWENTY', RED)
  );

  // ============================================================
  // 26. Trap: repeated testing accumulates false-alarm risk.
  // ============================================================

  await until(S(26));
  await play(
    ...scene([
      ['risk', accumulatingRisk()]
    ]),

    ...fbox([
      ['COMMON TRAP', RED],
      'One test: 5% risk',
      'Many tests:',
      ['Risk accumulates.', RED]
    ], RED),

    ...say('TRAP: MANY TESTS PILE UP FALSE ALARMS', RED)
  );

  // ============================================================
  // 27. Twenty days, one independent inspection per day.
  // ============================================================

  await until(S(27));
  await play(
    ...scene([
      ['calendar', calendar('unknown')]
    ]),

    ...fbox([
      '20 days',
      '1 inspection per day',
      ['True mean = 500 g', GOLD],
      'Machine healthy throughout.'
    ], GOLD),

    ...say('INSPECT A PERFECT MACHINE FOR 20 DAYS')
  );

  // ============================================================
  // 28. Each day has its own five-percent chance of a false alarm.
  // ============================================================

  await until(S(28));
  await play(
    ...put(
      'calendar',
      calendar('chance')
    ),

    ...fbox([
      'Every day',
      ['P(false alarm) = 0.05', RED],
      ['= 1 in 20', RED]
    ], RED),

    ...say('EACH DAY HAS A 5% FALSE-ALARM CHANCE', RED)
  );

  // ============================================================
  // 29. Complement on a single day.
  // Probability of no false alarm is 0.95.
  // ============================================================

  await until(S(29));
  await play(
    ...scene([
      [
        'daily',
        dailyProbability('safe')
      ]
    ]),

    ...fbox([
      'P(no false alarm)',
      '= 1 − 0.05',
      ['= 0.95', C.green],
      ['= 95%', C.green]
    ], C.green),

    ...say('ONE DAY WITHOUT A FALSE ALARM: 95%', C.green)
  );

  // ============================================================
  // 30. Independent daily inspections.
  // Their joint no-alarm probabilities multiply.
  // ============================================================

  await until(S(30));
  await play(
    ...scene([
      ['independent', independencePicture()]
    ]),

    ...fbox([
      'Independent days',
      'One day does not change',
      'the next day’s chance.',
      ['Multiply probabilities.', GOLD]
    ], GOLD),

    ...say('INDEPENDENT EVENTS: MULTIPLY THEIR CHANCES', GOLD)
  );

  // ============================================================
  // 31. No false alarms across all twenty days.
  // Multiply twenty copies of 0.95.
  // ============================================================

  await until(S(31));
  await play(
    ...scene([
      ['multiplication', multiplicationPicture()]
    ]),

    ...fbox([
      'No false alarms in 20 days',
      '= 0.95 × 0.95 × ...',
      '  (20 factors)',
      ['= 0.95²⁰', C.green]
    ], C.green),

    ...say('MULTIPLY TWENTY COPIES OF 0.95', C.green)
  );

  // ============================================================
  // 32. Probability of zero false alarms is about 36%.
  // ============================================================

  await until(S(32));
  await play(
    ...scene([
      ['survival', survivalBars()]
    ]),

    ...fbox([
      'P(no false alarms)',
      '= 0.95²⁰',
      `≈ ${NONE_20.toFixed(4)}`,
      ['≈ 36%', C.green]
    ], C.green),

    ...say('NO FALSE ALARMS IN 20 DAYS: ABOUT 36%', C.green)
  );

  // ============================================================
  // 33. Complement: at least one false alarm.
  // 1 − 0.95^20 ≈ 0.6415.
  // ============================================================

  await until(S(33));
  await play(
    ...scene([
      [
        'complement',
        complementPicture(true)
      ]
    ]),

    ...fbox([
      'P(at least one false alarm)',
      '= 1 − 0.95²⁰',
      `≈ ${ANY_20.toFixed(4)}`,
      ['≈ 64%', RED]
    ], RED),

    ...say('AT LEAST ONE FALSE ALARM: ABOUT 64%', RED)
  );

  // ============================================================
  // 34. More likely than not.
  // Even a healthy machine will often be blamed at least once.
  // ============================================================

  await until(S(34));
  await play(
    ...indicate(
      'complement',
      RED
    ),

    ...fbox([
      ['64% > 50%', RED],
      'More likely than not',
      'to get at least one alarm.',
      ['Even with H₀ true!', GOLD]
    ], RED),

    ...say('MORE LIKELY THAN NOT, EVEN IF THE MACHINE IS FINE', RED)
  );

  // ============================================================
  // 35. Isolated alarms across many inspections need context.
  // Follow up rather than treating one marginal alarm as proof.
  // ============================================================

  await until(S(35));
  await play(
    ...scene([
      ['followup', followupPicture()]
    ]),

    ...fbox([
      'Many inspections',
      'One marginal alarm',
      'may be a false alarm.',
      ['Investigate and follow up.', GOLD]
    ], GOLD),

    ...say('LOOK FOR REPEATED EVIDENCE IN LATER INSPECTIONS', GOLD)
  );

  // ============================================================
  // 36. Preview the opposite mistake.
  // Missing a genuine drift.
  // ============================================================

  await until(S(36));
  await play(
    ...scene([
      ['preview', missedDriftPreview()]
    ]),

    ...fbox([
      'Type I: false alarm',
      'What about the opposite?',
      ['A real drift goes unnoticed.', C.violet],
      'Next lesson'
    ], C.violet),

    ...say('NEXT: MISSING A REAL DRIFT', C.violet)
  );

  // ============================================================
  // 37. Final recap.
  // Type I error is rejecting a true null.
  // Its probability is the chosen significance level.
  // ============================================================

  await until(S(37));
  await play(
    ...scene([
      ['recap', finalRecap()]
    ]),

    ...fbox([
      ['Type I error = false alarm', RED],
      'Reject H₀ when H₀ is true.',
      ['P(Type I error | H₀) = α', GOLD],
      ['Here α = 0.05', GOLD]
    ], GOLD),

    ...say('TYPE I ERROR = FALSE ALARM; ITS CHANCE IS ALPHA', RED)
  );
}

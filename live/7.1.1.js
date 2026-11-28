// lesson 7.1.1
// Null and alternative hypotheses.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Historical distributions and hypothetical inspections are illustrative.
// The actual morning batch remains unweighed throughout this lesson.
// Browser rendering and narration sync have not been runtime-tested here.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ------------------------------------------------------------
  // Layout: same laptop / phone conventions as the reference.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.62, 0] : [4.3, -0.3, 0];

  const CY = P ? -1.15 : -0.45;
  const BASE = P ? -3.4 : -1.85;
  const GOLD = C.amber;
  const RED = C.red || '#ff647c';

  const TARGET = 500;
  const SPREAD = 4;
  const N = 16;

  const say = (s, c = C.cyan, split = false) =>
    showA(s, c, split ? PILL : [0, PILL[1], 0]);

  // ------------------------------------------------------------
  // Drawing helpers.
  // All groups are assembled before being placed on screen.
  // ------------------------------------------------------------

  function txt(s, size, color, x, y, mono = false, maxw = FW - 1) {
    const t = T(s, size, color, mono);
    if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(x, y, w, h, color, fill = C.card, opacity = 0.95, radius = 0.15) {
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

  function arrow(x1, y1, x2, y2, color = C.cyan, sw = 3) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.18;
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

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });
    dot.setFill(color, 1);

    return new M.VGroup(halo, dot);
  }

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);
    const maxw = P ? FW - 1 : 11.8;
    if (p.getWidth() > maxw) p.scale(maxw / p.getWidth());
    p.moveTo([x, y, 0]);
    return p;
  }

  // ------------------------------------------------------------
  // Scene layers.
  // Never regroup objects already on screen.
  // Every helper returns animations for the current beat's play().
  // ------------------------------------------------------------

  const layers = new Map();

  function put(key, obj) {
    const a = [];
    if (layers.has(key)) a.push(new M.FadeOut(layers.get(key)));
    layers.set(key, obj);
    a.push(new M.FadeIn(obj));
    return a;
  }

  function morph(key, target, options = {}) {
    if (!layers.has(key)) return put(key, target);
    return [new M.Transform(layers.get(key), target, options)];
  }

  function clear() {
    const a = Array.from(layers.values()).map(o => new M.FadeOut(o));
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

  // ------------------------------------------------------------
  // Formula box: same treatment as the approved reference.
  // ------------------------------------------------------------

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
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
      const ind = cw *
        (rows[i][0].length - rows[i][0].trimStart().length);

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

    if (factor < 1) g.scale(factor);
    g.moveTo(BOXP);

    return put('formula', g);
  }

  // ------------------------------------------------------------
  // Shared bottle, filling machine and scale.
  // Bottle fill differences are deliberately exaggerated.
  // ------------------------------------------------------------

  function bottle(x, y, s = 1, fill = 0.72, label = '', color = C.cyan) {
    const w = 0.56 * s;
    const h = 1.12 * s;

    const halo = rect(
      x, y,
      w + 0.12 * s,
      h + 0.10 * s,
      color, color, 0.07, 0.13 * s
    );
    halo.setFill(color, 0.07);

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

      const lab = txt(
        label, Math.max(9, 13 * s), C.ink,
        x, y - 0.06 * s, true, 0.40 * s
      );

      parts.push(backing, lab);
    }

    return new M.VGroup(...parts);
  }

  const FACTORY_Y = P ? -0.7 : 0;
  const BELT_Y = FACTORY_Y - 2.0;
  const BOTTLE_Y = FACTORY_Y - 1.32;
  const BOTTLE_X = P ? [-2.0, -0.65, 0.7, 2.05] : [-2.35, -0.8, 0.75, 2.3];

  function factory() {
    const x = BOTTLE_X[0];
    const y = FACTORY_Y;

    const tank = rect(
      x, y + 0.55,
      1.65, 1.02,
      C.cyan, C.card, 0.95
    );

    const tankLabel = txt(
      'JUICE', 19, C.cyan,
      x, y + 0.55, true, 1.30
    );

    const nozzle = rect(
      x, y - 0.12,
      0.26, 0.42,
      C.muted, C.card, 1, 0.04
    );

    const stream = line(
      x, y - 0.34,
      x, y - 0.56,
      C.cyan, 5
    );

    const support = line(
      x - 1.0, y + 0.65,
      x - 1.0, BELT_Y,
      C.muted, 4
    );

    const crossbar = line(
      x - 1.0, y + 0.65,
      x - 0.82, y + 0.65,
      C.muted, 4
    );

    const belt = rect(
      0, BELT_Y,
      P ? 5.9 : 6.35, 0.22,
      C.muted, C.card, 1, 0.08
    );

    const rollers = Array.from({ length: 10 }, (_, i) => {
      const r = new M.Circle({
        radius: 0.065,
        color: C.muted
      });
      r.setFill(C.muted, 0.45);
      r.moveTo([(P ? -2.65 : -2.85) + i * (P ? 0.59 : 0.63), BELT_Y, 0]);
      return r;
    });

    const direction = arrow(
      -1.05, BELT_Y - 0.42,
      1.05, BELT_Y - 0.42,
      C.muted, 2
    );

    return new M.VGroup(
      support, crossbar, tank, tankLabel,
      nozzle, stream, belt, ...rollers, direction
    );
  }

  function factoryBottles(fills, labelled = false) {
    return new M.VGroup(
      ...BOTTLE_X.map((x, i) =>
        bottle(
          x, BOTTLE_Y, 0.88,
          fills[i],
          labelled && !P ? '500 g' : ''
        )
      )
    );
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
      x, y, true, 0.9 * s
    );

    return new M.VGroup(body, platform, screen, reading);
  }

  // ------------------------------------------------------------
  // A batch of exactly sixteen bottles.
  // No individual weight or morning batch mean is revealed.
  // ------------------------------------------------------------

  function tray(x, y, color = C.cyan, compact = false) {
    const s = compact ? 0.27 : 0.36;
    const dx = compact ? 0.46 : 0.60;
    const dy = compact ? 0.42 : 0.56;
    const w = compact ? 2.40 : 3.05;
    const h = compact ? 2.02 : 2.70;

    const frame = rect(
      x, y, w, h,
      color, C.card, 0.85
    );

    const bottles = Array.from({ length: N }, (_, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);

      return bottle(
        x + (col - 1.5) * dx,
        y + (1.5 - row) * dy - 0.05,
        s, 0.72, '', color
      );
    });

    const label = txt(
      '16 BOTTLES',
      compact ? 17 : 20,
      color, x, y + h / 2 + 0.28,
      true, w + 0.2
    );

    return new M.VGroup(frame, ...bottles, label);
  }

  // ------------------------------------------------------------
  // Number lines and normal curves.
  // Drawn with primitives supported by the reference engine.
  // ------------------------------------------------------------

  function axis(cx, width, y, lo, hi, ticks, unit) {
    const x = v => cx - width / 2 + (v - lo) / (hi - lo) * width;

    const parts = [
      line(x(lo), y, x(hi), y, C.muted, 2.5)
    ];

    ticks.forEach(v => {
      parts.push(
        line(x(v), y - 0.075, x(v), y + 0.075, C.muted),
        txt(
          String(v), P ? 17 : 18, C.muted,
          x(v), y - 0.31, true
        )
      );
    });

    parts.push(
      txt(unit, 17, C.muted, cx, y - 0.74, false, width)
    );

    return {
      x, y, lo, hi, width, cx,
      group: new M.VGroup(...parts)
    };
  }

  function bell(A, mean, spread, height, color = C.cyan) {
    const n = 72;
    const parts = [];

    const point = v => [
      A.x(v),
      A.y + height * Math.exp(-0.5 * ((v - mean) / spread) ** 2)
    ];

    for (let i = 0; i < n; i++) {
      const v1 = A.lo + (A.hi - A.lo) * i / n;
      const v2 = A.lo + (A.hi - A.lo) * (i + 1) / n;

      const a = point(v1);
      const b = point(v2);

      parts.push(
        line(a[0], a[1], b[0], b[1], color, 2.8)
      );
    }

    return new M.VGroup(...parts);
  }

  function bellFill(A, mean, spread, height, color = C.cyan) {
    const n = 64;
    const step = (A.hi - A.lo) / n;
    const bw = A.width / n;
    const bars = [];

    for (let i = 0; i < n; i++) {
      const v = A.lo + (i + 0.5) * step;
      const h = Math.max(
        0.005,
        height * Math.exp(-0.5 * ((v - mean) / spread) ** 2)
      );

      const b = new M.Rectangle({
        width: bw * 1.02,
        height: h,
        color,
        strokeWidth: 0
      });

      b.setFill(color, 0.13);
      b.moveTo([A.x(v), A.y + h / 2, 0]);
      bars.push(b);
    }

    return new M.VGroup(
      ...bars,
      bell(A, mean, spread, height, color)
    );
  }

  function markerLine(A, value, height, color = GOLD) {
    return line(
      A.x(value), A.y - 0.06,
      A.x(value), A.y + height,
      color, 3.5
    );
  }

  // Historical bottle weights: spread of 4 grams.

  const HIST = axis(
    0,
    P ? 6.55 : 10.0,
    P ? -3.0 : -1.85,
    484, 516,
    [484, 492, 500, 508, 516],
    'individual bottle weights (grams)'
  );

  const HIST_H = P ? 2.65 : 2.05;

  function historicalTitle(s) {
    return txt(
      s, P ? 22 : 23, C.ink,
      0, P ? 0.85 : 1.03,
      false, FW - 1.2
    );
  }

  function spreadMark() {
    const y = HIST.y + 0.57;

    return new M.VGroup(
      line(HIST.x(TARGET), y, HIST.x(TARGET + SPREAD), y, C.amber, 3),
      line(HIST.x(TARGET), y - 0.10, HIST.x(TARGET), y + 0.10, C.amber),
      line(
        HIST.x(TARGET + SPREAD), y - 0.10,
        HIST.x(TARGET + SPREAD), y + 0.10, C.amber
      ),
      txt(
        '4 g',
        18, C.amber,
        (HIST.x(TARGET) + HIST.x(TARGET + SPREAD)) / 2,
        y - 0.28, true
      )
    );
  }

  function possibleDrifts() {
    const y = P ? -0.05 : 0.66;
    const left = HIST.x(496);
    const mid = HIST.x(500);
    const right = HIST.x(504);

    return new M.VGroup(
      arrow(mid - 0.12, y, left, y, C.violet),
      arrow(mid + 0.12, y, right, y, C.violet),
      txt('lower?', 18, C.violet, left - 0.35, y + 0.28),
      txt('higher?', 18, C.violet, right + 0.35, y + 0.28)
    );
  }

  // ------------------------------------------------------------
  // The two competing stories.
  // Laptop: side by side. Phone: vertically stacked.
  // ------------------------------------------------------------

  const STORY_W = P ? 6.25 : 5.35;
  const STORY_H = P ? 1.95 : 2.65;

  const STORY0 = P ? [0, 0.35] : [-3.0, -0.45];
  const STORY1 = P ? [0, -2.15] : [3.0, -0.45];

  function story(which, stage = 3) {
    const [x, y] = which === 0 ? STORY0 : STORY1;
    const color = which === 0 ? GOLD : C.violet;

    const title = stage >= 2
      ? (which === 0 ? 'NULL HYPOTHESIS' : 'ALTERNATIVE HYPOTHESIS')
      : (which === 0 ? 'STORY ONE' : 'STORY TWO');

    const r = rect(
      x, y, STORY_W, STORY_H,
      stage === 0 ? C.muted : color,
      C.card, 0.95
    );

    const head = txt(
      title, P ? 21 : 23,
      stage === 0 ? C.muted : color,
      x, y + (P ? 0.61 : 0.91),
      false, STORY_W - 0.55
    );

    if (stage === 0) {
      return new M.VGroup(
        r, head,
        txt('?', 35, C.muted, x, y - 0.15)
      );
    }

    const main = which === 0
      ? 'Nothing changed'
      : 'Something changed';

    const detail = which === 0
      ? 'Long-run average is still 500 g'
      : 'Long-run average is not 500 g';

    const result = txt(
      main, P ? 26 : 28, C.ink,
      x, y + (P ? 0.08 : 0.18),
      false, STORY_W - 0.6
    );

    const sub = txt(
      detail, P ? 19 : 20, color,
      x, y - (P ? 0.50 : 0.52),
      false, STORY_W - 0.65
    );

    const parts = [r, head, result, sub];

    if (stage >= 3 && !P) {
      parts.push(
        txt(
          which === 0 ? 'No drift' : 'Drift up or down',
          16, C.muted,
          x, y - 0.98
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Possible values of the machine's long-run mean.
  // Gold = the exact target.
  // Violet = every other possible mean, in either direction.
  // ------------------------------------------------------------

  function meanAxis(split = false) {
    return axis(
      split ? CX : 0,
      P ? 6.45 : (split ? 6.65 : 10.5),
      BASE,
      492, 508,
      [492, 496, 500, 504, 508],
      'possible long-run mean (grams)'
    );
  }

  function nullMarker(A) {
    const h = P ? 2.15 : 1.75;

    return new M.VGroup(
      markerLine(A, TARGET, h, GOLD),
      glowDot(A.x(TARGET), A.y, GOLD, 0.11),
      tag(
        '500 g',
        GOLD,
        A.x(TARGET),
        A.y + h + 0.36,
        18
      )
    );
  }

  function alternativeSides(A) {
    const y = A.y + (P ? 1.15 : 0.82);
    const x0 = A.x(TARGET);
    const xl = A.x(A.lo);
    const xr = A.x(A.hi);
    const lx = (xl + x0) / 2;
    const rx = (xr + x0) / 2;

    return new M.VGroup(
      arrow(x0 - 0.13, y, xl, y, C.violet, 4),
      arrow(x0 + 0.13, y, xr, y, C.violet, 4),

      txt(
        'BELOW 500',
        P ? 17 : 20, C.violet,
        lx, y + 0.40,
        true, (x0 - xl) - 0.35
      ),

      txt(
        'ABOVE 500',
        P ? 17 : 20, C.violet,
        rx, y + 0.40,
        true, (xr - x0) - 0.35
      )
    );
  }

  const MEAN_FULL = meanAxis(false);
  const MEAN_SPLIT = meanAxis(true);

  // ------------------------------------------------------------
  // Population versus sample.
  // Repeated days represent the long-run production process.
  // ------------------------------------------------------------

  const POP_X = P ? 0 : -3.0;
  const POP_Y = P ? -0.3 : -0.30;
  const SAMPLE_X = P ? 0 : 3.35;
  const SAMPLE_Y = P ? -4.6 : -0.55;

  function population() {
    const x = POP_X;
    const y = POP_Y;
    const w = P ? 7.0 : 5.95;
    const h = P ? 3.3 : 2.85;
    const rowGap = P ? 0.85 : 0.67;
    const bs = P ? 0.40 : 0.30;
    const bdx = P ? 0.52 : 0.38;
    const nB = P ? 8 : 9;

    const frame = rect(
      x, y, w, h,
      C.violet, C.card, 0.85
    );

    const rows = ['DAY 1', 'DAY 2', 'DAY 3'];

    const parts = [frame];

    rows.forEach((name, r) => {
      const yy = y + (P ? 1.05 : 0.77) - r * rowGap;

      parts.push(
        txt(name, P ? 17 : 15, C.muted, x - w / 2 + 0.65, yy, true)
      );

      for (let k = 0; k < nB; k++) {
        parts.push(
          bottle(
            x - w / 2 + 1.55 + k * bdx,
            yy, bs,
            0.65 + ((k * 7 + r * 3) % 5) * 0.04,
            '', C.violet
          )
        );
      }

      parts.push(
        txt(
          '…', 22, C.violet,
          x + w / 2 - 0.37, yy
        )
      );
    });

    parts.push(
      txt(
        'Day after day, into the future',
        P ? 20 : 17, C.muted,
        x, y - h / 2 + (P ? 0.32 : 0.24),
        false, w - 0.5
      )
    );

    parts.push(
      txt(
        'ALL THE MACHINE WOULD FILL',
        P ? 18 : 20, C.violet,
        x, y + h / 2 + 0.28,
        false, w + 0.25
      )
    );

    return new M.VGroup(...parts);
  }

  function evidenceLink() {
    if (P) {
      return new M.VGroup(
        arrow(0, -2.75, 0, -2.05, C.cyan, 3),
        txt('A CLUE', 18, C.cyan, 1.0, -2.4, true)
      );
    }

    return new M.VGroup(
      arrow(1.60, -0.30, 0.25, -0.30, C.cyan, 3),
      txt('A CLUE', 15, C.cyan, 0.93, 0.03, true)
    );
  }

  // ------------------------------------------------------------
  // Before-data / after-data sequence.
  // ------------------------------------------------------------

  function timeline(reversed = false) {
    const x1 = P ? -1.72 : -2.8;
    const x2 = P ? 1.72 : 2.8;
    const y = CY;
    const w = P ? 2.85 : 4.4;
    const h = P ? 2.55 : 2.55;

    const c1 = reversed ? RED : GOLD;
    const c2 = reversed ? RED : C.cyan;

    const left = rect(x1, y, w, h, c1, C.card, 0.95);
    const right = rect(x2, y, w, h, c2, C.card, 0.95);

    const l1 = txt(
      reversed ? 'LOOK FIRST' : '1. WRITE CLAIMS',
      P ? 19 : 23, c1,
      x1, y + 0.88, false, w - 0.3
    );

    const l2 = txt(
      reversed ? 'INVENT A STORY' : '2. WEIGH BOTTLES',
      P ? 19 : 23, c2,
      x2, y + 0.88, false, w - 0.3
    );

    const leftContent = reversed
      ? new M.VGroup(
          bottle(x1 - 0.55, y - 0.10, 0.64, 0.65),
          bottle(x1, y - 0.10, 0.64, 0.78),
          bottle(x1 + 0.55, y - 0.10, 0.64, 0.72),
          txt('Data already seen', 17, RED, x1, y - 0.88, false, w - 0.3)
        )
      : new M.VGroup(
          txt('No change', 20, GOLD, x1, y + 0.17, false, w - 0.4),
          txt('or', 15, C.muted, x1, y - 0.25),
          txt('Some change', 20, C.violet, x1, y - 0.67, false, w - 0.4)
        );

    const rightContent = reversed
      ? new M.VGroup(
          txt('“Just as I expected!”', 20, RED, x2, y + 0.12, false, w - 0.4),
          txt('Claim fitted to data', 17, RED, x2, y - 0.58, false, w - 0.4)
        )
      : new M.VGroup(
          bottle(x2, y + 0.19, 0.62, 0.72),
          scale(x2, y - 0.69, 0.67, '? g')
        );

    const link = arrow(
      x1 + w / 2 + 0.08, y,
      x2 - w / 2 - 0.08, y,
      reversed ? RED : C.green, 3
    );

    const note = txt(
      reversed
        ? 'The story was chosen to fit the result.'
        : 'The question is fixed before the data are seen.',
      P ? 19 : 21,
      reversed ? RED : C.green,
      0, y - h / 2 - 0.45,
      false, FW - 1
    );

    return new M.VGroup(
      left, right, l1, l2,
      leftContent, rightContent,
      link, note
    );
  }

  // ------------------------------------------------------------
  // What hypothetical batch means look like under the null.
  // The curve uses the known standard error of 1 gram.
  // No test statistic or formal cutoff is introduced here.
  // ------------------------------------------------------------

  const SAMPLE_A = axis(
    CX,
    P ? 6.45 : 6.65,
    BASE,
    496, 504,
    [496, 498, 500, 502, 504],
    'possible means of 16-bottle samples (g)'
  );

  const SAMPLE_H = P ? 2.55 : 2.0;
  const SE = SPREAD / Math.sqrt(N);

  function nullSampleCurve() {
    return new M.VGroup(
      SAMPLE_A.group,
      bellFill(SAMPLE_A, TARGET, SE, SAMPLE_H, C.cyan),
      markerLine(SAMPLE_A, TARGET, SAMPLE_H + 0.14, GOLD),
      tag(
        'IF THE NULL IS TRUE',
        GOLD,
        CX,
        SAMPLE_A.y + SAMPLE_H + 0.48,
        17
      )
    );
  }

  function hypotheticalMean(v, color) {
    const x = SAMPLE_A.x(v);
    const y = SAMPLE_A.y;

    const guide = new M.DashedLine({
      start: [x, y + 0.10, 0],
      end: [x, y + 0.75, 0],
      color
    });

    const d = glowDot(x, y + 0.12, color, 0.12);

    return new M.VGroup(guide, d);
  }

  // ------------------------------------------------------------
  // Court analogy: not guilty versus proven innocent.
  // ------------------------------------------------------------

  function verdictCard(court = false) {
    const x = 0;
    const y = CY;
    const w = P ? 6.45 : 9.2;
    const h = P ? 3.80 : 3.15;

    const r = rect(
      x, y, w, h,
      C.amber, C.card, 0.95
    );

    const a = txt(
      court ? 'NOT GUILTY' : 'DO NOT REJECT THE NULL',
      P ? 25 : 29, C.amber,
      x, y + h / 2 - 0.55,
      false, w - 0.6
    );

    const b = txt(
      '≠', 40, C.ink,
      x, y + 0.04
    );

    const c = txt(
      court ? 'PROVEN INNOCENT' : 'THE NULL IS PROVEN TRUE',
      P ? 23 : 27, C.violet,
      x, y - 0.70,
      false, w - 0.6
    );

    const d = txt(
      court
        ? 'Not enough evidence to convict'
        : 'Not enough evidence to reject',
      P ? 18 : 19, C.muted,
      x, y - h / 2 + 0.29,
      false, w - 0.55
    );

    return new M.VGroup(r, a, b, c, d);
  }

  // ============================================================
  // 0-2. One filling machine, one label, natural variation.
  // ============================================================

  await until(S(0));
  await play(
    ...scene([
      ['factory', factory()],
      ['bottles', factoryBottles([0.72, 0.72, 0.72, 0.72])]
    ]),
    ...say('ONE JUICE-FILLING MACHINE')
  );

  await until(S(1));
  await play(
    ...put(
      'bottles',
      factoryBottles([0.72, 0.72, 0.72, 0.72], true)
    ),
    ...put(
      'promise',
      tag(
        'LABEL PROMISE: 500 g',
        GOLD,
        0, FACTORY_Y + 1.28,
        18
      )
    ),
    ...say('EVERY LABEL PROMISES 500 GRAMS', GOLD)
  );

  await until(S(2));
  await play(
    ...morph(
      'bottles',
      factoryBottles([0.66, 0.78, 0.69, 0.75], true)
    ),
    ...put(
      'promise',
      txt(
        'Fill differences exaggerated for illustration',
        16, C.muted,
        0, FACTORY_Y + 1.28
      )
    ),
    ...say('A LITTLE MORE, A LITTLE LESS')
  );

  // ============================================================
  // 3-5. Historical spread and possible drift.
  // ============================================================

  await until(S(3));
  await play(
    ...scene([
      ['axis', HIST.group],
      ['curve', bellFill(HIST, TARGET, SPREAD, HIST_H)],
      ['spread', spreadMark()],
      ['heading', historicalTitle('Years of bottle-weight records')]
    ]),
    ...say('KNOWN MACHINE SPREAD = 4 g')
  );

  await until(S(4));
  await play(
    ...put(
      'question',
      glowDot(
        HIST.x(TARGET),
        HIST.y + HIST_H,
        C.amber, 0.12
      )
    ),
    ...put(
      'heading',
      historicalTitle('Has the average moved away from 500 g?')
    ),
    ...say('HAS THE MACHINE DRIFTED?', GOLD)
  );

  await until(S(5));
  await play(
    ...put(
      'driftLeft',
      bell(HIST, 496, SPREAD, HIST_H, C.violet)
    ),
    ...put(
      'driftRight',
      bell(HIST, 504, SPREAD, HIST_H, C.violet)
    ),
    ...put('directions', possibleDrifts()),
    ...put(
      'heading',
      historicalTitle('Possible changes in the average')
    ),
    ...say('DRIFT = THE AVERAGE MOVES', C.violet)
  );

  // ============================================================
  // 6-8. All future production versus a small sample.
  // ============================================================

  await until(S(6));
  await play(
    ...scene([
      ['population', population()]
    ]),
    ...say('WE CANNOT WEIGH EVERY BOTTLE', C.muted)
  );

  await until(S(7));
  await play(
    ...put('sample', tray(SAMPLE_X, SAMPLE_Y)),
    ...say('SAMPLE = 16 BOTTLES', C.cyan)
  );

  const UNWEIGHED_X = P ? 0 : -2.5;
  const UNWEIGHED_Y = P ? -0.55 : -0.50;
  const WAIT_X = P ? 0 : 3.4;
  const WAIT_Y = P ? -3.65 : -0.70;

  const unweighedTray = tray(
    UNWEIGHED_X,
    UNWEIGHED_Y
  );

  const waitingScale = new M.VGroup(
    scale(WAIT_X, WAIT_Y, 1.05, '? g'),
    tag(
      'NOT WEIGHED YET',
      GOLD,
      WAIT_X, WAIT_Y - 0.77,
      17
    )
  );

  await until(S(8));
  await play(
    ...scene([
      ['sample', unweighedTray],
      ['scale', waitingScale]
    ]),
    ...say('FIRST: WRITE THE QUESTION', GOLD)
  );

  // ============================================================
  // 9-14. The two competing stories, before notation.
  // ============================================================

  await until(S(9));
  await play(
    ...scene([
      ['story0', story(0, 0)],
      ['story1', story(1, 0)]
    ]),
    ...say('TWO POSSIBLE STORIES')
  );

  await until(S(10));
  await play(
    ...put('story0', story(0, 1)),
    ...say('STORY ONE: NOTHING CHANGED', GOLD)
  );

  await until(S(11));
  await play(
    ...put('story1', story(1, 1)),
    ...say('STORY TWO: SOMETHING CHANGED', C.violet)
  );

  await until(S(12));
  await play(
    ...put('story0', story(0, 2)),
    ...say('HYPOTHESIS = A CLAIM WE CAN TEST', GOLD)
  );

  await until(S(13));
  await play(
    ...put('story0', story(0, 3)),
    new M.Indicate(layers.get('story0'), { color: GOLD }),
    ...say('NULL = NO CHANGE, NO DIFFERENCE', GOLD)
  );

  await until(S(14));
  await play(
    ...put('story1', story(1, 3)),
    ...say('ALTERNATIVE = THE CHANGE WE LOOK FOR', C.violet)
  );

  // ============================================================
  // 15-16. Picture of the null and its two-sided alternative.
  // ============================================================

  await until(S(15));
  await play(
    ...scene([
      ['axis', MEAN_FULL.group],
      ['null', nullMarker(MEAN_FULL)]
    ]),
    ...say('NULL: EXACTLY 500 g', GOLD)
  );

  await until(S(16));
  await play(
    ...put('alternative', alternativeSides(MEAN_FULL)),
    ...say('ALTERNATIVE: ANY MEAN EXCEPT 500 g', C.violet)
  );

  // ============================================================
  // 17-20. Hypotheses concern the population, not the sample.
  // ============================================================

  await until(S(17));
  await play(
    ...say('WHAT ARE THESE CLAIMS ABOUT?', C.ink)
  );

  await until(S(18));
  await play(
    ...scene([
      ['population', population()]
    ]),
    ...say('THE MACHINE’S LONG-RUN AVERAGE', C.violet)
  );

  await until(S(19));
  await play(
    ...put('sample', tray(SAMPLE_X, SAMPLE_Y)),
    ...say('NOT THE 16 BOTTLES IN YOUR HAND', GOLD)
  );

  await until(S(20));
  await play(
    ...put('evidenceLink', evidenceLink()),
    new M.Indicate(
      layers.get('sample'),
      { color: C.cyan }
    ),
    ...say('THE SAMPLE IS ONLY A CLUE', C.cyan)
  );

  // ============================================================
  // 21-23. Fix the hypotheses before looking at the data.
  // ============================================================

  await until(S(21));
  await play(
    ...scene([
      ['timeline', timeline(false)]
    ]),
    ...say('WHY WRITE THEM BEFORE WEIGHING?', GOLD)
  );

  const testDirection = txt(
    'DATA TEST THE CLAIMS',
    P ? 20 : 22,
    C.green,
    0, P ? 0.66 : 1.18,
    true, FW - 1
  );

  await until(S(22));
  await play(
    ...put('testDirection', testDirection),
    ...say('DO NOT BEND THE CLAIMS TO FIT THE DATA', C.green)
  );

  await until(S(23));
  await play(
    ...scene([
      ['timeline', timeline(true)]
    ]),
    ...say('LOOKING FIRST CAN BIAS THE QUESTION', RED)
  );

  // ============================================================
  // 24-27. Introduce H₀ and H₁ after the visual explanation.
  // ============================================================

  await until(S(24));
  await play(
    ...scene([
      ['axis', MEAN_SPLIT.group],
      ['null', nullMarker(MEAN_SPLIT)],
      ['alternative', alternativeSides(MEAN_SPLIT)]
    ]),
    ...fbox([
      'Two claims',
      ['One long-run mean', C.cyan]
    ]),
    ...say('NOW THE SHORT FORM', C.cyan, true)
  );

  await until(S(25));
  await play(
    new M.Indicate(
      layers.get('null'),
      { color: GOLD }
    ),
    ...fbox([
      ['H₀: mean = 500 g', GOLD],
      ['H = hypothesis', C.muted]
    ], GOLD),
    ...say('H₀ = NULL HYPOTHESIS', GOLD, true)
  );

  await until(S(26));
  await play(
    new M.Indicate(
      layers.get('alternative'),
      { color: C.violet }
    ),
    ...fbox([
      ['H₀: mean = 500 g', GOLD],
      ['H₁: mean ≠ 500 g', C.violet]
    ], C.violet),
    ...say('H₁ = ALTERNATIVE HYPOTHESIS', C.violet, true)
  );

  await until(S(27));
  await play(
    new M.Indicate(
      layers.get('null'),
      { color: GOLD }
    ),
    ...say('THE NULL NAMES ONE EXACT NUMBER', GOLD, true)
  );

  // ============================================================
  // 28-30. Why the null can be tested.
  // These are hypothetical inspections, NOT the morning batch.
  // ============================================================

  await until(S(28));
  await play(
    ...scene([
      ['samplingCurve', nullSampleCurve()]
    ]),
    ...fbox([
      ['Assume H₀ is true', GOLD],
      'Long-run mean = 500',
      ['Predict sample means', C.cyan]
    ], GOLD),
    ...say('WHAT SHOULD SAMPLES LOOK LIKE?', C.cyan, true)
  );

  await until(S(29));
  await play(
    ...put(
      'hypothetical',
      hypotheticalMean(503.5, C.violet)
    ),
    ...fbox([
      ['Hypothetical result', C.muted],
      ['Very unusual', C.violet],
      ['Doubt the null?', C.violet]
    ], C.violet),
    ...say('UNUSUAL DATA MAKE US DOUBT THE NULL', C.violet, true)
  );

  await until(S(30));
  await play(
    ...morph(
      'hypothetical',
      hypotheticalMean(500.4, C.green)
    ),
    ...fbox([
      ['Hypothetical result', C.muted],
      ['Quite ordinary', C.green],
      ['Do not reject H₀', C.green]
    ], C.green),
    ...say('ORDINARY DATA: KEEP THE NULL FOR NOW', C.green, true)
  );

  // ============================================================
  // 31. A statistical test is a decision rule.
  // ============================================================

  const DECISION_X0 = P ? 0 : -3.2;
  const DECISION_X1 = P ? 0 : 3.2;
  const DECISION_Y0 = P ? 0.05 : -0.75;
  const DECISION_Y1 = P ? -2.65 : -0.75;
  const DECISION_W = P ? 6.35 : 5.65;
  const DECISION_H = P ? 1.95 : 2.50;

  function decisionCard(x, y, unusual) {
    const color = unusual ? C.violet : C.green;

    return new M.VGroup(
      rect(
        x, y, DECISION_W, DECISION_H,
        color, C.card, 0.95
      ),

      txt(
        unusual ? 'UNUSUAL DATA' : 'ORDINARY DATA',
        21, color,
        x, y + DECISION_H / 2 - 0.36,
        true, DECISION_W - 0.4
      ),

      txt(
        unusual
          ? 'Poor fit with the null'
          : 'Fits the null well enough',
        P ? 20 : 22, C.ink,
        x, y,
        false, DECISION_W - 0.55
      ),

      txt(
        unusual ? 'REJECT H₀' : 'DO NOT REJECT H₀',
        P ? 23 : 25, color,
        x, y - DECISION_H / 2 + 0.37,
        true, DECISION_W - 0.5
      )
    );
  }

  await until(S(31));
  await play(
    ...scene([
      [
        'ordinary',
        decisionCard(DECISION_X0, DECISION_Y0, false)
      ],
      [
        'unusual',
        decisionCard(DECISION_X1, DECISION_Y1, true)
      ]
    ]),
    ...say('STATISTICAL TEST = A RULE FOR USING DATA', C.cyan)
  );

  // ============================================================
  // 32. Every test starts with two claims fixed in advance.
  // ============================================================

  const fixedNote = tag(
    'FIXED BEFORE WEIGHING',
    C.green,
    0, P ? -4.12 : -2.32,
    18
  );

  await until(S(32));
  await play(
    ...scene([
      ['story0', story(0, 3)],
      ['story1', story(1, 3)],
      ['fixed', fixedNote]
    ]),
    ...say('TWO CLEAR, COMPETING CLAIMS', C.green)
  );

  // ============================================================
  // 33-35. The trap: not rejecting is not proving.
  // ============================================================

  await until(S(33));
  await play(
    ...say('COMMON TRAP', RED)
  );

  await until(S(34));
  await play(
    ...scene([
      ['verdict', verdictCard(false)]
    ]),
    ...say('KEEPING THE NULL DOES NOT PROVE IT', GOLD)
  );

  await until(S(35));
  await play(
    ...put('verdict', verdictCard(true)),
    ...say('THINK OF A COURT VERDICT', C.violet)
  );

  // ============================================================
  // 36. Prepare for the next lesson, without revealing the mean.
  // ============================================================

  const NEXT_TX = P ? 0 : -3.0;
  const NEXT_TY = P ? 0.0 : -0.40;
  const NEXT_SX = P ? 0 : 3.0;
  const NEXT_SY = P ? -3.10 : -0.65;

  const nextScale = new M.VGroup(
    scale(NEXT_SX, NEXT_SY, 1.1, '? g'),
    bottle(
      NEXT_SX,
      NEXT_SY + 1.10,
      0.86, 0.72
    ),
    txt(
      'How surprising?',
      P ? 22 : 24,
      C.amber,
      NEXT_SX,
      NEXT_SY - 0.80
    )
  );

  const nextArrow = P
    ? arrow(
        0, NEXT_TY - 1.48,
        0, NEXT_SY + 1.89,
        C.cyan, 3
      )
    : arrow(
        NEXT_TX + 1.75, NEXT_TY,
        NEXT_SX - 1.25, NEXT_TY,
        C.cyan, 3
      );

  await until(S(36));
  await play(
    ...scene([
      ['sample', tray(NEXT_TX, NEXT_TY)],
      ['arrow', nextArrow],
      ['scale', nextScale]
    ]),
    ...say('NEXT: TURN 16 WEIGHTS INTO ONE NUMBER')
  );

  // ============================================================
  // 37. Final recap.
  // ============================================================

  function recapCard(which) {
    const [x, y] = which === 0 ? STORY0 : STORY1;
    const color = which === 0 ? GOLD : C.violet;

    const r = rect(
      x, y, STORY_W, STORY_H,
      color, C.card, 0.95
    );

    const title = txt(
      which === 0 ? 'H₀ — NULL' : 'H₁ — ALTERNATIVE',
      P ? 22 : 24, color,
      x, y + (P ? 0.60 : 0.88),
      true, STORY_W - 0.6
    );

    const claim = txt(
      which === 0
        ? 'mean = 500 g'
        : 'mean ≠ 500 g',
      P ? 29 : 32, color,
      x, y + (P ? 0.03 : 0.12),
      true, STORY_W - 0.6
    );

    const plain = txt(
      which === 0
        ? 'Nothing changed'
        : 'Something changed',
      P ? 21 : 23, C.ink,
      x, y - (P ? 0.56 : 0.68),
      false, STORY_W - 0.6
    );

    return new M.VGroup(r, title, claim, plain);
  }

  const finalNote = tag(
    'BOTH WRITTEN BEFORE THE DATA',
    C.green,
    0, P ? -4.16 : -2.35,
    18
  );

  await until(S(37));
  await play(
    ...scene([
      ['nullRecap', recapCard(0)],
      ['alternativeRecap', recapCard(1)],
      ['finalNote', finalNote]
    ]),
    ...say('CLAIMS FIRST. DATA SECOND.', C.green)
  );
}

// lesson 6.2.2
// Normal approximation intervals — live narration-synchronised animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed shared chapter data and checked simulation results.
// Illustrative diagrams are distinguished from actual simulation results.
// Runtime verification requires the course's browser engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Fixed shared chapter data.
  const D1 = [23, 25, 26, 26, 27, 28, 29, 30, 30, 31, 32, 33, 34, 34, 35, 37];

  const N = 16;
  const MEAN = 30;
  const SD = 4;
  const SE = 1;
  const CRITICAL = 1.96;
  const MARGIN = 1.96;
  const LO = 28.04;
  const HI = 31.96;

  const GOLD = C.amber;
  const MISS = C.red || '#F87171';

  // Approved responsive layout.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.25, 0] : [4.3, -0.3, 0];

  const W = P ? FW - 1.7 : 6.6;
  const LEFT = CX - W / 2;
  const RIGHT = CX + W / 2;

  const AY = P ? -2.85 : -1.75;
  const NETY = P ? -0.65 : -0.35;

  const BELLBASE = P ? -3.15 : -2.00;
  const BELLHEIGHT = P ? 4.0 : 2.65;

  const realX = v => LEFT + (v - 22) / 16 * W;
  const closeX = v => LEFT + (v - 26) / 8 * W;
  const zX = z => LEFT + (z + 4) / 8 * W;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fade = xs => xs.map(x => new M.FadeOut(x));

  function txt(s, size, color, pos, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(pos);
    return t;
  }

  function ln(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth
    });
  }

  function rect(w, h, x, y, color, opacity = 0.85, strokeWidth = 1) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  // Formula box, following the approved reference lesson.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

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
    const maxh = P ? 2.3 : 3.6;
    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;

    return a;
  }

  // Number line.
  function axis(xmap, values, y, unit = 'minutes') {
    const line = ln(
      xmap(values[0]), y,
      xmap(values[values.length - 1]), y,
      C.muted, 3
    );

    const ticks = values.map(v => new M.VGroup(
      ln(
        xmap(v), y - 0.075,
        xmap(v), y + 0.075,
        C.muted
      ),

      txt(
        String(v),
        P ? 17 : 15,
        C.muted,
        [xmap(v), y - 0.26, 0],
        true
      )
    ));

    const label = txt(
      unit,
      P ? 17 : 15,
      C.muted,
      [CX, y - 0.60, 0]
    );

    return new M.VGroup(line, ...ticks, label);
  }

  // Glowing dots, following the shared chapter visual language.
  function glowDot(x, y, color = C.cyan, radius = 0.10) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2,
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

  // Horizontal interval with capped endpoints.
  function net(xmap, m, r, y, color = C.cyan, cap = 0.13) {
    const lo = xmap(m - r);
    const hi = xmap(m + r);

    return new M.VGroup(
      ln(lo, y, hi, y, color, 5),
      ln(lo, y - cap, lo, y + cap, color, 2),
      ln(hi, y - cap, hi, y + cap, color, 2)
    );
  }

  // Half of an interval, used when teaching subtraction and addition.
  function halfNet(xmap, a, b, y, color = C.cyan) {
    const end = xmap(b);

    return new M.VGroup(
      ln(xmap(a), y, end, y, color, 5),
      ln(end, y - 0.15, end, y + 0.15, color, 2)
    );
  }

  // Outline boxes are calculated from coordinates.
  // No surrounding rectangles around already displayed objects.
  function outline(x, y, w, h, color = C.cyan) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.moveTo([x, y, 0]);

    return r;
  }

  // One active main picture at a time.
  // Only fresh objects are grouped.
  let pictureNow = null;

  function picture(next) {
    const a = [];

    if (pictureNow) a.push(new M.FadeOut(pictureNow));

    if (next) a.push(new M.FadeIn(next));

    pictureNow = next;

    return a;
  }

  // ---------------------------------------------------------------
  // Reusable pictures.
  // ---------------------------------------------------------------

  // Sixteen actual delivery times on a minutes line.
  // Duplicate observations stack vertically.
  function samplePicture({
    mean = false,
    spread = false,
    interval = false,
    title = '16 actual deliveries'
  } = {}) {
    const a = axis(realX, [22, 26, 30, 34, 38], AY);
    const parts = [a];

    D1.forEach((v, i) => {
      const repeat = D1.slice(0, i).filter(x => x === v).length;

      parts.push(glowDot(
        realX(v),
        AY + 0.23 + repeat * 0.30,
        C.cyan,
        P ? 0.085 : 0.095
      ));
    });

    parts.push(txt(
      title,
      P ? 22 : 20,
      C.ink,
      [CX, P ? 0.90 : 0.80, 0]
    ));

    if (mean) {
      parts.push(glowDot(
        realX(MEAN),
        NETY,
        C.violet,
        0.12
      ));

      parts.push(txt(
        'mean = 30',
        P ? 20 : 18,
        C.violet,
        [realX(MEAN), NETY + 0.36, 0],
        true
      ));
    }

    if (spread) {
      const y = AY + 0.90;

      parts.push(net(
        realX,
        MEAN,
        SD,
        y,
        GOLD,
        0.12
      ));

      parts.push(txt(
        'standard deviation = 4',
        P ? 18 : 16,
        GOLD,
        [CX, y + 0.32, 0]
      ));
    }

    if (interval) {
      parts.push(net(
        realX,
        MEAN,
        MARGIN,
        NETY,
        C.cyan,
        0.15
      ));

      parts.push(txt(
        'How wide?',
        P ? 19 : 18,
        C.cyan,
        [CX, NETY - 0.38, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // A schematic collection of hypothetical sample means.
  // Positions are relative to the unknown truth, not real route times.
  const OFFSETS = [
    -0.9, -0.2, 3.2, 0.6, 1.5,
    0.9, 0.3, 1.7, -1.1, -0.7,
    -0.9, -0.9, 0.2, -0.1, 1.2,
    0.5, 0.4, -0.2, 0.4, 1.1
  ];

  function possibleMeans(showDots = true) {
    const top = P ? 0.90 : 0.92;
    const pitch = P ? 0.21 : 0.135;
    const bottom = top - 19 * pitch;

    const parts = [
      axis(
        zX,
        [-4, -2, 0, 2, 4],
        bottom - 0.42,
        'distance from truth (minutes)'
      )
    ];

    const truth = ln(
      zX(0), bottom - 0.25,
      zX(0), top + 0.18,
      GOLD, 3
    );

    parts.push(truth);

    parts.push(txt(
      'TRUE MEAN',
      P ? 17 : 15,
      GOLD,
      [zX(0), top + 0.40, 0],
      true
    ));

    for (let i = 0; i < OFFSETS.length; i++) {
      const y = top - i * pitch;

      parts.push(ln(
        LEFT, y,
        RIGHT, y,
        C.muted, 0.5
      ));

      if (showDots) {
        parts.push(glowDot(
          zX(OFFSETS[i]),
          y,
          C.cyan,
          P ? 0.057 : 0.039
        ));
      }
    }

    return new M.VGroup(...parts);
  }

  // Normal bell shape, scaled to fit the responsive picture area.
  const bell = z => Math.exp(-0.5 * z * z);

  function bellCurve(
    color = C.cyan,
    baseline = BELLBASE,
    height = BELLHEIGHT
  ) {
    const segments = [];
    const steps = 96;

    for (let i = 0; i < steps; i++) {
      const a = -4 + i * 8 / steps;
      const b = -4 + (i + 1) * 8 / steps;

      segments.push(ln(
        zX(a), baseline + height * bell(a),
        zX(b), baseline + height * bell(b),
        color, 3
      ));
    }

    return new M.VGroup(...segments);
  }

  // Fill under the curve using narrow rectangles.
  function bellArea(
    a,
    b,
    color,
    opacity = 0.48,
    baseline = BELLBASE,
    height = BELLHEIGHT
  ) {
    const steps = Math.max(
      8,
      Math.round((b - a) * 14)
    );

    const step = (b - a) / steps;
    const parts = [];

    for (let i = 0; i < steps; i++) {
      const z = a + (i + 0.5) * step;
      const h = height * bell(z);
      const w = zX(z + step / 2) - zX(z - step / 2);

      parts.push(rect(
        w + 0.008,
        h,
        zX(z),
        baseline + h / 2,
        color,
        opacity,
        0
      ));
    }

    return new M.VGroup(...parts);
  }

  // Complete normal-curve picture.
  // Gold line marks the model's true mean at zero distance.
  function normalPicture({
    central = false,
    cutoff = CRITICAL,
    seBand = false,
    labels = false,
    title = 'Possible sample means'
  } = {}) {
    const parts = [];

    if (central) {
      parts.push(
        bellArea(-4, -cutoff, MISS, 0.38),
        bellArea(-cutoff, cutoff, C.green, 0.38),
        bellArea(cutoff, 4, MISS, 0.38)
      );
    }

    if (seBand) {
      parts.push(
        bellArea(-1, 1, C.violet, 0.28)
      );
    }

    parts.push(axis(
      zX,
      [-4, -2, 0, 2, 4],
      BELLBASE,
      'standard errors from truth'
    ));

    parts.push(ln(
      zX(0), BELLBASE,
      zX(0), BELLBASE + BELLHEIGHT + 0.12,
      GOLD, 2.5
    ));

    parts.push(bellCurve());

    parts.push(txt(
      title,
      P ? 20 : 18,
      C.ink,
      [CX, BELLBASE + BELLHEIGHT + 0.48, 0]
    ));

    if (seBand) {
      const y = P ? -1.05 : -0.78;

      parts.push(net(
        zX, 0, 1, y,
        C.violet, 0.10
      ));

      parts.push(txt(
        '1 SE each way',
        P ? 17 : 15,
        C.violet,
        [CX, y + 0.31, 0]
      ));
    }

    if (central) {
      [-cutoff, cutoff].forEach(z => {
        parts.push(new M.DashedLine({
          start: [zX(z), BELLBASE, 0],
          end: [
            zX(z),
            BELLBASE + BELLHEIGHT * bell(z) + 0.22,
            0
          ],
          color: C.green
        }));
      });

      parts.push(txt(
        '95%',
        P ? 38 : 32,
        C.green,
        [CX, BELLBASE + BELLHEIGHT * 0.53, 0],
        true
      ));

      if (labels) {
        const y = BELLBASE + 0.58;

        parts.push(
          txt(
            '−' + cutoff.toFixed(2),
            P ? 16 : 14,
            C.green,
            [zX(-cutoff) - 0.25, y, 0],
            true
          ),

          txt(
            '+' + cutoff.toFixed(2),
            P ? 16 : 14,
            C.green,
            [zX(cutoff) + 0.25, y, 0],
            true
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // Visual explanation of square root: sixteen objects form a 4 × 4 square.
  function squareOfSixteen(showDimensions = false) {
    const pitch = P ? 0.66 : 0.53;
    const cy = P ? -0.75 : -0.55;
    const parts = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = CX + (col - 1.5) * pitch;
        const y = cy + (1.5 - row) * pitch;

        const b = new M.RoundedRectangle({
          width: pitch * 0.82,
          height: pitch * 0.82,
          cornerRadius: 0.07,
          color: C.cyan,
          strokeWidth: 1.5
        });

        b.setFill(C.cyan, 0.18);
        b.moveTo([x, y, 0]);

        parts.push(b);

        parts.push(glowDot(
          x, y,
          C.cyan,
          P ? 0.075 : 0.065
        ));
      }
    }

    parts.push(txt(
      '16 deliveries',
      P ? 23 : 21,
      C.ink,
      [CX, cy + 2 * pitch + 0.40, 0]
    ));

    if (showDimensions) {
      const edge = 2 * pitch;

      parts.push(
        ln(
          CX - edge, cy - edge - 0.18,
          CX + edge, cy - edge - 0.18,
          C.green, 3
        ),

        txt(
          '4',
          24,
          C.green,
          [CX, cy - edge - 0.47, 0],
          true
        ),

        ln(
          CX - edge - 0.18, cy - edge,
          CX - edge - 0.18, cy + edge,
          C.green, 3
        ),

        txt(
          '4',
          24,
          C.green,
          [CX - edge - 0.48, cy, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Compare the spread of deliveries with the spread of sample means.
  // Both use the same horizontal distance scale.
  function spreadComparison() {
    const wideY = P ? 0.25 : 0.30;
    const narrowY = P ? -1.65 : -1.15;
    const base = P ? -3.35 : -2.25;

    const parts = [
      axis(
        realX,
        [22, 26, 30, 34, 38],
        base
      )
    ];

    parts.push(
      net(realX, MEAN, SD, wideY, C.cyan, 0.15),
      glowDot(realX(MEAN), wideY, C.cyan, 0.09),

      txt(
        'Spread of deliveries',
        P ? 20 : 18,
        C.cyan,
        [CX, wideY + 0.42, 0]
      ),

      txt(
        '4 minutes',
        P ? 22 : 20,
        C.cyan,
        [CX, wideY - 0.40, 0],
        true
      ),

      net(realX, MEAN, SE, narrowY, C.violet, 0.15),
      glowDot(realX(MEAN), narrowY, C.violet, 0.09),

      txt(
        'Spread of sample means',
        P ? 20 : 18,
        C.violet,
        [CX, narrowY + 0.42, 0]
      ),

      txt(
        '1 minute',
        P ? 22 : 20,
        C.violet,
        [CX, narrowY - 0.40, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // Turn the bell-curve idea around:
  // an estimate within 1.96 SE of truth gives a net covering truth.
  function turnAround() {
    const y1 = P ? 0.10 : 0.10;
    const y2 = P ? -1.55 : -1.20;
    const base = P ? -3.25 : -2.25;

    const z = 1.2;

    const parts = [
      axis(
        zX,
        [-4, -2, 0, 2, 4],
        base,
        'standard errors from truth'
      ),

      ln(
        zX(0), base,
        zX(0), y1 + 0.58,
        GOLD, 3
      ),

      txt(
        'TRUTH',
        17,
        GOLD,
        [zX(0), y1 + 0.83, 0],
        true
      ),

      net(zX, 0, CRITICAL, y1, C.green, 0.13),
      glowDot(zX(z), y1, C.cyan, 0.085),

      txt(
        'Estimate lands near truth',
        P ? 18 : 16,
        C.green,
        [CX, y1 - 0.40, 0]
      ),

      net(zX, z, CRITICAL, y2, C.cyan, 0.13),
      glowDot(zX(z), y2, C.cyan, 0.085),

      txt(
        'Net reaches back to truth',
        P ? 18 : 16,
        C.cyan,
        [CX, y2 - 0.40, 0]
      )
    ];

    return new M.VGroup(...parts);
  }

  // Representative pictogram of long-run coverage.
  // This illustrates the rounded theoretical rate, not raw sampled data.
  function hundredNets(caught = 95) {
    const cols = 10;
    const rows = 10;

    const dx = W / cols;
    const dy = P ? 0.43 : 0.28;
    const top = P ? 1.02 : 1.02;

    const parts = [];

    for (let col = 0; col < cols; col++) {
      const x = LEFT + (col + 0.5) * dx;

      parts.push(ln(
        x, top - (rows - 1) * dy - 0.12,
        x, top + 0.12,
        GOLD, 1.7
      ));
    }

    for (let i = 0; i < 100; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = LEFT + (col + 0.5) * dx;
      const y = top - row * dy;

      const rank = (i * 37 + 11) % 100;
      const ok = rank < caught;
      const side = i % 2 === 0 ? -1 : 1;

      const half = dx * 0.23;
      const offset = ok
        ? side * half * (0.10 + (i % 5) * 0.15)
        : side * half * 1.40;

      const center = x + offset;
      const color = ok ? C.green : MISS;
      const cap = P ? 0.05 : 0.038;

      parts.push(new M.VGroup(
        ln(center - half, y, center + half, y, color, 3),

        ln(
          center - half, y - cap,
          center - half, y + cap,
          color, 1
        ),

        ln(
          center + half, y - cap,
          center + half, y + cap,
          color, 1
        ),

        new M.Dot({
          point: [center, y, 0],
          radius: P ? 0.025 : 0.020,
          color
        })
      ));
    }

    const bottom = top - (rows - 1) * dy;

    parts.push(
      txt(
        '100 representative nets',
        P ? 17 : 15,
        C.muted,
        [CX, bottom - 0.42, 0]
      ),

      txt(
        `${caught} caught · ${100 - caught} missed`,
        P ? 20 : 18,
        C.ink,
        [CX, bottom - 0.78, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // Normal interval construction, revealed in stages.
  // The real true mean is never drawn.
  function intervalPicture(stage = 0, rounded = false) {
    const y = P ? -0.40 : -0.35;
    const base = P ? -2.70 : -1.95;

    const parts = [
      axis(
        closeX,
        [26, 28, 30, 32, 34],
        base
      )
    ];

    parts.push(glowDot(
      closeX(MEAN),
      y,
      C.violet,
      0.13
    ));

    parts.push(txt(
      'estimate = 30',
      P ? 20 : 18,
      C.violet,
      [closeX(MEAN), y + 0.92, 0],
      true
    ));

    if (stage >= 1) {
      parts.push(
        halfNet(
          closeX,
          MEAN,
          LO,
          y,
          C.cyan
        ),

        txt(
          '−1.96',
          P ? 18 : 16,
          C.cyan,
          [(closeX(MEAN) + closeX(LO)) / 2, y + 0.36, 0],
          true
        ),

        txt(
          rounded ? '≈28' : '28.04',
          P ? 23 : 20,
          C.cyan,
          [closeX(LO), y - 0.40, 0],
          true
        )
      );
    }

    if (stage >= 2) {
      parts.push(
        halfNet(
          closeX,
          MEAN,
          HI,
          y,
          C.cyan
        ),

        txt(
          '+1.96',
          P ? 18 : 16,
          C.cyan,
          [(closeX(MEAN) + closeX(HI)) / 2, y + 0.36, 0],
          true
        ),

        txt(
          rounded ? '≈32' : '31.96',
          P ? 23 : 20,
          C.cyan,
          [closeX(HI), y - 0.40, 0],
          true
        )
      );
    }

    if (stage >= 3) {
      parts.push(txt(
        rounded
          ? 'About 28 to 32 minutes'
          : '28.04 to 31.96 minutes',
        P ? 22 : 20,
        C.green,
        [CX, y - 1.05, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // The same normal shape can describe different estimates.
  function otherEstimates() {
    const labels = [
      'Sample mean',
      'Sample proportion',
      'Other bell-shaped estimates'
    ];

    const colors = [
      C.cyan,
      C.green,
      C.violet
    ];

    const top = P ? 0.95 : 0.90;
    const pitch = P ? 1.75 : 1.25;
    const height = P ? 1.06 : 0.76;

    const parts = [];

    labels.forEach((label, i) => {
      const y = top - i * pitch;

      parts.push(txt(
        label,
        P ? 18 : 16,
        colors[i],
        [CX, y + 0.20, 0]
      ));

      const base = y - height - 0.10;
      const xmap = z => CX + z * W / 10;

      parts.push(ln(
        xmap(-4), base,
        xmap(4), base,
        C.muted, 1.5
      ));

      const segments = [];

      for (let j = 0; j < 48; j++) {
        const a = -4 + j * 8 / 48;
        const b = -4 + (j + 1) * 8 / 48;

        segments.push(ln(
          xmap(a), base + height * bell(a),
          xmap(b), base + height * bell(b),
          colors[i], 2
        ));
      }

      parts.push(new M.VGroup(...segments));
    });

    return new M.VGroup(...parts);
  }

  // Precision comparison: same centre, different widths.
  function precisionPicture() {
    const wideY = P ? 0.25 : 0.15;
    const narrowY = P ? -1.65 : -1.12;
    const base = P ? -3.40 : -2.22;

    return new M.VGroup(
      axis(closeX, [26, 28, 30, 32, 34], base),

      net(closeX, 30, 3, wideY, GOLD, 0.15),
      glowDot(closeX(30), wideY, GOLD, 0.09),

      txt(
        'Wide range',
        P ? 21 : 19,
        GOLD,
        [CX, wideY + 0.43, 0]
      ),

      txt(
        'Less precise',
        P ? 18 : 16,
        C.muted,
        [CX, wideY - 0.41, 0]
      ),

      net(closeX, 30, 1, narrowY, C.green, 0.15),
      glowDot(closeX(30), narrowY, C.green, 0.09),

      txt(
        'Narrow range',
        P ? 21 : 19,
        C.green,
        [CX, narrowY + 0.43, 0]
      ),

      txt(
        'More precise',
        P ? 18 : 16,
        C.muted,
        [CX, narrowY - 0.41, 0]
      )
    );
  }

  // Schematic picture of the extra uncertainty introduced
  // when the spread must also be estimated.
  function guessedSpreadPicture() {
    const wideY = P ? 0.25 : 0.20;
    const narrowY = P ? -1.50 : -1.10;
    const base = P ? -3.30 : -2.20;

    return new M.VGroup(
      axis(closeX, [26, 28, 30, 32, 34], base),

      net(closeX, 30, 2.45, wideY, GOLD, 0.15),
      glowDot(closeX(30), wideY, GOLD, 0.085),

      txt(
        'Extra uncertainty',
        P ? 20 : 18,
        GOLD,
        [CX, wideY + 0.44, 0]
      ),

      net(closeX, 30, 1.96, narrowY, C.cyan, 0.15),
      glowDot(closeX(30), narrowY, C.cyan, 0.085),

      txt(
        'Normal approximation',
        P ? 20 : 18,
        C.cyan,
        [CX, narrowY + 0.44, 0]
      ),

      txt(
        'Schematic width comparison',
        P ? 15 : 14,
        C.muted,
        [CX, base + 0.40, 0]
      )
    );
  }

  // Coverage comparison using the supplied checked result.
  // Full-width bars run from zero to one hundred percent.
  function coverageComparison() {
    const w = W - 0.35;
    const left = CX - w / 2;
    const right = CX + w / 2;

    const top = P ? 0.45 : 0.35;
    const bottom = P ? -1.50 : -1.25;
    const h = P ? 0.43 : 0.34;

    const parts = [];

    function coverageBar(y, rate, label, color) {
      const bg = rect(
        w, h, CX, y,
        C.muted, 0.16, 1
      );

      const goodW = w * rate / 100;
      const badW = w - goodW;

      const good = rect(
        goodW,
        h,
        left + goodW / 2,
        y,
        color,
        0.88,
        0
      );

      const bad = rect(
        badW,
        h,
        right - badW / 2,
        y,
        MISS,
        0.85,
        0
      );

      return new M.VGroup(
        bg, good, bad,

        txt(
          label,
          P ? 19 : 17,
          C.ink,
          [CX, y + 0.48, 0]
        ),

        txt(
          rate.toFixed(1) + '%',
          P ? 25 : 22,
          color,
          [CX, y - 0.49, 0],
          true
        )
      );
    }

    parts.push(
      coverageBar(top, 95.0, 'Target coverage', C.green),

      coverageBar(
        bottom,
        93.5,
        'Normal interval simulation',
        C.cyan
      )
    );

    const targetX = left + w * 0.95;

    parts.push(new M.DashedLine({
      start: [targetX, bottom - h / 2 - 0.12, 0],
      end: [targetX, top + h / 2 + 0.12, 0],
      color: GOLD
    }));

    parts.push(txt(
      '10,000 simulated samples',
      P ? 18 : 16,
      C.muted,
      [CX, bottom - 1.02, 0]
    ));

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // 0: Sami has one real sample of sixteen deliveries.
  // ---------------------------------------------------------------

  const sampleCards = [];

  for (let i = 0; i < N; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);

    const dx = P ? 1.12 : 1.02;
    const dy = P ? 0.74 : 0.63;

    const x = CX + (col - 1.5) * dx;
    const y = (P ? 0.45 : 0.50) - row * dy;

    const card = new M.RoundedRectangle({
      width: dx * 0.85,
      height: dy * 0.81,
      cornerRadius: 0.10,
      color: C.cyan,
      strokeWidth: 1.5
    });

    card.setFill(C.card, 0.95);
    card.moveTo([x, y, 0]);

    const value = txt(
      String(D1[i]),
      P ? 24 : 22,
      C.cyan,
      [x, y, 0],
      true
    );

    sampleCards.push(new M.VGroup(card, value));
  }

  const cardTitle = txt(
    'Sami’s delivery times',
    P ? 23 : 21,
    C.ink,
    [CX, P ? 1.18 : 1.16, 0]
  );

  const cardUnit = txt(
    'minutes',
    17,
    C.muted,
    [CX, P ? -2.40 : -1.85, 0]
  );

  const cardPicture = new M.VGroup(
    ...sampleCards,
    cardTitle,
    cardUnit
  );

  await until(S(0));
  await play(
    ...picture(cardPicture),
    ...say('ONE REAL SAMPLE: 16 DELIVERIES'),
    ...fbox([
      ['sample size = 16', C.cyan],
      'One stable route'
    ])
  );

  // ---------------------------------------------------------------
  // 1: Delivery times on a line, from 23 to 37.
  // ---------------------------------------------------------------

  const actual = samplePicture();

  await until(S(1));
  await play(
    ...picture(actual),
    ...say('23 TO 37 MINUTES'),
    ...fbox([
      ['fastest = 23', C.cyan],
      ['slowest = 37', C.cyan],
      '16 observed times'
    ])
  );

  // ---------------------------------------------------------------
  // 2: Their mean is 30 minutes.
  // ---------------------------------------------------------------

  const actualMean = samplePicture({ mean: true });

  await until(S(2));
  await play(
    ...picture(actualMean),
    ...say('MEAN = 30 MINUTES', C.violet),
    ...fbox([
      '480 ÷ 16',
      ['mean = 30', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 3: A net with about 95% coverage.
  // No real true mean is displayed.
  // ---------------------------------------------------------------

  const goalPicture = samplePicture({
    mean: true,
    interval: true,
    title: 'A net around the estimate'
  });

  await until(S(3));
  await play(
    ...picture(goalPicture),
    ...say('GOAL: ABOUT 95% COVERAGE', C.green),
    ...fbox([
      ['estimate = 30', C.violet],
      'Choose a range',
      ['Catch truth 95 in 100', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 4: How wide should the net be?
  // ---------------------------------------------------------------

  await until(S(4));
  await play(
    ...say('HOW WIDE SHOULD THE NET BE?', GOLD),
    ...fbox([
      'Too small?',
      'Too large?',
      ['Find the right width', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 5: Picture other possible samples.
  // ---------------------------------------------------------------

  const emptySamples = possibleMeans(false);

  await until(S(5));
  await play(
    ...picture(emptySamples),
    ...say('IMAGINE MANY POSSIBLE SAMPLES'),
    ...fbox([
      'Same route',
      '16 deliveries each',
      'Different samples'
    ])
  );

  // ---------------------------------------------------------------
  // 6: Each sample produces a different mean.
  // ---------------------------------------------------------------

  const meanSamples = possibleMeans(true);

  await until(S(6));
  await play(
    ...picture(meanSamples),
    ...say('DIFFERENT SAMPLES → DIFFERENT MEANS'),
    ...fbox([
      ['One dot per sample', C.cyan],
      'Means move around',
      'the fixed truth'
    ])
  );

  // ---------------------------------------------------------------
  // 7: Means pile up into a normal bell curve.
  // ---------------------------------------------------------------

  const normal = normalPicture();

  await until(S(7));
  await play(
    ...picture(normal),
    ...say('THE NORMAL CURVE'),
    ...fbox([
      ['normal curve', C.cyan],
      'Many means near truth',
      'Few very far away'
    ])
  );

  // ---------------------------------------------------------------
  // 8: Standard error measures the spread of sample means.
  // ---------------------------------------------------------------

  const seNormal = normalPicture({
    seBand: true,
    title: 'Spread of sample means'
  });

  await until(S(8));
  await play(
    ...picture(seNormal),
    ...say('STANDARD ERROR = SPREAD OF MEANS', C.violet),
    ...fbox([
      ['standard error', C.violet],
      'Typical distance',
      'of mean from truth'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 9: Find Sami's standard error.
  // ---------------------------------------------------------------

  await until(S(9));
  await play(
    ...say('LET’S FIND SAMI’S STANDARD ERROR', GOLD),
    ...fbox([
      'Two steps:',
      '1. Delivery spread',
      '2. Sample size'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 10: Step one — sample standard deviation = 4 minutes.
  // ---------------------------------------------------------------

  const spreadSample = samplePicture({
    spread: true,
    title: 'Spread of individual deliveries'
  });

  await until(S(10));
  await play(
    ...picture(spreadSample),
    ...say('STEP 1: DELIVERY SPREAD', GOLD),
    ...fbox([
      'sample standard',
      'deviation',
      ['= 4 minutes', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 11: Divide by the square root of the sample size.
  // ---------------------------------------------------------------

  const square16 = squareOfSixteen(false);

  await until(S(11));
  await play(
    ...picture(square16),
    ...say('STEP 2: USE THE SAMPLE SIZE', C.green),
    ...fbox([
      'standard error =',
      'standard deviation',
      ['÷ √sample size', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 12: Square root of sixteen is four.
  // ---------------------------------------------------------------

  const square4x4 = squareOfSixteen(true);

  await until(S(12));
  await play(
    ...picture(square4x4),
    ...say('4 × 4 = 16', C.green),
    ...fbox([
      'sample size = 16',
      '4 × 4 = 16',
      ['√16 = 4', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 13: Standard error = 4 ÷ 4 = 1 minute.
  // ---------------------------------------------------------------

  const spreads = spreadComparison();

  await until(S(13));
  await play(
    ...picture(spreads),
    ...say('STANDARD ERROR = 1 MINUTE', C.violet),
    ...fbox([
      'SE = 4 ÷ √16',
      '   = 4 ÷ 4',
      ['   = 1 minute', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 14: Return to the bell curve.
  // ---------------------------------------------------------------

  const normalAgain = normalPicture({
    title: 'One standard error = one minute'
  });

  await until(S(14));
  await play(
    ...picture(normalAgain),
    ...say('NOW USE THE BELL CURVE'),
    ...fbox([
      'For Sami:',
      ['1 SE = 1 minute', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 15: Central 95% lies within 1.96 standard errors of truth.
  // ---------------------------------------------------------------

  const central95 = normalPicture({
    central: true,
    cutoff: CRITICAL,
    labels: true,
    title: 'The middle 95%'
  });

  await until(S(15));
  await play(
    ...picture(central95),
    ...say('95% LAND WITHIN 1.96 SE', C.green),
    ...fbox([
      'Normal curve',
      ['middle = 95%', C.green],
      'cut-offs: ±1.96 SE'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 16: Turn the idea around.
  // A net reaching 1.96 SE each way from an estimate.
  // ---------------------------------------------------------------

  const reversed = turnAround();

  await until(S(16));
  await play(
    ...picture(reversed),
    ...say('TURN IT AROUND: NET ±1.96 SE'),
    ...fbox([
      'Estimate near truth',
      'means the net',
      ['reaches the truth', C.green]
    ])
  );

  // ---------------------------------------------------------------
  // 17: The rule catches truth 95 times in 100 under the model.
  // ---------------------------------------------------------------

  const idealCoverage = hundredNets(95);

  await until(S(17));
  await play(
    ...picture(idealCoverage),
    ...say('95 IN 100 NETS CATCH', C.green),
    ...fbox([
      'Under the normal model',
      'with known spread',
      ['coverage = 95%', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 18: 1.96 is approximately two.
  // ---------------------------------------------------------------

  const criticalPicture = normalPicture({
    central: true,
    cutoff: CRITICAL,
    labels: true,
    title: '1.96 is just under 2'
  });

  await until(S(18));
  await play(
    ...picture(criticalPicture),
    ...say('1.96 ≈ 2 STANDARD ERRORS', GOLD),
    ...fbox([
      ['1.96', C.green],
      'is just under',
      ['2', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 19: Name the critical value.
  // ---------------------------------------------------------------

  await until(S(19));
  await play(
    ...say('CRITICAL VALUE = 1.96', GOLD),
    ...fbox([
      ['critical value', GOLD],
      'Read from the',
      'normal curve',
      ['95% → 1.96', C.green]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 20: Multiply the critical value by the standard error.
  // ---------------------------------------------------------------

  const marginY = P ? -0.65 : -0.40;
  const marginBase = P ? -2.85 : -2.00;

  const marginLine = axis(
    closeX,
    [26, 28, 30, 32, 34],
    marginBase
  );

  const marginDot = glowDot(
    closeX(MEAN),
    marginY,
    C.violet,
    0.12
  );

  const marginArm = halfNet(
    closeX,
    MEAN,
    HI,
    marginY,
    GOLD
  );

  const marginLabel = txt(
    '1.96 minutes',
    P ? 22 : 20,
    GOLD,
    [
      (closeX(MEAN) + closeX(HI)) / 2,
      marginY + 0.44,
      0
    ],
    true
  );

  const marginEstimate = txt(
    '30',
    20,
    C.violet,
    [closeX(MEAN), marginY - 0.38, 0],
    true
  );

  const marginPicture = new M.VGroup(
    marginLine,
    marginDot,
    marginArm,
    marginLabel,
    marginEstimate
  );

  await until(S(20));
  await play(
    ...picture(marginPicture),
    ...say('CRITICAL VALUE × STANDARD ERROR', GOLD),
    ...fbox([
      '1.96 × 1 minute',
      ['= 1.96 minutes', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 21: Name the margin of error.
  // ---------------------------------------------------------------

  await until(S(21));
  await play(
    new M.Indicate(marginArm, { color: GOLD }),
    ...say('MARGIN OF ERROR = 1.96 MINUTES', GOLD),
    ...fbox([
      ['margin of error', GOLD],
      'How far the net',
      'reaches each way'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 22: Start at the estimate.
  // ---------------------------------------------------------------

  const centreOnly = intervalPicture(0);

  await until(S(22));
  await play(
    ...picture(centreOnly),
    ...say('NOW THROW THE NET'),
    ...fbox([
      ['start at 30', C.violet],
      'reach 1.96 each way'
    ])
  );

  // ---------------------------------------------------------------
  // 23: Lower endpoint = 28.04.
  // ---------------------------------------------------------------

  const leftArm = intervalPicture(1);

  await until(S(23));
  await play(
    ...picture(leftArm),
    ...say('LOWER END: 28.04 MINUTES'),
    ...fbox([
      '30 − 1.96',
      ['= 28.04', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 24: Upper endpoint = 31.96.
  // ---------------------------------------------------------------

  const bothArms = intervalPicture(2);

  await until(S(24));
  await play(
    ...picture(bothArms),
    ...say('UPPER END: 31.96 MINUTES'),
    ...fbox([
      '30 + 1.96',
      ['= 31.96', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 25: Approximately 28 to 32 minutes.
  // ---------------------------------------------------------------

  const roundedInterval = intervalPicture(3, true);

  await until(S(25));
  await play(
    ...picture(roundedInterval),
    ...say('INTERVAL: ABOUT 28 TO 32 MINUTES', C.green),
    ...fbox([
      ['28.04 to 31.96', C.cyan],
      'approximately',
      ['28 to 32 minutes', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 26: Introduce the general recipe.
  // ---------------------------------------------------------------

  await until(S(26));
  await play(
    ...say('THE RECIPE IN ONE LINE'),
    ...fbox([
      ['estimate', C.violet],
      '±',
      ['margin of error', GOLD]
    ])
  );

  // ---------------------------------------------------------------
  // 27: Estimate ± critical value × standard error.
  // ---------------------------------------------------------------

  await until(S(27));
  await play(
    ...say('ESTIMATE ± CRITICAL VALUE × SE'),
    ...fbox([
      ['estimate', C.violet],
      '± critical value',
      ['  × standard error', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 28: Start at the estimate, reach about two standard errors each way.
  // ---------------------------------------------------------------

  const recipeY = P ? -0.35 : -0.30;
  const recipeBase = P ? -2.75 : -1.90;

  const recipeParts = [
    axis(
      closeX,
      [26, 28, 30, 32, 34],
      recipeBase
    )
  ];

  recipeParts.push(
    net(closeX, MEAN, MARGIN, recipeY, C.cyan, 0.18),
    glowDot(closeX(MEAN), recipeY, C.violet, 0.13),

    txt(
      'ESTIMATE',
      P ? 19 : 17,
      C.violet,
      [CX, recipeY + 0.48, 0]
    ),

    txt(
      '≈2 SE',
      P ? 18 : 16,
      C.cyan,
      [(closeX(LO) + closeX(MEAN)) / 2, recipeY - 0.42, 0],
      true
    ),

    txt(
      '≈2 SE',
      P ? 18 : 16,
      C.cyan,
      [(closeX(HI) + closeX(MEAN)) / 2, recipeY - 0.42, 0],
      true
    ),

    txt(
      '28.04',
      P ? 19 : 17,
      C.cyan,
      [closeX(LO), recipeY + 0.35, 0],
      true
    ),

    txt(
      '31.96',
      P ? 19 : 17,
      C.cyan,
      [closeX(HI), recipeY + 0.35, 0],
      true
    )
  );

  const recipePicture = new M.VGroup(...recipeParts);

  await until(S(28));
  await play(
    ...picture(recipePicture),
    ...say('START AT ESTIMATE, REACH EACH WAY'),
    ...fbox([
      '30 ± 1.96 × 1',
      '30 ± 1.96',
      ['≈ 30 ± 2 minutes', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 29: Name the normal approximation interval.
  // ---------------------------------------------------------------

  const namedNormal = normalPicture({
    central: true,
    cutoff: CRITICAL,
    labels: true,
    title: 'The normal approximation'
  });

  await until(S(29));
  await play(
    ...picture(namedNormal),
    ...say('NORMAL APPROXIMATION INTERVAL', C.violet),
    ...fbox([
      ['normal approximation', C.violet],
      'Uses the normal curve',
      'to choose the cut-off'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 30: Turn one estimate into a range.
  // ---------------------------------------------------------------

  const usefulInterval = intervalPicture(3, true);

  await until(S(30));
  await play(
    ...picture(usefulInterval),
    ...say('ONE ESTIMATE → AN HONEST RANGE', C.green),
    ...fbox([
      ['estimate = 30', C.violet],
      ['range ≈ 28 to 32', C.cyan],
      'Shows uncertainty'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 31: Works for many estimates with bell-shaped sampling distributions.
  // ---------------------------------------------------------------

  const otherBells = otherEstimates();

  await until(S(31));
  await play(
    ...picture(otherBells),
    ...say('NOT JUST FOR SAMPLE MEANS'),
    ...fbox([
      'Means, proportions...',
      'Other estimates with',
      ['bell-shaped variation', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 32: Narrow intervals are more precise.
  // Compare widths at the same confidence level.
  // ---------------------------------------------------------------

  const precision = precisionPicture();

  await until(S(32));
  await play(
    ...picture(precision),
    ...say('NARROWER NET = MORE PRECISION', C.green),
    ...fbox([
      'Same confidence level',
      ['Narrow = more precise', C.green],
      ['Wide? Collect more data', GOLD]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 33: Common trap.
  // ---------------------------------------------------------------

  const warningTitle = txt(
    'ONE EXTRA GUESS',
    P ? 29 : 26,
    GOLD,
    [CX, P ? 0.15 : -0.10, 0],
    true
  );

  const warningQuestion = txt(
    'Where did the 4 come from?',
    P ? 22 : 20,
    C.ink,
    [CX, P ? -0.65 : -0.80, 0]
  );

  const warningPicture = new M.VGroup(
    warningTitle,
    warningQuestion
  );

  await until(S(33));
  await play(
    ...picture(warningPicture),
    ...say('COMMON TRAP', GOLD),
    ...fbox([
      ['Be careful!', GOLD],
      'We guessed the',
      'delivery spread too.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 34: The standard deviation of four is itself estimated.
  // ---------------------------------------------------------------

  const estimatedSpread = samplePicture({
    spread: true,
    title: 'Only 16 observed deliveries'
  });

  const guessedTag = pill(
    '4 IS ALSO AN ESTIMATE',
    GOLD,
    P ? 17 : 16
  );

  guessedTag.moveTo([
    CX,
    P ? -4.40 : -2.68,
    0
  ]);

  await until(S(34));
  await play(
    ...picture(estimatedSpread),
    new M.FadeIn(guessedTag),
    ...say('THE SPREAD IS ITSELF A GUESS', GOLD),
    ...fbox([
      'sample SD = 4',
      'Estimated using',
      ['only 16 deliveries', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 35: Extra guessing makes the normal interval too narrow.
  // ---------------------------------------------------------------

  const extraUncertainty = guessedSpreadPicture();

  await until(S(35));
  await play(
    new M.FadeOut(guessedTag),
    ...picture(extraUncertainty),
    ...say('EXTRA UNCERTAINTY NEEDS MORE WIDTH', GOLD),
    ...fbox([
      'We guessed the mean',
      'AND the spread',
      ['Normal net too narrow', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 36: Checked simulation result: about 93.5%, not 95%.
  // 10,000 samples, each with sixteen observations.
  // ---------------------------------------------------------------

  const actualCoverage = coverageComparison();

  await until(S(36));
  await play(
    ...picture(actualCoverage),
    ...say('ACTUAL COVERAGE ≈ 93.5%', MISS),
    ...fbox([
      '10,000 samples',
      ['target = 95%', C.green],
      ['actual ≈ 93.5%', MISS],
      'Spread estimated'
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 37: Small samples need a correction.
  // Preview Student's t distribution without giving the next recipe.
  // ---------------------------------------------------------------

  await until(S(37));
  await play(
    ...say('SMALL SAMPLES NEED A CORRECTION', GOLD),
    ...fbox([
      'With only 16 values,',
      'the difference matters.',
      ['Next: Student’s t', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 38: Final one-sentence summary.
  // Keep the actual interval visible until narration ends.
  // ---------------------------------------------------------------

  const finalPicture = intervalPicture(3, true);

  await until(S(38));
  await play(
    ...picture(finalPicture),
    ...say('NORMAL INTERVAL = ESTIMATE ± ABOUT 2 SE', C.green),
    ...fbox([
      ['estimate ± 1.96 × SE', C.cyan],
      '30 ± 1.96 × 1',
      ['≈ 28 to 32 minutes', C.green],
      'Small sample? Use t.'
    ], C.green)
  );
}

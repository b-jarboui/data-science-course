// lesson 6.2.3
// Student's t distribution — live narration-synchronised animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed shared chapter data and checked critical values.
// Illustrative spread guesses are explicitly labelled as examples.
// Runtime verification requires the course's browser engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Fixed shared chapter data.
  const D1 = [23, 25, 26, 26, 27, 28, 29, 30, 30, 31, 32, 33, 34, 34, 35, 37];

  const N = 16;
  const SUM = 480;
  const MEAN = 30;
  const SD = 4;
  const SE = 1;
  const DF = 15;

  // Checked critical values and two-sided tail probabilities.
  const CRITICAL_NORMAL = 1.96;
  const CRITICAL_T15 = 2.13;
  const CRITICAL_T3 = 3.18;
  const CRITICAL_T30 = 2.04;

  const TAIL_NORMAL = 4.6;
  const TAIL_T15 = 6.4;
  const TAIL_T3 = 13.9;

  const GOLD = C.amber;
  const MISS = C.red || '#F87171';

  // Approved responsive layout.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.48, 0] : [4.3, -0.3, 0];

  const W = P ? FW - 1.65 : 6.6;
  const LEFT = CX - W / 2;
  const RIGHT = CX + W / 2;

  const AY = P ? -2.85 : -1.85;
  const NETY = P ? -0.60 : -0.40;

  const BELLBASE = P ? -3.15 : -1.85;
  const BELLHEIGHT = P ? 3.85 : 2.55;

  const realX = v => LEFT + (v - 22) / 16 * W;
  const minuteX = v => LEFT + (v - 26) / 8 * W;
  const zX = z => LEFT + (z + 5) / 10 * W;

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
    const maxh = P ? 2.7 : 3.6;
    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);

    // phone: keep the box bottom just above the pill, let taller boxes grow upward
    g.moveTo(P ? [BOXP[0], Math.max(BOXP[1], 2.62 + ht * scale / 2), 0] : BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;

    return a;
  }

  // Number line.
  function axis(xmap, values, y, unit = 'minutes') {
    const parts = [
      ln(
        xmap(values[0]), y,
        xmap(values[values.length - 1]), y,
        C.muted, 3
      )
    ];

    values.forEach(v => {
      parts.push(
        ln(
          xmap(v), y - 0.07,
          xmap(v), y + 0.07,
          C.muted, 2
        ),

        txt(
          String(v),
          P ? 17 : 15,
          C.muted,
          [xmap(v), y - 0.26, 0],
          true
        )
      );
    });

    parts.push(txt(
      unit,
      P ? 17 : 15,
      C.muted,
      [CX, y - 0.59, 0]
    ));

    return new M.VGroup(...parts);
  }

  // Glowing data dot.
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

  // Horizontal interval ("net") with endpoint caps.
  function net(xmap, m, r, y, color = C.cyan, cap = 0.13) {
    const lo = xmap(m - r);
    const hi = xmap(m + r);

    return new M.VGroup(
      ln(lo, y, hi, y, color, 5),

      ln(
        lo, y - cap,
        lo, y + cap,
        color, 2
      ),

      ln(
        hi, y - cap,
        hi, y + cap,
        color, 2
      )
    );
  }

  // Distance bracket between two arbitrary positions.
  function bracket(x1, x2, y, color = C.amber, cap = 0.10) {
    return new M.VGroup(
      ln(x1, y, x2, y, color, 3),

      ln(
        x1, y - cap,
        x1, y + cap,
        color, 2
      ),

      ln(
        x2, y - cap,
        x2, y + cap,
        color, 2
      )
    );
  }

  // One active main picture at a time.
  // Never regroup objects that are already displayed.
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

  // Sami's actual delivery times.
  function samplePicture(showSpread = false) {
    const parts = [
      axis(
        realX,
        [22, 26, 30, 34, 38],
        AY
      )
    ];

    D1.forEach((v, i) => {
      const repeat = D1.slice(0, i).filter(x => x === v).length;

      parts.push(glowDot(
        realX(v),
        AY + 0.23 + repeat * 0.30,
        C.cyan,
        P ? 0.085 : 0.095
      ));
    });

    parts.push(
      txt(
        '16 observed deliveries',
        P ? 23 : 21,
        C.ink,
        [CX, P ? 0.95 : 0.95, 0]
      ),

      glowDot(
        realX(MEAN),
        NETY,
        C.violet,
        0.12
      ),

      txt(
        'mean = 30',
        P ? 20 : 18,
        C.violet,
        [CX, NETY + 0.39, 0],
        true
      )
    );

    if (showSpread) {
      const y = P ? -1.85 : -0.95;

      parts.push(
        net(
          realX,
          MEAN,
          SD,
          y,
          GOLD,
          0.11
        ),

        txt(
          'sample SD = 4',
          P ? 18 : 16,
          GOLD,
          [CX, y + 0.33, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Two coverage bars: target and checked normal approximation result.
  function coveragePicture() {
    const w = W - 0.40;
    const left = CX - w / 2;
    const h = P ? 0.40 : 0.32;

    const parts = [];

    const rows = [
      {
        y: P ? 0.50 : 0.42,
        value: 95,
        name: 'Target coverage',
        color: C.green
      },
      {
        y: P ? -1.55 : -1.18,
        value: 93.5,
        name: 'Normal interval',
        color: C.cyan
      }
    ];

    rows.forEach(({ y, value, name, color }) => {
      const goodW = w * value / 100;
      const badW = w - goodW;

      parts.push(
        rect(
          w, h, CX, y,
          C.muted, 0.15
        ),

        rect(
          goodW, h,
          left + goodW / 2,
          y,
          color, 0.88, 0
        ),

        rect(
          badW, h,
          left + goodW + badW / 2,
          y,
          MISS, 0.85, 0
        ),

        txt(
          name,
          P ? 22 : 19,
          C.ink,
          [CX, y + 0.48, 0]
        ),

        txt(
          value === 95 ? '95%' : '93.5%',
          P ? 28 : 24,
          color,
          [CX, y - 0.49, 0],
          true
        )
      );
    });

    const targetX = left + w * 0.95;

    parts.push(new M.DashedLine({
      start: [targetX, rows[1].y - h, 0],
      end: [targetX, rows[0].y + h, 0],
      color: GOLD
    }));

    parts.push(txt(
      '10,000 simulated samples',
      P ? 18 : 16,
      C.muted,
      [CX, P ? -2.70 : -2.40, 0]
    ));

    return new M.VGroup(...parts);
  }

  // Fixed hypothetical sample means, expressed as offsets from truth.
  // These are the same training-simulation offsets used earlier.
  const OFFSETS = [
    -0.9, -0.2, 3.2, 0.6, 1.5,
    0.9, 0.3, 1.7, -1.1, -0.7,
    -0.9, -0.9, 0.2, -0.1, 1.2,
    0.5, 0.4, -0.2, 0.4, 1.1
  ];

  // Many hypothetical samples, with truth fixed in the middle.
  function samplesPicture(showDistances = false) {
    const top = P ? 0.95 : 0.90;
    const pitch = P ? 0.23 : 0.145;
    const bottom = top - 19 * pitch;
    const base = bottom - 0.32;

    const parts = [
      axis(
        zX,
        [-4, -2, 0, 2, 4],
        base,
        'signed distance from truth (min)'
      ),

      ln(
        zX(0), base,
        zX(0), top + 0.10,
        GOLD, 3
      ),

      txt(
        'FIXED TRUTH',
        P ? 18 : 16,
        GOLD,
        [zX(0), top + 0.35, 0],
        true
      )
    ];

    OFFSETS.forEach((v, i) => {
      const y = top - i * pitch;

      if (showDistances) {
        parts.push(ln(
          zX(0), y,
          zX(v), y,
          C.violet, 2.5
        ));
      }

      parts.push(glowDot(
        zX(v),
        y,
        C.cyan,
        P ? 0.055 : 0.039
      ));

      if ([0, 4, 9, 14, 19].includes(i)) {
        parts.push(txt(
          String(i + 1),
          P ? 14 : 11,
          C.muted,
          [LEFT - 0.10, y, 0],
          true
        ));
      }
    });

    return new M.VGroup(...parts);
  }

  // The same observed error of two minutes, measured with
  // different standard-error rulers.
  //
  // Illustrative examples, not additional shared simulation data.
  const ERROR_EXAMPLE = 2;

  function rulerPicture(seGuess, guessed = false) {
    const x = v => LEFT + (v + 1) / 5 * W;

    const topY = P ? 0.25 : 0.35;
    const lowerY = P ? -2.05 : -1.25;
    const base = P ? -3.85 : -2.35;

    const units = ERROR_EXAMPLE / seGuess;

    const format = v => {
      const rounded = Math.round(v * 100) / 100;
      return String(rounded);
    };

    const parts = [
      axis(
        x,
        [-1, 0, 1, 2, 3, 4],
        base,
        'minutes from truth'
      ),

      ln(
        x(0), lowerY - 0.45,
        x(0), topY + 0.43,
        GOLD, 3
      ),

      glowDot(
        x(ERROR_EXAMPLE),
        topY,
        C.cyan,
        0.105
      ),

      bracket(
        x(0),
        x(ERROR_EXAMPLE),
        topY,
        C.violet,
        0.13
      ),

      txt(
        'Actual error = 2 minutes',
        P ? 21 : 19,
        C.violet,
        [CX, topY + 0.61, 0]
      ),

      txt(
        'truth',
        P ? 20 : 16,
        GOLD,
        [x(0), topY - 0.34, 0]
      ),

      txt(
        'mean',
        P ? 20 : 16,
        C.cyan,
        [x(ERROR_EXAMPLE), topY - 0.34, 0]
      )
    ];

    const rulerColor = guessed ? GOLD : C.green;
    const blocks = Math.ceil(units - 1e-9);
    const blockH = P ? 0.32 : 0.25;

    for (let i = 0; i < blocks; i++) {
      const a = i * seGuess;
      const b = Math.min((i + 1) * seGuess, ERROR_EXAMPLE);

      const xa = x(a);
      const xb = x(b);
      const w = xb - xa;

      parts.push(rect(
        Math.max(0.018, w - 0.035),
        blockH,
        (xa + xb) / 2,
        lowerY,
        rulerColor,
        0.65,
        1
      ));
    }

    parts.push(
      txt(
        `${format(seGuess)} min per SE`,
        P ? 20 : 18,
        rulerColor,
        [CX, lowerY + 0.40, 0],
        true
      ),

      txt(
        `Measured distance = ${format(units)} SE`,
        P ? 22 : 20,
        C.ink,
        [CX, lowerY - 0.43, 0],
        true
      )
    );

    if (guessed) {
      parts.push(txt(
        'Illustrative spread guess',
        P ? 18 : 15,
        C.muted,
        [CX, lowerY - 0.82, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // A schematic view of several errors being enlarged by
  // standard errors that were guessed too small.
  function stretchedDistances() {
    const examples = [
      { error: -1.5, se: 0.45 },
      { error: -0.8, se: 0.65 },
      { error:  0.5, se: 1.10 },
      { error:  1.2, se: 0.55 },
      { error:  1.8, se: 0.45 }
    ];

    const top = P ? 0.30 : 0.40;
    const pitch = P ? 0.75 : 0.48;
    const bottom = top - 4 * pitch;
    const base = bottom - 0.68;

    const parts = [
      axis(
        zX,
        [-4, -2, 0, 2, 4],
        base,
        'standard-error units'
      ),

      ln(
        zX(0), base,
        zX(0), top + 0.25,
        GOLD, 2.5
      ),

      txt(
        'Same errors, different rulers',
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.60, 0]
      )
    ];

    examples.forEach(({ error, se }, i) => {
      const y = top - i * pitch;
      const measured = error / se;

      parts.push(
        ln(
          zX(error), y,
          zX(measured), y,
          C.violet, 2.5
        ),

        glowDot(
          zX(error),
          y,
          C.cyan,
          P ? 0.075 : 0.060
        ),

        glowDot(
          zX(measured),
          y,
          C.violet,
          P ? 0.085 : 0.070
        )
      );
    });

    parts.push(
      txt(
        'Known ruler',
        P ? 16 : 14,
        C.cyan,
        [CX - W * 0.23, base - 0.98, 0]
      ),

      txt(
        'Guessed ruler',
        P ? 16 : 14,
        C.violet,
        [CX + W * 0.23, base - 0.98, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Normal and Student's t density curves.
  //
  // All curves share one vertical density scale.
  // They are not independently stretched to the same peak.
  // This preserves the lower t peak and heavier t tails.
  // ---------------------------------------------------------------

  function gammaHalfInteger(x) {
    let value = 1;

    while (x > 1 + 1e-9) {
      x -= 1;
      value *= x;
    }

    if (Math.abs(x - 0.5) < 1e-9) {
      value *= Math.sqrt(Math.PI);
    }

    return value;
  }

  const normalDensity = z => Math.exp(-0.5 * z * z);

  function tDensity(df) {
    const coefficient =
      gammaHalfInteger((df + 1) / 2) /
      (
        Math.sqrt(df * Math.PI) *
        gammaHalfInteger(df / 2)
      );

    // Normalize relative to the standard normal density's peak.
    const relativeScale = coefficient * Math.sqrt(2 * Math.PI);

    return z =>
      relativeScale *
      Math.pow(1 + z * z / df, -(df + 1) / 2);
  }

  const NORMAL = normalDensity;
  const T15 = tDensity(15);
  const T3 = tDensity(3);
  const T30 = tDensity(30);

  function curve(
    density,
    color,
    strokeWidth = 3,
    baseline = BELLBASE,
    height = BELLHEIGHT
  ) {
    const parts = [];
    const steps = 100;

    for (let i = 0; i < steps; i++) {
      const a = -5 + i * 10 / steps;
      const b = -5 + (i + 1) * 10 / steps;

      parts.push(ln(
        zX(a), baseline + height * density(a),
        zX(b), baseline + height * density(b),
        color, strokeWidth
      ));
    }

    return new M.VGroup(...parts);
  }

  // Fill under a density curve using thin rectangular strips.
  function curveArea(
    density,
    a,
    b,
    color,
    opacity = 0.38,
    baseline = BELLBASE,
    height = BELLHEIGHT
  ) {
    const parts = [];

    const steps = Math.max(
      8,
      Math.round((b - a) * 14)
    );

    const step = (b - a) / steps;

    for (let i = 0; i < steps; i++) {
      const z = a + (i + 0.5) * step;
      const h = height * density(z);

      const w =
        zX(z + step / 2) -
        zX(z - step / 2);

      parts.push(rect(
        w + 0.008,
        Math.max(0.0001, h),
        zX(z),
        baseline + h / 2,
        color,
        opacity,
        0
      ));
    }

    return new M.VGroup(...parts);
  }

  function curveAxis() {
    return new M.VGroup(
      axis(
        zX,
        [-5, -4, -2, 0, 2, 4, 5],
        BELLBASE,
        'standard-error units'
      ),

      ln(
        zX(0), BELLBASE,
        zX(0), BELLBASE + BELLHEIGHT + 0.08,
        GOLD, 1.7
      )
    );
  }

  function curveLegend(items) {
    const y = P ? -4.25 : -2.67;

    const parts = [];

    const spacing = W / items.length;

    items.forEach(([name, color], i) => {
      const x = LEFT + (i + 0.5) * spacing;

      parts.push(
        ln(
          x - 0.47, y,
          x - 0.18, y,
          color, 3.5
        ),

        txt(
          name,
          P ? 16 : 14,
          color,
          [x + 0.20, y, 0]
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function singleCurvePicture({
    density = NORMAL,
    color = C.cyan,
    title = 'Normal curve',
    shadeTails = false,
    shadeCenter = false,
    cutoff = 2,
    tailRate = null,
    centralRate = null
  } = {}) {
    const parts = [];

    if (shadeTails) {
      parts.push(
        curveArea(density, -5, -cutoff, MISS, 0.52),
        curveArea(density, cutoff, 5, MISS, 0.52)
      );
    }

    if (shadeCenter) {
      parts.push(
        curveArea(density, -cutoff, cutoff, C.green, 0.32),
        curveArea(density, -5, -cutoff, MISS, 0.32),
        curveArea(density, cutoff, 5, MISS, 0.32)
      );
    }

    parts.push(
      curveAxis(),
      curve(density, color)
    );

    parts.push(txt(
      title,
      P ? 22 : 20,
      color,
      [
        CX,
        BELLBASE + BELLHEIGHT + 0.46,
        0
      ]
    ));

    if (shadeTails || shadeCenter) {
      [-cutoff, cutoff].forEach(z => {
        parts.push(new M.DashedLine({
          start: [
            zX(z),
            BELLBASE,
            0
          ],
          end: [
            zX(z),
            BELLBASE + BELLHEIGHT * density(z) + 0.18,
            0
          ],
          color: shadeCenter ? C.green : MISS
        }));
      });
    }

    if (tailRate !== null) {
      const labelY = BELLBASE + BELLHEIGHT * 0.51;

      parts.push(
        txt(
          `${tailRate.toFixed(1)}%`,
          P ? 35 : 30,
          MISS,
          [CX, labelY, 0],
          true
        ),

        txt(
          'in the two tails combined',
          P ? 18 : 16,
          C.ink,
          [CX, labelY - 0.43, 0]
        )
      );
    }

    if (centralRate !== null) {
      parts.push(txt(
        `${centralRate}%`,
        P ? 38 : 32,
        C.green,
        [
          CX,
          BELLBASE + BELLHEIGHT * 0.48,
          0
        ],
        true
      ));
    }

    if (shadeCenter) {
      // cut-off labels sit above the tail, just outside the dashed line, clear of curve and axis
      const y = BELLBASE + BELLHEIGHT * density(cutoff) + 0.62;
      const lo = txt('−' + cutoff.toFixed(2), P ? 20 : 18, GOLD, [0, y, 0], true);
      const hi = txt('+' + cutoff.toFixed(2), P ? 20 : 18, GOLD, [0, y, 0], true);
      lo.moveTo([zX(-cutoff) - lo.getWidth() / 2 - 0.06, y, 0]);
      hi.moveTo([zX(cutoff) + hi.getWidth() / 2 + 0.06, y, 0]);
      parts.push(lo, hi);
    }

    return new M.VGroup(...parts);
  }

  // Compare normal and t on identical axes.
  function twoCurves({
    df = 15,
    title = 'Normal and Student’s t',
    highlightTails = false,
    highlightMiddle = false
  } = {}) {
    const density =
      df === 3 ? T3 :
      df === 30 ? T30 :
      T15;

    const parts = [];

    if (highlightTails) {
      parts.push(
        curveArea(density, -5, -2, C.violet, 0.44),
        curveArea(density, 2, 5, C.violet, 0.44)
      );
    }

    if (highlightMiddle) {
      parts.push(
        curveArea(NORMAL, -1, 1, C.cyan, 0.14)
      );
    }

    parts.push(
      curveAxis(),
      curve(NORMAL, C.cyan, 2.6),
      curve(density, C.violet, 3.2),

      txt(
        title,
        P ? 22 : 20,
        C.ink,
        [
          CX,
          BELLBASE + BELLHEIGHT + 0.46,
          0
        ]
      ),

      curveLegend([
        ['Normal', C.cyan],
        [`t (${df})`, C.violet]
      ])
    );

    if (highlightTails) {
      [-2, 2].forEach(z => {
        parts.push(new M.DashedLine({
          start: [zX(z), BELLBASE, 0],
          end: [
            zX(z),
            BELLBASE + BELLHEIGHT * density(z) + 0.25,
            0
          ],
          color: GOLD
        }));
      });

      const labelY = BELLBASE + BELLHEIGHT * 0.30;

      parts.push(
        txt(
          'TAIL',
          P ? 19 : 17,
          C.violet,
          [zX(-3.65), labelY, 0],
          true
        ),

        txt(
          'TAIL',
          P ? 19 : 17,
          C.violet,
          [zX(3.65), labelY, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // The t family: three degrees-of-freedom values and normal.
  function familyPicture() {
    const parts = [
      curveAxis(),

      curve(T3, GOLD, 2.8),
      curve(T15, C.violet, 2.8),
      curve(T30, C.green, 2.5),
      curve(NORMAL, C.cyan, 2.2),

      txt(
        'A family of bell curves',
        P ? 22 : 20,
        C.ink,
        [
          CX,
          BELLBASE + BELLHEIGHT + 0.46,
          0
        ]
      )
    ];

    const legendY = P ? -4.24 : -2.58;
    const rowGap = P ? 0.42 : 0.31;

    const items = [
      ['t: 3 df', GOLD],
      ['t: 15 df', C.violet],
      ['t: 30 df', C.green],
      ['Normal', C.cyan]
    ];

    items.forEach(([name, color], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);

      const x = CX + (col === 0 ? -1.36 : 1.36);
      const y = legendY - row * rowGap;

      parts.push(
        ln(
          x - 0.70, y,
          x - 0.31, y,
          color, 3.5
        ),

        txt(
          name,
          P ? 17 : 14,
          color,
          [x + 0.35, y, 0]
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // Draw a 100-cell pictogram of tail probability.
  // Rounded representative counts, not individual simulation draws.
  function tailGrid(rate, label, color) {
    const parts = [];
    const misses = Math.round(rate);

    const cols = 10;
    const rows = 10;

    const dx = P ? 0.51 : 0.39;
    const dy = P ? 0.42 : 0.27;

    const top = P ? 0.60 : 0.55;

    for (let i = 0; i < 100; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = CX + (col - 4.5) * dx;
      const y = top - row * dy;

      const rank = (i * 37 + 11) % 100;
      const outside = rank < misses;

      parts.push(glowDot(
        x,
        y,
        outside ? MISS : color,
        P ? 0.080 : 0.057
      ));
    }

    parts.push(
      txt(
        label,
        P ? 22 : 20,
        color,
        [CX, top + 0.64, 0]
      ),

      txt(
        `${rate.toFixed(1)}% beyond ±2`,
        P ? 25 : 22,
        MISS,
        [CX, top - 9 * dy - 0.48, 0],
        true
      ),

      txt(
        `About ${misses} of every 100`,
        P ? 18 : 16,
        C.muted,
        [CX, top - 9 * dy - 0.88, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // Sixteen cards arranged in a four-by-four grid.
  // Fifteen free values and the last constrained by the known mean.
  function freedomPicture({
    knownMean = false,
    lastUnknown = false,
    revealLast = false,
    highlightLast = false,
    showValues = false
  } = {}) {
    const parts = [];

    const dx = P ? 1.16 : 1.00;
    const dy = P ? 0.75 : 0.60;

    const top = P ? 0.65 : 0.63;

    const bottom = top - 3 * dy;

    for (let i = 0; i < N; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);

      const x = CX + (col - 1.5) * dx;
      const y = top - row * dy;

      const last = i === N - 1;

      const color =
        last && (lastUnknown || highlightLast || revealLast)
          ? GOLD
          : knownMean
            ? C.green
            : C.cyan;

      const card = new M.RoundedRectangle({
        width: dx * 0.85,
        height: dy * 0.79,
        cornerRadius: 0.09,
        color,
        strokeWidth: last && highlightLast ? 2.5 : 1.5
      });

      card.setFill(
        last && highlightLast ? GOLD : C.card,
        last && highlightLast ? 0.20 : 0.95
      );

      card.moveTo([x, y, 0]);

      const value =
        last && lastUnknown && !revealLast
          ? '?'
          : showValues || revealLast
            ? String(D1[i])
            : String(i + 1);

      const text = txt(
        value,
        P ? 24 : 21,
        color,
        [x, y, 0],
        true
      );

      parts.push(new M.VGroup(card, text));
    }

    parts.push(txt(
      knownMean
        ? 'Mean fixed at 30 minutes'
        : '16 delivery observations',
      P ? 22 : 20,
      knownMean ? GOLD : C.ink,
      [CX, top + 0.65, 0]
    ));

    if (knownMean) {
      parts.push(txt(
        'Total must equal 480',
        P ? 21 : 19,
        GOLD,
        [CX, bottom - 0.58, 0],
        true
      ));
    }

    if (lastUnknown && !revealLast) {
      parts.push(txt(
        'First 15 add to 443',
        P ? 20 : 17,
        C.green,
        [CX, bottom - 1.00, 0],
        true
      ));
    }

    if (revealLast) {
      parts.push(txt(
        'Last value = 480 − 443 = 37',
        P ? 20 : 17,
        C.green,
        [CX, bottom - 1.00, 0],
        true
      ));
    }

    return new M.VGroup(...parts);
  }

  // Compare central 95% cut-offs on a common axis.
  function cutoffComparison({
    showNormal = true,
    showT15 = true,
    showT3 = true,
    showT30 = true
  } = {}) {
    const items = [];

    if (showNormal) {
      items.push({
        name: 'Normal',
        cutoff: CRITICAL_NORMAL,
        color: C.cyan
      });
    }

    if (showT15) {
      items.push({
        name: 't: 15 df',
        cutoff: CRITICAL_T15,
        color: C.violet
      });
    }

    if (showT3) {
      items.push({
        name: 't: 3 df',
        cutoff: CRITICAL_T3,
        color: GOLD
      });
    }

    if (showT30) {
      items.push({
        name: 't: 30 df',
        cutoff: CRITICAL_T30,
        color: C.green
      });
    }

    const x = z => LEFT + (z + 4) / 8 * W;

    const top = P ? 0.80 : 1.00;
    const pitch = P ? 1.10 : 0.74;
    const bottom = top - (items.length - 1) * pitch;

    const base = P ? -3.70 : -2.30;

    const parts = [
      axis(
        x,
        [-4, -2, 0, 2, 4],
        base,
        'standard-error units'
      ),

      ln(
        x(0), base,
        x(0), top + 0.22,
        GOLD, 1.7
      )
    ];

    items.forEach(({ name, cutoff, color }, i) => {
      const y = top - i * pitch;

      parts.push(
        net(
          x,
          0,
          cutoff,
          y,
          color,
          P ? 0.13 : 0.10
        ),

        glowDot(
          x(0),
          y,
          color,
          P ? 0.07 : 0.055
        ),

        txt(
          name,
          P ? 18 : 15,
          color,
          [CX, y + 0.32, 0]
        ),

        txt(
          '−' + cutoff.toFixed(2),
          P ? 17 : 14,
          color,
          [x(-cutoff), y - 0.27, 0],
          true
        ),

        txt(
          '+' + cutoff.toFixed(2),
          P ? 17 : 14,
          color,
          [x(cutoff), y - 0.27, 0],
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // Compare the two actual interval recipes, holding SE = 1 fixed.
  function intervalComparison({
    df = 15,
    critical = CRITICAL_T15,
    title = 'Same estimate, different cut-offs',
    showEndpoints = false
  } = {}) {
    const wideY = P ? 0.25 : 0.22;
    const narrowY = P ? -1.70 : -1.05;
    const base = P ? -3.45 : -2.20;

    const parts = [
      axis(
        minuteX,
        [26, 28, 30, 32, 34],
        base
      ),

      net(
        minuteX,
        MEAN,
        CRITICAL_NORMAL * SE,
        wideY,
        C.cyan,
        0.15
      ),

      glowDot(
        minuteX(MEAN),
        wideY,
        C.cyan,
        0.085
      ),

      txt(
        'Normal: ±1.96 SE',
        P ? 20 : 18,
        C.cyan,
        [CX, wideY + 0.45, 0]
      ),

      net(
        minuteX,
        MEAN,
        critical * SE,
        narrowY,
        C.violet,
        0.15
      ),

      glowDot(
        minuteX(MEAN),
        narrowY,
        C.violet,
        0.085
      ),

      txt(
        `t (${df} df): ±${critical.toFixed(2)} SE`,
        P ? 20 : 18,
        C.violet,
        [CX, narrowY + 0.45, 0]
      ),

      txt(
        title,
        P ? 18 : 16,
        C.muted,
        [CX, wideY + 0.97, 0]
      )
    ];

    if (showEndpoints) {
      parts.push(
        txt(
          '28.04',
          P ? 18 : 15,
          C.cyan,
          [minuteX(28.04), wideY - 0.37, 0],
          true
        ),

        txt(
          '31.96',
          P ? 18 : 15,
          C.cyan,
          [minuteX(31.96), wideY - 0.37, 0],
          true
        ),

        txt(
          (MEAN - critical).toFixed(2),
          P ? 18 : 15,
          C.violet,
          [minuteX(MEAN - critical), narrowY - 0.37, 0],
          true
        ),

        txt(
          (MEAN + critical).toFixed(2),
          P ? 18 : 15,
          C.violet,
          [minuteX(MEAN + critical), narrowY - 0.37, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // A schematic biased sample.
  // This is not a claim that Sami's actual sample was biased.
  function biasPicture() {
    const example = [
      22.8, 23.5, 24.7, 25.2, 26.1,
      27.0, 28.4, 29.1, 30.3, 31.5,
      33.0, 34.2, 35.1, 36.0, 37.2
    ];

    const selected = example.slice(0, 8);

    const x = realX;

    const topY = P ? 0.45 : 0.42;
    const bottomY = P ? -1.75 : -1.08;
    const base = P ? -3.20 : -2.20;

    const parts = [
      axis(
        x,
        [22, 26, 30, 34, 38],
        base
      ),

      txt(
        'All kinds of delivery days',
        P ? 20 : 18,
        C.ink,
        [CX, topY + 0.58, 0]
      ),

      txt(
        'Sample skips the slow days',
        P ? 20 : 18,
        GOLD,
        [CX, bottomY + 0.58, 0]
      )
    ];

    example.forEach((v, i) => {
      const color = i < selected.length
        ? C.cyan
        : C.violet;

      parts.push(glowDot(
        x(v),
        topY,
        color,
        P ? 0.075 : 0.060
      ));
    });

    example.forEach((v, i) => {
      if (i < selected.length) {
        parts.push(glowDot(
          x(v),
          bottomY,
          C.cyan,
          P ? 0.075 : 0.060
        ));
      } else {
        const d = new M.Circle({
          radius: P ? 0.075 : 0.060,
          color: MISS,
          strokeWidth: 1.5
        });

        d.setFill(MISS, 0.06);
        d.moveTo([x(v), bottomY, 0]);

        parts.push(d);
      }
    });

    const omittedLeft = x(29.8);
    const omittedRight = x(37.8);

    parts.push(
      outline(
        (omittedLeft + omittedRight) / 2,
        bottomY,
        omittedRight - omittedLeft,
        0.48,
        MISS
      ),

      txt(
        'Missing slow days',
        P ? 17 : 15,
        MISS,
        [
          (omittedLeft + omittedRight) / 2,
          bottomY - 0.40,
          0
        ]
      ),

      txt(
        'Illustrative unfair sample',
        P ? 16 : 14,
        C.muted,
        [CX, base - 0.95, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // 0: In the last lesson, Sami's net was a little too small.
  // ---------------------------------------------------------------

  const coverage = coveragePicture();

  await until(S(0));
  await play(
    ...picture(coverage),
    ...say('THE NORMAL NET WAS TOO SMALL', GOLD),
    ...fbox([
      ['target = 95%', C.green],
      ['actual ≈ 93.5%', MISS],
      'Why the shortfall?'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 1: The delivery spread was guessed using only sixteen deliveries.
  // ---------------------------------------------------------------

  const observedSpread = samplePicture(true);

  await until(S(1));
  await play(
    ...picture(observedSpread),
    ...say('WE GUESSED THE DELIVERY SPREAD', GOLD),
    ...fbox([
      '16 deliveries',
      ['sample SD = 4', GOLD],
      'The spread is a guess.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 2: Why does a guessed spread matter?
  // ---------------------------------------------------------------

  await until(S(2));
  await play(
    ...say('WHY DOES THAT EXTRA GUESS MATTER?', GOLD),
    ...fbox([
      'We estimated the mean.',
      'We estimated the spread.',
      ['Two uncertain quantities', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 3: Imagine many samples of sixteen deliveries.
  // ---------------------------------------------------------------

  const samples = samplesPicture(false);

  await until(S(3));
  await play(
    ...picture(samples),
    ...say('MANY SAMPLES OF 16 DELIVERIES'),
    ...fbox([
      'Same route',
      'New sample each time',
      ['One mean per dot', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 4: Measure how far each mean is from the truth.
  // ---------------------------------------------------------------

  const distances = samplesPicture(true);

  await until(S(4));
  await play(
    ...picture(distances),
    ...say('MEASURE EACH MEAN’S ERROR', C.violet),
    ...fbox([
      ['Gold line = truth', GOLD],
      ['Dot = sample mean', C.cyan],
      ['Error = their difference', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 5: Measure distance in standard-error units.
  // ---------------------------------------------------------------

  const knownRuler = rulerPicture(1, false);

  await until(S(5));
  await play(
    ...picture(knownRuler),
    ...say('USE STANDARD ERRORS AS A RULER', C.green),
    ...fbox([
      'error = 2 minutes',
      'SE = 1 minute',
      ['2 ÷ 1 = 2 SE', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 6: Known spread gives the normal bell curve.
  // ---------------------------------------------------------------

  const knownSpreadCurve = singleCurvePicture({
    density: NORMAL,
    color: C.cyan,
    title: 'Known spread: normal curve'
  });

  await until(S(6));
  await play(
    ...picture(knownSpreadCurve),
    ...say('KNOWN SPREAD → NORMAL CURVE'),
    ...fbox([
      'If the true spread',
      'were known...',
      ['Normal bell curve', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 7: Each sample now guesses its own spread.
  // ---------------------------------------------------------------

  const estimatedRuler = rulerPicture(1, true);

  await until(S(7));
  await play(
    ...picture(estimatedRuler),
    ...say('NOW EACH SAMPLE GUESSES ITS RULER', GOLD),
    ...fbox([
      'New sample',
      'New spread estimate',
      ['New standard error', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 8: A spread guess that is too large makes measured error smaller.
  // ---------------------------------------------------------------

  const largeRuler = rulerPicture(1.5, true);

  await until(S(8));
  await play(
    ...picture(largeRuler),
    ...say('RULER TOO BIG → DISTANCE LOOKS SMALL', GOLD),
    ...fbox([
      'Same actual error: 2',
      'Guessed SE = 1.5',
      ['2 ÷ 1.5 ≈ 1.33 SE', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 9: A spread guess that is too small makes measured error larger.
  // ---------------------------------------------------------------

  const smallRuler = rulerPicture(0.5, true);

  await until(S(9));
  await play(
    ...picture(smallRuler),
    ...say('RULER TOO SMALL → DISTANCE LOOKS BIG', C.violet),
    ...fbox([
      'Same actual error: 2',
      'Guessed SE = 0.5',
      ['2 ÷ 0.5 = 4 SE', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 10: Small spread guesses push distances out towards the sides.
  // ---------------------------------------------------------------

  const stretched = stretchedDistances();

  await until(S(10));
  await play(
    ...picture(stretched),
    ...say('SOME DISTANCES GET PUSHED FAR OUT', C.violet),
    ...fbox([
      'Small guessed SE',
      'makes the measured',
      ['distance much larger', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 11: Still a bell, but with more weight at the far ends.
  // ---------------------------------------------------------------

  const thickerBell = singleCurvePicture({
    density: T15,
    color: C.violet,
    title: 'Bell with heavier far ends',
    shadeTails: true,
    cutoff: 2
  });

  await until(S(11));
  await play(
    ...picture(thickerBell),
    ...say('STILL A BELL, BUT HEAVIER AT THE ENDS', C.violet),
    ...fbox([
      'Most distances',
      'are near the middle.',
      ['More extreme values', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 12: The far ends are called tails.
  // ---------------------------------------------------------------

  const tails = twoCurves({
    df: DF,
    title: 'The far ends are the tails',
    highlightTails: true
  });

  await until(S(12));
  await play(
    ...picture(tails),
    ...say('TAILS = THE FAR ENDS', C.violet),
    ...fbox([
      ['Left tail', C.violet],
      'The middle',
      ['Right tail', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 13: Compare the two curves.
  // The t curve has a lower centre and thicker tails.
  // ---------------------------------------------------------------

  const bothCurves = twoCurves({
    df: DF,
    title: 'Lower middle, thicker tails'
  });

  await until(S(13));
  await play(
    ...picture(bothCurves),
    ...say('LOWER IN THE MIDDLE, THICKER IN THE TAILS', C.violet),
    ...fbox([
      ['Normal: cyan', C.cyan],
      ['New curve: violet', C.violet],
      'Same total area'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 14: Name Student's t distribution.
  // ---------------------------------------------------------------

  await until(S(14));
  await play(
    ...say('STUDENT’S t DISTRIBUTION', C.violet),
    ...fbox([
      ['Student’s t', C.violet],
      'A bell-shaped curve',
      'with thicker tails'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 15: Student was the pen name of William Gosset.
  // Use a simple publication card rather than an invented portrait.
  // ---------------------------------------------------------------

  const paper = new M.RoundedRectangle({
    width: P ? 4.75 : 4.55,
    height: P ? 3.70 : 3.15,
    cornerRadius: 0.17,
    color: C.muted,
    strokeWidth: 2
  });

  const paperY = P ? -0.95 : -0.60;

  paper.setFill(C.card, 0.95);
  paper.moveTo([CX, paperY, 0]);

  const paperTitle = txt(
    'STUDENT',
    P ? 32 : 28,
    C.violet,
    [CX, paperY + 1.03, 0],
    true
  );

  const paperDivider = ln(
    CX - 1.65, paperY + 0.64,
    CX + 1.65, paperY + 0.64,
    C.muted, 1.5
  );

  const paperName = txt(
    'William Gosset',
    P ? 25 : 23,
    C.ink,
    [CX, paperY + 0.18, 0]
  );

  const paperSubtitle = txt(
    'Brewery statistician',
    P ? 19 : 17,
    C.muted,
    [CX, paperY - 0.29, 0]
  );

  const paperFocus = txt(
    'Studying small samples',
    P ? 20 : 18,
    C.violet,
    [CX, paperY - 0.91, 0]
  );

  const gossetPicture = new M.VGroup(
    paper,
    paperTitle,
    paperDivider,
    paperName,
    paperSubtitle,
    paperFocus
  );

  await until(S(15));
  await play(
    ...picture(gossetPicture),
    ...say('“STUDENT” WAS A PEN NAME', C.violet),
    ...fbox([
      'William Gosset',
      'Worked at a brewery',
      ['Studied small samples', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 16: Count distances more than two standard errors from centre.
  // ---------------------------------------------------------------

  const tailQuestion = twoCurves({
    df: DF,
    title: 'How much lies beyond ±2?',
    highlightTails: true
  });

  await until(S(16));
  await play(
    ...picture(tailQuestion),
    ...say('COUNT EVERYTHING BEYOND ±2 SE', GOLD),
    ...fbox([
      'Below −2',
      'or above +2',
      ['Both tails combined', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 17: Normal tail probability is 4.6%.
  // ---------------------------------------------------------------

  const normalTails = singleCurvePicture({
    density: NORMAL,
    color: C.cyan,
    title: 'Normal: beyond ±2',
    shadeTails: true,
    cutoff: 2,
    tailRate: TAIL_NORMAL
  });

  await until(S(17));
  await play(
    ...picture(normalTails),
    ...say('NORMAL: ABOUT 4 OR 5 IN 100', C.cyan),
    ...fbox([
      'Normal curve',
      ['tail share = 4.6%', C.cyan],
      'About 5 in 100'
    ])
  );

  // ---------------------------------------------------------------
  // 18: Student's t with fifteen degrees of freedom: 6.4%.
  // ---------------------------------------------------------------

  const studentTails = singleCurvePicture({
    density: T15,
    color: C.violet,
    title: 't (15 df): beyond ±2',
    shadeTails: true,
    cutoff: 2,
    tailRate: TAIL_T15
  });

  await until(S(18));
  await play(
    ...picture(studentTails),
    ...say('STUDENT’S t: ABOUT 6 IN 100', C.violet),
    ...fbox([
      ['Normal = 4.6%', C.cyan],
      ['t (15) = 6.4%', C.violet],
      'More weight in tails'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 19: There is a whole family of t curves.
  // ---------------------------------------------------------------

  const family = familyPicture();

  await until(S(19));
  await play(
    ...picture(family),
    ...say('A WHOLE FAMILY OF t CURVES', C.violet),
    ...fbox([
      ['degrees of freedom', C.violet],
      'Choose which member',
      'of the family to use.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 20: Degrees of freedom = sample size minus one.
  // ---------------------------------------------------------------

  const sixteenCards = freedomPicture();

  await until(S(20));
  await play(
    ...picture(sixteenCards),
    ...say('DEGREES OF FREEDOM = SAMPLE SIZE − 1', GOLD),
    ...fbox([
      'For one sample:',
      ['df = n − 1', GOLD],
      'n = sample size'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 21: Sami has 16 observations, therefore 15 degrees of freedom.
  // ---------------------------------------------------------------

  const fifteenFree = freedomPicture({
    knownMean: true,
    highlightLast: true
  });

  await until(S(21));
  await play(
    ...picture(fifteenFree),
    ...say('16 − 1 = 15 DEGREES OF FREEDOM', C.green),
    ...fbox([
      'n = 16',
      'df = 16 − 1',
      ['df = 15', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 22: Why minus one?
  // Spread is measured around the sample's own mean.
  // ---------------------------------------------------------------

  const meanFixed = freedomPicture({
    knownMean: true,
    showValues: true,
    highlightLast: true
  });

  await until(S(22));
  await play(
    ...picture(meanFixed),
    ...say('THE SAMPLE MEAN USES ONE PIECE OF INFORMATION', GOLD),
    ...fbox([
      ['mean = 30', GOLD],
      '16 values',
      'Total = 16 × 30',
      ['Total = 480', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 23: Once the mean and first fifteen values are fixed,
  // the last delivery is no longer free.
  // ---------------------------------------------------------------

  const missingLast = freedomPicture({
    knownMean: true,
    lastUnknown: true,
    showValues: true,
    highlightLast: true
  });

  await until(S(23));
  await play(
    ...picture(missingLast),
    ...say('THE FIRST 15 ALREADY FIX THE LAST', GOLD),
    ...fbox([
      'Known total = 480',
      'First 15 sum = 443',
      ['Last = 480 − 443', GOLD]
    ], GOLD)
  );

  await until(S(23) + 2.7);

  const revealedLast = freedomPicture({
    knownMean: true,
    revealLast: true,
    highlightLast: true
  });

  await play(
    ...picture(revealedLast),
    ...fbox([
      'Last = 480 − 443',
      ['Last = 37', C.green],
      'No free choice left.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 24: One piece of information has been used up.
  // ---------------------------------------------------------------

  await until(S(24));
  await play(
    ...say('ONE PIECE OF INFORMATION USED UP', GOLD),
    ...fbox([
      '16 observations',
      '1 mean constraint',
      ['15 degrees of freedom', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 25: Find the cut-off that keeps 95% in the middle.
  // ---------------------------------------------------------------

  const middleQuestion = singleCurvePicture({
    density: T15,
    color: C.violet,
    title: 'Keep the middle 95%',
    shadeCenter: true,
    cutoff: CRITICAL_T15,
    centralRate: 95
  });

  // Hide the numerical cut-off until the following narration beats
  // by first presenting the central area without a value label.
  const questionParts = [
    curveArea(
      T15,
      -CRITICAL_T15,
      CRITICAL_T15,
      C.green,
      0.32
    ),

    curveArea(
      T15,
      -5,
      -CRITICAL_T15,
      MISS,
      0.32
    ),

    curveArea(
      T15,
      CRITICAL_T15,
      5,
      MISS,
      0.32
    ),

    curveAxis(),

    curve(T15, C.violet),

    txt(
      'Keep the middle 95%',
      P ? 22 : 20,
      C.ink,
      [CX, BELLBASE + BELLHEIGHT + 0.46, 0]
    ),

    txt(
      '95%',
      P ? 38 : 32,
      C.green,
      [CX, BELLBASE + BELLHEIGHT * 0.50, 0],
      true
    ),

    txt(
      '−?',
      P ? 21 : 19,
      GOLD,
      [zX(-CRITICAL_T15), BELLBASE + 0.30, 0],
      true
    ),

    txt(
      '+?',
      P ? 21 : 19,
      GOLD,
      [zX(CRITICAL_T15), BELLBASE + 0.30, 0],
      true
    )
  ];

  [-CRITICAL_T15, CRITICAL_T15].forEach(z => {
    questionParts.push(new M.DashedLine({
      start: [zX(z), BELLBASE, 0],
      end: [
        zX(z),
        BELLBASE + BELLHEIGHT * T15(z) + 0.18,
        0
      ],
      color: GOLD
    }));
  });

  const cutoffQuestion = new M.VGroup(...questionParts);

  await until(S(25));
  await play(
    ...picture(cutoffQuestion),
    ...say('FIND THE CUT-OFF FOR THE MIDDLE 95%', C.green),
    ...fbox([
      'Middle = 95%',
      'Left tail = 2.5%',
      'Right tail = 2.5%',
      ['Cut-off = ?', GOLD]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 26: Normal critical value = 1.96.
  // ---------------------------------------------------------------

  const normalCritical = singleCurvePicture({
    density: NORMAL,
    color: C.cyan,
    title: 'Normal: middle 95%',
    shadeCenter: true,
    cutoff: CRITICAL_NORMAL,
    centralRate: 95
  });

  await until(S(26));
  await play(
    ...picture(normalCritical),
    ...say('NORMAL CUT-OFF = 1.96', C.cyan),
    ...fbox([
      'Normal curve',
      ['critical value = 1.96', C.cyan],
      'Middle 95%'
    ])
  );

  // ---------------------------------------------------------------
  // 27: With fifteen degrees of freedom, critical value = 2.13.
  // ---------------------------------------------------------------

  const t15Critical = middleQuestion;

  await until(S(27));
  await play(
    ...picture(t15Critical),
    ...say('t WITH 15 df: CUT-OFF = 2.13', C.violet),
    ...fbox([
      'Sami: df = 15',
      ['Normal = 1.96', C.cyan],
      ['t (15) = 2.13', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 28: With three degrees of freedom, critical value = 3.18.
  // ---------------------------------------------------------------

  const t3Critical = singleCurvePicture({
    density: T3,
    color: GOLD,
    title: 't (3 df): middle 95%',
    shadeCenter: true,
    cutoff: CRITICAL_T3,
    centralRate: 95
  });

  await until(S(28));
  await play(
    ...picture(t3Critical),
    ...say('t WITH 3 df: CUT-OFF = 3.18', GOLD),
    ...fbox([
      'Only 4 observations',
      'df = 4 − 1 = 3',
      ['t (3) = 3.18', GOLD],
      'Much wider cut-off'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 29: With thirty degrees of freedom, critical value = 2.04.
  // ---------------------------------------------------------------

  const t30Critical = singleCurvePicture({
    density: T30,
    color: C.green,
    title: 't (30 df): middle 95%',
    shadeCenter: true,
    cutoff: CRITICAL_T30,
    centralRate: 95
  });

  await until(S(29));
  await play(
    ...picture(t30Critical),
    ...say('t WITH 30 df: CUT-OFF = 2.04', C.green),
    ...fbox([
      ['t (30) = 2.04', C.green],
      ['Normal = 1.96', C.cyan],
      'Almost the same'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 30: More data gives a better spread guess.
  // Student's t approaches the normal distribution.
  // ---------------------------------------------------------------

  const smallDFComparison = twoCurves({
    df: 3,
    title: 'Few observations: larger difference'
  });

  await until(S(30));
  await play(
    ...picture(smallDFComparison),
    ...say('MORE DATA → t GETS CLOSER TO NORMAL', C.green),
    ...fbox([
      ['Few data: thicker tails', GOLD],
      'More data:',
      'Better spread estimate'
    ], C.green)
  );

  await until(S(30) + 2.3);

  const largeDFComparison = twoCurves({
    df: 30,
    title: 'More observations: curves converge'
  });

  await play(
    ...picture(largeDFComparison),
    ...fbox([
      ['t (30) = 2.04', C.green],
      ['Normal = 1.96', C.cyan],
      'Curves nearly coincide'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 31: The t curve pays for the extra uncertainty
  // introduced by estimating the spread.
  // ---------------------------------------------------------------

  const widerT = twoCurves({
    df: DF,
    title: 'Extra uncertainty: thicker tails',
    highlightTails: true
  });

  await until(S(31));
  await play(
    ...picture(widerT),
    ...say('t ALLOWS FOR GUESSING THE SPREAD', C.violet),
    ...fbox([
      'Extra spread uncertainty',
      'means heavier tails.',
      ['Use a larger cut-off', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 32: Use the right cut-off for small samples with estimated spread.
  // ---------------------------------------------------------------

  const allCutoffs = cutoffComparison();

  await until(S(32));
  await play(
    ...picture(allCutoffs),
    ...say('CHOOSE THE CUT-OFF FOR YOUR SAMPLE SIZE', C.green),
    ...fbox([
      ['Normal = 1.96', C.cyan],
      ['t (3)   = 3.18', GOLD],
      ['t (15)  = 2.13', C.violet],
      ['t (30)  = 2.04', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 33: Common trap.
  // ---------------------------------------------------------------

  const trapTitle = txt(
    'STILL USING 1.96?',
    P ? 29 : 26,
    GOLD,
    [CX, P ? 0.30 : 0.22, 0],
    true
  );

  const trapQuestion = txt(
    'What if the sample is small?',
    P ? 22 : 19,
    C.ink,
    [CX, P ? -0.46 : -0.47, 0]
  );

  const trapNet = net(
    minuteX,
    MEAN,
    CRITICAL_NORMAL,
    P ? -1.65 : -1.30,
    C.cyan,
    0.15
  );

  const trapPicture = new M.VGroup(
    trapTitle,
    trapQuestion,
    trapNet
  );

  await until(S(33));
  await play(
    ...picture(trapPicture),
    ...say('COMMON TRAP', GOLD),
    ...fbox([
      ['Be careful!', GOLD],
      'Small sample?',
      'Spread estimated?',
      'Do not default to 1.96.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 34: With small samples, the normal net is too narrow.
  // ---------------------------------------------------------------

  const samiComparison = intervalComparison({
    df: DF,
    critical: CRITICAL_T15,
    title: 'Sami’s 16 deliveries',
    showEndpoints: false
  });

  await until(S(34));
  await play(
    ...picture(samiComparison),
    ...say('SMALL SAMPLE: 1.96 IS TOO SMALL', GOLD),
    ...fbox([
      'Sami: n = 16',
      ['Normal = 1.96', C.cyan],
      ['Correct t = 2.13', C.violet],
      'Use the wider net.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 35: For large samples, the two cut-offs become very similar.
  // ---------------------------------------------------------------

  const largerComparison = intervalComparison({
    df: 30,
    critical: CRITICAL_T30,
    title: 'As the sample grows'
  });

  await until(S(35));
  await play(
    ...picture(largerComparison),
    ...say('THE DIFFERENCE SHRINKS WITH MORE DATA', C.green),
    ...fbox([
      ['Normal = 1.96', C.cyan],
      ['t (30) = 2.04', C.green],
      'Larger samples:',
      'Smaller correction'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 36: Thicker tails cannot fix an unfair or biased sample.
  // ---------------------------------------------------------------

  const unfairSample = biasPicture();

  await until(S(36));
  await play(
    ...picture(unfairSample),
    ...say('t CANNOT FIX AN UNFAIR SAMPLE', MISS),
    ...fbox([
      'Thicker tails allow for',
      'guessing the spread.',
      ['They do not fix bias.', MISS],
      'Include busy days too.'
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 37: Preview the corrected interval using 2.13.
  // ---------------------------------------------------------------

  const nextInterval = intervalComparison({
    df: DF,
    critical: CRITICAL_T15,
    title: 'Next: Sami’s corrected net'
  });

  await until(S(37));
  await play(
    ...picture(nextInterval),
    ...say('NEXT: BUILD THE NET USING 2.13', C.violet),
    ...fbox([
      ['estimate = 30', C.cyan],
      'standard error = 1',
      'df = 15',
      ['t cut-off = 2.13', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 38: Final one-sentence summary.
  // Keep the comparison of the two curves visible until narration ends.
  // ---------------------------------------------------------------

  const finalCurves = twoCurves({
    df: DF,
    title: 'Student’s t: thicker tails',
    highlightTails: true
  });

  await until(S(38));
  await play(
    ...picture(finalCurves),
    ...say('STUDENT’S t = BELL WITH THICKER TAILS', C.violet),
    ...fbox([
      ['Student’s t distribution', C.violet],
      'A bell with thicker tails',
      'Used when the spread',
      ['is estimated', GOLD]
    ], C.violet)
  );
}

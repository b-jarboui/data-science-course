// lesson 10.4.6
// Posterior predictive checks: can the model reproduce the clinic's pattern?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses deterministic, seeded simulations for reproducible playback.
// Uses the supplied engine interface; browser integration has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Responsive layout and colours
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;
  const PILL = P ? [0, -4.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 2.70, 0] : [4.25, -0.25, 0];

  const RED = C.red || '#FF526F';
  const WHITE = '#E8EDF5';

  const MODEL_A = C.amber;
  const MODEL_B = C.cyan;
  const PRIOR = C.violet;
  const POST = C.green;

  const WITH = C.cyan;
  const WITHOUT = C.violet;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function txt(s, size, color, pos, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(pos);
    return t;
  }

  function ln(a, b, color = C.muted, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dash(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function dt(p, color, radius = 0.11) {
    return new M.Dot({
      point: p,
      radius,
      color
    });
  }

  function rect(w, h, p, color, opacity = 0.7) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1
    });

    r.setFill(color, opacity);
    r.moveTo(p);
    return r;
  }

  function tag(s, color, p, size = 16) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  // ------------------------------------------------------------
  // Independent object management.
  // Never regroup objects already on screen.
  // ------------------------------------------------------------

  const visible = Object.create(null);

  function put(key, obj) {
    const a = [];

    if (visible[key]) {
      a.push(new M.FadeOut(visible[key]));
    }

    visible[key] = obj;

    if (obj) {
      a.push(new M.FadeIn(obj));
    }

    return a;
  }

  function remove(...keys) {
    const a = [];

    keys.forEach(key => {
      if (visible[key]) {
        a.push(new M.FadeOut(visible[key]));
        delete visible[key];
      }
    });

    return a;
  }

  // ------------------------------------------------------------
  // Formula box: same structure as the approved lesson
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.44 : 0.41;

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
      const ind =
        cw * (
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
    const maxw = P ? FW - 1.2 : 4.15;

    if (wd > maxw) {
      g.scale(maxw / wd);
    }

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [new M.FadeOut(boxNow)];
    boxNow = null;

    return a;
  }

  // ------------------------------------------------------------
  // Shared chapter data.
  //
  // Reminder morning:       1 missed / 10
  // Reminder afternoon:     1 missed / 10
  // No reminder morning:    3 missed / 10
  // No reminder afternoon:  5 missed / 10
  //
  // Total: 10 missed / 40
  // Observed gap: 8 - 2 = 6
  // ------------------------------------------------------------

  const REAL = [
    [2],
    [6],
    [1, 4, 8],
    [0, 2, 4, 6, 9]
  ];

  const OBS_TOTAL = 10;
  const OBS_GAP = 6;

  // The three narration examples are fixed illustrative replays.
  // They are separate from the subsequent 200,000 random draws.

  const REPLAY_1 = [
    [1, 5],
    [0, 4, 8],
    [2, 7],
    [1, 5, 9]
  ];

  const REPLAY_2 = [
    [4],
    [8],
    [0, 2, 5, 7],
    [1, 3, 6, 9]
  ];

  const REPLAY_3 = [
    [1, 7],
    [5],
    [0, 6],
    [2, 4, 9]
  ];

  const EMPTY = [
    null,
    null,
    null,
    null
  ];

  // ------------------------------------------------------------
  // Appointment grid
  // ------------------------------------------------------------

  const SP = P ? 0.51 : 0.53;
  const ROW_SP = P ? 0.62 : 0.52;
  const GROUP_GAP = P ? 0.48 : 0.40;
  const RAD = P ? 0.145 : 0.135;

  const GX = CX + 0.32;
  const GY = P ? 0.15 : 0.71;

  const gx = c => GX + (c - 4.5) * SP;

  const gy = r =>
    GY - r * ROW_SP - (r >= 2 ? GROUP_GAP : 0);

  function phoneIcon(x, y, color = WITH) {
    const shell = new M.RoundedRectangle({
      width: P ? 0.30 : 0.25,
      height: P ? 0.44 : 0.38,
      cornerRadius: 0.035,
      color,
      strokeWidth: 1.8
    });

    shell.setFill(C.card, 0.8);
    shell.moveTo([x, y, 0]);

    const screen = ln(
      [x - 0.075, y + 0.12, 0],
      [x + 0.075, y + 0.12, 0],
      color,
      1
    );

    const home = dt(
      [x, y - 0.13, 0],
      color,
      0.03
    );

    return new M.VGroup(shell, screen, home);
  }

  function appointment(p, state, pretend = false) {
    // state = null: not yet filled
    // state = true: missed
    // state = false: kept

    if (state === null) {
      const ring = new M.Circle({
        radius: RAD,
        color: C.muted,
        strokeWidth: 1.5
      });

      ring.setFill(C.card, 0);
      ring.moveTo(p);

      return ring;
    }

    const color = state ? RED : WHITE;
    const d = dt(p, color, RAD);

    d.setFill(color, state ? 1 : 0.92);

    const objects = [];

    if (state) {
      const halo = dt(
        p,
        RED,
        RAD * 1.65
      );

      halo.setFill(RED, 0.15);
      objects.push(halo);
    }

    objects.push(d);

    if (pretend) {
      const outline = new M.Circle({
        radius: RAD + 0.045,
        color,
        strokeWidth: 1.3
      });

      outline.setFill(color, 0);
      outline.moveTo(p);

      objects.push(outline);
    }

    return new M.VGroup(...objects);
  }

  function rowDots(r, missed, pretend = false) {
    const objects = [];

    for (let c = 0; c < 10; c++) {
      const state =
        missed === null
          ? null
          : missed.includes(c);

      objects.push(
        appointment(
          [gx(c), gy(r), 0],
          state,
          pretend
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function gridLabels(title, rows, color) {
    const objects = [];

    objects.push(
      txt(
        title,
        P ? 19 : 18,
        color,
        [GX, GY + 0.75, 0]
      )
    );

    if (
      rows[0] !== undefined ||
      rows[1] !== undefined
    ) {
      objects.push(
        txt(
          'WITH REMINDER',
          14,
          WITH,
          [GX, GY + 0.37, 0]
        )
      );
    }

    if (
      rows[2] !== undefined ||
      rows[3] !== undefined
    ) {
      objects.push(
        txt(
          'WITHOUT REMINDER',
          14,
          WITHOUT,
          [GX, gy(2) + 0.40, 0]
        )
      );
    }

    rows.forEach((row, r) => {
      if (row === undefined) return;

      if (r < 2) {
        objects.push(
          phoneIcon(gx(0) - 0.55, gy(r))
        );
      } else {
        const noPhone = phoneIcon(
          gx(0) - 0.55,
          gy(r),
          C.muted
        );

        const slash = ln(
          [gx(0) - 0.72, gy(r) - 0.24, 0],
          [gx(0) - 0.38, gy(r) + 0.24, 0],
          C.muted,
          1.8
        );

        objects.push(
          new M.VGroup(noPhone, slash)
        );
      }

      objects.push(
        txt(
          r % 2 === 0 ? 'AM' : 'PM',
          P ? 15 : 14,
          C.muted,
          [gx(9) + 0.40, gy(r), 0],
          true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function clearGrid() {
    return remove(
      'gridLabels',
      'row0',
      'row1',
      'row2',
      'row3',
      'groupA',
      'groupB',
      'gapPicture'
    );
  }

  function clearPlot() {
    return remove(
      'plot',
      'marker',
      'range',
      'extra',
      'hist',
      'observed',
      'tailNote'
    );
  }

  function drawGrid(
    rows,
    title,
    color = C.cyan,
    pretend = false,
    animate = false
  ) {
    const a = [
      ...clearPlot(),
      ...remove(
        'gridLabels',
        'row0',
        'row1',
        'row2',
        'row3',
        'groupA',
        'groupB',
        'gapPicture',
        'question'
      )
    ];

    const labels = gridLabels(
      title,
      rows,
      color
    );

    visible.gridLabels = labels;
    a.push(new M.FadeIn(labels));

    const ins = [];

    rows.forEach((row, r) => {
      if (row === undefined) return;

      const g = rowDots(r, row, pretend);

      visible['row' + r] = g;
      ins.push(new M.FadeIn(g));
    });

    if (animate && ins.length > 1) {
      a.push(
        new M.LaggedStart(
          ins,
          {
            lagRatio: 0.19,
            runTime: 1.7
          }
        )
      );
    } else {
      a.push(...ins);
    }

    return a;
  }

  function groupOutline(
    firstRow,
    lastRow,
    color
  ) {
    const top = gy(firstRow) + 0.25;
    const bottom = gy(lastRow) - 0.25;

    const r = new M.RoundedRectangle({
      width: 9 * SP + 0.65,
      height: top - bottom,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.025);
    r.moveTo([
      GX,
      (top + bottom) / 2,
      0
    ]);

    return r;
  }

  // ------------------------------------------------------------
  // Picture of the gap: subtract paired missed appointments.
  // Two missed dots cancel two of the eight missed dots.
  // Six unmatched dots remain.
  // ------------------------------------------------------------

  function gapPicture(result = false) {
    const objects = [];
    const spacing = P ? 0.47 : 0.48;
    const left = CX - spacing * 3.5;

    const top = P ? -0.2 : 0.35;
    const bottom = top - 1.20;

    objects.push(
      txt(
        'WITH REMINDER: 2 MISSES',
        16,
        WITH,
        [CX, top + 0.50, 0]
      ),
      txt(
        'WITHOUT REMINDER: 8 MISSES',
        16,
        WITHOUT,
        [CX, bottom + 0.50, 0]
      )
    );

    for (let i = 0; i < 2; i++) {
      const x = left + i * spacing;

      const d = dt(
        [x, top, 0],
        result ? C.muted : RED,
        0.15
      );

      d.setFill(
        result ? C.muted : RED,
        result ? 0.25 : 0.95
      );

      objects.push(d);
    }

    for (let i = 0; i < 8; i++) {
      const x = left + i * spacing;
      const cancelled = result && i < 2;

      const d = dt(
        [x, bottom, 0],
        cancelled ? C.muted : RED,
        0.15
      );

      d.setFill(
        cancelled ? C.muted : RED,
        cancelled ? 0.25 : 0.95
      );

      objects.push(d);

      if (i < 2) {
        objects.push(
          dash(
            [x, top - 0.20, 0],
            [x, bottom + 0.20, 0],
            C.muted
          )
        );
      }

      if (cancelled) {
        objects.push(
          ln(
            [x - 0.17, top - 0.17, 0],
            [x + 0.17, top + 0.17, 0],
            C.muted,
            2
          ),
          ln(
            [x - 0.17, bottom - 0.17, 0],
            [x + 0.17, bottom + 0.17, 0],
            C.muted,
            2
          )
        );
      }
    }

    if (result) {
      const x1 = left + 2 * spacing;
      const x2 = left + 7 * spacing;

      const r = new M.RoundedRectangle({
        width: x2 - x1 + 0.52,
        height: 0.60,
        cornerRadius: 0.12,
        color: POST,
        strokeWidth: 2.4
      });

      r.setFill(POST, 0.04);
      r.moveTo([
        (x1 + x2) / 2,
        bottom,
        0
      ]);

      objects.push(
        r,
        tag(
          '6 MORE MISSES',
          POST,
          [
            (x1 + x2) / 2,
            bottom - 0.62,
            0
          ]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Probability curves.
  //
  // Model A:
  // Flat prior = Beta(1,1).
  // Posterior = Beta(11,31).
  //
  // Model B:
  // Reminder posterior = Beta(3,19).
  // No-reminder posterior = Beta(9,13).
  //
  // The posterior curves are probability densities.
  // A common vertical scale is used, not individually
  // rescaled peaks.
  // ------------------------------------------------------------

  function logFactorial(n) {
    let result = 0;

    for (let i = 2; i <= n; i++) {
      result += Math.log(i);
    }

    return result;
  }

  function betaDensity(a, b) {
    const logNorm =
      logFactorial(a + b - 1) -
      logFactorial(a - 1) -
      logFactorial(b - 1);

    return p => {
      if (p <= 0) {
        return a === 1 ? Math.exp(logNorm) : 0;
      }

      if (p >= 1) {
        return b === 1 ? Math.exp(logNorm) : 0;
      }

      return Math.exp(
        logNorm +
        (a - 1) * Math.log(p) +
        (b - 1) * Math.log(1 - p)
      );
    };
  }

  const flatDensity = () => 1;

  const posteriorA = betaDensity(11, 31);
  const posteriorWith = betaDensity(3, 19);
  const posteriorWithout = betaDensity(9, 13);

  // Shared plot geometry.

  const AX0 = CX - (P ? 3.05 : 3.10);
  const AX1 = CX + (P ? 3.20 : 3.10);

  const AY0 = P ? -3.55 : -1.98;
  const AY1 = P ? 0.52 : 1.02;

  const PW = AX1 - AX0;
  const PH = AY1 - AY0;

  const DMAX = 8;

  const PX = p => AX0 + p * PW;
  const DY = d => AY0 + d / DMAX * PH;

  function probabilityAxes(title, showY = true) {
    const objects = [];

    objects.push(
      ln(
        [AX0, AY0, 0],
        [AX1, AY0, 0],
        C.muted,
        2
      )
    );

    if (showY) {
      objects.push(
        ln(
          [AX0, AY0, 0],
          [AX0, AY1, 0],
          C.muted,
          2
        )
      );

      objects.push(
        txt(
          'weight',
          P ? 16 : 14,
          C.muted,
          [AX0 + 0.43, AY1 + 0.10, 0]
        )
      );
    }

    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(p => {
      objects.push(
        ln(
          [PX(p), AY0 - 0.07, 0],
          [PX(p), AY0 + 0.07, 0],
          C.muted,
          1.3
        ),
        txt(
          String(p),
          15,
          C.muted,
          [PX(p), AY0 - 0.28, 0],
          true
        )
      );
    });

    objects.push(
      txt(
        'chance of a missed appointment',
        P ? 15 : 14,
        C.muted,
        [CX, AY0 - 0.65, 0]
      )
    );

    if (title) {
      objects.push(
        txt(
          title,
          P ? 18 : 17,
          C.ink,
          [CX + 0.20, AY1 + 0.48, 0]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function densityCurve(
    fn,
    color,
    width = 3.8
  ) {
    const objects = [];
    const n = 120;

    for (let i = 0; i < n; i++) {
      const p0 = i / n;
      const p1 = (i + 1) / n;

      objects.push(
        ln(
          [PX(p0), DY(fn(p0)), 0],
          [PX(p1), DY(fn(p1)), 0],
          color,
          width
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function curveLegend(items) {
    const objects = [];

    items.forEach(([name, color], i) => {
      const y = AY1 - 0.25 - i * 0.48;
      const x = AX1 - 1.85;

      objects.push(
        ln(
          [x - 0.22, y, 0],
          [x + 0.13, y, 0],
          color,
          3.5
        )
      );

      const label = T(name, P ? 16 : 14, color);

      label.moveTo([
        x + 0.25 + label.getWidth() / 2,
        y,
        0
      ]);

      objects.push(label);
    });

    return new M.VGroup(...objects);
  }

  function probabilityPlot(
    title,
    curves = [],
    legend = [],
    showY = true
  ) {
    return new M.VGroup(
      probabilityAxes(title, showY),
      ...curves.map(([fn, color, width]) =>
        densityCurve(fn, color, width || 3.8)
      ),
      curveLegend(legend)
    );
  }

  function plotA(includePrior = false) {
    const curves = [];
    const legend = [];

    if (includePrior) {
      curves.push(
        [flatDensity, PRIOR, 2.5]
      );

      legend.push(
        ['flat prior', PRIOR]
      );
    }

    curves.push(
      [posteriorA, POST, 4.3]
    );

    legend.push(
      ['updated curve', POST]
    );

    return probabilityPlot(
      'MODEL A: ONE CHANCE',
      curves,
      legend
    );
  }

  function plotB(includePrior = false) {
    const curves = [];
    const legend = [];

    if (includePrior) {
      curves.push(
        [flatDensity, PRIOR, 2]
      );

      legend.push(
        ['flat priors', PRIOR]
      );
    }

    curves.push(
      [posteriorWith, WITH, 4.1],
      [posteriorWithout, WITHOUT, 4.1]
    );

    legend.push(
      ['with reminder', WITH],
      ['no reminder', WITHOUT]
    );

    return probabilityPlot(
      'MODEL B: TWO CHANCES',
      curves,
      legend
    );
  }

  function drawProbability(obj) {
    return [
      ...clearGrid(),
      ...remove(
        'marker',
        'range',
        'extra',
        'hist',
        'observed',
        'tailNote',
        'question'
      ),
      ...put('plot', obj)
    ];
  }

  function chanceMarker(
    p,
    fn,
    color,
    label
  ) {
    const x = PX(p);
    const y = DY(fn(p));

    const halo = dt(
      [x, y, 0],
      color,
      0.21
    );

    halo.setFill(color, 0.17);

    return new M.VGroup(
      dash(
        [x, AY0, 0],
        [x, y, 0],
        color
      ),
      halo,
      dt([x, y, 0], color, 0.10),
      tag(
        label,
        color,
        [x, AY0 + 0.28, 0],
        15
      )
    );
  }

  // Fill an interval under a density curve.
  // The shaded region represents probability mass,
  // not the height of an individual point.

  function densityArea(
    fn,
    lo,
    hi,
    color,
    opacity = 0.22
  ) {
    const objects = [];
    const slices = 35;

    for (let i = 0; i < slices; i++) {
      const p0 = lo + (hi - lo) * i / slices;
      const p1 = lo + (hi - lo) * (i + 1) / slices;
      const p = (p0 + p1) / 2;

      const h = fn(p) / DMAX * PH;

      if (h < 0.001) continue;

      const r = rect(
        PX(p1) - PX(p0) + 0.002,
        h,
        [PX(p), AY0 + h / 2, 0],
        color,
        opacity
      );

      objects.push(r);
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Replay tally lines.
  //
  // Total missed: 0 to 40.
  // Gap: no-reminder misses minus reminder misses.
  // Gap therefore runs from -20 to +20.
  // ------------------------------------------------------------

  const TX0 = AX0;
  const TX1 = AX1;

  const TALLY_Y = P ? -1.85 : -0.65;

  const sampleTotals = [];
  const sampleGaps = [];

  function tallyX(v, kind) {
    const lo = kind === 'total' ? 0 : -10;
    return TX0 + (v - lo) / 20 * (TX1 - TX0);
  }

  function tallyPlot(kind, values) {
    const objects = [];

    const lo = kind === 'total' ? 0 : -10;
    const hi = kind === 'total' ? 20 : 10;

    const title =
      kind === 'total'
        ? 'TOTAL MISSED'
        : 'GAP BETWEEN GROUPS';

    objects.push(
      txt(
        title,
        20,
        kind === 'total' ? MODEL_A : C.cyan,
        [CX, TALLY_Y + 1.75, 0]
      ),
      ln(
        [TX0, TALLY_Y, 0],
        [TX1, TALLY_Y, 0],
        C.muted,
        2.5
      )
    );

    for (let v = lo; v <= hi; v += 2) {
      const x = tallyX(v, kind);

      objects.push(
        ln(
          [x, TALLY_Y - 0.07, 0],
          [x, TALLY_Y + 0.07, 0],
          C.muted,
          1.2
        ),
        txt(
          String(v).replace('-', '−'),
          P ? 16 : 16,
          C.muted,
          [x, TALLY_Y - 0.32, 0],
          true
        )
      );
    }

    const counts = Object.create(null);

    values.forEach((v, i) => {
      const k = counts[v] || 0;
      counts[v] = k + 1;

      const p = [
        tallyX(v, kind),
        TALLY_Y + 0.22 + k * 0.38,
        0
      ];

      const color =
        i === values.length - 1
          ? POST
          : MODEL_A;

      const halo = dt(p, color, 0.20);
      halo.setFill(color, 0.13);

      objects.push(
        halo,
        dt(p, color, 0.11)
      );
    });

    if (values.length) {
      const last = values[values.length - 1];
      const n = counts[last];

      objects.push(
        tag(
          String(last),
          POST,
          [
            tallyX(last, kind),
            TALLY_Y + 0.22 + (n - 1) * 0.38 + 0.48,
            0
          ]
        )
      );
    }

    if (kind === 'gap') {
      objects.push(
        txt(
          'without reminder − with reminder',
          P ? 16 : 15,
          C.muted,
          [CX, TALLY_Y - 0.75, 0]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function drawTally(kind) {
    const values =
      kind === 'total'
        ? sampleTotals
        : sampleGaps;

    return [
      ...clearGrid(),
      ...remove(
        'marker',
        'range',
        'extra',
        'hist',
        'observed',
        'tailNote'
      ),
      ...put(
        'plot',
        tallyPlot(kind, values)
      )
    ];
  }

  // ------------------------------------------------------------
  // Deterministic simulation.
  //
  // Each replay samples a new chance from its posterior.
  // Each appointment then receives its own Bernoulli draw.
  //
  // Model A:
  // one shared p ~ Beta(11,31)
  // with    ~ Binomial(20,p)
  // without ~ Binomial(20,p)
  //
  // Model B:
  // pWith    ~ Beta(3,19)
  // pWithout ~ Beta(9,13)
  // separate posterior draws for the two groups.
  //
  // No histogram frequencies are hard-coded.
  // ------------------------------------------------------------

  function seededRandom(seed) {
    let a = seed >>> 0;

    return function () {
      a = (a + 0x6D2B79F5) >>> 0;

      let t = a;

      t = Math.imul(
        t ^ (t >>> 15),
        t | 1
      );

      t ^= t + Math.imul(
        t ^ (t >>> 7),
        t | 61
      );

      return (
        ((t ^ (t >>> 14)) >>> 0) /
        4294967296
      );
    };
  }

  function normal(random) {
    const u = Math.max(
      1e-12,
      random()
    );

    const v = random();

    return (
      Math.sqrt(-2 * Math.log(u)) *
      Math.cos(2 * Math.PI * v)
    );
  }

  // Marsaglia-Tsang gamma sampler.
  // All beta shapes in this lesson are greater than one.

  function gamma(shape, random) {
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      const x = normal(random);
      const q = 1 + c * x;

      if (q <= 0) continue;

      const v = q * q * q;
      const u = Math.max(
        1e-12,
        random()
      );

      if (
        u < 1 - 0.0331 * x * x * x * x
      ) {
        return d * v;
      }

      if (
        Math.log(u) <
        0.5 * x * x +
        d * (1 - v + Math.log(v))
      ) {
        return d * v;
      }
    }
  }

  function beta(a, b, random) {
    const x = gamma(a, random);
    const y = gamma(b, random);

    return x / (x + y);
  }

  function binomial(n, p, random) {
    let k = 0;

    for (let i = 0; i < n; i++) {
      if (random() < p) k++;
    }

    return k;
  }

  function makeSimulation(model, seed) {
    const random = seededRandom(seed);

    return {
      model,
      random,
      n: 0,
      tail: 0,
      totals: new Array(41).fill(0),
      gaps: new Array(41).fill(0)
    };
  }

  const simA = makeSimulation(
    'A',
    1040601
  );

  const simB = makeSimulation(
    'B',
    1040602
  );

  function simulateTo(sim, target) {
    while (sim.n < target) {
      let pWith;
      let pWithout;

      if (sim.model === 'A') {
        const p = beta(
          11,
          31,
          sim.random
        );

        pWith = p;
        pWithout = p;
      } else {
        pWith = beta(
          3,
          19,
          sim.random
        );

        pWithout = beta(
          9,
          13,
          sim.random
        );
      }

      const withMissed = binomial(
        20,
        pWith,
        sim.random
      );

      const withoutMissed = binomial(
        20,
        pWithout,
        sim.random
      );

      const total =
        withMissed + withoutMissed;

      const gap =
        withoutMissed - withMissed;

      sim.totals[total]++;
      sim.gaps[gap + 20]++;

      if (gap >= OBS_GAP) {
        sim.tail++;
      }

      sim.n++;
    }
  }

  function tailPercent(sim) {
    if (!sim.n) return '0.0%';

    return (
      100 * sim.tail / sim.n
    ).toFixed(1) + '%';
  }

  function fmt(n) {
    return n.toLocaleString('en-US');
  }

  // ------------------------------------------------------------
  // Histograms.
  //
  // Fixed frequency scale across simulation stages.
  // This lets the piles visibly grow as replays accumulate.
  //
  // Gap bars at six or higher may be highlighted.
  // The observed clinic result is an independent marker,
  // not another simulated observation.
  // ------------------------------------------------------------

  const HX0 = AX0;
  const HX1 = AX1;

  const HY0 = AY0;
  const HY1 = AY1 - 0.10;

  const HMAX = 35000;

  const HBW = (HX1 - HX0) / 41;

  const hindex = i =>
    HX0 + (i + 0.5) * HBW;

  const hvalue = (v, kind) =>
    hindex(
      kind === 'total'
        ? v
        : v + 20
    );

  const hy = n =>
    HY0 +
    n / HMAX * (HY1 - HY0);

  function histAxes(kind, model) {
    const objects = [];

    const lo = kind === 'total' ? 0 : -20;
    const hi = kind === 'total' ? 40 : 20;

    objects.push(
      ln(
        [HX0, HY0, 0],
        [HX1, HY0, 0],
        C.muted,
        2
      ),
      ln(
        [HX0, HY0, 0],
        [HX0, HY1, 0],
        C.muted,
        1.5
      )
    );

    [10000, 20000, 30000].forEach(n => {
      const y = hy(n);

      objects.push(
        ln(
          [HX0, y, 0],
          [HX1, y, 0],
          C.muted,
          0.5
        ),
        txt(
          `${n / 1000}k`,
          P ? 15 : 12,
          C.muted,
          [HX0 - 0.26, y, 0],
          true
        )
      );
    });

    for (let v = lo; v <= hi; v += 5) {
      const x = hvalue(v, kind);

      objects.push(
        ln(
          [x, HY0 - 0.06, 0],
          [x, HY0 + 0.06, 0],
          C.muted,
          1
        ),
        txt(
          String(v).replace('-', '−'),
          P ? 15 : 13,
          C.muted,
          [x, HY0 - 0.27, 0],
          true
        )
      );
    }

    const label =
      kind === 'total'
        ? 'total missed'
        : 'misses without − misses with';

    objects.push(
      txt(
        label,
        P ? 15 : 14,
        C.muted,
        [CX, HY0 - 0.65, 0]
      ),
      txt(
        'replays',
        P ? 15 : 13,
        C.muted,
        [HX0 + 0.42, HY1 + 0.10, 0]
      ),
      txt(
        `MODEL ${model}: ${
          kind === 'total' ? 'TOTALS' : 'GAPS'
        }`,
        P ? 19 : 18,
        model === 'A' ? MODEL_A : MODEL_B,
        [CX + 0.15, AY1 + 0.44, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function histogram(
    sim,
    kind,
    highlight = 'none'
  ) {
    const objects = [
      histAxes(kind, sim.model)
    ];

    const counts =
      kind === 'total'
        ? sim.totals
        : sim.gaps;

    const baseColor =
      sim.model === 'A'
        ? MODEL_A
        : MODEL_B;

    counts.forEach((n, i) => {
      if (n === 0) return;

      const v =
        kind === 'total'
          ? i
          : i - 20;

      let color = baseColor;
      let opacity = 0.78;

      if (highlight === 'tail') {
        const inTail = v >= OBS_GAP;

        color = inTail
          ? sim.model === 'A'
            ? RED
            : POST
          : baseColor;

        opacity = inTail ? 0.95 : 0.45;
      }

      if (highlight === 'negative') {
        color = v < 0
          ? WITHOUT
          : baseColor;

        opacity = v < 0 ? 0.92 : 0.38;
      }

      const h = hy(n) - HY0;

      objects.push(
        rect(
          HBW * 0.84,
          Math.max(h, 0.003),
          [
            hindex(i),
            HY0 + h / 2,
            0
          ],
          color,
          opacity
        )
      );
    });

    if (kind === 'gap' && highlight === 'tail') {
      const x =
        hvalue(OBS_GAP, 'gap') - HBW / 2;

      const regionWidth = HX1 - x;

      const region = new M.Rectangle({
        width: regionWidth,
        height: HY1 - HY0,
        color: sim.model === 'A' ? RED : POST,
        strokeWidth: 1
      });

      region.setFill(
        sim.model === 'A' ? RED : POST,
        0.035
      );

      region.moveTo([
        x + regionWidth / 2,
        (HY0 + HY1) / 2,
        0
      ]);

      objects.unshift(region);
    }

    return new M.VGroup(...objects);
  }

  function observedMarker(kind, color = WHITE) {
    const v =
      kind === 'total'
        ? OBS_TOTAL
        : OBS_GAP;

    const x = hvalue(v, kind);

    const guide = dash(
      [x, HY0, 0],
      [x, HY1 - 0.30, 0],
      color
    );

    const triangle = new M.VGroup(
      ln(
        [x, HY0 + 0.035, 0],
        [x - 0.10, HY0 + 0.20, 0],
        color,
        2.3
      ),
      ln(
        [x, HY0 + 0.035, 0],
        [x + 0.10, HY0 + 0.20, 0],
        color,
        2.3
      )
    );

    const label = tag(
      `REAL: ${v}`,
      color,
      [x, HY1 - 0.05, 0],
      15
    );

    return new M.VGroup(
      guide,
      triangle,
      label
    );
  }

  function drawHist(
    sim,
    kind,
    highlight = 'none',
    showObserved = false
  ) {
    const a = [
      ...clearGrid(),
      ...remove(
        'plot',
        'marker',
        'range',
        'extra',
        'observed',
        'tailNote'
      ),
      ...put(
        'hist',
        histogram(
          sim,
          kind,
          highlight
        )
      )
    ];

    if (showObserved) {
      a.push(
        ...put(
          'observed',
          observedMarker(kind)
        )
      );
    }

    return a;
  }

  function tailLabel(sim) {
    const color =
      sim.model === 'A'
        ? RED
        : POST;

    const t = tag(
      `${tailPercent(sim)} AT 6 OR MORE`,
      color,
      [0, 0, 0],
      15
    );

    const w = t.getWidth();
    const x = sim.model === 'A'
      ? Math.min(hvalue(13, 'gap'), HX1 - w / 2 - 0.05)
      : Math.max(hvalue(-12, 'gap'), HX0 + w / 2 + 0.05);

    t.moveTo([x, HY1 - 0.30, 0]);
    return t;
  }

  // ============================================================
  // 0–7: establish the observed pattern.
  // ============================================================

  // 0. Can the model match the two reminder groups?

  await until(S(0));
  await play(
    ...put(
      'question',
      new M.VGroup(
        tag(
          'CAN THE MODEL',
          MODEL_A,
          [CX, 0.40, 0],
          25
        ),
        tag(
          'MATCH THE PATTERN?',
          MODEL_A,
          [CX, -0.35, 0],
          25
        )
      )
    ),
    ...say('CHECK MORE THAN THE TOTAL', MODEL_A)
  );

  // 1. Twenty appointments with a reminder.

  await until(S(1));
  await play(
    ...drawGrid(
      [null, null, undefined, undefined],
      'CLINIC RECORD'
    ),
    ...put(
      'groupA',
      groupOutline(0, 1, WITH)
    ),
    ...say('20 WITH A TEXT REMINDER', WITH),
    ...fbox([
      ['WITH REMINDER', WITH],
      '20 appointments'
    ], WITH)
  );

  // 2. Two misses in the reminder group.

  await until(S(2));
  await play(
    ...drawGrid(
      [
        REAL[0],
        REAL[1],
        undefined,
        undefined
      ],
      'CLINIC RECORD'
    ),
    ...put(
      'groupA',
      groupOutline(0, 1, WITH)
    ),
    ...say('2 MISSED WITH REMINDERS', RED),
    ...fbox([
      ['with reminder', WITH],
      ['missed = 2', RED],
      ['kept   = 18', WHITE]
    ], WITH)
  );

  // 3. Twenty appointments without a reminder.

  await until(S(3));
  await play(
    ...drawGrid(
      [
        REAL[0],
        REAL[1],
        null,
        null
      ],
      'CLINIC RECORD'
    ),
    ...put(
      'groupB',
      groupOutline(2, 3, WITHOUT)
    ),
    ...say('20 WITHOUT A REMINDER', WITHOUT),
    ...fbox([
      ['WITHOUT REMINDER', WITHOUT],
      '20 appointments'
    ], WITHOUT)
  );

  // 4. Eight misses in the no-reminder group.

  await until(S(4));
  await play(
    ...drawGrid(
      REAL,
      'CLINIC RECORD'
    ),
    ...put(
      'groupB',
      groupOutline(2, 3, WITHOUT)
    ),
    ...say('8 MISSED WITHOUT REMINDERS', RED),
    ...fbox([
      ['without reminder', WITHOUT],
      ['missed = 8', RED],
      ['kept   = 12', WHITE]
    ], WITHOUT)
  );

  // 5. Total missed = 10.

  await until(S(5));
  await play(
    ...remove('groupB'),
    ...say('10 MISSES ALTOGETHER', RED),
    ...fbox([
      ['with reminder    2', WITH],
      ['without reminder 8', WITHOUT],
      ['total = 2 + 8 = 10', RED]
    ], RED)
  );

  // 6. Subtract the two missed counts.

  await until(S(6));
  await play(
    ...clearGrid(),
    ...put(
      'gapPicture',
      gapPicture(false)
    ),
    ...say('SUBTRACT THE TWO MISS COUNTS'),
    ...fbox([
      ['without reminder: 8', WITHOUT],
      ['with reminder:    2', WITH],
      'gap = 8 − 2'
    ])
  );

  // 7. Observed gap = 6.

  await until(S(7));
  await play(
    ...put(
      'gapPicture',
      gapPicture(true)
    ),
    ...say('OBSERVED GAP = 6', POST),
    ...fbox([
      ['total missed = 10', RED],
      'gap = 8 − 2',
      ['gap = 6', POST]
    ], POST)
  );

  // ============================================================
  // 8–16: Model A and its posterior.
  // ============================================================

  // 8. Model A gives both groups one chance.

  await until(S(8));
  await play(
    ...drawGrid(
      REAL,
      'MODEL A',
      MODEL_A
    ),
    ...put(
      'groupA',
      groupOutline(0, 1, MODEL_A)
    ),
    ...put(
      'groupB',
      groupOutline(2, 3, MODEL_A)
    ),
    ...say('MODEL A: ONE SHARED CHANCE', MODEL_A),
    ...fbox([
      ['MODEL A', MODEL_A],
      'one miss chance',
      'for both groups'
    ], MODEL_A)
  );

  // 9. A new, empty replicated record.

  await until(S(9));
  await play(
    ...drawGrid(
      EMPTY,
      'NEW PRETEND RECORD',
      MODEL_A,
      true
    ),
    ...say('40 NEW EMPTY APPOINTMENTS', MODEL_A),
    ...fbox([
      ['20 with reminder', WITH],
      ['20 without reminder', WITHOUT],
      'same groups as before',
      'new outcomes'
    ], MODEL_A)
  );

  // 10. Draw a possible chance before filling the dots.

  await until(S(10));
  await play(
    ...say('FIRST DRAW ONE POSSIBLE CHANCE', POST),
    ...fbox([
      ['STEP 1', POST],
      'draw one miss chance',
      ['STEP 2', MODEL_A],
      'fill all 40 dots'
    ])
  );

  // 11. Line of chances from zero to one.

  await until(S(11));
  await play(
    ...drawProbability(
      probabilityPlot(
        'POSSIBLE MISS CHANCES',
        [],
        [],
        false
      )
    ),
    ...clearBox(),
    ...say('POSSIBLE CHANCES: 0 TO 1')
  );

  // 12. Equal starting weight for equal-length intervals.

  await until(S(12));
  await play(
    ...drawProbability(
      probabilityPlot(
        'BEFORE SEEING THE RECORD',
        [
          [flatDensity, PRIOR, 4]
        ],
        [
          ['starting weight', PRIOR]
        ]
      )
    ),
    ...put(
      'range',
      new M.VGroup(
        densityArea(
          flatDensity,
          0.10,
          0.30,
          PRIOR,
          0.30
        ),
        densityArea(
          flatDensity,
          0.65,
          0.85,
          C.cyan,
          0.30
        )
      )
    ),
    ...say('EQUAL LENGTHS, EQUAL WEIGHT', PRIOR),
    ...fbox([
      'before the record',
      '0.10 to 0.30',
      '0.65 to 0.85',
      ['same starting weight', PRIOR]
    ], PRIOR)
  );

  // 13. Flat prior.

  await until(S(13));
  await play(
    ...remove('range'),
    ...drawProbability(
      probabilityPlot(
        'FLAT PRIOR',
        [
          [flatDensity, PRIOR, 4]
        ],
        [
          ['flat prior', PRIOR]
        ]
      )
    ),
    ...say('FLAT PRIOR = LEVEL STARTING WEIGHT', PRIOR),
    ...fbox([
      ['FLAT PRIOR', PRIOR],
      'no stretch has more',
      'weight than another',
      'of the same length'
    ], PRIOR)
  );

  // 14. Updated posterior.

  await until(S(14));
  await play(
    ...drawProbability(
      plotA(true)
    ),
    ...say('POSTERIOR = UPDATED CURVE', POST),
    ...fbox([
      ['flat prior', PRIOR],
      ['+ information from', MODEL_A],
      ['  the 40 real dots', MODEL_A],
      ['→ posterior', POST]
    ], POST)
  );

  // 15. The posterior peaks at 0.25.

  await until(S(15));
  await play(
    ...drawProbability(
      plotA(false)
    ),
    ...put(
      'marker',
      chanceMarker(
        0.25,
        posteriorA,
        POST,
        '0.25'
      )
    ),
    ...say('POSTERIOR PEAK: ONE IN FOUR', POST),
    ...fbox([
      ['real record', MODEL_A],
      '10 missed of 40',
      ['peak = 0.25', POST],
      'other chances remain'
    ], POST)
  );

  // 16. A range with more mass is more likely
  // to contain the random draw.

  await until(S(16));
  await play(
    ...remove('marker'),
    ...put(
      'range',
      new M.VGroup(
        densityArea(
          posteriorA,
          0.15,
          0.35,
          POST,
          0.26
        ),
        densityArea(
          posteriorA,
          0.55,
          0.75,
          C.muted,
          0.35
        )
      )
    ),
    ...say('MORE WEIGHT = MORE LIKELY TO BE DRAWN', POST),
    ...fbox([
      'same interval width',
      ['near the peak:', POST],
      ['more probability', POST],
      ['far from the peak:', C.muted],
      'less probability'
    ], POST)
  );

  // ============================================================
  // 17–21: first illustrative replay.
  //
  // Draw p = 0.25.
  // 5 misses with reminders.
  // 5 misses without reminders.
  // Total = 10. Gap = 0.
  // ============================================================

  // 17. Imagine drawing one in four.

  await until(S(17));
  await play(
    ...remove('range'),
    ...put(
      'marker',
      chanceMarker(
        0.25,
        posteriorA,
        MODEL_A,
        'DRAW: 0.25'
      )
    ),
    ...say('REPLAY 1: DRAW 0.25', MODEL_A),
    ...fbox([
      ['REPLAY 1', MODEL_A],
      ['drawn chance = 0.25', POST],
      'one chance for',
      'all 40 appointments'
    ], MODEL_A)
  );

  // 18. Fresh random decisions for all appointments.

  await until(S(18));
  await play(
    ...drawGrid(
      EMPTY,
      'REPLAY 1',
      MODEL_A,
      true
    ),
    ...say('FRESH RANDOM DECISION AT EACH DOT', MODEL_A),
    ...fbox([
      ['chance missed = 0.25', RED],
      ['chance kept   = 0.75', WHITE],
      'draw each outcome',
      'separately'
    ], MODEL_A)
  );

  await until(S(18) + 1.25);

  await play(
    ...drawGrid(
      REPLAY_1,
      'REPLAY 1',
      MODEL_A,
      true,
      true
    )
  );

  // 19. Five misses in each group.

  await until(S(19));
  await play(
    ...put(
      'groupA',
      groupOutline(0, 1, WITH)
    ),
    ...put(
      'groupB',
      groupOutline(2, 3, WITHOUT)
    ),
    ...say('5 MISSES WITH, 5 WITHOUT'),
    ...fbox([
      ['with reminder    5', WITH],
      ['without reminder 5', WITHOUT],
      ['total = 10', MODEL_A],
      ['gap = 0', POST]
    ])
  );

  // 20. Record total = 10.

  await until(S(20));
  sampleTotals.push(10);

  await play(
    ...drawTally('total'),
    ...say('MARK THE TOTAL AT 10', MODEL_A),
    ...fbox([
      'total missed',
      '5 + 5',
      ['= 10', MODEL_A]
    ], MODEL_A)
  );

  // 21. Record gap = 0.

  await until(S(21));
  sampleGaps.push(0);

  await play(
    ...drawTally('gap'),
    ...say('MARK THE GAP AT 0', POST),
    ...fbox([
      'gap',
      '5 − 5',
      ['= 0', POST]
    ], POST)
  );

  // ============================================================
  // 22–25: second illustrative replay.
  //
  // Draw p = 0.20.
  // 2 misses with reminders.
  // 8 misses without reminders.
  // Total = 10. Gap = 6.
  // ============================================================

  // 22. Draw one in five.

  await until(S(22));
  await play(
    ...drawProbability(
      plotA(false)
    ),
    ...put(
      'marker',
      chanceMarker(
        0.20,
        posteriorA,
        MODEL_A,
        'DRAW: 0.20'
      )
    ),
    ...say('REPLAY 2: DRAW 0.20', MODEL_A),
    ...fbox([
      ['REPLAY 2', MODEL_A],
      ['drawn chance = 0.20', POST],
      'new chance',
      'new random outcomes'
    ], MODEL_A)
  );

  // 23. Two misses with reminders and eight without.

  await until(S(23));
  await play(
    ...drawGrid(
      REPLAY_2,
      'REPLAY 2',
      MODEL_A,
      true,
      true
    ),
    ...say('2 MISSES WITH, 8 WITHOUT'),
    ...fbox([
      ['with reminder    2', WITH],
      ['without reminder 8', WITHOUT],
      ['total = 10', MODEL_A],
      ['gap = 6', POST]
    ])
  );

  // 24. Another total of 10.

  await until(S(24));
  sampleTotals.push(10);

  await play(
    ...drawTally('total'),
    ...say('ANOTHER MARK AT 10', MODEL_A),
    ...fbox([
      'total missed',
      '2 + 8',
      ['= 10', MODEL_A]
    ], MODEL_A)
  );

  // 25. A gap of six.

  await until(S(25));
  sampleGaps.push(6);

  await play(
    ...drawTally('gap'),
    ...say('MARK THE GAP AT 6', POST),
    ...fbox([
      'gap',
      '8 − 2',
      ['= 6', POST]
    ], POST)
  );

  // ============================================================
  // 26–29: third illustrative replay.
  //
  // Draw p = 0.30.
  // 3 misses with reminders.
  // 5 misses without reminders.
  // Total = 8. Gap = 2.
  // ============================================================

  // 26. Draw three in ten.

  await until(S(26));
  await play(
    ...drawProbability(
      plotA(false)
    ),
    ...put(
      'marker',
      chanceMarker(
        0.30,
        posteriorA,
        MODEL_A,
        'DRAW: 0.30'
      )
    ),
    ...say('REPLAY 3: DRAW 0.30', MODEL_A),
    ...fbox([
      ['REPLAY 3', MODEL_A],
      ['drawn chance = 0.30', POST],
      'another possible',
      'shared miss chance'
    ], MODEL_A)
  );

  // 27. Three misses with reminders and five without.

  await until(S(27));
  await play(
    ...drawGrid(
      REPLAY_3,
      'REPLAY 3',
      MODEL_A,
      true,
      true
    ),
    ...say('3 MISSES WITH, 5 WITHOUT'),
    ...fbox([
      ['with reminder    3', WITH],
      ['without reminder 5', WITHOUT],
      ['total = 8', MODEL_A],
      ['gap = 2', POST]
    ])
  );

  // 28. Total of eight.

  await until(S(28));
  sampleTotals.push(8);

  await play(
    ...drawTally('total'),
    ...say('MARK THE TOTAL AT 8', MODEL_A),
    ...fbox([
      'total missed',
      '3 + 5',
      ['= 8', MODEL_A]
    ], MODEL_A)
  );

  // 29. Gap of two.

  await until(S(29));
  sampleGaps.push(2);

  await play(
    ...drawTally('gap'),
    ...say('MARK THE GAP AT 2', POST),
    ...fbox([
      'gap',
      '5 − 3',
      ['= 2', POST]
    ], POST)
  );

  // ============================================================
  // 30–33: thousands of replicated records.
  // ============================================================

  // 30. Name the replicated record.

  await until(S(30));
  await play(
    ...say('EACH REPLAY = ONE REPLICATED RECORD'),
    ...fbox([
      ['REPLAY   TOTAL   GAP', C.ink],
      ['  1       10     0', MODEL_A],
      ['  2       10     6', MODEL_A],
      ['  3        8     2', MODEL_A],
      'same rule, fresh records'
    ])
  );

  // 31. Let the computer perform 200,000 simulations.
  // Begin with the first 20,000 to make the growth visible.

  await until(S(31));

  simulateTo(
    simA,
    20000
  );

  await play(
    ...drawHist(
      simA,
      'gap',
      'tail'
    ),
    ...say('NOW REPLAY 200,000 TIMES', MODEL_A),
    ...fbox([
      ['MODEL A SIMULATION', MODEL_A],
      [fmt(simA.n) + ' replays done', MODEL_A],
      'target: 200,000',
      ['gap ≥ 6: ' + tailPercent(simA), RED]
    ], MODEL_A)
  );

  // 32. Grow the histogram to 100,000 replays.
  // Frequency scale stays fixed.

  await until(S(32));

  simulateTo(
    simA,
    100000
  );

  await play(
    ...drawHist(
      simA,
      'gap',
      'tail'
    ),
    ...say('MORE REPLAYS, BIGGER PILES', MODEL_A),
    ...fbox([
      ['MODEL A SIMULATION', MODEL_A],
      [fmt(simA.n) + ' replays done', MODEL_A],
      'target: 200,000',
      ['gap ≥ 6: ' + tailPercent(simA), RED]
    ], MODEL_A)
  );

  await until(S(32) + 1.60);

  simulateTo(
    simA,
    150000
  );

  await play(
    ...drawHist(
      simA,
      'gap',
      'tail'
    ),
    ...fbox([
      ['MODEL A SIMULATION', MODEL_A],
      [fmt(simA.n) + ' replays done', MODEL_A],
      'target: 200,000',
      ['gap ≥ 6: ' + tailPercent(simA), RED]
    ], MODEL_A)
  );

  // 33. Finish the simulation and show the settled tail share.

  await until(S(33));

  simulateTo(
    simA,
    200000
  );

  await play(
    ...drawHist(
      simA,
      'gap',
      'tail'
    ),
    ...put(
      'tailNote',
      tailLabel(simA)
    ),
    ...say('THE SHARE REACHING SIX SETTLES', RED),
    ...fbox([
      ['200,000 replays done', MODEL_A],
      ['gap ≥ 6:', RED],
      fmt(simA.tail) + ' replays',
      [tailPercent(simA), RED]
    ], RED)
  );

  // ============================================================
  // 34–36: first check — the total number missed.
  // Model A reproduces the total reasonably well.
  // ============================================================

  // 34. Model A totals gather around 10 or 11.

  await until(S(34));
  await play(
    ...drawHist(
      simA,
      'total'
    ),
    ...say('MODEL A TOTALS: AROUND 10 OR 11', MODEL_A),
    ...fbox([
      ['CHECK 1: TOTAL', MODEL_A],
      '200,000 pretend records',
      'most totals gather',
      ['around 10 or 11', MODEL_A]
    ], MODEL_A)
  );

  // 35. Observed total of ten is near the middle.

  await until(S(35));
  await play(
    ...put(
      'observed',
      observedMarker('total')
    ),
    ...say('REAL TOTAL = 10: QUITE TYPICAL', POST),
    ...fbox([
      ['real total = 10', WHITE],
      'near the middle',
      ['TOTAL CHECK: TYPICAL', POST]
    ], POST)
  );

  // 36. Model A learned its chance from the same total.

  await until(S(36));
  await play(
    ...say('EXPECTED: MODEL A LEARNED THE TOTAL', MODEL_A),
    ...fbox([
      ['Model A learned from', MODEL_A],
      '10 misses of 40',
      'so a total near 10',
      'is not surprising'
    ], MODEL_A),
    new M.Indicate(
      visible.observed,
      { color: POST }
    )
  );

  // ============================================================
  // 37–39: second check — the reminder-group gap.
  // Model A does not reproduce the observed gap well.
  // ============================================================

  // 37. Model A gaps gather around zero.

  await until(S(37));
  await play(
    ...drawHist(
      simA,
      'gap'
    ),
    ...say('MODEL A GAPS GATHER AROUND ZERO', MODEL_A),
    ...fbox([
      ['CHECK 2: GAP', MODEL_A],
      'one shared chance',
      'for both groups',
      ['typical gap ≈ 0', MODEL_A]
    ], MODEL_A)
  );

  // 38. Negative gaps mean more misses with reminders.

  await until(S(38));
  await play(
    ...drawHist(
      simA,
      'gap',
      'negative'
    ),
    ...say('NEGATIVE GAP: MORE MISSES WITH REMINDERS', WITHOUT),
    ...fbox([
      'gap = without − with',
      ['example:', C.muted],
      ['without = 3', WITHOUT],
      ['with    = 5', WITH],
      ['gap = 3 − 5 = −2', WITHOUT]
    ], WITHOUT)
  );

  // 39. Only about two in one hundred reach six or more.

  await until(S(39));
  await play(
    ...drawHist(
      simA,
      'gap',
      'tail',
      true
    ),
    ...put(
      'tailNote',
      tailLabel(simA)
    ),
    ...say('A GAP OF SIX IS RARE UNDER MODEL A', RED),
    ...fbox([
      ['real gap = 6', WHITE],
      ['gap ≥ 6: ' + tailPercent(simA), RED],
      'about 2 in 100',
      ['GAP CHECK: UNUSUAL', RED]
    ], RED)
  );

  // ============================================================
  // 40–42: Model B has separate chances.
  // ============================================================

  // 40. Give each reminder group its own chance.

  await until(S(40));
  await play(
    ...drawGrid(
      REAL,
      'MODEL B',
      MODEL_B
    ),
    ...put(
      'groupA',
      groupOutline(0, 1, WITH)
    ),
    ...put(
      'groupB',
      groupOutline(2, 3, WITHOUT)
    ),
    ...say('MODEL B: ONE CHANCE PER GROUP', MODEL_B),
    ...fbox([
      ['MODEL B', MODEL_B],
      ['with: 2 misses / 20', WITH],
      ['without: 8 / 20', WITHOUT],
      'two separate chances'
    ], MODEL_B)
  );

  // 41. Flat priors updated by each group's own record.

  await until(S(41));
  await play(
    ...drawProbability(
      probabilityPlot(
        'TWO FLAT STARTING PRIORS',
        [
          [flatDensity, PRIOR, 4]
        ],
        [
          ['both flat priors', PRIOR]
        ]
      )
    ),
    ...say('UPDATE EACH GROUP SEPARATELY', MODEL_B),
    ...fbox([
      ['flat prior for each', PRIOR],
      ['with: 2 missed of 20', WITH],
      ['without: 8 of 20', WITHOUT]
    ], MODEL_B)
  );

  await until(S(41) + 1.55);

  await play(
    ...drawProbability(
      plotB(true)
    ),
    ...fbox([
      ['with reminder', WITH],
      ['peak = 0.10', WITH],
      ['without reminder', WITHOUT],
      ['peak = 0.40', WITHOUT]
    ], MODEL_B)
  );

  // 42. Draw a chance from each updated curve.
  // The two displayed draws are illustrative.

  await until(S(42));
  await play(
    ...drawProbability(
      plotB(false)
    ),
    ...put(
      'marker',
      new M.VGroup(
        chanceMarker(
          0.12,
          posteriorWith,
          WITH,
          '0.12'
        ),
        chanceMarker(
          0.42,
          posteriorWithout,
          WITHOUT,
          '0.42'
        )
      )
    ),
    ...say('DRAW TWO CHANCES, NOT ONE', MODEL_B),
    ...fbox([
      ['example draw:', C.muted],
      ['with    = 0.12', WITH],
      ['without = 0.42', WITHOUT],
      'replay each group',
      'using its own chance'
    ], MODEL_B)
  );

  await until(S(42) + 2.0);

  await play(
    ...drawGrid(
      REPLAY_2,
      'ONE MODEL B REPLAY',
      MODEL_B,
      true,
      true
    ),
    ...put(
      'groupA',
      groupOutline(0, 1, WITH)
    ),
    ...put(
      'groupB',
      groupOutline(2, 3, WITHOUT)
    ),
    ...fbox([
      ['with: chance 0.12', WITH],
      ['without: chance 0.42', WITHOUT],
      'fresh outcomes',
      'in both groups'
    ], MODEL_B)
  );

  // ============================================================
  // 43–45: Model B reproduces the reminder gap.
  // ============================================================

  // 43. Simulate 200,000 new records under Model B.

  await until(S(43));

  simulateTo(
    simB,
    200000
  );

  await play(
    ...drawHist(
      simB,
      'gap'
    ),
    ...say('MODEL B GAPS: AROUND FIVE OR SIX', MODEL_B),
    ...fbox([
      ['MODEL B', MODEL_B],
      '200,000 fresh replays',
      'gaps gather around',
      ['5 or 6', MODEL_B]
    ], MODEL_B)
  );

  // 44. About half reach six or more.

  await until(S(44));
  await play(
    ...drawHist(
      simB,
      'gap',
      'tail'
    ),
    ...put(
      'tailNote',
      tailLabel(simB)
    ),
    ...say('ABOUT HALF REACH SIX OR MORE', POST),
    ...fbox([
      ['gap ≥ 6', POST],
      fmt(simB.tail) + ' replays',
      'out of 200,000',
      [tailPercent(simB), POST],
      ['about half', POST]
    ], POST)
  );

  // 45. The actual gap sits near the middle.

  await until(S(45));
  await play(
    ...put(
      'observed',
      observedMarker('gap')
    ),
    ...say('REAL GAP = 6: NOW QUITE TYPICAL', POST),
    ...fbox([
      ['real gap = 6', WHITE],
      ['Model B: near the middle', MODEL_B],
      ['GAP CHECK: TYPICAL', POST]
    ], POST)
  );

  // ============================================================
  // 46–49: define the posterior predictive check.
  // ============================================================

  // 46. Name the method.

  await until(S(46));
  await play(
    ...say('POSTERIOR PREDICTIVE CHECK', POST),
    ...fbox([
      ['POSTERIOR', POST],
      'updated chances',
      ['PREDICTIVE', MODEL_B],
      'new pretend records',
      ['CHECK', WHITE],
      'compare with reality'
    ], POST)
  );

  // 47. Draw one or more chances from the posterior.

  await until(S(47));
  await play(
    ...drawProbability(
      plotA(false)
    ),
    ...put(
      'marker',
      chanceMarker(
        0.25,
        posteriorA,
        MODEL_A,
        'ONE DRAW'
      )
    ),
    ...say('STEP 1: DRAW FROM THE UPDATED CURVE', POST),
    ...fbox([
      ['MODEL A', MODEL_A],
      'draw one shared chance',
      'then replay all 40 dots'
    ], MODEL_A)
  );

  await until(S(47) + 2.0);

  await play(
    ...drawProbability(
      plotB(false)
    ),
    ...put(
      'marker',
      new M.VGroup(
        chanceMarker(
          0.12,
          posteriorWith,
          WITH,
          '0.12'
        ),
        chanceMarker(
          0.42,
          posteriorWithout,
          WITHOUT,
          '0.42'
        )
      )
    ),
    ...fbox([
      ['MODEL B', MODEL_B],
      ['draw one per group', POST],
      'then replay each group',
      'using its own chance'
    ], MODEL_B)
  );

  // 48. Compare the same statistic across the real
  // and replicated records.

  await until(S(48));
  await play(
    ...drawHist(
      simB,
      'gap',
      'tail',
      true
    ),
    ...say('STEP 2: COMPARE THE SAME NUMBER', POST),
    ...fbox([
      ['real record: gap = 6', WHITE],
      ['pretend records:', MODEL_B],
      'calculate the same gap',
      'compare with the real one'
    ], POST)
  );

  // 49. A rare value points to a possible missing rule.

  await until(S(49));
  await play(
    ...drawHist(
      simA,
      'gap',
      'tail',
      true
    ),
    ...say('A RARE PATTERN POINTS TO A WEAKNESS', RED),
    ...fbox([
      ['Model A: ' + tailPercent(simA), MODEL_A],
      ['Model B: ' + tailPercent(simB), MODEL_B],
      ['gap ≥ 6', C.muted],
      'Model A may need',
      'a reminder-group rule'
    ], RED)
  );

  // ============================================================
  // 50–52: the trap and final recap.
  // ============================================================

  // 50. Do not stop just because the total looks typical.

  await until(S(50));
  await play(
    ...drawHist(
      simA,
      'total',
      'none',
      true
    ),
    ...say('TRAP: STOPPING AFTER THE TOTAL CHECK', MODEL_A),
    ...fbox([
      ['MODEL A', MODEL_A],
      ['total: typical', POST],
      'but this is only',
      'one part of the record'
    ], MODEL_A)
  );

  // 51. The same model can miss the group pattern.

  await until(S(51));
  await play(
    ...drawHist(
      simA,
      'gap',
      'tail',
      true
    ),
    ...say('TYPICAL TOTAL, UNUSUAL GROUP GAP', RED),
    ...fbox([
      ['MODEL A', MODEL_A],
      ['total: typical', POST],
      ['gap: unusual', RED],
      'right overall count',
      'wrong group pattern'
    ], RED)
  );

  // 52. Final recap.
  //
  // A posterior predictive check asks whether an observed
  // feature is typical among replicated records.
  //
  // Model B reproduces this particular gap better.
  // Passing this check does not establish that every aspect
  // of Model B is correct.

  await until(S(52));
  await play(
    ...drawHist(
      simB,
      'gap',
      'tail',
      true
    ),
    ...say('DOES THE REAL PATTERN LOOK TYPICAL?', POST),
    ...fbox([
      ['POSTERIOR PREDICTIVE', POST],
      ['CHECK', POST],
      '1. Draw chances',
      '2. Replay the record',
      '3. Compare the pattern',
      ['real gap = 6', WHITE]
    ], POST)
  );

  await until(S(52) + 2.65);

  await play(
    ...say('CHECK THE PATTERN, NOT JUST THE TOTAL', POST),
    ...fbox([
      ['MODEL A', MODEL_A],
      ['total typical, gap rare', RED],
      ['MODEL B', MODEL_B],
      ['gap looks typical', POST],
      'check more than one',
      'feature of the data'
    ], POST)
  );

  await until(E(52));
}

// lesson 10.4.5
// Maximum a posteriori estimation: combining earlier experience with real data.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Responsive layout and colours
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;
  const PILL = P ? [0, -4.85, 0] : [CX, 1.91, 0];
  const BOXP = P ? [0, 2.75, 0] : [4.25, -0.25, 0];

  const RED = C.red || '#FF526F';
  const WHITE = '#E8EDF5';
  const PRIOR = C.violet;
  const LIKE = C.amber;
  const POST = C.green;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const text = (s, size, color, pos, mono = false) => {
    const t = T(s, size, color, mono);
    t.moveTo(pos);
    return t;
  };

  const line = (a, b, color = C.muted, width = 2) =>
    new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });

  const dashed = (a, b, color = C.muted) =>
    new M.DashedLine({
      start: a,
      end: b,
      color
    });

  const dot = (pos, color, radius = 0.11) =>
    new M.Dot({
      point: pos,
      radius,
      color
    });

  // Replace independent scene objects without regrouping
  // anything that is already on screen.

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
  // Formula box, following the approved reference lesson
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.43 : 0.41;

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

    const wd = Math.max(...widths) + 0.65;
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

    const left = BOXP[0] - wd / 2 + 0.325;
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
    const maxw = P ? FW - 1.0 : 4.35;

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
  // Clinic data: exactly 40 real appointments.
  //
  // Reminder, morning:       1 missed, 9 kept
  // Reminder, afternoon:     1 missed, 9 kept
  // No reminder, morning:    3 missed, 7 kept
  // No reminder, afternoon:  5 missed, 5 kept
  //
  // Pretend appointments:    2 missed, 18 kept
  // ------------------------------------------------------------

  const REAL = [
    [0],
    [0],
    [0, 1, 2],
    [0, 1, 2, 3, 4]
  ];

  const PRETEND = [
    [0],
    [0]
  ];

  const SP = P ? 0.52 : 0.55;
  const RSP = P ? 0.53 : 0.44;
  const RAD = P ? 0.145 : 0.13;

  const GX = CX + 0.20;
  const REAL_TOP = P ? 0.55 : 0.79;
  const PRE_TOP = P ? -2.10 : -1.51;

  const gx = c => GX + (c - 4.5) * SP;
  const ry = r => REAL_TOP - r * RSP;
  const py = r => PRE_TOP - r * RSP;

  function appointment(p, missed, style = 'real') {
    const color = missed ? RED : WHITE;

    if (style === 'empty') {
      const ring = new M.Circle({
        radius: RAD,
        color: C.muted,
        strokeWidth: 1.6
      });

      ring.setFill(C.card, 0);
      ring.moveTo(p);

      return ring;
    }

    if (style === 'pretend') {
      const ring = new M.Circle({
        radius: RAD + 0.025,
        color,
        strokeWidth: 2.1
      });

      ring.setFill(C.card, 0);
      ring.moveTo(p);

      const centre = new M.Dot({
        point: p,
        radius: RAD * 0.42,
        color
      });

      centre.setFill(color, 0.7);

      return new M.VGroup(ring, centre);
    }

    const d = new M.Dot({
      point: p,
      radius: RAD,
      color
    });

    d.setFill(color, 0.95);

    if (!missed) return d;

    const halo = new M.Dot({
      point: p,
      radius: RAD * 1.65,
      color: RED
    });

    halo.setFill(RED, 0.14);

    return new M.VGroup(halo, d);
  }

  // Small phone icon for the two reminder rows.

  function phoneIcon(x, y) {
    const shell = new M.RoundedRectangle({
      width: P ? 0.30 : 0.24,
      height: P ? 0.44 : 0.36,
      cornerRadius: 0.035,
      color: C.cyan,
      strokeWidth: 1.7
    });

    shell.setFill(C.card, 0.8);
    shell.moveTo([x, y, 0]);

    const screenLine = line(
      [x - 0.07, y + 0.12, 0],
      [x + 0.07, y + 0.12, 0],
      C.cyan,
      1
    );

    const button = dot(
      [x, y - 0.13, 0],
      C.cyan,
      0.03
    );

    return new M.VGroup(shell, screenLine, button);
  }

  function realLabels() {
    const title = text(
      'REAL APPOINTMENTS',
      18,
      C.cyan,
      [GX, REAL_TOP + 0.48, 0]
    );

    const phones = [0, 1].map(r =>
      phoneIcon(gx(0) - 0.6, ry(r))
    );

    const dayLabels = [0, 1, 2, 3].map(r =>
      text(
        r % 2 === 0 ? 'AM' : 'PM',
        P ? 15 : 14,
        C.muted,
        [gx(9) + 0.42, ry(r), 0],
        true
      )
    );

    const divider = line(
      [
        gx(0) - 0.28,
        (ry(1) + ry(2)) / 2,
        0
      ],
      [
        gx(9) + 0.27,
        (ry(1) + ry(2)) / 2,
        0
      ],
      C.muted,
      1
    );

    return new M.VGroup(
      title,
      ...phones,
      ...dayLabels,
      divider
    );
  }

  function pretendLabels() {
    return new M.VGroup(
      text(
        'EARLIER EXPERIENCE',
        18,
        PRIOR,
        [GX, PRE_TOP + 0.46, 0]
      )
    );
  }

  function appointmentGroup(data, yfn, missedOnly, style) {
    const objects = [];

    data.forEach((row, r) => {
      for (let c = 0; c < 10; c++) {
        const missed = row.includes(c);

        if (missed !== missedOnly) continue;

        objects.push(
          appointment(
            [gx(c), yfn(r), 0],
            missed,
            style
          )
        );
      }
    });

    return new M.VGroup(...objects);
  }

  function fullRecord() {
    return [
      ...put('realLabels', realLabels()),
      ...put(
        'realMiss',
        appointmentGroup(REAL, ry, true, 'real')
      ),
      ...put(
        'realKeep',
        appointmentGroup(REAL, ry, false, 'real')
      ),
      ...put('pretendLabels', pretendLabels()),
      ...put(
        'pretendMiss',
        appointmentGroup(PRETEND, py, true, 'pretend')
      ),
      ...put(
        'pretendKeep',
        appointmentGroup(PRETEND, py, false, 'pretend')
      )
    ];
  }

  function removeRecord() {
    return remove(
      'realLabels',
      'realMiss',
      'realKeep',
      'pretendLabels',
      'pretendMiss',
      'pretendKeep',
      'recordOutline'
    );
  }

  function recordOutline(color = POST) {
    const top = REAL_TOP + 0.28;
    const bottom = py(1) - 0.27;

    const r = new M.RoundedRectangle({
      width: 9 * SP + 0.75,
      height: top - bottom,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.025);
    r.moveTo([GX, (top + bottom) / 2, 0]);

    return r;
  }

  // ------------------------------------------------------------
  // Probability curves.
  //
  // Likelihood: p^10 (1-p)^30
  // Prior:      p^2  (1-p)^18  = Beta(3,19), up to scaling
  // Posterior:  p^12 (1-p)^48  = Beta(13,49), up to scaling
  //
  // The likelihood and prior are initially scaled to have
  // their own maximum equal to 1.
  //
  // Their log scores therefore have their own maximum at 0.
  // Adding a constant to a curve does not change its mode.
  // ------------------------------------------------------------

  function logScore(p, missed, kept) {
    if (p <= 0 || p >= 1) {
      return -Infinity;
    }

    return (
      missed * Math.log(p) +
      kept * Math.log(1 - p)
    );
  }

  const LIKE_TOP = 10 / 40;
  const PRIOR_TOP = 2 / 20;
  const MAP = 12 / 60;

  const maxLike = logScore(LIKE_TOP, 10, 30);
  const maxPrior = logScore(PRIOR_TOP, 2, 18);

  const logLike = p =>
    logScore(p, 10, 30) - maxLike;

  const logPrior = p =>
    logScore(p, 2, 18) - maxPrior;

  const logCombined = p =>
    logLike(p) + logPrior(p);

  const combinedTop = logCombined(MAP);

  const logPosterior = p =>
    logCombined(p) - combinedTop;

  const priorCurve = p => Math.exp(logPrior(p));
  const likeCurve = p => Math.exp(logLike(p));

  const productCurve = p =>
    Math.exp(logCombined(p));

  const posteriorCurve = p =>
    Math.exp(logPosterior(p));

  // ------------------------------------------------------------
  // Responsive plot geometry
  // ------------------------------------------------------------

  const AX0 = CX - (P ? 3.06 : 3.10);
  const AX1 = CX + (P ? 3.30 : 3.10);

  const AY0 = P ? -3.55 : -2.05;
  const AY1 = P ? 0.62 : 1.08;

  const X = p => AX0 + p * (AX1 - AX0);

  const Y = v =>
    AY0 + v * (AY1 - AY0);

  const LY = v =>
    AY1 + (v / 6) * (AY1 - AY0);

  function axes(kind = 'relative') {
    const a = [];

    a.push(
      line(
        [AX0, AY0, 0],
        [AX1, AY0, 0],
        C.muted,
        2
      )
    );

    if (kind !== 'chance') {
      a.push(
        line(
          [AX0, AY0, 0],
          [AX0, AY1 + 0.12, 0],
          C.muted,
          2
        )
      );
    }

    const xticks = [0, 0.2, 0.4, 0.6, 0.8, 1];

    xticks.forEach(p => {
      a.push(
        line(
          [X(p), AY0 - 0.065, 0],
          [X(p), AY0 + 0.065, 0],
          C.muted,
          1.4
        )
      );

      a.push(
        text(
          String(p),
          P ? 17 : 15,
          C.muted,
          [X(p), AY0 - 0.27, 0],
          true
        )
      );
    });

    a.push(
      text(
        'chance of a missed appointment',
        P ? 17 : 14,
        C.muted,
        [CX, AY0 - 0.65, 0]
      )
    );

    if (kind === 'relative') {
      [0, 0.5, 1].forEach(v => {
        a.push(
          line(
            [AX0 - 0.06, Y(v), 0],
            [AX0 + 0.06, Y(v), 0],
            C.muted,
            1
          )
        );

        if (v > 0) {
          a.push(
            text(
              String(v),
              P ? 17 : 14,
              C.muted,
              [AX0 - 0.32, Y(v), 0],
              true
            )
          );
        }
      });

      a.push(
        text(
          'relative weight / fit',
          P ? 17 : 15,
          C.muted,
          [AX0 + 1.17, AY1 + 0.35, 0]
        )
      );
    }

    if (kind === 'log') {
      [0, -2, -4, -6].forEach(v => {
        const y = LY(v);

        a.push(
          line(
            [AX0 - 0.065, y, 0],
            [AX0 + 0.065, y, 0],
            C.muted,
            1
          )
        );

        a.push(
          text(
            String(v).replace('-', '−'),
            P ? 17 : 14,
            C.muted,
            [AX0 - 0.34, y, 0],
            true
          )
        );
      });

      a.push(
        dashed(
          [AX0, LY(0), 0],
          [AX1, LY(0), 0],
          C.muted
        )
      );

      a.push(
        text(
          'log score',
          P ? 17 : 16,
          C.muted,
          [AX0 + 0.65, AY1 + 0.32, 0]
        )
      );
    }

    return new M.VGroup(...a);
  }

  // Draw sampled curves using only the basic Line primitive.
  // This avoids depending on a particular VMobject/path API.
  // Log curves are clipped at the bottom of the plot.

  function curve(fn, color, logarithmic = false, width = 3.8) {
    const segments = [];
    const N = 160;

    const yfn = logarithmic ? LY : Y;
    const lower = logarithmic ? -6 : 0;
    const upper = logarithmic ? 0 : 1;

    function clipSegment(p0, v0, p1, v1) {
      if (!Number.isFinite(v0)) v0 = lower - 100;
      if (!Number.isFinite(v1)) v1 = lower - 100;

      if (v0 < lower && v1 < lower) return null;
      if (v0 > upper && v1 > upper) return null;

      if (v0 < lower || v0 > upper) {
        const limit = v0 < lower ? lower : upper;

        p0 += (p1 - p0) * (limit - v0) / (v1 - v0);
        v0 = limit;
      }

      if (v1 < lower || v1 > upper) {
        const limit = v1 < lower ? lower : upper;

        p1 = p0 +
          (p1 - p0) * (limit - v0) / (v1 - v0);

        v1 = limit;
      }

      return [
        [X(p0), yfn(v0), 0],
        [X(p1), yfn(v1), 0]
      ];
    }

    for (let i = 0; i < N; i++) {
      const p0 = i / N;
      const p1 = (i + 1) / N;

      const clipped = clipSegment(
        p0,
        fn(p0),
        p1,
        fn(p1)
      );

      if (!clipped) continue;

      segments.push(
        line(
          clipped[0],
          clipped[1],
          color,
          width
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function curveLegend(items) {
    const gap = P ? 0.78 : 0.70;

    const objects = [];

    items.forEach(([name, color], i) => {
      const y = AY1 - 0.22 - i * gap;
      const x = AX1 - 1.25;

      objects.push(
        line(
          [x - 0.76, y, 0],
          [x - 0.42, y, 0],
          color,
          3.6
        )
      );

      const label = T(name, P ? 18 : 15, color);

      label.moveTo([
        x - 0.29 + label.getWidth() / 2,
        y,
        0
      ]);

      objects.push(label);
    });

    return new M.VGroup(...objects);
  }

  function peakMarker(p, value, color, logarithmic = false) {
    const y = logarithmic ? LY(value) : Y(value);

    const guide = dashed(
      [X(p), AY0 + 0.05, 0],
      [X(p), y, 0],
      color
    );

    const halo = dot(
      [X(p), y, 0],
      color,
      0.22
    );

    halo.setFill(color, 0.16);

    const peak = dot(
      [X(p), y, 0],
      color,
      0.10
    );

    return new M.VGroup(guide, halo, peak);
  }

  function chanceTag(p, label, color) {
    const t = pill(label, color, 16);

    t.moveTo([
      X(p),
      AY0 - 0.27,
      0
    ]);

    return t;
  }

  function scoreMarker(p, scores) {
    const objects = [
      dashed(
        [X(p), AY0, 0],
        [X(p), AY1, 0],
        C.muted
      )
    ];

    scores.forEach(([value, color]) => {
      const y = LY(Math.max(-6, value));

      const halo = dot(
        [X(p), y, 0],
        color,
        0.20
      );

      halo.setFill(color, 0.18);

      objects.push(
        halo,
        dot([X(p), y, 0], color, 0.09)
      );
    });

    return new M.VGroup(...objects);
  }

  function removePlot() {
    return remove(
      'axes',
      'priorCurve',
      'likeCurve',
      'postCurve',
      'shiftCurve',
      'legend',
      'marker',
      'chanceTag',
      'samples',
      'width'
    );
  }

  // ------------------------------------------------------------
  // 0–5: the real record and Model A
  // ------------------------------------------------------------

  const question = pill(
    'CHANCE OF A MISS?',
    LIKE,
    P ? 28 : 31
  );

  question.moveTo([
    CX,
    P ? -0.25 : -0.2,
    0
  ]);

  await until(S(0));
  await play(
    ...put('question', question),
    ...say('ONE NUMBER FOR THE CLINIC', LIKE)
  );

  // 1. Forty appointments.

  await until(S(1));
  await play(
    ...remove('question'),
    ...put('realLabels', realLabels()),
    ...put(
      'realMiss',
      appointmentGroup(REAL, ry, true, 'empty')
    ),
    ...put(
      'realKeep',
      appointmentGroup(REAL, ry, false, 'empty')
    ),
    ...say('40 REAL APPOINTMENTS')
  );

  // 2. Ten missed appointments.

  await until(S(2));
  await play(
    ...put(
      'realMiss',
      appointmentGroup(REAL, ry, true, 'real')
    ),
    ...say('10 MISSED', RED),
    ...fbox([
      ['missed = 10', RED]
    ], RED)
  );

  // 3. Thirty kept appointments.

  await until(S(3));
  await play(
    ...put(
      'realKeep',
      appointmentGroup(REAL, ry, false, 'real')
    ),
    ...say('30 KEPT', WHITE),
    ...fbox([
      ['missed = 10', RED],
      ['kept   = 30', WHITE],
      'total  = 40'
    ])
  );

  // 4. One shared miss chance.

  await until(S(4));
  await play(
    ...say('MODEL A: ONE SHARED CHANCE', LIKE),
    ...fbox([
      ['MODEL A', LIKE],
      'same miss chance',
      'for all 40 dots'
    ], LIKE),
    new M.Indicate(
      visible.realLabels,
      { color: LIKE }
    )
  );

  // 5. Real record: 10 / 40 = 0.25.

  await until(S(5));
  await play(
    ...say('REAL RECORD: ONE IN FOUR', LIKE),
    ...fbox([
      ['10 missed', RED],
      '40 appointments',
      ['10 ÷ 40 = 0.25', LIKE]
    ], LIKE)
  );

  // ------------------------------------------------------------
  // 6–10: earlier experience becomes 20 pretend dots
  // ------------------------------------------------------------

  await until(S(6));
  await play(
    ...say('OTHER CLINICS: ONE IN TEN', PRIOR),
    ...fbox([
      ['EARLIER EXPERIENCE', PRIOR],
      'about 1 miss in 10',
      ['chance = 0.10', PRIOR]
    ], PRIOR)
  );

  // 7. Give that experience a weight of 20 appointments.

  await until(S(7));
  await play(
    ...put('pretendLabels', pretendLabels()),
    ...put(
      'pretendMiss',
      appointmentGroup(PRETEND, py, true, 'empty')
    ),
    ...put(
      'pretendKeep',
      appointmentGroup(PRETEND, py, false, 'empty')
    ),
    ...say('20 PRETEND APPOINTMENTS', PRIOR),
    ...fbox([
      ['earlier experience', PRIOR],
      'weight of 20 dots',
      'not new real data'
    ], PRIOR)
  );

  // 8. Two pretend misses.

  await until(S(8));
  await play(
    ...put(
      'pretendMiss',
      appointmentGroup(PRETEND, py, true, 'real')
    ),
    ...say('2 PRETEND MISSES', RED),
    ...fbox([
      ['pretend missed = 2', RED],
      'total = 20'
    ], PRIOR)
  );

  // 9. Eighteen pretend kept appointments.

  await until(S(9));
  await play(
    ...put(
      'pretendKeep',
      appointmentGroup(PRETEND, py, false, 'real')
    ),
    ...say('18 PRETEND KEPT', WHITE),
    ...fbox([
      ['pretend missed = 2', RED],
      ['pretend kept  = 18', WHITE],
      ['2 ÷ 20 = 0.10', PRIOR]
    ], PRIOR)
  );

  // 10. Outlined dots distinguish pretend from real.

  await until(S(10));
  await play(
    ...put(
      'pretendMiss',
      appointmentGroup(PRETEND, py, true, 'pretend')
    ),
    ...put(
      'pretendKeep',
      appointmentGroup(PRETEND, py, false, 'pretend')
    ),
    ...say('OUTLINED DOTS = PRETEND', PRIOR),
    ...fbox([
      ['solid: real record', C.cyan],
      ['outline: earlier experience', PRIOR]
    ], PRIOR)
  );

  // ------------------------------------------------------------
  // 11–20: prior, likelihood, posterior and MAP
  // ------------------------------------------------------------

  // 11. A line of possible chances.

  await until(S(11));
  await play(
    ...removeRecord(),
    ...clearBox(),
    ...put('axes', axes('chance')),
    ...say('POSSIBLE CHANCES: 0 TO 1')
  );

  // 12. Earlier experience gives different chances
  // different starting weights.

  await until(S(12));
  await play(
    ...put('axes', axes('relative')),
    ...put(
      'priorCurve',
      curve(priorCurve, PRIOR)
    ),
    ...say('WEIGHT BEFORE SEEING THE RECORD', PRIOR)
  );

  // 13. Name the prior.

  await until(S(13));
  await play(
    ...put(
      'legend',
      curveLegend([
        ['prior', PRIOR]
      ])
    ),
    ...say('PRIOR = STARTING WEIGHT', PRIOR),
    ...fbox([
      ['PRIOR', PRIOR],
      'what we believe',
      'before the new record'
    ], PRIOR)
  );

  // 14. Higher means more starting weight.

  await until(S(14));
  await play(
    ...put(
      'marker',
      peakMarker(0.1, 1, PRIOR)
    ),
    ...put(
      'chanceTag',
      chanceTag(0.1, '0.10', PRIOR)
    ),
    ...say('HIGHER = MORE STARTING WEIGHT', PRIOR),
    ...fbox([
      ['most starting weight', PRIOR],
      ['at chance 0.10', PRIOR],
      'nearby chances',
      'also have weight'
    ], PRIOR)
  );

  // 15. Likelihood scores the real record.

  await until(S(15));
  await play(
    ...remove('marker', 'chanceTag'),
    ...put(
      'likeCurve',
      curve(likeCurve, LIKE)
    ),
    ...put(
      'legend',
      curveLegend([
        ['prior', PRIOR],
        ['likelihood', LIKE]
      ])
    ),
    ...say('LIKELIHOOD = FIT TO THE REAL RECORD', LIKE),
    ...fbox([
      ['LIKELIHOOD', LIKE],
      'how well a chance',
      'fits the 40 real dots'
    ], LIKE)
  );

  // 16. Multiply the two scores at the same chance.

  const sampleP = 0.2;

  function productSample() {
    const x = X(sampleP);
    const a = priorCurve(sampleP);
    const b = likeCurve(sampleP);
    const c = productCurve(sampleP);

    return new M.VGroup(
      dashed(
        [x, AY0, 0],
        [x, Y(Math.max(a, b)), 0],
        C.muted
      ),
      dot([x, Y(a), 0], PRIOR, 0.11),
      dot([x, Y(b), 0], LIKE, 0.11),
      dot([x, Y(c), 0], POST, 0.12)
    );
  }

  await until(S(16));
  await play(
    ...put('marker', productSample()),
    ...put(
      'chanceTag',
      chanceTag(sampleP, '0.20', POST)
    ),
    ...say('SAME CHANCE: MULTIPLY ITS TWO SCORES', POST),
    ...fbox([
      ['at chance 0.20', POST],
      ['prior      ≈ 0.48', PRIOR],
      ['likelihood ≈ 0.74', LIKE],
      ['product    ≈ 0.36', POST]
    ], POST)
  );

  // 17. The products trace a new curve.

  await until(S(17));
  await play(
    ...remove('marker', 'chanceTag'),
    ...put(
      'postCurve',
      curve(productCurve, POST, false, 4.5)
    ),
    ...put(
      'legend',
      curveLegend([
        ['prior', PRIOR],
        ['likelihood', LIKE],
        ['posterior shape', POST]
      ])
    ),
    ...say('POSTERIOR = UPDATED WEIGHT', POST),
    ...fbox([
      ['starting weight', PRIOR],
      ['× fit score', LIKE],
      ['= updated shape', POST]
    ], POST)
  );

  // 18. Look directly below the highest point.

  await until(S(18));
  await play(
    ...remove('priorCurve', 'likeCurve'),
    ...put(
      'postCurve',
      curve(posteriorCurve, POST, false, 4.5)
    ),
    ...put(
      'legend',
      curveLegend([
        ['posterior', POST]
      ])
    ),
    ...put(
      'marker',
      peakMarker(MAP, 1, POST)
    ),
    ...say('LOOK DIRECTLY BELOW THE PEAK', POST),
    ...fbox([
      ['highest point', POST],
      '          ↓',
      ['one chosen chance', POST],
      ['same shape, rescaled', C.muted]
    ], POST)
  );

  // 19. The mode.

  await until(S(19));
  await play(
    ...say('MODE = CHANCE AT THE HIGHEST POINT', POST),
    new M.Indicate(
      visible.marker,
      { color: POST }
    ),
    ...fbox([
      ['MODE', POST],
      'the chance below',
      'the highest point'
    ], POST)
  );

  // 20. Maximum a posteriori estimation.

  await until(S(20));
  await play(
    ...say('MAXIMUM A POSTERIORI ESTIMATION', POST),
    ...fbox([
      ['M A P', POST],
      'maximum a posteriori',
      'estimation',
      ['pick the posterior mode', POST]
    ], POST)
  );

  // ------------------------------------------------------------
  // 21–27: compare candidates using log scores
  // ------------------------------------------------------------

  await until(S(21));
  await play(
    ...remove(
      'postCurve',
      'marker',
      'chanceTag',
      'legend'
    ),
    ...say('COMPARE A FEW POSSIBLE CHANCES'),
    ...fbox([
      'candidate chances',
      ['0.10', PRIOR],
      ['0.20', POST],
      ['0.25', LIKE]
    ])
  );

  // 22. Draw the likelihood first.

  await until(S(22));
  await play(
    ...put(
      'likeCurve',
      curve(likeCurve, LIKE)
    ),
    ...put(
      'legend',
      curveLegend([
        ['likelihood', LIKE]
      ])
    ),
    ...say('FIRST: THE REAL RECORD', LIKE),
    ...fbox([
      ['40 real appointments', LIKE],
      ['10 missed', RED],
      ['30 kept', WHITE]
    ], LIKE)
  );

  // 23. Likelihood peaks at 0.25.

  await until(S(23));
  await play(
    ...put(
      'marker',
      peakMarker(LIKE_TOP, 1, LIKE)
    ),
    ...put(
      'chanceTag',
      chanceTag(LIKE_TOP, '0.25', LIKE)
    ),
    ...say('LIKELIHOOD PEAK = 0.25', LIKE),
    ...fbox([
      ['real record', LIKE],
      '10 ÷ 40',
      ['= 0.25', LIKE]
    ], LIKE)
  );

  // 24. Prior peaks at 0.10.

  await until(S(24));
  await play(
    ...put(
      'priorCurve',
      curve(priorCurve, PRIOR)
    ),
    ...put(
      'legend',
      curveLegend([
        ['prior', PRIOR],
        ['likelihood', LIKE]
      ])
    ),
    ...put(
      'marker',
      peakMarker(PRIOR_TOP, 1, PRIOR)
    ),
    ...put(
      'chanceTag',
      chanceTag(PRIOR_TOP, '0.10', PRIOR)
    ),
    ...say('PRIOR PEAK = 0.10', PRIOR),
    ...fbox([
      ['prior peak      0.10', PRIOR],
      ['likelihood peak 0.25', LIKE]
    ], PRIOR)
  );

  // 25. The log of a product becomes a sum.

  await until(S(25));
  await play(
    ...say('LOGS: MULTIPLY BECOMES ADD', C.cyan),
    ...fbox([
      ['weight × fit', C.ink],
      '       ↓ log',
      ['log weight + log fit', C.cyan]
    ])
  );

  // 26. Each log curve gets its own zero at the top.

  await until(S(26));
  await play(
    ...remove('marker', 'chanceTag'),
    ...put('axes', axes('log')),
    ...put(
      'priorCurve',
      curve(logPrior, PRIOR, true)
    ),
    ...put(
      'likeCurve',
      curve(logLike, LIKE, true)
    ),
    ...say('SET EACH LOG CURVE’S TOP TO ZERO'),
    ...fbox([
      ['prior top      = 0', PRIOR],
      ['likelihood top = 0', LIKE],
      'each uses its own top'
    ])
  );

  // 27. Negative scores are distances below the top.

  await until(S(27));
  await play(
    ...put(
      'marker',
      scoreMarker(0.1, [
        [logPrior(0.1), PRIOR],
        [logLike(0.1), LIKE]
      ])
    ),
    ...say('BELOW THE TOP = NEGATIVE LOG SCORE'),
    ...fbox([
      ['0 = at the top', C.green],
      '−1 = below the top',
      '−4 = farther below',
      'not negative chances'
    ])
  );

  // ------------------------------------------------------------
  // 28–30: candidate p = 0.10
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...put(
      'marker',
      scoreMarker(0.1, [
        [logLike(0.1), LIKE]
      ])
    ),
    ...put(
      'chanceTag',
      chanceTag(0.1, '0.10', C.cyan)
    ),
    ...say('TRY 0.10: REAL RECORD SCORE', LIKE),
    ...fbox([
      ['chance = 0.10', C.cyan],
      ['log likelihood', LIKE],
      ['≈ −3.7', LIKE]
    ], LIKE)
  );

  // 29. Prior is at its own peak.

  await until(S(29));
  await play(
    ...put(
      'marker',
      scoreMarker(0.1, [
        [logLike(0.1), LIKE],
        [logPrior(0.1), PRIOR]
      ])
    ),
    ...say('AT 0.10: PRIOR SCORE IS ZERO', PRIOR),
    ...fbox([
      ['chance = 0.10', C.cyan],
      ['record ≈ −3.7', LIKE],
      ['prior  =  0', PRIOR]
    ], PRIOR)
  );

  // 30. Combined score.

  await until(S(30));
  await play(
    ...say('ADD THE TWO LOG SCORES', POST),
    ...fbox([
      ['chance = 0.10', C.cyan],
      ['−3.7', LIKE],
      ['+ 0', PRIOR],
      ['≈ −3.7', POST]
    ], POST)
  );

  // ------------------------------------------------------------
  // 31–33: candidate p = 0.20
  // ------------------------------------------------------------

  await until(S(31));
  await play(
    ...put(
      'marker',
      scoreMarker(0.2, [
        [logLike(0.2), LIKE]
      ])
    ),
    ...put(
      'chanceTag',
      chanceTag(0.2, '0.20', C.cyan)
    ),
    ...say('TRY 0.20: REAL RECORD SCORE', LIKE),
    ...fbox([
      ['chance = 0.20', C.cyan],
      ['log likelihood', LIKE],
      ['≈ −0.3', LIKE]
    ], LIKE)
  );

  // 32. Prior score at 0.20.

  await until(S(32));
  await play(
    ...put(
      'marker',
      scoreMarker(0.2, [
        [logLike(0.2), LIKE],
        [logPrior(0.2), PRIOR]
      ])
    ),
    ...say('AT 0.20: PRIOR SCORE ≈ −0.7', PRIOR),
    ...fbox([
      ['chance = 0.20', C.cyan],
      ['record ≈ −0.3', LIKE],
      ['prior  ≈ −0.7', PRIOR]
    ], PRIOR)
  );

  // 33. Sum ≈ −1.0.

  await until(S(33));
  await play(
    ...say('COMBINED SCORE ≈ −1.0', POST),
    ...fbox([
      ['chance = 0.20', C.cyan],
      ['−0.3', LIKE],
      ['− 0.7', PRIOR],
      ['≈ −1.0', POST]
    ], POST)
  );

  // ------------------------------------------------------------
  // 34–36: candidate p = 0.25
  // ------------------------------------------------------------

  await until(S(34));
  await play(
    ...put(
      'marker',
      scoreMarker(0.25, [
        [logLike(0.25), LIKE]
      ])
    ),
    ...put(
      'chanceTag',
      chanceTag(0.25, '0.25', C.cyan)
    ),
    ...say('TRY 0.25: RECORD SCORE IS ZERO', LIKE),
    ...fbox([
      ['chance = 0.25', C.cyan],
      ['log likelihood', LIKE],
      ['= 0', LIKE]
    ], LIKE)
  );

  // 35. Prior score at 0.25.

  await until(S(35));
  await play(
    ...put(
      'marker',
      scoreMarker(0.25, [
        [logLike(0.25), LIKE],
        [logPrior(0.25), PRIOR]
      ])
    ),
    ...say('AT 0.25: PRIOR SCORE ≈ −1.45', PRIOR),
    ...fbox([
      ['chance = 0.25', C.cyan],
      ['record =  0', LIKE],
      ['prior  ≈ −1.45', PRIOR]
    ], PRIOR)
  );

  // 36. Sum ≈ −1.45.

  await until(S(36));
  await play(
    ...say('COMBINED SCORE ≈ −1.45', POST),
    ...fbox([
      ['chance = 0.25', C.cyan],
      ['0', LIKE],
      ['− 1.45', PRIOR],
      ['≈ −1.45', POST]
    ], POST)
  );

  // ------------------------------------------------------------
  // 37: compare the three combined scores as bars.
  //
  // All bars hang down from zero.
  // The shortest downward bar has the largest score.
  // ------------------------------------------------------------

  function candidateBars() {
    const values = [
      [0.10, logCombined(0.10), '−3.7', PRIOR],
      [0.20, logCombined(0.20), '−1.0', POST],
      [0.25, logCombined(0.25), '−1.45', LIKE]
    ];

    const spacing = P ? 1.82 : 1.90;
    const zeroY = P ? 0.50 : 0.91;
    const scale = P ? 0.78 : 0.59;
    const bw = P ? 0.78 : 0.83;

    const objects = [
      line(
        [CX - 3.05, zeroY, 0],
        [CX + 3.05, zeroY, 0],
        C.muted,
        2
      ),
      text(
        '0',
        16,
        C.muted,
        [CX - 3.2, zeroY, 0],
        true
      )
    ];

    values.forEach(([p, v, display, color], i) => {
      const x = CX + (i - 1) * spacing;
      const h = -v * scale;

      const bar = new M.Rectangle({
        width: bw,
        height: h,
        color,
        strokeWidth: p === 0.2 ? 3 : 1.5
      });

      bar.setFill(color, p === 0.2 ? 0.88 : 0.48);
      bar.moveTo([x, zeroY - h / 2, 0]);

      objects.push(
        bar,
        text(
          p.toFixed(2),
          20,
          color,
          [x, zeroY + 0.33, 0],
          true
        ),
        text(
          display,
          20,
          color,
          [x, zeroY - h - 0.30, 0],
          true
        )
      );

      if (p === 0.2) {
        const winner = pill('LARGEST', POST, 14);

        winner.moveTo([
          x,
          zeroY - h - 0.78,
          0
        ]);

        objects.push(winner);
      }
    });

    return new M.VGroup(...objects);
  }

  await until(S(37));
  await play(
    ...removePlot(),
    ...put('samples', candidateBars()),
    ...say('CLOSEST TO ZERO = LARGEST SCORE', POST),
    ...fbox([
      'chance     log sum',
      ['0.10       −3.7', PRIOR],
      ['0.20       −1.0  ✓', POST],
      ['0.25       −1.45', LIKE]
    ], POST)
  );

  // ------------------------------------------------------------
  // 38–42: exact MAP by combining the appointment dots
  // ------------------------------------------------------------

  // 38. The prior behaves like 20 pretend observations.

  await until(S(38));
  await play(
    ...remove('samples'),
    ...fullRecord(),
    ...say('PRIOR SCORES THE 20 PRETEND DOTS', PRIOR),
    ...fbox([
      ['earlier experience', PRIOR],
      ['2 missed', RED],
      ['18 kept', WHITE],
      '20 pretend dots'
    ], PRIOR)
  );

  // 39. Multiplication scores all the dots together.

  await until(S(39));
  await play(
    ...put(
      'recordOutline',
      recordOutline(POST)
    ),
    ...say('SCORE REAL AND PRETEND DOTS TOGETHER', POST),
    ...fbox([
      ['real fit score', LIKE],
      ['× pretend fit score', PRIOR],
      ['= combined fit score', POST]
    ], POST)
  );

  // 40. Combine the missed appointments.

  await until(S(40));
  await play(
    new M.Indicate(
      visible.realMiss,
      { color: RED }
    ),
    new M.Indicate(
      visible.pretendMiss,
      { color: RED }
    ),
    ...say('10 REAL MISSES + 2 PRETEND MISSES', RED),
    ...fbox([
      ['10 real misses', RED],
      ['+ 2 pretend misses', RED],
      ['= 12 misses', POST]
    ], RED)
  );

  // 41. Combine the appointment totals.

  await until(S(41));
  await play(
    new M.Indicate(
      visible.recordOutline,
      { color: POST }
    ),
    ...say('40 REAL + 20 PRETEND = 60', POST),
    ...fbox([
      ['missed = 12', RED],
      '',
      ['40 real dots', C.cyan],
      ['+ 20 pretend dots', PRIOR],
      ['= 60 dots', POST]
    ], POST)
  );

  // 42. Exact MAP = 12 / 60 = 0.20.

  await until(S(42));
  await play(
    ...say('TWELVE OUT OF SIXTY = ONE IN FIVE', POST),
    ...fbox([
      ['12 misses', RED],
      '60 appointments',
      ['12 ÷ 60 = 0.20', POST]
    ], POST)
  );

  // ------------------------------------------------------------
  // 43–46: exact posterior peak and the additive constant
  // ------------------------------------------------------------

  // 43. The posterior shape peaks at 0.20.

  await until(S(43));
  await play(
    ...removeRecord(),
    ...put('axes', axes('relative')),
    ...put(
      'postCurve',
      curve(posteriorCurve, POST, false, 4.5)
    ),
    ...put(
      'legend',
      curveLegend([
        ['posterior', POST]
      ])
    ),
    ...put(
      'marker',
      peakMarker(MAP, 1, POST)
    ),
    ...put(
      'chanceTag',
      chanceTag(MAP, '0.20', POST)
    ),
    ...say('EXACT MAP = 0.20', POST),
    ...fbox([
      ['combined fit', POST],
      '12 misses in 60',
      ['peak = 0.20', POST],
      ['one in five', POST]
    ], POST)
  );

  // 44. Shift every log score by the same constant.
  //
  // The unshifted sum peaks near −1.03.
  // Adding approximately 1.03 moves its peak to zero.

  function shiftMarkers() {
    const x = X(MAP);

    const oldY = LY(combinedTop);
    const newY = LY(0);

    const oldDot = dot(
      [x, oldY, 0],
      C.muted,
      0.10
    );

    const newDot = dot(
      [x, newY, 0],
      POST,
      0.11
    );

    const shaft = line(
      [x, oldY + 0.10, 0],
      [x, newY - 0.10, 0],
      C.cyan,
      3
    );

    const head1 = line(
      [x, newY - 0.10, 0],
      [x - 0.10, newY - 0.25, 0],
      C.cyan,
      2.5
    );

    const head2 = line(
      [x, newY - 0.10, 0],
      [x + 0.10, newY - 0.25, 0],
      C.cyan,
      2.5
    );

    return new M.VGroup(
      dashed(
        [x, AY0, 0],
        [x, oldY, 0],
        POST
      ),
      oldDot,
      newDot,
      shaft,
      head1,
      head2
    );
  }

  await until(S(44));
  await play(
    ...put('axes', axes('log')),
    ...put(
      'postCurve',
      curve(logCombined, C.muted, true, 3)
    ),
    ...put(
      'shiftCurve',
      curve(logPosterior, POST, true, 4.5)
    ),
    ...put('marker', shiftMarkers()),
    ...put(
      'legend',
      curveLegend([
        ['shifted sum', POST],
        ['original sum', C.muted]
      ])
    ),
    ...say('A CONSTANT SHIFTS EVERY SCORE EQUALLY', C.cyan),
    ...fbox([
      ['same shift for all', C.cyan],
      'original top ≈ −1.03',
      ['add ≈ 1.03 to all', POST],
      'new top = 0'
    ])
  );

  // 45. Formula.

  await until(S(45));
  await play(
    ...say('THE LOG POSTERIOR FORMULA', POST),
    ...fbox([
      ['log posterior', POST],
      ['= log likelihood', LIKE],
      ['+ log prior', PRIOR],
      ['+ constant', C.muted]
    ], POST)
  );

  // 46. The ordering of the scores never changes.

  await until(S(46));
  await play(
    new M.Indicate(
      visible.marker,
      { color: POST }
    ),
    ...say('SAME ORDER, SAME PEAK, SAME CHANCE', POST),
    ...fbox([
      'all heights shift',
      'their order stays',
      '',
      ['peak still at 0.20', POST]
    ], POST)
  );

  // ------------------------------------------------------------
  // 47–50: when to use MAP, uncertainty and recap
  // ------------------------------------------------------------

  // 47. Both earlier experience and real observations matter.

  function threePeakDots() {
    return new M.VGroup(
      dot(
        [X(PRIOR_TOP), Y(1), 0],
        PRIOR,
        0.085
      ),
      dot(
        [X(LIKE_TOP), Y(1), 0],
        LIKE,
        0.085
      ),
      dot(
        [X(MAP), Y(1), 0],
        POST,
        0.11
      )
    );
  }

  await until(S(47));
  await play(
    ...remove('shiftCurve', 'marker', 'chanceTag'),
    ...put('axes', axes('relative')),
    ...put(
      'priorCurve',
      curve(priorCurve, PRIOR, false, 2.8)
    ),
    ...put(
      'likeCurve',
      curve(likeCurve, LIKE, false, 2.8)
    ),
    ...put(
      'postCurve',
      curve(posteriorCurve, POST, false, 4.5)
    ),
    ...put('marker', threePeakDots()),
    ...put(
      'legend',
      curveLegend([
        ['prior', PRIOR],
        ['likelihood', LIKE],
        ['posterior', POST]
      ])
    ),
    ...say('ONE CHANCE THAT REFLECTS BOTH', POST),
    ...fbox([
      ['prior: 20 dots → 0.10', PRIOR],
      ['record: 40 dots → 0.25', LIKE],
      ['combined MAP  = 0.20', POST]
    ], POST)
  );

  // 48. The trap: one chosen chance does not mean certainty.

  await until(S(48));
  await play(
    ...remove('priorCurve', 'likeCurve'),
    ...put(
      'legend',
      curveLegend([
        ['posterior', POST]
      ])
    ),
    ...put(
      'marker',
      peakMarker(MAP, 1, POST)
    ),
    ...put(
      'chanceTag',
      chanceTag(MAP, '0.20', POST)
    ),
    ...say('TRAP: A PEAK IS NOT CERTAINTY', LIKE),
    ...fbox([
      ['MAP = 0.20', POST],
      'one chosen estimate',
      ['not an exact known chance', LIKE]
    ], LIKE)
  );

  // 49. Show the width of the posterior.
  //
  // Highlight its half-height width as a visual description
  // of spread, not as a confidence or credible interval.

  function widthPicture() {
    const height = 0.5;

    let lo = MAP;
    let hi = MAP;

    while (
      lo > 0.001 &&
      posteriorCurve(lo) > height
    ) {
      lo -= 0.001;
    }

    while (
      hi < 0.999 &&
      posteriorCurve(hi) > height
    ) {
      hi += 0.001;
    }

    const objects = [];

    // Light vertical slices fill the curve below the
    // highlighted central section.

    const slices = 36;

    for (let i = 0; i < slices; i++) {
      const p0 = lo + (hi - lo) * i / slices;
      const p1 = lo + (hi - lo) * (i + 1) / slices;

      const p = (p0 + p1) / 2;
      const h = posteriorCurve(p) * (AY1 - AY0);

      const strip = new M.Rectangle({
        width: X(p1) - X(p0) + 0.003,
        height: h,
        color: POST,
        strokeWidth: 0
      });

      strip.setFill(POST, 0.12);
      strip.moveTo([
        X(p),
        AY0 + h / 2,
        0
      ]);

      objects.push(strip);
    }

    const y = Y(height);

    objects.push(
      dashed(
        [X(lo), AY0, 0],
        [X(lo), y, 0],
        C.cyan
      ),
      dashed(
        [X(hi), AY0, 0],
        [X(hi), y, 0],
        C.cyan
      ),
      line(
        [X(lo), y, 0],
        [X(hi), y, 0],
        C.cyan,
        2.8
      )
    );

    // Arrowheads mark the horizontal width.

    const ar = 0.10;

    objects.push(
      line(
        [X(lo), y, 0],
        [X(lo) + ar, y + ar * 0.7, 0],
        C.cyan,
        2
      ),
      line(
        [X(lo), y, 0],
        [X(lo) + ar, y - ar * 0.7, 0],
        C.cyan,
        2
      ),
      line(
        [X(hi), y, 0],
        [X(hi) - ar, y + ar * 0.7, 0],
        C.cyan,
        2
      ),
      line(
        [X(hi), y, 0],
        [X(hi) - ar, y - ar * 0.7, 0],
        C.cyan,
        2
      )
    );

    const label = T(
      'spread',
      P ? 16 : 15,
      C.cyan
    );

    label.moveTo([
      X(hi) + 0.18 + label.getWidth() / 2,
      y,
      0
    ]);

    objects.push(label);

    return new M.VGroup(...objects);
  }

  await until(S(49));
  await play(
    ...put('width', widthPicture()),
    ...say('CURVE WIDTH SHOWS REMAINING UNCERTAINTY', C.cyan),
    ...fbox([
      ['peak  → one estimate', POST],
      ['width → uncertainty', C.cyan],
      '',
      'nearby chances',
      'remain plausible'
    ])
  );

  // 50. Final recap.

  await until(S(50));
  await play(
    new M.Indicate(
      visible.marker,
      { color: POST }
    ),
    ...say('MAP PICKS THE TOP OF THE POSTERIOR', POST),
    ...fbox([
      ['earlier experience', PRIOR],
      ['× real record fit', LIKE],
      ['→ posterior curve', POST],
      '',
      ['MAP = 0.20', POST],
      ['one miss in five', POST]
    ], POST)
  );

  await until(E(50));
}

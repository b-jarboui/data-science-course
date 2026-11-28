// lesson 6.1.7
// Maximum likelihood: finding the centre that best explains the data.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied manim-web engine API.
// Browser playback and device layouts have not been runtime-tested.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const DATA = [499, 500, 502, 503];
  const LEAK = [499, 500, 502, 487];

  const SD = 2;
  const DIAL = 500;
  const SUM = 2004;
  const COUNT = 4;
  const MEAN = 501;

  // Laptop: two aligned plots on the left, formula box on the right.
  // Phone: vertically stacked plots, formula box below.

  const CX = P ? 0 : -2.6;
  const W = P ? FW - 1.3 : 7.2;
  const X0 = CX - W / 2;

  const BASE = P ? 0.90 : -0.15;
  const H = P ? 1.90 : 1.18;
  const TOP = BASE + H;

  const SCORE_BASE = P ? -2.45 : -2.65;
  const SCORE_H = P ? 1.95 : 1.45;
  const SCORE_MAX = 0.32;

  const PILL = P ? [0, 3.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.12, 0] : [4.3, -0.3, 0];

  const LOWER_TOP = P ? 0.05 : -0.92;
  const LOWER_BOTTOM = P ? -2.65 : -3.0;
  const LOWER_MID = (LOWER_TOP + LOWER_BOTTOM) / 2;

  const pt = (x, y) => [x, y, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const mapFor = (lo, hi) =>
    v => X0 + (v - lo) / (hi - lo) * W;

  let lo = 495;
  let hi = 507;
  let n2x = mapFor(lo, hi);

  const scoreX = mapFor(495, 507);

  const height = (v, m) =>
    Math.exp(-Math.pow(v - m, 2) / (2 * SD * SD));

  const likelihood = (m, data = DATA) =>
    data.reduce((p, v) => p * height(v, m), 1);

  const squaredTotal = (m, data = DATA) =>
    data.reduce((s, v) => s + Math.pow(v - m, 2), 0);

  const distances = (m, data = DATA) =>
    data.map(v => Math.abs(v - m));

  const hy = (v, m) => BASE + H * height(v, m);

  const sy = m =>
    SCORE_BASE + SCORE_H * likelihood(m) / SCORE_MAX;

  const htext = (v, m) =>
    v === m ? '1' : height(v, m).toFixed(2);

  const scoreText = m => likelihood(m).toFixed(2);

  const centreText = m =>
    Number(m.toFixed(1)).toString();

  function txt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function dot(p, radius = 0.09, color = C.cyan) {
    return new M.Dot({
      point: p,
      radius,
      color
    });
  }

  function block(w, h, p, color, opacity = 0.82) {
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

  function outline(w, h, p, color = C.cyan) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.moveTo(p);

    return r;
  }

  function tag(s, color, p, size = 17) {
    const g = pill(s, color, size);
    g.moveTo(p);
    return g;
  }

  // Formula box: same construction as the approved reference.
  // Leading spaces indent monospaced formula lines.

  let boxNow = null;

  function replaceBox(g) {
    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;
    return a;
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const s = rows[i][0];
      const ind = s.length - s.trimStart().length;

      return t.getWidth() + cw * ind;
    });

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
      const s = rows[i][0];
      const ind = cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.1;
    const maxh = P ? 2.35 : 3.9;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);

    return replaceBox(g);
  }

  // Upper plot: observed fills on a fixed horizontal number line.

  function makeAxis(map, low, high, expanded = false) {
    const parts = [];

    parts.push(
      line(
        pt(map(low), BASE),
        pt(map(high), BASE),
        C.muted,
        3
      )
    );

    const labelled = expanded
      ? [485, 490, 495, 505, 507]
      : [495, 497, 501, 505, 507];

    for (let v = low; v <= high; v++) {
      const major = labelled.includes(v);

      parts.push(
        line(
          pt(map(v), BASE - (major ? 0.08 : 0.04)),
          pt(map(v), BASE + (major ? 0.08 : 0.04)),
          C.muted,
          major ? 2 : 1
        )
      );

      if (major) {
        parts.push(
          txt(
            String(v),
            P ? 16 : 16,
            C.muted,
            pt(map(v), BASE - 0.28),
            true
          )
        );
      }
    }

    parts.push(
      txt(
        'ml',
        15,
        C.muted,
        pt(map(high), BASE - 0.56)
      )
    );

    return new M.VGroup(...parts);
  }

  function dataDot(v, map = n2x, color = C.cyan, stagger = 0) {
    const p = pt(map(v), BASE);

    const halo = dot(p, 0.16, color);
    halo.setFill(color, 0.17);

    const d = dot(p, 0.085, color);

    const label = txt(
      String(v),
      P ? 16 : 17,
      color,
      pt(map(v), BASE - 0.29 - stagger),
      true
    );

    return new M.VGroup(halo, d, label);
  }

  let axis = makeAxis(n2x, lo, hi);

  let dataGroups = DATA.map(v =>
    dataDot(v)
  );

  const observedDots = () =>
    dataGroups.map(g => g.submobjects[1]);

  let dialMark = new M.VGroup(
    line(
      pt(n2x(DIAL), BASE - 0.08),
      pt(n2x(DIAL), BASE - 0.16),
      C.muted,
      2
    ),
    txt(
      'dial',
      15,
      C.muted,
      pt(n2x(DIAL), BASE - 0.54)
    )
  );

  // The bell uses peak-scaled normal heights.
  // With SD fixed, this is proportional to the normal density.
  // Products therefore give the same maximum-likelihood centre.

  function bellAt(m, color = C.ink) {
    const N = 80;
    const segments = [];

    for (let k = 0; k < N; k++) {
      const a = lo + (hi - lo) * k / N;
      const b = lo + (hi - lo) * (k + 1) / N;

      segments.push(
        line(
          pt(n2x(a), hy(a, m)),
          pt(n2x(b), hy(b, m)),
          color,
          3
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function peakAt(m, color = C.amber, label = null) {
    const guide = dashed(
      pt(n2x(m), BASE + 0.11),
      pt(n2x(m), TOP),
      color
    );

    const topDot = dot(
      pt(n2x(m), TOP),
      0.06,
      color
    );

    const name = tag(
      label || `centre: ${centreText(m)}`,
      color,
      pt(n2x(m), TOP + 0.3),
      P ? 16 : 16
    );

    return new M.VGroup(guide, topDot, name);
  }

  let centre = 500;
  let bell = bellAt(centre);
  let peak = peakAt(centre);

  function slideTo(m, runTime = 1.1, color = C.amber, label = null) {
    centre = m;

    return [
      new M.Transform(
        bell,
        bellAt(m),
        { runTime }
      ),

      new M.Transform(
        peak,
        peakAt(m, color, label),
        { runTime }
      )
    ];
  }

  // Vertical bell-height readings above the observed fills.

  let readings = [];

  function reading(v, m, color = C.amber) {
    const x = n2x(v);
    const y = hy(v, m);

    const stem = dashed(
      pt(x, BASE + 0.08),
      pt(x, y),
      color
    );

    const cap = line(
      pt(x - 0.075, y),
      pt(x + 0.075, y),
      color,
      3
    );

    const label = T(htext(v, m), P ? 16 : 16, color, true);
    const off = 0.11 + label.getWidth() / 2;
    if (v === m) label.moveTo(pt(x, y + 0.2));
    else label.moveTo(pt(x + (v < m ? -off : off), y + 0.12));

    return new M.VGroup(stem, cap, label);
  }

  function showReadings(m) {
    readings = DATA.map(v => reading(v, m));

    return [
      new M.LaggedStart(
        readings.map(g => new M.FadeIn(g)),
        { lagRatio: 0.16, runTime: 1.4 }
      )
    ];
  }

  function clearReadings() {
    const a = readings.map(g => new M.FadeOut(g));
    readings = [];
    return a;
  }

  // Lower plot: likelihood as a function of the candidate centre.

  function makeScoreAxes() {
    const left = scoreX(495);
    const parts = [
      line(
        pt(left, SCORE_BASE),
        pt(scoreX(507), SCORE_BASE),
        C.muted,
        2
      ),

      line(
        pt(left, SCORE_BASE),
        pt(left, SCORE_BASE + SCORE_H),
        C.muted,
        2
      )
    ];

    [495, 497, 499, 501, 503, 505, 507].forEach(v => {
      parts.push(
        line(
          pt(scoreX(v), SCORE_BASE - 0.06),
          pt(scoreX(v), SCORE_BASE + 0.06),
          C.muted,
          1
        ),

        txt(
          String(v),
          P ? 16 : 16,
          C.muted,
          pt(scoreX(v), SCORE_BASE - 0.27),
          true
        )
      );
    });

    [0, 0.1, 0.2, 0.3].forEach(v => {
      const y = SCORE_BASE + SCORE_H * v / SCORE_MAX;

      parts.push(
        line(
          pt(left - 0.05, y),
          pt(left + 0.05, y),
          C.muted,
          1
        ),

        txt(
          v === 0 ? '0' : v.toFixed(1),
          15,
          C.muted,
          pt(left - 0.3, y),
          true
        )
      );
    });

    parts.push(
      txt(
        'likelihood',
        P ? 16 : 15,
        C.green,
        pt(left + 0.73, SCORE_BASE + SCORE_H + 0.16)
      ),

      txt(
        'centre (ml)',
        15,
        C.muted,
        pt(scoreX(507) - 0.65, SCORE_BASE - 0.52)
      )
    );

    return new M.VGroup(...parts);
  }

  function curvePiece(a, b, n = 12, color = C.green) {
    const parts = [];

    for (let k = 0; k < n; k++) {
      const u = a + (b - a) * k / n;
      const v = a + (b - a) * (k + 1) / n;

      parts.push(
        line(
          pt(scoreX(u), sy(u)),
          pt(scoreX(v), sy(v)),
          color,
          3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function scoreCursor(m, color = C.amber) {
    const p = pt(scoreX(m), sy(m));

    const halo = dot(p, 0.16, color);
    halo.setFill(color, 0.18);

    const d = dot(p, 0.075, color);

    return new M.VGroup(halo, d);
  }

  let scoreAxes = null;
  let curveParts = [];
  let scoreMarks = [];
  let cursor = null;
  let maximumGuide = null;
  let maximumTag = null;

  // Progressively move the upper bell and lower score cursor.
  // Each step is awaited; play() calls never overlap.

  async function sweepTo(target, duration, steps = 5, draw = true) {
    const start = centre;
    const dt = duration / steps;

    for (let k = 1; k <= steps; k++) {
      const previous = centre;
      const next = start + (target - start) * k / steps;

      const a = slideTo(next, dt);

      if (cursor) {
        a.push(
          new M.Transform(
            cursor,
            scoreCursor(next),
            { runTime: dt }
          )
        );
      }

      if (draw && Math.abs(next - previous) > 0.00001) {
        const piece = curvePiece(previous, next, 8);
        curveParts.push(piece);

        a.push(
          new M.FadeIn(piece, { runTime: dt })
        );
      }

      await play(...a);
    }
  }

  function markScore(m, color = C.green) {
    const p = pt(scoreX(m), sy(m));

    const d = dot(p, 0.075, color);

    // value beside the point, on the outer side of the hill (the curve is lower there); above the top itself
    const value = T(scoreText(m), P ? 16 : 17, color, true);
    const off = 0.14 + value.getWidth() / 2;
    if (m < MEAN) value.moveTo(pt(p[0] - off, p[1] + 0.14));
    else if (m > MEAN) value.moveTo(pt(p[0] + off, p[1] + 0.14));
    else value.moveTo(pt(p[0], p[1] + 0.24));

    const g = new M.VGroup(d, value);
    scoreMarks.push(g);

    return [
      new M.FadeIn(g),
      new M.Flash(d, { color })
    ];
  }

  function clearScorePlot() {
    const a = [];

    if (scoreAxes) {
      a.push(new M.FadeOut(scoreAxes));
    }

    if (cursor) {
      a.push(new M.FadeOut(cursor));
    }

    if (maximumGuide) {
      a.push(new M.FadeOut(maximumGuide));
    }

    if (maximumTag) {
      a.push(new M.FadeOut(maximumTag));
    }

    curveParts.forEach(g => {
      a.push(new M.FadeOut(g));
    });

    scoreMarks.forEach(g => {
      a.push(new M.FadeOut(g));
    });

    scoreAxes = null;
    cursor = null;
    maximumGuide = null;
    maximumTag = null;

    curveParts = [];
    scoreMarks = [];

    return a;
  }

  // Other lower-panel pictures replace the likelihood curve
  // when we turn to squared distances and the balance point.

  let lowerNow = null;

  function lower(g) {
    const a = [new M.FadeIn(g)];

    if (lowerNow) {
      a.push(new M.FadeOut(lowerNow));
    }

    lowerNow = g;
    return a;
  }

  function clearLower() {
    if (!lowerNow) return [];

    const a = [new M.FadeOut(lowerNow)];
    lowerNow = null;

    return a;
  }

  // ============================================================
  // 0-5: recap Monday's four fills and their likelihood scores.
  // ============================================================

  // 0: Monday's four bottles.
  // These observations remain fixed until the explicit leak example.

  await until(S(0));
  await play(
    new M.FadeIn(axis),
    new M.FadeIn(dialMark),

    new M.LaggedStart(
      dataGroups.map(g => new M.FadeIn(g)),
      { lagRatio: 0.45, runTime: 3.2 }
    ),

    ...say('MONDAY: THE SAME 4 FILLS')
  );

  // 1: recall the previous lesson's scores.

  await until(S(1));
  await play(
    new M.FadeIn(bell),
    new M.FadeIn(peak),

    ...fbox([
      ['LAST LESSON', C.violet],
      'try a centre',
      'read the bell',
      ['give it a score', C.green]
    ], C.violet),

    ...say('EACH CENTRE GETS A LIKELIHOOD')
  );

  // 2: multiply the four relative bell heights.

  await until(S(2));
  await play(
    ...showReadings(500),

    ...fbox([
      ['CENTRE = 500', C.amber],
      '0.88 × 1',
      '     × 0.61 × 0.32',
      ['score ≈ 0.17', C.green]
    ], C.green),

    ...say('MULTIPLY THE FOUR HEIGHTS', C.green)
  );

  // 3: compare centres 500 and 501.

  await until(S(3));
  await play(
    ...fbox([
      ['CANDIDATE   SCORE', C.muted],
      ['500          0.17', C.amber],
      ['501            ?', C.muted]
    ], C.cyan),

    ...say('500 SCORES 0.17', C.amber)
  );

  await until(S(3) + 2.8);
  await play(
    ...clearReadings(),
    ...slideTo(501, 1.0),

    ...fbox([
      ['CANDIDATE   SCORE', C.muted],
      ['500          0.17', C.amber],
      ['501          0.29', C.green]
    ], C.green),

    ...say('501 SCORES 0.29', C.green)
  );

  // 4: candidate 499 scores poorly.

  await until(S(4));
  await play(
    ...slideTo(499, 1.1),

    ...fbox([
      ['CANDIDATE   SCORE', C.muted],
      ['499          0.04', C.violet],
      ['500          0.17', C.amber],
      ['501          0.29', C.green]
    ], C.cyan),

    ...say('499 SCORES ONLY 0.04', C.violet)
  );

  // 5: seek the best of every possible candidate.

  await until(S(5));
  await play(
    ...fbox([
      ['TODAY', C.green],
      'not just three',
      'candidate centres',
      ['find the highest', C.amber],
      ['possible score', C.amber]
    ], C.green),

    ...say('WHERE IS THE HIGHEST SCORE?', C.green)
  );

  // ============================================================
  // 6-15: slide the bell and trace the likelihood curve.
  // ============================================================

  // 6: begin the left-to-right sweep.
  // Return to the left edge before drawing the curve.

  await until(S(6));
  await play(
    ...slideTo(495, 1.5),

    ...fbox([
      ['SLIDE THE BELL', C.amber],
      'same four dots',
      'same spread',
      ['centre changes', C.amber]
    ], C.amber),

    ...say('FIXED DATA · SLIDING BELL', C.amber)
  );

  // 7: introduce the lower likelihood plot.
  // Its horizontal scale is aligned with the upper ml scale.

  scoreAxes = makeScoreAxes();
  cursor = scoreCursor(495);

  await until(S(7));
  await play(
    new M.FadeIn(scoreAxes),
    new M.FadeIn(cursor),

    ...fbox([
      ['LIKELIHOOD CURVE', C.green],
      'one score for',
      'every position',
      'of the bell'
    ], C.green),

    ...say('BELOW: THE LIKELIHOOD CURVE', C.green)
  );

  await sweepTo(498.5, 3.0, 7, true);

  // 8: 499 -> approximately 0.04.

  await until(S(8));
  await sweepTo(499, 0.8, 3, true);

  await play(
    ...markScore(499, C.violet),

    ...fbox([
      ['CENTRE = 499', C.amber],
      '0.88 × 1',
      '     × 0.32 × 0.14',
      ['score ≈ 0.04', C.violet]
    ], C.violet),

    ...say('499 → 0.04', C.violet)
  );

  // 9: 500 -> approximately 0.17.

  await until(S(9));
  await sweepTo(500, 1.0, 4, true);

  await play(
    ...markScore(500, C.amber),

    ...fbox([
      ['CENTRE = 500', C.amber],
      '0.88 × 1',
      '     × 0.61 × 0.32',
      ['score ≈ 0.17', C.amber]
    ], C.amber),

    ...say('500 → 0.17', C.amber)
  );

  // 10: 501 -> approximately 0.29.

  await until(S(10));
  await sweepTo(501, 1.25, 5, true);

  await play(
    ...markScore(501, C.green),

    ...fbox([
      ['CENTRE = 501', C.amber],
      '0.61 × 0.88',
      '     × 0.88 × 0.61',
      ['score ≈ 0.29', C.green]
    ], C.green),

    ...say('501 → 0.29', C.green)
  );

  // 11: 502 -> approximately 0.17.

  await until(S(11));
  await sweepTo(502, 1.0, 4, true);

  await play(
    ...markScore(502, C.amber),

    ...fbox([
      ['CENTRE = 502', C.amber],
      '0.32 × 0.61',
      '     × 1 × 0.88',
      ['score ≈ 0.17', C.amber]
    ], C.amber),

    ...say('502 → 0.17', C.amber)
  );

  // 12: 503 -> approximately 0.04.

  await until(S(12));
  await sweepTo(503, 1.0, 4, true);

  await play(
    ...markScore(503, C.violet),

    ...fbox([
      ['CENTRE = 503', C.amber],
      '0.14 × 0.32',
      '     × 0.88 × 1',
      ['score ≈ 0.04', C.violet]
    ], C.violet),

    ...say('503 → 0.04', C.violet)
  );

  // 13: complete the hill and return to its peak.

  await until(S(13));

  // Complete the nearly flat right tail.

  await sweepTo(507, 1.0, 4, true);

  maximumGuide = dashed(
    pt(scoreX(MEAN), SCORE_BASE),
    pt(scoreX(MEAN), sy(MEAN)),
    C.amber
  );

  await play(
    ...slideTo(MEAN, 0.9, C.green),

    new M.Transform(
      cursor,
      scoreCursor(MEAN, C.green),
      { runTime: 0.9 }
    ),

    new M.Create(maximumGuide),

    ...fbox([
      ['THE LIKELIHOOD HILL', C.green],
      ['highest centre = 501', C.amber],
      'highest score',
      ['≈ 0.29', C.green]
    ], C.green),

    ...say('THE HILL PEAKS AT 501 ml', C.green)
  );

  // 14: name the maximum likelihood estimate.

  maximumTag = tag(
    'MAXIMUM',
    C.green,
    pt(
      scoreX(MEAN) + (P ? 1.22 : 1.40),
      sy(MEAN) + 0.15
    ),
    P ? 14 : 15
  );

  await until(S(14));
  await play(
    new M.FadeIn(maximumTag),
    new M.Flash(cursor.submobjects[1], { color: C.green }),

    ...fbox([
      ['MAXIMUM LIKELIHOOD', C.green],
      ['ESTIMATE', C.green],
      'candidate at the top',
      ['= 501 ml', C.amber]
    ], C.green),

    ...say('MAXIMUM LIKELIHOOD ESTIMATE', C.green)
  );

  // 15: maximum means highest.

  await until(S(15));
  await play(
    new M.Indicate(maximumTag, { color: C.green }),
    new M.Indicate(peak, { color: C.amber }),

    ...fbox([
      ['MAXIMUM = HIGHEST', C.green],
      'best explanation',
      'under our model',
      ['501 ml', C.amber]
    ], C.green),

    ...say('BEST EXPLAINS THE OBSERVED DATA', C.green)
  );

  // ============================================================
  // 16-19: compare the maximum with the sample mean.
  // ============================================================

  // 16: sum the actual observations.

  await until(S(16));
  await play(
    new M.LaggedStart(
      observedDots().map(d =>
        new M.Flash(d, { color: C.cyan })
      ),
      { lagRatio: 0.16, runTime: 1.6 }
    ),

    ...fbox([
      ['SUM OF THE FILLS', C.cyan],
      '499 + 500',
      '    + 502 + 503',
      ['= 2,004 ml', C.amber]
    ], C.cyan),

    ...say('ADD THE FOUR OBSERVED FILLS')
  );

  // 17: share the total among four bottles.

  await until(S(17));
  await play(
    ...fbox([
      ['SAMPLE MEAN', C.cyan],
      'sum   = 2,004',
      'count = 4',
      ['2,004 ÷ 4 = 501', C.cyan]
    ], C.cyan),

    ...say('SAMPLE MEAN = 501 ml')
  );

  // 18: both methods give the same centre.

  await until(S(18));
  await play(
    new M.Indicate(peak, { color: C.amber }),
    new M.Indicate(cursor, { color: C.green }),

    ...fbox([
      ['TWO ANSWERS', C.muted],
      ['sample mean = 501', C.cyan],
      ['best centre = 501', C.green],
      ['exactly the same!', C.amber]
    ], C.green),

    ...say('THE SAME NUMBER: 501', C.amber)
  );

  // 19: prepare the visual explanation.

  await until(S(19));
  await play(
    ...say('WHY DO THEY AGREE?', C.violet)
  );

  // ============================================================
  // 20-29: why squared distances determine the likelihood.
  // ============================================================

  // 20: bell heights fall as the distance from the centre grows.

  const nearGuide = dashed(
    pt(n2x(501.4), BASE + 0.08),
    pt(n2x(501.4), hy(501.4, 501)),
    C.green
  );

  const farGuide = dashed(
    pt(n2x(505), BASE + 0.08),
    pt(n2x(505), hy(505, 501)),
    C.violet
  );

  const nearLabel = txt(
    'near',
    15,
    C.green,
    pt(n2x(501.4) + 0.27, hy(501.4, 501) - 0.26)
  );

  const farLabel = txt(
    'far',
    15,
    C.violet,
    pt(n2x(505), hy(505, 501) + 0.25)
  );

  const closeness = new M.VGroup(
    nearGuide,
    farGuide,
    nearLabel,
    farLabel
  );

  await until(S(20));
  await play(
    new M.FadeIn(closeness),

    ...fbox([
      ['NEAR THE CENTRE', C.green],
      'tall bell',
      ['FAR FROM CENTRE', C.violet],
      'low bell'
    ], C.violet),

    ...say('NEARER → TALLER BELL', C.green)
  );

  // 21: a candidate should fit all four dots together.

  await until(S(21));
  await play(
    new M.FadeOut(closeness),

    ...showReadings(501),

    ...fbox([
      ['FIT ALL FOUR', C.green],
      'not just one dot',
      'a high score needs',
      ['good overall fit', C.amber]
    ], C.green),

    ...say('KEEP ALL THE DOTS CLOSE', C.green)
  );

  // Squared-distance picture.
  // A distance d is first a row of d blocks.
  // Its square is a d-by-d square containing d² blocks.

  function distancePanel(m, squared = false, totalColor = C.amber) {
    const ds = distances(m);
    const sum = squaredTotal(m);

    const spacing = W / 4;
    const cell = P ? 0.34 : 0.3;

    const floorY = LOWER_BOTTOM + 0.73;
    const titleY = LOWER_TOP - 0.07;

    const parts = [
      txt(
        squared
          ? `Squared distances from ${centreText(m)}`
          : `Distances from ${centreText(m)}`,
        P ? 19 : 18,
        C.violet,
        pt(CX, titleY)
      )
    ];

    ds.forEach((d, k) => {
      const x = CX + (k - 1.5) * spacing;
      const rows = squared ? d : Math.min(d, 1);
      const cols = d;

      if (d === 0) {
        parts.push(
          txt(
            '0',
            23,
            C.muted,
            pt(x, floorY + 0.18),
            true
          )
        );
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const xx = x + (c - (cols - 1) / 2) * cell;
          const yy = floorY + (r + 0.5) * cell;

          parts.push(
            block(
              cell * 0.85,
              cell * 0.85,
              pt(xx, yy),
              C.violet,
              0.82
            )
          );
        }
      }

      parts.push(
        txt(
          squared ? String(d * d) : `${d} ml`,
          P ? 19 : 19,
          C.amber,
          pt(x, floorY - 0.2),
          true
        ),

        txt(
          String(DATA[k]),
          P ? 17 : 17,
          C.cyan,
          pt(x, floorY - 0.5),
          true
        )
      );
    });

    if (squared) {
      parts.push(
        txt(
          `${ds.map(d => d * d).join(' + ')} = ${sum}`,
          P ? 20 : 18,
          totalColor,
          pt(CX, LOWER_BOTTOM + 0.01),
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // A generic picture of squaring: two blocks become a 2×2 square.

  function squareExample() {
    const cell = P ? 0.37 : 0.32;
    const y = LOWER_MID + 0.10;

    const left = CX - 1.65;
    const right = CX + 1.65;

    const parts = [];

    for (let k = 0; k < 2; k++) {
      parts.push(
        block(
          cell * 0.86,
          cell * 0.86,
          pt(left + (k - 0.5) * cell, y),
          C.violet
        )
      );
    }

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        parts.push(
          block(
            cell * 0.86,
            cell * 0.86,
            pt(
              right + (c - 0.5) * cell,
              y + (r - 0.5) * cell
            ),
            C.violet
          )
        );
      }
    }

    parts.push(
      txt(
        'distance',
        17,
        C.muted,
        pt(left, y - 0.63)
      ),

      txt(
        '2',
        21,
        C.amber,
        pt(left, y + 0.66),
        true
      ),

      txt(
        'square it',
        17,
        C.muted,
        pt(right, y - 0.63)
      ),

      txt(
        '2 × 2 = 4',
        20,
        C.amber,
        pt(right, y + 0.66),
        true
      ),

      txt(
        '→',
        30,
        C.amber,
        pt(CX, y)
      )
    );

    return new M.VGroup(...parts);
  }

  // 22: introduce the squared-distance total.
  // Replace the lower curve with a simple picture before arithmetic.

  await until(S(22));
  await play(
    ...clearScorePlot(),
    ...clearReadings(),
    ...lower(squareExample()),

    ...fbox([
      ['MEASURE CLOSENESS', C.violet],
      '1. find each distance',
      '2. square it',
      '3. add the squares'
    ], C.violet),

    ...say('DISTANCE → SQUARE → ADD', C.violet)
  );

  // 23: distances from 501 are 2, 1, 1, 2.

  await until(S(23));
  await play(
    ...lower(distancePanel(501, false)),

    ...fbox([
      ['CENTRE = 501', C.amber],
      '499 → 2 ml',
      '500 → 1 ml',
      '502 → 1 ml',
      '503 → 2 ml'
    ], C.violet),

    ...say('DISTANCES: 2, 1, 1, 2', C.violet)
  );

  // 24: square the distances and add them.
  // Four squares contain 4, 1, 1, 4 blocks.

  await until(S(24));
  await play(
    ...lower(distancePanel(501, true, C.green)),

    ...fbox([
      ['SQUARE EACH GAP', C.violet],
      '2² + 1² + 1² + 2²',
      '4  + 1  + 1  + 4',
      ['total = 10', C.green]
    ], C.green),

    ...say('SQUARED DISTANCE TOTAL = 10', C.green)
  );

  // 25: try centre 499.

  await until(S(25));
  await play(
    ...slideTo(499, 1.2),
    ...lower(distancePanel(499, true)),

    ...fbox([
      ['CENTRE = 499', C.amber],
      '0² + 1² + 3² + 4²',
      '0  + 1  + 9  + 16',
      ['total = 26', C.amber]
    ], C.amber),

    ...say('499: SQUARED TOTAL = 26', C.amber)
  );

  // 26: compare the other three centres in narration order.

  await until(S(26));
  await play(
    ...slideTo(500, 0.8),
    ...lower(distancePanel(500, true)),

    ...fbox([
      ['CENTRE = 500', C.amber],
      '1² + 0² + 2² + 3²',
      '1  + 0  + 4  + 9',
      ['total = 14', C.amber]
    ], C.amber),

    ...say('500: TOTAL = 14', C.amber)
  );

  await until(S(26) + 2.1);
  await play(
    ...slideTo(502, 0.8),
    ...lower(distancePanel(502, true)),

    ...fbox([
      ['CENTRE = 502', C.amber],
      '3² + 2² + 0² + 1²',
      '9  + 4  + 0  + 1',
      ['total = 14', C.amber]
    ], C.amber),

    ...say('502: TOTAL = 14', C.amber)
  );

  await until(S(26) + 4.2);
  await play(
    ...slideTo(503, 0.8),
    ...lower(distancePanel(503, true)),

    ...fbox([
      ['CENTRE = 503', C.amber],
      '4² + 3² + 1² + 0²',
      '16 + 9  + 1  + 0',
      ['total = 26', C.amber]
    ], C.amber),

    ...say('503: TOTAL = 26', C.amber)
  );

  // A paired bar display compares squared-distance totals.
  // Short bars mean the four dots are collectively closer.

  function totalsPanel() {
    const vals = [499, 500, 501, 502, 503];

    const spacing = W / 5;
    const base = LOWER_BOTTOM + 0.45;
    const maxH = P ? 1.47 : 1.20;
    const bw = P ? 0.62 : 0.64;

    const parts = [
      line(
        pt(X0 + 0.15, base),
        pt(X0 + W - 0.15, base),
        C.muted,
        2
      ),

      txt(
        'Total squared distance',
        P ? 18 : 17,
        C.violet,
        pt(CX, LOWER_TOP - 0.07)
      )
    ];

    vals.forEach((m, k) => {
      const v = squaredTotal(m);
      const h = maxH * v / 26;
      const x = CX + (k - 2) * spacing;

      const color = m === MEAN
        ? C.green
        : C.violet;

      parts.push(
        block(
          bw,
          h,
          pt(x, base + h / 2),
          color,
          0.80
        ),

        txt(
          String(v),
          18,
          color,
          pt(x, base + h + 0.19),
          true
        ),

        txt(
          String(m),
          P ? 15 : 15,
          color,
          pt(x, base - 0.25),
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // 27: the smallest squared total occurs at 501.

  await until(S(27));
  await play(
    ...slideTo(501, 1.1, C.green),
    ...lower(totalsPanel()),

    ...fbox([
      ['CENTRE   TOTAL', C.muted],
      '499       26',
      '500       14',
      ['501       10', C.green],
      '502       14',
      '503       26'
    ], C.green),

    ...say('SMALLEST TOTAL: 10 AT 501', C.green)
  );

  // 28: compare smaller squared distance with larger likelihood.
  // Mathematically, with SD = 2:
  // product of peak-scaled heights = exp(-squaredTotal / 8).

  function pairedPanel() {
    const vals = [499, 500, 501, 502, 503];

    const spacing = W / 5;
    const bw = P ? 0.40 : 0.42;

    const y0 = LOWER_BOTTOM + 0.44;
    const maxH = P ? 1.32 : 1.05;

    const parts = [
      txt(
        'Squared distance',
        P ? 16 : 15,
        C.violet,
        pt(CX - 1.30, LOWER_TOP - 0.07)
      ),

      txt(
        'Likelihood',
        P ? 16 : 15,
        C.green,
        pt(CX + 1.55, LOWER_TOP - 0.07)
      ),

      line(
        pt(X0 + 0.10, y0),
        pt(X0 + W - 0.10, y0),
        C.muted,
        2
      )
    ];

    vals.forEach((m, k) => {
      const x = CX + (k - 2) * spacing;
      const total = squaredTotal(m);
      const score = likelihood(m);

      const a = maxH * total / 26;
      const b = maxH * score / likelihood(501);

      parts.push(
        block(
          bw,
          a,
          pt(x - bw * 0.58, y0 + a / 2),
          C.violet
        ),

        block(
          bw,
          b,
          pt(x + bw * 0.58, y0 + b / 2),
          C.green
        ),

        txt(
          String(total),
          15,
          C.violet,
          pt(x - bw * 0.58, y0 + a + 0.16),
          true
        ),

        txt(
          score.toFixed(2),
          15,
          C.green,
          pt(x + bw * 0.58, y0 + b + 0.16),
          true
        ),

        txt(
          String(m),
          P ? 15 : 15,
          m === 501 ? C.amber : C.muted,
          pt(x, y0 - 0.25),
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  await until(S(28));
  await play(
    ...lower(pairedPanel()),

    ...fbox([
      ['SAME CONNECTION', C.green],
      ['smaller total', C.violet],
      '      ↓',
      ['higher likelihood', C.green],
      '10  → 0.29',
      '26  → 0.04'
    ], C.green),

    ...say('LESS SQUARED DISTANCE → MORE LIKELIHOOD', C.green)
  );

  // 29: the mean is the balance point.
  // A separate lower illustration uses the same horizontal scale.
  // The actual data dots in the upper plot remain untouched.

  function balancePanel() {
    const map = scoreX;
    const beamY = LOWER_MID - 0.12;
    const pivotX = map(MEAN);

    const beam = line(
      pt(map(497.8), beamY),
      pt(map(504.2), beamY),
      C.ink,
      5
    );

    const pivot = new M.VGroup(
      line(
        pt(pivotX, beamY - 0.02),
        pt(pivotX - 0.39, beamY - 0.56),
        C.amber,
        3
      ),

      line(
        pt(pivotX, beamY - 0.02),
        pt(pivotX + 0.39, beamY - 0.56),
        C.amber,
        3
      ),

      line(
        pt(pivotX - 0.39, beamY - 0.56),
        pt(pivotX + 0.39, beamY - 0.56),
        C.amber,
        3
      )
    );

    const weights = DATA.map(v =>
      block(
        P ? 0.32 : 0.34,
        0.36,
        pt(map(v), beamY + 0.20),
        C.cyan
      )
    );

    const labels = DATA.map(v =>
      txt(
        String(v),
        P ? 15 : 16,
        C.cyan,
        pt(map(v), beamY + 0.55),
        true
      )
    );

    const title = txt(
      'Equal weights balance at the mean',
      P ? 18 : 17,
      C.cyan,
      pt(CX, LOWER_TOP - 0.06)
    );

    const meanLabel = tag(
      '501',
      C.amber,
      pt(pivotX, beamY - 0.87),
      17
    );

    return new M.VGroup(
      beam,
      pivot,
      ...weights,
      ...labels,
      title,
      meanLabel
    );
  }

  await until(S(29));
  await play(
    ...lower(balancePanel()),

    ...fbox([
      ['THE BALANCE POINT', C.cyan],
      'the mean minimises',
      'the total of the',
      'squared distances',
      ['mean = 501', C.amber]
    ], C.cyan),

    ...say('THE MEAN IS THE BALANCE POINT')
  );

  // ============================================================
  // 30-32: the maximum likelihood formula for the normal mean.
  // ============================================================

  // 30: formula only after the visual explanation.

  await until(S(30));
  await play(
    ...fbox([
      ['NORMAL MODEL', C.violet],
      ['maximum likelihood', C.green],
      ['estimate of mean', C.green],
      '= sum ÷ count',
      '= 2,004 ÷ 4',
      ['= 501 ml', C.amber]
    ], C.green),

    ...say('BEST CENTRE = SUM ÷ COUNT', C.green)
  );

  // 31: say it in ordinary words.

  await until(S(31));
  await play(
    new M.Indicate(lowerNow, { color: C.cyan }),
    new M.Indicate(peak, { color: C.amber }),

    ...fbox([
      ['IN WORDS', C.green],
      'best bell centre',
      'is the plain average',
      'of the observed fills',
      ['501 ml', C.amber]
    ], C.green),

    ...say('BEST CENTRE = PLAIN AVERAGE', C.green)
  );

  // Two routes converge at the same result.
  // Cyan identifies recipe A, as in the shared chapter.

  function twoRoads() {
    const x1 = CX - W * 0.23;
    const x2 = CX + W * 0.23;

    const y1 = LOWER_TOP - 0.31;
    const y2 = LOWER_BOTTOM + 0.46;

    const a = tag(
      'RECIPE A',
      C.cyan,
      pt(x1, y1),
      P ? 16 : 16
    );

    const b = tag(
      'MAX LIKELIHOOD',
      C.green,
      pt(x2, y1),
      P ? 14 : 15
    );

    const aLabel = txt(
      'plain average',
      16,
      C.cyan,
      pt(x1, y1 - 0.39)
    );

    const bLabel = txt(
      'best bell centre',
      16,
      C.green,
      pt(x2, y1 - 0.39)
    );

    const pathA = line(
      pt(x1, y1 - 0.62),
      pt(CX - 0.18, y2 + 0.27),
      C.cyan,
      3
    );

    const pathB = line(
      pt(x2, y1 - 0.62),
      pt(CX + 0.18, y2 + 0.27),
      C.green,
      3
    );

    const result = tag(
      '501 ml',
      C.amber,
      pt(CX, y2),
      20
    );

    return new M.VGroup(
      a,
      b,
      aLabel,
      bLabel,
      pathA,
      pathB,
      result
    );
  }

  // 32: two roads lead to the same recipe.

  await until(S(32));
  await play(
    ...lower(twoRoads()),

    ...fbox([
      ['RECIPE A', C.cyan],
      'plain sample average',
      ['MAXIMUM LIKELIHOOD', C.green],
      'best model centre',
      ['both = 501 ml', C.amber]
    ], C.green),

    ...say('TWO ROADS · ONE ANSWER', C.green)
  );

  // ============================================================
  // 33-35: maximum likelihood as a general estimation recipe.
  // ============================================================

  function recipePanel(active = 3) {
    const labels = [
      ['1', 'MODEL', C.violet],
      ['2', 'SCORE', C.amber],
      ['3', 'MAXIMUM', C.green]
    ];

    const parts = [];
    const spacing = W / 3;
    const y = LOWER_MID + 0.08;

    labels.forEach(([num, title, color], k) => {
      const x = CX + (k - 1) * spacing;

      const c = k < active
        ? color
        : C.muted;

      const circle = new M.Circle({
        radius: 0.25,
        color: c,
        strokeWidth: 2
      });

      circle.setFill(c, k < active ? 0.15 : 0.04);
      circle.moveTo(pt(x, y + 0.39));

      parts.push(
        circle,

        txt(
          num,
          19,
          c,
          pt(x, y + 0.39),
          true
        ),

        txt(
          title,
          P ? 18 : 18,
          c,
          pt(x, y - 0.1)
        )
      );

      if (k < 2) {
        parts.push(
          txt(
            '→',
            23,
            C.muted,
            pt(x + spacing / 2, y + 0.19)
          )
        );
      }
    });

    parts.push(
      txt(
        P ? 'model → score → top' : 'Choose a model, score candidates, find the top',
        18,
        C.muted,
        pt(CX, y - 0.69)
      )
    );

    return new M.VGroup(...parts);
  }

  // 33: general-purpose recipe for building estimators.

  await until(S(33));
  await play(
    ...lower(recipePanel(0)),

    ...fbox([
      ['WHAT IS IT FOR?', C.green],
      'a general recipe',
      'for building',
      ['estimators', C.green]
    ], C.green),

    ...say('A GENERAL WAY TO ESTIMATE', C.green)
  );

  // 34: model, likelihood, maximum.

  await until(S(34));
  await play(
    ...lower(recipePanel(1)),

    ...fbox([
      ['STEP 1', C.violet],
      'write a model',
      'of the data'
    ], C.violet),

    ...say('1. CHOOSE A MODEL', C.violet)
  );

  await until(S(34) + 2.1);
  await play(
    ...lower(recipePanel(2)),

    ...fbox([
      ['STEP 2', C.amber],
      'compute likelihood',
      'for candidate values'
    ], C.amber),

    ...say('2. SCORE THE CANDIDATES', C.amber)
  );

  await until(S(34) + 4.3);
  await play(
    ...lower(recipePanel(3)),

    ...fbox([
      ['STEP 3', C.green],
      'find the highest',
      'likelihood',
      ['means, chances, rates', C.green]
    ], C.green),

    ...say('3. FIND THE MAXIMUM', C.green)
  );

  // 35: a computer searches the likelihood hill.
  // Restore the same mathematical likelihood curve.

  scoreAxes = makeScoreAxes();

  const fullHill = curvePiece(
    495,
    507,
    112,
    C.green
  );

  curveParts = [fullHill];
  cursor = scoreCursor(498, C.amber);

  await until(S(35));
  await play(
    ...clearLower(),
    new M.FadeIn(scoreAxes),
    new M.FadeIn(fullHill),
    new M.FadeIn(cursor),

    ...slideTo(498, 0.9),

    ...fbox([
      ['MODEL FITTING', C.green],
      'a computer searches',
      'for the best score',
      ['climb the hill', C.amber]
    ], C.green),

    ...say('COMPUTERS SEARCH FOR THE TOP', C.green)
  );

  await sweepTo(501, 2.5, 8, false);

  await play(
    new M.Flash(cursor.submobjects[1], { color: C.green }),

    ...fbox([
      ['BEST SCORE FOUND', C.green],
      'candidate = 501',
      ['likelihood ≈ 0.29', C.green]
    ], C.green)
  );

  // ============================================================
  // 36-41: common trap — the result depends on the model.
  // ============================================================

  // 36: warn that the model itself may be wrong.

  await until(S(36));
  await play(
    ...clearScorePlot(),

    ...fbox([
      ['COMMON TRAP', C.amber],
      'a high likelihood',
      'is only meaningful',
      'under the model',
      ['check the model', C.amber]
    ], C.amber),

    ...say('ONLY AS GOOD AS THE MODEL', C.amber)
  );

  // 37: hypothetical leak.
  // Widen the number line first, while keeping all four values.
  // Then change only the reading of the bottle originally at 503.

  await until(S(37));

  const oldAxis = axis;
  const oldDial = dialMark;
  const oldBell = bell;
  const oldPeak = peak;
  const oldData = dataGroups.slice();

  lo = 485;
  hi = 507;
  n2x = mapFor(lo, hi);

  axis = makeAxis(n2x, lo, hi, true);

  dataGroups = DATA.map((v, k) =>
    dataDot(
      v,
      n2x,
      C.cyan,
      k % 2 === 1 ? 0.27 : 0
    )
  );

  bell = bellAt(501);
  peak = peakAt(501);

  dialMark = new M.VGroup(
    line(
      pt(n2x(500), BASE - 0.07),
      pt(n2x(500), BASE - 0.13),
      C.muted,
      2
    ),

    txt(
      'dial',
      15,
      C.muted,
      pt(n2x(500), BASE - 0.86)
    )
  );

  await play(
    new M.FadeOut(oldAxis),
    new M.FadeOut(oldDial),
    new M.FadeOut(oldBell),
    new M.FadeOut(oldPeak),

    ...oldData.map(g => new M.FadeOut(g)),

    new M.FadeIn(axis),
    new M.FadeIn(dialMark),
    new M.FadeIn(bell),
    new M.FadeIn(peak),

    ...dataGroups.map(g => new M.FadeIn(g)),

    ...fbox([
      ['IMAGINE A LEAK', C.amber],
      'original fill: 503',
      'widen the ml scale',
      'to see a low reading'
    ], C.amber),

    ...say('IMAGINE ONE BOTTLE LEAKED', C.amber)
  );

  // A movement guide identifies the hypothetical changed reading.
  // This is a new dataset, not movement of the original fixed data.

  const leakGuideY = BASE + 0.30;

  const leakGuide = new M.VGroup(
    dashed(
      pt(n2x(503), leakGuideY),
      pt(n2x(487), leakGuideY),
      C.amber
    ),

    line(
      pt(n2x(487), leakGuideY),
      pt(n2x(487) + 0.16, leakGuideY + 0.10),
      C.amber,
      2
    ),

    line(
      pt(n2x(487), leakGuideY),
      pt(n2x(487) + 0.16, leakGuideY - 0.10),
      C.amber,
      2
    ),

    txt(
      '503 → 487',
      18,
      C.amber,
      pt((n2x(503) + n2x(487)) / 2, leakGuideY + 0.22),
      true
    )
  );

  await until(S(37) + 2.0);
  await play(
    new M.FadeIn(leakGuide),

    new M.Transform(
      dataGroups[3],
      dataDot(487, n2x, C.amber),
      { runTime: 1.6, pathArc: -0.45 }
    ),

    ...fbox([
      ['ONE CHANGED READING', C.amber],
      'before = 503 ml',
      ['after  = 487 ml', C.amber],
      'other fills unchanged'
    ], C.amber),

    ...say('503 ml BECOMES 487 ml', C.amber)
  );

  // 38: the normal model still uses every observation.

  const newSum = LEAK.reduce((a, b) => a + b, 0);
  const newMean = newSum / LEAK.length;

  function leakDataPanel() {
    const spacing = W / 4;
    const y = LOWER_MID + 0.28;

    const parts = [];

    LEAK.forEach((v, k) => {
      const x = CX + (k - 1.5) * spacing;
      const color = k === 3 ? C.amber : C.cyan;

      const r = outline(
        spacing * 0.82,
        0.65,
        pt(x, y),
        color
      );

      parts.push(
        r,

        txt(
          String(v),
          P ? 20 : 21,
          color,
          pt(x, y),
          true
        ),

        txt(
          'ml',
          15,
          C.muted,
          pt(x, y - 0.53)
        )
      );
    });

    parts.push(
      txt(
        'All four readings still count',
        P ? 17 : 17,
        C.amber,
        pt(CX, y - 0.95)
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(38));
  await play(
    new M.FadeOut(leakGuide),

    ...lower(leakDataPanel()),

    new M.LaggedStart(
      observedDots().map((d, k) =>
        new M.Flash(d, {
          color: k === 3 ? C.amber : C.cyan
        })
      ),
      { lagRatio: 0.18, runTime: 1.5 }
    ),

    ...fbox([
      ['NEW TOTAL', C.amber],
      '499 + 500',
      '    + 502 + 487',
      ['= 1,988 ml', C.amber]
    ], C.amber),

    ...say('THE MODEL TRUSTS EVERY DOT', C.amber)
  );

  // 39: the best-fitting centre drops to the new sample mean.

  await until(S(39));
  await play(
    ...slideTo(newMean, 1.5, C.amber),

    ...fbox([
      ['NEW BEST CENTRE', C.amber],
      'sum   = 1,988',
      'count = 4',
      ['1,988 ÷ 4 = 497', C.amber]
    ], C.amber),

    ...say('NEW BEST GUESS = 497 ml', C.amber)
  );

  // 40: visualize the four-ml change in the estimated average.
  // This is a comparison of estimates, not the true population mean.

  function shiftPanel() {
    const a = n2x(newMean);
    const b = n2x(MEAN);

    const y = LOWER_MID + 0.07;

    const floor = line(
      pt(n2x(492), y),
      pt(n2x(505), y),
      C.muted,
      2
    );

    const oldDot = dot(
      pt(b, y),
      0.11,
      C.cyan
    );

    const newDot = dot(
      pt(a, y),
      0.11,
      C.amber
    );

    const arrow = new M.VGroup(
      line(
        pt(b, y + 0.37),
        pt(a, y + 0.37),
        C.amber,
        3
      ),

      line(
        pt(a, y + 0.37),
        pt(a + 0.15, y + 0.47),
        C.amber,
        3
      ),

      line(
        pt(a, y + 0.37),
        pt(a + 0.15, y + 0.27),
        C.amber,
        3
      )
    );

    return new M.VGroup(
      floor,
      oldDot,
      newDot,
      arrow,

      txt(
        '4 ml lower',
        P ? 19 : 18,
        C.amber,
        pt((a + b) / 2, y + 0.69)
      ),

      txt(
        '497',
        19,
        C.amber,
        pt(a, y - 0.30),
        true
      ),

      txt(
        '501',
        19,
        C.cyan,
        pt(b, y - 0.30),
        true
      ),

      txt(
        'after leak',
        16,
        C.amber,
        pt(a - 0.22, y - 0.61)
      ),

      txt(
        'before',
        16,
        C.cyan,
        pt(b + 0.17, y - 0.61)
      )
    );
  }

  const leakHighlight = outline(
    P ? 0.62 : 0.62,
    0.92,
    pt(n2x(487), BASE - 0.12),
    C.amber
  );

  await until(S(40));
  await play(
    ...lower(shiftPanel()),
    new M.Create(leakHighlight),

    new M.Flash(
      dataGroups[3].submobjects[1],
      { color: C.amber }
    ),

    ...fbox([
      ['ONE STRANGE BOTTLE', C.amber],
      '501 → 497',
      ['change = -4 ml', C.amber],
      'the bell model',
      'did not expect a leak'
    ], C.amber),

    ...say('ONE STRANGE FILL PULLS THE ANSWER DOWN', C.amber)
  );

  // 41: inspect the observed data and the suitability of the model.

  await until(S(41));
  await play(
    new M.Indicate(
      dataGroups[3],
      { color: C.amber }
    ),

    ...fbox([
      ['BEFORE TRUSTING IT', C.green],
      'look at the data',
      'check unusual fills',
      'check the model',
      ['then trust the result', C.amber]
    ], C.green),

    ...say('CHECK THE DATA · CHECK THE MODEL', C.green)
  );

  // ============================================================
  // 42: final takeaway.
  // Return explicitly to Monday's original, unchanged dataset.
  // The leak was only a hypothetical alternative.
  // ============================================================

  await until(S(42));

  const expandedAxis = axis;
  const expandedDial = dialMark;
  const expandedBell = bell;
  const expandedPeak = peak;
  const expandedData = dataGroups.slice();

  lo = 495;
  hi = 507;
  n2x = mapFor(lo, hi);
  centre = MEAN;

  axis = makeAxis(n2x, lo, hi);

  dataGroups = DATA.map(v =>
    dataDot(v)
  );

  dialMark = new M.VGroup(
    line(
      pt(n2x(DIAL), BASE - 0.08),
      pt(n2x(DIAL), BASE - 0.16),
      C.muted,
      2
    ),

    txt(
      'dial',
      15,
      C.muted,
      pt(n2x(DIAL), BASE - 0.54)
    )
  );

  bell = bellAt(MEAN);
  peak = peakAt(MEAN, C.green);

  scoreAxes = makeScoreAxes();

  const finalHill = curvePiece(
    495,
    507,
    112,
    C.green
  );

  curveParts = [finalHill];

  cursor = scoreCursor(MEAN, C.green);

  maximumGuide = dashed(
    pt(scoreX(MEAN), SCORE_BASE),
    pt(scoreX(MEAN), sy(MEAN)),
    C.amber
  );

  const finalScore = txt(
    '0.29',
    P ? 17 : 17,
    C.green,
    pt(scoreX(MEAN), sy(MEAN) + 0.22),
    true
  );

  const originalLabel = txt(
    'Original Monday sample',
    15,
    C.cyan,
    pt(n2x(495) + 0.96, TOP + 0.22)
  );

  await play(
    ...clearLower(),

    new M.FadeOut(leakHighlight),
    new M.FadeOut(expandedAxis),
    new M.FadeOut(expandedDial),
    new M.FadeOut(expandedBell),
    new M.FadeOut(expandedPeak),

    ...expandedData.map(g => new M.FadeOut(g)),

    new M.FadeIn(axis),
    new M.FadeIn(dialMark),
    new M.FadeIn(bell),
    new M.FadeIn(peak),
    new M.FadeIn(originalLabel),

    ...dataGroups.map(g => new M.FadeIn(g)),

    new M.FadeIn(scoreAxes),
    new M.FadeIn(finalHill),
    new M.FadeIn(cursor),
    new M.Create(maximumGuide),
    new M.FadeIn(finalScore),

    ...fbox([
      ['MAXIMUM LIKELIHOOD', C.green],
      'pick the candidate',
      'that best explains',
      'the observed data',
      ['normal mean =', C.cyan],
      ['sum ÷ count', C.amber]
    ], C.green),

    ...say('MAXIMUM LIKELIHOOD = BEST FIT', C.green)
  );

  await until(S(42) + 5.0);
  await play(
    new M.Indicate(peak, { color: C.amber }),

    new M.Flash(
      cursor.submobjects[1],
      { color: C.green }
    ),

    ...fbox([
      ['FOR THE NORMAL MEAN', C.green],
      'maximum likelihood',
      '= sample mean',
      '= 2,004 ÷ 4',
      ['= 501 ml', C.amber]
    ], C.green),

    ...say('BEST BELL CENTRE = SAMPLE MEAN', C.green)
  );
}

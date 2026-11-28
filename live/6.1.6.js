// lesson 6.1.6
// Likelihood: fixed data, moving candidate.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied reference engine API; browser playback has not been tested.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const DATA = [499, 500, 502, 503];
  const SD = 2;
  const DIAL = 500;

  const CX = P ? 0 : -2.6;
  const W = P ? FW - 1.3 : 7.2;
  const X0 = CX - W / 2;
  const BASE = P ? -1.55 : -1.75;
  const H = P ? 2.55 : 2.4;
  const TOP = BASE + H;

  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.95, 0] : [4.3, -0.3, 0];

  const n2x = v => X0 + (v - 495) / 12 * W;
  const pt = (x, y) => [x, y, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const height = (v, m) =>
    Math.exp(-Math.pow(v - m, 2) / (2 * SD * SD));

  const likelihood = m =>
    DATA.reduce((p, v) => p * height(v, m), 1);

  const hy = (v, m) => BASE + H * height(v, m);

  const htext = (v, m) =>
    v === m ? '1' : height(v, m).toFixed(2);

  const scoreText = m => likelihood(m).toFixed(2);

  const line = (a, b, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: a, end: b, color, strokeWidth });

  const dashed = (a, b, color = C.muted) =>
    new M.DashedLine({ start: a, end: b, color });

  function txt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function rectangle(w, h, p, color, opacity = 0.8) {
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

  // Formula box: same structure as the approved reference.
  // Phone placement is below the chart to keep the bell unobstructed.

  let boxNow = null;

  function replaceBox(g) {
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
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

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

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
    const maxw = P ? FW - 1.2 : 4.2;
    const maxh = P ? 2.65 : 3.8;

    const scale = Math.min(1, maxw / wd, maxh / ht);
    if (scale < 1) g.scale(scale);

    return replaceBox(g);
  }

  // Bottle illustration: glowing water, outline, neck, cap and fill line.
  // The physical fill-level differences are deliberately small.

  function bottle(x, y, value) {
    const w = 0.66;
    const h = 1.48;
    const bottom = y - h / 2;
    const fillH = 0.95 + (value - DIAL) * 0.07;

    const glow = new M.RoundedRectangle({
      width: w + 0.12,
      height: h + 0.12,
      cornerRadius: 0.18,
      color: C.cyan,
      strokeWidth: 1
    });
    glow.setFill(C.cyan, 0.08);
    glow.moveTo(pt(x, y));

    const body = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color: C.ink,
      strokeWidth: 2
    });
    body.setFill(C.card, 0.7);
    body.moveTo(pt(x, y));

    const water = rectangle(
      w - 0.12,
      fillH,
      pt(x, bottom + 0.06 + fillH / 2),
      C.cyan,
      0.35
    );

    const fillY = bottom + 0.06 + fillH;

    const fillLine = line(
      pt(x - w / 2 + 0.07, fillY),
      pt(x + w / 2 - 0.07, fillY),
      C.cyan,
      3
    );

    const neck = rectangle(
      0.27,
      0.19,
      pt(x, y + h / 2 + 0.075),
      C.ink,
      0.15
    );

    const cap = rectangle(
      0.39,
      0.14,
      pt(x, y + h / 2 + 0.23),
      C.muted,
      0.9
    );

    const label = txt(
      String(value),
      P ? 18 : 18,
      C.cyan,
      pt(x, bottom - 0.3),
      true
    );

    return new M.VGroup(
      glow, body, water, fillLine, neck, cap, label
    );
  }

  const bottles = DATA.map((v, k) =>
    bottle(
      CX + (k - 1.5) * (P ? 1.3 : 1.35),
      P ? -0.05 : -0.15,
      v
    )
  );

  // 0: Monday's four bottles.

  await until(S(0));
  await play(
    new M.LaggedStart(
      bottles.map(b => new M.FadeIn(b)),
      { lagRatio: 0.18, runTime: 1.8 }
    ),
    ...say('MONDAY: 4 BOTTLES')
  );

  // Number line, fixed for the rest of the lesson.

  const floor = line(
    pt(n2x(495), BASE),
    pt(n2x(507), BASE),
    C.muted,
    3
  );

  const ticks = [];

  for (let v = 495; v <= 507; v++) {
    ticks.push(
      line(
        pt(n2x(v), BASE - 0.07),
        pt(n2x(v), BASE + 0.07),
        C.muted,
        1
      )
    );

    // The observed values receive their own cyan labels.
    if (!DATA.includes(v) && [495, 497, 501, 505, 507].includes(v)) {
      ticks.push(
        txt(
          String(v),
          P ? 16 : 16,
          C.muted,
          pt(n2x(v), BASE - 0.29),
          true
        )
      );
    }
  }

  const unit = txt(
    'ml',
    16,
    C.muted,
    pt(n2x(507) - 0.08, BASE - 0.65)
  );

  const dialMark = dashed(
    pt(n2x(DIAL), BASE - 0.1),
    pt(n2x(DIAL), BASE - 0.16),
    C.muted
  );

  const dialLabel = txt(
    'dial',
    P ? 16 : 15,
    C.muted,
    pt(n2x(DIAL), BASE - 0.65)
  );

  const axis = new M.VGroup(
    floor,
    ...ticks,
    unit,
    dialMark,
    dialLabel
  );

  // These four dots will never be transformed or moved.

  const dataDots = [];
  const dotGroups = [];

  DATA.forEach(v => {
    const p = pt(n2x(v), BASE);

    const halo = new M.Dot({
      point: p,
      radius: 0.18,
      color: C.cyan
    });
    halo.setFill(C.cyan, 0.17);

    const d = new M.Dot({
      point: p,
      radius: 0.095,
      color: C.cyan
    });

    const label = txt(
      String(v),
      P ? 16 : 18,
      C.cyan,
      pt(n2x(v), BASE - 0.29),
      true
    );

    dataDots.push(d);
    dotGroups.push(new M.VGroup(halo, d, label));
  });

  // 1: measurements appear one by one.

  await until(S(1));
  await play(
    new M.FadeIn(axis),
    new M.LaggedStart(
      dotGroups.map(g => new M.FadeIn(g)),
      { lagRatio: 0.65, runTime: 5.0 }
    ),
    ...say('THE FOUR MEASURED FILLS')
  );

  // 2: fixed observations.

  await until(S(2));
  await play(
    ...bottles.map(b => new M.FadeOut(b)),
    new M.LaggedStart(
      dataDots.map(d => new M.Flash(d, { color: C.cyan })),
      { lagRatio: 0.18, runTime: 1.6 }
    ),
    ...say('DATA = FIXED', C.cyan)
  );

  // 3-5: reverse the direction of the question.

  await until(S(3));
  await play(
    ...say('TURN THE QUESTION AROUND', C.amber)
  );

  await until(S(4));
  await play(
    ...fbox([
      ['BEFORE', C.muted],
      ['machine setting', C.amber],
      ['       ↓', C.muted],
      ['possible samples', C.cyan]
    ]),
    ...say('SETTING → POSSIBLE DATA', C.muted)
  );

  await until(S(5));
  await play(
    ...fbox([
      ['TODAY', C.green],
      ['observed sample', C.cyan],
      ['       ↓', C.muted],
      ['best setting?', C.amber]
    ], C.green),
    ...say('DATA → MACHINE SETTING?', C.green)
  );

  // Smooth bell assembled from short line segments.
  // All candidates use the same SD and the same peak height.
  // Peak-scaled heights are proportional to normal density
  // for this fixed-SD model.

  function bellAt(m, color = C.ink) {
    const N = 96;
    const segments = [];

    for (let k = 0; k < N; k++) {
      const a = 495 + 12 * k / N;
      const b = 495 + 12 * (k + 1) / N;

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

  function peakAt(m, label = `centre: ${m}`, color = C.amber) {
    const guide = dashed(
      pt(n2x(m), BASE + 0.12),
      pt(n2x(m), TOP),
      color
    );

    const topDot = new M.Dot({
      point: pt(n2x(m), TOP),
      radius: 0.075,
      color
    });

    const tag = pill(label, color, P ? 16 : 17);
    tag.moveTo(pt(n2x(m), TOP + 0.64));

    return new M.VGroup(guide, topDot, tag);
  }

  // Initial position is illustrative, not a revealed true mean.
  // The chapter's true mean remains hidden in this lesson.

  let centre = 502.4;
  const bell = bellAt(centre);
  const peak = peakAt(centre, 'centre: ?', C.amber);

  function slideTo(m, label = `centre: ${m}`, runTime = 1.4) {
    centre = m;

    return [
      new M.Transform(bell, bellAt(m), { runTime }),
      new M.Transform(peak, peakAt(m, label), { runTime })
    ];
  }

  // 6: introduce the model before calculating anything.

  await until(S(6));
  await play(
    new M.FadeIn(bell),
    ...fbox([
      ['OUR MODEL', C.violet],
      'bell-shaped fills',
      ['spread = 2 ml', C.amber],
      ['centre = unknown', C.muted]
    ], C.violet),
    ...say('ASSUME A BELL SHAPE', C.violet)
  );

  const spreadY = BASE + 0.38;

  const spread = new M.VGroup(
    line(
      pt(n2x(centre), spreadY),
      pt(n2x(centre + SD), spreadY),
      C.violet,
      3
    ),
    line(
      pt(n2x(centre), spreadY - 0.09),
      pt(n2x(centre), spreadY + 0.09),
      C.violet,
      2
    ),
    line(
      pt(n2x(centre + SD), spreadY - 0.09),
      pt(n2x(centre + SD), spreadY + 0.09),
      C.violet,
      2
    ),
    txt(
      '2 ml',
      16,
      C.violet,
      pt(n2x(centre + SD / 2), spreadY + 0.22),
      true
    )
  );

  await until(S(6) + 3.5);
  await play(new M.FadeIn(spread));

  // 7: the peak is at the model's average.

  await until(S(7));
  await play(
    new M.FadeOut(spread),
    new M.FadeIn(peak),
    ...fbox([
      ['NORMAL LAW', C.violet],
      'bell peak =',
      ['true average', C.amber],
      ['still unknown', C.muted]
    ], C.violet),
    ...say('THE PEAK IS THE AVERAGE', C.amber)
  );

  // 8: move an illustrative peak to show what is unknown.

  await until(S(8));
  await play(
    ...slideTo(498.8, 'centre: ?', 1.6),
    ...say('WHICH CENTRE FITS BEST?', C.amber)
  );

  // 9: candidate one, centre 500.

  await until(S(9));
  await play(
    ...slideTo(500, 'centre: 500'),
    ...fbox([
      ['CANDIDATE 1', C.amber],
      ['centre = 500 ml', C.amber],
      'spread = 2 ml'
    ], C.amber),
    ...say('TRY 500 ml', C.amber)
  );

  // Height scale: relative to the peak, not probability.

  const scaleX = n2x(495) - 0.04;

  const hscale = new M.VGroup(
    line(
      pt(scaleX, BASE),
      pt(scaleX, TOP),
      C.muted,
      1
    ),
    line(
      pt(scaleX - 0.07, TOP),
      pt(scaleX + 0.07, TOP),
      C.muted,
      2
    ),
    txt(
      '1',
      15,
      C.muted,
      pt(scaleX - 0.2, TOP),
      true
    ),
    txt(
      '0',
      15,
      C.muted,
      pt(scaleX - 0.2, BASE + 0.13),
      true
    ),
    txt(
      'height',
      15,
      C.muted,
      pt(scaleX + 0.32, TOP + 0.25)
    )
  );

  let guides = [];
  let heightLabels = [];

  function makeGuide(v, m, color = C.amber) {
    const x = n2x(v);
    const y = hy(v, m);

    const stem = dashed(
      pt(x, BASE + 0.1),
      pt(x, y),
      color
    );

    const cap = line(
      pt(x - 0.09, y),
      pt(x + 0.09, y),
      color,
      3
    );

    const tip = new M.Dot({
      point: pt(x, y),
      radius: 0.045,
      color
    });

    return new M.VGroup(stem, cap, tip);
  }

  // label beside the tip, on the side away from the peak (the curve is lower there), or above the peak itself
  function makeHeightLabel(v, m, color = C.amber) {
    const t = T(htext(v, m), P ? 16 : 18, color, true);
    const x = n2x(v), y = hy(v, m);
    if (v === m) t.moveTo(pt(x, y + 0.24));
    else if (v < m) t.moveTo(pt(x - 0.12 - t.getWidth() / 2, y + 0.16));
    else t.moveTo(pt(x + 0.12 + t.getWidth() / 2, y + 0.16));
    return t;
  }

  function showGuides(m) {
    guides = DATA.map(v => makeGuide(v, m));

    return [
      new M.LaggedStart(
        guides.map(g => new M.FadeIn(g)),
        { lagRatio: 0.17, runTime: 1.5 }
      )
    ];
  }

  function revealHeight(k, m, color = C.amber) {
    const label = makeHeightLabel(DATA[k], m, color);
    heightLabels.push(label);

    return [
      new M.FadeIn(label),
      new M.Indicate(guides[k], { color }),
      new M.Flash(dataDots[k], { color: C.cyan })
    ];
  }

  function showAllHeights(m) {
    guides = DATA.map(v => makeGuide(v, m));
    heightLabels = DATA.map(v => makeHeightLabel(v, m));

    return [
      new M.LaggedStart(
        DATA.map((_, k) =>
          new M.LaggedStart(
            [
              new M.FadeIn(guides[k]),
              new M.FadeIn(heightLabels[k])
            ],
            { lagRatio: 0.1 }
          )
        ),
        { lagRatio: 0.18, runTime: 2.0 }
      )
    ];
  }

  function clearReadings() {
    const a = [
      ...guides.map(g => new M.FadeOut(g)),
      ...heightLabels.map(t => new M.FadeOut(t))
    ];

    guides = [];
    heightLabels = [];

    return a;
  }

  // 10: read the relative height over each fixed observation.

  await until(S(10));
  await play(
    new M.FadeIn(hscale),
    ...showGuides(500),
    ...fbox([
      ['READ THE HEIGHTS', C.amber],
      'peak = 1',
      'lower = a fraction',
      ['of the peak', C.muted]
    ], C.amber),
    ...say('HOW TALL ABOVE EACH DOT?', C.amber)
  );

  // 11: 500, distance zero, height one.

  await until(S(11));
  await play(
    ...revealHeight(1, 500),
    ...fbox([
      ['fill = 500 ml', C.cyan],
      'distance = 0 ml',
      ['height = 1', C.amber]
    ], C.amber),
    ...say('AT THE PEAK: HEIGHT 1', C.amber)
  );

  // 12: 499, distance one, height 0.88.

  await until(S(12));
  await play(
    ...revealHeight(0, 500),
    ...fbox([
      ['fill = 499 ml', C.cyan],
      'distance = 1 ml',
      ['height ≈ 0.88', C.amber]
    ], C.amber),
    ...say('1 ml AWAY', C.amber)
  );

  // 13: 502, distance two, height 0.61.

  await until(S(13));
  await play(
    ...revealHeight(2, 500),
    ...fbox([
      ['fill = 502 ml', C.cyan],
      'distance = 2 ml',
      ['height ≈ 0.61', C.amber]
    ], C.amber),
    ...say('2 ml AWAY', C.amber)
  );

  // 14: 503, distance three, height 0.32.

  await until(S(14));
  await play(
    ...revealHeight(3, 500),
    ...fbox([
      ['fill = 503 ml', C.cyan],
      'distance = 3 ml',
      ['height ≈ 0.32', C.amber]
    ], C.amber),
    ...say('3 ml AWAY', C.amber)
  );

  // 15: compare a very typical fill with a surprising one.

  await until(S(15));
  await play(
    new M.Indicate(guides[1], { color: C.green }),
    ...fbox([
      ['TALL HEIGHT', C.green],
      'quite normal',
      ['LOW HEIGHT', C.amber],
      'more surprising'
    ], C.green),
    ...say('TALL = FITS WELL', C.green)
  );

  await until(S(15) + 3.6);
  await play(
    new M.Indicate(guides[3], { color: C.amber }),
    ...say('LOW = MORE SURPRISING', C.amber)
  );

  // 16: combine all four heights.

  await until(S(16));
  await play(
    new M.LaggedStart(
      guides.map(g => new M.Indicate(g, { color: C.amber })),
      { lagRatio: 0.18, runTime: 1.5 }
    ),
    ...fbox([
      ['ONE SAMPLE SCORE', C.green],
      'height × height',
      '       × height',
      '       × height'
    ], C.green),
    ...say('MULTIPLY THE 4 HEIGHTS', C.green)
  );

  // 17: independent bottles.

  await until(S(17));
  await play(
    new M.LaggedStart(
      dataDots.map(d => new M.Flash(d, { color: C.cyan })),
      { lagRatio: 0.4, runTime: 2.0 }
    ),
    ...fbox([
      ['INDEPENDENT FILLS', C.violet],
      'one bottle',
      'does not affect',
      'the next bottle'
    ], C.violet),
    ...say('ONE FILL DOES NOT AFFECT THE NEXT', C.violet)
  );

  // 18: independent evidence combines by multiplication.

  await until(S(18));
  await play(
    ...fbox([
      ['INDEPENDENT', C.violet],
      'combine by',
      ['multiplication', C.green],
      '0.88 × 1',
      '     × 0.61 × 0.32'
    ], C.violet),
    ...say('INDEPENDENT → MULTIPLY', C.violet)
  );

  // 19: candidate one's product.

  await until(S(19));
  await play(
    ...fbox([
      ['CENTRE = 500', C.amber],
      '0.88 × 1',
      '     × 0.61 × 0.32',
      ['score ≈ 0.17', C.green]
    ], C.green),
    ...say('500 SCORES 0.17', C.green)
  );

  // 20: candidate two.
  // The curve and its centre move; the observed dots do not.

  await until(S(20));
  await play(
    ...clearReadings(),
    ...slideTo(501, 'centre: 501', 1.6),
    ...fbox([
      ['CANDIDATE 2', C.amber],
      ['centre = 501 ml', C.amber],
      'same four fills',
      'same spread'
    ], C.amber),
    ...say('SLIDE THE BELL TO 501', C.amber)
  );

  // Distance rulers: lengths are measured in the same ml scale.
  // The horizontal rulers occupy separate levels inside the chart.

  let rulers = null;

  function distanceRulers(m) {
    const pieces = [];

    DATA.forEach((v, k) => {
      const y = BASE + 0.36 + k * 0.35;
      const a = n2x(m);
      const b = n2x(v);
      const d = Math.abs(v - m);

      if (d === 0) {
        pieces.push(new M.Dot({
          point: pt(a, y),
          radius: 0.05,
          color: C.violet
        }));
      } else {
        pieces.push(
          line(pt(a, y), pt(b, y), C.violet, 2),
          line(
            pt(b, y - 0.07),
            pt(b, y + 0.07),
            C.violet,
            2
          )
        );
      }

      pieces.push(
        txt(
          String(d),
          15,
          C.violet,
          pt((a + b) / 2, y + 0.17),
          true
        )
      );
    });

    return new M.VGroup(...pieces);
  }

  // 21: distances from 501.

  rulers = distanceRulers(501);

  await until(S(21));
  await play(
    new M.FadeIn(rulers),
    ...fbox([
      ['DISTANCES FROM 501', C.violet],
      '499 → 2 ml',
      '500 → 1 ml',
      '502 → 1 ml',
      '503 → 2 ml'
    ], C.violet),
    ...say('DISTANCES: 2, 1, 1, 2', C.violet)
  );

  // 22: corresponding heights.

  await until(S(22));
  await play(
    new M.FadeOut(rulers),
    ...showAllHeights(501),
    ...fbox([
      ['FILL   GAP   HEIGHT', C.muted],
      '499     2     0.61',
      '500     1     0.88',
      '502     1     0.88',
      '503     2     0.61'
    ], C.amber),
    ...say('READ THE NEW HEIGHTS', C.amber)
  );

  rulers = null;

  // 23: improved score.

  await until(S(23));
  await play(
    ...fbox([
      ['CENTRE = 501', C.amber],
      '0.61 × 0.88',
      '     × 0.88 × 0.61',
      ['score ≈ 0.29', C.green],
      ['0.29 > 0.17', C.green]
    ], C.green),
    ...say('0.29: A BETTER SCORE', C.green)
  );

  // 24: candidate three.

  await until(S(24));
  await play(
    ...clearReadings(),
    ...slideTo(499, 'centre: 499', 1.6),
    ...fbox([
      ['CANDIDATE 3', C.amber],
      ['centre = 499 ml', C.amber],
      'same four fills',
      'same spread'
    ], C.amber),
    ...say('SLIDE THE BELL TO 499', C.amber)
  );

  // 25: distances and heights for candidate three.

  rulers = distanceRulers(499);

  await until(S(25));
  await play(
    new M.FadeIn(rulers),
    ...fbox([
      ['DISTANCES FROM 499', C.violet],
      '499 → 0 ml',
      '500 → 1 ml',
      '502 → 3 ml',
      '503 → 4 ml'
    ], C.violet),
    ...say('DISTANCES: 0, 1, 3, 4', C.violet)
  );

  await until(S(25) + 4.1);
  await play(
    new M.FadeOut(rulers),
    ...showAllHeights(499),
    ...fbox([
      ['FILL   GAP   HEIGHT', C.muted],
      '499     0     1',
      '500     1     0.88',
      '502     3     0.32',
      '503     4     0.14'
    ], C.amber),
    ...say('READ THE FOUR HEIGHTS', C.amber)
  );

  rulers = null;

  // 26: poor score, especially the far-away observation at 503.

  await until(S(26));
  await play(
    ...fbox([
      ['CENTRE = 499', C.amber],
      '1 × 0.88',
      '  × 0.32 × 0.14',
      ['score ≈ 0.04', C.amber]
    ], C.amber),
    ...say('0.04: A POOR SCORE', C.amber)
  );

  const farBox = outline(
    0.57,
    hy(503, 499) - BASE + 0.8,
    pt(
      n2x(503),
      (hy(503, 499) + BASE) / 2 + 0.08
    ),
    C.amber
  );

  await until(S(26) + 4.1);
  await play(
    new M.Create(farBox),
    new M.Indicate(guides[3], { color: C.amber }),
    new M.Flash(dataDots[3], { color: C.amber }),
    ...say('503 IS FAR FROM THIS CENTRE', C.amber)
  );

  // Comparison panel: horizontal bars, one common score scale.
  // The scores are not normalized to sum to one.

  const candidates = [
    { m: 500, score: likelihood(500), color: C.amber },
    { m: 501, score: likelihood(501), color: C.green },
    { m: 499, score: likelihood(499), color: C.violet }
  ];

  function scorePanel(title = 'LIKELIHOOD SCORES', best = false) {
    const wd = P ? 5.5 : 4.2;
    const ht = 2.55;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color: best ? C.green : C.cyan,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2;
    const top = BOXP[1] + ht / 2;
    const barLeft = left + (P ? 1.23 : 1.02);
    const maxBar = P ? 3.0 : 2.1;

    const parts = [
      txt(
        title,
        P ? 20 : 18,
        best ? C.green : C.cyan,
        pt(BOXP[0], top - 0.32)
      )
    ];

    candidates.forEach((c, k) => {
      const y = top - 0.86 - k * 0.48;
      const barW = maxBar * c.score / 0.32;

      const track = rectangle(
        maxBar,
        0.21,
        pt(barLeft + maxBar / 2, y),
        C.muted,
        0.12
      );

      const bar = rectangle(
        barW,
        0.21,
        pt(barLeft + barW / 2, y),
        c.color,
        0.85
      );

      const lab = txt(
        String(c.m),
        17,
        c.color,
        pt(left + 0.48, y),
        true
      );

      const val = txt(
        c.score.toFixed(2),
        17,
        c.color,
        pt(left + wd - 0.45, y),
        true
      );

      parts.push(track, bar, lab, val);
    });

    parts.push(
      txt(
        best ? '501: best of the three tried' : 'larger score = better fit',
        P ? 16 : 15,
        best ? C.green : C.muted,
        pt(BOXP[0], top - 2.25)
      )
    );

    return replaceBox(new M.VGroup(r, ...parts));
  }

  // 27: give the score its name.

  await until(S(27));
  await play(
    new M.FadeOut(farBox),
    ...scorePanel(),
    ...say('THIS SCORE IS LIKELIHOOD', C.green)
  );

  // 28: likelihood compares candidate explanations.

  await until(S(28));
  await play(
    new M.Indicate(boxNow, { color: C.green }),
    ...say('HOW WELL DOES THE CANDIDATE FIT?', C.green)
  );

  // 29: demonstrate what moved and what did not.

  await until(S(29));
  await play(
    ...clearReadings(),
    ...slideTo(500, 'centre: 500', 1.8),
    new M.LaggedStart(
      dataDots.map(d => new M.Flash(d, { color: C.cyan })),
      { lagRatio: 0.14, runTime: 1.8 }
    ),
    ...say('ONLY THE BELL MOVES', C.amber)
  );

  // 30: the heart of likelihood.

  await until(S(30));
  await play(
    ...slideTo(501, 'centre: 501', 1.6),
    ...fbox([
      ['DATA', C.cyan],
      '499, 500, 502, 503',
      ['stay fixed', C.cyan],
      ['CANDIDATE', C.amber],
      'centre can vary'
    ], C.cyan),
    ...say('FIXED DATA · VARYING CENTRE', C.cyan)
  );

  // 31: introduce the word product.

  await until(S(31));
  await play(
    ...showAllHeights(501),
    ...fbox([
      ['PRODUCT', C.violet],
      'the result of',
      'multiplication',
      ['2 × 3 = 6', C.amber]
    ], C.violet),
    ...say('PRODUCT = MULTIPLY TOGETHER', C.violet)
  );

  // 32: formula, only after the picture and worked examples.

  await until(S(32));
  await play(
    ...fbox([
      ['likelihood(centre)', C.green],
      '= product of',
      '  the bell heights',
      ['  at the fixed fills', C.cyan]
    ], C.green),
    ...say('MULTIPLY HOW WELL EACH FILL FITS', C.green)
  );

  await until(S(32) + 5.0);
  await play(
    ...fbox([
      ['likelihood(501)', C.green],
      '= 0.61 × 0.88',
      '       × 0.88 × 0.61',
      ['≈ 0.29', C.green]
    ], C.green),
    new M.LaggedStart(
      heightLabels.map(t => new M.Indicate(t, { color: C.amber })),
      { lagRatio: 0.16, runTime: 1.6 }
    )
  );

  // 33: the data provide evidence for different candidates.

  await until(S(33));
  await play(
    ...scorePanel('LET THE DATA VOTE', true),
    ...say('DATA HELP CHOOSE A SETTING', C.green)
  );

  // 34: what likelihood is used for.

  await until(S(34));
  await play(
    ...fbox([
      ['LIKELIHOOD HELPS US', C.green],
      'fit models',
      'compare models',
      'train machine',
      'learning systems'
    ], C.green),
    ...say('A TOOL FOR FITTING MODELS', C.green)
  );

  // 35: the common trap.

  await until(S(35));
  await play(
    ...fbox([
      ['COMMON TRAP', C.amber],
      'likelihood',
      ['is NOT the chance', C.amber],
      'the centre is true'
    ], C.amber),
    ...say('LIKELIHOOD IS NOT THAT PROBABILITY', C.amber)
  );

  // 36: explicitly distinguish 0.29 from 29 percent probability.

  const trapLine = line(
    pt(n2x(501) - 0.92, TOP + 0.48),
    pt(n2x(501) + 0.92, TOP + 0.48),
    C.amber,
    3
  );

  await until(S(36));
  await play(
    ...fbox([
      ['501 scores 0.29', C.green],
      ['NOT', C.amber],
      '29% chance that',
      '501 is the true mean'
    ], C.amber),
    ...say('0.29 DOES NOT MEAN 29% CHANCE', C.amber)
  );

  // 37: the scores are comparative, not a probability distribution.

  await until(S(37));
  await play(
    ...fbox([
      ['THE THREE TRIED', C.muted],
      '0.17 + 0.29 + 0.04',
      ['≈ 0.50', C.amber],
      'other centres exist',
      ['no required sum of 1', C.green]
    ], C.violet),
    ...say('SCORES NEED NOT ADD TO 1', C.violet)
  );

  // 38: best of the candidates tried so far.
  // Do not claim a global maximum before the next lesson.

  await until(S(38));
  await play(
    ...scorePanel('BEST SO FAR', true),
    new M.Indicate(peak, { color: C.green }),
    ...say('BEST TRIED: 501 ml', C.green)
  );

  const question = txt(
    'Best of every possible centre?',
    P ? 17 : 18,
    C.amber,
    pt(CX, BASE - 1.02)
  );

  await until(S(38) + 2.6);
  await play(
    new M.FadeIn(question),
    ...say('WE ONLY TRIED 3 CENTRES', C.amber)
  );

  // 39: preview smooth movement through other candidate centres.

  await until(S(39));
  await play(
    ...clearReadings(),
    new M.FadeOut(question),
    ...slideTo(499.5, 'centre: 499.5', 1.6),
    ...say('NEXT: SLIDE THE BELL SMOOTHLY', C.amber)
  );

  await play(
    ...slideTo(502.5, 'centre: 502.5', 1.8)
  );

  // 40: final takeaway.
  // Return to the best of the three demonstrated candidates.
  // The maximum over all possible centres is established next lesson.

  await until(S(40));
  await play(
    ...slideTo(501, 'centre: 501', 1.4),
    ...showAllHeights(501),
    ...fbox([
      ['LIKELIHOOD', C.green],
      'how well a candidate',
      'explains the data',
      ['data stay fixed', C.cyan],
      ['candidate varies', C.amber]
    ], C.green),
    ...say('FIXED DATA · COMPARE CANDIDATES', C.green)
  );
}

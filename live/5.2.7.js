// lesson 5.2.7
// Beta proportions — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API.
// Illustrative batch observations are not presented as measured records.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;

  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const pt = (x, y) => [x, y, 0];

  const MAXW = P ? FW - 1.25 : 6.0;

  // ------------------------------------------------------------
  // Shared drawing helpers
  // ------------------------------------------------------------

  function txt(s, x, y, size = 20, color = C.ink, mono = false) {
    const t = T(s, P && size < 18 ? 18 : size, color, mono);
    t.moveTo(pt(x, y));

    return t;
  }

  // phone only: enlarge a self-contained picture (capped to the frame width) and centre it lower
  function pfit(g, s, y) {
    if (P) {
      const k = Math.min(s, (FW - 0.8) / g.getWidth());
      if (k > 1) g.scale(k);
      g.moveTo(pt(0, y));
    }
    return g;
  }

  function fitText(
    s, x, y,
    size = 20,
    color = C.ink,
    maxw = MAXW,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 2
  ) {
    return new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth: sw
    });
  }

  function dashed(x1, y1, x2, y2, color = C.muted) {
    return new M.DashedLine({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color
    });
  }

  function rect(
    x, y, w, h,
    color,
    opacity = 0.2,
    sw = 2
  ) {
    const r = new M.Rectangle({
      width: Math.max(w, 0.001),
      height: Math.max(h, 0.001),
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function rounded(
    x, y, w, h,
    color,
    opacity = 0.15
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(
    x, y,
    radius = 0.1,
    color = C.cyan,
    opacity = 1
  ) {
    const d = new M.Dot({
      point: pt(x, y),
      radius,
      color
    });

    d.setFill(color, opacity);

    return d;
  }

  function glow(x, y, radius = 0.1, color = C.cyan) {
    return new M.VGroup(
      dot(x, y, radius * 2.0, color, 0.16),
      dot(x, y, radius, color)
    );
  }

  function tag(s, x, y, color = C.cyan, size = 17) {
    const p = pill(s, color, size);

    if (p.getWidth() > MAXW) {
      p.scale(MAXW / p.getWidth());
    }

    p.moveTo(pt(x, y));

    return p;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.amber,
    sw = 3
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.15;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, sw),
      line(
        x2, y2,
        x2 - h * Math.cos(a - 0.55),
        y2 - h * Math.sin(a - 0.55),
        color, sw
      ),
      line(
        x2, y2,
        x2 - h * Math.cos(a + 0.55),
        y2 - h * Math.sin(a + 0.55),
        color, sw
      )
    );
  }

  function cross(x, y, size = 0.13, color = C.amber) {
    return new M.VGroup(
      line(x - size, y - size, x + size, y + size, color, 3),
      line(x - size, y + size, x + size, y - size, color, 3)
    );
  }

  function bracket(x1, x2, y, label, color = C.amber) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 2),
      line(x1, y - 0.09, x1, y + 0.09, color, 2),
      line(x2, y - 0.09, x2, y + 0.09, color, 2),
      txt(label, (x1 + x2) / 2, y - 0.30, 18, color)
    );
  }

  // ------------------------------------------------------------
  // Formula box — same style and placement as the reference
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    if (!lines) {
      const a = boxNow ? [new M.FadeOut(boxNow)] : [];

      boxNow = null;

      return a;
    }

    const size = P ? 22 : 21;
    const lh = P ? 0.38 : 0.42;

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
    const ht = rows.length * lh + 0.36;

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
    const top = BOXP[1] + ht / 2 - 0.18 - lh / 2;

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
    const maxh = P ? 1.9 : 3.4;

    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;

    return a;
  }

  // ------------------------------------------------------------
  // Picture management
  // Objects are grouped only before being displayed.
  // ------------------------------------------------------------

  let picture = [];
  let overlays = [];

  function clearOverlays() {
    const a = overlays.map(o => new M.FadeOut(o));

    overlays = [];

    return a;
  }

  function clearPicture() {
    const a = [
      ...clearOverlays(),
      ...picture.map(o => new M.FadeOut(o))
    ];

    picture = [];

    return a;
  }

  function replacePicture(...objects) {
    const a = clearPicture();

    picture = objects;

    return [
      ...a,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function replaceOverlay(...objects) {
    const a = clearOverlays();

    overlays = objects;

    return [
      ...a,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  // ------------------------------------------------------------
  // Rice bags and faulty seals
  // ------------------------------------------------------------

  function riceBag(x, y, faulty = false, scale = 1, label = false) {
    const color = faulty ? C.amber : C.cyan;

    const w = 0.43 * scale;
    const h = 0.58 * scale;

    const body = rounded(
      x, y,
      w, h,
      color,
      faulty ? 0.20 : 0.12
    );

    const topY = y + h * 0.34;
    const edge = w * 0.39;

    const seal = faulty
      ? new M.VGroup(
          line(
            x - edge, topY,
            x - w * 0.10, topY + h * 0.16,
            C.amber, 3
          ),
          line(
            x + w * 0.10, topY + h * 0.16,
            x + edge, topY,
            C.amber, 3
          )
        )
      : line(
          x - edge, topY,
          x + edge, topY,
          C.green, 3
        );

    const bottom = line(
      x - edge, y - h * 0.33,
      x + edge, y - h * 0.33,
      color, 1.5
    );

    const objects = [
      body,
      seal,
      bottom
    ];

    if (label) {
      objects.push(
        fitText(
          '500 g',
          x, y - 0.04 * scale,
          18,
          C.ink,
          w * 0.80,
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function batchRow(y, bad, title = null, showShare = false) {
    const spacing = P ? 0.55 : 0.53;

    const faultyIndices = [
      1, 6, 3, 8, 0,
      5, 9, 2, 7, 4
    ].slice(0, bad);

    const objects = [];

    for (let i = 0; i < 10; i++) {
      objects.push(
        riceBag(
          CX + (i - 4.5) * spacing,
          y,
          faultyIndices.includes(i)
        )
      );
    }

    if (title) {
      objects.push(
        txt(title, CX, y + 0.51, 18, C.ink)
      );
    }

    if (showShare) {
      objects.push(
        txt(
          `${bad} faulty out of 10  =  ${(bad / 10).toFixed(1)}`,
          CX, y - 0.53,
          18, C.amber, true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function packagingLine() {
    const y = P ? -1.60 : -0.50;

    const belt = rounded(
      CX, y - 0.68,
      5.9, 0.40,
      C.muted, 0.12
    );

    const rollers = Array.from({ length: 8 }, (_, i) => {
      const r = new M.Circle({
        radius: 0.11,
        color: C.muted,
        strokeWidth: 2
      });

      r.moveTo(
        pt(CX + (i - 3.5) * 0.70, y - 0.68)
      );

      return r;
    });

    return new M.VGroup(
      txt(
        'One batch of rice bags',
        CX, y + 1.13,
        22, C.ink
      ),
      belt,
      ...rollers,
      batchRow(y, 2),
      glow(CX - 1.65, y - 1.23, 0.075, C.green),
      txt(
        'Good seal',
        CX - 0.85, y - 1.23,
        18, C.green
      ),
      glow(CX + 0.65, y - 1.23, 0.075, C.amber),
      txt(
        'Faulty seal',
        CX + 1.60, y - 1.23,
        18, C.amber
      ),
      txt(
        'Illustrative batch',
        CX, y - 1.67,
        16, C.muted
      )
    );
  }

  // ------------------------------------------------------------
  // 0 — every batch has some faulty seals
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...replacePicture(pfit(packagingLine(), 1.3, -2.6)),
    ...say('FAULTY SEALS IN A BATCH'),
    ...fbox([
      'Packaging line',
      '500 g rice bags',
      ['Some seals are faulty', C.amber]
    ])
  );

  // ------------------------------------------------------------
  // 1 — compare a good seal and a faulty seal
  // ------------------------------------------------------------

  function sealComparison() {
    const y = P ? -1.30 : -0.52;

    const goodX = CX - 1.48;
    const badX = CX + 1.48;

    return new M.VGroup(
      riceBag(goodX, y, false, 2.75, true),
      riceBag(badX, y, true, 2.75, true),
      txt(
        'GOOD SEAL',
        goodX, y - 1.13,
        19, C.green
      ),
      txt(
        'FAULTY SEAL',
        badX, y - 1.13,
        19, C.amber
      ),
      arrow(
        goodX - 0.65, y + 1.37,
        goodX - 0.15, y + 0.58,
        C.green, 2
      ),
      arrow(
        badX + 0.65, y + 1.37,
        badX + 0.08, y + 0.75,
        C.amber, 2
      ),
      txt(
        'Closed',
        goodX - 0.35, y + 1.48,
        18, C.green
      ),
      txt(
        'Gap in seal',
        badX + 0.25, y + 1.48,
        18, C.amber
      )
    );
  }

  await until(S(1));

  await play(
    ...replacePicture(pfit(sealComparison(), 1.3, -2.6)),
    ...say('FAULTY = NOT CLOSED PROPERLY', C.amber),
    ...fbox([
      ['Good: fully closed', C.green],
      ['Faulty: not fully closed', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 2 — the faulty share varies between batches
  // ------------------------------------------------------------

  function threeBatches() {
    const top = P ? 0.35 : 0.53;
    const dy = P ? 1.75 : 1.29;

    return new M.VGroup(
      batchRow(top, 1, 'Batch A', true),
      batchRow(top - dy, 2, 'Batch B', true),
      batchRow(top - 2 * dy, 4, 'Batch C', true),
      txt(
        'Illustrative batches',
        CX,
        P ? -4.18 : -2.86,
        15, C.muted
      )
    );
  }

  await until(S(2));

  await play(
    ...replacePicture(threeBatches()),
    ...say('DIFFERENT BATCHES, DIFFERENT SHARES'),
    ...fbox([
      'Batch A: 0.1',
      'Batch B: 0.2',
      'Batch C: 0.4',
      ['The share changes', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 3 — a share is a part of the whole
  // ------------------------------------------------------------

  function shareExample(bad = 2) {
    const y = P ? -1.05 : -0.35;
    const spacing = P ? 0.55 : 0.53;

    const left = CX - 4.5 * spacing - 0.24;
    const right = CX + 4.5 * spacing + 0.24;

    const objects = [
      txt(
        'Part of the whole',
        CX, y + 1.10,
        22, C.ink
      )
    ];

    for (let i = 0; i < 10; i++) {
      objects.push(
        riceBag(
          CX + (i - 4.5) * spacing,
          y,
          i < bad
        )
      );
    }

    if (bad > 0) {
      objects.push(
        bracket(
          left,
          CX + (bad - 1 - 4.5) * spacing + 0.24,
          y - 0.49,
          `${bad} faulty`,
          C.amber
        )
      );
    }

    objects.push(
      bracket(
        left, right,
        y - 1.06,
        '10 bags in total',
        C.cyan
      ),
      tag(
        `${bad}/10 = ${(bad / 10).toFixed(1)}`,
        CX,
        y - 1.84,
        C.green,
        22
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(3));

  await play(
    ...replacePicture(pfit(shareExample(2), 1.25, -2.6)),
    ...say('0.2 MEANS 2 IN 10', C.green),
    ...fbox([
      'Share = part ÷ whole',
      'Faulty share = 2 ÷ 10',
      ['= 0.2 = 20%', C.green],
      'Always between 0 and 1'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 4 — manager's question: more than four in ten faulty
  // ------------------------------------------------------------

  function managerQuestion() {
    const y = P ? -1.25 : -0.45;
    const spacing = 0.54;

    const objects = [
      txt(
        'Four faulty seals in ten bags',
        CX, y + 1.02,
        21, C.ink
      )
    ];

    for (let i = 0; i < 10; i++) {
      objects.push(
        riceBag(
          CX + (i - 4.5) * spacing,
          y,
          i < 4
        )
      );
    }

    const fifthX = CX + (4 - 4.5) * spacing;

    objects.push(
      rounded(
        CX - 3.0 * spacing,
        y,
        4 * spacing + 0.06,
        0.86,
        C.amber,
        0.03
      ),
      arrow(
        fifthX, y - 1.00,
        fifthX, y - 0.39,
        C.amber, 3
      ),
      txt(
        'What if more are faulty?',
        CX, y - 1.25,
        19, C.amber
      ),
      tag(
        'FAULTY SHARE > 0.4',
        CX, y - 1.79,
        C.amber, 18
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(4));

  await play(
    ...replacePicture(pfit(managerQuestion(), 1.25, -2.6)),
    ...say('HOW OFTEN IS THE SHARE ABOVE 0.4?', C.amber),
    ...fbox([
      "Manager's question",
      'P(faulty share > 0.4)',
      ['More than 4 in 10 faulty', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Share number line
  // ------------------------------------------------------------

  const SLW = P ? Math.min(5.8, FW - 1.55) : 5.8;
  const SLX = CX - SLW / 2;
  const SLY = P ? -3.20 : -1.70;

  const shareX = p => SLX + p * SLW;

  function shareAxes() {
    const objects = [
      line(
        shareX(0), SLY,
        shareX(1), SLY,
        C.muted, 3
      ),
      txt(
        'Share of faulty seals',
        CX, SLY - 0.87,
        19, C.ink
      )
    ];

    for (let i = 0; i <= 10; i++) {
      const p = i / 10;

      objects.push(
        line(
          shareX(p), SLY - 0.08,
          shareX(p), SLY + 0.08,
          C.muted, 2
        )
      );

      if (i % 2 === 0) {
        objects.push(
          txt(
            i === 0 || i === 10
              ? String(p)
              : p.toFixed(1),
            shareX(p), SLY - 0.33,
            17, C.muted, true
          )
        );
      }
    }

    objects.push(
      glow(shareX(0), SLY, 0.07, C.green),
      glow(shareX(1), SLY, 0.07, C.green),
      txt(
        'None faulty',
        shareX(0) + 0.49,
        SLY - 0.58,
        15, C.green
      ),
      txt(
        'All faulty',
        shareX(1) - 0.40,
        SLY - 0.58,
        15, C.green
      )
    );

    return new M.VGroup(...objects);
  }

  // Fixed illustrative batch shares, not factory observations.

  const BATCH_SHARES = [
    0.12, 0.21, 0.08, 0.17, 0.38,
    0.14, 0.19, 0.06, 0.23, 0.11,
    0.15, 0.20, 0.27, 0.13, 0.09,
    0.18, 0.42, 0.16, 0.22, 0.12,
    0.07, 0.25, 0.29, 0.14, 0.10,
    0.18, 0.31, 0.24, 0.11, 0.15,
    0.36, 0.20, 0.05, 0.16, 0.13,
    0.26, 0.19, 0.44, 0.09, 0.17
  ];

  function batchDots() {
    const binWidth = 0.05;
    const seen = {};

    return BATCH_SHARES.map(p => {
      const bin = Math.floor(p / binWidth);

      const index = seen[bin] || 0;
      seen[bin] = index + 1;

      const y =
        SLY + 0.22 +
        index * (P ? 0.25 : 0.18);

      const color = p > 0.4
        ? C.amber
        : C.cyan;

      return glow(
        shareX(p),
        y,
        P ? 0.069 : 0.058,
        color
      );
    });
  }

  // ------------------------------------------------------------
  // 5 — draw the line from zero to one
  // ------------------------------------------------------------

  await until(S(5));

  const sharesLine5 = shareAxes();

  await play(
    ...replacePicture(sharesLine5),
    ...say('A SHARE LIVES BETWEEN 0 AND 1'),
    ...fbox([
      ['0 = none faulty', C.green],
      ['1 = all faulty', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 6 — each batch becomes a glowing dot
  // ------------------------------------------------------------

  const allBatchDots = batchDots();

  const firstDots = allBatchDots.slice(0, 5);
  const laterDots = allBatchDots.slice(5);

  const dotsLabel6 = txt(
    'Each dot = one batch',
    CX,
    P ? 1.00 : 1.06,
    20, C.ink
  );

  await until(S(6));

  picture.push(dotsLabel6, ...firstDots);

  await play(
    new M.FadeIn(dotsLabel6),
    new M.LaggedStart(
      firstDots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.55,
        runTime: 2.5
      }
    ),
    ...say('ONE DOT = ONE BATCH'),
    ...fbox([
      'Measure each batch',
      'Place its faulty share',
      ['One batch → one dot', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 7 — dots pile near 0.1 and 0.2, a few near 0.4
  // ------------------------------------------------------------

  await until(S(7));

  picture.push(...laterDots);

  await play(
    new M.LaggedStart(
      laterDots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.10,
        runTime: 3.8
      }
    ),
    ...say('MOST BATCHES HAVE SMALL SHARES'),
    ...fbox([
      'Illustrative batch shares',
      ['Many near 0.1–0.2', C.cyan],
      ['A few near 0.4', C.amber]
    ])
  );

  const cluster7 = rounded(
    shareX(0.15),
    SLY + (P ? 1.35 : 0.95),
    shareX(0.25) - shareX(0.05),
    P ? 2.45 : 1.72,
    C.cyan,
    0.025
  );

  const high7 = rounded(
    shareX(0.41),
    SLY + 0.52,
    0.65,
    1.02,
    C.amber,
    0.025
  );

  await play(
    ...replaceOverlay(cluster7, high7)
  );

  // ------------------------------------------------------------
  // 8 — impossible shares outside [0, 1]
  // ------------------------------------------------------------

  const limit8 = new M.VGroup(
    line(
      shareX(0), SLY - 0.08,
      shareX(0), SLY + (P ? 3.55 : 2.42),
      C.green, 3
    ),
    line(
      shareX(1), SLY - 0.08,
      shareX(1), SLY + (P ? 3.55 : 2.42),
      C.green, 3
    ),
    cross(
      shareX(0) - 0.42,
      SLY + 0.48,
      0.15, C.amber
    ),
    cross(
      shareX(1) + 0.42,
      SLY + 0.48,
      0.15, C.amber
    ),
    txt(
      'Valid shares only',
      CX,
      P ? 0.95 : 1.05,
      20, C.green
    )
  );

  await until(S(8));

  await play(
    new M.FadeOut(dotsLabel6),
    ...replaceOverlay(limit8),
    ...say('NOTHING BELOW 0 OR ABOVE 1', C.green),
    ...fbox([
      ['0 ≤ share ≤ 1', C.green],
      'No negative shares',
      'No more than the whole'
    ], C.green)
  );

  picture = picture.filter(o => o !== dotsLabel6);

  // ------------------------------------------------------------
  // Beta density mathematics
  //
  // Integer shape parameters used in this lesson.
  // All probabilities and summary statistics follow the
  // fixed chapter data.
  // ------------------------------------------------------------

  function factorial(n) {
    let result = 1;

    for (let i = 2; i <= n; i++) {
      result *= i;
    }

    return result;
  }

  function betaPDF(x, a, b) {
    if (x < 0 || x > 1) return 0;

    const coefficient =
      factorial(a + b - 1) /
      (
        factorial(a - 1) *
        factorial(b - 1)
      );

    return (
      coefficient *
      Math.pow(x, a - 1) *
      Math.pow(1 - x, b - 1)
    );
  }

  function betaMean(a, b) {
    return a / (a + b);
  }

  function betaMode(a, b) {
    if (a <= 1 || b <= 1) return null;

    return (a - 1) / (a + b - 2);
  }

  function betaSD(a, b) {
    return Math.sqrt(
      a * b /
      (
        Math.pow(a + b, 2) *
        (a + b + 1)
      )
    );
  }

  function choose(n, k) {
    return (
      factorial(n) /
      (
        factorial(k) *
        factorial(n - k)
      )
    );
  }

  // Exact right-tail probability for positive integer a and b.

  function betaSurvival(x, a, b) {
    if (x <= 0) return 1;
    if (x >= 1) return 0;

    const n = a + b - 1;
    let total = 0;

    for (let k = 0; k < a; k++) {
      total +=
        choose(n, k) *
        Math.pow(x, k) *
        Math.pow(1 - x, n - k);
    }

    return total;
  }

  const TAIL_28 = betaSurvival(0.4, 2, 8);
  const TAIL_416 = betaSurvival(0.4, 4, 16);

  const SD_28 = betaSD(2, 8);
  const SD_416 = betaSD(4, 16);

  // ------------------------------------------------------------
  // Density graph
  //
  // The same vertical scale is used for Beta(1,1), Beta(2,8),
  // Beta(8,2), and Beta(4,16), so their heights and widths
  // are visually comparable.
  // ------------------------------------------------------------

  const GX = CX - (P ? 2.75 : 2.72);
  const GY = P ? -4.05 : -2.15;

  const GW = P ? Math.min(5.75, FW - 1.6) : 5.75;
  const GH = P ? 4.65 : 2.90;

  function graphMap(
    minX = 0,
    maxX = 1,
    maxD = 6.0
  ) {
    return {
      minX,
      maxX,
      maxD,

      x: p =>
        GX + (p - minX) / (maxX - minX) * GW,

      y: d =>
        GY + d / maxD * GH
    };
  }

  const G = graphMap();

  const X = G.x;
  const Y = G.y;

  function graphAxes(
    g = G,
    title = 'Density of faulty shares',
    ticks = [0, 0.2, 0.4, 0.6, 0.8, 1],
    axisLabel = 'faulty share'
  ) {
    const objects = [
      line(
        g.x(g.minX), GY,
        g.x(g.maxX), GY,
        C.muted, 3
      ),
      line(
        g.x(g.minX), GY,
        g.x(g.minX), GY + GH,
        C.muted, 2
      ),
      fitText(
        title,
        CX, GY + GH + 0.45,
        22, C.ink
      ),
      txt(
        'density',
        g.x(g.minX) + 0.55,
        GY + GH - 0.27,
        18, C.muted
      )
    ];

    ticks.forEach(p => {
      if (p < g.minX || p > g.maxX) return;

      const label =
        p === 0 || p === 1
          ? String(p)
          : p.toFixed(1);

      objects.push(
        line(
          g.x(p), GY - 0.07,
          g.x(p), GY + 0.07,
          C.muted
        ),
        txt(
          label,
          g.x(p), GY - 0.29,
          16, C.muted, true
        )
      );
    });

    for (const d of [2, 4, 6]) {
      if (d > g.maxD) continue;

      objects.push(
        dashed(
          g.x(g.minX), g.y(d),
          g.x(g.maxX), g.y(d),
          C.muted
        ),
        txt(
          String(d),
          g.x(g.minX) - 0.23,
          g.y(d),
          15, C.muted, true
        )
      );
    }

    objects.push(
      txt(
        axisLabel,
        CX, GY - 0.63,
        17, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  function densityCurve(
    pdf,
    g = G,
    color = C.cyan,
    a = 0,
    b = 1,
    n = 120,
    sw = 4
  ) {
    const segments = [];

    for (let i = 0; i < n; i++) {
      const p1 = a + (b - a) * i / n;
      const p2 = a + (b - a) * (i + 1) / n;

      segments.push(
        line(
          g.x(p1), g.y(pdf(p1)),
          g.x(p2), g.y(pdf(p2)),
          color, sw
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function betaCurve(
    a, b,
    color = C.cyan,
    g = G
  ) {
    return densityCurve(
      p => betaPDF(p, a, b),
      g,
      color,
      0, 1, 140, 4
    );
  }

  function shadedArea(
    a, b,
    pdf,
    g = G,
    color = C.amber,
    opacity = 0.40
  ) {
    a = Math.max(a, g.minX);
    b = Math.min(b, g.maxX);

    const strips = [];

    const n = Math.max(
      10,
      Math.ceil(
        (b - a) /
        (g.maxX - g.minX) *
        180
      )
    );

    const step = (b - a) / n;

    for (let i = 0; i < n; i++) {
      const left = a + i * step;
      const right = left + step;

      const mid = (left + right) / 2;
      const h = g.y(pdf(mid)) - GY;

      if (h <= 0.001) continue;

      strips.push(
        rect(
          (g.x(left) + g.x(right)) / 2,
          GY + h / 2,
          g.x(right) - g.x(left) + 0.001,
          h,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...strips);
  }

  function betaArea(
    a, b,
    left = 0,
    right = 1,
    color = C.amber,
    opacity = 0.40
  ) {
    return shadedArea(
      left,
      right,
      p => betaPDF(p, a, b),
      G,
      color,
      opacity
    );
  }

  function parameterTag(
    a, b,
    color = C.cyan,
    y = GY + GH * 0.84
  ) {
    return tag(
      `a = ${a}     b = ${b}`,
      X(0.71),
      y,
      color,
      18
    );
  }

  function betaPicture(
    a, b,
    color = C.cyan,
    title = 'Density of faulty shares',
    showParams = true
  ) {
    const objects = [
      graphAxes(
        G,
        title,
        [0, 0.2, 0.4, 0.6, 0.8, 1],
        title === 'Density of good shares'
          ? 'good share'
          : 'faulty share'
      ),
      betaCurve(a, b, color)
    ];

    if (showParams) {
      objects.push(
        parameterTag(a, b, color)
      );
    }

    return new M.VGroup(...objects);
  }

  function meanGuide(
    a, b,
    color = C.green,
    label = true,
    height = null
  ) {
    const mean = betaMean(a, b);
    const density = betaPDF(mean, a, b);

    const top = height === null
      ? Y(density)
      : height;

    const objects = [
      dashed(
        X(mean), GY,
        X(mean), top,
        color
      ),
      glow(
        X(mean),
        Y(density),
        0.075,
        color
      )
    ];

    if (label) {
      objects.push(
        txt(
          `Mean = ${mean.toFixed(1)}`,
          X(mean) + (mean > 0.6 ? -0.65 : 0.73),
          top + 0.24,
          17, color
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function peakGuide(
    a, b,
    color = C.amber,
    label = null
  ) {
    const mode = betaMode(a, b);

    if (mode === null) {
      return new M.VGroup(
        txt(
          'Flat density',
          CX, Y(1) + 0.40,
          18, color
        )
      );
    }

    const peakY = Y(betaPDF(mode, a, b));

    return new M.VGroup(
      dashed(
        X(mode), GY,
        X(mode), peakY,
        color
      ),
      glow(
        X(mode), peakY,
        0.075, color
      ),
      (() => {
        const t = txt(label || `Peak = ${mode.toFixed(3)}`, 0, 0, 17, color);
        t.moveTo(pt(X(mode) + 0.1 + t.getWidth() / 2, peakY + 0.5));
        return t;
      })()
    );
  }

  // ------------------------------------------------------------
  // 9 — a density living only between zero and one
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...replacePicture(
      graphAxes(),
      betaArea(2, 8, 0, 1, C.cyan, 0.16),
      betaCurve(2, 8)
    ),
    ...say('A DENSITY BETWEEN 0 AND 1'),
    ...fbox([
      'Density for a share',
      ['Only from 0 to 1', C.green],
      'Total area = 1'
    ])
  );

  // ------------------------------------------------------------
  // 10 — name the beta family
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...say('THE BETA LAW', C.green),
    ...fbox([
      'A family of densities',
      ['The beta law', C.green],
      'For shares between 0 and 1'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 11 — introduce the two shape numbers
  // ------------------------------------------------------------

  const shapeTag11 = tag(
    'Beta(a, b)',
    X(0.70),
    GY + GH * 0.81,
    C.violet,
    22
  );

  const shapeLabels11 = new M.VGroup(
    txt(
      'a',
      X(0.58),
      GY + GH * 0.60,
      26, C.green, true
    ),
    txt(
      'b',
      X(0.80),
      GY + GH * 0.60,
      26, C.amber, true
    ),
    txt(
      'Two shape numbers',
      X(0.69),
      GY + GH * 0.46,
      18, C.ink
    )
  );

  await until(S(11));

  await play(
    ...replaceOverlay(shapeTag11, shapeLabels11),
    ...say('TWO SHAPE NUMBERS: a AND b', C.violet),
    ...fbox([
      'Beta(a, b)',
      ['a = first shape number', C.green],
      ['b = second shape number', C.amber]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 12 — a pulls right, b pulls left
  // ------------------------------------------------------------

  function pullingPicture() {
    const y = P ? -1.65 : -0.58;

    const left = CX - 2.65;
    const right = CX + 2.65;

    return new M.VGroup(
      txt(
        'Two competing pulls',
        CX, y + 1.40,
        22, C.ink
      ),
      line(left, y, right, y, C.muted, 3),
      glow(left, y, 0.09, C.amber),
      glow(right, y, 0.09, C.green),
      txt('0', left, y - 0.36, 20, C.muted, true),
      txt('1', right, y - 0.36, 20, C.muted, true),
      arrow(
        CX - 0.12, y + 0.49,
        right - 0.12, y + 0.49,
        C.green, 5
      ),
      arrow(
        CX + 0.12, y - 0.67,
        left + 0.12, y - 0.67,
        C.amber, 5
      ),
      txt(
        'a pulls right',
        CX + 1.24, y + 0.88,
        20, C.green
      ),
      txt(
        'b pulls left',
        CX - 1.24, y - 1.06,
        20, C.amber
      ),
      txt(
        'Think of their relative sizes',
        CX, y - 1.60,
        17, C.muted
      )
    );
  }

  await until(S(12));

  await play(
    ...replacePicture(pfit(pullingPicture(), 1.25, -2.6)),
    ...say('a → RIGHT     b → LEFT', C.violet),
    ...fbox([
      ['Larger a pulls toward 1', C.green],
      ['Larger b pulls toward 0', C.amber],
      'Relative sizes matter'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 13 — try different parameter pairs
  // ------------------------------------------------------------

  function parameterCards() {
    const y = P ? -1.55 : -0.45;

    const pairs = [
      [1, 1],
      [2, 8],
      [8, 2],
      [4, 16]
    ];

    const colors = [
      C.muted,
      C.cyan,
      C.green,
      C.violet
    ];

    const objects = [
      txt(
        'Change a and b',
        CX, y + 1.43,
        23, C.ink
      )
    ];

    pairs.forEach(([a, b], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);

      const x = CX + (col - 0.5) * 2.62;
      const yy = y + 0.48 - row * 1.25;

      objects.push(
        rounded(
          x, yy,
          2.40, 0.98,
          colors[i], 0.12
        ),
        txt(
          `Beta(${a}, ${b})`,
          x, yy,
          21, colors[i], true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  await until(S(13));

  await play(
    ...replacePicture(pfit(parameterCards(), 1.2, -2.6)),
    ...say('CHANGE THE TWO NUMBERS'),
    ...fbox([
      'Same beta family',
      'Different shapes',
      ['Watch the curve change', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 14 — Beta(1,1) is flat
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...replacePicture(
      graphAxes(
        G,
        'Beta(1, 1): equal pulls'
      ),
      betaArea(1, 1, 0, 1, C.cyan, 0.20),
      betaCurve(1, 1),
      parameterTag(1, 1)
    ),
    ...say('a = 1, b = 1: FLAT'),
    ...fbox([
      'a = 1',
      'b = 1',
      ['Density = 1 everywhere', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 15 — uniform distribution
  // ------------------------------------------------------------

  const uniform15 = new M.VGroup(
    rounded(
      X(0.20),
      GY + (Y(1) - GY) / 2,
      X(0.30) - X(0.10),
      Y(1) - GY,
      C.green,
      0.28
    ),
    rounded(
      X(0.70),
      GY + (Y(1) - GY) / 2,
      X(0.80) - X(0.60),
      Y(1) - GY,
      C.green,
      0.28
    ),
    txt(
      'Equal widths',
      X(0.20),
      Y(1) + 0.30,
      17, C.green
    ),
    txt(
      'Equal areas',
      X(0.70),
      Y(1) + 0.30,
      17, C.green
    ),
    tag(
      'UNIFORM LAW',
      CX,
      GY + GH * 0.55,
      C.green,
      20
    )
  );

  await until(S(15));

  await play(
    ...replaceOverlay(uniform15),
    ...say('BETA(1, 1) = UNIFORM', C.green),
    ...fbox([
      'Flat density',
      'Equal-width intervals',
      ['have equal chances', C.green],
      'Total area = 1'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 16 — Beta(2,8): stronger pull toward zero
  // ------------------------------------------------------------

  await until(S(16));

  const beta28 = betaCurve(2, 8);

  await play(
    ...replacePicture(
      graphAxes(
        G,
        'Beta(2, 8): hump on the left'
      ),
      beta28,
      parameterTag(2, 8)
    ),
    ...say('a = 2, b = 8'),
    ...fbox([
      ['a = 2', C.green],
      ['b = 8', C.amber],
      'b is larger',
      ['Hump near 0', C.cyan]
    ])
  );

  const pull16 = new M.VGroup(
    arrow(
      X(0.78), GY + GH * 0.30,
      X(0.40), GY + GH * 0.30,
      C.amber, 4
    ),
    txt(
      'Stronger left pull',
      X(0.62),
      GY + GH * 0.39,
      18, C.amber
    )
  );

  await play(
    ...replaceOverlay(pull16)
  );

  // ------------------------------------------------------------
  // 17 — peak 0.125, mean 0.2
  // ------------------------------------------------------------

  const peak17 = peakGuide(
    2, 8,
    C.amber,
    'Peak = 0.125'
  );

  const mean17 = meanGuide(
    2, 8,
    C.green,
    false
  );

  const meanLabel17 = new M.VGroup(
    txt(
      'Mean = 0.2',
      X(0.52),
      GY + GH * 0.45,
      18, C.green
    ),
    arrow(
      X(0.43), GY + GH * 0.40,
      X(0.2) + 0.10,
      Y(betaPDF(0.2, 2, 8)) - 0.08,
      C.green, 2
    )
  );

  await until(S(17));

  await play(
    ...replaceOverlay(
      peak17,
      mean17,
      meanLabel17
    ),
    ...say('PEAK 0.125 — MEAN 0.2', C.amber),
    ...fbox([
      ['Peak = 0.125', C.amber],
      'A little above 0.1',
      ['Mean = 0.2', C.green]
    ])
  );

  // ------------------------------------------------------------
  // 18 — mean formula
  // ------------------------------------------------------------

  function meanFormulaPicture(a, b) {
    const y = P ? -1.45 : -0.42;

    const total = a + b;
    const mean = betaMean(a, b);

    const width = 5.25;

    const left = CX - width / 2;
    const right = CX + width / 2;

    const split = left + width * mean;

    const objects = [
      txt(
        'The mean depends on the ratio',
        CX, y + 1.38,
        21, C.ink
      ),
      rect(
        (left + split) / 2,
        y,
        split - left,
        0.69,
        C.green,
        0.62
      ),
      rect(
        (split + right) / 2,
        y,
        right - split,
        0.69,
        C.amber,
        0.46
      ),
      txt(
        `a = ${a}`,
        (left + split) / 2,
        y + 0.58,
        18, C.green, true
      ),
      txt(
        `b = ${b}`,
        (split + right) / 2,
        y + 0.58,
        18, C.amber, true
      ),
      bracket(
        left, right,
        y - 0.60,
        `a + b = ${total}`,
        C.cyan
      ),
      tag(
        `${a}/${total} = ${mean.toFixed(1)}`,
        CX,
        y - 1.43,
        C.green, 22
      )
    ];

    return new M.VGroup(...objects);
  }

  await until(S(18));

  await play(
    ...replacePicture(
      meanFormulaPicture(2, 8)
    ),
    ...say('MEAN = a ÷ (a + b)', C.green),
    ...fbox([
      'mean = a/(a + b)',
      '     = 2/(2 + 8)',
      '     = 2/10',
      ['     = 0.2', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 19 — swap the two numbers: mirror image
  // ------------------------------------------------------------

  await until(S(19));

  const swapAxes19 = graphAxes(
    G,
    'Swap a and b'
  );

  const swapOld19 = betaCurve(
    2, 8,
    C.cyan
  );

  const swapTarget19 = betaCurve(
    8, 2,
    C.green
  );

  const mirror19 = dashed(
    X(0.5), GY,
    X(0.5), GY + GH * 0.94,
    C.violet
  );

  const oldLabel19 = txt(
    'Beta(2, 8)',
    X(0.24),
    GY + GH * 0.86,
    18, C.cyan
  );

  await play(
    ...replacePicture(
      swapAxes19,
      swapOld19,
      mirror19,
      oldLabel19
    ),
    ...say('SWAP THE TWO NUMBERS', C.violet),
    ...fbox([
      'Before: a = 2, b = 8',
      ['After:  a = 8, b = 2', C.green]
    ], C.violet)
  );

  const newLabel19 = txt(
    'Beta(8, 2)',
    X(0.76),
    GY + GH * 0.86,
    18, C.green
  );

  await play(
    new M.Transform(
      swapOld19,
      swapTarget19
    ),
    new M.FadeOut(oldLabel19),
    new M.FadeIn(newLabel19)
  );

  picture = [
    swapAxes19,
    swapOld19,
    mirror19,
    newLabel19
  ];

  // ------------------------------------------------------------
  // 20 — mean 0.8, good seals instead of faulty seals
  // ------------------------------------------------------------

  await until(S(20));

  const goodMean20 = meanGuide(
    8, 2,
    C.green,
    false
  );

  const goodLabel20 = new M.VGroup(
    txt(
      'Mean = 0.8',
      X(0.43),
      GY + GH * 0.52,
      19, C.green
    ),
    arrow(
      X(0.54), GY + GH * 0.48,
      X(0.8) - 0.10,
      Y(betaPDF(0.8, 8, 2)),
      C.green, 2
    )
  );

  await play(
    ...replacePicture(
      graphAxes(
        G,
        'Density of good shares',
        [0, 0.2, 0.4, 0.6, 0.8, 1],
        'good share'
      ),
      betaCurve(8, 2, C.green)
    ),
    ...replaceOverlay(
      goodMean20,
      goodLabel20
    ),
    ...say('GOOD SHARE = 1 − FAULTY SHARE', C.green),
    ...fbox([
      'mean = 8/(8 + 2)',
      '     = 8/10',
      ['     = 0.8', C.green],
      'Good seals instead of faulty'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 21 — double both parameters
  // ------------------------------------------------------------

  await until(S(21));

  const doubleAxes21 = graphAxes(
    G,
    'Double both shape numbers'
  );

  const doubleOld21 = betaCurve(
    2, 8,
    C.cyan
  );

  const doubleTarget21 = betaCurve(
    4, 16,
    C.violet
  );

  const doubleTag21 = parameterTag(
    2, 8,
    C.cyan
  );

  await play(
    ...replacePicture(
      doubleAxes21,
      doubleOld21,
      doubleTag21
    ),
    ...say('DOUBLE BOTH a AND b', C.violet),
    ...fbox([
      'a: 2 × 2 = 4',
      'b: 8 × 2 = 16',
      ['Beta(4, 16)', C.violet]
    ], C.violet)
  );

  const doubledTag21 = parameterTag(
    4, 16,
    C.violet
  );

  await play(
    new M.Transform(
      doubleOld21,
      doubleTarget21
    ),
    new M.FadeOut(doubleTag21),
    new M.FadeIn(doubledTag21)
  );

  picture = [
    doubleAxes21,
    doubleOld21,
    doubledTag21
  ];

  // ------------------------------------------------------------
  // 22 — the mean is unchanged
  // ------------------------------------------------------------

  function sameMeanPicture() {
    const top = P ? 0.00 : 0.27;
    const bottom = P ? -2.35 : -1.43;

    const w = 5.2;
    const left = CX - w / 2;
    const split = left + w * 0.2;
    const right = left + w;

    function row(y, a, b, color) {
      return new M.VGroup(
        txt(
          `Beta(${a}, ${b})`,
          CX, y + 0.59,
          19, color, true
        ),
        rect(
          (left + split) / 2,
          y,
          split - left,
          0.50,
          C.green, 0.65
        ),
        rect(
          (split + right) / 2,
          y,
          right - split,
          0.50,
          C.amber, 0.40
        ),
        txt(
          `${a}/${a + b} = 0.2`,
          CX, y - 0.48,
          18, C.green, true
        )
      );
    }

    return new M.VGroup(
      row(top, 2, 8, C.cyan),
      row(bottom, 4, 16, C.violet),
      dashed(
        split, bottom - 0.25,
        split, top + 0.25,
        C.green
      )
    );
  }

  await until(S(22));

  await play(
    ...replacePicture(sameMeanPicture()),
    ...say('THE MEAN IS STILL 0.2', C.green),
    ...fbox([
      'Before: 2/10 = 0.2',
      'After:  4/20 = 0.2',
      ['Same ratio, same mean', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 23 — compare the widths on the same graph
  // ------------------------------------------------------------

  function comparisonCurves(
    title = 'Same mean, different spread',
    showSpread = true
  ) {
    const objects = [
      graphAxes(G, title),
      betaCurve(2, 8, C.cyan),
      betaCurve(4, 16, C.violet),
      dashed(
        X(0.2), GY,
        X(0.2),
        Y(betaPDF(0.2, 4, 16)),
        C.green
      ),
      txt(
        'Beta(2, 8)',
        X(0.72),
        GY + GH * 0.86,
        18, C.cyan
      ),
      txt(
        'Beta(4, 16)',
        X(0.72),
        GY + GH * 0.72,
        18, C.violet
      ),
      txt(
        'Mean = 0.2',
        X(0.71),
        GY + GH * 0.56,
        18, C.green
      ),
      glow(
        X(0.2),
        Y(betaPDF(0.2, 2, 8)),
        0.065,
        C.cyan
      ),
      glow(
        X(0.2),
        Y(betaPDF(0.2, 4, 16)),
        0.065,
        C.violet
      )
    ];

    if (showSpread) {
      objects.push(
        txt(
          'Narrower and taller',
          X(0.72),
          GY + GH * 0.40,
          17, C.violet
        ),
        arrow(
          X(0.57),
          GY + GH * 0.36,
          X(0.29),
          Y(betaPDF(0.29, 4, 16)),
          C.violet, 2
        )
      );
    }

    return new M.VGroup(...objects);
  }

  await until(S(23));

  await play(
    ...replacePicture(
      comparisonCurves()
    ),
    ...say('BIGGER a + b → LESS VARIATION', C.violet),
    ...fbox([
      ['Beta(2, 8): a + b = 10', C.cyan],
      ['SD ≈ 0.12', C.cyan],
      ['Beta(4, 16): a + b = 20', C.violet],
      ['SD ≈ 0.087', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 24 — return to the manager's original question
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...replacePicture(
      betaPicture(
        2, 8,
        C.cyan,
        'Model for the factory records'
      )
    ),
    ...say("RETURN TO THE MANAGER'S QUESTION", C.amber),
    ...fbox([
      'Assume Beta(2, 8)',
      'Mean faulty share = 0.2',
      ['P(share > 0.4) = ?', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Tail guides
  // ------------------------------------------------------------

  function tailGuide(
    a, b,
    threshold = 0.4,
    label = '0.4',
    color = C.amber
  ) {
    const h = Y(betaPDF(threshold, a, b));

    return new M.VGroup(
      dashed(
        X(threshold), GY,
        X(threshold), GY + GH * 0.70,
        color
      ),
      glow(
        X(threshold), h,
        0.07, color
      ),
      txt(
        label,
        X(threshold),
        GY + GH * 0.75,
        18, color, true
      )
    );
  }

  function tailCallout(
    a, b,
    label,
    color = C.amber
  ) {
    const p = 0.49;

    return new M.VGroup(
      tag(
        label,
        X(0.73),
        GY + GH * 0.48,
        color,
        20
      ),
      arrow(
        X(0.68),
        GY + GH * 0.38,
        X(p),
        Y(betaPDF(p, a, b)) + 0.06,
        color,
        2
      )
    );
  }

  // ------------------------------------------------------------
  // 25 — shade to the right of 0.4
  // ------------------------------------------------------------

  await until(S(25));

  const tail25 = betaArea(
    2, 8,
    0.4, 1,
    C.amber,
    0.62
  );

  await play(
    ...replacePicture(
      graphAxes(
        G,
        'Chance of a faulty share above 0.4'
      ),
      tail25,
      betaCurve(2, 8)
    ),
    ...replaceOverlay(
      tailGuide(2, 8),
      new M.VGroup(
        txt(
          'Area to the right',
          X(0.73),
          GY + GH * 0.48,
          18, C.amber
        ),
        arrow(
          X(0.67),
          GY + GH * 0.39,
          X(0.49),
          Y(betaPDF(0.49, 2, 8)) + 0.07,
          C.amber, 2
        )
      )
    ),
    ...say('SHADE THE AREA RIGHT OF 0.4', C.amber),
    ...fbox([
      'P(share > 0.4)',
      ['= shaded right-tail area', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 26 — probability 0.071, about seven batches in a hundred
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...replaceOverlay(
      tailGuide(2, 8),
      tailCallout(
        2, 8,
        'ABOUT 7%',
        C.amber
      )
    ),
    ...say('ABOUT 7 BATCHES IN 100', C.amber),
    ...fbox([
      'Beta(2, 8)',
      'P(share > 0.4)',
      `= ${TAIL_28.toFixed(3)}`,
      ['≈ 7 percent', C.amber]
    ], C.amber)
  );

  // A hundred dots illustrate the rounded probability,
  // not the outcome of an actual hundred-batch experiment.

  function hundredBatches(
    bad,
    a,
    b,
    probability,
    color = C.amber
  ) {
    const top = P ? 0.55 : 0.56;
    const dx = P ? 0.43 : 0.43;
    const dy = P ? 0.39 : 0.26;

    const radius = P ? 0.09 : 0.073;

    const order = Array.from(
      { length: 100 },
      (_, i) => (i * 37) % 100
    );

    const badSet = new Set(order.slice(0, bad));

    const objects = [
      txt(
        `Beta(${a}, ${b})`,
        CX, top + 0.48,
        20, C.ink
      )
    ];

    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);

      const x = CX + (col - 4.5) * dx;
      const y = top - row * dy;

      objects.push(
        glow(
          x, y,
          radius,
          badSet.has(i)
            ? color
            : C.cyan
        )
      );
    }

    const ly = top - 9 * dy - 0.47;

    objects.push(
      txt(
        `About ${bad} in 100 above 0.4`,
        CX, ly,
        19, color
      ),
      txt(
        'Illustrative expected frequency',
        CX, ly - 0.37,
        15, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(26) + 2.5);

  await play(
    ...replacePicture(
      hundredBatches(
        7, 2, 8,
        TAIL_28
      )
    )
  );

  // ------------------------------------------------------------
  // 27 — Beta(4,16): the same tail is about two percent
  // ------------------------------------------------------------

  await until(S(27));

  const tail27 = betaArea(
    4, 16,
    0.4, 1,
    C.amber,
    0.70
  );

  await play(
    ...replacePicture(
      graphAxes(
        G,
        'Beta(4, 16): a smaller right tail'
      ),
      tail27,
      betaCurve(4, 16, C.violet)
    ),
    ...replaceOverlay(
      tailGuide(4, 16),
      tailCallout(
        4, 16,
        'ABOUT 2%',
        C.amber
      )
    ),
    ...say('NARROWER CURVE — ONLY ABOUT 2%', C.violet),
    ...fbox([
      'Beta(4, 16)',
      'P(share > 0.4)',
      `= ${TAIL_416.toFixed(3)}`,
      ['≈ 2 percent', C.amber]
    ], C.violet)
  );

  await until(S(27) + 3.4);

  await play(
    ...replacePicture(
      hundredBatches(
        2, 4, 16,
        TAIL_416
      )
    )
  );

  // ------------------------------------------------------------
  // 28 — same mean, fewer batches above the threshold
  // ------------------------------------------------------------

  function riskComparison() {
    const top = P ? -0.6 : 0.25;
    const bottom = P ? -3.2 : -1.42;

    const maxWidth = P ? 6.2 : 5.15;
    const left = CX - maxWidth / 2;

    function row(y, a, b, chance, color) {
      // labelled 0% to 10% scale under each bar
      const w =
        maxWidth * chance / 0.10;

      const scale = [0, 5, 10].flatMap(v => [
        line(left + maxWidth * v / 10, y - 0.25, left + maxWidth * v / 10, y - 0.33, C.muted, 2),
        txt(`${v}%`, left + maxWidth * v / 10, y - 0.55, P ? 20 : 18, C.muted, true)
      ]);

      return new M.VGroup(
        txt(
          `Beta(${a}, ${b}): ${(chance * 100).toFixed(1)}% above 0.4`,
          CX, y + 0.6,
          20, color, true
        ),
        rounded(
          CX, y,
          maxWidth, 0.46,
          C.muted, 0.07
        ),
        rect(
          left + w / 2,
          y,
          w, 0.39,
          color, 0.72
        ),
        ...scale
      );
    }

    return new M.VGroup(
      row(
        top,
        2, 8,
        TAIL_28,
        C.cyan
      ),
      row(
        bottom,
        4, 16,
        TAIL_416,
        C.violet
      ),
      txt(
        'Both mean faulty shares = 0.2',
        CX,
        P ? -4.5 : -2.47,
        P ? 20 : 18, C.green
      )
    );
  }

  await until(S(28));

  await play(
    ...replacePicture(riskComparison()),
    ...say('SAME MEAN — FEWER BAD BATCHES', C.green),
    ...fbox([
      'Both means = 0.2',
      ['Beta(2, 8):  7.1%', C.cyan],
      ['Beta(4,16):  2.3%', C.violet],
      'Less variation, smaller tail'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 29 — the short mathematical version
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...replacePicture(
      betaPicture(
        2, 8,
        C.cyan,
        'A beta density',
        false
      )
    ),
    ...say('THE SHORT VERSION'),
    ...fbox([
      'A share between 0 and 1',
      'Two shape numbers',
      ['One beta law', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 30 — share follows Beta(a,b), mean = a/(a+b)
  // ------------------------------------------------------------

  const short30 = new M.VGroup(
    tag(
      'Beta(a, b)',
      X(0.72),
      GY + GH * 0.79,
      C.violet, 22
    ),
    txt(
      'mean = a/(a + b)',
      X(0.68),
      GY + GH * 0.55,
      18, C.green, true
    ),
    meanGuide(2, 8, C.green, false)
  );

  await until(S(30));

  await play(
    ...replaceOverlay(short30),
    ...say('THE BETA FORMULA', C.violet),
    ...fbox([
      'X follows Beta(a, b)',
      ['0 ≤ X ≤ 1', C.cyan],
      ['mean = a/(a + b)', C.green],
      'a > 0, b > 0'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 31 — relative sizes set location, total sets concentration
  // ------------------------------------------------------------

  function parameterSummary() {
    const top = P ? -0.05 : 0.25;
    const bottom = P ? -2.55 : -1.52;

    const left = CX - 2.65;
    const right = CX + 2.65;

    const objects = [
      txt(
        'Relative sizes set the mean',
        CX, top + 0.83,
        20, C.ink
      ),
      line(left, top, right, top, C.muted, 3),
      glow(left, top, 0.075, C.amber),
      glow(right, top, 0.075, C.green),
      arrow(
        CX + 0.12, top + 0.28,
        left + 0.28, top + 0.28,
        C.amber, 3
      ),
      arrow(
        CX - 0.12, top - 0.28,
        right - 0.28, top - 0.28,
        C.green, 3
      ),
      txt(
        'b → left',
        CX - 1.70, top + 0.51,
        17, C.amber
      ),
      txt(
        'a → right',
        CX + 1.70, top - 0.52,
        17, C.green
      ),
      txt(
        'Total sets concentration',
        CX, bottom + 0.88,
        20, C.ink
      ),
      line(left, bottom, right, bottom, C.muted, 2)
    ];

    const wide = rounded(
      CX, bottom,
      4.75, 0.60,
      C.cyan, 0.09
    );

    const narrow = rounded(
      CX, bottom,
      2.25, 0.44,
      C.violet, 0.30
    );

    objects.push(
      wide,
      narrow,
      glow(CX, bottom, 0.075, C.green),
      txt(
        'Larger a + b → narrower',
        CX, bottom - 0.64,
        18, C.violet
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(31));

  await play(
    ...replacePicture(pfit(parameterSummary(), 1.2, -2.6)),
    ...say('WHERE IT SITS — HOW NARROW IT IS'),
    ...fbox([
      ['a/(a + b): mean', C.green],
      ['a + b: concentration', C.violet],
      'At the same mean,',
      'larger total → less variation'
    ])
  );

  // ------------------------------------------------------------
  // 32 — applications for shares between zero and one
  // ------------------------------------------------------------

  function proportionApplications() {
    const y = P ? -1.65 : -0.50;

    const left = CX - 2.65;
    const right = CX + 2.65;

    const positions = [
      0.08, 0.16, 0.25,
      0.39, 0.56, 0.76, 0.91
    ];

    const objects = [
      txt(
        'Any share or proportion',
        CX, y + 1.40,
        22, C.ink
      ),
      rounded(
        CX, y,
        right - left,
        0.55,
        C.green, 0.08
      ),
      line(left, y, right, y, C.muted, 3),
      txt('0', left, y - 0.49, 20, C.muted, true),
      txt('1', right, y - 0.49, 20, C.muted, true)
    ];

    positions.forEach((p, i) => {
      objects.push(
        glow(
          left + p * (right - left),
          y,
          0.09,
          i % 2 === 0
            ? C.cyan
            : C.violet
        )
      );
    });

    objects.push(
      tag(
        'BETWEEN NONE AND ALL',
        CX, y - 1.15,
        C.green, 18
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(32));

  await play(
    ...replacePicture(pfit(proportionApplications(), 1.2, -2.6)),
    ...say('USE IT FOR SHARES AND PROPORTIONS', C.green),
    ...fbox([
      'Share or proportion',
      ['Between 0 and 1', C.green],
      'Beta is a flexible model'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 33 — defect shares, click shares, success rates
  // ------------------------------------------------------------

  function applicationRows() {
    const top = P ? 0.40 : 0.60;
    const dy = P ? 1.68 : 1.24;

    const rows = [
      {
        title: 'DEFECT SHARE',
        count: 2,
        color: C.amber
      },
      {
        title: 'CUSTOMERS WHO CLICK',
        count: 4,
        color: C.cyan
      },
      {
        title: 'SUCCESS RATE',
        count: 8,
        color: C.green
      }
    ];

    const objects = [];

    rows.forEach((row, i) => {
      const y = top - i * dy;

      objects.push(
        txt(
          row.title,
          CX, y + 0.50,
          18, row.color
        )
      );

      for (let j = 0; j < 10; j++) {
        const x = CX + (j - 4.5) * 0.49;

        objects.push(
          glow(
            x, y,
            0.105,
            j < row.count
              ? row.color
              : C.muted
          )
        );
      }

      objects.push(
        txt(
          `${row.count}/10 = ${(row.count / 10).toFixed(1)}`,
          CX, y - 0.37,
          17, row.color, true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  await until(S(33));

  await play(
    ...replacePicture(applicationRows()),
    ...say('DEFECTS, CLICKS, SUCCESSES'),
    ...fbox([
      'Examples of shares',
      'Faulty seals',
      'Customers who click',
      ['Successful attempts', C.green]
    ])
  );

  // ------------------------------------------------------------
  // 34 — beta distributions can describe uncertainty
  // about an unknown share
  // ------------------------------------------------------------

  function uncertaintyPicture() {
    const objects = [
      graphAxes(
        G,
        'Uncertainty about an unknown share',
        [0, 0.2, 0.4, 0.6, 0.8, 1],
        'possible true share'
      ),
      betaArea(
        4, 16,
        0, 1,
        C.violet,
        0.22
      ),
      betaCurve(
        4, 16,
        C.violet
      ),
      tag(
        'TRUE SHARE = ?',
        X(0.73),
        GY + GH * 0.79,
        C.amber,
        18
      ),
      txt(
        'More plausible values',
        X(0.66),
        GY + GH * 0.52,
        17, C.violet
      ),
      arrow(
        X(0.52),
        GY + GH * 0.47,
        X(0.24),
        Y(betaPDF(0.24, 4, 16)) - 0.07,
        C.violet, 2
      )
    ];

    return new M.VGroup(...objects);
  }

  await until(S(34));

  await play(
    ...replacePicture(pfit(uncertaintyPicture(), 1.2, -2.6)),
    ...say('HOW SURE ARE WE ABOUT A SHARE?', C.violet),
    ...fbox([
      'An unknown true share',
      'Different possible values',
      ['Beta can express uncertainty', C.violet],
      'More on this later'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 35–36 — common trap: normal densities spill outside
  // the valid range of a proportion
  // ------------------------------------------------------------

  const GN = graphMap(
    -0.4,
    1.2,
    6.0
  );

  const NORMAL_MEAN = 0.1;
  const NORMAL_SD = 0.12;

  function normalPDF(x) {
    const z =
      (x - NORMAL_MEAN) /
      NORMAL_SD;

    return (
      Math.exp(-0.5 * z * z) /
      (
        NORMAL_SD *
        Math.sqrt(2 * Math.PI)
      )
    );
  }

  function normalTrapAxes() {
    return graphAxes(
      GN,
      'A normal bell near zero',
      [-0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1, 1.2],
      'possible share'
    );
  }

  function normalTrapPicture(shade = false) {
    const objects = [
      rect(
        (GN.x(0) + GN.x(1)) / 2,
        GY + GH / 2,
        GN.x(1) - GN.x(0),
        GH,
        C.green,
        0.035,
        0
      ),
      normalTrapAxes()
    ];

    if (shade) {
      objects.push(
        shadedArea(
          GN.minX, 0,
          normalPDF,
          GN,
          C.amber,
          0.68
        )
      );
    }

    objects.push(
      densityCurve(
        normalPDF,
        GN,
        C.cyan,
        GN.minX,
        GN.maxX,
        150,
        4
      ),
      dashed(
        GN.x(0), GY,
        GN.x(0), GY + GH * 0.90,
        C.green
      ),
      dashed(
        GN.x(1), GY,
        GN.x(1), GY + GH * 0.90,
        C.green
      ),
      txt(
        'Valid range: 0 to 1',
        GN.x(0.58),
        GY + GH * 0.82,
        18, C.green
      )
    );

    if (shade) {
      objects.push(
        cross(
          GN.x(-0.19),
          GY + GH * 0.32,
          0.16,
          C.amber
        ),
        txt(
          'Impossible',
          GN.x(-0.19),
          GY + GH * 0.46,
          17, C.amber
        ),
        arrow(
          GN.x(-0.17),
          GY + GH * 0.26,
          GN.x(-0.035),
          GN.y(normalPDF(-0.035)) + 0.05,
          C.amber, 2
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // 35 — introduce the trap

  await until(S(35));

  await play(
    ...replacePicture(
      normalTrapPicture(false)
    ),
    ...say('TRAP: A NORMAL BELL FOR SHARES', C.amber),
    ...fbox([
      'A normal bell',
      'extends in both directions',
      ['Shares have hard boundaries', C.amber]
    ], C.amber)
  );

  // 36 — show the impossible negative area

  await until(S(36));

  await play(
    ...replacePicture(
      normalTrapPicture(true)
    ),
    ...say('NEGATIVE SHARES ARE IMPOSSIBLE', C.amber),
    ...fbox([
      'Normal bell spills below 0',
      ['Impossible negative shares', C.amber],
      'Beta stays inside [0, 1]'
    ], C.amber)
  );

  await until(S(36) + 2.7);

  await play(
    ...replacePicture(
      graphAxes(
        G,
        'Beta respects both boundaries'
      ),
      betaArea(
        2, 8,
        0, 1,
        C.green,
        0.20
      ),
      betaCurve(
        2, 8,
        C.cyan
      ),
      dashed(
        X(0), GY,
        X(0), GY + GH * 0.90,
        C.green
      ),
      dashed(
        X(1), GY,
        X(1), GY + GH * 0.90,
        C.green
      )
    ),
    ...say('BETA STAYS BETWEEN 0 AND 1', C.green),
    ...fbox([
      ['Beta: no negative shares', C.green],
      ['No shares above 1', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 37 — preview the lognormal law
  // ------------------------------------------------------------

  function multiplicationPreview() {
    const y = P ? -1.65 : -0.47;

    const values = [
      100, 200, 400
    ];

    const xs = [
      CX - 1.96,
      CX,
      CX + 1.96
    ];

    const colors = [
      C.cyan,
      C.green,
      C.violet
    ];

    const objects = [
      txt(
        'What if effects multiply?',
        CX, y + 1.43,
        22, C.ink
      )
    ];

    values.forEach((v, i) => {
      objects.push(
        rounded(
          xs[i], y,
          1.42, 0.90,
          colors[i],
          0.22
        ),
        txt(
          String(v),
          xs[i], y + 0.08,
          25, colors[i], true
        ),
        txt(
          'days',
          xs[i], y - 0.24,
          15, colors[i]
        )
      );
    });

    for (let i = 0; i < 2; i++) {
      objects.push(
        arrow(
          xs[i] + 0.77, y,
          xs[i + 1] - 0.77, y,
          C.amber, 2
        ),
        txt(
          '×2',
          (xs[i] + xs[i + 1]) / 2,
          y + 0.49,
          19, C.amber, true
        )
      );
    }

    objects.push(
      txt(
        'Multiply rather than add',
        CX, y - 0.89,
        19, C.violet
      ),
      tag(
        'NEXT: LOGNORMAL',
        CX, y - 1.49,
        C.violet,
        18
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(37));

  await play(
    ...replacePicture(pfit(multiplicationPreview(), 1.2, -2.6)),
    ...say('NEXT: A CURVE MADE BY MULTIPLYING', C.violet),
    ...fbox([
      'Instead of adding effects',
      'multiply them',
      ['Next: the lognormal law', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 38 — final one-sentence recap
  // ------------------------------------------------------------

  await until(S(38));

  const finalAxes = graphAxes(
    G,
    'The beta law'
  );

  const finalFill = betaArea(
    2, 8,
    0, 1,
    C.cyan,
    0.13
  );

  const finalCurve28 = betaCurve(
    2, 8,
    C.cyan
  );

  const finalCurve416 = betaCurve(
    4, 16,
    C.violet
  );

  const finalMean = dashed(
    X(0.2), GY,
    X(0.2),
    Y(betaPDF(0.2, 4, 16)),
    C.green
  );

  const finalTag1 = tag(
    'Beta(2, 8)',
    X(0.73),
    GY + GH * 0.88,
    C.cyan,
    17
  );

  const finalTag2 = tag(
    'Beta(4, 16)',
    X(0.73),
    GY + GH * 0.72,
    C.violet,
    17
  );

  const finalLocation = tag(
    'MEAN = 0.2',
    X(0.73),
    GY + GH * 0.52,
    C.green,
    16
  );

  const finalConcentration = new M.VGroup(
    txt(
      'Larger a + b',
      X(0.72),
      GY + GH * 0.25,
      17, C.violet
    ),
    txt(
      'Narrower curve',
      X(0.72),
      GY + GH * 0.15,
      17, C.violet
    )
  );

  const finalBounds = new M.VGroup(
    glow(
      X(0), GY,
      0.075,
      C.green
    ),
    glow(
      X(1), GY,
      0.075,
      C.green
    )
  );

  await play(
    ...replacePicture(
      finalAxes,
      finalFill,
      finalCurve28,
      finalCurve416,
      finalMean,
      finalTag1,
      finalTag2,
      finalLocation,
      finalConcentration,
      finalBounds
    ),
    ...say('BETA: SHARES BETWEEN 0 AND 1', C.green),
    ...fbox([
      'X follows Beta(a, b)',
      ['0 ≤ X ≤ 1', C.green],
      ['mean = a/(a + b)', C.cyan],
      ['a + b sets concentration', C.violet]
    ], C.green)
  );

  await until(S(38) + 2.4);

  await play(
    new M.Indicate(
      finalLocation,
      { color: C.green }
    ),
    ...say('THE RATIO SETS THE MEAN', C.green)
  );

  await until(S(38) + 4.5);

  await play(
    new M.Indicate(
      finalConcentration,
      { color: C.violet }
    ),
    ...say('THE TOTAL SETS CONCENTRATION', C.violet)
  );

  await until(S(38) + 6.1);

  await play(
    ...say('TWO NUMBERS. SHARES FROM 0 TO 1.', C.cyan)
  );
}

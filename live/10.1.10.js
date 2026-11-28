// lesson 10.1.10
// Prediction intervals: uncertainty about the mean versus one new case.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API and shared chapter data.
// Intervals use the conventional regression assumptions from the narration.
// As discussed in lesson 10.1.9, those assumptions need checking.
// Browser playback and device layouts have not been runtime-tested.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Shared chapter data, in building X, Y, Z order.

  const AREAS = [40, 60, 80, 100];

  const BUILDINGS = ['X', 'Y', 'Z'];

  const RENTS = {
    X: [860, 1040, 1250, 1470],
    Y: [770, 1020, 1210, 1380],
    Z: [770, 940, 1140, 1350]
  };

  const DATA = AREAS.flatMap((area, k) =>
    BUILDINGS.map(b => ({
      area,
      rent: RENTS[b][k],
      building: b
    }))
  );

  const N = 12;
  const MEAN_AREA = 70;
  const MEAN_RENT = 1100;

  const INTERCEPT = 400;
  const SLOPE = 10;

  const SSE = 25000;
  const DF = N - 2;
  const RSE = Math.sqrt(SSE / DF);

  const SXX = 6000;
  const MULTIPLIER = 2.23;

  const NEW_AREA = 70;
  const ASKING = 1180;

  const fitted = a => INTERCEPT + SLOPE * a;

  const meanSE = a =>
    RSE * Math.sqrt(
      1 / N + Math.pow(a - MEAN_AREA, 2) / SXX
    );

  const predictionSE = a =>
    Math.sqrt(
      Math.pow(meanSE(a), 2) + Math.pow(RSE, 2)
    );

  const meanMargin = a =>
    MULTIPLIER * meanSE(a);

  const predictionMargin = a =>
    MULTIPLIER * predictionSE(a);

  const meanLow = a =>
    fitted(a) - meanMargin(a);

  const meanHigh = a =>
    fitted(a) + meanMargin(a);

  const predictionLow = a =>
    fitted(a) - predictionMargin(a);

  const predictionHigh = a =>
    fitted(a) + predictionMargin(a);

  const PREDICTED = fitted(NEW_AREA);

  const MEAN_SE = meanSE(NEW_AREA);
  const PREDICTION_SE = predictionSE(NEW_AREA);

  const MEAN_MARGIN = Math.round(meanMargin(NEW_AREA));
  const PREDICTION_MARGIN = Math.round(predictionMargin(NEW_AREA));

  const CI_LOW = Math.round(meanLow(NEW_AREA));
  const CI_HIGH = Math.round(meanHigh(NEW_AREA));

  const PI_LOW = Math.round(predictionLow(NEW_AREA));
  const PI_HIGH = Math.round(predictionHigh(NEW_AREA));

  const PINK = C.pink || '#F472B6';

  const BC = {
    X: C.cyan,
    Y: C.amber,
    Z: PINK
  };

  const MEAN_COLOR = C.cyan;
  const NOISE_COLOR = C.amber;
  const PRED_COLOR = C.violet;
  const ASK_COLOR = C.green;

  // Laptop: picture left, formula box right.
  // Phone: picture above, formula box below.

  const CX = P ? 0 : -2.6;
  const CY = P ? 0.45 : -0.35;

  const W = P ? FW - 1.3 : 7.2;

  const PILL = P ? [0, 3.75, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.0, 0] : [4.3, -0.3, 0];

  const pt = (x, y) => [x, y, 0];
  const local = (x, y) => pt(CX + x, CY + y);

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fmt = v => Math.round(v).toLocaleString('en-US');
  const money = v => `$${fmt(v)}`;

  function txt(s, size, color, p, mono = false, maxw = null) {
    const t = T(s, size, color, mono);

    if (maxw && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

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

  function dot(p, radius = 0.085, color = C.cyan) {
    return new M.Dot({
      point: p,
      radius,
      color
    });
  }

  function glowDot(p, color = C.cyan, radius = 0.085) {
    const halo = dot(p, radius * 1.95, color);
    halo.setFill(color, 0.17);

    const d = dot(p, radius, color);

    return new M.VGroup(halo, d);
  }

  function circle(p, radius, color, opacity = 0) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo(p);

    return c;
  }

  function rect(w, h, p, color, opacity = 0.8, sw = 1) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
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

  function arrow(a, b, color = C.cyan, strokeWidth = 3) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.hypot(dx, dy);

    if (len < 0.00001) {
      return dot(a, 0.04, color);
    }

    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(0.17, len * 0.35);
    const w = h * 0.5;

    const back = pt(
      b[0] - ux * h,
      b[1] - uy * h
    );

    const left = pt(
      back[0] - uy * w,
      back[1] + ux * w
    );

    const right = pt(
      back[0] + uy * w,
      back[1] - ux * w
    );

    return new M.VGroup(
      line(a, b, color, strokeWidth),
      line(left, b, color, strokeWidth),
      line(right, b, color, strokeWidth)
    );
  }

  // Formula box: same structure as the approved reference.
  // Leading spaces indent monospaced rows.

  let boxNow = null;

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

      return t.getWidth() +
        cw * (s.length - s.trimStart().length);
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
    const maxh = P ? 2.65 : 4.0;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  // Picture management.
  // All groups are constructed before appearing on screen.
  // Visible objects are never reparented into new VGroups.

  let visible = [];

  function clearPicture() {
    const a = visible.map(g => new M.FadeOut(g));
    visible = [];
    return a;
  }

  function picture(...groups) {
    const a = clearPicture();

    groups.forEach(g => {
      visible.push(g);
      a.push(new M.FadeIn(g));
    });

    return a;
  }

  function addPicture(...groups) {
    groups.forEach(g => visible.push(g));

    return groups.map(g =>
      new M.FadeIn(g)
    );
  }

  function removePicture(...groups) {
    const a = [];

    groups.forEach(g => {
      if (visible.includes(g)) {
        visible = visible.filter(x => x !== g);

        a.push(
          new M.FadeOut(g)
        );
      }
    });

    return a;
  }

  // ============================================================
  // Main scatter plot.
  // X cyan, Y amber, Z pink.
  // The fitted line glows white.
  // ============================================================

  const GX0 = CX - W / 2 + 0.72;
  const GX1 = CX + W / 2 - 0.20;

  const GY0 = P ? -1.90 : -2.05;
  const GY1 = P ? 2.25 : 1.28;

  const XMIN = 35;
  const XMAX = 105;

  const YMIN = 600;
  const YMAX = 1600;

  const gx = a =>
    GX0 + (a - XMIN) / (XMAX - XMIN) * (GX1 - GX0);

  const gy = r =>
    GY0 + (r - YMIN) / (YMAX - YMIN) * (GY1 - GY0);

  function scatterAxes() {
    const parts = [];

    [600, 800, 1000, 1200, 1400, 1600].forEach(v => {
      parts.push(
        line(
          pt(GX0, gy(v)),
          pt(GX1, gy(v)),
          C.muted,
          0.65
        ),

        txt(
          fmt(v),
          P ? 13 : 14,
          C.muted,
          pt(GX0 - 0.36, gy(v)),
          true
        )
      );
    });

    [40, 60, 70, 80, 100].forEach(a => {
      const color =
        a === 70 ? MEAN_COLOR : C.muted;

      parts.push(
        line(
          pt(gx(a), GY0),
          pt(gx(a), GY1),
          C.muted,
          0.65
        ),

        txt(
          String(a),
          P ? 14 : 15,
          color,
          pt(gx(a), GY0 - 0.25),
          true
        )
      );
    });

    parts.push(
      line(
        pt(GX0, GY0),
        pt(GX1, GY0),
        C.muted,
        2
      ),

      line(
        pt(GX0, GY0),
        pt(GX0, GY1),
        C.muted,
        2
      ),

      txt(
        'rent ($)',
        15,
        C.muted,
        pt(GX0 + 0.43, GY1 + 0.22)
      ),

      txt(
        'area (m²)',
        15,
        C.muted,
        pt(GX1 - 0.53, GY0 - 0.54)
      )
    );

    return new M.VGroup(...parts);
  }

  function scatterLegend() {
    const parts = [];

    BUILDINGS.forEach((b, k) => {
      const x = GX0 + 0.15 + k * 0.67;
      const y = GY0 - 0.54;

      parts.push(
        dot(pt(x, y), 0.055, BC[b]),

        txt(
          b,
          14,
          BC[b],
          pt(x + 0.18, y),
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function fittedLine() {
    const a = pt(
      gx(XMIN),
      gy(fitted(XMIN))
    );

    const b = pt(
      gx(XMAX),
      gy(fitted(XMAX))
    );

    return new M.VGroup(
      line(a, b, MEAN_COLOR, 6),
      line(a, b, C.ink, 3)
    );
  }

  function scatterDots() {
    const parts = [];

    DATA.forEach(d => {
      const p = pt(
        gx(d.area),
        gy(d.rent)
      );

      const c = BC[d.building];

      // Y and Z both have a rent of 770 at 40 m².
      // Draw concentric dots rather than altering their coordinates.

      if (d.area === 40 && d.building === 'Y') {
        parts.push(
          circle(p, 0.105, c, 0)
        );
      } else if (d.area === 40 && d.building === 'Z') {
        parts.push(
          dot(p, 0.052, c)
        );
      } else {
        parts.push(
          glowDot(p, c, 0.065)
        );
      }
    });

    return new M.VGroup(...parts);
  }

  function residualSticks(colorByBuilding = true) {
    const parts = [];

    DATA.forEach(d => {
      // Two residuals coincide at 40 m².

      if (d.area === 40 && d.building === 'Z') {
        return;
      }

      const x = gx(d.area);
      const color = colorByBuilding
        ? BC[d.building]
        : C.muted;

      parts.push(
        line(
          pt(x, gy(fitted(d.area))),
          pt(x, gy(d.rent)),
          color,
          2
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function askingPoint(label = true) {
    const p = pt(
      gx(NEW_AREA),
      gy(ASKING)
    );

    const parts = [
      circle(p, 0.14, ASK_COLOR, 0.12),
      dot(p, 0.09, ASK_COLOR)
    ];

    if (label) {
      const end = pt(
        p[0] + 0.83,
        p[1] + 0.36
      );

      parts.push(
        line(
          pt(p[0] + 0.10, p[1] + 0.08),
          end,
          ASK_COLOR,
          1.5
        ),

        tag(
          '$1,180',
          ASK_COLOR,
          pt(end[0] + 0.27, end[1] + 0.16),
          16
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fittedPoint(label = true) {
    const p = pt(
      gx(NEW_AREA),
      gy(PREDICTED)
    );

    const parts = [
      glowDot(p, MEAN_COLOR, 0.09)
    ];

    if (label) {
      parts.push(
        line(
          pt(p[0] - 0.10, p[1] - 0.05),
          pt(p[0] - 0.75, p[1] - 0.31),
          MEAN_COLOR,
          1.5
        ),

        tag(
          '$1,100',
          MEAN_COLOR,
          pt(p[0] - 1.05, p[1] - 0.45),
          16
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function areaGuide(area = NEW_AREA) {
    return dashed(
      pt(gx(area), GY0),
      pt(gx(area), gy(fitted(area))),
      MEAN_COLOR
    );
  }

  function priceGap() {
    const x = gx(NEW_AREA) + 0.20;

    return new M.VGroup(
      line(
        pt(x, gy(PREDICTED)),
        pt(x, gy(ASKING)),
        NOISE_COLOR,
        3
      ),

      line(
        pt(x - 0.08, gy(PREDICTED)),
        pt(x + 0.08, gy(PREDICTED)),
        NOISE_COLOR,
        2
      ),

      line(
        pt(x - 0.08, gy(ASKING)),
        pt(x + 0.08, gy(ASKING)),
        NOISE_COLOR,
        2
      )
    );
  }

  // Sample points and illustrative line wobble.

  function wobbleLines() {
    const parts = [];

    [-MEAN_SE, MEAN_SE].forEach(offset => {
      parts.push(
        dashed(
          pt(gx(XMIN), gy(fitted(XMIN) + offset)),
          pt(gx(XMAX), gy(fitted(XMAX) + offset)),
          MEAN_COLOR
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 0-5: a new apartment and two different uncertainty questions.
  // ============================================================

  let axes = scatterAxes();
  let fitLine = fittedLine();
  let points = scatterDots();
  let legend = scatterLegend();

  let askDot = askingPoint();
  let fitDot = null;
  let guide70 = areaGuide();

  // 0: a new listing, 70 m² and asking rent $1,180.

  await until(S(0));
  await play(
    ...picture(
      axes,
      fitLine,
      points,
      legend,
      guide70
    ),

    ...say('A NEW APARTMENT: 70 m²')
  );

  await until(S(0) + 2.7);
  await play(
    ...addPicture(askDot),

    ...fbox([
      ['NEW LISTING', ASK_COLOR],
      'area = 70 m²',
      ['asking rent', C.muted],
      ['$1,180', ASK_COLOR]
    ], ASK_COLOR),

    ...say('ASKING RENT: $1,180', ASK_COLOR)
  );

  // 1: is that a reasonable price for its size?

  await until(S(1));
  await play(
    new M.Indicate(
      askDot,
      { color: ASK_COLOR }
    ),

    ...say('IS THAT PRICE REASONABLE?', C.amber)
  );

  // 2: the fitted line gives 400 + 10 × 70.

  fitDot = fittedPoint();

  await until(S(2));
  await play(
    ...addPicture(fitDot),

    ...fbox([
      ['FITTED RENT', MEAN_COLOR],
      '400 + 10 × area',
      '400 + 10 × 70',
      '400 + 700'
    ], MEAN_COLOR),

    ...say('USE THE FITTED LINE', MEAN_COLOR)
  );

  // 3: predicted rent $1,100.

  await until(S(3));
  await play(
    new M.Indicate(
      fitDot,
      { color: MEAN_COLOR }
    ),

    ...fbox([
      ['FITTED RENT', MEAN_COLOR],
      '400 + 700',
      ['= $1,100', MEAN_COLOR]
    ], MEAN_COLOR),

    ...say('FITTED RENT = $1,100', MEAN_COLOR)
  );

  // 4: the asking price differs from the fitted mean.
  // The line is not a perfect prediction of every apartment.

  const gap = priceGap();

  await until(S(4));
  await play(
    ...addPicture(gap),

    ...fbox([
      ['ASKING VS FITTED', C.ink],
      ['asking = 1,180', ASK_COLOR],
      ['fitted = 1,100', MEAN_COLOR],
      ['difference = $80', NOISE_COLOR],
      'how much room',
      'should we allow?'
    ], NOISE_COLOR),

    ...say('HOW WIDE SHOULD THE RANGE BE?', C.amber)
  );

  // 5: the appropriate range depends on the question.

  await until(S(5));
  await play(
    ...say('IT DEPENDS ON THE QUESTION', C.violet)
  );

  // ============================================================
  // Two question illustrations.
  // A group mean versus a single new apartment.
  // ============================================================

  function apartmentIcon(x, y, color, scale = 1) {
    const w = 0.78 * scale;
    const h = 0.76 * scale;

    const body = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.06,
      color,
      strokeWidth: 2
    });

    body.setFill(C.card, 0.75);
    body.moveTo(pt(x, y));

    const parts = [body];

    for (let k = 0; k < 2; k++) {
      parts.push(
        rect(
          0.20 * scale,
          0.20 * scale,
          pt(
            x + (k - 0.5) * 0.32 * scale,
            y + 0.14 * scale
          ),
          color,
          0.60
        )
      );
    }

    parts.push(
      rect(
        0.19 * scale,
        0.26 * scale,
        pt(x, y - 0.19 * scale),
        color,
        0.30
      )
    );

    return new M.VGroup(...parts);
  }

  function questionPicture(mode = 'mean') {
    const parts = [];

    const groupActive = mode === 'mean';
    const individualActive = mode === 'one';

    const left = CX - W * 0.24;
    const right = CX + W * 0.24;

    const groupColor = groupActive
      ? MEAN_COLOR
      : C.muted;

    const individualColor = individualActive
      ? PRED_COLOR
      : C.muted;

    const titleY = CY + 1.52;
    const iconY = CY + 0.18;

    parts.push(
      txt(
        'Two different questions',
        P ? 22 : 21,
        C.ink,
        pt(CX, titleY)
      ),

      outline(
        W * 0.44,
        2.13,
        pt(left, CY + 0.06),
        groupColor
      ),

      outline(
        W * 0.44,
        2.13,
        pt(right, CY + 0.06),
        individualColor
      )
    );

    for (let k = 0; k < 6; k++) {
      const row = Math.floor(k / 3);
      const col = k % 3;

      parts.push(
        apartmentIcon(
          left + (col - 1) * 0.65,
          iconY + 0.37 - row * 0.66,
          groupColor,
          0.69
        )
      );
    }

    parts.push(
      apartmentIcon(
        right,
        iconY,
        individualColor,
        1.20
      ),

      tag(
        'MEAN RENT',
        groupColor,
        pt(left, CY - 1.30),
        17
      ),

      tag(
        'ONE RENT',
        individualColor,
        pt(right, CY - 1.30),
        17
      ),

      txt(
        'All 70 m² apartments',
        P ? 15 : 16,
        groupColor,
        pt(left, CY - 1.77),
        false,
        W * 0.45
      ),

      txt(
        'This 70 m² apartment',
        P ? 15 : 16,
        individualColor,
        pt(right, CY - 1.77),
        false,
        W * 0.45
      )
    );

    return new M.VGroup(...parts);
  }

  // 6: question one concerns the population mean.

  await until(S(6));
  await play(
    ...picture(
      questionPicture('mean')
    ),

    ...fbox([
      ['QUESTION 1', MEAN_COLOR],
      'mean rent of ALL',
      '70 m² apartments',
      ['in this neighbourhood', MEAN_COLOR]
    ], MEAN_COLOR),

    ...say('QUESTION 1: THE MEAN RENT', MEAN_COLOR)
  );

  // 7: question two concerns one new apartment.

  await until(S(7));
  await play(
    ...picture(
      questionPicture('one')
    ),

    ...fbox([
      ['QUESTION 2', PRED_COLOR],
      'rent of ONE',
      '70 m² apartment',
      ['this individual case', PRED_COLOR]
    ], PRED_COLOR),

    ...say('QUESTION 2: ONE APARTMENT', PRED_COLOR)
  );

  // ============================================================
  // 8-13: uncertainty about the estimated mean.
  // ============================================================

  // 8: the mean question only involves uncertainty in the
  // fitted mean line, under the model assumptions.

  axes = scatterAxes();
  fitLine = fittedLine();
  points = scatterDots();
  legend = scatterLegend();

  const wobble = wobbleLines();

  await until(S(8));
  await play(
    ...picture(
      axes,
      points,
      legend,
      wobble,
      fitLine
    ),

    ...fbox([
      ['MEAN RENT', MEAN_COLOR],
      'we estimated',
      'the fitted line',
      'from a sample',
      ['the line can wobble', MEAN_COLOR]
    ], MEAN_COLOR),

    ...say('DOUBT 1: THE LINE ITSELF', MEAN_COLOR)
  );

  // 9: at the sample's mean area, the standard error of
  // the estimated mean is smallest.

  const centreGuide = dashed(
    pt(gx(MEAN_AREA), GY0),
    pt(gx(MEAN_AREA), GY1),
    MEAN_COLOR
  );

  const centreDot = glowDot(
    pt(gx(MEAN_AREA), gy(MEAN_RENT)),
    MEAN_COLOR,
    0.10
  );

  const centreTag = tag(
    'CENTRE OF DATA',
    MEAN_COLOR,
    pt(gx(MEAN_AREA), GY1 + 0.23),
    15
  );

  await until(S(9));
  await play(
    ...addPicture(
      centreGuide,
      centreDot,
      centreTag
    ),

    ...fbox([
      ['CENTRE OF THE DATA', MEAN_COLOR],
      'mean area = 70',
      'mean rent = 1,100',
      ['line uncertainty', MEAN_COLOR],
      ['is smallest here', MEAN_COLOR]
    ], MEAN_COLOR),

    ...say('SMALLEST WOBBLE AT 70 m²', MEAN_COLOR)
  );

  // A magnified number line for rents at exactly 70 m².
  // All interval diagrams share this scale.

  const RW = W - 0.90;
  const RX0 = CX - RW / 2;

  const RMIN = 950;
  const RMAX = 1250;

  const rx = r =>
    RX0 + (r - RMIN) / (RMAX - RMIN) * RW;

  const RY = CY - 0.83;

  function rentAxis() {
    const parts = [
      line(
        pt(rx(RMIN), RY),
        pt(rx(RMAX), RY),
        C.muted,
        2
      )
    ];

    [950, 1000, 1050, 1100, 1150, 1200, 1250].forEach(v => {
      const c = v === PREDICTED
        ? MEAN_COLOR
        : C.muted;

      parts.push(
        line(
          pt(rx(v), RY - 0.07),
          pt(rx(v), RY + 0.07),
          c,
          1.5
        ),

        txt(
          fmt(v),
          P ? 13 : 14,
          c,
          pt(rx(v), RY - 0.27),
          true
        )
      );
    });

    parts.push(
      txt(
        'monthly rent ($)',
        16,
        C.muted,
        pt(CX, RY - 0.68)
      )
    );

    return new M.VGroup(...parts);
  }

  function rangeBar(
    low,
    high,
    y,
    color,
    options = {}
  ) {
    const {
      labels = true,
      centre = PREDICTED,
      height = 0.28,
      labelY = 0.38,
      labelSize = 16
    } = options;

    const left = rx(low);
    const right = rx(high);

    const parts = [
      rect(
        right - left,
        height,
        pt((left + right) / 2, y),
        color,
        0.23
      ),

      line(
        pt(left, y),
        pt(right, y),
        color,
        5
      ),

      line(
        pt(left, y - height * 0.65),
        pt(left, y + height * 0.65),
        color,
        3
      ),

      line(
        pt(right, y - height * 0.65),
        pt(right, y + height * 0.65),
        color,
        3
      ),

      glowDot(
        pt(rx(centre), y),
        color,
        0.082
      )
    ];

    if (labels) {
      parts.push(
        txt(
          fmt(low),
          labelSize,
          color,
          pt(left, y + labelY),
          true
        ),

        txt(
          fmt(high),
          labelSize,
          color,
          pt(right, y + labelY),
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function rentCentreGuide(top = CY + 1.12) {
    return dashed(
      pt(rx(PREDICTED), RY),
      pt(rx(PREDICTED), top),
      MEAN_COLOR
    );
  }

  function intervalTitle(s, color = C.ink) {
    return txt(
      s,
      P ? 21 : 20,
      color,
      local(0, 1.52),
      false,
      W - 0.5
    );
  }

  function rentZoomBase(title) {
    return new M.VGroup(
      rentAxis(),
      rentCentreGuide(),
      intervalTitle(title),

      tag(
        '70 m²',
        MEAN_COLOR,
        local(0, -1.97),
        17
      )
    );
  }

  function marginArrows(
    margin,
    y,
    color,
    display
  ) {
    const x = rx(PREDICTED);

    const a = rx(PREDICTED - margin);
    const b = rx(PREDICTED + margin);

    const parts = [
      arrow(
        pt(x - 0.05, y),
        pt(a, y),
        color,
        2.5
      ),

      arrow(
        pt(x + 0.05, y),
        pt(b, y),
        color,
        2.5
      )
    ];

    if (display) {
      const dl = txt(
        display,
        17,
        color,
        pt(x, y + 0.31),
        true
      );
      // keep the label clear of the vertical 1,100 guide line
      dl.moveTo(pt(x + 0.16 + dl.getWidth() / 2, y + 0.31));
      parts.push(dl);
    }

    return new M.VGroup(...parts);
  }

  let zoomBase = rentZoomBase(
    'Zoom in at 70 square metres'
  );

  const seMeanBar = rangeBar(
    PREDICTED - MEAN_SE,
    PREDICTED + MEAN_SE,
    CY + 0.18,
    MEAN_COLOR,
    {
      labels: false,
      height: 0.30
    }
  );

  const seMeanArrows = marginArrows(
    MEAN_SE,
    CY + 0.65,
    MEAN_COLOR,
    'about $14'
  );

  const seLabel = txt(
    'One standard error',
    17,
    MEAN_COLOR,
    local(0, -0.23)
  );
  seLabel.moveTo(local(0.16 + seLabel.getWidth() / 2, -0.23));

  // 10: the standard error at 70 is about $14.

  await until(S(10));
  await play(
    ...picture(
      zoomBase,
      seMeanBar,
      seMeanArrows,
      seLabel
    ),

    ...fbox([
      ['LINE STANDARD ERROR', MEAN_COLOR],
      '50 × √(1/12)',
      '= 14.43...',
      ['≈ $14', MEAN_COLOR]
    ], MEAN_COLOR),

    ...say('LINE WOBBLE ≈ $14', MEAN_COLOR)
  );

  // 11: multiply the unrounded standard error by 2.23.
  // This gives the margin of about $32.

  const meanExpandedBar = rangeBar(
    meanLow(NEW_AREA),
    meanHigh(NEW_AREA),
    CY + 0.18,
    MEAN_COLOR,
    {
      labels: false,
      height: 0.30
    }
  );

  const meanExpandedArrows = marginArrows(
    meanMargin(NEW_AREA),
    CY + 0.65,
    MEAN_COLOR,
    'about $32'
  );

  const multiplierLabel = txt(
    'Multiply the wobble by 2.23',
    18,
    MEAN_COLOR,
    local(0, -0.23)
  );

  await until(S(11));
  await play(
    new M.Transform(
      seMeanBar,
      meanExpandedBar,
      { runTime: 1.6 }
    ),

    new M.Transform(
      seMeanArrows,
      meanExpandedArrows,
      { runTime: 1.6 }
    ),

    new M.Transform(
      seLabel,
      multiplierLabel
    ),

    ...fbox([
      ['95% MULTIPLIER', C.amber],
      't multiplier ≈ 2.23',
      '14.43 × 2.23',
      ['≈ $32', MEAN_COLOR],
      ['margin on each side', C.muted]
    ], MEAN_COLOR),

    ...say('WOBBLE × 2.23 ≈ $32', MEAN_COLOR)
  );

  // 12: fitted rent plus or minus $32.
  // This is the confidence interval for the mean.

  const confidenceLabel = tag(
    '95% CONFIDENCE INTERVAL',
    MEAN_COLOR,
    local(0, 1.04),
    P ? 16 : 17
  );

  await until(S(12));
  await play(
    ...addPicture(confidenceLabel),

    ...fbox([
      ['MEAN CONFIDENCE', MEAN_COLOR],
      ['INTERVAL', MEAN_COLOR],
      '1,100 ± 32',
      'fitted mean',
      '+ or − margin',
      ['95% confidence', MEAN_COLOR]
    ], MEAN_COLOR),

    ...say('95% INTERVAL FOR THE MEAN', MEAN_COLOR)
  );

  // 13: endpoints 1,068 and 1,132.

  const confidenceBar = rangeBar(
    CI_LOW,
    CI_HIGH,
    CY + 0.18,
    MEAN_COLOR,
    {
      labels: true,
      height: 0.30,
      labelY: 0.43
    }
  );

  await until(S(13));
  await play(
    ...removePicture(
      seMeanBar,
      seMeanArrows,
      seLabel
    ),

    ...addPicture(confidenceBar),

    ...fbox([
      ['MEAN RENT INTERVAL', MEAN_COLOR],
      '1,100 − 32 = 1,068',
      '1,100 + 32 = 1,132',
      ['$1,068 to $1,132', MEAN_COLOR],
      ['for the mean only', MEAN_COLOR]
    ], MEAN_COLOR),

    ...say('MEAN RANGE: $1,068–$1,132', MEAN_COLOR)
  );

  // ============================================================
  // 14-17: uncertainty about one new apartment.
  // ============================================================

  // 14: the second question introduces another source of doubt.

  await until(S(14));
  await play(
    ...picture(
      questionPicture('one')
    ),

    ...fbox([
      ['ONE APARTMENT', PRED_COLOR],
      ['doubt 1: line wobble', MEAN_COLOR],
      ['doubt 2: own noise', NOISE_COLOR]
    ], PRED_COLOR),

    ...say('QUESTION 2 HAS A SECOND DOUBT', PRED_COLOR)
  );

  // 15: apartments vary around the fitted mean even if the
  // fitted mean itself were known exactly.

  axes = scatterAxes();
  fitLine = fittedLine();
  points = scatterDots();
  legend = scatterLegend();

  const residuals = residualSticks();

  await until(S(15));
  await play(
    ...picture(
      axes,
      fitLine,
      residuals,
      points,
      legend
    ),

    ...fbox([
      ['INDIVIDUAL NOISE', NOISE_COLOR],
      'apartments of the',
      'same size can have',
      'different rents',
      ['actual − fitted', NOISE_COLOR]
    ], NOISE_COLOR),

    ...say('ONE APARTMENT HAS ITS OWN NOISE', NOISE_COLOR)
  );

  // 16: residual standard error is $50.
  // Show the shared chapter's actual residuals.

  const rseTag = tag(
    'TYPICAL NOISE ≈ $50',
    NOISE_COLOR,
    pt(CX + 0.30, GY1 + 0.23),
    16
  );

  await until(S(16));
  await play(
    ...fbox([
      ['RESIDUAL STD ERROR', NOISE_COLOR],
      '25,000 ÷ (12 − 2)',
      '= 2,500',
      '√2,500',
      ['= $50', NOISE_COLOR]
    ], NOISE_COLOR),

    ...say('APARTMENT NOISE ≈ $50', NOISE_COLOR)
  );

  // Compare the two components on the same length scale.

  function twoDoubtsPicture() {
    const parts = [];

    const maxW = W - 1.7;

    const wLine = maxW * MEAN_SE / 55;
    const wNoise = maxW * RSE / 55;

    const x0 = CX - maxW / 2;

    const y1 = CY + 0.54;
    const y2 = CY - 0.72;

    parts.push(
      intervalTitle(
        'Two sources of uncertainty'
      ),

      txt(
        'Line wobble',
        20,
        MEAN_COLOR,
        pt(CX, y1 + 0.40)
      ),

      rect(
        maxW,
        0.28,
        pt(CX, y1),
        C.muted,
        0.07
      ),

      rect(
        wLine,
        0.28,
        pt(x0 + wLine / 2, y1),
        MEAN_COLOR,
        0.82
      ),

      txt(
        '$14',
        22,
        MEAN_COLOR,
        pt(x0 + wLine + 0.40, y1),
        true
      ),

      txt(
        'Apartment noise',
        20,
        NOISE_COLOR,
        pt(CX, y2 + 0.40)
      ),

      rect(
        maxW,
        0.28,
        pt(CX, y2),
        C.muted,
        0.07
      ),

      rect(
        wNoise,
        0.28,
        pt(x0 + wNoise / 2, y2),
        NOISE_COLOR,
        0.82
      ),

      txt(
        '$50',
        22,
        NOISE_COLOR,
        pt(x0 + wNoise + 0.31, y2),
        true
      ),

      txt(
        'Both contribute to prediction uncertainty',
        P ? 17 : 16,
        C.muted,
        local(0, -1.69),
        false,
        W - 0.4
      )
    );

    return new M.VGroup(...parts);
  }

  // 17: the two sources of uncertainty must be combined.

  await until(S(17));
  await play(
    ...picture(
      twoDoubtsPicture()
    ),

    ...fbox([
      ['TWO DOUBTS', PRED_COLOR],
      ['line wobble ≈ 14', MEAN_COLOR],
      ['own noise   = 50', NOISE_COLOR],
      'combine them',
      ['but not by addition', PRED_COLOR]
    ], PRED_COLOR),

    ...say('COMBINE THE TWO SOURCES OF DOUBT', PRED_COLOR)
  );

  // ============================================================
  // 18-21: combine uncertainty through squares.
  // ============================================================

  // Right-angle triangle, with side lengths proportional
  // to the two standard errors and their combined size.

  const TRI_SCALE = (P ? 4.15 : 4.35) / RSE;

  const TRI_W = RSE * TRI_SCALE;
  const TRI_H = MEAN_SE * TRI_SCALE;

  const TA = local(-TRI_W / 2, -0.91);
  const TB = pt(TA[0] + TRI_W, TA[1]);
  const TC = pt(TB[0], TB[1] + TRI_H);

  function rightAngleMark() {
    const q = 0.22;

    return new M.VGroup(
      line(
        pt(TB[0] - q, TB[1]),
        pt(TB[0] - q, TB[1] + q),
        C.ink,
        2
      ),

      line(
        pt(TB[0] - q, TB[1] + q),
        pt(TB[0], TB[1] + q),
        C.ink,
        2
      )
    );
  }

  const triangleBase = line(
    TA,
    TB,
    NOISE_COLOR,
    5
  );

  const triangleWobble = line(
    TB,
    TC,
    MEAN_COLOR,
    5
  );

  const triangleCombined = line(
    TA,
    TC,
    PRED_COLOR,
    5
  );

  const triangleTitle = intervalTitle(
    'Combine through a right-angle triangle'
  );

  const triangleAngle = rightAngleMark();

  const triangle90 = txt(
    '90°',
    16,
    C.muted,
    pt(TB[0] - 0.43, TB[1] + 0.34),
    true
  );

  const noiseSideLabel = txt(
    'apartment noise',
    18,
    NOISE_COLOR,
    pt(
      (TA[0] + TB[0]) / 2,
      TA[1] - 0.32
    )
  );

  const wobbleSideLabel = txt(
    'line wobble',
    16,
    MEAN_COLOR,
    pt(TB[0] + 0.62, (TB[1] + TC[1]) / 2)
  );

  const combinedSideLabel = txt(
    'combined doubt',
    19,
    PRED_COLOR,
    pt(
      (TA[0] + TC[0]) / 2 - 0.21,
      (TA[1] + TC[1]) / 2 + 0.48
    )
  );

  // 18: picture the two uncertainties as the short sides
  // of a right-angle triangle before introducing the formula.

  await until(S(18));
  await play(
    ...picture(
      triangleTitle
    ),

    new M.Create(triangleBase),
    new M.Create(triangleWobble),

    new M.FadeIn(triangleAngle),
    new M.FadeIn(triangle90),

    new M.FadeIn(noiseSideLabel),
    new M.FadeIn(wobbleSideLabel),

    ...fbox([
      ['INDEPENDENT DOUBTS', PRED_COLOR],
      'combine their',
      'squares',
      ['like two sides', PRED_COLOR],
      ['of a right triangle', PRED_COLOR]
    ], PRED_COLOR),

    ...say('TWO SHORT SIDES OF A RIGHT TRIANGLE', PRED_COLOR)
  );

  visible.push(
    triangleBase,
    triangleWobble,
    triangleAngle,
    triangle90,
    noiseSideLabel,
    wobbleSideLabel
  );

  await until(S(18) + 3.0);
  await play(
    new M.Create(triangleCombined),
    new M.FadeIn(combinedSideLabel)
  );

  visible.push(
    triangleCombined,
    combinedSideLabel
  );

  // 19: label the two standard errors, approximately 14 and 50.

  const side50 = txt(
    '50',
    25,
    NOISE_COLOR,
    pt(
      (TA[0] + TB[0]) / 2,
      TA[1] - 0.71
    ),
    true
  );

  const side14 = txt(
    '14',
    24,
    MEAN_COLOR,
    pt(
      TB[0] + 0.42,
      (TB[1] + TC[1]) / 2 - 0.30
    ),
    true
  );

  await until(S(19));
  await play(
    ...addPicture(side50, side14),

    ...fbox([
      ['THE TWO SIDES', PRED_COLOR],
      ['line wobble ≈ 14', MEAN_COLOR],
      ['own noise = 50', NOISE_COLOR],
      'combine through',
      ['their squared sizes', PRED_COLOR]
    ], PRED_COLOR),

    ...say('ONE SIDE 14 · ONE SIDE 50', PRED_COLOR)
  );

  // 20: sqrt(14² + 50²) is approximately 52.
  // The exact interval calculations retain the unrounded mean SE.

  const side52 = tag(
    '≈ $52',
    PRED_COLOR,
    pt(
      (TA[0] + TC[0]) / 2 - 0.10,
      (TA[1] + TC[1]) / 2 + 0.93
    ),
    22
  );

  await until(S(20));
  await play(
    ...fbox([
      ['COMBINED DOUBT', PRED_COLOR],
      '√(14² + 50²)',
      '= √(196 + 2,500)',
      '= √2,696',
      ['≈ $52', PRED_COLOR]
    ], PRED_COLOR),

    new M.Indicate(
      triangleCombined,
      { color: PRED_COLOR }
    ),

    ...addPicture(side52),

    ...say('COMBINED STANDARD ERROR ≈ $52', PRED_COLOR)
  );

  // Variance contribution diagram.
  // The combined variance has a line component and a
  // much larger individual-noise component.

  function variancePicture() {
    const lineVar = MEAN_SE * MEAN_SE;
    const noiseVar = RSE * RSE;

    const total = lineVar + noiseVar;

    const width = W - 0.85;
    const left = CX - width / 2;

    const lineW = width * lineVar / total;
    const noiseW = width * noiseVar / total;

    const y = CY + 0.16;

    const parts = [
      intervalTitle(
        'Where the combined uncertainty comes from'
      ),

      rect(
        lineW,
        0.61,
        pt(left + lineW / 2, y),
        MEAN_COLOR,
        0.90
      ),

      rect(
        noiseW,
        0.61,
        pt(left + lineW + noiseW / 2, y),
        NOISE_COLOR,
        0.84
      ),

      outline(
        width,
        0.61,
        pt(CX, y),
        C.muted
      ),

      line(
        pt(left + lineW / 2, y + 0.31),
        pt(left + lineW / 2, y + 0.75),
        MEAN_COLOR,
        2
      ),

      line(
        pt(left + lineW / 2, y + 0.75),
        pt(left + 1.1, y + 0.75),
        MEAN_COLOR,
        2
      ),

      txt(
        'line wobble²',
        16,
        MEAN_COLOR,
        pt(left + 1.52, y + 0.98)
      ),

      txt(
        'apartment noise²',
        20,
        NOISE_COLOR,
        pt(left + lineW + noiseW / 2, y - 0.62)
      ),

      tag(
        'OWN NOISE DOMINATES',
        NOISE_COLOR,
        local(0, -1.43),
        18
      )
    ];

    return new M.VGroup(...parts);
  }

  // 21: apartment-specific noise is the larger component.

  await until(S(21));
  await play(
    ...picture(
      variancePicture()
    ),

    ...fbox([
      ['COMPARE THE SQUARES', C.ink],
      ['14² ≈ 196', MEAN_COLOR],
      ['50² = 2,500', NOISE_COLOR],
      'the apartment noise',
      ['is much larger', NOISE_COLOR]
    ], NOISE_COLOR),

    ...say('OWN NOISE IS BY FAR THE BIGGER PART', NOISE_COLOR)
  );

  // ============================================================
  // 22-25: construct the prediction interval.
  // ============================================================

  zoomBase = rentZoomBase(
    'Prediction for one 70 m² apartment'
  );

  const sePredictionBar = rangeBar(
    PREDICTED - PREDICTION_SE,
    PREDICTED + PREDICTION_SE,
    CY + 0.18,
    PRED_COLOR,
    {
      labels: false,
      height: 0.33
    }
  );

  const sePredictionArrows = marginArrows(
    PREDICTION_SE,
    CY + 0.66,
    PRED_COLOR,
    'about $52'
  );

  const predSELabel = txt(
    'One combined standard error',
    17,
    PRED_COLOR,
    local(0, -0.26)
  );

  // 22: use the same t multiplier, approximately 2.23.

  await until(S(22));
  await play(
    ...picture(
      zoomBase,
      sePredictionBar,
      sePredictionArrows,
      predSELabel
    ),

    ...fbox([
      ['SAME MULTIPLIER', C.amber],
      'combined SE ≈ 52',
      'multiplier ≈ 2.23',
      ['52 × 2.23', PRED_COLOR]
    ], PRED_COLOR),

    ...say('MULTIPLY BY THE SAME 2.23', PRED_COLOR)
  );

  // 23: expand the combined standard error to a margin
  // of approximately 116 dollars on each side.

  const expandedPredictionBar = rangeBar(
    predictionLow(NEW_AREA),
    predictionHigh(NEW_AREA),
    CY + 0.18,
    PRED_COLOR,
    {
      labels: false,
      height: 0.33
    }
  );

  const expandedPredictionArrows = marginArrows(
    predictionMargin(NEW_AREA),
    CY + 0.66,
    PRED_COLOR,
    'about $116'
  );

  const marginLabel = txt(
    'Margin on each side',
    18,
    PRED_COLOR,
    local(0, -0.26)
  );
  marginLabel.moveTo(local(0.16 + marginLabel.getWidth() / 2, -0.26));

  await until(S(23));
  await play(
    new M.Transform(
      sePredictionBar,
      expandedPredictionBar,
      { runTime: 1.3 }
    ),

    new M.Transform(
      sePredictionArrows,
      expandedPredictionArrows,
      { runTime: 1.3 }
    ),

    new M.Transform(
      predSELabel,
      marginLabel
    ),

    ...fbox([
      ['PREDICTION MARGIN', PRED_COLOR],
      '52 × 2.23',
      ['≈ $116', PRED_COLOR],
      'on each side'
    ], PRED_COLOR),

    ...say('ABOUT $116 ON EACH SIDE', PRED_COLOR)
  );

  // 24: 1,100 minus 116 and plus 116.

  const predictionBar = rangeBar(
    PI_LOW,
    PI_HIGH,
    CY + 0.18,
    PRED_COLOR,
    {
      labels: true,
      height: 0.33,
      labelY: 0.43
    }
  );

  await until(S(24));
  await play(
    ...removePicture(
      sePredictionBar,
      sePredictionArrows,
      predSELabel
    ),

    ...addPicture(predictionBar),

    ...fbox([
      ['ONE-CASE RANGE', PRED_COLOR],
      '1,100 − 116 = 984',
      '1,100 + 116 = 1,216',
      ['$984 to $1,216', PRED_COLOR]
    ], PRED_COLOR),

    ...say('ONE APARTMENT: $984–$1,216', PRED_COLOR)
  );

  // 25: name the prediction interval.

  const predictionName = tag(
    '95% PREDICTION INTERVAL',
    PRED_COLOR,
    local(0, 1.04),
    P ? 17 : 17
  );

  await until(S(25));
  await play(
    ...addPicture(predictionName),

    ...fbox([
      ['PREDICTION INTERVAL', PRED_COLOR],
      'a range for',
      ['ONE NEW CASE', PRED_COLOR],
      'not just its mean',
      ['95% prediction interval', PRED_COLOR]
    ], PRED_COLOR),

    ...say('THIS IS A PREDICTION INTERVAL', PRED_COLOR)
  );

  // ============================================================
  // 26-29: visualize the two continuous regression bands.
  // ============================================================

  // A curve is assembled from short line segments.
  // Uses only the primitives in the supplied reference.

  function curve(fn, color, sw = 2.5, segments = 84) {
    const pieces = [];

    for (let k = 0; k < segments; k++) {
      const a =
        XMIN + (XMAX - XMIN) * k / segments;

      const b =
        XMIN + (XMAX - XMIN) * (k + 1) / segments;

      pieces.push(
        line(
          pt(gx(a), gy(fn(a))),
          pt(gx(b), gy(fn(b))),
          color,
          sw
        )
      );
    }

    return new M.VGroup(...pieces);
  }

  // Shaded bands are made from thin, contiguous rectangles.
  // Fill opacity distinguishes the two nested ranges.
  // The exact mathematical boundaries are drawn on top.

  function bandFill(lowFn, highFn, color, opacity) {
    const parts = [];

    const strips = 100;
    const da = (XMAX - XMIN) / strips;

    for (let k = 0; k < strips; k++) {
      const a = XMIN + k * da;
      const b = a + da;

      const m = (a + b) / 2;

      const low = lowFn(m);
      const high = highFn(m);

      const x1 = gx(a);
      const x2 = gx(b);

      const y1 = gy(low);
      const y2 = gy(high);

      parts.push(
        rect(
          x2 - x1,
          y2 - y1,
          pt(
            (x1 + x2) / 2,
            (y1 + y2) / 2
          ),
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function confidenceBand() {
    return new M.VGroup(
      bandFill(
        meanLow,
        meanHigh,
        MEAN_COLOR,
        0.34
      ),

      curve(
        meanLow,
        MEAN_COLOR,
        2
      ),

      curve(
        meanHigh,
        MEAN_COLOR,
        2
      )
    );
  }

  function predictionBand() {
    return new M.VGroup(
      bandFill(
        predictionLow,
        predictionHigh,
        PRED_COLOR,
        0.17
      ),

      curve(
        predictionLow,
        PRED_COLOR,
        2.5
      ),

      curve(
        predictionHigh,
        PRED_COLOR,
        2.5
      )
    );
  }

  function bandLegend() {
    const y = GY1 + 0.23;

    const x1 = CX - W * 0.13;
    const x2 = CX + W * 0.27;

    return new M.VGroup(
      rect(
        0.34,
        0.17,
        pt(x1 - 0.63, y),
        MEAN_COLOR,
        0.72
      ),

      txt(
        'mean',
        15,
        MEAN_COLOR,
        pt(x1, y)
      ),

      rect(
        0.34,
        0.17,
        pt(x2 - 0.80, y),
        PRED_COLOR,
        0.70
      ),

      txt(
        'one case',
        15,
        PRED_COLOR,
        pt(x2, y)
      )
    );
  }

  function bandCrossSection(
    area,
    type = 'prediction',
    color = null
  ) {
    const isMean = type === 'mean';

    const low = isMean
      ? meanLow(area)
      : predictionLow(area);

    const high = isMean
      ? meanHigh(area)
      : predictionHigh(area);

    const c = color ||
      (isMean ? MEAN_COLOR : PRED_COLOR);

    const x = gx(area);

    return new M.VGroup(
      line(
        pt(x, gy(low)),
        pt(x, gy(high)),
        c,
        3.5
      ),

      line(
        pt(x - 0.075, gy(low)),
        pt(x + 0.075, gy(low)),
        c,
        2
      ),

      line(
        pt(x - 0.075, gy(high)),
        pt(x + 0.075, gy(high)),
        c,
        2
      )
    );
  }

  let thinBand = confidenceBand();
  let wideBand = predictionBand();
  let bandKey = bandLegend();

  axes = scatterAxes();
  fitLine = fittedLine();
  points = scatterDots();
  legend = scatterLegend();

  // 26: thin band for the mean, wide band for single apartments.
  // Draw the wide band first, the thin band over it,
  // and the white fitted line and data dots on top.

  await until(S(26));
  await play(
    ...picture(
      axes,
      wideBand,
      thinBand,
      fitLine,
      points,
      legend,
      bandKey
    ),

    ...fbox([
      ['TWO 95% BANDS', C.ink],
      ['thin: confidence', MEAN_COLOR],
      ['      for the mean', MEAN_COLOR],
      ['wide: prediction', PRED_COLOR],
      ['      for one case', PRED_COLOR]
    ], C.violet),

    ...say('THIN FOR THE MEAN · WIDE FOR ONE CASE', PRED_COLOR)
  );

  // 27: both bands widen away from the sample's mean area.
  // Their width is computed from the exact SXX = 6,000.

  const crossSections = [];

  [40, 70, 100].forEach(a => {
    crossSections.push(
      bandCrossSection(a, 'prediction'),
      bandCrossSection(a, 'mean')
    );
  });

  const midGuide = dashed(
    pt(gx(70), GY0),
    pt(gx(70), GY1),
    MEAN_COLOR
  );

  await until(S(27));
  await play(
    ...addPicture(
      midGuide,
      ...crossSections
    ),

    ...fbox([
      ['AWAY FROM 70 m²', C.violet],
      'the line wobbles',
      'a little more',
      ['both bands widen', C.violet],
      ['narrowest at 70', MEAN_COLOR]
    ], C.violet),

    ...say('BOTH BANDS WIDEN AWAY FROM 70', C.violet)
  );

  // 28: prediction interval starts with the fitted rent
  // and the same multiplier.

  await until(S(28));
  await play(
    ...removePicture(
      midGuide,
      ...crossSections
    ),

    ...fbox([
      ['PREDICTION INTERVAL', PRED_COLOR],
      ['fitted rent', MEAN_COLOR],
      '± multiplier',
      '  × combined doubt',
      '  ...'
    ], PRED_COLOR),

    ...say('FITTED RENT ± A MARGIN', PRED_COLOR)
  );

  // 29: finish the formula.
  // The combined doubt includes both sources of uncertainty.

  await until(S(29));
  await play(
    ...fbox([
      ['PREDICTION INTERVAL', PRED_COLOR],
      'fitted rent',
      '± multiplier × √(',
      ['    line wobble²', MEAN_COLOR],
      ['  + own noise²', NOISE_COLOR],
      ')'
    ], PRED_COLOR),

    ...say('COMBINE LINE WOBBLE AND OWN NOISE', PRED_COLOR)
  );

  // ============================================================
  // 30-32: answer the original question about the asking price.
  // ============================================================

  askDot = askingPoint();
  fitDot = fittedPoint(false);

  const at70Prediction = bandCrossSection(
    NEW_AREA,
    'prediction'
  );

  const askingGuide = dashed(
    pt(gx(NEW_AREA), GY0),
    pt(gx(NEW_AREA), gy(ASKING)),
    ASK_COLOR
  );

  // 30: $1,180 lies inside the prediction band at 70 m².

  await until(S(30));
  await play(
    ...addPicture(
      at70Prediction,
      askingGuide,
      fitDot,
      askDot
    ),

    ...fbox([
      ['CHECK THE LISTING', ASK_COLOR],
      'area = 70 m²',
      ['asking = 1,180', ASK_COLOR],
      ['984 < 1,180 < 1,216', PRED_COLOR],
      ['inside the wide band', ASK_COLOR]
    ], ASK_COLOR),

    ...say('$1,180 IS INSIDE THE WIDE BAND', ASK_COLOR)
  );

  // A zoomed side-by-side comparison on the same rent scale.

  function comparisonPicture(
    highlight = 'prediction',
    showAsk = true,
    hypothetical = false
  ) {
    const yMean = CY + 0.78;
    const yPred = CY - 0.27;

    const floorY = CY - 1.06;

    const parts = [
      intervalTitle(
        'Two ranges for a 70 m² apartment'
      ),

      line(
        pt(rx(RMIN), floorY),
        pt(rx(RMAX), floorY),
        C.muted,
        2
      ),

      dashed(
        pt(rx(PREDICTED), floorY),
        pt(rx(PREDICTED), yMean + 0.28),
        MEAN_COLOR
      )
    ];

    [950, 1000, 1100, 1200, 1250].forEach(v => {
      parts.push(
        line(
          pt(rx(v), floorY - 0.06),
          pt(rx(v), floorY + 0.06),
          C.muted,
          1
        ),

        txt(
          fmt(v),
          P ? 13 : 14,
          v === PREDICTED
            ? MEAN_COLOR
            : C.muted,
          pt(rx(v), floorY - 0.25),
          true
        )
      );
    });

    parts.push(
      rangeBar(
        CI_LOW,
        CI_HIGH,
        yMean,
        MEAN_COLOR,
        {
          labels: true,
          height: 0.25,
          labelY: 0.30,
          labelSize: 15
        }
      ),

      rangeBar(
        PI_LOW,
        PI_HIGH,
        yPred,
        PRED_COLOR,
        {
          labels: true,
          height: 0.30,
          labelY: 0.32,
          labelSize: 15
        }
      ),

      txt(
        'mean',
        16,
        MEAN_COLOR,
        pt(rx(RMIN) + 0.33, yMean)
      ),

      txt(
        'one case',
        16,
        PRED_COLOR,
        pt(rx(RMIN) + 0.55, yPred - 0.42)
      )
    );

    if (showAsk) {
      const x = rx(ASKING);

      parts.push(
        dashed(
          pt(x, floorY),
          pt(x, yMean + 0.06),
          ASK_COLOR
        ),

        glowDot(
          pt(x, yPred),
          ASK_COLOR,
          0.10
        ),

        circle(
          pt(x, yMean),
          0.085,
          ASK_COLOR,
          0
        ),

        tag(
          '$1,180',
          ASK_COLOR,
          pt(x + 0.13, yMean + 0.36),
          16
        )
      );
    }

    if (hypothetical) {
      // Illustrative possible rents at 70 m².
      // These are not extra observations in the shared dataset.

      [1005, 1040, 1155, 1195].forEach(v => {
        parts.push(
          dot(
            pt(rx(v), yPred),
            0.058,
            NOISE_COLOR
          ),

          dashed(
            pt(rx(v), yPred + 0.10),
            pt(rx(v), yMean - 0.09),
            NOISE_COLOR
          )
        );
      });
    }

    const bottomText =
      highlight === 'mean'
        ? 'The thin range is for the mean, not a case'
        : highlight === 'both'
          ? 'Different questions need different ranges'
          : 'The asking price is inside the wide range';

    const color =
      highlight === 'mean'
        ? C.amber
        : highlight === 'both'
          ? C.ink
          : ASK_COLOR;

    parts.push(
      txt(
        bottomText,
        P ? 17 : 16,
        color,
        local(0, -1.78),
        false,
        W - 0.35
      )
    );

    if (highlight === 'mean') {
      parts.push(
        outline(
          rx(CI_HIGH) - rx(CI_LOW) + 0.78,
          0.90,
          pt(rx(PREDICTED), yMean + 0.12),
          C.amber
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // 31: the price is not unusual under this model.

  await until(S(31));
  await play(
    ...picture(
      comparisonPicture('prediction', true)
    ),

    ...fbox([
      ['MODEL CHECK', ASK_COLOR],
      ['$1,180', ASK_COLOR],
      'is inside the',
      'prediction interval',
      ['not unusual for 70 m²', ASK_COLOR]
    ], ASK_COLOR),

    ...say('NOT UNUSUAL FOR THIS SIZE', ASK_COLOR)
  );

  // 32: a prediction interval supplies a range for one case.

  await until(S(32));
  await play(
    ...fbox([
      ['WHAT IS IT FOR?', PRED_COLOR],
      'a realistic range',
      'for one new case',
      ['includes own noise', NOISE_COLOR],
      'not only the',
      ['estimated average', MEAN_COLOR]
    ], PRED_COLOR),

    ...say('A REALISTIC RANGE FOR ONE NEW CASE', PRED_COLOR)
  );

  // ============================================================
  // 33-35: the common trap and the model assumptions.
  // ============================================================

  // 33: using the mean interval for an individual apartment
  // answers the wrong question.

  await until(S(33));
  await play(
    ...picture(
      comparisonPicture('mean', true)
    ),

    ...fbox([
      ['COMMON TRAP', C.amber],
      ['mean interval', MEAN_COLOR],
      '1,068 to 1,132',
      ['1,180 is outside!', C.amber],
      'but this is the',
      ['WRONG interval', C.amber]
    ], C.amber),

    ...say('DO NOT USE THE MEAN INTERVAL FOR ONE CASE', C.amber)
  );

  // Highlight actual observations that fall outside the
  // conventional mean confidence band but inside the
  // conventional prediction band.

  function ordinaryOutsideMean() {
    const parts = [];

    DATA.forEach(d => {
      const outsideMean =
        d.rent < meanLow(d.area) ||
        d.rent > meanHigh(d.area);

      const insidePrediction =
        d.rent >= predictionLow(d.area) &&
        d.rent <= predictionHigh(d.area);

      if (outsideMean && insidePrediction) {
        parts.push(
          circle(
            pt(gx(d.area), gy(d.rent)),
            0.13,
            NOISE_COLOR,
            0
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  // 34: ordinary individual prices can lie outside the
  // mean band. Show this using the actual shared sample.

  axes = scatterAxes();
  fitLine = fittedLine();
  points = scatterDots();
  legend = scatterLegend();

  wideBand = predictionBand();
  thinBand = confidenceBand();
  bandKey = bandLegend();

  const ordinaryRings = ordinaryOutsideMean();

  await until(S(34));
  await play(
    ...picture(
      axes,
      wideBand,
      thinBand,
      fitLine,
      points,
      legend,
      bandKey,
      ordinaryRings
    ),

    ...fbox([
      ['ORDINARY PRICES', NOISE_COLOR],
      'can fall outside',
      'the thin mean band',
      'but remain inside',
      ['the prediction band', PRED_COLOR]
    ], C.amber),

    ...say('THE THIN BAND CAN MISLABEL ORDINARY PRICES', C.amber)
  );

  // 35: prediction requires the new case to behave like
  // the cases used to fit the model.
  // Conventional interval validity also depends on the
  // regression assumptions discussed in lesson 10.1.9.

  function assumptionsPicture() {
    const parts = [];

    const left = CX - W * 0.24;
    const right = CX + W * 0.24;

    const titleY = CY + 1.53;

    parts.push(
      txt(
        'Does the new case belong with the sample?',
        P ? 20 : 19,
        C.ink,
        pt(CX, titleY),
        false,
        W - 0.35
      ),

      outline(
        W * 0.43,
        1.95,
        pt(left, CY + 0.07),
        MEAN_COLOR
      ),

      outline(
        W * 0.43,
        1.95,
        pt(right, CY + 0.07),
        ASK_COLOR
      )
    );

    BUILDINGS.forEach((b, k) => {
      const x = left + (k - 1) * 0.69;

      parts.push(
        apartmentIcon(
          x,
          CY + 0.31,
          BC[b],
          0.78
        ),

        txt(
          b,
          15,
          BC[b],
          pt(x, CY - 0.28),
          true
        )
      );
    });

    parts.push(
      apartmentIcon(
        right,
        CY + 0.15,
        ASK_COLOR,
        1.10
      ),

      txt(
        'sample',
        18,
        MEAN_COLOR,
        pt(left, CY - 0.63)
      ),

      txt(
        'new case',
        18,
        ASK_COLOR,
        pt(right, CY - 0.63)
      ),

      arrow(
        pt(left + W * 0.22, CY + 0.05),
        pt(right - W * 0.22, CY + 0.05),
        C.muted,
        2
      ),

      txt(
        'Comparable conditions?',
        19,
        C.amber,
        local(0, -1.27)
      ),

      txt(
        'Check the model assumptions',
        P ? 16 : 17,
        C.muted,
        local(0, -1.79)
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(35));
  await play(
    ...picture(
      assumptionsPicture()
    ),

    ...fbox([
      ['CHECK THE MODEL', C.amber],
      'new apartment must',
      'behave like those',
      'in the sample',
      ['check assumptions', C.amber],
      ['before trusting range', C.amber]
    ], C.amber),

    ...say('NEW CASE MUST FIT THE MODEL ASSUMPTIONS', C.amber)
  );

  // ============================================================
  // 36: final takeaway.
  // The prediction interval is wider because it includes
  // the new apartment's own uncertainty.
  // ============================================================

  axes = scatterAxes();
  fitLine = fittedLine();
  points = scatterDots();
  legend = scatterLegend();

  wideBand = predictionBand();
  thinBand = confidenceBand();
  bandKey = bandLegend();

  askDot = askingPoint();

  const finalMeanSection = bandCrossSection(
    NEW_AREA,
    'mean'
  );

  const finalPredictionSection = bandCrossSection(
    NEW_AREA,
    'prediction'
  );

  await until(S(36));
  await play(
    ...picture(
      axes,
      wideBand,
      thinBand,
      fitLine,
      points,
      legend,
      bandKey,
      finalPredictionSection,
      finalMeanSection,
      askDot
    ),

    ...fbox([
      ['PREDICTION INTERVAL', PRED_COLOR],
      'includes both:',
      ['line uncertainty', MEAN_COLOR],
      ['apartment own noise', NOISE_COLOR],
      ['one-case range', PRED_COLOR],
      ['$984 to $1,216', PRED_COLOR]
    ], PRED_COLOR),

    ...say('LINE UNCERTAINTY + OWN NOISE', PRED_COLOR)
  );

  await until(S(36) + 3.0);
  await play(
    ...picture(
      comparisonPicture('both', true)
    ),

    ...fbox([
      ['REMEMBER THE DIFFERENCE', C.ink],
      ['MEAN:', MEAN_COLOR],
      ['$1,068 to $1,132', MEAN_COLOR],
      ['ONE NEW CASE:', PRED_COLOR],
      ['$984 to $1,216', PRED_COLOR],
      ['own noise makes it wider', NOISE_COLOR]
    ], PRED_COLOR),

    ...say('PREDICTION INTERVALS INCLUDE INDIVIDUAL NOISE', PRED_COLOR)
  );
}

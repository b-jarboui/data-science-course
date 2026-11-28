// lesson 10.1.9
// Model assumptions: independence and shared building errors.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API and shared chapter data.
// Wider uncertainty illustrations are schematic, not calculated intervals.
// Browser playback and device layouts have not been runtime-tested.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Shared chapter data: area first, then building X, Y, Z.

  const AREAS = [40, 60, 80, 100];

  const BUILDINGS = ['X', 'Y', 'Z'];

  const RENTS = {
    X: [860, 1040, 1250, 1470],
    Y: [770, 1020, 1210, 1380],
    Z: [770, 940, 1140, 1350]
  };

  const FITTED = AREAS.map(a => 400 + 10 * a);

  const RESIDUALS = {
    X: RENTS.X.map((r, k) => r - FITTED[k]),
    Y: RENTS.Y.map((r, k) => r - FITTED[k]),
    Z: RENTS.Z.map((r, k) => r - FITTED[k])
  };

  const sum = xs => xs.reduce((a, b) => a + b, 0);

  const MEANS = {
    X: sum(RESIDUALS.X) / 4,
    Y: sum(RESIDUALS.Y) / 4,
    Z: sum(RESIDUALS.Z) / 4
  };

  const PINK = C.pink || '#F472B6';

  const BC = {
    X: C.cyan,
    Y: C.amber,
    Z: PINK
  };

  const SLOPE = 10;
  const CI_LOW = 8.56;
  const CI_HIGH = 11.44;
  const R2 = 0.96;

  // Laptop: main picture left, formula box right.
  // Phone: main picture above, formula box below.

  const CX = P ? 0 : -2.6;
  const CY = P ? 0.35 : -0.35;

  const W = P ? FW - 1.3 : 7.2;

  const PILL = P ? [0, 3.75, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.0, 0] : [4.3, -0.3, 0];

  const pt = (x, y) => [x, y, 0];
  const local = (x, y) => pt(CX + x, CY + y);

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fmt = v => v.toLocaleString('en-US');

  const signed = v =>
    v > 0 ? `+${v}` :
    v < 0 ? `−${Math.abs(v)}` :
    '0';

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

  function circle(p, radius, color, opacity = 0.1) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo(p);

    return c;
  }

  function rect(w, h, p, color, opacity = 0.8) {
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

  function arrow(a, b, color = C.cyan, strokeWidth = 3) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);

    if (len < 0.00001) {
      return dot(a, 0.045, color);
    }

    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(0.17, len * 0.35);
    const w = h * 0.52;

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

  // Formula box: same construction as the approved reference.
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

    if (scale < 1) g.scale(scale);

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
    return groups.map(g => new M.FadeIn(g));
  }

  function removePicture(...groups) {
    const a = [];

    groups.forEach(g => {
      if (visible.includes(g)) {
        visible = visible.filter(x => x !== g);
        a.push(new M.FadeOut(g));
      }
    });

    return a;
  }

  // ============================================================
  // Slope interval picture.
  // The exact previous interval is 8.56 to 11.44.
  // Narration rounds this to about 8.5 to 11.5.
  // ============================================================

  const INT_W = W - 0.9;

  const ix = v =>
    CX - INT_W / 2 + (v - 7) / 6 * INT_W;

  function intervalPicture(mode = 'normal') {
    const y = CY - 0.25;

    const color =
      mode === 'normal' ? C.green : C.amber;

    const parts = [
      txt(
        'Slope: dollars per square metre',
        P ? 19 : 18,
        C.ink,
        local(0, 1.42)
      ),

      line(
        pt(ix(7), y),
        pt(ix(13), y),
        C.muted,
        2
      )
    ];

    for (let v = 7; v <= 13; v++) {
      parts.push(
        line(
          pt(ix(v), y - 0.08),
          pt(ix(v), y + 0.08),
          C.muted,
          1.5
        ),

        txt(
          String(v),
          P ? 15 : 16,
          C.muted,
          pt(ix(v), y - 0.30),
          true
        )
      );
    }

    // The previously calculated interval.

    parts.push(
      rect(
        ix(CI_HIGH) - ix(CI_LOW),
        0.25,
        pt((ix(CI_LOW) + ix(CI_HIGH)) / 2, y),
        color,
        0.22
      ),

      line(
        pt(ix(CI_LOW), y),
        pt(ix(CI_HIGH), y),
        color,
        5
      ),

      line(
        pt(ix(CI_LOW), y - 0.18),
        pt(ix(CI_LOW), y + 0.18),
        color,
        3
      ),

      line(
        pt(ix(CI_HIGH), y - 0.18),
        pt(ix(CI_HIGH), y + 0.18),
        color,
        3
      ),

      glowDot(
        pt(ix(SLOPE), y),
        C.cyan,
        0.11
      ),

      txt(
        '8.56',
        18,
        color,
        pt(ix(CI_LOW), y + 0.38),
        true
      ),

      txt(
        '11.44',
        18,
        color,
        pt(ix(CI_HIGH), y + 0.38),
        true
      ),

      tag(
        'SLOPE = 10',
        C.cyan,
        pt(ix(SLOPE), y - 0.81),
        18
      )
    );

    if (mode === 'normal') {
      parts.push(
        txt(
          'Usual 95% confidence interval',
          18,
          C.green,
          local(0, 0.82)
        ),

        txt(
          'About 8.5 to 11.5',
          17,
          C.muted,
          local(0, -1.78)
        )
      );
    }

    if (mode === 'warning') {
      parts.push(
        txt(
          'Previous interval: assumptions in doubt',
          P ? 17 : 17,
          C.amber,
          local(0, 0.82)
        ),

        tag(
          'CHECK INDEPENDENCE',
          C.amber,
          local(0, -1.77),
          17
        )
      );
    }

    if (mode === 'wide') {
      // Illustrative widening only.
      // No corrected numerical endpoints are asserted.

      const yy = y + 0.92;
      const l = ix(7.35);
      const r = ix(12.65);

      parts.push(
        dashed(
          pt(l, yy),
          pt(r, yy),
          C.violet
        ),

        arrow(
          pt(ix(CI_LOW), yy),
          pt(l, yy),
          C.violet,
          2
        ),

        arrow(
          pt(ix(CI_HIGH), yy),
          pt(r, yy),
          C.violet,
          2
        ),

        txt(
          '?',
          24,
          C.violet,
          pt(l - 0.12, yy + 0.27)
        ),

        txt(
          '?',
          24,
          C.violet,
          pt(r + 0.12, yy + 0.27)
        ),

        txt(
          'May need a wider interval',
          17,
          C.violet,
          pt(CX, yy + 0.34)
        ),

        txt(
          'Illustration, not a recalculated interval',
          P ? 15 : 16,
          C.muted,
          local(0, -1.80)
        )
      );
    }

    if (mode === 'slope') {
      parts.push(
        txt(
          'The fitted slope has not changed',
          18,
          C.cyan,
          local(0, 0.83)
        ),

        txt(
          'The uncertainty is what needs checking',
          P ? 15 : 17,
          C.amber,
          local(0, -1.80)
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 0-5: recall the interval and introduce model assumptions.
  // ============================================================

  // 0: the previous slope confidence interval.

  await until(S(0));
  await play(
    ...picture(intervalPicture('normal')),

    ...fbox([
      ['FROM THE LAST LESSON', C.green],
      ['slope = 10', C.cyan],
      '95% confidence',
      'interval:',
      ['8.56 to 11.44', C.green]
    ], C.green),

    ...say('SLOPE INTERVAL: ABOUT 8.5 TO 11.5', C.green)
  );

  // 1: the interval relies on assumptions.

  function assumptionsPicture(active = 0, checked = false) {
    const labels = [
      'Straight-line mean',
      'Similar noise size',
      'Independent errors'
    ];

    const colors = [
      C.cyan,
      C.violet,
      C.amber
    ];

    const parts = [
      txt(
        'Promises behind the usual interval',
        P ? 19 : 18,
        C.ink,
        local(0, 1.48)
      )
    ];

    labels.forEach((s, k) => {
      const y = CY + 0.72 - k * 0.86;

      const c =
        active === 0 || active === k + 1
          ? colors[k]
          : C.muted;

      parts.push(
        outline(
          W - 1.2,
          0.65,
          pt(CX, y),
          c
        ),

        circle(
          pt(CX - (W - 1.2) / 2 + 0.43, y),
          0.19,
          c,
          0.12
        ),

        txt(
          String(k + 1),
          17,
          c,
          pt(CX - (W - 1.2) / 2 + 0.43, y),
          true
        ),

        txt(
          s,
          P ? 20 : 19,
          c,
          pt(CX + 0.14, y)
        )
      );

      if (checked && k === 2) {
        parts.push(
          txt(
            '!',
            25,
            C.amber,
            pt(CX + (W - 1.2) / 2 - 0.37, y),
            true
          )
        );
      }
    });

    parts.push(
      txt(
        checked
          ? 'Independence needs particular attention'
          : 'These conditions need checking',
        P ? 16 : 17,
        C.muted,
        local(0, -1.72)
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(1));
  await play(
    ...picture(assumptionsPicture()),

    ...fbox([
      ['ASSUMPTIONS', C.violet],
      'promises about',
      'how the data behave',
      ['the interval relies', C.amber],
      ['on these promises', C.amber]
    ], C.violet),

    ...say('ASSUMPTIONS = PROMISES ABOUT THE DATA', C.violet)
  );

  // ============================================================
  // Apartment scatter plot.
  // X cyan, Y amber, Z pink.
  // The two equal rents at 40 m² are concentric, not displaced.
  // ============================================================

  const GX0 = CX - W / 2 + 0.65;
  const GX1 = CX + W / 2 - 0.20;

  const GY0 = CY - 1.60;
  const GY1 = CY + (P ? 2.05 : 1.53);

  const gx = a =>
    GX0 + (a - 35) / 70 * (GX1 - GX0);

  const gy = r =>
    GY0 + (r - 700) / 850 * (GY1 - GY0);

  function scatterAxes() {
    const parts = [];

    [800, 1000, 1200, 1400].forEach(v => {
      parts.push(
        line(
          pt(GX0, gy(v)),
          pt(GX1, gy(v)),
          C.muted,
          0.7
        ),

        txt(
          fmt(v),
          P ? 13 : 14,
          C.muted,
          pt(GX0 - 0.34, gy(v)),
          true
        )
      );
    });

    AREAS.forEach(a => {
      parts.push(
        line(
          pt(gx(a), GY0),
          pt(gx(a), GY1),
          C.muted,
          0.65
        ),

        txt(
          String(a),
          P ? 15 : 15,
          C.muted,
          pt(gx(a), GY0 - 0.26),
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
        pt(GX0 + 0.45, GY1 + 0.19)
      ),

      txt(
        'area (m²)',
        15,
        C.muted,
        pt(GX1 - 0.49, GY0 - 0.55)
      )
    );

    return new M.VGroup(...parts);
  }

  function fittedLine() {
    const a = pt(gx(35), gy(750));
    const b = pt(gx(105), gy(1450));

    return new M.VGroup(
      line(a, b, C.cyan, 7),
      line(a, b, C.ink, 3)
    );
  }

  function scatterLegend() {
    const parts = [];

    BUILDINGS.forEach((b, k) => {
      const x = GX0 + 0.14 + k * 0.71;
      const y = GY0 - 0.55;

      parts.push(
        dot(pt(x, y), 0.055, BC[b]),

        txt(
          b,
          15,
          BC[b],
          pt(x + 0.19, y),
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function scatterDots(colored = true, focus = null) {
    const groups = [];

    BUILDINGS.forEach(b => {
      const color =
        !colored ? C.ink :
        !focus || focus === b ? BC[b] :
        C.muted;

      RENTS[b].forEach((r, k) => {
        const p = pt(gx(AREAS[k]), gy(r));

        // Buildings Y and Z share the exact coordinate (40, 770).

        if (b === 'Y' && k === 0) {
          groups.push(
            circle(p, 0.105, color, 0)
          );
        } else if (b === 'Z' && k === 0) {
          groups.push(
            dot(p, 0.052, color)
          );
        } else {
          groups.push(
            glowDot(
              p,
              color,
              focus === b ? 0.085 : 0.067
            )
          );
        }
      });
    });

    return new M.VGroup(...groups);
  }

  function allResidualSticks(colored = false) {
    const parts = [];

    BUILDINGS.forEach(b => {
      RENTS[b].forEach((r, k) => {
        // The Y and Z sticks at area 40 coincide.
        if (b === 'Z' && k === 0) return;

        const x = gx(AREAS[k]);
        const color = colored ? BC[b] : C.muted;

        parts.push(
          line(
            pt(x, gy(FITTED[k])),
            pt(x, gy(r)),
            color,
            2
          )
        );
      });
    });

    return new M.VGroup(...parts);
  }

  function buildingSticks(b) {
    return RESIDUALS[b].map((r, k) => {
      const x = gx(AREAS[k]);

      const a = pt(x, gy(FITTED[k]));
      const z = pt(x, gy(RENTS[b][k]));

      return new M.VGroup(
        line(a, z, BC[b], 3),

        line(
          pt(x - 0.06, a[1]),
          pt(x + 0.06, a[1]),
          BC[b],
          2
        ),

        glowDot(z, BC[b], 0.075)
      );
    });
  }

  function meanPoints() {
    const parts = [];

    AREAS.forEach((a, k) => {
      parts.push(
        circle(
          pt(gx(a), gy(FITTED[k])),
          0.105,
          C.green,
          0.13
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function noiseRulers() {
    const parts = [];

    AREAS.forEach((a, k) => {
      const x = gx(a) + 0.30;

      // An illustrative equal-size reference ruler:
      // 50 dollars above and below the fitted mean.

      const y1 = gy(FITTED[k] - 50);
      const y2 = gy(FITTED[k] + 50);

      parts.push(
        line(pt(x, y1), pt(x, y2), C.violet, 5),

        line(
          pt(x - 0.12, y1),
          pt(x + 0.12, y1),
          C.violet,
          3.5
        ),

        line(
          pt(x - 0.12, y2),
          pt(x + 0.12, y2),
          C.violet,
          3.5
        )
      );
      if (k === 0) {
        parts.push(txt('±$50', P ? 17 : 16, C.violet, pt(x + 0.42, (y1 + y2) / 2), true));
      }
    });

    parts.push(
      txt(
        'Same-size noise reference',
        P ? 16 : 15,
        C.violet,
        pt(CX + 0.32, GY1 + 0.19)
      )
    );

    return new M.VGroup(...parts);
  }

  let axes = scatterAxes();
  let fitLine = fittedLine();
  let points = scatterDots(false);
  let legend = null;

  let means = meanPoints();

  // 2: assumption one — the mean follows a straight line.

  await until(S(2));
  await play(
    ...picture(
      axes,
      fitLine,
      points,
      means
    ),

    ...fbox([
      ['ASSUMPTION 1', C.cyan],
      'mean rent follows',
      'a straight line',
      ['rent = 400', C.cyan],
      ['     + 10 × area', C.cyan]
    ], C.cyan),

    ...say('1. THE MEAN FOLLOWS A STRAIGHT LINE', C.cyan)
  );

  // 3: assumption two — noise has a similar size everywhere.

  const rulers = noiseRulers();
  const initialResiduals = allResidualSticks(false);

  await until(S(3));
  await play(
    ...removePicture(means),
    ...addPicture(initialResiduals, rulers),

    ...fbox([
      ['ASSUMPTION 2', C.violet],
      'similar noise size',
      'for small and large',
      'apartments',
      ['spread stays similar', C.violet]
    ], C.violet),

    ...say('2. SIMILAR NOISE SIZE EVERYWHERE', C.violet)
  );

  // 4: today's focus is independence.

  await until(S(4));
  await play(
    ...removePicture(rulers),

    ...fbox([
      ['ASSUMPTION 3', C.amber],
      ['INDEPENDENCE', C.amber],
      'the errors should',
      'not share a pattern',
      'of dependence'
    ], C.amber),

    ...say('3. INDEPENDENCE', C.amber)
  );

  // 5: independence means one residual does not tell us
  // about the value of another residual.

  const independentExample = new M.VGroup(
    circle(
      pt(gx(40), gy(860)),
      0.15,
      C.amber,
      0
    ),

    circle(
      pt(gx(80), gy(1140)),
      0.15,
      C.amber,
      0
    )
  );

  await until(S(5));
  await play(
    ...addPicture(independentExample),

    ...fbox([
      ['INDEPENDENT ERRORS', C.amber],
      'knowing one residual',
      'tells us nothing',
      'about another',
      ['no shared information', C.green]
    ], C.amber),

    ...say('ONE ERROR TELLS US NOTHING ABOUT ANOTHER', C.amber)
  );

  // ============================================================
  // 6-14: examine the residuals by building.
  // ============================================================

  // 6: reveal the chapter's building colours.

  await until(S(6));

  const coloredPoints = scatterDots(true);
  legend = scatterLegend();

  await play(
    ...removePicture(
      points,
      initialResiduals,
      independentExample
    ),

    ...addPicture(coloredPoints, legend),

    ...fbox([
      ['COLOUR BY BUILDING', C.ink],
      ['X = cyan', BC.X],
      ['Y = amber', BC.Y],
      ['Z = pink', BC.Z]
    ], C.cyan),

    ...say('LOOK AT WHICH BUILDING EACH DOT BELONGS TO')
  );

  points = coloredPoints;

  let focusSticks = [];
  let focusLabel = null;

  function selectBuilding(b, showSticks = true) {
    const nextPoints = scatterDots(true, b);

    const a = removePicture(
      points,
      ...focusSticks
    );

    if (focusLabel) {
      a.push(...removePicture(focusLabel));
    }

    points = nextPoints;

    focusSticks = showSticks
      ? buildingSticks(b)
      : [];

    focusLabel = tag(
      `BUILDING ${b}`,
      BC[b],
      pt(CX + 0.5, GY1 + 0.20),
      16
    );

    a.push(
      ...addPicture(
        points,
        ...focusSticks,
        focusLabel
      )
    );

    return a;
  }

  // 7: focus on building X.

  await until(S(7));
  await play(
    ...selectBuilding('X'),

    ...fbox([
      ['BUILDING X', BC.X],
      'four apartments',
      'four residuals',
      'actual − fitted'
    ], BC.X),

    ...say('FIRST: BUILDING X', BC.X)
  );

  // Residual values are displayed in the formula box to keep
  // the closely spaced scatter dots and sticks readable.

  function buildingResidualBox(b, includeMean = false) {
    const rs = RESIDUALS[b];

    const rows = [
      [`BUILDING ${b}`, BC[b]],
      ['AREA   RESIDUAL', C.muted]
    ];

    AREAS.forEach((a, k) => {
      const areaText = String(a).padStart(3);
      const valueText = signed(rs[k]).padStart(5);

      rows.push([
        `${areaText}      ${valueText}`,
        BC[b]
      ]);
    });

    if (includeMean) {
      rows.push([
        `mean = ${signed(MEANS[b])}`,
        BC[b]
      ]);
    }

    return rows;
  }

  // 8: +60, +40, +50, +70.

  await until(S(8));
  await play(
    new M.LaggedStart(
      focusSticks.map(g =>
        new M.Indicate(g, { color: BC.X })
      ),
      { lagRatio: 0.24, runTime: 2.6 }
    ),

    ...fbox(
      buildingResidualBox('X'),
      BC.X
    ),

    ...say('X: +60, +40, +50, +70', BC.X)
  );

  // 9: all four are above; average residual +55 dollars.

  await until(S(9));
  await play(
    ...fbox([
      ['ALL ABOVE THE LINE', BC.X],
      '+60 + 40',
      '    + 50 + 70',
      'sum = +220',
      '220 ÷ 4',
      ['mean = +55 dollars', BC.X]
    ], BC.X),

    new M.LaggedStart(
      focusSticks.map(g =>
        new M.Indicate(g, { color: BC.X })
      ),
      { lagRatio: 0.14, runTime: 1.6 }
    ),

    ...say('X: AVERAGE 55 DOLLARS ABOVE', BC.X)
  );

  // 10: switch to building Z.

  await until(S(10));
  await play(
    ...selectBuilding('Z'),

    ...fbox([
      ['BUILDING Z', BC.Z],
      'look at its',
      'four residuals'
    ], BC.Z),

    ...say('NOW: BUILDING Z', BC.Z)
  );

  // 11: −30, −60, −60, −50.

  await until(S(11));
  await play(
    new M.LaggedStart(
      focusSticks.map(g =>
        new M.Indicate(g, { color: BC.Z })
      ),
      { lagRatio: 0.24, runTime: 2.7 }
    ),

    ...fbox(
      buildingResidualBox('Z'),
      BC.Z
    ),

    ...say('Z: −30, −60, −60, −50', BC.Z)
  );

  // 12: all four are below; mean residual −50 dollars.

  await until(S(12));
  await play(
    ...fbox([
      ['ALL BELOW THE LINE', BC.Z],
      '−30 − 60',
      '    − 60 − 50',
      'sum = −200',
      '−200 ÷ 4',
      ['mean = −50 dollars', BC.Z]
    ], BC.Z),

    new M.LaggedStart(
      focusSticks.map(g =>
        new M.Indicate(g, { color: BC.Z })
      ),
      { lagRatio: 0.14, runTime: 1.6 }
    ),

    ...say('Z: AVERAGE 50 DOLLARS BELOW', BC.Z)
  );

  // 13: building Y is mixed, with mean residual −5 dollars.

  await until(S(13));
  await play(
    ...selectBuilding('Y'),

    ...fbox([
      ['BUILDING Y', BC.Y],
      ['−30, +20, +10, −20', BC.Y],
      '2 above, 2 below',
      'sum = −20',
      '−20 ÷ 4',
      ['mean = −5 dollars', BC.Y]
    ], BC.Y),

    ...say('Y: MIXED · AVERAGE 5 DOLLARS BELOW', BC.Y)
  );

  // Grouped residual picture.
  // All twelve residuals share one common vertical scale.

  function residualGroupsPicture(showMeans = true, clusters = false) {
    const parts = [];

    const base = CY - 0.03;

    const halfW = W / 2 - 0.25;
    const spacing = (W - 0.8) / 3;

    const scale = P ? 0.019 : 0.015;

    const meanHalfWidth = spacing * 0.36;
    const innerSpacing = spacing * 0.17;

    parts.push(
      txt(
        'Residuals grouped by building',
        P ? 20 : 19,
        C.ink,
        local(0, P ? 2.30 : 1.70)
      )
    );

    [-60, 0, 60].forEach(v => {
      const y = base + v * scale;

      parts.push(
        line(
          pt(CX - halfW, y),
          pt(CX + halfW, y),
          C.muted,
          v === 0 ? 2 : 0.65
        ),

        txt(
          signed(v),
          16,
          C.muted,
          pt(CX - halfW - 0.24, y),
          true
        )
      );
    });

    BUILDINGS.forEach((b, j) => {
      const x = CX + (j - 1) * spacing;

      const color = BC[b];

      const rs = RESIDUALS[b];

      if (clusters) {
        parts.push(
          outline(
            spacing * 0.91,
            P ? 3.10 : 2.70,
            pt(x, base + 0.03),
            color
          )
        );
      }

      rs.forEach((r, k) => {
        const xx = x + (k - 1.5) * innerSpacing;

        const h = Math.abs(r) * scale;
        const y = base + r * scale;

        parts.push(
          rect(
            0.12,
            h,
            pt(xx, base + r * scale / 2),
            color,
            0.65
          ),

          glowDot(
            pt(xx, y),
            color,
            0.061
          )
        );
      });

      if (showMeans) {
        const ym = base + MEANS[b] * scale;

        parts.push(
          dashed(
            pt(x - meanHalfWidth, ym),
            pt(x + meanHalfWidth, ym),
            color
          ),

          txt(
            `mean ${signed(MEANS[b])}`,
            P ? 16 : 15,
            color,
            pt(x, CY - 1.78),
            true
          )
        );
      }

      parts.push(
        tag(
          `BUILDING ${b}`,
          color,
          pt(x, CY - 2.18),
          15
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // 14: compare the group patterns.

  let groupedResiduals = residualGroupsPicture(true, false);

  await until(S(14));
  await play(
    ...picture(groupedResiduals),

    ...fbox([
      ['GROUP PATTERNS', C.ink],
      ['X: mean +55', BC.X],
      ['Y: mean  −5', BC.Y],
      ['Z: mean −50', BC.Z],
      'X leans high',
      'Z leans low'
    ], C.violet),

    ...say('ERRORS IN A BUILDING CAN LEAN TOGETHER', C.violet)
  );

  // ============================================================
  // 15: apartments in a building share many conditions.
  // ============================================================

  function buildingIcon(x, y, color, name, active = true) {
    const w = 1.22;
    const h = 1.52;

    const c = active ? color : C.muted;

    const body = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.08,
      color: c,
      strokeWidth: 2
    });

    body.setFill(C.card, 0.8);
    body.moveTo(pt(x, y));

    const parts = [body];

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const wx = x + (col - 0.5) * 0.43;
        const wy = y + 0.25 - row * 0.47;

        parts.push(
          rect(
            0.30,
            0.31,
            pt(wx, wy),
            c,
            active ? 0.65 : 0.15
          )
        );
      }
    }

    parts.push(
      rect(
        0.26,
        0.29,
        pt(x, y - h / 2 + 0.17),
        c,
        0.25
      ),

      txt(
        name,
        17,
        c,
        pt(x, y - h / 2 - 0.28)
      )
    );

    return new M.VGroup(...parts);
  }

  function sharedBuildingPicture() {
    const spacing = (W - 0.7) / 3;
    const y = CY + 0.15;

    const parts = [
      txt(
        'Four apartments share one building',
        P ? 20 : 19,
        C.ink,
        local(0, 1.55)
      )
    ];

    BUILDINGS.forEach((b, j) => {
      const x = CX + (j - 1) * spacing;

      parts.push(
        buildingIcon(
          x,
          y,
          BC[b],
          b
        )
      );
    });

    const labels = [
      'landlord',
      'street',
      'elevator',
      'view'
    ];

    const dx = (W - 0.65) / 4;

    labels.forEach((s, k) => {
      const x = CX + (k - 1.5) * dx;

      parts.push(
        tag(
          s,
          C.violet,
          pt(x, CY - 1.52),
          P ? 15 : 15
        )
      );
    });

    parts.push(
      txt(
        'Shared conditions can create shared errors',
        P ? 16 : 17,
        C.muted,
        local(0, -2.05)
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(15));
  await play(
    ...picture(sharedBuildingPicture()),

    ...fbox([
      ['SHARED CONDITIONS', C.violet],
      'same landlord',
      'same street',
      'same elevator',
      'same view',
      ['shared influences', C.amber]
    ], C.violet),

    ...say('SAME BUILDING · SHARED INFLUENCES', C.violet)
  );

  // ============================================================
  // 16-19: twelve strangers versus three families.
  // This is an analogy, not additional apartment data.
  // ============================================================

  function person(x, y, color = C.ink, scale = 1) {
    const head = new M.Circle({
      radius: 0.10 * scale,
      color,
      strokeWidth: 1
    });

    head.setFill(color, 1);
    head.moveTo(pt(x, y + 0.22 * scale));

    const body = new M.Arc({
      radius: 0.19 * scale,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.85);
    body.moveTo(pt(x, y - 0.02 * scale));

    return new M.VGroup(head, body);
  }

  const OPINION_COLORS = [
    C.cyan,
    C.amber,
    PINK,
    C.green,
    C.violet,
    C.ink
  ];

  function speechBubble(x, y, color, symbol = '•') {
    const r = new M.RoundedRectangle({
      width: 0.49,
      height: 0.31,
      cornerRadius: 0.09,
      color,
      strokeWidth: 1.5
    });

    r.setFill(C.card, 0.95);
    r.moveTo(pt(x, y));

    return new M.VGroup(
      r,

      line(
        pt(x - 0.09, y - 0.15),
        pt(x - 0.16, y - 0.24),
        color,
        1.5
      ),

      txt(
        symbol,
        16,
        color,
        pt(x, y)
      )
    );
  }

  function strangersPicture() {
    const parts = [
      txt(
        'Ask twelve strangers',
        P ? 22 : 21,
        C.ink,
        local(0, 1.56)
      )
    ];

    const dx = (W - 1.0) / 6;
    const dy = 1.02;

    const symbols = [
      '+', '−', '○', '+', '○', '−',
      '○', '+', '−', '−', '+', '○'
    ];

    for (let k = 0; k < 12; k++) {
      const row = Math.floor(k / 6);
      const col = k % 6;

      const x = CX + (col - 2.5) * dx;
      const y = CY + 0.44 - row * dy;

      const color = OPINION_COLORS[k % 6];

      parts.push(
        person(x, y, color, 0.94),

        speechBubble(
          x,
          y + 0.55,
          color,
          symbols[k]
        )
      );
    }

    parts.push(
      tag(
        '12 SEPARATE OPINIONS',
        C.green,
        local(0, -1.50),
        18
      ),

      txt(
        'Illustration: independent information',
        P ? 16 : 17,
        C.muted,
        local(0, -1.96)
      )
    );

    return new M.VGroup(...parts);
  }

  // 16: analogy — twelve strangers.

  await until(S(16));
  await play(
    ...picture(strangersPicture()),

    ...fbox([
      ['TWELVE STRANGERS', C.green],
      '12 people',
      'separate opinions',
      ['12 separate pieces', C.green],
      ['of information', C.green]
    ], C.green),

    ...say('12 STRANGERS · 12 SEPARATE OPINIONS', C.green)
  );

  function familiesPicture(asApartments = false, showConnections = false) {
    const spacing = (W - 0.45) / 3;

    const parts = [
      txt(
        asApartments
          ? 'Twelve apartments in three buildings'
          : 'Three families, four people each',
        P ? 19 : 19,
        C.ink,
        local(0, 1.57)
      )
    ];

    const familySymbols = [
      ['+', '+', '+', '+'],
      ['○', '+', '○', '−'],
      ['−', '−', '−', '−']
    ];

    BUILDINGS.forEach((b, j) => {
      const x = CX + (j - 1) * spacing;
      const c = BC[b];

      const border = new M.RoundedRectangle({
        width: spacing * 0.92,
        height: 2.23,
        cornerRadius: 0.16,
        color: c,
        strokeWidth: 2
      });

      border.setFill(c, 0.055);
      border.moveTo(pt(x, CY - 0.05));

      parts.push(border);

      const locations = [];

      for (let k = 0; k < 4; k++) {
        const row = Math.floor(k / 2);
        const col = k % 2;

        const px = x + (col - 0.5) * spacing * 0.42;
        const py = CY + 0.37 - row * 0.91;

        locations.push(pt(px, py));

        if (asApartments) {
          const r = RESIDUALS[b][k];

          parts.push(
            rect(
              0.37,
              0.36,
              pt(px, py + 0.05),
              c,
              0.26
            ),

            txt(
              signed(r),
              P ? 13 : 14,
              c,
              pt(px, py + 0.05),
              true
            ),

            txt(
              `${AREAS[k]} m²`,
              12,
              C.muted,
              pt(px, py - 0.26)
            )
          );
        } else {
          parts.push(
            person(px, py - 0.11, c, 0.84),

            speechBubble(
              px,
              py + 0.40,
              c,
              familySymbols[j][k]
            )
          );
        }
      }

      if (showConnections) {
        const yy = CY - 0.96;

        parts.push(
          line(
            pt(x - spacing * 0.29, yy),
            pt(x + spacing * 0.29, yy),
            c,
            2
          )
        );
      }

      parts.push(
        tag(
          asApartments
            ? `BUILDING ${b}`
            : `FAMILY ${j + 1}`,
          c,
          pt(x, CY - 1.44),
          15
        )
      );
    });

    parts.push(
      txt(
        asApartments
          ? '12 observations, grouped information'
          : 'Family members can echo one another',
        P ? 16 : 17,
        C.muted,
        local(0, -1.95)
      )
    );

    return new M.VGroup(...parts);
  }

  // 17: three families, four people in each family.

  await until(S(17));
  await play(
    ...picture(familiesPicture(false)),

    ...fbox([
      ['THREE FAMILIES', C.violet],
      '4 people in each',
      'still 12 people',
      'but opinions can',
      ['echo each other', C.amber]
    ], C.violet),

    ...say('12 PEOPLE · 3 CONNECTED FAMILIES', C.violet)
  );

  // 18: return from the analogy to the actual data.

  await until(S(18));
  await play(
    ...picture(familiesPicture(true)),

    ...fbox([
      ['OUR APARTMENTS', C.violet],
      '12 apartments',
      '3 buildings',
      '4 in each building',
      ['shared influences', C.amber]
    ], C.violet),

    ...say('OUR APARTMENTS ARE LIKE THE FAMILIES', C.violet)
  );

  // 19: errors that lean together are correlated.
  // This data pattern suggests dependence; it does not establish
  // an exact correlation coefficient.

  await until(S(19));
  await play(
    ...picture(familiesPicture(true, true)),

    ...fbox([
      ['CORRELATED ERRORS', C.violet],
      'errors can move',
      'or lean together',
      ['X tends high', BC.X],
      ['Z tends low', BC.Z]
    ], C.violet),

    ...say('ERRORS LEAN TOGETHER = CORRELATED', C.violet)
  );

  // ============================================================
  // 20-24: what dependence does to interval uncertainty.
  // ============================================================

  // Twelve information tokens, shown separately or grouped.
  // Grouping does not assert an effective sample size of exactly 3.

  function informationPicture(grouped = false) {
    const parts = [
      txt(
        grouped
          ? 'Some information is repeated'
          : 'The usual calculation',
        P ? 21 : 20,
        C.ink,
        local(0, 1.57)
      )
    ];

    if (!grouped) {
      const dx = (W - 0.65) / 6;

      for (let k = 0; k < 12; k++) {
        const row = Math.floor(k / 6);
        const col = k % 6;

        const x = CX + (col - 2.5) * dx;
        const y = CY + 0.66 - row * 0.83;

        parts.push(
          circle(
            pt(x, y),
            0.25,
            C.green,
            0.18
          ),

          txt(
            String(k + 1),
            16,
            C.green,
            pt(x, y),
            true
          )
        );
      }

      parts.push(
        tag(
          '12 INDEPENDENT PIECES?',
          C.green,
          local(0, -1.03),
          18
        ),

        txt(
          'The usual interval assumes they are independent',
          P ? 15 : 16,
          C.muted,
          local(0, -1.75)
        )
      );
    } else {
      const spacing = (W - 0.6) / 3;

      BUILDINGS.forEach((b, j) => {
        const x = CX + (j - 1) * spacing;
        const color = BC[b];

        const border = new M.RoundedRectangle({
          width: spacing * 0.91,
          height: 1.72,
          cornerRadius: 0.15,
          color,
          strokeWidth: 2
        });

        border.setFill(color, 0.05);
        border.moveTo(pt(x, CY + 0.11));

        parts.push(border);

        for (let k = 0; k < 4; k++) {
          const row = Math.floor(k / 2);
          const col = k % 2;

          const xx = x + (col - 0.5) * 0.58;
          const yy = CY + 0.43 - row * 0.58;

          parts.push(
            circle(
              pt(xx, yy),
              0.23,
              color,
              0.24
            ),

            txt(
              String(4 * j + k + 1),
              15,
              color,
              pt(xx, yy),
              true
            )
          );
        }

        parts.push(
          txt(
            `Building ${b}`,
            16,
            color,
            pt(x, CY - 1.03)
          )
        );
      });

      parts.push(
        txt(
          'Still 12 observations',
          19,
          C.ink,
          local(0, -1.49)
        ),

        txt(
          'Not necessarily 12 independent pieces',
          P ? 16 : 17,
          C.amber,
          local(0, -1.96)
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // 20: the usual interval treated all twelve observations
  // as independent pieces of information.

  await until(S(20));
  await play(
    ...picture(informationPicture(false)),

    ...fbox([
      ['USUAL INTERVAL', C.green],
      '12 observations',
      'treated as',
      ['12 independent', C.green],
      ['pieces of information', C.green]
    ], C.green),

    ...say('THE USUAL INTERVAL ASSUMED 12 INDEPENDENT CASES', C.green)
  );

  // 21: observations within a building partly repeat each other.

  await until(S(21));
  await play(
    ...picture(informationPicture(true)),

    ...fbox([
      ['SHARED INFORMATION', C.amber],
      'apartments in one',
      'building can partly',
      'repeat each other',
      ['independence doubtful', C.amber]
    ], C.amber),

    ...say('SAME-BUILDING INFORMATION CAN OVERLAP', C.amber)
  );

  // 22: the previously calculated interval is no longer reliable
  // merely because its arithmetic was correct.

  await until(S(22));
  await play(
    ...picture(intervalPicture('warning')),

    ...fbox([
      ['PREVIOUS INTERVAL', C.amber],
      '8.56 to 11.44',
      'assumed independent',
      'errors',
      ['needs reassessment', C.amber]
    ], C.amber),

    ...say('THE OLD INTERVAL NEEDS RECHECKING', C.amber)
  );

  // 23: correlated errors often make usual intervals too narrow.
  // The wider interval is deliberately unnumbered and schematic.
  // No claim is made that a particular corrected width has
  // been established for these twelve apartments.

  await until(S(23));
  await play(
    ...picture(intervalPicture('wide')),

    ...fbox([
      ['POSSIBLE PROBLEM', C.amber],
      'usual interval',
      'may be too narrow',
      'claims too much',
      ['certainty', C.amber],
      ['correct width unknown', C.muted]
    ], C.amber),

    ...say('TOO NARROW CAN MEAN TOO MUCH CERTAINTY', C.amber)
  );

  // 24: the fitted slope remains 10.
  // The uncertainty calculation, not the fitted line itself,
  // is the issue under discussion.

  await until(S(24));
  await play(
    ...picture(intervalPicture('slope')),

    ...fbox([
      ['WHAT HAS CHANGED?', C.ink],
      ['slope = 10', C.cyan],
      'same fitted line',
      ['uncertainty is', C.amber],
      ['what is in doubt', C.amber]
    ], C.cyan),

    ...say('SAME SLOPE · UNCERTAINTY IN DOUBT', C.cyan)
  );

  // ============================================================
  // 25-28: diagnose the dependence and introduce clusters.
  // ============================================================

  // 25: inspect residuals building by building.

  groupedResiduals = residualGroupsPicture(true, false);

  await until(S(25));
  await play(
    ...picture(groupedResiduals),

    ...fbox([
      ['STEP 1: INSPECT', C.green],
      'group the residuals',
      'by building',
      ['look for shared', C.amber],
      ['patterns', C.amber]
    ], C.green),

    ...say('LOOK AT RESIDUALS GROUP BY GROUP', C.green)
  );

  // 26: treat a building as a cluster.
  // The outlines are drawn from coordinates, not constructed
  // by wrapping already-visible residual objects.

  const clusterOutlines = BUILDINGS.map((b, j) => {
    const spacing = (W - 0.8) / 3;
    const x = CX + (j - 1) * spacing;

    return outline(
      spacing * 0.91,
      P ? 3.10 : 2.70,
      pt(x, CY),
      BC[b]
    );
  });

  await until(S(26));
  await play(
    new M.LaggedStart(
      clusterOutlines.map(r => new M.Create(r)),
      { lagRatio: 0.20, runTime: 1.7 }
    ),

    ...fbox([
      ['STEP 2: CLUSTERS', C.violet],
      'one building',
      '= one cluster',
      '4 apartments inside',
      ['3 clusters in all', C.violet]
    ], C.violet),

    ...say('ONE BUILDING = ONE CLUSTER', C.violet)
  );

  visible.push(...clusterOutlines);

  // 27: cluster-aware standard errors account for dependence
  // within groups. This lesson does not compute one.
  // With only three clusters, reliable inference needs special care.

  function clusterMethodPicture() {
    const parts = [
      txt(
        'Allow dependence within each cluster',
        P ? 19 : 18,
        C.ink,
        local(0, 1.63)
      )
    ];

    const spacing = (W - 0.65) / 3;

    BUILDINGS.forEach((b, j) => {
      const x = CX + (j - 1) * spacing;
      const c = BC[b];

      const box = new M.RoundedRectangle({
        width: spacing * 0.90,
        height: 1.44,
        cornerRadius: 0.15,
        color: c,
        strokeWidth: 2
      });

      box.setFill(c, 0.05);
      box.moveTo(pt(x, CY + 0.35));

      parts.push(box);

      const ps = [
        pt(x - 0.30, CY + 0.61),
        pt(x + 0.30, CY + 0.61),
        pt(x - 0.30, CY + 0.10),
        pt(x + 0.30, CY + 0.10)
      ];

      for (let a = 0; a < 4; a++) {
        for (let z = a + 1; z < 4; z++) {
          parts.push(
            line(ps[a], ps[z], c, 1.2)
          );
        }
      }

      ps.forEach(p => {
        parts.push(
          glowDot(p, c, 0.09)
        );
      });

      parts.push(
        txt(
          `Cluster ${b}`,
          16,
          c,
          pt(x, CY - 0.59)
        ),

        arrow(
          pt(x, CY - 0.82),
          pt(CX + (j - 1) * 0.56, CY - 1.20),
          c,
          2
        )
      );
    });

    parts.push(
      tag(
        'CLUSTER-AWARE UNCERTAINTY',
        C.green,
        local(0, -1.51),
        P ? 15 : 16
      ),

      txt(
        'Method introduced later in the course',
        P ? 15 : 16,
        C.muted,
        local(0, -2.00)
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(27));
  await play(
    ...picture(clusterMethodPicture()),

    ...fbox([
      ['CLUSTER-AWARE', C.green],
      ['STANDARD ERRORS', C.green],
      'allow shared errors',
      'within buildings',
      'covered later',
      ['in the course', C.muted]
    ], C.green),

    ...say('USE CLUSTER-AWARE STANDARD ERRORS', C.green)
  );

  // 28: check assumptions before trusting an interval.

  await until(S(28));
  await play(
    ...picture(assumptionsPicture(0, true)),

    ...fbox([
      ['BEFORE TRUSTING', C.green],
      'check the mean model',
      'check the noise size',
      ['check independence', C.amber],
      'then assess how',
      'precise the fit is'
    ], C.green),

    ...say('CHECK THE PROMISES BEHIND THE INTERVAL', C.green)
  );

  // ============================================================
  // 29-30: common trap — a high R-squared does not establish
  // independence or validate a confidence interval.
  // ============================================================

  function rSquaredPicture() {
    const total = 625000;
    const explained = 600000;
    const leftover = 25000;

    const width = W - 0.85;
    const left = CX - width / 2;

    const fitW = width * explained / total;
    const resW = width * leftover / total;

    const y = CY + 0.11;

    const parts = [
      txt(
        'How much variation does the line explain?',
        P ? 19 : 18,
        C.ink,
        local(0, 1.53)
      ),

      txt(
        'R² = 0.96',
        P ? 37 : 35,
        C.green,
        local(0, 0.83),
        true
      ),

      rect(
        fitW,
        0.50,
        pt(left + fitW / 2, y),
        C.green,
        0.85
      ),

      rect(
        resW,
        0.50,
        pt(left + fitW + resW / 2, y),
        C.amber,
        0.90
      ),

      outline(
        width,
        0.50,
        pt(CX, y),
        C.muted
      ),

      txt(
        '96% explained',
        19,
        C.green,
        pt(left + fitW / 2, y - 0.48)
      ),

      line(
        pt(left + fitW + resW / 2, y + 0.25),
        pt(left + fitW + resW / 2, y + 0.50),
        C.amber,
        2
      ),

      txt(
        '4%',
        15,
        C.amber,
        pt(left + fitW + resW / 2 - 0.08, y + 0.71)
      ),

      tag(
        'INDEPENDENCE?',
        C.amber,
        local(0, -1.10),
        19
      ),

      txt(
        'R² does not answer that question',
        P ? 17 : 18,
        C.muted,
        local(0, -1.76)
      )
    ];

    return new M.VGroup(...parts);
  }

  // 29: R² = 96% does not tell us whether errors are independent.

  await until(S(29));
  await play(
    ...picture(rSquaredPicture()),

    ...fbox([
      ['COMMON TRAP', C.amber],
      ['R² = 0.96', C.green],
      '96% of variation',
      'explained by the line',
      ['does NOT establish', C.amber],
      ['independence', C.amber]
    ], C.amber),

    ...say('HIGH R² DOES NOT MEAN INDEPENDENT ERRORS', C.amber)
  );

  // 30: return to the beautiful fitted line and reveal that
  // the building-coloured residual pattern is still there.

  axes = scatterAxes();
  fitLine = fittedLine();
  points = scatterDots(true);
  legend = scatterLegend();

  const finalResiduals = allResidualSticks(true);

  const fitQuality = tag(
    'R² = 96%',
    C.green,
    pt(CX + 0.75, GY1 + 0.20),
    17
  );

  await until(S(30));
  await play(
    ...picture(
      axes,
      fitLine,
      finalResiduals,
      points,
      legend,
      fitQuality
    ),

    ...fbox([
      ['GOOD FIT', C.green],
      'line fits beautifully',
      ['BUT', C.amber],
      'errors share patterns',
      'interval may claim',
      ['too much precision', C.amber]
    ], C.amber),

    ...say('GOOD FIT DOES NOT GUARANTEE GOOD UNCERTAINTY', C.amber)
  );

  // ============================================================
  // 31: final takeaway.
  // Shared building errors violate the independence assumption.
  // ============================================================

  await until(S(31));
  await play(
    ...picture(
      residualGroupsPicture(true, true)
    ),

    ...fbox([
      ['MODEL ASSUMPTIONS', C.violet],
      'an interval is only',
      'as good as its',
      'assumptions',
      ['shared building errors', C.amber],
      ['break independence', C.amber]
    ], C.violet),

    ...say('AN INTERVAL IS ONLY AS GOOD AS ITS ASSUMPTIONS', C.violet)
  );

  await until(S(31) + 3.7);
  await play(
    ...fbox([
      ['REMEMBER', C.green],
      'check the residuals',
      'check independence',
      'account for clusters',
      ['then assess precision', C.green]
    ], C.green),

    ...say('SHARED ERRORS · CHECK INDEPENDENCE', C.green)
  );
}

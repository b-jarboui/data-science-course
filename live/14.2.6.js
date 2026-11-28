// lesson 14.2.6
// Local outlier factors: comparing a reading with its surroundings.
// Live manim-web scene. Beat i = narration sentence i (0-based).
// Runs in site/live/engine.js using the supplied engine interface.
//
// Fixed normal reference readings:
// A = 2, B = 3, C = 4, D = 6, E = 7, F = 8.
//
// New readings:
// G = 5, H = 10, I = 12.
//
// Main demonstration: k = 2 nearest neighbors, including all ties.
// New readings never enter the normal reference neighborhood.
//
// Checked local outlier factors:
// G = 1.2
// H = 35/24 ≈ 1.4583
// I = 21/8 = 2.625
//
// All calculations retain full numerical precision.
// Operating-mode labels are hidden from the method.
// Amber outlines indicate examination, not confirmed machine faults.
//
// Try it controls illustrate the separate interactive activity.
// The final neighbor-count experiment uses the same reference data.
// Actual fresh-data generation belongs to the separate simulation.
// Browser rendering has not been verified against the engine runtime.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T,
    pill, show, showA, until, play, LINE_Y
  } = L;

  // ================================================================
  // FIXED CHAPTER DATA
  // ================================================================

  const NORMAL = [
    { id: 'A', x: 2, temperature: 20, mode: 'slow' },
    { id: 'B', x: 3, temperature: 21, mode: 'slow' },
    { id: 'C', x: 4, temperature: 22, mode: 'slow' },
    { id: 'D', x: 6, temperature: 22, mode: 'fast' },
    { id: 'E', x: 7, temperature: 23, mode: 'fast' },
    { id: 'F', x: 8, temperature: 24, mode: 'fast' }
  ];

  const NEW = [
    { id: 'G', x: 5, temperature: 22, mode: 'unknown' },
    { id: 'H', x: 10, temperature: 25, mode: 'unknown' },
    { id: 'I', x: 12, temperature: 30, mode: 'unknown' }
  ];

  const DATA = [...NORMAL, ...NEW];

  const byId = id =>
    DATA.find(d => d.id === id);

  const K = 2;

  const BLUE = '#60A5FA';
  const ORANGE = '#FB923C';
  const PURPLE = '#A78BFA';

  const REFERENCE_COLOR = BLUE;
  const QUERY_COLOR = PURPLE;
  const REACH_COLOR = C.amber;
  const DENSITY_COLOR = C.cyan;

  // ================================================================
  // EXACT LOCAL OUTLIER FACTOR CALCULATIONS
  //
  // All calculations use vibration only.
  //
  // For a reference reading:
  //   exclude that reading itself from its candidates.
  //
  // For a new reading:
  //   use the six normal readings as its candidates.
  //
  // Always include every neighbor tied at the kth distance.
  // ================================================================

  function sum(values) {
    return values.reduce(
      (total, value) => total + value,
      0
    );
  }

  function mean(values) {
    return sum(values) / values.length;
  }

  function distance(a, b) {
    return Math.abs(a.x - b.x);
  }

  function fmt(value, digits = 2) {
    return Number(
      value.toFixed(digits)
    ).toString();
  }

  function decimal(value, digits = 2) {
    return value.toFixed(digits);
  }

  function scoreText(value) {
    return (
      Math.round(
        (value + Number.EPSILON) * 100
      ) / 100
    ).toFixed(2);
  }

  function gcd(a, b) {
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }

    return Math.abs(a);
  }

  function fraction(value) {
    if (Math.abs(value) < 1e-12) {
      return '0';
    }

    for (let denominator = 1; denominator <= 144; denominator++) {
      const numerator =
        Math.round(value * denominator);

      if (
        Math.abs(
          value - numerator / denominator
        ) < 1e-10
      ) {
        const g = gcd(
          numerator,
          denominator
        );

        return denominator / g === 1
          ? String(numerator / g)
          : `${numerator / g}/${denominator / g}`;
      }
    }

    return `≈ ${decimal(value, 4)}`;
  }

  // ================================================================
  // NEIGHBOR SELECTION
  //
  // Example for C at vibration 4:
  //
  // Distance to B = 1.
  // Distance to A = 2.
  // Distance to D = 2.
  //
  // The second-neighbor distance is 2.
  //
  // A and D tie for second place, so both are included.
  // Therefore C has three neighbors when k = 2.
  // ================================================================

  function neighborhood(reading, k = K) {
    const candidates = NORMAL
      .filter(d => d.id !== reading.id)
      .map(d => ({
        ...d,
        actual: distance(reading, d)
      }))
      .sort((a, b) =>
        a.actual - b.actual ||
        a.x - b.x
      );

    if (
      k < 1 ||
      k > candidates.length
    ) {
      throw new Error(
        'Invalid number of neighbors'
      );
    }

    const kthDistance =
      candidates[k - 1].actual;

    const neighbors = candidates
      .filter(d =>
        d.actual <= kthDistance + 1e-12
      )
      .sort((a, b) => a.x - b.x);

    return {
      reading,
      k,
      kthDistance,
      neighbors
    };
  }

  // ================================================================
  // REACHABILITY DISTANCE
  //
  // reachability(p, o) =
  //   max(actual distance(p, o), kth distance(o))
  //
  // The lower bound comes from the NEIGHBOR o,
  // not from the reading p that is being examined.
  // ================================================================

  function reachability(reading, neighbor, k = K) {
    const actual =
      distance(reading, neighbor);

    const neighborKDistance =
      neighborhood(neighbor, k)
        .kthDistance;

    return {
      id: neighbor.id,
      x: neighbor.x,
      actual,
      neighborKDistance,

      reach: Math.max(
        actual,
        neighborKDistance
      )
    };
  }

  // ================================================================
  // LOCAL REACHABILITY DENSITY
  //
  // lrd(p) =
  //   1 / mean reachability distance
  //
  // The denominator uses the ACTUAL number of selected
  // neighbors, including tied neighbors.
  //
  // It is not always equal to k.
  // ================================================================

  function localDensity(reading, k = K) {
    const n = neighborhood(
      reading,
      k
    );

    const rows = n.neighbors.map(
      neighbor =>
        reachability(
          reading,
          neighbor,
          k
        )
    );

    const totalReach = sum(
      rows.map(row => row.reach)
    );

    const meanReach =
      totalReach / rows.length;

    return {
      reading,
      k,
      kthDistance: n.kthDistance,
      rows,
      count: rows.length,
      totalReach,
      meanReach,
      density: 1 / meanReach
    };
  }

  // ================================================================
  // LOCAL OUTLIER FACTOR
  //
  // LOF(p) =
  //   mean local reachability density of p's neighbors
  //   / local reachability density of p
  //
  // Every neighbor density is calculated using only
  // the six normal reference readings.
  // ================================================================

  function localOutlierFactor(reading, k = K) {
    const own = localDensity(
      reading,
      k
    );

    const rows = own.rows.map(row => ({
      ...row,

      density:
        localDensity(
          byId(row.id),
          k
        ).density
    }));

    const neighborMean = mean(
      rows.map(row => row.density)
    );

    return {
      ...own,
      rows,
      neighborMean,

      score:
        neighborMean / own.density
    };
  }

  const REFERENCE = Object.fromEntries(
    NORMAL.map(d => [
      d.id,
      localDensity(d, K)
    ])
  );

  const G = localOutlierFactor(
    byId('G'),
    K
  );

  const H = localOutlierFactor(
    byId('H'),
    K
  );

  const I = localOutlierFactor(
    byId('I'),
    K
  );

  const G_K3 = localOutlierFactor(
    byId('G'),
    3
  );

  // Checked reference values:
  //
  // Reading    kth distance    local density
  // A          2               2/3
  // B          1               1/2
  // C          2               3/5
  // D          2               3/5
  // E          1               1/2
  // F          2               2/3
  //
  // G:
  //   Neighbors C, D.
  //   Actual distances 1, 1.
  //   Reachability distances 2, 2.
  //   Mean reachability distance 2.
  //   Own density 1/2.
  //   Neighbor mean density 3/5.
  //   LOF = 6/5 = 1.2.
  //
  // H:
  //   Neighbors E, F.
  //   Actual distances 3, 2.
  //   Reachability distances 3, 2.
  //   Mean reachability distance 5/2.
  //   Own density 2/5.
  //   Neighbor mean density 7/12.
  //   LOF = 35/24.
  //
  // I:
  //   Neighbors E, F.
  //   Actual distances 5, 4.
  //   Reachability distances 5, 4.
  //   Mean reachability distance 9/2.
  //   Own density 2/9.
  //   Neighbor mean density 7/12.
  //   LOF = 21/8.

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 × 14.22.
  // Laptop: 14.22 × 8.
  //
  // Phone:
  //   Formula box above the number line.
  //   Local-density comparison below the number line.
  //
  // Laptop:
  //   Number line and comparison picture on the left.
  //   Formula box on the right.
  //
  // Keep a single horizontal vibration scale throughout.
  // Both reference and new readings use this same scale.
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.62, 0]
    : [4.5, -0.30, 0];

  const STATUS_POS = P
    ? [0, -6.40, 0]
    : [4.3, 1.29, 0];

  const CONTROL_POS = P
    ? [0, -6.40, 0]
    : [4.3, -2.20, 0];

  const point = (x, y) => [x, y, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  const XMIN = 0;
  const XMAX = 13;

  const XLEFT = P ? -3.13 : -6.55;
  const XRIGHT = P ? 3.13 : 1.35;

  const BASE = P ? -1.90 : -0.55;

  const UNIT =
    (XRIGHT - XLEFT) /
    (XMAX - XMIN);

  const px = x =>
    XLEFT + (x - XMIN) * UNIT;

  const gp = (x, offsetY = 0) =>
    point(px(x), BASE + offsetY);

  // ================================================================
  // BASIC VISUAL HELPERS
  // ================================================================

  function textAt(
    s,
    p,
    size,
    color = C.ink,
    mono = false
  ) {
    const t = T(
      s,
      size,
      color,
      mono
    );

    t.moveTo(p);

    return t;
  }

  function lineAt(
    start,
    end,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth
    });
  }

  function dashedAt(
    start,
    end,
    color = C.muted
  ) {
    return new M.DashedLine({
      start,
      end,
      color
    });
  }

  function circleAt(
    p,
    radius,
    color,
    opacity = 0,
    strokeWidth = 2
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth
    });

    c.setFill(
      color,
      opacity
    );

    c.moveTo(p);

    return c;
  }

  function roundedAt(
    p,
    width,
    height,
    color,
    opacity = 0.08,
    strokeWidth = 1.5
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.12,
      color,
      strokeWidth
    });

    r.setFill(
      color,
      opacity
    );

    r.moveTo(p);

    return r;
  }

  function blockAt(
    p,
    width,
    height,
    color,
    opacity = 0.85,
    strokeWidth = 1
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
    });

    r.setFill(
      color,
      opacity
    );

    r.moveTo(p);

    return r;
  }

  function fittedPill(
    s,
    color,
    size,
    p,
    maxw
  ) {
    const g = pill(
      s,
      color,
      size
    );

    if (g.getWidth() > maxw) {
      g.scale(
        maxw / g.getWidth()
      );
    }

    g.moveTo(p);

    return g;
  }

  function lag(
    animations,
    runTime = 1.1,
    lagRatio = 0.10
  ) {
    return new M.LaggedStart(
      animations,
      {
        lagRatio,
        runTime
      }
    );
  }

  function fadeAll(objects) {
    return objects.map(obj =>
      new M.FadeOut(obj)
    );
  }

  // ================================================================
  // FORMULA BOX
  //
  // lines = ['text' | ['text', color]]
  //
  // Leading spaces indent monospace rows.
  // Only one formula box is visible at a time.
  // ================================================================

  let boxNow = null;

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 21 : 23;
    const lh = P ? 0.34 : 0.46;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(
      ([s, c]) =>
        T(
          s.trimStart(),
          size,
          c,
          true
        )
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true
      ).getWidth() / 10;

    const widths = texts.map(
      (t, i) =>
        t.getWidth() +
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        )
    );

    const wd =
      Math.max(...widths) + 0.70;

    const ht =
      rows.length * lh + 0.34;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.17,
      color,
      strokeWidth: 2
    });

    r.setFill(
      C.card,
      0.95
    );

    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 -
      0.17 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + indent +
          t.getWidth() / 2,

        top - i * lh,

        0
      ]);
    });

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw = P
      ? FW - 1.0
      : 4.9;

    const maxh = P
      ? 1.95
      : 3.00;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const animations = [];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = g;

    animations.push(
      new M.FadeIn(g)
    );

    return animations;
  }

  // ================================================================
  // INDEPENDENT VISUAL LAYERS
  //
  // Each layer owns one independently removable object.
  // Never regroup already-visible objects.
  // ================================================================

  const layers = {};

  function replaceLayer(key, next) {
    const animations = [];

    if (layers[key]) {
      animations.push(
        new M.FadeOut(layers[key])
      );

      delete layers[key];
    }

    if (next) {
      layers[key] = next;

      animations.push(
        new M.FadeIn(next)
      );
    }

    return animations;
  }

  function clearLayer(key) {
    return replaceLayer(
      key,
      null
    );
  }

  function clearLayers(...keys) {
    return keys.flatMap(
      clearLayer
    );
  }

  function status(
    s,
    color = C.cyan
  ) {
    return replaceLayer(
      'status',

      fittedPill(
        s,
        color,
        P ? 17 : 16,
        STATUS_POS,
        P ? 6.1 : 3.7
      )
    );
  }

  // ================================================================
  // WORKSHOP MACHINE
  //
  // Same visual language as the preceding lessons:
  // dark housing, cyan flywheel and small vibration marks.
  // ================================================================

  function makeMachine() {
    const x = CX;
    const y = P ? -1.45 : -0.40;

    const housing = roundedAt(
      point(x, y),
      3.15,
      2.10,
      C.muted,
      0.15,
      2
    );

    const cap = roundedAt(
      point(x, y + 1.12),
      2.65,
      0.20,
      C.cyan,
      0.30
    );

    const wc = point(
      x - 0.57,
      y + 0.04
    );

    const wheel = circleAt(
      wc,
      0.70,
      C.cyan,
      0.06,
      3
    );

    const spokes = [];

    for (let i = 0; i < 4; i++) {
      const a =
        Math.PI / 4 +
        i * Math.PI / 2;

      spokes.push(
        lineAt(
          wc,

          point(
            wc[0] +
              0.59 * Math.cos(a),

            wc[1] +
              0.59 * Math.sin(a)
          ),

          C.cyan,
          2.5
        )
      );
    }

    const hub = circleAt(
      wc,
      0.16,
      C.cyan,
      0.90
    );

    const vents = [];

    for (let i = 0; i < 4; i++) {
      vents.push(
        lineAt(
          point(
            x + 0.48,
            y + 0.43 - i * 0.23
          ),

          point(
            x + 1.13,
            y + 0.43 - i * 0.23
          ),

          C.muted,
          2
        )
      );
    }

    const feet = [-1, 1].map(side =>
      roundedAt(
        point(
          x + side * 1.02,
          y - 1.20
        ),
        0.55,
        0.30,
        C.muted,
        0.70
      )
    );

    const floor = lineAt(
      point(x - 2.14, y - 1.37),
      point(x + 2.14, y - 1.37),
      C.muted,
      2
    );

    const light = new M.Dot({
      point: point(
        x + 1.12,
        y + 0.76
      ),
      radius: 0.075,
      color: C.green
    });

    const shakes = [];

    [-1, 1].forEach(side => {
      const xx =
        x + side * 1.75;

      for (let j = 0; j < 2; j++) {
        const yy =
          y + 0.60 - j * 0.88;

        const a = point(xx, yy);

        const b = point(
          xx + side * 0.15,
          yy - 0.14
        );

        const c = point(
          xx,
          yy - 0.28
        );

        shakes.push(
          lineAt(a, b, C.amber, 2),
          lineAt(b, c, C.amber, 2)
        );
      }
    });

    const mg = new M.VGroup(
      floor,
      housing,
      cap,
      ...feet,
      wheel,
      ...spokes,
      hub,
      ...vents,
      light,
      ...shakes
    );
    if (P) mg.scale(1.45);
    return mg;
  }

  const machine = makeMachine();

  const readingCard = fittedPill(
    'New vibration: 5 mm/s',

    PURPLE,
    P ? 20 : 18,

    point(
      CX,
      P ? 1.25 : 1.31
    ),

    4.0
  );

  const questionCard = fittedPill(
    'Unusual?',

    C.amber,
    P ? 19 : 17,

    point(
      CX,
      P ? -4.10 : -2.27
    ),

    2.5
  );

  // ================================================================
  // FIXED HORIZONTAL NUMBER LINE
  //
  // Use equal unit spacing from zero to thirteen.
  // Only vibration enters this lesson's calculations.
  // ================================================================

  function makeAxis() {
    const parts = [
      lineAt(
        gp(XMIN),
        gp(XMAX),
        C.muted,
        2.5
      )
    ];

    for (
      let x = XMIN;
      x <= XMAX;
      x++
    ) {
      parts.push(
        lineAt(
          gp(x, -0.045),
          gp(x, 0.045),
          C.muted,
          1.2
        ),

        textAt(
          String(x),

          gp(
            x,
            P ? -0.25 : -0.20
          ),

          P ? 16 : 14,
          C.muted,
          true
        )
      );
    }

    parts.push(
      textAt(
        'Vibration (mm/s)',

        point(
          (XLEFT + XRIGHT) / 2,
          BASE - (
            P ? 0.57 : 0.49
          )
        ),

        P ? 19 : 16,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  const axis = makeAxis();

  // ================================================================
  // GLOWING REFERENCE MARKERS
  //
  // Normal readings use neutral white markers because
  // recorded operating modes are hidden from the method.
  //
  // New readings are purple diamonds.
  // Keep all reading letters visible.
  // ================================================================

  function makeNormalMarker(d) {
    const p = gp(d.x);

    const halo = new M.Dot({
      point: p,
      radius: 0.155,
      color: C.ink
    });

    halo.setFill(
      C.ink,
      0.14
    );

    const dot = new M.Dot({
      point: p,
      radius: 0.083,
      color: C.ink
    });

    const label = textAt(
      d.id,

      gp(
        d.x,
        0.23
      ),

      P ? 17 : 16,
      C.ink,
      true
    );

    return new M.VGroup(
      halo,
      dot,
      label
    );
  }

  function diamondAt(
    p,
    color,
    radius = 0.11
  ) {
    const corners = [
      point(
        p[0],
        p[1] + radius
      ),

      point(
        p[0] + radius,
        p[1]
      ),

      point(
        p[0],
        p[1] - radius
      ),

      point(
        p[0] - radius,
        p[1]
      )
    ];

    const halo = new M.Dot({
      point: p,
      radius: radius * 1.85,
      color
    });

    halo.setFill(
      color,
      0.15
    );

    const core = new M.Dot({
      point: p,
      radius: radius * 0.47,
      color
    });

    const edges = corners.map(
      (a, i) =>
        lineAt(
          a,
          corners[(i + 1) % 4],
          color,
          2.4
        )
    );

    return new M.VGroup(
      halo,
      core,
      ...edges
    );
  }

  function makeNewMarker(d) {
    const marker = diamondAt(
      gp(d.x),
      PURPLE
    );

    const label = textAt(
      d.id,

      gp(d.x, 0.23),

      P ? 17 : 16,
      PURPLE,
      true
    );

    return new M.VGroup(
      marker,
      label
    );
  }

  const normalMarkers =
    Object.fromEntries(
      NORMAL.map(d => [
        d.id,
        makeNormalMarker(d)
      ])
    );

  const newMarkers =
    Object.fromEntries(
      NEW.map(d => [
        d.id,
        makeNewMarker(d)
      ])
    );

  const visibleNew = new Set();

  function revealNew(id) {
    if (visibleNew.has(id)) {
      return [];
    }

    visibleNew.add(id);

    return [
      new M.FadeIn(
        newMarkers[id]
      )
    ];
  }

  function hideNew(id) {
    if (!visibleNew.has(id)) {
      return [];
    }

    visibleNew.delete(id);

    return [
      new M.FadeOut(
        newMarkers[id]
      )
    ];
  }

  function hideAllNew() {
    return Array.from(
      visibleNew
    ).flatMap(hideNew);
  }

  function focusNormal(
    ids,
    color = C.amber
  ) {
    return lag(
      Array.from(ids).map(id =>
        new M.Indicate(
          normalMarkers[id],
          { color }
        )
      ),

      1.0,
      0.12
    );
  }

  // ================================================================
  // SELECTION RING
  //
  // Amber means "currently being examined".
  // It does not mean "confirmed anomaly" or "fault".
  // ================================================================

  function selectionRing(reading) {
    return circleAt(
      gp(reading.x),
      0.185,
      C.amber,
      0,
      2.3
    );
  }

  function selectReading(reading) {
    return replaceLayer(
      'selection',
      selectionRing(reading)
    );
  }

  function neighborRings(rows) {
    return new M.VGroup(
      ...rows.map(row =>
        circleAt(
          gp(row.x),
          0.156,
          REFERENCE_COLOR,
          0.015,
          2
        )
      )
    );
  }

  function showNeighbors(result) {
    return replaceLayer(
      'neighbors',
      neighborRings(
        result.rows
      )
    );
  }

  // ================================================================
  // NEIGHBORHOOD CIRCLES
  //
  // The circle radius equals the kth-neighbor distance
  // measured on the same horizontal scale as the readings.
  //
  // These circles illustrate neighbor selection.
  // They do not represent reachability distances.
  //
  // Use circles for the short local neighborhoods.
  // Use horizontal brackets for the longer neighborhoods
  // near the right edge of the graph.
  // ================================================================

  function makeNeighborhoodCircle(
    reading,
    radius,
    color = REFERENCE_COLOR,
    label = ''
  ) {
    const r = circleAt(
      gp(reading.x),
      radius * UNIT,
      color,
      0.025,
      1.8
    );

    const parts = [r];

    if (label) {
      parts.push(
        fittedPill(
          label,
          color,
          P ? 16 : 15,

          gp(
            reading.x,
            radius * UNIT + 0.29
          ),

          2.8
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  // ================================================================
  // DISTANCE BRACKETS
  //
  // Every bracket spans the exact horizontal positions
  // of two readings.
  //
  // Labels show actual distance unless explicitly stated.
  //
  // Vertical offsets separate overlapping brackets.
  // These offsets are only for readability.
  // ================================================================

  function makeDistanceBracket(
    a,
    b,
    level,
    color,
    label = null
  ) {
    const left = Math.min(
      a,
      b
    );

    const right = Math.max(
      a,
      b
    );

    const y =
      BASE + level;

    const x1 = px(left);
    const x2 = px(right);

    const parts = [
      lineAt(
        point(x1, y),
        point(x2, y),
        color,
        2.5
      ),

      lineAt(
        point(x1, y - 0.075),
        point(x1, y + 0.075),
        color,
        1.8
      ),

      lineAt(
        point(x2, y - 0.075),
        point(x2, y + 0.075),
        color,
        1.8
      ),

      dashedAt(
        gp(left, 0.31),
        point(x1, y - 0.075),
        color
      ),

      dashedAt(
        gp(right, 0.31),
        point(x2, y - 0.075),
        color
      )
    ];

    const labelObj = textAt(
      label === null
        ? fmt(right - left)
        : label,

      point(
        (x1 + x2) / 2,
        y + 0.15
      ),

      P ? 16 : 15,
      color,
      true
    );

    parts.push(
      labelObj
    );

    return new M.VGroup(
      ...parts
    );
  }

  function makeActualDistances(
    result,
    color = REFERENCE_COLOR
  ) {
    const parts = [];

    result.rows.forEach((row, i) => {
      const level =
        0.55 + i * 0.36;

      parts.push(
        makeDistanceBracket(
          result.reading.x,
          row.x,
          level,
          color,
          fmt(row.actual)
        )
      );
    });

    return new M.VGroup(
      ...parts
    );
  }

  function showActualDistances(result) {
    return replaceLayer(
      'distances',
      makeActualDistances(result)
    );
  }

  // ================================================================
  // STREET ANALOGY
  //
  // Two schematic streets have the same two-step gap
  // from the selected person to the nearest person.
  //
  // On the crowded street, the surrounding people are
  // close together.
  //
  // On the quiet street, similar spacing is ordinary.
  //
  // This illustration is conceptual, not additional
  // machine data.
  // ================================================================

  function personAt(
    p,
    color,
    selected = false
  ) {
    const head = circleAt(
      point(
        p[0],
        p[1] + 0.20
      ),

      0.085,
      color,
      0.95,
      1
    );

    const body = new M.Arc({
      radius: 0.15,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(
      color,
      0.88
    );

    body.moveTo(
      point(
        p[0],
        p[1] - 0.02
      )
    );

    const parts = [
      head,
      body
    ];

    if (selected) {
      parts.push(
        circleAt(
          point(
            p[0],
            p[1] + 0.075
          ),

          0.25,
          C.amber,
          0,
          1.8
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  const STREET_W = 5.35;

  const CROWDED_Y = P
    ? 0.10
    : 0.48;

  const QUIET_Y = P
    ? -2.75
    : -1.32;

  function makeStreet(
    crowded,
    y
  ) {
    const x = CX;

    const street = roundedAt(
      point(x, y),
      STREET_W,
      1.10,
      C.muted,
      0.07,
      1.4
    );

    const positions = crowded
      ? [
          -2.20,
          -1.82,
          -1.44,
          -1.06,
          -0.68,
          -0.30
        ]
      : [
          -2.10,
          -1.20,
          -0.30
        ];

    // In both street pictures, the selected person
    // stands 0.90 screen units from the nearest person.
    // The equal gap represents the narrated two steps.

    const selectedX =
      x + 0.60;

    const people = positions.map(
      offset =>
        personAt(
          point(
            x + offset,
            y - 0.04
          ),

          C.ink
        )
    );

    people.push(
      personAt(
        point(
          selectedX,
          y - 0.04
        ),

        PURPLE,
        true
      )
    );

    const title = fittedPill(
      crowded
        ? 'Crowded street'
        : 'Quiet street',

      crowded
        ? BLUE
        : C.cyan,

      P ? 17 : 16,

      point(
        x,
        y + 0.82
      ),

      2.65
    );

    return new M.VGroup(
      street,
      ...people,
      title
    );
  }

  const streetCrowded =
    makeStreet(
      true,
      CROWDED_Y
    );

  const streetQuiet =
    makeStreet(
      false,
      QUIET_Y
    );

  function makeStreetGap(
    y,
    crowded
  ) {
    const a =
      CX - 0.30;

    const b =
      CX + 0.60;

    const yy =
      y - 0.37;

    const color = crowded
      ? C.amber
      : C.green;

    const parts = [
      lineAt(
        point(a, yy),
        point(b, yy),
        color,
        2.5
      ),

      lineAt(
        point(a, yy - 0.06),
        point(a, yy + 0.06),
        color,
        1.8
      ),

      lineAt(
        point(b, yy - 0.06),
        point(b, yy + 0.06),
        color,
        1.8
      ),

      textAt(
        '2 steps',

        point(
          (a + b) / 2,
          yy - 0.20
        ),

        P ? 16 : 14,
        color
      ),

      fittedPill(
        crowded
          ? 'Unusual here'
          : 'Normal here',

        color,
        P ? 16 : 15,

        point(
          CX + 1.71,
          y + 0.05
        ),

        1.68
      )
    ];

    return new M.VGroup(
      ...parts
    );
  }

  const streetGaps = new M.VGroup(
    makeStreetGap(
      CROWDED_Y,
      true
    ),

    makeStreetGap(
      QUIET_Y,
      false
    )
  );

  // ================================================================
  // LOWER COMPARISON PANEL
  //
  // This panel is independent of the number line.
  //
  // It can show:
  //   actual and reachability distances,
  //   a mean-distance calculation,
  //   local-density bars,
  //   or a comparison of the three LOF scores.
  //
  // Every numeric bar begins at a common zero baseline.
  // ================================================================

  const PANEL_X = CX;

  const PANEL_TOP = P
    ? -3.15
    : -1.40;

  const PANEL_BOTTOM = P
    ? -5.90
    : -3.30;

  const PANEL_LEFT = CX - (
    P ? 2.98 : 2.94
  );

  const PANEL_RIGHT = CX + (
    P ? 2.98 : 2.94
  );

  function panelTitle(
    s,
    color = C.ink
  ) {
    return textAt(
      s,

      point(
        PANEL_X,
        PANEL_TOP
      ),

      P ? 18 : 16,
      color
    );
  }

  function makeBarPanel(
    title,
    rows,
    maxValue,
    options = {}
  ) {
    const {
      unitLabel = '',
      digits = 2,
      titleColor = C.ink
    } = options;

    const parts = [
      panelTitle(
        title,
        titleColor
      )
    ];

    const x0 =
      PANEL_LEFT + 1.45;

    const width =
      PANEL_RIGHT - x0 - 0.65;

    const yFirst =
      PANEL_TOP - (
        P ? 0.75 : 0.52
      );

    const spacing =
      rows.length >= 3
        ? (
            P ? 0.78 : 0.48
          )
        : (
            P ? 0.95 : 0.66
          );

    const barH =
      P ? 0.32 : 0.24;

    rows.forEach((row, i) => {
      const y =
        yFirst - i * spacing;

      const barW =
        row.value / maxValue *
        width;

      const track = blockAt(
        point(
          x0 + width / 2,
          y
        ),

        width,
        barH,
        C.muted,
        0.05,
        0.9
      );

      const label = textAt(
        row.label,

        point(
          PANEL_LEFT + 0.58,
          y
        ),

        P ? 16 : 14,
        row.color,
        true
      );

      parts.push(
        track,
        label
      );

      if (barW > 1e-10) {
        parts.push(
          blockAt(
            point(
              x0 + barW / 2,
              y
            ),

            barW,
            barH,
            row.color,
            0.84,
            1
          )
        );
      }

      parts.push(
        textAt(
          row.display ||
            decimal(
              row.value,
              digits
            ),

          point(
            PANEL_RIGHT - 0.24,
            y
          ),

          P ? 16 : 14,
          row.color,
          true
        )
      );
    });

    if (
      unitLabel &&
      rows.length < 3
    ) {
      parts.push(
        textAt(
          unitLabel,

          point(
            PANEL_X,
            PANEL_BOTTOM + 0.12
          ),

          P ? 16 : 14,
          C.muted
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  function showPanel(obj) {
    return replaceLayer(
      'panel',
      obj
    );
  }

  // ================================================================
  // REACHABILITY DISTANCE COMPARISON
  //
  // Compare the actual distance with the neighbor's own
  // kth-neighbor distance.
  //
  // The adjusted distance is the larger of the two.
  //
  // In the worked example for G → C:
  // actual = 1, neighbor kth distance = 2, reach = 2.
  // ================================================================

  function makeReachComparison(
    query,
    row
  ) {
    return makeBarPanel(
      `${query.id} → ${row.id}: choose the larger`,

      [
        {
          label: 'Actual',
          value: row.actual,
          display: fmt(row.actual),
          color: BLUE
        },

        {
          label: 'Minimum',
          value: row.neighborKDistance,
          display:
            fmt(row.neighborKDistance),
          color: PURPLE
        },

        {
          label: 'Adjusted',
          value: row.reach,
          display: fmt(row.reach),
          color: C.amber
        }
      ],

      Math.max(
        2,
        row.actual,
        row.neighborKDistance,
        row.reach
      ),

      {
        digits: 0,
        titleColor: C.amber
      }
    );
  }

  // ================================================================
  // DISTANCE TABLE
  //
  // One column per selected neighbor.
  //
  // The table shows actual distances, neighbor kth
  // distances and the resulting reachability distances.
  //
  // It supports a different number of neighbors when
  // ties occur or when k changes.
  // ================================================================

  function makeDistanceTable(
    result,
    options = {}
  ) {
    const {
      title = 'Reachability distances',
      highlight = 'reach'
    } = options;

    const parts = [
      panelTitle(
        title,
        C.amber
      )
    ];

    const n =
      result.rows.length;

    const left =
      PANEL_LEFT + 1.65;

    const right =
      PANEL_RIGHT - 0.20;

    const spacing =
      (right - left) /
      Math.max(1, n);

    const yHeader =
      PANEL_TOP - 0.36;

    const rowGap =
      P ? 0.52 : 0.36;

    const fields = [
      {
        key: 'actual',
        name: 'Actual',
        color: BLUE
      },

      {
        key: 'neighborKDistance',
        name: 'Neighbor kth',
        color: PURPLE
      },

      {
        key: 'reach',
        name: 'Adjusted',
        color: C.amber
      }
    ];

    fields.forEach((field, j) => {
      const y =
        yHeader -
        (j + 1) * rowGap;

      parts.push(
        textAt(
          field.name,

          point(
            PANEL_LEFT + 0.62,
            y
          ),

          P ? 16 : 14,
          field.color,
          true
        )
      );
    });

    result.rows.forEach((row, i) => {
      const x =
        left +
        (i + 0.5) * spacing;

      parts.push(
        textAt(
          `${row.id}:${row.x}`,

          point(
            x,
            yHeader
          ),

          P ? 16 : 14,
          C.ink,
          true
        )
      );

      fields.forEach((field, j) => {
        const y =
          yHeader -
          (j + 1) * rowGap;

        if (highlight === field.key) {
          parts.push(
            roundedAt(
              point(x, y),

              Math.min(
                0.90,
                spacing - 0.08
              ),

              rowGap - 0.055,

              field.color,
              0.06,
              1.1
            )
          );
        }

        parts.push(
          textAt(
            fmt(row[field.key]),

            point(x, y),

            P ? 16 : 15,
            field.color,
            true
          )
        );
      });
    });

    return new M.VGroup(
      ...parts
    );
  }

  // ================================================================
  // MEAN REACHABILITY DISTANCE PICTURE
  //
  // Show reachability distances as blocks of equal unit width.
  //
  // Lay the blocks in a single row to make their total visible.
  //
  // The numerical mean divides by the true neighbor count.
  // ================================================================

  function makeMeanReachPicture(result) {
    const parts = [
      panelTitle(
        'Add the adjusted distances',
        C.amber
      )
    ];

    const total =
      result.totalReach;

    const maxWidth =
      P ? 4.45 : 4.25;

    const blockUnit =
      Math.min(
        0.60,
        maxWidth / total
      );

    const fullWidth =
      total * blockUnit;

    const x0 =
      PANEL_X - fullWidth / 2;

    const y =
      PANEL_TOP - (
        P ? 0.85 : 0.62
      );

    let running = 0;

    result.rows.forEach(
      (row, i) => {
        const color =
          i % 2 === 0
            ? C.amber
            : ORANGE;

        const n =
          Math.floor(
            row.reach + 1e-12
          );

        const remainder =
          row.reach - n;

        for (let j = 0; j < n; j++) {
          const x =
            x0 +
            (running + 0.5) *
              blockUnit;

          parts.push(
            blockAt(
              point(x, y),

              blockUnit - 0.035,

              P ? 0.37 : 0.30,

              color,
              0.87
            ),

            textAt(
              '1',

              point(x, y),

              P ? 16 : 14,
              '#0F172A',
              true
            )
          );

          running++;
        }

        if (remainder > 1e-10) {
          const w =
            remainder * blockUnit;

          parts.push(
            blockAt(
              point(
                x0 +
                running * blockUnit +
                w / 2,

                y
              ),

              w,
              P ? 0.37 : 0.30,
              color,
              0.87
            )
          );

          running += remainder;
        }
      }
    );

    parts.push(
      textAt(
        `Total = ${fmt(total)}`,

        point(
          PANEL_X,
          y - 0.39
        ),

        P ? 16 : 15,
        C.amber,
        true
      ),

      fittedPill(
        `Mean = ${fmt(total)} ÷ ${result.count} = ${fraction(result.meanReach)}`,

        C.cyan,
        P ? 17 : 15,

        point(
          PANEL_X,
          y - (
            P ? 0.95 : 0.77
          )
        ),

        4.85
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  // ================================================================
  // RECIPROCAL DENSITY EXPLANATION
  //
  // Larger mean reachability distance → smaller local density.
  //
  // A temporary example compares:
  //
  // Mean distance 1 → density 1.
  // Mean distance 2 → density 1/2.
  //
  // These are explanatory values, not invented observations.
  // ================================================================

  function makeReciprocalPicture() {
    const parts = [
      panelTitle(
        'Closer surroundings → larger density'
      )
    ];

    const items = [
      {
        x: PANEL_X - 1.40,
        distance: 1,
        density: 1,
        label: 'Closer',
        color: C.cyan
      },

      {
        x: PANEL_X + 1.40,
        distance: 2,
        density: 0.5,
        label: 'Farther',
        color: PURPLE
      }
    ];

    items.forEach(item => {
      const y =
        PANEL_TOP - (
          P ? 0.80 : 0.63
        );

      const bg = roundedAt(
        point(
          item.x,
          y
        ),

        2.52,
        P ? 1.12 : 0.94,
        item.color,
        0.07,
        1.5
      );

      parts.push(
        bg,

        textAt(
          item.label,

          point(
            item.x,
            y + 0.29
          ),

          P ? 16 : 15,
          item.color
        ),

        textAt(
          `Mean = ${item.distance}`,

          point(
            item.x,
            y
          ),

          P ? 16 : 14,
          C.ink,
          true
        ),

        textAt(
          `Density = ${fraction(item.density)}`,

          point(
            item.x,
            y - 0.29
          ),

          P ? 16 : 15,
          item.color,
          true
        )
      );
    });

    return new M.VGroup(
      ...parts
    );
  }

  // ================================================================
  // LOCAL DENSITY COMPARISONS
  //
  // Use a fixed scale for these comparisons.
  //
  // All reference densities in the k = 2 example
  // are at most 2/3.
  //
  // The scale extends to 1, allowing an intuitive
  // comparison of the exact fractional values.
  // ================================================================

  function makeDensityComparison(result) {
    return makeBarPanel(
      'Compare local reachability densities',

      [
        {
          label: 'Neighbors',
          value: result.neighborMean,
          display:
            decimal(
              result.neighborMean,
              3
            ),
          color: BLUE
        },

        {
          label: result.reading.id,
          value: result.density,
          display:
            decimal(
              result.density,
              3
            ),
          color: PURPLE
        }
      ],

      1,

      {
        digits: 3,
        titleColor: C.cyan
      }
    );
  }

  function makeIndividualDensityPanel(
    reading,
    result
  ) {
    return makeBarPanel(
      `${reading.id}: local reachability density`,

      [
        {
          label: 'Density',
          value: result.density,
          display:
            fraction(result.density),
          color:
            reading.id === 'G'
              ? PURPLE
              : C.cyan
        }
      ],

      1,

      {
        titleColor: C.cyan
      }
    );
  }

  function makeTwoNeighborDensities(
    result
  ) {
    return makeBarPanel(
      'Local density of each neighbor',

      result.rows.map(row => ({
        label:
          `${row.id}: ${row.x}`,

        value: row.density,

        display:
          fraction(row.density),

        color: BLUE
      })),

      1,

      {
        titleColor: BLUE
      }
    );
  }

  // ================================================================
  // LOF SCORE COMPARISON
  //
  // A score of 1 is the equal-density reference.
  //
  // A score above 1 means the neighbors have a greater
  // mean local density than the examined reading.
  //
  // No fault threshold is introduced in this lesson.
  // ================================================================

  function makeScoreComparison(
    results
  ) {
    const parts = [
      makeBarPanel(
        'Local outlier factor',

        results.map(result => ({
          label:
            `${result.reading.id}: ${result.reading.x}`,

          value: result.score,

          display:
            scoreText(result.score),

          color: PURPLE
        })),

        3,

        {
          titleColor: PURPLE
        }
      )
    ];

    const x0 =
      PANEL_LEFT + 1.45;

    const width =
      PANEL_RIGHT - x0 - 0.65;

    const baselineX =
      x0 + width / 3;

    const yFirst =
      PANEL_TOP - (
        P ? 0.75 : 0.52
      );

    const spacing =
      results.length >= 3
        ? (
            P ? 0.78 : 0.48
          )
        : (
            P ? 0.95 : 0.66
          );

    const yLast =
      yFirst -
      (results.length - 1) *
        spacing;

    parts.push(
      dashedAt(
        point(
          baselineX,
          yFirst + 0.18
        ),

        point(
          baselineX,
          yLast - 0.18
        ),

        C.ink
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  // ================================================================
  // SCORE NUMBER LINE
  //
  // Illustrate score 1 as the point of equal local density.
  //
  // The number line extends to 3 for this example only.
  // LOF is not generally bounded above by 3.
  // ================================================================

  function makeScoreAxis(
    result = null
  ) {
    const left =
      PANEL_X - 2.50;

    const right =
      PANEL_X + 2.50;

    const y =
      PANEL_TOP - (
        P ? 1.0 : 0.75
      );

    const sx = value =>
      left +
      value / 3 *
      (right - left);

    const parts = [
      panelTitle(
        'Relative local density'
      ),

      lineAt(
        point(left, y),
        point(right, y),
        C.muted,
        2.5
      )
    ];

    [0, 1, 2, 3].forEach(value => {
      const x = sx(value);

      parts.push(
        lineAt(
          point(x, y - 0.075),
          point(x, y + 0.075),
          value === 1
            ? C.green
            : C.muted,
          1.7
        ),

        textAt(
          String(value),

          point(
            x,
            y - 0.24
          ),

          P ? 16 : 14,

          value === 1
            ? C.green
            : C.muted,

          true
        )
      );
    });

    parts.push(
      fittedPill(
        '1 = equal density',

        C.green,
        P ? 16 : 14,

        point(
          sx(1),
          y + 0.30
        ),

        2.20
      )
    );

    if (result) {
      const p = point(
        sx(result.score),
        y
      );

      parts.push(
        diamondAt(
          p,
          PURPLE,
          0.09
        ),

        fittedPill(
          `${result.reading.id}: ${scoreText(result.score)}`,

          PURPLE,
          P ? 16 : 14,

          point(
            p[0] + 0.45,
            y - (
              P ? 0.57 : 0.48
            )
          ),

          1.60
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  // ================================================================
  // REFERENCE DENSITY SUMMARY
  //
  // Display the exact density of every normal reading.
  //
  // New readings do not change any of these six values
  // while k remains fixed at 2.
  // ================================================================

  function makeReferenceSummary(
    k = K
  ) {
    const parts = [
      panelTitle(
        `Normal reference densities · k = ${k}`
      )
    ];

    const y =
      PANEL_TOP - (
        P ? 1.05 : 0.72
      );

    const spacing =
      P ? 0.88 : 0.86;

    NORMAL.forEach((d, i) => {
      const result =
        localDensity(d, k);

      const x =
        PANEL_X +
        (i - 2.5) * spacing;

      const bg = roundedAt(
        point(x, y),
        spacing - 0.08,
        P ? 1.05 : 0.80,
        BLUE,
        0.055,
        1.2
      );

      parts.push(
        bg,

        textAt(
          d.id,

          point(
            x,
            y + 0.24
          ),

          P ? 16 : 15,
          C.ink,
          true
        ),

        textAt(
          fraction(
            result.density
          ),

          point(
            x,
            y - 0.14
          ),

          P ? 16 : 14,
          C.cyan,
          true
        )
      );
    });

    return new M.VGroup(
      ...parts
    );
  }

  // ================================================================
  // SIMULATED TRY IT CONTROLS
  //
  // The scene illustrates a movable hypothetical query.
  //
  // Observations A–F remain stationary.
  // G, H and I retain their recorded coordinates.
  //
  // The hypothetical query can be moved without changing
  // those original observations.
  // ================================================================

  let probeNow = null;

  function makeProbe(
    x
  ) {
    const marker = diamondAt(
      gp(x),
      PURPLE,
      0.12
    );

    const ring = circleAt(
      gp(x),
      0.19,
      C.amber,
      0,
      2
    );

    const label = textAt(
      'Probe',

      gp(x, 0.23),

      P ? 16 : 15,
      PURPLE
    );

    return new M.VGroup(
      marker,
      ring,
      label
    );
  }

  function setProbe(x) {
    const next =
      makeProbe(x);

    if (!probeNow) {
      probeNow = next;

      return [
        new M.FadeIn(
          probeNow
        )
      ];
    }

    return [
      new M.Transform(
        probeNow,
        next,
        { runTime: 0.9 }
      )
    ];
  }

  function clearProbe() {
    if (!probeNow) {
      return [];
    }

    const old = probeNow;
    probeNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function makeSlider(
    title,
    value,
    min,
    max,
    color
  ) {
    const center =
      CONTROL_POS;

    const width =
      P ? 4.60 : 3.40;

    const x0 =
      center[0] - width / 2;

    const x1 =
      center[0] + width / 2;

    const y =
      center[1];

    const t = Math.max(
      0,

      Math.min(
        1,
        (value - min) /
        (max - min)
      )
    );

    const knobX =
      x0 + t * width;

    return new M.VGroup(
      lineAt(
        point(x0, y),
        point(x1, y),
        C.muted,
        4
      ),

      diamondAt(
        point(knobX, y),
        color,
        0.09
      ),

      textAt(
        `${title}: ${fmt(value)}`,

        point(
          center[0],
          y + 0.26
        ),

        P ? 16 : 15,
        color,
        true
      ),

      textAt(
        String(min),

        point(
          x0,
          y - 0.23
        ),

        P ? 16 : 14,
        C.muted,
        true
      ),

      textAt(
        String(max),

        point(
          x1,
          y - 0.23
        ),

        P ? 16 : 14,
        C.muted,
        true
      )
    );
  }

  function readingSlider(x) {
    return replaceLayer(
      'control',

      makeSlider(
        'Vibration',
        x,
        0,
        13,
        PURPLE
      )
    );
  }

  function neighborSlider(k) {
    return replaceLayer(
      'control',

      makeSlider(
        'Neighbors',
        k,
        1,
        5,
        C.cyan
      )
    );
  }

  function resultFormula(
    result
  ) {
    const ids =
      result.rows
        .map(row => row.id)
        .join(', ');

    const distances =
      result.rows
        .map(row =>
          fmt(row.reach)
        )
        .join(', ');

    return fbox([
      `Neighbors: ${ids}`,
      `Adjusted: ${distances}`,

      [
        `Own density = ${fraction(result.density)}`,
        PURPLE
      ],

      [
        `Neighbor mean = ${fraction(result.neighborMean)}`,
        BLUE
      ],

      [
        `LOF ≈ ${scoreText(result.score)}`,
        C.cyan
      ]
    ]);
  }

  function tryReading(
    x,
    k = K
  ) {
    const result =
      localOutlierFactor(
        {
          id: 'Probe',
          x
        },

        k
      );

    return [
      ...setProbe(x),

      ...showNeighbors(
        result
      ),

      ...showActualDistances(
        result
      ),

      ...showPanel(
        makeDensityComparison(
          result
        )
      ),

      ...readingSlider(x),

      ...resultFormula(
        result
      )
    ];
  }

  // ================================================================
  // 0 — CHECK A NEW VIBRATION READING
  // ================================================================

  await until(S(0));
  await play(
    new M.FadeIn(machine),

    ...say('CHECK A NEW WORKSHOP READING'),

    ...fbox([
      'The machine is running',
      'A new vibration reading arrives',
      ['Does it need attention?', C.amber]
    ])
  );

  // ================================================================
  // 1 — THE NEW READING IS FIVE
  // ================================================================

  await until(S(1));
  await play(
    new M.FadeIn(readingCard),

    new M.FadeIn(questionCard),

    ...say('VIBRATION 5 · IS IT UNUSUAL?', C.amber),

    ...fbox([
      ['New reading G = 5 mm/s', PURPLE],
      'Operating mode unknown',
      ['Compare it with normal readings', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 2 — PLACE SIX NORMAL READINGS ON A LINE
  // ================================================================

  await until(S(2));
  await play(
    new M.FadeOut(machine),

    new M.FadeOut(readingCard),

    new M.FadeOut(questionCard),

    new M.FadeIn(axis),

    ...say('6 PREVIOUS NORMAL READINGS'),

    ...fbox([
      'One dot per normal reading',
      'Horizontal position = vibration',
      ['Unit: mm/s', C.cyan]
    ])
  );

  // ================================================================
  // 3–8 — REVEAL A TO F
  //
  // Short animations match the short spoken number beats.
  // ================================================================

  // 3 — Two.

  await until(S(3));
  await play(
    new M.FadeIn(
      normalMarkers.A,
      { runTime: 0.20 }
    )
  );

  // 4 — Three.

  await until(S(4));
  await play(
    new M.FadeIn(
      normalMarkers.B,
      { runTime: 0.20 }
    )
  );

  // 5 — Four.

  await until(S(5));
  await play(
    new M.FadeIn(
      normalMarkers.C,
      { runTime: 0.20 }
    )
  );

  // 6 — Six.

  await until(S(6));
  await play(
    new M.FadeIn(
      normalMarkers.D,
      { runTime: 0.20 }
    )
  );

  // 7 — Seven.

  await until(S(7));
  await play(
    new M.FadeIn(
      normalMarkers.E,
      { runTime: 0.20 }
    )
  );

  // 8 — And eight.

  await until(S(8));
  await play(
    new M.FadeIn(
      normalMarkers.F,
      { runTime: 0.20 }
    )
  );

  // ================================================================
  // 9 — PLACE G AT FIVE BETWEEN THE TWO GATHERINGS
  //
  // New reading G does not become part of the reference set.
  // ================================================================

  await until(S(9));
  await play(
    ...revealNew('G'),

    ...selectReading(
      byId('G')
    ),

    ...say('NEW READING G: VIBRATION 5', PURPLE),

    ...fbox([
      'Normal readings: A to F',
      ['New reading: G = 5', PURPLE],
      'Between the two gatherings',
      ['Reference set stays unchanged', C.muted]
    ])
  );

  // ================================================================
  // 10 — IMAGINE CROWDED AND QUIET STREETS
  //
  // Temporarily replace the number line with the analogy.
  // ================================================================

  await until(S(10));
  await play(
    ...clearLayer('selection'),

    new M.FadeOut(axis),

    ...fadeAll(
      Object.values(
        normalMarkers
      )
    ),

    ...hideAllNew(),

    new M.FadeIn(streetCrowded),

    new M.FadeIn(streetQuiet),

    ...say('IMAGINE PEOPLE STANDING IN A STREET'),

    ...fbox([
      ['Crowded street', BLUE],
      ['Quiet street', C.cyan],
      'Different amounts of crowding'
    ])
  );

  // ================================================================
  // 11 — THE SAME TWO-STEP GAP CAN MEAN DIFFERENT THINGS
  //
  // Both illustrations use the same gap from the selected
  // person to the nearest person.
  // ================================================================

  await until(S(11));
  await play(
    new M.FadeIn(streetGaps),

    ...say('THE SAME GAP CAN MEAN DIFFERENT THINGS'),

    ...fbox([
      'Same distance: two steps',
      ['Unusual in a crowd', C.amber],
      ['Ordinary in a quiet street', C.green],
      'Compare with the surroundings'
    ])
  );

  // ================================================================
  // 12 — APPLY THE SAME IDEA TO NEARBY READINGS
  // ================================================================

  await until(S(12));
  await play(
    new M.FadeOut(streetCrowded),

    new M.FadeOut(streetQuiet),

    new M.FadeOut(streetGaps),

    new M.FadeIn(axis),

    ...Object.values(
      normalMarkers
    ).map(obj =>
      new M.FadeIn(obj)
    ),

    ...revealNew('G'),

    ...selectReading(
      byId('G')
    ),

    ...replaceLayer(
      'neighborhood',

      makeNeighborhoodCircle(
        byId('G'),
        1,
        BLUE
      )
    ),

    ...say('COMPARE A READING WITH NEARBY READINGS'),

    ...fbox([
      'Look at the immediate surroundings',
      ['Not just the whole dataset', C.cyan],
      'Is the reading unusually isolated?'
    ])
  );

  // ================================================================
  // 13 — DEFINE A LOCAL OUTLIER
  // ================================================================

  await until(S(13));
  await play(
    new M.Indicate(
      newMarkers.G,
      { color: C.amber }
    ),

    ...say('UNUSUALLY ISOLATED LOCALLY = LOCAL OUTLIER'),

    ...fbox([
      ['Local outlier', C.amber],
      'A reading that stands unusually',
      'far apart from its neighbors'
    ], C.amber)
  );

  // ================================================================
  // 14 — LOCAL MEANS IMMEDIATE SURROUNDINGS
  // ================================================================

  await until(S(14));
  await play(
    ...showNeighbors(G),

    focusNormal(
      'CD',
      BLUE
    ),

    ...say('LOCAL = IMMEDIATE SURROUNDINGS'),

    ...fbox([
      'Examine nearby normal readings',
      ['Focus on the local neighborhood', BLUE],
      'Different neighborhoods can differ'
    ])
  );

  // ================================================================
  // 15 — INTRODUCE LOCAL OUTLIER FACTOR
  // ================================================================

  await until(S(15));
  await play(
    ...say('LOCAL OUTLIER FACTOR (LOF)'),

    ...fbox([
      ['Local outlier factor', C.cyan],
      'Compare local crowding',
      'Express relative isolation',
      'Using one numerical score'
    ])
  );

  // ================================================================
  // 16 — CHOOSE TWO CLOSEST NORMAL NEIGHBORS
  // ================================================================

  await until(S(16));
  await play(
    ...status(
      'k = 2 nearest normal neighbors'
    ),

    ...showNeighbors(G),

    ...say('CHOOSE TWO NEAREST NORMAL NEIGHBORS'),

    ...fbox([
      'Number of neighbors: k = 2',
      'Candidates: A, B, C, D, E, F',
      ['New readings are excluded', C.amber]
    ])
  );

  // ================================================================
  // 17 — INCLUDE ALL TIES AT THE LAST PLACE
  //
  // Preview the tied neighborhood of C:
  //
  // B is one unit away.
  // A and D are two units away.
  //
  // Do not arbitrarily discard either tied reading.
  // ================================================================

  await until(S(17));
  await play(
    ...clearLayer('selection'),

    ...replaceLayer(
      'neighborhood',

      makeNeighborhoodCircle(
        byId('C'),
        REFERENCE.C.kthDistance,
        BLUE,
        'Include both ties'
      )
    ),

    ...showNeighbors(
      REFERENCE.C
    ),

    ...showPanel(
      makeDistanceTable(
        REFERENCE.C,

        {
          title:
            'Tie example: reading C',

          highlight:
            'actual'
        }
      )
    ),

    ...say('TIED AT THE LAST PLACE? INCLUDE EVERY TIE'),

    ...fbox([
      'Example: C at vibration 4',
      'B is 1 unit away',
      'A and D are both 2 units away',
      ['Keep all three neighbors', C.green]
    ], C.green)
  );

  // ================================================================
  // 18 — G'S NEIGHBORS ARE C AND D
  // ================================================================

  await until(S(18));
  await play(
    ...clearLayer('panel'),

    ...selectReading(
      byId('G')
    ),

    ...replaceLayer(
      'neighborhood',

      makeNeighborhoodCircle(
        byId('G'),
        G.kthDistance,
        BLUE
      )
    ),

    ...showNeighbors(G),

    ...say('G’S NEIGHBORS: 4 AND 6'),

    ...fbox([
      ['G = 5', PURPLE],
      ['C = 4', BLUE],
      ['D = 6', BLUE],
      'Exactly two nearest neighbors'
    ])
  );

  // ================================================================
  // 19 — EACH NEIGHBOR IS ONE UNIT AWAY
  // ================================================================

  await until(S(19));
  await play(
    ...clearLayer('neighborhood'),

    ...showActualDistances(G),

    ...say('BOTH ACTUAL DISTANCES = 1'),

    ...fbox([
      'Distance G to C = |5 − 4|',
      'Distance G to D = |5 − 6|',
      ['Both distances = 1', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 20 — ACTUAL DISTANCES ALONE DO NOT MEASURE CROWDING
  // ================================================================

  await until(S(20));
  await play(
    ...showPanel(
      makeBarPanel(
        'Actual distances only',

        [
          {
            label: 'G → C',
            value: 1,
            display: '1',
            color: BLUE
          },

          {
            label: 'G → D',
            value: 1,
            display: '1',
            color: BLUE
          }
        ],

        2
      )
    ),

    ...say('DISTANCE ALONE IS NOT ENOUGH', C.amber),

    ...fbox([
      'G is one unit from each neighbor',
      'But how crowded are those neighbors?',
      ['Examine their surroundings too', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 21 — FIND C'S OWN SECOND-CLOSEST NEIGHBOR
  //
  // C is part of the normal reference set.
  //
  // Exclude C itself.
  // Do not include the new reading G.
  // ================================================================

  await until(S(21));
  await play(
    ...clearLayer('distances'),

    ...selectReading(
      byId('C')
    ),

    ...showNeighbors(
      REFERENCE.C
    ),

    ...replaceLayer(
      'neighborhood',

      makeNeighborhoodCircle(
        byId('C'),
        REFERENCE.C.kthDistance,
        BLUE
      )
    ),

    ...showPanel(
      makeDistanceTable(
        REFERENCE.C,

        {
          title:
            'Find C’s second-neighbor distance',

          highlight:
            'actual'
        }
      )
    ),

    ...say('LOOK AT C’S OWN NEIGHBORHOOD'),

    ...fbox([
      ['C = 4', BLUE],
      'Find nearby normal readings',
      'Exclude C itself',
      ['G is not a reference neighbor', C.amber]
    ])
  );

  // ================================================================
  // 22 — C'S SECOND-NEIGHBOR DISTANCE IS TWO
  //
  // B is closest at distance 1.
  // A and D tie at distance 2.
  // ================================================================

  await until(S(22));
  await play(
    ...clearLayer('neighborhood'),

    ...showActualDistances(
      REFERENCE.C
    ),

    ...say('C’S SECOND-NEIGHBOR DISTANCE = 2', BLUE),

    ...fbox([
      'C to B = 1',
      'C to A = 2',
      'C to D = 2',
      ['Second-neighbor distance = 2', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 23 — D'S SECOND-NEIGHBOR DISTANCE IS ALSO TWO
  //
  // D at 6:
  // E is one unit away.
  // C and F are two units away.
  // ================================================================

  await until(S(23));
  await play(
    ...selectReading(
      byId('D')
    ),

    ...showNeighbors(
      REFERENCE.D
    ),

    ...showActualDistances(
      REFERENCE.D
    ),

    ...showPanel(
      makeDistanceTable(
        REFERENCE.D,

        {
          title:
            'D’s normal neighborhood',

          highlight:
            'actual'
        }
      )
    ),

    ...say('D’S SECOND-NEIGHBOR DISTANCE = 2', BLUE),

    ...fbox([
      'D to E = 1',
      'D to C = 2',
      'D to F = 2',
      ['Second-neighbor distance = 2', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 24 — NEVER USE LESS THAN THE NEIGHBOR'S KTH DISTANCE
  //
  // Restore G as the examined reading.
  //
  // Compare G → C actual distance 1 with C's
  // second-neighbor distance 2.
  // ================================================================

  const G_TO_C =
    G.rows.find(row =>
      row.id === 'C'
    );

  const G_TO_D =
    G.rows.find(row =>
      row.id === 'D'
    );

  await until(S(24));
  await play(
    ...selectReading(
      byId('G')
    ),

    ...showNeighbors(G),

    ...showActualDistances(G),

    ...showPanel(
      makeReachComparison(
        byId('G'),
        G_TO_C
      )
    ),

    ...say('USE AT LEAST THE NEIGHBOR’S SECOND DISTANCE'),

    ...fbox([
      'Compare two distances:',
      ['Actual distance to the neighbor', BLUE],
      ['Neighbor’s own kth distance', PURPLE],
      ['Use whichever is larger', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 25 — PREVENT VERY SHORT DISTANCES FROM EXAGGERATING CROWDING
  // ================================================================

  await until(S(25));
  await play(
    new M.Indicate(
      layers.panel,
      { color: C.amber }
    ),

    ...say('AVOID EXAGGERATING VERY SMALL DISTANCES'),

    ...fbox([
      'An unusually short distance',
      'Could exaggerate local crowding',
      ['Use the neighbor’s distance floor', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 26 — NAME REACHABILITY DISTANCE
  // ================================================================

  await until(S(26));
  await play(
    ...say('ADJUSTED DISTANCE = REACHABILITY DISTANCE'),

    ...fbox([
      ['Reachability distance', C.cyan],
      'Larger of:',
      ['Actual distance', BLUE],
      ['Neighbor’s kth distance', PURPLE]
    ])
  );

  // ================================================================
  // 27 — G TO C: ACTUAL ONE, ADJUSTED TWO
  // ================================================================

  await until(S(27));
  await play(
    ...showPanel(
      makeReachComparison(
        byId('G'),
        G_TO_C
      )
    ),

    ...say('G TO C: MAX(1, 2) = 2', C.amber),

    ...fbox([
      ['Actual G to C = 1', BLUE],
      ['C’s second-neighbor distance = 2', PURPLE],
      'Reachability = max(1, 2)',
      [
        `= ${fmt(G_TO_C.reach)}`,
        C.amber
      ]
    ], C.amber)
  );

  // ================================================================
  // 28 — G TO D: ADJUSTED DISTANCE TWO
  // ================================================================

  await until(S(28));
  await play(
    ...showPanel(
      makeReachComparison(
        byId('G'),
        G_TO_D
      )
    ),

    ...say('G TO D: MAX(1, 2) = 2', C.amber),

    ...fbox([
      ['Actual G to D = 1', BLUE],
      ['D’s second-neighbor distance = 2', PURPLE],
      'Reachability = max(1, 2)',
      [
        `= ${fmt(G_TO_D.reach)}`,
        C.amber
      ]
    ], C.amber)
  );

  // ================================================================
  // 29 — ADD ADJUSTED DISTANCES AND DIVIDE BY TWO
  //
  // (2 + 2) / 2 = 2.
  // ================================================================

  await until(S(29));
  await play(
    ...showPanel(
      makeMeanReachPicture(G)
    ),

    ...say('MEAN REACHABILITY DISTANCE = 2'),

    ...fbox([
      'Adjusted distances: 2 and 2',
      'Total = 2 + 2 = 4',
      'Divide by 2 neighbors',
      [
        `Mean = ${fmt(G.meanReach)}`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 30 — LARGER DENSITY SHOULD MEAN MORE CROWDING
  //
  // Explain the reciprocal relationship.
  // ================================================================

  await until(S(30));
  await play(
    ...showPanel(
      makeReciprocalPicture()
    ),

    ...say('CLOSER SURROUNDINGS SHOULD MEAN LARGER DENSITY'),

    ...fbox([
      'Small mean distance',
      ['→ large local density', C.cyan],
      'Large mean distance',
      ['→ small local density', PURPLE]
    ])
  );

  // ================================================================
  // 31 — DIVIDE ONE BY THE MEAN DISTANCE
  //
  // G:
  // mean reachability distance = 2.
  // local density = 1/2 = 0.5.
  // ================================================================

  await until(S(31));
  await play(
    ...showPanel(
      makeIndividualDensityPanel(
        byId('G'),
        G
      )
    ),

    ...say('1 ÷ 2 = 0.5', PURPLE),

    ...fbox([
      'Local density = 1 ÷ mean distance',
      '= 1 ÷ 2',
      [
        `= ${fraction(G.density)}`,
        PURPLE
      ],
      [
        `= ${decimal(G.density, 1)}`,
        PURPLE
      ]
    ], PURPLE)
  );

  // ================================================================
  // 32 — MEASURE HOW CLOSELY G IS SURROUNDED
  // ================================================================

  await until(S(32));
  await play(
    new M.Indicate(
      layers.panel,
      { color: PURPLE }
    ),

    ...say('HOW CLOSELY IS G SURROUNDED?'),

    ...fbox([
      'Mean adjusted distance = 2',
      ['Local density = 0.5', PURPLE],
      'A numerical measure of crowding'
    ])
  );

  // ================================================================
  // 33 — NAME LOCAL REACHABILITY DENSITY
  // ================================================================

  await until(S(33));
  await play(
    ...say('LOCAL REACHABILITY DENSITY'),

    ...fbox([
      ['Local reachability density', C.cyan],
      '1 ÷ mean reachability distance',
      ['G’s density = 0.5', PURPLE]
    ])
  );

  // ================================================================
  // 34 — NOW CALCULATE C'S LOCAL DENSITY
  //
  // The examined reference reading temporarily becomes C.
  //
  // G remains a new reading and is not used as a reference.
  // ================================================================

  await until(S(34));
  await play(
    ...clearLayer('distances'),

    ...selectReading(
      byId('C')
    ),

    ...showNeighbors(
      REFERENCE.C
    ),

    ...replaceLayer(
      'neighborhood',

      makeNeighborhoodCircle(
        byId('C'),
        REFERENCE.C.kthDistance,
        BLUE
      )
    ),

    ...showPanel(
      makeReferenceSummary(K)
    ),

    ...say('NOW CALCULATE C’S LOCAL DENSITY', BLUE),

    ...fbox([
      'Reference reading C = 4',
      'Find its normal neighbors',
      'Calculate its adjusted distances',
      ['Use the same method', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 35 — C HAS THREE NEIGHBORS BECAUSE OF A TIE
  //
  // A at 2.
  // B at 3.
  // D at 6.
  //
  // Include both readings tied at distance 2.
  // ================================================================

  await until(S(35));
  await play(
    ...clearLayer('neighborhood'),

    ...showActualDistances(
      REFERENCE.C
    ),

    ...showPanel(
      makeDistanceTable(
        REFERENCE.C,

        {
          title:
            'C has three neighbors',

          highlight:
            'actual'
        }
      )
    ),

    ...say('C’S NEIGHBORS: 2, 3 AND 6'),

    ...fbox([
      'B at 3: distance 1',
      'A at 2: distance 2',
      'D at 6: distance 2',
      ['A and D tie for second place', C.amber]
    ])
  );

  // ================================================================
  // 36 — C'S REACHABILITY DISTANCES ARE TWO, ONE, TWO
  //
  // C → A:
  // max(2, 2) = 2.
  //
  // C → B:
  // max(1, 1) = 1.
  //
  // C → D:
  // max(2, 2) = 2.
  // ================================================================

  await until(S(36));
  await play(
    ...showPanel(
      makeDistanceTable(
        REFERENCE.C,

        {
          title:
            'C’s adjusted distances',

          highlight:
            'reach'
        }
      )
    ),

    ...say('REACHABILITY DISTANCES: 2, 1, 2', C.amber),

    ...fbox([
      'C → A: max(2, 2) = 2',
      'C → B: max(1, 1) = 1',
      'C → D: max(2, 2) = 2',
      ['Use each neighbor’s own kth distance', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 37 — TOTAL FIVE, DIVIDE BY THREE
  //
  // The actual neighborhood contains three readings.
  // Therefore divide by 3, not by k = 2.
  // ================================================================

  await until(S(37));
  await play(
    ...showPanel(
      makeMeanReachPicture(
        REFERENCE.C
      )
    ),

    ...say('MEAN = (2 + 1 + 2) ÷ 3'),

    ...fbox([
      'Total = 2 + 1 + 2 = 5',
      ['Actual neighbor count = 3', C.amber],
      'Mean reachability distance',
      [
        `= ${fraction(REFERENCE.C.meanReach)}`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 38 — C'S LOCAL DENSITY IS THREE FIFTHS
  //
  // 1 / (5/3) = 3/5 = 0.6.
  // ================================================================

  await until(S(38));
  await play(
    ...showPanel(
      makeIndividualDensityPanel(
        byId('C'),
        REFERENCE.C
      )
    ),

    ...say('1 ÷ (5/3) = 3/5 = 0.6', C.cyan),

    ...fbox([
      'C’s mean distance = 5/3',
      'Local density = 1 ÷ (5/3)',
      [
        `= ${fraction(REFERENCE.C.density)}`,
        C.cyan
      ],
      [
        `= ${decimal(REFERENCE.C.density, 1)}`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 39 — D HAS THE SAME LOCAL DENSITY
  //
  // D's normal neighbors are C, E, F.
  //
  // Their reachability distances are 2, 1, 2.
  //
  // Mean = 5/3.
  // Local density = 3/5 = 0.6.
  // ================================================================

  await until(S(39));
  await play(
    ...selectReading(
      byId('D')
    ),

    ...showNeighbors(
      REFERENCE.D
    ),

    ...showActualDistances(
      REFERENCE.D
    ),

    ...showPanel(
      makeDistanceTable(
        REFERENCE.D,

        {
          title:
            'D’s adjusted distances',

          highlight:
            'reach'
        }
      )
    ),

    ...say('D ALSO HAS LOCAL DENSITY 0.6'),

    ...fbox([
      'D’s neighbors: C, E, F',
      'Adjusted distances: 2, 1, 2',
      'Mean = 5/3',
      [
        `Density = ${fraction(REFERENCE.D.density)} = 0.6`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 40 — COMPARE G'S DENSITY WITH THE NEIGHBOR MEAN
  //
  // Mean neighbor density:
  // (0.6 + 0.6) / 2 = 0.6.
  //
  // G's local density = 0.5.
  // ================================================================

  await until(S(40));
  await play(
    ...selectReading(
      byId('G')
    ),

    ...showNeighbors(G),

    ...showActualDistances(G),

    ...showPanel(
      makeTwoNeighborDensities(G)
    ),

    ...say('NEIGHBOR MEAN 0.6 · G’S DENSITY 0.5'),

    ...fbox([
      ['C’s local density = 0.6', BLUE],
      ['D’s local density = 0.6', BLUE],
      ['Neighbor mean = 0.6', BLUE],
      ['G’s own density = 0.5', PURPLE]
    ])
  );

  await play(
    ...showPanel(
      makeDensityComparison(G)
    )
  );

  // ================================================================
  // 41 — DIVIDE NEIGHBOR DENSITY BY G'S OWN DENSITY
  //
  // 0.6 / 0.5 = 1.2.
  // ================================================================

  await until(S(41));
  await play(
    new M.Indicate(
      layers.panel,
      { color: C.cyan }
    ),

    ...status(
      `G · LOF = ${fmt(G.score)}`,
      PURPLE
    ),

    ...say('LOCAL OUTLIER FACTOR = 0.6 ÷ 0.5'),

    ...fbox([
      ['Neighbor mean density = 0.6', BLUE],
      ['Own local density = 0.5', PURPLE],
      'LOF = 0.6 ÷ 0.5',
      [
        `= ${fmt(G.score)}`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 42 — A SCORE OF ONE MEANS EQUAL LOCAL DENSITIES
  // ================================================================

  await until(S(42));
  await play(
    ...showPanel(
      makeScoreAxis()
    ),

    ...say('LOF = 1 MEANS EQUAL LOCAL DENSITY', C.green),

    ...fbox([
      'Neighbor density = own density',
      'Their ratio = 1',
      ['Similar local crowding', C.green]
    ], C.green)
  );

  // ================================================================
  // 43 — G'S NEIGHBORS ARE TWENTY PERCENT DENSER
  //
  // Relative difference:
  //
  // (0.6 - 0.5) / 0.5 = 0.2.
  //
  // This is a relative density difference.
  // It is NOT a probability of a fault.
  // ================================================================

  const G_PERCENT_DIFFERENCE =
    100 * (
      G.neighborMean /
      G.density - 1
    );

  await until(S(43));
  await play(
    ...showPanel(
      makeScoreAxis(G)
    ),

    ...say('G: NEIGHBOR DENSITY IS 20% HIGHER'),

    ...fbox([
      'LOF = 1.2',
      '1.2 − 1 = 0.2',
      [
        `${fmt(G_PERCENT_DIFFERENCE)}% higher neighbor density`,
        C.cyan
      ],
      ['Not a fault probability', C.muted]
    ])
  );

  // ================================================================
  // 44 — H AT TEN HAS LOF APPROXIMATELY 1.46
  //
  // G remains at 5.
  // Reveal H as a separate new reading at 10.
  //
  // G is not allowed into H's reference neighborhood.
  //
  // H's neighbors: E and F.
  // Adjusted distances: 3 and 2.
  //
  // Mean reachability distance = 2.5.
  // Own density = 2/5.
  //
  // E density = 1/2.
  // F density = 2/3.
  // Neighbor mean density = 7/12.
  //
  // LOF = 35/24 ≈ 1.46.
  // ================================================================

  await until(S(44));
  await play(
    ...revealNew('H'),

    ...selectReading(
      byId('H')
    ),

    ...showNeighbors(H),

    ...showActualDistances(H),

    ...showPanel(
      makeDistanceTable(
        H
      )
    ),

    ...status(
      `H · LOF ≈ ${scoreText(H.score)}`,
      PURPLE
    ),

    ...say('NEW READING H AT 10', PURPLE),

    ...fbox([
      'Neighbors: E = 7, F = 8',
      'Adjusted distances: 3, 2',
      [
        `Mean distance = ${fmt(H.meanReach)}`,
        C.amber
      ],
      [
        `Own density = ${fraction(H.density)}`,
        PURPLE
      ]
    ])
  );

  await play(
    ...showPanel(
      makeDensityComparison(H)
    ),

    ...fbox([
      'Neighbor mean = (1/2 + 2/3) ÷ 2',
      [
        `= ${fraction(H.neighborMean)}`,
        BLUE
      ],
      'LOF = (7/12) ÷ (2/5)',
      [
        `= ${fraction(H.score)} ≈ ${scoreText(H.score)}`,
        PURPLE
      ]
    ])
  );

  // ================================================================
  // 45 — I AT TWELVE HAS LOF APPROXIMATELY 2.63
  //
  // G and H remain separate new readings.
  //
  // I's reference neighbors are still E and F,
  // NOT H at vibration 10.
  //
  // Adjusted distances: 5 and 4.
  // Mean reachability distance = 4.5.
  // Own local density = 2/9.
  //
  // Neighbor mean density remains 7/12.
  //
  // LOF = 21/8 = 2.625.
  // ================================================================

  await until(S(45));
  await play(
    ...revealNew('I'),

    ...selectReading(
      byId('I')
    ),

    ...showNeighbors(I),

    ...showActualDistances(I),

    ...showPanel(
      makeDistanceTable(
        I
      )
    ),

    ...status(
      `I · LOF ≈ ${scoreText(I.score)}`,
      PURPLE
    ),

    ...say('NEW READING I AT 12', PURPLE),

    ...fbox([
      'Neighbors remain E and F',
      ['H is not a normal reference', C.amber],
      'Adjusted distances: 5, 4',
      [
        `Mean distance = ${fmt(I.meanReach)}`,
        C.amber
      ]
    ])
  );

  await play(
    ...showPanel(
      makeDensityComparison(I)
    ),

    ...fbox([
      [
        `Own density = ${fraction(I.density)}`,
        PURPLE
      ],
      [
        `Neighbor mean = ${fraction(I.neighborMean)}`,
        BLUE
      ],
      'LOF = (7/12) ÷ (2/9)',
      [
        `= ${fraction(I.score)} ≈ ${scoreText(I.score)}`,
        PURPLE
      ]
    ])
  );

  // ================================================================
  // 46 — INTRODUCE THE SHORT COMPARISON FORMULA
  // ================================================================

  await until(S(46));
  await play(
    ...clearLayers(
      'selection',
      'neighbors',
      'distances'
    ),

    ...showPanel(
      makeScoreComparison(
        [G, H, I]
      )
    ),

    ...say('WRITE THE LOCAL COMPARISON RULE'),

    ...fbox([
      'One reading’s local density',
      'Compared with its neighbors',
      ['A ratio of two local densities', C.cyan]
    ])
  );

  // ================================================================
  // 47 — GENERAL LOCAL OUTLIER FACTOR FORMULA
  //
  // LOF =
  //   mean local reachability density of neighbors
  //   / own local reachability density
  // ================================================================

  await until(S(47));
  await play(
    ...say('LOF = NEIGHBOR MEAN DENSITY ÷ OWN DENSITY'),

    ...fbox([
      ['Local outlier factor =', C.cyan],

      ['   mean density of neighbors', BLUE],

      '   ─────────────────────────',

      ['   reading’s own local density', PURPLE],

      'Use local reachability densities'
    ])
  );

  // ================================================================
  // 48 — USEFUL WHEN DIFFERENT GROUPS HAVE DIFFERENT DENSITIES
  //
  // A local comparison accounts for how crowded the
  // surrounding reference neighborhood is.
  // ================================================================

  await until(S(48));
  await play(
    ...showPanel(
      makeReferenceSummary(K)
    ),

    ...replaceLayer(
      'neighborhood',

      new M.VGroup(
        makeNeighborhoodCircle(
          byId('B'),
          REFERENCE.B.kthDistance,
          BLUE
        ),

        makeNeighborhoodCircle(
          byId('D'),
          REFERENCE.D.kthDistance,
          ORANGE
        )
      )
    ),

    ...say('COMPARE EACH READING WITH ITS LOCAL SURROUNDINGS'),

    ...fbox([
      'Different areas can have',
      'different amounts of crowding',
      ['Compare with nearby readings', C.cyan],
      'Rather than one global distance rule'
    ])
  );

  // ================================================================
  // 49 — NEIGHBOR COUNT MATTERS; HIGH SCORE IS NOT PROOF
  //
  // Keep the main demonstration at k = 2.
  //
  // Introduce the caution without choosing an arbitrary
  // machine-fault cutoff.
  // ================================================================

  await until(S(49));
  await play(
    ...clearLayer('neighborhood'),

    ...showPanel(
      makeScoreComparison(
        [G, H, I]
      )
    ),

    ...selectReading(
      byId('I')
    ),

    ...status(
      'High score ≠ confirmed fault',
      C.amber
    ),

    ...say('NEIGHBOR COUNT MATTERS · HIGH SCORE IS NOT PROOF', C.amber),

    ...fbox([
      'Changing k can change the score',
      ['I has the highest score here', PURPLE],
      'A high score suggests attention',
      ['It does not prove a fault', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 50 — TRY IT: DRAG THE NEW READING
  //
  // Hide the three recorded new-reading markers during
  // the movable-probe illustration.
  //
  // The fixed chapter data remain unchanged.
  //
  // Update the hypothetical query's:
  //   nearest normal neighbors,
  //   actual and reachability distances,
  //   local density,
  //   neighbor mean density,
  //   LOF.
  // ================================================================

  await until(S(50));
  await play(
    ...hideAllNew(),

    ...clearLayers(
      'selection',
      'status'
    ),

    ...tryReading(5),

    ...say('TRY IT: DRAG THE NEW READING')
  );

  await play(
    ...tryReading(9)
  );

  // ================================================================
  // 51 — RETURN THE QUERY TO FIVE AND CHECK LOF 1.2
  //
  // This hypothetical probe coincides with G's
  // original recorded vibration.
  // ================================================================

  await until(S(51));
  await play(
    ...tryReading(5),

    ...say('AT 5, CHECK THAT LOF = 1.2', C.green)
  );

  await play(
    ...fbox([
      'Neighbors: 4 and 6',
      'Adjusted distances: 2 and 2',
      ['Own density = 0.5', PURPLE],
      ['Neighbor mean = 0.6', BLUE],
      ['LOF = 1.2', C.green]
    ], C.green)
  );

  // ================================================================
  // 52 — PREDICT WHETHER MOVING FROM TEN TO TWELVE
  //      WILL INCREASE THE SCORE
  //
  // The selected reference neighbors remain E and F.
  //
  // At 10:
  //   own density = 2/5.
  //   LOF = 35/24.
  //
  // At 12:
  //   own density = 2/9.
  //   LOF = 21/8.
  //
  // Neighbor mean density remains 7/12.
  //
  // Allow time for the learner to predict before
  // displaying the second result.
  // ================================================================

  await until(S(52));
  await play(
    ...tryReading(10),

    ...say('PREDICT: MOVE FROM 10 TO 12', C.amber)
  );

  await until(S(52) + 2.5);
  await play(
    ...tryReading(12),

    ...say('TEST: THE SCORE INCREASES', C.green)
  );

  await play(
    ...showPanel(
      makeScoreComparison(
        [H, I]
      )
    ),

    ...fbox([
      [
        `At 10: LOF ≈ ${scoreText(H.score)}`,
        PURPLE
      ],

      [
        `At 12: LOF ≈ ${scoreText(I.score)}`,
        PURPLE
      ],

      'Same reference neighbors',
      'Own local density decreases',
      ['Relative isolation increases', C.green]
    ], C.green)
  );

  // ================================================================
  // 53 — NEW DATA AND DIFFERENT NUMBERS OF NEIGHBORS
  //
  // Illustrate the New data control.
  //
  // Actual generation of fresh data belongs to the
  // separate Try it activity.
  //
  // Demonstrate the neighbor-count effect on the
  // original normal reference readings.
  //
  // Compare k = 2 with k = 3 at vibration 5.
  //
  // For k = 3, G's neighbors are B, C, D, E:
  // C and D are one unit away.
  // B and E tie at distance two.
  //
  // Include all four neighbors.
  //
  // Recalculate every normal kth-neighbor distance
  // and local density using k = 3.
  // ================================================================

  const newDataButton = fittedPill(
    'New data',

    PURPLE,
    P ? 18 : 16,

    CONTROL_POS,

    2.15
  );

  await until(S(53));
  await play(
    ...clearProbe(),

    ...clearLayers(
      'neighbors',
      'distances'
    ),

    ...replaceLayer(
      'control',
      newDataButton
    ),

    ...showPanel(
      makeReferenceSummary(K)
    ),

    ...say('NEW DATA · EXPLORE DIFFERENT NEIGHBOR COUNTS'),

    ...fbox([
      ['Press New data in Try it', PURPLE],
      'Explore different surroundings',
      'Change the number of neighbors',
      ['Recalculate the local densities', C.cyan]
    ])
  );

  await play(
    ...setProbe(5),

    ...neighborSlider(3),

    ...showNeighbors(
      G_K3
    ),

    ...replaceLayer(
      'neighborhood',

      makeNeighborhoodCircle(
        byId('G'),
        G_K3.kthDistance,
        BLUE
      )
    ),

    ...showPanel(
      makeReferenceSummary(3)
    ),

    ...fbox([
      'Illustration using the same data',
      'Change k from 2 to 3',
      'Neighbors: B, C, D, E',
      ['Four neighbors because of ties', C.amber]
    ])
  );

  await play(
    ...clearLayer('neighborhood'),

    ...showPanel(
      makeDensityComparison(
        G_K3
      )
    ),

    ...fbox([
      [
        `With k = 2: LOF = ${fmt(G.score)}`,
        PURPLE
      ],

      [
        `With k = 3: LOF ≈ ${scoreText(G_K3.score)}`,
        C.cyan
      ],

      'Recalculate all reference densities',
      ['The choice of k changes the comparison', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 54 — FINAL TAKEAWAY
  //
  // Restore the original chapter setup:
  //
  // Six fixed normal reference readings.
  // Three separate new readings.
  // k = 2, including every tie.
  //
  // G = 5:
  //   LOF = 1.20.
  //
  // H = 10:
  //   LOF ≈ 1.46.
  //
  // I = 12:
  //   LOF ≈ 2.63.
  //
  // The method compares a reading's local reachability
  // density with its neighbors' mean local density.
  //
  // I is the most unusual of these three readings
  // according to this measure.
  //
  // This is a reason to investigate, not proof of a fault.
  // ================================================================

  await until(S(54));
  await play(
    ...clearProbe(),

    ...clearLayers(
      'control',
      'selection',
      'neighbors',
      'neighborhood',
      'distances'
    ),

    ...revealNew('G'),

    ...revealNew('H'),

    ...revealNew('I'),

    ...showPanel(
      makeScoreComparison(
        [G, H, I]
      )
    ),

    ...status(
      'k = 2 · Fixed normal reference readings',
      C.cyan
    ),

    ...say('COMPARE A READING’S CROWDING WITH ITS NEIGHBORS'),

    ...fbox([
      ['LOF = neighbor mean density ÷ own density', C.cyan],

      [
        `G: ${scoreText(G.score)}`,
        PURPLE
      ],

      [
        `H: ${scoreText(H.score)}`,
        PURPLE
      ],

      [
        `I: ${scoreText(I.score)}`,
        PURPLE
      ],

      ['Larger score → greater relative isolation', C.amber]
    ])
  );

  await play(
    ...selectReading(
      byId('I')
    ),

    new M.Indicate(
      newMarkers.I,
      { color: C.amber }
    ),

    ...fbox([
      ['Local outlier factor', C.cyan],
      'Compare local reachability densities',
      ['I is most unusual here', PURPLE],
      'Investigate unusual readings',
      ['A high score is not proof of a fault', C.amber]
    ], C.amber)
  );
}

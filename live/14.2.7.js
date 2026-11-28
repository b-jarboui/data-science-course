// lesson 14.2.7
// Isolation forests: finding readings that need fewer cuts to stand alone.
// Live manim-web scene. Beat i = narration sentence i (0-based).
// Runs in site/live/engine.js using the supplied engine interface.
//
// Uses all nine fixed chapter readings and both measurements.
// The three demonstration trees reproduce the specified splits exactly.
// Every path length is calculated from the actual tree structure.
//
// Reference length for nine readings:
// c(9) = 2 * H(8) - 2 * 8 / 9 = 3.6579365079...
//
// Checked three-tree results:
// G: paths 5, 5, 4; mean 4.6667; anomaly score ≈ 0.413.
// H: paths 2, 2, 3; mean 2.3333; anomaly score ≈ 0.643.
// I: paths 1, 2, 2; mean 1.6667; anomaly score ≈ 0.729.
//
// The 100-tree illustration retains the three specified demonstration
// trees and adds 97 reproducible, seeded random trees.
// It does not replace the checked three-tree results.
//
// Try it controls illustrate the separate interactive simulation.
// Known operating-mode labels are hidden from the isolation method.
// Amber outlines indicate attention or investigation, not confirmed faults.
// Browser rendering has not been verified against the actual engine runtime.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T,
    pill, show, showA, until, play, LINE_Y
  } = L;

  // ================================================================
  // FIXED CHAPTER DATA
  // ================================================================

  const DATA = [
    { id: 'A', x: 2,  y: 20, mode: 'slow' },
    { id: 'B', x: 3,  y: 21, mode: 'slow' },
    { id: 'C', x: 4,  y: 22, mode: 'slow' },
    { id: 'D', x: 6,  y: 22, mode: 'fast' },
    { id: 'E', x: 7,  y: 23, mode: 'fast' },
    { id: 'F', x: 8,  y: 24, mode: 'fast' },
    { id: 'G', x: 5,  y: 22, mode: 'unknown' },
    { id: 'H', x: 10, y: 25, mode: 'unknown' },
    { id: 'I', x: 12, y: 30, mode: 'unknown' }
  ];

  const NORMAL = DATA.slice(0, 6);
  const NEW = DATA.slice(6);

  const IDS = DATA.map(d => d.id);
  const QUERY_IDS = ['G', 'H', 'I'];

  const byId = id =>
    DATA.find(d => d.id === id);

  const N = DATA.length;

  const BLUE = '#60A5FA';
  const ORANGE = '#FB923C';
  const PURPLE = '#A78BFA';

  // Distinct shades for the three new-reading history curves.
  // All three represent new readings, not operating modes.

  const SERIES = {
    G: '#C4B5FD',
    H: '#A78BFA',
    I: '#E879F9'
  };

  const sum = values =>
    values.reduce((a, b) => a + b, 0);

  const mean = values =>
    sum(values) / values.length;

  const fmt = (v, digits = 2) =>
    v.toFixed(digits);

  const short = v =>
    String(Number(v.toFixed(4)));

  // ================================================================
  // EXACT ISOLATION SCORE NORMALIZATION
  //
  // c(n) = 2 H(n - 1) - 2(n - 1)/n
  //
  // Here H(m) is the harmonic sum:
  //
  // H(m) = 1 + 1/2 + ... + 1/m.
  //
  // This uses the exact harmonic sum for n = 9,
  // rather than a large-sample logarithmic approximation.
  // ================================================================

  function harmonic(n) {
    let total = 0;

    for (let i = 1; i <= n; i++) {
      total += 1 / i;
    }

    return total;
  }

  function referenceLength(n) {
    if (n <= 1) return 0;
    if (n === 2) return 1;

    return (
      2 * harmonic(n - 1) -
      2 * (n - 1) / n
    );
  }

  const REF = referenceLength(N);

  function anomalyScore(pathMean) {
    return Math.pow(
      2,
      -pathMean / REF
    );
  }

  // ================================================================
  // FIXED TREE SPECIFICATIONS
  //
  // A split is represented by:
  //
  //   [measurement, threshold, leftBranch, rightBranch]
  //
  // x = vibration.
  // y = temperature.
  //
  // Left branch:
  //   measurement < threshold.
  //
  // Right branch:
  //   measurement >= threshold.
  //
  // A leaf is the reading's letter.
  //
  // The specified leaf identities are checked against the
  // actual measurement values during tree construction.
  // ================================================================

  const SPEC1 = [
    'y', 27,

    [
      'x', 9,

      [
        'x', 5.5,

        [
          'x', 3.5,

          ['x', 2.5, 'A', 'B'],
          ['x', 4.5, 'C', 'G']
        ],

        [
          'x', 6.5,

          'D',
          ['x', 7.5, 'E', 'F']
        ]
      ],

      'H'
    ],

    'I'
  ];

  const SPEC2 = [
    'x', 9,

    [
      'y', 21.5,

      ['x', 2.5, 'A', 'B'],

      [
        'x', 6.5,

        [
          'x', 4.5,

          'C',
          ['x', 5.5, 'G', 'D']
        ],

        ['x', 7.5, 'E', 'F']
      ]
    ],

    ['y', 27, 'H', 'I']
  ];

  const SPEC3 = [
    'x', 7.5,

    [
      'y', 21.5,

      ['x', 2.5, 'A', 'B'],

      [
        'x', 5.5,

        ['x', 4.5, 'C', 'G'],
        ['x', 6.5, 'D', 'E']
      ]
    ],

    [
      'y', 27,

      ['x', 9, 'F', 'H'],
      'I'
    ]
  ];

  // ================================================================
  // TREE CONSTRUCTION
  //
  // Each internal node stores:
  //   its remaining readings,
  //   its split measurement,
  //   its split threshold,
  //   its depth,
  //   its rectangular region in the scatterplot.
  //
  // A split line is drawn only within the region belonging
  // to the node being divided.
  //
  // This prevents later cuts from incorrectly dividing
  // readings in other branches.
  // ================================================================

  const ROOT_BOUNDS = {
    x0: 0,
    x1: 13,
    y0: 18,
    y1: 31
  };

  function childBounds(bounds, axis, threshold) {
    const left = { ...bounds };
    const right = { ...bounds };

    if (axis === 'x') {
      left.x1 = threshold;
      right.x0 = threshold;
    } else {
      left.y1 = threshold;
      right.y0 = threshold;
    }

    return [left, right];
  }

  function buildTree(
    spec,
    readings = DATA,
    bounds = ROOT_BOUNDS,
    depth = 0,
    path = '',
    index = {}
  ) {
    const node = {
      readings: readings.slice(),
      bounds: { ...bounds },
      depth,
      path,
      leaf: typeof spec === 'string'
    };

    index[path] = node;

    if (node.leaf) {
      if (
        readings.length !== 1 ||
        readings[0].id !== spec
      ) {
        throw new Error(
          `Invalid isolation leaf: ${spec}`
        );
      }

      node.id = spec;
      return node;
    }

    const [
      axis,
      threshold,
      leftSpec,
      rightSpec
    ] = spec;

    const values = readings.map(d => d[axis]);

    const minimum = Math.min(...values);
    const maximum = Math.max(...values);

    if (
      threshold <= minimum ||
      threshold >= maximum
    ) {
      throw new Error(
        'Split must lie within the remaining data range'
      );
    }

    node.axis = axis;
    node.threshold = threshold;

    const leftData = readings.filter(
      d => d[axis] < threshold
    );

    const rightData = readings.filter(
      d => d[axis] >= threshold
    );

    if (
      leftData.length === 0 ||
      rightData.length === 0
    ) {
      throw new Error('Empty isolation branch');
    }

    const [leftBounds, rightBounds] =
      childBounds(
        bounds,
        axis,
        threshold
      );

    node.left = buildTree(
      leftSpec,
      leftData,
      leftBounds,
      depth + 1,
      path + 'L',
      index
    );

    node.right = buildTree(
      rightSpec,
      rightData,
      rightBounds,
      depth + 1,
      path + 'R',
      index
    );

    return node;
  }

  function collectLengths(node, out = {}) {
    if (node.leaf) {
      out[node.id] = node.depth;
      return out;
    }

    collectLengths(node.left, out);
    collectLengths(node.right, out);

    return out;
  }

  function collectInternalNodes(node, out = []) {
    if (node.leaf) return out;

    out.push(node);

    collectInternalNodes(node.left, out);
    collectInternalNodes(node.right, out);

    return out;
  }

  function collectLeaves(node, out = []) {
    if (node.leaf) {
      out.push(node);
      return out;
    }

    collectLeaves(node.left, out);
    collectLeaves(node.right, out);

    return out;
  }

  function makeTree(spec, number) {
    const index = {};

    const root = buildTree(
      spec,
      DATA,
      ROOT_BOUNDS,
      0,
      '',
      index
    );

    return {
      number,
      root,
      index,
      lengths: collectLengths(root)
    };
  }

  const TREE1 = makeTree(SPEC1, 1);
  const TREE2 = makeTree(SPEC2, 2);
  const TREE3 = makeTree(SPEC3, 3);

  const FIXED_TREES = [
    TREE1,
    TREE2,
    TREE3
  ];

  const EXPECTED_LENGTHS = [
    [5, 5, 5, 4, 5, 5, 5, 2, 1],
    [3, 3, 4, 5, 4, 4, 5, 2, 2],
    [3, 3, 4, 4, 4, 3, 4, 3, 2]
  ];

  // Verify that the reconstructed trees match every
  // checked path length in the source instructions.

  FIXED_TREES.forEach((tree, i) => {
    IDS.forEach((id, j) => {
      if (
        tree.lengths[id] !==
        EXPECTED_LENGTHS[i][j]
      ) {
        throw new Error(
          `Tree ${i + 1}: unexpected path length for ${id}`
        );
      }
    });
  });

  // ================================================================
  // FOREST STATISTICS
  //
  // Path lengths count splits from the root to the leaf.
  // The root itself is at depth zero.
  //
  // The anomaly score is computed from the MEAN path length,
  // rather than averaging the individual tree scores.
  // ================================================================

  function forestStats(trees) {
    return Object.fromEntries(
      IDS.map(id => {
        const paths = trees.map(
          tree => tree.lengths[id]
        );

        const pathMean = mean(paths);

        return [
          id,
          {
            id,
            paths,
            pathMean,
            score: anomalyScore(pathMean)
          }
        ];
      })
    );
  }

  const CHECKED = forestStats(
    FIXED_TREES
  );

  const G = CHECKED.G;
  const H = CHECKED.H;
  const I = CHECKED.I;

  // ================================================================
  // REPRODUCIBLE RANDOM FOREST FOR TRY IT
  //
  // The first three trees are the supplied fixed examples.
  //
  // Additional trees choose uniformly between measurements
  // that still vary within the current node.
  //
  // The split point is chosen randomly within the observed
  // minimum and maximum of the selected measurement.
  //
  // Every tree includes all nine readings and continues
  // until every leaf contains exactly one reading.
  //
  // A fixed seed keeps the demonstration reproducible.
  // ================================================================

  function seededRandom(seed) {
    let state = seed >>> 0;

    return function () {
      state = (
        Math.imul(1664525, state) +
        1013904223
      ) >>> 0;

      return (
        (state + 0.5) /
        4294967296
      );
    };
  }

  const random = seededRandom(1427);

  function randomSpec(readings, rng) {
    if (readings.length === 1) {
      return readings[0].id;
    }

    const choices = ['x', 'y']
      .map(axis => {
        const values =
          readings.map(d => d[axis]);

        return {
          axis,
          minimum: Math.min(...values),
          maximum: Math.max(...values)
        };
      })
      .filter(
        item => item.maximum > item.minimum
      );

    if (choices.length === 0) {
      throw new Error(
        'Cannot isolate identical observations with these features'
      );
    }

    const choice = choices[
      Math.floor(rng() * choices.length)
    ];

    const threshold =
      choice.minimum +
      rng() * (
        choice.maximum -
        choice.minimum
      );

    const left = readings.filter(
      d => d[choice.axis] < threshold
    );

    const right = readings.filter(
      d => d[choice.axis] >= threshold
    );

    return [
      choice.axis,
      threshold,
      randomSpec(left, rng),
      randomSpec(right, rng)
    ];
  }

  const ALL_TREES = FIXED_TREES.slice();

  for (let number = 4; number <= 100; number++) {
    ALL_TREES.push(
      makeTree(
        randomSpec(DATA, random),
        number
      )
    );
  }

  // Each history entry contains actual calculated
  // path lengths, running means and anomaly scores.

  const HISTORY = [];

  const totals = Object.fromEntries(
    IDS.map(id => [id, 0])
  );

  ALL_TREES.forEach((tree, index) => {
    const count = index + 1;
    const values = {};

    IDS.forEach(id => {
      totals[id] += tree.lengths[id];

      const pathMean =
        totals[id] / count;

      values[id] = {
        path: tree.lengths[id],
        pathMean,
        score: anomalyScore(pathMean)
      };
    });

    HISTORY.push({
      count,
      values
    });
  });

  const FINAL_100 = HISTORY[99];

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone:
  //   Formula box above main picture.
  //   Main picture centered horizontally.
  //
  // Laptop:
  //   Main picture on left.
  //   Formula box on right.
  //
  // The scatterplot, tree diagram, path table and learning
  // charts take turns occupying the same main region.
  //
  // This avoids displaying several unreadably small
  // visualizations simultaneously.
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.62, 0]
    : [4.5, -0.30, 0];

  const STATUS_POS = P
    ? [0, -6.35, 0]
    : [4.5, 1.28, 0];

  const CONTROL_POS = P
    ? [0, -6.35, 0]
    : [4.5, -2.28, 0];

  const point = (x, y) =>
    [x, y, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  // ================================================================
  // BASIC VISUAL HELPERS
  // ================================================================

  function textAt(
    s,
    position,
    size,
    color = C.ink,
    mono = false
  ) {
    const t = T(s, size, color, mono);
    t.moveTo(position);
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

  function rectangleAt(
    position,
    width,
    height,
    color,
    opacity = 0,
    strokeWidth = 1.5
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(position);

    return r;
  }

  function roundedAt(
    position,
    width,
    height,
    color,
    opacity = 0.08,
    strokeWidth = 1.5
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.10,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(position);

    return r;
  }

  function circleAt(
    position,
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

    c.setFill(color, opacity);
    c.moveTo(position);

    return c;
  }

  function dotAt(
    position,
    color,
    radius = 0.075
  ) {
    return new M.Dot({
      point: position,
      radius,
      color
    });
  }

  function fittedPill(
    s,
    color,
    size,
    position,
    maxw
  ) {
    const g = pill(s, color, size);

    if (g.getWidth() > maxw) {
      g.scale(
        maxw / g.getWidth()
      );
    }

    g.moveTo(position);

    return g;
  }

  function fittedText(
    s,
    position,
    size,
    color,
    maxw,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo(position);

    return t;
  }

  function lag(
    animations,
    runTime = 1,
    lagRatio = 0.1
  ) {
    return new M.LaggedStart(
      animations,
      { runTime, lagRatio }
    );
  }

  // ================================================================
  // ONE FORMULA BOX
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
        T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

    const widths = texts.map(
      (t, i) =>
        t.getWidth() +
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        )
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.34;

    const bg = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.17,
      color,
      strokeWidth: 2
    });

    bg.setFill(C.card, 0.95);
    bg.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 -
      0.17 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(
      bg,
      ...texts
    );

    const scale = Math.min(
      1,
      (P ? FW - 1.0 : 4.9) / wd,
      (P ? 1.95 : 2.9) / ht
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
  // No on-screen objects are regrouped into new VGroups.
  // Each layer owns its own independently removable object.
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

  function clearLayers(...keys) {
    return keys.flatMap(
      key => replaceLayer(key, null)
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
        P ? 6.0 : 3.85
      )
    );
  }

  // ================================================================
  // WORKSHOP MACHINE INTRODUCTION
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
      const angle =
        Math.PI / 4 + i * Math.PI / 2;

      spokes.push(
        lineAt(
          wc,

          point(
            wc[0] + 0.59 * Math.cos(angle),
            wc[1] + 0.59 * Math.sin(angle)
          ),

          C.cyan,
          2.5
        )
      );
    }

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

    const shakes = [];

    [-1, 1].forEach(side => {
      const xx =
        x + side * 1.75;

      for (let j = 0; j < 2; j++) {
        const yy =
          y + 0.60 - j * 0.88;

        shakes.push(
          lineAt(
            point(xx, yy),

            point(
              xx + side * 0.15,
              yy - 0.14
            ),

            C.amber,
            2
          ),

          lineAt(
            point(
              xx + side * 0.15,
              yy - 0.14
            ),

            point(xx, yy - 0.28),

            C.amber,
            2
          )
        );
      }
    });

    const mg = new M.VGroup(
      lineAt(
        point(x - 2.14, y - 1.37),
        point(x + 2.14, y - 1.37),
        C.muted,
        2
      ),

      housing,
      cap,
      ...feet,
      wheel,
      ...spokes,

      circleAt(
        wc,
        0.16,
        C.cyan,
        0.9
      ),

      ...vents,

      dotAt(
        point(x + 1.12, y + 0.76),
        C.green
      ),

      ...shakes
    );
    if (P) mg.scale(1.45);
    return mg;
  }

  // ================================================================
  // TWO-DIMENSIONAL SCATTERPLOT
  //
  // Horizontal: vibration, mm/s.
  // Vertical: temperature, degrees Celsius.
  //
  // Both measurements retain a fixed scale throughout
  // the three demonstration trees.
  // ================================================================

  const XLEFT = P
    ? -3.15
    : -6.35;

  const XRIGHT = P
    ? 3.15
    : 1.25;

  const YBOTTOM = P
    ? -5.30
    : -2.85;

  const YTOP = P
    ? 1.40
    : 1.25;

  const XMIN = ROOT_BOUNDS.x0;
  const XMAX = ROOT_BOUNDS.x1;

  const YMIN = ROOT_BOUNDS.y0;
  const YMAX = ROOT_BOUNDS.y1;

  const px = x =>
    XLEFT +
    (x - XMIN) /
    (XMAX - XMIN) *
    (XRIGHT - XLEFT);

  const py = y =>
    YBOTTOM +
    (y - YMIN) /
    (YMAX - YMIN) *
    (YTOP - YBOTTOM);

  const gp = (x, y) =>
    point(px(x), py(y));

  function makeAxes() {
    const parts = [];

    // Dark grid.

    for (let x = 0; x <= 13; x++) {
      parts.push(
        lineAt(
          gp(x, YMIN),
          gp(x, YMAX),
          '#243244',
          0.8
        )
      );
    }

    for (let y = 18; y <= 31; y++) {
      parts.push(
        lineAt(
          gp(XMIN, y),
          gp(XMAX, y),
          '#243244',
          0.8
        )
      );
    }

    parts.push(
      lineAt(
        gp(XMIN, YMIN),
        gp(XMAX, YMIN),
        C.muted,
        2.2
      ),

      lineAt(
        gp(XMIN, YMIN),
        gp(XMIN, YMAX),
        C.muted,
        2.2
      )
    );

    for (let x = 0; x <= 12; x += 2) {
      parts.push(
        lineAt(
          point(px(x), YBOTTOM - 0.04),
          point(px(x), YBOTTOM + 0.04),
          C.muted,
          1.2
        ),

        textAt(
          String(x),

          point(
            px(x),
            YBOTTOM - 0.19
          ),

          P ? 16 : 14,
          C.muted,
          true
        )
      );
    }

    for (let y = 18; y <= 30; y += 2) {
      parts.push(
        lineAt(
          point(XLEFT - 0.04, py(y)),
          point(XLEFT + 0.04, py(y)),
          C.muted,
          1.2
        ),

        textAt(
          String(y),

          point(
            XLEFT - 0.26,
            py(y)
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
          CX,
          YBOTTOM - 0.50
        ),

        P ? 18 : 16,
        C.ink
      ),

      textAt(
        'Temperature (°C)',

        point(
          XLEFT + 1.03,
          YTOP + 0.22
        ),

        P ? 16 : 15,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  // ================================================================
  // READING MARKERS
  //
  // Slow mode: blue circle when revealed.
  // Fast mode: orange square when revealed.
  // Hidden normal mode: white circle.
  // New reading: purple diamond.
  //
  // The isolation forest never receives the mode labels.
  // ================================================================

  function diamondAt(
    position,
    color,
    radius = 0.10
  ) {
    const x = position[0];
    const y = position[1];

    const corners = [
      point(x, y + radius),
      point(x + radius, y),
      point(x, y - radius),
      point(x - radius, y)
    ];

    const halo = dotAt(
      position,
      color,
      radius * 1.75
    );

    halo.setFill(color, 0.14);

    return new M.VGroup(
      halo,

      dotAt(
        position,
        color,
        radius * 0.43
      ),

      ...corners.map(
        (a, i) =>
          lineAt(
            a,
            corners[(i + 1) % 4],
            color,
            2.5
          )
      )
    );
  }

  function makeReading(
    reading,
    revealMode = false
  ) {
    const p = gp(
      reading.x,
      reading.y
    );

    const unknown =
      reading.mode === 'unknown';

    const color = unknown
      ? PURPLE
      : revealMode
        ? (
            reading.mode === 'slow'
              ? BLUE
              : ORANGE
          )
        : C.ink;

    let marker;

    if (unknown) {
      marker = diamondAt(
        p,
        PURPLE,
        0.105
      );

    } else {
      const halo = dotAt(
        p,
        color,
        0.155
      );

      halo.setFill(color, 0.14);

      const core =
        revealMode &&
        reading.mode === 'fast'

          ? rectangleAt(
              p,
              0.15,
              0.15,
              color,
              1,
              1.2
            )

          : dotAt(
              p,
              color,
              0.080
            );

      marker = new M.VGroup(
        halo,
        core
      );
    }

    const label = textAt(
      reading.id,

      point(
        p[0],
        p[1] + 0.22
      ),

      P ? 16 : 15,
      color,
      true
    );

    return new M.VGroup(
      marker,
      label
    );
  }

  function makeNormalReadings() {
    return new M.VGroup(
      ...NORMAL.map(d =>
        makeReading(d, false)
      )
    );
  }

  function revealReading(id) {
    return replaceLayer(
      `reading-${id}`,

      makeReading(
        byId(id)
      )
    );
  }

  function selectionRing(
    id,
    color = C.amber
  ) {
    const d = byId(id);

    return circleAt(
      gp(d.x, d.y),
      0.185,
      color,
      0,
      2.3
    );
  }

  function selectReadings(
    ids,
    color = C.amber
  ) {
    return replaceLayer(
      'selection',

      new M.VGroup(
        ...ids.map(
          id => selectionRing(
            id,
            color
          )
        )
      )
    );
  }

  function clearPlot() {
    return clearLayers(
      'axes',
      'normal',
      'reading-G',
      'reading-H',
      'reading-I',
      'selection',
      'range',
      'region',
      'legend'
    );
  }

  function showPlot() {
    return [
      ...replaceLayer(
        'axes',
        makeAxes()
      ),

      ...replaceLayer(
        'normal',
        makeNormalReadings()
      ),

      ...QUERY_IDS.flatMap(
        revealReading
      )
    ];
  }

  // ================================================================
  // SCATTERPLOT REGIONS
  //
  // An outline is drawn directly from the coordinates.
  // Existing point objects are never placed inside new groups.
  // ================================================================

  function regionOutline(
    bounds,
    color = C.cyan,
    opacity = 0.035
  ) {
    const a = gp(
      bounds.x0,
      bounds.y0
    );

    const b = gp(
      bounds.x1,
      bounds.y1
    );

    return rectangleAt(
      point(
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2
      ),

      b[0] - a[0],
      b[1] - a[1],

      color,
      opacity,
      1.7
    );
  }

  function dataOutline(
    ids,
    color = C.cyan
  ) {
    const readings = ids.map(byId);

    const xs = readings.map(d => d.x);
    const ys = readings.map(d => d.y);

    const bounds = {
      x0: Math.min(...xs) - 0.35,
      x1: Math.max(...xs) + 0.35,
      y0: Math.min(...ys) - 0.45,
      y1: Math.max(...ys) + 0.45
    };

    return regionOutline(
      bounds,
      color
    );
  }

  function highlightRegion(
    tree,
    path,
    color = C.cyan
  ) {
    return replaceLayer(
      'region',

      regionOutline(
        tree.index[path].bounds,
        color
      )
    );
  }

  function highlightLeafRegion(
    tree,
    id
  ) {
    const node = collectLeaves(
      tree.root
    ).find(n => n.id === id);

    return replaceLayer(
      'region',

      regionOutline(
        node.bounds,
        C.amber,
        0.025
      )
    );
  }

  // ================================================================
  // ROOM ANALOGY
  //
  // One person stands alone near a corner.
  // Another stands within a small crowd.
  //
  // A single wall can isolate the corner person.
  // Several walls are needed around the crowded person.
  //
  // This is a conceptual illustration, not machine data.
  // ================================================================

  const ROOM_CY = P
    ? -1.60
    : -0.55;

  const ROOM_W = 5.55;
  const ROOM_H = P ? 5.40 : 3.05;

  const ROOM_LEFT =
    CX - ROOM_W / 2;

  const ROOM_RIGHT =
    CX + ROOM_W / 2;

  const ROOM_BOTTOM =
    ROOM_CY - ROOM_H / 2;

  const ROOM_TOP =
    ROOM_CY + ROOM_H / 2;

  const roomPoint = (u, v) =>
    point(
      ROOM_LEFT + u * ROOM_W,
      ROOM_BOTTOM + v * ROOM_H
    );

  function personAt(
    position,
    color,
    selected = false
  ) {
    const x = position[0];
    const y = position[1];

    const head = circleAt(
      point(x, y + 0.15),
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

    body.setFill(color, 0.87);
    body.moveTo(
      point(x, y - 0.035)
    );

    const parts = [
      head,
      body
    ];

    if (selected) {
      parts.push(
        circleAt(
          point(x, y + 0.055),
          0.25,
          C.amber,
          0,
          1.7
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function makeRoom() {
    const positions = [
      [0.20, 0.22],
      [0.34, 0.22],
      [0.48, 0.22],
      [0.20, 0.43],
      [0.34, 0.43],
      [0.48, 0.43],
      [0.20, 0.65],
      [0.34, 0.65],
      [0.48, 0.65]
    ];

    const parts = [
      roundedAt(
        point(CX, ROOM_CY),
        ROOM_W,
        ROOM_H,
        C.muted,
        0.055,
        1.7
      )
    ];

    positions.forEach(([u, v], i) => {
      parts.push(
        personAt(
          roomPoint(u, v),
          i === 4 ? PURPLE : C.ink,
          i === 4
        )
      );
    });

    parts.push(
      personAt(
        roomPoint(0.86, 0.84),
        PURPLE,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  function cornerWall() {
    return lineAt(
      roomPoint(0.69, 0),
      roomPoint(0.69, 1),
      C.amber,
      4
    );
  }

  function crowdWalls() {
    return [
      lineAt(
        roomPoint(0, 0.325),
        roomPoint(0.69, 0.325),
        C.cyan,
        3.3
      ),

      lineAt(
        roomPoint(0, 0.54),
        roomPoint(0.69, 0.54),
        C.cyan,
        3.3
      ),

      lineAt(
        roomPoint(0.27, 0.325),
        roomPoint(0.27, 0.54),
        C.cyan,
        3.3
      ),

      lineAt(
        roomPoint(0.41, 0.325),
        roomPoint(0.41, 0.54),
        C.cyan,
        3.3
      )
    ];
  }

  // ================================================================
  // ANIMATED PARTITION LINES
  //
  // Each split is clipped to the node's own region.
  //
  // Temperature split: horizontal.
  // Vibration split: vertical.
  //
  // Descendant splits never extend across their ancestors'
  // boundaries.
  // ================================================================

  let cutObjects = [];

  function makeCut(
    node,
    color = C.cyan
  ) {
    const b = node.bounds;

    if (node.axis === 'x') {
      return lineAt(
        gp(node.threshold, b.y0),
        gp(node.threshold, b.y1),
        color,
        2.4
      );
    }

    return lineAt(
      gp(b.x0, node.threshold),
      gp(b.x1, node.threshold),
      color,
      2.4
    );
  }

  function clearCuts() {
    const animations =
      cutObjects.map(
        obj => new M.FadeOut(obj)
      );

    cutObjects = [];

    return animations;
  }

  function addCut(
    tree,
    path,
    color = C.cyan,
    runTime = 0.7
  ) {
    const node = tree.index[path];

    if (!node || node.leaf) {
      throw new Error(
        `Invalid split path: ${path}`
      );
    }

    const cut = makeCut(
      node,
      color
    );

    cutObjects.push(cut);

    return [
      new M.Create(
        cut,
        { runTime }
      )
    ];
  }

  function addCuts(
    tree,
    paths,
    runTime = 1.4,
    color = C.cyan
  ) {
    const animations = paths.flatMap(
      path =>
        addCut(
          tree,
          path,
          color,
          0.45
        )
    );

    return animations.length
      ? [
          lag(
            animations,
            runTime,
            0.25
          )
        ]
      : [];
  }

  function showAllCuts(
    tree,
    runTime = 1.8
  ) {
    return addCuts(
      tree,

      collectInternalNodes(
        tree.root
      ).map(n => n.path),

      runTime
    );
  }

  function clearTreeView() {
    return clearLayers(
      'tree',
      'forest',
      'table',
      'chart',
      'score',
      'control',
      'summary'
    );
  }

  function resetScatterplot() {
    return [
      ...clearCuts(),
      ...clearPlot(),
      ...clearTreeView(),
      ...showPlot()
    ];
  }

  // ================================================================
  // MEASUREMENT RANGE ILLUSTRATION
  //
  // The random split point must be within the minimum
  // and maximum values of the selected measurement
  // among the readings remaining in the current node.
  // ================================================================

  function makeRangeGuide(
    readings,
    axis
  ) {
    const values = readings.map(
      d => d[axis]
    );

    const lo = Math.min(...values);
    const hi = Math.max(...values);

    const parts = [];

    if (axis === 'x') {
      const y =
        YTOP - 0.16;

      parts.push(
        lineAt(
          point(px(lo), y),
          point(px(hi), y),
          C.amber,
          3
        ),

        lineAt(
          point(px(lo), y - 0.08),
          point(px(lo), y + 0.08),
          C.amber,
          2
        ),

        lineAt(
          point(px(hi), y - 0.08),
          point(px(hi), y + 0.08),
          C.amber,
          2
        ),

        fittedPill(
          `Vibration range: ${lo}–${hi}`,

          C.amber,
          P ? 16 : 15,

          point(
            (px(lo) + px(hi)) / 2,
            y - 0.32
          ),

          3.2
        )
      );

    } else {
      const x =
        XRIGHT - 0.10;

      parts.push(
        lineAt(
          point(x, py(lo)),
          point(x, py(hi)),
          C.amber,
          3
        ),

        lineAt(
          point(x - 0.08, py(lo)),
          point(x + 0.08, py(lo)),
          C.amber,
          2
        ),

        lineAt(
          point(x - 0.08, py(hi)),
          point(x + 0.08, py(hi)),
          C.amber,
          2
        ),

        fittedPill(
          `${lo}–${hi} °C`,

          C.amber,
          P ? 16 : 14,

          point(
            x - 0.85,
            (py(lo) + py(hi)) / 2
          ),

          1.65
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ================================================================
  // COMPLETE ISOLATION TREE DIAGRAM
  //
  // Root at the top.
  // Each successive split appears one level lower.
  //
  // Leaf x positions follow their traversal order.
  // Internal nodes are centered over their descendants.
  //
  // Vertical position encodes the actual number of cuts.
  // The selected reading's root-to-leaf path is highlighted.
  //
  // Blue and orange operating-mode labels are not used.
  // ================================================================

  function splitLabel(node) {
    const name =
      node.axis === 'x'
        ? 'V'
        : 'T';

    return (
      `${name} < ${short(node.threshold)}`
    );
  }

  function makeTreeDiagram(
    tree,
    options = {}
  ) {
    const {
      selected = null,
      showLengths = true,
      title = `Isolation tree ${tree.number}`,
      miniature = false,
      miniX = CX,
      miniY = 0
    } = options;

    const leaves = collectLeaves(
      tree.root
    );

    const maxDepth = Math.max(
      ...leaves.map(n => n.depth)
    );

    const left = miniature
      ? miniX - 0.87
      : CX - 2.82;

    const right = miniature
      ? miniX + 0.87
      : CX + 2.82;

    const top = miniature
      ? miniY + 0.64
      : P ? 1.14 : 1.00;

    const bottom = miniature
      ? miniY - 0.60
      : P ? -5.09 : -3.17;

    const dy =
      (top - bottom) /
      Math.max(1, maxDepth);

    const positions = {};

    leaves.forEach((leaf, i) => {
      positions[leaf.path] = point(
        left +
        i / (leaves.length - 1) *
        (right - left),

        top - leaf.depth * dy
      );
    });

    function locate(node) {
      if (node.leaf) {
        return positions[node.path];
      }

      const a = locate(node.left);
      const b = locate(node.right);

      positions[node.path] = point(
        (a[0] + b[0]) / 2,
        top - node.depth * dy
      );

      return positions[node.path];
    }

    locate(tree.root);

    const selectedLeaf =
      selected

        ? leaves.find(
            n => n.id === selected
          )

        : null;

    const onPath = node =>
      selectedLeaf &&
      selectedLeaf.path.startsWith(
        node.path
      );

    const edges = [];
    const nodes = [];

    function visit(node) {
      const p = positions[node.path];

      const active =
        onPath(node);

      if (!node.leaf) {
        [node.left, node.right].forEach(
          child => {
            const q =
              positions[child.path];

            const chosen =
              onPath(child);

            const edgeColor = chosen
              ? C.amber
              : '#52677E';

            edges.push(
              lineAt(
                point(
                  p[0],
                  p[1] - (
                    miniature ? 0.03 : 0.14
                  )
                ),

                point(
                  q[0],
                  q[1] + (
                    miniature ? 0.03 : 0.14
                  )
                ),

                edgeColor,

                miniature
                  ? 1
                  : chosen ? 3 : 1.5
              )
            );

            visit(child);
          }
        );
      }

      if (miniature) {
        const color = node.leaf
          ? (
              QUERY_IDS.includes(node.id)
                ? PURPLE
                : C.ink
            )
          : C.cyan;

        nodes.push(
          dotAt(
            p,
            color,
            node.leaf ? 0.026 : 0.035
          )
        );

        return;
      }

      if (node.leaf) {
        const isNew =
          QUERY_IDS.includes(node.id);

        const color = isNew
          ? PURPLE
          : C.ink;

        const bg = roundedAt(
          p,
          0.59,
          0.30,

          active
            ? C.amber
            : color,

          0.10,

          active ? 2.2 : 1.1
        );

        const label = fittedText(
          showLengths
            ? `${node.id} · ${node.depth}`
            : node.id,

          p,

          P ? 16 : 14,
          color,
          0.51,
          true
        );

        nodes.push(
          bg,
          label
        );

      } else {
        const color = active
          ? C.amber
          : C.cyan;

        const bg = roundedAt(
          p,
          0.70,
          0.31,
          color,
          0.10,
          active ? 2.0 : 1.2
        );

        const label = fittedText(
          splitLabel(node),
          p,
          P ? 16 : 14,
          color,
          0.62,
          true
        );

        nodes.push(
          bg,
          label
        );
      }
    }

    visit(tree.root);

    const objects = [
      ...edges,
      ...nodes
    ];

    if (!miniature) {
      objects.push(
        fittedText(
          title,

          point(
            CX,
            top + 0.42
          ),

          P ? 18 : 16,
          C.ink,
          5.7
        ),

        fittedText(
          'V = vibration · T = temperature',

          point(
            CX,
            bottom - 0.40
          ),

          P ? 16 : 14,
          C.muted,
          5.8
        )
      );

      if (P) {
        objects.push(
          textAt(
            'Left: <    Right: ≥',

            point(
              CX,
              bottom - 0.70
            ),

            14,
            C.muted,
            true
          )
        );
      }

    } else {
      objects.push(
        textAt(
          `Tree ${tree.number}`,

          point(
            miniX,
            miniY + 0.91
          ),

          P ? 16 : 15,
          C.cyan
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function showTree(
    tree,
    selected = null,
    title = null,
    showLengths = true
  ) {
    return [
      ...clearCuts(),
      ...clearPlot(),
      ...clearLayers(
        'forest',
        'table',
        'chart',
        'score',
        'summary'
      ),

      ...replaceLayer(
        'tree',

        makeTreeDiagram(
          tree,

          {
            selected,
            showLengths,

            title:
              title ||
              `Isolation tree ${tree.number}`
          }
        )
      )
    ];
  }

  // ================================================================
  // THREE-TREE FOREST PICTURE
  // ================================================================

  function makeForestPicture() {
    const y = P
      ? -0.64
      : -0.45;

    const spacing = P
      ? 2.04
      : 1.98;

    const parts = FIXED_TREES.map(
      (tree, i) =>
        makeTreeDiagram(
          tree,

          {
            miniature: true,

            miniX:
              CX + (i - 1) * spacing,

            miniY: y + 0.32
          }
        )
    );

    parts.push(
      textAt(
        'Different cuts, different path lengths',

        point(
          CX,
          y - 0.69
        ),

        P ? 18 : 16,
        C.ink
      )
    );

    QUERY_IDS.forEach((id, i) => {
      const x =
        CX + (i - 1) * spacing;

      parts.push(
        fittedPill(
          `${id}: ${CHECKED[id].paths.join(', ')}`,

          PURPLE,

          P ? 16 : 15,

          point(
            x,
            y - 1.17
          ),

          1.85
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ================================================================
  // PATH LENGTH TABLE
  //
  // Every row is derived from the actual tree structure.
  // The mean column uses all three supplied trees.
  //
  // The table can display all nine readings, or just the
  // three new readings for the narrated worked example.
  // ================================================================

  function makePathTable(
    options = {}
  ) {
    const {
      all = false,
      active = null,
      showMean = true,
      showScores = false
    } = options;

    const ids = all
      ? IDS
      : QUERY_IDS;

    const columnOffsets = showScores
      ? [-2.58, -1.70, -0.89, -0.08, 0.96, 2.05]
      : [-2.48, -1.38, -0.30, 0.78, 2.00];

    const headings = showScores
      ? ['ID', 'T1', 'T2', 'T3', 'Mean', 'Score']
      : ['ID', 'Tree 1', 'Tree 2', 'Tree 3', 'Mean'];

    const top = P
      ? 1.05
      : 1.02;

    const rowGap = all
      ? P ? 0.66 : 0.35
      : P ? 1.35 : 0.72;

    const parts = [
      textAt(
        all
          ? 'Path lengths of all nine readings'
          : 'Compare the new readings',

        point(
          CX,
          top + 0.37
        ),

        P ? 18 : 16,
        C.ink
      )
    ];

    headings.forEach((heading, i) => {
      parts.push(
        fittedText(
          heading,

          point(
            CX + columnOffsets[i],
            top - 0.14
          ),

          P ? 16 : 14,
          C.muted,

          showScores ? 0.80 : 1.00,

          true
        )
      );
    });

    parts.push(
      lineAt(
        point(
          CX - 2.92,
          top - 0.36
        ),

        point(
          CX + 2.92,
          top - 0.36
        ),

        C.muted,
        1.2
      )
    );

    ids.forEach((id, i) => {
      const row = CHECKED[id];

      const y =
        top - 0.59 -
        i * rowGap;

      const color =
        QUERY_IDS.includes(id)
          ? PURPLE
          : C.ink;

      if (active === id) {
        parts.push(
          roundedAt(
            point(CX, y),
            5.78,
            rowGap - 0.05,
            C.amber,
            0.055,
            1.6
          )
        );
      }

      const values = [
        id,
        ...row.paths.map(String),

        showMean
          ? fmt(row.pathMean, 2)
          : '—'
      ];

      if (showScores) {
        values.push(
          fmt(row.score, 3)
        );
      }

      values.forEach((value, j) => {
        const valueColor =
          j === 0
            ? color
            : j === 4
              ? C.cyan
              : j === 5
                ? PURPLE
                : C.ink;

        parts.push(
          textAt(
            value,

            point(
              CX + columnOffsets[j],
              y
            ),

            P
              ? all ? 15 : 20
              : all ? 13 : 17,

            valueColor,
            true
          )
        );
      });
    });

    if (!all) {
      parts.push(
        fittedPill(
          'Shorter mean path → easier isolation',

          C.cyan,
          P ? 16 : 15,

          point(
            CX,
            top - 0.59 -
              ids.length * rowGap - 0.23
          ),

          5.55
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function showTable(options = {}) {
    return [
      ...clearLayers(
        'tree',
        'forest',
        'score',
        'chart',
        'summary'
      ),

      ...replaceLayer(
        'table',
        makePathTable(options)
      )
    ];
  }

  // ================================================================
  // MEAN PATH LENGTH BARS
  //
  // A common zero baseline makes mean path lengths
  // directly comparable.
  //
  // Shorter bars represent easier isolation.
  // ================================================================

  function makeMeanBars(
    selected = null
  ) {
    const left =
      CX - 1.90;

    const width = 4.05;
    const maxValue = 5;

    const top = P
      ? 0.96
      : 0.82;

    const spacing = P
      ? 1.50
      : 0.95;

    const parts = [
      textAt(
        'Mean number of cuts',

        point(
          CX,
          top + 0.42
        ),

        P ? 19 : 16,
        C.ink
      )
    ];

    ['I', 'H', 'G'].forEach(
      (id, i) => {
        const r = CHECKED[id];

        const y =
          top - i * spacing;

        const w =
          width *
          r.pathMean / maxValue;

        parts.push(
          textAt(
            id,

            point(
              left - 0.56,
              y
            ),

            P ? 20 : 17,
            PURPLE,
            true
          ),

          rectangleAt(
            point(
              left + width / 2,
              y
            ),

            width,
            0.35,
            C.muted,
            0.05,
            1
          ),

          rectangleAt(
            point(
              left + w / 2,
              y
            ),

            w,
            0.35,
            SERIES[id],
            0.85,
            1.1
          ),

          textAt(
            fmt(r.pathMean, 2),

            point(
              left + w / 2,
              y
            ),

            P ? 16 : 15,
            '#0F172A',
            true
          )
        );

        if (selected === id) {
          parts.push(
            roundedAt(
              point(
                left + width / 2,
                y
              ),

              width + 0.14,
              0.48,
              C.amber,
              0,
              2
            )
          );
        }
      }
    );

    const bottom =
      top - 2 * spacing - 0.50;

    for (let v = 0; v <= 5; v++) {
      const x =
        left + v / 5 * width;

      parts.push(
        textAt(
          String(v),
          point(x, bottom),
          P ? 16 : 14,
          C.muted,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ================================================================
  // ANOMALY SCORE PICTURE
  //
  // Score = 2 ^ (-mean path length / reference length).
  //
  // The score scale is always 0 to 1.
  //
  // These scores are not probabilities of machine failure.
  // No decision threshold is chosen in this lesson.
  // ================================================================

  function makeScoreBars(
    results = CHECKED,
    selected = null
  ) {
    const left =
      CX - 1.90;

    const width = 4.10;

    const top = P
      ? 0.92
      : 0.81;

    const spacing = P
      ? 1.50
      : 0.95;

    const parts = [
      textAt(
        'Isolation anomaly score',

        point(
          CX,
          top + 0.47
        ),

        P ? 19 : 16,
        C.ink
      )
    ];

    ['I', 'H', 'G'].forEach(
      (id, i) => {
        const value =
          results[id].score;

        const y =
          top - i * spacing;

        const w =
          width * value;

        parts.push(
          diamondAt(
            point(
              left - 0.65,
              y
            ),

            PURPLE,
            0.095
          ),

          textAt(
            id,

            point(
              left - 0.35,
              y
            ),

            P ? 17 : 16,
            PURPLE,
            true
          ),

          rectangleAt(
            point(
              left + width / 2,
              y
            ),

            width,
            0.35,
            C.muted,
            0.035,
            1
          ),

          rectangleAt(
            point(
              left + w / 2,
              y
            ),

            w,
            0.35,
            SERIES[id],
            0.87,
            1.1
          ),

          textAt(
            fmt(value, 3),

            point(
              left + w / 2,
              y
            ),

            P ? 16 : 15,
            '#0F172A',
            true
          )
        );

        if (id === selected) {
          parts.push(
            roundedAt(
              point(
                left + width / 2,
                y
              ),

              width + 0.14,
              0.49,
              C.amber,
              0,
              2.1
            )
          );
        }
      }
    );

    const bottom =
      top - 2 * spacing - 0.49;

    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      parts.push(
        textAt(
          short(v),

          point(
            left + v * width,
            bottom
          ),

          P ? 16 : 14,
          C.muted,
          true
        )
      );
    });

    parts.push(
      fittedText(
        'Higher score → easier isolation',

        point(
          CX,
          bottom - 0.43
        ),

        P ? 17 : 15,
        C.cyan,
        5.7
      )
    );

    return new M.VGroup(...parts);
  }

  // ================================================================
  // REFERENCE LENGTH AND SCORE TRANSFORMATION
  //
  // Draw the mathematical relationship:
  //
  // score(h) = 2 ^ (-h / REF)
  //
  // Horizontal: mean path length.
  // Vertical: anomaly score.
  //
  // A shorter mean path yields a higher score.
  // ================================================================

  function makeScoreCurve(
    showPoints = false,
    selected = null
  ) {
    const left =
      CX - 2.67;

    const right =
      CX + 2.74;

    const bottom = P
      ? -4.90
      : -2.60;

    const top = P
      ? 1.30
      : 1.16;

    const maxPath = 7;

    const sx = v =>
      left +
      v / maxPath *
      (right - left);

    const sy = v =>
      bottom +
      v *
      (top - bottom);

    const cp = (h, score) =>
      point(sx(h), sy(score));

    const parts = [
      lineAt(
        cp(0, 0),
        cp(maxPath, 0),
        C.muted,
        2
      ),

      lineAt(
        cp(0, 0),
        cp(0, 1),
        C.muted,
        2
      )
    ];

    [0, 0.25, 0.5, 0.75, 1]
      .forEach(v => {
        parts.push(
          lineAt(
            cp(0, v),
            cp(maxPath, v),
            '#293648',
            0.8
          ),

          textAt(
            short(v),

            point(
              left - 0.28,
              sy(v)
            ),

            P ? 16 : 14,
            C.muted,
            true
          )
        );
      });

    [0, 1, 2, 3, 4, 5, 6, 7]
      .forEach(v => {
        parts.push(
          textAt(
            String(v),

            point(
              sx(v),
              bottom - 0.19
            ),

            P ? 16 : 14,
            C.muted,
            true
          )
        );
      });

    for (let i = 0; i < 100; i++) {
      const a =
        maxPath * i / 100;

      const b =
        maxPath * (i + 1) / 100;

      parts.push(
        lineAt(
          cp(a, anomalyScore(a)),
          cp(b, anomalyScore(b)),
          C.cyan,
          3.1
        )
      );
    }

    // Mean path length equal to REF gives score 0.5.

    const refPoint =
      cp(REF, 0.5);

    parts.push(
      dashedAt(
        cp(REF, 0),
        refPoint,
        C.amber
      ),

      dashedAt(
        cp(0, 0.5),
        refPoint,
        C.amber
      ),

      dotAt(
        refPoint,
        C.amber,
        0.06
      ),

      fittedPill(
        `c(9) ≈ ${fmt(REF, 2)}`,

        C.amber,
        P ? 16 : 15,

        point(
          sx(REF) + 0.69,
          bottom + 0.28
        ),

        1.8
      )
    );

    if (showPoints) {
      QUERY_IDS.forEach(id => {
        const r = CHECKED[id];

        const p =
          cp(r.pathMean, r.score);

        parts.push(
          diamondAt(
            p,
            PURPLE,
            0.085
          ),

          fittedPill(
            `${id}: ${fmt(r.score, 3)}`,

            SERIES[id],
            P ? 16 : 14,

            point(
              p[0] + (
                id === 'I'
                  ? -0.42
                  : 0.58
              ),

              p[1] + (
                id === 'H'
                  ? 0.37
                  : 0.26
              )
            ),

            1.48
          )
        );

        if (id === selected) {
          parts.push(
            circleAt(
              p,
              0.15,
              C.amber,
              0,
              2
            )
          );
        }
      });
    }

    parts.push(
      textAt(
        'Anomaly score',

        point(
          left + 0.86,
          top + 0.20
        ),

        P ? 16 : 15,
        C.ink
      ),

      textAt(
        'Mean path length',

        point(
          CX,
          bottom - 0.51
        ),

        P ? 17 : 16,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  // ================================================================
  // RUNNING HISTORY CHARTS
  //
  // Two vertically stacked charts:
  //
  // Upper chart:
  //   running mean path length.
  //
  // Lower chart:
  //   running anomaly score.
  //
  // Every plotted history value comes from the actual
  // computed trees.
  //
  // The horizontal scale expands as more trees are built.
  // The vertical scales remain fixed.
  //
  // Scores are allowed to fluctuate. No monotonic trend
  // or artificial convergence is imposed.
  // ================================================================

  function makeHistoryChart(
    count,
    options = {}
  ) {
    const {
      title = `Trees built: ${count}`
    } = options;

    const history =
      HISTORY.slice(0, count);

    const latest =
      history[history.length - 1];

    const left =
      CX - 2.55;

    const right =
      CX + 2.73;

    const xMaximum = Math.max(
      3,
      count
    );

    const hx = n =>
      left +
      n / xMaximum *
      (right - left);

    const parts = [];

    const panels = P
      ? [
          {
            key: 'pathMean',
            label: 'Running mean path length',
            bottom: -0.65,
            top: 1.10,
            ymax: 8,
            ticks: [0, 2, 4, 6, 8]
          },

          {
            key: 'score',
            label: 'Running anomaly score',
            bottom: -3.34,
            top: -1.60,
            ymax: 1,
            ticks: [0, 0.5, 1]
          }
        ]

      : [
          {
            key: 'pathMean',
            label: 'Running mean path length',
            bottom: -0.12,
            top: 0.98,
            ymax: 8,
            ticks: [0, 4, 8]
          },

          {
            key: 'score',
            label: 'Running anomaly score',
            bottom: -1.88,
            top: -0.78,
            ymax: 1,
            ticks: [0, 0.5, 1]
          }
        ];

    parts.push(
      fittedPill(
        title,

        C.cyan,
        P ? 16 : 15,

        point(
          CX,
          panels[0].top + 0.43
        ),

        5.80
      )
    );

    panels.forEach(panel => {
      const hy = value =>
        panel.bottom +
        value / panel.ymax *
        (panel.top - panel.bottom);

      parts.push(
        lineAt(
          point(left, panel.bottom),
          point(right, panel.bottom),
          C.muted,
          1.6
        ),

        lineAt(
          point(left, panel.bottom),
          point(left, panel.top),
          C.muted,
          1.6
        ),

        fittedText(
          panel.label,

          point(
            CX,
            panel.top + 0.18
          ),

          P ? 16 : 14,
          C.ink,
          5.2
        )
      );

      panel.ticks.forEach(v => {
        const y = hy(v);

        parts.push(
          lineAt(
            point(left, y),
            point(right, y),
            '#293648',
            0.8
          ),

          textAt(
            short(v),

            point(
              left - 0.24,
              y
            ),

            P ? 16 : 14,
            C.muted,
            true
          )
        );
      });

      const ticks = xMaximum <= 5

        ? Array.from(
            { length: xMaximum + 1 },
            (_, i) => i
          )

        : Array.from(
            new Set([
              0,
              Math.round(xMaximum / 4),
              Math.round(xMaximum / 2),
              Math.round(3 * xMaximum / 4),
              xMaximum
            ])
          );

      ticks.forEach(n => {
        const x = hx(n);

        parts.push(
          textAt(
            String(n),

            point(
              x,
              panel.bottom - 0.15
            ),

            P ? 16 : 14,
            C.muted,
            true
          )
        );
      });

      QUERY_IDS.forEach(id => {
        const color =
          SERIES[id];

        for (
          let i = 1;
          i < history.length;
          i++
        ) {
          const a =
            history[i - 1];

          const b =
            history[i];

          parts.push(
            lineAt(
              point(
                hx(a.count),

                hy(
                  a.values[id][panel.key]
                )
              ),

              point(
                hx(b.count),

                hy(
                  b.values[id][panel.key]
                )
              ),

              color,
              2.1
            )
          );
        }

        const p = point(
          hx(latest.count),

          hy(
            latest.values[id][panel.key]
          )
        );

        parts.push(
          dotAt(
            p,
            color,
            0.055
          )
        );
      });
    });

    // Keep the line identities explicit and visible.

    const legendY = P
      ? -3.88
      : -2.23;

    QUERY_IDS.forEach((id, i) => {
      const x =
        CX + (i - 1) * 1.72;

      parts.push(
        lineAt(
          point(x - 0.48, legendY),
          point(x - 0.15, legendY),
          SERIES[id],
          3
        ),

        textAt(
          id,

          point(
            x + 0.03,
            legendY
          ),

          P ? 16 : 14,
          SERIES[id],
          true
        )
      );
    });

    // Individual lengths from the latest completed tree.

    const latestY = P
      ? -4.34
      : -2.62;

    parts.push(
      fittedText(
        `Latest paths: G ${latest.values.G.path} · H ${latest.values.H.path} · I ${latest.values.I.path}`,

        point(
          CX,
          latestY
        ),

        P ? 16 : 15,
        C.ink,
        5.75,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  function showHistory(
    count,
    options = {}
  ) {
    return [
      ...clearCuts(),
      ...clearPlot(),

      ...clearLayers(
        'tree',
        'forest',
        'table',
        'score',
        'summary'
      ),

      ...replaceLayer(
        'chart',

        makeHistoryChart(
          count,
          options
        )
      )
    ];
  }

  function historyFormula(count) {
    const h =
      HISTORY[count - 1];

    return fbox([
      [
        `Trees completed: ${count}`,
        C.cyan
      ],

      [
        `G: mean ${fmt(h.values.G.pathMean)} · ${fmt(h.values.G.score, 3)}`,
        SERIES.G
      ],

      [
        `H: mean ${fmt(h.values.H.pathMean)} · ${fmt(h.values.H.score, 3)}`,
        SERIES.H
      ],

      [
        `I: mean ${fmt(h.values.I.pathMean)} · ${fmt(h.values.I.score, 3)}`,
        SERIES.I
      ]
    ]);
  }

  // ================================================================
  // THREE TREES VERSUS ONE HUNDRED TREES
  //
  // The 100-tree result is one illustrative realization,
  // not a prescribed target from the lesson.
  //
  // The exact checked three-tree values remain available.
  // ================================================================

  function makeForestComparison() {
    const top = P
      ? 1.05
      : 0.97;

    const rowGap = P
      ? 1.35
      : 0.73;

    const cols = [
      CX - 2.42,
      CX - 0.88,
      CX + 0.68,
      CX + 2.05
    ];

    const parts = [
      textAt(
        'Three trees versus 100 trees',

        point(
          CX,
          top + 0.38
        ),

        P ? 19 : 16,
        C.ink
      )
    ];

    ['Reading', '3 trees', '100 trees', 'Change']
      .forEach((s, i) => {
        parts.push(
          fittedText(
            s,

            point(
              cols[i],
              top - 0.13
            ),

            P ? 16 : 14,
            C.muted,
            1.38,
            true
          )
        );
      });

    QUERY_IDS.forEach((id, i) => {
      const before =
        CHECKED[id].score;

      const after =
        FINAL_100.values[id].score;

      const difference =
        after - before;

      const signedDifference =
        (
          difference >= 0 ? '+' : ''
        ) + fmt(difference, 3);

      const y =
        top - 0.66 -
        i * rowGap;

      const values = [
        id,
        fmt(before, 3),
        fmt(after, 3),
        signedDifference
      ];

      parts.push(
        roundedAt(
          point(CX, y),
          5.88,
          rowGap - 0.12,
          SERIES[id],
          0.04,
          1.2
        )
      );

      values.forEach((v, j) => {
        parts.push(
          fittedText(
            v,

            point(cols[j], y),

            P ? 19 : 16,

            j === 0
              ? PURPLE
              : j === 3
                ? C.muted
                : C.ink,

            1.32,
            true
          )
        );
      });
    });

    parts.push(
      fittedText(
        'One reproducible random run',

        point(
          CX,
          top - 0.66 -
            3 * rowGap - 0.08
        ),

        P ? 16 : 15,
        C.muted,
        5.65
      )
    );

    return new M.VGroup(...parts);
  }

  // ================================================================
  // TRY IT CONTROLS
  //
  // Illustrative controls only.
  // Actual pointer interaction belongs to the simulation.
  // ================================================================

  function makeControls(
    state,
    count,
    speed = 1
  ) {
    const x = CONTROL_POS[0];
    const y = CONTROL_POS[1];

    const spacing = P
      ? 1.33
      : 0.87;

    const buttons = [
      ['Step', BLUE],
      ['Play', C.green],
      ['Pause', C.amber],
      ['Reset', PURPLE]
    ];

    const parts = buttons.map(
      ([label, color], i) =>
        fittedPill(
          label,
          color,
          P ? 16 : 14,

          point(
            x + (i - 1.5) * spacing,
            y + 0.18
          ),

          P ? 1.22 : 0.80
        )
    );

    const trackWidth = P
      ? 3.55
      : 2.85;

    const trackY =
      y - 0.24;

    const x0 =
      x - trackWidth / 2;

    const x1 =
      x + trackWidth / 2;

    const t =
      (speed - 1) / 3;

    parts.push(
      lineAt(
        point(x0, trackY),
        point(x1, trackY),
        C.muted,
        3.3
      ),

      dotAt(
        point(
          x0 + t * trackWidth,
          trackY
        ),

        C.cyan,
        0.07
      ),

      fittedText(
        `${state} · ${count} trees · ${speed}×`,

        point(
          x,
          trackY - 0.18
        ),

        P ? 16 : 14,
        C.ink,
        P ? 5.7 : 3.65,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  function controls(
    state,
    count,
    speed = 1
  ) {
    return replaceLayer(
      'control',

      makeControls(
        state,
        count,
        speed
      )
    );
  }

  // ================================================================
  // 0 — CHECK THE WORKSHOP MACHINE FOR UNUSUAL BEHAVIOR
  // ================================================================

  await until(S(0));
  await play(
    ...replaceLayer(
      'machine',
      makeMachine()
    ),

    ...say('CHECK THE MACHINE FOR UNUSUAL BEHAVIOR'),

    ...fbox([
      'Observe the workshop machine',
      'Compare its recorded readings',
      ['Look for unusual behavior', C.amber]
    ])
  );

  // ================================================================
  // 1 — CONSIDER BOTH VIBRATION AND TEMPERATURE
  // ================================================================

  await until(S(1));
  await play(
    ...replaceLayer(
      'measurement-tags',

      new M.VGroup(
        fittedPill(
          'Vibration',

          C.cyan,
          P ? 18 : 16,

          point(
            CX - 1.25,
            P ? 1.18 : 1.31
          ),

          2.20
        ),

        fittedPill(
          'Temperature',

          C.amber,
          P ? 18 : 16,

          point(
            CX + 1.25,
            P ? 1.18 : 1.31
          ),

          2.30
        )
      )
    ),

    ...say('TWO MEASUREMENTS TOGETHER'),

    ...fbox([
      ['Vibration in mm/s', C.cyan],
      ['Temperature in °C', C.amber],
      'Use both measurements'
    ])
  );

  // ================================================================
  // 2 — DRAW VIBRATION HORIZONTALLY AND TEMPERATURE VERTICALLY
  // ================================================================

  await until(S(2));
  await play(
    ...clearLayers(
      'machine',
      'measurement-tags'
    ),

    ...replaceLayer(
      'axes',
      makeAxes()
    ),

    ...say('VIBRATION ACROSS · TEMPERATURE UP'),

    ...fbox([
      'Horizontal: vibration (mm/s)',
      'Vertical: temperature (°C)',
      ['One two-dimensional picture', C.cyan]
    ])
  );

  // ================================================================
  // 3 — ONE DOT REPRESENTS TWO SIMULTANEOUS MEASUREMENTS
  // ================================================================

  await until(S(3));
  await play(
    ...replaceLayer(
      'example-reading',

      new M.VGroup(
        makeReading(
          byId('A')
        ),

        dashedAt(
          gp(2, YMIN),
          gp(2, 20),
          C.cyan
        ),

        dashedAt(
          gp(XMIN, 20),
          gp(2, 20),
          C.amber
        )
      )
    ),

    ...say('ONE DOT · TWO MEASUREMENTS'),

    ...fbox([
      'Example reading A',
      'Vibration = 2 mm/s',
      'Temperature = 20 °C',
      ['Measured at the same moment', C.cyan]
    ])
  );

  // ================================================================
  // 4 — THE SIX NORMAL READINGS FORM TWO SMALL GATHERINGS
  //
  // The known operating-mode labels remain hidden.
  // All six normal markers are neutral white.
  // ================================================================

  await until(S(4));
  await play(
    ...clearLayers('example-reading'),

    ...replaceLayer(
      'normal',
      makeNormalReadings()
    ),

    ...replaceLayer(
      'region',

      new M.VGroup(
        dataOutline(
          ['A', 'B', 'C']
        ),

        dataOutline(
          ['D', 'E', 'F']
        )
      )
    ),

    ...say('6 NORMAL READINGS · TWO GATHERINGS'),

    ...fbox([
      'Previous normal readings A–F',
      'Two small gatherings',
      ['Recorded mode labels hidden', C.muted]
    ])
  );

  // ================================================================
  // 5 — ADD THE THREE NEW READINGS
  // ================================================================

  await until(S(5));
  await play(
    ...clearLayers('region'),

    ...say('NOW ADD THREE NEW READINGS', PURPLE),

    ...fbox([
      'Six previous normal readings',
      ['Three new readings: G, H, I', PURPLE],
      'Unknown operating modes'
    ], PURPLE)
  );

  // ================================================================
  // 6 — G = (5, 22)
  // ================================================================

  await until(S(6));
  await play(
    ...revealReading('G'),

    ...say('G: VIBRATION 5 · TEMPERATURE 22', PURPLE),

    ...fbox([
      ['New reading G', PURPLE],
      'Vibration = 5 mm/s',
      'Temperature = 22 °C'
    ], PURPLE)
  );

  // ================================================================
  // 7 — H = (10, 25)
  // ================================================================

  await until(S(7));
  await play(
    ...revealReading('H'),

    ...say('H: VIBRATION 10 · TEMPERATURE 25', PURPLE),

    ...fbox([
      ['New reading H', PURPLE],
      'Vibration = 10 mm/s',
      'Temperature = 25 °C'
    ], PURPLE)
  );

  // ================================================================
  // 8 — I = (12, 30)
  // ================================================================

  await until(S(8));
  await play(
    ...revealReading('I'),

    ...say('I: VIBRATION 12 · TEMPERATURE 30', PURPLE),

    ...fbox([
      ['New reading I', PURPLE],
      'Vibration = 12 mm/s',
      'Temperature = 30 °C'
    ], PURPLE)
  );

  // ================================================================
  // 9 — WHICH READING DESERVES ATTENTION FIRST?
  // ================================================================

  await until(S(9));
  await play(
    ...selectReadings(
      QUERY_IDS
    ),

    ...say('WHICH READING SHOULD WE EXAMINE FIRST?', C.amber),

    ...fbox([
      'G = (5, 22)',
      'H = (10, 25)',
      'I = (12, 30)',
      ['Which seems easiest to separate?', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 10 — IMAGINE PEOPLE IN A ROOM
  // ================================================================

  await until(S(10));
  await play(
    ...clearPlot(),

    ...replaceLayer(
      'room',
      makeRoom()
    ),

    ...say('IMAGINE PEOPLE IN A ROOM'),

    ...fbox([
      'Some people stand in a crowd',
      'Someone else stands apart',
      ['Separate them using walls', C.cyan]
    ])
  );

  // ================================================================
  // 11 — THE CORNER PERSON NEEDS ONLY ONE WALL
  // ================================================================

  await until(S(11));

  const wall1 = cornerWall();

  layers.cornerWall = wall1;

  await play(
    new M.Create(wall1),

    ...say('ONE WALL CAN ISOLATE A CORNER PERSON', C.amber),

    ...fbox([
      'The person near the corner',
      'Is already far from the crowd',
      ['One cut is enough', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 12 — A PERSON INSIDE THE CROWD NEEDS MORE WALLS
  //
  // Each wall cuts only the remaining relevant room region.
  // ================================================================

  await until(S(12));

  const extraWalls =
    crowdWalls();

  extraWalls.forEach((obj, i) => {
    layers[`crowd-wall-${i}`] = obj;
  });

  await play(
    lag(
      extraWalls.map(
        wall => new M.Create(wall)
      ),

      1.8,
      0.35
    ),

    ...say('INSIDE A CROWD, MORE CUTS ARE NEEDED'),

    ...fbox([
      'Crowded surroundings',
      'Keep dividing the remaining group',
      ['Several cuts before isolation', C.cyan]
    ])
  );

  // ================================================================
  // 13 — APPLY THE SAME IDEA TO THE MACHINE READINGS
  // ================================================================

  await until(S(13));
  await play(
    ...clearLayers(
      'room',
      'cornerWall',
      'crowd-wall-0',
      'crowd-wall-1',
      'crowd-wall-2',
      'crowd-wall-3'
    ),

    ...showPlot(),

    ...say('SEPARATE READINGS WITH DIVIDING LINES'),

    ...fbox([
      ['Vertical cut: vibration', C.cyan],
      ['Horizontal cut: temperature', C.cyan],
      'Divide the remaining readings'
    ])
  );

  // ================================================================
  // 14 — CHOOSE A MEASUREMENT AND A RANDOM DIVIDING POINT
  //
  // Preview the first supplied tree's valid temperature split.
  //
  // The remaining temperatures range from 20 to 30.
  // Temperature 27 lies inside that range.
  // ================================================================

  await until(S(14));
  await play(
    ...replaceLayer(
      'range',

      makeRangeGuide(
        DATA,
        'y'
      )
    ),

    ...say('CHOOSE A MEASUREMENT, THEN A POINT IN ITS RANGE'),

    ...fbox([
      'Choose one measurement at random',
      'Find its remaining min and max',
      ['Example: temperature 20–30', C.amber],
      'Choose a split within that range'
    ])
  );

  // ================================================================
  // 15 — ONE CUT DIVIDES A GROUP INTO TWO SMALLER GROUPS
  // ================================================================

  await until(S(15));
  await play(
    ...clearLayers('range'),

    ...addCut(
      TREE1,
      '',
      C.cyan
    ),

    ...say('ONE CUT → TWO SMALLER GROUPS'),

    ...fbox([
      'Example temperature split: 27',
      'One group below 27',
      'One group at or above 27',
      ['Continue with each non-singleton group', C.cyan]
    ])
  );

  // ================================================================
  // 16 — CONTINUE UNTIL EVERY READING STANDS ALONE
  //
  // Preview the complete first demonstration partition.
  // The detailed counted walkthrough begins at beat 20.
  // ================================================================

  await until(S(16));
  await play(
    ...addCuts(
      TREE1,

      [
        'L',
        'LL',
        'LLL',
        'LLLL',
        'LLLR',
        'LLR',
        'LLRR'
      ],

      2.15
    ),

    ...say('KEEP CUTTING UNTIL EACH READING IS ALONE'),

    ...fbox([
      'Split every remaining group',
      'Stop when a group has one reading',
      ['Nine readings → nine singleton leaves', C.cyan]
    ])
  );

  // ================================================================
  // 17 — NAME ISOLATION
  // ================================================================

  await until(S(17));
  await play(
    ...selectReadings(
      ['I']
    ),

    ...say('SEPARATING ONE READING = ISOLATION'),

    ...fbox([
      ['Isolation', C.cyan],
      'A reading stands alone',
      'No other reading in its group'
    ])
  );

  // ================================================================
  // 18 — SUCCESSIVE CUTS FORM AN UPSIDE-DOWN TREE
  //
  // Display the actual tree corresponding to the preview.
  // Suppress path-length labels until they are introduced.
  // ================================================================

  await until(S(18));
  await play(
    ...showTree(
      TREE1,
      null,
      'Successive cuts become branches',
      false
    ),

    ...say('DRAW THE CUTS AS BRANCHES'),

    ...fbox([
      'Start with all nine readings',
      'Each cut creates two branches',
      'Every final leaf contains one reading',
      ['Left: <     Right: ≥', C.muted]
    ])
  );

  // ================================================================
  // 19 — NAME THE ISOLATION TREE
  // ================================================================

  await until(S(19));
  await play(
    new M.Indicate(
      layers.tree,
      { color: C.cyan }
    ),

    ...say('THIS IS AN ISOLATION TREE'),

    ...fbox([
      ['Isolation tree', C.cyan],
      'A tree of successive random cuts',
      'Continue until readings stand alone'
    ])
  );

  // ================================================================
  // 20 — TREE 1: HORIZONTAL CUT AT TEMPERATURE 27
  //
  // Root split:
  // y < 27: A, B, C, D, E, F, G, H.
  // y >= 27: I.
  // ================================================================

  await until(S(20));
  await play(
    ...resetScatterplot(),

    ...addCut(
      TREE1,
      '',
      C.cyan
    ),

    ...status('Tree 1 · Cut 1'),

    ...say('TREE 1: TEMPERATURE CUT AT 27'),

    ...fbox([
      ['First cut: temperature 27', C.cyan],
      'Below: A, B, C, D, E, F, G, H',
      ['Above: I', PURPLE]
    ])
  );

  // ================================================================
  // 21 — I IS ISOLATED AFTER ONE CUT
  // ================================================================

  await until(S(21));
  await play(
    ...highlightLeafRegion(
      TREE1,
      'I'
    ),

    ...selectReadings(['I']),

    ...say('I STANDS ALONE AFTER JUST ONE CUT', PURPLE),

    ...fbox([
      'I = (12, 30)',
      'Temperature is above 27',
      ['I is the only reading in that branch', PURPLE],
      ['Cuts needed = 1', C.cyan]
    ])
  );

  // ================================================================
  // 22 — TREE 1: VERTICAL CUT AT VIBRATION 9
  //
  // Only cut the group below temperature 27.
  // The line must not extend into I's already isolated region.
  // ================================================================

  await until(S(22));
  await play(
    ...clearLayers(
      'selection',
      'region'
    ),

    ...addCut(
      TREE1,
      'L',
      C.cyan
    ),

    ...status('Tree 1 · Cut 2'),

    ...say('CUT THE REMAINING GROUP AT VIBRATION 9'),

    ...fbox([
      'Continue below temperature 27',
      ['Vertical cut: vibration 9', C.cyan],
      'Left: A, B, C, D, E, F, G',
      ['Right: H', PURPLE]
    ])
  );

  // ================================================================
  // 23 — H IS ISOLATED AFTER TWO CUTS
  // ================================================================

  await until(S(23));
  await play(
    ...highlightLeafRegion(
      TREE1,
      'H'
    ),

    ...selectReadings(['H']),

    ...say('H STANDS ALONE AFTER TWO CUTS', PURPLE),

    ...fbox([
      'H = (10, 25)',
      '1. Temperature 27',
      '2. Vibration 9',
      ['Cuts needed = 2', C.cyan]
    ])
  );

  // ================================================================
  // 24 — FOLLOW G'S BRANCH THROUGH THREE MORE CUTS
  //
  // Third cut: vibration 5.5.
  // Fourth cut: vibration 3.5.
  // Fifth cut: vibration 4.5.
  //
  // Every line is drawn only inside G's remaining region.
  // ================================================================

  await until(S(24));
  await play(
    ...clearLayers(
      'selection',
      'region'
    ),

    ...addCut(
      TREE1,
      'LL',
      C.cyan,
      0.75
    ),

    ...selectReadings(['G']),

    ...status('Tree 1 · G follows cut 3'),

    ...say('FOLLOW THE BRANCH CONTAINING G'),

    ...fbox([
      'G has already passed two cuts',
      ['Cut 3: vibration 5.5', C.cyan],
      'Remaining group: A, B, C, G'
    ])
  );

  await play(
    ...addCut(
      TREE1,
      'LLL',
      C.cyan,
      0.65
    ),

    ...status('Tree 1 · G follows cut 4'),

    ...fbox([
      'Remaining group: A, B, C, G',
      ['Cut 4: vibration 3.5', C.cyan],
      'G stays with C'
    ])
  );

  await play(
    ...addCut(
      TREE1,
      'LLLR',
      C.cyan,
      0.65
    ),

    ...highlightLeafRegion(
      TREE1,
      'G'
    ),

    ...status('Tree 1 · G follows cut 5'),

    ...fbox([
      'Remaining group: C, G',
      ['Cut 5: vibration 4.5', C.cyan],
      ['G is now alone', PURPLE]
    ])
  );

  // ================================================================
  // 25 — G NEEDS FIVE CUTS ALTOGETHER
  //
  // Finish the remaining branches of the first tree.
  //
  // A and B split at 2.5.
  // D separates at 6.5.
  // E and F split at 7.5.
  // ================================================================

  await until(S(25));
  await play(
    ...clearLayers('region'),

    ...addCuts(
      TREE1,

      [
        'LLLL',
        'LLR',
        'LLRR'
      ],

      0.9,
      C.muted
    ),

    ...say('G NEEDS FIVE CUTS ALTOGETHER', PURPLE),

    ...fbox([
      'G follows five successive cuts',
      ['I: 1 · H: 2 · G: 5', PURPLE],
      ['Grey lines: other branches', C.muted]
    ])
  );

  // ================================================================
  // 26 — DEFINE PATH LENGTH
  //
  // Highlight G's actual root-to-leaf path in tree 1.
  // ================================================================

  await until(S(26));
  await play(
    ...showTree(
      TREE1,
      'G'
    ),

    ...status('Tree 1 · 9 isolated leaves'),

    ...say('NUMBER OF CUTS = PATH LENGTH'),

    ...fbox([
      ['Path length', C.cyan],
      'Count cuts from root to leaf',
      ['G’s path length = 5', PURPLE],
      'Left: <     Right: ≥'
    ])
  );

  // ================================================================
  // 27 — DIFFERENT RANDOM CUTS MAY GIVE DIFFERENT LENGTHS
  // ================================================================

  await until(S(27));
  await play(
    ...replaceLayer(
      'tree',

      makeTreeDiagram(
        TREE1,

        {
          selected: 'I',
          title:
            'A different path through tree 1'
        }
      )
    ),

    ...say('DIFFERENT CUTS CAN GIVE DIFFERENT PATH LENGTHS', C.amber),

    ...fbox([
      'One tree is one random example',
      'Another valid set of cuts',
      ['May isolate readings in a different order', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 28 — RESET TO ALL NINE READINGS FOR TREE 2
  // ================================================================

  await until(S(28));
  await play(
    ...resetScatterplot(),

    ...status('Tree 2 · Start with all 9'),

    ...say('BUILD A SECOND ISOLATION TREE'),

    ...fbox([
      'Start again with all nine readings',
      'Same vibration and temperature values',
      ['Choose different cuts', C.cyan]
    ])
  );

  // ================================================================
  // 29 — TREE 2: VERTICAL CUT AT VIBRATION 9
  // ================================================================

  await until(S(29));
  await play(
    ...addCut(
      TREE2,
      '',
      C.cyan
    ),

    ...status('Tree 2 · Cut 1'),

    ...say('TREE 2: FIRST CUT AT VIBRATION 9'),

    ...fbox([
      ['First cut: vibration 9', C.cyan],
      'Left: A, B, C, D, E, F, G',
      ['Right: H and I', PURPLE]
    ])
  );

  // ================================================================
  // 30 — CUT THE RIGHT GROUP AT TEMPERATURE 27
  //
  // The horizontal line begins at vibration 9.
  // It divides only H and I.
  // ================================================================

  await until(S(30));
  await play(
    ...addCut(
      TREE2,
      'R',
      C.cyan
    ),

    ...selectReadings(
      ['H', 'I']
    ),

    ...status('Tree 2 · Right branch'),

    ...say('CUT THE RIGHT GROUP AT TEMPERATURE 27'),

    ...fbox([
      'Remaining right group: H, I',
      ['Horizontal cut: temperature 27', C.cyan],
      'H is below the line',
      'I is above the line'
    ])
  );

  // ================================================================
  // 31 — H AND I BOTH HAVE PATH LENGTH TWO
  // ================================================================

  await until(S(31));
  await play(
    new M.Indicate(
      layers.selection,
      { color: C.amber }
    ),

    ...say('H AND I BOTH NEED TWO CUTS', PURPLE),

    ...fbox([
      ['H: path length = 2', PURPLE],
      ['I: path length = 2', PURPLE],
      'Both passed the same two splits'
    ])
  );

  // ================================================================
  // 32 — COMPLETE TREE 2; G AGAIN NEEDS FIVE CUTS
  //
  // Remaining left branch:
  // temperature 21.5;
  // vibration 2.5;
  // vibration 6.5;
  // vibration 7.5;
  // vibration 4.5;
  // vibration 5.5.
  //
  // Exact paths:
  // A, B, C, D, E, F, G, H, I
  // 3, 3, 4, 5, 4, 4, 5, 2, 2.
  // ================================================================

  await until(S(32));
  await play(
    ...clearLayers('selection'),

    ...addCuts(
      TREE2,

      [
        'L',
        'LL',
        'LR',
        'LRR',
        'LRL',
        'LRLR'
      ],

      1.50
    ),

    ...say('G AGAIN NEEDS FIVE CUTS', PURPLE),

    ...fbox([
      'Complete the remaining left branches',
      ['G’s path: 9 → 21.5 → 6.5 → 4.5 → 5.5', PURPLE],
      'Path length = 5'
    ])
  );

  await play(
    ...showTree(
      TREE2,
      'G'
    ),

    ...status('Tree 2 · G 5 · H 2 · I 2')
  );

  // ================================================================
  // 33 — TREE 3: FIRST CUT AT VIBRATION 7.5
  // ================================================================

  await until(S(33));
  await play(
    ...resetScatterplot(),

    ...addCut(
      TREE3,
      '',
      C.cyan
    ),

    ...status('Tree 3 · Cut 1'),

    ...say('TREE 3: FIRST CUT AT VIBRATION 7.5'),

    ...fbox([
      ['First cut: vibration 7.5', C.cyan],
      'Left: A, B, C, D, E, G',
      'Right: F, H, I'
    ])
  );

  // ================================================================
  // 34 — TEMPERATURE 27 ISOLATES I AFTER TWO CUTS
  // ================================================================

  await until(S(34));
  await play(
    ...addCut(
      TREE3,
      'R',
      C.cyan
    ),

    ...highlightLeafRegion(
      TREE3,
      'I'
    ),

    ...selectReadings(
      ['I']
    ),

    ...status('Tree 3 · I isolated'),

    ...say('I IS ISOLATED AFTER TWO CUTS', PURPLE),

    ...fbox([
      'First: vibration 7.5',
      'Second: temperature 27',
      'I stands alone above 27',
      ['I’s path length = 2', PURPLE]
    ])
  );

  // ================================================================
  // 35 — VIBRATION 9 ISOLATES H AFTER THREE CUTS
  //
  // Cut only the right-hand group below temperature 27.
  // That group contains F and H.
  // ================================================================

  await until(S(35));
  await play(
    ...clearLayers(
      'selection',
      'region'
    ),

    ...addCut(
      TREE3,
      'RL',
      C.cyan
    ),

    ...highlightLeafRegion(
      TREE3,
      'H'
    ),

    ...selectReadings(
      ['H']
    ),

    ...status('Tree 3 · H isolated'),

    ...say('H IS ISOLATED AFTER THREE CUTS', PURPLE),

    ...fbox([
      'Remaining right group: F and H',
      ['Third cut: vibration 9', C.cyan],
      'F separates from H',
      ['H’s path length = 3', PURPLE]
    ])
  );

  // ================================================================
  // 36 — G NEEDS FOUR CUTS IN TREE 3
  //
  // Left branch:
  // temperature 21.5;
  // vibration 2.5;
  // vibration 5.5;
  // vibration 4.5;
  // vibration 6.5.
  //
  // G's actual path:
  // 7.5 → 21.5 → 5.5 → 4.5.
  // ================================================================

  await until(S(36));
  await play(
    ...clearLayers(
      'selection',
      'region'
    ),

    ...addCuts(
      TREE3,

      [
        'L',
        'LL',
        'LR',
        'LRL',
        'LRR'
      ],

      1.35
    ),

    ...selectReadings(['G']),

    ...say('THIS TIME G NEEDS FOUR CUTS', PURPLE),

    ...fbox([
      'G’s branch:',
      '7.5 → 21.5 → 5.5 → 4.5',
      ['Path length = 4', PURPLE]
    ])
  );

  await play(
    ...showTree(
      TREE3,
      'G'
    ),

    ...status('Tree 3 · G 4 · H 3 · I 2')
  );

  // ================================================================
  // 37 — TOGETHER THE TREES FORM AN ISOLATION FOREST
  // ================================================================

  await until(S(37));
  await play(
    ...clearLayers('tree'),

    ...replaceLayer(
      'forest',
      makeForestPicture()
    ),

    ...status('3 different isolation trees'),

    ...say('MANY ISOLATION TREES FORM AN ISOLATION FOREST'),

    ...fbox([
      ['Isolation forest', C.cyan],
      'A collection of randomly built trees',
      'Compare repeated isolation behavior'
    ])
  );

  // ================================================================
  // 38 — FIND MEAN PATH LENGTHS ACROSS THE THREE TREES
  //
  // Display all nine readings, not only G, H and I.
  // ================================================================

  await until(S(38));
  await play(
    ...showTable({
      all: true,
      showMean: true
    }),

    ...say('FIND THE MEAN PATH LENGTH OF EACH READING'),

    ...fbox([
      'Add each reading’s three path lengths',
      'Divide by the number of trees',
      ['Mean = total cuts ÷ 3', C.cyan]
    ])
  );

  // ================================================================
  // 39 — I: ADD ONE, TWO AND TWO, THEN DIVIDE BY THREE
  // ================================================================

  await until(S(39));
  await play(
    ...showTable({
      active: 'I',
      showMean: false
    }),

    ...say('I: ADD 1 + 2 + 2, THEN DIVIDE BY 3'),

    ...fbox([
      ['Reading I at vibration 12', PURPLE],
      'Tree lengths: 1, 2, 2',
      'Mean = (1 + 2 + 2) ÷ 3',
      '= 5 ÷ 3'
    ])
  );

  // ================================================================
  // 40 — I'S MEAN PATH LENGTH IS ABOUT 1.67
  // ================================================================

  await until(S(40));
  await play(
    ...showTable({
      active: 'I',
      showMean: true
    }),

    ...say('I: MEAN PATH LENGTH ≈ 1.67', PURPLE),

    ...fbox([
      'Mean = 5 ÷ 3',
      [
        `= ${fmt(I.pathMean, 4)}`,
        C.cyan
      ],
      ['Approximately 1.67 cuts', PURPLE]
    ])
  );

  // ================================================================
  // 41 — H'S MEAN PATH LENGTH IS ABOUT 2.33
  // ================================================================

  await until(S(41));
  await play(
    ...showTable({
      active: 'H',
      showMean: true
    }),

    ...say('H: MEAN PATH LENGTH ≈ 2.33', PURPLE),

    ...fbox([
      ['Reading H at vibration 10', PURPLE],
      'Mean = (2 + 2 + 3) ÷ 3',
      '= 7 ÷ 3',
      [
        `≈ ${fmt(H.pathMean, 2)}`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 42 — G'S MEAN PATH LENGTH IS ABOUT 4.67
  // ================================================================

  await until(S(42));
  await play(
    ...clearLayers('table'),

    ...replaceLayer(
      'summary',
      makeMeanBars('G')
    ),

    ...say('G: LONGER MEAN PATH LENGTH ≈ 4.67', PURPLE),

    ...fbox([
      ['Reading G at vibration 5', PURPLE],
      'Mean = (5 + 5 + 4) ÷ 3',
      '= 14 ÷ 3',
      [
        `≈ ${fmt(G.pathMean, 2)}`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 43 — CONVERT PATH LENGTHS INTO ANOMALY SCORES
  //
  // Introduce the decreasing score transformation.
  // All resulting scores lie between zero and one.
  // ================================================================

  await until(S(43));
  await play(
    ...clearLayers('summary'),

    ...replaceLayer(
      'score',
      makeScoreCurve(false)
    ),

    ...say('TURN PATH LENGTHS INTO ANOMALY SCORES'),

    ...fbox([
      ['Anomaly score', C.cyan],
      'A number between 0 and 1',
      'Shorter mean path',
      'Produces a higher score'
    ])
  );

  // ================================================================
  // 44 — COMPARE THE MEAN PATH WITH A REFERENCE LENGTH
  //
  // The reference length depends on the number of readings
  // used to construct each tree.
  //
  // All three demonstration trees contain nine readings.
  // ================================================================

  await until(S(44));
  await play(
    ...say('COMPARE WITH A REFERENCE LENGTH'),

    ...fbox([
      'Mean path length = observed average',
      'Reference length = based on tree size',
      ['Every tree uses nine readings', C.cyan]
    ])
  );

  // ================================================================
  // 45 — REFERENCE LENGTH FOR NINE READINGS ≈ 3.66
  //
  // Exact harmonic-sum formula:
  //
  // c(9) = 2 H(8) - 16/9
  //      = 3.6579365079...
  // ================================================================

  await until(S(45));
  await play(
    ...status(
      `Reference length ≈ ${fmt(REF, 2)}`,
      C.amber
    ),

    ...say('9 READINGS · REFERENCE LENGTH ≈ 3.66', C.amber),

    ...fbox([
      'Number of readings = 9',
      'Reference length = c(9)',
      [
        `c(9) ≈ ${fmt(REF, 5)}`,
        C.amber
      ],
      'Use the unrounded value'
    ], C.amber)
  );

  // ================================================================
  // 46 — GENERAL ANOMALY SCORE FORMULA
  //
  // score = 2 ^ (-mean path length / reference length)
  //
  // Keep the negative sign visible.
  //
  // Smaller mean length produces a less-negative exponent,
  // and therefore a larger anomaly score.
  // ================================================================

  await until(S(46));
  await play(
    ...replaceLayer(
      'score',
      makeScoreCurve(true)
    ),

    ...say('SCORE = 2 RAISED TO A NEGATIVE RATIO'),

    ...fbox([
      ['Anomaly score =', C.cyan],
      '2 ^ (−mean path / reference length)',
      'Example for I:',
      `2 ^ (−${fmt(I.pathMean, 4)} / ${fmt(REF, 5)})`
    ])
  );

  // ================================================================
  // 47 — CALCULATE THE THREE CHECKED ANOMALY SCORES
  //
  // I = approximately 0.729.
  // H = approximately 0.643.
  // G = approximately 0.413.
  //
  // All results are calculated before rounding.
  // ================================================================

  await until(S(47));
  await play(
    ...replaceLayer(
      'score',

      makeScoreBars(
        CHECKED,
        'I'
      )
    ),

    ...status(
      'Shorter mean path → higher score',
      C.cyan
    ),

    ...say('I ≈ 0.73 · H ≈ 0.64 · G ≈ 0.41'),

    ...fbox([
      [
        `I: ${fmt(I.pathMean, 2)} → ${fmt(I.score, 3)}`,
        PURPLE
      ],

      [
        `H: ${fmt(H.pathMean, 2)} → ${fmt(H.score, 3)}`,
        PURPLE
      ],

      [
        `G: ${fmt(G.pathMean, 2)} → ${fmt(G.score, 3)}`,
        PURPLE
      ],

      ['I is easiest to isolate here', C.amber]
    ])
  );

  // ================================================================
  // 48 — FIND UNUSUAL READINGS USING SEVERAL MEASUREMENTS
  //
  // Return to the actual two-dimensional data.
  // Show that the method used vibration and temperature,
  // not examples labeled as confirmed faults.
  // ================================================================

  await until(S(48));
  await play(
    ...resetScatterplot(),

    ...selectReadings(
      ['I']
    ),

    ...status(
      `I · anomaly score ${fmt(I.score, 3)}`,
      PURPLE
    ),

    ...say('USE SEVERAL MEASUREMENTS WITHOUT KNOWN FAULT LABELS'),

    ...fbox([
      'Use vibration and temperature',
      'Look for repeatedly short paths',
      'No known-fault examples required',
      ['Prioritize unusual readings', C.cyan]
    ])
  );

  // ================================================================
  // 49 — HIGH SCORE DOES NOT PROVE A MACHINE FAULT
  //
  // Retain the purple marker and amber investigation outline.
  // Do not introduce a confirmed-fault label.
  // ================================================================

  await until(S(49));
  await play(
    new M.Indicate(
      layers.selection,
      { color: C.amber }
    ),

    ...say('HIGH ANOMALY SCORE DOES NOT PROVE A FAULT', C.amber),

    ...fbox([
      [
        `I’s anomaly score ≈ ${fmt(I.score, 3)}`,
        PURPLE
      ],
      'Easy to isolate',
      'May deserve investigation',
      ['Not a confirmed machine fault', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 50 — REAL FORESTS USE MANY MORE TREES
  //
  // Show the computed history as additional random
  // trees are included.
  //
  // The curves may move up or down.
  // More trees generally reduce random variability;
  // they do not guarantee monotonic scores.
  // ================================================================

  await until(S(50));
  await play(
    ...showHistory(
      3,
      { title: 'First three trees' }
    ),

    ...status(
      'Small forest · More random variability',
      C.amber
    ),

    ...say('REAL FORESTS USE MANY MORE TREES'),

    ...fbox([
      'Three trees are enough to explain',
      'The isolation-forest idea',
      ['More trees usually improve stability', C.cyan]
    ])
  );

  await play(
    ...showHistory(
      30,
      { title: 'Now using 30 trees' }
    ),

    ...historyFormula(30)
  );

  // ================================================================
  // 51 — TRY IT: STEP, PLAY, PAUSE AND SPEED
  //
  // Reset the illustrative run.
  // Step builds one complete tree.
  // Play advances the tree counter.
  // Pause leaves the current forest unchanged.
  // ================================================================

  await until(S(51));
  await play(
    ...clearLayers('status'),

    ...showTree(
      TREE1,
      'I',
      'Step: build one complete tree'
    ),

    ...controls(
      'Stepped',
      1,
      1
    ),

    ...say('TRY IT: STEP · PLAY · PAUSE · SPEED'),

    ...fbox([
      'Step: build one tree',
      'Play: build trees repeatedly',
      'Pause: keep the current forest',
      'Speed: adjust animation speed'
    ])
  );

  await play(
    ...showHistory(3),

    ...controls(
      'Playing',
      3,
      1
    ),

    ...historyFormula(3)
  );

  await play(
    ...showHistory(10),

    ...controls(
      'Paused',
      10,
      2
    ),

    ...historyFormula(10)
  );

  // ================================================================
  // 52 — WATCH THE COUNTER, PATHS, MEANS AND SCORE CURVES
  //
  // The top curve shows running mean path length.
  // The bottom curve shows running anomaly score.
  //
  // The latest individual tree paths are shown below.
  // All three values are recalculated as trees are added.
  // ================================================================

  await until(S(52));
  await play(
    ...showHistory(15),

    ...controls(
      'Playing',
      15,
      2
    ),

    ...say('WATCH THE PATH LENGTHS AND SCORES UPDATE'),

    ...historyFormula(15)
  );

  await play(
    ...showHistory(50),

    ...controls(
      'Playing faster',
      50,
      4
    ),

    ...historyFormula(50)
  );

  await play(
    ...showHistory(75),

    ...controls(
      'Paused',
      75,
      4
    ),

    ...historyFormula(75)
  );

  // ================================================================
  // 53 — PREDICT, COMPARE THREE WITH ONE HUNDRED, THEN RESET
  //
  // First remind the learner of the three-tree result.
  //
  // Then display the actual seeded 100-tree run.
  //
  // A comparison table shows the real changes.
  // Do not force the 100-tree scores to match the three-tree
  // scores or to change monotonically.
  //
  // Finally illustrate Reset and New data.
  // The chapter's official nine readings remain unchanged.
  // ================================================================

  await until(S(53));
  await play(
    ...clearLayers('control'),

    ...showHistory(
      100,
      { title: '100 completed trees' }
    ),

    ...say('PREDICT AND COMPARE 3 TREES WITH 100', C.amber),

    ...fbox([
      'Prediction from the first three trees:',
      ['I is easiest to isolate', PURPLE],
      'Compare with a larger forest',
      ['The exact values may change', C.amber]
    ], C.amber)
  );

  await play(
    ...clearLayers('chart'),

    ...replaceLayer(
      'summary',
      makeForestComparison()
    ),

    ...fbox([
      'One seeded 100-tree example',
      [
        `G: ${fmt(FINAL_100.values.G.score, 3)}`,
        SERIES.G
      ],

      [
        `H: ${fmt(FINAL_100.values.H.score, 3)}`,
        SERIES.H
      ],

      [
        `I: ${fmt(FINAL_100.values.I.score, 3)}`,
        SERIES.I
      ],

      'Scores need not always rise or fall'
    ])
  );

  await play(
    ...resetScatterplot(),

    ...replaceLayer(
      'control',

      new M.VGroup(
        fittedPill(
          'Reset',

          C.cyan,
          P ? 17 : 16,

          point(
            CONTROL_POS[0] - 0.91,
            CONTROL_POS[1]
          ),

          1.60
        ),

        fittedPill(
          'New data',

          PURPLE,
          P ? 17 : 16,

          point(
            CONTROL_POS[0] + 0.91,
            CONTROL_POS[1]
          ),

          1.72
        )
      )
    ),

    ...fbox([
      'Reset: start a new forest',
      ['New data: explore another dataset', PURPLE],
      'Predict which readings isolate first'
    ])
  );

  // ================================================================
  // 54 — FINAL TAKEAWAY
  //
  // Restore the exact checked three-tree example.
  //
  // G:
  //   paths 5, 5, 4
  //   mean 4.6667
  //   score approximately 0.413
  //
  // H:
  //   paths 2, 2, 3
  //   mean 2.3333
  //   score approximately 0.643
  //
  // I:
  //   paths 1, 2, 2
  //   mean 1.6667
  //   score approximately 0.729
  //
  // These are the scores carried forward into
  // lesson 14.2.8 on anomaly thresholds.
  //
  // No confirmed fault labels are introduced.
  // ================================================================

  await until(S(54));
  await play(
    ...clearLayers(
      'control',
      'status'
    ),

    ...clearCuts(),
    ...clearPlot(),

    ...showTable({
      all: false,
      active: 'I',
      showMean: true,
      showScores: true
    }),

    ...status(
      'Checked three-tree results',
      C.cyan
    ),

    ...say('FEWER RANDOM CUTS → EASIER ISOLATION'),

    ...fbox([
      ['Isolation forest', C.cyan],
      'Build many random isolation trees',
      'Average each reading’s path length',
      'Shorter paths give higher scores',
      ['Unusual does not mean faulty', C.amber]
    ])
  );
}

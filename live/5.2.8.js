// lesson 5.2.8
// Lognormal measurements — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API.
// Illustrative examples are distinguished from measured factory records.
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

  const MAXW = P ? FW - 1.2 : 6.0;

  const MEDIAN = 100;
  const FACTOR = 2;
  const MU = Math.log(MEDIAN);
  const SIGMA = Math.log(FACTOR);

  const MEAN = Math.exp(
    MU + SIGMA * SIGMA / 2
  );

  const MODE = Math.exp(
    MU - SIGMA * SIGMA
  );

  const pt = (x, y) => [x, y, 0];

  // ------------------------------------------------------------
  // Shared drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, x, y,
    size = 20,
    color = C.ink,
    mono = false
  ) {
    const t = T(s, P && size < 18 ? 18 : size, color, mono);

    t.moveTo(pt(x, y));

    return t;
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

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
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

  function glow(
    x, y,
    radius = 0.1,
    color = C.cyan
  ) {
    return new M.VGroup(
      dot(x, y, radius * 2.1, color, 0.16),
      dot(x, y, radius, color)
    );
  }

  function tag(
    s, x, y,
    color = C.cyan,
    size = 17,
    maxw = MAXW
  ) {
    const p = pill(s, color, size);

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo(pt(x, y));

    return p;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.amber,
    sw = 3
  ) {
    const a = Math.atan2(
      y2 - y1,
      x2 - x1
    );

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

  function cross(
    x, y,
    size = 0.13,
    color = C.amber
  ) {
    return new M.VGroup(
      line(
        x - size, y - size,
        x + size, y + size,
        color, 3
      ),
      line(
        x - size, y + size,
        x + size, y - size,
        color, 3
      )
    );
  }

  function bracket(
    x1, x2, y,
    label,
    color = C.amber,
    above = false
  ) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 2),

      line(
        x1, y - 0.08,
        x1, y + 0.08,
        color, 2
      ),

      line(
        x2, y - 0.08,
        x2, y + 0.08,
        color, 2
      ),

      txt(
        label,
        (x1 + x2) / 2,
        y + (above ? 0.25 : -0.27),
        17, color
      )
    );
  }

  function numberCard(
    value, unit,
    x, y,
    color = C.cyan,
    width = 1.55
  ) {
    return new M.VGroup(
      rounded(
        x, y,
        width, 0.91,
        color, 0.19
      ),

      txt(
        String(value),
        x, y + 0.10,
        27, color, true
      ),

      txt(
        unit,
        x, y - 0.25,
        16, color
      )
    );
  }

  // ------------------------------------------------------------
  // Formula box — same styling and placement as the reference
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    if (!lines) {
      const a = boxNow
        ? [new M.FadeOut(boxNow)]
        : [];

      boxNow = null;

      return a;
    }

    const size = P ? 22 : 21;
    const lh = P ? 0.38 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true
      ).getWidth() / 10;

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

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 - 0.18 - lh / 2;

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

  // ------------------------------------------------------------
  // Picture management
  // Never wrap objects that are already on screen in new groups.
  // ------------------------------------------------------------

  let picture = [];
  let overlays = [];

  function clearOverlays() {
    const a = overlays.map(
      o => new M.FadeOut(o)
    );

    overlays = [];

    return a;
  }

  function clearPicture() {
    const a = [
      ...clearOverlays(),
      ...picture.map(
        o => new M.FadeOut(o)
      )
    ];

    picture = [];

    return a;
  }

  function replacePicture(...objects) {
    const a = clearPicture();

    picture = objects;

    return [
      ...a,
      ...objects.map(
        o => new M.FadeIn(o)
      )
    ];
  }

  function replaceOverlay(...objects) {
    const a = clearOverlays();

    overlays = objects;

    return [
      ...a,
      ...objects.map(
        o => new M.FadeIn(o)
      )
    ];
  }

  // ------------------------------------------------------------
  // Packaging line: conveyor belts and rice bags
  // ------------------------------------------------------------

  function riceBag(
    x, y,
    color = C.cyan,
    scale = 1
  ) {
    const w = 0.68 * scale;
    const h = 0.85 * scale;

    return new M.VGroup(
      rounded(
        x, y,
        w, h,
        color, 0.12
      ),

      line(
        x - w * 0.40,
        y + h * 0.34,
        x + w * 0.40,
        y + h * 0.34,
        C.green, 3
      ),

      line(
        x - w * 0.40,
        y - h * 0.34,
        x + w * 0.40,
        y - h * 0.34,
        color, 2
      ),

      fitText(
        '500 g',
        x, y,
        17,
        C.ink,
        w * 0.82,
        true
      )
    );
  }

  function conveyor(
    x, y,
    worn = false
  ) {
    const color = worn
      ? C.amber
      : C.cyan;

    const outer = new M.RoundedRectangle({
      width: 5.55,
      height: 0.70,
      cornerRadius: 0.32,
      color,
      strokeWidth: 4
    });

    outer.setFill(color, 0.10);
    outer.moveTo(pt(x, y));

    const inner = new M.RoundedRectangle({
      width: 5.11,
      height: 0.32,
      cornerRadius: 0.15,
      color: C.muted,
      strokeWidth: 2
    });

    inner.setFill(C.card, 0.85);
    inner.moveTo(pt(x, y));

    const rollers = [-2.42, 2.42].map(dx => {
      const r = new M.Circle({
        radius: 0.18,
        color: C.muted,
        strokeWidth: 2
      });

      r.moveTo(pt(x + dx, y));

      return r;
    });

    const supports = [
      rect(
        x - 1.85, y - 0.70,
        0.17, 0.72,
        C.muted, 0.25
      ),

      rect(
        x + 1.85, y - 0.70,
        0.17, 0.72,
        C.muted, 0.25
      ),

      line(
        x - 2.13, y - 1.06,
        x - 1.56, y - 1.06,
        C.muted, 3
      ),

      line(
        x + 1.56, y - 1.06,
        x + 2.13, y - 1.06,
        C.muted, 3
      )
    ];

    const bags = [-1.74, 0, 1.74].map(dx =>
      riceBag(
        x + dx,
        y + 0.79
      )
    );

    const objects = [
      outer,
      inner,
      ...rollers,
      ...supports,
      ...bags
    ];

    if (worn) {
      objects.push(
        line(
          x - 0.34, y + 0.35,
          x - 0.14, y + 0.20,
          C.amber, 4
        ),

        line(
          x + 0.02, y + 0.35,
          x + 0.22, y + 0.20,
          C.amber, 4
        ),

        line(
          x + 0.38, y + 0.35,
          x + 0.58, y + 0.20,
          C.amber, 4
        ),

        cross(
          x + 0.15,
          y - 0.67,
          0.18,
          C.amber
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function beltLoop(
    x, y,
    color = C.cyan,
    scale = 1
  ) {
    const outer = new M.RoundedRectangle({
      width: 1.80 * scale,
      height: 0.91 * scale,
      cornerRadius: 0.40 * scale,
      color,
      strokeWidth: 3
    });

    outer.setFill(color, 0.20);
    outer.moveTo(pt(x, y));

    const inner = new M.RoundedRectangle({
      width: 1.40 * scale,
      height: 0.49 * scale,
      cornerRadius: 0.23 * scale,
      color: C.muted,
      strokeWidth: 1.5
    });

    inner.setFill(C.card, 1);
    inner.moveTo(pt(x, y));

    return new M.VGroup(
      outer,
      inner
    );
  }

  function packagingPicture(
    worn = false
  ) {
    const y = P ? -2.6 : -0.65;

    return new M.VGroup(
      conveyor(CX, y, worn),

      txt(
        'Rice packaging line',
        CX, y + 1.68,
        22, C.ink
      ),

      worn
        ? txt(
            'Worn belt — replace',
            CX, y - 1.47,
            19, C.amber
          )
        : arrow(
            CX - 1.90, y - 1.40,
            CX + 1.90, y - 1.40,
            C.cyan, 3
          )
    );
  }

  // ------------------------------------------------------------
  // 0 — conveyor belt: a long rubber loop
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...replacePicture(
      packagingPicture(false)
    ),
    ...say('THE PACKAGING LINE'),
    ...fbox([
      '500 g rice bags',
      'Conveyor belt',
      ['A long rubber loop', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 1 — belts wear out; plan spare stock
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...replacePicture(
      packagingPicture(true)
    ),
    ...say('BELTS WEAR OUT', C.amber),
    ...fbox([
      'Belts need replacing',
      ['How many spares?', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 2 — how long does a belt last?
  // ------------------------------------------------------------

  function stockPicture() {
    const y = P ? -2.6 : -0.50;

    const xs = [
      CX - 1.75,
      CX,
      CX + 1.75
    ];

    const objects = [
      txt(
        'Spare conveyor belts',
        CX, y + 1.34,
        22, C.ink
      )
    ];

    xs.forEach((x, i) => {
      const color = [
        C.cyan,
        C.green,
        C.violet
      ][i];

      objects.push(
        beltLoop(x, y, color, 0.88),

        txt(
          `Belt ${i + 1}`,
          x, y - 0.75,
          17, color
        )
      );
    });

    objects.push(
      tag(
        'HOW LONG WILL THEY LAST?',
        CX, y - 1.48,
        C.amber, 18
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(2));

  await play(
    ...replacePicture(stockPicture()),
    ...say('WHY DO A FEW LAST SO LONG?', C.amber),
    ...fbox([
      "Manager's questions",
      'How long is a belt life?',
      ['Why a few very long lives?', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Multiplicative shocks
  // ------------------------------------------------------------

  const SHOCK_Y = P ? -2.4 : -0.45;

  function startPicture(
    showValue = true
  ) {
    const y = SHOCK_Y;

    const objects = [
      beltLoop(
        CX,
        y + 0.60,
        C.cyan,
        1.25
      ),

      txt(
        'One conveyor belt',
        CX, y + 1.53,
        22, C.ink
      )
    ];

    if (showValue) {
      objects.push(
        numberCard(
          100,
          'days',
          CX, y - 0.78,
          C.cyan,
          2.10
        ),

        txt(
          'Starting lifetime',
          CX, y - 1.54,
          18, C.muted
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // 3 — build a small picture first

  await until(S(3));

  await play(
    ...replacePicture(
      startPicture(false)
    ),
    ...say('START WITH ONE BELT'),
    ...fbox(null)
  );

  // 4 — typical starting lifetime of one hundred days

  await until(S(4));

  await play(
    ...replacePicture(
      startPicture(true)
    ),
    ...say('STARTING LIFE: 100 DAYS'),
    ...fbox([
      'Starting lifetime',
      ['100 days', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 5 — life brings shocks that multiply the lifetime
  // ------------------------------------------------------------

  function shockExamples() {
    const y = P ? -2.4 : -0.40;

    const loadX = CX - 1.65;
    const heatX = CX + 1.65;

    const load = new M.VGroup(
      beltLoop(
        loadX,
        y - 0.36,
        C.cyan,
        1.05
      ),

      rect(
        loadX,
        y + 0.47,
        1.05, 0.80,
        C.amber, 0.28
      ),

      arrow(
        loadX,
        y + 1.15,
        loadX,
        y + 0.88,
        C.amber, 3
      ),

      txt(
        'Heavy load',
        loadX,
        y - 1.14,
        18, C.amber
      )
    );

    const sun = new M.Circle({
      radius: 0.29,
      color: C.amber,
      strokeWidth: 3
    });

    sun.setFill(C.amber, 0.27);
    sun.moveTo(pt(heatX, y + 0.60));

    const rays = Array.from(
      { length: 8 },
      (_, i) => {
        const a = i * Math.PI / 4;

        return line(
          heatX + 0.39 * Math.cos(a),
          y + 0.60 + 0.39 * Math.sin(a),
          heatX + 0.56 * Math.cos(a),
          y + 0.60 + 0.56 * Math.sin(a),
          C.amber, 3
        );
      }
    );

    const heat = new M.VGroup(
      beltLoop(
        heatX,
        y - 0.36,
        C.cyan,
        1.05
      ),

      sun,
      ...rays,

      txt(
        'Hot week',
        heatX,
        y - 1.14,
        18, C.amber
      )
    );

    return new M.VGroup(
      load,
      heat,

      txt(
        'Conditions affect belt life',
        CX,
        y + 1.48,
        21, C.ink
      ),

      tag(
        'MULTIPLY THE LIFETIME',
        CX,
        y - 1.78,
        C.violet,
        18
      )
    );
  }

  await until(S(5));

  await play(
    ...replacePicture(shockExamples()),
    ...say('EFFECTS MULTIPLY THE LIFE', C.violet),
    ...fbox([
      'Conditions change life',
      'Our simple model:',
      ['Multiply, not add', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 6 — good shock doubles; bad shock halves
  // ------------------------------------------------------------

  function oneShockPicture() {
    const yTop = P ? 0.55 : 0.80;
    const yBottom = P ? -2.30 : -1.35;

    const left = CX - 1.72;
    const right = CX + 1.72;

    return new M.VGroup(
      numberCard(
        100, 'days',
        CX, yTop,
        C.cyan
      ),

      arrow(
        CX - 0.40, yTop - 0.53,
        left + 0.26, yBottom + 0.53,
        C.green, 3
      ),

      arrow(
        CX + 0.40, yTop - 0.53,
        right - 0.26, yBottom + 0.53,
        C.amber, 3
      ),

      txt(
        '× 2',
        CX - 1.26,
        (yTop + yBottom) / 2 + 0.36,
        23, C.green, true
      ),

      txt(
        '÷ 2',
        CX + 1.26,
        (yTop + yBottom) / 2 + 0.36,
        23, C.amber, true
      ),

      txt(
        '50%',
        CX - 1.78,
        (yTop + yBottom) / 2 - 0.13,
        17, C.green, true
      ),

      txt(
        '50%',
        CX + 1.78,
        (yTop + yBottom) / 2 - 0.13,
        17, C.amber, true
      ),

      numberCard(
        200, 'days',
        left, yBottom,
        C.green
      ),

      numberCard(
        50, 'days',
        right, yBottom,
        C.amber
      ),

      txt(
        'Good shock',
        left, yBottom - 0.75,
        18, C.green
      ),

      txt(
        'Bad shock',
        right, yBottom - 0.75,
        18, C.amber
      )
    );
  }

  await until(S(6));

  await play(
    ...replacePicture(oneShockPicture()),
    ...say('GOOD: ×2     BAD: ÷2'),
    ...fbox([
      ['Good shock: × 2', C.green],
      ['Bad shock:  ÷ 2', C.amber],
      'Each has chance 1/2'
    ])
  );

  // ------------------------------------------------------------
  // 7–10 — two independent shocks
  //
  // Four equally likely paths:
  // good-good  -> 400
  // good-bad   -> 100
  // bad-good   -> 100
  // bad-bad    -> 25
  // ------------------------------------------------------------

  const TREE_Y0 = P ? 0.7 : 0.95;
  const TREE_Y1 = P ? -1.3 : -0.32;
  const TREE_Y2 = P ? -3.55 : -1.83;

  const TREE_X1 = [
    CX - 1.50,
    CX + 1.50
  ];

  const TREE_X2 = [
    CX - 2.25,
    CX - 0.75,
    CX + 0.75,
    CX + 2.25
  ];

  function treeNode(
    value,
    x, y,
    color,
    active = true,
    width = 1.13
  ) {
    const fill = active
      ? 0.24
      : 0.05;

    const c = active
      ? color
      : C.muted;

    return new M.VGroup(
      rounded(
        x, y,
        width,
        0.56,
        c, fill
      ),

      txt(
        String(value),
        x, y,
        22, c, true
      )
    );
  }

  function treeEdge(
    x1, y1, x2, y2,
    operation,
    color,
    active = true
  ) {
    const c = active
      ? color
      : C.muted;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return new M.VGroup(
      arrow(
        x1, y1 - 0.32,
        x2, y2 + 0.32,
        c,
        active ? 3 : 1.5
      ),

      txt(
        operation,
        mx + (x2 < x1 ? -0.24 : 0.24),
        my,
        16, c, true
      )
    );
  }

  function shockTree(stage = 0) {
    const activeGG = stage >= 1;
    const activeGB = stage >= 2;
    const activeBG = stage >= 2;
    const activeBB = stage >= 3;

    const all = [
      activeGG,
      activeGB,
      activeBG,
      activeBB
    ];

    const values = [
      400, 100, 100, 25
    ];

    const pathColors = [
      C.green,
      C.cyan,
      C.cyan,
      C.amber
    ];

    const names = [
      'G, G',
      'G, B',
      'B, G',
      'B, B'
    ];

    const objects = [
      treeNode(
        100,
        CX, TREE_Y0,
        C.cyan,
        true,
        1.32
      ),

      treeEdge(
        CX, TREE_Y0,
        TREE_X1[0], TREE_Y1,
        '×2',
        C.green
      ),

      treeEdge(
        CX, TREE_Y0,
        TREE_X1[1], TREE_Y1,
        '÷2',
        C.amber
      ),

      treeNode(
        200,
        TREE_X1[0], TREE_Y1,
        C.green
      ),

      treeNode(
        50,
        TREE_X1[1], TREE_Y1,
        C.amber
      )
    ];

    for (let i = 0; i < 4; i++) {
      const parent = i < 2
        ? TREE_X1[0]
        : TREE_X1[1];

      const isGood = i % 2 === 0;

      objects.push(
        treeEdge(
          parent, TREE_Y1,
          TREE_X2[i], TREE_Y2,
          isGood ? '×2' : '÷2',
          isGood ? C.green : C.amber,
          all[i]
        ),

        treeNode(
          values[i],
          TREE_X2[i],
          TREE_Y2,
          pathColors[i],
          all[i]
        ),

        txt(
          names[i],
          TREE_X2[i],
          TREE_Y2 - 0.48,
          18,
          all[i]
            ? pathColors[i]
            : C.muted
        ),

        txt(
          all[i] ? '1/4' : '?',
          TREE_X2[i],
          TREE_Y2 - 0.86,
          19,
          all[i]
            ? pathColors[i]
            : C.muted,
          true
        )
      );
    }

    if (P) {
      objects.push(
        txt(
          'G = good     B = bad',
          CX, TREE_Y2 - 1.35,
          17, C.muted
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // 7 — give one belt two shocks

  await until(S(7));

  await play(
    ...replacePicture(shockTree(0)),
    ...say('TWO INDEPENDENT SHOCKS'),
    ...fbox([
      'First shock',
      'Second shock',
      ['4 equally likely paths', C.cyan]
    ])
  );

  // 8 — good then good: 400 days, chance one quarter

  await until(S(8));

  await play(
    ...replacePicture(shockTree(1)),
    ...say('GOOD THEN GOOD → 400 DAYS', C.green),
    ...fbox([
      '100 × 2 × 2',
      ['= 400 days', C.green],
      '1/2 × 1/2',
      ['Chance = 1/4', C.green]
    ], C.green)
  );

  // 9 — mixed shocks: 100 days, chance one half

  await until(S(9));

  await play(
    ...replacePicture(shockTree(2)),
    ...say('TWO PATHS RETURN TO 100', C.cyan),
    ...fbox([
      '100 × 2 ÷ 2 = 100',
      '100 ÷ 2 × 2 = 100',
      '1/4 + 1/4',
      ['Chance = 1/2', C.cyan]
    ])
  );

  const mixed9 = rounded(
    CX,
    TREE_Y2 - 0.25,
    2.70,
    1.35,
    C.cyan,
    0.025
  );

  await play(
    ...replaceOverlay(mixed9)
  );

  // 10 — bad then bad: 25 days, chance one quarter

  await until(S(10));

  await play(
    ...replacePicture(shockTree(3)),
    ...say('BAD THEN BAD → 25 DAYS', C.amber),
    ...fbox([
      '100 ÷ 2 ÷ 2',
      ['= 25 days', C.amber],
      '1/2 × 1/2',
      ['Chance = 1/4', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Ordinary and logarithmic number lines
  // ------------------------------------------------------------

  const RW = P ? Math.min(5.85, FW - 1.4) : 5.90;
  const RX = CX - RW / 2;

  const RY = P ? -3.0 : -1.38;

  const linearX = v =>
    RX + v / 450 * RW;

  const logStep = v =>
    Math.log2(v / MEDIAN);

  const logX = v =>
    RX + (logStep(v) + 2.45) / 4.90 * RW;

  const OUTCOMES = [
    {
      value: 25,
      count: 1,
      color: C.amber
    },
    {
      value: 100,
      count: 2,
      color: C.cyan
    },
    {
      value: 400,
      count: 1,
      color: C.green
    }
  ];

  function rulerAxes(
    logarithmic = false
  ) {
    const x = logarithmic
      ? logX
      : linearX;

    const ticks = logarithmic
      ? [25, 50, 100, 200, 400]
      : [0, 100, 200, 300, 400];

    const objects = [
      line(
        RX, RY,
        RX + RW, RY,
        C.muted, 3
      ),

      txt(
        logarithmic
          ? 'Doubling ruler'
          : 'Ordinary ruler',
        CX,
        P ? 0.96 : 1.07,
        23, C.ink
      ),

      txt(
        logarithmic
          ? 'Equal spacing = equal multiplying'
          : 'Equal spacing = equal adding',
        CX,
        P ? 0.47 : 0.63,
        17, C.muted
      )
    ];

    ticks.forEach(v => {
      objects.push(
        line(
          x(v), RY - 0.08,
          x(v), RY + 0.08,
          C.muted, 2
        ),

        txt(
          String(v),
          x(v), RY - 0.30,
          17, C.muted, true
        )
      );
    });

    objects.push(
      txt(
        'days',
        RX + RW - 0.20,
        RY - 0.68,
        16, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  function outcomeDots(
    value,
    count,
    color,
    logarithmic = false
  ) {
    const x = logarithmic
      ? logX(value)
      : linearX(value);

    const pitch = P ? 0.42 : 0.34;

    const objects = [];

    for (let i = 0; i < count; i++) {
      objects.push(
        glow(
          x,
          RY + 0.25 + i * pitch,
          P ? 0.12 : 0.105,
          color
        )
      );
    }

    objects.push(
      txt(
        String(value),
        x,
        RY + 0.73 + (count - 1) * pitch,
        20, color, true
      ),

      txt(
        count === 1 ? '1/4' : '1/2',
        x,
        RY + 1.04 + (count - 1) * pitch,
        17, color, true
      )
    );

    return new M.VGroup(...objects);
  }

  function rulerPicture(
    logarithmic = false
  ) {
    return new M.VGroup(
      rulerAxes(logarithmic),

      ...OUTCOMES.map(o =>
        outcomeDots(
          o.value,
          o.count,
          o.color,
          logarithmic
        )
      )
    );
  }

  // ------------------------------------------------------------
  // 11 — place outcomes on an ordinary days line
  // ------------------------------------------------------------

  await until(S(11));

  const ordinaryAxes11 = rulerAxes(false);

  const ordinaryDots11 = OUTCOMES.map(o =>
    outcomeDots(
      o.value,
      o.count,
      o.color,
      false
    )
  );

  await play(
    ...clearPicture(),
    new M.FadeIn(ordinaryAxes11),

    new M.LaggedStart(
      ordinaryDots11.map(
        d => new M.FadeIn(d)
      ),
      {
        lagRatio: 0.30,
        runTime: 1.8
      }
    ),

    ...say('PUT THE OUTCOMES ON A DAYS LINE'),

    ...fbox([
      ['25 days:  1/4', C.amber],
      ['100 days: 1/2', C.cyan],
      ['400 days: 1/4', C.green]
    ])
  );

  picture = [
    ordinaryAxes11,
    ...ordinaryDots11
  ];

  // ------------------------------------------------------------
  // 12 — 25 is 75 days below 100
  // ------------------------------------------------------------

  await until(S(12));

  const shortDistance12 = bracket(
    linearX(25),
    linearX(100),
    RY - 0.80,
    '75 days',
    C.amber
  );

  await play(
    ...replaceOverlay(shortDistance12),
    ...say('100 − 25 = 75 DAYS', C.amber),
    ...fbox([
      'Below the middle',
      '100 − 25',
      ['= 75 days', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 13 — 400 is 300 days above 100
  // ------------------------------------------------------------

  await until(S(13));

  const bothDistances13 = new M.VGroup(
    bracket(
      linearX(25),
      linearX(100),
      RY - 0.80,
      '75',
      C.amber
    ),

    bracket(
      linearX(100),
      linearX(400),
      RY - 0.80,
      '300 days',
      C.green
    )
  );

  await play(
    ...replaceOverlay(bothDistances13),
    ...say('400 − 100 = 300 DAYS', C.green),
    ...fbox([
      'Above the middle',
      '400 − 100',
      ['= 300 days', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 14 — ordinary-scale picture is right-skewed
  // ------------------------------------------------------------

  const skew14 = new M.VGroup(
    bracket(
      linearX(25),
      linearX(100),
      RY - 0.80,
      '75',
      C.amber
    ),

    bracket(
      linearX(100),
      linearX(400),
      RY - 0.80,
      '300',
      C.green
    ),

    arrow(
      linearX(125),
      RY + 0.41,
      linearX(380),
      RY + 0.41,
      C.violet, 3
    ),

    txt(
      'Long stretch to the right',
      linearX(258),
      RY + 0.80,
      18, C.violet
    )
  );

  await until(S(14));

  await play(
    ...replaceOverlay(skew14),
    ...say('A LOPSIDED PICTURE', C.violet),
    ...fbox([
      ['Left distance: 75', C.amber],
      ['Right distance: 300', C.green],
      'Much farther to the right',
      ['Right-skewed', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 15 — switch to a ruler with doubling marks
  // ------------------------------------------------------------

  await until(S(15));

  const logAxes15 = rulerAxes(true);

  const logTargets15 = OUTCOMES.map(o =>
    outcomeDots(
      o.value,
      o.count,
      o.color,
      true
    )
  );

  const doublingArrows15 = [];

  const doublingMarks = [
    25, 50, 100, 200, 400
  ];

  for (let i = 0; i < 4; i++) {
    const x1 = logX(doublingMarks[i]);
    const x2 = logX(doublingMarks[i + 1]);

    doublingArrows15.push(
      new M.VGroup(
        arrow(
          x1 + 0.08, RY - 0.82,
          x2 - 0.08, RY - 0.82,
          C.violet, 2
        ),

        txt(
          '×2',
          (x1 + x2) / 2,
          RY - 1.08,
          17, C.violet, true
        )
      )
    );
  }

  await play(
    ...clearOverlays(),

    new M.FadeOut(ordinaryAxes11),

    new M.FadeIn(logAxes15),

    ...ordinaryDots11.map(
      (d, i) =>
        new M.Transform(
          d,
          logTargets15[i]
        )
    ),

    ...say('EACH MARK IS DOUBLE THE LAST', C.violet),

    ...fbox([
      '25 → 50 → 100',
      '100 → 200 → 400',
      ['Every step: × 2', C.violet]
    ], C.violet)
  );

  picture = [
    logAxes15,
    ...ordinaryDots11
  ];

  overlays = doublingArrows15;

  await play(
    new M.LaggedStart(
      doublingArrows15.map(
        a => new M.FadeIn(a)
      ),
      {
        lagRatio: 0.25,
        runTime: 2.0
      }
    )
  );

  // ------------------------------------------------------------
  // 16 — log scale: count doubling steps
  // ------------------------------------------------------------

  function doublingSteps() {
    const values = [
      25, 50, 100, 200, 400
    ];

    const labels = [
      '−2', '−1', '0', '+1', '+2'
    ];

    const objects = [
      txt(
        'Doubling steps from 100 days',
        CX,
        P ? -3.56 : -2.48,
        17, C.violet
      )
    ];

    values.forEach((v, i) => {
      objects.push(
        txt(
          labels[i],
          logX(v),
          RY - 0.75,
          18, C.violet, true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  await until(S(16));

  await play(
    ...replaceOverlay(doublingSteps()),
    ...say('LOG SCALE = MULTIPLYING STEPS', C.violet),
    ...fbox([
      'Relative log scale',
      'log₂(life/100)',
      'Counts doubling steps',
      ['Equal steps → equal factors', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 17 — 25 and 400 are each two steps from 100
  // ------------------------------------------------------------

  const balanced17 = new M.VGroup(
    bracket(
      logX(25),
      logX(100),
      RY - 0.84,
      '2 steps',
      C.amber
    ),

    bracket(
      logX(100),
      logX(400),
      RY - 0.84,
      '2 steps',
      C.green
    ),

    dashed(
      logX(100),
      RY,
      logX(100),
      RY + 1.70,
      C.violet
    ),

    txt(
      'Balanced around 100',
      CX,
      P ? -0.30 : 0.40,
      19, C.violet
    )
  );

  await until(S(17));

  await play(
    ...replacePicture(rulerPicture(true)),
    ...replaceOverlay(balanced17),
    ...say('TWO STEPS LEFT — TWO STEPS RIGHT', C.green),
    ...fbox([
      '25 = 100 ÷ 4',
      '400 = 100 × 4',
      ['−2 and +2 doubling steps', C.violet],
      'Balanced on the log scale'
    ], C.green)
  );

  // ------------------------------------------------------------
  // Continuous normal and lognormal density mathematics
  // ------------------------------------------------------------

  function normalPDF(z) {
    return Math.exp(
      -0.5 * z * z
    ) / Math.sqrt(2 * Math.PI);
  }

  function lognormalPDF(x) {
    if (x <= 0) {
      return 0;
    }

    const z =
      (Math.log(x) - MU) / SIGMA;

    return normalPDF(z) /
      (x * SIGMA);
  }

  // Standard normal CDF approximation.
  // Sufficient precision for the lesson's rounded probabilities.

  function normalCDF(z) {
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);

    const erf =
      1 -
      (
        (
          (
            (
              a5 * t + a4
            ) * t + a3
          ) * t + a2
        ) * t + a1
      ) *
      t *
      Math.exp(-x * x);

    return 0.5 * (1 + sign * erf);
  }

  function lognormalCDF(x) {
    if (x <= 0) {
      return 0;
    }

    return normalCDF(
      (Math.log(x) - MU) / SIGMA
    );
  }

  const P68 =
    lognormalCDF(200) -
    lognormalCDF(50);

  const P95 =
    lognormalCDF(400) -
    lognormalCDF(25);

  const P_BELOW_MEAN =
    lognormalCDF(MEAN);

  // ------------------------------------------------------------
  // Graph layout
  // ------------------------------------------------------------

  const GX = CX - 2.75;
  const GY = P ? -4.05 : -2.14;

  const GW = P ? Math.min(5.75, FW - 1.6) : 5.75;
  const GH = P ? 4.55 : 2.85;

  function graphMap(
    xmin,
    xmax,
    ymax
  ) {
    return {
      xmin,
      xmax,
      ymax,

      x: v =>
        GX +
        (v - xmin) / (xmax - xmin) * GW,

      y: d =>
        GY +
        d / ymax * GH
    };
  }

  // A normal density in doubling-step coordinates.
  // z = log₂(life/100), so one z unit means a factor of two.

  const GL = graphMap(
    -3.5,
    3.5,
    0.45
  );

  // Ordinary day coordinates for the lognormal density.

  const GD = graphMap(
    0,
    600,
    0.0085
  );

  function graphAxes(
    g,
    ticks,
    title,
    axisLabel,
    showDensity = true
  ) {
    const objects = [
      line(
        g.x(g.xmin), GY,
        g.x(g.xmax), GY,
        C.muted, 3
      ),

      line(
        g.x(g.xmin), GY,
        g.x(g.xmin), GY + GH,
        C.muted, 2
      ),

      fitText(
        title,
        CX,
        GY + GH + 0.45,
        22, C.ink
      ),

      txt(
        axisLabel,
        CX,
        GY - 0.67,
        17, C.muted
      )
    ];

    if (showDensity) {
      objects.push(
        txt(
          'density',
          g.x(g.xmin) + 0.40,
          GY + GH - 0.03,
          15, C.muted
        )
      );
    }

    ticks.forEach(([v, label]) => {
      objects.push(
        line(
          g.x(v), GY - 0.07,
          g.x(v), GY + 0.07,
          C.muted
        ),

        txt(
          label,
          g.x(v),
          GY - 0.29,
          16, C.muted, true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function logAxes(
    title = 'Bell on the log scale'
  ) {
    return graphAxes(
      GL,
      [
        [-2, '25'],
        [-1, '50'],
        [0, '100'],
        [1, '200'],
        [2, '400']
      ],
      title,
      'days — doubling scale'
    );
  }

  function dayAxes(
    title = 'Lifetime on an ordinary scale'
  ) {
    return graphAxes(
      GD,
      [
        [0, '0'],
        [100, '100'],
        [200, '200'],
        [300, '300'],
        [400, '400'],
        [500, '500'],
        [600, '600']
      ],
      title,
      'days'
    );
  }

  function densityCurve(
    pdf,
    g,
    color = C.cyan,
    a = g.xmin,
    b = g.xmax,
    n = 140,
    sw = 4
  ) {
    const segments = [];

    for (let i = 0; i < n; i++) {
      const v1 =
        a + (b - a) * i / n;

      const v2 =
        a + (b - a) * (i + 1) / n;

      segments.push(
        line(
          g.x(v1),
          g.y(pdf(v1)),
          g.x(v2),
          g.y(pdf(v2)),
          color,
          sw
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function normalCurve(
    color = C.cyan
  ) {
    return densityCurve(
      normalPDF,
      GL,
      color
    );
  }

  function lognormalCurve(
    color = C.cyan
  ) {
    return densityCurve(
      lognormalPDF,
      GD,
      color
    );
  }

  function shadedArea(
    a, b,
    pdf,
    g,
    color = C.amber,
    opacity = 0.40
  ) {
    a = Math.max(a, g.xmin);
    b = Math.min(b, g.xmax);

    const strips = [];

    const n = Math.max(
      8,
      Math.ceil(
        (b - a) /
        (g.xmax - g.xmin) *
        180
      )
    );

    const step = (b - a) / n;

    for (let i = 0; i < n; i++) {
      const left = a + i * step;
      const right = left + step;
      const mid = (left + right) / 2;

      const h = g.y(pdf(mid)) - GY;

      if (h <= 0.001) {
        continue;
      }

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

  function normalArea(
    a, b,
    color = C.amber,
    opacity = 0.40
  ) {
    return shadedArea(
      a, b,
      normalPDF,
      GL,
      color,
      opacity
    );
  }

  function lognormalArea(
    a, b,
    color = C.amber,
    opacity = 0.40
  ) {
    return shadedArea(
      a, b,
      lognormalPDF,
      GD,
      color,
      opacity
    );
  }

  function graphGuide(
    v,
    pdf,
    g,
    color = C.amber
  ) {
    return new M.VGroup(
      dashed(
        g.x(v), GY,
        g.x(v), g.y(pdf(v)),
        color
      ),

      glow(
        g.x(v),
        g.y(pdf(v)),
        0.075,
        color
      )
    );
  }

  function normalGuide(
    z,
    color = C.amber
  ) {
    return graphGuide(
      z,
      normalPDF,
      GL,
      color
    );
  }

  function dayGuide(
    v,
    color = C.amber
  ) {
    return graphGuide(
      v,
      lognormalPDF,
      GD,
      color
    );
  }

  function normalPicture(
    title = 'Bell on the log scale'
  ) {
    return new M.VGroup(
      logAxes(title),
      normalCurve()
    );
  }

  function dayPicture(
    title = 'Lifetime on an ordinary scale'
  ) {
    return new M.VGroup(
      dayAxes(title),
      lognormalCurve()
    );
  }

  // ------------------------------------------------------------
  // 18 — many small multiplicative shocks give a normal bell
  // on the log scale, under suitable conditions
  // ------------------------------------------------------------

  await until(S(18));

  const axes18 = logAxes(
    'Many small multiplying effects'
  );

  const bellLeft18 = densityCurve(
    normalPDF,
    GL,
    C.cyan,
    -3.5,
    0,
    70
  );

  const bellRight18 = densityCurve(
    normalPDF,
    GL,
    C.cyan,
    0,
    3.5,
    70
  );

  const bellMiddle18 = normalGuide(
    0,
    C.green
  );

  await play(
    ...replacePicture(
      axes18
    ),

    new M.LaggedStart(
      [
        new M.FadeIn(bellLeft18),
        new M.FadeIn(bellRight18),
        new M.FadeIn(bellMiddle18)
      ],
      {
        lagRatio: 0.35,
        runTime: 2.4
      }
    ),

    ...say('MANY SHOCKS → A BELL ON THE LOG SCALE'),

    ...fbox([
      'Multiplying effects',
      'become adding log steps',
      ['Log picture: normal bell', C.cyan]
    ])
  );

  picture.push(
    bellLeft18,
    bellRight18,
    bellMiddle18
  );

  // ------------------------------------------------------------
  // 19 — name the lognormal law
  // ------------------------------------------------------------

  const law19 = tag(
    'LOGNORMAL',
    GL.x(2.15),
    GY + GH * 0.81,
    C.violet,
    20,
    2.50
  );

  await until(S(19));

  await play(
    ...replaceOverlay(law19),
    ...say('THE LOGNORMAL LAW', C.violet),
    ...fbox([
      'A normal bell',
      'on the log scale',
      ['The lognormal law', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 20 — return to an ordinary days scale
  //
  // Important: this uses the lognormal density, including
  // the change-of-variable factor 1/x. It is not merely
  // a horizontally stretched normal density.
  // ------------------------------------------------------------

  await until(S(20));

  const rightTail20 = new M.VGroup(
    densityCurve(
      lognormalPDF,
      GD,
      C.violet,
      200,
      600,
      85,
      5
    ),

    txt(
      'Long right tail',
      GD.x(390),
      GY + GH * 0.58,
      19, C.violet
    ),

    arrow(
      GD.x(385),
      GY + GH * 0.49,
      GD.x(360),
      GD.y(lognormalPDF(360)) + 0.06,
      C.violet, 2
    ),

    txt(
      'Peak',
      GD.x(MODE) + 0.22,
      GD.y(lognormalPDF(MODE)) + 0.25,
      17, C.amber
    ),

    glow(
      GD.x(MODE),
      GD.y(lognormalPDF(MODE)),
      0.075,
      C.amber
    )
  );

  await play(
    ...replacePicture(
      dayAxes('Lognormal density'),
      lognormalCurve()
    ),

    ...replaceOverlay(rightTail20),

    ...say('ORDINARY SCALE: A LONG RIGHT TAIL', C.violet),

    ...fbox([
      'Ordinary days scale',
      'Rises quickly',
      'Peaks early',
      ['Long right tail', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 21 — build the smooth belt-lifetime model
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...replacePicture(
      dayPicture('Smooth model for belt lifetimes')
    ),

    ...say('OUR SMOOTH MODEL FOR BELTS'),

    ...fbox([
      'Lognormal model',
      'Median = 100 days',
      ['Multiplicative spread = 2', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 22 — median 100 days; half below and half above
  // ------------------------------------------------------------

  function medianLabels() {
    return new M.VGroup(
      dashed(
        GD.x(100), GY,
        GD.x(100),
        GD.y(lognormalPDF(100)),
        C.green
      ),

      glow(
        GD.x(100),
        GD.y(lognormalPDF(100)),
        0.085,
        C.green
      ),

      txt(
        'Median = 100',
        GD.x(100) + 1.03,
        GY + GH * 0.88,
        18, C.green
      ),

      arrow(
        GD.x(100) + 0.75,
        GY + GH * 0.80,
        GD.x(100) + 0.04,
        GD.y(lognormalPDF(100)) + 0.08,
        C.green, 2
      ),

      txt(
        '50%',
        GD.x(58),
        GY + GH * 0.40,
        19, C.amber, true
      ),

      tag(
        '50% ABOVE',
        GD.x(390),
        GY + GH * 0.52,
        C.violet,
        18,
        2.35
      ),

      arrow(
        GD.x(345),
        GY + GH * 0.41,
        GD.x(185),
        GD.y(lognormalPDF(185)) * 0.0 +
          GY +
          (GD.y(lognormalPDF(185)) - GY) * 0.50,
        C.violet, 2
      )
    );
  }

  await until(S(22));

  await play(
    ...replacePicture(
      dayAxes('The middle lifetime'),
      lognormalArea(0, 100, C.amber, 0.35),
      lognormalArea(100, 600, C.violet, 0.30),
      lognormalCurve()
    ),

    ...replaceOverlay(medianLabels()),

    ...say('MEDIAN = 100 DAYS', C.green),

    ...fbox([
      ['Median = 100 days', C.green],
      'P(life < 100) = 0.5',
      'P(life > 100) = 0.5',
      'Half before, half after'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 23 — spread is a multiplicative factor of two
  // ------------------------------------------------------------

  function spreadRuler() {
    const y = P ? -1.65 : -0.50;

    const xs = [
      CX - 1.92,
      CX,
      CX + 1.92
    ];

    return new M.VGroup(
      txt(
        'One multiplying step',
        CX, y + 1.45,
        23, C.ink
      ),

      numberCard(
        50, 'days',
        xs[0], y,
        C.amber,
        1.34
      ),

      numberCard(
        100, 'days',
        xs[1], y,
        C.cyan,
        1.34
      ),

      numberCard(
        200, 'days',
        xs[2], y,
        C.green,
        1.34
      ),

      arrow(
        xs[1] - 0.72,
        y + 0.72,
        xs[0] + 0.45,
        y + 0.72,
        C.amber, 3
      ),

      arrow(
        xs[1] + 0.72,
        y + 0.72,
        xs[2] - 0.45,
        y + 0.72,
        C.green, 3
      ),

      txt(
        '÷ 2',
        (xs[0] + xs[1]) / 2,
        y + 1.00,
        21, C.amber, true
      ),

      txt(
        '× 2',
        (xs[1] + xs[2]) / 2,
        y + 1.00,
        21, C.green, true
      ),

      txt(
        'Median',
        xs[1], y - 0.78,
        19, C.cyan
      ),

      tag(
        'SPREAD FACTOR = 2',
        CX, y - 1.43,
        C.violet, 20
      )
    );
  }

  await until(S(23));

  await play(
    ...replacePicture(spreadRuler()),

    ...say('SPREAD: TIMES OR DIVIDED BY 2', C.violet),

    ...fbox([
      'Median = 100',
      ['100 ÷ 2 = 50', C.amber],
      ['100 × 2 = 200', C.green],
      'Spread factor = 2'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 24 — one multiplying step equals one standard deviation
  // in the log-scale bell for this model
  // ------------------------------------------------------------

  function oneStepGuides() {
    return new M.VGroup(
      normalGuide(-1, C.amber),
      normalGuide(0, C.green),
      normalGuide(1, C.amber),

      bracket(
        GL.x(-1),
        GL.x(0),
        GY + GH * 0.12,
        '1 step',
        C.amber,
        true
      ),

      bracket(
        GL.x(0),
        GL.x(1),
        GY + GH * 0.12,
        '1 step',
        C.amber,
        true
      ),

      txt(
        '−1 SD',
        GL.x(-1) - 0.35,
        GL.y(normalPDF(-1)) + 0.23,
        16, C.amber, true
      ),

      txt(
        '+1 SD',
        GL.x(1) + 0.35,
        GL.y(normalPDF(1)) + 0.23,
        16, C.amber, true
      )
    );
  }

  await until(S(24));

  await play(
    ...replacePicture(
      logAxes('One standard deviation each side'),
      normalCurve()
    ),

    ...replaceOverlay(oneStepGuides()),

    ...say('ONE LOG STEP = ONE STANDARD DEVIATION'),

    ...fbox([
      'On the log scale',
      'SD = ln(2) ≈ 0.693',
      ['One doubling step', C.cyan],
      'From 50 to 200 days'
    ])
  );

  // ------------------------------------------------------------
  // 25 — about 68 percent between 50 and 200 days
  // ------------------------------------------------------------

  const range68Log25 = new M.VGroup(
    normalGuide(-1, C.amber),
    normalGuide(1, C.amber),

    tag(
      '68%',
      GL.x(0),
      GY + GH * 0.36,
      C.amber,
      25
    ),

    txt(
      '50 to 200 days',
      GL.x(0),
      GY + GH * 0.16,
      18, C.amber
    )
  );

  await until(S(25));

  await play(
    ...replacePicture(
      logAxes('One step on each side'),
      normalArea(-1, 1, C.amber, 0.48),
      normalCurve()
    ),

    ...replaceOverlay(range68Log25),

    ...say('ABOUT 68% BETWEEN 50 AND 200', C.amber),

    ...fbox([
      '100 ÷ 2 = 50',
      '100 × 2 = 200',
      ['P(50 to 200) ≈ 68%', C.amber]
    ], C.amber)
  );

  await until(S(25) + 2.0);

  await play(
    ...replacePicture(
      dayAxes('The same 68% on the days scale'),
      lognormalArea(
        50, 200,
        C.amber, 0.48
      ),
      lognormalCurve()
    ),

    ...replaceOverlay(
      dayGuide(50, C.amber),
      dayGuide(200, C.amber),

      new M.VGroup(
        tag(
          '68%',
          GD.x(370),
          GY + GH * 0.64,
          C.amber, 23
        ),

        arrow(
          GD.x(310),
          GY + GH * 0.54,
          GD.x(128),
          GY +
            (GD.y(lognormalPDF(128)) - GY) * 0.55,
          C.amber, 2
        )
      )
    )
  );

  // ------------------------------------------------------------
  // 26 — about 95 percent between 25 and 400 days
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...replacePicture(
      logAxes('Two steps on each side'),
      normalArea(-2, 2, C.violet, 0.40),
      normalCurve()
    ),

    ...replaceOverlay(
      normalGuide(-2, C.violet),
      normalGuide(2, C.violet),

      tag(
        '95%',
        GL.x(0),
        GY + GH * 0.36,
        C.violet, 25
      ),

      txt(
        '25 to 400 days',
        GL.x(0),
        GY + GH * 0.16,
        18, C.violet
      )
    ),

    ...say('ABOUT 95% BETWEEN 25 AND 400', C.violet),

    ...fbox([
      '100 ÷ 2 ÷ 2 = 25',
      '100 × 2 × 2 = 400',
      ['P(25 to 400) ≈ 95%', C.violet]
    ], C.violet)
  );

  await until(S(26) + 2.0);

  await play(
    ...replacePicture(
      dayAxes('The same 95% on the days scale'),
      lognormalArea(
        25, 400,
        C.violet, 0.40
      ),
      lognormalCurve()
    ),

    ...replaceOverlay(
      dayGuide(25, C.violet),
      dayGuide(400, C.violet),

      tag(
        '95%',
        GD.x(355),
        GY + GH * 0.58,
        C.violet, 24
      )
    )
  );

  // ------------------------------------------------------------
  // 27 — balanced by multiplying, not adding
  // ------------------------------------------------------------

  function rangeComparison() {
    const top = P ? -0.10 : 0.28;
    const bottom = P ? -2.65 : -1.47;

    const left = CX - 2.65;
    const right = CX + 2.65;

    const ordinary = v =>
      left + v / 450 * (right - left);

    const logarithmic = v =>
      left +
      (Math.log2(v / 100) + 2.45) /
      4.90 *
      (right - left);

    function row(
      y,
      map,
      title,
      log = false
    ) {
      const objects = [
        txt(
          title,
          CX, y + 0.77,
          19,
          log ? C.green : C.violet
        ),

        line(
          left, y,
          right, y,
          C.muted, 2
        )
      ];

      const values = [
        25, 100, 400
      ];

      const colors = [
        C.amber,
        C.cyan,
        C.green
      ];

      values.forEach((v, i) => {
        objects.push(
          glow(
            map(v),
            y,
            0.075,
            colors[i]
          ),

          txt(
            String(v),
            map(v),
            y + 0.30,
            17, colors[i], true
          )
        );
      });

      objects.push(
        bracket(
          map(25),
          map(100),
          y - 0.36,
          log ? '÷4' : '−75',
          C.amber
        ),

        bracket(
          map(100),
          map(400),
          y - 0.36,
          log ? '×4' : '+300',
          C.green
        )
      );

      return new M.VGroup(...objects);
    }

    return new M.VGroup(
      row(
        top,
        ordinary,
        'Ordinary scale: unequal distances',
        false
      ),

      row(
        bottom,
        logarithmic,
        'Log scale: equal multiplying steps',
        true
      )
    );
  }

  await until(S(27));

  await play(
    ...replacePicture(rangeComparison()),

    ...say('BALANCED BY MULTIPLYING, NOT ADDING', C.green),

    ...fbox([
      '25 ← 100 → 400',
      'Divide by 4 / multiply by 4',
      ['Equal factors', C.green],
      'Unequal day differences'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 28–29 — mean above median because of right skew
  // ------------------------------------------------------------

  function meanMedianGuides(
    showTail = false
  ) {
    const medX = GD.x(MEDIAN);
    const meanX = GD.x(MEAN);

    const medY =
      GD.y(lognormalPDF(MEDIAN));

    const meanY =
      GD.y(lognormalPDF(MEAN));

    const objects = [
      dashed(
        medX, GY,
        medX, medY,
        C.green
      ),

      dashed(
        meanX, GY,
        meanX, meanY,
        C.amber
      ),

      glow(
        medX, medY,
        0.075,
        C.green
      ),

      glow(
        meanX, meanY,
        0.075,
        C.amber
      ),

      txt(
        'Median = 100',
        GD.x(280),
        GY + GH * 0.91,
        18, C.green
      ),

      arrow(
        GD.x(225),
        GY + GH * 0.85,
        medX + 0.04,
        medY + 0.08,
        C.green, 2
      ),

      txt(
        'Mean ≈ 127',
        GD.x(350),
        GY + GH * 0.71,
        18, C.amber
      ),

      arrow(
        GD.x(280),
        GY + GH * 0.66,
        meanX + 0.06,
        meanY,
        C.amber, 2
      )
    ];

    if (showTail) {
      objects.push(
        densityCurve(
          lognormalPDF,
          GD,
          C.violet,
          200,
          600,
          90,
          5
        ),

        txt(
          'A few very long lives',
          GD.x(390),
          GY + GH * 0.42,
          17, C.violet
        ),

        arrow(
          GD.x(400),
          GY + GH * 0.33,
          GD.x(350),
          GD.y(lognormalPDF(350)) + 0.07,
          C.violet, 2
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // 28 — the smooth model has mean about 127 days

  await until(S(28));

  await play(
    ...replacePicture(
      dayPicture('Mean and median belt life')
    ),

    ...replaceOverlay(
      meanMedianGuides(false)
    ),

    ...say('MEAN LIFE ≈ 127 DAYS', C.amber),

    ...fbox([
      ['Median = 100 days', C.green],
      'Mean = 100 × e^(σ²/2)',
      'σ = ln(2)',
      [`Mean ≈ ${Math.round(MEAN)} days`, C.amber]
    ], C.amber)
  );

  // 29 — a few long-lived belts pull the mean upward

  await until(S(29));

  await play(
    ...replaceOverlay(
      meanMedianGuides(true)
    ),

    ...say('LONG LIVES PULL THE MEAN UP', C.violet),

    ...fbox([
      ['Median = 100', C.green],
      ['Mean ≈ 127', C.amber],
      'Long right tail',
      ['Mean > median', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 30 — short mathematical version
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...replacePicture(
      normalPicture()
    ),

    ...say('THE SHORT VERSION'),

    ...fbox([
      'Take the log',
      'Look at the distribution',
      ['Is it a normal bell?', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 31 — if log(X) is normal, X is lognormal
  // ------------------------------------------------------------

  const formula31 = new M.VGroup(
    tag(
      'log(X)',
      GL.x(2.30),
      GY + GH * 0.82,
      C.violet, 20, 1.95
    ),

    txt(
      'Normal bell',
      GL.x(2.20),
      GY + GH * 0.64,
      17, C.violet
    )
  );

  await until(S(31));

  await play(
    ...replaceOverlay(formula31),

    ...say('X = LIFE OF ONE BELT'),

    ...fbox([
      'X = belt lifetime',
      ['log(X) follows Normal', C.violet],
      'Therefore',
      ['X follows Lognormal', C.cyan]
    ])
  );

  await until(S(31) + 4.0);

  await play(
    ...replacePicture(
      dayPicture('X follows the lognormal law')
    ),

    ...replaceOverlay(
      tag(
        'LOGNORMAL',
        GD.x(390),
        GY + GH * 0.74,
        C.violet,
        20,
        2.45
      )
    ),

    ...say('NORMAL LOGS → LOGNORMAL VALUES', C.violet),

    ...fbox([
      ['log(X): normal', C.violet],
      ['X: lognormal', C.cyan],
      'X is positive'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 32 — everyday interpretation
  // Compare the two coordinate systems in one compact picture.
  // ------------------------------------------------------------

  function pairedCurves() {
    const topY = P ? -1.03 : -0.15;
    const bottomY = P ? -4.12 : -2.20;

    const h = P ? 2.02 : 1.05;
    const w = 5.55;

    const left = CX - w / 2;

    const nx = z =>
      left + (z + 3.5) / 7 * w;

    const ny = d =>
      topY + d / 0.45 * h;

    const dx = v =>
      left + v / 600 * w;

    const dy = d =>
      bottomY + d / 0.0085 * h;

    const objects = [
      txt(
        'Log scale: normal bell',
        CX,
        topY + h + 0.31,
        19, C.violet
      ),

      line(
        left, topY,
        left + w, topY,
        C.muted, 2
      ),

      txt(
        'Ordinary scale: lognormal',
        CX,
        bottomY + h + 0.31,
        19, C.cyan
      ),

      line(
        left, bottomY,
        left + w, bottomY,
        C.muted, 2
      )
    ];

    for (let i = 0; i < 100; i++) {
      const a =
        -3.5 + 7 * i / 100;

      const b =
        -3.5 + 7 * (i + 1) / 100;

      objects.push(
        line(
          nx(a), ny(normalPDF(a)),
          nx(b), ny(normalPDF(b)),
          C.violet, 3.5
        )
      );
    }

    for (let i = 0; i < 120; i++) {
      const a = 600 * i / 120;
      const b = 600 * (i + 1) / 120;

      objects.push(
        line(
          dx(a), dy(lognormalPDF(a)),
          dx(b), dy(lognormalPDF(b)),
          C.cyan, 3.5
        )
      );
    }

    for (const z of [-2, 0, 2]) {
      objects.push(
        txt(
          String(100 * Math.pow(2, z)),
          nx(z),
          topY - 0.23,
          15, C.muted, true
        )
      );
    }

    for (const v of [0, 100, 200, 400, 600]) {
      objects.push(
        txt(
          String(v),
          dx(v),
          bottomY - 0.24,
          15, C.muted, true
        )
      );
    }

    objects.push(
      dashed(
        nx(0), topY,
        nx(0), ny(normalPDF(0)),
        C.green
      ),

      dashed(
        dx(100), bottomY,
        dx(100), dy(lognormalPDF(100)),
        C.green
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(32));

  await play(
    ...replacePicture(pairedCurves()),

    ...say('ONE MODEL — TWO DIFFERENT RULERS'),

    ...fbox([
      'Multiplying steps',
      'form a normal bell',
      ['Original values: lognormal', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 33 — use for positive measurements built by multiplying
  // ------------------------------------------------------------

  function multiplicationChain() {
    const y = P ? -1.45 : -0.50;

    const xs = [
      CX - 2.05,
      CX - 0.70,
      CX + 0.70,
      CX + 2.05
    ];

    const labels = [
      'Start',
      'Effect 1',
      'Effect 2',
      'Effect 3'
    ];

    const colors = [
      C.cyan,
      C.green,
      C.amber,
      C.violet
    ];

    const values = [
      '100',
      '×1.2',
      '×0.8',
      '×1.1'
    ];

    const objects = [
      txt(
        'Many multiplying effects',
        CX,
        y + 1.42,
        22, C.ink
      )
    ];

    for (let i = 0; i < 4; i++) {
      objects.push(
        rounded(
          xs[i],
          y,
          1.08,
          0.79,
          colors[i],
          0.20
        ),

        txt(
          values[i],
          xs[i],
          y,
          20,
          colors[i],
          true
        ),

        txt(
          labels[i],
          xs[i],
          y - 0.66,
          16,
          colors[i]
        )
      );
    }

    objects.push(
      tag(
        'POSITIVE MEASUREMENTS',
        CX,
        y - 1.45,
        C.green,
        18
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(33));

  await play(
    ...replacePicture(multiplicationChain()),

    ...say('POSITIVE VALUES FROM MULTIPLYING EFFECTS', C.green),

    ...fbox([
      'Positive measurements',
      'Many multiplying effects',
      ['May be lognormal', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 34 — practical applications
  // ------------------------------------------------------------

  function houseIcon(x, y, color) {
    return new M.VGroup(
      rect(
        x, y - 0.15,
        0.87, 0.70,
        color, 0.15
      ),

      line(
        x - 0.56, y + 0.18,
        x, y + 0.64,
        color, 3
      ),

      line(
        x, y + 0.64,
        x + 0.56, y + 0.18,
        color, 3
      ),

      rect(
        x, y - 0.28,
        0.22, 0.44,
        color, 0.40
      )
    );
  }

  function incomeIcon(x, y, color) {
    const objects = [];

    for (let i = 0; i < 3; i++) {
      const xx = x + (i - 1) * 0.32;
      const h = 0.33 + i * 0.27;

      objects.push(
        rect(
          xx,
          y - 0.40 + h / 2,
          0.23,
          h,
          color,
          0.55
        )
      );
    }

    objects.push(
      arrow(
        x - 0.54, y + 0.12,
        x + 0.55, y + 0.66,
        color, 2
      )
    );

    return new M.VGroup(...objects);
  }

  function particleIcon(x, y, color) {
    return new M.VGroup(
      glow(
        x - 0.40, y + 0.17,
        0.12, color
      ),

      glow(
        x + 0.04, y - 0.20,
        0.21, color
      ),

      glow(
        x + 0.40, y + 0.24,
        0.29, color
      )
    );
  }

  function applicationsPicture() {
    const top = P ? 0.15 : 0.38;
    const bottom = P ? -2.28 : -1.40;

    const left = CX - 1.50;
    const right = CX + 1.50;

    const items = [
      [
        beltLoop(
          left, top,
          C.cyan, 0.75
        ),
        'Lifetimes',
        left, top,
        C.cyan
      ],

      [
        incomeIcon(
          right, top,
          C.green
        ),
        'Incomes',
        right, top,
        C.green
      ],

      [
        houseIcon(
          left, bottom,
          C.violet
        ),
        'House prices',
        left, bottom,
        C.violet
      ],

      [
        particleIcon(
          right, bottom,
          C.amber
        ),
        'Particle sizes',
        right, bottom,
        C.amber
      ]
    ];

    const objects = [];

    items.forEach(
      ([icon, title, x, y, color]) => {
        objects.push(
          icon,

          txt(
            title,
            x, y - 0.78,
            19, color
          )
        );
      }
    );

    return new M.VGroup(...objects);
  }

  await until(S(34));

  await play(
    ...replacePicture(
      applicationsPicture()
    ),

    ...say('LIFETIMES, PRICES, SIZES AND MORE'),

    ...fbox([
      'Possible applications',
      'Lifetimes and incomes',
      'House prices',
      ['Particle sizes', C.amber]
    ])
  );

  // ------------------------------------------------------------
  // 35–36 — common trap: the mean is not the median
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...replacePicture(
      dayPicture('The mean is not the middle')
    ),

    ...replaceOverlay(
      meanMedianGuides(false)
    ),

    ...say('TRAP: MEAN IS NOT THE TYPICAL LIFE', C.amber),

    ...fbox([
      ['Mean ≈ 127 days', C.amber],
      ['Median = 100 days', C.green],
      'Not the same number',
      'Right-skewed distribution'
    ], C.amber)
  );

  // 36 — about 64 percent of belts fail before the mean

  function belowMeanLabels() {
    const x = GD.x(MEAN);
    const y = GD.y(lognormalPDF(MEAN));

    return new M.VGroup(
      dashed(
        x, GY,
        x, y,
        C.amber
      ),

      glow(
        x, y,
        0.09,
        C.amber
      ),

      txt(
        'Mean ≈ 127 days',
        GD.x(295),
        GY + GH * 0.83,
        18, C.amber
      ),

      arrow(
        GD.x(240),
        GY + GH * 0.73,
        x + 0.05,
        y + 0.05,
        C.amber, 2
      ),

      tag(
        'ABOUT 64% BELOW',
        GD.x(390),
        GY + GH * 0.54,
        C.amber,
        20,
        2.9
      ),

      arrow(
        GD.x(320),
        GY + GH * 0.43,
        GD.x(83),
        GY + GH * 0.32,
        C.amber, 2
      ),

      txt(
        'About 36% above',
        GD.x(420),
        GY + GH * 0.24,
        17, C.muted
      )
    );
  }

  await until(S(36));

  await play(
    ...replacePicture(
      dayAxes('Most belts fail before the mean'),

      lognormalArea(
        0,
        MEAN,
        C.amber,
        0.50
      ),

      lognormalCurve()
    ),

    ...replaceOverlay(
      belowMeanLabels()
    ),

    ...say('ABOUT 64% FAIL BEFORE THE MEAN', C.amber),

    ...fbox([
      'Mean ≈ 127 days',
      'P(life < mean)',
      `≈ ${P_BELOW_MEAN.toFixed(3)}`,
      ['About 64 percent', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 37 — report median and multiplicative spread
  // ------------------------------------------------------------

  function recommendedSummary() {
    const top = P ? 0.12 : 0.33;
    const bottom = P ? -2.50 : -1.45;

    const objects = [
      rounded(
        CX,
        top,
        5.30, 1.28,
        C.green, 0.09
      ),

      txt(
        'Median',
        CX,
        top + 0.37,
        18, C.green
      ),

      txt(
        '100 days',
        CX,
        top - 0.12,
        27, C.green, true
      ),

      rounded(
        CX,
        bottom,
        5.30,
        P ? 2.10 : 1.68,
        C.violet,
        0.08
      ),

      txt(
        'Multiplicative spread',
        CX,
        bottom + (P ? 0.70 : 0.54),
        18, C.violet
      ),

      txt(
        '÷ 2    or    × 2',
        CX,
        bottom + 0.11,
        24, C.violet, true
      ),

      txt(
        '50 ← 100 → 200',
        CX,
        bottom - 0.40,
        21, C.cyan, true
      )
    ];

    if (P) {
      objects.push(
        txt(
          'About 68% of belt lives',
          CX,
          bottom - 0.77,
          17, C.muted
        )
      );
    }

    return new M.VGroup(...objects);
  }

  await until(S(37));

  await play(
    ...replacePicture(
      recommendedSummary()
    ),

    ...say('REPORT THE MEDIAN AND SPREAD FACTOR', C.green),

    ...fbox([
      ['Median: 100 days', C.green],
      ['Spread factor: 2', C.violet],
      '50 to 200 days: ≈ 68%',
      'Or examine the log scale'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 38 — preview quantile–quantile plots
  // Use the fixed Machine A example from lesson 5.2.9.
  // ------------------------------------------------------------

  function qqPreview() {
    const y0 = P ? -3.82 : -2.10;

    const size = P ? 4.35 : 2.90;

    const left = CX - size / 2;

    const x = v =>
      left + (v - 496) / 8 * size;

    const y = v =>
      y0 + (v - 496) / 8 * size;

    const expected = [
      497.4,
      499.0,
      500.0,
      501.0,
      502.6
    ];

    const observed = [
      497,
      499,
      500,
      501,
      503
    ];

    const objects = [
      txt(
        'Does the chosen law fit?',
        CX,
        y0 + size + 0.49,
        22, C.ink
      ),

      line(
        x(496), y0,
        x(504), y0,
        C.muted, 3
      ),

      line(
        x(496), y0,
        x(496), y(504),
        C.muted, 3
      ),

      line(
        x(496), y(496),
        x(504), y(504),
        C.green, 3
      )
    ];

    for (const v of [496, 500, 504]) {
      objects.push(
        txt(
          String(v),
          x(v),
          y0 - 0.26,
          15, C.muted, true
        ),

        txt(
          String(v),
          x(496) - 0.37,
          y(v),
          15, C.muted, true
        )
      );
    }

    for (let i = 0; i < 5; i++) {
      objects.push(
        glow(
          x(expected[i]),
          y(observed[i]),
          0.075,
          C.cyan
        )
      );
    }

    objects.push(
      txt(
        'Expected',
        CX,
        y0 - 0.64,
        17, C.muted
      ),

      txt(
        'Observed',
        x(496) + 0.42,
        y(504) + 0.15,
        16, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(38));

  await play(
    ...replacePicture(
      qqPreview()
    ),

    ...say('NEXT: DOES THE LAW REALLY FIT?', C.violet),

    ...fbox([
      'Compare actual data',
      'with model predictions',
      ['Next: the Q-Q plot', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 39 — final one-sentence recap
  // ------------------------------------------------------------

  await until(S(39));

  const finalPicture = pairedCurves();

  await play(
    ...replacePicture(finalPicture),

    ...say('MULTIPLYING EFFECTS → LOGNORMAL', C.green),

    ...fbox([
      'Many multiplying effects',
      ['Log scale: normal bell', C.violet],
      ['Ordinary scale: right tail', C.cyan],
      'Median and spread factor'
    ], C.green)
  );

  await until(S(39) + 2.8);

  const finalLogArea = normalArea(
    -1, 1,
    C.violet,
    0.42
  );

  await play(
    ...replacePicture(
      logAxes('A bell on the log scale'),
      finalLogArea,
      normalCurve()
    ),

    ...replaceOverlay(
      normalGuide(-1, C.violet),
      normalGuide(0, C.green),
      normalGuide(1, C.violet),

      tag(
        'BALANCED',
        GL.x(2.25),
        GY + GH * 0.79,
        C.violet,
        18,
        2.2
      )
    ),

    ...say('A BELL ON THE LOG SCALE', C.violet),

    ...fbox([
      'log(X) is normal',
      ['Balanced multiplying steps', C.violet]
    ], C.violet)
  );

  await until(S(39) + 5.5);

  const finalTail = new M.VGroup(
    densityCurve(
      lognormalPDF,
      GD,
      C.violet,
      200,
      600,
      90,
      5
    ),

    txt(
      'Long right tail',
      GD.x(400),
      GY + GH * 0.58,
      19, C.violet
    ),

    arrow(
      GD.x(390),
      GY + GH * 0.48,
      GD.x(350),
      GD.y(lognormalPDF(350)) + 0.08,
      C.violet, 2
    ),

    dayGuide(
      100,
      C.green
    ),

    txt(
      'Median = 100',
      GD.x(270),
      GY + GH * 0.86,
      18, C.green
    ),

    arrow(
      GD.x(215),
      GY + GH * 0.79,
      GD.x(100),
      GD.y(lognormalPDF(100)) + 0.07,
      C.green, 2
    )
  );

  await play(
    ...replacePicture(
      dayAxes('The lognormal law'),
      lognormalArea(
        50, 200,
        C.cyan,
        0.20
      ),
      lognormalCurve()
    ),

    ...replaceOverlay(finalTail),

    ...say('A LONG RIGHT TAIL ON THE ORDINARY SCALE', C.cyan),

    ...fbox([
      ['X is lognormal', C.cyan],
      ['Median = 100 days', C.green],
      ['Spread factor = 2', C.violet],
      ['Mean ≈ 127 days', C.amber]
    ])
  );

  await until(S(39) + 8.2);

  await play(
    ...say('LOGNORMAL: A BELL AFTER TAKING LOGS', C.green)
  );
}

// lesson 14.4.5
// Community detection: finding groups in a network
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Fixed chapter 14.4 friendship network:
//   Ana — Ben — Cara — Dan
//
// Undirected, unweighted friendships.
// Standard modularity comparison model.
//
// Modularity = observed internal share − expected internal share.
//
// Search:
//   0. Ana / Ben / Cara / Dan       Q = −0.277778
//   1. Ana + Ben / Cara / Dan      Q = −0.055556
//   2. Ana + Ben / Cara + Dan       Q =  0.166667
//   3. All four together           Q =  0        REJECT
//
// All modularity values, observed shares, expected shares,
// degree counts and changes are calculated from the graph.

export default async function (L) {
  const {
    M: M0, sc, P, FW, FH, C, S, E, T: T0, pill: pill0,
    show, showA, until, play, LINE_Y
  } = L;
  const T = (s, size, ...r) => T0(s, P ? Math.max(size, 15) : size, ...r);
  const pill = (s, c, size) => pill0(s, c, P ? Math.max(size || 17, 15) : size);

  // PHONE STAGE: in the early pictures the phone picture is enlarged and moved
  // down so it uses the screen from top to bottom. setStage(sk, cy, ty, cx)
  // maps a new picture object once, when it first appears (FadeIn / Create /
  // Transform target): scale sk about (cx, cy), then move (cx, cy) to (0, ty).
  // Formula cards and the reader roster are marked so they are skipped.
  // Laptop: no change.
  let STAGE = null;
  const setStage = (sk, cy, ty, cx = 0) => {
    STAGE = P && sk ? { sk, cy, ty, cx } : null;
  };
  const hasStaged = m => !!m && (m.__st || (m.submobjects || []).some(hasStaged));
  const markStaged = m => { if (!m) return m; m.__st = true; (m.submobjects || []).forEach(markStaged); return m; };
  function stage(m) {
    if (!P || !STAGE || !m || m.__st) return m;
    if (hasStaged(m)) { (m.submobjects || []).forEach(stage); m.__st = true; return m; }
    const { sk, cy, ty, cx } = STAGE;
    m.scale(sk, { aboutPoint: [cx, cy, 0] });
    const c = m.getCenter();
    m.moveTo([c[0] - cx, c[1] + ty - cy, c[2]]);
    markStaged(m);
    return m;
  }
  const M = !P ? M0 : {
    ...M0,
    FadeIn: class extends M0.FadeIn { constructor(m, o) { super(stage(m), o); } },
    Create: class extends M0.Create { constructor(m, o) { super(stage(m), o); } },
    Transform: class extends M0.Transform { constructor(a, b, o) { super(a, stage(b), o); } }
  };

  // ------------------------------------------------------------
  // Shared chapter data.
  // ------------------------------------------------------------

  const READERS = [
    'Ana',
    'Ben',
    'Cara',
    'Dan'
  ];

  const BOOKS = [
    'Trail',
    'River',
    'Clues',
    'Castle',
    'Island'
  ];

  const TOPICS = {
    Trail: ['Adventure', 'Nature'],
    River: ['Adventure', 'Nature'],
    Clues: ['Mystery', 'Crime'],
    Castle: ['Mystery', 'History'],
    Island: ['Adventure']
  };

  // Null means not rated, never zero stars.

  const RATINGS = [
    [4, null, 2, null, null],
    [4, 5,    2, 1,    null],
    [2, 1,    4, 5,    null],
    [2, 2,    4, 4,    null]
  ];

  const BASKETS = [
    ['Trail', 'River'],
    ['Trail', 'River', 'Clues'],
    ['Trail', 'River'],
    ['Trail', 'Clues'],
    ['River', 'Castle'],
    ['Clues', 'Castle'],
    ['Clues'],
    ['Castle']
  ];

  const EDGES = [
    [0, 1],
    [1, 2],
    [2, 3]
  ];

  const N = READERS.length;
  const EDGE_COUNT = EDGES.length;
  const END_COUNT = 2 * EDGE_COUNT;

  const sum = a =>
    a.reduce((s, v) => s + v, 0);

  const DEGREE = READERS.map((_, i) =>
    EDGES.reduce(
      (count, [a, b]) =>
        count + Number(a === i || b === i),
      0
    )
  );

  // DEGREE = [1, 2, 2, 1]

  const ADJACENCY = READERS.map((_, i) =>
    READERS.map((_, j) =>
      Number(
        EDGES.some(([a, b]) =>
          (a === i && b === j) ||
          (a === j && b === i)
        )
      )
    )
  );

  // One record for each friendship end.
  // Readers with degree 2 appear twice.
  //
  // Ana, Ben, Ben, Cara, Cara, Dan.

  const ENDS = EDGES.flatMap(
    ([a, b], edge) => [
      { reader: a, edge },
      { reader: b, edge }
    ]
  );

  // ------------------------------------------------------------
  // Actual modularity calculations.
  //
  // For each community g:
  //
  //   observed contribution = internal edges / m
  //   expected contribution = (degree sum / 2m)^2
  //
  // Q = sum of observed contributions
  //     minus sum of expected contributions.
  //
  // The expected share corresponds to independent selections
  // of two friendship ends, with replacement.
  //
  // This comparison model can include repeated ends and
  // connections to the same reader.
  // ------------------------------------------------------------

  const PARTITIONS = [
    [[0], [1], [2], [3]],
    [[0, 1], [2], [3]],
    [[0, 1], [2, 3]],
    [[0, 1, 2, 3]]
  ];

  function communityOf(partition, reader) {
    return partition.findIndex(
      group => group.includes(reader)
    );
  }

  function isInternal(partition, edge) {
    const [a, b] = edge;

    return communityOf(partition, a) ===
      communityOf(partition, b);
  }

  function modularity(partition) {
    const groups = partition.map(members => {
      const internalEdges = EDGES.filter(
        ([a, b]) =>
          members.includes(a) &&
          members.includes(b)
      ).length;

      const degreeSum = sum(
        members.map(i => DEGREE[i])
      );

      const endShare =
        degreeSum / END_COUNT;

      return {
        members: members.slice(),
        internalEdges,
        degreeSum,
        endShare,

        observed:
          internalEdges / EDGE_COUNT,

        expected:
          endShare * endShare
      };
    });

    const internalCount = sum(
      groups.map(g => g.internalEdges)
    );

    const observed = sum(
      groups.map(g => g.observed)
    );

    const expected = sum(
      groups.map(g => g.expected)
    );

    return {
      groups,
      internalCount,

      crossingCount:
        EDGE_COUNT - internalCount,

      observed,
      expected,

      q: observed - expected
    };
  }

  const RESULTS =
    PARTITIONS.map(modularity);

  const HISTORY = RESULTS.map((r, i) => ({
    ...r,

    change:
      i === 0
        ? 0
        : r.q - RESULTS[i - 1].q,

    accepted:
      i === 0 ||
      r.q > RESULTS[i - 1].q
  }));

  const BEST = RESULTS[2];

  const GROUP_A = BEST.groups[0];
  const GROUP_B = BEST.groups[1];

  // Checked values:
  //
  // Separate readers:
  //   observed = 0
  //   expected = 10/36
  //   Q = −5/18
  //
  // Ana + Ben:
  //   observed = 1/3
  //   expected = 14/36
  //   Q = −1/18
  //
  // Two groups:
  //   observed = 2/3
  //   expected = 18/36 = 1/2
  //   Q = 1/6
  //
  // All together:
  //   observed = 1
  //   expected = 1
  //   Q = 0

  const fixed = (v, digits = 3) => {
    const clean =
      Math.abs(v) < 1e-12 ? 0 : v;

    return clean
      .toFixed(digits)
      .replace('-', '−');
  };

  const signed = (v, digits = 3) =>
    v < 0
      ? `−${Math.abs(v).toFixed(digits)}`
      : `+${v.toFixed(digits)}`;

  const pct = (v, digits = 1) =>
    `${Number((v * 100).toFixed(digits))}%`;

  // ------------------------------------------------------------
  // Shared chapter palette.
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const BLUE = C.blue || '#60A5FA';
  const ORANGE = C.orange || '#FB923C';
  const PURPLE = C.violet || '#A78BFA';

  const GREEN = C.green;
  const AMBER = C.amber;
  const TEAL = C.teal || '#2DD4BF';
  const PINK = C.pink || '#F472B6';
  const YELLOW = C.yellow || '#FACC15';

  const INK = C.ink;
  const MUTED = C.muted;
  const CARD = C.card;

  const READER_COLORS = [
    CYAN,
    BLUE,
    ORANGE,
    PURPLE
  ];

  const BOOK_COLORS = {
    Trail: GREEN,
    River: TEAL,
    Clues: AMBER,
    Castle: PURPLE,
    Island: YELLOW
  };

  // Additional calculation colours.
  // Reader colours never change.

  const GROUP_LEFT = CYAN;
  const GROUP_RIGHT = AMBER;

  const OBSERVED = GREEN;
  const EXPECTED = PURPLE;
  const CROSSING = PINK;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone:  8 × 14.22, content y = −5.5 ... 4.3
  // Laptop: 14.22 × 8, content y = −3.0 ... 2.3
  //
  // One principal illustration area.
  // One formula box.
  // One narration pill.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.45, 0]
    : [4.3, -0.3, 0];

  const MAIN_W =
    P ? FW - 0.9 : 7.25;

  const pos = (x, y) =>
    [x, y, 0];

  const say = (s, c = CYAN) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Drawing helpers.
  // ------------------------------------------------------------

  function at(
    s, size, color, x, y,
    mono = false, maxw = null
  ) {
    const t = T(
      String(s),
      size,
      color,
      mono
    );

    if (
      maxw !== null &&
      t.getWidth() > maxw
    ) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo(pos(x, y));

    return t;
  }

  function line(
    a, b,
    color = MUTED,
    width = 2
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dashed(
    a, b,
    color = MUTED,
    width = 1.5
  ) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function rect(
    x, y, w, h,
    color,
    opacity = 0.82,
    strokeWidth = 1
  ) {
    const r = new M.Rectangle({
      width: Math.max(w, 0.012),
      height: Math.max(h, 0.012),
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(pos(x, y));

    return r;
  }

  function outline(
    x, y, w, h,
    color = CYAN,
    opacity = 0,
    strokeWidth = 2
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(
        0.18, w / 5, h / 5
      ),
      color,
      strokeWidth
    });

    r.setFill(CARD, opacity);
    r.moveTo(pos(x, y));

    return r;
  }

  function circle(
    x, y, radius,
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
    c.moveTo(pos(x, y));

    return c;
  }

  function glowDot(
    p,
    color = CYAN,
    radius = 0.08
  ) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.1,
      color
    });

    halo.setFill(color, 0.16);

    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(
      halo, d
    );
  }

  function arrow(
    a, b,
    color = CYAN,
    width = 2.5,
    head = 0.16
  ) {
    const theta = Math.atan2(
      b[1] - a[1],
      b[0] - a[0]
    );

    const length = Math.hypot(
      b[0] - a[0],
      b[1] - a[1]
    );

    const h = Math.min(
      head,
      length * 0.4
    );

    const p1 = pos(
      b[0] - h * Math.cos(
        theta - Math.PI / 6
      ),

      b[1] - h * Math.sin(
        theta - Math.PI / 6
      )
    );

    const p2 = pos(
      b[0] - h * Math.cos(
        theta + Math.PI / 6
      ),

      b[1] - h * Math.sin(
        theta + Math.PI / 6
      )
    );

    return new M.VGroup(
      line(a, b, color, width),
      line(b, p1, color, width),
      line(b, p2, color, width)
    );
  }

  function tagAt(
    text, color, x, y,
    size = 17,
    maxw = MAIN_W - 0.35
  ) {
    const tag = pill(
      text, color, size
    );

    if (tag.getWidth() > maxw) {
      tag.scale(
        maxw / tag.getWidth()
      );
    }

    tag.moveTo(pos(x, y));

    return tag;
  }

  function note(
    text,
    color = MUTED,
    y = P ? -4.28 : -2.47
  ) {
    return at(
      text,
      P ? 17 : 15,
      color,
      CX, y,
      false,
      MAIN_W - 0.35
    );
  }

  // ------------------------------------------------------------
  // Formula box.
  //
  // Only one formula box is visible at a time.
  // Leading spaces preserve mathematical indentation.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(
    lines,
    color = CYAN
  ) {
    const size = P ? 20 : 20;
    const lh = P ? 0.33 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, INK]
    );

    const texts = rows.map(
      ([s, c]) =>
        T(
          String(s).trimStart(),
          size,
          c,
          true
        )
    );

    const cw =
      T(
        '0000000000',
        size,
        INK,
        true
      ).getWidth() / 10;

    const widths = texts.map(
      (t, i) => {
        const raw =
          String(rows[i][0]);

        const indent =
          raw.length -
          raw.trimStart().length;

        return t.getWidth() +
          indent * cw;
      }
    );

    const wd =
      Math.max(...widths) + 0.64;

    const ht =
      rows.length * lh + 0.32;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(CARD, 0.95);
    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.32;

    const top =
      BOXP[1] + ht / 2 -
      0.16 - lh / 2;

    texts.forEach((t, i) => {
      const raw =
        String(rows[i][0]);

      const indent = cw * (
        raw.length -
        raw.trimStart().length
      );

      t.moveTo(pos(
        left + indent +
          t.getWidth() / 2,

        top - i * lh
      ));
    });

    const g = new M.VGroup(
      r, ...texts
    );

    const maxw =
      P ? FW - 1.2 : 4.0;

    const maxh =
      P ? 1.62 : 3.5;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);
    markStaged(g);

    const a = [
      new M.FadeIn(g)
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ------------------------------------------------------------
  // Picture management.
  //
  // Visible objects are tracked independently.
  // Never regroup objects that are already on screen.
  // ------------------------------------------------------------

  let picture = [];
  let focusNow = null;

  function clearFocus() {
    if (!focusNow) return [];

    const old = focusNow;
    focusNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function focus(g) {
    const a = clearFocus();

    focusNow = g;

    a.push(
      new M.FadeIn(g)
    );

    return a;
  }

  function scene(...objects) {
    const a = [
      ...clearFocus(),

      ...picture.map(o =>
        new M.FadeOut(o)
      ),

      ...objects.map(o =>
        new M.FadeIn(o)
      )
    ];

    picture = objects.slice();

    return a;
  }

  function enter(...objects) {
    picture.push(...objects);

    return objects.map(o =>
      new M.FadeIn(o)
    );
  }

  function leave(...objects) {
    const present = objects.filter(o =>
      picture.includes(o)
    );

    picture = picture.filter(o =>
      !present.includes(o)
    );

    return present.map(o =>
      new M.FadeOut(o)
    );
  }

  function enterLagged(
    objects,
    lagRatio = 0.12,
    runTime = 1.2
  ) {
    picture.push(...objects);

    return [
      new M.LaggedStart(
        objects.map(o =>
          new M.FadeIn(o)
        ),
        { lagRatio, runTime }
      )
    ];
  }

  // ------------------------------------------------------------
  // Persistent reader roster.
  //
  // Reader names and colours remain visible even during
  // the probability and modularity calculations.
  // ------------------------------------------------------------

  const ROSTER_Y =
    P ? -5.12 : -2.82;

  const roster = new M.VGroup(
    ...READERS.map((name, i) => {
      const x =
        CX + (i - 1.5) * (P ? 1.85 : 1.55);

      const color =
        READER_COLORS[i];

      return new M.VGroup(
        outline(
          x, ROSTER_Y,
          P ? 1.6 : 1.22, P ? 0.42 : 0.30,
          color, 0.40, 1
        ),

        glowDot(
          pos(x - (P ? 0.6 : 0.43), ROSTER_Y),
          color, 0.047
        ),

        at(
          name,
          P ? 17 : 13,
          color,
          x + (P ? 0.1 : 0.08),
          ROSTER_Y,
          false, P ? 1.0 : 0.73
        )
      );
    })
  );
  markStaged(roster);

  // ------------------------------------------------------------
  // Reader and book illustrations.
  // ------------------------------------------------------------

  function readerIcon(
    i, x, y,
    scale = 1
  ) {
    const color =
      READER_COLORS[i];

    const head = new M.Circle({
      radius: 0.18 * scale,
      color
    });

    head.setFill(color, 0.96);

    head.moveTo(pos(
      x,
      y + 0.23 * scale
    ));

    const body = new M.Arc({
      radius: 0.33 * scale,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.80);

    body.moveTo(pos(
      x,
      y - 0.15 * scale
    ));

    return new M.VGroup(
      head, body
    );
  }

  function bookCard(
    name, x, y,
    w = 0.91,
    h = 1.23
  ) {
    const color =
      BOOK_COLORS[name];

    const halo = outline(
      x, y,
      w + 0.07,
      h + 0.07,
      color, 0.04, 1
    );

    const cover = outline(
      x, y,
      w, h,
      color, 0.65, 1.8
    );

    cover.setFill(color, 0.18);

    const spine = rect(
      x - w / 2 + w * 0.075,
      y,
      w * 0.11,
      h * 0.90,
      color, 0.88, 0
    );

    return new M.VGroup(
      halo,
      cover,
      spine,

      at(
        name,
        P ? 17 : 15,
        color,
        x + 0.035,
        y + h * 0.16,
        false, w * 0.76
      ),

      line(
        pos(
          x - w * 0.25,
          y - h * 0.10
        ),

        pos(
          x + w * 0.32,
          y - h * 0.10
        ),

        color, 1.4
      ),

      line(
        pos(
          x - w * 0.25,
          y - h * 0.20
        ),

        pos(
          x + w * 0.23,
          y - h * 0.20
        ),

        color, 1.2
      )
    );
  }

  function readingTable(
    members, x, y
  ) {
    const w = 2.68;
    const h = P ? 2.17 : 1.67;

    const parts = [
      outline(
        x, y,
        w, h,
        MUTED, 0.50
      )
    ];

    members.forEach((i, j) => {
      const xx =
        x + (j - 0.5) * 1.15;

      const yy =
        y + (P ? 0.38 : 0.30);

      parts.push(
        readerIcon(i, xx, yy, 0.87),

        at(
          READERS[i],
          P ? 18 : 16,
          READER_COLORS[i],
          xx,
          yy - 0.47
        )
      );
    });

    parts.push(
      line(
        pos(x - 1.08, y - 0.56),
        pos(x + 1.08, y - 0.56),
        MUTED, 2.5
      )
    );

    return new M.VGroup(...parts);
  }

  function introPicture() {
    const y = P ? -0.40 : -0.30;

    return new M.VGroup(
      at(
        'BOOKSHOP READING GROUPS',
        P ? 22 : 19,
        INK,
        CX,
        P ? 1.32 : 1.30,
        false, MAIN_W - 0.3
      ),

      readingTable(
        [0, 1],
        CX - 1.62,
        y
      ),

      readingTable(
        [2, 3],
        CX + 1.62,
        y
      ),

      note(
        'How should we choose the groups?',
        GREEN,
        P ? -3.35 : -1.79
      )
    );
  }

  // ------------------------------------------------------------
  // 0: organise reading groups.
  // ------------------------------------------------------------

  const intro = introPicture();

  await until(S(0));
  setStage(1.2, -1.0, -1.45);

  await play(
    ...scene(intro),
    new M.FadeIn(roster),

    ...say('ORGANISE SMALL READING GROUPS')
  );

  // ------------------------------------------------------------
  // 1: use friendships to help choose groups.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...fbox([
      ['Our question', GREEN],
      'Can existing friendships',
      'help us choose groups?'
    ], GREEN),

    ...say('CAN FRIENDSHIPS HELP US CHOOSE?', GREEN)
  );

  // ------------------------------------------------------------
  // Friendship graph.
  //
  // The reader order never changes.
  // All friendships are undirected.
  //
  // Reader nodes retain their identities as community
  // boundaries are added, removed and transformed.
  // ------------------------------------------------------------

  const MAIN_GRAPH_Y =
    P ? -0.55 : -0.45;

  const GRAPH_SP =
    P ? 1.76 : 1.76;

  const MAIN_NODE_R =
    P ? 0.38 : 0.35;

  function graphPositions(y, spacing) {
    return READERS.map((_, i) =>
      pos(
        CX + (i - 1.5) * spacing,
        y
      )
    );
  }

  const MAIN_POS =
    graphPositions(
      MAIN_GRAPH_Y,
      GRAPH_SP
    );

  function readerNode(
    i, p,
    r = MAIN_NODE_R
  ) {
    const color =
      READER_COLORS[i];

    const x = p[0];
    const y = p[1];

    return new M.VGroup(
      circle(
        x, y,
        r * 1.18,
        color, 0.10, 1
      ),

      circle(
        x, y,
        r,
        color, 0.18, 2.2
      ),

      at(
        READERS[i],
        P ? 20 : 18,
        color,
        x, y,
        false, r * 1.75
      )
    );
  }

  function edgeObject(
    k, positions,
    radius,
    color = MUTED,
    width = 3
  ) {
    const [i, j] =
      EDGES[k];

    const a =
      positions[i];

    const b =
      positions[j];

    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const d =
      Math.hypot(dx, dy);

    const pad =
      radius + 0.015;

    const start = pos(
      a[0] + dx / d * pad,
      a[1] + dy / d * pad
    );

    const end = pos(
      b[0] - dx / d * pad,
      b[1] - dy / d * pad
    );

    return new M.VGroup(
      line(
        start, end,
        color,
        width + 2
      ),

      line(
        start, end,
        color,
        Math.max(1, width - 1)
      )
    );
  }

  function communityBoundary(
    members,
    positions,
    radius,
    color,
    compact = false
  ) {
    const first =
      positions[members[0]];

    const last =
      positions[
        members[members.length - 1]
      ];

    const x =
      (first[0] + last[0]) / 2;

    const y =
      (first[1] + last[1]) / 2;

    const padding =
      compact ? 0.16 : 0.24;

    if (members.length === 1) {
      return circle(
        x, y,
        radius + padding,
        color, 0, 2
      );
    }

    // Draw an oval by joining two semicircles and two
    // straight sections. Every part is placed independently.

    const outerR =
      radius + padding;

    const leftX =
      first[0];

    const rightX =
      last[0];

    const leftArc = new M.Arc({
      radius: outerR,
      startAngle: Math.PI / 2,
      angle: Math.PI,
      color,
      strokeWidth: 2.4
    });

    leftArc.moveTo(pos(
      leftX - outerR / 2,
      y
    ));

    const rightArc = new M.Arc({
      radius: outerR,
      startAngle: -Math.PI / 2,
      angle: Math.PI,
      color,
      strokeWidth: 2.4
    });

    rightArc.moveTo(pos(
      rightX + outerR / 2,
      y
    ));

    const top = line(
      pos(leftX, y + outerR),
      pos(rightX, y + outerR),
      color, 2.4
    );

    const bottom = line(
      pos(leftX, y - outerR),
      pos(rightX, y - outerR),
      color, 2.4
    );

    return new M.VGroup(
      leftArc,
      rightArc,
      top,
      bottom
    );
  }

  function partitionColor(
    members
  ) {
    if (members.length === N) {
      return PURPLE;
    }

    if (members.length === 1) {
      return READER_COLORS[
        members[0]
      ];
    }

    return members.includes(0)
      ? GROUP_LEFT
      : GROUP_RIGHT;
  }

  function groupBoundaries(
    partition,
    positions = MAIN_POS,
    radius = MAIN_NODE_R,
    compact = false
  ) {
    return partition.map(members =>
      communityBoundary(
        members,
        positions,
        radius,
        partitionColor(members),
        compact
      )
    );
  }

  function groupName(
    members,
    positions,
    y,
    color,
    size = 17
  ) {
    const xs =
      members.map(i =>
        positions[i][0]
      );

    return at(
      members
        .map(i => READERS[i])
        .join(' + '),

      size,
      color,

      sum(xs) / xs.length,

      y,
      false,
      members.length === 1
        ? 1.2
        : members.length === 2
          ? 2.80
          : 6.1
    );
  }

  let graphNodes =
    READERS.map((_, i) =>
      readerNode(
        i,
        MAIN_POS[i]
      )
    );

  let graphEdges =
    EDGES.map((_, k) =>
      edgeObject(
        k,
        MAIN_POS,
        MAIN_NODE_R,
        MUTED,
        2.6
      )
    );

  const graphTitle = at(
    'FRIENDSHIP NETWORK',
    P ? 21 : 18,
    INK,
    CX,
    P ? 2.2 : 1.18,
    true
  );

  // ------------------------------------------------------------
  // 2: introduce the four readers.
  // ------------------------------------------------------------

  await until(S(2));
  setStage(1.15, -0.55, -1.9);

  await play(
    ...scene(graphTitle),

    ...enterLagged(
      graphNodes,
      0.19, 1.25
    ),

    ...fbox([
      ['Four readers', INK],
      ['Ana, Ben', CYAN],
      ['Cara, Dan', AMBER]
    ]),

    ...say('ANA, BEN, CARA AND DAN')
  );

  // ------------------------------------------------------------
  // 3: Ana is friends with Ben.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...enter(graphEdges[0]),

    ...fbox([
      ['Friendship 1', INK],
      ['Ana — Ben', CYAN]
    ]),

    ...say('ANA AND BEN ARE FRIENDS')
  );

  // ------------------------------------------------------------
  // 4: Ben is friends with Cara.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...enter(graphEdges[1]),

    ...fbox([
      ['Friendship 2', INK],
      ['Ben — Cara', BLUE]
    ], BLUE),

    ...say('BEN AND CARA ARE FRIENDS', BLUE)
  );

  // ------------------------------------------------------------
  // 5: Cara is friends with Dan.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...enter(graphEdges[2]),

    ...fbox([
      ['Friendship 3', INK],
      ['Cara — Dan', ORANGE],
      '3 friendships altogether'
    ], ORANGE),

    ...say('CARA AND DAN ARE FRIENDS', ORANGE)
  );

  // ------------------------------------------------------------
  // 6–7: draw the first two community boundaries.
  // ------------------------------------------------------------

  const leftBoundary =
    communityBoundary(
      [0, 1],
      MAIN_POS,
      MAIN_NODE_R,
      GROUP_LEFT
    );

  const rightBoundary =
    communityBoundary(
      [2, 3],
      MAIN_POS,
      MAIN_NODE_R,
      GROUP_RIGHT
    );

  const groupLabelY =
    MAIN_GRAPH_Y + 0.92;

  const leftName =
    groupName(
      [0, 1],
      MAIN_POS,
      groupLabelY,
      GROUP_LEFT
    );

  const rightName =
    groupName(
      [2, 3],
      MAIN_POS,
      groupLabelY,
      GROUP_RIGHT
    );

  await until(S(6));

  await play(
    ...enter(
      leftBoundary,
      leftName
    ),

    ...fbox([
      ['Group 1', GROUP_LEFT],
      'Ana + Ben'
    ]),

    ...say('GROUP 1: ANA AND BEN')
  );

  await until(S(7));

  await play(
    ...enter(
      rightBoundary,
      rightName
    ),

    ...fbox([
      ['Group 1: Ana + Ben', GROUP_LEFT],
      ['Group 2: Cara + Dan', GROUP_RIGHT]
    ], GROUP_RIGHT),

    ...say('GROUP 2: CARA AND DAN', GROUP_RIGHT)
  );

  // ------------------------------------------------------------
  // 8: two friendships stay inside groups.
  // ------------------------------------------------------------

  function setGraphEdge(
    k, color, width = 3.2
  ) {
    return new M.Transform(
      graphEdges[k],

      edgeObject(
        k,
        MAIN_POS,
        MAIN_NODE_R,
        color,
        width
      ),

      { runTime: 0.60 }
    );
  }

  const internalTag = tagAt(
    '2 INSIDE',
    OBSERVED,
    CX - 1.52,
    P ? -2.2 : -1.77,
    18,
    2.75
  );

  await until(S(8));

  await play(
    setGraphEdge(0, OBSERVED, 4),
    setGraphEdge(2, OBSERVED, 4),

    ...enter(internalTag),

    ...fbox([
      ['Internal friendships', OBSERVED],
      'Ana — Ben',
      'Cara — Dan',
      ['Count = 2', OBSERVED]
    ], OBSERVED),

    ...say('TWO FRIENDSHIPS STAY INSIDE', OBSERVED)
  );

  // ------------------------------------------------------------
  // 9: one friendship crosses the boundary.
  // ------------------------------------------------------------

  const crossingTag = tagAt(
    '1 CROSSING',
    CROSSING,
    CX + 1.52,
    P ? -2.2 : -1.77,
    18,
    2.75
  );

  await until(S(9));

  await play(
    setGraphEdge(1, CROSSING, 4),

    ...enter(crossingTag),

    ...fbox([
      ['Between groups', CROSSING],
      'Ben — Cara',
      ['Count = 1', CROSSING]
    ], CROSSING),

    ...say('ONLY ONE FRIENDSHIP CROSSES', CROSSING)
  );

  // ------------------------------------------------------------
  // 10: how can we measure whether this is a good grouping?
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...fbox([
      ['Looks promising', GREEN],
      '2 friendships inside',
      '1 friendship between',
      'But how good is this?'
    ], GREEN),

    ...say('HOW GOOD ARE THESE GROUPS?', GREEN)
  );

  // ------------------------------------------------------------
  // 11–13: large groups may have many internal edges
  // simply because they are large.
  //
  // Use the same graph, not an invented replacement network.
  // ------------------------------------------------------------

  const allBoundary =
    communityBoundary(
      [0, 1, 2, 3],
      MAIN_POS,
      MAIN_NODE_R,
      EXPECTED
    );

  const allName =
    groupName(
      [0, 1, 2, 3],
      MAIN_POS,
      groupLabelY,
      EXPECTED
    );

  const allInside = tagAt(
    '3 INSIDE · 0 CROSSING',
    GREEN,
    CX,
    P ? -2.2 : -1.77,
    18
  );

  await until(S(11));

  await play(
    ...leave(
      leftBoundary,
      rightBoundary,
      leftName,
      rightName,
      internalTag,
      crossingTag
    ),

    ...enter(
      allBoundary,
      allName,
      allInside
    ),

    setGraphEdge(1, OBSERVED, 4),

    ...fbox([
      ['One large group', EXPECTED],
      'All four readers',
      ['3 internal friendships', GREEN]
    ], EXPECTED),

    ...say('A LARGE GROUP CAN HAVE MORE INTERNAL LINKS', EXPECTED)
  );

  await until(S(12));

  await play(
    ...fbox([
      ['Why are there 3 inside?', AMBER],
      'Every reader is included',
      'Every edge must be inside',
      'That alone proves little'
    ], AMBER),

    ...say('MORE LINKS CAN JUST MEAN A LARGER GROUP', AMBER)
  );

  const chanceQuestion = note(
    'Observed connections compared with chance',
    EXPECTED,
    P ? -2.95 : -2.36
  );

  await until(S(13));

  await play(
    ...enter(chanceQuestion),

    ...fbox([
      ['Compare two shares', GREEN],
      ['Observed inside', OBSERVED],
      ['Expected inside by chance', EXPECTED]
    ], GREEN),

    ...say('COMPARE OBSERVED WITH EXPECTED', GREEN)
  );

  // ------------------------------------------------------------
  // 14–17: count friendship ends.
  //
  // Each undirected edge has two ends.
  // Every end is attached to one reader.
  // ------------------------------------------------------------

  graphNodes = READERS.map((_, i) =>
    readerNode(i, MAIN_POS[i])
  );

  graphEdges = EDGES.map((_, k) =>
    edgeObject(
      k,
      MAIN_POS,
      MAIN_NODE_R,
      MUTED, 2.7
    )
  );

  const endCountTitle = at(
    '3 FRIENDSHIP LINES',
    P ? 21 : 18,
    INK,
    CX,
    P ? 2.2 : 1.18,
    true
  );

  await until(S(14));

  await play(
    ...scene(
      endCountTitle,
      ...graphEdges,
      ...graphNodes
    ),

    ...fbox([
      ['Our original network', INK],
      '4 readers',
      ['3 friendships', CYAN]
    ]),

    ...say('LOOK AT THE THREE FRIENDSHIP LINES')
  );

  function endMarker(k, side) {
    const edge =
      EDGES[k];

    const i =
      edge[side];

    const j =
      edge[1 - side];

    const a =
      MAIN_POS[i];

    const b =
      MAIN_POS[j];

    const sign =
      Math.sign(b[0] - a[0]);

    const p = pos(
      a[0] +
        sign * (MAIN_NODE_R + 0.12),

      a[1]
    );

    return new M.VGroup(
      glowDot(
        p,
        READER_COLORS[i],
        0.10
      ),

      circle(
        p[0], p[1],
        0.15,
        READER_COLORS[i],
        0, 1.4
      )
    );
  }

  const END_MARKERS =
    EDGES.map((_, k) => [
      endMarker(k, 0),
      endMarker(k, 1)
    ]);

  const firstEndLabel = at(
    'Two ends',
    P ? 18 : 16,
    CYAN,
    (
      MAIN_POS[0][0] +
      MAIN_POS[1][0]
    ) / 2,

    MAIN_GRAPH_Y + 0.55
  );

  await until(S(15));

  await play(
    ...enter(
      ...END_MARKERS[0],
      firstEndLabel
    ),

    ...fbox([
      ['One friendship', INK],
      ['1 end at Ana', CYAN],
      ['1 end at Ben', BLUE],
      '2 ends in total'
    ]),

    ...say('EACH LINE HAS TWO ENDS')
  );

  const totalEndsTag = tagAt(
    '3 × 2 = 6 ENDS',
    GREEN,
    CX,
    P ? -2.30 : -1.70,
    20
  );

  await until(S(16));

  await play(
    ...leave(firstEndLabel),

    ...enterLagged(
      END_MARKERS
        .slice(1)
        .flat(),

      0.13, 0.9
    ),

    ...enter(totalEndsTag),

    ...fbox([
      ['3 friendship lines', INK],
      '2 ends per line',
      ['3 × 2 = 6 ends', GREEN]
    ], GREEN),

    ...say('SIX FRIENDSHIP ENDS IN TOTAL', GREEN)
  );

  function degreeLabel(i) {
    const p =
      MAIN_POS[i];

    return new M.VGroup(
      at(
        DEGREE[i],
        P ? 28 : 24,
        READER_COLORS[i],
        p[0],
        p[1] - 0.77,
        true
      ),

      at(
        DEGREE[i] === 1
          ? 'end'
          : 'ends',

        P ? 15 : 13,
        MUTED,
        p[0],
        p[1] - 1.08
      )
    );
  }

  const degreeLabels =
    READERS.map((_, i) =>
      degreeLabel(i)
    );

  await until(S(17));

  await play(
    ...enterLagged(
      degreeLabels,
      0.13, 1.1
    ),

    ...fbox([
      ['Number of ends', INK],
      ['Ana: 1    Ben: 2', CYAN],
      ['Cara: 2   Dan: 1', AMBER],
      ['1 + 2 + 2 + 1 = 6', GREEN]
    ], GREEN),

    ...say('DEGREES: 1, 2, 2, 1', GREEN)
  );

  // ------------------------------------------------------------
  // 18–20: the random-end comparison model.
  //
  // One card per friendship end.
  // All six cards are equally likely to be selected.
  //
  // Draw 1, return it, draw 2.
  // Returning the card keeps the two selections independent.
  // ------------------------------------------------------------

  function endCard(
    endIndex,
    x, y,
    w = 0.86,
    h = 0.92
  ) {
    const entry =
      ENDS[endIndex];

    const i =
      entry.reader;

    const color =
      READER_COLORS[i];

    const body = outline(
      x, y,
      w, h,
      color, 0.76, 1.7
    );

    return new M.VGroup(
      body,

      rect(
        x,
        y + h / 2 - 0.08,
        w * 0.80,
        0.055,
        color, 0.95, 0
      ),

      at(
        READERS[i],
        P ? 17 : 15,
        color,
        x,
        y + 0.09,
        false, w - 0.10
      ),

      at(
        `End ${endIndex + 1}`,
        P ? 12 : 11,
        MUTED,
        x,
        y - 0.22,
        false, w - 0.08
      )
    );
  }

  const CARD_ROW_Y =
    P ? 0.56 : 0.61;

  const CARD_SP =
    P ? 1.04 : 1.04;

  const cardX = i =>
    CX + (i - 2.5) * CARD_SP;

  function bagPicture() {
    const x = CX;
    const y = P ? -1.76 : -1.18;

    const w = 2.72;
    const h = P ? 1.73 : 1.34;

    const mouth = new M.VGroup(
      line(
        pos(x - 0.67, y + h / 2),
        pos(x + 0.67, y + h / 2),
        EXPECTED, 3.3
      ),

      line(
        pos(x - 0.67, y + h / 2),
        pos(x - 0.85, y + h / 2 - 0.28),
        EXPECTED, 2.6
      ),

      line(
        pos(x + 0.67, y + h / 2),
        pos(x + 0.85, y + h / 2 - 0.28),
        EXPECTED, 2.6
      )
    );

    const bag = outline(
      x, y,
      w, h,
      EXPECTED, 0.58
    );

    return new M.VGroup(
      bag,
      mouth,

      at(
        'BAG',
        P ? 23 : 20,
        EXPECTED,
        x,
        y + 0.22,
        true
      ),

      at(
        '6 equally likely cards',
        P ? 16 : 14,
        INK,
        x,
        y - 0.23,
        false, w - 0.20
      )
    );
  }

  const endCards =
    ENDS.map((_, i) =>
      endCard(
        i,
        cardX(i),
        CARD_ROW_Y
      )
    );

  const bag = bagPicture();

  const bagArrows = new M.VGroup(
    arrow(
      pos(
        CX - 1.26,
        CARD_ROW_Y - 0.55
      ),

      pos(
        CX - 0.62,
        P ? -0.82 : -0.40
      ),

      EXPECTED, 2.3
    ),

    arrow(
      pos(
        CX + 1.26,
        CARD_ROW_Y - 0.55
      ),

      pos(
        CX + 0.62,
        P ? -0.82 : -0.40
      ),

      EXPECTED, 2.3
    )
  );

  await until(S(18));
  setStage(1.17, 1.02, 1.3);

  await play(
    ...scene(
      bag,
      bagArrows
    ),

    ...enterLagged(
      endCards,
      0.12, 1.35
    ),

    ...fbox([
      ['One card per end', EXPECTED],
      'Ana, Ben, Ben,',
      'Cara, Cara, Dan',
      ['6 cards in the bag', EXPECTED]
    ], EXPECTED),

    ...say('PUT SIX FRIENDSHIP-END CARDS IN A BAG', EXPECTED)
  );

  function drawSlot(
    x, y,
    title
  ) {
    return new M.VGroup(
      outline(
        x, y,
        1.30, 1.28,
        MUTED, 0.35
      ),

      at(
        title,
        P ? 16 : 14,
        INK,
        x,
        y + 0.85,
        false, 1.50
      )
    );
  }

  const DRAW_Y =
    P ? -2.25 : -1.15;

  const draw1X = CX - 2.48;
  const draw2X = CX + 2.48;

  const drawSlots = [
    drawSlot(
      draw1X, DRAW_Y,
      'First choice'
    ),

    drawSlot(
      draw2X, DRAW_Y,
      'Second choice'
    )
  ];

  const drawLeft = arrow(
    pos(
      CX - 1.42,
      DRAW_Y + 0.04
    ),

    pos(
      draw1X + 0.72,
      DRAW_Y + 0.04
    ),

    EXPECTED, 2.4
  );

  const drawRight = arrow(
    pos(
      CX + 1.42,
      DRAW_Y + 0.04
    ),

    pos(
      draw2X - 0.72,
      DRAW_Y + 0.04
    ),

    EXPECTED, 2.4
  );

  const returnArrow = arrow(
    pos(
      draw1X + 0.58,
      DRAW_Y - 0.85
    ),

    pos(
      CX - 0.43,
      DRAW_Y - 0.85
    ),

    GREEN, 2.3
  );

  const returnLabel = at(
    'Return card',
    P ? 15 : 13,
    GREEN,
    CX - 1.45,
    DRAW_Y - 1.09
  );

  // Illustrative draws, not a claim of random sampling.
  // The same card may legally be drawn twice.

  const firstDraw =
    endCard(
      1,
      draw1X,
      DRAW_Y,
      0.94, 1.02
    );

  const secondDraw =
    endCard(
      1,
      draw2X,
      DRAW_Y,
      0.94, 1.02
    );

  await until(S(19));

  await play(
    ...leave(bagArrows),

    ...enter(
      ...drawSlots,
      drawLeft
    ),

    ...fbox([
      ['Draw one card', EXPECTED],
      'Return it to the bag',
      'Then draw another',
      'Six choices each time'
    ], EXPECTED),

    ...say('PICK, RETURN, THEN PICK AGAIN', EXPECTED)
  );

  await play(
    ...enter(firstDraw),

    new M.Indicate(
      endCards[1],
      {
        color: BLUE,
        runTime: 0.5
      }
    )
  );

  await play(
    ...enter(
      returnArrow,
      returnLabel
    ),

    ...leave(firstDraw)
  );

  await play(
    ...enter(
      drawRight,
      secondDraw
    )
  );

  await until(S(20));

  await play(
    ...fbox([
      ['Chance comparison model', EXPECTED],
      'Two independent choices',
      'Each from the same six ends',
      'Repeated choices allowed'
    ], EXPECTED),

    ...say('A SIMPLE MODEL OF CONNECTIONS BY CHANCE', EXPECTED)
  );

  // ------------------------------------------------------------
  // 21–22: Ana and Ben own three of the six ends.
  //
  // Show the full set of cards.
  // Each reader's identity remains visible.
  // ------------------------------------------------------------

  function sixEndPicture() {
    const cards = ENDS.map((_, i) =>
      endCard(
        i,
        cardX(i),
        P ? -0.28 : -0.22,
        0.91,
        P ? 1.28 : 1.04
      )
    );

    const title = at(
      'SIX EQUALLY LIKELY FRIENDSHIP ENDS',
      P ? 18 : 16,
      INK,
      CX,
      P ? 1.16 : 1.10,
      false,
      MAIN_W - 0.30
    );

    return {
      cards,
      title
    };
  }

  const endPicture =
    sixEndPicture();

  const END_ROW_Y =
    P ? -0.28 : -0.22;

  const END_CARD_H =
    P ? 1.28 : 1.04;

  function endGroupOutline(
    a, b,
    color
  ) {
    const left =
      cardX(a) - 0.49;

    const right =
      cardX(b) + 0.49;

    return outline(
      (left + right) / 2,
      END_ROW_Y,
      right - left,
      END_CARD_H + 0.19,
      color, 0, 2.5
    );
  }

  const leftEndGroup =
    endGroupOutline(
      0, 2, GROUP_LEFT
    );

  const rightEndGroup =
    endGroupOutline(
      3, 5, GROUP_RIGHT
    );

  const leftEndsLabel = at(
    'Ana + Ben: 3 ends',
    P ? 19 : 17,
    GROUP_LEFT,
    cardX(1),
    END_ROW_Y -
      END_CARD_H / 2 -
      0.43,

    false, 3.04
  );

  const rightEndsLabel = at(
    'Cara + Dan: 3 ends',
    P ? 19 : 17,
    GROUP_RIGHT,
    cardX(4),
    END_ROW_Y -
      END_CARD_H / 2 -
      0.43,

    false, 3.04
  );

  await until(S(21));
  setStage(1.2, 1.31, 1.4);

  await play(
    ...scene(
      endPicture.title,
      ...endPicture.cards,
      leftEndGroup,
      leftEndsLabel
    ),

    ...fbox([
      ['Ana + Ben', GROUP_LEFT],
      'Ana owns 1 end',
      'Ben owns 2 ends',
      ['Together: 3 of 6', GROUP_LEFT]
    ]),

    ...say('ANA AND BEN OWN THREE ENDS')
  );

  const halfChance = tagAt(
    '3 ÷ 6 = 1/2',
    GROUP_LEFT,
    cardX(1),
    P ? -3.0 : -1.96,
    20,
    2.85
  );

  await until(S(22));

  await play(
    ...enter(halfChance),

    ...fbox([
      ['Chance per choice', GROUP_LEFT],
      '3 matching cards',
      '6 possible cards',
      ['3 ÷ 6 = 1/2 = 50%', GROUP_LEFT]
    ]),

    ...say('EACH CHOICE HAS A ONE-HALF CHANCE')
  );

  // ------------------------------------------------------------
  // Probability grid.
  //
  // Six possible first choices × six possible second choices.
  // All 36 ordered outcomes are equally likely.
  //
  // The top-left 3 × 3 square corresponds to both choices
  // landing in Ana and Ben's group.
  //
  // The bottom-right 3 × 3 square corresponds to both choices
  // landing in Cara and Dan's group.
  //
  // Neither selection changes the available cards.
  // ------------------------------------------------------------

  const CELL =
    P ? 0.65 : 0.46;

  const GRID_CX =
    CX + 0.28;

  const GRID_CY =
    P ? -1.07 : -0.55;

  const gx = j =>
    GRID_CX + (j - 2.5) * CELL;

  const gy = i =>
    GRID_CY + (2.5 - i) * CELL;

  function probabilityCell(
    row, col,
    selected = false,
    color = MUTED
  ) {
    const x = gx(col);
    const y = gy(row);

    const r = rect(
      x, y,
      CELL * 0.90,
      CELL * 0.90,
      color,
      selected ? 0.82 : 0.07,
      selected ? 1.4 : 0.8
    );

    const d = glowDot(
      pos(x, y),
      selected ? INK : MUTED,

      selected
        ? CELL * 0.09
        : CELL * 0.055
    );

    return new M.VGroup(
      r, d
    );
  }

  function probabilityFrame() {
    const parts = [];

    const left =
      gx(0) - CELL * 0.65;

    const top =
      gy(0) + CELL * 0.66;

    const labelSize =
      P ? 12 : 11;

    for (let i = 0; i < 6; i++) {
      const reader =
        ENDS[i].reader;

      const color =
        READER_COLORS[reader];

      parts.push(
        at(
          READERS[reader],
          labelSize,
          color,
          gx(i),
          top,
          false,
          CELL * 0.94
        ),

        at(
          READERS[reader],
          labelSize,
          color,
          left - 0.38,
          gy(i),
          false,
          0.72
        )
      );
    }

    parts.push(
      at(
        'Second choice →',
        P ? 17 : 15,
        INK,
        GRID_CX,
        top + 0.42
      ),

      at(
        'First choice ↓',
        P ? 16 : 14,
        INK,
        left - 0.43,
        top + 0.42,
        false,
        P ? 1.60 : 1.35
      ),

      line(
        pos(
          gx(2) + CELL / 2,
          gy(5) - CELL / 2
        ),

        pos(
          gx(2) + CELL / 2,
          gy(0) + CELL / 2
        ),

        MUTED, 1.8
      ),

      line(
        pos(
          gx(0) - CELL / 2,
          gy(2) - CELL / 2
        ),

        pos(
          gx(5) + CELL / 2,
          gy(2) - CELL / 2
        ),

        MUTED, 1.8
      )
    );

    return new M.VGroup(...parts);
  }

  const gridCells = Array.from(
    { length: END_COUNT },

    (_, i) =>
      Array.from(
        { length: END_COUNT },
        (_, j) =>
          probabilityCell(i, j)
      )
  );

  const gridFrame =
    probabilityFrame();

  function gridHighlight(
    members,
    color,
    runTime = 1.2
  ) {
    const animations = [];

    for (let i = 0; i < END_COUNT; i++) {
      for (let j = 0; j < END_COUNT; j++) {
        const a =
          ENDS[i].reader;

        const b =
          ENDS[j].reader;

        if (
          members.includes(a) &&
          members.includes(b)
        ) {
          animations.push(
            new M.Transform(
              gridCells[i][j],

              probabilityCell(
                i, j,
                true,
                color
              )
            )
          );
        }
      }
    }

    return [
      new M.LaggedStart(
        animations,
        {
          lagRatio: 0.07,
          runTime
        }
      )
    ];
  }

  function gridGroupBoundary(
    start, end,
    color
  ) {
    return outline(
      (
        gx(start) +
        gx(end)
      ) / 2,

      (
        gy(start) +
        gy(end)
      ) / 2,

      (end - start + 1) *
        CELL + 0.03,

      (end - start + 1) *
        CELL + 0.03,

      color, 0, 2.4
    );
  }

  // ------------------------------------------------------------
  // 23: half of one-half equals one-quarter.
  //
  // Colour 9 of the 36 equally likely ordered outcomes.
  // ------------------------------------------------------------

  const probability25 = note(
    '9 of 36 outcomes = 1/4 = 25%',
    GROUP_LEFT,
    P ? -3.52 : -2.30
  );

  await until(S(23));
  setStage(1.2, -1.05, -1.5, -0.57);

  await play(
    ...scene(
      gridFrame,
      ...gridCells.flat()
    ),

    ...fbox([
      ['Two independent choices', EXPECTED],
      '1/2 × 1/2',
      ['= 1/4 = 25%', GROUP_LEFT]
    ], EXPECTED),

    ...say('HALF OF ONE-HALF IS ONE-QUARTER', EXPECTED)
  );

  await play(
    ...gridHighlight(
      [0, 1],
      GROUP_LEFT,
      1.0
    ),

    ...enter(probability25)
  );

  // ------------------------------------------------------------
  // 24: both selections land inside Ana and Ben's group.
  // ------------------------------------------------------------

  const gridLeftBoundary =
    gridGroupBoundary(
      0, 2, GROUP_LEFT
    );

  await until(S(24));

  await play(
    ...enter(gridLeftBoundary),

    ...fbox([
      ['Both ends in Ana + Ben', GROUP_LEFT],
      '3 possible first choices',
      '3 possible second choices',
      ['9 ÷ 36 = 25%', GROUP_LEFT]
    ]),

    ...say('BOTH CHOICES IN ANA AND BEN’S GROUP')
  );

  // ------------------------------------------------------------
  // 25: Cara and Dan also have probability 25%.
  // ------------------------------------------------------------

  const gridRightBoundary =
    gridGroupBoundary(
      3, 5, GROUP_RIGHT
    );

  const probabilityBoth = note(
    'Ana + Ben: 25%     Cara + Dan: 25%',
    EXPECTED,
    P ? -3.52 : -2.30
  );

  await until(S(25));

  await play(
    ...gridHighlight(
      [2, 3],
      GROUP_RIGHT,
      1.2
    ),

    ...leave(probability25),

    ...enter(
      gridRightBoundary,
      probabilityBoth
    ),

    ...fbox([
      ['Cara + Dan', GROUP_RIGHT],
      '3 of the 6 ends',
      '1/2 × 1/2',
      ['= 1/4 = 25%', GROUP_RIGHT]
    ], GROUP_RIGHT),

    ...say('THE SECOND GROUP ALSO HAS 25%', GROUP_RIGHT)
  );

  // ------------------------------------------------------------
  // 26: the two internal outcomes are mutually exclusive.
  //
  // Add their probabilities:
  // 9/36 + 9/36 = 18/36 = 50%.
  // ------------------------------------------------------------

  const expected50 = note(
    '18 of 36 outcomes = 50% inside groups',
    EXPECTED,
    P ? -3.52 : -2.30
  );

  await until(S(26));

  await play(
    ...leave(probabilityBoth),

    ...enter(expected50),

    ...fbox([
      ['Expected internal share', EXPECTED],
      ['25% + 25%', INK],
      '= 18 ÷ 36',
      ['= 50%', EXPECTED]
    ], EXPECTED),

    ...say('EXPECTED INSIDE GROUPS: 50%', EXPECTED)
  );

  // ------------------------------------------------------------
  // Graph snapshot helper.
  //
  // Construct new objects before displaying them.
  // These snapshots are separate from the animated graph
  // used in the search section.
  // ------------------------------------------------------------

  function graphSnapshot(
    partition,
    positions,
    radius,
    compact = false
  ) {
    const edges = EDGES.map(
      (edge, k) =>
        edgeObject(
          k,
          positions,
          radius,

          isInternal(
            partition, edge
          )
            ? OBSERVED
            : CROSSING,

          compact ? 2.4 : 3.4
        )
    );

    const boundaries =
      groupBoundaries(
        partition,
        positions,
        radius,
        compact
      );

    const nodes =
      READERS.map((_, i) =>
        readerNode(
          i,
          positions[i],
          radius
        )
      );

    return new M.VGroup(
      ...boundaries,
      ...edges,
      ...nodes
    );
  }

  // ------------------------------------------------------------
  // 27: in the actual graph, two of three edges are internal.
  // ------------------------------------------------------------

  const observedGraph =
    graphSnapshot(
      PARTITIONS[2],
      MAIN_POS,
      MAIN_NODE_R
    );

  const actualLabels =
    new M.VGroup(
      groupName(
        [0, 1],
        MAIN_POS,
        groupLabelY,
        GROUP_LEFT
      ),

      groupName(
        [2, 3],
        MAIN_POS,
        groupLabelY,
        GROUP_RIGHT
      )
    );

  const observedCount = tagAt(
    '2 OF 3 FRIENDSHIPS INSIDE',
    OBSERVED,
    CX,
    P ? -3.2 : -1.76,
    18
  );

  await until(S(27));
  setStage(1.15, -1.41, -1.5);

  await play(
    ...scene(
      observedGraph,
      actualLabels,
      observedCount
    ),

    ...fbox([
      ['Observed internal share', OBSERVED],
      '2 internal friendships',
      '3 friendships in total',
      ['= 2 ÷ 3', OBSERVED]
    ], OBSERVED),

    ...say('OBSERVED: TWO OUT OF THREE', OBSERVED)
  );

  // ------------------------------------------------------------
  // Observed-versus-expected proportional bars.
  //
  // Equal overall bar lengths.
  // The filled lengths are exact proportions.
  // ------------------------------------------------------------

  const SHARE_W =
    P ? 5.45 : 5.20;

  const SHARE_LEFT =
    CX - SHARE_W / 2 - 0.20;

  const SHARE_H =
    P ? 0.7 : 0.34;

  const SHARE_YS = P
    ? [0.35, -3.2]
    : [0.72, -1.0];

  function shareBar(
    title, value,
    y, color,
    width = SHARE_W,
    left = SHARE_LEFT,
    height = SHARE_H,
    label = null
  ) {
    const filled =
      width * value;

    const parts = [
      at(
        title,
        P ? 20 : 17,
        color,
        left + width / 2,
        y + 0.52,
        false,
        width + 0.25
      ),

      rect(
        left + width / 2,
        y,
        width,
        height,
        CARD, 0.78, 0
      )
    ];

    if (filled > 1e-9) {
      parts.push(
        rect(
          left + filled / 2,
          y,
          filled,
          height + 0.075,
          color, 0.13, 0
        ),

        rect(
          left + filled / 2,
          y,
          filled,
          height,
          color, 0.85, 1
        )
      );
    }

    parts.push(
      outline(
        left + width / 2,
        y,
        width + 0.035,
        height + 0.04,
        MUTED, 0, 1
      ),

      at(
        label === null
          ? pct(value)
          : label,

        P ? 23 : 20,
        color,
        left + width + 0.49,
        y,
        true,
        1.12
      )
    );

    return new M.VGroup(...parts);
  }

  function shareComparison(result) {
    return [
      shareBar(
        'Observed inside groups',
        result.observed,
        SHARE_YS[0],
        OBSERVED
      ),

      shareBar(
        'Expected inside groups',
        result.expected,
        SHARE_YS[1],
        EXPECTED
      )
    ];
  }

  const compareShares =
    shareComparison(BEST);

  // ------------------------------------------------------------
  // 28: about 67% observed versus 50% expected.
  // ------------------------------------------------------------

  await until(S(28));
  setStage(null);

  await play(
    ...scene(...compareShares),

    ...fbox([
      ['Observed = 2/3', OBSERVED],
      ['≈ 66.7%', OBSERVED],
      ['Expected = 1/2', EXPECTED],
      ['= 50%', EXPECTED]
    ], GREEN),

    ...say('67% OBSERVED IS ABOVE 50% EXPECTED', GREEN)
  );

  // ------------------------------------------------------------
  // 29: modularity is the difference between the two shares.
  //
  // The highlighted excess has width proportional to
  // observed − expected, not observed / expected.
  // ------------------------------------------------------------

  function excessBracket(result) {
    const x1 =
      SHARE_LEFT +
      SHARE_W * result.expected;

    const x2 =
      SHARE_LEFT +
      SHARE_W * result.observed;

    const y1 =
      SHARE_YS[0];

    const y2 =
      SHARE_YS[1];

    const bracketY =
      (y1 + y2) / 2;

    const color =
      result.q >= 0
        ? GREEN
        : PINK;

    return new M.VGroup(
      dashed(
        pos(x1, y2 + SHARE_H / 2),
        pos(x1, y1 - SHARE_H / 2),
        EXPECTED, 1.6
      ),

      dashed(
        pos(x2, y1 - SHARE_H / 2),
        pos(x2, bracketY),
        OBSERVED, 1.6
      ),

      line(
        pos(x1, bracketY),
        pos(x2, bracketY),
        color, 2.5
      ),

      line(
        pos(x1, bracketY - 0.09),
        pos(x1, bracketY + 0.09),
        color, 2
      ),

      line(
        pos(x2, bracketY - 0.09),
        pos(x2, bracketY + 0.09),
        color, 2
      ),

      at(
        fixed(result.q),
        P ? 18 : 16,
        color,
        (x1 + x2) / 2,
        bracketY + 0.24,
        true
      )
    );
  }

  const modularityGap =
    excessBracket(BEST);

  await until(S(29));

  await play(
    ...enter(modularityGap),

    ...fbox([
      ['Modularity', GREEN],
      ['Observed share', OBSERVED],
      ['− expected share', EXPECTED],
      ['≈ 0.167', GREEN]
    ], GREEN),

    ...say('MODULARITY = OBSERVED MINUS EXPECTED', GREEN)
  );

  // ------------------------------------------------------------
  // 30: interpret the modularity score.
  //
  // 0.167 is an excess share of about 16.7 percentage points.
  // It is not a percentage increase relative to the baseline.
  // ------------------------------------------------------------

  const excessNote = note(
    'About 16.7 percentage points above chance',
    GREEN,
    P ? -4.45 : -2.30
  );

  await until(S(30));

  await play(
    ...enter(excessNote),

    ...fbox([
      ['Positive modularity', GREEN],
      'More internal connections',
      'than our chance model expects',
      ['Excess share ≈ 0.167', GREEN]
    ], GREEN),

    ...say('MORE INTERNAL CONNECTIONS THAN EXPECTED', GREEN)
  );

  // ------------------------------------------------------------
  // 31: name community detection.
  // ------------------------------------------------------------

  const communityGraph =
    graphSnapshot(
      PARTITIONS[2],
      MAIN_POS,
      MAIN_NODE_R
    );

  const communityTag = tagAt(
    'COMMUNITY DETECTION',
    GREEN,
    CX,
    P ? -2.52 : -1.85,
    20
  );

  await until(S(31));
  setStage(1.15, -1.77, -1.6);

  await play(
    ...scene(
      communityGraph,
      communityTag,

      note(
        'Groups with stronger-than-expected internal links',
        GREEN,
        P ? -3.44 : -2.37
      )
    ),

    ...fbox([
      ['Community detection', GREEN],
      'Discover groups with',
      'strong internal connections',
      'Compare against chance'
    ], GREEN),

    ...say('COMMUNITY DETECTION', GREEN)
  );

  // ------------------------------------------------------------
  // 32–49: search for groups, one proposed join at a time.
  //
  // Main picture:
  //   upper area: the same four reader nodes and three edges
  //   lower area: observed and expected share bars
  //   lower area: growing modularity curve
  //
  // Accepted joins are green.
  // A rejected trial is shown as a separate dashed segment.
  //
  // Reader positions stay fixed; only group boundaries change.
  // ------------------------------------------------------------

  const SEARCH_Y =
    P ? 0.65 : 0.79;

  const SEARCH_SP =
    P ? 1.61 : 1.61;

  const SEARCH_R =
    P ? 0.31 : 0.29;

  const SEARCH_POS =
    graphPositions(
      SEARCH_Y,
      SEARCH_SP
    );

  const searchNodes =
    READERS.map((_, i) =>
      readerNode(
        i,
        SEARCH_POS[i],
        SEARCH_R
      )
    );

  const searchEdges =
    EDGES.map((_, k) =>
      edgeObject(
        k,
        SEARCH_POS,
        SEARCH_R,
        CROSSING,
        2.4
      )
    );

  let searchBoundaries = [];

  let partitionNow = null;

  let searchObserved = null;
  let searchExpected = null;

  let statusNow = null;
  let scoreNow = null;

  const SB_LEFT =
    P ? CX - 3.10 : CX - 3.19;

  const SB_W =
    P ? 2.70 : 2.51;

  const SB_H =
    P ? 0.28 : 0.25;

  const SB_YS = P
    ? [-1.00, -2.28]
    : [-0.55, -1.53];

  function smallShareBar(
    k, value = null
  ) {
    const color =
      k === 0 ? OBSERVED : EXPECTED;

    const y =
      SB_YS[k];

    const center =
      SB_LEFT + SB_W / 2;

    const parts = [
      at(
        k === 0
          ? 'Observed inside'
          : 'Expected inside',

        P ? 18 : 15,
        color,
        center,
        y + 0.40,
        false,
        SB_W + 0.18
      ),

      rect(
        center, y,
        SB_W, SB_H,
        CARD, 0.76, 0
      )
    ];

    if (
      value !== null &&
      value > 1e-10
    ) {
      const w =
        SB_W * value;

      parts.push(
        rect(
          SB_LEFT + w / 2,
          y,
          w, SB_H,
          color, 0.87, 1
        )
      );
    }

    parts.push(
      outline(
        center, y,
        SB_W + 0.035,
        SB_H + 0.035,
        MUTED, 0, 1
      ),

      at(
        value === null
          ? '—'
          : pct(value),

        P ? 22 : 18,
        color,
        center,
        y - 0.39,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  function searchPartitionLabel(
    partition
  ) {
    const name =
      partition
        .map(group =>
          group
            .map(i => READERS[i])
            .join(' + ')
        )
        .join(' / ');

    return at(
      name,
      P ? 17 : 15,
      INK,
      CX,
      SEARCH_Y + 0.70,
      false,
      MAIN_W - 0.40
    );
  }

  function changePartition(
    partition
  ) {
    const a = [
      ...leave(...searchBoundaries)
    ];

    searchBoundaries =
      groupBoundaries(
        partition,
        SEARCH_POS,
        SEARCH_R,
        true
      );

    a.push(
      ...enter(...searchBoundaries)
    );

    if (partitionNow) {
      a.push(
        ...leave(partitionNow)
      );
    }

    partitionNow =
      searchPartitionLabel(
        partition
      );

    a.push(
      ...enter(partitionNow)
    );

    EDGES.forEach((edge, k) => {
      a.push(
        new M.Transform(
          searchEdges[k],

          edgeObject(
            k,
            SEARCH_POS,
            SEARCH_R,

            isInternal(
              partition,
              edge
            )
              ? OBSERVED
              : CROSSING,

            2.7
          ),

          { runTime: 0.65 }
        )
      );
    });

    return a;
  }

  function updateShare(
    k, value
  ) {
    const old =
      k === 0
        ? searchObserved
        : searchExpected;

    const next =
      smallShareBar(k, value);

    const a = [];

    if (old) {
      a.push(...leave(old));
    }

    if (k === 0) {
      searchObserved = next;
    } else {
      searchExpected = next;
    }

    a.push(...enter(next));

    return a;
  }

  function status(
    text,
    color = GREEN
  ) {
    const a = [];

    if (statusNow) {
      a.push(...leave(statusNow));
    }

    statusNow = tagAt(
      text,
      color,
      CX,

      P ? -4.47 : -2.46,

      P ? 17 : 14
    );

    a.push(...enter(statusNow));

    return a;
  }

  function scoreLabel(
    q,
    color = GREEN
  ) {
    return at(
      `Q = ${fixed(q)}`,
      P ? 21 : 18,
      color,
      SB_LEFT + SB_W / 2,
      P ? -3.20 : -2.08,
      true,
      SB_W + 0.18
    );
  }

  function updateScore(
    q,
    color = GREEN
  ) {
    const a = [];

    if (scoreNow) {
      a.push(...leave(scoreNow));
    }

    scoreNow =
      scoreLabel(q, color);

    a.push(...enter(scoreNow));

    return a;
  }

  // ------------------------------------------------------------
  // Modularity chart.
  //
  // The vertical axis includes negative values.
  // Zero is a marked reference, not the bottom of the chart.
  //
  // Accepted states:
  //   Separate readers
  //   First join
  //   Second join
  //
  // Proposed but rejected state:
  //   All four together
  // ------------------------------------------------------------

  const CHART_LEFT =
    P ? CX + 0.61 : CX + 0.61;

  const CHART_RIGHT =
    P ? CX + 3.24 : CX + 3.20;

  const CHART_TOP =
    P ? -0.63 : -0.18;

  const CHART_BOTTOM =
    P ? -3.77 : -1.70;

  const Q_MIN = -0.34;
  const Q_MAX = 0.24;

  const qx = i =>
    CHART_LEFT +
    i / 3 *
      (CHART_RIGHT - CHART_LEFT);

  const qy = q =>
    CHART_BOTTOM +
    (q - Q_MIN) /
      (Q_MAX - Q_MIN) *
      (CHART_TOP - CHART_BOTTOM);

  function chartAxes() {
    const parts = [
      at(
        'Modularity',
        P ? 18 : 16,
        GREEN,
        (
          CHART_LEFT +
          CHART_RIGHT
        ) / 2,

        CHART_TOP + (P ? 0.31 : 0.25)
      ),

      line(
        pos(
          CHART_LEFT,
          CHART_BOTTOM
        ),

        pos(
          CHART_RIGHT,
          CHART_BOTTOM
        ),

        MUTED, 1.4
      ),

      line(
        pos(
          CHART_LEFT,
          CHART_BOTTOM
        ),

        pos(
          CHART_LEFT,
          CHART_TOP
        ),

        MUTED, 1.4
      )
    ];

    for (const value of [
      -0.3, -0.2, -0.1,
      0, 0.1, 0.2
    ]) {
      const y = qy(value);

      parts.push(
        line(
          pos(CHART_LEFT, y),
          pos(CHART_RIGHT, y),
          value === 0 ? MUTED : CARD,
          value === 0 ? 1.8 : 1
        ),

        at(
          fixed(value, 1),
          P ? 15 : 11,
          MUTED,
          CHART_LEFT - 0.25,
          y, true
        )
      );
    }

    for (let i = 0; i <= 3; i++) {
      parts.push(
        line(
          pos(
            qx(i),
            CHART_BOTTOM - 0.045
          ),

          pos(
            qx(i),
            CHART_BOTTOM + 0.045
          ),

          MUTED, 1
        ),

        at(
          i,
          P ? 15 : 12,
          MUTED,
          qx(i),
          CHART_BOTTOM - 0.18,
          true
        )
      );
    }

    parts.push(
      at(
        'Proposed join',
        P ? 15 : 12,
        MUTED,
        (
          CHART_LEFT +
          CHART_RIGHT
        ) / 2,

        CHART_BOTTOM - 0.38
      )
    );

    return new M.VGroup(...parts);
  }

  const chart =
    chartAxes();

  function scorePoint(step) {
    const q =
      RESULTS[step].q;

    return glowDot(
      pos(
        qx(step),
        qy(q)
      ),

      step === 3
        ? PINK
        : step === 0
          ? MUTED
          : GREEN,

      P ? 0.075 : 0.060
    );
  }

  function scoreSegment(step) {
    const a = pos(
      qx(step - 1),
      qy(RESULTS[step - 1].q)
    );

    const b = pos(
      qx(step),
      qy(RESULTS[step].q)
    );

    if (step === 3) {
      return dashed(
        a, b,
        PINK, 2.6
      );
    }

    return line(
      a, b,
      GREEN, 3
    );
  }

  function chartValue(step) {
    const q =
      RESULTS[step].q;

    const color =
      step === 3
        ? PINK
        : step === 0
          ? MUTED
          : GREEN;

    let x =
      qx(step);

    let y =
      qy(q) + 0.21;

    if (step === 0) {
      x += 0.28;
      y += 0.03;
    }

    if (step === 1) {
      y += 0.07;
    }

    if (step === 2) {
      x -= 0.16;
      y += 0.05;
    }

    if (step === 3) {
      x -= 0.06;
      y -= 0.43;
    }

    return at(
      fixed(q),
      P ? 15 : 12,
      color,
      x, y,
      true,
      0.92
    );
  }

  const chartPoints =
    RESULTS.map((_, i) =>
      scorePoint(i)
    );

  const chartValues =
    RESULTS.map((_, i) =>
      chartValue(i)
    );

  const chartSegments = [
    null,
    scoreSegment(1),
    scoreSegment(2),
    scoreSegment(3)
  ];

  function appendScore(step) {
    const a = [];

    if (step > 0) {
      const segment =
        chartSegments[step];

      picture.push(segment);

      a.push(
        new M.Create(
          segment,
          { runTime: 0.65 }
        )
      );
    }

    a.push(
      ...enter(
        chartPoints[step],
        chartValues[step]
      )
    );

    return a;
  }

  // ------------------------------------------------------------
  // Expected-share calculation helper.
  //
  // Draw one square per group's end count:
  //
  //   group with k ends contributes k × k ordered outcomes.
  //
  // At every partition the denominator is 6 × 6 = 36.
  // ------------------------------------------------------------

  function expectedExpression(result) {
    return result.groups
      .map(g => `(${g.degreeSum}/6)²`)
      .join(' + ');
  }

  function expectedNumerator(result) {
    return sum(
      result.groups.map(
        g => g.degreeSum ** 2
      )
    );
  }

  function expectedNumeratorText(result) {
    return result.groups
      .map(g => String(g.degreeSum ** 2))
      .join(' + ');
  }

  // ------------------------------------------------------------
  // 32: use modularity to search, one change at a time.
  // ------------------------------------------------------------

  searchObserved =
    smallShareBar(0);

  searchExpected =
    smallShareBar(1);

  const searchIntroTag = tagAt(
    'TRY A JOIN · CALCULATE · KEEP IF BETTER',
    GREEN,
    CX,
    P ? -4.47 : -2.46,
    P ? 16 : 13
  );

  await until(S(32));
  setStage(null);

  await play(
    ...scene(
      ...searchEdges,
      ...searchNodes,
      searchObserved,
      searchExpected,
      chart,
      searchIntroTag
    ),

    ...fbox([
      ['Search for better groups', GREEN],
      'Try joining two groups',
      'Calculate modularity',
      'Keep a join if Q increases'
    ], GREEN),

    ...say('SEARCH ONE CHANGE AT A TIME', GREEN)
  );

  // ------------------------------------------------------------
  // 33: begin with four separate groups.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...leave(searchIntroTag),

    ...changePartition(
      PARTITIONS[0]
    ),

    ...status(
      'START: FOUR SEPARATE GROUPS',
      MUTED
    ),

    ...fbox([
      ['Starting partition', INK],
      'Ana / Ben / Cara / Dan',
      '4 separate groups'
    ]),

    ...say('START WITH ONE READER PER GROUP')
  );

  // ------------------------------------------------------------
  // 34: no real edges are internal.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...updateShare(
      0,
      RESULTS[0].observed
    ),

    ...fbox([
      ['Observed share', OBSERVED],
      '0 internal friendships',
      '3 total friendships',
      ['0 ÷ 3 = 0%', OBSERVED]
    ], OBSERVED),

    ...say('NO REAL FRIENDSHIPS INSIDE', OBSERVED)
  );

  // ------------------------------------------------------------
  // 35: expected share for four separate groups.
  //
  // Degrees are 1, 2, 2, 1.
  //
  // (1/6)^2 + (2/6)^2 + (2/6)^2 + (1/6)^2
  // = (1 + 4 + 4 + 1)/36
  // = 10/36 ≈ 27.8%.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...updateShare(
      1,
      RESULTS[0].expected
    ),

    ...fbox([
      ['Expected share', EXPECTED],
      '(1/6)² + (2/6)²',
      '+ (2/6)² + (1/6)²',
      '= (1 + 4 + 4 + 1)/36',
      ['≈ 27.8%', EXPECTED]
    ], EXPECTED),

    ...say('EXPECTED INSIDE: 27.8%', EXPECTED)
  );

  // ------------------------------------------------------------
  // 36: starting modularity = −0.278.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...updateScore(
      RESULTS[0].q,
      MUTED
    ),

    ...appendScore(0),

    ...fbox([
      ['Starting modularity', MUTED],
      'Q = observed − expected',
      '  = 0 − 10/36',
      ['  ≈ −0.278', MUTED]
    ], MUTED),

    ...say('STARTING MODULARITY: −0.278', MUTED)
  );

  // ------------------------------------------------------------
  // 37: join Ana and Ben.
  //
  // The nodes and friendship lines remain in their original
  // locations. Their community memberships change.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...changePartition(
      PARTITIONS[1]
    ),

    ...updateShare(0, null),
    ...updateShare(1, null),

    ...leave(scoreNow),

    ...status(
      'TRY JOINING ANA AND BEN',
      CYAN
    ),

    ...fbox([
      ['Proposed join 1', CYAN],
      'Ana + Ben / Cara / Dan',
      'Recalculate both shares'
    ]),

    ...say('JOIN ANA AND BEN')
  );

  scoreNow = null;

  // ------------------------------------------------------------
  // 38: one of three friendships is now internal.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...updateShare(
      0,
      RESULTS[1].observed
    ),

    ...fbox([
      ['Observed share', OBSERVED],
      'Ana — Ben is inside',
      'Other 2 edges cross',
      ['1 ÷ 3 ≈ 33.3%', OBSERVED]
    ], OBSERVED),

    ...say('ONE OF THREE FRIENDSHIPS IS INSIDE', OBSERVED)
  );

  // ------------------------------------------------------------
  // 39: the expected share is now about 38.9%.
  //
  // Group end counts:
  //   Ana + Ben = 3
  //   Cara = 2
  //   Dan = 1
  //
  // Expected = (9 + 4 + 1)/36 = 14/36.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...updateShare(
      1,
      RESULTS[1].expected
    ),

    ...fbox([
      ['Expected share', EXPECTED],
      '(3/6)² + (2/6)² + (1/6)²',
      '= (9 + 4 + 1)/36',
      ['≈ 38.9%', EXPECTED]
    ], EXPECTED),

    ...say('EXPECTED INSIDE: ABOUT 39%', EXPECTED)
  );

  // ------------------------------------------------------------
  // 40: Q rises from −0.278 to −0.056.
  //
  // The value is still negative, but it is better.
  // The accepted change is approximately +0.222.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...updateScore(
      RESULTS[1].q,
      GREEN
    ),

    ...appendScore(1),

    ...status(
      `KEEP JOIN: Q RISES ${signed(HISTORY[1].change)}`,
      GREEN
    ),

    ...fbox([
      ['Q = 1/3 − 14/36', INK],
      ['≈ −0.056', GREEN],
      'Previous Q ≈ −0.278',
      [`Improvement ${signed(HISTORY[1].change)}`, GREEN]
    ], GREEN),

    ...say('−0.278 TO −0.056: KEEP THIS JOIN', GREEN)
  );

  // ------------------------------------------------------------
  // 41: join Cara and Dan.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...changePartition(
      PARTITIONS[2]
    ),

    ...updateShare(0, null),
    ...updateShare(1, null),

    ...leave(scoreNow),

    ...status(
      'TRY JOINING CARA AND DAN',
      GROUP_RIGHT
    ),

    ...fbox([
      ['Proposed join 2', GROUP_RIGHT],
      'Ana + Ben / Cara + Dan',
      'Recalculate both shares'
    ], GROUP_RIGHT),

    ...say('NOW JOIN CARA AND DAN', GROUP_RIGHT)
  );

  scoreNow = null;

  // ------------------------------------------------------------
  // 42: two of three friendships are internal.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...updateShare(
      0,
      RESULTS[2].observed
    ),

    ...fbox([
      ['Observed share', OBSERVED],
      'Ana — Ben is inside',
      'Cara — Dan is inside',
      ['2 ÷ 3 ≈ 66.7%', OBSERVED]
    ], OBSERVED),

    ...say('TWO OF THREE INSIDE: ABOUT 67%', OBSERVED)
  );

  // ------------------------------------------------------------
  // 43: expected share 50%, Q ≈ 0.167.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...updateShare(
      1,
      RESULTS[2].expected
    ),

    ...updateScore(
      RESULTS[2].q,
      GREEN
    ),

    ...appendScore(2),

    ...fbox([
      ['Expected = (3/6)² + (3/6)²', EXPECTED],
      '= 1/2 = 50%',
      'Q = 2/3 − 1/2',
      ['≈ 0.167', GREEN]
    ], GREEN),

    ...say('MODULARITY RISES TO 0.167', GREEN)
  );

  // ------------------------------------------------------------
  // 44: keep the second join.
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...status(
      `KEEP JOIN: Q RISES ${signed(HISTORY[2].change)}`,
      GREEN
    ),

    new M.Indicate(
      chartPoints[2],
      {
        color: GREEN,
        runTime: 0.7
      }
    ),

    ...fbox([
      ['Previous Q ≈ −0.056', MUTED],
      ['New Q ≈ 0.167', GREEN],
      [`Improvement ${signed(HISTORY[2].change)}`, GREEN],
      'Keep this join too'
    ], GREEN),

    ...say('THE SCORE RISES AGAIN: KEEP THE JOIN', GREEN)
  );

  // ------------------------------------------------------------
  // 45: try joining all four readers.
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...changePartition(
      PARTITIONS[3]
    ),

    ...updateShare(0, null),
    ...updateShare(1, null),

    ...leave(scoreNow),

    ...status(
      'TRY JOINING BOTH REMAINING GROUPS',
      EXPECTED
    ),

    ...fbox([
      ['Proposed join 3', EXPECTED],
      'Ana + Ben + Cara + Dan',
      'One large group'
    ], EXPECTED),

    ...say('TRY PUTTING EVERYONE IN ONE GROUP', EXPECTED)
  );

  scoreNow = null;

  // ------------------------------------------------------------
  // 46: observed = 100%, expected = 100%.
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...updateShare(
      0,
      RESULTS[3].observed
    ),

    ...updateShare(
      1,
      RESULTS[3].expected
    ),

    ...fbox([
      ['All 3 real edges inside', OBSERVED],
      ['Observed = 3/3 = 100%', OBSERVED],
      ['Expected = (6/6)²', EXPECTED],
      ['= 100%', EXPECTED]
    ], EXPECTED),

    ...say('BOTH OBSERVED AND EXPECTED ARE 100%', EXPECTED)
  );

  // ------------------------------------------------------------
  // 47: proposed modularity = 0.
  //
  // This score is lower than the current accepted score.
  // The dashed segment is a rejected trial, not a successful
  // continuation of the optimization.
  // ------------------------------------------------------------

  const rejectedCross =
    new M.VGroup(
      line(
        pos(
          qx(3) - 0.10,
          qy(0) - 0.10
        ),

        pos(
          qx(3) + 0.10,
          qy(0) + 0.10
        ),

        PINK, 2.4
      ),

      line(
        pos(
          qx(3) - 0.10,
          qy(0) + 0.10
        ),

        pos(
          qx(3) + 0.10,
          qy(0) - 0.10
        ),

        PINK, 2.4
      )
    );

  await until(S(47));

  await play(
    ...updateScore(
      RESULTS[3].q,
      PINK
    ),

    ...appendScore(3),

    ...enter(rejectedCross),

    ...status(
      `SCORE FALLS ${signed(HISTORY[3].change)}`,
      PINK
    ),

    ...fbox([
      ['Q = 1 − 1', INK],
      ['= 0', PINK],
      'Previous Q ≈ 0.167',
      [`Change ${signed(HISTORY[3].change)}`, PINK]
    ], PINK),

    ...say('THE MODULARITY SCORE FALLS TO ZERO', PINK)
  );

  // ------------------------------------------------------------
  // 48: reject the proposed join.
  //
  // Restore the best accepted partition and its score.
  // Keep the dashed rejected branch visible for comparison.
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...changePartition(
      PARTITIONS[2]
    ),

    ...updateShare(
      0,
      BEST.observed
    ),

    ...updateShare(
      1,
      BEST.expected
    ),

    ...updateScore(
      BEST.q,
      GREEN
    ),

    ...status(
      'REJECT LAST JOIN · RESTORE TWO GROUPS',
      GREEN
    ),

    ...fbox([
      ['Reject the proposed join', PINK],
      'Restore the better grouping',
      ['Ana + Ben / Cara + Dan', GREEN],
      ['Q ≈ 0.167', GREEN]
    ], GREEN),

    ...say('REJECT THE JOIN AND RESTORE TWO GROUPS', GREEN)
  );

  // ------------------------------------------------------------
  // 49: the accepted score curve rises.
  //
  // The only remaining group merge has been tried and rejected.
  // This is a simple greedy joining demonstration.
  // It does not claim greedy community detection always finds
  // the globally optimal partition of every network.
  // ------------------------------------------------------------

  const bestPointRing = circle(
    qx(2),
    qy(BEST.q),
    P ? 0.17 : 0.13,
    GREEN,
    0, 2.4
  );

  await until(S(49));

  await play(
    ...enter(bestPointRing),

    ...status(
      'STOP: NO FURTHER JOIN IMPROVES Q',
      GREEN
    ),

    ...fbox([
      ['Accepted scores', GREEN],
      '−0.278 → −0.056 → 0.167',
      ['Rejected trial: 0', PINK],
      'Stop when no join improves Q'
    ], GREEN),

    ...say('THE ACCEPTED SCORE CURVE RISES', GREEN)
  );

  // ------------------------------------------------------------
  // 50–51: final modularity formula.
  //
  // Use the exact fractions rather than subtracting rounded
  // percentages.
  //
  // 2/3 − 1/2 = 4/6 − 3/6 = 1/6.
  // ------------------------------------------------------------

  const FORMULA_BAR_W =
    P ? 5.80 : 5.75;

  const FORMULA_BAR_LEFT =
    CX - FORMULA_BAR_W / 2;

  const FORMULA_ROW_Y = P
    ? [0.47, -1.10]
    : [0.67, -0.65];

  const FORMULA_BLOCK_H =
    P ? 0.56 : 0.43;

  function sixthBar(
    row,
    filled,
    title,
    color
  ) {
    const y =
      FORMULA_ROW_Y[row];

    const step =
      FORMULA_BAR_W / 6;

    const parts = [
      at(
        title,
        P ? 19 : 17,
        color,
        CX,
        y + 0.53,
        false, FORMULA_BAR_W
      )
    ];

    for (let k = 0; k < 6; k++) {
      const x =
        FORMULA_BAR_LEFT +
        (k + 0.5) * step;

      parts.push(
        outline(
          x, y,
          step - 0.045,
          FORMULA_BLOCK_H,

          k < filled
            ? color
            : MUTED,

          0.48, 1.3
        )
      );

      if (k < filled) {
        parts.push(
          rect(
            x, y,
            step - 0.085,
            FORMULA_BLOCK_H - 0.045,
            color, 0.86, 0
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  const observedSixths =
    sixthBar(
      0, 4,
      'Observed: 2/3 = 4/6',
      OBSERVED
    );

  const expectedSixths =
    sixthBar(
      1, 3,
      'Expected: 1/2 = 3/6',
      EXPECTED
    );

  const differenceX =
    FORMULA_BAR_LEFT +
    3.5 * FORMULA_BAR_W / 6;

  const differenceOutline = outline(
    differenceX,
    FORMULA_ROW_Y[0],
    FORMULA_BAR_W / 6 + 0.04,
    FORMULA_BLOCK_H + 0.15,
    GREEN, 0, 2.8
  );

  await until(S(50));

  await play(
    ...scene(
      observedSixths,
      expectedSixths
    ),

    ...fbox([
      ['Modularity', GREEN],
      ['= observed internal share', OBSERVED],
      ['  − expected internal share', EXPECTED]
    ], GREEN),

    ...say('MODULARITY = OBSERVED SHARE − EXPECTED SHARE', GREEN)
  );

  // ------------------------------------------------------------
  // 51: demonstrate the excess one-sixth block.
  // ------------------------------------------------------------

  const diffStart = pos(
    differenceX,
    FORMULA_ROW_Y[0] -
      FORMULA_BLOCK_H / 2 -
      0.08
  );

  const diffEnd = pos(
    differenceX,
    FORMULA_ROW_Y[1] +
      FORMULA_BLOCK_H / 2 +
      0.10
  );

  const differenceArrow =
    arrow(
      diffStart,
      diffEnd,
      GREEN, 2.6
    );

  const resultBlockY =
    P ? -2.91 : -1.91;

  const resultBlock = new M.VGroup(
    outline(
      CX - 1.25,
      resultBlockY,
      FORMULA_BAR_W / 6,
      FORMULA_BLOCK_H,
      GREEN, 0.60
    ),

    rect(
      CX - 1.25,
      resultBlockY,
      FORMULA_BAR_W / 6 - 0.08,
      FORMULA_BLOCK_H - 0.05,
      GREEN, 0.87, 1
    ),

    at(
      '1/6 ≈ 0.167',
      P ? 27 : 23,
      GREEN,
      CX + 0.63,
      resultBlockY,
      true
    )
  );

  await until(S(51));

  await play(
    ...enter(
      differenceOutline,
      differenceArrow,
      resultBlock
    ),

    ...fbox([
      ['Q = 2/3 − 1/2', INK],
      '  = 4/6 − 3/6',
      ['  = 1/6', GREEN],
      ['  ≈ 0.167', GREEN]
    ], GREEN),

    ...say('TWO-THIRDS MINUS ONE-HALF = ONE-SIXTH', GREEN)
  );

  // ------------------------------------------------------------
  // 52: community detection applies to connected data.
  //
  // These are explicitly conceptual examples of network types.
  // No invented network is presented as additional bookshop data.
  // ------------------------------------------------------------

  function networkIcon(
    x, y,
    color
  ) {
    const points = [
      pos(x - 0.57, y + 0.15),
      pos(x - 0.29, y - 0.30),
      pos(x - 0.06, y + 0.34),
      pos(x + 0.38, y + 0.23),
      pos(x + 0.61, y - 0.23)
    ];

    const edges = [
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4]
    ];

    const parts = edges.map(
      ([a, b]) =>
        line(
          points[a],
          points[b],
          color, 1.7
        )
    );

    points.forEach(p => {
      parts.push(
        glowDot(
          p, color, 0.072
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function applicationCard(
    title, subtitle,
    x, y,
    color
  ) {
    const w = 1.92;
    const h = P ? 2.27 : 1.91;

    return new M.VGroup(
      outline(
        x, y, w, h,
        color, 0.45
      ),

      at(
        title,
        P ? 18 : 16,
        color,
        x,
        y + h / 2 - 0.30,
        false,
        w - 0.15
      ),

      networkIcon(
        x,
        y + 0.06,
        color
      ),

      at(
        subtitle,
        P ? 15 : 13,
        INK,
        x,
        y - h / 2 + 0.27,
        false,
        w - 0.15
      )
    );
  }

  const applications = [
    applicationCard(
      'Friendships',
      'Connected people',
      CX - 2.10,
      P ? -0.63 : -0.35,
      CYAN
    ),

    applicationCard(
      'Customers',
      'Connected activity',
      CX,
      P ? -0.63 : -0.35,
      GREEN
    ),

    applicationCard(
      'Other networks',
      'Connected items',
      CX + 2.10,
      P ? -0.63 : -0.35,
      EXPECTED
    )
  ];

  await until(S(52));

  await play(
    ...scene(
      ...applications,

      note(
        'Illustrations of different kinds of networks',
        MUTED,
        P ? -3.16 : -2.16
      )
    ),

    ...fbox([
      ['Community detection', GREEN],
      'Friendship networks',
      'Customer networks',
      'Other connected data'
    ], GREEN),

    ...say('DISCOVER GROUPS IN CONNECTED DATA', GREEN)
  );

  // ------------------------------------------------------------
  // 53: connected readers need not have identical interests.
  //
  // Use actual chapter ratings:
  //
  // Ana and Ben are in the same community.
  // Ana has not rated River, while Ben rates it 5 stars.
  //
  // This is a difference in available rating information,
  // not evidence that Ana dislikes River.
  //
  // Cara and Dan are friends and share a community, but
  // Cara rates River 1 star and Dan rates River 2 stars.
  // Cara rates Castle 5 stars and Dan rates Castle 4 stars.
  //
  // Show Cara and Dan's actual different ratings to establish
  // that a shared community does not imply identical ratings.
  // ------------------------------------------------------------

  function ratingStar(
    x, y,
    filled,
    color = YELLOW,
    radius = 0.105
  ) {
    const points = [];

    for (let k = 0; k < 10; k++) {
      const a =
        Math.PI / 2 +
        k * Math.PI / 5;

      const r =
        k % 2 === 0
          ? radius
          : radius * 0.43;

      points.push(
        pos(
          x + r * Math.cos(a),
          y + r * Math.sin(a)
        )
      );
    }

    // A closed outline made from individual line segments.
    // A filled centre distinguishes a selected star.

    const edges = points.map(
      (p, i) =>
        line(
          p,
          points[(i + 1) % points.length],
          filled ? color : MUTED,
          filled ? 1.7 : 1.0
        )
    );

    if (filled) {
      edges.push(
        circle(
          x, y,
          radius * 0.45,
          color,
          0.95, 0
        )
      );
    }

    return new M.VGroup(...edges);
  }

  function stars(
    value, x, y
  ) {
    if (value === null) {
      return at(
        'Not rated',
        15, MUTED,
        x, y
      );
    }

    return new M.VGroup(
      ...Array.from(
        { length: 5 },

        (_, j) =>
          ratingStar(
            x + (j - 2) * 0.25,
            y,
            j < value
          )
      )
    );
  }

  function readerRatingCard(
    readerIndex,
    x, y
  ) {
    const color =
      READER_COLORS[readerIndex];

    const w = 2.72;
    const h = P ? 3.17 : 2.49;

    const parts = [
      outline(
        x, y,
        w, h,
        color, 0.57
      ),

      at(
        READERS[readerIndex],
        P ? 24 : 21,
        color,
        x,
        y + h / 2 - 0.34
      )
    ];

    const bookIndices = [1, 3];

    bookIndices.forEach((j, k) => {
      const yy =
        y + (P ? 0.45 : 0.32) -
        k * (P ? 1.12 : 0.87);

      parts.push(
        at(
          BOOKS[j],
          P ? 19 : 17,
          BOOK_COLORS[BOOKS[j]],
          x,
          yy
        ),

        stars(
          RATINGS[readerIndex][j],
          x,
          yy - 0.29
        ),

        at(
          `${RATINGS[readerIndex][j]} stars`,
          P ? 16 : 14,
          INK,
          x,
          yy - 0.56
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const RAT_Y =
    P ? -0.78 : -0.45;

  const caraRating =
    readerRatingCard(
      2,
      CX - 1.55,
      RAT_Y
    );

  const danRating =
    readerRatingCard(
      3,
      CX + 1.55,
      RAT_Y
    );

  const ratingBoundary = outline(
    CX,
    RAT_Y,
    6.05,
    P ? 3.40 : 2.72,
    GROUP_RIGHT,
    0, 2.3
  );

  const ratingTitle = at(
    'SAME COMMUNITY',
    P ? 18 : 16,
    GROUP_RIGHT,
    CX,
    P ? 1.23 : 1.20,
    true
  );

  await until(S(53));

  await play(
    ...scene(
      ratingBoundary,
      ratingTitle,
      caraRating,
      danRating,

      note(
        'Connected readers can still have different preferences',
        AMBER,
        P ? -3.55 : -2.24
      )
    ),

    ...fbox([
      ['Same community', GROUP_RIGHT],
      'Does not mean identical tastes',
      'Cara and Dan are friends',
      ['Their ratings still differ', AMBER]
    ], AMBER),

    ...say('A COMMUNITY DOES NOT MEAN IDENTICAL TASTES', AMBER)
  );

  // ------------------------------------------------------------
  // 54: final visual summary.
  //
  // Return to the actual four-reader network.
  //
  // Green: internal friendships.
  // Pink: crossing friendship.
  //
  // Two groups, two internal edges, one crossing edge.
  // Observed share = 2/3.
  // Expected share = 1/2.
  // Modularity = 1/6.
  // ------------------------------------------------------------

  function finalSummary() {
    const parts = [];

    const y =
      P ? 0.40 : 0.68;

    const positions =
      graphPositions(
        y, 1.74
      );

    parts.push(
      graphSnapshot(
        PARTITIONS[2],
        positions,
        P ? 0.36 : 0.32
      ),

      groupName(
        [0, 1],
        positions,
        y + 0.84,
        GROUP_LEFT,
        P ? 18 : 16
      ),

      groupName(
        [2, 3],
        positions,
        y + 0.84,
        GROUP_RIGHT,
        P ? 18 : 16
      )
    );

    const metricsY = P
      ? -1.53
      : -0.86;

    const metricW = 2.72;
    const metricH =
      P ? 1.23 : 0.99;

    const metrics = [
      {
        x: CX - 1.57,
        title: 'Observed inside',
        fraction: '2/3',
        value: pct(BEST.observed),
        color: OBSERVED
      },

      {
        x: CX + 1.57,
        title: 'Expected inside',
        fraction: '1/2',
        value: pct(BEST.expected),
        color: EXPECTED
      }
    ];

    metrics.forEach(m => {
      parts.push(
        outline(
          m.x,
          metricsY,
          metricW,
          metricH,
          m.color,
          0.58
        ),

        at(
          m.title,
          P ? 17 : 15,
          m.color,
          m.x,
          metricsY + 0.31,
          false, metricW - 0.17
        ),

        at(
          `${m.fraction} = ${m.value}`,
          P ? 22 : 19,
          m.color,
          m.x,
          metricsY - 0.17,
          true,
          metricW - 0.14
        )
      );
    });

    const qY =
      P ? -3.18 : -2.00;

    parts.push(
      tagAt(
        'MODULARITY = 1/6 ≈ 0.167',
        GREEN,
        CX,
        qY,
        P ? 22 : 18
      )
    );

    if (P) {
      parts.push(
        note(
          'More connections inside than expected by chance',
          GREEN,
          -4.20
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const finalPicture =
    finalSummary();

  await until(S(54));

  await play(
    ...scene(finalPicture),

    ...fbox([
      ['Community detection', GREEN],
      'Find groups with more',
      'internal connections',
      'than expected by chance',
      ['Q = observed − expected', GREEN]
    ], GREEN),

    ...say('FIND STRONGER-THAN-EXPECTED INTERNAL CONNECTIONS', GREEN)
  );

  // Leave the final picture visible until narration ends.

  await until(E(54));

  // ------------------------------------------------------------
  // Integration notes.
  //
  // All 55 sentence beats, S(0) through S(54), are included.
  //
  // Reader order, reader colours, book colours, ratings,
  // friendships and chapter data follow the supplied example.
  //
  // All three real friendship lines are undirected.
  // The degree sequence is calculated as [1, 2, 2, 1].
  //
  // The chance comparison uses two independent friendship-end
  // selections with replacement. Its 6 × 6 outcome grid shows
  // all 36 equally likely ordered outcomes.
  //
  // The illustrative card draws deliberately allow the same
  // card to be selected twice, demonstrating replacement.
  //
  // All observed shares, expected shares, modularity scores,
  // accepted improvements and rejected changes are computed
  // directly from EDGES and PARTITIONS.
  //
  // The accepted score curve is:
  //   −0.277778 → −0.055556 → 0.166667
  //
  // The rejected trial at 0 is a separate dashed branch.
  //
  // The final partition is Ana + Ben / Cara + Dan.
  // Its modularity is exactly 1/6.
  //
  // The search is the prescribed simple greedy joining
  // demonstration, not a general-purpose Louvain implementation.
  //
  // Community membership is not treated as proof of shared
  // interests. The final rating comparison uses actual
  // Cara and Dan ratings from the fixed chapter data.
  //
  // Browser execution, seek behaviour, animation timing,
  // Arc boundary positioning, text metrics and responsive
  // rendering still require verification in the actual
  // site/live/engine.js environment.
  // ------------------------------------------------------------
}

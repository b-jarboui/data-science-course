// lesson 14.4.7
// Collaborative filtering: learning from similar readers
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Fixed chapter 14.4 example.
//
// Ana has rated Trail and Clues.
// Compare Ben, Cara and Dan using these two shared books.
//
// Mean absolute differences:
//   Ben  = (0 + 0) / 2 = 0
//   Cara = (2 + 2) / 2 = 2
//   Dan  = (2 + 2) / 2 = 2
//
// Ben is Ana's closest match.
//
// Predicted ratings for Ana, using Ben's ratings:
//   River  = 5 stars
//   Castle = 1 star
//   Island = unknown
//
// Known ratings and predicted ratings remain visually distinct.
// Missing ratings are never treated as zero.
//
// All rating gaps, mean absolute differences, predictions
// and recommendation rankings are calculated from the data.

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

  // Topics are retained for chapter consistency,
  // but are deliberately not used by this recommendation method.

  const RATINGS = [
    [4, null, 2, null, null],
    [4, 5,    2, 1,    null],
    [2, 1,    4, 5,    null],
    [2, 2,    4, 4,    null]
  ];

  // null means not rated.
  // It does not mean zero stars.

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

  const FRIENDSHIPS = [
    ['Ana', 'Ben'],
    ['Ben', 'Cara'],
    ['Cara', 'Dan']
  ];

  const TARGET = 0;

  const KNOWN = BOOKS
    .map((_, j) => j)
    .filter(j => RATINGS[TARGET][j] !== null);

  const UNKNOWN = BOOKS
    .map((_, j) => j)
    .filter(j => RATINGS[TARGET][j] === null);

  const sum = values =>
    values.reduce((s, v) => s + v, 0);

  // ------------------------------------------------------------
  // Mean absolute difference.
  //
  // Use only books with known ratings from both readers.
  //
  // The supplied teaching example requires comparison readers
  // to have rated both of Ana's known books.
  // ------------------------------------------------------------

  function compareReaders(a, b) {
    const shared = BOOKS
      .map((_, j) => j)
      .filter(j =>
        RATINGS[a][j] !== null &&
        RATINGS[b][j] !== null
      );

    const differences = shared.map(j => ({
      book: BOOKS[j],
      index: j,
      a: RATINGS[a][j],
      b: RATINGS[b][j],

      signed:
        RATINGS[a][j] - RATINGS[b][j],

      gap:
        Math.abs(
          RATINGS[a][j] - RATINGS[b][j]
        )
    }));

    const total = sum(
      differences.map(d => d.gap)
    );

    return {
      reader: b,
      shared,
      differences,
      total,

      count: shared.length,

      mean:
        shared.length > 0
          ? total / shared.length
          : null
    };
  }

  const COMPARISONS = READERS
    .map((_, i) => i)
    .filter(i => i !== TARGET)
    .map(i => compareReaders(TARGET, i))
    .filter(result =>
      result.count === KNOWN.length &&
      result.count > 0
    );

  const COMPARISON_BY_READER =
    Object.fromEntries(
      COMPARISONS.map(result => [
        result.reader,
        result
      ])
    );

  const RANKED_READERS = COMPARISONS
    .slice()
    .sort(
      (a, b) =>
        a.mean - b.mean ||
        a.reader - b.reader
    );

  const NEIGHBOR =
    RANKED_READERS[0].reader;

  // ------------------------------------------------------------
  // One-nearest-reader prediction.
  //
  // This is a deliberately simple teaching example.
  // No weighting, rating normalization or topic information
  // is used.
  //
  // A missing rating in the selected reader's row produces
  // a missing prediction.
  // ------------------------------------------------------------

  const PREDICTIONS = UNKNOWN.map(j => ({
    book: BOOKS[j],
    index: j,

    rating: RATINGS[NEIGHBOR][j],

    source: NEIGHBOR
  }));

  const PREDICTION_BY_BOOK =
    Object.fromEntries(
      PREDICTIONS.map(p => [
        p.index,
        p
      ])
    );

  const RECOMMENDATIONS = PREDICTIONS
    .filter(p => p.rating !== null)
    .slice()
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        a.index - b.index
    );

  const NO_PREDICTION = PREDICTIONS.filter(
    p => p.rating === null
  );

  const ISLAND_INDEX =
    BOOKS.indexOf('Island');

  const ISLAND_RATING_COUNT = RATINGS.filter(
    row => row[ISLAND_INDEX] !== null
  ).length;

  const ISLAND_PURCHASE_COUNT = BASKETS.filter(
    basket => basket.includes('Island')
  ).length;

  const fmt = value =>
    value === null
      ? '—'
      : Number(value.toFixed(3)).toString();

  // ------------------------------------------------------------
  // Shared chapter palette.
  //
  // Ana = cyan
  // Ben = blue
  // Cara = orange
  // Dan = purple
  //
  // Trail = green
  // River = teal
  // Clues = amber
  // Castle = purple
  // Island = yellow
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const BLUE = C.blue || '#60A5FA';
  const ORANGE = C.orange || '#FB923C';
  const PURPLE = C.violet || '#A78BFA';

  const GREEN = C.green;
  const AMBER = C.amber;
  const TEAL = C.teal || '#2DD4BF';
  const YELLOW = C.yellow || '#FACC15';
  const PINK = C.pink || '#F472B6';

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

  const GAP = AMBER;
  const PREDICTED = PURPLE;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 × 14.22.
  // Safe content area: y = −5.5 ... 4.3.
  //
  // Laptop: 14.22 × 8.
  // Safe content area: y = −3.0 ... 2.3.
  //
  // Follow the approved reference layout:
  // main illustration, narration pill, one formula box.
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

  const ROSTER_Y =
    P ? -5.12 : -2.82;

  const pos = (x, y) =>
    [x, y, 0];

  const say = (s, color = CYAN) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // Drawing helpers.
  // ------------------------------------------------------------

  function at(
    s, size, color, x, y,
    mono = false,
    maxw = null
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
        0.14,
        w / 5,
        h / 5
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
    radius = 0.075
  ) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.1,
      color
    });

    halo.setFill(color, 0.17);

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
      b[0] -
        h * Math.cos(theta - Math.PI / 6),

      b[1] -
        h * Math.sin(theta - Math.PI / 6)
    );

    const p2 = pos(
      b[0] -
        h * Math.cos(theta + Math.PI / 6),

      b[1] -
        h * Math.sin(theta + Math.PI / 6)
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
      text,
      color,
      size
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
    y = P ? -4.30 : -2.45
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
    const size = 20;
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
        const raw = String(rows[i][0]);

        const indent =
          raw.length -
          raw.trimStart().length;

        return t.getWidth() +
          cw * indent;
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
  // Never regroup already visible objects.
  // Every top-level object remains independently removable.
  //
  // New groups are constructed only from new objects.
  // ------------------------------------------------------------

  let picture = [];
  let focusNow = [];

  function clearFocus() {
    const old = focusNow;
    focusNow = [];

    return old.map(
      o => new M.FadeOut(o)
    );
  }

  function focus(...objects) {
    const a = clearFocus();

    focusNow = objects.slice();

    a.push(
      ...objects.map(
        o => new M.FadeIn(o)
      )
    );

    return a;
  }

  function scene(...objects) {
    const a = [
      ...clearFocus(),

      ...picture.map(
        o => new M.FadeOut(o)
      ),

      ...objects.map(
        o => new M.FadeIn(o)
      )
    ];

    picture = objects.slice();

    return a;
  }

  function enter(...objects) {
    const fresh = objects.filter(
      o => !picture.includes(o)
    );

    picture.push(...fresh);

    return fresh.map(
      o => new M.FadeIn(o)
    );
  }

  function leave(...objects) {
    const present = objects.filter(
      o => picture.includes(o)
    );

    picture = picture.filter(
      o => !present.includes(o)
    );

    return present.map(
      o => new M.FadeOut(o)
    );
  }

  function enterLagged(
    objects,
    lagRatio = 0.12,
    runTime = 1.2
  ) {
    const fresh = objects.filter(
      o => !picture.includes(o)
    );

    if (!fresh.length) {
      return [];
    }

    picture.push(...fresh);

    return [
      new M.LaggedStart(
        fresh.map(
          o => new M.FadeIn(o)
        ),

        { lagRatio, runTime }
      )
    ];
  }

  // ------------------------------------------------------------
  // Reader icons.
  //
  // Reader names and colours are always retained.
  // ------------------------------------------------------------

  function readerIcon(
    i, x, y,
    scale = 1,
    showName = true
  ) {
    const color =
      READER_COLORS[i];

    const halo = circle(
      x, y,
      0.52 * scale,
      color, 0.08, 1
    );

    const head = circle(
      x,
      y + 0.20 * scale,
      0.17 * scale,
      color, 0.95, 1
    );

    const body = new M.Arc({
      radius: 0.30 * scale,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(
      color, 0.82
    );

    body.moveTo(pos(
      x,
      y - 0.17 * scale
    ));

    const parts = [
      halo,
      head,
      body
    ];

    if (showName) {
      parts.push(
        at(
          READERS[i],
          P ? 20 : 18,
          color,
          x,
          y - 0.68 * scale
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Persistent reader roster.
  // ------------------------------------------------------------

  const roster = new M.VGroup(
    ...READERS.map((name, i) => {
      const x =
        CX + (i - 1.5) * 1.55;

      const color =
        READER_COLORS[i];

      return new M.VGroup(
        outline(
          x, ROSTER_Y,
          1.22, 0.30,
          color,
          i === TARGET ? 0.55 : 0.20,
          i === TARGET ? 2 : 1
        ),

        glowDot(
          pos(x - 0.43, ROSTER_Y),
          color, 0.047
        ),

        at(
          name,
          P ? 14 : 13,
          color,
          x + 0.08,
          ROSTER_Y,
          false, 0.75
        )
      );
    })
  );

  // ------------------------------------------------------------
  // Glowing book cards.
  //
  // Colours match the rest of chapter 14.4.
  // Book topics are not shown in this lesson.
  // ------------------------------------------------------------

  function bookCard(
    name, x, y,
    w = 1.15,
    h = 1.55
  ) {
    const color =
      BOOK_COLORS[name];

    const halo = outline(
      x, y,
      w + 0.075,
      h + 0.075,
      color, 0.05, 1
    );

    const cover = outline(
      x, y,
      w, h,
      color, 0.70, 2
    );

    cover.setFill(
      color, 0.18
    );

    const spine = rect(
      x - w / 2 + w * 0.075,
      y,
      w * 0.12,
      h * 0.90,
      color, 0.90, 0
    );

    return new M.VGroup(
      halo,
      cover,
      spine,

      at(
        name,
        P ? 20 : 18,
        color,
        x + w * 0.035,
        y + h * 0.15,
        false,
        w * 0.76
      ),

      line(
        pos(
          x - w * 0.24,
          y - h * 0.07
        ),

        pos(
          x + w * 0.31,
          y - h * 0.07
        ),

        color, 1.5
      ),

      line(
        pos(
          x - w * 0.24,
          y - h * 0.18
        ),

        pos(
          x + w * 0.22,
          y - h * 0.18
        ),

        color, 1.2
      ),

      line(
        pos(
          x - w * 0.28,
          y - h * 0.39
        ),

        pos(
          x + w * 0.39,
          y - h * 0.39
        ),

        MUTED, 1.2
      )
    );
  }

  // ------------------------------------------------------------
  // Rating stars.
  //
  // Stars are drawn geometrically rather than relying on
  // an emoji or special symbol font.
  //
  // Filled gold stars = observed ratings.
  // Purple stars = predicted ratings.
  // Empty matrix cell = unknown rating.
  //
  // A known one-star rating is visibly different from a
  // missing rating.
  // ------------------------------------------------------------

  function ratingStar(
    x, y,
    filled,
    radius = 0.10,
    color = YELLOW
  ) {
    const points = [];

    for (let k = 0; k < 10; k++) {
      const theta =
        Math.PI / 2 +
        k * Math.PI / 5;

      const r =
        k % 2 === 0
          ? radius
          : radius * 0.43;

      points.push(
        pos(
          x + r * Math.cos(theta),
          y + r * Math.sin(theta)
        )
      );
    }

    const parts = points.map(
      (p, k) =>
        line(
          p,

          points[
            (k + 1) % points.length
          ],

          filled ? color : MUTED,

          filled ? 1.8 : 0.85
        )
    );

    if (filled) {
      parts.push(
        circle(
          x, y,
          radius * 0.43,
          color, 1, 0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function stars(
    value,
    x, y,
    width = 1.0,
    color = YELLOW
  ) {
    if (value === null) {
      return at(
        '—',
        20, MUTED,
        x, y,
        true
      );
    }

    const step =
      width / 5;

    return new M.VGroup(
      ...Array.from(
        { length: 5 },

        (_, j) =>
          ratingStar(
            x + (j - 2) * step,
            y,
            j < value,
            step * 0.42,
            color
          )
      )
    );
  }

  // ------------------------------------------------------------
  // 0: Ana visits the bookshop.
  // ------------------------------------------------------------

  function introPicture() {
    const y =
      P ? -0.42 : -0.28;

    return new M.VGroup(
      at(
        'ANA VISITS THE BOOKSHOP',
        P ? 22 : 19,
        INK,
        CX,
        P ? 1.40 : 1.35,
        false, MAIN_W - 0.30
      ),

      readerIcon(
        TARGET,
        CX - 2.10,
        y,
        1.28
      ),

      arrow(
        pos(CX - 1.27, y),
        pos(CX - 0.30, y),
        CYAN, 2.8
      ),

      outline(
        CX + 1.24,
        y,
        2.17,
        P ? 2.15 : 1.75,
        CYAN, 0.42
      ),

      at(
        '?',
        48,
        CYAN,
        CX + 1.24,
        y + 0.12
      ),

      at(
        'Next book',
        P ? 19 : 17,
        CYAN,
        CX + 1.24,
        y - 0.57
      ),

      note(
        'What should we recommend?',
        GREEN,
        P ? -3.12 : -2.13
      )
    );
  }

  const intro =
    introPicture();

  await until(S(0));
  setStage(1.3, 1.58, 1.6, -0.2);

  await play(
    ...scene(intro),

    new M.FadeIn(markStaged(roster)),

    ...fbox([
      ['Ana', CYAN],
      'Looking for another book',
      'What should we suggest?'
    ]),

    ...say('FIND ANA’S NEXT BOOK')
  );

  // ------------------------------------------------------------
  // 1: this time, book topics are not available.
  // ------------------------------------------------------------

  function unknownContentPicture() {
    const parts = [];

    const y =
      P ? 0.25 : 0.32;

    BOOKS.forEach((name, j) => {
      const x =
        CX + (j - 2) * 1.27;

      parts.push(
        bookCard(
          name, x, y,
          1.03,
          P ? 1.64 : 1.36
        ),

        outline(
          x,
          y -
            (P ? 1.44 : 1.13),

          1.13,
          P ? 0.59 : 0.48,
          MUTED, 0.27
        ),

        at(
          '?',
          25, MUTED,
          x,
          y -
            (P ? 1.44 : 1.13)
        )
      );
    });

    parts.push(
      note(
        'Book topics are not available',
        AMBER,
        P ? -3.14 : -1.97
      )
    );

    return new M.VGroup(...parts);
  }

  const unknownContent =
    unknownContentPicture();

  await until(S(1));
  setStage(1.08, 1.5, 1.6);

  await play(
    ...scene(unknownContent),

    ...fbox([
      ['This time', AMBER],
      'No topic information',
      'We cannot compare',
      'the content of books'
    ], AMBER),

    ...say('WE KNOW NOTHING ABOUT BOOK TOPICS', AMBER)
  );

  // ------------------------------------------------------------
  // 2: use other readers' opinions instead.
  // ------------------------------------------------------------

  function opinionPicture() {
    const parts = [];

    const otherY =
      P ? 0.58 : 0.67;

    const targetY =
      P ? -1.91 : -1.24;

    for (let i = 1; i < READERS.length; i++) {
      const x =
        CX + (i - 2) * 2.04;

      parts.push(
        readerIcon(
          i,
          x,
          otherY,
          0.92
        ),

        arrow(
          pos(
            x,
            otherY - 0.85
          ),

          pos(
            CX + (i - 2) * 0.28,
            targetY + 0.65
          ),

          READER_COLORS[i],
          2.2
        )
      );
    }

    parts.push(
      readerIcon(
        TARGET,
        CX,
        targetY,
        1.08
      ),

      note(
        'Use information from other readers',
        GREEN,
        P ? -3.55 : -2.39
      )
    );

    return new M.VGroup(...parts);
  }

  const opinions =
    opinionPicture();

  await until(S(2));
  setStage(1.08, 1.5, 1.6);

  await play(
    ...scene(opinions),

    ...fbox([
      ['Another source of evidence', GREEN],
      'Other readers’ opinions',
      'Find someone whose tastes',
      'are similar to Ana’s'
    ], GREEN),

    ...say('CAN OTHER READERS HELP?', GREEN)
  );

  // ------------------------------------------------------------
  // 3: introduce Ana, Ben, Cara and Dan.
  // ------------------------------------------------------------

  const readerIntro = READERS.map(
    (_, i) =>
      readerIcon(
        i,
        CX + (i - 1.5) * 1.65,
        P ? -0.31 : -0.25,
        1.06
      )
  );

  await until(S(3));
  setStage(1.1, 1.45, 1.35);

  await play(
    ...scene(),

    ...enterLagged(
      readerIntro,
      0.17, 1.25
    ),

    ...fbox([
      ['Our four readers', INK],
      ['Ana', CYAN],
      ['Ben', BLUE],
      ['Cara', ORANGE],
      ['Dan', PURPLE]
    ]),

    ...say('ANA, BEN, CARA AND DAN')
  );

  // ------------------------------------------------------------
  // 4: introduce the five books in chapter order.
  // ------------------------------------------------------------

  const bookIntro = BOOKS.map(
    (name, j) =>
      bookCard(
        name,
        CX + (j - 2) * 1.28,
        P ? -0.34 : -0.25,
        1.05,
        P ? 1.90 : 1.56
      )
  );

  await until(S(4));

  await play(
    ...scene(),

    ...enterLagged(
      bookIntro,
      0.13, 1.25
    ),

    ...fbox([
      ['Our five books', INK],
      ['Trail', GREEN],
      ['River', TEAL],
      ['Clues', AMBER],
      ['Castle', PURPLE],
      ['Island', YELLOW]
    ]),

    ...say('TRAIL, RIVER, CLUES, CASTLE AND ISLAND')
  );

  // ------------------------------------------------------------
  // Rating matrix.
  //
  // Fixed reader order:
  // Ana, Ben, Cara, Dan.
  //
  // Fixed book order:
  // Trail, River, Clues, Castle, Island.
  //
  // Each rating cell initially has no contents.
  // Known ratings are revealed in narration order.
  // Missing cells remain empty.
  // ------------------------------------------------------------

  const TABLE_TOP =
    P ? 0.36 : 0.47;

  const ROW_PITCH =
    P ? 1.04 : 0.64;

  const COL_PITCH =
    P ? 1.13 : 1.13;

  const CELL_W =
    COL_PITCH - 0.065;

  const CELL_H =
    P ? 0.91 : 0.55;

  const NAME_X =
    CX - 2.81;

  const FIRST_COL_X =
    CX - 1.64;

  const tx = j =>
    FIRST_COL_X +
    j * COL_PITCH;

  const ty = i =>
    TABLE_TOP -
    i * ROW_PITCH;

  const HEADER_Y =
    TABLE_TOP +
    (P ? 0.81 : 0.67);

  const TABLE_LEFT =
    NAME_X - 0.48;

  const TABLE_RIGHT =
    tx(BOOKS.length - 1) +
    CELL_W / 2;

  function tableHeader() {
    return new M.VGroup(
      at(
        'Reader',
        P ? 16 : 14,
        MUTED,
        NAME_X,
        HEADER_Y,
        false, 0.91
      ),

      ...BOOKS.map(
        (name, j) =>
          at(
            name,
            P ? 18 : 16,
            BOOK_COLORS[name],
            tx(j),
            HEADER_Y,
            false, CELL_W - 0.07
          )
      ),

      line(
        pos(
          TABLE_LEFT,
          HEADER_Y - 0.26
        ),

        pos(
          TABLE_RIGHT,
          HEADER_Y - 0.26
        ),

        MUTED, 1.3
      )
    );
  }

  function readerRowLabel(i) {
    const color =
      READER_COLORS[i];

    return new M.VGroup(
      glowDot(
        pos(
          NAME_X - 0.34,
          ty(i)
        ),

        color, 0.045
      ),

      at(
        READERS[i],
        P ? 18 : 16,
        color,
        NAME_X + 0.09,
        ty(i),
        false, 0.78
      )
    );
  }

  function matrixCellFrame(
    i, j,
    color = MUTED,
    opacity = 0.38
  ) {
    return outline(
      tx(j), ty(i),
      CELL_W, CELL_H,
      color,
      opacity, 1.2
    );
  }

  function matrixRating(
    i, j,
    value = RATINGS[i][j],
    predicted = false
  ) {
    if (value === null) {
      return null;
    }

    const x = tx(j);
    const y = ty(i);

    const color =
      predicted
        ? PREDICTED
        : YELLOW;

    return new M.VGroup(
      at(
        value,
        P ? 23 : 19,

        predicted
          ? PREDICTED
          : INK,

        x,

        y +
          (P ? 0.16 : 0.095),

        true
      ),

      stars(
        value,
        x,

        y -
          (P ? 0.20 : 0.12),

        CELL_W * 0.83,
        color
      )
    );
  }

  function cellOutline(
    i, j,
    color = CYAN,
    width = 2.4
  ) {
    return outline(
      tx(j),
      ty(i),
      CELL_W + 0.065,
      CELL_H + 0.07,
      color, 0, width
    );
  }

  function rowOutline(
    i,
    color = READER_COLORS[i]
  ) {
    return outline(
      (TABLE_LEFT + TABLE_RIGHT) / 2,
      ty(i),

      TABLE_RIGHT -
        TABLE_LEFT + 0.07,

      CELL_H + 0.11,
      color, 0, 2.4
    );
  }

  function columnOutline(
    j,
    color = BOOK_COLORS[BOOKS[j]]
  ) {
    return outline(
      tx(j),

      (
        ty(0) +
        ty(READERS.length - 1)
      ) / 2,

      CELL_W + 0.075,

      ty(0) -
        ty(READERS.length - 1) +
        CELL_H + 0.10,

      color, 0, 2.4
    );
  }

  function newTable(
    revealAll = false
  ) {
    const header =
      tableHeader();

    const labels = READERS.map(
      (_, i) =>
        readerRowLabel(i)
    );

    const frames = RATINGS.map(
      (row, i) =>
        row.map(
          (_, j) =>
            matrixCellFrame(i, j)
        )
    );

    const values = RATINGS.map(
      (row, i) =>
        row.map(
          (_, j) =>
            matrixRating(i, j)
        )
    );

    const objects = [
      header,
      ...labels,
      ...frames.flat()
    ];

    if (revealAll) {
      objects.push(
        ...values
          .flat()
          .filter(Boolean)
      );
    }

    return {
      header,
      labels,
      frames,
      values,
      objects
    };
  }

  let table =
    newTable(false);

  // ------------------------------------------------------------
  // 5: draw one row per reader and one column per book.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...scene(
      table.header,
      ...table.labels
    ),

    ...enterLagged(
      table.frames.flat(),
      0.035, 1.25
    ),

    ...fbox([
      ['Rating table', CYAN],
      '4 reader rows',
      '5 book columns',
      'One box for each rating'
    ]),

    ...say('FOUR ROWS × FIVE COLUMNS')
  );

  // ------------------------------------------------------------
  // 6: ratings range from one to five stars.
  // ------------------------------------------------------------

  function ratingScale() {
    const parts = [];

    const titleY =
      P ? -3.50 : -1.98;

    const starsY =
      P ? -4.02 : -2.36;

    parts.push(
      at(
        'Rating scale: 1 to 5 stars',
        P ? 18 : 15,
        YELLOW,
        CX,
        titleY
      )
    );

    for (let value = 1; value <= 5; value++) {
      const x =
        CX + (value - 3) * 1.21;

      parts.push(
        stars(
          value,
          x,
          starsY,
          P ? 0.98 : 0.82
        ),

        at(
          value,
          P ? 16 : 13,
          INK,
          x,

          starsY -
            (P ? 0.31 : 0.20),

          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const ratingGuide =
    ratingScale();

  await until(S(6));

  await play(
    ...enter(ratingGuide),

    ...fbox([
      ['Ratings', YELLOW],
      '1 star: lower preference',
      '5 stars: higher preference'
    ], YELLOW),

    ...say('ONE TO FIVE STARS', YELLOW)
  );

  // ------------------------------------------------------------
  // 7: name the stars as ratings.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    new M.Indicate(
      ratingGuide,
      { color: YELLOW }
    ),

    ...fbox([
      ['Rating', YELLOW],
      'A reader’s opinion of a book',
      'More stars indicate',
      'a stronger preference'
    ], YELLOW),

    ...say('MORE STARS MEAN A STRONGER PREFERENCE', YELLOW)
  );

  // ------------------------------------------------------------
  // Rating reveal helpers.
  // ------------------------------------------------------------

  function revealCell(i, j) {
    const obj =
      table.values[i][j];

    return obj === null
      ? []
      : enter(obj);
  }

  function revealRow(i) {
    const objects =
      table.values[i]
        .filter(Boolean);

    return enterLagged(
      objects,
      0.17, 1.05
    );
  }

  function ratingRowBox(i) {
    return fbox([
      [READERS[i], READER_COLORS[i]],

      ...BOOKS
        .map((name, j) => ({
          name,
          value: RATINGS[i][j]
        }))

        .filter(
          item => item.value !== null
        )

        .map(
          item => [
            `${item.name}: ${item.value} stars`,
            BOOK_COLORS[item.name]
          ]
        )
    ], READER_COLORS[i]);
  }

  // ------------------------------------------------------------
  // 8: Ana rates Trail four stars and Clues two stars.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...leave(ratingGuide),

    ...revealCell(TARGET, 0),
    ...revealCell(TARGET, 2),

    ...focus(
      cellOutline(TARGET, 0, GREEN),
      cellOutline(TARGET, 2, AMBER)
    ),

    ...fbox([
      ['Ana’s known ratings', CYAN],
      ['Trail = 4 stars', GREEN],
      ['Clues = 2 stars', AMBER]
    ]),

    ...say('ANA: TRAIL 4, CLUES 2')
  );

  // ------------------------------------------------------------
  // 9: River, Castle and Island have not been rated by Ana.
  // ------------------------------------------------------------

  const anaMissingFrames = UNKNOWN.map(
    j =>
      cellOutline(
        TARGET, j,
        MUTED
      )
  );

  await until(S(9));

  await play(
    ...focus(...anaMissingFrames),

    ...fbox([
      ['Ana has not rated', MUTED],
      ['River', TEAL],
      ['Castle', PURPLE],
      ['Island', YELLOW]
    ]),

    ...say('THREE RATINGS ARE UNKNOWN')
  );

  // ------------------------------------------------------------
  // 10: leave the three boxes empty.
  //
  // Do not introduce zero values or empty five-star ratings.
  // ------------------------------------------------------------

  const blankNote = note(
    'Empty box = not rated, not zero stars',
    MUTED,
    P ? -3.60 : -2.10
  );

  await until(S(10));

  await play(
    ...enter(blankNote),

    ...fbox([
      ['Leave unknown ratings empty', MUTED],
      'We do not know these ratings',
      ['Missing is not zero', AMBER]
    ], AMBER),

    ...say('EMPTY DOES NOT MEAN ZERO', AMBER)
  );

  // ------------------------------------------------------------
  // 11: inspect the other three readers.
  // ------------------------------------------------------------

  const otherReadersOutline = outline(
    (TABLE_LEFT + TABLE_RIGHT) / 2,

    (
      ty(1) + ty(3)
    ) / 2,

    TABLE_RIGHT -
      TABLE_LEFT + 0.10,

    ty(1) -
      ty(3) +
      CELL_H + 0.13,

    BLUE, 0, 2.0
  );

  await until(S(11));

  await play(
    ...focus(otherReadersOutline),

    ...fbox([
      ['Other readers', INK],
      ['Ben', BLUE],
      ['Cara', ORANGE],
      ['Dan', PURPLE]
    ]),

    ...say('LOOK AT BEN, CARA AND DAN')
  );

  // ------------------------------------------------------------
  // 12: Ben's four known ratings.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...revealRow(1),

    ...focus(
      rowOutline(1, BLUE)
    ),

    ...ratingRowBox(1),

    ...say('BEN: 4, 5, 2, 1', BLUE)
  );

  // ------------------------------------------------------------
  // 13: Cara's four known ratings.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...revealRow(2),

    ...focus(
      rowOutline(2, ORANGE)
    ),

    ...ratingRowBox(2),

    ...say('CARA: 2, 1, 4, 5', ORANGE)
  );

  // ------------------------------------------------------------
  // 14: Dan's four known ratings.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...revealRow(3),

    ...focus(
      rowOutline(3, PURPLE)
    ),

    ...ratingRowBox(3),

    ...say('DAN: 2, 2, 4, 4', PURPLE)
  );

  // ------------------------------------------------------------
  // 15: nobody has rated Island yet.
  // ------------------------------------------------------------

  const islandEmptyTag = tagAt(
    `${ISLAND_RATING_COUNT} ISLAND RATINGS`,
    YELLOW,

    tx(ISLAND_INDEX),

    P ? -4.04 : -2.48,

    P ? 16 : 13,

    2.20
  );

  await until(S(15));

  await play(
    ...focus(
      columnOutline(
        ISLAND_INDEX,
        YELLOW
      )
    ),

    ...enter(islandEmptyTag),

    ...fbox([
      ['Island is new', YELLOW],
      'Ana: not rated',
      'Ben, Cara, Dan: not rated',
      ['0 known ratings', MUTED]
    ], YELLOW),

    ...say('NOBODY HAS RATED ISLAND YET', YELLOW)
  );

  // ------------------------------------------------------------
  // 16–20: intuition for collaborative filtering.
  //
  // Advice based on similar tastes, not book content.
  //
  // The friendship analogy does not require actual friendship
  // edges in the recommendation calculation.
  // ------------------------------------------------------------

  function advicePicture(
    withKnownRatings = false
  ) {
    const parts = [];

    const y =
      P ? 0.16 : 0.32;

    const anaX =
      CX - 1.84;

    const otherX =
      CX + 1.84;

    parts.push(
      readerIcon(
        TARGET,
        anaX, y,
        1.07
      ),

      readerIcon(
        1,
        otherX, y,
        1.07
      ),

      arrow(
        pos(otherX - 0.66, y + 0.12),
        pos(anaX + 0.66, y + 0.12),
        BLUE, 2.9
      ),

      at(
        'Book advice',
        P ? 18 : 16,
        BLUE,
        CX,
        y + 0.46
      )
    );

    if (withKnownRatings) {
      const rowYs = P
        ? [-1.50, -2.62]
        : [-0.94, -1.77];

      KNOWN.forEach((j, k) => {
        const yy =
          rowYs[k];

        parts.push(
          at(
            BOOKS[j],
            P ? 19 : 17,
            BOOK_COLORS[BOOKS[j]],
            CX, yy,
            false, 1.12
          ),

          stars(
            RATINGS[TARGET][j],
            anaX,
            yy,
            1.38
          ),

          stars(
            RATINGS[1][j],
            otherX,
            yy,
            1.38
          ),

          at(
            'Match',
            P ? 14 : 12,
            GREEN,
            CX,
            yy - 0.29
          )
        );
      });
    } else {
      parts.push(
        note(
          'Whose advice would you trust?',
          GREEN,
          P ? -2.64 : -1.91
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const advice =
    advicePicture(false);

  await until(S(16));
  setStage(1.08, 1.5, 1.6);

  await play(
    ...scene(advice),

    ...fbox([
      ['Imagine asking a friend', CYAN],
      'Can you recommend',
      'a book I might enjoy?'
    ]),

    ...say('ASK A FRIEND FOR A BOOK SUGGESTION')
  );

  const similarAdvice =
    advicePicture(true);

  await until(S(17));
  setStage(1.08, 1.5, 1.6);

  await play(
    ...scene(similarAdvice),

    ...fbox([
      ['Similar tastes', GREEN],
      'Enjoy some of the same books',
      'Have similar ratings',
      'Their advice may be useful'
    ], GREEN),

    ...say('ADVICE FROM SOMEONE WITH SIMILAR TASTES', GREEN)
  );

  // ------------------------------------------------------------
  // 18: search for a reader with similar preferences.
  // ------------------------------------------------------------

  function neighborQuestion() {
    const parts = [];

    const targetY =
      P ? 0.85 : 0.79;

    const othersY =
      P ? -1.60 : -1.06;

    parts.push(
      readerIcon(
        TARGET,
        CX,
        targetY,
        0.90
      )
    );

    for (let i = 1; i <= 3; i++) {
      const x =
        CX + (i - 2) * 2.07;

      parts.push(
        dashed(
          pos(
            CX + (i - 2) * 0.22,
            targetY - 0.76
          ),

          pos(
            x,
            othersY + 0.55
          ),

          MUTED, 1.8
        ),

        readerIcon(
          i,
          x, othersY,
          0.86
        ),

        at(
          '?',
          23,
          READER_COLORS[i],
          x,
          othersY + 0.81
        )
      );
    }

    parts.push(
      note(
        'Which reader has the closest ratings?',
        GREEN,
        P ? -3.67 : -2.28
      )
    );

    return new M.VGroup(...parts);
  }

  const neighborIdea =
    neighborQuestion();

  await until(S(18));
  setStage(1.08, 1.5, 1.6);

  await play(
    ...scene(neighborIdea),

    ...fbox([
      ['Find Ana’s closest match', CYAN],
      'Compare known ratings',
      'Ben, Cara or Dan?'
    ]),

    ...say('FIND THE READER WITH THE MOST SIMILAR TASTES')
  );

  // ------------------------------------------------------------
  // 19: use that reader's other ratings.
  // ------------------------------------------------------------

  function methodPicture() {
    const y =
      P ? -0.26 : -0.19;

    const xs = [
      CX - 2.13,
      CX,
      CX + 2.13
    ];

    const titles = [
      'Known ratings',
      'Closest reader',
      'Other ratings'
    ];

    const colors = [
      CYAN,
      GREEN,
      PREDICTED
    ];

    const parts = [];

    xs.forEach((x, k) => {
      const h =
        P ? 2.42 : 1.94;

      parts.push(
        outline(
          x, y,
          1.81, h,
          colors[k], 0.48
        ),

        at(
          titles[k],
          P ? 17 : 15,
          colors[k],
          x,
          y + h / 2 - 0.27,
          false, 1.65
        )
      );

      if (k === 0) {
        parts.push(
          stars(
            4,
            x, y + 0.18,
            1.25
          ),

          stars(
            2,
            x, y - 0.33,
            1.25
          )
        );
      }

      if (k === 1) {
        parts.push(
          circle(
            x, y,
            0.37,
            GREEN, 0.16, 2
          ),

          at(
            '?',
            30,
            GREEN,
            x, y
          )
        );
      }

      if (k === 2) {
        parts.push(
          at(
            '? stars',
            P ? 23 : 20,
            PREDICTED,
            x, y,
            true, 1.56
          )
        );
      }

      if (k < 2) {
        parts.push(
          arrow(
            pos(x + 0.93, y),
            pos(xs[k + 1] - 0.93, y),
            GREEN, 2.3, 0.09
          )
        );
      }
    });

    return new M.VGroup(
      ...parts,

      note(
        'Find a similar reader, then borrow their opinions',
        GREEN,
        P ? -2.94 : -1.97
      )
    );
  }

  const method =
    methodPicture();

  await until(S(19));
  setStage(1.15, -0.95, -1.75);

  await play(
    ...scene(method),

    ...fbox([
      ['Two steps', GREEN],
      '1. Find a similar reader',
      '2. Use their other ratings',
      '   to make recommendations'
    ], GREEN),

    ...say('USE THEIR RATINGS TO SUGGEST OTHER BOOKS', GREEN)
  );

  // ------------------------------------------------------------
  // 20: name collaborative filtering.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...fbox([
      ['Collaborative filtering', GREEN],
      'Use information from',
      'people with similar tastes',
      'to predict preferences'
    ], GREEN),

    ...say('COLLABORATIVE FILTERING', GREEN)
  );

  // ------------------------------------------------------------
  // 21–22: return to the rating matrix.
  //
  // Highlight exactly the two books Ana has rated:
  // Trail and Clues.
  //
  // The other three books cannot be used to calculate
  // a rating difference from Ana.
  // ------------------------------------------------------------

  table =
    newTable(true);

  const knownColumns = KNOWN.map(
    j =>
      columnOutline(
        j,
        BOOK_COLORS[BOOKS[j]]
      )
  );

  const comparisonNote = note(
    'Compare only books with known ratings from both readers',
    GREEN,
    P ? -3.75 : -2.17
  );

  await until(S(21));
  setStage(1.08, 1.45, 1.65);

  await play(
    ...scene(
      ...table.objects,
      ...knownColumns
    ),

    ...focus(
      ...KNOWN.map(
        j =>
          cellOutline(
            TARGET, j,
            CYAN
          )
      )
    ),

    ...fbox([
      ['Ana’s rated books', CYAN],
      ['Trail = 4', GREEN],
      ['Clues = 2', AMBER],
      'Use these two columns'
    ]),

    ...say('HIGHLIGHT TRAIL AND CLUES')
  );

  await until(S(22));

  await play(
    ...clearFocus(),

    ...enter(comparisonNote),

    ...fbox([
      ['Shared rated books', GREEN],
      'Both readers must have',
      'a known rating for the book',
      ['Compare exactly 2 books', GREEN]
    ], GREEN),

    ...say('COMPARE ONLY THE TWO SHARED BOOKS', GREEN)
  );

  // ------------------------------------------------------------
  // Absolute rating-gap illustration.
  //
  // Two star rows share the same left alignment.
  // The five positions are fixed.
  //
  // A dashed guide connects matched star positions.
  // Extra filled stars are outlined in amber.
  //
  // A visible bracket spans exactly the unmatched positions.
  //
  // The gap remains nonnegative whether Ana or the
  // comparison reader supplies the larger rating.
  // ------------------------------------------------------------

  const GAP_STAR_STEP =
    P ? 0.47 : 0.44;

  const GAP_STAR_RADIUS =
    P ? 0.15 : 0.135;

  const GAP_STAR_LEFT =
    CX - 0.62;

  const GAP_LABEL_X =
    CX - 2.30;

  const GAP_VALUE_X =
    CX + 2.36;

  const gapStarX = j =>
    GAP_STAR_LEFT +
    j * GAP_STAR_STEP;

  function comparisonBook(
    bookIndex,
    y
  ) {
    const name =
      BOOKS[bookIndex];

    return new M.VGroup(
      bookCard(
        name,
        CX - 2.27,
        y,
        1.15,
        P ? 0.81 : 0.67
      ),

      at(
        'Rating positions',
        P ? 15 : 13,
        MUTED,
        CX + 0.31,
        y + 0.08
      )
    );
  }

  function ratingComparisonRow(
    readerIndex,
    bookIndex,
    y
  ) {
    const value =
      RATINGS[readerIndex][bookIndex];

    const color =
      READER_COLORS[readerIndex];

    const parts = [
      at(
        READERS[readerIndex],
        P ? 22 : 19,
        color,
        GAP_LABEL_X,
        y,
        false, 1.25
      ),

      glowDot(
        pos(
          GAP_LABEL_X - 0.66,
          y
        ),

        color, 0.055
      ),

      at(
        value,
        P ? 25 : 22,
        INK,
        GAP_VALUE_X,
        y,
        true
      )
    ];

    for (let j = 0; j < 5; j++) {
      parts.push(
        ratingStar(
          gapStarX(j),
          y,
          j < value,
          GAP_STAR_RADIUS,
          YELLOW
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function gapPicture(
    readerIndex,
    bookIndex,
    stage = 'gap'
  ) {
    const a =
      RATINGS[TARGET][bookIndex];

    const b =
      RATINGS[readerIndex][bookIndex];

    const difference =
      Math.abs(a - b);

    const minimum =
      Math.min(a, b);

    const maximum =
      Math.max(a, b);

    const upper =
      P ? 0.30 : 0.26;

    const lower =
      P ? -0.99 : -0.75;

    const headerY =
      P ? 1.44 : 1.12;

    const parts = [
      comparisonBook(
        bookIndex,
        headerY
      ),

      ratingComparisonRow(
        TARGET,
        bookIndex,
        upper
      ),

      ratingComparisonRow(
        readerIndex,
        bookIndex,
        lower
      )
    ];

    for (let j = 0; j < 5; j++) {
      parts.push(
        at(
          j + 1,
          P ? 12 : 11,
          MUTED,
          gapStarX(j),
          upper + 0.43,
          true
        )
      );
    }

    if (stage === 'gap') {
      // Show the common filled positions.

      for (let j = 0; j < minimum; j++) {
        parts.push(
          dashed(
            pos(
              gapStarX(j),
              upper - 0.20
            ),

            pos(
              gapStarX(j),
              lower + 0.20
            ),

            GREEN, 1.6
          )
        );
      }

      // Highlight only the extra filled stars.

      if (difference > 0) {
        const largerY =
          a > b ? upper : lower;

        for (
          let j = minimum;
          j < maximum;
          j++
        ) {
          parts.push(
            outline(
              gapStarX(j),
              largerY,

              GAP_STAR_STEP * 0.90,

              GAP_STAR_RADIUS * 2.75,

              GAP, 0, 2.3
            )
          );
        }

        const left =
          gapStarX(minimum) -
          GAP_STAR_STEP * 0.45;

        const right =
          gapStarX(maximum - 1) +
          GAP_STAR_STEP * 0.45;

        const y =
          P ? -1.86 : -1.35;

        parts.push(
          line(
            pos(left, y),
            pos(right, y),
            GAP, 2.2
          ),

          line(
            pos(left, y - 0.08),
            pos(left, y + 0.08),
            GAP, 2
          ),

          line(
            pos(right, y - 0.08),
            pos(right, y + 0.08),
            GAP, 2
          ),

          at(
            `${difference} extra stars`,
            P ? 17 : 15,
            GAP,
            (left + right) / 2,
            y - 0.27,
            false, 2.30
          )
        );
      } else {
        parts.push(
          tagAt(
            'EXACT MATCH',
            GREEN,
            CX,
            P ? -1.86 : -1.46,
            P ? 19 : 16
          )
        );
      }

      parts.push(
        at(
          `Gap = ${difference}`,
          P ? 35 : 29,

          difference === 0
            ? GREEN
            : GAP,

          CX,

          P ? -3.17 : -2.20,

          true
        )
      );
    }

    if (stage === 'direction') {
      const largerName =
        a > b
          ? READERS[TARGET]
          : READERS[readerIndex];

      parts.push(
        at(
          `${largerName} gives more stars`,
          P ? 20 : 17,
          GAP,
          CX,
          P ? -2.06 : -1.58
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Comparison calculation helpers.
  // ------------------------------------------------------------

  function differenceFor(
    readerIndex,
    bookIndex
  ) {
    return COMPARISON_BY_READER[
      readerIndex
    ].differences.find(
      d => d.index === bookIndex
    );
  }

  function gapBox(
    readerIndex,
    bookIndex
  ) {
    const d =
      differenceFor(
        readerIndex,
        bookIndex
      );

    return fbox([
      [d.book, BOOK_COLORS[d.book]],

      [`Ana = ${d.a}`, CYAN],

      [
        `${READERS[readerIndex]} = ${d.b}`,
        READER_COLORS[readerIndex]
      ],

      [
        `Gap = |${d.a} − ${d.b}| = ${d.gap}`,

        d.gap === 0
          ? GREEN
          : GAP
      ]
    ]);
  }

  // ------------------------------------------------------------
  // 23: begin with Ben.
  // ------------------------------------------------------------

  function selectedReaderPicture(i) {
    const y =
      P ? -0.19 : -0.17;

    return new M.VGroup(
      readerIcon(
        TARGET,
        CX - 1.76,
        y,
        1.18
      ),

      readerIcon(
        i,
        CX + 1.76,
        y,
        1.18
      ),

      arrow(
        pos(CX - 0.96, y),
        pos(CX + 0.96, y),
        READER_COLORS[i],
        2.8
      ),

      at(
        'Compare ratings',
        P ? 18 : 16,
        INK,
        CX,
        y + 0.42
      ),

      at(
        'Trail and Clues',
        P ? 20 : 18,
        GREEN,
        CX,
        P ? -2.28 : -1.69
      )
    );
  }

  const selectBen =
    selectedReaderPicture(1);

  await until(S(23));
  setStage(1.08, 1.5, 1.6);

  await play(
    ...scene(selectBen),

    ...fbox([
      ['First comparison', BLUE],
      'Ana versus Ben',
      'Trail and Clues'
    ], BLUE),

    ...say('START WITH BEN', BLUE)
  );

  // ------------------------------------------------------------
  // 24: Trail ratings match exactly.
  // ------------------------------------------------------------

  const benTrail =
    gapPicture(1, 0);

  await until(S(24));
  setStage(1.15, 1.77, 1.85, -0.2);

  await play(
    ...scene(benTrail),

    ...gapBox(1, 0),

    ...say('TRAIL: FOUR AND FOUR, GAP ZERO', GREEN)
  );

  // ------------------------------------------------------------
  // 25: Clues ratings also match exactly.
  // ------------------------------------------------------------

  const benClues =
    gapPicture(1, 2);

  await until(S(25));
  setStage(1.15, 1.77, 1.85, -0.2);

  await play(
    ...scene(benClues),

    ...gapBox(1, 2),

    ...say('CLUES: TWO AND TWO, GAP ZERO', GREEN)
  );

  // ------------------------------------------------------------
  // Mean-gap calculation workspace.
  //
  // Each shared book contributes a nonnegative gap.
  //
  // Gaps are represented by unit blocks.
  // A zero gap has a visible empty block track and a
  // numeric label of 0.
  //
  // Sum the gaps, then divide by the number of shared books.
  // ------------------------------------------------------------

  const MEAN_TOP =
    P ? 0.66 : 0.79;

  const MEAN_PITCH =
    P ? 1.20 : 0.83;

  const MEAN_BLOCK_STEP =
    P ? 0.46 : 0.39;

  const MEAN_BLOCK_W =
    MEAN_BLOCK_STEP * 0.86;

  const MEAN_BLOCK_H =
    P ? 0.36 : 0.29;

  const MEAN_LEFT =
    CX - 0.76;

  const meanRowY = k =>
    MEAN_TOP -
    k * MEAN_PITCH;

  function gapUnitBlock(
    x, y,
    color = GAP
  ) {
    return new M.VGroup(
      rect(
        x, y,
        MEAN_BLOCK_W + 0.04,
        MEAN_BLOCK_H + 0.04,
        color, 0.13, 0
      ),

      rect(
        x, y,
        MEAN_BLOCK_W,
        MEAN_BLOCK_H,
        color, 0.86, 1
      )
    );
  }

  function meanGapRow(
    readerIndex,
    k
  ) {
    const result =
      COMPARISON_BY_READER[
        readerIndex
      ];

    const d =
      result.differences[k];

    const y =
      meanRowY(k);

    const parts = [
      at(
        d.book,
        P ? 21 : 18,
        BOOK_COLORS[d.book],
        CX - 2.33,
        y,
        false, 1.36
      ),

      at(
        `${d.a} vs ${d.b}`,
        P ? 17 : 15,
        INK,
        CX - 1.08,
        y,
        true, 1.18
      )
    ];

    for (let j = 0; j < 4; j++) {
      const x =
        MEAN_LEFT +
        0.66 +
        j * MEAN_BLOCK_STEP;

      parts.push(
        outline(
          x, y,
          MEAN_BLOCK_W,
          MEAN_BLOCK_H,

          j < d.gap
            ? GAP
            : MUTED,

          0.30, 1
        )
      );

      if (j < d.gap) {
        parts.push(
          gapUnitBlock(
            x, y, GAP
          )
        );
      }
    }

    parts.push(
      at(
        `Gap ${d.gap}`,
        P ? 20 : 17,

        d.gap === 0
          ? GREEN
          : GAP,

        CX + 2.58,
        y,
        true, 1.18
      )
    );

    return new M.VGroup(...parts);
  }

  function meanWorkspace(
    readerIndex,
    stage = 0
  ) {
    const result =
      COMPARISON_BY_READER[
        readerIndex
      ];

    const parts = [
      at(
        `Ana versus ${READERS[readerIndex]}`,
        P ? 21 : 18,
        READER_COLORS[readerIndex],
        CX,
        P ? 1.46 : 1.40
      ),

      ...result.differences.map(
        (_, k) =>
          meanGapRow(
            readerIndex, k
          )
      )
    ];

    const sumY =
      P ? -1.74 : -0.85;

    const countY =
      P ? -2.58 : -1.45;

    const resultY =
      P ? -3.60 : -2.17;

    if (stage >= 1) {
      const expression =
        result.differences
          .map(d => d.gap)
          .join(' + ');

      parts.push(
        line(
          pos(CX - 2.85, sumY + 0.45),
          pos(CX + 2.85, sumY + 0.45),
          MUTED, 1.3
        ),

        at(
          `${expression} = ${result.total}`,
          P ? 27 : 23,
          GAP,
          CX,
          sumY,
          true
        )
      );
    }

    if (stage >= 2) {
      parts.push(
        at(
          `Divide by ${result.count} shared books`,
          P ? 19 : 16,
          CYAN,
          CX, countY,
          false,
          MAIN_W - 0.40
        )
      );
    }

    if (stage >= 3) {
      parts.push(
        tagAt(
          `${result.total} ÷ ${result.count} = ${fmt(result.mean)}`,
          result.mean === 0
            ? GREEN
            : GAP,

          CX,
          resultY,

          P ? 24 : 21
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 26: find the mean of Ben's two rating gaps.
  // ------------------------------------------------------------

  const benMean0 =
    meanWorkspace(1, 0);

  await until(S(26));
  setStage(1.15, 1.5, 1.6, 0.25);

  await play(
    ...scene(benMean0),

    ...fbox([
      ['Mean gap', CYAN],
      'Average size of the gaps',
      ['Trail gap = 0', GREEN],
      ['Clues gap = 0', GREEN]
    ]),

    ...say('FIND THE AVERAGE OF THE TWO GAPS')
  );

  // ------------------------------------------------------------
  // 27: add zero and zero.
  // ------------------------------------------------------------

  const benMean1 =
    meanWorkspace(1, 1);

  await until(S(27));

  await play(
    ...scene(benMean1),

    ...fbox([
      ['Add the gaps', GAP],
      '0 + 0',
      ['= 0', GREEN]
    ], GAP),

    ...say('ZERO PLUS ZERO = ZERO', GREEN)
  );

  // ------------------------------------------------------------
  // 28: divide by the two shared books.
  // ------------------------------------------------------------

  const benMean2 =
    meanWorkspace(1, 2);

  await until(S(28));

  await play(
    ...scene(benMean2),

    ...fbox([
      ['Two shared books', CYAN],
      'Trail and Clues',
      'Divide the total gap by 2'
    ]),

    ...say('DIVIDE BY TWO SHARED BOOKS')
  );

  // ------------------------------------------------------------
  // 29: Ben's mean gap is zero.
  // ------------------------------------------------------------

  const benMean3 =
    meanWorkspace(1, 3);

  const benResult =
    COMPARISON_BY_READER[1];

  await until(S(29));

  await play(
    ...scene(benMean3),

    ...fbox([
      ['Ben’s mean gap', BLUE],
      `${benResult.total} ÷ ${benResult.count}`,
      [`= ${fmt(benResult.mean)} stars`, GREEN]
    ], GREEN),

    ...say('BEN’S MEAN GAP = ZERO', GREEN)
  );

  // ------------------------------------------------------------
  // 30: compare Ana with Cara.
  // ------------------------------------------------------------

  const selectCara =
    selectedReaderPicture(2);

  await until(S(30));
  setStage(1.08, 1.5, 1.6);

  await play(
    ...scene(selectCara),

    ...fbox([
      ['Second comparison', ORANGE],
      'Ana versus Cara',
      'Use the same two books'
    ], ORANGE),

    ...say('NOW COMPARE ANA WITH CARA', ORANGE)
  );

  // ------------------------------------------------------------
  // 31: Ana gives Trail four stars, Cara gives it two.
  // ------------------------------------------------------------

  const caraTrailValues =
    gapPicture(
      2, 0,
      'values'
    );

  await until(S(31));
  setStage(1.15, 1.77, 1.85, -0.2);

  await play(
    ...scene(caraTrailValues),

    ...fbox([
      ['Trail', GREEN],
      ['Ana = 4 stars', CYAN],
      ['Cara = 2 stars', ORANGE]
    ], ORANGE),

    ...say('TRAIL: ANA 4, CARA 2', ORANGE)
  );

  // ------------------------------------------------------------
  // 32: the absolute rating gap is two.
  //
  // Highlight the two unmatched filled stars in Ana's row.
  // ------------------------------------------------------------

  const caraTrailGap =
    gapPicture(2, 0);

  await until(S(32));

  await play(
    ...scene(caraTrailGap),

    ...gapBox(2, 0),

    ...say('FOUR MINUS TWO = A GAP OF TWO', GAP)
  );

  // ------------------------------------------------------------
  // 33: Ana gives Clues two stars, Cara gives it four.
  // ------------------------------------------------------------

  const caraCluesValues =
    gapPicture(
      2, 2,
      'values'
    );

  await until(S(33));

  await play(
    ...scene(caraCluesValues),

    ...fbox([
      ['Clues', AMBER],
      ['Ana = 2 stars', CYAN],
      ['Cara = 4 stars', ORANGE]
    ], ORANGE),

    ...say('CLUES: ANA 2, CARA 4', ORANGE)
  );

  // ------------------------------------------------------------
  // 34: the gap is again two.
  //
  // This time highlight the extra filled stars in Cara's row.
  // The absolute difference is positive in both cases.
  // ------------------------------------------------------------

  const caraCluesGap =
    gapPicture(2, 2);

  await until(S(34));

  await play(
    ...scene(caraCluesGap),

    ...fbox([
      ['Cara gives more this time', ORANGE],
      '2 − 4 = −2',
      ['Absolute gap = 2', GAP],
      'Ignore the direction'
    ], GAP),

    ...say('THE GAP IS STILL TWO STARS', GAP)
  );

  // ------------------------------------------------------------
  // 35: two plus two makes four.
  // ------------------------------------------------------------

  const caraMean1 =
    meanWorkspace(2, 1);

  const caraResult =
    COMPARISON_BY_READER[2];

  await until(S(35));
  setStage(1.15, 1.5, 1.6, 0.25);

  await play(
    ...scene(caraMean1),

    ...fbox([
      ['Add Cara’s two gaps', GAP],
      '2 + 2',
      ['= 4 stars', GAP]
    ], GAP),

    ...say('TWO PLUS TWO = FOUR', GAP)
  );

  // ------------------------------------------------------------
  // 36: Cara's mean gap is two.
  // ------------------------------------------------------------

  const caraMean3 =
    meanWorkspace(2, 3);

  await until(S(36));

  await play(
    ...scene(caraMean3),

    ...fbox([
      ['Cara’s mean gap', ORANGE],
      `${caraResult.total} ÷ ${caraResult.count}`,
      [`= ${fmt(caraResult.mean)} stars`, GAP]
    ], ORANGE),

    ...say('CARA’S MEAN GAP = TWO STARS', ORANGE)
  );

  // ------------------------------------------------------------
  // 37: Dan has the same Trail and Clues ratings as Cara.
  //
  // This comparison does not claim that Cara and Dan have
  // identical ratings for the other books.
  // ------------------------------------------------------------

  function caraDanComparison() {
    const parts = [];

    const xs = [
      CX - 2.19,
      CX - 0.02,
      CX + 2.20
    ];

    const yHeader =
      P ? 1.08 : 1.10;

    const rowYs = P
      ? [-0.18, -1.74]
      : [0.04, -1.15];

    parts.push(
      at(
        'Shared book',
        P ? 17 : 15,
        INK,
        xs[0],
        yHeader,
        false, 1.56
      ),

      at(
        'Cara',
        P ? 22 : 19,
        ORANGE,
        xs[1],
        yHeader
      ),

      at(
        'Dan',
        P ? 22 : 19,
        PURPLE,
        xs[2],
        yHeader
      )
    );

    KNOWN.forEach((j, k) => {
      const y =
        rowYs[k];

      parts.push(
        bookCard(
          BOOKS[j],
          xs[0],
          y,
          1.30,
          P ? 1.03 : 0.82
        ),

        outline(
          xs[1], y,
          1.75,
          P ? 1.02 : 0.78,
          ORANGE, 0.37
        ),

        outline(
          xs[2], y,
          1.75,
          P ? 1.02 : 0.78,
          PURPLE, 0.37
        )
      );

      for (const i of [2, 3]) {
        const x =
          xs[i - 1];

        parts.push(
          at(
            RATINGS[i][j],
            P ? 23 : 20,
            INK,
            x, y + 0.15,
            true
          ),

          stars(
            RATINGS[i][j],
            x, y - 0.20,
            1.28
          )
        );
      }

      parts.push(
        at(
          '=',
          24, GREEN,

          (
            xs[1] +
            xs[2]
          ) / 2,

          y,
          true
        )
      );
    });

    parts.push(
      note(
        'Same ratings on these two books',
        GREEN,
        P ? -3.37 : -2.19
      )
    );

    return new M.VGroup(...parts);
  }

  const caraDan =
    caraDanComparison();

  await until(S(37));
  setStage(1.08, 1.5, 1.6);

  await play(
    ...scene(caraDan),

    ...fbox([
      ['Cara and Dan', INK],
      ['Both rate Trail 2', GREEN],
      ['Both rate Clues 4', AMBER],
      'Same two gaps from Ana'
    ], PURPLE),

    ...say('DAN MATCHES CARA ON TRAIL AND CLUES', PURPLE)
  );

  // ------------------------------------------------------------
  // 38: Dan also has mean gap two.
  // ------------------------------------------------------------

  const danMean3 =
    meanWorkspace(3, 3);

  const danResult =
    COMPARISON_BY_READER[3];

  await until(S(38));
  setStage(1.15, 1.5, 1.6, 0.25);

  await play(
    ...scene(danMean3),

    ...fbox([
      ['Dan’s mean gap', PURPLE],
      '2 + 2 = 4',
      `${danResult.total} ÷ ${danResult.count}`,
      [`= ${fmt(danResult.mean)} stars`, GAP]
    ], PURPLE),

    ...say('DAN’S MEAN GAP = TWO STARS', PURPLE)
  );

  // ------------------------------------------------------------
  // Comparison-results table.
  //
  // The reader order remains Ben, Cara, Dan.
  // Each value comes from the actual comparison calculation.
  // ------------------------------------------------------------

  const RESULT_TOP =
    P ? 0.55 : 0.61;

  const RESULT_PITCH =
    P ? 1.20 : 0.89;

  const RESULT_X = {
    reader: CX - 2.45,
    trail: CX - 0.79,
    clues: CX + 0.72,
    mean: CX + 2.44
  };

  const resultY = k =>
    RESULT_TOP -
    k * RESULT_PITCH;

  function resultsHeader() {
    const y =
      RESULT_TOP +
      (P ? 0.83 : 0.66);

    return new M.VGroup(
      at(
        'Reader',
        P ? 17 : 15,
        INK,
        RESULT_X.reader, y
      ),

      at(
        'Trail gap',
        P ? 17 : 15,
        GREEN,
        RESULT_X.trail, y,
        false, 1.39
      ),

      at(
        'Clues gap',
        P ? 17 : 15,
        AMBER,
        RESULT_X.clues, y,
        false, 1.39
      ),

      at(
        'Mean gap',
        P ? 17 : 15,
        CYAN,
        RESULT_X.mean, y,
        false, 1.39
      ),

      line(
        pos(
          CX - 3.12,
          y - 0.31
        ),

        pos(
          CX + 3.12,
          y - 0.31
        ),

        MUTED, 1.5
      )
    );
  }

  function resultsRow(
    result,
    k
  ) {
    const i =
      result.reader;

    const y =
      resultY(k);

    const color =
      READER_COLORS[i];

    const parts = [
      outline(
        CX, y,
        6.22,
        P ? 0.94 : 0.69,
        color, 0.30, 1.4
      ),

      at(
        READERS[i],
        P ? 22 : 19,
        color,
        RESULT_X.reader,
        y
      ),

      at(
        result.differences[0].gap,
        P ? 25 : 22,
        result.mean === 0
          ? GREEN
          : GAP,
        RESULT_X.trail,
        y, true
      ),

      at(
        result.differences[1].gap,
        P ? 25 : 22,
        result.mean === 0
          ? GREEN
          : GAP,
        RESULT_X.clues,
        y, true
      ),

      outline(
        RESULT_X.mean,
        y,
        1.18,
        P ? 0.71 : 0.54,

        result.mean === 0
          ? GREEN
          : GAP,

        0.55, 1.7
      ),

      at(
        fmt(result.mean),
        P ? 28 : 24,

        result.mean === 0
          ? GREEN
          : GAP,

        RESULT_X.mean,
        y, true
      )
    ];

    return new M.VGroup(...parts);
  }

  const resultsTable = [
    resultsHeader(),

    ...COMPARISONS.map(
      (result, k) =>
        resultsRow(result, k)
    )
  ];

  // ------------------------------------------------------------
  // 39: name mean absolute difference.
  // ------------------------------------------------------------

  await until(S(39));
  setStage(null);

  await play(
    ...scene(...resultsTable),

    ...fbox([
      ['Mean absolute difference', CYAN],
      'Find each rating gap',
      'Ignore its direction',
      'Average the gap sizes'
    ]),

    ...say('MEAN ABSOLUTE DIFFERENCE')
  );

  // ------------------------------------------------------------
  // 40: absolute difference is the size of a gap.
  //
  // Draw two number lines.
  // One arrow travels from 4 down to 2.
  // The other travels from 2 up to 4.
  //
  // Both arrows have equal lengths.
  // Both absolute differences are two.
  // ------------------------------------------------------------

  const NL_LEFT =
    CX - 2.39;

  const NL_W =
    4.78;

  const nx = value =>
    NL_LEFT +
    (value - 1) / 4 *
      NL_W;

  function absoluteNumberLine(
    start,
    end,
    y,
    book
  ) {
    const parts = [];

    parts.push(
      at(
        book,
        P ? 21 : 18,
        BOOK_COLORS[book],
        CX,

        y +
          (P ? 1.04 : 0.73)
      ),

      line(
        pos(nx(1), y),
        pos(nx(5), y),
        MUTED, 2.1
      )
    );

    for (let v = 1; v <= 5; v++) {
      parts.push(
        line(
          pos(nx(v), y - 0.08),
          pos(nx(v), y + 0.08),
          MUTED, 1.6
        ),

        at(
          v,
          P ? 17 : 15,
          MUTED,
          nx(v),
          y - 0.26,
          true
        )
      );
    }

    parts.push(
      glowDot(
        pos(nx(start), y),
        ORANGE, 0.085
      ),

      glowDot(
        pos(nx(end), y),
        CYAN, 0.085
      ),

      arrow(
        pos(
          nx(start),
          y + 0.29
        ),

        pos(
          nx(end),
          y + 0.29
        ),

        GAP, 3.2
      ),

      at(
        `Gap = ${Math.abs(end - start)}`,
        P ? 19 : 17,
        GAP,
        (
          nx(start) +
          nx(end)
        ) / 2,

        y + 0.58,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const absolutePicture =
    new M.VGroup(
      absoluteNumberLine(
        2, 4,
        P ? 0.30 : 0.45,
        'Trail'
      ),

      absoluteNumberLine(
        4, 2,
        P ? -2.16 : -1.24,
        'Clues'
      ),

      note(
        'Opposite directions, equal gap sizes',
        GREEN,
        P ? -3.77 : -2.26
      )
    );

  await until(S(40));

  await play(
    ...scene(absolutePicture),

    ...fbox([
      ['Absolute difference', GAP],
      '|4 − 2| = 2',
      '|2 − 4| = 2',
      ['Both gaps have size 2', GREEN]
    ], GAP),

    ...say('ABSOLUTE DIFFERENCE IGNORES DIRECTION', GAP)
  );

  // ------------------------------------------------------------
  // 41–42: formula illustration.
  //
  // Use Cara's two rating gaps.
  //
  // Two blocks + two blocks = four blocks.
  // Share four blocks equally between two book slots.
  //
  // Mean absolute difference = 2.
  // ------------------------------------------------------------

  const FORMULA_BLOCK_W =
    P ? 0.57 : 0.49;

  const FORMULA_STEP =
    FORMULA_BLOCK_W + 0.10;

  function formulaBlock(
    x, y,
    color = GAP
  ) {
    return new M.VGroup(
      rect(
        x, y,
        FORMULA_BLOCK_W + 0.035,
        FORMULA_BLOCK_W + 0.035,
        color, 0.12, 0
      ),

      rect(
        x, y,
        FORMULA_BLOCK_W,
        FORMULA_BLOCK_W,
        color, 0.87, 1
      )
    );
  }

  function meanFormulaPicture() {
    const parts = [];

    const titleY =
      P ? 1.36 : 1.32;

    const firstY =
      P ? 0.32 : 0.49;

    const secondY =
      P ? -0.86 : -0.52;

    const resultY =
      P ? -2.75 : -1.76;

    parts.push(
      at(
        'CARA’S TWO RATING GAPS',
        P ? 19 : 17,
        ORANGE,
        CX,
        titleY,
        false, MAIN_W - 0.30
      ),

      at(
        'Trail',
        P ? 19 : 17,
        GREEN,
        CX - 2.41,
        firstY
      ),

      at(
        'Clues',
        P ? 19 : 17,
        AMBER,
        CX - 2.41,
        secondY
      )
    );

    const blocks = [];

    for (let row = 0; row < 2; row++) {
      const y =
        row === 0
          ? firstY
          : secondY;

      for (let j = 0; j < 2; j++) {
        const block = formulaBlock(
          CX - 0.40 +
            j * FORMULA_STEP,

          y
        );

        blocks.push(block);
      }

      parts.push(
        at(
          '2',
          24, GAP,
          CX + 1.27,
          y, true
        )
      );
    }

    parts.push(
      at(
        '2 + 2 = 4',
        P ? 25 : 22,
        GAP,
        CX,
        resultY,
        true
      )
    );

    return {
      background: new M.VGroup(...parts),
      blocks
    };
  }

  const formulaExample =
    meanFormulaPicture();

  await until(S(41));

  await play(
    ...scene(
      formulaExample.background
    ),

    ...enterLagged(
      formulaExample.blocks,
      0.14, 0.90
    ),

    ...fbox([
      ['One short formula', CYAN],
      'Add the absolute gaps',
      'Divide by how many',
      'shared books we compared'
    ]),

    ...say('WRITE THE CALCULATION AS A FORMULA')
  );

  // ------------------------------------------------------------
  // Equal-share animation.
  //
  // Move the same four blocks into two equal groups.
  // No block is lost or created.
  // ------------------------------------------------------------

  function equalShareBackground() {
    const y =
      P ? -0.48 : -0.36;

    const xs = [
      CX - 1.49,
      CX + 1.49
    ];

    const parts = [
      at(
        '4 GAP UNITS SHARED BETWEEN 2 BOOKS',
        P ? 18 : 16,
        INK,
        CX,
        P ? 1.37 : 1.33,
        false, MAIN_W - 0.30
      )
    ];

    xs.forEach((x, k) => {
      parts.push(
        outline(
          x, y,
          2.55,
          P ? 1.72 : 1.34,
          GREEN, 0.35
        ),

        at(
          `Shared book ${k + 1}`,
          P ? 17 : 15,
          GREEN,
          x,

          y +
            (P ? 0.58 : 0.44)
        ),

        at(
          '2 gap units',
          P ? 17 : 15,
          GREEN,
          x,

          y -
            (P ? 0.59 : 0.46)
        )
      );
    });

    parts.push(
      at(
        '4 ÷ 2 = 2',
        P ? 32 : 27,
        GREEN,
        CX,
        P ? -2.76 : -1.91,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const equalShareFrame =
    equalShareBackground();

  function shareGapBlocks() {
    const y =
      P ? -0.48 : -0.36;

    return formulaExample.blocks.map(
      (block, k) => {
        const group =
          k % 2;

        const slot =
          Math.floor(k / 2);

        const x =
          CX +
          (
            group === 0
              ? -1.49
              : 1.49
          ) +
          (slot - 0.5) *
            FORMULA_STEP;

        return new M.Transform(
          block,

          formulaBlock(
            x,
            y,
            GREEN
          ),

          { runTime: 0.95 }
        );
      }
    );
  }

  await until(S(42));

  await play(
    ...leave(
      formulaExample.background
    ),

    ...enter(equalShareFrame),

    ...shareGapBlocks(),

    ...fbox([
      ['Mean absolute difference', CYAN],
      ['= sum of rating gaps', GAP],
      ['  ÷ shared book count', GREEN],
      ['= 4 ÷ 2 = 2', GREEN]
    ], GREEN),

    ...say('SUM OF GAPS ÷ NUMBER OF SHARED BOOKS', GREEN)
  );

  // ------------------------------------------------------------
  // Reader similarity comparison.
  //
  // Smaller mean gap indicates a closer match.
  //
  // All gap bars use a common 0–4 scale because the
  // maximum possible difference on a 1–5 rating scale is 4.
  //
  // Ben's zero gap is shown by a marker at zero rather
  // than a bar of artificial nonzero length.
  // ------------------------------------------------------------

  const BAR_LEFT =
    CX - 1.39;

  const BAR_W =
    3.48;

  const BAR_H =
    P ? 0.34 : 0.27;

  const BAR_TOP =
    P ? 0.50 : 0.56;

  const BAR_PITCH =
    P ? 1.31 : 0.88;

  const barY = k =>
    BAR_TOP -
    k * BAR_PITCH;

  const barX = value =>
    BAR_LEFT +
    value / 4 *
      BAR_W;

  function meanGapBar(
    result,
    k
  ) {
    const i =
      result.reader;

    const color =
      READER_COLORS[i];

    const y =
      barY(k);

    const fillW =
      BAR_W *
      result.mean / 4;

    const parts = [
      at(
        READERS[i],
        P ? 23 : 20,
        color,
        CX - 2.43,
        y
      ),

      rect(
        BAR_LEFT + BAR_W / 2,
        y,
        BAR_W,
        BAR_H,
        CARD, 0.78, 0
      ),

      outline(
        BAR_LEFT + BAR_W / 2,
        y,
        BAR_W + 0.035,
        BAR_H + 0.035,
        MUTED, 0, 1
      )
    ];

    if (fillW > 0) {
      parts.push(
        rect(
          BAR_LEFT + fillW / 2,
          y,
          fillW,
          BAR_H + 0.06,
          color, 0.12, 0
        ),

        rect(
          BAR_LEFT + fillW / 2,
          y,
          fillW,
          BAR_H,
          color, 0.88, 1
        )
      );
    }

    parts.push(
      glowDot(
        pos(
          barX(result.mean),
          y
        ),

        result.mean === 0
          ? GREEN
          : color,

        P ? 0.075 : 0.061
      ),

      at(
        fmt(result.mean),
        P ? 26 : 23,
        color,
        CX + 2.70,
        y, true
      ),

      at(
        `(${result.differences.map(d => d.gap).join(' + ')}) ÷ ${result.count}`,
        P ? 16 : 14,
        MUTED,
        BAR_LEFT + BAR_W / 2,

        y -
          (P ? 0.42 : 0.30),

        true
      )
    );

    return new M.VGroup(...parts);
  }

  function gapBarScale() {
    const parts = [];

    const y =
      P ? -3.49 : -2.09;

    parts.push(
      line(
        pos(BAR_LEFT, y),
        pos(BAR_LEFT + BAR_W, y),
        MUTED, 1.6
      )
    );

    for (let value = 0; value <= 4; value++) {
      parts.push(
        line(
          pos(barX(value), y - 0.055),
          pos(barX(value), y + 0.055),
          MUTED, 1.4
        ),

        at(
          value,
          P ? 15 : 13,
          MUTED,
          barX(value),
          y - 0.24,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const gapBars =
    COMPARISONS.map(
      (result, k) =>
        meanGapBar(
          result, k
        )
    );

  const gapBarTitle = at(
    'MEAN ABSOLUTE DIFFERENCE',
    P ? 20 : 18,
    INK,
    CX,
    P ? 1.43 : 1.39,
    false, MAIN_W - 0.30
  );

  const smallerBetter = at(
    'Smaller gap = closer match',
    P ? 18 : 15,
    GREEN,
    CX,
    P ? -4.25 : -2.49,
    false, MAIN_W - 0.30
  );

  // ------------------------------------------------------------
  // 43: smaller mean difference means closer ratings.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...scene(
      gapBarTitle,
      ...gapBars,
      gapBarScale(),
      smallerBetter
    ),

    ...fbox([
      ['Smaller is better', GREEN],
      '0 means an exact match',
      'on the compared books',
      'Larger means less similar'
    ], GREEN),

    ...say('SMALLER MEAN GAP = CLOSER MATCH', GREEN)
  );

  // ------------------------------------------------------------
  // 44: Ben is the closest reader.
  //
  // The closest reader is selected from calculated results.
  // ------------------------------------------------------------

  const nearestRowIndex =
    COMPARISONS.findIndex(
      result =>
        result.reader === NEIGHBOR
    );

  const nearestOutline = outline(
    CX,
    barY(nearestRowIndex),
    6.27,
    P ? 0.88 : 0.65,
    GREEN, 0, 2.7
  );

  const closestTag = tagAt(
    `CLOSEST MATCH: ${READERS[NEIGHBOR].toUpperCase()}`,
    GREEN,
    CX,
    P ? 0.97 : 0.95,
    P ? 16 : 14
  );

  await until(S(44));

  await play(
    ...focus(nearestOutline),

    ...enter(closestTag),

    ...fbox([
      ['Ben = 0', BLUE],
      ['Cara = 2', ORANGE],
      ['Dan = 2', PURPLE],
      ['Ben has the smallest gap', GREEN]
    ], GREEN),

    ...say('BEN IS ANA’S CLOSEST MATCH', GREEN)
  );

  // ------------------------------------------------------------
  // 45–47: use Ben's other known ratings to predict Ana's.
  //
  // Restore the original rating matrix.
  //
  // Known Ana ratings remain unchanged.
  // Known Ben ratings remain unchanged.
  //
  // Copies of Ben's rating indicators move into Ana's
  // corresponding unknown cells.
  //
  // The copied indicators become purple and receive
  // a separate "predicted" marker.
  //
  // The RATINGS array is not modified.
  // Predictions remain separate from observations.
  // ------------------------------------------------------------

  table =
    newTable(true);

  const predictedIndices =
    RECOMMENDATIONS
      .map(p => p.index)
      .sort((a, b) => a - b);

  const benSourceFrames =
    predictedIndices.map(
      j =>
        cellOutline(
          NEIGHBOR,
          j,
          BLUE
        )
    );

  const targetPredictionFrames =
    predictedIndices.map(
      j =>
        cellOutline(
          TARGET,
          j,
          PREDICTED
        )
    );

  const sourceNote = note(
    'Use Ben’s ratings for books Ana has not rated',
    BLUE,
    P ? -3.72 : -2.12
  );

  // ------------------------------------------------------------
  // 45: Ben gives River five stars and Castle one star.
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...scene(
      ...table.objects,
      sourceNote
    ),

    ...focus(...benSourceFrames),

    ...fbox([
      ['Ben’s other ratings', BLUE],
      ['River = 5 stars', TEAL],
      ['Castle = 1 star', PURPLE],
      'Ana has not rated either'
    ], BLUE),

    ...say('BEN: RIVER FIVE STARS, CASTLE ONE STAR', BLUE)
  );

  // ------------------------------------------------------------
  // Prediction transfer arrows.
  // ------------------------------------------------------------

  function predictionArrow(j) {
    const x =
      tx(j);

    const start = pos(
      x + CELL_W / 2 - 0.12,
      ty(NEIGHBOR) +
        CELL_H / 2 - 0.04
    );

    const end = pos(
      x + CELL_W / 2 - 0.12,
      ty(TARGET) -
        CELL_H / 2 + 0.04
    );

    return arrow(
      start, end,
      PREDICTED,
      2.3,
      0.10
    );
  }

  const transferArrows =
    predictedIndices.map(
      predictionArrow
    );

  const predictionLegend = note(
    'Purple ratings are predictions, not observations',
    PREDICTED,
    P ? -3.72 : -2.12
  );

  // A separately constructed copy of each source rating.
  // The original visible Ben cells are never reparented.

  const transferCopies =
    predictedIndices.map(
      j =>
        matrixRating(
          NEIGHBOR,
          j,
          RATINGS[NEIGHBOR][j]
        )
    );

  // ------------------------------------------------------------
  // 46: explain predictions as guesses about future ratings.
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...leave(sourceNote),

    ...focus(
      ...predictedIndices.map(
        j =>
          cellOutline(
            NEIGHBOR,
            j,
            BLUE
          )
      ),

      ...targetPredictionFrames
    ),

    ...enter(
      ...transferArrows,
      predictionLegend,
      ...transferCopies
    ),

    ...fbox([
      ['Prediction', PREDICTED],
      'A guess about a future rating',
      'Use the closest reader’s',
      'rating as our estimate'
    ], PREDICTED),

    ...say('PREDICTIONS ARE GUESSES ABOUT FUTURE RATINGS', PREDICTED)
  );

  // ------------------------------------------------------------
  // 47: transfer the copied rating indicators.
  //
  // River prediction = 5.
  // Castle prediction = 1.
  //
  // The original Ana row is still missing those observed
  // ratings. The purple indicators are predictions only.
  // ------------------------------------------------------------

  function predictionMarker(j) {
    return at(
      'Pred.',
      P ? 11 : 10,
      PREDICTED,

      tx(j),

      ty(TARGET) +
        CELL_H / 2 - 0.085,

      false,
      CELL_W - 0.09
    );
  }

  function predictedMatrixRating(j) {
    const prediction =
      PREDICTION_BY_BOOK[j];

    const x =
      tx(j);

    const y =
      ty(TARGET);

    return new M.VGroup(
      at(
        prediction.rating,
        P ? 21 : 16,
        PREDICTED,
        x,

        y +
          (P ? 0.075 : 0.035),

        true
      ),

      stars(
        prediction.rating,
        x,

        y -
          (P ? 0.23 : 0.145),

        CELL_W * 0.82,
        PREDICTED
      )
    );
  }

  const predictionMarkers =
    predictedIndices.map(
      predictionMarker
    );

  await until(S(47));

  await play(
    ...transferCopies.map(
      (copy, k) =>
        new M.Transform(
          copy,

          predictedMatrixRating(
            predictedIndices[k]
          ),

          { runTime: 1.0 }
        )
    ),

    ...enter(...predictionMarkers),

    ...leave(...transferArrows),

    ...fbox([
      ['Predictions for Ana', PREDICTED],
      ['River = 5 stars', TEAL],
      ['Castle = 1 star', PURPLE],
      'Copied from Ben’s ratings'
    ], PREDICTED),

    ...say('PREDICT RIVER 5 AND CASTLE 1', PREDICTED)
  );

  // ------------------------------------------------------------
  // 48: rank predicted ratings.
  //
  // Only books with a valid prediction can be ranked by
  // predicted rating.
  //
  // Island is not silently assigned zero or placed last
  // on a numerical scale.
  // ------------------------------------------------------------

  const RECOMMEND_TOP =
    P ? 0.42 : 0.63;

  const RECOMMEND_PITCH =
    P ? 1.67 : 1.22;

  const recommendY = k =>
    RECOMMEND_TOP -
    k * RECOMMEND_PITCH;

  function recommendationRow(
    prediction,
    k,
    ranked = true
  ) {
    const y =
      recommendY(k);

    const color =
      BOOK_COLORS[prediction.book];

    const h =
      P ? 1.36 : 1.00;

    const parts = [
      outline(
        CX, y,
        6.24, h,

        ranked && k === 0
          ? GREEN
          : color,

        0.55,
        ranked && k === 0
          ? 2.5
          : 1.5
      ),

      bookCard(
        prediction.book,
        CX - 1.93,
        y,
        1.28,
        P ? 1.00 : 0.77
      ),

      at(
        `${prediction.rating} predicted stars`,
        P ? 19 : 17,
        PREDICTED,
        CX + 0.60,

        y +
          (P ? 0.24 : 0.20),

        false, 3.15
      ),

      stars(
        prediction.rating,
        CX + 0.60,

        y -
          (P ? 0.20 : 0.16),

        P ? 2.26 : 1.94,
        PREDICTED
      )
    ];

    if (ranked) {
      parts.push(
        circle(
          CX - 2.81,
          y,
          P ? 0.20 : 0.16,
          color,
          0.16, 1.6
        ),

        at(
          k + 1,
          P ? 18 : 15,
          color,
          CX - 2.81,
          y,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const recommendationTitle = at(
    'RANK BY PREDICTED RATING',
    P ? 21 : 18,
    INK,
    CX,
    P ? 1.47 : 1.39,
    false, MAIN_W - 0.30
  );

  const recommendationRows =
    RECOMMENDATIONS.map(
      (prediction, k) =>
        recommendationRow(
          prediction,
          k,
          true
        )
    );

  const recommendationNote = note(
    'River first: the larger predicted rating',
    GREEN,
    P ? -3.48 : -2.05
  );

  await until(S(48));

  await play(
    ...scene(
      recommendationTitle
    ),

    ...enterLagged(
      recommendationRows,
      0.18, 1.1
    ),

    ...enter(recommendationNote),

    ...fbox([
      ['Recommendation order', GREEN],
      ['1. River: predicted 5', TEAL],
      ['2. Castle: predicted 1', PURPLE],
      'Recommend River first'
    ], GREEN),

    ...say('RECOMMEND RIVER FIRST', GREEN)
  );

  // ------------------------------------------------------------
  // 49: applications to books, films and music.
  //
  // These are illustrative item types, not additional
  // ratings or new chapter observations.
  // ------------------------------------------------------------

  function filmIcon(
    x, y
  ) {
    const parts = [
      outline(
        x, y,
        1.15, 0.82,
        CYAN, 0.42
      )
    ];

    for (const side of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        parts.push(
          rect(
            x + side * 0.44,
            y + (k - 1) * 0.23,
            0.10, 0.10,
            CYAN, 0.84, 0
          )
        );
      }
    }

    parts.push(
      line(
        pos(x - 0.11, y + 0.20),
        pos(x + 0.23, y),
        CYAN, 2.6
      ),

      line(
        pos(x + 0.23, y),
        pos(x - 0.11, y - 0.20),
        CYAN, 2.6
      ),

      line(
        pos(x - 0.11, y - 0.20),
        pos(x - 0.11, y + 0.20),
        CYAN, 2.6
      )
    );

    return new M.VGroup(...parts);
  }

  function musicIcon(
    x, y
  ) {
    const color =
      PURPLE;

    return new M.VGroup(
      circle(
        x - 0.27,
        y - 0.27,
        0.15,
        color, 0.86, 1
      ),

      circle(
        x + 0.28,
        y - 0.12,
        0.15,
        color, 0.86, 1
      ),

      line(
        pos(
          x - 0.13,
          y - 0.27
        ),

        pos(
          x - 0.13,
          y + 0.40
        ),

        color, 3
      ),

      line(
        pos(
          x + 0.42,
          y - 0.12
        ),

        pos(
          x + 0.42,
          y + 0.55
        ),

        color, 3
      ),

      line(
        pos(
          x - 0.13,
          y + 0.40
        ),

        pos(
          x + 0.42,
          y + 0.55
        ),

        color, 5
      )
    );
  }

  function applicationPicture() {
    const parts = [];

    const top =
      P ? 0.82 : 0.86;

    const y =
      P ? -1.26 : -0.66;

    const xs = [
      CX - 2.10,
      CX,
      CX + 2.10
    ];

    const titles = [
      'Books',
      'Films',
      'Music'
    ];

    const colors = [
      GREEN,
      CYAN,
      PURPLE
    ];

    parts.push(
      readerIcon(
        TARGET,
        CX - 0.67,
        top,
        0.68,
        false
      ),

      readerIcon(
        NEIGHBOR,
        CX + 0.67,
        top,
        0.68,
        false
      ),

      line(
        pos(
          CX - 0.24,
          top
        ),

        pos(
          CX + 0.24,
          top
        ),

        GREEN, 3
      ),

      at(
        'Similar tastes',
        P ? 18 : 16,
        GREEN,
        CX,
        top - 0.51
      )
    );

    const icons = [
      bookCard(
        'River',
        xs[0],
        y + 0.07,
        0.83, 1.02
      ),

      filmIcon(
        xs[1],
        y + 0.07
      ),

      musicIcon(
        xs[2],
        y + 0.07
      )
    ];

    xs.forEach((x, k) => {
      const h =
        P ? 2.02 : 1.58;

      parts.push(
        arrow(
          pos(
            CX + (k - 1) * 0.27,
            top - 0.72
          ),

          pos(
            x,
            y + h / 2 + 0.04
          ),

          colors[k],
          2.0, 0.13
        ),

        outline(
          x, y,
          1.87, h,
          colors[k],
          0.38
        ),

        icons[k],

        at(
          titles[k],
          P ? 20 : 17,
          colors[k],
          x,

          y -
            h / 2 + 0.25
        )
      );
    });

    parts.push(
      note(
        'Recommend using the opinions of similar people',
        GREEN,
        P ? -3.53 : -2.23
      )
    );

    return new M.VGroup(...parts);
  }

  const applications =
    applicationPicture();

  await until(S(49));

  await play(
    ...scene(applications),

    ...fbox([
      ['Collaborative filtering', GREEN],
      'Recommend books',
      'Recommend films',
      'Recommend music',
      'Use similar people’s opinions'
    ], GREEN),

    ...say('BOOKS, FILMS AND MUSIC: SIMILAR PEOPLE CAN HELP', GREEN)
  );

  // ------------------------------------------------------------
  // 50: Island has no rating from Ben.
  //
  // Do not show a zero prediction.
  //
  // Island's missing prediction is a limitation of this
  // rating-based example.
  //
  // The selected reader's rating is unavailable.
  // In the supplied data, every other reader's rating
  // for Island is also unavailable.
  // ------------------------------------------------------------

  function islandMissingPicture() {
    const parts = [];

    const islandX =
      CX - 2.23;

    const islandY =
      P ? 0.05 : 0.16;

    parts.push(
      bookCard(
        'Island',
        islandX,
        islandY,
        1.45,
        P ? 1.93 : 1.54
      ),

      tagAt(
        'NEW BOOK',
        YELLOW,
        islandX,

        islandY +
          (P ? 1.28 : 1.04),

        P ? 16 : 14,
        1.66
      )
    );

    const panelX =
      CX + 1.01;

    const panelY =
      P ? 0.05 : 0.12;

    const panelW =
      3.43;

    const panelH =
      P ? 2.69 : 2.10;

    parts.push(
      outline(
        panelX, panelY,
        panelW, panelH,
        YELLOW, 0.40
      ),

      at(
        'Island ratings',
        P ? 20 : 17,
        YELLOW,
        panelX,
        panelY + panelH / 2 - 0.28
      )
    );

    READERS.forEach((name, i) => {
      const y =
        panelY +
        panelH / 2 -
        (P ? 0.78 : 0.64) -
        i * (P ? 0.44 : 0.32);

      parts.push(
        at(
          name,
          P ? 18 : 16,
          READER_COLORS[i],
          panelX - 0.88,
          y
        ),

        outline(
          panelX + 0.68,
          y,
          1.17,
          P ? 0.33 : 0.25,

          i === NEIGHBOR
            ? BLUE
            : MUTED,

          0.28,

          i === NEIGHBOR
            ? 2
            : 1
        )
      );

      if (i === NEIGHBOR) {
        parts.push(
          at(
            'Unknown',
            P ? 13 : 11,
            MUTED,
            panelX + 0.68,
            y,
            false, 1.04
          )
        );
      }
    });

    const warningY =
      P ? -2.15 : -1.46;

    parts.push(
      outline(
        CX,
        warningY,
        5.90,
        P ? 1.12 : 0.90,
        AMBER, 0.45
      ),

      at(
        'No rating → no prediction',
        P ? 23 : 20,
        AMBER,
        CX,
        warningY + 0.10,
        false, 5.56
      ),

      at(
        'Not a prediction of zero stars',
        P ? 16 : 14,
        MUTED,
        CX,
        warningY - 0.23
      )
    );

    if (P) {
      parts.push(
        note(
          `${ISLAND_RATING_COUNT} ratings · ${ISLAND_PURCHASE_COUNT} purchases`,
          MUTED,
          -3.58
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const islandMissing =
    islandMissingPicture();

  await until(S(50));

  await play(
    ...scene(islandMissing),

    ...fbox([
      ['Island', YELLOW],
      ['Ben’s rating is unknown', BLUE],
      'Cannot copy a rating',
      ['No prediction available', AMBER]
    ], AMBER),

    ...say('NO RATING FOR ISLAND MEANS NO PREDICTION', AMBER)
  );

  // ------------------------------------------------------------
  // 51: two matching ratings do not guarantee future agreement.
  //
  // The known ratings are actual observations:
  // Ana and Ben both rate Trail 4 and Clues 2.
  //
  // Ana's future opinion of River remains unknown.
  //
  // No new actual rating is invented.
  // ------------------------------------------------------------

  function uncertaintyPicture() {
    const parts = [];

    const xs = [
      CX - 2.17,
      CX - 0.03,
      CX + 2.15
    ];

    const headerY =
      P ? 1.25 : 1.21;

    const rows = P
      ? [0.29, -0.82, -2.13]
      : [0.46, -0.34, -1.35];

    parts.push(
      at(
        'Book',
        P ? 18 : 16,
        INK,
        xs[0],
        headerY
      ),

      at(
        'Ana',
        P ? 22 : 19,
        CYAN,
        xs[1],
        headerY
      ),

      at(
        'Ben',
        P ? 22 : 19,
        BLUE,
        xs[2],
        headerY
      )
    );

    const books = [0, 2, 1];

    books.forEach((j, k) => {
      const y =
        rows[k];

      const name =
        BOOKS[j];

      const a =
        RATINGS[TARGET][j];

      const b =
        RATINGS[NEIGHBOR][j];

      parts.push(
        bookCard(
          name,
          xs[0],
          y,
          1.14,
          P ? 0.82 : 0.64
        )
      );

      const values = [a, b];

      values.forEach((value, n) => {
        const x =
          xs[n + 1];

        const color =
          n === 0
            ? CYAN
            : BLUE;

        parts.push(
          outline(
            x, y,
            1.68,

            P ? 0.83 : 0.65,

            color,
            0.32
          )
        );

        if (value !== null) {
          parts.push(
            at(
              value,
              P ? 20 : 17,
              INK,
              x,
              y + 0.12,
              true
            ),

            stars(
              value,
              x,
              y - 0.17,
              1.22
            )
          );
        } else {
          parts.push(
            at(
              'Unknown',
              P ? 18 : 15,
              MUTED,
              x, y,
              false, 1.51
            )
          );
        }
      });

      if (a !== null && b !== null) {
        parts.push(
          at(
            '=',
            24,
            GREEN,

            (
              xs[1] +
              xs[2]
            ) / 2,

            y,
            true
          )
        );
      } else {
        parts.push(
          at(
            '?',
            24,
            AMBER,

            (
              xs[1] +
              xs[2]
            ) / 2,

            y
          )
        );
      }
    });

    parts.push(
      note(
        'Two matches are evidence, not a guarantee',
        AMBER,
        P ? -3.66 : -2.28
      )
    );

    return new M.VGroup(...parts);
  }

  const uncertainty =
    uncertaintyPicture();

  await until(S(51));

  await play(
    ...scene(uncertainty),

    ...fbox([
      ['Important limitation', AMBER],
      'Ana and Ben match on 2 books',
      'They may disagree on others',
      ['A prediction is not a fact', AMBER]
    ], AMBER),

    ...say('MATCHING PAST RATINGS DOES NOT GUARANTEE FUTURE AGREEMENT', AMBER)
  );

  // ------------------------------------------------------------
  // 52: final visual summary.
  //
  // 1. Compare the shared ratings.
  // 2. Find the smallest mean absolute difference.
  // 3. Use the closest reader's known ratings.
  // 4. Rank available predictions.
  //
  // Keep Island visibly separate from numerically ranked
  // recommendations.
  // ------------------------------------------------------------

  function finalSummary() {
    const parts = [];

    const readerY =
      P ? 1.00 : 1.04;

    const readerXs = [
      CX - 2.45,
      CX - 0.82,
      CX + 0.82,
      CX + 2.45
    ];

    READERS.forEach((name, i) => {
      const x =
        readerXs[i];

      const color =
        READER_COLORS[i];

      parts.push(
        outline(
          x,
          readerY,

          1.48,

          P ? 0.77 : 0.62,

          i === NEIGHBOR
            ? GREEN
            : color,

          0.42,

          i === NEIGHBOR
            ? 2.5
            : 1.4
        ),

        at(
          name,
          P ? 19 : 17,
          color,
          x,
          readerY + 0.12
        )
      );

      if (i === TARGET) {
        parts.push(
          at(
            'Target',
            P ? 14 : 12,
            CYAN,
            x,
            readerY - 0.19
          )
        );
      } else {
        const result =
          COMPARISON_BY_READER[i];

        parts.push(
          at(
            `Gap ${fmt(result.mean)}`,
            P ? 16 : 14,

            i === NEIGHBOR
              ? GREEN
              : MUTED,

            x,
            readerY - 0.19,
            true
          )
        );
      }
    });

    const labelY =
      P ? 0.32 : 0.49;

    parts.push(
      at(
        'Ben is the closest match',
        P ? 19 : 16,
        GREEN,
        CX, labelY
      )
    );

    const rows = P
      ? [-0.66, -1.97, -3.28]
      : [-0.13, -1.08, -2.03];

    const summaryEntries = [
      ...RECOMMENDATIONS.map(
        (p, k) => ({
          ...p,
          rank: k + 1
        })
      ),

      ...NO_PREDICTION.map(
        p => ({
          ...p,
          rank: null
        })
      )
    ];

    summaryEntries.forEach((p, k) => {
      const y =
        rows[k];

      const color =
        BOOK_COLORS[p.book];

      const h =
        P ? 1.08 : 0.77;

      parts.push(
        outline(
          CX, y,
          6.27, h,

          p.rank === 1
            ? GREEN
            : p.rating === null
              ? MUTED
              : color,

          0.46,

          p.rank === 1
            ? 2.5
            : 1.4
        ),

        at(
          p.rank === null
            ? '—'
            : p.rank,

          P ? 20 : 17,

          p.rank === null
            ? MUTED
            : color,

          CX - 2.72,
          y,
          true
        ),

        at(
          p.book,
          P ? 22 : 19,
          color,
          CX - 1.66,
          y,
          false, 1.40
        )
      );

      if (p.rating !== null) {
        parts.push(
          stars(
            p.rating,
            CX + 0.42,
            y + 0.06,
            P ? 1.88 : 1.67,
            PREDICTED
          ),

          at(
            `${p.rating} predicted`,
            P ? 17 : 15,
            PREDICTED,
            CX + 2.20,
            y,
            false, 1.63
          )
        );
      } else {
        parts.push(
          at(
            'No prediction',
            P ? 20 : 17,
            MUTED,
            CX + 1.03,
            y,
            false, 3.65
          )
        );
      }
    });

    if (P) {
      parts.push(
        note(
          'Predictions use similar readers’ known preferences',
          GREEN,
          -4.38
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const finalPicture =
    finalSummary();

  await until(S(52));

  await play(
    ...scene(finalPicture),

    ...fbox([
      ['Collaborative filtering', GREEN],
      'Compare shared ratings',
      'Find people with similar tastes',
      'Predict other preferences',
      ['Predictions are not guarantees', AMBER]
    ], GREEN),

    ...say('USE SIMILAR PEOPLE’S PREFERENCES TO PREDICT WHAT YOU MAY ENJOY', GREEN)
  );

  // Leave the final summary visible until narration ends.

  await until(E(52));

  // ------------------------------------------------------------
  // Integration notes.
  //
  // All 53 narration beats, S(0) through S(52), are included.
  //
  // Reader order, book order, colours, rating values, topics,
  // baskets and friendships follow the fixed chapter data.
  //
  // Book topics and friendship edges are not used in this
  // collaborative filtering calculation.
  //
  // The initial rating matrix leaves unknown cells empty.
  // Missing ratings remain null and are never treated as zero.
  //
  // Ana's known books are selected from her actual rating row.
  //
  // Mean absolute differences are calculated from books rated
  // by both readers. All three comparison readers have rated
  // both of Ana's known books.
  //
  // Checked results:
  //
  //   Ben:
  //     Trail = |4 − 4| = 0
  //     Clues = |2 − 2| = 0
  //     Mean  = 0
  //
  //   Cara:
  //     Trail = |4 − 2| = 2
  //     Clues = |2 − 4| = 2
  //     Mean  = 2
  //
  //   Dan:
  //     Trail = |4 − 2| = 2
  //     Clues = |2 − 4| = 2
  //     Mean  = 2
  //
  // Ben is selected by sorting the calculated mean differences.
  //
  // Predictions are generated using Ben's actual ratings:
  //   River = 5
  //   Castle = 1
  //   Island = null
  //
  // The prediction animation uses separately constructed copies
  // of Ben's ratings. Ben's observed rating objects remain
  // visible and unchanged.
  //
  // Predicted stars are purple and explicitly labelled.
  // The original RATINGS matrix is never overwritten.
  //
  // Island is excluded from numerical ranking because its
  // predicted rating is unavailable.
  //
  // This is the prescribed one-nearest-reader demonstration.
  // Real collaborative filtering systems may combine multiple
  // readers and use additional similarity or prediction methods.
  //
  // All animation calls are awaited sequentially.
  // Every narration sentence has an explicit timing beat.
  // No visible objects are wrapped in a new VGroup.
  //
  // The scene follows the supplied engine API and narration.
  // Actual browser execution, seeking, animation timing,
  // text metrics and responsive phone/laptop rendering have
  // not been tested against the live engine.
  // ------------------------------------------------------------
}

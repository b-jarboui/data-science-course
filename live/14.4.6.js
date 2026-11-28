// lesson 14.4.6
// Content-based recommendation: finding items with similar content
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Fixed chapter 14.4 teaching data.
//
// Ana's highest-rated book: Trail (4 stars).
// Interest profile: Adventure, Nature.
//
// Jaccard similarity = shared topics / distinct topics.
//
// River:  2 / 2 = 1
// Island: 1 / 2 = 0.5
// Castle: 0 / 4 = 0
//
// Recommendation order: River, Island, Castle.
// Island has no ratings and no purchases.
// All similarities and rankings are calculated from the data.

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
  //
  // Preserve the reader order, book order, ratings,
  // topics, shopping baskets and friendship network.
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

  // null = not rated, never zero stars.

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

  const FRIENDSHIPS = [
    ['Ana', 'Ben'],
    ['Ben', 'Cara'],
    ['Cara', 'Dan']
  ];

  const ANA_INDEX = 0;
  const ANA_RATINGS = RATINGS[ANA_INDEX];

  const RATED_BOOKS = BOOKS.filter(
    (_, j) => ANA_RATINGS[j] !== null
  );

  const UNRATED_BOOKS = BOOKS.filter(
    (_, j) => ANA_RATINGS[j] === null
  );

  const FAVOURITE = RATED_BOOKS.reduce(
    (best, name) =>
      ANA_RATINGS[BOOKS.indexOf(name)] >
      ANA_RATINGS[BOOKS.indexOf(best)]
        ? name
        : best
  );

  const FAVOURITE_TOPICS =
    TOPICS[FAVOURITE].slice();

  // ------------------------------------------------------------
  // Actual Jaccard similarity calculation.
  //
  // The intersection contains topics belonging to both sets.
  // The union contains every distinct topic from either set.
  //
  // Each topic is counted at most once.
  // ------------------------------------------------------------

  function jaccard(a, b) {
    const A = new Set(a);
    const B = new Set(b);

    const shared = [...A].filter(
      topic => B.has(topic)
    );

    const distinct = [
      ...new Set([...A, ...B])
    ];

    return {
      shared,
      distinct,

      numerator:
        shared.length,

      denominator:
        distinct.length,

      score:
        distinct.length === 0
          ? 1
          : shared.length / distinct.length
    };
  }

  const RESULTS = Object.fromEntries(
    UNRATED_BOOKS.map(name => [
      name,
      jaccard(
        FAVOURITE_TOPICS,
        TOPICS[name]
      )
    ])
  );

  const RANKED = UNRATED_BOOKS
    .slice()
    .sort(
      (a, b) =>
        RESULTS[b].score -
        RESULTS[a].score ||
        BOOKS.indexOf(a) -
        BOOKS.indexOf(b)
    );

  const ISLAND_RATING_COUNT =
    RATINGS.filter(
      row =>
        row[BOOKS.indexOf('Island')] !== null
    ).length;

  const ISLAND_PURCHASE_COUNT =
    BASKETS.filter(
      basket => basket.includes('Island')
    ).length;

  const scoreText = v =>
    Number(v.toFixed(4)).toString();

  const fractionText = name =>
    `${RESULTS[name].numerator}/${RESULTS[name].denominator}`;

  const calculationText = name => {
    const r = RESULTS[name];

    return (
      `${r.numerator} ÷ ${r.denominator}` +
      ` = ${scoreText(r.score)}`
    );
  };

  // ------------------------------------------------------------
  // Course palette.
  //
  // Reader and book colours remain fixed across the chapter.
  // Topic colours remain fixed within this lesson.
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

  const READER_COLORS = {
    Ana: CYAN,
    Ben: BLUE,
    Cara: ORANGE,
    Dan: PURPLE
  };

  const BOOK_COLORS = {
    Trail: GREEN,
    River: TEAL,
    Clues: AMBER,
    Castle: PURPLE,
    Island: YELLOW
  };

  const TOPIC_COLORS = {
    Adventure: CYAN,
    Nature: GREEN,
    Mystery: PURPLE,
    Crime: AMBER,
    History: BLUE
  };

  const SHARED = GREEN;
  const DISTINCT = PURPLE;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone:  8 × 14.22; content y = −5.5 ... 4.3.
  // Laptop: 14.22 × 8; content y = −3.0 ... 2.3.
  //
  // One main illustration, one formula box and one pill.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.45, 0]
    : [4.3, -0.3, 0];

  const MAIN_W = P
    ? FW - 0.9
    : 7.25;

  const ROSTER_Y =
    P ? -5.12 : -2.82;

  const pos = (x, y) =>
    [x, y, 0];

  const say = (s, c = CYAN) =>
    showA(s, c, PILL);

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
        0.14, w / 5, h / 5
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
      radius: radius * 2.2,
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
    head = 0.17
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
      length * 0.42
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
    y = P ? -4.30 : -2.46
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
  // One formula box is visible at a time.
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
        const raw =
          String(rows[i][0]);

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
  // Never regroup objects that are already visible.
  // Visible objects remain individually removable.
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
    const present = objects.filter(
      o => picture.includes(o)
    );

    picture = picture.filter(
      o => !present.includes(o)
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
  // Preserve the chapter's reader names, order and colours.
  // Ana is emphasized because she is the subject of this lesson.
  // ------------------------------------------------------------

  const roster = new M.VGroup(
    ...READERS.map((name, i) => {
      const x =
        CX + (i - 1.5) * 1.55;

      const color =
        READER_COLORS[name];

      return new M.VGroup(
        outline(
          x, ROSTER_Y,
          1.22, 0.30,
          color,
          i === ANA_INDEX ? 0.60 : 0.20,
          i === ANA_INDEX ? 2 : 1
        ),

        glowDot(
          pos(x - 0.43, ROSTER_Y),
          color,
          0.047
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
  // Book and reader drawing helpers.
  // ------------------------------------------------------------

  function readerIcon(
    name, x, y,
    scale = 1,
    showName = true
  ) {
    const color =
      READER_COLORS[name];

    const halo = circle(
      x,
      y,
      0.61 * scale,
      color, 0.07, 1
    );

    const head = circle(
      x,
      y + 0.22 * scale,
      0.18 * scale,
      color, 0.95, 1
    );

    const body = new M.Arc({
      radius: 0.32 * scale,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.83);

    body.moveTo(pos(
      x,
      y - 0.16 * scale
    ));

    const parts = [
      halo, head, body
    ];

    if (showName) {
      parts.push(
        at(
          name,
          P ? 20 : 18,
          color,
          x,
          y - 0.82 * scale
        )
      );
    }

    return new M.VGroup(...parts);
  }

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
      color, 0.65, 2
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

    const title = at(
      name,
      P ? 20 : 18,
      color,
      x + w * 0.035,
      y + h * 0.18,
      false,
      w * 0.76
    );

    const pageLine1 = line(
      pos(
        x - w * 0.25,
        y - h * 0.06
      ),

      pos(
        x + w * 0.31,
        y - h * 0.06
      ),

      color, 1.5
    );

    const pageLine2 = line(
      pos(
        x - w * 0.25,
        y - h * 0.17
      ),

      pos(
        x + w * 0.21,
        y - h * 0.17
      ),

      color, 1.2
    );

    const pageBottom = line(
      pos(
        x - w * 0.29,
        y - h * 0.39
      ),

      pos(
        x + w * 0.39,
        y - h * 0.39
      ),

      MUTED, 1.2
    );

    return new M.VGroup(
      halo,
      cover,
      spine,
      title,
      pageLine1,
      pageLine2,
      pageBottom
    );
  }

  // ------------------------------------------------------------
  // Topic pills.
  //
  // The topic itself, not its colour, determines equality.
  // Identical topics always receive identical label colours.
  // ------------------------------------------------------------

  function topicPill(
    topic, x, y,
    w = 1.63,
    h = 0.48,
    emphasized = false
  ) {
    const color =
      TOPIC_COLORS[topic];

    const halo = outline(
      x, y,
      w + 0.055,
      h + 0.055,
      color, 0, 1
    );

    const body = outline(
      x, y,
      w, h,
      color,
      0.68,
      emphasized ? 2.5 : 1.6
    );

    body.setFill(
      color,
      emphasized ? 0.30 : 0.15
    );

    const label = at(
      topic,
      P ? 18 : 16,
      color,
      x, y,
      false, w - 0.15
    );

    return new M.VGroup(
      halo,
      body,
      label
    );
  }

  function topicList(
    topics, x, y,
    w = 1.58,
    pitch = 0.60
  ) {
    return new M.VGroup(
      ...topics.map(
        (topic, j) =>
          topicPill(
            topic,
            x,

            y +
              (
                (topics.length - 1) / 2 -
                j
              ) * pitch,

            w,
            pitch * 0.76
          )
      )
    );
  }

  // ------------------------------------------------------------
  // Rating stars.
  //
  // A missing rating is a dash.
  // It is never displayed as zero filled stars.
  // ------------------------------------------------------------

  function ratingStar(
    x, y,
    filled,
    radius = 0.11
  ) {
    const color =
      filled ? YELLOW : MUTED;

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

    const parts = points.map(
      (p, k) =>
        line(
          p,
          points[
            (k + 1) % points.length
          ],
          color,
          filled ? 1.8 : 1.0
        )
    );

    if (filled) {
      parts.push(
        circle(
          x, y,
          radius * 0.43,
          YELLOW, 0.95, 0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function ratingStars(
    value, x, y,
    width = 1.14
  ) {
    if (value === null) {
      return new M.VGroup(
        at(
          '—',
          24, MUTED,
          x, y + 0.10,
          true
        ),

        at(
          'Not rated',
          P ? 14 : 12,
          MUTED,
          x,
          y - 0.20,
          false, width
        )
      );
    }

    const spacing =
      width / 5;

    const r =
      spacing * 0.43;

    return new M.VGroup(
      ...Array.from(
        { length: 5 },

        (_, j) =>
          ratingStar(
            x + (j - 2) * spacing,
            y,
            j < value,
            r
          )
      )
    );
  }

  // ------------------------------------------------------------
  // 0–1: Ana wants her next book.
  // ------------------------------------------------------------

  function introPicture() {
    const y =
      P ? -0.95 : -0.18;

    const ana = readerIcon(
      'Ana',
      CX - 2.32,
      y,
      1.17
    );

    const trail = bookCard(
      'Trail',
      CX - 0.25,
      y,
      1.32,
      P ? 1.85 : 1.62
    );

    const unknown = new M.VGroup(
      outline(
        CX + 2.12,
        y,
        1.42,
        P ? 1.85 : 1.62,
        CYAN, 0.44
      ),

      at(
        '?',
        42, CYAN,
        CX + 2.12,
        y
      ),

      at(
        'Next book',
        P ? 17 : 15,
        CYAN,
        CX + 2.12,

        y -
          (P ? 1.22 : 1.05)
      )
    );

    const connection = arrow(
      pos(CX + 0.55, y),
      pos(CX + 1.28, y),
      CYAN, 3.1
    );

    const title = at(
      'ANA VISITS THE BOOKSHOP',
      P ? 21 : 18,
      INK,
      CX,
      P ? 1.43 : 1.33,
      false, MAIN_W - 0.30
    );

    return {
      group: new M.VGroup(
        title,
        ana,
        trail,
        unknown,
        connection
      ),

      trail,
      unknown
    };
  }

  const intro =
    introPicture();

  await until(S(0));
  setStage(1.22, 1.6, 1.6, -0.1);

  await play(
    ...scene(intro.group),

    new M.FadeIn(markStaged(roster)),

    ...fbox([
      ['Ana', CYAN],
      'Looking for her next book',
      'What should we suggest?'
    ]),

    ...say('FIND ANA’S NEXT BOOK')
  );

  const knownInterest = note(
    'Use what Ana already likes',
    GREEN,
    P ? -3.3 : -2.17
  );

  await until(S(1));

  await play(
    ...enter(knownInterest),

    ...fbox([
      ['Known preferences', GREEN],
      'Ana has rated some books',
      'Can these ratings help us',
      'suggest something new?'
    ], GREEN),

    ...say('USE WHAT ANA ALREADY LIKES', GREEN)
  );

  // ------------------------------------------------------------
  // Book catalogue.
  //
  // The five books remain in the fixed chapter order:
  // Trail, River, Clues, Castle, Island.
  //
  // Every topic pill is attached visually to its own book.
  // ------------------------------------------------------------

  const CAT_SP =
    P ? 1.29 : 1.28;

  const CAT_X = j =>
    CX + (j - 2) * CAT_SP;

  const CAT_BOOK_Y =
    P ? 0.26 : 0.55;

  const CAT_BOOK_W =
    P ? 1.05 : 1.04;

  const CAT_BOOK_H =
    P ? 1.72 : 1.31;

  const CAT_TOPIC_TOP =
    P ? -1.12 : -0.59;

  const CAT_TOPIC_PITCH =
    P ? 0.61 : 0.47;

  const CAT_TOPIC_W =
    P ? 1.19 : 1.18;

  const CAT_TOPIC_H =
    P ? 0.43 : 0.36;

  const catBooks = BOOKS.map(
    (name, j) =>
      bookCard(
        name,
        CAT_X(j),
        CAT_BOOK_Y,
        CAT_BOOK_W,
        CAT_BOOK_H
      )
  );

  const catTopics = BOOKS.map(
    (name, j) =>
      TOPICS[name].map(
        (topic, k) =>
          topicPill(
            topic,
            CAT_X(j),

            CAT_TOPIC_TOP -
              k * CAT_TOPIC_PITCH,

            CAT_TOPIC_W,
            CAT_TOPIC_H
          )
      )
  );

  const catalogueTitle = at(
    'OUR FIVE BOOKS',
    P ? 21 : 18,
    INK,
    CX,
    P ? 1.57 : 1.43,
    true
  );

  const shelf = line(
    pos(
      CX - 3.18,

      CAT_BOOK_Y -
        CAT_BOOK_H / 2 -
        0.10
    ),

    pos(
      CX + 3.18,

      CAT_BOOK_Y -
        CAT_BOOK_H / 2 -
        0.10
    ),

    MUTED, 2.4
  );

  // ------------------------------------------------------------
  // 2: the five books.
  // ------------------------------------------------------------

  await until(S(2));
  setStage(1.12, 1.72, 1.85);

  await play(
    ...scene(
      catalogueTitle,
      shelf
    ),

    ...enterLagged(
      catBooks,
      0.14, 1.40
    ),

    ...fbox([
      ['Our catalogue', INK],
      ['Trail', BOOK_COLORS.Trail],
      ['River', BOOK_COLORS.River],
      ['Clues', BOOK_COLORS.Clues],
      ['Castle', BOOK_COLORS.Castle],
      ['Island', BOOK_COLORS.Island]
    ]),

    ...say('FIVE BOOKS IN THE BOOKSHOP')
  );

  // ------------------------------------------------------------
  // 3: show the small labels describing each book.
  // ------------------------------------------------------------

  const topicDescription = note(
    'Small labels describe what each book is about',
    CYAN,
    P ? -3.18 : -1.94
  );

  await until(S(3));

  await play(
    ...enterLagged(
      catTopics.flat(),
      0.08, 1.2
    ),

    ...enter(topicDescription),

    ...fbox([
      ['Each book has labels', CYAN],
      'They describe its content',
      'What is the book about?'
    ]),

    ...say('LABELS DESCRIBE THE CONTENT')
  );

  // ------------------------------------------------------------
  // 4: these labels are called topics.
  // ------------------------------------------------------------

  const topicsTag = tagAt(
    'TOPICS',
    CYAN,
    CX,
    P ? -3.89 : -2.42,
    19
  );

  await until(S(4));

  await play(
    ...enter(topicsTag),

    ...fbox([
      ['Topic', CYAN],
      'A label describing',
      'what an item is about'
    ]),

    ...say('WE CALL THESE LABELS TOPICS')
  );

  function catalogTopicOutline(
    bookIndex
  ) {
    const count =
      TOPICS[BOOKS[bookIndex]].length;

    const top =
      CAT_TOPIC_TOP +
      CAT_TOPIC_H / 2;

    const bottom =
      CAT_TOPIC_TOP -
      (count - 1) * CAT_TOPIC_PITCH -
      CAT_TOPIC_H / 2;

    return outline(
      CAT_X(bookIndex),

      (top + bottom) / 2,

      CAT_TOPIC_W + 0.09,

      top - bottom + 0.12,

      BOOK_COLORS[BOOKS[bookIndex]],
      0, 2.5
    );
  }

  function catalogueTopicBox(
    name
  ) {
    return fbox([
      [name, BOOK_COLORS[name]],

      ...TOPICS[name].map(topic => [
        topic,
        TOPIC_COLORS[topic]
      ]),

      `${TOPICS[name].length} topic${TOPICS[name].length === 1 ? '' : 's'}`
    ], BOOK_COLORS[name]);
  }

  // ------------------------------------------------------------
  // 5: Trail has Adventure and Nature.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...focus(
      catalogTopicOutline(0)
    ),

    ...catalogueTopicBox('Trail'),

    ...say(
      'TRAIL: ADVENTURE AND NATURE',
      BOOK_COLORS.Trail
    )
  );

  // ------------------------------------------------------------
  // 6: River has the same two topics.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...focus(
      catalogTopicOutline(1)
    ),

    ...catalogueTopicBox('River'),

    ...say(
      'RIVER: ADVENTURE AND NATURE',
      BOOK_COLORS.River
    )
  );

  // ------------------------------------------------------------
  // 7: Clues has Mystery and Crime.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...focus(
      catalogTopicOutline(2)
    ),

    ...catalogueTopicBox('Clues'),

    ...say(
      'CLUES: MYSTERY AND CRIME',
      BOOK_COLORS.Clues
    )
  );

  // ------------------------------------------------------------
  // 8: Castle has Mystery and History.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...focus(
      catalogTopicOutline(3)
    ),

    ...catalogueTopicBox('Castle'),

    ...say(
      'CASTLE: MYSTERY AND HISTORY',
      BOOK_COLORS.Castle
    )
  );

  // ------------------------------------------------------------
  // 9: Island is new and has just one topic.
  // ------------------------------------------------------------

  const islandNewTag = tagAt(
    'NEW',
    YELLOW,
    CAT_X(4),

    CAT_BOOK_Y +
      CAT_BOOK_H / 2 +
      0.18,

    14,
    1.02
  );

  await until(S(9));

  await play(
    ...focus(
      catalogTopicOutline(4)
    ),

    ...enter(islandNewTag),

    ...fbox([
      ['Island: new book', YELLOW],
      ['Adventure', CYAN],
      'Only one topic',
      'No ratings or purchases yet'
    ], YELLOW),

    ...say(
      'ISLAND: ADVENTURE ONLY',
      YELLOW
    )
  );

  // ------------------------------------------------------------
  // Ana's ratings picture.
  //
  // Five books in the original order.
  // Four stars for Trail.
  // Two stars for Clues.
  // Dashes for River, Castle and Island.
  // ------------------------------------------------------------

  const RAT_BOOK_Y =
    P ? 0.02 : 0.24;

  const RAT_BOOK_H =
    P ? 1.62 : 1.27;

  const RAT_STAR_Y =
    P ? -1.42 : -0.86;

  const ratingBooks = BOOKS.map(
    (name, j) =>
      bookCard(
        name,
        CAT_X(j),
        RAT_BOOK_Y,
        CAT_BOOK_W,
        RAT_BOOK_H
      )
  );

  const ratingTitle = new M.VGroup(
    readerIcon(
      'Ana',
      CX - 2.35,
      P ? 1.20 : 1.22,
      0.55,
      false
    ),

    at(
      'ANA’S RATINGS',
      P ? 21 : 19,
      CYAN,
      CX + 0.18,
      P ? 1.20 : 1.22,
      true
    )
  );

  function anaRatingCell(j) {
    const v =
      ANA_RATINGS[j];

    const x =
      CAT_X(j);

    const parts = [
      ratingStars(
        v,
        x,
        RAT_STAR_Y,
        1.10
      )
    ];

    if (v !== null) {
      parts.push(
        at(
          `${v} stars`,
          P ? 17 : 15,
          YELLOW,
          x,
          RAT_STAR_Y - 0.41,
          false, 1.16
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const ratingCells = BOOKS.map(
    (_, j) =>
      anaRatingCell(j)
  );

  // ------------------------------------------------------------
  // 10: inspect Ana's ratings.
  // ------------------------------------------------------------

  await until(S(10));
  setStage(1.08, 1.4, 1.6);

  await play(
    ...scene(
      ratingTitle,
      ...ratingBooks
    ),

    ...fbox([
      ['Ana rates books', CYAN],
      'From 1 to 5 stars',
      'More stars indicate',
      'a stronger preference'
    ]),

    ...say('LOOK AT ANA’S STAR RATINGS')
  );

  // ------------------------------------------------------------
  // 11: Trail has four stars; Clues has two stars.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...enter(
      ratingCells[0],
      ratingCells[2]
    ),

    ...fbox([
      ['Trail = 4 stars', GREEN],
      ['Clues = 2 stars', AMBER],
      'Ana prefers Trail'
    ], GREEN),

    ...say('TRAIL: 4 STARS · CLUES: 2 STARS')
  );

  // ------------------------------------------------------------
  // 12: three books have not yet been rated by Ana.
  // ------------------------------------------------------------

  const missingNote = note(
    'A dash means not rated, not zero stars',
    MUTED,
    P ? -3.20 : -2.18
  );

  await until(S(12));

  await play(
    ...enter(
      ratingCells[1],
      ratingCells[3],
      ratingCells[4],
      missingNote
    ),

    ...fbox([
      ['Not yet rated by Ana', MUTED],
      ['River', TEAL],
      ['Castle', PURPLE],
      ['Island', YELLOW],
      'No rating ≠ zero stars'
    ]),

    ...say('RIVER, CASTLE AND ISLAND ARE UNRATED')
  );

  // ------------------------------------------------------------
  // 13: choose Ana's highest-rated book.
  //
  // This is a deliberately simple interest model.
  // Only her highest-rated book is used in this example.
  // ------------------------------------------------------------

  const favouriteIndex =
    BOOKS.indexOf(FAVOURITE);

  const favouriteFrame = outline(
    CAT_X(favouriteIndex),

    P ? -0.82 : -0.47,

    CAT_BOOK_W + 0.19,

    P ? 3.42 : 2.70,

    GREEN, 0, 2.7
  );

  const favouriteTag = tagAt(
    'FAVOURITE',
    GREEN,
    CAT_X(favouriteIndex),
    P ? -2.74 : -1.99,
    P ? 15 : 13,
    1.30
  );

  await until(S(13));

  await play(
    ...focus(favouriteFrame),

    ...leave(missingNote),

    ...enter(favouriteTag),

    ...fbox([
      ['Highest-rated book', GREEN],
      [`${FAVOURITE} = 4 stars`, GREEN],
      'Use Trail as our starting',
      'picture of Ana’s interests'
    ], GREEN),

    ...say('TRAIL IS ANA’S FAVOURITE', GREEN)
  );

  // ------------------------------------------------------------
  // 14: create Ana's simple interest profile.
  //
  // The two topics come directly from Trail.
  // No topic weights or ratings of individual topics are invented.
  // ------------------------------------------------------------

  function interestProfile() {
    const y =
      P ? 0.22 : 0.23;

    const ana = readerIcon(
      'Ana',
      CX - 2.52,
      y,
      0.86
    );

    const trail = bookCard(
      FAVOURITE,
      CX - 0.80,
      y,
      1.23,
      P ? 1.70 : 1.40
    );

    const a = arrow(
      pos(CX - 0.02, y),
      pos(CX + 0.74, y),
      GREEN, 3.0
    );

    const panelX =
      CX + 2.02;

    const panel = outline(
      panelX,
      y,
      2.29,
      P ? 2.30 : 1.95,
      CYAN, 0.54
    );

    const title = at(
      'Ana’s interests',
      P ? 19 : 17,
      CYAN,
      panelX,

      y +
        (P ? 0.83 : 0.69),

      false, 2.06
    );

    const topics = topicList(
      FAVOURITE_TOPICS,
      panelX,
      y - 0.12,
      1.86,

      P ? 0.70 : 0.57
    );

    const explanation = note(
      'A simple first picture, based on her favourite book',
      GREEN,
      P ? -2.90 : -1.91
    );

    return new M.VGroup(
      ana,
      trail,
      a,
      panel,
      title,
      topics,
      explanation
    );
  }

  const interests =
    interestProfile();

  await until(S(14));
  setStage(1.2, 1.27, 1.55, 0.05);

  await play(
    ...scene(interests),

    ...fbox([
      ['Ana’s interest profile', CYAN],
      ['Adventure', CYAN],
      ['Nature', GREEN],
      'Taken from Trail'
    ]),

    ...say('ADVENTURE AND NATURE ARE OUR STARTING TOPICS')
  );

  // ------------------------------------------------------------
  // Candidate comparison overview.
  //
  // Preserve the source catalogue order:
  // River, Castle, Island.
  //
  // The ranking is not shown until it is calculated.
  // ------------------------------------------------------------

  const CANDIDATES =
    UNRATED_BOOKS.slice();

  const CAND_X = k =>
    CX + (k - 1) * 2.10;

  const CAND_BOOK_Y =
    P ? 0.05 : 0.31;

  const CAND_TOPIC_Y =
    P ? -1.38 : -0.72;

  const CAND_PROFILE_Y =
    P ? -3.31 : -1.93;

  function candidateCard(
    name, k,
    withProfile = true
  ) {
    const x =
      CAND_X(k);

    const color =
      BOOK_COLORS[name];

    const parts = [
      outline(
        x,

        P ? -0.72 : -0.22,

        1.99,

        P ? 4.70 : 3.42,

        color, 0.22, 1.4
      ),

      bookCard(
        name,
        x,
        CAND_BOOK_Y,
        1.18,
        P ? 1.47 : 1.10
      ),

      at(
        'Book topics',
        P ? 15 : 13,
        MUTED,
        x,

        CAND_TOPIC_Y +
          (P ? 0.75 : 0.58)
      ),

      topicList(
        TOPICS[name],
        x,
        CAND_TOPIC_Y,
        1.72,
        P ? 0.58 : 0.44
      )
    ];

    if (withProfile) {
      parts.push(
        at(
          'Ana’s topics',
          P ? 15 : 13,
          CYAN,
          x,

          CAND_PROFILE_Y +
            (P ? 0.74 : 0.55)
        ),

        topicList(
          FAVOURITE_TOPICS,
          x,
          CAND_PROFILE_Y,
          1.72,

          P ? 0.58 : 0.44
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const candidateCards =
    CANDIDATES.map(
      (name, k) =>
        candidateCard(name, k)
    );

  // ------------------------------------------------------------
  // 15: place Ana's interest labels beside each unrated book.
  // ------------------------------------------------------------

  await until(S(15));
  setStage(null);

  await play(
    ...scene(),

    ...enterLagged(
      candidateCards,
      0.17, 1.30
    ),

    ...fbox([
      ['Compare with Ana’s topics', CYAN],
      ['Adventure + Nature', GREEN],
      'Against every unrated book'
    ]),

    ...say('COMPARE ANA’S TOPICS WITH EACH CANDIDATE')
  );

  // ------------------------------------------------------------
  // 16: find which candidate has the most similar topics.
  // ------------------------------------------------------------

  const compareQuestion = note(
    'Which book has the strongest topic match?',
    GREEN,
    P ? -4.36 : -2.48
  );

  await until(S(16));

  await play(
    ...enter(compareQuestion),

    ...fbox([
      ['Our task', GREEN],
      'Measure topic similarity',
      'For River, Castle and Island',
      'Then compare their scores'
    ], GREEN),

    ...say('WHICH TOPICS ARE MOST SIMILAR?', GREEN)
  );

  // ------------------------------------------------------------
  // 17: name content-based recommendation.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...fbox([
      ['Content-based recommendation', GREEN],
      'Use what an item contains',
      'Match it to a person’s',
      'known interests'
    ], GREEN),

    ...say('CONTENT-BASED RECOMMENDATION', GREEN)
  );

  // ------------------------------------------------------------
  // Topic comparison workspace.
  //
  // First show both original sets of topics.
  // Then move matching labels together.
  //
  // Each source topic begins as its own object.
  // A matching pair moves to the same destination.
  // The duplicate is then removed before distinct topics
  // are counted.
  //
  // The retained topic receives a membership label:
  //   Both books
  //   Trail only
  //   Candidate only
  //
  // Only the common topics are highlighted as shared.
  // ------------------------------------------------------------

  const CMP_TOP_Y =
    P ? 0.45 : 0.87;

  const CMP_BOTTOM_Y =
    P ? -1.2 : -0.15;

  const CMP_LABEL_X =
    CX - 2.51;

  const CMP_TOPIC_X = [
    CX - 0.39,
    CX + 1.61
  ];

  const CMP_TOPIC_W =
    P ? 1.75 : 1.74;

  const CMP_TOPIC_H =
    P ? 0.51 : 0.45;

  const MERGE_Y =
    P ? -1.7 : -0.57;

  const MERGE_TITLE_Y =
    P ? 0.1 : 0.59;

  const MERGE_BOOK_Y =
    P ? 1.38 : 1.35;

  let cmp = null;

  function comparisonHeader(
    candidate
  ) {
    return new M.VGroup(
      at(
        FAVOURITE,
        P ? 21 : 18,
        BOOK_COLORS[FAVOURITE],
        CX - 1.12,
        MERGE_BOOK_Y
      ),

      at(
        'vs',
        P ? 16 : 14,
        MUTED,
        CX,
        MERGE_BOOK_Y
      ),

      at(
        candidate,
        P ? 21 : 18,
        BOOK_COLORS[candidate],
        CX + 1.12,
        MERGE_BOOK_Y
      )
    );
  }

  function comparisonRowLabel(
    name, row
  ) {
    const y =
      row === 0
        ? CMP_TOP_Y
        : CMP_BOTTOM_Y;

    return new M.VGroup(
      bookCard(
        name,
        CMP_LABEL_X,
        y,
        0.91,
        P ? 0.93 : 0.82
      ),

      arrow(
        pos(CMP_LABEL_X + 0.53, y),
        pos(CMP_LABEL_X + 1.06, y),
        BOOK_COLORS[name],
        2.0, 0.12
      )
    );
  }

  function createComparison(
    candidate
  ) {
    const header =
      comparisonHeader(candidate);

    const rowLabels = [
      comparisonRowLabel(FAVOURITE, 0),
      comparisonRowLabel(candidate, 1)
    ];

    const sourceA =
      FAVOURITE_TOPICS.map(
        (topic, j) => ({
          topic,
          source: FAVOURITE,

          object: topicPill(
            topic,
            CMP_TOPIC_X[j],
            CMP_TOP_Y,
            CMP_TOPIC_W,
            CMP_TOPIC_H
          )
        })
      );

    const sourceB =
      TOPICS[candidate].map(
        (topic, j) => ({
          topic,
          source: candidate,

          object: topicPill(
            topic,
            CMP_TOPIC_X[j],
            CMP_BOTTOM_Y,
            CMP_TOPIC_W,
            CMP_TOPIC_H
          )
        })
      );

    return {
      candidate,
      result: RESULTS[candidate],
      header,
      rowLabels,
      sourceA,
      sourceB,
      connectors: [],
      duplicates: [],
      retained: [],
      membershipLabels: [],
      summaryObjects: []
    };
  }

  function startComparison(
    candidate,
    revealTopics = false
  ) {
    cmp =
      createComparison(candidate);

    const a = scene(
      cmp.header,
      ...cmp.rowLabels
    );

    if (revealTopics) {
      a.push(
        ...enter(
          ...cmp.sourceA.map(
            entry => entry.object
          ),

          ...cmp.sourceB.map(
            entry => entry.object
          )
        )
      );
    }

    return a;
  }

  function revealComparisonTopics() {
    return enterLagged(
      [
        ...cmp.sourceA.map(
          entry => entry.object
        ),

        ...cmp.sourceB.map(
          entry => entry.object
        )
      ],

      0.15, 1.10
    );
  }

  function showMatches() {
    const matches =
      cmp.result.shared;

    const objects = matches.map(topic => {
      const aIndex =
        FAVOURITE_TOPICS.indexOf(topic);

      const bIndex =
        TOPICS[cmp.candidate].indexOf(topic);

      const p1 = pos(
        CMP_TOPIC_X[aIndex],
        CMP_TOP_Y - CMP_TOPIC_H / 2
      );

      const p2 = pos(
        CMP_TOPIC_X[bIndex],
        CMP_BOTTOM_Y + CMP_TOPIC_H / 2
      );

      return new M.VGroup(
        line(
          p1, p2,
          TOPIC_COLORS[topic],
          3.0
        ),

        glowDot(
          pos(
            (p1[0] + p2[0]) / 2,
            (p1[1] + p2[1]) / 2
          ),

          SHARED,
          0.07
        )
      );
    });

    cmp.connectors = objects;

    return enter(...objects);
  }

  function mergedSlot(
    topic, state = cmp
  ) {
    const topics =
      state.result.distinct;

    const n =
      topics.length;

    const index =
      topics.indexOf(topic);

    const spacing =
      n <= 2 ? 2.60 : 1.55;

    return {
      x:
        CX +
        (
          index -
          (n - 1) / 2
        ) * spacing,

      y: MERGE_Y,

      w:
        n <= 2
          ? 2.16
          : 1.40,

      h:
        P ? 0.67 : 0.52
    };
  }

  function mergeTopicLabels() {
    const a = [
      ...leave(
        ...cmp.rowLabels,
        ...cmp.connectors
      ),

      ...clearFocus()
    ];

    const mergedTitle = at(
      'COUNT EACH DIFFERENT TOPIC ONCE',
      P ? 19 : 17,
      DISTINCT,
      CX,
      MERGE_TITLE_Y,
      false,
      MAIN_W - 0.35
    );

    cmp.summaryObjects.push(
      mergedTitle
    );

    a.push(
      ...enter(mergedTitle)
    );

    const all = [
      ...cmp.sourceA,
      ...cmp.sourceB
    ];

    const seen = new Set();

    for (const entry of all) {
      const topic =
        entry.topic;

      const slot =
        mergedSlot(topic);

      const duplicate =
        seen.has(topic);

      const target = topicPill(
        topic,
        slot.x,
        slot.y,

        duplicate
          ? slot.w * 0.97
          : slot.w,

        duplicate
          ? slot.h * 0.97
          : slot.h
      );

      a.push(
        new M.Transform(
          entry.object,
          target,
          { runTime: 1.0 }
        )
      );

      if (duplicate) {
        cmp.duplicates.push(
          entry.object
        );
      } else {
        cmp.retained.push({
          topic,
          object: entry.object
        });

        seen.add(topic);
      }
    }

    return a;
  }

  function removeDuplicateLabels() {
    const a = leave(
      ...cmp.duplicates
    );

    cmp.duplicates = [];

    return a;
  }

  function distinctBracket() {
    const first =
      mergedSlot(
        cmp.result.distinct[0]
      );

    const last =
      mergedSlot(
        cmp.result.distinct[
          cmp.result.distinct.length - 1
        ]
      );

    const left =
      first.x - first.w / 2;

    const right =
      last.x + last.w / 2;

    const y =
      MERGE_Y -
      (P ? 0.76 : 0.65);

    return new M.VGroup(
      line(
        pos(left, y),
        pos(right, y),
        DISTINCT, 2
      ),

      line(
        pos(left, y - 0.08),
        pos(left, y + 0.08),
        DISTINCT, 2
      ),

      line(
        pos(right, y - 0.08),
        pos(right, y + 0.08),
        DISTINCT, 2
      ),

      at(
        `${cmp.result.denominator} distinct topics`,
        P ? 19 : 17,
        DISTINCT,
        (left + right) / 2,
        y - 0.27
      )
    );
  }

  function countDistinct() {
    const bracket =
      distinctBracket();

    cmp.summaryObjects.push(
      bracket
    );

    return [
      ...removeDuplicateLabels(),
      ...enter(bracket)
    ];
  }

  function showMembership() {
    const a = [];

    const state =
      cmp;

    state.retained.forEach(entry => {
      const topic =
        entry.topic;

      const slot =
        mergedSlot(topic);

      const shared =
        state.result.shared.includes(
          topic
        );

      const fromTrail =
        FAVOURITE_TOPICS.includes(topic);

      const label =
        shared
          ? 'Both books'
          : fromTrail
            ? 'Trail only'
            : `${state.candidate} only`;

      const color =
        shared ? SHARED : MUTED;

      const membership = at(
        label,
        P ? 17 : 15,
        color,
        slot.x,

        MERGE_Y +
          (P ? 0.60 : 0.45),

        false, slot.w + 0.12
      );

      state.membershipLabels.push(
        membership
      );

      a.push(
        ...enter(membership)
      );

      if (shared) {
        a.push(
          new M.Transform(
            entry.object,

            topicPill(
              topic,
              slot.x,
              slot.y,
              slot.w,
              slot.h,
              true
            ),

            { runTime: 0.65 }
          )
        );

        const border = outline(
          slot.x,
          slot.y,
          slot.w + 0.13,
          slot.h + 0.13,
          SHARED, 0, 2.5
        );

        state.summaryObjects.push(
          border
        );

        a.push(
          ...enter(border)
        );
      }
    });

    const count = at(
      `${state.result.numerator} shared topic${state.result.numerator === 1 ? '' : 's'}`,
      P ? 21 : 19,
      SHARED,
      CX,
      P ? -3.31 : -2.03
    );

    state.summaryObjects.push(
      count
    );

    a.push(
      ...enter(count)
    );

    return a;
  }

  // ------------------------------------------------------------
  // Fraction picture.
  //
  // Each distinct topic occupies one equal-width part.
  // Shared topics fill their corresponding parts.
  //
  // River: 2 of 2.
  // Island: 1 of 2.
  // Castle: 0 of 4.
  // ------------------------------------------------------------

  function fractionPicture(
    candidate,
    showScore = true
  ) {
    const result =
      RESULTS[candidate];

    const parts = [
      comparisonHeader(candidate)
    ];

    const n =
      result.denominator;

    const w =
      P ? 5.76 : 5.64;

    const step =
      w / n;

    const left =
      CX - w / 2;

    const y =
      P ? -0.49 : -0.31;

    const h =
      P ? 0.93 : 0.70;

    result.distinct.forEach(
      (topic, k) => {
        const x =
          left + (k + 0.5) * step;

        const shared =
          result.shared.includes(topic);

        const color =
          shared ? SHARED : MUTED;

        const body = outline(
          x, y,
          step - 0.07,
          h,
          color, 0.66, 1.8
        );

        body.setFill(
          shared ? SHARED : CARD,
          shared ? 0.28 : 0.66
        );

        parts.push(
          body,

          at(
            topic,
            P ? 19 : 17,
            TOPIC_COLORS[topic],
            x,

            y +
              (P ? 0.13 : 0.11),

            false,
            step - 0.16
          ),

          at(
            shared
              ? 'Shared'
              : 'Not shared',

            P ? 16 : 14,
            color,
            x,

            y -
              (P ? 0.20 : 0.15),

            false,
            step - 0.14
          )
        );
      }
    );

    parts.push(
      at(
        `${result.numerator} shared out of ${result.denominator} distinct`,
        P ? 20 : 17,
        SHARED,
        CX,

        y -
          (P ? 0.92 : 0.72),

        false,
        MAIN_W - 0.35
      )
    );

    if (showScore) {
      parts.push(
        at(
          calculationText(candidate),
          P ? 37 : 31,
          BOOK_COLORS[candidate],
          CX,
          P ? -3.08 : -2.07,
          true,
          MAIN_W - 0.40
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 18: compare Trail with River.
  // ------------------------------------------------------------

  await until(S(18));
  setStage(1.25, 1.55, 1.6, -0.24);

  await play(
    ...startComparison('River'),

    ...fbox([
      ['First comparison', TEAL],
      ['Trail versus River', INK],
      'Compare their topic sets'
    ], TEAL),

    ...say('COMPARE TRAIL WITH RIVER', TEAL)
  );

  // ------------------------------------------------------------
  // 19: place both topic sets side by side.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...revealComparisonTopics(),

    ...fbox([
      ['Trail', GREEN],
      'Adventure, Nature',
      ['River', TEAL],
      'Adventure, Nature'
    ], TEAL),

    ...say('PLACE BOTH SETS OF TOPICS TOGETHER')
  );

  // ------------------------------------------------------------
  // 20: Adventure and Nature both match.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...showMatches(),

    ...fbox([
      ['Adventure matches', CYAN],
      ['Nature matches', GREEN],
      'Both books have both topics'
    ], GREEN),

    ...say('BOTH TOPICS MATCH', GREEN)
  );

  // ------------------------------------------------------------
  // 21: merge the matching labels.
  //
  // Four source labels become two unique topic positions.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...mergeTopicLabels(),

    ...fbox([
      ['Merge matching labels', DISTINCT],
      'Adventure + Adventure',
      'Nature + Nature',
      'Count each topic once'
    ], DISTINCT),

    ...say('MOVE MATCHING LABELS TOGETHER', DISTINCT)
  );

  // ------------------------------------------------------------
  // 22: there are two distinct topics.
  //
  // Remove the duplicate label objects.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...countDistinct(),

    ...fbox([
      ['Distinct topics', DISTINCT],
      'Adventure, Nature',
      ['Total = 2', DISTINCT]
    ], DISTINCT),

    ...say('TWO DIFFERENT TOPICS IN TOTAL', DISTINCT)
  );

  // ------------------------------------------------------------
  // 23: both distinct topics are shared.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...showMembership(),

    ...fbox([
      ['Shared topics', SHARED],
      'Adventure belongs to both',
      'Nature belongs to both',
      ['Shared count = 2', SHARED]
    ], SHARED),

    ...say('TWO SHARED TOPICS', SHARED)
  );

  // ------------------------------------------------------------
  // 24: two shared out of two gives a score of one.
  // ------------------------------------------------------------

  const riverFraction =
    fractionPicture('River');

  await until(S(24));
  setStage(1.28, 1.4, 1.6);

  await play(
    ...scene(riverFraction),

    ...fbox([
      ['River similarity', TEAL],
      ['Shared topics = 2', SHARED],
      ['Distinct topics = 2', DISTINCT],
      ['2 ÷ 2 = 1', TEAL]
    ], TEAL),

    ...say('RIVER: TWO DIVIDED BY TWO = ONE', TEAL)
  );

  // ------------------------------------------------------------
  // 25: score one means the topic sets are identical.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...fbox([
      ['Similarity = 1', TEAL],
      'Every topic matches',
      'The two topic sets',
      'are exactly the same'
    ], TEAL),

    ...say('A SCORE OF ONE MEANS ALL TOPICS MATCH', TEAL)
  );

  // ------------------------------------------------------------
  // 26: compare Trail with Island.
  // ------------------------------------------------------------

  await until(S(26));
  setStage(1.25, 1.55, 1.6, -0.24);

  await play(
    ...startComparison('Island'),

    ...fbox([
      ['Second comparison', YELLOW],
      'Trail versus Island',
      'Island is a new book'
    ], YELLOW),

    ...say('COMPARE TRAIL WITH ISLAND', YELLOW)
  );

  // ------------------------------------------------------------
  // 27: Trail has two topics, Island has one.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...revealComparisonTopics(),

    ...fbox([
      ['Trail', GREEN],
      'Adventure, Nature',
      ['Island', YELLOW],
      'Adventure only'
    ], YELLOW),

    ...say('TRAIL HAS TWO TOPICS; ISLAND HAS ONE', YELLOW)
  );

  // ------------------------------------------------------------
  // 28: merge the two Adventure labels.
  //
  // Nature remains a separate distinct topic.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...mergeTopicLabels(),

    ...fbox([
      ['One matching pair', CYAN],
      'Adventure + Adventure',
      ['Nature remains separate', GREEN]
    ], YELLOW),

    ...say('MOVE THE ADVENTURE LABELS TOGETHER', YELLOW)
  );

  // ------------------------------------------------------------
  // 29: there are still two distinct topics.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...countDistinct(),

    ...fbox([
      ['Distinct topics', DISTINCT],
      'Adventure, Nature',
      ['Total = 2', DISTINCT]
    ], DISTINCT),

    ...say('AGAIN, TWO DIFFERENT TOPICS', DISTINCT)
  );

  // ------------------------------------------------------------
  // 30: only Adventure appears in both books.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...showMembership(),

    ...fbox([
      ['Shared: Adventure', SHARED],
      ['Trail only: Nature', MUTED],
      ['Shared count = 1', SHARED]
    ], SHARED),

    ...say('ONLY ADVENTURE IS SHARED', SHARED)
  );

  // ------------------------------------------------------------
  // 31: one shared topic out of two = 0.5.
  // ------------------------------------------------------------

  const islandFraction =
    fractionPicture('Island');

  await until(S(31));
  setStage(1.28, 1.4, 1.6);

  await play(
    ...scene(islandFraction),

    ...fbox([
      ['Island similarity', YELLOW],
      ['Shared topics = 1', SHARED],
      ['Distinct topics = 2', DISTINCT],
      ['1 ÷ 2 = 0.5', YELLOW]
    ], YELLOW),

    ...say('ISLAND: ONE DIVIDED BY TWO = 0.5', YELLOW)
  );

  // ------------------------------------------------------------
  // 32: compare Trail with Castle.
  // ------------------------------------------------------------

  await until(S(32));
  setStage(1.25, 1.55, 1.6, -0.24);

  await play(
    ...startComparison('Castle'),

    ...fbox([
      ['Third comparison', PURPLE],
      'Trail versus Castle',
      'Compare both topic sets'
    ], PURPLE),

    ...say('COMPARE TRAIL WITH CASTLE', PURPLE)
  );

  // ------------------------------------------------------------
  // 33: show their different topic sets.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...revealComparisonTopics(),

    ...fbox([
      ['Trail', GREEN],
      'Adventure, Nature',
      ['Castle', PURPLE],
      'Mystery, History'
    ], PURPLE),

    ...say('ADVENTURE, NATURE VS MYSTERY, HISTORY', PURPLE)
  );

  // ------------------------------------------------------------
  // 34: no matching topics.
  // ------------------------------------------------------------

  const noMatchTag = tagAt(
    'NO MATCHING TOPICS',
    AMBER,
    CX,
    P ? -2.41 : -1.61,
    19
  );

  await until(S(34));

  await play(
    ...enter(noMatchTag),

    ...fbox([
      ['No shared topics', AMBER],
      'Adventure ≠ Mystery',
      'Nature ≠ History',
      'The two sets do not overlap'
    ], AMBER),

    ...say('NONE OF THE TOPICS MATCH', AMBER)
  );

  // ------------------------------------------------------------
  // 35: all four topics are distinct.
  //
  // No label is removed because there are no duplicates.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...leave(noMatchTag),

    ...mergeTopicLabels(),

    ...countDistinct(),

    ...showMembership(),

    ...fbox([
      ['Distinct topics = 4', DISTINCT],
      'Adventure, Nature,',
      'Mystery, History',
      ['Shared topics = 0', SHARED]
    ], PURPLE),

    ...say('FOUR DISTINCT TOPICS, ZERO SHARED', PURPLE)
  );

  // ------------------------------------------------------------
  // 36: zero shared out of four gives zero.
  // ------------------------------------------------------------

  const castleFraction =
    fractionPicture('Castle');

  await until(S(36));
  setStage(1.28, 1.4, 1.6);

  await play(
    ...scene(castleFraction),

    ...fbox([
      ['Castle similarity', PURPLE],
      ['Shared topics = 0', SHARED],
      ['Distinct topics = 4', DISTINCT],
      ['0 ÷ 4 = 0', PURPLE]
    ], PURPLE),

    ...say('CASTLE: ZERO DIVIDED BY FOUR = ZERO', PURPLE)
  );

  // ------------------------------------------------------------
  // Similarity scale.
  //
  // Show all three actual results on the same scale.
  // Zero means no shared topics.
  // One means identical topic sets.
  // ------------------------------------------------------------

  const SCALE_LEFT =
    CX - 2.75;

  const SCALE_RIGHT =
    CX + 2.75;

  const SCALE_Y =
    P ? -0.65 : -0.52;

  const sx = value =>
    SCALE_LEFT +
    value * (
      SCALE_RIGHT -
      SCALE_LEFT
    );

  function similarityScale() {
    const parts = [
      line(
        pos(SCALE_LEFT, SCALE_Y),
        pos(SCALE_RIGHT, SCALE_Y),
        MUTED, 2.7
      )
    ];

    for (const v of [
      0, 0.25, 0.5, 0.75, 1
    ]) {
      const x = sx(v);

      parts.push(
        line(
          pos(x, SCALE_Y - 0.10),
          pos(x, SCALE_Y + 0.10),
          MUTED, 1.8
        ),

        at(
          scoreText(v),
          P ? 16 : 14,
          MUTED,
          x,
          SCALE_Y - 0.34,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function similarityMarker(name) {
    const result =
      RESULTS[name];

    const x =
      sx(result.score);

    const color =
      BOOK_COLORS[name];

    return new M.VGroup(
      glowDot(
        pos(x, SCALE_Y),
        color,
        0.12
      ),

      line(
        pos(x, SCALE_Y + 0.12),
        pos(x, SCALE_Y + 0.39),
        color, 2
      ),

      bookCard(
        name,
        x,
        SCALE_Y +
          (P ? 1.09 : 0.97),

        1.16,
        P ? 1.15 : 1.03
      ),

      at(
        scoreText(result.score),
        P ? 23 : 20,
        color,
        x,
        SCALE_Y -
          (P ? 0.86 : 0.74),
        true
      )
    );
  }

  const jScale =
    similarityScale();

  const scaleMarkers =
    ['Castle', 'Island', 'River']
      .map(similarityMarker);

  // ------------------------------------------------------------
  // 37: name Jaccard similarity.
  // ------------------------------------------------------------

  await until(S(37));
  setStage(1.12, -0.6, -1.4);

  await play(
    ...scene(
      jScale,
      ...scaleMarkers
    ),

    ...fbox([
      ['Jaccard similarity', CYAN],
      'Compare two sets of topics',
      'Measure how much they overlap',
      ['Scores range from 0 to 1', GREEN]
    ]),

    ...say('JACCARD SIMILARITY')
  );

  // ------------------------------------------------------------
  // 38: explain the endpoints of the scale.
  // ------------------------------------------------------------

  const noOverlapLabel = at(
    'No topics match',
    P ? 18 : 16,
    MUTED,
    SCALE_LEFT + 0.34,
    P ? -2.58 : -1.97,
    false, 2.24
  );

  const fullOverlapLabel = at(
    'All topics match',
    P ? 18 : 16,
    GREEN,
    SCALE_RIGHT - 0.34,
    P ? -2.58 : -1.97,
    false, 2.24
  );

  await until(S(38));

  await play(
    ...enter(
      noOverlapLabel,
      fullOverlapLabel
    ),

    ...fbox([
      ['1: identical topic sets', GREEN],
      ['0: no shared topics', MUTED],
      'Values between 0 and 1',
      'mean partial overlap'
    ], GREEN),

    ...say('ONE MEANS ALL MATCH; ZERO MEANS NONE', GREEN)
  );

  // ------------------------------------------------------------
  // Formula illustration.
  //
  // Use Trail and Island to show the relationship between
  // the shared-topic set and the distinct-topic set.
  //
  // The smaller set of shared topics is contained within
  // the complete set of distinct topics.
  // ------------------------------------------------------------

  function formulaSetPicture() {
    const y =
      P ? -0.38 : -0.22;

    const w =
      P ? 5.84 : 5.72;

    const h =
      P ? 2.76 : 2.25;

    const parts = [
      outline(
        CX, y,
        w, h,
        DISTINCT, 0.32, 2.3
      ),

      at(
        'ALL DISTINCT TOPICS',
        P ? 19 : 17,
        DISTINCT,
        CX,

        y +
          h / 2 - 0.28,

        true, w - 0.30
      ),

      topicPill(
        'Adventure',
        CX - 1.35,
        y,
        2.03,
        P ? 0.65 : 0.54,
        true
      ),

      topicPill(
        'Nature',
        CX + 1.35,
        y,
        2.03,
        P ? 0.65 : 0.54
      ),

      outline(
        CX - 1.35,
        y,
        2.24,
        P ? 1.10 : 0.89,
        SHARED, 0, 2.6
      ),

      at(
        'Shared',
        P ? 18 : 16,
        SHARED,
        CX - 1.35,

        y -
          (P ? 0.85 : 0.70)
      ),

      at(
        'Trail only',
        P ? 17 : 15,
        MUTED,
        CX + 1.35,

        y -
          (P ? 0.85 : 0.70)
      ),

      at(
        'Trail compared with Island',
        P ? 17 : 15,
        INK,
        CX,
        P ? -2.59 : -1.92
      )
    ];

    return new M.VGroup(...parts);
  }

  const formulaIllustration =
    formulaSetPicture();

  // ------------------------------------------------------------
  // 39: introduce the short calculation formula.
  // ------------------------------------------------------------

  await until(S(39));
  setStage(1.1, -0.6, -1.4);

  await play(
    ...scene(formulaIllustration),

    ...fbox([
      ['One short formula', CYAN],
      ['Count shared topics', SHARED],
      ['Count distinct topics', DISTINCT],
      'Divide the two counts'
    ]),

    ...say('WRITE THE SIMILARITY AS A FORMULA')
  );

  // ------------------------------------------------------------
  // 40: Jaccard = shared topics / distinct topics.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...fbox([
      ['Jaccard similarity', CYAN],
      ['= number of shared topics', SHARED],
      ['  ÷ number of distinct topics', DISTINCT]
    ]),

    ...say('SHARED TOPICS DIVIDED BY DISTINCT TOPICS')
  );

  // ------------------------------------------------------------
  // Summary table of calculated similarities.
  //
  // Initially retain catalogue order, not ranking order.
  // Scores are revealed in narration order:
  // River, Island, Castle.
  // ------------------------------------------------------------

  const TABLE_TOP =
    P ? 0.56 : 0.61;

  const TABLE_PITCH =
    P ? 1.17 : 0.91;

  const TABLE_X = {
    book: CX - 2.27,
    shared: CX - 0.52,
    distinct: CX + 1.02,
    score: CX + 2.59
  };

  const tableY = k =>
    TABLE_TOP -
    k * TABLE_PITCH;

  function resultTableHeader() {
    const y =
      TABLE_TOP +
      (P ? 0.76 : 0.60);

    return new M.VGroup(
      at(
        'Book',
        P ? 17 : 15,
        INK,
        TABLE_X.book,
        y
      ),

      at(
        'Shared',
        P ? 17 : 15,
        SHARED,
        TABLE_X.shared,
        y
      ),

      at(
        'Distinct',
        P ? 17 : 15,
        DISTINCT,
        TABLE_X.distinct,
        y
      ),

      at(
        'Similarity',
        P ? 17 : 15,
        CYAN,
        TABLE_X.score,
        y,
        false, 1.34
      ),

      line(
        pos(
          CX - 3.10,
          y - 0.31
        ),

        pos(
          CX + 3.23,
          y - 0.31
        ),

        MUTED, 1.5
      )
    );
  }

  function resultTableRow(
    name,
    k,
    revealed = false
  ) {
    const y =
      tableY(k);

    const result =
      RESULTS[name];

    const color =
      BOOK_COLORS[name];

    return new M.VGroup(
      outline(
        CX + 0.03,
        y,
        6.38,
        P ? 0.95 : 0.73,
        MUTED, 0.45, 1
      ),

      bookCard(
        name,
        TABLE_X.book,
        y,
        1.12,
        P ? 0.81 : 0.64
      ),

      at(
        revealed
          ? result.numerator
          : '—',

        P ? 23 : 20,
        revealed
          ? SHARED
          : MUTED,

        TABLE_X.shared,
        y,
        true
      ),

      at(
        revealed
          ? result.denominator
          : '—',

        P ? 23 : 20,
        revealed
          ? DISTINCT
          : MUTED,

        TABLE_X.distinct,
        y,
        true
      ),

      at(
        revealed
          ? scoreText(result.score)
          : '—',

        P ? 26 : 23,

        revealed
          ? color
          : MUTED,

        TABLE_X.score,
        y,
        true
      )
    );
  }

  const tableHeader =
    resultTableHeader();

  const tableRows =
    CANDIDATES.map(
      (name, k) =>
        resultTableRow(name, k)
    );

  function revealTableResult(name) {
    const k =
      CANDIDATES.indexOf(name);

    return [
      new M.Transform(
        tableRows[k],

        resultTableRow(
          name,
          k,
          true
        ),

        { runTime: 0.65 }
      ),

      ...focus(
        outline(
          CX + 0.03,
          tableY(k),
          6.42,
          P ? 1.01 : 0.79,
          BOOK_COLORS[name],
          0, 2.3
        )
      )
    ];
  }

  // ------------------------------------------------------------
  // 41: River = 2 ÷ 2 = 1.
  // ------------------------------------------------------------

  const riverRowIndex =
    CANDIDATES.indexOf('River');

  tableRows[riverRowIndex] =
    resultTableRow(
      'River',
      riverRowIndex,
      true
    );

  await until(S(41));
  setStage(1.15, 1.5, 1.65);

  await play(
    ...scene(
      tableHeader,
      ...tableRows
    ),

    ...focus(
      outline(
        CX + 0.03,
        tableY(riverRowIndex),
        6.42,
        P ? 1.01 : 0.79,
        TEAL, 0, 2.3
      )
    ),

    ...fbox([
      ['River', TEAL],
      ['2 shared topics', SHARED],
      ['2 distinct topics', DISTINCT],
      [calculationText('River'), TEAL]
    ], TEAL),

    ...say('RIVER SIMILARITY = 1', TEAL)
  );

  // ------------------------------------------------------------
  // 42: Island = 1 ÷ 2 = 0.5.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...revealTableResult('Island'),

    ...fbox([
      ['Island', YELLOW],
      ['1 shared topic', SHARED],
      ['2 distinct topics', DISTINCT],
      [calculationText('Island'), YELLOW]
    ], YELLOW),

    ...say('ISLAND SIMILARITY = 0.5', YELLOW)
  );

  // ------------------------------------------------------------
  // 43: Castle = 0 ÷ 4 = 0.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...revealTableResult('Castle'),

    ...fbox([
      ['Castle', PURPLE],
      ['0 shared topics', SHARED],
      ['4 distinct topics', DISTINCT],
      [calculationText('Castle'), PURPLE]
    ], PURPLE),

    ...say('CASTLE SIMILARITY = 0', PURPLE)
  );

  // ------------------------------------------------------------
  // Ranking picture.
  //
  // The same three book-row objects move into their calculated
  // positions. Scores remain attached to their corresponding
  // books throughout the sorting animation.
  //
  // All similarity bars use the same 0–1 scale.
  // ------------------------------------------------------------

  const RANK_TOP =
    P ? 0.69 : 0.67;

  const RANK_PITCH =
    P ? 1.50 : 1.03;

  const RANK_Y = k =>
    RANK_TOP -
    k * RANK_PITCH;

  const RANK_BOOK_X =
    CX - 1.94;

  const RANK_LEFT =
    CX - 0.93;

  const RANK_BAR_W =
    P ? 3.22 : 3.15;

  const RANK_BAR_H =
    P ? 0.30 : 0.25;

  function rankingRow(
    name, k
  ) {
    const color =
      BOOK_COLORS[name];

    const result =
      RESULTS[name];

    const y =
      RANK_Y(k);

    const w =
      RANK_BAR_W *
      result.score;

    const parts = [
      bookCard(
        name,
        RANK_BOOK_X,
        y,
        1.17,
        P ? 1.04 : 0.83
      ),

      rect(
        RANK_LEFT +
          RANK_BAR_W / 2,

        y + 0.05,

        RANK_BAR_W,
        RANK_BAR_H,
        CARD, 0.78, 0
      ),

      outline(
        RANK_LEFT +
          RANK_BAR_W / 2,

        y + 0.05,

        RANK_BAR_W + 0.035,
        RANK_BAR_H + 0.035,

        MUTED, 0, 1
      )
    ];

    if (w > 0) {
      parts.push(
        rect(
          RANK_LEFT + w / 2,
          y + 0.05,
          w,
          RANK_BAR_H + 0.07,
          color, 0.13, 0
        ),

        rect(
          RANK_LEFT + w / 2,
          y + 0.05,
          w,
          RANK_BAR_H,
          color, 0.88, 1
        )
      );
    } else {
      parts.push(
        line(
          pos(
            RANK_LEFT,
            y - RANK_BAR_H / 2
          ),

          pos(
            RANK_LEFT,
            y + RANK_BAR_H / 2 + 0.10
          ),

          color, 2.0
        )
      );
    }

    parts.push(
      at(
        scoreText(result.score),
        P ? 25 : 22,
        color,
        CX + 2.79,
        y + 0.05,
        true, 0.88
      ),

      at(
        `${result.numerator} shared / ${result.denominator} distinct`,
        P ? 15 : 13,
        MUTED,
        RANK_LEFT +
          RANK_BAR_W / 2,

        y -
          (P ? 0.42 : 0.33),

        false,
        RANK_BAR_W
      )
    );

    return new M.VGroup(...parts);
  }

  const rankingRows =
    CANDIDATES.map(
      (name, k) =>
        rankingRow(name, k)
    );

  const rankTitle = at(
    'SIMILARITY TO ANA’S FAVOURITE',
    P ? 19 : 17,
    INK,
    CX,
    P ? 1.48 : 1.43,
    false,
    MAIN_W - 0.30
  );

  function moveRankingRows() {
    return CANDIDATES.map(
      (name, oldIndex) =>
        new M.Transform(
          rankingRows[oldIndex],

          rankingRow(
            name,
            RANKED.indexOf(name)
          ),

          {
            runTime: 1.15,
            pathArc:
              oldIndex === RANKED.indexOf(name)
                ? 0
                : (
                    oldIndex < RANKED.indexOf(name)
                      ? 0.30
                      : -0.30
                  )
          }
        )
    );
  }

  function rankNumber(k) {
    const name =
      RANKED[k];

    const color =
      BOOK_COLORS[name];

    const x =
      CX - 2.91;

    const y =
      RANK_Y(k);

    return new M.VGroup(
      circle(
        x, y,
        P ? 0.23 : 0.20,
        color, 0.17, 2
      ),

      at(
        k + 1,
        P ? 20 : 17,
        color,
        x, y,
        true
      )
    );
  }

  const rankNumbers =
    RANKED.map(
      (_, k) =>
        rankNumber(k)
    );

  // ------------------------------------------------------------
  // 44: sort by similarity score.
  //
  // Begin with the original candidate order.
  // ------------------------------------------------------------

  await until(S(44));
  setStage(null);

  await play(
    ...scene(
      rankTitle,
      ...rankingRows
    ),

    ...fbox([
      ['Rank the candidates', GREEN],
      'Largest similarity first',
      'Smallest similarity last'
    ], GREEN),

    ...say('ARRANGE FROM HIGHEST TO LOWEST SIMILARITY', GREEN)
  );

  // ------------------------------------------------------------
  // 45: animate the calculated ranking.
  //
  // River stays first.
  // Island moves above Castle.
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...moveRankingRows(),

    ...enterLagged(
      rankNumbers,
      0.18, 0.90
    ),

    ...fbox([
      ['1. River = 1', TEAL],
      ['2. Island = 0.5', YELLOW],
      ['3. Castle = 0', PURPLE]
    ], GREEN),

    ...say('FIRST RIVER, SECOND ISLAND, THIRD CASTLE', GREEN)
  );

  // ------------------------------------------------------------
  // 46: recommend River first.
  //
  // The recommendation is based on similarity to Trail,
  // not a prediction that Ana will necessarily give River
  // the same rating.
  // ------------------------------------------------------------

  const firstRankFrame = outline(
    CX + 0.03,
    RANK_Y(0),
    6.47,
    P ? 1.18 : 0.96,
    GREEN, 0, 2.7
  );

  const firstRecommendation = note(
    'First recommendation: River',
    GREEN,
    P ? -4.01 : -2.46
  );

  await until(S(46));

  await play(
    ...focus(firstRankFrame),

    ...enter(firstRecommendation),

    ...fbox([
      ['Recommend River first', TEAL],
      ['Similarity = 1', GREEN],
      'Adventure and Nature',
      'Exactly match Trail’s topics'
    ], GREEN),

    ...say('RIVER IS OUR FIRST RECOMMENDATION', TEAL)
  );

  // ------------------------------------------------------------
  // 47–48: Island can be recommended without past ratings.
  //
  // This is the same new Island book from the chapter data.
  //
  // It has:
  //   0 ratings
  //   0 purchases
  //   1 known topic: Adventure
  //
  // Its Jaccard score remains 0.5.
  // ------------------------------------------------------------

  function islandColdStartPicture() {
    const parts = [];

    const islandX =
      CX - 1.91;

    const islandY =
      P ? 0.12 : 0.18;

    parts.push(
      bookCard(
        'Island',
        islandX,
        islandY,
        1.54,
        P ? 2.02 : 1.66
      ),

      tagAt(
        'NEW BOOK',
        YELLOW,
        islandX,

        islandY +
          (P ? 1.35 : 1.10),

        P ? 17 : 15,
        1.80
      )
    );

    const panelX =
      CX + 1.22;

    const panelY =
      P ? 0.05 : 0.08;

    const panelW = 3.05;
    const panelH =
      P ? 2.58 : 2.17;

    parts.push(
      outline(
        panelX,
        panelY,
        panelW,
        panelH,
        MUTED, 0.55
      ),

      at(
        'Island ratings',
        P ? 19 : 17,
        YELLOW,
        panelX,

        panelY +
          panelH / 2 -
          0.26
      )
    );

    READERS.forEach(
      (name, i) => {
        const y =
          panelY +
          panelH / 2 -
          0.73 -
          i * (P ? 0.43 : 0.34);

        parts.push(
          at(
            name,
            P ? 18 : 16,
            READER_COLORS[name],
            panelX - 0.65,
            y
          ),

          at(
            '—',
            P ? 19 : 17,
            MUTED,
            panelX + 0.72,
            y,
            true
          )
        );
      }
    );

    parts.push(
      at(
        `${ISLAND_RATING_COUNT} ratings · ${ISLAND_PURCHASE_COUNT} purchases`,
        P ? 20 : 17,
        MUTED,
        CX,
        P ? -2.07 : -1.49,
        true,
        MAIN_W - 0.4
      ),

      note(
        'A missing rating is not a negative rating',
        MUTED,
        P ? -3.39 : -2.40
      )
    );

    return new M.VGroup(...parts);
  }

  const islandColdStart =
    islandColdStartPicture();

  await until(S(47));
  setStage(1.25, 1.5, 1.6);

  await play(
    ...scene(islandColdStart),

    ...fbox([
      ['Island has no ratings', YELLOW],
      'Ana: not rated',
      'Ben, Cara, Dan: not rated',
      ['But similarity = 0.5', GREEN]
    ], YELLOW),

    ...say('ISLAND CAN BE RECOMMENDED WITHOUT RATINGS', YELLOW)
  );

  // ------------------------------------------------------------
  // 48: the known content is sufficient for this comparison.
  // ------------------------------------------------------------

  function islandContentPicture() {
    const y =
      P ? 0.24 : 0.31;

    const parts = [
      readerIcon(
        'Ana',
        CX - 2.45,
        y,
        0.74
      ),

      topicList(
        FAVOURITE_TOPICS,
        CX - 0.89,
        y,
        1.64,
        P ? 0.68 : 0.56
      ),

      bookCard(
        'Island',
        CX + 2.33,
        y,
        1.22,
        P ? 1.64 : 1.31
      ),

      topicPill(
        'Adventure',
        CX + 0.88,
        y +
          (P ? 0.33 : 0.27),
        1.65,
        0.46,
        true
      ),

      line(
        pos(
          CX - 0.05,
          y + (P ? 0.34 : 0.28)
        ),

        pos(
          CX + 0.02,
          y + (P ? 0.33 : 0.27)
        ),

        SHARED, 3
      ),

      at(
        'Adventure matches',
        P ? 20 : 17,
        SHARED,
        CX,
        P ? -1.31 : -0.82
      ),

      at(
        '1 shared topic / 2 distinct topics',
        P ? 18 : 16,
        INK,
        CX,
        P ? -2.11 : -1.45,
        false,
        MAIN_W - 0.30
      ),

      at(
        'Similarity = 0.5',
        P ? 29 : 24,
        YELLOW,
        CX,
        P ? -3.08 : -2.16,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  const islandContent =
    islandContentPicture();

  await until(S(48));
  setStage(1.12, 1.4, 1.55);

  await play(
    ...scene(islandContent),

    ...fbox([
      ['Known content', CYAN],
      ['Island: Adventure', YELLOW],
      ['Ana: Adventure, Nature', CYAN],
      ['1 ÷ 2 = 0.5', GREEN]
    ], GREEN),

    ...say('WE ONLY NEED TO KNOW WHAT ISLAND IS ABOUT', GREEN)
  );

  // ------------------------------------------------------------
  // 49: general applications.
  //
  // Illustrative item types, not additional chapter data.
  // All use the same idea:
  // known interests → matching item content.
  // ------------------------------------------------------------

  function filmIcon(x, y) {
    const color = CYAN;

    const frame = outline(
      x, y,
      1.12, 0.79,
      color, 0.50
    );

    const parts = [frame];

    for (const side of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        parts.push(
          rect(
            x + side * 0.43,

            y +
              (k - 1) * 0.23,

            0.10,
            0.10,
            color, 0.84, 0
          )
        );
      }
    }

    parts.push(
      line(
        pos(x - 0.11, y + 0.20),
        pos(x + 0.22, y),
        color, 2.8
      ),

      line(
        pos(x + 0.22, y),
        pos(x - 0.11, y - 0.20),
        color, 2.8
      ),

      line(
        pos(x - 0.11, y - 0.20),
        pos(x - 0.11, y + 0.20),
        color, 2.8
      )
    );

    return new M.VGroup(...parts);
  }

  function itemIcon(x, y) {
    return new M.VGroup(
      outline(
        x, y,
        0.98, 0.85,
        PURPLE, 0.44
      ),

      line(
        pos(x - 0.48, y + 0.16),
        pos(x, y - 0.04),
        PURPLE, 2
      ),

      line(
        pos(x, y - 0.04),
        pos(x + 0.48, y + 0.16),
        PURPLE, 2
      ),

      line(
        pos(x, y - 0.04),
        pos(x, y - 0.43),
        PURPLE, 2
      )
    );
  }

  function applicationPicture() {
    const parts = [];

    const profileY =
      P ? 1.15 : 1.24;

    parts.push(
      at(
        'KNOWN INTERESTS',
        P ? 20 : 17,
        CYAN,
        CX,
        profileY,
        true
      )
    );

    const xs = [
      CX - 2.07,
      CX,
      CX + 2.07
    ];

    const y =
      P ? -0.67 : -0.33;

    const titles = [
      'Books',
      'Films',
      'Other items'
    ];

    const colors = [
      GREEN,
      CYAN,
      PURPLE
    ];

    const icons = [
      bookCard(
        'Trail',
        xs[0], y,
        0.82, 1.06
      ),

      filmIcon(xs[1], y),

      itemIcon(xs[2], y)
    ];

    for (let k = 0; k < 3; k++) {
      const x = xs[k];

      parts.push(
        arrow(
          pos(
            CX +
              (k - 1) * 0.65,

            profileY - 0.31
          ),

          pos(
            x,
            y + 0.82
          ),

          colors[k], 2.2, 0.14
        ),

        outline(
          x, y,
          1.82,
          P ? 2.03 : 1.60,
          colors[k], 0.40
        ),

        icons[k],

        at(
          titles[k],
          P ? 19 : 16,
          colors[k],
          x,

          y -
            (P ? 0.76 : 0.60),

          false, 1.66
        )
      );
    }

    parts.push(
      note(
        'Match item content to a person’s known interests',
        GREEN,
        P ? -3.21 : -2.10
      )
    );

    return new M.VGroup(...parts);
  }

  const applications =
    applicationPicture();

  await until(S(49));
  setStage(1.2, 1.3, 1.55);

  await play(
    ...scene(applications),

    ...fbox([
      ['Content-based recommendations', GREEN],
      'Books: topics',
      'Films: genres or themes',
      'Other items: known features'
    ], GREEN),

    ...say('RECOMMEND ITEMS WITH MATCHING CONTENT', GREEN)
  );

  // ------------------------------------------------------------
  // 50–51: limitations.
  //
  // Ana's interest profile is incomplete.
  // Her highest-rated book supplies only two topics.
  //
  // Castle's similarity of zero does not mean Ana
  // would necessarily dislike Castle.
  //
  // Repeatedly selecting the same topics can prevent
  // discovery of unfamiliar interests.
  // ------------------------------------------------------------

  function explorationPicture() {
    const parts = [];

    const y =
      P ? -0.59 : -0.34;

    const leftX =
      CX - 1.73;

    const rightX =
      CX + 1.73;

    const panelW =
      3.12;

    const panelH =
      P ? 3.78 : 2.90;

    parts.push(
      outline(
        leftX, y,
        panelW, panelH,
        GREEN, 0.46
      ),

      outline(
        rightX, y,
        panelW, panelH,
        PURPLE, 0.35
      ),

      at(
        'KNOWN INTERESTS',
        P ? 18 : 16,
        GREEN,
        leftX,

        y +
          panelH / 2 -
          0.29,

        true, panelW - 0.17
      ),

      at(
        'UNEXPLORED TOPICS',
        P ? 18 : 16,
        PURPLE,
        rightX,

        y +
          panelH / 2 -
          0.29,

        false, panelW - 0.17
      )
    );

    const topicY =
      y +
      (P ? 0.65 : 0.40);

    parts.push(
      topicList(
        FAVOURITE_TOPICS,
        leftX,
        topicY,
        2.10,
        P ? 0.70 : 0.54
      ),

      topicList(
        TOPICS.Castle,
        rightX,
        topicY,
        2.10,
        P ? 0.70 : 0.54
      )
    );

    const bookY =
      y -
      (P ? 0.81 : 0.66);

    parts.push(
      bookCard(
        'River',
        leftX - 0.61,
        bookY,
        0.91,
        P ? 1.13 : 0.91
      ),

      bookCard(
        'Island',
        leftX + 0.61,
        bookY,
        0.91,
        P ? 1.13 : 0.91
      ),

      bookCard(
        'Castle',
        rightX,
        bookY,
        1.07,
        P ? 1.13 : 0.91
      ),

      at(
        'Known topic matches',
        P ? 16 : 14,
        GREEN,
        leftX,

        y -
          panelH / 2 +
          0.23,

        false, panelW - 0.20
      ),

      at(
        'Could Ana enjoy this?',
        P ? 16 : 14,
        PURPLE,
        rightX,

        y -
          panelH / 2 +
          0.23,

        false, panelW - 0.20
      )
    );

    return new M.VGroup(...parts);
  }

  const exploration =
    explorationPicture();

  // ------------------------------------------------------------
  // 50: Ana may enjoy unfamiliar topics too.
  // ------------------------------------------------------------

  await until(S(50));
  setStage(1.12, 1.4, 1.55);

  await play(
    ...scene(exploration),

    ...fbox([
      ['Ana may have other interests', PURPLE],
      'Mystery or History, perhaps',
      'A score of zero only means',
      'no shared topics with Trail'
    ], AMBER),

    ...say('ANA MAY ENJOY NEW TOPICS TOO', AMBER)
  );

  // ------------------------------------------------------------
  // 51: repeatedly recommending similar books can narrow
  // the range of topics Ana discovers.
  // ------------------------------------------------------------

  const loopX =
    CX - 1.73;

  const loopY =
    P ? -0.59 : -0.34;

  const loopFrame = outline(
    loopX,
    loopY,
    3.27,
    P ? 3.94 : 3.06,
    GREEN, 0, 2.6
  );

  const discoveryWarning = tagAt(
    'SIMILAR EVERY TIME?',
    AMBER,
    CX,
    P ? -3.45 : -2.31,
    P ? 19 : 16
  );

  await until(S(51));

  await play(
    ...enter(
      loopFrame,
      discoveryWarning
    ),

    ...fbox([
      ['Limitation', AMBER],
      'Always suggesting similar items',
      'may hide unfamiliar topics',
      ['Similarity is not everything', AMBER]
    ], AMBER),

    ...say('SIMILAR RECOMMENDATIONS CAN LIMIT DISCOVERY', AMBER)
  );

  // ------------------------------------------------------------
  // 52: final summary.
  //
  // Known ratings identify the favourite book.
  // The favourite book supplies a simple interest profile.
  // Jaccard compares candidate topic sets.
  //
  // River 1, Island 0.5, Castle 0.
  // ------------------------------------------------------------

  function finalSummary() {
    const parts = [];

    const profileY =
      P ? 1.04 : 1.11;

    const profileX =
      CX - 0.38;

    parts.push(
      readerIcon(
        'Ana',
        CX - 2.77,
        profileY,
        0.58,
        false
      ),

      at(
        'Ana',
        P ? 17 : 15,
        CYAN,
        CX - 2.77,
        profileY - 0.47
      ),

      arrow(
        pos(
          CX - 2.27,
          profileY
        ),

        pos(
          CX - 1.79,
          profileY
        ),

        CYAN, 2.5, 0.12
      ),

      topicPill(
        'Adventure',
        profileX - 0.39,
        profileY,
        1.65, 0.44
      ),

      topicPill(
        'Nature',
        profileX + 1.37,
        profileY,
        1.65, 0.44
      )
    );

    const top =
      P ? -0.08 : 0.13;

    const pitch =
      P ? 1.28 : 0.82;

    RANKED.forEach((name, k) => {
      const result =
        RESULTS[name];

      const color =
        BOOK_COLORS[name];

      const y =
        top - k * pitch;

      const h =
        P ? 1.06 : 0.69;

      parts.push(
        outline(
          CX, y,
          6.24, h,
          color,
          k === 0 ? 0.63 : 0.34,
          k === 0 ? 2.3 : 1.3
        ),

        circle(
          CX - 2.72,
          y,
          P ? 0.20 : 0.16,
          color,
          0.16, 1.5
        ),

        at(
          k + 1,
          P ? 18 : 15,
          color,
          CX - 2.72,
          y,
          true
        ),

        at(
          name,
          P ? 21 : 18,
          color,
          CX - 1.70,
          y,
          false, 1.32
        )
      );

      const barLeft =
        CX - 0.78;

      const barW =
        2.52;

      const fillW =
        barW * result.score;

      parts.push(
        rect(
          barLeft + barW / 2,
          y + 0.08,
          barW,
          P ? 0.26 : 0.19,
          CARD, 0.76, 0
        )
      );

      if (fillW > 0) {
        parts.push(
          rect(
            barLeft + fillW / 2,
            y + 0.08,
            fillW,
            P ? 0.26 : 0.19,
            color, 0.87, 1
          )
        );
      }

      parts.push(
        at(
          fractionText(name),
          P ? 16 : 14,
          MUTED,
          barLeft + barW / 2,

          y -
            (P ? 0.28 : 0.20),

          true
        ),

        at(
          scoreText(result.score),
          P ? 25 : 21,
          color,
          CX + 2.50,
          y,
          true
        )
      );
    });

    parts.push(
      note(
        'Find similar content, while leaving room for discovery',
        GREEN,
        P ? -4.15 : -2.43
      )
    );

    return new M.VGroup(...parts);
  }

  const finalPicture =
    finalSummary();

  await until(S(52));
  setStage(null);

  await play(
    ...scene(finalPicture),

    ...fbox([
      ['Content-based recommendation', GREEN],
      'Learn what someone likes',
      'Compare candidate content',
      'Recommend stronger matches',
      ['Leave room for discovery', AMBER]
    ], GREEN),

    ...say('USE KNOWN INTERESTS TO FIND SIMILAR CONTENT', GREEN)
  );

  // Leave the final picture visible until narration ends.

  await until(E(52));

  // ------------------------------------------------------------
  // Integration notes.
  //
  // All 53 narration beats, S(0) through S(52), are included.
  //
  // Reader order, book order, chapter colours, topics,
  // ratings, baskets and friendships use the fixed data.
  //
  // Ana's favourite is calculated from her highest known
  // rating, rather than selected from a hard-coded result.
  //
  // This lesson deliberately uses a single favourite book
  // as a simple representation of Ana's interests.
  //
  // The Jaccard intersection and union are calculated using
  // JavaScript Set objects, so duplicate topics cannot inflate
  // either count.
  //
  // Matching source labels move to the same unique topic
  // position. Duplicate objects are removed before counting
  // the distinct-topic total.
  //
  // Calculated similarities:
  //   River:  2/2 = 1
  //   Island: 1/2 = 0.5
  //   Castle: 0/4 = 0
  //
  // Candidate ranking is calculated by sorting the actual
  // Jaccard scores. The book-row objects move into that order.
  //
  // Missing ratings remain null and are displayed as dashes.
  // They are never interpreted as zero-star ratings.
  //
  // Island has zero ratings and zero purchases, calculated
  // from the fixed chapter data. Its recommendation uses
  // known content, not invented reader activity.
  //
  // A score of zero means no matching topics in this simple
  // interest model. It does not establish that Ana dislikes
  // the book or its topics.
  //
  // Browser execution, seek behaviour, animation timing,
  // text metrics and responsive phone/laptop rendering still
  // require verification inside the supplied live engine.
  // ------------------------------------------------------------
}

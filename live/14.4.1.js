// lesson 14.4.1
// Association rules: finding things that appear together
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Fixed chapter 14.4 teaching data.
// Association rule: Trail → River.
//
// Confidence = 3 / 4 = 75%.
// Support = 3 / 8 = 37.5%.
//
// Association describes an observed purchase pattern,
// not evidence that buying one book causes another purchase.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  // ------------------------------------------------------------

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

  // Island is new and has not yet appeared in any basket.

  const ANTECEDENT = 'Trail';
  const CONSEQUENT = 'River';

  const ALL_IDS = BASKETS.map((_, i) => i);

  const TRAIL_IDS = ALL_IDS.filter(i =>
    BASKETS[i].includes(ANTECEDENT)
  );

  const RIVER_IDS = ALL_IDS.filter(i =>
    BASKETS[i].includes(CONSEQUENT)
  );

  const BOTH_IDS = TRAIL_IDS.filter(i =>
    BASKETS[i].includes(CONSEQUENT)
  );

  const OTHER_IDS = ALL_IDS.filter(i =>
    !BASKETS[i].includes(ANTECEDENT)
  );

  const TOTAL = BASKETS.length;
  const TRAIL_COUNT = TRAIL_IDS.length;
  const RIVER_COUNT = RIVER_IDS.length;
  const BOTH_COUNT = BOTH_IDS.length;

  const CONFIDENCE =
    BOTH_COUNT / TRAIL_COUNT;

  const SUPPORT =
    BOTH_COUNT / TOTAL;

  const RIVER_SHARE =
    RIVER_COUNT / TOTAL;

  const pct = v =>
    `${Number((v * 100).toFixed(2))}%`;

  // Checked results:
  // Trail baskets: 1, 2, 3, 4.
  // River baskets: 1, 2, 3, 5.
  // Both books: baskets 1, 2, 3.
  //
  // Confidence: 75%.
  // Support: 37.5%.
  // Overall River share: 50%.

  // ------------------------------------------------------------
  // Shared chapter palette.
  //
  // Reader colours:
  // Ana = cyan, Ben = blue, Cara = orange, Dan = purple.
  //
  // Book colours:
  // Trail = green, River = teal, Clues = amber,
  // Castle = purple, Island = yellow.
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const BLUE = C.blue || '#60A5FA';
  const ORANGE = C.orange || '#FB923C';
  const GREEN = C.green;
  const AMBER = C.amber;
  const TEAL = C.teal || '#2DD4BF';
  const PURPLE = C.violet || '#A78BFA';
  const YELLOW = C.yellow || '#FACC15';
  const PINK = C.pink || '#F472B6';

  const INK = C.ink;
  const MUTED = C.muted;
  const CARD = C.card;

  const BOOK_COLORS = {
    Trail: GREEN,
    River: TEAL,
    Clues: AMBER,
    Castle: PURPLE,
    Island: YELLOW
  };

  const READER_COLORS = {
    Ana: CYAN,
    Ben: BLUE,
    Cara: ORANGE,
    Dan: PURPLE
  };

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone:  8 × 14.22, content y = −5.5 ... 4.3
  // Laptop: 14.22 × 8, content y = −3.0 ... 2.3
  //
  // Same layout conventions as the approved lesson.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.75, 0]
    : [CX, 1.85, 0];

  // Phone: formula box below the picture, picture moved up (whole height used).
  const BOXP = P
    ? [0, -5.15, 0]
    : [4.3, -0.3, 0];

  const MAIN_W = P
    ? FW - 0.9
    : 7.25;

  const PDY = P ? 1.0 : 0;
  const pos = (x, y) => [x, y + PDY, 0];

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

  function rect(
    x, y, w, h, color,
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
        0.13, w / 5, h / 5
      ),
      color,
      strokeWidth
    });

    r.setFill(CARD, opacity);
    r.moveTo(pos(x, y));

    return r;
  }

  function arrow(
    a, b,
    color = CYAN,
    width = 3,
    head = 0.18
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

    // a and b are already placed points: no second pos() shift
    const p1 = [
      b[0] -
        h * Math.cos(theta - Math.PI / 6),

      b[1] -
        h * Math.sin(theta - Math.PI / 6), 0
    ];

    const p2 = [
      b[0] -
        h * Math.cos(theta + Math.PI / 6),

      b[1] -
        h * Math.sin(theta + Math.PI / 6), 0
    ];

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
    y = P ? -4.35 : -2.57
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
  // Only one formula box at a time.
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

      t.moveTo([
        left + indent +
          t.getWidth() / 2,

        top - i * lh, 0
      ]);
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
  // Never wrap already visible objects in a new VGroup.
  // All visible objects are tracked independently.
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
    picture = picture.filter(
      o => !objects.includes(o)
    );

    return objects.map(o =>
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
  // Glowing book cards.
  //
  // Book names are always visible.
  // Colour is never the only identifier.
  // ------------------------------------------------------------

  function bookCard(
    name, x, y,
    w = 1.20,
    h = 1.66
  ) {
    const color =
      BOOK_COLORS[name];

    const halo = outline(
      x, y,
      w + 0.09,
      h + 0.09,
      color, 0.08, 1
    );

    const cover = outline(
      x, y,
      w, h,
      color, 0.88, 2
    );

    cover.setFill(
      color, 0.19
    );

    const spine = rect(
      x - w / 2 + w * 0.075,
      y,
      w * 0.12,
      h * 0.91,
      color, 0.85, 0
    );

    const title = at(
      name,
      P ? 20 : 18,
      color,
      x + w * 0.045,
      y + h * 0.16,
      false,
      w * 0.75
    );

    const pageLine1 = line(
      pos(
        x - w * 0.23,
        y - h * 0.08
      ),

      pos(
        x + w * 0.32,
        y - h * 0.08
      ),

      color, 1.5
    );

    const pageLine2 = line(
      pos(
        x - w * 0.23,
        y - h * 0.18
      ),

      pos(
        x + w * 0.22,
        y - h * 0.18
      ),

      color, 1.2
    );

    const bottom = line(
      pos(
        x - w * 0.30,
        y - h * 0.39
      ),

      pos(
        x + w * 0.40,
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
      bottom
    );
  }

  function bookChip(
    name, x, y,
    w, h,
    active = true
  ) {
    const color =
      BOOK_COLORS[name];

    const glow = outline(
      x, y,
      w + 0.025,
      h + 0.025,
      color,
      0.08,
      1
    );

    const body = outline(
      x, y,
      w, h,
      color,
      0.30,
      1.5
    );

    body.setFill(
      color,
      active ? 0.18 : 0.055
    );

    const spine = rect(
      x - w / 2 + 0.065,
      y,
      0.065,
      h * 0.78,
      color,
      active ? 0.95 : 0.45,
      0
    );

    const label = at(
      name,
      P ? 15 : 14,
      color,
      x + 0.035,
      y,
      false,
      w - 0.16
    );

    return new M.VGroup(
      glow,
      body,
      spine,
      label
    );
  }

  // ------------------------------------------------------------
  // Small bookshop illustration.
  // ------------------------------------------------------------

  function bookshop() {
    const x = CX;
    const y = P ? -0.78 : -0.46;

    const w = P ? 5.95 : 5.70;
    const h = P ? 3.90 : 2.95;

    const parts = [];

    const frame = outline(
      x, y,
      w, h,
      MUTED, 0.75
    );

    parts.push(frame);

    const signY =
      y + h / 2 - 0.37;

    parts.push(
      outline(
        x, signY,
        w * 0.82,
        P ? 0.64 : 0.52,
        CYAN, 0.75
      ),

      at(
        'BOOKSHOP',
        P ? 24 : 21,
        CYAN,
        x, signY,
        true,
        w * 0.72
      )
    );

    const shelfY =
      y - h / 2 + 0.44;

    const bookH =
      P ? 1.68 : 1.38;

    const bookY =
      shelfY + bookH / 2;

    const spacing =
      P ? 1.06 : 1.03;

    BOOKS.forEach((name, i) => {
      parts.push(
        bookCard(
          name,

          x +
            (i - 2) * spacing,

          bookY,

          P ? 0.91 : 0.89,
          bookH
        )
      );
    });

    parts.push(
      line(
        pos(
          x - w / 2 + 0.20,
          shelfY - 0.04
        ),

        pos(
          x + w / 2 - 0.20,
          shelfY - 0.04
        ),

        MUTED, 3
      )
    );

    parts.push(
      at(
        'Help readers discover books',
        P ? 18 : 16,
        INK,
        x,
        P ? -3.44 : -2.40,
        false,
        MAIN_W - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  function readerIcon(
    x, y,
    color = INK
  ) {
    const head = new M.Circle({
      radius: 0.22,
      color
    });

    head.setFill(
      color, 0.92
    );

    head.moveTo(pos(
      x, y + 0.34
    ));

    const body = new M.Arc({
      radius: 0.40,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(
      color, 0.80
    );

    body.moveTo(pos(
      x, y - 0.10
    ));

    return new M.VGroup(
      head, body
    );
  }

  const shop = bookshop();

  // ------------------------------------------------------------
  // 0: imagine owning a small bookshop.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(shop),
    ...say('A SMALL BOOKSHOP')
  );

  // ------------------------------------------------------------
  // 1: help readers find books they may enjoy.
  // ------------------------------------------------------------

  function recommendationQuestion(
    showTrail = false
  ) {
    const y = P ? -0.62 : -0.40;

    const reader = readerIcon(
      CX - 2.39,
      y,
      INK
    );

    const book = bookCard(
      'Trail',
      CX - 0.30,
      y,
      1.25,
      P ? 1.80 : 1.55
    );

    const question = new M.VGroup(
      outline(
        CX + 2.04,
        y,
        1.38,
        P ? 1.80 : 1.55,
        CYAN, 0.45
      ),

      at(
        '?',
        39, CYAN,
        CX + 2.04,
        y
      )
    );

    const a = arrow(
      pos(CX + 0.45, y),
      pos(CX + 1.28, y),
      CYAN, 3
    );

    const text = note(
      showTrail
        ? 'What should we suggest with Trail?'
        : 'Which books might this reader enjoy?',
      GREEN,
      P ? -3.02 : -2.13
    );

    return new M.VGroup(
      reader,
      book,
      a,
      question,
      text
    );
  }

  const recommendIdea =
    recommendationQuestion(false);

  await until(S(1));

  await play(
    ...scene(recommendIdea),

    ...fbox([
      ['Our goal', GREEN],
      'Help readers discover',
      'books they may enjoy'
    ], GREEN),

    ...say('HELP READERS DISCOVER BOOKS', GREEN)
  );

  // ------------------------------------------------------------
  // 2: a reader buys Trail. What else should we suggest?
  // ------------------------------------------------------------

  const recommendTrail =
    recommendationQuestion(true);

  await until(S(2));

  await play(
    ...scene(recommendTrail),

    ...fbox([
      ['Already buying Trail', GREEN],
      'Which other book',
      'should we suggest?',
      ['River? Clues? Castle?', CYAN]
    ]),

    ...say('TRAIL → WHICH OTHER BOOK?', GREEN)
  );

  // ------------------------------------------------------------
  // Shopping basket cards.
  //
  // Every basket has a numbered label, a basket handle,
  // a container, and the exact book names inside it.
  //
  // Basket objects retain their identities during sorting.
  // ------------------------------------------------------------

  function basketLayout(
    x, y, w, h
  ) {
    return {
      x, y, w, h
    };
  }

  const FULL_W =
    P ? 1.48 : 1.53;

  const FULL_H =
    P ? 1.85 : 1.41;

  const FULL_SP =
    P ? 1.66 : 1.69;

  const FULL_TOP =
    P ? 0.25 : 0.47;

  const FULL_ROW_SP =
    P ? 2.35 : 1.75;

  const fullLayouts =
    ALL_IDS.map(i =>
      basketLayout(
        CX +
          (i % 4 - 1.5) *
          FULL_SP,

        FULL_TOP -
          Math.floor(i / 4) *
          FULL_ROW_SP,

        FULL_W,
        FULL_H
      )
    );

  function basketBookY(layout, j) {
    const { y, h } = layout;

    const top =
      y + h * 0.17;

    return top - j * h * 0.215;
  }

  function basketBookH(layout) {
    return layout.h * 0.185;
  }

  function basketBookW(layout) {
    return layout.w * 0.79;
  }

  function basketCard(
    i,
    layout,
    empty = false
  ) {
    const {
      x, y, w, h
    } = layout;

    const parts = [];

    // Small "set aside" baskets: a plain card with the basket number and
    // the book names as words (no handle, no chips, so nothing overlaps).
    if (h < (P ? 1.35 : 1.0)) {
      parts.push(
        outline(x, y, w, h, MUTED, 0.92),

        at(
          `Basket ${i + 1}`,
          P ? 15 : 14,
          INK,
          x,
          y + h * 0.30,
          false,
          w * 0.87
        )
      );

      if (!empty) {
        BASKETS[i].forEach((name, j) => {
          parts.push(
            at(
              name,
              P ? 15 : 14,
              BOOK_COLORS[name],
              x,
              y - 0.02 - j * (P ? 0.32 : 0.24),
              false,
              w * 0.87
            )
          );
        });
      }

      return new M.VGroup(...parts);
    }

    if (P || h >= 1.3) {
      const handle = new M.Arc({
        radius: w * 0.235,
        startAngle: 0,
        angle: Math.PI,
        color: MUTED,
        strokeWidth: 2
      });

      handle.moveTo(pos(
        x,
        y + h / 2 + 0.07
      ));

      parts.push(handle);
    }

    parts.push(
      outline(
        x, y,
        w, h,
        MUTED, 0.92
      )
    );

    parts.push(
      at(
        `Basket ${i + 1}`,
        P ? 15 : 14,
        INK,
        x,
        y + h * 0.385,
        false,
        w * 0.87
      )
    );

    parts.push(
      line(
        pos(
          x - w * 0.42,
          y + h * 0.30
        ),

        pos(
          x + w * 0.42,
          y + h * 0.30
        ),

        MUTED, 1.2
      )
    );

    for (let k = 0; k < 3; k++) {
      const xx =
        x + (k - 1) * w * 0.24;

      parts.push(
        line(
          pos(
            xx,
            y - h * 0.44
          ),

          pos(
            xx,
            y - h * 0.37
          ),

          MUTED, 1.5
        )
      );
    }

    if (!empty) {
      BASKETS[i].forEach(
        (name, j) => {
          parts.push(
            bookChip(
              name,
              x,
              basketBookY(layout, j),
              basketBookW(layout),
              basketBookH(layout)
            )
          );
        }
      );
    }

    return new M.VGroup(...parts);
  }

  function basketOutline(
    layout,
    color = CYAN
  ) {
    return outline(
      layout.x,
      layout.y,
      layout.w + 0.12,
      layout.h + 0.12,
      color, 0, 2.5
    );
  }

  function bookOutline(
    i, name,
    layout,
    color = BOOK_COLORS[name]
  ) {
    const j =
      BASKETS[i].indexOf(name);

    if (j < 0) {
      return basketOutline(
        layout, color
      );
    }

    return outline(
      layout.x,
      basketBookY(layout, j),
      basketBookW(layout) + 0.08,
      basketBookH(layout) + 0.055,
      color, 0, 2.5
    );
  }

  // ------------------------------------------------------------
  // 3: earlier shopping baskets may contain useful patterns.
  // ------------------------------------------------------------

  const sampleBasketLayouts = [
    basketLayout(
      CX - 2.0,
      P ? -0.60 : -0.42,
      1.72,
      P ? 1.98 : 1.54
    ),

    basketLayout(
      CX,
      P ? -0.60 : -0.42,
      1.72,
      P ? 1.98 : 1.54
    ),

    basketLayout(
      CX + 2.0,
      P ? -0.60 : -0.42,
      1.72,
      P ? 1.98 : 1.54
    )
  ];

  const examples = [0, 1, 2].map(
    (i, k) =>
      basketCard(
        i,
        sampleBasketLayouts[k]
      )
  );

  await until(S(3));

  await play(
    ...scene(
      ...examples,

      note(
        'Records of earlier purchases',
        CYAN,
        P ? -3.08 : -2.05
      )
    ),

    ...fbox([
      ['Past purchases', CYAN],
      'Which books did readers',
      'buy together?'
    ]),

    ...say('LOOK AT EARLIER SHOPPING BASKETS')
  );

  // ------------------------------------------------------------
  // 4–5: introduce eight shopping baskets.
  //
  // Initially show empty basket frames, then reveal their
  // recorded contents in narration order.
  // ------------------------------------------------------------

  let basketObjects =
    ALL_IDS.map(i =>
      basketCard(
        i,
        fullLayouts[i],
        true
      )
    );

  let currentLayouts =
    fullLayouts.slice();

  const allBasketNote = note(
    'Eight recorded shopping baskets',
    MUTED
  );

  await until(S(4));

  await play(
    ...scene(),

    ...enterLagged(
      basketObjects,
      0.08,
      1.25
    ),

    ...enter(allBasketNote),

    ...fbox([
      ['Our data', CYAN],
      '8 shopping baskets',
      'From earlier readers'
    ]),

    ...say('EIGHT SHOPPING BASKETS')
  );

  await until(S(5));

  await play(
    ...fbox([
      ['One basket', CYAN],
      'Books bought together',
      'by one reader'
    ]),

    ...say('EACH BASKET RECORDS BOOKS BOUGHT TOGETHER')
  );

  // ------------------------------------------------------------
  // Reveal each basket by replacing its empty card with a
  // complete card at the same coordinates.
  //
  // No visible objects are regrouped.
  // ------------------------------------------------------------

  function revealBasket(i) {
    const old =
      basketObjects[i];

    const next =
      basketCard(
        i,
        currentLayouts[i]
      );

    basketObjects[i] = next;

    return [
      ...leave(old),
      ...enter(next),

      ...focus(
        basketOutline(
          currentLayouts[i],
          CYAN
        )
      )
    ];
  }

  function basketContentsBox(i) {
    return fbox([
      [`Basket ${i + 1}`, INK],

      ...BASKETS[i].map(
        name => [
          name,
          BOOK_COLORS[name]
        ]
      )
    ]);
  }

  // ------------------------------------------------------------
  // 6: Basket 1 contains Trail and River.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...revealBasket(0),

    ...basketContentsBox(0),

    ...say('1: TRAIL AND RIVER', GREEN)
  );

  // ------------------------------------------------------------
  // 7: Basket 2 contains Trail, River and Clues.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...revealBasket(1),

    ...basketContentsBox(1),

    ...say('2: TRAIL, RIVER AND CLUES')
  );

  // ------------------------------------------------------------
  // 8: Basket 3 contains Trail and River.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...revealBasket(2),

    ...basketContentsBox(2),

    ...say('3: TRAIL AND RIVER', GREEN)
  );

  // ------------------------------------------------------------
  // 9: Basket 4 contains Trail and Clues.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...revealBasket(3),

    ...basketContentsBox(3),

    ...say('4: TRAIL AND CLUES')
  );

  // ------------------------------------------------------------
  // 10: Basket 5 contains River and Castle.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...revealBasket(4),

    ...basketContentsBox(4),

    ...say('5: RIVER AND CASTLE', TEAL)
  );

  // ------------------------------------------------------------
  // 11: Basket 6 contains Clues and Castle.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...revealBasket(5),

    ...basketContentsBox(5),

    ...say('6: CLUES AND CASTLE', AMBER)
  );

  // ------------------------------------------------------------
  // 12: Basket 7 contains only Clues.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...revealBasket(6),

    ...basketContentsBox(6),

    ...say('7: CLUES ONLY', AMBER)
  );

  // ------------------------------------------------------------
  // 13: Basket 8 contains only Castle.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...revealBasket(7),

    ...basketContentsBox(7),

    ...say('8: CASTLE ONLY', PURPLE)
  );

  // ------------------------------------------------------------
  // 14: these eight baskets are our data.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...clearFocus(),

    ...fbox([
      ['Data = recorded information', CYAN],
      '8 shopping baskets',
      'Which books were bought',
      'together in each basket?'
    ]),

    ...say('THE EIGHT BASKETS ARE OUR DATA')
  );

  // ------------------------------------------------------------
  // 15–16: a new reader puts Trail in their basket.
  //
  // The new basket is a question, not an additional
  // observation in the eight historical baskets.
  // ------------------------------------------------------------

  function newReaderPicture() {
    const y = P ? -0.57 : -0.38;

    const reader = readerIcon(
      CX - 2.18,
      y + 0.10,
      INK
    );

    const x =
      CX + 0.25;

    const w = 2.04;
    const h = P ? 2.20 : 1.75;

    const handle = new M.Arc({
      radius: 0.44,
      startAngle: 0,
      angle: Math.PI,
      color: MUTED,
      strokeWidth: 2
    });

    handle.moveTo(pos(
      x, y + h / 2 + 0.07
    ));

    const basket = outline(
      x, y, w, h,
      MUTED, 0.92
    );

    const title = at(
      'New basket',
      P ? 18 : 16,
      INK,
      x, y + h * 0.35
    );

    const trail = bookChip(
      'Trail',
      x, y + 0.10,
      1.54, 0.44
    );

    const unknown = new M.VGroup(
      outline(
        x,
        y - 0.49,
        1.54, 0.40,
        CYAN, 0.16
      ),

      at(
        'Another book?',
        P ? 15 : 14,
        CYAN,
        x,
        y - 0.49,
        false, 1.42
      )
    );

    const a = arrow(
      pos(CX - 1.58, y),
      pos(CX - 0.85, y),
      GREEN, 2.7
    );

    return {
      group: new M.VGroup(
        reader,
        handle,
        basket,
        title,
        trail,
        unknown,
        a
      ),

      trail
    };
  }

  // Keep the historical basket objects separately so they
  // can return for the filtering demonstration.

  const historicalBaskets =
    basketObjects.slice();

  const newReader =
    newReaderPicture();

  await until(S(15));

  await play(
    ...scene(
      newReader.group,

      note(
        'A new reader, not part of the recorded data',
        MUTED
      )
    ),

    ...fbox([
      ['New reader', INK],
      ['Trail is in the basket', GREEN],
      'What else might they buy?'
    ]),

    ...say('THE NEW READER CHOOSES TRAIL', GREEN)
  );

  const riverSuggestion = bookCard(
    'River',
    CX + 2.55,
    P ? -0.57 : -0.38,
    1.06,
    P ? 1.50 : 1.28
  );

  await until(S(16));

  await play(
    ...enter(riverSuggestion),

    ...fbox([
      ['Our question', TEAL],
      'Among readers buying Trail,',
      'how often do they',
      'also buy River?'
    ], TEAL),

    ...say('HOW OFTEN DOES RIVER FOLLOW TRAIL?', TEAL)
  );

  // ------------------------------------------------------------
  // 17–19: find every basket containing Trail.
  // ------------------------------------------------------------

  basketObjects =
    historicalBaskets.slice();

  currentLayouts =
    fullLayouts.slice();

  const findTrailNote = note(
    'First select baskets containing Trail',
    GREEN
  );

  await until(S(17));

  await play(
    ...scene(
      ...basketObjects,
      findTrailNote
    ),

    ...fbox([
      ['Step 1', GREEN],
      'Find every basket',
      'containing Trail'
    ], GREEN),

    ...say('FIND ALL TRAIL BASKETS', GREEN)
  );

  const trailMarks =
    TRAIL_IDS.map(i =>
      bookOutline(
        i,
        'Trail',
        currentLayouts[i],
        GREEN
      )
    );

  await until(S(18));

  await play(
    ...enter(trailMarks[0]),

    ...fbox([
      ['Basket 1', INK],
      ['Contains Trail', GREEN]
    ], GREEN),

    ...say('BASKET 1 CONTAINS TRAIL', GREEN)
  );

  await until(S(19));

  await play(
    ...enterLagged(
      trailMarks.slice(1),
      0.13,
      0.85
    ),

    ...fbox([
      ['Trail appears in', GREEN],
      'Baskets 1, 2, 3 and 4',
      ['4 baskets in total', GREEN]
    ], GREEN),

    ...say('TRAIL IS IN BASKETS 1, 2, 3 AND 4', GREEN)
  );

  // ------------------------------------------------------------
  // Filtered basket layout.
  //
  // Phone: four selected baskets in a large 2 × 2 arrangement;
  // remaining baskets occupy a smaller row below.
  //
  // Laptop: same arrangement, using the approved left-side
  // illustration area and right-side formula box.
  // ------------------------------------------------------------

  const selectedLayouts = [
    basketLayout(
      CX - 1.35,
      P ? 0.35 : 0.60,
      P ? 2.15 : 2.12,
      P ? 1.68 : 1.26
    ),

    basketLayout(
      CX + 1.35,
      P ? 0.35 : 0.60,
      P ? 2.15 : 2.12,
      P ? 1.68 : 1.26
    ),

    basketLayout(
      CX - 1.35,
      P ? -1.58 : -0.78,
      P ? 2.15 : 2.12,
      P ? 1.68 : 1.26
    ),

    basketLayout(
      CX + 1.35,
      P ? -1.58 : -0.78,
      P ? 2.15 : 2.12,
      P ? 1.68 : 1.26
    )
  ];

  const sideLayouts =
    OTHER_IDS.map((_, k) =>
      basketLayout(
        CX + (k - 1.5) *
          (P ? 1.59 : 1.60),

        P ? -3.78 : -2.35,

        P ? 1.42 : 1.43,

        P ? 1.28 : 0.95
      )
    );

  const FILTERED_LAYOUTS =
    ALL_IDS.map(i => {
      const selected =
        TRAIL_IDS.indexOf(i);

      if (selected >= 0) {
        return selectedLayouts[selected];
      }

      return sideLayouts[
        OTHER_IDS.indexOf(i)
      ];
    });

  function rearrangeBaskets(
    layouts,
    runTime = 1.1
  ) {
    // Cross-fade each basket to its new place (a Transform of these nested
    // groups left labels and handles behind).
    const animations = [];

    basketObjects =
      basketObjects.map(
        (obj, i) => {
          const next = basketCard(
            i,
            layouts[i]
          );

          animations.push(
            ...leave(obj),
            ...enter(next)
          );

          return next;
        }
      );

    currentLayouts =
      layouts.slice();

    return animations;
  }

  // ------------------------------------------------------------
  // 20: move the four Trail baskets to the centre.
  // ------------------------------------------------------------

  const selectedTitle = at(
    'CONTAINS TRAIL',
    P ? 18 : 16,
    GREEN,
    CX,
    P ? 1.54 : 1.44,
    true
  );

  await until(S(20));

  await play(
    ...leave(
      ...trailMarks,
      findTrailNote
    ),

    ...rearrangeBaskets(
      FILTERED_LAYOUTS,
      1.2
    ),

    ...enter(selectedTitle),

    ...fbox([
      ['Selected baskets', GREEN],
      '1, 2, 3 and 4',
      ['Trail count = 4', GREEN]
    ], GREEN),

    ...say('KEEP THE FOUR TRAIL BASKETS', GREEN)
  );

  // ------------------------------------------------------------
  // 21: set aside baskets without Trail.
  // ------------------------------------------------------------

  const excludedTitle = at(
    'WITHOUT TRAIL — SET ASIDE',
    P ? 16 : 13,
    MUTED,
    CX,
    P ? -2.95 : -1.62,
    true,
    MAIN_W - 0.30
  );

  const excludedFrame = outline(
    CX,
    P ? -3.78 : -2.35,

    P ? 6.35 : 6.43,

    P ? 1.46 : 1.08,

    MUTED, 0, 1.2
  );

  await until(S(21));

  await play(
    ...enter(
      excludedTitle,
      excludedFrame
    ),

    ...fbox([
      ['No Trail', MUTED],
      'Baskets 5, 6, 7 and 8',
      'Set them aside for now',
      ['We divide by 4', GREEN]
    ], GREEN),

    ...say('OTHER BASKETS ARE SET ASIDE', MUTED)
  );

  // ------------------------------------------------------------
  // 22: now look for River only among the four Trail baskets.
  //
  // Basket 5 also contains River, but it is not counted in
  // the confidence numerator because it contains no Trail.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...fbox([
      ['Step 2', TEAL],
      'Inside the Trail baskets,',
      'look for River',
      ['Only baskets 1–4', GREEN]
    ], TEAL),

    ...say('NOW FIND RIVER INSIDE THESE FOUR', TEAL)
  );

  const riverMarks =
    BOTH_IDS.map(i =>
      bookOutline(
        i,
        'River',
        currentLayouts[i],
        TEAL
      )
    );

  function resultMarker(
    i,
    matched
  ) {
    const layout =
      currentLayouts[i];

    const color =
      matched ? TEAL : AMBER;

    const text =
      matched ? '✓' : '×';

    const x =
      layout.x +
      layout.w / 2 - 0.13;

    const y =
      layout.y +
      layout.h / 2 - 0.13;

    const circle =
      new M.Circle({
        radius: P ? 0.19 : 0.15,
        color,
        strokeWidth: 2
      });

    circle.setFill(
      CARD, 0.97
    );

    circle.moveTo(pos(x, y));

    const label = at(
      text,
      P ? 20 : 17,
      color,
      x, y
    );

    return new M.VGroup(
      circle, label
    );
  }

  const matchedMarkers =
    BOTH_IDS.map(i =>
      resultMarker(i, true)
    );

  // ------------------------------------------------------------
  // 23: Basket 1 contains River.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...enter(
      riverMarks[0],
      matchedMarkers[0]
    ),

    ...fbox([
      ['Basket 1', INK],
      ['Trail', GREEN],
      ['River: yes', TEAL],
      'Matches so far: 1'
    ], TEAL),

    ...say('BASKET 1: RIVER YES', TEAL)
  );

  // ------------------------------------------------------------
  // 24: Basket 2 contains River.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...enter(
      riverMarks[1],
      matchedMarkers[1]
    ),

    ...fbox([
      ['Basket 2', INK],
      ['Trail', GREEN],
      ['River: yes', TEAL],
      'Matches so far: 2'
    ], TEAL),

    ...say('BASKET 2: RIVER YES', TEAL)
  );

  // ------------------------------------------------------------
  // 25: Basket 3 contains River.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...enter(
      riverMarks[2],
      matchedMarkers[2]
    ),

    ...fbox([
      ['Basket 3', INK],
      ['Trail', GREEN],
      ['River: yes', TEAL],
      'Matches so far: 3'
    ], TEAL),

    ...say('BASKET 3: RIVER YES', TEAL)
  );

  // ------------------------------------------------------------
  // 26: Basket 4 contains Trail but no River.
  // ------------------------------------------------------------

  const noRiverMarker =
    resultMarker(3, false);

  const noRiverFrame =
    basketOutline(
      currentLayouts[3],
      AMBER
    );

  await until(S(26));

  await play(
    ...enter(
      noRiverMarker,
      noRiverFrame
    ),

    ...fbox([
      ['Basket 4', INK],
      ['Trail: yes', GREEN],
      ['River: no', AMBER],
      'Still only 3 matches'
    ], AMBER),

    ...say('BASKET 4: NO RIVER', AMBER)
  );

  // ------------------------------------------------------------
  // 27: three out of four Trail baskets contain River.
  // ------------------------------------------------------------

  const threeOfFour = tagAt(
    '3 OUT OF 4',
    TEAL,
    CX,
    P ? 1.54 : 1.44,
    P ? 20 : 15
  );

  await until(S(27));

  await play(
    ...leave(selectedTitle),
    ...enter(threeOfFour),

    ...fbox([
      ['Contains Trail: 4', GREEN],
      ['Contains both: 3', TEAL],
      ['3 out of 4', INK]
    ], TEAL),

    ...say('3 OF 4 TRAIL BASKETS CONTAIN RIVER', TEAL)
  );

  // ------------------------------------------------------------
  // Association-rule picture.
  //
  // The arrow indicates the direction of the conditional
  // question. It does not represent purchase order or cause.
  // ------------------------------------------------------------

  function rulePicture(
    withArrow = true,
    captionText = null
  ) {
    const y = P ? -0.48 : -0.32;

    const left =
      CX - 1.80;

    const right =
      CX + 1.80;

    const trail = bookCard(
      'Trail',
      left, y,
      P ? 1.65 : 1.54,
      P ? 2.28 : 1.90
    );

    const river = bookCard(
      'River',
      right, y,
      P ? 1.65 : 1.54,
      P ? 2.28 : 1.90
    );

    const a = arrow(
      pos(
        left + 0.94,
        y
      ),

      pos(
        right - 0.94,
        y
      ),

      CYAN, 4, 0.23
    );

    const leftLabel = at(
      'Already in basket',
      P ? 16 : 14,
      GREEN,
      left,
      y - (P ? 1.43 : 1.15),
      false, 2.58
    );

    const rightLabel = at(
      'Also in basket?',
      P ? 16 : 14,
      TEAL,
      right,
      y - (P ? 1.43 : 1.15),
      false, 2.58
    );

    const parts = [
      trail,
      river,
      leftLabel,
      rightLabel
    ];

    if (captionText) {
      parts.push(
        note(
          captionText,
          CYAN,
          P ? -3.54 : -2.26
        )
      );
    }

    const group =
      new M.VGroup(...parts);

    return {
      group,
      arrow: a,
      trail,
      river,

      objects:
        withArrow
          ? [group, a]
          : [group]
    };
  }

  // ------------------------------------------------------------
  // 28: if someone buys Trail, they often also buy River.
  // ------------------------------------------------------------

  const associationPicture =
    rulePicture(
      false,
      'Often bought together'
    );

  const associationLink = line(
    pos(
      CX - 0.88,
      P ? -0.48 : -0.32
    ),

    pos(
      CX + 0.88,
      P ? -0.48 : -0.32
    ),

    TEAL, 4
  );

  await until(S(28));

  await play(
    ...scene(
      associationPicture.group,
      associationLink
    ),

    ...fbox([
      ['Our observed pattern', CYAN],
      ['If Trail is bought,', GREEN],
      ['River is often bought too', TEAL],
      '3 of 4 Trail baskets'
    ]),

    ...say('TRAIL AND RIVER OFTEN APPEAR TOGETHER')
  );

  // ------------------------------------------------------------
  // 29: name the association rule.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...fbox([
      ['Association rule', CYAN],
      'An observed pattern',
      'of items appearing together'
    ]),

    ...say('ASSOCIATION RULE')
  );

  // ------------------------------------------------------------
  // 30: association means things appear together.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    new M.Indicate(
      associationPicture.trail,
      { color: GREEN }
    ),

    new M.Indicate(
      associationPicture.river,
      { color: TEAL }
    ),

    ...fbox([
      ['Association', CYAN],
      'Things tend to appear',
      'together in the data',
      'Not necessarily a cause'
    ]),

    ...say('ASSOCIATION = APPEARING TOGETHER')
  );

  // ------------------------------------------------------------
  // 31: draw the directed rule Trail → River.
  // ------------------------------------------------------------

  const ruleArrow =
    associationPicture.arrow;

  await until(S(31));

  await play(
    ...leave(associationLink),

    ...enter(ruleArrow),

    ...fbox([
      ['Association rule', CYAN],
      ['Trail → River', TEAL],
      'Start with Trail',
      'Check for River'
    ], TEAL),

    ...say('TRAIL → RIVER', TEAL)
  );

  // ------------------------------------------------------------
  // 32: explain the direction of the arrow.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    new M.Indicate(
      ruleArrow,
      { color: CYAN }
    ),

    ...fbox([
      ['Read the arrow', CYAN],
      ['Given Trail', GREEN],
      ['How often also River?', TEAL],
      'Not a time-order claim'
    ]),

    ...say('START WITH TRAIL, CHECK FOR RIVER')
  );

  // ------------------------------------------------------------
  // Equal-part bars.
  //
  // Confidence denominator: the four Trail baskets.
  // Support denominator: all eight baskets.
  //
  // Every segment has exactly the same width.
  // All segments retain their basket numbers.
  // ------------------------------------------------------------

  const BAR_W =
    P ? 6.35 : 6.20;

  const BAR_LEFT =
    CX - BAR_W / 2;

  const BAR_Y =
    P ? -0.55 : -0.45;

  const BAR_H =
    P ? 1.08 : 0.84;

  function segmentX(k, count) {
    return BAR_LEFT +
      (k + 0.5) *
      BAR_W / count;
  }

  function barSegment(
    id, k, count,
    filled = false
  ) {
    const step =
      BAR_W / count;

    const w =
      step - 0.055;

    const x =
      segmentX(k, count);

    const color =
      filled ? TEAL : MUTED;

    const glow = outline(
      x, BAR_Y,
      w + 0.028,
      BAR_H + 0.05,
      color, 0, 1
    );

    const body = outline(
      x, BAR_Y,
      w, BAR_H,
      color,
      0.80,
      1.8
    );

    body.setFill(
      filled ? TEAL : CARD,
      filled ? 0.82 : 0.75
    );

    const symbol = at(
      filled ? '✓' : '·',
      P ? 25 : 21,
      filled ? INK : MUTED,
      x,
      BAR_Y + 0.06,
      false,
      w - 0.10
    );

    const basketLabel = at(
      String(id + 1),
      P ? 18 : 16,
      INK,
      x,
      BAR_Y -
        BAR_H / 2 - 0.31,
      true,
      w - 0.07
    );

    return new M.VGroup(
      glow,
      body,
      symbol,
      basketLabel
    );
  }

  function barTitle(text) {
    return at(
      text,
      P ? 21 : 18,
      INK,
      CX,
      P ? 1.25 : 1.12,
      false,
      MAIN_W - 0.30
    );
  }

  function barRuleLabel() {
    return new M.VGroup(
      at(
        'Trail',
        P ? 21 : 19,
        GREEN,
        CX - 1.12,
        P ? 0.63 : 0.57
      ),

      arrow(
        pos(
          CX - 0.52,
          P ? 0.63 : 0.57
        ),

        pos(
          CX + 0.52,
          P ? 0.63 : 0.57
        ),

        CYAN, 2.8, 0.15
      ),

      at(
        'River',
        P ? 21 : 19,
        TEAL,
        CX + 1.12,
        P ? 0.63 : 0.57
      )
    );
  }

  function bracket(
    left, right,
    y, label,
    color = CYAN
  ) {
    return new M.VGroup(
      line(
        pos(left, y),
        pos(right, y),
        color, 2
      ),

      line(
        pos(left, y - 0.09),
        pos(left, y + 0.09),
        color, 2
      ),

      line(
        pos(right, y - 0.09),
        pos(right, y + 0.09),
        color, 2
      ),

      at(
        label,
        P ? 18 : 16,
        color,
        (left + right) / 2,
        y - 0.26,
        false,
        Math.max(
          1.00,
          right - left + 0.15
        )
      )
    );
  }

  function largePercentage(
    text,
    color = TEAL
  ) {
    return at(
      text,
      P ? 38 : 31,
      color,
      CX,
      P ? -3.27 : -2.38,
      true,
      MAIN_W - 0.40
    );
  }

  let confidenceSegments =
    TRAIL_IDS.map((id, k) =>
      barSegment(
        id, k,
        TRAIL_COUNT,
        false
      )
    );

  const confidenceTitle =
    barTitle('Only baskets containing Trail');

  const confidenceRule =
    barRuleLabel();

  const confidenceDenominator =
    bracket(
      BAR_LEFT,
      BAR_LEFT + BAR_W,
      P ? -1.82 : -1.53,
      '4 Trail baskets',
      GREEN
    );

  // ------------------------------------------------------------
  // 33: draw four equal parts, one for each Trail basket.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(
      confidenceTitle,
      confidenceRule,
      confidenceDenominator
    ),

    ...enterLagged(
      confidenceSegments,
      0.15,
      1.1
    ),

    ...fbox([
      ['One part per basket', GREEN],
      'Baskets containing Trail',
      ['Count = 4', GREEN]
    ], GREEN),

    ...say('FOUR EQUAL PARTS FOR FOUR TRAIL BASKETS', GREEN)
  );

  // ------------------------------------------------------------
  // 34: colour three parts because three also contain River.
  // ------------------------------------------------------------

  function fillSegments(
    segments,
    ids,
    matchedIds,
    runTime = 1.1
  ) {
    const animations = [];

    ids.forEach((id, k) => {
      if (
        !matchedIds.includes(id)
      ) {
        return;
      }

      animations.push(
        new M.Transform(
          segments[k],

          barSegment(
            id,
            k,
            ids.length,
            true
          )
        )
      );
    });

    if (!animations.length) {
      return [];
    }

    return [
      new M.LaggedStart(
        animations,
        {
          lagRatio: 0.18,
          runTime
        }
      )
    ];
  }

  const confidenceFilledOutline =
    outline(
      BAR_LEFT +
        BAR_W * CONFIDENCE / 2,

      BAR_Y,

      BAR_W * CONFIDENCE + 0.02,

      BAR_H + 0.14,

      TEAL, 0, 2.5
    );

  await until(S(34));

  await play(
    ...fillSegments(
      confidenceSegments,
      TRAIL_IDS,
      BOTH_IDS
    ),

    ...enter(confidenceFilledOutline),

    ...fbox([
      ['Trail and River', TEAL],
      'Baskets 1, 2 and 3',
      ['3 of the 4 parts', TEAL]
    ], TEAL),

    ...say('COLOUR THE THREE MATCHING PARTS', TEAL)
  );

  // ------------------------------------------------------------
  // 35: three out of four is seventy-five percent.
  // ------------------------------------------------------------

  const confidencePct =
    largePercentage(
      pct(CONFIDENCE),
      TEAL
    );

  await until(S(35));

  await play(
    ...enter(confidencePct),

    ...fbox([
      ['3 ÷ 4', INK],
      '= 0.75',
      ['= 75%', TEAL]
    ], TEAL),

    ...say('3 OUT OF 4 = 75%', TEAL)
  );

  // ------------------------------------------------------------
  // 36: call this number confidence.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    new M.Indicate(
      confidencePct,
      { color: TEAL }
    ),

    ...fbox([
      ['Confidence', TEAL],
      '3 ÷ 4',
      ['= 75%', TEAL]
    ], TEAL),

    ...say('CONFIDENCE = 75%', TEAL)
  );

  // ------------------------------------------------------------
  // 37: confidence answers the conditional question.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...fbox([
      ['Confidence asks:', TEAL],
      ['Given Trail,', GREEN],
      ['how often also River?', TEAL],
      ['Answer: 75%', TEAL]
    ], TEAL),

    ...say('HOW OFTEN RIVER APPEARS GIVEN TRAIL', TEAL)
  );

  // ------------------------------------------------------------
  // 38: introduce the different support question.
  //
  // The numerator remains three.
  // The denominator changes from four to eight.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...fbox([
      ['Another question', AMBER],
      'How common is this pair',
      'across ALL baskets?',
      ['All baskets = 8', AMBER]
    ], AMBER),

    ...say('WHAT ABOUT ALL EIGHT BASKETS?', AMBER)
  );

  // ------------------------------------------------------------
  // 39: bring the other four baskets back.
  //
  // Start in the filtered arrangement, then restore the
  // original full arrangement with the same objects.
  // ------------------------------------------------------------

  basketObjects =
    ALL_IDS.map(i =>
      basketCard(
        i,
        FILTERED_LAYOUTS[i]
      )
    );

  currentLayouts =
    FILTERED_LAYOUTS.slice();

  const restoreNote = note(
    'All eight baskets count again',
    AMBER
  );

  await until(S(39));

  await play(
    ...scene(
      ...basketObjects,
      restoreNote
    ),

    ...fbox([
      ['Include every basket', AMBER],
      'Bring back baskets 5–8',
      ['Total count = 8', AMBER]
    ], AMBER),

    ...say('BRING ALL EIGHT BASKETS BACK', AMBER)
  );

  await play(
    ...rearrangeBaskets(
      fullLayouts,
      0.85
    )
  );

  // ------------------------------------------------------------
  // 40: only three of all eight baskets contain both books.
  // ------------------------------------------------------------

  const bothBasketFrames =
    BOTH_IDS.map(i =>
      basketOutline(
        currentLayouts[i],
        TEAL
      )
    );

  const bothTrailFrames =
    BOTH_IDS.map(i =>
      bookOutline(
        i,
        'Trail',
        currentLayouts[i],
        GREEN
      )
    );

  const bothRiverFrames =
    BOTH_IDS.map(i =>
      bookOutline(
        i,
        'River',
        currentLayouts[i],
        TEAL
      )
    );

  await until(S(40));

  await play(
    ...enter(
      ...bothBasketFrames,
      ...bothTrailFrames,
      ...bothRiverFrames
    ),

    ...fbox([
      ['Contains both books', TEAL],
      'Baskets 1, 2 and 3',
      ['Both count = 3', TEAL],
      ['All baskets = 8', AMBER]
    ], TEAL),

    ...say('ONLY 3 OF ALL 8 CONTAIN BOTH', TEAL)
  );

  // ------------------------------------------------------------
  // 41: draw eight equal parts and fill the three matches.
  // ------------------------------------------------------------

  const supportTitle =
    barTitle('All eight shopping baskets');

  const supportRule =
    barRuleLabel();

  const supportSegments =
    ALL_IDS.map((id, k) =>
      barSegment(
        id, k,
        TOTAL,
        BOTH_IDS.includes(id)
      )
    );

  const supportDenominator =
    bracket(
      BAR_LEFT,
      BAR_LEFT + BAR_W,
      P ? -1.82 : -1.53,
      '8 baskets in total',
      AMBER
    );

  const supportFilledOutline =
    outline(
      BAR_LEFT +
        BAR_W * SUPPORT / 2,

      BAR_Y,

      BAR_W * SUPPORT + 0.02,

      BAR_H + 0.14,

      TEAL, 0, 2.5
    );

  await until(S(41));

  await play(
    ...scene(
      supportTitle,
      supportRule,
      supportDenominator
    ),

    ...enterLagged(
      supportSegments,
      0.09,
      1.2
    ),

    ...enter(supportFilledOutline),

    ...fbox([
      ['8 equal parts', AMBER],
      'One for each basket',
      ['3 contain both books', TEAL]
    ], TEAL),

    ...say('EIGHT PARTS, THREE COLOURED', TEAL)
  );

  // ------------------------------------------------------------
  // 42: three out of eight is thirty-seven point five percent.
  // ------------------------------------------------------------

  const supportPct =
    largePercentage(
      pct(SUPPORT),
      TEAL
    );

  await until(S(42));

  await play(
    ...enter(supportPct),

    ...fbox([
      ['3 ÷ 8', INK],
      '= 0.375',
      ['= 37.5%', TEAL]
    ], TEAL),

    ...say('3 OUT OF 8 = 37.5%', TEAL)
  );

  // ------------------------------------------------------------
  // 43: call this number support.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    new M.Indicate(
      supportPct,
      { color: TEAL }
    ),

    ...fbox([
      ['Support', TEAL],
      '3 ÷ 8',
      ['= 37.5%', TEAL]
    ], TEAL),

    ...say('SUPPORT = 37.5%', TEAL)
  );

  // ------------------------------------------------------------
  // 44: support measures how common the pair is overall.
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...fbox([
      ['Support asks:', TEAL],
      'Across all baskets,',
      'how many contain both books?',
      ['Answer: 37.5%', TEAL]
    ], TEAL),

    ...say('SUPPORT MEASURES HOW COMMON THE PAIR IS', TEAL)
  );

  // ------------------------------------------------------------
  // Confidence and support comparison.
  //
  // Same numerator, different denominator.
  // The two total bars have identical overall widths.
  //
  // Top: four equal parts, three highlighted.
  // Bottom: eight equal parts, three highlighted.
  // ------------------------------------------------------------

  const COMP_W =
    P ? 5.60 : 5.42;

  const COMP_LEFT =
    CX - COMP_W / 2;

  const COMP_Y = P
    ? [0.32, -2.13]
    : [0.72, -1.12];

  const COMP_H =
    P ? 0.73 : 0.55;

  function comparisonRow(
    ids,
    y,
    label,
    denominatorText,
    denominatorColor
  ) {
    const count = ids.length;

    const parts = [];

    const step =
      COMP_W / count;

    parts.push(
      at(
        label,
        P ? 21 : 18,
        INK,
        CX,
        y + 0.64,
        false,
        MAIN_W - 0.35
      )
    );

    ids.forEach((id, k) => {
      const x =
        COMP_LEFT +
        (k + 0.5) * step;

      const matched =
        BOTH_IDS.includes(id);

      const r = outline(
        x, y,
        step - 0.045,
        COMP_H,

        matched
          ? TEAL
          : MUTED,

        0.75, 1.5
      );

      r.setFill(
        matched
          ? TEAL
          : CARD,

        matched
          ? 0.80
          : 0.75
      );

      parts.push(
        r,

        at(
          matched ? '✓' : '·',
          P ? 20 : 17,

          matched
            ? INK
            : MUTED,

          x, y,
          false,
          step - 0.10
        ),

        at(
          id + 1,
          P ? 15 : 13,
          MUTED,
          x,
          y - COMP_H / 2 - 0.22,
          true,
          step - 0.07
        )
      );
    });

    parts.push(
      at(
        denominatorText,
        P ? 17 : 15,
        denominatorColor,
        CX,
        y - COMP_H / 2 - (P ? 0.61 : 0.52),
        false,
        MAIN_W - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  const comparisonConfidence =
    comparisonRow(
      TRAIL_IDS,
      COMP_Y[0],
      'Confidence',
      '3 matching baskets out of 4 Trail baskets',
      GREEN
    );

  const comparisonSupport =
    comparisonRow(
      ALL_IDS,
      COMP_Y[1],
      'Support',
      '3 matching baskets out of all 8 baskets',
      AMBER
    );

  function comparisonOutline(
    row,
    color
  ) {
    return outline(
      CX,

      COMP_Y[row] - (P ? 0.14 : 0.08),

      COMP_W + 0.45,

      P ? 2.22 : 1.80,

      color, 0, 2
    );
  }

  // ------------------------------------------------------------
  // 45: introduce the two short formulas.
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...scene(
      comparisonConfidence,
      comparisonSupport
    ),

    ...fbox([
      ['Two different questions', CYAN],
      'Confidence: among Trail',
      'Support: among all baskets',
      ['Same top number: 3', TEAL]
    ]),

    ...say('SAME 3, DIFFERENT TOTALS')
  );

  // ------------------------------------------------------------
  // 46: confidence formula.
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...focus(
      comparisonOutline(
        0, GREEN
      )
    ),

    ...fbox([
      ['Confidence', TEAL],
      '= count containing both',
      ['  ÷ count containing Trail', GREEN]
    ], TEAL),

    ...say('CONFIDENCE = BOTH ÷ TRAIL', GREEN)
  );

  // ------------------------------------------------------------
  // 47: worked confidence calculation.
  // ------------------------------------------------------------

  const comparison75 = tagAt(
    '75%',
    TEAL,
    CX + 2.48,
    COMP_Y[0] + 0.64,
    P ? 17 : 15,
    1.22
  );

  await until(S(47));

  await play(
    ...enter(comparison75),

    ...fbox([
      ['Confidence', TEAL],
      '= 3 ÷ 4',
      '= 0.75',
      ['= 75%', TEAL]
    ], TEAL),

    ...say('CONFIDENCE: 3 ÷ 4 = 75%', TEAL)
  );

  // ------------------------------------------------------------
  // 48: support formula.
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...focus(
      comparisonOutline(
        1, AMBER
      )
    ),

    ...fbox([
      ['Support', TEAL],
      '= count containing both',
      ['  ÷ total basket count', AMBER]
    ], TEAL),

    ...say('SUPPORT = BOTH ÷ ALL BASKETS', AMBER)
  );

  // ------------------------------------------------------------
  // 49: worked support calculation.
  // ------------------------------------------------------------

  const comparison375 = tagAt(
    '37.5%',
    TEAL,
    CX + 2.48,
    COMP_Y[1] + 0.64,
    P ? 17 : 15,
    1.22
  );

  await until(S(49));

  await play(
    ...enter(comparison375),

    ...fbox([
      ['Support', TEAL],
      '= 3 ÷ 8',
      '= 0.375',
      ['= 37.5%', TEAL]
    ], TEAL),

    ...say('SUPPORT: 3 ÷ 8 = 37.5%', TEAL)
  );

  // ------------------------------------------------------------
  // 50: use confidence and support to guide recommendations.
  //
  // The rule is a useful candidate for a recommendation,
  // not proof that River is the best possible recommendation.
  // ------------------------------------------------------------

  function recommendationResult() {
    const parts = [];

    const y =
      P ? 0.05 : 0.15;

    parts.push(
      bookCard(
        'Trail',
        CX - 1.69,
        y,
        1.35,
        P ? 1.82 : 1.45
      ),

      bookCard(
        'River',
        CX + 1.69,
        y,
        1.35,
        P ? 1.82 : 1.45
      ),

      arrow(
        pos(
          CX - 0.87,
          y
        ),

        pos(
          CX + 0.87,
          y
        ),

        TEAL, 3.5
      )
    );

    const cardY =
      P ? -2.02 : -1.48;

    const cardW = 2.87;

    const cardH =
      P ? 1.30 : 1.02;

    const metrics = [
      {
        name: 'Confidence',
        value: pct(CONFIDENCE),
        x: CX - 1.63,
        color: GREEN
      },

      {
        name: 'Support',
        value: pct(SUPPORT),
        x: CX + 1.63,
        color: TEAL
      }
    ];

    metrics.forEach(metric => {
      parts.push(
        outline(
          metric.x,
          cardY,
          cardW,
          cardH,
          metric.color,
          0.73
        ),

        at(
          metric.name,
          P ? 18 : 16,
          metric.color,
          metric.x,
          cardY + 0.28
        ),

        at(
          metric.value,
          P ? 30 : 25,
          metric.color,
          metric.x,
          cardY - 0.18,
          true
        )
      );
    });

    parts.push(
      note(
        'Evidence for a possible recommendation',
        GREEN,
        P ? -3.45 : -2.40
      )
    );

    return new M.VGroup(...parts);
  }

  const recommendation =
    recommendationResult();

  await until(S(50));

  await play(
    ...scene(recommendation),

    ...fbox([
      ['Trail → River', TEAL],
      ['Confidence: 75%', GREEN],
      ['Support: 37.5%', TEAL],
      'A possible recommendation'
    ], GREEN),

    ...say('USE THE PATTERN TO GUIDE RECOMMENDATIONS', GREEN)
  );

  // ------------------------------------------------------------
  // 51: association is not causation.
  // ------------------------------------------------------------

  function causationPicture() {
    const parts = [];

    const y =
      P ? 0.14 : 0.30;

    const w = 2.17;

    parts.push(
      bookCard(
        'Trail',
        CX - 1.78,
        y,
        1.36,
        P ? 1.82 : 1.52
      ),

      bookCard(
        'River',
        CX + 1.78,
        y,
        1.36,
        P ? 1.82 : 1.52
      ),

      arrow(
        pos(CX - 0.96, y),
        pos(CX + 0.96, y),
        TEAL, 3.0
      ),

      at(
        'Observed rule',
        P ? 17 : 15,
        TEAL,
        CX,
        y - 0.43,
        false, w
      )
    );

    const warningY =
      P ? -2.15 : -1.35;

    parts.push(
      outline(
        CX,
        warningY,
        P ? 5.85 : 5.65,
        P ? 1.42 : 1.15,
        AMBER, 0.62
      ),

      at(
        'Association ≠ causation',
        P ? 22 : 19,
        AMBER,
        CX,
        warningY + 0.23,
        false, 5.45
      ),

      at(
        'Bought together does not prove why.',
        P ? 17 : 15,
        INK,
        CX,
        warningY - 0.27,
        false, 5.45
      )
    );

    return new M.VGroup(...parts);
  }

  const caution =
    causationPicture();

  await until(S(51));

  await play(
    ...scene(caution),

    ...fbox([
      ['Be careful', AMBER],
      'Buying Trail does not',
      'necessarily cause someone',
      'to buy River'
    ], AMBER),

    ...say('ASSOCIATION DOES NOT PROVE CAUSATION', AMBER)
  );

  // ------------------------------------------------------------
  // 52: River may already be popular overall.
  //
  // River appears in baskets 1, 2, 3 and 5.
  // Overall River share = 4 / 8 = 50%.
  //
  // Preview this baseline without teaching lift yet.
  // ------------------------------------------------------------

  const popularityBaskets =
    ALL_IDS.map(i =>
      basketCard(
        i,
        fullLayouts[i]
      )
    );

  const popularityHighlights =
    RIVER_IDS.map(i =>
      bookOutline(
        i,
        'River',
        fullLayouts[i],
        TEAL
      )
    );

  const popularityNote =
    tagAt(
      'RIVER APPEARS IN 4 OF 8 BASKETS',
      TEAL,
      CX,
      P ? -4.15 : -2.55,
      P ? 18 : 14
    );

  await until(S(52));

  await play(
    ...scene(
      ...popularityBaskets,
      ...popularityHighlights,
      popularityNote
    ),

    ...fbox([
      ['River overall', TEAL],
      'Baskets 1, 2, 3 and 5',
      ['4 ÷ 8 = 50%', TEAL],
      'Already fairly common'
    ], TEAL),

    ...say('RIVER MAY ALREADY BE POPULAR', TEAL)
  );

  // ------------------------------------------------------------
  // 53: preview the next lesson.
  //
  // Compare conditional popularity against overall popularity.
  // The lift calculation itself is reserved for lesson 14.4.2.
  // ------------------------------------------------------------

  function popularityComparison() {
    const parts = [];

    const left =
      CX - 2.77;

    const w = 5.18;

    const ys = P
      ? [0.24, -1.84]
      : [0.43, -1.12];

    const values = [
      {
        name: 'River among Trail baskets',
        value: CONFIDENCE,
        color: GREEN
      },

      {
        name: 'River among all baskets',
        value: RIVER_SHARE,
        color: TEAL
      }
    ];

    values.forEach((entry, i) => {
      const y = ys[i];

      const filledW =
        w * entry.value;

      parts.push(
        at(
          entry.name,
          P ? 20 : 17,
          entry.color,
          CX,
          y + 0.55,
          false, MAIN_W - 0.40
        ),

        rect(
          left + w / 2,
          y, w,
          P ? 0.44 : 0.34,
          CARD, 0.80, 0
        ),

        rect(
          left + filledW / 2,
          y,
          filledW,
          P ? 0.53 : 0.42,
          entry.color, 0.13, 0
        ),

        rect(
          left + filledW / 2,
          y,
          filledW,
          P ? 0.44 : 0.34,
          entry.color, 0.86, 1
        ),

        at(
          pct(entry.value),
          P ? 24 : 21,
          entry.color,
          left + w + 0.42,
          y, true,
          0.95
        )
      );
    });

    parts.push(
      note(
        'Does Trail make River more common in the basket?',
        CYAN,
        P ? -3.60 : -2.35
      )
    );

    return new M.VGroup(...parts);
  }

  const nextLesson =
    popularityComparison();

  await until(S(53));

  await play(
    ...scene(nextLesson),

    ...fbox([
      ['Next question', CYAN],
      ['Given Trail: 75%', GREEN],
      ['River overall: 50%', TEAL],
      'Compare these two shares'
    ]),

    ...say('NEXT: COMPARE WITH USUAL POPULARITY')
  );

  // ------------------------------------------------------------
  // 54: final visual summary.
  //
  // Confidence:
  // 3 of the 4 baskets containing Trail also contain River.
  //
  // Support:
  // 3 of all 8 baskets contain both Trail and River.
  // ------------------------------------------------------------

  function finalSummary() {
    const parts = [];

    const ruleY =
      P ? 1.27 : 1.27;

    parts.push(
      at(
        'Trail',
        P ? 23 : 20,
        GREEN,
        CX - 1.18,
        ruleY
      ),

      arrow(
        pos(
          CX - 0.57,
          ruleY
        ),

        pos(
          CX + 0.57,
          ruleY
        ),

        CYAN, 3.0
      ),

      at(
        'River',
        P ? 23 : 20,
        TEAL,
        CX + 1.18,
        ruleY
      )
    );

    const rows = [
      {
        name: 'CONFIDENCE',
        ids: TRAIL_IDS,
        numerator: BOTH_COUNT,
        denominator: TRAIL_COUNT,
        value: CONFIDENCE,
        color: GREEN,
        subtitle: 'Among baskets containing Trail'
      },

      {
        name: 'SUPPORT',
        ids: ALL_IDS,
        numerator: BOTH_COUNT,
        denominator: TOTAL,
        value: SUPPORT,
        color: AMBER,
        subtitle: 'Among all shopping baskets'
      }
    ];

    const ys = P
      ? [-0.20, -2.62]
      : [0.17, -1.53];

    const w =
      P ? 6.15 : 6.07;

    const h =
      P ? 1.94 : 1.48;

    rows.forEach((row, k) => {
      const y = ys[k];

      parts.push(
        outline(
          CX, y,
          w, h,
          row.color,
          0.53
        ),

        at(
          row.name,
          P ? 19 : 17,
          row.color,
          CX - 1.50,
          y + h / 2 - 0.27,
          true,
          2.90
        ),

        at(
          `${row.numerator} ÷ ${row.denominator}`,
          P ? 22 : 19,
          INK,
          CX - 1.66,
          y + 0.04,
          true
        ),

        at(
          pct(row.value),
          P ? 30 : 24,
          TEAL,
          CX + 1.55,
          y + h / 2 - 0.36,
          true
        )
      );

      const bw =
        2.70;

      const left =
        CX + 1.55 - bw / 2;

      const count =
        row.ids.length;

      const step =
        bw / count;

      row.ids.forEach((id, j) => {
        const filled =
          BOTH_IDS.includes(id);

        const x =
          left +
          (j + 0.5) * step;

        parts.push(
          rect(
            x,
            y - 0.12,
            step - 0.035,
            P ? 0.34 : 0.26,
            filled ? TEAL : MUTED,
            filled ? 0.88 : 0.17,
            1
          )
        );
      });

      parts.push(
        at(
          row.subtitle,
          P ? 17 : 14,
          row.color,
          CX,
          y - h / 2 + 0.24,
          false, w - 0.30
        )
      );
    });

    if (P) {
      parts.push(
        note(
          'Same matching pair. Different reference groups.',
          INK,
          -4.33
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
      ['Confidence', GREEN],
      'How often the rule holds',
      ['Support', TEAL],
      'How common the pair is',
      ['Trail → River', INK]
    ], TEAL),

    ...say('CONFIDENCE AND SUPPORT', TEAL)
  );

  // Leave the final picture visible until narration ends.

  await until(E(54));

  // Integration notes:
  //
  // All 55 narration beats are included.
  // The eight shopping baskets match the fixed chapter data.
  // Book names and chapter colours are preserved.
  // Island appears only as an available book in the shop,
  // never as a historical purchase.
  //
  // Counts, confidence, support and overall River popularity
  // are calculated directly from BASKETS.
  //
  // Confidence uses the four baskets containing Trail.
  // Support uses all eight baskets.
  // Both use the same three matching baskets.
  //
  // Basket 5 contains River but not Trail, so it contributes
  // neither to the confidence numerator nor its denominator.
  // It does contribute to the overall River popularity count.
  //
  // The new reader's hypothetical basket is not included in
  // any historical count.
  //
  // The association arrow represents a conditional rule,
  // not causation or chronological purchase order.
  //
  // Browser playback, animation timing, seeking, text metrics
  // and phone/laptop rendering still require verification
  // in the actual site/live/engine.js environment.
}

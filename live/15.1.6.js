// lesson 15.1.6
// Contextual bandits: learning which action works for each situation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed chapter data and contextual learning example.
// The accelerated continuation is illustrative and explicitly labelled.
// Browser rendering against the complete engine has not been independently tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Chapter colours and responsive layout
  // ------------------------------------------------------------

  const A = C.cyan;
  const B = C.orange || '#FB923C';
  const GOOD = C.green;
  const BAD = C.muted;
  const CONTEXT = C.violet;
  const DARK = '#17212F';

  const CX = P ? 0 : -2.35;

  const AX = P ? -1.65 : -3.35;
  const BX = P ? 1.65 : -0.55;

  const CARD_W = P ? 2.95 : 2.55;
  const CARD_H = P ? 0.96 : 0.92;
  const CARD_Y = P ? 2.75 : 1.30;

  const CELL_W = P ? 2.95 : 2.55;
  const CELL_H = P ? 1.62 : 1.48;

  const ROW_Y = P
    ? [0.95, -1.22]
    : [-0.12, -1.88];

  const ROW_LABEL_X = P ? 0 : -5.65;

  const PILL = P
    ? [0, 3.78, 0]
    : [0, 2.02, 0];

  const BOXP = P
    ? [0, -3.85, 0]
    : [4.25, -0.55, 0];

  const BOX_W = P
    ? Math.min(FW - 1.1, 6.75)
    : 4.25;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const px = p => p === 'A' ? AX : BX;
  const pc = p => p === 'A' ? A : B;

  const groupName = g => g === 0
    ? 'Studied today'
    : 'Did not study';

  const cellKey = (g, p) => `cell-${g}-${p}`;

  // ------------------------------------------------------------
  // Fixed chapter data
  //
  // These are separate groups of learners.
  // Each learner received exactly one prompt.
  // ------------------------------------------------------------

  const ORIGINAL = [
    {
      A: [1, 1, 1, 1, 0],
      B: [1, 1, 1, 0, 0]
    },
    {
      A: [1, 0, 0, 0, 0],
      B: [1, 1, 1, 1, 0]
    }
  ];

  // True probabilities are for explanatory visuals only.
  // The learning method must never read these probabilities.

  const TRUE_RATES = [
    { A: 0.80, B: 0.60 },
    { A: 0.20, B: 0.80 }
  ];

  // Separate narrated learning example.
  // This starts again with one observation per combination.

  const history = [
    { A: [], B: [] },
    { A: [], B: [] }
  ];

  function total(values) {
    return values.reduce((sum, r) => sum + r, 0);
  }

  function estimate(g, p) {
    const values = history[g][p];

    return values.length
      ? total(values) / values.length
      : null;
  }

  function observe(g, p, reward) {
    history[g][p].push(reward);
  }

  function bestPrompt(g) {
    const a = estimate(g, 'A');
    const b = estimate(g, 'B');

    if (a === null) return 'A';
    if (b === null) return 'B';

    // Resolve an exact tie in favour of A.

    return a >= b ? 'A' : 'B';
  }

  function pct(fraction) {
    return `${Math.round(fraction * 100)}%`;
  }

  // ------------------------------------------------------------
  // Basic drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    maxw = Infinity, mono = false
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function rect(
    x, y, w, h, color,
    fill = C.card,
    opacity = 0.95,
    radius = 0.14,
    strokeWidth = 2
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: radius,
      color,
      strokeWidth
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(
    x, y, radius, color,
    fill = color,
    opacity = 1,
    strokeWidth = 2
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth
    });

    c.setFill(fill, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth
    });
  }

  function dashed(x1, y1, x2, y2, color) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function arrow(
    x1, y1, x2, y2,
    color,
    strokeWidth = 3,
    headSize = 0.15
  ) {
    const angle = Math.atan2(y2 - y1, x2 - x1);

    const a1 = angle + Math.PI - 0.52;
    const a2 = angle + Math.PI + 0.52;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, strokeWidth),
      line(
        x2, y2,
        x2 + headSize * Math.cos(a1),
        y2 + headSize * Math.sin(a1),
        color,
        strokeWidth
      ),
      line(
        x2, y2,
        x2 + headSize * Math.cos(a2),
        y2 + headSize * Math.sin(a2),
        color,
        strokeWidth
      )
    );
  }

  function glow(x, y, radius, color = C.ink) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 1.8,
      color
    });

    halo.setFill(color, 0.13);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    dot.setFill(color, 0.97);

    return new M.VGroup(halo, dot);
  }

  function check(x, y, color, r = 0.12) {
    return new M.VGroup(
      line(
        x - r * 0.72,
        y,
        x - r * 0.18,
        y - r * 0.52,
        color,
        2
      ),
      line(
        x - r * 0.18,
        y - r * 0.52,
        x + r * 0.75,
        y + r * 0.60,
        color,
        2
      )
    );
  }

  function cross(x, y, color, r = 0.12) {
    return new M.VGroup(
      line(
        x - r * 0.56,
        y - r * 0.56,
        x + r * 0.56,
        y + r * 0.56,
        color,
        2
      ),
      line(
        x - r * 0.56,
        y + r * 0.56,
        x + r * 0.56,
        y - r * 0.56,
        color,
        2
      )
    );
  }

  function rewardMark(x, y, reward, radius = 0.15) {
    if (reward === null) {
      return new M.VGroup(
        circle(
          x, y, radius,
          C.muted, DARK, 1
        ),
        txt(
          '?',
          18,
          C.muted,
          x, y,
          radius * 1.6,
          true
        )
      );
    }

    const color = reward === 1 ? GOOD : BAD;

    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 1.3,
      color
    });

    halo.setFill(
      color,
      reward === 1 ? 0.12 : 0.04
    );

    const disk = circle(
      x, y,
      radius,
      color,
      color,
      reward === 1 ? 0.27 : 0.16
    );

    const symbol = reward === 1
      ? check(x, y, color, radius)
      : cross(x, y, color, radius);

    return new M.VGroup(
      halo,
      disk,
      symbol
    );
  }

  // ------------------------------------------------------------
  // On-screen object management
  //
  // Existing objects are never regrouped into new VGroups.
  // Replacement groups are always constructed from new objects.
  // ------------------------------------------------------------

  const slots = new Map();

  function replace(key, obj) {
    const animations = [];
    const old = slots.get(key);

    if (old) {
      animations.push(new M.FadeOut(old));
    }

    if (obj) {
      slots.set(key, obj);
      animations.push(new M.FadeIn(obj));
    } else {
      slots.delete(key);
    }

    return animations;
  }

  function clear(...keys) {
    return keys.flatMap(key => replace(key, null));
  }

  function clearExcept(...keep) {
    const keys = Array.from(slots.keys())
      .filter(key => !keep.includes(key));

    return clear(...keys);
  }

  function quick(animations, duration = 0.22) {
    return new M.LaggedStart(
      animations,
      {
        lagRatio: 0,
        runTime: duration
      }
    );
  }

  // ------------------------------------------------------------
  // Formula / explanation box
  // ------------------------------------------------------------

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20;
    const lh = P ? 0.40 : 0.40;

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

    const wd = Math.min(
      Math.max(...widths) + 0.65,
      BOX_W
    );

    const ht = rows.length * lh + 0.48;

    const bg = rect(
      BOXP[0],
      BOXP[1],
      wd,
      ht,
      color,
      C.card,
      0.96,
      0.18,
      2
    );

    const left = BOXP[0] - wd / 2 + 0.29;

    const top =
      BOXP[1] + ht / 2 - 0.24 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      const available = Math.max(
        0.45,
        wd - 0.58 - indent
      );

      let k = 1;
      if (t.getWidth() > available) {
        k = available / t.getWidth();
        t.scale(k);
      }

      t.moveTo([
        left + indent + t.getWidth() * k / 2,
        top - i * lh,
        0
      ]);
    });

    return replace(
      'box',
      new M.VGroup(bg, ...texts)
    );
  }

  // ------------------------------------------------------------
  // Prompt cards and familiar chapter icons
  // ------------------------------------------------------------

  function quizIcon(x, y, color = A) {
    const paper = rect(
      x, y,
      0.40, 0.45,
      color,
      color,
      0.10,
      0.045,
      2
    );

    const question = txt(
      '?',
      20,
      color,
      x,
      y + 0.025
    );

    const foot = line(
      x - 0.10, y - 0.14,
      x + 0.10, y - 0.14,
      color,
      2
    );

    return new M.VGroup(
      paper,
      question,
      foot
    );
  }

  function reminderIcon(x, y, color = B) {
    const bell = rect(
      x,
      y + 0.025,
      0.34,
      0.34,
      color,
      color,
      0.14,
      0.12,
      2
    );

    const rim = line(
      x - 0.23, y - 0.13,
      x + 0.23, y - 0.13,
      color,
      3
    );

    const clapper = circle(
      x,
      y - 0.205,
      0.042,
      color,
      color,
      1
    );

    return new M.VGroup(
      bell,
      rim,
      clapper,
      line(
        x - 0.27, y + 0.06,
        x - 0.32, y + 0.15,
        color,
        2
      ),
      line(
        x + 0.27, y + 0.06,
        x + 0.32, y + 0.15,
        color,
        2
      )
    );
  }

  function promptCard(p) {
    const x = px(p);
    const color = pc(p);

    const bg = rect(
      x,
      CARD_Y,
      CARD_W,
      CARD_H,
      color,
      color,
      0.075,
      0.16,
      2
    );

    const iconX = x - CARD_W / 2 + 0.37;

    const icon = p === 'A'
      ? quizIcon(iconX, CARD_Y + 0.15, color)
      : reminderIcon(iconX, CARD_Y + 0.15, color);

    const heading = txt(
      `PROMPT ${p}`,
      P ? 22 : 20,
      color,
      x + 0.22,
      CARD_Y + 0.19,
      CARD_W - 0.85,
      true
    );

    const message = p === 'A'
      ? 'Try a quick quiz!'
      : 'Time for more practice!';

    const messageText = txt(
      message,
      P ? 18 : 17,
      C.ink,
      x,
      CARD_Y - 0.25,
      CARD_W - 0.22
    );

    return new M.VGroup(
      bg,
      icon,
      heading,
      messageText
    );
  }

  function promptHeaders() {
    return [
      ...replace('headerA', promptCard('A')),
      ...replace('headerB', promptCard('B'))
    ];
  }

  // ------------------------------------------------------------
  // Intro: two learners with different contexts
  // ------------------------------------------------------------

  function bookIcon(x, y, color) {
    const leftPage = rect(
      x - 0.16,
      y,
      0.29,
      0.40,
      color,
      color,
      0.09,
      0.04,
      1.5
    );

    const rightPage = rect(
      x + 0.16,
      y,
      0.29,
      0.40,
      color,
      color,
      0.09,
      0.04,
      1.5
    );

    return new M.VGroup(
      leftPage,
      rightPage,
      line(
        x - 0.26, y + 0.06,
        x - 0.06, y + 0.06,
        color,
        1.5
      ),
      line(
        x + 0.06, y + 0.06,
        x + 0.26, y + 0.06,
        color,
        1.5
      ),
      line(
        x - 0.26, y - 0.06,
        x - 0.06, y - 0.06,
        color,
        1.5
      ),
      line(
        x + 0.06, y - 0.06,
        x + 0.26, y - 0.06,
        color,
        1.5
      )
    );
  }

  function introLearner(g, revealContext = false) {
    const x = g === 0 ? AX : BX;
    const y = P ? 0.15 : -0.65;

    const w = P ? 2.95 : 2.55;
    const h = P ? 2.90 : 2.55;

    const bg = rect(
      x, y,
      w, h,
      revealContext ? CONTEXT : C.muted,
      C.card,
      0.91,
      0.20,
      2
    );

    const learner = glow(
      x,
      y + 0.45,
      P ? 0.32 : 0.27,
      C.ink
    );

    const label = txt(
      `Learner ${g + 1}`,
      P ? 24 : 21,
      C.ink,
      x,
      y - 0.18,
      w - 0.35
    );

    const parts = [
      bg,
      learner,
      label
    ];

    if (revealContext) {
      const contextY = y - 0.88;

      const color = g === 0
        ? CONTEXT
        : C.muted;

      const context = txt(
        groupName(g),
        P ? 21 : 18,
        color,
        x + 0.16,
        contextY,
        w - 0.75
      );

      const book = bookIcon(
        x - w / 2 + 0.35,
        contextY,
        color
      );

      parts.push(book, context);

      if (g === 1) {
        parts.push(
          line(
            x - w / 2 + 0.10,
            contextY - 0.22,
            x - w / 2 + 0.60,
            contextY + 0.22,
            C.muted,
            2
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Matrix row labels
  // ------------------------------------------------------------

  function rowLabel(g, color = CONTEXT) {
    const y = ROW_Y[g];

    if (P) {
      const label = pill(
        groupName(g).toUpperCase(),
        color,
        18
      );

      label.moveTo([
        0,
        y + CELL_H / 2 + 0.22,
        0
      ]);

      return label;
    }

    const first = g === 0
      ? 'Studied'
      : 'Did not';

    const second = g === 0
      ? 'today'
      : 'study';

    return new M.VGroup(
      txt(
        first,
        19,
        color,
        ROW_LABEL_X,
        y + 0.15,
        1.55
      ),
      txt(
        second,
        19,
        color,
        ROW_LABEL_X,
        y - 0.16,
        1.55
      )
    );
  }

  function rowOutline(g, color = CONTEXT) {
    const left = AX - CELL_W / 2 - 0.08;
    const right = BX + CELL_W / 2 + 0.08;

    return rect(
      (left + right) / 2,
      ROW_Y[g],
      right - left,
      CELL_H + 0.15,
      color,
      color,
      0,
      0.18,
      3
    );
  }

  function cellOutline(g, p, color = pc(p)) {
    return rect(
      px(p),
      ROW_Y[g],
      CELL_W + 0.08,
      CELL_H + 0.08,
      color,
      color,
      0,
      0.17,
      4
    );
  }

  function focusRow(g) {
    return replace(
      'rowFocus',
      rowOutline(g)
    );
  }

  function focusCell(g, p) {
    return replace(
      'cellFocus',
      cellOutline(g, p)
    );
  }

  function bothWinnerOutlines() {
    return [
      ...replace(
        'winner0',
        cellOutline(0, 'A', A)
      ),
      ...replace(
        'winner1',
        cellOutline(1, 'B', B)
      )
    ];
  }

  // ------------------------------------------------------------
  // Return-rate bars
  // ------------------------------------------------------------

  function rateBar(x, y, w, fraction, color, h = 0.15) {
    const track = new M.Rectangle({
      width: w,
      height: h,
      color: C.muted,
      strokeWidth: 1
    });

    track.setFill(C.muted, 0.11);
    track.moveTo([x, y, 0]);

    const parts = [track];

    if (fraction !== null && fraction > 0) {
      const fillW = w * fraction;

      const fill = new M.Rectangle({
        width: fillW,
        height: h,
        color,
        strokeWidth: 1
      });

      fill.setFill(color, 0.91);

      fill.moveTo([
        x - w / 2 + fillW / 2,
        y,
        0
      ]);

      parts.push(fill);
    }

    if (fraction === 0) {
      parts.push(
        line(
          x - w / 2,
          y - h / 2 - 0.035,
          x - w / 2,
          y + h / 2 + 0.035,
          color,
          3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Observation cells
  //
  // A cell contains only observations for its own context
  // and prompt. Missing observations are never recorded as zero.
  // ------------------------------------------------------------

  function observationCell(
    g,
    p,
    values = null,
    pending = false
  ) {
    const x = px(p);
    const y = ROW_Y[g];
    const color = pc(p);

    const bg = rect(
      x, y,
      CELL_W, CELL_H,
      color,
      C.card,
      0.88,
      0.14,
      1.5
    );

    const parts = [bg];

    if (values === null || values.length === 0) {
      const label = txt(
        pending
          ? 'Awaiting result'
          : 'No results yet',
        P ? 20 : 18,
        C.muted,
        x,
        y + 0.24,
        CELL_W - 0.3
      );

      const unknown = rewardMark(
        x,
        y - 0.20,
        null,
        0.20
      );

      parts.push(label, unknown);

      return new M.VGroup(...parts);
    }

    const n = values.length;
    const r = total(values);
    const rate = r / n;

    const count = txt(
      `${r} / ${n} returned`,
      P ? 21 : 18,
      C.ink,
      x - CELL_W * 0.19,
      y + 0.43,
      CELL_W * 0.53,
      true
    );

    const percent = txt(
      pct(rate),
      P ? 28 : 25,
      color,
      x + CELL_W * 0.31,
      y + 0.43,
      CELL_W * 0.32,
      true
    );

    parts.push(count, percent);

    const maxSpacing = P ? 0.46 : 0.40;

    const spacing = Math.min(
      maxSpacing,
      (CELL_W - 0.45) / Math.max(n, 1)
    );

    const radius = Math.min(
      P ? 0.15 : 0.13,
      spacing * 0.35
    );

    values.forEach((reward, k) => {
      parts.push(
        rewardMark(
          x + (k - (n - 1) / 2) * spacing,
          y,
          reward,
          radius
        )
      );
    });

    parts.push(
      rateBar(
        x,
        y - 0.44,
        CELL_W - 0.48,
        rate,
        color
      )
    );

    return new M.VGroup(...parts);
  }

  function refreshCell(g, p, values, pending = false) {
    return replace(
      cellKey(g, p),
      observationCell(
        g,
        p,
        values,
        pending
      )
    );
  }

  function refreshEstimate(g, p) {
    return refreshCell(
      g,
      p,
      history[g][p]
    );
  }

  function allEmptyCells() {
    const animations = [];

    for (const g of [0, 1]) {
      for (const p of ['A', 'B']) {
        animations.push(
          ...refreshCell(g, p, [])
        );
      }
    }

    return animations;
  }

  // ------------------------------------------------------------
  // Ten learners in one context group
  // ------------------------------------------------------------

  function groupPreview(g) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const bg = rect(
      x, y,
      w, 2.15,
      CONTEXT,
      C.card,
      0.96,
      0.18,
      2
    );

    const heading = txt(
      groupName(g).toUpperCase(),
      P ? 23 : 21,
      CONTEXT,
      x,
      y + 0.76,
      w - 0.38,
      true
    );

    const spacing = Math.min(
      0.49,
      (w - 0.65) / 5
    );

    const dots = [];

    for (let k = 0; k < 10; k++) {
      const col = k % 5;
      const row = Math.floor(k / 5);

      dots.push(
        glow(
          x + (col - 2) * spacing,
          y + 0.22 - row * 0.43,
          0.11,
          C.ink
        )
      );
    }

    const label = txt(
      '10 learners',
      P ? 23 : 21,
      C.ink,
      x,
      y - 0.77,
      w - 0.4
    );

    return replace(
      'box',
      new M.VGroup(
        bg,
        heading,
        ...dots,
        label
      )
    );
  }

  // ------------------------------------------------------------
  // Current learner and known context
  // ------------------------------------------------------------

  function learnerPanel(g, chosen = null, reward = null) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const color = chosen
      ? pc(chosen)
      : CONTEXT;

    const bg = rect(
      x, y,
      w, 2.27,
      color,
      C.card,
      0.97,
      0.18,
      2
    );

    const heading = txt(
      'CURRENT LEARNER',
      P ? 22 : 20,
      C.ink,
      x,
      y + 0.84,
      w - 0.35,
      true
    );

    const context = pill(
      groupName(g).toUpperCase(),
      CONTEXT,
      P ? 19 : 17
    );

    if (context.getWidth() > w - 0.45) {
      context.scale(
        (w - 0.45) / context.getWidth()
      );
    }

    context.moveTo([
      x,
      y + 0.38,
      0
    ]);

    const parts = [
      bg,
      heading,
      context
    ];

    const learnerX = x - w / 3;
    const outcomeX = x + w / 3;
    const iconY = y - 0.20;

    parts.push(
      glow(
        learnerX,
        iconY,
        0.15,
        C.ink
      )
    );

    if (chosen === null) {
      parts.push(
        txt(
          'Choose A or B?',
          P ? 21 : 19,
          CONTEXT,
          x + 0.30,
          iconY,
          w * 0.65
        ),
        txt(
          'Context is already known',
          P ? 18 : 16,
          C.muted,
          x,
          y - 0.80,
          w - 0.35
        )
      );
    } else {
      const prompt = rect(
        x,
        iconY,
        0.62,
        0.62,
        color,
        color,
        0.16,
        0.12,
        2
      );

      parts.push(
        arrow(
          learnerX + 0.24,
          iconY,
          x - 0.36,
          iconY,
          color,
          2,
          0.10
        ),
        prompt,
        txt(
          chosen,
          26,
          color,
          x,
          iconY,
          0.42,
          true
        ),
        arrow(
          x + 0.36,
          iconY,
          outcomeX - 0.27,
          iconY,
          C.muted,
          2,
          0.10
        ),
        rewardMark(
          outcomeX,
          iconY,
          reward,
          0.21
        )
      );

      const resultText = reward === null
        ? `Prompt ${chosen} chosen`
        : `Observed reward = ${reward}`;

      parts.push(
        txt(
          resultText,
          P ? 21 : 19,
          reward === 1
            ? GOOD
            : reward === 0
              ? BAD
              : color,
          x,
          y - 0.80,
          w - 0.35,
          true
        )
      );
    }

    return replace(
      'box',
      new M.VGroup(...parts)
    );
  }

  // ------------------------------------------------------------
  // Weather analogy
  // ------------------------------------------------------------

  function sunIcon(x, y, radius = 0.24) {
    const color = C.amber;

    const parts = [
      circle(
        x,
        y,
        radius,
        color,
        color,
        0.24,
        2
      )
    ];

    for (let k = 0; k < 8; k++) {
      const angle = k * Math.PI / 4;

      parts.push(
        line(
          x + Math.cos(angle) * radius * 1.35,
          y + Math.sin(angle) * radius * 1.35,
          x + Math.cos(angle) * radius * 1.85,
          y + Math.sin(angle) * radius * 1.85,
          color,
          2
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function rainIcon(x, y) {
    const color = A;

    const cloud = new M.VGroup(
      circle(
        x - 0.24, y + 0.05,
        0.20, color, color, 0.25
      ),
      circle(
        x, y + 0.18,
        0.26, color, color, 0.25
      ),
      circle(
        x + 0.24, y + 0.05,
        0.20, color, color, 0.25
      ),
      line(
        x - 0.38, y - 0.10,
        x + 0.38, y - 0.10,
        color, 3
      )
    );

    const drops = [];

    for (let k = 0; k < 3; k++) {
      const xx = x + (k - 1) * 0.24;

      drops.push(
        line(
          xx,
          y - 0.26,
          xx - 0.06,
          y - 0.44,
          color,
          3
        )
      );
    }

    return new M.VGroup(
      cloud,
      ...drops
    );
  }

  function umbrellaIcon(x, y) {
    const color = A;

    const canopy = new M.Arc({
      radius: 0.43,
      startAngle: 0,
      angle: Math.PI,
      color,
      strokeWidth: 3
    });

    canopy.setFill(color, 0.20);
    canopy.moveTo([x, y + 0.14, 0]);

    return new M.VGroup(
      canopy,
      line(
        x - 0.43, y - 0.075,
        x + 0.43, y - 0.075,
        color, 2
      ),
      line(
        x, y - 0.075,
        x, y - 0.48,
        color, 3
      ),
      line(
        x, y - 0.48,
        x + 0.14, y - 0.48,
        color, 3
      ),
      line(
        x + 0.14, y - 0.48,
        x + 0.14, y - 0.36,
        color, 3
      )
    );
  }

  function sunglassesIcon(x, y) {
    const color = C.amber;

    return new M.VGroup(
      rect(
        x - 0.24,
        y,
        0.40,
        0.31,
        color,
        color,
        0.27,
        0.09,
        2
      ),
      rect(
        x + 0.24,
        y,
        0.40,
        0.31,
        color,
        color,
        0.27,
        0.09,
        2
      ),
      line(
        x - 0.04, y + 0.05,
        x + 0.04, y + 0.05,
        color, 3
      ),
      line(
        x - 0.44, y + 0.08,
        x - 0.58, y + 0.19,
        color, 2
      ),
      line(
        x + 0.44, y + 0.08,
        x + 0.58, y + 0.19,
        color, 2
      )
    );
  }

  function weatherCard(g, revealWeather) {
    const x = g === 0 ? AX : BX;
    const y = P ? -0.10 : -0.50;

    const w = P ? 2.95 : 2.65;
    const h = P ? 3.80 : 3.30;

    const color = g === 0
      ? A
      : C.amber;

    const bg = rect(
      x, y,
      w, h,
      color,
      C.card,
      0.92,
      0.19,
      2
    );

    const choiceY = y - 0.55;

    const choice = g === 0
      ? umbrellaIcon(x, choiceY)
      : sunglassesIcon(x, choiceY);

    const label = txt(
      g === 0 ? 'Umbrella' : 'Sunglasses',
      P ? 22 : 20,
      color,
      x,
      y - h / 2 + 0.32,
      w - 0.35
    );

    const parts = [
      bg,
      choice,
      label
    ];

    if (revealWeather) {
      const weatherY = y + h / 2 - 0.70;

      const icon = g === 0
        ? rainIcon(x, weatherY)
        : sunIcon(x, weatherY);

      const weatherLabel = txt(
        g === 0 ? 'Rainy' : 'Sunny',
        P ? 23 : 21,
        color,
        x,
        weatherY - 0.65,
        w - 0.35
      );

      parts.push(
        icon,
        weatherLabel,
        arrow(
          x,
          y + 0.25,
          x,
          y - 0.05,
          color,
          2,
          0.11
        )
      );
    } else {
      parts.push(
        txt(
          '?',
          P ? 42 : 36,
          C.muted,
          x,
          y + 0.80,
          0.85,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Context-to-choice visual
  // ------------------------------------------------------------

  function contextPicture(g, chosen = null) {
    const x = g === 0 ? AX : BX;
    const y = P ? -0.15 : -0.65;

    const w = CARD_W;
    const h = P ? 2.95 : 2.75;

    const bg = rect(
      x, y,
      w, h,
      CONTEXT,
      C.card,
      0.91,
      0.18,
      2
    );

    const learner = glow(
      x,
      y + 0.87,
      0.19,
      C.ink
    );

    const context = txt(
      groupName(g),
      P ? 22 : 19,
      CONTEXT,
      x,
      y + 0.29,
      w - 0.30
    );

    const connector = arrow(
      x,
      y + 0.02,
      x,
      y - 0.38,
      CONTEXT,
      2,
      0.12
    );

    const choice = chosen === null
      ? txt(
          'A or B?',
          P ? 27 : 24,
          C.muted,
          x,
          y - 0.85,
          w - 0.40,
          true
        )
      : txt(
          `Choose ${chosen}`,
          P ? 27 : 23,
          pc(chosen),
          x,
          y - 0.85,
          w - 0.40,
          true
        );

    return new M.VGroup(
      bg,
      learner,
      context,
      connector,
      choice
    );
  }

  // ------------------------------------------------------------
  // True-rate cells
  //
  // No reward icons: these are probabilities, not additional
  // observed outcomes.
  // ------------------------------------------------------------

  function trueRateCell(g, p, reveal = false) {
    const x = px(p);
    const y = ROW_Y[g];
    const color = pc(p);

    const bg = rect(
      x, y,
      CELL_W, CELL_H,
      CONTEXT,
      C.card,
      0.91,
      0.14,
      2
    );

    const parts = [bg];

    if (!reveal) {
      parts.push(
        txt(
          'True rate',
          P ? 19 : 17,
          C.muted,
          x,
          y + 0.39,
          CELL_W - 0.30
        ),
        txt(
          '?',
          P ? 36 : 31,
          CONTEXT,
          x,
          y - 0.15,
          0.80,
          true
        )
      );

      return new M.VGroup(...parts);
    }

    // The true rate is accessed only for this explanatory visual.

    const rate = TRUE_RATES[g][p];

    parts.push(
      txt(
        'TRUE RETURN RATE',
        P ? 16 : 15,
        CONTEXT,
        x,
        y + 0.49,
        CELL_W - 0.24,
        true
      ),
      txt(
        pct(rate),
        P ? 38 : 34,
        color,
        x,
        y + 0.06,
        CELL_W - 0.35,
        true
      ),
      rateBar(
        x,
        y - 0.45,
        CELL_W - 0.42,
        rate,
        color,
        0.19
      )
    );

    return new M.VGroup(...parts);
  }

  function refreshTruth(g, p, reveal) {
    return replace(
      cellKey(g, p),
      trueRateCell(g, p, reveal)
    );
  }

  // ------------------------------------------------------------
  // Accelerated illustrative exploration
  //
  // The first eight observations are fixed by the narration.
  // The following continuation is illustrative, not another
  // fixed chapter sequence or a live random simulation.
  //
  // It ends with five observations per combination and the
  // same aggregate counts as the supplied 20-learner example.
  //
  // Each step consumes exactly one observed reward.
  // ------------------------------------------------------------

  const MORE_RESULTS = [
    [0, 'A', 1],
    [0, 'B', 1],
    [1, 'A', 1],
    [1, 'B', 1],

    [0, 'A', 0],
    [0, 'B', 1],
    [1, 'A', 0],
    [1, 'B', 1],

    [0, 'B', 1],
    [1, 'A', 0],
    [0, 'B', 0],
    [1, 'A', 0]
  ];

  async function exploreStep(g, p, reward, duration = 0.20) {
    // Show the chosen context and prompt first.

    await play(
      quick(
        [
          ...focusRow(g),
          ...focusCell(g, p)
        ],
        duration
      )
    );

    // Then observe and update only the chosen combination.

    observe(g, p, reward);

    await play(
      quick(
        [
          ...refreshEstimate(g, p)
        ],
        duration
      )
    );
  }

  // ------------------------------------------------------------
  // Expected-return comparison
  //
  // Left column: B for everyone.
  // Right column: choose according to context.
  //
  // Glowing green circles show expected counts, not observed
  // successes. Therefore these circles have no check marks.
  // ------------------------------------------------------------

  function comparisonHeader(policy) {
    const x = policy === 0 ? AX : BX;

    const color = policy === 0
      ? B
      : CONTEXT;

    const bg = rect(
      x,
      CARD_Y,
      CARD_W,
      CARD_H,
      color,
      color,
      0.09,
      0.15,
      2
    );

    const title = txt(
      policy === 0
        ? 'B FOR ALL'
        : 'USE CONTEXT',
      P ? 22 : 20,
      color,
      x,
      CARD_Y + 0.16,
      CARD_W - 0.25,
      true
    );

    const subtitle = txt(
      policy === 0
        ? 'Same prompt'
        : 'Different prompts',
      P ? 18 : 16,
      C.muted,
      x,
      CARD_Y - 0.22,
      CARD_W - 0.25
    );

    return new M.VGroup(
      bg,
      title,
      subtitle
    );
  }

  function expectedDot(x, y, expected) {
    const color = expected
      ? GOOD
      : C.muted;

    const outer = new M.Dot({
      point: [x, y, 0],
      radius: 0.145,
      color
    });

    outer.setFill(
      color,
      expected ? 0.12 : 0.025
    );

    const inner = circle(
      x, y,
      0.105,
      color,
      color,
      expected ? 0.85 : 0.10,
      1
    );

    return new M.VGroup(
      outer,
      inner
    );
  }

  function expectedCell(
    g,
    policy,
    chosen = null,
    expected = null
  ) {
    const x = policy === 0 ? AX : BX;
    const y = ROW_Y[g];

    const color = chosen
      ? pc(chosen)
      : C.muted;

    const bg = rect(
      x, y,
      CELL_W,
      CELL_H,
      color,
      C.card,
      0.90,
      0.14,
      2
    );

    const heading = txt(
      chosen === null
        ? '10 learners'
        : `Choose ${chosen}`,
      P ? 21 : 19,
      color,
      x,
      y + 0.49,
      CELL_W - 0.26,
      true
    );

    const parts = [
      bg,
      heading
    ];

    const spacing = Math.min(
      0.40,
      (CELL_W - 0.40) / 5
    );

    for (let k = 0; k < 10; k++) {
      const col = k % 5;
      const row = Math.floor(k / 5);

      const xx =
        x + (col - 2) * spacing;

      const yy =
        y + 0.10 - row * 0.31;

      parts.push(
        expectedDot(
          xx,
          yy,
          expected !== null && k < expected
        )
      );
    }

    const footer = txt(
      expected === null
        ? 'Expected returns: ?'
        : `${expected} expected returns`,
      P ? 18 : 17,
      expected === null
        ? C.muted
        : GOOD,
      x,
      y - 0.53,
      CELL_W - 0.22,
      true
    );

    parts.push(footer);

    return new M.VGroup(...parts);
  }

  function refreshExpected(
    g,
    policy,
    chosen = null,
    expected = null
  ) {
    const key = policy === 0
      ? cellKey(g, 'A')
      : cellKey(g, 'B');

    return replace(
      key,
      expectedCell(
        g,
        policy,
        chosen,
        expected
      )
    );
  }

  // ------------------------------------------------------------
  // Time order: context before the decision
  // ------------------------------------------------------------

  function timelinePicture(showFuture = false) {
    const x = CX;
    const y = P ? -0.30 : -0.45;

    const gap = P ? 2.55 : 2.12;
    const w = P ? 2.25 : 1.94;
    const h = P ? 2.65 : 2.55;

    const xs = [
      x - gap,
      x,
      x + gap
    ];

    const colors = [
      CONTEXT,
      A,
      C.muted
    ];

    const parts = [];

    for (let k = 0; k < 3; k++) {
      parts.push(
        rect(
          xs[k],
          y,
          w,
          h,
          colors[k],
          C.card,
          0.92,
          0.16,
          2
        )
      );
    }

    parts.push(
      txt(
        'TODAY',
        P ? 20 : 18,
        CONTEXT,
        xs[0],
        y + 0.96,
        w - 0.22,
        true
      ),
      bookIcon(
        xs[0],
        y + 0.40,
        CONTEXT
      ),
      txt(
        'Studied?',
        P ? 21 : 19,
        CONTEXT,
        xs[0],
        y - 0.20,
        w - 0.25
      ),
      txt(
        'Known',
        P ? 18 : 16,
        GOOD,
        xs[0],
        y - 0.81,
        w - 0.25
      ),
      txt(
        'CHOOSE',
        P ? 20 : 18,
        A,
        xs[1],
        y + 0.96,
        w - 0.22,
        true
      ),
      rect(
        xs[1] - 0.37,
        y + 0.34,
        0.57,
        0.58,
        A,
        A,
        0.14,
        0.09,
        2
      ),
      rect(
        xs[1] + 0.37,
        y + 0.34,
        0.57,
        0.58,
        B,
        B,
        0.14,
        0.09,
        2
      ),
      txt(
        'A', 23, A,
        xs[1] - 0.37,
        y + 0.34,
        0.40,
        true
      ),
      txt(
        'B', 23, B,
        xs[1] + 0.37,
        y + 0.34,
        0.40,
        true
      ),
      txt(
        'One prompt',
        P ? 19 : 17,
        C.ink,
        xs[1],
        y - 0.30,
        w - 0.24
      ),
      txt(
        'Decision',
        P ? 18 : 16,
        A,
        xs[1],
        y - 0.81,
        w - 0.25
      ),
      txt(
        'TOMORROW',
        P ? 20 : 18,
        C.muted,
        xs[2],
        y + 0.96,
        w - 0.22,
        true
      ),
      rewardMark(
        xs[2],
        y + 0.32,
        null,
        0.24
      ),
      txt(
        'Returns?',
        P ? 21 : 19,
        C.muted,
        xs[2],
        y - 0.30,
        w - 0.24
      ),
      txt(
        'Not known yet',
        P ? 18 : 16,
        C.muted,
        xs[2],
        y - 0.81,
        w - 0.24
      ),
      arrow(
        xs[0] + w / 2 + 0.02,
        y,
        xs[1] - w / 2 - 0.02,
        y,
        CONTEXT,
        2,
        0.09
      ),
      arrow(
        xs[1] + w / 2 + 0.02,
        y,
        xs[2] - w / 2 - 0.02,
        y,
        C.muted,
        2,
        0.09
      )
    );

    if (showFuture) {
      const warningY = y - h / 2 - 0.53;

      parts.push(
        dashed(
          xs[2],
          warningY,
          xs[1],
          warningY,
          C.amber
        ),
        cross(
          (xs[1] + xs[2]) / 2,
          warningY,
          C.amber,
          0.19
        ),
        txt(
          'Cannot use tomorrow to choose today',
          P ? 20 : 18,
          C.amber,
          x,
          warningY - 0.43,
          P ? FW - 1.0 : 6.2
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // NARRATED SCENE
  // ============================================================

  // ------------------------------------------------------------
  // 0: two learners arrive at the study app
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...replace(
      'intro0',
      introLearner(0)
    ),
    ...replace(
      'intro1',
      introLearner(1)
    ),
    ...say('TWO LEARNERS ARRIVE'),
    ...fbox(
      [
        ['Our study app', A],
        'Two learners arrive.',
        'Which prompt should',
        'each learner receive?'
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 1: one studied today; the other did not
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...replace(
      'intro0',
      introLearner(0, true)
    ),
    ...replace(
      'intro1',
      introLearner(1, true)
    ),
    ...say('DIFFERENT LEARNER ACTIVITY', CONTEXT),
    ...fbox(
      [
        ['Learner 1', CONTEXT],
        'Studied today',
        ['Learner 2', C.muted],
        'Did not study'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 2: should they receive the same prompt?
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...say('SAME PROMPT FOR BOTH?', C.amber),
    ...fbox(
      [
        ['One choice for everyone?', C.amber],
        'Or a different choice',
        'for each situation?'
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 3: introduce A and B
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...promptHeaders(),
    ...say('A: QUIZ     B: REMINDER'),
    ...fbox(
      [
        ['A: Try a quick quiz!', A],
        ['B: Time for more practice!', B],
        'One prompt per learner.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 4: original record of twenty learners
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...clear('intro0', 'intro1'),
    ...allEmptyCells(),
    ...say('OUR FIRST 20 LEARNERS'),
    ...fbox(
      [
        ['Original recorded data', C.cyan],
        '20 learners in total',
        '10 studied today',
        '10 did not study',
        'One prompt per learner'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 5: ten learners studied before receiving a prompt
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...replace(
      'row0',
      rowLabel(0)
    ),
    ...focusRow(0),
    ...groupPreview(0),
    ...say('10 LEARNERS STUDIED TODAY', CONTEXT)
  );

  // ------------------------------------------------------------
  // 6: studied today, A: four returns from five
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...focusCell(0, 'A'),
    ...refreshCell(0, 'A', [], true),
    ...say('STUDIED TODAY: 5 RECEIVE A', A),
    ...fbox(
      [
        ['Studied today', CONTEXT],
        ['5 learners receive A', A],
        'Observe their next-day results.'
      ],
      A
    )
  );

  await until(S(6) + 1.35);

  await play(
    ...refreshCell(
      0,
      'A',
      ORIGINAL[0].A
    ),
    ...fbox(
      [
        ['Prompt A', A],
        ['4 returns from 5 choices', GOOD],
        ['4 ÷ 5 = 80%', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 7: studied today, B: three returns from five
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...focusCell(0, 'B'),
    ...refreshCell(0, 'B', [], true),
    ...say('STUDIED TODAY: 5 RECEIVE B', B),
    ...fbox(
      [
        ['Studied today', CONTEXT],
        ['5 learners receive B', B],
        'Observe their next-day results.'
      ],
      B
    )
  );

  await until(S(7) + 1.20);

  await play(
    ...refreshCell(
      0,
      'B',
      ORIGINAL[0].B
    ),
    ...fbox(
      [
        ['Prompt B', B],
        ['3 returns from 5 choices', GOOD],
        ['3 ÷ 5 = 60%', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 8: A looks better for learners who studied
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...focusCell(0, 'A'),
    ...say('FOR THIS GROUP, A LOOKS BETTER', A),
    ...fbox(
      [
        ['Studied today', CONTEXT],
        ['A: 80%', A],
        ['B: 60%', B],
        ['A looks better so far', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 9: ten learners did not study
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...clear('cellFocus'),
    ...replace(
      'row1',
      rowLabel(1)
    ),
    ...focusRow(1),
    ...groupPreview(1),
    ...say('10 LEARNERS DID NOT STUDY', CONTEXT)
  );

  // ------------------------------------------------------------
  // 10: did not study, A: one return from five
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...focusCell(1, 'A'),
    ...refreshCell(1, 'A', [], true),
    ...say('DID NOT STUDY: 5 RECEIVE A', A)
  );

  await until(S(10) + 1.0);

  await play(
    ...refreshCell(
      1,
      'A',
      ORIGINAL[1].A
    ),
    ...fbox(
      [
        ['Did not study', CONTEXT],
        ['1 return from 5 choices', GOOD],
        ['A: 1 ÷ 5 = 20%', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 11: did not study, B: four returns from five
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...focusCell(1, 'B'),
    ...refreshCell(1, 'B', [], true),
    ...say('DID NOT STUDY: 5 RECEIVE B', B)
  );

  await until(S(11) + 1.15);

  await play(
    ...refreshCell(
      1,
      'B',
      ORIGINAL[1].B
    ),
    ...fbox(
      [
        ['Did not study', CONTEXT],
        ['4 returns from 5 choices', GOOD],
        ['B: 4 ÷ 5 = 80%', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 12: B looks better for learners who did not study
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...clear('rowFocus', 'cellFocus'),
    ...bothWinnerOutlines(),
    ...say('DIFFERENT GROUPS, DIFFERENT WINNERS', CONTEXT),
    ...fbox(
      [
        ['Studied today', CONTEXT],
        ['A: 80%    B: 60%', A],
        ['Did not study', CONTEXT],
        ['A: 20%    B: 80%', B],
        'Different choices look better.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 13: umbrella versus sunglasses
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...clearExcept('box'),
    ...replace(
      'weather0',
      weatherCard(0, false)
    ),
    ...replace(
      'weather1',
      weatherCard(1, false)
    ),
    ...say('UMBRELLA OR SUNGLASSES?', C.amber),
    ...fbox(
      [
        ['Two possible choices', C.amber],
        'Give an umbrella.',
        'Give sunglasses.',
        'Which is more useful?'
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 14: the weather determines which choice is useful
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...replace(
      'weather0',
      weatherCard(0, true)
    ),
    ...replace(
      'weather1',
      weatherCard(1, true)
    ),
    ...say('THE RIGHT CHOICE DEPENDS ON THE WEATHER'),
    ...fbox(
      [
        ['Rainy → umbrella', A],
        ['Sunny → sunglasses', C.amber],
        'Use what we know',
        'about the situation.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 15: our study app can use information too
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...clear('weather0', 'weather1'),
    ...promptHeaders(),
    ...replace(
      'context0',
      contextPicture(0)
    ),
    ...replace(
      'context1',
      contextPicture(1)
    ),
    ...say('OUR APP CAN USE INFORMATION TOO', CONTEXT),
    ...fbox(
      [
        ['Study app', A],
        'Use information about',
        'the current learner',
        'before choosing a prompt.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 16: whether the learner studied today
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    new M.Indicate(
      slots.get('context0'),
      { color: CONTEXT }
    ),
    new M.Indicate(
      slots.get('context1'),
      { color: CONTEXT }
    ),
    ...say('DID THIS LEARNER STUDY TODAY?', CONTEXT),
    ...fbox(
      [
        ['Information available now', CONTEXT],
        'Studied today?',
        'Yes or no',
        'We know this before choosing.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 17: information before a choice is context
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...say('CONTEXT = INFORMATION KNOWN BEFORE CHOOSING', CONTEXT),
    ...fbox(
      [
        ['CONTEXT', CONTEXT],
        'Information we know',
        'before making a choice.',
        'Here: learner activity.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 18: contextual bandits use context to choose an action
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...replace(
      'context0',
      contextPicture(0, 'A')
    ),
    ...replace(
      'context1',
      contextPicture(1, 'B')
    ),
    ...say('CONTEXTUAL BANDIT', CONTEXT),
    ...fbox(
      [
        ['Contextual bandit', CONTEXT],
        'Observe the context.',
        'Use the relevant estimates.',
        'Choose an action.',
        'Learn from its result.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 19: four estimates instead of two
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...clear('context0', 'context1'),
    ...replace('row0', rowLabel(0)),
    ...replace('row1', rowLabel(1)),
    ...allEmptyCells(),
    ...say('TWO CONTEXTS × TWO PROMPTS = FOUR ESTIMATES'),
    ...fbox(
      [
        ['Studied today', CONTEXT],
        ['Estimate for A', A],
        ['Estimate for B', B],
        ['Did not study', CONTEXT],
        ['Estimate for A', A],
        ['Estimate for B', B]
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 20: start a separate learning example
  // ------------------------------------------------------------

  await until(S(20));

  history[0].A = [];
  history[0].B = [];
  history[1].A = [];
  history[1].B = [];

  await play(
    ...allEmptyCells(),
    ...say('NEW EXAMPLE: START LEARNING AGAIN', C.cyan),
    ...fbox(
      [
        ['New learning example', C.cyan],
        'Start with four empty records.',
        'The previous 20-learner record',
        'is not reused as observations.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 21: begin with one result for each combination
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...refreshCell(0, 'A', [], true),
    ...refreshCell(0, 'B', [], true),
    ...refreshCell(1, 'A', [], true),
    ...refreshCell(1, 'B', [], true),
    ...say('BEGIN WITH ONE RESULT PER COMBINATION'),
    ...fbox(
      [
        ['Initial observations', C.cyan],
        'Try each prompt once',
        'within each learner group.',
        ['Four choices in total', CONTEXT]
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 22: studied today, A = 1/1, B = 0/1
  // ------------------------------------------------------------

  await until(S(22));

  observe(0, 'A', 1);
  observe(0, 'B', 0);

  await play(
    ...focusRow(0),
    ...refreshEstimate(0, 'A'),
    ...refreshEstimate(0, 'B'),
    ...say('STUDIED TODAY: A RETURNS, B DOES NOT', CONTEXT),
    ...fbox(
      [
        ['Studied today', CONTEXT],
        ['A: reward 1', GOOD],
        ['A: 1 / 1 = 100%', A],
        ['B: reward 0', BAD],
        ['B: 0 / 1 = 0%', B]
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 23: did not study, A = 0/1, B = 1/1
  // ------------------------------------------------------------

  await until(S(23));

  observe(1, 'A', 0);
  observe(1, 'B', 1);

  await play(
    ...focusRow(1),
    ...refreshEstimate(1, 'A'),
    ...refreshEstimate(1, 'B'),
    ...say('DID NOT STUDY: A DOES NOT RETURN, B RETURNS'),
    ...fbox(
      [
        ['Did not study', CONTEXT],
        ['A: reward 0', BAD],
        ['A: 0 / 1 = 0%', A],
        ['B: reward 1', GOOD],
        ['B: 1 / 1 = 100%', B]
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 24: learner who studied today arrives
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...clear('rowFocus'),
    ...learnerPanel(0),
    ...say('NEW LEARNER: STUDIED TODAY', CONTEXT)
  );

  // ------------------------------------------------------------
  // 25: look only at the relevant context row
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...focusRow(0),
    ...say('LOOK ONLY AT THIS GROUP', CONTEXT),
    ...fbox(
      [
        ['Context: studied today', CONTEXT],
        ['A: estimated 100%', A],
        ['B: estimated 0%', B],
        'Ignore the other context',
        'when choosing for this learner.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 26: A looks better, so choose A
  // ------------------------------------------------------------

  await until(S(26));

  const choice1 = bestPrompt(0);

  await play(
    ...focusCell(0, choice1),
    ...learnerPanel(0, choice1),
    ...say('100% > 0%: CHOOSE A', A)
  );

  // ------------------------------------------------------------
  // 27: learner returns, studied A becomes 2/2
  // ------------------------------------------------------------

  await until(S(27));

  observe(0, choice1, 1);

  await play(
    ...refreshEstimate(0, choice1),
    ...learnerPanel(0, choice1, 1),
    ...say('A: ANOTHER RETURN IN THIS GROUP', GOOD)
  );

  await until(S(27) + 1.65);

  await play(
    ...fbox(
      [
        ['Studied today: prompt A', A],
        'Old record: 1 / 1',
        ['New reward = 1', GOOD],
        ['New record: 2 / 2', A],
        ['Estimated rate = 100%', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 28: learner who did not study arrives
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...clear('cellFocus'),
    ...focusRow(1),
    ...learnerPanel(1),
    ...say('NEW LEARNER: DID NOT STUDY', CONTEXT)
  );

  // ------------------------------------------------------------
  // 29: choose B for this group
  // ------------------------------------------------------------

  await until(S(29));

  const choice2 = bestPrompt(1);

  await play(
    ...focusCell(1, choice2),
    ...learnerPanel(1, choice2),
    ...say('FOR THIS GROUP, CHOOSE B', B)
  );

  // ------------------------------------------------------------
  // 30: learner returns, did-not-study B becomes 2/2
  // ------------------------------------------------------------

  await until(S(30));

  observe(1, choice2, 1);

  await play(
    ...refreshEstimate(1, choice2),
    ...learnerPanel(1, choice2, 1),
    ...say('B: ANOTHER RETURN IN THIS GROUP', GOOD)
  );

  await until(S(30) + 1.65);

  await play(
    ...fbox(
      [
        ['Did not study: prompt B', B],
        'Old record: 1 / 1',
        ['New reward = 1', GOOD],
        ['New record: 2 / 2', B],
        ['Estimated rate = 100%', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 31: another learner studied today; choose A
  // ------------------------------------------------------------

  await until(S(31));

  const choice3 = bestPrompt(0);

  await play(
    ...focusRow(0),
    ...focusCell(0, choice3),
    ...learnerPanel(0, choice3),
    ...say('STUDIED TODAY AGAIN: CHOOSE A', A)
  );

  // ------------------------------------------------------------
  // 32: returns, studied A becomes 3/3
  // ------------------------------------------------------------

  await until(S(32));

  observe(0, choice3, 1);

  await play(
    ...refreshEstimate(0, choice3),
    ...learnerPanel(0, choice3, 1),
    ...say('A: THREE RETURNS FROM THREE CHOICES', GOOD)
  );

  await until(S(32) + 1.65);

  await play(
    ...fbox(
      [
        ['Studied today: prompt A', A],
        'Old record: 2 / 2',
        ['New reward = 1', GOOD],
        ['New record: 3 / 3', A],
        ['Estimated rate = 100%', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 33: another learner did not study; choose B
  // ------------------------------------------------------------

  await until(S(33));

  const choice4 = bestPrompt(1);

  await play(
    ...focusRow(1),
    ...focusCell(1, choice4),
    ...learnerPanel(1, choice4),
    ...say('DID NOT STUDY AGAIN: CHOOSE B', B)
  );

  // ------------------------------------------------------------
  // 34: does not return, did-not-study B becomes 2/3
  // ------------------------------------------------------------

  await until(S(34));

  observe(1, choice4, 0);

  await play(
    ...refreshEstimate(1, choice4),
    ...learnerPanel(1, choice4, 0),
    ...say('B: THIS LEARNER DOES NOT RETURN', BAD)
  );

  await until(S(34) + 1.90);

  await play(
    ...fbox(
      [
        ['Did not study: prompt B', B],
        'Old record: 2 / 2',
        ['New reward = 0', BAD],
        'Number of choices increases.',
        ['New record: 2 / 3', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 35: B's estimated rate falls to about 67%
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    new M.Indicate(
      slots.get(cellKey(1, 'B')),
      { color: B }
    ),
    ...say('2 ÷ 3 ≈ 67%', B),
    ...fbox(
      [
        ['Did not study: prompt B', B],
        'Before: 2 / 2 = 100%',
        'After: 2 / 3',
        ['New estimate ≈ 67%', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 36: only one of four estimates changes per observation
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...clear('rowFocus'),
    ...say('ONE RESULT UPDATES ONLY ONE ESTIMATE', CONTEXT),
    ...fbox(
      [
        ['Last observation', B],
        'Context: did not study',
        'Prompt: B',
        ['Only this cell changes', GOOD],
        'Other three stay unchanged.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 37: continue exploring both prompts within both groups
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...clear('cellFocus'),
    ...say('EXPLORE BOTH PROMPTS IN EACH GROUP', CONTEXT),
    ...fbox(
      [
        ['Illustrative continuation', C.muted],
        'Try A and B',
        'for learners who studied.',
        'Try A and B',
        'for learners who did not.'
      ],
      CONTEXT
    )
  );

  for (let k = 0; k < 4; k++) {
    const [g, p, reward] = MORE_RESULTS[k];

    await exploreStep(
      g,
      p,
      reward,
      0.31
    );
  }

  // ------------------------------------------------------------
  // 38: more observations tend to improve reliability
  //
  // The illustrative continuation adds twelve observations.
  // The resulting twenty observations have five per cell.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    quick(
      [
        ...say('MORE RESULTS, MORE RELIABLE ESTIMATES', CONTEXT),
        ...fbox(
          [
            ['Keep collecting evidence', CONTEXT],
            'More choices in every cell',
            'More observed rewards',
            'Estimates can rise or fall.'
          ],
          CONTEXT
        )
      ],
      0.30
    )
  );

  for (let k = 4; k < MORE_RESULTS.length; k++) {
    const [g, p, reward] = MORE_RESULTS[k];

    await exploreStep(
      g,
      p,
      reward,
      0.15
    );
  }

  await play(
    quick(
      [
        ...clear('rowFocus', 'cellFocus'),
        ...fbox(
          [
            ['After more learners:', C.ink],
            '5 choices per combination',
            ['Studied: A 80%, B 60%', CONTEXT],
            ['Not studied: A 20%, B 80%', CONTEXT],
            'Still estimates, not certainty.'
          ],
          CONTEXT
        )
      ],
      0.30
    )
  );

  // ------------------------------------------------------------
  // 39: the same return-rate rule as before
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...focusCell(0, 'A'),
    ...say('THE SAME RETURN-RATE RULE'),
    ...fbox(
      [
        ['For one prompt and group', CONTEXT],
        'Count the observed returns.',
        'Count the observed choices.',
        ['Divide the two counts', C.cyan]
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 40: return rate = returns / choices in that combination
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...say('RETURNS ÷ CHOICES FOR THIS PROMPT AND GROUP'),
    ...fbox(
      [
        ['estimated return rate =', C.ink],
        ['  returns ÷ choices', C.cyan],
        'For this prompt and group.',
        ['Studied, A: 4 ÷ 5 = 80%', A]
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 41: reveal the true rates
  //
  // The estimates are temporarily replaced with the simulator's
  // hidden probabilities. These probabilities are not supplied
  // to the learning method.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...clear('cellFocus'),
    ...refreshTruth(0, 'A', false),
    ...refreshTruth(0, 'B', false),
    ...refreshTruth(1, 'A', false),
    ...refreshTruth(1, 'B', false),
    ...say('REVEAL THE TRUE RETURN RATES', CONTEXT),
    ...fbox(
      [
        ['Hidden true rates', CONTEXT],
        'The simulator knows them.',
        'The study app does not.',
        'The app learns from rewards.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 42: studied today, A = 80%, B = 60%
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...refreshTruth(0, 'A', true),
    ...refreshTruth(0, 'B', true),
    ...focusRow(0),
    ...focusCell(0, 'A'),
    ...say('STUDIED TODAY: A 80%, B 60%', CONTEXT),
    ...fbox(
      [
        ['True rates: studied today', CONTEXT],
        ['A: 80%', A],
        ['B: 60%', B],
        ['A is better for this group', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 43: did not study, A = 20%, B = 80%
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...refreshTruth(1, 'A', true),
    ...refreshTruth(1, 'B', true),
    ...clear('rowFocus', 'cellFocus'),
    ...bothWinnerOutlines(),
    ...say('DID NOT STUDY: A 20%, B 80%', CONTEXT),
    ...fbox(
      [
        ['True rates: did not study', CONTEXT],
        ['A: 20%', A],
        ['B: 80%', B],
        ['B is better for this group', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 44: imagine another twenty learners
  //
  // Each column depicts an alternative policy applied to
  // the same hypothetical population of twenty learners.
  // They are not forty different learners.
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...clear('winner0', 'winner1'),
    ...replace(
      'headerA',
      comparisonHeader(0)
    ),
    ...replace(
      'headerB',
      comparisonHeader(1)
    ),
    ...refreshExpected(0, 0),
    ...refreshExpected(1, 0),
    ...refreshExpected(0, 1),
    ...refreshExpected(1, 1),
    ...say('SAME 20 LEARNERS, TWO POSSIBLE RULES'),
    ...fbox(
      [
        ['Imagine 20 new learners', C.ink],
        '10 studied today',
        '10 did not study',
        'Compare two choice rules',
        'for this same population.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 45: B for everyone, studied group: six expected returns
  // ------------------------------------------------------------

  await until(S(45));

  const alwaysBStudied =
    10 * TRUE_RATES[0].B;

  await play(
    ...refreshExpected(
      0,
      0,
      'B',
      alwaysBStudied
    ),
    ...focusRow(0),
    ...say('B FOR ALL: 6 EXPECTED RETURNS HERE', B),
    ...fbox(
      [
        ['Always choose B', B],
        '10 studied today',
        ['True return rate = 60%', B],
        ['10 × 0.60 = 6', GOOD],
        'Expected returns'
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 46: B for everyone, did not study: eight expected returns
  // Total = fourteen.
  // ------------------------------------------------------------

  await until(S(46));

  const alwaysBNotStudied =
    10 * TRUE_RATES[1].B;

  const alwaysBTotal =
    alwaysBStudied + alwaysBNotStudied;

  await play(
    ...refreshExpected(
      1,
      0,
      'B',
      alwaysBNotStudied
    ),
    ...focusRow(1),
    ...say('6 + 8 = 14 EXPECTED RETURNS', B),
    ...fbox(
      [
        ['Always choose B', B],
        ['Studied: 10 × 60% = 6', GOOD],
        ['Not studied: 10 × 80% = 8', GOOD],
        ['Total: 6 + 8 = 14', B],
        ['14 / 20 = 70%', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 47: use context, A for studied and B for not studied
  // ------------------------------------------------------------

  await until(S(47));

  await play(
    ...clear('rowFocus'),
    ...refreshExpected(0, 1, 'A'),
    ...refreshExpected(1, 1, 'B'),
    ...say('USE CONTEXT: A HERE, B THERE', CONTEXT),
    ...fbox(
      [
        ['Context-based choice rule', CONTEXT],
        ['Studied today → A', A],
        ['Did not study → B', B],
        'Choose according to',
        'the learner’s situation.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 48: eight expected returns from each group, total sixteen
  // ------------------------------------------------------------

  await until(S(48));

  const contextualStudied =
    10 * TRUE_RATES[0].A;

  const contextualNotStudied =
    10 * TRUE_RATES[1].B;

  const contextualTotal =
    contextualStudied + contextualNotStudied;

  await play(
    ...refreshExpected(
      0,
      1,
      'A',
      contextualStudied
    ),
    ...refreshExpected(
      1,
      1,
      'B',
      contextualNotStudied
    ),
    ...say('8 + 8 = 16 EXPECTED RETURNS', GOOD),
    ...fbox(
      [
        ['Use context', CONTEXT],
        ['Studied: 10 × 80% = 8', A],
        ['Not studied: 10 × 80% = 8', B],
        ['Total: 8 + 8 = 16', GOOD],
        ['16 / 20 = 80%', GOOD]
      ],
      GOOD
    )
  );

  // ------------------------------------------------------------
  // 49: two more expected returns from the same population
  // ------------------------------------------------------------

  function policyComparison() {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const h = P ? 2.75 : 3.05;

    const bg = rect(
      x, y,
      w, h,
      GOOD,
      C.card,
      0.97,
      0.18,
      2
    );

    const top = y + h / 2 - 0.30;

    const heading = txt(
      'EXPECTED RETURNS',
      P ? 22 : 20,
      GOOD,
      x,
      top,
      w - 0.35,
      true
    );

    const y1 = top - 0.48;
    const y2 = y1 - 0.73;

    const aLabel = txt(
      `B for all: ${alwaysBTotal} / 20`,
      P ? 20 : 18,
      B,
      x,
      y1,
      w - 0.30,
      true
    );

    const bLabel = txt(
      `Use context: ${contextualTotal} / 20`,
      P ? 20 : 18,
      CONTEXT,
      x,
      y2,
      w - 0.30,
      true
    );

    const gain = contextualTotal - alwaysBTotal;

    const gainText = txt(
      `+${gain} expected returns`,
      P ? 26 : 24,
      GOOD,
      x,
      y - h / 2 + 0.53,
      w - 0.30,
      true
    );

    const gainRate = txt(
      '70% → 80%',
      P ? 20 : 19,
      GOOD,
      x,
      y - h / 2 + 0.18,
      w - 0.30,
      true
    );

    return replace(
      'box',
      new M.VGroup(
        bg,
        heading,
        aLabel,
        rateBar(
          x,
          y1 - 0.25,
          w - 0.65,
          alwaysBTotal / 20,
          B,
          0.19
        ),
        bLabel,
        rateBar(
          x,
          y2 - 0.25,
          w - 0.65,
          contextualTotal / 20,
          CONTEXT,
          0.19
        ),
        gainText,
        gainRate
      )
    );
  }

  await until(S(49));

  await play(
    ...policyComparison(),
    ...say('16 − 14 = 2 MORE EXPECTED RETURNS', GOOD)
  );

  // ------------------------------------------------------------
  // 50: contextual bandits learn better choices for situations
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    ...replace(
      'winner0',
      cellOutline(0, 'B', A)
    ),
    ...replace(
      'winner1',
      cellOutline(1, 'B', B)
    ),
    ...say('DIFFERENT SITUATIONS NEED DIFFERENT CHOICES', CONTEXT),
    ...fbox(
      [
        ['Contextual bandits', CONTEXT],
        ['Studied today → A', A],
        ['Did not study → B', B],
        ['Expected rate: 80%', GOOD],
        'Learn which action works where.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 51: context must be known before choosing the prompt
  // ------------------------------------------------------------

  await until(S(51));

  await play(
    ...clearExcept('box'),
    ...replace(
      'timeline',
      timelinePicture(false)
    ),
    ...say('CONTEXT MUST BE KNOWN BEFORE THE CHOICE', CONTEXT),
    ...fbox(
      [
        ['Correct time order', CONTEXT],
        '1. Observe context',
        '2. Choose a prompt',
        '3. Observe tomorrow’s reward'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 52: tomorrow's return cannot inform today's decision
  // ------------------------------------------------------------

  await until(S(52));

  await play(
    ...replace(
      'timeline',
      timelinePicture(true)
    ),
    ...say('DO NOT USE INFORMATION FROM THE FUTURE', C.amber),
    ...fbox(
      [
        ['Today', CONTEXT],
        'We can know learner activity.',
        ['Tomorrow', C.amber],
        'We observe the return later.',
        'Future results are not context.'
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 53: need sufficient results from both prompts in each group
  // ------------------------------------------------------------

  await until(S(53));

  await play(
    ...clear('timeline'),
    ...promptHeaders(),
    ...replace('row0', rowLabel(0)),
    ...replace('row1', rowLabel(1)),
    ...refreshEstimate(0, 'A'),
    ...refreshEstimate(0, 'B'),
    ...refreshEstimate(1, 'A'),
    ...refreshEstimate(1, 'B'),
    ...say('COLLECT ENOUGH RESULTS IN ALL FOUR CELLS', CONTEXT),
    ...fbox(
      [
        ['Explore within each context', CONTEXT],
        ['Studied: try A and B', A],
        ['Not studied: try A and B', B],
        'Five results per cell',
        'are still limited evidence.'
      ],
      CONTEXT
    )
  );

  // ------------------------------------------------------------
  // 54: final recap
  //
  // Observe context before choosing.
  // Compare estimates for the current context.
  // Choose one prompt.
  // Observe only its reward.
  // Update only the relevant estimate.
  // ------------------------------------------------------------

  await until(S(54));

  await play(
    ...bothWinnerOutlines(),
    ...say('CONTEXTUAL BANDITS', CONTEXT),
    ...fbox(
      [
        ['Different contexts', CONTEXT],
        ['Studied today → A', A],
        ['Did not study → B', B],
        'Use the relevant estimates.'
      ],
      CONTEXT
    )
  );

  await until(S(54) + 2.50);

  await play(
    ...say('LEARN THE BEST ACTION FOR EACH SITUATION', CONTEXT),
    ...fbox(
      [
        ['1. Observe context', CONTEXT],
        ['2. Choose one action', A],
        ['3. Observe its reward', GOOD],
        ['4. Update its estimate', B],
        'Keep learning in every group.'
      ],
      CONTEXT
    )
  );

  await until(S(54) + 5.20);

  await play(
    ...say('NOT ONE CHOICE FOR EVERYONE', GOOD),
    ...fbox(
      [
        ['CONTEXTUAL BANDITS', CONTEXT],
        'Learn what works',
        'for each situation.',
        ['Different contexts', CONTEXT],
        ['Different choices', GOOD]
      ],
      GOOD
    )
  );

  await until(E(54));
}

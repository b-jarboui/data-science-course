// lesson 8.2.10
// Instrumental variables: using a fair nudge to estimate the effect
// of receiving a pass for people whose receipt changes.
//
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Separate lottery illustration:
//
// Group          People    Pass holders    Average commute
// Winners          10            8             34 minutes
// Nonwinners       10            3             37 minutes
//
// Difference in pass shares = 8/10 - 3/10 = 0.50.
// Difference in average time = 34 - 37 = -3 minutes.
// Instrumental-variable estimate = -3 / 0.50 = -6 minutes.
//
// Exact illustrative composition of EACH row:
//
// 3 always get a pass:
//   Average commute = 30 minutes either way.
//
// 5 get a pass only if they win:
//   Average commute with pass = 34 minutes.
//   Average commute without pass = 40 minutes.
//
// 2 never get a pass:
//   Average commute = 40 minutes either way.
//
// Winners:
//   (3 × 30 + 5 × 34 + 2 × 40) / 10 = 34.
//
// Nonwinners:
//   (3 × 30 + 5 × 40 + 2 × 40) / 10 = 37.
//
// The estimate concerns people whose pass receipt changes
// because they win, under the instrumental-variable assumptions.
//
// Try it beats preview the separate interactive exercise.
// Mouse/touch handlers are not specified by the supplied scene API.
// Fresh practice draws are explicitly hypothetical balanced examples.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Fixed lesson data
  // ------------------------------------------------------------

  const N = 10;

  const ALWAYS = 3;
  const NUDGED = 5;
  const NEVER = 2;

  const ALWAYS_TIME = 30;
  const NUDGED_WITH_PASS = 34;
  const NUDGED_WITHOUT_PASS = 40;
  const NEVER_TIME = 40;

  const WIN_PASS = ALWAYS + NUDGED;
  const NONWIN_PASS = ALWAYS;

  const WIN_TOTAL =
    ALWAYS * ALWAYS_TIME +
    NUDGED * NUDGED_WITH_PASS +
    NEVER * NEVER_TIME;

  const NONWIN_TOTAL =
    ALWAYS * ALWAYS_TIME +
    NUDGED * NUDGED_WITHOUT_PASS +
    NEVER * NEVER_TIME;

  const WIN_AVG = WIN_TOTAL / N;
  const NONWIN_AVG = NONWIN_TOTAL / N;

  const SHARE_GAP =
    WIN_PASS / N -
    NONWIN_PASS / N;

  const TIME_GAP =
    WIN_AVG - NONWIN_AVG;

  const IV_ESTIMATE =
    TIME_GAP / SHARE_GAP;

  const SAVING_PER_NUDGED =
    NUDGED_WITHOUT_PASS -
    NUDGED_WITH_PASS;

  const TOTAL_SAVING =
    NUDGED * SAVING_PER_NUDGED;

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone: picture above formula box.
  // Laptop: picture left, formula box right.
  //
  // Phone safe region:  y = -5.5 to 4.3.
  // Laptop safe region: y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;
  const PIC_W = P ? 7.0 : 7.10;

  const PILL = P
    ? [0, 3.65, 0]
    : [CX, 1.95, 0];

  const BOXP = P
    ? [0, -4.12, 0]
    : [4.25, -0.25, 0];

  const TITLE_Y = P ? 2.95 : 1.48;

  const ROW_Y = P
    ? [1.55, -0.75]
    : [0.55, -1.25];

  const ROW_H = P ? 1.95 : 1.60;

  const DOT_SP = P ? 0.59 : 0.59;

  const DOT_R = 0.105;
  const HALO_R = 0.215;
  const RING_R = 0.190;

  const BAR_LEFT = CX - 2.82;
  const BAR_MAX = 4.85;
  const BAR_H = P ? 0.33 : 0.29;

  const MINUTE_SCALE = BAR_MAX / 40;

  const TYPE_COLORS = {
    always: C.violet,
    nudged: C.green,
    never: C.muted
  };

  const ROW_COLORS = [
    C.cyan,
    C.violet
  ];

  const at = (x, y) => [x, y, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  function signed(n) {
    const value = Number(
      Math.abs(n).toFixed(2)
    );

    if (value === 0) return '0';

    return n < 0
      ? `−${value}`
      : `+${value}`;
  }

  function number(n) {
    return String(
      Number(n.toFixed(2))
    );
  }

  // ------------------------------------------------------------
  // Basic visual helpers
  // ------------------------------------------------------------

  function txt(
    s,
    size,
    color,
    p,
    mono = false,
    maxw = null
  ) {
    const t = T(s, size, color, mono);

    if (
      maxw !== null &&
      t.getWidth() > maxw
    ) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo(p);

    return t;
  }

  function rect(
    p,
    w,
    h,
    color = C.muted,
    opacity = 0,
    stroke = 1.5
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: stroke
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function line(
    a,
    b,
    color = C.muted,
    stroke = 2.5
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: stroke
    });
  }

  function dashed(
    a,
    b,
    color = C.muted,
    stroke = 2.0
  ) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: stroke
    });
  }

  function fadeAll(items) {
    return items
      .filter(Boolean)
      .map(m => new M.FadeOut(m));
  }

  function fadeInAll(items) {
    return items
      .filter(Boolean)
      .map(m => new M.FadeIn(m));
  }

  function lagIn(
    items,
    runTime = 0.85,
    lagRatio = 0.10
  ) {
    return new M.LaggedStart(
      items.map(m =>
        new M.FadeIn(m)
      ),
      { lagRatio, runTime }
    );
  }

  function lagIndicate(
    items,
    color,
    runTime = 0.90
  ) {
    return new M.LaggedStart(
      items.map(m =>
        new M.Indicate(m, { color })
      ),
      {
        lagRatio: 0.10,
        runTime
      }
    );
  }

  function tag(
    s,
    color,
    p,
    size = P ? 18 : 16
  ) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  function arrow(
    start,
    end,
    color,
    stroke = 2.8
  ) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const headL = Math.min(
      0.19,
      len * 0.35
    );

    const headW = 0.095;

    const bx = end[0] - ux * headL;
    const by = end[1] - uy * headL;

    return new M.VGroup(
      line(
        start,
        end,
        color,
        stroke
      ),

      line(
        at(
          bx - uy * headW,
          by + ux * headW
        ),
        end,
        color,
        stroke
      ),

      line(
        at(
          bx + uy * headW,
          by - ux * headW
        ),
        end,
        color,
        stroke
      )
    );
  }

  function checkMark(
    p,
    color = C.green
  ) {
    const [x, y] = p;

    return new M.VGroup(
      line(
        at(x - 0.12, y),
        at(x - 0.03, y - 0.11),
        color,
        3.5
      ),

      line(
        at(x - 0.03, y - 0.11),
        at(x + 0.18, y + 0.15),
        color,
        3.5
      )
    );
  }

  function cross(
    p,
    color = C.amber,
    radius = 0.15
  ) {
    const [x, y] = p;

    return new M.VGroup(
      line(
        at(x - radius, y - radius),
        at(x + radius, y + radius),
        color,
        4
      ),

      line(
        at(x - radius, y + radius),
        at(x + radius, y - radius),
        color,
        4
      )
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Every replacement is assembled before appearing.
  // Never regroup objects that are already on screen.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 21 : 20;
    const lh = P ? 0.37 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const maxw = P
      ? FW - 1.0
      : 4.55;

    const rawWidth = Math.max(
      ...texts.map(t => t.getWidth())
    );

    const scale = Math.min(
      1,
      (maxw - 0.64) /
      Math.max(rawWidth, 0.01)
    );

    texts.forEach(t => {
      if (scale < 1) {
        t.scale(scale);
      }
    });

    const wd = Math.max(
      2.20,
      Math.max(
        ...texts.map(t => t.getWidth() * Math.min(1, scale))
      ) + 0.64
    );

    const ht =
      rows.length * lh + 0.38;

    // Phone: hang the box from a fixed top edge so notes
    // above it are never covered.
    const cy = P
      ? Math.min(BOXP[1], -3.08 - ht / 2)
      : BOXP[1];

    const r = rect(
      at(BOXP[0], cy),
      wd,
      ht,
      color,
      0.96,
      2
    );

    const left =
      BOXP[0] - wd / 2 + 0.32;

    const top =
      cy + ht / 2 -
      0.19 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo(at(
        left + t.getWidth() * Math.min(1, scale) / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(
      r,
      ...texts
    );

    const a = [];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow)
      );
    }

    a.push(
      new M.FadeIn(g)
    );

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
  // Lottery and pass icons
  // ------------------------------------------------------------

  function ticket(
    p,
    label,
    color = C.amber,
    width = 2.35
  ) {
    const [x, y] = p;

    const r = rect(
      p,
      width,
      0.78,
      color,
      0.96,
      2
    );

    const separator = dashed(
      at(
        x + width / 2 - 0.40,
        y - 0.33
      ),

      at(
        x + width / 2 - 0.40,
        y + 0.33
      ),

      color,
      1.3
    );

    const t = txt(
      label,
      P ? 19 : 18,
      color,
      at(x - 0.13, y),
      true,
      width - 0.55
    );

    return new M.VGroup(
      r,
      separator,
      t
    );
  }

  function lotteryBall(
    p,
    label,
    color
  ) {
    const halo = new M.Dot({
      point: p,
      radius: 0.43,
      color
    });

    halo.setFill(color, 0.13);

    const r = new M.Circle({
      radius: 0.31,
      color,
      strokeWidth: 2.1
    });

    r.setFill(C.card, 0.96);
    r.moveTo(p);

    const t = txt(
      label,
      19,
      color,
      p,
      true,
      0.48
    );

    return new M.VGroup(
      halo,
      r,
      t
    );
  }

  const INTRO_Y = P ? 0.85 : -0.25;

  const drumP = at(
    CX,
    INTRO_Y + 0.26
  );

  const drum = rect(
    drumP,
    2.65,
    2.00,
    C.cyan,
    0.93,
    2.2
  );

  const drumTitle = txt(
    'FAIR DRAW',
    P ? 22 : 20,
    C.cyan,
    at(
      CX,
      drumP[1] + 0.69
    ),
    true,
    2.35
  );

  const balls = [
    lotteryBall(
      at(CX - 0.64, drumP[1] + 0.02),
      'A',
      C.violet
    ),

    lotteryBall(
      at(CX + 0.64, drumP[1] + 0.02),
      'B',
      C.cyan
    ),

    lotteryBall(
      at(CX, drumP[1] - 0.48),
      'C',
      C.amber
    )
  ];

  const lotteryTitle = txt(
    'A CITY LOTTERY FOR FREE PASSES',
    P ? 20 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const freeTicket = ticket(
    at(
      CX,
      INTRO_Y - 1.24
    ),
    'FREE PASS'
  );

  const drawArrow = arrow(
    at(
      CX,
      drumP[1] - 1.03
    ),

    at(
      CX,
      INTRO_Y - 0.81
    ),

    C.amber,
    2.5
  );

  const buyNote = txt(
    'Anyone may buy one',
    P ? 18 : 16,
    C.cyan,
    at(
      CX - 2.22,
      INTRO_Y - 0.22
    ),
    false,
    2.20
  );

  const declineNote = txt(
    'Winners may decline',
    P ? 18 : 16,
    C.violet,
    at(
      CX + 2.22,
      INTRO_Y - 0.22
    ),
    false,
    2.20
  );

  const buyArrow = arrow(
    at(
      CX - 2.12,
      INTRO_Y - 0.43
    ),

    at(
      CX - 1.12,
      INTRO_Y - 1.03
    ),

    C.cyan,
    2.3
  );

  const declineArrow = arrow(
    at(
      CX + 1.12,
      INTRO_Y - 1.03
    ),

    at(
      CX + 2.12,
      INTRO_Y - 0.43
    ),

    C.violet,
    2.3
  );

  const introQuestion = txt(
    'What does receiving a pass itself do?',
    P ? 20 : 18,
    C.green,
    at(
      CX,
      P ? -1.48 : -2.38
    ),
    false,
    PIC_W
  );

  const introObjects = [
    lotteryTitle,
    drum,
    drumTitle,
    ...balls,
    freeTicket,
    drawArrow,
    buyNote,
    declineNote,
    buyArrow,
    declineArrow,
    introQuestion
  ];

  // ------------------------------------------------------------
  // 0-2: the fair draw and optional receipt
  // ------------------------------------------------------------

  // 0: introduce the fair lottery.
  await until(S(0));
  await play(
    new M.FadeIn(lotteryTitle),
    new M.FadeIn(drum),
    new M.FadeIn(drumTitle),
    lagIn(balls, 0.85, 0.16),
    new M.FadeIn(drawArrow),
    new M.FadeIn(freeTicket),

    ...say(
      'A FAIR DRAW FOR A FREE PASS',
      C.green
    )
  );

  // 1: winning is not the same as receiving a pass.
  await until(S(1));
  await play(
    new M.FadeIn(buyNote),
    new M.FadeIn(declineNote),
    new M.FadeIn(buyArrow),
    new M.FadeIn(declineArrow),

    ...fbox([
      ['WINNING IS OPTIONAL RECEIPT', C.amber],
      'Anyone can buy a pass.',
      'Winners can decline.',
      'Winning ≠ receiving.'
    ], C.amber),

    ...say(
      'ANYONE CAN BUY • WINNERS CAN DECLINE',
      C.amber
    )
  );

  // 2: ask how winning helps identify the receipt effect.
  await until(S(2));
  await play(
    new M.FadeIn(introQuestion),

    ...fbox([
      ['THE QUESTION', C.green],
      'Can this fair draw help us',
      'estimate what receiving',
      'a pass does to travel time?'
    ], C.green),

    ...say(
      'CAN THE DRAW HELP US LEARN THE PASS EFFECT?',
      C.green
    )
  );

  // ------------------------------------------------------------
  // Commuter dots and pass rings
  //
  // Initially:
  //   Cyan dots = winners.
  //   Violet dots = nonwinners.
  //
  // Once response types are introduced:
  //   Violet = always gets a pass.
  //   Green = gets a pass only if they win.
  //   Muted = never gets a pass.
  //
  // Amber rings always mean actual pass receipt.
  // Row labels always identify lottery status.
  // ------------------------------------------------------------

  function glowDot(
    p,
    color,
    radius = DOT_R
  ) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.05,
      color
    });

    halo.setFill(
      color,
      0.17
    );

    const dot = new M.Dot({
      point: p,
      radius,
      color
    });

    dot.setFill(color, 1);

    return new M.VGroup(
      halo,
      dot
    );
  }

  function passRing(p) {
    const ring = new M.Circle({
      radius: RING_R,
      color: C.amber,
      strokeWidth: 2.6
    });

    ring.setFill(C.amber, 0);
    ring.moveTo(p);

    return ring;
  }

  function dotPosition(
    row,
    index
  ) {
    return at(
      CX + (index - 4.5) * DOT_SP,
      ROW_Y[row] + 0.10
    );
  }

  function typeFor(
    index,
    nudged = NUDGED
  ) {
    if (index < ALWAYS) {
      return 'always';
    }

    if (index < ALWAYS + nudged) {
      return 'nudged';
    }

    return 'never';
  }

  function receives(
    row,
    type
  ) {
    return (
      type === 'always' ||
      (
        type === 'nudged' &&
        row === 0
      )
    );
  }

  function timeFor(
    row,
    type,
    saving = SAVING_PER_NUDGED
  ) {
    if (type === 'always') {
      return ALWAYS_TIME;
    }

    if (type === 'never') {
      return NEVER_TIME;
    }

    return row === 0
      ? NUDGED_WITHOUT_PASS - saving
      : NUDGED_WITHOUT_PASS;
  }

  // ------------------------------------------------------------
  // Minute bars
  //
  // Bars share the same zero point and scale.
  // They describe the WHOLE lottery row,
  // including commuters without passes.
  // ------------------------------------------------------------

  function barY(row) {
    return ROW_Y[row] -
      (P ? 0.57 : 0.51);
  }

  function barBackground(row) {
    const r = new M.Rectangle({
      width: BAR_MAX,
      height: BAR_H,
      color: C.muted,
      strokeWidth: 1.1
    });

    r.setFill(C.card, 0.35);

    r.moveTo(at(
      BAR_LEFT + BAR_MAX / 2,
      barY(row)
    ));

    return r;
  }

  function minuteBar(
    row,
    value,
    color = ROW_COLORS[row]
  ) {
    const width =
      value * MINUTE_SCALE;

    const r = new M.Rectangle({
      width,
      height: BAR_H,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, 0.80);

    r.moveTo(at(
      BAR_LEFT + width / 2,
      barY(row)
    ));

    return r;
  }

  function averageLabel(
    row,
    value
  ) {
    return txt(
      `${number(value)} min`,
      P ? 18 : 17,
      ROW_COLORS[row],
      at(
        CX + 2.73,
        barY(row)
      ),
      true,
      1.22
    );
  }

  function wholeRowLabel(row) {
    return txt(
      'Whole-row average',
      P ? 15 : 14,
      C.muted,
      at(
        CX - 1.53,
        barY(row) + BAR_H / 2 + 0.14
      ),
      false,
      2.50
    );
  }

  // ------------------------------------------------------------
  // Lottery board
  //
  // Response types are illustrative latent types.
  // They are not labels that could ordinarily be recovered
  // simply by observing whether somebody won and got a pass.
  // ------------------------------------------------------------

  function makeBoard({
    nudged = NUDGED,
    saving = SAVING_PER_NUDGED,
    typesVisible = false,
    heading = 'TWO LOTTERY GROUPS'
  } = {}) {
    const rows = [0, 1].map(row => {
      const people = Array.from(
        { length: N },
        (_, index) => {
          const type = typeFor(
            index,
            nudged
          );

          const hasPass = receives(
            row,
            type
          );

          const p = dotPosition(
            row,
            index
          );

          const color = typesVisible
            ? TYPE_COLORS[type]
            : ROW_COLORS[row];

          return {
            row,
            index,
            type,
            pass: hasPass,
            position: p,

            mob: glowDot(
              p,
              color
            ),

            ring: hasPass
              ? passRing(p)
              : null,

            ringVisible: false
          };
        }
      );

      const passCount = people.filter(
        p => p.pass
      ).length;

      const total = people.reduce(
        (sum, p) =>
          sum + timeFor(
            row,
            p.type,
            saving
          ),
        0
      );

      const average = total / N;

      const frame = rect(
        at(CX, ROW_Y[row]),
        PIC_W,
        ROW_H,
        ROW_COLORS[row],
        0.10,
        1.5
      );

      const name = txt(
        row === 0
          ? 'WINNERS'
          : 'NONWINNERS',
        P ? 20 : 18,
        ROW_COLORS[row],
        at(
          CX - 1.97,
          ROW_Y[row] +
            ROW_H / 2 - 0.24
        ),
        true,
        2.70
      );

      const count = txt(
        '10 people',
        P ? 17 : 15,
        C.muted,
        at(
          CX + 2.08,
          ROW_Y[row] +
            ROW_H / 2 - 0.24
        ),
        true,
        2.05
      );

      const share = txt(
        `${passCount}/10 with pass`,
        P ? 17 : 16,
        C.amber,
        at(
          CX + 2.03,
          ROW_Y[row] +
            ROW_H / 2 - 0.24
        ),
        true,
        2.55
      );

      return {
        row,
        people,
        passCount,
        total,
        average,

        frame,
        name,
        count,
        share,

        labelIsShare: false,
        nameVisible: true,

        barBackground: barBackground(row),
        bar: minuteBar(row, average),
        barLabel: averageLabel(row, average),
        wholeLabel: wholeRowLabel(row),

        barBaseVisible: false,
        barVisible: false
      };
    });

    return {
      nudged,
      saving,
      typesVisible,
      rows,

      title: txt(
        heading,
        P ? 20 : 18,
        C.green,
        at(CX, TITLE_Y),
        true,
        PIC_W
      ),

      overlays: []
    };
  }

  function rowObjects(row) {
    return [
      row.frame,

      ...(row.nameVisible
        ? [row.name]
        : []),

      row.labelIsShare
        ? row.share
        : row.count,

      ...row.people.map(
        p => p.mob
      ),

      ...row.people
        .filter(p => p.ringVisible)
        .map(p => p.ring),

      ...(row.barBaseVisible
        ? [
            row.barBackground,
            row.wholeLabel
          ]
        : []),

      ...(row.barVisible
        ? [
            row.bar,
            row.barLabel
          ]
        : [])
    ].filter(Boolean);
  }

  function boardObjects(board) {
    return [
      board.title,
      ...board.rows.flatMap(rowObjects),
      ...board.overlays
    ];
  }

  function revealRow(row) {
    return [
      new M.FadeIn(row.frame),

      ...(row.nameVisible
        ? [new M.FadeIn(row.name)]
        : []),

      new M.FadeIn(row.count),

      lagIn(
        row.people.map(p => p.mob),
        0.95,
        0.065
      )
    ];
  }

  function revealPasses(row) {
    const holders = row.people.filter(
      p => p.pass
    );

    const a = [];

    holders.forEach(p => {
      if (!p.ringVisible) {
        p.ringVisible = true;

        a.push(
          new M.Create(p.ring)
        );
      }
    });

    return a.length
      ? [
          new M.LaggedStart(
            a,
            {
              lagRatio: 0.10,
              runTime: 0.95
            }
          )
        ]
      : [];
  }

  function showShare(row) {
    if (row.labelIsShare) {
      return [
        new M.Indicate(
          row.share,
          { color: C.amber }
        )
      ];
    }

    row.labelIsShare = true;

    return [
      new M.FadeOut(row.count),
      new M.FadeIn(row.share)
    ];
  }

  function revealBarBase(row) {
    if (row.barBaseVisible) {
      return [];
    }

    row.barBaseVisible = true;

    return [
      new M.FadeIn(
        row.barBackground
      ),

      new M.FadeIn(
        row.wholeLabel
      )
    ];
  }

  function revealBar(row) {
    const a = revealBarBase(row);

    row.barVisible = true;

    a.push(
      new M.FadeIn(row.bar),
      new M.FadeIn(row.barLabel)
    );

    return a;
  }

  function revealCompleteBoard(board) {
    const a = [
      new M.FadeIn(board.title)
    ];

    board.rows.forEach(row => {
      // Prepare visibility flags before this complete reveal.
      row.nameVisible = true;
      row.labelIsShare = true;

      a.push(
        new M.FadeIn(row.frame),
        new M.FadeIn(row.name),
        new M.FadeIn(row.share),

        lagIn(
          row.people.map(p => p.mob),
          0.85,
          0.045
        ),

        ...revealPasses(row),
        ...revealBar(row)
      );
    });

    return a;
  }

  function changeTitle(
    board,
    s,
    color = C.green
  ) {
    const old = board.title;

    board.title = txt(
      s,
      P ? 20 : 18,
      color,
      at(CX, TITLE_Y),
      true,
      PIC_W
    );

    return [
      new M.FadeOut(old),
      new M.FadeIn(board.title)
    ];
  }

  function rowOutline(
    row,
    color = C.green
  ) {
    return rect(
      at(CX, ROW_Y[row]),
      PIC_W + 0.06,
      ROW_H + 0.06,
      color,
      0,
      2.3
    );
  }

  // ------------------------------------------------------------
  // 3-7: build the two lottery rows and reveal pass receipt
  // ------------------------------------------------------------

  let board = makeBoard();

  // Introduce the second row's name on sentence 4.
  board.rows[1].nameVisible = false;

  let winners = board.rows[0];
  let nonwinners = board.rows[1];

  // 3: ten winners and ten people who did not win.
  await until(S(3));
  await play(
    ...fadeAll(introObjects),
    ...clearBox(),

    new M.FadeIn(board.title),
    ...revealRow(winners),
    ...revealRow(nonwinners),

    ...say(
      'TEN PEOPLE IN EACH LOTTERY ROW',
      C.green
    )
  );

  // 4: call the second group nonwinners.
  nonwinners.nameVisible = true;

  await until(S(4));
  await play(
    new M.FadeIn(nonwinners.name),

    ...fbox([
      ['TWO ROWS', C.green],
      ['Winners: 10 people', C.cyan],
      ['Nonwinners: 10 people', C.violet],
      'Grouped by the lottery result.'
    ], C.green),

    ...say(
      'THE SECOND ROW: NONWINNERS',
      C.violet
    )
  );

  const ringLegend = tag(
    'AMBER RING = RECEIVED PASS',
    C.amber,
    P
      ? at(CX, -2.20)
      : at(4.25, 1.15),
    P ? 17 : 15
  );

  // 5: circle people who ended up with passes.
  await until(S(5));
  await play(
    new M.FadeIn(ringLegend),

    ...revealPasses(winners),
    ...revealPasses(nonwinners),

    ...fbox([
      ['PASS RECEIPT', C.amber],
      'A circle means the person',
      'actually got a pass.',
      'Not simply that they won.'
    ], C.amber),

    ...say(
      'CIRCLE THE PEOPLE WHO RECEIVED PASSES',
      C.amber
    )
  );

  // 6: eight winners have pass rings.
  await until(S(6));
  await play(
    ...showShare(winners),

    ...fbox([
      ['WINNERS', C.cyan],
      ['8 with passes', C.amber],
      '2 without passes',
      '10 people altogether.'
    ], C.cyan),

    ...say(
      'EIGHT WINNERS GOT A PASS',
      C.cyan
    )
  );

  // 7: three nonwinners have pass rings.
  await until(S(7));
  await play(
    ...showShare(nonwinners),

    ...fbox([
      ['NONWINNERS', C.violet],
      ['3 with passes', C.amber],
      '7 without passes',
      '10 people altogether.'
    ], C.violet),

    ...say(
      'THREE NONWINNERS GOT A PASS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 8-10: whole-row average commute times
  // ------------------------------------------------------------

  // 8: show a time bar for the entire winner row.
  await until(S(8));
  await play(
    ...revealBarBase(winners),

    ...fbox([
      ['AVERAGE COMMUTE TIME', C.green],
      'Include all 10 winners.',
      'Both pass holders and',
      'people without passes.'
    ], C.green),

    ...say(
      'THE TIME BAR DESCRIBES THE WHOLE ROW',
      C.green
    )
  );

  // 9: winner average is 34 minutes.
  await until(S(9));
  await play(
    ...revealBar(winners),

    ...fbox([
      ['ALL WINNERS', C.cyan],
      '10 people',
      ['Average = 34 minutes', C.cyan]
    ], C.cyan),

    ...say(
      'WINNER AVERAGE: 34 MINUTES',
      C.cyan
    )
  );

  // 10: nonwinner average is 37 minutes.
  await until(S(10));
  await play(
    ...revealBar(nonwinners),

    ...fbox([
      ['WHOLE-ROW AVERAGES', C.green],
      ['Winners:    34 minutes', C.cyan],
      ['Nonwinners: 37 minutes', C.violet],
      'All 10 people in each row.'
    ], C.green),

    ...say(
      'NONWINNER AVERAGE: 37 MINUTES',
      C.violet
    )
  );

  board.overlays.push(ringLegend);

  // ------------------------------------------------------------
  // Response-type illustrations
  //
  // Three always-takers.
  // Five people nudged by winning.
  // Two never-takers.
  //
  // This is one exact illustrative composition consistent
  // with the observed totals, not observed individual types.
  // ------------------------------------------------------------

  function typePeople(
    board,
    type
  ) {
    return board.rows.flatMap(row =>
      row.people.filter(
        p => p.type === type
      )
    );
  }

  function typeBounds(
    type,
    nudged = NUDGED
  ) {
    if (type === 'always') {
      return [0, ALWAYS - 1];
    }

    if (type === 'nudged') {
      return [
        ALWAYS,
        ALWAYS + nudged - 1
      ];
    }

    return [
      ALWAYS + nudged,
      N - 1
    ];
  }

  function typeOutline(
    row,
    type,
    nudged = NUDGED,
    color = TYPE_COLORS[type]
  ) {
    const [first, last] =
      typeBounds(type, nudged);

    if (last < first) {
      return null;
    }

    const x1 = dotPosition(
      row,
      first
    )[0];

    const x2 = dotPosition(
      row,
      last
    )[0];

    return rect(
      at(
        (x1 + x2) / 2,
        ROW_Y[row] + 0.10
      ),

      x2 - x1 + 0.49,

      P ? 0.57 : 0.52,

      color,
      0,
      2.0
    );
  }

  function typeFrames(
    board,
    type,
    color = TYPE_COLORS[type]
  ) {
    return [0, 1]
      .map(row =>
        typeOutline(
          row,
          type,
          board.nudged,
          color
        )
      )
      .filter(Boolean);
  }

  function revealType(
    board,
    type
  ) {
    const people = typePeople(
      board,
      type
    );

    const transforms = people.map(p =>
      new M.Transform(
        p.mob,

        glowDot(
          p.position,
          TYPE_COLORS[type]
        ),

        { runTime: 0.70 }
      )
    );

    return [
      new M.LaggedStart(
        transforms,
        {
          lagRatio: 0.055,
          runTime: 0.95
        }
      )
    ];
  }

  function typeLegend() {
    const labels = [
      {
        title: 'Always',
        sub: '3',
        color: TYPE_COLORS.always,
        x: CX - 2.30
      },

      {
        title: 'Only if win',
        sub: '5',
        color: TYPE_COLORS.nudged,
        x: CX
      },

      {
        title: 'Never',
        sub: '2',
        color: TYPE_COLORS.never,
        x: CX + 2.30
      }
    ];

    const y = P ? -2.30 : -2.48;

    return labels.map(d => {
      const r = rect(
        at(d.x, y),
        2.10,
        0.47,
        d.color,
        0.94,
        1.4
      );

      const dot = glowDot(
        at(d.x - 0.79, y),
        d.color,
        0.065
      );

      const t = txt(
        `${d.sub} ${d.title}`,
        P ? 15 : 14,
        d.color,
        at(d.x + 0.13, y),
        false,
        1.62
      );

      return new M.VGroup(
        r,
        dot,
        t
      );
    });
  }

  let activeTypeFrames = [];

  // ------------------------------------------------------------
  // 11-15: explain the nudge using the exact response types
  // ------------------------------------------------------------

  // 11: the lottery nudges pass receipt.
  await until(S(11));
  await play(
    ...changeTitle(
      board,
      'THE DRAW IS A NUDGE'
    ),

    new M.Indicate(
      winners.share,
      { color: C.amber }
    ),

    new M.Indicate(
      nonwinners.share,
      { color: C.amber }
    ),

    ...fbox([
      ['A NUDGE', C.green],
      'Winning makes receiving',
      'a pass more likely.',
      'But it does not decide',
      'every person’s receipt.'
    ], C.green),

    ...say(
      'THE DRAW NUDGES PEOPLE TOWARD RECEIPT',
      C.green
    )
  );

  // 12: three people in each row would get a pass either way.
  activeTypeFrames = typeFrames(
    board,
    'always'
  );

  const typeExampleNote = txt(
    'One illustrative composition of each row',
    P ? 18 : 15,
    C.muted,
    P
      ? at(CX, -2.18)
      : at(4.25, 1.15),
    false,
    P ? PIC_W : 4.55
  );

  await until(S(12));
  await play(
    new M.FadeOut(ringLegend),
    new M.FadeIn(typeExampleNote),

    ...changeTitle(
      board,
      'ILLUSTRATIVE RESPONSE TYPES'
    ),

    ...revealType(
      board,
      'always'
    ),

    ...activeTypeFrames.map(
      r => new M.Create(r)
    ),

    ...fbox([
      ['ALWAYS GET A PASS', C.violet],
      '3 people in each row.',
      'Get a pass if they win.',
      'Also get one if they lose.',
      ['The draw changes nothing.', C.muted]
    ], C.violet),

    ...say(
      'THREE WOULD GET A PASS EITHER WAY',
      C.violet
    )
  );

  board.overlays = [
    typeExampleNote
  ];

  // 13: two people in each row would go without either way.
  const neverFrames = typeFrames(
    board,
    'never'
  );

  await until(S(13));
  await play(
    ...fadeAll(activeTypeFrames),

    ...revealType(
      board,
      'never'
    ),

    ...neverFrames.map(
      r => new M.Create(r)
    ),

    ...fbox([
      ['NEVER GET A PASS', C.muted],
      '2 people in each row.',
      'No pass if they win.',
      'No pass if they lose.',
      'The draw changes nothing.'
    ], C.muted),

    ...say(
      'TWO WOULD GO WITHOUT EITHER WAY',
      C.muted
    )
  );

  activeTypeFrames = neverFrames;

  // 14: the remaining five get a pass only when they win.
  const nudgedFrames = typeFrames(
    board,
    'nudged',
    C.green
  );

  await until(S(14));
  await play(
    ...fadeAll(activeTypeFrames),

    ...revealType(
      board,
      'nudged'
    ),

    ...nudgedFrames.map(
      r => new M.Create(r)
    ),

    ...fbox([
      ['GET A PASS ONLY IF THEY WIN', C.green],
      '5 people in each row.',
      ['Winners: receive a pass.', C.amber],
      'Nonwinners: no pass.',
      ['Winning changes receipt.', C.green]
    ], C.green),

    ...say(
      'FIVE GET A PASS ONLY IF THEY WIN',
      C.green
    )
  );

  activeTypeFrames = nudgedFrames;
  board.typesVisible = true;

  // 15: the response types explain the different pass counts.
  const responseLegend = typeLegend();

  await until(S(15));
  await play(
    ...fadeAll(activeTypeFrames),
    new M.FadeOut(typeExampleNote),

    lagIn(
      responseLegend,
      0.75,
      0.14
    ),

    ...fbox([
      ['WHY PASS COUNTS DIFFER', C.green],
      ['Winners: 3 + 5 = 8', C.cyan],
      ['Nonwinners: 3 + 0 = 3', C.violet],
      ['Five additional passes.', C.amber],
      'Same illustrative types.'
    ], C.green),

    ...say(
      'THREE PLUS FIVE MAKES EIGHT',
      C.amber
    )
  );

  activeTypeFrames = [];
  board.overlays = responseLegend;

  // ------------------------------------------------------------
  // Causal diagram helpers
  //
  // Winning the draw -> Pass receipt -> Commute time.
  //
  // This diagram represents the identifying assumptions.
  // The draw is an instrument for receipt, not a substitute
  // definition of receipt.
  // ------------------------------------------------------------

  const DIAGRAM_Y = P ? 0.85 : -0.25;

  const NODE_W = 2.03;
  const NODE_H = P ? 1.12 : 0.98;

  const Z_P = at(
    CX - 2.42,
    DIAGRAM_Y
  );

  const D_P = at(
    CX,
    DIAGRAM_Y
  );

  const Y_P = at(
    CX + 2.42,
    DIAGRAM_Y
  );

  function causalNode(
    title,
    subtitle,
    p,
    color
  ) {
    const r = rect(
      p,
      NODE_W,
      NODE_H,
      color,
      0.97,
      2
    );

    const a = txt(
      title,
      P ? 19 : 18,
      color,
      at(
        p[0],
        p[1] + 0.18
      ),
      false,
      NODE_W - 0.18
    );

    const b = txt(
      subtitle,
      P ? 15 : 14,
      C.ink,
      at(
        p[0],
        p[1] - 0.19
      ),
      false,
      NODE_W - 0.18
    );

    return new M.VGroup(
      r,
      a,
      b
    );
  }

  function diagramArrow(
    a,
    b,
    color
  ) {
    return arrow(
      at(
        a[0] + NODE_W / 2 + 0.025,
        a[1]
      ),

      at(
        b[0] - NODE_W / 2 - 0.025,
        b[1]
      ),

      color,
      3.0
    );
  }

  function makeDiagram() {
    return {
      win: causalNode(
        'Win the draw',
        'Yes or no',
        Z_P,
        C.violet
      ),

      pass: causalNode(
        'Pass receipt',
        'Yes or no',
        D_P,
        C.amber
      ),

      time: causalNode(
        'Commute time',
        'Minutes to work',
        Y_P,
        C.cyan
      ),

      a1: diagramArrow(
        Z_P,
        D_P,
        C.violet
      ),

      a2: diagramArrow(
        D_P,
        Y_P,
        C.amber
      )
    };
  }

  function diagramObjects(g) {
    return [
      g.win,
      g.pass,
      g.time,
      g.a1,
      g.a2
    ];
  }

  function instrumentOutline() {
    return rect(
      Z_P,
      NODE_W + 0.20,
      NODE_H + 0.20,
      C.green,
      0,
      2.6
    );
  }

  // ------------------------------------------------------------
  // 16-18: define a variable and an instrumental variable
  // ------------------------------------------------------------

  let graph = makeDiagram();

  const variableTitle = txt(
    'RECORDED DETAILS CAN DIFFER',
    P ? 20 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const variableExamples = [
    txt(
      'Win: yes / no',
      P ? 17 : 16,
      C.violet,
      at(
        Z_P[0],
        DIAGRAM_Y - 0.87
      ),
      true,
      2.05
    ),

    txt(
      'Pass: yes / no',
      P ? 17 : 16,
      C.amber,
      at(
        D_P[0],
        DIAGRAM_Y - 0.87
      ),
      true,
      2.05
    ),

    txt(
      'Time: minutes',
      P ? 17 : 16,
      C.cyan,
      at(
        Y_P[0],
        DIAGRAM_Y - 0.87
      ),
      true,
      2.05
    )
  ];

  // 16: a variable is a recorded detail that can differ.
  await until(S(16));
  await play(
    ...fadeAll(boardObjects(board)),

    new M.FadeIn(variableTitle),

    lagIn(
      [
        graph.win,
        graph.pass,
        graph.time
      ],
      0.90,
      0.13
    ),

    lagIn(
      variableExamples,
      0.80,
      0.12
    ),

    ...fbox([
      ['VARIABLE', C.green],
      'A recorded detail that',
      'can differ from one',
      'person to another.'
    ], C.green),

    ...say(
      'VARIABLE = A DETAIL THAT CAN DIFFER',
      C.green
    )
  );

  const instrumentTitle = txt(
    'INSTRUMENTAL VARIABLE',
    P ? 22 : 20,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const instrumentTag = tag(
    'INSTRUMENT',
    C.green,
    at(
      Z_P[0],
      DIAGRAM_Y + 0.88
    ),
    P ? 16 : 15
  );

  // 17: name the instrumental variable.
  await until(S(17));
  await play(
    new M.FadeOut(variableTitle),
    new M.FadeIn(instrumentTitle),

    new M.FadeIn(graph.a1),
    new M.FadeIn(graph.a2),
    new M.FadeIn(instrumentTag),

    ...fbox([
      ['INSTRUMENTAL VARIABLE', C.green],
      'A nudge we can use',
      'to learn about an effect,',
      'under suitable conditions.'
    ], C.green),

    ...say(
      'A USEFUL NUDGE IS AN INSTRUMENT',
      C.green
    )
  );

  const instrumentFrame =
    instrumentOutline();

  // 18: winning the draw is the instrument.
  await until(S(18));
  await play(
    new M.Create(instrumentFrame),

    new M.Indicate(
      graph.win,
      { color: C.green }
    ),

    ...fbox([
      ['OUR INSTRUMENT', C.violet],
      'Winning the draw.',
      'It nudges pass receipt.',
      'We want the effect',
      ['of receipt on commute time.', C.cyan]
    ], C.green),

    ...say(
      'WINNING THE DRAW IS THE INSTRUMENT',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 19-23: measure the strength of the nudge
  //
  // First-stage difference:
  // 8/10 - 3/10 = 5/10 = 0.50.
  // ------------------------------------------------------------

  board = makeBoard({
    typesVisible: true,
    heading: 'MEASURE THE NUDGE'
  });

  winners = board.rows[0];
  nonwinners = board.rows[1];

  function passCountOutline(
    row,
    count,
    color = C.amber
  ) {
    const x1 = dotPosition(
      row,
      0
    )[0];

    const x2 = dotPosition(
      row,
      count - 1
    )[0];

    return rect(
      at(
        (x1 + x2) / 2,
        ROW_Y[row] + 0.10
      ),

      x2 - x1 + 0.49,

      P ? 0.57 : 0.52,

      color,
      0,
      2.3
    );
  }

  const winCountFrame =
    passCountOutline(
      0,
      WIN_PASS,
      C.amber
    );

  const nonwinCountFrame =
    passCountOutline(
      1,
      NONWIN_PASS,
      C.amber
    );

  // 19: return to the two rows to measure the nudge.
  await until(S(19));
  await play(
    ...fadeAll([
      ...diagramObjects(graph),
      ...variableExamples,
      instrumentTitle,
      instrumentTag,
      instrumentFrame
    ]),

    ...revealCompleteBoard(board),

    ...fbox([
      ['HOW STRONG WAS THE NUDGE?', C.green],
      'Compare the fraction',
      'getting a pass in each',
      'lottery row.'
    ], C.green),

    ...say(
      'MEASURE THE CHANGE IN PASS RECEIPT',
      C.green
    )
  );

  // 20: eight out of ten winners received a pass.
  await until(S(20));
  await play(
    new M.Create(winCountFrame),

    new M.Indicate(
      winners.share,
      { color: C.amber }
    ),

    ...fbox([
      ['WINNER PASS SHARE', C.cyan],
      '8 with passes',
      '÷ 10 winners',
      ['8/10 = 0.80', C.amber],
      '= 80%'
    ], C.cyan),

    ...say(
      'EIGHT OUT OF TEN WINNERS',
      C.cyan
    )
  );

  // 21: three out of ten nonwinners received a pass.
  await until(S(21));
  await play(
    new M.Create(nonwinCountFrame),

    new M.Indicate(
      nonwinners.share,
      { color: C.amber }
    ),

    ...fbox([
      ['NONWINNER PASS SHARE', C.violet],
      '3 with passes',
      '÷ 10 nonwinners',
      ['3/10 = 0.30', C.amber],
      '= 30%'
    ], C.violet),

    ...say(
      'THREE OUT OF TEN NONWINNERS',
      C.violet
    )
  );

  const extraPassFrames = typeFrames(
    board,
    'nudged',
    C.green
  );

  // 22: winning produces five more passes per ten people.
  await until(S(22));
  await play(
    new M.FadeOut(winCountFrame),
    new M.FadeOut(nonwinCountFrame),

    ...extraPassFrames.map(
      r => new M.Create(r)
    ),

    ...fbox([
      ['EXTRA PASS RECEIPT', C.green],
      '8 − 3',
      ['= 5 extra passes', C.amber],
      'For every 10 people.'
    ], C.green),

    ...say(
      'FIVE EXTRA PASSES PER TEN PEOPLE',
      C.green
    )
  );

  // 23: the difference in pass shares is one half.
  await until(S(23));
  await play(
    ...fbox([
      ['DIFFERENCE IN PASS SHARES', C.green],
      '8/10 − 3/10',
      '= 5/10',
      ['= 1/2 = 0.50', C.amber],
      '50 percentage points.'
    ], C.green),

    ...say(
      'FIVE OUT OF TEN IS ONE HALF',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 24-25: compare the whole-row time bars
  //
  // Reduced-form difference:
  // 34 - 37 = -3 minutes.
  // ------------------------------------------------------------

  function barOutline(
    row,
    color
  ) {
    return rect(
      at(
        CX,
        barY(row)
      ),

      PIC_W - 0.30,

      P ? 0.49 : 0.43,

      color,
      0,
      2.1
    );
  }

  const wholeTimeFrames = [
    barOutline(
      0,
      C.cyan
    ),

    barOutline(
      1,
      C.violet
    )
  ];

  // 24: switch attention from the receipt counts to time.
  await until(S(24));
  await play(
    ...fadeAll(extraPassFrames),

    ...wholeTimeFrames.map(
      r => new M.Create(r)
    ),

    ...fbox([
      ['COMPARE THE WHOLE ROWS', C.green],
      ['Winners: 34 minutes', C.cyan],
      ['Nonwinners: 37 minutes', C.violet],
      'Include all ten in each row.'
    ], C.green),

    ...say(
      'NOW COMPARE THE WHOLE-ROW TIME BARS',
      C.green
    )
  );

  const timeDifferenceTag = tag(
    'TIME GAP: −3 MIN',
    C.amber,
    P
      ? at(CX, -2.22)
      : at(4.25, 1.15),
    P ? 18 : 16
  );

  // 25: 34 minus 37 equals negative three.
  await until(S(25));
  await play(
    new M.FadeIn(timeDifferenceTag),

    ...fbox([
      ['DIFFERENCE IN AVERAGE TIME', C.green],
      'Winner average',
      '− Nonwinner average',
      '34 − 37',
      ['= −3 minutes', C.amber]
    ], C.green),

    ...say(
      'THIRTY-FOUR MINUS THIRTY-SEVEN IS −3',
      C.amber
    )
  );

  board.overlays.push(
    timeDifferenceTag
  );

  // ------------------------------------------------------------
  // 26: a fair draw makes the groups comparable on average
  //
  // Fair randomization does not guarantee perfect equality
  // in a particular small draw.
  //
  // Our exact type composition is a balanced illustration.
  // ------------------------------------------------------------

  const fairFrames = [
    rowOutline(
      0,
      C.green
    ),

    rowOutline(
      1,
      C.green
    )
  ];

  // 26: compare the two rows under a fair lottery.
  await until(S(26));
  await play(
    ...fadeAll(wholeTimeFrames),

    ...fairFrames.map(
      r => new M.Create(r)
    ),

    ...fbox([
      ['A FAIR DRAW', C.green],
      'The groups should be alike',
      'on average in other ways.',
      'Not necessarily identical',
      'in every small draw.'
    ], C.green),

    ...say(
      'FAIR RANDOMIZATION BALANCES GROUPS ON AVERAGE',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 27: identify the people whose receipt changes
  // ------------------------------------------------------------

  const fiveNudgedFrames = typeFrames(
    board,
    'nudged',
    C.green
  );

  await until(S(27));
  await play(
    ...fadeAll(fairFrames),

    ...fiveNudgedFrames.map(
      r => new M.Create(r)
    ),

    lagIndicate(
      typePeople(
        board,
        'nudged'
      ).map(p => p.mob),
      C.green,
      1.0
    ),

    ...fbox([
      ['WHO CHANGES RECEIPT?', C.green],
      '5 out of 10 people.',
      'The always and never groups',
      'do not change receipt.',
      ['The other five are nudged.', C.green]
    ], C.green),

    ...say(
      'WINNING CHANGES WHAT FIVE OUT OF TEN DO',
      C.green
    )
  );

  // ------------------------------------------------------------
  // Saving illustration
  //
  // Each glowing square represents ONE MINUTE saved.
  //
  // First picture:
  //   Five people, six squares per person.
  //
  // Second picture:
  //   Ten people, three squares per person.
  //
  // The exact same thirty squares move between pictures.
  //
  // Spreading is arithmetic averaging, not a claim that
  // every commuter actually saves three minutes.
  // ------------------------------------------------------------

  const SHARE_BASE = P ? -1.50 : -1.89;

  const SHARE_CELL = P ? 0.205 : 0.185;
  const SHARE_PITCH = P ? 0.27 : 0.235;

  function savingColumnX(
    column,
    count
  ) {
    const pitch = count === 5
      ? 1.10
      : 0.59;

    return CX +
      (
        column -
        (count - 1) / 2
      ) * pitch;
  }

  function savingPosition(
    column,
    level,
    count
  ) {
    return at(
      savingColumnX(
        column,
        count
      ),

      SHARE_BASE +
        (level + 0.5) *
        SHARE_PITCH
    );
  }

  function minuteSquare(p) {
    const halo = new M.Dot({
      point: p,
      radius: SHARE_CELL * 0.83,
      color: C.green
    });

    halo.setFill(
      C.green,
      0.11
    );

    const r = new M.Rectangle({
      width: SHARE_CELL,
      height: SHARE_CELL,
      color: C.green,
      strokeWidth: 1.1
    });

    r.setFill(
      C.green,
      0.90
    );

    r.moveTo(p);

    return new M.VGroup(
      halo,
      r
    );
  }

  function makeSavingColumns(
    people,
    minutesEach
  ) {
    const markers = [];
    const labels = [];
    const cells = [];

    for (
      let k = 0;
      k < people;
      k++
    ) {
      const x = savingColumnX(
        k,
        people
      );

      const p = at(
        x,
        SHARE_BASE - 0.31
      );

      markers.push(
        glowDot(
          p,
          C.green,
          0.085
        )
      );

      labels.push(
        txt(
          String(minutesEach),
          P ? 17 : 16,
          C.green,
          at(
            x,

            SHARE_BASE +
              minutesEach *
              SHARE_PITCH +
              0.26
          ),
          true,
          0.48
        )
      );

      for (
        let j = 0;
        j < minutesEach;
        j++
      ) {
        const pos =
          savingPosition(
            k,
            j,
            people
          );

        cells.push({
          column: k,
          level: j,
          position: pos,
          mob: minuteSquare(pos)
        });
      }
    }

    return {
      people,
      minutesEach,
      markers,
      labels,
      cells
    };
  }

  const savingTitle = txt(
    'SAVINGS FOR THE FIVE NUDGED PEOPLE',
    P ? 19 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const savingSubtitle = txt(
    'Each square represents one minute saved',
    P ? 17 : 16,
    C.muted,
    at(
      CX,
      P ? 2.32 : 0.99
    ),
    false,
    PIC_W
  );

  let savings =
    makeSavingColumns(
      NUDGED,
      SAVING_PER_NUDGED
    );

  const savingPeopleLabel = txt(
    '5 people whose receipt changes',
    P ? 17 : 16,
    C.green,
    at(
      CX,
      SHARE_BASE - 0.78
    ),
    false,
    PIC_W
  );

  // ------------------------------------------------------------
  // 28-30: six minutes each, thirty minutes in all,
  // spread across the entire ten-person row
  // ------------------------------------------------------------

  // 28: picture five people saving six minutes each.
  await until(S(28));
  await play(
    ...fadeAll([
      ...boardObjects(board),
      ...fiveNudgedFrames
    ]),

    new M.FadeIn(savingTitle),
    new M.FadeIn(savingSubtitle),
    new M.FadeIn(savingPeopleLabel),

    lagIn(
      savings.markers,
      0.60,
      0.12
    ),

    lagIn(
      savings.cells.map(
        c => c.mob
      ),
      1.40,
      0.025
    ),

    ...fadeInAll(
      savings.labels
    ),

    ...fbox([
      ['THE FIVE NUDGED PEOPLE', C.green],
      'Without pass: 40 minutes',
      'With pass:    34 minutes',
      '40 − 34',
      ['= 6 minutes saved each', C.green]
    ], C.green),

    ...say(
      'PICTURE SIX MINUTES SAVED BY EACH NUDGED PERSON',
      C.green
    )
  );

  function savingTotalOutline(
    people,
    minutesEach,
    color = C.green
  ) {
    const left =
      savingColumnX(0, people) -
      0.23;

    const right =
      savingColumnX(
        people - 1,
        people
      ) + 0.23;

    const bottom =
      SHARE_BASE - 0.08;

    const top =
      SHARE_BASE +
      minutesEach *
      SHARE_PITCH +
      0.11;

    return rect(
      at(
        (left + right) / 2,
        (top + bottom) / 2
      ),

      right - left,
      top - bottom,
      color,
      0,
      2.1
    );
  }

  const thirtyFrame =
    savingTotalOutline(
      5,
      6,
      C.green
    );

  const totalSavingTag = tag(
    '30 MINUTES IN ALL',
    C.amber,
    at(
      CX,
      P ? 0.95 : 0.25
    ),
    P ? 19 : 17
  );

  // 29: five times six equals thirty.
  await until(S(29));
  await play(
    new M.Create(thirtyFrame),
    new M.FadeIn(totalSavingTag),

    ...fbox([
      ['TOTAL SAVING', C.green],
      '5 people',
      '× 6 minutes each',
      ['= 30 minutes', C.amber]
    ], C.green),

    ...say(
      'FIVE TIMES SIX MAKES THIRTY MINUTES',
      C.amber
    )
  );

  // 30: redistribute the same thirty minute squares.
  //
  // Each original column has six squares.
  // Each new column receives three squares.
  //
  // No square is created or removed in the redistribution.

  const spread = makeSavingColumns(
    10,
    3
  );

  const spreadTitle = txt(
    'SPREAD THE SAVING ACROSS ALL TEN',
    P ? 19 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const spreadPeopleLabel = txt(
    'Arithmetic average across the whole row',
    P ? 17 : 16,
    C.muted,
    at(
      CX,
      SHARE_BASE - 0.78
    ),
    false,
    PIC_W
  );

  const spreadFrame =
    savingTotalOutline(
      10,
      3,
      C.green
    );

  await until(S(30));
  await play(
    new M.FadeOut(savingTitle),
    new M.FadeIn(spreadTitle),

    new M.FadeOut(
      savingPeopleLabel
    ),

    new M.FadeIn(
      spreadPeopleLabel
    ),

    new M.FadeOut(thirtyFrame),

    ...fadeAll(savings.markers),
    ...fadeAll(savings.labels),

    lagIn(
      spread.markers,
      0.80,
      0.07
    ),

    new M.LaggedStart(
      savings.cells.map((cell, i) =>
        new M.Transform(
          cell.mob,

          minuteSquare(
            spread.cells[i].position
          ),

          {
            pathArc: i % 2
              ? -0.15
              : 0.15
          }
        )
      ),

      {
        lagRatio: 0.018,
        runTime: 1.65
      }
    ),

    ...fadeInAll(spread.labels),

    new M.Create(spreadFrame),

    ...fbox([
      ['SPREAD ACROSS TEN PEOPLE', C.green],
      '30 minutes in all',
      '÷ 10 people',
      ['= 3 minutes per person', C.amber],
      'A whole-row average saving.'
    ], C.green),

    ...say(
      'THIRTY SHARED ACROSS TEN IS THREE EACH',
      C.green
    )
  );

  // Retain the actual transformed objects, not their targets.
  spread.cells.forEach((cell, i) => {
    cell.mob = savings.cells[i].mob;
  });

  savings = spread;

  // ------------------------------------------------------------
  // 31-32: reverse the spreading
  //
  // Whole-row saving = 3 minutes.
  // Fraction whose receipt changes = 5/10 = 1/2.
  //
  // Saving per nudged person = 3 / (1/2) = 6.
  //
  // Signed effect on time = -3 / 0.50 = -6.
  // ------------------------------------------------------------

  const reverseTitle = txt(
    'UNDO THE SPREADING',
    P ? 22 : 20,
    C.green,
    at(CX, TITLE_Y),
    true
  );

  // 31: run the calculation backward.
  await until(S(31));
  await play(
    new M.FadeOut(spreadTitle),
    new M.FadeIn(reverseTitle),

    new M.Indicate(
      totalSavingTag,
      { color: C.amber }
    ),

    ...fbox([
      ['RUN THE CALCULATION BACKWARD', C.green],
      'We observed 3 minutes',
      'saved per person overall.',
      'Only half were nudged.',
      'Undo that averaging.'
    ], C.green),

    ...say(
      'RUN THE SHARING CALCULATION BACKWARD',
      C.green
    )
  );

  const restored =
    makeSavingColumns(
      5,
      6
    );

  const restoredFrame =
    savingTotalOutline(
      5,
      6,
      C.green
    );

  const restoredPeopleLabel = txt(
    '5 nudged people • 6 minutes each',
    P ? 17 : 16,
    C.green,
    at(
      CX,
      SHARE_BASE - 0.78
    ),
    false,
    PIC_W
  );

  // 32: divide by one half to undo the spreading.
  await until(S(32));
  await play(
    new M.FadeOut(spreadFrame),

    new M.FadeOut(
      spreadPeopleLabel
    ),

    new M.FadeIn(
      restoredPeopleLabel
    ),

    ...fadeAll(savings.markers),
    ...fadeAll(savings.labels),

    lagIn(
      restored.markers,
      0.75,
      0.11
    ),

    new M.LaggedStart(
      savings.cells.map((cell, i) =>
        new M.Transform(
          cell.mob,

          minuteSquare(
            restored.cells[i].position
          ),

          {
            pathArc: i % 2
              ? 0.15
              : -0.15
          }
        )
      ),

      {
        lagRatio: 0.018,
        runTime: 1.65
      }
    ),

    ...fadeInAll(
      restored.labels
    ),

    new M.Create(restoredFrame),

    ...fbox([
      ['SAVING PER NUDGED PERSON', C.green],
      'Overall saving ÷ fraction nudged',
      '3 ÷ 1/2',
      ['= 6 minutes saved', C.amber],
      ['Signed effect = −6 minutes', C.green]
    ], C.green),

    ...say(
      'THREE DIVIDED BY ONE HALF EQUALS SIX',
      C.amber
    )
  );

  restored.cells.forEach(
    (cell, i) => {
      cell.mob =
        savings.cells[i].mob;
    }
  );

  savings = restored;

  const savingObjects = [
    reverseTitle,
    savingSubtitle,
    totalSavingTag,
    restoredFrame,
    restoredPeopleLabel,

    ...savings.markers,
    ...savings.labels,
    ...savings.cells.map(
      c => c.mob
    )
  ];

  // ------------------------------------------------------------
  // 33: the instrumental-variable ratio
  //
  // Difference in average commute time
  // ----------------------------------
  //     Difference in pass shares
  //
  // Numerator:   34 - 37 = -3.
  // Denominator: 0.80 - 0.30 = 0.50.
  // Ratio:       -6 minutes.
  // ------------------------------------------------------------

  function ratioPicture(
    timeGap,
    shareGap,
    heading = 'THE INSTRUMENTAL-VARIABLE RULE'
  ) {
    const y = P ? 0.80 : -0.30;

    const title = txt(
      heading,
      P ? 19 : 17,
      C.green,
      at(CX, TITLE_Y),
      true,
      PIC_W
    );

    const numerator = txt(
      'Difference in average time',
      P ? 20 : 19,
      C.cyan,
      at(CX, y + 0.85),
      false,
      PIC_W - 0.40
    );

    const numeratorValue = txt(
      `${signed(timeGap)} minutes`,
      P ? 23 : 22,
      C.cyan,
      at(CX, y + 0.35),
      true
    );

    const fractionLine = line(
      at(CX - 2.78, y),
      at(CX + 2.78, y),
      C.ink,
      3.0
    );

    const denominator = txt(
      'Difference in pass shares',
      P ? 20 : 19,
      C.amber,
      at(CX, y - 0.44),
      false,
      PIC_W - 0.40
    );

    const denominatorValue = txt(
      shareGap.toFixed(2),
      P ? 23 : 22,
      C.amber,
      at(CX, y - 0.94),
      true
    );

    const estimate = shareGap === 0
      ? null
      : timeGap / shareGap;

    const result = tag(
      estimate === null
        ? 'UNDEFINED: NO NUDGE'
        : `= ${signed(estimate)} MINUTES`,
      C.green,
      at(
        CX,
        y - 1.60
      ),
      P ? 21 : 18
    );

    return {
      title,
      numerator,
      numeratorValue,
      fractionLine,
      denominator,
      denominatorValue,
      result,

      objects: [
        title,
        numerator,
        numeratorValue,
        fractionLine,
        denominator,
        denominatorValue,
        result
      ]
    };
  }

  const ratio = ratioPicture(
    TIME_GAP,
    SHARE_GAP
  );

  await until(S(33));
  await play(
    ...fadeAll(savingObjects),

    new M.FadeIn(ratio.title),
    new M.FadeIn(ratio.numerator),
    new M.FadeIn(ratio.numeratorValue),
    new M.Create(ratio.fractionLine),
    new M.FadeIn(ratio.denominator),
    new M.FadeIn(ratio.denominatorValue),
    new M.FadeIn(ratio.result),

    ...fbox([
      ['THE IV ESTIMATE', C.green],
      '(34 − 37) ÷ (0.80 − 0.30)',
      '−3 ÷ 0.50',
      ['= −6 minutes', C.amber],
      'For the people nudged.'
    ], C.green),

    ...say(
      'TIME DIFFERENCE DIVIDED BY PASS-SHARE DIFFERENCE',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 34-38: identifying assumptions
  //
  // 1. Fair draw / independence.
  // 2. Relevant instrument.
  // 3. Exclusion restriction.
  // 4. Monotonicity.
  //
  // These are conditions for the causal interpretation,
  // not facts established by the numerical ratio alone.
  // ------------------------------------------------------------

  const CONDITION_Y = P
    ? [1.93, 0.77, -0.39, -1.55]
    : [0.82, -0.12, -1.06, -2.00];

  const CONDITION_H = P
    ? 0.95
    : 0.79;

  function conditionCard(
    index,
    heading,
    subtitle,
    color
  ) {
    const y =
      CONDITION_Y[index];

    const r = rect(
      at(CX, y),
      PIC_W - 0.15,
      CONDITION_H,
      color,
      0.96,
      1.6
    );

    const n = txt(
      String(index + 1),
      P ? 21 : 19,
      color,
      at(CX - 2.91, y),
      true
    );

    const a = txt(
      heading,
      P ? 19 : 18,
      color,
      at(
        CX + 0.01,
        y + 0.15
      ),
      false,
      5.0
    );

    const b = txt(
      subtitle,
      P ? 15 : 14,
      C.ink,
      at(
        CX + 0.01,
        y - 0.18
      ),
      false,
      5.0
    );

    return new M.VGroup(
      r,
      n,
      a,
      b
    );
  }

  const conditionsTitle = txt(
    'WHEN DOES THE RATIO ESTIMATE AN EFFECT?',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const conditions = [
    conditionCard(
      0,
      'Fair draw',
      'Lottery result is not driven by shared causes.',
      C.violet
    ),

    conditionCard(
      1,
      'Winning changes receipt',
      'The nudge must have real strength.',
      C.amber
    ),

    conditionCard(
      2,
      'Only through pass receipt',
      'No separate effect of winning on commute time.',
      C.cyan
    ),

    conditionCard(
      3,
      'Nobody is put off by winning',
      'Winning never reverses receipt in the other direction.',
      C.green
    )
  ];

  const conditionChecks =
    CONDITION_Y.map(y =>
      checkMark(
        at(CX + 2.97, y),
        C.green
      )
    );

  const conditionsObjects = [
    conditionsTitle,
    ...conditions,
    ...conditionChecks
  ];

  // 34: introduce the four conditions.
  await until(S(34));
  await play(
    ...fadeAll(ratio.objects),

    new M.FadeIn(conditionsTitle),

    lagIn(
      conditions,
      0.90,
      0.12
    ),

    ...fbox([
      ['FOUR CONDITIONS', C.green],
      'Fair draw.',
      'A real nudge.',
      'Only through receipt.',
      'Nobody put off by winning.'
    ], C.green),

    ...say(
      'THE RATIO NEEDS FOUR CONDITIONS',
      C.amber
    )
  );

  // 35: condition one — the draw must be fair.
  await until(S(35));
  await play(
    new M.FadeIn(
      conditionChecks[0]
    ),

    new M.Indicate(
      conditions[0],
      {
        color: C.violet,
        runTime: 0.60
      }
    ),

    ...fbox([
      ['1. FAIR DRAW', C.violet],
      'Winning is independent',
      'of people’s underlying',
      'commute circumstances.'
    ], C.violet),

    ...say(
      'THE DRAW MUST BE FAIR',
      C.violet
    )
  );

  // 36: condition two — winning must change pass receipt.
  await until(S(36));
  await play(
    new M.FadeIn(
      conditionChecks[1]
    ),

    new M.Indicate(
      conditions[1],
      {
        color: C.amber,
        runTime: 0.60
      }
    ),

    ...fbox([
      ['2. A REAL NUDGE', C.amber],
      'Winning must change',
      'how often people get a pass.',
      'Here: 0.80 − 0.30 = 0.50.',
      'A zero gap cannot be divided by.'
    ], C.amber),

    ...say(
      'WINNING MUST CHANGE PASS RECEIPT',
      C.amber
    )
  );

  // 37: condition three — winning affects time only through
  // receiving a pass.
  await until(S(37));
  await play(
    new M.FadeIn(
      conditionChecks[2]
    ),

    new M.Indicate(
      conditions[2],
      {
        color: C.cyan,
        runTime: 0.70
      }
    ),

    ...fbox([
      ['3. ONLY THROUGH RECEIPT', C.cyan],
      'Win → Pass → Commute time',
      'Winning itself must not',
      'change commute time',
      'through another route.'
    ], C.cyan),

    ...say(
      'WINNING CAN AFFECT TIME ONLY THROUGH RECEIPT',
      C.cyan
    )
  );

  // 38: condition four — winning must never discourage
  // someone from getting a pass they would otherwise get.
  await until(S(38));
  await play(
    new M.FadeIn(
      conditionChecks[3]
    ),

    new M.Indicate(
      conditions[3],
      {
        color: C.green,
        runTime: 0.70
      }
    ),

    ...fbox([
      ['4. NO OPPOSITE RESPONSE', C.green],
      'Nobody gets a pass',
      'only when they lose.',
      'Winning must never put',
      'someone off receipt.'
    ], C.green),

    ...say(
      'WINNING MUST NOT DISCOURAGE RECEIPT',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 39: when a fair nudge is useful
  //
  // The instrument changes the probability of receipt,
  // rather than forcing everybody to receive treatment.
  // ------------------------------------------------------------

  graph = makeDiagram();

  const useTitle = txt(
    'WHEN A FAIR NUDGE EXISTS',
    P ? 21 : 19,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const fairNudgeTag = tag(
    'FAIR NUDGE',
    C.green,
    at(
      Z_P[0],
      DIAGRAM_Y + 0.87
    ),
    P ? 16 : 15
  );

  const optionalReceiptTag = txt(
    'Receipt is still a choice',
    P ? 17 : 16,
    C.amber,
    at(
      D_P[0],
      DIAGRAM_Y - 0.86
    ),
    false,
    2.55
  );

  const outcomeNote = txt(
    'Estimate the effect here',
    P ? 17 : 16,
    C.cyan,
    at(
      Y_P[0],
      DIAGRAM_Y - 0.86
    ),
    false,
    2.25
  );

  // Draw a crossed-out alternative route from winning to time.
  // This is an assumption illustration, not an additional
  // observed causal path.

  const bypassY =
    DIAGRAM_Y + 1.13;

  const bypass1 = dashed(
    at(
      Z_P[0],
      DIAGRAM_Y + NODE_H / 2 + 0.08
    ),

    at(
      Z_P[0] + 0.62,
      bypassY
    ),

    C.muted,
    1.8
  );

  const bypass2 = dashed(
    at(
      Z_P[0] + 0.62,
      bypassY
    ),

    at(
      Y_P[0] - 0.62,
      bypassY
    ),

    C.muted,
    1.8
  );

  const bypass3 = dashed(
    at(
      Y_P[0] - 0.62,
      bypassY
    ),

    at(
      Y_P[0],
      DIAGRAM_Y + NODE_H / 2 + 0.08
    ),

    C.muted,
    1.8
  );

  const bypassCross = cross(
    at(CX, bypassY),
    C.amber,
    0.14
  );

  const noDirectNote = txt(
    'No other route',
    P ? 15 : 14,
    C.muted,
    at(
      CX,
      bypassY + 0.25
    ),
    false,
    2.10
  );

  const useObjects = [
    ...diagramObjects(graph),
    useTitle,
    fairNudgeTag,
    optionalReceiptTag,
    outcomeNote,
    bypass1,
    bypass2,
    bypass3,
    bypassCross,
    noDirectNote
  ];

  await until(S(39));
  await play(
    ...fadeAll(conditionsObjects),

    new M.FadeIn(useTitle),

    lagIn(
      diagramObjects(graph),
      0.90,
      0.10
    ),

    new M.FadeIn(fairNudgeTag),
    new M.FadeIn(optionalReceiptTag),
    new M.FadeIn(outcomeNote),

    new M.Create(bypass1),
    new M.Create(bypass2),
    new M.Create(bypass3),

    new M.FadeIn(bypassCross),
    new M.FadeIn(noDirectNote),

    ...fbox([
      ['WHEN THIS TOOL IS USEFUL', C.green],
      'You cannot assign receipt',
      'directly to everyone.',
      'But a fair nudge exists.',
      ['Check the four conditions.', C.amber]
    ], C.green),

    ...say(
      'USE A FAIR NUDGE WHEN RECEIPT IS NOT CONTROLLED',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 40-41: the estimate is local to the nudged group
  //
  // Compliers:
  // People who receive a pass only if they win.
  //
  // The ratio does not identify the effect for always-takers
  // or never-takers without additional assumptions.
  // ------------------------------------------------------------

  function responseCard(
    type,
    title,
    count,
    p,
    subtitle,
    selected
  ) {
    const color =
      TYPE_COLORS[type];

    const w = 2.15;
    const h = P ? 2.30 : 2.02;

    const r = rect(
      p,
      w,
      h,
      color,
      0.96,
      selected ? 2.5 : 1.4
    );

    const heading = txt(
      title,
      P ? 18 : 17,
      color,
      at(
        p[0],
        p[1] + h / 2 - 0.31
      ),
      false,
      w - 0.18
    );

    const dots = [];

    for (
      let j = 0;
      j < count;
      j++
    ) {
      dots.push(
        glowDot(
          at(
            p[0] +
              (
                j -
                (count - 1) / 2
              ) * 0.31,

            p[1] + 0.15
          ),
          color,
          0.072
        )
      );
    }

    const countText = txt(
      `${count} people`,
      P ? 17 : 16,
      color,
      at(
        p[0],
        p[1] - 0.28
      ),
      true,
      w - 0.16
    );

    const sub = txt(
      subtitle,
      P ? 15 : 14,
      selected ? C.green : C.muted,
      at(
        p[0],
        p[1] - 0.68
      ),
      false,
      w - 0.18
    );

    return new M.VGroup(
      r,
      heading,
      ...dots,
      countText,
      sub
    );
  }

  const TYPE_CARD_Y =
    P ? 0.82 : -0.35;

  const scopeTitle = txt(
    'WHOSE EFFECT DID WE ESTIMATE?',
    P ? 20 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const scopeCards = [
    responseCard(
      'always',
      'Always get pass',
      3,
      at(CX - 2.28, TYPE_CARD_Y),
      'Effect not identified',
      false
    ),

    responseCard(
      'nudged',
      'Only if they win',
      5,
      at(CX, TYPE_CARD_Y),
      'Effect identified',
      true
    ),

    responseCard(
      'never',
      'Never get pass',
      2,
      at(CX + 2.28, TYPE_CARD_Y),
      'Effect not identified',
      false
    )
  ];

  const scopeWarning = txt(
    'Not automatically the effect for everybody',
    P ? 19 : 17,
    C.amber,
    at(
      CX,
      P ? -0.99 : -1.90
    ),
    false,
    PIC_W
  );

  // 40: common trap — interpreting six minutes as everybody's effect.
  await until(S(40));
  await play(
    ...fadeAll(useObjects),

    new M.FadeIn(scopeTitle),

    lagIn(
      scopeCards,
      0.90,
      0.14
    ),

    new M.FadeIn(scopeWarning),

    ...fbox([
      ['COMMON TRAP', C.amber],
      'A six-minute saving',
      'does NOT automatically',
      'describe every commuter.',
      'Ask whose receipt changed.'
    ], C.amber),

    ...say(
      'SIX MINUTES IS NOT NECESSARILY EVERYBODY’S EFFECT',
      C.amber
    )
  );

  const complierFrame = rect(
    at(CX, TYPE_CARD_Y),
    2.30,
    P ? 2.45 : 2.17,
    C.green,
    0,
    2.5
  );

  const complierTag = tag(
    'PEOPLE NUDGED: −6 MIN',
    C.green,
    at(
      CX,
      P ? -1.56 : -2.45
    ),
    P ? 18 : 16
  );

  // 41: the estimate concerns those who get a pass only if they win.
  await until(S(41));
  await play(
    new M.Create(complierFrame),
    new M.FadeIn(complierTag),

    new M.Indicate(
      scopeCards[1],
      { color: C.green }
    ),

    ...fbox([
      ['PEOPLE WHO ARE NUDGED', C.green],
      'Receive a pass if they win.',
      'Go without if they lose.',
      'Also called compliers.',
      ['Estimated effect = −6 min', C.green]
    ], C.green),

    ...say(
      'THE EFFECT IS FOR PEOPLE WHO GET A PASS ONLY IF THEY WIN',
      C.green
    )
  );

  // ------------------------------------------------------------
  // Practice model
  //
  // Hold the always group at 3.
  // Vary the number of people nudged from 0 to 7.
  // The never group contains everybody remaining.
  //
  // This is a separate hypothetical model with balanced rows.
  //
  // Each nudged person saves six minutes.
  // More nudged people increase BOTH observed differences:
  //
  // Share gap = nudged / 10.
  // Time gap  = -6 × nudged / 10.
  //
  // When the share gap is nonzero:
  // Time gap / Share gap = -6.
  //
  // When nobody is nudged, the ratio is undefined.
  // ------------------------------------------------------------

  function practiceResult(
    nudged,
    saving = SAVING_PER_NUDGED
  ) {
    const n = Math.max(
      0,
      Math.min(
        N - ALWAYS,
        Math.round(nudged)
      )
    );

    const never = N - ALWAYS - n;

    const winnerCount =
      ALWAYS + n;

    const nonwinnerCount =
      ALWAYS;

    const winnerAverage = (
      ALWAYS * ALWAYS_TIME +
      n * (
        NUDGED_WITHOUT_PASS -
        saving
      ) +
      never * NEVER_TIME
    ) / N;

    const nonwinnerAverage = (
      ALWAYS * ALWAYS_TIME +
      n * NUDGED_WITHOUT_PASS +
      never * NEVER_TIME
    ) / N;

    const shareGap =
      (
        winnerCount -
        nonwinnerCount
      ) / N;

    const timeGap =
      winnerAverage -
      nonwinnerAverage;

    return {
      nudged: n,
      never,
      winnerCount,
      nonwinnerCount,
      winnerAverage,
      nonwinnerAverage,
      shareGap,
      timeGap,

      estimate:
        shareGap === 0
          ? null
          : timeGap / shareGap
    };
  }

  function practiceBox(
    nudged,
    heading = 'IMAGINED PRACTICE MODEL'
  ) {
    const r = practiceResult(
      nudged
    );

    return fbox([
      [heading, C.green],
      `People nudged: ${r.nudged}/10`,

      [
        `Share gap: ${r.shareGap.toFixed(2)}`,
        C.amber
      ],

      [
        `Time gap: ${signed(r.timeGap)} min`,
        C.cyan
      ],

      [
        r.estimate === null
          ? 'Estimate: undefined'
          : `Ratio: ${signed(r.estimate)} min`,
        C.green
      ]
    ], C.green);
  }

  // ------------------------------------------------------------
  // Slider preview
  //
  // The actual learner interaction is supplied by Try it.
  // This scene animates one example of changing its value.
  // ------------------------------------------------------------

  const SLIDER_Y = P ? -2.43 : -2.49;
  const SLIDER_W = 3.72;

  const SLIDER_LEFT =
    CX - SLIDER_W / 2;

  const SLIDER_RIGHT =
    CX + SLIDER_W / 2;

  function sliderX(nudged) {
    return SLIDER_LEFT +
      nudged /
      (N - ALWAYS) *
      SLIDER_W;
  }

  const sliderTrack = line(
    at(
      SLIDER_LEFT,
      SLIDER_Y
    ),

    at(
      SLIDER_RIGHT,
      SLIDER_Y
    ),

    C.muted,
    4
  );

  const sliderTicks =
    Array.from(
      { length: 8 },
      (_, i) =>
        line(
          at(
            sliderX(i),
            SLIDER_Y - 0.07
          ),

          at(
            sliderX(i),
            SLIDER_Y + 0.07
          ),

          C.muted,
          1.3
        )
    );

  const sliderLeftLabel = txt(
    'Fewer',
    P ? 15 : 14,
    C.muted,
    at(
      SLIDER_LEFT - 0.53,
      SLIDER_Y
    ),
    false,
    0.95
  );

  const sliderRightLabel = txt(
    'More',
    P ? 15 : 14,
    C.green,
    at(
      SLIDER_RIGHT + 0.53,
      SLIDER_Y
    ),
    false,
    0.95
  );

  function sliderKnob(nudged) {
    const p = at(
      sliderX(nudged),
      SLIDER_Y
    );

    return glowDot(
      p,
      C.green,
      0.095
    );
  }

  function sliderNumber(nudged) {
    return txt(
      `${nudged} nudged`,
      P ? 16 : 15,
      C.green,
      at(
        sliderX(nudged),

        SLIDER_Y -
          (P ? 0.31 : 0.28)
      ),
      true,
      1.35
    );
  }

  let knob = sliderKnob(5);
  let knobLabel = sliderNumber(5);

  const sliderObjects = [
    sliderTrack,
    ...sliderTicks,
    sliderLeftLabel,
    sliderRightLabel
  ];

  function revealSlider() {
    return [
      new M.Create(sliderTrack),

      ...sliderTicks.map(
        t => new M.Create(t)
      ),

      new M.FadeIn(
        sliderLeftLabel
      ),

      new M.FadeIn(
        sliderRightLabel
      ),

      new M.FadeIn(knob),
      new M.FadeIn(knobLabel)
    ];
  }

  function updateSlider(nudged) {
    const old = knobLabel;
    knobLabel = sliderNumber(
      nudged
    );

    return [
      new M.Transform(
        knob,
        sliderKnob(nudged),
        { runTime: 0.90 }
      ),

      new M.FadeOut(old),
      new M.FadeIn(knobLabel)
    ];
  }

  // ------------------------------------------------------------
  // Update a hypothetical board while preserving its dot
  // identities and fixed row membership.
  //
  // Only response types, pass rings, counts, and the
  // calculated model averages change.
  // ------------------------------------------------------------

  function changePracticeBoard(
    board,
    nudged
  ) {
    const r = practiceResult(
      nudged
    );

    board.nudged = r.nudged;

    const a = [];

    board.rows.forEach(row => {
      row.people.forEach(person => {
        const newType = typeFor(
          person.index,
          r.nudged
        );

        const newPass = receives(
          row.row,
          newType
        );

        if (person.type !== newType) {
          a.push(
            new M.Transform(
              person.mob,

              glowDot(
                person.position,
                TYPE_COLORS[newType]
              ),

              { runTime: 0.80 }
            )
          );
        }

        if (
          person.pass &&
          !newPass
        ) {
          if (person.ringVisible) {
            a.push(
              new M.FadeOut(
                person.ring
              )
            );
          }

          person.ring = null;
          person.ringVisible = false;
        }

        if (
          !person.pass &&
          newPass
        ) {
          person.ring =
            passRing(
              person.position
            );

          person.ringVisible = true;

          a.push(
            new M.Create(
              person.ring
            )
          );
        }

        person.type = newType;
        person.pass = newPass;
      });

      row.passCount =
        row.row === 0
          ? r.winnerCount
          : r.nonwinnerCount;

      row.average =
        row.row === 0
          ? r.winnerAverage
          : r.nonwinnerAverage;

      row.total =
        row.average * N;

      const newShare = txt(
        `${row.passCount}/10 with pass`,
        P ? 17 : 16,
        C.amber,
        at(
          CX + 2.03,
          ROW_Y[row.row] +
            ROW_H / 2 - 0.24
        ),
        true,
        2.55
      );

      const newAverageLabel =
        averageLabel(
          row.row,
          row.average
        );

      a.push(
        new M.FadeOut(row.share),
        new M.FadeIn(newShare),

        new M.Transform(
          row.bar,

          minuteBar(
            row.row,
            row.average
          ),

          { runTime: 0.90 }
        ),

        new M.FadeOut(
          row.barLabel
        ),

        new M.FadeIn(
          newAverageLabel
        )
      );

      row.share = newShare;
      row.barLabel = newAverageLabel;
    });

    return a;
  }

  // ------------------------------------------------------------
  // 42: preview Try it
  //
  // Demonstrate changing the number nudged from five to three.
  //
  // Five:
  //   Share gap = 0.50.
  //   Time gap  = -3.
  //
  // Three:
  //   Share gap = 0.30.
  //   Time gap  = -1.8.
  //
  // Both ratios equal -6 under this hypothetical model.
  // ------------------------------------------------------------

  let tryBoard = makeBoard({
    nudged: 5,
    typesVisible: true,
    heading: 'TRY IT • IMAGINED PRACTICE MODEL'
  });

  await until(S(42));
  await play(
    ...fadeAll([
      scopeTitle,
      ...scopeCards,
      scopeWarning,
      complierFrame,
      complierTag
    ]),

    ...revealCompleteBoard(
      tryBoard
    ),

    ...revealSlider(),

    ...practiceBox(
      5
    ),

    ...say(
      'TRY IT: CHANGE THE NUMBER OF PEOPLE NUDGED',
      C.green
    )
  );

  // Demonstrate a slider move.
  // Sequential awaited play; never run two plays concurrently.

  await play(
    ...updateSlider(3),

    ...changePracticeBoard(
      tryBoard,
      3
    ),

    ...practiceBox(
      3
    )
  );

  // ------------------------------------------------------------
  // 43: challenge — calculate the original pass-share gap
  //
  // Restore the original ten-versus-ten picture before
  // answering the fixed-data challenge.
  // ------------------------------------------------------------

  const challengeFrames = [
    passCountOutline(
      0,
      8,
      C.amber
    ),

    passCountOutline(
      1,
      3,
      C.amber
    )
  ];

  await until(S(43));
  await play(
    ...changeTitle(
      tryBoard,
      'TRY IT • ORIGINAL LOTTERY FIGURES'
    ),

    ...updateSlider(5),

    ...changePracticeBoard(
      tryBoard,
      5
    ),

    ...challengeFrames.map(
      r => new M.Create(r)
    ),

    ...fbox([
      ['CHALLENGE 1', C.green],
      'Find the pass-share gap.',
      '8/10 − 3/10',
      '= 5/10',
      ['Answer: 0.50', C.amber]
    ], C.green),

    ...say(
      'FIND THE GAP IN PASS SHARES',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 44: challenge — calculate the effect for the nudged people
  // ------------------------------------------------------------

  const challengeBarFrames = [
    barOutline(
      0,
      C.cyan
    ),

    barOutline(
      1,
      C.violet
    )
  ];

  await until(S(44));
  await play(
    ...fadeAll(challengeFrames),

    ...challengeBarFrames.map(
      r => new M.Create(r)
    ),

    ...fbox([
      ['CHALLENGE 2', C.green],
      'Time gap: 34 − 37 = −3',
      'Pass-share gap: 0.50',
      '−3 ÷ 0.50',
      ['Answer: 6 minutes saved', C.green]
    ], C.green),

    ...say(
      'USE BOTH GAPS TO FIND THE SAVING',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 45: New data preview
  //
  // Show cumulative results from three fresh hypothetical
  // balanced trials, each containing ten winners and
  // ten nonwinners.
  //
  // These examples are deterministic teaching illustrations,
  // not newly observed or simulated random lottery outcomes.
  //
  // Trial A: 2 nudged.
  //   Share gap = 0.20.
  //   Time gap = -1.20.
  //
  // Trial B: 6 nudged.
  //   Share gap = 0.60.
  //   Time gap = -3.60.
  //
  // Trial C: 4 nudged.
  //   Share gap = 0.40.
  //   Time gap = -2.40.
  //
  // Pool the group totals rather than averaging trial ratios.
  //
  // Across all three trials:
  //   30 winners and 30 nonwinners.
  //   Winner passes = 21.
  //   Nonwinner passes = 9.
  //   Receipt gap = 12/30 = 0.40.
  //
  //   Winner total commute minutes = 1038.
  //   Nonwinner total commute minutes = 1110.
  //   Average time gap = -72/30 = -2.40.
  //
  //   Ratio = -2.40 / 0.40 = -6 minutes.
  // ------------------------------------------------------------

  const TRIALS = [2, 6, 4].map(
    (n, i) => ({
      label: `Trial ${i + 1}`,
      ...practiceResult(n)
    })
  );

  const TRIAL_Y = P
    ? [1.76, 0.53, -0.70]
    : [0.66, -0.52, -1.70];

  const trialTitle = txt(
    'NEW DATA • HYPOTHETICAL TRIALS',
    P ? 19 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  function trialRow(
    trial,
    index
  ) {
    const y = TRIAL_Y[index];

    const frame = rect(
      at(CX, y),
      PIC_W,
      P ? 1.00 : 0.98,
      C.muted,
      0.94,
      1.3
    );

    const label = txt(
      trial.label,
      P ? 18 : 17,
      C.ink,
      at(
        CX - 2.65,
        y + 0.18
      ),
      false,
      1.32
    );

    const count = txt(
      `${trial.nudged} nudged`,
      P ? 15 : 14,
      C.green,
      at(
        CX - 2.65,
        y - 0.20
      ),
      true,
      1.38
    );

    const shareText = txt(
      `Share +${trial.shareGap.toFixed(2)}`,
      P ? 16 : 15,
      C.amber,
      at(
        CX - 0.63,
        y + 0.20
      ),
      true,
      2.12
    );

    const timeText = txt(
      `Time ${signed(trial.timeGap)} min`,
      P ? 16 : 15,
      C.cyan,
      at(
        CX + 2.03,
        y + 0.20
      ),
      true,
      2.40
    );

    const shareWidth =
      trial.shareGap * 2.10;

    const timeWidth =
      Math.abs(
        trial.timeGap
      ) / 6 * 2.10;

    const shareBar =
      new M.Rectangle({
        width: shareWidth,
        height: 0.18,
        color: C.amber,
        strokeWidth: 1.2
      });

    shareBar.setFill(
      C.amber,
      0.80
    );

    shareBar.moveTo(at(
      CX - 1.72 +
        shareWidth / 2,
      y - 0.20
    ));

    const timeBar =
      new M.Rectangle({
        width: timeWidth,
        height: 0.18,
        color: C.cyan,
        strokeWidth: 1.2
      });

    timeBar.setFill(
      C.cyan,
      0.80
    );

    timeBar.moveTo(at(
      CX + 0.95 +
        timeWidth / 2,
      y - 0.20
    ));

    return new M.VGroup(
      frame,
      label,
      count,
      shareText,
      timeText,
      shareBar,
      timeBar
    );
  }

  const trialRows = TRIALS.map(
    trialRow
  );

  const pooledWinners =
    TRIALS.length * N;

  const pooledNonwinners =
    TRIALS.length * N;

  const pooledWinnerPasses =
    TRIALS.reduce(
      (sum, d) =>
        sum + d.winnerCount,
      0
    );

  const pooledNonwinnerPasses =
    TRIALS.reduce(
      (sum, d) =>
        sum + d.nonwinnerCount,
      0
    );

  const pooledWinnerTime =
    TRIALS.reduce(
      (sum, d) =>
        sum +
        d.winnerAverage * N,
      0
    );

  const pooledNonwinnerTime =
    TRIALS.reduce(
      (sum, d) =>
        sum +
        d.nonwinnerAverage * N,
      0
    );

  const pooledShareGap =
    pooledWinnerPasses /
      pooledWinners -

    pooledNonwinnerPasses /
      pooledNonwinners;

  const pooledTimeGap =
    pooledWinnerTime /
      pooledWinners -

    pooledNonwinnerTime /
      pooledNonwinners;

  const pooledEstimate =
    pooledShareGap === 0
      ? null
      : pooledTimeGap /
        pooledShareGap;

  const pooledLabel = tag(
    'POOLED: 30 PEOPLE PER GROUP',
    C.green,
    P
      ? at(CX, -1.68)
      : at(CX, -2.50),
    P ? 16 : 15
  );

  const trialDisclaimer = txt(
    'Imagined balanced trials, not new observed records',
    P ? 15 : 14,
    C.muted,
    P
      ? at(CX, -2.19)
      : at(4.25, -1.84),
    false,
    P ? PIC_W : 4.55
  );

  const newDataTag = tag(
    'NEW DATA',
    C.green,
    P
      ? at(CX, 2.42)
      : at(4.25, 1.18),
    P ? 17 : 15
  );

  await until(S(45));
  await play(
    ...fadeAll([
      ...boardObjects(tryBoard),
      ...challengeBarFrames,
      ...sliderObjects,
      knob,
      knobLabel
    ]),

    new M.FadeIn(trialTitle),
    new M.FadeIn(newDataTag),

    lagIn(
      trialRows,
      1.50,
      0.24
    ),

    new M.FadeIn(pooledLabel),
    new M.FadeIn(trialDisclaimer),

    ...fbox([
      ['POOL THE FRESH TRIALS', C.green],
      'Pass counts: 21 vs 9',
      ['Share gap: 12/30 = 0.40', C.amber],
      ['Time gap: −72/30 = −2.4', C.cyan],
      [
        `Ratio: ${signed(pooledEstimate)} min`,
        C.green
      ]
    ], C.green),

    ...say(
      'NEW DATA: BUILD UP BOTH GAPS ACROSS TRIALS',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 46: final takeaway
  //
  // Restore the exact original lottery figures.
  //
  // Highlight the five illustrative response-type positions
  // whose pass receipt differs depending on the draw result.
  //
  // End with the ratio and its correct causal scope.
  // ------------------------------------------------------------

  const finalBoard = makeBoard({
    nudged: NUDGED,
    saving: SAVING_PER_NUDGED,
    typesVisible: true,
    heading: 'INSTRUMENTAL VARIABLES'
  });

  const finalFrames = typeFrames(
    finalBoard,
    'nudged',
    C.green
  );

  const finalScopeTag = tag(
    'EFFECT FOR THE PEOPLE NUDGED',
    C.green,
    P
      ? at(CX, -2.27)
      : at(CX, -2.53),
    P ? 17 : 15
  );

  const finalNote = txt(
    'Requires a fair, valid instrument',
    P ? 16 : 15,
    C.muted,
    P
      ? at(CX, -2.79)
      : at(4.25, -1.87),
    false,
    P ? PIC_W : 4.55
  );

  await until(S(46));
  await play(
    ...fadeAll([
      trialTitle,
      ...trialRows,
      pooledLabel,
      trialDisclaimer,
      newDataTag
    ]),

    ...revealCompleteBoard(
      finalBoard
    ),

    ...finalFrames.map(
      r => new M.Create(r)
    ),

    new M.FadeIn(finalScopeTag),
    new M.FadeIn(finalNote),

    ...fbox([
      ['INSTRUMENTAL VARIABLES', C.green],
      ['Pass-share gap = 0.50', C.amber],
      ['Time gap = −3 minutes', C.cyan],
      '−3 ÷ 0.50 = −6 minutes',
      ['For people who get a pass', C.green],
      ['only if they win.', C.green]
    ], C.green),

    ...say(
      'ESTIMATE THE EFFECT FOR THE PEOPLE NUDGED',
      C.green
    )
  );

  // ------------------------------------------------------------
  // Final fixed facts
  // ------------------------------------------------------------
  //
  // Instrument:
  //   Winning the fair lottery.
  //
  // Treatment:
  //   Actually receiving a transit pass.
  //
  // Outcome:
  //   Commute time in minutes.
  //
  // Winners:
  //   10 people.
  //   8 receive passes.
  //   Whole-row average commute = 34 minutes.
  //
  // Nonwinners:
  //   10 people.
  //   3 receive passes.
  //   Whole-row average commute = 37 minutes.
  //
  // Difference in pass shares:
  //   8/10 - 3/10
  //   = 5/10
  //   = 0.50.
  //
  // Difference in average time:
  //   34 - 37
  //   = -3 minutes.
  //
  // Instrumental-variable estimate:
  //   Difference in average time
  //   ÷ Difference in pass shares
  //   = -3 / 0.50
  //   = -6 minutes.
  //
  // Exact illustrative response-type composition:
  //
  //   3 always receive a pass.
  //   5 receive a pass only if they win.
  //   2 never receive a pass.
  //
  // Illustrative arithmetic:
  //
  //   5 people × 6 minutes saved
  //   = 30 minutes in total.
  //
  //   30 minutes ÷ 10 people
  //   = 3 minutes saved per person overall.
  //
  // Reverse the averaging:
  //
  //   3 ÷ 0.50
  //   = 6 minutes saved per nudged person, on average.
  //
  // Conditions:
  //
  //   1. The draw is fair.
  //
  //   2. Winning changes the chance of pass receipt.
  //
  //   3. Winning affects commute time only through receipt.
  //
  //   4. Winning never discourages someone from receiving
  //      a pass they would otherwise receive.
  //
  // Under these assumptions, the ratio estimates the
  // local average treatment effect for compliers:
  // people whose receipt changes because they win.
  //
  // It does not automatically identify the effect for
  // always-takers, never-takers, or the entire city.
  //
  // End of lesson 8.2.10.
  // End of Chapter 8.2.
}

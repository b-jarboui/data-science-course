// lesson 7.3.10
// Kruskal–Wallis test.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // Four independent tickets from each of three queues.
  // ------------------------------------------------------------

  const BILLING = C.blue || '#60A5FA';
  const TECHNICAL = C.violet || '#A78BFA';
  const ACCOUNT = C.teal || '#2DD4BF';

  const RANK = C.violet;
  const WARN = C.amber;
  const GOOD = C.green;

  const QUEUES = [
    {
      id: 'B',
      name: 'Billing',
      color: BILLING,
      times: [3, 5, 6, 9]
    },

    {
      id: 'T',
      name: 'Technical',
      color: TECHNICAL,
      times: [12, 15, 20, 45]
    },

    {
      id: 'A',
      name: 'Account',
      color: ACCOUNT,
      times: [4, 7, 10, 14]
    }
  ];

  const K = QUEUES.length;

  const DATA = QUEUES.flatMap(
    (queue, group) =>
      queue.times.map((minutes, index) => ({
        id: `${queue.id}${index + 1}`,
        group,
        queue: queue.name,
        color: queue.color,
        minutes
      }))
  );

  const N = DATA.length;

  // ------------------------------------------------------------
  // POOLED RANKS
  // All twelve tickets ranked together.
  // Average ranks are supported for tied values.
  // The supplied dataset contains no ties.
  // ------------------------------------------------------------

  function pooledRanks(records) {
    const sorted = records
      .map(d => ({ ...d }))
      .sort((a, b) => a.minutes - b.minutes);

    let i = 0;

    while (i < sorted.length) {
      let j = i + 1;

      while (
        j < sorted.length &&
        sorted[j].minutes === sorted[i].minutes
      ) {
        j++;
      }

      const averageRank =
        (i + 1 + j) / 2;

      for (let k = i; k < j; k++) {
        sorted[k].rank = averageRank;
      }

      i = j;
    }

    return sorted;
  }

  const RANKED = pooledRanks(DATA);

  const BY_ID = new Map(
    RANKED.map(d => [d.id, d])
  );

  const MIDDLE = (N + 1) / 2;

  const STATS = QUEUES.map((queue, group) => {
    const records = RANKED.filter(
      d => d.group === group
    );

    const n = records.length;

    const rankSum = records.reduce(
      (sum, d) => sum + d.rank,
      0
    );

    const meanRank = rankSum / n;

    const meanMinutes =
      records.reduce(
        (sum, d) => sum + d.minutes,
        0
      ) / n;

    const gap = meanRank - MIDDLE;

    const squaredGap = gap * gap;

    const weightedGap =
      n * squaredGap;

    return {
      ...queue,
      group,
      records,
      n,
      ranks: records.map(d => d.rank),
      rankSum,
      meanRank,
      meanMinutes,
      gap,
      squaredGap,
      weightedGap
    };
  });

  const TOTAL_RANK = STATS.reduce(
    (sum, g) => sum + g.rankSum,
    0
  );

  const BETWEEN = STATS.reduce(
    (sum, g) => sum + g.weightedGap,
    0
  );

  const SCALE = 12 / (N * (N + 1));

  const H_RAW = SCALE * BETWEEN;

  // ------------------------------------------------------------
  // TIE CORRECTION
  //
  // H = Hraw / correction
  //
  // correction = 1 - sum(t^3 - t)/(N^3 - N)
  //
  // The correction equals 1 for the actual lesson dataset.
  // ------------------------------------------------------------

  const TIE_COUNTS = new Map();

  DATA.forEach(d => {
    TIE_COUNTS.set(
      d.minutes,
      (TIE_COUNTS.get(d.minutes) || 0) + 1
    );
  });

  const TIE_TERM = Array.from(
    TIE_COUNTS.values()
  ).reduce(
    (sum, t) => sum + t ** 3 - t,
    0
  );

  const TIE_CORRECTION =
    1 - TIE_TERM / (N ** 3 - N);

  const H = H_RAW / TIE_CORRECTION;

  const DF = K - 1;

  // For chi-square with 2 degrees of freedom:
  // P(X >= x) = exp(-x/2).

  const PV = Math.exp(-H / 2);

  const ALPHA = 0.05;

  const CUTOFF =
    -2 * Math.log(ALPHA);

  // ------------------------------------------------------------
  // CHECKED NUMERICAL RESULTS
  //
  // Billing:
  //   ranks = [1, 3, 4, 6]
  //   rank sum = 14
  //   mean rank = 3.5
  //   gap = -3
  //   weighted squared gap = 36
  //
  // Technical:
  //   ranks = [8, 10, 11, 12]
  //   rank sum = 41
  //   mean rank = 10.25
  //   gap = +3.75
  //   weighted squared gap = 56.25
  //
  // Account:
  //   ranks = [2, 5, 7, 9]
  //   rank sum = 23
  //   mean rank = 5.75
  //   gap = -0.75
  //   weighted squared gap = 2.25
  //
  // Total rank = 78
  // Overall middle rank = 6.5
  // Weighted squared gaps = 94.5
  //
  // H = 12/(12*13) * 94.5
  //   = 7.269230769...
  //
  // df = 2
  // Approximate p = 0.02639...
  // ------------------------------------------------------------

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // Approved reference layout constants.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.85, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 2.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const format = n =>
    Number(n.toFixed(4)).toString();

  const signed = n =>
    n > 0
      ? `+${format(n)}`
      : format(n).replace('-', '−');

  // ------------------------------------------------------------
  // DRAWING HELPERS
  // ------------------------------------------------------------

  function text(
    s,
    x,
    y,
    size = 20,
    color = C.ink,
    mono = false,
    maxw = null
  ) {
    const t = T(
      String(s),
      size,
      color,
      mono
    );

    if (maxw && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function rect(
    x, y, w, h,
    color,
    opacity = 0,
    sw = 2
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);

    r.moveTo([x, y, 0]);

    return r;
  }

  function rounded(
    x, y, w, h,
    color,
    opacity = 0,
    sw = 2,
    radius = 0.08
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,

      cornerRadius: Math.min(
        radius,
        w * 0.25,
        h * 0.25
      ),

      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);

    r.moveTo([x, y, 0]);

    return r;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function dot(
    x, y,
    color,
    radius = 0.11
  ) {
    return new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });
  }

  const G = (...items) =>
    new M.VGroup(
      ...items.flat(Infinity).filter(Boolean)
    );

  // ------------------------------------------------------------
  // SCENE MANAGEMENT
  //
  // Only newly constructed objects are grouped together.
  // Existing objects are grouped only when being removed.
  // ------------------------------------------------------------

  let picture = null;
  let boxNow = null;

  function scene(next, runTime = 0.50) {
    const a = [];

    if (picture) {
      a.push(
        new M.FadeOut(
          picture,
          { runTime }
        )
      );
    }

    if (next) {
      a.push(
        new M.FadeIn(
          next,
          { runTime }
        )
      );
    }

    picture = next;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;

    boxNow = null;

    return [
      new M.FadeOut(
        old,
        { runTime: 0.35 }
      )
    ];
  }

  // ------------------------------------------------------------
  // FORMULA BOX
  //
  // lines = ['text' | ['text', color]]
  // Leading spaces indent.
  // ------------------------------------------------------------

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;

    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
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
        C.ink,
        true
      ).getWidth() / 10;

    const indents = rows.map(([s]) => {
      s = String(s);

      return cw * (
        s.length -
        s.trimStart().length
      );
    });

    const widths = texts.map(
      (t, i) =>
        t.getWidth() + indents[i]
    );

    const wd =
      Math.max(...widths) + 0.70;

    const ht =
      rows.length * lh + 0.36;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);

    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] +
      ht / 2 -
      0.18 -
      lh / 2;

    texts.forEach((t, i) => {
      t.moveTo([
        left +
          indents[i] +
          t.getWidth() / 2,

        top - i * lh,

        0
      ]);
    });

    const g = G(r, texts);

    const maxw = P
      ? FW - 1.0
      : 4.9;

    const maxh = P
      ? 1.9
      : 3.4;

    const factor = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (factor < 1) {
      g.scale(factor);
    }

    g.moveTo(BOXP);

    const a = [
      new M.FadeIn(
        g,
        { runTime: 0.40 }
      )
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(
          boxNow,
          { runTime: 0.35 }
        )
      );
    }

    boxNow = g;

    return a;
  }

  // ------------------------------------------------------------
  // TICKET CARD
  //
  // Billing = blue
  // Technical = violet
  // Account = teal
  //
  // These cards show handling times, not resolution outcomes.
  // ------------------------------------------------------------

  function ticket(
    d,
    x,
    y,
    {
      w = 0.98,
      h = 0.66,
      showValue = true,
      showRank = false,
      active = true,
      highlight = false
    } = {}
  ) {
    const color =
      active ? d.color : C.muted;

    const edge =
      highlight ? WARN : color;

    const a = [];

    a.push(
      rounded(
        x,
        y,
        w + 0.10,
        h + 0.10,
        edge,
        active ? 0.10 : 0.015,
        0
      ),

      rounded(
        x,
        y,
        w,
        h,
        edge,
        active ? 0.13 : 0.025,
        highlight ? 2.8 : 1.6
      )
    );

    if (showValue) {
      a.push(
        text(
          d.minutes,
          x,
          y + (showRank ? 0.10 : 0),
          w < 0.60 ? 17 : 24,
          color,
          true,
          w - 0.07
        )
      );
    } else {
      a.push(
        line(
          x - w * 0.27,
          y + 0.08,
          x + w * 0.27,
          y + 0.08,
          color,
          1.4
        ),

        line(
          x - w * 0.27,
          y - 0.09,
          x + w * 0.14,
          y - 0.09,
          color,
          1.4
        )
      );
    }

    if (showRank) {
      a.push(
        text(
          `r${d.rank}`,
          x,
          y - h * 0.29,
          13,
          RANK,
          true,
          w - 0.04
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // OPENING RECAP
  // Two groups in the previous lesson; three groups here.
  // ------------------------------------------------------------

  function groupRecap(three = false) {
    const a = [];

    const groups = three
      ? QUEUES
      : [
        {
          name: 'Old script',
          color: C.amber
        },

        {
          name: 'New script',
          color: C.cyan
        }
      ];

    const count = groups.length;

    const pitch =
      count === 3 ? 2.12 : 3.10;

    const y = P ? -0.45 : -0.22;

    groups.forEach((g, i) => {
      const x =
        CX +
        (i - (count - 1) / 2) *
          pitch;

      const w =
        count === 3 ? 1.94 : 2.80;

      a.push(
        rounded(
          x,
          y,
          w,
          2.10,
          g.color,
          0.045,
          2
        ),

        text(
          g.name,
          x,
          y + 0.73,
          20,
          g.color,
          false,
          w - 0.14
        )
      );

      for (let j = 0; j < 4; j++) {
        const px =
          x + (j % 2 - 0.5) * 0.66;

        const py =
          y + 0.14 -
          Math.floor(j / 2) * 0.57;

        a.push(
          ticket(
            {
              color: g.color,
              minutes: null
            },
            px,
            py,
            {
              w: 0.53,
              h: 0.42,
              showValue: false
            }
          )
        );
      }
    });

    a.push(
      text(
        three
          ? 'Now compare three independent groups'
          : 'Previously: two independent groups',
        CX,
        y - 1.62,
        21,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // THREE QUEUES OF FOUR TICKETS
  // The group layouts remain consistent through the lesson.
  // ------------------------------------------------------------

  const QUEUE_YS = P
    ? [0.68, -1.20, -3.08]
    : [0.88, -0.35, -1.58];

  const GROUP_SP = P ? 1.19 : 1.16;

  function queueSlot(group, index) {
    return [
      CX + 0.65 + (index - 1.5) * GROUP_SP,
      QUEUE_YS[group],
      0
    ];
  }

  function queueFrames() {
    const a = [];

    QUEUES.forEach((q, group) => {
      const y = QUEUE_YS[group];

      a.push(
        rounded(
          CX,
          y,
          6.35,
          P ? 1.38 : 1.04,
          q.color,
          0.035,
          1.5
        ),

        text(
          q.name,
          CX - 2.35,
          y + 0.18,
          19,
          q.color,
          false,
          1.55
        ),

        text(
          '4 tickets',
          CX - 2.35,
          y - 0.23,
          15,
          C.muted
        )
      );
    });

    a.push(
      text(
        'Handling time in minutes',
        CX,
        P ? -4.08 : -2.43,
        18,
        C.muted
      )
    );

    return G(a);
  }

  function queuePicture({
    reveal = [true, true, true],
    focus = null,
    outlier = false
  } = {}) {
    const a = [
      queueFrames()
    ];

    QUEUES.forEach((q, group) => {
      q.times.forEach((minutes, index) => {
        const p =
          queueSlot(group, index);

        const d =
          DATA.find(
            v =>
              v.group === group &&
              v.minutes === minutes
          );

        a.push(
          ticket(
            d,
            p[0],
            p[1],
            {
              w: 0.97,
              h: P ? 0.78 : 0.61,
              showValue: reveal[group],
              active:
                focus === null ||
                focus === group,

              highlight:
                outlier &&
                minutes === 45
            }
          )
        );
      });
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // HANDLING-TIME DOT PLOTS
  // All three queues use the same minute scale.
  // ------------------------------------------------------------

  const TIME_LEFT = CX - 2.18;
  const TIME_RIGHT = CX + 3.14;

  const tx = minutes =>
    TIME_LEFT +
    minutes / 50 *
      (TIME_RIGHT - TIME_LEFT);

  function timeDot(
    d,
    y,
    label = true,
    active = true
  ) {
    const color =
      active ? d.color : C.muted;

    const x = tx(d.minutes);

    const halo = dot(
      x,
      y,
      color,
      0.20
    );

    halo.setFill(
      color,
      active ? 0.14 : 0.025
    );

    return G(
      halo,

      dot(
        x,
        y,
        color,
        0.10
      ),

      label
        ? text(
          d.minutes,
          x,
          y + 0.29,
          15,
          color,
          true
        )
        : null
    );
  }

  function timePlot({
    means = false,
    focus = null,
    outlier = false
  } = {}) {
    const a = [];

    const ys = P
      ? [0.61, -1.02, -2.65]
      : [0.85, -0.35, -1.55];

    STATS.forEach((g, i) => {
      const y = ys[i];

      a.push(
        text(
          g.name,
          CX - 2.74,
          y + 0.13,
          17,
          g.color,
          false,
          1.10
        ),

        line(
          TIME_LEFT,
          y,
          TIME_RIGHT,
          y,
          C.muted,
          1.5
        )
      );

      [0, 10, 20, 30, 40, 50]
        .forEach(v => {
          a.push(
            line(
              tx(v),
              y - 0.055,
              tx(v),
              y + 0.055,
              C.muted,
              1
            )
          );

          if (i === 2) {
            a.push(
              text(
                v,
                tx(v),
                y - 0.28,
                15,
                C.muted,
                true
              )
            );
          }
        });

      g.records.forEach(d => {
        const active =
          focus === null ||
          focus === i;

        a.push(
          timeDot(
            d,
            y + 0.14,
            true,
            active
          )
        );
      });

      if (means) {
        const x = tx(g.meanMinutes);

        a.push(
          dashed(
            x,
            y - 0.30,
            x,
            y + 0.56,
            g.color
          ),

          text(
            `Mean ${format(g.meanMinutes)}`,
            x,
            y - 0.33,
            15,
            g.color,
            true,
            2.0
          )
        );
      }

      if (outlier && i === 1) {
        a.push(
          rounded(
            tx(45),
            y + 0.26,
            0.58,
            0.82,
            WARN,
            0,
            2.6
          )
        );
      }
    });

    a.push(
      text(
        'Minutes per ticket',
        CX,
        P ? -3.65 : -2.45,
        18,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // TECHNICAL OUTLIER
  //
  // Actual Technical times: 12, 15, 20, 45.
  // Mean = 23 minutes.
  //
  // Mean without the 45-minute observation:
  // (12 + 15 + 20) / 3 = 15.666...
  //
  // The three-ticket mean is a sensitivity illustration,
  // not a recommendation to remove the observed ticket.
  // ------------------------------------------------------------

  function outlierPicture({
    showMean = true,
    compareWithout = false
  } = {}) {
    const a = [];

    const values =
      QUEUES[1].times;

    const base =
      P ? -3.05 : -1.94;

    const scale =
      P ? 0.087 : 0.061;

    const xs = values.map(
      (_, i) =>
        CX + (i - 1.5) * 1.36
    );

    values.forEach((v, i) => {
      const h = v * scale;

      const color =
        v === 45 ? WARN : TECHNICAL;

      a.push(
        rect(
          xs[i],
          base + h / 2,
          0.86,
          h,
          color,
          0.81,
          1.4
        ),

        rect(
          xs[i],
          base + h / 2,
          0.99,
          h + 0.07,
          color,
          0.09,
          0
        ),

        text(
          `${v} min`,
          xs[i],
          base - 0.3,
          18,
          color,
          true
        )
      );
    });

    a.push(
      line(
        CX - 3.10,
        base,
        CX + 3.10,
        base,
        C.muted,
        2
      ),

      text(
        'Technical handling times',
        CX - 0.75,
        P ? 1.31 : 1.38,
        21,
        TECHNICAL
      )
    );

    if (showMean) {
      const meanY =
        base + STATS[1].meanMinutes * scale;

      a.push(
        dashed(
          CX - 3.08,
          meanY,
          CX + 3.08,
          meanY,
          WARN
        ),

        text(
          'mean 23',
          CX - (P ? 3.25 : 3.4),
          meanY + 0.22,
          17,
          WARN,
          true
        )
      );
    }

    if (compareWithout) {
      const otherMean =
        (12 + 15 + 20) / 3;

      const y =
        base + otherMean * scale;

      a.push(
        dashed(
          CX - 3.08,
          y,
          CX + 3.08,
          y,
          C.cyan
        ),

        text(
          'others 15.7',
          CX - (P ? 3.25 : 3.4),
          y + 0.22,
          16,
          C.cyan,
          true,
          P ? 1.4 : 2.0
        )
      );
    }

    a.push(
      text(
        'One long ticket has a large effect on the mean',
        CX,
        base - 0.83,
        18,
        WARN,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SORTABLE TICKET CARDS
  //
  // Preserve every ticket's identity as it moves from its own
  // queue to the pooled ordered line.
  // ------------------------------------------------------------

  const SORT_SP = P ? 0.55 : 0.55;

  const SORT_Y =
    P ? -0.65 : -0.25;

  const sx = i =>
    CX + (i - 5.5) * SORT_SP;

  function sortableTicket(
    d,
    x,
    y,
    compact = false
  ) {
    const w = compact
      ? 0.48
      : 0.91;

    const h = compact
      ? 0.66
      : 0.65;

    return G(
      rounded(
        x,
        y,
        w + 0.045,
        h + 0.055,
        d.color,
        0.10,
        0
      ),

      rounded(
        x,
        y,
        w,
        h,
        d.color,
        0.15,
        1.6
      ),

      text(
        d.minutes,
        x,
        y,
        compact ? 18 : 24,
        d.color,
        true,
        w - 0.05
      )
    );
  }

  function pooledAxis(
    showRankLabel = false
  ) {
    const a = [];

    a.push(
      line(
        sx(0) - 0.26,
        SORT_Y - 0.48,
        sx(11) + 0.26,
        SORT_Y - 0.48,
        C.muted,
        2
      ),

      text(
        'Shortest  →  Longest',
        CX,
        SORT_Y + 1.24,
        22,
        RANK
      ),

      text(
        'Minutes',
        CX,
        SORT_Y + 0.66,
        18,
        C.muted
      )
    );

    if (showRankLabel) {
      a.push(
        text(
          'Rank = position in the pooled line',
          CX,
          SORT_Y - 1.48,
          19,
          RANK,
          false,
          6.5
        )
      );
    }

    return G(a);
  }

  function queueLegend(
    y
  ) {
    const a = [];

    QUEUES.forEach((q, i) => {
      const x =
        CX + (i - 1) * 2.08;

      a.push(
        dot(
          x - 0.72,
          y,
          q.color,
          0.085
        ),

        text(
          q.name,
          x + 0.11,
          y,
          17,
          q.color,
          false,
          1.78
        )
      );
    });

    return G(a);
  }

  function rankLabel(
    rank,
    index,
    color = RANK
  ) {
    return G(
      rounded(
        sx(index),
        SORT_Y - 0.91,
        0.47,
        0.43,
        color,
        0.12,
        1.3
      ),

      text(
        rank,
        sx(index),
        SORT_Y - 0.91,
        17,
        color,
        true,
        0.42
      )
    );
  }

  function pooledPicture({
    ranks = true,
    focus = null,
    highlightOutlier = false
  } = {}) {
    const a = [
      pooledAxis(ranks)
    ];

    RANKED.forEach((d, i) => {
      const active =
        focus === null ||
        focus === d.group;

      const color =
        active ? d.color : C.muted;

      a.push(
        rounded(
          sx(i),
          SORT_Y,
          0.48,
          0.66,
          color,
          active ? 0.16 : 0.025,
          active ? 1.8 : 0.7
        ),

        text(
          d.minutes,
          sx(i),
          SORT_Y,
          18,
          color,
          true,
          0.43
        )
      );

      if (ranks) {
        a.push(
          rankLabel(
            d.rank,
            i,
            active ? color : C.muted
          )
        );
      }

      if (
        highlightOutlier &&
        d.minutes === 45
      ) {
        a.push(
          rounded(
            sx(i),
            SORT_Y - 0.40,
            0.55,
            1.64,
            WARN,
            0,
            2.6
          )
        );
      }
    });

    a.push(
      queueLegend(
        SORT_Y - (ranks ? 1.99 : 1.12)
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // OUTLIER COMPARISON: RAW MINUTES VERSUS RANKS
  //
  // 20 to 45 minutes is a gap of 25 minutes.
  // Rank 11 to rank 12 is a gap of just one rank.
  // ------------------------------------------------------------

  function outlierRankPicture() {
    const a = [];

    const centers = [
      CX - 1.55,
      CX + 1.55
    ];

    const values = [
      {
        minutes: 20,
        rank: 11
      },

      {
        minutes: 45,
        rank: 12
      }
    ];

    const base =
      P ? -1.80 : -1.32;

    const scale =
      P ? 0.061 : 0.046;

    values.forEach((d, i) => {
      const x = centers[i];

      const h = d.minutes * scale;

      const color =
        i === 1 ? WARN : TECHNICAL;

      a.push(
        rect(
          x,
          base + h / 2,
          0.98,
          h,
          color,
          0.79,
          1.5
        ),

        text(
          `${d.minutes} min`,
          x,
          base + h + 0.24,
          22,
          color,
          true
        ),

        rounded(
          x,
          base - 0.72,
          1.33,
          0.65,
          RANK,
          0.13,
          1.8
        ),

        text(
          `Rank ${d.rank}`,
          x,
          base - 0.72,
          21,
          RANK,
          true,
          1.23
        )
      );
    });

    a.push(
      line(
        CX - 2.85,
        base,
        CX + 2.85,
        base,
        C.muted,
        2
      ),

      text(
        '25-minute gap',
        CX,
        P ? 1.35 : 1.40,
        21,
        WARN
      ),

      line(
        centers[0],
        base - 1.15,
        centers[1],
        base - 1.15,
        RANK,
        2
      ),

      text(
        'Only one rank apart',
        CX,
        base - 1.48,
        21,
        RANK
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // RANK TOKEN
  // ------------------------------------------------------------

  function rankToken(
    x,
    y,
    rank,
    color,
    w = 0.72,
    h = 0.58,
    active = true
  ) {
    const c =
      active ? color : C.muted;

    return G(
      rounded(
        x,
        y,
        w + 0.06,
        h + 0.06,
        c,
        active ? 0.07 : 0.01,
        0
      ),

      rounded(
        x,
        y,
        w,
        h,
        c,
        active ? 0.16 : 0.025,
        active ? 1.7 : 0.7
      ),

      text(
        rank,
        x,
        y,
        w < 0.50 ? 15 : 23,
        c,
        true,
        w - 0.06
      )
    );
  }

  // ------------------------------------------------------------
  // RETURN RANKS TO THE THREE QUEUES
  // ------------------------------------------------------------

  const RANK_YS = P
    ? [0.62, -1.25, -3.12]
    : [0.90, -0.35, -1.60];

  function groupRankSlot(group, index) {
    return [
      CX - 0.25 + (index - 1.5) * 0.83,
      RANK_YS[group],
      0
    ];
  }

  function rankTableFrames(
    showSums = false,
    showMeans = false
  ) {
    const a = [];

    STATS.forEach((g, i) => {
      const y = RANK_YS[i];

      a.push(
        rounded(
          CX,
          y,
          6.45,
          P ? 1.35 : 1.05,
          g.color,
          0.035,
          1.6
        ),

        text(
          g.name,
          CX - 2.53,
          y,
          18,
          g.color,
          false,
          1.30
        ),

        text(
          '=',
          CX + 1.65,
          y,
          20,
          C.muted
        )
      );

      if (showSums) {
        a.push(
          text(
            showMeans
              ? g.meanRank
              : g.rankSum,
            CX + 2.45,
            y,
            26,
            g.color,
            true,
            1.25
          )
        );
      }
    });

    a.push(
      text(
        showMeans
          ? 'Mean rank = rank sum ÷ 4'
          : 'Four pooled ranks in each queue',
        CX,
        P ? -4.10 : -2.48,
        19,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  function rankTable({
    showSums = true,
    showMeans = false,
    focus = null
  } = {}) {
    const a = [
      rankTableFrames(
        showSums,
        showMeans
      )
    ];

    STATS.forEach((g, group) => {
      g.ranks.forEach((rank, i) => {
        const p =
          groupRankSlot(group, i);

        a.push(
          rankToken(
            p[0],
            p[1],
            rank,
            g.color,
            0.68,
            P ? 0.67 : 0.57,
            focus === null ||
              focus === group
          )
        );
      });
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // THREE RANK SUMS
  // Draw one small block per rank unit.
  // ------------------------------------------------------------

  function rankSumBlocks({
    reveal = 3
  } = {}) {
    const a = [];

    const centers = [
      CX - 2.12,
      CX,
      CX + 2.12
    ];

    const base =
      P ? -2.80 : -1.78;

    const dx = 0.25;

    const dy =
      P ? 0.36 : 0.25;

    const cols = 6;

    STATS.forEach((g, i) => {
      const x = centers[i];

      a.push(
        text(
          g.name,
          x,
          P ? 1.32 : 1.40,
          19,
          g.color,
          false,
          1.98
        )
      );

      if (i >= reveal) {
        a.push(
          text(
            '?',
            x,
            base + 0.85,
            34,
            C.muted
          )
        );

        return;
      }

      for (
        let j = 0;
        j < g.rankSum;
        j++
      ) {
        const px =
          x +
          (j % cols - 2.5) * dx;

        const py =
          base +
          (Math.floor(j / cols) + 0.5) *
            dy;

        a.push(
          rect(
            px,
            py,
            0.205,
            dy * 0.80,
            g.color,
            0.83,
            0.6
          )
        );
      }

      const rows =
        Math.ceil(g.rankSum / cols);

      a.push(
        text(
          g.rankSum,
          x,
          base + rows * dy + 0.26,
          28,
          g.color,
          true
        ),

        text(
          g.ranks.join('+'),
          x,
          base - 0.30,
          17,
          g.color,
          true,
          1.94
        )
      );
    });

    a.push(
      line(
        CX - 3.12,
        base,
        CX + 3.12,
        base,
        C.muted,
        2
      )
    );

    if (reveal === 3) {
      a.push(
        text(
          '14 + 41 + 23 = 78',
          CX,
          base - 0.89,
          23,
          RANK,
          true,
          6.5
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // MEAN RANKS: DIVIDE EACH SUM BY FOUR
  //
  // Fractional blocks represent average rank units,
  // not literal fractional tickets.
  // ------------------------------------------------------------

  function meanRankDivision() {
    const a = [];

    const ys = P
      ? [0.72, -1.14, -3.00]
      : [0.92, -0.32, -1.56];

    STATS.forEach((g, i) => {
      const y = ys[i];

      a.push(
        rounded(
          CX,
          y,
          6.40,
          P ? 1.43 : 1.07,
          g.color,
          0.045,
          1.5
        ),

        text(
          g.name,
          CX - 2.26,
          y + 0.23,
          18,
          g.color,
          false,
          1.64
        ),

        text(
          `${g.rankSum} ÷ 4`,
          CX - 2.26,
          y - 0.20,
          19,
          g.color,
          true,
          1.65
        )
      );

      const unit = 0.066;

      for (let j = 0; j < 4; j++) {
        const x =
          CX - 0.75 + j * 0.67;

        const width =
          g.meanRank * unit;

        a.push(
          rect(
            x,
            y + 0.10,
            0.48,
            0.64,
            g.color,
            0,
            1.2
          ),

          rect(
            x,
            y - 0.21 + width / 2,
            0.42,
            width,
            g.color,
            0.72,
            0
          )
        );
      }

      a.push(
        text(
          '=',
          CX + 1.70,
          y,
          21,
          C.muted
        ),

        text(
          g.meanRank,
          CX + 2.49,
          y,
          27,
          g.color,
          true,
          1.24
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // MEAN RANK BAR CHART
  // Each queue has its mean rank on a common 0–12 scale.
  // ------------------------------------------------------------

  const MEAN_BASE =
    P ? -3.15 : -1.82;

  const MEAN_SCALE =
    P ? 0.32 : 0.225;

  const MEAN_XS = [
    CX - 2.02,
    CX,
    CX + 2.02
  ];

  function meanRankChart({
    middle = false,
    gaps = false,
    expected = false,
    focus = null
  } = {}) {
    const a = [];

    const base = MEAN_BASE;
    const scale = MEAN_SCALE;

    a.push(
      line(
        CX - 3.12,
        base,
        CX + 3.12,
        base,
        C.muted,
        2
      )
    );

    [0, 3, 6, 9, 12].forEach(v => {
      const y =
        base + v * scale;

      a.push(
        line(
          CX - 3.05,
          y,
          CX + 3.05,
          y,
          C.muted,
          0.55
        ),

        text(
          v,
          CX - 3.30,
          y,
          14,
          C.muted,
          true
        )
      );
    });

    STATS.forEach((g, i) => {
      const x = MEAN_XS[i];

      const active =
        focus === null ||
        focus === i;

      const color =
        active ? g.color : C.muted;

      const v = expected
        ? MIDDLE
        : g.meanRank;

      const h = v * scale;

      a.push(
        rect(
          x,
          base + h / 2,
          0.95,
          h,
          color,
          expected
            ? 0.025
            : active ? 0.80 : 0.16,

          expected ? 2.3 : 1.4
        ),

        (middle && !expected)
          ? text(
            v,
            x,
            base + h - 0.26,
            21,
            active ? C.bg : g.color,
            true,
            0.9
          )
          : text(
            v,
            x,
            base + h + 0.23,
            23,
            color,
            true
          ),

        text(
          g.name,
          x,
          base - 0.35,
          18,
          g.color,
          false,
          1.85
        )
      );
    });

    if (middle) {
      const middleY =
        base + MIDDLE * scale;

      a.push(
        dashed(
          CX - 3.10,
          middleY,
          CX + 3.10,
          middleY,
          WARN
        ),

        text(
          'middle 6.5',
          MEAN_XS[0] - 0.1,
          middleY + 0.24,
          18,
          WARN,
          true,
          1.75
        )
      );

      if (gaps && !expected) {
        STATS.forEach((g, i) => {
          const x =
            MEAN_XS[i] + 0.67;

          const y =
            base +
            g.meanRank * scale;

          a.push(
            line(
              x,
              middleY,
              x,
              y,
              g.color,
              2.7
            ),

            line(
              x - 0.09,
              middleY,
              x + 0.09,
              middleY,
              g.color,
              1.8
            ),

            line(
              x - 0.09,
              y,
              x + 0.09,
              y,
              g.color,
              1.8
            ),

            text(
              signed(g.gap),
              x + 0.36,
              (middleY + y) / 2,
              16,
              g.color,
              true
            )
          );
        });
      }
    }

    a.push(
      text(
        expected
          ? 'Null expectation: all near the middle'
          : 'Observed mean ranks',
        CX,
        base - 0.84,
        19,
        RANK,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // MEAN RANK NUMBER LINE
  //
  // Direct picture of distance from the common middle rank.
  // ------------------------------------------------------------

  function meanRankLine(
    showGaps = true
  ) {
    const a = [];

    const left = CX - 3.12;
    const right = CX + 3.12;

    const X = rank =>
      left +
      (rank - 1) / 11 *
        (right - left);

    const y =
      P ? -0.90 : -0.40;

    a.push(
      line(
        left,
        y,
        right,
        y,
        C.muted,
        2.3
      )
    );

    for (let r = 1; r <= 12; r++) {
      a.push(
        line(
          X(r),
          y - 0.075,
          X(r),
          y + 0.075,
          C.muted,
          1
        ),

        text(
          r,
          X(r),
          y - 0.28,
          15,
          C.muted,
          true
        )
      );
    }

    a.push(
      dashed(
        X(MIDDLE),
        y - 0.12,
        X(MIDDLE),
        y + 1.65,
        WARN
      ),

      text(
        '6.5',
        X(MIDDLE),
        y - 0.73,
        23,
        WARN,
        true
      )
    );

    STATS.forEach((g, i) => {
      const x = X(g.meanRank);

      const yy =
        y +
        (
          i === 2
            ? 0.34
            : 0.78
        );

      const halo = dot(
        x,
        yy,
        g.color,
        0.21
      );

      halo.setFill(g.color, 0.15);

      a.push(
        halo,

        dot(
          x,
          yy,
          g.color,
          0.115
        ),

        text(
          g.name,
          x,
          yy + 0.38,
          16,
          g.color
        ),

        text(
          g.meanRank,
          x,
          yy + 0.66,
          18,
          g.color,
          true
        )
      );

      if (showGaps) {
        const gy =
          y - 1.05 - i * 0.33;

        a.push(
          line(
            X(MIDDLE),
            gy,
            x,
            gy,
            g.color,
            2.6
          ),

          text(
            signed(g.gap),
            (X(MIDDLE) + x) / 2,
            gy - 0.19,
            16,
            g.color,
            true
          )
        );
      }
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // BETWEEN-GROUP VARIATION
  //
  // Analogy to the between-group component of one-way ANOVA.
  // Here the locations are mean ranks rather than raw means.
  // ------------------------------------------------------------

  function betweenGroupPicture() {
    const a = [];

    const left = CX - 2.45;
    const right = CX + 2.95;

    const X = rank =>
      left + rank / 12 * (right - left);

    const ys = P
      ? [0.66, -1.04, -2.74]
      : [0.80, -0.32, -1.44];

    a.push(
      dashed(
        X(MIDDLE),
        ys[2] - 0.59,
        X(MIDDLE),
        ys[0] + 0.38,
        WARN
      ),

      text(
        '6.5',
        X(MIDDLE),
        ys[0] + 0.6,
        19,
        WARN,
        true
      )
    );

    STATS.forEach((g, i) => {
      const y = ys[i];

      const x = X(g.meanRank);

      a.push(
        text(
          g.name,
          CX - 2.59,
          y,
          17,
          g.color,
          false,
          1.25
        ),

        line(
          left,
          y,
          right,
          y,
          C.muted,
          1
        ),

        line(
          X(MIDDLE),
          y,
          x,
          y,
          g.color,
          5
        ),

        dot(
          x,
          y,
          g.color,
          0.13
        ),

        text(
          g.meanRank,
          x,
          y + 0.34,
          20,
          g.color,
          true
        ),

        text(
          `Gap ${signed(g.gap)}`,
          Math.abs(g.gap) < 1.5
            ? x + Math.sign(g.gap) * 0.85
            : (x + X(MIDDLE)) / 2,
          y - 0.36,
          17,
          g.color,
          true,
          2.20
        )
      );
    });

    a.push(
      text(
        'Between-group distances, measured in ranks',
        CX,
        P ? -3.95 : -2.45,
        18,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SQUARE A GAP AND MULTIPLY BY GROUP SIZE
  //
  // Each square has side length equal to the absolute gap.
  // Four identical squares represent the four tickets.
  //
  // All queue squares use the same geometric scale.
  // ------------------------------------------------------------

  function squaredGapPicture(
    group
  ) {
    const g = STATS[group];

    const a = [];

    const y =
      P ? -0.70 : -0.35;

    const side =
      Math.abs(g.gap) * 0.39;

    const pitch = 1.55;

    a.push(
      text(
        g.name,
        CX,
        P ? 1.34 : 1.40,
        24,
        g.color
      ),

      text(
        `${format(g.meanRank)} − 6.5 = ${signed(g.gap)}`,
        CX,
        P ? 0.78 : 0.84,
        25,
        g.color,
        true,
        6.5
      )
    );

    for (let i = 0; i < g.n; i++) {
      const x =
        CX +
        (i - 1.5) * pitch;

      a.push(
        rect(
          x,
          y,
          side,
          side,
          g.color,
          0.68,
          2
        ),

        text(
          format(g.squaredGap),
          x,
          y,
          18,
          C.ink,
          true,
          Math.max(0.23, side - 0.04)
        )
      );
    }

    a.push(
      text(
        `One square: ${format(Math.abs(g.gap))}² = ${format(g.squaredGap)}`,
        CX,
        y - 1.05,
        20,
        g.color,
        true,
        6.5
      ),

      text(
        `${g.n} × ${format(g.squaredGap)} = ${format(g.weightedGap)}`,
        CX,
        y - 1.61,
        25,
        g.color,
        true,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ALL THREE WEIGHTED SQUARED GAPS
  // ------------------------------------------------------------

  function contributionsPicture({
    stage = 3
  } = {}) {
    const a = [];

    const ys = P
      ? [0.69, -1.03, -2.75]
      : [0.88, -0.36, -1.60];

    STATS.forEach((g, i) => {
      const y = ys[i];

      a.push(
        rounded(
          CX,
          y,
          6.43,
          P ? 1.35 : 1.06,
          g.color,
          0.045,
          1.4
        ),

        text(
          g.name,
          CX - 2.45,
          y,
          18,
          g.color,
          false,
          1.40
        ),

        text(
          signed(g.gap),
          CX - 0.97,
          y,
          21,
          g.color,
          true,
          1.1
        )
      );

      if (stage >= 1) {
        a.push(
          text(
            '²',
            CX - 0.25,
            y + 0.13,
            21,
            RANK
          ),

          text(
            format(g.squaredGap),
            CX + 0.35,
            y,
            19,
            g.color,
            true,
            1.15
          )
        );
      }

      if (stage >= 2) {
        a.push(
          text(
            '×4',
            CX + 1.26,
            y,
            20,
            C.muted,
            true
          )
        );
      }

      if (stage >= 3) {
        a.push(
          text(
            '=',
            CX + 1.91,
            y,
            18,
            C.muted
          ),

          text(
            format(g.weightedGap),
            CX + 2.48,
            y,
            22,
            g.color,
            true,
            1.13
          )
        );
      }
    });

    if (stage >= 3) {
      a.push(
        text(
          '36 + 56.25 + 2.25 = 94.5',
          CX,
          P ? -3.95 : -2.45,
          21,
          RANK,
          true,
          6.5
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // TOTAL SPREAD AND SCALE FACTOR
  //
  // One horizontal bar represents 94.5 weighted squared
  // rank-distance units.
  // ------------------------------------------------------------

  function scalePicture(
    scaled = false
  ) {
    const a = [];

    const w = 6.05;
    const left = CX - w / 2;

    const y = P ? 0.20 : 0.35;

    let cursor = left;

    STATS.forEach(g => {
      const width =
        w * g.weightedGap / BETWEEN;

      a.push(
        rect(
          cursor + width / 2,
          y,
          width,
          0.72,
          g.color,
          0.80,
          1.2
        )
      );

      if (width > 0.6) {
        a.push(
          text(
            format(g.weightedGap),
            cursor + width / 2,
            y,
            20,
            C.ink,
            true,
            width - 0.10
          )
        );
      }

      cursor += width;
    });

    a.push(
      text(
        'Combined weighted squared gaps',
        CX,
        y + 0.68,
        21,
        RANK
      ),

      text(
        '94.5',
        CX,
        y - 0.64,
        29,
        RANK,
        true
      ),

      line(
        left + w - 0.06,
        y + 0.40,
        CX + 2.65,
        y + 1.00,
        ACCOUNT,
        1.5
      ),

      text(
        '2.25',
        CX + 2.65,
        y + 1.16,
        17,
        ACCOUNT,
        true
      )
    );

    if (scaled) {
      a.push(
        text(
          '× 12 / (12 × 13)',
          CX,
          y - 1.24,
          24,
          RANK,
          true
        ),

        rounded(
          CX,
          y - 2.02,
          4.65,
          0.75,
          GOOD,
          0.10,
          2
        ),

        text(
          `H = ${H.toFixed(2)}`,
          CX,
          y - 2.02,
          31,
          GOOD,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // H STATISTIC SUMMARY
  // ------------------------------------------------------------

  function statisticPicture() {
    const a = [];

    const ys = P
      ? [0.73, -0.65, -2.03]
      : [0.91, -0.29, -1.49];

    const steps = [
      {
        title: '4 × gap² for each queue',
        value: '36 + 56.25 + 2.25 = 94.5',
        color: RANK
      },

      {
        title: 'Scale the total',
        value: '94.5 × 12 / (12 × 13)',
        color: C.cyan
      },

      {
        title: 'Kruskal–Wallis statistic',
        value: `H ≈ ${H.toFixed(2)}`,
        color: GOOD
      }
    ];

    steps.forEach((step, i) => {
      const y = ys[i];

      a.push(
        rounded(
          CX,
          y,
          6.10,
          P ? 1.07 : 0.94,
          step.color,
          0.06,
          1.6
        ),

        text(
          step.title,
          CX,
          y + 0.23,
          18,
          step.color,
          false,
          5.85
        ),

        text(
          step.value,
          CX,
          y - 0.18,
          24,
          step.color,
          true,
          5.85
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // CHI-SQUARE NULL CURVE, df = 2
  //
  // f(x) = 0.5 * exp(-x/2), x >= 0.
  //
  // The observed statistic is compared with the upper tail.
  // This is an approximation for the small groups in the lesson.
  // ------------------------------------------------------------

  function luckCurve({
    showDF = false,
    showCutoff = false,
    showObserved = false,
    showTail = false
  } = {}) {
    const a = [];

    const w =
      P ? 6.25 : 6.45;

    const h =
      P ? 3.95 : 2.70;

    const x0 =
      CX - w / 2;

    const y0 =
      P ? -3.25 : -1.82;

    const xmax = 14;

    const segments = 160;

    const X = v =>
      x0 + v / xmax * w;

    const height = v =>
      h * Math.exp(-v / 2);

    const Y = v =>
      y0 + height(v);

    a.push(
      line(
        X(0),
        y0,
        X(xmax),
        y0,
        C.muted,
        2
      ),

      line(
        X(0),
        y0,
        X(0),
        y0 + h + 0.08,
        C.muted,
        2
      )
    );

    // Shade the true chi-square density to the right of H.

    if (showTail) {
      const count = 95;

      const dx =
        (xmax - H) / count;

      for (let j = 0; j < count; j++) {
        const value =
          H + (j + 0.5) * dx;

        const hh = height(value);

        a.push(
          rect(
            X(value),
            y0 + hh / 2,
            w * dx / xmax + 0.004,
            hh,
            C.cyan,
            0.87,
            0
          )
        );
      }
    }

    // Draw the density curve using consecutive segments.

    for (let j = 0; j < segments; j++) {
      const u =
        xmax * j / segments;

      const v =
        xmax * (j + 1) / segments;

      a.push(
        line(
          X(u),
          Y(u),
          X(v),
          Y(v),
          RANK,
          2.7
        )
      );
    }

    [0, 2, 4, 6, 8, 10, 12, 14]
      .forEach(v => {
        a.push(
          line(
            X(v),
            y0 - 0.065,
            X(v),
            y0 + 0.065,
            C.muted,
            1
          ),

          text(
            v,
            X(v),
            y0 - 0.28,
            15,
            C.muted,
            true
          )
        );
      });

    a.push(
      text(
        'Kruskal–Wallis H statistic',
        CX,
        y0 - 0.78,
        18,
        C.muted,
        false,
        6.5
      ),

      text(
        'Approximate null distribution',
        CX + 0.90,
        y0 + h - 0.13,
        18,
        RANK,
        false,
        4.35
      )
    );

    if (showDF) {
      a.push(
        text(
          'χ², df = 2',
          CX + 1.05,
          y0 + h - 0.61,
          24,
          RANK,
          true
        )
      );
    }

    if (showCutoff) {
      const yy =
        y0 + h * 0.52;

      a.push(
        dashed(
          X(CUTOFF),
          y0,
          X(CUTOFF),
          yy,
          WARN
        ),

        text(
          '5.99',
          X(CUTOFF) - 0.35,
          yy + 0.22,
          20,
          WARN,
          true
        ),

        text(
          '5% cutoff',
          X(CUTOFF) - 0.38,
          yy + 0.54,
          16,
          WARN
        )
      );
    }

    if (showObserved) {
      const yy =
        y0 + h * 0.32;

      a.push(
        dashed(
          X(H),
          y0,
          X(H),
          yy,
          C.cyan
        ),

        dot(
          X(H),
          y0,
          C.cyan,
          0.09
        ),

        text(
          `H = ${H.toFixed(2)}`,
          X(H) + 0.62,
          yy + 0.20,
          21,
          C.cyan,
          true
        )
      );
    }

    if (showTail) {
      a.push(
        line(
          X(10.6),
          y0 + h * 0.19,
          X(8.3),
          Y(8.3) + 0.025,
          C.cyan,
          1.5
        ),

        text(
          `p ≈ ${PV.toFixed(3)}`,
          X(10.7),
          y0 + h * 0.19 + 0.24,
          21,
          C.cyan,
          true
        ),

        text(
          'Tail continues →',
          X(12.25),
          y0 + 0.36,
          13,
          C.muted,
          false,
          1.9
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // DEGREES OF FREEDOM
  //
  // With group sizes fixed, the three rank sums must add to 78.
  // Once two sums are known, the third is determined.
  // ------------------------------------------------------------

  function degreesPicture(
    revealLast = false
  ) {
    const a = [];

    const xs = [
      CX - 2.02,
      CX,
      CX + 2.02
    ];

    const y =
      P ? 0.13 : 0.28;

    STATS.forEach((g, i) => {
      const x = xs[i];

      const known =
        i < 2 || revealLast;

      a.push(
        rounded(
          x,
          y,
          1.76,
          1.30,
          g.color,
          0.07,
          1.8
        ),

        text(
          g.name,
          x,
          y + 0.36,
          18,
          g.color,
          false,
          1.62
        ),

        text(
          known
            ? g.rankSum
            : '?',
          x,
          y - 0.15,
          31,
          g.color,
          true
        ),

        text(
          i < 2
            ? 'Free to vary'
            : 'Determined',
          x,
          y - 0.91,
          16,
          i < 2 ? RANK : WARN,
          false,
          1.82
        )
      );
    });

    a.push(
      text(
        revealLast
          ? '78 − 14 − 41 = 23'
          : 'The three sums must total 78',
        CX,
        y - 1.48,
        24,
        RANK,
        revealLast,
        6.5
      ),

      text(
        'df = 3 − 1 = 2',
        CX,
        y - 2.04,
        28,
        GOOD,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // APPROXIMATELY THREE IN A HUNDRED
  //
  // A visual approximation of p ≈ 0.0264.
  // These tiles are not simulated observations.
  // ------------------------------------------------------------

  function hundredWorlds() {
    const a = [];

    const cols = 10;

    const dx = 0.47;

    const dy =
      P ? 0.34 : 0.24;

    const top =
      P ? 1.03 : 1.05;

    for (let i = 0; i < 100; i++) {
      const x =
        CX + (i % cols - 4.5) * dx;

      const y =
        top - Math.floor(i / cols) * dy;

      const active =
        i >= 97;

      a.push(
        rounded(
          x,
          y,
          0.37,
          P ? 0.25 : 0.17,
          active ? C.cyan : C.muted,
          active ? 0.92 : 0.18,
          active ? 1.2 : 0.4,
          0.025
        )
      );
    }

    a.push(
      text(
        'About 3 in 100',
        CX,
        top - 9 * dy - 0.54,
        26,
        C.cyan,
        true
      ),

      text(
        'Under the approximate null model',
        CX,
        top - 9 * dy - 0.99,
        17,
        C.muted,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // DECISION: APPROXIMATE P-VALUE BELOW 5%
  // ------------------------------------------------------------

  function decisionPicture() {
    const a = [];

    const w =
      P ? 6.10 : 6.40;

    const left =
      CX - w / 2;

    const y =
      P ? -0.48 : -0.30;

    const maxP = 0.10;

    const X = v =>
      left + v / maxP * w;

    a.push(
      rect(
        X(ALPHA / 2),
        y,
        w / 2,
        0.48,
        GOOD,
        0.23,
        0
      ),

      rect(
        X(0.075),
        y,
        w / 2,
        0.48,
        C.muted,
        0.12,
        0
      ),

      line(
        X(0),
        y,
        X(maxP),
        y,
        C.muted,
        2
      )
    );

    for (let i = 0; i <= 10; i++) {
      const v = i / 100;

      a.push(
        line(
          X(v),
          y - 0.10,
          X(v),
          y + 0.10,
          C.muted,
          1
        )
      );

      if ([0, 2, 5, 8, 10].includes(i)) {
        a.push(
          text(
            `${i}%`,
            X(v),
            y - 0.34,
            16,
            C.muted,
            true
          )
        );
      }
    }

    a.push(
      dashed(
        X(ALPHA),
        y - 0.22,
        X(ALPHA),
        y + 1.07,
        WARN
      ),

      text(
        '5% cutoff',
        X(ALPHA) + 0.66,
        y + 1.20,
        19,
        WARN
      ),

      line(
        X(PV),
        y - 0.21,
        X(PV),
        y + 0.72,
        C.cyan,
        3
      ),

      dot(
        X(PV),
        y,
        C.cyan,
        0.11
      ),

      text(
        'p ≈ 2.6%',
        X(PV),
        y + 0.94,
        24,
        C.cyan,
        true
      ),

      text(
        'Reject',
        X(0.025),
        y - 0.95,
        22,
        GOOD
      ),

      text(
        'Do not reject',
        X(0.075),
        y - 0.95,
        19,
        C.muted
      ),

      text(
        'Evidence that the queues are not all alike',
        CX,
        y - 1.53,
        20,
        GOOD,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // GENERAL KRUSKAL–WALLIS FORMULA
  //
  // H = 12/[N(N+1)] * sum[n_g*(meanRank_g - middle)^2]
  //
  // This is the uncorrected formula.
  // It applies directly because the actual data have no ties.
  // ------------------------------------------------------------

  function generalFormulaPicture(
    substituted = false
  ) {
    const a = [];

    const y =
      P ? 0.37 : 0.43;

    a.push(
      text(
        'H =',
        CX - 2.50,
        y + 0.12,
        34,
        RANK,
        true
      ),

      text(
        '12',
        CX - 0.96,
        y + 0.46,
        29,
        RANK,
        true
      ),

      line(
        CX - 1.93,
        y + 0.08,
        CX,
        y + 0.08,
        C.ink,
        2
      ),

      text(
        substituted
          ? '12(13)'
          : 'N(N+1)',
        CX - 0.96,
        y - 0.31,
        24,
        RANK,
        true
      ),

      text(
        '×',
        CX + 0.35,
        y + 0.08,
        28,
        C.ink
      ),

      text(
        substituted ? '94.5' : 'Σ',
        CX + 1.63,
        y + 0.08,
        32,
        substituted ? GOOD : RANK,
        true
      )
    );

    if (!substituted) {
      a.push(
        text(
          'Σ over all queues',
          CX + 1.63,
          y - 0.46,
          17,
          RANK,
          false,
          2.75
        ),

        rounded(
          CX,
          y - 1.24,
          6.03,
          0.83,
          RANK,
          0.07,
          1.5
        ),

        text(
          'n × (mean rank − middle)²',
          CX,
          y - 1.24,
          24,
          RANK,
          true,
          5.80
        ),

        text(
          'Calculate one contribution per queue',
          CX,
          y - 1.97,
          19,
          C.muted,
          false,
          6.5
        )
      );
    } else {
      a.push(
        text(
          'N = 12; middle = (12 + 1)/2 = 6.5',
          CX,
          y - 1.02,
          20,
          RANK,
          true,
          6.5
        ),

        rounded(
          CX,
          y - 1.80,
          4.75,
          0.75,
          GOOD,
          0.10,
          2
        ),

        text(
          'H ≈ 7.27',
          CX,
          y - 1.80,
          30,
          GOOD,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // SOFTWARE CALCULATION
  // Displays checked results from the current dataset.
  // ------------------------------------------------------------

  function softwarePicture() {
    const a = [];

    const y =
      P ? -0.35 : -0.20;

    const w = 6.10;
    const h = 2.75;

    a.push(
      rounded(
        CX,
        y,
        w,
        h,
        C.muted,
        0.035,
        2,
        0.16
      ),

      rect(
        CX,
        y + h / 2 - 0.26,
        w - 0.07,
        0.44,
        RANK,
        0.17,
        0
      ),

      text(
        'Statistical software',
        CX,
        y + h / 2 - 0.26,
        20,
        RANK
      ),

      text(
        'kruskal(billing, technical, account)',
        CX,
        y + 0.55,
        17,
        C.ink,
        true,
        w - 0.36
      ),

      line(
        CX - 2.75,
        y + 0.20,
        CX + 2.75,
        y + 0.20,
        C.muted,
        1
      ),

      text(
        `H = ${H.toFixed(4)}`,
        CX,
        y - 0.17,
        25,
        GOOD,
        true
      ),

      text(
        `df = ${DF}`,
        CX - 1.47,
        y - 0.72,
        21,
        RANK,
        true
      ),

      text(
        `p ≈ ${PV.toFixed(4)}`,
        CX + 1.25,
        y - 0.72,
        21,
        C.cyan,
        true
      ),

      text(
        'Chi-square approximation',
        CX,
        y - h / 2 - 0.44,
        17,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // APPLICATION: THREE OR MORE INDEPENDENT GROUPS
  // ------------------------------------------------------------

  function applicationPicture(
    groups = 3
  ) {
    const a = [];

    const colors = [
      BILLING,
      TECHNICAL,
      ACCOUNT,
      C.amber
    ];

    const names = [
      'Group A',
      'Group B',
      'Group C',
      'Group D'
    ];

    const pitch =
      groups === 3 ? 2.10 : 1.60;

    const w = pitch - 0.16;

    const y =
      P ? 0.02 : -0.02;

    for (let i = 0; i < groups; i++) {
      const x =
        CX +
        (i - (groups - 1) / 2) *
          pitch;

      a.push(
        rounded(
          x,
          y,
          w,
          2.10,
          colors[i],
          0.045,
          1.8
        ),

        text(
          names[i],
          x,
          y + 0.76,
          19,
          colors[i],
          false,
          w - 0.12
        )
      );

      for (let j = 0; j < 4; j++) {
        const px =
          x + (j % 2 - 0.5) * 0.62;

        const py =
          y + 0.16 -
          Math.floor(j / 2) * 0.60;

        a.push(
          ticket(
            {
              color: colors[i]
            },
            px,
            py,
            {
              w: 0.49,
              h: 0.40,
              showValue: false
            }
          )
        );
      }
    }

    a.push(
      text(
        'Independent groups',
        CX,
        y - 1.48,
        22,
        RANK
      ),

      text(
        'Pool all observations and rank together',
        CX,
        y - 1.94,
        19,
        C.muted,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ONE-WAY ANOVA VERSUS KRUSKAL–WALLIS
  // Conceptual comparison, not a new hypothesis test.
  // ------------------------------------------------------------

  function anovaComparison() {
    const a = [];

    const ys = P
      ? [0.58, -1.85]
      : [0.62, -1.22];

    const examples = [
      {
        name: 'One-way ANOVA',
        subtitle: 'Group means (minutes)',
        values: STATS.map(g => g.meanMinutes),
        color: C.cyan,
        max: 25
      },

      {
        name: 'Kruskal–Wallis',
        subtitle: 'Group mean ranks',
        values: STATS.map(g => g.meanRank),
        color: RANK,
        max: 12
      }
    ];

    examples.forEach((d, i) => {
      const y = ys[i];

      a.push(
        rounded(
          CX,
          y,
          6.30,
          P ? 1.85 : 1.52,
          d.color,
          0.04,
          1.6
        ),

        text(
          d.name,
          CX - 1.65,
          y + 0.35,
          21,
          d.color,
          false,
          2.90
        ),

        text(
          d.subtitle,
          CX - 1.65,
          y - 0.20,
          17,
          C.muted,
          false,
          2.90
        )
      );

      d.values.forEach((value, j) => {
        const x =
          CX + 0.55 + j * 0.88;

        const h =
          value / d.max *
          (P ? 1.13 : 0.88);

        const base = y - 0.54;

        a.push(
          rect(
            x,
            base + h / 2,
            0.53,
            h,
            STATS[j].color,
            0.80,
            1.2
          ),

          text(
            format(value),
            x,
            base + h + 0.15,
            15,
            STATS[j].color,
            true,
            0.76
          )
        );
      });
    });

    a.push(
      text(
        'Both assess differences across multiple groups',
        CX,
        P ? -3.30 : -2.42,
        18,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // OMNIBUS TEST TRAP
  //
  // Rejection means the distributions are not all identical.
  // It does not establish which particular pairs differ.
  // ------------------------------------------------------------

  function omnibusPicture(
    followUp = false
  ) {
    const a = [];

    const centers = [
      [CX, P ? 0.88 : 0.98],
      [CX - 1.95, P ? -1.62 : -1.05],
      [CX + 1.95, P ? -1.62 : -1.05]
    ];

    const pairs = [
      [0, 1],
      [0, 2],
      [1, 2]
    ];

    pairs.forEach(([i, j]) => {
      const p1 = centers[i];
      const p2 = centers[j];

      a.push(
        dashed(
          p1[0],
          p1[1],
          p2[0],
          p2[1],
          followUp ? RANK : C.muted
        )
      );

      const mx =
        (p1[0] + p2[0]) / 2;

      const my =
        (p1[1] + p2[1]) / 2;

      a.push(
        rounded(
          mx,
          my,
          0.48,
          0.43,
          followUp ? RANK : WARN,
          0.18,
          1.3
        ),

        text(
          '?',
          mx,
          my,
          22,
          followUp ? RANK : WARN
        )
      );
    });

    STATS.forEach((g, i) => {
      const [x, y] =
        centers[i];

      a.push(
        rounded(
          x,
          y,
          1.91,
          0.78,
          g.color,
          0.19,
          2
        ),

        text(
          g.name,
          x,
          y + 0.14,
          18,
          g.color,
          false,
          1.78
        ),

        text(
          `Mean rank ${g.meanRank}`,
          x,
          y - 0.18,
          14,
          g.color,
          true,
          1.75
        )
      );
    });

    a.push(
      text(
        followUp
          ? 'Three possible follow-up comparisons'
          : 'Overall difference detected',
        CX,
        P ? -2.70 : -1.94,
        21,
        followUp ? RANK : GOOD,
        false,
        6.5
      ),

      text(
        followUp
          ? 'Adjust for multiple testing'
          : 'Which pairs differ? Not yet established.',
        CX,
        P ? -3.22 : -2.46,
        19,
        WARN,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // MULTIPLE COMPARISONS
  //
  // Illustrate the three pairwise questions without inventing
  // pairwise significance results.
  // ------------------------------------------------------------

  function followUpPicture() {
    const a = [];

    const comparisons = [
      [0, 1],
      [0, 2],
      [1, 2]
    ];

    const ys = P
      ? [0.73, -1.04, -2.81]
      : [0.88, -0.36, -1.60];

    comparisons.forEach(([i, j], r) => {
      const left = STATS[i];
      const right = STATS[j];

      const y = ys[r];

      a.push(
        rounded(
          CX - 1.74,
          y,
          2.43,
          P ? 0.86 : 0.69,
          left.color,
          0.10,
          1.5
        ),

        text(
          left.name,
          CX - 1.74,
          y,
          20,
          left.color,
          false,
          2.27
        ),

        text(
          'vs',
          CX,
          y,
          19,
          C.muted
        ),

        rounded(
          CX + 1.74,
          y,
          2.43,
          P ? 0.86 : 0.69,
          right.color,
          0.10,
          1.5
        ),

        text(
          right.name,
          CX + 1.74,
          y,
          20,
          right.color,
          false,
          2.27
        )
      );
    });

    a.push(
      text(
        'Pairwise rank comparisons + multiplicity adjustment',
        CX,
        P ? -3.88 : -2.45,
        18,
        WARN,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXACT SMALL-SAMPLE NULL DISTRIBUTION
  //
  // For illustration in beat 39, enumerate all labelled
  // allocations of twelve distinct ranks into groups of four.
  //
  // Number of allocations:
  // C(12,4) * C(8,4) = 34,650.
  //
  // This calculation is separate from the chi-square p-value
  // used throughout the narrated worked example.
  // ------------------------------------------------------------

  function combinations(values, k) {
    const result = [];

    function walk(start, chosen) {
      if (chosen.length === k) {
        result.push(chosen.slice());
        return;
      }

      const needed =
        k - chosen.length;

      for (
        let i = start;
        i <= values.length - needed;
        i++
      ) {
        chosen.push(values[i]);

        walk(i + 1, chosen);

        chosen.pop();
      }
    }

    walk(0, []);

    return result;
  }

  const ALL_RANKS =
    RANKED.map(d => d.rank);

  let exactCache = null;

  function exactNull() {
    if (exactCache) {
      return exactCache;
    }

    const values = [];

    const firstGroups =
      combinations(ALL_RANKS, 4);

    let extreme = 0;

    firstGroups.forEach(billingRanks => {
      const usedB =
        new Set(billingRanks);

      const remaining =
        ALL_RANKS.filter(
          rank => !usedB.has(rank)
        );

      const secondGroups =
        combinations(remaining, 4);

      const rb =
        billingRanks.reduce(
          (sum, rank) => sum + rank,
          0
        );

      secondGroups.forEach(technicalRanks => {
        const rt =
          technicalRanks.reduce(
            (sum, rank) => sum + rank,
            0
          );

        const ra =
          TOTAL_RANK - rb - rt;

        const sums = [
          rb,
          rt,
          ra
        ];

        const between = sums.reduce(
          (sum, rankSum) => {
            const gap =
              rankSum / 4 - MIDDLE;

            return sum + 4 * gap * gap;
          },
          0
        );

        const h =
          SCALE *
          between /
          TIE_CORRECTION;

        values.push(h);

        if (h >= H - 1e-10) {
          extreme++;
        }
      });
    });

    exactCache = {
      values,
      total: values.length,
      extreme,
      p: extreme / values.length
    };

    return exactCache;
  }

  // ------------------------------------------------------------
  // EXACT ENUMERATION PICTURE
  // Show several possible fixed-size allocations.
  // No random group sizes are introduced.
  // ------------------------------------------------------------

  function allocationPicture(
    example = 0
  ) {
    const allocations = [
      [
        [1, 3, 4, 6],
        [8, 10, 11, 12],
        [2, 5, 7, 9]
      ],

      [
        [1, 5, 8, 11],
        [2, 4, 7, 12],
        [3, 6, 9, 10]
      ],

      [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12]
      ]
    ];

    const groups =
      allocations[example % allocations.length];

    const a = [];

    const y =
      P ? 0.14 : 0.25;

    ALL_RANKS.forEach((rank, i) => {
      const group =
        groups.findIndex(
          ranks => ranks.includes(rank)
        );

      a.push(
        rankToken(
          sx(i),
          y,
          rank,
          QUEUES[group].color,
          0.48,
          0.60
        )
      );
    });

    a.push(
      text(
        example === 0
          ? 'Observed rank allocation'
          : 'Possible null allocation',
        CX,
        y + 0.82,
        21,
        RANK
      ),

      queueLegend(
        y - 0.74
      )
    );

    const sums = groups.map(
      ranks =>
        ranks.reduce(
          (sum, rank) => sum + rank,
          0
        )
    );

    const between =
      sums.reduce(
        (sum, rankSum) =>
          sum +
          4 *
          (rankSum / 4 - MIDDLE) ** 2,
        0
      );

    const h =
      SCALE * between;

    a.push(
      text(
        `H = ${h.toFixed(2)}`,
        CX,
        y - 1.39,
        28,
        RANK,
        true
      ),

      text(
        'Four ranks remain in each queue',
        CX,
        y - 1.94,
        18,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXACT DISTRIBUTION VERSUS CHI-SQUARE APPROXIMATION
  //
  // Histogram computed by exhaustive enumeration.
  // Curve shows the approximate df=2 chi-square density.
  // Histogram heights are normalized to density units.
  // ------------------------------------------------------------

  function exactComparisonPicture() {
    const result = exactNull();

    const a = [];

    const base =
      P ? -3.20 : -1.82;

    const w =
      P ? 6.20 : 6.45;

    const h =
      P ? 3.80 : 2.58;

    const left =
      CX - w / 2;

    const xmax = 12;
    const bins = 24;

    const binWidth =
      xmax / bins;

    const counts =
      Array(bins).fill(0);

    result.values.forEach(value => {
      const bin = Math.min(
        bins - 1,
        Math.floor(value / binWidth)
      );

      counts[bin]++;
    });

    const density = counts.map(
      count =>
        count /
        result.total /
        binWidth
    );

    const maxDensity = Math.max(
      0.5,
      ...density
    );

    const X = v =>
      left + v / xmax * w;

    const Y = v =>
      base +
      v / maxDensity * h;

    a.push(
      line(
        left,
        base,
        left + w,
        base,
        C.muted,
        2
      )
    );

    density.forEach((d, i) => {
      if (d === 0) return;

      const hh =
        d / maxDensity * h;

      const value =
        (i + 0.5) * binWidth;

      a.push(
        rect(
          X(value),
          base + hh / 2,
          w / bins * 0.91,
          hh,
          C.cyan,
          0.48,
          0.8
        )
      );
    });

    const segments = 120;

    for (let i = 0; i < segments; i++) {
      const u =
        xmax * i / segments;

      const v =
        xmax * (i + 1) / segments;

      a.push(
        line(
          X(u),
          Y(0.5 * Math.exp(-u / 2)),
          X(v),
          Y(0.5 * Math.exp(-v / 2)),
          RANK,
          2.4
        )
      );
    }

    a.push(
      dashed(
        X(H),
        base,
        X(H),
        base + h * 0.55,
        WARN
      ),

      text(
        'H = 7.27',
        X(H) + 0.25,
        base + h * 0.55 + 0.23,
        18,
        WARN,
        true
      )
    );

    [0, 3, 6, 9, 12].forEach(v => {
      a.push(
        text(
          v,
          X(v),
          base - 0.27,
          16,
          C.muted,
          true
        )
      );
    });

    a.push(
      text(
        'Exact allocation distribution',
        CX + 0.66,
        P ? 1.24 : 1.36,
        18,
        C.cyan,
        false,
        4.65
      ),

      text(
        'Chi-square approximation',
        CX + 0.72,
        P ? 0.86 : 0.98,
        18,
        RANK,
        false,
        4.65
      ),

      text(
        `${result.total.toLocaleString('en-US')} possible allocations`,
        CX,
        base - 0.78,
        18,
        C.muted,
        true,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FINAL SUMMARY
  // ------------------------------------------------------------

  function summaryPicture() {
    const a = [];

    const top =
      P ? 0.91 : 0.95;

    RANKED.forEach((d, i) => {
      a.push(
        rankToken(
          sx(i),
          top,
          d.rank,
          d.color,
          0.48,
          0.58
        )
      );
    });

    a.push(
      text(
        'Pool and rank all twelve tickets',
        CX,
        top + 0.55,
        20,
        RANK,
        false,
        6.5
      ),

      text(
        '↓',
        CX,
        top - 0.59,
        24,
        RANK
      )
    );

    STATS.forEach((g, i) => {
      const x =
        CX + (i - 1) * 2.04;

      const y =
        top - 1.22;

      a.push(
        rounded(
          x,
          y,
          1.88,
          0.93,
          g.color,
          0.10,
          1.7
        ),

        text(
          g.name,
          x,
          y + 0.23,
          17,
          g.color,
          false,
          1.77
        ),

        text(
          g.meanRank,
          x,
          y - 0.17,
          25,
          g.color,
          true
        )
      );
    });

    a.push(
      text(
        'Overall middle rank = 6.5',
        CX,
        top - 1.94,
        21,
        RANK,
        true
      ),

      text(
        'H ≈ 7.27; df = 2',
        CX,
        top - 2.42,
        25,
        RANK,
        true
      ),

      rounded(
        CX,
        top - 3.10,
        5.80,
        0.72,
        GOOD,
        0.10,
        2
      ),

      text(
        'p ≈ 0.026 — reject the null',
        CX,
        top - 3.10,
        23,
        GOOD,
        true,
        5.45
      )
    );

    return G(a);
  }

  // ============================================================
  // NARRATION BEATS
  // ============================================================

  // ------------------------------------------------------------
  // 0. Last lesson compared two groups with ranks.
  // Now there are three groups.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(groupRecap(false)),

    ...say(
      'LAST LESSON: TWO GROUPS',
      RANK
    )
  );

  await until(S(0) + 2.0);

  await play(
    ...scene(groupRecap(true)),

    ...fbox([
      'Previously: two groups',
      ['Now: three groups', RANK]
    ], RANK),

    ...say(
      'NOW COMPARE THREE GROUPS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 1. Four timed tickets in each queue.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...scene(queuePicture({
      reveal: [false, false, false]
    })),

    ...fbox([
      ['Billing: 4 tickets', BILLING],
      ['Technical: 4 tickets', TECHNICAL],
      ['Account: 4 tickets', ACCOUNT],
      'Total = 12'
    ]),

    ...say(
      'FOUR TICKETS IN EACH QUEUE'
    )
  );

  // ------------------------------------------------------------
  // 2. Billing: 3, 5, 6, 9 minutes.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...scene(queuePicture({
      reveal: [true, false, false],
      focus: 0
    })),

    ...fbox([
      ['Billing', BILLING],
      '3, 5, 6, 9 minutes'
    ], BILLING),

    ...say(
      'BILLING: 3, 5, 6, 9',
      BILLING
    )
  );

  // ------------------------------------------------------------
  // 3. Technical: 12, 15, 20, 45 minutes.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...scene(queuePicture({
      reveal: [true, true, false],
      focus: 1
    })),

    ...fbox([
      ['Technical', TECHNICAL],
      '12, 15, 20, 45 minutes'
    ], TECHNICAL),

    ...say(
      'TECHNICAL: 12, 15, 20, 45',
      TECHNICAL
    )
  );

  // ------------------------------------------------------------
  // 4. Account: 4, 7, 10, 14 minutes.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...scene(queuePicture({
      reveal: [true, true, true],
      focus: 2
    })),

    ...fbox([
      ['Account', ACCOUNT],
      '4, 7, 10, 14 minutes'
    ], ACCOUNT),

    ...say(
      'ACCOUNT: 4, 7, 10, 14',
      ACCOUNT
    )
  );

  // ------------------------------------------------------------
  // 5. Do the three queues differ in handling time?
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...scene(timePlot()),

    ...fbox([
      'Three independent queues',
      'Four observations each',
      ['Do handling times differ?', WARN]
    ], WARN),

    ...say(
      'DO THE THREE QUEUES DIFFER IN HANDLING TIME?',
      WARN
    )
  );

  // ------------------------------------------------------------
  // 6. One Technical ticket took 45 minutes.
  // It pulls the Technical mean upwards.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...scene(queuePicture({
      outlier: true,
      focus: 1
    })),

    ...fbox([
      ['Technical outlier: 45 min', WARN]
    ], WARN),

    ...say(
      'LOOK AT THE FORTY-FIVE-MINUTE TICKET',
      WARN
    )
  );

  await until(S(6) + 2.1);

  await play(
    ...scene(outlierPicture({
      showMean: true
    })),

    ...fbox([
      'Technical mean',
      '(12 + 15 + 20 + 45) / 4',
      ['= 23 minutes', WARN]
    ], WARN),

    ...say(
      'ONE LONG TICKET PULLS THE MEAN UP',
      WARN
    )
  );

  // ------------------------------------------------------------
  // 7. Small groups make raw means sensitive to extreme values.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...scene(outlierPicture({
      showMean: true,
      compareWithout: true
    })),

    ...fbox([
      'Only 4 Technical tickets',
      'All four: mean = 23',
      'Other three: mean ≈ 15.67',
      ['Means are sensitive to size', WARN]
    ], WARN),

    ...say(
      'WITH SMALL GROUPS, ONE VALUE CAN MATTER A LOT',
      WARN
    )
  );

  // ------------------------------------------------------------
  // 8. Use ranks instead.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...scene(queuePicture()),

    ...fbox([
      'Keep all twelve observations',
      ['Use their relative order', RANK]
    ], RANK),

    ...say(
      'USE RANKS INSTEAD OF RAW MINUTES',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 9. Pool all twelve tickets.
  //
  // The actual ticket objects move from their queue positions
  // into one ordered line.
  // ------------------------------------------------------------

  const movingTickets = DATA.map(d => {
    const index =
      QUEUES[d.group].times.indexOf(
        d.minutes
      );

    const p =
      queueSlot(d.group, index);

    return sortableTicket(
      d,
      p[0],
      p[1],
      false
    );
  });

  await until(S(9));

  await play(
    ...scene(queueFrames()),

    new M.LaggedStart(
      movingTickets.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.035,
        runTime: 0.85
      }
    ),

    ...fbox([
      'Step 1',
      ['Pool all twelve tickets', RANK]
    ], RANK),

    ...say(
      'STEP 1: POOL THE THREE GROUPS',
      RANK
    )
  );

  await until(S(9) + 1.5);

  // Fresh tickets on the pooled line (a Transform would leave the minute labels behind).
  const pooledTickets = DATA.map((v, i) => {
    const d = BY_ID.get(v.id);

    const targetIndex =
      RANKED.findIndex(
        r => r.id === d.id
      );

    return sortableTicket(
      d,
      sx(targetIndex),
      SORT_Y,
      true
    );
  });

  // Fade in from shortest to longest.
  const pooledInOrder = RANKED.map(r =>
    pooledTickets[DATA.findIndex(v => v.id === r.id)]
  );

  await play(
    ...scene(pooledAxis(false)),

    new M.FadeOut(G(...movingTickets)),

    new M.LaggedStart(
      pooledInOrder.map(t =>
        new M.FadeIn(t, { shift: [0, 0.12, 0] })
      ),
      {
        lagRatio: 0.055,
        runTime: 2.2
      }
    ),

    ...say(
      'SORT FROM SHORTEST TO LONGEST',
      RANK
    )
  );

  movingTickets.splice(0, movingTickets.length, ...pooledTickets);

  // ------------------------------------------------------------
  // 10. Each queue keeps its original colour.
  // ------------------------------------------------------------

  const pooledLegend = queueLegend(
    SORT_Y - 1.13
  );

  await until(S(10));

  await play(
    new M.FadeIn(
      pooledLegend,
      { runTime: 0.4 }
    ),

    ...fbox([
      ['Blue = Billing', BILLING],
      ['Violet = Technical', TECHNICAL],
      ['Teal = Account', ACCOUNT]
    ]),

    ...say(
      'KEEP EACH QUEUE’S COLOUR'
    )
  );

  // ------------------------------------------------------------
  // 11. Rank them from 1 through 12.
  // ------------------------------------------------------------

  const pooledRankLabels =
    RANKED.map((d, i) =>
      rankLabel(
        d.rank,
        i,
        d.color
      )
    );

  await until(S(11));

  await play(
    new M.FadeOut(pooledLegend),

    ...scene(pooledAxis(true)),

    new M.LaggedStart(
      pooledRankLabels.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.10,
        runTime: 1.8
      }
    ),

    ...fbox([
      'Step 2',
      ['Shortest = rank 1', RANK],
      ['Longest = rank 12', RANK]
    ], RANK),

    ...say(
      'STEP 2: RANK ALL TWELVE TICKETS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 12. Billing ranks: 1, 3, 4, 6.
  // ------------------------------------------------------------

  const groupRankLabels = group =>
    RANKED
      .map((d, i) => ({
        d,
        label: pooledRankLabels[i]
      }))
      .filter(v => v.d.group === group)
      .map(v => v.label);

  await until(S(12));

  await play(
    new M.LaggedStart(
      groupRankLabels(0).map(t =>
        new M.Indicate(
          t,
          {
            color: BILLING,
            runTime: 0.40
          }
        )
      ),
      {
        lagRatio: 0.15,
        runTime: 1.2
      }
    ),

    ...fbox([
      ['Billing ranks', BILLING],
      '1, 3, 4, 6'
    ], BILLING),

    ...say(
      'BILLING RANKS: 1, 3, 4, 6',
      BILLING
    )
  );

  // ------------------------------------------------------------
  // 13. Technical ranks: 8, 10, 11, 12.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    new M.LaggedStart(
      groupRankLabels(1).map(t =>
        new M.Indicate(
          t,
          {
            color: TECHNICAL,
            runTime: 0.40
          }
        )
      ),
      {
        lagRatio: 0.15,
        runTime: 1.2
      }
    ),

    ...fbox([
      ['Technical ranks', TECHNICAL],
      '8, 10, 11, 12'
    ], TECHNICAL),

    ...say(
      'TECHNICAL RANKS: 8, 10, 11, 12',
      TECHNICAL
    )
  );

  // ------------------------------------------------------------
  // 14. Account ranks: 2, 5, 7, 9.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    new M.LaggedStart(
      groupRankLabels(2).map(t =>
        new M.Indicate(
          t,
          {
            color: ACCOUNT,
            runTime: 0.40
          }
        )
      ),
      {
        lagRatio: 0.15,
        runTime: 1.2
      }
    ),

    ...fbox([
      ['Account ranks', ACCOUNT],
      '2, 5, 7, 9'
    ], ACCOUNT),

    ...say(
      'ACCOUNT RANKS: 2, 5, 7, 9',
      ACCOUNT
    )
  );

  // ------------------------------------------------------------
  // 15. The 45-minute ticket is only rank 12.
  // One rank above the 20-minute ticket.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    new M.FadeOut(
      new M.VGroup(
        ...movingTickets,
        ...pooledRankLabels
      )
    ),

    ...scene(outlierRankPicture()),

    ...fbox([
      '20 minutes → rank 11',
      ['45 minutes → rank 12', WARN],
      ['Only one rank apart', RANK]
    ], RANK),

    ...say(
      'A HUGE MINUTE GAP BECOMES ONE RANK',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 16. Step three: add the ranks in each queue.
  //
  // Move pooled rank tokens back to their original queue rows.
  // ------------------------------------------------------------

  const movingRanks = RANKED.map(
    (d, i) =>
      rankToken(
        sx(i),
        SORT_Y,
        d.rank,
        d.color,
        0.48,
        0.60
      )
  );

  await until(S(16));

  await play(
    ...scene(pooledAxis(false)),

    ...movingRanks.map(t =>
      new M.FadeIn(
        t,
        { runTime: 0.25 }
      )
    ),

    ...fbox([
      'Step 3',
      ['Add ranks within each queue', RANK]
    ], RANK),

    ...say(
      'STEP 3: ADD THE QUEUE RANKS',
      RANK
    )
  );

  await until(S(16) + 0.9);

  await play(
    ...scene(rankTableFrames(false)),

    new M.LaggedStart(
      movingRanks.map((t, i) => {
        const d = RANKED[i];

        const slot =
          STATS[d.group].ranks.indexOf(
            d.rank
          );

        const p =
          groupRankSlot(
            d.group,
            slot
          );

        return new M.Transform(
          t,
          rankToken(
            p[0],
            p[1],
            d.rank,
            d.color,
            0.68,
            P ? 0.67 : 0.57
          ),
          {
            pathArc:
              d.group === 0
                ? 0.15
                : -0.15
          }
        );
      }),
      {
        lagRatio: 0.025,
        runTime: 1.1
      }
    )
  );

  // ------------------------------------------------------------
  // 17. Billing 14, Technical 41, Account 23.
  // Total = 78.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    new M.FadeOut(
      new M.VGroup(...movingRanks)
    ),

    ...scene(rankSumBlocks({
      reveal: 1
    })),

    ...fbox([
      ['Billing', BILLING],
      '1 + 3 + 4 + 6',
      ['= 14', BILLING]
    ], BILLING),

    ...say(
      'BILLING RANK SUM = 14',
      BILLING
    )
  );

  await until(S(17) + 1.8);

  await play(
    ...scene(rankSumBlocks({
      reveal: 2
    })),

    ...fbox([
      ['Technical', TECHNICAL],
      '8 + 10 + 11 + 12',
      ['= 41', TECHNICAL]
    ], TECHNICAL),

    ...say(
      'TECHNICAL RANK SUM = 41',
      TECHNICAL
    )
  );

  await until(S(17) + 3.6);

  await play(
    ...scene(rankSumBlocks({
      reveal: 3
    })),

    ...fbox([
      ['Account', ACCOUNT],
      '2 + 5 + 7 + 9',
      ['= 23', ACCOUNT]
    ], ACCOUNT),

    ...say(
      'ACCOUNT RANK SUM = 23',
      ACCOUNT
    )
  );

  await until(S(17) + 5.2);

  await play(
    ...fbox([
      ['Billing: 14', BILLING],
      ['Technical: 41', TECHNICAL],
      ['Account: 23', ACCOUNT],
      ['Total = 78', RANK]
    ], RANK),

    ...say(
      'ALL TWELVE RANKS ADD TO 78',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 18. Step four: calculate mean ranks.
  // Divide each rank sum by four.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(rankTable({
      showSums: true
    })),

    ...fbox([
      'Step 4',
      ['Mean rank = rank sum ÷ n', RANK],
      'Each queue has n = 4'
    ], RANK),

    ...say(
      'STEP 4: FIND EACH QUEUE’S MEAN RANK',
      RANK
    )
  );

  await until(S(18) + 2.2);

  await play(
    ...scene(meanRankDivision()),

    ...fbox([
      'Billing: 14 ÷ 4',
      'Technical: 41 ÷ 4',
      'Account: 23 ÷ 4'
    ], RANK),

    ...say(
      'DIVIDE EACH RANK SUM BY FOUR',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 19. Mean ranks: 3.5, 10.25, 5.75.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...scene(rankTable({
      showSums: true,
      showMeans: true,
      focus: 0
    })),

    ...fbox([
      ['Billing: 14 ÷ 4 = 3.5', BILLING]
    ], BILLING),

    ...say(
      'BILLING MEAN RANK = 3.5',
      BILLING
    )
  );

  await until(S(19) + 2.0);

  await play(
    ...scene(rankTable({
      showSums: true,
      showMeans: true,
      focus: 1
    })),

    ...fbox([
      ['Technical: 41 ÷ 4 = 10.25', TECHNICAL]
    ], TECHNICAL),

    ...say(
      'TECHNICAL MEAN RANK = 10.25',
      TECHNICAL
    )
  );

  await until(S(19) + 4.0);

  await play(
    ...scene(rankTable({
      showSums: true,
      showMeans: true,
      focus: 2
    })),

    ...fbox([
      ['Account: 23 ÷ 4 = 5.75', ACCOUNT]
    ], ACCOUNT),

    ...say(
      'ACCOUNT MEAN RANK = 5.75',
      ACCOUNT
    )
  );

  await until(S(19) + 5.5);

  await play(
    ...scene(meanRankChart()),

    ...fbox([
      ['Billing: 3.5', BILLING],
      ['Technical: 10.25', TECHNICAL],
      ['Account: 5.75', ACCOUNT]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 20. Null expectation: mean ranks near 6.5.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...scene(meanRankChart({
      middle: true,
      expected: true
    })),

    ...fbox([
      'Null: queues have same distribution',
      'Middle rank = (1 + 12) / 2',
      ['= 6.5', WARN]
    ], RANK),

    ...say(
      'IF THE QUEUES WERE ALIKE: NEAR 6.5',
      RANK
    )
  );

  await until(S(20) + 2.5);

  await play(
    ...scene(meanRankChart({
      middle: true
    })),

    ...fbox([
      'Expected mean rank = 6.5',
      ['Observed means spread apart', RANK]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 21. One number measuring overall spread from the middle.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...scene(meanRankLine(true)),

    ...fbox([
      'Distance from the middle',
      ['Billing: −3', BILLING],
      ['Technical: +3.75', TECHNICAL],
      ['Account: −0.75', ACCOUNT]
    ], RANK),

    ...say(
      'HOW FAR FROM THE MIDDLE, OVERALL?',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 22. Like the between-group component of ANOVA,
  // but using ranks rather than minutes.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...scene(betweenGroupPicture()),

    ...fbox([
      'Like between-group variation',
      'in analysis of variance',
      ['But measured using ranks', RANK]
    ], RANK),

    ...say(
      'BETWEEN-GROUP VARIATION IN RANKS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 23. For each queue:
  // gap from 6.5, square it, multiply by four.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...scene(contributionsPicture({
      stage: 0
    })),

    ...fbox([
      'Mean-rank gap',
      ['= mean rank − 6.5', RANK]
    ], RANK),

    ...say(
      'FIRST FIND EACH GAP FROM 6.5',
      RANK
    )
  );

  await until(S(23) + 2.2);

  await play(
    ...scene(squaredGapPicture(0)),

    ...fbox([
      ['Billing', BILLING],
      '(3.5 − 6.5)² = 9',
      ['4 × 9 = 36', BILLING]
    ], BILLING),

    ...say(
      'SQUARE THE GAP AND MULTIPLY BY FOUR',
      RANK
    )
  );

  await until(S(23) + 4.5);

  await play(
    ...scene(contributionsPicture({
      stage: 3
    })),

    ...fbox([
      ['Billing: 4 × 9 = 36', BILLING],
      ['Technical: 4 × 14.0625', TECHNICAL],
      ['          = 56.25', TECHNICAL],
      ['Account: 4 × 0.5625 = 2.25', ACCOUNT]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 24. Add contributions and scale the total.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...scene(scalePicture(false)),

    ...fbox([
      '36 + 56.25 + 2.25',
      ['= 94.5', RANK]
    ], RANK),

    ...say(
      'ADD THE THREE WEIGHTED SQUARED GAPS',
      RANK
    )
  );

  await until(S(24) + 2.8);

  await play(
    ...scene(scalePicture(true)),

    ...fbox([
      'Scale factor = 12/[N(N+1)]',
      'N = 12',
      '94.5 × 12/(12 × 13)',
      ['≈ 7.27', GOOD]
    ], RANK),

    ...say(
      'SCALE THE TOTAL FOR THE NULL DISTRIBUTION',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 25. The result is H, approximately 7.27.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...scene(statisticPicture()),

    ...fbox([
      ['Kruskal–Wallis statistic', RANK],
      'H = 94.5 × 12/156',
      ['H ≈ ' + H.toFixed(2), GOOD]
    ], RANK),

    ...say(
      'THE STATISTIC H ≈ 7.27',
      GOOD
    )
  );

  // ------------------------------------------------------------
  // 26. Under the null H is usually small.
  // Its distribution is approximately chi-square.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...scene(luckCurve()),

    ...fbox([
      'If all queues are alike',
      'Mean ranks tend to be close',
      ['H usually stays small', RANK]
    ], RANK),

    ...say(
      'SMALL H IS TYPICAL UNDER THE NULL',
      RANK
    )
  );

  await until(S(26) + 3.0);

  await play(
    ...scene(luckCurve({
      showDF: true
    })),

    ...fbox([
      'Null distribution of H',
      ['Approximately chi-square', RANK]
    ], RANK),

    ...say(
      'COMPARE H WITH A CHI-SQUARE CURVE',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 27. Degrees of freedom = groups minus one.
  // Three minus one = two.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...scene(degreesPicture(false)),

    ...fbox([
      'Degrees of freedom',
      'Number of groups − 1',
      ['3 − 1 = 2', RANK]
    ], RANK),

    ...say(
      'DEGREES OF FREEDOM = THREE MINUS ONE',
      RANK
    )
  );

  await until(S(27) + 2.2);

  await play(
    ...scene(degreesPicture(true)),

    ...fbox([
      'Rank sums must total 78',
      'Two sums may vary freely',
      ['Third sum is determined', RANK]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 28. H >= 7.27 happens about three times in a hundred
  // under the approximate chi-square null model.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...scene(luckCurve({
      showDF: true,
      showCutoff: true,
      showObserved: true,
      showTail: true
    })),

    ...fbox([
      'H ≈ 7.27',
      'df = 2',
      ['p ≈ ' + PV.toFixed(3), C.cyan]
    ]),

    ...say(
      'THE UPPER TAIL IS ABOUT 2.6%',
      C.cyan
    )
  );

  await until(S(28) + 3.4);

  await play(
    ...scene(hundredWorlds()),

    ...fbox([
      'Approximate null probability',
      ['About 3 in 100', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 29. Reject the null.
  // At least one queue differs.
  // Technical has the highest observed mean rank.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...scene(decisionPicture()),

    ...fbox([
      ['p ≈ 0.026', GOOD],
      '0.026 < 0.05',
      ['Reject the null', GOOD]
    ], GOOD),

    ...say(
      'REJECT: THE QUEUES ARE NOT ALL ALIKE',
      GOOD
    )
  );

  await until(S(29) + 2.8);

  await play(
    ...scene(meanRankChart({
      middle: true,
      focus: 1
    })),

    ...fbox([
      ['Technical mean rank = 10.25', TECHNICAL],
      'Highest observed mean rank',
      'Looks slowest in this sample'
    ], TECHNICAL),

    ...say(
      'TECHNICAL LOOKS SLOWEST',
      TECHNICAL
    )
  );

  // ------------------------------------------------------------
  // 30. This is called the Kruskal–Wallis test.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...scene(meanRankChart({
      middle: true,
      gaps: true
    })),

    ...fbox([
      ['Kruskal–Wallis test', RANK],
      'Pool all groups',
      'Compare their mean ranks'
    ], RANK),

    ...say(
      'THE KRUSKAL–WALLIS TEST',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 31. General formula:
  //
  // H = 12/[N(N+1)] × sum of
  // group size × squared mean-rank gap.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...scene(generalFormulaPicture(false)),

    ...fbox([
      'H = 12/[N(N+1)] × Σ',
      ['    n × (mean rank − middle)²', RANK]
    ], RANK),

    ...say(
      'THE KRUSKAL–WALLIS FORMULA',
      RANK
    )
  );

  await until(S(31) + 4.3);

  await play(
    ...scene(contributionsPicture({
      stage: 3
    })),

    ...fbox([
      'For every group:',
      'Find its mean-rank gap',
      'Square the gap',
      ['Multiply by group size', RANK]
    ], RANK),

    ...say(
      'SUM THE GROUP-SIZE-WEIGHTED SQUARED GAPS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 32. N = 12.
  // Mean-rank gap is mean rank minus 6.5.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...scene(meanRankChart({
      middle: true,
      gaps: true
    })),

    ...fbox([
      'N = total observations = 12',
      'n = group size = 4',
      ['Middle rank = 6.5', WARN]
    ], RANK),

    ...say(
      'N IS THE TOTAL NUMBER OF TICKETS',
      RANK
    )
  );

  await until(S(32) + 4.1);

  await play(
    ...scene(generalFormulaPicture(true)),

    ...fbox([
      'Mean-rank gap = mean − 6.5',
      'H = 12/(12 × 13) × 94.5',
      ['H ≈ 7.27', GOOD]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 33. Software performs the calculation.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(softwarePicture()),

    ...fbox([
      'Software calculates H',
      ['H ≈ 7.27', GOOD],
      ['p ≈ 0.026', C.cyan]
    ]),

    ...say(
      'SOFTWARE DOES THE ARITHMETIC'
    )
  );

  // ------------------------------------------------------------
  // 34. H is a scaled measure of rank spread.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...scene(betweenGroupPicture()),

    ...fbox([
      'Read the statistic:',
      'Distance from the overall middle',
      ['Combined and scaled', RANK]
    ], RANK),

    ...say(
      'H MEASURES HOW FAR THE GROUP RANKS SPREAD',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 35. Compare three or more independent groups
  // when only order is trusted.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...scene(applicationPicture(3)),

    ...fbox([
      'Independent groups',
      'Three or more',
      ['Measurements can be ranked', RANK]
    ], RANK),

    ...say(
      'USE FOR THREE OR MORE SEPARATE GROUPS',
      RANK
    )
  );

  await until(S(35) + 3.0);

  await play(
    ...scene(applicationPicture(4)),

    ...fbox([
      'Three, four or more groups',
      'Trust the ordering',
      ['Compare pooled ranks', RANK]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 36. Rank cousin of one-way ANOVA.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...scene(anovaComparison()),

    ...fbox([
      'ANOVA: numerical means',
      ['Kruskal–Wallis: mean ranks', RANK]
    ], RANK),

    ...say(
      'THE RANK VERSION OF ONE-WAY ANOVA',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 37. Trap: a small p-value does not identify which groups
  // are different.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...scene(omnibusPicture(false)),

    ...fbox([
      ['Common trap', WARN],
      'Small overall p-value',
      'Does not identify specific pairs'
    ], WARN),

    ...say(
      'TRAP: WHICH QUEUES DIFFER?',
      WARN
    )
  );

  // ------------------------------------------------------------
  // 38. Follow-up comparisons are needed.
  // Account for multiple testing.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...scene(omnibusPicture(true)),

    ...fbox([
      'Overall test: not all alike',
      'Specific pairs remain unknown',
      ['Follow-up comparisons needed', RANK]
    ], RANK),

    ...say(
      'THE OVERALL TEST DOES NOT IDENTIFY THE PAIRS',
      RANK
    )
  );

  await until(S(38) + 3.5);

  await play(
    ...scene(followUpPicture()),

    ...fbox([
      'Three pairwise questions',
      'Use suitable rank comparisons',
      ['Adjust for multiple testing', WARN]
    ], WARN),

    ...say(
      'FOLLOW UP WITH MULTIPLICITY CONTROL',
      WARN
    )
  );

  // ------------------------------------------------------------
  // 39. With four observations per group,
  // chi-square is only an approximation.
  //
  // Exact small-sample inference can enumerate the fixed-size
  // rank allocations under the exchangeable-label null.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...scene(luckCurve({
      showDF: true,
      showObserved: true,
      showTail: true
    })),

    ...fbox([
      ['Only four tickets per group', WARN],
      'Chi-square approximation',
      'May be inaccurate for small n'
    ], WARN),

    ...say(
      'SMALL GROUPS: REMEMBER THE APPROXIMATION',
      WARN
    )
  );

  await until(S(39) + 2.5);

  await play(
    ...scene(allocationPicture(1)),

    ...fbox([
      'Exact alternative',
      'Reallocate the pooled ranks',
      'Keep four in each group'
    ], RANK),

    ...say(
      'SOFTWARE CAN COUNT THE EXACT ALLOCATIONS',
      RANK
    )
  );

  await until(S(39) + 4.1);

  await play(
    ...scene(allocationPicture(2))
  );

  await until(S(39) + 5.7);

  await play(
    ...scene(exactComparisonPicture()),

    ...fbox([
      'Exact label allocations:',
      'C(12,4) × C(8,4)',
      ['= 34,650 possibilities', C.cyan],
      'Compare with observed H'
    ], RANK),

    ...say(
      'EXACT COUNTING NEEDS NO CHI-SQUARE CURVE',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 40. Closing summary.
  //
  // Kruskal–Wallis ranks all groups together and asks whether
  // their mean ranks spread too far to explain by luck.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...scene(summaryPicture()),

    ...fbox([
      ['Kruskal–Wallis test', RANK],
      'Pool ranks; find mean ranks',
      'H ≈ 7.27; df = 2',
      ['Approximate p ≈ 0.026', GOOD]
    ], GOOD),

    ...say(
      'POOL THE RANKS AND COMPARE THEIR MEANS',
      RANK
    )
  );

  await until(S(40) + 4.0);

  await play(
    ...scene(meanRankChart({
      middle: true,
      gaps: true
    })),

    ...fbox([
      ['Billing: 3.5', BILLING],
      ['Technical: 10.25', TECHNICAL],
      ['Account: 5.75', ACCOUNT],
      ['Reject: p ≈ 0.026', GOOD]
    ], GOOD),

    ...say(
      'DO THE MEAN RANKS SPREAD TOO FAR FOR LUCK?',
      GOOD
    )
  );

  await until(E(40));

  // ------------------------------------------------------------
  // IMPLEMENTATION NOTES
  // ------------------------------------------------------------
  //
  // All 41 narration beats, S(0) through S(40), are included.
  //
  // Fixed shared chapter data:
  //
  // Billing:
  //   Minutes = [3, 5, 6, 9]
  //   Ranks   = [1, 3, 4, 6]
  //
  // Technical:
  //   Minutes = [12, 15, 20, 45]
  //   Ranks   = [8, 10, 11, 12]
  //
  // Account:
  //   Minutes = [4, 7, 10, 14]
  //   Ranks   = [2, 5, 7, 9]
  //
  // Pooled order:
  //
  // Minutes   Rank   Queue
  //    3       1     Billing
  //    4       2     Account
  //    5       3     Billing
  //    6       4     Billing
  //    7       5     Account
  //    9       6     Billing
  //   10       7     Account
  //   12       8     Technical
  //   14       9     Account
  //   15      10     Technical
  //   20      11     Technical
  //   45      12     Technical
  //
  // Rank sums:
  //   Billing   = 14
  //   Technical = 41
  //   Account   = 23
  //   Total     = 78
  //
  // Mean ranks:
  //   Billing   = 3.5
  //   Technical = 10.25
  //   Account   = 5.75
  //
  // Overall middle rank:
  //   (N + 1)/2 = 6.5
  //
  // Mean-rank gaps:
  //   Billing   = -3
  //   Technical = +3.75
  //   Account   = -0.75
  //
  // Weighted squared gaps:
  //
  //   Billing:
  //     4 * (-3)^2 = 36
  //
  //   Technical:
  //     4 * (3.75)^2 = 56.25
  //
  //   Account:
  //     4 * (-0.75)^2 = 2.25
  //
  // Total weighted squared gap:
  //   36 + 56.25 + 2.25 = 94.5
  //
  // H = 12/[N(N+1)] * sum of weighted squared gaps
  //
  //   = 12/(12*13) * 94.5
  //   = 7.269230769...
  //   ≈ 7.27
  //
  // Equivalent rank-sum formula:
  //
  // H = 12/[N(N+1)] * sum(R_g^2 / n_g) - 3(N+1)
  //
  //   = 12/(12*13) * (14^2 + 41^2 + 23^2)/4
  //       - 3*13
  //
  //   ≈ 7.27
  //
  // Degrees of freedom:
  //   K - 1 = 3 - 1 = 2
  //
  // Approximate chi-square p-value:
  //   exp(-H/2) ≈ 0.0264
  //
  // Decision at alpha = 0.05:
  //   Reject the null.
  //
  // The significant omnibus result does not establish
  // which specific pairs of queues differ.
  //
  // Technical has the highest observed mean rank, but
  // this alone does not establish a significant pairwise
  // difference against either other queue.
  //
  // The original dataset contains no tied observations.
  // Average-rank calculation and tie correction are
  // implemented, but the exact-allocation illustration
  // specifically uses the supplied distinct-rank dataset.
  //
  // The final small-sample illustration enumerates all
  // 34,650 fixed-size labelled rank allocations.
  // Its histogram is computed from those allocations.
  //
  // Throughout the narrated worked example, the reported
  // p-value remains the supplied chi-square approximation.
  //
  // The comparison with the mean of the other three
  // Technical tickets is illustrative. No observed ticket
  // is removed from the actual hypothesis test.
  //
  // Queue colour fallbacks are supplied in case the engine
  // palette lacks explicit blue or teal entries.
  //
  // Within-sentence animation offsets are selected from
  // the supplied sentence timestamps rather than word-level
  // audio synchronization.
  //
  // Uses the supplied live-engine interface, approved
  // reference conventions, shared chapter data, and
  // responsive phone/laptop layouts.
  //
  // Browser execution, animation timing, exact-enumeration
  // performance, and responsive rendering have not been
  // tested against the complete engine.js.
}

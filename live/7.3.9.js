// lesson 7.3.9
// Mann–Whitney test (Wilcoxon rank-sum test).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // Ten different customers, five per script.
  // These observations are independent groups, not matched pairs.
  // ------------------------------------------------------------

  const OLD = C.amber;
  const NEW = C.cyan;
  const RANK = C.violet;
  const YES = C.green;
  const NO = C.muted;

  const OLD_RATINGS = [1, 2, 3, 4, 7];
  const NEW_RATINGS = [5, 6, 8, 9, 10];

  const N_OLD = OLD_RATINGS.length;
  const N_NEW = NEW_RATINGS.length;
  const N = N_OLD + N_NEW;

  const TOTAL_PAIRS = N_OLD * N_NEW;

  const DATA = [
    ...OLD_RATINGS.map((value, i) => ({
      id: `O${i + 1}`,
      group: 'old',
      value,
      color: OLD
    })),

    ...NEW_RATINGS.map((value, i) => ({
      id: `N${i + 1}`,
      group: 'new',
      value,
      color: NEW
    }))
  ];

  // ------------------------------------------------------------
  // POOLED RANKS
  // Equal values receive their average rank.
  // All ten ratings in the actual example are distinct.
  // ------------------------------------------------------------

  function pooledRanks(records) {
    const sorted = records
      .map(d => ({ ...d }))
      .sort((a, b) => a.value - b.value);

    let i = 0;

    while (i < sorted.length) {
      let j = i + 1;

      while (
        j < sorted.length &&
        sorted[j].value === sorted[i].value
      ) {
        j++;
      }

      const averageRank = (i + 1 + j) / 2;

      for (let k = i; k < j; k++) {
        sorted[k].rank = averageRank;
      }

      i = j;
    }

    return sorted;
  }

  const RANKED = pooledRanks(DATA);

  const R_OLD = RANKED
    .filter(d => d.group === 'old')
    .reduce((sum, d) => sum + d.rank, 0);

  const R_NEW = RANKED
    .filter(d => d.group === 'new')
    .reduce((sum, d) => sum + d.rank, 0);

  const TOTAL_RANK = R_OLD + R_NEW;

  const MIN_OLD_RANK_SUM =
    N_OLD * (N_OLD + 1) / 2;

  const MIN_NEW_RANK_SUM =
    N_NEW * (N_NEW + 1) / 2;

  const U_OLD = R_OLD - MIN_OLD_RANK_SUM;
  const U_NEW = R_NEW - MIN_NEW_RANK_SUM;

  const U = U_OLD;

  const EXPECTED_U = TOTAL_PAIRS / 2;

  const OLD_MEAN =
    OLD_RATINGS.reduce((s, v) => s + v, 0) /
    N_OLD;

  const NEW_MEAN =
    NEW_RATINGS.reduce((s, v) => s + v, 0) /
    N_NEW;

  // Pooled ranks = 1, 2, 3, ..., 10
  // R_OLD = 17
  // R_NEW = 38
  // TOTAL_RANK = 55
  // MIN_OLD_RANK_SUM = 15
  // U_OLD = 2
  // U_NEW = 23
  // EXPECTED_U = 12.5
  // OLD_MEAN = 3.4
  // NEW_MEAN = 7.6

  // ------------------------------------------------------------
  // ALL 25 CROSS-GROUP COMPARISONS
  //
  // These are mathematical comparisons, not matched observations.
  // Tied comparisons would count as half a win for each group.
  // ------------------------------------------------------------

  const PAIRS = [];

  OLD_RATINGS.forEach((oldValue, r) => {
    NEW_RATINGS.forEach((newValue, c) => {
      PAIRS.push({
        r,
        c,
        oldValue,
        newValue,

        winner:
          oldValue > newValue
            ? 'old'
            : oldValue < newValue
              ? 'new'
              : 'tie'
      });
    });
  });

  const OLD_WINS = PAIRS.reduce(
    (sum, pair) =>
      sum +
      (
        pair.winner === 'old'
          ? 1
          : pair.winner === 'tie'
            ? 0.5
            : 0
      ),
    0
  );

  const NEW_WINS = PAIRS.reduce(
    (sum, pair) =>
      sum +
      (
        pair.winner === 'new'
          ? 1
          : pair.winner === 'tie'
            ? 0.5
            : 0
      ),
    0
  );

  // ------------------------------------------------------------
  // EXACT NULL DISTRIBUTION
  //
  // Enumerate every assignment of five of the ten pooled ranks
  // to the old group. The remaining five belong to the new group.
  //
  // Under the exchangeable-label null, all 252 assignments
  // are equally likely.
  // ------------------------------------------------------------

  function combinations(values, k) {
    const result = [];

    function walk(start, chosen) {
      if (chosen.length === k) {
        result.push(chosen.slice());
        return;
      }

      const needed = k - chosen.length;

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

  const ALL_RANKS = RANKED.map(d => d.rank);

  const ALLOCATIONS = combinations(
    ALL_RANKS,
    N_OLD
  ).map(oldRanks => {
    const oldSet = new Set(oldRanks);

    const newRanks = ALL_RANKS.filter(
      rank => !oldSet.has(rank)
    );

    const rankSum = oldRanks.reduce(
      (sum, rank) => sum + rank,
      0
    );

    const uOld =
      rankSum - MIN_OLD_RANK_SUM;

    return {
      oldRanks,
      newRanks,
      rankSum,
      uOld,
      uNew: TOTAL_PAIRS - uOld
    };
  });

  const TOTAL_ALLOCATIONS =
    ALLOCATIONS.length;

  const LOWER_ALLOCATIONS = ALLOCATIONS
    .filter(a => a.uOld <= U)
    .sort((a, b) => a.uOld - b.uOld);

  const UPPER_ALLOCATIONS = ALLOCATIONS
    .filter(a => a.uNew <= U)
    .sort((a, b) => a.uNew - b.uNew);

  const EXTREME_ALLOCATIONS =
    ALLOCATIONS.filter(
      a => a.uOld <= U || a.uNew <= U
    );

  const LOWER_COUNT =
    LOWER_ALLOCATIONS.length;

  const UPPER_COUNT =
    UPPER_ALLOCATIONS.length;

  const EXTREME_COUNT =
    EXTREME_ALLOCATIONS.length;

  const ONE_TAIL =
    LOWER_COUNT / TOTAL_ALLOCATIONS;

  const PV =
    EXTREME_COUNT / TOTAL_ALLOCATIONS;

  const ALPHA = 0.05;

  const HIST_COUNTS = Array.from(
    { length: TOTAL_PAIRS + 1 },
    (_, u) =>
      ALLOCATIONS.filter(a => a.uOld === u).length
  );

  // Exact lower-tail allocations:
  //
  // Old ranks         U
  // 1, 2, 3, 4, 5     0
  // 1, 2, 3, 4, 6     1
  // 1, 2, 3, 4, 7     2
  // 1, 2, 3, 5, 6     2
  //
  // Lower tail = 4 allocations
  // Upper tail = 4 allocations
  // Total = 252 allocations
  // Two-sided p = 8/252 = 0.031746...

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
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

  const groupColor = group =>
    group === 'old' ? OLD : NEW;

  // ------------------------------------------------------------
  // DRAWING HELPERS
  // ------------------------------------------------------------

  function text(
    s, x, y,
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
    radius = 0.12
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
  // Only newly constructed objects are grouped together.
  // Objects already on screen are grouped only for removal.
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
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true
      ).getWidth() / 10;

    const indents = rows.map(([s]) =>
      cw * (
        s.length -
        s.trimStart().length
      )
    );

    const widths = texts.map((t, i) =>
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
      BOXP[1] + ht / 2 - 0.18 - lh / 2;

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

    const maxw = P ? FW - 1.0 : 4.9;
    const maxh = P ? 1.9 : 3.4;

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
  // CUSTOMER ICON
  // ------------------------------------------------------------

  function person(
    x, y,
    color = C.ink,
    scale = 1
  ) {
    const head = new M.Circle({
      radius: 0.14 * scale,
      color
    });

    head.setFill(color, 0.95);

    head.moveTo([
      x,
      y + 0.29 * scale,
      0
    ]);

    const body = new M.Arc({
      radius: 0.25 * scale,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.82);

    body.moveTo([
      x,
      y - 0.02 * scale,
      0
    ]);

    return G(head, body);
  }

  // ------------------------------------------------------------
  // FACE ICON FOR SATISFACTION SCALE
  // ------------------------------------------------------------

  function face(
    x, y,
    happy = true,
    color = C.ink,
    radius = 0.43
  ) {
    const a = [];

    const body = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.07);
    body.moveTo([x, y, 0]);

    a.push(
      body,

      dot(
        x - radius * 0.28,
        y + radius * 0.20,
        color,
        radius * 0.075
      ),

      dot(
        x + radius * 0.28,
        y + radius * 0.20,
        color,
        radius * 0.075
      )
    );

    const segments = 12;

    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;

      const px1 =
        x + (t1 - 0.5) * radius;

      const px2 =
        x + (t2 - 0.5) * radius;

      const py1 =
        y - radius * 0.22 +
        (happy ? -1 : 1) *
          Math.sin(Math.PI * t1) *
          radius * 0.22;

      const py2 =
        y - radius * 0.22 +
        (happy ? -1 : 1) *
          Math.sin(Math.PI * t2) *
          radius * 0.22;

      a.push(
        line(
          px1,
          py1,
          px2,
          py2,
          color,
          2
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // SATISFACTION SCALE
  // Ratings are ordered from one to ten.
  // ------------------------------------------------------------

  function satisfactionScale() {
    const a = [];

    const y = P ? -0.45 : -0.25;

    const sp = 0.62;

    a.push(
      text(
        'Customer satisfaction',
        CX,
        y + 1.57,
        24,
        C.ink
      ),

      face(
        CX - 2.77,
        y + 0.62,
        false,
        OLD,
        0.40
      ),

      face(
        CX + 2.77,
        y + 0.62,
        true,
        NEW,
        0.40
      ),

      line(
        CX - 2.80,
        y - 0.31,
        CX + 2.80,
        y - 0.31,
        C.muted,
        2
      )
    );

    for (let v = 1; v <= 10; v++) {
      const x =
        CX + (v - 5.5) * sp;

      a.push(
        rounded(
          x,
          y - 0.31,
          0.51,
          0.52,
          RANK,
          0.10,
          1.3
        ),

        text(
          v,
          x,
          y - 0.31,
          19,
          C.ink,
          true
        )
      );
    }

    a.push(
      text(
        'Very unhappy',
        CX - 2.20,
        y - 1.08,
        19,
        OLD
      ),

      text(
        'Delighted',
        CX + 2.20,
        y - 1.08,
        19,
        NEW
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // TWO SEPARATE CUSTOMER GROUPS
  // ------------------------------------------------------------

  const GROUP_SP = P ? 1.13 : 1.15;

  const GROUP_Y = [
    P ? 0.25 : 0.38,
    P ? -2.0 : -1.32
  ];

  function groupSlot(group, i) {
    return [
      CX + (i - 2) * GROUP_SP,

      group === 'old'
        ? GROUP_Y[0]
        : GROUP_Y[1],

      0
    ];
  }

  function customerCard(
    d,
    x,
    y,
    showRating = true
  ) {
    const color =
      groupColor(d.group);

    const a = [];

    a.push(
      rounded(
        x,
        y,
        0.91,
        P ? 1.14 : 0.92,
        color,
        0.08,
        1.6
      ),

      person(
        x,
        y + 0.10,
        color,
        0.87
      )
    );

    if (showRating) {
      a.push(
        rounded(
          x,
          y - 0.43,
          0.65,
          0.45,
          color,
          0.17,
          1.3
        ),

        text(
          d.value,
          x,
          y - 0.43,
          23,
          color,
          true
        )
      );
    }

    return G(a);
  }

  function customerGroups({
    showOld = false,
    showNew = false,
    independent = false
  } = {}) {
    const a = [];

    ['old', 'new'].forEach((group, r) => {
      const y = GROUP_Y[r];

      const color = groupColor(group);

      const records =
        DATA.filter(d => d.group === group);

      a.push(
        rounded(
          CX,
          y,
          6.25,
          P ? 1.60 : 1.26,
          color,
          0.025,
          1.5
        ),

        text(
          group === 'old'
            ? 'Old script — 5 customers'
            : 'New script — 5 customers',
          CX,
          y + (P ? 1.04 : 0.86),
          21,
          color
        )
      );

      records.forEach((d, i) => {
        const p = groupSlot(group, i);

        a.push(
          customerCard(
            d,
            p[0],
            p[1],

            group === 'old'
              ? showOld
              : showNew
          )
        );
      });
    });

    if (independent) {
      a.push(
        text(
          'Different people — no matched pairs',
          CX,
          P ? -3.35 : -2.48,
          19,
          RANK,
          false,
          6.5
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // TWO GROUPS ON SEPARATE RATING LINES
  // These dots will later move onto one pooled line.
  // ------------------------------------------------------------

  const AX_LEFT = CX - 3.10;
  const AX_RIGHT = CX + 3.10;

  const rx = v =>
    AX_LEFT +
    (v - 1) / 9 *
      (AX_RIGHT - AX_LEFT);

  const SEP_OLD_Y = P ? 0.18 : 0.31;
  const SEP_NEW_Y = P ? -2.12 : -1.42;

  const POOL_Y = P ? -1.15 : -0.35;

  function ratingAxis(
    y,
    {
      numbers = true,
      color = C.muted
    } = {}
  ) {
    const a = [];

    a.push(
      line(
        AX_LEFT - 0.13,
        y,
        AX_RIGHT + 0.13,
        y,
        color,
        2
      )
    );

    for (let v = 1; v <= 10; v++) {
      a.push(
        line(
          rx(v),
          y - 0.07,
          rx(v),
          y + 0.07,
          color,
          1
        )
      );

      if (numbers) {
        a.push(
          text(
            v,
            rx(v),
            y - 0.29,
            17,
            C.muted,
            true
          )
        );
      }
    }

    return G(a);
  }

  function ratingDot(
    d,
    x,
    y,
    {
      showRating = true,
      showRank = false,
      radius = 0.13,
      active = true
    } = {}
  ) {
    const color = active
      ? groupColor(d.group)
      : C.muted;

    const halo = dot(
      x,
      y,
      color,
      radius * 1.9
    );

    halo.setFill(
      color,
      active ? 0.15 : 0.025
    );

    const a = [
      halo,

      dot(
        x,
        y,
        color,
        radius
      )
    ];

    if (showRating) {
      a.push(
        text(
          d.value,
          x,
          y + 0.35,
          19,
          color,
          true
        )
      );
    }

    if (showRank) {
      a.push(
        rounded(
          x,
          y - 0.73,
          0.51,
          0.44,
          RANK,
          0.13,
          1.4
        ),

        text(
          d.rank,
          x,
          y - 0.73,
          20,
          RANK,
          true
        )
      );
    }

    return G(a);
  }

  function separateAxes() {
    return G(
      ratingAxis(SEP_OLD_Y),

      ratingAxis(SEP_NEW_Y),

      text(
        'Old script',
        CX,
        SEP_OLD_Y + 1.06,
        22,
        OLD
      ),

      text(
        'New script',
        CX,
        SEP_NEW_Y + 1.06,
        22,
        NEW
      )
    );
  }

  function separateRatingDots() {
    return G(
      separateAxes(),

      DATA.map(d =>
        ratingDot(
          d,
          rx(d.value),

          (
            d.group === 'old'
              ? SEP_OLD_Y
              : SEP_NEW_Y
          ) + 0.26
        )
      )
    );
  }

  // ------------------------------------------------------------
  // ORDINAL RATINGS
  // A rating of four is higher than two.
  // It is not necessarily twice the satisfaction.
  // ------------------------------------------------------------

  function ordinalPicture(
    orderOnly = false
  ) {
    const a = [];

    const y = P ? 0.10 : 0.25;

    const xs = [
      CX - 1.70,
      CX + 1.70
    ];

    [2, 4].forEach((value, i) => {
      const color =
        i === 0 ? OLD : NEW;

      a.push(
        rounded(
          xs[i],
          y,
          2.25,
          1.55,
          color,
          0.10,
          2
        ),

        face(
          xs[i],
          y + 0.92,
          i === 1,
          color,
          0.36
        ),

        text(
          value,
          xs[i],
          y,
          42,
          color,
          true
        )
      );
    });

    a.push(
      text(
        orderOnly ? '<' : '×2?',
        CX,
        y,
        orderOnly ? 34 : 24,
        orderOnly ? RANK : OLD,
        true
      ),

      text(
        orderOnly
          ? '4 is rated higher than 2'
          : 'Twice the number ≠ twice the satisfaction',
        CX,
        y - 1.28,
        21,
        orderOnly ? RANK : OLD,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // POOLED RATING LINE
  // All ten dots are sorted together.
  // Amber remains old; cyan remains new.
  // ------------------------------------------------------------

  function pooledAxis(
    rankVisible = false
  ) {
    const a = [];

    a.push(
      ratingAxis(
        POOL_Y,
        {
          numbers: !rankVisible
        }
      ),

      text(
        'Lowest  →  Highest',
        CX,
        POOL_Y + 1.46,
        22,
        RANK
      )
    );

    if (rankVisible) {
      a.push(
        text(
          'Rank = position in the pooled line',
          CX,
          POOL_Y - 1.32,
          18,
          RANK,
          false,
          6.5
        )
      );
    } else {
      a.push(
        text(
          'All ten customers together',
          CX,
          POOL_Y - 0.83,
          19,
          C.muted
        )
      );
    }

    return G(a);
  }

  function pooledPicture({
    ranks = true,
    focus = 'all',
    showCrowding = false
  } = {}) {
    const a = [
      pooledAxis(ranks)
    ];

    RANKED.forEach(d => {
      const active =
        focus === 'all' ||
        focus === d.group;

      a.push(
        ratingDot(
          d,
          rx(d.value),
          POOL_Y + 0.30,
          {
            showRating: true,
            showRank: ranks,
            active
          }
        )
      );
    });

    if (showCrowding) {
      const y = POOL_Y + 0.43;

      a.push(
        rounded(
          (rx(1) + rx(4)) / 2,
          y,
          rx(4) - rx(1) + 0.48,
          0.91,
          OLD,
          0,
          2
        ),

        rounded(
          (rx(8) + rx(10)) / 2,
          y,
          rx(10) - rx(8) + 0.48,
          0.91,
          NEW,
          0,
          2
        ),

        text(
          'Old crowds the low end',
          CX - 1.65,
          POOL_Y + 1.12,
          17,
          OLD,
          false,
          3.15
        ),

        text(
          'New crowds the high end',
          CX + 1.65,
          POOL_Y + 1.12,
          17,
          NEW,
          false,
          3.15
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // RANK TOKENS
  // ------------------------------------------------------------

  function rankToken(
    x, y,
    rank,
    group,
    {
      w = 0.53,
      h = 0.50,
      active = true
    } = {}
  ) {
    const color =
      active
        ? groupColor(group)
        : C.muted;

    return G(
      rounded(
        x,
        y,
        w + 0.06,
        h + 0.06,
        color,
        active ? 0.07 : 0.01,
        0
      ),

      rounded(
        x,
        y,
        w,
        h,
        color,
        active ? 0.15 : 0.025,
        active ? 1.7 : 0.7
      ),

      text(
        rank,
        x,
        y,
        22,
        color,
        true,
        w - 0.07
      )
    );
  }

  // ------------------------------------------------------------
  // ONE CROSS-GROUP CONTEST
  // ------------------------------------------------------------

  function singleContest(
    oldValue,
    newValue,
    reveal = false
  ) {
    const a = [];

    const y = P ? -0.35 : -0.15;

    const xs = [
      CX - 1.65,
      CX + 1.65
    ];

    [oldValue, newValue].forEach((v, i) => {
      const color =
        i === 0 ? OLD : NEW;

      a.push(
        person(
          xs[i],
          y + 0.80,
          color,
          1.25
        ),

        text(
          i === 0
            ? 'Old customer'
            : 'New customer',
          xs[i],
          y + 1.48,
          19,
          color
        ),

        rounded(
          xs[i],
          y - 0.17,
          1.75,
          1.10,
          color,
          0.12,
          2
        ),

        text(
          v,
          xs[i],
          y - 0.17,
          38,
          color,
          true
        )
      );
    });

    const oldWins =
      oldValue > newValue;

    const tied =
      oldValue === newValue;

    a.push(
      text(
        reveal
          ? tied
            ? '='
            : oldWins
              ? '>'
              : '<'
          : 'VS',
        CX,
        y - 0.17,
        reveal ? 34 : 24,
        RANK,
        true
      )
    );

    if (reveal) {
      const color =
        tied ? RANK : oldWins ? OLD : NEW;

      const winnerLabel =
        tied
          ? 'Tie'
          : oldWins
            ? 'Old wins'
            : 'New wins';

      a.push(
        rounded(
          CX,
          y - 1.24,
          3.55,
          0.65,
          color,
          0.11,
          2
        ),

        text(
          winnerLabel,
          CX,
          y - 1.24,
          25,
          color
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // ALL 25 PAIRWISE CONTESTS
  //
  // Rows: old customers.
  // Columns: new customers.
  //
  // Each cell represents one old/new comparison.
  // ------------------------------------------------------------

  const CELL = P ? 0.87 : 0.59;

  const MATRIX_LEFT =
    CX - 2 * CELL + 0.30;

  const MATRIX_TOP =
    P ? 0.15 : 0.55;

  const cellX = c =>
    MATRIX_LEFT + c * CELL;

  const cellY = r =>
    MATRIX_TOP - r * CELL;

  function contestAxes() {
    const a = [];

    a.push(
      text(
        'New-script ratings',
        MATRIX_LEFT + 2 * CELL,
        MATRIX_TOP + CELL * 1.32,
        20,
        NEW
      ),

      text(
        'Old',
        MATRIX_LEFT - CELL * 1.17,
        MATRIX_TOP + CELL * 0.74,
        18,
        OLD
      )
    );

    NEW_RATINGS.forEach((v, c) => {
      a.push(
        text(
          v,
          cellX(c),
          MATRIX_TOP + CELL * 0.68,
          23,
          NEW,
          true
        )
      );
    });

    OLD_RATINGS.forEach((v, r) => {
      a.push(
        text(
          v,
          MATRIX_LEFT - CELL * 0.77,
          cellY(r),
          23,
          OLD,
          true
        )
      );
    });

    return G(a);
  }

  function contestCell(
    pair,
    revealed = false,
    focused = false
  ) {
    const x = cellX(pair.c);
    const y = cellY(pair.r);

    const color =
      !revealed
        ? C.muted
        : pair.winner === 'old'
          ? OLD
          : pair.winner === 'new'
            ? NEW
            : RANK;

    const a = [];

    a.push(
      rounded(
        x,
        y,
        CELL * 0.87,
        CELL * 0.87,
        color,
        revealed ? 0.18 : 0.035,
        focused ? 2.8 : 1.2,
        0.06
      )
    );

    if (revealed) {
      a.push(
        text(
          pair.winner === 'old'
            ? 'O'
            : pair.winner === 'new'
              ? 'N'
              : '=',
          x,
          y,
          P ? 24 : 21,
          color,
          true
        )
      );
    }

    return G(a);
  }

  function contestMatrix({
    revealRows = 0,
    revealLast = false,
    highlightOldWins = false,
    caption = ''
  } = {}) {
    const a = [
      contestAxes()
    ];

    PAIRS.forEach(pair => {
      const revealed =
        pair.r < revealRows ||
        (
          revealLast &&
          pair.r === 4
        );

      a.push(
        contestCell(
          pair,
          revealed,

          highlightOldWins &&
            pair.winner === 'old'
        )
      );
    });

    if (caption) {
      a.push(
        text(
          caption,
          CX,
          MATRIX_TOP - 4 * CELL - 0.79,
          20,
          RANK,
          false,
          6.5
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // FIRST FOUR OLD RATINGS LOSE EVERY COMPARISON
  // ------------------------------------------------------------

  function firstFourLosses() {
    const a = [
      contestMatrix({
        revealRows: 4,

        caption:
          '4 old customers × 5 new customers'
      })
    ];

    const y =
      (cellY(0) + cellY(3)) / 2;

    a.push(
      rounded(
        (cellX(0) + cellX(4)) / 2,
        y,
        CELL * 4.90,
        CELL * 3.93,
        NEW,
        0,
        2.7
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // OLD RATING SEVEN WINS AGAINST FIVE AND SIX
  // ------------------------------------------------------------

  function sevenContestPicture() {
    const a = [];

    const topY = P ? 0.78 : 0.88;
    const rowY = P ? -1.18 : -0.65;

    a.push(
      rankToken(
        CX,
        topY,
        7,
        'old',
        {
          w: 1.02,
          h: 0.72
        }
      ),

      text(
        'Old rating',
        CX,
        topY + 0.57,
        20,
        OLD
      )
    );

    NEW_RATINGS.forEach((v, i) => {
      const x =
        CX + (i - 2) * 1.12;

      const oldWins = 7 > v;

      const color =
        oldWins ? OLD : NEW;

      a.push(
        line(
          CX,
          topY - 0.39,
          x,
          rowY + 0.37,
          color,
          1.4
        ),

        rankToken(
          x,
          rowY,
          v,
          'new',
          {
            w: 0.78,
            h: 0.64
          }
        ),

        text(
          oldWins
            ? 'Old wins'
            : 'New wins',
          x,
          rowY - 0.55,
          16,
          color,
          false,
          1.06
        )
      );
    });

    a.push(
      text(
        '7 beats 5 and 6 only',
        CX,
        rowY - 1.08,
        23,
        OLD,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // COUNT ALL WINS
  //
  // 25 squares represent the 25 cross-group comparisons.
  // Amber squares are old wins.
  // Cyan squares are new wins.
  // ------------------------------------------------------------

  function winCountPicture(
    expected = false
  ) {
    const a = [];

    const w = 6.15;
    const left = CX - w / 2;

    const y = P ? -0.36 : -0.18;

    const oldCount =
      expected ? EXPECTED_U : OLD_WINS;

    const newCount =
      expected ? EXPECTED_U : NEW_WINS;

    const oldW =
      w * oldCount / TOTAL_PAIRS;

    const newW =
      w * newCount / TOTAL_PAIRS;

    a.push(
      text(
        expected
          ? 'Expected if both groups are equally liked'
          : 'Observed pairwise wins',
        CX,
        y + 1.27,
        20,
        RANK,
        false,
        6.5
      ),

      rect(
        left + oldW / 2,
        y,
        oldW,
        0.79,
        OLD,
        expected ? 0.15 : 0.85,
        2
      ),

      rect(
        left + oldW + newW / 2,
        y,
        newW,
        0.79,
        NEW,
        expected ? 0.15 : 0.85,
        2
      )
    );

    for (let k = 1; k < TOTAL_PAIRS; k++) {
      const x =
        left + k * w / TOTAL_PAIRS;

      a.push(
        line(
          x,
          y - 0.395,
          x,
          y + 0.395,
          C.card,
          0.8
        )
      );
    }

    a.push(
      text(
        `${oldCount} old wins`,
        CX - 1.64,
        y - 0.88,
        25,
        OLD,
        true,
        3.05
      ),

      text(
        `${newCount} new wins`,
        CX + 1.64,
        y - 0.88,
        25,
        NEW,
        true,
        3.05
      ),

      text(
        '25 comparisons in total',
        CX,
        y - 1.54,
        20,
        C.muted
      )
    );

    if (expected) {
      a.push(
        dashed(
          CX,
          y - 0.52,
          CX,
          y + 0.72,
          RANK
        )
      );
    } else {
      a.push(
        line(
          left + oldW / 2,
          y + 0.42,
          CX - 2.1,
          y + 0.80,
          OLD,
          1.7
        ),

        text(
          'U = 2',
          CX - 2.05,
          y + 0.96,
          25,
          OLD,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // EXPECTED AND OBSERVED WINS
  // Hollow bars: expected 12.5 per group.
  // Glowing bars: observed 2 and 23.
  // ------------------------------------------------------------

  function winsChart() {
    const a = [];

    const base = P ? -3.10 : -1.86;
    const scale = P ? 0.16 : 0.116;

    const centers = [
      CX - 1.60,
      CX + 1.60
    ];

    a.push(
      line(
        CX - 3.15,
        base,
        CX + 3.15,
        base,
        C.muted,
        2
      )
    );

    [5, 10, 15, 20, 25].forEach(v => {
      const y = base + v * scale;

      a.push(
        line(
          CX - 3.10,
          y,
          CX + 3.10,
          y,
          C.muted,
          0.55
        )
      );
    });

    [OLD_WINS, NEW_WINS].forEach((n, r) => {
      const color =
        r === 0 ? OLD : NEW;

      const center = centers[r];

      const ex = center - 0.49;
      const ox = center + 0.49;

      const eh = EXPECTED_U * scale;
      const oh = n * scale;

      a.push(
        rect(
          ex,
          base + eh / 2,
          0.81,
          eh,
          color,
          0,
          2.5
        ),

        text(
          '12.5',
          ex,
          base + eh + 0.23,
          20,
          color,
          true
        ),

        rect(
          ox,
          base + oh / 2,
          0.95,
          oh + 0.06,
          color,
          0.10,
          0
        ),

        rect(
          ox,
          base + oh / 2,
          0.81,
          oh,
          color,
          0.85,
          1.5
        ),

        text(
          n,
          ox,
          base + oh + 0.23,
          23,
          color,
          true
        ),

        text(
          r === 0
            ? 'Old wins'
            : 'New wins',
          center,
          base - 0.32,
          20,
          color
        )
      );
    });

    a.push(
      rect(
        CX - 2.35,
        base - 0.81,
        0.22,
        0.22,
        C.muted,
        0
      ),

      text(
        'Expected',
        CX - 1.30,
        base - 0.81,
        16,
        C.muted
      ),

      rect(
        CX + 0.32,
        base - 0.81,
        0.22,
        0.22,
        NEW,
        0.8,
        1
      ),

      text(
        'Observed',
        CX + 1.42,
        base - 0.81,
        16,
        C.ink
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // RANK LABEL SHUFFLE
  // Values and ranks stay fixed.
  // Only membership in the old/new groups changes.
  // ------------------------------------------------------------

  function shuffledRanksPicture(
    oldRanks,
    caption = 'One possible allocation'
  ) {
    const a = [];

    const set = new Set(oldRanks);

    const y = P ? -0.25 : -0.10;

    ALL_RANKS.forEach(rank => {
      const group =
        set.has(rank)
          ? 'old'
          : 'new';

      const x = rx(rank);

      a.push(
        rankToken(
          x,
          y,
          rank,
          group,
          {
            w: 0.53,
            h: 0.65
          }
        )
      );
    });

    const rankSum =
      oldRanks.reduce(
        (s, v) => s + v,
        0
      );

    const u =
      rankSum - MIN_OLD_RANK_SUM;

    a.push(
      text(
        'Fixed ranks 1–10',
        CX,
        y + 1.12,
        22,
        RANK
      ),

      text(
        '5 amber labels; 5 cyan labels',
        CX,
        y + 0.65,
        19,
        C.muted
      ),

      text(
        caption,
        CX,
        y - 0.80,
        20,
        RANK,
        false,
        6.4
      ),

      text(
        `Old U = ${u}`,
        CX,
        y - 1.39,
        28,
        OLD,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ALL 252 ALLOCATIONS
  //
  // One tile = one assignment of five ranks to the old group.
  // Tiles are ordered by U so the tails remain visible.
  // ------------------------------------------------------------

  function allocationGrid(
    highlight = 'none'
  ) {
    const a = [];

    const cols = 18;
    const rows = 14;

    const dx = 0.355;
    const dy = P ? 0.31 : 0.195;

    const top = P ? 1.02 : 1.07;

    const ordered =
      ALLOCATIONS.slice().sort(
        (a, b) => a.uOld - b.uOld
      );

    ordered.forEach((allocation, i) => {
      const x =
        CX +
        (i % cols - (cols - 1) / 2) *
          dx;

      const y =
        top -
        Math.floor(i / cols) *
          dy;

      const low =
        allocation.uOld <= U;

      const high =
        allocation.uNew <= U;

      const active =
        highlight === 'lower'
          ? low
          : highlight === 'both'
            ? low || high
            : false;

      const color =
        active
          ? low ? NEW : OLD
          : C.muted;

      a.push(
        rounded(
          x,
          y,
          0.29,
          P ? 0.23 : 0.14,
          color,
          active ? 0.88 : 0.16,
          active ? 1.5 : 0.4,
          0.025
        )
      );
    });

    const caption =
      highlight === 'lower'
        ? '4 allocations give old U ≤ 2'
        : highlight === 'both'
          ? '8 equally or more extreme allocations'
          : '252 equally likely allocations';

    a.push(
      text(
        caption,
        CX,
        top - (rows - 1) * dy - 0.49,
        20,
        highlight === 'none'
          ? RANK
          : C.ink,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXACT FOUR LOWER-TAIL ALLOCATIONS
  // Show the entire set of ten ranks in each allocation.
  // ------------------------------------------------------------

  function allocationStrip(
    allocation,
    y,
    {
      showU = true,
      showObserved = false
    } = {}
  ) {
    const a = [];

    const set =
      new Set(allocation.oldRanks);

    const center = CX - 0.50;
    const pitch = 0.46;

    ALL_RANKS.forEach((rank, i) => {
      const x =
        center + (i - 4.5) * pitch;

      a.push(
        rankToken(
          x,
          y,
          rank,
          set.has(rank)
            ? 'old'
            : 'new',
          {
            w: 0.39,
            h: P ? 0.44 : 0.39
          }
        )
      );
    });

    if (showU) {
      a.push(
        text(
          allocation.uOld,
          CX + 2.43,
          y,
          22,
          OLD,
          true
        )
      );
    }

    const observed =
      allocation.oldRanks.every(
        (v, i) =>
          v === OLD_RATINGS[i]
      );

    if (showObserved && observed) {
      a.push(
        rounded(
          CX - 0.11,
          y,
          5.75,
          P ? 0.65 : 0.51,
          NEW,
          0,
          2.1
        )
      );
    }

    return G(a);
  }

  function fourAllocationsPicture(
    revealed = 4
  ) {
    const a = [];

    const top = P ? 0.68 : 0.76;
    const dy = P ? 0.87 : 0.64;

    a.push(
      text(
        'Pooled rank allocation',
        CX - 0.55,
        top + 0.58,
        20,
        RANK
      ),

      text(
        'Old U',
        CX + 2.43,
        top + 0.58,
        18,
        OLD
      )
    );

    LOWER_ALLOCATIONS.forEach((allocation, i) => {
      const y = top - i * dy;

      a.push(
        rounded(
          CX,
          y,
          6.35,
          P ? 0.68 : 0.52,
          C.muted,
          0.025,
          0.7
        )
      );

      if (i < revealed) {
        a.push(
          allocationStrip(
            allocation,
            y,
            {
              showU: true,
              showObserved: true
            }
          )
        );
      }
    });

    a.push(
      text(
        revealed === 4
          ? 'Exactly 4 allocations with U ≤ 2'
          : `${revealed} qualifying allocations`,
        CX,
        top - 3 * dy - 0.60,
        21,
        RANK,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // TWO EXTREME DIRECTIONS
  // Four assignments at each end of the null distribution.
  // ------------------------------------------------------------

  function twoTailsPicture() {
    const a = [];

    const centers = [
      CX - 1.65,
      CX + 1.65
    ];

    const y = P ? -0.18 : -0.12;

    const values = [
      {
        title: 'Old rarely wins',
        statistic: 'Uold ≤ 2',
        color: NEW,
        count: LOWER_COUNT
      },

      {
        title: 'New rarely wins',
        statistic: 'Unew ≤ 2',
        color: OLD,
        count: UPPER_COUNT
      }
    ];

    values.forEach((v, i) => {
      const x = centers[i];

      a.push(
        rounded(
          x,
          y,
          2.95,
          2.48,
          v.color,
          0.055,
          2
        ),

        text(
          v.title,
          x,
          y + 0.89,
          20,
          v.color,
          false,
          2.78
        ),

        text(
          v.statistic,
          x,
          y + 0.43,
          21,
          v.color,
          true
        )
      );

      for (let j = 0; j < v.count; j++) {
        a.push(
          rounded(
            x + (j - 1.5) * 0.48,
            y - 0.20,
            0.36,
            0.38,
            v.color,
            0.80,
            1.4
          )
        );
      }

      a.push(
        text(
          '4 allocations',
          x,
          y - 0.83,
          22,
          v.color,
          true,
          2.75
        )
      );
    });

    a.push(
      text(
        '+',
        CX,
        y,
        28,
        C.ink
      ),

      text(
        '4 + 4 = 8 extreme allocations',
        CX,
        y - 1.76,
        22,
        RANK,
        true,
        6.5
      ),

      text(
        '8 / 252',
        CX,
        y - 2.27,
        26,
        RANK,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXACT MANN–WHITNEY NULL DISTRIBUTION
  //
  // Horizontal axis: U for the old group, from 0 to 25.
  // Vertical heights: exact numbers of allocations.
  // ------------------------------------------------------------

  const HIST_BASE = P ? -3.20 : -1.86;

  const HIST_H = P ? 4.05 : 2.82;

  const HIST_W = P ? 6.35 : 6.50;

  const HIST_LEFT =
    CX - HIST_W / 2;

  const HIST_MAX =
    Math.max(...HIST_COUNTS);

  const hx = u =>
    HIST_LEFT +
    u / TOTAL_PAIRS * HIST_W;

  function histogram({
    highlight = 'none',
    observed = true,
    expected = false,
    tailLabels = false
  } = {}) {
    const a = [];

    const step =
      HIST_W / TOTAL_PAIRS;

    a.push(
      line(
        HIST_LEFT - 0.08,
        HIST_BASE,
        HIST_LEFT + HIST_W + 0.08,
        HIST_BASE,
        C.muted,
        2
      )
    );

    HIST_COUNTS.forEach((n, u) => {
      if (n === 0) return;

      const lower = u <= U;

      const upper =
        u >= TOTAL_PAIRS - U;

      const active =
        highlight === 'lower'
          ? lower
          : highlight === 'both'
            ? lower || upper
            : false;

      const color =
        active
          ? lower ? NEW : OLD
          : RANK;

      const h =
        n / HIST_MAX * HIST_H;

      a.push(
        rect(
          hx(u),
          HIST_BASE + h / 2,
          step * 0.86,
          h,
          color,
          active ? 0.95 : 0.65,
          active ? 1.6 : 0.7
        )
      );
    });

    [0, 2, 5, 10, 15, 20, 23, 25]
      .forEach(u => {
        a.push(
          line(
            hx(u),
            HIST_BASE - 0.06,
            hx(u),
            HIST_BASE + 0.06,
            C.muted,
            1
          ),

          text(
            u,
            hx(u),
            HIST_BASE - 0.28,
            15,
            u === U
              ? NEW
              : u === TOTAL_PAIRS - U
                ? OLD
                : C.muted,
            true
          )
        );
      });

    a.push(
      text(
        'Old-group U',
        CX,
        HIST_BASE - 0.76,
        19,
        C.muted
      ),

      text(
        'Exact null distribution',
        CX,
        P ? 1.30 : 1.40,
        20,
        RANK
      )
    );

    if (expected) {
      a.push(
        dashed(
          hx(EXPECTED_U),
          HIST_BASE,
          hx(EXPECTED_U),
          HIST_BASE + HIST_H,
          C.ink
        ),

        text(
          '12.5',
          hx(EXPECTED_U),
          HIST_BASE + HIST_H + 0.24,
          18,
          C.ink,
          true
        )
      );
    }

    if (observed) {
      const y =
        HIST_BASE + HIST_H * 0.46;

      a.push(
        dashed(
          hx(U),
          HIST_BASE,
          hx(U),
          y,
          NEW
        ),

        text(
          'U = 2',
          hx(U) + 0.29,
          y + 0.23,
          21,
          NEW,
          true
        )
      );
    }

    if (tailLabels) {
      a.push(
        text(
          '4 ways',
          hx(2) + 0.21,
          HIST_BASE + HIST_H * 0.76,
          18,
          NEW,
          true
        ),

        text(
          '4 ways',
          hx(23) - 0.21,
          HIST_BASE + HIST_H * 0.76,
          18,
          OLD,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // P-VALUE DECISION
  // Exact p = 8/252 ≈ 3.1746%.
  // ------------------------------------------------------------

  function decisionPicture() {
    const a = [];

    const maxP = 0.10;

    const w = P ? 6.10 : 6.40;

    const left = CX - w / 2;

    const y = P ? -0.48 : -0.30;

    const px = v =>
      left + v / maxP * w;

    a.push(
      rect(
        px(ALPHA / 2),
        y,
        w * ALPHA / maxP,
        0.48,
        YES,
        0.22,
        0
      ),

      rect(
        px((ALPHA + maxP) / 2),
        y,
        w * (maxP - ALPHA) / maxP,
        0.48,
        C.muted,
        0.11,
        0
      ),

      line(
        px(0),
        y,
        px(maxP),
        y,
        C.muted,
        2
      )
    );

    for (let i = 0; i <= 10; i++) {
      const v = i / 100;

      a.push(
        line(
          px(v),
          y - 0.10,
          px(v),
          y + 0.10,
          C.muted,
          1
        )
      );

      if (
        i === 0 ||
        i === 2 ||
        i === 5 ||
        i === 8 ||
        i === 10
      ) {
        a.push(
          text(
            `${i}%`,
            px(v),
            y - 0.35,
            16,
            C.muted,
            true
          )
        );
      }
    }

    a.push(
      dashed(
        px(ALPHA),
        y - 0.22,
        px(ALPHA),
        y + 1.06,
        OLD
      ),

      text(
        '5% cutoff',
        px(ALPHA) + 0.66,
        y + 1.20,
        19,
        OLD
      ),

      line(
        px(PV),
        y - 0.22,
        px(PV),
        y + 0.70,
        NEW,
        3
      ),

      dot(
        px(PV),
        y,
        NEW,
        0.11
      ),

      text(
        'p ≈ 3.2%',
        px(PV) - 0.25,
        y + 0.96,
        24,
        NEW,
        true
      ),

      text(
        'Reject',
        px(0.025),
        y - 0.95,
        22,
        YES
      ),

      text(
        'Do not reject',
        px(0.075),
        y - 0.95,
        19,
        C.muted
      ),

      text(
        'Evidence that the two groups differ',
        CX,
        y - 1.53,
        20,
        YES,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // OLD RANK SUM
  // Show the five old ranks as stacks of rank units.
  // ------------------------------------------------------------

  function rankSumStacks(
    minimum = false
  ) {
    const a = [];

    const values =
      minimum
        ? [1, 2, 3, 4, 5]
        : OLD_RATINGS;

    const base = P ? -2.65 : -1.72;

    const pitch = P ? 0.43 : 0.34;

    const sp = 1.12;

    const color =
      minimum ? RANK : OLD;

    const total = values.reduce(
      (s, v) => s + v,
      0
    );

    values.forEach((rank, i) => {
      const x =
        CX + (i - 2) * sp;

      for (let j = 0; j < rank; j++) {
        a.push(
          rect(
            x,
            base + (j + 0.5) * pitch,
            0.72,
            pitch * 0.82,
            color,
            0.80,
            1
          )
        );
      }

      a.push(
        text(
          rank,
          x,
          base + rank * pitch + 0.23,
          23,
          color,
          true
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
      ),

      text(
        minimum
          ? 'Smallest possible five-rank sum'
          : 'Observed old-group rank sum',
        CX,
        P ? 1.22 : 1.37,
        20,
        color,
        false,
        6.5
      ),

      text(
        `${values.join(' + ')} = ${total}`,
        CX,
        base - 0.60,
        25,
        color,
        true,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // RANK-SUM SHORTCUT
  //
  // Compare the observed old ranks with the minimum possible
  // allocation of five ranks.
  // ------------------------------------------------------------

  function rankShortcutPicture(
    revealDifference = true
  ) {
    const a = [];

    const ys = [
      P ? 0.50 : 0.56,
      P ? -1.40 : -0.95
    ];

    const records = [
      OLD_RATINGS,
      [1, 2, 3, 4, 5]
    ];

    records.forEach((values, r) => {
      const y = ys[r];

      a.push(
        text(
          r === 0
            ? 'Observed old ranks'
            : 'Lowest possible ranks',
          CX,
          y + 0.67,
          20,
          r === 0 ? OLD : RANK
        )
      );

      values.forEach((v, i) => {
        const x =
          CX + (i - 2) * 0.93 - 0.57;

        a.push(
          rounded(
            x,
            y,
            0.73,
            0.69,
            r === 0 ? OLD : RANK,
            0.13,
            1.6
          ),

          text(
            v,
            x,
            y,
            25,
            r === 0 ? OLD : RANK,
            true
          )
        );
      });

      a.push(
        text(
          '= ' + values.reduce(
            (sum, v) => sum + v,
            0
          ),
          CX + 2.34,
          y,
          25,
          r === 0 ? OLD : RANK,
          true
        )
      );
    });

    if (revealDifference) {
      a.push(
        rounded(
          CX,
          P ? -2.70 : -2.12,
          5.50,
          0.68,
          YES,
          0.10,
          2
        ),

        text(
          'U = 17 − 15 = 2',
          CX,
          P ? -2.70 : -2.12,
          27,
          YES,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // TWO EXTRA RANK POSITIONS
  //
  // Old group minimum:
  // [1,2,3,4,5]
  //
  // Observed old group:
  // [1,2,3,4,7]
  //
  // Only the fifth rank moved, from 5 to 7.
  // This produces two extra rank positions and two wins.
  // ------------------------------------------------------------

  function aboveBottomPicture() {
    const a = [];

    const ys = [
      P ? 0.45 : 0.60,
      P ? -1.45 : -1.10
    ];

    const oldSets = [
      new Set([1, 2, 3, 4, 5]),
      new Set(OLD_RATINGS)
    ];

    oldSets.forEach((set, r) => {
      const y = ys[r];

      a.push(
        text(
          r === 0
            ? 'Old at the very bottom'
            : 'Observed old rank positions',
          CX,
          y + 0.63,
          20,
          r === 0 ? RANK : OLD
        )
      );

      ALL_RANKS.forEach(v => {
        a.push(
          rankToken(
            rx(v),
            y,
            v,
            set.has(v)
              ? 'old'
              : 'new',
            {
              w: 0.53,
              h: 0.60
            }
          )
        );
      });
    });

    const x1 = rx(5);
    const x2 = rx(7);

    const y = ys[1] - 0.52;

    a.push(
      line(
        x1,
        y,
        x2,
        y,
        RANK,
        2.7
      ),

      line(
        x1,
        y - 0.10,
        x1,
        y + 0.14,
        RANK,
        2
      ),

      line(
        x2,
        y - 0.10,
        x2,
        y + 0.14,
        RANK,
        2
      ),

      text(
        '2 rank positions',
        (x1 + x2) / 2,
        y - 0.35,
        21,
        RANK,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // GENERAL APPLICATION
  // Independent groups, ordinal measurements.
  // ------------------------------------------------------------

  function applicationGroups() {
    const a = [];

    const centers = [
      CX - 1.63,
      CX + 1.63
    ];

    const y = P ? -0.12 : -0.04;

    ['old', 'new'].forEach((group, r) => {
      const x = centers[r];
      const color = groupColor(group);

      a.push(
        rounded(
          x,
          y,
          2.98,
          2.45,
          color,
          0.045,
          2
        ),

        text(
          r === 0 ? 'Group A' : 'Group B',
          x,
          y + 0.86,
          23,
          color
        )
      );

      for (let j = 0; j < 3; j++) {
        a.push(
          person(
            x + (j - 1) * 0.78,
            y + 0.06,
            color,
            0.92
          )
        );
      }

      a.push(
        text(
          'Ordered values',
          x,
          y - 0.77,
          19,
          color,
          false,
          2.75
        )
      );
    });

    a.push(
      text(
        'Two separate groups',
        CX,
        y - 1.67,
        23,
        RANK
      ),

      text(
        'Compare their pooled ranks',
        CX,
        y - 2.10,
        19,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ORDINAL AND SKEWED-DATA APPLICATIONS
  // Ratings, rankings, waiting times, incomes.
  // No additional numerical claims are made about the trial.
  // ------------------------------------------------------------

  function applicationExamples() {
    const a = [];

    const ys = [
      P ? 0.91 : 0.90,
      P ? -0.57 : -0.27,
      P ? -2.05 : -1.46
    ];

    const labels = [
      'Ratings',
      'Rankings',
      'Skewed values'
    ];

    const colors = [
      NEW,
      RANK,
      OLD
    ];

    labels.forEach((s, r) => {
      a.push(
        rounded(
          CX,
          ys[r],
          6.35,
          P ? 1.15 : 0.98,
          colors[r],
          0.035,
          1.5
        ),

        text(
          s,
          CX - 1.95,
          ys[r],
          19,
          colors[r],
          false,
          2.10
        )
      );
    });

    for (let i = 0; i < 5; i++) {
      const x =
        CX - 0.20 + i * 0.65;

      a.push(
        rounded(
          x,
          ys[0],
          0.51,
          0.50,
          NEW,
          0.13
        ),

        text(
          i + 1,
          x,
          ys[0],
          20,
          NEW,
          true
        )
      );
    }

    [1, 2, 3].forEach((v, i) => {
      const x =
        CX + 0.02 + i * 0.91;

      a.push(
        rounded(
          x,
          ys[1],
          0.72,
          0.58,
          RANK,
          0.13
        ),

        text(
          v,
          x,
          ys[1],
          23,
          RANK,
          true
        )
      );
    });

    const heights = [
      0.36, 0.60, 0.52, 0.32,
      0.23, 0.13, 0.08
    ];

    heights.forEach((h, i) => {
      const x =
        CX - 0.28 + i * 0.48;

      a.push(
        rect(
          x,
          ys[2] - 0.30 + h / 2,
          0.38,
          h,
          OLD,
          0.73,
          1
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // WELCH'S T-TEST AND MANN–WHITNEY
  // Conceptual comparison, not an extra test of this dataset.
  // ------------------------------------------------------------

  function welchComparison() {
    const a = [];

    const ys = [
      P ? 0.68 : 0.63,
      P ? -1.72 : -1.20
    ];

    const rows = [
      {
        title: 'Welch’s t-test',
        description: 'Compares numerical means',
        color: NEW
      },

      {
        title: 'Mann–Whitney',
        description: 'Compares relative ranks',
        color: RANK
      }
    ];

    rows.forEach((row, i) => {
      const y = ys[i];

      a.push(
        rounded(
          CX,
          y,
          6.20,
          P ? 1.62 : 1.38,
          row.color,
          0.045,
          1.7
        ),

        text(
          row.title,
          CX,
          y + 0.46,
          22,
          row.color
        ),

        text(
          row.description,
          CX,
          y - 0.10,
          20,
          C.ink,
          false,
          5.90
        )
      );
    });

    a.push(
      text(
        'Both compare two separate groups',
        CX,
        P ? -3.05 : -2.40,
        19,
        C.muted,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // MEDIAN TRAP
  // Mann–Whitney is not generally a test of median equality.
  // ------------------------------------------------------------

  function medianTrapPicture() {
    const a = [];

    const values = [
      OLD_RATINGS,
      NEW_RATINGS
    ];

    const ys = [
      P ? 0.30 : 0.30,
      P ? -1.85 : -1.25
    ];

    values.forEach((row, r) => {
      const group =
        r === 0 ? 'old' : 'new';

      const color = groupColor(group);

      const y = ys[r];

      a.push(
        text(
          r === 0
            ? 'Old ratings'
            : 'New ratings',
          CX,
          y + 0.66,
          21,
          color
        )
      );

      row.forEach((v, i) => {
        const x =
          CX + (i - 2) * 1.03;

        a.push(
          rankToken(
            x,
            y,
            v,
            group,
            {
              w: 0.79,
              h: 0.64
            }
          )
        );

        if (i === 2) {
          a.push(
            rounded(
              x,
              y,
              0.91,
              0.78,
              RANK,
              0,
              2.5
            )
          );
        }
      });

      a.push(
        text(
          `Median = ${row[2]}`,
          CX,
          y - 0.62,
          21,
          RANK,
          true
        )
      );
    });

    a.push(
      text(
        'But U uses all cross-group comparisons',
        CX,
        P ? -3.10 : -2.44,
        18,
        OLD,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // PAIRWISE INTERPRETATION
  //
  // In the observed sample, 23/25 comparisons favour new.
  // This is a sample comparison proportion, not a guarantee
  // about every future pair of customers.
  // ------------------------------------------------------------

  function pairwiseInterpretation() {
    const a = [];

    const centers = [
      CX - 1.65,
      CX + 1.65
    ];

    const y = P ? 0.12 : 0.22;

    ['old', 'new'].forEach((group, r) => {
      const x = centers[r];

      const color = groupColor(group);

      a.push(
        rounded(
          x,
          y,
          2.95,
          1.64,
          color,
          0.05,
          1.8
        ),

        person(
          x,
          y + 0.11,
          color,
          1.18
        ),

        text(
          'Pick one',
          x,
          y - 0.49,
          19,
          color
        )
      );
    });

    a.push(
      text(
        'VS',
        CX,
        y,
        24,
        RANK,
        true
      ),

      text(
        'Who tends to give the higher rating?',
        CX,
        y - 1.24,
        21,
        RANK,
        false,
        6.5
      ),

      text(
        'In our sample: 23 of 25 favour new',
        CX,
        y - 1.84,
        23,
        NEW,
        true,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // DISTRIBUTION SHAPE
  //
  // When two population distributions differ only by location,
  // the rank comparison can be interpreted as a location shift.
  //
  // Illustrative shapes, not fitted distributions.
  // ------------------------------------------------------------

  function shiftedShapePicture() {
    const a = [];

    const base = P ? -2.60 : -1.72;

    const pitch = P ? 0.44 : 0.32;

    const counts = [1, 3, 5, 3, 1];

    const xOld = CX - 1.20;
    const xNew = CX + 1.20;

    const step = 0.55;

    [xOld, xNew].forEach((center, r) => {
      const color =
        r === 0 ? OLD : NEW;

      counts.forEach((n, i) => {
        for (let j = 0; j < n; j++) {
          const x =
            center + (i - 2) * step;

          const y =
            base + (j + 0.5) * pitch;

          const halo = dot(
            x,
            y,
            color,
            P ? 0.16 : 0.13
          );

          halo.setFill(color, 0.10);

          a.push(
            halo,

            dot(
              x,
              y,
              color,
              P ? 0.10 : 0.075
            )
          );
        }
      });

      a.push(
        dashed(
          center,
          base - 0.07,
          center,
          base + 5 * pitch + 0.25,
          color
        ),

        text(
          r === 0
            ? 'Old centre'
            : 'New centre',
          center,
          base - 0.40,
          18,
          color
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
      ),

      text(
        'Same shape, shifted location',
        CX,
        P ? 1.23 : 1.34,
        22,
        RANK
      ),

      text(
        'A location-shift interpretation is possible',
        CX,
        base - 0.95,
        18,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SAME MEDIAN, DIFFERENT SHAPES
  //
  // Illustrative data, separate from the shared trial:
  //
  // A = [1, 2, 5, 5, 5]
  // B = [5, 5, 5, 9, 10]
  //
  // Both medians are 5, yet pairwise tendencies differ.
  // ------------------------------------------------------------

  function differentShapePicture() {
    const a = [];

    const samples = [
      [1, 2, 5, 5, 5],
      [5, 5, 5, 9, 10]
    ];

    const ys = [
      P ? 0.24 : 0.32,
      P ? -2.10 : -1.40
    ];

    const medianX = rx(5);

    samples.forEach((values, r) => {
      const color =
        r === 0 ? OLD : NEW;

      const y = ys[r];

      a.push(
        ratingAxis(y),

        text(
          r === 0
            ? 'Illustrative group A'
            : 'Illustrative group B',
          CX,
          y + 0.94,
          19,
          color
        )
      );

      values.forEach((v, i) => {
        const stack = values
          .slice(0, i)
          .filter(z => z === v)
          .length;

        a.push(
          dot(
            rx(v),
            y + 0.20 + stack * 0.21,
            color,
            0.095
          )
        );
      });
    });

    a.push(
      dashed(
        medianX,
        ys[1] - 0.04,
        medianX,
        ys[0] + 0.70,
        RANK
      ),

      text(
        'Same median = 5',
        CX,
        P ? -3.24 : -2.42,
        21,
        RANK,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // TIED RATINGS
  //
  // Illustrative pooled values:
  // 7, 7, 7, 8, 8
  //
  // Sevens occupy positions 1,2,3, so receive rank 2.
  // Eights occupy positions 4,5, so receive rank 4.5.
  //
  // Exact no-tie null distribution used earlier must not simply
  // be reused unchanged for heavily tied data.
  // ------------------------------------------------------------

  function tiedRanksPicture(
    averaged = false
  ) {
    const a = [];

    const values = [
      7, 7, 7, 8, 8
    ];

    const ranks = averaged
      ? [2, 2, 2, 4.5, 4.5]
      : [1, 2, 3, 4, 5];

    const sp = 1.15;

    const y = P ? 0.36 : 0.41;

    values.forEach((v, i) => {
      const x =
        CX + (i - 2) * sp;

      const color =
        v === 7 ? OLD : NEW;

      a.push(
        rounded(
          x,
          y,
          0.90,
          0.83,
          color,
          0.14,
          1.7
        ),

        text(
          v,
          x,
          y,
          29,
          color,
          true
        ),

        text(
          ranks[i],
          x,
          y - 1.02,
          24,
          RANK,
          true
        )
      );
    });

    a.push(
      text(
        'Illustrative pooled ratings',
        CX,
        y + 0.84,
        20,
        C.ink
      ),

      rounded(
        CX - sp,
        y,
        sp * 2 + 1.05,
        1.02,
        OLD,
        0,
        2
      ),

      rounded(
        CX + 1.5 * sp,
        y,
        sp + 1.05,
        1.02,
        NEW,
        0,
        2
      ),

      text(
        averaged
          ? 'Average ranks'
          : 'Positions in the sorted line',
        CX,
        y - 0.60,
        17,
        RANK
      ),

      text(
        averaged
          ? 'Tied values share the average rank'
          : 'Equal ratings cannot be ordered uniquely',
        CX,
        y - 1.78,
        20,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // TIED PAIR: HALF A WIN EACH
  // ------------------------------------------------------------

  function tiedPairPicture() {
    const a = [];

    const y = P ? 0.30 : 0.38;

    a.push(
      rankToken(
        CX - 1.48,
        y,
        7,
        'old',
        {
          w: 1.34,
          h: 1.00
        }
      ),

      rankToken(
        CX + 1.48,
        y,
        7,
        'new',
        {
          w: 1.34,
          h: 1.00
        }
      ),

      text(
        '=',
        CX,
        y,
        32,
        RANK
      ),

      text(
        'Old rating',
        CX - 1.48,
        y + 0.78,
        20,
        OLD
      ),

      text(
        'New rating',
        CX + 1.48,
        y + 0.78,
        20,
        NEW
      ),

      text(
        '½ win',
        CX - 1.48,
        y - 0.95,
        25,
        OLD,
        true
      ),

      text(
        '½ win',
        CX + 1.48,
        y - 0.95,
        25,
        NEW,
        true
      ),

      text(
        'Use a tie-aware significance calculation',
        CX,
        y - 1.80,
        20,
        RANK,
        false,
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

    const y = P ? 0.77 : 0.76;

    RANKED.forEach(d => {
      a.push(
        rankToken(
          rx(d.rank),
          y,
          d.rank,
          d.group,
          {
            w: 0.53,
            h: 0.67
          }
        )
      );
    });

    a.push(
      text(
        'Pool and rank both groups',
        CX,
        y + 0.62,
        20,
        RANK
      ),

      text(
        '↓',
        CX,
        y - 0.70,
        26,
        RANK
      ),

      text(
        '2 old wins',
        CX - 1.62,
        y - 1.18,
        24,
        OLD,
        true
      ),

      text(
        '23 new wins',
        CX + 1.62,
        y - 1.18,
        24,
        NEW,
        true
      ),

      text(
        '8 extreme allocations out of 252',
        CX,
        y - 1.78,
        20,
        RANK,
        true,
        6.4
      ),

      rounded(
        CX,
        y - 2.49,
        5.80,
        0.72,
        YES,
        0.10,
        2
      ),

      text(
        'p ≈ 0.032 — reject the null',
        CX,
        y - 2.49,
        23,
        YES,
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
  // 0. Customers rated the help from one, very unhappy,
  // to ten, delighted.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(satisfactionScale()),

    ...say(
      'CUSTOMER SATISFACTION: ONE TO TEN'
    )
  );

  // ------------------------------------------------------------
  // 1. Ten customers: five old, five new.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...scene(customerGroups()),

    ...fbox([
      '10 different customers',
      ['Old script: 5', OLD],
      ['New script: 5', NEW]
    ]),

    ...say(
      'FIVE CUSTOMERS PER SCRIPT'
    )
  );

  // ------------------------------------------------------------
  // 2. Different people, separate groups, nothing paired.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...scene(customerGroups({
      independent: true
    })),

    ...fbox([
      ['Two independent groups', RANK],
      'Different customers',
      'No matched observations'
    ], RANK),

    ...say(
      'TWO SEPARATE GROUPS — NOTHING IS PAIRED',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 3. Old ratings: 1, 2, 3, 4, 7.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...scene(customerGroups({
      showOld: true,
      independent: true
    })),

    ...fbox([
      ['Old-script ratings', OLD],
      '1, 2, 3, 4, 7'
    ], OLD),

    ...say(
      'OLD RATINGS: 1, 2, 3, 4, 7',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 4. New ratings: 5, 6, 8, 9, 10.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...scene(customerGroups({
      showOld: true,
      showNew: true,
      independent: true
    })),

    ...fbox([
      ['New-script ratings', NEW],
      '5, 6, 8, 9, 10'
    ], NEW),

    ...say(
      'NEW RATINGS: 5, 6, 8, 9, 10',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 5. Do customers rate the new script higher?
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...scene(separateRatingDots()),

    ...fbox([
      'Compare customer satisfaction',
      ['Does new tend to rate higher?', NEW]
    ], OLD),

    ...say(
      'DO CUSTOMERS RATE THE NEW SCRIPT HIGHER?',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 6. Is a four exactly twice as good as a two?
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...scene(ordinalPicture(false)),

    ...fbox([
      'Ratings have an order',
      'But numerical distances',
      ['May not mean equal differences', OLD]
    ], OLD),

    ...say(
      'IS FOUR REALLY TWICE AS GOOD AS TWO?',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 7. We trust only the order: four is better than two.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...scene(ordinalPicture(true)),

    ...fbox([
      ['4 is higher than 2', RANK],
      'Trust the order',
      'Not the numerical ratio'
    ], RANK),

    ...say(
      'TRUST THE ORDER, NOT THE DISTANCE',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 8. Work with order only.
  // Short beat.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...fbox([
      ['Use ranks instead of distances', RANK]
    ], RANK),

    ...say(
      'WORK WITH ORDER ONLY',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 9. Step one: pool both groups into one sorted line.
  // Actual dot movement preserves original group membership.
  // ------------------------------------------------------------

  const movingDots = DATA.map(d =>
    ratingDot(
      d,
      rx(d.value),

      (
        d.group === 'old'
          ? SEP_OLD_Y
          : SEP_NEW_Y
      ) + 0.26
    )
  );

  await until(S(9));

  await play(
    ...scene(separateAxes()),

    ...movingDots.map(d =>
      new M.FadeIn(
        d,
        { runTime: 0.35 }
      )
    ),

    ...fbox([
      'Step 1',
      ['Pool both groups', RANK],
      'Keep the original colours'
    ], RANK),

    ...say(
      'STEP 1: POOL THE TWO GROUPS',
      RANK
    )
  );

  await until(S(9) + 2.2);

  // Fresh dots on the pooled line (a Transform would leave the labels behind).
  const pooledDots = DATA.map(d =>
    ratingDot(
      d,
      rx(d.value),
      POOL_Y + 0.30
    )
  );

  await play(
    ...scene(pooledAxis(false)),

    new M.FadeOut(G(...movingDots)),

    new M.LaggedStart(
      pooledDots.map(d =>
        new M.FadeIn(d, { shift: [0, 0.12, 0] })
      ),

      {
        lagRatio: 0.065,
        runTime: 2.0
      }
    ),

    ...say(
      'LOWEST TO HIGHEST, ALL TEN TOGETHER',
      RANK
    )
  );

  movingDots.splice(0, movingDots.length, ...pooledDots);

  // ------------------------------------------------------------
  // 10. Narration reads the pooled line:
  // amber 1,2,3,4; cyan 5,6; amber 7; cyan 8,9,10.
  // ------------------------------------------------------------

  const sortedMovingDots = RANKED.map(
    d =>
      movingDots[
        DATA.findIndex(v => v.id === d.id)
      ]
  );

  await until(S(10));

  await play(
    new M.LaggedStart(
      sortedMovingDots.slice(0, 4).map(d =>
        new M.Indicate(
          d,
          {
            color: OLD,
            runTime: 0.40
          }
        )
      ),
      {
        lagRatio: 0.22,
        runTime: 1.25
      }
    ),

    ...fbox([
      ['1, 2, 3, 4: old', OLD]
    ], OLD),

    ...say(
      'THE FOUR LOWEST RATINGS ARE OLD',
      OLD
    )
  );

  await until(S(10) + 2.55);

  await play(
    new M.LaggedStart(
      sortedMovingDots.slice(4, 6).map(d =>
        new M.Indicate(
          d,
          {
            color: NEW,
            runTime: 0.40
          }
        )
      ),
      {
        lagRatio: 0.25,
        runTime: 0.85
      }
    ),

    ...fbox([
      ['5, 6: new', NEW]
    ], NEW)
  );

  await until(S(10) + 4.20);

  await play(
    new M.Indicate(
      sortedMovingDots[6],
      {
        color: OLD,
        runTime: 0.55
      }
    ),

    ...fbox([
      ['7: old', OLD]
    ], OLD)
  );

  await until(S(10) + 5.65);

  await play(
    new M.LaggedStart(
      sortedMovingDots.slice(7).map(d =>
        new M.Indicate(
          d,
          {
            color: NEW,
            runTime: 0.40
          }
        )
      ),
      {
        lagRatio: 0.25,
        runTime: 1.20
      }
    ),

    ...fbox([
      ['8, 9, 10: new', NEW]
    ], NEW),

    ...say(
      'THE THREE HIGHEST RATINGS ARE NEW',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 11. Step two: give each dot its rank.
  // Here the ranks equal the ratings, from 1 to 10.
  // ------------------------------------------------------------

  const rankLabels = RANKED.map(d =>
    G(
      rounded(
        rx(d.rank),
        POOL_Y - 0.43,
        0.51,
        0.44,
        RANK,
        0.13,
        1.4
      ),

      text(
        d.rank,
        rx(d.rank),
        POOL_Y - 0.43,
        20,
        RANK,
        true
      )
    )
  );

  await until(S(11));

  await play(
    ...scene(pooledAxis(true)),

    new M.LaggedStart(
      rankLabels.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.13,
        runTime: 2.15
      }
    ),

    ...fbox([
      'Step 2',
      ['Rank = pooled position', RANK],
      'Smallest = 1',
      'Largest = 10'
    ], RANK),

    ...say(
      'STEP 2: GIVE EVERY DOT A RANK',
      RANK
    )
  );

  await until(S(11) + 3.6);

  await play(
    ...fbox([
      'Here, ratings are 1 to 10',
      'All ratings are distinct',
      ['Ranks also run from 1 to 10', RANK]
    ], RANK),

    ...say(
      'HERE THE RANKS MATCH THE RATINGS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 12. Amber crowds low end; cyan crowds high end.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    new M.FadeOut(
      new M.VGroup(
        ...movingDots,
        ...rankLabels
      )
    ),

    ...scene(pooledPicture({
      ranks: true,
      showCrowding: true
    })),

    ...fbox([
      ['Old ranks tend to be low', OLD],
      ['New ranks tend to be high', NEW]
    ]),

    ...say(
      'OLD LOW, NEW HIGH'
    )
  );

  // ------------------------------------------------------------
  // 13. Hold a small contest.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...scene(singleContest(7, 5, false)),

    ...fbox([
      'One old customer',
      'One new customer',
      ['Who rated higher?', RANK]
    ], RANK),

    ...say(
      'LET THE RATINGS COMPETE',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 14. Compare every old customer with every new customer.
  // Five times five makes 25 comparisons.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...scene(contestMatrix({
      revealRows: 0,
      caption: 'Every old rating meets every new rating'
    })),

    ...fbox([
      ['5 old customers', OLD],
      ['5 new customers', NEW],
      ['5 × 5 = 25 comparisons', RANK]
    ], RANK),

    ...say(
      'EVERY OLD CUSTOMER MEETS EVERY NEW CUSTOMER',
      RANK
    )
  );

  await until(S(14) + 3.0);

  await play(
    new M.Indicate(
      picture,
      {
        color: RANK,
        runTime: 0.8
      }
    ),

    ...say(
      'TWENTY-FIVE POSSIBLE CONTESTS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 15. Who gave the higher rating in each pair?
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...scene(singleContest(7, 5, true)),

    ...fbox([
      'Higher rating wins',
      ['7 > 5: old wins', OLD]
    ]),

    ...say(
      'HIGHER RATING WINS'
    )
  );

  // ------------------------------------------------------------
  // 16. Old ratings 1,2,3,4 lose to every new rating.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...scene(firstFourLosses()),

    ...fbox([
      ['Old ratings 1, 2, 3, 4', OLD],
      'All below every new rating',
      ['20 comparisons favour new', NEW]
    ]),

    ...say(
      'THE FOUR LOW OLD RATINGS LOSE EVERY TIME',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 17. Old rating seven beats new five and six.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...scene(sevenContestPicture()),

    ...fbox([
      ['7 > 5', OLD],
      ['7 > 6', OLD],
      '7 < 8, 9, 10',
      ['Exactly two old wins', OLD]
    ], OLD),

    ...say(
      'OLD RATING SEVEN WINS TWICE',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 18. Old wins two, new wins 23.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(contestMatrix({
      revealRows: 5,
      highlightOldWins: true,
      caption: '2 old wins; 23 new wins'
    })),

    ...fbox([
      ['Old wins: 2', OLD],
      ['New wins: 23', NEW],
      '2 + 23 = 25'
    ]),

    ...say(
      'TWO OLD WINS, TWENTY-THREE NEW WINS'
    )
  );

  await until(S(18) + 2.6);

  await play(
    ...scene(winCountPicture(false))
  );

  // ------------------------------------------------------------
  // 19. The count of wins is U. Here U = 2.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...fbox([
      ['U = old-group wins', RANK],
      ['U = 2', OLD],
      'Out of 25 comparisons'
    ], RANK),

    ...say(
      'THE MANN–WHITNEY STATISTIC: U = 2',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 20. Under the null, expected wins near 12.5 each.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...scene(winCountPicture(true)),

    ...fbox([
      'Null: same rating distribution',
      '25 comparisons',
      ['Expected U = 25/2 = 12.5', RANK]
    ], RANK),

    ...say(
      'UNDER THE NULL: ABOUT HALF THE WINS EACH',
      RANK
    )
  );

  await until(S(20) + 3.0);

  await play(
    ...scene(winsChart()),

    ...fbox([
      'Expected: 12.5 and 12.5',
      ['Observed: 2 and 23', RANK]
    ])
  );

  // ------------------------------------------------------------
  // 21. How rare is U as small as two?
  // Shuffle ten ranks into groups of five.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...scene(shuffledRanksPicture(
      OLD_RATINGS,
      'Observed allocation'
    )),

    ...fbox([
      'Under the null',
      'Group labels are exchangeable',
      ['Keep five labels of each colour', RANK]
    ], RANK),

    ...say(
      'SHUFFLE THE GROUP LABELS',
      RANK
    )
  );

  await until(S(21) + 2.5);

  await play(
    ...scene(shuffledRanksPicture(
      [1, 3, 5, 7, 9],
      'Example null allocation'
    )),

    ...fbox([
      'Same ten ranks',
      'Different group labels',
      ['Recalculate U', RANK]
    ])
  );

  await until(S(21) + 4.5);

  await play(
    ...scene(shuffledRanksPicture(
      [2, 4, 6, 8, 10],
      'Another null allocation'
    ))
  );

  await until(S(21) + 6.0);

  await play(
    ...scene(shuffledRanksPicture(
      [1, 2, 3, 4, 5],
      'An extreme allocation'
    ))
  );

  // ------------------------------------------------------------
  // 22. Exactly 252 ways to split ten ranks into five and five.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...scene(allocationGrid()),

    ...fbox([
      'Choose 5 of the 10 ranks',
      'C(10,5)',
      ['= 252 allocations', RANK]
    ], RANK),

    ...say(
      '252 EQUALLY LIKELY ALLOCATIONS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 23. Only four allocations give old U <= 2.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...scene(fourAllocationsPicture(4)),

    ...fbox([
      'Old U = 0: 1 way',
      'Old U = 1: 1 way',
      'Old U = 2: 2 ways',
      ['Total = 4 ways', NEW]
    ], NEW),

    ...say(
      'ONLY FOUR ALLOCATIONS GIVE U OF TWO OR LESS',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 24. Count the opposite direction too.
  // Eight extreme allocations out of 252.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...scene(twoTailsPicture()),

    ...fbox([
      ['Old U ≤ 2: 4 ways', NEW],
      ['New U ≤ 2: 4 ways', OLD],
      'Two-sided test',
      ['4 + 4 = 8 ways', RANK]
    ], RANK),

    ...say(
      'COUNT BOTH EQUALLY EXTREME DIRECTIONS',
      RANK
    )
  );

  await until(S(24) + 3.5);

  await play(
    ...scene(histogram({
      highlight: 'both',
      observed: true,
      tailLabels: true
    })),

    ...fbox([
      'Exact null distribution',
      ['Left tail: 4 ways', NEW],
      ['Right tail: 4 ways', OLD],
      'Total extreme: 8'
    ], RANK)
  );

  // ------------------------------------------------------------
  // 25. p approximately 0.032, below five percent.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...scene(allocationGrid('both')),

    ...fbox([
      'p = (4 + 4) / 252',
      '  = 8 / 252',
      ['  ≈ ' + PV.toFixed(3), YES]
    ], YES),

    ...say(
      'EXACT TWO-SIDED P-VALUE ≈ 0.032',
      YES
    )
  );

  await until(S(25) + 2.5);

  await play(
    ...scene(decisionPicture()),

    ...fbox([
      ['p ≈ 0.032', YES],
      'the 5% line = 0.05',
      ['0.032 < 0.05', YES]
    ], YES),

    ...say(
      'BELOW FIVE IN A HUNDRED',
      YES
    )
  );

  // ------------------------------------------------------------
  // 26. Reject the null.
  // Evidence that new-script ratings tend to be higher.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...scene(pooledPicture({
      ranks: true,
      showCrowding: true
    })),

    ...fbox([
      ['Reject the null', YES],
      'U = 2',
      'p ≈ 0.032',
      ['Ratings favour the new script', NEW]
    ], YES),

    ...say(
      'EVIDENCE THAT NEW-SCRIPT RATINGS ARE HIGHER',
      YES
    )
  );

  // ------------------------------------------------------------
  // 27. Mann–Whitney test, also Wilcoxon rank-sum test.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...scene(winCountPicture(false)),

    ...fbox([
      ['Mann–Whitney test', RANK],
      'Also called',
      ['Wilcoxon rank-sum test', RANK],
      'For two separate groups'
    ], RANK),

    ...say(
      'THE MANN–WHITNEY TEST',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 28. Shortcut: sum the old ranks.
  // 1 + 2 + 3 + 4 + 7 = 17.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...scene(pooledPicture({
      ranks: true,
      focus: 'old'
    })),

    ...fbox([
      'Rank-sum shortcut',
      ['Old ranks: 1, 2, 3, 4, 7', OLD]
    ], OLD),

    ...say(
      'SHORTCUT: ADD THE OLD RANKS',
      OLD
    )
  );

  await until(S(28) + 3.0);

  await play(
    ...scene(rankSumStacks(false)),

    ...fbox([
      'old rank sum =',
      '  1 + 2 + 3 + 4 + 7',
      ['  = 17', OLD]
    ], OLD),

    ...say(
      'OLD RANK SUM = SEVENTEEN',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 29. Subtract the smallest possible sum for five ranks.
  // 1 + 2 + 3 + 4 + 5 = 15.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...scene(rankSumStacks(true)),

    ...fbox([
      'Smallest possible rank sum',
      '1 + 2 + 3 + 4 + 5',
      ['= 15', RANK]
    ], RANK),

    ...say(
      'WHAT IS THE SMALLEST POSSIBLE RANK SUM?',
      RANK
    )
  );

  await until(S(29) + 4.0);

  await play(
    ...scene(rankShortcutPicture(false)),

    ...fbox([
      'U = observed rank sum',
      '    − minimum rank sum',
      ['U = 17 − 15', RANK]
    ], RANK),

    ...say(
      'SUBTRACT THE MINIMUM POSSIBLE SUM',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 30. Seventeen minus fifteen gives two.
  // Same U as the pairwise contest.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...scene(rankShortcutPicture(true)),

    ...fbox([
      'U = 17 − 15',
      ['U = 2', YES],
      'Same as the pairwise count'
    ], YES),

    ...say(
      'SEVENTEEN MINUS FIFTEEN = TWO',
      YES
    )
  );

  // ------------------------------------------------------------
  // 31. U measures how far the group's ranks sit above the bottom.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...scene(aboveBottomPicture()),

    ...fbox([
      'U = rank sum − lowest possible',
      '  = 17 − 15',
      ['2 places above the bottom', RANK]
    ], RANK),

    ...say(
      'HOW FAR ABOVE THE VERY BOTTOM?',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 32. Comparing separate groups when only order is trusted.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...scene(applicationGroups()),

    ...fbox([
      'Two separate groups',
      'Only the order is trusted',
      ['Compare pooled ranks', RANK]
    ], RANK),

    ...say(
      'USE WHEN ONLY THE ORDER IS TRUSTED',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 33. Ratings, rankings, skewed waiting times and incomes.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(applicationExamples()),

    ...fbox([
      'Useful for',
      'Ratings and rankings',
      'Skewed waiting times',
      'Skewed incomes'
    ]),

    ...say(
      'RATINGS, RANKINGS AND SKEWED VALUES'
    )
  );

  // ------------------------------------------------------------
  // 34. Rank cousin of Welch's t-test.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...scene(welchComparison()),

    ...fbox([
      'Welch: compares means',
      ['Mann–Whitney: uses ranks', RANK],
      'Both: two separate groups'
    ], RANK),

    ...say(
      'THE RANK VERSION OF WELCH’S T-TEST',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 35. Common trap: thinking it simply compares medians.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...scene(medianTrapPicture()),

    ...fbox([
      ['Common trap', OLD],
      'It is not just a test',
      'of equal medians'
    ], OLD),

    ...say(
      'TRAP: IT DOES NOT SIMPLY COMPARE MEDIANS',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 36. Pick one person from each group.
  // Who tends to rate higher?
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...scene(pairwiseInterpretation()),

    ...fbox([
      'Pick one from each group',
      ['Who tends to rank higher?', RANK],
      'Observed new wins: 23/25'
    ], RANK),

    ...say(
      'WHICH GROUP TENDS TO WIN THE PAIRINGS?',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 37. A median/location interpretation requires
  // the appropriate same-shape assumption.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...scene(shiftedShapePicture()),

    ...fbox([
      'Same distribution shape',
      'Different location',
      ['A median-shift interpretation', RANK]
    ], RANK),

    ...say(
      'A LOCATION COMPARISON WHEN SHAPES MATCH',
      RANK
    )
  );

  await until(S(37) + 2.1);

  await play(
    ...scene(differentShapePicture()),

    ...fbox([
      'Different distribution shapes',
      'Medians may even agree',
      ['Pairwise tendencies can differ', OLD]
    ], OLD),

    ...say(
      'DIFFERENT SHAPES CHANGE THE INTERPRETATION',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 38. Many tied values need tie-aware handling.
  // Average ranks for equal values; half wins for ties.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...scene(tiedRanksPicture(false)),

    ...fbox([
      ['Another common trap', OLD],
      'Many ratings are tied',
      'Equal values share positions'
    ], OLD),

    ...say(
      'TRAP: MANY TIED RATINGS',
      OLD
    )
  );

  await until(S(38) + 2.5);

  await play(
    ...scene(tiedRanksPicture(true)),

    ...fbox([
      'Sevens: ranks 1, 2, 3',
      ['Average rank = 2', RANK],
      'Eights: ranks 4, 5',
      ['Average rank = 4.5', RANK]
    ], RANK),

    ...say(
      'EQUAL VALUES RECEIVE AVERAGE RANKS',
      RANK
    )
  );

  await until(S(38) + 4.8);

  await play(
    ...scene(tiedPairPicture()),

    ...fbox([
      'Tied comparison: ½ win each',
      'Use tie-aware probabilities',
      ['Software handles the correction', RANK]
    ], RANK),

    ...say(
      'USE A SIGNIFICANCE METHOD THAT HANDLES TIES',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 39. Closing summary.
  // Rank two groups together and test whether one group wins
  // the pairings too often to explain by luck.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...scene(summaryPicture()),

    ...fbox([
      ['Mann–Whitney test', RANK],
      'Pool ranks; count pairwise wins',
      'U = 2',
      ['p = 8/252 ≈ 0.032', YES]
    ], YES),

    ...say(
      'POOL THE RANKS, COUNT THE WINS, TEST AGAINST LUCK',
      RANK
    )
  );

  await until(S(39) + 4.0);

  await play(
    ...scene(histogram({
      highlight: 'both',
      observed: true,
      tailLabels: true
    })),

    ...fbox([
      '25 cross-group comparisons',
      ['2 old wins; 23 new wins', NEW],
      '252 possible rank allocations',
      ['Reject: p ≈ 0.032', YES]
    ], YES),

    ...say(
      'DOES ONE GROUP WIN TOO OFTEN FOR LUCK?',
      YES
    )
  );

  await until(E(39));

  // ------------------------------------------------------------
  // IMPLEMENTATION NOTES
  // ------------------------------------------------------------
  //
  // All 40 narration beats, S(0) through S(39), are included.
  //
  // Shared chapter data:
  //
  // Old script: 1, 2, 3, 4, 7
  // New script: 5, 6, 8, 9, 10
  //
  // These are ten different customers, not paired measurements.
  //
  // Pooled ranks:
  //
  // Rank:   1  2  3  4  5  6  7  8  9  10
  // Group:  O  O  O  O  N  N  O  N  N   N
  //
  // Old rank sum = 17
  // New rank sum = 38
  // Total rank sum = 55
  //
  // All 25 old-versus-new comparisons are generated.
  //
  // The only old wins are:
  //   7 > 5
  //   7 > 6
  //
  // Old wins = 2
  // New wins = 23
  //
  // Uold = 2
  // Unew = 23
  //
  // Rank-sum shortcut:
  //
  //   Uold = Rold - nOld(nOld + 1)/2
  //        = 17 - 15
  //        = 2
  //
  // Expected U under the null:
  //
  //   nOld * nNew / 2
  //   = 25 / 2
  //   = 12.5
  //
  // All C(10,5) = 252 rank allocations are enumerated.
  //
  // Four old-rank allocations give Uold <= 2:
  //
  //   [1,2,3,4,5]  U = 0
  //   [1,2,3,4,6]  U = 1
  //   [1,2,3,4,7]  U = 2
  //   [1,2,3,5,6]  U = 2
  //
  // Their four complementary allocations give Unew <= 2.
  //
  // Exact two-sided p-value:
  //
  //   p = 8 / 252
  //     = 0.031746031746...
  //     ≈ 0.032
  //
  // Decision at alpha = 0.05:
  //   Reject the null.
  //
  // The null histogram is calculated from exact enumeration,
  // not a normal approximation or a simulation.
  //
  // This lesson uses Uold as its statistic convention.
  // Some implementations report Unew or min(Uold,Unew).
  // The two-sided significance result is unchanged here.
  //
  // The 25 pairwise contests are computational comparisons.
  // They are not 25 independently sampled matched pairs.
  //
  // The shuffle examples are illustrative label allocations.
  // Exact probabilities use the full set of 252 allocations.
  //
  // The same-median example, shifted distributions and tied
  // sevens/eights are illustrative, not additional trial data.
  //
  // Average ranks and half-win handling are demonstrated for ties.
  // The exact enumeration in this lesson applies to the supplied
  // distinct-rank dataset; tied datasets require appropriate
  // tie-aware inference.
  //
  // Within-sentence animation offsets are selected from the
  // supplied sentence timestamps, not word-level audio cues.
  //
  // Uses the supplied live-engine interface, approved reference
  // conventions, shared chapter data, and phone/laptop layouts.
  //
  // Browser execution, animation timing, and responsive rendering
  // have not been tested against the complete engine.js.
}

// lesson 7.3.8
// Wilcoxon signed-rank test.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // Exactly the same paired agent times as lesson 7.3.7.
  // ------------------------------------------------------------

  const AGENTS = [
    'A', 'B', 'C', 'D', 'E',
    'F', 'G', 'H', 'I'
  ];

  const OLD_TIME = [
    12, 15, 10, 14, 16,
    9, 18, 20, 11
  ];

  const NEW_TIME = [
    9, 11, 11, 9, 10,
    11, 11, 12, 11
  ];

  const DIFF = OLD_TIME.map(
    (v, i) => v - NEW_TIME[i]
  );

  const DATA = AGENTS.map((id, i) => ({
    id,
    old: OLD_TIME[i],
    new: NEW_TIME[i],
    diff: DIFF[i],
    size: Math.abs(DIFF[i]),
    sign: Math.sign(DIFF[i])
  }));

  const NONZERO = DATA.filter(
    d => d.diff !== 0
  );

  const ZERO = DATA.filter(
    d => d.diff === 0
  );

  const OLD = C.amber;
  const NEW = C.cyan;

  const POS = C.green;
  const NEG = C.amber;
  const TIE = C.muted;
  const RANK = C.violet;

  // ------------------------------------------------------------
  // ABSOLUTE RANKS
  // Equal absolute differences receive their average rank.
  // Zero differences are removed before ranking.
  // ------------------------------------------------------------

  function rankDifferences(records) {
    const sorted = records
      .filter(d => d.diff !== 0)
      .map(d => ({
        ...d,
        size: Math.abs(d.diff),
        sign: Math.sign(d.diff)
      }))
      .sort((a, b) => a.size - b.size);

    let i = 0;

    while (i < sorted.length) {
      let j = i + 1;

      while (
        j < sorted.length &&
        sorted[j].size === sorted[i].size
      ) {
        j++;
      }

      const firstRank = i + 1;
      const lastRank = j;

      const averageRank =
        (firstRank + lastRank) / 2;

      for (let k = i; k < j; k++) {
        sorted[k].rank = averageRank;

        sorted[k].signedRank =
          sorted[k].sign * averageRank;
      }

      i = j;
    }

    return sorted;
  }

  const RANKED = rankDifferences(NONZERO);

  const N = RANKED.length;

  const NEGATIVE_RANKS = RANKED.filter(
    d => d.sign < 0
  );

  const POSITIVE_RANKS = RANKED.filter(
    d => d.sign > 0
  );

  const W_MINUS = NEGATIVE_RANKS.reduce(
    (sum, d) => sum + d.rank,
    0
  );

  const W_PLUS = POSITIVE_RANKS.reduce(
    (sum, d) => sum + d.rank,
    0
  );

  const RANK_TOTAL = RANKED.reduce(
    (sum, d) => sum + d.rank,
    0
  );

  const EXPECTED_RANK_SUM =
    RANK_TOTAL / 2;

  const W = W_MINUS;

  // Sorted agents:
  // C, F, A, B, D, E, G, H
  //
  // Absolute differences:
  // 1, 2, 3, 4, 5, 6, 7, 8
  //
  // Signed ranks:
  // -1, -2, +3, +4, +5, +6, +7, +8
  //
  // W_MINUS = 3
  // W_PLUS = 33
  // RANK_TOTAL = 36
  // EXPECTED_RANK_SUM = 18

  // ------------------------------------------------------------
  // EXACT NULL DISTRIBUTION
  //
  // Enumerate all 2^8 possible assignments of signs to ranks.
  // Each assignment is equally likely under the independent,
  // symmetric, continuous null model used in this example.
  // ------------------------------------------------------------

  const TOTAL_PATTERNS = 2 ** N;

  const PATTERNS = [];

  for (
    let mask = 0;
    mask < TOTAL_PATTERNS;
    mask++
  ) {
    const signs = [];
    const minusRanks = [];

    let minusSum = 0;
    let plusSum = 0;

    for (let j = 0; j < N; j++) {
      const rank = RANKED[j].rank;

      const sign =
        (mask & (1 << j)) !== 0
          ? -1
          : 1;

      signs.push(sign);

      if (sign < 0) {
        minusRanks.push(rank);
        minusSum += rank;
      } else {
        plusSum += rank;
      }
    }

    PATTERNS.push({
      mask,
      signs,
      minusRanks,
      minusSum,
      plusSum
    });
  }

  const LOWER_PATTERNS = PATTERNS.filter(
    p => p.minusSum <= W_MINUS
  ).sort(
    (a, b) =>
      a.minusSum - b.minusSum ||
      a.minusRanks.length - b.minusRanks.length
  );

  const UPPER_PATTERNS = PATTERNS.filter(
    p => p.plusSum <= W_MINUS
  );

  const EXTREME_PATTERNS = PATTERNS.filter(
    p =>
      p.minusSum <= W_MINUS ||
      p.plusSum <= W_MINUS
  );

  const LOWER_COUNT = LOWER_PATTERNS.length;
  const UPPER_COUNT = UPPER_PATTERNS.length;

  const EXTREME_COUNT =
    EXTREME_PATTERNS.length;

  const ONE_TAIL =
    LOWER_COUNT / TOTAL_PATTERNS;

  const PV =
    EXTREME_COUNT / TOTAL_PATTERNS;

  const SIGN_TEST_P = 74 / 256;

  const ALPHA = 0.05;

  const HIST_COUNTS = Array.from(
    { length: RANK_TOTAL + 1 },
    (_, k) =>
      PATTERNS.filter(
        p => p.minusSum === k
      ).length
  );

  // Lower-tail patterns:
  // {}
  // {1}
  // {2}
  // {3}
  // {1,2}
  //
  // LOWER_COUNT = 5
  // UPPER_COUNT = 5
  // EXTREME_COUNT = 10
  //
  // ONE_TAIL = 5/256 = 0.01953125
  // PV = 10/256 = 0.0390625

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

  const signColor = n =>
    n > 0 ? POS : n < 0 ? NEG : TIE;

  const signed = n =>
    n > 0
      ? `+${n}`
      : String(n).replace('-', '−');

  const signSymbol = n =>
    n > 0 ? '+' : n < 0 ? '−' : '0';

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
      t.scale(
        maxw / t.getWidth()
      );
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
    radius = 0.10
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
  // Existing objects may be grouped only for removal.
  // ------------------------------------------------------------

  let picture = null;
  let boxNow = null;

  function scene(next, runTime = 0.55) {
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
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

    const indents = rows.map(([s]) =>
      cw * (
        s.length -
        s.trimStart().length
      )
    );

    const widths = texts.map((t, i) =>
      t.getWidth() + indents[i]
    );

    const wd = Math.max(...widths) + 0.70;

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
  // RECAP: NUMBER LINE OF THE EIGHT NONZERO CHANGES
  // ------------------------------------------------------------

  const LINE_LEFT = CX - 3.12;
  const LINE_RIGHT = CX + 3.12;

  const LINE_MIN = -2.65;
  const LINE_MAX = 8.65;

  const LINE_Y = P ? -1.95 : -0.75;

  const X = v =>
    LINE_LEFT +
    (v - LINE_MIN) /
      (LINE_MAX - LINE_MIN) *
      (LINE_RIGHT - LINE_LEFT);

  function differencePicture(
    focus = 'all'
  ) {
    const a = [];

    a.push(
      rect(
        (LINE_LEFT + X(0)) / 2,
        LINE_Y + 0.38,
        X(0) - LINE_LEFT,
        1.35,
        NEG,
        0.05,
        0
      ),

      rect(
        (X(0) + LINE_RIGHT) / 2,
        LINE_Y + 0.38,
        LINE_RIGHT - X(0),
        1.35,
        POS,
        0.05,
        0
      ),

      line(
        LINE_LEFT,
        LINE_Y,
        LINE_RIGHT,
        LINE_Y,
        C.muted,
        2.5
      ),

      line(
        X(0),
        LINE_Y - 0.12,
        X(0),
        LINE_Y + 1.05,
        TIE,
        1.5
      )
    );

    for (let v = -2; v <= 8; v++) {
      a.push(
        line(
          X(v),
          LINE_Y - 0.07,
          X(v),
          LINE_Y + 0.07,
          C.muted,
          1
        ),

        text(
          signed(v),
          X(v),
          LINE_Y - 0.29,
          16,
          signColor(v),
          true
        )
      );
    }

    NONZERO.forEach(d => {
      const active =
        focus === 'all' ||
        (
          focus === 'minus' &&
          d.diff < 0
        ) ||
        (
          focus === 'plus' &&
          d.diff > 0
        );

      const color = active
        ? signColor(d.diff)
        : C.muted;

      const x = X(d.diff);
      const y = LINE_Y + 0.35;

      const halo = dot(
        x,
        y,
        color,
        0.22
      );

      halo.setFill(
        color,
        active ? 0.17 : 0.035
      );

      a.push(
        halo,

        dot(
          x,
          y,
          color,
          0.115
        ),

        text(
          d.id,
          x,
          y + 0.38,
          18,
          color,
          true
        )
      );
    });

    a.push(
      text(
        'Slower',
        (LINE_LEFT + X(0)) / 2,
        LINE_Y + 1.30,
        19,
        NEG
      ),

      text(
        'Faster',
        (X(0) + LINE_RIGHT) / 2,
        LINE_Y + 1.30,
        21,
        POS
      ),

      text(
        'Minutes saved: old − new',
        CX,
        LINE_Y - 0.83,
        19,
        C.muted,
        false,
        6.5
      )
    );

    if (focus === 'minus') {
      const left = X(-2) - 0.24;
      const right = X(-1) + 0.24;

      a.push(
        rounded(
          (left + right) / 2,
          LINE_Y + 0.47,
          right - left,
          1.06,
          NEG,
          0,
          2.5
        ),

        text(
          'Only −1 and −2',
          CX,
          LINE_Y - 1.32,
          23,
          NEG,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // SIGN TEST RECAP
  // All eight signs had equal weight.
  // ------------------------------------------------------------

  function signToken(
    x, y,
    sign,
    label = null,
    radius = 0.32
  ) {
    const color = signColor(sign);

    const halo = new M.Circle({
      radius: radius + 0.07,
      color
    });

    halo.setFill(color, 0.08);
    halo.moveTo([x, y, 0]);

    const body = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.16);
    body.moveTo([x, y, 0]);

    const a = [
      halo,
      body,

      text(
        signSymbol(sign),
        x,
        y,
        29,
        color,
        true
      )
    ];

    if (label !== null) {
      a.push(
        text(
          label,
          x,
          y - radius - 0.22,
          16,
          C.ink,
          true
        )
      );
    }

    return G(a);
  }

  function signTestRecap() {
    const a = [];

    const ys = [
      P ? 0.65 : 0.57,
      P ? -0.95 : -0.65
    ];

    const groups = [
      POSITIVE_RANKS,
      NEGATIVE_RANKS
    ];

    groups.forEach((group, k) => {
      const y = ys[k];

      const color =
        k === 0 ? POS : NEG;

      a.push(
        text(
          k === 0
            ? '6 plus signs'
            : '2 minus signs',
          CX,
          y + 0.64,
          21,
          color
        )
      );

      group.forEach((d, j) => {
        const x =
          CX +
          (j - (group.length - 1) / 2) *
            0.91;

        a.push(
          signToken(
            x,
            y,
            d.sign,
            d.id,
            0.30
          )
        );
      });
    });

    a.push(
      rounded(
        CX,
        P ? -2.45 : -1.95,
        5.60,
        0.72,
        C.amber,
        0.08,
        2
      ),

      text(
        'Sign test: p ≈ 0.29',
        CX,
        P ? -2.45 : -1.95,
        24,
        C.amber,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // MAGNITUDE BARS
  // One bar per nonzero agent.
  // Negative values extend below zero, positive values above.
  // ------------------------------------------------------------

  const MAG_SP = P ? 0.78 : 0.80;

  const MAG_BASE = P ? -1.55 : -0.85;

  const MAG_SCALE = P ? 0.35 : 0.25;

  function magnitudePicture({
    focus = 'all',
    sorted = false,
    ignoreSign = false
  } = {}) {
    const a = [];

    const records = sorted
      ? RANKED
      : NONZERO;

    a.push(
      line(
        CX - 3.20,
        MAG_BASE,
        CX + 3.20,
        MAG_BASE,
        C.muted,
        2
      )
    );

    records.forEach((d, i) => {
      const x =
        CX + (i - 3.5) * MAG_SP;

      const active =
        focus === 'all' ||
        (
          focus === 'minus' &&
          d.diff < 0
        ) ||
        (
          focus === 'plus' &&
          d.diff > 0
        );

      const color =
        !active
          ? C.muted
          : ignoreSign
            ? RANK
            : signColor(d.diff);

      const v = ignoreSign
        ? Math.abs(d.diff)
        : d.diff;

      const h = Math.abs(v) * MAG_SCALE;

      const y =
        MAG_BASE +
        Math.sign(v) * h / 2;

      a.push(
        rect(
          x,
          y,
          0.53,
          h,
          color,
          active ? 0.80 : 0.18,
          1.2
        ),

        rect(
          x,
          y,
          0.65,
          h + 0.055,
          color,
          active ? 0.10 : 0.015,
          0
        ),

        text(
          ignoreSign
            ? Math.abs(v)
            : signed(v),
          x,
          MAG_BASE +
            Math.sign(v) *
              (h + 0.24),
          18,
          color,
          true
        ),

        text(
          d.id,
          x,
          P ? -3.0 : -2.10,
          17,
          C.ink,
          true
        )
      );
    });

    a.push(
      text(
        ignoreSign
          ? 'Absolute change in minutes'
          : 'Minutes saved by each agent',
        CX,
        P ? -3.55 : -2.60,
        19,
        C.muted,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SORTABLE DIFFERENCE CARDS
  // Each card preserves the original agent identity.
  // ------------------------------------------------------------

  const SORT_SP = P ? 0.80 : 0.81;

  const SORT_BASE = P ? -2.35 : -1.80;

  const SORT_SCALE = P ? 0.43 : 0.34;

  const SORT_W = 0.56;

  const sx = i =>
    CX + (i - 3.5) * SORT_SP;

  function sizeCard(
    d,
    slot,
    {
      signedValue = true,
      rankVisible = false,
      rankOnly = false,
      overrideSize = null,
      uniformHeight = false
    } = {}
  ) {
    const x = sx(slot);

    const magnitude =
      overrideSize === null
        ? Math.abs(d.diff)
        : overrideSize;

    const displayHeight = uniformHeight
      ? 1.0
      : magnitude * SORT_SCALE;

    const h = Math.min(
      displayHeight,
      P ? 3.55 : 2.80
    );

    const color = signedValue
      ? signColor(d.diff)
      : RANK;

    const value = rankOnly
      ? d.rank
      : signedValue
        ? signed(d.diff)
        : magnitude;

    const a = [];

    a.push(
      rect(
        x,
        SORT_BASE + h / 2,
        SORT_W + 0.10,
        h + 0.07,
        color,
        0.09,
        0
      ),

      rect(
        x,
        SORT_BASE + h / 2,
        SORT_W,
        h,
        color,
        0.77,
        1.3
      ),

      text(
        value,
        x,
        SORT_BASE + h + 0.24,
        20,
        color,
        true,
        SORT_SP - 0.03
      ),

      text(
        d.id,
        x,
        SORT_BASE - 0.27,
        18,
        C.ink,
        true
      )
    );

    if (rankVisible) {
      a.push(
        rounded(
          x,
          SORT_BASE - 0.78,
          0.55,
          0.44,
          RANK,
          0.15,
          1.5
        ),

        text(
          d.rank,
          x,
          SORT_BASE - 0.78,
          20,
          RANK,
          true
        )
      );
    }

    return G(a);
  }

  function sortingAxes(
    rankVisible = false
  ) {
    return G(
      line(
        CX - 3.20,
        SORT_BASE,
        CX + 3.20,
        SORT_BASE,
        C.muted,
        2
      ),

      text(
        'Smallest size  →  Largest size',
        CX,
        rankVisible
          ? SORT_BASE - 1.27
          : SORT_BASE - 0.80,
        18,
        RANK,
        false,
        6.5
      )
    );
  }

  // ------------------------------------------------------------
  // RANK ROW
  // The numerical size is replaced by ordinal position.
  // ------------------------------------------------------------

  function rankCard(
    d,
    slot,
    {
      restoreSign = false,
      showSize = true,
      active = true,
      overrideSize = null
    } = {}
  ) {
    const x = sx(slot);

    const y = P ? -0.45 : -0.20;

    const color =
      !active
        ? C.muted
        : restoreSign
          ? signColor(d.diff)
          : RANK;

    const size =
      overrideSize === null
        ? Math.abs(d.diff)
        : overrideSize;

    const w = 0.66;
    const h = P ? 1.32 : 1.20;

    const a = [];

    a.push(
      text(
        d.id,
        x,
        y + h / 2 + 0.38,
        19,
        C.ink,
        true
      ),

      rounded(
        x,
        y,
        w,
        h,
        color,
        active ? 0.12 : 0.025,
        active ? 1.9 : 0.8
      ),

      text(
        restoreSign
          ? signed(d.signedRank)
          : d.rank,
        x,
        y + 0.10,
        27,
        color,
        true,
        w - 0.08
      ),

      text(
        'rank',
        x,
        y - 0.39,
        12,
        color
      )
    );

    if (showSize) {
      a.push(
        text(
          restoreSign
            ? signed(d.diff)
            : size,
          x,
          y + h / 2 + 0.88,
          19,
          restoreSign
            ? signColor(d.diff)
            : C.muted,
          true,
          SORT_SP - 0.04
        )
      );
    }

    return G(a);
  }

  function rankRow({
    restoreSign = false,
    focus = 'all',
    showSize = true
  } = {}) {
    const a = [];

    RANKED.forEach((d, i) => {
      const active =
        focus === 'all' ||
        (
          focus === 'minus' &&
          d.diff < 0
        ) ||
        (
          focus === 'plus' &&
          d.diff > 0
        );

      a.push(
        rankCard(
          d,
          i,
          {
            restoreSign,
            showSize,
            active
          }
        )
      );
    });

    a.push(
      text(
        restoreSign
          ? 'Put the original signs back'
          : 'Rank = position in the ordered line',
        CX,
        P ? -1.75 : -1.40,
        20,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SIZE AND RANK ARE DIFFERENT CONCEPTS
  // Illustrative example separate from the actual agent data.
  // ------------------------------------------------------------

  function sizeRankComparison() {
    const a = [];

    const sizes = [
      2, 5, 9, 14
    ];

    const xs = sizes.map(
      (_, i) =>
        CX + (i - 1.5) * 1.48
    );

    const base = P ? -2.15 : -1.65;

    const scale = P ? 0.23 : 0.18;

    sizes.forEach((v, i) => {
      const x = xs[i];
      const h = v * scale;

      a.push(
        rect(
          x,
          base + h / 2,
          0.80,
          h,
          C.cyan,
          0.75,
          1.5
        ),

        text(
          v,
          x,
          base + h + 0.24,
          23,
          C.cyan,
          true
        ),

        rounded(
          x,
          base - 0.56,
          0.83,
          0.54,
          RANK,
          0.12,
          1.5
        ),

        text(
          i + 1,
          x,
          base - 0.56,
          24,
          RANK,
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
        'Illustrative sizes: 2, 5, 9, 14',
        CX,
        P ? 1.48 : 1.45,
        19,
        C.cyan,
        true,
        6.4
      ),

      text(
        'Ranks: 1, 2, 3, 4',
        CX,
        base - 1.10,
        20,
        RANK,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ROBUSTNESS TO ONE WILD VALUE
  // Agent H hypothetically changes from +8 to +80 minutes.
  //
  // This does not modify the actual chapter data.
  // ------------------------------------------------------------

  function outlierRankPicture(
    wild = false
  ) {
    const a = [];

    const values = RANKED.map(d =>
      d.id === 'H' && wild
        ? 80
        : Math.abs(d.diff)
    );

    const base = P ? -2.85 : -1.65;

    // Use a common scale in both states to preserve comparison.

    const scale = P ? 0.042 : 0.030;

    RANKED.forEach((d, i) => {
      const x = sx(i);

      const value = values[i];

      const h = value * scale;

      const color =
        d.id === 'H'
          ? C.amber
          : C.cyan;

      a.push(
        rect(
          x,
          base + h / 2,
          0.54,
          h,
          color,
          0.80,
          1.2
        ),

        text(
          value,
          x,
          base + h + 0.23,
          19,
          color,
          true
        ),

        rounded(
          x,
          base - 0.49,
          0.55,
          0.43,
          RANK,
          0.12,
          1.3
        ),

        text(
          d.rank,
          x,
          base - 0.49,
          19,
          RANK,
          true
        ),

        text(
          d.id,
          x,
          base - 0.91,
          16,
          C.ink,
          true
        )
      );
    });

    a.push(
      line(
        CX - 3.18,
        base,
        CX + 3.18,
        base,
        C.muted,
        2
      ),

      text(
        wild
          ? 'Hypothetical: H saves 80 minutes'
          : 'Actual: H saves 8 minutes',
        CX,
        P ? 1.43 : 1.44,
        20,
        C.amber,
        false,
        6.5
      ),

      text(
        'H still has rank 8',
        CX,
        base - 1.34,
        22,
        RANK,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SIGNED RANK BLOCKS
  // Each small square represents one rank unit.
  // ------------------------------------------------------------

  function rankBlock(
    x, y,
    color,
    w = 0.29,
    h = 0.29,
    opacity = 0.80
  ) {
    return rect(
      x,
      y,
      w,
      h,
      color,
      opacity,
      1
    );
  }

  function rankStack(
    d,
    x,
    base,
    pitch,
    active = true
  ) {
    const a = [];

    const color = active
      ? signColor(d.diff)
      : C.muted;

    for (let j = 0; j < d.rank; j++) {
      a.push(
        rankBlock(
          x,
          base + (j + 0.5) * pitch,
          color,
          0.57,
          pitch * 0.80,
          active ? 0.83 : 0.15
        )
      );
    }

    a.push(
      text(
        signed(d.signedRank),
        x,
        base + d.rank * pitch + 0.24,
        20,
        color,
        true
      ),

      text(
        d.id,
        x,
        base - 0.28,
        17,
        C.ink,
        true
      )
    );

    return G(a);
  }

  function signedRankStacks(
    focus = 'all'
  ) {
    const a = [];

    const base = P ? -3.10 : -1.88;

    const pitch = P ? 0.48 : 0.34;

    RANKED.forEach((d, i) => {
      const active =
        focus === 'all' ||
        (
          focus === 'minus' &&
          d.sign < 0
        ) ||
        (
          focus === 'plus' &&
          d.sign > 0
        );

      a.push(
        rankStack(
          d,
          sx(i),
          base,
          pitch,
          active
        )
      );
    });

    a.push(
      line(
        CX - 3.20,
        base,
        CX + 3.20,
        base,
        C.muted,
        2
      ),

      text(
        'One block = one rank unit',
        CX,
        base - 0.77,
        18,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SUM THE MINUS AND PLUS RANKS
  // Draw individual units so the totals are visible.
  // ------------------------------------------------------------

  function rankSumPicture({
    showMinus = true,
    showPlus = true,
    expected = false
  } = {}) {
    const a = [];

    const centers = [
      CX - 1.62,
      CX + 1.62
    ];

    const cy = P ? -0.72 : -0.25;

    const panelW = 3.05;
    const panelH = P ? 3.70 : 2.75;

    const values = expected
      ? [
        EXPECTED_RANK_SUM,
        EXPECTED_RANK_SUM
      ]
      : [
        W_MINUS,
        W_PLUS
      ];

    const colors = [NEG, POS];

    values.forEach((n, k) => {
      const visible =
        k === 0 ? showMinus : showPlus;

      const color = colors[k];

      const x = centers[k];

      a.push(
        rounded(
          x,
          cy,
          panelW,
          panelH,
          color,
          0.035,
          2
        ),

        text(
          expected
            ? k === 0
              ? 'Expected minus'
              : 'Expected plus'
            : k === 0
              ? 'Minus rank sum'
              : 'Plus rank sum',
          x,
          cy + panelH / 2 - 0.30,
          20,
          color,
          false,
          panelW - 0.18
        )
      );

      if (!visible) {
        a.push(
          text(
            '?',
            x,
            cy,
            35,
            C.muted,
            true
          )
        );

        return;
      }

      const cols = 6;

      const dx = 0.38;
      const dy = P ? 0.41 : 0.285;

      const top =
        cy + panelH / 2 - 0.90;

      for (let j = 0; j < n; j++) {
        a.push(
          rankBlock(
            x +
              (j % cols - 2.5) * dx,

            top -
              Math.floor(j / cols) * dy,

            color,

            0.30,

            P ? 0.32 : 0.23,

            0.82
          )
        );
      }

      a.push(
        text(
          n,
          x,
          cy - panelH / 2 + 0.33,
          32,
          color,
          true
        )
      );
    });

    if (showMinus && showPlus) {
      a.push(
        text(
          expected
            ? '18 + 18 = 36'
            : '3 + 33 = 36',
          CX,
          cy - panelH / 2 - 0.52,
          25,
          RANK,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // MINUS RANK ADDITION: 1 + 2 = 3
  // ------------------------------------------------------------

  function minusAdditionPicture() {
    const a = [];

    const y = P ? 0.28 : 0.37;

    const xs = [
      CX - 1.78,
      CX,
      CX + 1.78
    ];

    [1, 2, 3].forEach((n, i) => {
      const x = xs[i];

      a.push(
        text(
          i === 0
            ? 'Rank 1'
            : i === 1
              ? 'Rank 2'
              : 'Sum',
          x,
          y + 0.76,
          20,
          NEG
        )
      );

      for (let j = 0; j < n; j++) {
        a.push(
          rankBlock(
            x,
            y - j * 0.45,
            NEG,
            0.56,
            0.37
          )
        );
      }

      a.push(
        text(
          n,
          x,
          y - 1.45,
          28,
          NEG,
          true
        )
      );
    });

    a.push(
      text(
        '+',
        CX - 0.89,
        y - 0.29,
        29,
        C.ink
      ),

      text(
        '=',
        CX + 0.89,
        y - 0.29,
        29,
        C.ink
      ),

      text(
        'Minus rank sum = 3',
        CX,
        y - 2.08,
        24,
        NEG,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // PLUS RANK ADDITION: 3 + 4 + 5 + 6 + 7 + 8 = 33
  // ------------------------------------------------------------

  function plusAdditionPicture() {
    const a = [];

    const base = P ? -2.65 : -1.70;
    const pitch = P ? 0.45 : 0.32;

    POSITIVE_RANKS.forEach((d, i) => {
      const x =
        CX + (i - 2.5) * 1.02;

      for (let j = 0; j < d.rank; j++) {
        a.push(
          rankBlock(
            x,
            base + (j + 0.5) * pitch,
            POS,
            0.66,
            pitch * 0.81
          )
        );
      }

      a.push(
        text(
          d.rank,
          x,
          base + d.rank * pitch + 0.24,
          22,
          POS,
          true
        ),

        text(
          d.id,
          x,
          base - 0.28,
          17,
          C.ink,
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
        '3 + 4 + 5 + 6 + 7 + 8 = 33',
        CX,
        base - 0.78,
        22,
        POS,
        true,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // RANK-SUM COMPARISON
  // Hollow = expected. Glowing = observed.
  // ------------------------------------------------------------

  function rankSumChart({
    expected = true,
    observed = true
  } = {}) {
    const a = [];

    const base = P ? -3.20 : -1.90;

    const scale = P ? 0.125 : 0.085;

    const xs = [
      CX - 1.55,
      CX + 1.55
    ];

    const values = [
      W_MINUS,
      W_PLUS
    ];

    const colors = [NEG, POS];

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

    [9, 18, 27, 36].forEach(v => {
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

    values.forEach((n, k) => {
      const color = colors[k];
      const center = xs[k];

      if (expected) {
        const x =
          observed ? center - 0.47 : center;

        const h =
          EXPECTED_RANK_SUM * scale;

        a.push(
          rect(
            x,
            base + h / 2,
            0.82,
            h,
            color,
            0,
            2.5
          ),

          text(
            18,
            x,
            base + h + 0.23,
            22,
            color,
            true
          )
        );
      }

      if (observed) {
        const x =
          expected ? center + 0.47 : center;

        const h = n * scale;

        a.push(
          rect(
            x,
            base + h / 2,
            0.97,
            h + 0.07,
            color,
            0.11,
            0
          ),

          rect(
            x,
            base + h / 2,
            0.82,
            h,
            color,
            0.85,
            1.3
          ),

          text(
            n,
            x,
            base + h + 0.24,
            27,
            color,
            true
          )
        );
      }

      a.push(
        text(
          k === 0 ? 'Minus ranks' : 'Plus ranks',
          center,
          base - 0.35,
          19,
          color
        )
      );
    });

    if (expected && observed) {
      const y = base - 0.83;

      a.push(
        rect(
          CX - 2.35,
          y,
          0.22,
          0.22,
          C.muted,
          0
        ),

        text(
          'Expected',
          CX - 1.32,
          y,
          16,
          C.muted
        ),

        rect(
          CX + 0.35,
          y,
          0.22,
          0.22,
          RANK,
          0.80,
          1
        ),

        text(
          'Observed',
          CX + 1.40,
          y,
          16,
          C.ink
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // SYMMETRIC NULL MODEL
  // The distribution of changes is symmetric around zero.
  //
  // This is a conceptual null picture, not a density fitted
  // to the eight observed changes.
  // ------------------------------------------------------------

  function symmetryPicture({
    skewed = false,
    showMirror = true,
    nullLabel = true
  } = {}) {
    const a = [];

    const base = P ? -2.55 : -1.75;

    const w = 6.20;

    const left = CX - w / 2;

    const xx = v =>
      left + (v + 5) / 10 * w;

    const yy = h =>
      base + h;

    const bins = skewed
      ? [0, 1, 5, 9, 7, 4, 3, 2, 1, 1, 0]
      : [0, 1, 3, 6, 8, 10, 8, 6, 3, 1, 0];

    const pitch = P ? 0.34 : 0.24;

    a.push(
      line(
        left,
        base,
        left + w,
        base,
        C.muted,
        2
      ),

      dashed(
        CX,
        base - 0.08,
        CX,
        base + 10 * pitch + 0.26,
        RANK
      )
    );

    bins.forEach((n, i) => {
      const v = i - 5;

      const color = v < 0
        ? NEG
        : v > 0
          ? POS
          : RANK;

      for (let j = 0; j < n; j++) {
        const y =
          base + (j + 0.5) * pitch;

        const halo = dot(
          xx(v),
          y,
          color,
          P ? 0.17 : 0.13
        );

        halo.setFill(color, 0.11);

        a.push(
          halo,

          dot(
            xx(v),
            y,
            color,
            P ? 0.105 : 0.075
          )
        );
      }
    });

    a.push(
      text(
        '0',
        CX,
        base - 0.31,
        20,
        RANK,
        true
      ),

      text(
        'Negative changes',
        CX - 1.68,
        base - 0.77,
        18,
        NEG
      ),

      text(
        'Positive changes',
        CX + 1.68,
        base - 0.77,
        18,
        POS
      )
    );

    if (showMirror && !skewed) {
      const h =
        Math.min(
          1.42,
          pitch * 4.5
        );

      [-2, -1].forEach(v => {
        a.push(
          line(
            xx(v),
            yy(h),
            xx(-v),
            yy(h),
            RANK,
            1.3
          )
        );
      });

      a.push(
        text(
          'Mirror symmetry',
          CX,
          P ? 1.34 : 1.40,
          22,
          RANK
        )
      );
    }

    if (skewed) {
      a.push(
        text(
          'Asymmetric shape',
          CX,
          P ? 1.40 : 1.40,
          22,
          C.amber
        )
      );
    }

    if (nullLabel && !skewed) {
      a.push(
        text(
          'If the null is true',
          CX,
          P ? -4.05 : -2.77,
          16,
          C.muted,
          false,
          6.4
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // FAIR SIGN COIN FOR A FIXED RANK
  // The rank magnitude stays fixed; only its sign changes.
  // ------------------------------------------------------------

  function rankCoin(
    x, y,
    rank,
    sign = null,
    radius = 0.36
  ) {
    const color =
      sign === null
        ? RANK
        : signColor(sign);

    const glow = new M.Circle({
      radius: radius + 0.07,
      color
    });

    glow.setFill(color, 0.08);
    glow.moveTo([x, y, 0]);

    const body = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.15);
    body.moveTo([x, y, 0]);

    const label =
      sign === null
        ? `${rank}`
        : signed(sign * rank);

    return G(
      glow,
      body,

      text(
        label,
        x,
        y,
        25,
        color,
        true,
        radius * 1.60
      )
    );
  }

  function fairRankCoin() {
    const y = P ? 0.67 : 0.68;

    return G(
      rankCoin(
        CX,
        y,
        4,
        null,
        0.46
      ),

      text(
        'Fixed rank 4',
        CX,
        y + 0.64,
        20,
        RANK
      ),

      line(
        CX - 0.22,
        y - 0.39,
        CX - 1.62,
        y - 1.04,
        NEG,
        2
      ),

      line(
        CX + 0.22,
        y - 0.39,
        CX + 1.62,
        y - 1.04,
        POS,
        2
      ),

      rankCoin(
        CX - 1.62,
        y - 1.43,
        4,
        -1,
        0.45
      ),

      rankCoin(
        CX + 1.62,
        y - 1.43,
        4,
        1,
        0.45
      ),

      text(
        '50%',
        CX - 1.62,
        y - 2.15,
        27,
        NEG,
        true
      ),

      text(
        '50%',
        CX + 1.62,
        y - 2.15,
        27,
        POS,
        true
      ),

      text(
        'Only the sign is random',
        CX,
        y - 2.65,
        20,
        RANK
      )
    );
  }

  function eightRankCoins(
    signs = null
  ) {
    const a = [];

    const cols = 4;

    const dx = P ? 1.42 : 1.42;

    const dy = P ? 1.40 : 1.13;

    const top = P ? 0.68 : 0.75;

    RANKED.forEach((d, i) => {
      const x =
        CX +
        (i % cols - 1.5) * dx;

      const y =
        top -
        Math.floor(i / cols) * dy;

      a.push(
        rankCoin(
          x,
          y,
          d.rank,
          signs === null ? null : signs[i],
          P ? 0.40 : 0.36
        )
      );
    });

    if (signs === null) {
      a.push(
        text(
          'Eight fixed ranks, eight random signs',
          CX,
          top - dy - 0.83,
          20,
          RANK,
          false,
          6.4
        )
      );
    } else {
      const minusSum = RANKED.reduce(
        (sum, d, i) =>
          sum + (signs[i] < 0 ? d.rank : 0),
        0
      );

      const plusSum =
        RANK_TOTAL - minusSum;

      a.push(
        text(
          `Minus sum = ${minusSum}`,
          CX - 1.62,
          top - dy - 0.84,
          20,
          NEG,
          true,
          3.0
        ),

        text(
          `Plus sum = ${plusSum}`,
          CX + 1.62,
          top - dy - 0.84,
          20,
          POS,
          true,
          3.0
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // ALL 256 EQUALLY LIKELY SIGN PATTERNS
  //
  // One tile = one complete assignment of signs to ranks 1–8.
  // Patterns ordered by minus-rank sum.
  // ------------------------------------------------------------

  function patternGrid(
    highlight = 'none'
  ) {
    const a = [];

    const cols = 16;
    const rows = 16;

    const dx = 0.40;

    const dy = P ? 0.29 : 0.18;

    const top = P ? 1.02 : 1.10;

    const ordered = PATTERNS
      .slice()
      .sort(
        (a, b) =>
          a.minusSum - b.minusSum ||
          a.mask - b.mask
      );

    ordered.forEach((p, i) => {
      const x =
        CX +
        (i % cols - 7.5) * dx;

      const y =
        top -
        Math.floor(i / cols) * dy;

      const low =
        p.minusSum <= W_MINUS;

      const high =
        p.plusSum <= W_MINUS;

      const active =
        highlight === 'lower'
          ? low
          : highlight === 'both'
            ? low || high
            : false;

      const color =
        active
          ? low ? POS : NEG
          : C.muted;

      a.push(
        rounded(
          x,
          y,
          0.33,
          P ? 0.22 : 0.135,
          color,
          active ? 0.88 : 0.15,
          active ? 1.5 : 0.4,
          0.025
        )
      );
    });

    const labelY =
      top - (rows - 1) * dy - 0.48;

    const caption =
      highlight === 'lower'
        ? '5 extreme patterns out of 256'
        : highlight === 'both'
          ? '10 extreme patterns out of 256'
          : '256 equally likely sign patterns';

    a.push(
      text(
        caption,
        CX,
        labelY,
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
  // EXACT LOWER-TAIL PATTERNS
  // List each of the five assignments with minus sum <= 3.
  // ------------------------------------------------------------

  function patternRow(
    pattern,
    x,
    y,
    {
      pitch = 0.51,
      radius = 0.18,
      showSum = true
    } = {}
  ) {
    const a = [];

    pattern.signs.forEach((s, i) => {
      const xx =
        x +
        (i - 3.5) * pitch;

      const color =
        signColor(s);

      const body = new M.Circle({
        radius,
        color,
        strokeWidth: 1.2
      });

      body.setFill(
        color,
        s < 0 ? 0.22 : 0.085
      );

      body.moveTo([xx, y, 0]);

      a.push(
        body,

        text(
          signed(
            s * RANKED[i].rank
          ),
          xx,
          y,
          15,
          color,
          true,
          radius * 1.75
        )
      );
    });

    if (showSum) {
      a.push(
        text(
          pattern.minusSum,
          x + 2.75,
          y,
          24,
          NEG,
          true
        )
      );
    }

    return G(a);
  }

  function lowerPatternList(
    revealed = 5
  ) {
    const a = [];

    const top = P ? 0.81 : 0.78;

    const dy = P ? 0.92 : 0.60;

    const center = CX - 0.58;

    a.push(
      text(
        'Signed ranks',
        center,
        top + 0.60,
        20,
        RANK
      ),

      text(
        'Minus sum',
        center + 2.75,
        top + 0.60,
        17,
        NEG
      )
    );

    LOWER_PATTERNS.forEach((p, i) => {
      const y = top - i * dy;

      a.push(
        rounded(
          CX,
          y,
          6.42,
          P ? 0.73 : 0.51,
          i < revealed
            ? RANK
            : C.muted,
          i < revealed
            ? 0.035
            : 0.015,
          0.8
        )
      );

      if (i >= revealed) return;

      a.push(
        text(
          i + 1,
          CX - 2.91,
          y,
          16,
          C.muted,
          true
        ),

        patternRow(
          p,
          center,
          y,
          {
            pitch: 0.51,
            radius: 0.20,
            showSum: true
          }
        )
      );
    });

    a.push(
      text(
        revealed === 5
          ? 'Exactly 5 patterns have minus sum ≤ 3'
          : `${revealed} qualifying patterns so far`,
        CX,
        top - 4 * dy - 0.58,
        20,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SETS OF MINUS RANKS
  // {}, {1}, {2}, {3}, {1,2}
  // ------------------------------------------------------------

  function subsetPicture(
    both = false
  ) {
    const a = [];

    const sets = [
      'None',
      '1',
      '2',
      '3',
      '1 + 2'
    ];

    const sums = [
      0, 1, 2, 3, 3
    ];

    const centers = both
      ? [
        CX - 1.65,
        CX + 1.65
      ]
      : [CX];

    centers.forEach((center, group) => {
      const color =
        group === 0 ? NEG : POS;

      const top = P ? 0.80 : 0.85;

      const dy = P ? 0.75 : 0.56;

      const w = both ? 2.90 : 5.5;

      a.push(
        text(
          group === 0
            ? 'Minus sum ≤ 3'
            : 'Plus sum ≤ 3',
          center,
          top + 0.55,
          20,
          color,
          false,
          w
        )
      );

      sets.forEach((s, i) => {
        const y = top - i * dy;

        a.push(
          rounded(
            center,
            y,
            w,
            dy - 0.09,
            color,
            0.065,
            1.2
          ),

          text(
            s,
            center - w * 0.23,
            y,
            20,
            color,
            true,
            w * 0.44
          ),

          text(
            '→',
            center,
            y,
            19,
            C.muted
          ),

          text(
            sums[i],
            center + w * 0.26,
            y,
            22,
            color,
            true
          )
        );
      });

      a.push(
        text(
          '5 patterns',
          center,
          top - 4 * dy - 0.61,
          23,
          color,
          true
        )
      );
    });

    if (both) {
      a.push(
        text(
          '5 + 5 = 10 extreme patterns',
          CX,
          P ? -4.05 : -2.65,
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
  // EXACT WILCOXON NULL DISTRIBUTION
  // Horizontal axis: sum of negative ranks, 0 through 36.
  // Vertical heights: exact sign-pattern counts.
  // ------------------------------------------------------------

  const HIST_BASE = P ? -3.30 : -1.86;

  const HIST_H = P ? 4.10 : 2.82;

  const HIST_W = P ? 6.40 : 6.55;

  const HIST_LEFT = CX - HIST_W / 2;

  const HIST_MAX = Math.max(
    ...HIST_COUNTS
  );

  const hx = v =>
    HIST_LEFT +
    v / RANK_TOTAL * HIST_W;

  function histogram({
    highlight = 'none',
    observed = true,
    tails = false
  } = {}) {
    const a = [];

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

    const step =
      HIST_W / RANK_TOTAL;

    HIST_COUNTS.forEach((n, k) => {
      if (n === 0) return;

      const low = k <= W_MINUS;

      const high =
        k >= RANK_TOTAL - W_MINUS;

      const active =
        highlight === 'lower'
          ? low
          : highlight === 'both'
            ? low || high
            : false;

      const color =
        active
          ? low ? POS : NEG
          : RANK;

      const x = hx(k);

      const h =
        n / HIST_MAX * HIST_H;

      a.push(
        rect(
          x,
          HIST_BASE + h / 2,
          step * 0.90,
          h,
          color,
          active ? 0.95 : 0.65,
          active ? 1.5 : 0.6
        )
      );
    });

    [0, 3, 9, 18, 27, 33, 36]
      .forEach(v => {
        const color =
          v === W_MINUS
            ? POS
            : v === RANK_TOTAL - W_MINUS
              ? NEG
              : C.muted;

        a.push(
          line(
            hx(v),
            HIST_BASE - 0.06,
            hx(v),
            HIST_BASE + 0.06,
            C.muted,
            1
          ),

          text(
            v,
            hx(v),
            HIST_BASE - 0.29,
            15,
            color,
            true
          )
        );
      });

    a.push(
      text(
        'Minus rank sum',
        CX,
        HIST_BASE - 0.78,
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

    if (observed) {
      const y =
        HIST_BASE + HIST_H * 0.47;

      a.push(
        dashed(
          hx(W_MINUS),
          HIST_BASE,
          hx(W_MINUS),
          y,
          POS
        ),

        text(
          'ours: 3',
          hx(W_MINUS) + 0.5,
          y + 0.23,
          20,
          POS,
          true
        )
      );
    }

    if (tails) {
      a.push(
        text(
          '5 ways',
          hx(3) + 0.14,
          HIST_BASE + HIST_H * 0.72,
          17,
          POS,
          true
        ),

        text(
          '5 ways',
          hx(33) - 0.14,
          HIST_BASE + HIST_H * 0.72,
          17,
          NEG,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // P-VALUE DECISION
  // Exact p ≈ 3.90625%, below the 5% line.
  // ------------------------------------------------------------

  function decisionPicture() {
    const a = [];

    const maxP = 0.10;

    const w = P ? 6.10 : 6.40;

    const x0 = CX - w / 2;

    const y = P ? -0.48 : -0.30;

    const px = v =>
      x0 + v / maxP * w;

    a.push(
      rect(
        px(ALPHA / 2),
        y,
        w * ALPHA / maxP,
        0.48,
        POS,
        0.22,
        0
      ),

      rect(
        px((ALPHA + maxP) / 2),
        y,
        w * (maxP - ALPHA) / maxP,
        0.48,
        C.muted,
        0.12,
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

    for (let j = 0; j <= 10; j++) {
      const v = j / 100;

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
        j === 0 ||
        j === 2 ||
        j === 5 ||
        j === 8 ||
        j === 10
      ) {
        a.push(
          text(
            `${j}%`,
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
        C.amber
      ),

      text(
        '5% cutoff',
        px(ALPHA) + 0.75,
        y + 1.20,
        19,
        C.amber
      ),

      line(
        px(PV),
        y - 0.22,
        px(PV),
        y + 0.72,
        POS,
        3
      ),

      dot(
        px(PV),
        y,
        POS,
        0.11
      ),

      text(
        'p ≈ 3.9%',
        px(PV) - 0.48,
        y + 0.96,
        24,
        POS,
        true
      ),

      text(
        'Reject',
        px(0.025),
        y - 0.94,
        22,
        POS
      ),

      text(
        'Do not reject',
        px(0.075),
        y - 0.94,
        19,
        C.muted
      ),

      text(
        'Below the 5% significance level',
        CX,
        y - 1.53,
        20,
        POS,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SAME DATA, DIFFERENT TESTS
  //
  // Sign test:
  // six positive signs versus two negative signs.
  //
  // Wilcoxon:
  // positive rank sum 33 versus negative rank sum 3.
  // ------------------------------------------------------------

  function testComparison() {
    const a = [];

    const ys = [
      P ? 0.55 : 0.60,
      P ? -2.15 : -1.52
    ];

    const names = [
      'Sign test',
      'Wilcoxon signed-rank'
    ];

    const counts = [
      [2, 6],
      [3, 33]
    ];

    const pValues = [
      SIGN_TEST_P,
      PV
    ];

    const w = 5.65;

    const left = CX - w / 2;

    names.forEach((name, r) => {
      const y = ys[r];

      const total =
        counts[r][0] + counts[r][1];

      const negW =
        w * counts[r][0] / total;

      const posW =
        w * counts[r][1] / total;

      a.push(
        text(
          name,
          CX,
          y + 0.70,
          22,
          r === 0
            ? C.muted
            : RANK
        ),

        rect(
          left + negW / 2,
          y,
          negW,
          0.52,
          NEG,
          0.75,
          1
        ),

        rect(
          left + negW + posW / 2,
          y,
          posW,
          0.52,
          POS,
          0.82,
          1
        ),

        text(
          counts[r][0],
          left + negW / 2,
          y,
          20,
          C.ink,
          true,
          negW - 0.08
        ),

        text(
          counts[r][1],
          left + negW + posW / 2,
          y,
          22,
          C.ink,
          true
        ),

        text(
          `p ≈ ${pValues[r].toFixed(
            r === 0 ? 2 : 3
          )}`,
          CX - 1.70,
          y - 0.61,
          23,
          r === 0 ? NEG : POS,
          true
        ),

        text(
          r === 0
            ? 'Do not reject'
            : 'Reject',
          CX + 1.38,
          y - 0.61,
          21,
          r === 0 ? NEG : POS
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // EQUAL VOTES VERSUS RANK WEIGHTS
  // Use actual agents C and H.
  // ------------------------------------------------------------

  function informationComparison(
    weighted = false
  ) {
    const a = [];

    const records = [
      RANKED[0],
      RANKED[RANKED.length - 1]
    ];

    const xs = [
      CX - 1.60,
      CX + 1.60
    ];

    const base = P ? -2.50 : -1.65;

    const pitch = P ? 0.40 : 0.30;

    records.forEach((d, i) => {
      const x = xs[i];

      const color =
        signColor(d.diff);

      const n = weighted
        ? d.rank
        : 1;

      a.push(
        text(
          `Agent ${d.id}`,
          x,
          P ? 1.40 : 1.40,
          22,
          C.ink
        ),

        text(
          `${signed(d.diff)} min`,
          x,
          P ? 0.91 : 0.95,
          22,
          color,
          true
        )
      );

      for (let j = 0; j < n; j++) {
        a.push(
          rankBlock(
            x,
            base + (j + 0.5) * pitch,
            color,
            1.02,
            pitch * 0.82
          )
        );
      }

      a.push(
        text(
          weighted
            ? `Rank ${d.rank}`
            : 'One sign',
          x,
          base - 0.43,
          22,
          color,
          true
        )
      );
    });

    a.push(
      line(
        CX - 3.0,
        base,
        CX + 3.0,
        base,
        C.muted,
        2
      ),

      text(
        weighted
          ? 'Larger changes now carry larger ranks'
          : 'The sign test treats both changes equally',
        CX,
        base - 1.0,
        19,
        RANK,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // GENERAL WILCOXON FORMULA
  // W = sum of ranks whose original differences are negative.
  // ------------------------------------------------------------

  function formulaPicture(
    usePlus = false
  ) {
    const a = [];

    const y = P ? 0.35 : 0.43;

    const selected = usePlus
      ? POSITIVE_RANKS
      : NEGATIVE_RANKS;

    const color = usePlus ? POS : NEG;

    RANKED.forEach((d, i) => {
      const x = sx(i);

      const active = usePlus
        ? d.sign > 0
        : d.sign < 0;

      a.push(
        rounded(
          x,
          y,
          0.65,
          0.80,
          active ? color : C.muted,
          active ? 0.17 : 0.035,
          active ? 2.5 : 0.7
        ),

        text(
          signed(d.signedRank),
          x,
          y,
          23,
          active ? color : C.muted,
          true
        )
      );
    });

    const sum = selected.reduce(
      (s, d) => s + d.rank,
      0
    );

    const expression =
      selected.map(d => d.rank)
        .join(' + ');

    a.push(
      text(
        '↓',
        CX,
        y - 0.77,
        26,
        RANK
      ),

      text(
        usePlus
          ? 'W₊ = Σ positive ranks'
          : 'W₋ = Σ negative ranks',
        CX,
        y - 1.30,
        24,
        color,
        true,
        6.5
      ),

      text(
        `${expression} = ${sum}`,
        CX,
        y - 1.91,
        25,
        color,
        true,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // TOTAL RANK SHARE
  // Show how much of the total rank lies on the minus side.
  // ------------------------------------------------------------

  function rankSharePicture() {
    const a = [];

    const w = 6.0;
    const left = CX - w / 2;

    const y = P ? -0.40 : -0.24;

    const nw =
      w * W_MINUS / RANK_TOTAL;

    const pw =
      w * W_PLUS / RANK_TOTAL;

    a.push(
      text(
        'Total available rank = 36',
        CX,
        y + 1.16,
        23,
        RANK,
        true
      ),

      rect(
        left + nw / 2,
        y,
        nw,
        0.82,
        NEG,
        0.82,
        1.5
      ),

      rect(
        left + nw + pw / 2,
        y,
        pw,
        0.82,
        POS,
        0.82,
        1.5
      ),

      text(
        '3',
        left + nw / 2,
        y,
        24,
        C.bg,
        true
      ),

      text(
        '33',
        left + nw + pw * 0.75,
        y,
        28,
        C.bg,
        true
      ),

      dashed(
        CX,
        y - 0.52,
        CX,
        y + 0.5,
        RANK
      ),

      text(
        'Fair split: 18 / 18',
        CX,
        y + 0.72,
        17,
        RANK,
        true
      ),

      line(
        left + nw / 2,
        y - 0.43,
        CX - 1.72,
        y - 0.92,
        NEG,
        1.5
      ),

      text(
        'Minus: 3',
        CX - 1.72,
        y - 1.18,
        23,
        NEG,
        true
      ),

      text(
        'Plus: 33',
        CX + 1.52,
        y - 1.18,
        23,
        POS,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // PAIRED MEASUREMENTS APPLICATION
  // Same person/item measured twice.
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

  function pairedApplication() {
    const a = [];

    const y = P ? -0.12 : -0.05;

    const left = CX - 1.58;
    const right = CX + 1.58;

    a.push(
      person(
        CX,
        y + 0.79,
        RANK,
        1.20
      ),

      text(
        'Same person',
        CX,
        y + 1.50,
        22,
        RANK
      ),

      line(
        CX - 0.24,
        y + 0.48,
        left,
        y + 0.10,
        OLD,
        2
      ),

      line(
        CX + 0.24,
        y + 0.48,
        right,
        y + 0.10,
        NEW,
        2
      ),

      rounded(
        left,
        y - 0.29,
        2.65,
        0.84,
        OLD,
        0.10
      ),

      rounded(
        right,
        y - 0.29,
        2.65,
        0.84,
        NEW,
        0.10
      ),

      text(
        'Before',
        left,
        y - 0.29,
        23,
        OLD
      ),

      text(
        'After',
        right,
        y - 0.29,
        23,
        NEW
      ),

      text(
        '↓',
        CX,
        y - 0.95,
        25,
        RANK
      ),

      rounded(
        CX,
        y - 1.50,
        5.55,
        0.70,
        RANK,
        0.08,
        1.6
      ),

      text(
        'Rank the paired change sizes',
        CX,
        y - 1.50,
        20,
        RANK,
        false,
        5.22
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // PAIRED T-TEST VERSUS SIGNED-RANK TEST
  // A conceptual comparison, not an additional hypothesis test.
  // ------------------------------------------------------------

  function pairedTestComparison() {
    const a = [];

    const ys = [
      P ? 0.55 : 0.62,
      P ? -1.85 : -1.25
    ];

    const labels = [
      'Paired t-test',
      'Wilcoxon signed-rank'
    ];

    const colors = [
      NEW,
      RANK
    ];

    labels.forEach((label, r) => {
      const y = ys[r];
      const color = colors[r];

      a.push(
        rounded(
          CX,
          y,
          6.25,
          P ? 1.50 : 1.25,
          color,
          0.045
        ),

        text(
          label,
          CX,
          y + 0.42,
          21,
          color
        )
      );

      const values = r === 0
        ? ['−1', '−2', '+3', '+8']
        : ['−1', '−2', '+3', '+8'];

      values.forEach((v, i) => {
        const x =
          CX + (i - 1.5) * 1.22;

        a.push(
          rounded(
            x,
            y - 0.20,
            0.92,
            0.55,
            color,
            0.13,
            1.2
          ),

          text(
            v,
            x,
            y - 0.20,
            22,
            color,
            true
          )
        );
      });
    });

    a.push(
      text(
        'Uses numerical differences',
        CX,
        ys[0] - (P ? 1.04 : 0.86),
        18,
        NEW
      ),

      text(
        'Uses the ranks of their sizes',
        CX,
        ys[1] - (P ? 1.04 : 0.86),
        18,
        RANK
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // MIRROR SYMMETRY EXPLANATION
  // Equal-distance points on both sides of the centre.
  // ------------------------------------------------------------

  function mirrorPicture() {
    const a = [];

    const centerY = P ? -0.45 : -0.24;

    const distances = [
      0.55, 1.10, 1.65, 2.20, 2.75
    ];

    const heights = [
      1.20, 0.92, 0.62, 0.35, 0.08
    ];

    a.push(
      dashed(
        CX,
        centerY - 0.85,
        CX,
        centerY + 1.65,
        RANK
      ),

      line(
        CX - 3.10,
        centerY - 0.75,
        CX + 3.10,
        centerY - 0.75,
        C.muted,
        2
      ),

      text(
        'Centre',
        CX,
        centerY - 1.18,
        19,
        RANK
      )
    );

    distances.forEach((d, i) => {
      const y =
        centerY + heights[i] - 0.45;

      a.push(
        dot(
          CX - d,
          y,
          NEG,
          0.12
        ),

        dot(
          CX + d,
          y,
          POS,
          0.12
        ),

        dashed(
          CX - d + 0.14,
          y,
          CX + d - 0.14,
          y,
          RANK
        )
      );
    });

    a.push(
      text(
        'Left side',
        CX - 1.62,
        centerY + 1.28,
        22,
        NEG
      ),

      text(
        'Right side',
        CX + 1.62,
        centerY + 1.28,
        22,
        POS
      ),

      text(
        'Same shape on both sides',
        CX,
        centerY - 1.80,
        21,
        RANK
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SYMMETRIC VERSUS SKEWED
  // Illustrative distributions, not observed agent data.
  // ------------------------------------------------------------

  function shapeComparison() {
    const a = [];

    const centers = [
      CX - 1.62,
      CX + 1.62
    ];

    const base = P ? -2.10 : -1.40;

    const datasets = [
      [1, 3, 5, 7, 5, 3, 1],
      [1, 7, 5, 3, 2, 1, 1]
    ];

    datasets.forEach((values, group) => {
      const center = centers[group];

      const color =
        group === 0 ? RANK : NEG;

      a.push(
        text(
          group === 0
            ? 'Symmetric'
            : 'Skewed',
          center,
          P ? 1.30 : 1.35,
          21,
          color
        ),

        line(
          center - 1.42,
          base,
          center + 1.42,
          base,
          C.muted,
          1.5
        )
      );

      values.forEach((n, i) => {
        const x =
          center +
          (i - 3) * 0.40;

        const h =
          n * (P ? 0.39 : 0.29);

        a.push(
          rect(
            x,
            base + h / 2,
            0.32,
            h,
            color,
            0.73,
            1
          )
        );
      });

      if (group === 0) {
        a.push(
          dashed(
            center,
            base,
            center,
            base + (P ? 3.0 : 2.25),
            C.ink
          )
        );
      }

      a.push(
        text(
          group === 0
            ? 'Signed-rank assumption'
            : 'Sign test is safer',
          center,
          base - 0.53,
          17,
          group === 0 ? RANK : NEG,
          false,
          3.0
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // ZERO DIFFERENCES
  // Agent I: old 11, new 11, difference 0.
  // ------------------------------------------------------------

  function zeroPicture() {
    const a = [];

    const d = ZERO[0];

    const y = P ? 0.27 : 0.37;

    a.push(
      text(
        'Agent I',
        CX,
        y + 0.83,
        23,
        TIE
      ),

      rounded(
        CX - 1.50,
        y,
        2.40,
        0.88,
        OLD,
        0.09
      ),

      rounded(
        CX + 1.50,
        y,
        2.40,
        0.88,
        NEW,
        0.09
      ),

      text(
        `${d.old} min`,
        CX - 1.50,
        y,
        27,
        OLD,
        true
      ),

      text(
        `${d.new} min`,
        CX + 1.50,
        y,
        27,
        NEW,
        true
      ),

      text(
        '=',
        CX,
        y,
        27,
        TIE
      ),

      text(
        '11 − 11 = 0',
        CX,
        y - 0.97,
        29,
        TIE,
        true
      ),

      rounded(
        CX,
        y - 1.74,
        4.65,
        0.71,
        TIE,
        0.045
      ),

      text(
        'Set zero changes aside',
        CX,
        y - 1.74,
        23,
        TIE
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // AVERAGE RANKS FOR TIED ABSOLUTE DIFFERENCES
  //
  // Illustrative sizes: 1, 2, 2, 5.
  // Ordinary positions: 1, 2, 3, 4.
  // Shared ranks: 1, 2.5, 2.5, 4.
  // ------------------------------------------------------------

  function tiedRanksPicture(
    averaged = true
  ) {
    const a = [];

    const sizes = [1, 2, 2, 5];

    const ordinary = [1, 2, 3, 4];

    const ranks = averaged
      ? [1, 2.5, 2.5, 4]
      : ordinary;

    const xs = sizes.map(
      (_, i) =>
        CX + (i - 1.5) * 1.48
    );

    const base = P ? -1.35 : -1.0;

    const scale = P ? 0.40 : 0.33;

    sizes.forEach((v, i) => {
      const x = xs[i];

      const h = v * scale;

      const tied =
        i === 1 || i === 2;

      const color =
        tied ? C.amber : RANK;

      a.push(
        rect(
          x,
          base + h / 2,
          0.88,
          h,
          color,
          0.75,
          1.4
        ),

        text(
          v,
          x,
          base + h + 0.22,
          24,
          color,
          true
        ),

        rounded(
          x,
          base - 0.52,
          0.98,
          0.56,
          color,
          0.11,
          1.5
        ),

        text(
          ranks[i],
          x,
          base - 0.52,
          24,
          color,
          true
        )
      );
    });

    a.push(
      line(
        CX - 3.05,
        base,
        CX + 3.05,
        base,
        C.muted,
        2
      ),

      text(
        'Illustrative equal sizes',
        CX,
        P ? 1.45 : 1.40,
        20,
        C.amber
      ),

      line(
        xs[1] - 0.52,
        base - 0.94,
        xs[2] + 0.52,
        base - 0.94,
        C.amber,
        2
      ),

      text(
        averaged
          ? '(2 + 3) / 2 = 2.5 each'
          : 'The tied sizes occupy places 2 and 3',
        CX,
        base - 1.40,
        22,
        C.amber,
        averaged,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FINAL SUMMARY
  // ------------------------------------------------------------

  function summaryPicture() {
    const a = [];

    const y = P ? 0.70 : 0.72;

    RANKED.forEach((d, i) => {
      const x = sx(i);

      const color =
        signColor(d.diff);

      a.push(
        rounded(
          x,
          y,
          0.66,
          0.82,
          color,
          0.14,
          1.7
        ),

        text(
          signed(d.signedRank),
          x,
          y,
          25,
          color,
          true
        ),

        text(
          d.id,
          x,
          y + 0.62,
          17,
          C.ink,
          true
        )
      );
    });

    a.push(
      text(
        'Minus sum = 3',
        CX - 1.65,
        y - 0.87,
        22,
        NEG,
        true,
        3.1
      ),

      text(
        'Plus sum = 33',
        CX + 1.65,
        y - 0.87,
        22,
        POS,
        true,
        3.1
      ),

      text(
        '↓',
        CX,
        y - 1.33,
        26,
        RANK
      ),

      text(
        '10 extreme patterns out of 256',
        CX,
        y - 1.85,
        20,
        RANK,
        true,
        6.5
      ),

      rounded(
        CX,
        y - 2.56,
        5.80,
        0.72,
        POS,
        0.10,
        2
      ),

      text(
        'p ≈ 0.039 — reject the null',
        CX,
        y - 2.56,
        23,
        POS,
        true,
        5.50
      )
    );

    return G(a);
  }

  // ============================================================
  // NARRATION BEATS
  // ============================================================

  // ------------------------------------------------------------
  // 0. Last lesson: eight agents changed their minutes per ticket.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(differencePicture()),

    ...fbox([
      'Same paired agent data',
      ['8 nonzero changes', RANK],
      'Agent I: zero excluded'
    ]),

    ...say(
      'THE SAME EIGHT NONZERO CHANGES'
    )
  );

  // ------------------------------------------------------------
  // 1. Six faster, two slower. Sign test said it could be luck.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...scene(signTestRecap()),

    ...fbox([
      ['6 faster agents', POS],
      ['2 slower agents', NEG],
      'Sign test: p ≈ 0.29',
      'Do not reject'
    ], C.amber),

    ...say(
      'LAST LESSON: THE SIGN TEST',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 2. The two slower agents changed by only one and two minutes.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...scene(differencePicture('minus')),

    ...fbox([
      ['Agent C: −1 minute', NEG],
      ['Agent F: −2 minutes', NEG],
      'The two smallest changes'
    ], C.amber),

    ...say(
      'THE TWO NEGATIVE CHANGES ARE TINY',
      NEG
    )
  );

  // ------------------------------------------------------------
  // 3. Use the sizes too, but carefully.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...scene(magnitudePicture()),

    ...fbox([
      'Keep the signs',
      ['Use the sizes carefully', RANK]
    ], RANK),

    ...say(
      'USE MORE THAN JUST THE SIGNS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 4. Step one: sort the changes by absolute size.
  // Ignore the sign temporarily.
  // ------------------------------------------------------------

  const rankedById = new Map(
    RANKED.map(d => [d.id, d])
  );

  const sortableRecords = NONZERO.map(
    d => rankedById.get(d.id)
  );

  const sizeCards = sortableRecords.map(
    (d, i) =>
      sizeCard(
        d,
        i,
        {
          signedValue: true
        }
      )
  );

  await until(S(4));

  await play(
    ...scene(sortingAxes()),

    new M.LaggedStart(
      sizeCards.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.055,
        runTime: 0.95
      }
    ),

    ...fbox([
      'Step 1',
      ['Ignore the sign', RANK],
      'Sort by absolute size'
    ], RANK),

    ...say(
      'STEP 1: ORDER BY SIZE',
      RANK
    )
  );

  await until(S(4) + 1.65);

  // Same order, sign removed (sizes only).
  const unsignedCards = sortableRecords.map(
    (d, i) => sizeCard(d, i, { signedValue: false })
  );

  await play(
    new M.FadeOut(G(...sizeCards)),
    new M.LaggedStart(
      unsignedCards.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.045,
        runTime: 0.80
      }
    )
  );

  await until(S(4) + 3.10);

  // Sorted by size: smallest on the left (C, F, A, B, D, E, G, H).
  const sortedCards = sortableRecords.map(
    d => sizeCard(
      d,
      RANKED.findIndex(r => r.id === d.id),
      { signedValue: false }
    )
  );

  await play(
    new M.FadeOut(G(...unsignedCards), { shift: [0, -0.15, 0] }),
    new M.LaggedStart(
      sortedCards.map(t => new M.FadeIn(t, { shift: [0, 0.15, 0] })),
      {
        lagRatio: 0.055,
        runTime: 1.35
      }
    ),

    ...say(
      'SMALLEST SIZE ON THE LEFT',
      RANK
    )
  );

  sizeCards.splice(0, sizeCards.length, ...sortedCards);

  // ------------------------------------------------------------
  // 5. Sizes: 1, 2, 3, 4, 5, 6, 7, 8 minutes.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...fbox([
      'Absolute differences',
      ['1, 2, 3, 4', RANK],
      ['5, 6, 7, 8', RANK],
      'Measured in minutes'
    ], RANK),

    ...say(
      'SIZES FROM ONE TO EIGHT MINUTES',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 6. Step two: replace each size by its place in the line.
  // This place is its rank.
  // ------------------------------------------------------------

  const rankLabels = RANKED.map(
    (d, i) =>
      G(
        rounded(
          sx(i),
          SORT_BASE - 0.78,
          0.55,
          0.44,
          RANK,
          0.15,
          1.5
        ),

        text(
          d.rank,
          sx(i),
          SORT_BASE - 0.78,
          20,
          RANK,
          true
        )
      )
  );

  await until(S(6));

  await play(
    ...scene(sortingAxes(true)),

    new M.LaggedStart(
      rankLabels.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.12,
        runTime: 1.55
      }
    ),

    ...fbox([
      'Step 2',
      ['Rank = position in the line', RANK],
      'Count from smallest to largest'
    ], RANK),

    ...say(
      'STEP 2: GIVE EACH SIZE A RANK',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 7. Smallest gets rank 1; biggest gets rank 8.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    new M.Indicate(
      rankLabels[0],
      {
        color: RANK,
        runTime: 0.65
      }
    ),

    ...fbox([
      'Smallest size',
      ['Rank = 1', RANK],
      'Largest size',
      ['Rank = 8', RANK]
    ], RANK),

    ...say(
      'SMALLEST = RANK 1',
      RANK
    )
  );

  await until(S(7) + 1.7);

  await play(
    new M.Indicate(
      rankLabels[7],
      {
        color: RANK,
        runTime: 0.65
      }
    ),

    ...say(
      'LARGEST = RANK 8',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 8. Here, size and rank happen to agree.
  // Usually they differ.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    new M.FadeOut(
      new M.VGroup(
        ...sizeCards,
        ...rankLabels
      )
    ),

    ...scene(rankRow({
      restoreSign: false
    })),

    ...fbox([
      'In our data',
      'Sizes: 1 through 8',
      ['Ranks: 1 through 8', RANK],
      'This is a coincidence'
    ], RANK),

    ...say(
      'HERE, SIZE HAPPENS TO EQUAL RANK',
      RANK
    )
  );

  await until(S(8) + 2.8);

  await play(
    ...scene(sizeRankComparison()),

    ...fbox([
      'Illustrative example',
      'Sizes: 2, 5, 9, 14',
      ['Ranks: 1, 2, 3, 4', RANK]
    ]),

    ...say(
      'USUALLY, RANK AND SIZE DIFFER',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 9. Ranks resist wild values.
  // H hypothetically saves 80 instead of 8.
  // Its rank remains 8.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...scene(outlierRankPicture(false)),

    ...fbox([
      'Actual Agent H',
      ['Size = 8 minutes', NEW],
      ['Rank = 8', RANK]
    ]),

    ...say(
      'WHY USE RANKS?',
      RANK
    )
  );

  await until(S(9) + 3.0);

  await play(
    ...scene(outlierRankPicture(true)),

    ...fbox([
      'Hypothetical Agent H',
      ['Size = 80 minutes', C.amber],
      ['Rank still = 8', RANK]
    ], RANK),

    ...say(
      'A WILD VALUE DOES NOT GET A WILD RANK',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 10. Step three: restore each original sign.
  // ------------------------------------------------------------

  const signedCards = RANKED.map(
    (d, i) =>
      rankCard(
        d,
        i,
        {
          restoreSign: false,
          showSize: false
        }
      )
  );

  await until(S(10));

  await play(
    ...scene(null),

    ...signedCards.map(t =>
      new M.FadeIn(
        t,
        { runTime: 0.30 }
      )
    ),

    ...fbox([
      'Step 3',
      ['Restore the original sign', RANK]
    ], RANK),

    ...say(
      'STEP 3: PUT THE SIGNS BACK',
      RANK
    )
  );

  await until(S(10) + 1.05);

  await play(
    new M.LaggedStart(
      signedCards.map((t, i) =>
        new M.Transform(
          t,
          rankCard(
            RANKED[i],
            i,
            {
              restoreSign: true,
              showSize: false
            }
          )
        )
      ),
      {
        lagRatio: 0.065,
        runTime: 0.95
      }
    )
  );

  // ------------------------------------------------------------
  // 11. Minus changes have ranks 1 and 2.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    new M.FadeOut(
      new M.VGroup(...signedCards)
    ),

    ...scene(rankRow({
      restoreSign: true,
      focus: 'minus'
    })),

    ...fbox([
      ['Agent C: −1 → rank 1', NEG],
      ['Agent F: −2 → rank 2', NEG],
      'Both ranks carry minus signs'
    ], NEG),

    ...say(
      'MINUS RANKS: ONE AND TWO',
      NEG
    )
  );

  // ------------------------------------------------------------
  // 12. Plus ranks: 3, 4, 5, 6, 7, 8.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...scene(rankRow({
      restoreSign: true,
      focus: 'plus'
    })),

    ...fbox([
      ['Plus ranks', POS],
      '+3, +4, +5',
      '+6, +7, +8'
    ], POS),

    ...say(
      'PLUS RANKS: THREE THROUGH EIGHT',
      POS
    )
  );

  await until(S(12) + 2.6);

  await play(
    ...scene(signedRankStacks())
  );

  // ------------------------------------------------------------
  // 13. Step four: sum the minus ranks.
  // 1 + 2 = 3.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...scene(minusAdditionPicture()),

    ...fbox([
      'Step 4: add ranks',
      ['minus ranks: 1 + 2', NEG],
      ['    = 3', NEG]
    ], NEG),

    ...say(
      'STEP 4: ADD THE MINUS RANKS',
      NEG
    )
  );

  // ------------------------------------------------------------
  // 14. Sum the plus ranks.
  // 3 + 4 + 5 + 6 + 7 + 8 = 33.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...scene(plusAdditionPicture()),

    ...fbox([
      'Plus rank sum',
      ['3 + 4 + 5', POS],
      ['+ 6 + 7 + 8', POS],
      ['= 33', POS]
    ], POS),

    ...say(
      'ADD THE PLUS RANKS: THIRTY-THREE',
      POS
    )
  );

  await until(S(14) + 3.5);

  await play(
    ...scene(rankSumPicture({
      showMinus: true,
      showPlus: true
    }))
  );

  // ------------------------------------------------------------
  // 15. Total rank = 36. Expected fair split = 18 each.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...fbox([
      'All ranks together',
      ['1 + 2 + ... + 8 = 36', RANK],
      '3 + 33 = 36'
    ], RANK),

    ...say(
      'TOTAL AVAILABLE RANK = 36',
      RANK
    )
  );

  await until(S(15) + 2.5);

  await play(
    ...scene(rankSumPicture({
      expected: true
    })),

    ...fbox([
      'Under a fair split',
      ['36 ÷ 2 = 18', RANK],
      '18 expected on each side'
    ], RANK),

    ...say(
      'FAIR EXPECTATION: EIGHTEEN EACH',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 16. Observed minus sum is only three.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...scene(rankSumChart({
      expected: true,
      observed: true
    })),

    ...fbox([
      'Expected: 18 and 18',
      ['Observed minus: 3', NEG],
      ['Observed plus: 33', POS]
    ]),

    ...say(
      'OUR RANK SUMS ARE VERY LOPSIDED',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 17. Null hypothesis: changes symmetric around zero.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...scene(symmetryPicture({
      skewed: false,
      showMirror: false
    })),

    ...fbox([
      'Null hypothesis',
      'Changes centred at zero',
      ['Symmetric change distribution', RANK]
    ], RANK),

    ...say(
      'NULL: NO SYSTEMATIC CHANGE',
      RANK
    )
  );

  await until(S(17) + 3.8);

  await play(
    ...scene(symmetryPicture({
      skewed: false,
      showMirror: true
    })),

    ...fbox([
      'For each change size',
      'Either direction is equally likely',
      ['Mirror symmetry around zero', RANK]
    ], RANK),

    ...say(
      'THE NULL DISTRIBUTION IS SYMMETRIC',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 18. Each rank gets a plus or minus like a fair coin.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(fairRankCoin()),

    ...fbox([
      'Keep the rank fixed',
      ['P(plus) = ½', POS],
      ['P(minus) = ½', NEG]
    ], RANK),

    ...say(
      'EACH RANK GETS A FAIR-COIN SIGN',
      RANK
    )
  );

  await until(S(18) + 2.7);

  await play(
    ...scene(eightRankCoins(null))
  );

  // ------------------------------------------------------------
  // 19. Eight coins give 256 equally likely patterns.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...scene(patternGrid()),

    ...fbox([
      '2 sign choices per rank',
      '2 × 2 × ... × 2',
      ['2⁸ = 256 patterns', RANK]
    ], RANK),

    ...say(
      '256 EQUALLY LIKELY SIGN PATTERNS',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 20. Count patterns with minus sum 3 or less.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...scene(lowerPatternList(0)),

    ...fbox([
      'Our minus sum = 3',
      'Count all possibilities',
      ['minus sum ≤ 3', NEG]
    ], RANK),

    ...say(
      'HOW MANY PATTERNS GIVE A SUM OF THREE OR LESS?',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 21. No minus, only rank 1, only rank 2.
  // Three qualifying patterns so far.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...scene(lowerPatternList(1)),

    ...fbox([
      'No minus ranks',
      ['Minus sum = 0', NEG],
      'One pattern'
    ]),

    ...say(
      'NO MINUS AT ALL'
    )
  );

  await until(S(21) + 1.85);

  await play(
    ...scene(lowerPatternList(2)),

    ...fbox([
      'Only rank 1 is negative',
      ['Minus sum = 1', NEG]
    ]),

    ...say(
      'ONLY RANK ONE IS MINUS'
    )
  );

  await until(S(21) + 3.70);

  await play(
    ...scene(lowerPatternList(3)),

    ...fbox([
      'Only rank 2 is negative',
      ['Minus sum = 2', NEG],
      'Three patterns so far'
    ]),

    ...say(
      'ONLY RANK TWO IS MINUS'
    )
  );

  // ------------------------------------------------------------
  // 22. Only rank 3, or ranks 1 and 2 together.
  // Exactly five qualifying patterns.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...scene(lowerPatternList(4)),

    ...fbox([
      'Only rank 3 is negative',
      ['Minus sum = 3', NEG],
      'Fourth qualifying pattern'
    ]),

    ...say(
      'ONLY RANK THREE IS MINUS'
    )
  );

  await until(S(22) + 2.4);

  await play(
    ...scene(lowerPatternList(5)),

    ...fbox([
      'Ranks 1 and 2 negative',
      ['Minus sum = 1 + 2 = 3', NEG],
      ['Exactly 5 patterns', RANK]
    ], RANK),

    ...say(
      'ONE AND TWO TOGETHER: FIVE PATTERNS IN ALL',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 23. Five out of 256.
  // Short narration beat.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...fbox([
      ['5 / 256', RANK],
      'One-tail probability',
      '≈ 0.0195'
    ], RANK),

    ...say(
      'FIVE OUT OF 256',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 24. No direction was fixed in advance.
  // Plus sum <= 3 is equally extreme.
  // Count five patterns from each side.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...scene(subsetPicture(false)),

    ...fbox([
      'One direction',
      ['Minus sum ≤ 3', NEG],
      '5 qualifying patterns'
    ]),

    ...say(
      'WE DID NOT FIX A DIRECTION IN ADVANCE',
      RANK
    )
  );

  await until(S(24) + 3.4);

  await play(
    ...scene(subsetPicture(true)),

    ...fbox([
      ['Minus sum ≤ 3: 5', NEG],
      ['Plus sum ≤ 3: 5', POS],
      'Both are equally extreme',
      ['Total = 10 patterns', RANK]
    ], RANK),

    ...say(
      'COUNT BOTH DIRECTIONS',
      RANK
    )
  );

  await until(S(24) + 6.7);

  await play(
    ...scene(histogram({
      highlight: 'both',
      observed: true,
      tails: true
    })),

    ...fbox([
      'Two-sided probability',
      'p = (5 + 5) / 256',
      ['  = 10 / 256', RANK]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 25. p ≈ 0.039. Below 5%.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...scene(patternGrid('both')),

    ...fbox([
      'Exact two-sided p-value',
      'p = 10 / 256',
      ['  ≈ ' + PV.toFixed(3), POS]
    ], POS),

    ...say(
      'EXACT P-VALUE ≈ 0.039',
      POS
    )
  );

  await until(S(25) + 2.7);

  await play(
    ...scene(decisionPicture()),

    ...fbox([
      ['p ≈ 0.039', POS],
      'Significance level = 0.05',
      ['0.039 < 0.05', POS]
    ], POS),

    ...say(
      'BELOW FIVE IN A HUNDRED',
      POS
    )
  );

  // ------------------------------------------------------------
  // 26. Reject the null.
  // Evidence that the new script makes agents faster.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...scene(rankSumPicture()),

    ...fbox([
      ['Reject the null', POS],
      'Minus sum = 3',
      'Plus sum = 33',
      ['Evidence of faster handling', POS]
    ], POS),

    ...say(
      'THIS TIME, REJECT THE NULL',
      POS
    )
  );

  // ------------------------------------------------------------
  // 27. Same data, different answer.
  // Tiny minus counted as much as a big plus in the sign test.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...scene(testComparison()),

    ...fbox([
      ['Sign test: p ≈ 0.29', NEG],
      ['Signed-rank: p ≈ 0.039', POS],
      'Same eight changes'
    ]),

    ...say(
      'SAME DATA, DIFFERENT ANSWER',
      RANK
    )
  );

  await until(S(27) + 3.1);

  await play(
    ...scene(informationComparison(false)),

    ...fbox([
      'Sign test',
      '−1 and +8 get equal weight',
      ['Magnitude information is lost', C.amber]
    ], C.amber)
  );

  await until(S(27) + 5.0);

  await play(
    ...scene(informationComparison(true)),

    ...fbox([
      'Signed-rank test',
      '−1 receives rank 1',
      ['+8 receives rank 8', POS]
    ], RANK),

    ...say(
      'RANKS PRESERVE INFORMATION ABOUT SIZE',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 28. Wilcoxon signed-rank test.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...scene(signedRankStacks()),

    ...fbox([
      ['Wilcoxon signed-rank test', RANK],
      'Rank the change sizes',
      'Restore their signs',
      'Compare the rank sums'
    ], RANK),

    ...say(
      'THE WILCOXON SIGNED-RANK TEST',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 29. Formula: sum ranks of minus changes.
  // Some books use the plus side.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...scene(formulaPicture(false)),

    ...fbox([
      ['W = Σ negative ranks', RANK],
      'W = 1 + 2',
      ['W = 3', NEG]
    ], RANK),

    ...say(
      'W = THE SUM OF THE MINUS RANKS',
      RANK
    )
  );

  await until(S(29) + 4.0);

  await play(
    ...scene(formulaPicture(true)),

    ...fbox([
      'Alternative convention',
      ['W₊ = Σ positive ranks', POS],
      'W₊ = 33',
      'W₋ + W₊ = 36'
    ], RANK),

    ...say(
      'THE PLUS SIDE TELLS THE SAME STORY',
      POS
    )
  );

  // ------------------------------------------------------------
  // 30. How much of the total rank lies on the minus side?
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...scene(rankSharePicture()),

    ...fbox([
      'Total rank = 36',
      ['Minus side = 3', NEG],
      ['Plus side = 33', POS]
    ]),

    ...say(
      'HOW MUCH RANK SITS ON THE MINUS SIDE?',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 31. Paired measurements, when ordering sizes is trustworthy.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...scene(pairedApplication()),

    ...fbox([
      'Paired measurements',
      'Same person or item twice',
      ['Trust the ordering of sizes', RANK]
    ], RANK),

    ...say(
      'USE WHEN THE ORDER OF CHANGE SIZES IS TRUSTED',
      RANK
    )
  );

  await until(S(31) + 3.3);

  await play(
    ...scene(sizeRankComparison()),

    ...fbox([
      'Bigger changes get bigger ranks',
      'Exact distances are not used',
      ['Order matters more than size', RANK]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 32. Rank cousin of the paired t-test.
  // A single wild magnitude cannot dominate through its size.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...scene(pairedTestComparison()),

    ...fbox([
      'Paired t-test',
      'Uses numerical differences',
      ['Wilcoxon uses ranked sizes', RANK]
    ]),

    ...say(
      'THE RANK COUSIN OF THE PAIRED T-TEST',
      RANK
    )
  );

  await until(S(32) + 3.2);

  await play(
    ...scene(outlierRankPicture(true)),

    ...fbox([
      'Illustrative extreme value',
      'Size increases from 8 to 80',
      ['Rank remains 8', RANK]
    ], RANK),

    ...say(
      'ONE WILD MAGNITUDE HAS LIMITED INFLUENCE',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 33. Common trap: assuming symmetry does not matter.
  // The test assumes symmetric differences around their centre.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(symmetryPicture({
      skewed: false,
      showMirror: true,
      nullLabel: false
    })),

    ...fbox([
      ['Important assumption', C.amber],
      'Paired differences',
      'Symmetric around their centre'
    ], C.amber),

    ...say(
      'TRAP: IGNORING THE SYMMETRY ASSUMPTION',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 34. Symmetry means left is a mirror of right.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...scene(mirrorPicture()),

    ...fbox([
      'Symmetric distribution',
      ['Left mirrors right', RANK],
      'Around the centre'
    ], RANK),

    ...say(
      'SYMMETRIC MEANS MIRROR-SHAPED',
      RANK
    )
  );

  // ------------------------------------------------------------
  // 35. With asymmetric changes, interpretation is less clear.
  // The sign test is safer for a directional question.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...scene(symmetryPicture({
      skewed: true,
      showMirror: false,
      nullLabel: false
    })),

    ...fbox([
      ['Asymmetric differences', C.amber],
      'Signed-rank interpretation',
      'Becomes less straightforward'
    ], C.amber),

    ...say(
      'WATCH OUT FOR VERY SKEWED CHANGES',
      C.amber
    )
  );

  await until(S(35) + 3.6);

  await play(
    ...scene(shapeComparison()),

    ...fbox([
      'Strongly asymmetric changes?',
      'Only trust direction?',
      ['Prefer the sign test', RANK]
    ], C.amber),

    ...say(
      'THE SIGN TEST IS SAFER WITHOUT SYMMETRY',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 36. Drop zero changes. Equal sizes share average ranks.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...scene(zeroPicture()),

    ...fbox([
      'Zero differences',
      'Agent I: 11 − 11 = 0',
      ['Set aside before ranking', TIE]
    ]),

    ...say(
      'ZERO CHANGES ARE SET ASIDE',
      TIE
    )
  );

  await until(S(36) + 1.8);

  await play(
    ...scene(tiedRanksPicture(false)),

    ...fbox([
      'Illustrative tied sizes',
      'Sizes: 1, 2, 2, 5',
      'The two 2s occupy ranks 2 and 3'
    ], C.amber),

    ...say(
      'EQUAL SIZES SHARE THEIR RANKS',
      C.amber
    )
  );

  await until(S(36) + 3.2);

  await play(
    ...scene(tiedRanksPicture(true)),

    ...fbox([
      'Average rank',
      '(2 + 3) / 2',
      ['= 2.5 each', RANK]
    ], RANK)
  );

  // ------------------------------------------------------------
  // 37. Closing summary.
  // Rank paired change sizes and ask whether the minus
  // rank sum is unusually small under the null.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...scene(summaryPicture()),

    ...fbox([
      ['Wilcoxon signed-rank', RANK],
      'Rank sizes; restore signs',
      'W₋ = 3; W₊ = 33',
      ['p = 10/256 ≈ 0.039', POS]
    ], POS),

    ...say(
      'RANK THE SIZES, RESTORE THE SIGNS, ADD THE RANKS',
      RANK
    )
  );

  await until(S(37) + 4.3);

  await play(
    ...scene(histogram({
      highlight: 'both',
      observed: true,
      tails: true
    })),

    ...fbox([
      '8 nonzero paired changes',
      '256 possible sign patterns',
      '10 equally or more extreme',
      ['Reject: p ≈ 0.039', POS]
    ], POS),

    ...say(
      'ARE THE MINUS RANKS TOO SMALL TO EXPLAIN BY LUCK?',
      POS
    )
  );

  await until(E(37));

  // ------------------------------------------------------------
  // IMPLEMENTATION NOTES
  // ------------------------------------------------------------
  //
  // All 38 narration beats, S(0) through S(37), are included.
  //
  // Shared chapter data:
  //
  // Agent    Old    New    Difference    Rank
  //   A       12      9         +3         3
  //   B       15     11         +4         4
  //   C       10     11         -1         1
  //   D       14      9         +5         5
  //   E       16     10         +6         6
  //   F        9     11         -2         2
  //   G       18     11         +7         7
  //   H       20     12         +8         8
  //   I       11     11          0       excluded
  //
  // Zero differences are excluded before ranking.
  //
  // Ranks are computed from absolute differences, with
  // average-rank handling included for tied magnitudes.
  //
  // The eight observed nonzero magnitudes are distinct.
  //
  // Negative rank sum:
  //   W_MINUS = 1 + 2 = 3
  //
  // Positive rank sum:
  //   W_PLUS = 3 + 4 + 5 + 6 + 7 + 8 = 33
  //
  // Total rank:
  //   36
  //
  // Expected rank sum under the null:
  //   18 on each side
  //
  // All 256 sign assignments are enumerated exactly.
  //
  // Five assignments give a negative rank sum <= 3:
  //   {}
  //   {1}
  //   {2}
  //   {3}
  //   {1,2}
  //
  // Five assignments give a positive rank sum <= 3.
  //
  // Two-sided exact p-value:
  //   10 / 256
  //   = 0.0390625
  //   ≈ 0.039
  //
  // Decision at alpha = 0.05:
  //   Reject the null.
  //
  // Previous sign-test result:
  //   74 / 256 = 0.2890625
  //   Do not reject.
  //
  // The current lesson uses the negative-rank-sum convention.
  // Other conventions may use the positive rank sum or the
  // smaller of the two rank sums.
  //
  // The hypothetical +80-minute change, tied-size example,
  // and conceptual distribution shapes are illustrative.
  // They do not alter the actual chapter data.
  //
  // The exact null histogram is derived from enumeration,
  // not a normal approximation or simulated distribution.
  //
  // Within-sentence offsets are based on the supplied sentence
  // timestamps rather than word-level audio synchronization.
  //
  // Uses the supplied live-engine interface, approved reference
  // conventions, shared chapter data, and phone/laptop layouts.
  //
  // Browser execution, animation timing, and responsive rendering
  // have not been tested against the complete engine.js.
}

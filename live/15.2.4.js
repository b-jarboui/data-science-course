// lesson 15.2.4
// State values: the long-run mean discounted return from a state.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Fixed warehouse, fixed starting policy and discount factor 0.5.
// The four narrated deliveries are fixed; later deliveries are random.
// The accelerated demonstration is narration-controlled. The supplied
// engine interface does not expose a separate simulation-control API.
// Browser rendering against the complete engine has not been independently tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Chapter colours and responsive layout
  // ------------------------------------------------------------

  const WHITE = '#F4F7FC';
  const STATE = C.cyan;
  const ACTION = C.orange || '#FB923C';
  const REWARD = C.amber;
  const DOCK = C.green;
  const RETURN = C.violet;
  const DARK = '#17212F';

  // Same warehouse coordinates as the preceding chapter scene.

  const CX = P ? 0 : -2.65;
  const CY = P ? 0.48 : -0.48;
  const CELL = P ? 2.28 : 1.92;

  const GRID_W = CELL * 2;
  const GRID_H = CELL * 2;

  const PILL = P
    ? [0, 3.78, 0]
    : [0, 1.98, 0];

  const BOXP = P
    ? [0, -3.91, 0]
    : [3.95, -0.50, 0];

  const BOX_W = P
    ? Math.min(FW - 1.10, 6.75)
    : 5.20;

  const say = (s, c = STATE) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Fixed chapter data
  //
  // A  B
  // C  D
  //
  // Reward on entering D = 10.
  // Reward on every other move = 0.
  // Discount factor = 0.5.
  // D is terminal and has no future rewards.
  // ------------------------------------------------------------

  const GAMMA = 0.5;

  const NAMES = ['A', 'B', 'C', 'D'];

  const POS = {
    A: [CX - CELL / 2, CY + CELL / 2, 0],
    B: [CX + CELL / 2, CY + CELL / 2, 0],
    C: [CX - CELL / 2, CY - CELL / 2, 0],
    D: [CX + CELL / 2, CY - CELL / 2, 0]
  };

  const TRANSITIONS = {
    A: { right: 'B', down: 'C' },
    B: { left: 'A', down: 'D' },
    C: { up: 'A', right: 'D' },
    D: {}
  };

  const POLICY = {
    A: [
      { action: 'right', probability: 0.5 },
      { action: 'down', probability: 0.5 }
    ],

    B: [
      { action: 'left', probability: 0.5 },
      { action: 'down', probability: 0.5 }
    ],

    C: [
      { action: 'up', probability: 0 },
      { action: 'right', probability: 1 }
    ],

    D: []
  };

  // Exact values are used only by the explanatory visuals.
  // The Monte Carlo estimator below uses observed returns alone.

  const TRUE_VALUES = {
    A: 4,
    B: 6,
    C: 10,
    D: 0
  };

  const SHORT_ROUTE = ['A', 'B', 'D'];
  const OTHER_SHORT_ROUTE = ['A', 'C', 'D'];
  const LONG_ROUTE = ['A', 'B', 'A', 'C', 'D'];

  const FIXED_DELIVERIES = [
    SHORT_ROUTE,
    OTHER_SHORT_ROUTE,
    LONG_ROUTE,
    SHORT_ROUTE
  ];

  let state = null;
  let route = [];
  let rewards = [];
  let terminated = false;

  // The earlier introductory deliveries are demonstrations.
  // These records begin with the four-delivery estimate at beat 25.

  const observedReturns = [];
  const meanHistory = [];

  let sumReturns = 0;

  function rewardFor(nextState) {
    return nextState === 'D' ? 10 : 0;
  }

  function actionBetween(from, to) {
    const action = Object.keys(TRANSITIONS[from]).find(
      a => TRANSITIONS[from][a] === to
    );

    if (!action) {
      throw new Error(
        `Invalid move: ${from} → ${to}`
      );
    }

    return action;
  }

  function probabilityOf(s, action) {
    const entry = POLICY[s].find(
      item => item.action === action
    );

    return entry
      ? entry.probability
      : 0;
  }

  function discountedReturn(values) {
    return values.reduce(
      (sum, reward, i) =>
        sum + Math.pow(GAMMA, i) * reward,
      0
    );
  }

  function returnForRoute(cells) {
    return discountedReturn(
      cells.slice(1).map(rewardFor)
    );
  }

  function meanReturn() {
    return observedReturns.length
      ? sumReturns / observedReturns.length
      : null;
  }

  function recordReturn(value) {
    observedReturns.push(value);
    sumReturns += value;

    const mean = meanReturn();

    meanHistory.push({
      n: observedReturns.length,
      mean
    });

    return mean;
  }

  function fmt(value, digits = 4) {
    return Number(
      value.toFixed(digits)
    ).toString();
  }

  function pct(value) {
    return `${Math.round(value * 100)}%`;
  }

  // ------------------------------------------------------------
  // Fresh independent deliveries under the fixed policy
  //
  // No true state values are consulted.
  // No route lengths or returns are selected to force convergence.
  // Each new action is sampled from the current state's policy.
  // ------------------------------------------------------------

  // Seeded generator: the same simulated deliveries on laptop and phone, every time.
  let seed = 20261127;
  function rng() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function sampleAction(s) {
    const choices = POLICY[s];

    if (!choices.length) {
      throw new Error(
        'No actions are available in the terminal state.'
      );
    }

    const u = rng();
    let cumulative = 0;

    for (const entry of choices) {
      cumulative += entry.probability;

      if (u < cumulative) {
        return entry.action;
      }
    }

    // Floating-point fallback to the last positive-probability action.

    return choices
      .filter(entry => entry.probability > 0)
      .at(-1).action;
  }

  function sampleDelivery(start = 'A') {
    if (start === 'D') {
      throw new Error(
        'Start a delivery in A, B or C.'
      );
    }

    let s = start;

    const cells = [s];
    const observed = [];

    while (s !== 'D') {
      const action = sampleAction(s);
      const next = TRANSITIONS[s][action];

      observed.push(
        rewardFor(next)
      );

      cells.push(next);
      s = next;
    }

    return {
      cells,
      rewards: observed,
      moves: observed.length,
      value: discountedReturn(observed)
    };
  }

  function resetEstimate() {
    observedReturns.length = 0;
    meanHistory.length = 0;
    sumReturns = 0;
  }

  // ------------------------------------------------------------
  // Basic drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    maxw = Infinity,
    mono = false
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

  function block(
    x, y, w, h, color,
    fill = color,
    opacity = 1,
    strokeWidth = 1
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
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

  function dashed(
    x1, y1, x2, y2,
    color
  ) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function glow(
    x, y, radius, color
  ) {
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

    dot.setFill(color, 0.98);

    return new M.VGroup(
      halo,
      dot
    );
  }

  function arrow(
    x1, y1, x2, y2,
    color = ACTION,
    strokeWidth = 4,
    headSize = 0.13,
    broken = false
  ) {
    const angle = Math.atan2(
      y2 - y1,
      x2 - x1
    );

    const a1 = angle + Math.PI - 0.50;
    const a2 = angle + Math.PI + 0.50;

    return new M.VGroup(
      broken
        ? dashed(x1, y1, x2, y2, color)
        : line(x1, y1, x2, y2, color, strokeWidth),

      line(
        x2,
        y2,
        x2 + headSize * Math.cos(a1),
        y2 + headSize * Math.sin(a1),
        color,
        strokeWidth
      ),

      line(
        x2,
        y2,
        x2 + headSize * Math.cos(a2),
        y2 + headSize * Math.sin(a2),
        color,
        strokeWidth
      )
    );
  }

  function tag(
    s, color, size, x, y,
    maxw = Infinity
  ) {
    const t = pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  // ------------------------------------------------------------
  // Replaceable on-screen objects
  //
  // Each replacement is constructed from fresh objects.
  // Existing objects are never regrouped into new VGroups.
  // ------------------------------------------------------------

  const slots = new Map();

  function replace(key, object) {
    const animations = [];

    const previous = slots.get(key);

    if (previous) {
      animations.push(
        new M.FadeOut(previous)
      );
    }

    if (object) {
      slots.set(key, object);

      animations.push(
        new M.FadeIn(object)
      );
    } else {
      slots.delete(key);
    }

    return animations;
  }

  function clear(...keys) {
    return keys.flatMap(
      key => replace(key, null)
    );
  }

  function quick(
    animations,
    duration = 0.35
  ) {
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

  function fbox(
    lines,
    color = STATE
  ) {
    const size = P ? 22 : 21;
    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(
      row => Array.isArray(row)
        ? row
        : [row, C.ink]
    );

    const texts = rows.map(
      ([s, c]) =>
        T(
          s.trimStart() || ' ',
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

    const widths = texts.map(
      (t, i) =>
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

    const ht =
      rows.length * lh + 0.48;

    const background = rect(
      BOXP[0],
      BOXP[1],
      wd,
      ht,
      color,
      C.card,
      0.97,
      0.18,
      2
    );

    const left =
      BOXP[0] - wd / 2 + 0.29;

    const top =
      BOXP[1] + ht / 2 -
      0.24 - lh / 2;

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

      let tw = t.getWidth();

      if (tw > available) {
        t.scale(available / tw);
        tw = available;
      }

      t.moveTo([
        left + indent + tw / 2,
        top - i * lh,
        0
      ]);
    });

    return replace(
      'box',
      new M.VGroup(
        background,
        ...texts
      )
    );
  }

  // ------------------------------------------------------------
  // Fixed four-cell warehouse
  // ------------------------------------------------------------

  function warehouseGrid() {
    const parts = [];

    for (const s of NAMES) {
      const [x, y] = POS[s];

      parts.push(
        block(
          x,
          y,
          CELL,
          CELL,
          C.muted,
          C.card,
          0.62,
          1
        )
      );

      parts.push(
        txt(
          s,
          P ? 30 : 27,
          s === 'D' ? DOCK : C.ink,
          x - CELL / 2 + 0.29,
          y + CELL / 2 - 0.28,
          0.43,
          true
        )
      );
    }

    parts.push(
      block(
        CX,
        CY,
        GRID_W,
        GRID_H,
        C.ink,
        DARK,
        0,
        3
      ),

      line(
        CX,
        CY - GRID_H / 2,
        CX,
        CY + GRID_H / 2,
        C.muted,
        3
      ),

      line(
        CX - GRID_W / 2,
        CY,
        CX + GRID_W / 2,
        CY,
        C.muted,
        3
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Green delivery dock
  //
  // The dock does not contain a permanent reward of ten.
  // Ten is earned only on the transition into D.
  // ------------------------------------------------------------

  function dockPicture() {
    const [x, y] = POS.D;

    const boundary = rect(
      x,
      y,
      CELL - 0.10,
      CELL - 0.10,
      DOCK,
      DOCK,
      0.055,
      0.10,
      3
    );

    const bayW = CELL * 0.70;
    const bayH = CELL * 0.48;

    const left = x - bayW / 2;
    const right = x + bayW / 2;
    const bottom = y - bayH / 2;
    const top = y + bayH / 2;

    const stripes = [];

    for (let k = 0; k < 5; k++) {
      const xx =
        x + (k - 2) * CELL * 0.13;

      stripes.push(
        line(
          xx - 0.07,
          y - CELL / 2 + 0.14,
          xx + 0.07,
          y - CELL / 2 + 0.27,
          DOCK,
          2
        )
      );
    }

    return new M.VGroup(
      boundary,

      line(
        left, top,
        left, bottom,
        DOCK, 4
      ),

      line(
        left, bottom,
        right, bottom,
        DOCK, 4
      ),

      line(
        right, bottom,
        right, top,
        DOCK, 4
      ),

      txt(
        'DOCK',
        P ? 20 : 18,
        DOCK,
        x + CELL / 2 - 0.45,
        y + CELL / 2 - 0.26,
        0.66,
        true
      ),

      ...stripes
    );
  }

  // ------------------------------------------------------------
  // White delivery cart
  // ------------------------------------------------------------

  function cartPicture(
    x,
    y,
    scale = 1
  ) {
    const u =
      (P ? 1.12 : 0.98) * scale;

    const halo = circle(
      x,
      y,
      0.55 * u,
      WHITE,
      WHITE,
      0.045,
      1
    );

    const wheels = [];

    for (const dx of [-0.27, 0.27]) {
      for (const dy of [-0.28, 0.19]) {
        wheels.push(
          circle(
            x + dx * u,
            y + dy * u,
            0.105 * u,
            WHITE,
            DARK,
            1,
            2
          )
        );
      }
    }

    const floor = rect(
      x,
      y - 0.05 * u,
      0.79 * u,
      0.49 * u,
      WHITE,
      WHITE,
      0.94,
      0.10 * u,
      2
    );

    const parcel = rect(
      x - 0.09 * u,
      y + 0.14 * u,
      0.40 * u,
      0.40 * u,
      WHITE,
      '#C9D4E4',
      1,
      0.045 * u,
      1
    );

    const tape = block(
      x - 0.09 * u,
      y + 0.14 * u,
      0.09 * u,
      0.39 * u,
      '#91A2B8',
      '#91A2B8',
      0.90,
      1
    );

    const handle = new M.VGroup(
      line(
        x + 0.31 * u,
        y + 0.01 * u,
        x + 0.43 * u,
        y + 0.24 * u,
        WHITE,
        3
      ),

      line(
        x + 0.43 * u,
        y + 0.24 * u,
        x + 0.51 * u,
        y + 0.24 * u,
        WHITE,
        3
      )
    );

    return new M.VGroup(
      halo,
      ...wheels,
      floor,
      parcel,
      tape,
      handle
    );
  }

  function cartAt(s) {
    const [x, y] = POS[s];

    return cartPicture(x, y - 0.01);
  }

  function resetCart(start = 'A') {
    if (start === 'D') {
      throw new Error(
        'A new delivery cannot begin at D.'
      );
    }

    state = start;
    route = [start];
    rewards = [];
    terminated = false;

    return [
      ...clear(
        'moveArrow',
        'moveReward',
        'complete'
      ),

      ...replace(
        'cart',
        cartAt(start)
      )
    ];
  }

  // ------------------------------------------------------------
  // State highlights
  // ------------------------------------------------------------

  function stateOutline(
    s,
    color = STATE
  ) {
    const [x, y] = POS[s];

    return rect(
      x,
      y,
      CELL - 0.12,
      CELL - 0.12,
      color,
      color,
      0,
      0.10,
      4
    );
  }

  function focusState(
    s,
    color = STATE
  ) {
    return replace(
      'focus',
      stateOutline(s, color)
    );
  }

  function possibleStarts() {
    return new M.VGroup(
      ...['A', 'B', 'C'].map(
        s => stateOutline(s, STATE)
      )
    );
  }

  // ------------------------------------------------------------
  // Glowing arrows between neighbouring cells
  // ------------------------------------------------------------

  function arrowCoordinates(
    from,
    to,
    offset = 0
  ) {
    const [x1, y1] = POS[from];
    const [x2, y2] = POS[to];

    const dx = x2 - x1;
    const dy = y2 - y1;

    const distance =
      Math.hypot(dx, dy);

    const ux = dx / distance;
    const uy = dy / distance;

    const nx = -uy;
    const ny = ux;

    const inset = CELL * 0.29;

    return {
      sx: x1 + ux * inset + nx * offset,
      sy: y1 + uy * inset + ny * offset,
      ex: x2 - ux * inset + nx * offset,
      ey: y2 - uy * inset + ny * offset,
      nx,
      ny
    };
  }

  function moveArrow(
    from,
    to,
    color = ACTION,
    offset = 0,
    strokeWidth = 4,
    broken = false
  ) {
    const {
      sx, sy, ex, ey
    } = arrowCoordinates(
      from,
      to,
      offset
    );

    const parts = [];

    if (!broken) {
      const halo = line(
        sx,
        sy,
        ex,
        ey,
        color,
        strokeWidth + 5
      );

      halo.setStroke(
        color,
        strokeWidth + 5,
        0.12
      );

      parts.push(halo);
    }

    parts.push(
      arrow(
        sx,
        sy,
        ex,
        ey,
        color,
        strokeWidth,
        0.13,
        broken
      )
    );

    return new M.VGroup(...parts);
  }

  function probabilityLabel(
    from,
    to,
    probability,
    offset = 0
  ) {
    const {
      sx, sy, ex, ey,
      nx, ny
    } = arrowCoordinates(
      from,
      to,
      offset
    );

    // Horizontal move: chip just beside the arrow, on its normal side.
    // Vertical move: chip inside the source cell, right of the arrow
    // (the reward chip goes on the left), away from D / DOCK labels.
    const vertical = Math.abs(nx) > Math.abs(ny);
    const ux = ny, uy = -nx;
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;

    // A chip left of the arrow would sit on the cell letter: go deeper.
    const back = vertical && nx < 0 ? 0.64 : 0.30;

    const px = vertical
      ? mx - ux * back + nx * 0.42
      : mx + nx * 0.27;

    const py = vertical
      ? my - uy * back + ny * 0.42
      : my + ny * 0.27;

    return tag(
      pct(probability),
      probability === 0
        ? C.muted
        : ACTION,
      P ? 17 : 15,
      px,
      py,
      0.92
    );
  }

  function policyPicture(
    states = ['A', 'B', 'C'],
    policy = POLICY
  ) {
    const parts = [];

    for (const from of states) {
      for (const entry of policy[from]) {
        const to =
          TRANSITIONS[from][entry.action];

        const reversible =
          Object.values(
            TRANSITIONS[to]
          ).includes(from);

        const offset = reversible
          ? 0.15
          : 0;

        const probability =
          entry.probability;

        const color =
          probability === 0
            ? C.muted
            : ACTION;

        parts.push(
          moveArrow(
            from,
            to,
            color,
            offset,
            probability === 0 ? 1.5 : 3,
            probability === 0
          ),

          probabilityLabel(
            from,
            to,
            probability,
            offset
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function selectedMove(
    from,
    to
  ) {
    const action =
      actionBetween(from, to);

    return new M.VGroup(
      moveArrow(
        from,
        to,
        ACTION,
        0,
        5
      ),

      probabilityLabel(
        from,
        to,
        probabilityOf(from, action)
      )
    );
  }

  // ------------------------------------------------------------
  // Rewards are attached to transitions
  // ------------------------------------------------------------

  function rewardBadge(
    from,
    to,
    reward
  ) {
    // Opposite side of the arrow from the probability chip.
    const {
      sx, sy, ex, ey, nx, ny
    } = arrowCoordinates(from, to, 0);

    const vertical = Math.abs(nx) > Math.abs(ny);
    const ux = ny, uy = -nx;
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;

    const x = vertical
      ? mx - ux * 0.30 - nx * 0.42
      : mx - nx * 0.42;

    const y = vertical
      ? my - uy * 0.30 - ny * 0.42
      : my - ny * 0.42;

    return tag(
      `+${reward}`,
      REWARD,
      P ? 23 : 20,
      x,
      y,
      0.95
    );
  }

  function completedTag() {
    const [x, y] = POS.D;

    return tag(
      'COMPLETE',
      DOCK,
      P ? 17 : 15,
      x,
      y - CELL / 2 + 0.25,
      CELL - 0.30
    );
  }

  // ------------------------------------------------------------
  // One actual move of the cart
  //
  // The observed reward is appended only for the chosen action.
  // The route ends when D is reached.
  // ------------------------------------------------------------

  async function takeMove(
    destination,
    duration = 0.70,
    extra = []
  ) {
    if (terminated) {
      throw new Error(
        'Delivery has ended. Reset the cart first.'
      );
    }

    const from = state;

    const action =
      actionBetween(from, destination);

    if (probabilityOf(from, action) <= 0) {
      throw new Error(
        'Narrated move has zero probability under the policy.'
      );
    }

    const cart = slots.get('cart');

    if (!cart) {
      throw new Error(
        'Cart is not on screen.'
      );
    }

    // Show the selected action before revealing its reward.

    await play(
      quick(
        [
          ...clear(
            'policy',
            'moveReward',
            'complete'
          ),

          ...replace(
            'moveArrow',
            selectedMove(
              from,
              destination
            )
          ),

          ...focusState(from),
          ...extra
        ],
        Math.max(
          0.12,
          duration * 0.25
        )
      )
    );

    // Movement is deterministic once the action has been selected.

    const next =
      TRANSITIONS[from][action];

    const reward = rewardFor(next);

    state = next;
    route.push(next);
    rewards.push(reward);

    terminated =
      next === 'D';

    await play(
      quick(
        [
          new M.Transform(
            cart,
            cartAt(next)
          ),

          ...focusState(
            next,
            terminated ? DOCK : STATE
          ),

          ...replace(
            'moveReward',
            rewardBadge(
              from,
              next,
              reward
            )
          ),

          ...(
            terminated
              ? replace(
                  'complete',
                  completedTag()
                )
              : []
          )
        ],
        Math.max(
          0.20,
          duration * 0.75
        )
      )
    );

    return reward;
  }

  // ------------------------------------------------------------
  // Route and discounted-reward picture
  //
  // Gold: actual reward.
  // Purple: discounted contribution to the return.
  // ------------------------------------------------------------

  function routePicture(
    cells,
    revealDiscount = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const h = 2.55;

    const steps =
      cells.length - 1;

    const actual = cells
      .slice(1)
      .map(rewardFor);

    const discount = actual.map(
      (r, i) =>
        Math.pow(GAMMA, i) * r
    );

    const bg = rect(
      x,
      y,
      w,
      h,
      RETURN,
      C.card,
      0.97,
      0.18,
      2
    );

    const title = txt(
      `${steps} MOVE${steps === 1 ? '' : 'S'}`,
      P ? 23 : 21,
      STATE,
      x,
      y + h / 2 - 0.27,
      w - 0.35,
      true
    );

    const routeY = y + 0.41;

    const spacing =
      Math.min(
        1.10,
        (w - 0.85) /
          Math.max(steps, 1)
      );

    const xs = cells.map(
      (_, i) =>
        x +
        (i - steps / 2) * spacing
    );

    const chipW =
      Math.min(
        0.51,
        spacing * 0.68
      );

    const parts = [
      bg,
      title
    ];

    cells.forEach((s, i) => {
      const color =
        s === 'D' ? DOCK : STATE;

      parts.push(
        rect(
          xs[i],
          routeY,
          chipW,
          0.46,
          color,
          color,
          0.13,
          0.07,
          2
        ),

        txt(
          s,
          P ? 24 : 21,
          color,
          xs[i],
          routeY,
          chipW - 0.12,
          true
        )
      );
    });

    for (let i = 0; i < steps; i++) {
      const xx =
        (xs[i] + xs[i + 1]) / 2;

      parts.push(
        arrow(
          xs[i] + chipW / 2 + 0.02,
          routeY,
          xs[i + 1] - chipW / 2 - 0.02,
          routeY,
          ACTION,
          2,
          0.08
        ),

        txt(
          `+${actual[i]}`,
          P ? 20 : 18,
          REWARD,
          xx,
          routeY - 0.47,
          spacing - 0.09,
          true
        )
      );

      if (revealDiscount) {
        parts.push(
          txt(
            fmt(discount[i]),
            P ? 20 : 18,
            RETURN,
            xx,
            routeY - 0.91,
            spacing - 0.08,
            true
          )
        );
      }
    }

    const footer = revealDiscount
      ? `Discounted return = ${fmt(returnForRoute(cells))}`
      : 'Gold numbers: rewards on moves';

    parts.push(
      txt(
        footer,
        P ? 22 : 20,
        revealDiscount
          ? RETURN
          : REWARD,
        x,
        y - h / 2 + 0.24,
        w - 0.35,
        true
      )
    );

    return replace(
      'box',
      new M.VGroup(...parts)
    );
  }

  // ------------------------------------------------------------
  // Same starting cell, different returns
  // ------------------------------------------------------------

  function returnComparison() {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = 2.60;

    const bg = rect(
      x,
      y,
      w,
      h,
      RETURN,
      C.card,
      0.97,
      0.18,
      2
    );

    const barW = w - 0.75;
    const barH = 0.23;

    const parts = [
      bg,

      txt(
        'SAME START: A',
        P ? 23 : 21,
        STATE,
        x,
        y + h / 2 - 0.27,
        w - 0.35,
        true
      )
    ];

    const rows = [
      {
        name: 'Two moves',
        value: 5,
        yy: y + 0.38
      },

      {
        name: 'Four moves',
        value: 1.25,
        yy: y - 0.53
      }
    ];

    for (const row of rows) {
      const fraction =
        row.value / 5;

      const filledW =
        barW * fraction;

      parts.push(
        txt(
          row.name,
          P ? 21 : 19,
          C.ink,
          x - w * 0.20,
          row.yy + 0.29,
          w * 0.47
        ),

        txt(
          fmt(row.value),
          P ? 26 : 23,
          RETURN,
          x + w * 0.29,
          row.yy + 0.29,
          w * 0.30,
          true
        ),

        block(
          x,
          row.yy - 0.10,
          barW,
          barH,
          C.muted,
          C.muted,
          0.10
        ),

        block(
          x - barW / 2 + filledW / 2,
          row.yy - 0.10,
          filledW,
          barH,
          RETURN,
          RETURN,
          0.90
        )
      );
    }

    parts.push(
      txt(
        'Same policy, different sampled routes',
        P ? 18 : 16,
        C.muted,
        x,
        y - h / 2 + 0.20,
        w - 0.30
      )
    );

    return replace(
      'box',
      new M.VGroup(...parts)
    );
  }

  // ------------------------------------------------------------
  // Bus journey analogy
  //
  // Journey times are illustrative, not warehouse rewards.
  // The warehouse grid stays in its original position.
  // ------------------------------------------------------------

  function busIcon(
    x,
    y,
    color = STATE,
    scale = 1
  ) {
    const w = 1.12 * scale;
    const h = 0.55 * scale;

    const parts = [
      rect(
        x,
        y,
        w,
        h,
        color,
        color,
        0.19,
        0.10 * scale,
        2
      )
    ];

    for (let k = 0; k < 3; k++) {
      parts.push(
        rect(
          x + (k - 1) * 0.29 * scale,
          y + 0.07 * scale,
          0.22 * scale,
          0.20 * scale,
          color,
          DARK,
          0.93,
          0.025 * scale,
          1
        )
      );
    }

    for (const dx of [-0.34, 0.34]) {
      parts.push(
        circle(
          x + dx * scale,
          y - 0.29 * scale,
          0.095 * scale,
          C.ink,
          DARK,
          1,
          2
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function busPicture(stage = 0) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = 2.90;

    const bg = rect(
      x,
      y,
      w,
      h,
      STATE,
      C.card,
      0.97,
      0.18,
      2
    );

    const parts = [
      bg,

      txt(
        'THE SAME BUS TO WORK',
        P ? 22 : 20,
        STATE,
        x,
        y + h / 2 - 0.28,
        w - 0.35,
        true
      )
    ];

    const left =
      x - w / 2 + 0.45;

    const right =
      x + w / 2 - 0.45;

    const roadY =
      y + 0.52;

    parts.push(
      line(
        left,
        roadY - 0.24,
        right,
        roadY - 0.24,
        C.muted,
        3
      ),

      glow(
        left,
        roadY - 0.24,
        0.075,
        STATE
      ),

      glow(
        right,
        roadY - 0.24,
        0.075,
        DOCK
      ),

      busIcon(
        x,
        roadY,
        STATE,
        0.92
      )
    );

    if (stage >= 1) {
      const minutes = [20, 30, 25];

      const spacing = w / 3.4;

      minutes.forEach((value, k) => {
        const xx =
          x + (k - 1) * spacing;

        parts.push(
          txt(
            `Day ${k + 1}`,
            P ? 17 : 15,
            C.muted,
            xx,
            y - 0.13,
            spacing - 0.10
          ),

          txt(
            `${value} min`,
            P ? 22 : 20,
            STATE,
            xx,
            y - 0.48,
            spacing - 0.10,
            true
          )
        );
      });
    } else {
      parts.push(
        txt(
          'Same route every morning',
          P ? 21 : 19,
          C.ink,
          x,
          y - 0.38,
          w - 0.35
        )
      );
    }

    if (stage >= 2) {
      parts.push(
        txt(
          '(20 + 30 + 25) ÷ 3 = 25 min',
          P ? 21 : 19,
          RETURN,
          x,
          y - h / 2 + 0.37,
          w - 0.35,
          true
        )
      );
    } else {
      parts.push(
        txt(
          stage === 1
            ? 'Different times are possible'
            : 'Home → work',
          P ? 20 : 18,
          C.muted,
          x,
          y - h / 2 + 0.37,
          w - 0.35
        )
      );
    }

    return replace(
      'box',
      new M.VGroup(...parts)
    );
  }

  // ------------------------------------------------------------
  // Four-delivery return chart
  //
  // The purple bars represent complete discounted returns.
  // The cyan line is their arithmetic mean.
  // ------------------------------------------------------------

  function returnsPicture(
    revealMean = true,
    highlightLast = false,
    footer = null
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.95 : 3.65;

    const bg = rect(
      x,
      y,
      w,
      h,
      STATE,
      C.card,
      0.97,
      0.18,
      2
    );

    const left = x - w / 2 + 0.48;
    const right = x + w / 2 - 0.34;

    const top =
      y + h / 2 - 0.68;

    const base =
      y - h / 2 + 0.78;

    const chartH =
      top - base;

    const heightFor = value =>
      chartH * value / 6;

    const chartW =
      right - left;

    const spacing =
      chartW / 4;

    const barW =
      Math.min(
        0.65,
        spacing * 0.65
      );

    const parts = [
      bg,

      txt(
        'DELIVERIES STARTING AT A',
        P ? 22 : 20,
        STATE,
        x,
        y + h / 2 - 0.27,
        w - 0.35,
        true
      ),

      line(
        left,
        base,
        right,
        base,
        C.muted,
        2
      )
    ];

    const visible =
      observedReturns.slice(0, 4);

    for (let i = 0; i < 4; i++) {
      const xx =
        left + (i + 0.5) * spacing;

      const value =
        visible[i];

      parts.push(
        txt(
          String(i + 1),
          P ? 17 : 16,
          C.muted,
          xx,
          base - 0.21,
          spacing - 0.10,
          true
        )
      );

      if (value === undefined) {
        parts.push(
          dashed(
            xx,
            base + 0.10,
            xx,
            base + chartH * 0.23,
            C.muted
          ),

          txt(
            '?',
            P ? 20 : 18,
            C.muted,
            xx,
            base + chartH * 0.35,
            spacing - 0.10,
            true
          )
        );

        continue;
      }

      const bh =
        heightFor(value);

      parts.push(
        block(
          xx,
          base + bh / 2,
          barW,
          Math.max(0.01, bh),
          RETURN,
          RETURN,
          0.80,
          1
        ),

        txt(
          fmt(value),
          P ? 20 : 18,
          RETURN,
          xx,
          base + bh + 0.18,
          spacing - 0.08,
          true
        )
      );

      if (
        highlightLast &&
        i === visible.length - 1
      ) {
        parts.push(
          rect(
            xx,
            base + bh / 2,
            barW + 0.12,
            bh + 0.12,
            REWARD,
            REWARD,
            0,
            0.05,
            2
          )
        );
      }
    }

    if (
      revealMean &&
      visible.length
    ) {
      const mean =
        meanReturn();

      const meanY =
        base + heightFor(mean);

      parts.push(
        dashed(
          left,
          meanY,
          right,
          meanY,
          STATE
        )
      );
    }

    const note =
      footer !== null
        ? footer
        : revealMean && visible.length
          ? `Estimated V(A) = ${fmt(meanReturn())}`
          : `Deliveries completed: ${observedReturns.length}`;

    parts.push(
      txt(
        note,
        P ? 23 : 21,
        revealMean
          ? STATE
          : C.ink,
        x,
        y - h / 2 + 0.22,
        w - 0.30,
        true
      )
    );

    return replace(
      'box',
      new M.VGroup(...parts)
    );
  }

  // ------------------------------------------------------------
  // Four fixed narrated deliveries
  //
  // Return records:
  // 5, 5, 1.25, 5
  //
  // Running means:
  // 5, 5, 3.75, 4.0625
  // ------------------------------------------------------------

  async function runFixedDelivery(
    index,
    revealMean = true,
    duration = 0.55,
    displayFooter = null
  ) {
    const cells =
      FIXED_DELIVERIES[index];

    await play(
      quick(
        [
          ...resetCart('A'),
          ...focusState('A'),

          ...fbox(
            [
              [
                `Delivery ${index + 1}`,
                STATE
              ],
              'Start again at A.',
              'Use the same policy.'
            ],
            STATE
          )
        ],
        0.32
      )
    );

    for (
      let k = 1;
      k < cells.length;
      k++
    ) {
      await takeMove(
        cells[k],
        duration
      );
    }

    if (!terminated) {
      throw new Error(
        'A complete delivery must finish at D.'
      );
    }

    const value =
      discountedReturn(rewards);

    recordReturn(value);

    await play(
      quick(
        [
          ...returnsPicture(
            revealMean,
            true,
            displayFooter
          )
        ],
        0.40
      )
    );

    return value;
  }

  // ------------------------------------------------------------
  // Running estimate chart
  //
  // Every point comes from the actual running mean.
  // The true value is not revealed until sentence 42.
  //
  // An inset absolute-error curve can be displayed after
  // the exact value has been introduced.
  // ------------------------------------------------------------

  const RANDOM_BATCHES = [8, 16, 32, 64, 128, 256];

  const FINAL_RANDOM_N =
    4 + RANDOM_BATCHES.reduce(
      (sum, n) => sum + n,
      0
    );

  function convergencePicture(
    revealTruth = false,
    showError = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const h = P ? 3.05 : 4.20;

    const bg = rect(
      x,
      y,
      w,
      h,
      STATE,
      C.card,
      0.97,
      0.18,
      2
    );

    const left =
      x - w / 2 + 0.55;

    const right =
      x + w / 2 - 0.30;

    const top =
      y + h / 2 - 0.85;

    const bottom =
      y - h / 2 +
      (showError ? 1.26 : 0.72);

    const chartW =
      right - left;

    const chartH =
      top - bottom;

    const maxY = 6;

    // Logarithmic delivery-count axis makes early samples visible.
    // Its ticks are explicitly labelled.

    const gx = n =>
      left +
      chartW *
      Math.log(Math.max(1, n)) /
      Math.log(FINAL_RANDOM_N);

    const gy = v =>
      bottom +
      chartH * v / maxY;

    const parts = [
      bg,

      txt(
        'RUNNING MEAN FROM A',
        P ? 22 : 21,
        STATE,
        x,
        y + h / 2 - 0.27,
        w - 0.35,
        true
      ),

      txt(
        'Discounted return',
        P ? 17 : 16,
        C.muted,
        x,
        y + h / 2 - 0.58,
        w - 0.35
      ),

      line(
        left,
        bottom,
        right,
        bottom,
        C.muted,
        2
      ),

      line(
        left,
        bottom,
        left,
        top,
        C.muted,
        2
      )
    ];

    for (const v of [0, 2, 4, 6]) {
      const yy = gy(v);

      parts.push(
        txt(
          String(v),
          P ? 16 : 15,
          C.muted,
          left - 0.24,
          yy,
          0.30,
          true
        )
      );

      if (v > 0) {
        parts.push(
          dashed(
            left,
            yy,
            right,
            yy,
            C.muted
          )
        );
      }
    }

    for (const n of [1, 10, 100, FINAL_RANDOM_N]) {
      const xx = gx(n);

      parts.push(
        txt(
          String(n),
          P ? 15 : 14,
          C.muted,
          xx,
          bottom - 0.18,
          0.54,
          true
        )
      );
    }

    // Downsample only the rendering, not the calculation.
    // Preserve the first observations, and the minimum and
    // maximum running means within each subsequent bucket.

    const sampled = [];

    const firstCount =
      Math.min(
        16,
        meanHistory.length
      );

    sampled.push(
      ...meanHistory.slice(0, firstCount)
    );

    const remaining =
      meanHistory.slice(firstCount);

    const bucketSize =
      Math.max(
        1,
        Math.ceil(remaining.length / 32)
      );

    for (
      let k = 0;
      k < remaining.length;
      k += bucketSize
    ) {
      const bucket =
        remaining.slice(
          k,
          k + bucketSize
        );

      const minimum =
        bucket.reduce(
          (a, b) =>
            a.mean <= b.mean ? a : b
        );

      const maximum =
        bucket.reduce(
          (a, b) =>
            a.mean >= b.mean ? a : b
        );

      const ordered = [
        bucket[0],
        minimum,
        maximum,
        bucket[bucket.length - 1]
      ]
        .filter(
          (item, index, list) =>
            list.findIndex(
              other => other.n === item.n
            ) === index
        )
        .sort(
          (a, b) => a.n - b.n
        );

      sampled.push(...ordered);
    }

    if (revealTruth) {
      const exact = TRUE_VALUES.A;
      const yy = gy(exact);

      parts.push(
        dashed(
          left,
          yy,
          right,
          yy,
          DOCK
        ),

        txt(
          'Exact = 4',
          P ? 17 : 16,
          DOCK,
          right - 0.59,
          yy + 0.18,
          1.12,
          true
        )
      );
    }

    for (
      let k = 1;
      k < sampled.length;
      k++
    ) {
      const a = sampled[k - 1];
      const b = sampled[k];

      parts.push(
        line(
          gx(a.n),
          gy(a.mean),
          gx(b.n),
          gy(b.mean),
          STATE,
          3
        )
      );
    }

    if (meanHistory.length) {
      const last =
        meanHistory[
          meanHistory.length - 1
        ];

      parts.push(
        glow(
          gx(last.n),
          gy(last.mean),
          0.065,
          STATE
        )
      );
    }

    if (showError && revealTruth) {
      // This is the actual absolute estimation error.
      // It is not forced to decrease monotonically.

      const errorTop =
        bottom - 0.38;

      const errorBottom =
        errorTop - 0.34;

      const errorMax = Math.max(
        1,
        ...meanHistory.map(
          item =>
            Math.abs(
              item.mean - TRUE_VALUES.A
            )
        )
      );

      const ey = value =>
        errorBottom +
        0.34 * value / errorMax;

      parts.push(
        line(
          left,
          errorBottom,
          right,
          errorBottom,
          C.muted,
          1
        )
      );

      for (
        let k = 1;
        k < sampled.length;
        k++
      ) {
        const a = sampled[k - 1];
        const b = sampled[k];

        parts.push(
          line(
            gx(a.n),
            ey(
              Math.abs(
                a.mean - TRUE_VALUES.A
              )
            ),
            gx(b.n),
            ey(
              Math.abs(
                b.mean - TRUE_VALUES.A
              )
            ),
            RETURN,
            2
          )
        );
      }

      parts.push(
        txt(
          `Absolute error: ${fmt(Math.abs(meanReturn() - TRUE_VALUES.A), 3)}`,
          P ? 16 : 15,
          RETURN,
          x,
          errorBottom - 0.16,
          w - 0.35,
          true
        )
      );
    } else {
      parts.push(
        txt(
          'Deliveries (log scale)',
          P ? 15 : 14,
          C.muted,
          x,
          bottom - 0.40,
          w - 0.35
        )
      );
    }

    parts.push(
      txt(
        `n = ${observedReturns.length}    mean = ${fmt(meanReturn(), 4)}`,
        P ? 20 : 19,
        STATE,
        x,
        y - h / 2 + 0.18,
        w - 0.30,
        true
      )
    );

    return replace(
      'box',
      new M.VGroup(...parts)
    );
  }

  function addRandomDeliveries(count) {
    let last = null;

    for (let k = 0; k < count; k++) {
      last = sampleDelivery('A');

      recordReturn(last.value);
    }

    return last;
  }

  // ------------------------------------------------------------
  // Compact record of the last sampled delivery
  // ------------------------------------------------------------

  function sampledDeliveryTag(sample) {
    const y =
      CY - GRID_H / 2 -
      (P ? 0.27 : 0.29);

    return tag(
      `${sample.moves} moves · G = ${fmt(sample.value, 4)}`,
      RETURN,
      P ? 18 : 16,
      CX,
      y,
      GRID_W + 0.30
    );
  }

  // ------------------------------------------------------------
  // State-value labels
  //
  // Cyan labels show expected discounted returns.
  // They are never presented as immediate rewards.
  // ------------------------------------------------------------

  function valueLabel(
    s,
    value,
    exact = true
  ) {
    const [x, y] = POS[s];

    const number = value === null
      ? '?'
      : fmt(value);

    const main = txt(
      number,
      P ? 47 : 41,
      STATE,
      x,
      y + 0.04,
      CELL - 0.35,
      true
    );

    const label = txt(
      exact
        ? `V(${s})`
        : `Estimated V(${s})`,
      P ? 19 : 17,
      STATE,
      x,
      // The dock has hatch marks at the bottom: put V(D) inside the bay.
      s === 'D'
        ? y - 0.33
        : y - CELL / 2 + 0.32,
      s === 'D' ? 0.6 : CELL - 0.28,
      true
    );

    return new M.VGroup(
      main,
      label
    );
  }

  function setValue(
    s,
    value,
    exact = true
  ) {
    return replace(
      `value${s}`,
      valueLabel(
        s,
        value,
        exact
      )
    );
  }

  function allValues() {
    return NAMES.flatMap(
      s =>
        setValue(
          s,
          TRUE_VALUES[s]
        )
    );
  }

  // ------------------------------------------------------------
  // State-value comparison bars
  // ------------------------------------------------------------

  function valueComparison(
    emphasizeC = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.90 : 3.65;

    const bg = rect(
      x,
      y,
      w,
      h,
      STATE,
      C.card,
      0.97,
      0.18,
      2
    );

    const parts = [
      bg,

      txt(
        'EXPECTED DISCOUNTED RETURN',
        P ? 22 : 20,
        STATE,
        x,
        y + h / 2 - 0.27,
        w - 0.35,
        true
      )
    ];

    const barLeft =
      x - w / 2 + 0.83;

    const barRight =
      x + w / 2 - 0.75;

    const barW =
      barRight - barLeft;

    const rowH =
      P ? 0.46 : 0.60;

    const firstY =
      y + h / 2 - 0.83;

    NAMES.forEach((s, k) => {
      const yy =
        firstY - k * rowH;

      const value =
        TRUE_VALUES[s];

      const best =
        emphasizeC && s === 'C';

      const color =
        best ? DOCK : STATE;

      parts.push(
        txt(
          s,
          P ? 23 : 21,
          color,
          x - w / 2 + 0.40,
          yy,
          0.35,
          true
        ),

        block(
          (barLeft + barRight) / 2,
          yy,
          barW,
          0.20,
          C.muted,
          C.muted,
          0.10
        )
      );

      if (value > 0) {
        const filledW =
          barW * value / 10;

        parts.push(
          block(
            barLeft + filledW / 2,
            yy,
            filledW,
            0.20,
            color,
            color,
            0.88
          )
        );
      }

      parts.push(
        txt(
          String(value),
          P ? 23 : 21,
          color,
          x + w / 2 - 0.36,
          yy,
          0.60,
          true
        )
      );
    });

    parts.push(
      txt(
        emphasizeC
          ? 'Best starting cell: C'
          : 'Under the current policy',
        P ? 21 : 19,
        emphasizeC ? DOCK : C.muted,
        x,
        y - h / 2 + 0.24,
        w - 0.35
      )
    );

    return replace(
      'box',
      new M.VGroup(...parts)
    );
  }

  // ------------------------------------------------------------
  // Value versus individual return
  //
  // A has exact value 4, even though the first four returns
  // were 5, 5, 1.25 and 5.
  // ------------------------------------------------------------

  function valueNotPromise() {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = 2.85;

    const bg = rect(
      x,
      y,
      w,
      h,
      RETURN,
      C.card,
      0.97,
      0.18,
      2
    );

    const left =
      x - w / 2 + 0.52;

    const right =
      x + w / 2 - 0.38;

    const axisY =
      y - 0.47;

    const gx = value =>
      left +
      (right - left) * value / 6;

    const parts = [
      bg,

      txt(
        'A VALUE IS NOT A PROMISE',
        P ? 22 : 20,
        RETURN,
        x,
        y + h / 2 - 0.28,
        w - 0.35,
        true
      ),

      line(
        left,
        axisY,
        right,
        axisY,
        C.muted,
        2
      )
    ];

    for (const v of [0, 2, 4, 6]) {
      const xx = gx(v);

      parts.push(
        line(
          xx,
          axisY - 0.05,
          xx,
          axisY + 0.05,
          C.muted,
          1
        ),

        txt(
          String(v),
          P ? 16 : 15,
          C.muted,
          xx,
          axisY - 0.23,
          0.40,
          true
        )
      );
    }

    const samples =
      observedReturns.slice(0, 4);

    samples.forEach((value, i) => {
      const repeats =
        samples
          .slice(0, i)
          .filter(v => v === value)
          .length;

      parts.push(
        glow(
          gx(value),
          axisY + 0.19 +
            repeats * 0.27,
          0.085,
          RETURN
        )
      );
    });

    const exactX =
      gx(TRUE_VALUES.A);

    parts.push(
      dashed(
        exactX,
        axisY,
        exactX,
        y + 0.72,
        STATE
      ),

      txt(
        'V(A) = 4',
        P ? 22 : 20,
        STATE,
        exactX,
        y + 0.87,
        1.65,
        true
      ),

      txt(
        'Purple dots: individual returns',
        P ? 18 : 16,
        RETURN,
        x,
        y - h / 2 + 0.25,
        w - 0.35
      )
    );

    return replace(
      'box',
      new M.VGroup(...parts)
    );
  }

  // ------------------------------------------------------------
  // Hypothetical alternative policy
  //
  // The warehouse, reward rules and discount factor do not change.
  //
  // A always goes right.
  // B always goes down.
  // C always goes right.
  //
  // Under this alternative:
  // V(A) = 5, V(B) = 10, V(C) = 10, V(D) = 0.
  //
  // This policy is an illustration only. POLICY remains unchanged.
  // ------------------------------------------------------------

  const ALTERNATIVE_POLICY = {
    A: [
      { action: 'right', probability: 1 },
      { action: 'down', probability: 0 }
    ],

    B: [
      { action: 'left', probability: 0 },
      { action: 'down', probability: 1 }
    ],

    C: [
      { action: 'up', probability: 0 },
      { action: 'right', probability: 1 }
    ],

    D: []
  };

  function policyComparisonPicture() {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = 2.85;

    const bg = rect(
      x,
      y,
      w,
      h,
      ACTION,
      C.card,
      0.97,
      0.18,
      2
    );

    const leftX =
      x - w / 4;

    const rightX =
      x + w / 4;

    return replace(
      'box',
      new M.VGroup(
        bg,

        txt(
          'SAME WAREHOUSE, NEW POLICY',
          P ? 22 : 20,
          ACTION,
          x,
          y + h / 2 - 0.28,
          w - 0.35,
          true
        ),

        txt(
          'Original',
          P ? 21 : 19,
          C.ink,
          leftX,
          y + 0.45,
          w / 2 - 0.30
        ),

        txt(
          'Alternative',
          P ? 21 : 19,
          ACTION,
          rightX,
          y + 0.45,
          w / 2 - 0.30
        ),

        txt(
          'V(A)',
          P ? 20 : 18,
          STATE,
          leftX,
          y + 0.03,
          w / 2 - 0.30,
          true
        ),

        txt(
          'V(A)',
          P ? 20 : 18,
          STATE,
          rightX,
          y + 0.03,
          w / 2 - 0.30,
          true
        ),

        txt(
          '4',
          P ? 42 : 37,
          STATE,
          leftX,
          y - 0.43,
          w / 2 - 0.45,
          true
        ),

        txt(
          '5',
          P ? 42 : 37,
          STATE,
          rightX,
          y - 0.43,
          w / 2 - 0.45,
          true
        ),

        arrow(
          x - 0.28,
          y - 0.43,
          x + 0.28,
          y - 0.43,
          ACTION,
          3,
          0.12
        ),

        txt(
          'Different policy → different value',
          P ? 20 : 18,
          ACTION,
          x,
          y - h / 2 + 0.24,
          w - 0.35
        )
      )
    );
  }

  // ============================================================
  // NARRATED SCENE
  // ============================================================

  // ------------------------------------------------------------
  // 0: the cart can start in any cell except D
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...replace(
      'grid',
      warehouseGrid()
    ),

    ...replace(
      'dock',
      dockPicture()
    ),

    ...resetCart('A'),

    ...replace(
      'starts',
      possibleStarts()
    ),

    ...say(
      'START IN A, B OR C',
      STATE
    ),

    ...fbox(
      [
        ['Possible starting states', STATE],
        'A, B or C',
        ['D is the terminal dock.', DOCK],
        'A new delivery begins',
        'outside the dock.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 1: choose the best starting place
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...say(
      'WHERE IS THE BEST PLACE TO START?',
      REWARD
    ),

    ...fbox(
      [
        ['Choose a starting cell', STATE],
        'Which starting situation',
        'offers the largest return?'
      ],
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 2: compare A, B and C
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...clear(
      'starts',
      'cart'
    ),

    ...setValue('A', null, false),
    ...setValue('B', null, false),
    ...setValue('C', null, false),

    ...say(
      'A, B OR C?',
      STATE
    ),

    ...fbox(
      [
        ['Starting state A: ?', STATE],
        ['Starting state B: ?', STATE],
        ['Starting state C: ?', STATE],
        'We need a fair comparison.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 3: retain the same policy from the previous lesson
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...clear(
      'valueA',
      'valueB',
      'valueC'
    ),

    ...resetCart('A'),

    ...replace(
      'policy',
      policyPicture()
    ),

    ...say(
      'KEEP THE SAME POLICY',
      ACTION
    ),

    ...fbox(
      [
        ['Fixed policy', ACTION],
        'Chances of choosing moves',
        'stay the same.',
        ['Discount factor = 0.5', RETURN]
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 4: each available move at A and B has probability 50%
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...replace(
      'policy',
      policyPicture(['A', 'B'])
    ),

    ...replace(
      'policyFocus',
      new M.VGroup(
        stateOutline('A', ACTION),
        stateOutline('B', ACTION)
      )
    ),

    ...say(
      'A AND B: TWO 50% CHANCES',
      ACTION
    ),

    ...fbox(
      [
        ['At A', STATE],
        ['Right 50%   Down 50%', ACTION],
        ['At B', STATE],
        ['Left 50%    Down 50%', ACTION]
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 5: at C the cart always chooses right
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...replace(
      'policy',
      policyPicture(['C'])
    ),

    ...replace(
      'policyFocus',
      stateOutline('C', ACTION)
    ),

    ...say(
      'C: ALWAYS MOVE RIGHT',
      ACTION
    ),

    ...fbox(
      [
        ['At C', STATE],
        ['Right → D: 100%', ACTION],
        ['Up → A: 0%', C.muted],
        'The up move is allowed,',
        'but this policy never chooses it.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 6: begin a delivery at C
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...clear(
      'policyFocus',
      'policy'
    ),

    ...resetCart('C'),
    ...focusState('C'),

    ...say(
      'FIRST DELIVERY: START AT C',
      STATE
    ),

    ...fbox(
      [
        ['Starting state = C', STATE],
        'Follow the fixed policy.',
        ['Right with chance 100%', ACTION]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 7: move right and earn ten immediately
  // ------------------------------------------------------------

  await until(S(7));

  await takeMove(
    'D',
    1.10,
    say(
      'C → D: EARN 10',
      REWARD
    )
  );

  await play(
    quick(
      routePicture(
        ['C', 'D'],
        false
      ),
      0.40
    )
  );

  // ------------------------------------------------------------
  // 8: the first reward is never discounted
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...routePicture(
      ['C', 'D'],
      true
    ),

    ...say(
      'FIRST MOVE: DISCOUNTED RETURN = 10',
      RETURN
    )
  );

  await until(S(8) + 1.75);

  await play(
    ...fbox(
      [
        ['First reward = 10', REWARD],
        ['Weight of first reward = 1', RETURN],
        ['1 × 10 = 10', RETURN],
        'No discount on the first reward.'
      ],
      RETURN
    )
  );

  // ------------------------------------------------------------
  // 9: all deliveries from C follow the same route
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    quick(
      [
        ...resetCart('C'),
        ...focusState('C'),

        ...say(
          'EVERY DELIVERY FROM C IS THE SAME',
          STATE
        )
      ],
      0.45
    )
  );

  await takeMove('D', 0.75);

  await play(
    quick(
      [
        ...fbox(
          [
            ['Start at C', STATE],
            'C → D, every time.',
            ['Return = 10', RETURN],
            'No variation under this policy.'
          ],
          RETURN
        )
      ],
      0.40
    )
  );

  // ------------------------------------------------------------
  // 10: begin at A
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    quick(
      [
        ...resetCart('A'),
        ...focusState('A'),

        ...say(
          'NOW START AT A',
          STATE
        ),

        ...fbox(
          [
            ['Starting state = A', STATE],
            'Same policy.'
          ],
          STATE
        )
      ],
      0.55
    )
  );

  // ------------------------------------------------------------
  // 11: move right from A to B
  // ------------------------------------------------------------

  await until(S(11));

  await takeMove(
    'B',
    0.90,
    [
      ...say(
        'A → B: REWARD 0',
        ACTION
      ),

      ...fbox(
        [
          ['First move', STATE],
          ['Choose right: 50% chance', ACTION],
          ['Reward = 0', REWARD]
        ],
        ACTION
      )
    ]
  );

  // ------------------------------------------------------------
  // 12: move down from B to D
  // ------------------------------------------------------------

  await until(S(12));

  await takeMove(
    'D',
    0.85,
    [
      ...say(
        'B → D: REWARD 10',
        REWARD
      ),

      ...fbox(
        [
          ['Second move', STATE],
          ['Choose down: 50% chance', ACTION],
          ['Reward = 10', REWARD]
        ],
        REWARD
      )
    ]
  );

  // ------------------------------------------------------------
  // 13: discounted return is five
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...routePicture(
      SHORT_ROUTE,
      true
    ),

    ...say(
      'DISCOUNTED RETURN = 5',
      RETURN
    )
  );

  // ------------------------------------------------------------
  // 14: start another delivery from A with the same policy
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...resetCart('A'),
    ...focusState('A'),

    ...replace(
      'policy',
      policyPicture(['A'])
    ),

    ...say(
      'SAME START, SAME POLICY',
      STATE
    ),

    ...fbox(
      [
        ['Start again at A', STATE],
        'The policy has not changed.',
        'But sampled actions',
        'can be different.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 15: A → B → A
  // ------------------------------------------------------------

  await until(S(15));

  await takeMove(
    'B',
    0.78,
    [
      ...say(
        'A → B → A',
        ACTION
      ),

      ...fbox(
        [
          ['First move: A → B', ACTION],
          ['Reward = 0', REWARD]
        ],
        ACTION
      )
    ]
  );

  await takeMove(
    'A',
    0.78,
    fbox(
      [
        ['Second move: B → A', ACTION],
        ['Reward = 0', REWARD],
        'Back at the starting cell.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 16: move down from A to C
  // ------------------------------------------------------------

  await until(S(16));

  await takeMove(
    'C',
    0.83,
    [
      ...say(
        'A → C: THIRD MOVE',
        ACTION
      ),

      ...fbox(
        [
          ['Third move: A → C', ACTION],
          ['Reward = 0', REWARD]
        ],
        ACTION
      )
    ]
  );

  // ------------------------------------------------------------
  // 17: move right from C to D
  // ------------------------------------------------------------

  await until(S(17));

  await takeMove(
    'D',
    0.95,
    [
      ...say(
        'C → D: FOURTH MOVE',
        REWARD
      ),

      ...fbox(
        [
          ['Fourth move: C → D', ACTION],
          ['Reward = 10', REWARD],
          ['Delivery complete', DOCK]
        ],
        REWARD
      )
    ]
  );

  // ------------------------------------------------------------
  // 18: four moves give discounted return 1.25
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...routePicture(
      LONG_ROUTE,
      true
    ),

    ...say(
      'LONGER ROUTE: RETURN = 1.25',
      RETURN
    )
  );

  await until(S(18) + 1.65);

  await play(
    ...fbox(
      [
        ['Rewards: 0, 0, 0, 10', REWARD],
        'G = 0 + 0.5 × 0',
        '    + 0.25 × 0',
        '    + 0.125 × 10',
        ['G = 1.25', RETURN]
      ],
      RETURN
    )
  );

  // ------------------------------------------------------------
  // 19: same starting state can produce different returns
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...clear(
      'moveArrow',
      'moveReward',
      'complete',
      'focus',
      'cart'
    ),

    ...focusState('A'),

    ...returnComparison(),

    ...say(
      'SAME START, DIFFERENT RETURNS',
      RETURN
    )
  );

  // ------------------------------------------------------------
  // 20: imagine taking the same bus to work
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...clear('focus'),

    ...busPicture(0),

    ...say(
      'IMAGINE THE SAME BUS EVERY MORNING',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 21: journey times can vary
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...busPicture(1),

    ...say(
      'SAME ROUTE, DIFFERENT JOURNEY TIMES',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 22: take the mean of many journeys
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...busPicture(2),

    ...say(
      'MEAN = SUM ÷ COUNT',
      RETURN
    )
  );

  // ------------------------------------------------------------
  // 23: do the same with the cart's returns
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...focusState('A'),

    ...returnComparison(),

    ...say(
      'TAKE THE MEAN OF THE CART’S RETURNS',
      RETURN
    )
  );

  // ------------------------------------------------------------
  // 24: define state value
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...say(
      'STATE VALUE',
      STATE
    ),

    ...fbox(
      [
        ['STATE VALUE', STATE],
        'Start from a particular cell.',
        'Follow a particular policy.',
        'Collect discounted returns.',
        ['Find their long-run mean.', STATE]
      ],
      STATE
    )
  );

  await until(S(24) + 2.70);

  await play(
    ...fbox(
      [
        ['V(A)', STATE],
        'Expected discounted return',
        'when starting from A',
        'and following our policy.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 25: estimate A using four deliveries
  // ------------------------------------------------------------

  await until(S(25));

  resetEstimate();

  await play(
    ...resetCart('A'),

    ...returnsPicture(false),

    ...say(
      'ESTIMATE V(A) WITH FOUR DELIVERIES',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 26: an estimate is not necessarily the exact answer
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...fbox(
      [
        ['ESTIMATE', STATE],
        'A number calculated',
        'from the results we have.',
        'The exact state value',
        'is not yet known.'
      ],
      STATE
    ),

    ...say(
      'ESTIMATE ≠ KNOWN EXACT VALUE',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 27: reset to A after every delivery
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...resetCart('A'),

    ...focusState('A'),

    ...returnsPicture(false),

    ...say(
      'EVERY DELIVERY STARTS AT A',
      STATE
    )
  );

  await until(S(27) + 1.80);

  await play(
    ...fbox(
      [
        'Finish one delivery.',
        'Record its discounted return.',
        ['Reset the cart to A.', STATE],
        'Start a new delivery.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 28: first delivery: two moves, return 5
  // ------------------------------------------------------------

  await until(S(28));

  await runFixedDelivery(
    0,
    true,
    0.67
  );

  await play(
    quick(
      say(
        'DELIVERY 1: RETURN 5, MEAN 5',
        RETURN
      ),
      0.30
    )
  );

  // ------------------------------------------------------------
  // 29: second delivery: two moves, return 5
  // ------------------------------------------------------------

  await until(S(29));

  await runFixedDelivery(
    1,
    true,
    0.70
  );

  await play(
    quick(
      say(
        'DELIVERY 2: RETURN 5',
        RETURN
      ),
      0.30
    )
  );

  // ------------------------------------------------------------
  // 30: the mean remains five
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    quick(
      [
        ...returnsPicture(
          true,
          false,
          '(5 + 5) ÷ 2 = 5'
        ),

        ...say(
          'MEAN IS STILL 5',
          STATE
        )
      ],
      0.55
    )
  );

  // ------------------------------------------------------------
  // 31: third delivery: four moves, return 1.25
  //
  // Reveal the new return, then calculate its mean in later beats.
  // ------------------------------------------------------------

  await until(S(31));

  await runFixedDelivery(
    2,
    false,
    0.47,
    'Third return = 1.25'
  );

  await play(
    quick(
      say(
        'DELIVERY 3: RETURN 1.25',
        RETURN
      ),
      0.30
    )
  );

  // ------------------------------------------------------------
  // 32: add the three observed returns
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...returnsPicture(
      false,
      false,
      '5 + 5 + 1.25'
    ),

    ...say(
      'ADD ALL THREE RETURNS',
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 33: sum = 11.25
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...fbox(
      [
        ['Return 1 = 5', RETURN],
        ['Return 2 = 5', RETURN],
        ['Return 3 = 1.25', RETURN],
        ['5 + 5 + 1.25', REWARD],
        [`Sum = ${fmt(sumReturns)}`, REWARD]
      ],
      REWARD
    ),

    ...say(
      'SUM OF RETURNS = 11.25',
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 34: 11.25 ÷ 3 = 3.75
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...returnsPicture(
      true,
      false,
      '11.25 ÷ 3 = 3.75'
    ),

    ...say(
      'NEW MEAN = 3.75',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 35: fourth delivery: two moves, return 5
  // ------------------------------------------------------------

  await until(S(35));

  await runFixedDelivery(
    3,
    false,
    0.62,
    'Fourth return = 5'
  );

  await play(
    quick(
      say(
        'DELIVERY 4: RETURN 5',
        RETURN
      ),
      0.30
    )
  );

  // ------------------------------------------------------------
  // 36: total is now 16.25
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...fbox(
      [
        ['Previous sum = 11.25', REWARD],
        ['New return = 5', RETURN],
        '11.25 + 5',
        [`New sum = ${fmt(sumReturns)}`, REWARD]
      ],
      REWARD
    ),

    ...say(
      'TOTAL RETURN = 16.25',
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 37: mean = 16.25 / 4 = 4.0625
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...returnsPicture(
      true,
      false,
      '16.25 ÷ 4 = 4.0625'
    ),

    ...say(
      'ESTIMATED STATE VALUE = 4.0625',
      STATE
    )
  );

  await until(S(37) + 1.80);

  await play(
    ...fbox(
      [
        ['Sum of returns = 16.25', REWARD],
        'Number of deliveries = 4',
        '16.25 ÷ 4',
        [
          `Estimated V(A) = ${fmt(meanReturn())}`,
          STATE
        ]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 38: introduce the formula
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...say(
      'WRITE THE STEPS AS A FORMULA',
      STATE
    ),

    ...fbox(
      [
        ['Step 1: sum the returns', RETURN],
        'Step 2: count deliveries',
        ['Step 3: divide', STATE]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 39: estimated state value = sum of returns / deliveries
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...say(
      'STATE VALUE ESTIMATE = MEAN RETURN',
      STATE
    ),

    ...fbox(
      [
        ['Estimated state value =', STATE],
        ['  sum of discounted returns', RETURN],
        '  ÷ number of deliveries',
        'V̂(A) = 16.25 ÷ 4',
        ['      = 4.0625', STATE]
      ],
      STATE
    )
  );

  await until(S(39) + 3.25);

  await play(
    ...returnsPicture(
      true,
      false,
      'Estimated V(A) = 4.0625'
    )
  );

  // ------------------------------------------------------------
  // 40: repeat deliveries much faster
  //
  // Use genuine independent random deliveries.
  // Preserve the four fixed narrated observations as the
  // initial demonstration history.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    quick(
      [
        ...clear(
          'moveArrow',
          'moveReward',
          'complete',
          'focus'
        ),

        ...resetCart('A'),

        ...convergencePicture(false),

        ...say(
          'MANY NEW RANDOM DELIVERIES',
          STATE
        )
      ],
      0.45
    )
  );

  for (let k = 0; k < 3; k++) {
    const sample =
      addRandomDeliveries(
        RANDOM_BATCHES[k]
      );

    await play(
      quick(
        [
          ...replace(
            'sampledDelivery',
            sampledDeliveryTag(sample)
          ),

          ...convergencePicture(false)
        ],
        0.60
      )
    );
  }

  // ------------------------------------------------------------
  // 41: with more returns, the mean tends towards four
  //
  // The line is not forced to approach four monotonically.
  // All calculated sample means are retained at full precision.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    quick(
      say(
        'MORE RETURNS: MEAN TENDS TO SETTLE',
        STATE
      ),
      0.35
    )
  );

  for (
    let k = 3;
    k < RANDOM_BATCHES.length;
    k++
  ) {
    const sample =
      addRandomDeliveries(
        RANDOM_BATCHES[k]
      );

    await play(
      quick(
        [
          ...replace(
            'sampledDelivery',
            sampledDeliveryTag(sample)
          ),

          ...convergencePicture(false)
        ],
        0.63
      )
    );
  }

  // ------------------------------------------------------------
  // 42: reveal exact V(A) = 4
  //
  // The exact value is a reference line, not a replacement
  // for the observed estimate.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...clear(
      'cart',
      'sampledDelivery'
    ),

    ...setValue('A', TRUE_VALUES.A),

    ...focusState('A'),

    ...convergencePicture(
      true,
      true
    ),

    ...say(
      'EXACT STATE VALUE OF A = 4',
      STATE
    )
  );

  await until(S(42) + 1.75);

  await play(
    ...fbox(
      [
        [
          `Deliveries = ${observedReturns.length}`,
          C.ink
        ],
        [
          `Estimated V(A) = ${fmt(meanReturn(), 4)}`,
          STATE
        ],
        ['Exact V(A) = 4', DOCK],
        [
          `Absolute error = ${fmt(Math.abs(meanReturn() - 4), 4)}`,
          RETURN
        ]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 43: exact calculation will be introduced next lesson
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...say(
      'NEXT: CALCULATE THE EXACT VALUE',
      STATE
    ),

    ...fbox(
      [
        ['This lesson', STATE],
        'Estimate using deliveries.',
        ['Next lesson', RETURN],
        'Calculate the exact value',
        'without sampling every route.'
      ],
      RETURN
    )
  );

  // ------------------------------------------------------------
  // 44: exact V(B) = 6
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...setValue('B', TRUE_VALUES.B),

    ...focusState('B'),

    ...say(
      'EXACT STATE VALUE OF B = 6',
      STATE
    ),

    ...fbox(
      [
        ['Starting state B', STATE],
        ['V(B) = 6', STATE],
        'Long-run mean return',
        'under the current policy.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 45: exact V(C) = 10
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...setValue('C', TRUE_VALUES.C),

    ...focusState('C'),

    ...say(
      'EXACT STATE VALUE OF C = 10',
      STATE
    ),

    ...fbox(
      [
        ['Starting state C', STATE],
        'Always move right to D.',
        ['Immediate reward = 10', REWARD],
        ['V(C) = 10', STATE]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 46: terminal D has state value zero
  //
  // Reward 10 was received on entering D.
  // Once at D, there are no future rewards.
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...setValue('D', TRUE_VALUES.D),

    ...focusState('D', DOCK),

    ...say(
      'AT THE DOCK: NO FUTURE REWARDS',
      DOCK
    ),

    ...fbox(
      [
        ['Cell D is terminal.', DOCK],
        ['Reward on entering D = 10', REWARD],
        'After arrival:',
        'No remaining future rewards.',
        ['V(D) = 0', STATE]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 47: compare starting states under the same policy
  // ------------------------------------------------------------

  await until(S(47));

  await play(
    ...clear('focus'),

    ...valueComparison(false),

    ...say(
      'COMPARE STATE VALUES',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 48: C offers the highest state value
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...focusState('C', DOCK),

    ...valueComparison(true),

    ...say(
      'C HAS THE HIGHEST STATE VALUE',
      DOCK
    )
  );

  // ------------------------------------------------------------
  // 49: state value is not a promised return
  // ------------------------------------------------------------

  await until(S(49));

  await play(
    ...focusState('A'),

    ...valueNotPromise(),

    ...say(
      'STATE VALUE IS NOT A GUARANTEED RETURN',
      RETURN
    )
  );

  await until(S(49) + 2.20);

  await play(
    ...fbox(
      [
        ['V(A) = 4', STATE],
        ['Possible return = 5', RETURN],
        ['Possible return = 1.25', RETURN],
        'The value describes',
        'a long-run mean.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 50: changing the policy can change state values
  //
  // The alternative policy is explicitly labelled.
  // It does not modify the original policy or estimator.
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    ...clear(
      'focus',
      'valueA',
      'valueB',
      'valueC',
      'valueD'
    ),

    ...replace(
      'policy',
      policyPicture(
        ['A', 'B', 'C'],
        ALTERNATIVE_POLICY
      )
    ),

    ...setValue('A', 5),
    ...setValue('B', 10),
    ...setValue('C', 10),
    ...setValue('D', 0),

    ...policyComparisonPicture(),

    ...say(
      'ALTERNATIVE POLICY, DIFFERENT VALUES',
      ACTION
    )
  );

  await until(S(50) + 3.00);

  await play(
    ...fbox(
      [
        ['Warehouse unchanged', C.ink],
        ['Alternative policy', ACTION],
        'A → B → D every time.',
        ['Return = 5', RETURN],
        ['Now V(A) = 5', STATE]
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 51: final recap
  //
  // Restore the original fixed policy and exact state values.
  // The lesson ends with the original warehouse settings.
  // ------------------------------------------------------------

  await until(S(51));

  await play(
    ...clear(
      'policy',
      'valueA',
      'valueB',
      'valueC',
      'valueD'
    ),

    ...allValues(),

    ...say(
      'STATE VALUE',
      STATE
    ),

    ...fbox(
      [
        ['Under our original policy', ACTION],
        ['A = 4     B = 6', STATE],
        ['C = 10    D = 0', STATE],
        'Each value belongs to',
        'a particular starting state.'
      ],
      STATE
    )
  );

  await until(S(51) + 2.15);

  await play(
    ...replace(
      'policy',
      policyPicture()
    ),

    ...say(
      'LONG-RUN MEAN DISCOUNTED RETURN',
      RETURN
    ),

    ...fbox(
      [
        ['Start from a state.', STATE],
        ['Follow a particular policy.', ACTION],
        ['Observe discounted returns.', RETURN],
        ['Find their long-run mean.', STATE]
      ],
      STATE
    )
  );

  await until(S(51) + 4.25);

  await play(
    ...clear('policy'),

    ...valueComparison(true),

    ...say(
      'STATE VALUE DEPENDS ON STATE AND POLICY',
      STATE
    )
  );

  await until(E(51));
}

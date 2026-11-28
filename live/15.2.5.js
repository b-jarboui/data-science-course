// lesson 15.2.5
// Bellman recursion: connecting state values through rewards.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Fixed four-cell warehouse, original policy and discount factor 0.5.
// All calculations use the supplied exact chapter values.
// This is an exact policy-evaluation demonstration, not a learning simulation.
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
  const DISCOUNT = C.violet;
  const DARK = '#17212F';

  // Same warehouse coordinates as the earlier chapter scenes.

  const CX = P ? 0 : -2.65;
  const CY = P ? 0.48 : -0.48;

  const CELL = P ? 2.1 : 1.92;
  const GRID_W = CELL * 2;
  const GRID_H = CELL * 2;

  const PILL = P
    ? [0, 3.78, 0]
    : [0, 1.98, 0];

  const BOXP = P
    ? [0, -3.91, 0]
    : [4.05, -0.50, 0];

  const BOX_W = P
    ? Math.min(FW - 1.10, 6.75)
    : 5.10;

  const say = (s, c = STATE) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Fixed chapter data
  //
  // A  B
  // C  D
  //
  // Every allowed move reaches its intended destination.
  // Entering D earns 10.
  // All other moves earn 0.
  // D is terminal.
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
    A: { right: 0.5, down: 0.5 },
    B: { left: 0.5, down: 0.5 },
    C: { up: 0, right: 1 },
    D: {}
  };

  // Exact state values under the original fixed policy.
  // These are not immediate rewards.

  const V = {
    A: 4,
    B: 6,
    C: 10,
    D: 0
  };

  function rewardFor(next) {
    return next === 'D' ? 10 : 0;
  }

  function moveInfo(s, action, values = V) {
    const next = TRANSITIONS[s][action];

    if (!next) {
      throw new Error(
        `Invalid action: ${s}, ${action}`
      );
    }

    const reward = rewardFor(next);
    const nextValue = values[next];

    const future =
      GAMMA * nextValue;

    const expectedReturn =
      reward + future;

    const probability =
      POLICY[s][action];

    return {
      s,
      action,
      next,
      reward,
      nextValue,
      future,
      expectedReturn,
      probability,
      weightedReturn:
        probability * expectedReturn
    };
  }

  function bellmanValue(s, values = V) {
    if (s === 'D') {
      return 0;
    }

    return Object.keys(
      TRANSITIONS[s]
    ).reduce(
      (sum, action) =>
        sum +
        moveInfo(
          s,
          action,
          values
        ).weightedReturn,
      0
    );
  }

  const C_RIGHT =
    moveInfo('C', 'right');

  const B_DOWN =
    moveInfo('B', 'down');

  const B_LEFT =
    moveInfo('B', 'left');

  const A_RIGHT =
    moveInfo('A', 'right');

  const A_DOWN =
    moveInfo('A', 'down');

  // Verify all supplied exact values before drawing.

  for (const s of NAMES) {
    if (
      Math.abs(
        bellmanValue(s) - V[s]
      ) > 1e-10
    ) {
      throw new Error(
        `Inconsistent Bellman value at ${s}`
      );
    }
  }

  function fmt(n, digits = 4) {
    return Number(
      n.toFixed(digits)
    ).toString();
  }

  function pct(n) {
    return `${Math.round(n * 100)}%`;
  }

  // ------------------------------------------------------------
  // Basic drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    maxw = Infinity,
    mono = false
  ) {
    const t = T(
      String(s),
      size,
      color,
      mono
    );

    if (t.getWidth() > maxw) {
      t.scale(
        maxw / t.getWidth()
      );
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
    x1, y1, x2, y2, color
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

    const a1 =
      angle + Math.PI - 0.50;

    const a2 =
      angle + Math.PI + 0.50;

    return new M.VGroup(
      broken
        ? dashed(
            x1, y1,
            x2, y2,
            color
          )
        : line(
            x1, y1,
            x2, y2,
            color,
            strokeWidth
          ),

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
    const t = pill(
      s,
      color,
      size
    );

    if (t.getWidth() > maxw) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  // ------------------------------------------------------------
  // On-screen object management
  //
  // No existing on-screen object is wrapped in a new VGroup.
  // Replacement groups are always built from fresh objects.
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
    duration = 0.45
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
  // One formula / explanation box
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

    const bg = rect(
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
        t.scale(
          available / tw
        );
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
        bg,
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
        ),

        txt(
          s,
          P ? 30 : 27,
          s === 'D'
            ? DOCK
            : C.ink,
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

    return new M.VGroup(
      ...parts
    );
  }

  // ------------------------------------------------------------
  // Green delivery dock
  //
  // Reward 10 belongs to entering D.
  // V(D) = 0 because no rewards follow arrival.
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

    const bayW =
      CELL * 0.70;

    const bayH =
      CELL * 0.48;

    const left =
      x - bayW / 2;

    const right =
      x + bayW / 2;

    const top =
      y + bayH / 2;

    const bottom =
      y - bayH / 2;

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
  //
  // The cart sits slightly above the state-value badge.
  // Cell values remain visible throughout each move.
  // ------------------------------------------------------------

  function cartPicture(
    x, y, scale = 1
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

  const CART_DY =
    CELL * 0.19;

  function cartAt(s) {
    const [x, y] = POS[s];

    return cartPicture(
      x,
      y + CART_DY,
      0.76
    );
  }

  let cartState = null;
  let deliveryEnded = false;

  // ------------------------------------------------------------
  // State-value badges
  //
  // Cyan always identifies state values.
  // Gold is reserved for rewards on transitions.
  // ------------------------------------------------------------

  function valueBadge(
    s,
    value = V[s],
    large = false
  ) {
    const [px, y] = POS[s];

    // Value badges sit OUTSIDE the grid, beside their cell's row
    // (A and C on the left, B and D on the right), so the moves,
    // chips and cart inside the cells never cover them.
    const w = P ? 1.5 : 1.45;

    const x = (s === 'A' || s === 'C')
      ? CX - GRID_W / 2 - 0.10 - w / 2
      : CX + GRID_W / 2 + 0.10 + w / 2;

    const yy = y;

    const h =
      large ? 0.72 : 0.56;

    const bg = rect(
      x,
      yy,
      w,
      h,
      STATE,
      DARK,
      0.98,
      0.09,
      large ? 3 : 1.5
    );

    const label = txt(
      `V(${s}) = ${fmt(value)}`,
      large
        ? P ? 27 : 24
        : P ? 23 : 21,
      STATE,
      x,
      yy,
      w - 0.18,
      true
    );

    return new M.VGroup(
      bg,
      label
    );
  }

  function revealValue(s) {
    return replace(
      `value${s}`,
      valueBadge(s)
    );
  }

  function allValues() {
    return NAMES.flatMap(
      s => revealValue(s)
    );
  }

  function pulseValue(
    s,
    color = STATE
  ) {
    const obj =
      slots.get(`value${s}`);

    return obj
      ? [
          new M.Indicate(
            obj,
            { color }
          )
        ]
      : [];
  }

  function stateOutline(
    s,
    color = STATE
  ) {
    const [x, y] = POS[s];

    return rect(
      x,
      y,
      CELL - 0.11,
      CELL - 0.11,
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
      stateOutline(
        s,
        color
      )
    );
  }

  function resetCart(s) {
    if (s === 'D') {
      throw new Error(
        'Start a new delivery outside the dock.'
      );
    }

    cartState = s;
    deliveryEnded = false;

    return [
      ...clear(
        'selected',
        'reward',
        'returnBadge',
        'terminal',
        'destinationFocus',
        'probabilities',
        'policyArrows',
        'branches',
        'connections',
        'dependency'
      ),

      ...replace(
        'cart',
        cartAt(s)
      ),

      ...focusState(s)
    ];
  }

  // ------------------------------------------------------------
  // Glowing movement arrows
  //
  // The transition remains deterministic.
  // The percentages beside arrows are policy probabilities,
  // not probabilities that the cart successfully moves.
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

    const length =
      Math.hypot(dx, dy);

    const ux = dx / length;
    const uy = dy / length;

    const nx = -uy;
    const ny = ux;

    const inset =
      CELL * 0.28;

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
        sx, sy,
        ex, ey,
        color,
        strokeWidth,
        0.13,
        broken
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  function probabilityLabel(
    move,
    offset = 0
  ) {
    const {
      sx, sy, ex, ey,
      nx, ny
    } = arrowCoordinates(
      move.s,
      move.next,
      offset
    );

    const [px, py] = chipPos(sx, sy, ex, ey, nx, ny, 1);

    return tag(
      pct(move.probability),
      move.probability === 0
        ? C.muted
        : ACTION,
      P ? 17 : 15,
      px,
      py,
      0.90
    );
  }

  // Chip beside a move arrow. side = +1 (probability) or -1 (reward).
  // Horizontal move: just above / below the arrow.
  // Vertical move: inside the source cell, right / left of the arrow,
  // away from the D letter and the DOCK sign (deeper when on the left).
  function chipPos(sx, sy, ex, ey, nx, ny, side) {
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const vertical = Math.abs(nx) > Math.abs(ny);

    if (!vertical) {
      return [mx + side * nx * 0.29, my + side * ny * 0.29];
    }

    const ux = ny, uy = -nx;
    const sideX = side * nx;
    const back = sideX < 0 ? 0.62 : 0.30;

    return [
      mx - ux * back + side * nx * 0.42,
      my - uy * back + side * ny * 0.42
    ];
  }

  function policyArrows(
    states = ['A', 'B', 'C']
  ) {
    const parts = [];

    for (const s of states) {
      for (
        const action of Object.keys(
          POLICY[s]
        )
      ) {
        const move =
          moveInfo(s, action);

        const reversible =
          Object.values(
            TRANSITIONS[move.next]
          ).includes(s);

        const offset =
          states.length > 1 && reversible
            ? 0.13
            : 0;

        const zero =
          move.probability === 0;

        parts.push(
          moveArrow(
            s,
            move.next,
            zero
              ? C.muted
              : ACTION,
            offset,
            zero ? 1.5 : 3.5,
            zero
          ),

          probabilityLabel(
            move,
            offset
          )
        );
      }
    }

    return new M.VGroup(
      ...parts
    );
  }

  function showPolicy(s) {
    return replace(
      'policyArrows',
      policyArrows([s])
    );
  }

  function selectedArrow(move) {
    return new M.VGroup(
      moveArrow(
        move.s,
        move.next,
        ACTION,
        0,
        5
      ),

      probabilityLabel(move)
    );
  }

  // ------------------------------------------------------------
  // Reward and expected-return badges
  //
  // Reward: gold.
  // Expected return of a chosen action: orange.
  // State value: cyan.
  // ------------------------------------------------------------

  function rewardBadge(move) {
    const {
      sx, sy, ex, ey,
      nx, ny
    } = arrowCoordinates(
      move.s,
      move.next
    );

    const [px, py] = chipPos(sx, sy, ex, ey, nx, ny, -1);

    return tag(
      `+${move.reward}`,
      REWARD,
      P ? 23 : 20,
      px,
      py,
      0.92
    );
  }

  function expectedReturnBadge(move) {
    const [x, y] = POS[move.s];

    return tag(
      `${move.action.toUpperCase()}: ${fmt(move.expectedReturn)}`,
      ACTION,
      P ? 17 : 15,
      x,
      y + CELL * 0.12,
      CELL - 0.24
    );
  }

  function terminalBadge() {
    const [x, y] = POS.D;

    return tag(
      'NO FUTURE REWARDS',
      DOCK,
      P ? 15 : 14,
      x,
      y - CELL / 2 + 0.16,
      CELL - 0.17
    );
  }

  // ------------------------------------------------------------
  // Move the cart along one candidate action
  //
  // Each branch is a separate hypothetical starting situation.
  // The cart is reset before comparing a different branch.
  //
  // Expected future rewards are represented by the known
  // next-state value, rather than by inventing a later route.
  // ------------------------------------------------------------

  async function demonstrateMove(
    move,
    extra = [],
    duration = 0.85,
    revealReward = true
  ) {
    if (deliveryEnded) {
      throw new Error(
        'Delivery has ended. Reset the cart first.'
      );
    }

    if (cartState !== move.s) {
      throw new Error(
        `Cart must start in ${move.s}`
      );
    }

    if (move.probability <= 0) {
      throw new Error(
        'This branch has zero probability under the policy.'
      );
    }

    const cart =
      slots.get('cart');

    if (!cart) {
      throw new Error(
        'Cart is missing from the scene.'
      );
    }

    // First show the selected action.

    await play(
      quick(
        [
          ...clear(
            'policyArrows',
            'reward',
            'returnBadge',
            'destinationFocus'
          ),

          ...replace(
            'selected',
            selectedArrow(move)
          ),

          ...extra
        ],
        0.27
      )
    );

    // Then move to the deterministic destination.

    cartState = move.next;

    deliveryEnded =
      move.next === 'D';

    await play(
      quick(
        [
          new M.Transform(
            cart,
            cartAt(move.next)
          ),

          ...replace(
            'destinationFocus',
            stateOutline(
              move.next,
              deliveryEnded
                ? DOCK
                : DISCOUNT
            )
          ),

          ...(
            revealReward
              ? replace(
                  'reward',
                  rewardBadge(move)
                )
              : []
          )
        ],
        duration
      )
    );
  }

  // ------------------------------------------------------------
  // Previous lesson: sample returns and their mean
  //
  // These are the original four narrated returns.
  // No new or invented observations are added.
  // ------------------------------------------------------------

  function previousReturnsPicture() {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.65 : 3.30;

    const returns = [
      5, 5, 1.25, 5
    ];

    const mean =
      returns.reduce(
        (sum, v) => sum + v,
        0
      ) / returns.length;

    const bg = rect(
      x, y,
      w, h,
      STATE,
      C.card,
      0.97,
      0.18,
      2
    );

    const left =
      x - w / 2 + 0.38;

    const right =
      x + w / 2 - 0.38;

    const base =
      y - h / 2 + 0.71;

    const top =
      y + h / 2 - 0.72;

    const chartH =
      top - base;

    const spacing =
      (right - left) / 4;

    const barW =
      Math.min(
        0.65,
        spacing * 0.65
      );

    const parts = [
      bg,

      txt(
        'LAST LESSON: FOUR RETURNS',
        P ? 22 : 20,
        STATE,
        x,
        y + h / 2 - 0.28,
        w - 0.35,
        true
      ),

      line(
        left, base,
        right, base,
        C.muted,
        2
      )
    ];

    returns.forEach(
      (value, k) => {
        const xx =
          left + (k + 0.5) * spacing;

        const bh =
          chartH * value / 6;

        parts.push(
          block(
            xx,
            base + bh / 2,
            barW,
            bh,
            DISCOUNT,
            DISCOUNT,
            0.80,
            1
          ),

          txt(
            fmt(value),
            P ? 20 : 18,
            DISCOUNT,
            xx,
            base + bh + 0.16,
            spacing - 0.10,
            true
          ),

          txt(
            String(k + 1),
            P ? 16 : 15,
            C.muted,
            xx,
            base - 0.18,
            spacing - 0.10,
            true
          )
        );
      }
    );

    const meanY =
      base + chartH * mean / 6;

    parts.push(
      dashed(
        left,
        meanY,
        right,
        meanY,
        STATE
      ),

      txt(
        `Estimated V(A) = ${fmt(mean)}`,
        P ? 22 : 20,
        STATE,
        x,
        y - h / 2 + 0.22,
        w - 0.35,
        true
      )
    );

    return replace(
      'box',
      new M.VGroup(
        ...parts
      )
    );
  }

  // ------------------------------------------------------------
  // Money-today / money-tomorrow analogy
  //
  // No arbitrary money amounts are introduced.
  // The picture separates present reward from future value.
  // ------------------------------------------------------------

  function coinStack(
    x,
    y,
    color,
    count = 3
  ) {
    const coins = [];

    for (
      let k = 0;
      k < count;
      k++
    ) {
      const yy =
        y + k * 0.10;

      coins.push(
        rect(
          x,
          yy,
          0.58,
          0.17,
          color,
          color,
          0.25,
          0.075,
          1.5
        )
      );
    }

    return new M.VGroup(
      ...coins
    );
  }

  function moneyPicture(stage = 0) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = 2.70;

    const bg = rect(
      x, y,
      w, h,
      DISCOUNT,
      C.card,
      0.97,
      0.18,
      2
    );

    const leftX =
      x - w * 0.25;

    const rightX =
      x + w * 0.25;

    const rowY =
      y + 0.04;

    const parts = [
      bg,

      txt(
        'TODAY AND TOMORROW',
        P ? 23 : 21,
        C.ink,
        x,
        y + h / 2 - 0.29,
        w - 0.35,
        true
      ),

      txt(
        'Today',
        P ? 22 : 20,
        REWARD,
        leftX,
        rowY + 0.59,
        w * 0.38
      ),

      txt(
        'Tomorrow',
        P ? 22 : 20,
        DISCOUNT,
        rightX,
        rowY + 0.59,
        w * 0.38
      ),

      coinStack(
        leftX,
        rowY - 0.07,
        REWARD,
        3
      ),

      coinStack(
        rightX,
        rowY - 0.07,
        DISCOUNT,
        3
      ),

      txt(
        '+',
        P ? 30 : 27,
        C.ink,
        x,
        rowY + 0.06,
        0.45,
        true
      ),

      txt(
        'Money now',
        P ? 19 : 17,
        REWARD,
        leftX,
        rowY - 0.45,
        w * 0.43
      ),

      txt(
        'Money later',
        P ? 19 : 17,
        DISCOUNT,
        rightX,
        rowY - 0.45,
        w * 0.43
      )
    ];

    parts.push(
      txt(
        stage === 0
          ? 'Two times, two sources of value'
          : stage === 1
            ? 'Present money + value of later money'
            : 'Immediate reward + discounted future value',
        P ? 20 : 18,
        stage === 2
          ? STATE
          : DISCOUNT,
        x,
        y - h / 2 + 0.28,
        w - 0.35
      )
    );

    return replace(
      'box',
      new M.VGroup(
        ...parts
      )
    );
  }

  // ------------------------------------------------------------
  // One move's expected return
  //
  // Stage 0: immediate reward.
  // Stage 1: reveal next-state value.
  // Stage 2: discount the next-state value.
  // Stage 3: combine immediate and future parts.
  //
  // Gold: immediate reward.
  // Cyan: next-state value.
  // Purple: discounted future contribution.
  // Orange: total expected return for the action.
  // ------------------------------------------------------------

  function moveReturnPicture(
    move,
    stage = 3
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.72 : 3.12;

    const bg = rect(
      x, y,
      w, h,
      ACTION,
      C.card,
      0.97,
      0.18,
      2
    );

    const parts = [
      bg,

      txt(
        `${move.s} → ${move.next}  (${move.action})`,
        P ? 23 : 21,
        ACTION,
        x,
        y + h / 2 - 0.28,
        w - 0.35,
        true
      )
    ];

    const leftX =
      x - w * 0.25;

    const rightX =
      x + w * 0.25;

    const rowY =
      y + 0.16;

    const tileW =
      w / 2 - 0.52;

    const tileH =
      P ? 1.22 : 1.38;

    parts.push(
      rect(
        leftX,
        rowY,
        tileW,
        tileH,
        REWARD,
        REWARD,
        0.075,
        0.12,
        2
      ),

      rect(
        rightX,
        rowY,
        tileW,
        tileH,
        stage >= 2
          ? DISCOUNT
          : STATE,
        stage >= 2
          ? DISCOUNT
          : STATE,
        0.075,
        0.12,
        2
      ),

      txt(
        'Reward now',
        P ? 19 : 17,
        REWARD,
        leftX,
        rowY + tileH / 2 - 0.23,
        tileW - 0.15
      ),

      txt(
        fmt(move.reward),
        P ? 37 : 33,
        REWARD,
        leftX,
        rowY - 0.13,
        tileW - 0.20,
        true
      ),

      txt(
        '+',
        P ? 30 : 27,
        C.ink,
        x,
        rowY,
        0.36,
        true
      ),

      txt(
        stage >= 2
          ? 'Discounted future'
          : 'Next-cell value',
        P ? 19 : 17,
        stage >= 2
          ? DISCOUNT
          : STATE,
        rightX,
        rowY + tileH / 2 - 0.23,
        tileW - 0.15
      )
    );

    if (stage === 0) {
      parts.push(
        txt(
          '?',
          P ? 36 : 32,
          C.muted,
          rightX,
          rowY - 0.13,
          tileW - 0.20,
          true
        )
      );
    }

    if (stage === 1) {
      parts.push(
        txt(
          `V(${move.next}) = ${fmt(move.nextValue)}`,
          P ? 25 : 22,
          STATE,
          rightX,
          rowY - 0.13,
          tileW - 0.20,
          true
        )
      );
    }

    if (stage >= 2) {
      parts.push(
        txt(
          `0.5 × ${fmt(move.nextValue)}`,
          P ? 21 : 19,
          DISCOUNT,
          rightX,
          rowY + 0.02,
          tileW - 0.20,
          true
        ),

        txt(
          `= ${fmt(move.future)}`,
          P ? 29 : 26,
          DISCOUNT,
          rightX,
          rowY - 0.33,
          tileW - 0.20,
          true
        )
      );
    }

    const footer =
      stage === 0
        ? 'First: observe the immediate reward'
        : stage === 1
          ? 'Future rewards start in the next cell'
          : stage === 2
            ? 'Give later rewards half the weight'
            : `${fmt(move.reward)} + ${fmt(move.future)} = ${fmt(move.expectedReturn)}`;

    parts.push(
      txt(
        footer,
        stage === 3
          ? P ? 29 : 26
          : P ? 20 : 18,
        stage === 3
          ? ACTION
          : DISCOUNT,
        x,
        y - h / 2 + 0.33,
        w - 0.30,
        stage === 3
      )
    );

    return replace(
      'box',
      new M.VGroup(
        ...parts
      )
    );
  }

  // ------------------------------------------------------------
  // Discount transformation
  //
  // Show the next state's full value as a bar of ten-based scale.
  // The purple bar has exactly half its length.
  //
  // This visual represents weighting, not losing actual points.
  // ------------------------------------------------------------

  function discountPicture(
    move,
    revealHalf = true
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 3.05 : 3.30;

    const bg = rect(
      x, y,
      w, h,
      DISCOUNT,
      C.card,
      0.97,
      0.18,
      2
    );

    const barW =
      w - 0.70;

    const left =
      x - barW / 2;

    const fullW =
      barW * move.nextValue / 10;

    const halfW =
      barW * move.future / 10;

    const y1 =
      y + 0.43;

    const y2 =
      y - 0.55;

    const barH = 0.24;

    const parts = [
      bg,

      txt(
        'GIVE LATER REWARDS HALF WEIGHT',
        P ? 22 : 20,
        DISCOUNT,
        x,
        y + h / 2 - 0.27,
        w - 0.35,
        true
      ),

      txt(
        `V(${move.next}) = ${fmt(move.nextValue)}`,
        P ? 22 : 20,
        STATE,
        x,
        y1 + 0.29,
        w - 0.45,
        true
      ),

      block(
        x,
        y1 - 0.05,
        barW,
        barH,
        C.muted,
        C.muted,
        0.10
      ),

      txt(
        revealHalf
          ? `0.5 × ${fmt(move.nextValue)} = ${fmt(move.future)}`
          : `0.5 × ${fmt(move.nextValue)}`,
        P ? 23 : 21,
        DISCOUNT,
        x,
        // Below the half bar: the dashed guide line runs above it.
        y2 - 0.40,
        w - 0.45,
        true
      ),

      block(
        x,
        y2 - 0.05,
        barW,
        barH,
        C.muted,
        C.muted,
        0.10
      )
    ];

    if (fullW > 0) {
      parts.push(
        block(
          left + fullW / 2,
          y1 - 0.05,
          fullW,
          barH,
          STATE,
          STATE,
          0.91
        )
      );
    }

    if (revealHalf && halfW > 0) {
      parts.push(
        block(
          left + halfW / 2,
          y2 - 0.05,
          halfW,
          barH,
          DISCOUNT,
          DISCOUNT,
          0.91
        )
      );
    }

    if (revealHalf) {
      parts.push(
        dashed(
          left + halfW,
          y2 + 0.09,
          left + halfW,
          y1 - 0.19,
          DISCOUNT
        )
      );
    }

    parts.push(
      txt(
        'Discount factor = 0.5',
        P ? 19 : 17,
        DISCOUNT,
        x,
        y - h / 2 + 0.22,
        w - 0.35,
        true
      )
    );

    return replace(
      'box',
      new M.VGroup(
        ...parts
      )
    );
  }

  // ------------------------------------------------------------
  // Two candidate moves from one state
  //
  // The cart remains at the source while comparing branches.
  // Each candidate's return is attached to its action.
  // ------------------------------------------------------------

  function branchPicture(
    first,
    second
  ) {
    const moves = [
      first,
      second
    ];

    const parts = [];

    for (const move of moves) {
      const {
        sx, sy, ex, ey,
        nx, ny
      } = arrowCoordinates(
        move.s,
        move.next
      );

      const mx =
        (sx + ex) / 2;

      const my =
        (sy + ey) / 2;

      parts.push(
        moveArrow(
          move.s,
          move.next,
          ACTION,
          0,
          4
        ),

        // The return of each move is shown in the side box
        // (no unexplained "G:" chip on the grid).
        probabilityLabel(move)
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  // ------------------------------------------------------------
  // Equal-probability mean
  //
  // Purple/amber colours distinguish contributions.
  // Both full action returns are orange.
  //
  // Stage 0: compare full action returns.
  // Stage 1: give both equal 50% weight.
  // Stage 2: add the two unweighted returns.
  // Stage 3: divide by two to recover the state value.
  // ------------------------------------------------------------

  function meanPicture(
    first,
    second,
    stage = 0
  ) {
    const s = first.s;

    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.78 : 3.35;

    const bg = rect(
      x, y,
      w, h,
      stage >= 3
        ? STATE
        : ACTION,
      C.card,
      0.97,
      0.18,
      2
    );

    const left =
      x - w / 2 + 0.49;

    const right =
      x + w / 2 - 0.35;

    const base =
      y - h / 2 + 0.89;

    const top =
      y + h / 2 - 0.72;

    const chartH =
      top - base;

    const colSpacing =
      (right - left) / 2;

    const barW =
      Math.min(
        0.70,
        colSpacing * 0.52
      );

    const mean =
      bellmanValue(s);

    const sum =
      first.expectedReturn +
      second.expectedReturn;

    const parts = [
      bg,

      txt(
        `TWO MOVES FROM ${s}`,
        P ? 23 : 21,
        STATE,
        x,
        y + h / 2 - 0.28,
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

    [first, second].forEach(
      (move, k) => {
        const xx =
          left +
          (k + 0.5) * colSpacing;

        const fullHeight =
          chartH *
          move.expectedReturn / 12;

        const weightedHeight =
          chartH *
          move.weightedReturn / 12;

        parts.push(
          block(
            xx,
            base + fullHeight / 2,
            barW,
            fullHeight,
            ACTION,
            ACTION,
            stage === 1
              ? 0.20
              : 0.84,
            1
          ),

          txt(
            fmt(move.expectedReturn),
            P ? 24 : 21,
            ACTION,
            xx,
            base + fullHeight + 0.17,
            colSpacing - 0.12,
            true
          ),

          txt(
            move.action,
            P ? 19 : 17,
            ACTION,
            xx,
            base - 0.20,
            colSpacing - 0.12
          )
        );

        if (stage === 1) {
          parts.push(
            block(
              xx,
              base + weightedHeight / 2,
              barW,
              weightedHeight,
              DISCOUNT,
              DISCOUNT,
              0.95,
              1
            ),

            txt(
              `50% × ${fmt(move.expectedReturn)}`,
              P ? 17 : 16,
              DISCOUNT,
              xx,
              base - 0.48,
              colSpacing - 0.13,
              true
            )
          );
        }
      }
    );

    if (stage >= 3) {
      const meanY =
        base +
        chartH * mean / 12;

      parts.push(
        dashed(
          left,
          meanY,
          right,
          meanY,
          STATE
        ),

        txt(
          `V(${s}) = ${fmt(mean)}`,
          P ? 20 : 18,
          STATE,
          x,
          meanY + 0.17,
          colSpacing - 0.10,
          true
        )
      );
    }

    let footer;

    if (stage === 0) {
      footer =
        `${fmt(first.expectedReturn)} and ${fmt(second.expectedReturn)}`;
    } else if (stage === 1) {
      footer =
        'Both moves have probability 50%';
    } else if (stage === 2) {
      footer =
        `${fmt(first.expectedReturn)} + ${fmt(second.expectedReturn)} = ${fmt(sum)}`;
    } else {
      footer =
        `${fmt(sum)} ÷ 2 = ${fmt(mean)}`;
    }

    parts.push(
      txt(
        footer,
        stage >= 2
          ? P ? 26 : 23
          : P ? 20 : 18,
        stage >= 3
          ? STATE
          : ACTION,
        x,
        y - h / 2 + 0.19,
        w - 0.30,
        true
      )
    );

    return replace(
      'box',
      new M.VGroup(
        ...parts
      )
    );
  }

  // ------------------------------------------------------------
  // Connections between state values
  //
  // Dependency arrows use purple.
  // Movement arrows remain orange.
  //
  // Only nonzero policy-probability branches contribute.
  // C's allowed up action has probability zero, so it does
  // not appear as a dependency in this picture.
  // ------------------------------------------------------------

  function dependencyPicture() {
    const dependencies = [
      ['A', 'B'],
      ['A', 'C'],
      ['B', 'A'],
      ['B', 'D'],
      ['C', 'D']
    ];

    const parts = [];

    for (
      const [from, to] of dependencies
    ) {
      const reversible =
        dependencies.some(
          ([a, b]) =>
            a === to && b === from
        );

      parts.push(
        moveArrow(
          from,
          to,
          DISCOUNT,
          reversible ? 0.13 : 0,
          3.2
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  function dependencyCycle() {
    return new M.VGroup(
      moveArrow(
        'A',
        'B',
        DISCOUNT,
        0.16,
        5
      ),

      moveArrow(
        'B',
        'A',
        DISCOUNT,
        0.16,
        5
      )
    );
  }

  // ------------------------------------------------------------
  // Simultaneous Bellman equations
  //
  // D = 0
  // C = 10 + 0.5D
  //
  // B = 0.5(10 + 0.5D) + 0.5(0 + 0.5A)
  //   = 5 + 0.25A
  //
  // A = 0.5(0 + 0.5B) + 0.5(0 + 0.5C)
  //   = 0.25B + 0.25C
  //
  // All four equations hold at the same time.
  // ------------------------------------------------------------

  function equationsBox(
    substituteNumbers = false
  ) {
    if (!substituteNumbers) {
      return fbox(
        [
          ['All equations together', STATE],
          ['D = 0', STATE],
          ['C = 10 + 0.5D', STATE],
          ['B = 5 + 0.25A', STATE],
          ['A = 0.25B + 0.25C', STATE],
          'Same fixed policy'
        ],
        DISCOUNT
      );
    }

    return fbox(
      [
        ['Check exact values', STATE],
        ['D = 0', STATE],
        ['C = 10 + 0.5 × 0 = 10', STATE],
        ['B = 5 + 0.25 × 4 = 6', STATE],
        ['A = 0.25 × 6 + 0.25 × 10', STATE],
        ['  = 4', STATE]
      ],
      DOCK
    );
  }

  // ------------------------------------------------------------
  // Solve the coupled equations directly
  //
  // No complete-route enumeration is required.
  // The algebra uses the original fixed policy.
  // ------------------------------------------------------------

  function solveBox(stage = 0) {
    if (stage === 0) {
      return fbox(
        [
          ['Use D = 0 and C = 10', STATE],
          'B = 5 + 0.25A',
          'A = 0.25B + 2.5',
          'Solve these two together.'
        ],
        DISCOUNT
      );
    }

    if (stage === 1) {
      return fbox(
        [
          ['Substitute the rule for B', DISCOUNT],
          'A = 0.25(5 + 0.25A) + 2.5',
          'A = 3.75 + 0.0625A',
          '0.9375A = 3.75',
          ['A = 4', STATE]
        ],
        DISCOUNT
      );
    }

    return fbox(
      [
        ['Substitute A = 4', STATE],
        'B = 5 + 0.25 × 4',
        ['B = 6', STATE],
        ['C = 10     D = 0', STATE],
        ['All four equations agree.', DOCK]
      ],
      STATE
    );
  }

  // ------------------------------------------------------------
  // Fixed-policy mean versus choosing the maximum
  //
  // These are NOT the same operation.
  //
  // At B:
  // Down return = 10
  // Left return = 2
  // Fixed-policy value = 6
  //
  // Simply choosing 10 instead of averaging would evaluate
  // a different decision rule.
  // ------------------------------------------------------------

  function policyVsMaxPicture() {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.76 : 3.30;

    const bg = rect(
      x, y,
      w, h,
      DISCOUNT,
      C.card,
      0.97,
      0.18,
      2
    );

    const leftX =
      x - w / 4;

    const rightX =
      x + w / 4;

    const rowY =
      y + 0.15;

    const tileW =
      w / 2 - 0.36;

    const tileH =
      P ? 1.47 : 1.76;

    return replace(
      'box',
      new M.VGroup(
        bg,

        txt(
          'EVALUATION IS NOT OPTIMISATION',
          P ? 22 : 20,
          DISCOUNT,
          x,
          y + h / 2 - 0.28,
          w - 0.35,
          true
        ),

        rect(
          leftX,
          rowY,
          tileW,
          tileH,
          STATE,
          STATE,
          0.08,
          0.12,
          2
        ),

        rect(
          rightX,
          rowY,
          tileW,
          tileH,
          ACTION,
          ACTION,
          0.08,
          0.12,
          2
        ),

        txt(
          'Fixed policy',
          P ? 21 : 19,
          STATE,
          leftX,
          rowY + tileH / 2 - 0.25,
          tileW - 0.18
        ),

        txt(
          'Choose best',
          P ? 21 : 19,
          ACTION,
          rightX,
          rowY + tileH / 2 - 0.25,
          tileW - 0.18
        ),

        txt(
          '(10 + 2) ÷ 2',
          P ? 19 : 17,
          C.ink,
          leftX,
          rowY + 0.01,
          tileW - 0.18,
          true
        ),

        txt(
          'max(10, 2)',
          P ? 19 : 17,
          C.ink,
          rightX,
          rowY + 0.01,
          tileW - 0.18,
          true
        ),

        txt(
          '6',
          P ? 37 : 33,
          STATE,
          leftX,
          rowY - tileH / 2 + 0.29,
          tileW - 0.18,
          true
        ),

        txt(
          '10',
          P ? 37 : 33,
          ACTION,
          rightX,
          rowY - tileH / 2 + 0.29,
          tileW - 0.18,
          true
        ),

        txt(
          'Different rules answer different questions.',
          P ? 19 : 17,
          C.muted,
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
  // 0: Our delivery cart is back in the warehouse.
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

    ...say(
      'BACK IN OUR WAREHOUSE',
      STATE
    ),

    ...fbox(
      [
        ['Our delivery cart', WHITE],
        'Same four cells.',
        ['Enter D: reward 10', REWARD],
        'Every other move: 0'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 1: In the last lesson, we watched many deliveries
  // to estimate the value of each cell.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...previousReturnsPicture(),

    ...say(
      'ESTIMATE VALUES FROM DELIVERY RETURNS',
      STATE
    )
  );

  await until(S(1) + 2.55);

  await play(
    ...fbox(
      [
        ['Last lesson', STATE],
        'Start from a cell.',
        'Follow the fixed policy.',
        ['Observe discounted returns.', DISCOUNT],
        'Estimate the mean return.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 2: Can we find values without watching every route?
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...say(
      'CAN WE CALCULATE WITHOUT EVERY ROUTE?',
      DISCOUNT
    ),

    ...fbox(
      [
        ['A different approach', DISCOUNT],
        'Instead of sampling',
        'more and more deliveries,',
        'connect the cell values.'
      ],
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 3: Draw the four cells and their exact values.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...clear(
      'cart',
      'focus'
    ),

    ...replace(
      'allCells',
      new M.VGroup(
        ...NAMES.map(
          s => stateOutline(
            s,
            s === 'D'
              ? DOCK
              : STATE
          )
        )
      )
    ),

    ...say(
      'EXACT STATE VALUES',
      STATE
    ),

    ...fbox(
      [
        ['Original fixed policy', ACTION],
        ['Discount factor = 0.5', DISCOUNT],
        'Recall the exact values',
        'from the previous lesson.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 4: Cell A has a value of four.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    quick(
      [
        ...clear('allCells'),
        ...revealValue('A'),
        ...focusState('A'),

        ...say(
          'V(A) = 4',
          STATE
        ),

        ...fbox(
          [
            ['Starting cell A', STATE],
            ['V(A) = 4', STATE]
          ],
          STATE
        )
      ],
      0.60
    )
  );

  // ------------------------------------------------------------
  // 5: Cell B has a value of six.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    quick(
      [
        ...revealValue('B'),
        ...focusState('B'),

        ...say(
          'V(B) = 6',
          STATE
        ),

        ...fbox(
          [
            ['Starting cell B', STATE],
            ['V(B) = 6', STATE]
          ],
          STATE
        )
      ],
      0.60
    )
  );

  // ------------------------------------------------------------
  // 6: Cell C has a value of ten.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    quick(
      [
        ...revealValue('C'),
        ...focusState('C'),

        ...say(
          'V(C) = 10',
          STATE
        ),

        ...fbox(
          [
            ['Starting cell C', STATE],
            ['V(C) = 10', STATE]
          ],
          STATE
        )
      ],
      0.60
    )
  );

  // ------------------------------------------------------------
  // 7: Cell D has a value of zero.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    quick(
      [
        ...revealValue('D'),
        ...focusState('D', DOCK),

        ...say(
          'V(D) = 0',
          STATE
        ),

        ...fbox(
          [
            ['Terminal cell D', DOCK],
            ['V(D) = 0', STATE],
            'No future rewards.'
          ],
          STATE
        )
      ],
      0.65
    )
  );

  // ------------------------------------------------------------
  // 8: Discover how the four numbers are connected.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...clear('focus'),

    ...replace(
      'connections',
      dependencyPicture()
    ),

    ...say(
      'HOW ARE THESE VALUES CONNECTED?',
      DISCOUNT
    ),

    ...fbox(
      [
        ['A = 4     B = 6', STATE],
        ['C = 10    D = 0', STATE],
        'These four numbers',
        'are related to each other.'
      ],
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 9: Imagine receiving money today and tomorrow.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...clear('connections'),

    ...moneyPicture(0),

    ...say(
      'MONEY TODAY AND MONEY TOMORROW',
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 10: Present value includes money now and money later.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...moneyPicture(1),

    ...say(
      'VALUE NOW + VALUE EXPECTED LATER',
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 11: The cart can think about rewards in a similar way.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...moneyPicture(2),

    ...say(
      'REWARD NOW + DISCOUNTED VALUE LATER',
      STATE
    )
  );

  // ============================================================
  // CELL C
  //
  // Right has probability 100%.
  // Up has probability 0%.
  //
  // 10 + 0.5 × V(D)
  // = 10 + 0.5 × 0
  // = 10
  // ============================================================

  // ------------------------------------------------------------
  // 12: Place the cart in C.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...resetCart('C'),

    ...say(
      'START IN CELL C',
      STATE
    ),

    ...fbox(
      [
        ['Current state = C', STATE],
        ['Known value = 10', STATE],
        'Let us explain this value.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 13: The policy always moves right to the dock.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...showPolicy('C'),

    ...say(
      'C: RIGHT WITH PROBABILITY 100%',
      ACTION
    ),

    ...fbox(
      [
        ['Policy at C', ACTION],
        ['Right → D: 100%', ACTION],
        ['Up → A: 0%', C.muted],
        'Only right is chosen.'
      ],
      ACTION
    )
  );

  await until(S(13) + 1.65);

  await demonstrateMove(
    C_RIGHT,
    [],
    0.85,
    false
  );

  // ------------------------------------------------------------
  // 14: The reward for this move is ten.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    quick(
      [
        ...replace(
          'reward',
          rewardBadge(C_RIGHT)
        ),

        ...moveReturnPicture(
          C_RIGHT,
          0
        ),

        ...say(
          'IMMEDIATE REWARD = 10',
          REWARD
        )
      ],
      0.65
    )
  );

  // ------------------------------------------------------------
  // 15: No more rewards after reaching D.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...replace(
      'terminal',
      terminalBadge()
    ),

    ...pulseValue('D'),

    ...moveReturnPicture(
      C_RIGHT,
      1
    ),

    ...say(
      'AFTER THE DOCK: FUTURE VALUE = 0',
      STATE
    )
  );

  await until(S(15) + 1.90);

  await play(
    ...moveReturnPicture(
      C_RIGHT,
      2
    )
  );

  // ------------------------------------------------------------
  // 16: C has value 10 + 0 = 10.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...clear(
      'cart',
      'destinationFocus',
      'terminal'
    ),

    ...focusState('C'),
    ...pulseValue('C'),

    ...moveReturnPicture(
      C_RIGHT,
      3
    ),

    ...say(
      '10 + 0 = 10',
      STATE
    )
  );

  await until(S(16) + 1.65);

  await play(
    ...fbox(
      [
        ['Right has probability 100%', ACTION],
        ['V(C) = 10 + 0.5 × V(D)', STATE],
        '     = 10 + 0.5 × 0',
        ['     = 10', STATE]
      ],
      STATE
    )
  );

  // ============================================================
  // CELL B
  //
  // Down: 10 + 0.5 × 0 = 10
  // Left:  0 + 0.5 × 4 = 2
  //
  // Both actions have probability 50%.
  //
  // V(B) = 0.5 × 10 + 0.5 × 2 = 6
  // ============================================================

  // ------------------------------------------------------------
  // 17: Place the cart in B.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    quick(
      [
        ...resetCart('B'),

        ...say(
          'NOW START IN CELL B',
          STATE
        ),

        ...fbox(
          [
            ['Current state = B', STATE],
            'Why is its value six?'
          ],
          STATE
        )
      ],
      0.60
    )
  );

  // ------------------------------------------------------------
  // 18: Two possible moves, each with probability 50%.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...showPolicy('B'),

    ...say(
      'B: TWO MOVES, EACH 50%',
      ACTION
    ),

    ...fbox(
      [
        ['Policy at B', ACTION],
        ['Down → D: 50%', ACTION],
        ['Left → A: 50%', ACTION],
        'Consider both possible moves.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 19: Down reaches D and earns ten.
  // ------------------------------------------------------------

  await until(S(19));

  await demonstrateMove(
    B_DOWN,
    say(
      'B → D: REWARD 10',
      REWARD
    ),
    0.90
  );

  await play(
    quick(
      moveReturnPicture(
        B_DOWN,
        0
      ),
      0.40
    )
  );

  // ------------------------------------------------------------
  // 20: No rewards after reaching the dock.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    quick(
      [
        ...replace(
          'terminal',
          terminalBadge()
        ),

        ...pulseValue('D'),

        ...moveReturnPicture(
          B_DOWN,
          2
        ),

        ...say(
          'NEXT VALUE = 0',
          STATE
        )
      ],
      0.75
    )
  );

  // ------------------------------------------------------------
  // 21: Choosing down gives a return of ten.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    quick(
      [
        ...replace(
          'returnBadge',
          expectedReturnBadge(B_DOWN)
        ),

        ...moveReturnPicture(
          B_DOWN,
          3
        ),

        ...say(
          'DOWN: EXPECTED RETURN = 10',
          ACTION
        )
      ],
      0.70
    )
  );

  // ------------------------------------------------------------
  // 22: Left reaches A and earns zero.
  //
  // Reset to B before showing this alternative.
  // Do not move out of terminal D.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    quick(
      [
        ...resetCart('B'),

        ...say(
          'ALTERNATIVE MOVE: LEFT FROM B',
          ACTION
        ),

        ...fbox(
          [
            ['Consider the other possibility', ACTION],
            'Start again at B.',
            ['Choose left.', ACTION]
          ],
          ACTION
        )
      ],
      0.48
    )
  );

  await demonstrateMove(
    B_LEFT,
    [],
    0.85
  );

  await play(
    quick(
      [
        ...moveReturnPicture(
          B_LEFT,
          0
        ),

        ...say(
          'B → A: REWARD 0',
          REWARD
        )
      ],
      0.50
    )
  );

  // ------------------------------------------------------------
  // 23: A has value four, representing future rewards.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...pulseValue('A'),

    ...moveReturnPicture(
      B_LEFT,
      1
    ),

    ...say(
      'A HAS FUTURE VALUE 4',
      STATE
    )
  );

  await until(S(23) + 2.30);

  await play(
    ...fbox(
      [
        ['Immediate reward = 0', REWARD],
        ['Next state = A', STATE],
        ['V(A) = 4', STATE],
        'Expected rewards from A,',
        'not a reward already received.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 24: Discount the next state's value.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...discountPicture(
      B_LEFT,
      false
    ),

    ...say(
      'LATER VALUE × DISCOUNT FACTOR',
      DISCOUNT
    )
  );

  await until(S(24) + 2.65);

  await play(
    ...fbox(
      [
        ['Future value at A = 4', STATE],
        ['Discount factor = 0.5', DISCOUNT],
        ['Discounted value = 0.5 × 4', DISCOUNT],
        'Future rewards are one move later.'
      ],
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 25: Half of four is two.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    quick(
      [
        ...discountPicture(
          B_LEFT,
          true
        ),

        ...say(
          '0.5 × 4 = 2',
          DISCOUNT
        )
      ],
      0.50
    )
  );

  // ------------------------------------------------------------
  // 26: Zero plus two gives expected return two.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...replace(
      'returnBadge',
      expectedReturnBadge(B_LEFT)
    ),

    ...moveReturnPicture(
      B_LEFT,
      3
    ),

    ...say(
      'LEFT: EXPECTED RETURN = 2',
      ACTION
    )
  );

  await until(S(26) + 2.15);

  await play(
    ...fbox(
      [
        ['B, choose left', ACTION],
        ['Immediate reward = 0', REWARD],
        ['Discounted future = 0.5 × 4', DISCOUNT],
        ['Expected return = 0 + 2 = 2', ACTION]
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 27: Compare down = ten and left = two.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...resetCart('B'),

    ...replace(
      'branches',
      branchPicture(
        B_DOWN,
        B_LEFT
      )
    ),

    ...meanPicture(
      B_DOWN,
      B_LEFT,
      0
    ),

    ...say(
      'DOWN = 10     LEFT = 2',
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 28: Both moves have equal chances.
  // Give their returns equal importance.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...meanPicture(
      B_DOWN,
      B_LEFT,
      1
    ),

    ...say(
      'EQUAL CHANCES: GIVE EACH 50% WEIGHT',
      DISCOUNT
    )
  );

  await until(S(28) + 2.55);

  await play(
    ...fbox(
      [
        ['Down: 50% × 10', ACTION],
        ['Left: 50% × 2', ACTION],
        'Both probabilities are equal.',
        ['Take the arithmetic mean.', STATE]
      ],
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 29: Ten plus two equals twelve.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    quick(
      [
        ...meanPicture(
          B_DOWN,
          B_LEFT,
          2
        ),

        ...say(
          '10 + 2 = 12',
          ACTION
        )
      ],
      0.65
    )
  );

  // ------------------------------------------------------------
  // 30: Twelve divided by two equals six.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...meanPicture(
      B_DOWN,
      B_LEFT,
      3
    ),

    ...say(
      '12 ÷ 2 = 6',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 31: This matches the original value of B.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...clear('cart'),

    ...pulseValue('B'),

    ...say(
      'MATCHES V(B) = 6',
      STATE
    ),

    ...fbox(
      [
        ['Under our fixed policy', ACTION],
        'V(B) = 0.5 × 10 + 0.5 × 2',
        '     = 5 + 1',
        ['     = 6', STATE],
        ['Matches the known value.', DOCK]
      ],
      STATE
    )
  );

  // ============================================================
  // CELL A
  //
  // Right: 0 + 0.5 × 6 = 3
  // Down:  0 + 0.5 × 10 = 5
  //
  // Both actions have probability 50%.
  //
  // V(A) = 0.5 × 3 + 0.5 × 5 = 4
  // ============================================================

  // ------------------------------------------------------------
  // 32: Place the cart in A.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    quick(
      [
        ...resetCart('A'),

        ...showPolicy('A'),

        ...say(
          'NOW START IN CELL A',
          STATE
        ),

        ...fbox(
          [
            ['Current state = A', STATE],
            ['Right: 50%', ACTION],
            ['Down: 50%', ACTION]
          ],
          STATE
        )
      ],
      0.65
    )
  );

  // ------------------------------------------------------------
  // 33: Right earns zero and takes the cart to B.
  // ------------------------------------------------------------

  await until(S(33));

  await demonstrateMove(
    A_RIGHT,
    say(
      'A → B: REWARD 0',
      REWARD
    ),
    0.85
  );

  await play(
    quick(
      moveReturnPicture(
        A_RIGHT,
        1
      ),
      0.45
    )
  );

  // ------------------------------------------------------------
  // 34: Half of B's value of six is three.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...pulseValue('B'),

    ...discountPicture(
      A_RIGHT,
      true
    ),

    ...say(
      '0.5 × 6 = 3',
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 35: Choosing right gives expected return three.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...replace(
      'returnBadge',
      expectedReturnBadge(A_RIGHT)
    ),

    ...moveReturnPicture(
      A_RIGHT,
      3
    ),

    ...say(
      'RIGHT: EXPECTED RETURN = 3',
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 36: Down earns zero and takes the cart to C.
  //
  // Reset to A before demonstrating this alternative.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    quick(
      [
        ...resetCart('A'),

        ...say(
          'ALTERNATIVE MOVE: DOWN FROM A',
          ACTION
        )
      ],
      0.45
    )
  );

  await demonstrateMove(
    A_DOWN,
    [],
    0.85
  );

  await play(
    quick(
      [
        ...moveReturnPicture(
          A_DOWN,
          1
        ),

        ...say(
          'A → C: REWARD 0',
          REWARD
        )
      ],
      0.45
    )
  );

  // ------------------------------------------------------------
  // 37: Half of C's value of ten is five.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...pulseValue('C'),

    ...discountPicture(
      A_DOWN,
      true
    ),

    ...say(
      '0.5 × 10 = 5',
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 38: Choosing down gives expected return five.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...replace(
      'returnBadge',
      expectedReturnBadge(A_DOWN)
    ),

    ...moveReturnPicture(
      A_DOWN,
      3
    ),

    ...say(
      'DOWN: EXPECTED RETURN = 5',
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 39: Both moves are equally likely.
  // Find the mean of three and five.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...resetCart('A'),

    ...replace(
      'branches',
      branchPicture(
        A_RIGHT,
        A_DOWN
      )
    ),

    ...meanPicture(
      A_RIGHT,
      A_DOWN,
      0
    ),

    ...say(
      'RIGHT = 3     DOWN = 5',
      ACTION
    )
  );

  await until(S(39) + 1.80);

  await play(
    ...meanPicture(
      A_RIGHT,
      A_DOWN,
      1
    ),

    ...say(
      'BOTH MOVES HAVE 50% CHANCE',
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 40: Three plus five equals eight.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    quick(
      [
        ...meanPicture(
          A_RIGHT,
          A_DOWN,
          2
        ),

        ...say(
          '3 + 5 = 8',
          ACTION
        )
      ],
      0.55
    )
  );

  // ------------------------------------------------------------
  // 41: Eight divided by two equals four.
  // This matches the original value of A.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...meanPicture(
      A_RIGHT,
      A_DOWN,
      3
    ),

    ...say(
      '8 ÷ 2 = 4',
      STATE
    )
  );

  await until(S(41) + 1.70);

  await play(
    ...clear('cart'),

    ...pulseValue('A'),

    ...fbox(
      [
        ['Under our fixed policy', ACTION],
        'V(A) = 0.5 × 3 + 0.5 × 5',
        '     = 1.5 + 2.5',
        ['     = 4', STATE],
        ['Matches the known value.', DOCK]
      ],
      STATE
    )
  );

  // ============================================================
  // RECURSION
  // ============================================================

  // ------------------------------------------------------------
  // 42: Each cell's value depends on other cell values.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...clear(
      'branches',
      'focus',
      'selected',
      'destinationFocus',
      'reward',
      'returnBadge'
    ),

    ...replace(
      'connections',
      dependencyPicture()
    ),

    ...say(
      'CELL VALUES DEPEND ON OTHER CELL VALUES',
      DISCOUNT
    ),

    ...fbox(
      [
        ['A uses the values of B and C.', STATE],
        ['B uses the values of A and D.', STATE],
        ['C uses the value of D.', STATE],
        'The values are connected.'
      ],
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 43: A rule using other values of the same kind
  // is called recursion.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...clear('connections'),

    ...replace(
      'dependency',
      dependencyCycle()
    ),

    ...say(
      'RECURSION',
      DISCOUNT
    ),

    ...fbox(
      [
        ['RECURSION', DISCOUNT],
        'A value is described using',
        'other values of the same kind.',
        ['A depends on B.', STATE],
        ['B depends on A.', STATE]
      ],
      DISCOUNT
    )
  );

  await until(S(43) + 2.20);

  await play(
    ...pulseValue('A'),
    ...pulseValue('B')
  );

  // ------------------------------------------------------------
  // 44: This rule is called Bellman recursion.
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...clear('dependency'),

    ...replace(
      'connections',
      dependencyPicture()
    ),

    ...say(
      'BELLMAN RECURSION',
      DISCOUNT
    ),

    ...fbox(
      [
        ['BELLMAN RECURSION', DISCOUNT],
        'Connect state values',
        'through the next reward',
        'and the value of the next state.'
      ],
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 45: Write the rule as two short formulas.
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...say(
      'TWO SHORT FORMULAS',
      STATE
    ),

    ...fbox(
      [
        ['1. Expected return for a move', ACTION],
        'Combine reward and future value.',
        ['2. State value', STATE],
        'Combine moves using their chances.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 46: Expected return for a move =
  // reward + discount factor × next-cell value.
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...clear('connections'),

    ...replace(
      'selected',
      selectedArrow(B_LEFT)
    ),

    ...replace(
      'reward',
      rewardBadge(B_LEFT)
    ),

    ...focusState('B'),

    ...replace(
      'destinationFocus',
      stateOutline(
        'A',
        DISCOUNT
      )
    ),

    ...moveReturnPicture(
      B_LEFT,
      3
    ),

    ...say(
      'FORMULA 1: EXPECTED RETURN FOR A MOVE',
      ACTION
    )
  );

  await until(S(46) + 2.45);

  await play(
    ...fbox(
      [
        ['Expected return for a move =', ACTION],
        ['  immediate reward', REWARD],
        ['  + discount factor', DISCOUNT],
        ['    × next-cell value', STATE],
        ['Example: 0 + 0.5 × 4 = 2', ACTION]
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 47: State value =
  // sum of each move's expected return × its probability.
  // ------------------------------------------------------------

  await until(S(47));

  await play(
    ...clear(
      'selected',
      'reward',
      'destinationFocus'
    ),

    ...replace(
      'branches',
      branchPicture(
        B_DOWN,
        B_LEFT
      )
    ),

    ...meanPicture(
      B_DOWN,
      B_LEFT,
      1
    ),

    ...say(
      'FORMULA 2: WEIGHT RETURNS BY PROBABILITY',
      STATE
    )
  );

  await until(S(47) + 2.40);

  await play(
    ...fbox(
      [
        ['State value =', STATE],
        '  sum over available moves of',
        ['  probability × expected return', ACTION],
        'Example: 0.5 × 10 + 0.5 × 2',
        ['       = 6', STATE]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 48: The rules must hold for every cell at the same time.
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...clear(
      'branches',
      'focus'
    ),

    ...replace(
      'connections',
      dependencyPicture()
    ),

    ...equationsBox(false),

    ...say(
      'ALL EQUATIONS MUST HOLD TOGETHER',
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 49: Solve the equations without listing every route.
  //
  // Substitute C = 10 and D = 0.
  // Solve the coupled equations for A and B.
  //
  // A = 0.25B + 2.5
  // B = 5 + 0.25A
  //
  // A = 3.75 + 0.0625A
  // A = 4, B = 6
  // ------------------------------------------------------------

  await until(S(49));

  await play(
    quick(
      [
        ...solveBox(0),

        ...say(
          'SOLVE THE CONNECTED RULES',
          DISCOUNT
        )
      ],
      0.48
    )
  );

  await until(S(49) + 1.45);

  await play(
    quick(
      [
        ...solveBox(1),
        ...pulseValue('A')
      ],
      0.65
    )
  );

  await until(S(49) + 3.15);

  await play(
    quick(
      [
        ...solveBox(2),
        ...pulseValue('B')
      ],
      0.65
    )
  );

  // ------------------------------------------------------------
  // 50: Use probabilities from the fixed policy.
  //
  // At C, the allowed up move contributes zero because
  // its policy probability is zero.
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    ...clear('connections'),

    ...replace(
      'policyArrows',
      policyArrows()
    ),

    ...say(
      'USE THE PROBABILITIES FROM OUR POLICY',
      ACTION
    ),

    ...fbox(
      [
        ['Original policy', ACTION],
        ['A: 50% right, 50% down', ACTION],
        ['B: 50% left, 50% down', ACTION],
        ['C: 0% up, 100% right', ACTION],
        'Weight each return accordingly.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 51: We cannot always choose the highest return
  // when evaluating a fixed policy.
  // ------------------------------------------------------------

  await until(S(51));

  await play(
    ...clear('policyArrows'),

    ...focusState('B'),

    ...replace(
      'branches',
      branchPicture(
        B_DOWN,
        B_LEFT
      )
    ),

    ...policyVsMaxPicture(),

    ...say(
      'DO NOT REPLACE THE MEAN WITH THE MAXIMUM',
      DISCOUNT
    )
  );

  await until(S(51) + 2.65);

  await play(
    ...fbox(
      [
        ['Fixed policy at B', ACTION],
        '50% × 10 + 50% × 2',
        ['V(B) = 6', STATE],
        'Taking only the larger return',
        'would change the decision rule.'
      ],
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 52: Next lesson, find the best possible choices.
  //
  // Preview optimisation without changing the original
  // policy or replacing the exact state values in this lesson.
  // ------------------------------------------------------------

  await until(S(52));

  await play(
    ...clear('branches'),

    ...replace(
      'selected',
      moveArrow(
        'B',
        'D',
        ACTION,
        0,
        5
      )
    ),

    ...say(
      'NEXT: FIND THE BEST POSSIBLE CHOICES',
      ACTION
    ),

    ...fbox(
      [
        ['This lesson', STATE],
        'Evaluate a fixed policy.',
        ['Next lesson', ACTION],
        'Use a related rule',
        'to find better choices.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 53: Final recap.
  //
  // Bellman recursion connects each cell's value to
  // the immediate reward and discounted value that follows.
  //
  // Preserve the original policy and exact values.
  // ------------------------------------------------------------

  await until(S(53));

  await play(
    ...clear(
      'selected',
      'focus'
    ),

    ...replace(
      'connections',
      dependencyPicture()
    ),

    ...say(
      'BELLMAN RECURSION',
      DISCOUNT
    ),

    ...fbox(
      [
        ['1. Expected return for a move', ACTION],
        ['   reward', REWARD],
        ['   + 0.5 × next-cell value', DISCOUNT],
        ['2. State value', STATE],
        '   probability-weighted mean'
      ],
      STATE
    )
  );

  await until(S(53) + 2.25);

  await play(
    ...equationsBox(true),

    ...say(
      'REWARD NOW + DISCOUNTED VALUE LATER',
      DISCOUNT
    )
  );

  await until(S(53) + 4.65);

  await play(
    ...clear('connections'),

    ...replace(
      'allCells',
      new M.VGroup(
        ...NAMES.map(
          s => stateOutline(
            s,
            s === 'D'
              ? DOCK
              : STATE
          )
        )
      )
    ),

    ...say(
      'CONNECTED VALUES UNDER ONE POLICY',
      STATE
    ),

    ...fbox(
      [
        ['BELLMAN RECURSION', DISCOUNT],
        ['A = 4     B = 6', STATE],
        ['C = 10    D = 0', STATE],
        'All values satisfy the rules',
        'under the same fixed policy.'
      ],
      STATE
    )
  );

  await until(E(53));
}

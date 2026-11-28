// lesson 15.2.1
// Markov decision processes: states, actions, transitions and rewards.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed four-cell warehouse and deterministic movement rules.
// The wet-floor and battery examples are explicitly hypothetical.
// Browser rendering against the complete engine has not been independently tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Chapter colours and responsive layout
  //
  // Cart: white
  // Dock: green
  // Rewards: gold
  // Discounted rewards: purple
  // State values: cyan
  // Action values: orange
  // ------------------------------------------------------------

  const WHITE = '#F4F7FC';
  const STATE = C.cyan;
  const ACTION = C.orange || '#FB923C';
  const REWARD = C.amber;
  const DOCK = C.green;
  const MARKOV = C.violet;
  const DISCOUNT = C.violet;
  const DARK = '#17212F';

  const CX = P ? 0 : -2.85;
  const CY = P ? 0.35 : -0.48;

  const CELL = P ? 2.45 : 1.92;
  const GRID_W = CELL * 2;
  const GRID_H = CELL * 2;

  const PILL = P
    ? [0, 3.95, 0]
    : [0, 1.98, 0];

  const BOXP = P
    ? [0, -4.45, 0]
    : [3.75, -0.50, 0];

  const BOX_W = P
    ? Math.min(FW - 1.10, 6.75)
    : 5.40;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Fixed warehouse data
  //
  // A  B
  // C  D
  //
  // A: right to B, down to C
  // B: left to A, down to D
  // C: up to A, right to D
  // D: terminal, no actions
  //
  // Every allowed move reaches its intended cell.
  // Reward is 10 only on entering D.
  // Every other move earns 0.
  // ------------------------------------------------------------

  const POS = {
    A: [
      CX - CELL / 2,
      CY + CELL / 2,
      0
    ],

    B: [
      CX + CELL / 2,
      CY + CELL / 2,
      0
    ],

    C: [
      CX - CELL / 2,
      CY - CELL / 2,
      0
    ],

    D: [
      CX + CELL / 2,
      CY - CELL / 2,
      0
    ]
  };

  const TRANSITIONS = {
    A: {
      right: 'B',
      down: 'C'
    },

    B: {
      left: 'A',
      down: 'D'
    },

    C: {
      up: 'A',
      right: 'D'
    },

    D: {}
  };

  const DELTA = {
    right: [1, 0],
    left: [-1, 0],
    up: [0, 1],
    down: [0, -1]
  };

  const NAMES = ['A', 'B', 'C', 'D'];

  let state = null;
  let terminal = false;
  let deliveryReward = 0;
  let moveCount = 0;

  let route = [];

  function rewardFor(nextState) {
    return nextState === 'D'
      ? 10
      : 0;
  }

  function allowedActions(s) {
    return Object.keys(
      TRANSITIONS[s]
    );
  }

  function nextStateFor(s, action) {
    const next =
      TRANSITIONS[s][action];

    if (!next) {
      throw new Error(
        `Invalid action ${action} from ${s}`
      );
    }

    return next;
  }

  function actionBetween(from, to) {
    const action =
      allowedActions(from).find(
        a => TRANSITIONS[from][a] === to
      );

    if (!action) {
      throw new Error(
        `Invalid warehouse move: ${from} → ${to}`
      );
    }

    return action;
  }

  // ------------------------------------------------------------
  // Basic drawing helpers
  // ------------------------------------------------------------

  function txt(
    s,
    size,
    color,
    x,
    y,
    maxw = Infinity,
    mono = false
  ) {
    const t = T(
      s,
      size,
      color,
      mono
    );

    t._w = t.getWidth();

    if (
      t._w > maxw
    ) {
      t.scale(
        maxw / t._w
      );

      t._w = maxw;
    }

    t.moveTo([
      x,
      y,
      0
    ]);

    return t;
  }

  // Place a txt() so that its left edge is at x.
  function leftText(t, x, y) {
    t.moveTo([
      x + t._w / 2,
      y,
      0
    ]);

    return t;
  }

  function rect(
    x,
    y,
    w,
    h,
    color,
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

    r.setFill(
      fill,
      opacity
    );

    r.moveTo([
      x,
      y,
      0
    ]);

    return r;
  }

  function block(
    x,
    y,
    w,
    h,
    color,
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

    r.setFill(
      fill,
      opacity
    );

    r.moveTo([
      x,
      y,
      0
    ]);

    return r;
  }

  function circle(
    x,
    y,
    radius,
    color,
    fill = color,
    opacity = 1,
    strokeWidth = 2
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth
    });

    c.setFill(
      fill,
      opacity
    );

    c.moveTo([
      x,
      y,
      0
    ]);

    return c;
  }

  function line(
    x1,
    y1,
    x2,
    y2,
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
    x1,
    y1,
    x2,
    y2,
    color
  ) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function glow(
    x,
    y,
    radius,
    color
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 1.8,
      color
    });

    halo.setFill(
      color,
      0.12
    );

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    dot.setFill(
      color,
      0.95
    );

    return new M.VGroup(
      halo,
      dot
    );
  }

  function check(
    x,
    y,
    color,
    size = 0.13
  ) {
    return new M.VGroup(
      line(
        x - size * 0.75,
        y,
        x - size * 0.18,
        y - size * 0.55,
        color,
        3
      ),

      line(
        x - size * 0.18,
        y - size * 0.55,
        x + size * 0.78,
        y + size * 0.63,
        color,
        3
      )
    );
  }

  function cross(
    x,
    y,
    color,
    size = 0.12
  ) {
    return new M.VGroup(
      line(
        x - size,
        y - size,
        x + size,
        y + size,
        color,
        3
      ),

      line(
        x - size,
        y + size,
        x + size,
        y - size,
        color,
        3
      )
    );
  }

  function tag(
    s,
    color,
    size,
    x,
    y,
    maxw = Infinity
  ) {
    const t = pill(
      s,
      color,
      size
    );

    if (
      t.getWidth() > maxw
    ) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo([
      x,
      y,
      0
    ]);

    return t;
  }

  function arrow(
    x1,
    y1,
    x2,
    y2,
    color,
    strokeWidth = 4,
    headSize = 0.15,
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

    const shaft = broken
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
        );

    return new M.VGroup(
      shaft,

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

  // ------------------------------------------------------------
  // On-screen object management
  //
  // Existing objects are never placed into new VGroups.
  // Replacement groups are constructed from fresh objects.
  // ------------------------------------------------------------

  const slots = new Map();

  function replace(key, obj) {
    const animations = [];

    const old =
      slots.get(key);

    if (old) {
      animations.push(
        new M.FadeOut(old)
      );
    }

    if (obj) {
      slots.set(
        key,
        obj
      );

      animations.push(
        new M.FadeIn(obj)
      );
    } else {
      slots.delete(key);
    }

    return animations;
  }

  function clear(...keys) {
    return keys.flatMap(
      key => replace(
        key,
        null
      )
    );
  }

  function quick(
    animations,
    duration = 0.40
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
    color = C.cyan
  ) {
    const size = P
      ? 22
      : 21;

    const lh = P
      ? 0.40
      : 0.42;

    const rows = lines.map(
      l => Array.isArray(l)
        ? l
        : [l, C.ink]
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

      if (
        tw > available
      ) {
        t.scale(
          available / tw
        );

        tw = available;
      }

      t.moveTo([
        left +
          indent +
          tw / 2,
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
  // Fixed warehouse grid
  //
  // Cell positions never change during the lesson.
  // The dock is revealed separately.
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
    }

    const outside = new M.Rectangle({
      width: GRID_W,
      height: GRID_H,
      color: C.ink,
      strokeWidth: 3
    });

    outside.setFill(
      DARK,
      0
    );

    outside.moveTo([
      CX,
      CY,
      0
    ]);

    parts.push(
      outside,

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

  function cellLabel(s) {
    const [x, y] = POS[s];

    return txt(
      s,
      P ? 30 : 27,
      s === 'D'
        ? DOCK
        : C.ink,
      x - CELL / 2 + 0.29,
      y + CELL / 2 - 0.28,
      0.43,
      true
    );
  }

  function startLabel() {
    const [x, y] = POS.A;

    return txt(
      'START',
      P ? 18 : 16,
      STATE,
      x + CELL / 2 - 0.45,
      y + CELL / 2 - 0.26,
      0.70,
      true
    );
  }

  // ------------------------------------------------------------
  // White delivery cart
  //
  // A small cargo platform with a parcel and four wheels.
  // Every component is positioned explicitly.
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

    const parcelTape = block(
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

    // Rear wheels first so the cart body is drawn above them.

    return new M.VGroup(
      halo,
      ...wheels,
      floor,
      parcel,
      parcelTape,
      handle
    );
  }

  function cartAt(s) {
    const [x, y] = POS[s];

    return cartPicture(
      x,
      y - 0.01
    );
  }

  function resetCart(s = 'A') {
    if (s === 'D') {
      throw new Error(
        'A new delivery cannot start at the terminal dock.'
      );
    }

    state = s;
    terminal = false;
    deliveryReward = 0;
    moveCount = 0;
    route = [s];

    return replace(
      'cart',
      cartAt(s)
    );
  }

  // ------------------------------------------------------------
  // Green delivery dock
  //
  // D is a terminal state.
  // The dock is not itself a permanent source of reward.
  // Reward is earned only on the move into D.
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

    const bottom =
      y - bayH / 2;

    const top =
      y + bayH / 2;

    const bay = new M.VGroup(
      line(
        left,
        top,
        left,
        bottom,
        DOCK,
        4
      ),

      line(
        left,
        bottom,
        right,
        bottom,
        DOCK,
        4
      ),

      line(
        right,
        bottom,
        right,
        top,
        DOCK,
        4
      )
    );

    const sign = txt(
      'DOCK',
      P ? 20 : 18,
      DOCK,
      x + CELL / 2 - 0.45,
      y + CELL / 2 - 0.26,
      0.66,
      true
    );

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
      bay,
      sign,
      ...stripes
    );
  }

  function terminalTag() {
    const [x, y] = POS.D;

    return tag(
      'END',
      DOCK,
      P ? 17 : 15,
      x,
      y - CELL / 2 + 0.25,
      CELL - 0.36
    );
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
      'stateFocus',
      stateOutline(
        s,
        color
      )
    );
  }

  function allStateOutlines() {
    return new M.VGroup(
      ...NAMES.map(
        s => stateOutline(
          s,
          s === 'D'
            ? DOCK
            : STATE
        )
      )
    );
  }

  // ------------------------------------------------------------
  // Legal actions and transition arrows
  //
  // Arrows point only between neighbouring cells.
  // The optional offset separates opposite-direction arrows.
  // ------------------------------------------------------------

  function moveArrow(
    from,
    to,
    color = ACTION,
    offset = 0,
    broken = false,
    width = 4
  ) {
    const [x1, y1] = POS[from];
    const [x2, y2] = POS[to];

    const dx =
      x2 - x1;

    const dy =
      y2 - y1;

    const len =
      Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const nx = -uy;
    const ny = ux;

    const inset =
      CELL * 0.31;

    const sx =
      x1 + ux * inset + nx * offset;

    const sy =
      y1 + uy * inset + ny * offset;

    const ex =
      x2 - ux * inset + nx * offset;

    const ey =
      y2 - uy * inset + ny * offset;

    const main = arrow(
      sx,
      sy,
      ex,
      ey,
      color,
      width,
      0.15,
      broken
    );

    if (broken) {
      return main;
    }

    const halo = line(
      sx,
      sy,
      ex,
      ey,
      color,
      width + 5
    );

    halo.setStroke(
      color,
      width + 5,
      0.10
    );

    return new M.VGroup(
      halo,
      main
    );
  }

  function availableArrowPicture(s) {
    const arrows =
      allowedActions(s).map(
        a => moveArrow(
          s,
          TRANSITIONS[s][a],
          ACTION
        )
      );

    return new M.VGroup(
      ...arrows
    );
  }

  function showActions(s) {
    if (s === 'D') {
      return clear('actions');
    }

    return replace(
      'actions',
      availableArrowPicture(s)
    );
  }

  function selectAction(
    s,
    action
  ) {
    const next =
      nextStateFor(s, action);

    return replace(
      'actions',
      moveArrow(
        s,
        next,
        ACTION,
        0,
        false,
        5
      )
    );
  }

  function allActionsPicture() {
    const parts = [];

    for (const from of [
      'A', 'B', 'C'
    ]) {
      for (
        const action of allowedActions(from)
      ) {
        const to =
          TRANSITIONS[from][action];

        const reversible =
          allowedActions(to).some(
            a => TRANSITIONS[to][a] === from
          );

        parts.push(
          moveArrow(
            from,
            to,
            ACTION,
            reversible
              ? 0.12
              : 0,
            false,
            3
          )
        );
      }
    }

    return new M.VGroup(
      ...parts
    );
  }

  function blockedDirections(s) {
    const [x, y] = POS[s];

    const allowed =
      allowedActions(s);

    const parts = [];

    for (
      const direction of [
        'up',
        'down',
        'left',
        'right'
      ]
    ) {
      if (
        allowed.includes(direction)
      ) {
        continue;
      }

      const [dx, dy] =
        DELTA[direction];

      const distance =
        CELL / 2 - 0.18;

      const xx =
        x + dx * distance;

      const yy =
        y + dy * distance;

      parts.push(
        circle(
          xx,
          yy,
          0.14,
          REWARD,
          DARK,
          0.92,
          1.5
        ),

        cross(
          xx,
          yy,
          REWARD,
          0.075
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  // ------------------------------------------------------------
  // Move the actual warehouse cart
  //
  // The destination is calculated from the chosen action.
  // No reward is assigned until the movement occurs.
  // A delivery cannot continue after reaching D.
  // ------------------------------------------------------------

  function moveCart(
    action,
    highlightArrival = false
  ) {
    if (terminal) {
      throw new Error(
        'Delivery has ended. Reset the cart first.'
      );
    }

    const from = state;

    const to =
      nextStateFor(
        from,
        action
      );

    const reward =
      rewardFor(to);

    const cart =
      slots.get('cart');

    if (!cart) {
      throw new Error(
        'The warehouse cart is not on screen.'
      );
    }

    state = to;
    terminal = to === 'D';

    deliveryReward += reward;
    moveCount++;

    route.push(to);

    const animations = [
      ...clear(
        'stateFocus',
        'moveReward',
        'deliveryEnd',
        'probability'
      ),

      new M.Transform(
        cart,
        cartAt(to)
      )
    ];

    if (highlightArrival) {
      animations.push(
        ...focusState(
          to,
          terminal
            ? DOCK
            : STATE
        )
      );
    }

    return {
      from,
      action,
      to,
      reward,
      animations
    };
  }

  function moveToCell(to, focus = false) {
    return moveCart(
      actionBetween(
        state,
        to
      ),
      focus
    );
  }

  // ------------------------------------------------------------
  // Reward visuals
  //
  // The reward label is attached to the move,
  // not to the permanent value of a cell.
  // ------------------------------------------------------------

  function rewardBadge(
    from,
    to,
    reward
  ) {
    const [x1, y1] = POS[from];
    const [x2, y2] = POS[to];

    const horizontal =
      Math.abs(x2 - x1) >
      Math.abs(y2 - y1);

    // Vertical moves: badge sits right of the arrow, inside the source cell,
    // away from the cell letter, the START label and the DOCK sign.
    const x =
      (x1 + x2) / 2 +
      (
        horizontal
          ? 0
          : 0.45
      );

    const y =
      (y1 + y2) / 2 +
      (
        horizontal
          ? -0.35
          : (y1 > y2 ? 0.27 : -0.27)
      );

    return tag(
      `+${reward}`,
      REWARD,
      P ? 24 : 21,
      x,
      y,
      0.92
    );
  }

  function showMoveReward(move) {
    return replace(
      'moveReward',
      rewardBadge(
        move.from,
        move.to,
        move.reward
      )
    );
  }

  function deliveryEndPicture() {
    const [x, y] = POS.D;

    const ring = circle(
      x + CELL / 2 - 0.28,
      y - CELL / 2 + 0.28,
      0.17,
      DOCK,
      DOCK,
      0.24,
      2
    );

    const tick = check(
      x + CELL / 2 - 0.28,
      y - CELL / 2 + 0.28,
      DOCK,
      0.12
    );

    return new M.VGroup(
      ring,
      tick
    );
  }

  function rewardRulePicture() {
    return new M.VGroup(
      moveArrow(
        'B',
        'D',
        DOCK
      ),

      moveArrow(
        'C',
        'D',
        DOCK
      ),

      rewardBadge(
        'B',
        'D',
        10
      ),

      rewardBadge(
        'C',
        'D',
        10
      )
    );
  }

  // ------------------------------------------------------------
  // Transition probabilities
  //
  // Deterministic transition:
  // A + right → B with probability 100%.
  // Every other possible next state has probability zero.
  // ------------------------------------------------------------

  function probabilityBadge(
    from,
    to,
    probability
  ) {
    const [x1, y1] = POS[from];
    const [x2, y2] = POS[to];

    const horizontal =
      Math.abs(x2 - x1) >
      Math.abs(y2 - y1);

    const x =
      (x1 + x2) / 2 +
      (
        horizontal
          ? 0
          : -0.36
      );

    const y =
      (y1 + y2) / 2 +
      (
        horizontal
          ? 0.31
          : 0
      );

    return tag(
      `${Math.round(probability * 100)}%`,
      STATE,
      P ? 21 : 19,
      x,
      y,
      1.15
    );
  }

  // ------------------------------------------------------------
  // State → action → next state
  //
  // Drawn as one small explanatory picture in the side box.
  // ------------------------------------------------------------

  function transitionPicture(
    from,
    action,
    to,
    showReward = false,
    showProbability = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const h = showReward
      ? 2.45
      : 2.12;

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

    const leftX =
      x - w * 0.34;

    const rightX =
      x + w * 0.34;

    const rowY =
      y + 0.05;

    const boxSize =
      P ? 0.71 : 0.68;

    const parts = [
      bg,

      txt(
        'ONE TRANSITION',
        P ? 23 : 21,
        STATE,
        x,
        y + h / 2 - 0.30,
        w - 0.35,
        true
      ),

      rect(
        leftX,
        rowY,
        boxSize,
        boxSize,
        STATE,
        STATE,
        0.12,
        0.10,
        2
      ),

      rect(
        rightX,
        rowY,
        boxSize,
        boxSize,
        to === 'D'
          ? DOCK
          : STATE,
        to === 'D'
          ? DOCK
          : STATE,
        0.12,
        0.10,
        2
      ),

      txt(
        from,
        29,
        STATE,
        leftX,
        rowY,
        0.45,
        true
      ),

      txt(
        to,
        29,
        to === 'D'
          ? DOCK
          : STATE,
        rightX,
        rowY,
        0.45,
        true
      ),

      arrow(
        leftX + boxSize / 2 + 0.08,
        rowY,
        rightX - boxSize / 2 - 0.08,
        rowY,
        ACTION,
        3,
        0.13
      ),

      txt(
        action,
        P ? 20 : 18,
        ACTION,
        x,
        rowY + 0.32,
        w * 0.36,
        true
      ),

      txt(
        'Current state',
        P ? 18 : 16,
        STATE,
        leftX,
        rowY - 0.57,
        w * 0.29
      ),

      txt(
        'Next state',
        P ? 18 : 16,
        to === 'D'
          ? DOCK
          : STATE,
        rightX,
        rowY - 0.57,
        w * 0.29
      )
    ];

    if (showProbability) {
      parts.push(
        txt(
          '100%',
          P ? 21 : 19,
          STATE,
          x,
          rowY - 0.31,
          w * 0.31,
          true
        )
      );
    }

    if (showReward) {
      parts.push(
        txt(
          `Reward = ${rewardFor(to)}`,
          P ? 22 : 20,
          REWARD,
          x,
          y - h / 2 + 0.24,
          w - 0.35,
          true
        )
      );
    }

    return replace(
      'box',
      new M.VGroup(
        ...parts
      )
    );
  }

  // ------------------------------------------------------------
  // Wet-floor analogy
  //
  // This does not modify TRANSITIONS.
  // It depicts a different hypothetical warehouse in which
  // choosing an action may not determine the next state.
  // ------------------------------------------------------------

  function wetFloorPicture() {
    const parts = [];

    const [ax, ay] = POS.A;
    const [cx, cy] = POS.C;

    const puddles = [
      [
        ax + CELL * 0.21,
        ay - CELL * 0.26,
        0.43
      ],

      [
        ax - CELL * 0.18,
        ay - CELL * 0.34,
        0.29
      ],

      [
        cx + CELL * 0.19,
        cy + CELL * 0.31,
        0.35
      ]
    ];

    for (
      const [x, y, radius] of puddles
    ) {
      const puddle = new M.Circle({
        radius,
        color: STATE,
        strokeWidth: 1
      });

      puddle.setFill(
        STATE,
        0.17
      );

      puddle.moveTo([
        x,
        y,
        0
      ]);

      parts.push(
        puddle
      );

      for (
        let k = 0;
        k < 3;
        k++
      ) {
        const yy =
          y + (k - 1) * 0.12;

        parts.push(
          line(
            x - radius * 0.51,
            yy,
            x + radius * 0.51,
            yy,
            STATE,
            1
          )
        );
      }
    }

    return new M.VGroup(
      ...parts
    );
  }

  function wetFloorTag() {
    return tag(
      'HYPOTHETICAL: WET FLOOR',
      MARKOV,
      P ? 18 : 16,
      CX,
      CY - GRID_H / 2 - 0.36,
      P ? 6.1 : 5.1
    );
  }

  function slipArrows() {
    return new M.VGroup(
      moveArrow(
        'A',
        'B',
        ACTION,
        0,
        true,
        3
      ),

      moveArrow(
        'A',
        'C',
        MARKOV,
        0,
        false,
        5
      )
    );
  }

  // ------------------------------------------------------------
  // Route history
  //
  // Two different histories can end in exactly the same state.
  // No earlier move is needed to determine the next transition
  // in this fixed warehouse.
  // ------------------------------------------------------------

  function routeHistoryPicture(
    currentOnly = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = 2.40;

    const bg = rect(
      x,
      y,
      w,
      h,
      MARKOV,
      C.card,
      0.97,
      0.18,
      2
    );

    const parts = [
      bg,

      txt(
        'TWO DIFFERENT HISTORIES',
        P ? 21 : 19,
        MARKOV,
        x,
        y + h / 2 - 0.29,
        w - 0.32,
        true
      )
    ];

    const histories = [
      ['A', 'B'],
      ['A', 'C', 'A', 'B']
    ];

    histories.forEach(
      (cells, rowIndex) => {
        const yy =
          y + 0.38 -
          rowIndex * 0.65;

        const spacing =
          Math.min(
            0.81,
            (w - 0.60) / 4
          );

        // Right-align both histories so their final B
        // appears at the same horizontal position.

        const rightX =
          x + w / 2 - 0.55;

        cells.forEach(
          (s, k) => {
            const xx =
              rightX -
              (
                cells.length - 1 - k
              ) * spacing;

            const last =
              k === cells.length - 1;

            const color =
              last
                ? STATE
                : currentOnly
                  ? C.muted
                  : C.ink;

            parts.push(
              rect(
                xx,
                yy,
                0.43,
                0.43,
                color,
                color,
                last
                  ? 0.17
                  : 0.05,
                0.07,
                last
                  ? 2
                  : 1
              ),

              txt(
                s,
                21,
                color,
                xx,
                yy,
                0.30,
                true
              )
            );

            if (!last) {
              parts.push(
                arrow(
                  xx + 0.24,
                  yy,
                  xx + spacing - 0.24,
                  yy,
                  currentOnly
                    ? C.muted
                    : MARKOV,
                  1.5,
                  0.07
                )
              );
            }
          }
        );
      }
    );

    parts.push(
      txt(
        currentOnly
          ? 'Only current B is needed'
          : 'Both histories end at B',
        P ? 20 : 18,
        currentOnly
          ? STATE
          : MARKOV,
        x,
        y - h / 2 + 0.25,
        w - 0.30
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
  // The four components of the MDP
  // ------------------------------------------------------------

  function componentPicture(
    stage = 4
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const h = P
      ? 2.70
      : 3.35;

    const bg = rect(
      x,
      y,
      w,
      h,
      MARKOV,
      C.card,
      0.97,
      0.18,
      2
    );

    const heading = txt(
      stage >= 5
        ? 'MARKOV DECISION PROCESS'
        : 'FOUR PARTS OF THE WORLD',
      P ? 22 : 20,
      MARKOV,
      x,
      y + h / 2 - 0.28,
      w - 0.35,
      true
    );

    const entries = [
      [
        'States',
        'Where we can be',
        STATE
      ],

      [
        'Actions',
        'What we can choose',
        ACTION
      ],

      [
        'Transition law',
        'Where we may arrive',
        MARKOV
      ],

      [
        'Rewards',
        'Points from each move',
        REWARD
      ]
    ];

    const parts = [
      bg,
      heading
    ];

    const rowH = P
      ? 0.48
      : 0.62;

    const firstY =
      y + h / 2 - 0.79;

    entries.forEach(
      ([name, description, color], k) => {
        const yy =
          firstY - k * rowH;

        const visible =
          stage > k;

        const useColor =
          visible
            ? color
            : C.muted;

        parts.push(
          circle(
            x - w / 2 + 0.32,
            yy,
            0.13,
            useColor,
            useColor,
            visible
              ? 0.23
              : 0.06,
            1.5
          ),

          txt(
            String(k + 1),
            15,
            useColor,
            x - w / 2 + 0.32,
            yy,
            0.19,
            true
          ),

          leftText(
            txt(
              name,
              P ? 19 : 18,
              useColor,
              0,
              yy,
              w * 0.40,
              true
            ),
            x - w / 2 + 0.58,
            yy
          ),

          leftText(
            txt(
              visible
                ? description
                : '...',
              P ? 17 : 17,
              visible
                ? C.ink
                : C.muted,
              0,
              yy,
              w * 0.46
            ),
            x + w * 0.02,
            yy
          )
        );
      }
    );

    if (
      !P &&
      stage >= 5
    ) {
      parts.push(
        txt(
          '+ Markov property',
          18,
          MARKOV,
          x,
          y - h / 2 + 0.28,
          w - 0.30
        )
      );
    }

    return replace(
      'box',
      new M.VGroup(
        ...parts
      )
    );
  }

  // ------------------------------------------------------------
  // Battery analogy
  //
  // This is a hypothetical extension of the state.
  // The fixed warehouse has no battery dynamics.
  // ------------------------------------------------------------

  function batteryIcon(
    x,
    y,
    fraction,
    scale = 1
  ) {
    const w = 0.69 * scale;
    const h = 0.32 * scale;

    const color =
      fraction > 0.30
        ? DOCK
        : REWARD;

    const shell = rect(
      x,
      y,
      w,
      h,
      WHITE,
      DARK,
      0.95,
      0.035 * scale,
      2
    );

    const terminal = block(
      x + w / 2 + 0.045 * scale,
      y,
      0.07 * scale,
      0.13 * scale,
      WHITE,
      WHITE,
      1,
      1
    );

    const parts = [
      shell,
      terminal
    ];

    const innerW =
      w - 0.10 * scale;

    const innerH =
      h - 0.09 * scale;

    const fillW =
      innerW * Math.max(
        0,
        Math.min(1, fraction)
      );

    if (fillW > 0) {
      parts.push(
        block(
          x - innerW / 2 + fillW / 2,
          y,
          fillW,
          innerH,
          color,
          color,
          0.95,
          1
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  function batteryOnCart(
    s,
    fraction
  ) {
    const [x, y] = POS[s];

    return batteryIcon(
      x + CELL * 0.20,
      y + CELL * 0.30,
      fraction,
      P ? 0.90 : 0.80
    );
  }

  function batteryComparison(
    showState = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = 2.48;

    const bg = rect(
      x,
      y,
      w,
      h,
      MARKOV,
      C.card,
      0.97,
      0.18,
      2
    );

    const leftX =
      x - w / 4;

    const rightX =
      x + w / 4;

    const parts = [
      bg,

      txt(
        'SAME CELL, DIFFERENT ENERGY',
        P ? 21 : 19,
        MARKOV,
        x,
        y + h / 2 - 0.29,
        w - 0.32,
        true
      ),

      txt(
        'Cell A',
        P ? 23 : 21,
        STATE,
        leftX,
        y + 0.43,
        w / 2 - 0.30
      ),

      txt(
        'Cell A',
        P ? 23 : 21,
        STATE,
        rightX,
        y + 0.43,
        w / 2 - 0.30
      ),

      batteryIcon(
        leftX,
        y - 0.02,
        1,
        1.35
      ),

      batteryIcon(
        rightX,
        y - 0.02,
        0,
        1.35
      ),

      txt(
        'Full battery',
        P ? 20 : 18,
        DOCK,
        leftX,
        y - 0.43,
        w / 2 - 0.30
      ),

      txt(
        'Empty battery',
        P ? 20 : 18,
        REWARD,
        rightX,
        y - 0.43,
        w / 2 - 0.30
      ),

      line(
        x,
        y + 0.64,
        x,
        y - 0.58,
        C.muted,
        1
      ),

      txt(
        showState
          ? 'State = location + battery energy'
          : 'Location alone may not be enough',
        P ? 21 : 19,
        showState
          ? STATE
          : REWARD,
        x,
        y - h / 2 + 0.26,
        w - 0.35
      )
    ];

    return replace(
      'box',
      new M.VGroup(
        ...parts
      )
    );
  }

  // ------------------------------------------------------------
  // Sequential rewards
  //
  // A → B → D
  // First move: reward 0
  // Second move: reward 10
  //
  // Discounting is intentionally not calculated in this lesson.
  // ------------------------------------------------------------

  function routeRewardPicture(
    stage = 0
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const h = 2.35;

    const bg = rect(
      x,
      y,
      w,
      h,
      REWARD,
      C.card,
      0.97,
      0.18,
      2
    );

    const spacing =
      w * 0.32;

    const xs = [
      x - spacing,
      x,
      x + spacing
    ];

    const cells = [
      'A', 'B', 'D'
    ];

    const rowY =
      y + 0.28;

    const parts = [
      bg,

      txt(
        'REWARDS OVER A SEQUENCE',
        P ? 21 : 19,
        REWARD,
        x,
        y + h / 2 - 0.29,
        w - 0.32,
        true
      )
    ];

    cells.forEach(
      (s, k) => {
        const color =
          s === 'D'
            ? DOCK
            : STATE;

        parts.push(
          rect(
            xs[k],
            rowY,
            0.60,
            0.60,
            color,
            color,
            0.10,
            0.09,
            2
          ),

          txt(
            s,
            25,
            color,
            xs[k],
            rowY,
            0.40,
            true
          )
        );
      }
    );

    for (let k = 0; k < 2; k++) {
      parts.push(
        arrow(
          xs[k] + 0.35,
          rowY,
          xs[k + 1] - 0.35,
          rowY,
          stage > k
            ? ACTION
            : C.muted,
          2,
          0.11
        )
      );

      parts.push(
        txt(
          stage > k
            ? k === 0
              ? '+0'
              : '+10'
            : '?',
          P ? 24 : 22,
          stage > k
            ? REWARD
            : C.muted,
          (
            xs[k] +
            xs[k + 1]
          ) / 2,
          rowY - 0.51,
          0.90,
          true
        )
      );
    }

    const footer = stage >= 2
      ? 'The first move helps earn a later reward.'
      : stage === 1
        ? 'First move: no immediate reward'
        : 'Two moves to reach the dock';

    parts.push(
      txt(
        footer,
        P ? 20 : 18,
        stage >= 2
          ? DOCK
          : C.ink,
        x,
        y - h / 2 + 0.29,
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

  // ============================================================
  // NARRATED SCENE
  // ============================================================

  // ------------------------------------------------------------
  // 0: imagine a small delivery cart inside a warehouse
  // ------------------------------------------------------------

  await until(S(0));

  const introCart = cartPicture(
    CX,
    CY + 0.18,
    P ? 1.95 : 2.15
  );

  const introFloor = rect(
    CX,
    CY,
    P ? 5.40 : 4.90,
    P ? 4.20 : 3.45,
    C.muted,
    C.card,
    0.64,
    0.20,
    2
  );

  const introTitle = txt(
    'Warehouse delivery',
    P ? 26 : 23,
    C.ink,
    CX,
    CY - (
      P
        ? 1.63
        : 1.38
    ),
    P ? 4.7 : 4.4
  );

  await play(
    ...replace(
      'intro',
      new M.VGroup(
        introFloor,
        introCart,
        introTitle
      )
    ),

    ...say(
      'A SMALL DELIVERY CART',
      C.cyan
    ),

    ...fbox(
      [
        ['Warehouse', C.cyan],
        'A small cart moves',
        'around the warehouse.',
        'Its job is to deliver a parcel.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 1: the floor contains four square spaces called cells
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...clear('intro'),

    ...replace(
      'grid',
      warehouseGrid()
    ),

    ...say(
      'FOUR SQUARE SPACES: CELLS'
    ),

    ...fbox(
      [
        ['Warehouse floor', C.cyan],
        'Four square spaces.',
        ['Each space is a cell.', STATE]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 2: name the cells A, B, C and D
  // ------------------------------------------------------------

  await until(S(2));

  const labels =
    NAMES.map(
      s => cellLabel(s)
    );

  labels.forEach(
    (label, i) =>
      slots.set(
        `label${NAMES[i]}`,
        label
      )
  );

  await play(
    new M.LaggedStart(
      labels.map(
        label =>
          new M.FadeIn(label)
      ),
      {
        lagRatio: 0.22,
        runTime: 1.30
      }
    ),

    ...say(
      'A, B, C AND D',
      STATE
    ),

    ...fbox(
      [
        ['Four named cells', STATE],
        'A       B',
        'C       D',
        'The layout stays fixed.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 3: cart starts at A, top left
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...replace(
      'startLabel',
      startLabel()
    ),

    ...resetCart('A'),

    ...focusState('A'),

    ...say(
      'START IN CELL A',
      STATE
    ),

    ...fbox(
      [
        ['Starting cell = A', STATE],
        'Top left.',
        'The cart begins here.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 4: D is the delivery dock at the bottom right
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...clear('stateFocus'),

    ...replace(
      'dock',
      dockPicture()
    ),

    ...focusState(
      'D',
      DOCK
    ),

    ...say(
      'CELL D: DELIVERY DOCK',
      DOCK
    ),

    ...fbox(
      [
        ['Goal = cell D', DOCK],
        'Bottom right.',
        'Deliver the parcel here.'
      ],
      DOCK
    )
  );

  // ------------------------------------------------------------
  // 5: ten points are earned when the cart reaches D
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...replace(
      'rewardRule',
      rewardRulePicture()
    ),

    ...say(
      'REACH THE DOCK: EARN 10 POINTS',
      REWARD
    ),

    ...fbox(
      [
        ['Reward rule', REWARD],
        'Move into D',
        ['Reward = 10', REWARD],
        'Earned on the arriving move.'
      ],
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 6: all other moves earn zero
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...clear(
      'rewardRule',
      'stateFocus'
    ),

    ...replace(
      'rewardRule',
      new M.VGroup(
        moveArrow(
          'A',
          'B',
          ACTION
        ),

        rewardBadge(
          'A',
          'B',
          0
        ),

        moveArrow(
          'A',
          'C',
          ACTION
        ),

        rewardBadge(
          'A',
          'C',
          0
        )
      )
    ),

    ...say(
      'OTHER MOVES EARN ZERO',
      REWARD
    ),

    ...fbox(
      [
        ['Move into D: +10', REWARD],
        ['Any other move: +0', REWARD],
        'No points for ordinary moves.'
      ],
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 7: delivery ends on reaching D
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...clear('rewardRule'),

    ...replace(
      'terminalTag',
      terminalTag()
    ),

    ...focusState(
      'D',
      DOCK
    ),

    ...say(
      'DELIVERY ENDS AT D',
      DOCK
    ),

    ...fbox(
      [
        ['Cell D', DOCK],
        'The delivery ends here.',
        'No further moves from D.',
        'Start again for a new delivery.'
      ],
      DOCK
    )
  );

  // ------------------------------------------------------------
  // 8: imagine being the cart
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...focusState('A'),

    new M.Indicate(
      slots.get('cart'),
      {
        color: WHITE
      }
    ),

    ...say(
      'IMAGINE YOU ARE THE CART',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 9: how do we decide where to move?
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...say(
      'WHICH WAY SHOULD WE MOVE?',
      ACTION
    ),

    ...fbox(
      [
        ['You control the cart.', C.ink],
        'Which move will help',
        'you reach the dock?'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 10: first know where you are
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    new M.Indicate(
      slots.get('stateFocus'),
      {
        color: STATE
      }
    ),

    ...say(
      'FIRST: WHERE ARE WE?',
      STATE
    ),

    ...fbox(
      [
        ['Before choosing a move', STATE],
        'Find your current location.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 11: current cell is A
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    quick(
      [
        ...say(
          'CURRENT CELL = A',
          STATE
        ),

        ...fbox(
          [
            ['Current cell', STATE],
            ['A', STATE]
          ],
          STATE
        )
      ],
      0.45
    )
  );

  // ------------------------------------------------------------
  // 12: the current situation is called the state
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...say(
      'STATE = CURRENT SITUATION',
      STATE
    ),

    ...fbox(
      [
        ['STATE', STATE],
        'Your current situation.',
        'Here: the cell you occupy.',
        ['Current state = A', STATE]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 13: from A, move right or down
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...showActions('A'),

    ...say(
      'FROM A: RIGHT OR DOWN',
      ACTION
    ),

    ...fbox(
      [
        ['Current state = A', STATE],
        ['Right → B', ACTION],
        ['Down  → C', ACTION],
        'Two available moves.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 14: movement outside the warehouse is forbidden
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...replace(
      'blocked',
      blockedDirections('A')
    ),

    ...say(
      'STAY INSIDE THE FOUR CELLS',
      REWARD
    ),

    ...fbox(
      [
        ['From A', STATE],
        ['Right: allowed', ACTION],
        ['Down: allowed', ACTION],
        'Left and up: not allowed.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 15: each available move is an action
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...clear('blocked'),

    ...say(
      'ACTION = A MOVE WE CAN CHOOSE',
      ACTION
    ),

    ...fbox(
      [
        ['ACTION', ACTION],
        'A move we can choose.',
        ['At A: right or down', ACTION],
        'Available actions depend on state.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 16: choose right
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    quick(
      [
        ...selectAction(
          'A',
          'right'
        ),

        ...say(
          'CHOOSE RIGHT',
          ACTION
        ),

        ...fbox(
          [
            ['State = A', STATE],
            ['Action = right', ACTION]
          ],
          ACTION
        )
      ],
      0.45
    )
  );

  // ------------------------------------------------------------
  // 17: cart moves from A to B
  // ------------------------------------------------------------

  await until(S(17));

  const firstMove =
    moveCart('right');

  await play(
    quick(
      [
        ...firstMove.animations,

        ...say(
          'A → B',
          STATE
        ),

        ...transitionPicture(
          'A',
          'right',
          'B'
        )
      ],
      0.95
    )
  );

  // ------------------------------------------------------------
  // 18: B is the new state
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...clear('actions'),

    ...focusState('B'),

    ...say(
      'NEW STATE = B',
      STATE
    ),

    ...fbox(
      [
        ['Previous state = A', C.muted],
        ['Action = right', ACTION],
        ['New state = B', STATE]
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 19: the cart earns zero for this move
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...showMoveReward(
      firstMove
    ),

    ...say(
      'THIS MOVE EARNS 0 POINTS',
      REWARD
    ),

    ...transitionPicture(
      'A',
      'right',
      'B',
      true
    )
  );

  // ------------------------------------------------------------
  // 20: points received after a move are called reward
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...say(
      'REWARD = POINTS FROM A MOVE',
      REWARD
    ),

    ...fbox(
      [
        ['REWARD', REWARD],
        'Points received after a move.',
        ['A → B: reward 0', REWARD],
        'Reaching D earns 10.'
      ],
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 21: from B, move left or down
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...clear('moveReward'),

    ...showActions('B'),

    ...say(
      'FROM B: LEFT OR DOWN',
      ACTION
    ),

    ...fbox(
      [
        ['Current state = B', STATE],
        ['Left → A', ACTION],
        ['Down → D', ACTION],
        'Choose an available move.'
      ],
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 22: choose down
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    quick(
      [
        ...selectAction(
          'B',
          'down'
        ),

        ...say(
          'CHOOSE DOWN',
          ACTION
        ),

        ...fbox(
          [
            ['State = B', STATE],
            ['Action = down', ACTION]
          ],
          ACTION
        )
      ],
      0.45
    )
  );

  // ------------------------------------------------------------
  // 23: cart moves from B to D
  // ------------------------------------------------------------

  await until(S(23));

  const secondMove =
    moveCart(
      'down',
      true
    );

  await play(
    quick(
      [
        ...secondMove.animations,

        ...say(
          'B → D',
          STATE
        ),

        ...transitionPicture(
          'B',
          'down',
          'D'
        )
      ],
      0.95
    )
  );

  // ------------------------------------------------------------
  // 24: reward ten and delivery ends
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...showMoveReward(
      secondMove
    ),

    ...replace(
      'deliveryEnd',
      deliveryEndPicture()
    ),

    new M.Indicate(
      slots.get('cart'),
      {
        color: DOCK
      }
    ),

    ...say(
      'REWARD 10: DELIVERY COMPLETE',
      REWARD
    ),

    ...fbox(
      [
        ['B → D', DOCK],
        ['Reward = 10', REWARD],
        ['Delivery complete', DOCK],
        'No further action from D.'
      ],
      DOCK
    )
  );

  // ------------------------------------------------------------
  // 25: choosing an action and arriving in a state
  // are two different things
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...clear(
      'moveReward',
      'deliveryEnd'
    ),

    ...say(
      'CHOSEN ACTION ≠ NEXT STATE',
      MARKOV
    ),

    ...transitionPicture(
      'B',
      'down',
      'D',
      true
    )
  );

  await until(
    S(25) + 2.05
  );

  await play(
    ...fbox(
      [
        ['Action: down', ACTION],
        'What you decide to do.',
        ['Next state: D', STATE],
        'Where the move takes you.'
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 26: hypothetical cart on a wet floor
  //
  // This analogy does not change the warehouse's actual
  // deterministic transition rules.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...clear(
      'actions',
      'stateFocus',
      'cart'
    ),

    ...replace(
      'wetFloor',
      wetFloorPicture()
    ),

    ...replace(
      'wetTag',
      wetFloorTag()
    ),

    ...replace(
      'hypotheticalCart',
      cartAt('A')
    ),

    ...say(
      'IMAGINE A SLIPPERY FLOOR',
      MARKOV
    ),

    ...fbox(
      [
        ['Hypothetical wet floor', MARKOV],
        'A cart might slide.',
        'Its movement could differ',
        'from the action it chooses.'
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 27: choosing right might not lead to the intended cell
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...replace(
      'slipArrows',
      slipArrows()
    ),

    ...say(
      'CHOOSE RIGHT, BUT POSSIBLY SLIDE',
      MARKOV
    ),

    ...fbox(
      [
        ['Chosen action: right', ACTION],
        ['Intended destination: B', STATE],
        ['Possible slip: C', MARKOV],
        'A hypothetical outcome.'
      ],
      MARKOV
    )
  );

  await until(
    S(27) + 1.40
  );

  await play(
    quick(
      [
        new M.Transform(
          slots.get('hypotheticalCart'),
          cartAt('C')
        )
      ],
      0.80
    )
  );

  // ------------------------------------------------------------
  // 28: our actual warehouse has deterministic movement
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...clear(
      'hypotheticalCart',
      'wetFloor',
      'wetTag',
      'slipArrows'
    ),

    ...resetCart('A'),

    ...focusState('A'),

    ...say(
      'OUR CART ALWAYS FOLLOWS ITS ACTION',
      STATE
    ),

    ...fbox(
      [
        ['Back to our warehouse', STATE],
        'No unexpected sliding.',
        'Each allowed action reaches',
        'its intended destination.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 29: from A, right always leads to B
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...selectAction(
      'A',
      'right'
    ),

    ...say(
      'FROM A, RIGHT ALWAYS LEADS TO B',
      ACTION
    ),

    ...transitionPicture(
      'A',
      'right',
      'B'
    )
  );

  await until(
    S(29) + 1.35
  );

  const deterministicMove =
    moveCart(
      'right',
      true
    );

  await play(
    quick(
      deterministicMove.animations,
      0.85
    )
  );

  // ------------------------------------------------------------
  // 30: probability of reaching B is one hundred percent
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...replace(
      'probability',
      probabilityBadge(
        'A',
        'B',
        1
      )
    ),

    ...say(
      '100% CHANCE OF REACHING B',
      STATE
    ),

    ...fbox(
      [
        ['Current state = A', STATE],
        ['Action = right', ACTION],
        ['Next state B: 100%', STATE],
        'All other next states: 0%'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 31: transition law
  //
  // Probabilities of next states, given the current state
  // and chosen action.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...say(
      'TRANSITION LAW',
      MARKOV
    ),

    ...transitionPicture(
      'A',
      'right',
      'B',
      false,
      true
    )
  );

  await until(
    S(31) + 2.20
  );

  await play(
    ...fbox(
      [
        ['TRANSITION LAW', MARKOV],
        'Given the current state',
        'and the chosen action,',
        'what are the chances',
        'of each possible next state?'
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 32: reset cart to A for another delivery
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...clear(
      'actions',
      'stateFocus',
      'probability',
      'moveReward',
      'deliveryEnd'
    ),

    ...resetCart('A'),

    ...focusState('A'),

    ...say(
      'NEW DELIVERY: BACK TO A',
      STATE
    ),

    ...fbox(
      [
        ['New delivery', STATE],
        'Place the cart back at A.',
        'The movement rules stay the same.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 33: arrive in B after several moves
  //
  // Use the legal route:
  // A → C → A → B
  //
  // This differs from the earlier direct A → B route.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    quick(
      [
        ...selectAction(
          'A',
          'down'
        ),

        ...say(
          'A DIFFERENT ROUTE TO B',
          ACTION
        ),

        ...fbox(
          [
            ['Another route', MARKOV],
            'A → C → A → B',
            'Several moves before reaching B.'
          ],
          MARKOV
        )
      ],
      0.45
    )
  );

  const historyMove1 =
    moveCart('down');

  await play(
    quick(
      [
        ...historyMove1.animations,

        ...showMoveReward(
          historyMove1
        )
      ],
      0.75
    )
  );

  await play(
    quick(
      [
        ...clear('moveReward'),

        ...selectAction(
          'C',
          'up'
        )
      ],
      0.30
    )
  );

  const historyMove2 =
    moveCart('up');

  await play(
    quick(
      [
        ...historyMove2.animations,

        ...showMoveReward(
          historyMove2
        )
      ],
      0.75
    )
  );

  await play(
    quick(
      [
        ...clear('moveReward'),

        ...selectAction(
          'A',
          'right'
        )
      ],
      0.30
    )
  );

  const historyMove3 =
    moveCart(
      'right',
      true
    );

  await play(
    quick(
      [
        ...historyMove3.animations,

        ...showMoveReward(
          historyMove3
        )
      ],
      0.80
    )
  );

  // ------------------------------------------------------------
  // 34: must the cart remember all its earlier moves?
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...clear(
      'actions',
      'moveReward'
    ),

    ...routeHistoryPicture(false),

    ...say(
      'DO WE NEED THE WHOLE HISTORY?',
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 35: the current cell and chosen move are enough
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...routeHistoryPicture(true),

    ...focusState('B'),

    ...say(
      'CURRENT STATE + ACTION ARE ENOUGH',
      MARKOV
    )
  );

  await until(
    S(35) + 1.45
  );

  await play(
    ...fbox(
      [
        ['Current state = B', STATE],
        'Earlier route is not needed.',
        'Choose an action from B.',
        'The transition rule is unchanged.'
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 36: from B, choosing down still leads to D
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...selectAction(
      'B',
      'down'
    ),

    ...say(
      'B + DOWN STILL LEADS TO D',
      ACTION
    ),

    ...transitionPicture(
      'B',
      'down',
      'D',
      false,
      true
    )
  );

  await until(
    S(36) + 1.30
  );

  const markovMove =
    moveCart(
      'down',
      true
    );

  await play(
    quick(
      markovMove.animations,
      0.85
    )
  );

  // ------------------------------------------------------------
  // 37: reward is still ten
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...showMoveReward(
      markovMove
    ),

    ...replace(
      'deliveryEnd',
      deliveryEndPicture()
    ),

    ...say(
      'THE REWARD IS STILL 10',
      REWARD
    ),

    ...transitionPicture(
      'B',
      'down',
      'D',
      true,
      true
    )
  );

  // ------------------------------------------------------------
  // 38: the Markov property
  //
  // Current state and action are sufficient to describe
  // the possible next state and immediate reward.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...say(
      'THE MARKOV PROPERTY',
      MARKOV
    ),

    ...fbox(
      [
        ['MARKOV PROPERTY', MARKOV],
        'Current state + action',
        'are enough to describe',
        'what may happen next.',
        'Earlier history is not needed.'
      ],
      MARKOV
    )
  );

  await until(
    S(38) + 2.75
  );

  await play(
    ...fbox(
      [
        ['From B, choose down', ACTION],
        ['Next state = D', DOCK],
        ['Reward = 10', REWARD],
        'The same rule applies',
        'regardless of the earlier route.'
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 39: four things describe the cart's world
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...clear(
      'actions',
      'stateFocus',
      'moveReward',
      'deliveryEnd'
    ),

    ...componentPicture(0),

    ...say(
      'FOUR PARTS DESCRIBE OUR WORLD',
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 40: states describe where the cart can be
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...replace(
      'allStates',
      allStateOutlines()
    ),

    ...componentPicture(1),

    ...say(
      '1. STATES: WHERE WE CAN BE',
      STATE
    )
  );

  // ------------------------------------------------------------
  // 41: actions describe what the cart can choose
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...clear('allStates'),

    ...replace(
      'allActions',
      allActionsPicture()
    ),

    ...componentPicture(2),

    ...say(
      '2. ACTIONS: WHAT WE CAN CHOOSE',
      ACTION
    )
  );

  // ------------------------------------------------------------
  // 42: transition law describes next-state probabilities
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...clear('allActions'),

    ...replace(
      'transitionArrows',
      new M.VGroup(
        moveArrow(
          'A',
          'B',
          ACTION
        ),

        probabilityBadge(
          'A',
          'B',
          1
        ),

        moveArrow(
          'C',
          'D',
          ACTION
        ),

        probabilityBadge(
          'C',
          'D',
          1
        )
      )
    ),

    ...componentPicture(3),

    ...say(
      '3. TRANSITION LAW: NEXT-STATE CHANCES',
      MARKOV
    )
  );

  await until(
    S(42) + 2.10
  );

  await play(
    ...fbox(
      [
        ['Transition law', MARKOV],
        'Every allowed move here',
        'reaches its intended cell',
        ['with probability 100%.', STATE]
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 43: rewards describe points from each move
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...clear('transitionArrows'),

    ...replace(
      'summaryRewards',
      new M.VGroup(
        moveArrow(
          'A',
          'B',
          ACTION
        ),

        rewardBadge(
          'A',
          'B',
          0
        ),

        moveArrow(
          'B',
          'D',
          DOCK
        ),

        rewardBadge(
          'B',
          'D',
          10
        )
      )
    ),

    ...componentPicture(4),

    ...say(
      '4. REWARDS: POINTS FROM MOVES',
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 44: together these describe a Markov decision process
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...clear('summaryRewards'),

    ...replace(
      'allStates',
      allStateOutlines()
    ),

    ...componentPicture(5),

    ...say(
      'MARKOV DECISION PROCESS',
      MARKOV
    )
  );

  await until(
    S(44) + 2.05
  );

  await play(
    ...fbox(
      [
        ['Markov decision process', MARKOV],
        ['States and actions', STATE],
        ['Transition law and rewards', REWARD],
        'Together with the',
        ['Markov property.', MARKOV]
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 45: choices lead to new situations and future rewards
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...clear(
      'allStates',
      'stateFocus'
    ),

    ...resetCart('A'),

    ...replace(
      'sequenceArrows',
      new M.VGroup(
        moveArrow(
          'A',
          'B',
          ACTION
        ),

        moveArrow(
          'B',
          'D',
          ACTION
        )
      )
    ),

    ...routeRewardPicture(2),

    ...say(
      'CHOICES LEAD TO FUTURE REWARDS',
      MARKOV
    )
  );

  await until(
    S(45) + 2.30
  );

  await play(
    ...fbox(
      [
        ['A sequence of decisions', MARKOV],
        'Choose an action.',
        'Arrive in a new state.',
        'Receive a reward.',
        'Choose again, unless finished.'
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 46: study which choices help machines reach their goals
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...clear('sequenceArrows'),

    ...showActions('A'),

    ...focusState('A'),

    ...say(
      'WHICH CHOICES HELP REACH THE GOAL?',
      DOCK
    ),

    ...fbox(
      [
        ['Decision-making problems', MARKOV],
        'Delivery carts',
        'Robots and other machines',
        'Learn which choices help',
        'them reach their goals.'
      ],
      DOCK
    )
  );

  // ------------------------------------------------------------
  // 47: state must contain all necessary information
  // ------------------------------------------------------------

  await until(S(47));

  await play(
    ...clear('actions'),

    ...say(
      'STATE MUST CONTAIN ENOUGH INFORMATION',
      MARKOV
    ),

    ...fbox(
      [
        ['Important condition', REWARD],
        'The state must contain',
        'the information needed',
        'to describe what happens next.'
      ],
      MARKOV
    )
  );

  // ------------------------------------------------------------
  // 48: a cart with a battery may need more than location
  //
  // Hypothetical extension only.
  // No battery restriction is added to the actual warehouse.
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...replace(
      'battery',
      batteryOnCart(
        'A',
        0
      )
    ),

    ...batteryComparison(false),

    ...say(
      'LOCATION ALONE MAY NOT BE ENOUGH',
      REWARD
    )
  );

  // ------------------------------------------------------------
  // 49: include remaining battery energy in the state
  // ------------------------------------------------------------

  await until(S(49));

  await play(
    ...batteryComparison(true),

    ...say(
      'STATE = CELL + BATTERY ENERGY',
      STATE
    )
  );

  await until(
    S(49) + 1.60
  );

  await play(
    ...fbox(
      [
        ['A richer state', STATE],
        'Current location',
        '+ remaining battery energy',
        'Include what matters',
        'for the next transition.'
      ],
      STATE
    )
  );

  // ------------------------------------------------------------
  // 50: the first move earns nothing but helps reach the dock
  //
  // Return to the original deterministic warehouse.
  // The hypothetical battery is removed.
  //
  // A → B gives 0.
  // B → D gives 10.
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    quick(
      [
        ...clear(
          'battery',
          'stateFocus'
        ),

        ...resetCart('A'),

        ...selectAction(
          'A',
          'right'
        ),

        ...routeRewardPicture(0),

        ...say(
          'BACK TO OUR ORIGINAL WAREHOUSE',
          STATE
        )
      ],
      0.55
    )
  );

  const delayedMove1 =
    moveCart(
      'right',
      true
    );

  await play(
    quick(
      [
        ...delayedMove1.animations,

        ...showMoveReward(
          delayedMove1
        ),

        ...routeRewardPicture(1),

        ...say(
          'FIRST MOVE: REWARD 0',
          REWARD
        )
      ],
      1.05
    )
  );

  await until(
    S(50) + 2.55
  );

  await play(
    quick(
      [
        ...clear('moveReward'),

        ...selectAction(
          'B',
          'down'
        )
      ],
      0.40
    )
  );

  const delayedMove2 =
    moveCart(
      'down',
      true
    );

  await play(
    quick(
      [
        ...delayedMove2.animations,

        ...showMoveReward(
          delayedMove2
        ),

        ...replace(
          'deliveryEnd',
          deliveryEndPicture()
        ),

        ...routeRewardPicture(2),

        ...say(
          'LATER MOVE: REWARD 10',
          REWARD
        )
      ],
      1.15
    )
  );

  // ------------------------------------------------------------
  // 51: next lesson will quantify rewards that arrive later
  //
  // Do not introduce the numerical discount calculation yet.
  // ------------------------------------------------------------

  await until(S(51));

  await play(
    ...say(
      'HOW DO WE VALUE A LATER REWARD?',
      DISCOUNT
    ),

    ...fbox(
      [
        ['First move', STATE],
        ['Immediate reward = 0', REWARD],
        ['Later move', STATE],
        ['Reward = 10', REWARD],
        ['Next: value future rewards.', DISCOUNT]
      ],
      DISCOUNT
    )
  );

  // ------------------------------------------------------------
  // 52: final recap
  //
  // A Markov decision process describes:
  // - Where the cart is.
  // - What the cart can choose.
  // - What may happen next.
  // - The reward earned by the transition.
  // ------------------------------------------------------------

  await until(S(52));

  await play(
    ...clear(
      'actions',
      'stateFocus',
      'moveReward',
      'deliveryEnd'
    ),

    ...resetCart('A'),

    ...focusState('A'),

    ...componentPicture(5),

    ...say(
      'MARKOV DECISION PROCESS',
      MARKOV
    )
  );

  await until(
    S(52) + 1.80
  );

  await play(
    ...showActions('A'),

    ...say(
      'WHERE YOU ARE, WHAT YOU CAN CHOOSE',
      STATE
    ),

    ...fbox(
      [
        ['State: where you are', STATE],
        ['Action: what you choose', ACTION],
        ['Transition: what may happen', MARKOV],
        ['Reward: points received', REWARD]
      ],
      MARKOV
    )
  );

  await until(
    S(52) + 3.85
  );

  await play(
    ...selectAction(
      'A',
      'right'
    ),

    ...replace(
      'probability',
      probabilityBadge(
        'A',
        'B',
        1
      )
    ),

    ...say(
      'STATE → ACTION → NEXT STATE + REWARD',
      MARKOV
    ),

    ...fbox(
      [
        ['MARKOV DECISION PROCESS', MARKOV],
        'Describe where we are,',
        'what we can choose,',
        'and what may happen next.',
        ['Learn through decisions.', DOCK]
      ],
      MARKOV
    )
  );

  await until(E(52));
}

// lesson 15.2.9
// Policy gradient learning: learning the chances of choosing actions directly.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// The first three sampled actions are fixed by the narration:
// down, down, left.
//
// Original advantages remain unchanged for those three updates.
// Subsequent random updates refresh the advantages under the current policy.
//
// All calculations retain full numerical precision internally.
// Only displayed numbers are rounded.
//
// The named export mountPolicyGradientSimulation(root) provides the
// interactive simulation and its controls. The supplied engine header
// does not specify a simulation mounting hook, so mounting is separate
// from the narration-controlled default export.
//
// Browser rendering against the complete engine has not been independently tested.


// ============================================================
// SHARED WAREHOUSE AND POLICY-GRADIENT MATHEMATICS
// ============================================================

const GAMMA = 0.5;
const LEARNING_RATE = 0.1;

const TRANSITIONS = {
  A: { right: 'B', down: 'C' },
  B: { left: 'A', down: 'D' },
  C: { up: 'A', right: 'D' },
  D: {}
};

const ORIGINAL_VALUES = {
  A: 4,
  B: 6,
  C: 10,
  D: 0
};

const ORIGINAL_ADVANTAGES = {
  down: 4,
  left: -4
};

const FIXED_ACTIONS = [
  'down',
  'down',
  'left'
];

function rewardFor(next) {
  return next === 'D' ? 10 : 0;
}

function sigmoid(z) {
  // Numerically stable logistic function.

  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }

  const e = Math.exp(z);
  return e / (1 + e);
}

function fmt(n, digits = 4) {
  return Number(
    n.toFixed(digits)
  ).toString();
}

function pct(n, digits = 1) {
  return `${fmt(n * 100, digits)}%`;
}

function signed(n, digits = 4) {
  return n > 0
    ? `+${fmt(n, digits)}`
    : fmt(n, digits);
}


// ------------------------------------------------------------
// Exact policy evaluation
//
// Policies at A and C remain unchanged.
//
// A:
//   right to B with probability 0.5
//   down to C with probability 0.5
//
// B:
//   down to D with probability p
//   left to A with probability 1 - p
//
// C:
//   right to D with probability 1
//   up to A with probability 0
//
// D is terminal.
//
// Bellman equations:
//
// V(C) = 10
// V(D) = 0
//
// V(A) = 0.25 V(B) + 2.5
//
// V(B) = 10p + (1-p) × 0.5 V(A)
//
// Substitute V(A):
//
// V(B) = 10p + (1-p)(0.125 V(B) + 1.25)
//
// Hence:
//
// V(B) = (1.25 + 8.75p) / (0.875 + 0.125p)
//
// IMPORTANT:
// The expected return of moving left changes as the policy
// changes. Do not permanently fix it at two.
// ------------------------------------------------------------

function evaluatePolicy(z) {
  const p = sigmoid(z);

  const B =
    (1.25 + 8.75 * p) /
    (0.875 + 0.125 * p);

  const A = 0.25 * B + 2.5;

  const C = 10;
  const D = 0;

  const qDown = 10;
  const qLeft = GAMMA * A;

  return {
    z,

    pDown: p,
    pLeft: 1 - p,

    values: {
      A,
      B,
      C,
      D
    },

    returns: {
      down: qDown,
      left: qLeft
    },

    advantages: {
      down: qDown - B,
      left: qLeft - B
    },

    expectedReturn: B,

    gap: Math.max(
      0,
      10 - B
    )
  };
}


// ------------------------------------------------------------
// One policy-gradient update
//
// z is the preference for choosing down.
//
// p(down) = sigmoid(z)
// p(left) = 1 - p(down)
//
// Derivatives of log action probabilities:
//
// down: d log(p) / dz = 1 - p
// left: d log(1-p) / dz = -p
//
// Update:
//
// change = learning rate × advantage × probability factor
// new z = old z + change
// ------------------------------------------------------------

function calculateUpdate(
  z,
  action,
  advantages
) {
  if (
    action !== 'down' &&
    action !== 'left'
  ) {
    throw new Error(
      `Invalid action at B: ${action}`
    );
  }

  const before =
    evaluatePolicy(z);

  const p =
    before.pDown;

  const advantage =
    advantages[action];

  const factor =
    action === 'down'
      ? 1 - p
      : -p;

  const change =
    LEARNING_RATE *
    advantage *
    factor;

  const newZ =
    z + change;

  const after =
    evaluatePolicy(newZ);

  return {
    action,

    destination:
      TRANSITIONS.B[action],

    reward:
      rewardFor(
        TRANSITIONS.B[action]
      ),

    oldZ: z,
    oldP: p,

    advantage,
    factor,
    change,

    newZ,

    newP:
      after.pDown,

    before,
    after
  };
}

// The narrated scene seeds this so laptop and phone show the same run;
// the interactive simulation keeps Math.random.
let rand = Math.random;

function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleAction(z) {
  return rand() < sigmoid(z)
    ? 'down'
    : 'left';
}

function createLearner() {
  let z = 0;
  let iteration = 0;

  let lastUpdate = null;

  const history = [
    {
      iteration: 0,
      ...evaluatePolicy(0)
    }
  ];

  function step(
    forcedAction = null,
    frozenAdvantages = null
  ) {
    const action =
      forcedAction === null
        ? sampleAction(z)
        : forcedAction;

    // Fresh exact model-based advantage estimates are used
    // after the narrated three-step demonstration.
    //
    // In a model-free implementation these estimates would
    // instead be learned from experience.

    const advantages =
      frozenAdvantages ||
      evaluatePolicy(z).advantages;

    const update =
      calculateUpdate(
        z,
        action,
        advantages
      );

    z = update.newZ;
    iteration++;

    lastUpdate = {
      iteration,
      ...update
    };

    history.push({
      iteration,
      ...update.after
    });

    return lastUpdate;
  }

  function reset() {
    z = 0;
    iteration = 0;
    lastUpdate = null;

    history.length = 0;

    history.push({
      iteration: 0,
      ...evaluatePolicy(0)
    });
  }

  return {
    step,
    reset,

    get z() {
      return z;
    },

    get iteration() {
      return iteration;
    },

    get current() {
      return evaluatePolicy(z);
    },

    get lastUpdate() {
      return lastUpdate;
    },

    get history() {
      return history;
    }
  };
}


// ============================================================
// NARRATED MANIM-WEB SCENE
// ============================================================

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ----------------------------------------------------------
  // Chapter colours
  // ----------------------------------------------------------

  const WHITE = '#F4F7FC';
  const STATE = C.cyan;
  const ACTION = C.orange || '#FB923C';
  const REWARD = C.amber;
  const DOCK = C.green;
  const DISCOUNT = C.violet;

  const POSITIVE = C.green;
  const NEGATIVE = C.muted;
  const DARK = '#17212F';

  // Keep the same warehouse positions as the earlier lessons.

  const CX = P ? -0.55 : -2.75;
  const CY = P ? 0.48 : -0.48;

  const CELL = P ? 2.1 : 1.92;

  const GRID_W = 2 * CELL;
  const GRID_H = 2 * CELL;

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

  const NAMES = [
    'A', 'B', 'C', 'D'
  ];

  const PILL = P
    ? [0, 3.78, 0]
    : [CX, 1.98, 0];

  const BOXP = P
    ? [0, -3.91, 0]
    : [4.2, -0.50, 0];

  const BOX_W = P
    ? Math.min(FW - 1.10, 6.75)
    : 5.00;

  const say = (
    text,
    color = STATE
  ) => showA(
    text,
    color,
    PILL
  );

  rand = seededRandom(20261127);

  const learner =
    createLearner();

  // Keep pending calculations separate from committed updates.
  // This allows each narrated arithmetic step to appear on cue.

  let pending = null;

  // ----------------------------------------------------------
  // Basic drawing helpers
  // ----------------------------------------------------------

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
    x, y, w, h,
    color,
    opacity = 0.90,
    strokeWidth = 1
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
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
    x, y, radius,
    color = WHITE
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
    const angle =
      Math.atan2(
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
    const t =
      pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  // ----------------------------------------------------------
  // On-screen object management
  //
  // All replacement groups contain fresh objects.
  // Never regroup objects that are already on screen.
  // ----------------------------------------------------------

  const slots = new Map();

  function replace(key, object) {
    const animations = [];

    const previous =
      slots.get(key);

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

  // ----------------------------------------------------------
  // One formula / explanation box
  // ----------------------------------------------------------

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

    const widths =
      texts.map((t, i) =>
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

      const available =
        Math.max(
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

  // ----------------------------------------------------------
  // Fixed four-cell warehouse
  // ----------------------------------------------------------

  function warehouseGrid() {
    const parts = [];

    for (const s of NAMES) {
      const [x, y] = POS[s];

      const tile =
        new M.Rectangle({
          width: CELL,
          height: CELL,
          color: C.muted,
          strokeWidth: 1
        });

      tile.setFill(C.card, 0.62);
      tile.moveTo([x, y, 0]);

      parts.push(
        tile,

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

    const outline =
      new M.Rectangle({
        width: GRID_W,
        height: GRID_H,
        color: C.ink,
        strokeWidth: 3
      });

    outline.setFill(DARK, 0);
    outline.moveTo([CX, CY, 0]);

    parts.push(
      outline,

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

  // ----------------------------------------------------------
  // Green delivery dock
  // ----------------------------------------------------------

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
    const top = y + bayH / 2;
    const bottom = y - bayH / 2;

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

  // ----------------------------------------------------------
  // Familiar white delivery cart
  // ----------------------------------------------------------

  function cartPicture(x, y) {
    const u =
      P ? 0.86 : 0.76;

    const parts = [
      circle(
        x,
        y,
        0.55 * u,
        WHITE,
        WHITE,
        0.045,
        1
      )
    ];

    for (const dx of [-0.27, 0.27]) {
      for (const dy of [-0.28, 0.19]) {
        parts.push(
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

    parts.push(
      rect(
        x,
        y - 0.05 * u,
        0.79 * u,
        0.49 * u,
        WHITE,
        WHITE,
        0.94,
        0.10 * u,
        2
      ),

      rect(
        x - 0.09 * u,
        y + 0.14 * u,
        0.40 * u,
        0.40 * u,
        WHITE,
        '#C9D4E4',
        1,
        0.045 * u,
        1
      ),

      block(
        x - 0.09 * u,
        y + 0.14 * u,
        0.09 * u,
        0.39 * u,
        '#91A2B8',
        0.90,
        1
      ),

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
      ...parts
    );
  }

  function cartAt(s) {
    const [x, y] = POS[s];

    return cartPicture(
      x,
      y + CELL * 0.13
    );
  }

  let cartState = null;

  function stateOutline(
    s,
    color = STATE
  ) {
    const [x, y] = POS[s];

    return rect(
      x, y,
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
      stateOutline(s, color)
    );
  }

  function resetCart() {
    cartState = 'B';

    return [
      ...clear(
        'selected',
        'reward',
        'terminal',
        'destinationFocus'
      ),

      ...replace(
        'cart',
        cartAt('B')
      ),

      ...focusState('B')
    ];
  }

  // ----------------------------------------------------------
  // Movement arrows
  //
  // Arrow widths represent policy probabilities.
  //
  // A and C retain their original policy.
  // Only the arrows leaving B change during learning.
  // ----------------------------------------------------------

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
      CELL * 0.27;

    return {
      sx: x1 + ux * inset + nx * offset,
      sy: y1 + uy * inset + ny * offset,
      ex: x2 - ux * inset + nx * offset,
      ey: y2 - uy * inset + ny * offset,
      nx,
      ny
    };
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
    const back = side * nx < 0 ? 0.62 : 0.30;

    return [
      mx - ux * back + side * nx * 0.42,
      my - uy * back + side * ny * 0.42
    ];
  }

  function policyArrow(
    from,
    to,
    probability,
    color = ACTION,
    offset = 0,
    showLabel = true
  ) {
    const {
      sx, sy, ex, ey,
      nx, ny
    } = arrowCoordinates(
      from,
      to,
      offset
    );

    // Zero probability is displayed as a thin dashed arrow.
    // Positive probabilities control the arrow thickness.

    const width =
      probability === 0
        ? 1
        : 1.5 + 8 * probability;

    const parts = [];

    if (probability > 0) {
      const halo = line(
        sx, sy,
        ex, ey,
        color,
        width + 5
      );

      halo.setStroke(
        color,
        width + 5,
        0.11
      );

      parts.push(halo);
    }

    parts.push(
      arrow(
        sx, sy,
        ex, ey,
        probability === 0
          ? C.muted
          : color,
        width,
        0.12 + probability * 0.05,
        probability === 0
      )
    );

    if (showLabel) {
      const [px, py] = chipPos(sx, sy, ex, ey, nx, ny, 1);

      parts.push(
        tag(
          pct(probability),
          probability === 0
            ? C.muted
            : color,
          P ? 17 : 15,
          px,
          py,
          0.92
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  // The fixed moves of A and C stay in the background, without chips:
  // this lesson only changes cell B, and its chips need the room.
  function fixedPolicyPicture() {
    return new M.VGroup(
      policyArrow(
        'A', 'B',
        0.5,
        C.muted,
        0.15,
        false
      ),

      policyArrow(
        'A', 'C',
        0.5,
        C.muted,
        0.15,
        false
      ),

      policyArrow(
        'C', 'A',
        0,
        C.muted,
        0.15,
        false
      ),

      policyArrow(
        'C', 'D',
        1,
        C.muted,
        0,
        false
      )
    );
  }

  function bPolicyPicture(
    p,
    revealDown = true,
    revealLeft = true
  ) {
    const parts = [];

    if (revealDown) {
      parts.push(
        policyArrow(
          'B',
          'D',
          p,
          ACTION
        )
      );
    }

    if (revealLeft) {
      parts.push(
        policyArrow(
          'B',
          'A',
          1 - p,
          ACTION,
          0.15
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  function updateArrows(
    p = learner.current.pDown
  ) {
    return replace(
      'bPolicy',
      bPolicyPicture(p)
    );
  }

  // ----------------------------------------------------------
  // Current preference and iteration counter
  // ----------------------------------------------------------

  function statusPicture(
    z = learner.z,
    n = learner.iteration
  ) {
    const y =
      CY - GRID_H / 2 -
      (P ? 0.42 : 0.29);

    return new M.VGroup(
      txt(
        `STEP ${n}    z = ${fmt(z)}`,
        P ? 22 : 19,
        DISCOUNT,
        CX,
        y,
        GRID_W + 0.75,
        true
      )
    );
  }

  function updateStatus(
    z = learner.z,
    n = learner.iteration
  ) {
    return replace(
      'status',
      statusPicture(z, n)
    );
  }

  // ----------------------------------------------------------
  // Expected state value and action-value badges
  // ----------------------------------------------------------

  // Badges for cell B live OUTSIDE the grid, on its right side
  // (V(B) beside B's row, the two move returns beside D's row),
  // so arrows, chips and the cart inside B never cover them.
  const SIDE_W = P ? 1.75 : 1.7;
  const SIDE_X = CX + GRID_W / 2 + 0.12 + SIDE_W / 2;

  function stateValueBadge(value) {
    const x = SIDE_X;
    const yy = POS.B[1];

    return new M.VGroup(
      rect(
        x,
        yy,
        SIDE_W,
        0.46,
        STATE,
        DARK,
        0.98,
        0.08,
        2
      ),

      txt(
        `V(B) = ${fmt(value, 2)}`,
        P ? 21 : 20,
        STATE,
        x,
        yy,
        SIDE_W - 0.16,
        true
      )
    );
  }

  function updateStateValue(
    value = learner.current.expectedReturn
  ) {
    return replace(
      'stateValue',
      stateValueBadge(value)
    );
  }

  function actionValueBadge(
    action,
    value
  ) {
    // Return of each move from B, beside D's row, outside the grid.
    return tag(
      `${action === 'down' ? 'down' : 'left'}: ${fmt(value, 2)}`,
      ACTION,
      P ? 18 : 17,
      SIDE_X,
      POS.D[1] + (action === 'down' ? 0.3 : -0.3),
      SIDE_W
    );
  }

  // ----------------------------------------------------------
  // Sampled action and observed immediate reward
  //
  // Down earns reward 10 and ends the delivery.
  // Left earns reward 0 and reaches A.
  //
  // The left action's expected return is not an immediate
  // reward of two.
  // ----------------------------------------------------------

  function rewardBadge(action) {
    const next =
      TRANSITIONS.B[action];

    const {
      sx, sy, ex, ey,
      nx, ny
    } = arrowCoordinates(
      'B',
      next
    );

    // Reward chip in the cell the cart arrives in, clear of B's chips:
    // down: just outside the grid beside the dock; left: lower-left of A.
    const [px, py] = action === 'down'
      ? [CX + GRID_W / 2 + 0.45, POS.D[1] - 0.75]
      : [POS.A[0] - 0.45, POS.A[1] - CELL / 2 + 0.34];

    return tag(
      `+${rewardFor(next)}`,
      REWARD,
      P ? 22 : 19,
      px,
      py,
      0.95
    );
  }

  async function demonstrateAction(
    action,
    extra = []
  ) {
    if (cartState !== 'B') {
      throw new Error(
        'Reset the cart to B before sampling another action.'
      );
    }

    const next =
      TRANSITIONS.B[action];

    const {
      sx, sy, ex, ey
    } = arrowCoordinates(
      'B',
      next
    );

    // Highlight the sampled action without changing its
    // probability width or the other action's probability.

    await play(
      quick(
        [
          ...clear(
            'reward',
            'terminal',
            'destinationFocus'
          ),

          ...replace(
            'selected',
            arrow(
              sx, sy,
              ex, ey,
              WHITE,
              3,
              0.12
            )
          ),

          ...extra
        ],
        0.50
      )
    );

    cartState = next;

    const cart =
      slots.get('cart');

    await play(
      quick(
        [
          new M.Transform(
            cart,
            cartAt(next)
          ),

          ...replace(
            'reward',
            rewardBadge(action)
          ),

          ...replace(
            'destinationFocus',
            stateOutline(
              next,
              next === 'D'
                ? DOCK
                : STATE
            )
          ),

          ...(
            next === 'D'
              ? replace(
                  'terminal',
                  tag(
                    'COMPLETE',
                    DOCK,
                    P ? 16 : 14,
                    POS.D[0],
                    POS.D[1] - CELL / 2 + 0.20,
                    CELL - 0.25
                  )
                )
              : []
          )
        ],
        0.85
      )
    );
  }

  // ----------------------------------------------------------
  // Expected-return comparison
  //
  // Original policy:
  // down = 10
  // left = 2
  // mean = 6
  // ----------------------------------------------------------

  function returnsPicture(
    stage = 3,
    showAdvantages = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.76 : 3.50;

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
      x - w / 2 + 0.47;

    const right =
      x + w / 2 - 0.36;

    const base =
      y - h / 2 + 0.76;

    const top =
      y + h / 2 - 0.77;

    const chartH =
      top - base;

    const barW =
      Math.min(
        0.66,
        (right - left) * 0.22
      );

    const xs = [
      left + (right - left) * 0.24,
      left + (right - left) * 0.76
    ];

    const parts = [
      bg,

      txt(
        showAdvantages
          ? 'ADVANTAGE = RETURN − VALUE'
          : 'EXPECTED RETURN FROM B',
        P ? 22 : 20,
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

    const data = [
      {
        action: 'Down',
        value: 10,
        advantage: 4
      },

      {
        action: 'Left',
        value: 2,
        advantage: -4
      }
    ];

    data.forEach((item, k) => {
      const xx = xs[k];
      const bh =
        chartH * item.value / 11;

      if (stage > k) {
        parts.push(
          block(
            xx,
            base + bh / 2,
            barW,
            bh,
            ACTION,
            0.88
          ),

          txt(
            String(item.value),
            P ? 24 : 21,
            ACTION,
            xx,
            base + bh + 0.17,
            0.95,
            true
          )
        );
      }

      parts.push(
        txt(
          item.action,
          P ? 19 : 17,
          ACTION,
          xx,
          base - 0.20,
          1.15
        )
      );

      if (
        showAdvantages &&
        stage >= 3
      ) {
        const meanY =
          base + chartH * 6 / 11;

        const valueY =
          base + bh;

        const color =
          item.advantage > 0
            ? POSITIVE
            : NEGATIVE;

        const markX =
          xx + barW / 2 + 0.18;

        parts.push(
          arrow(
            markX,
            meanY,
            markX,
            valueY,
            color,
            3,
            0.10
          ),

          txt(
            signed(item.advantage),
            P ? 19 : 17,
            color,
            markX + 0.21,
            (meanY + valueY) / 2,
            0.53,
            true
          )
        );
      }
    });

    if (stage >= 3) {
      const meanY =
        base + chartH * 6 / 11;

      parts.push(
        dashed(
          left,
          meanY,
          right,
          meanY,
          STATE
        ),

        txt(
          'V(B) = 6',
          P ? 19 : 17,
          STATE,
          // Right end, above the line: the down bar's "+4" sits near the middle.
          right - 0.62,
          meanY + 0.19,
          1.30,
          true
        )
      );
    }

    parts.push(
      txt(
        showAdvantages
          ? 'Compare each move with the policy mean.'
          : stage >= 3
            ? '(10 + 2) ÷ 2 = 6'
            : 'Under the original policy',
        P ? 20 : 18,
        STATE,
        x,
        y - h / 2 + 0.21,
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

  // ----------------------------------------------------------
  // Probability wheel
  //
  // Orange: down
  // Muted: left
  //
  // The area of the two sectors represents their probability.
  // The small discretisation is visual only.
  // Probability calculations retain full precision.
  // ----------------------------------------------------------

  function wheelPicture(
    p,
    revealNames = true,
    selected = null,
    pointerAngle = null,
    footer = null
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.85 : 3.55;

    const wheelX =
      x - w * 0.18;

    const wheelY =
      y + (P ? 0.03 : 0.06);

    const radius =
      P ? 0.79 : 1.02;

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
        'ACTION PROBABILITY WHEEL',
        P ? 22 : 20,
        ACTION,
        x,
        y + h / 2 - 0.27,
        w - 0.35,
        true
      ),

      circle(
        wheelX,
        wheelY,
        radius,
        C.muted,
        DARK,
        1,
        2
      )
    ];

    // Construct the wheel from fresh radial lines.
    // The sectors run clockwise from the top of the wheel.

    const slices = 144;

    for (let k = 0; k < slices; k++) {
      const fraction =
        (k + 0.5) / slices;

      const angle =
        Math.PI / 2 -
        2 * Math.PI * fraction;

      const color =
        fraction < p
          ? ACTION
          : C.muted;

      parts.push(
        line(
          wheelX,
          wheelY,
          wheelX +
            radius * 0.96 * Math.cos(angle),
          wheelY +
            radius * 0.96 * Math.sin(angle),
          color,
          P ? 3.2 : 4
        )
      );
    }

    const splitAngle =
      Math.PI / 2 - 2 * Math.PI * p;

    parts.push(
      line(
        wheelX,
        wheelY,
        wheelX,
        wheelY + radius,
        DARK,
        3
      ),

      line(
        wheelX,
        wheelY,
        wheelX +
          radius * Math.cos(splitAngle),
        wheelY +
          radius * Math.sin(splitAngle),
        DARK,
        3
      ),

      circle(
        wheelX,
        wheelY,
        0.075,
        WHITE,
        WHITE,
        1
      )
    );

    if (revealNames) {
      const labelX =
        x + w * 0.30;

      parts.push(
        txt(
          'DOWN',
          P ? 21 : 19,
          ACTION,
          labelX,
          wheelY + 0.54,
          w * 0.30,
          true
        ),

        txt(
          pct(p),
          P ? 30 : 27,
          ACTION,
          labelX,
          wheelY + 0.15,
          w * 0.32,
          true
        ),

        txt(
          'LEFT',
          P ? 21 : 19,
          C.muted,
          labelX,
          wheelY - 0.30,
          w * 0.30,
          true
        ),

        txt(
          pct(1 - p),
          P ? 30 : 27,
          C.muted,
          labelX,
          wheelY - 0.68,
          w * 0.32,
          true
        )
      );
    }

    if (
      selected !== null ||
      pointerAngle !== null
    ) {
      // The narrated sample uses a marker inside the named
      // action's sector. This does not alter the probabilities.

      const fraction =
        selected === 'down'
          ? p / 2
          : p + (1 - p) / 2;

      const a =
        pointerAngle !== null
          ? pointerAngle
          : Math.PI / 2 -
            2 * Math.PI * fraction;

      parts.push(
        arrow(
          wheelX,
          wheelY,
          wheelX +
            radius * 0.83 * Math.cos(a),
          wheelY +
            radius * 0.83 * Math.sin(a),
          WHITE,
          4,
          0.15
        )
      );
    }

    const note =
      footer !== null
        ? footer
        : selected !== null
          ? `Sampled move: ${selected}`
          : 'The two chances add to 100%.';

    parts.push(
      txt(
        note,
        P ? 19 : 18,
        selected !== null
          ? WHITE
          : ACTION,
        x,
        y - h / 2 + 0.22,
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

  // ----------------------------------------------------------
  // Preference-to-probability curve
  //
  // Horizontal axis: z
  // Vertical axis: p(down)
  //
  // The sigmoid maps any finite preference to a probability
  // strictly between zero and one.
  // ----------------------------------------------------------

  function sigmoidPicture(
    z,
    showLeft = false,
    preview = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.85 : 3.65;

    const bg = rect(
      x, y,
      w, h,
      DISCOUNT,
      C.card,
      0.97,
      0.18,
      2
    );

    const left =
      x - w / 2 + 0.54;

    const right =
      x + w / 2 - 0.30;

    const bottom =
      y - h / 2 + 0.78;

    const top =
      y + h / 2 - 0.72;

    const xmin = -4;
    const xmax = 4;

    const gx = v =>
      left +
      (right - left) *
      (v - xmin) / (xmax - xmin);

    const gy = p =>
      bottom + (top - bottom) * p;

    const parts = [
      bg,

      txt(
        'PREFERENCE → PROBABILITY',
        P ? 22 : 20,
        DISCOUNT,
        x,
        y + h / 2 - 0.27,
        w - 0.35,
        true
      ),

      line(
        left, bottom,
        right, bottom,
        C.muted,
        2
      ),

      line(
        left, bottom,
        left, top,
        C.muted,
        2
      )
    ];

    for (const p of [0, 0.5, 1]) {
      const yy = gy(p);

      parts.push(
        txt(
          pct(p, 0),
          P ? 16 : 15,
          C.muted,
          left - 0.25,
          yy,
          0.45,
          true
        )
      );

      if (p > 0) {
        parts.push(
          dashed(
            left, yy,
            right, yy,
            C.muted
          )
        );
      }
    }

    for (const value of [-4, -2, 0, 2, 4]) {
      parts.push(
        txt(
          String(value),
          P ? 16 : 15,
          C.muted,
          gx(value),
          bottom - 0.18,
          0.45,
          true
        )
      );
    }

    const segments = 64;

    for (let i = 0; i < segments; i++) {
      const z1 =
        xmin +
        (xmax - xmin) *
        i / segments;

      const z2 =
        xmin +
        (xmax - xmin) *
        (i + 1) / segments;

      parts.push(
        line(
          gx(z1),
          gy(sigmoid(z1)),
          gx(z2),
          gy(sigmoid(z2)),
          ACTION,
          3
        )
      );

      if (showLeft) {
        parts.push(
          line(
            gx(z1),
            gy(1 - sigmoid(z1)),
            gx(z2),
            gy(1 - sigmoid(z2)),
            C.muted,
            2
          )
        );
      }
    }

    const p =
      sigmoid(z);

    const plotZ =
      Math.max(
        xmin,
        Math.min(xmax, z)
      );

    parts.push(
      dashed(
        gx(plotZ),
        bottom,
        gx(plotZ),
        gy(p),
        DISCOUNT
      ),

      dashed(
        left,
        gy(p),
        gx(plotZ),
        gy(p),
        DISCOUNT
      ),

      glow(
        gx(plotZ),
        gy(p),
        0.085,
        ACTION
      )
    );

    if (showLeft) {
      parts.push(
        glow(
          gx(plotZ),
          gy(1 - p),
          0.075,
          C.muted
        )
      );
    }

    const footer =
      preview
        ? `Example: z = ${fmt(z)} → ${pct(p)} down`
        : `z = ${fmt(z)}    down = ${pct(p)}`;

    parts.push(
      txt(
        footer,
        P ? 20 : 19,
        ACTION,
        x,
        y - h / 2 + 0.20,
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

  // ----------------------------------------------------------
  // Two action probabilities on a common scale
  // ----------------------------------------------------------

  function probabilityBars(
    p,
    previousP = null,
    footer = null
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.70 : 3.10;

    const bg = rect(
      x, y,
      w, h,
      ACTION,
      C.card,
      0.97,
      0.18,
      2
    );

    const barW =
      w - 0.72;

    const left =
      x - barW / 2;

    const parts = [
      bg,

      txt(
        'POLICY AT CELL B',
        P ? 23 : 21,
        ACTION,
        x,
        y + h / 2 - 0.28,
        w - 0.35,
        true
      )
    ];

    const rows = [
      {
        name: 'Down',
        probability: p,
        previous: previousP,
        color: ACTION,
        yy: y + 0.40
      },

      {
        name: 'Left',
        probability: 1 - p,
        previous:
          previousP === null
            ? null
            : 1 - previousP,
        color: C.muted,
        yy: y - 0.56
      }
    ];

    for (const row of rows) {
      parts.push(
        txt(
          row.name,
          P ? 22 : 20,
          row.color,
          x - w * 0.23,
          row.yy + 0.25,
          w * 0.40
        ),

        txt(
          pct(row.probability),
          P ? 27 : 24,
          row.color,
          x + w * 0.28,
          row.yy + 0.25,
          w * 0.32,
          true
        ),

        block(
          x,
          row.yy - 0.08,
          barW,
          0.23,
          C.muted,
          0.10
        )
      );

      const width =
        barW * row.probability;

      if (width > 0) {
        parts.push(
          block(
            left + width / 2,
            row.yy - 0.08,
            width,
            0.23,
            row.color,
            0.90
          )
        );
      }

      if (row.previous !== null) {
        const xx =
          left + barW * row.previous;

        parts.push(
          line(
            xx,
            row.yy - 0.25,
            xx,
            row.yy + 0.10,
            WHITE,
            2
          )
        );
      }
    }

    parts.push(
      txt(
        footer ||
          'Down and left always add to 100%.',
        P ? 19 : 17,
        ACTION,
        x,
        y - h / 2 + 0.21,
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

  // ----------------------------------------------------------
  // Preference update calculation
  //
  // Stage 0: sampled advantage.
  // Stage 1: probability factor.
  // Stage 2: multiplication.
  // Stage 3: new preference.
  // ----------------------------------------------------------

  function updateFormula(
    update,
    stage = 3
  ) {
    const rows = [
      [
        `Sampled move: ${update.action}`,
        ACTION
      ],

      [
        `Advantage = ${signed(update.advantage)}`,
        update.advantage >= 0
          ? POSITIVE
          : NEGATIVE
      ]
    ];

    if (stage >= 1) {
      rows.push([
        update.action === 'down'
          ? `Factor = 1 − p = ${fmt(update.factor)}`
          : `Factor = −p = ${fmt(update.factor)}`,
        DISCOUNT
      ]);
    }

    if (stage >= 2) {
      rows.push(
        [
          `Change = 0.1 × (${fmt(update.advantage)})`,
          C.ink
        ],

        [
          `       × (${fmt(update.factor)})`,
          DISCOUNT
        ],

        [
          `       = ${signed(update.change)}`,
          POSITIVE
        ]
      );
    }

    if (stage >= 3) {
      rows.push(
        [
          `New z = ${fmt(update.oldZ)} + ${fmt(update.change)}`,
          C.ink
        ],

        [
          `      = ${fmt(update.newZ)}`,
          DISCOUNT
        ]
      );
    }

    // Use a compact box to avoid exceeding the phone content
    // area when showing the complete update.

    if (stage === 3) {
      return fbox(
        [
          rows[0],
          rows[1],
          rows[2],

          [
            `Δz = 0.1 × (${fmt(update.advantage)}) × (${fmt(update.factor)})`,
            DISCOUNT
          ],

          [
            `Δz = ${signed(update.change)}`,
            POSITIVE
          ],

          [
            `z: ${fmt(update.oldZ)} → ${fmt(update.newZ)}`,
            DISCOUNT
          ]
        ],
        DISCOUNT
      );
    }

    return fbox(
      rows,
      DISCOUNT
    );
  }

  function prepareUpdate(index) {
    pending =
      calculateUpdate(
        learner.z,
        FIXED_ACTIONS[index],
        ORIGINAL_ADVANTAGES
      );

    return pending;
  }

  function commitUpdate() {
    if (!pending) {
      throw new Error(
        'No pending policy update.'
      );
    }

    const update =
      learner.step(
        pending.action,
        ORIGINAL_ADVANTAGES
      );

    if (
      Math.abs(
        pending.newZ - update.newZ
      ) > 1e-12
    ) {
      throw new Error(
        'Narrated update differs from committed update.'
      );
    }

    pending = null;

    return update;
  }

  // ----------------------------------------------------------
  // Exact expected-return and gap curves
  //
  // Cyan: expected return from B.
  // Purple: gap from the best possible return of 10.
  //
  // These are calculated from the current policy, including
  // its effect on returns from A.
  // ----------------------------------------------------------

  function performancePicture(
    showGap = true,
    extended = false,
    showLatestUpdate = false
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = P ? 2.90 : 3.95;

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
      x - w / 2 + 0.48;

    const right =
      x + w / 2 - 0.32;

    const top =
      y + h / 2 - 0.77;

    const bottom =
      y - h / 2 +
      (showLatestUpdate ? 1.04 : 0.73);

    const history =
      learner.history;

    const last =
      history[history.length - 1];

    const n =
      extended
        ? Math.max(
            240,
            learner.iteration
          )
        : 3;

    const gx = i =>
      left +
      (right - left) * i / n;

    const gy = value =>
      bottom +
      (top - bottom) * value / 10;

    const parts = [
      bg,

      txt(
        'EXPECTED RETURN AND LEARNING GAP',
        P ? 21 : 19,
        STATE,
        x,
        y + h / 2 - 0.27,
        w - 0.35,
        true
      ),

      line(
        left, bottom,
        right, bottom,
        C.muted,
        2
      ),

      line(
        left, bottom,
        left, top,
        C.muted,
        2
      ),

      dashed(
        left, top,
        right, top,
        DOCK
      ),

      txt(
        'Best = 10',
        P ? 16 : 15,
        DOCK,
        right - 0.48,
        top + 0.17,
        0.97,
        true
      )
    ];

    for (const value of [0, 5, 10]) {
      parts.push(
        txt(
          String(value),
          P ? 16 : 15,
          C.muted,
          left - 0.24,
          gy(value),
          0.38,
          true
        )
      );

      if (value === 5) {
        parts.push(
          dashed(
            left,
            gy(value),
            right,
            gy(value),
            C.muted
          )
        );
      }
    }

    const ticks =
      extended
        ? [0, 60, 120, 180, 240]
        : [0, 1, 2, 3];

    for (const tick of ticks) {
      parts.push(
        txt(
          String(tick),
          P ? 16 : 15,
          C.muted,
          gx(tick),
          bottom - 0.17,
          0.58,
          true
        )
      );
    }

    // Downsample rendering only. Keep every computed update.
    // Preserve extrema so fluctuations are not removed.

    const plotted = [];

    if (history.length <= 60) {
      plotted.push(...history);
    } else {
      const bucketSize =
        Math.ceil(
          history.length / 48
        );

      for (
        let k = 0;
        k < history.length;
        k += bucketSize
      ) {
        const bucket =
          history.slice(
            k,
            k + bucketSize
          );

        const minimum =
          bucket.reduce(
            (a, b) =>
              a.expectedReturn <= b.expectedReturn
                ? a
                : b
          );

        const maximum =
          bucket.reduce(
            (a, b) =>
              a.expectedReturn >= b.expectedReturn
                ? a
                : b
          );

        const points = [
          bucket[0],
          minimum,
          maximum,
          bucket[bucket.length - 1]
        ];

        plotted.push(
          ...points
            .filter(
              (item, i, list) =>
                list.findIndex(
                  other =>
                    other.iteration === item.iteration
                ) === i
            )
            .sort(
              (a, b) =>
                a.iteration - b.iteration
            )
        );
      }
    }

    for (
      let i = 1;
      i < plotted.length;
      i++
    ) {
      const a =
        plotted[i - 1];

      const b =
        plotted[i];

      parts.push(
        line(
          gx(a.iteration),
          gy(a.expectedReturn),
          gx(b.iteration),
          gy(b.expectedReturn),
          STATE,
          3.5
        )
      );

      if (showGap) {
        parts.push(
          line(
            gx(a.iteration),
            gy(a.gap),
            gx(b.iteration),
            gy(b.gap),
            DISCOUNT,
            3
          )
        );
      }
    }

    if (!extended) {
      history.forEach(item => {
        const xx =
          gx(item.iteration);

        const yy =
          gy(item.expectedReturn);

        parts.push(
          glow(
            xx,
            yy,
            0.065,
            STATE
          ),

          txt(
            fmt(item.expectedReturn, 2),
            P ? 17 : 16,
            STATE,
            xx,
            yy + 0.17,
            0.82,
            true
          )
        );

        if (showGap) {
          parts.push(
            glow(
              xx,
              gy(item.gap),
              0.055,
              DISCOUNT
            ),

            txt(
              fmt(item.gap, 2),
              P ? 16 : 15,
              DISCOUNT,
              xx,
              gy(item.gap) - 0.17,
              0.82,
              true
            )
          );
        }
      });
    } else {
      parts.push(
        glow(
          gx(last.iteration),
          gy(last.expectedReturn),
          0.07,
          STATE
        )
      );

      if (showGap) {
        parts.push(
          glow(
            gx(last.iteration),
            gy(last.gap),
            0.065,
            DISCOUNT
          )
        );
      }
    }

    parts.push(
      txt(
        `Return: ${fmt(last.expectedReturn, 3)}`,
        P ? 19 : 17,
        STATE,
        x - w * 0.23,
        y - h / 2 + 0.23,
        w * 0.45,
        true
      ),

      txt(
        showGap
          ? `Gap: ${fmt(last.gap, 3)}`
          : `Step: ${last.iteration}`,
        P ? 19 : 17,
        DISCOUNT,
        x + w * 0.25,
        y - h / 2 + 0.23,
        w * 0.43,
        true
      )
    );

    if (
      showLatestUpdate &&
      learner.lastUpdate
    ) {
      const update =
        learner.lastUpdate;

      parts.push(
        txt(
          `${update.action}: Δz = ${signed(update.change)}`,
          P ? 17 : 16,
          ACTION,
          x,
          bottom - 0.49,
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

  // ----------------------------------------------------------
  // Probability factor visual
  //
  // The preference controls both probabilities.
  // Raising z increases p(down) and decreases p(left).
  // ----------------------------------------------------------

  function responsePicture(
    p,
    selectedAction
  ) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = 2.72;

    const bg = rect(
      x, y,
      w, h,
      DISCOUNT,
      C.card,
      0.97,
      0.18,
      2
    );

    const downY =
      y + 0.39;

    const leftY =
      y - 0.43;

    const parts = [
      bg,

      txt(
        'WHAT HAPPENS WHEN z INCREASES?',
        P ? 22 : 20,
        DISCOUNT,
        x,
        y + h / 2 - 0.28,
        w - 0.35,
        true
      ),

      txt(
        'Down',
        P ? 23 : 21,
        ACTION,
        x - w * 0.31,
        downY,
        w * 0.29
      ),

      txt(
        pct(p),
        P ? 25 : 22,
        ACTION,
        x,
        downY,
        w * 0.28,
        true
      ),

      arrow(
        x + w * 0.31,
        downY - 0.19,
        x + w * 0.31,
        downY + 0.25,
        ACTION,
        4
      ),

      txt(
        'Left',
        P ? 23 : 21,
        C.muted,
        x - w * 0.31,
        leftY,
        w * 0.29
      ),

      txt(
        pct(1 - p),
        P ? 25 : 22,
        C.muted,
        x,
        leftY,
        w * 0.28,
        true
      ),

      arrow(
        x + w * 0.31,
        leftY + 0.25,
        x + w * 0.31,
        leftY - 0.19,
        C.muted,
        4
      ),

      txt(
        selectedAction === 'left'
          ? 'For left, the probability factor is negative.'
          : 'For down, the probability factor is positive.',
        P ? 19 : 17,
        DISCOUNT,
        x,
        y - h / 2 + 0.24,
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

  // ----------------------------------------------------------
  // Incorrect advantage warning
  //
  // A deliberately hypothetical wrong-sign estimate is used
  // only to illustrate a possible harmful update.
  //
  // The actual learner is not changed.
  // ----------------------------------------------------------

  function wrongAdvantagePicture() {
    const z =
      learner.z;

    const original =
      evaluatePolicy(z);

    // Incorrectly claim that the better down action has a
    // negative advantage.

    const badUpdate =
      calculateUpdate(
        z,
        'down',
        {
          down: -4,
          left: 4
        }
      );

    return fbox(
      [
        [
          'Hypothetical wrong estimate',
          REWARD
        ],

        'Down is actually better.',

        [
          'Incorrect advantage = −4',
          REWARD
        ],

        [
          `Preference change = ${fmt(badUpdate.change)}`,
          DISCOUNT
        ],

        [
          `Expected return: ${fmt(original.expectedReturn, 3)} → ${fmt(badUpdate.after.expectedReturn, 3)}`,
          STATE
        ],

        [
          'The policy becomes worse.',
          REWARD
        ]
      ],
      REWARD
    );
  }

  // ==========================================================
  // NARRATED BEATS
  // ==========================================================

  // ----------------------------------------------------------
  // 0. Return to the delivery cart in cell B.
  // ----------------------------------------------------------

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

    ...replace(
      'fixedPolicy',
      fixedPolicyPicture()
    ),

    ...resetCart(),

    ...say(
      'BACK TO CELL B',
      STATE
    ),

    ...fbox(
      [
        [
          'Our delivery cart',
          WHITE
        ],

        'Start in cell B.',

        [
          'Reach D: reward 10',
          REWARD
        ],

        'Other moves: reward 0.'
      ],
      STATE
    )
  );

  // ----------------------------------------------------------
  // 1. Down to the dock has probability 50%.
  // ----------------------------------------------------------

  await until(S(1));

  await play(
    ...replace(
      'bPolicy',
      bPolicyPicture(
        0.5,
        true,
        false
      )
    ),

    ...say(
      'DOWN TO D: 50%',
      ACTION
    ),

    ...fbox(
      [
        [
          'At cell B',
          STATE
        ],

        [
          'Down → D',
          ACTION
        ],

        'Probability = 50%'
      ],
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 2. Left to A also has probability 50%.
  // ----------------------------------------------------------

  await until(S(2));

  await play(
    ...updateArrows(0.5),

    ...say(
      'LEFT TO A: 50%',
      ACTION
    ),

    ...fbox(
      [
        [
          'Original policy at B',
          ACTION
        ],

        'Down: 50%',
        'Left: 50%',

        [
          'Total = 100%',
          ACTION
        ]
      ],
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 3. Moving down gives expected return 10.
  // ----------------------------------------------------------

  await until(S(3));

  await play(
    ...replace(
      'qDown',
      actionValueBadge(
        'down',
        10
      )
    ),

    ...returnsPicture(1),

    ...say(
      'DOWN: RETURN = 10',
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 4. Moving left gives expected return 2.
  // ----------------------------------------------------------

  await until(S(4));

  await play(
    ...replace(
      'qLeft',
      actionValueBadge(
        'left',
        2
      )
    ),

    ...returnsPicture(2),

    ...say(
      'LEFT: EXPECTED RETURN = 2',
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 5. The mean expected return from B is six.
  // ----------------------------------------------------------

  await until(S(5));

  await play(
    ...updateStateValue(6),

    ...returnsPicture(3),

    ...say(
      'V(B) = 6',
      STATE
    )
  );

  await until(S(5) + 2.30);

  await play(
    ...fbox(
      [
        [
          'Down: return 10',
          ACTION
        ],

        [
          'Left: expected return 2',
          ACTION
        ],

        'Both have 50% probability.',

        '0.5 × 10 + 0.5 × 2',

        [
          'V(B) = 6',
          STATE
        ]
      ],
      STATE
    )
  );

  // ----------------------------------------------------------
  // 6. Can the cart choose the better move more often?
  // ----------------------------------------------------------

  await until(S(6));

  await play(
    ...say(
      'CAN WE CHOOSE DOWN MORE OFTEN?',
      ACTION
    ),

    ...fbox(
      [
        [
          'Down looks better.',
          ACTION
        ],

        'Can we improve the policy',

        'by changing the chances?'
      ],
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 7. Imagine a wheel with two equal parts.
  // ----------------------------------------------------------

  await until(S(7));

  await play(
    ...clear(
      'qDown',
      'qLeft'
    ),

    ...wheelPicture(
      0.5,
      false
    ),

    ...say(
      'TWO EQUAL PARTS',
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 8. The two parts represent down and left.
  // ----------------------------------------------------------

  await until(S(8));

  await play(
    ...wheelPicture(
      0.5,
      true
    ),

    ...say(
      'ONE PART DOWN, ONE PART LEFT',
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 9. Spin the wheel to sample a move.
  //
  // Illustrative spin only; this is not a learning update.
  // ----------------------------------------------------------

  await until(S(9));

  await play(
    ...say(
      'SPIN TO CHOOSE AN ACTION',
      ACTION
    ),

    ...wheelPicture(
      0.5,
      true,
      null,
      Math.PI / 2
    )
  );

  for (let k = 1; k <= 5; k++) {
    await play(
      quick(
        wheelPicture(
          0.5,
          true,
          null,
          Math.PI / 2 -
            k * Math.PI * 0.69
        ),
        0.16
      )
    );
  }

  // ----------------------------------------------------------
  // 10. Increase the chance of a better-than-expected move.
  //
  // Preview only; z is not updated yet.
  // ----------------------------------------------------------

  await until(S(10));

  await play(
    ...wheelPicture(
      0.62,
      true,
      null,
      null,
      'Illustration: increase the better move'
    ),

    ...updateArrows(0.62),

    ...say(
      'BETTER MOVE: MAKE ITS PART LARGER',
      POSITIVE
    )
  );

  // ----------------------------------------------------------
  // 11. Decrease the chance of a worse-than-expected move.
  // ----------------------------------------------------------

  await until(S(11));

  await play(
    ...probabilityBars(
      0.62,
      0.5,
      'Illustration: the left part becomes smaller'
    ),

    ...say(
      'WORSE MOVE: MAKE ITS PART SMALLER',
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 12. Compare an action's expected return with state value.
  //
  // Restore the original policy after the wheel illustration.
  // ----------------------------------------------------------

  await until(S(12));

  await play(
    ...updateArrows(0.5),

    ...replace(
      'qDown',
      actionValueBadge('down', 10)
    ),

    ...replace(
      'qLeft',
      actionValueBadge('left', 2)
    ),

    ...returnsPicture(
      3,
      true
    ),

    ...say(
      'COMPARE EACH MOVE WITH THE MEAN',
      STATE
    )
  );

  // ----------------------------------------------------------
  // 13. Down: 10 − 6 = 4.
  // ----------------------------------------------------------

  await until(S(13));

  await play(
    new M.Indicate(
      slots.get('qDown'),
      {
        color: POSITIVE
      }
    ),

    ...say(
      'DOWN: 10 − 6 = +4',
      POSITIVE
    ),

    ...fbox(
      [
        [
          'Expected return = 10',
          ACTION
        ],

        [
          'State value = 6',
          STATE
        ],

        [
          '10 − 6 = +4',
          POSITIVE
        ]
      ],
      POSITIVE
    )
  );

  // ----------------------------------------------------------
  // 14. Left: 2 − 6 = −4.
  // ----------------------------------------------------------

  await until(S(14));

  await play(
    new M.Indicate(
      slots.get('qLeft'),
      {
        color: ACTION
      }
    ),

    ...say(
      'LEFT: 2 − 6 = −4',
      NEGATIVE
    ),

    ...fbox(
      [
        [
          'Expected return = 2',
          ACTION
        ],

        [
          'State value = 6',
          STATE
        ],

        [
          '2 − 6 = −4',
          NEGATIVE
        ]
      ],
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 15. Name the difference: advantage.
  // ----------------------------------------------------------

  await until(S(15));

  await play(
    ...returnsPicture(
      3,
      true
    ),

    ...say(
      'ADVANTAGE = EXPECTED RETURN − STATE VALUE',
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 16. Positive advantage means better than the policy mean.
  // ----------------------------------------------------------

  await until(S(16));

  await play(
    ...say(
      'POSITIVE ADVANTAGE: BETTER THAN EXPECTED',
      POSITIVE
    ),

    ...fbox(
      [
        [
          'Down has advantage +4.',
          POSITIVE
        ],

        'It is better than the',

        'original policy’s usual return.'
      ],
      POSITIVE
    )
  );

  // ----------------------------------------------------------
  // 17. Negative advantage means worse than the policy mean.
  // ----------------------------------------------------------

  await until(S(17));

  await play(
    ...say(
      'NEGATIVE ADVANTAGE: WORSE THAN EXPECTED',
      NEGATIVE
    ),

    ...fbox(
      [
        [
          'Left has advantage −4.',
          NEGATIVE
        ],

        'It is worse than the',

        'original policy’s usual return.'
      ],
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 18. Change action probabilities using advantages.
  // ----------------------------------------------------------

  await until(S(18));

  await play(
    ...clear(
      'qDown',
      'qLeft'
    ),

    ...wheelPicture(
      0.65,
      true,
      null,
      null,
      'Illustration of a more favourable policy'
    ),

    ...updateArrows(0.65),

    ...say(
      'USE ADVANTAGES TO IMPROVE THE POLICY',
      POSITIVE
    )
  );

  await until(S(18) + 2.75);

  await play(
    ...fbox(
      [
        [
          'Positive advantage',
          POSITIVE
        ],

        'Encourage the move.',

        [
          'Negative advantage',
          NEGATIVE
        ],

        'Discourage the move.'
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 19. Policy gradient learning.
  // ----------------------------------------------------------

  await until(S(19));

  await play(
    ...say(
      'POLICY GRADIENT LEARNING',
      DISCOUNT
    ),

    ...fbox(
      [
        [
          'POLICY GRADIENT',
          DISCOUNT
        ],

        'Adjust the policy directly.',

        'Increase expected return',

        'by changing action probabilities.'
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 20. Introduce one adjustable number.
  // ----------------------------------------------------------

  await until(S(20));

  await play(
    ...updateArrows(0.5),

    ...updateStatus(0, 0),

    ...wheelPicture(
      0.5,
      true
    ),

    ...say(
      'ONE NUMBER CONTROLS BOTH PARTS',
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 21. Call the number the preference for moving down.
  // ----------------------------------------------------------

  await until(S(21));

  await play(
    ...say(
      'z = PREFERENCE FOR MOVING DOWN',
      DISCOUNT
    ),

    ...fbox(
      [
        [
          'Preference: z',
          DISCOUNT
        ],

        'A larger z encourages down.',

        'The number is not itself',

        'a probability.'
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 22. Preference zero gives equal probabilities.
  // ----------------------------------------------------------

  await until(S(22));

  await play(
    ...sigmoidPicture(0),

    ...say(
      'z = 0: BOTH MOVES 50%',
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 23. Increasing z raises p along a smooth sigmoid curve.
  //
  // Demonstration of the mapping, not a learning update.
  // ----------------------------------------------------------

  await until(S(23));

  await play(
    ...sigmoidPicture(
      0,
      false,
      true
    ),

    ...say(
      'A SMOOTH PREFERENCE-TO-PROBABILITY CURVE',
      DISCOUNT
    )
  );

  for (const previewZ of [
    0.5,
    1,
    1.5,
    2
  ]) {
    await play(
      quick(
        [
          ...sigmoidPicture(
            previewZ,
            false,
            true
          ),

          ...updateArrows(
            sigmoid(previewZ)
          ),

          ...updateStatus(
            previewZ,
            0
          )
        ],
        0.55
      )
    );
  }

  // ----------------------------------------------------------
  // 24. Left decreases by the same amount.
  // ----------------------------------------------------------

  await until(S(24));

  await play(
    ...sigmoidPicture(
      2,
      true,
      true
    ),

    ...say(
      'DOWN INCREASES, LEFT DECREASES',
      ACTION
    )
  );

  await until(S(24) + 1.30);

  await play(
    ...fbox(
      [
        [
          'p = 1 / (1 + exp(−z))',
          ACTION
        ],

        [
          'Chance of down = p',
          ACTION
        ],

        [
          'Chance of left = 1 − p',
          C.muted
        ],

        'The two chances sum to one.'
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 25. Start with z = 0 and learning rate = 0.1.
  // ----------------------------------------------------------

  await until(S(25));

  learner.reset();

  await play(
    ...resetCart(),

    ...updateArrows(),

    ...updateStatus(),

    ...updateStateValue(),

    ...say(
      'START: z = 0, LEARNING RATE = 0.1',
      DISCOUNT
    ),

    ...fbox(
      [
        [
          'Initial preference = 0',
          DISCOUNT
        ],

        [
          'Down probability = 50%',
          ACTION
        ],

        'Left probability = 50%',

        [
          'Learning rate = 0.1',
          DISCOUNT
        ]
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 26. Freeze the original advantages for three updates.
  // ----------------------------------------------------------

  await until(S(26));

  await play(
    ...say(
      'KEEP THESE ADVANTAGES FOR THREE STEPS',
      DISCOUNT
    ),

    ...fbox(
      [
        [
          'Short demonstration batch',
          DISCOUNT
        ],

        [
          'Down advantage = +4',
          POSITIVE
        ],

        [
          'Left advantage = −4',
          NEGATIVE
        ],

        'Keep these estimates unchanged',

        'until all three steps are complete.'
      ],
      DISCOUNT
    )
  );

  // ==========================================================
  // STEP 1
  //
  // Sample down.
  // Advantage = 4.
  // Factor = 1 − 0.5 = 0.5.
  // Change = 0.1 × 4 × 0.5 = 0.2.
  // New z = 0.2.
  // p ≈ 0.5498339973.
  // ==========================================================

  // ----------------------------------------------------------
  // 27. Sample down, advantage +4.
  // ----------------------------------------------------------

  await until(S(27));

  const step1 =
    prepareUpdate(0);

  await demonstrateAction(
    'down',
    [
      ...wheelPicture(
        step1.oldP,
        true,
        'down'
      ),

      ...say(
        'STEP 1: DOWN, ADVANTAGE +4',
        POSITIVE
      )
    ]
  );

  await play(
    quick(
      updateFormula(
        step1,
        0
      ),
      0.40
    )
  );

  // ----------------------------------------------------------
  // 28. Use learning rate, advantage and chance of other move.
  // ----------------------------------------------------------

  await until(S(28));

  await play(
    ...say(
      'USE THE CHANCE OF THE OTHER MOVE',
      DISCOUNT
    ),

    ...updateFormula(
      step1,
      1
    )
  );

  await until(S(28) + 2.20);

  await play(
    ...fbox(
      [
        [
          'Sampled down',
          ACTION
        ],

        [
          'Learning rate = 0.1',
          DISCOUNT
        ],

        [
          'Advantage = +4',
          POSITIVE
        ],

        [
          'Other move probability = 0.5',
          DISCOUNT
        ]
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 29. 0.1 × 4 × 0.5 = 0.2.
  // ----------------------------------------------------------

  await until(S(29));

  await play(
    ...updateFormula(
      step1,
      2
    ),

    ...say(
      '0.1 × 4 × 0.5 = +0.2',
      POSITIVE
    )
  );

  // ----------------------------------------------------------
  // 30. Add 0.2 to the old preference.
  // ----------------------------------------------------------

  await until(S(30));

  const result1 =
    commitUpdate();

  await play(
    ...updateFormula(
      result1,
      3
    ),

    ...updateStatus(),

    ...say(
      'NEW z = 0 + 0.2 = 0.2',
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 31. Convert preference 0.2 to probability about 55%.
  // ----------------------------------------------------------

  await until(S(31));

  await play(
    ...clear(
      'selected',
      'reward',
      'terminal',
      'destinationFocus'
    ),

    ...updateArrows(),

    ...updateStateValue(),

    ...sigmoidPicture(
      learner.z
    ),

    ...say(
      'DOWN CHANCE ≈ 55%',
      ACTION
    )
  );

  await until(S(31) + 2.70);

  await play(
    ...probabilityBars(
      learner.current.pDown,
      result1.oldP
    )
  );

  // ==========================================================
  // STEP 2
  //
  // Sample down again.
  // Keep original advantage = 4.
  // Factor ≈ 0.4501660027.
  // Change ≈ 0.1800664011.
  // New z ≈ 0.3800664011.
  // p ≈ 0.5938891180.
  // ==========================================================

  // ----------------------------------------------------------
  // 32. Return the cart to B and spin again.
  // ----------------------------------------------------------

  await until(S(32));

  await play(
    ...resetCart(),

    ...wheelPicture(
      learner.current.pDown
    ),

    ...say(
      'NEW START IN B: SPIN AGAIN',
      ACTION
    )
  );

  // ----------------------------------------------------------
  // 33. Sample down again, advantage +4.
  // ----------------------------------------------------------

  await until(S(33));

  const step2 =
    prepareUpdate(1);

  await demonstrateAction(
    'down',
    [
      ...wheelPicture(
        step2.oldP,
        true,
        'down'
      ),

      ...say(
        'STEP 2: DOWN AGAIN, ADVANTAGE +4',
        POSITIVE
      )
    ]
  );

  await play(
    quick(
      updateFormula(
        step2,
        0
      ),
      0.35
    )
  );

  // ----------------------------------------------------------
  // 34. The probability of left is now about 0.45.
  // ----------------------------------------------------------

  await until(S(34));

  await play(
    ...probabilityBars(
      step2.oldP,
      null,
      'Use the probability of the other move.'
    ),

    ...say(
      'OTHER MOVE CHANCE ≈ 45%',
      DISCOUNT
    )
  );

  await until(S(34) + 2.10);

  await play(
    ...updateFormula(
      step2,
      1
    )
  );

  // ----------------------------------------------------------
  // 35. Multiply to obtain the preference change.
  // ----------------------------------------------------------

  await until(S(35));

  await play(
    ...updateFormula(
      step2,
      2
    ),

    ...say(
      '0.1 × 4 × 0.4502 ≈ +0.1801',
      POSITIVE
    )
  );

  // ----------------------------------------------------------
  // 36. New preference is approximately 0.38.
  // ----------------------------------------------------------

  await until(S(36));

  const result2 =
    commitUpdate();

  await play(
    ...updateStatus(),

    ...updateFormula(
      result2,
      3
    ),

    ...say(
      'NEW z ≈ 0.3801',
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 37. Down probability rises to about 59.4%.
  // ----------------------------------------------------------

  await until(S(37));

  await play(
    ...clear(
      'selected',
      'reward',
      'terminal',
      'destinationFocus'
    ),

    ...updateArrows(),

    ...updateStateValue(),

    ...sigmoidPicture(
      learner.z
    ),

    ...say(
      'DOWN CHANCE ≈ 59.4%',
      ACTION
    )
  );

  await until(S(37) + 1.70);

  await play(
    ...probabilityBars(
      learner.current.pDown,
      result2.oldP
    )
  );

  // ==========================================================
  // STEP 3
  //
  // Sample left.
  // Keep original advantage = −4.
  // Factor = −p ≈ −0.5938891180.
  // Change ≈ +0.2375556472.
  // New z ≈ 0.6176220483.
  // p ≈ 0.6496775276.
  // ==========================================================

  // ----------------------------------------------------------
  // 38. Third sampled move is left, advantage −4.
  // ----------------------------------------------------------

  await until(S(38));

  await play(
    quick(
      [
        ...resetCart(),

        ...wheelPicture(
          learner.current.pDown
        ),

        ...say(
          'STEP 3: SPIN FROM B AGAIN',
          ACTION
        )
      ],
      0.45
    )
  );

  const step3 =
    prepareUpdate(2);

  await demonstrateAction(
    'left',
    [
      ...wheelPicture(
        step3.oldP,
        true,
        'left'
      ),

      ...say(
        'LEFT: ADVANTAGE −4',
        NEGATIVE
      )
    ]
  );

  await play(
    quick(
      updateFormula(
        step3,
        0
      ),
      0.35
    )
  );

  // ----------------------------------------------------------
  // 39. Encouraging left would require reducing z.
  // ----------------------------------------------------------

  await until(S(39));

  await play(
    ...responsePicture(
      step3.oldP,
      'left'
    ),

    ...say(
      'LEFT RESPONDS IN THE OPPOSITE DIRECTION',
      DISCOUNT
    )
  );

  await until(S(39) + 2.40);

  await play(
    ...fbox(
      [
        [
          'z controls down.',
          DISCOUNT
        ],

        'Increase z:',

        [
          'Down becomes more likely.',
          ACTION
        ],

        [
          'Left becomes less likely.',
          C.muted
        ],

        'For left, use a negative factor.'
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 40. Use negative p(down).
  // ----------------------------------------------------------

  await until(S(40));

  await play(
    ...updateFormula(
      step3,
      1
    ),

    ...say(
      'FACTOR = −p ≈ −0.5939',
      DISCOUNT
    )
  );

  await until(S(40) + 2.60);

  await play(
    ...fbox(
      [
        [
          'Sampled move = left',
          ACTION
        ],

        [
          'Advantage = −4',
          NEGATIVE
        ],

        [
          'Current down chance ≈ 0.5939',
          ACTION
        ],

        [
          'Probability factor ≈ −0.5939',
          DISCOUNT
        ]
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 41. Negative times negative gives a positive change.
  // ----------------------------------------------------------

  await until(S(41));

  await play(
    ...updateFormula(
      step3,
      2
    ),

    ...say(
      'NEGATIVE × NEGATIVE = POSITIVE',
      POSITIVE
    )
  );

  await until(S(41) + 3.30);

  await play(
    ...fbox(
      [
        [
          'Preference change',
          DISCOUNT
        ],

        '0.1 × (−4) × (−0.593889...)',

        [
          `= ${signed(step3.change, 6)}`,
          POSITIVE
        ],

        [
          '≈ +0.24',
          POSITIVE
        ],

        'The preference for down increases.'
      ],
      POSITIVE
    )
  );

  // ----------------------------------------------------------
  // 42. Add the positive change to the old preference.
  // ----------------------------------------------------------

  await until(S(42));

  const result3 =
    commitUpdate();

  await play(
    ...updateStatus(),

    ...updateFormula(
      result3,
      3
    ),

    ...say(
      'NEW z ≈ 0.6176',
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 43. Down probability is now about 65%.
  // ----------------------------------------------------------

  await until(S(43));

  await play(
    ...clear(
      'selected',
      'reward',
      'destinationFocus'
    ),

    ...updateArrows(),

    ...updateStateValue(),

    ...sigmoidPicture(
      learner.z
    ),

    ...say(
      'DOWN CHANCE ≈ 65%',
      ACTION
    )
  );

  await until(S(43) + 1.90);

  await play(
    ...probabilityBars(
      learner.current.pDown,
      result3.oldP
    )
  );

  // ----------------------------------------------------------
  // 44. Sampling the worse move helps us discourage it.
  // ----------------------------------------------------------

  await until(S(44));

  await play(
    ...wheelPicture(
      learner.current.pDown,
      true,
      null,
      null,
      'The sampled worse move becomes less likely.'
    ),

    ...say(
      'SAMPLING LEFT CAN HELP US CHOOSE IT LESS',
      POSITIVE
    )
  );

  await until(S(44) + 2.40);

  await play(
    ...fbox(
      [
        [
          'Before sampling left',
          C.ink
        ],

        [
          `Left = ${pct(1 - result3.oldP)}`,
          C.muted
        ],

        [
          'After the update',
          POSITIVE
        ],

        [
          `Left = ${pct(1 - result3.newP)}`,
          C.muted
        ],

        'A worse action can teach us something.'
      ],
      POSITIVE
    )
  );

  // ==========================================================
  // PERFORMANCE OF THE THREE FIXED UPDATES
  //
  // Step 0:
  // z = 0
  // p = 0.5
  // V(B) = 6
  // gap = 4
  //
  // Step 1:
  // V(B) ≈ 6.422443
  //
  // Step 2:
  // V(B) ≈ 6.791281
  //
  // Step 3:
  // V(B) ≈ 7.252257
  // gap ≈ 2.747743
  // ==========================================================

  // ----------------------------------------------------------
  // 45. Draw expected return after every learning step.
  // ----------------------------------------------------------

  await until(S(45));

  await play(
    ...resetCart(),

    ...performancePicture(
      false,
      false
    ),

    ...say(
      'EXPECTED RETURN AFTER EACH UPDATE',
      STATE
    )
  );

  // ----------------------------------------------------------
  // 46. The expected-return gap falls from 4 to about 2.75.
  // ----------------------------------------------------------

  await until(S(46));

  await play(
    ...performancePicture(
      true,
      false
    ),

    ...say(
      'GAP: 4 → 3.58 → 3.21 → 2.75',
      DISCOUNT
    )
  );

  await until(S(46) + 3.20);

  await play(
    ...fbox(
      [
        [
          'Best possible return = 10',
          DOCK
        ],

        [
          'Original expected return = 6',
          STATE
        ],

        [
          `New expected return ≈ ${fmt(learner.current.expectedReturn, 2)}`,
          STATE
        ],

        'Gap = 10 − expected return',

        [
          `4 → ${fmt(learner.current.gap, 2)}`,
          DISCOUNT
        ]
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 47. Refresh the advantage estimates.
  //
  // Do not keep using +4 and −4 after this point.
  //
  // Use exact policy evaluation for this model-based
  // demonstration. Sample new actions from the updated policy.
  // ----------------------------------------------------------

  await until(S(47));

  const refreshed =
    learner.current.advantages;

  await play(
    ...say(
      'REFRESH THE ADVANTAGE ESTIMATES',
      DISCOUNT
    ),

    ...fbox(
      [
        [
          'The policy has changed.',
          ACTION
        ],

        'Recalculate its expected returns.',

        [
          `Down advantage ≈ ${signed(refreshed.down, 3)}`,
          POSITIVE
        ],

        [
          `Left advantage ≈ ${signed(refreshed.left, 3)}`,
          NEGATIVE
        ],

        'Use fresh samples for new updates.'
      ],
      DISCOUNT
    )
  );

  // Demonstrate a few fresh updates individually before
  // accelerating the learning process.

  for (let k = 0; k < 3; k++) {
    learner.step();

    await play(
      quick(
        [
          ...updateArrows(),

          ...updateStatus(),

          ...updateStateValue(),

          ...performancePicture(
            true,
            true,
            true
          )
        ],
        0.48
      )
    );
  }

  // ----------------------------------------------------------
  // 48. Run many more fresh learning steps.
  //
  // Every action is sampled from its actual current policy.
  // Every advantage is refreshed using current policy evaluation.
  //
  // No probabilities or graph values are forced towards
  // predetermined endpoints.
  // ----------------------------------------------------------

  await until(S(48));

  await play(
    quick(
      say(
        'DOWN CHANCE AND EXPECTED RETURN INCREASE',
        ACTION
      ),
      0.30
    )
  );

  const targets = [
    15,
    30,
    60,
    120,
    180,
    240
  ];

  for (const target of targets) {
    while (
      learner.iteration < target
    ) {
      learner.step();
    }

    await play(
      quick(
        [
          ...updateArrows(),

          ...updateStatus(),

          ...updateStateValue(),

          ...performancePicture(
            true,
            true,
            true
          )
        ],
        0.52
      )
    );
  }

  await play(
    quick(
      [
        ...probabilityBars(
          learner.current.pDown,
          result3.newP,
          'Fresh sampled updates favour the better move.'
        )
      ],
      0.40
    )
  );

  // ----------------------------------------------------------
  // 49. Write the preference update as a short formula.
  // ----------------------------------------------------------

  await until(S(49));

  await play(
    ...say(
      'WRITE THE POLICY GRADIENT UPDATE',
      DISCOUNT
    ),

    ...fbox(
      [
        [
          'Preference change',
          DISCOUNT
        ],

        'Three multiplied quantities:',

        [
          'Learning rate',
          DISCOUNT
        ],

        [
          'Estimated advantage',
          POSITIVE
        ],

        [
          'Probability response factor',
          ACTION
        ]
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 50. Change = learning rate × advantage × factor.
  // ----------------------------------------------------------

  await until(S(50));

  await play(
    ...say(
      'CHANGE = RATE × ADVANTAGE × FACTOR',
      DISCOUNT
    ),

    ...fbox(
      [
        [
          'Preference change =',
          DISCOUNT
        ],

        [
          '  learning rate',
          DISCOUNT
        ],

        [
          '  × estimated advantage',
          POSITIVE
        ],

        [
          '  × probability response factor',
          ACTION
        ],

        [
          'New z = old z + change',
          DISCOUNT
        ]
      ],
      DISCOUNT
    )
  );

  await until(S(50) + 3.50);

  await play(
    ...fbox(
      [
        [
          'For sampled down:',
          ACTION
        ],

        [
          'Δz = 0.1 × advantage × (1 − p)',
          DISCOUNT
        ],

        [
          'For sampled left:',
          ACTION
        ],

        [
          'Δz = 0.1 × advantage × (−p)',
          DISCOUNT
        ]
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 51. The factor is the derivative of log action probability.
  // ----------------------------------------------------------

  await until(S(51));

  await play(
    ...say(
      'RESPONSE OF LOG PROBABILITY TO PREFERENCE',
      DISCOUNT
    ),

    ...fbox(
      [
        [
          'Probability response factor',
          DISCOUNT
        ],

        'd log π(action | B) / dz',

        [
          'Down: d log(p) / dz = 1 − p',
          ACTION
        ],

        [
          'Left: d log(1 − p) / dz = −p',
          ACTION
        ],

        'log means the natural logarithm.'
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 52. Learn the action-selection policy directly.
  //
  // Unlike a purely value-based method, the adjustable
  // parameter directly determines action probabilities.
  //
  // Advantage estimates can still be obtained from values.
  // ----------------------------------------------------------

  await until(S(52));

  await play(
    ...wheelPicture(
      learner.current.pDown,
      true
    ),

    ...say(
      'LEARN ACTION PROBABILITIES DIRECTLY',
      ACTION
    )
  );

  await until(S(52) + 3.25);

  await play(
    ...fbox(
      [
        [
          'Value-based methods',
          STATE
        ],

        'Learn values, then select actions.',

        [
          'Policy gradient methods',
          DISCOUNT
        ],

        'Adjust the action-selection rule.',

        'Advantages guide the adjustment.'
      ],
      DISCOUNT
    )
  );

  // ----------------------------------------------------------
  // 53. Inaccurate advantages can make the policy worse.
  //
  // Show a hypothetical bad update.
  // The actual learner and graph history remain unchanged.
  // ----------------------------------------------------------

  await until(S(53));

  await play(
    ...wrongAdvantagePicture(),

    ...say(
      'INCORRECT ADVANTAGES CAN HURT LEARNING',
      REWARD
    )
  );

  await until(S(53) + 2.90);

  await play(
    ...fbox(
      [
        [
          'Be careful',
          REWARD
        ],

        'Advantage estimates may be wrong.',

        'Individual updates are not',

        'guaranteed to improve a policy.',

        [
          'Keep measuring expected return.',
          STATE
        ]
      ],
      REWARD
    )
  );

  // ----------------------------------------------------------
  // 54. Final recap.
  //
  // Policy gradient learning changes the chances of choosing
  // actions in order to increase expected return.
  // ----------------------------------------------------------

  await until(S(54));

  await play(
    ...updateArrows(),

    ...updateStatus(),

    ...updateStateValue(),

    ...performancePicture(
      true,
      true
    ),

    ...say(
      'POLICY GRADIENT LEARNING',
      DISCOUNT
    )
  );

  await until(S(54) + 2.30);

  await play(
    ...wheelPicture(
      learner.current.pDown,
      true
    ),

    ...say(
      'CHANGE THE CHANCES OF CHOOSING MOVES',
      ACTION
    )
  );

  await until(S(54) + 4.50);

  await play(
    ...say(
      'INCREASE EXPECTED RETURN',
      POSITIVE
    ),

    ...fbox(
      [
        [
          'POLICY GRADIENT LEARNING',
          DISCOUNT
        ],

        'Sample an action.',

        [
          'Estimate its advantage.',
          POSITIVE
        ],

        [
          'Adjust the policy preference.',
          DISCOUNT
        ],

        [
          'Learn better action probabilities.',
          ACTION
        ]
      ],
      POSITIVE
    )
  );

  await until(E(54));
}


// ============================================================
// INTERACTIVE POLICY-GRADIENT SIMULATION
//
// Mount separately into a browser DOM element:
//
// const simulation = mountPolicyGradientSimulation(root);
//
// simulation.destroy() removes timers, event listeners and UI.
//
// This interface uses fresh random actions from its first step.
// It does not replay the three fixed narrated samples.
//
// Controls:
//   Step
//   Play / Pause
//   Speed
//   Reset
//   New data / new start
//
// Displays:
//   Fixed warehouse
//   White cart
//   Green dock
//   Probability-dependent arrow widths
//   Current sampled action and immediate reward
//   Iteration count
//   Preference
//   Current update formula
//   Expected return
//   Expected-return gap curve
//
// Reset restores the original policy and preference.
// A and C never change.
// ============================================================

export function mountPolicyGradientSimulation(root) {
  rand = Math.random;

  if (
    !root ||
    typeof root.appendChild !== 'function'
  ) {
    throw new Error(
      'Supply a browser DOM element as the simulation root.'
    );
  }

  const learner =
    createLearner();

  const COLORS = {
    background: '#0B111B',
    card: '#17212F',
    ink: '#E8EEF7',
    muted: '#8290A4',
    state: '#22D3EE',
    action: '#FB923C',
    reward: '#FBBF24',
    dock: '#4ADE80',
    discount: '#A78BFA',
    white: '#F4F7FC'
  };

  const wrapper =
    document.createElement('section');

  wrapper.style.cssText = `
    box-sizing:border-box;
    width:100%;
    max-width:1100px;
    margin:0 auto;
    padding:16px;
    border:1px solid #334155;
    border-radius:18px;
    background:${COLORS.background};
    color:${COLORS.ink};
    font-family:system-ui,sans-serif;
  `;

  wrapper.innerHTML = `
    <style>
      .pg-controls {
        display:flex;
        align-items:center;
        flex-wrap:wrap;
        gap:8px;
        margin:14px 0;
      }

      .pg-controls button,
      .pg-controls select {
        border:1px solid #46566D;
        border-radius:8px;
        padding:9px 13px;
        color:#E8EEF7;
        background:#17212F;
        font:inherit;
      }

      .pg-controls button {
        cursor:pointer;
      }

      .pg-controls button:hover {
        border-color:#22D3EE;
      }

      .pg-controls button:focus-visible,
      .pg-controls select:focus-visible {
        outline:2px solid #22D3EE;
        outline-offset:3px;
      }

      .pg-layout {
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr);
        gap:14px;
      }

      .pg-panel {
        box-sizing:border-box;
        border:1px solid #334155;
        border-radius:12px;
        padding:12px;
        min-width:0;
        background:#111A27;
      }

      .pg-stats {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:8px;
        margin-bottom:12px;
      }

      .pg-stat {
        min-width:0;
        border:1px solid #334155;
        border-radius:9px;
        padding:9px;
        background:#17212F;
      }

      .pg-stat small {
        display:block;
        color:#A4B0C1;
        font-size:11px;
      }

      .pg-stat strong {
        display:block;
        margin-top:4px;
        color:#22D3EE;
        font-size:18px;
        font-variant-numeric:tabular-nums;
        overflow-wrap:anywhere;
      }

      .pg-probability-track {
        display:flex;
        height:18px;
        border-radius:7px;
        overflow:hidden;
        background:#8290A4;
        margin:8px 0;
      }

      .pg-probability-down {
        background:#FB923C;
        transition:width .15s linear;
      }

      .pg-formula {
        box-sizing:border-box;
        white-space:pre-wrap;
        overflow-wrap:anywhere;
        font-family:ui-monospace,monospace;
        font-size:13px;
        line-height:1.7;
        color:#E8EEF7;
        border:1px solid #A78BFA;
        border-radius:10px;
        padding:12px;
        margin-top:12px;
        min-height:130px;
        background:#17212F;
      }

      .pg-small {
        color:#A4B0C1;
        font-size:12px;
        line-height:1.55;
      }

      @media(max-width:620px) {
        .pg-layout {
          grid-template-columns:1fr;
        }

        .pg-stats {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
      }
    </style>

    <div style="font-size:19px;font-weight:650">
      Policy gradient learning
    </div>

    <div class="pg-small" style="margin-top:5px">
      Learn the action probabilities at B.
      A and C retain their original policies.
    </div>

    <div class="pg-controls">
      <button type="button" data-pg="step">
        Step
      </button>

      <button type="button" data-pg="play">
        Play
      </button>

      <label for="pg-speed">
        Speed
      </label>

      <select id="pg-speed" data-pg="speed">
        <option value="1000">1×</option>
        <option value="500">2×</option>
        <option value="250">4×</option>
        <option value="100">10×</option>
      </select>

      <button type="button" data-pg="reset">
        Reset
      </button>

      <button type="button" data-pg="new">
        New data / new start
      </button>
    </div>

    <div class="pg-stats">
      <div class="pg-stat">
        <small>Iteration</small>
        <strong data-pg="iteration">0</strong>
      </div>

      <div class="pg-stat">
        <small>Preference z</small>
        <strong data-pg="preference">0</strong>
      </div>

      <div class="pg-stat">
        <small>Down probability</small>
        <strong data-pg="down">50%</strong>
      </div>

      <div class="pg-stat">
        <small>Left probability</small>
        <strong data-pg="left">50%</strong>
      </div>

      <div class="pg-stat">
        <small>Expected return from B</small>
        <strong data-pg="return">6</strong>
      </div>

      <div class="pg-stat">
        <small>Gap from best return</small>
        <strong data-pg="gap">4</strong>
      </div>
    </div>

    <div class="pg-layout">
      <div class="pg-panel">
        <div style="font-weight:600;margin-bottom:8px">
          Warehouse
        </div>

        <svg
          data-pg="warehouse"
          viewBox="0 0 340 340"
          width="100%"
          role="img"
          aria-label="Four-cell warehouse showing current action probabilities"
        ></svg>

        <div
          data-pg="sample"
          class="pg-small"
          aria-live="polite"
        >
          Ready to sample a move from B.
        </div>

        <div class="pg-probability-track">
          <div
            class="pg-probability-down"
            data-pg="bar"
            style="width:50%"
          ></div>
        </div>

        <div style="
          display:flex;
          justify-content:space-between;
          gap:8px;
          font-size:13px;
        ">
          <span style="color:#FB923C" data-pg="barDown">
            Down 50%
          </span>

          <span style="color:#A4B0C1" data-pg="barLeft">
            Left 50%
          </span>
        </div>
      </div>

      <div class="pg-panel">
        <div style="font-weight:600;margin-bottom:8px">
          Expected return and gap
        </div>

        <svg
          data-pg="chart"
          viewBox="0 0 340 260"
          width="100%"
          role="img"
          aria-label="Expected return and gap over learning iterations"
        ></svg>

        <div style="
          display:flex;
          gap:15px;
          flex-wrap:wrap;
          font-size:12px;
        ">
          <span style="color:#22D3EE">
            Expected return
          </span>

          <span style="color:#A78BFA">
            Gap from 10
          </span>
        </div>

        <div
          class="pg-formula"
          data-pg="formula"
        ></div>
      </div>
    </div>

    <div class="pg-small" style="margin-top:12px">
      Each step samples a fresh action at B. The advantage
      estimates are refreshed using exact evaluation of the
      current warehouse policy. This is a model-based
      demonstration of the policy-gradient update.
      Rewards belong to moves: entering D earns 10;
      every other move earns 0.
    </div>
  `;

  root.appendChild(wrapper);

  const get = name =>
    wrapper.querySelector(
      `[data-pg="${name}"]`
    );

  const elements = {
    step: get('step'),
    play: get('play'),
    speed: get('speed'),
    reset: get('reset'),
    newStart: get('new'),

    iteration: get('iteration'),
    preference: get('preference'),

    down: get('down'),
    left: get('left'),

    expectedReturn: get('return'),
    gap: get('gap'),

    warehouse: get('warehouse'),
    chart: get('chart'),

    sample: get('sample'),

    bar: get('bar'),
    barDown: get('barDown'),
    barLeft: get('barLeft'),

    formula: get('formula')
  };

  // ----------------------------------------------------------
  // Interactive playback state
  // ----------------------------------------------------------

  let timer = null;
  let destroyed = false;

  function pause() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    elements.play.textContent =
      'Play';
  }

  function start() {
    if (destroyed) return;

    pause();

    const delay =
      Number(
        elements.speed.value
      );

    elements.play.textContent =
      'Pause';

    timer = setInterval(
      () => {
        if (
          !wrapper.isConnected ||
          destroyed
        ) {
          pause();
          return;
        }

        step();
      },
      delay
    );
  }

  // ----------------------------------------------------------
  // Interactive warehouse
  // ----------------------------------------------------------

  function renderWarehouse() {
    const current =
      learner.current;

    const last =
      learner.lastUpdate;

    const p =
      current.pDown;

    const positions = {
      A: [90, 90],
      B: [250, 90],
      C: [90, 250],
      D: [250, 250]
    };

    const cartCell =
      last
        ? last.destination
        : 'B';

    const [cartX, cartY] =
      positions[cartCell];

    const svg = [];

    svg.push(`
      <defs>
        <marker
          id="pg-arrow-orange"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path
            d="M0,0 L5,2.5 L0,5 Z"
            fill="${COLORS.action}"
          />
        </marker>

        <marker
          id="pg-arrow-muted"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path
            d="M0,0 L5,2.5 L0,5 Z"
            fill="${COLORS.muted}"
          />
        </marker>
      </defs>
    `);

    for (const s of [
      'A', 'B', 'C', 'D'
    ]) {
      const [x, y] =
        positions[s];

      const color =
        s === 'D'
          ? COLORS.dock
          : s === 'B'
            ? COLORS.state
            : '#415269';

      svg.push(`
        <rect
          x="${x - 80}"
          y="${y - 80}"
          width="160"
          height="160"
          rx="5"
          fill="${COLORS.card}"
          stroke="${color}"
          stroke-width="${s === 'B' ? 3 : 1.5}"
        />

        <text
          x="${x - 61}"
          y="${y - 57}"
          fill="${s === 'D' ? COLORS.dock : COLORS.ink}"
          font-size="19"
          font-weight="bold"
        >${s}</text>
      `);
    }

    // Green dock.

    svg.push(`
      <path
        d="M205 221 V285 H295 V221"
        fill="none"
        stroke="${COLORS.dock}"
        stroke-width="4"
        opacity=".8"
      />

      <text
        x="266"
        y="194"
        fill="${COLORS.dock}"
        font-size="13"
        text-anchor="middle"
      >DOCK</text>

      <text
        x="250"
        y="304"
        fill="${COLORS.dock}"
        font-size="12"
        text-anchor="middle"
      >Terminal</text>
    `);

    // Fixed policy arrows from A and C.

    svg.push(`
      <line
        x1="125" y1="76"
        x2="211" y2="76"
        stroke="${COLORS.muted}"
        stroke-width="4.5"
        marker-end="url(#pg-arrow-muted)"
      />

      <text
        x="170" y="65"
        text-anchor="middle"
        fill="${COLORS.muted}"
        font-size="12"
      >50%</text>

      <line
        x1="76" y1="125"
        x2="76" y2="210"
        stroke="${COLORS.muted}"
        stroke-width="4.5"
        marker-end="url(#pg-arrow-muted)"
      />

      <text
        x="53" y="174"
        text-anchor="middle"
        fill="${COLORS.muted}"
        font-size="12"
      >50%</text>

      <line
        x1="104" y1="210"
        x2="104" y2="125"
        stroke="${COLORS.muted}"
        stroke-width="1"
        stroke-dasharray="4 4"
        marker-end="url(#pg-arrow-muted)"
      />

      <text
        x="123" y="174"
        text-anchor="middle"
        fill="${COLORS.muted}"
        font-size="11"
      >0%</text>

      <line
        x1="126" y1="250"
        x2="207" y2="250"
        stroke="${COLORS.muted}"
        stroke-width="8"
        marker-end="url(#pg-arrow-muted)"
      />

      <text
        x="167" y="237"
        text-anchor="middle"
        fill="${COLORS.muted}"
        font-size="12"
      >100%</text>
    `);

    // Only these two arrows change.

    const downWidth =
      1.5 + 8 * p;

    const leftWidth =
      1.5 + 8 * (1 - p);

    svg.push(`
      <line
        x1="250" y1="125"
        x2="250" y2="208"
        stroke="${COLORS.action}"
        stroke-width="${downWidth}"
        marker-end="url(#pg-arrow-orange)"
      />

      <text
        x="277" y="174"
        text-anchor="middle"
        fill="${COLORS.action}"
        font-size="13"
        font-weight="bold"
      >${pct(p)}</text>

      <line
        x1="211" y1="104"
        x2="129" y2="104"
        stroke="${COLORS.action}"
        stroke-width="${leftWidth}"
        marker-end="url(#pg-arrow-orange)"
      />

      <text
        x="170" y="125"
        text-anchor="middle"
        fill="${COLORS.action}"
        font-size="13"
        font-weight="bold"
      >${pct(1 - p)}</text>
    `);

    // Current exact state values.
    // These values describe future return, not immediate reward.

    for (const s of [
      'A', 'B', 'C', 'D'
    ]) {
      const [x, y] =
        positions[s];

      const value =
        current.values[s];

      svg.push(`
        <text
          x="${x}"
          y="${y + 59}"
          text-anchor="middle"
          font-size="13"
          fill="${COLORS.state}"
          font-family="monospace"
        >V(${s})=${fmt(value, 2)}</text>
      `);
    }

    // Show the most recently observed reward.

    if (last) {
      const rewardX =
        last.action === 'down'
          ? 225
          : 170;

      const rewardY =
        last.action === 'down'
          ? 176
          : 91;

      svg.push(`
        <text
          x="${rewardX}"
          y="${rewardY}"
          text-anchor="middle"
          font-size="15"
          font-weight="bold"
          fill="${COLORS.reward}"
          stroke="${COLORS.background}"
          stroke-width="3"
          paint-order="stroke"
        >+${last.reward}</text>
      `);
    }

    // White cart, positioned at its sampled destination.

    svg.push(`
      <g transform="translate(${cartX},${cartY - 7})">
        <circle
          cx="0" cy="0"
          r="32"
          fill="${COLORS.white}"
          opacity=".05"
        />

        <rect
          x="-22" y="-14"
          width="44" height="28"
          rx="7"
          fill="${COLORS.white}"
        />

        <rect
          x="-15" y="-19"
          width="24" height="24"
          rx="3"
          fill="#C9D4E4"
          stroke="${COLORS.white}"
        />

        <rect
          x="-5" y="-19"
          width="5" height="24"
          fill="#91A2B8"
        />

        <circle
          cx="-14" cy="15" r="5"
          fill="${COLORS.background}"
          stroke="${COLORS.white}"
          stroke-width="2"
        />

        <circle
          cx="14" cy="15" r="5"
          fill="${COLORS.background}"
          stroke="${COLORS.white}"
          stroke-width="2"
        />

        <path
          d="M22 -3 L29 -16 H34"
          fill="none"
          stroke="${COLORS.white}"
          stroke-width="3"
        />
      </g>
    `);

    elements.warehouse.innerHTML =
      svg.join('');
  }

  // ----------------------------------------------------------
  // Interactive expected-return and gap graph
  //
  // Every data point is calculated from the actual policy.
  // No smoothing or artificial monotonicity is imposed.
  // ----------------------------------------------------------

  function renderChart() {
    const history =
      learner.history;

    const left = 39;
    const right = 320;

    const top = 20;
    const bottom = 222;

    const n =
      Math.max(
        10,
        learner.iteration
      );

    const gx = i =>
      left +
      (right - left) * i / n;

    const gy = v =>
      bottom -
      (bottom - top) * v / 10;

    const svg = [];

    svg.push(`
      <line
        x1="${left}"
        y1="${bottom}"
        x2="${right}"
        y2="${bottom}"
        stroke="${COLORS.muted}"
      />

      <line
        x1="${left}"
        y1="${bottom}"
        x2="${left}"
        y2="${top}"
        stroke="${COLORS.muted}"
      />
    `);

    for (const v of [0, 2, 4, 6, 8, 10]) {
      const yy = gy(v);

      svg.push(`
        <line
          x1="${left}"
          y1="${yy}"
          x2="${right}"
          y2="${yy}"
          stroke="${v === 10 ? COLORS.dock : '#334155'}"
          stroke-dasharray="4 4"
        />

        <text
          x="${left - 8}"
          y="${yy + 4}"
          fill="${COLORS.muted}"
          font-size="11"
          text-anchor="end"
        >${v}</text>
      `);
    }

    const tickValues =
      [...new Set(
        Array.from(
          { length: 5 },
          (_, i) =>
            Math.round(i * n / 4)
        )
      )];

    for (const value of tickValues) {
      svg.push(`
        <text
          x="${gx(value)}"
          y="${bottom + 17}"
          fill="${COLORS.muted}"
          font-size="11"
          text-anchor="middle"
        >${value}</text>
      `);
    }

    // For long sessions, retain bucket minima and maxima.

    const bucketSize =
      Math.max(
        1,
        Math.ceil(
          history.length / 350
        )
      );

    const points = [];

    for (
      let i = 0;
      i < history.length;
      i += bucketSize
    ) {
      const bucket =
        history.slice(
          i,
          i + bucketSize
        );

      const minimum =
        bucket.reduce(
          (a, b) =>
            a.expectedReturn <= b.expectedReturn
              ? a
              : b
        );

      const maximum =
        bucket.reduce(
          (a, b) =>
            a.expectedReturn >= b.expectedReturn
              ? a
              : b
        );

      points.push(
        ...[
          bucket[0],
          minimum,
          maximum,
          bucket[bucket.length - 1]
        ]
          .filter(
            (item, k, list) =>
              list.findIndex(
                other =>
                  other.iteration === item.iteration
              ) === k
          )
          .sort(
            (a, b) =>
              a.iteration - b.iteration
          )
      );
    }

    const returnPoints =
      points.map(
        item =>
          `${gx(item.iteration)},${gy(item.expectedReturn)}`
      ).join(' ');

    const gapPoints =
      points.map(
        item =>
          `${gx(item.iteration)},${gy(item.gap)}`
      ).join(' ');

    const last =
      history[history.length - 1];

    svg.push(`
      <polyline
        points="${returnPoints}"
        fill="none"
        stroke="${COLORS.state}"
        stroke-width="2.7"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <polyline
        points="${gapPoints}"
        fill="none"
        stroke="${COLORS.discount}"
        stroke-width="2.4"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <circle
        cx="${gx(last.iteration)}"
        cy="${gy(last.expectedReturn)}"
        r="4"
        fill="${COLORS.state}"
      />

      <circle
        cx="${gx(last.iteration)}"
        cy="${gy(last.gap)}"
        r="4"
        fill="${COLORS.discount}"
      />

      <text
        x="${(left + right) / 2}"
        y="255"
        text-anchor="middle"
        fill="${COLORS.muted}"
        font-size="11"
      >Learning steps</text>
    `);

    elements.chart.innerHTML =
      svg.join('');
  }

  // ----------------------------------------------------------
  // Update statistics and formula
  // ----------------------------------------------------------

  function render() {
    if (destroyed) return;

    const current =
      learner.current;

    const last =
      learner.lastUpdate;

    elements.iteration.textContent =
      String(learner.iteration);

    elements.preference.textContent =
      fmt(learner.z, 5);

    elements.down.textContent =
      pct(current.pDown, 2);

    elements.left.textContent =
      pct(current.pLeft, 2);

    elements.expectedReturn.textContent =
      fmt(current.expectedReturn, 4);

    elements.gap.textContent =
      fmt(current.gap, 4);

    elements.bar.style.width =
      `${100 * current.pDown}%`;

    elements.barDown.textContent =
      `Down ${pct(current.pDown, 2)}`;

    elements.barLeft.textContent =
      `Left ${pct(current.pLeft, 2)}`;

    if (!last) {
      elements.sample.textContent =
        'Ready to sample a fresh action from B.';

      elements.formula.textContent =
        [
          'Initial preference z = 0',
          'Learning rate = 0.1',
          'Down probability = 0.5',
          'Left probability = 0.5',
          'Down advantage = +4',
          'Left advantage = −4',
          'Press Step or Play to begin.'
        ].join('\n');
    } else {
      const completion =
        last.destination === 'D'
          ? ' Delivery complete.'
          : '';

      elements.sample.textContent =
        `Sampled ${last.action}: B → ${last.destination}. ` +
        `Immediate reward = ${last.reward}.` +
        completion +
        ' Next sample starts afresh at B.';

      elements.formula.textContent =
        [
          `Step ${last.iteration}: ${last.action}`,

          `Old z = ${fmt(last.oldZ, 6)}`,

          `Advantage = ${signed(last.advantage, 6)}`,

          last.action === 'down'
            ? `Factor = 1 − p = ${fmt(last.factor, 6)}`
            : `Factor = −p = ${fmt(last.factor, 6)}`,

          `Δz = 0.1 × (${fmt(last.advantage, 6)}) × (${fmt(last.factor, 6)})`,

          `Δz = ${signed(last.change, 6)}`,

          `New z = ${fmt(last.newZ, 6)}`
        ].join('\n');
    }

    renderWarehouse();
    renderChart();
  }

  // ----------------------------------------------------------
  // Simulation controls
  // ----------------------------------------------------------

  function step() {
    if (destroyed) return null;

    // No forced action and no frozen advantages:
    // fresh random sample, refreshed advantage estimates.

    const update =
      learner.step();

    render();

    return update;
  }

  function reset() {
    pause();
    learner.reset();
    render();
  }

  function newStart() {
    // Begin a fresh independent random learning run.
    // Restore the original warehouse and policy before sampling.

    reset();
    step();
  }

  function onStep() {
    pause();
    step();
  }

  function onPlay() {
    if (timer === null) {
      start();
    } else {
      pause();
    }
  }

  function onSpeedChange() {
    if (timer !== null) {
      start();
    }
  }

  elements.step.addEventListener(
    'click',
    onStep
  );

  elements.play.addEventListener(
    'click',
    onPlay
  );

  elements.speed.addEventListener(
    'change',
    onSpeedChange
  );

  elements.reset.addEventListener(
    'click',
    reset
  );

  elements.newStart.addEventListener(
    'click',
    newStart
  );

  // ----------------------------------------------------------
  // Explicit cleanup for host navigation
  // ----------------------------------------------------------

  function destroy() {
    if (destroyed) return;

    pause();

    destroyed = true;

    elements.step.removeEventListener(
      'click',
      onStep
    );

    elements.play.removeEventListener(
      'click',
      onPlay
    );

    elements.speed.removeEventListener(
      'change',
      onSpeedChange
    );

    elements.reset.removeEventListener(
      'click',
      reset
    );

    elements.newStart.removeEventListener(
      'click',
      newStart
    );

    wrapper.remove();
  }

  render();

  return {
    step,
    play: start,
    pause,
    reset,
    newStart,
    destroy,

    get state() {
      return {
        iteration: learner.iteration,
        ...learner.current
      };
    },

    get history() {
      return learner.history.map(
        item => ({
          ...item,

          values: {
            ...item.values
          },

          returns: {
            ...item.returns
          },

          advantages: {
            ...item.advantages
          }
        })
      );
    }
  };
}

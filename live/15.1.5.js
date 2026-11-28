// lesson 15.1.5
// Thompson sampling: drawing possible return rates.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Narrated examples use the fixed chapter reward sequences.
// Later accelerated choices use illustrative possible draws.
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
  const UNCERTAIN = C.violet;
  const DARK = '#17212F';

  const CX = P ? 0 : -2.6;

  const AX = CX - 1.8;
  const BX = CX + 1.8;

  const CARD_Y = P ? 3.3 : 0.98;
  const CARD_W = P ? 3.15 : 3.15;
  const CARD_H = P ? 1.15 : 1.05;

  const GRAPH_W = P ? 2.85 : 2.85;
  const GRAPH_H = P ? 2.95 : 1.45;
  const BASE = P ? -0.45 : -1.10;

  const AXIS_LABEL_Y = BASE - 0.28;
  const AXIS_NAME_Y = BASE - (P ? 0.66 : 0.58);
  const DRAW_Y = P ? -1.62 : -2.0;
  const BETA_Y = P ? -2.15 : -2.38;
  const COUNT_Y = P ? -2.6 : -2.73;
  const REWARD_Y = P ? -3.02 : -3.05;

  const PILL = P
    ? [0, 4.3, 0]
    : [0, 1.95, 0];

  const BOXP = P
    ? [0, -4.85, 0]
    : [4.25, -0.55, 0];

  const BOX_W = P
    ? Math.min(FW - 1.15, 6.65)
    : 4.25;

  // Both distributions use the same vertical density scale.
  // The vertical axis represents density, not probability itself.

  const DENSITY_MAX = 4;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const px = p => p === 'A' ? AX : BX;
  const pc = p => p === 'A' ? A : B;

  // ------------------------------------------------------------
  // Fixed chapter reward sequences
  // ------------------------------------------------------------

  const REWARDS = {
    A: [1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    B: [0, 1, 1, 1, 0, 1, 1, 1, 1, 0]
  };

  const history = {
    A: [],
    B: []
  };

  const parameters = {
    A: [1, 1],
    B: [1, 1]
  };

  function observe(p) {
    const i = history[p].length;

    if (i >= REWARDS[p].length) {
      throw new Error(`Narrated rewards exhausted for prompt ${p}`);
    }

    const reward = REWARDS[p][i];

    history[p].push(reward);

    return reward;
  }

  function returns(p) {
    return history[p].reduce((sum, r) => sum + r, 0);
  }

  function failures(p) {
    return history[p].length - returns(p);
  }

  function estimate(p) {
    return history[p].length
      ? returns(p) / history[p].length
      : null;
  }

  function updateParameters(p) {
    parameters[p] = [
      1 + returns(p),
      1 + failures(p)
    ];

    return parameters[p];
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
    fill = color, opacity = 1
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2
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

  function glow(x, y, r, color) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: r * 1.85,
      color
    });

    halo.setFill(color, 0.13);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius: r,
      color
    });

    dot.setFill(color, 0.98);

    return new M.VGroup(halo, dot);
  }

  function check(x, y, color, r = 0.12) {
    return new M.VGroup(
      line(
        x - r * 0.70,
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
        x - r * 0.57,
        y - r * 0.57,
        x + r * 0.57,
        y + r * 0.57,
        color,
        2
      ),
      line(
        x - r * 0.57,
        y + r * 0.57,
        x + r * 0.57,
        y - r * 0.57,
        color,
        2
      )
    );
  }

  function rewardMark(x, y, reward, radius = 0.15) {
    const color = reward === 1 ? GOOD : BAD;

    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 1.36,
      color
    });

    halo.setFill(color, reward === 1 ? 0.12 : 0.05);

    const disk = circle(
      x, y,
      radius,
      color,
      color,
      reward === 1 ? 0.25 : 0.18
    );

    const mark = reward === 1
      ? check(x, y, color, radius)
      : cross(x, y, color, radius);

    return new M.VGroup(halo, disk, mark);
  }

  function unknownMark(x, y, radius = 0.15) {
    return new M.VGroup(
      circle(
        x, y, radius,
        C.muted, DARK, 1
      ),
      txt(
        '?',
        17,
        C.muted,
        x, y,
        radius * 1.65,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Replaceable on-screen objects
  //
  // Objects already on screen are never placed into a new VGroup.
  // Each replacement creates a fresh group.
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

  function quick(animations, duration = 0.20) {
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

    const r = rect(
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
      const indent = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      const available = Math.max(
        0.5,
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
      new M.VGroup(r, ...texts)
    );
  }

  // ------------------------------------------------------------
  // Study app and prompt cards
  // ------------------------------------------------------------

  function quizIcon(x, y, color) {
    const paper = rect(
      x, y,
      0.40, 0.46,
      color, color, 0.10,
      0.045, 2
    );

    const question = txt(
      '?', 20, color,
      x, y + 0.025
    );

    const foot = line(
      x - 0.105, y - 0.145,
      x + 0.105, y - 0.145,
      color, 2
    );

    return new M.VGroup(
      paper,
      question,
      foot
    );
  }

  function reminderIcon(x, y, color) {
    const bell = rect(
      x, y + 0.025,
      0.35, 0.35,
      color, color, 0.13,
      0.12, 2
    );

    const rim = line(
      x - 0.24, y - 0.13,
      x + 0.24, y - 0.13,
      color, 3
    );

    const clapper = circle(
      x, y - 0.21,
      0.042,
      color, color, 1
    );

    return new M.VGroup(
      bell,
      rim,
      clapper,
      line(
        x - 0.28, y + 0.06,
        x - 0.33, y + 0.16,
        color, 2
      ),
      line(
        x + 0.28, y + 0.06,
        x + 0.33, y + 0.16,
        color, 2
      )
    );
  }

  function appPicture() {
    const x = CX;
    const y = P ? -0.05 : -0.35;

    const w = P ? 3.3 : 3.1;
    const h = P ? 4.65 : 3.65;

    const body = rect(
      x, y,
      w, h,
      C.ink, C.card, 1,
      0.24, 3
    );

    const header = rect(
      x, y + h / 2 - 0.53,
      w - 0.40, 0.66,
      A, A, 0.13,
      0.12, 1
    );

    const title = txt(
      'Study app',
      P ? 28 : 25,
      A,
      x,
      y + h / 2 - 0.53
    );

    const bookY = y + 0.20;

    const pages = [
      rect(
        x - 0.36, bookY,
        0.67, 0.92,
        A, A, 0.13,
        0.06, 2
      ),
      rect(
        x + 0.36, bookY,
        0.67, 0.92,
        A, A, 0.13,
        0.06, 2
      )
    ];

    const marks = [];

    for (let k = 0; k < 3; k++) {
      const yy = bookY + 0.22 - k * 0.21;

      marks.push(
        line(
          x - 0.59, yy,
          x - 0.15, yy,
          A, 2
        ),
        line(
          x + 0.15, yy,
          x + 0.59, yy,
          A, 2
        )
      );
    }

    const goal = txt(
      'Return tomorrow',
      P ? 23 : 21,
      GOOD,
      x,
      y - h / 2 + 0.55,
      w - 0.45
    );

    return new M.VGroup(
      body,
      header,
      title,
      ...pages,
      ...marks,
      goal
    );
  }

  function promptCard(p) {
    const x = px(p);
    const color = pc(p);

    const bg = rect(
      x, CARD_Y,
      CARD_W, CARD_H,
      color, color, 0.075,
      0.16, 2
    );

    const icon = p === 'A'
      ? quizIcon(x - 1.05, CARD_Y + 0.15, color)
      : reminderIcon(x - 1.05, CARD_Y + 0.15, color);

    const heading = txt(
      `PROMPT ${p}`,
      P ? 23 : 21,
      color,
      x + 0.20,
      CARD_Y + 0.25,
      CARD_W - 1.0,
      true
    );

    const message = p === 'A'
      ? 'Try a quick quiz!'
      : 'Time for more practice!';

    const messageText = txt(
      message,
      P ? 19 : 18,
      C.ink,
      x,
      CARD_Y - 0.25,
      CARD_W - 0.28
    );

    return new M.VGroup(
      bg,
      icon,
      heading,
      messageText
    );
  }

  const app = appPicture();
  const cardA = promptCard('A');
  const cardB = promptCard('B');

  function chosenOutline(p) {
    const x = px(p);
    const color = pc(p);

    return rect(
      x,
      CARD_Y,
      CARD_W + 0.15,
      CARD_H + 0.14,
      color,
      color,
      0.025,
      0.20,
      4
    );
  }

  function choose(p) {
    return replace(
      'chosen',
      chosenOutline(p)
    );
  }

  function learnerPicture(p, reward = null) {
    const x = BOXP[0];
    const y = BOXP[1];

    const color = pc(p);

    const bg = rect(
      x, y,
      BOX_W, 1.85,
      color, C.card, 0.97,
      0.18, 2
    );

    const learner = glow(
      x - BOX_W / 2 + 0.60,
      y + 0.17,
      0.15,
      C.ink
    );

    const label = txt(
      'Learner',
      P ? 17 : 15,
      C.ink,
      x - BOX_W / 2 + 0.60,
      y - 0.28,
      1.05
    );

    const prompt = rect(
      x,
      y + 0.17,
      0.65, 0.65,
      color, color, 0.15,
      0.12, 2
    );

    const letter = txt(
      p, 28, color,
      x, y + 0.17,
      0.45, true
    );

    const connector1 = line(
      x - BOX_W / 2 + 0.92,
      y + 0.17,
      x - 0.37,
      y + 0.17,
      color, 2
    );

    const connector2 = line(
      x + 0.37,
      y + 0.17,
      x + BOX_W / 2 - 0.92,
      y + 0.17,
      C.muted, 2
    );

    const outcomeX = x + BOX_W / 2 - 0.55;

    const outcome = reward === null
      ? unknownMark(outcomeX, y + 0.17, 0.24)
      : rewardMark(outcomeX, y + 0.17, reward, 0.24);

    const resultText = txt(
      reward === null
        ? 'Tomorrow?'
        : reward === 1
          ? 'Returns'
          : 'No return',
      P ? 17 : 15,
      reward === 1
        ? GOOD
        : C.muted,
      outcomeX,
      y - 0.28,
      1.05
    );

    const heading = txt(
      reward === null
        ? `CHOOSE ${p}`
        : `OBSERVED REWARD = ${reward}`,
      P ? 21 : 19,
      reward === null
        ? color
        : reward === 1
          ? GOOD
          : BAD,
      x,
      y + 0.64,
      BOX_W - 0.45,
      true
    );

    const note = txt(
      'Only the chosen prompt is observed',
      P ? 17 : 15,
      C.muted,
      x,
      y - 0.65,
      BOX_W - 0.45
    );

    return replace(
      'box',
      new M.VGroup(
        bg,
        learner,
        label,
        prompt,
        letter,
        connector1,
        connector2,
        outcome,
        resultText,
        heading,
        note
      )
    );
  }

  // ------------------------------------------------------------
  // Observed reward history
  // ------------------------------------------------------------

  function rewardHistory(p) {
    const x = px(p);
    const color = pc(p);

    const observed = history[p];
    const n = observed.length;
    const total = returns(p);

    const countText = txt(
      `${total} ${total === 1 ? 'return' : 'returns'} / ${n} shown`,
      P ? 18 : 16,
      color,
      x,
      COUNT_Y,
      CARD_W - 0.18,
      true
    );

    const spacing = 0.275;
    const radius = 0.105;

    const dots = observed.map((r, k) =>
      rewardMark(
        x + (k - (n - 1) / 2) * spacing,
        REWARD_Y,
        r,
        radius
      )
    );

    return new M.VGroup(
      countText,
      ...dots
    );
  }

  function refreshHistory(p) {
    return replace(
      `history${p}`,
      rewardHistory(p)
    );
  }

  function betaLabel(p, a, b) {
    return txt(
      `Beta(${a}, ${b})`,
      P ? 22 : 19,
      pc(p),
      px(p),
      BETA_Y,
      CARD_W - 0.2,
      true
    );
  }

  function refreshBeta(p, a, b) {
    return replace(
      `beta${p}`,
      betaLabel(p, a, b)
    );
  }

  // ------------------------------------------------------------
  // Initial point estimates
  // ------------------------------------------------------------

  function ratePicture(p) {
    const rate = estimate(p);
    const x = px(p);
    const color = pc(p);

    const y = BASE + GRAPH_H * 0.52;

    const label = txt(
      'Estimated return rate',
      P ? 20 : 17,
      C.muted,
      x,
      y + (P ? 0.65 : 0.55),
      CARD_W - 0.1
    );

    const number = txt(
      rate === null
        ? '?'
        : `${Math.round(rate * 100)}%`,
      P ? 45 : 39,
      color,
      x,
      y + 0.03,
      CARD_W - 0.3,
      true
    );

    const barY = y - 0.57;
    const w = GRAPH_W - 0.18;
    const h = P ? 0.24 : 0.20;

    const track = new M.Rectangle({
      width: w,
      height: h,
      color: C.muted,
      strokeWidth: 1
    });

    track.setFill(C.muted, 0.13);
    track.moveTo([x, barY, 0]);

    const parts = [
      label,
      number,
      track
    ];

    if (rate !== null && rate > 0) {
      const fillW = w * rate;

      const fill = new M.Rectangle({
        width: fillW,
        height: h,
        color,
        strokeWidth: 1
      });

      fill.setFill(color, 0.90);

      fill.moveTo([
        x - w / 2 + fillW / 2,
        barY,
        0
      ]);

      parts.push(fill);
    }

    if (rate === 0) {
      parts.push(
        line(
          x - w / 2,
          barY - h / 2 - 0.04,
          x - w / 2,
          barY + h / 2 + 0.04,
          color,
          3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function refreshRate(p) {
    return replace(
      `rate${p}`,
      ratePicture(p)
    );
  }

  // ------------------------------------------------------------
  // Bags of possible return rates
  //
  // The cards are a conceptual analogy, not a discretised
  // calculation of the actual Beta distribution.
  // ------------------------------------------------------------

  const BAG_Y = P ? 0.60 : -0.52;
  const BAG_W = P ? 2.95 : 2.95;
  const BAG_H = P ? 1.95 : 1.40;

  function rateCard(x, y, value, color, w, h) {
    const bg = rect(
      x, y,
      w, h,
      color,
      C.card,
      1,
      0.07,
      1.5
    );

    const number = txt(
      `${value}%`,
      P ? 18 : 16,
      color,
      x, y,
      w - 0.12,
      true
    );

    return new M.VGroup(bg, number);
  }

  function bagPicture(p, values) {
    const x = px(p);
    const color = pc(p);

    const shell = rect(
      x,
      BAG_Y,
      BAG_W,
      BAG_H,
      color,
      color,
      0.09,
      0.25,
      2
    );

    const openingY = BAG_Y + BAG_H / 2 - 0.13;

    const opening = line(
      x - BAG_W * 0.33,
      openingY,
      x + BAG_W * 0.33,
      openingY,
      color,
      3
    );

    const n = values.length;
    const cols = 3;
    const rows = Math.ceil(n / cols);

    const w = 0.77;
    const h = P ? 0.39 : 0.31;

    const spacingX = 0.86;
    const spacingY = P ? 0.45 : 0.36;

    const cards = values.map((value, k) => {
      const row = Math.floor(k / cols);
      const col = k % cols;

      const itemsInRow = Math.min(
        cols,
        n - row * cols
      );

      const xx =
        x + (col - (itemsInRow - 1) / 2) * spacingX;

      const yy =
        BAG_Y +
        ((rows - 1) / 2 - row) * spacingY -
        0.02;

      return rateCard(
        xx,
        yy,
        value,
        color,
        w,
        h
      );
    });

    const label = txt(
      'Possible return rates',
      P ? 18 : 17,
      C.muted,
      x,
      BAG_Y - BAG_H / 2 - 0.23,
      BAG_W
    );

    return new M.VGroup(
      shell,
      opening,
      ...cards,
      label
    );
  }

  const UNIFORM_CARDS = [
    0, 25, 50, 75, 100
  ];

  const HIGH_CARDS = [
    0, 25, 50,
    75, 100, 75,
    100, 75, 100
  ];

  const LOW_CARDS = [
    0, 25, 50,
    75, 100, 0,
    25, 0, 25
  ];

  function refreshBag(p, values) {
    return replace(
      `bag${p}`,
      bagPicture(p, values)
    );
  }

  function bagDraw(p, value) {
    const x = px(p);
    const color = pc(p);

    const y = P ? -1.62 : -1.95;

    const card = rateCard(
      x, y,
      value,
      color,
      1.25,
      0.52
    );

    const label = txt(
      'Drawn card',
      P ? 18 : 16,
      color,
      x,
      y - 0.40,
      1.60
    );

    return replace(
      `bagdraw${p}`,
      new M.VGroup(card, label)
    );
  }

  // ------------------------------------------------------------
  // Beta probability density
  //
  // All parameters are positive integers.
  //
  // density(x; a, b) =
  //   ((a+b-1)! / ((a-1)! (b-1)!))
  //   × x^(a-1) × (1-x)^(b-1)
  //
  // The drawn rate is a sample from the distribution,
  // not the distribution's mean.
  // ------------------------------------------------------------

  function logFactorial(n) {
    let total = 0;

    for (let k = 2; k <= n; k++) {
      total += Math.log(k);
    }

    return total;
  }

  function betaDensity(x, a, b) {
    if (x < 0 || x > 1) {
      return 0;
    }

    const coefficient = Math.exp(
      logFactorial(a + b - 1) -
      logFactorial(a - 1) -
      logFactorial(b - 1)
    );

    // JavaScript evaluates 0^0 as 1.
    // This gives the correct boundary values when a or b is 1.

    return coefficient *
      Math.pow(x, a - 1) *
      Math.pow(1 - x, b - 1);
  }

  function rateX(p, fraction) {
    return px(p) -
      GRAPH_W / 2 +
      fraction * GRAPH_W;
  }

  function densityY(density) {
    return BASE +
      density / DENSITY_MAX * GRAPH_H;
  }

  function axes(p) {
    const color = C.muted;
    const left = rateX(p, 0);
    const right = rateX(p, 1);

    const parts = [
      line(
        left, BASE,
        right, BASE,
        color, 2
      ),
      line(
        left, BASE,
        left, BASE + GRAPH_H,
        color, 1.5
      )
    ];

    // Shared reference lines.
    // They are not labelled as percentages of probability.

    for (const density of [1, 2, 3]) {
      const yy = densityY(density);

      parts.push(
        dashed(
          left, yy,
          right, yy,
          C.muted
        )
      );
    }

    for (const rate of [0, 0.5, 1]) {
      const x = rateX(p, rate);

      parts.push(
        line(
          x, BASE - 0.055,
          x, BASE + 0.055,
          color, 2
        ),
        txt(
          `${Math.round(rate * 100)}%`,
          P ? 17 : 16,
          color,
          x,
          AXIS_LABEL_Y,
          0.76,
          true
        )
      );
    }

    parts.push(
      txt('return rate', P ? 16 : 15, color, px(p), AXIS_NAME_Y, GRAPH_W, false),
      txt('↑ chance', P ? 16 : 14, color, left + (P ? 0.55 : 0.5), BASE + GRAPH_H - 0.12, 1.2, false)
    );

    return parts;
  }

  function betaCurve(p, a, b, resolution = 48) {
    const color = pc(p);

    const shading = [];
    const outline = [];

    const dx = GRAPH_W / resolution;

    for (let k = 0; k < resolution; k++) {
      const u = k / resolution;
      const v = (k + 1) / resolution;
      const mid = (u + v) / 2;

      const value = betaDensity(mid, a, b);

      const ht =
        value / DENSITY_MAX * GRAPH_H;

      if (false && ht > 0.001) {
        const strip = new M.Rectangle({
          width: dx + 0.002,
          height: ht,
          color,
          strokeWidth: 0
        });

        strip.setFill(color, 0.19);

        strip.moveTo([
          rateX(p, mid),
          BASE + ht / 2,
          0
        ]);

        shading.push(strip);
      }

      outline.push(
        line(
          rateX(p, u),
          densityY(betaDensity(u, a, b)),
          rateX(p, v),
          densityY(betaDensity(v, a, b)),
          color,
          3
        )
      );
    }

    return new M.VGroup(
      ...axes(p),
      ...shading,
      ...outline
    );
  }

  function refreshCurve(p, a, b, resolution = 48) {
    return replace(
      `curve${p}`,
      betaCurve(p, a, b, resolution)
    );
  }

  function refreshPosterior(p, resolution = 48) {
    const [a, b] = updateParameters(p);

    return [
      ...refreshCurve(p, a, b, resolution),
      ...refreshBeta(p, a, b)
    ];
  }

  function drawMarker(p, fraction) {
    const color = pc(p);

    const [a, b] = parameters[p];

    const x = rateX(p, fraction);
    const y = densityY(
      betaDensity(fraction, a, b)
    );

    const guide = dashed(
      x, BASE,
      x, y,
      C.amber
    );

    const halo = glow(
      x, y,
      P ? 0.095 : 0.075,
      C.amber
    );

    const axisDot = new M.Dot({
      point: [x, BASE, 0],
      radius: 0.055,
      color: C.amber
    });

    const lab = pill(
      `DRAW: ${Math.round(fraction * 100)}%`,
      color,
      P ? 19 : 17
    );

    if (lab.getWidth() > CARD_W - 0.15) {
      lab.scale(
        (CARD_W - 0.15) / lab.getWidth()
      );
    }

    lab.moveTo([
      px(p),
      DRAW_Y,
      0
    ]);

    return new M.VGroup(
      guide,
      halo,
      axisDot,
      lab
    );
  }

  function drawRate(p, fraction) {
    return replace(
      `draw${p}`,
      drawMarker(p, fraction)
    );
  }

  function clearDraws() {
    return clear(
      'drawA',
      'drawB',
      'chosen'
    );
  }

  function rangeHighlight(p, low, high, color) {
    const x1 = rateX(p, low);
    const x2 = rateX(p, high);

    const r = new M.Rectangle({
      width: x2 - x1,
      height: GRAPH_H,
      color,
      strokeWidth: 1
    });

    r.setFill(color, 0.075);

    r.moveTo([
      (x1 + x2) / 2,
      BASE + GRAPH_H / 2,
      0
    ]);

    return r;
  }

  function peakMarker(p, value, color) {
    const [a, b] = parameters[p];

    const x = rateX(p, value);

    const y = densityY(
      betaDensity(value, a, b)
    );

    const marker = dashed(
      x, BASE,
      x, y,
      color
    );

    const dot = glow(
      x, y,
      0.085,
      color
    );

    const lab = pill(
      `AROUND ${Math.round(value * 100)}%`,
      color,
      P ? 18 : 16
    );

    if (lab.getWidth() > CARD_W - 0.15) {
      lab.scale(
        (CARD_W - 0.15) / lab.getWidth()
      );
    }

    lab.moveTo([
      px(p),
      DRAW_Y,
      0
    ]);

    return new M.VGroup(
      marker,
      dot,
      lab
    );
  }

  // ------------------------------------------------------------
  // Accelerated narrated continuation
  //
  // These are illustrative possible sample pairs.
  // They are not calculated posterior means.
  //
  // The larger draw determines the chosen prompt.
  // Only that prompt consumes its next fixed reward.
  // ------------------------------------------------------------

  const FAST_DRAWS = [
    [0.41, 0.73],
    [0.67, 0.55],
    [0.38, 0.76],

    [0.64, 0.57],
    [0.43, 0.81],
    [0.70, 0.59],
    [0.37, 0.72],
    [0.66, 0.54],
    [0.44, 0.77],
    [0.68, 0.62],
    [0.41, 0.80],
    [0.65, 0.56],
    [0.46, 0.74],
    [0.69, 0.61],
    [0.62, 0.58]
  ];

  async function fastChoice(drawA, drawB, duration = 0.15) {
    const p = drawA >= drawB ? 'A' : 'B';
    const color = pc(p);

    // First reveal both draws and the choice.
    // No reward is shown during this animation.

    await play(
      quick(
        [
          ...drawRate('A', drawA),
          ...drawRate('B', drawB),
          ...choose(p),
          ...fbox(
            [
              ['Illustrative draws', C.muted],
              [
                `A: ${Math.round(drawA * 100)}%`,
                A
              ],
              [
                `B: ${Math.round(drawB * 100)}%`,
                B
              ],
              [`Choose ${p}`, color]
            ],
            color
          )
        ],
        duration
      )
    );

    // Observe only after the prompt has been selected.

    const reward = observe(p);

    const [a, b] = updateParameters(p);

    await play(
      quick(
        [
          ...clear('drawA', 'drawB'),
          ...refreshHistory(p),
          ...refreshCurve(p, a, b, 28),
          ...refreshBeta(p, a, b),
          ...fbox(
            [
              [`Prompt ${p} chosen`, color],
              [
                `Reward = ${reward}`,
                reward === 1 ? GOOD : BAD
              ],
              [`Beta(${a}, ${b})`, color],
              [
                `${history[p].length} observations`,
                C.muted
              ]
            ],
            color
          )
        ],
        duration
      )
    );
  }

  // ------------------------------------------------------------
  // 0: our study app is still learning
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    new M.FadeIn(app),
    ...say('WHICH PROMPT HELPS MORE?', C.cyan),
    ...fbox(
      [
        ['Goal', C.green],
        'More learners return',
        'the next day'
      ],
      C.green
    )
  );

  // ------------------------------------------------------------
  // 1: two familiar prompts
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    new M.FadeOut(app),
    new M.FadeIn(cardA),
    new M.FadeIn(cardB),
    ...say('A: QUIZ     B: REMINDER'),
    ...fbox(
      [
        ['A: quick quiz', A],
        ['B: study reminder', B],
        'One prompt per learner'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 2: first learner receives A and returns
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...choose('A'),
    ...learnerPicture('A'),
    ...say('LEARNER 1: CHOOSE A', A)
  );

  await until(S(2) + 1.35);

  const firstA = observe('A');

  await play(
    ...learnerPicture('A', firstA),
    ...refreshHistory('A')
  );

  // ------------------------------------------------------------
  // 3: second learner receives B and does not return
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...choose('B'),
    ...learnerPicture('B'),
    ...say('LEARNER 2: CHOOSE B', B)
  );

  await until(S(3) + 1.30);

  const firstB = observe('B');

  await play(
    ...learnerPicture('B', firstB),
    ...refreshHistory('B')
  );

  // ------------------------------------------------------------
  // 4-5: initial estimated return rates
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...clear('chosen'),
    ...refreshRate('A'),
    ...say('A: ESTIMATED RATE = 100%', A),
    ...fbox(
      [
        ['Prompt A', A],
        '1 return from 1 choice',
        ['1 ÷ 1 = 100%', A]
      ],
      A
    )
  );

  await until(S(5));

  await play(
    ...refreshRate('B'),
    ...say('B: ESTIMATED RATE = 0%', B),
    ...fbox(
      [
        ['Prompt B', B],
        '0 returns from 1 choice',
        ['0 ÷ 1 = 0%', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 6: one observation is not enough to know the true rate
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    new M.Indicate(cardA, { color: A }),
    new M.Indicate(cardB, { color: B }),
    ...say('MANY RATES ARE STILL POSSIBLE', UNCERTAIN),
    ...fbox(
      [
        ['Only one result each', C.amber],
        '100% is not certainty.',
        '0% is not certainty.',
        ['Both rates are uncertain', UNCERTAIN]
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 7: imagine bags of possible return rates
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...clear(
      'rateA',
      'rateB',
      'historyA',
      'historyB'
    ),
    ...refreshBag('A', UNIFORM_CARDS),
    ...refreshBag('B', UNIFORM_CARDS),
    ...say('BAGS OF POSSIBLE RETURN RATES', UNCERTAIN),
    ...fbox(
      [
        ['Imagine a bag of cards', UNCERTAIN],
        '0% to 100%',
        'Each card represents',
        'a possible return rate.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 8: before observations, equal chances across the range
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...say('BEFORE DATA: ALL RANGES EQUALLY LIKELY'),
    ...fbox(
      [
        ['Before any observations', C.cyan],
        'No part of the range',
        'is favoured over another.',
        ['Uniform uncertainty', UNCERTAIN]
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 9: returns favour higher possible rates
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...refreshBag('A', HIGH_CARDS),
    ...say('RETURNS FAVOUR HIGHER RATES', GOOD),
    ...fbox(
      [
        ['A: learner returns', GOOD],
        'Imagine adding more',
        'high-rate cards.',
        ['Higher rates more likely', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 10: non-returns favour lower possible rates
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...refreshBag('B', LOW_CARDS),
    ...say('NON-RETURNS FAVOUR LOWER RATES', BAD),
    ...fbox(
      [
        ['B: learner does not return', BAD],
        'Imagine adding more',
        'low-rate cards.',
        ['Lower rates more likely', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 11: draw one possible rate from each bag
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...bagDraw('A', 75),
    ...bagDraw('B', 25),
    ...say('DRAW ONE CARD FROM EACH BAG', C.amber),
    ...fbox(
      [
        ['Illustration only', C.muted],
        ['A draws 75%', A],
        ['B draws 25%', B]
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 12: choose the prompt with the larger draw
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...choose('A'),
    ...say('CHOOSE THE HIGHER DRAW', A),
    ...fbox(
      [
        ['A: 75%', A],
        ['B: 25%', B],
        ['75% > 25%', C.amber],
        ['Choose A', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 13: name the method
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...say('THOMPSON SAMPLING', UNCERTAIN),
    ...fbox(
      [
        ['THOMPSON SAMPLING', UNCERTAIN],
        'Draw a possible rate.',
        'Choose the higher draw.',
        'Learn from the result.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 14: replace the bags with smooth distributions
  //
  // These are previews of the distributions after the
  // initial two observations. The construction from
  // Beta(1,1) is explained separately in beats 18-23.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...clear(
      'bagA',
      'bagB',
      'bagdrawA',
      'bagdrawB',
      'chosen'
    ),
    ...refreshCurve('A', 2, 1),
    ...refreshCurve('B', 1, 2),
    ...say('BAGS BECOME SMOOTH CURVES', UNCERTAIN),
    ...fbox(
      [
        ['After the initial results', C.muted],
        'A smooth distribution',
        'of possible return rates',
        'for each prompt.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 15: curve height describes relative sampling density
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...say('CURVES DESCRIBE OUR UNCERTAINTY', UNCERTAIN),
    ...fbox(
      [
        'Horizontal: possible rate',
        'Vertical: sampling density',
        ['A range of possibilities', UNCERTAIN],
        'Not one fixed answer'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 16: higher regions are more likely to be sampled
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...replace(
      'rangeA',
      rangeHighlight('A', 0.65, 1, A)
    ),
    ...replace(
      'rangeB',
      rangeHighlight('B', 0, 0.35, B)
    ),
    ...say('HIGHER CURVE: MORE LIKELY NEARBY', C.amber),
    ...fbox(
      [
        ['A favours larger rates', A],
        ['B favours smaller rates', B],
        'A higher region means',
        'more chance of a nearby draw.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 17: Beta distribution
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...clear('rangeA', 'rangeB'),
    ...say('BETA DISTRIBUTION', UNCERTAIN),
    ...fbox(
      [
        ['Beta distribution', UNCERTAIN],
        'A curve over possible',
        'rates between 0% and 100%.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 18: begin before data, Beta(1,1) for both prompts
  // ------------------------------------------------------------

  await until(S(18));

  parameters.A = [1, 1];
  parameters.B = [1, 1];

  await play(
    ...refreshCurve('A', 1, 1),
    ...refreshCurve('B', 1, 1),
    ...refreshBeta('A', 1, 1),
    ...refreshBeta('B', 1, 1),
    ...say('START WITH TWO NUMBERS: 1 AND 1'),
    ...fbox(
      [
        ['Before observing any results', C.muted],
        ['A: Beta(1, 1)', A],
        ['B: Beta(1, 1)', B],
        'Both curves are flat.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 19: a return increases the first parameter
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...say('RETURN: ADD 1 TO THE FIRST NUMBER', GOOD),
    ...fbox(
      [
        ['Observe a return', GOOD],
        'Beta(first, second)',
        ['first → first + 1', GOOD],
        'second stays the same'
      ],
      GOOD
    )
  );

  // ------------------------------------------------------------
  // 20: a non-return increases the second parameter
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...say('NO RETURN: ADD 1 TO SECOND NUMBER', BAD),
    ...fbox(
      [
        ['Observe a non-return', BAD],
        'Beta(first, second)',
        'first stays the same',
        ['second → second + 1', C.amber]
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 21: A has one observed return, Beta(2,1)
  // ------------------------------------------------------------

  await until(S(21));

  parameters.A = [2, 1];

  await play(
    ...refreshCurve('A', 2, 1),
    ...refreshBeta('A', 2, 1),
    ...refreshHistory('A'),
    new M.Indicate(cardA, { color: A }),
    ...say('A: BETA(1, 1) → BETA(2, 1)', A),
    ...fbox(
      [
        ['Prompt A', A],
        '1 observed return',
        ['first = 1 + 1 = 2', GOOD],
        'second = 1 + 0 = 1',
        ['Beta(2, 1)', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 22: B has one non-return, Beta(1,2)
  // ------------------------------------------------------------

  await until(S(22));

  parameters.B = [1, 2];

  await play(
    ...refreshCurve('B', 1, 2),
    ...refreshBeta('B', 1, 2),
    ...refreshHistory('B'),
    new M.Indicate(cardB, { color: B }),
    ...say('B: BETA(1, 1) → BETA(1, 2)', B),
    ...fbox(
      [
        ['Prompt B', B],
        '1 observed non-return',
        'first = 1 + 0 = 1',
        ['second = 1 + 1 = 2', C.amber],
        ['Beta(1, 2)', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 23: compare the two uncertainty shapes
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...replace(
      'rangeA',
      rangeHighlight('A', 0.60, 1, A)
    ),
    ...replace(
      'rangeB',
      rangeHighlight('B', 0, 0.40, B)
    ),
    ...say('A FAVOURS HIGHER RATES; B LOWER'),
    ...fbox(
      [
        ['A: Beta(2, 1)', A],
        'More density on the right',
        ['B: Beta(1, 2)', B],
        'More density on the left',
        ['Both remain uncertain', UNCERTAIN]
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 24: next learner arrives
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...clear('rangeA', 'rangeB'),
    ...say('NEXT LEARNER: DRAW AGAIN'),
    ...fbox(
      [
        ['Learner 3 arrives', C.ink],
        'Draw one possible rate',
        'from each distribution.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 25: first narrated Thompson draw, A = 70%
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...drawRate('A', 0.70),
    ...say('A DRAWS 70%', A),
    ...fbox(
      [
        ['Draw from Beta(2, 1)', A],
        ['A: 70%', A],
        'B: waiting for its draw'
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 26: B = 30%
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...drawRate('B', 0.30),
    ...say('B DRAWS 30%', B),
    ...fbox(
      [
        ['A: 70%', A],
        ['B: 30%', B],
        'Compare the two draws'
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 27: choose A
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...choose('A'),
    ...say('70% > 30%: CHOOSE A', A),
    ...fbox(
      [
        ['A draws 70%', A],
        ['B draws 30%', B],
        ['70% > 30%', C.amber],
        ['Choose prompt A', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 28: A receives reward 0
  // ------------------------------------------------------------

  await until(S(28));

  const step1Reward = observe('A');

  await play(
    ...refreshHistory('A'),
    ...learnerPicture('A', step1Reward),
    ...say('A: LEARNER DOES NOT RETURN', BAD)
  );

  // ------------------------------------------------------------
  // 29: A becomes Beta(2,2)
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...clearDraws(),
    ...refreshPosterior('A'),
    ...say('A: BETA(2, 1) → BETA(2, 2)', A),
    ...fbox(
      [
        ['Observed reward = 0', BAD],
        'first remains 2',
        ['second = 1 + 1 = 2', C.amber],
        ['Beta(2, 2)', A],
        'The curve peaks in the middle.'
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 30: next learner, draw from the updated curves
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...say('NEW LEARNER, NEW DRAWS', UNCERTAIN),
    ...fbox(
      [
        ['Learner 4 arrives', C.ink],
        ['A: Beta(2, 2)', A],
        ['B: Beta(1, 2)', B],
        'Draw again from both.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 31: A = 40%, B = 60%
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...drawRate('A', 0.40),
    ...drawRate('B', 0.60),
    ...say('A DRAWS 40%     B DRAWS 60%'),
    ...fbox(
      [
        ['A: 40%', A],
        ['B: 60%', B],
        'Two new possible rates'
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 32: choose B
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...choose('B'),
    ...say('60% > 40%: CHOOSE B', B),
    ...fbox(
      [
        ['A draws 40%', A],
        ['B draws 60%', B],
        ['60% > 40%', C.amber],
        ['Choose prompt B', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 33: B receives reward 1 and becomes Beta(2,2)
  // ------------------------------------------------------------

  await until(S(33));

  const step2Reward = observe('B');

  await play(
    ...refreshHistory('B'),
    ...learnerPicture('B', step2Reward),
    ...say('B: LEARNER RETURNS', GOOD)
  );

  await until(S(33) + 1.65);

  await play(
    ...clearDraws(),
    ...refreshPosterior('B'),
    ...fbox(
      [
        ['Observed reward = 1', GOOD],
        ['first = 1 + 1 = 2', GOOD],
        'second remains 2',
        ['B: Beta(2, 2)', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 34: identical uncertainty shapes
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...say('SAME PARAMETERS, SAME CURVE', UNCERTAIN),
    ...fbox(
      [
        ['A: Beta(2, 2)', A],
        ['B: Beta(2, 2)', B],
        'Exactly the same shape.',
        'Both rates remain uncertain.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 35: third narrated draw, A = 30%, B = 80%
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...drawRate('A', 0.30),
    ...drawRate('B', 0.80),
    ...say('A DRAWS 30%     B DRAWS 80%'),
    ...fbox(
      [
        ['Learner 5 arrives', C.ink],
        ['A: 30%', A],
        ['B: 80%', B],
        'Same shapes, different draws.'
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 36: choose B again
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...choose('B'),
    ...say('80% > 30%: CHOOSE B AGAIN', B),
    ...fbox(
      [
        ['A draws 30%', A],
        ['B draws 80%', B],
        ['80% > 30%', C.amber],
        ['Choose prompt B', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 37: B receives reward 1 and becomes Beta(3,2)
  // ------------------------------------------------------------

  await until(S(37));

  const step3Reward = observe('B');

  await play(
    ...refreshHistory('B'),
    ...learnerPicture('B', step3Reward),
    ...say('B: ANOTHER RETURN', GOOD)
  );

  await until(S(37) + 1.55);

  await play(
    ...clearDraws(),
    ...refreshPosterior('B'),
    ...fbox(
      [
        ['Observed reward = 1', GOOD],
        ['first = 2 + 1 = 3', GOOD],
        'second remains 2',
        ['B: Beta(3, 2)', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 38: B's distribution shifts towards higher rates
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...replace(
      'rangeB',
      rangeHighlight('B', 0.55, 0.90, B)
    ),
    ...say('B NOW FAVOURS HIGHER RATES', B),
    ...fbox(
      [
        ['A: Beta(2, 2)', A],
        ['B: Beta(3, 2)', B],
        'A return changes only B.',
        ['Higher draws become likelier', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 39: continue making choices and observing rewards
  //
  // Current observations:
  // A = [1, 0]
  // B = [0, 1, 1]
  //
  // Three accelerated steps, still visibly separate.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...clear('rangeB'),
    ...say('DRAW → CHOOSE → OBSERVE → UPDATE'),
    ...fbox(
      [
        ['Continue learning', C.green],
        'Draw from both curves.',
        'Choose one prompt.',
        'Observe one reward.'
      ],
      C.green
    )
  );

  for (let k = 0; k < 3; k++) {
    const [drawA, drawB] = FAST_DRAWS[k];

    await fastChoice(
      drawA,
      drawB,
      0.22
    );
  }

  // ------------------------------------------------------------
  // 40: accelerate the remaining fixed observations
  //
  // All choices still follow their illustrative draw pairs.
  // The other prompt's reward sequence is never consumed.
  //
  // Final narrated record:
  // A: 5 returns / 10 choices → Beta(6,6)
  // B: 7 returns / 10 choices → Beta(8,4)
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...clearDraws(),
    ...say('MORE RESULTS, LESS UNCERTAINTY', UNCERTAIN),
    ...fbox(
      [
        ['Collect more observations', C.green],
        'Keep drawing and updating.',
        'Watch the curves concentrate.'
      ],
      UNCERTAIN
    )
  );

  for (let k = 3; k < FAST_DRAWS.length; k++) {
    const [drawA, drawB] = FAST_DRAWS[k];

    await fastChoice(
      drawA,
      drawB,
      0.12
    );
  }

  // Restore high-resolution outlines after rapid updates.

  await play(
    quick(
      [
        ...clearDraws(),
        ...refreshPosterior('A', 56),
        ...refreshPosterior('B', 56),
        ...fbox(
          [
            ['20 observed results', C.ink],
            ['A: Beta(6, 6)', A],
            ['B: Beta(8, 4)', B],
            ['More concentrated curves', UNCERTAIN]
          ],
          UNCERTAIN
        )
      ],
      0.30
    )
  );

  // ------------------------------------------------------------
  // 41: A gathers around 50%
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...replace(
      'peakA',
      peakMarker('A', 0.50, A)
    ),
    ...say('A GATHERS AROUND 50%', A),
    ...fbox(
      [
        ['Prompt A', A],
        `${returns('A')} returns from ${history.A.length} choices`,
        [
          `Observed rate = ${Math.round(estimate('A') * 100)}%`,
          A
        ],
        ['Beta(6, 6)', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 42: B gathers around 70%
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...replace(
      'peakB',
      peakMarker('B', 0.70, B)
    ),
    ...say('B GATHERS AROUND 70%', B),
    ...fbox(
      [
        ['Prompt B', B],
        `${returns('B')} returns from ${history.B.length} choices`,
        [
          `Observed rate = ${Math.round(estimate('B') * 100)}%`,
          B
        ],
        ['Beta(8, 4)', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 43: B's draw is more likely to exceed A's draw
  //
  // These are illustrative draws from the learned curves.
  // No additional learner or observation is added.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...clear('peakA', 'peakB'),
    ...drawRate('A', 0.48),
    ...drawRate('B', 0.72),
    ...say('B IS MORE LIKELY TO DRAW HIGHER', B),
    ...fbox(
      [
        ['Illustrative new draws', C.muted],
        ['A: 48%', A],
        ['B: 72%', B],
        'B now wins more often.',
        'Not necessarily every time.'
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 44: the method increasingly favours B
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...choose('B'),
    ...say('LEARNING LEADS TO MORE B CHOICES', B),
    ...fbox(
      [
        ['As evidence accumulates', C.ink],
        'B tends to draw higher.',
        ['B is chosen more often', B],
        'A can still be chosen.'
      ],
      C.green
    )
  );

  // ------------------------------------------------------------
  // 45: introduce the update rule
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...clearDraws(),
    ...say('THE BETA UPDATE RULE', UNCERTAIN),
    ...fbox(
      [
        ['Beta(first, second)', UNCERTAIN],
        'Two numbers per prompt.',
        'Update only the prompt',
        'whose reward we observe.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 46: first = 1 + number of returns
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...say('FIRST = 1 + NUMBER OF RETURNS', GOOD),
    ...fbox(
      [
        ['first = 1 + returns', GOOD],
        '',
        ['A: 1 + 5 = 6', A],
        ['B: 1 + 7 = 8', B]
      ],
      GOOD
    )
  );

  // ------------------------------------------------------------
  // 47: second = 1 + number of non-returns
  // ------------------------------------------------------------

  await until(S(47));

  await play(
    ...say('SECOND = 1 + NUMBER OF NON-RETURNS', C.amber),
    ...fbox(
      [
        ['second = 1 + non-returns', C.amber],
        '',
        ['A: 1 + 5 = 6', A],
        ['B: 1 + 3 = 4', B]
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 48: both numbers define the Beta distribution
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...say('TWO NUMBERS DEFINE EACH CURVE', UNCERTAIN),
    ...fbox(
      [
        ['Beta(first, second)', UNCERTAIN],
        'first = 1 + returns',
        'second = 1 + non-returns',
        ['A: Beta(6, 6)', A],
        ['B: Beta(8, 4)', B]
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 49: Thompson sampling balances earning and learning
  //
  // Show overlapping plausible ranges to explain how
  // a less-favoured prompt can still win a future draw.
  // ------------------------------------------------------------

  await until(S(49));

  await play(
    ...replace(
      'rangeA',
      rangeHighlight('A', 0.50, 0.80, UNCERTAIN)
    ),
    ...replace(
      'rangeB',
      rangeHighlight('B', 0.50, 0.80, UNCERTAIN)
    ),
    ...say('EARN REWARDS WHILE EXPLORING', C.green),
    ...fbox(
      [
        ['Earn rewards', GOOD],
        'Favour promising choices.',
        ['Explore uncertainty', UNCERTAIN],
        'Other choices can still',
        'produce the higher draw.'
      ],
      C.green
    )
  );

  // ------------------------------------------------------------
  // 50: unlike epsilon-greedy, exploration adapts naturally
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    ...clear('rangeA', 'rangeB'),
    ...say('EXPLORATION ADAPTS WITH EVIDENCE', UNCERTAIN),
    ...fbox(
      [
        ['Epsilon-greedy', C.amber],
        'Uses an exploration setting.',
        ['Thompson sampling', UNCERTAIN],
        'Samples from learned curves.',
        'Uncertainty changes with data.'
      ],
      UNCERTAIN
    )
  );

  // ------------------------------------------------------------
  // 51: a drawn rate is not the known true rate
  // ------------------------------------------------------------

  await until(S(51));

  await play(
    ...drawRate('B', 0.80),
    ...say('A DRAW IS ONLY ONE POSSIBLE RATE', C.amber),
    ...fbox(
      [
        ['Suppose B draws 80%', B],
        'One possible return rate.',
        ['Not a known true rate', C.amber],
        'Not a guaranteed outcome.'
      ],
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 52: even a high drawn rate can receive reward 0
  //
  // This is a hypothetical illustration.
  // It is not appended to the fixed narrated reward record.
  // ------------------------------------------------------------

  function hypotheticalZero() {
    const x = BOXP[0];
    const y = BOXP[1];

    const bg = rect(
      x, y,
      BOX_W, 2.02,
      C.amber,
      C.card,
      0.97,
      0.18,
      2
    );

    const heading = txt(
      'POSSIBLE OUTCOME',
      P ? 22 : 20,
      C.amber,
      x,
      y + 0.73,
      BOX_W - 0.4,
      true
    );

    const draw = txt(
      'Draw: 80%',
      P ? 23 : 21,
      B,
      x - BOX_W / 4,
      y + 0.12,
      BOX_W / 2 - 0.25,
      true
    );

    const arrow = line(
      x - 0.28, y + 0.12,
      x + 0.28, y + 0.12,
      C.muted, 2
    );

    const outcome = rewardMark(
      x + BOX_W / 4 - 0.25,
      y + 0.12,
      0,
      0.23
    );

    const zero = txt(
      '0',
      P ? 29 : 26,
      BAD,
      x + BOX_W / 4 + 0.27,
      y + 0.12,
      0.38,
      true
    );

    const note = txt(
      'A high draw can still give zero.',
      P ? 20 : 18,
      C.ink,
      x,
      y - 0.43,
      BOX_W - 0.35
    );

    const hypothetical = txt(
      'Illustration only — not a new observation',
      P ? 15 : 14,
      C.muted,
      x,
      y - 0.76,
      BOX_W - 0.35
    );

    return replace(
      'box',
      new M.VGroup(
        bg,
        heading,
        draw,
        arrow,
        outcome,
        zero,
        note,
        hypothetical
      )
    );
  }

  await until(S(52));

  await play(
    ...hypotheticalZero(),
    ...say('HIGH DRAW ≠ GUARANTEED REWARD', C.amber)
  );

  // ------------------------------------------------------------
  // 53: next lesson, introduce learner information
  // ------------------------------------------------------------

  function contextPreview() {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const bg = rect(
      x, y,
      w, 2.15,
      UNCERTAIN,
      C.card,
      0.97,
      0.18,
      2
    );

    const heading = txt(
      'WHAT DO WE KNOW?',
      P ? 22 : 20,
      UNCERTAIN,
      x,
      y + 0.79,
      w - 0.4,
      true
    );

    const leftX = x - w / 4;
    const rightX = x + w / 4;

    const learner1 = glow(
      leftX,
      y + 0.17,
      0.17,
      GOOD
    );

    const learner2 = glow(
      rightX,
      y + 0.17,
      0.17,
      C.muted
    );

    const study1 = txt(
      'Studied today',
      P ? 20 : 18,
      GOOD,
      leftX,
      y - 0.28,
      w / 2 - 0.22
    );

    const study2 = txt(
      'Did not study',
      P ? 20 : 18,
      C.muted,
      rightX,
      y - 0.28,
      w / 2 - 0.22
    );

    const divider = line(
      x,
      y + 0.43,
      x,
      y - 0.51,
      C.muted,
      1
    );

    const footer = txt(
      'Could different prompts help?',
      P ? 20 : 18,
      C.ink,
      x,
      y - 0.79,
      w - 0.35
    );

    return replace(
      'box',
      new M.VGroup(
        bg,
        heading,
        learner1,
        learner2,
        study1,
        study2,
        divider,
        footer
      )
    );
  }

  await until(S(53));

  await play(
    ...clearDraws(),
    ...contextPreview(),
    ...say('NEXT: USE LEARNER INFORMATION', UNCERTAIN)
  );

  // ------------------------------------------------------------
  // 54: final recap
  //
  // Draw possible return rates.
  // Choose the higher draw.
  // Observe one reward.
  // Update only the chosen distribution.
  // ------------------------------------------------------------

  await until(S(54));

  await play(
    ...drawRate('A', 0.48),
    ...drawRate('B', 0.72),
    ...say('THOMPSON SAMPLING', UNCERTAIN),
    ...fbox(
      [
        ['1. DRAW', C.amber],
        'One possible rate per prompt.',
        ['A: 48%', A],
        ['B: 72%', B]
      ],
      UNCERTAIN
    )
  );

  await until(S(54) + 2.05);

  await play(
    ...choose('B'),
    ...say('DRAW POSSIBLE RATES, CHOOSE HIGHEST'),
    ...fbox(
      [
        ['1. Draw possible rates', C.amber],
        ['2. Choose the highest draw', B],
        'Observe only that prompt.'
      ],
      B
    )
  );

  await until(S(54) + 4.10);

  await play(
    ...clearDraws(),
    ...fbox(
      [
        ['THOMPSON SAMPLING', UNCERTAIN],
        ['1. Draw possible rates', C.amber],
        ['2. Choose the highest draw', C.cyan],
        ['3. Observe a reward', GOOD],
        ['4. Update the chosen curve', UNCERTAIN]
      ],
      UNCERTAIN
    ),
    ...say('DRAW → CHOOSE → LEARN', C.green)
  );

  await until(E(54));
}

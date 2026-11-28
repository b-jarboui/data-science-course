// lesson 15.1.7
// Cumulative regret: measuring expected rewards lost while learning.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed chapter reward sequences and five UCB choices.
// The later 20-choice learning curve is an explicitly illustrative sequence.
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
  const LOSS = C.amber;
  const REGRET = C.violet;
  const DARK = '#17212F';

  const CX = P ? 0 : -2.60;

  const AX = CX - 1.75;
  const BX = CX + 1.75;

  const CARD_Y = P ? 2.60 : 1.02;
  const CARD_W = P ? 3.15 : 3.05;
  const CARD_H = P ? 1.10 : 1.04;

  const PILL = P
    ? [0, 3.78, 0]
    : [0, 1.97, 0];

  const BOXP = P
    ? [0, -4.75, 0]
    : [4.25, -0.55, 0];

  const BOX_W = P
    ? Math.min(FW - 1.10, 6.75)
    : 4.25;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const pc = p => p === 'A' ? A : B;
  const px = p => p === 'A' ? AX : BX;

  // ------------------------------------------------------------
  // Fixed chapter data
  //
  // Non-contextual example:
  // A = 50% true expected reward.
  // B = 70% true expected reward.
  //
  // These rates are available to the explanatory simulation,
  // not to the learning method.
  // ------------------------------------------------------------

  const TRUE_RATES = {
    A: 0.50,
    B: 0.70
  };

  const REWARDS = {
    A: [1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    B: [0, 1, 1, 1, 0, 1, 1, 1, 1, 0]
  };

  // First five choices from the narrated UCB example,
  // including its two initial observations.

  const CHOICES = ['A', 'B', 'A', 'A', 'B'];

  const history = {
    A: [],
    B: []
  };

  const observations = [];

  function observe(p) {
    const k = history[p].length;

    if (k >= REWARDS[p].length) {
      throw new Error(
        `Narrated rewards exhausted for prompt ${p}`
      );
    }

    const reward = REWARDS[p][k];

    history[p].push(reward);

    observations.push({
      prompt: p,
      reward
    });

    return reward;
  }

  function totalObserved() {
    return observations.reduce(
      (sum, record) => sum + record.reward,
      0
    );
  }

  function timesChosen(p) {
    return observations.filter(
      record => record.prompt === p
    ).length;
  }

  function regretFor(p) {
    const best = Math.max(
      TRUE_RATES.A,
      TRUE_RATES.B
    );

    return best - TRUE_RATES[p];
  }

  function expectedReward(choices) {
    return choices.reduce(
      (sum, p) => sum + TRUE_RATES[p],
      0
    );
  }

  function cumulativeRegrets(choices) {
    let running = 0;

    return [
      0,
      ...choices.map(p => {
        running += regretFor(p);
        return running;
      })
    ];
  }

  function fmt(value, digits = 2) {
    return Number(value).toFixed(digits);
  }

  function pct(value) {
    return `${Math.round(value * 100)}%`;
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
    headSize = 0.13
  ) {
    const angle = Math.atan2(
      y2 - y1,
      x2 - x1
    );

    const a1 = angle + Math.PI - 0.52;
    const a2 = angle + Math.PI + 0.52;

    return new M.VGroup(
      line(
        x1, y1,
        x2, y2,
        color,
        strokeWidth
      ),
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
      radius: radius * 1.85,
      color
    });

    halo.setFill(color, 0.13);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    dot.setFill(color, 0.98);

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

  function rewardMark(x, y, reward, radius = 0.17) {
    // An unknown result is never represented as zero.

    if (reward === null) {
      return new M.VGroup(
        circle(
          x, y,
          radius,
          C.muted,
          DARK,
          1
        ),
        txt(
          '?',
          18,
          C.muted,
          x, y,
          radius * 1.65,
          true
        )
      );
    }

    const color = reward === 1
      ? GOOD
      : BAD;

    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 1.40,
      color
    });

    halo.setFill(
      color,
      reward === 1 ? 0.12 : 0.045
    );

    const disk = circle(
      x, y,
      radius,
      color,
      color,
      reward === 1 ? 0.28 : 0.18
    );

    const mark = reward === 1
      ? check(x, y, color, radius)
      : cross(x, y, color, radius);

    return new M.VGroup(
      halo,
      disk,
      mark
    );
  }

  function tag(
    s, color, size,
    x, y,
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
  // On-screen object management
  //
  // Every replacement is constructed from fresh objects.
  // Objects already on screen are never regrouped.
  // ------------------------------------------------------------

  const slots = new Map();

  function replace(key, obj) {
    const animations = [];
    const old = slots.get(key);

    if (old) {
      animations.push(
        new M.FadeOut(old)
      );
    }

    if (obj) {
      slots.set(key, obj);

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
      key => replace(key, null)
    );
  }

  function clearExcept(...keep) {
    const keys = Array.from(
      slots.keys()
    ).filter(
      key => !keep.includes(key)
    );

    return clear(...keys);
  }

  function quick(
    animations,
    duration = 0.30
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

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20;
    const lh = P ? 0.40 : 0.41;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart() || ' ', size, c, true)
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true
      ).getWidth() / 10;

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
      new M.VGroup(
        bg,
        ...texts
      )
    );
  }

  // ------------------------------------------------------------
  // Familiar chapter prompt cards
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
      x - 0.10,
      y - 0.14,
      x + 0.10,
      y - 0.14,
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
      x - 0.23,
      y - 0.13,
      x + 0.23,
      y - 0.13,
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
        x - 0.27,
        y + 0.06,
        x - 0.32,
        y + 0.15,
        color,
        2
      ),
      line(
        x + 0.27,
        y + 0.06,
        x + 0.32,
        y + 0.15,
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

    const iconX =
      x - CARD_W / 2 + 0.44;

    const icon = p === 'A'
      ? quizIcon(
          iconX,
          CARD_Y + 0.15,
          color
        )
      : reminderIcon(
          iconX,
          CARD_Y + 0.15,
          color
        );

    const heading = txt(
      `PROMPT ${p}`,
      P ? 23 : 21,
      color,
      x + 0.24,
      CARD_Y + 0.20,
      CARD_W - 0.95,
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
      CARD_Y - 0.27,
      CARD_W - 0.28
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
      ...replace(
        'headerA',
        promptCard('A')
      ),
      ...replace(
        'headerB',
        promptCard('B')
      )
    ];
  }

  function chosenPrompt(p) {
    return replace(
      'promptFocus',
      rect(
        px(p),
        CARD_Y,
        CARD_W + 0.12,
        CARD_H + 0.12,
        pc(p),
        pc(p),
        0,
        0.19,
        4
      )
    );
  }

  // ------------------------------------------------------------
  // Opening study-app picture
  // ------------------------------------------------------------

  function appPicture() {
    const x = CX;
    const y = P ? -0.05 : -0.40;

    const w = P ? 3.35 : 3.05;
    const h = P ? 4.55 : 3.50;

    const shell = rect(
      x, y,
      w, h,
      C.ink,
      C.card,
      1,
      0.25,
      3
    );

    const header = rect(
      x,
      y + h / 2 - 0.54,
      w - 0.38,
      0.66,
      A,
      A,
      0.12,
      0.12,
      1
    );

    const title = txt(
      'Study app',
      P ? 28 : 25,
      A,
      x,
      y + h / 2 - 0.54
    );

    const dots = [];

    const dotSpacing = 0.44;

    for (let k = 0; k < 15; k++) {
      const col = k % 5;
      const row = Math.floor(k / 5);

      dots.push(
        glow(
          x + (col - 2) * dotSpacing,
          y + 0.48 - row * dotSpacing,
          0.105,
          C.ink
        )
      );
    }

    const goal = txt(
      'Help learners return',
      P ? 21 : 19,
      GOOD,
      x,
      y - h / 2 + 0.55,
      w - 0.30
    );

    return new M.VGroup(
      shell,
      header,
      title,
      ...dots,
      goal
    );
  }

  // ------------------------------------------------------------
  // Five observed choices
  //
  // Each card represents one learner and one chosen prompt.
  // The reward is revealed only after the choice is shown.
  // ------------------------------------------------------------

  const OBS_W = P ? 1.18 : 1.13;
  const OBS_H = P ? 2.40 : 2.25;
  const OBS_SP = P ? 1.33 : 1.28;
  const OBS_Y = P ? 0.10 : -0.77;

  const obsX = k =>
    CX + (k - 2) * OBS_SP;

  function observationCard(
    k,
    p = null,
    reward = null,
    showRegret = false
  ) {
    const x = obsX(k);
    const y = OBS_Y;

    const color = p === null
      ? C.muted
      : pc(p);

    const h = showRegret
      ? OBS_H + 0.42
      : OBS_H;

    const bg = rect(
      x, y,
      OBS_W, h,
      color,
      C.card,
      0.90,
      0.14,
      2
    );

    const heading = txt(
      `Choice ${k + 1}`,
      P ? 17 : 16,
      C.muted,
      x,
      y + h / 2 - 0.25,
      OBS_W - 0.12,
      true
    );

    const learner = glow(
      x,
      y + 0.47,
      0.11,
      C.ink
    );

    const prompt = txt(
      p === null ? '—' : p,
      P ? 28 : 26,
      color,
      x,
      y + 0.03,
      OBS_W - 0.20,
      true
    );

    const mark = rewardMark(
      x,
      y - 0.47,
      reward,
      P ? 0.21 : 0.19
    );

    const rewardText = txt(
      reward === null
        ? '?'
        : String(reward),
      P ? 23 : 21,
      reward === 1
        ? GOOD
        : BAD,
      x,
      y - 0.87,
      OBS_W - 0.20,
      true
    );

    const parts = [
      bg,
      heading,
      learner,
      prompt,
      mark,
      rewardText
    ];

    if (showRegret && p !== null) {
      const loss = regretFor(p);

      parts.push(
        txt(
          `R: ${fmt(loss)}`,
          P ? 16 : 15,
          loss > 0
            ? LOSS
            : REGRET,
          x,
          y - h / 2 + 0.16,
          OBS_W - 0.12,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function refreshObservation(
    k,
    p = null,
    reward = null,
    showRegret = false
  ) {
    return replace(
      `observation${k}`,
      observationCard(
        k,
        p,
        reward,
        showRegret
      )
    );
  }

  function observationOutline(k, color) {
    return rect(
      obsX(k),
      OBS_Y,
      OBS_W + 0.10,
      OBS_H + 0.10,
      color,
      color,
      0,
      0.17,
      3
    );
  }

  function observationTotal() {
    const x = CX;
    const y = P ? -1.75 : -2.36;

    return tag(
      `${totalObserved()} RETURNS FROM ${observations.length} LEARNERS`,
      GOOD,
      P ? 19 : 17,
      x,
      y,
      P ? 6.5 : 6.3
    );
  }

  // ------------------------------------------------------------
  // One narrated choice
  //
  // The choice is shown first.
  // Only the selected prompt consumes its next fixed reward.
  // ------------------------------------------------------------

  async function narratedChoice(
    beat,
    k,
    p,
    revealDelay = 1.05
  ) {
    await until(S(beat));

    await play(
      ...chosenPrompt(p),
      ...refreshObservation(k, p, null),
      ...say(
        `CHOICE ${k + 1}: PROMPT ${p}`,
        pc(p)
      ),
      ...fbox(
        [
          [`Learner ${k + 1}`, C.ink],
          [`Choose prompt ${p}`, pc(p)],
          'Wait for tomorrow’s result.'
        ],
        pc(p)
      )
    );

    await until(
      S(beat) + revealDelay
    );

    const reward = observe(p);

    await play(
      ...refreshObservation(
        k,
        p,
        reward
      ),
      ...fbox(
        [
          [`Choice ${k + 1}: ${p}`, pc(p)],
          [
            reward === 1
              ? 'Learner returns'
              : 'Learner does not return',
            reward === 1
              ? GOOD
              : BAD
          ],
          [
            `Observed reward = ${reward}`,
            reward === 1
              ? GOOD
              : BAD
          ]
        ],
        pc(p)
      )
    );
  }

  // ------------------------------------------------------------
  // True expected return rates: one hundred dots per prompt
  //
  // Green dots represent expected counts, not observed outcomes.
  // They deliberately have no check marks.
  // ------------------------------------------------------------

  const DOT_Y = P ? 0.32 : -0.95;
  const DOT_SP = P ? 0.237 : 0.18;
  const DOT_R = P ? 0.076 : 0.065;

  function expectedDot(x, y, active) {
    const color = active
      ? GOOD
      : C.muted;

    const halo = new M.Dot({
      point: [x, y, 0],
      radius: DOT_R * 1.48,
      color
    });

    halo.setFill(
      color,
      active ? 0.11 : 0.025
    );

    const dot = circle(
      x,
      y,
      DOT_R,
      color,
      color,
      active ? 0.93 : 0.12,
      1
    );

    return new M.VGroup(
      halo,
      dot
    );
  }

  function hundredDotPosition(p, k) {
    const col = k % 10;
    const row = Math.floor(k / 10);

    return [
      px(p) + (col - 4.5) * DOT_SP,
      DOT_Y + (4.5 - row) * DOT_SP,
      0
    ];
  }

  function rateGrid(p, reveal = false) {
    const x = px(p);
    const color = pc(p);

    const w = CARD_W;
    const h = P ? 3.80 : 2.9;

    const y = P ? 0.08 : -1.05;

    const bg = rect(
      x, y,
      w, h,
      color,
      C.card,
      0.89,
      0.17,
      2
    );

    const expected = reveal
      ? Math.round(
          100 * TRUE_RATES[p]
        )
      : null;

    const heading = txt(
      reveal
        ? `${pct(TRUE_RATES[p])} TRUE RATE`
        : 'TRUE RATE: ?',
      P ? 23 : 20,
      reveal
        ? color
        : C.muted,
      x,
      y + h / 2 - 0.30,
      w - 0.30,
      true
    );

    const dots = [];

    for (let k = 0; k < 100; k++) {
      const [xx, yy] =
        hundredDotPosition(p, k);

      dots.push(
        expectedDot(
          xx,
          yy,
          reveal && k < expected
        )
      );
    }

    const footer = txt(
      reveal
        ? `${expected} expected / 100`
        : '100 hypothetical learners',
      P ? 18 : 16,
      reveal
        ? GOOD
        : C.muted,
      x,
      y - h / 2 + 0.28,
      w - 0.22,
      true
    );

    return new M.VGroup(
      bg,
      heading,
      ...dots,
      footer
    );
  }

  function refreshRateGrid(
    p,
    reveal
  ) {
    return replace(
      `rateGrid${p}`,
      rateGrid(p, reveal)
    );
  }

  function extraTwentyOutline() {
    // B has two additional rows of ten expected returns.
    // The outline is drawn directly from grid coordinates.

    const top =
      hundredDotPosition('B', 50)[1];

    const bottom =
      hundredDotPosition('B', 69)[1];

    const y =
      (top + bottom) / 2;

    return rect(
      BX,
      y,
      DOT_SP * 10 + 0.08,
      DOT_SP * 2 + 0.08,
      LOSS,
      LOSS,
      0.07,
      0.08,
      3
    );
  }

  function rateDifferenceTag() {
    return tag(
      '20 EXTRA EXPECTED RETURNS',
      LOSS,
      P ? 19 : 17,
      CX,
      P ? -2.34 : -2.66,
      P ? 6.4 : 6.2
    );
  }

  // ------------------------------------------------------------
  // Per-choice regret visual
  //
  // Values are expected rewards, not fractional learners.
  // The amber segment is the expected reward forgone.
  // ------------------------------------------------------------

  function expectedBar(
    x,
    y,
    width,
    rate,
    color,
    height = 0.28
  ) {
    const track = block(
      x,
      y,
      width,
      height,
      C.muted,
      0.10,
      1
    );

    const parts = [track];

    if (rate > 0) {
      const filledW =
        width * rate;

      parts.push(
        block(
          x - width / 2 + filledW / 2,
          y,
          filledW,
          height,
          color,
          0.91
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function perChoicePicture(stage = 0) {
    const x = CX;
    const y = P ? -0.05 : -0.68;

    const w = P ? 6.55 : 6.35;
    const h = P ? 4.15 : 3.85;

    const bg = rect(
      x, y,
      w, h,
      LOSS,
      C.card,
      0.90,
      0.20,
      2
    );

    const heading = txt(
      'EXPECTED REWARD PER CHOICE',
      P ? 25 : 22,
      C.ink,
      x,
      y + h / 2 - 0.35,
      w - 0.40,
      true
    );

    const barW = w - 1.05;
    const left = x - barW / 2;

    const yA = y + 0.62;
    const yB = y - 0.55;

    const parts = [
      bg,
      heading,
      txt(
        'Choose A',
        P ? 23 : 21,
        A,
        x - w * 0.25,
        yA + 0.38,
        w * 0.43
      ),
      txt(
        '0.50',
        P ? 28 : 25,
        A,
        x + w * 0.30,
        yA + 0.38,
        w * 0.28,
        true
      ),
      expectedBar(
        x,
        yA,
        barW,
        TRUE_RATES.A,
        A,
        0.32
      ),
      txt(
        'Choose B',
        P ? 23 : 21,
        B,
        x - w * 0.25,
        yB + 0.38,
        w * 0.43
      ),
      txt(
        '0.70',
        P ? 28 : 25,
        B,
        x + w * 0.30,
        yB + 0.38,
        w * 0.28,
        true
      ),
      expectedBar(
        x,
        yB,
        barW,
        TRUE_RATES.B,
        B,
        0.32
      )
    ];

    const xa =
      left + barW * TRUE_RATES.A;

    const xb =
      left + barW * TRUE_RATES.B;

    if (stage >= 1) {
      const gapW = xb - xa;

      parts.push(
        block(
          (xa + xb) / 2,
          yA,
          gapW,
          0.32,
          LOSS,
          0.82,
          1
        ),
        dashed(
          xa,
          yA - 0.18,
          xa,
          yB + 0.18,
          LOSS
        ),
        dashed(
          xb,
          yA - 0.18,
          xb,
          yB + 0.18,
          LOSS
        ),
        txt(
          '0.20',
          P ? 22 : 20,
          LOSS,
          (xa + xb) / 2,
          (yA + yB) / 2,
          gapW + 0.28,
          true
        )
      );
    }

    const footer = stage >= 2
      ? 'Expected loss per A choice = 0.20'
      : 'Compare average rewards';

    parts.push(
      txt(
        footer,
        P ? 22 : 20,
        stage >= 2 ? LOSS : C.muted,
        x,
        y - h / 2 + 0.36,
        w - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  function lossRulePicture() {
    const x = CX;
    const y = P ? -0.10 : -0.70;

    const w = P ? 6.50 : 6.25;
    const h = P ? 3.80 : 3.55;

    const bg = rect(
      x,
      y,
      w,
      h,
      REGRET,
      C.card,
      0.91,
      0.20,
      2
    );

    const title = txt(
      'REGRET PER CHOICE',
      P ? 25 : 23,
      REGRET,
      x,
      y + h / 2 - 0.33,
      w - 0.40,
      true
    );

    const leftX = x - w / 4;
    const rightX = x + w / 4;

    const boxY = y + 0.02;

    const leftBox = rect(
      leftX,
      boxY,
      w / 2 - 0.37,
      2.10,
      A,
      A,
      0.07,
      0.16,
      2
    );

    const rightBox = rect(
      rightX,
      boxY,
      w / 2 - 0.37,
      2.10,
      B,
      B,
      0.07,
      0.16,
      2
    );

    return new M.VGroup(
      bg,
      title,
      leftBox,
      rightBox,
      txt(
        'CHOOSE A',
        P ? 22 : 20,
        A,
        leftX,
        boxY + 0.72,
        w / 2 - 0.70,
        true
      ),
      txt(
        'CHOOSE B',
        P ? 22 : 20,
        B,
        rightX,
        boxY + 0.72,
        w / 2 - 0.70,
        true
      ),
      txt(
        '0.70 − 0.50',
        P ? 20 : 18,
        C.ink,
        leftX,
        boxY + 0.16,
        w / 2 - 0.65,
        true
      ),
      txt(
        '0.70 − 0.70',
        P ? 20 : 18,
        C.ink,
        rightX,
        boxY + 0.16,
        w / 2 - 0.65,
        true
      ),
      txt(
        '0.20',
        P ? 40 : 36,
        LOSS,
        leftX,
        boxY - 0.53,
        w / 2 - 0.70,
        true
      ),
      txt(
        '0.00',
        P ? 40 : 36,
        REGRET,
        rightX,
        boxY - 0.53,
        w / 2 - 0.70,
        true
      ),
      txt(
        'Expected loss, not an observed failure',
        P ? 20 : 18,
        C.muted,
        x,
        y - h / 2 + 0.30,
        w - 0.40
      )
    );
  }

  // ------------------------------------------------------------
  // Cumulative-regret graph
  //
  // The graph always starts at zero.
  // Choosing A adds 0.20.
  // Choosing B adds zero.
  //
  // All lines use a common numerical scale.
  // ------------------------------------------------------------

  const GX0 = CX - 2.65;
  const GX1 = CX + 2.90;

  const GY0 = P ? -2.13 : -2.15;
  const GY1 = P ? 2.30 : 1.23;

  const GHEIGHT = GY1 - GY0;

  const GMAX5 = 0.80;
  const GMAX20 = 4.00;

  function gx(k, n = 5) {
    return GX0 +
      (GX1 - GX0) * k / n;
  }

  function gy(value, ymax = GMAX5) {
    return GY0 +
      GHEIGHT * value / ymax;
  }

  function graphAxes(
    n,
    ymax,
    xTicks,
    yTicks,
    title = 'CUMULATIVE REGRET'
  ) {
    const parts = [
      txt(
        title,
        P ? 25 : 21,
        REGRET,
        CX,
        GY1 + (P ? 0.45 : 0.30),
        P ? 6.45 : 6.20,
        true
      ),
      line(
        GX0,
        GY0,
        GX1,
        GY0,
        C.muted,
        2
      ),
      line(
        GX0,
        GY0,
        GX0,
        GY1,
        C.muted,
        2
      )
    ];

    for (const value of yTicks) {
      const yy = gy(value, ymax);

      if (value > 0) {
        parts.push(
          dashed(
            GX0,
            yy,
            GX1,
            yy,
            C.muted
          )
        );
      }

      parts.push(
        line(
          GX0 - 0.06,
          yy,
          GX0 + 0.06,
          yy,
          C.muted,
          1.5
        ),
        txt(
          ymax <= 1
            ? fmt(value, 1)
            : String(value),
          P ? 17 : 16,
          C.muted,
          GX0 - 0.33,
          yy,
          0.55,
          true
        )
      );
    }

    for (const k of xTicks) {
      const xx = gx(k, n);

      parts.push(
        line(
          xx,
          GY0 - 0.06,
          xx,
          GY0 + 0.06,
          C.muted,
          1.5
        ),
        txt(
          String(k),
          P ? 18 : 16,
          C.muted,
          xx,
          GY0 - 0.24,
          0.50,
          true
        )
      );
    }

    parts.push(
      txt('choice', P ? 17 : 15, C.muted, GX0 - 0.33, GY0 - 0.58, 0.9, false)
    );

    return new M.VGroup(...parts);
  }

  function graphPoint(
    k,
    value,
    n = 5,
    ymax = GMAX5,
    color = REGRET
  ) {
    return glow(
      gx(k, n),
      gy(value, ymax),
      P ? 0.095 : 0.080,
      color
    );
  }

  function graphSegment(
    k,
    previous,
    current,
    n = 5,
    ymax = GMAX5,
    color = REGRET,
    strokeWidth = 4
  ) {
    return line(
      gx(k - 1, n),
      gy(previous, ymax),
      gx(k, n),
      gy(current, ymax),
      color,
      strokeWidth
    );
  }

  function graphChoiceTag(k, p) {
    return tag(
      p,
      pc(p),
      P ? 18 : 16,
      gx(k),
      GY0 - 0.61,
      0.65
    );
  }

  function graphValueLabel(
    k,
    value,
    n = 5,
    ymax = GMAX5,
    color = REGRET,
    offset = 0.25
  ) {
    return txt(
      fmt(value, 2),
      P ? 21 : 19,
      color,
      gx(k, n),
      gy(value, ymax) + offset,
      0.85,
      true
    );
  }

  function segmentOutline(
    k,
    previous,
    current,
    color
  ) {
    const x1 = gx(k - 1);
    const x2 = gx(k);

    const y1 = gy(previous);
    const y2 = gy(current);

    return rect(
      (x1 + x2) / 2,
      (y1 + y2) / 2,
      x2 - x1 + 0.14,
      Math.max(
        0.34,
        Math.abs(y2 - y1) + 0.18
      ),
      color,
      color,
      0.025,
      0.10,
      2
    );
  }

  let runningRegret = 0;
  const plottedRegrets = [0];

  function appendGraphChoice(k, p) {
    const previous = runningRegret;

    runningRegret += regretFor(p);

    plottedRegrets.push(
      runningRegret
    );

    const current =
      runningRegret;

    const segment = graphSegment(
      k,
      previous,
      current
    );

    const point = graphPoint(
      k,
      current
    );

    slots.set(
      `segment${k}`,
      segment
    );

    slots.set(
      `point${k}`,
      point
    );

    const value = graphValueLabel(
      k,
      current
    );

    return [
      new M.Create(segment),
      new M.FadeIn(point),
      ...replace(
        'graphValue',
        value
      ),
      ...replace(
        `graphChoice${k}`,
        graphChoiceTag(k, p)
      )
    ];
  }

  function currentGraphFocus(k, p) {
    return replace(
      'graphFocus',
      rect(
        gx(k),
        GY0 + GHEIGHT / 2,
        0.37,
        GHEIGHT,
        pc(p),
        pc(p),
        0.06,
        0.07,
        1.5
      )
    );
  }

  // ------------------------------------------------------------
  // Expected-reward comparison
  //
  // Actual five-choice sequence:
  // 3 A choices × 0.50 = 1.50
  // 2 B choices × 0.70 = 1.40
  //
  // Expected total = 2.90
  // Best fixed choice = 5 B choices × 0.70 = 3.50
  // Difference = 0.60
  // ------------------------------------------------------------

  function promptChip(
    p,
    x,
    y,
    width = 0.72,
    height = 0.56
  ) {
    const color = pc(p);

    return new M.VGroup(
      rect(
        x,
        y,
        width,
        height,
        color,
        color,
        0.13,
        0.10,
        2
      ),
      txt(
        p,
        P ? 24 : 22,
        color,
        x,
        y,
        width - 0.16,
        true
      )
    );
  }

  function groupedChoicePicture(
    showAReward = false,
    showBReward = false
  ) {
    const x = CX;
    const y = P ? -0.15 : -0.62;

    const w = P ? 6.60 : 6.30;
    const h = P ? 4.40 : 3.85;

    const bg = rect(
      x,
      y,
      w,
      h,
      C.cyan,
      C.card,
      0.91,
      0.20,
      2
    );

    const aY =
      y + h * 0.16;

    const bY =
      y - h * 0.24;

    const chipStart =
      x - w / 2 + 0.62;

    const spacing = 0.84;

    const parts = [
      bg,
      txt(
        'OUR FIVE CHOICES',
        P ? 25 : 23,
        C.ink,
        x,
        y + h / 2 - 0.35,
        w - 0.40,
        true
      ),
      txt(
        '3 choices of A',
        P ? 22 : 20,
        A,
        x - w * 0.22,
        aY + 0.55,
        w * 0.49
      ),
      txt(
        '2 choices of B',
        P ? 22 : 20,
        B,
        x - w * 0.22,
        bY + 0.55,
        w * 0.49
      )
    ];

    for (let k = 0; k < 3; k++) {
      parts.push(
        promptChip(
          'A',
          chipStart + k * spacing,
          aY
        )
      );
    }

    for (let k = 0; k < 2; k++) {
      parts.push(
        promptChip(
          'B',
          chipStart + k * spacing,
          bY
        )
      );
    }

    const numberX =
      x + w * 0.26;

    if (showAReward) {
      parts.push(
        txt(
          '3 × 0.50',
          P ? 21 : 19,
          A,
          numberX,
          aY + 0.20,
          w * 0.39,
          true
        ),
        txt(
          '= 1.50',
          P ? 29 : 26,
          A,
          numberX,
          aY - 0.27,
          w * 0.39,
          true
        )
      );
    }

    if (showBReward) {
      parts.push(
        txt(
          '2 × 0.70',
          P ? 21 : 19,
          B,
          numberX,
          bY + 0.20,
          w * 0.39,
          true
        ),
        txt(
          '= 1.40',
          P ? 29 : 26,
          B,
          numberX,
          bY - 0.27,
          w * 0.39,
          true
        )
      );
    }

    parts.push(
      txt(
        'These are expected rewards.',
        P ? 20 : 18,
        C.muted,
        x,
        y - h / 2 + 0.27,
        w - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  const EXPECTED_OUR =
    expectedReward(CHOICES);

  const EXPECTED_BEST =
    CHOICES.length * TRUE_RATES.B;

  const EXPECTED_GAP =
    EXPECTED_BEST - EXPECTED_OUR;

  function totalRewardPicture(
    stage = 0
  ) {
    const x = CX;
    const y = P ? -0.10 : -0.64;

    const w = P ? 6.60 : 6.30;
    const h = P ? 4.45 : 3.85;

    const bg = rect(
      x, y,
      w, h,
      stage >= 2
        ? REGRET
        : C.cyan,
      C.card,
      0.91,
      0.20,
      2
    );

    const top =
      y + h / 2 - 0.35;

    const barW =
      w - 1.00;

    const left =
      x - barW / 2;

    const maxReward = 5;

    const yOur = y + 0.50;
    const yBest = y - 0.80;

    const aWidth =
      barW * 1.50 / maxReward;

    const bWidth =
      barW * 1.40 / maxReward;

    const bestWidth =
      barW * EXPECTED_BEST /
      maxReward;

    const barH = 0.40;

    const parts = [
      bg,
      txt(
        'EXPECTED TOTAL REWARD',
        P ? 25 : 22,
        C.ink,
        x,
        top,
        w - 0.35,
        true
      ),
      txt(
        'Our five choices',
        P ? 22 : 20,
        C.ink,
        x - w * 0.19,
        yOur + 0.45,
        w * 0.55
      ),
      txt(
        fmt(EXPECTED_OUR),
        P ? 28 : 25,
        C.cyan,
        x + w * 0.32,
        yOur + 0.45,
        w * 0.28,
        true
      ),
      block(
        x,
        yOur,
        barW,
        barH,
        C.muted,
        0.09
      ),
      block(
        left + aWidth / 2,
        yOur,
        aWidth,
        barH,
        A,
        0.91
      ),
      block(
        left + aWidth + bWidth / 2,
        yOur,
        bWidth,
        barH,
        B,
        0.91
      )
    ];

    if (stage >= 1) {
      parts.push(
        txt(
          'Always choose B',
          P ? 22 : 20,
          B,
          x - w * 0.19,
          yBest + 0.45,
          w * 0.55
        ),
        txt(
          fmt(EXPECTED_BEST),
          P ? 28 : 25,
          B,
          x + w * 0.32,
          yBest + 0.45,
          w * 0.28,
          true
        ),
        block(
          x,
          yBest,
          barW,
          barH,
          C.muted,
          0.09
        ),
        block(
          left + bestWidth / 2,
          yBest,
          bestWidth,
          barH,
          B,
          0.91
        )
      );
    }

    if (stage >= 2) {
      const gapWidth =
        barW * EXPECTED_GAP /
        maxReward;

      const gapStart =
        left + aWidth + bWidth;

      const gapEnd =
        gapStart + gapWidth;

      parts.push(
        block(
          (gapStart + gapEnd) / 2,
          yOur,
          gapWidth,
          barH,
          LOSS,
          0.78
        ),
        dashed(
          gapStart,
          yOur - 0.23,
          gapStart,
          yBest + 0.23,
          LOSS
        ),
        dashed(
          gapEnd,
          yOur - 0.23,
          gapEnd,
          yBest + 0.23,
          LOSS
        ),
        txt(
          '0.60',
          P ? 20 : 18,
          LOSS,
          (gapStart + gapEnd) / 2,
          (yOur + yBest) / 2,
          0.95,
          true
        )
      );
    }

    const footer = stage >= 2
      ? 'Expected reward lost = 0.60'
      : stage === 1
        ? 'Compare the same five choices'
        : '1.50 + 1.40 = 2.90';

    parts.push(
      txt(
        footer,
        P ? 22 : 20,
        stage >= 2
          ? REGRET
          : C.muted,
        x,
        y - h / 2 + 0.29,
        w - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Twenty-choice comparison
  //
  // Always A:
  // 20 × 0.20 = 4.00
  //
  // Always B:
  // 20 × 0.00 = 0.00
  //
  // The illustrative learning sequence begins with the same
  // first five choices and increasingly favours B.
  //
  // No new observed rewards are fabricated for this graph.
  // It measures expected regret from the choice sequence alone.
  // ------------------------------------------------------------

  const ALWAYS_A =
    Array.from(
      { length: 20 },
      () => 'A'
    );

  const ALWAYS_B =
    Array.from(
      { length: 20 },
      () => 'B'
    );

  const LEARNING_CHOICES = [
    'A', 'B', 'A', 'A', 'B',
    'B', 'A', 'B', 'B', 'B',
    'A', 'B', 'B', 'B', 'B',
    'B', 'B', 'B', 'B', 'B'
  ];

  function curveSegments(
    choices,
    color,
    strokeWidth = 4
  ) {
    const values =
      cumulativeRegrets(choices);

    const n = choices.length;

    return choices.map((p, k) =>
      graphSegment(
        k + 1,
        values[k],
        values[k + 1],
        n,
        GMAX20,
        color,
        strokeWidth
      )
    );
  }

  function curveEndpoint(
    choices,
    color,
    label,
    offset = 0.27,
    dx = -0.58
  ) {
    const values =
      cumulativeRegrets(choices);

    const final =
      values[values.length - 1];

    const n = choices.length;

    const x = gx(n, n);
    const y = gy(final, GMAX20);

    return new M.VGroup(
      glow(
        x,
        y,
        0.085,
        color
      ),
      txt(
        label,
        P ? 20 : 18,
        color,
        x + dx,
        y + offset,
        1.30,
        true
      )
    );
  }

  function graphLegend() {
    const y = P ? -3.12 : -3.08;

    const items = [
      {
        x: CX - 1.98,
        label: 'Always A',
        color: A
      },
      {
        x: CX,
        label: 'Learning',
        color: REGRET
      },
      {
        x: CX + 1.98,
        label: 'Always B',
        color: B
      }
    ];

    return new M.VGroup(
      ...items.map(item =>
        new M.VGroup(
          line(
            item.x - 0.82,
            y,
            item.x - 0.53,
            y,
            item.color,
            4
          ),
          txt(
            item.label,
            P ? 17 : 16,
            item.color,
            item.x + 0.23,
            y,
            1.45
          )
        )
      )
    );
  }

  function learningCurveFocus() {
    const x1 = gx(12, 20);
    const x2 = gx(20, 20);

    const values =
      cumulativeRegrets(
        LEARNING_CHOICES
      );

    const level =
      values[values.length - 1];

    const y =
      gy(level, GMAX20);

    return rect(
      (x1 + x2) / 2,
      y,
      x2 - x1 + 0.15,
      0.43,
      REGRET,
      REGRET,
      0.06,
      0.11,
      2
    );
  }

  // ------------------------------------------------------------
  // Actual failures versus expected regret
  //
  // A return after A still incurs 0.20 expected regret.
  // A non-return after B incurs zero expected regret.
  // ------------------------------------------------------------

  function failureComparison() {
    const x = CX;
    const y = P ? -0.12 : -0.69;

    const w = P ? 6.55 : 6.30;
    const h = P ? 4.35 : 3.78;

    const bg = rect(
      x, y,
      w, h,
      LOSS,
      C.card,
      0.92,
      0.19,
      2
    );

    const leftX = x - w / 4;
    const rightX = x + w / 4;

    const middle =
      y + 0.04;

    const parts = [
      bg,
      txt(
        'OBSERVED OUTCOME ≠ REGRET',
        P ? 24 : 21,
        LOSS,
        x,
        y + h / 2 - 0.33,
        w - 0.35,
        true
      ),
      line(
        x,
        y + h / 2 - 0.85,
        x,
        y - h / 2 + 0.40,
        C.muted,
        1
      ),
      promptChip(
        'A',
        leftX,
        middle + 0.85
      ),
      promptChip(
        'B',
        rightX,
        middle + 0.85
      ),
      rewardMark(
        leftX,
        middle + 0.08,
        1,
        0.23
      ),
      rewardMark(
        rightX,
        middle + 0.08,
        0,
        0.23
      ),
      txt(
        'Learner returns',
        P ? 21 : 19,
        GOOD,
        leftX,
        middle - 0.41,
        w / 2 - 0.35
      ),
      txt(
        'No return',
        P ? 21 : 19,
        BAD,
        rightX,
        middle - 0.41,
        w / 2 - 0.35
      ),
      txt(
        'Regret: 0.20',
        P ? 25 : 23,
        LOSS,
        leftX,
        middle - 1.02,
        w / 2 - 0.35,
        true
      ),
      txt(
        'Regret: 0.00',
        P ? 25 : 23,
        REGRET,
        rightX,
        middle - 1.02,
        w / 2 - 0.35,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Simulator versus real-world knowledge
  // ------------------------------------------------------------

  function knowledgePicture(
    simulator = true
  ) {
    const x = CX;
    const y = P ? -0.10 : -0.70;

    const w = P ? 6.55 : 6.25;
    const h = P ? 4.35 : 3.85;

    const bg = rect(
      x,
      y,
      w,
      h,
      simulator
        ? REGRET
        : C.muted,
      C.card,
      0.91,
      0.20,
      2
    );

    const title = txt(
      simulator
        ? 'INSIDE OUR SIMULATION'
        : 'INSIDE THE REAL STUDY APP',
      P ? 24 : 22,
      simulator
        ? REGRET
        : C.ink,
      x,
      y + h / 2 - 0.33,
      w - 0.40,
      true
    );

    const leftX =
      x - w / 4;

    const rightX =
      x + w / 4;

    const rowY =
      y + 0.22;

    const cellW =
      w / 2 - 0.40;

    const cellH =
      P ? 2.40 : 2.15;

    const parts = [
      bg,
      title
    ];

    for (const p of ['A', 'B']) {
      const xx =
        p === 'A'
          ? leftX
          : rightX;

      const color =
        pc(p);

      parts.push(
        rect(
          xx,
          rowY,
          cellW,
          cellH,
          color,
          color,
          0.055,
          0.15,
          2
        ),
        txt(
          `PROMPT ${p}`,
          P ? 22 : 20,
          color,
          xx,
          rowY + cellH / 2 - 0.30,
          cellW - 0.30,
          true
        ),
        txt(
          simulator
            ? pct(TRUE_RATES[p])
            : '?',
          P ? 43 : 38,
          simulator
            ? color
            : C.muted,
          xx,
          rowY + 0.06,
          cellW - 0.40,
          true
        ),
        txt(
          simulator
            ? 'True rate is set'
            : 'True rate unknown',
          P ? 18 : 16,
          simulator
            ? REGRET
            : C.muted,
          xx,
          rowY - cellH / 2 + 0.30,
          cellW - 0.20
        )
      );
    }

    parts.push(
      txt(
        simulator
          ? 'The evaluator can calculate regret.'
          : 'The app observes only chosen rewards.',
        P ? 20 : 18,
        simulator
          ? GOOD
          : C.muted,
        x,
        y - h / 2 + 0.36,
        w - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  // ============================================================
  // NARRATED SCENE
  // ============================================================

  // ------------------------------------------------------------
  // 0: the study app has spent time learning
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...replace(
      'app',
      appPicture()
    ),
    ...say('OUR STUDY APP IS LEARNING'),
    ...fbox(
      [
        ['Our goal', GOOD],
        'Help more learners',
        'return the next day.',
        'Learn which prompt works.'
      ],
      GOOD
    )
  );

  // ------------------------------------------------------------
  // 1: introduce the two familiar prompts
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...clear('app'),
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
  // 2: each choice produces information
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...replace(
      'learningPicture',
      new M.VGroup(
        glow(
          CX - 2.25,
          P ? 0.10 : -0.60,
          0.22,
          C.ink
        ),
        arrow(
          CX - 1.87,
          P ? 0.10 : -0.60,
          CX - 0.65,
          P ? 0.10 : -0.60,
          A,
          3
        ),
        rect(
          CX,
          P ? 0.10 : -0.60,
          1.05,
          0.86,
          A,
          A,
          0.15,
          0.13,
          2
        ),
        txt(
          'A or B',
          P ? 21 : 19,
          C.ink,
          CX,
          P ? 0.10 : -0.60,
          0.90,
          true
        ),
        arrow(
          CX + 0.64,
          P ? 0.10 : -0.60,
          CX + 1.83,
          P ? 0.10 : -0.60,
          GOOD,
          3
        ),
        rewardMark(
          CX + 2.22,
          P ? 0.10 : -0.60,
          null,
          0.24
        ),
        txt(
          'Learner',
          P ? 19 : 17,
          C.muted,
          CX - 2.25,
          P ? -0.65 : -1.35,
          1.45
        ),
        txt(
          'Choose',
          P ? 19 : 17,
          C.muted,
          CX,
          P ? -0.65 : -1.35,
          1.45
        ),
        txt(
          'Observe',
          P ? 19 : 17,
          C.muted,
          CX + 2.22,
          P ? -0.65 : -1.35,
          1.45
        )
      )
    ),
    ...say('EVERY CHOICE TEACHES US SOMETHING'),
    ...fbox(
      [
        'Choose one prompt.',
        'Observe its reward.',
        ['Learn from that result.', GOOD]
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 3: how much is lost while learning?
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...say('WHAT DOES LEARNING COST?', LOSS),
    ...fbox(
      [
        ['While we learn...', LOSS],
        'Some choices may be worse',
        'than the best available choice.',
        'How much do we lose?'
      ],
      LOSS
    )
  );

  // ------------------------------------------------------------
  // 4: prepare five UCB choices
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...clear('learningPicture'),
    ...Array.from(
      { length: 5 },
      (_, k) =>
        refreshObservation(k)
    ).flat(),
    ...say('FIVE CHOICES FROM OUR UCB EXAMPLE'),
    ...fbox(
      [
        ['Upper confidence bound', C.cyan],
        'Recall the first five choices.',
        'One learner per choice.',
        'Observe each result separately.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 5-9: the five observed choices
  //
  // A → 1
  // B → 0
  // A → 0
  // A → 0
  // B → 1
  // ------------------------------------------------------------

  await narratedChoice(
    5,
    0,
    CHOICES[0],
    1.00
  );

  await narratedChoice(
    6,
    1,
    CHOICES[1],
    1.05
  );

  await narratedChoice(
    7,
    2,
    CHOICES[2],
    1.10
  );

  await narratedChoice(
    8,
    3,
    CHOICES[3],
    1.10
  );

  await narratedChoice(
    9,
    4,
    CHOICES[4],
    1.15
  );

  // ------------------------------------------------------------
  // 10: two observed returns from five learners
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...clear('promptFocus'),
    ...replace(
      'observedTotal',
      observationTotal()
    ),
    ...replace(
      'success0',
      observationOutline(0, GOOD)
    ),
    ...replace(
      'success4',
      observationOutline(4, GOOD)
    ),
    ...say('2 RETURNS FROM 5 LEARNERS', GOOD),
    ...fbox(
      [
        ['Observed rewards', C.cyan],
        '1 + 0 + 0 + 0 + 1',
        ['Total observed reward = 2', GOOD]
      ],
      GOOD
    )
  );

  // ------------------------------------------------------------
  // 11: actual outcomes alone do not measure regret
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...clear(
      'success0',
      'success4'
    ),
    ...say('OBSERVED RESULTS ARE NOT REGRET', LOSS),
    ...fbox(
      [
        ['Actual observed returns: 2', GOOD],
        'But what would we expect',
        'from the best fixed prompt?',
        ['We need expected rewards.', LOSS]
      ],
      LOSS
    )
  );

  // ------------------------------------------------------------
  // 12: reveal the hidden true return rates
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...clearExcept(
      'headerA',
      'headerB',
      'box'
    ),
    ...refreshRateGrid('A', false),
    ...refreshRateGrid('B', false),
    ...say('REVEAL THE HIDDEN TRUE RATES', REGRET),
    ...fbox(
      [
        ['True return rates', REGRET],
        'Known to our simulator.',
        'Unknown to the learning app.',
        'Use them to measure regret.'
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 13: ignore context for this example
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...say('FOR NOW: NO LEARNER CONTEXT'),
    ...fbox(
      [
        ['Non-contextual example', C.cyan],
        'Treat all learners together.',
        'Do not split by study activity.',
        'Compare A and B overall.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 14: A has a true return rate of 50%
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...refreshRateGrid('A', true),
    ...say('A: 50 EXPECTED RETURNS PER 100', A),
    ...fbox(
      [
        ['Prompt A', A],
        '100 hypothetical learners',
        ['50 expected returns', GOOD],
        ['True rate = 50%', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 15: B has a true return rate of 70%
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...refreshRateGrid('B', true),
    ...say('B: 70 EXPECTED RETURNS PER 100', B),
    ...fbox(
      [
        ['Prompt B', B],
        '100 hypothetical learners',
        ['70 expected returns', GOOD],
        ['True rate = 70%', B],
        'B is the best fixed prompt.'
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 16: choosing A instead of B loses twenty expected returns
  // per hundred choices
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...replace(
      'extraTwenty',
      extraTwentyOutline()
    ),
    ...replace(
      'differenceTag',
      rateDifferenceTag()
    ),
    ...say('70 − 50 = 20 EXPECTED RETURNS LOST', LOSS),
    ...fbox(
      [
        ['100 choices of A: 50', A],
        ['100 choices of B: 70', B],
        ['Difference: 70 − 50', LOSS],
        ['20 expected returns lost', LOSS]
      ],
      LOSS
    )
  );

  // ------------------------------------------------------------
  // 17: expected loss per individual choice is 0.20
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...clearExcept('box'),
    ...replace(
      'perChoice',
      perChoicePicture(1)
    ),
    ...say('PER CHOICE: 20 ÷ 100 = 0.20', LOSS),
    ...fbox(
      [
        ['Loss per 100 choices = 20', LOSS],
        ['Loss per choice = 20 ÷ 100', C.ink],
        ['Expected loss = 0.20', LOSS]
      ],
      LOSS
    )
  );

  // ------------------------------------------------------------
  // 18: this is not part of a learner returning
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...say('0.20 IS NOT PART OF A LEARNER', LOSS),
    ...fbox(
      [
        ['A learner either returns', C.ink],
        ['or does not return.', C.ink],
        '0.20 is an average',
        'expected reward difference.'
      ],
      LOSS
    )
  );

  // ------------------------------------------------------------
  // 19: expected average loss from choosing A
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...replace(
      'perChoice',
      perChoicePicture(2)
    ),
    ...say('AVERAGE EXPECTED LOSS PER A CHOICE', LOSS),
    ...fbox(
      [
        ['Best fixed reward = 0.70', B],
        ['Chosen A reward = 0.50', A],
        ['0.70 − 0.50 = 0.20', LOSS]
      ],
      LOSS
    )
  );

  // ------------------------------------------------------------
  // 20: name the concept: regret
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...replace(
      'perChoice',
      lossRulePicture()
    ),
    ...say('EXPECTED LOSS IS CALLED REGRET', REGRET),
    ...fbox(
      [
        ['REGRET', REGRET],
        'Expected reward lost',
        'by choosing something',
        'other than the best fixed action.'
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 21: cumulative regret adds the regret from every choice
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...say('ADD EACH LOSS: CUMULATIVE REGRET', REGRET),
    ...fbox(
      [
        ['A adds 0.20', A],
        ['B adds 0.00', B],
        ['Cumulative regret', REGRET],
        'Add these losses',
        'across all choices.'
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 22: cumulative means a running total
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...say('CUMULATIVE = RUNNING TOTAL', REGRET),
    ...fbox(
      [
        ['Start at zero', C.ink],
        'Take another action.',
        'Find its expected loss.',
        ['Add it to the running total.', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 23: return to the five choices and start a graph at zero
  // ------------------------------------------------------------

  await until(S(23));

  runningRegret = 0;
  plottedRegrets.length = 1;
  plottedRegrets[0] = 0;

  await play(
    ...clearExcept('box'),
    ...replace(
      'graphAxes',
      graphAxes(
        5,
        GMAX5,
        [0, 1, 2, 3, 4, 5],
        [0, 0.2, 0.4, 0.6, 0.8]
      )
    ),
    ...replace(
      'point0',
      graphPoint(0, 0)
    ),
    ...say('START THE RUNNING TOTAL AT ZERO', REGRET),
    ...fbox(
      [
        ['Our choices', C.ink],
        ['A, B, A, A, B', C.cyan],
        'Before any choices:',
        ['Cumulative regret = 0.00', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 24: first choice is A, so add 0.20
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...currentGraphFocus(1, 'A'),
    ...replace(
      'graphChoice1',
      graphChoiceTag(1, 'A')
    ),
    ...say('CHOICE 1: A ADDS 0.20', A),
    ...fbox(
      [
        ['Choice 1: A', A],
        'Best fixed reward = 0.70',
        'Chosen expected reward = 0.50',
        ['Regret = 0.20', LOSS]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 25: cumulative regret becomes 0.20
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...clear('graphFocus'),
    ...appendGraphChoice(1, 'A'),
    ...say('0.00 + 0.20 = 0.20', REGRET),
    ...fbox(
      [
        ['Previous total = 0.00', C.ink],
        ['New regret = 0.20', LOSS],
        ['0.00 + 0.20 = 0.20', REGRET],
        ['Cumulative regret = 0.20', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 26: second choice is B, so add zero
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...currentGraphFocus(2, 'B'),
    ...replace(
      'graphChoice2',
      graphChoiceTag(2, 'B')
    ),
    ...say('CHOICE 2: B ADDS ZERO', B),
    ...fbox(
      [
        ['Choice 2: B', B],
        'Best fixed reward = 0.70',
        'Chosen expected reward = 0.70',
        ['Regret = 0.00', REGRET]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 27: cumulative regret stays at 0.20
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...clear('graphFocus'),
    ...appendGraphChoice(2, 'B'),
    ...say('0.20 + 0.00 = 0.20', REGRET),
    ...fbox(
      [
        ['Previous total = 0.20', C.ink],
        ['New regret = 0.00', B],
        ['0.20 + 0.00 = 0.20', REGRET],
        'The line stays flat.'
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 28: third choice is A, add another 0.20
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...currentGraphFocus(3, 'A'),
    ...replace(
      'graphChoice3',
      graphChoiceTag(3, 'A')
    ),
    ...say('CHOICE 3: A ADDS ANOTHER 0.20', A),
    ...fbox(
      [
        ['Choice 3: A', A],
        ['0.70 − 0.50 = 0.20', LOSS],
        'Add this to the old total.'
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 29: cumulative regret rises to 0.40
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...clear('graphFocus'),
    ...appendGraphChoice(3, 'A'),
    ...say('0.20 + 0.20 = 0.40', REGRET),
    ...fbox(
      [
        ['Previous total = 0.20', C.ink],
        ['New regret = 0.20', LOSS],
        ['0.20 + 0.20 = 0.40', REGRET],
        ['Cumulative regret = 0.40', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 30: fourth choice is A, cumulative regret becomes 0.60
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...currentGraphFocus(4, 'A'),
    ...replace(
      'graphChoice4',
      graphChoiceTag(4, 'A')
    ),
    ...say('CHOICE 4: A ADDS 0.20', A),
    ...fbox(
      [
        ['Choice 4: A', A],
        ['Regret = 0.20', LOSS],
        'Previous total = 0.40'
      ],
      A
    )
  );

  await until(S(30) + 1.80);

  await play(
    ...clear('graphFocus'),
    ...appendGraphChoice(4, 'A'),
    ...say('0.40 + 0.20 = 0.60', REGRET),
    ...fbox(
      [
        ['Previous total = 0.40', C.ink],
        ['New regret = 0.20', LOSS],
        ['0.40 + 0.20 = 0.60', REGRET],
        ['Cumulative regret = 0.60', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 31: fifth choice is B, cumulative regret remains 0.60
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...currentGraphFocus(5, 'B'),
    ...replace(
      'graphChoice5',
      graphChoiceTag(5, 'B')
    ),
    ...say('CHOICE 5: B ADDS ZERO', B),
    ...fbox(
      [
        ['Choice 5: B', B],
        ['Regret = 0.00', REGRET],
        'Previous total = 0.60'
      ],
      B
    )
  );

  await until(S(31) + 1.75);

  await play(
    ...clear('graphFocus'),
    ...appendGraphChoice(5, 'B'),
    ...say('0.60 + 0.00 = 0.60', REGRET),
    ...fbox(
      [
        ['Previous total = 0.60', C.ink],
        ['New regret = 0.00', B],
        ['0.60 + 0.00 = 0.60', REGRET],
        ['Final cumulative regret = 0.60', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 32: the line rises whenever A is chosen
  // ------------------------------------------------------------

  await until(S(32));

  const rises = [1, 3, 4];

  await play(
    ...rises.flatMap(k =>
      replace(
        `highlight${k}`,
        segmentOutline(
          k,
          plottedRegrets[k - 1],
          plottedRegrets[k],
          LOSS
        )
      )
    ),
    ...say('A CHOICES MAKE THE LINE RISE', A),
    ...fbox(
      [
        ['Choices 1, 3 and 4', A],
        'Each chooses A.',
        ['Each adds 0.20', LOSS],
        ['The total rises three times.', REGRET]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 33: the line remains flat whenever B is chosen
  // ------------------------------------------------------------

  await until(S(33));

  const flats = [2, 5];

  await play(
    ...clear(
      'highlight1',
      'highlight3',
      'highlight4'
    ),
    ...flats.flatMap(k =>
      replace(
        `highlight${k}`,
        segmentOutline(
          k,
          plottedRegrets[k - 1],
          plottedRegrets[k],
          B
        )
      )
    ),
    ...say('B CHOICES KEEP THE LINE FLAT', B),
    ...fbox(
      [
        ['Choices 2 and 5', B],
        'Each chooses B.',
        ['Each adds zero regret.', REGRET],
        'The running total stays unchanged.'
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 34: check the result another way
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...clear(
      'highlight2',
      'highlight5'
    ),
    ...say('CHECK THE SAME RESULT ANOTHER WAY'),
    ...fbox(
      [
        ['Running-total result', REGRET],
        ['Cumulative regret = 0.60', REGRET],
        'Now compare total',
        'expected rewards.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 35: three A choices and two B choices
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...clearExcept('box'),
    ...replace(
      'groupedChoices',
      groupedChoicePicture(
        false,
        false
      )
    ),
    ...say('3 CHOICES OF A, 2 CHOICES OF B'),
    ...fbox(
      [
        ['Our sequence: A, B, A, A, B', C.ink],
        [`A chosen ${timesChosen('A')} times`, A],
        [`B chosen ${timesChosen('B')} times`, B],
        'Five choices in total.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 36: A contributes expected reward 1.50
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...replace(
      'groupedChoices',
      groupedChoicePicture(
        true,
        false
      )
    ),
    ...say('3 × 0.50 = 1.50', A),
    ...fbox(
      [
        ['Three choices of A', A],
        'Expected reward per A = 0.50',
        ['3 × 0.50 = 1.50', A]
      ],
      A
    )
  );

  // ------------------------------------------------------------
  // 37: B contributes expected reward 1.40
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...replace(
      'groupedChoices',
      groupedChoicePicture(
        true,
        true
      )
    ),
    ...say('2 × 0.70 = 1.40', B),
    ...fbox(
      [
        ['Two choices of B', B],
        'Expected reward per B = 0.70',
        ['2 × 0.70 = 1.40', B]
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 38: total expected reward is 2.90
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...clear('groupedChoices'),
    ...replace(
      'totalReward',
      totalRewardPicture(0)
    ),
    ...say('1.50 + 1.40 = 2.90', C.cyan),
    ...fbox(
      [
        ['Expected reward from A = 1.50', A],
        ['Expected reward from B = 1.40', B],
        ['1.50 + 1.40 = 2.90', C.cyan],
        'Expected total reward.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 39: choosing B all five times gives expected reward 3.50
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...replace(
      'totalReward',
      totalRewardPicture(1)
    ),
    ...say('ALWAYS B: 5 × 0.70 = 3.50', B),
    ...fbox(
      [
        ['Best fixed prompt: B', B],
        'Choose B five times.',
        ['5 × 0.70 = 3.50', B],
        'Expected total reward.'
      ],
      B
    )
  );

  // ------------------------------------------------------------
  // 40: 3.50 minus 2.90 equals 0.60
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...replace(
      'totalReward',
      totalRewardPicture(2)
    ),
    ...say('3.50 − 2.90 = 0.60', LOSS),
    ...fbox(
      [
        ['Best fixed total = 3.50', B],
        ['Our expected total = 2.90', C.cyan],
        ['3.50 − 2.90 = 0.60', LOSS],
        ['Cumulative regret = 0.60', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 41: both calculations agree
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...say('BOTH METHODS GIVE THE SAME ANSWER', REGRET),
    ...fbox(
      [
        ['Add losses one by one', REGRET],
        '0.20 + 0 + 0.20 + 0.20 + 0',
        ['= 0.60', REGRET],
        ['Compare expected totals', C.cyan],
        ['3.50 − 2.90 = 0.60', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 42: introduce the short formula
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...say('WRITE THE REGRET RULE', C.cyan),
    ...fbox(
      [
        ['For every choice:', C.cyan],
        'Find the best expected reward.',
        'Find the chosen expected reward.',
        ['Subtract the two.', LOSS]
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 43: regret = best fixed expected reward minus chosen reward
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...clear('totalReward'),
    ...replace(
      'regretRule',
      lossRulePicture()
    ),
    ...say('REGRET = BEST EXPECTED − CHOSEN EXPECTED', REGRET),
    ...fbox(
      [
        ['regret =', REGRET],
        ['  best fixed expected reward', B],
        ['  − chosen expected reward', C.cyan],
        ['A: 0.70 − 0.50 = 0.20', A],
        ['B: 0.70 − 0.70 = 0.00', B]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 44: cumulative regret is the sum across all choices
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...say('CUMULATIVE REGRET = SUM OF REGRET', REGRET),
    ...fbox(
      [
        ['cumulative regret =', REGRET],
        ['  sum of regret over all choices', C.ink],
        '0.20 + 0 + 0.20 + 0.20 + 0',
        ['= 0.60', REGRET]
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 45: always choosing A twenty times gives regret of four
  // ------------------------------------------------------------

  await until(S(45));

  const alwaysASegments =
    curveSegments(
      ALWAYS_A,
      A,
      4
    );

  await play(
    ...clearExcept('box'),
    ...replace(
      'graphAxes20',
      graphAxes(
        20,
        GMAX20,
        [0, 5, 10, 15, 20],
        [0, 1, 2, 3, 4]
      )
    ),
    ...replace(
      'legend20',
      graphLegend()
    ),
    ...say('ALWAYS A: REGRET KEEPS RISING', A),
    ...fbox(
      [
        ['Choose A twenty times', A],
        'Regret per choice = 0.20',
        ['20 × 0.20 = 4.00', LOSS]
      ],
      A
    )
  );

  await play(
    new M.LaggedStart(
      alwaysASegments.map(segment =>
        new M.Create(segment)
      ),
      {
        lagRatio: 0.12,
        runTime: 1.75
      }
    )
  );

  alwaysASegments.forEach(
    (segment, k) => {
      slots.set(
        `alwaysA${k}`,
        segment
      );
    }
  );

  await play(
    quick(
      replace(
        'endpointA',
        curveEndpoint(
          ALWAYS_A,
          A,
          '4.00',
          -0.3,
          -1.6
        )
      ),
      0.25
    )
  );

  // ------------------------------------------------------------
  // 46: always choosing B twenty times gives zero regret
  // ------------------------------------------------------------

  await until(S(46));

  const alwaysBSegments =
    curveSegments(
      ALWAYS_B,
      B,
      4
    );

  await play(
    ...say('ALWAYS B: ZERO CUMULATIVE REGRET', B),
    ...fbox(
      [
        ['Choose B twenty times', B],
        'Regret per choice = 0.00',
        ['20 × 0.00 = 0.00', REGRET]
      ],
      B
    )
  );

  await play(
    new M.LaggedStart(
      alwaysBSegments.map(segment =>
        new M.Create(segment)
      ),
      {
        lagRatio: 0.10,
        runTime: 1.50
      }
    )
  );

  alwaysBSegments.forEach(
    (segment, k) => {
      slots.set(
        `alwaysB${k}`,
        segment
      );
    }
  );

  await play(
    quick(
      replace(
        'endpointB',
        curveEndpoint(
          ALWAYS_B,
          B,
          '0.00',
          0.27
        )
      ),
      0.25
    )
  );

  // ------------------------------------------------------------
  // 47: illustrative learning curve becomes flatter
  //
  // The first five choices match the narrated UCB example.
  // The later choices illustrate increasingly frequent B choices.
  // This is not claimed to be a newly executed UCB simulation.
  // ------------------------------------------------------------

  await until(S(47));

  const learningSegments =
    curveSegments(
      LEARNING_CHOICES,
      REGRET,
      5
    );

  const learningRegrets =
    cumulativeRegrets(
      LEARNING_CHOICES
    );

  const finalLearningRegret =
    learningRegrets[
      learningRegrets.length - 1
    ];

  await play(
    ...say('SUCCESSFUL LEARNING SLOWS REGRET GROWTH', REGRET),
    ...fbox(
      [
        ['Illustrative learning sequence', C.muted],
        'Try both prompts initially.',
        'Discover that B works better.',
        ['Choose B more often.', B],
        ['The regret line flattens.', REGRET]
      ],
      REGRET
    )
  );

  await play(
    new M.LaggedStart(
      learningSegments.map(segment =>
        new M.Create(segment)
      ),
      {
        lagRatio: 0.15,
        runTime: 2.50
      }
    )
  );

  learningSegments.forEach(
    (segment, k) => {
      slots.set(
        `learning${k}`,
        segment
      );
    }
  );

  await play(
    quick(
      [
        ...replace(
          'endpointLearning',
          curveEndpoint(
            LEARNING_CHOICES,
            REGRET,
            fmt(finalLearningRegret),
            0.42
          )
        ),
        ...replace(
          'learningFocus',
          learningCurveFocus()
        )
      ],
      0.30
    )
  );

  // ------------------------------------------------------------
  // 48: compare methods using cumulative regret
  //
  // Also show average regret per choice for the illustrative
  // learning sequence.
  //
  // This is a comparison of expected losses, not actual failures.
  // ------------------------------------------------------------

  await until(S(48));

  const earlyAverage =
    learningRegrets[5] / 5;

  const laterAverage =
    finalLearningRegret / 20;

  await play(
    ...clear('learningFocus'),
    ...say('COMPARE HOW WELL METHODS LEARN', REGRET),
    ...fbox(
      [
        ['After twenty choices', C.ink],
        ['Always A: regret 4.00', A],
        [
          `Illustrative learning: ${fmt(finalLearningRegret)}`,
          REGRET
        ],
        ['Always B: regret 0.00', B],
        'Lower regret means less expected loss.'
      ],
      REGRET
    )
  );

  await until(S(48) + 2.40);

  await play(
    ...fbox(
      [
        ['Average regret per choice', REGRET],
        [`After 5: 0.60 ÷ 5 = ${fmt(earlyAverage)}`, C.ink],
        [
          `After 20: ${fmt(finalLearningRegret)} ÷ 20 = ${fmt(laterAverage)}`,
          GOOD
        ],
        'Learning can reduce',
        'the average loss per choice.'
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 49: regret measures expected loss, not actual failures
  // ------------------------------------------------------------

  await until(S(49));

  await play(
    ...clearExcept('box'),
    ...replace(
      'failureComparison',
      failureComparison()
    ),
    ...say('REGRET IS NOT THE NUMBER OF FAILURES', LOSS),
    ...fbox(
      [
        ['Recall choices 1 and 2', C.ink],
        ['A returns, but regret = 0.20', A],
        ['B fails, but regret = 0.00', B],
        'Regret compares expectations,',
        'not the observed outcomes.'
      ],
      LOSS
    )
  );

  // ------------------------------------------------------------
  // 50: simulations can know the true rates
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    ...clear('failureComparison'),
    ...replace(
      'knowledge',
      knowledgePicture(true)
    ),
    ...say('THE SIMULATOR KNOWS THE TRUE RATES', REGRET),
    ...fbox(
      [
        ['Simulator settings', REGRET],
        ['A: true rate = 50%', A],
        ['B: true rate = 70%', B],
        'We set these probabilities.',
        'We can calculate true regret.'
      ],
      REGRET
    )
  );

  // ------------------------------------------------------------
  // 51: real apps normally do not know the true rates
  // ------------------------------------------------------------

  await until(S(51));

  await play(
    ...replace(
      'knowledge',
      knowledgePicture(false)
    ),
    ...say('REAL APPS DO NOT KNOW THE TRUE RATES'),
    ...fbox(
      [
        ['In a real study app', C.ink],
        'The true rates are unknown.',
        'We observe chosen rewards.',
        'We learn estimates from them.'
      ],
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 52: true regret cannot usually be measured directly
  // ------------------------------------------------------------

  await until(S(52));

  await play(
    ...say('TRUE REGRET IS USUALLY UNKNOWN', LOSS),
    ...fbox(
      [
        ['True regret needs true rates.', LOSS],
        'The real app has estimates,',
        'not the exact probabilities.',
        ['We cannot normally measure', C.ink],
        ['true regret directly.', C.ink]
      ],
      LOSS
    )
  );

  // ------------------------------------------------------------
  // 53: final recap
  //
  // Restore the exact five-choice cumulative-regret graph.
  //
  // 0 → 0.20 → 0.20 → 0.40 → 0.60 → 0.60
  // ------------------------------------------------------------

  await until(S(53));

  const finalValues =
    cumulativeRegrets(CHOICES);

  const finalGraphParts = [
    graphPoint(0, 0)
  ];

  for (let k = 1; k <= 5; k++) {
    finalGraphParts.push(
      graphSegment(
        k,
        finalValues[k - 1],
        finalValues[k],
        5,
        GMAX5,
        REGRET,
        4
      ),
      graphPoint(
        k,
        finalValues[k]
      ),
      graphChoiceTag(
        k,
        CHOICES[k - 1]
      )
    );
  }

  finalGraphParts.push(
    graphValueLabel(
      5,
      finalValues[5],
      5,
      GMAX5,
      REGRET
    )
  );

  await play(
    ...clearExcept('box'),
    ...replace(
      'finalAxes',
      graphAxes(
        5,
        GMAX5,
        [0, 1, 2, 3, 4, 5],
        [0, 0.2, 0.4, 0.6, 0.8]
      )
    ),
    ...replace(
      'finalGraph',
      new M.VGroup(
        ...finalGraphParts
      )
    ),
    ...say('CUMULATIVE REGRET', REGRET),
    ...fbox(
      [
        ['For each choice:', C.ink],
        ['Best fixed expected reward', B],
        ['− chosen expected reward', C.cyan],
        ['= regret', LOSS],
        ['Keep adding these losses.', REGRET]
      ],
      REGRET
    )
  );

  await until(S(53) + 2.40);

  await play(
    ...say('ADD THE EXPECTED REWARDS WE LOSE', REGRET),
    ...fbox(
      [
        ['Our five choices', C.ink],
        ['A, B, A, A, B', C.cyan],
        ['0.20 + 0 + 0.20 + 0.20 + 0', LOSS],
        ['Cumulative regret = 0.60', REGRET]
      ],
      REGRET
    )
  );

  await until(S(53) + 4.65);

  await play(
    ...say('COMPARE WITH THE BEST FIXED CHOICE', REGRET),
    ...fbox(
      [
        ['CUMULATIVE REGRET', REGRET],
        'Total expected reward lost',
        'compared with always making',
        'the best fixed choice.',
        ['Expected loss, not actual failure.', LOSS]
      ],
      REGRET
    )
  );

  await until(E(53));
}

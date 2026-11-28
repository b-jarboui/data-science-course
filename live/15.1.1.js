// lesson 15.1.1
// Bandit feedback: we only see what we choose.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine API; browser rendering has not been independently tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ------------------------------------------------------------
  // Layout: laptop and phone
  // ------------------------------------------------------------

  const A = C.cyan;
  const B = C.orange || '#FB923C';
  const GOOD = C.green;
  const BAD = C.muted;
  const UNKNOWN = C.muted;
  const DARK = '#17212F';

  const CX = P ? 0 : -2.35;
  const AX = CX + (P ? -0.5 : -0.65);
  const BX = CX + (P ? 2.25 : 2.05);
  const LX = CX - (P ? 3.0 : 2.95);

  const CARD_Y = P ? 2.55 : 0.95;
  const CARD_W = P ? 2.6 : 2.48;
  const CARD_H = P ? 1.75 : 1.35;

  const ROW_Y = P ? [0.6, -1.0, -2.6] : [-0.28, -1.16, -2.04];

  const PILL = P ? [0, 4.1, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, -5.0, 0] : [4.35, -0.65, 0];

  const BOX_W = P ? Math.min(FW - 1.0, 7.0) : 4.05;
  const BOX_H = P ? 2.7 : 3.2;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const promptX = p => p === 'A' ? AX : BX;
  const promptColor = p => p === 'A' ? A : B;

  const cell = (p, k) => [promptX(p), ROW_Y[k], 0];

  // Fixed narrated example. Each prompt has its own reward sequence.
  // No reward is consumed or revealed for an unchosen prompt.

  const REWARDS = {
    A: [1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    B: [0, 1, 1, 1, 0, 1, 1, 1, 1, 0]
  };

  const counts = { A: 0, B: 0 };
  const totals = { A: 0, B: 0 };

  function observe(p) {
    const r = REWARDS[p][counts[p]];
    counts[p]++;
    totals[p] += r;
    return r;
  }

  // ------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------

  function txt(s, size, color, x, y, maxw = Infinity, mono = false) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(x, y, w, h, color, fill = C.card, opacity = 0.95,
                radius = 0.14, strokeWidth = 2) {
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

  function circle(x, y, radius, color, fill = color, opacity = 1) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    c.setFill(fill, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function line(x1, y1, x2, y2, color, strokeWidth = 2) {
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

  function glow(x, y, radius, color) {
    const outer = new M.Dot({
      point: [x, y, 0],
      radius: radius * 1.9,
      color
    });

    outer.setFill(color, 0.12);

    const inner = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    inner.setFill(color, 0.95);

    return new M.VGroup(outer, inner);
  }

  function check(x, y, color = C.ink, scale = 1) {
    return new M.VGroup(
      line(
        x - 0.12 * scale,
        y,
        x - 0.035 * scale,
        y - 0.085 * scale,
        color,
        3
      ),
      line(
        x - 0.035 * scale,
        y - 0.085 * scale,
        x + 0.14 * scale,
        y + 0.12 * scale,
        color,
        3
      )
    );
  }

  function cross(x, y, color = C.ink, scale = 1) {
    return new M.VGroup(
      line(
        x - 0.095 * scale,
        y - 0.095 * scale,
        x + 0.095 * scale,
        y + 0.095 * scale,
        color,
        3
      ),
      line(
        x - 0.095 * scale,
        y + 0.095 * scale,
        x + 0.095 * scale,
        y - 0.095 * scale,
        color,
        3
      )
    );
  }

  // ------------------------------------------------------------
  // Study app and prompt icons
  // ------------------------------------------------------------

  function quizIcon(x, y, color = A) {
    const paper = rect(
      x, y, 0.43, 0.48,
      color, color, 0.08, 0.045, 2
    );

    const q = txt('?', 21, color, x, y + 0.025);

    const foot = line(
      x - 0.105, y - 0.145,
      x + 0.105, y - 0.145,
      color, 2
    );

    return new M.VGroup(paper, q, foot);
  }

  function reminderIcon(x, y, color = B) {
    const shell = rect(
      x, y + 0.015, 0.36, 0.36,
      color, color, 0.12, 0.14, 2
    );

    const rim = line(
      x - 0.24, y - 0.145,
      x + 0.24, y - 0.145,
      color, 3
    );

    const clapper = circle(
      x, y - 0.225, 0.045,
      color, color, 1
    );

    const rays = [
      line(x - 0.29, y + 0.08, x - 0.34, y + 0.18, color, 2),
      line(x + 0.29, y + 0.08, x + 0.34, y + 0.18, color, 2)
    ];

    return new M.VGroup(shell, rim, clapper, ...rays);
  }

  function appPicture() {
    const x = 0;
    const y = P ? -0.6 : -0.45;

    const w = P ? 3.6 : 2.65;
    const h = P ? 6.6 : 3.65;

    const body = rect(
      x, y, w, h,
      C.ink, C.card, 1, 0.25, 3
    );

    const header = rect(
      x, y + h / 2 - 0.58,
      w - 0.35, 0.72,
      A, A, 0.13, 0.12, 1
    );

    const title = txt(
      'Study app',
      P ? 28 : 24,
      A,
      x,
      y + h / 2 - 0.58
    );

    const bookY = y + (P ? 0.35 : 0.15);

    const leftPage = rect(
      x - 0.36, bookY,
      0.66, 0.95,
      A, A, 0.16, 0.055, 2
    );

    const rightPage = rect(
      x + 0.36, bookY,
      0.66, 0.95,
      A, A, 0.16, 0.055, 2
    );

    const pageLines = [];

    for (let j = 0; j < 3; j++) {
      const yy = bookY + 0.23 - j * 0.21;

      pageLines.push(
        line(x - 0.57, yy, x - 0.16, yy, A, 2),
        line(x + 0.16, yy, x + 0.57, yy, A, 2)
      );
    }

    const spine = line(
      x, bookY - 0.5,
      x, bookY + 0.5,
      A, 3
    );

    const studyButton = rect(
      x, y - h / 2 + 0.72,
      w - 0.65, 0.58,
      A, A, 0.22, 0.12, 2
    );

    const buttonText = txt(
      'Study today',
      P ? 22 : 19,
      C.ink,
      x,
      y - h / 2 + 0.72
    );

    return new M.VGroup(
      body,
      header,
      title,
      leftPage,
      rightPage,
      spine,
      ...pageLines,
      studyButton,
      buttonText
    );
  }

  const app = appPicture();

  function promptCard(p) {
    const x = promptX(p);
    const color = promptColor(p);

    const bg = rect(
      x, CARD_Y,
      CARD_W, CARD_H,
      color, color, 0.07, 0.16, 2
    );

    const iconY = CARD_Y + 0.27;

    const icon = p === 'A'
      ? quizIcon(x - 0.8, iconY, color)
      : reminderIcon(x - 0.8, iconY, color);

    const heading = txt(
      `PROMPT ${p}`,
      P ? 20 : 19,
      color,
      x + 0.34,
      iconY,
      CARD_W - 1.25,
      true
    );

    return new M.VGroup(bg, icon, heading);
  }

  const cardA = promptCard('A');
  const cardB = promptCard('B');

  function message(p) {
    const x = promptX(p);

    const lines = p === 'A'
      ? ['Try a quick', 'quiz!']
      : ['Time for more', 'practice!'];

    return new M.VGroup(
      txt(
        lines[0],
        P ? 20 : 18,
        C.ink,
        x,
        CARD_Y - 0.13,
        CARD_W - 0.3
      ),
      txt(
        lines[1],
        P ? 20 : 18,
        C.ink,
        x,
        CARD_Y - 0.43,
        CARD_W - 0.3
      )
    );
  }

  const msgA = message('A');
  const msgB = message('B');

  // ------------------------------------------------------------
  // Learner rows, chosen actions and observed rewards
  // ------------------------------------------------------------

  function learner(k) {
    const y = ROW_Y[k];
    const r = P ? 0.15 : 0.12;

    const dot = glow(LX, y + 0.16, r, C.ink);

    const label = txt(
      `Learner ${k + 1}`,
      P ? 17 : 14,
      C.ink,
      LX,
      y - 0.24,
      1.55
    );

    return new M.VGroup(dot, label);
  }

  function rowGuide(k) {
    const y = ROW_Y[k] - (P ? 0.54 : 0.40);

    return line(
      LX - 0.7, y,
      BX + CARD_W / 2, y,
      C.muted, 1
    );
  }

  const learners = [0, 1, 2].map(learner);
  const guides = [0, 1, 2].map(rowGuide);

  function selected(p, k) {
    const [x, y] = cell(p, k);
    const color = promptColor(p);

    const outline = rect(
      x, y,
      P ? 1.72 : 1.58,
      P ? 0.73 : 0.65,
      color, color, 0.12, 0.14, 3
    );

    const label = txt(
      'SHOWN',
      P ? 19 : 17,
      color,
      x,
      y,
      1.4,
      true
    );

    return new M.VGroup(outline, label);
  }

  function rewardMark(p, k, result, numeric = true) {
    const [x, y] = cell(p, k);

    return rewardAt(x, y, result, numeric);
  }

  function rewardAt(x, y, result, numeric = true) {
    const r = P ? 0.29 : 0.245;

    // An unobserved result has no numerical value.
    if (result === null) {
      const disk = circle(
        x, y, r,
        UNKNOWN, DARK, 1
      );

      const mark = txt(
        '?',
        P ? 26 : 24,
        UNKNOWN,
        x, y,
        r * 1.65,
        true
      );

      return new M.VGroup(disk, mark);
    }

    const color = result === 1 ? GOOD : BAD;
    const iconX = numeric ? x - 0.19 : x;

    const halo = new M.Dot({
      point: [iconX, y, 0],
      radius: r * 1.35,
      color
    });

    halo.setFill(color, result === 1 ? 0.13 : 0.06);

    const disk = circle(
      iconX, y, r,
      color, color,
      result === 1 ? 0.28 : 0.24
    );

    const symbol = result === 1
      ? check(iconX, y, GOOD, P ? 1.15 : 1)
      : cross(iconX, y, BAD, P ? 1.15 : 1);

    const parts = [halo, disk, symbol];

    if (numeric) {
      parts.push(
        txt(
          String(result),
          P ? 28 : 24,
          color,
          x + 0.33,
          y,
          0.45,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Outline drawn from coordinates, not from an on-screen object.
  function rewardOutline(p, k, color) {
    const [x, y] = cell(p, k);

    return rect(
      x, y,
      P ? 1.52 : 1.4,
      P ? 0.85 : 0.72,
      color, color, 0.025, 0.14, 2
    );
  }

  // ------------------------------------------------------------
  // Replaceable formula / explanation box
  // ------------------------------------------------------------

  let boxNow = null;

  function replaceBox(g) {
    const animations = [];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    if (g) {
      animations.push(new M.FadeIn(g));
    }

    return animations;
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.40 : 0.41;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const naturalW = Math.max(...widths) + 0.65;
    const wd = Math.min(naturalW, BOX_W);
    const ht = rows.length * lh + 0.48;

    const r = rect(
      BOXP[0], BOXP[1],
      wd, ht,
      color, C.card, 0.96, 0.18, 2
    );

    const left = BOXP[0] - wd / 2 + 0.28;
    const top = BOXP[1] + ht / 2 - 0.24 - lh / 2;

    texts.forEach((t, i) => {
      const ind =
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

      const available = wd - 0.56 - ind;

      if (t.getWidth() > available) {
        t.scale(available / t.getWidth());
      }

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    return replaceBox(new M.VGroup(r, ...texts));
  }

  function rewardLegend(stage) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const bg = rect(
      x, y, w, 2.0,
      C.violet, C.card, 0.96, 0.18, 2
    );

    const heading = txt(
      stage >= 3 ? 'REWARD' : 'RECORD THE RESULT',
      P ? 22 : 20,
      C.violet,
      x,
      y + 0.67,
      w - 0.4,
      true
    );

    const parts = [bg, heading];

    if (stage >= 1) {
      parts.push(
        rewardAt(x - w / 2 + 0.88, y + 0.06, 1, false),
        txt(
          'Returns',
          P ? 20 : 18,
          C.ink,
          x - 0.03,
          y + 0.06,
          w * 0.43
        ),
        txt(
          '1',
          P ? 27 : 25,
          GOOD,
          x + w / 2 - 0.55,
          y + 0.06,
          0.45,
          true
        )
      );
    }

    if (stage >= 2) {
      parts.push(
        rewardAt(x - w / 2 + 0.88, y - 0.57, 0, false),
        txt(
          'Does not return',
          P ? 20 : 18,
          C.ink,
          x + 0.1,
          y - 0.57,
          w * 0.42
        ),
        txt(
          '0',
          P ? 27 : 25,
          BAD,
          x + w / 2 - 0.55,
          y - 0.57,
          0.45,
          true
        )
      );
    }

    return replaceBox(new M.VGroup(...parts));
  }

  // ------------------------------------------------------------
  // Return-rate bars
  // ------------------------------------------------------------

  function rateBar(x, y, w, fraction, color) {
    const h = P ? 0.17 : 0.21;

    const track = new M.Rectangle({
      width: w,
      height: h,
      color: C.muted,
      strokeWidth: 1
    });

    track.setFill(C.muted, 0.12);
    track.moveTo([x, y, 0]);

    const parts = [track];

    if (fraction > 0) {
      const filledW = w * fraction;

      const fill = new M.Rectangle({
        width: filledW,
        height: h,
        color,
        strokeWidth: 1
      });

      fill.setFill(color, 0.9);
      fill.moveTo([
        x - w / 2 + filledW / 2,
        y,
        0
      ]);

      parts.push(fill);
    } else {
      // A visible zero marker, without pretending there is a fill.
      const zero = line(
        x - w / 2, y - h / 2 - 0.035,
        x - w / 2, y + h / 2 + 0.035,
        color, 3
      );

      parts.push(zero);
    }

    return new M.VGroup(...parts);
  }

  function ratePanel(stage) {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;
    const h = BOX_H;

    const bg = rect(
      x, y, w, h,
      C.cyan, C.card, 0.96, 0.18, 2
    );

    const parts = [bg];

    const top = y + h / 2 - 0.29;

    parts.push(
      txt(
        stage >= 5 ? 'RETURN RATE ESTIMATES' : 'RESULTS SO FAR',
        P ? 21 : 19,
        C.cyan,
        x,
        top,
        w - 0.4,
        true
      )
    );

    const ay = P ? y + 0.31 : y + 0.61;
    const by = P ? y - 0.47 : y - 0.64;

    const aRate = totals.A / counts.A;
    const bRate = totals.B / counts.B;

    const left = x - w / 2 + 0.36;
    const right = x + w / 2 - 0.36;

    const barW = w - 0.78;

    const aName = T('A', P ? 22 : 21, A, true);
    aName.moveTo([left + aName.getWidth() / 2, ay, 0]);

    const aFraction = txt(
      `${totals.A} return / ${counts.A} shown`,
      P ? 19 : 18,
      A,
      x - 0.12,
      ay,
      w - 1.65,
      true
    );

    parts.push(aName, aFraction);

    if (stage >= 2) {
      parts.push(
        rateBar(x, ay - 0.31, barW, aRate, A)
      );
    }

    if (stage >= 3) {
      const aPct = T(
        `${Math.round(aRate * 100)}%`,
        P ? 25 : 23,
        A,
        true
      );

      aPct.moveTo([
        right - aPct.getWidth() / 2,
        ay,
        0
      ]);

      parts.push(aPct);
    } else if (stage === 2) {
      const half = T('Half', P ? 19 : 17, A);

      half.moveTo([
        right - half.getWidth() / 2,
        ay,
        0
      ]);

      parts.push(half);
    }

    if (stage === 2) {
      parts.push(
        txt('1 of 2 learners returned', P ? 20 : 18, A, x, by + 0.2, w - 0.55),
        txt('B is counted next', P ? 18 : 16, C.muted, x, by - 0.2, w - 0.55)
      );
    }

    if (stage === 3) {
      parts.push(
        txt('50 out of every 100', P ? 22 : 21, A, x, by + 0.2, w - 0.55),
        txt('B is counted next', P ? 18 : 16, C.muted, x, by - 0.2, w - 0.55)
      );
    }

    if (stage >= 4) {
      const bName = T('B', P ? 22 : 21, B, true);

      bName.moveTo([
        left + bName.getWidth() / 2,
        by,
        0
      ]);

      const bFraction = txt(
        `${totals.B} returns / ${counts.B} shown`,
        P ? 19 : 18,
        B,
        x - 0.12,
        by,
        w - 1.65,
        true
      );

      const bPct = T(
        `${Math.round(bRate * 100)}%`,
        P ? 25 : 23,
        B,
        true
      );

      bPct.moveTo([
        right - bPct.getWidth() / 2,
        by,
        0
      ]);

      parts.push(
        bName,
        bFraction,
        bPct,
        rateBar(x, by - 0.31, barW, bRate, B)
      );
    }

    if (stage === 1) {
      parts.push(
        txt('Count only learners', P ? 19 : 18, C.muted, x, by + 0.2, w - 0.4),
        txt('who received A', P ? 19 : 18, C.muted, x, by - 0.2, w - 0.4)
      );
    }

    return replaceBox(new M.VGroup(...parts));
  }

  // ------------------------------------------------------------
  // Zero versus unknown comparison
  // ------------------------------------------------------------

  function comparisonBox() {
    const x = BOXP[0];
    const y = BOXP[1];
    const w = BOX_W;

    const bg = rect(
      x, y,
      w, 2.05,
      C.amber, C.card, 0.96, 0.18, 2
    );

    const heading = txt(
      '0 IS NOT ?',
      P ? 25 : 23,
      C.amber,
      x,
      y + 0.7,
      w - 0.4,
      true
    );

    const divider = line(
      x, y + 0.35,
      x, y - 0.78,
      C.muted, 1
    );

    const leftX = x - w / 4;
    const rightX = x + w / 4;

    const zero = rewardAt(leftX, y + 0.04, 0, true);
    const missing = rewardAt(rightX, y + 0.04, null);

    const a = txt(
      'Observed',
      P ? 20 : 18,
      C.ink,
      leftX,
      y - 0.45,
      w / 2 - 0.3
    );

    const b = txt(
      'Not observed',
      P ? 20 : 18,
      C.ink,
      rightX,
      y - 0.45,
      w / 2 - 0.3
    );

    const a2 = txt(
      'Did not return',
      P ? 17 : 15,
      C.muted,
      leftX,
      y - 0.75,
      w / 2 - 0.3
    );

    const b2 = txt(
      'Never shown',
      P ? 17 : 15,
      C.muted,
      rightX,
      y - 0.75,
      w / 2 - 0.3
    );

    return replaceBox(
      new M.VGroup(
        bg,
        heading,
        divider,
        zero,
        missing,
        a,
        b,
        a2,
        b2
      )
    );
  }

  // ------------------------------------------------------------
  // 0-1: a study app wants learners to return tomorrow
  // ------------------------------------------------------------

  await until(S(0));
  await play(
    new M.FadeIn(app),
    ...say('A STUDY APP')
  );

  const tomorrow = pill('RETURN TOMORROW', GOOD, P ? 22 : 19);

  tomorrow.moveTo(
    P ? [0, -5.0, 0] : [3.6, -0.45, 0]
  );

  await until(S(1));
  await play(
    new M.FadeIn(tomorrow),
    ...say('GOAL: MORE LEARNERS RETURN', GOOD)
  );

  // ------------------------------------------------------------
  // 2-6: the two prompts
  // ------------------------------------------------------------

  await until(S(2));
  await play(
    new M.FadeOut(app),
    new M.FadeOut(tomorrow),
    new M.LaggedStart(
      [
        new M.FadeIn(cardA),
        new M.FadeIn(cardB)
      ],
      {
        lagRatio: 0.2,
        runTime: 0.9
      }
    ),
    ...(P ? fbox([['TWO MESSAGES', C.cyan], ['A: ...', A], ['B: ...', B]], C.cyan) : []),
    ...say('TWO POSSIBLE MESSAGES')
  );

  await until(S(3));
  await play(
    new M.FadeIn(msgA),
    new M.Indicate(cardA, { color: A }),
    ...(P ? fbox([['TWO MESSAGES', C.cyan], ['A: a quick quiz', A], ['B: ...', B]], C.cyan) : []),
    ...say('A: A QUICK QUIZ', A)
  );

  await until(S(4));
  await play(
    new M.FadeIn(msgB),
    new M.Indicate(cardB, { color: B }),
    ...(P ? fbox([['TWO MESSAGES', C.cyan], ['A: a quick quiz', A], ['B: a study reminder', B]], C.cyan) : []),
    ...say('B: A STUDY REMINDER', B)
  );

  await until(S(5));
  await play(
    ...(P ? fbox([['PROMPT', C.violet], ['= a message the app', C.ink], ['  shows a learner', C.ink]], C.violet) : []),
    ...say('EACH MESSAGE IS A PROMPT', C.violet)
  );

  await until(S(6));
  await play(
    new M.Indicate(cardA, { color: A }),
    new M.Indicate(cardB, { color: B }),
    ...(P ? fbox([['WHICH WORKS BETTER?', C.amber], ['A: ?', A], ['B: ?', B]], C.amber) : []),
    ...say('WHICH PROMPT WORKS BETTER?', C.amber)
  );

  // ------------------------------------------------------------
  // 7-13: first learner
  // Choose A, observe return; B remains unknown.
  // ------------------------------------------------------------

  await until(S(7));
  await play(
    new M.FadeIn(learners[0]),
    new M.Create(guides[0]),
    ...say('LEARNER 1 ARRIVES')
  );

  const choice1 = selected('A', 0);

  await until(S(8));
  await play(
    new M.FadeIn(choice1),
    new M.Indicate(cardA, { color: A }),
    ...say('THE APP CHOOSES A', A)
  );

  await until(S(9));

  const r1 = observe('A');

  await play(
    new M.Indicate(learners[0], { color: GOOD }),
    ...say('NEXT DAY: LEARNER RETURNS', GOOD)
  );

  let markA1 = rewardMark('A', 0, r1, false);

  await until(S(10));
  await play(
    new M.FadeOut(choice1),
    new M.FadeIn(markA1),
    ...say('A: A RETURN OBSERVED', GOOD)
  );

  await until(S(11));
  await play(
    new M.Indicate(cardB, { color: B }),
    ...say('WOULD B ALSO HAVE WORKED?', C.amber)
  );

  await until(S(12));
  await play(
    ...say('B WAS NEVER SHOWN', C.muted)
  );

  const markB1 = rewardMark('B', 0, null);

  await until(S(13));
  await play(
    new M.FadeIn(markB1),
    ...say('? = UNKNOWN RESULT', C.violet)
  );

  // ------------------------------------------------------------
  // 14-17: two roads to work
  // Temporarily replace the prompt picture with a road analogy.
  // ------------------------------------------------------------

  const tableBeforeRoads = [
    cardA,
    cardB,
    msgA,
    msgB,
    learners[0],
    guides[0],
    markA1,
    markB1
  ];

  const RX0 = P ? -2.75 : -4.5;
  const RX1 = P ? 2.75 : 4.5;

  const RY = P ? -1.4 : -0.55;
  const RUP = P ? 1.4 : 0.65;
  const RDN = P ? -4.3 : -1.75;

  const bendL = RX0 + (P ? 0.85 : 1.4);
  const bendR = RX1 - (P ? 0.85 : 1.4);

  const startDot = glow(RX0, RY, 0.16, C.ink);
  const endDot = glow(RX1, RY, 0.16, GOOD);

  const startLabel = txt(
    'Home',
    P ? 20 : 22,
    C.ink,
    RX0,
    RY - 0.47
  );

  const endLabel = txt(
    'Work',
    P ? 20 : 22,
    GOOD,
    RX1,
    RY - 0.47
  );

  const upper = new M.VGroup(
    line(RX0, RY, bendL, RUP, A, 6),
    line(bendL, RUP, bendR, RUP, A, 6),
    line(bendR, RUP, RX1, RY, A, 6)
  );

  const lower = new M.VGroup(
    dashed(RX0, RY, bendL, RDN, C.muted),
    dashed(bendL, RDN, bendR, RDN, C.muted),
    dashed(bendR, RDN, RX1, RY, C.muted)
  );

  const roadAName = txt(
    'Road 1',
    P ? 21 : 20,
    A,
    0,
    RUP + 0.45
  );

  const roadBName = txt(
    'Road 2',
    P ? 21 : 20,
    C.muted,
    0,
    RDN - 0.42
  );

  const roads = new M.VGroup(
    upper,
    lower,
    startDot,
    endDot,
    startLabel,
    endLabel,
    roadAName,
    roadBName
  );

  const chosenRoad = pill(
    'CHOSEN ROAD',
    A,
    P ? 19 : 17
  );

  chosenRoad.moveTo([
    0,
    RUP - 0.4,
    0
  ]);

  const clockX = P ? -0.42 : -0.55;
  const clockY = RY + 0.03;

  const clock = new M.VGroup(
    circle(clockX, clockY, 0.22, GOOD, GOOD, 0.10),
    line(
      clockX, clockY,
      clockX, clockY + 0.13,
      GOOD, 2
    ),
    line(
      clockX, clockY,
      clockX + 0.10, clockY - 0.04,
      GOOD, 2
    )
  );

  const knownTime = new M.VGroup(
    clock,
    txt(
      'Time known',
      P ? 21 : 20,
      GOOD,
      P ? 0.73 : 0.8,
      clockY,
      P ? 2.0 : 2.5
    )
  );

  const unknownTime = new M.VGroup(
    circle(
      -0.7,
      RDN + 0.43,
      0.22,
      UNKNOWN,
      DARK,
      1
    ),
    txt(
      '?',
      22,
      UNKNOWN,
      -0.7,
      RDN + 0.43,
      0.35,
      true
    ),
    txt(
      'Time unknown',
      P ? 20 : 19,
      C.muted,
      0.75,
      RDN + 0.43,
      2.3
    )
  );

  await until(S(14));
  await play(
    ...tableBeforeRoads.map(o => new M.FadeOut(o)),
    ...replaceBox(null),
    new M.FadeIn(roads),
    ...say('TWO ROADS TO WORK', C.amber)
  );

  await until(S(15));
  await play(
    new M.FadeIn(chosenRoad),
    new M.FadeIn(knownTime),
    new M.Indicate(upper, { color: A }),
    ...say('CHOSEN ROAD: TIME KNOWN', GOOD)
  );

  await until(S(16));
  await play(
    new M.FadeIn(unknownTime),
    new M.Indicate(lower, { color: C.muted }),
    ...say('OTHER ROAD: TIME UNKNOWN', C.muted)
  );

  await until(S(17));
  await play(
    new M.FadeOut(roads),
    new M.FadeOut(chosenRoad),
    new M.FadeOut(knownTime),
    new M.FadeOut(unknownTime),
    ...tableBeforeRoads.map(o => new M.FadeIn(o)),
    ...(P ? fbox([['SAME PROBLEM', C.cyan], ['Chosen prompt: result seen', A], ['Other prompt: unknown', C.muted]], C.cyan) : []),
    ...say('THE STUDY APP HAS THE SAME PROBLEM')
  );

  // ------------------------------------------------------------
  // 18-19: name the concept
  // ------------------------------------------------------------

  await until(S(18));
  await play(
    new M.Indicate(markA1, { color: GOOD }),
    ...say('FEEDBACK = THE OBSERVED RESULT', GOOD)
  );

  const observedOutline = rewardOutline('A', 0, A);
  const missingOutline = rewardOutline('B', 0, C.muted);

  await until(S(19));
  await play(
    new M.Create(observedOutline),
    new M.Create(missingOutline),
    ...say('BANDIT FEEDBACK: ONLY OUR CHOICE', C.violet),
    ...fbox(
      [
        ['Chosen prompt', A],
        ['Result observed', GOOD],
        ['Other prompt', B],
        ['Result unknown', C.muted]
      ],
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 20-24: encode observed outcomes as numerical rewards
  // ------------------------------------------------------------

  await until(S(20));
  await play(
    new M.FadeOut(observedOutline),
    new M.FadeOut(missingOutline),
    ...rewardLegend(0),
    ...say('RECORD EACH OBSERVED RESULT')
  );

  await until(S(21));
  await play(
    ...rewardLegend(1),
    ...say('RETURNS = 1', GOOD)
  );

  await until(S(22));
  await play(
    ...rewardLegend(2),
    ...say('DOES NOT RETURN = 0', C.muted)
  );

  await until(S(23));
  await play(
    ...rewardLegend(3),
    ...say('REWARD = THE RECORDED NUMBER', C.violet)
  );

  await until(S(24));

  const markA1Number = rewardMark('A', 0, r1, true);

  await play(
    new M.FadeOut(markA1),
    new M.FadeIn(markA1Number),
    ...say('LEARNER 1: A RECEIVES REWARD 1', GOOD)
  );

  markA1 = markA1Number;

  // ------------------------------------------------------------
  // 25-29: second learner
  // Choose B, observe non-return; A remains unknown.
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    new M.FadeIn(learners[1]),
    new M.Create(guides[1]),
    ...say('LEARNER 2 ARRIVES')
  );

  const choice2 = selected('B', 1);

  await until(S(26));
  await play(
    new M.FadeIn(choice2),
    new M.Indicate(cardB, { color: B }),
    ...say('THE APP CHOOSES B', B)
  );

  await until(S(27));

  const r2 = observe('B');

  await play(
    new M.Indicate(learners[1], { color: BAD }),
    ...say('NEXT DAY: DOES NOT RETURN', C.muted)
  );

  const markB2 = rewardMark('B', 1, r2, true);

  await until(S(28));
  await play(
    new M.FadeOut(choice2),
    new M.FadeIn(markB2),
    ...say('LEARNER 2: B RECEIVES REWARD 0', B)
  );

  const markA2 = rewardMark('A', 1, null);

  await until(S(29));
  await play(
    new M.FadeIn(markA2),
    ...say('A WAS NOT SHOWN: RESULT UNKNOWN', C.muted)
  );

  // ------------------------------------------------------------
  // 30-34: third learner
  // Choose A, observe non-return; B remains unknown.
  // ------------------------------------------------------------

  await until(S(30));
  await play(
    new M.FadeIn(learners[2]),
    new M.Create(guides[2]),
    ...say('LEARNER 3 ARRIVES')
  );

  const choice3 = selected('A', 2);

  await until(S(31));
  await play(
    new M.FadeIn(choice3),
    new M.Indicate(cardA, { color: A }),
    ...say('THE APP CHOOSES A AGAIN', A)
  );

  await until(S(32));

  const r3 = observe('A');

  await play(
    new M.Indicate(learners[2], { color: BAD }),
    ...say('NEXT DAY: DOES NOT RETURN', C.muted)
  );

  const markA3 = rewardMark('A', 2, r3, true);

  await until(S(33));
  await play(
    new M.FadeOut(choice3),
    new M.FadeIn(markA3),
    ...say('LEARNER 3: A RECEIVES REWARD 0', A)
  );

  const markB3 = rewardMark('B', 2, null);

  await until(S(34));
  await play(
    new M.FadeIn(markB3),
    ...fbox(
      [
        ['3 learners', C.ink],
        ['3 observed results', GOOD],
        ['3 unknown results', C.muted]
      ],
      C.cyan
    ),
    ...say('THREE LEARNERS, THREE CHOICES')
  );

  // ------------------------------------------------------------
  // 35-39: observed return rates
  // A = 1 return from 2 choices.
  // B = 0 returns from 1 choice.
  // Unknown outcomes are never counted as zeros.
  // ------------------------------------------------------------

  const a1Outline = rewardOutline('A', 0, A);
  const a3Outline = rewardOutline('A', 2, A);

  await until(S(35));
  await play(
    new M.Create(a1Outline),
    new M.Create(a3Outline),
    ...ratePanel(1),
    ...say('A: 1 RETURN FROM 2 LEARNERS', A)
  );

  await until(S(36));
  await play(
    ...ratePanel(2),
    ...say('A: HALF OF ITS LEARNERS RETURN', A)
  );

  await until(S(37));
  await play(
    ...ratePanel(3),
    ...say('HALF = 50 OUT OF EVERY 100', A)
  );

  const b2Outline = rewardOutline('B', 1, B);

  await until(S(38));
  await play(
    new M.FadeOut(a1Outline),
    new M.FadeOut(a3Outline),
    new M.Create(b2Outline),
    ...ratePanel(4),
    ...say('B: 0 RETURNS FROM 1 LEARNER', B)
  );

  await until(S(39));
  await play(
    new M.FadeOut(b2Outline),
    ...ratePanel(5),
    ...say('RETURN RATE = SHARE WHO RETURN', C.green)
  );

  // ------------------------------------------------------------
  // 40-43: the return-rate formula and estimates
  // ------------------------------------------------------------

  await until(S(40));
  await play(
    ...fbox(
      [
        ['For each prompt:', C.cyan],
        ['A: 1 return, 2 shown', A],
        ['B: 0 returns, 1 shown', B]
      ],
      C.cyan
    ),
    ...say('CALCULATE EACH PROMPT SEPARATELY')
  );

  await until(S(41));
  await play(
    ...fbox(
      [
        ['return rate =', C.ink],
        ['  returns ÷ learners shown', C.cyan],
        ['A: 1 ÷ 2 = 50%', A],
        ['B: 0 ÷ 1 = 0%', B]
      ],
      C.cyan
    ),
    ...say('RETURNS DIVIDED BY LEARNERS SHOWN', C.cyan)
  );

  await until(S(42));
  await play(
    ...ratePanel(5),
    ...say('ESTIMATES = OUR BEST ANSWERS SO FAR', C.violet)
  );

  await until(S(43));
  await play(
    new M.Indicate(cardA, { color: A }),
    new M.Indicate(cardB, { color: B }),
    ...say('ESTIMATES GUIDE THE NEXT CHOICE', C.green)
  );

  // ------------------------------------------------------------
  // 44-46: an unknown reward is not a reward of zero
  // ------------------------------------------------------------

  const zeroOutline = rewardOutline('A', 2, C.amber);
  const questionOutline = rewardOutline('B', 2, C.amber);

  await until(S(44));
  await play(
    new M.Create(zeroOutline),
    new M.Create(questionOutline),
    ...comparisonBox(),
    ...say('A QUESTION MARK IS NOT ZERO', C.amber)
  );

  await until(S(45));
  await play(
    new M.Indicate(markA3, { color: BAD }),
    ...say('0: PROMPT SHOWN, NO RETURN', C.muted)
  );

  await until(S(46));
  await play(
    new M.Indicate(markB3, { color: C.violet }),
    ...say('?: PROMPT NOT SHOWN, RESULT UNKNOWN', C.violet)
  );

  // ------------------------------------------------------------
  // 47-48: too little evidence; keep trying both prompts
  // ------------------------------------------------------------

  await until(S(47));
  await play(
    new M.FadeOut(zeroOutline),
    new M.FadeOut(questionOutline),
    ...fbox(
      [
        ['Only a few observations', C.amber],
        ['A: 2 choices', A],
        ['B: 1 choice', B],
        ['Not enough evidence yet', C.ink]
      ],
      C.amber
    ),
    ...say('TOO FEW CHOICES TO KNOW FOR SURE', C.amber)
  );

  await until(S(48));
  await play(
    new M.Indicate(cardA, { color: A }),
    new M.Indicate(cardB, { color: B }),
    ...fbox(
      [
        ['Keep learning', C.green],
        ['Try prompt A', A],
        ['Try prompt B', B],
        ['Collect more feedback', C.ink]
      ],
      C.green
    ),
    ...say('NEXT: KEEP TRYING BOTH PROMPTS', C.green)
  );

  // ------------------------------------------------------------
  // 49: final visual summary
  // Highlight only observed outcomes, then unknown outcomes.
  // Each learner contributes exactly one observed reward.
  // ------------------------------------------------------------

  const finalObserved = [
    rewardOutline('A', 0, GOOD),
    rewardOutline('B', 1, GOOD),
    rewardOutline('A', 2, GOOD)
  ];

  const finalUnknown = [
    rewardOutline('B', 0, C.violet),
    rewardOutline('A', 1, C.violet),
    rewardOutline('B', 2, C.violet)
  ];

  await until(S(49));
  await play(
    new M.LaggedStart(
      finalObserved.map(o => new M.Create(o)),
      {
        lagRatio: 0.15,
        runTime: 1.1
      }
    ),
    ...fbox(
      [
        ['BANDIT FEEDBACK', C.violet],
        ['Chosen → observed', GOOD],
        ['Not chosen → unknown', C.muted]
      ],
      C.violet
    ),
    ...say('WE ONLY SEE WHAT WE CHOOSE', C.cyan)
  );

  await until(S(49) + 2.6);
  await play(
    new M.LaggedStart(
      finalUnknown.map(o => new M.Create(o)),
      {
        lagRatio: 0.15,
        runTime: 1.1
      }
    )
  );

  await until(E(49));
}

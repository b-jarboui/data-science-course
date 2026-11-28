// lesson 5.3.2
// Inverse transform sampling — Chapter 5.3: Simulation and convergence.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed chapter probabilities and the five draws from seed 101.
// Illustrative dart throws are deterministic for repeatable playback.
// Browser rendering has not been tested against the project's live engine.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  // ------------------------------------------------------------

  const U = [0.94, 0.36, 0.78, 0.59, 0.29];
  const D = [0, 10, 20, 30];
  const PROB = [0.4, 0.3, 0.2, 0.1];
  const CUM = [0.4, 0.7, 0.9, 1.0];
  const CUTS = [0, 0.4, 0.7, 0.9, 1.0];

  // A draw exactly on a cut point belongs to the next segment.
  // Uniform draws are in [0, 1).
  const delayOf = u => D[CUM.findIndex(c => u < c)];

  const DELAYS = U.map(delayOf);
  const TOTAL = DELAYS.reduce((a, b) => a + b, 0);
  const MEAN = TOTAL / DELAYS.length;

  const DC = [
    C.teal || '#2DD4BF',
    C.blue || '#60A5FA',
    C.amber,
    C.red || '#F87171'
  ];

  const delayColor = d => DC[d / 10];
  const fmt = v => v.toFixed(2);
  const probFmt = v => v.toFixed(1);

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22, content between y = -5.5 and 4.3.
  // Laptop: 14.22 x 8, content between y = -3.0 and 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, -0.3, 0];

  const MAX_W = P ? FW - 1.2 : 7.2;

  const RW = P ? 6.20 : 7.20;
  const RY = P ? -0.15 : -0.12;
  const RH = P ? 0.55 : 0.58;

  const ux = v => CX - RW / 2 + v * RW;

  const CELL_W = P ? 1.06 : 1.14;
  const CELL_H = P ? 0.70 : 0.58;
  const CELL_SP = P ? 1.22 : 1.34;

  const INPUT_Y = P ? -2.10 : -1.65;
  const OUTPUT_Y = P ? -3.48 : -2.53;

  const rowX = k => CX + (k - 2) * CELL_SP;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false, maxw = MAX_W
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);
    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted, sw = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function rect(
    w, h, x, y, color,
    opacity = 0.12, sw = 2
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
    w, h, x, y, color,
    fill = C.card, opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function outline(w, h, x, y, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  function arrow(x1, y1, x2, y2, color = C.muted) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const r = 0.13;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),
      line(
        x2, y2,
        x2 - r * Math.cos(a - 0.55),
        y2 - r * Math.sin(a - 0.55),
        color, 2.5
      ),
      line(
        x2, y2,
        x2 - r * Math.cos(a + 0.55),
        y2 - r * Math.sin(a + 0.55),
        color, 2.5
      )
    );
  }

  function glowDot(x, y, color = C.cyan, radius = 0.095) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.25,
      color
    });

    halo.setFill(color, 0.16);

    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);

    if (p.getWidth() > MAX_W) {
      p.scale(MAX_W / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function cell(
    s, x, y, color = C.cyan,
    width = CELL_W, height = CELL_H
  ) {
    return new M.VGroup(
      rounded(width, height, x, y, color, color, 0.10),
      txt(
        s,
        P ? 19 : 21,
        color,
        x, y,
        true,
        width - 0.14
      )
    );
  }

  function parcel(x, y, color, w = 0.65, h = 0.43) {
    return new M.VGroup(
      rect(w, h, x, y, color, 0.17),
      rect(w * 0.17, h, x, y, color, 0.55, 1),
      line(
        x - w / 2, y + h * 0.16,
        x + w / 2, y + h * 0.16,
        color, 1
      ),
      rect(
        w * 0.22, h * 0.18,
        x + w * 0.27, y - h * 0.23,
        color, 0.65, 1
      )
    );
  }

  // ------------------------------------------------------------
  // Scene bookkeeping
  //
  // Never wrap already displayed objects in a new VGroup.
  // All groups below are assembled before their first FadeIn.
  // Helpers return animations; only the beat code calls play().
  // ------------------------------------------------------------

  let visible = [];

  function add(...objects) {
    visible.push(...objects);
    return objects.map(o => new M.FadeIn(o));
  }

  function remove(...objects) {
    visible = visible.filter(o => !objects.includes(o));
    return objects.map(o => new M.FadeOut(o));
  }

  function swap(objects) {
    const old = visible.slice();
    visible = objects.slice();

    return [
      ...old.map(o => new M.FadeOut(o)),
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function stagger(objects, runTime = 1.4, lagRatio = 0.12) {
    visible.push(...objects);

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box: follows the approved lesson's card style.
  // Formula box is tracked separately from the main picture.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.35 : 0.42;

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
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.36;

    const r = rounded(
      wd, ht,
      BOXP[0], BOXP[1],
      color
    );

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.18 - lh / 2;

    texts.forEach((t, i) => {
      const ind =
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;

    if (wd > maxw) {
      g.scale(maxw / wd);
    }

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Ruler helpers
  // ------------------------------------------------------------

  function plainRuler(y = RY) {
    const baseline = y - RH / 2;

    const parts = [
      line(
        ux(0), baseline,
        ux(1), baseline,
        C.muted, 3
      )
    ];

    for (let k = 0; k <= 10; k++) {
      const v = k / 10;
      const major = k % 2 === 0;
      const h = major ? 0.105 : 0.055;

      parts.push(
        line(
          ux(v), baseline - h,
          ux(v), baseline + h,
          C.muted, major ? 2 : 1
        )
      );

      if (major) {
        parts.push(
          txt(
            k === 0 ? '0' : k === 10 ? '1' : v.toFixed(1),
            P ? 15 : 17,
            C.muted,
            ux(v), baseline - 0.29,
            true
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function cutMark(v, y = RY, color = C.muted) {
    return new M.VGroup(
      line(
        ux(v), y - RH / 2 - 0.11,
        ux(v), y + RH / 2 + 0.11,
        color, 2
      ),
      txt(
        v === 0 ? '0' : v.toFixed(1),
        P ? 15 : 17,
        color,
        ux(v), y - RH / 2 - 0.31,
        true
      )
    );
  }

  function segment(k, y = RY, cuts = CUTS) {
    const left = cuts[k];
    const right = cuts[k + 1];

    const width = (right - left) * RW;
    const x = ux((left + right) / 2);
    const color = DC[k];

    const b = rect(
      width, RH,
      x, y,
      color, 0.53, 1.5
    );

    const label = txt(
      D[k],
      P ? 19 : 22,
      C.ink,
      x, y,
      true,
      width - 0.10
    );

    return new M.VGroup(b, label);
  }

  function segmentFrame(
    k, y = RY, cuts = CUTS,
    color = C.ink
  ) {
    const left = cuts[k];
    const right = cuts[k + 1];

    return outline(
      (right - left) * RW + 0.055,
      RH + 0.12,
      ux((left + right) / 2),
      y,
      color
    );
  }

  function colouredRuler(y = RY, cuts = CUTS) {
    const parts = [];

    for (let k = 0; k < 4; k++) {
      parts.push(segment(k, y, cuts));
    }

    cuts.forEach(v => {
      const label =
        v === 0 ? '0' :
        v === 1 ? '1' :
        Number(v.toFixed(2)).toString();

      parts.push(
        line(
          ux(v), y - RH / 2 - 0.08,
          ux(v), y + RH / 2 + 0.08,
          C.muted, 1.5
        ),
        txt(
          label,
          P ? 16 : 17,
          C.muted,
          ux(v), y - RH / 2 - 0.30,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function drawMarker(v, color = C.cyan, y = RY) {
    const x = ux(v);
    const dy = y + RH / 2 + 0.38;

    return new M.VGroup(
      arrow(
        x, dy - 0.10,
        x, y + RH / 2 + 0.03,
        color
      ),
      glowDot(x, dy, color, 0.085),
      txt(
        fmt(v),
        P ? 18 : 21,
        color,
        x, dy + 0.33,
        true
      )
    );
  }

  function drawRow(values, y, color = C.cyan) {
    return values.map((v, k) =>
      cell(fmt(v), rowX(k), y, color)
    );
  }

  function delayRow(values, y) {
    return values.map((d, k) =>
      cell(
        `${d} min`,
        rowX(k), y,
        delayColor(d)
      )
    );
  }

  // ============================================================
  // 0–1: Recall the five uniform draws.
  // ============================================================

  const initialRuler = plainRuler();

  const initialDots = U.map((v, k) => {
    const y = RY + 0.38 + (k % 2) * 0.29;

    return new M.VGroup(
      line(
        ux(v), RY - RH / 2 + 0.07,
        ux(v), y,
        C.cyan, 1.5
      ),
      glowDot(ux(v), y, C.cyan)
    );
  });

  const initialDraws = drawRow(U, INPUT_Y);

  const seedNote = tag(
    'SEED 101',
    C.amber,
    CX, P ? 1.25 : 1.13,
    17
  );

  await until(S(0));
  await play(
    ...add(initialRuler, seedNote),
    stagger(initialDots, 1.4, 0.14),
    stagger(initialDraws, 1.4, 0.14),
    ...say('FIVE UNIFORM DRAWS'),
    ...fbox([
      ['seed = 101', C.amber],
      'five numbers in [0, 1)'
    ])
  );

  // 1: These numbers must become parcel delays.
  const initialQuestions = U.map((_, k) =>
    cell('?', rowX(k), OUTPUT_Y, C.amber)
  );

  const initialArrows = U.map((_, k) =>
    arrow(
      rowX(k), INPUT_Y - CELL_H / 2 - 0.03,
      rowX(k), OUTPUT_Y + CELL_H / 2 + 0.03,
      C.muted
    )
  );

  await until(S(1));
  await play(
    ...add(...initialQuestions, ...initialArrows),
    ...say('WE NEED DELAYS, NOT JUST DRAWS', C.amber),
    ...fbox([
      'uniform draw',
      ['     ↓', C.muted],
      ['parcel delay ?', C.amber]
    ], C.amber)
  );

  // ============================================================
  // 2–7: Recall the depot's delay distribution.
  // Start with ten parcel icons, then turn them into four bars.
  // ============================================================

  const BASE = P ? -3.75 : -2.20;
  const BAR_SP = P ? 1.50 : 1.62;
  const BAR_W = P ? 0.96 : 0.98;
  const BLOCK_PITCH = P ? 0.76 : 0.61;

  const barX = k => CX + (k - 1.5) * BAR_SP;

  function barAxes() {
    const axis = line(
      barX(0) - BAR_SP / 2,
      BASE,
      barX(3) + BAR_SP / 2,
      BASE,
      C.muted, 2.5
    );

    const labs = D.map((d, k) =>
      txt(
        `${d} min`,
        P ? 17 : 19,
        DC[k],
        barX(k),
        BASE - 0.34,
        true
      )
    );

    return new M.VGroup(axis, ...labs);
  }

  const parcelAxes = barAxes();

  const tenNote = txt(
    '10 representative parcels',
    P ? 20 : 22,
    C.ink,
    CX, P ? 1.05 : 1.15
  );

  await until(S(2));
  await play(
    ...swap([parcelAxes, tenNote]),
    ...clearBox(),
    ...say('OUR DEPOT: FOUR POSSIBLE DELAYS')
  );

  const parcelStacks = [4, 3, 2, 1].map((n, k) =>
    Array.from({ length: n }, (_, j) =>
      parcel(
        barX(k),
        BASE + (j + 0.5) * BLOCK_PITCH,
        DC[k],
        P ? 0.81 : 0.80,
        P ? 0.59 : 0.46
      )
    )
  );

  const countLabels = [4, 3, 2, 1].map((n, k) =>
    txt(
      `${n} in 10`,
      P ? 16 : 18,
      DC[k],
      barX(k),
      BASE + n * BLOCK_PITCH + 0.24,
      true,
      BAR_SP - 0.12
    )
  );

  // 3: Four in ten are on time.
  await until(S(3));
  await play(
    stagger(parcelStacks[0], 1.45, 0.20),
    ...add(countLabels[0]),
    ...say('4 IN 10: ON TIME', DC[0]),
    ...fbox([
      ['delay = 0 minutes', DC[0]],
      'chance = 4/10 = 0.4'
    ], DC[0])
  );

  // 4: Three in ten are ten minutes late.
  await until(S(4));
  await play(
    stagger(parcelStacks[1], 1.1, 0.18),
    ...add(countLabels[1]),
    ...say('3 IN 10: 10 MINUTES LATE', DC[1]),
    ...fbox([
      ['delay = 10 minutes', DC[1]],
      'chance = 3/10 = 0.3'
    ], DC[1])
  );

  // 5: Two in ten are twenty minutes late.
  await until(S(5));
  await play(
    stagger(parcelStacks[2], 0.9, 0.18),
    ...add(countLabels[2]),
    ...say('2 IN 10: 20 MINUTES LATE', DC[2]),
    ...fbox([
      ['delay = 20 minutes', DC[2]],
      'chance = 2/10 = 0.2'
    ], DC[2])
  );

  // 6: One in ten is thirty minutes late.
  await until(S(6));
  await play(
    ...add(...parcelStacks[3], countLabels[3]),
    ...say('1 IN 10: 30 MINUTES LATE', DC[3]),
    ...fbox([
      ['delay = 30 minutes', DC[3]],
      'chance = 1/10 = 0.1'
    ], DC[3])
  );

  // 7: The four stacks become probability bars.
  const barScale = P ? 7.6 : 6.1;

  const bars = PROB.map((p, k) => {
    const h = p * barScale;

    const b = rect(
      BAR_W, h,
      barX(k), BASE + h / 2,
      DC[k], 0.74, 2
    );

    const highlight = rect(
      BAR_W + 0.13,
      h + 0.055,
      barX(k), BASE + h / 2,
      DC[k], 0.07, 1
    );

    const lab = txt(
      probFmt(p),
      P ? 21 : 23,
      DC[k],
      barX(k), BASE + h + 0.27,
      true
    );

    return new M.VGroup(highlight, b, lab);
  });

  const barTitle = txt(
    'CHANCE OF EACH DELAY',
    18, C.muted,
    CX, P ? 1.05 : 1.15,
    true
  );

  await until(S(7));
  await play(
    ...remove(
      tenNote,
      ...parcelStacks.flat(),
      ...countLabels
    ),
    ...add(barTitle),
    stagger(bars, 1.35, 0.13),
    ...say('ON TIME IS THE MOST LIKELY', DC[0]),
    ...fbox([
      ['0 min    0.4', DC[0]],
      ['10 min   0.3', DC[1]],
      ['20 min   0.2', DC[2]],
      ['30 min   0.1', DC[3]]
    ])
  );

  // ============================================================
  // 8–9: The sampling problem.
  // ============================================================

  // 8: How does 0.94 become a delay?
  await until(S(8));
  await play(
    ...say('HOW DOES 0.94 BECOME A DELAY?', C.amber),
    ...fbox([
      ['draw = 0.94', C.cyan],
      ['      ↓', C.muted],
      ['delay = ?', C.amber]
    ], C.amber)
  );

  // 9: Every delay must preserve its model probability.
  await until(S(9));
  await play(
    new M.LaggedStart(
      bars.map((b, k) =>
        new M.Indicate(b, { color: DC[k] })
      ),
      { lagRatio: 0.18, runTime: 1.7 }
    ),
    ...say('KEEP EVERY DELAY’S RIGHT CHANCE', C.green),
    ...fbox([
      '0.4 + 0.3 + 0.2 + 0.1',
      ['= 1.0', C.green]
    ], C.green)
  );

  // ============================================================
  // 10–16: Build a ruler with pieces proportional to chances.
  // ============================================================

  const uniformRuler = plainRuler();

  const uniformBands = Array.from({ length: 10 }, (_, k) =>
    rect(
      RW / 10 - 0.022,
      RH * 0.70,
      ux((k + 0.5) / 10),
      RY,
      C.cyan, 0.20, 1
    )
  );

  const uniformLabel = txt(
    'Equal lengths have equal chances',
    P ? 19 : 21,
    C.green,
    CX, P ? -1.40 : -1.12
  );

  // 10: All spots on the ruler are equally likely.
  await until(S(10));
  await play(
    ...swap([uniformRuler, uniformLabel]),
    stagger(uniformBands, 1.8, 0.12),
    ...say('A UNIFORM RULER: 0 TO 1'),
    ...fbox([
      'uniform draw',
      ['0 ≤ U < 1', C.cyan]
    ])
  );

  // 11: Prepare to cut the ruler into four pieces.
  const cutGuides = CUTS.slice(1, -1).map(v =>
    new M.DashedLine({
      start: [ux(v), RY - RH / 2 - 0.05, 0],
      end: [ux(v), RY + RH / 2 + 0.85, 0],
      color: C.muted
    })
  );

  const rulerOutline = outline(
    RW, RH,
    CX, RY,
    C.muted
  );

  const leftEnd = cutMark(0);
  const rightEnd = cutMark(1);

  await until(S(11));
  await play(
    ...swap([rulerOutline, leftEnd, rightEnd]),
    stagger(cutGuides, 1.4, 0.20),
    ...say('FOUR PIECES: ONE FOR EACH DELAY', C.amber),
    ...clearBox()
  );

  const pieces = D.map((_, k) => segment(k));

  const cutLabels = CUM.slice(0, 3).map((v, k) =>
    cutMark(v, RY, DC[k])
  );

  const lengthLabels = PROB.map((p, k) =>
    txt(
      probFmt(p),
      P ? 17 : 19,
      DC[k],
      ux((CUTS[k] + CUTS[k + 1]) / 2),
      RY + RH / 2 + 0.42,
      true
    )
  );

  // 12: First piece: 0 to 0.4.
  await until(S(12));
  await play(
    ...add(pieces[0], cutLabels[0], lengthLabels[0]),
    ...remove(cutGuides[0]),
    ...say('0 MINUTES GETS FOUR TENTHS', DC[0]),
    ...fbox([
      ['delay = 0 min', DC[0]],
      'from 0 to 0.4',
      ['length = 0.4', DC[0]]
    ], DC[0])
  );

  // 13: Second piece: 0.4 to 0.7.
  await until(S(13));
  await play(
    ...add(pieces[1], cutLabels[1], lengthLabels[1]),
    ...remove(cutGuides[1]),
    ...say('10 MINUTES GETS THREE TENTHS', DC[1]),
    ...fbox([
      ['delay = 10 min', DC[1]],
      'from 0.4 to 0.7',
      ['length = 0.3', DC[1]]
    ], DC[1])
  );

  // 14: Third piece: 0.7 to 0.9.
  await until(S(14));
  await play(
    ...add(pieces[2], cutLabels[2], lengthLabels[2]),
    ...remove(cutGuides[2]),
    ...say('20 MINUTES GETS TWO TENTHS', DC[2]),
    ...fbox([
      ['delay = 20 min', DC[2]],
      'from 0.7 to 0.9',
      ['length = 0.2', DC[2]]
    ], DC[2])
  );

  // 15: Fourth piece: 0.9 to 1.
  await until(S(15));
  await play(
    ...add(pieces[3], lengthLabels[3]),
    ...say('30 MINUTES GETS ONE TENTH', DC[3]),
    ...fbox([
      ['delay = 30 min', DC[3]],
      'from 0.9 to 1.0',
      ['length = 0.1', DC[3]]
    ], DC[3])
  );

  // 16: Length of a piece equals its delay's probability.
  const equalityNote = tag(
    'LENGTH = CHANCE',
    C.green,
    CX, P ? -1.45 : -1.34,
    19
  );

  await until(S(16));
  await play(
    ...add(equalityNote),
    new M.LaggedStart(
      lengthLabels.map((t, k) =>
        new M.Indicate(t, { color: DC[k] })
      ),
      { lagRatio: 0.12, runTime: 1.4 }
    ),
    ...say('EACH LENGTH IS ITS DELAY’S CHANCE', C.green),
    ...fbox([
      ['piece length', C.ink],
      ['= delay chance', C.green]
    ], C.green)
  );

  // ============================================================
  // 17–18: A longer piece catches more darts.
  // ============================================================

  // These are illustrative throws, not additional seed-101 draws.
  // Four of these ten throws land in the first piece.
  const dartValues = [
    0.82, 0.12, 0.58, 0.34, 0.94,
    0.22, 0.67, 0.46, 0.04, 0.77
  ];

  const dartGroups = dartValues.map((v, k) => {
    const color = delayColor(delayOf(v));

    const h = 0.29 + (k % 3) * 0.19;
    const x = ux(v);
    const y = RY + RH / 2 + h;

    return new M.VGroup(
      line(
        x, y - 0.05,
        x, RY + RH / 2 + 0.025,
        color, 1.2
      ),
      glowDot(x, y, color, 0.065)
    );
  });

  // 17: Think of each draw as a dart.
  await until(S(17));
  await play(
    ...remove(equalityNote, ...lengthLabels),
    stagger(dartGroups, 3.6, 0.24),
    ...say('LONGER PIECES CATCH MORE DARTS'),
    ...fbox([
      'one draw = one dart',
      ['longer piece → more hits', C.green]
    ], C.green)
  );

  // 18: Four tenths of the ruler catches about four in ten.
  const firstPieceFrame = segmentFrame(0, RY, CUTS, DC[0]);

  const firstPieceNote = tag(
    '4 IN 10 IN THIS EXAMPLE',
    DC[0],
    CX, P ? -1.50 : -1.38,
    17
  );

  const firstHits = dartGroups.filter(
    (_, k) => dartValues[k] < 0.4
  );

  await until(S(18));
  await play(
    ...add(firstPieceFrame, firstPieceNote),
    new M.LaggedStart(
      firstHits.map(d =>
        new M.Indicate(d, { color: DC[0] })
      ),
      { lagRatio: 0.18, runTime: 1.9 }
    ),
    ...say('FOUR TENTHS → ABOUT 4 IN 10', DC[0]),
    ...fbox([
      ['length = 0.4', DC[0]],
      ['chance = 0.4', DC[0]]
    ], DC[0])
  );

  // ============================================================
  // 19–25: Read the five actual seed-101 draws.
  // ============================================================

  const sampleRuler = colouredRuler();

  const sampleDraws = drawRow(U, INPUT_Y);

  const sampleSlots = U.map((_, k) =>
    outline(
      CELL_W, CELL_H,
      rowX(k), OUTPUT_Y,
      C.muted
    )
  );

  const sampleQuestions = U.map((_, k) =>
    txt(
      '?',
      P ? 19 : 21,
      C.muted,
      rowX(k), OUTPUT_Y,
      true
    )
  );

  const sampleTitle = txt(
    'FIVE DRAWS → FIVE DELAYS',
    P ? 16 : 18,
    C.muted,
    CX,
    P ? INPUT_Y + 0.73 : INPUT_Y + 0.47,
    true
  );

  const sampleArrows = U.map((_, k) =>
    arrow(
      rowX(k), INPUT_Y - CELL_H / 2 - 0.04,
      rowX(k), OUTPUT_Y + CELL_H / 2 + 0.04,
      C.muted
    )
  );

  // 19: Bring back the original five draws.
  await until(S(19));
  await play(
    ...swap([
      sampleRuler,
      sampleTitle,
      ...sampleDraws,
      ...sampleSlots,
      ...sampleQuestions,
      ...sampleArrows
    ]),
    ...say('NOW READ OUR FIVE DRAWS'),
    ...fbox([
      ['seed = 101', C.amber],
      'read the piece each hits'
    ])
  );

  let markerNow = null;
  let segmentNow = null;
  let inputFrameNow = null;

  const resultCells = DELAYS.map((d, k) =>
    cell(
      `${d} min`,
      rowX(k), OUTPUT_Y,
      delayColor(d)
    )
  );

  function selectDraw(k) {
    const v = U[k];
    const d = DELAYS[k];
    const color = delayColor(d);

    const old = [
      markerNow,
      segmentNow,
      inputFrameNow
    ].filter(Boolean);

    markerNow = drawMarker(v, color);

    segmentNow = segmentFrame(
      d / 10, RY, CUTS, color
    );

    inputFrameNow = outline(
      CELL_W + 0.09,
      CELL_H + 0.09,
      rowX(k),
      INPUT_Y,
      color
    );

    return [
      ...remove(...old),
      ...add(markerNow, segmentNow, inputFrameNow)
    ];
  }

  function revealDelay(k) {
    return [
      ...remove(sampleSlots[k], sampleQuestions[k]),
      ...add(resultCells[k])
    ];
  }

  // 20: 0.94 is near the right-hand end.
  await until(S(20));
  await play(
    ...selectDraw(0),
    ...say('0.94 LANDS NEAR 1', C.cyan),
    ...fbox([
      ['draw = 0.94', C.cyan],
      '0.9 ≤ 0.94 < 1.0'
    ])
  );

  // 21: It lands in the red piece: 30 minutes.
  await until(S(21));
  await play(
    ...revealDelay(0),
    new M.Indicate(segmentNow, { color: DC[3] }),
    ...say('0.94 → 30 MINUTES', DC[3]),
    ...fbox([
      '0.9 ≤ 0.94 < 1.0',
      ['delay = 30 min', DC[3]]
    ], DC[3])
  );

  // 22: 0.36 belongs to the first piece.
  await until(S(22));
  await play(
    ...selectDraw(1),
    ...revealDelay(1),
    ...say('0.36 → 0 MINUTES', DC[0]),
    ...fbox([
      '0 ≤ 0.36 < 0.4',
      ['delay = 0 min', DC[0]]
    ], DC[0])
  );

  // 23: 0.78 belongs to the third piece.
  await until(S(23));
  await play(
    ...selectDraw(2),
    ...revealDelay(2),
    ...say('0.78 → 20 MINUTES', DC[2]),
    ...fbox([
      '0.7 ≤ 0.78 < 0.9',
      ['delay = 20 min', DC[2]]
    ], DC[2])
  );

  // 24: 0.59 belongs to the second piece.
  await until(S(24));
  await play(
    ...selectDraw(3),
    ...revealDelay(3),
    ...say('0.59 → 10 MINUTES', DC[1]),
    ...fbox([
      '0.4 ≤ 0.59 < 0.7',
      ['delay = 10 min', DC[1]]
    ], DC[1])
  );

  // 25: 0.29 belongs to the first piece.
  await until(S(25));
  await play(
    ...selectDraw(4),
    ...revealDelay(4),
    ...say('0.29 → 0 MINUTES', DC[0]),
    ...fbox([
      '0 ≤ 0.29 < 0.4',
      ['delay = 0 min', DC[0]]
    ], DC[0])
  );

  // ============================================================
  // 26: The batch total and mean.
  // ============================================================

  const batchFrame = outline(
    4 * CELL_SP + CELL_W + 0.20,
    CELL_H + 0.17,
    CX, OUTPUT_Y,
    C.green
  );

  const batchMeanTag = tag(
    'MEAN = 12 MINUTES',
    C.green,
    CX,
    P ? -4.65 : 0.89,
    P ? 20 : 18
  );

  await until(S(26));
  await play(
    ...remove(
      markerNow,
      segmentNow,
      inputFrameNow
    ),
    ...add(batchFrame),
    ...say('OUR FIVE PARCEL DELAYS', C.green),
    ...fbox([
      '30 + 0 + 20 + 10 + 0',
      ['total = 60 minutes', C.amber]
    ], C.amber)
  );

  markerNow = null;
  segmentNow = null;
  inputFrameNow = null;

  await until(S(26) + 3.8);

  await play(
    ...add(batchMeanTag),
    ...fbox([
      ['sum = 60 minutes', C.amber],
      'count = 5',
      ['60 ÷ 5 = 12 minutes', C.green]
    ], C.green),
    ...say('AVERAGE = 12 MINUTES', C.green)
  );

  // ============================================================
  // 27–29: Cut points are cumulative chances.
  // ============================================================

  const cumulativeRuler = colouredRuler();

  const cutDots = CUM.map((v, k) =>
    glowDot(
      ux(v),
      RY + RH / 2 + 0.19,
      DC[k],
      0.087
    )
  );

  const cumulativeLabels = CUM.map((v, k) =>
    txt(
      v.toFixed(1),
      P ? 18 : 20,
      DC[k],
      ux(v),
      RY + RH / 2 + 0.57,
      true
    )
  );

  const cutPointTitle = txt(
    'THE CUT POINTS',
    18, C.muted,
    CX, P ? 1.27 : 1.24,
    true
  );

  // 27: Highlight 0.4, 0.7, 0.9 and 1.
  await until(S(27));
  await play(
    ...swap([cumulativeRuler, cutPointTitle]),
    stagger(cutDots, 1.3, 0.16),
    stagger(cumulativeLabels, 1.3, 0.16),
    ...say('LOOK AT THE CUT POINTS', C.amber),
    ...fbox([
      ['0.4   0.7   0.9   1.0', C.amber],
      'where the pieces end'
    ], C.amber)
  );

  // 28: Add the chances as we go.
  const runningY = P ? -2.22 : -1.75;

  const runningParts = PROB.map((p, k) => {
    const x = CX + (k - 1.5) * (P ? 1.48 : 1.52);

    return cell(
      probFmt(p),
      x, runningY,
      DC[k],
      P ? 1.06 : 1.12
    );
  });

  const plusSigns = Array.from({ length: 3 }, (_, k) =>
    txt(
      '+',
      22, C.muted,
      CX + (k - 1) * (P ? 1.48 : 1.52),
      runningY,
      true
    )
  );

  const runningEquations = [
    '0.4 = 0.4',
    '0.4 + 0.3 = 0.7',
    '0.7 + 0.2 = 0.9',
    '0.9 + 0.1 = 1.0'
  ];

  const runningDisplays = runningEquations.map((s, k) =>
    txt(
      s,
      P ? 23 : 25,
      DC[k],
      CX,
      P ? -3.28 : -2.45,
      true
    )
  );

  await until(S(28));
  await play(
    ...add(runningParts[0], runningDisplays[0]),
    new M.Indicate(cumulativeLabels[0], { color: DC[0] }),
    ...say('ADD THE CHANCES AS WE GO', C.amber),
    ...fbox([
      ['0.4 = 0.4', DC[0]]
    ], DC[0])
  );

  await until(S(28) + 2.0);

  await play(
    ...remove(runningDisplays[0]),
    ...add(
      plusSigns[0],
      runningParts[1],
      runningDisplays[1]
    ),
    new M.Indicate(cumulativeLabels[1], { color: DC[1] }),
    ...fbox([
      '0.4 + 0.3',
      ['= 0.7', DC[1]]
    ], DC[1])
  );

  await until(S(28) + 4.0);

  await play(
    ...remove(runningDisplays[1]),
    ...add(
      plusSigns[1],
      runningParts[2],
      runningDisplays[2]
    ),
    new M.Indicate(cumulativeLabels[2], { color: DC[2] }),
    ...fbox([
      '0.7 + 0.2',
      ['= 0.9', DC[2]]
    ], DC[2])
  );

  await until(S(28) + 6.0);

  await play(
    ...remove(runningDisplays[2]),
    ...add(
      plusSigns[2],
      runningParts[3],
      runningDisplays[3]
    ),
    new M.Indicate(cumulativeLabels[3], { color: DC[3] }),
    ...fbox([
      '0.9 + 0.1',
      ['= 1.0', DC[3]]
    ], DC[3])
  );

  // 29: The running totals form the cumulative distribution.
  // The table is built from the exact shared chapter data.

  function cumulativeTable(
    y = P ? -2.10 : -1.75
  ) {
    const sp = P ? 1.48 : 1.52;
    const w = P ? 1.23 : 1.32;

    const headerY = y + 0.80;
    const chanceY = y - 0.78;

    const parts = [
      txt(
        'DELAY',
        16, C.muted,
        CX, headerY + 0.02,
        true
      )
    ];

    for (let k = 0; k < 4; k++) {
      const x = CX + (k - 1.5) * sp;

      parts.push(
        cell(`${D[k]} min`, x, y + 0.22, DC[k], w, 0.53),
        arrow(
          x, y - 0.07,
          x, chanceY + 0.31,
          C.muted
        ),
        cell(
          CUM[k].toFixed(1),
          x, chanceY,
          DC[k], w, 0.53
        )
      );
    }

    if (P) {
      parts.push(
        txt(
          'CUMULATIVE CHANCE',
          16, C.muted,
          CX, chanceY - 0.57,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const cumTable = cumulativeTable();

  const cumRuler2 = colouredRuler(
    P ? 0.32 : 0.47
  );

  await until(S(29));
  await play(
    ...swap([cumRuler2, cumTable]),
    ...say('CUMULATIVE = RUNNING TOTAL', C.violet),
    ...fbox([
      ['cumulative chance', C.violet],
      'chance of this delay',
      'or less'
    ], C.violet)
  );

  // ============================================================
  // 30–32: Forward versus inverse.
  // ============================================================

  const flowY = P ? -0.55 : -0.45;
  const FLOW_X = P ? 1.72 : 2.05;
  const FLOW_W = P ? 2.65 : 2.75;

  function flowBox(
    heading, value,
    x, y, color
  ) {
    return new M.VGroup(
      rounded(FLOW_W, 1.45, x, y, color),
      txt(
        heading,
        P ? 16 : 17,
        C.muted,
        x, y + 0.40,
        true,
        FLOW_W - 0.16
      ),
      txt(
        value,
        P ? 26 : 29,
        color,
        x, y - 0.14,
        true,
        FLOW_W - 0.20
      )
    );
  }

  // 30: Usually we go from delay to cumulative chance.
  const forwardDelay = flowBox(
    'DELAY',
    '10 min',
    CX - FLOW_X,
    flowY,
    DC[1]
  );

  const forwardChance = flowBox(
    'CUMULATIVE CHANCE',
    '0.7',
    CX + FLOW_X,
    flowY,
    C.violet
  );

  const forwardArrow = arrow(
    CX - FLOW_X + FLOW_W / 2 + 0.06,
    flowY,
    CX + FLOW_X - FLOW_W / 2 - 0.06,
    flowY,
    C.green
  );

  const forwardTag = tag(
    'READ FORWARDS',
    C.green,
    CX,
    P ? -2.05 : -1.92,
    18
  );

  await until(S(30));
  await play(
    ...swap([
      forwardDelay,
      forwardChance,
      forwardArrow,
      forwardTag
    ]),
    ...say('DELAY → CUMULATIVE CHANCE', C.green),
    ...fbox([
      ['delay = 10 min', DC[1]],
      ['F(10) = 0.7', C.violet]
    ], C.green)
  );

  // 31: Sampling reverses the direction.
  // Keep delay on the left, chance on the right,
  // but reverse the arrow and use a uniform draw.
  const inverseDelay = flowBox(
    'DELAY',
    '10 min',
    CX - FLOW_X,
    flowY,
    DC[1]
  );

  const inverseDraw = flowBox(
    'UNIFORM DRAW',
    '0.59',
    CX + FLOW_X,
    flowY,
    C.cyan
  );

  const inverseArrow = arrow(
    CX + FLOW_X - FLOW_W / 2 - 0.06,
    flowY,
    CX - FLOW_X + FLOW_W / 2 + 0.06,
    flowY,
    C.violet
  );

  const inverseTag = tag(
    'READ BACKWARDS',
    C.violet,
    CX,
    P ? -2.05 : -1.92,
    18
  );

  await until(S(31));
  await play(
    ...swap([
      inverseDelay,
      inverseDraw,
      inverseArrow,
      inverseTag
    ]),
    ...say('DRAW → DELAY: GO BACKWARDS', C.violet),
    ...fbox([
      ['start with 0.59', C.cyan],
      ['read back to 10 min', DC[1]]
    ], C.violet)
  );

  // 32: Name the method.
  const methodName = txt(
    'INVERSE TRANSFORM',
    P ? 25 : 28,
    C.violet,
    CX,
    P ? 1.13 : 1.13,
    true
  );

  const methodSub = txt(
    'SAMPLING',
    P ? 25 : 27,
    C.violet,
    CX,
    P ? 0.61 : 0.68,
    true
  );

  const transformNote = txt(
    'Transform means change.',
    P ? 20 : 22,
    C.ink,
    CX,
    P ? -3.15 : -2.52
  );

  await until(S(32));
  await play(
    ...add(methodName, methodSub, transformNote),
    ...say('INVERSE TRANSFORM SAMPLING', C.violet),
    ...fbox([
      ['inverse = backwards', C.violet],
      'transform = change',
      'sampling = make a draw'
    ], C.violet)
  );

  // ============================================================
  // 33–35: The exact rule, checked with 0.59.
  // ============================================================

  const checkRuler = colouredRuler();

  const checkMarker = drawMarker(0.59, C.cyan);

  const CHECK_Y = P ? -2.12 : -1.66;
  const CHECK_SP = P ? 1.48 : 1.52;
  const CHECK_W = P ? 1.29 : 1.34;

  function checkCell(k, status = 'normal') {
    const x = CX + (k - 1.5) * CHECK_SP;

    let c = DC[k];
    let opacity = 0.07;

    if (status === 'reject') {
      c = C.muted;
      opacity = 0.05;
    }

    if (status === 'accept') {
      c = C.green;
      opacity = 0.19;
    }

    const parts = [
      rounded(
        CHECK_W,
        P ? 1.12 : 1.02,
        x, CHECK_Y,
        c, c, opacity
      ),
      txt(
        `${D[k]} min`,
        P ? 17 : 18,
        DC[k],
        x, CHECK_Y + 0.27,
        true,
        CHECK_W - 0.12
      ),
      txt(
        CUM[k].toFixed(1),
        P ? 23 : 25,
        c,
        x, CHECK_Y - 0.13,
        true
      )
    ];

    if (status === 'reject') {
      parts.push(
        txt(
          'NOT ABOVE',
          P ? 16 : 15,
          C.muted,
          x,
          CHECK_Y - (P ? 0.89 : 0.69),
          true,
          CHECK_SP - 0.06
        )
      );
    }

    if (status === 'accept') {
      parts.push(
        txt(
          'FIRST ABOVE',
          P ? 16 : 15,
          C.green,
          x,
          CHECK_Y - (P ? 0.89 : 0.69),
          true,
          CHECK_SP - 0.06
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const checkCells = D.map((_, k) => checkCell(k));

  // 33: Choose the smallest delay with cumulative chance above U.
  await until(S(33));
  await play(
    ...swap([checkRuler, ...checkCells]),
    ...say('FIND THE FIRST CUT ABOVE THE DRAW'),
    ...fbox([
      'smallest delay with',
      ['F(delay) > draw', C.amber]
    ], C.amber)
  );

  // 34: Test zero minutes: 0.4 is not above 0.59.
  const rejectedZero = checkCell(0, 'reject');

  const zeroCut = glowDot(
    ux(0.4),
    RY + RH / 2 + 0.18,
    DC[0],
    0.08
  );

  await until(S(34));
  await play(
    ...add(checkMarker, zeroCut),
    ...remove(checkCells[0]),
    ...add(rejectedZero),
    ...say('0.4 IS NOT ABOVE 0.59', C.amber),
    ...fbox([
      ['U = 0.59', C.cyan],
      'F(0) = 0.4',
      ['0.4 > 0.59? NO', C.muted]
    ], C.amber)
  );

  // 35: Test ten minutes: 0.7 is the first cut above 0.59.
  const acceptedTen = checkCell(1, 'accept');

  const tenCut = glowDot(
    ux(0.7),
    RY + RH / 2 + 0.18,
    C.green,
    0.085
  );

  const acceptedPiece = segmentFrame(
    1, RY, CUTS, C.green
  );

  const checkResult = tag(
    'DELAY = 10 MINUTES',
    DC[1],
    CX,
    P ? -4.02 : -2.98,
    18
  );

  await until(S(35));
  await play(
    ...remove(zeroCut, checkCells[1]),
    ...add(
      tenCut,
      acceptedTen,
      acceptedPiece,
      checkResult
    ),
    ...say('0.7 IS THE FIRST CUT ABOVE 0.59', C.green),
    ...fbox([
      ['U = 0.59', C.cyan],
      'F(10) = 0.7',
      ['0.7 > 0.59: YES', C.green],
      ['delay = 10 min', DC[1]]
    ], C.green)
  );

  // ============================================================
  // 36–37: Introduce the short notation.
  // ============================================================

  const notationRuler = colouredRuler();
  const notationMarker = drawMarker(0.59, C.cyan);

  const notationFrame = segmentFrame(
    1, RY, CUTS, DC[1]
  );

  const NOT_Y = P ? -2.03 : -1.71;

  const notationU = new M.VGroup(
    rounded(2.70, 1.03, CX - 1.63, NOT_Y, C.cyan),
    txt(
      'U',
      28, C.cyan,
      CX - 1.63, NOT_Y + 0.20,
      true
    ),
    txt(
      'uniform draw',
      16, C.ink,
      CX - 1.63, NOT_Y - 0.25,
      false, 2.45
    )
  );

  const notationF = new M.VGroup(
    rounded(2.70, 1.03, CX + 1.63, NOT_Y, C.violet),
    txt(
      'F',
      28, C.violet,
      CX + 1.63, NOT_Y + 0.20,
      true
    ),
    txt(
      'cumulative distribution',
      15, C.ink,
      CX + 1.63, NOT_Y - 0.25,
      false, 2.45
    )
  );

  // 36: U is the uniform draw; F is the cumulative distribution.
  await until(S(36));
  await play(
    ...swap([
      notationRuler,
      notationMarker,
      notationFrame,
      notationU,
      notationF
    ]),
    ...say('U = DRAW     F = CUMULATIVE', C.violet),
    ...fbox([
      ['U = uniform draw', C.cyan],
      ['F = cumulative chance', C.violet]
    ], C.violet)
  );

  // 37: Delay equals F inverse of U.
  // For the course's discrete rule, the inverse means the
  // first cumulative cut strictly greater than the draw.
  const formulaY = P ? -2.35 : -1.80;

  const inverseFormula = new M.VGroup(
    rounded(
      P ? 5.65 : 5.85,
      P ? 1.30 : 1.12,
      CX, formulaY,
      C.violet
    ),
    txt(
      'delay = F⁻¹(U)',
      P ? 29 : 31,
      C.violet,
      CX, formulaY + 0.17,
      true
    ),
    txt(
      'Read F backwards at U',
      P ? 17 : 19,
      C.ink,
      CX, formulaY - 0.33
    )
  );

  await until(S(37));
  await play(
    ...remove(notationU, notationF),
    ...add(inverseFormula),
    ...say('DELAY = F INVERSE OF U', C.violet),
    ...fbox([
      ['delay = F⁻¹(U)', C.violet],
      'F⁻¹(0.59)',
      ['= 10 minutes', DC[1]]
    ], C.violet)
  );

  // ============================================================
  // 38–39: One uniform recipe, many possible models.
  // ============================================================

  function clockIcon(x, y, color) {
    const c = new M.Circle({
      radius: 0.31,
      color,
      strokeWidth: 2.5
    });

    c.setFill(color, 0.10);
    c.moveTo([x, y, 0]);

    return new M.VGroup(
      c,
      line(x, y, x, y + 0.19, color, 2.5),
      line(x, y, x + 0.14, y - 0.07, color, 2.5)
    );
  }

  function weightIcon(x, y, color) {
    return new M.VGroup(
      rounded(0.72, 0.60, x, y, color, color, 0.12),
      new M.Circle({
        radius: 0.17,
        color,
        strokeWidth: 2
      }).moveTo([x, y + 0.08, 0]),
      line(
        x, y + 0.08,
        x + 0.09, y + 0.18,
        color, 2
      )
    );
  }

  const sourceY = P ? 0.90 : 0.87;

  const sourceBox = new M.VGroup(
    rounded(3.35, 0.76, CX, sourceY, C.cyan),
    txt(
      'UNIFORM RECIPE',
      20, C.cyan,
      CX, sourceY,
      true
    )
  );

  const branchY = P ? -0.42 : -0.18;
  const modelY = P ? -2.13 : -1.82;

  const modelSP = P ? 2.12 : 2.26;
  const modelW = P ? 1.91 : 2.02;

  const modelSpecs = [
    ['DELAYS', DC[1]],
    ['WAITING TIMES', C.violet],
    ['WEIGHTS', C.green]
  ];

  const modelBoxes = modelSpecs.map(([name, color], k) => {
    const x = CX + (k - 1) * modelSP;

    const icon =
      k === 0 ? parcel(x, modelY + 0.23, color, 0.68, 0.48) :
      k === 1 ? clockIcon(x, modelY + 0.23, color) :
      weightIcon(x, modelY + 0.23, color);

    return new M.VGroup(
      rounded(
        modelW, 1.42,
        x, modelY,
        color
      ),
      icon,
      txt(
        name,
        P ? 15 : 17,
        color,
        x, modelY - 0.40,
        true,
        modelW - 0.16
      )
    );
  });

  const modelBranches = [
    line(
      CX, sourceY - 0.39,
      CX, branchY,
      C.cyan, 2
    ),
    line(
      CX - modelSP, branchY,
      CX + modelSP, branchY,
      C.muted, 2
    ),
    ...modelSpecs.map((_, k) =>
      arrow(
        CX + (k - 1) * modelSP, branchY,
        CX + (k - 1) * modelSP, modelY + 0.77,
        C.muted
      )
    )
  ];

  // 38: One uniform number generator can sample many models.
  await until(S(38));
  await play(
    ...swap([sourceBox, ...modelBranches]),
    stagger(modelBoxes, 2.1, 0.25),
    ...say('ONE RECIPE, MANY MODELS', C.green),
    ...fbox([
      ['uniform numbers', C.cyan],
      '↓',
      ['many kinds of data', C.green]
    ], C.green)
  );

  // 39: All we need are the cumulative chances.
  const needCumulative = tag(
    'USE EACH MODEL’S CUMULATIVE CHANCES',
    C.violet,
    CX,
    P ? -3.55 : -2.73,
    P ? 16 : 17
  );

  await until(S(39));
  await play(
    ...add(needCumulative),
    ...say('ALL WE NEED: CUMULATIVE CHANCES', C.violet),
    ...fbox([
      ['uniform draw U', C.cyan],
      ['cumulative model F', C.violet],
      ['sample = F⁻¹(U)', C.green]
    ], C.violet)
  );

  // ============================================================
  // 40–42: Common trap — cutting the ruler into equal pieces.
  // ============================================================

  const EQUAL_CUTS = [0, 0.25, 0.50, 0.75, 1.0];

  const GOOD_Y = P ? 0.23 : 0.37;
  const BAD_Y = P ? -2.15 : -1.72;

  const correctRuler = colouredRuler(GOOD_Y, CUTS);

  const correctTitle = txt(
    'CORRECT: FOLLOW THE CHANCES',
    P ? 18 : 19,
    C.green,
    CX, GOOD_Y + 0.80,
    true
  );

  const equalRuler = colouredRuler(BAD_Y, EQUAL_CUTS);

  const equalTitle = txt(
    'WRONG: FOUR EQUAL PIECES',
    P ? 18 : 19,
    DC[3],
    CX, BAD_Y + 0.80,
    true
  );

  // 40: The pieces must follow the probabilities.
  await until(S(40));
  await play(
    ...swap([
      correctRuler,
      correctTitle,
      equalRuler,
      equalTitle
    ]),
    ...say('TRAP: DO NOT MAKE THE PIECES EQUAL', DC[3]),
    ...fbox([
      ['correct lengths', C.green],
      '0.4  0.3  0.2  0.1',
      ['not four equal pieces', DC[3]]
    ], DC[3])
  );

  // 41: Equal pieces give 0.25 to every delay.
  const equalChanceLabels = D.map((_, k) =>
    txt(
      '0.25',
      P ? 17 : 18,
      DC[k],
      ux((EQUAL_CUTS[k] + EQUAL_CUTS[k + 1]) / 2),
      BAD_Y + RH / 2 + 0.23,
      true
    )
  );

  const correctChanceLabels = PROB.map((p, k) =>
    txt(
      p.toFixed(1),
      P ? 17 : 18,
      DC[k],
      ux((CUTS[k] + CUTS[k + 1]) / 2),
      GOOD_Y + RH / 2 + 0.22,
      true
    )
  );

  await until(S(41));
  await play(
    stagger(correctChanceLabels, 1.0, 0.12),
    stagger(equalChanceLabels, 1.6, 0.16),
    ...say('EQUAL PIECES GIVE 1 IN 4 EACH', DC[3]),
    ...fbox([
      '1 ÷ 4 = 0.25',
      ['every delay gets 25%', DC[3]]
    ], DC[3])
  );

  // 42: 30-minute delays would occur 2.5 times too often.
  const correctLateFrame = segmentFrame(
    3, GOOD_Y, CUTS, DC[3]
  );

  const wrongLateFrame = segmentFrame(
    3, BAD_Y, EQUAL_CUTS, DC[3]
  );

  const excessiveLate = tag(
    '2.5 × TOO MANY 30-MINUTE DELAYS',
    DC[3],
    CX,
    P ? -3.70 : -2.74,
    P ? 17 : 16
  );

  await until(S(42));
  await play(
    ...add(correctLateFrame, wrongLateFrame),
    new M.Indicate(correctChanceLabels[3], {
      color: DC[3]
    }),
    new M.Indicate(equalChanceLabels[3], {
      color: DC[3]
    }),
    ...say('30-MINUTE DELAYS BECOME TOO COMMON', DC[3]),
    ...fbox([
      ['correct chance = 0.10', C.green],
      ['wrong chance   = 0.25', DC[3]],
      ['0.25 ÷ 0.10 = 2.5', DC[3]]
    ], DC[3])
  );

  await until(S(42) + 2.8);

  await play(
    ...add(excessiveLate)
  );

  // ============================================================
  // 43: Final one-picture summary.
  // Correct ruler, five uniform draws, five parcel delays.
  // ============================================================

  const finalRuler = colouredRuler();

  const finalLengths = PROB.map((p, k) =>
    txt(
      p.toFixed(1),
      P ? 17 : 19,
      DC[k],
      ux((CUTS[k] + CUTS[k + 1]) / 2),
      RY + RH / 2 + 0.54,
      true
    )
  );

  const finalDraws = drawRow(U, INPUT_Y);

  const finalDelays = delayRow(DELAYS, OUTPUT_Y);

  const finalArrows = U.map((_, k) =>
    arrow(
      rowX(k), INPUT_Y - CELL_H / 2 - 0.04,
      rowX(k), OUTPUT_Y + CELL_H / 2 + 0.04,
      delayColor(DELAYS[k])
    )
  );

  const finalDots = U.map((v, k) => {
    const c = delayColor(DELAYS[k]);
    const y = RY + RH / 2 + 0.17;

    return glowDot(
      ux(v),
      y,
      c,
      P ? 0.067 : 0.078
    );
  });

  const finalSeed = tag(
    'SEED 101',
    C.amber,
    CX,
    P ? 1.45 : 1.27,
    16
  );

  await until(S(43));
  await play(
    ...swap([
      finalRuler,
      finalSeed,
      ...finalLengths,
      ...finalDraws
    ]),
    ...say('CUT THE RULER BY CUMULATIVE CHANCES', C.green),
    ...fbox([
      'cut points:',
      ['0.4  0.7  0.9  1.0', C.violet]
    ], C.violet)
  );

  await until(S(43) + 2.1);

  await play(
    stagger(finalDots, 1.5, 0.16),
    ...add(...finalArrows),
    stagger(finalDelays, 1.6, 0.16),
    ...fbox([
      ['uniform draw U', C.cyan],
      ['↓  F⁻¹', C.violet],
      ['parcel delay', C.green]
    ], C.green)
  );

  await until(S(43) + 4.7);

  await play(
    new M.LaggedStart(
      finalDelays.map((d, k) =>
        new M.Indicate(d, {
          color: delayColor(DELAYS[k])
        })
      ),
      { lagRatio: 0.12, runTime: 1.5 }
    ),
    ...say('EVERY DRAW GETS THE RIGHT DELAY', C.green),
    ...fbox([
      ['delay = F⁻¹(U)', C.violet],
      ['correct delays', C.green],
      ['correct chances', C.green]
    ], C.green)
  );

  await until(E(43));
}

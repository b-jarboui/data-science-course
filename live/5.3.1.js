// lesson 5.3.1
// Pseudorandom sampling — Chapter 5.3: Simulation and convergence.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// The displayed samples are precomputed NumPy default_rng draws,
// rounded to two decimal places, so playback and seeking are deterministic.
// Browser playback requires verification against the project's live engine.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  // ------------------------------------------------------------

  const SEED = 101;
  const U = [0.94, 0.36, 0.78, 0.59, 0.29];
  const U2 = [0.16, 0.59, 0.82, 0.30, 0.68]; // Seed 102
  const U3 = [0.31, 0.22, 0.18, 0.86, 0.86]; // Seed 103

  const DELAYS = [30, 0, 20, 10, 0];
  const TOTAL = 60;
  const MEAN = 12;

  const DC = [
    C.teal || '#2DD4BF',
    C.blue || '#60A5FA',
    C.amber,
    C.red || '#F87171'
  ];

  const delayColor = d => DC[d / 10];
  const fmt = v => v.toFixed(2);

  // ------------------------------------------------------------
  // Responsive layout
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];

  const W = P ? FW - 1.2 : FW - 2.6;
  const RULER_W = P ? 5.95 : 10.2;
  const RULER_Y = P ? -0.65 : -0.45;

  const ROW_SP = P ? 1.14 : 1.52;
  const CELL_W = P ? 1.02 : 1.35;
  const CELL_H = P ? 0.68 : 0.70;

  const rowX = (k, cx = 0) => cx + (k - 2) * ROW_SP;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------

  function txt(s, size, color, x, y, mono = false, maxw = W) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(w, h, x, y, color, opacity = 0.08, sw = 2) {
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

  function roundRect(
    w, h, x, y, color,
    fillColor = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(fillColor, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function line(x1, y1, x2, y2, color = C.muted, sw = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function arrow(x1, y1, x2, y2, color = C.muted) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const r = 0.15;

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

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);

    if (p.getWidth() > W) {
      p.scale(W / p.getWidth());
    }

    p.moveTo([x, y, 0]);
    return p;
  }

  function glowDot(x, y, color = C.cyan, r = 0.10) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: r * 2.25,
      color
    });

    halo.setFill(color, 0.15);

    const d = new M.Dot({
      point: [x, y, 0],
      radius: r,
      color
    });

    d.setFill(color, 1);
    return new M.VGroup(halo, d);
  }

  function cell(value, x, y, color = C.cyan, width = CELL_W) {
    const b = roundRect(width, CELL_H, x, y, color, color, 0.10);
    const t = txt(
      value, P ? 19 : 22, color,
      x, y, true, width - 0.13
    );

    return new M.VGroup(b, t);
  }

  function valueRow(values, y, color = C.cyan, cx = 0) {
    return values.map((v, k) =>
      cell(fmt(v), rowX(k, cx), y, color)
    );
  }

  function outline(w, h, x, y, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);
    return r;
  }

  // Formula box, following the approved lesson's card style.
  function fbox(lines, color = C.cyan, pos = BOXP) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

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

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = roundRect(wd, ht, pos[0], pos[1], color);

    const left = pos[0] - wd / 2 + 0.35;
    const top = pos[1] + ht / 2 - 0.2 - lh / 2;

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

    if (wd > maxw) g.scale(maxw / wd);

    return g;
  }

  // ------------------------------------------------------------
  // Scene bookkeeping
  //
  // Only group objects before they enter the scene.
  // Previously displayed objects are removed individually.
  // These helpers return animations; they never call play().
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
  // Parcel and depot pictures
  // ------------------------------------------------------------

  function parcel(x, y, color = C.ink, size = 0.65) {
    return new M.VGroup(
      rect(size, size * 0.78, x, y, color, 0.12),
      rect(
        size * 0.16, size * 0.78,
        x, y, color, 0.45, 1
      ),
      line(
        x - size * 0.5, y + size * 0.13,
        x + size * 0.5, y + size * 0.13,
        color, 1
      ),
      rect(
        size * 0.23, size * 0.15,
        x + size * 0.26, y - size * 0.20,
        color, 0.65, 1
      )
    );
  }

  function depot(x, y) {
    const w = P ? 3.3 : 3.8;
    const h = P ? 1.65 : 1.8;

    return new M.VGroup(
      rect(w, h, x, y, C.cyan, 0.07),
      line(
        x - w / 2, y + h / 2,
        x, y + h / 2 + 0.56,
        C.cyan, 3
      ),
      line(
        x, y + h / 2 + 0.56,
        x + w / 2, y + h / 2,
        C.cyan, 3
      ),
      rect(0.95, 0.95, x, y - 0.40, C.muted, 0.12),
      rect(0.48, 0.44, x - w * 0.30, y + 0.12, C.cyan, 0.18),
      rect(0.48, 0.44, x + w * 0.30, y + 0.12, C.cyan, 0.18),
      txt('PARCEL DEPOT', 19, C.ink, x, y + 0.54, false, w - 0.3)
    );
  }

  function delayParcel(d, x, y, size = 0.61) {
    const c = delayColor(d);

    return new M.VGroup(
      parcel(x, y, c, size),
      txt(
        d === 0 ? '0 min' : `+${d} min`,
        P ? 15 : 18,
        c, x, y - size * 0.75, true
      )
    );
  }

  function miniDay(values, x, y, day, seed = null) {
    const w = P ? 2.15 : 2.02;
    const h = P ? 1.26 : 1.34;
    const parts = [
      roundRect(w, h, x, y, C.muted),
      txt(`DAY ${day}`, 15, C.muted, x, y + 0.40, true, w - 0.1)
    ];

    if (values) {
      values.forEach((d, k) => {
        const xx = x + (k - 2) * (w - 0.28) / 5;

        parts.push(
          rect(0.17, 0.24, xx, y + 0.04, delayColor(d), 0.85, 1),
          txt(d, P ? 15 : 14, delayColor(d), xx, y - 0.20, true)
        );
      });

      parts.push(
        txt(
          seed === null ? '5 parcels' : `seed ${seed}`,
          P ? 15 : 14, C.muted, x, y - 0.43, true, w - 0.12
        )
      );
    } else {
      parts.push(
        txt('?', 28, C.muted, x, y - 0.12, true)
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 0–3: The parcel depot and pretend days
  // ============================================================

  const depotY = P ? -0.25 : -0.15;
  const depotPic = depot(0, depotY);

  const arrivals = Array.from({ length: 5 }, (_, k) =>
    parcel(
      (k - 2) * (P ? 1.02 : 1.24),
      P ? -2.25 : -1.95,
      C.cyan,
      0.60
    )
  );

  await until(S(0));
  await play(
    ...add(depotPic),
    stagger(arrivals, 1.15, 0.12),
    ...say('A PARCEL DEPOT')
  );

  // 1: Many on time; others 10, 20, or 30 minutes late.
  // Ten illustrative parcels follow the shared 4:3:2:1 model.
  const illustrative = [0, 0, 0, 0, 10, 10, 10, 20, 20, 30];

  const arrivalGroups = illustrative.map((d, k) => {
    const cols = P ? 5 : 10;
    const row = Math.floor(k / cols);
    const col = k % cols;

    return delayParcel(
      d,
      (col - (cols - 1) / 2) * (P ? 1.17 : 1.06),
      P ? -0.60 - row * 1.42 : -0.72,
      P ? 0.63 : 0.59
    );
  });

  const arrivalHead = txt(
    'PARCEL ARRIVALS',
    22, C.ink, 0, P ? 1.08 : 0.65
  );

  await until(S(1));
  await play(
    ...swap([arrivalHead]),
    stagger(arrivalGroups, 2.6, 0.13),
    ...say('SOME ON TIME, SOME LATE', C.amber)
  );

  // 2: We want to know about a day that has not happened.
  const tomorrowY = P ? -0.25 : -0.35;
  const tomorrow = new M.VGroup(
    roundRect(P ? 4.5 : 4.8, 2.65, 0, tomorrowY, C.amber),
    txt('TOMORROW', 22, C.amber, 0, tomorrowY + 0.79, true),
    txt('?', 66, C.amber, 0, tomorrowY + 0.05, true),
    txt(
      'How much delay?',
      20, C.ink, 0, tomorrowY - 0.86
    )
  );

  await until(S(2));
  await play(
    ...swap([tomorrow]),
    ...say('BEFORE THE DAY HAPPENS', C.amber)
  );

  // 3: Many possible pretend days.
  const dayExamples = [
    [0, 10, 0, 20, 0],
    [30, 0, 20, 10, 0],
    [10, 10, 0, 30, 20],
    [0, 0, 0, 10, 0],
    [20, 10, 30, 0, 10],
    [0, 20, 0, 10, 0]
  ];

  const pretendDays = dayExamples.map((ds, k) => {
    const cols = 3;

    return miniDay(
      ds,
      (k % cols - 1) * (P ? 1.92 : 2.28),
      (P ? 0.25 : 0.20) - Math.floor(k / cols) * 1.60,
      k + 1
    );
  });

  await until(S(3));
  await play(
    ...swap([]),
    stagger(pretendDays, 2.5, 0.18),
    ...say('SIMULATION = MANY PRETEND DAYS', C.green)
  );

  // ============================================================
  // 4–8: Chance, instructions, and the number-making recipe
  // ============================================================

  function coin(x, y) {
    const c = new M.Circle({
      radius: 0.58,
      color: C.amber,
      strokeWidth: 3
    });

    c.setFill(C.amber, 0.15);
    c.moveTo([x, y, 0]);

    return new M.VGroup(
      c,
      txt('H', 34, C.amber, x, y, true),
      txt('coin', 18, C.muted, x, y - 0.89)
    );
  }

  function die(x, y) {
    const offsets = [
      [-0.27, -0.27],
      [-0.27, 0.27],
      [0, 0],
      [0.27, -0.27],
      [0.27, 0.27]
    ];

    return new M.VGroup(
      roundRect(1.14, 1.14, x, y, C.violet),
      ...offsets.map(([dx, dy]) =>
        glowDot(x + dx, y + dy, C.violet, 0.075)
      ),
      txt('die', 18, C.muted, x, y - 0.89)
    );
  }

  const coinPic = coin(-1.35, P ? 0 : -0.15);
  const diePic = die(1.35, P ? 0 : -0.15);

  await until(S(4));
  await play(
    ...swap([coinPic, diePic]),
    ...say('A SIMULATION NEEDS CHANCE', C.violet)
  );

  // 5: A computer follows instructions.
  const computerY = P ? -0.15 : -0.25;

  const computer = new M.VGroup(
    roundRect(4.6, 2.35, 0, computerY, C.cyan),
    rect(4.05, 1.80, 0, computerY + 0.10, C.muted, 0.04),
    txt('instructions', 24, C.cyan, 0, computerY + 0.39, true),
    txt('>', 28, C.green, -1.55, computerY - 0.30, true),
    line(
      -1.10, computerY - 0.30,
      1.45, computerY - 0.30,
      C.muted, 3
    ),
    rect(0.18, 0.38, 0, computerY - 1.36, C.muted, 0.65),
    rect(1.45, 0.13, 0, computerY - 1.60, C.muted, 0.65)
  );

  await until(S(5));
  await play(
    ...swap([computer]),
    ...say('A COMPUTER FOLLOWS INSTRUCTIONS', C.amber)
  );

  // 6: A fixed recipe.
  const recipeSteps = [
    ['1', 'Take a number'],
    ['2', 'Follow fixed steps'],
    ['3', 'Make a new number']
  ].map(([n, s], k) => {
    const y = (P ? 0.95 : 0.72) - k * 0.94;

    return new M.VGroup(
      roundRect(4.9, 0.72, 0, y, C.violet),
      glowDot(-2.03, y, C.violet, 0.10),
      txt(n, 17, C.ink, -2.03, y, true),
      txt(s, 21, C.ink, 0.18, y, false, 3.75)
    );
  });

  await until(S(6));
  await play(
    ...swap([]),
    stagger(recipeSteps, 1.6, 0.22),
    ...say('RECIPE = A FIXED LIST OF STEPS', C.violet)
  );

  // 7: Input → fixed recipe → output.
  const MY = P ? -0.10 : -0.45;
  const MX = P ? 2.24 : 3.85;
  const MW = P ? 1.90 : 2.60;

  const machine = new M.VGroup(
    roundRect(MW, 1.75, 0, MY, C.violet),
    new M.Circle({
      radius: 0.42,
      color: C.violet,
      strokeWidth: 2
    }).moveTo([0, MY + 0.21, 0]),
    line(-0.28, MY - 0.02, 0.28, MY + 0.44, C.violet, 3),
    line(-0.28, MY + 0.44, 0.28, MY - 0.02, C.violet, 3),
    txt(
      'FIXED RECIPE',
      P ? 16 : 19,
      C.violet, 0, MY - 0.54, true, MW - 0.18
    )
  );

  const machineIn = new M.VGroup(
    cell('number', -MX, MY, C.cyan, P ? 1.45 : 1.65),
    txt('IN', 15, C.muted, -MX, MY + 0.65, true)
  );

  const machineOut = new M.VGroup(
    cell('new', MX, MY, C.green, P ? 1.45 : 1.65),
    txt('OUT', 15, C.muted, MX, MY + 0.65, true)
  );

  const inArrow = arrow(
    -MX + (P ? 0.80 : 0.90), MY,
    -MW / 2 - 0.10, MY,
    C.cyan
  );

  const outArrow = arrow(
    MW / 2 + 0.10, MY,
    MX - (P ? 0.80 : 0.90), MY,
    C.green
  );

  await until(S(7));
  await play(
    ...swap([machine, machineIn, machineOut, inArrow, outArrow]),
    ...say('NUMBER IN → NEW NUMBER OUT', C.violet)
  );

  // 8: Feed the output back into the same machine.
  const feedbackY = MY - 1.48;

  const feedback = new M.VGroup(
    line(MX, MY - 0.43, MX, feedbackY, C.green, 2),
    line(MX, feedbackY, -MX, feedbackY, C.green, 2),
    arrow(-MX, feedbackY, -MX, MY - 0.43, C.green)
  );

  const feedbackLabel = txt(
    'feed the new number back in',
    P ? 17 : 19,
    C.green, 0, feedbackY - 0.36
  );

  const packet = glowDot(MX, MY - 0.46, C.green, 0.095);

  await until(S(8));
  await play(
    ...add(feedback, feedbackLabel, packet),
    ...say('REPEAT THE SAME RECIPE', C.green)
  );

  await play(
    new M.Transform(
      packet,
      glowDot(MX, feedbackY, C.green, 0.095),
      { runTime: 0.45 }
    )
  );

  await play(
    new M.Transform(
      packet,
      glowDot(-MX, feedbackY, C.green, 0.095),
      { runTime: 0.90 }
    )
  );

  await play(
    new M.Transform(
      packet,
      glowDot(-MX, MY - 0.45, C.green, 0.095),
      { runTime: 0.45 }
    ),
    new M.Indicate(machine, { color: C.green })
  );

  // ============================================================
  // 9–16: Five pseudorandom numbers on a zero-to-one ruler
  // ============================================================

  const ux = v => -RULER_W / 2 + v * RULER_W;
  const sequenceY = P ? -3.10 : -2.40;

  function ruler(y = RULER_Y) {
    const parts = [
      line(ux(0), y, ux(1), y, C.muted, 3)
    ];

    for (let k = 0; k <= 10; k++) {
      const v = k / 10;
      const major = k % 2 === 0;
      const tickH = major ? 0.11 : 0.065;

      parts.push(
        line(
          ux(v), y - tickH,
          ux(v), y + tickH,
          C.muted, major ? 2 : 1
        )
      );

      if (major) {
        parts.push(
          txt(
            k === 0 ? '0' : k === 10 ? '1' : v.toFixed(1),
            P ? 15 : 18,
            C.muted, ux(v), y - 0.34, true
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  const rulerPic = ruler();

  const seqLabel = txt(
    'ORDER OF THE DRAWS',
    P ? 19 : 17, C.muted, 0, sequenceY + 0.66, true
  );

  const seqSlots = U.map((_, k) =>
    outline(
      CELL_W, CELL_H,
      rowX(k), sequenceY,
      C.muted
    )
  );

  await until(S(9));
  await play(
    ...swap([rulerPic, seqLabel, ...seqSlots]),
    ...say('FIVE NUMBERS BETWEEN 0 AND 1')
  );

  const drawnDots = [];
  const drawnCells = [];

  // Alternating heights separate the nearby 0.29 and 0.36 labels.
  const dotHeights = [0.44, 0.84, 0.44, 0.84, 0.36];

  function drawPoint(v, k, color = C.cyan) {
    const x = ux(v);
    const y = RULER_Y + dotHeights[k];

    return new M.VGroup(
      line(x, RULER_Y + 0.08, x, y, color, 1.5),
      glowDot(x, y, color, P ? 0.095 : 0.11),
      txt(fmt(v), P ? 16 : 19, color, x, y + 0.34, true)
    );
  }

  // 10–14: Each draw appears at its exact narration beat.
  for (let k = 0; k < U.length; k++) {
    await until(S(10 + k));

    const point = drawPoint(U[k], k);
    const number = cell(U[k].toFixed(2), rowX(k), sequenceY);

    drawnDots.push(point);
    drawnCells.push(number);

    visible = visible.filter(o => o !== seqSlots[k]);
    visible.push(point, number);

    await play(
      new M.FadeOut(seqSlots[k], { runTime: 0.30 }),
      new M.FadeIn(point, { runTime: 0.45 }),
      new M.FadeIn(number, { runTime: 0.45 })
    );
  }

  // 15: Every equal-length interval has the same chance.
  const uniformBands = Array.from({ length: 10 }, (_, k) =>
    rect(
      RULER_W / 10 - 0.025,
      0.16,
      ux((k + 0.5) / 10),
      RULER_Y + 0.03,
      C.green,
      0.27,
      1
    )
  );

  const uniformNote = txt(
    'Equal lengths have equal chances',
    P ? 19 : 22,
    C.green, 0, P ? -1.86 : -1.10
  );

  await until(S(15));
  await play(
    stagger(uniformBands, 1.3, 0.08),
    ...add(uniformNote),
    ...say('EVERY SPOT IS EQUALLY LIKELY', C.green)
  );

  // 16: Follow the order of the draws: the points jump around.
  const jumpLines = U.slice(1).map((v, k) => {
    const prev = U[k];

    return arrow(
      ux(prev),
      RULER_Y + dotHeights[k],
      ux(v),
      RULER_Y + dotHeights[k + 1],
      C.violet
    );
  });

  await until(S(16));
  await play(
    ...remove(uniformNote, ...uniformBands),
    stagger(jumpLines, 2.8, 0.45),
    ...say('THE NUMBERS LOOK RANDOM', C.violet)
  );

  // ============================================================
  // 17–20: Pseudorandom and the starting seed
  // ============================================================

  // 17: There is a recipe behind those apparently random draws.
  const recipeY = P ? 0.50 : 0.40;
  const recipeCard = new M.VGroup(
    roundRect(P ? 4.7 : 5.3, 1.18, 0, recipeY, C.violet),
    txt(
      'SAME FIXED RECIPE',
      P ? 20 : 23,
      C.violet, 0, recipeY + 0.24, true
    ),
    txt(
      'Step by step',
      18, C.muted, 0, recipeY - 0.27
    )
  );

  const madeRowY = P ? -1.80 : -1.65;
  const madeRow = valueRow(U, madeRowY);

  const recipeDown = arrow(
    0, recipeY - 0.66,
    0, madeRowY + 0.48,
    C.cyan
  );

  await until(S(17));
  await play(
    ...swap([recipeCard, recipeDown, ...madeRow]),
    ...say('NOT TRUE CHANCE: MADE BY A RECIPE', C.amber)
  );

  // 18: Name the concept.
  const pseudoNote = new M.VGroup(
    txt('PSEUDORANDOM', 29, C.violet, 0, P ? -3.02 : -2.30, true),
    txt(
      'Looks random, but is not truly random',
      P ? 17 : 19,
      C.ink, 0, P ? -3.58 : -2.72
    )
  );

  await until(S(18));
  await play(
    ...add(pseudoNote),
    ...say('PSEUDO = LOOKS LIKE IT', C.violet)
  );

  // 19: The starting number is called the seed.
  const seedY = P ? 0.72 : 0.68;
  const seedRecipeY = P ? -0.72 : -0.48;
  const seedOutputY = P ? -2.78 : -2.10;

  const seedPlaceholder = new M.VGroup(
    roundRect(2.30, 0.78, 0, seedY, C.amber),
    txt('SEED: ?', 24, C.amber, 0, seedY, true)
  );

  const seedRecipe = new M.VGroup(
    roundRect(3.2, 0.78, 0, seedRecipeY, C.violet),
    txt('FIXED RECIPE', 19, C.violet, 0, seedRecipeY, true)
  );

  const seedLink = arrow(
    0, seedY - 0.44,
    0, seedRecipeY + 0.45,
    C.amber
  );

  const outputLink = arrow(
    0, seedRecipeY - 0.45,
    0, seedOutputY + 0.44,
    C.cyan
  );

  const seedOutputs = valueRow(U, seedOutputY);

  await until(S(19));
  await play(
    ...swap([
      seedPlaceholder,
      seedRecipe,
      seedLink,
      outputLink,
      ...seedOutputs
    ]),
    ...say('SEED = THE STARTING NUMBER', C.amber)
  );

  // 20: The seed was 101.
  const seed101 = new M.VGroup(
    roundRect(2.30, 0.78, 0, seedY, C.amber),
    txt('SEED: 101', 24, C.amber, 0, seedY, true)
  );

  await until(S(20));
  await play(
    ...remove(seedPlaceholder),
    ...add(seed101),
    ...say('OUR SEED = 101', C.amber)
  );

  // ============================================================
  // 21–25: Replay the seed and compare a different seed
  // ============================================================

  const R1Y = P ? 0.42 : 0.40;
  const R2Y = P ? -2.05 : -1.95;

  const run1Label = txt(
    'FIRST RUN  ·  SEED 101',
    P ? 19 : 21,
    C.amber, 0, R1Y + 0.75, true
  );

  const run2Label = txt(
    'SECOND RUN  ·  SEED 101',
    P ? 19 : 21,
    C.amber, 0, R2Y + 0.75, true
  );

  const firstRun = valueRow(U, R1Y);

  const replaySlots = U.map((_, k) =>
    outline(CELL_W, CELL_H, rowX(k), R2Y, C.muted)
  );

  // 21: Reset the same recipe to the same seed.
  await until(S(21));
  await play(
    ...swap([
      run1Label,
      run2Label,
      ...firstRun,
      ...replaySlots
    ]),
    ...say('RUN AGAIN WITH SEED 101', C.amber)
  );

  // 22: Replay the five numbers in narration order.
  const replay = valueRow(U, R2Y, C.green);

  await until(S(22));

  const replayDuration = Math.max(
    0.8,
    (E(22) - S(22)) / 5
  );

  for (let k = 0; k < replay.length; k++) {
    if (k > 0) {
      await until(S(22) + k * replayDuration);
    }

    visible = visible.filter(o => o !== replaySlots[k]);
    visible.push(replay[k]);

    await play(
      new M.FadeOut(replaySlots[k], { runTime: 0.25 }),
      new M.FadeIn(replay[k], { runTime: 0.45 }),
      new M.Indicate(
        firstRun[k],
        { color: C.green, runTime: 0.65 }
      )
    );
  }

  // 23: All five numbers match, including their order.
  const matchY = P ? -0.75 : -0.58;

  const matchMarks = U.map((_, k) =>
    txt('=', 27, C.green, rowX(k), matchY, true)
  );

  const rowWidth = 4 * ROW_SP + CELL_W + 0.24;

  const matchFrame1 = outline(
    rowWidth, CELL_H + 0.20,
    0, R1Y, C.green
  );

  const matchFrame2 = outline(
    rowWidth, CELL_H + 0.20,
    0, R2Y, C.green
  );

  const matchNote = tag(
    'EXACT MATCH',
    C.green,
    0, P ? -3.32 : -2.95
  );

  await until(S(23));
  await play(
    stagger(matchMarks, 1.15, 0.12),
    ...add(matchFrame1, matchFrame2, matchNote),
    ...say('SAME NUMBERS. SAME ORDER.', C.green)
  );

  // 24: A perfectly repeatable card shuffle.
  function playingCard(rank, suit, x, y, red = false) {
    const w = P ? 0.90 : 1.10;
    const h = P ? 1.18 : 1.25;
    const color = red ? DC[3] : C.ink;

    return new M.VGroup(
      roundRect(w, h, x, y, color),
      txt(rank, 22, color, x, y + 0.22, true),
      txt(suit, 24, color, x, y - 0.20)
    );
  }

  const deckOrder = [
    ['7', '♣', false],
    ['A', '♥', true],
    ['3', '♠', false],
    ['K', '♦', true],
    ['9', '♣', false]
  ];

  const cardY1 = P ? 0.45 : 0.35;
  const cardY2 = P ? -2.10 : -1.78;

  const deck1 = deckOrder.map(([r, s, red], k) =>
    playingCard(r, s, rowX(k), cardY1, red)
  );

  const deck2 = deckOrder.map(([r, s, red], k) =>
    playingCard(r, s, rowX(k), cardY2, red)
  );

  const shuffle1 = txt(
    'SHUFFLE 101',
    19, C.amber, 0, cardY1 + 0.91, true
  );

  const shuffle2 = txt(
    'REPEAT SHUFFLE 101',
    19, C.amber, 0, cardY2 + 0.91, true
  );

  await until(S(24));
  await play(
    ...swap([shuffle1, shuffle2, ...deck1]),
    stagger(deck2, 2.4, 0.20),
    ...say('THE SEED NAMES A REPEATABLE SHUFFLE', C.violet)
  );

  // 25: A different seed gives a fresh batch.
  const changedLabel1 = txt(
    'SEED 101',
    21, C.amber, 0, R1Y + 0.74, true
  );

  const changedLabel2 = txt(
    'SEED 102',
    21, C.violet, 0, R2Y + 0.74, true
  );

  const original = valueRow(U, R1Y);
  const changed = valueRow(U2, R2Y, C.violet);

  const differentMarks = U.map((_, k) =>
    txt('≠', 26, C.violet, rowX(k), matchY, true)
  );

  await until(S(25));
  await play(
    ...swap([
      changedLabel1,
      changedLabel2,
      ...original
    ]),
    stagger(changed, 1.8, 0.15),
    ...say('DIFFERENT SEED → DIFFERENT DRAWS', C.violet)
  );

  await play(stagger(differentMarks, 0.8, 0.10));

  // ============================================================
  // 26–32: Why repeatability matters
  // ============================================================

  // 26: Why would we want the same numbers twice?
  await until(S(26));
  await play(
    ...say('WHY REPEAT THE SAME NUMBERS?', C.amber)
  );

  // 27: Preview of the next lesson: numbers become parcel delays.
  const MAP_SP = P ? 1.14 : 1.10;
  const mapX = k => CX + (k - 2) * MAP_SP;

  const INPUT_Y = P ? 0.55 : 0.42;
  const DELAY_Y = P ? -2.20 : -1.60;

  const mapWidth = P ? 1.02 : 1.00;

  const mapInputs = U.map((v, k) =>
    cell(fmt(v), mapX(k), INPUT_Y, C.cyan, mapWidth)
  );

  const mapTitle = txt(
    'FIVE UNIFORM DRAWS',
    P ? 19 : 18, C.muted, CX, INPUT_Y + 0.74, true
  );

  const mapArrows = U.map((_, k) =>
    arrow(
      mapX(k), INPUT_Y - 0.43,
      mapX(k), DELAY_Y + 0.46,
      C.muted
    )
  );

  const mapQuestions = U.map((_, k) =>
    cell('?', mapX(k), DELAY_Y, C.muted, mapWidth)
  );

  const mapDelayTitle = txt(
    'FIVE PARCEL DELAYS',
    P ? 19 : 18, C.muted, CX, DELAY_Y - 0.75, true
  );

  await until(S(27));
  await play(
    ...swap([
      mapTitle,
      ...mapInputs,
      ...mapArrows,
      ...mapQuestions,
      mapDelayTitle
    ]),
    ...say('NEXT: TURN DRAWS INTO DELAYS')
  );

  // 28: 0.94, 0.36, 0.78, 0.59, 0.29
  // become 30, 0, 20, 10, 0.
  const mapResults = DELAYS.map((d, k) =>
    cell(
      String(d),
      mapX(k), DELAY_Y,
      delayColor(d), mapWidth
    )
  );

  await until(S(28));

  const mapRevealDuration = Math.max(
    0.5,
    (E(28) - S(28)) / 5
  );

  for (let k = 0; k < DELAYS.length; k++) {
    if (k > 0) {
      await until(S(28) + k * mapRevealDuration);
    }

    visible = visible.filter(o => o !== mapQuestions[k]);
    visible.push(mapResults[k]);

    await play(
      new M.FadeOut(mapQuestions[k], { runTime: 0.25 }),
      new M.FadeIn(mapResults[k], { runTime: 0.45 }),
      new M.Indicate(
        mapInputs[k],
        { color: delayColor(DELAYS[k]), runTime: 0.6 }
      )
    );
  }

  // 29: Total 60; divide by five; mean 12.
  const sumBox = fbox(
    [
      '30 + 0 + 20 + 10 + 0',
      ['total = 60 minutes', C.amber]
    ],
    C.amber
  );

  await until(S(29));
  await play(
    ...add(sumBox),
    ...say('TOTAL = 60 MINUTES', C.amber)
  );

  await until(S(29) + 3.1);

  const meanBox = fbox(
    [
      '60 ÷ 5',
      ['mean = 12 minutes', C.green]
    ],
    C.green
  );

  await play(
    ...remove(sumBox),
    ...add(meanBox),
    ...say('AVERAGE = 12 MINUTES', C.green)
  );

  // 30: A colleague asks how the answer was obtained.
  const reportY = P ? 0.15 : -0.40;

  const report = new M.VGroup(
    roundRect(P ? 5.2 : 5.8, 2.30, 0, reportY, C.green),
    txt('DEPOT REPORT', 19, C.muted, 0, reportY + 0.77, true),
    txt('12 min', 44, C.green, 0, reportY + 0.02, true),
    txt('average delay', 19, C.ink, 0, reportY - 0.75)
  );

  const question = txt(
    'How did you get 12?',
    P ? 23 : 27,
    C.amber, 0, reportY - 1.78
  );

  await until(S(30));
  await play(
    ...swap([report, question]),
    ...say('CAN SOMEONE CHECK YOUR RESULT?', C.amber)
  );

  // 31: Replay the full chain of evidence.
  const auditSeedY = P ? 1.00 : 0.85;
  const auditDrawY = P ? -0.32 : -0.18;
  const auditDelayY = P ? -1.94 : -1.38;
  const auditResultY = P ? -3.50 : -2.48;

  const auditSeed = tag(
    'SEED 101',
    C.amber, 0, auditSeedY, 19
  );

  const auditDraws = valueRow(U, auditDrawY);

  const auditDelays = DELAYS.map((d, k) =>
    cell(
      String(d),
      rowX(k), auditDelayY,
      delayColor(d)
    )
  );

  const auditArrows = U.map((_, k) =>
    arrow(
      rowX(k), auditDrawY - 0.40,
      rowX(k), auditDelayY + 0.43,
      C.muted
    )
  );

  const auditResult = tag(
    '60 ÷ 5 = 12 MINUTES',
    C.green, 0, auditResultY, 20
  );

  await until(S(31));
  await play(
    ...swap([auditSeed, ...auditDraws]),
    ...say('REPLAY AND CHECK EVERY STEP', C.green)
  );

  await until(S(31) + 1.4);

  await play(
    ...add(...auditArrows),
    stagger(auditDelays, 1.2, 0.13)
  );

  await until(S(31) + 3.0);

  await play(
    ...add(auditResult)
  );

  // 32: Without the recorded seed, we cannot reliably replay.
  const missingSeed = tag(
    'SEED: NOT RECORDED',
    DC[3], 0, auditSeedY, 18
  );

  const missingDraws = U.map((_, k) =>
    cell('?', rowX(k), auditDrawY, C.muted)
  );

  const missingDelays = U.map((_, k) =>
    cell('?', rowX(k), auditDelayY, C.muted)
  );

  const missingResult = tag(
    'CANNOT CHECK THE EXACT BATCH',
    DC[3], 0, auditResultY, 17
  );

  await until(S(32));
  await play(
    ...swap([
      missingSeed,
      ...missingDraws,
      ...auditArrows.map((_, k) =>
        arrow(
          rowX(k), auditDrawY - 0.40,
          rowX(k), auditDelayY + 0.43,
          C.muted
        )
      ),
      ...missingDelays,
      missingResult
    ]),
    ...say('WITHOUT THE SEED, REPLAY IS LOST', DC[3])
  );

  // ============================================================
  // 33–37: The method in two short lines
  // ============================================================

  // Plain pseudocode, rather than language-specific syntax.
  const codeY = P ? 0.10 : -0.28;
  const codeW = P ? 6.20 : 7.20;
  const codeH = 1.90;
  const codeLeft = -codeW / 2 + 0.40;

  const codePanel = new M.VGroup(
    roundRect(codeW, codeH, 0, codeY, C.violet),
    txt(
      'RECIPE IN PSEUDOCODE',
      17, C.muted, 0, codeY + 0.61, true
    ),
    line(
      -codeW / 2 + 0.20, codeY + 0.34,
      codeW / 2 - 0.20, codeY + 0.34,
      C.muted, 1
    )
  );

  function codeLine(s, y, color) {
    const t = T(s, P ? 22 : 24, color, true);
    const maxw = codeW - 0.80;

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([codeLeft + t.getWidth() / 2, y, 0]);
    return t;
  }

  const codeLine1 = codeLine(
    'seed = 101',
    codeY + 0.05,
    C.amber
  );

  const codeLine2 = codeLine(
    'draws = uniform(seed, 5)',
    codeY - 0.53,
    C.cyan
  );

  // 33: Two short lines.
  await until(S(33));
  await play(
    ...swap([codePanel]),
    ...say('THE WHOLE METHOD IN TWO LINES', C.violet)
  );

  // 34: Set the seed.
  await until(S(34));
  await play(
    ...add(codeLine1),
    ...say('LINE 1: SET THE SEED', C.amber)
  );

  // 35: Draw five uniform numbers.
  await until(S(35));
  await play(
    ...add(codeLine2),
    ...say('LINE 2: DRAW FIVE UNIFORM NUMBERS')
  );

  // 36: Uniform means equal chance along the whole ruler.
  const uniformY = P ? -2.25 : -1.92;

  const uniformRuler = ruler(uniformY);

  const uniformStrip = Array.from({ length: 10 }, (_, k) =>
    rect(
      RULER_W / 10 - 0.025,
      0.16,
      ux((k + 0.5) / 10),
      uniformY + 0.035,
      C.green, 0.43, 1
    )
  );

  const uniformCaption = txt(
    'Equal-length intervals have equal chances',
    P ? 17 : 19,
    C.green, 0, uniformY - 0.76
  );

  await until(S(36));
  await play(
    ...add(uniformRuler, uniformCaption),
    stagger(uniformStrip, 2.2, 0.12),
    ...say('UNIFORM = EQUALLY LIKELY', C.green)
  );

  // 37: Repeat, verify, and fix mistakes.
  const repeatFlowY = P ? 0.68 : 0.53;

  const repeatSeed = tag(
    'SEED 101',
    C.amber, 0, repeatFlowY, 20
  );

  const repeatDown1 = arrow(
    0, repeatFlowY - 0.35,
    0, repeatFlowY - 0.95,
    C.amber
  );

  const repeatDrawY = repeatFlowY - 1.42;
  const repeatDraws = valueRow(U, repeatDrawY);

  const repeatDown2 = arrow(
    0, repeatDrawY - 0.44,
    0, repeatDrawY - 0.97,
    C.green
  );

  const verified = tag(
    'SAME RESULT: 12 MINUTES',
    C.green, 0, repeatDrawY - 1.38, 19
  );

  const verifyNote = txt(
    'Replay. Check. Fix mistakes.',
    P ? 21 : 23,
    C.ink, 0, repeatDrawY - 2.00
  );

  await until(S(37));
  await play(
    ...swap([
      repeatSeed,
      repeatDown1,
      ...repeatDraws,
      repeatDown2,
      verified,
      verifyNote
    ]),
    ...say('REPEATABLE SIMULATION', C.green)
  );

  // ============================================================
  // 38–40: Common trap — resetting the same seed every day
  // ============================================================

  const DAY_COLS = P ? 2 : 5;
  const DAY_DX = P ? 2.38 : 2.22;
  const DAY_DY = P ? 1.38 : 1.65;
  const DAY_TOP = P ? 1.10 : 0.45;

  function dayPosition(k) {
    return [
      (k % DAY_COLS - (DAY_COLS - 1) / 2) * DAY_DX,
      DAY_TOP - Math.floor(k / DAY_COLS) * DAY_DY
    ];
  }

  const emptyDays = Array.from({ length: 10 }, (_, k) => {
    const [x, y] = dayPosition(k);
    return miniDay(null, x, y, k + 1);
  });

  // 38: Ten different pretend days are wanted.
  await until(S(38));
  await play(
    ...swap([]),
    stagger(emptyDays, 2.0, 0.10),
    ...say('WE WANT 10 DIFFERENT PRETEND DAYS', C.amber)
  );

  // 39: Resetting seed 101 before every day reproduces the
  // exact same five parcels, in the exact same order.
  const identicalDays = Array.from({ length: 10 }, (_, k) => {
    const [x, y] = dayPosition(k);
    return miniDay(DELAYS, x, y, k + 1, SEED);
  });

  await until(S(39));
  await play(
    ...remove(...emptyDays),
    stagger(identicalDays, 2.8, 0.10),
    ...say('SAME SEED EVERY DAY = SAME DAY', DC[3])
  );

  // 40: Ten displayed days, but only one distinct simulated batch.
  const [firstDayX, firstDayY] = dayPosition(0);

  const firstDayOutline = outline(
    P ? 2.31 : 2.16,
    P ? 1.40 : 1.48,
    firstDayX, firstDayY,
    C.amber
  );

  const copiedNote = tag(
    '1 DISTINCT DAY · 10 COPIES',
    DC[3],
    0, P ? -5.05 : -2.42,
    P ? 18 : 21
  );

  await until(S(40));
  await play(
    ...add(firstDayOutline, copiedNote),
    ...say('NOT 10 DAYS OF INDEPENDENT EVIDENCE', DC[3])
  );

  // ============================================================
  // 41–42: Correct practice and final takeaway
  // ============================================================

  // 41: Keep a seed to replay; use fresh seeds for fresh runs.
  const seedRowsY = P
    ? [0.73, -1.17, -3.07]
    : [0.68, -0.78, -2.12];

  const seedRows = [
    [101, U, C.cyan],
    [102, U2, C.violet],
    [103, U3, C.green]
  ];

  const freshRuns = seedRows.map(([seed, values, color], i) => {
    const y = seedRowsY[i];

    if (P) {
      const label = txt(
        `SEED ${seed}`,
        18, C.amber, 0, y + 0.64, true
      );

      return new M.VGroup(
        label,
        ...valueRow(values, y, color)
      );
    }

    const label = txt(
      `SEED ${seed}`,
      19, C.amber, -4.65, y, true
    );

    return new M.VGroup(
      label,
      arrow(-3.65, y, -2.80, y, C.muted),
      ...valueRow(values, y, color, 1.30)
    );
  });

  await until(S(41));
  await play(
    ...swap([]),
    stagger(freshRuns, 2.2, 0.23),
    ...say('KEEP SEEDS TO REPLAY; CHANGE FOR NEW RUNS', C.green)
  );

  // 42: Final one-picture summary.
  const finalSeedY = P ? 1.0 : 0.88;
  const finalRecipeY = P ? -0.45 : -0.38;
  const finalDrawY = P ? -2.36 : -1.83;

  const finalSeed = new M.VGroup(
    roundRect(2.7, 0.78, 0, finalSeedY, C.amber),
    txt('SEED 101', 25, C.amber, 0, finalSeedY, true)
  );

  const finalRecipe = new M.VGroup(
    roundRect(3.75, 0.86, 0, finalRecipeY, C.violet),
    txt(
      'FIXED RECIPE',
      23, C.violet, 0, finalRecipeY, true
    )
  );

  const finalArrow1 = arrow(
    0, finalSeedY - 0.44,
    0, finalRecipeY + 0.49,
    C.amber
  );

  const finalArrow2 = arrow(
    0, finalRecipeY - 0.49,
    0, finalDrawY + 0.45,
    C.cyan
  );

  const finalDraws = valueRow(U, finalDrawY);

  const finalNote = tag(
    'SAME SEED → SAME SEQUENCE',
    C.green, 0, P ? -3.72 : -2.60,
    P ? 18 : 20
  );

  await until(S(42));
  await play(
    ...swap([
      finalSeed,
      finalArrow1,
      finalRecipe,
      finalArrow2,
      ...finalDraws,
      finalNote
    ]),
    ...say('PSEUDORANDOM SAMPLING', C.violet)
  );

  await until(S(42) + 2.4);

  await play(
    new M.Indicate(finalSeed, { color: C.amber })
  );

  await until(S(42) + 4.0);

  await play(
    new M.LaggedStart(
      finalDraws.map(d =>
        new M.Indicate(d, { color: C.green })
      ),
      {
        lagRatio: 0.15,
        runTime: 1.8
      }
    ),
    ...say('THE SEED LETS YOU REPLAY EXACTLY', C.green)
  );

  await until(E(42));
}

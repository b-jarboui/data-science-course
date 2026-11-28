// lesson 5.2.5
// Exponential lifetimes — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied reference engine API; browser playback has not been tested.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;

  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const RATE = 1 / 70;
  const DAILY = 69 / 70;
  const MEAN = 10;
  const MEDIAN = MEAN * Math.log(2);

  const survival = t => Math.exp(-t / MEAN);

  const pt = (x, y) => [x, y, 0];

  // ------------------------------------------------------------
  // Shared drawing helpers
  // ------------------------------------------------------------

  function txt(s, x, y, size = 20, color = C.ink, mono = false) {
    const t = T(s, P && size < 18 ? 18 : size, color, mono);
    t.moveTo(pt(x, y));
    return t;
  }

  // phone only: enlarge a self-contained picture and centre it lower on the screen
  function pfit(g, s, y) {
    if (P) { g.scale(s); g.moveTo(pt(0, y)); }
    return g;
  }

  function fitText(s, x, y, size, color, maxw, mono = false) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));
    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, sw = 2) {
    return new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth: sw
    });
  }

  function dashed(x1, y1, x2, y2, color = C.muted) {
    return new M.DashedLine({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color
    });
  }

  function rect(x, y, w, h, color, opacity = 0.2, sw = 2) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function rounded(x, y, w, h, color, opacity = 0.15) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(x, y, radius = 0.1, color = C.cyan, opacity = 1) {
    const d = new M.Dot({
      point: pt(x, y),
      radius,
      color
    });

    d.setFill(color, opacity);
    return d;
  }

  function glow(x, y, radius = 0.1, color = C.cyan) {
    const halo = dot(x, y, radius * 2.1, color, 0.16);
    const core = dot(x, y, radius, color, 1);

    return new M.VGroup(halo, core);
  }

  function tag(s, x, y, color = C.cyan, size = 17) {
    const p = pill(s, color, size);
    p.moveTo(pt(x, y));
    return p;
  }

  function arrow(x1, y1, x2, y2, color = C.amber, sw = 3) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.17;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, sw),
      line(
        x2, y2,
        x2 - h * Math.cos(a - 0.55),
        y2 - h * Math.sin(a - 0.55),
        color, sw
      ),
      line(
        x2, y2,
        x2 - h * Math.cos(a + 0.55),
        y2 - h * Math.sin(a + 0.55),
        color, sw
      )
    );
  }

  function cross(x, y, size = 0.15, color = C.amber) {
    return new M.VGroup(
      line(x - size, y - size, x + size, y + size, color, 3),
      line(x - size, y + size, x + size, y - size, color, 3)
    );
  }

  function bolt(x, y, color = C.amber, scale = 1) {
    const points = [
      [x + 0.10 * scale, y + 0.55 * scale],
      [x - 0.24 * scale, y + 0.02 * scale],
      [x + 0.04 * scale, y + 0.02 * scale],
      [x - 0.12 * scale, y - 0.52 * scale],
      [x + 0.32 * scale, y + 0.16 * scale],
      [x + 0.04 * scale, y + 0.16 * scale]
    ];

    return new M.VGroup(
      ...points.slice(1).map((p, i) =>
        line(
          points[i][0], points[i][1],
          p[0], p[1],
          color, 4
        )
      )
    );
  }

  // ------------------------------------------------------------
  // Formula box — same styling and placement as the reference
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    if (!lines) {
      const a = boxNow ? [new M.FadeOut(boxNow)] : [];
      boxNow = null;
      return a;
    }

    const size = P ? 22 : 21;
    const lh = P ? 0.38 : 0.42;

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
    const ht = rows.length * lh + 0.32;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.16 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw *
        (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.32 : 3.4;

    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;

    return a;
  }

  // ------------------------------------------------------------
  // Picture management
  // Objects are grouped only before they appear on screen.
  // ------------------------------------------------------------

  let picture = [];
  let overlays = [];

  function clearOverlays() {
    const a = overlays.map(o => new M.FadeOut(o));
    overlays = [];
    return a;
  }

  function clearPicture() {
    const a = [
      ...clearOverlays(),
      ...picture.map(o => new M.FadeOut(o))
    ];

    picture = [];
    return a;
  }

  function replacePicture(...objects) {
    const a = clearPicture();

    picture = objects;

    return [
      ...a,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function replaceOverlay(...objects) {
    const a = clearOverlays();

    overlays = objects;

    return [
      ...a,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  // ------------------------------------------------------------
  // Packaging line and sealing head
  // ------------------------------------------------------------

  const MY = P ? -1.5 : -0.55;

  function riceBag(x, y, sealed = true) {
    const body = rounded(x, y, 0.78, 1.02, C.ink, 0.10);

    const label = txt(
      '500 g',
      x, y - 0.02,
      16, C.ink, true
    );

    const top = sealed
      ? line(x - 0.32, y + 0.39, x + 0.32, y + 0.39, C.green, 4)
      : new M.VGroup(
          line(x - 0.32, y + 0.39, x - 0.05, y + 0.52, C.amber, 2),
          line(x + 0.05, y + 0.52, x + 0.32, y + 0.39, C.amber, 2)
        );

    const bottom = line(
      x - 0.29, y - 0.36,
      x + 0.29, y - 0.36,
      C.muted, 2
    );

    return new M.VGroup(body, label, top, bottom);
  }

  function sealingMachine(failed = false) {
    const status = failed ? C.amber : C.cyan;

    const belt = rounded(
      CX, MY - 1.13,
      5.65, 0.42,
      C.muted, 0.12
    );

    const rollers = Array.from({ length: 7 }, (_, i) => {
      const r = new M.Circle({
        radius: 0.13,
        color: C.muted,
        strokeWidth: 2
      });

      r.moveTo(pt(CX + (i - 3) * 0.76, MY - 1.13));

      return r;
    });

    const supportL = rect(
      CX - 1.34, MY + 0.10,
      0.16, 2.0,
      C.muted, 0.28
    );

    const supportR = rect(
      CX + 1.34, MY + 0.10,
      0.16, 2.0,
      C.muted, 0.28
    );

    const topBeam = rect(
      CX, MY + 1.08,
      2.84, 0.20,
      C.muted, 0.28
    );

    const motor = rounded(
      CX, MY + 0.69,
      0.92, 0.46,
      status, 0.20
    );

    const stem = rect(
      CX, MY + 0.34,
      0.18, 0.28,
      status, 0.35
    );

    const jaw = rounded(
      CX, MY + 0.10,
      1.03, 0.19,
      status, failed ? 0.18 : 0.86
    );

    const heat = failed
      ? bolt(CX + 0.90, MY + 0.46, C.amber, 0.85)
      : new M.VGroup(
          ...[-0.26, 0, 0.26].map(dx =>
            line(
              CX + dx, MY - 0.03,
              CX + dx, MY - 0.20,
              C.amber, 3
            )
          )
        );

    const label = txt(
      failed ? 'FAILED — REPLACE' : 'HEATED SEALING HEAD',
      CX, MY + 1.49,
      19, status
    );

    const statusLight = glow(
      CX + 1.75, MY + 0.73,
      0.09, failed ? C.amber : C.green
    );

    return new M.VGroup(
      belt,
      ...rollers,
      supportL,
      supportR,
      topBeam,
      motor,
      stem,
      jaw,
      heat,
      statusLight,
      riceBag(CX - 2.12, MY - 0.40, false),
      riceBag(CX, MY - 0.40, !failed),
      riceBag(CX + 2.12, MY - 0.40, true),
      label
    );
  }

  // 0 — the heated sealing head

  await until(S(0));

  let machine = pfit(sealingMachine(false), 1.3, -2.3);

  await play(
    ...replacePicture(machine),
    ...say('THE PACKAGING LINE')
  );

  // 1 — sudden failure

  await until(S(1));

  machine = pfit(sealingMachine(true), 1.3, -2.3);

  await play(
    ...replacePicture(machine),
    ...say('A SUDDEN FAILURE', C.amber)
  );

  // ------------------------------------------------------------
  // Lifetime lines
  // ------------------------------------------------------------

  const LIFE_W = P ? Math.min(5.9, FW - 1.35) : 5.9;
  const LIFE_X = CX - LIFE_W / 2;

  const lifeX = t => LIFE_X + t / 15 * LIFE_W;

  function lifeRow(y, age, more, title, color = C.cyan) {
    const end = age + more;

    const objects = [
      txt(title, CX, y + 0.65, 20, C.ink),
      line(lifeX(0), y, lifeX(15), y, C.muted, 2)
    ];

    const ticks = [...new Set([0, age, end])].sort((a, b) => a - b);

    ticks.forEach(t => {
      objects.push(
        line(lifeX(t), y - 0.09, lifeX(t), y + 0.09, C.muted),
        txt(String(t), lifeX(t), y - 0.33, 17, C.muted, true)
      );
    });

    if (age > 0) {
      objects.push(
        line(lifeX(0), y, lifeX(age), y, C.green, 7),
        txt(
          `${age} weeks worked`,
          (lifeX(0) + lifeX(age)) / 2,
          y + 0.28,
          16, C.green
        )
      );
    }

    objects.push(
      arrow(lifeX(age), y, lifeX(end), y, color, 5),
      glow(lifeX(age), y, 0.08, color),
      txt(
        `${more} weeks?`,
        (lifeX(age) + lifeX(end)) / 2,
        y + 0.28,
        16, color
      )
    );

    return new M.VGroup(...objects);
  }

  function questions(both = false) {
    const y1 = both
      ? (P ? -0.65 : 0.05)
      : (P ? -1.75 : -0.45);

    const objects = [
      lifeRow(y1, 0, 10, 'A brand-new head', C.cyan)
    ];

    if (both) {
      const y2 = P ? -3.05 : -1.65;

      objects.push(
        lifeRow(y2, 10, 5, 'A head already 10 weeks old', C.amber)
      );
    }

    return new M.VGroup(...objects);
  }

  // 2 — first question

  await until(S(2));

  await play(
    ...replacePicture(questions(false)),
    ...say('WILL IT LAST 10 WEEKS?', C.amber),
    ...fbox([
      'Question 1',
      ['More than 10 weeks?', C.amber]
    ], C.amber)
  );

  // 3 — second question

  await until(S(3));

  await play(
    ...replacePicture(questions(true)),
    ...say('WHAT ABOUT AN OLDER HEAD?', C.amber),
    ...fbox([
      'Question 2',
      'Already worked 10 weeks',
      ['Another 5 weeks?', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Records: one failure per ten weeks on average
  // ------------------------------------------------------------

  function averageLifePicture() {
    const y = P ? -1.9 : -0.55;
    const w = 5.4;
    const left = CX - w / 2;
    const x = t => left + t / 10 * w;

    const objects = [
      txt('Average lifetime', CX, y + 1.00, 23, C.ink),
      line(x(0), y, x(10), y, C.cyan, 6),
      glow(x(0), y, 0.11, C.green),
      cross(x(10), y, 0.16, C.amber)
    ];

    for (let t = 0; t <= 10; t++) {
      objects.push(
        line(x(t), y - 0.09, x(t), y + 0.09, C.muted)
      );

      if (t % 2 === 0) {
        objects.push(
          txt(String(t), x(t), y - 0.36, 17, C.muted, true)
        );
      }
    }

    objects.push(
      txt('new head', x(0) + 0.42, y + 0.40, 17, C.green),
      txt('failure', x(10) - 0.32, y + 0.40, 17, C.amber),
      txt('weeks', CX, y - 0.77, 17, C.muted),
      tag('10 WEEKS ON AVERAGE', CX, y - 1.25, C.cyan, 18)
    );

    return new M.VGroup(...objects);
  }

  // 4 — records give the average

  await until(S(4));

  await play(
    ...replacePicture(pfit(averageLifePicture(), 1.2, -2.5)),
    ...say('LOOK AT THE RECORDS'),
    ...fbox([
      'Average life',
      ['10 weeks', C.cyan],
      '1 failure per 10 weeks'
    ])
  );

  // 5 — no gradual wear, only sudden events

  const shockY = P ? -0.20 : 0.83;

  const shock = new M.VGroup(
    bolt(CX - 1.25, shockY, C.amber, 0.8),
    txt('POWER SPIKE', CX + 0.36, shockY, 20, C.amber)
  );

  await until(S(5));

  await play(
    ...replaceOverlay(shock),
    ...say('SUDDEN SHOCKS — NOT WEAR', C.amber),
    ...fbox([
      'Sudden events',
      ['Not slow wear', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // The daily chance: 1 failure in 70 working heads
  // ------------------------------------------------------------

  function dailyRiskPicture() {
    const top = P ? 0.65 : 0.65;
    const sx = P ? 0.62 : 0.49;
    const sy = P ? 0.6 : 0.32;

    const dots = [];

    for (let i = 0; i < 70; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);

      const x = CX + (col - 4.5) * sx;
      const y = top - row * sy;

      dots.push(
        glow(
          x, y,
          P ? 0.14 : 0.092,
          i === 69 ? C.amber : C.cyan
        )
      );
    }

    const ly = top - 6 * sy - 0.65;

    return new M.VGroup(
      ...dots,
      glow(CX - 1.85, ly, 0.085, C.cyan),
      txt('69 survive', CX - 0.77, ly, 19, C.cyan),
      glow(CX + 1.15, ly, 0.085, C.amber),
      txt('1 fails', CX + 2.00, ly, 19, C.amber),
      txt(
        'Illustrative daily chance',
        CX, ly - 0.48,
        17, C.muted
      )
    );
  }

  // 6 — same small chance each day

  await until(S(6));

  await play(
    ...replacePicture(dailyRiskPicture()),
    ...say('SAME CHANCE EACH DAY', C.amber),
    ...fbox([
      'Daily failure chance',
      ['about 1 in 70', C.amber],
      'For any working head'
    ], C.amber)
  );

  // 7 — days and weeks

  await until(S(7));

  await play(
    ...say('70 DAYS = 10 WEEKS'),
    ...fbox([
      '7 days = 1 week',
      '70 days = 10 weeks',
      ['Average life = 10 weeks', C.cyan]
    ])
  );

  // 8 — constant failure rate

  await until(S(8));

  await play(
    ...say('CONSTANT FAILURE RATE', C.green),
    ...fbox([
      'Failure rate',
      ['1 per 10 weeks', C.green],
      'Same whatever the age'
    ], C.green)
  );

  // ------------------------------------------------------------
  // Follow 100 heads through time.
  //
  // The dots illustrate rounded expected survivor counts,
  // rather than claiming that every real group behaves exactly
  // this way.
  // ------------------------------------------------------------

  const GRID_TOP = P ? 0.65 : 0.48;
  const GRID_DX = P ? 0.56 : 0.45;
  const GRID_DY = P ? 0.47 : 0.27;
  const GRID_R = P ? 0.125 : 0.084;

  const COUNT_Y = P ? -4.35 : -2.48;

  const gridPoint = i => {
    const col = i % 10;
    const row = Math.floor(i / 10);

    return [
      CX + (col - 4.5) * GRID_DX,
      GRID_TOP - row * GRID_DY,
      0
    ];
  };

  // Fixed permutation makes the thinning scattered and repeatable.
  const order = Array.from(
    { length: 100 },
    (_, i) => (i * 37) % 100
  );

  let cohortFrame = null;
  let activeHeads = [];
  let counterNow = null;

  function cohortCounter(day, count) {
    const text = day === 0
      ? 'Day 0  ·  100 working'
      : `Day ${day}  ·  about ${count} working`;

    return fitText(
      text,
      CX, COUNT_Y,
      21, C.cyan,
      P ? FW - 1.25 : 5.9,
      true
    );
  }

  function initCohort() {
    const ghosts = Array.from({ length: 100 }, (_, i) => {
      const p = gridPoint(i);

      const d = new M.Circle({
        radius: GRID_R * 1.12,
        color: C.muted,
        strokeWidth: 1
      });

      d.setFill(C.muted, 0.05);
      d.moveTo(p);

      return d;
    });

    const title = txt(
      '100 NEW HEADS',
      CX, GRID_TOP + 0.48,
      20, C.ink
    );

    const note = txt(
      'Glowing dots = heads still working',
      CX, COUNT_Y - (P ? 0.48 : 0.40),
      16, C.muted
    );

    cohortFrame = new M.VGroup(
      ...ghosts,
      title,
      note
    );

    activeHeads = order.map(i => {
      const p = gridPoint(i);
      return glow(p[0], p[1], GRID_R, C.cyan);
    });

    counterNow = cohortCounter(0, 100);

    return [
      new M.FadeIn(cohortFrame),
      new M.FadeIn(counterNow),
      new M.LaggedStart(
        activeHeads.map(d => new M.FadeIn(d)),
        {
          lagRatio: 0.015,
          runTime: 1.65
        }
      )
    ];
  }

  function updateCohort(day, count, runTime = 0.65) {
    count = Math.max(0, Math.min(count, activeHeads.length));

    const removed = activeHeads.splice(count);
    const nextCounter = cohortCounter(day, count);

    const a = [
      new M.FadeOut(counterNow, { runTime }),
      new M.FadeIn(nextCounter, { runTime })
    ];

    if (removed.length) {
      a.push(
        new M.LaggedStart(
          removed.map(d => new M.FadeOut(d)),
          {
            lagRatio: 0.10,
            runTime
          }
        )
      );
    }

    counterNow = nextCounter;

    return a;
  }

  function removeCohort() {
    const objects = [
      cohortFrame,
      counterNow,
      ...activeHeads
    ].filter(Boolean);

    const a = objects.map(o => new M.FadeOut(o));

    cohortFrame = null;
    counterNow = null;
    activeHeads = [];

    return a;
  }

  const expectedCount = day =>
    Math.round(100 * Math.pow(DAILY, day));

  // 9 — start with 100 new heads

  await until(S(9));

  await play(
    ...clearPicture(),
    ...initCohort(),
    ...say('FOLLOW 100 NEW HEADS'),
    ...fbox([
      'Day 0',
      ['100 working', C.cyan]
    ])
  );

  // 10 — each day 69 out of 70 survive

  await until(S(10));

  await play(
    ...updateCohort(1, expectedCount(1), 0.9),
    ...say('69 OUT OF 70 SURVIVE', C.green),
    ...fbox([
      'Each day',
      '69 out of 70 survive',
      ['Multiply by 69/70', C.green]
    ], C.green)
  );

  // 11 — same share, fewer absolute failures over time

  await until(S(11));

  await play(
    ...say('SAME SHARE LOST EACH DAY', C.violet),
    ...fbox([
      'Same daily share lost',
      ['Many heads → more lost', C.amber],
      ['Few heads → fewer lost', C.cyan]
    ], C.violet)
  );

  for (const day of [7, 14, 21, 35, 49, 56]) {
    await play(
      ...updateCohort(day, expectedCount(day), 0.72)
    );
  }

  // 12 — seventy daily survival steps

  await until(S(12));

  await play(
    ...updateCohort(70, 37, 1.0),
    ...say('70 DAYS LATER: ABOUT 37 LEFT', C.amber),
    ...fbox([
      '100 heads at the start',
      '70 daily survival steps',
      '(69/70)^70 ≈ 0.365',
      ['About 37 remain', C.amber]
    ], C.amber)
  );

  // 13 — answer the first question

  await until(S(13));

  await play(
    new M.Indicate(counterNow, { color: C.amber }),
    ...say('MORE THAN 10 WEEKS: 37%', C.amber),
    ...fbox([
      '37 out of 100',
      ['≈ 37 percent', C.amber]
    ], C.amber)
  );

  // 14 — continue for another ten weeks

  await until(S(14));

  await play(
    ...say('ANOTHER 10 WEEKS', C.green),
    ...fbox([
      'Start with 37 survivors',
      'Same daily survival share',
      ['69/70 each day', C.green]
    ], C.green)
  );

  // Continue from the rounded illustrative count of 37.
  for (const day of [84, 105, 126]) {
    const n = Math.round(
      37 * Math.pow(DAILY, day - 70)
    );

    await play(
      ...updateCohort(day, n, 0.62)
    );
  }

  // 15 — approximately fourteen heads remain

  await until(S(15));

  await play(
    ...updateCohort(140, 14, 0.9),
    ...say('ABOUT 14 HEADS REMAIN', C.amber),
    ...fbox([
      '37% of 37',
      '≈ 13.7',
      ['About 14 heads', C.amber]
    ], C.amber)
  );

  // 16 — the repeated factor

  await until(S(16));

  await play(
    ...say('EVERY 10 WEEKS: × 0.37', C.violet),
    ...fbox([
      '100 → 37 → 14',
      ['    × 0.37', C.violet],
      ['         × 0.37', C.violet],
      'Same multiplying factor'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Survival graph
  // ------------------------------------------------------------

  const GX = CX - (P ? 2.75 : 2.65);
  const GY = P ? -4.15 : -2.20;
  const GW = P ? Math.min(5.7, FW - 1.75) : 5.75;
  const GH = P ? 4.95 : 2.95;

  const X = t => GX + GW * t / 40;
  const Y = s => GY + GH * s;

  function graphAxes() {
    const objects = [
      line(X(0), GY, X(40) + 0.08, GY, C.muted, 3),
      line(X(0), GY, X(0), Y(1) + 0.09, C.muted, 3),
      txt(
        'Share still working',
        CX, Y(1) + 0.43,
        20, C.ink
      )
    ];

    for (const t of [0, 10, 20, 30, 40]) {
      objects.push(
        line(X(t), GY - 0.07, X(t), GY + 0.07, C.muted),
        txt(String(t), X(t), GY - 0.29, 17, C.muted, true)
      );
    }

    for (const s of [0.25, 0.50, 0.75, 1]) {
      objects.push(
        dashed(X(0), Y(s), X(40), Y(s), C.muted),
        txt(
          `${Math.round(s * 100)}%`,
          GX - 0.39, Y(s),
          P ? 15 : 16, C.muted, true
        )
      );
    }

    objects.push(
      txt('weeks', X(40) - 0.12, GY - 0.64, 17, C.muted)
    );

    return new M.VGroup(...objects);
  }

  function curveSegment(a, b, color = C.cyan, n = 24, sw = 4) {
    const segments = [];

    for (let i = 0; i < n; i++) {
      const t1 = a + (b - a) * i / n;
      const t2 = a + (b - a) * (i + 1) / n;

      segments.push(
        line(
          X(t1), Y(survival(t1)),
          X(t2), Y(survival(t2)),
          color, sw
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function fullCurve() {
    return new M.VGroup(
      curveSegment(0, 10),
      curveSegment(10, 20),
      curveSegment(20, 30),
      curveSegment(30, 40)
    );
  }

  function graphGuide(t, s, color = C.amber, label = null) {
    const objects = [
      dashed(X(t), GY, X(t), Y(s), color),
      dashed(X(0), Y(s), X(t), Y(s), color),
      glow(X(t), Y(s), 0.085, color)
    ];

    if (label) {
      objects.push(
        txt(
          label,
          X(t) + 0.55,
          Y(s) + 0.29,
          18, color, true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function decadeMarkers() {
    return new M.VGroup(
      graphGuide(10, survival(10), C.amber, '37%'),
      graphGuide(20, survival(20), C.violet, '14%'),
      glow(X(0), Y(1), 0.085, C.cyan)
    );
  }

  // 17 — the dots become a smooth survival curve

  await until(S(17));

  const axes17 = graphAxes();

  const pieces17 = [
    curveSegment(0, 10),
    curveSegment(10, 20),
    curveSegment(20, 30),
    curveSegment(30, 40)
  ];

  await play(
    ...removeCohort(),
    ...say('SHARE STILL WORKING OVER TIME'),
    ...fbox([
      '0 weeks   100%',
      '10 weeks   37%',
      ['20 weeks   14%', C.amber]
    ]),
    new M.FadeIn(axes17),
    new M.LaggedStart(
      pieces17.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.65,
        runTime: 2.6
      }
    )
  );

  picture = [axes17, ...pieces17];

  const decade17 = decadeMarkers();

  await play(
    ...replaceOverlay(decade17)
  );

  // 18 — the exponential law

  await until(S(18));

  await play(
    new M.Indicate(decade17, { color: C.violet }),
    ...say('THE EXPONENTIAL LAW', C.violet),
    ...fbox([
      'Equal periods',
      ['Same multiplying factor', C.violet],
      '10 weeks → × 0.37'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Memoryless property
  // Two heads: different ages, identical future survival.
  // ------------------------------------------------------------

  const MR1 = P ? -1.0 : 0.25;
  const MR2 = P ? -3.6 : -1.75;

  function memoryRow(y, age, result = null) {
    const ageEnd = age + 5;

    const left = lifeX(0);
    const current = lifeX(age);
    const end = lifeX(ageEnd);

    const objects = [
      txt(
        age === 0 ? 'BRAND-NEW HEAD' : '10-WEEK-OLD HEAD',
        CX, y + 0.68,
        20, C.ink
      ),
      line(lifeX(0), y, lifeX(15), y, C.muted, 2)
    ];

    if (age > 0) {
      objects.push(
        line(left, y, current, y, C.green, 6),
        txt(
          '10 weeks already worked',
          (left + current) / 2,
          y + 0.26,
          16, C.green
        )
      );
    }

    objects.push(
      arrow(current, y, end, y, C.cyan, 5),
      glow(current, y, 0.09, C.amber),
      txt(
        'next 5 weeks',
        (current + end) / 2,
        y + 0.30,
        16, C.cyan
      )
    );

    const ticks = [...new Set([0, age, ageEnd])];

    ticks.forEach(t => {
      objects.push(
        line(lifeX(t), y - 0.07, lifeX(t), y + 0.07, C.muted),
        txt(String(t), lifeX(t), y - 0.28, 17, C.muted, true)
      );
    });

    if (result !== null) {
      objects.push(
        tag(
          result,
          (current + end) / 2,
          y - 0.70,
          C.amber,
          17
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function memoryPicture(result = null) {
    return new M.VGroup(
      memoryRow(MR1, 0, result),
      memoryRow(MR2, 10, result)
    );
  }

  // 19 — revisit the second question

  await until(S(19));

  await play(
    ...replacePicture(memoryRow(
      P ? -2.3 : -0.50,
      10,
      '?'
    )),
    ...say('ALREADY WORKED 10 WEEKS', C.amber),
    ...fbox([
      'Already survived 10 weeks',
      ['Another 5 weeks?', C.amber]
    ], C.amber)
  );

  // 20 — does the head remember its age?

  await until(S(20));

  await play(
    ...replacePicture(memoryPicture()),
    ...say('DOES IT REMEMBER ITS AGE?', C.violet),
    ...fbox([
      'New head',
      '10-week-old head',
      ['Different ages', C.violet]
    ], C.violet)
  );

  // 21 — both have the same daily failure chance

  await until(S(21));

  await play(
    ...replaceOverlay(
      tag('1 IN 70 A DAY', (lifeX(0) + lifeX(5)) / 2, MR1 - 0.72, C.amber, 16),
      tag('1 IN 70 A DAY', (lifeX(10) + lifeX(15)) / 2, MR2 - 0.72, C.amber, 16)
    ),
    ...say('SAME RISK TOMORROW', C.green),
    ...fbox([
      'New:   1 in 70',
      'Older: 1 in 70',
      ['Same daily chance', C.green]
    ], C.green)
  );

  // 22 — compare equal five-week future intervals

  await until(S(22));

  const memSpan1 = rounded(
    (lifeX(0) + lifeX(5)) / 2,
    MR1 + 0.12,
    lifeX(5) - lifeX(0) + 0.25,
    0.67,
    C.cyan,
    0.05
  );

  const memSpan2 = rounded(
    (lifeX(10) + lifeX(15)) / 2,
    MR2 + 0.12,
    lifeX(15) - lifeX(10) + 0.25,
    0.67,
    C.cyan,
    0.05
  );

  await play(
    ...replaceOverlay(memSpan1, memSpan2),
    ...say('SAME NEXT FIVE WEEKS', C.cyan),
    ...fbox([
      'New: next 5 weeks',
      'Old: next 5 weeks',
      ['Equal survival chances', C.green]
    ], C.green)
  );

  // 23 — 61 percent for both

  await until(S(23));

  const both61 = memoryPicture('61%');

  await play(
    ...replacePicture(both61),
    ...say('61% FOR BOTH', C.amber),
    ...fbox([
      'New head:  61%',
      'Older head: 61%',
      ['Same answer', C.amber]
    ], C.amber)
  );

  // 24 — name the property

  await until(S(24));

  await play(
    new M.Indicate(both61, { color: C.green }),
    ...say('THE MEMORYLESS PROPERTY', C.green),
    ...fbox([
      'No wear',
      'No memory of age',
      ['Old is as good as new', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // The exponential survival formula
  // ------------------------------------------------------------

  // 25 — return to the survival curve

  await until(S(25));

  await play(
    ...replacePicture(graphAxes(), fullCurve()),
    ...say('THE SHORT VERSION', C.cyan),
    ...fbox([
      'Survival chance',
      'A short formula'
    ])
  );

  // 26 — define t and the mean

  await until(S(26));

  await play(
    ...replaceOverlay(
      graphGuide(10, survival(10), C.amber, '10 weeks')
    ),
    ...say('t = NUMBER OF WEEKS'),
    ...fbox([
      ['t = time in weeks', C.cyan],
      ['10 = average life', C.amber]
    ])
  );

  // 27 — survival formula

  await until(S(27));

  await play(
    ...clearOverlays(),
    ...say('THE SURVIVAL FORMULA'),
    ...fbox([
      'P(lasts more than t weeks)',
      ['= e^(−t/10)', C.cyan]
    ])
  );

  // 28 — explain e

  await until(S(28));

  await play(
    ...say('e IS A FIXED NUMBER', C.violet),
    ...fbox([
      'P(lasts more than t weeks)',
      '= e^(−t/10)',
      ['e ≈ 2.72', C.violet],
      'Smooth steady shrinking'
    ], C.violet)
  );

  // 29 — substitute one average lifetime

  await until(S(29));

  await play(
    ...replaceOverlay(
      graphGuide(10, survival(10), C.amber, '37%')
    ),
    ...say('ONE WHOLE AVERAGE LIFE', C.amber),
    ...fbox([
      't = 10 weeks',
      'e^(−10/10)',
      '= e^(−1)',
      ['= 1/e', C.amber]
    ], C.amber)
  );

  // 30 — calculate survival beyond ten weeks

  await until(S(30));

  await play(
    ...say('10 WEEKS: ABOUT 37%', C.amber),
    ...fbox([
      'P(more than 10 weeks)',
      '= e^(−1)',
      '= 0.368',
      ['≈ 37 percent', C.amber]
    ], C.amber)
  );

  // 31 — calculate survival beyond five weeks

  await until(S(31));

  const guide5 = graphGuide(
    5,
    survival(5),
    C.green,
    '61%'
  );

  await play(
    ...replaceOverlay(guide5),
    ...say('5 WEEKS: ABOUT 61%', C.green),
    ...fbox([
      'P(more than 5 weeks)',
      '= e^(−5/10)',
      '= e^(−0.5) = 0.607',
      ['≈ 61 percent', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // Mean versus median
  // ------------------------------------------------------------

  function medianMarker() {
    const t = MEDIAN;

    const objects = [
      dashed(X(0), Y(0.5), X(t), Y(0.5), C.green),
      dashed(X(t), GY, X(t), Y(0.5), C.green),
      glow(X(t), Y(0.5), 0.10, C.green),
      txt(
        '50% survive',
        X(t) + 0.98,
        Y(0.5) + 0.25,
        18, C.green
      ),
      txt(
        '6.93',
        X(t) - 0.12,
        GY - 0.29,
        16, C.green, true
      )
    ];

    return new M.VGroup(...objects);
  }

  // 32 — half fail before about seven weeks

  await until(S(32));

  const median32 = medianMarker();

  await play(
    ...replaceOverlay(median32),
    ...say('HALF FAIL BEFORE ABOUT 7 WEEKS', C.green),
    ...fbox([
      ['Median = 6.93 weeks', C.green],
      '≈ 7 weeks',
      ['Mean = 10 weeks', C.amber]
    ], C.green)
  );

  // 33 — a long right tail pulls the mean upward

  const tailLabelY = P ? -2.20 : -1.10;

  const tail33 = new M.VGroup(
    curveSegment(20, 40, C.violet, 48, 5),
    txt(
      'A few last much longer',
      X(27),
      tailLabelY + 0.30,
      18, C.violet
    ),
    arrow(
      X(26), tailLabelY + 0.04,
      X(30), Y(survival(30)) + 0.08,
      C.violet, 2
    ),
    dashed(
      X(10), GY,
      X(10), Y(survival(10)),
      C.amber
    ),
    glow(X(10), Y(survival(10)), 0.075, C.amber)
  );

  await until(S(33));

  await play(
    ...replaceOverlay(medianMarker(), tail33),
    ...say('LONG LIVES PULL THE MEAN UP', C.violet),
    ...fbox([
      ['Median ≈ 7 weeks', C.green],
      ['Mean = 10 weeks', C.amber],
      'A long right tail',
      ['Mean > median', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Applications: waiting times and Poisson counts
  // ------------------------------------------------------------

  function eventIcon(kind, x, y, color) {
    if (kind === 'failure') {
      return new M.VGroup(
        rounded(x, y, 0.65, 0.52, color, 0.10),
        bolt(x, y, color, 0.55)
      );
    }

    if (kind === 'call') {
      const body = rounded(x, y, 0.43, 0.72, color, 0.10);

      const screen = rect(
        x, y + 0.04,
        0.29, 0.43,
        color, 0.10
      );

      const button = dot(
        x, y - 0.27,
        0.035, color
      );

      return new M.VGroup(body, screen, button);
    }

    const head = new M.Circle({
      radius: 0.13,
      color
    });

    head.setFill(color, 0.95);
    head.moveTo(pt(x, y + 0.22));

    const body = new M.Arc({
      radius: 0.27,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.8);
    body.moveTo(pt(x, y - 0.09));

    return new M.VGroup(head, body);
  }

  function applicationPicture() {
    const names = ['FAILURES', 'CALLS', 'ARRIVALS'];
    const kinds = ['failure', 'call', 'arrival'];
    const colors = [C.amber, C.cyan, C.green];

    const eventTimes = [
      [0.12, 0.45, 0.60, 0.91],
      [0.08, 0.33, 0.70, 0.88],
      [0.15, 0.38, 0.48, 0.94]
    ];

    const objects = [];

    const left = CX - 1.45;
    const right = CX + 2.65;

    const rowTop = P ? 0.35 : 0.62;
    const dy = P ? 1.55 : 1.15;

    names.forEach((name, i) => {
      const y = rowTop - i * dy;

      objects.push(
        eventIcon(kinds[i], CX - 2.20, y + 0.03, colors[i]),
        txt(name, CX + 0.55, y + 0.40, 18, colors[i]),
        line(left, y, right, y, C.muted, 2)
      );

      const events = eventTimes[i].map(t =>
        left + (right - left) * t
      );

      events.forEach(x => {
        objects.push(
          line(x, y - 0.10, x, y + 0.12, colors[i], 3),
          glow(x, y, 0.075, colors[i])
        );
      });

      objects.push(
        arrow(
          events[1], y - 0.30,
          events[2], y - 0.30,
          colors[i], 2
        )
      );
    });

    return new M.VGroup(...objects);
  }

  // 34 — where exponential waiting times are useful

  await until(S(34));

  await play(
    ...replacePicture(pfit(applicationPicture(), 1.2, -2.6)),
    ...say('WAITING FOR THE NEXT EVENT'),
    ...fbox([
      'Use for waiting times',
      'Failures',
      'Calls',
      ['Arrivals', C.green]
    ])
  );

  function poissonPartner() {
    const y = P ? -1.70 : -0.55;
    const left = CX - 2.8;
    const right = CX + 2.8;

    const xs = [
      left + 0.55,
      left + 1.62,
      left + 3.62,
      left + 4.28,
      left + 5.10
    ];

    const objects = [
      txt(
        'Events along a time line',
        CX, y + 1.02,
        22, C.ink
      ),
      line(left, y, right, y, C.muted, 3),
      txt(
        'Poisson: count the events',
        CX, y + 0.54,
        19, C.amber
      ),
      txt(
        'Exponential: measure the gaps',
        CX, y - 1.05,
        19, C.cyan
      )
    ];

    xs.forEach((x, i) => {
      objects.push(
        glow(x, y, 0.10, C.amber),
        txt(String(i + 1), x, y + 0.28, 15, C.amber, true)
      );
    });

    for (let i = 0; i < xs.length - 1; i++) {
      objects.push(
        arrow(
          xs[i], y - 0.44,
          xs[i + 1], y - 0.44,
          C.cyan, 2
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // 35 — Poisson counts versus exponential waiting times

  await until(S(35));

  await play(
    ...replacePicture(pfit(poissonPartner(), 1.3, -3.0)),
    ...say('COUNTS AND WAITING TIMES', C.violet),
    ...fbox([
      ['Poisson → how many?', C.amber],
      ['Exponential → how long?', C.cyan]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Common trap: parts that wear out
  // ------------------------------------------------------------

  function wearIcons() {
    const y = P ? -1.80 : -0.55;

    const disc = new M.Circle({
      radius: 0.68,
      color: C.amber,
      strokeWidth: 4
    });

    disc.setFill(C.amber, 0.10);
    disc.moveTo(pt(CX - 1.55, y));

    const hub = new M.Circle({
      radius: 0.24,
      color: C.muted,
      strokeWidth: 3
    });

    hub.moveTo(pt(CX - 1.55, y));

    const holes = Array.from({ length: 6 }, (_, i) => {
      const a = i * Math.PI / 3;

      return dot(
        CX - 1.55 + 0.43 * Math.cos(a),
        y + 0.43 * Math.sin(a),
        0.045,
        C.muted
      );
    });

    const brakePad = rounded(
      CX - 0.98, y + 0.10,
      0.32, 0.58,
      C.amber, 0.4
    );

    const beltOuter = rounded(
      CX + 1.40, y,
      1.95, 0.98,
      C.amber, 0.10
    );

    const beltInner = rounded(
      CX + 1.40, y,
      1.55, 0.58,
      C.muted, 0.06
    );

    const wearMarks = [
      line(
        CX + 0.83, y + 0.49,
        CX + 0.98, y + 0.35,
        C.amber, 3
      ),
      line(
        CX + 1.15, y + 0.49,
        CX + 1.30, y + 0.35,
        C.amber, 3
      ),
      line(
        CX + 1.47, y + 0.49,
        CX + 1.62, y + 0.35,
        C.amber, 3
      )
    ];

    return new M.VGroup(
      txt('Parts that wear out', CX, y + 1.35, 23, C.ink),
      disc,
      hub,
      ...holes,
      brakePad,
      beltOuter,
      beltInner,
      ...wearMarks,
      txt('BRAKES', CX - 1.55, y - 1.02, 19, C.amber),
      txt('BELTS', CX + 1.40, y - 1.02, 19, C.amber)
    );
  }

  // 36 — introduce the wear-out trap

  await until(S(36));

  await play(
    ...replacePicture(pfit(wearIcons(), 1.35, -2.9)),
    ...say('TRAP: PARTS THAT WEAR OUT', C.amber),
    ...fbox([
      'Brakes and belts',
      'Wear accumulates',
      ['Age can change the risk', C.amber]
    ], C.amber)
  );

  function hazardPicture() {
    const x0 = CX - 2.65;
    const y0 = P ? -4.0 : -2.08;
    const w = 5.45;
    const h = P ? 4.45 : 2.65;

    const hx = a => x0 + a * w;
    const hy = r => y0 + r * h;

    const constant = 0.23;

    const objects = [
      line(x0, y0, x0 + w, y0, C.muted, 3),
      line(x0, y0, x0, y0 + h, C.muted, 3),
      txt(
        'Daily failure chance',
        CX, y0 + h + 0.45,
        20, C.ink
      ),
      txt(
        'age →',
        x0 + w - 0.30, y0 - 0.40,
        18, C.muted
      ),
      txt(
        'new',
        x0 + 0.18, y0 - 0.35,
        16, C.muted
      ),
      line(
        hx(0), hy(constant),
        hx(1), hy(constant),
        C.cyan, 4
      ),
      txt(
        'Constant risk',
        hx(0.48), hy(constant) - 0.31,
        18, C.cyan
      )
    ];

    const wear = a =>
      constant + 0.67 * a * a;

    for (let i = 0; i < 60; i++) {
      const a = i / 60;
      const b = (i + 1) / 60;

      objects.push(
        line(
          hx(a), hy(wear(a)),
          hx(b), hy(wear(b)),
          C.amber, 4
        )
      );
    }

    objects.push(
      txt(
        'Wear: increasing risk',
        hx(0.53), hy(0.83),
        18, C.amber
      ),
      txt(
        'Illustrative risks',
        hx(0.47), y0 - 0.76,
        16, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  // 37 — exponential is inappropriate when risk increases

  await until(S(37));

  await play(
    ...replacePicture(hazardPicture()),
    ...say('RISK GROWS WITH AGE', C.amber),
    ...fbox([
      ['Constant risk → exponential', C.cyan],
      ['Rising risk → not exponential', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Preview: adding waiting times
  // ------------------------------------------------------------

  function threeGaps() {
    const y = P ? -1.85 : -0.55;
    const left = CX - 2.75;
    const right = CX + 2.75;

    // Illustrative unequal waiting gaps, not observed records.
    const gaps = [8, 14, 9];
    const colors = [C.cyan, C.violet, C.green];

    const total = gaps.reduce((a, b) => a + b, 0);

    const x = t =>
      left + (right - left) * t / total;

    const objects = [
      txt('Three waiting times', CX, y + 1.04, 23, C.ink),
      line(left, y, right, y, C.muted, 2)
    ];

    let start = 0;

    gaps.forEach((gap, i) => {
      const end = start + gap;

      objects.push(
        line(
          x(start), y,
          x(end), y,
          colors[i], 8
        ),
        glow(x(start), y, 0.10, colors[i]),
        txt(
          `Head ${i + 1}`,
          (x(start) + x(end)) / 2,
          y + 0.37,
          18, colors[i]
        ),
        txt(
          `${gap} weeks`,
          (x(start) + x(end)) / 2,
          y - 0.32,
          16, colors[i], true
        )
      );

      start = end;
    });

    objects.push(
      cross(right, y, 0.14, C.amber),
      line(left, y - 0.72, right, y - 0.72, C.amber, 2),
      line(left, y - 0.63, left, y - 0.81, C.amber, 2),
      line(right, y - 0.63, right, y - 0.81, C.amber, 2),
      txt(
        'Total waiting time',
        CX, y - 1.02,
        19, C.amber
      ),
      txt(
        'Illustrative lifetimes',
        CX, y - 1.42,
        16, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  // 38 — preview gamma waiting times

  await until(S(38));

  await play(
    ...replacePicture(pfit(threeGaps(), 1.2, -3.0)),
    ...say('NEXT: ADDING WAITING TIMES', C.violet),
    ...fbox([
      'First waiting time',
      '+ second waiting time',
      '+ third waiting time',
      ['Next: the gamma law', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 39 — final one-sentence recap
  // ------------------------------------------------------------

  const finalAxes = graphAxes();
  const finalCurve = fullCurve();
  const finalDecades = decadeMarkers();

  const finalFactor1 = tag(
    '× 0.37',
    X(5) + 0.70,
    Y(0.84),
    C.violet,
    16
  );

  const finalFactor2 = tag(
    '× 0.37',
    X(17) + 0.55,
    Y(0.48),
    C.violet,
    16
  );

  const finalAge = tag(
    'AGE DOES NOT MATTER',
    X(26),
    Y(0.82),
    C.green,
    16
  );

  await until(S(39));

  await play(
    ...replacePicture(
      finalAxes,
      finalCurve,
      finalDecades,
      finalFactor1,
      finalFactor2,
      finalAge
    ),
    ...say('CONSTANT RATE — NO MEMORY', C.green),
    ...fbox([
      ['Constant failure rate', C.green],
      'P(lasts more than t weeks)',
      ['= e^(−t/10)', C.cyan],
      ['Same factor. No memory.', C.violet]
    ], C.green)
  );

  await until(S(39) + 2.3);

  await play(
    new M.Indicate(finalFactor1, { color: C.violet }),
    new M.Indicate(finalFactor2, { color: C.violet })
  );

  await until(S(39) + 4.7);

  await play(
    new M.Indicate(finalAge, { color: C.green }),
    ...say('SAME FACTOR. AGE DOES NOT MATTER.', C.green)
  );
}

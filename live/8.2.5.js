// lesson 8.2.5
// Adjustment by standardization: give both groups the same chosen mix.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Fixed chapter snapshot:
// Central: 6 with pass, average 25 min; 2 without, average 30 min.
// Hill:    2 with pass, average 45 min; 6 without, average 50 min.
//
// Target mix: 8 Central + 8 Hill.
// Standardized pass average:    (8 × 25 + 8 × 45) ÷ 16 = 35.
// Standardized no-pass average: (8 × 30 + 8 × 50) ÷ 16 = 40.
// Standardized gap: 35 − 40 = −5 minutes.
//
// Tray spaces are stand-ins filled with group averages, not new records.
// Try it beats preview the separate interactive exercise.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ------------------------------------------------------------
  // Fixed chapter data
  // ------------------------------------------------------------

  const DATA = [
    {
      name: 'Central',
      n: 8,
      pass: 6,
      noPass: 2,
      yes: 25,
      no: 30,
      color: C.cyan
    },
    {
      name: 'Hill',
      n: 8,
      pass: 2,
      noPass: 6,
      yes: 45,
      no: 50,
      color: C.violet
    }
  ];

  const TARGET = [8, 8];

  const PASS_TOTAL =
    TARGET[0] * DATA[0].yes +
    TARGET[1] * DATA[1].yes;

  const NO_TOTAL =
    TARGET[0] * DATA[0].no +
    TARGET[1] * DATA[1].no;

  const PASS_AVG = PASS_TOTAL / 16;
  const NO_AVG = NO_TOTAL / 16;
  const GAP = PASS_AVG - NO_AVG;

  // ------------------------------------------------------------
  // Responsive layout
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;
  const PIC_W = P ? 7.0 : 7.15;

  const PILL = P ? [0, 3.65, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, -4.10, 0] : [4.25, -0.30, 0];

  const WORK_X = [
    CX - 1.76,
    CX + 1.76
  ];

  const TARGET_Y = P ? 2.05 : 0.76;

  const OBS_Y = P
    ? [0.42, -1.12]
    : [-0.64, -2.00];

  const TRAY_Y = P
    ? [1.45, -1.00]
    : [0.29, -1.82];

  const TRAY_W = P ? 7.0 : 7.10;
  const TRAY_H = P ? 2.00 : 1.88;

  const SLOT_W = P ? 0.69 : 0.70;
  const SLOT_H = P ? 0.43 : 0.38;
  const SLOT_SP = P ? 0.78 : 0.79;
  const SLOT_ROW_SP = P ? 0.52 : 0.45;

  const at = (x, y) => [x, y, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function txt(s, size, color, p, mono = false, maxw = null) {
    const t = T(s, size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);
    return t;
  }

  function rect(p, w, h, color = C.muted, opacity = 0, stroke = 1.5) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: stroke
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function line(a, b, color = C.muted, stroke = 2.5) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: stroke
    });
  }

  function fadeAll(items) {
    return items.filter(Boolean).map(m => new M.FadeOut(m));
  }

  function lagIn(items, runTime = 0.85, lagRatio = 0.10) {
    return new M.LaggedStart(
      items.map(m => new M.FadeIn(m)),
      { lagRatio, runTime }
    );
  }

  function lagIndicate(items, color, runTime = 1.0) {
    return new M.LaggedStart(
      items.map(m => new M.Indicate(m, { color })),
      { lagRatio: 0.10, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Phone: beneath the picture.
  // Laptop: beside the picture.
  //
  // New formula groups are assembled off-screen.
  // Existing visible objects are never regrouped.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.39 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s, size, c, true)
    );

    const maxw = P ? FW - 1.05 : 4.55;

    const rawWidth = Math.max(
      ...texts.map(t => t.getWidth())
    );

    const scale = Math.min(
      1,
      (maxw - 0.60) / Math.max(rawWidth, 0.01)
    );

    texts.forEach(t => {
      if (scale < 1) t.scale(scale);
    });

    const wd = Math.max(
      2.25,
      Math.max(...texts.map(t => t.getWidth())) + 0.60
    );

    const ht = rows.length * lh + 0.38;

    const r = rect(
      BOXP,
      wd,
      ht,
      color,
      0.96,
      2
    );

    const left = BOXP[0] - wd / 2 + 0.30;
    const top = BOXP[1] + ht / 2 - 0.19 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo(at(
        left + t.getWidth() / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(r, ...texts);

    const a = [];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    a.push(new M.FadeIn(g));
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
  // Commuter and empty-space helpers
  //
  // Cyan = Central.
  // Violet = Hill.
  // Amber ring = received a pass.
  // ------------------------------------------------------------

  function commuter(p, color, hasPass = false, scale = 1) {
    const halo = new M.Dot({
      point: p,
      radius: 0.225 * scale,
      color
    });

    halo.setFill(color, 0.15);

    const dot = new M.Dot({
      point: p,
      radius: 0.110 * scale,
      color
    });

    dot.setFill(color, 1);

    const parts = [halo, dot];

    if (hasPass) {
      const ring = new M.Circle({
        radius: 0.205 * scale,
        color: C.amber,
        strokeWidth: 2.5
      });

      ring.setFill(C.amber, 0);
      ring.moveTo(p);

      parts.push(ring);
    }

    return new M.VGroup(...parts);
  }

  function emptySpace(p, color, radius = 0.15) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 1.8
    });

    r.setFill(color, 0.07);
    r.moveTo(p);

    return r;
  }

  // ------------------------------------------------------------
  // 0-1: introduce the need for a fair city-wide comparison
  // ------------------------------------------------------------

  const introPass = pill(
    'WITH A PASS',
    C.amber,
    P ? 22 : 21
  );

  introPass.moveTo(
    P ? at(CX, 1.45) : at(CX - 1.75, 0.55)
  );

  const introNo = pill(
    'WITHOUT A PASS',
    C.muted,
    P ? 22 : 21
  );

  introNo.moveTo(
    P ? at(CX, -0.10) : at(CX + 1.75, 0.55)
  );

  const introQuestion = txt(
    'One comparison for both workplaces',
    P ? 23 : 22,
    C.green,
    at(CX, P ? -1.55 : -1.05),
    false,
    PIC_W
  );

  const introCentral = txt(
    'Central',
    20,
    C.cyan,
    at(CX - 1.45, P ? -2.25 : -1.78)
  );

  const introHill = txt(
    'Hill',
    20,
    C.violet,
    at(CX + 1.45, P ? -2.25 : -1.78)
  );

  // 0: the city wants one comparison for Central and Hill together.
  await until(S(0));
  await play(
    new M.FadeIn(introPass),
    new M.FadeIn(introNo),
    new M.FadeIn(introQuestion),
    ...say('ONE COMPARISON FOR THE WHOLE CITY', C.green)
  );

  // 1: give each workplace the same say in both groups.
  await until(S(1));
  await play(
    new M.FadeIn(introCentral),
    new M.FadeIn(introHill),
    ...fbox([
      ['THE QUESTION', C.green],
      'Can both sides use',
      'the same workplace mix?'
    ], C.green),
    ...say('GIVE EACH WORKPLACE THE SAME SAY', C.green)
  );

  // ------------------------------------------------------------
  // 2-5: establish the target population
  //
  // All 16 commuters in the core snapshot.
  // Eight Central and eight Hill.
  // ------------------------------------------------------------

  const targetTitle = txt(
    'THE PEOPLE WE WANT TO DESCRIBE',
    P ? 19 : 17,
    C.green,
    at(CX, P ? 3.00 : 1.56),
    true,
    PIC_W
  );

  const targetFrames = DATA.map((d, k) =>
    rect(
      at(WORK_X[k], TARGET_Y),
      3.30,
      0.98,
      d.color,
      0.10,
      1.5
    )
  );

  const targetLabels = DATA.map((d, k) =>
    txt(
      `${d.name}: 8`,
      P ? 19 : 18,
      d.color,
      at(WORK_X[k], TARGET_Y + 0.25),
      true
    )
  );

  const targetPos = (k, j) =>
    at(
      WORK_X[k] + (j - 3.5) * 0.365,
      TARGET_Y - 0.18
    );

  const targetDots = DATA.map((d, k) =>
    Array.from(
      { length: 8 },
      (_, j) => commuter(
        targetPos(k, j),
        d.color,
        false,
        0.68
      )
    )
  );

  const targetSlots = DATA.map((d, k) =>
    Array.from(
      { length: 8 },
      (_, j) => emptySpace(
        targetPos(k, j),
        d.color,
        0.145
      )
    )
  );

  // 2: the target is all sixteen commuters.
  await until(S(2));
  await play(
    ...fadeAll([
      introPass,
      introNo,
      introQuestion,
      introCentral,
      introHill
    ]),
    new M.FadeIn(targetTitle),
    ...fbox([
      ['TARGET POPULATION', C.green],
      'All 16 commuters',
      'in this example.'
    ], C.green),
    ...say('DESCRIBE ALL 16 COMMUTERS', C.green)
  );

  // 3: eight Central and eight Hill.
  await until(S(3));
  await play(
    ...targetFrames.map(r => new M.Create(r)),
    ...targetLabels.map(t => new M.FadeIn(t)),
    lagIn(targetDots.flat(), 1.30, 0.055),
    ...fbox([
      ['Central: 8', C.cyan],
      ['Hill:    8', C.violet],
      ['Total:  16', C.green]
    ], C.green),
    ...say('8 CENTRAL + 8 HILL = 16')
  );

  // 4: replace the actual commuter dots with target spaces.
  await until(S(4));
  await play(
    ...fadeAll(targetDots.flat()),
    lagIn(targetSlots.flat(), 1.05, 0.05),
    ...fbox([
      'Eight spaces for Central.',
      'Eight spaces for Hill.',
      ['16 spaces in all.', C.green]
    ], C.green),
    ...say('MAKE 16 COMMUTER SPACES', C.green)
  );

  // 5: this is the chosen workplace mix.
  const targetOutline = rect(
    at(CX, TARGET_Y),
    PIC_W,
    1.12,
    C.green,
    0,
    2.1
  );

  await until(S(5));
  await play(
    new M.Create(targetOutline),
    ...fbox([
      ['CHOSEN WORKPLACE MIX', C.green],
      ['8 Central', C.cyan],
      ['8 Hill', C.violet],
      'The mix we want to describe.'
    ], C.green),
    ...say('THIS IS OUR TARGET MIX', C.green)
  );

  // ------------------------------------------------------------
  // 6-13: observed groups beneath the target spaces
  //
  // Four observed groups:
  // Central, pass:       6, average 25 min.
  // Central, no pass:    2, average 30 min.
  // Hill, pass:          2, average 45 min.
  // Hill, no pass:       6, average 50 min.
  // ------------------------------------------------------------

  const OBS_W = 3.30;
  const OBS_H = P ? 1.30 : 1.22;

  function observedGroup(workplace, hasPass) {
    const d = DATA[workplace];

    const row = hasPass ? 0 : 1;
    const x = WORK_X[workplace];
    const y = OBS_Y[row];

    const count = hasPass ? d.pass : d.noPass;
    const average = hasPass ? d.yes : d.no;

    const frame = rect(
      at(x, y),
      OBS_W,
      OBS_H,
      d.color,
      0.10,
      1.5
    );

    const label = txt(
      hasPass ? 'WITH PASS' : 'NO PASS',
      16,
      hasPass ? C.amber : C.muted,
      at(x, y + 0.39),
      true,
      OBS_W - 0.20
    );

    const dots = Array.from(
      { length: count },
      (_, j) => commuter(
        at(
          x + (j - (count - 1) / 2) * 0.43,
          y + 0.025
        ),
        d.color,
        hasPass,
        0.83
      )
    );

    const value = txt(
      `${count} people • Avg ${average} min`,
      P ? 16 : 15,
      d.color,
      at(x, y - 0.39),
      true,
      OBS_W - 0.22
    );

    return {
      workplace,
      hasPass,
      count,
      average,
      x,
      y,
      frame,
      label,
      dots,
      value
    };
  }

  const observed = [
    observedGroup(0, true),
    observedGroup(0, false),
    observedGroup(1, true),
    observedGroup(1, false)
  ];

  const [obsCP, obsCN, obsHP, obsHN] = observed;

  function revealObserved(g) {
    return [
      lagIn(g.dots, 0.80, 0.09),
      new M.FadeIn(g.value)
    ];
  }

  function observedObjects(g) {
    return [
      g.frame,
      g.label,
      ...g.dots,
      g.value
    ];
  }

  function observedOutline(g, color = C.green) {
    return rect(
      at(g.x, g.y),
      OBS_W + 0.12,
      OBS_H + 0.12,
      color,
      0,
      2.1
    );
  }

  // 6: lay out the observed groups below the target spaces.
  await until(S(6));
  await play(
    new M.FadeOut(targetOutline),
    ...observed.map(g => new M.Create(g.frame)),
    ...observed.map(g => new M.FadeIn(g.label)),
    ...fbox([
      ['OBSERVED GROUPS', C.cyan],
      'Separate the actual records',
      'by workplace and pass receipt.'
    ]),
    ...say('NOW LOOK AT THE ACTUAL RECORDS')
  );

  // 7: Central, six pass holders, average 25 minutes.
  await until(S(7));
  await play(
    ...revealObserved(obsCP),
    ...fbox([
      ['CENTRAL • WITH PASS', C.cyan],
      '6 commuters',
      ['Average = 25 minutes', C.amber]
    ], C.cyan),
    ...say('CENTRAL WITH PASS: 6 PEOPLE, 25 MIN')
  );

  // 8: Central, two without a pass, average 30 minutes.
  await until(S(8));
  await play(
    ...revealObserved(obsCN),
    ...fbox([
      ['CENTRAL • NO PASS', C.cyan],
      '2 commuters',
      ['Average = 30 minutes', C.ink]
    ], C.cyan),
    ...say('CENTRAL WITHOUT PASS: 2 PEOPLE, 30 MIN')
  );

  // 9: Hill, two with a pass, average 45 minutes.
  await until(S(9));
  await play(
    ...revealObserved(obsHP),
    ...fbox([
      ['HILL • WITH PASS', C.violet],
      '2 commuters',
      ['Average = 45 minutes', C.amber]
    ], C.violet),
    ...say('HILL WITH PASS: 2 PEOPLE, 45 MIN', C.violet)
  );

  // 10: Hill, six without a pass, average 50 minutes.
  await until(S(10));
  await play(
    ...revealObserved(obsHN),
    ...fbox([
      ['HILL • NO PASS', C.violet],
      '6 commuters',
      ['Average = 50 minutes', C.ink]
    ], C.violet),
    ...say('HILL WITHOUT PASS: 6 PEOPLE, 50 MIN', C.violet)
  );

  // 11: most pass holders are from Central.
  const moreCentral = observedOutline(obsCP, C.cyan);

  await until(S(11));
  await play(
    new M.Create(moreCentral),
    lagIndicate(obsCP.dots, C.cyan, 1.10),
    ...fbox([
      ['WITH A PASS', C.amber],
      ['6 from Central', C.cyan],
      ['2 from Hill', C.violet],
      'Mostly shorter commutes.'
    ], C.cyan),
    ...say('PASS GROUP: MORE PEOPLE FROM CENTRAL', C.cyan)
  );

  // 12: most nonholders are from Hill.
  const moreHill = observedOutline(obsHN, C.violet);

  await until(S(12));
  await play(
    new M.FadeOut(moreCentral),
    new M.Create(moreHill),
    lagIndicate(obsHN.dots, C.violet, 1.10),
    ...fbox([
      ['WITHOUT A PASS', C.ink],
      ['2 from Central', C.cyan],
      ['6 from Hill', C.violet],
      'Mostly longer commutes.'
    ], C.violet),
    ...say('NO-PASS GROUP: MORE PEOPLE FROM HILL', C.violet)
  );

  // 13: remind the learner of the misleading mixed comparison.
  await until(S(13));
  await play(
    new M.FadeOut(moreHill),
    ...fbox([
      ['THE ORIGINAL COMPARISON', C.amber],
      'Pass average = 30',
      'No-pass average = 45',
      ['30 − 45 = −15 minutes', C.amber],
      'Different workplace mixes.'
    ], C.amber),
    ...say('THE IMBALANCE DISTORTS THE COMPARISON', C.amber)
  );

  // ------------------------------------------------------------
  // Tray helpers
  //
  // Each tray has sixteen stand-in spaces.
  // There are eight columns and two rows.
  //
  // Column-major order:
  //   slots 0, 1 in column 0;
  //   slots 2, 3 in column 1; and so on.
  //
  // With the 8/8 mix, Central occupies the left four
  // columns and Hill occupies the right four columns.
  //
  // Even-numbered alternative counts keep the visual workplace
  // boundaries aligned to full columns.
  // ------------------------------------------------------------

  function slotPosition(trayY, index) {
    const col = Math.floor(index / 2);
    const row = index % 2;

    return at(
      CX + (col - 3.5) * SLOT_SP,
      trayY - 0.105 - row * SLOT_ROW_SP
    );
  }

  function traySlot(p, workplace, minutes = null) {
    const color = DATA[workplace].color;
    const filled = minutes !== null;

    const r = new M.RoundedRectangle({
      width: SLOT_W,
      height: SLOT_H,
      cornerRadius: 0.08,
      color,
      strokeWidth: filled ? 1.8 : 1.3
    });

    if (filled) {
      r.setFill(color, 0.34);
    } else {
      r.setFill(color, 0.055);
    }

    r.moveTo(p);

    const value = txt(
      filled ? String(minutes) : '–',
      P ? 21 : 18,
      filled ? C.ink : C.muted,
      p,
      true,
      SLOT_W - 0.10
    );

    return new M.VGroup(r, value);
  }

  function trayWorkLabel(y, workplace, startIndex, count) {
    if (count === 0) return null;

    const firstCol = Math.floor(startIndex / 2);
    const lastCol = Math.floor((startIndex + count - 1) / 2);

    const midCol = (firstCol + lastCol) / 2;
    const x = CX + (midCol - 3.5) * SLOT_SP;

    const availableWidth =
      (lastCol - firstCol + 1) * SLOT_SP - 0.10;

    return txt(
      `${DATA[workplace].name}: ${count}`,
      P ? 19 : 16,
      DATA[workplace].color,
      at(x, y + 0.275),
      true,
      availableWidth
    );
  }

  function trayDivider(y, nCentral) {
    if (nCentral === 0 || nCentral === 16) return null;

    const boundaryCol = nCentral / 2;

    const x = CX + (boundaryCol - 4) * SLOT_SP;

    return new M.DashedLine({
      start: at(x, y + 0.40),
      end: at(
        x,
        y - 0.105 - SLOT_ROW_SP - SLOT_H / 2 - 0.04
      ),
      color: C.muted,
      strokeWidth: 1.3
    });
  }

  function makeTray(index, hasPass, nCentral = 8, filled = false) {
    const y = TRAY_Y[index];
    const nHill = 16 - nCentral;

    const color = hasPass ? C.amber : C.muted;

    const frame = rect(
      at(CX, y),
      TRAY_W,
      TRAY_H,
      color,
      0.08,
      1.7
    );

    const title = txt(
      hasPass ? 'PASS TRAY' : 'NO-PASS TRAY',
      P ? 20 : 18,
      hasPass ? C.amber : C.ink,
      at(CX - 1.80, y + 0.69),
      true,
      3.15
    );

    const count = txt(
      '16 spaces',
      P ? 18 : 15,
      C.muted,
      at(CX + 2.24, y + 0.69),
      true,
      2.10
    );

    const labels = [
      trayWorkLabel(y, 0, 0, nCentral),
      trayWorkLabel(y, 1, nCentral, nHill)
    ].filter(Boolean);

    const divider = trayDivider(y, nCentral);

    const cells = [];

    for (let i = 0; i < 16; i++) {
      const workplace = i < nCentral ? 0 : 1;

      const minutes = filled
        ? hasPass
          ? DATA[workplace].yes
          : DATA[workplace].no
        : null;

      const p = slotPosition(y, i);

      cells.push({
        index: i,
        workplace,
        position: p,
        minutes,
        mob: traySlot(p, workplace, minutes)
      });
    }

    return {
      index,
      y,
      hasPass,
      nCentral,
      nHill,
      frame,
      title,
      count,
      labels,
      divider,
      cells,
      result: null
    };
  }

  function trayObjects(tray) {
    return [
      tray.frame,
      tray.title,
      tray.count,
      ...tray.labels,
      tray.divider,
      ...tray.cells.map(c => c.mob),
      tray.result
    ].filter(Boolean);
  }

  function revealTray(tray) {
    const a = [
      new M.FadeIn(tray.frame),
      new M.FadeIn(tray.title),
      new M.FadeIn(tray.count),
      ...tray.labels.map(t => new M.FadeIn(t)),
      lagIn(
        tray.cells.map(c => c.mob),
        1.0,
        0.045
      )
    ];

    if (tray.divider) {
      a.push(new M.Create(tray.divider));
    }

    if (tray.result) {
      a.push(new M.FadeIn(tray.result));
    }

    return a;
  }

  function trayOutline(tray, color = C.green) {
    return rect(
      at(CX, tray.y),
      TRAY_W + 0.12,
      TRAY_H + 0.12,
      color,
      0,
      2.2
    );
  }

  function cellsFor(tray, workplace) {
    return tray.cells.filter(c =>
      c.workplace === workplace
    );
  }

  function cellOutline(tray, workplace, color = C.green) {
    const group = cellsFor(tray, workplace);

    const xs = group.map(c => c.position[0]);
    const ys = group.map(c => c.position[1]);

    const left = Math.min(...xs) - SLOT_W / 2 - 0.065;
    const right = Math.max(...xs) + SLOT_W / 2 + 0.065;

    const bottom = Math.min(...ys) - SLOT_H / 2 - 0.065;
    const top = Math.max(...ys) + SLOT_H / 2 + 0.065;

    return rect(
      at(
        (left + right) / 2,
        (bottom + top) / 2
      ),
      right - left,
      top - bottom,
      color,
      0,
      2.2
    );
  }

  function fillWorkplace(tray, workplace) {
    const d = DATA[workplace];
    const minutes = tray.hasPass ? d.yes : d.no;

    const group = cellsFor(tray, workplace);

    // Swap each empty space for a new filled one (old fades out,
    // new fades in) so the minutes are visible as soon as it fills.
    const moves = group.map(cell => {
      cell.minutes = minutes;

      const old = cell.mob;
      const next = traySlot(
        cell.position,
        cell.workplace,
        minutes
      );

      cell.mob = next;

      return new M.AnimationGroup([
        new M.FadeOut(old, { runTime: 0.3 }),
        new M.FadeIn(next, { runTime: 0.45 })
      ]);
    });

    return [
      new M.LaggedStart(
        moves,
        { lagRatio: 0.10, runTime: 1.35 }
      )
    ];
  }

  function trayAverage(tray) {
    const centralValue = tray.hasPass
      ? DATA[0].yes
      : DATA[0].no;

    const hillValue = tray.hasPass
      ? DATA[1].yes
      : DATA[1].no;

    return (
      tray.nCentral * centralValue +
      tray.nHill * hillValue
    ) / 16;
  }

  function resultLabel(tray, value, color = C.green) {
    return txt(
      `AVG ${value} MIN`,
      P ? 17 : 16,
      color,
      at(CX + 1.95, tray.y + 0.69),
      true,
      2.65
    );
  }

  function showTrayAverage(tray, value, color = C.green) {
    const result = resultLabel(tray, value, color);

    const a = [];

    if (tray.count) {
      a.push(new M.FadeOut(tray.count));
      tray.count = null;
    }

    if (tray.result) {
      a.push(new M.FadeOut(tray.result));
    }

    a.push(new M.FadeIn(result));
    tray.result = result;

    return a;
  }

  // ------------------------------------------------------------
  // 14-21: two trays with exactly the same workplace mix
  // ------------------------------------------------------------

  let passTray = makeTray(0, true, 8, false);
  let noTray = makeTray(1, false, 8, false);

  // 14: introduce two trays with 16 spaces each.
  await until(S(14));
  await play(
    ...fadeAll([
      targetTitle,
      ...targetFrames,
      ...targetLabels,
      ...targetSlots.flat(),
      ...observed.flatMap(observedObjects)
    ]),
    ...revealTray(passTray),
    ...revealTray(noTray),
    ...fbox([
      ['TWO TRAYS', C.green],
      ['8 Central spaces each', C.cyan],
      ['8 Hill spaces each', C.violet],
      '16 spaces in each tray.'
    ], C.green),
    ...say('TWO TRAYS, THE SAME 16 SPACES', C.green)
  );

  // 15: a space is a stand-in for a workplace's average time.
  await until(S(15));
  await play(
    new M.Indicate(
      passTray.cells[0].mob,
      { color: C.cyan }
    ),
    new M.Indicate(
      passTray.cells[8].mob,
      { color: C.violet }
    ),
    ...fbox([
      ['ONE SPACE = ONE STAND-IN', C.green],
      'Fill it with the average',
      'for its workplace and',
      'pass group.'
    ], C.green),
    ...say('FILL SPACES WITH GROUP AVERAGES', C.green)
  );

  // 16: the first tray will use the observed pass averages.
  const passSourceFrame = trayOutline(passTray, C.amber);

  await until(S(16));
  await play(
    new M.Create(passSourceFrame),
    ...fbox([
      ['FIRST TRAY: WITH PASS', C.amber],
      ['Central: 25 minutes', C.cyan],
      ['Hill:    45 minutes', C.violet]
    ], C.amber),
    ...say('USE THE PASS AVERAGES IN THE FIRST TRAY', C.amber)
  );

  // 17: the second tray will use the observed no-pass averages.
  const noSourceFrame = trayOutline(noTray, C.green);

  await until(S(17));
  await play(
    new M.FadeOut(passSourceFrame),
    new M.Create(noSourceFrame),
    ...fbox([
      ['SECOND TRAY: NO PASS', C.ink],
      ['Central: 30 minutes', C.cyan],
      ['Hill:    50 minutes', C.violet]
    ], C.green),
    ...say('USE THE NO-PASS AVERAGES IN THE SECOND')
  );

  // 18: both trays have the same workplace mix.
  const matchedFrames = [
    trayOutline(passTray, C.green),
    trayOutline(noTray, C.green)
  ];

  await until(S(18));
  await play(
    new M.FadeOut(noSourceFrame),
    ...matchedFrames.map(r => new M.Create(r)),
    ...fbox([
      ['SAME CHOSEN MIX', C.green],
      'Pass:    8 Central + 8 Hill',
      'No pass: 8 Central + 8 Hill',
      ['The workplace mix matches.', C.green]
    ], C.green),
    ...say('BOTH TRAYS USE THE SAME MIX', C.green)
  );

  // 19: name the method.
  await until(S(19));
  await play(
    ...fbox([
      ['ADJUSTMENT BY', C.green],
      ['STANDARDIZATION', C.green],
      'Compare using',
      'the same chosen mix.'
    ], C.green),
    ...say('ADJUSTMENT BY STANDARDIZATION', C.green)
  );

  // 20: adjustment accounts for a difference between groups.
  await until(S(20));
  await play(
    ...fbox([
      ['ADJUSTMENT', C.violet],
      'Account for a difference',
      'between the groups.',
      ['Here: workplace mix.', C.green]
    ], C.violet),
    ...say('ADJUSTMENT = ACCOUNT FOR A DIFFERENCE', C.violet)
  );

  // 21: standardization uses the same chosen mix on both sides.
  await until(S(21));
  await play(
    ...fadeAll(matchedFrames),
    new M.Indicate(passTray.labels[0], { color: C.cyan }),
    new M.Indicate(noTray.labels[0], { color: C.cyan }),
    new M.Indicate(passTray.labels[1], { color: C.violet }),
    new M.Indicate(noTray.labels[1], { color: C.violet }),
    ...fbox([
      ['STANDARDIZATION', C.green],
      'Use the same chosen mix',
      'for both sides.',
      ['8 Central + 8 Hill', C.green]
    ], C.green),
    ...say('STANDARDIZATION = THE SAME CHOSEN MIX', C.green)
  );

  // ------------------------------------------------------------
  // 22-27: fill the pass tray and calculate its average
  //
  // Central: 8 × 25 = 200.
  // Hill:    8 × 45 = 360.
  // Total:   560.
  // Average: 560 ÷ 16 = 35.
  // ------------------------------------------------------------

  let activeCellOutline = cellOutline(
    passTray,
    0,
    C.cyan
  );

  // 22: fill eight Central spaces with 25 minutes each.
  await until(S(22));
  await play(
    new M.Create(activeCellOutline),
    ...fillWorkplace(passTray, 0),
    ...fbox([
      ['PASS TRAY', C.amber],
      ['Central: 8 spaces', C.cyan],
      ['25 minutes in each', C.cyan],
      '8 × 25'
    ], C.cyan),
    ...say('FILL ALL 8 CENTRAL SPACES WITH 25', C.cyan)
  );

  // 23: eight times twenty-five is two hundred.
  await until(S(23));
  await play(
    ...fbox([
      ['PASS TRAY • CENTRAL', C.cyan],
      '25 + 25 + … + 25',
      '8 × 25',
      ['= 200 minutes', C.cyan]
    ], C.cyan),
    ...say('8 × 25 = 200 MINUTES', C.cyan)
  );

  // 24: fill eight Hill spaces with 45 minutes each.
  const passHillOutline = cellOutline(
    passTray,
    1,
    C.violet
  );

  await until(S(24));
  await play(
    new M.FadeOut(activeCellOutline),
    new M.Create(passHillOutline),
    ...fillWorkplace(passTray, 1),
    ...fbox([
      ['PASS TRAY', C.amber],
      ['Central: 8 × 25 = 200', C.cyan],
      ['Hill: 8 spaces', C.violet],
      ['45 minutes in each', C.violet]
    ], C.violet),
    ...say('FILL ALL 8 HILL SPACES WITH 45', C.violet)
  );

  activeCellOutline = passHillOutline;

  // 25: eight times forty-five is three hundred and sixty.
  await until(S(25));
  await play(
    ...fbox([
      ['PASS TRAY', C.amber],
      ['Central: 8 × 25 = 200', C.cyan],
      ['Hill:    8 × 45 = 360', C.violet]
    ], C.violet),
    ...say('8 × 45 = 360 MINUTES', C.violet)
  );

  const filledPassOutline = trayOutline(
    passTray,
    C.amber
  );

  // 26: add the two workplace subtotals.
  await until(S(26));
  await play(
    new M.FadeOut(activeCellOutline),
    new M.Create(filledPassOutline),
    ...fbox([
      ['PASS TRAY TOTAL', C.amber],
      ['Central: 200', C.cyan],
      ['Hill:    360', C.violet],
      '200 + 360',
      ['= 560 minutes', C.amber]
    ], C.amber),
    ...say('200 + 360 = 560 MINUTES', C.amber)
  );

  // 27: share across sixteen spaces.
  await until(S(27));
  await play(
    new M.FadeOut(filledPassOutline),
    ...showTrayAverage(
      passTray,
      PASS_AVG,
      C.green
    ),
    ...fbox([
      ['PASS TRAY AVERAGE', C.amber],
      'Total = 560 minutes',
      'Count = 16 spaces',
      '560 ÷ 16',
      ['= 35 minutes', C.green]
    ], C.green),
    ...say('560 ÷ 16 = 35 MINUTES', C.green)
  );

  // ------------------------------------------------------------
  // 28-33: fill the no-pass tray and calculate its average
  //
  // Central: 8 × 30 = 240.
  // Hill:    8 × 50 = 400.
  // Total:   640.
  // Average: 640 ÷ 16 = 40.
  // ------------------------------------------------------------

  const noCentralOutline = cellOutline(
    noTray,
    0,
    C.cyan
  );

  // 28: fill eight Central spaces with 30 minutes each.
  await until(S(28));
  await play(
    new M.Create(noCentralOutline),
    ...fillWorkplace(noTray, 0),
    ...fbox([
      ['NO-PASS TRAY', C.ink],
      ['Central: 8 spaces', C.cyan],
      ['30 minutes in each', C.cyan],
      '8 × 30'
    ], C.cyan),
    ...say('FILL ALL 8 CENTRAL SPACES WITH 30', C.cyan)
  );

  activeCellOutline = noCentralOutline;

  // 29: eight times thirty is two hundred and forty.
  await until(S(29));
  await play(
    ...fbox([
      ['NO-PASS TRAY • CENTRAL', C.cyan],
      '8 × 30',
      ['= 240 minutes', C.cyan]
    ], C.cyan),
    ...say('8 × 30 = 240 MINUTES', C.cyan)
  );

  const noHillOutline = cellOutline(
    noTray,
    1,
    C.violet
  );

  // 30: fill eight Hill spaces with 50 minutes each.
  await until(S(30));
  await play(
    new M.FadeOut(activeCellOutline),
    new M.Create(noHillOutline),
    ...fillWorkplace(noTray, 1),
    ...fbox([
      ['NO-PASS TRAY', C.ink],
      ['Central: 8 × 30 = 240', C.cyan],
      ['Hill: 8 spaces', C.violet],
      ['50 minutes in each', C.violet]
    ], C.violet),
    ...say('FILL ALL 8 HILL SPACES WITH 50', C.violet)
  );

  activeCellOutline = noHillOutline;

  // 31: eight times fifty is four hundred.
  await until(S(31));
  await play(
    ...fbox([
      ['NO-PASS TRAY', C.ink],
      ['Central: 8 × 30 = 240', C.cyan],
      ['Hill:    8 × 50 = 400', C.violet]
    ], C.violet),
    ...say('8 × 50 = 400 MINUTES', C.violet)
  );

  const filledNoOutline = trayOutline(
    noTray,
    C.green
  );

  // 32: add the workplace subtotals.
  await until(S(32));
  await play(
    new M.FadeOut(activeCellOutline),
    new M.Create(filledNoOutline),
    ...fbox([
      ['NO-PASS TRAY TOTAL', C.ink],
      ['Central: 240', C.cyan],
      ['Hill:    400', C.violet],
      '240 + 400',
      ['= 640 minutes', C.green]
    ], C.green),
    ...say('240 + 400 = 640 MINUTES', C.green)
  );

  // 33: share across sixteen spaces.
  await until(S(33));
  await play(
    new M.FadeOut(filledNoOutline),
    ...showTrayAverage(
      noTray,
      NO_AVG,
      C.green
    ),
    ...fbox([
      ['NO-PASS TRAY AVERAGE', C.ink],
      'Total = 640 minutes',
      'Count = 16 spaces',
      '640 ÷ 16',
      ['= 40 minutes', C.green]
    ], C.green),
    ...say('640 ÷ 16 = 40 MINUTES', C.green)
  );

  // ------------------------------------------------------------
  // 34-37: compare the standardized averages
  // ------------------------------------------------------------

  // 34: subtract no-pass average from pass average.
  await until(S(34));
  await play(
    new M.Indicate(passTray.result, { color: C.amber }),
    new M.Indicate(noTray.result, { color: C.green }),
    ...fbox([
      ['STANDARDIZED GAP', C.green],
      'Pass average',
      '− No-pass average',
      '35 − 40'
    ], C.green),
    ...say('PASS AVERAGE MINUS NO-PASS AVERAGE', C.green)
  );

  // 35: the standardized difference is negative five minutes.
  await until(S(35));
  await play(
    ...fbox([
      ['SAME WORKPLACE MIX', C.green],
      'Pass average    = 35',
      'No-pass average = 40',
      '35 − 40',
      ['= −5 minutes', C.green]
    ], C.green),
    ...say('35 − 40 = −5 MINUTES', C.green)
  );

  // ------------------------------------------------------------
  // Comparison-bar helpers
  // ------------------------------------------------------------

  const BAR_X = CX - 2.90;
  const BAR_MAX = P ? 5.05 : 5.15;
  const MINUTE_W = BAR_MAX / 50;

  const COMP_Y = P
    ? [1.35, -0.65]
    : [0.52, -1.35];

  function averageBar(value, y, label, color) {
    const width = value * MINUTE_W;

    const background = new M.Rectangle({
      width: BAR_MAX,
      height: P ? 0.39 : 0.34,
      color: C.muted,
      strokeWidth: 1.0
    });

    background.setFill(C.card, 0.32);
    background.moveTo(at(
      BAR_X + BAR_MAX / 2,
      y
    ));

    const bar = new M.Rectangle({
      width,
      height: P ? 0.39 : 0.34,
      color,
      strokeWidth: 1.5
    });

    bar.setFill(color, 0.80);
    bar.moveTo(at(
      BAR_X + width / 2,
      y
    ));

    const title = txt(
      label,
      P ? 19 : 18,
      color,
      at(CX, y + 0.51),
      true,
      PIC_W
    );

    const valueText = txt(
      `${value} min`,
      P ? 19 : 18,
      color,
      at(CX + 2.75, y),
      true,
      1.15
    );

    return new M.VGroup(
      background,
      bar,
      title,
      valueText
    );
  }

  function workplaceMixRow(nCentral, nHill, y) {
    const pitch = 0.31;
    const parts = [];

    for (let i = 0; i < 16; i++) {
      const color = i < nCentral
        ? C.cyan
        : C.violet;

      const p = at(
        CX + (i - 7.5) * pitch,
        y
      );

      const b = new M.Rectangle({
        width: pitch * 0.87,
        height: 0.19,
        color,
        strokeWidth: 1
      });

      b.setFill(color, 0.82);
      b.moveTo(p);

      parts.push(b);
    }

    const label = txt(
      `${nCentral} Central + ${nHill} Hill`,
      P ? 16 : 15,
      C.muted,
      at(CX, y - 0.26),
      true
    );

    parts.push(label);

    return new M.VGroup(...parts);
  }

  function savingBracket(high, low, y, color = C.green) {
    const x1 = BAR_X + low * MINUTE_W;
    const x2 = BAR_X + high * MINUTE_W;

    const cap = 0.10;

    const a = line(
      at(x1, y),
      at(x2, y),
      color,
      2.8
    );

    const b = line(
      at(x1, y - cap),
      at(x1, y + cap),
      color,
      2.5
    );

    const c = line(
      at(x2, y - cap),
      at(x2, y + cap),
      color,
      2.5
    );

    const label = txt(
      `${high - low} min`,
      17,
      color,
      at((x1 + x2) / 2, y + 0.25),
      true,
      1.50
    );

    return new M.VGroup(a, b, c, label);
  }

  // 36: each average is total minutes divided by the space count.
  await until(S(36));
  await play(
    ...fbox([
      ['TRAY AVERAGE', C.green],
      '= total minutes in spaces',
      '  ÷ number of spaces',
      ['Pass:    560 ÷ 16 = 35', C.amber],
      ['No pass: 640 ÷ 16 = 40', C.ink]
    ], C.green),
    ...say('ADD THE MINUTES, DIVIDE BY THE SPACES', C.green)
  );

  // 37: show the resulting comparison and the matched mixes.
  const standardizedPassBar = averageBar(
    PASS_AVG,
    COMP_Y[0],
    'STANDARDIZED WITH PASS',
    C.amber
  );

  const standardizedNoBar = averageBar(
    NO_AVG,
    COMP_Y[1],
    'STANDARDIZED WITHOUT PASS',
    C.ink
  );

  const standardizedPassMix = workplaceMixRow(
    8, 8,
    COMP_Y[0] - 0.49
  );

  const standardizedNoMix = workplaceMixRow(
    8, 8,
    COMP_Y[1] - 0.49
  );

  const standardizedGapTag = pill(
    'GAP: −5 MINUTES',
    C.green,
    P ? 19 : 17
  );

  standardizedGapTag.moveTo(
    at(CX, P ? -2.12 : -2.70)
  );

  const comparisonObjects = [
    standardizedPassBar,
    standardizedNoBar,
    standardizedPassMix,
    standardizedNoMix,
    standardizedGapTag
  ];

  await until(S(37));
  await play(
    ...fadeAll([
      ...trayObjects(passTray),
      ...trayObjects(noTray)
    ]),
    lagIn(
      comparisonObjects,
      1.20,
      0.10
    ),
    ...fbox([
      ['OUR CHOSEN POPULATION', C.green],
      ['8 Central + 8 Hill', C.green],
      'Pass:    35 minutes',
      'No pass: 40 minutes',
      ['Gap = −5 minutes', C.green]
    ], C.green),
    ...say('A GAP FOR THE PEOPLE WE CHOSE TO DESCRIBE', C.green)
  );

  // ------------------------------------------------------------
  // 38-40: distinguish a standardized difference from an effect
  // ------------------------------------------------------------

  // 38: an effect is what the pass itself changes.
  await until(S(38));
  await play(
    ...fbox([
      ['EFFECT', C.green],
      'What the pass itself',
      'changes about',
      'commute time.'
    ], C.green),
    ...say('EFFECT = WHAT THE PASS ITSELF CHANGES', C.green)
  );

  // 39: the gap can estimate an effect if comparisons are fair.
  await until(S(39));
  await play(
    new M.Indicate(
      standardizedGapTag,
      { color: C.green }
    ),
    ...fbox([
      ['POSSIBLE EFFECT ESTIMATE', C.green],
      'The gap is −5 minutes.',
      'It can estimate an effect',
      ['IF workplace comparisons', C.amber],
      ['are fair.', C.amber]
    ], C.green),
    ...say('A FAIR COMPARISON NEEDS ASSUMPTIONS', C.amber)
  );

  // 40: other shared causes may still affect both pass receipt
  // and commute time. Standardization here adjusts workplace only.

  const WARNING_Y = P ? 2.65 : 1.40;

  const sharedCauseNote = txt(
    'Could other shared causes remain?',
    P ? 20 : 18,
    C.amber,
    at(CX, WARNING_Y),
    false,
    PIC_W
  );

  await until(S(40));
  await play(
    new M.FadeIn(sharedCauseNote),
    ...fbox([
      ['CHECK OTHER SHARED CAUSES', C.amber],
      'Distance? Working hours?',
      'Could they influence both',
      'pass receipt and travel time?',
      ['Workplace alone may not suffice.', C.amber]
    ], C.amber),
    ...say('CHECK FOR OTHER SHARED CAUSES', C.amber)
  );

  // ------------------------------------------------------------
  // 41-42: the common trap
  //
  // Filling each tray with its own observed workplace mix.
  //
  // The pass group actually contains 6 Central and 2 Hill.
  // The no-pass group actually contains 2 Central and 6 Hill.
  //
  // To represent these proportions in sixteen-space trays:
  // Pass tray:    12 Central + 4 Hill.
  // No-pass tray: 4 Central + 12 Hill.
  //
  // These are proportionally expanded stand-ins, not additional
  // observed commuters.
  //
  // Pass:    (12 × 25 + 4 × 45) ÷ 16 = 30.
  // No pass: (4 × 30 + 12 × 50) ÷ 16 = 45.
  // Gap:     30 − 45 = −15.
  // ------------------------------------------------------------

  let wrongPassTray = makeTray(
    0,
    true,
    12,
    true
  );

  let wrongNoTray = makeTray(
    1,
    false,
    4,
    true
  );

  const wrongMixNote = txt(
    'Each tray uses its own group’s proportions',
    P ? 17 : 16,
    C.amber,
    at(CX, P ? 2.81 : 1.56),
    false,
    PIC_W
  );

  // 41: show the unequal mixes caused by the trap.
  await until(S(41));
  await play(
    ...fadeAll([
      ...comparisonObjects,
      sharedCauseNote
    ]),
    ...revealTray(wrongPassTray),
    ...revealTray(wrongNoTray),
    new M.FadeIn(wrongMixNote),
    ...fbox([
      ['COMMON TRAP', C.amber],
      'Use each group’s own mix.',
      'Pass:    6/8 Central',
      'No pass: 2/8 Central',
      ['Now the mixes differ again.', C.amber]
    ], C.amber),
    ...say('TRAP: DIFFERENT MIXES IN THE TWO TRAYS', C.amber)
  );

  // 42: the original fifteen-minute difference returns.
  await until(S(42));
  await play(
    ...showTrayAverage(
      wrongPassTray,
      trayAverage(wrongPassTray),
      C.amber
    ),
    ...showTrayAverage(
      wrongNoTray,
      trayAverage(wrongNoTray),
      C.amber
    ),
    ...fbox([
      ['ORIGINAL IMBALANCE RETURNS', C.amber],
      'Pass:    480 ÷ 16 = 30',
      'No pass: 720 ÷ 16 = 45',
      '30 − 45',
      ['= −15 minutes', C.amber]
    ], C.amber),
    ...say('DIFFERENT MIXES BRING BACK THE 15-MINUTE GAP', C.amber)
  );

  // ------------------------------------------------------------
  // 43-47: preview Try it
  //
  // The separate interactive exercise supplies touch/mouse input.
  // This scene demonstrates a chosen-mix slider.
  //
  // Both trays always use the SAME mix.
  // Start with 8 Central and 8 Hill.
  // Then use 4 Central and 12 Hill:
  //
  // Pass:    (4 × 25 + 12 × 45) ÷ 16 = 40.
  // No pass: (4 × 30 + 12 × 50) ÷ 16 = 45.
  // Gap:     40 − 45 = −5.
  //
  // The observed group averages never change in this example.
  // ------------------------------------------------------------

  const SLIDER_Y = P ? -2.65 : -3.00;
  const SLIDER_W = P ? 4.30 : 4.00;

  const sliderLeft = CX - SLIDER_W / 2;
  const sliderRight = CX + SLIDER_W / 2;

  function sliderX(nCentral) {
    return sliderLeft +
      (nCentral / 16) * SLIDER_W;
  }

  function sliderKnob(nCentral) {
    const p = at(
      sliderX(nCentral),
      SLIDER_Y
    );

    const halo = new M.Dot({
      point: p,
      radius: 0.18,
      color: C.green
    });

    halo.setFill(C.green, 0.20);

    const dot = new M.Dot({
      point: p,
      radius: 0.095,
      color: C.green
    });

    dot.setFill(C.green, 1);

    return new M.VGroup(halo, dot);
  }

  const sliderTrack = line(
    at(sliderLeft, SLIDER_Y),
    at(sliderRight, SLIDER_Y),
    C.muted,
    4
  );

  const sliderTicks = [0, 4, 8, 12, 16].map(n =>
    line(
      at(sliderX(n), SLIDER_Y - 0.07),
      at(sliderX(n), SLIDER_Y + 0.07),
      C.muted,
      1.5
    )
  );

  const sliderHillLabel = txt(
    'More Hill',
    P ? 15 : 14,
    C.violet,
    at(sliderLeft - 0.58, SLIDER_Y),
    false,
    1.10
  );

  const sliderCentralLabel = txt(
    'More Central',
    P ? 15 : 14,
    C.cyan,
    at(sliderRight + 0.68, SLIDER_Y),
    false,
    1.35
  );

  let knob = sliderKnob(8);

  const tryTitle = txt(
    'TRY IT: CHOOSE ONE MIX FOR BOTH',
    P ? 19 : 17,
    C.green,
    at(CX, P ? 2.81 : 1.56),
    true,
    PIC_W
  );

  let tryPass = makeTray(
    0,
    true,
    8,
    true
  );

  let tryNo = makeTray(
    1,
    false,
    8,
    true
  );

  // 43: preview a slider that controls both trays together.
  await until(S(43));
  await play(
    ...fadeAll([
      ...trayObjects(wrongPassTray),
      ...trayObjects(wrongNoTray),
      wrongMixNote
    ]),
    new M.FadeIn(tryTitle),
    ...revealTray(tryPass),
    ...revealTray(tryNo),
    new M.Create(sliderTrack),
    ...sliderTicks.map(t => new M.Create(t)),
    new M.FadeIn(sliderHillLabel),
    new M.FadeIn(sliderCentralLabel),
    new M.FadeIn(knob),
    ...fbox([
      ['TRY IT', C.green],
      'Move the chosen-mix slider.',
      'Both trays update together.',
      ['Same mix on both sides.', C.green]
    ], C.green),
    ...say('TRY IT: CHANGE THE CHOSEN MIX', C.green)
  );

  // 44: find the pass average with eight spaces per workplace.
  await until(S(44));
  await play(
    ...showTrayAverage(
      tryPass,
      PASS_AVG,
      C.green
    ),
    ...showTrayAverage(
      tryNo,
      NO_AVG,
      C.green
    ),
    ...fbox([
      ['CHALLENGE 1', C.green],
      '8 Central + 8 Hill',
      'Pass: (200 + 360) ÷ 16',
      ['Answer: 35 minutes', C.green]
    ], C.green),
    ...say('8 CENTRAL + 8 HILL: FIND THE PASS AVERAGE', C.green)
  );

  // 45: give Hill more spaces in BOTH trays.
  //
  // Move from the target 8/8 mix to a hypothetical 4/12 mix.
  // Rebuild the workplace labels and boundary at the new mix.
  // The same sixteen stand-in objects in each tray are transformed.

  function changeTrayMix(tray, nCentral) {
    const a = [];

    a.push(...fadeAll([
      ...tray.labels,
      tray.divider,
      tray.result,
      tray.count
    ]));

    tray.nCentral = nCentral;
    tray.nHill = 16 - nCentral;
    tray.result = null;
    tray.count = null;

    tray.labels = [
      trayWorkLabel(
        tray.y,
        0,
        0,
        tray.nCentral
      ),
      trayWorkLabel(
        tray.y,
        1,
        tray.nCentral,
        tray.nHill
      )
    ].filter(Boolean);

    tray.divider = trayDivider(
      tray.y,
      nCentral
    );

    a.push(
      ...tray.labels.map(t =>
        new M.FadeIn(t)
      )
    );

    if (tray.divider) {
      a.push(new M.Create(tray.divider));
    }

    const moves = [];

    tray.cells.forEach((cell, i) => {
      const workplace = i < nCentral ? 0 : 1;

      const minutes = tray.hasPass
        ? DATA[workplace].yes
        : DATA[workplace].no;

      if (
        cell.workplace !== workplace ||
        cell.minutes !== minutes
      ) {
        moves.push(
          new M.Transform(
            cell.mob,
            traySlot(
              cell.position,
              workplace,
              minutes
            )
          )
        );
      }

      cell.workplace = workplace;
      cell.minutes = minutes;
    });

    if (moves.length > 0) {
      a.push(
        new M.LaggedStart(
          moves,
          { lagRatio: 0.12, runTime: 1.20 }
        )
      );
    }

    return a;
  }

  await until(S(45));
  await play(
    new M.Transform(
      knob,
      sliderKnob(4),
      { runTime: 1.15 }
    ),
    ...changeTrayMix(tryPass, 4),
    ...changeTrayMix(tryNo, 4),
    ...fbox([
      ['CHALLENGE 2', C.green],
      ['Central: 4 spaces', C.cyan],
      ['Hill:    12 spaces', C.violet],
      'Same mix in both trays.',
      'Does the gap change?'
    ], C.green),
    ...say('GIVE HILL MORE SPACES IN BOTH TRAYS', C.violet)
  );

  // 46: both standardized averages increase by five minutes,
  // but their difference remains negative five.
  //
  // This invariance is specific to the current example:
  // both within-workplace gaps equal −5.

  const hillHeavyPass = trayAverage(tryPass);
  const hillHeavyNo = trayAverage(tryNo);

  await until(S(46));
  await play(
    ...showTrayAverage(
      tryPass,
      hillHeavyPass,
      C.green
    ),
    ...showTrayAverage(
      tryNo,
      hillHeavyNo,
      C.green
    ),
    ...fbox([
      ['4 CENTRAL + 12 HILL', C.green],
      'Pass:    (100 + 540)/16 = 40',
      'No pass: (120 + 600)/16 = 45',
      '40 − 45',
      ['Still −5 minutes', C.green]
    ], C.green),
    ...say('THE GAP STAYS AT −5 IN THIS EXAMPLE', C.green)
  );

  // Reinforce why this particular gap does not change.
  await play(
    ...fbox([
      ['WHY DOES IT STAY THE SAME?', C.green],
      ['Central: 25 − 30 = −5', C.cyan],
      ['Hill:    45 − 50 = −5', C.violet],
      'Both workplace gaps match.'
    ], C.green)
  );

  // 47: invite fresh group averages in the interactive exercise.
  // Do not replace the fixed chapter records with invented data.

  const newData = pill(
    'NEW DATA',
    C.green,
    P ? 19 : 17
  );

  newData.moveTo(
    at(CX, SLIDER_Y)
  );

  await until(S(47));
  await play(
    ...fadeAll([
      sliderTrack,
      ...sliderTicks,
      sliderHillLabel,
      sliderCentralLabel,
      knob
    ]),
    new M.FadeIn(newData),
    ...fbox([
      ['TRY FRESH GROUP AVERAGES', C.green],
      'Choose a common mix.',
      'Calculate both averages.',
      ['Check the resulting gap.', C.green]
    ], C.green),
    ...say('NEW DATA: COMPARE AGAIN', C.green)
  );

  // ------------------------------------------------------------
  // 48: final takeaway
  //
  // Restore the original chosen target:
  // Eight Central and eight Hill.
  //
  // Finish with both standardized averages and the −5 gap.
  // ------------------------------------------------------------

  const finalPass = makeTray(
    0,
    true,
    8,
    true
  );

  const finalNo = makeTray(
    1,
    false,
    8,
    true
  );

  // Assemble final average labels before showing either tray.

  finalPass.count = null;
  finalNo.count = null;

  finalPass.result = resultLabel(
    finalPass,
    PASS_AVG,
    C.green
  );

  finalNo.result = resultLabel(
    finalNo,
    NO_AVG,
    C.green
  );

  const finalTitle = txt(
    'STANDARDIZATION',
    P ? 22 : 20,
    C.green,
    at(CX, P ? 2.81 : 1.56),
    true,
    PIC_W
  );

  const finalPassFrame = trayOutline(
    finalPass,
    C.green
  );

  const finalNoFrame = trayOutline(
    finalNo,
    C.green
  );

  const finalGapTag = pill(
    'SAME MIX • GAP: −5 MIN',
    C.green,
    P ? 18 : 16
  );

  finalGapTag.moveTo(
    at(CX, P ? -2.65 : -3.02)
  );

  // Final reveal without attempting to animate absent count labels.
  function revealFinalTray(tray) {
    const a = [
      new M.FadeIn(tray.frame),
      new M.FadeIn(tray.title),
      ...tray.labels.map(t =>
        new M.FadeIn(t)
      ),
      lagIn(
        tray.cells.map(c => c.mob),
        0.95,
        0.035
      ),
      new M.FadeIn(tray.result)
    ];

    if (tray.divider) {
      a.push(new M.Create(tray.divider));
    }

    return a;
  }

  await until(S(48));
  await play(
    ...fadeAll([
      tryTitle,
      ...trayObjects(tryPass),
      ...trayObjects(tryNo),
      newData
    ]),
    new M.FadeIn(finalTitle),
    ...revealFinalTray(finalPass),
    ...revealFinalTray(finalNo),
    new M.Create(finalPassFrame),
    new M.Create(finalNoFrame),
    new M.FadeIn(finalGapTag),
    ...fbox([
      ['STANDARDIZATION', C.green],
      'Give both groups the',
      'same chosen workplace mix.',
      'Compare their averages.',
      ['35 − 40 = −5 minutes', C.green]
    ], C.green),
    ...say('COMPARE GROUPS USING THE SAME CHOSEN MIX', C.green)
  );

  // Finish on the fixed chapter calculation:
  //
  // Pass tray:
  //   8 × 25 + 8 × 45
  //   = 200 + 360
  //   = 560
  //   560 ÷ 16 = 35 minutes.
  //
  // No-pass tray:
  //   8 × 30 + 8 × 50
  //   = 240 + 400
  //   = 640
  //   640 ÷ 16 = 40 minutes.
  //
  // Standardized gap:
  //   35 − 40 = −5 minutes.
  //
  // The standardized gap can estimate an average causal effect
  // if the within-workplace comparisons are fair.
  //
  // The equal five-minute gaps at both workplaces explain why
  // changing their common mix does not change the gap here.
  // This need not hold when workplace-specific gaps differ.
}

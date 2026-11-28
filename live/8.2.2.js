// lesson 8.2.2
// Confounding: how a shared cause can mix into the gap we see.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed Central/Hill chapter snapshot.
// Group-average times stand in for individual times when illustrating totals.
// Try it beats preview the separate interactive exercise.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ------------------------------------------------------------
  // Shared chapter data and responsive layout
  // ------------------------------------------------------------

  const DATA = [
    { name: 'Central', n: 8, pass: 6, yes: 25, no: 30, color: C.cyan },
    { name: 'Hill',    n: 8, pass: 2, yes: 45, no: 50, color: C.violet }
  ];

  const CX = P ? 0 : -2.65;
  const PILL = P ? [0, 3.65, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, -3.85, 0] : [4.25, -0.35, 0];

  const ROW_W = P ? 7.0 : 7.1;
  const ROW_H = P ? 1.48 : 1.40;

  const ROW_Y = P ? [1.45, -0.40] : [0.40, -1.35];
  const SP = P ? 0.76 : 0.77;

  const DOT_R = P ? 0.115 : 0.115;
  const HALO_R = P ? 0.235 : 0.225;
  const RING_R = P ? 0.225 : 0.225;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const at = (x, y) => [x, y, 0];

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

  function lagIn(items, runTime = 0.9, lagRatio = 0.10) {
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
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20;
    const lh = P ? 0.43 : 0.40;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s, size, c, true)
    );

    const maxw = P ? FW - 1.0 : 4.55;
    const rawWidth = Math.max(...texts.map(t => t.getWidth()));

    const scale = Math.min(
      1,
      (maxw - 0.65) / Math.max(rawWidth, 0.01)
    );

    texts.forEach(t => {
      if (scale < 1) t.scale(scale);
    });

    const wd = Math.max(
      2.2,
      Math.max(...texts.map(t => t.getWidth())) + 0.65
    );

    const ht = rows.length * lh + 0.40;

    const r = rect(BOXP, wd, ht, color, 0.96, 2);

    const left = BOXP[0] - wd / 2 + 0.325;
    const top = BOXP[1] + ht / 2 - 0.20 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo(at(
        left + t.getWidth() / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(r, ...texts);

    const a = [];

    if (boxNow) a.push(new M.FadeOut(boxNow));

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
  // Commuter markers
  // Color = workplace.
  // Amber ring = received a pass.
  // ------------------------------------------------------------

  function commuter(p, color, hasPass) {
    const halo = new M.Dot({
      point: p,
      radius: HALO_R,
      color
    });

    halo.setFill(color, 0.16);

    const dot = new M.Dot({
      point: p,
      radius: DOT_R,
      color
    });

    dot.setFill(color, 1);

    const parts = [halo, dot];

    if (hasPass) {
      const ring = new M.Circle({
        radius: RING_R,
        color: C.amber,
        strokeWidth: 2.7
      });

      ring.setFill(C.amber, 0);
      ring.moveTo(p);

      parts.push(ring);
    }

    return new M.VGroup(...parts);
  }

  const rowPos = (k, j) =>
    at(CX + (j - 3.5) * SP, ROW_Y[k] - 0.14);

  const people = [];

  DATA.forEach((d, k) => {
    for (let j = 0; j < d.n; j++) {
      const hasPass = j < d.pass;
      const p = rowPos(k, j);

      people.push({
        workplace: k,
        name: d.name,
        color: d.color,
        pass: hasPass,
        minutes: hasPass ? d.yes : d.no,
        position: p,
        mob: commuter(p, d.color, hasPass)
      });
    }
  });

  const holders = people.filter(p => p.pass);
  const nonholders = people.filter(p => !p.pass);

  const centralPass = holders.filter(p => p.workplace === 0);
  const hillPass = holders.filter(p => p.workplace === 1);
  const centralNo = nonholders.filter(p => p.workplace === 0);
  const hillNo = nonholders.filter(p => p.workplace === 1);

  function movePerson(person, target, pathArc = 0) {
    person.position = target;

    return new M.Transform(
      person.mob,
      commuter(target, person.color, person.pass),
      { pathArc }
    );
  }

  function markPeople(group, color = C.amber, runTime = 1.0) {
    return lagIndicate(
      group.map(p => p.mob),
      color,
      runTime
    );
  }

  function personOutline(group, color = C.amber, extra = 0.16) {
    const xs = group.map(p => p.position[0]);
    const ys = group.map(p => p.position[1]);

    const left = Math.min(...xs) - HALO_R - extra;
    const right = Math.max(...xs) + HALO_R + extra;

    const bottom = Math.min(...ys) - HALO_R - extra;
    const top = Math.max(...ys) + HALO_R + extra;

    return rect(
      at((left + right) / 2, (bottom + top) / 2),
      right - left,
      top - bottom,
      color,
      0,
      2.2
    );
  }

  // ------------------------------------------------------------
  // 0-1: introduce the apparent commute advantage
  // ------------------------------------------------------------

  const introPass = pill('WITH A PASS', C.amber, 23);
  const introNo = pill('WITHOUT A PASS', C.muted, 23);

  introPass.moveTo(P ? at(0, 1.1) : at(-2.2, 0.45));
  introNo.moveTo(P ? at(0, -1.1) : at(2.2, 0.45));

  const introQuestion = txt(
    'What about where they work?',
    P ? 23 : 25,
    C.violet,
    P ? at(0, -2.45) : at(0, -1.15),
    false,
    P ? 7.0 : 9.0
  );

  await until(S(0));
  await play(
    new M.FadeIn(introPass),
    new M.FadeIn(introNo),
    ...say('PASS HOLDERS SEEM TO GET THERE SOONER', C.amber)
  );

  await until(S(1));
  await play(
    new M.FadeIn(introQuestion),
    ...say('HOW MUCH IS DUE TO WORKPLACE?', C.violet)
  );

  // ------------------------------------------------------------
  // 2-5: recover the same Central/Hill commuter picture
  // ------------------------------------------------------------

  const rowFrames = DATA.map((d, k) =>
    rect(
      at(CX, ROW_Y[k]),
      ROW_W,
      ROW_H,
      d.color,
      0.12,
      1.6
    )
  );

  const rowNames = DATA.map((d, k) =>
    txt(
      d.name,
      22,
      d.color,
      at(CX - ROW_W / 2 + 1.0, ROW_Y[k] + 0.43)
    )
  );

  const counts = DATA.map((d, k) =>
    txt(
      `${d.pass} pass  •  ${d.n - d.pass} no pass`,
      P ? 17 : 17,
      C.amber,
      at(CX + ROW_W / 2 - 1.55, ROW_Y[k] + 0.43),
      true,
      3.0
    )
  );

  await until(S(2));
  await play(
    ...fadeAll([introPass, introNo, introQuestion]),
    ...rowFrames.map(r => new M.Create(r)),
    ...rowNames.map(t => new M.FadeIn(t)),
    ...say('CENTRAL AND HILL')
  );

  await until(S(3));
  await play(
    lagIn(people.map(p => p.mob), 1.45, 0.07),
    ...say('1 DOT = 1 COMMUTER   •   RING = PASS', C.amber)
  );

  await until(S(4));
  await play(
    new M.FadeIn(counts[0]),
    markPeople(centralPass, C.amber, 1.0),
    ...say('CENTRAL: 6 WITH PASS, 2 WITHOUT', C.cyan)
  );

  await until(S(5));
  await play(
    new M.FadeIn(counts[1]),
    markPeople(hillPass, C.amber, 0.9),
    ...say('HILL: 2 WITH PASS, 6 WITHOUT', C.violet)
  );

  // ------------------------------------------------------------
  // 6-8: regroup people by pass receipt instead of workplace
  // ------------------------------------------------------------

  const GROUP_Y = P ? [1.35, -0.85] : [0.50, -1.40];

  const groupPos = (k, j) =>
    at(CX + (j - 3.5) * SP, GROUP_Y[k]);

  const passTitle = txt(
    'WITH A PASS',
    P ? 20 : 19,
    C.amber,
    at(CX, GROUP_Y[0] + 0.67),
    true
  );

  const noTitle = txt(
    'WITHOUT A PASS',
    P ? 20 : 19,
    C.ink,
    at(CX, GROUP_Y[1] + 0.67),
    true
  );

  const groupFrames = GROUP_Y.map((y, k) =>
    rect(
      at(CX, y),
      ROW_W,
      0.87,
      k === 0 ? C.amber : C.muted,
      0.06,
      1.4
    )
  );

  const legendCentral = new M.VGroup(
    commuter(at(CX - 1.50, P ? -2.05 : -2.36), C.cyan, false),
    txt(
      'Central',
      16,
      C.cyan,
      at(CX - 0.82, P ? -2.05 : -2.36)
    )
  );

  const legendHill = new M.VGroup(
    commuter(at(CX + 0.70, P ? -2.05 : -2.36), C.violet, false),
    txt(
      'Hill',
      16,
      C.violet,
      at(CX + 1.22, P ? -2.05 : -2.36)
    )
  );

  await until(S(6));
  await play(
    ...fadeAll([...rowFrames, ...rowNames, ...counts]),
    new M.Create(groupFrames[0]),
    new M.FadeIn(passTitle),
    new M.LaggedStart(
      holders.map((p, j) =>
        movePerson(p, groupPos(0, j), 0.18)
      ),
      { lagRatio: 0.06, runTime: 1.45 }
    ),
    ...say('GROUP TOGETHER EVERYONE WITH A PASS', C.amber)
  );

  await until(S(7));
  await play(
    new M.Create(groupFrames[1]),
    new M.FadeIn(noTitle),
    new M.LaggedStart(
      nonholders.map((p, j) =>
        movePerson(p, groupPos(1, j), -0.18)
      ),
      { lagRatio: 0.06, runTime: 1.35 }
    ),
    ...say('GROUP TOGETHER EVERYONE WITHOUT ONE')
  );

  await until(S(8));
  await play(
    new M.FadeIn(legendCentral),
    new M.FadeIn(legendHill),
    ...fbox([
      'average = total ÷ count',
      ['8 people in each group', C.green]
    ]),
    ...say('AVERAGE = THE FAIR SHARE OF TOTAL TIME', C.green)
  );

  // ------------------------------------------------------------
  // 9-13: calculate the pass group's average
  // ------------------------------------------------------------

  const avgNote = txt(
    'Using each workplace group’s average time',
    15,
    C.muted,
    P ? at(CX, 2.63) : at(CX, 1.40),
    false,
    ROW_W
  );

  const passCentralOutline = personOutline(centralPass, C.cyan, 0.10);
  const passHillOutline = personOutline(hillPass, C.violet, 0.10);

  const noCentralOutline = personOutline(centralNo, C.cyan, 0.10);
  const noHillOutline = personOutline(hillNo, C.violet, 0.10);

  function groupMinuteLabel(group, s, color) {
    const x =
      group.reduce((sum, p) => sum + p.position[0], 0) /
      group.length;

    const y = group[0].position[1] - 0.66;

    return txt(
      s,
      P ? 17 : 16,
      color,
      at(x, y),
      true,
      Math.max(1.2, group.length * SP)
    );
  }

  const labelPC = groupMinuteLabel(centralPass, '25 min each', C.cyan);
  const labelPH = groupMinuteLabel(hillPass, '45 min', C.violet);

  const labelNC = groupMinuteLabel(centralNo, '30 min', C.cyan);
  const labelNH = groupMinuteLabel(hillNo, '50 min each', C.violet);

  await until(S(9));
  await play(
    new M.FadeIn(avgNote),
    new M.Create(passCentralOutline),
    new M.FadeIn(labelPC),
    ...fbox([
      ['WITH A PASS', C.amber],
      'Central:',
      ['6 × 25 minutes', C.cyan]
    ]),
    ...say('6 CENTRAL COMMUTERS AT 25 MINUTES', C.cyan)
  );

  await until(S(10));
  await play(
    ...fbox([
      ['WITH A PASS', C.amber],
      ['6 × 25 = 150', C.cyan],
      '150 minutes from Central'
    ]),
    ...say('CENTRAL TOTAL = 150 MINUTES', C.cyan)
  );

  await until(S(11));
  await play(
    new M.FadeOut(passCentralOutline),
    new M.Create(passHillOutline),
    new M.FadeIn(labelPH),
    ...fbox([
      ['WITH A PASS', C.amber],
      ['Central: 6 × 25 = 150', C.cyan],
      ['Hill:    2 × 45 = 90', C.violet]
    ]),
    ...say('2 HILL COMMUTERS: 2 × 45 = 90', C.violet)
  );

  await until(S(12));
  await play(
    new M.FadeOut(passHillOutline),
    ...fbox([
      ['WITH A PASS', C.amber],
      '150 + 90 = 240',
      '240 minutes ÷ 8 people'
    ]),
    ...say('TOTAL 240 MINUTES, SHARED BY 8', C.green)
  );

  const passAverage = pill('AVERAGE: 30 MIN', C.amber, 18);

  passAverage.moveTo(
    P ? at(CX, GROUP_Y[0] - 1.08) : at(CX, GROUP_Y[0] - 0.72)
  );

  await until(S(13));
  await play(
    ...fadeAll([labelPC, labelPH]),
    new M.FadeIn(passAverage),
    ...fbox([
      ['WITH A PASS', C.amber],
      '240 ÷ 8',
      ['= 30 minutes', C.amber]
    ], C.amber),
    ...say('PASS AVERAGE = 30 MINUTES', C.amber)
  );

  // ------------------------------------------------------------
  // 14-17: calculate the no-pass group's average
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    new M.Create(noCentralOutline),
    new M.FadeIn(labelNC),
    ...fbox([
      ['WITHOUT A PASS', C.ink],
      ['Central: 2 × 30 = 60', C.cyan]
    ]),
    ...say('2 CENTRAL COMMUTERS: 2 × 30 = 60', C.cyan)
  );

  await until(S(15));
  await play(
    new M.FadeOut(noCentralOutline),
    new M.Create(noHillOutline),
    new M.FadeIn(labelNH),
    ...fbox([
      ['WITHOUT A PASS', C.ink],
      ['Central: 2 × 30 = 60', C.cyan],
      ['Hill:    6 × 50 = 300', C.violet]
    ]),
    ...say('6 HILL COMMUTERS: 6 × 50 = 300', C.violet)
  );

  await until(S(16));
  await play(
    new M.FadeOut(noHillOutline),
    ...fbox([
      ['WITHOUT A PASS', C.ink],
      '60 + 300 = 360',
      '360 minutes ÷ 8 people'
    ]),
    ...say('TOTAL 360 MINUTES, SHARED BY 8', C.green)
  );

  const noAverage = pill('AVERAGE: 45 MIN', C.ink, 18);

  noAverage.moveTo(
    P ? at(CX, GROUP_Y[1] - 0.70) : at(CX, GROUP_Y[1] - 0.62)
  );

  await until(S(17));
  await play(
    ...fadeAll([labelNC, labelNH]),
    new M.FadeIn(noAverage),
    ...fbox([
      ['WITHOUT A PASS', C.ink],
      '360 ÷ 8',
      ['= 45 minutes', C.ink]
    ]),
    ...say('NO-PASS AVERAGE = 45 MINUTES', C.amber)
  );

  // ------------------------------------------------------------
  // 18-21: show the apparent advantage and the unequal mix
  // ------------------------------------------------------------

  await until(S(18));
  await play(
    new M.Indicate(passAverage, { color: C.amber }),
    new M.Indicate(noAverage, { color: C.amber }),
    ...fbox([
      'pass − no pass',
      '30 − 45',
      ['= −15 minutes', C.amber]
    ], C.amber),
    ...say('APPARENT GAP: 15 MINUTES FASTER', C.amber)
  );

  await until(S(19));
  await play(
    new M.Indicate(legendCentral, { color: C.cyan, runTime: 0.65 }),
    new M.Indicate(legendHill, { color: C.violet, runTime: 0.65 }),
    ...say('LOOK WHERE THE DOTS CAME FROM', C.violet)
  );

  const mixedPassOutline = personOutline(centralPass, C.cyan, 0.10);
  const mixedNoOutline = personOutline(hillNo, C.violet, 0.10);

  await until(S(20));
  await play(
    new M.Create(mixedPassOutline),
    markPeople(centralPass, C.cyan, 1.15),
    ...fbox([
      ['WITH A PASS', C.amber],
      ['6 from Central', C.cyan],
      ['2 from Hill', C.violet],
      'Mostly shorter commutes'
    ], C.cyan),
    ...say('PASS GROUP: MOSTLY CENTRAL', C.cyan)
  );

  await until(S(21));
  await play(
    new M.FadeOut(mixedPassOutline),
    new M.Create(mixedNoOutline),
    markPeople(hillNo, C.violet, 1.15),
    ...fbox([
      ['WITHOUT A PASS', C.ink],
      ['2 from Central', C.cyan],
      ['6 from Hill', C.violet],
      'Mostly longer commutes'
    ], C.violet),
    ...say('NO-PASS GROUP: MOSTLY HILL', C.violet)
  );

  // ------------------------------------------------------------
  // 22: analogy: runners on routes of different lengths
  // ------------------------------------------------------------

  const RUN_X = CX - 2.60;
  const RUN_Y = P ? [1.15, -0.95] : [0.65, -1.15];

  function route(y, width, color, name) {
    const start = at(RUN_X, y);
    const end = at(RUN_X + width, y);

    const track = line(start, end, color, 5.0);

    const startMark = line(
      at(start[0], y - 0.23),
      at(start[0], y + 0.23),
      C.muted,
      2
    );

    const finishMark = line(
      at(end[0], y - 0.25),
      at(end[0], y + 0.25),
      color,
      3
    );

    const label = txt(
      name,
      19,
      color,
      at(RUN_X + 0.80, y - 0.42)
    );

    const finish = txt(
      'Finish',
      15,
      color,
      at(end[0], y - 0.45)
    );

    return new M.VGroup(
      track,
      startMark,
      finishMark,
      label,
      finish
    );
  }

  const shortRoute = route(RUN_Y[0], 3.05, C.cyan, 'Short route');
  const longRoute = route(RUN_Y[1], 5.20, C.violet, 'Long route');

  function runner(p, color) {
    const [x, y] = p;

    const head = new M.Circle({
      radius: 0.11,
      color,
      strokeWidth: 1.5
    });

    head.setFill(color, 1);
    head.moveTo(at(x, y + 0.36));

    const body = line(
      at(x, y + 0.24),
      at(x - 0.04, y + 0.05),
      color,
      3.5
    );

    const arm1 = line(
      at(x - 0.01, y + 0.20),
      at(x + 0.18, y + 0.13),
      color,
      3
    );

    const arm2 = line(
      at(x - 0.01, y + 0.20),
      at(x - 0.18, y + 0.24),
      color,
      3
    );

    const leg1 = line(
      at(x - 0.04, y + 0.05),
      at(x + 0.15, y - 0.12),
      color,
      3
    );

    const leg2 = line(
      at(x - 0.04, y + 0.05),
      at(x - 0.22, y - 0.10),
      color,
      3
    );

    return new M.VGroup(
      head, body, arm1, arm2, leg1, leg2
    );
  }

  const runnerShort = runner(at(RUN_X, RUN_Y[0] + 0.15), C.cyan);
  const runnerLong = runner(at(RUN_X, RUN_Y[1] + 0.15), C.violet);

  const groupedObjects = [
    ...people.map(p => p.mob),
    ...groupFrames,
    passTitle,
    noTitle,
    passAverage,
    noAverage,
    legendCentral,
    legendHill,
    avgNote
  ];

  await until(S(22));
  await play(
    ...fadeAll([...groupedObjects, mixedNoOutline]),
    new M.FadeIn(shortRoute),
    new M.FadeIn(longRoute),
    new M.FadeIn(runnerShort),
    new M.FadeIn(runnerLong),
    ...fbox([
      'Different routes',
      ['Different travel times', C.amber]
    ]),
    ...say('LIKE RUNNERS ON DIFFERENT ROUTES', C.violet)
  );

  await play(
    new M.Transform(
      runnerShort,
      runner(at(RUN_X + 3.05, RUN_Y[0] + 0.15), C.cyan),
      { runTime: 1.4 }
    ),
    new M.Transform(
      runnerLong,
      runner(at(RUN_X + 3.05, RUN_Y[1] + 0.15), C.violet),
      { runTime: 1.4 }
    )
  );

  // ------------------------------------------------------------
  // 23-25: name the mix-up
  // ------------------------------------------------------------

  const mixTitle = txt(
    'Different workplace mixes',
    P ? 23 : 22,
    C.violet,
    at(CX, P ? 2.35 : 1.10)
  );

  const MIX_Y = P ? [1.20, -0.75] : [0.30, -1.35];

  const mixBars = [];

  function mixBar(y, nCentral, nHill, label) {
    const w = P ? 5.7 : 6.2;
    const pitch = w / 8;
    const left = CX - w / 2;

    const blocks = [];

    for (let i = 0; i < nCentral + nHill; i++) {
      const color = i < nCentral ? C.cyan : C.violet;

      const b = new M.Rectangle({
        width: pitch * 0.91,
        height: 0.56,
        color,
        strokeWidth: 1.4
      });

      b.setFill(color, 0.78);
      b.moveTo(at(left + (i + 0.5) * pitch, y));

      blocks.push(b);
    }

    const title = txt(
      label,
      18,
      C.ink,
      at(CX, y + 0.56),
      true
    );

    const count = txt(
      `${nCentral} Central  +  ${nHill} Hill`,
      17,
      C.muted,
      at(CX, y - 0.53),
      true
    );

    return new M.VGroup(title, ...blocks, count);
  }

  mixBars.push(
    mixBar(MIX_Y[0], 6, 2, 'WITH A PASS'),
    mixBar(MIX_Y[1], 2, 6, 'WITHOUT A PASS')
  );

  await until(S(23));
  await play(
    ...fadeAll([shortRoute, longRoute, runnerShort, runnerLong]),
    new M.FadeIn(mixTitle),
    lagIn(mixBars, 1.0, 0.15),
    ...fbox([
      'Different workplace mixes',
      'can exaggerate the gap.',
      ['Observed gap = −15 min', C.amber]
    ], C.violet),
    ...say('MIXING WORKPLACES CAN DISTORT THE GAP', C.violet)
  );

  await until(S(24));
  await play(
    ...fbox([
      ['CONFOUNDING', C.violet],
      'A mix-up caused by',
      'a shared influence.'
    ], C.violet),
    ...say('THIS MIX-UP IS CALLED CONFOUNDING', C.violet)
  );

  await until(S(25));
  await play(
    ...fbox([
      ['Confounder', C.violet],
      'Workplace may influence',
      'both pass receipt',
      'and commute time.'
    ], C.violet),
    ...say('WORKPLACE IS A POSSIBLE SHARED CAUSE', C.violet)
  );

  // ------------------------------------------------------------
  // 26-30: recover the causal diagram and trace the backdoor path
  // ------------------------------------------------------------

  const CARD_W = P ? 2.75 : 2.90;
  const CARD_H = P ? 0.98 : 0.90;
  const WORK_W = P ? 3.35 : 3.25;

  const WP = P ? at(0, 1.85) : at(CX, 0.90);
  const PR = P ? at(-1.95, -0.60) : at(CX - 2.08, -1.45);
  const CT = P ? at(1.95, -0.60) : at(CX + 2.08, -1.45);

  function card(title, subtitle, p, width, color) {
    const r = rect(p, width, CARD_H, color, 0.96, 2);

    const a = txt(
      title,
      P ? 20 : 19,
      color,
      at(p[0], p[1] + 0.15),
      false,
      width - 0.25
    );

    const b = txt(
      subtitle,
      15,
      C.ink,
      at(p[0], p[1] - 0.20),
      false,
      width - 0.25
    );

    return new M.VGroup(r, a, b);
  }

  function arrow(start, end, color, stroke = 3.0) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);

    const ux = dx / length;
    const uy = dy / length;

    const headL = 0.21;
    const headW = 0.11;

    const bx = end[0] - ux * headL;
    const by = end[1] - uy * headL;

    const left = at(
      bx - uy * headW,
      by + ux * headW
    );

    const right = at(
      bx + uy * headW,
      by - ux * headW
    );

    return new M.VGroup(
      line(start, end, color, stroke),
      line(left, end, color, stroke),
      line(right, end, color, stroke)
    );
  }

  const work = card(
    'Workplace location',
    'Where you work',
    WP,
    WORK_W,
    C.violet
  );

  const pass = card(
    'Pass receipt',
    'Got a pass or not',
    PR,
    CARD_W,
    C.cyan
  );

  const time = card(
    'Commute time',
    'Minutes to work',
    CT,
    CARD_W,
    C.amber
  );

  const A1S = at(
    WP[0] - WORK_W * 0.29,
    WP[1] - CARD_H / 2 - 0.06
  );

  const A1E = at(
    PR[0] + CARD_W * 0.15,
    PR[1] + CARD_H / 2 + 0.08
  );

  const A2S = at(
    WP[0] + WORK_W * 0.29,
    WP[1] - CARD_H / 2 - 0.06
  );

  const A2E = at(
    CT[0] - CARD_W * 0.15,
    CT[1] + CARD_H / 2 + 0.08
  );

  const A3S = at(
    PR[0] + CARD_W / 2 + 0.06,
    PR[1]
  );

  const A3E = at(
    CT[0] - CARD_W / 2 - 0.08,
    CT[1]
  );

  const aWP = arrow(A1S, A1E, C.violet);
  const aWT = arrow(A2S, A2E, C.violet);
  const aPT = arrow(A3S, A3E, C.amber, 3.5);

  const path1 = line(A1S, A1E, C.green, 5.0);
  const path2 = line(A2S, A2E, C.green, 5.0);

  function marker(p, color = C.green) {
    const halo = new M.Dot({
      point: p,
      radius: 0.24,
      color
    });

    halo.setFill(color, 0.24);

    const dot = new M.Dot({
      point: p,
      radius: 0.10,
      color
    });

    dot.setFill(color, 1);

    return new M.VGroup(halo, dot);
  }

  const finger = marker(A1E, C.green);

  await until(S(26));
  await play(
    ...fadeAll([mixTitle, ...mixBars]),
    lagIn([work, pass, time], 0.9, 0.12),
    new M.FadeIn(aWP),
    new M.FadeIn(aWT),
    new M.FadeIn(aPT),
    new M.FadeIn(finger),
    ...fbox([
      ['Start here:', C.green],
      'Pass receipt'
    ], C.green),
    ...say('START AT THE PASS CARD', C.green)
  );

  // Walk against the first arrow without reversing its arrowhead.
  await until(S(27));
  await play(
    ...fbox([
      ['Walk backward', C.green],
      'Pass receipt',
      '← Workplace location'
    ], C.green),
    ...say('WALK BACKWARD ALONG THE ARROW', C.green)
  );

  await play(
    new M.Create(path1, { runTime: 1.8 }),
    new M.Transform(
      finger,
      marker(A1S, C.green),
      { runTime: 1.8 }
    )
  );

  // Move across the workplace card and then follow its other arrow.
  await until(S(28));
  await play(
    new M.Transform(
      finger,
      marker(A2S, C.green),
      { runTime: 0.55 }
    ),
    ...fbox([
      ['Now walk forward', C.green],
      'Workplace location',
      '→ Commute time'
    ], C.green),
    ...say('FOLLOW THE OTHER ARROW FORWARD', C.green)
  );

  await play(
    new M.Create(path2, { runTime: 1.6 }),
    new M.Transform(
      finger,
      marker(A2E, C.green),
      { runTime: 1.6 }
    )
  );

  const pathLabel = txt(
    'Pass ← Workplace → Time',
    P ? 21 : 18,
    C.green,
    at(CX, P ? -1.80 : -2.40),
    true,
    P ? 7.0 : 7.1
  );

  await until(S(29));
  await play(
    new M.FadeOut(finger),
    new M.FadeIn(pathLabel),
    ...fbox([
      ['PATH', C.green],
      'A route from card to card',
      'along the arrows.'
    ], C.green),
    ...say('A ROUTE ALONG ARROWS IS A PATH', C.green)
  );

  const backdoorTag = pill('BACKDOOR PATH', C.violet, 18);

  backdoorTag.moveTo(
    at(CX, P ? -2.38 : -2.88)
  );

  await until(S(30));
  await play(
    new M.FadeIn(backdoorTag),
    new M.Indicate(pathLabel, { color: C.green }),
    ...fbox([
      ['BACKDOOR PATH', C.violet],
      'Pass ← Workplace → Time',
      'Starts against an arrow.'
    ], C.violet),
    ...say('BACKDOOR: THE PATH STARTS BACKWARD', C.violet)
  );

  // ------------------------------------------------------------
  // 31: block the backdoor by comparing within one workplace
  // ------------------------------------------------------------

  const workOutline = rect(
    WP,
    WORK_W + 0.24,
    CARD_H + 0.24,
    C.green,
    0,
    2.8
  );

  const blockCenter = at(
    (A1S[0] + A1E[0]) / 2,
    (A1S[1] + A1E[1]) / 2
  );

  const blocker = new M.VGroup(
    line(
      at(blockCenter[0] - 0.19, blockCenter[1] - 0.19),
      at(blockCenter[0] + 0.19, blockCenter[1] + 0.19),
      C.amber,
      5.0
    ),
    line(
      at(blockCenter[0] - 0.19, blockCenter[1] + 0.19),
      at(blockCenter[0] + 0.19, blockCenter[1] - 0.19),
      C.amber,
      5.0
    )
  );

  await until(S(31));
  await play(
    new M.FadeOut(path1),
    new M.FadeOut(path2),
    new M.Create(workOutline),
    new M.FadeIn(blocker),
    ...fbox([
      ['Keep workplace alike', C.green],
      'Compare Central with Central.',
      'Compare Hill with Hill.'
    ], C.green),
    ...say('BLOCK THE BACKDOOR: SAME WORKPLACE', C.green)
  );

  // ------------------------------------------------------------
  // 32-39: aligned minute bars, one comparison per workplace
  // ------------------------------------------------------------

  const graphObjects = [
    work, pass, time,
    aWP, aWT, aPT,
    pathLabel, backdoorTag,
    workOutline, blocker
  ];

  const BAR_X = P ? -3.00 : CX - 3.15;
  const MAX_BAR = P ? 5.35 : 5.50;
  const minuteW = MAX_BAR / 55;

  const BAR_Y = P
    ? [1.65, 0.65, -0.95, -1.95]
    : [0.70, 0.02, -1.20, -1.88];

  const BAR_H = P ? 0.32 : 0.25;

  function minuteBar(v, y, color) {
    const w = v * minuteW;

    const r = new M.Rectangle({
      width: w,
      height: BAR_H,
      color,
      strokeWidth: 1.2
    });

    r.setFill(color, 0.82);
    r.moveTo(at(BAR_X + w / 2, y));

    const value = txt(
      `${v} min`,
      P ? 18 : 17,
      color,
      at(BAR_X + w + 0.54, y),
      true
    );

    return new M.VGroup(r, value);
  }

  function barName(s, y, color) {
    return txt(
      s,
      P ? 16 : 15,
      color,
      at(CX - 1.95, y + (P ? 0.38 : 0.28)),
      false,
      2.25
    );
  }

  const centralTitle = txt(
    'CENTRAL',
    21,
    C.cyan,
    at(CX, P ? 2.50 : 1.42),
    true
  );

  const hillTitle = txt(
    'HILL',
    21,
    C.violet,
    at(CX, P ? -0.12 : -0.60),
    true
  );

  const centralFrame = rect(
    at(CX, P ? 1.22 : 0.40),
    ROW_W,
    P ? 2.05 : 1.60,
    C.cyan,
    0.08,
    1.5
  );

  const hillFrame = rect(
    at(CX, P ? -1.42 : -1.57),
    ROW_W,
    P ? 2.05 : 1.58,
    C.violet,
    0.08,
    1.5
  );

  const b25 = minuteBar(25, BAR_Y[0], C.amber);
  const b30 = minuteBar(30, BAR_Y[1], C.cyan);
  const b45 = minuteBar(45, BAR_Y[2], C.amber);
  const b50 = minuteBar(50, BAR_Y[3], C.violet);

  const name25 = barName('With pass', BAR_Y[0], C.amber);
  const name30 = barName('No pass', BAR_Y[1], C.cyan);
  const name45 = barName('With pass', BAR_Y[2], C.amber);
  const name50 = barName('No pass', BAR_Y[3], C.violet);

  function gapBracket(v1, v2, y, color = C.green) {
    const x1 = BAR_X + v1 * minuteW;
    const x2 = BAR_X + v2 * minuteW;

    const h = 0.09;

    const a = line(
      at(x1, y),
      at(x2, y),
      color,
      2.7
    );

    const b = line(
      at(x1, y - h),
      at(x1, y + h),
      color,
      2.7
    );

    const c = line(
      at(x2, y - h),
      at(x2, y + h),
      color,
      2.7
    );

    const label = txt(
      '5 min',
      P ? 16 : 15,
      color,
      at(x1 - 0.50, y),
      true
    );

    return new M.VGroup(a, b, c, label);
  }

  const gapCentral = gapBracket(
    25, 30, BAR_Y[1] - (P ? 0.34 : 0.28)
  );

  const gapHill = gapBracket(
    45, 50, BAR_Y[3] - (P ? 0.34 : 0.28)
  );

  // 32: Central with pass = 25 minutes.
  await until(S(32));
  await play(
    ...fadeAll(graphObjects),
    new M.FadeIn(centralFrame),
    new M.FadeIn(centralTitle),
    new M.FadeIn(name25),
    new M.FadeIn(b25),
    ...fbox([
      ['CENTRAL ONLY', C.cyan],
      ['Pass average = 25', C.amber]
    ], C.cyan),
    ...say('CENTRAL WITH PASS: 25 MINUTES', C.cyan)
  );

  // 33: Central without pass = 30 minutes.
  await until(S(33));
  await play(
    new M.FadeIn(name30),
    new M.FadeIn(b30),
    ...fbox([
      ['CENTRAL ONLY', C.cyan],
      ['Pass average = 25', C.amber],
      'No-pass average = 30'
    ], C.cyan),
    ...say('CENTRAL WITHOUT PASS: 30 MINUTES', C.cyan)
  );

  // 34: subtract Central averages.
  await until(S(34));
  await play(
    new M.FadeIn(gapCentral),
    ...fbox([
      ['CENTRAL ONLY', C.cyan],
      '25 − 30',
      ['= −5 minutes', C.green]
    ], C.green),
    ...say('25 − 30 = −5 MINUTES', C.green)
  );

  // 35: interpret the minus sign.
  await until(S(35));
  await play(
    new M.Indicate(gapCentral, { color: C.green }),
    ...fbox([
      ['−5 minutes', C.green],
      'The pass group averages',
      '5 minutes less.'
    ], C.green),
    ...say('NEGATIVE MEANS THE PASS GROUP IS FASTER', C.green)
  );

  // 36: Hill with pass = 45 minutes.
  await until(S(36));
  await play(
    new M.FadeIn(hillFrame),
    new M.FadeIn(hillTitle),
    new M.FadeIn(name45),
    new M.FadeIn(b45),
    ...fbox([
      ['HILL ONLY', C.violet],
      ['Pass average = 45', C.amber]
    ], C.violet),
    ...say('HILL WITH PASS: 45 MINUTES', C.violet)
  );

  // 37: Hill without pass = 50 minutes.
  await until(S(37));
  await play(
    new M.FadeIn(name50),
    new M.FadeIn(b50),
    ...fbox([
      ['HILL ONLY', C.violet],
      ['Pass average = 45', C.amber],
      'No-pass average = 50'
    ], C.violet),
    ...say('HILL WITHOUT PASS: 50 MINUTES', C.violet)
  );

  // 38: subtract Hill averages.
  await until(S(38));
  await play(
    new M.FadeIn(gapHill),
    ...fbox([
      ['HILL ONLY', C.violet],
      '45 − 50',
      ['= −5 minutes', C.green]
    ], C.green),
    ...say('45 − 50 = −5 MINUTES', C.green)
  );

  // 39: rule for the within-workplace comparison.
  await until(S(39));
  await play(
    new M.Indicate(gapCentral, { color: C.green }),
    new M.Indicate(gapHill, { color: C.green }),
    ...fbox([
      ['WITHIN ONE WORKPLACE', C.green],
      'gap = pass average',
      '    − no-pass average',
      ['Central: −5   Hill: −5', C.green]
    ], C.green),
    ...say('SUBTRACT WITHIN THE SAME WORKPLACE', C.green)
  );

  // ------------------------------------------------------------
  // 40-43: compare the mixed gap with both within-workplace gaps
  // ------------------------------------------------------------

  const allBars = [
    centralFrame, centralTitle,
    hillFrame, hillTitle,
    b25, b30, b45, b50,
    name25, name30, name45, name50,
    gapCentral, gapHill
  ];

  const GAP_X = P ? -2.75 : CX - 2.85;
  const GAP_SCALE = P ? 0.36 : 0.37;

  const GAP_Y = P
    ? [1.40, -0.05, -1.50]
    : [0.90, -0.45, -1.80];

  function comparisonBar(n, y, color, title) {
    const width = n * GAP_SCALE;

    const r = new M.Rectangle({
      width,
      height: P ? 0.40 : 0.34,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, 0.78);
    r.moveTo(at(GAP_X + width / 2, y));

    const lab = txt(
      title,
      19,
      color,
      at(CX, y + 0.47)
    );

    const num = txt(
      `−${n} min`,
      17,
      C.bg,
      at(GAP_X + width / 2, y),
      true,
      width - 0.12
    );

    return new M.VGroup(r, lab, num);
  }

  const mixedGap = comparisonBar(
    15, GAP_Y[0], C.amber, 'Across workplaces'
  );

  const centralGap = comparisonBar(
    5, GAP_Y[1], C.cyan, 'Central only'
  );

  const hillGap = comparisonBar(
    5, GAP_Y[2], C.violet, 'Hill only'
  );

  await until(S(40));
  await play(
    ...fadeAll(allBars),
    lagIn([mixedGap, centralGap, hillGap], 1.35, 0.18),
    ...fbox([
      ['Across workplaces: −15', C.amber],
      ['Central only:       −5', C.cyan],
      ['Hill only:          −5', C.violet]
    ], C.green),
    ...say('FROM A 15-MINUTE GAP TO A 5-MINUTE GAP', C.green)
  );

  const extraWidth = 10 * GAP_SCALE;

  const extraMix = new M.Rectangle({
    width: extraWidth,
    height: P ? 0.40 : 0.34,
    color: C.violet,
    strokeWidth: 1.7
  });

  extraMix.setFill(C.violet, 0.90);

  extraMix.moveTo(at(
    GAP_X + 5 * GAP_SCALE + extraWidth / 2,
    GAP_Y[0]
  ));

  const mixTen = txt(
    '10 min',
    17,
    C.bg,
    at(
      GAP_X + 5 * GAP_SCALE + extraWidth / 2,
      GAP_Y[0]
    ),
    true
  );

  const mixExplanation = txt(
    'Extra gap from the different workplace mix',
    17,
    C.violet,
    at(CX, GAP_Y[0] - 0.46),
    false,
    ROW_W
  );

  await until(S(41));
  await play(
    new M.FadeIn(extraMix),
    new M.FadeIn(mixTen),
    new M.FadeIn(mixExplanation),
    ...fbox([
      '15 − 5 = 10',
      ['10 minutes of extra gap', C.violet],
      'from the workplace mix.'
    ], C.violet),
    ...say('THE WORKPLACE MIX ADDS 10 MINUTES', C.violet)
  );

  await until(S(42));
  await play(
    new M.Indicate(centralGap, { color: C.green }),
    new M.Indicate(hillGap, { color: C.green }),
    ...fbox([
      ['Look for shared causes', C.green],
      'Keep them alike when',
      'making comparisons.'
    ], C.green),
    ...say('CONFOUNDING TELLS US WHAT TO KEEP ALIKE', C.green)
  );

  await until(S(43));
  await play(
    ...fbox([
      ['TRAP', C.amber],
      'A 5-minute difference',
      'is not automatically',
      'a 5-minute causal effect.',
      ['Check other shared causes.', C.amber]
    ], C.amber),
    ...say('A WITHIN-GROUP GAP IS NOT PROOF OF AN EFFECT', C.amber)
  );

  // ------------------------------------------------------------
  // 44-47: preview Try it
  // The separate interactive component handles mouse/touch controls.
  // Begin with the exact observed chapter snapshot.
  // Any modified counts are explicitly hypothetical.
  // ------------------------------------------------------------

  const summaryObjects = [
    mixedGap,
    centralGap,
    hillGap,
    extraMix,
    mixTen,
    mixExplanation
  ];

  const TRY_Y = P ? [1.55, -0.40] : [0.55, -1.35];

  const tryFrames = DATA.map((d, k) =>
    rect(
      at(CX, TRY_Y[k]),
      ROW_W,
      P ? 1.50 : 1.40,
      d.color,
      0.12,
      1.7
    )
  );

  const tryNames = DATA.map((d, k) =>
    txt(
      d.name,
      21,
      d.color,
      at(CX - ROW_W / 2 + 1.02, TRY_Y[k] + 0.44)
    )
  );

  function tryPos(k, j) {
    return at(
      CX + (j - 3.5) * SP,
      TRY_Y[k] - 0.12
    );
  }

  function countLabel(k, n) {
    return txt(
      `${n} pass  •  ${8 - n} no pass`,
      16,
      C.amber,
      at(CX + ROW_W / 2 - 1.55, TRY_Y[k] + 0.44),
      true,
      3.0
    );
  }

  const tryDots = DATA.map((d, k) =>
    Array.from(
      { length: 8 },
      (_, j) => commuter(
        tryPos(k, j),
        d.color,
        j < d.pass
      )
    )
  );

  let tryCountLabels = [
    countLabel(0, 6),
    countLabel(1, 2)
  ];

  const tryHeading = txt(
    'TRY IT: CHANGE THE PASS COUNTS',
    P ? 18 : 17,
    C.green,
    at(CX, P ? 2.75 : 1.40),
    true,
    ROW_W
  );

  const tryNote = txt(
    'Fixed workplace averages: Central 25 / 30, Hill 45 / 50',
    P ? 16 : 15,
    C.muted,
    at(CX, P ? -1.55 : -2.33),
    true,
    ROW_W
  );

  await until(S(44));
  await play(
    ...fadeAll(summaryObjects),
    new M.FadeIn(tryHeading),
    ...tryFrames.map(r => new M.FadeIn(r)),
    ...tryNames.map(t => new M.FadeIn(t)),
    ...tryCountLabels.map(t => new M.FadeIn(t)),
    lagIn(tryDots.flat(), 1.0, 0.05),
    new M.FadeIn(tryNote),
    ...fbox([
      ['CURRENT SNAPSHOT', C.green],
      'Pass average = 30',
      'No-pass average = 45',
      ['City gap = −15 min', C.amber]
    ], C.green),
    ...say('TRY IT: CHANGE THE WORKPLACE MIX', C.green)
  );

  const tryCentralOutline = rect(
    at(CX, TRY_Y[0]),
    ROW_W + 0.16,
    (P ? 1.50 : 1.40) + 0.16,
    C.green,
    0,
    2.3
  );

  await until(S(45));
  await play(
    new M.Create(tryCentralOutline),
    ...fbox([
      ['CENTRAL ONLY', C.cyan],
      '25 − 30',
      ['= −5 minutes', C.green]
    ], C.green),
    ...say('CHALLENGE: FIND THE CENTRAL GAP', C.green)
  );

  // 46: demonstrate a hypothetical stronger imbalance.
  // Central: 7 pass, 1 no pass.
  // Hill:    1 pass, 7 no pass.
  // Workplace averages remain exactly 25/30 and 45/50.
  // Pass average = (7 × 25 + 1 × 45) ÷ 8 = 27.5.
  // No-pass average = (1 × 30 + 7 × 50) ÷ 8 = 47.5.
  // Whole-city gap = −20, while both workplace gaps stay −5.

  const hypothetical = pill(
    'IMAGINED COUNTS',
    C.violet,
    17
  );

  hypothetical.moveTo(
    at(CX, P ? -2.15 : -2.70)
  );

  const imaginedCountLabels = [
    countLabel(0, 7),
    countLabel(1, 1)
  ];

  await until(S(46));
  await play(
    new M.FadeOut(tryCentralOutline),
    new M.FadeIn(hypothetical),
    new M.Transform(
      tryDots[0][6],
      commuter(tryPos(0, 6), C.cyan, true),
      { runTime: 0.8 }
    ),
    new M.Transform(
      tryDots[1][1],
      commuter(tryPos(1, 1), C.violet, false),
      { runTime: 0.8 }
    ),
    ...fadeAll(tryCountLabels),
    ...imaginedCountLabels.map(t => new M.FadeIn(t)),
    ...fbox([
      ['IMAGINED COUNTS: 7 / 1', C.violet],
      'Pass average = 27.5',
      'No-pass average = 47.5',
      ['City gap = −20 min', C.amber],
      ['Both workplace gaps = −5', C.green]
    ], C.violet),
    ...say('BIGGER MIXED GAP, SAME WORKPLACE GAPS', C.violet)
  );

  tryCountLabels = imaginedCountLabels;

  // 47: invite the learner to generate fresh values in Try it.
  // Restore the fixed chapter records rather than introducing
  // unprovided commute records into the narrated scene.

  const restoredCountLabels = [
    countLabel(0, 6),
    countLabel(1, 2)
  ];

  const newData = pill('NEW DATA', C.green, 18);

  newData.moveTo(
    at(CX, P ? -2.25 : -2.72)
  );

  await until(S(47));
  await play(
    new M.FadeOut(hypothetical),
    new M.FadeIn(newData),
    new M.Transform(
      tryDots[0][6],
      commuter(tryPos(0, 6), C.cyan, false),
      { runTime: 0.65 }
    ),
    new M.Transform(
      tryDots[1][1],
      commuter(tryPos(1, 1), C.violet, true),
      { runTime: 0.65 }
    ),
    ...fadeAll(tryCountLabels),
    ...restoredCountLabels.map(t => new M.FadeIn(t)),
    ...fbox([
      ['Try fresh commute times', C.green],
      'Compare the whole city.',
      'Then compare within',
      'each workplace.'
    ], C.green),
    ...say('NEW DATA: CHECK FOR CONFOUNDING AGAIN', C.green)
  );

  tryCountLabels = restoredCountLabels;

  // ------------------------------------------------------------
  // 48: final takeaway
  // ------------------------------------------------------------

  const finalMixed = comparisonBar(
    15, GAP_Y[0], C.amber, 'Across workplaces'
  );

  const finalCentral = comparisonBar(
    5, GAP_Y[1], C.cyan, 'Central only'
  );

  const finalHill = comparisonBar(
    5, GAP_Y[2], C.violet, 'Hill only'
  );

  const finalExtra = new M.Rectangle({
    width: extraWidth,
    height: P ? 0.40 : 0.34,
    color: C.violet,
    strokeWidth: 1.7
  });

  finalExtra.setFill(C.violet, 0.90);

  finalExtra.moveTo(at(
    GAP_X + 5 * GAP_SCALE + extraWidth / 2,
    GAP_Y[0]
  ));

  const finalExtraText = txt(
    '10 min',
    17,
    C.bg,
    at(
      GAP_X + 5 * GAP_SCALE + extraWidth / 2,
      GAP_Y[0]
    ),
    true
  );

  const finalMixNote = txt(
    'Extra gap from workplace mix',
    17,
    C.violet,
    at(CX, GAP_Y[0] - 0.46)
  );

  await until(S(48));
  await play(
    ...fadeAll([
      tryHeading,
      tryNote,
      ...tryFrames,
      ...tryNames,
      ...tryCountLabels,
      ...tryDots.flat(),
      newData
    ]),
    lagIn([finalMixed, finalCentral, finalHill], 1.15, 0.12),
    new M.FadeIn(finalExtra),
    new M.FadeIn(finalExtraText),
    new M.FadeIn(finalMixNote),
    ...fbox([
      ['CONFOUNDING', C.violet],
      'A shared cause can mix',
      'its influence into',
      'the gap we observe.',
      ['Compare like with like.', C.green]
    ], C.green),
    ...say('CONFOUNDING: A SHARED CAUSE CAN DISTORT A GAP', C.green)
  );
}

// lesson 8.2.4
// Mediators: tracing the routes from a cause to a result.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the separate, fixed illustration of one imagined commuter:
//   No pass + driving:             40 minutes
//   Pass + driving + shuttle:      38 minutes
//   Pass + bus:                    32 minutes
// Saving while driving = 2 minutes.
// Further saving from switching to the bus = 6 minutes.
// Whole imagined saving = 8 minutes.
// Try it beats preview the separate interactive exercise.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ------------------------------------------------------------
  // Fixed illustration and responsive layout
  // ------------------------------------------------------------

  const DATA = [
    {
      id: 0,
      pass: false,
      mode: 'Driving',
      shuttle: false,
      minutes: 40,
      color: C.muted
    },
    {
      id: 1,
      pass: true,
      mode: 'Driving',
      shuttle: true,
      minutes: 38,
      color: C.violet
    },
    {
      id: 2,
      pass: true,
      mode: 'Bus',
      shuttle: false,
      minutes: 32,
      color: C.cyan
    }
  ];

  const SAVE_DRIVE = DATA[0].minutes - DATA[1].minutes;
  const SAVE_BUS = DATA[1].minutes - DATA[2].minutes;
  const SAVE_TOTAL = DATA[0].minutes - DATA[2].minutes;

  const CX = P ? 0 : -2.65;
  const PILL = P ? [0, 3.65, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, -4.15, 0] : [4.25, -0.30, 0];

  const PIC_W = P ? 7.0 : 7.1;
  const BAR_X = CX - 3.05;
  const BAR_MAX = P ? 5.15 : 5.20;
  const MINUTE_W = BAR_MAX / 40;
  const BAR_H = P ? 0.40 : 0.34;

  const BAR_Y = P
    ? [1.65, 0.05, -1.55]
    : [0.55, -0.70, -1.95];

  const TITLE_Y = P ? 2.80 : 1.40;

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
      { lagRatio: 0.12, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula / explanation box
  //
  // Each replacement is a newly assembled group.
  // No visible objects are detached by regrouping.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.41 : 0.40;

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
  // Small transport icons, built from basic Manim shapes
  // ------------------------------------------------------------

  function busIcon(p, color = C.cyan, scale = 1) {
    const [x, y] = p;
    const s = scale;

    const body = new M.RoundedRectangle({
      width: 1.35 * s,
      height: 0.65 * s,
      cornerRadius: 0.10 * s,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.16);
    body.moveTo(at(x, y));

    const windows = [-0.38, 0, 0.38].map(dx => {
      const r = new M.Rectangle({
        width: 0.28 * s,
        height: 0.25 * s,
        color,
        strokeWidth: 1.1
      });

      r.setFill(color, 0.38);
      r.moveTo(at(
        x + dx * s,
        y + 0.11 * s
      ));

      return r;
    });

    const wheels = [-0.40, 0.40].map(dx => {
      const w = new M.Circle({
        radius: 0.115 * s,
        color: C.ink,
        strokeWidth: 1.4
      });

      w.setFill(C.ink, 1);
      w.moveTo(at(
        x + dx * s,
        y - 0.34 * s
      ));

      return w;
    });

    return new M.VGroup(
      body,
      ...windows,
      ...wheels
    );
  }

  function carIcon(p, color = C.muted, scale = 1) {
    const [x, y] = p;
    const s = scale;

    const body = new M.RoundedRectangle({
      width: 1.27 * s,
      height: 0.38 * s,
      cornerRadius: 0.10 * s,
      color,
      strokeWidth: 1.9
    });

    body.setFill(color, 0.20);
    body.moveTo(at(x, y - 0.08 * s));

    const roof = new M.RoundedRectangle({
      width: 0.70 * s,
      height: 0.35 * s,
      cornerRadius: 0.11 * s,
      color,
      strokeWidth: 1.7
    });

    roof.setFill(color, 0.16);
    roof.moveTo(at(x, y + 0.21 * s));

    const divider = line(
      at(x, y + 0.06 * s),
      at(x, y + 0.36 * s),
      color,
      1.5
    );

    const wheels = [-0.40, 0.40].map(dx => {
      const w = new M.Circle({
        radius: 0.115 * s,
        color: C.ink,
        strokeWidth: 1.4
      });

      w.setFill(C.ink, 1);
      w.moveTo(at(
        x + dx * s,
        y - 0.28 * s
      ));

      return w;
    });

    return new M.VGroup(
      roof,
      body,
      divider,
      ...wheels
    );
  }

  function commuterIcon(p, hasPass = false, color = C.cyan) {
    const [x, y] = p;

    const halo = new M.Dot({
      point: at(x, y),
      radius: 0.43,
      color
    });

    halo.setFill(color, 0.10);

    const head = new M.Circle({
      radius: 0.16,
      color,
      strokeWidth: 1.5
    });

    head.setFill(color, 1);
    head.moveTo(at(x, y + 0.26));

    const body = new M.Arc({
      radius: 0.29,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.95);
    body.moveTo(at(x, y - 0.06));

    const parts = [halo, head, body];

    if (hasPass) {
      const ring = new M.Circle({
        radius: 0.48,
        color: C.amber,
        strokeWidth: 2.4
      });

      ring.setFill(C.amber, 0);
      ring.moveTo(at(x, y + 0.02));

      parts.push(ring);
    }

    return new M.VGroup(...parts);
  }

  function ticket(p, width = 2.65) {
    const [x, y] = p;

    const r = rect(
      p,
      width,
      0.88,
      C.amber,
      0.96,
      2
    );

    const title = txt(
      'CITY PASS',
      21,
      C.amber,
      at(x, y + 0.15),
      true,
      width - 0.20
    );

    const sub = txt(
      'Bus + parking shuttle',
      15,
      C.ink,
      at(x, y - 0.18),
      false,
      width - 0.20
    );

    return new M.VGroup(r, title, sub);
  }

  // ------------------------------------------------------------
  // 0-2: introduce the two possible ways a pass could save time
  // ------------------------------------------------------------

  const introPass = ticket(
    at(CX, P ? 1.95 : 0.82),
    P ? 3.05 : 3.0
  );

  const introBus = busIcon(
    at(CX - 1.75, P ? 0.15 : -0.68),
    C.cyan,
    1.05
  );

  const introShuttle = busIcon(
    at(CX + 1.75, P ? 0.15 : -0.68),
    C.violet,
    0.84
  );

  const introBusLabel = txt(
    'Bus fares',
    20,
    C.cyan,
    at(CX - 1.75, P ? -0.60 : -1.38)
  );

  const introShuttleLabel = txt(
    'Parking shuttle',
    20,
    C.violet,
    at(CX + 1.75, P ? -0.60 : -1.38)
  );

  const introBusLink = line(
    at(CX - 0.70, P ? 1.47 : 0.34),
    at(CX - 1.75, P ? 0.65 : -0.18),
    C.cyan,
    2.5
  );

  const introShuttleLink = line(
    at(CX + 0.70, P ? 1.47 : 0.34),
    at(CX + 1.75, P ? 0.65 : -0.18),
    C.violet,
    2.5
  );

  const introObjects = [
    introPass,
    introBus,
    introShuttle,
    introBusLabel,
    introShuttleLabel,
    introBusLink,
    introShuttleLink
  ];

  // 0: how could the pass save someone time?
  await until(S(0));
  await play(
    new M.FadeIn(introPass),
    ...say('HOW COULD A PASS SAVE TIME?', C.amber)
  );

  // 1: the pass covers bus fares and includes a parking shuttle.
  await until(S(1));
  await play(
    new M.Create(introBusLink),
    new M.Create(introShuttleLink),
    lagIn(
      [
        introBus,
        introBusLabel,
        introShuttle,
        introShuttleLabel
      ],
      1.05,
      0.12
    ),
    ...fbox([
      ['TWO POSSIBLE ROUTES', C.amber],
      ['Cheaper bus travel', C.cyan],
      ['Parking-lot shuttle', C.violet]
    ], C.amber),
    ...say('ONE PASS, TWO POSSIBLE BENEFITS')
  );

  // 2: could changing travel mode help?
  await until(S(2));
  await play(
    new M.Indicate(introBus, { color: C.cyan }),
    ...fbox([
      'Could the pass change',
      'how someone travels?',
      ['And therefore their time?', C.green]
    ], C.cyan),
    ...say('COULD CHANGING THE JOURNEY SAVE TIME?', C.cyan)
  );

  // ------------------------------------------------------------
  // 3-4: one commuter, three imagined alternatives
  // ------------------------------------------------------------

  const PERSON_Y = P ? 1.0 : -0.10;
  const VERSION_SP = P ? 2.32 : 2.30;

  const versionPos = i =>
    at(CX + (i - 1) * VERSION_SP, PERSON_Y);

  function versionCard(d, p) {
    const [x, y] = p;

    const w = P ? 2.12 : 2.10;
    const h = P ? 2.25 : 1.95;

    const frame = rect(
      p,
      w,
      h,
      d.color,
      0.94,
      1.6
    );

    const person = commuterIcon(
      at(x, y + 0.30),
      d.pass,
      C.cyan
    );

    const heading = txt(
      `VERSION ${d.id + 1}`,
      16,
      d.color,
      at(x, y + h / 2 - 0.23),
      true,
      w - 0.20
    );

    const passText = txt(
      d.pass ? 'Has a pass' : 'No pass',
      17,
      d.pass ? C.amber : C.muted,
      at(x, y - 0.39),
      false,
      w - 0.18
    );

    const modeText = txt(
      d.mode,
      18,
      d.color,
      at(x, y - 0.72),
      false,
      w - 0.18
    );

    return new M.VGroup(
      frame,
      person,
      heading,
      passText,
      modeText
    );
  }

  const versions = DATA.map((d, i) =>
    versionCard(d, versionPos(i))
  );

  const samePerson = txt(
    'SAME PERSON • SAME WORKDAY',
    P ? 20 : 19,
    C.green,
    at(CX, P ? 2.60 : 1.30),
    true,
    PIC_W
  );

  const imaginedNote = txt(
    'Three imagined versions, not three different people',
    P ? 17 : 16,
    C.muted,
    at(CX, P ? -0.70 : -1.55),
    false,
    PIC_W
  );

  // 3: picture the same commuter in three possible versions.
  await until(S(3));
  await play(
    ...fadeAll(introObjects),
    new M.FadeIn(samePerson),
    lagIn(versions, 1.45, 0.23),
    ...fbox([
      'One commuter',
      'One workday',
      ['Three imagined alternatives', C.green]
    ], C.green),
    ...say('IMAGINE THE SAME WORKDAY THREE WAYS', C.green)
  );

  // 4: only one version can happen in reality.
  await until(S(4));
  await play(
    new M.FadeIn(imaginedNote),
    ...fbox([
      ['IMAGINED ALTERNATIVES', C.violet],
      'Only one can really happen.',
      'The other two are imagined.',
      'These are not three observations.'
    ], C.violet),
    ...say('ONLY ONE VERSION CAN ACTUALLY HAPPEN', C.violet)
  );

  // ------------------------------------------------------------
  // Minute-bar helpers
  //
  // Every bar starts at the same zero point.
  // Length is proportional to minutes.
  // Values are the fixed imagined trip times, not observed data.
  // ------------------------------------------------------------

  function versionLabel(d) {
    if (d.id === 0) return '1. NO PASS • DRIVING';
    if (d.id === 1) return '2. PASS • DRIVING + SHUTTLE';
    return '3. PASS • BUS';
  }

  function barBackground(y) {
    const r = new M.Rectangle({
      width: BAR_MAX,
      height: BAR_H,
      color: C.muted,
      strokeWidth: 1.3
    });

    r.setFill(C.card, 0.35);
    r.moveTo(at(
      BAR_X + BAR_MAX / 2,
      y
    ));

    return r;
  }

  function minuteBar(v, y, color) {
    const width = v * MINUTE_W;

    const r = new M.Rectangle({
      width,
      height: BAR_H,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, 0.82);
    r.moveTo(at(
      BAR_X + width / 2,
      y
    ));

    return r;
  }

  function minuteLabel(v, y, color) {
    return txt(
      `${v} min`,
      P ? 19 : 18,
      color,
      at(CX + 2.80, y),
      true,
      1.20
    );
  }

  function barTitle(d, y) {
    return txt(
      versionLabel(d),
      P ? 18 : 17,
      d.color,
      at(CX - 0.47, y + (P ? 0.52 : 0.39)),
      true,
      PIC_W - 0.25
    );
  }

  function makeBarRow(d, y) {
    return {
      d,
      y,
      background: barBackground(y),
      title: barTitle(d, y),
      bar: minuteBar(d.minutes, y, d.color),
      value: minuteLabel(d.minutes, y, d.color)
    };
  }

  function rowObjects(row) {
    return [
      row.background,
      row.title,
      row.bar,
      row.value
    ];
  }

  function revealRow(row) {
    return [
      new M.FadeIn(row.background),
      new M.FadeIn(row.title),
      new M.FadeIn(row.bar),
      new M.FadeIn(row.value)
    ];
  }

  function rowOutline(row, color = C.green) {
    return rect(
      at(CX, row.y + (P ? 0.17 : 0.12)),
      PIC_W,
      P ? 1.17 : 0.94,
      color,
      0,
      2.1
    );
  }

  function savedSegment(from, to, y, color = C.green) {
    const width = (from - to) * MINUTE_W;

    const r = new M.Rectangle({
      width,
      height: BAR_H,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.35);

    r.moveTo(at(
      BAR_X + to * MINUTE_W + width / 2,
      y
    ));

    return r;
  }

  function gapBracket(from, to, y, label, color = C.green) {
    const x1 = BAR_X + to * MINUTE_W;
    const x2 = BAR_X + from * MINUTE_W;
    const cap = 0.09;

    const a = line(
      at(x1, y),
      at(x2, y),
      color,
      2.7
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

    const t = txt(
      label,
      P ? 17 : 16,
      color,
      at(
        Math.min((x1 + x2) / 2, CX + 1.80),
        y - 0.25
      ),
      true,
      2.80
    );

    return new M.VGroup(a, b, c, t);
  }

  // ------------------------------------------------------------
  // 5-12: reveal the three imagined commute times
  // ------------------------------------------------------------

  const barsTitle = txt(
    'THREE IMAGINED COMMUTE TIMES',
    P ? 19 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const rows = DATA.map((d, i) =>
    makeBarRow(d, BAR_Y[i])
  );

  const shuttleNote = txt(
    'Park the car, then take the pass’s shuttle',
    P ? 16 : 15,
    C.violet,
    at(CX, BAR_Y[1] - (P ? 0.51 : 0.39)),
    false,
    PIC_W - 0.20
  );

  // 5: one bar for the minutes in each version.
  await until(S(5));
  await play(
    ...fadeAll([
      ...versions,
      samePerson,
      imaginedNote
    ]),
    new M.FadeIn(barsTitle),
    lagIn(
      rows.map(r => r.background),
      0.90,
      0.15
    ),
    ...fbox([
      'Each bar shows',
      'the commute minutes',
      ['in one imagined version.', C.green]
    ], C.green),
    ...say('ONE MINUTE BAR FOR EACH VERSION')
  );

  // 6: first version — no pass, driving.
  await until(S(6));
  await play(
    new M.FadeIn(rows[0].title),
    ...fbox([
      ['VERSION 1', C.muted],
      'No pass',
      'Drive to work'
    ], C.muted),
    ...say('FIRST: NO PASS, DRIVE TO WORK')
  );

  // 7: the first trip takes 40 minutes.
  await until(S(7));
  await play(
    new M.FadeIn(rows[0].bar),
    new M.FadeIn(rows[0].value),
    ...fbox([
      ['VERSION 1', C.muted],
      'No pass + driving',
      ['40 minutes', C.ink]
    ], C.muted),
    ...say('40 MINUTES')
  );

  // 8: second version — pass received, still driving.
  await until(S(8));
  await play(
    new M.FadeIn(rows[1].title),
    ...fbox([
      ['VERSION 2', C.violet],
      'Has a pass',
      'Still drives to work'
    ], C.violet),
    ...say('SECOND: GET A PASS, KEEP DRIVING', C.violet)
  );

  // 9: the pass includes the parking-lot shuttle.
  await until(S(9));
  await play(
    new M.FadeIn(shuttleNote),
    ...fbox([
      'Drive to the parking lot.',
      'Park the car.',
      ['Use the pass’s shuttle.', C.violet]
    ], C.violet),
    ...say('THE PASS INCLUDES A PARKING SHUTTLE', C.violet)
  );

  // 10: driving with the shuttle takes 38 minutes.
  await until(S(10));
  await play(
    new M.FadeIn(rows[1].bar),
    new M.FadeIn(rows[1].value),
    ...fbox([
      ['VERSION 2', C.violet],
      'Pass + driving + shuttle',
      ['38 minutes', C.violet]
    ], C.violet),
    ...say('38 MINUTES WITH THE SHUTTLE', C.violet)
  );

  // 11: third version — pass received, take the bus.
  await until(S(11));
  await play(
    new M.FadeOut(shuttleNote),
    new M.FadeIn(rows[2].title),
    ...fbox([
      ['VERSION 3', C.cyan],
      'Same person',
      'Has a pass',
      'Takes the bus'
    ], C.cyan),
    ...say('THIRD: GET A PASS, TAKE THE BUS', C.cyan)
  );

  // 12: the bus version takes 32 minutes.
  await until(S(12));
  await play(
    new M.FadeIn(rows[2].bar),
    new M.FadeIn(rows[2].value),
    ...fbox([
      ['VERSION 3', C.cyan],
      'Pass + bus',
      ['32 minutes', C.cyan]
    ], C.cyan),
    ...say('32 MINUTES BY BUS', C.cyan)
  );

  // ------------------------------------------------------------
  // Causal diagram helpers
  //
  //              Bus use
  //             ↗       ↘
  // Pass receipt         Commute time
  //             ↘       ↗
  //          Parking shuttle
  //
  // Both routes are possible causal mechanisms.
  // ------------------------------------------------------------

  const NODE_W = P ? 2.05 : 2.05;
  const MID_W = P ? 2.48 : 2.48;
  const NODE_H = P ? 0.99 : 0.88;

  const PASS_P = at(
    CX - 2.48,
    P ? 0.35 : -0.40
  );

  const TIME_P = at(
    CX + 2.48,
    P ? 0.35 : -0.40
  );

  const BUS_P = at(
    CX,
    P ? 1.88 : 0.77
  );

  const SHUTTLE_P = at(
    CX,
    P ? -1.18 : -1.57
  );

  function node(title, subtitle, p, width, color) {
    const r = rect(
      p,
      width,
      NODE_H,
      color,
      0.97,
      2
    );

    const a = txt(
      title,
      P ? 20 : 19,
      color,
      at(p[0], p[1] + 0.15),
      false,
      width - 0.23
    );

    const b = txt(
      subtitle,
      P ? 15 : 14,
      C.ink,
      at(p[0], p[1] - 0.20),
      false,
      width - 0.23
    );

    return new M.VGroup(r, a, b);
  }

  function arrow(start, end, color, stroke = 3.2) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const headL = 0.22;
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

  // Explicit endpoints keep arrowheads outside the cards.
  const B1S = at(
    PASS_P[0] + NODE_W * 0.25,
    PASS_P[1] + NODE_H / 2 + 0.06
  );

  const B1E = at(
    BUS_P[0] - MID_W * 0.33,
    BUS_P[1] - NODE_H / 2 - 0.08
  );

  const B2S = at(
    BUS_P[0] + MID_W * 0.33,
    BUS_P[1] - NODE_H / 2 - 0.06
  );

  const B2E = at(
    TIME_P[0] - NODE_W * 0.25,
    TIME_P[1] + NODE_H / 2 + 0.08
  );

  const H1S = at(
    PASS_P[0] + NODE_W * 0.25,
    PASS_P[1] - NODE_H / 2 - 0.06
  );

  const H1E = at(
    SHUTTLE_P[0] - MID_W * 0.33,
    SHUTTLE_P[1] + NODE_H / 2 + 0.08
  );

  const H2S = at(
    SHUTTLE_P[0] + MID_W * 0.33,
    SHUTTLE_P[1] + NODE_H / 2 + 0.06
  );

  const H2E = at(
    TIME_P[0] - NODE_W * 0.25,
    TIME_P[1] - NODE_H / 2 - 0.08
  );

  function makeDiagram() {
    return {
      pass: node(
        'Pass receipt',
        'Got a pass or not',
        PASS_P,
        NODE_W,
        C.amber
      ),

      bus: node(
        'Bus use',
        'Switch to the bus',
        BUS_P,
        MID_W,
        C.cyan
      ),

      shuttle: node(
        'Parking shuttle',
        'Pass’s shuttle perk',
        SHUTTLE_P,
        MID_W,
        C.violet
      ),

      time: node(
        'Commute time',
        'Minutes to work',
        TIME_P,
        NODE_W,
        C.green
      ),

      aBus1: arrow(B1S, B1E, C.cyan),
      aBus2: arrow(B2S, B2E, C.cyan),

      aShuttle1: arrow(H1S, H1E, C.violet),
      aShuttle2: arrow(H2S, H2E, C.violet)
    };
  }

  function diagramObjects(g) {
    return [
      g.pass,
      g.bus,
      g.shuttle,
      g.time,
      g.aBus1,
      g.aBus2,
      g.aShuttle1,
      g.aShuttle2
    ];
  }

  function busOutline(color = C.cyan) {
    return rect(
      BUS_P,
      MID_W + 0.23,
      NODE_H + 0.23,
      color,
      0,
      2.7
    );
  }

  function shuttleOutline(color = C.violet) {
    return rect(
      SHUTTLE_P,
      MID_W + 0.23,
      NODE_H + 0.23,
      color,
      0,
      2.7
    );
  }

  function traceMarker(p, color) {
    const halo = new M.Dot({
      point: p,
      radius: 0.22,
      color
    });

    halo.setFill(color, 0.24);

    const dot = new M.Dot({
      point: p,
      radius: 0.09,
      color
    });

    dot.setFill(color, 1);

    return new M.VGroup(halo, dot);
  }

  // Animate a marker along a possible causal route.
  // Arrow directions themselves never change.
  async function traceRoute(points, color, duration) {
    const marker = traceMarker(points[0], color);

    await play(
      new M.FadeIn(
        marker,
        { runTime: 0.20 }
      )
    );

    const stepTime = duration / (points.length - 1);

    for (let i = 1; i < points.length; i++) {
      await play(
        new M.Transform(
          marker,
          traceMarker(points[i], color),
          { runTime: stepTime }
        )
      );
    }

    await play(
      new M.FadeOut(
        marker,
        { runTime: 0.20 }
      )
    );
  }

  // ------------------------------------------------------------
  // 13-19: draw the mediator and the separate shuttle route
  // ------------------------------------------------------------

  let graph = makeDiagram();

  const graphTitle = txt(
    'TWO POSSIBLE CAUSAL ROUTES',
    P ? 19 : 18,
    C.green,
    at(CX, P ? 2.82 : 1.47),
    true,
    PIC_W
  );

  // 13: transition from imagined time bars to arrows.
  await until(S(13));
  await play(
    ...fadeAll([
      barsTitle,
      ...rows.flatMap(rowObjects)
    ]),
    new M.FadeIn(graphTitle),
    ...clearBox(),
    ...say('DRAW THE POSSIBLE ROUTES AS ARROWS')
  );

  // 14: introduce cause and result.
  await until(S(14));
  await play(
    new M.FadeIn(graph.pass),
    new M.FadeIn(graph.time),
    ...fbox([
      ['Possible cause', C.amber],
      'Getting a pass',
      ['Result of interest', C.green],
      'Commute time'
    ]),
    ...say('PASS RECEIPT AND COMMUTE TIME')
  );

  // 15: put bus use between pass receipt and commute time.
  await until(S(15));
  await play(
    new M.FadeIn(graph.bus),
    ...fbox([
      ['BUS USE', C.cyan],
      'A possible step between',
      'the pass and travel time.'
    ], C.cyan),
    ...say('PUT BUS USE BETWEEN THE TWO', C.cyan)
  );

  // 16: the pass might encourage a switch to the bus.
  await until(S(16));
  await play(
    new M.FadeIn(graph.aBus1),
    ...fbox([
      ['Pass receipt → Bus use', C.cyan],
      'Getting a pass might',
      'encourage a switch',
      'from car to bus.'
    ], C.cyan),
    ...say('THE PASS MAY ENCOURAGE BUS USE', C.cyan)
  );

  await traceRoute(
    [B1S, B1E],
    C.cyan,
    Math.max(
      0.7,
      Math.min(1.55, E(16) - S(16) - 1.65)
    )
  );

  // 17: switching to the bus might change commute time.
  await until(S(17));
  await play(
    new M.FadeIn(graph.aBus2),
    ...fbox([
      ['Bus use → Commute time', C.cyan],
      'Switching travel mode',
      'could change the time',
      'needed to reach work.'
    ], C.cyan),
    ...say('BUS USE MAY CHANGE COMMUTE TIME', C.cyan)
  );

  await traceRoute(
    [B2S, B2E],
    C.cyan,
    Math.max(
      0.7,
      Math.min(1.55, E(17) - S(17) - 1.65)
    )
  );

  // 18: name bus use as a mediator.
  const mediatorFrame = busOutline(C.cyan);

  const mediatorTag = pill(
    'MEDIATOR',
    C.cyan,
    P ? 18 : 16
  );

  mediatorTag.moveTo(
    at(
      CX,
      P ? -0.57 : -1.27
    )
  );

  await until(S(18));
  await play(
    new M.Create(mediatorFrame),
    new M.FadeIn(mediatorTag),
    ...fbox([
      ['MEDIATOR', C.cyan],
      'Something a cause changes',
      'along the way to',
      'the result we care about.'
    ], C.cyan),
    ...say('BUS USE IS A MEDIATOR', C.cyan)
  );

  await traceRoute(
    [
      B1S,
      B1E,
      BUS_P,
      B2S,
      B2E
    ],
    C.cyan,
    Math.max(
      1.0,
      Math.min(2.4, E(18) - S(18) - 1.8)
    )
  );

  // 19: add the separate parking-shuttle route.
  await until(S(19));
  await play(
    new M.FadeOut(mediatorFrame),
    new M.FadeOut(mediatorTag),
    new M.FadeIn(graph.shuttle),
    new M.LaggedStart(
      [
        new M.FadeIn(graph.aShuttle1),
        new M.FadeIn(graph.aShuttle2)
      ],
      { lagRatio: 0.25, runTime: 0.95 }
    ),
    ...fbox([
      ['A SECOND ROUTE', C.violet],
      'Pass receipt',
      '→ Parking shuttle',
      '→ Commute time'
    ], C.violet),
    ...say('THE PASS CAN ALSO HELP THROUGH THE SHUTTLE', C.violet)
  );

  // ------------------------------------------------------------
  // 20-24: hold travel mode at driving
  //
  // Compare no pass + driving against pass + driving + shuttle.
  // Both alternatives involve driving.
  // Saving = 40 − 38 = 2 minutes.
  // ------------------------------------------------------------

  const compareTitle = txt(
    'COMPARE THE SAME PERSON',
    P ? 19 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const compareRows = DATA.map((d, i) =>
    makeBarRow(d, BAR_Y[i])
  );

  const driveTag = pill(
    'TRAVEL MODE: DRIVING',
    C.violet,
    P ? 18 : 17
  );

  driveTag.moveTo(
    at(CX, P ? -2.25 : -2.37)
  );

  // 20: line up the first two time bars.
  await until(S(20));
  await play(
    ...fadeAll([
      graphTitle,
      ...diagramObjects(graph)
    ]),
    new M.FadeIn(compareTitle),
    ...revealRow(compareRows[0]),
    ...revealRow(compareRows[1]),
    ...fbox([
      ['FIRST COMPARISON', C.violet],
      'No pass + driving: 40',
      'Pass + driving:    38'
    ], C.violet),
    ...say('LINE UP THE FIRST TWO BARS', C.violet)
  );

  // 21: define travel mode.
  await until(S(21));
  await play(
    new M.FadeIn(driveTag),
    ...fbox([
      ['TRAVEL MODE', C.violet],
      'The way you travel.',
      'For example:',
      'Driving or taking the bus.'
    ], C.violet),
    ...say('TRAVEL MODE = HOW YOU TRAVEL', C.violet)
  );

  const drivingFrame = rect(
    at(
      CX,
      (BAR_Y[0] + BAR_Y[1]) / 2 + 0.13
    ),
    PIC_W,
    Math.abs(BAR_Y[0] - BAR_Y[1]) + (P ? 1.0 : 0.86),
    C.violet,
    0,
    2.1
  );

  // 22: keep driving fixed while pass receipt changes.
  await until(S(22));
  await play(
    new M.Create(drivingFrame),
    new M.Indicate(driveTag, { color: C.violet }),
    ...fbox([
      ['KEEP DRIVING FIXED', C.violet],
      'Before: no pass',
      'After:  has a pass',
      ['Travel mode stays the same.', C.green]
    ], C.violet),
    ...say('CHANGE THE PASS, NOT THE TRAVEL MODE', C.violet)
  );

  const driveSaved = savedSegment(
    40,
    38,
    BAR_Y[1],
    C.violet
  );

  const driveGap = gapBracket(
    40,
    38,
    BAR_Y[1] - (P ? 0.41 : 0.35),
    '2 min saved',
    C.violet
  );

  // 23: visualize the two-minute saving.
  await until(S(23));
  await play(
    new M.FadeOut(drivingFrame),
    new M.FadeIn(driveSaved),
    new M.FadeIn(driveGap),
    ...fbox([
      ['SAVING WHILE DRIVING', C.violet],
      '40 − 38',
      [`= ${SAVE_DRIVE} minutes`, C.green]
    ], C.violet),
    ...say('40 TO 38: SAVE 2 MINUTES', C.violet)
  );

  // 24: identify the shuttle mechanism.
  await until(S(24));
  await play(
    new M.Indicate(
      driveGap,
      { color: C.violet, runTime: 0.65 }
    ),
    ...fbox([
      ['SHUTTLE ROUTE', C.violet],
      'Pass → Parking shuttle',
      '→ Commute time',
      ['2 minutes saved', C.violet]
    ], C.violet),
    ...say('THE SHUTTLE ROUTE SAVES 2 MINUTES', C.violet)
  );

  // ------------------------------------------------------------
  // 25-28: hold pass receipt fixed and change travel mode
  //
  // Compare pass + driving against pass + bus.
  // Saving = 38 − 32 = 6 minutes.
  // ------------------------------------------------------------

  const passTag = pill(
    'PASS RECEIPT: YES',
    C.amber,
    P ? 18 : 17
  );

  passTag.moveTo(
    at(CX, P ? -2.65 : -2.53)
  );

  // 25: introduce the third bar and compare the pass alternatives.
  await until(S(25));
  await play(
    new M.FadeOut(driveTag),
    new M.FadeOut(driveSaved),
    new M.FadeOut(driveGap),
    ...revealRow(compareRows[2]),
    new M.FadeIn(passTag),
    ...fbox([
      ['SECOND COMPARISON', C.cyan],
      'Pass + driving: 38',
      'Pass + bus:     32',
      ['Both versions have a pass.', C.amber]
    ], C.cyan),
    ...say('COMPARE THE TWO VERSIONS WITH A PASS', C.cyan)
  );

  const passFrame = rect(
    at(
      CX,
      (BAR_Y[1] + BAR_Y[2]) / 2 + 0.13
    ),
    PIC_W,
    Math.abs(BAR_Y[1] - BAR_Y[2]) + (P ? 1.0 : 0.86),
    C.cyan,
    0,
    2.1
  );

  // 26: switch from driving to the bus.
  await until(S(26));
  await play(
    new M.Create(passFrame),
    new M.Indicate(passTag, { color: C.amber }),
    ...fbox([
      ['KEEP THE PASS FIXED', C.amber],
      'Before: driving',
      'After:  bus',
      ['Travel mode changes.', C.cyan]
    ], C.cyan),
    ...say('KEEP THE PASS, CHANGE HOW YOU TRAVEL', C.cyan)
  );

  const busSaved = savedSegment(
    38,
    32,
    BAR_Y[2],
    C.cyan
  );

  const busGap = gapBracket(
    38,
    32,
    BAR_Y[2] - (P ? 0.40 : 0.31),
    '6 min saved',
    C.cyan
  );

  // 27: illustrate the further six-minute saving.
  await until(S(27));
  await play(
    new M.FadeOut(passFrame),
    new M.FadeOut(passTag),
    new M.FadeIn(busSaved),
    new M.FadeIn(busGap),
    ...fbox([
      ['SAVING FROM SWITCHING', C.cyan],
      '38 − 32',
      [`= ${SAVE_BUS} minutes`, C.green]
    ], C.cyan),
    ...say('38 TO 32: SAVE ANOTHER 6 MINUTES', C.cyan)
  );

  // 28: identify the mediator route.
  await until(S(28));
  await play(
    new M.Indicate(
      busGap,
      { color: C.cyan, runTime: 0.65 }
    ),
    ...fbox([
      ['BUS USE ROUTE', C.cyan],
      'Pass → Bus use',
      '→ Commute time',
      ['6 further minutes saved', C.cyan]
    ], C.cyan),
    ...say('THE ROUTE THROUGH BUS USE', C.cyan)
  );

  // ------------------------------------------------------------
  // 29-32: whole imagined saving
  //
  // Compare the first and last alternatives.
  // Whole saving = 40 − 32 = 8.
  // 8 = 2 + 6.
  // ------------------------------------------------------------

  const wholeFirstFrame = rowOutline(
    compareRows[0],
    C.green
  );

  const wholeLastFrame = rowOutline(
    compareRows[2],
    C.green
  );

  // 29: compare the first and last time bars.
  await until(S(29));
  await play(
    new M.FadeOut(busSaved),
    new M.FadeOut(busGap),
    new M.Create(wholeFirstFrame),
    new M.Create(wholeLastFrame),
    ...fbox([
      ['WHOLE CHANGE', C.green],
      'No pass + driving: 40',
      'Pass + bus:        32'
    ], C.green),
    ...say('COMPARE THE FIRST AND LAST VERSIONS', C.green)
  );

  const totalSaved = savedSegment(
    40,
    32,
    BAR_Y[2],
    C.green
  );

  const totalGap = gapBracket(
    40,
    32,
    BAR_Y[2] - (P ? 0.40 : 0.31),
    '8 min saved',
    C.green
  );

  // 30: calculate the whole saving.
  await until(S(30));
  await play(
    new M.FadeOut(wholeFirstFrame),
    new M.FadeOut(wholeLastFrame),
    new M.FadeIn(totalSaved),
    new M.FadeIn(totalGap),
    ...fbox([
      ['WHOLE SAVING', C.green],
      '40 − 32',
      [`= ${SAVE_TOTAL} minutes`, C.green]
    ], C.green),
    ...say('THE WHOLE TRIP IS 8 MINUTES SHORTER', C.green)
  );

  // 31: replace the single saved segment with two colored parts.
  //
  // Remaining commute: 32 minutes.
  // Cyan segment: 6 further minutes saved by switching.
  // Violet segment: 2 minutes saved while driving.

  const splitBus = savedSegment(
    38,
    32,
    BAR_Y[2],
    C.cyan
  );

  const splitShuttle = savedSegment(
    40,
    38,
    BAR_Y[2],
    C.violet
  );

  await until(S(31));
  await play(
    new M.FadeOut(totalSaved),
    new M.FadeIn(splitBus),
    new M.FadeIn(splitShuttle),
    ...fbox([
      ['Whole saving', C.green],
      '= saving while driving',
      '  + saving from switching',
      ['Both routes together', C.green]
    ], C.green),
    ...say('WHOLE SAVING = BOTH SAVINGS ADDED', C.green)
  );

  // 32: two plus six makes eight.
  await until(S(32));
  await play(
    new M.Indicate(
      splitShuttle,
      { color: C.violet, runTime: 0.65 }
    ),
    new M.Indicate(
      splitBus,
      { color: C.cyan, runTime: 0.65 }
    ),
    ...fbox([
      ['Whole saving = 2 + 6', C.green],
      ['2: while driving', C.violet],
      ['6: from switching', C.cyan],
      ['= 8 minutes', C.green]
    ], C.green),
    ...say('2 + 6 = 8 MINUTES SAVED', C.green)
  );

  // ------------------------------------------------------------
  // 33-36: why understanding the mechanism matters
  // ------------------------------------------------------------

  graph = makeDiagram();

  const mechanismTitle = txt(
    'HOW DOES THE PASS HELP?',
    P ? 20 : 19,
    C.green,
    at(CX, P ? 2.82 : 1.47),
    true,
    PIC_W
  );

  const busSavingTag = pill(
    'BUS ROUTE: 6 MIN',
    C.cyan,
    P ? 17 : 15
  );

  busSavingTag.moveTo(
    at(
      CX,
      BUS_P[1] - NODE_H / 2 - (P ? 0.47 : 0.40)
    )
  );

  const shuttleSavingTag = pill(
    'SHUTTLE: 2 MIN',
    C.violet,
    P ? 17 : 15
  );

  shuttleSavingTag.moveTo(
    at(
      CX,
      SHUTTLE_P[1] - NODE_H / 2 - (P ? 0.50 : 0.43)
    )
  );

  // 33: understand how a pass works, not only how much it helps.
  await until(S(33));
  await play(
    ...fadeAll([
      compareTitle,
      ...compareRows.flatMap(rowObjects),
      splitBus,
      splitShuttle,
      totalGap
    ]),
    new M.FadeIn(mechanismTitle),
    lagIn(
      diagramObjects(graph),
      0.95,
      0.075
    ),
    new M.FadeIn(busSavingTag),
    new M.FadeIn(shuttleSavingTag),
    ...fbox([
      ['TWO POSSIBLE MECHANISMS', C.green],
      ['Shuttle route: 2 minutes', C.violet],
      ['Bus route:     6 minutes', C.cyan],
      ['Whole saving:  8 minutes', C.green]
    ], C.green),
    ...say('ASK HOW IT HELPS, NOT JUST HOW MUCH', C.green)
  );

  // 34: if few people switch, much of this illustrated saving
  // would disappear. Do not claim that the imagined times are
  // established population-level causal effects.

  const fewSwitchTag = pill(
    'FEW PEOPLE SWITCH?',
    C.amber,
    P ? 18 : 16
  );

  fewSwitchTag.moveTo(
    at(CX, P ? 2.82 : 1.47)
  );

  await until(S(34));
  await play(
    new M.FadeOut(mechanismTitle),
    new M.FadeIn(fewSwitchTag),
    new M.Indicate(graph.bus, { color: C.amber }),
    new M.Indicate(busSavingTag, { color: C.amber }),
    ...fbox([
      'If few people switch',
      'from driving to the bus,',
      ['much of this illustrated', C.amber],
      ['saving may disappear.', C.amber]
    ], C.amber),
    ...say('THE BUS ROUTE DEPENDS ON SWITCHING', C.amber)
  );

  // 35: trap — holding bus use fixed when we want the whole effect.
  //
  // Keep the arrows present because the underlying causal model
  // has not changed. Cross the route only as a comparison choice.

  const fixedBusFrame = busOutline(C.amber);

  const fixedBusTag = pill(
    'HOLD BUS USE FIXED',
    C.amber,
    P ? 17 : 15
  );

  fixedBusTag.moveTo(
    at(
      CX,
      P ? 2.82 : 1.47
    )
  );

  function cross(p, color = C.amber, radius = 0.17) {
    const [x, y] = p;

    return new M.VGroup(
      line(
        at(x - radius, y - radius),
        at(x + radius, y + radius),
        color,
        4.5
      ),

      line(
        at(x - radius, y + radius),
        at(x + radius, y - radius),
        color,
        4.5
      )
    );
  }

  const heldRouteCross = cross(
    at(
      (B1S[0] + B1E[0]) / 2,
      (B1S[1] + B1E[1]) / 2
    ),
    C.amber
  );

  await until(S(35));
  await play(
    new M.FadeOut(fewSwitchTag),
    new M.FadeIn(fixedBusTag),
    new M.Create(fixedBusFrame),
    new M.FadeIn(heldRouteCross),
    ...fbox([
      ['COMMON TRAP', C.amber],
      'Hold bus use fixed',
      'when you actually want',
      'the whole effect.'
    ], C.amber),
    ...say('TRAP: FIXING A MEDIATOR CAN HIDE PART OF THE EFFECT', C.amber)
  );

  // 36: holding driving fixed excludes the further bus saving.
  const omittedTag = pill(
    '6 MIN LEFT OUT',
    C.amber,
    P ? 17 : 15
  );

  omittedTag.moveTo(
    at(
      CX,
      BUS_P[1] - NODE_H / 2 - (P ? 0.35 : 0.30)
    )
  );

  const keptShuttleFrame = shuttleOutline(C.violet);

  await until(S(36));
  await play(
    new M.FadeOut(busSavingTag),
    new M.FadeIn(omittedTag),
    new M.Create(keptShuttleFrame),
    new M.Indicate(shuttleSavingTag, { color: C.violet }),
    ...fbox([
      ['Keep driving: 2 minutes', C.violet],
      ['Bus route left out: 6', C.amber],
      'Whole saving was 8.',
      ['2 is only part of the whole.', C.amber]
    ], C.amber),
    ...say('FIXING DRIVING LEAVES OUT THE 6-MINUTE BUS SAVING', C.amber)
  );

  // ------------------------------------------------------------
  // 37-40: preview Try it
  //
  // The separate exercise supplies touch/mouse input and New data.
  // The narrated animation demonstrates the three fixed versions
  // without introducing new, unsupported commute records.
  // ------------------------------------------------------------

  const tryTitle = txt(
    'TRY IT: CHANGE THE VERSION',
    P ? 19 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const TRY_BUTTON_Y = P ? 1.95 : 0.85;
  const TRY_PERSON_Y = P ? 0.40 : -0.33;
  const TRY_BAR_Y = P ? -1.25 : -1.53;

  function versionButton(d, active) {
    const x = CX + (d.id - 1) * 2.23;
    const y = TRY_BUTTON_Y;

    const color = active ? d.color : C.muted;

    const r = rect(
      at(x, y),
      2.04,
      P ? 0.85 : 0.72,
      color,
      active ? 0.96 : 0.38,
      active ? 2.5 : 1.2
    );

    if (active) {
      r.setFill(
        d.color,
        0.18
      );
    }

    const label = txt(
      d.id === 0
        ? 'NO PASS'
        : d.id === 1
          ? 'PASS + DRIVE'
          : 'PASS + BUS',
      P ? 16 : 15,
      active ? C.ink : C.muted,
      at(x, y + 0.11),
      true,
      1.82
    );

    const sub = txt(
      d.id === 0
        ? 'Driving'
        : d.id === 1
          ? 'With shuttle'
          : 'Bus travel',
      P ? 15 : 14,
      active ? d.color : C.muted,
      at(x, y - 0.18),
      false,
      1.82
    );

    return new M.VGroup(r, label, sub);
  }

  function versionButtons(activeId) {
    return DATA.map(d =>
      versionButton(d, d.id === activeId)
    );
  }

  function currentTripIcon(d) {
    const person = commuterIcon(
      at(CX - 1.22, TRY_PERSON_Y),
      d.pass,
      C.cyan
    );

    const vehicle = d.mode === 'Bus'
      ? busIcon(
          at(CX + 1.10, TRY_PERSON_Y),
          C.cyan,
          0.90
        )
      : carIcon(
          at(CX + 1.10, TRY_PERSON_Y),
          d.color,
          0.95
        );

    const label = txt(
      d.id === 0
        ? 'Driving without a pass'
        : d.id === 1
          ? 'Driving with the shuttle perk'
          : 'Taking the bus with a pass',
      P ? 18 : 17,
      d.color,
      at(
        CX,
        TRY_PERSON_Y - (P ? 0.72 : 0.60)
      ),
      false,
      PIC_W
    );

    return new M.VGroup(
      person,
      vehicle,
      label
    );
  }

  let activeButtons = versionButtons(0);
  let currentIcon = currentTripIcon(DATA[0]);

  const tryBackground = barBackground(TRY_BAR_Y);

  let currentBar = minuteBar(
    DATA[0].minutes,
    TRY_BAR_Y,
    DATA[0].color
  );

  let currentValue = minuteLabel(
    DATA[0].minutes,
    TRY_BAR_Y,
    DATA[0].color
  );

  const tryImagined = txt(
    'Same imagined commuter, different versions',
    P ? 16 : 15,
    C.muted,
    at(CX, P ? -2.50 : -2.48),
    false,
    PIC_W
  );

  let currentSaving = null;

  // 37: demonstrate selecting the three versions.
  await until(S(37));
  await play(
    ...fadeAll([
      ...diagramObjects(graph),
      fixedBusTag,
      fixedBusFrame,
      heldRouteCross,
      omittedTag,
      keptShuttleFrame,
      shuttleSavingTag
    ]),
    new M.FadeIn(tryTitle),
    lagIn(activeButtons, 0.75, 0.12),
    new M.FadeIn(currentIcon),
    new M.FadeIn(tryBackground),
    new M.FadeIn(currentBar),
    new M.FadeIn(currentValue),
    new M.FadeIn(tryImagined),
    ...fbox([
      ['VERSION 1 OF 3', C.green],
      'No pass + driving',
      'Commute = 40 minutes',
      ['Starting point', C.muted]
    ], C.green),
    ...say('TRY IT: TAP THROUGH THE THREE VERSIONS', C.green)
  );

  // 38: challenge — find the saving while still driving.
  const drivingButtons = versionButtons(1);
  const drivingIcon = currentTripIcon(DATA[1]);

  const drivingValue = minuteLabel(
    DATA[1].minutes,
    TRY_BAR_Y,
    C.violet
  );

  const savingTwo = savedSegment(
    40,
    38,
    TRY_BAR_Y,
    C.violet
  );

  await until(S(38));
  await play(
    ...fadeAll(activeButtons),
    ...drivingButtons.map(b => new M.FadeIn(b)),
    new M.FadeOut(currentIcon),
    new M.FadeIn(drivingIcon),
    new M.Transform(
      currentBar,
      minuteBar(38, TRY_BAR_Y, C.violet),
      { runTime: 0.85 }
    ),
    new M.FadeOut(currentValue),
    new M.FadeIn(drivingValue),
    new M.FadeIn(savingTwo),
    ...fbox([
      ['CHALLENGE 1', C.violet],
      'Keep driving.',
      '40 − 38',
      ['Answer: 2 minutes saved', C.green]
    ], C.violet),
    ...say('KEEP DRIVING: FIND THE FIRST SAVING', C.violet)
  );

  activeButtons = drivingButtons;
  currentIcon = drivingIcon;
  currentValue = drivingValue;
  currentSaving = savingTwo;

  // 39: challenge — switch to bus use and find the whole saving.
  const busButtons = versionButtons(2);
  const busTripIcon = currentTripIcon(DATA[2]);

  const busValue = minuteLabel(
    DATA[2].minutes,
    TRY_BAR_Y,
    C.cyan
  );

  const savingEight = savedSegment(
    40,
    32,
    TRY_BAR_Y,
    C.green
  );

  await until(S(39));
  await play(
    ...fadeAll(activeButtons),
    ...busButtons.map(b => new M.FadeIn(b)),
    new M.FadeOut(currentIcon),
    new M.FadeIn(busTripIcon),
    new M.Transform(
      currentBar,
      minuteBar(32, TRY_BAR_Y, C.cyan),
      { runTime: 0.80 }
    ),
    new M.FadeOut(currentValue),
    new M.FadeIn(busValue),
    new M.FadeOut(currentSaving),
    new M.FadeIn(savingEight),
    ...fbox([
      ['CHALLENGE 2', C.cyan],
      'Switch to the bus.',
      '40 − 32',
      ['Answer: 8 minutes saved', C.green]
    ], C.green),
    ...say('SWITCH TO THE BUS: FIND THE WHOLE SAVING', C.cyan)
  );

  activeButtons = busButtons;
  currentIcon = busTripIcon;
  currentValue = busValue;
  currentSaving = savingEight;

  // 40: invite fresh imagined trip times in the actual exercise.
  // Preserve the fixed chapter illustration in the narration.

  const newData = pill(
    'NEW DATA',
    C.green,
    P ? 19 : 17
  );

  newData.moveTo(
    at(
      CX,
      P ? -2.50 : -2.48
    )
  );

  await until(S(40));
  await play(
    new M.FadeOut(tryImagined),
    new M.FadeIn(newData),
    ...fbox([
      ['TRY FRESH TRIP TIMES', C.green],
      'Find the driving saving.',
      'Find the switching saving.',
      ['Then add the two.', C.green]
    ], C.green),
    ...say('NEW DATA: TRACE BOTH STEPS AGAIN', C.green)
  );

  // ------------------------------------------------------------
  // 41: final takeaway
  // ------------------------------------------------------------

  const finalGraph = makeDiagram();

  const finalTitle = txt(
    'MEDIATORS',
    P ? 23 : 22,
    C.green,
    at(CX, P ? 2.82 : 1.47),
    true,
    PIC_W
  );

  const finalMediatorFrame = busOutline(C.cyan);

  const finalBusTag = pill(
    'MEDIATOR',
    C.cyan,
    P ? 17 : 15
  );

  finalBusTag.moveTo(
    at(
      CX,
      BUS_P[1] - NODE_H / 2 - (P ? 0.35 : 0.30)
    )
  );

  const finalShuttleTag = pill(
    'SEPARATE ROUTE',
    C.violet,
    P ? 17 : 15
  );

  finalShuttleTag.moveTo(
    at(
      CX,
      SHUTTLE_P[1] - NODE_H / 2 - (P ? 0.38 : 0.31)
    )
  );

  await until(S(41));
  await play(
    ...fadeAll([
      tryTitle,
      ...activeButtons,
      currentIcon,
      tryBackground,
      currentBar,
      currentValue,
      currentSaving,
      newData
    ]),
    new M.FadeIn(finalTitle),
    lagIn(
      diagramObjects(finalGraph),
      0.85,
      0.065
    ),
    new M.Create(finalMediatorFrame),
    new M.FadeIn(finalBusTag),
    new M.FadeIn(finalShuttleTag),
    ...fbox([
      ['MEDIATOR', C.cyan],
      'A step along a route',
      'from a cause to a result.',
      ['2 + 6 = 8 minutes saved', C.green]
    ], C.green),
    ...say('A MEDIATOR SITS ALONG A CAUSAL ROUTE', C.green)
  );

  await traceRoute(
    [
      B1S,
      B1E,
      BUS_P,
      B2S,
      B2E
    ],
    C.cyan,
    Math.max(
      0.8,
      Math.min(1.35, E(41) - S(41) - 1.7)
    )
  );

  // Final diagram:
  //
  // Pass receipt → Bus use → Commute time
  //
  // Alongside:
  //
  // Pass receipt → Parking shuttle → Commute time
  //
  // Fixed imagined alternatives:
  // No pass + driving        = 40 minutes
  // Pass + driving + shuttle  = 38 minutes
  // Pass + bus                = 32 minutes
  //
  // Saving while driving      = 40 − 38 = 2
  // Saving from switching     = 38 − 32 = 6
  // Whole saving              = 40 − 32 = 8
  //
  // These alternatives illustrate possible mechanisms for the
  // same commuter. They are not three observed trips and do not
  // establish a population-wide causal effect.
}

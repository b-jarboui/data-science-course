// lesson 8.2.1
// Causal diagrams: a picture of possible causes and results.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter snapshot: 16 commuters, 8 Central and 8 Hill.
// Individual commute times are not supplied, so display group averages only.
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

  const PILL = P ? [0, 3.65, 0] : [0, 1.92, 0];
  const DX = P ? 0 : -3.45;
  const GX = P ? 0 : 3.35;

  const ROW_W = P ? 7.0 : 6.15;
  const ROW_H = P ? 1.40 : 1.40;
  const ROW_Y = P ? [1.95, 0.35] : [0.40, -1.20];

  const SP = P ? 0.76 : 0.66;
  const DOT_R = P ? 0.115 : 0.105;
  const HALO_R = P ? 0.235 : 0.205;
  const RING_R = P ? 0.225 : 0.205;

  const DATA_TITLE_Y = P ? 2.90 : 1.35;
  const GRAPH_TITLE_Y = P ? -0.97 : 1.35;

  const CARD_W = P ? 2.85 : 2.65;
  const CARD_H = P ? 0.94 : 0.86;
  const WORK_W = P ? 3.25 : 3.15;

  const WP = P ? [0, -1.65, 0] : [GX, 0.40, 0];
  const PR = P ? [-1.86, -3.65, 0] : [GX - 1.80, -1.75, 0];
  const CT = P ? [1.86, -3.65, 0] : [GX + 1.80, -1.75, 0];

  const BOXP = P ? [0, -4.85, 0] : [GX, -2.65, 0];

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
  // Small explanation box.
  // Replace the entire box rather than regrouping visible objects.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(s, color = C.cyan) {
    const size = P ? 17 : 16;
    const maxw = P ? FW - 1.15 : 6.15;

    const t = T(s, size, color, true);

    if (t.getWidth() > maxw - 0.55) {
      t.scale((maxw - 0.55) / t.getWidth());
    }

    const wd = Math.min(maxw, t.getWidth() + 0.55);
    const ht = P ? 0.60 : 0.52;

    const r = rect(BOXP, wd, ht, color, 0.95, 1.8);
    t.moveTo(BOXP);

    const g = new M.VGroup(r, t);
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
  // Introductory bus pass illustration
  // ------------------------------------------------------------

  function busIcon(p, color = C.cyan) {
    const [x, y] = p;

    const body = new M.RoundedRectangle({
      width: 1.20,
      height: 0.62,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.16);
    body.moveTo(at(x, y));

    const windows = [-0.34, 0, 0.34].map(dx => {
      const r = new M.Rectangle({
        width: 0.25,
        height: 0.24,
        color,
        strokeWidth: 1.2
      });

      r.setFill(color, 0.40);
      r.moveTo(at(x + dx, y + 0.10));
      return r;
    });

    const wheels = [-0.35, 0.35].map(dx => {
      const w = new M.Circle({
        radius: 0.115,
        color: C.ink,
        strokeWidth: 1.5
      });

      w.setFill(C.ink, 1);
      w.moveTo(at(x + dx, y - 0.34));
      return w;
    });

    return new M.VGroup(body, ...windows, ...wheels);
  }

  function passTicket(p) {
    const [x, y] = p;

    const r = rect(p, 3.35, 1.85, C.cyan, 0.95, 2);
    const bus = busIcon(at(x, y + 0.33));

    const title = txt(
      'BUS PASS',
      P ? 24 : 23,
      C.cyan,
      at(x, y - 0.30),
      true
    );

    const subtitle = txt(
      'Cheaper bus journeys',
      17,
      C.ink,
      at(x, y - 0.66)
    );

    return new M.VGroup(r, bus, title, subtitle);
  }

  function clockCard(p) {
    const [x, y] = p;

    const r = rect(p, 3.35, 1.85, C.amber, 0.95, 2);

    const face = new M.Circle({
      radius: 0.37,
      color: C.amber,
      strokeWidth: 2.5
    });

    face.setFill(C.amber, 0.07);
    face.moveTo(at(x, y + 0.30));

    const hand1 = line(
      at(x, y + 0.30),
      at(x, y + 0.53),
      C.amber,
      2.5
    );

    const hand2 = line(
      at(x, y + 0.30),
      at(x + 0.19, y + 0.18),
      C.amber,
      2.5
    );

    const title = txt(
      'COMMUTE TIME',
      P ? 22 : 21,
      C.amber,
      at(x, y - 0.30),
      true
    );

    const subtitle = txt(
      'Minutes to get to work',
      17,
      C.ink,
      at(x, y - 0.66)
    );

    return new M.VGroup(r, face, hand1, hand2, title, subtitle);
  }

  const ticket = passTicket(P ? at(0, 1.05) : at(-2.05, -0.35));
  const clock = clockCard(P ? at(0, -1.25) : at(2.05, -0.35));

  // 0: city introduces cheaper bus passes.
  await until(S(0));
  await play(
    new M.FadeIn(ticket),
    ...say('A CITY BUS PASS')
  );

  // 1: does a pass change commute time?
  await until(S(1));
  await play(
    new M.FadeIn(clock),
    ...say('DOES A PASS CHANGE TRAVEL TIME?', C.amber)
  );

  // ------------------------------------------------------------
  // 2-10: the observed commuter records
  // ------------------------------------------------------------

  const dataTitle = txt(
    'THE COMMUTER RECORDS',
    P ? 19 : 18,
    C.muted,
    at(DX, DATA_TITLE_Y),
    true,
    ROW_W - 0.35
  );

  const rowNames = DATA.map((d, k) =>
    txt(
      d.name,
      P ? 22 : 21,
      d.color,
      at(DX - ROW_W / 2 + 1.05, ROW_Y[k] + 0.45)
    )
  );

  const rowFrames = DATA.map((d, k) =>
    rect(
      at(DX, ROW_Y[k]),
      ROW_W,
      ROW_H,
      d.color,
      0.12,
      1.5
    )
  );

  const totals = DATA.map((d, k) =>
    txt(
      '8 commuters',
      16,
      C.muted,
      at(DX + ROW_W / 2 - 1.10, ROW_Y[k] + 0.45),
      true
    )
  );

  const countLabels = DATA.map((d, k) =>
    txt(
      `${d.pass} of 8 got a pass`,
      P ? 16 : 15,
      C.amber,
      at(DX + ROW_W / 2 - 1.22, ROW_Y[k] + 0.45),
      true,
      2.65
    )
  );

  const dotPos = (k, j) =>
    at(DX + (j - 3.5) * SP, ROW_Y[k]);

  function commuter(k, j) {
    const p = dotPos(k, j);
    const color = DATA[k].color;

    const halo = new M.Dot({
      point: p,
      radius: HALO_R,
      color
    });

    halo.setFill(color, 0.14);

    const d = new M.Dot({
      point: p,
      radius: DOT_R,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function passRing(k, j) {
    const r = new M.Circle({
      radius: RING_R,
      color: C.amber,
      strokeWidth: 2.8
    });

    r.setFill(C.amber, 0);
    r.moveTo(dotPos(k, j));
    return r;
  }

  const dots = DATA.map((d, k) =>
    Array.from({ length: d.n }, (_, j) => commuter(k, j))
  );

  const rings = DATA.map((d, k) =>
    Array.from({ length: d.pass }, (_, j) => passRing(k, j))
  );

  // Group averages, not invented individual commute times.
  const averages = DATA.map((d, k) =>
    txt(
      `Pass avg: ${d.yes} min  •  No pass avg: ${d.no} min`,
      P ? 19 : 16,
      C.ink,
      at(DX, ROW_Y[k] - 0.45),
      true,
      ROW_W - 0.45
    )
  );

  const dataFoot = txt(
    'Times shown are group averages.',
    P ? 15 : 15,
    C.muted,
    P ? at(DX, -0.57) : at(DX, -2.22),
    false,
    ROW_W - 0.30
  );

  // 2: Central and Hill.
  await until(S(2));
  await play(
    new M.FadeOut(ticket),
    new M.FadeOut(clock),
    new M.FadeIn(dataTitle),
    ...rowNames.map(t => new M.FadeIn(t)),
    ...say('TWO WORKPLACES')
  );

  // 3: one row for each workplace.
  await until(S(3));
  await play(
    ...rowFrames.map(r => new M.Create(r)),
    ...say('CENTRAL AND HILL')
  );

  // 4: each dot represents one commuter.
  await until(S(4));
  await play(
    lagIn(dots.flat(), 1.45, 0.07),
    ...totals.map(t => new M.FadeIn(t)),
    ...say('1 DOT = 1 COMMUTER')
  );

  // 5: introduce the ring as the pass marker.
  await until(S(5));
  await play(
    new M.Create(rings[0][0]),
    new M.Flash(dots[0][0], { color: C.amber }),
    ...say('RING = GOT A PASS', C.amber)
  );

  // 6: Central has six of eight with passes.
  await until(S(6));
  await play(
    lagIn(rings[0].slice(1), 0.85, 0.12),
    new M.FadeOut(totals[0]),
    new M.FadeIn(countLabels[0]),
    ...say('CENTRAL: 6 OF 8', C.amber)
  );

  // 7: Hill has two of eight with passes.
  await until(S(7));
  await play(
    lagIn(rings[1], 0.70, 0.15),
    new M.FadeOut(totals[1]),
    new M.FadeIn(countLabels[1]),
    ...say('HILL: 2 OF 8', C.amber)
  );

  // 8: the city also recorded commute minutes.
  await until(S(8));
  await play(
    lagIn(averages, 1.0, 0.25),
    ...say('THE CITY RECORDED TRAVEL TIMES')
  );

  // 9: name the recorded quantity.
  await until(S(9));
  await play(
    new M.FadeIn(dataFoot),
    ...say('COMMUTE TIME = MINUTES TO WORK', C.green)
  );

  // 10: these records are the data.
  const dataOutline = rect(
    at(DX, (ROW_Y[0] + ROW_Y[1]) / 2),
    ROW_W + 0.20,
    Math.abs(ROW_Y[0] - ROW_Y[1]) + ROW_H + 0.20,
    C.cyan,
    0,
    2.2
  );

  await until(S(10));
  await play(
    new M.Create(dataOutline),
    ...say('DATA = INFORMATION COLLECTED', C.cyan)
  );

  // ------------------------------------------------------------
  // Diagram helpers.
  // All cards are assembled before appearing on screen.
  // Arrow shafts and heads are built from explicit coordinates.
  // ------------------------------------------------------------

  function card(title, subtitle, p, width, color) {
    const [x, y] = p;

    const r = rect(p, width, CARD_H, color, 0.97, 2);

    const a = txt(
      title,
      P ? 20 : 19,
      color,
      at(x, y + (P ? 0.17 : 0.14)),
      false,
      width - 0.24
    );

    const b = txt(
      subtitle,
      P ? 17 : 14,
      C.ink,
      at(x, y - (P ? 0.22 : 0.20)),
      false,
      width - 0.24
    );

    return new M.VGroup(r, a, b);
  }

  function arrow(start, end, color = C.violet, stroke = 3.2) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const headLength = P ? 0.20 : 0.18;
    const headWidth = P ? 0.105 : 0.095;

    const base = at(
      end[0] - ux * headLength,
      end[1] - uy * headLength
    );

    const left = at(
      base[0] - uy * headWidth,
      base[1] + ux * headWidth
    );

    const right = at(
      base[0] + uy * headWidth,
      base[1] - ux * headWidth
    );

    const shaft = line(start, end, color, stroke);
    const head1 = line(left, end, color, stroke);
    const head2 = line(right, end, color, stroke);

    return new M.VGroup(shaft, head1, head2);
  }

  function arrowHead(start, end, color = C.amber) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const base = at(
      end[0] - ux * 0.22,
      end[1] - uy * 0.22
    );

    const left = at(
      base[0] - uy * 0.13,
      base[1] + ux * 0.13
    );

    const right = at(
      base[0] + uy * 0.13,
      base[1] - ux * 0.13
    );

    return new M.VGroup(
      line(left, end, color, 4.2),
      line(right, end, color, 4.2)
    );
  }

  function pulse(p, color = C.amber) {
    const halo = new M.Dot({
      point: p,
      radius: 0.22,
      color
    });

    halo.setFill(color, 0.24);

    const d = new M.Dot({
      point: p,
      radius: 0.09,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  // Trace a possible influence in the direction of its arrow.
  // All play calls are awaited sequentially.
  async function trace(start, end, color, duration, label) {
    const marker = pulse(start, color);

    await play(
      new M.FadeIn(marker, { runTime: 0.25 }),
      ...say(label, color)
    );

    await play(
      new M.Transform(
        marker,
        pulse(end, color),
        { runTime: duration }
      )
    );

    await play(
      new M.FadeOut(marker, { runTime: 0.25 })
    );
  }

  const graphTitle = txt(
    'THE CITY’S BEST GUESSES',
    P ? 18 : 18,
    C.violet,
    at(GX, GRAPH_TITLE_Y),
    true,
    P ? 6.9 : 6.1
  );

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

  // Arrow 1: workplace location → pass receipt.
  const A1S = at(
    WP[0] - WORK_W * 0.27,
    WP[1] - CARD_H / 2 - 0.04
  );

  const A1E = at(
    PR[0] + CARD_W * 0.16,
    PR[1] + CARD_H / 2 + 0.07
  );

  // Arrow 2: workplace location → commute time.
  const A2S = at(
    WP[0] + WORK_W * 0.27,
    WP[1] - CARD_H / 2 - 0.04
  );

  const A2E = at(
    CT[0] - CARD_W * 0.16,
    CT[1] + CARD_H / 2 + 0.07
  );

  // Arrow 3: pass receipt → commute time.
  // Amber marks the possible effect the city wants to investigate.
  const A3S = at(
    PR[0] + CARD_W / 2 + 0.04,
    PR[1]
  );

  const A3E = at(
    CT[0] - CARD_W / 2 - 0.07,
    CT[1]
  );

  let aWP = arrow(A1S, A1E, C.violet);
  let aWT = arrow(A2S, A2E, C.violet);
  let aPT = arrow(A3S, A3E, C.amber, 3.8);

  // ------------------------------------------------------------
  // 11-13: from observed records to a map of possible influences
  // ------------------------------------------------------------

  // 11: put the records beside the city's guesses.
  await until(S(11));
  await play(
    new M.FadeOut(dataOutline),
    new M.FadeIn(graphTitle),
    ...say('RECORDS + A SKETCH OF GUESSES', C.violet)
  );

  // 12: a map of which way influences might go.
  await until(S(12));
  await play(
    ...fbox('Possible cause → Possible result', C.violet),
    ...say('A MAP OF POSSIBLE INFLUENCES', C.violet)
  );

  // 13: an influence means one thing can change another.
  await until(S(13));
  await play(
    ...fbox('One thing might change another', C.violet),
    ...say('INFLUENCE = A POSSIBLE CHANGE', C.violet)
  );

  // ------------------------------------------------------------
  // 14-18: workplace location → pass receipt
  // ------------------------------------------------------------

  // 14: workplace location card.
  await until(S(14));
  await play(
    ...clearBox(),
    new M.FadeIn(work),
    ...say('WORKPLACE LOCATION')
  );

  // 15: pass receipt card.
  await until(S(15));
  await play(
    new M.FadeIn(pass),
    ...say('PASS RECEIPT = GOT A PASS OR NOT')
  );

  // 16: the city chose which workplaces got most passes.
  await until(S(16));
  await play(
    lagIndicate(countLabels, C.amber, 1.15),
    ...fbox('Central: 6/8     Hill: 2/8', C.amber),
    ...say('THE CITY CHOSE WHERE PASSES WENT', C.amber)
  );

  // 17: workplace may influence pass receipt.
  await until(S(17));
  await play(
    new M.Indicate(work, { color: C.violet }),
    new M.Indicate(pass, { color: C.cyan }),
    ...fbox('Workplace may change pass receipt', C.violet),
    ...say('WHERE YOU WORK MAY MATTER', C.violet)
  );

  // 18: draw workplace location → pass receipt.
  await until(S(18));
  await play(
    new M.FadeIn(aWP),
    ...fbox('Workplace location → Pass receipt', C.violet),
    ...say('FOLLOW THE FIRST ARROW', C.violet)
  );

  // ------------------------------------------------------------
  // 19-21: workplace location → commute time
  // ------------------------------------------------------------

  // 19: introduce commute time.
  await until(S(19));
  await play(
    ...clearBox(),
    new M.FadeIn(time),
    ...say('COMMUTE TIME', C.amber)
  );

  // 20: roads into Hill may make journeys longer.
  await until(S(20));
  await play(
    new M.Indicate(averages[1], { color: C.violet }),
    ...fbox('Roads into Hill may add minutes', C.violet),
    ...say('WORKPLACE MAY CHANGE TRAVEL TIME', C.violet)
  );

  // 21: draw workplace location → commute time.
  await until(S(21));
  await play(
    new M.FadeIn(aWT),
    ...fbox('Workplace location → Commute time', C.violet),
    ...say('A SECOND POSSIBLE INFLUENCE', C.violet)
  );

  // ------------------------------------------------------------
  // 22-26: pass receipt → commute time, and the completed diagram
  // ------------------------------------------------------------

  // 22: a pass might change how someone travels.
  await until(S(22));
  await play(
    new M.Indicate(pass, { color: C.amber }),
    ...fbox('A pass may change how you travel', C.amber),
    ...say('A PASS MIGHT CHANGE THE JOURNEY', C.amber)
  );

  // 23: draw pass receipt → commute time.
  await until(S(23));
  await play(
    new M.FadeIn(aPT),
    ...fbox('Pass receipt → Commute time', C.amber),
    ...say('COULD A PASS CHANGE THE TIME?', C.amber)
  );

  // 24: highlight the particular arrow of interest.
  await until(S(24));
  await play(
    new M.Indicate(aPT, { color: C.amber }),
    ...fbox('The influence we want to investigate', C.amber),
    ...say('THIS IS THE CITY’S QUESTION', C.amber)
  );

  // 25: arrows point from possible cause to possible result.
  await until(S(25));
  await play(
    lagIndicate([aWP, aWT, aPT], C.green, 1.7),
    ...fbox('Possible cause → What it could change', C.green),
    ...say('ARROWS SHOW POSSIBLE CAUSES', C.green)
  );

  // 26: name the picture a causal diagram.
  const causalTitle = txt(
    'CAUSAL DIAGRAM',
    P ? 21 : 21,
    C.green,
    at(GX, GRAPH_TITLE_Y),
    true
  );

  await until(S(26));
  await play(
    new M.FadeOut(graphTitle),
    new M.FadeIn(causalTitle),
    ...fbox('A picture of possible causes and results', C.green),
    ...say('CAUSAL DIAGRAM', C.green)
  );

  // ------------------------------------------------------------
  // 27-31: follow the arrows and examine their direction
  // ------------------------------------------------------------

  // 27: trace workplace location → pass receipt.
  await until(S(27));
  await play(
    ...fbox('Workplace location → Pass receipt', C.violet)
  );

  await trace(
    A1S,
    A1E,
    C.violet,
    Math.max(0.8, Math.min(2.6, E(27) - S(27) - 1.5)),
    'TRACE: WORKPLACE TO PASS'
  );

  // 28: return to workplace and trace its other arrow.
  await until(S(28));
  await play(
    ...fbox('Workplace location → Commute time', C.violet)
  );

  await trace(
    A2S,
    A2E,
    C.violet,
    Math.max(0.7, Math.min(1.8, E(28) - S(28) - 1.5)),
    'TRACE: WORKPLACE TO TIME'
  );

  // 29: highlight the arrowheads.
  const heads = [
    arrowHead(A1S, A1E, C.amber),
    arrowHead(A2S, A2E, C.amber),
    arrowHead(A3S, A3E, C.amber)
  ];

  await until(S(29));
  await play(
    lagIn(heads, 0.9, 0.15),
    ...fbox('Arrowheads show the direction', C.amber),
    ...say('WHICH WAY COULD THE CHANGE GO?', C.amber)
  );

  // 30: two arrowheads point into commute time.
  const incomingOutline = rect(
    CT,
    CARD_W + 0.18,
    CARD_H + 0.18,
    C.amber,
    0,
    2.5
  );

  await until(S(30));
  await play(
    new M.FadeOut(heads[0]),
    new M.Create(incomingOutline),
    new M.Indicate(heads[1], { color: C.amber }),
    new M.Indicate(heads[2], { color: C.amber }),
    ...fbox('Two arrows enter commute time', C.amber),
    ...say('TWO ARROWS POINT INTO TIME', C.amber)
  );

  // 31: more than one influence can appear in a causal diagram.
  await until(S(31));
  await play(
    new M.FadeOut(heads[1]),
    new M.FadeOut(heads[2]),
    new M.FadeOut(incomingOutline),
    new M.Indicate(aWT, { color: C.violet }),
    new M.Indicate(aPT, { color: C.amber }),
    ...fbox('Workplace and pass may both matter', C.green),
    ...say('MORE THAN ONE POSSIBLE CAUSE', C.green)
  );

  // ------------------------------------------------------------
  // 32-35: the diagram describes assumptions, not proof
  // ------------------------------------------------------------

  // 32: leaving out an arrow is also an assumption.
  // Use a separate note rather than adding a misleading reverse
  // arrow to the actual assumed diagram.
  await until(S(32));
  await play(
    ...fbox('No arrow: no direct influence assumed', C.violet),
    ...say('MISSING ARROWS ARE GUESSES TOO', C.violet)
  );

  // 33: use the diagram to decide what to compare.
  const comparisonFrames = DATA.map((d, k) =>
    rect(
      at(DX, ROW_Y[k]),
      ROW_W + 0.11,
      ROW_H + 0.11,
      C.green,
      0,
      2.3
    )
  );

  await until(S(33));
  await play(
    ...comparisonFrames.map(r => new M.Create(r)),
    new M.Indicate(work, { color: C.green }),
    ...fbox('Should we compare within workplaces?', C.green),
    ...say('PLAN THE COMPARISON FIRST', C.green)
  );

  // 34: other people can inspect and question the assumptions.
  await until(S(34));
  await play(
    ...comparisonFrames.map(r => new M.FadeOut(r)),
    lagIndicate([aWP, aWT, aPT], C.violet, 1.2),
    ...fbox('Which arrows would you question?', C.violet),
    ...say('MAKE YOUR ASSUMPTIONS VISIBLE', C.violet)
  );

  // 35: an arrow is not proof.
  await until(S(35));
  await play(
    new M.Indicate(aPT, { color: C.amber }),
    ...fbox('A possible cause is not a proven cause', C.amber),
    ...say('TRAP: AN ARROW IS NOT PROOF', C.amber)
  );

  // ------------------------------------------------------------
  // 36-37: distinguish observed data from assumed influences
  // ------------------------------------------------------------

  const observedTitle = txt(
    'OBSERVED DATA',
    P ? 20 : 20,
    C.cyan,
    at(DX, DATA_TITLE_Y),
    true
  );

  const assumedTitle = txt(
    'ASSUMED INFLUENCES',
    P ? 19 : 19,
    C.violet,
    at(GX, GRAPH_TITLE_Y),
    true,
    P ? 6.9 : 6.1
  );

  const observedOutline = rect(
    at(DX, (ROW_Y[0] + ROW_Y[1]) / 2),
    ROW_W + 0.20,
    Math.abs(ROW_Y[0] - ROW_Y[1]) + ROW_H + 0.20,
    C.cyan,
    0,
    2.3
  );

  // 36: the rings describe what the city actually observed.
  await until(S(36));
  await play(
    new M.FadeOut(dataTitle),
    new M.FadeIn(observedTitle),
    new M.Create(observedOutline),
    lagIndicate(rings.flat(), C.amber, 1.4),
    ...fbox('Observed: 6/8 Central and 2/8 Hill', C.cyan),
    ...say('COUNTS = WHAT WAS OBSERVED', C.cyan)
  );

  // 37: the arrows describe assumed influences.
  await until(S(37));
  await play(
    new M.FadeOut(observedOutline),
    new M.FadeOut(causalTitle),
    new M.FadeIn(assumedTitle),
    lagIndicate([aWP, aWT, aPT], C.violet, 1.4),
    ...fbox('Assumed: the directions of influence', C.violet),
    ...say('ARROWS = WHAT WE ASSUME', C.violet)
  );

  // ------------------------------------------------------------
  // 38-41: preview Try it.
  // The lesson engine plays the animation; the separate Try it
  // component supplies mouse/touch dragging and New data controls.
  // Keep the fixed chapter snapshot unchanged in this scene.
  // ------------------------------------------------------------

  const tryTitle = txt(
    'TRY IT: DRAW THE ARROWS',
    P ? 19 : 18,
    C.green,
    at(GX, GRAPH_TITLE_Y),
    true,
    P ? 6.9 : 6.1
  );

  // 38: preview dragging arrows between cards.
  await until(S(38));
  await play(
    new M.FadeOut(assumedTitle),
    new M.FadeIn(tryTitle),
    new M.FadeOut(aWP),
    new M.FadeOut(aWT),
    new M.FadeOut(aPT),
    ...fbox('Choose a cause, then a possible result', C.green),
    ...say('TRY IT: CONNECT THE CARDS', C.green)
  );

  // 39: demonstrate the arrow for where passes are handed out.
  aWP = arrow(A1S, A1E, C.violet);

  await until(S(39));
  await play(
    new M.FadeIn(aWP),
    ...fbox('Workplace location → Pass receipt', C.green),
    ...say('WHERE DID THE CITY GIVE PASSES?', C.green)
  );

  // 40: demonstrate both arrows leaving workplace location.
  aWT = arrow(A2S, A2E, C.violet);

  await until(S(40));
  await play(
    new M.FadeIn(aWT),
    new M.Indicate(work, { color: C.green }),
    ...fbox('One possible cause, two possible results', C.green),
    ...say('ONE CARD CAN INFLUENCE TWO', C.green)
  );

  // 41: invite fresh data in the interactive exercise.
  // Do not manufacture additional observed records here.
  const newDataTag = pill('NEW DATA', C.green, P ? 19 : 18);

  newDataTag.moveTo(
    P ? at(0, -5.16) : at(DX, -2.65)
  );

  await until(S(41));

  if (P) {
    await play(
      ...clearBox(),
      new M.FadeIn(newDataTag),
      lagIndicate(countLabels, C.amber, 1.2),
      ...say('DO THE COUNTS EXPLAIN WHY?', C.amber)
    );
  } else {
    await play(
      new M.FadeIn(newDataTag),
      lagIndicate(countLabels, C.amber, 1.2),
      ...fbox('Counts alone cannot explain the cause', C.amber),
      ...say('DO THE COUNTS EXPLAIN WHY?', C.amber)
    );
  }

  // Reinforce the distinction without changing the fixed records.
  await play(
    new M.Indicate(newDataTag, { color: C.green }),
    ...fbox('New counts do not prove an arrow', C.amber)
  );

  // ------------------------------------------------------------
  // 42: final takeaway, with all three assumed arrows restored
  // ------------------------------------------------------------

  aPT = arrow(A3S, A3E, C.amber, 3.8);

  const finalTitle = txt(
    'CAUSAL DIAGRAM',
    P ? 21 : 21,
    C.green,
    at(GX, GRAPH_TITLE_Y),
    true
  );

  const finalOutline = rect(
    at(
      GX,
      (WP[1] + PR[1]) / 2 - (P ? 0.07 : 0)
    ),
    Math.abs(CT[0] - PR[0]) + CARD_W + 0.32,
    Math.abs(WP[1] - PR[1]) + CARD_H + (P ? 0.16 : 0.28),
    C.green,
    0,
    1.8
  );

  // 42: causal diagrams point from possible causes to results.
  await until(S(42));
  await play(
    new M.FadeOut(tryTitle),
    new M.FadeOut(newDataTag),
    new M.FadeIn(finalTitle),
    new M.FadeIn(aPT),
    new M.Create(finalOutline),
    ...fbox('Possible cause → What it could change', C.green),
    ...say('POSSIBLE CAUSE → POSSIBLE RESULT', C.green)
  );

  // Finish on the unchanged observed data beside the complete DAG:
  // Workplace location → Pass receipt
  // Workplace location → Commute time
  // Pass receipt       → Commute time

  await play(
    lagIndicate([aWP, aWT, aPT], C.green, 1.3)
  );
}

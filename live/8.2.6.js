// lesson 8.2.6
// Propensity scores: find people who had a similar chance of receiving a pass.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Fixed chapter snapshot:
// Central: 8 commuters, 6 with passes, 2 without.
// Hill:    8 commuters, 2 with passes, 6 without.
//
// Estimated propensity scores:
// Central: 6/8 = 3/4.
// Hill:    2/8 = 1/4.
//
// Matching without replacement:
// Central: 2 pairs, 4 unmatched pass holders.
// Hill:    2 pairs, 4 unmatched nonholders.
// Total:   4 pairs, 8 matched commuters, 8 unmatched commuters.
//
// Workplace is the only recorded feature used to estimate scores here.
// Individual commute times are not supplied, so no individual matched-pair
// time differences are invented.
//
// Try it beats preview the separate interactive exercise.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ------------------------------------------------------------
  // Fixed chapter data and responsive layout
  // ------------------------------------------------------------

  const DATA = [
    {
      name: 'Central',
      n: 8,
      pass: 6,
      noPass: 2,
      yes: 25,
      no: 30,
      score: '3/4',
      decimal: 0.75,
      color: C.cyan
    },
    {
      name: 'Hill',
      n: 8,
      pass: 2,
      noPass: 6,
      yes: 45,
      no: 50,
      score: '1/4',
      decimal: 0.25,
      color: C.violet
    }
  ];

  const CX = P ? 0 : -2.65;
  const PIC_W = P ? 7.0 : 7.15;

  const PILL = P ? [0, 3.65, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, -4.10, 0] : [4.25, -0.30, 0];

  const TITLE_Y = P ? 2.85 : 1.43;

  const ROW_Y = P
    ? [1.45, -0.95]
    : [0.43, -1.48];

  const SP = P ? 0.80 : 0.81;

  const DOT_R = 0.105;
  const HALO_R = 0.225;
  const RING_R = 0.205;

  const ENV_W = P ? 0.72 : 0.68;
  const ENV_H = P ? 0.44 : 0.35;

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
      cornerRadius: 0.12,
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
  // Each box is assembled before it appears.
  // Never regroup objects that are already on screen.
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
  // Commuter markers
  //
  // Cyan = Central.
  // Violet = Hill.
  // Amber ring = actually received a pass.
  //
  // The envelope below each dot describes the estimated chance
  // of receiving a pass, NOT whether the person actually got one.
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

  function dotPos(workplace, slot) {
    return at(
      CX + (slot - 3.5) * SP,
      ROW_Y[workplace] + 0.12
    );
  }

  function envPos(workplace, slot) {
    return at(
      CX + (slot - 3.5) * SP,
      ROW_Y[workplace] - 0.35
    );
  }

  function envelope(p, color, score = null) {
    const [x, y] = p;

    const r = new M.RoundedRectangle({
      width: ENV_W,
      height: ENV_H,
      cornerRadius: 0.06,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, score === null ? 0.055 : 0.18);
    r.moveTo(p);

    if (score === null) {
      const a = line(
        at(x - ENV_W / 2 + 0.035, y + ENV_H / 2 - 0.04),
        at(x, y - 0.015),
        color,
        1.3
      );

      const b = line(
        at(x, y - 0.015),
        at(x + ENV_W / 2 - 0.035, y + ENV_H / 2 - 0.04),
        color,
        1.3
      );

      return new M.VGroup(r, a, b);
    }

    const t = txt(
      score,
      P ? 20 : 16,
      color,
      p,
      true,
      ENV_W - 0.12
    );

    return new M.VGroup(r, t);
  }

  // ------------------------------------------------------------
  // Board state
  //
  // A commuter keeps their original ID, workplace, actual
  // pass receipt and propensity score throughout matching.
  //
  // Only their visual position changes.
  // ------------------------------------------------------------

  function makeBoard(scoresVisible = false) {
    const people = DATA.map((d, k) =>
      Array.from({ length: d.n }, (_, j) => {
        const hasPass = j < d.pass;

        return {
          id: j,
          workplace: k,
          color: d.color,
          pass: hasPass,
          score: d.score,
          slot: j,
          matched: false,

          mob: commuter(
            dotPos(k, j),
            d.color,
            hasPass
          ),

          env: envelope(
            envPos(k, j),
            d.color,
            scoresVisible ? d.score : null
          )
        };
      })
    );

    const names = DATA.map((d, k) =>
      txt(
        d.name,
        P ? 21 : 20,
        d.color,
        at(CX - 2.45, ROW_Y[k] + 0.68)
      )
    );

    const counts = DATA.map((d, k) =>
      txt(
        `${d.pass} pass • ${d.noPass} no pass`,
        P ? 16 : 15,
        C.amber,
        at(CX + 1.55, ROW_Y[k] + 0.68),
        true,
        3.45
      )
    );

    return {
      people,
      names,
      counts,
      countsVisible: [false, false],
      envelopesVisible: scoresVisible,
      scoresVisible: [scoresVisible, scoresVisible],
      pairFrames: [],
      pairLabels: [],
      unmatchedFrames: [],
      unmatchedLabels: []
    };
  }

  function boardObjects(b) {
    return [
      ...b.people.flat().map(p => p.mob),

      ...(b.envelopesVisible
        ? b.people.flat().map(p => p.env)
        : []),

      ...b.names,

      ...b.counts.filter((_, k) => b.countsVisible[k]),

      ...b.pairFrames,
      ...b.pairLabels,
      ...b.unmatchedFrames,
      ...b.unmatchedLabels
    ];
  }

  function showBoard(b, includeCounts = true) {
    const a = [
      ...b.names.map(t => new M.FadeIn(t)),

      lagIn(
        b.people.flat().map(p => p.mob),
        1.10,
        0.055
      )
    ];

    if (includeCounts) {
      a.push(...b.counts.map(t => new M.FadeIn(t)));
      b.countsVisible = [true, true];
    }

    if (b.envelopesVisible) {
      a.push(
        lagIn(
          b.people.flat().map(p => p.env),
          0.95,
          0.05
        )
      );
    }

    return a;
  }

  function revealEnvelopes(b) {
    b.envelopesVisible = true;

    return [
      lagIn(
        b.people.flat().map(p => p.env),
        1.35,
        0.065
      )
    ];
  }

  function writeScores(b, workplace) {
    const group = b.people[workplace];

    const old = group.map(p => p.env);

    group.forEach(p => {
      p.env = envelope(
        envPos(workplace, p.slot),
        p.color,
        p.score
      );
    });

    b.scoresVisible[workplace] = true;

    return [
      ...fadeAll(old),

      lagIn(
        group.map(p => p.env),
        1.15,
        0.09
      )
    ];
  }

  function personOutline(person, color = C.green) {
    const p = dotPos(
      person.workplace,
      person.slot
    );

    return rect(
      at(
        p[0],
        ROW_Y[person.workplace] - 0.055
      ),
      ENV_W + 0.10,
      P ? 1.12 : 1.04,
      color,
      0,
      2.1
    );
  }

  function slotOutline(workplace, first, last, color = C.green) {
    const x1 = dotPos(workplace, first)[0];
    const x2 = dotPos(workplace, last)[0];

    return rect(
      at(
        (x1 + x2) / 2,
        ROW_Y[workplace] - 0.055
      ),
      x2 - x1 + ENV_W + 0.10,
      P ? 1.12 : 1.04,
      color,
      0,
      2.1
    );
  }

  function rowPeople(b, workplace, hasPass) {
    return b.people[workplace].filter(
      p => p.pass === hasPass
    );
  }

  // ------------------------------------------------------------
  // 0-1: introduce matching by a similar chance
  // ------------------------------------------------------------

  const INTRO_Y = P ? 0.95 : -0.25;

  const introPositions = [
    at(CX - 1.25, INTRO_Y + 0.30),
    at(CX + 1.25, INTRO_Y + 0.30)
  ];

  const introDots = [
    commuter(introPositions[0], C.cyan, true),
    commuter(introPositions[1], C.cyan, false)
  ];

  const introLabels = [
    txt(
      'Received a pass',
      19,
      C.amber,
      at(CX - 1.25, INTRO_Y - 0.22),
      false,
      2.25
    ),

    txt(
      'No pass',
      19,
      C.ink,
      at(CX + 1.25, INTRO_Y - 0.22),
      false,
      2.25
    )
  ];

  const introEnvelopes = [
    envelope(
      at(CX - 1.25, INTRO_Y - 0.78),
      C.cyan
    ),

    envelope(
      at(CX + 1.25, INTRO_Y - 0.78),
      C.cyan
    )
  ];

  const introPair = rect(
    at(CX, INTRO_Y - 0.16),
    5.10,
    1.95,
    C.green,
    0,
    2.2
  );

  const introTitle = txt(
    'A similar chance of getting a pass?',
    P ? 23 : 22,
    C.green,
    at(CX, P ? 2.35 : 1.15),
    false,
    PIC_W
  );

  await until(S(0));
  await play(
    lagIn(introDots, 0.75, 0.20),
    ...introLabels.map(t => new M.FadeIn(t)),
    ...say('PAIR PEOPLE WITH A SIMILAR CHANCE', C.green)
  );

  await until(S(1));
  await play(
    new M.FadeIn(introTitle),
    lagIn(introEnvelopes, 0.70, 0.15),
    new M.Create(introPair),
    ...fbox([
      ['THE QUESTION', C.green],
      'Different pass outcomes.',
      'Similar chances of receipt.',
      'Could this be a fairer comparison?'
    ], C.green),
    ...say('COULD MATCHING MAKE THE COMPARISON FAIRER?', C.green)
  );

  // ------------------------------------------------------------
  // 2-4: recover the fixed Central/Hill snapshot
  // ------------------------------------------------------------

  let board = makeBoard(false);

  let boardTitle = txt(
    'THE SAME 16 COMMUTERS',
    P ? 20 : 18,
    C.cyan,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  // 2: lay out the two workplace rows.
  await until(S(2));
  await play(
    ...fadeAll([
      ...introDots,
      ...introLabels,
      ...introEnvelopes,
      introPair,
      introTitle
    ]),
    ...clearBox(),
    new M.FadeIn(boardTitle),
    ...showBoard(board, false),
    ...say('CENTRAL AND HILL: 8 COMMUTERS EACH')
  );

  // 3: Central has six with a pass.
  const centralHolders = rowPeople(board, 0, true);

  board.countsVisible[0] = true;

  await until(S(3));
  await play(
    new M.FadeIn(board.counts[0]),
    lagIndicate(
      centralHolders.map(p => p.mob),
      C.amber,
      1.0
    ),
    ...fbox([
      ['CENTRAL', C.cyan],
      '8 commuters',
      ['6 received a pass', C.amber],
      '2 did not'
    ], C.cyan),
    ...say('CENTRAL: 6 OUT OF 8 GOT A PASS', C.cyan)
  );

  // 4: Hill has two with a pass.
  const hillHolders = rowPeople(board, 1, true);

  board.countsVisible[1] = true;

  await until(S(4));
  await play(
    new M.FadeIn(board.counts[1]),
    lagIndicate(
      hillHolders.map(p => p.mob),
      C.amber,
      0.75
    ),
    ...fbox([
      ['HILL', C.violet],
      '8 commuters',
      ['2 received a pass', C.amber],
      '6 did not'
    ], C.violet),
    ...say('HILL: 2 OUT OF 8 GOT A PASS', C.violet)
  );

  // ------------------------------------------------------------
  // 5-6: envelopes hold a clue about the chance of receipt
  // ------------------------------------------------------------

  const envelopeTitle = txt(
    'A CLUE ABOUT EACH PERSON’S CHANCE',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  // 5: give every commuter an envelope.
  await until(S(5));
  await play(
    new M.FadeOut(boardTitle),
    new M.FadeIn(envelopeTitle),
    ...revealEnvelopes(board),
    ...fbox([
      ['ONE ENVELOPE PER PERSON', C.green],
      'A clue about their chance',
      'of receiving a pass.',
      'Not their actual outcome.'
    ], C.green),
    ...say('EACH ENVELOPE HOLDS A CHANCE')
  );

  boardTitle = envelopeTitle;

  // 6: only workplace is used in this example.
  await until(S(6));
  await play(
    new M.Indicate(
      board.names[0],
      { color: C.cyan }
    ),
    new M.Indicate(
      board.names[1],
      { color: C.violet }
    ),
    ...fbox([
      ['ONE RECORDED FEATURE', C.green],
      'Where the person works.',
      ['Central', C.cyan],
      ['or Hill', C.violet]
    ], C.green),
    ...say('USE JUST ONE DETAIL: WORKPLACE')
  );

  // ------------------------------------------------------------
  // 7-12: estimate the workplace-specific chances
  //
  // Central: 6/8 = 3/4 = 75%.
  // Hill:    2/8 = 1/4 = 25%.
  //
  // Everyone at the same workplace receives the same score,
  // regardless of their actual receipt status.
  // ------------------------------------------------------------

  const centralRowFrame = slotOutline(
    0,
    0,
    7,
    C.cyan
  );

  const hillRowFrame = slotOutline(
    1,
    0,
    7,
    C.violet
  );

  // 7: Central's estimated chance.
  await until(S(7));
  await play(
    new M.Create(centralRowFrame),
    ...fbox([
      ['CENTRAL', C.cyan],
      '6 with passes',
      '8 commuters',
      ['6/8 = 3/4', C.cyan]
    ], C.cyan),
    ...say('CENTRAL: 6/8 = 3/4', C.cyan)
  );

  // 8: write three out of four on every Central envelope.
  await until(S(8));
  await play(
    ...writeScores(board, 0),
    ...fbox([
      ['CENTRAL SCORE', C.cyan],
      '3 out of 4',
      ['3/4 = 75%', C.cyan],
      'For every Central commuter.'
    ], C.cyan),
    ...say('EVERY CENTRAL ENVELOPE GETS 3/4', C.cyan)
  );

  // 9: Hill's estimated chance.
  await until(S(9));
  await play(
    new M.FadeOut(centralRowFrame),
    new M.Create(hillRowFrame),
    ...fbox([
      ['HILL', C.violet],
      '2 with passes',
      '8 commuters',
      ['2/8 = 1/4', C.violet]
    ], C.violet),
    ...say('HILL: 2/8 = 1/4', C.violet)
  );

  // 10: write one out of four on every Hill envelope.
  await until(S(10));
  await play(
    ...writeScores(board, 1),
    ...fbox([
      ['HILL SCORE', C.violet],
      '1 out of 4',
      ['1/4 = 25%', C.violet],
      'For every Hill commuter.'
    ], C.violet),
    ...say('EVERY HILL ENVELOPE GETS 1/4', C.violet)
  );

  // 11: actual receipt and chance of receipt are different.
  const centralNonholder = board.people[0][6];

  const nonholderFrame = personOutline(
    centralNonholder,
    C.green
  );

  await until(S(11));
  await play(
    new M.FadeOut(hillRowFrame),
    new M.Create(nonholderFrame),
    new M.Indicate(
      centralNonholder.env,
      { color: C.green }
    ),
    ...fbox([
      ['CENTRAL NONHOLDER', C.cyan],
      'Actually got a pass? No.',
      ['Estimated chance: 3/4', C.green],
      'Same workplace score.'
    ], C.green),
    ...say('NO PASS DOES NOT MEAN ZERO CHANCE', C.green)
  );

  // 12: compare a holder and nonholder with the same score.
  const centralHolder = board.people[0][0];

  const holderFrame = personOutline(
    centralHolder,
    C.green
  );

  await until(S(12));
  await play(
    new M.Create(holderFrame),
    new M.Indicate(
      centralHolder.env,
      { color: C.green }
    ),
    new M.Indicate(
      centralNonholder.env,
      { color: C.green }
    ),
    ...fbox([
      ['CHANCE IS NOT OUTCOME', C.green],
      'Person with pass:    3/4',
      'Person without pass: 3/4',
      'Different actual outcomes.',
      ['Same estimated chance.', C.green]
    ], C.green),
    ...say('THE SCORE DESCRIBES CHANCE, NOT WHAT HAPPENED', C.green)
  );

  // ------------------------------------------------------------
  // 13-17: name and define the propensity score
  // ------------------------------------------------------------

  const scoreTitle = txt(
    'PROPENSITY SCORE',
    P ? 23 : 21,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  // 13: this estimated chance is called a propensity score.
  await until(S(13));
  await play(
    new M.FadeOut(boardTitle),
    new M.FadeIn(scoreTitle),
    new M.FadeOut(holderFrame),
    new M.FadeOut(nonholderFrame),
    ...fbox([
      ['PROPENSITY SCORE', C.green],
      'An estimated chance',
      'of receiving a pass.'
    ], C.green),
    ...say('THIS IS A PROPENSITY SCORE', C.green)
  );

  boardTitle = scoreTitle;

  // 14: propensity means tendency.
  await until(S(14));
  await play(
    ...fbox([
      ['PROPENSITY', C.green],
      '= tendency',
      'How likely something',
      'is to happen.'
    ], C.green),
    ...say('PROPENSITY = TENDENCY', C.green)
  );

  // 15: chance given the recorded details used.
  await until(S(15));
  await play(
    new M.Indicate(
      board.names[0],
      { color: C.cyan }
    ),
    new M.Indicate(
      board.names[1],
      { color: C.violet }
    ),
    ...fbox([
      ['PROPENSITY SCORE', C.green],
      'Chance of getting a pass',
      'given the recorded details',
      'we use about the person.',
      ['Here: workplace only.', C.amber]
    ], C.green),
    ...say('CHANCE GIVEN THE RECORDED INFORMATION', C.green)
  );

  // 16: estimate the chance using observed receipt shares.
  await until(S(16));
  await play(
    new M.Indicate(
      board.counts[0],
      { color: C.cyan }
    ),
    new M.Indicate(
      board.counts[1],
      { color: C.violet }
    ),
    ...fbox([
      ['ESTIMATE FROM THE RECORDS', C.green],
      ['Central: 6 out of 8', C.cyan],
      ['Hill:    2 out of 8', C.violet],
      'Use each workplace’s share.'
    ], C.green),
    ...say('ESTIMATE THE CHANCE FROM EACH WORKPLACE')
  );

  // 17: score rule in this particular example.
  await until(S(17));
  await play(
    ...fbox([
      ['SCORE RULE IN THIS EXAMPLE', C.green],
      'Number with passes',
      '÷ Number at workplace',
      ['Central: 6/8 = 3/4', C.cyan],
      ['Hill:    2/8 = 1/4', C.violet]
    ], C.green),
    ...say('SCORE = PASS COUNT ÷ WORKPLACE COUNT', C.green)
  );

  // ------------------------------------------------------------
  // Matching helpers
  //
  // Every pair contains exactly:
  //   one commuter with a pass,
  //   one commuter without a pass,
  //   equal scores in this workplace-only illustration.
  //
  // No commuter is used twice.
  //
  // Slot order after Central matching:
  //   [0, 6, 1, 7, 2, 3, 4, 5]
  //
  // Slot order after Hill matching:
  //   [0, 2, 1, 3, 4, 5, 6, 7]
  //
  // Each adjacent pair occupies two slots.
  // The remaining four slots hold unmatched commuters.
  // ------------------------------------------------------------

  function movePerson(person, newSlot) {
    const oldSlot = person.slot;

    if (oldSlot === newSlot) return [];

    const arc = newSlot > oldSlot ? -0.24 : 0.24;

    person.slot = newSlot;

    return [
      new M.Transform(
        person.mob,
        commuter(
          dotPos(person.workplace, newSlot),
          person.color,
          person.pass
        ),
        {
          pathArc: arc,
          runTime: 1.05
        }
      ),

      new M.Transform(
        person.env,
        envelope(
          envPos(person.workplace, newSlot),
          person.color,
          person.score
        ),
        {
          pathArc: arc,
          runTime: 1.05
        }
      )
    ];
  }

  function reorderRow(b, workplace, order) {
    const a = [];

    order.forEach((id, slot) => {
      const person = b.people[workplace].find(
        p => p.id === id
      );

      a.push(
        ...movePerson(person, slot)
      );
    });

    return a;
  }

  function pairFrame(workplace, pairIndex) {
    const first = pairIndex * 2;
    const last = first + 1;

    return slotOutline(
      workplace,
      first,
      last,
      C.green
    );
  }

  function pairLabel(workplace, pairIndex) {
    const x1 = dotPos(
      workplace,
      pairIndex * 2
    )[0];

    const x2 = dotPos(
      workplace,
      pairIndex * 2 + 1
    )[0];

    return txt(
      'PAIR',
      P ? 17 : 14,
      C.green,
      at(
        (x1 + x2) / 2,
        ROW_Y[workplace] - (P ? 0.79 : 0.73)
      ),
      true,
      1.45
    );
  }

  function addPair(b, workplace, firstId, secondId, pairIndex) {
    const first = b.people[workplace].find(
      p => p.id === firstId
    );

    const second = b.people[workplace].find(
      p => p.id === secondId
    );

    // Guard against accidental reuse or invalid matching.
    if (
      first.matched ||
      second.matched ||
      first.pass === second.pass ||
      first.score !== second.score
    ) {
      return [];
    }

    first.matched = true;
    second.matched = true;

    const frame = pairFrame(
      workplace,
      pairIndex
    );

    const label = pairLabel(
      workplace,
      pairIndex
    );

    b.pairFrames.push(frame);
    b.pairLabels.push(label);

    return [
      new M.Create(frame),
      new M.FadeIn(label)
    ];
  }

  function addUnmatched(b, workplace) {
    const frame = slotOutline(
      workplace,
      4,
      7,
      C.muted
    );

    const x1 = dotPos(workplace, 4)[0];
    const x2 = dotPos(workplace, 7)[0];

    const label = txt(
      '4 UNMATCHED',
      P ? 17 : 14,
      C.muted,
      at(
        (x1 + x2) / 2,
        ROW_Y[workplace] - (P ? 0.79 : 0.73)
      ),
      true,
      3.20
    );

    b.unmatchedFrames.push(frame);
    b.unmatchedLabels.push(label);

    return [
      new M.Create(frame),
      new M.FadeIn(label)
    ];
  }

  function matchedPeople(b) {
    return b.people.flat().filter(
      p => p.matched
    );
  }

  function unmatchedPeople(b) {
    return b.people.flat().filter(
      p => !p.matched
    );
  }

  // ------------------------------------------------------------
  // 18-22: match the Central commuters
  // ------------------------------------------------------------

  const selectedCentral = board.people[0][0];

  const selection = personOutline(
    selectedCentral,
    C.amber
  );

  // 18: choose a Central commuter with a pass.
  await until(S(18));
  await play(
    new M.Create(selection),
    new M.Indicate(
      selectedCentral.mob,
      { color: C.amber }
    ),
    ...fbox([
      ['START MATCHING', C.green],
      'Central commuter',
      'Received a pass.',
      ['Score = 3/4', C.cyan]
    ], C.green),
    ...say('CHOOSE A CENTRAL PASS HOLDER', C.amber)
  );

  // 19: pair with a Central commuter who did not receive a pass.
  //
  // Move person 6 next to person 0.
  // Move person 1 into the vacated slot.
  await until(S(19));
  await play(
    new M.FadeOut(selection),

    ...reorderRow(
      board,
      0,
      [0, 6, 2, 3, 4, 5, 1, 7]
    ),

    ...addPair(
      board,
      0,
      0,
      6,
      0
    ),

    ...fbox([
      ['CENTRAL PAIR 1', C.green],
      'With pass:    score 3/4',
      'Without pass: score 3/4',
      ['One of each.', C.green]
    ], C.green),
    ...say('PAIR WITH A CENTRAL NONHOLDER', C.green)
  );

  // 20: their envelopes show exactly the same chance.
  await until(S(20));
  await play(
    new M.Indicate(
      board.people[0][0].env,
      { color: C.green, runTime: 0.75 }
    ),
    new M.Indicate(
      board.people[0][6].env,
      { color: C.green, runTime: 0.75 }
    ),
    ...fbox([
      ['MATCHED SCORES', C.green],
      '3/4 = 3/4',
      'Same estimated chance.',
      'Different actual receipt.'
    ], C.green),
    ...say('SAME SCORE, DIFFERENT PASS STATUS', C.green)
  );

  // 21: make the second Central pair without reusing anyone.
  await until(S(21));
  await play(
    ...reorderRow(
      board,
      0,
      [0, 6, 1, 7, 2, 3, 4, 5]
    ),

    ...addPair(
      board,
      0,
      1,
      7,
      1
    ),

    ...fbox([
      ['CENTRAL PAIR 2', C.green],
      'Use the other nonholder.',
      'Both scores = 3/4.',
      ['2 pairs at Central', C.green]
    ], C.green),
    ...say('MAKE A SECOND PAIR WITHOUT REUSING PEOPLE', C.green)
  );

  // 22: four Central pass holders remain unmatched.
  const centralUnmatched = board.people[0].filter(
    p => !p.matched
  );

  await until(S(22));
  await play(
    ...addUnmatched(board, 0),
    lagIndicate(
      centralUnmatched.map(p => p.mob),
      C.amber,
      0.90
    ),
    ...fbox([
      ['CENTRAL', C.cyan],
      '6 pass holders',
      '2 nonholders',
      ['2 pairs', C.green],
      ['4 pass holders unmatched', C.amber]
    ], C.cyan),
    ...say('4 CENTRAL PASS HOLDERS HAVE NO PARTNER', C.amber)
  );

  // ------------------------------------------------------------
  // 23-25: match the Hill commuters
  // ------------------------------------------------------------

  // 23: each of Hill's two pass holders gets one distinct partner.
  await until(S(23));
  await play(
    ...reorderRow(
      board,
      1,
      [0, 2, 1, 3, 4, 5, 6, 7]
    ),

    ...addPair(
      board,
      1,
      0,
      2,
      0
    ),

    ...addPair(
      board,
      1,
      1,
      3,
      1
    ),

    ...fbox([
      ['HILL MATCHES', C.violet],
      '2 pass holders',
      'Each gets a nonholder.',
      ['1/4 = 1/4 in each pair', C.green],
      ['2 pairs at Hill', C.green]
    ], C.violet),
    ...say('MAKE TWO HILL PAIRS WITH SCORE 1/4', C.violet)
  );

  // 24: four Hill nonholders remain unmatched.
  const hillUnmatched = board.people[1].filter(
    p => !p.matched
  );

  await until(S(24));
  await play(
    ...addUnmatched(board, 1),
    lagIndicate(
      hillUnmatched.map(p => p.mob),
      C.violet,
      0.90
    ),
    ...fbox([
      ['HILL', C.violet],
      '2 pass holders',
      '6 nonholders',
      ['2 pairs', C.green],
      ['4 nonholders unmatched', C.violet]
    ], C.violet),
    ...say('4 HILL NONHOLDERS HAVE NO PARTNER', C.violet)
  );

  // 25: four pairs in total.
  const fourPairsTitle = txt(
    '4 PAIRS • 8 MATCHED COMMUTERS',
    P ? 20 : 19,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  await until(S(25));
  await play(
    new M.FadeOut(boardTitle),
    new M.FadeIn(fourPairsTitle),
    lagIndicate(
      board.pairFrames,
      C.green,
      1.20
    ),
    ...fbox([
      ['TOTAL MATCHES', C.green],
      ['Central: 2 pairs', C.cyan],
      ['Hill:    2 pairs', C.violet],
      '2 + 2 = 4 pairs',
      ['8 matched people', C.green]
    ], C.green),
    ...say('2 + 2 = 4 PAIRS IN ALL', C.green)
  );

  boardTitle = fourPairsTitle;

  // ------------------------------------------------------------
  // 26-28: define matching and the population it describes
  // ------------------------------------------------------------

  // 26: matching pairs opposite receipt groups with close scores.
  await until(S(26));
  await play(
    ...fbox([
      ['MATCHING', C.green],
      'Pair someone with a pass',
      'with someone without one.',
      ['Choose close scores.', C.green],
      'Do not reuse people here.'
    ], C.green),
    ...say('MATCHING = PAIR PEOPLE WITH CLOSE SCORES', C.green)
  );

  // 27: compare commute times only within matched pairs.
  //
  // The fixed chapter snapshot contains group averages,
  // not individual commute times.
  //
  // Do not assign those group averages to individual matched
  // commuters as if they were observed trip records.

  await until(S(27));
  await play(
    lagIndicate(
      board.pairFrames,
      C.green,
      1.10
    ),
    ...fbox([
      ['COMPARE INSIDE EACH PAIR', C.green],
      'Pass holder’s commute time',
      '− Nonholder’s commute time',
      'Use their actual recorded times.',
      ['Individual times not shown here.', C.muted]
    ], C.green),
    ...say('COMPARE COMMUTE TIMES WITHIN PAIRS', C.green)
  );

  // 28: the matched comparison describes eight people.
  await until(S(28));
  await play(
    lagIndicate(
      matchedPeople(board).map(p => p.mob),
      C.green,
      1.05
    ),
    ...fbox([
      ['WHO FOUND A PARTNER?', C.green],
      '4 pairs × 2 people = 8',
      ['8 matched commuters', C.green],
      ['8 unmatched commuters', C.muted],
      'Not all 16 commuters.'
    ], C.green),
    ...say('THE MATCHED COMPARISON USES 8 OF THE 16', C.green)
  );

  // ------------------------------------------------------------
  // 29-32: why use one score instead of every feature?
  //
  // Workplace is enough to organize this simple illustration.
  //
  // Real propensity scores may use multiple pre-receipt details.
  // The following feature cards are illustrative, not additional
  // observed data for the chapter's 16 commuters.
  // ------------------------------------------------------------

  // 29: in this example, matching by score equals matching
  // by workplace because workplace is the only feature.
  await until(S(29));
  await play(
    new M.Indicate(
      board.names[0],
      { color: C.cyan }
    ),
    new M.Indicate(
      board.names[1],
      { color: C.violet }
    ),
    ...fbox([
      ['WHY USE A SCORE?', C.amber],
      'Here, workplace is enough.',
      'Central always gets 3/4.',
      'Hill always gets 1/4.',
      'Real records can be richer.'
    ], C.amber),
    ...say('WHY NOT JUST MATCH BY WORKPLACE?', C.amber)
  );

  const FEATURE_X = CX - 1.92;

  const FEATURE_Y = P
    ? [2.15, 1.15, 0.15, -0.85]
    : [0.80, -0.09, -0.98, -1.87];

  const FEATURE_W = 2.65;
  const FEATURE_H = P ? 0.74 : 0.66;

  function featureCard(name, subtitle, p, color) {
    const r = rect(
      p,
      FEATURE_W,
      FEATURE_H,
      color,
      0.95,
      1.6
    );

    const a = txt(
      name,
      P ? 20 : 18,
      color,
      at(p[0], p[1] + 0.12),
      false,
      FEATURE_W - 0.20
    );

    const b = txt(
      subtitle,
      P ? 17 : 15,
      C.ink,
      at(p[0], p[1] - 0.16),
      false,
      FEATURE_W - 0.20
    );

    return new M.VGroup(r, a, b);
  }

  const featureCards = [
    featureCard(
      'Workplace',
      'Where they work',
      at(FEATURE_X, FEATURE_Y[0]),
      C.cyan
    ),

    featureCard(
      'Distance',
      'How far from work',
      at(FEATURE_X, FEATURE_Y[1]),
      C.violet
    ),

    featureCard(
      'Working hours',
      'When they travel',
      at(FEATURE_X, FEATURE_Y[2]),
      C.amber
    ),

    featureCard(
      'Age',
      'Another recorded detail',
      at(FEATURE_X, FEATURE_Y[3]),
      C.green
    )
  ];

  const featureTitle = txt(
    'REAL RECORDS MAY HAVE MANY DETAILS',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const MANY_X = CX + 1.75;
  const MANY_Y = P ? 0.65 : -0.43;

  const detailsFrame = rect(
    at(MANY_X, MANY_Y),
    2.72,
    P ? 2.55 : 2.40,
    C.muted,
    0.95,
    1.7
  );

  const detailsHeading = txt(
    'Find a partner',
    P ? 20 : 18,
    C.ink,
    at(MANY_X, MANY_Y + 0.91),
    false,
    2.45
  );

  const detailsRows = [
    'Same workplace?',
    'Similar distance?',
    'Similar hours?',
    'Similar age?'
  ].map((s, i) =>
    txt(
      s,
      P ? 16 : 15,
      C.muted,
      at(
        MANY_X,
        MANY_Y + 0.44 - i * 0.42
      ),
      false,
      2.48
    )
  );

  // 30: show several possible recorded features.
  await until(S(30));
  await play(
    ...fadeAll([
      boardTitle,
      ...boardObjects(board)
    ]),
    new M.FadeIn(featureTitle),
    lagIn(featureCards, 1.30, 0.15),
    ...fbox([
      ['MORE RECORDED DETAILS', C.green],
      'Workplace',
      'Distance',
      'Working hours',
      'Age'
    ], C.green),
    ...say('REAL RECORDS OFTEN HOLD MANY DETAILS')
  );

  // 31: exact matching across many details can become hard.
  const difficultTag = pill(
    'HARD TO MATCH ALL AT ONCE',
    C.amber,
    P ? 17 : 15
  );

  difficultTag.moveTo(
    at(CX, P ? -1.95 : -2.62)
  );

  await until(S(31));
  await play(
    new M.FadeIn(detailsFrame),
    new M.FadeIn(detailsHeading),
    lagIn(detailsRows, 1.0, 0.12),
    new M.FadeIn(difficultTag),
    ...fbox([
      ['MANY DETAILS AT ONCE', C.amber],
      'Finding a partner who',
      'matches every recorded',
      'detail can be difficult.'
    ], C.amber),
    ...say('MATCHING EVERY DETAIL CAN GET HARD', C.amber)
  );

  // ------------------------------------------------------------
  // Arrow helper for the many-details-to-one-score illustration.
  // ------------------------------------------------------------

  function arrow(start, end, color, stroke = 2.8) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const headL = Math.min(0.20, len * 0.35);
    const headW = 0.10;

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

  const SCORE_P = at(
    MANY_X + 0.12,
    MANY_Y
  );

  const scoreCard = rect(
    SCORE_P,
    2.55,
    1.45,
    C.green,
    0.97,
    2.3
  );

  const scoreCardTitle = txt(
    'ONE SCORE',
    P ? 21 : 19,
    C.green,
    at(SCORE_P[0], SCORE_P[1] + 0.40),
    true,
    2.30
  );

  const scoreCardValue = txt(
    'Chance of receipt',
    P ? 17 : 16,
    C.ink,
    at(SCORE_P[0], SCORE_P[1]),
    false,
    2.30
  );

  const scoreCardSub = txt(
    'Between 0 and 1',
    16,
    C.muted,
    at(SCORE_P[0], SCORE_P[1] - 0.39),
    true,
    2.30
  );

  const featureArrows = FEATURE_Y.map((y, i) => {
    const colors = [
      C.cyan,
      C.violet,
      C.amber,
      C.green
    ];

    return arrow(
      at(
        FEATURE_X + FEATURE_W / 2 + 0.06,
        y
      ),
      at(
        SCORE_P[0] - 2.55 / 2 - 0.07,
        SCORE_P[1] + (1.5 - i) * 0.22
      ),
      colors[i],
      2.4
    );
  });

  const oneNumberTag = pill(
    'MANY DETAILS → ONE ESTIMATED CHANCE',
    C.green,
    P ? 17 : 15
  );

  oneNumberTag.moveTo(
    at(CX, P ? -1.95 : -2.62)
  );

  // 32: compress the recorded features into an estimated chance.
  //
  // No numerical multi-feature propensity score is fabricated.
  // The chapter only supplies the workplace-only scores.
  await until(S(32));
  await play(
    ...fadeAll([
      detailsFrame,
      detailsHeading,
      ...detailsRows,
      difficultTag
    ]),
    new M.FadeIn(scoreCard),
    new M.FadeIn(scoreCardTitle),
    new M.FadeIn(scoreCardValue),
    new M.FadeIn(scoreCardSub),
    lagIn(featureArrows, 0.95, 0.15),
    new M.FadeIn(oneNumberTag),
    ...fbox([
      ['MANY FEATURES → ONE SCORE', C.green],
      'Estimate the chance',
      'of receiving a pass.',
      'Then look for partners',
      ['with similar scores.', C.green]
    ], C.green),
    ...say('THE SCORE SUMMARIZES MANY RECORDED DETAILS', C.green)
  );

  // ------------------------------------------------------------
  // 33: features should precede pass receipt
  // ------------------------------------------------------------

  const timeY = P ? 0.30 : -0.40;

  const timeLeft = CX - 2.95;
  const timeRight = CX + 2.95;

  const timeline = arrow(
    at(timeLeft, timeY),
    at(timeRight, timeY),
    C.muted,
    3.0
  );

  const passTimeX = CX + 0.50;

  const passTimeMarker = line(
    at(passTimeX, timeY - 0.48),
    at(passTimeX, timeY + 0.48),
    C.amber,
    3.0
  );

  const beforeLabel = txt(
    'BEFORE THE PASS',
    P ? 19 : 17,
    C.green,
    at(CX - 1.45, timeY + 0.86),
    true,
    2.95
  );

  const afterLabel = txt(
    'AFTER',
    18,
    C.muted,
    at(CX + 2.05, timeY + 0.86),
    true
  );

  const receiptLabel = txt(
    'Pass received',
    P ? 18 : 17,
    C.amber,
    at(passTimeX, timeY - 0.80),
    false,
    2.25
  );

  const recordedLabel = txt(
    'Use details from here',
    P ? 18 : 17,
    C.green,
    at(CX - 1.45, timeY - 0.73),
    false,
    3.05
  );

  const beforeFrame = rect(
    at(CX - 1.36, timeY),
    3.05,
    0.74,
    C.green,
    0,
    2.0
  );

  const timingTitle = txt(
    'USE PRE-RECEIPT INFORMATION',
    P ? 20 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const timelineObjects = [
    timeline,
    passTimeMarker,
    beforeLabel,
    afterLabel,
    receiptLabel,
    recordedLabel,
    beforeFrame,
    timingTitle
  ];

  // 33: use details recorded before the person received the pass.
  await until(S(33));
  await play(
    ...fadeAll([
      featureTitle,
      ...featureCards,
      ...featureArrows,
      scoreCard,
      scoreCardTitle,
      scoreCardValue,
      scoreCardSub,
      oneNumberTag
    ]),
    new M.FadeIn(timingTitle),
    new M.FadeIn(timeline),
    new M.Create(passTimeMarker),
    new M.Create(beforeFrame),
    lagIn(
      [
        beforeLabel,
        afterLabel,
        receiptLabel,
        recordedLabel
      ],
      0.75,
      0.10
    ),
    ...fbox([
      ['TIMING MATTERS', C.green],
      'Use information from before',
      'people received their passes.',
      ['Avoid details changed by the pass.', C.amber]
    ], C.green),
    ...say('USE DETAILS FROM BEFORE PASS RECEIPT', C.green)
  );

  // ------------------------------------------------------------
  // 34-36: equal scores do not guarantee fair comparisons
  // ------------------------------------------------------------

  function scorePersonCard(p, hasPass) {
    const [x, y] = p;

    const r = rect(
      p,
      2.55,
      1.95,
      hasPass ? C.amber : C.muted,
      0.96,
      1.7
    );

    const dot = commuter(
      at(x, y + 0.35),
      C.cyan,
      hasPass
    );

    const outcome = txt(
      hasPass ? 'With pass' : 'Without pass',
      18,
      hasPass ? C.amber : C.ink,
      at(x, y - 0.13),
      false,
      2.25
    );

    const score = txt(
      'Score: 3/4',
      19,
      C.cyan,
      at(x, y - 0.64),
      true,
      2.25
    );

    return new M.VGroup(r, dot, outcome, score);
  }

  const WARN_Y = P ? 0.75 : -0.43;

  const warningPeople = [
    scorePersonCard(
      at(CX - 1.65, WARN_Y),
      true
    ),

    scorePersonCard(
      at(CX + 1.65, WARN_Y),
      false
    )
  ];

  const equalScoreTag = pill(
    'EQUAL SCORES',
    C.green,
    P ? 18 : 16
  );

  equalScoreTag.moveTo(
    at(CX, WARN_Y + 1.40)
  );

  const notGuarantee = txt(
    'Does that guarantee a fair comparison?',
    P ? 20 : 18,
    C.amber,
    at(CX, WARN_Y - 1.48),
    false,
    PIC_W
  );

  // 34: common trap — equal scores are not a guarantee.
  await until(S(34));
  await play(
    ...fadeAll(timelineObjects),
    lagIn(warningPeople, 0.80, 0.12),
    new M.FadeIn(equalScoreTag),
    new M.FadeIn(notGuarantee),
    ...fbox([
      ['COMMON TRAP', C.amber],
      'Equal propensity scores',
      'do not guarantee',
      'a fair comparison.'
    ], C.amber),
    ...say('EQUAL SCORES DO NOT GUARANTEE FAIRNESS', C.amber)
  );

  // ------------------------------------------------------------
  // 35: check recorded feature balance
  //
  // Show the actual balance of workplace among the matched
  // pass holders and matched nonholders:
  //
  // Each group: 2 Central, 2 Hill.
  //
  // Other possible features are not measured in this illustration.
  // ------------------------------------------------------------

  function balanceRow(y, hasPass) {
    const colors = [
      C.cyan,
      C.cyan,
      C.violet,
      C.violet
    ];

    const label = txt(
      hasPass ? 'MATCHED WITH PASS' : 'MATCHED WITHOUT PASS',
      P ? 18 : 17,
      hasPass ? C.amber : C.ink,
      at(CX, y + 0.53),
      true,
      PIC_W
    );

    const dots = colors.map((color, i) =>
      commuter(
        at(CX + (i - 1.5) * 0.85, y),
        color,
        hasPass
      )
    );

    const count = txt(
      '2 Central + 2 Hill',
      18,
      C.green,
      at(CX, y - 0.53),
      true
    );

    return new M.VGroup(
      label,
      ...dots,
      count
    );
  }

  const balanceTitle = txt(
    'CHECK THE MATCHED GROUPS',
    P ? 20 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const balancePass = balanceRow(
    P ? 1.25 : 0.45,
    true
  );

  const balanceNo = balanceRow(
    P ? -0.80 : -1.43,
    false
  );

  const balanceTag = pill(
    'WORKPLACE MIX MATCHES',
    C.green,
    P ? 17 : 15
  );

  balanceTag.moveTo(
    at(CX, P ? -2.10 : -2.63)
  );

  // 35: inspect whether the actual recorded feature is balanced.
  await until(S(35));
  await play(
    ...fadeAll([
      ...warningPeople,
      equalScoreTag,
      notGuarantee
    ]),
    new M.FadeIn(balanceTitle),
    lagIn(
      [balancePass, balanceNo],
      0.85,
      0.15
    ),
    new M.FadeIn(balanceTag),
    ...fbox([
      ['CHECK RECORDED DETAILS', C.green],
      'Matched pass group:',
      '2 Central + 2 Hill',
      'Matched no-pass group:',
      '2 Central + 2 Hill'
    ], C.green),
    ...say('CHECK BALANCE AFTER MATCHING', C.green)
  );

  // ------------------------------------------------------------
  // 36: an unrecorded shared cause may still explain a gap
  // ------------------------------------------------------------

  const HIDDEN_P = at(
    CX,
    P ? 1.80 : 0.87
  );

  const RECEIPT_P = at(
    CX - 1.85,
    P ? -0.65 : -1.42
  );

  const TIME_P = at(
    CX + 1.85,
    P ? -0.65 : -1.42
  );

  function causalCard(title, subtitle, p, width, color) {
    const r = rect(
      p,
      width,
      0.90,
      color,
      0.97,
      2.0
    );

    const a = txt(
      title,
      P ? 20 : 18,
      color,
      at(p[0], p[1] + 0.13),
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

  const hiddenCause = causalCard(
    'Unrecorded cause?',
    'Not used in the score',
    HIDDEN_P,
    3.20,
    C.amber
  );

  const receiptNode = causalCard(
    'Pass receipt',
    'Got a pass or not',
    RECEIPT_P,
    2.70,
    C.cyan
  );

  const timeNode = causalCard(
    'Commute time',
    'Minutes to work',
    TIME_P,
    2.70,
    C.green
  );

  const hiddenA1 = arrow(
    at(HIDDEN_P[0] - 0.85, HIDDEN_P[1] - 0.51),
    at(RECEIPT_P[0] + 0.42, RECEIPT_P[1] + 0.53),
    C.amber
  );

  const hiddenA2 = arrow(
    at(HIDDEN_P[0] + 0.85, HIDDEN_P[1] - 0.51),
    at(TIME_P[0] - 0.42, TIME_P[1] + 0.53),
    C.amber
  );

  const hiddenTitle = txt(
    'SOMETHING MISSING FROM THE RECORDS?',
    P ? 18 : 17,
    C.amber,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const hiddenObjects = [
    hiddenCause,
    receiptNode,
    timeNode,
    hiddenA1,
    hiddenA2,
    hiddenTitle
  ];

  // 36: a missing common cause may still produce confounding.
  await until(S(36));
  await play(
    ...fadeAll([
      balanceTitle,
      balancePass,
      balanceNo,
      balanceTag
    ]),
    new M.FadeIn(hiddenTitle),
    lagIn(
      [
        hiddenCause,
        receiptNode,
        timeNode,
        hiddenA1,
        hiddenA2
      ],
      0.90,
      0.10
    ),
    ...fbox([
      ['UNRECORDED SHARED CAUSE', C.amber],
      'It could influence both',
      'pass receipt and travel time.',
      ['Matching cannot check', C.amber],
      ['what was never recorded.', C.amber]
    ], C.amber),
    ...say('UNRECORDED CAUSES CAN STILL CONFOUND', C.amber)
  );

  // ------------------------------------------------------------
  // 37-40: preview Try it
  //
  // Actual dragging and New data controls belong to the
  // separate interactive exercise.
  //
  // Begin again with the exact fixed chapter snapshot.
  // ------------------------------------------------------------

  let tryBoard = makeBoard(true);

  const tryTitle = txt(
    'TRY IT: FIND A MATCH',
    P ? 21 : 19,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  // 37: drag a commuter toward a partner and compare scores.
  await until(S(37));
  await play(
    ...fadeAll(hiddenObjects),
    new M.FadeIn(tryTitle),
    ...showBoard(tryBoard, true),
    ...fbox([
      ['TRY IT', C.green],
      'Choose a pass holder.',
      'Find a nonholder.',
      'Compare their scores.',
      ['Closer scores are the goal.', C.green]
    ], C.green),
    ...say('TRY IT: DRAG A COMMUTER TO A PARTNER', C.green)
  );

  // 38: challenge — make one Central pair.
  await until(S(38));
  await play(
    ...reorderRow(
      tryBoard,
      0,
      [0, 6, 2, 3, 4, 5, 1, 7]
    ),

    ...addPair(
      tryBoard,
      0,
      0,
      6,
      0
    ),

    ...fbox([
      ['CHALLENGE 1', C.green],
      'Pair two Central commuters.',
      'One with pass, one without.',
      ['3/4 = 3/4', C.cyan],
      ['Answer: a matching pair.', C.green]
    ], C.green),
    ...say('MAKE A CENTRAL PAIR WITH SCORE 3/4', C.green)
  );

  // 39: challenge — make all Hill pairs.
  await until(S(39));
  await play(
    ...reorderRow(
      tryBoard,
      1,
      [0, 2, 1, 3, 4, 5, 6, 7]
    ),

    ...addPair(
      tryBoard,
      1,
      0,
      2,
      0
    ),

    ...addPair(
      tryBoard,
      1,
      1,
      3,
      1
    ),

    ...addUnmatched(
      tryBoard,
      1
    ),

    ...fbox([
      ['CHALLENGE 2', C.violet],
      'Match both Hill pass holders.',
      ['2 pairs with score 1/4', C.green],
      'Who remains?',
      ['4 unmatched nonholders.', C.violet]
    ], C.violet),
    ...say('MATCH BOTH HILL HOLDERS: 4 REMAIN UNMATCHED', C.violet)
  );

  // 40: invite fresh counts in the interactive exercise.
  //
  // Preserve the fixed chapter snapshot in this narrated scene.
  // The actual New data control can supply fresh examples.

  const newDataTag = pill(
    'NEW DATA',
    C.green,
    P ? 19 : 17
  );

  newDataTag.moveTo(
    P
      ? at(CX, -2.95)
      : at(4.25, 1.26)
  );

  await until(S(40));
  await play(
    new M.FadeIn(newDataTag),
    ...fbox([
      ['TRY FRESH PASS COUNTS', C.green],
      'Calculate each score again.',
      'Make new pairs.',
      'Do not reuse people.',
      ['Check who is unmatched.', C.green]
    ], C.green),
    ...say('NEW DATA: ESTIMATE SCORES AND MATCH AGAIN', C.green)
  );

  // ------------------------------------------------------------
  // 41: final takeaway
  //
  // Restore all four pairs from the fixed chapter illustration.
  // Construct the final board off-screen in its matched order.
  //
  // No already-visible objects are regrouped.
  // ------------------------------------------------------------

  function makeFinalBoard() {
    const b = makeBoard(true);

    const orders = [
      [0, 6, 1, 7, 2, 3, 4, 5],
      [0, 2, 1, 3, 4, 5, 6, 7]
    ];

    orders.forEach((order, workplace) => {
      order.forEach((id, slot) => {
        const person = b.people[workplace].find(
          p => p.id === id
        );

        person.slot = slot;
        person.matched = slot < 4;

        // Recreate the markers at their final positions before
        // they are added to the scene.

        person.mob = commuter(
          dotPos(workplace, slot),
          person.color,
          person.pass
        );

        person.env = envelope(
          envPos(workplace, slot),
          person.color,
          person.score
        );
      });

      for (let i = 0; i < 2; i++) {
        b.pairFrames.push(
          pairFrame(workplace, i)
        );

        b.pairLabels.push(
          pairLabel(workplace, i)
        );
      }

      const unmatchedFrame = slotOutline(
        workplace,
        4,
        7,
        C.muted
      );

      const x1 = dotPos(workplace, 4)[0];
      const x2 = dotPos(workplace, 7)[0];

      const unmatchedLabel = txt(
        '4 UNMATCHED',
        P ? 17 : 14,
        C.muted,
        at(
          (x1 + x2) / 2,
          ROW_Y[workplace] - (P ? 0.79 : 0.73)
        ),
        true,
        3.20
      );

      b.unmatchedFrames.push(
        unmatchedFrame
      );

      b.unmatchedLabels.push(
        unmatchedLabel
      );
    });

    return b;
  }

  const finalBoard = makeFinalBoard();

  const finalTitle = txt(
    'PROPENSITY SCORES & MATCHING',
    P ? 20 : 19,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  await until(S(41));
  await play(
    ...fadeAll([
      tryTitle,
      ...boardObjects(tryBoard),
      newDataTag
    ]),
    new M.FadeIn(finalTitle),
    ...showBoard(finalBoard, true),

    ...finalBoard.pairFrames.map(
      r => new M.Create(r)
    ),

    ...finalBoard.pairLabels.map(
      t => new M.FadeIn(t)
    ),

    ...finalBoard.unmatchedFrames.map(
      r => new M.Create(r)
    ),

    ...finalBoard.unmatchedLabels.map(
      t => new M.FadeIn(t)
    ),

    ...fbox([
      ['PROPENSITY SCORE', C.green],
      'Estimated chance of receipt.',
      'Match people with close scores.',
      ['4 pairs • 8 matched people', C.green],
      ['Still check for shared causes.', C.amber]
    ], C.green),
    ...say('FIND PEOPLE WITH A SIMILAR CHANCE OF RECEIPT', C.green)
  );

  // Finish with the fixed chapter illustration:
  //
  // Central:
  //   Estimated score = 6/8 = 3/4.
  //   Every Central commuter has the same estimated score.
  //   2 matched pairs.
  //   4 unmatched pass holders.
  //
  // Hill:
  //   Estimated score = 2/8 = 1/4.
  //   Every Hill commuter has the same estimated score.
  //   2 matched pairs.
  //   4 unmatched nonholders.
  //
  // Total:
  //   4 pairs.
  //   8 matched commuters.
  //   8 unmatched commuters.
  //
  // The matched pass and no-pass groups each contain
  // 2 Central commuters and 2 Hill commuters.
  //
  // Similar propensity scores can help organize comparisons.
  // They do not establish that unrecorded shared causes
  // are balanced, and they do not by themselves prove causation.
}

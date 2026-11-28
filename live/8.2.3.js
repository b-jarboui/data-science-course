// lesson 8.2.3
// Colliders: filtering on a shared result can make its causes look linked.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the separate, fixed eight-person survey illustration.
// Past delays describe the period BEFORE passes arrived.
// Try it beats preview the separate mouse/touch interactive exercise.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ------------------------------------------------------------
  // Responsive layout
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;
  const PILL = P ? [0, 3.65, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, -4.25, 0] : [4.25, -0.30, 0];

  const CARD_W = P ? 1.72 : 1.38;
  const CARD_H = P ? 1.30 : 1.10;
  const SP = P ? 1.86 : 1.60;

  const ROW_Y = P ? [1.65, -0.55] : [0.52, -1.30];

  const SIGNED_Y = P ? [1.65, -0.10] : [0.50, -0.80];
  const OUTSIDE_Y = P ? -2.35 : -2.24;

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
  // Formula / result box
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.40 : 0.39;

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

    const r = rect(BOXP, wd, ht, color, 0.96, 2);

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
  // Fixed survey data
  //
  // 4 with a pass:
  //   2 with recurring past delays
  //   2 without recurring past delays
  //
  // 4 without a pass:
  //   2 with recurring past delays
  //   2 without recurring past delays
  //
  // Sign-up rule: pass OR past delays.
  //
  // This is NOT the 16-person Central/Hill snapshot.
  // ------------------------------------------------------------

  const DATA = [
    { id: 0, pass: true,  delays: true  },
    { id: 1, pass: true,  delays: true  },
    { id: 2, pass: true,  delays: false },
    { id: 3, pass: true,  delays: false },

    { id: 4, pass: false, delays: true  },
    { id: 5, pass: false, delays: true  },
    { id: 6, pass: false, delays: false },
    { id: 7, pass: false, delays: false }
  ].map(d => ({
    ...d,
    signed: d.pass || d.delays
  }));

  const delayColor = C.violet;
  const passColor = C.amber;

  // ------------------------------------------------------------
  // Commuter card helpers
  //
  // Amber ring: received a pass.
  // Violet label: recurring delays before passes arrived.
  //
  // Delay labels are separate objects so they can be revealed
  // on their own beat and moved with their respective cards.
  // ------------------------------------------------------------

  function commuterCard(d, p) {
    const [x, y] = p;

    const border = d.pass ? passColor : C.muted;
    const dotColor = d.pass ? C.cyan : C.ink;

    const r = rect(
      p,
      CARD_W,
      CARD_H,
      border,
      0.94,
      1.5
    );

    const dotY = y + (P ? 0.27 : 0.23);

    const halo = new M.Dot({
      point: at(x, dotY),
      radius: 0.235,
      color: dotColor
    });

    halo.setFill(dotColor, 0.16);

    const dot = new M.Dot({
      point: at(x, dotY),
      radius: 0.105,
      color: dotColor
    });

    dot.setFill(dotColor, 1);

    const parts = [r, halo, dot];

    if (d.pass) {
      const ring = new M.Circle({
        radius: 0.205,
        color: passColor,
        strokeWidth: 2.6
      });

      ring.setFill(passColor, 0);
      ring.moveTo(at(x, dotY));

      parts.push(ring);
    }

    const status = txt(
      d.pass ? 'PASS' : 'NO PASS',
      P ? 15 : 14,
      d.pass ? passColor : C.muted,
      at(x, y - 0.06),
      true,
      CARD_W - 0.18
    );

    parts.push(status);

    return new M.VGroup(...parts);
  }

  function delayMark(d, p) {
    const [x, y] = p;
    const color = d.delays ? delayColor : C.muted;

    const pos = at(
      x,
      y - (P ? 0.39 : 0.34)
    );

    const r = rect(
      pos,
      CARD_W - 0.14,
      P ? 0.38 : 0.30,
      color,
      d.delays ? 0.90 : 0.30,
      d.delays ? 1.5 : 1.0
    );

    if (d.delays) {
      r.setFill(delayColor, 0.17);
    }

    const t = txt(
      d.delays ? 'PAST DELAYS' : 'No delays',
      P ? 16 : 14,
      color,
      pos,
      d.delays,
      CARD_W - 0.26
    );

    return new M.VGroup(r, t);
  }

  function allPos(d) {
    const row = d.pass ? 0 : 1;
    const j = d.id % 4;

    return at(
      CX + (j - 1.5) * SP,
      ROW_Y[row]
    );
  }

  function signedPos(d) {
    // All four pass holders enter the first row.
    if (d.pass) {
      return at(
        CX + (d.id - 1.5) * SP,
        SIGNED_Y[0]
      );
    }

    // The two no-pass commuters with delays enter the second row.
    if (d.signed) {
      return at(
        CX + (d.id - 4.5) * SP,
        SIGNED_Y[1]
      );
    }

    // The two remaining commuters stay outside.
    return at(
      CX + 0.65 + (d.id - 6) * SP,
      OUTSIDE_Y
    );
  }

  function allLabels() {
    return [
      txt(
        'WITH A PASS',
        P ? 21 : 19,
        passColor,
        at(CX, ROW_Y[0] + (P ? 0.91 : 0.79)),
        true
      ),

      txt(
        'WITHOUT A PASS',
        P ? 21 : 19,
        C.ink,
        at(CX, ROW_Y[1] + (P ? 0.91 : 0.79)),
        true
      )
    ];
  }

  function makeSurvey() {
    const people = DATA.map(d => {
      const p = allPos(d);

      return {
        ...d,
        position: p,
        mob: commuterCard(d, p),
        mark: delayMark(d, p)
      };
    });

    return {
      people,
      labels: allLabels(),
      frame: null,
      signedLabel: null,
      outsideLabel: null,
      marksVisible: false
    };
  }

  function allSurveyObjects(v) {
    return [
      ...v.people.map(p => p.mob),

      ...(v.marksVisible
        ? v.people.map(p => p.mark)
        : []),

      ...v.labels,

      v.frame,
      v.signedLabel,
      v.outsideLabel
    ].filter(Boolean);
  }

  // Swap each card (and its delay tag) for a fresh one at the new place:
  // no text can stay behind at the old row.
  function moveCard(person, target, withMark = true) {
    person.position = target;
    const nm = commuterCard(person, target);
    const nk = delayMark(person, target);
    const a = [new M.FadeOut(person.mob, { runTime: 1.0 }), new M.FadeIn(nm, { runTime: 1.0 })];
    if (withMark) a.push(new M.FadeOut(person.mark, { runTime: 1.0 }), new M.FadeIn(nk, { runTime: 1.0 }));
    person.mob = nm;
    person.mark = nk;
    return a;
  }

  function surveyGroup(v, predicate) {
    return v.people.filter(predicate);
  }

  function groupOutline(group, color = C.green, extra = 0.10) {
    const xs = group.map(p => p.position[0]);
    const ys = group.map(p => p.position[1]);

    const left = Math.min(...xs) - CARD_W / 2 - extra;
    const right = Math.max(...xs) + CARD_W / 2 + extra;

    const bottom = Math.min(...ys) - CARD_H / 2 - extra;
    const top = Math.max(...ys) + CARD_H / 2 + extra;

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

  function indicatePeople(group, color = C.amber, duration = 1.0) {
    return lagIndicate(
      group.map(p => p.mob),
      color,
      duration
    );
  }

  function indicateDelays(group, duration = 0.9) {
    return lagIndicate(
      group.filter(p => p.delays).map(p => p.mark),
      delayColor,
      duration
    );
  }

  // ------------------------------------------------------------
  // Move the same eight commuters into the selected view.
  // Six enter the box; two remain visibly outside.
  // No pass receipt or delay status is changed.
  // ------------------------------------------------------------

  function signedFrame() {
    const top = P ? 2.74 : 1.43;
    const bottom = P ? -0.94 : -1.48;

    return rect(
      at(CX, (top + bottom) / 2),
      P ? 7.50 : 6.90,
      top - bottom,
      C.green,
      0,
      2.3
    );
  }

  function filterSurvey(v) {
    const a = [];

    a.push(...fadeAll(v.labels));
    v.labels = [];

    v.frame = signedFrame();

    v.signedLabel = txt(
      'SIGNED UP',
      P ? 20 : 18,
      C.green,
      at(CX, P ? 2.46 : 1.18),
      true
    );

    v.outsideLabel = txt(
      'NOT SIGNED UP',
      P ? 16 : 15,
      C.muted,
      at(CX - 1.80, OUTSIDE_Y),
      true,
      2.45
    );

    a.push(
      new M.Create(v.frame),
      new M.FadeIn(v.signedLabel),
      new M.FadeIn(v.outsideLabel)
    );

    const moves = v.people.flatMap(p =>
      moveCard(
        p,
        signedPos(p),
        v.marksVisible
      )
    );

    a.push(
      new M.LaggedStart(
        moves,
        { lagRatio: 0.015, runTime: 1.55 }
      )
    );

    return a;
  }

  function showCompleteSurvey(v) {
    v.marksVisible = true;

    return [
      ...v.labels.map(t => new M.FadeIn(t)),

      lagIn(
        v.people.flatMap(p => [p.mob, p.mark]),
        1.05,
        0.035
      )
    ];
  }

  // ------------------------------------------------------------
  // 0-1: the follow-up survey
  // ------------------------------------------------------------

  const clipboardPos = P ? at(0, 0.65) : at(CX, -0.20);

  function surveyIcon(p) {
    const [x, y] = p;

    const board = rect(
      p,
      2.25,
      2.60,
      C.cyan,
      0.96,
      2.2
    );

    const clip = rect(
      at(x, y + 1.24),
      0.92,
      0.35,
      C.cyan,
      0.96,
      2
    );

    const title = txt(
      'SURVEY',
      20,
      C.cyan,
      at(x, y + 0.76),
      true
    );

    const items = [];

    for (let i = 0; i < 3; i++) {
      const yy = y + 0.25 - i * 0.57;

      const box = new M.Rectangle({
        width: 0.25,
        height: 0.25,
        color: C.muted,
        strokeWidth: 1.5
      });

      box.setFill(C.card, 0.8);
      box.moveTo(at(x - 0.72, yy));

      const rule = line(
        at(x - 0.40, yy),
        at(x + 0.73, yy),
        C.muted,
        2
      );

      items.push(box, rule);
    }

    const check1 = line(
      at(x - 0.80, y + 0.25),
      at(x - 0.73, y + 0.17),
      C.green,
      3
    );

    const check2 = line(
      at(x - 0.73, y + 0.17),
      at(x - 0.59, y + 0.37),
      C.green,
      3
    );

    return new M.VGroup(
      board,
      clip,
      title,
      ...items,
      check1,
      check2
    );
  }

  const clipboard = surveyIcon(clipboardPos);

  const surveyCaption = txt(
    'A follow-up survey',
    P ? 23 : 22,
    C.ink,
    at(CX, clipboardPos[1] - 1.68)
  );

  await until(S(0));
  await play(
    new M.FadeIn(clipboard),
    new M.FadeIn(surveyCaption),
    ...say('THE CITY ASKS FOR VOLUNTEERS')
  );

  await until(S(1));
  await play(
    ...fbox([
      ['The question', C.violet],
      'Did pass holders have',
      'fewer delays BEFORE',
      'the pass arrived?'
    ], C.violet),
    ...say('WHAT ABOUT DELAYS BEFORE THE PASS?', C.violet)
  );

  // ------------------------------------------------------------
  // 2-8: all eight commuters, before any filtering
  // ------------------------------------------------------------

  let survey = makeSurvey();

  await until(S(2));
  await play(
    new M.FadeOut(clipboard),
    new M.FadeOut(surveyCaption),
    ...clearBox(),
    lagIn(
      survey.people.map(p => p.mob),
      1.15,
      0.09
    ),
    ...say('8 COMMUTERS IN THE SURVEY EXAMPLE')
  );

  await until(S(3));
  await play(
    ...survey.labels.map(t => new M.FadeIn(t)),
    ...say('ONE ROW WITH A PASS, ONE WITHOUT')
  );

  const firstFour = surveyGroup(survey, p => p.pass);
  const secondFour = surveyGroup(survey, p => !p.pass);

  await until(S(4));
  await play(
    indicatePeople(firstFour, passColor, 0.65),
    indicatePeople(secondFour, C.ink, 0.65),
    ...fbox([
      'With a pass: 4',
      'Without a pass: 4',
      ['Total: 8 people', C.green]
    ]),
    ...say('4 PEOPLE IN EACH ROW')
  );

  // 5: mark the delays that happened before the pass arrived.
  survey.marksVisible = true;

  await until(S(5));
  await play(
    lagIn(
      survey.people.map(p => p.mark),
      1.25,
      0.08
    ),
    ...fbox([
      ['PAST DELAYS', delayColor],
      'These delays happened',
      'before passes arrived.'
    ], delayColor),
    ...say('2 IN EACH ROW HAD PAST DELAYS', delayColor)
  );

  const allPassOutline = groupOutline(
    firstFour,
    C.green
  );

  const allNoOutline = groupOutline(
    secondFour,
    C.green
  );

  // 6: compare counts before filtering.
  await until(S(6));
  await play(
    new M.Create(allPassOutline),
    new M.Create(allNoOutline),
    indicateDelays(survey.people, 0.9),
    ...fbox([
      ['AMONG ALL COMMUTERS', C.green],
      'With a pass:    2/4',
      'Without a pass: 2/4'
    ], C.green),
    ...say('2 OUT OF 4 IN BOTH ROWS', C.green)
  );

  // 7: equal shares.
  await until(S(7));
  await play(
    ...fbox([
      ['AMONG ALL COMMUTERS', C.green],
      'With a pass:    2/4 = ½',
      'Without a pass: 2/4 = ½',
      ['50% in both rows', C.green]
    ], C.green),
    ...say('HALF IN BOTH ROWS', C.green)
  );

  // 8: in this illustration the two shares are identical.
  await until(S(8));
  await play(
    new M.FadeOut(allPassOutline),
    new M.FadeOut(allNoOutline),
    ...fbox([
      'Pass receipt tells us',
      'nothing about past delays',
      'in this little group.',
      ['50% = 50%', C.green]
    ], C.green),
    ...say('NO LINK IN THIS LITTLE GROUP', C.green)
  );

  // ------------------------------------------------------------
  // 9-14: select volunteers using the sign-up rule
  // ------------------------------------------------------------

  // 9: pass OR recurring past delays.
  await until(S(9));
  await play(
    indicatePeople(
      surveyGroup(survey, p => p.signed),
      C.green,
      1.3
    ),
    ...fbox([
      ['SIGN-UP RULE', C.green],
      'Has a pass',
      ['OR', C.amber],
      'Had recurring past delays',
      'Or both'
    ], C.green),
    ...say('VOLUNTEER IF YOU HAVE EITHER OR BOTH', C.green)
  );

  // 10: the volunteers enter the Signed up box.
  await until(S(10));
  await play(
    ...filterSurvey(survey),
    ...fbox([
      ['KEEP THE VOLUNTEERS', C.green],
      'Same eight commuters.',
      'Only the selection changes.'
    ], C.green),
    ...say('MOVE THE VOLUNTEERS INTO THE BOX', C.green)
  );

  const signedPass = surveyGroup(
    survey,
    p => p.pass && p.signed
  );

  const signedNo = surveyGroup(
    survey,
    p => !p.pass && p.signed
  );

  const outside = surveyGroup(
    survey,
    p => !p.signed
  );

  const signedPassOutline = groupOutline(
    signedPass,
    passColor,
    0.08
  );

  const signedNoOutline = groupOutline(
    signedNo,
    delayColor,
    0.08
  );

  const outsideOutline = groupOutline(
    outside,
    C.muted,
    0.07
  );

  // 11: all four pass holders qualify.
  await until(S(11));
  await play(
    new M.Create(signedPassOutline),
    indicatePeople(signedPass, passColor, 0.75),
    ...fbox([
      ['PASS HOLDERS', passColor],
      'All 4 qualify.',
      'They have a pass.'
    ], passColor),
    ...say('ALL 4 PASS HOLDERS ENTER', passColor)
  );

  // 12: only the two no-pass commuters with delays qualify.
  await until(S(12));
  await play(
    new M.FadeOut(signedPassOutline),
    new M.Create(signedNoOutline),
    indicateDelays(signedNo, 0.75),
    ...fbox([
      ['WITHOUT A PASS', delayColor],
      'Only 2 qualify.',
      'They had past delays.'
    ], delayColor),
    ...say('2 WITHOUT A PASS ENTER', delayColor)
  );

  // 13: the remaining two stay outside.
  await until(S(13));
  await play(
    new M.FadeOut(signedNoOutline),
    new M.Create(outsideOutline),
    indicatePeople(outside, C.muted, 0.75),
    ...fbox([
      ['STAY OUTSIDE', C.muted],
      'No pass.',
      'No recurring past delays.',
      '2 people do not sign up.'
    ], C.muted),
    ...say('NO PASS AND NO DELAYS: STAY OUTSIDE', C.muted)
  );

  // 14: total volunteers = 6.
  await until(S(14));
  await play(
    new M.FadeOut(outsideOutline),
    new M.Indicate(survey.signedLabel, { color: C.green }),
    ...fbox([
      '4 + 2',
      ['= 6 volunteers', C.green],
      '2 people stay outside.'
    ], C.green),
    ...say('6 PEOPLE SIGNED UP', C.green)
  );

  // ------------------------------------------------------------
  // 15-20: the shares among volunteers
  // ------------------------------------------------------------

  let activeOutline = groupOutline(
    signedPass,
    passColor,
    0.08
  );

  // 15: look only at the four pass holders in the box.
  await until(S(15));
  await play(
    new M.Create(activeOutline),
    indicatePeople(signedPass, passColor, 0.65),
    ...fbox([
      ['VOLUNTEERS WITH A PASS', passColor],
      '4 people in this group'
    ], passColor),
    ...say('LOOK AT THE 4 WITH A PASS', passColor)
  );

  // 16: two of those four had recurring delays.
  await until(S(16));
  await play(
    indicateDelays(signedPass, 0.60),
    ...fbox([
      ['WITH A PASS', passColor],
      '2 with delays ÷ 4 people',
      ['2/4 = ½ = 50%', C.green]
    ], C.green),
    ...say('2 OUT OF 4 HAD DELAYS', delayColor)
  );

  // 17: switch attention to the two without passes.
  const selectedNoOutline = groupOutline(
    signedNo,
    delayColor,
    0.08
  );

  await until(S(17));
  await play(
    new M.FadeOut(activeOutline),
    new M.Create(selectedNoOutline),
    indicatePeople(signedNo, delayColor, 0.65),
    ...fbox([
      ['VOLUNTEERS WITHOUT A PASS', delayColor],
      '2 people in this group'
    ], delayColor),
    ...say('LOOK AT THE 2 WITHOUT A PASS', delayColor)
  );

  activeOutline = selectedNoOutline;

  // 18: both had recurring delays.
  await until(S(18));
  await play(
    indicateDelays(signedNo, 0.55),
    ...fbox([
      ['WITHOUT A PASS', delayColor],
      '2 with delays ÷ 2 people',
      ['2/2 = 1 = 100%', delayColor]
    ], delayColor),
    ...say('2 OUT OF 2 HAD DELAYS', delayColor)
  );

  // 19: the apparent relationship after filtering.
  await until(S(19));
  await play(
    new M.FadeOut(activeOutline),
    ...fbox([
      ['AMONG VOLUNTEERS', C.green],
      'With a pass:    2/4 = 50%',
      'Without a pass: 2/2 = 100%',
      ['The shares now differ.', delayColor]
    ], delayColor),
    ...say('PAST DELAYS NOW LOOK MORE COMMON WITHOUT A PASS', delayColor)
  );

  // 20: no person's actual past delays changed.
  await until(S(20));
  await play(
    lagIndicate(
      survey.people.map(p => p.mark),
      delayColor,
      1.25
    ),
    ...fbox([
      ['NOTHING ABOUT THE PAST CHANGED', C.amber],
      'Before: 2/4 and 2/4',
      'After:  2/4 and 2/2',
      ['We only selected people.', C.green]
    ], C.amber),
    ...say('SAME PEOPLE, DIFFERENT SELECTION', C.amber)
  );

  // ------------------------------------------------------------
  // Diagram helpers
  //
  // Pass receipt → Sign-up ← Past delays
  //
  // Use coordinate-built arrows and outline boxes.
  // Never regroup objects that are already on screen.
  // ------------------------------------------------------------

  const CAUSE_W = P ? 2.75 : 2.80;
  const RESULT_W = P ? 3.15 : 3.20;
  const NODE_H = P ? 1.05 : 0.93;

  const PASS_P = P
    ? at(-1.98, 1.65)
    : at(CX - 2.03, 0.72);

  const DELAY_P = P
    ? at(1.98, 1.65)
    : at(CX + 2.03, 0.72);

  const SIGN_P = P
    ? at(0, -1.00)
    : at(CX, -1.45);

  function node(title, subtitle, p, w, color) {
    const r = rect(
      p,
      w,
      NODE_H,
      color,
      0.97,
      2
    );

    const a = txt(
      title,
      P ? 21 : 20,
      color,
      at(p[0], p[1] + 0.16),
      false,
      w - 0.24
    );

    const b = txt(
      subtitle,
      P ? 15 : 14,
      C.ink,
      at(p[0], p[1] - 0.20),
      false,
      w - 0.24
    );

    return new M.VGroup(r, a, b);
  }

  function arrow(start, end, color, stroke = 3.2) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const headL = 0.23;
    const headW = 0.12;

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

  function traceMarker(p, color = C.green) {
    const halo = new M.Dot({
      point: p,
      radius: 0.24,
      color
    });

    halo.setFill(color, 0.23);

    const dot = new M.Dot({
      point: p,
      radius: 0.095,
      color
    });

    dot.setFill(color, 1);

    return new M.VGroup(halo, dot);
  }

  const A1S = at(
    PASS_P[0] + CAUSE_W * 0.17,
    PASS_P[1] - NODE_H / 2 - 0.06
  );

  const A1E = at(
    SIGN_P[0] - RESULT_W * 0.23,
    SIGN_P[1] + NODE_H / 2 + 0.08
  );

  const A2S = at(
    DELAY_P[0] - CAUSE_W * 0.17,
    DELAY_P[1] - NODE_H / 2 - 0.06
  );

  const A2E = at(
    SIGN_P[0] + RESULT_W * 0.23,
    SIGN_P[1] + NODE_H / 2 + 0.08
  );

  function makeDiagram() {
    return {
      pass: node(
        'Pass receipt',
        'Got a pass or not',
        PASS_P,
        CAUSE_W,
        passColor
      ),

      delays: node(
        'Past delays',
        'Before passes arrived',
        DELAY_P,
        CAUSE_W,
        delayColor
      ),

      signup: node(
        'Sign-up',
        'Volunteered or not',
        SIGN_P,
        RESULT_W,
        C.green
      ),

      aPass: arrow(
        A1S,
        A1E,
        passColor
      ),

      aDelay: arrow(
        A2S,
        A2E,
        delayColor
      )
    };
  }

  function diagramObjects(g) {
    return [
      g.pass,
      g.delays,
      g.signup,
      g.aPass,
      g.aDelay
    ];
  }

  function conditionFrame(color = C.green) {
    return rect(
      SIGN_P,
      RESULT_W + 0.24,
      NODE_H + 0.24,
      color,
      0,
      2.8
    );
  }

  function cross(p, color = C.amber) {
    const [x, y] = p;
    const r = 0.16;

    return new M.VGroup(
      line(
        at(x - r, y - r),
        at(x + r, y + r),
        color,
        5
      ),

      line(
        at(x - r, y + r),
        at(x + r, y - r),
        color,
        5
      )
    );
  }

  // ------------------------------------------------------------
  // 21-22: the sign-up box is like a door with two ways in
  // ------------------------------------------------------------

  let graph = makeDiagram();

  const doorLabel = pill(
    'TWO WAYS IN',
    C.green,
    P ? 18 : 17
  );

  doorLabel.moveTo(
    at(CX, P ? 2.74 : 1.43)
  );

  const entrance1 = new M.DashedLine({
    start: A1S,
    end: A1E,
    color: passColor,
    strokeWidth: 3
  });

  const entrance2 = new M.DashedLine({
    start: A2S,
    end: A2E,
    color: delayColor,
    strokeWidth: 3
  });

  const orTag = pill('OR', C.amber, 18);

  orTag.moveTo(
    at(
      CX,
      (PASS_P[1] + SIGN_P[1]) / 2
    )
  );

  // 21: two ways to qualify for the survey.
  await until(S(21));
  await play(
    ...fadeAll(allSurveyObjects(survey)),
    lagIn(
      [graph.pass, graph.delays, graph.signup],
      0.75,
      0.10
    ),
    new M.Create(entrance1),
    new M.Create(entrance2),
    new M.FadeIn(doorLabel),
    new M.FadeIn(orTag),
    ...fbox([
      'Enter through the pass door',
      ['OR', C.amber],
      'through the past-delays door.'
    ], C.green),
    ...say('SIGN-UP HAS TWO WAYS IN', C.green)
  );

  // 22: a volunteer without a pass must have qualified via delays.
  const closedEntrance = cross(
    at(
      (A1S[0] + A1E[0]) / 2,
      (A1S[1] + A1E[1]) / 2
    ),
    C.amber
  );

  const delayTraveler = traceMarker(
    A2S,
    delayColor
  );

  await until(S(22));
  await play(
    new M.FadeIn(closedEntrance),
    new M.Indicate(graph.delays, { color: delayColor }),
    new M.FadeIn(delayTraveler),
    ...fbox([
      'If a volunteer has NO pass,',
      'they must have qualified',
      'through past delays.'
    ], delayColor),
    ...say('NO PASS? THE OTHER DOOR EXPLAINS SIGN-UP', delayColor)
  );

  await play(
    new M.Transform(
      delayTraveler,
      traceMarker(A2E, delayColor),
      { runTime: 1.35 }
    )
  );

  // ------------------------------------------------------------
  // 23-27: draw the collider
  // ------------------------------------------------------------

  // 23: replace the door analogy with causal arrows.
  await until(S(23));
  await play(
    ...fadeAll([
      entrance1,
      entrance2,
      orTag,
      closedEntrance,
      delayTraveler,
      doorLabel
    ]),
    ...clearBox(),
    ...say('DRAW THE CAUSAL DIAGRAM')
  );

  // 24: pass receipt → sign-up.
  await until(S(24));
  await play(
    new M.FadeIn(graph.aPass),
    ...fbox([
      ['Pass receipt → Sign-up', passColor],
      'Having a pass makes',
      'someone qualify.'
    ], passColor),
    ...say('PASS RECEIPT → SIGN-UP', passColor)
  );

  // 25: past delays → sign-up.
  await until(S(25));
  await play(
    new M.FadeIn(graph.aDelay),
    ...fbox([
      ['Past delays → Sign-up', delayColor],
      'Past delays also make',
      'someone qualify.'
    ], delayColor),
    ...say('PAST DELAYS → SIGN-UP', delayColor)
  );

  const colliderOutline = conditionFrame(C.green);

  const colliderTag = pill(
    'COLLIDER',
    C.green,
    18
  );

  colliderTag.moveTo(
    at(
      CX,
      SIGN_P[1] - NODE_H / 2 - (P ? 0.50 : 0.37)
    )
  );

  // 26: the two arrows meet at sign-up.
  await until(S(26));
  await play(
    new M.Create(colliderOutline),
    new M.FadeIn(colliderTag),
    new M.Indicate(graph.aPass, { color: passColor }),
    new M.Indicate(graph.aDelay, { color: delayColor }),
    ...fbox([
      ['COLLIDER', C.green],
      'Pass → Sign-up ← Delays',
      'Two arrowheads meet',
      'at the same result.'
    ], C.green),
    ...say('SIGN-UP IS A COLLIDER', C.green)
  );

  // 27: define a collider.
  await until(S(27));
  await play(
    new M.Indicate(graph.signup, { color: C.green }),
    ...fbox([
      ['COLLIDER', C.green],
      'Something that two causes',
      'both point into.'
    ], C.green),
    ...say('TWO CAUSES POINT INTO ONE RESULT', C.green)
  );

  // ------------------------------------------------------------
  // 28-29: the collider blocks this path before conditioning
  // ------------------------------------------------------------

  // Put the blocked-path badge between the arrows, not on the
  // causal arrows themselves. The causal diagram stays intact.

  const blockedP = at(
    CX,
    (PASS_P[1] + SIGN_P[1]) / 2 + 0.10
  );

  const blockedTag = pill(
    'PATH CLOSED',
    C.amber,
    P ? 18 : 16
  );

  blockedTag.moveTo(blockedP);

  // 28: left alone, the path through the collider is blocked.
  await until(S(28));
  await play(
    new M.FadeIn(blockedTag),
    ...fbox([
      ['WITHOUT FILTERING', C.amber],
      'Pass → Sign-up ← Delays',
      'The path through sign-up',
      'is blocked.'
    ], C.amber),
    ...say('THE COLLIDER BLOCKS THIS PATH', C.amber)
  );

  // 29: in this particular example, the unfiltered shares match.
  await until(S(29));
  await play(
    ...fbox([
      ['AMONG ALL 8 COMMUTERS', C.green],
      'With pass:    2/4 = 50%',
      'Without pass: 2/4 = 50%',
      ['Equal shares in this example', C.green]
    ], C.green),
    ...say('BEFORE FILTERING: 50% AND 50%', C.green)
  );

  // ------------------------------------------------------------
  // 30-31: conditioning on sign-up
  // ------------------------------------------------------------

  const selectedFrame = conditionFrame(C.amber);

  const conditionTag = pill(
    'KEEP SIGNED UP ONLY',
    C.amber,
    P ? 18 : 16
  );

  conditionTag.moveTo(
    at(CX, P ? 2.75 : 1.42)
  );

  // 30: keeping only people with the same sign-up status.
  await until(S(30));
  await play(
    new M.FadeOut(blockedTag),
    new M.FadeOut(colliderOutline),
    new M.Create(selectedFrame),
    new M.FadeIn(conditionTag),
    ...fbox([
      ['CONDITIONING', C.amber],
      'Keep only people with',
      'the same sign-up status.'
    ], C.amber),
    ...say('CONDITIONING ON SIGN-UP', C.amber)
  );

  // 31: our filter keeps the six who volunteered.
  await until(S(31));
  await play(
    new M.Indicate(conditionTag, { color: C.amber }),
    ...fbox([
      ['FILTER: SIGNED UP ONLY', C.amber],
      'Keep 6 volunteers.',
      'Leave 2 people outside.'
    ], C.amber),
    ...say('HERE WE KEEP ONLY THE VOLUNTEERS', C.amber)
  );

  // ------------------------------------------------------------
  // 32-33: compare the unfiltered and filtered pictures again
  // ------------------------------------------------------------

  let recap = makeSurvey();

  // 32: before filtering, half of each group had delays.
  await until(S(32));
  await play(
    ...fadeAll([
      ...diagramObjects(graph),
      colliderTag,
      selectedFrame,
      conditionTag
    ]),
    ...showCompleteSurvey(recap),
    ...fbox([
      ['ALL COMMUTERS', C.green],
      'With pass:    2/4 = 50%',
      'Without pass: 2/4 = 50%'
    ], C.green),
    ...say('EVERYONE: HALF IN EACH ROW', C.green)
  );

  // 33: filtering changes the denominator of the no-pass row.
  await until(S(33));
  await play(
    ...filterSurvey(recap),
    ...fbox([
      ['VOLUNTEERS ONLY', C.amber],
      'With pass:    2/4 = 50%',
      'Without pass: 2/2 = 100%',
      ['Same past delays.', delayColor]
    ], C.amber),
    ...say('VOLUNTEERS: HALF IN ONE ROW, ALL IN THE OTHER', delayColor)
  );

  // ------------------------------------------------------------
  // 34: conditioning opens the path through the collider
  // ------------------------------------------------------------

  graph = makeDiagram();

  const openFrame = conditionFrame(C.amber);

  const openTag = pill(
    'PATH OPEN',
    C.green,
    P ? 19 : 17
  );

  openTag.moveTo(
    at(
      CX,
      SIGN_P[1] - NODE_H / 2 - (P ? 0.50 : 0.37)
    )
  );

  const openFilterTag = pill(
    'FILTER: SIGNED UP',
    C.amber,
    P ? 17 : 16
  );

  openFilterTag.moveTo(
    at(CX, P ? 2.75 : 1.42)
  );

  // Dashed link describes an apparent association after selection.
  // It deliberately has no arrowhead: it is not a causal claim.

  const associationY = PASS_P[1];

  const assocStart = at(
    PASS_P[0] + CAUSE_W / 2 + 0.08,
    associationY
  );

  const assocEnd = at(
    DELAY_P[0] - CAUSE_W / 2 - 0.08,
    associationY
  );

  const association = new M.DashedLine({
    start: assocStart,
    end: assocEnd,
    color: C.green,
    strokeWidth: 3.2
  });

  const assocLabel = txt(
    'Linked after filtering',
    P ? 16 : 15,
    C.green,
    at(CX, P ? 0.70 : 0.00),
    false,
    2.35
  );

  await until(S(34));
  await play(
    ...fadeAll(allSurveyObjects(recap)),
    lagIn(diagramObjects(graph), 0.8, 0.08),
    new M.Create(openFrame),
    new M.FadeIn(openTag),
    new M.FadeIn(openFilterTag),
    new M.Create(association),
    new M.FadeIn(assocLabel),
    ...fbox([
      ['OPENING THE PATH', C.green],
      'Filtering on sign-up',
      'makes its causes',
      'look linked.'
    ], C.green),
    ...say('FILTERING OPENS THE COLLIDER PATH', C.green)
  );

  // ------------------------------------------------------------
  // 35: the share formula
  // Show the numerator and denominator changing independently.
  // ------------------------------------------------------------

  function shareDots(count, delayed, p, label) {
    const [x, y] = p;

    const pitch = P ? 0.58 : 0.55;

    const parts = [];

    const title = txt(
      label,
      P ? 17 : 16,
      C.ink,
      at(x, y + 0.52),
      true,
      3.0
    );

    parts.push(title);

    for (let j = 0; j < count; j++) {
      const px = x + (j - (count - 1) / 2) * pitch;
      const color = j < delayed ? delayColor : C.muted;

      const halo = new M.Dot({
        point: at(px, y),
        radius: 0.23,
        color
      });

      halo.setFill(color, j < delayed ? 0.19 : 0.07);

      const dot = new M.Dot({
        point: at(px, y),
        radius: 0.115,
        color
      });

      dot.setFill(color, j < delayed ? 1 : 0.55);

      parts.push(halo, dot);
    }

    const result = txt(
      `${delayed}/${count}`,
      P ? 23 : 21,
      C.green,
      at(x, y - 0.48),
      true
    );

    parts.push(result);

    return new M.VGroup(...parts);
  }

  const formulaPass = shareDots(
    4,
    2,
    at(CX, P ? 1.65 : 0.55),
    'With a pass'
  );

  const formulaNo = shareDots(
    2,
    2,
    at(CX, P ? -0.65 : -1.35),
    'Without a pass'
  );

  const formulaTitle = txt(
    'VOLUNTEERS ONLY',
    P ? 20 : 18,
    C.green,
    at(CX, P ? 2.65 : 1.42),
    true
  );

  await until(S(35));
  await play(
    ...fadeAll([
      ...diagramObjects(graph),
      openFrame,
      openTag,
      openFilterTag,
      association,
      assocLabel
    ]),
    new M.FadeIn(formulaTitle),
    lagIn([formulaPass, formulaNo], 0.8, 0.14),
    ...fbox([
      ['Share with delays', delayColor],
      '= count with delays',
      '  ÷ count in the group',
      ['2/4 = 50%  •  2/2 = 100%', C.green]
    ], C.green),
    ...say('SHARE = COUNT WITH DELAYS ÷ GROUP COUNT', C.green)
  );

  // ------------------------------------------------------------
  // 36-37: when to look for colliders
  // ------------------------------------------------------------

  graph = makeDiagram();

  const warningFrame = conditionFrame(C.amber);

  await until(S(36));
  await play(
    ...fadeAll([
      formulaTitle,
      formulaPass,
      formulaNo
    ]),
    lagIn(diagramObjects(graph), 0.85, 0.10),
    new M.Create(warningFrame),
    ...fbox([
      ['LOOK FOR SHARED RESULTS', C.amber],
      'Who volunteered?',
      'Who was selected?',
      'Who is missing?'
    ], C.amber),
    ...say('COULD A FILTER CREATE THE LINK?', C.amber)
  );

  await until(S(37));
  await play(
    new M.Indicate(graph.signup, { color: C.amber }),
    ...fbox([
      ['COMMON TRAP', C.amber],
      'Volunteers: 50% vs 100%',
      'Everyone:   50% vs 50%',
      ['These are different groups.', C.amber]
    ], C.amber),
    ...say('THE VOLUNTEERS MAY NOT REPRESENT EVERYONE', C.amber)
  );

  // ------------------------------------------------------------
  // 38-41: preview Try it
  //
  // Actual mouse/touch interaction belongs to the separate
  // interactive component. This scene demonstrates the filter
  // using the exact fixed survey data.
  // ------------------------------------------------------------

  let trySurvey = makeSurvey();

  function filterTag(filtered) {
    const tag = pill(
      filtered ? 'FILTER: ON' : 'FILTER: OFF',
      filtered ? C.amber : C.green,
      P ? 18 : 17
    );

    tag.moveTo(
      P
        ? at(CX, -3.12)
        : at(4.25, 1.19)
    );

    return tag;
  }

  let tryFilter = filterTag(false);

  // 38: begin with the filter off.
  await until(S(38));
  await play(
    ...fadeAll([
      ...diagramObjects(graph),
      warningFrame
    ]),
    ...showCompleteSurvey(trySurvey),
    new M.FadeIn(tryFilter),
    ...fbox([
      ['ALL 8 COMMUTERS', C.green],
      'With pass:    2/4 = 50%',
      'Without pass: 2/4 = 50%',
      'Toggle the sign-up filter.'
    ], C.green),
    ...say('TRY IT: TAP THE SIGN-UP FILTER', C.green)
  );

  const tryPassFrame = groupOutline(
    surveyGroup(trySurvey, p => p.pass),
    C.green
  );

  const tryNoFrame = groupOutline(
    surveyGroup(trySurvey, p => !p.pass),
    C.green
  );

  // 39: challenge — find the equal shares.
  await until(S(39));
  await play(
    new M.Create(tryPassFrame),
    new M.Create(tryNoFrame),
    ...fbox([
      ['CHALLENGE 1', C.green],
      'Show equal delay shares.',
      '2/4 = 2/4',
      ['Answer: filter OFF', C.green]
    ], C.green),
    ...say('FIND THE TWO EQUAL SHARES', C.green)
  );

  // 40: keep volunteers and find the row where all had delays.
  const tryFilterOn = filterTag(true);

  await until(S(40));
  await play(
    new M.FadeOut(tryPassFrame),
    new M.FadeOut(tryNoFrame),
    new M.FadeOut(tryFilter),
    new M.FadeIn(tryFilterOn),
    ...filterSurvey(trySurvey),
    ...fbox([
      ['CHALLENGE 2', C.amber],
      'Keep only volunteers.',
      'With pass:    2/4 = 50%',
      'Without pass: 2/2 = 100%',
      ['No-pass row: everyone', delayColor]
    ], C.amber),
    ...say('FILTER ON: WHICH ROW IS 100%?', C.amber)
  );

  tryFilter = tryFilterOn;

  const everyoneOutline = groupOutline(
    surveyGroup(
      trySurvey,
      p => !p.pass && p.signed
    ),
    delayColor,
    0.09
  );

  await play(
    new M.Create(
      everyoneOutline,
      { runTime: 0.5 }
    ),
    indicateDelays(
      surveyGroup(
        trySurvey,
        p => !p.pass && p.signed
      ),
      0.7
    )
  );

  // 41: invite fresh data in the interactive exercise.
  // Preserve the fixed eight-person survey illustration here.

  const newData = pill(
    'NEW DATA',
    C.green,
    P ? 18 : 17
  );

  newData.moveTo(
    P
      ? at(CX, -3.12)
      : at(4.25, 1.19)
  );

  await until(S(41));
  await play(
    new M.FadeOut(everyoneOutline),
    new M.FadeOut(tryFilter),
    new M.FadeIn(newData),
    ...fbox([
      ['TRY FRESH COMMUTER CARDS', C.green],
      'Keep the same sign-up rule.',
      'Compare before filtering.',
      'Then compare after filtering.'
    ], C.green),
    ...say('NEW DATA: TRY THE SAME DOOR AGAIN', C.green)
  );

  // ------------------------------------------------------------
  // 42: final takeaway
  // ------------------------------------------------------------

  const finalGraph = makeDiagram();

  const finalFrame = conditionFrame(C.amber);

  const finalTag = pill(
    'CONDITION ON THE COLLIDER',
    C.amber,
    P ? 17 : 16
  );

  finalTag.moveTo(
    at(CX, P ? 2.75 : 1.42)
  );

  const finalAssociation = new M.DashedLine({
    start: assocStart,
    end: assocEnd,
    color: C.green,
    strokeWidth: 3.2
  });

  const finalLabel = txt(
    'Apparent link',
    P ? 18 : 17,
    C.green,
    at(CX, P ? 0.70 : 0.00),
    false,
    2.20
  );

  const finalCollider = pill(
    'COLLIDER',
    C.green,
    18
  );

  finalCollider.moveTo(
    at(
      CX,
      SIGN_P[1] - NODE_H / 2 - (P ? 0.50 : 0.37)
    )
  );

  await until(S(42));
  await play(
    ...fadeAll([
      ...allSurveyObjects(trySurvey),
      newData
    ]),
    lagIn(
      diagramObjects(finalGraph),
      0.8,
      0.07
    ),
    new M.Create(finalFrame),
    new M.Create(finalAssociation),
    new M.FadeIn(finalTag),
    new M.FadeIn(finalLabel),
    new M.FadeIn(finalCollider),
    ...fbox([
      ['COLLIDERS', C.green],
      'Filtering on a shared result',
      'can make its causes',
      'look linked.',
      ['Check whom you selected.', C.amber]
    ], C.green),
    ...say('FILTERING ON A SHARED RESULT CAN LINK ITS CAUSES', C.green)
  );

  // Finish with the fixed causal diagram:
  //
  // Pass receipt → Sign-up ← Past delays
  //
  // Before filtering:
  // With pass:    2/4 = 50%
  // Without pass: 2/4 = 50%
  //
  // Among volunteers:
  // With pass:    2/4 = 50%
  // Without pass: 2/2 = 100%
  //
  // The apparent association is created by selection.
  // Nobody's past delays or pass receipt changed.
}

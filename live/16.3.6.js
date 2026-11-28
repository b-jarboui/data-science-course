// 16.3.6 Delayed labels. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const RED = '#f87171';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.4, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.25, 0] : [4.35, -0.35, 0];
  const BW = P ? FW - 1.0 : 4.5, BH = P ? 1.85 : 2.4, LH = P ? 0.42 : 0.5;
  const CW = P ? 3.5 : 1.62, CH = P ? 0.98 : 1.6;
  const pos = k => P
    ? [k % 2 ? 1.85 : -1.85, 1.4 - Math.floor(k / 2) * 1.15]
    : [CX + (k % 4 - 1.5) * 1.78, k < 4 ? 0.55 : -1.25];
  const O = P
    ? { name: [-1.15, 0.27], ns: 19, nw: 1.1, route: [-1.15, -0.02], rs: 14, bub: [-1.15, -0.31], bw: 0.66, bh: 0.26, bs: 14,
        pred: [0.2, 0.2], act: [0.2, -0.2], ps: 18, pw: 1.9, mark: [1.42, 0], ms: 30 }
    : { name: [0, 0.55], ns: 20, nw: 1.45, route: [0, 0.26], rs: 15, bub: [-0.38, -0.07], bw: 0.7, bh: 0.34, bs: 16,
        pred: [0, -0.4], act: [0, -0.65], ps: 17, pw: 1.5, mark: [0.42, -0.07], ms: 30 };

  const parcels = [
    { name: 'Nell', route: 'North', score: 40, late: true },
    { name: 'Oak', route: 'North', score: 20, late: false },
    { name: 'Pine', route: 'North', score: 20, late: false },
    { name: 'Reed', route: 'North', score: 20, late: false },
    { name: 'Sage', route: 'South', score: 60, late: true },
    { name: 'Teal', route: 'South', score: 60, late: true },
    { name: 'Vale', route: 'South', score: 40, late: true },
    { name: 'Wren', route: 'South', score: 20, late: false }
  ];
  parcels.forEach(p => { p.predLate = p.score >= 50; p.correct = p.predLate === p.late; });

  const enter = obj => new M.FadeIn(obj, { runTime: 0.34 });
  const leave = obj => new M.FadeOut(obj, { runTime: 0.24 });
  const emphasis = (obj, color = C.amber) => new M.Indicate(obj, { color, runTime: 0.5 });

  function label(text, x, y, width, color = C.ink, size = 21, mono = false, bold = false) {
    const t = T(text, size, color, mono, bold);
    if (t.getWidth() > width) t.scale(width / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }
  function rect(x, y, width, height, color, fill, strokeWidth = 2) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.13, color, strokeWidth });
    if (fill) r.setFill(fill, 0.95);
    r.moveTo([x, y, 0]);
    return r;
  }

  let pillNow = null;
  function say(text, color = C.cyan) {
    const next = pill(text, color, P ? 18 : 19);
    const maxWidth = P ? FW - 0.6 : 7.4;
    if (next.getWidth() > maxWidth) next.scale(maxWidth / next.getWidth());
    next.moveTo(PILL);
    const anims = pillNow ? [leave(pillNow)] : [];
    pillNow = next;
    return [...anims, enter(next)];
  }

  // parcel cards
  const slotOf = parcels.map((_, i) => i);
  function parts(i) {
    const [x, y] = pos(slotOf[i]), p = parcels[i];
    const at = o => [x + o[0], y + o[1]];
    const bc = p.predLate ? C.amber : C.cyan;
    const [bx0, by0] = at(O.bub);
    return {
      frame: rect(x, y, CW, CH, C.line, C.card, 1.5),
      name: label(p.name, ...at(O.name), O.nw, C.ink, O.ns, false, true),
      route: label(p.route, ...at(O.route), O.nw, p.route === 'North' ? C.cyan : C.pink, O.rs),
      bubble: new M.VGroup(rect(bx0, by0, O.bw, O.bh, bc, C.bg, 1.5), label(`${p.score}%`, bx0, by0, O.bw - 0.1, bc, O.bs, true, true)),
      pred: label(p.predLate ? 'Model: LATE' : 'Model: ON TIME', ...at(O.pred), O.pw, p.predLate ? C.amber : C.cyan, O.ps),
      act: label(p.late ? 'Real: LATE' : 'Real: ON TIME', ...at(O.act), O.pw, p.late ? C.pink : C.green, O.ps, false, true)
    };
  }
  let cards = parcels.map((_, i) => parts(i));
  const marks = parcels.map(() => null);
  const markKind = parcels.map(() => null);
  function makeMark(i, kind) {
    const [x, y] = pos(slotOf[i]);
    const s = kind === 'ok' ? ['✓', C.green] : kind === 'bad' ? ['✗', RED] : ['?', C.amber];
    return label(s[0], x + O.mark[0], y + O.mark[1], 0.5, s[1], O.ms, false, true);
  }
  function setMark(ids, kind) {
    const a = [];
    for (const i of ids) {
      if (marks[i]) a.push(leave(marks[i]));
      marks[i] = makeMark(i, kind); markKind[i] = kind;
      a.push(enter(marks[i]));
    }
    return a;
  }

  let focusNow = [];
  function focus(ids, color = C.amber) {
    const a = focusNow.map(leave);
    focusNow = ids.map(i => { const [x, y] = pos(slotOf[i]); return rect(x, y, CW + 0.14, CH + 0.14, color, null, 2.5); });
    focusNow.forEach(r => a.push(new M.Create(r, { runTime: 0.3 })));
    return a;
  }

  // side box (laptop right, phone bottom)
  const [bx, by] = BOXP;
  const panel = rect(bx, by, BW, BH, C.cyan, C.card);
  const slots = Array(4).fill(null);
  let panelVisible = false;
  const lineY = i => by + (1.5 - i) * LH;
  function box(edits) {
    const a = [];
    if (!panelVisible) { a.push(enter(panel)); panelVisible = true; }
    for (const [i, text, color = C.ink] of edits) {
      if (slots[i]) a.push(leave(slots[i]));
      slots[i] = text ? label(text, bx, lineY(i), BW - 0.4, color, i === 0 ? (P ? 19 : 21) : (P ? 17 : 19), false, i === 0) : null;
      if (slots[i]) a.push(enter(slots[i]));
    }
    return a;
  }

  const others = [0, 1, 2, 3, 6, 7];
  const tueIds = [1, 2, 3, 4, 5, 6];

  await until(S(0));
  await play(...say('DOES THE MODEL PREDICT LATE PARCELS?', C.amber),
    ...box([[0, 'Model check', C.cyan], [1, 'Late deliveries']]),
    new M.LaggedStart(cards.map(c => enter(c.frame)), { lagRatio: 0.12, runTime: 1.0 }));
  await until(S(1));
  await play(...say('MONDAY: 8 PARCELS LEAVE'), ...box([[0, 'Monday', C.cyan], [1, '8 parcels leave the depot']]),
    ...cards.map(c => emphasis(c.frame, C.cyan)));
  await until(S(2));
  await play(...say('TUESDAY: WERE THE PREDICTIONS RIGHT?', C.amber),
    ...box([[2, 'Tuesday morning', C.amber], [3, 'Check the predictions']]));
  await until(S(3)); await play(...say('SOME RESULTS STILL UNKNOWN?', C.pink));

  await until(S(4));
  await play(...say('MONDAY’S 8 PARCEL CARDS'), ...cards.map(c => emphasis(c.frame, C.cyan)));
  await until(S(5));
  await play(...say('NORTH: 4 PARCELS · SOUTH: 4 PARCELS'),
    new M.LaggedStart(cards.flatMap(c => [enter(c.name), enter(c.route)]), { lagRatio: 0.12, runTime: 3.2 }));
  await until(S(6));
  await play(...say('SCORE = CHANCE OF LATE DELIVERY'),
    ...box([[0, 'Score', C.cyan], [1, 'Chance of late delivery'], [2, ''], [3, '']]),
    new M.LaggedStart(cards.map(c => enter(c.bubble)), { lagRatio: 0.12, runTime: 1.2 }));
  await until(S(7));
  await play(...say('THE RULE FOR THIS CHECK', C.amber),
    ...box([[0, 'The rule', C.amber], [1, '50% or higher → LATE', C.amber]]));
  await until(S(8)); await play(...box([[2, 'Below 50% → ON TIME', C.cyan]]));

  await until(S(9));
  await play(...focus([4, 5]), ...say('SAGE 60% · TEAL 60%', C.amber), emphasis(cards[4].bubble), emphasis(cards[5].bubble));
  await until(S(10)); await play(enter(cards[4].pred), enter(cards[5].pred), ...say('PREDICTS LATE', C.amber));
  await until(S(11)); await play(...focus(others, C.cyan), ...say('6 PARCELS BELOW 50%'));
  await until(S(12));
  await play(...say('PREDICTS ON TIME'), new M.LaggedStart(others.map(i => enter(cards[i].pred)), { lagRatio: 0.15, runTime: 1.2 }));

  await until(S(13));
  await play(...focus([]), ...say('TUESDAY MORNING: OPEN THE RECORDS', C.amber),
    ...box([[0, 'Tuesday morning', C.amber], [1, 'Delivery records'], [2, ''], [3, '']]));
  const tueSay = ['OAK: ON TIME', 'PINE: ON TIME', 'REED: ON TIME', 'SAGE: LATE', 'TEAL: LATE', 'VALE: LATE, BUT PREDICTED ON TIME'];
  for (let j = 0; j < 6; j++) {
    const i = tueIds[j], p = parcels[i];
    await until(S(14 + j));
    await play(...focus([i], p.correct ? (p.late ? C.pink : C.green) : RED), enter(cards[i].act),
      ...say(tueSay[j], p.correct ? (p.late ? C.pink : C.green) : RED));
  }
  await until(S(20));
  await play(...focus([]), ...say('GREEN TICK = CORRECT PREDICTION', C.green), ...setMark([1, 2, 3, 4, 5], 'ok'));
  await until(S(21)); await play(...say('RED CROSS = WRONG PREDICTION', RED), ...setMark([6], 'bad'));
  await until(S(22)); await play(...focus([0, 7]), ...say('NELL AND WREN: NO RESULT YET', C.amber));
  await until(S(23)); await play(...say('? = NOT KNOWN YET', C.amber), ...setMark([0, 7], 'q'));

  await until(S(24));
  await play(...focus([]), ...say('LABEL = THE ACTUAL RESULT'),
    ...box([[0, 'Label', C.cyan], [1, 'The actual result'], [2, 'we compare with a prediction'], [3, '']]));
  await until(S(25));
  await play(...say('DELAYED LABEL = IT ARRIVES LATER', C.amber), ...box([[3, 'Comes later → delayed label', C.amber]]));
  await until(S(26));
  await play(...say('LIKE A TEACHER CHECKING WORK', C.violet),
    ...box([[0, 'A teacher', C.violet], [1, 'checks answers'], [2, 'before all work comes back'], [3, '']]));
  await until(S(27)); await play(...box([[3, 'Missing work: cannot check yet', C.pink]]));

  await until(S(28));
  await play(...focus(tueIds, C.cyan), ...say('6 PREDICTIONS CHECKED'),
    ...box([[0, 'Tuesday morning', C.amber], [1, 'Checked: 6 of 8'], [2, ''], [3, '']]));
  await until(S(29));
  await play(...say('5 OF 6 CORRECT', C.green), ...box([[2, 'Correct: 5 of 6', C.green]]),
    ...[1, 2, 3, 4, 5].map(i => emphasis(marks[i], C.green)));
  await until(S(30));
  await play(...focus([0, 7]), ...say('ALL 8 PARCELS? NOT YET', C.pink), ...box([[3, 'All 8 parcels? Not yet', C.pink]]));
  await until(S(31));
  await play(...focus([]), ...say('ALL RESULTS BY WEDNESDAY MORNING'),
    ...box([[0, 'Reporting schedule', C.cyan], [1, 'All Monday results'], [2, 'by Wednesday morning'], [3, '']]));
  await until(S(32));
  await play(...say('WEDNESDAY MORNING', C.green), ...box([[0, 'Wednesday morning', C.green], [1, 'New results'], [2, '']]));

  await until(S(33)); await play(...focus([0], C.pink), enter(cards[0].act), ...say('NELL: LATE', C.pink));
  await until(S(34)); await play(emphasis(cards[0].pred, RED), ...say('PREDICTED ON TIME → INCORRECT', RED));
  await until(S(35)); await play(...focus([7], C.green), enter(cards[7].act), ...say('WREN: ON TIME', C.green));
  await until(S(36)); await play(emphasis(cards[7].pred, C.green), ...say('PREDICTED ON TIME → CORRECT', C.green));
  await until(S(37)); await play(...focus([0], RED), ...setMark([0], 'bad'), ...say('NELL: ? BECOMES ✗', RED));
  await until(S(38)); await play(...focus([7], C.green), ...setMark([7], 'ok'), ...say('WREN: ? BECOMES ✓', C.green));

  await until(S(39));
  await play(...focus([]), ...say('ONE MORE CORRECT', C.green),
    ...box([[1, 'Tuesday: 5 correct'], [2, 'Wednesday: 1 more', C.green]]));
  await until(S(40)); await play(...say('5 + 1 = 6 CORRECT', C.green), ...box([[3, '5 + 1 = 6 correct', C.green]]));
  await until(S(41));
  await play(...say('ALL 8 RESULTS ARE IN', C.green),
    ...box([[0, 'All 8 results', C.green], [1, 'Correct: 6', C.green], [2, 'Wrong: 2', RED], [3, '']]));

  // 42: rearrange into 4 groups of 2 (correct first, the 2 wrong last)
  await until(S(42));
  const old = [];
  cards.forEach(c => old.push(c.frame, c.name, c.route, c.bubble, c.pred, c.act));
  marks.forEach(m => old.push(m));
  const order = [1, 2, 3, 4, 5, 7, 0, 6];
  const groupSlots = g => P ? [2 * g, 2 * g + 1] : [g, g + 4];
  order.forEach((i, n) => { slotOf[i] = groupSlots(Math.floor(n / 2))[n % 2]; });
  cards = parcels.map((_, i) => parts(i));
  parcels.forEach((_, i) => { marks[i] = makeMark(i, markKind[i]); });
  const fresh = [];
  cards.forEach((c, i) => fresh.push(c.frame, c.name, c.route, c.bubble, c.pred, c.act, marks[i]));
  await play(new M.FadeOut(new M.VGroup(...old), { runTime: 0.4 }), ...say('4 EQUAL GROUPS OF 2'));
  await play(new M.LaggedStart(fresh.map(enter), { lagRatio: 0.02, runTime: 1.2 }));

  await until(S(43));
  const groups = [0, 1, 2, 3].map(g => {
    const [a, b] = groupSlots(g).map(pos);
    return rect((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(a[0] - b[0]) + CW + 0.16, Math.abs(a[1] - b[1]) + CH + 0.16,
      g < 3 ? C.green : RED, null, 3);
  });
  await play(new M.LaggedStart(groups.map(r => new M.Create(r)), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('6 CORRECT FILL 3 OF 4 GROUPS', C.green));
  await until(S(44));
  await play(...say('3 QUARTERS = 75%', C.amber), ...box([[3, '3 of 4 groups = 75%', C.amber]]),
    ...groups.slice(0, 3).map(r => emphasis(r, C.amber)));
  await until(S(45));
  await play(...say('ACCURACY = % OF CORRECT PREDICTIONS'),
    ...box([[0, 'Accuracy', C.cyan], [1, '% of correct predictions'], [2, '6 correct of 8', C.green], [3, '']]));
  await until(S(46)); await play(...say('A SHORT FORMULA'));
  await until(S(47));
  await play(...box([[0, 'Accuracy %', C.cyan], [1, '= correct ÷ total × 100']]));
  await until(S(48));
  await play(...say('6 ÷ 8 × 100 = 75%', C.amber), ...box([[2, '= 6 ÷ 8 × 100', C.amber], [3, '= 75%', C.amber]]));

  await until(S(49)); await play(...say('COMPLETE LABELS → WHOLE-GROUP ACCURACY', C.green), ...groups.map(r => emphasis(r, C.green)));
  await until(S(50));
  await play(...say('MISSING RESULT ≠ ON TIME', C.pink),
    ...box([[0, 'Missing result', C.pink], [1, 'is NOT an on-time delivery'], [2, ''], [3, '']]));
  await until(S(51)); await play(...box([[2, '? = unknown', C.amber], [3, 'not ✓ and not ✗']]));
  await until(S(52)); await play(...say('WAIT FOR THE FULL GROUP, THEN REPORT', C.amber));
}

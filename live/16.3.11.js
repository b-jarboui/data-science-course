// 16.3.11 Retention limits. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const RED = '#f87171';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.6, 0] : [4.35, -0.35, 0];
  const BW = P ? FW - 1.0 : 4.5, BH = P ? 2.3 : 2.4, LH = P ? 0.48 : 0.5;
  // tables: [x, header y, first row y]
  const TB = P ? [[0, 3.1, 2.6], [0, 1.05, 0.55]] : [[-4.75, 1.05, 0.5], [-0.95, 1.05, 0.5]];
  const TW = P ? 7.0 : 2.8, RH = 0.42, RS = P ? 0.45 : 0.52;
  const CALP = P ? 1.85 : 0.82, CALW = P ? 1.6 : 0.74, CALH = P ? 0.85 : 0.75;
  const calx = k => P ? (k % 4 - 1.5) * CALP : -5.85 + k * CALP;
  const caly = k => P ? (k < 4 ? -1.35 : -2.4) : -1.75;

  const enter = obj => new M.FadeIn(obj, { runTime: 0.34 });
  const leave = obj => new M.FadeOut(obj, { runTime: 0.24 });
  const emphasis = (obj, color = C.amber) => new M.Indicate(obj, { color, runTime: 0.5 });
  function label(text, x, y, width, color = C.ink, size = 21, mono = false, bold = false) {
    const t = T(text, size, color, mono, bold);
    if (t.getWidth() > width) t.scale(width / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }
  function rect(x, y, width, height, color, fill, strokeWidth = 2, op = 0.95) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.1, color, strokeWidth });
    if (fill) r.setFill(fill, op);
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
  let focusNow = [];
  function focus(specs, color = C.amber) {
    const a = focusNow.map(leave);
    focusNow = specs.map(([x, y, w, h]) => rect(x, y, w, h, color, null, 2.5));
    focusNow.forEach(r => a.push(new M.Create(r, { runTime: 0.3 })));
    return a;
  }

  // tables
  const titles = ['DISPATCH TABLE', 'TRAINING TABLE'].map((s, t) => label(s, TB[t][0], TB[t][1], TW, t ? C.violet : C.cyan, 16, true, true));
  const rowTexts = [
    ['Nell · North · Mon 8 a.m.', 'Oak · North · Mon 8 a.m.', 'Pine · North · Mon 8 a.m.'],
    ['Nell · North · 2 min · late', 'Oak · North · on time', 'Pine · North · on time']
  ];
  const rowY = (t, r) => TB[t][2] - r * RS;
  const rows = [0, 1].map(t => rowTexts[t].map((s, r) => new M.VGroup(
    rect(TB[t][0], rowY(t, r), TW, RH, r ? C.line : C.amber, C.card, 1.5),
    label(s, TB[t][0], rowY(t, r), TW - 0.3, r ? C.muted : C.ink, P ? 18 : 14, false, r === 0))));
  const nellSpec = t => [TB[t][0], rowY(t, 0), TW + 0.14, RH + 0.14];
  const link = P
    ? new M.VGroup(...[[[3.5, 2.6], [3.78, 2.6]], [[3.78, 2.6], [3.78, 0.55]], [[3.78, 0.55], [3.5, 0.55]]]
        .map(([a, b]) => new M.Line({ start: [...a, 0], end: [...b, 0], color: C.amber, strokeWidth: 3 })))
    : new M.VGroup(new M.Line({ start: [TB[0][0] + TW / 2, 0.5, 0], end: [TB[1][0] - TW / 2, 0.5, 0], color: C.amber, strokeWidth: 3 }));

  // calendar: Monday to the next Monday
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
  const cal = days.map((d, k) => new M.VGroup(rect(calx(k), caly(k), CALW, CALH, C.line, C.card, 1.5),
    label(d, calx(k), caly(k) + 0.17, CALW - 0.1, C.muted, P ? 19 : 15, false, true)));
  const counts = days.map((_, k) => label(k ? `${k} d` : '8 a.m.', calx(k), caly(k) - 0.18, CALW - 0.1, k === 7 ? C.amber : C.cyan, P ? 18 : 15, true, true));
  const calSpec = k => [calx(k), caly(k), CALW + 0.12, CALH + 0.12];
  // opening picture: Nell's parcel (gone when the tables arrive)
  const PX = P ? [0, 1.7] : [-2.85, -0.1], PW = P ? 3.0 : 2.8, PH = P ? 2.0 : 1.8;
  const parcel = new M.VGroup(rect(PX[0], PX[1], PW, PH, C.amber, C.card, 3),
    new M.Line({ start: [PX[0], PX[1] + PH / 2, 0], end: [PX[0], PX[1] - PH / 2, 0], color: C.amber, strokeWidth: 6 }),
    rect(PX[0] + PW / 4 + 0.1, PX[1] + 0.35, 1.1, 0.5, C.cyan, C.bg, 2),
    label('Nell', PX[0] + PW / 4 + 0.1, PX[1] + 0.35, 0.9, C.cyan, 20, false, true),
    label('Mon 8 a.m.', PX[0], PX[1] - PH / 2 - 0.32, 2.4, C.muted, 18, true));

  await until(S(0));
  await play(...say('THE DEPOT KEEPS PARCEL INFORMATION'), ...box([[0, 'Parcel information', C.cyan], [1, 'Kept for every parcel']]));
  await until(S(1)); await play(...box([[2, 'Check predictions'], [3, 'Train future models', C.violet]]));
  await until(S(2)); await play(...say('KEEP IT FOREVER?', C.amber));
  await until(S(3)); await play(...say('OUR PARCEL: NELL'), enter(parcel.submobjects[0]), enter(parcel.submobjects[1]),
    enter(parcel.submobjects[2]), enter(parcel.submobjects[3]));
  await until(S(4)); await play(enter(parcel.submobjects[4]), ...box([[0, 'Nell', C.cyan], [1, 'Leaves Monday, 8 a.m.'], [2, ''], [3, '']]));
  await until(S(5)); await play(...parcel.submobjects.map(leave)); await play(enter(titles[0]), enter(rows[0][0]), ...say('NELL’S DISPATCH ROW'));
  await until(S(6)); await play(enter(rows[0][1]), enter(rows[0][2]), ...say('ONE ROW = ONE PARCEL'));
  await until(S(7)); await play(enter(titles[1]), enter(rows[1][1]), enter(rows[1][2]), ...say('A TABLE FOR TRAINING', C.violet));
  await until(S(8)); await play(new M.FadeIn(rows[1][0], { shift: P ? [0, -0.6, 0] : [0.6, 0, 0], runTime: 0.8 }), ...say('COPY NELL’S ROW INTO IT', C.violet));
  await until(S(9)); await play(...say('TWO TABLES'), emphasis(titles[0], C.cyan), emphasis(titles[1], C.violet));
  await until(S(10)); await play(new M.Create(link), ...say('THE TWO ROWS ARE LINKED', C.amber));
  await until(S(11));
  await play(...focus([nellSpec(0), nellSpec(1)]),
    ...box([[0, 'Both rows', C.amber], [1, 'point to Nell’s delivery record'], [2, ''], [3, '']]));
  await until(S(12)); await play(...say('IDENTIFIABLE INFORMATION', C.amber), ...box([[2, '= identifiable information', C.amber]]));
  await until(S(13));
  await play(...say('2 IDENTIFIABLE COPIES', C.amber), ...box([[0, 'Identifiable copies of Nell', C.amber], [1, '2'], [2, ''], [3, '']]));
  await until(S(14));
  await play(...focus([]), ...say('LIKE A COPY IN ANOTHER FOLDER', C.violet),
    ...box([[0, 'A document', C.violet], [1, 'A copy goes in another folder'], [2, ''], [3, '']]));
  await until(S(15)); await play(...box([[2, 'Remove the original:'], [3, 'the copy is still there', C.pink]]));

  await until(S(16)); await play(...say('A RULE: HOW LONG TO KEEP IT', C.amber));
  await until(S(17)); await play(...box([[0, 'Depot rule', C.amber], [1, 'Keep both rows'], [2, '7 days from dispatch'], [3, '']]));
  await until(S(18)); await play(...say('RETENTION PERIOD', C.amber), ...box([[3, '= the retention period', C.amber]]));
  await until(S(19));
  await play(...say('RETENTION LIMIT: THEN WE MUST REMOVE IT', C.amber),
    ...box([[0, 'Retention limit', C.amber], [1, 'How long we may keep it'], [2, 'then we must remove it'], [3, '']]));

  await until(S(20)); await play(...say('A CALENDAR'), new M.LaggedStart(cal.map(enter), { lagRatio: 0.12, runTime: 1.2 }));
  await until(S(21));
  await play(...focus([calSpec(0)], C.cyan), enter(counts[0]), ...say('START: MONDAY, 8 A.M.'),
    ...box([[0, 'Day count', C.cyan], [1, 'Start: Monday, 8 a.m.'], [2, ''], [3, '']]));
  const dSay = ['TUESDAY 8 A.M.: 1 DAY', 'WEDNESDAY 8 A.M.: 2 DAYS', 'THURSDAY: 3 DAYS', 'FRIDAY: 4 DAYS', 'SATURDAY: 5 DAYS', 'SUNDAY: 6 DAYS'];
  for (let k = 1; k <= 6; k++) {
    await until(S(21 + k));
    await play(...focus([calSpec(k)], C.cyan), enter(counts[k]), ...say(dSay[k - 1]));
  }
  await until(S(28));
  await play(...focus([calSpec(7)], C.amber), enter(counts[7]), ...say('NEXT MONDAY, 8 A.M.: 7 DAYS', C.amber),
    ...box([[2, 'Next Monday, 8 a.m. = 7 days', C.amber]]));
  await until(S(29)); await play(...focus([nellSpec(0), nellSpec(1), calSpec(7)], C.pink), ...say('BOTH ROWS REACH THE LIMIT', C.pink));
  await until(S(30));
  await play(...say('BOTH RECORDS EXPIRE', C.pink), ...box([[0, 'Expire', C.pink], [1, 'The allowed time ends'], [2, ''], [3, '']]));

  await until(S(31));
  await play(...focus([nellSpec(0)], RED), ...say('REMOVE NELL’S DISPATCH ROW', RED));
  await play(leave(rows[0][0]), leave(link));
  await until(S(32)); await play(...focus([nellSpec(1)], C.violet), ...say('NOW THE TRAINING TABLE', C.violet));
  await until(S(33)); await play(...say('NELL’S TRAINING ROW IS STILL THERE', C.pink), emphasis(rows[1][0], C.pink));
  await until(S(34));
  await play(...box([[0, 'Identifiable copies of Nell', C.amber], [1, 'Start: 2'], [2, 'Removed: 1'], [3, '']]));
  await until(S(35)); await play(...say('2 − 1 = 1 COPY LEFT', C.pink), ...box([[3, '2 − 1 = 1 left', C.pink]]));
  await until(S(36)); await play(...say('ALSO REMOVE THE LINKED TRAINING ROW', C.amber));
  await until(S(37)); await play(...focus([nellSpec(1)], RED), ...say('REMOVE IT NOW', RED));
  await play(leave(rows[1][0]));
  await until(S(38)); await play(...box([[1, 'Left after step 1: 1'], [2, 'Removed now: 1 more'], [3, '1 − 1 = 0', C.green]]));
  await until(S(39)); await play(...focus([]), ...say('NO IDENTIFIABLE COPY OF NELL LEFT', C.green));
  await until(S(40)); await play(...say('A SHORT FORMULA'));
  await until(S(41)); await play(...box([[0, 'Remaining copies', C.cyan], [1, '= original − removed'], [2, ''], [3, '']]));
  await until(S(42)); await play(...box([[2, '= 2 − 2', C.amber], [3, '= 0', C.green]]));
  await until(S(43)); await play(...say('KEEP INFORMATION ONLY AS LONG AS NEEDED', C.green));
  await until(S(44));
  await play(...say('MISTAKE: FORGETTING THE COPIES', RED),
    ...box([[0, 'Common mistake', RED], [1, 'Remove the original'], [2, 'but forget the related copies'], [3, '']]));
  await until(S(45));
  await play(...focus([calSpec(0)], C.amber), ...say('A COPY DOES NOT RESTART THE CLOCK', C.amber),
    ...box([[0, 'A copy does not restart', C.amber], [1, 'the 7-day period'], [2, ''], [3, '']]));
  await until(S(46)); await play(...focus([]), ...box([[2, 'Track where each copy goes'], [3, 'and when each copy expires']]));
  await until(S(47)); await play(...say('FOLLOW THE LIMIT WHEREVER THE DATA GOES', C.green));
}

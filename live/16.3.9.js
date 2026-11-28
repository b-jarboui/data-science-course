// 16.3.9 Data minimization. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const RED = '#f87171';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.7, 0] : [4.35, -0.35, 0];
  const BW = P ? FW - 1.0 : 4.5, BH = P ? 2.3 : 2.4, LH = P ? 0.48 : 0.5;
  const COLX = P ? [-1.8, 0.25, 2.3] : [-4.3, -2.6, -0.9];
  const COLW = P ? 2.0 : 1.66, HY = P ? 2.9 : 0.9, RY1 = P ? 2.35 : 0.33, RY2 = P ? 1.85 : -0.2, RH = 0.5;
  const NAMEX = P ? -3.3 : -5.7;
  const MOD = P ? [-0.85, 0.1] : [-3.45, -1.95], MODW = P ? 2.0 : 1.8, MODH = 0.72;
  const SCORE = P ? [1.6, 0.1] : [-1.55, -1.95];
  const NOTREAD = P ? [2.375, 1.2] : [-0.9, -0.75];
  const CONTACT = P ? [0, -1.45] : [-0.45, -2.05], CONW = P ? 4.2 : 2.3;

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
  const colSpec = c => [COLX[c], (HY + RY2) / 2, COLW + 0.12, HY - RY2 + RH + 0.12];
  const rowSpec = [(COLX[0] + COLX[1]) / 2, RY1, COLX[1] - COLX[0] + COLW + 0.12, RH + 0.1];

  // table: empty cells first, then each column's header and Nell's value
  const cells = [0, 1, 2].map(c => [HY, RY1, RY2].map((y, r) => rect(COLX[c], y, COLW, RH, r ? C.line : C.muted, r ? C.card : C.bg, 1.5)));
  const heads = ['Planned route', 'Loading wait', 'Phone number'].map((s, c) => label(s, COLX[c], HY, COLW - 0.2, c === 2 ? C.pink : C.ink, 16, false, true));
  const vals = [['North', C.cyan], ['2 min', C.amber], ['••• ••••', C.pink]].map(([s, col], c) => label(s, COLX[c], RY1, COLW - 0.3, col, 17, true, true));
  const dots = [0, 1, 2].map(c => label('…', COLX[c], RY2, 0.6, C.muted, P ? 26 : 22));
  const nell = label('Nell', NAMEX, RY1, 0.8, C.ink, 19, false, true);
  const more = label('more', NAMEX, RY2, 0.8, C.muted, P ? 17 : 15);
  // opening picture: Nell's parcel (gone when the table arrives)
  const PX = P ? [0, 0.9] : [CX, -0.45], PW = P ? 3.0 : 3.2, PH = P ? 2.2 : 2.1;
  const parcel = new M.VGroup(rect(PX[0], PX[1], PW, PH, C.amber, C.card, 3),
    new M.Line({ start: [PX[0], PX[1] + PH / 2, 0], end: [PX[0], PX[1] - PH / 2, 0], color: C.amber, strokeWidth: 6 }),
    label('parcel', PX[0], PX[1] - PH / 2 - 0.35, 2, C.muted, 17));
  const tag = new M.VGroup(rect(PX[0] + PW / 4 + 0.1, PX[1] + 0.35, 1.1, 0.5, C.cyan, C.bg, 2),
    label('Nell', PX[0] + PW / 4 + 0.1, PX[1] + 0.35, 0.9, C.cyan, 20, false, true));

  const model = new M.VGroup(rect(MOD[0], MOD[1], MODW, MODH, C.violet, C.card, 2.5), label('MODEL', MOD[0], MOD[1], MODW - 0.3, C.violet, 20, true, true));
  const arrows = [0, 1].map(c => new M.Arrow({
    start: [COLX[c], RY2 - RH / 2 - 0.05, 0], end: [MOD[0] + (c ? 0.45 : -0.45), MOD[1] + MODH / 2 + 0.02, 0],
    color: c ? C.amber : C.cyan, strokeWidth: 3 }));
  const notRead = label('✗ not read', NOTREAD[0], NOTREAD[1], COLW, RED, 16, false, true);
  const score = new M.VGroup(rect(SCORE[0], SCORE[1], 0.95, 0.46, C.cyan, C.bg, 2), label('40%', SCORE[0], SCORE[1], 0.8, C.cyan, 19, true, true));
  const scoreArrow = new M.Arrow({ start: [MOD[0] + MODW / 2, MOD[1], 0], end: [SCORE[0] - 0.5, SCORE[1], 0], color: C.cyan, strokeWidth: 3 });
  const keeps = [0, 1].map(c => label('✓ KEEP', COLX[c], HY + 0.45, COLW, C.green, 15, true, true));
  const remove = label('✗ REMOVE', COLX[2], HY + 0.45, COLW, RED, 15, true, true);
  const contact = new M.VGroup(rect(CONTACT[0], CONTACT[1], CONW, 0.95, C.green, C.card, 2),
    label('Contact list (delivery team)', CONTACT[0], CONTACT[1] + 0.2, CONW - 0.3, C.green, P ? 18 : 15, false, true),
    label('••• ••••', CONTACT[0], CONTACT[1] - 0.18, CONW - 0.3, C.pink, P ? 18 : 15, true));
  const lock = label('Permission only', CONTACT[0], CONTACT[1] - 0.68, CONW, C.amber, P ? 17 : 15, true, true);

  await until(S(0));
  await play(...say('THE DEPOT COLLECTS PARCEL INFORMATION'), enter(parcel), ...box([[0, 'Parcel information', C.cyan], [1, 'Collected before delivery']]));
  await until(S(1)); await play(...box([[2, 'Some helps the model predict', C.amber]]));
  await until(S(2)); await play(...box([[3, 'Some helps workers deliver', C.green]]));
  await until(S(3)); await play(...say('DOES THE MODEL NEED EVERYTHING?', C.amber));
  await until(S(4)); await play(enter(nell), enter(tag), ...say('OUR PARCEL: NELL'));
  await until(S(5)); await play(...box([[0, 'Nell', C.cyan], [1, 'Route: North', C.cyan], [2, ''], [3, '']]));
  await until(S(6)); await play(...box([[2, 'Loading wait: 2 minutes', C.amber]]));
  await until(S(7)); await play(...box([[3, 'Recipient’s phone number', C.pink]]));
  await until(S(8));
  await play(leave(parcel), leave(tag));
  await play(...say('A TABLE WITH 3 COLUMNS'), new M.LaggedStart(cells.map(col => enter(col[0])), { lagRatio: 0.25, runTime: 0.9 }),
    ...cells.flatMap(col => col.slice(1).map(enter)));
  await until(S(9));
  await play(...say('COLUMN = ONE KIND OF INFORMATION'), ...focus([colSpec(0)], C.cyan), ...dots.map(enter), enter(more),
    ...box([[0, 'Column', C.cyan], [1, 'One kind of information'], [2, 'for all our parcels'], [3, '']]));
  const colSay = ['COLUMN 1: PLANNED ROUTE', 'COLUMN 2: LOADING WAIT', 'COLUMN 3: PHONE NUMBER'];
  for (let c = 0; c < 3; c++) {
    await until(S(10 + c));
    await play(...focus([colSpec(c)], c === 2 ? C.pink : C.cyan), enter(heads[c]), enter(vals[c]), ...say(colSay[c], c === 2 ? C.pink : C.cyan));
  }
  await until(S(13));
  await play(...say('RECIPIENT = THE PERSON WHO RECEIVES IT', C.pink),
    ...box([[0, 'Recipient', C.pink], [1, 'The person who receives'], [2, 'the parcel'], [3, '']]));

  await until(S(14)); await play(...focus([]), enter(model), ...say('THE MODEL', C.violet));
  await until(S(15)); await play(new M.Create(arrows[0]), ...say('PLANNED ROUTE → MODEL'));
  await until(S(16)); await play(new M.Create(arrows[1]), ...say('LOADING WAIT → MODEL', C.amber));
  await until(S(17));
  await play(...say('THE MODEL USES THESE 2', C.amber),
    ...box([[0, 'Model inputs', C.violet], [1, 'Planned route'], [2, 'Loading wait'], [3, '']]));
  await until(S(18)); await play(enter(notRead), ...say('IT NEVER READS THE PHONE NUMBER', C.pink));
  await until(S(19));
  await play(...say('A DRIVER NEEDS A MAP', C.violet), ...box([[0, 'A driver', C.violet], [1, 'needs a map to choose a road'], [2, ''], [3, '']]));
  await until(S(20)); await play(...box([[2, 'not your phone number', C.pink]]));
  await until(S(21)); await play(...say('THE MODEL DOES NOT NEED EVERYTHING', C.amber), ...box([[3, 'Our model: the same idea', C.amber]]));
  await until(S(22));
  await play(...focus([colSpec(2)], C.pink), ...say('PHONE NUMBER = PERSONAL INFORMATION', C.pink),
    ...box([[0, 'Personal information', C.pink], [1, 'Can help identify a person'], [2, ''], [3, '']]));
  await until(S(23)); await play(...say('UNNEEDED PERSONAL DATA = EXTRA RISK', RED), ...box([[2, 'Kept but not needed = extra risk', RED]]));
  await until(S(24)); await play(...focus([colSpec(2)], RED), ...say('SOMEONE WITHOUT PERMISSION?', RED), ...box([[3, 'Someone without permission sees it', RED]]));
  await until(S(25)); await play(...say('WHY KEEP WHAT THE MODEL NEVER USES?', C.amber));
  await until(S(26));
  await play(...focus([]), ...say('DATA MINIMIZATION', C.green),
    ...box([[0, 'Data minimization', C.green], [1, 'Keep only the information'], [2, 'this task needs'], [3, '']]));
  await until(S(27)); await play(...say('APPLY IT TO THE TABLE', C.green));
  await until(S(28)); await play(enter(keeps[0]), ...focus([colSpec(0)], C.green), ...say('KEEP: THE MODEL USES IT', C.green));
  await until(S(29)); await play(enter(keeps[1]), ...focus([colSpec(1)], C.green), ...say('KEEP: THE MODEL USES IT', C.green));
  await until(S(30));
  await play(enter(remove), ...focus([colSpec(2)], RED), ...say('REMOVE: THE MODEL NEVER READS IT', RED));
  await play(new M.FadeOut(new M.VGroup(...cells[2], heads[2], vals[2], dots[2], notRead, remove, ...focusNow), { runTime: 0.6 }));
  focusNow = [];

  await until(S(31)); await play(...say('BEFORE AND AFTER'));
  await until(S(32)); await play(...box([[0, 'Before', C.muted], [1, '3 columns'], [2, ''], [3, '']]));
  await until(S(33)); await play(...box([[2, 'After', C.green], [3, '2 columns', C.green]]), emphasis(keeps[0], C.green), emphasis(keeps[1], C.green));
  await until(S(34)); await play(...say('3 − 1 = 2', C.amber));
  await until(S(35)); await play(...say('A SHORT FORMULA'));
  await until(S(36));
  await play(...box([[0, 'Remaining columns', C.cyan], [1, '= original − removed'], [2, '= 3 − 1', C.amber], [3, '= 2', C.amber]]));

  await until(S(37)); await play(...focus([rowSpec], C.cyan), ...say('NELL’S SMALLER ROW → MODEL'));
  await until(S(38)); await play(emphasis(vals[0], C.cyan), emphasis(arrows[0], C.cyan), ...say('ROUTE: NORTH'));
  await until(S(39)); await play(emphasis(vals[1]), emphasis(arrows[1]), ...say('LOADING WAIT: 2 MINUTES', C.amber));
  await until(S(40)); await play(...focus([]), new M.Create(scoreArrow), enter(score), ...say('SCORE: STILL 40%'));
  await until(S(41)); await play(...say('LESS INFORMATION · SAME PREDICTION', C.green), emphasis(score, C.green));
  await until(S(42));
  await play(...box([[0, 'Data minimization', C.green], [1, 'Less personal information'], [2, 'collected, stored or shared'], [3, '']]));
  await until(S(43)); await play(...say('ONE TABLE IS NOT EVERY TABLE', C.amber));
  await until(S(44));
  await play(leave(score), leave(scoreArrow), enter(contact), ...say('A DRIVER MAY NEED THE PHONE NUMBER', C.green));
  await until(S(45));
  await play(...box([[0, 'Delivery team', C.green], [1, 'Phone numbers in a separate'], [2, 'contact list'], [3, '']]));
  await until(S(46)); await play(enter(lock), ...box([[3, 'Only people with permission', C.amber]]));
  await until(S(47)); await play(...say('EACH TASK GETS WHAT IT NEEDS', C.green), emphasis(model, C.violet), emphasis(contact, C.green));
  await until(S(48)); await play(...say('DATA MINIMIZATION: ONLY WHAT THE TASK NEEDS', C.green));
}

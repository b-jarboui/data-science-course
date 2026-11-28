// 16.3.8 Rollback. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const RED = '#f87171';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.6, 0] : [4.35, -0.35, 0];
  const BW = P ? FW - 1.0 : 4.5, BH = P ? 2.3 : 2.4, LH = P ? 0.48 : 0.5;
  // model cards
  const MY = P ? 2.9 : 0.95, MW = P ? 3.3 : 2.6, MH = 1.0;
  const MX = P ? [-1.85, 1.85] : [-4.6, -1.3];
  // request rows
  const RY = P ? [1.6, 0.85, 0.1, -0.65] : [-0.1, -0.72, -1.34, -1.96];
  const X0 = P ? -2.85 : -4.7, U = P ? 1.1 : 0.9;
  const LABX = P ? -3.45 : -5.75, MARKX = P ? 3.35 : 0.45, AXY = P ? -1.2 : -2.45;
  const tx = s => X0 + s * U;

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
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.11, color, strokeWidth });
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

  // models
  const frames = MX.map(x => rect(x, MY, MW, MH, C.line, C.card, 1.5));
  const names = ['Ash', 'Birch'].map((s, i) => label(s, MX[i], MY + 0.26, MW - 0.3, i ? C.cyan : C.violet, 22, false, true));
  const subs = ['Earlier model', 'Current model'].map((s, i) => label(s, MX[i], MY - 0.04, MW - 0.3, C.muted, 15));
  const sets = MX.map(x => label('+ input settings', x, MY - 0.3, MW - 0.3, C.green, 14, true));
  let useNow = null;
  function inUse(i, color = C.amber) {
    const a = useNow ? [leave(useNow)] : [];
    useNow = i == null ? null : new M.VGroup(rect(MX[i], MY, MW + 0.16, MH + 0.16, color, null, 3));
    if (useNow) a.push(new M.Create(useNow, { runTime: 0.3 }));
    return a;
  }

  // requests
  const rlabs = RY.map((y, k) => label(P ? `R${k + 1}` : `Request ${k + 1}`, LABX, y, P ? 0.7 : 1.0, C.ink, P ? 18 : 16));
  const axis = new M.VGroup(
    new M.Line({ start: [tx(0), AXY + 0.22, 0], end: [tx(4.2), AXY + 0.22, 0], color: C.muted, strokeWidth: 2 }),
    ...[0, 1, 2, 3, 4].map(s => label(`${s} s`, tx(s), AXY, 0.7, C.muted, P ? 17 : 15, true)));
  const limit = new M.DashedLine({ start: [tx(2), RY[0] + 0.35, 0], end: [tx(2), AXY + 0.22, 0], color: C.amber });
  const limitLab = P ? label('2 s limit', tx(2), RY[0] + 0.52, 1.5, C.amber, 17, true, true)
    : label('2 s limit', tx(2) + 0.68, RY[0] + 0.3, 1.2, C.amber, 15, true, true);
  function bar(k, s) {
    const ok = s <= 2, col = ok ? C.green : RED;
    const r = new M.Rectangle({ width: s * U, height: 0.3, color: col, strokeWidth: 1 });
    r.setFill(col, 0.8); r.moveTo([X0 + s * U / 2, RY[k], 0]);
    const t = label(`${s} s`, tx(s) + (P ? 0.4 : 0.34), RY[k], P ? 0.72 : 0.6, col, P ? 18 : 16, true, true);
    return { r, t, ok };
  }
  const mark = (k, ok) => label(ok ? '✓' : '✗', MARKX, RY[k], 0.5, ok ? C.green : RED, 28, false, true);

  await until(S(0));
  await play(...say('A NEW MODEL PREDICTS LATE DELIVERIES'), ...box([[0, 'New model', C.cyan], [1, 'Predicts late deliveries']]));
  await until(S(1)); await play(...box([[2, 'Workers wait for each prediction'], [3, 'then decide on a review']]));
  await until(S(2)); await play(...say('WHAT IF IT IS TOO SLOW?', C.pink));
  await until(S(3)); await play(...say('TWO MODELS'), ...frames.map(enter));
  await until(S(4)); await play(enter(names[0]), enter(subs[0]), ...say('ASH = THE EARLIER MODEL', C.violet));
  await until(S(5)); await play(enter(names[1]), enter(subs[1]), ...say('BIRCH = THE CURRENT MODEL'));
  await until(S(6));
  await play(...say('VERSION = A SAVED FORM OF A MODEL'), emphasis(frames[0], C.cyan), emphasis(frames[1], C.cyan),
    ...box([[0, 'Version', C.cyan], [1, 'A saved form of a model'], [2, ''], [3, '']]));
  await until(S(7)); await play(...sets.map(enter), ...box([[2, 'Saved with input settings', C.green]]));
  await until(S(8)); await play(...box([[3, 'Inputs arrive in the right form']]));
  await until(S(9)); await play(...say('WE CAN RETURN TO ASH', C.green), emphasis(frames[0], C.green));
  await until(S(10));
  await play(...say('LIKE AN EARLIER COPY OF A PROGRAM', C.violet),
    ...box([[0, 'A computer program', C.violet], [1, 'Keep the earlier working copy'], [2, ''], [3, '']]));
  await until(S(11)); await play(...box([[2, 'New copy has problems?', C.pink], [3, 'Go back to the earlier one', C.green]]));
  await until(S(12)); await play(...say('WHEN DO WE RETURN TO ASH?', C.amber));
  await until(S(13));
  await play(...say('AGREE ON A RULE BEFORE USING BIRCH', C.amber),
    ...box([[0, 'Rule', C.amber], [1, 'Agreed before using Birch'], [2, ''], [3, '']]));

  await until(S(14)); await play(...say('4 REQUESTS FOR PREDICTIONS'), new M.LaggedStart(rlabs.map(enter), { lagRatio: 0.2, runTime: 1.0 }));
  await until(S(15)); await play(...box([[0, 'Request', C.cyan], [1, 'The depot asks for a score'], [2, ''], [3, '']]));
  await until(S(16)); await play(enter(axis), ...box([[2, 'Measure the wait for the score']]));
  await until(S(17)); await play(...say('RESPONSE TIME = THE WAITING TIME', C.amber), ...box([[3, 'This wait = response time', C.amber]]));
  await until(S(18));
  await play(new M.Create(limit), enter(limitLab), ...say('AT LEAST 3 OF 4 WITHIN 2 SECONDS', C.amber),
    ...box([[0, 'Rule', C.amber], [1, 'At least 3 of 4 requests'], [2, 'finish within 2 seconds'], [3, '']]));
  await until(S(19)); await play(emphasis(limit), ...box([[3, 'Exactly 2 s also counts', C.green]]));

  // 20-28 Birch
  await until(S(20)); await play(...inUse(1), ...say('SEND 4 REQUESTS TO BIRCH'));
  const birch = [1, 3, 4, 1].map((s, k) => bar(k, s));
  const bmarks = birch.map((b, k) => mark(k, b.ok));
  const bSay = ['REQUEST 1: 1 SECOND', 'REQUEST 2: 3 SECONDS', 'REQUEST 3: 4 SECONDS', 'REQUEST 4: 1 SECOND'];
  const mSay = ['MEETS THE LIMIT ✓', 'TOO LONG ✗', 'TOO LONG ✗', 'MEETS THE LIMIT ✓'];
  for (let k = 0; k < 4; k++) {
    const b = birch[k];
    await until(S(21 + 2 * k));
    await play(new M.Create(b.r), enter(b.t), ...say(bSay[k], b.ok ? C.green : RED));
    await until(S(22 + 2 * k));
    await play(enter(bmarks[k]), ...say(mSay[k], b.ok ? C.green : RED));
  }
  await until(S(29)); await play(...say('COUNT THE GREEN TICKS', C.green));
  await until(S(30));
  await play(emphasis(bmarks[0], C.green), emphasis(bmarks[3], C.green),
    ...box([[0, 'Birch', C.cyan], [1, 'Within the limit: 2 of 4', RED], [2, ''], [3, '']]));
  await until(S(31)); await play(...box([[2, 'The rule needs at least 3']]));
  await until(S(32)); await play(...say('BIRCH FAILS THE RULE', RED), ...box([[3, '2 is less than 3 → fail', RED]]));
  await until(S(33));
  await play(...inUse(0, C.green), ...say('STOP BIRCH · RESTORE ASH + SETTINGS', C.green), emphasis(sets[0], C.green));
  await until(S(34));
  await play(...say('ROLLBACK = RETURN TO AN EARLIER VERSION', C.green),
    ...box([[0, 'Rollback', C.green], [1, 'Return to an earlier version'], [2, ''], [3, '']]));

  // 35-41 Ash
  await until(S(35)); await play(...say('DOES ASH SOLVE THE SPEED PROBLEM?'));
  await until(S(36));
  await play(new M.FadeOut(new M.VGroup(...birch.map(b => b.r), ...birch.map(b => b.t), ...bmarks), { runTime: 0.4 }),
    ...say('4 NEW REQUESTS TO ASH', C.violet));
  const ash = [1, 1, 2, 1].map((s, k) => bar(k, s));
  const aSay = ['REQUEST 1: 1 SECOND', 'REQUEST 2: 1 SECOND', 'REQUEST 3: 2 SECONDS', 'REQUEST 4: 1 SECOND'];
  for (let k = 0; k < 4; k++) {
    await until(S(37 + k));
    await play(new M.Create(ash[k].r), enter(ash[k].t), ...say(aSay[k], C.green));
  }
  const amarks = ash.map((b, k) => mark(k, true));
  await until(S(41));
  await play(new M.LaggedStart(amarks.map(enter), { lagRatio: 0.25, runTime: 1.2 }), ...say('ALL 4 GET A GREEN TICK', C.green));

  await until(S(42)); await play(...say('A SHORT FORMULA'));
  await until(S(43));
  await play(...box([[0, 'Meeting the limit', C.cyan], [1, '= total − over the limit'], [2, ''], [3, '']]));
  await until(S(44)); await play(...box([[2, 'Birch: 4 − 2 = 2', RED]]));
  await until(S(45)); await play(...box([[3, 'Ash: 4 − 0 = 4', C.green]]));
  await until(S(46)); await play(...say('ASH MEETS THE RULE', C.green), emphasis(frames[0], C.green));
  await until(S(47)); await play(...say('ROLLBACK RESTORES A WORKING MODEL', C.green));
  await until(S(48));
  await play(...say('FASTER ≠ MORE ACCURATE', C.pink),
    ...box([[0, 'Speed is not accuracy', C.pink], [1, 'Fast predictions can be wrong'], [2, ''], [3, '']]));
  await until(S(49)); await play(...box([[2, 'Keep checking both:'], [3, 'response times + delivery results', C.amber]]));
  await until(S(50)); await play(...say('ROLLBACK: BACK TO AN EARLIER VERSION', C.green));
}

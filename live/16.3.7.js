// 16.3.7 Feedback loops. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const RED = '#f87171';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 4.35, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.55, 0] : [4.35, -0.35, 0];
  const BW = P ? FW - 1.0 : 4.5, BH = P ? 2.7 : 2.4, LH = P ? 0.56 : 0.5;
  const CW = P ? 1.84 : 1.32, CH = P ? 1.35 : 1.12;
  const ROWS = P
    ? [{ card: 2.55, block: 1.4, lab: [0, 3.55] }, { card: -0.45, block: -1.6, lab: [0, 0.55] }]
    : [{ card: 0.8, block: -0.12, lab: [-5.85, 0.8] }, { card: -1.35, block: -2.27, lab: [-5.85, -1.35] }];
  const SP = P ? 1.92 : 1.45;
  const cx = k => P ? (k - 1.5) * SP : CX + 0.75 + (k - 1.5) * SP;
  const ROWC = P ? 0 : CX + 0.75, ROWW = P ? 4 * SP + 0.1 : 4 * SP + 0.12;

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
  let focusNow = [];
  function focus(specs, color = C.amber) {
    const a = focusNow.map(leave);
    focusNow = specs.map(([x, y, w, h]) => rect(x, y, w, h, color, null, 2.5));
    focusNow.forEach(r => a.push(new M.Create(r, { runTime: 0.3 })));
    return a;
  }
  const rowSpec = r => [ROWC, (ROWS[r].card + ROWS[r].block) / 2 - 0.05, ROWW, CH + (P ? 0.95 : 0.85)];
  const blockSpec = (r, k) => [cx(k), ROWS[r].block, CW + 0.14, P ? 0.56 : 0.5];

  // two rows of four North parcels (built by a function so they can be drawn again later as new objects)
  const BH2 = P ? 0.42 : 0.36, CQ = CH / 2;
  const makeRows = () => [0, 1].map(r => {
    const y = ROWS[r].card;
    return {
      lab: label(r ? 'AFTER THE RULE' : 'BEFORE THE RULE', ROWS[r].lab[0], ROWS[r].lab[1], P ? 4.5 : 1.95, r ? C.amber : C.muted, P ? 18 : 17, true, true),
      frames: [0, 1, 2, 3].map(k => new M.VGroup(rect(cx(k), y, CW, CH, C.line, C.card, 1.5),
        label('North', cx(k), y + CQ * 0.6, CW - 0.15, C.cyan, P ? 19 : 18, false, true))),
      bubbles: [0, 1, 2, 3].map(k => new M.VGroup(rect(cx(k), y, CW - 0.12, P ? 0.36 : 0.32, C.amber, C.bg, 1.5),
        label('High score', cx(k), y, CW - 0.24, C.amber, P ? 16 : 15, true, true))),
      routes: [0, 1, 2, 3].map(k => label(r ? 'New route' : 'Original route', cx(k), y - CQ * 0.6, CW - 0.1, r ? C.amber : C.ink, P ? 16 : 15)),
      blocks: [0, 1, 2, 3].map(k => {
        const late = r ? k === 0 : k < 3, col = late ? RED : C.green;
        const b = rect(cx(k), ROWS[r].block, CW, BH2, col, col, 1.5, 0.85);
        return new M.VGroup(b, label(late ? 'LATE' : 'ON TIME', cx(k), ROWS[r].block, CW - 0.15, C.bg, P ? 17 : 15, true, true));
      })
    };
  });
  let rows = makeRows();
  const rowParts = r => [rows[r].lab, ...rows[r].frames, ...rows[r].bubbles, ...rows[r].routes, ...rows[r].blocks];

  await until(S(0));
  await play(...say('A MODEL FLAGS PARCELS THAT MAY BE LATE'),
    ...box([[0, 'Late-delivery model', C.cyan], [1, 'High score = may be late']]));
  await until(S(1)); await play(...box([[2, 'High score → worker reviews', C.amber]]));
  await until(S(2)); await play(...say('A NEW ROUTE CAN HELP', C.green), ...box([[3, 'May choose a different route']]));
  await until(S(3)); await play(...say('WHAT IF THE MODEL LEARNS FROM THIS?', C.amber));

  await until(S(4));
  await play(...say('BEFORE THE RULE: 4 NORTH PARCELS'), enter(rows[0].lab),
    new M.LaggedStart(rows[0].frames.map(enter), { lagRatio: 0.2, runTime: 1.0 }));
  await until(S(5)); await play(...say('ALL 4: HIGH SCORES', C.amber), ...rows[0].bubbles.map(enter));
  await until(S(6)); await play(...say('ALL 4: ORIGINAL ROUTES', C.muted), ...rows[0].routes.map(enter));
  const outSay = ['1ST: LATE', '2ND: LATE', '3RD: LATE', '4TH: ON TIME'];
  for (let k = 0; k < 4; k++) {
    await until(S(7 + k));
    await play(enter(rows[0].blocks[k]), ...say(outSay[k], k < 3 ? RED : C.green));
  }
  await until(S(11));
  await play(...say('3 RED BLOCKS · 1 GREEN BLOCK'), ...rows[0].blocks.map((b, k) => emphasis(b, k < 3 ? RED : C.green)));
  await until(S(12));
  await play(...say('3 OF 4 ARRIVE LATE', RED),
    ...box([[0, 'Before the rule', C.muted], [1, 'Late: 3 of 4', RED], [2, ''], [3, '']]));

  await until(S(13)); await play(...say('NOW: A NEW RULE', C.amber));
  await until(S(14));
  await play(...box([[0, 'New rule', C.amber], [1, 'High score → review'], [2, 'Change the route if needed']]));
  await until(S(15));
  await play(...say('ANOTHER 4 SIMILAR NORTH PARCELS'), enter(rows[1].lab),
    new M.LaggedStart(rows[1].frames.map(enter), { lagRatio: 0.2, runTime: 1.0 }));
  await until(S(16)); await play(...say('ALL 4: HIGH SCORES', C.amber), ...rows[1].bubbles.map(enter));
  await until(S(17)); await play(...focus([rowSpec(1)]), ...say('WORKERS REVIEW ALL 4', C.amber));
  await until(S(18)); await play(...say('A DIFFERENT ROUTE FOR EACH', C.amber), ...rows[1].routes.map(enter));
  await until(S(19));
  await play(...focus([]), ...say('REROUTING = CHANGING THE ROUTE', C.amber), ...box([[3, 'Rerouting = changing the route', C.amber]]));
  await until(S(20)); await play(...say('THE NEW RESULTS'));
  await until(S(21)); await play(enter(rows[1].blocks[0]), ...say('ONLY 1 LATE', RED));
  await until(S(22)); await play(...rows[1].blocks.slice(1).map(enter), ...say('3 ON TIME', C.green));
  await until(S(23));
  await play(...say('1 RED · 3 GREEN, UNDER THE FIRST ROW'), ...rows[1].blocks.map((b, k) => emphasis(b, k ? C.green : RED)));
  await until(S(24));
  await play(...say('SAVED FOR FUTURE TRAINING', C.violet),
    ...box([[0, 'Saved results', C.violet], [1, 'Used for future training'], [2, ''], [3, '']]));
  await until(S(25)); await play(...box([[2, 'Training = teaching a model'], [3, 'with past examples']]));

  // 26-31 the loop
  const LC = P ? [0, 1.0] : [CX, -0.35], RX = P ? 2.3 : 2.4, RY = P ? 1.35 : 1.35;
  const npos = [[LC[0], LC[1] + RY], [LC[0] + RX, LC[1]], [LC[0], LC[1] - RY], [LC[0] - RX, LC[1]]];
  const ncol = [C.cyan, C.amber, C.green, C.violet];
  const nodes = ['PREDICTIONS', 'DECISIONS', 'RESULTS', 'NEXT TRAINING'].map((s, i) => {
    const p = pill(s, ncol[i], P ? 15 : 17); p.moveTo([...npos[i], 0]); return p;
  });
  const arrow = (i, j) => {
    const a = npos[i], b = npos[j], f = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0];
    return new M.Arrow({ start: f(0.3), end: f(0.72), color: ncol[i], strokeWidth: 3 });
  };
  const arrows = [arrow(0, 1), arrow(1, 2), arrow(2, 3), arrow(3, 0)];
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(...rowParts(0), ...rowParts(1)), { runTime: 0.4 }),
    enter(nodes[0]), enter(nodes[1]), ...say('PREDICTIONS → DECISIONS'));
  await play(new M.Create(arrows[0]));
  await until(S(27)); await play(enter(nodes[2]), new M.Create(arrows[1]), ...say('DECISIONS → RESULTS', C.amber));
  await until(S(28)); await play(enter(nodes[3]), new M.Create(arrows[2]), ...say('RESULTS → NEXT TRAINING', C.green));
  await until(S(29)); await play(new M.Create(arrows[3]), ...say('A CIRCLE', C.violet));
  await until(S(30));
  await play(new M.LaggedStart(nodes.map((n, i) => new M.Indicate(n, { color: ncol[i] })), { lagRatio: 0.5, runTime: 4.5 }));
  await until(S(31));
  await play(...say('THIS CIRCLE = A FEEDBACK LOOP', C.green),
    ...box([[0, 'Feedback loop', C.green], [1, 'Predictions guide decisions'], [2, 'Decisions change results'], [3, 'Results shape next predictions']]));

  // 32-39 measure the change
  await until(S(32));
  await play(new M.FadeOut(new M.VGroup(...nodes, ...arrows), { runTime: 0.4 }), ...say('MEASURE RECORDED LATE DELIVERIES'));
  rows = makeRows();   // new objects: the faded-out ones cannot come back
  await play(...rowParts(0).map(enter), ...rowParts(1).map(enter));
  await until(S(33));
  await play(...say('1 BLOCK = 1 OF 4 = 25%'), ...box([[0, 'Each block', C.cyan], [1, '1 of 4 parcels = 25%'], [2, ''], [3, '']]),
    emphasis(rows[0].blocks[0], C.cyan));
  await until(S(34));
  await play(...focus([0, 1, 2].map(k => blockSpec(0, k)), RED), ...box([[2, 'Before: 3 red = 75% late', RED]]));
  await until(S(35));
  await play(...focus([blockSpec(1, 0)], RED), ...box([[3, 'After: 1 red = 25% late', RED]]));
  await until(S(36));
  await play(...focus([]), ...say('75 − 25 = 50', C.amber), ...box([[0, 'Change', C.amber], [1, '75 − 25 = 50'], [2, ''], [3, '']]));
  await until(S(37)); await play(...box([[2, 'Falls by 50 percentage points', C.amber]]));
  await until(S(38)); await play(...say('A SHORT FORMULA'));
  await until(S(39));
  await play(...box([[0, 'Decrease (points)', C.cyan], [1, '= old % − new %'], [2, '= 75 − 25', C.amber], [3, '= 50 points', C.amber]]));

  // 40-43 the model learns from the new results
  await until(S(40));
  await play(...say('THE MODEL LEARNS FROM THE NEW RESULTS', C.violet), ...focus([rowSpec(1)], C.violet));
  await until(S(41));
  await play(...say('LOWER SCORES FOR SIMILAR PARCELS', C.violet),
    ...box([[0, 'Next model', C.violet], [1, 'Lower scores for similar parcels'], [2, ''], [3, '']]));
  await until(S(42)); await play(...say('FEWER REVIEWS', C.muted), ...box([[2, 'Fewer parcels reviewed']]));
  await until(S(43)); await play(...say('SOME MAY STAY ON LATE ROUTES', RED), ...box([[3, 'Some stay on late routes', RED]]));
  await until(S(44));
  await play(...focus([]), ...say('CHECK HOW DECISIONS SHAPE TRAINING DATA', C.green),
    ...box([[0, 'Feedback loop check', C.green], [1, 'Decisions → results'], [2, 'Results → training data'], [3, '']]));

  // 45-49 limits
  await until(S(45));
  await play(...focus([blockSpec(1, 1)], C.pink), ...say('ON TIME AFTER REROUTING ≠ OLD ROUTE WAS SAFE', C.pink));
  await until(S(46));
  await play(...box([[0, 'This parcel on its old route?', C.pink], [1, 'We cannot see it'], [2, ''], [3, '']]));
  await until(S(47));
  await play(...focus([rowSpec(0)], C.muted), ...box([[2, 'The earlier group: other parcels'], [3, 'Still no answer', C.pink]]));
  await until(S(48));
  await play(...focus([]), ...say('RECORD PREDICTIONS AND ROUTE CHANGES'),
    ...box([[0, 'Record both', C.cyan], [1, 'The model’s predictions'], [2, 'The workers’ route changes'], [3, '']]));
  await until(S(49)); await play(...say('PREDICTIONS → DECISIONS → FUTURE TRAINING DATA', C.green));
}

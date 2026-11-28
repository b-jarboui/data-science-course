// 20.2.7 Reference-policy penalties: improving a model without changing it too much.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;

  const BLUE = '#60a5fa';
  const ORANGE = '#fb923c';
  const RCOL = [C.cyan, BLUE, C.pink, ORANGE];
  const LETTERS = ['A', 'B', 'C', 'D'];
  const REF = [40, 40, 15, 5];
  const REW_STR = ['+2.0', '+0.5', '−1.5', '+3.0'];

  const PILL = P ? [0, 2.05, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.32, 0] : [4.45, -0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 18);

  // Formula box: one at a time, cleanly sized for phone and laptop
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 18 : 19, lh = P ? 0.36 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.3;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.7 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }

  // Track neuron value labels created by L.net().value so they fade out cleanly with the network
  const netVals = new Map();
  function setVal(N, l, i, s, col = C.ink) {
    const anims = N.value(l, i, s, col);
    if (!netVals.has(N)) netVals.set(N, new Map());
    netVals.get(N).set(`${l}:${i}`, anims[0].mobject);
    return anims;
  }
  const getNetVals = N => [...(netVals.get(N)?.values() || [])];

  function makeCard(x, y, w, h, border = C.line, fillOp = 0.92) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color: border, strokeWidth: 2 });
    r.setFill(C.card, fillOp); r.moveTo([x, y, 0]);
    return r;
  }

  function makeBadge(letter, col, x, y, sz = 0.48) {
    const bg = new M.RoundedRectangle({ width: sz, height: sz, cornerRadius: 0.11, color: col, strokeWidth: 2 });
    bg.setFill(col, 0.2); bg.moveTo([x, y, 0]);
    const tx = T(letter, P ? 17 : 18, col, true, true); tx.moveTo([x, y, 0]);
    return new M.VGroup(bg, tx);
  }

  // =========================================================================
  // BEATS 0–2: Campus writing assistant learns higher rewards, turns strange
  // =========================================================================
  const introNet = net({
    layers: [2, 3, 2],
    center: P ? [0.2, 0.05, 0] : [-2.0, -0.5, 0],
    width: P ? 4.0 : 5.0,
    height: P ? 2.1 : 2.3,
    r: P ? 0.22 : 0.24,
    names: P ? ['Q', 'ctx'] : ['prompt', 'context'],
  });
  const replyTag = T('reply', P ? 16 : 17, C.amber, true, true).moveTo([introNet.pos(2, 0)[0], introNet.pos(2, 0)[1] + 0.62, 0]);
  const introCardPos = P ? [0, -2.85, 0] : [3.85, -0.5, 0];
  const introCardW = P ? 6.6 : 4.5, introCardH = P ? 1.55 : 1.55;
  const rewCard = new M.VGroup(
    makeCard(introCardPos[0], introCardPos[1], introCardW, introCardH, C.green),
    T('REWARD', P ? 16 : 17, C.muted, true, true).moveTo([introCardPos[0], introCardPos[1] + 0.36, 0]),
    T('+0.9  →  +2.4  ↑', P ? 24 : 26, C.green, true, true).moveTo([introCardPos[0], introCardPos[1] - 0.18, 0])
  );

  await until(S(0));
  await play(
    new M.FadeIn(introNet.group, { runTime: 0.9 }), new M.FadeIn(replyTag),
    ...setVal(introNet, 0, 0, 'Q', C.violet),
    ...setVal(introNet, 0, 1, 'C', C.violet),
    ...setVal(introNet, 2, 0, '.6', C.cyan),
    ...setVal(introNet, 2, 1, '.4', C.amber),
    ...introNet.flow(0, C.cyan),
    new M.FadeIn(rewCard, { runTime: 0.9 }),
    ...say('WRITING ASSISTANT LEARNS HIGHER REWARDS', C.green)
  );

  // Beat 1: answers start becoming strange
  const strangeCard = new M.VGroup(
    makeCard(introCardPos[0], introCardPos[1], introCardW, introCardH, ORANGE),
    T('ASSISTANT REPLY', P ? 16 : 17, ORANGE, true, true).moveTo([introCardPos[0], introCardPos[1] + 0.38, 0]),
    T('“At six! At six! At six!”', P ? 20 : 21, C.ink, false, true).moveTo([introCardPos[0], introCardPos[1] - 0.18, 0])
  );
  await until(S(1));
  await play(
    ...introNet.weight(0, 0, 1, 0.95),
    ...introNet.weight(0, 1, 2, -0.9),
    ...introNet.weight(1, 1, 1, 1.0),
    ...setVal(introNet, 2, 0, '.1', C.muted),
    ...setVal(introNet, 2, 1, '.9', ORANGE),
    new M.FadeOut(rewCard, { runTime: 0.5 }),
    new M.FadeIn(strangeCard, { runTime: 0.8 }),
    ...say('ANSWERS BECOME STRANGE', ORANGE)
  );

  // Beat 2: improve without losing useful behaviour
  const goalCard = new M.VGroup(
    makeCard(introCardPos[0], introCardPos[1], introCardW, introCardH, C.cyan),
    T('↑ Higher rewards', P ? 20 : 21, C.green, true, true).moveTo([introCardPos[0], introCardPos[1] + 0.30, 0]),
    T('✓ Keep useful habits', P ? 20 : 21, C.cyan, true, true).moveTo([introCardPos[0], introCardPos[1] - 0.30, 0])
  );
  await until(S(2));
  await play(
    new M.FadeOut(strangeCard, { runTime: 0.5 }),
    new M.FadeIn(goalCard, { runTime: 0.8 }),
    ...say('IMPROVE WITHOUT LOSING GOOD HABITS', C.amber)
  );

  // =========================================================================
  // BEATS 3–11: The library question, 4 replies, starting chances & rewards
  // =========================================================================
  const qPos = P ? [0, 1.25, 0] : [-2.2, 1.18, 0];
  const qW = P ? 7.2 : 8.6;
  const qCard = new M.VGroup(
    makeCard(qPos[0], qPos[1], qW, 0.56, C.cyan),
    T('Question: “When does the library close on Friday?”', P ? 15 : 18, C.ink, false, true).moveTo(qPos)
  );

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(introNet.group, ...getNetVals(introNet), goalCard, replyTag), { runTime: 0.6 }),
    new M.FadeIn(qCard, { runTime: 0.8 }),
    ...say('OUR QUESTION', C.cyan)
  );

  const rRowY = P ? [0.22, -1.06, -2.34, -3.62] : [0.35, -0.55, -1.45, -2.35];
  const rCardX = P ? 0 : -2.2;
  const rCardW = P ? 7.2 : 8.6;
  const rCardH = P ? 1.10 : 0.74;
  const rTexts = P
    ? ['“At six.”', 'Correct, but long answer', '“At nine.”', '“At six! At six! At six!”']
    : ['“At six.”', 'Correct, but a long answer', '“At nine.”', '“At six! At six! At six!”'];

  const rCards = LETTERS.map((ch, k) => {
    const y = rRowY[k];
    const bg = makeCard(rCardX, y, rCardW, rCardH, RCOL[k], 0.88);
    const ty = P ? y + 0.25 : y;
    const badge = makeBadge(ch, RCOL[k], P ? -3.18 : -6.08, ty, P ? 0.44 : 0.48);
    const tx = T(rTexts[k], P ? 15 : 16, C.ink);
    const txLeft = P ? -2.82 : -5.66;
    tx.moveTo([txLeft + tx.getWidth() / 2, ty, 0]);
    return new M.VGroup(bg, badge, tx);
  });

  // phone: empty rows first, so the lower part of the screen is not empty while the replies are read
  const placeholders = LETTERS.map((ch, k) => new M.VGroup(makeCard(rCardX, rRowY[k], rCardW, rCardH, C.line, 0.6),
    makeBadge(ch, RCOL[k], P ? -3.18 : -6.08, P ? rRowY[k] + 0.25 : rRowY[k], P ? 0.44 : 0.48)));
  // Beats 4–7: reveal replies A, B, C, D one by one
  await until(S(4));
  await play(new M.FadeIn(rCards[0], { runTime: 0.7 }), ...(P ? placeholders.slice(1).map(c => new M.FadeIn(c, { runTime: 0.6 })) : []), ...say('REPLY A: BRIEF & CORRECT', C.cyan));
  await until(S(5));
  await play(new M.FadeIn(rCards[1], { runTime: 0.7 }), ...say('REPLY B: CORRECT, BUT LONG', BLUE));
  await until(S(6));
  await play(new M.FadeIn(rCards[2], { runTime: 0.7 }), ...say('REPLY C: WRONG TIME', C.pink));
  await until(S(7));
  await play(new M.FadeIn(rCards[3], { runTime: 0.7 }), ...say('REPLY D: STRANGE REPETITION', ORANGE));

  // Beat 8: initial chances 40%, 40%, 15%, 5%
  const initX0 = P ? -2.82 : -1.75;
  const initW = P ? 4.85 : 2.85;
  const initBarY = k => P ? rRowY[k] - 0.26 : rRowY[k];
  function makeInitBar(k, pct) {
    const w = Math.max(0.06, initW * pct / 100);
    const b = new M.Rectangle({ width: w, height: P ? 0.24 : 0.28, color: RCOL[k], strokeWidth: 1 });
    b.setFill(RCOL[k], pct < 1 ? 0.2 : 0.85);
    b.moveTo([initX0 + w / 2, initBarY(k), 0]);
    return b;
  }
  const initBars = REF.map((v, k) => makeInitBar(k, v));
  let initPcts = REF.map((v, k) => {
    const t = T(`${v}%`, P ? 16 : 16, RCOL[k], true, true);
    t.moveTo([initX0 + initW + (P ? 0.58 : 0.45), initBarY(k), 0]);
    return t;
  });

  await until(S(8));
  await play(
    new M.LaggedStart(initBars.map((b, k) => new M.FadeIn(b)), { lagRatio: 0.14, runTime: 1.1 }),
    new M.LaggedStart(initPcts.map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 1.1 }),
    ...say('STARTING PROBABILITIES: 40% · 40% · 15% · 5%', C.cyan)
  );

  // Beats 9–10: reward model scores
  const rewHeader = P ? null : T('REWARD MODEL', 16, C.amber, true, true).moveTo([4.35, 1.18, 0]);
  const rewBadges = LETTERS.map((ch, k) => {
    const col = k === 2 ? C.pink : (k === 3 ? ORANGE : C.green);
    if (P) {
      const p = pill(REW_STR[k], col, 16);
      p.moveTo([2.65, rRowY[k] + 0.25, 0]);
      return p;
    }
    const card = makeCard(4.35, rRowY[k], 3.4, 0.64, col, 0.9);
    const lab = T(`${ch}:  reward ${REW_STR[k]}`, 19, col, true, true).moveTo([4.35, rRowY[k], 0]);
    return new M.VGroup(card, lab);
  });

  await until(S(9));
  await play(
    ...(rewHeader ? [new M.FadeIn(rewHeader, { runTime: 0.6 })] : []),
    new M.FadeIn(rewBadges[0], { runTime: 0.8 }),
    new M.FadeIn(rewBadges[1], { runTime: 0.8 }),
    ...say('REWARDS: A = +2.0,  B = +0.5', C.green)
  );

  await until(S(10));
  await play(
    new M.FadeIn(rewBadges[2], { runTime: 0.8 }),
    new M.FadeIn(rewBadges[3], { runTime: 0.8 }),
    new M.Flash(rewBadges[3], { color: ORANGE, runTime: 0.9 }),
    ...say('C = −1.5  ·  D MISTAKENLY GETS +3.0!', ORANGE)
  );

  // Beat 11: without limits, D takes over (~97%)
  const takeover = [2, 1, 0, 97];
  const nextInitPcts = takeover.map((v, k) => {
    const t = T(`${v}%`, P ? 16 : 16, v > 0 ? RCOL[k] : C.muted, true, true);
    t.moveTo([initX0 + initW + (P ? 0.58 : 0.45), initBarY(k), 0]);
    return t;
  });
  await until(S(11));
  await play(
    ...initBars.map((b, k) => new M.Transform(b, makeInitBar(k, takeover[k]), { runTime: 1.3 })),
    ...initPcts.map(t => new M.FadeOut(t, { runTime: 0.5 })),
    ...nextInitPcts.map(t => new M.FadeIn(t, { runTime: 0.8 })),
    ...say('NO LIMITS → D TAKES OVER!', ORANGE)
  );
  initPcts = nextInitPcts;

  // =========================================================================
  // BEATS 12–13: Everyday analogy — student and teacher
  // =========================================================================
  function personIcon(x, y, col, label) {
    const head = new M.Circle({ radius: 0.30, color: col, strokeWidth: 3 });
    head.setFill(C.card, 0.95); head.moveTo([x, y + 0.52, 0]);
    const body = new M.Arc({ radius: 0.52, startAngle: 0, angle: Math.PI, color: col, strokeWidth: 3 });
    body.setFill(col, 0.25); body.moveTo([x, y - 0.08, 0]);
    const tx = T(label, P ? 17 : 19, col, true, true); tx.moveTo([x, y - 0.58, 0]);
    return new M.VGroup(head, body, tx);
  }
  const stX = P ? -1.85 : -2.6, teX = P ? 1.85 : 2.6, peY = P ? -0.35 : -0.35;
  const student = personIcon(stX, peY, C.cyan, 'STUDENT');
  const teacher = personIcon(teX, peY, C.amber, 'TEACHER');
  const guideArr = new M.Arrow({ start: [teX - 0.85, peY + 0.2, 0], end: [stX + 0.85, peY + 0.2, 0], color: C.amber, strokeWidth: 3 });

  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(
      qCard, ...rCards, ...initBars, ...initPcts, ...rewBadges, ...(rewHeader ? [rewHeader] : []), ...(P ? placeholders.slice(1) : [])
    ), { runTime: 0.6 }),
    new M.FadeIn(student, { runTime: 0.8 }),
    new M.FadeIn(teacher, { runTime: 0.8 }),
    new M.Create(guideArr, { runTime: 0.8 }),
    ...say('A STUDENT LEARNING WITH A TEACHER', C.cyan)
  );

  const habit1 = pill('↑ IMPROVE WRITING', C.green, P ? 16 : 18).moveTo(P ? [0, -2.25, 0] : [-2.1, -1.95, 0]);
  const habit2 = pill('✓ KEEP EXISTING STRENGTHS', C.cyan, P ? 16 : 18).moveTo(P ? [0, -3.15, 0] : [2.3, -1.95, 0]);
  await until(S(13));
  await play(
    new M.FadeIn(habit1, { runTime: 0.7 }),
    new M.FadeIn(habit2, { runTime: 0.7 }),
    new M.Indicate(student, { color: C.green, runTime: 0.9 }),
    ...say('IMPROVE WITHOUT LOSING WHAT WORKS', C.green)
  );

  // =========================================================================
  // BEATS 14–18: Two identical neural networks (L.net) — Frozen vs Learning
  // =========================================================================
  const netW = P ? 4.2 : 4.0, netH = P ? 2.0 : 2.25, netR = P ? 0.21 : 0.23;
  const refCenter = P ? [0.0, -0.05, 0] : [-3.3, -0.55, 0];
  const learnCenter = P ? [0.0, -3.55, 0] : [3.4, -0.55, 0];
  const netNames = P ? ['Q', 'ctx'] : ['prompt', 'context'];

  const refNet = net({ layers: [2, 3, 4], center: refCenter, width: netW, height: netH, r: netR, names: netNames });
  const learnNet = net({ layers: [2, 3, 4], center: learnCenter, width: netW, height: netH, r: netR, names: netNames });
  // Color output neurons to match A, B, C, D
  for (let k = 0; k < 4; k++) {
    refNet.nodes[2][k].setColor(RCOL[k]);
    learnNet.nodes[2][k].setColor(RCOL[k]);
  }
  const makeNetOutTags = N => LETTERS.map((ch, k) => {
    const p = N.pos(2, k);
    return T(ch, P ? 16 : 17, RCOL[k], true, true).moveTo([p[0] + netR + 0.30, p[1], 0]);
  });
  const refOutTags = makeNetOutTags(refNet);
  const learnOutTags = makeNetOutTags(learnNet);
  const refTitle = T('REFERENCE MODEL (FROZEN)', P ? 16 : 17, C.violet, true, true)
    .moveTo([refCenter[0], refCenter[1] + netH / 2 + (P ? 0.48 : 0.55), 0]);
  const learnTitle = T('LEARNING MODEL', P ? 16 : 17, C.cyan, true, true)
    .moveTo([learnCenter[0], learnCenter[1] + netH / 2 + (P ? 0.48 : 0.55), 0]);

  // Shared starting weights on both networks
  const initWeights = [
    [0, 0, 0, 0.7], [0, 0, 1, 0.5], [0, 1, 1, 0.6], [0, 1, 2, -0.5],
    [1, 0, 0, 0.8], [1, 1, 1, 0.75], [1, 2, 2, -0.6], [1, 2, 3, 0.25],
  ];

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(student, teacher, guideArr, habit1, habit2), { runTime: 0.6 }),
    new M.FadeIn(refNet.group, { runTime: 0.9 }),
    new M.FadeIn(refTitle, { runTime: 0.8 }),
    ...refOutTags.map(t => new M.FadeIn(t, { runTime: 0.8 })),
    ...REF.flatMap((v, k) => setVal(refNet, 2, k, String(v), RCOL[k])),
    ...say('KEEP A FROZEN COPY BEFORE TRAINING', C.violet)
  );

  // Beat 15: two identical networks with the same weights
  await until(S(15));
  await play(
    new M.FadeIn(learnNet.group, { runTime: 0.9 }),
    new M.FadeIn(learnTitle, { runTime: 0.8 }),
    ...learnOutTags.map(t => new M.FadeIn(t, { runTime: 0.8 })),
    ...REF.flatMap((v, k) => setVal(learnNet, 2, k, String(v), RCOL[k])),
    ...initWeights.flatMap(([l, i, j, w]) => [...refNet.weight(l, i, j, w), ...learnNet.weight(l, i, j, w)]),
    ...say('TWO IDENTICAL NETWORKS · SAME WEIGHTS', C.cyan)
  );

  // Beat 16: training changes weights of learning model while reference stays frozen
  const lockPill = pill('FROZEN', C.violet, 15).moveTo([refCenter[0], refCenter[1] - netH / 2 - (P ? 0.42 : 0.50), 0]);
  const updPill = pill('WEIGHTS CHANGING', C.amber, 15).moveTo([learnCenter[0], learnCenter[1] - netH / 2 - (P ? 0.42 : 0.50), 0]);
  const changedVals = [22, 10, 3, 65];
  await until(S(16));
  await play(
    ...learnNet.flow(0, C.amber),
    ...learnNet.weight(0, 1, 2, 0.95),
    ...learnNet.weight(1, 0, 0, 0.35),
    ...learnNet.weight(1, 1, 1, -0.45),
    ...learnNet.weight(1, 2, 3, 1.0),
    ...changedVals.flatMap((v, k) => setVal(learnNet, 2, k, String(v), RCOL[k])),
    new M.FadeIn(lockPill, { runTime: 0.7 }),
    new M.FadeIn(updPill, { runTime: 0.7 }),
    ...say('ONE NETWORK CHANGES · ONE STAYS FROZEN', C.amber)
  );

  // Beat 17: chances form the model's policy
  await until(S(17));
  await play(
    new M.LaggedStart([...refNet.nodes[2], ...learnNet.nodes[2]].map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('OUTPUT PROBABILITIES = THE POLICY', C.cyan)
  );

  // Beat 18: unchanged model's policy = reference policy
  const refOutX = refNet.pos(2, 0)[0];
  const refBox = new M.RoundedRectangle({ width: netR * 2 + 0.95, height: netH + netR * 2 + 0.30, cornerRadius: 0.16, color: C.violet, strokeWidth: 3 });
  refBox.moveTo([refOutX + 0.22, refCenter[1], 0]);
  await until(S(18));
  await play(
    new M.Create(refBox, { runTime: 0.8 }),
    new M.Indicate(refTitle, { color: C.violet, runTime: 0.9 }),
    ...say('REFERENCE MODEL → REFERENCE POLICY', C.violet)
  );

  // =========================================================================
  // BEATS 19–54: Main Policy Bar Chart (Ghost reference behind active bars)
  // =========================================================================
  const BAR_X0 = P ? -2.25 : -4.95;
  const BAR_W = P ? 4.65 : 5.35;
  const barY = P ? [0.60, -0.45, -1.50, -2.55] : [0.68, -0.18, -1.04, -1.90];
  const axisTop = P ? 1.05 : 1.05, axisBot = P ? -3.00 : -2.30;

  // Legend above bars
  const legY = P ? 1.35 : 1.30;
  const legX = P ? 0 : -2.3;
  const ghostSw = new M.Rectangle({ width: 0.34, height: 0.20, color: C.muted, strokeWidth: 2 });
  ghostSw.setFill(C.muted, 0.25); ghostSw.moveTo([legX - 2.35, legY, 0]);
  const ghostLegT = T('reference', P ? 16 : 15, C.muted).moveTo([legX - 1.15, legY, 0]);
  const curSw = new M.Rectangle({ width: 0.34, height: 0.16, color: C.cyan, strokeWidth: 1 });
  curSw.setFill(C.cyan, 0.85); curSw.moveTo([legX + 0.55, legY, 0]);
  const curLegT = T('learning model', P ? 16 : 15, C.cyan).moveTo([legX + 1.68, legY, 0]);
  const legend = new M.VGroup(ghostSw, ghostLegT, curSw, curLegT);

  // Axis & grid ticks
  const yAxis = new M.Line({ start: [BAR_X0, axisTop, 0], end: [BAR_X0, axisBot, 0], color: C.muted, strokeWidth: 2 });
  const xTicks = [0, 50, 100].map(v => {
    const x = BAR_X0 + BAR_W * v / 100;
    const gl = new M.DashedLine({ start: [x, axisTop, -0.01], end: [x, axisBot, -0.01], color: C.grid, strokeWidth: 1 });
    const lb = T(`${v}%`, P ? 16 : 15, C.muted, true).moveTo([x, axisBot - 0.24, 0]);
    return new M.VGroup(gl, lb);
  });

  // Row badges & reward tags
  const rowLabels = LETTERS.map((ch, k) => {
    const badge = makeBadge(ch, RCOL[k], P ? -3.35 : -6.28, barY[k], P ? 0.44 : 0.46);
    const rtag = T(REW_STR[k], P ? 15 : 14, k === 2 ? C.pink : (k === 3 ? ORANGE : C.muted), true)
      .moveTo([P ? -2.72 : -5.54, barY[k], 0]);
    return new M.VGroup(badge, rtag);
  });

  // Ghost reference bars behind
  const ghostBars = REF.map((v, k) => {
    const w = BAR_W * v / 100;
    const g = new M.Rectangle({ width: w, height: P ? 0.56 : 0.50, color: C.muted, strokeWidth: 2 });
    g.setFill(C.muted, 0.22);
    g.moveTo([BAR_X0 + w / 2, barY[k], -0.005]);
    return g;
  });

  // Active learning bars in front
  function makeBar(k, pct) {
    const w = Math.max(0.05, BAR_W * pct / 100);
    const b = new M.Rectangle({ width: w, height: P ? 0.34 : 0.30, color: RCOL[k], strokeWidth: 1 });
    b.setFill(RCOL[k], pct < 0.5 ? 0.18 : 0.88);
    b.moveTo([BAR_X0 + w / 2, barY[k], 0.005]);
    return b;
  }
  function makePctTxt(k, pct) {
    const w = Math.max(0.05, BAR_W * pct / 100);
    const t = T(`${pct}%`, P ? 16 : 17, pct > 0 ? RCOL[k] : C.muted, true, true);
    t.moveTo([BAR_X0 + w + (P ? 0.48 : 0.52), barY[k], 0.01]);
    return t;
  }

  let curP = REF.slice();
  const curBars = REF.map((v, k) => makeBar(k, v));
  const curPcts = REF.map((v, k) => makePctTxt(k, v));

  function setPolicy(nextP, runTime = 0.9) {
    const anims = [];
    for (let k = 0; k < 4; k++) {
      if (nextP[k] === curP[k]) continue;
      anims.push(new M.Transform(curBars[k], makeBar(k, nextP[k]), { runTime }));
      const nt = makePctTxt(k, nextP[k]);
      anims.push(new M.FadeOut(curPcts[k], { runTime: runTime * 0.45 }));
      anims.push(new M.FadeIn(nt, { runTime: runTime * 0.65 }));
      curPcts[k] = nt;
      curP[k] = nextP[k];
    }
    return anims;
  }

  // Beat 19: draw ghost reference bars behind changing bars
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(
      refNet.group, learnNet.group, ...getNetVals(refNet), ...getNetVals(learnNet),
      ...refOutTags, ...learnOutTags, refTitle, learnTitle, lockPill, updPill, refBox
    ), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(legend, yAxis, ...xTicks, ...rowLabels), { runTime: 0.8 }),
    new M.LaggedStart(ghostBars.map(g => new M.FadeIn(g)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.LaggedStart(curBars.map((b, k) => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.LaggedStart(curPcts.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.9 }),
    ...say('REFERENCE BARS BEHIND LEARNING BARS', C.violet)
  );

  // Beat 20: learning model changes — see how far it moves from reference
  await until(S(20));
  await play(
    ...setPolicy([25, 15, 5, 55], 1.1),
    ...say('SEE HOW FAR PROBABILITIES MOVE', C.amber)
  );

  // Beat 21: drift
  const dRefEnd = BAR_X0 + BAR_W * 0.05;
  const dCurEnd = BAR_X0 + BAR_W * 0.55;
  const driftArr = new M.Arrow({ start: [dRefEnd, barY[3] + 0.38, 0], end: [dCurEnd, barY[3] + 0.38, 0], color: C.amber, strokeWidth: 3 });
  const driftTxt = T('drift', P ? 15 : 16, C.amber, true, true).moveTo([(dRefEnd + dCurEnd) / 2, barY[3] + 0.60, 0]);
  await until(S(21));
  await play(
    new M.Create(driftArr, { runTime: 0.8 }),
    new M.FadeIn(driftTxt, { runTime: 0.7 }),
    ...say('DRIFT = DISTANCE FROM REFERENCE', C.amber)
  );

  // Beat 22: subtract points from rewards to discourage drift
  await until(S(22));
  await play(
    ...fbox([['penalised reward =', C.ink], ['  reward − drift cut', C.amber]], C.amber),
    ...say('SUBTRACT SOMETHING FOR DRIFT', C.amber)
  );

  // Beat 23: reference-policy penalty
  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(driftArr, driftTxt), { runTime: 0.5 }),
    ...setPolicy([40, 40, 15, 5], 0.9),
    ...fbox([['penalty', C.cyan], ['more drift → bigger cut', C.muted]], C.cyan),
    ...say('THIS CUT IS A PENALTY', C.cyan)
  );

  // =========================================================================
  // BEATS 24–35: Worked example on reply D (5% → 10% → 20% → 100%)
  // =========================================================================
  const dHiBox = new M.RoundedRectangle({
    width: P ? 7.2 : 8.2, height: P ? 0.82 : 0.72, cornerRadius: 0.14, color: ORANGE, strokeWidth: 2
  });
  dHiBox.moveTo([P ? 0 : -2.4, barY[3], -0.02]);

  await until(S(24));
  await play(
    new M.Create(dHiBox, { runTime: 0.8 }),
    ...say('TEST: INCREASE REPLY D', ORANGE)
  );

  await until(S(25));
  await play(
    new M.Indicate(curBars[3], { color: ORANGE, runTime: 0.9 }),
    ...fbox([['Reply D:  5%  (1× ref)', ORANGE], ['matches reference bar', C.muted]], ORANGE),
    ...say('D = 5%  (EXACTLY MATCHES REFERENCE)', ORANGE)
  );

  await until(S(26));
  await play(
    ...fbox([['D = 5%   (1× ref)', ORANGE], ['penalty = 0', C.green], ['reward  = 3.00 − 0 = 3.00', C.amber]], C.green),
    ...say('NO PENALTY → D KEEPS 3.00', C.green)
  );

  await until(S(27));
  await play(
    ...setPolicy([38, 38, 14, 10], 0.9),
    ...fbox([['D = 10%  (2× ref)', ORANGE], ['ratio = 10 ÷ 5 = 2', C.cyan]], ORANGE),
    ...say('D = 10%  (TWICE REFERENCE)', ORANGE)
  );

  await until(S(28));
  await play(
    ...fbox([['ratio = 10 ÷ 5 = 2', C.cyan], ['penalty = ln(ratio)', C.violet], ['        = ln(2)', C.amber]], C.violet),
    ...say('MEASURE WITH NATURAL LOGARITHM', C.violet)
  );

  await until(S(29));
  await play(
    ...fbox([['D = 10%  (2× ref)', ORANGE], ['penalty = ln(2) ≈ 0.69', C.pink]], C.pink),
    ...say('ln(2) ≈ 0.69 PENALTY', C.pink)
  );

  await until(S(30));
  await play(
    ...fbox([['D = 10%  (2× ref)', ORANGE], ['penalty = 0.69', C.pink], ['3.00 − 0.69 = 2.31', C.amber]], C.amber),
    ...say('REWARD 3.00 − 0.69 = 2.31', C.amber)
  );

  await until(S(31));
  await play(
    ...setPolicy([34, 34, 12, 20], 0.9),
    ...fbox([['D = 20%  (4× ref)', ORANGE], ['ratio = 20 ÷ 5 = 4', C.cyan]], ORANGE),
    ...say('D = 20%  (4× REFERENCE)', ORANGE)
  );

  await until(S(32));
  await play(
    ...fbox([['D = 20%  (4× ref)', ORANGE], ['penalty = ln(4) ≈ 1.39', C.pink], ['3.00 − 1.39 = 1.61', C.amber]], C.pink),
    ...say('REWARD 3.00 − 1.39 = 1.61', C.pink)
  );

  await until(S(33));
  await play(
    ...setPolicy([0, 0, 0, 100], 1.1),
    ...fbox([['D = 100% (20× ref)', ORANGE], ['ratio = 100 ÷ 5 = 20', C.cyan]], ORANGE),
    ...say('D = 100%  (20× REFERENCE!)', ORANGE)
  );

  await until(S(34));
  await play(
    ...fbox([['D = 100% (20× ref)', ORANGE], ['penalty = ln(20) ≈ 3.00', C.pink], ['3.00 − 3.00 ≈ 0.00', C.pink]], C.pink),
    ...say('PENALTY ≈ 3.00 → ALMOST NO REWARD!', C.pink)
  );

  await until(S(35));
  await play(
    new M.Indicate(curBars[3], { color: C.pink, runTime: 0.9 }),
    ...fbox([
      ['  5% → cut 0.00 → 3.00', C.green],
      [' 10% → cut 0.69 → 2.31', C.ink],
      [' 20% → cut 1.39 → 1.61', C.amber],
      ['100% → cut 3.00 → 0.00', C.pink],
    ], C.amber),
    ...say('PENALTY GROWS WITH DRIFT', C.amber)
  );

  // =========================================================================
  // BEATS 36–42: KL divergence & comparing whole policies
  // =========================================================================
  await until(S(36));
  await play(
    new M.FadeOut(dHiBox, { runTime: 0.5 }),
    new M.LaggedStart(curBars.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.12, runTime: 1.1 }),
    ...fbox([['All replies combined:', C.violet], ['average penalty across', C.ink], ['current probabilities', C.cyan]], C.violet),
    ...say('COMBINE PENALTIES ACROSS ALL REPLIES', C.violet)
  );

  await until(S(37));
  await play(
    ...fbox([['KL divergence', C.violet], ['= gap between current and', C.ink], ['  reference probabilities', C.muted], ['minus from reward = KL penalty', C.amber]], C.violet),
    ...say('KL DIVERGENCE', C.violet)
  );

  await until(S(38));
  await play(
    ...setPolicy([80, 20, 0, 0], 1.0),
    ...fbox([['Test policy:', C.cyan], ['A = 80%,  B = 20%', C.ink], ['C =  0%,  D =  0%', C.muted]], C.cyan),
    ...say('TEST POLICY: A 80%, B 20%', C.cyan)
  );

  await until(S(39));
  await play(
    ...fbox([['A 80%, B 20%:', C.cyan], ['avg reward = 1.70', C.green], ['KL         = 0.42', C.pink]], C.cyan),
    ...say('AVG REWARD 1.70 · KL 0.42', C.cyan)
  );

  await until(S(40));
  await play(
    ...fbox([['A 80%, B 20%:', C.cyan], ['1.70 − 0.42 = 1.28', C.green]], C.green),
    ...say('FINAL VALUE = 1.28', C.green)
  );

  await until(S(41));
  await play(
    ...setPolicy([100, 0, 0, 0], 1.0),
    ...fbox([['Always A (100%):', C.cyan], ['2.00 − 0.92 = 1.08', C.amber], ['lower than 1.28', C.muted]], C.amber),
    ...say('ALWAYS A: ONLY 1.08', C.amber)
  );

  await until(S(42));
  await play(
    ...setPolicy([0, 0, 0, 100], 1.0),
    ...fbox([['Always D (100%):', ORANGE], ['3.00 − 3.00 ≈ 0.00', C.pink], ['the worst!', C.pink]], C.pink),
    ...say('ALWAYS D: ≈ 0.00!', C.pink)
  );

  // =========================================================================
  // BEATS 43–54: Formula, Strength knob, Best balances (1 vs 10), Trade-off
  // =========================================================================
  await until(S(43));
  await play(
    ...setPolicy([40, 40, 15, 5], 0.9),
    ...fbox([['final value =', C.ink], ['  average reward', C.green], ['− penalty strength × KL', C.pink]], C.cyan),
    ...say('FINAL VALUE = REWARD − STRENGTH × KL', C.cyan)
  );

  // Beat 44: strength knob gauge
  const KCX = P ? 0 : 4.45, KCY = P ? -4.35 : -2.20;
  const KW = P ? 6.2 : 4.1, KH = P ? 1.05 : 0.95;
  const KX0 = KCX - KW * 0.36, KX1 = KCX + KW * 0.36, KY = KCY - 0.14;
  const kx = v => KX0 + (v / 10) * (KX1 - KX0);

  const knobCard = makeCard(KCX, KCY, KW, KH, C.amber, 0.92);
  const knobTrack = new M.Line({ start: [KX0, KY, 0], end: [KX1, KY, 0], color: C.muted, strokeWidth: 4 });
  const kTick0 = T('0', P ? 16 : 14, C.muted, true).moveTo([KX0, KY - 0.24, 0]);
  const kTick1 = T('1', P ? 16 : 14, C.cyan, true).moveTo([kx(1), KY - 0.24, 0]);
  const kTick10 = T('10', P ? 16 : 14, C.violet, true).moveTo([KX1, KY - 0.24, 0]);
  const knobDot = new M.Dot({ point: [kx(1), KY, 0], radius: 0.13, color: C.cyan });
  let knobLab = T('penalty strength = 1', P ? 17 : 18, C.cyan, true, true).moveTo([KCX, KCY + 0.26, 0]);

  function setKnob(v, col = C.cyan, label = `penalty strength = ${v}`) {
    const nd = new M.Dot({ point: [kx(v), KY, 0], radius: 0.13, color: col });
    const nl = T(label, P ? 17 : 18, col, true, true).moveTo([KCX, KCY + 0.26, 0]);
    const a = [
      new M.Transform(knobDot, nd, { runTime: 0.8 }),
      new M.FadeOut(knobLab, { runTime: 0.4 }),
      new M.FadeIn(nl, { runTime: 0.6 }),
    ];
    knobLab = nl;
    return a;
  }

  await until(S(44));
  await play(
    new M.FadeIn(new M.VGroup(knobCard, knobTrack, kTick0, kTick1, kTick10, knobDot, knobLab), { runTime: 0.8 }),
    ...fbox([['penalty strength:', C.amber], ['bigger  → stay closer', C.violet], ['smaller → chase reward', ORANGE]], C.amber),
    ...say('PENALTY STRENGTH: HOW MUCH WE PENALISE DRIFT', C.amber)
  );

  // Beat 45: strength = 1, A about 64%
  await until(S(45));
  await play(
    ...setPolicy([64, 14, 1, 22], 1.1),
    ...fbox([['penalty strength 1 (best):', C.cyan], ['A ≈ 64%', C.cyan]], C.cyan),
    ...say('STRENGTH = 1 → A ≈ 64%', C.cyan)
  );

  // Beat 46: B 14%, C 1%, D 22%
  await until(S(46));
  await play(
    new M.LaggedStart([curBars[1], curBars[2], curBars[3]].map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.16, runTime: 1.2 }),
    ...fbox([['penalty strength 1 (best):', C.cyan], ['A 64%   B 14%', C.ink], ['C  1%   D 22%', ORANGE]], C.cyan),
    ...say('B 14% · C 1% · D 22%', C.cyan)
  );

  // Beat 47: D can still appear, but no longer takes over
  await until(S(47));
  await play(
    new M.Indicate(curBars[3], { color: ORANGE, runTime: 0.9 }),
    ...fbox([['D: 5% → 22% (not 100%)', ORANGE], ['A stays #1 at 64%', C.green], ['drift is under control', C.cyan]], C.green),
    ...say('D NO LONGER TAKES OVER', C.green)
  );

  // Beat 48: increase strength to 10 → bars move back toward reference
  await until(S(48));
  await play(
    ...setKnob(10, C.violet, 'penalty strength = 10'),
    ...setPolicy([44, 38, 12, 6], 1.1),
    ...say('STRENGTH = 10 → MOVES TOWARD REFERENCE', C.violet)
  );

  // Beat 49: 44%, 38%, 12%, 6%
  await until(S(49));
  await play(
    ...fbox([
      ['penalty strength 10 (best):', C.violet],
      ['A 44%   B 38%', C.ink],
      ['C 12%   D  6%', C.muted],
      ['ref: 40, 40, 15, 5', C.muted],
    ], C.violet),
    ...say('44% · 38% · 12% · 6%', C.violet)
  );

  // Beat 50: behaves almost like the original model
  await until(S(50));
  await play(
    new M.LaggedStart(curBars.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('ALMOST LIKE THE REFERENCE MODEL', C.violet)
  );

  // Beat 51: improve rewards while staying close to earlier behaviour
  await until(S(51));
  await play(
    ...setKnob(1, C.green, 'strength = 1'),
    ...setPolicy([64, 14, 1, 22], 1.0),
    ...fbox([['final value =', C.ink], ['  average reward', C.green], ['− penalty strength × KL', C.pink]], C.green),
    ...say('IMPROVE REWARDS + STAY CLOSE', C.green)
  );

  // Beat 52: trap 1 — strength too high
  await until(S(52));
  await play(
    ...setKnob(10, C.violet, 'TOO HIGH (10)'),
    ...setPolicy([44, 38, 12, 6], 0.9),
    ...fbox([['Penalty strength TOO HIGH:', C.violet], ['barely moves from ref', C.muted], ['learns very little', C.amber]], C.violet),
    ...say('TOO HIGH → LEARNS VERY LITTLE', C.violet)
  );

  // Beat 53: trap 2 — strength too low
  await until(S(53));
  await play(
    ...setKnob(0, C.pink, 'TOO LOW (0)'),
    ...setPolicy([2, 1, 0, 97], 0.9),
    ...fbox([['Penalty strength TOO LOW:', C.pink], ['penalty disappears', C.muted], ['D takes over again!', ORANGE]], C.pink),
    ...say('TOO LOW → UNWANTED REPLIES RETURN!', C.pink)
  );

  // Beat 54: recap — balance higher rewards with preserving useful behaviour
  await until(S(54));
  await play(
    ...setKnob(1, C.cyan, 'BALANCED (1)'),
    ...setPolicy([64, 14, 1, 22], 1.0),
    ...fbox([
      ['KL penalty:', C.cyan],
      ['↑ higher rewards', C.green],
      ['✓ keep useful behaviour', C.cyan],
      ['balance with penalty strength', C.amber],
    ], C.cyan),
    ...say('BALANCE REWARDS & STABILITY', C.green)
  );
}

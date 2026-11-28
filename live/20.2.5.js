// 20.2.5 Reward modeling: teaching a model to judge answers.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const PILL = P ? [0, 1.72, 0] : [0, 1.98, 0];
  const BOXP = P ? [0, 3.15, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  const sig = g => 1 / (1 + Math.exp(-g));
  const lossOf = g => Math.log(1 + Math.exp(-g));
  const sgn = v => (v > 0.004 ? '+' : v < -0.004 ? '−' : '') + Math.abs(v).toFixed(2);

  // Formula box: one box at a time, never overlapping data
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.37 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.30, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  function card(w, h, pos, color, lines, textSize = 18) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const lh = textSize * 0.02;
    const top = pos[1] + (lines.length - 1) * lh / 2;
    const ts = lines.map((l, i) => {
      const [txt, col, mono, bold] = Array.isArray(l) ? l : [l, C.ink, false, false];
      const t = T(txt, textSize, col || C.ink, !!mono, !!bold);
      t.moveTo([pos[0], top - i * lh, 0]);
      return t;
    });
    return new M.VGroup(r, ...ts);
  }

  // =========================================================================
  // ACT 1 (0-11): Campus writing assistant, prompt, Reply A vs B, reward idea
  // =========================================================================

  // 0: thousands of replies every day
  const botPos = P ? [0, 0.55, 0] : [-4.2, -0.45, 0];
  const botCard = card(P ? 5.2 : 3.2, P ? 1.0 : 1.4, botPos, C.cyan,
    P ? [['CAMPUS ASSISTANT', C.cyan, true, true], ['1,000s of replies / day', C.muted, false, false]]
      : [['CAMPUS', C.cyan, true, true], ['ASSISTANT', C.cyan, true, true], ['1,000s / day', C.muted, false, false]], P ? 17 : 18);

  const miniCards = [];
  const mcCols = P ? 4 : 6, mcRows = 3;
  const mcX0 = P ? -2.25 : -1.1, mcDx = P ? 1.5 : 1.25, mcY0 = P ? -1.15 : 0.45, mcDy = P ? 0.95 : 0.9;
  for (let r = 0; r < mcRows; r++) {
    for (let c = 0; c < mcCols; c++) {
      const p = [mcX0 + c * mcDx, mcY0 - r * mcDy, 0];
      const col = (r + c) % 3 === 0 ? C.cyan : (r + c) % 3 === 1 ? BLUE : C.muted;
      const box = new M.RoundedRectangle({ width: P ? 1.2 : 1.02, height: 0.62, cornerRadius: 0.1, color: col, strokeWidth: 1.8 });
      box.setFill(C.card, 0.92); box.moveTo(p);
      const l1 = new M.Line({ start: [p[0] - 0.34, p[1] + 0.1, 0], end: [p[0] + 0.34, p[1] + 0.1, 0], color: col, strokeWidth: 2 });
      const l2 = new M.Line({ start: [p[0] - 0.34, p[1] - 0.1, 0], end: [p[0] + 0.14, p[1] - 0.1, 0], color: C.muted, strokeWidth: 2 });
      miniCards.push(new M.VGroup(box, l1, l2));
    }
  }
  await until(S(0));
  await play(new M.FadeIn(botCard), new M.LaggedStart(miniCards.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.5 }), ...say('THOUSANDS OF REPLIES EVERY DAY'));

  // 1: asking people to check every reply takes a lot of time
  const personAt = (x, y) => {
    const hd = new M.Circle({ radius: 0.15, color: C.amber }); hd.setFill(C.amber, 1); hd.moveTo([x, y + 0.32, 0]);
    const bd = new M.Arc({ radius: 0.27, startAngle: 0, angle: Math.PI, color: C.amber }); bd.setFill(C.amber, 1); bd.moveTo([x, y - 0.02, 0]);
    return new M.VGroup(hd, bd);
  };
  const human1 = personAt(P ? -1.4 : -4.65, P ? -4.25 : -2.1);
  const human2 = personAt(P ? -0.5 : -3.75, P ? -4.25 : -2.1);
  const clockPos = P ? [1.2, -4.1, 0] : [-2.3, -2.0, 0];
  const clkRing = new M.Circle({ radius: 0.36, color: C.amber, strokeWidth: 2.5 }); clkRing.setFill(C.card, 0.95); clkRing.moveTo(clockPos);
  const clkH = new M.Line({ start: clockPos, end: [clockPos[0], clockPos[1] + 0.22, 0], color: C.amber, strokeWidth: 2.5 });
  const clkM = new M.Line({ start: clockPos, end: [clockPos[0] + 0.18, clockPos[1] + 0.05, 0], color: C.amber, strokeWidth: 2 });
  const clk = new M.VGroup(clkRing, clkH, clkM);
  const chk1 = T('✓', 22, C.green, true, true); chk1.moveTo([mcX0 + 0.32, mcY0 + 0.16, 0]);
  const chk2 = T('✓', 22, C.green, true, true); chk2.moveTo([mcX0 + mcDx + 0.32, mcY0 + 0.16, 0]);
  const slowTag = T('too slow!', 18, C.amber, true); slowTag.moveTo([clockPos[0] + (P ? 0 : 1.15), clockPos[1] - (P ? 0.62 : 0), 0]);
  await until(S(1));
  await play(new M.FadeIn(human1), new M.FadeIn(human2), new M.FadeIn(clk), new M.FadeIn(slowTag),
    new M.FadeIn(chk1), new M.FadeIn(chk2), ...say('PEOPLE CANNOT CHECK EVERY REPLY', C.amber));

  // 2: can we train another model to judge quality?
  const judgePos = P ? [0, -4.1, 0] : [-4.2, -2.1, 0];
  const judgeCard = card(P ? 5.2 : 3.2, 0.95, judgePos, C.violet, [['MODEL JUDGE  ?', C.violet, true, true]], 18);
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(human1, human2, clk, slowTag, chk1, chk2)),
    new M.FadeIn(judgeCard), new M.Indicate(judgeCard, { color: C.violet }), ...say('CAN A MODEL JUDGE REPLIES?', C.violet));

  // 3: familiar announcement
  const annPos = P ? [0, 0.45, 0] : [0, 0.92, 0];
  const annCard = card(P ? 6.8 : 11.4, P ? 1.15 : 0.88, annPos, C.muted,
    P ? [['ANNOUNCEMENT', C.muted, true, true], ['"The library closes at six', C.ink], ['on Friday for cleaning."', C.ink]]
      : [['ANNOUNCEMENT', C.muted, true, true], ['"The library closes at six on Friday for cleaning."', C.ink]], P ? 17 : 18);
  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(botCard, judgeCard, ...miniCards)),
    new M.FadeIn(annCard), ...say('OUR ANNOUNCEMENT'));

  // 4: student asks question
  const qPos = P ? [0, -0.95, 0] : [0, -0.18, 0];
  const qCard = card(P ? 6.8 : 11.4, P ? 1.0 : 0.82, qPos, C.amber,
    P ? [['QUESTION', C.amber, true, true], ['"When does the library close on Friday?"', C.ink]]
      : [['QUESTION', C.amber, true, true], ['"When does the library close on Friday?"', C.ink]], P ? 16 : 18);
  await until(S(4));
  await play(new M.FadeIn(qCard), ...say('THE STUDENT ASKS', C.amber));

  // 5: Reply A says: at six.
  const aPos = P ? [0, -2.35, 0] : [-3.1, -1.65, 0];
  const aCard = card(P ? 6.8 : 5.2, P ? 1.05 : 1.45, aPos, C.cyan,
    [['REPLY A', C.cyan, true, true], ['"At six."', C.ink, false, true]], P ? 18 : 20);
  await until(S(5));
  await play(new M.FadeIn(aCard), ...say('REPLY A: BRIEF & CORRECT', C.cyan));

  // 6: Reply B gives same correct info, much longer
  const bPos = P ? [0, -3.95, 0] : [3.1, -1.65, 0];
  const bCard = card(P ? 6.8 : 5.6, P ? 1.45 : 1.45, bPos, BLUE,
    [['REPLY B', BLUE, true, true], ['"Thanks for asking! The library will', C.ink], ['close at six this Friday for cleaning."', C.ink]], P ? 15 : 16);
  await until(S(6));
  await play(new M.FadeIn(bCard), ...say('REPLY B: CORRECT, BUT LONG', BLUE));

  // 7: people prefer Reply A
  const prefTag = pill('✓ PREFERRED', C.green, 15);
  prefTag.moveTo(P ? [2.15, -1.85, 0] : [-1.45, -0.92, 0]);
  const cmpTag = pill('A  >  B', C.green, 17);
  cmpTag.moveTo(P ? [0, -5.05, 0] : [0, -2.72, 0]);
  await until(S(7));
  await play(new M.FadeIn(prefTag), new M.FadeIn(cmpTag), new M.Indicate(aCard, { color: C.green }), ...say('PEOPLE PREFER A OVER B', C.green));

  // 8: many examples of such choices
  const ex1 = pill('Library: A > B', C.cyan, 15); ex1.moveTo(P ? [-1.9, -5.05, 0] : [-3.8, -2.72, 0]);
  const ex2 = pill('Gym: A > B', C.cyan, 15); ex2.moveTo(P ? [0.1, -5.05, 0] : [0, -2.72, 0]);
  const ex3 = pill('Café: A > B', C.cyan, 15); ex3.moveTo(P ? [2.05, -5.05, 0] : [3.8, -2.72, 0]);
  await until(S(8));
  await play(new M.FadeOut(cmpTag), new M.LaggedStart([new M.FadeIn(ex1), new M.FadeIn(ex2), new M.FadeIn(ex3)], { lagRatio: 0.2, runTime: 1.0 }),
    ...say('TEACH FROM MANY CHOICES', C.cyan));

  // 9: higher scores to replies people prefer
  const scA = pill('HIGHER REWARD', C.amber, 15); scA.moveTo(P ? [0, -5.0, 0] : [-3.1, -2.72, 0]);
  const scB = pill('LOWER REWARD', BLUE, 15); scB.moveTo(P ? [0, -5.05, 0] : [3.1, -2.72, 0]);
  if (P) scA.moveTo([2.15, -2.35, 0]);
  await until(S(9));
  await play(new M.FadeOut(new M.VGroup(ex1, ex2, ex3, prefTag)), new M.FadeIn(scA), new M.FadeIn(scB), ...say('A HIGHER NUMBER FOR THE PREFERRED REPLY', C.amber));

  // 10: we call this score a reward
  const rewTag = pill('REWARD', C.amber, 17);
  rewTag.moveTo(P ? [2.15, -2.35, 0] : [-3.1, -2.72, 0]);
  await until(S(10));
  await play(new M.FadeOut(scA), new M.FadeIn(rewTag), ...say('THIS NUMBER  =  REWARD', C.amber));

  // 11: a model that learns to give these scores is called a reward model
  await until(S(11));
  await play(new M.Indicate(rewTag, { color: C.green }), ...say('REWARD MODEL', C.green));

  // =========================================================================
  // ACT 2 (12-17): The neural network (L.net)
  // =========================================================================

  const netCfg = {
    layers: [2, 3, 3, 1],
    center: P ? [0.1, -1.65, 0] : [0, -0.55, 0],
    width: P ? 4.0 : 6.6,
    height: P ? 3.1 : 3.0,
    r: P ? 0.27 : 0.30,
    names: ['question', 'reply'],
    outName: 'reward',
    color: C.cyan,
  };
  const N = net(netCfg);
  const netVals = {};
  const setVal = (l, i, s, col = C.ink) => {
    const a = N.value(l, i, s, col);
    netVals[`${l}:${i}`] = a[0].mobject;
    return a;
  };
  const colNames = ['input', 'hidden', 'hidden', 'output'].map((s, l) => {
    const x = N.pos(l, 0)[0];
    const y = netCfg.center[1] - netCfg.height / 2 - (P ? 0.65 : 0.6);
    const t = T(s, P ? 15 : 16, C.muted, true);
    t.moveTo([x, y, 0]);
    return t;
  });

  // 12: columns of connected circles called neurons
  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(annCard, qCard, aCard, bCard, scB, rewTag)), ...say('NEURONS IN COLUMNS', C.cyan));
  await play(
    new M.LaggedStart(N.nodes.flat().map(n => new M.FadeIn(n)), { lagRatio: 0.06, runTime: 1.0 }),
    new M.LaggedStart(N.edges.flat(2).map(e => new M.Create(e)), { lagRatio: 0.02, runTime: 1.1 }),
    new M.FadeIn(new M.VGroup(...colNames))
  );

  // 13: question and one reply enter on the left
  const leftLabels = N.labels.slice(0, 2);
  const outLabel = N.labels[2];
  await until(S(13));
  await play(
    new M.FadeIn(new M.VGroup(...leftLabels)),
    ...setVal(0, 0, 'Q', C.violet),
    ...setVal(0, 1, 'A', C.cyan),
    new M.Indicate(N.nodes[0][0], { color: C.violet }),
    new M.Indicate(N.nodes[0][1], { color: C.cyan }),
    ...say('QUESTION + ONE REPLY ENTER LEFT', C.violet)
  );

  // 14: signals travel through connections with weights
  const initW = [
    [[0.8, -0.5, 0.3], [0.9, 0.4, -0.7]],
    [[0.7, -0.4, 0.6], [-0.8, 0.5, 0.3], [0.4, -0.6, 0.8]],
    [[0.7], [-0.5], [0.6]]
  ];
  const wAnims = [];
  for (let l = 0; l < 3; l++)
    for (let i = 0; i < initW[l].length; i++)
      for (let j = 0; j < initW[l][i].length; j++)
        wAnims.push(...N.weight(l, i, j, initW[l][i][j]));

  await until(S(14));
  await play(...wAnims, ...say('EACH WEIGHT MULTIPLIES ITS NUMBER', C.cyan));
  await play(...N.flow(0, C.cyan), ...setVal(1, 0, '.4', C.cyan), ...setVal(1, 1, '.2', C.cyan), ...setVal(1, 2, '-.1', C.pink));
  await play(...N.flow(1, C.cyan), ...setVal(2, 0, '.3', C.cyan), ...setVal(2, 1, '-.2', C.pink), ...setVal(2, 2, '.1', C.cyan));

  // 15: on the right, one final neuron produces a single reward score
  await until(S(15));
  await play(...N.flow(2, C.amber), new M.FadeIn(outLabel), ...setVal(3, 0, 'r', C.amber), ...say('ONE NUMBER OUT: THE REWARD', C.amber));
  await play(new M.Flash(N.nodes[3][0], { color: C.amber, runTime: 0.7 }));

  // 16: pass reply A and reply B through the same network separately
  const passTagA = pill('PASS 1: REPLY A', C.cyan, 15); passTagA.moveTo(P ? [-1.8, -4.6, 0] : [-2.2, -2.75, 0]);
  const passTagB = pill('PASS 2: REPLY B', BLUE, 15); passTagB.moveTo(P ? [1.8, -4.6, 0] : [2.2, -2.75, 0]);
  await until(S(16));
  await play(...setVal(0, 1, 'A', C.cyan), new M.FadeIn(passTagA), ...N.flow(0, C.cyan), ...say('PASS A, THEN B SEPARATELY', C.cyan));
  await play(...setVal(0, 1, 'B', BLUE), new M.FadeIn(passTagB), ...N.flow(0, BLUE));

  // 17: at the start, both replies receive a reward of zero
  const startA = pill('A  →  0.0', C.cyan, 16); startA.moveTo(P ? [-1.8, -4.6, 0] : [-2.2, -2.75, 0]);
  const startB = pill('B  →  0.0', BLUE, 16); startB.moveTo(P ? [1.8, -4.6, 0] : [2.2, -2.75, 0]);
  await until(S(17));
  await play(new M.FadeOut(new M.VGroup(passTagA, passTagB)), new M.FadeIn(startA), new M.FadeIn(startB),
    ...setVal(3, 0, '0.0', C.amber), ...say('START: BOTH REWARDS = 0', C.amber));

  // =========================================================================
  // ACT 3 & 4 WORKSPACE BUILDER (Number Line + Sigmoid + Loss Curve)
  // =========================================================================

  // Shared coordinates: laptop left/center + right fbox; phone stacked under fbox+pill
  const NL_Y = P ? 0.35 : 0.72;
  const NL_CX = P ? 0 : -2.25;
  const NL_SC = P ? 1.50 : 1.75; // maps [-2, 2]
  const nlx = v => NL_CX + Math.max(-2.1, Math.min(2.1, v)) * NL_SC;

  const SIG_X0 = P ? -2.75 : -6.05, SIG_X1 = P ? 3.15 : -2.45;
  const SIG_Y0 = P ? -2.35 : -2.58, SIG_Y1 = P ? -0.68 : -0.58;
  const sigx = g => SIG_X0 + (Math.max(-3, Math.min(3, g)) + 3) / 6 * (SIG_X1 - SIG_X0);
  const sigy = p => SIG_Y0 + p * (SIG_Y1 - SIG_Y0);

  const LOS_X0 = P ? -2.75 : -1.45, LOS_X1 = P ? 3.15 : 1.85;
  const LOS_Y0 = P ? -5.15 : -2.58, LOS_Y1 = P ? -3.48 : -0.58;
  const losx = k => LOS_X0 + Math.min(10, k) / 10 * (LOS_X1 - LOS_X0);
  const losy = l => LOS_Y0 + Math.min(0.8, l) / 0.8 * (LOS_Y1 - LOS_Y0);

  function createWorkspace() {
    const items = [];
    const track = (...xs) => { items.push(...xs); return xs; };

    // 1) Number line
    const nlLine = new M.Line({ start: [nlx(-2), NL_Y, 0], end: [nlx(2), NL_Y, 0], color: C.muted, strokeWidth: 3 });
    const nlTicks = [-2, -1, 0, 1, 2].map(v => new M.VGroup(
      new M.Line({ start: [nlx(v), NL_Y - 0.08, 0], end: [nlx(v), NL_Y + 0.08, 0], color: C.muted, strokeWidth: 2 }),
      T(v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0', P ? 16 : 16, C.muted, true).moveTo([nlx(v), NL_Y - 0.30, 0])
    ));
    const nlTitle = T('reward', P ? 16 : 15, C.muted);
    nlTitle.moveTo([nlx(2) - 0.45, NL_Y - 0.56, 0]);
    const nlGroup = new M.VGroup(nlLine, ...nlTicks, nlTitle);

    const mkDot = (x, y, col) => {
      const d = new M.Dot({ point: [x, y, 0], radius: 0.13, color: col });
      return d;
    };
    const dotA = mkDot(nlx(0), NL_Y + 0.24, C.cyan);
    const dotB = mkDot(nlx(0), NL_Y - 0.16, BLUE);
    const mkLab = (txt, x, y, col) => { const t = T(txt, P ? 18 : 16, col, true, true); t.moveTo([x, y, 0]); return t; };
    let labA = mkLab('A: 0', nlx(0), NL_Y + 0.54, C.cyan);
    let labB = mkLab('B: 0', nlx(0) + 0.95, NL_Y - 0.16, BLUE);
    let gapBar = null, gapLab = null;

    track(nlGroup, dotA, dotB, labA, labB);

    // 2) Sigmoid plot (created on demand)
    let sigBuilt = false, sigDot = null, sigDropV = null, sigDropH = null, sigPct = null;
    function makeSigmoid() {
      if (sigBuilt) return [];
      sigBuilt = true;
      const axX = new M.Line({ start: [SIG_X0, SIG_Y0, 0], end: [SIG_X1, SIG_Y0, 0], color: C.muted, strokeWidth: 2 });
      const axY = new M.Line({ start: [SIG_X0, SIG_Y0, 0], end: [SIG_X0, SIG_Y1, 0], color: C.muted, strokeWidth: 2 });
      const midY = new M.DashedLine({ start: [SIG_X0, sigy(0.5), 0], end: [SIG_X1, sigy(0.5), 0], color: C.grid, strokeWidth: 1.5 });
      const midX = new M.DashedLine({ start: [sigx(0), SIG_Y0, 0], end: [sigx(0), SIG_Y1, 0], color: C.grid, strokeWidth: 1.5 });
      const title = T('sigmoid: gap → probability', P ? 16 : 16, C.cyan, true);
      title.moveTo([(SIG_X0 + SIG_X1) / 2, SIG_Y1 + 0.24, 0]);
      const yLabs = [[0, '0%'], [0.5, '50%'], [1, '100%']].map(([v, s]) => {
        const t = T(s, P ? 15 : 14, C.muted, true); t.moveTo([SIG_X0 - 0.36, sigy(v), 0]); return t;
      });
      const xLabs = [[-2, '−2'], [0, '0'], [2, '+2']].map(([v, s]) => {
        const t = T(s, P ? 15 : 14, C.muted, true); t.moveTo([sigx(v), SIG_Y0 - 0.22, 0]); return t;
      });
      const segs = [];
      for (let i = 0; i < 24; i++) {
        const g1 = -3 + i * 0.25, g2 = g1 + 0.25;
        segs.push(new M.Line({ start: [sigx(g1), sigy(sig(g1)), 0], end: [sigx(g2), sigy(sig(g2)), 0], color: C.cyan, strokeWidth: 3 }));
      }
      const axesG = new M.VGroup(axX, axY, midY, midX, title, ...yLabs, ...xLabs);
      const curveG = new M.VGroup(...segs);
      sigDot = new M.Dot({ point: [sigx(0), sigy(0.5), 0], radius: 0.11, color: C.amber });
      sigDropV = new M.DashedLine({ start: [sigx(0), SIG_Y0, 0], end: [sigx(0), sigy(0.5), 0], color: C.amber, strokeWidth: 1.5 });
      sigDropH = new M.DashedLine({ start: [SIG_X0, sigy(0.5), 0], end: [sigx(0), sigy(0.5), 0], color: C.amber, strokeWidth: 1.5 });
      sigPct = T('50%', P ? 18 : 16, C.amber, true, true); sigPct.moveTo([sigx(0) + 0.55, sigy(0.5) - 0.22, 0]);
      track(axesG, curveG, sigDot, sigDropV, sigDropH, sigPct);
      return [new M.FadeIn(axesG), new M.LaggedStart(segs.map(ln => new M.Create(ln)), { lagRatio: 0.03, runTime: 0.9 }),
        new M.FadeIn(sigDropV), new M.FadeIn(sigDropH), new M.FadeIn(sigDot), new M.FadeIn(sigPct)];
    }
    function instantSigmoid() {
      if (sigBuilt) return [];
      sigBuilt = true;
      const axX = new M.Line({ start: [SIG_X0, SIG_Y0, 0], end: [SIG_X1, SIG_Y0, 0], color: C.muted, strokeWidth: 2 });
      const axY = new M.Line({ start: [SIG_X0, SIG_Y0, 0], end: [SIG_X0, SIG_Y1, 0], color: C.muted, strokeWidth: 2 });
      const midY = new M.DashedLine({ start: [SIG_X0, sigy(0.5), 0], end: [SIG_X1, sigy(0.5), 0], color: C.grid, strokeWidth: 1.5 });
      const midX = new M.DashedLine({ start: [sigx(0), SIG_Y0, 0], end: [sigx(0), SIG_Y1, 0], color: C.grid, strokeWidth: 1.5 });
      const title = T('sigmoid: gap → probability', P ? 16 : 16, C.cyan, true);
      title.moveTo([(SIG_X0 + SIG_X1) / 2, SIG_Y1 + 0.24, 0]);
      const yLabs = [[0, '0%'], [0.5, '50%'], [1, '100%']].map(([v, s]) => {
        const t = T(s, P ? 15 : 14, C.muted, true); t.moveTo([SIG_X0 - 0.36, sigy(v), 0]); return t;
      });
      const xLabs = [[-2, '−2'], [0, '0'], [2, '+2']].map(([v, s]) => {
        const t = T(s, P ? 15 : 14, C.muted, true); t.moveTo([sigx(v), SIG_Y0 - 0.22, 0]); return t;
      });
      const segs = [];
      for (let i = 0; i < 24; i++) {
        const g1 = -3 + i * 0.25, g2 = g1 + 0.25;
        segs.push(new M.Line({ start: [sigx(g1), sigy(sig(g1)), 0], end: [sigx(g2), sigy(sig(g2)), 0], color: C.cyan, strokeWidth: 3 }));
      }
      const axesG = new M.VGroup(axX, axY, midY, midX, title, ...yLabs, ...xLabs, ...segs);
      sigDot = new M.Dot({ point: [sigx(0), sigy(0.5), 0], radius: 0.11, color: C.amber });
      sigDropV = new M.DashedLine({ start: [sigx(0), SIG_Y0, 0], end: [sigx(0), sigy(0.5), 0], color: C.amber, strokeWidth: 1.5 });
      sigDropH = new M.DashedLine({ start: [SIG_X0, sigy(0.5), 0], end: [sigx(0), sigy(0.5), 0], color: C.amber, strokeWidth: 1.5 });
      sigPct = T('50%', P ? 18 : 16, C.amber, true, true); sigPct.moveTo([sigx(0) + 0.55, sigy(0.5) - 0.22, 0]);
      track(axesG, sigDot, sigDropV, sigDropH, sigPct);
      return [new M.FadeIn(axesG), new M.FadeIn(sigDropV), new M.FadeIn(sigDropH), new M.FadeIn(sigDot), new M.FadeIn(sigPct)];
    }

    // 3) Loss plot
    let losBuilt = false, lastLosPt = null, losValLab = null;
    function makeLossAxes() {
      if (losBuilt) return [];
      losBuilt = true;
      const axX = new M.Line({ start: [LOS_X0, LOS_Y0, 0], end: [LOS_X1, LOS_Y0, 0], color: C.muted, strokeWidth: 2 });
      const axY = new M.Line({ start: [LOS_X0, LOS_Y0, 0], end: [LOS_X0, LOS_Y1, 0], color: C.muted, strokeWidth: 2 });
      const title = T('loss by step', P ? 16 : 16, C.pink, true);
      title.moveTo([(LOS_X0 + LOS_X1) / 2, LOS_Y1 + 0.24, 0]);
      const yLabs = [[0, '0'], [0.4, '0.4'], [0.7, '0.7']].map(([v, s]) => {
        const t = T(s, P ? 15 : 14, C.muted, true); t.moveTo([LOS_X0 - 0.34, losy(v), 0]); return t;
      });
      const xLabs = [[0, '0'], [3, '3'], [6, '6'], [10, '10']].map(([v, s]) => {
        const t = T(s, P ? 15 : 14, C.muted, true); t.moveTo([losx(v), LOS_Y0 - 0.22, 0]); return t;
      });
      const g = new M.VGroup(axX, axY, title, ...yLabs, ...xLabs);
      track(g);
      return [new M.FadeIn(g)];
    }
    function plotLoss(step, val, runTime = 0.7) {
      const pt = [losx(step), losy(val), 0];
      const d = new M.Dot({ point: pt, radius: step <= 3 ? 0.09 : 0.065, color: C.pink });
      const a = [new M.FadeIn(d, { runTime })];
      track(d);
      if (lastLosPt) {
        const ln = new M.Line({ start: lastLosPt, end: pt, color: C.pink, strokeWidth: 3 });
        a.push(new M.Create(ln, { runTime }));
        track(ln);
      }
      lastLosPt = pt;
      const lb = T(val.toFixed(2), P ? 18 : 16, C.pink, true, true);
      lb.moveTo([Math.min(LOS_X1 - 0.25, pt[0] + 0.34), Math.min(LOS_Y1 - 0.12, pt[1] + 0.20), 0]);
      if (losValLab) a.push(new M.FadeOut(losValLab, { runTime: Math.min(0.4, runTime) }));
      a.push(new M.FadeIn(lb, { runTime: Math.min(0.5, runTime) }));
      losValLab = lb;
      track(lb);
      return a;
    }

    function moveScores(rA, rB, runTime = 0.75) {
      const pA = [nlx(rA), NL_Y + 0.24, 0], pB = [nlx(rB), NL_Y + 0.24, 0];
      const a = [
        new M.Transform(dotA, new M.Dot({ point: pA, radius: 0.13, color: C.cyan }), { runTime }),
        new M.Transform(dotB, new M.Dot({ point: pB, radius: 0.13, color: BLUE }), { runTime }),
      ];
      const newLabA = mkLab(`A: ${sgn(rA)}`, pA[0], NL_Y + 0.56, C.cyan);
      const newLabB = mkLab(`B: ${sgn(rB)}`, pB[0], NL_Y + 0.56, BLUE);
      a.push(new M.FadeOut(labA, { runTime: 0.35 }), new M.FadeOut(labB, { runTime: 0.35 }),
        new M.FadeIn(newLabA, { runTime: 0.45 }), new M.FadeIn(newLabB, { runTime: 0.45 }));
      labA = newLabA; labB = newLabB;
      track(newLabA, newLabB);

      if (Math.abs(rA - rB) > 0.05) {
        const bar = new M.Line({ start: [nlx(rB), NL_Y + 0.24, -0.01], end: [nlx(rA), NL_Y + 0.24, -0.01], color: C.amber, strokeWidth: 5 });
        if (!gapBar) { gapBar = bar; track(gapBar); a.push(new M.Create(gapBar, { runTime })); }
        else a.push(new M.Transform(gapBar, bar, { runTime }));
        const gLab = T(`gap = ${(rA - rB).toFixed(2)}`, P ? 18 : 16, C.amber, true, true);
        gLab.moveTo([(nlx(rA) + nlx(rB)) / 2, NL_Y + 0.86, 0]);
        if (gapLab) a.push(new M.FadeOut(gapLab, { runTime: 0.35 }));
        a.push(new M.FadeIn(gLab, { runTime: 0.45 }));
        gapLab = gLab; track(gLab);
      }
      return a;
    }

    function moveSigmoid(g, pctText, runTime = 0.75) {
      const p = sig(g), x = sigx(g), y = sigy(p);
      const a = [
        new M.Transform(sigDot, new M.Dot({ point: [x, y, 0], radius: 0.11, color: C.amber }), { runTime }),
        new M.Transform(sigDropV, new M.DashedLine({ start: [x, SIG_Y0, 0], end: [x, y, 0], color: C.amber, strokeWidth: 1.5 }), { runTime }),
        new M.Transform(sigDropH, new M.DashedLine({ start: [SIG_X0, y, 0], end: [x, y, 0], color: C.amber, strokeWidth: 1.5 }), { runTime }),
      ];
      const newPct = T(pctText, P ? 18 : 16, C.amber, true, true);
      newPct.moveTo([Math.min(SIG_X1 - 0.45, x + 0.48), Math.max(SIG_Y0 + 0.25, y - 0.24), 0]);
      a.push(new M.FadeOut(sigPct, { runTime: 0.3 }), new M.FadeIn(newPct, { runTime: 0.4 }));
      sigPct = newPct; track(newPct);
      return a;
    }

    return {
      nlGroup, dotA, dotB,
      get gapBar() { return gapBar; },
      get sigDot() { return sigDot; },
      makeSigmoid, instantSigmoid, makeLossAxes, plotLoss, moveScores, moveSigmoid,
      fadeInBase: () => [new M.FadeIn(nlGroup), new M.FadeIn(dotA), new M.FadeIn(dotB), new M.FadeIn(labA), new M.FadeIn(labB)],
      all: () => items,
    };
  }

  // =========================================================================
  // ACT 3 (18-27): Number line, gap, sigmoid, loss, backprop on network
  // =========================================================================

  let ws = createWorkspace();

  // 18: draw the two scores on a number line
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(...N.edges.flat(2), ...N.nodes.flat(), ...N.labels, ...colNames, ...Object.values(netVals), startA, startB)),
    ...ws.fadeInBase(),
    ...say('REWARDS ON A NUMBER LINE', C.cyan)
  );

  // 19: subtract B's score from A's score -> gap = 0
  await until(S(19));
  await play(
    new M.Indicate(ws.dotA, { color: C.amber }),
    new M.Indicate(ws.dotB, { color: C.amber }),
    ...fbox([['A = 0.00', C.cyan], ['B = 0.00', BLUE], ['gap = 0 − 0 = 0', C.amber]], C.amber),
    ...say('GAP = REWARD A − REWARD B', C.amber)
  );

  // 20: equal scores -> 50% chance each
  await until(S(20));
  await play(
    ...fbox([['gap    = 0', C.amber], ['A wins = 50%', C.cyan], ['B wins = 50%', BLUE]], C.cyan),
    ...say('EQUAL REWARDS → 50% EACH', C.cyan)
  );

  // 21: S-shaped curve turns gap into chance
  await until(S(21));
  await play(...ws.makeSigmoid(), ...say('S-SHAPED CURVE: GAP → PROBABILITY', C.amber));

  // 22: sigmoid, larger gap gives A a higher chance
  await until(S(22));
  await play(...ws.moveSigmoid(2.0, '88%', 0.9), ...say('SIGMOID: BIGGER GAP → HIGHER PROBABILITY', C.cyan));
  await play(...ws.moveSigmoid(0.0, '50%', 0.7));

  // 23: people prefer A -> want its chance to increase
  const upArr = new M.Arrow({ start: [sigx(0.35), sigy(0.52), 0], end: [sigx(1.3), sigy(0.84), 0], color: C.green, strokeWidth: 3 });
  await until(S(23));
  await play(new M.Create(upArr), ...say('PEOPLE PREFER A → RAISE ITS PROBABILITY', C.green));

  // 24: loss measures how surprising this human choice is
  await until(S(24));
  await play(new M.FadeOut(upArr), ...ws.makeLossAxes(), ...say('LOSS = HOW SURPRISED THE MODEL IS', C.pink));

  // 25: 50% chance gives loss of about 0.69
  await until(S(25));
  await play(...ws.plotLoss(0, 0.69),
    ...fbox([['step 0', C.muted], ['gap    = 0.00', C.amber], ['A wins = 50%', C.cyan], ['loss   = 0.69', C.pink]], C.pink),
    ...say('50% → LOSS = 0.69', C.pink));

  // 26: during real training, loss travels backwards through the network to change weights
  const N2 = net(netCfg);
  const n2Vals = {};
  const setVal2 = (l, i, s, col = C.ink) => {
    const a = N2.value(l, i, s, col);
    n2Vals[`${l}:${i}`] = a[0].mobject;
    return a;
  };
  const lossBadge = pill('LOSS = 0.69', C.pink, 16);
  lossBadge.moveTo(P ? [0, -4.55, 0] : [0, -2.68, 0]);

  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(...ws.all())), ...clearBox(),
    new M.FadeIn(N2.group), ...setVal2(3, 0, '.69', C.pink), new M.FadeIn(lossBadge),
    ...say('REAL TRAINING: GRADIENTS FLOW BACK', C.amber));

  // Backward gradient pulses right-to-left (layer 3 -> 2 -> 1 -> 0) + weight updates
  const gradDots = [];
  const backMoves = (fromL) => {
    const anims = [];
    for (let i = 0; i < N2.nodes[fromL].length; i++) {
      for (let j = 0; j < N2.nodes[fromL - 1].length; j++) {
        const a = N2.pos(fromL, i), b = N2.pos(fromL - 1, j);
        const gd = new M.Dot({ point: a, radius: 0.08, color: C.amber });
        gradDots.push(gd);
        anims.push(new M.Transform(gd, new M.Dot({ point: b, radius: 0.08, color: C.amber }), { runTime: 0.7 }));
      }
    }
    return anims;
  };
  const updW = [
    [[0.95, -0.35, 0.45], [1.0, 0.65, -0.5]],
    [[0.85, -0.25, 0.75], [-0.6, 0.7, 0.45], [0.6, -0.45, 0.95]],
    [[0.9], [-0.3], [0.8]]
  ];
  const wUpd = l => {
    const a = [];
    for (let i = 0; i < updW[l].length; i++)
      for (let j = 0; j < updW[l][i].length; j++)
        a.push(...N2.weight(l, i, j, updW[l][i][j]));
    return a;
  };
  await play(new M.LaggedStart(backMoves(3), { lagRatio: 0.06, runTime: 0.85 }), ...wUpd(2));
  await play(new M.LaggedStart(backMoves(2), { lagRatio: 0.04, runTime: 0.85 }), ...wUpd(1));
  await play(new M.LaggedStart(backMoves(1), { lagRatio: 0.04, runTime: 0.85 }), ...wUpd(0));

  // 27: in our small example, change the reward scores directly
  ws = createWorkspace();
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(...N2.edges.flat(2), ...N2.nodes.flat(), ...N2.labels, ...Object.values(n2Vals), ...gradDots, lossBadge)),
    ...ws.fadeInBase(), ...ws.instantSigmoid(), ...ws.makeLossAxes(), ...ws.plotLoss(0, 0.69, 0.5),
    ...fbox([['step 0', C.muted], ['A = 0.00,  B = 0.00', C.cyan], ['A wins = 50%', C.amber], ['loss   = 0.69', C.pink]], C.amber),
    ...say('OUR EXAMPLE: CHANGE THE REWARDS DIRECTLY', C.amber)
  );

  // =========================================================================
  // ACT 4 (28-46): Step-by-step iterations + fast-forward + formula
  // =========================================================================

  // --- STEP 1 (28-33) ---
  await until(S(28));
  await play(...fbox([['STEP 1', C.amber], ['change = 1 − 0.50', C.ink], ['(1 − probability A wins)', C.muted]], C.amber), ...say('STEP 1: 1 − PROBABILITY', C.amber));

  await until(S(29));
  await play(...fbox([['STEP 1', C.amber], ['change = 1 − 0.50', C.muted], ['       = 0.50', C.amber]], C.amber), ...say('CHANGE = 0.50', C.amber));

  const arrR = new M.Arrow({ start: [nlx(0), NL_Y + 0.88, 0], end: [nlx(0.5), NL_Y + 0.88, 0], color: C.cyan, strokeWidth: 3 });
  const arrL = new M.Arrow({ start: [nlx(0), NL_Y + 0.88, 0], end: [nlx(-0.5), NL_Y + 0.88, 0], color: BLUE, strokeWidth: 3 });
  await until(S(30));
  await play(new M.Create(arrR, { runTime: 0.5 }), new M.Create(arrL, { runTime: 0.5 }), ...ws.moveScores(0.5, -0.5, 0.9),
    ...say('A +0.50   |   B −0.50', C.cyan));

  await until(S(31));
  await play(new M.FadeOut(new M.VGroup(arrR, arrL)),
    ...fbox([['STEP 1', C.amber], ['A = +0.50', C.cyan], ['B = −0.50', BLUE]], C.cyan),
    ...say('A = +0.50,  B = −0.50', C.cyan));

  await until(S(32));
  await play(...ws.moveSigmoid(1.0, '73%', 0.85),
    ...fbox([['STEP 1', C.amber], ['A = +0.50,  B = −0.50', C.cyan], ['gap    = 1.00', C.amber], ['A wins = 73%', C.green]], C.green),
    ...say('GAP = 1.00 → A WINS 73%', C.green));

  await until(S(33));
  await play(...ws.plotLoss(1, 0.31, 0.7),
    ...fbox([['STEP 1', C.amber], ['gap    = 1.00', C.amber], ['A wins = 73%', C.green], ['loss   = 0.31', C.pink]], C.pink),
    ...say('LOSS FALLS: 0.69 → 0.31', C.pink));

  // --- STEP 2 (34-38) ---
  await until(S(34));
  await play(...fbox([['STEP 2', C.amber], ['change = 1 − 0.73', C.muted], ['       = 0.27', C.amber]], C.amber),
    ...say('STEP 2: CHANGE = 0.27', C.amber));

  await until(S(35));
  await play(...ws.moveScores(0.77, -0.77, 0.85), ...say('A +0.27   |   B −0.27', C.cyan));

  await until(S(36));
  await play(...fbox([['STEP 2', C.amber], ['A = +0.77', C.cyan], ['B = −0.77', BLUE]], C.cyan),
    ...say('A = +0.77,  B = −0.77', C.cyan));

  await until(S(37));
  await play(...ws.moveSigmoid(1.54, '82%', 0.85),
    ...fbox([['STEP 2', C.amber], ['A = +0.77,  B = −0.77', C.cyan], ['gap    = 1.54', C.amber], ['A wins = 82%', C.green]], C.green),
    ...say('GAP = 1.54 → A WINS 82%', C.green));

  await until(S(38));
  await play(...ws.plotLoss(2, 0.19, 0.7),
    ...fbox([['STEP 2', C.amber], ['gap    = 1.54', C.amber], ['A wins = 82%', C.green], ['loss   = 0.19', C.pink]], C.pink),
    ...say('LOSS FALLS: 0.31 → 0.19', C.pink));

  // --- STEP 3 (39-43) ---
  await until(S(39));
  await play(...fbox([['STEP 3', C.amber], ['change = 1 − 0.82', C.muted], ['       = 0.18', C.amber]], C.amber),
    ...say('STEP 3: CHANGE = 0.18', C.amber));

  await until(S(40));
  await play(...ws.moveScores(0.95, -0.95, 0.85), ...say('SMALLER CHANGE: ±0.18', C.cyan));

  await until(S(41));
  await play(...fbox([['STEP 3', C.amber], ['A = +0.95', C.cyan], ['B = −0.95', BLUE]], C.cyan),
    ...say('A = +0.95,  B = −0.95', C.cyan));

  await until(S(42));
  await play(...ws.moveSigmoid(1.89, '87%', 0.85),
    ...fbox([['STEP 3', C.amber], ['A = +0.95,  B = −0.95', C.cyan], ['gap    = 1.89', C.amber], ['A wins = 87%', C.green]], C.green),
    ...say('GAP = 1.89 → A WINS 87%', C.green));

  await until(S(43));
  await play(...ws.plotLoss(3, 0.14, 0.7),
    ...fbox([['STEP 3', C.amber], ['gap    = 1.89', C.amber], ['A wins = 87%', C.green], ['loss   = 0.14', C.pink]], C.pink),
    ...say('LOSS FALLS: 0.19 → 0.14', C.pink));

  // --- FAST-FORWARD STEPS 4-10 (44) ---
  await until(S(44));
  let curA = 0.9458, curB = -0.9458;
  await play(...say('REPEAT FASTER → LOSS NEARS ZERO', C.green));
  for (let st = 4; st <= 10; st++) {
    const pOld = sig(curA - curB), chg = 1 - pOld;
    curA += chg; curB -= chg;
    const g = curA - curB, pNew = sig(g), lNew = lossOf(g);
    const pct = `${Math.round(pNew * 100)}%`;
    await play(
      ...ws.moveScores(curA, curB, 0.45),
      ...ws.moveSigmoid(g, pct, 0.45),
      ...ws.plotLoss(st, lNew, 0.45),
      ...fbox([
        [`STEP ${st}   (change ${chg.toFixed(2)})`, C.amber],
        [`gap = ${g.toFixed(2)}  →  ${pct}`, C.green],
        [`loss = ${lNew.toFixed(2)}`, C.pink]
      ], C.green)
    );
  }

  // --- THE FORMULA (45-46) ---
  await until(S(45));
  await play(
    new M.Indicate(ws.sigDot, { color: C.amber }),
    ...fbox([['P(chosen wins)', C.green], ['  = sigmoid(gap)', C.amber]], C.amber),
    ...say('PROBABILITY = SIGMOID(REWARD GAP)', C.amber)
  );

  await until(S(46));
  await play(
    ...(ws.gapBar ? [new M.Indicate(ws.gapBar, { color: C.cyan })] : []),
    ...fbox([['P(chosen wins) = sigmoid(gap)', C.amber], ['gap = reward chosen − reward rejected', C.cyan], ['loss = −ln(P)', C.pink]], C.cyan),
    ...say('GAP = CHOSEN − REJECTED', C.cyan)
  );

  // =========================================================================
  // ACT 5 (47-51): Trained scores A, B, C & Blind-Spot Reply D
  // =========================================================================

  const Z_X = P ? -0.55 : 0.55;
  const B_SC = P ? 1.05 : 1.35;
  const ROW_Y = P ? [0.20, -1.25, -2.70, -4.15] : [0.95, 0.05, -0.85, -1.75];
  const BAR_H = P ? 0.44 : 0.48;
  const zLine = new M.Line({ start: [Z_X, P ? 0.95 : 1.45, 0], end: [Z_X, P ? -4.75 : -2.35, 0], color: C.muted, strokeWidth: 2.5 });
  const zTick = T('0', 15, C.muted, true); zTick.moveTo([Z_X, P ? -5.02 : -2.62, 0]);
  const axisX = new M.Line({ start: [Z_X - 1.8 * B_SC, P ? -4.75 : -2.35, 0], end: [Z_X + 3.4 * B_SC, P ? -4.75 : -2.35, 0], color: C.line, strokeWidth: 2 });
  const barAxes = new M.VGroup(axisX, zLine, zTick);

  function makeBarRow(idx, badge, txt, val, col) {
    const y = ROW_Y[idx];
    const items = [];
    if (P) {
      const lbl = T(`${badge}: ${txt}`, 17, col, false, true);
      lbl.moveTo([-3.45 + lbl.getWidth() / 2, y + 0.48, 0]);
      items.push(lbl);
    } else {
      const c = card(4.1, 0.64, [-4.55, y, 0], col, [[`${badge}: ${txt}`, col, false, true]], 16);
      items.push(c);
    }
    const bw = Math.abs(val) * B_SC;
    const bx = val >= 0 ? Z_X + bw / 2 : Z_X - bw / 2;
    const bar = new M.RoundedRectangle({ width: bw, height: BAR_H, cornerRadius: 0.08, color: col, strokeWidth: 2 });
    bar.setFill(col, 0.82); bar.moveTo([bx, y, 0]);
    const vTxt = (val > 0 ? '+' : '−') + Math.abs(val).toFixed(1);
    const vLab = T(vTxt, P ? 19 : 18, col, true, true);
    vLab.moveTo([val >= 0 ? Z_X + bw + 0.48 : Z_X - bw - 0.52, y, 0]);
    return { label: items[0], bar, vLab, group: new M.VGroup(items[0], bar, vLab), tip: [val >= 0 ? Z_X + bw : Z_X - bw, y, 0] };
  }

  const rowA = makeBarRow(0, 'A', '"At six."', 2.0, C.cyan);
  const rowB = makeBarRow(1, 'B', '"Thanks! The library closes at six..."', 0.5, BLUE);
  const rowC = makeBarRow(2, 'C', '"At nine."  (wrong)', -1.5, C.pink);
  const rowD = makeBarRow(3, 'D', '"At six! At six! At six!"', 3.0, ORANGE);

  // 47: after training, A = 2.0, B = 0.5
  await until(S(47));
  await play(new M.FadeOut(new M.VGroup(...ws.all())), ...clearBox(),
    new M.FadeIn(barAxes), new M.FadeIn(rowA.group), new M.FadeIn(rowB.group),
    ...say('AFTER TRAINING: A = +2.0, B = +0.5', C.cyan));

  // 48: wrong reply C gets -1.5
  await until(S(48));
  await play(new M.FadeIn(rowC.group), ...say('WRONG REPLY C = −1.5', C.pink));

  // 49: new reply D says: at six, at six, at six!
  const qMark = T('?', 26, ORANGE, true, true); qMark.moveTo([Z_X + 0.65, ROW_Y[3], 0]);
  await until(S(49));
  await play(new M.FadeIn(rowD.label), new M.FadeIn(qMark), ...say('NEW REPLY D: REPEATED WORDS', ORANGE));

  // 50: reward model wrongly gives D 3.0, the highest score
  const hiTag = pill('HIGHEST!', ORANGE, 15);
  hiTag.moveTo(P ? [2.15, ROW_Y[3] + 0.48, 0] : [Z_X + 3.0 * B_SC + 0.45, ROW_Y[3] - 0.52, 0]);
  await until(S(50));
  await play(new M.FadeOut(qMark), new M.FadeIn(rowD.bar), new M.FadeIn(rowD.vLab), new M.FadeIn(hiTag),
    new M.Flash(new M.Dot({ point: rowD.tip, radius: 0.05, color: ORANGE }), { color: ORANGE, runTime: 0.7 }),
    ...say('WRONG: D GETS +3.0 (HIGHEST!)', ORANGE));

  // 51: D never appeared in training, fails to recognise repetition
  const warnBox = new M.RoundedRectangle({
    width: P ? 7.2 : 12.6, height: P ? 1.15 : 0.86, cornerRadius: 0.14, color: C.pink, strokeWidth: 2.5
  });
  warnBox.moveTo([P ? 0 : -0.1, P ? ROW_Y[3] + 0.22 : ROW_Y[3], 0]);
  const unseenTag = pill('NEVER SEEN IN TRAINING', C.pink, 15);
  unseenTag.moveTo(P ? [0, -5.12, 0] : [-4.15, -2.62, 0]);
  await until(S(51));
  await play(new M.Create(warnBox), new M.FadeIn(unseenTag), ...say('BLIND SPOT: UNSEEN REPETITION', C.pink));

  // =========================================================================
  // ACT 6 (52-54): What it is for & recap
  // =========================================================================

  const sumW = P ? 6.8 : 5.7, sumH = P ? 2.1 : 2.55;
  const sum1 = card(sumW, sumH, P ? [0, -0.45, 0] : [-3.25, -0.65, 0], C.green, [
    ['WHAT IT IS FOR', C.green, true, true],
    ['Gives rewards to thousands', C.ink],
    ['of new replies, fast', C.ink],
    ['from human choices', C.muted],
  ], P ? 19 : 20);
  const sum2 = card(sumW, sumH, P ? [0, -3.25, 0] : [3.25, -0.65, 0], C.pink, [
    ['WATCH OUT', C.pink, true, true],
    ['Only reflects what', C.ink],
    ['it saw in training', C.ink],
    ['(e.g. D: +3.0 trap)', ORANGE],
  ], P ? 19 : 20);

  // 52: helps judge large numbers of new replies
  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(barAxes, rowA.group, rowB.group, rowC.group, rowD.label, rowD.bar, rowD.vLab, hiTag, warnBox, unseenTag)),
    new M.FadeIn(sum1),
    ...say('FAST SCORING AT SCALE', C.green)
  );

  // 53: can make mistakes because scores only reflect training
  await until(S(53));
  await play(new M.FadeIn(sum2), ...say('REWARDS ARE NOT PERFECT', C.pink));

  // 54: recap
  await until(S(54));
  await play(new M.Indicate(sum1, { color: C.green }), new M.Indicate(sum2, { color: C.amber }),
    ...say('LEARNS FROM CHOICES — NOT PERFECT', C.amber));
}

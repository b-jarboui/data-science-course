// 20.2.6 Reinforcement learning from human feedback: learning to earn better rewards.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;

  const BLUE = '#7aa7ff', ORANGE = '#fb923c';
  const COLS = [C.cyan, BLUE, C.pink, ORANGE];
  const LETTERS = ['A', 'B', 'C', 'D'];
  const TEXTS = ['At six.', 'Correct, but long...', 'At nine.', 'At six! At six! At six!'];
  const R = [2.0, 0.5, -1.5, 3.0];
  const RLAB = ['+2.0', '+0.5', '−1.5', '+3.0'];
  const P0 = [0.40, 0.40, 0.15, 0.05];

  // Exact RLHF trajectory (learning rate = 1) matching chapters/20.2.md
  function rlhfStep(probs, lr = 1.0) {
    const avg = probs.reduce((s, p, i) => s + p * R[i], 0);
    const adv = R.map(r => r - avg);
    const delta = probs.map((p, i) => lr * p * adv[i]);
    const raw = probs.map((p, i) => p * Math.exp(delta[i]));
    const tot = raw.reduce((a, b) => a + b, 0);
    const next = raw.map(x => x / tot);
    const nextAvg = next.reduce((s, p, i) => s + p * R[i], 0);
    return { avg, adv, delta, next, nextAvg };
  }
  const traj = [{ p: P0.slice(), avg: 0.925, adv: [1.075, -0.425, -2.425, 2.075], delta: [0.43, -0.17, -0.36375, 0.10375] }];
  for (let t = 0; t < 90; t++) {
    const st = rlhfStep(traj[t].p, 1.0);
    traj[t].avg = st.avg; traj[t].adv = st.adv; traj[t].delta = st.delta;
    traj.push({ p: st.next, avg: st.nextAvg, adv: [], delta: [] });
  }
  const lastSt = rlhfStep(traj[traj.length - 1].p, 1.0);
  traj[traj.length - 1].adv = lastSt.adv; traj[traj.length - 1].delta = lastSt.delta;
  const m1 = Math.max(12, traj.findIndex((s, i) => i > 8 && s.p[3] >= 0.25));
  const m2 = Math.max(m1 + 2, traj.findIndex((s, i) => i > m1 && s.p[3] >= 0.70));
  const m3 = Math.max(m2 + 2, traj.findIndex((s, i) => i > m2 && s.p[3] >= 0.96));

  const fmtPct = p => {
    const v = p * 100;
    return v < 10 && Math.abs(v - Math.round(v)) >= 0.25 ? v.toFixed(1) + '%' : Math.round(v) + '%';
  };

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 2.22, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, 3.48, 0] : [4.35, 0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 18);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 18 : 17;
    const lh = lines.length > 3 ? (P ? 0.32 : 0.33) : (P ? 0.38 : 0.37);
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.56, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.28, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.45;
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

  // Row geometry for the 4 reply cards A, B, C, D
  const ROW_Y = P ? [1.22, 0.24, -0.74, -1.72] : [1.05, 0.08, -0.89, -1.86];
  const ROW_CX = P ? 0 : -2.5, ROW_W = P ? 7.4 : 8.2, ROW_H = P ? 0.86 : 0.80;
  const BAR_X0 = P ? -2.85 : -3.05, BAR_W = P ? 4.35 : 2.65, BAR_H = P ? 0.24 : 0.34;
  const BAR_DY = P ? -0.17 : 0;
  const PCT_X = P ? 2.02 : 0.10;
  const REW_X = P ? 3.08 : 1.05;

  function makeBar(k, pct, col = COLS[k]) {
    const w = Math.max(0.06, pct * BAR_W);
    const r = new M.Rectangle({ width: w, height: BAR_H, color: col, strokeWidth: 1.5 });
    r.setFill(col, 0.84);
    r.moveTo([BAR_X0 + w / 2, ROW_Y[k] + BAR_DY, 0]);
    return r;
  }
  function makeGhostBar(k, pct) {
    const w = Math.max(0.06, pct * BAR_W);
    const r = new M.Rectangle({ width: w, height: BAR_H + 0.04, color: C.muted, strokeWidth: 1.2 });
    r.setFill(C.muted, 0.16);
    r.moveTo([BAR_X0 + w / 2, ROW_Y[k] + BAR_DY, -0.01]);
    return r;
  }
  function makePctLabel(k, pct, col = COLS[k]) {
    const t = T(fmtPct(pct), P ? 18 : 17, col, true, true);
    t.moveTo([PCT_X, ROW_Y[k] + BAR_DY, 0]);
    return t;
  }
  function makeRowCard(k) {
    const y = ROW_Y[k], col = COLS[k];
    const bg = new M.RoundedRectangle({ width: ROW_W, height: ROW_H, cornerRadius: 0.14, color: C.line, strokeWidth: 1.5 });
    bg.setFill(C.card, 0.92); bg.moveTo([ROW_CX, y, -0.015]);
    const bx = P ? -3.28 : -6.15;
    const circ = new M.Circle({ radius: 0.23, color: col, strokeWidth: 2.2 });
    circ.setFill(C.bg, 0.95); circ.moveTo([bx, y, 0]);
    const letT = T(LETTERS[k], 18, col, true, true); letT.moveTo([bx, y, 0]);
    const tx = P ? -2.85 : -5.75, ty = P ? y + 0.19 : y;
    const txt = T(TEXTS[k], P ? 15 : 15, C.ink);
    txt.moveTo([tx + txt.getWidth() / 2, ty, 0]);
    return new M.VGroup(bg, circ, letT, txt);
  }
  function makeRewardBadge(k) {
    const col = COLS[k];
    const r = new M.RoundedRectangle({ width: P ? 0.96 : 0.92, height: 0.42, cornerRadius: 0.12, color: col, strokeWidth: 2 });
    r.setFill(C.bg, 0.95); r.moveTo([REW_X, ROW_Y[k], 0]);
    const t = T(RLAB[k], 16, col, true, true); t.moveTo([REW_X, ROW_Y[k], 0]);
    return new M.VGroup(r, t);
  }

  let ringNow = [];
  function ring(ks, col) {
    const list = (Array.isArray(ks) ? ks : [ks]).map(k => {
      const r = new M.RoundedRectangle({ width: ROW_W + 0.14, height: ROW_H + 0.1, cornerRadius: 0.16, color: col, strokeWidth: 3 });
      r.moveTo([ROW_CX, ROW_Y[k], 0.01]);
      return r;
    });
    const a = [...ringNow.map(r => new M.FadeOut(r, { runTime: 0.3 })), ...list.map(r => new M.FadeIn(r, { runTime: 0.35 }))];
    ringNow = list;
    return a;
  }
  function clearRing() { const a = ringNow.map(r => new M.FadeOut(r, { runTime: 0.3 })); ringNow = []; return a; }

  // ==================== ACT 1: INTRO, PROMPT, REPLIES, CHANCES & REWARDS (S0-S12) ====================
  // S(0) campus writing assistant, some replies poor
  const botBox = new M.RoundedRectangle({ width: P ? 5.6 : 4.8, height: 1.15, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.2 });
  botBox.setFill(C.card, 0.95); botBox.moveTo([0, P ? 0.55 : 0.45, 0]);
  const botTitle = T('Campus Writing Assistant', P ? 22 : 24, C.cyan, false, true);
  botTitle.moveTo([0, P ? 0.72 : 0.62, 0]);
  const botSub = T('answers student questions', P ? 16 : 17, C.muted);
  botSub.moveTo([0, P ? 0.26 : 0.16, 0]);
  const botCard = new M.VGroup(botBox, botTitle, botSub);

  const sampleDefs = [
    ['✓  "At six."', C.green, P ? [0, -0.85, 0] : [-3.8, -1.25, 0]],
    ['✗  "At nine."', C.pink, P ? [0, -1.95, 0] : [0, -1.25, 0]],
    ['✗  "At six! At six! At six!"', ORANGE, P ? [0, -3.05, 0] : [3.8, -1.25, 0]],
  ];
  const samples = sampleDefs.map(([txt, col, pos]) => {
    const r = new M.RoundedRectangle({ width: P ? 5.6 : 3.35, height: 0.78, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo(pos);
    const t = T(txt, P ? 18 : 16, col, false, true); t.moveTo(pos);
    return new M.VGroup(r, t);
  });
  await until(S(0));
  await play(new M.FadeIn(botCard), new M.LaggedStart(samples.map(s => new M.FadeIn(s)), { lagRatio: 0.2, runTime: 1.2 }), ...say('CAMPUS WRITING ASSISTANT'));

  // S(1) teach without writing every correct answer ourselves
  await until(S(1));
  await play(new M.Indicate(botCard, { color: C.amber }), ...say('BETTER REPLIES WITHOUT HAND-WRITING ALL?', C.amber));

  // S(2) announcement
  const annBox = new M.RoundedRectangle({ width: P ? 7.0 : 10.6, height: P ? 1.75 : 1.35, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.2 });
  annBox.setFill(C.card, 0.95); annBox.moveTo([0, P ? 0.35 : 0.35, 0]);
  const annTag = T('ANNOUNCEMENT', 15, C.cyan, true, true); annTag.moveTo([0, P ? 0.92 : 0.78, 0]);
  const annTxt1 = T(P ? '“The library closes at six' : '“The library closes at six on Friday for cleaning.”', P ? 20 : 23, C.ink, false, true);
  annTxt1.moveTo([0, P ? 0.32 : 0.15, 0]);
  const annParts = [annBox, annTag, annTxt1];
  if (P) {
    const annTxt2 = T('on Friday for cleaning.”', 20, C.ink, false, true);
    annTxt2.moveTo([0, -0.18, 0]);
    annParts.push(annTxt2);
  }
  const annCard = new M.VGroup(...annParts);
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(botCard, ...samples)), new M.FadeIn(annCard), ...say('THE ANNOUNCEMENT', C.cyan));

  // S(3) student asks
  const qBox = new M.RoundedRectangle({ width: P ? 7.0 : 9.4, height: P ? 1.55 : 1.25, cornerRadius: 0.18, color: C.amber, strokeWidth: 2.2 });
  qBox.setFill(C.card, 0.95); qBox.moveTo([0, P ? -1.75 : -1.35, 0]);
  const qTag = T('STUDENT QUESTION', 15, C.amber, true, true); qTag.moveTo([0, P ? -1.22 : -0.95, 0]);
  const qTxt1 = T(P ? '“When does the library' : '“When does the library close on Friday?”', P ? 20 : 23, C.ink, false, true);
  qTxt1.moveTo([0, P ? -1.78 : -1.55, 0]);
  const qParts = [qBox, qTag, qTxt1];
  if (P) {
    const qTxt2 = T('close on Friday?”', 20, C.ink, false, true);
    qTxt2.moveTo([0, -2.25, 0]);
    qParts.push(qTxt2);
  }
  const qCard = new M.VGroup(...qParts);
  await until(S(3));
  await play(new M.FadeIn(qCard), ...say('STUDENT QUESTION', C.amber));

  // S(4)-(7) four reply cards A, B, C, D
  const cards1 = [0, 1, 2, 3].map(makeRowCard);
  const promptP = new M.VGroup(
    new M.RoundedRectangle({ width: 7.0, height: 1.5, cornerRadius: 0.18, color: C.amber, strokeWidth: 2 }).moveTo([0, -3.6, 0]),
    T('STUDENT QUESTION', 15, C.amber, true, true).moveTo([0, -3.1, 0]),
    T('“When does the library close', 19, C.ink).moveTo([0, -3.55, 0]),
    T('on Friday?”', 19, C.ink).moveTo([0, -3.95, 0]));
  await until(S(4));
  await play(new M.FadeOut(new M.VGroup(annCard, qCard)), ...(P ? [new M.FadeIn(promptP)] : []), new M.FadeIn(cards1[0]), ...say('REPLY A: "AT SIX."', C.cyan));
  await until(S(5));
  await play(new M.FadeIn(cards1[1]), ...say('REPLY B: CORRECT, BUT LONG', BLUE));
  await until(S(6));
  await play(new M.FadeIn(cards1[2]), ...say('REPLY C: "AT NINE."', C.pink));
  await until(S(7));
  await play(new M.FadeIn(cards1[3]), ...say('REPLY D: REPEATED WORDS', ORANGE));

  // S(8) initial chances 40%, 40%, 15%, 5%
  const ghosts1 = P0.map((p, k) => makeGhostBar(k, p));
  const bars1 = P0.map((p, k) => makeBar(k, p));
  const pcts1 = P0.map((p, k) => makePctLabel(k, p));
  await until(S(8));
  await play(
    new M.LaggedStart(ghosts1.map(g => new M.FadeIn(g)), { lagRatio: 0.1, runTime: 0.8 }),
    new M.LaggedStart(bars1.map(b => new M.FadeIn(b)), { lagRatio: 0.12, runTime: 1.1 }),
    new M.LaggedStart(pcts1.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.1 }),
    ...say('PROBABILITIES: 40% · 40% · 15% · 5%', C.cyan)
  );

  // S(9)-(12) reward model scores
  const rewHdr1 = T('REWARD', 15, C.amber, true, true);
  rewHdr1.moveTo([REW_X, ROW_Y[0] + (P ? 0.58 : 0.56), 0]);
  const rBadges1 = [0, 1, 2, 3].map(makeRewardBadge);
  await until(S(9));
  await play(new M.FadeIn(rewHdr1), ...say('REWARD MODEL: JUDGES REPLIES', C.amber));

  await until(S(10));
  await play(new M.FadeIn(rBadges1[0]), new M.FadeIn(rBadges1[1]), new M.Flash(rBadges1[0], { color: C.cyan }), ...say('A: +2.0    B: +0.5', C.amber));

  await until(S(11));
  await play(new M.FadeIn(rBadges1[2]), ...ring(2, C.pink), ...say('C: −1.5  (WRONG TIME)', C.pink));

  await until(S(12));
  await play(new M.FadeIn(rBadges1[3]), ...ring(3, ORANGE), new M.Flash(rBadges1[3], { color: ORANGE }), ...say('D: +3.0  (BLIND SPOT!)', ORANGE));

  // ==================== ACT 2: GAME ANALOGY & NAMING RL / RLHF (S13-S18) ====================
  const gDefs = [
    ['Choice 1', '+1 pt', C.muted, 0.33, 0.22],
    ['Choice 2', '+5 pts', C.green, 0.33, 0.70],
    ['Choice 3', '−2 pts', C.pink, 0.33, 0.08],
  ];
  const gX = P ? [-2.35, 0, 2.35] : [-3.3, 0, 3.3];
  const gBaseY = P ? -1.4 : -1.1, gMaxH = P ? 2.1 : 1.9, gW = P ? 1.85 : 2.4;
  const gCards = gDefs.map(([name, pts, col], i) => {
    const r = new M.RoundedRectangle({ width: gW, height: 0.95, cornerRadius: 0.14, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([gX[i], gBaseY - 0.65, 0]);
    const t1 = T(name, P ? 16 : 18, C.ink, false, true); t1.moveTo([gX[i], gBaseY - 0.45, 0]);
    const t2 = T(pts, P ? 17 : 19, col, true, true); t2.moveTo([gX[i], gBaseY - 0.85, 0]);
    return new M.VGroup(r, t1, t2);
  });
  const makeGameBar = (i, hFrac, col) => {
    const h = Math.max(0.15, hFrac * gMaxH);
    const b = new M.Rectangle({ width: gW * 0.55, height: h, color: col, strokeWidth: 2 });
    b.setFill(col, 0.8); b.moveTo([gX[i], gBaseY + h / 2, 0]);
    return b;
  };
  const gBars = gDefs.map(([, , col, h0], i) => makeGameBar(i, h0, col));

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(...cards1, ...ghosts1, ...bars1, ...pcts1, rewHdr1, ...rBadges1, ...(P ? [promptP] : []))), ...clearRing(),
    new M.LaggedStart(gCards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.0 }),
    new M.LaggedStart(gBars.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('A GAME: BETTER CHOICES EARN POINTS', C.amber)
  );

  // S(14) after each round, high-point choice grows
  const roundTag = T('Round 1 → 2 → 3', P ? 18 : 20, C.amber, true, true);
  roundTag.moveTo([0, gBaseY + gMaxH + 0.35, 0]);
  await until(S(14));
  await play(
    new M.FadeIn(roundTag),
    ...gBars.map((b, i) => new M.Transform(b, makeGameBar(i, gDefs[i][4], gDefs[i][2]), { runTime: 1.2 })),
    ...say('EACH ROUND: FAVOR HIGHER POINTS', C.green)
  );

  // S(15) teach assistant similarly
  await until(S(15));
  await play(new M.Indicate(gBars[1], { color: C.green }), new M.Indicate(gCards[1], { color: C.green }), ...say('SAME IDEA FOR OUR ASSISTANT', C.cyan));

  // S(16) reinforcement learning
  const rlBadge = pill('choices  →  rewards  →  better choices', C.green, P ? 15 : 18);
  rlBadge.moveTo([0, P ? -3.15 : -2.45, 0]);
  await until(S(16));
  await play(new M.FadeIn(rlBadge), ...say('REINFORCEMENT LEARNING', C.green));

  // S(17) reinforcement learning from human feedback
  const hfBadge = pill('human preferences  →  reward model  →  rewards', C.amber, P ? 14 : 17);
  hfBadge.moveTo([0, P ? -4.0 : -2.45, 0]);
  await until(S(17));
  await play(new M.FadeOut(rlBadge), new M.FadeIn(hfBadge), ...say('REINFORCEMENT LEARNING FROM HUMAN FEEDBACK', C.amber));

  // S(18) short name: RLHF
  const rlhfBig = pill('R L H F', C.cyan, P ? 30 : 34);
  rlhfBig.moveTo([0, P ? -4.85 : -2.45, 0]);
  await until(S(18));
  await play(...(P ? [] : [new M.FadeOut(hfBadge)]), new M.FadeIn(rlhfBig), ...say('SHORT NAME: RLHF', C.cyan));

  // ==================== ACT 3: TWO NEURAL NETWORKS WITH L.net(...) (S19-S22) ====================
  const N1 = net({
    layers: [2, 3, 4],
    center: P ? [0.35, 0.25, 0] : [-3.15, -0.45, 0],
    width: P ? 4.4 : 4.3,
    height: P ? 2.0 : 2.9,
    r: P ? 0.21 : 0.26,
    names: ['ann.', 'ask'],
    color: C.cyan
  });
  const N2 = net({
    layers: [2, 3, 1],
    center: P ? [-0.35, -3.55, 0] : [3.25, -0.45, 0],
    width: P ? 4.4 : 3.9,
    height: P ? 1.85 : 2.5,
    r: P ? 0.21 : 0.26,
    outName: 'reward',
    color: C.amber
  });
  const n1Title = T('Writing Assistant', P ? 19 : 21, C.cyan, false, true);
  n1Title.moveTo(P ? [0, 1.72, 0] : [-3.15, 1.50, 0]);
  const n2Title = T('Reward Model', P ? 19 : 21, C.amber, false, true);
  n2Title.moveTo(P ? [0, -2.18, 0] : [3.25, 1.50, 0]);

  const act2Out = P ? [...gCards, ...gBars, roundTag, hfBadge, rlhfBig] : [...gCards, ...gBars, roundTag, rlhfBig];
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...act2Out)),
    new M.FadeIn(N1.group), new M.FadeIn(N2.group),
    new M.FadeIn(n1Title), new M.FadeIn(n2Title),
    ...say('TWO SEPARATE NEURAL NETWORKS', C.cyan)
  );

  // S(20) assistant produces replies -> reward model scores
  const netVals = [];
  const setVal = (N, l, i, s, col) => { const a = N.value(l, i, s, col); netVals.push(a[0].mobject); return a; };
  const connArrow = new M.Arrow({
    start: P ? [0, -1.12, 0] : [-0.55, -0.45, 0],
    end: P ? [0, -1.92, 0] : [1.00, -0.45, 0],
    color: C.cyan, strokeWidth: 3
  });
  const connLbl = T('reply', P ? 15 : 16, C.cyan, true, true);
  connLbl.moveTo(P ? [0.68, -1.52, 0] : [0.22, -0.10, 0]);

  await until(S(20));
  await play(
    ...N1.flow(0, C.cyan), ...N1.flow(1, C.cyan),
    ...LETTERS.flatMap((ch, k) => setVal(N1, 2, k, ch, COLS[k])),
    new M.Create(connArrow), new M.FadeIn(connLbl),
    ...say('ASSISTANT WRITES → REWARD MODEL GIVES A REWARD', C.amber)
  );
  await play(
    ...N2.flow(0, C.amber), ...N2.flow(1, C.amber),
    ...setVal(N2, 2, 0, '+2', C.amber)
  );

  // S(21) reward signal flows backwards through writing assistant to update weights
  const bDots = [];
  const makeGradDot = pt => {
    const d = new M.Dot({ point: pt, radius: 0.11, color: C.amber });
    d.setFill(C.amber, 1);
    return d;
  };
  // Build backward pulses from N1 layer 2 -> layer 1 -> layer 0
  const bMoves1 = [], bMoves0 = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      const d = makeGradDot(N1.pos(2, j));
      bDots.push(d);
      bMoves1.push(new M.Transform(d, makeGradDot(N1.pos(1, i)), { runTime: 0.9 }));
    }
  }
  const bDots0 = [];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      const d = makeGradDot(N1.pos(1, j));
      bDots0.push(d);
      bMoves0.push(new M.Transform(d, makeGradDot(N1.pos(0, i)), { runTime: 0.9 }));
    }
  }
  const backArrow = new M.Arrow({
    start: P ? [-0.6, -1.92, 0] : [1.00, -0.95, 0],
    end: P ? [-0.6, -1.12, 0] : [-0.55, -0.95, 0],
    color: C.amber, strokeWidth: 3
  });
  const backLbl = T('gradients', P ? 15 : 15, C.amber, true, true);
  backLbl.moveTo(P ? [-1.35, -1.52, 0] : [0.22, -1.28, 0]);
  const wUpdates = [
    ...N1.weight(1, 0, 0, 0.95), ...N1.weight(1, 1, 0, 0.85), ...N1.weight(1, 2, 0, 0.75),
    ...N1.weight(1, 0, 1, -0.45), ...N1.weight(1, 1, 2, -0.85), ...N1.weight(1, 2, 3, 0.4),
    ...N1.weight(0, 0, 0, 0.9), ...N1.weight(0, 1, 1, 0.7), ...N1.weight(0, 0, 2, -0.6),
  ];

  await until(S(21));
  await play(
    new M.Create(backArrow), new M.FadeIn(backLbl),
    new M.LaggedStart(bMoves1, { lagRatio: 0.05, runTime: 1.3 }),
    ...say('GRADIENTS GO BACK → WEIGHTS UPDATE', C.amber)
  );
  await play(
    new M.FadeOut(new M.VGroup(...bDots)),
    new M.LaggedStart(bMoves0, { lagRatio: 0.08, runTime: 1.1 }),
    ...wUpdates
  );
  await play(new M.FadeOut(new M.VGroup(...bDots0)));

  // S(22) reward model stays unchanged (frozen)
  const lockBox = new M.RoundedRectangle({
    width: P ? 6.4 : 5.7, height: P ? 2.45 : 3.25, cornerRadius: 0.18, color: C.muted, strokeWidth: 2
  });
  lockBox.setFill(C.muted, 0.06);
  lockBox.moveTo(P ? [-0.1, -3.55, -0.02] : [3.45, -0.45, -0.02]);
  const frozenTag = pill('FROZEN · WEIGHTS UNCHANGED', C.amber, P ? 14 : 15);
  frozenTag.moveTo(P ? [0, -5.12, 0] : [3.45, -2.42, 0]);
  await until(S(22));
  await play(new M.Create(lockBox), new M.FadeIn(frozenTag), ...say('REWARD MODEL STAYS UNCHANGED', C.amber));

  // ==================== ACT 4: POLICY, AVERAGE REWARD & ADVANTAGES (S23-S34) ====================
  const cards = [0, 1, 2, 3].map(makeRowCard);
  const ghosts = P0.map((p, k) => makeGhostBar(k, p));
  const bars = P0.map((p, k) => makeBar(k, p));
  let pcts = P0.map((p, k) => makePctLabel(k, p));
  const rewHdr = T('REWARD', 15, C.amber, true, true);
  rewHdr.moveTo([REW_X, ROW_Y[0] + (P ? 0.58 : 0.56), 0]);
  const rBadges = [0, 1, 2, 3].map(makeRewardBadge);

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(N1.group, N2.group, n1Title, n2Title, connArrow, connLbl, backArrow, backLbl, lockBox, frozenTag, ...netVals)),
    new M.FadeIn(new M.VGroup(...cards, ...ghosts, rewHdr, ...rBadges)),
    ...bars.map(b => new M.FadeIn(b)),
    ...pcts.map(t => new M.FadeIn(t)),
    ...fbox(['policy (probabilities):', 'A 40%   B 40%', 'C 15%   D  5%'], C.cyan),
    ...say('POLICY = PROBABILITY OF EACH REPLY', C.cyan)
  );

  // S(24) first find average reward
  await until(S(24));
  await play(...fbox(['Step 1: average reward', ['what does it earn now?', C.amber]], C.amber), ...say('FIRST: FIND AVERAGE REWARD', C.amber));

  // S(25) 100 replies as a 10x10 dot grid (40 A, 40 B, 15 C, 5 D)
  const GX = P ? 0 : 4.35, GY = P ? -3.95 : -1.78, GSP = P ? 0.23 : 0.19;
  const gA = [], gB = [], gC = [], gD = [];
  for (let idx = 0; idx < 100; idx++) {
    const r = Math.floor(idx / 10), c = idx % 10;
    const pt = [GX + (c - 4.5) * GSP, GY + (4.5 - r) * GSP - 0.12, 0];
    const k = idx < 40 ? 0 : idx < 80 ? 1 : idx < 95 ? 2 : 3;
    const dot = new M.Dot({ point: pt, radius: P ? 0.075 : 0.062, color: COLS[k] });
    dot.setFill(COLS[k], 0.92);
    [gA, gB, gC, gD][k].push(dot);
  }
  const vGA = new M.VGroup(...gA), vGB = new M.VGroup(...gB), vGC = new M.VGroup(...gC), vGD = new M.VGroup(...gD);
  const gridLbl = T('100 replies (40 A · 40 B · 15 C · 5 D)', P ? 15 : 14, C.muted, true);
  gridLbl.moveTo([GX, GY + 5 * GSP + 0.12, 0]);
  await until(S(25));
  await play(
    new M.FadeIn(gridLbl),
    new M.FadeIn(vGA), new M.FadeIn(vGB), new M.FadeIn(vGC), new M.FadeIn(vGD),
    ...say('IMAGINE 100 REPLIES', C.cyan)
  );

  // S(26) 40 A -> +80, 40 B -> +20
  await until(S(26));
  await play(
    new M.Indicate(vGA, { color: C.cyan }), new M.Indicate(vGB, { color: BLUE }),
    ...fbox([['40 A × (+2.0) = +80.0', C.cyan], ['40 B × (+0.5) = +20.0', BLUE]], C.cyan),
    ...say('40 A → +80 PTS · 40 B → +20 PTS', C.cyan)
  );

  // S(27) 15 C -> -22.5
  await until(S(27));
  await play(
    new M.Indicate(vGC, { color: C.pink }),
    ...fbox(['40 A = +80   40 B = +20', ['15 C × (−1.5) = −22.5', C.pink]], C.pink),
    ...say('15 C → −22.5 PTS', C.pink)
  );

  // S(28) 5 D -> +15
  await until(S(28));
  await play(
    new M.Indicate(vGD, { color: ORANGE }),
    ...fbox(['+80 + 20 − 22.5', [' 5 D × (+3.0) = +15.0', ORANGE]], ORANGE),
    ...say('5 D → +15.0 PTS', ORANGE)
  );

  // S(29) total 92.5 / 100 = 0.93
  await until(S(29));
  await play(
    ...fbox(['total = 92.5 points', '92.5 ÷ 100 = 0.925', ['average reward ≈ 0.93', C.amber]], C.amber),
    ...say('AVERAGE REWARD ≈ 0.93', C.amber)
  );

  // S(30) reward number line with average at 0.93
  const AX_X0 = P ? -3.1 : 2.35, AX_X1 = P ? 3.1 : 6.35, AX_Y = P ? -3.95 : -1.78;
  const r2x = v => AX_X0 + (v + 2) / 5.5 * (AX_X1 - AX_X0);
  const axLine = new M.Line({ start: [AX_X0, AX_Y, 0], end: [AX_X1, AX_Y, 0], color: C.muted, strokeWidth: 2.5 });
  const axTicks = [-2, -1, 0, 1, 2, 3].map(v => new M.VGroup(
    new M.Line({ start: [r2x(v), AX_Y - 0.08, 0], end: [r2x(v), AX_Y + 0.08, 0], color: C.muted }),
    T(String(v), P ? 15 : 14, C.muted, true).moveTo([r2x(v), AX_Y - 0.28, 0])
  ));
  const avgLine = new M.DashedLine({ start: [r2x(0.925), AX_Y - 0.82, 0], end: [r2x(0.925), AX_Y + 1.25, 0], color: C.amber });
  const avgTag = T('average 0.93', P ? 16 : 15, C.amber, true, true);
  avgTag.moveTo([r2x(0.925), AX_Y - 1.02, 0]);
  const rDots = R.map((rv, k) => {
    const d = new M.Dot({ point: [r2x(rv), AX_Y, 0], radius: 0.11, color: COLS[k] });
    d.setFill(COLS[k], 1);
    const l = T(LETTERS[k], P ? 17 : 15, COLS[k], true, true);
    l.moveTo([r2x(rv) + (k === 1 ? -0.25 : 0), AX_Y - 0.56, 0]);
    return new M.VGroup(d, l);
  });
  const axGroup = new M.VGroup(axLine, ...axTicks, avgLine, avgTag, ...rDots);

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(gridLbl, vGA, vGB, vGC, vGD)),
    new M.FadeIn(axGroup),
    ...fbox(['compare each reward', ['to average = 0.93', C.amber]], C.amber),
    ...say('COMPARE EACH REWARD TO 0.93', C.amber)
  );

  // S(31) A: +1.08 above average
  const makeAdvArrow = (rv, dy, txt, col, dx = 0) => {
    const arr = new M.Arrow({ start: [r2x(0.925), AX_Y + dy, 0], end: [r2x(rv), AX_Y + dy, 0], color: col, strokeWidth: 3 });
    const t = T(txt, P ? 16 : 15, col, true, true);
    t.moveTo([(r2x(0.925) + r2x(rv)) / 2 + dx, AX_Y + dy + 0.26, 0]);
    return new M.VGroup(arr, t);
  };
  const advA = makeAdvArrow(2.0, 0.3, '+1.08', C.cyan);
  await until(S(31));
  await play(
    new M.FadeIn(advA),
    ...fbox([['A: 2.0 − 0.925 = +1.075', C.cyan], ['   ≈ +1.08 above average', C.cyan]], C.cyan),
    ...say('A: +1.08 ABOVE AVERAGE', C.cyan)
  );

  // S(32) B: -0.43 below average
  const advB = makeAdvArrow(0.5, 0.95, '−0.43', BLUE, -0.45);
  await until(S(32));
  await play(
    new M.FadeIn(advB),
    ...fbox([['B: 0.5 − 0.925 = −0.425', BLUE], ['   ≈ −0.43 below average', BLUE]], BLUE),
    ...say('B: −0.43 BELOW AVERAGE', BLUE)
  );

  // S(33) C: -2.43 below, D: +2.08 above
  const advC = makeAdvArrow(-1.5, 0.3, '−2.43', C.pink);
  const advD = makeAdvArrow(3.0, 0.95, '+2.08', ORANGE);
  await until(S(33));
  await play(
    new M.FadeIn(advC), new M.FadeIn(advD),
    ...fbox([['C: −1.5 − 0.925 ≈ −2.43', C.pink], ['D: +3.0 − 0.925 ≈ +2.08', ORANGE]], C.amber),
    ...say('C: −2.43    D: +2.08', C.amber)
  );

  // S(34) advantage = reward - average
  await until(S(34));
  await play(
    ...fbox([['advantage = reward − avg', C.green], 'A +1.08   B −0.43', 'C −2.43   D +2.08'], C.green),
    ...say('ADVANTAGE = REWARD − AVERAGE', C.green)
  );

  // ==================== ACT 5: STEP-BY-STEP LEARNING + GROWING REWARD CURVE (S35-S50) ====================
  // Curve box sits in lower panel (phone) or lower-right panel (laptop)
  const CV_CX = P ? 0 : 4.35, CV_CY = P ? -3.95 : -1.78;
  const CV_W = P ? 7.2 : 4.45, CV_H = P ? 2.45 : 2.15;
  const cvBg = new M.RoundedRectangle({ width: CV_W, height: CV_H, cornerRadius: 0.16, color: C.line, strokeWidth: 1.5 });
  cvBg.setFill(C.card, 0.94); cvBg.moveTo([CV_CX, CV_CY, -0.02]);
  const cvTitle = T('Average reward by step', P ? 16 : 14, C.amber, true, true);
  cvTitle.moveTo([CV_CX, CV_CY + CV_H / 2 - 0.22, 0]);

  const PX0 = CV_CX - CV_W / 2 + 0.65, PX1 = CV_CX + CV_W / 2 - 0.30;
  const PY0 = CV_CY - CV_H / 2 + 0.42, PY1 = CV_CY + CV_H / 2 - 0.48;
  // Map steps 0..8 onto [0..0.76] of width, and hacking steps onto [0.76..1.0]
  const step2x = s => {
    if (s <= 8) return PX0 + (s / 8) * 0.76 * (PX1 - PX0);
    const f = Math.min(1, (s - 8) / (m3 - 8));
    return PX0 + (0.76 + f * 0.24) * (PX1 - PX0);
  };
  const avg2y = v => PY0 + (v / 3.2) * (PY1 - PY0);

  const cvXAx = new M.Line({ start: [PX0, PY0, 0], end: [PX1, PY0, 0], color: C.muted, strokeWidth: 2 });
  const cvYAx = new M.Line({ start: [PX0, PY0, 0], end: [PX0, PY1, 0], color: C.muted, strokeWidth: 2 });
  const cvYTicks = [0, 1, 2, 3].map(v => new M.VGroup(
    new M.Line({ start: [PX0 - 0.06, avg2y(v), 0], end: [PX0, avg2y(v), 0], color: C.muted }),
    T(String(v), P ? 15 : 13, C.muted, true).moveTo([PX0 - 0.24, avg2y(v), 0])
  ));
  const cvXTicks = [0, 2, 4, 6, 8].map(v => T(String(v), P ? 15 : 13, C.muted, true).moveTo([step2x(v), PY0 - 0.22, 0]));
  const guideA = new M.DashedLine({ start: [PX0, avg2y(2.0), 0], end: [PX1, avg2y(2.0), 0], color: C.cyan });
  guideA.setStrokeOpacity(0.35);
  const guideD = new M.DashedLine({ start: [PX0, avg2y(3.0), 0], end: [PX1, avg2y(3.0), 0], color: ORANGE });
  guideD.setStrokeOpacity(0.35);

  const p0Dot = new M.Dot({ point: [step2x(0), avg2y(traj[0].avg), 0], radius: 0.075, color: C.amber });
  p0Dot.setFill(C.amber, 1);
  let lastPt = [step2x(0), avg2y(traj[0].avg), 0];
  let cvValLbl = T('0.93', P ? 16 : 14, C.amber, true, true);
  cvValLbl.moveTo([lastPt[0] + 0.34, lastPt[1] - 0.16, 0]);

  function addCurvePoint(stepIdx, col = C.amber) {
    const pt = [step2x(stepIdx), avg2y(traj[stepIdx].avg), 0];
    const seg = new M.Line({ start: lastPt, end: pt, color: col, strokeWidth: 3 });
    const dot = new M.Dot({ point: pt, radius: 0.075, color: col }); dot.setFill(col, 1);
    const lbl = T(traj[stepIdx].avg.toFixed(2), P ? 16 : 14, col, true, true);
    const lx = pt[0] > PX1 - 0.7 ? pt[0] - 0.5 : pt[0] + 0.05;
    const ly = pt[1] > PY1 - 0.32 ? pt[1] - 0.22 : pt[1] + 0.22;
    lbl.moveTo([lx, ly, 0]);
    const oldLbl = cvValLbl;
    cvValLbl = lbl;
    lastPt = pt;
    return [new M.Create(seg, { runTime: 0.5 }), new M.FadeIn(dot, { runTime: 0.4 }), new M.FadeOut(oldLbl, { runTime: 0.3 }), new M.FadeIn(lbl, { runTime: 0.4 })];
  }

  function updateBarsA(probs, runTime = 0.85) {
    const nextPcts = probs.map((p, k) => makePctLabel(k, p));
    const anims = [
      ...probs.map((p, k) => new M.Transform(bars[k], makeBar(k, p), { runTime })),
      ...pcts.map(old => new M.FadeOut(old, { runTime: Math.min(0.4, runTime) })),
      ...nextPcts.map(nw => new M.FadeIn(nw, { runTime: Math.min(0.5, runTime) })),
    ];
    pcts = nextPcts;
    return anims;
  }

  // S(35) change reply scores directly
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(axGroup, advA, advB, advC, advD)),
    new M.FadeIn(new M.VGroup(cvBg, cvTitle, cvXAx, cvYAx, ...cvYTicks, ...cvXTicks, guideA, guideD, p0Dot, cvValLbl)),
    ...fbox(['small example:', 'change reply logits directly', ['step 0   avg = 0.93', C.amber]], C.violet),
    ...say('CHANGE THE LOGITS DIRECTLY', C.violet)
  );

  // S(36) step 1: chance * advantage
  await until(S(36));
  await play(
    ...fbox(['Step 1 rule:', ['logit change =', C.amber], ['probability × advantage', C.amber]], C.amber),
    ...say('STEP 1: PROBABILITY × ADVANTAGE', C.amber)
  );

  // S(37) A: 0.40 * 1.075 = +0.43
  await until(S(37));
  await play(
    ...ring(0, C.cyan),
    ...fbox(['Step 1 — Reply A:', '0.40 × (+1.075)', ['logit change = +0.43', C.cyan]], C.cyan),
    ...say('A LOGIT: +0.43', C.cyan)
  );

  // S(38) B: -0.17, C: -0.36
  await until(S(38));
  await play(
    ...ring([1, 2], C.pink),
    ...fbox(['Step 1 — B & C:', ['B: 0.40 × (−0.425) ≈ −0.17', BLUE], ['C: 0.15 × (−2.425) ≈ −0.36', C.pink]], C.pink),
    ...say('B: −0.17    C: −0.36', C.pink)
  );

  // S(39) D: +0.10
  await until(S(39));
  await play(
    ...ring(3, ORANGE),
    ...fbox(['Step 1 — Reply D:', '0.05 × (+2.075)', ['logit change ≈ +0.10', ORANGE]], ORANGE),
    ...say('D LOGIT: +0.10', ORANGE)
  );

  // S(40) softmax -> chances sum to 100%
  await until(S(40));
  await play(
    ...clearRing(),
    ...fbox(['softmax(new logits):', 'logits → probabilities', ['sum = 100%', C.green]], C.green),
    ...say('SOFTMAX → PROBABILITIES ADD TO 100%', C.green)
  );

  // S(41) Step 1 chances: A 55%, B 30%, C 9%, D 5%
  await until(S(41));
  await play(
    ...updateBarsA(traj[1].p, 1.1),
    ...fbox(['after Step 1:', ['A 55%  B 30%  C 9%  D 5%', C.cyan]], C.cyan),
    ...say('STEP 1: A 55% · B 30% · C 9% · D 5%', C.cyan)
  );

  // S(42) average reward -> 1.27
  await until(S(42));
  await play(
    ...addCurvePoint(1, C.amber),
    ...fbox(['Step 1 result:', ['avg reward = 1.27', C.amber], '(up from 0.93)'], C.amber),
    ...say('AVERAGE REWARD → 1.27', C.amber)
  );

  // S(43) Step 2: recalculate advantages using 1.27
  await until(S(43));
  await play(
    ...fbox(['Step 2  (avg = 1.27):', 'adv: A +0.73   B −0.77', '     C −2.77   D +1.73'], C.amber),
    ...say('STEP 2: NEW ADVANTAGES', C.amber)
  );

  // S(44) Step 2 score changes: A +0.41, B & C fall
  await until(S(44));
  await play(
    ...ring(0, C.cyan),
    ...fbox(['Step 2 logit changes:', ['A: +0.41', C.cyan], ['B: −0.23  C: −0.26  D: +0.09', C.muted]], C.cyan),
    ...say('A +0.41 · B & C FALL', C.cyan)
  );

  // S(45) Step 2 chances: A 69%, B 20%, C 6%, D 4.5%
  await until(S(45));
  await play(
    ...clearRing(), ...updateBarsA(traj[2].p, 1.0),
    ...fbox(['after Step 2:', ['A 69%  B 20%  C 6%  D 4.5%', C.cyan]], C.cyan),
    ...say('STEP 2: A 69% · B 20% · C 6% · D 4.5%', C.cyan)
  );

  // S(46) average reward -> 1.53
  await until(S(46));
  await play(
    ...addCurvePoint(2, C.amber),
    ...fbox(['Step 2 result:', ['avg reward = 1.53', C.amber], '(up from 1.27)'], C.amber),
    ...say('AVERAGE REWARD → 1.53', C.amber)
  );

  // S(47) Step 3 score changes: A +0.32, B & C fall
  await until(S(47));
  await play(
    ...ring(0, C.cyan),
    ...fbox(['Step 3 logit changes:', ['A: +0.32', C.cyan], ['B: −0.21  C: −0.18  D: +0.07', C.muted]], C.cyan),
    ...say('STEP 3: A +0.32 · B & C FALL', C.cyan)
  );

  // S(48) Step 3 chances: A 79%, B 13%, C 4%, D 4%
  await until(S(48));
  await play(
    ...clearRing(), ...updateBarsA(traj[3].p, 1.0),
    ...addCurvePoint(3, C.amber),
    ...fbox(['after Step 3:', ['A 79%  B 13%  C 4%  D 4%', C.cyan], ['avg reward ≈ 1.69', C.amber]], C.cyan),
    ...say('STEP 3: A 79% · B 13% · C 4% · D 4%', C.cyan)
  );

  // S(49) repeat steps faster, curve climbs past 1.69
  await until(S(49));
  await play(
    ...updateBarsA(traj[4].p, 0.55), ...addCurvePoint(4, C.green),
    ...say('REPEAT STEPS → REWARD CLIMBS PAST 1.69', C.green)
  );
  await play(...updateBarsA(traj[6].p, 0.55), ...addCurvePoint(6, C.green));
  await play(
    ...updateBarsA(traj[8].p, 0.6), ...addCurvePoint(8, C.green),
    ...fbox(['Steps 4 → 8:', `A reaches ${fmtPct(traj[8].p[0])}`, [`avg reward = ${traj[8].avg.toFixed(2)}  (> 1.69)`, C.green]], C.green)
  );

  // S(50) the formula
  await until(S(50));
  await play(
    ...fbox([['logit change =', C.ink], ['  learning rate × probability', C.cyan], ['  × advantage', C.amber]], C.cyan),
    ...say('THE UPDATE FORMULA', C.cyan)
  );

  // ==================== ACT 6: WHAT IT IS FOR, REWARD HACKING & RECAP (S51-S54) ====================
  // S(51) RLHF steers replies toward preferences
  await until(S(51));
  await play(
    ...ring(0, C.green),
    ...say('RLHF: STEERS REPLIES TO PREFERENCES', C.green)
  );

  // S(52) D earns +3.0 -> with enough training, D becomes almost every reply!
  const tickEnd = T(String(m3), P ? 15 : 13, ORANGE, true);
  tickEnd.moveTo([step2x(m3), PY0 - 0.20, 0]);
  await until(S(52));
  await play(
    ...clearRing(), new M.Flash(rBadges[3], { color: ORANGE }),
    new M.FadeIn(tickEnd),
    ...updateBarsA(traj[m1].p, 0.8), ...addCurvePoint(m1, ORANGE),
    ...say('D EARNS +3.0 → D TAKES OVER!', ORANGE)
  );
  await play(...updateBarsA(traj[m2].p, 0.8), ...addCurvePoint(m2, ORANGE));
  await play(
    ...updateBarsA(traj[m3].p, 0.85), ...addCurvePoint(m3, ORANGE),
    ...fbox([`Step ${m3}:`, [`D = ${fmtPct(traj[m3].p[3])}  "At six! ×3"`, ORANGE], [`avg reward = ${traj[m3].avg.toFixed(2)}`, C.amber]], ORANGE)
  );

  // S(53) reward hacking: higher reward, worse answer
  const hackBox = new M.RoundedRectangle({ width: ROW_W + 0.14, height: ROW_H + 0.12, cornerRadius: 0.16, color: C.pink, strokeWidth: 3 });
  hackBox.moveTo([ROW_CX, ROW_Y[3], 0]);
  await until(S(53));
  await play(
    new M.Create(hackBox),
    new M.Flash(rBadges[3], { color: C.pink }),
    ...fbox([['REWARD HACKING', C.pink], [`reward ↑   ${traj[m3].avg.toFixed(2)}`, C.amber], ['answer quality ↓', C.pink]], C.pink),
    ...say('REWARD HACKING: HIGH REWARD, WORSE ANSWER', C.pink)
  );

  // S(54) recap: reward quality matters
  await until(S(54));
  await play(
    ...fbox([['RLHF learns to earn rewards.', C.ink], ['Good rewards → good answers.', C.green]], C.amber),
    ...say('REWARD QUALITY MATTERS', C.amber)
  );
}

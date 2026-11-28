// 20.2.9 Distillation: teaching a smaller model to imitate a larger model.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;

  const PILL = P ? [0, 3.95, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, 2.45, 0] : [4.25, 0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Formula box: one at a time, automatically fades out the previous box
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.40 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.65;
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

  function card(w, h, color, pos, op = 0.92, cr = 0.16) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: cr, color, strokeWidth: 2 });
    r.setFill(C.card, op); r.moveTo(pos); return r;
  }
  function makeBar(x0, y, w, h, color, op = 0.85) {
    const bw = Math.max(0.04, w);
    const r = new M.Rectangle({ width: bw, height: h, color, strokeWidth: 1.5 });
    r.setFill(color, op); r.moveTo([x0 + bw / 2, y, 0]); return r;
  }

  // =========================================================================
  // STAGE 1 (0–1): Campus writing assistant (large model) -> smaller model?
  // =========================================================================
  const bigPos = P ? [0, 1.45, 0] : [-3.1, -0.5, 0];
  const bigW = P ? 6.2 : 4.5, bigH = P ? 2.5 : 2.9;
  const bigBox = card(bigW, bigH, C.cyan, bigPos);
  const bigTitle = T('Campus Writing Assistant', P ? 20 : 21, C.cyan, false, true);
  bigTitle.moveTo([bigPos[0], bigPos[1] + bigH / 2 - 0.36, 0]);
  const rackBars = [0, 1, 2].map(k => {
    const ry = bigPos[1] + 0.32 - k * 0.42;
    const bar = new M.RoundedRectangle({ width: bigW - 1.2, height: 0.28, cornerRadius: 0.06, color: C.cyan, strokeWidth: 1.5 });
    bar.setFill(C.cyan, 0.22); bar.moveTo([bigPos[0], ry, 0]);
    const led = new M.Dot({ point: [bigPos[0] - (bigW - 1.2) / 2 + 0.22, ry, 0], radius: 0.06, color: C.green });
    return new M.VGroup(bar, led);
  });
  const bigSub = T('Useful answers · Powerful computer', P ? 15 : 16, C.muted);
  bigSub.moveTo([bigPos[0], bigPos[1] - bigH / 2 + 0.32, 0]);
  const bigGroup = new M.VGroup(bigBox, bigTitle, ...rackBars, bigSub);

  const ghostSm = new M.VGroup(card(P ? 4.8 : 3.3, 2.0, C.muted, P ? [0, -2.55, 0] : [3.25, -0.5, 0], 0.4),
    T('?', 40, C.muted, true, true).moveTo(P ? [0, -2.55, 0] : [3.25, -0.5, 0]));
  await until(S(0));
  await play(new M.FadeIn(bigGroup, { runTime: 1.0 }), new M.FadeIn(ghostSm), ...say('LARGE MODEL = POWERFUL COMPUTER'));

  const smPos = P ? [0, -2.55, 0] : [3.25, -0.5, 0];
  const smW = P ? 4.8 : 3.3, smH = P ? 2.0 : 2.0;
  const smBox = card(smW, smH, C.green, smPos);
  const smTitle = T('Smaller Model', P ? 20 : 21, C.green, false, true);
  smTitle.moveTo([smPos[0], smPos[1] + 0.48, 0]);
  const smChip = new M.RoundedRectangle({ width: 0.85, height: 0.55, cornerRadius: 0.08, color: C.green, strokeWidth: 2 });
  smChip.setFill(C.green, 0.22); smChip.moveTo([smPos[0], smPos[1] - 0.06, 0]);
  const smSub = T('Fewer resources', P ? 15 : 16, C.muted);
  smSub.moveTo([smPos[0], smPos[1] - 0.64, 0]);
  const smGroup = new M.VGroup(smBox, smTitle, smChip, smSub);

  const teachArr = P
    ? new M.Arrow({ start: [0, bigPos[1] - bigH / 2 - 0.12, 0], end: [0, smPos[1] + smH / 2 + 0.12, 0], color: C.amber, strokeWidth: 3 })
    : new M.Arrow({ start: [bigPos[0] + bigW / 2 + 0.18, -0.5, 0], end: [smPos[0] - smW / 2 - 0.18, -0.5, 0], color: C.amber, strokeWidth: 3 });
  const teachLbl = T('teach?', P ? 18 : 19, C.amber, true, true);
  teachLbl.moveTo(P ? [0.85, -0.68, 0] : [0.35, -0.08, 0]);

  await until(S(1));
  await play(new M.Create(teachArr), new M.FadeIn(teachLbl), new M.FadeOut(ghostSm), new M.FadeIn(smGroup), ...say('SMALLER MODEL, SIMILAR ANSWERS?', C.amber));

  // =========================================================================
  // STAGE 2 (2–13): Announcement, question, "At ___", teacher's 3 chances
  // =========================================================================
  const pCardPos = P ? [0, 2.15, 0] : [0, 0.90, 0];
  const pCardW = P ? 7.1 : 11.6, pCardH = P ? 2.35 : 1.25;
  const pCard = card(pCardW, pCardH, C.line, pCardPos, 0.95);
  const annLines = P
    ? [
        T('Announcement:', 16, C.amber, false, true).moveTo([-1.95, 2.95, 0]),
        T('"The library closes at six', 17, C.ink).moveTo([0, 2.52, 0]),
        T('on Friday for cleaning."', 17, C.ink).moveTo([0, 2.12, 0]),
      ]
    : [
        T('Announcement: "The library closes at six on Friday for cleaning."', 19, C.ink).moveTo([0, 1.18, 0]),
      ];
  const annGroup = new M.VGroup(pCard, ...annLines);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(bigGroup, smGroup, teachArr, teachLbl)),
    new M.FadeIn(annGroup),
    ...say('THE ANNOUNCEMENT')
  );

  const qLines = P
    ? [
        T('Question:', 16, C.cyan, false, true).moveTo([-2.3, 1.62, 0]),
        T('"When does the library close on Friday?"', 16, C.cyan).moveTo([0, 1.24, 0]),
      ]
    : [
        T('Question: "When does the library close on Friday?"', 19, C.cyan).moveTo([0, 0.62, 0]),
      ];
  const qGroup = new M.VGroup(...qLines);

  await until(S(3));
  await play(new M.FadeIn(qGroup), ...say('THE STUDENT QUESTION', C.amber));

  const ansY = P ? 0.30 : -0.18;
  const ansPre = T('Larger model answer:  "At', P ? 18 : 21, C.ink, false, true);
  ansPre.moveTo([P ? -0.95 : -1.0, ansY, 0]);
  const blankX = P ? 1.85 : 2.05;
  const blankBox = new M.RoundedRectangle({ width: 1.55, height: 0.56, cornerRadius: 0.12, color: C.amber, strokeWidth: 2.5 });
  blankBox.setFill(C.amber, 0.12); blankBox.moveTo([blankX, ansY, 0]);
  const blankQ = T('?', P ? 22 : 24, C.amber, true, true); blankQ.moveTo([blankX, ansY, 0]);
  const ansClose = T('"', P ? 18 : 21, C.ink, false, true); ansClose.moveTo([blankX + 0.96, ansY, 0]);
  const ansGroup = new M.VGroup(ansPre, blankBox, blankQ, ansClose);

  await until(S(4));
  await play(new M.FadeIn(ansGroup), ...say('BEGINS WITH "At ..."'));

  await until(S(5));
  await play(new M.Indicate(blankBox, { color: C.amber }), ...say('WHAT COMES NEXT?', C.amber));

  // Three possible choices + bar tracks
  const choiceNames = ['"six"', '"6"', '"seven"'];
  const choiceCols = [C.cyan, C.violet, C.pink];
  const tPcts = [70, 20, 10];
  const s2Y = P ? [-0.95, -2.05, -3.15] : [-1.05, -1.80, -2.55];
  const s2X0 = P ? -2.0 : -3.5, s2Max = P ? 4.8 : 7.0, s2BH = P ? 0.46 : 0.40;
  const s2W = pct => (pct / 80) * s2Max;

  const s2Labels = choiceNames.map((nm, i) => {
    const t = T(nm, P ? 20 : 21, choiceCols[i], true, true);
    t.moveTo([s2X0 - (P ? 0.85 : 1.0), s2Y[i], 0]); return t;
  });
  const s2Tracks = s2Y.map(y => {
    const r = new M.Rectangle({ width: s2Max, height: s2BH, color: C.line, strokeWidth: 1 });
    r.setFill(C.card, 0.65); r.moveTo([s2X0 + s2Max / 2, y, 0]); return r;
  });

  await until(S(6));
  await play(
    new M.LaggedStart(s2Labels.map((t, i) => new M.FadeIn(new M.VGroup(t, s2Tracks[i]))), { lagRatio: 0.2, runTime: 1.5 }),
    ...say('WORD "six" · DIGIT "6" · WORD "seven"')
  );

  // Beats 7, 8, 9: reveal teacher's 70%, 20%, 10% bars one by one
  const s2Bars = [];
  const s2PctLabs = [];
  const s2Pills = [
    ['THE WORD "six" → 70%', C.cyan],
    ['THE DIGIT "6" → 20%', C.violet],
    ['THE WORD "seven" → 10%', C.pink],
  ];
  for (let i = 0; i < 3; i++) {
    await until(S(7 + i));
    const b0 = makeBar(s2X0, s2Y[i], 0.05, s2BH, choiceCols[i], 0.85);
    const b1 = makeBar(s2X0, s2Y[i], s2W(tPcts[i]), s2BH, choiceCols[i], 0.85);
    const pl = T(`${tPcts[i]}%`, P ? 19 : 20, choiceCols[i], true, true);
    pl.moveTo([s2X0 + s2W(tPcts[i]) + 0.52, s2Y[i], 0]);
    s2Bars.push(b0);
    s2PctLabs.push(pl);
    await play(
      new M.Transform(b0, b1, { runTime: 0.9 }),
      new M.FadeIn(pl, { runTime: 0.9 }),
      ...say(s2Pills[i][0], s2Pills[i][1])
    );
  }

  // 10: more information than just the top choice
  const allBoxH = (s2Y[0] - s2Y[2]) + s2BH + 0.45;
  const allBoxW = s2Max + (P ? 2.4 : 2.7);
  const allBox = new M.RoundedRectangle({ width: allBoxW, height: allBoxH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  allBox.moveTo([s2X0 + s2Max / 2 - (P ? 0.35 : 0.45), s2Y[1], 0]);
  await until(S(10));
  await play(new M.Create(allBox), ...say('MORE THAN JUST THE TOP CHOICE', C.amber));

  // 11: "6" is also reasonable
  const sameMean = T('← same meaning as "six"!', P ? 15 : 17, C.violet, false, true);
  sameMean.moveTo([s2X0 + s2W(20) + (P ? 2.3 : 2.6), s2Y[1], 0]);
  await until(S(11));
  await play(
    new M.FadeOut(allBox),
    new M.Indicate(s2Bars[1], { color: C.violet }),
    new M.FadeIn(sameMean),
    ...say('"6" IS ALSO A REASONABLE ANSWER', C.violet)
  );

  // 12: teacher helping a student understand several possible answers
  await until(S(12));
  await play(
    new M.FadeOut(sameMean),
    new M.Indicate(s2Bars[0], { color: C.amber }),
    new M.Indicate(s2Bars[1], { color: C.amber }),
    ...say('A TEACHER SHOWS SEVERAL OPTIONS', C.amber)
  );

  // 13: larger model as teacher
  const tBadge = pill('TEACHER MODEL', C.cyan, P ? 16 : 17);
  tBadge.moveTo(P ? [0, -4.25, 0] : [4.65, -1.80, 0]);
  await until(S(13));
  await play(new M.FadeIn(tBadge), ...say('LARGER MODEL = TEACHER'));

  // =========================================================================
  // STAGE 3 (14–20): Distillation + Teacher & Student Neural Networks (L.net)
  // =========================================================================
  const distCard = card(P ? 6.6 : 9.4, P ? 2.1 : 2.0, C.amber, P ? [0, 0.2, 0] : [0, -0.3, 0]);
  const distWord = T('DISTILLATION', P ? 36 : 44, C.amber, true, true);
  distWord.moveTo(P ? [0, 0.55, 0] : [0, 0.05, 0]);
  const distSub = T('smaller model imitates larger model', P ? 18 : 22, C.ink);
  distSub.moveTo(P ? [0, -0.25, 0] : [0, -0.72, 0]);
  const distGroup = new M.VGroup(distCard, distWord, distSub);

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(annGroup, qGroup, ansGroup, ...s2Labels, ...s2Tracks, ...s2Bars, ...s2PctLabs, tBadge)),
    new M.FadeIn(distGroup),
    ...say('CALLED DISTILLATION', C.amber)
  );

  // 15: Teacher (larger) & Student (smaller) headers
  const tHeadPos = P ? [0, 2.95, 0] : [-3.1, 1.32, 0];
  const sHeadPos = P ? [0, -1.32, 0] : [3.3, 1.32, 0];
  const tHead = T('TEACHER (larger)', P ? 20 : 22, C.cyan, false, true); tHead.moveTo(tHeadPos);
  const sHead = T('STUDENT (smaller)', P ? 20 : 22, C.green, false, true); sHead.moveTo(sHeadPos);


  // 16: Draw both models as neural networks with L.net(...)
  const NT = net({
    layers: [3, 4, 4, 3],
    center: P ? [-0.35, 1.30, 0] : [-3.1, -0.28, 0],
    width: P ? 4.5 : 4.2,
    height: P ? 1.95 : 2.15,
    r: P ? 0.20 : 0.22,
    color: C.cyan,
  });
  const NS = net({
    layers: [3, 2, 3],
    center: P ? [-0.35, -2.75, 0] : [3.3, -0.28, 0],
    width: P ? 3.3 : 2.9,
    height: P ? 1.40 : 1.50,
    r: P ? 0.20 : 0.22,
    color: C.green,
  });
  const ntOutLabs = choiceNames.map((nm, j) => {
    const p = NT.pos(3, j);
    const t = T(nm, P ? 16 : 15, C.muted, true);
    t.moveTo([p[0] + (P ? 0.7 : 0.72), p[1], 0]); return t;
  });
  const nsOutLabs = choiceNames.map((nm, j) => {
    const p = NS.pos(2, j);
    const t = T(nm, P ? 16 : 15, C.muted, true);
    t.moveTo([p[0] + (P ? 0.7 : 0.72), p[1], 0]); return t;
  });

  await until(S(15));
  await play(new M.FadeOut(distGroup), new M.FadeIn(tHead), new M.FadeIn(sHead),
    new M.FadeIn(NT.group, { runTime: 1.2 }),
    new M.FadeIn(NS.group, { runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...ntOutLabs, ...nsOutLabs), { runTime: 1.0 }),
    ...say('TEACHER AND STUDENT'));

  await until(S(16));
  await play(...NT.flow(0, C.cyan), ...NS.flow(0, C.green), ...say('COLUMNS OF NEURONS'));

  // 17: Teacher has 1,000 million weights
  const tWeightAnims = [];
  const sampleW = [0.9, -0.7, 0.5, -0.4, 0.85, -0.65, 0.6, 0.95, -0.8, 0.45, -0.55, 0.75];
  let wi = 0;
  for (let l = 0; l < 3; l++) {
    for (let i = 0; i < NT.edges[l].length; i++) {
      for (let j = 0; j < NT.edges[l][i].length; j++) {
        tWeightAnims.push(...NT.weight(l, i, j, sampleW[wi++ % sampleW.length]));
      }
    }
  }
  const tWtLabel = T('1 billion weights', P ? 18 : 19, C.cyan, true, true);
  tWtLabel.moveTo(P ? [0, -0.05, 0] : [-3.1, -1.95, 0]);

  await until(S(17));
  await play(
    new M.LaggedStart(tWeightAnims, { lagRatio: 0.02, runTime: 1.6 }),
    new M.FadeIn(tWtLabel),
    ...say('TEACHER: 1 BILLION WEIGHTS')
  );

  // 18: Student has 100 million weights (10x fewer)
  const sWeightAnims = [];
  for (let l = 0; l < 2; l++) {
    for (let i = 0; i < NS.edges[l].length; i++) {
      for (let j = 0; j < NS.edges[l][i].length; j++) {
        sWeightAnims.push(...NS.weight(l, i, j, (i + j) % 2 === 0 ? 0.35 : -0.35));
      }
    }
  }
  const sWtLabel = T('100 million weights (10× fewer)', P ? 17 : 18, C.green, true, true);
  sWtLabel.moveTo(P ? [0, -4.02, 0] : [3.3, -1.95, 0]);

  await until(S(18));
  await play(
    new M.LaggedStart(sWeightAnims, { lagRatio: 0.05, runTime: 1.3 }),
    new M.FadeIn(sWtLabel),
    ...say('STUDENT: 100 MILLION WEIGHTS', C.green)
  );

  // 19: Send same announcement and question through both networks
  const valMap = new Map();
  function setVal(N, key, l, i, txt, col = C.ink) {
    const a = N.value(l, i, txt, col);
    valMap.set(key, a[0].mobject);
    return a;
  }
  const flowAnims = [
    ...setVal(NT, 'ti0', 0, 0, 'in', C.ink),
    ...setVal(NT, 'ti1', 0, 1, '6', C.ink),
    ...setVal(NT, 'ti2', 0, 2, '?', C.ink),
    ...setVal(NS, 'si0', 0, 0, 'in', C.ink),
    ...setVal(NS, 'si1', 0, 1, '6', C.ink),
    ...setVal(NS, 'si2', 0, 2, '?', C.ink),
    ...NT.flow(0, C.amber), ...NT.flow(1, C.amber), ...NT.flow(2, C.amber),
    ...NS.flow(0, C.amber), ...NS.flow(1, C.amber),
    ...setVal(NT, 'to0', 3, 0, '70', C.cyan),
    ...setVal(NT, 'to1', 3, 1, '20', C.violet),
    ...setVal(NT, 'to2', 3, 2, '10', C.pink),
    ...setVal(NS, 'so0', 2, 0, '33', C.green),
    ...setVal(NS, 'so1', 2, 1, '33', C.green),
    ...setVal(NS, 'so2', 2, 2, '33', C.green),
  ];

  await until(S(19));
  await play(...flowAnims, ...say('SAME PROMPT → BOTH NETWORKS', C.amber));

  // 20: Teacher's weights stay unchanged while student learns
  const frozenTag = pill('WEIGHTS UNCHANGED', C.muted, 15);
  frozenTag.moveTo(P ? [0, -0.58, 0] : [-3.1, -2.55, 0]);
  const learnTag = pill('WEIGHTS UPDATE', C.green, 15);
  learnTag.moveTo(P ? [0, -4.62, 0] : [3.3, -2.55, 0]);

  await until(S(20));
  await play(
    new M.FadeIn(frozenTag),
    new M.FadeIn(learnTag),
    ...NS.weight(1, 0, 0, 0.85),
    ...NS.weight(1, 1, 2, -0.75),
    ...say('TEACHER FROZEN · STUDENT LEARNS', C.amber)
  );

  // =========================================================================
  // STAGE 4 (21–24): Hard label (100/0/0) vs Soft labels (70/20/10)
  // =========================================================================
  const hX0 = P ? -1.8 : -5.1, hWMax = P ? 4.0 : 3.9, hBH = P ? 0.38 : 0.42;
  const hY = P ? [2.15, 1.35, 0.55] : [0.25, -0.65, -1.55];
  const hTitle = T('Hard label (one answer)', P ? 19 : 21, C.amber, false, true);
  hTitle.moveTo(P ? [0, 2.90, 0] : [-3.3, 1.05, 0]);
  const hItems = [hTitle];
  const hPcts = [100, 0, 0];
  choiceNames.forEach((nm, i) => {
    const lb = T(nm, P ? 18 : 19, choiceCols[i], true, true);
    lb.moveTo([hX0 - 0.85, hY[i], 0]);
    const tr = new M.Rectangle({ width: hWMax, height: hBH, color: C.line, strokeWidth: 1 });
    tr.setFill(C.card, 0.6); tr.moveTo([hX0 + hWMax / 2, hY[i], 0]);
    hItems.push(lb, tr);
    if (hPcts[i] > 0) {
      hItems.push(makeBar(hX0, hY[i], hWMax * (hPcts[i] / 100), hBH, choiceCols[i], 0.85));
    }
    const pl = T(`${hPcts[i]}%`, P ? 17 : 18, hPcts[i] > 0 ? C.amber : C.muted, true, true);
    pl.moveTo([hX0 + hWMax * (hPcts[i] / 100) + 0.52, hY[i], 0]);
    hItems.push(pl);
  });
  const hardGroup = new M.VGroup(...hItems);

  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(
      tHead, sHead, NT.group, NS.group, ...ntOutLabs, ...nsOutLabs,
      tWtLabel, sWtLabel, frozenTag, learnTag, ...valMap.values()
    )),
    new M.FadeIn(hardGroup),
    ...say('ONLY "six": 100%', C.amber)
  );

  // 22: Hard label outline
  const hardFrame = new M.RoundedRectangle({
    width: P ? 6.8 : 6.1, height: P ? 3.05 : 3.2, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5,
  });
  hardFrame.moveTo(P ? [0, 1.68, 0] : [-3.35, -0.30, 0]);
  await until(S(22));
  await play(new M.Create(hardFrame), new M.Indicate(hTitle, { color: C.amber }), ...say('CALLED A HARD LABEL', C.amber));

  // 23: Soft labels beside hard label
  const sfX0 = P ? -1.8 : 1.5, sfWMax = hWMax;
  const sfY = P ? [-1.85, -2.65, -3.45] : [0.25, -0.65, -1.55];
  const sfTitle = T('Teacher (soft labels)', P ? 19 : 21, C.cyan, false, true);
  sfTitle.moveTo(P ? [0, -1.10, 0] : [3.3, 1.05, 0]);
  const sfItems = [sfTitle];
  choiceNames.forEach((nm, i) => {
    const lb = T(nm, P ? 18 : 19, choiceCols[i], true, true);
    lb.moveTo([sfX0 - 0.85, sfY[i], 0]);
    const tr = new M.Rectangle({ width: sfWMax, height: hBH, color: C.line, strokeWidth: 1 });
    tr.setFill(C.card, 0.6); tr.moveTo([sfX0 + sfWMax / 2, sfY[i], 0]);
    const bar = makeBar(sfX0, sfY[i], sfWMax * (tPcts[i] / 100), hBH, choiceCols[i], 0.85);
    const pl = T(`${tPcts[i]}%`, P ? 17 : 18, choiceCols[i], true, true);
    pl.moveTo([sfX0 + sfWMax * (tPcts[i] / 100) + 0.50, sfY[i], 0]);
    sfItems.push(lb, tr, bar, pl);
  });
  const softGroup = new M.VGroup(...sfItems);

  await until(S(23));
  await play(new M.FadeIn(softGroup), ...say('TEACHER: 70% · 20% · 10%'));

  // 24: Soft labels frame
  const softFrame = new M.RoundedRectangle({
    width: P ? 6.8 : 6.1, height: P ? 3.05 : 3.2, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2.5,
  });
  softFrame.moveTo(P ? [0, -2.32, 0] : [3.25, -0.30, 0]);
  await until(S(24));
  await play(new M.FadeOut(hardFrame), new M.Create(softFrame), ...say('CALLED SOFT LABELS'));

  // =========================================================================
  // STAGE 5 (25–54): Main Iteration Workspace (Paired Bars + Loss Curve + fbox)
  // =========================================================================
  const BX0 = P ? -2.35 : -5.1;
  const BMAX = P ? 4.85 : 5.35; // represents 80%
  const pctW = pct => (pct / 80) * BMAX;
  const rowY = P ? [0.25, -0.82, -1.89] : [0.45, -0.82, -2.09];
  const barH = P ? 0.28 : 0.32;
  const barOff = P ? 0.18 : 0.21;
  const tBarY = i => rowY[i] + barOff;
  const sBarY = i => rowY[i] - barOff;
  const axY = P ? -2.72 : -2.98;

  // Legend
  const legY = P ? 1.02 : 1.25;
  const sSwatch = new M.Rectangle({ width: 0.24, height: 0.20, color: C.green, strokeWidth: 1 });
  sSwatch.setFill(C.green, 0.85); sSwatch.moveTo([BX0 + (P ? 2.55 : 2.85), legY, 0]);
  const sLegTxt = T('Student', P ? 16 : 17, C.green, false, true);
  sLegTxt.moveTo([BX0 + (P ? 3.25 : 3.55), legY, 0]);
  const sLegend = new M.VGroup(sSwatch, sLegTxt);

  const tSwatch = new M.Rectangle({ width: 0.24, height: 0.20, color: C.cyan, strokeWidth: 1 });
  tSwatch.setFill(C.cyan, 0.80); tSwatch.moveTo([BX0 + 0.15, legY, 0]);
  const tLegTxt = T('Teacher', P ? 16 : 17, C.cyan, false, true);
  tLegTxt.moveTo([BX0 + 0.88, legY, 0]);
  const tLegend = new M.VGroup(tSwatch, tLegTxt);

  // Axis & choice labels
  const axLine = new M.Line({ start: [BX0, axY, 0], end: [BX0 + BMAX, axY, 0], color: C.muted, strokeWidth: 2 });
  const axTicks = (P ? [0, 40, 80] : [0, 20, 40, 60, 80]).map(v => new M.VGroup(
    new M.Line({ start: [BX0 + pctW(v), axY - 0.06, 0], end: [BX0 + pctW(v), axY + 0.06, 0], color: C.muted }),
    T(`${v}%`, P ? 16 : 15, C.muted, true).moveTo([BX0 + pctW(v), axY - 0.28, 0])
  ));
  const rowLabels = choiceNames.map((nm, i) => {
    const t = T(nm, P ? 18 : 19, i === 2 ? C.pink : C.ink, true, true);
    t.moveTo([BX0 - (P ? 0.72 : 0.85), rowY[i], 0]); return t;
  });

  // Student initial bars (33.3% each)
  const sBars = [0, 1, 2].map(i => makeBar(BX0, sBarY(i), pctW(33.33), barH, C.green, 0.85));
  let sLabs = [0, 1, 2].map(i => {
    const t = T('33%', P ? 16 : 17, C.green, true, true);
    t.moveTo([BX0 + pctW(33.33) + 0.44, sBarY(i), 0]); return t;
  });

  function updateStudent(pcts, labelStrs, dur = 0.9) {
    const anims = [];
    const nextLabs = [];
    for (let i = 0; i < 3; i++) {
      anims.push(new M.Transform(sBars[i], makeBar(BX0, sBarY(i), pctW(pcts[i]), barH, C.green, 0.85), { runTime: dur }));
      const nl = T(labelStrs[i], P ? 16 : 17, C.green, true, true);
      nl.moveTo([BX0 + pctW(pcts[i]) + 0.44, sBarY(i), 0]);
      anims.push(new M.FadeOut(sLabs[i], { runTime: 0.3 }), new M.FadeIn(nl, { runTime: dur }));
      nextLabs.push(nl);
    }
    sLabs = nextLabs;
    return anims;
  }

  // 25: Student starts at 33%, 33%, 33%
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(hardGroup, softGroup, softFrame)),
    new M.FadeIn(new M.VGroup(axLine, ...axTicks, ...rowLabels, sLegend, ...sBars, ...sLabs)),
    ...say('STUDENT STARTS: 33% · 33% · 33%', C.green)
  );

  // 26: Teacher bars beside student bars
  const tBars = [0, 1, 2].map(i => makeBar(BX0, tBarY(i), pctW(tPcts[i]), barH, C.cyan, 0.78));
  const tLabs = [0, 1, 2].map(i => {
    const t = T(`${tPcts[i]}%`, P ? 16 : 17, C.cyan, true, true);
    t.moveTo([BX0 + pctW(tPcts[i]) + 0.44, tBarY(i), 0]); return t;
  });

  await until(S(26));
  await play(
    new M.FadeIn(tLegend),
    new M.LaggedStart([0, 1, 2].map(i => new M.FadeIn(new M.VGroup(tBars[i], tLabs[i]))), { lagRatio: 0.15, runTime: 1.1 }),
    ...say('STUDENT BESIDE TEACHER')
  );

  // 27: Gap lines showing what we want to match
  const gapLines = [0, 1, 2].map(i => {
    const xS = BX0 + pctW(33.33), xT = BX0 + pctW(tPcts[i]);
    const yA = sBarY(i) - (P ? 0.3 : 0.34);
    return new M.Arrow({ start: [xS, yA, 0], end: [xT, yA, 0], color: C.amber, strokeWidth: 2.5 });
  });
  await until(S(27));
  await play(
    new M.LaggedStart(gapLines.map(a => new M.Create(a)), { lagRatio: 0.18, runTime: 1.1 }),
    ...say('GOAL: MATCH THE TEACHER BARS', C.amber)
  );

  // Loss-vs-Step curve geometry
  const LX0 = P ? -2.45 : 2.35, LX1 = P ? 2.75 : 6.25;
  const LY0 = P ? -5.35 : -2.65, LY1 = P ? -3.75 : -1.15;
  const lx = step => LX0 + (step / 8) * (LX1 - LX0);
  const ly = loss => LY0 + Math.min(1, loss / 0.35) * (LY1 - LY0);

  const lAxX = new M.Line({ start: [LX0, LY0, 0], end: [LX1, LY0, 0], color: C.muted, strokeWidth: 2 });
  const lAxY = new M.Line({ start: [LX0, LY0, 0], end: [LX0, LY1, 0], color: C.muted, strokeWidth: 2 });
  const lTitle = T('loss = KL divergence', P ? 16 : 16, C.amber, true, true);
  lTitle.moveTo([(LX0 + LX1) / 2, LY1 + 0.24, 0]);
  const lYTicks = [
    T('0', P ? 15 : 14, C.muted, true).moveTo([LX0 - 0.25, LY0, 0]),
    T('0.3', P ? 15 : 14, C.muted, true).moveTo([LX0 - 0.38, ly(0.30), 0]),
  ];
  const lXTicks = [0, 2, 4, 6, 8].map(st => T(String(st), P ? 15 : 14, C.muted, true).moveTo([lx(st), LY0 - 0.26, 0]));
  const lStepLab = T('step', P ? 15 : 14, C.muted); lStepLab.moveTo([LX1 + 0.35, LY0 - 0.24, 0]);
  const lossAxes = new M.VGroup(lAxX, lAxY, lTitle, ...lYTicks, ...lXTicks, lStepLab);

  // 28: Remember KL divergence
  await until(S(28));
  await play(
    new M.FadeIn(lossAxes),
    ...fbox(['KL divergence', ['gap: teacher vs student', C.amber]], C.amber),
    ...say('KL DIVERGENCE: THE GAP BETWEEN THEM', C.amber)
  );

  // 29: KL starts at ~0.30
  const lossPts = [
    [0, 0.2968], [1, 0.0305], [2, 0.0071], [3, 0.0031],
    [4, 0.0014], [5, 0.0006], [6, 0.0003], [7, 0.0001], [8, 0.00005],
  ];
  const ptAt = k => [lx(lossPts[k][0]), ly(lossPts[k][1]), 0];
  const dot0 = new M.Dot({ point: ptAt(0), radius: 0.09, color: C.amber });
  const lbl0 = T('0.30', P ? 17 : 15, C.amber, true); lbl0.moveTo([lx(0) + 0.42, ly(0.2968) + 0.05, 0]);

  await until(S(29));
  await play(
    new M.FadeIn(dot0), new M.Flash(dot0, { color: C.amber }), new M.FadeIn(lbl0),
    ...fbox(['Step 0 (start)', ['KL loss ≈ 0.30', C.amber]], C.amber),
    ...say('STARTING KL DIVERGENCE ≈ 0.30', C.amber)
  );

  // 30: Loss = number we want to reduce
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(...gapLines)),
    new M.Indicate(dot0, { color: C.amber }),
    ...fbox(['Loss = KL divergence', ['0.30  →  want near 0', C.amber]], C.amber),
    ...say('LOSS = NUMBER TO REDUCE', C.amber)
  );

  // 31: Real training — loss travels backwards through the student network (L.net)
  const ns2Card = card(P ? 6.6 : 4.55, P ? 2.0 : 2.15, C.amber, BOXP, 0.95);
  const ns2Title = T('Student network: gradients flow ←', P ? 16 : 16, C.amber, false, true);
  ns2Title.moveTo([BOXP[0], BOXP[1] + (P ? 0.78 : 0.84), 0]);
  const NS2 = net({
    layers: [3, 2, 3],
    center: [BOXP[0], BOXP[1] - 0.14, 0],
    width: P ? 3.8 : 3.2,
    height: P ? 1.15 : 1.20,
    r: P ? 0.15 : 0.15,
    color: C.green,
  });
  const gradDots = [];
  const gradAnims = [];
  for (let l = 1; l >= 0; l--) {
    for (let j = 0; j < NS2.nodes[l + 1].length; j++) {
      for (let i = 0; i < NS2.nodes[l].length; i++) {
        const d = new M.Dot({ point: NS2.pos(l + 1, j), radius: 0.065, color: C.amber });
        const dEnd = new M.Dot({ point: NS2.pos(l, i), radius: 0.065, color: C.amber });
        gradDots.push(d);
        gradAnims.push(new M.Transform(d, dEnd, { runTime: 0.9 }));
      }
    }
  }

  await until(S(31));
  await play(
    ...clearBox(),
    new M.FadeIn(ns2Card), new M.FadeIn(ns2Title), new M.FadeIn(NS2.group),
    ...say('REAL TRAINING: GRADIENTS FLOW BACK', C.amber)
  );
  await play(
    new M.LaggedStart(gradAnims, { lagRatio: 0.08, runTime: 2.0 }),
    ...NS2.weight(1, 0, 0, 0.9),
    ...NS2.weight(1, 1, 2, -0.85),
    ...NS2.weight(0, 0, 0, 0.75)
  );

  // 32: In our small example, change the 3 choice scores directly
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(ns2Card, ns2Title, NS2.group, ...gradDots)),
    ...fbox(['Student logits (start)', ' "six":   0.00', ' "6":     0.00', ' "seven": 0.00']),
    ...say('OUR EXAMPLE: CHANGE 3 LOGITS')
  );

  // 33: Step 1 — subtract student chance from teacher chance
  await until(S(33));
  await play(
    ...fbox(['Step 1: teacher − student', [' "six":   0.70 − 0.33', C.cyan], [' "6":     0.20 − 0.33', C.violet], [' "seven": 0.10 − 0.33', C.pink]], C.amber),
    ...say('STEP 1: TEACHER − STUDENT', C.amber)
  );

  // 34: "six": 0.70 - 0.33 = +0.37
  await until(S(34));
  await play(
    new M.Indicate(sBars[0], { color: C.amber }),
    ...fbox(['Step 1 · "six"', ' 0.70 − 0.33 ≈ +0.37', ['student is too low', C.amber]]),
    ...say('"six": 0.70 − 0.33 ≈ +0.37')
  );

  // 35: Multiply by learning rate 2 -> +0.73
  await until(S(35));
  await play(
    ...fbox(['Step 1 · "six" (rate = 2)', ' 2 × (+0.37) ≈ +0.73', ['logit: 0 → +0.73', C.green]], C.green),
    ...say('"six" LOGIT: +0.73', C.green)
  );

  // 36: "6": score decreases by 0.27
  await until(S(36));
  await play(
    new M.Indicate(sBars[1], { color: C.violet }),
    ...fbox(['Step 1 · "6" (rate = 2)', ' 2 × (0.20 − 0.33) ≈ −0.27', ['logit: 0 → −0.27', C.pink]], C.violet),
    ...say('"6" LOGIT: −0.27', C.violet)
  );

  // 37: "seven": score decreases by 0.47
  await until(S(37));
  await play(
    new M.Indicate(sBars[2], { color: C.pink }),
    ...fbox(['Step 1 · "seven" (rate = 2)', ' 2 × (0.10 − 0.33) ≈ −0.47', ['logit: 0 → −0.47', C.pink]], C.pink),
    ...say('"seven" LOGIT: −0.47', C.pink)
  );

  // 38: Softmax converts new scores to chances summing to 100%
  await until(S(38));
  await play(
    ...fbox(['Softmax: logits → probabilities', ' +0.73, −0.27, −0.47', ['→ add up to 100%', C.amber]], C.amber),
    ...say('SOFTMAX → PROBABILITIES ADD TO 100%', C.amber)
  );

  // 39: Student chances after Step 1 -> 60%, 22%, 18%
  await until(S(39));
  await play(
    ...updateStudent([60, 22, 18], ['60%', '22%', '18%'], 1.1),
    ...fbox(['After Step 1', [' "six":   60%', C.green], [' "6":     22%', C.green], [' "seven": 18%', C.green]], C.green),
    ...say('STEP 1: 60% · 22% · 18%', C.green)
  );

  // 40: Loss falls 0.30 -> 0.03
  const seg1 = new M.Line({ start: ptAt(0), end: ptAt(1), color: C.amber, strokeWidth: 3 });
  const dot1 = new M.Dot({ point: ptAt(1), radius: 0.08, color: C.amber });
  const lbl1 = T('0.03', P ? 17 : 15, C.amber, true); lbl1.moveTo([lx(1) + 0.44, ly(0.0305) + 0.22, 0]);
  await until(S(40));
  await play(
    new M.Create(seg1), new M.FadeIn(dot1), new M.Flash(dot1, { color: C.amber }), new M.FadeIn(lbl1),
    ...fbox(['Loss after Step 1', [' 0.30  →  0.03', C.amber]], C.amber),
    ...say('LOSS: 0.30 → 0.03', C.amber)
  );

  // 41: Step 2 — compare again
  await until(S(41));
  await play(
    ...fbox(['Step 2: teacher − student', ' "six":   0.70 − 0.60', ' "6":     0.20 − 0.22', ' "seven": 0.10 − 0.18'], C.amber),
    ...say('STEP 2: COMPARE AGAIN', C.amber)
  );

  // 42: Step 2 score changes: +0.20, -0.04, -0.16
  await until(S(42));
  await play(
    ...fbox(['Step 2 changes (× 2)', [' "six":   +0.20', C.green], [' "6":     −0.04', C.pink], [' "seven": −0.16', C.pink]]),
    ...say('STEP 2: +0.20 · −0.04 · −0.16')
  );

  // 43: Student chances after Step 2 -> 67%, 19%, 14%
  await until(S(43));
  await play(
    ...updateStudent([67, 19, 14], ['67%', '19%', '14%'], 1.0),
    ...fbox(['After Step 2', [' "six":   67%', C.green], [' "6":     19%', C.green], [' "seven": 14%', C.green]], C.green),
    ...say('STEP 2: 67% · 19% · 14%', C.green)
  );

  // 44: Loss falls to 0.007
  const seg2 = new M.Line({ start: ptAt(1), end: ptAt(2), color: C.amber, strokeWidth: 3 });
  const dot2 = new M.Dot({ point: ptAt(2), radius: 0.075, color: C.amber });
  await until(S(44));
  await play(
    new M.Create(seg2), new M.FadeIn(dot2), new M.Flash(dot2, { color: C.amber }),
    ...fbox(['Loss after Step 2', [' 0.03  →  0.007', C.amber]], C.amber),
    ...say('LOSS: 0.03 → 0.007', C.amber)
  );

  // 45: Step 3 score changes: +0.07, +0.01, -0.08
  await until(S(45));
  await play(
    ...fbox(['Step 3 changes (× 2)', [' "six":   +0.07', C.green], [' "6":     +0.01', C.green], [' "seven": −0.08', C.pink]]),
    ...say('STEP 3: +0.07 · +0.01 · −0.08')
  );

  // 46: Student chances after Step 3 -> 69%, 19%, 12%
  await until(S(46));
  await play(
    ...updateStudent([69, 19, 12], ['69%', '19%', '12%'], 1.0),
    ...fbox(['After Step 3', [' "six":   69%', C.green], [' "6":     19%', C.green], [' "seven": 12%', C.green]], C.green),
    ...say('STEP 3: 69% · 19% · 12%', C.green)
  );

  // 47: Loss falls to 0.003
  const seg3 = new M.Line({ start: ptAt(2), end: ptAt(3), color: C.amber, strokeWidth: 3 });
  const dot3 = new M.Dot({ point: ptAt(3), radius: 0.075, color: C.amber });
  await until(S(47));
  await play(
    new M.Create(seg3), new M.FadeIn(dot3), new M.Flash(dot3, { color: C.amber }),
    ...fbox(['Loss after Step 3', [' 0.007  →  0.003', C.amber]], C.amber),
    ...say('LOSS: 0.007 → 0.003', C.amber)
  );

  // 48: Repeat steps faster -> approach 70%, 20%, 10%
  const segsFast = [4, 5, 6, 7, 8].map(k => new M.Line({ start: ptAt(k - 1), end: ptAt(k), color: C.amber, strokeWidth: 3 }));
  const dotsFast = [4, 5, 6, 7, 8].map(k => new M.Dot({ point: ptAt(k), radius: 0.065, color: C.amber }));
  await until(S(48));
  await play(
    ...updateStudent([69.5, 19.1, 11.4], ['69.5%', '19%', '11.5%'], 0.8),
    new M.Create(segsFast[0], { runTime: 0.6 }), new M.FadeIn(dotsFast[0], { runTime: 0.6 }),
    ...say('REPEATING STEPS FASTER...', C.green)
  );
  await play(
    ...updateStudent([69.9, 19.6, 10.5], ['70%', '19.5%', '10.5%'], 0.8),
    new M.Create(segsFast[1], { runTime: 0.5 }), new M.FadeIn(dotsFast[1], { runTime: 0.5 }),
    new M.Create(segsFast[2], { runTime: 0.5 }), new M.FadeIn(dotsFast[2], { runTime: 0.5 })
  );
  await play(
    ...updateStudent([70, 20, 10], ['70%', '20%', '10%'], 0.8),
    new M.Create(segsFast[3], { runTime: 0.5 }), new M.FadeIn(dotsFast[3], { runTime: 0.5 }),
    new M.Create(segsFast[4], { runTime: 0.5 }), new M.FadeIn(dotsFast[4], { runTime: 0.5 }),
    ...fbox(['Step 8: settled', [' "six":   70%', C.green], [' "6":     20%', C.green], [' "seven": 10%', C.green]], C.green)
  );

  // 49: Loss curve approaches zero
  const lblEnd = T('≈ 0', P ? 17 : 16, C.green, true, true); lblEnd.moveTo([lx(8) - 0.1, ly(0) + 0.30, 0]);
  await until(S(49));
  await play(
    new M.Indicate(dotsFast[4], { color: C.green }),
    new M.FadeIn(lblEnd),
    ...fbox(['Probabilities nearly identical', ['KL loss ≈ 0.000', C.green]], C.green),
    ...say('LOSS → 0 · PROBABILITIES MATCH', C.green)
  );

  // 50: The formula
  await until(S(50));
  await play(
    ...fbox([
      ['logit change =', C.ink],
      [' rate × (teacher − student)', C.amber],
      ['subtract first, then multiply', C.muted],
    ], C.amber),
    ...say('THE UPDATE FORMULA', C.amber)
  );

  // 51: What it is for — smaller, less memory, faster
  await until(S(51));
  await play(
    ...fbox([
      ['Why distill?', C.cyan],
      ['• 10× fewer weights', C.green],
      ['• Less memory', C.green],
      ['• Faster answers', C.green],
    ], C.green),
    ...say('SMALLER · LESS MEMORY · FASTER', C.green)
  );

  // 52: Trap — teacher gives wrong answer "seven" a 10% chance
  const trapBox = new M.RoundedRectangle({
    width: P ? 6.5 : 6.9, height: P ? 0.92 : 1.02, cornerRadius: 0.14, color: C.pink, strokeWidth: 2.5,
  });
  trapBox.moveTo([BX0 + BMAX / 2 - (P ? 0.35 : 0.45), rowY[2], 0]);
  await until(S(52));
  await play(
    new M.Create(trapBox),
    new M.Indicate(tBars[2], { color: C.pink }),
    ...fbox([
      ['Watch out: "seven"', C.pink],
      ['Teacher gives 10%', C.pink],
      ['(wrong answer!)', C.muted],
    ], C.pink),
    ...say('TRAP: TEACHER GIVES "seven" 10%', C.pink)
  );

  // 53: Student learns this mistake too
  await until(S(53));
  await play(
    new M.Indicate(sBars[2], { color: C.pink }),
    ...fbox([
      ['Student copies mistakes', C.pink],
      ['Teacher 10% → Student 10%', C.pink],
      ['Cannot beat its teacher', C.muted],
    ], C.pink),
    ...say('STUDENT LEARNS THE MISTAKE TOO', C.pink)
  );

  // 54: Recap
  await until(S(54));
  await play(
    new M.FadeOut(trapBox),
    new M.LaggedStart(sBars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.15, runTime: 1.5 }),
    ...fbox([
      ['Distillation', C.amber],
      ['Small student imitates', C.ink],
      ['all teacher probabilities', C.cyan],
      ['(70% · 20% · 10%)', C.green],
    ], C.amber),
    ...say('DISTILLATION: LEARN ALL PROBABILITIES', C.amber)
  );
}

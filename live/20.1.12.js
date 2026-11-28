// 20.1.12 Mixture of experts: choosing which parts of a model to use.
// Beat i = sentence i (0-based, 54 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;

  const PILL = P ? [0, 2.0, 0] : [0, 1.88, 0];
  const BOXP = P ? [0, 3.38, 0] : [4.95, -0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  // Formula box: one on screen at a time.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.36 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 3.9;
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

  // Helpers that place every part with moveTo before grouping.
  function card(label, x, y, w, h, color = C.cyan, size = 19, mono = false, fillOp = 0.92) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, fillOp); r.moveTo([x, y, 0]);
    const t = T(label, size, color, mono, true); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }
  function arrow(a, b, color = C.muted, strokeWidth = 2.4, tip = 0.14) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const shaft = new M.Line({ start: a, end: b, color, strokeWidth });
    const l1 = new M.Line({ start: [b[0] - tip * ux + tip * 0.55 * px, b[1] - tip * uy + tip * 0.55 * py, 0], end: b, color, strokeWidth });
    const l2 = new M.Line({ start: [b[0] - tip * ux - tip * 0.55 * px, b[1] - tip * uy - tip * 0.55 * py, 0], end: b, color, strokeWidth });
    return new M.VGroup(shaft, l1, l2);
  }
  function setVal(N, map, l, i, s, col = C.ink) {
    const a = N.value(l, i, s, col);
    map.set(l + ':' + i, a[0].mobject);
    return a;
  }

  // 0: campus newsletters (libraries, sports, exams, student clubs)
  const topics = ['Libraries', 'Sports', 'Exams', 'Student clubs'];
  const newsCols = [C.cyan, C.green, C.amber, C.violet];
  const newsCards = topics.map((name, k) => {
    const x = P ? (k % 2 ? 1.75 : -1.75) : (k - 1.5) * 3.1;
    const y = P ? (k < 2 ? -1.0 : -3.0) : -0.45;
    const w = P ? 3.4 : 2.65, h = P ? 1.6 : 1.3;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: newsCols[k], strokeWidth: 2 });
    r.setFill(C.card, 0.94); r.moveTo([x, y, 0]);
    const head = T('NEWSLETTER', P ? 15 : 15, C.muted, true, true); head.moveTo([x, y + 0.34, 0]);
    const txt = T(name, P ? 20 : 21, newsCols[k], false, true); txt.moveTo([x, y - 0.08, 0]);
    const bar = new M.Line({ start: [x - w * 0.32, y - 0.42, 0], end: [x + w * 0.32, y - 0.42, 0], color: C.line, strokeWidth: 3 });
    return new M.VGroup(r, head, txt, bar);
  });
  await until(S(0));
  await play(new M.LaggedStart(newsCards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.5 }), ...say('CAMPUS NEWSLETTERS'));

  // 1: larger model -> more calculations per token
  const bigNet = net({
    layers: [3, 4, 4, 3],
    center: P ? [0, -2.2, 0] : [0, -0.55, 0],
    width: P ? 6.0 : 8.2,
    height: P ? 3.8 : 3.1,
    r: P ? 0.21 : 0.23
  });
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...newsCards)), new M.FadeIn(bigNet.group), ...say('BIGGER MODEL = MORE CALCULATIONS', C.amber));
  await play(...bigNet.flow(0, C.amber), ...bigNet.flow(1, C.amber), ...bigNet.flow(2, C.amber));

  // 2: use only part of the model for each token?
  await until(S(2));
  bigNet.nodes.forEach((col, l) => col.forEach((n, i) => {
    const keep = (l === 0 && i === 1) || (l === 1 && i < 2) || (l === 2 && i < 2) || (l === 3 && i === 0);
    if (!keep) { n.setStrokeOpacity(0.18); n.setFill(C.card, 0.25); }
    else { n.setColor(C.amber); n.setStrokeWidth(3.5); }
  }));
  bigNet.edges.forEach((layer, l) => layer.forEach((row, i) => row.forEach((ln, j) => {
    const keep = (l === 0 && i === 1 && j < 2) || (l === 1 && i < 2 && j < 2) || (l === 2 && i < 2 && j === 0);
    if (!keep) ln.setStrokeOpacity(0.12);
    else { ln.setColor(C.amber); ln.setStrokeWidth(3.2); ln.setStrokeOpacity(0.95); }
  })));
  await play(new M.Indicate(bigNet.nodes[1][0], { color: C.amber }), new M.Indicate(bigNet.nodes[2][0], { color: C.amber }), ...say('USE ONLY THE PARTS WE NEED?', C.amber));

  // 3: Newsletter A: Library opens at nine
  const nlA = (() => {
    const y = P ? -2.4 : -0.45, w = P ? 7.0 : 7.8, h = P ? 2.2 : 1.7;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([0, y, 0]);
    const h1 = T('NEWSLETTER A', P ? 15 : 16, C.muted, true, true); h1.moveTo([0, y + 0.45, 0]);
    const h2 = T('Library opens at nine', P ? 28 : 34, C.ink, false, true); h2.moveTo([0, y - 0.12, 0]);
    return new M.VGroup(r, h1, h2);
  })();
  await until(S(3));
  await play(new M.FadeOut(bigNet.group), new M.FadeIn(nlA), ...say('NEWSLETTER A'));

  // 4: four words on separate glowing token cards
  const words = ['Library', 'opens', 'at', 'nine'];
  const tokCards = words.map((w, k) => {
    const x = P ? (k - 1.5) * 1.85 : (k - 1.5) * 2.5;
    const y = P ? -2.4 : -0.45;
    return card(w, x, y, P ? 1.7 : 2.1, P ? 1.0 : 0.95, C.cyan, P ? 20 : 23, true);
  });
  await until(S(4));
  await play(new M.FadeOut(nlA), new M.LaggedStart(tokCards.map(c => new M.FadeIn(c)), { lagRatio: 0.14, runTime: 1.2 }), ...say('4 GLOWING TOKEN CARDS'));

  // 5: follow the token nine
  const TOK_P = P ? [-2.25, 1.22, 0] : [-5.95, -0.65, 0];
  const tokNine = card('nine', TOK_P[0], TOK_P[1], P ? 1.25 : 1.25, P ? 0.56 : 0.62, C.amber, P ? 19 : 20, true);
  await until(S(5));
  const nineRing = new M.RoundedRectangle({ width: (P ? 1.7 : 2.1) + 0.16, height: (P ? 1.0 : 0.95) + 0.16, cornerRadius: 0.18, color: C.amber, strokeWidth: 3.5 });
  nineRing.moveTo(tokCards[3].submobjects[0].getCenter());
  await play(new M.Create(nineRing), new M.Indicate(tokCards[3], { color: C.amber }), ...say('FOLLOW TOKEN: "nine"', C.amber));

  // 6: draw single neural network as circles in columns + glowing lines
  const ffnC = P ? [0.15, -1.8, 0] : [0.2, -0.65, 0];
  const ffnW = P ? 5.6 : 6.6, ffnH = P ? 3.2 : 2.6, ffnR = P ? 0.27 : 0.28;
  const ffn = net({ layers: [2, 3, 2], center: ffnC, width: ffnW, height: ffnH, r: ffnR });
  const ffnVals = new Map();
  const tokToFfn = arrow(
    P ? [TOK_P[0], TOK_P[1] - 0.34, 0] : [TOK_P[0] + 0.68, TOK_P[1], 0],
    P ? [ffnC[0] - ffnW / 2, ffnC[1] + ffnH / 2 + 0.34, 0] : [ffnC[0] - ffnW / 2 - ffnR - 0.12, ffnC[1], 0],
    C.amber
  );
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(tokCards[0], tokCards[1], tokCards[2], nineRing)),
    new M.ReplacementTransform(tokCards[3], tokNine, { runTime: 0.9 }));
  await play(new M.FadeIn(tokToFfn), new M.FadeIn(ffn.group), ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS'));

  // 7: numbers inside the network represent token information
  const ffnWts = [[0.8, -0.5, 0.7], [-0.4, 0.9, 0.3]];
  const ffnWts2 = [[0.7, -0.6], [0.5, 0.8], [-0.3, 0.6]];
  const wAnims = [];
  ffnWts.forEach((row, i) => row.forEach((w, j) => wAnims.push(...ffn.weight(0, i, j, w))));
  ffnWts2.forEach((row, i) => row.forEach((w, j) => wAnims.push(...ffn.weight(1, i, j, w))));
  await until(S(7));
  await play(
    ...setVal(ffn, ffnVals, 0, 0, '0.8', C.ink),
    ...setVal(ffn, ffnVals, 0, 1, '0.4', C.ink),
    ...wAnims,
    ...say('NUMBERS = TOKEN INFORMATION')
  );

  // 8: numbers pass through and transform into new numbers
  await until(S(8));
  await play(
    ...ffn.flow(0, C.amber),
    ...setVal(ffn, ffnVals, 1, 0, '0.6', C.cyan),
    ...setVal(ffn, ffnVals, 1, 1, '0.9', C.cyan),
    ...setVal(ffn, ffnVals, 1, 2, '0.2', C.cyan),
    ...say('NUMBERS TRANSFORMED', C.amber)
  );
  await play(
    ...ffn.flow(1, C.amber),
    ...setVal(ffn, ffnVals, 2, 0, '0.7', C.amber),
    ...setVal(ffn, ffnVals, 2, 1, '0.5', C.amber)
  );

  // 9: called a feed-forward network
  const ffnBox = new M.RoundedRectangle({ width: ffnW + 1.1, height: ffnH + 1.0, cornerRadius: 0.2, color: C.green, strokeWidth: 2.2 });
  ffnBox.moveTo(ffnC);
  const ffnLbl = T('feed-forward network', P ? 18 : 19, C.green, true, true);
  ffnLbl.moveTo([ffnC[0], ffnC[1] - ffnH / 2 - 0.78, 0]);
  await until(S(9));
  await play(new M.Create(ffnBox), new M.FadeIn(ffnLbl), ...say('FEED-FORWARD NETWORK', C.green));

  // 10: replace single network with 4 separate feed-forward networks
  const EY = P ? [0.20, -1.30, -2.80, -4.30] : [1.00, -0.10, -1.20, -2.30];
  const CTR_Y = P ? -2.05 : -0.65;
  const EX_X = P ? 1.25 : -0.20;
  const EX_W = P ? 1.95 : 1.80;
  const EX_H = P ? 0.66 : 0.50;
  const EX_R = P ? 0.17 : 0.15;
  const FR_W = P ? 2.6 : 2.45;
  const FR_H = P ? 1.2 : 0.96;
  const EX_LEFT = EX_X - FR_W / 2;

  const exps = EY.map(y => net({ layers: [2, 2, 1], center: [EX_X, y, 0], width: EX_W, height: EX_H, r: EX_R }));
  const expVals = EY.map(() => new Map());
  const expFrames = EY.map(y => {
    const r = new M.RoundedRectangle({ width: FR_W, height: FR_H, cornerRadius: 0.14, color: C.cyan, strokeWidth: 1.8 });
    r.setFill(C.card, 0.35); r.moveTo([EX_X, y, -0.015]);
    return r;
  });
  const expTags = EY.map((y, k) => {
    const t = T('E' + (k + 1), P ? 16 : 15, C.cyan, true, true);
    t.moveTo([EX_X + FR_W / 2 - 0.2, y + FR_H / 2 - 0.2, 0]);
    return t;
  });

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(ffn.group, ...ffnVals.values(), ffnBox, ffnLbl, tokToFfn)),
    new M.LaggedStart(exps.map((ex, k) => new M.FadeIn(ex.group)), { lagRatio: 0.15, runTime: 1.4 }),
    new M.LaggedStart(expFrames.map(f => new M.FadeIn(f)), { lagRatio: 0.15, runTime: 1.4 }),
    new M.LaggedStart(expTags.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('4 SEPARATE NETWORKS')
  );
  ffnVals.clear();

  // 11: each network has its own connected circles and weights
  const expPatterns = [
    [[0.8, -0.4], [-0.6, 0.7], [0.5, -0.8]],
    [[-0.7, 0.9], [0.8, 0.5], [0.9, 0.6]],
    [[0.6, 0.5], [-0.8, 0.9], [-0.5, 0.9]],
    [[-0.9, -0.3], [0.4, -0.7], [0.6, -0.5]]
  ];
  const ewAnims = [];
  exps.forEach((ex, k) => {
    const pat = expPatterns[k];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) ewAnims.push(...ex.weight(0, i, j, pat[i][j]));
    for (let i = 0; i < 2; i++) ewAnims.push(...ex.weight(1, i, 0, pat[2][i]));
  });
  await until(S(11));
  await play(...ewAnims, ...say('EACH HAS ITS OWN WEIGHTS'));

  // 12: four members of a campus information team
  const badgeX = P ? -1.45 : -2.65;
  const teamCols = [C.cyan, C.amber, C.green, C.violet];
  const teamBadges = EY.map((y, k) => card('Member ' + (k + 1), badgeX, y, P ? 1.95 : 1.75, P ? 0.66 : 0.54, teamCols[k], P ? 16 : 16));
  await until(S(12));
  await play(new M.LaggedStart(teamBadges.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.3 }), ...say('4 TEAM MEMBERS · DIFFERENT KNOWLEDGE', C.violet));

  // 13: ask the people most suited to your question
  await until(S(13));
  await play(
    new M.Indicate(teamBadges[1], { color: C.amber }),
    new M.Indicate(teamBadges[2], { color: C.amber }),
    new M.Indicate(expFrames[1], { color: C.amber }),
    new M.Indicate(expFrames[2], { color: C.amber }),
    ...say('ASK ONLY THE BEST FIT', C.amber)
  );

  // 14: our language model works in a similar way
  await until(S(14));
  await play(new M.FadeOut(new M.VGroup(...teamBadges)), ...say('OUR MODEL WORKS THE SAME WAY'));

  // 15: each smaller network is called an expert
  await until(S(15));
  await play(new M.LaggedStart(expFrames.map(f => new M.Indicate(f, { color: C.green })), { lagRatio: 0.14, runTime: 1.4 }), ...say('EACH NETWORK = AN EXPERT', C.green));

  // 16: add a small selection network (router)
  const RT_X = P ? -2.25 : -4.05;
  const RT_W = P ? 1.00 : 1.10;
  const RT_H = P ? 4.50 : 3.30;
  const router = net({ layers: [2, 4], center: [RT_X, CTR_Y, 0], width: RT_W, height: RT_H, r: 0.15, color: C.amber });
  const tokToRouter = arrow(
    P ? [TOK_P[0], TOK_P[1] - 0.30, 0] : [TOK_P[0] + 0.66, TOK_P[1], 0],
    P ? [RT_X - RT_W / 2, CTR_Y + RT_H / 6 + 0.32, 0] : [RT_X - RT_W / 2 - 0.20, CTR_Y, 0],
    C.amber
  );
  const rStart = RT_X + RT_W / 2 + 0.18;
  const rEnd = EX_LEFT - 0.06;
  const routeLines = EY.map(y => new M.Line({ start: [rStart, y, 0], end: [rEnd, y, 0], color: C.muted, strokeWidth: 2.2 }));
  await until(S(16));
  await play(
    new M.FadeIn(tokToRouter),
    new M.FadeIn(router.group),
    new M.LaggedStart(routeLines.map(ln => new M.Create(ln)), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('ADD A SELECTION NETWORK')
  );

  // 17: called a router
  const routerLbl = T('router', P ? 17 : 18, C.amber, true, true);
  routerLbl.moveTo([RT_X, EY[3] - (P ? 0.50 : 0.44), 0]);
  await until(S(17));
  await play(new M.FadeIn(routerLbl), new M.Indicate(router.group, { color: C.amber }), ...say('ROUTER', C.amber));

  // 18: router gives each expert a score
  const midX = (rStart + rEnd) / 2;
  const rawScores = ['0.4', '1.8', '0.7', '-0.7'];
  const scoreTexts = rawScores.map((s, k) => {
    const t = T(s, P ? 16 : 16, C.ink, true, true);
    t.moveTo([midX, EY[k] + 0.24, 0]);
    return t;
  });
  await until(S(18));
  await play(
    ...router.flow(0, C.amber),
    new M.LaggedStart(scoreTexts.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.1 }),
    ...fbox(['logits:', 'E1:  0.4   E2:  1.8', 'E3:  0.7   E4: -0.7']),
    ...say('A LOGIT FOR EACH EXPERT')
  );

  // 19: converts scores into percentages summing to 100%
  const pctStrs = ['15%', '60%', '20%', '5%'];
  const pctCols = [C.muted, C.amber, C.cyan, C.muted];
  const pctTexts = pctStrs.map((s, k) => {
    const t = T(s, P ? 16 : 17, pctCols[k], true, true);
    t.moveTo([midX, EY[k] + 0.25, 0]);
    return t;
  });
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...scoreTexts)),
    new M.LaggedStart(pctTexts.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox(['15% + 60% + 20% + 5%', ['= 100%', C.cyan]]),
    ...say('LOGITS → PERCENTAGES (100%)')
  );

  // 20: softmax
  await until(S(20));
  await play(
    ...fbox(['softmax:', 'logits → 100% total', ['15%  60%  20%  5%', C.green]], C.green),
    ...say('SOFTMAX', C.green)
  );

  // 21-24: read out each expert's percentage
  await until(S(21));
  await play(new M.Indicate(pctTexts[0], { color: C.cyan }), ...fbox(['token "nine":', ['E1: 15%', C.cyan]]), ...say('EXPERT 1: 15%'));

  await until(S(22));
  await play(new M.Indicate(pctTexts[1], { color: C.amber }), ...fbox(['token "nine":', 'E1: 15%', ['E2: 60%', C.amber]], C.amber), ...say('EXPERT 2: 60%', C.amber));

  await until(S(23));
  await play(new M.Indicate(pctTexts[2], { color: C.cyan }), ...fbox(['token "nine":', 'E1: 15%', ['E2: 60%', C.amber], ['E3: 20%', C.cyan]]), ...say('EXPERT 3: 20%', C.cyan));

  await until(S(24));
  await play(new M.Indicate(pctTexts[3], { color: C.muted }), ...fbox(['E1: 15%', ['E2: 60%', C.amber], ['E3: 20%', C.cyan], ['E4:  5%', C.muted]]), ...say('EXPERT 4: 5%', C.muted));

  // 25: use only the two experts with highest percentages
  await until(S(25));
  await play(
    ...fbox(['keep top 2:', ['E2: 60%', C.amber], ['E3: 20%', C.cyan]], C.amber),
    ...say('KEEP TOP 2 EXPERTS', C.amber)
  );

  // 26: router selects second and third experts
  const hi2 = expFrames[1].copy(); hi2.setColor(C.amber); hi2.setStrokeWidth(3.2); hi2.setFill(C.card, 0.55);
  const hi3 = expFrames[2].copy(); hi3.setColor(C.cyan); hi3.setStrokeWidth(3.2); hi3.setFill(C.card, 0.55);
  const rl2 = routeLines[1].copy(); rl2.setColor(C.amber); rl2.setStrokeWidth(4);
  const rl3 = routeLines[2].copy(); rl3.setColor(C.cyan); rl3.setStrokeWidth(3.5);
  await until(S(26));
  await play(
    new M.Transform(expFrames[1], hi2),
    new M.Transform(expFrames[2], hi3),
    new M.Transform(routeLines[1], rl2),
    new M.Transform(routeLines[2], rl3),
    ...say('SELECTED: E2 & E3', C.amber)
  );

  // 27: watch token's numerical signals travel into these two networks
  const sig2 = new M.Dot({ point: [rStart, EY[1], 0], radius: 0.11, color: C.amber });
  const sig3 = new M.Dot({ point: [rStart, EY[2], 0], radius: 0.11, color: C.cyan });
  const sig2End = new M.Dot({ point: [EX_X - EX_W / 2, EY[1], 0], radius: 0.11, color: C.amber });
  const sig3End = new M.Dot({ point: [EX_X - EX_W / 2, EY[2], 0], radius: 0.11, color: C.cyan });
  await until(S(27));
  await play(
    new M.Transform(sig2, sig2End, { runTime: 0.9 }),
    new M.Transform(sig3, sig3End, { runTime: 0.9 }),
    ...say('NUMBERS ENTER E2 & E3', C.cyan)
  );
  await play(
    new M.FadeOut(new M.VGroup(sig2, sig3), { runTime: 0.4 }),
    ...setVal(exps[1], expVals[1], 0, 0, '1', C.amber),
    ...setVal(exps[1], expVals[1], 0, 1, '0', C.amber),
    ...setVal(exps[2], expVals[2], 0, 0, '1', C.cyan),
    ...setVal(exps[2], expVals[2], 0, 1, '0', C.cyan)
  );

  // 28: first and fourth experts remain inactive
  const dimExpert = k => {
    exps[k].nodes.flat().forEach(n => { n.setStrokeOpacity(0.2); n.setFill(C.card, 0.2); });
    exps[k].edges.flat(2).forEach(ln => ln.setStrokeOpacity(0.12));
  };
  const dimF0 = expFrames[0].copy(); dimF0.setColor(C.muted); dimF0.setStrokeOpacity(0.25); dimF0.setFill(C.card, 0.15);
  const dimF3 = expFrames[3].copy(); dimF3.setColor(C.muted); dimF3.setStrokeOpacity(0.25); dimF3.setFill(C.card, 0.15);
  const dimR0 = routeLines[0].copy(); dimR0.setStrokeOpacity(0.2);
  const dimR3 = routeLines[3].copy(); dimR3.setStrokeOpacity(0.2);
  const off1 = T('off', P ? 16 : 15, C.pink, true, true); off1.moveTo([EX_X + FR_W / 2 + 0.3, EY[0], 0]);
  const off4 = T('off', P ? 16 : 15, C.pink, true, true); off4.moveTo([EX_X + FR_W / 2 + 0.3, EY[3], 0]);
  await until(S(28));
  dimExpert(0); dimExpert(3);
  await play(
    new M.Transform(expFrames[0], dimF0),
    new M.Transform(expFrames[3], dimF3),
    new M.Transform(routeLines[0], dimR0),
    new M.Transform(routeLines[3], dimR3),
    new M.FadeIn(off1),
    new M.FadeIn(off4),
    ...say('E1 & E4 STAY INACTIVE', C.pink)
  );

  // 29: two selected percentages add to only 80%
  await until(S(29));
  await play(
    ...fbox(['selected total:', '60% + 20% = 80%', ['only 80% (not 100%)', C.pink]], C.pink),
    ...say('60% + 20% = 80% ONLY', C.pink)
  );

  // 30: want their new percentages to add to 100%
  await until(S(30));
  await play(
    ...fbox(['60% + 20% = 80%', ['rescale to 100%', C.cyan]]),
    ...say('NEW SHARES MUST ADD TO 100%')
  );

  // 31: 60 / 80 = 75% for E2
  const share2 = T('75%', P ? 17 : 18, C.amber, true, true);
  share2.moveTo([midX, EY[1] + 0.25, 0]);
  await until(S(31));
  await play(
    new M.FadeOut(pctTexts[1]),
    new M.FadeIn(share2),
    ...fbox(['new shares:', ['E2: 60 ÷ 80 = 75%', C.amber]], C.amber),
    ...say('E2 NEW SHARE = 75%', C.amber)
  );

  // 32: 20 / 80 = 25% for E3
  const share3 = T('25%', P ? 17 : 18, C.cyan, true, true);
  share3.moveTo([midX, EY[2] + 0.25, 0]);
  await until(S(32));
  await play(
    new M.FadeOut(pctTexts[2]),
    new M.FadeIn(share3),
    ...fbox(['E2: 60 ÷ 80 = 75%', ['E3: 20 ÷ 80 = 25%', C.cyan], ['75% + 25% = 100%', C.green]]),
    ...say('E3 NEW SHARE = 25%', C.cyan)
  );

  // 33: both selected networks process the token through their connected circles
  await until(S(33));
  await play(...exps[1].flow(0, C.amber), ...exps[2].flow(0, C.cyan), ...say('E2 & E3 PROCESS THE TOKEN', C.amber));
  await play(...exps[1].flow(1, C.amber), ...exps[2].flow(1, C.cyan));

  // 34: each expert produces one output number
  await until(S(34));
  await play(
    new M.Indicate(exps[1].nodes[2][0], { color: C.amber }),
    new M.Indicate(exps[2].nodes[2][0], { color: C.cyan }),
    ...say('ONE OUTPUT NUMBER EACH')
  );

  // 35: E2 produces 4
  await until(S(35));
  await play(
    ...setVal(exps[1], expVals[1], 2, 0, '4', C.amber),
    new M.Flash(exps[1].nodes[2][0], { color: C.amber, flashRadius: 0.18, lineLength: 0.12 }),
    ...fbox([['E2 output = 4', C.amber]], C.amber),
    ...say('EXPERT 2 OUTPUT = 4', C.amber)
  );

  // 36: E3 produces 8
  await until(S(36));
  await play(
    ...setVal(exps[2], expVals[2], 2, 0, '8', C.cyan),
    new M.Flash(exps[2].nodes[2][0], { color: C.cyan, flashRadius: 0.18, lineLength: 0.12 }),
    ...fbox([['E2 output = 4', C.amber], ['E3 output = 8', C.cyan]]),
    ...say('EXPERT 3 OUTPUT = 8', C.cyan)
  );

  // 37: 75% of 4 = 3
  const COMB_X = P ? 3.10 : 1.90;
  const combCircle = new M.Circle({ radius: 0.28, color: C.green, strokeWidth: 3 });
  combCircle.setFill(C.card, 0.95); combCircle.moveTo([COMB_X, CTR_Y, 0]);
  const outX = EX_X + FR_W / 2 + 0.04;
  const combLine2 = arrow([outX, EY[1], 0], [COMB_X - 0.30, CTR_Y + 0.10, 0], C.amber, 3);
  const wLbl2 = T('3', 17, C.amber, true, true);
  wLbl2.moveTo([(outX + COMB_X - 0.30) / 2, (EY[1] + CTR_Y + 0.10) / 2 + 0.24, 0]);
  await until(S(37));
  await play(
    new M.FadeIn(combCircle),
    new M.FadeIn(combLine2),
    new M.FadeIn(wLbl2),
    ...fbox([['75% × 4 = 3', C.amber]], C.amber),
    ...say('75% OF 4 = 3', C.amber)
  );

  // 38: 25% of 8 = 2
  const combLine3 = arrow([outX, EY[2], 0], [COMB_X - 0.30, CTR_Y - 0.10, 0], C.cyan, 3);
  const wLbl3 = T('2', 17, C.cyan, true, true);
  wLbl3.moveTo([(outX + COMB_X - 0.30) / 2, (EY[2] + CTR_Y - 0.10) / 2 - 0.24, 0]);
  await until(S(38));
  await play(
    new M.FadeIn(combLine3),
    new M.FadeIn(wLbl3),
    ...fbox([['75% × 4 = 3', C.amber], ['25% × 8 = 2', C.cyan]]),
    ...say('25% OF 8 = 2', C.cyan)
  );

  // 39: 3 + 2 = 5
  const combVal = T('5', 22, C.green, true, true); combVal.moveTo([COMB_X, CTR_Y, 0]);
  await until(S(39));
  await play(
    new M.FadeIn(combVal),
    new M.Flash(combCircle, { color: C.green, flashRadius: 0.32, lineLength: 0.16 }),
    ...fbox(['75% × 4 = 3', '25% × 8 = 2', ['3 + 2 = 5', C.green]], C.green),
    ...say('COMBINED OUTPUT = 5', C.green)
  );

  // 40: combined output continues through the rest of the language model
  const nextA = P ? [COMB_X, CTR_Y - 0.32, 0] : [COMB_X + 0.32, CTR_Y, 0];
  const nextB = P ? [COMB_X, CTR_Y - 1.25, 0] : [COMB_X + 0.92, CTR_Y, 0];
  const nextArrow = arrow(nextA, nextB, C.green, 3);
  const nextLbl = T('next', P ? 16 : 15, C.green, true, true);
  nextLbl.moveTo(P ? [COMB_X, CTR_Y - 1.48, 0] : [COMB_X + 0.62, CTR_Y + 0.28, 0]);
  const outPulse = new M.Dot({ point: nextA, radius: 0.10, color: C.green });
  const outPulseEnd = new M.Dot({ point: nextB, radius: 0.10, color: C.green });
  await until(S(40));
  await play(new M.FadeIn(nextArrow), new M.FadeIn(nextLbl), new M.Transform(outPulse, outPulseEnd, { runTime: 0.9 }), ...say('CONTINUES TO NEXT LAYER', C.green));
  await play(new M.FadeOut(outPulse, { runTime: 0.35 }));

  // 41: mixture of experts
  await until(S(41));
  await play(
    new M.Indicate(combCircle, { color: C.green }),
    new M.Indicate(expFrames[1], { color: C.amber }),
    new M.Indicate(expFrames[2], { color: C.cyan }),
    ...say('MIXTURE OF EXPERTS', C.green)
  );

  // 42: one short formula
  await until(S(42));
  await play(...fbox(['one short formula:']), ...say('ONE SHORT FORMULA'));

  // 43: formula line
  await until(S(43));
  await play(
    ...fbox([
      ['out = sum(share × expert)', C.ink],
      ['    = 0.75×4 + 0.25×8', C.muted],
      ['    = 3 + 2 = 5', C.amber]
    ], C.amber),
    ...say('SUM OF (NEW SHARE × OUTPUT)', C.amber)
  );

  // 44: larger models without using every expert for every token
  const softF0 = expFrames[0].copy(); softF0.setColor(C.cyan); softF0.setStrokeOpacity(0.55);
  const softF3 = expFrames[3].copy(); softF3.setColor(C.cyan); softF3.setStrokeOpacity(0.55);
  await until(S(44));
  await play(new M.Transform(expFrames[0], softF0), new M.Transform(expFrames[3], softF3), ...say('4 EXPERTS STORED · 2 RUN'));

  // 45: 2 of 4 equal-sized experts -> about half the expert calculations
  await until(S(45));
  await play(
    ...fbox(['active: 2 of 4 experts', ['work ≈ half (50%)', C.green]], C.green),
    ...say('2 OF 4 RUN ≈ HALF THE WORK', C.green)
  );

  // 46: trap — router keeps choosing the same expert
  const moeCleanup = [
    tokNine, tokToRouter, router.group, routerLbl, ...routeLines,
    pctTexts[0], pctTexts[3], share2, share3, off1, off4,
    ...expFrames, ...expTags, ...exps.map(e => e.group),
    ...expVals.flatMap(m => [...m.values()]),
    combCircle, combVal, combLine2, combLine3, wLbl2, wLbl3, nextArrow, nextLbl
  ];

  const LB_CX = P ? 0.3 : -1.8;
  const LB_SP = P ? 1.5 : 1.72;
  const LB_BASE = P ? -4.55 : -2.35;
  const LB_PITCH = P ? 0.54 : 0.42;
  const LB_BW = P ? 1.1 : 1.16;
  const LB_BH = P ? 0.40 : 0.31;
  const bx = k => LB_CX + (k - 1.5) * LB_SP;
  const bSlot = (k, j) => [bx(k), LB_BASE + (j + 0.5) * LB_PITCH, 0];
  const tokBlock = (p, color = C.cyan) => {
    const b = new M.Rectangle({ width: LB_BW, height: LB_BH, color, strokeWidth: 1.5 });
    b.setFill(color, 0.85); b.moveTo(p);
    return b;
  };

  const lbFloor = new M.Line({ start: [bx(0) - LB_SP / 2, LB_BASE, 0], end: [bx(3) + LB_SP / 2, LB_BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const lbNames = [0, 1, 2, 3].map(k => {
    const t = T('E' + (k + 1), 18, C.cyan, true, true);
    t.moveTo([bx(k), LB_BASE - 0.34, 0]);
    return t;
  });
  const lbRouter = card('Router (8 tokens)', LB_CX, P ? 0.65 : 1.05, P ? 3.4 : 3.2, 0.56, C.amber, 16, true);

  await until(S(46));
  await play(
    new M.FadeOut(new M.VGroup(...moeCleanup)),
    ...clearBox(),
    new M.Create(lbFloor),
    new M.FadeIn(new M.VGroup(...lbNames)),
    new M.FadeIn(lbRouter),
    ...say('TRAP: ROUTER PICKS ONE EXPERT', C.pink)
  );
  expVals.forEach(m => m.clear());

  // 47: send 8 tokens into the router -> first choices: E1=1, E2=6, E3=1, E4=0
  const initAssign = [1, 0, 1, 1, 1, 2, 1, 1];
  const colCounts = [0, 0, 0, 0];
  const tBlocks = initAssign.map((_, idx) => tokBlock([LB_CX + (idx - 3.5) * (P ? 0.72 : 0.76), P ? -0.05 : 0.45, 0], C.cyan));
  const dropAnims = initAssign.map((col, idx) => {
    const target = bSlot(col, colCounts[col]++);
    return new M.Transform(tBlocks[idx], tokBlock(target, col === 1 ? C.pink : C.cyan), { pathArc: -0.35 });
  });
  const initCntLbls = [1, 6, 1, 0].map((v, k) => {
    const t = T(String(v), 19, k === 1 || k === 3 ? C.pink : C.cyan, true, true);
    t.moveTo([bx(k), LB_BASE + Math.max(v, 0) * LB_PITCH + 0.28, 0]);
    return t;
  });
  await until(S(47));
  await play(new M.LaggedStart(tBlocks.map(b => new M.FadeIn(b)), { lagRatio: 0.06, runTime: 0.7 }), ...say('SEND 8 TOKENS TO THE ROUTER'));
  await play(new M.LaggedStart(dropAnims, { lagRatio: 0.14, runTime: 1.8 }), new M.FadeIn(new M.VGroup(...initCntLbls)));

  // 48: E2 gets 6 first choices while equal share is 2
  const fairY = LB_BASE + 2 * LB_PITCH;
  const fairLine = new M.DashedLine({ start: [bx(0) - LB_SP / 2, fairY, 0], end: [bx(3) + LB_SP / 2, fairY, 0], color: C.amber });
  const fairTag = T('fair = 2', P ? 16 : 16, C.amber, true, true);
  fairTag.moveTo([bx(0) - LB_SP / 2 - 0.12 - fairTag.getWidth() / 2, fairY, 0]);
  await until(S(48));
  await play(
    new M.Create(fairLine),
    new M.FadeIn(fairTag),
    ...fbox(['8 tokens ÷ 4 experts', ['fair share = 2 each', C.amber], ['E2 got 6 (overload)', C.pink]], C.pink),
    ...say('E2: 6 TOKENS (FAIR SHARE = 2)', C.pink)
  );

  // 49: E4 receives no tokens at all
  const emptyE4 = new M.RoundedRectangle({ width: LB_BW + 0.14, height: LB_PITCH * 2, cornerRadius: 0.12, color: C.pink, strokeWidth: 2 });
  emptyE4.moveTo([bx(3), LB_BASE + LB_PITCH, 0]);
  await until(S(49));
  await play(
    new M.Create(emptyE4),
    new M.Indicate(initCntLbls[3], { color: C.pink }),
    ...fbox(['fair share = 2 each', ['E2: 6 tokens', C.pink], ['E4: 0 tokens', C.pink]], C.pink),
    ...say('E4 GETS 0 TOKENS', C.pink)
  );

  // 50: E2 too much work, E4 no opportunity to learn
  const overLbl = T('overloaded', P ? 16 : 16, C.pink, true, true);
  overLbl.moveTo([bx(1), LB_BASE + 6 * LB_PITCH + 0.62, 0]);
  const idleLbl = T('no learning', P ? 16 : 16, C.pink, true, true);
  idleLbl.moveTo([bx(3), LB_BASE + 2 * LB_PITCH + 0.56, 0]);
  await until(S(50));
  await play(new M.FadeIn(overLbl), new M.FadeIn(idleLbl), ...say('E2 OVERLOADED · E4 UNUSED', C.pink));

  // 51: add extra cost to training loss -> even distribution (2, 2, 2, 2)
  // Indices of the 6 blocks on E2: 0, 2, 3, 4, 6, 7 (slots 0..5). Move top 4: idx 7 -> E4(0), 6 -> E4(1), 4 -> E3(1), 3 -> E1(1).
  const rebalanceMoves = [
    new M.Transform(tBlocks[7], tokBlock(bSlot(3, 0), C.green), { pathArc: -0.5 }),
    new M.Transform(tBlocks[6], tokBlock(bSlot(3, 1), C.green), { pathArc: -0.5 }),
    new M.Transform(tBlocks[4], tokBlock(bSlot(2, 1), C.green), { pathArc: -0.4 }),
    new M.Transform(tBlocks[3], tokBlock(bSlot(0, 1), C.green), { pathArc: 0.4 }),
    new M.Transform(tBlocks[0], tokBlock(bSlot(1, 0), C.green)),
    new M.Transform(tBlocks[2], tokBlock(bSlot(1, 1), C.green)),
    new M.Transform(tBlocks[1], tokBlock(bSlot(0, 0), C.green)),
    new M.Transform(tBlocks[5], tokBlock(bSlot(2, 0), C.green))
  ];
  const balCntLbls = [2, 2, 2, 2].map((v, k) => {
    const t = T(String(v), 19, C.green, true, true);
    t.moveTo([bx(k), LB_BASE + 2 * LB_PITCH + 0.28, 0]);
    return t;
  });
  await until(S(51));
  await play(
    new M.FadeOut(new M.VGroup(overLbl, idleLbl, emptyE4, ...initCntLbls)),
    new M.LaggedStart(rebalanceMoves, { lagRatio: 0.08, runTime: 2.0 }),
    new M.FadeIn(new M.VGroup(...balCntLbls)),
    ...fbox(['total loss =', '  task loss', ['+ balance cost', C.amber]], C.amber),
    ...say('ADD BALANCE COST TO LOSS', C.amber)
  );

  // 52: load balancing
  await until(S(52));
  await play(
    new M.LaggedStart(balCntLbls.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox(['2 · 2 · 2 · 2 tokens', ['work shared evenly', C.green]], C.green),
    ...say('LOAD BALANCING', C.green)
  );

  // 53: recap
  await until(S(53));
  await play(
    ...fbox([
      ['1. Choose a few experts', C.cyan],
      ['2. Combine their answers', C.amber],
      ['3. Share work fairly', C.green]
    ], C.green),
    ...say('MIXTURE OF EXPERTS', C.green)
  );
}

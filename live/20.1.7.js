// 20.1.7 Perplexity: measuring how uncertain a language model is.
// Beat i = sentence i (0-based, 54 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const ORANGE = '#fb923c';
  const CX = P ? 0 : -2.1;
  const PILL = P ? [0, 2.2, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.5, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time, identical to 1.2.4/scene.js
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.45 })];
  }

  function styleWeights(N, weights) {
    for (let l = 0; l < N.edges.length; l++) {
      for (let i = 0; i < N.edges[l].length; i++) {
        for (let j = 0; j < N.edges[l][i].length; j++) {
          const w = weights[(l * 9 + i * 3 + j) % weights.length];
          const ln = N.edges[l][i][j];
          const a = Math.min(1, Math.abs(w));
          ln.setColor(w < 0 ? C.pink : C.cyan);
          ln.setStrokeWidth(1.4 + 3.4 * a);
          ln.setStrokeOpacity(0.35 + 0.55 * a);
        }
      }
    }
  }

  function makeCard(text, pos, color = C.cyan, w = 1.4, h = 0.64, fs = 18, mono = true) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const t = T(text, fs, color, mono, true);
    if (t.getWidth() > w - 0.18) t.scale((w - 0.18) / t.getWidth());
    t.moveTo(pos);
    return new M.VGroup(r, t);
  }

  // --- Beats 0-2: Two language models learning from campus newsletters -------
  const mAx = P ? -1.9 : -3.55, mBx = P ? 1.9 : 3.55, mY = P ? -1.0 : 0.1;
  const mA = net({ layers: [2, 3, 2], center: [mAx, mY, 0], width: P ? 2.9 : 2.8, height: P ? 2.5 : 1.75, r: P ? 0.24 : 0.2, color: C.cyan });
  const mB = net({ layers: [2, 3, 2], center: [mBx, mY, 0], width: P ? 2.9 : 2.8, height: P ? 2.5 : 1.75, r: P ? 0.24 : 0.2, color: C.violet });
  styleWeights(mA, [0.9, -0.4, 0.7, -0.6, 0.8, 0.3, -0.5, 0.9, -0.3]);
  styleWeights(mB, [-0.5, 0.8, -0.7, 0.4, -0.6, 0.9, 0.3, -0.8, 0.6]);
  const labA = T('Model A', P ? 20 : 22, C.cyan, false, true); labA.moveTo([mAx, mY + (P ? 1.75 : 1.25), 0]);
  const labB = T('Model B', P ? 20 : 22, C.violet, false, true); labB.moveTo([mBx, mY + (P ? 1.75 : 1.25), 0]);

  const newsTitles = ['Library...', 'Pool...', 'Exams...'];
  const newsY = P ? -4.1 : -2.25;
  const newsCards = newsTitles.map((s, k) =>
    makeCard(s, [(k - 1) * (P ? 2.4 : 2.5), newsY, 0], C.cyan, P ? 2.2 : 2.15, P ? 0.75 : 0.6, P ? 18 : 17));
  const newsTag = T('campus newsletters', P ? 16 : 17, C.muted); newsTag.moveTo([0, newsY - 0.56, 0]);

  await until(S(0));
  await play(
    new M.FadeIn(mA.group, { runTime: 0.9 }),
    new M.FadeIn(mB.group, { runTime: 0.9 }),
    new M.FadeIn(labA, { runTime: 0.9 }),
    new M.FadeIn(labB, { runTime: 0.9 }),
    new M.LaggedStart(newsCards.map(c => new M.FadeIn(c, { runTime: 0.5 })), { lagRatio: 0.18, runTime: 1.0 }),
    new M.FadeIn(newsTag, { runTime: 0.8 }),
    ...say('TWO LANGUAGE MODELS')
  );

  const newNews = makeCard('New newsletter', [0, P ? -5.6 : 0.1, 0], C.amber, P ? 3.8 : 2.85, 0.72, P ? 18 : 18, false);
  await until(S(1));
  await play(
    new M.FadeIn(newNews, { runTime: 0.7 }),
    ...mA.flow(0, C.cyan),
    ...mB.flow(0, C.violet),
    ...say('WHICH PREDICTS NEW TEXT BETTER?', C.amber)
  );

  const qA = makeCard('?', [mAx, P ? -2.9 : -1.25, 0], C.amber, 0.85, 0.56, 22);
  const qB = makeCard('?', [mBx, P ? -2.9 : -1.25, 0], C.amber, 0.85, 0.56, 22);
  await until(S(2));
  await play(new M.FadeIn(qA, { runTime: 0.6 }), new M.FadeIn(qB, { runTime: 0.6 }), ...say('COMPARE WITH ONE NUMBER?', C.violet));

  // --- Beats 3-6: Short newsletter -> 5 tokens -> 4 prediction tasks ---------
  const paper = makeCard('Library opens at nine', [CX, P ? -3.0 : -0.25, 0], C.cyan, P ? 6.8 : 6.8, P ? 1.6 : 1.05, P ? 28 : 26, false);
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(mA.group, mB.group, labA, labB, ...newsCards, newsTag, newNews, qA, qB), { runTime: 0.55 }),
    ...say('SHORT CAMPUS NEWSLETTER')
  );
  await play(new M.FadeIn(paper, { runTime: 0.8 }));

  const TOKENS = ['Library', 'opens', 'at', 'nine', '<end>'];
  const TOK_Y = P ? 0.9 : 1.05;
  const TOK_SP = P ? 1.46 : 1.66;
  const TOK_W = P ? 1.32 : 1.5;
  const tokX = k => CX + (k - 2) * TOK_SP;
  const tokCards = TOKENS.map((w, k) =>
    makeCard(w, [tokX(k), TOK_Y, 0], k === 4 ? ORANGE : C.cyan, TOK_W, P ? 0.7 : 0.64, P ? 17 : 19));

  await until(S(4));
  await play(...(P ? [] : [new M.FadeOut(paper, { runTime: 0.45 })]), ...say('WORDS + ORANGE END TOKEN', ORANGE));
  await play(new M.LaggedStart(tokCards.map(c => new M.FadeIn(c, { runTime: 0.45 })), { lagRatio: 0.18, runTime: 1.4 }));

  await until(S(5));
  await play(
    new M.LaggedStart(tokCards.map(c => new M.Indicate(c, { color: C.amber, runTime: 0.5 })), { lagRatio: 0.16, runTime: 1.5 }),
    ...say('EACH PIECE = 1 TOKEN')
  );

  const taskArrows = [];
  for (let k = 0; k < 4; k++) {
    const x1 = tokX(k) + TOK_W / 2 - 0.12, x2 = tokX(k + 1) - TOK_W / 2 + 0.12, ay = TOK_Y - 0.58;
    const ar = new M.Arrow({ start: [x1, ay, 0], end: [x2, ay, 0], color: C.amber, strokeWidth: 2.5 });
    const nm = T(String(k + 1), 16, C.amber, true, true); nm.moveTo([(x1 + x2) / 2, ay - 0.28, 0]);
    taskArrows.push(new M.VGroup(ar, nm));
  }
  await until(S(6));
  await play(
    new M.LaggedStart(taskArrows.map(a => new M.FadeIn(a, { runTime: 0.45 })), { lagRatio: 0.18, runTime: 1.3 }),
    ...fbox(['5 tokens', ['4 prediction tasks', C.amber]]),
    ...say('5 TOKENS → 4 TASKS', C.amber)
  );

  // --- Beats 7-20: Neural network reads context & predicts 4 targets ---------
  const NET_Y = P ? -2.0 : -1.1;
  const N = net({
    layers: [3, 3, 2],
    center: [CX, NET_Y, 0],
    width: P ? 4.4 : 5.1,
    height: P ? 3.0 : 1.75,
    r: P ? 0.3 : 0.23,
    names: ['in 1', 'in 2', 'in 3'],
    outName: 'next',
    color: C.cyan
  });
  styleWeights(N, [0.85, -0.45, 0.65, -0.7, 0.9, 0.35, -0.5, 0.8, -0.6, 0.75, -0.35, 0.9, -0.55, 0.6, 0.4]);
  const netVals = {};
  function setVal(l, i, s, col = C.ink) {
    const a = N.value(l, i, s, col);
    netVals[l + ':' + i] = a[0].mobject;
    return a;
  }

  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(...taskArrows, ...(P ? [paper] : [])), { runTime: 0.45 }),
    new M.FadeIn(N.group, { runTime: 1.1 }),
    ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS')
  );

  // Context & target outline boxes (drawn from coordinates, never wrapping on-screen objects)
  let ctxBox = null, tgtBox = null;
  function moveContext(lastIdx) {
    const xL = tokX(0) - TOK_W / 2 - 0.08, xR = tokX(lastIdx) + TOK_W / 2 + 0.08;
    const b = new M.RoundedRectangle({ width: xR - xL, height: P ? 0.76 : 0.8, cornerRadius: 0.16, color: C.violet, strokeWidth: 2.5 });
    b.moveTo([(xL + xR) / 2, TOK_Y, 0]);
    const a = [new M.FadeIn(b, { runTime: 0.45 })];
    if (ctxBox) a.push(new M.FadeOut(ctxBox, { runTime: 0.35 }));
    ctxBox = b;
    return a;
  }
  function moveTarget(idx, col = C.amber) {
    const b = new M.RoundedRectangle({ width: TOK_W + 0.16, height: P ? 0.76 : 0.8, cornerRadius: 0.16, color: col, strokeWidth: 2.8 });
    b.moveTo([tokX(idx), TOK_Y, 0]);
    const a = [new M.FadeIn(b, { runTime: 0.45 })];
    if (tgtBox) a.push(new M.FadeOut(tgtBox, { runTime: 0.35 }));
    tgtBox = b;
    return a;
  }

  // Chance bar below the network
  const BAR_Y = P ? -4.75 : -2.65;
  const BAR_W = P ? 5.8 : 6.4;
  let barNow = null;
  function showBar(label, pct, col = C.amber) {
    const bx = CX, bw = BAR_W, bh = 0.36;
    const track = new M.RoundedRectangle({ width: bw, height: bh, cornerRadius: 0.1, color: C.line, strokeWidth: 1.8 });
    track.setFill(C.card, 0.9); track.moveTo([bx, BAR_Y, 0]);
    const fw = Math.max(0.18, bw * pct / 100);
    const fill = new M.RoundedRectangle({ width: fw, height: bh - 0.04, cornerRadius: 0.08, color: col, strokeWidth: 0 });
    fill.setFill(col, 0.85); fill.moveTo([bx - bw / 2 + fw / 2, BAR_Y, 0]);
    const txt = T(`${label}: ${pct}%`, P ? 19 : 18, col, true, true);
    txt.moveTo([bx, BAR_Y + (P ? 0.42 : 0.38), 0]);
    const g = new M.VGroup(track, fill, txt);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (barNow) a.push(new M.FadeOut(barNow, { runTime: 0.35 }));
    barNow = g;
    return a;
  }

  function dropBar() { const a = barNow ? [new M.FadeOut(barNow, { runTime: 0.3 })] : []; barNow = null; return a; }

  // Small loss tags under predicted tokens (k = 1..4)
  const TAG_Y = TOK_Y - 0.54;
  const lossTags = [];
  function addLossTag(k, txt, col) {
    const t = T(txt, P ? 15 : 16, col, true, true); t.moveTo([tokX(k), TAG_Y, 0]);
    lossTags.push(t);
    return [new M.FadeIn(t, { runTime: 0.5 })];
  }

  // Beat 8: send Library into network as numbers
  await until(S(8));
  await play(
    ...moveContext(0),
    ...fbox([['task 1: Library → ?', C.cyan], ['input: Library', C.violet]]),
    ...say('INPUT: Library → NUMBERS', C.violet)
  );

  // Beat 9: signals travel through layers
  await until(S(9));
  await play(
    ...N.flow(0, C.cyan),
    ...say('NUMBERS FLOW THROUGH THE LAYERS', C.amber)
  );
  await play(
    ...N.flow(1, C.amber)
  );

  // Beat 10: opens gets 12.5%
  await until(S(10));
  await play(
    ...moveTarget(1, C.amber),
    ...showBar('opens', 12.5, C.amber),
    ...fbox([['task 1: Library → opens', C.cyan], ['probability = 12.5%', C.amber]], C.amber),
    ...say('opens: PROBABILITY = 12.5%', C.amber)
  );

  // Beat 11-12: halvings from 100% -> 50% -> 25% -> 12.5%
  const HALV_Y = P ? -5.9 : -2.65;
  const hSteps = ['100%', '50%', '25%', '12.5%'];
  const hCols = [C.muted, C.cyan, C.cyan, C.amber];
  const hSp = P ? 1.85 : 2.0;
  const hNodes = hSteps.map((s, k) => makeCard(s, [CX + (k - 1.5) * hSp, HALV_Y, 0], hCols[k], P ? 1.2 : 1.28, 0.48, P ? 15 : 16));
  const hArrs = [0, 1, 2].map(k => {
    const x1 = CX + (k - 1.5) * hSp + (P ? 0.62 : 0.66), x2 = CX + (k - 0.5) * hSp - (P ? 0.62 : 0.66);
    const ar = new M.Arrow({ start: [x1, HALV_Y, 0], end: [x2, HALV_Y, 0], color: C.amber, strokeWidth: 2 });
    const lb = T('÷2', 15, C.amber, true); lb.moveTo([(x1 + x2) / 2, HALV_Y + 0.3, 0]);
    return new M.VGroup(ar, lb);
  });

  await until(S(11));
  const hideBarForHalv = (!P && barNow) ? [new M.FadeOut(barNow, { runTime: 0.35 })] : [];
  if (!P) barNow = null;
  await play(
    ...hideBarForHalv,
    new M.FadeIn(hNodes[0], { runTime: 0.6 }),
    ...fbox(['loss = count halvings', ['from 100% to target', C.cyan]]),
    ...say('LOSS = COUNT HALVINGS FROM 100%')
  );

  await until(S(12));
  await play(
    new M.LaggedStart([
      new M.FadeIn(hArrs[0], { runTime: 0.35 }), new M.FadeIn(hNodes[1], { runTime: 0.35 }),
      new M.FadeIn(hArrs[1], { runTime: 0.35 }), new M.FadeIn(hNodes[2], { runTime: 0.35 }),
      new M.FadeIn(hArrs[2], { runTime: 0.35 }), new M.FadeIn(hNodes[3], { runTime: 0.35 })
    ], { lagRatio: 0.28, runTime: 2.0 }),
    ...fbox(['100% → 50%  (1)', '50%  → 25%  (2)', ['25%  → 12.5% (3)', C.amber]], C.amber),
    ...say('3 HALVINGS: 100% → 12.5%', C.amber)
  );

  // Beat 13: loss for opens is 3 bits
  await until(S(13));
  await play(
    ...addLossTag(1, '3 bits', C.amber),
    ...fbox([['opens: 12.5%', C.ink], ['loss = 3 bits', C.amber]], C.amber),
    ...say('opens: LOSS = 3 BITS', C.amber)
  );

  // Beat 14: Library opens -> at
  await until(S(14));
  await play(
    ...dropBar(),
    new M.FadeOut(new M.VGroup(...hNodes, ...hArrs), { runTime: 0.4 }),
    ...moveContext(1),
    ...moveTarget(2, C.green),
    ...fbox([['task 2: Library opens → at', C.cyan]]),
    ...say('TASK 2: PREDICT at')
  );
  await play(...N.flow(0, C.cyan));
  await play(...N.flow(1, C.green));

  // Beat 15: at gets 50%
  await until(S(15));
  await play(
    ...showBar('at', 50, C.green),
    ...fbox([['task 2: → at', C.cyan], ['probability = 50%', C.green]], C.green),
    ...say('at: PROBABILITY = 50%', C.green)
  );

  // Beat 16: loss of 1 bit (short 1.3s beat)
  await until(S(16));
  await play(
    ...addLossTag(2, '1 bit', C.green),
    ...fbox(['at: 50% (1 halving)', ['loss = 1 bit', C.green]], C.green),
    ...say('at: LOSS = 1 BIT', C.green)
  );

  // Beat 17: Library opens at -> nine
  await until(S(17));
  await play(
    ...dropBar(),
    ...moveContext(2),
    ...moveTarget(3, C.green),
    ...N.flow(0, C.cyan),
    ...fbox([['task 3: → nine', C.cyan]]),
    ...say('TASK 3: PREDICT nine')
  );
  await play(...N.flow(1, C.green));

  // Beat 18: nine gets 50% -> 1 bit
  await until(S(18));
  await play(
    ...showBar('nine', 50, C.green),
    ...addLossTag(3, '1 bit', C.green),
    ...fbox(['nine: 50% (1 halving)', ['loss = 1 bit', C.green]], C.green),
    ...say('nine: 50% → 1 BIT', C.green)
  );

  // Beat 19: Library opens at nine -> <end>
  await until(S(19));
  await play(
    ...dropBar(),
    ...moveContext(3),
    ...moveTarget(4, ORANGE),
    ...N.flow(0, C.cyan),
    ...fbox([['task 4: → <end>', ORANGE]], ORANGE),
    ...say('TASK 4: PREDICT <end>', ORANGE)
  );
  await play(...N.flow(1, ORANGE));

  // Beat 20: <end> gets 12.5% -> 3 bits
  await until(S(20));
  await play(
    ...showBar('<end>', 12.5, ORANGE),
    ...addLossTag(4, '3 bits', ORANGE),
    ...fbox(['<end>: 12.5% (3 halvings)', ['loss = 3 bits', ORANGE]], ORANGE),
    ...say('<end>: 12.5% → 3 BITS', ORANGE)
  );

  // --- Beats 21-28: Four stacks of glowing blocks -> average 2 bits ----------
  const LOSSES = [3, 1, 1, 3];
  const ST_NAMES = ['opens', 'at', 'nine', '<end>'];
  const ST_SP = P ? 1.68 : 1.85;
  const ST_BW = P ? 1.16 : 1.25;
  const ST_PITCH = P ? 1.05 : 0.78;
  const ST_BASE = P ? -4.3 : -2.1;
  const stX = k => CX + (k - 1.5) * ST_SP;
  const stSlot = (k, j) => [stX(k), ST_BASE + (j + 0.5) * ST_PITCH, 0];
  const makeBlock = (p, col = C.cyan) => {
    const b = new M.Rectangle({ width: ST_BW, height: ST_PITCH * 0.82, color: col, strokeWidth: 2 });
    b.setFill(col, 0.82); b.moveTo(p);
    return b;
  };

  const floor = new M.Line({ start: [stX(0) - ST_SP / 2, ST_BASE, 0], end: [stX(3) + ST_SP / 2, ST_BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const stNamesM = ST_NAMES.map((w, k) => {
    const t = T(w, P ? 17 : 18, k === 3 ? ORANGE : C.ink, true);
    t.moveTo([stX(k), ST_BASE - 0.34, 0]);
    return t;
  });
  const blockNote = T('1 block = 1 bit', 16, C.muted); blockNote.moveTo([CX, ST_BASE - (P ? 1.15 : 0.72), 0]);

  const fadeScene3 = [N.group, ...Object.values(netVals), ...tokCards, ...lossTags, ctxBox, tgtBox, barNow].filter(Boolean);
  await until(S(21));
  await play(new M.FadeOut(new M.VGroup(...fadeScene3), { runTime: 0.55 }), ...say('4 STACKS OF LOSS BLOCKS'));
  await play(
    new M.Create(floor, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...stNamesM, blockNote), { runTime: 0.6 }),
    ...fbox(['1 block = 1 bit', ['4 prediction tasks', C.cyan]])
  );

  const stacks = LOSSES.map((n, k) => Array.from({ length: n }, (_, j) => makeBlock(stSlot(k, j), k === 3 ? ORANGE : C.cyan)));
  const countRow = (vals, col) => vals.map((v, k) => {
    const t = T(String(v), 20, col, true, true);
    t.moveTo([stX(k), ST_BASE + v * ST_PITCH + 0.3, 0]);
    return t;
  });
  const stCounts1 = countRow(LOSSES, C.cyan);

  await until(S(22));
  await play(
    new M.LaggedStart(stacks.flat().map(b => new M.FadeIn(b, { runTime: 0.35 })), { lagRatio: 0.12, runTime: 1.4 }),
    new M.FadeIn(new M.VGroup(...stCounts1), { runTime: 0.7 }),
    ...fbox([['losses = 3, 1, 1, 3', C.cyan]]),
    ...say('STACKS: 3, 1, 1, 3 BLOCKS')
  );

  await until(S(23));
  await play(
    new M.LaggedStart(stacks.flat().map(b => new M.Indicate(b, { color: C.amber, runTime: 0.45 })), { lagRatio: 0.1, runTime: 1.5 }),
    ...fbox(['3 + 1 + 1 + 3', ['= 8 bits', C.amber]], C.amber),
    ...say('3 + 1 + 1 + 3 = 8', C.amber)
  );

  await until(S(24));
  await play(
    ...fbox(['total loss = 8 bits', ['tasks      = 4', C.muted]], C.amber),
    ...say('TOTAL LOSS = 8 BITS', C.amber)
  );

  // Beat 25: share 8 blocks equally -> move top of stack 0 to stack 1, top of stack 3 to stack 2
  const bLeft = stacks[0].pop(); stacks[1].push(bLeft);
  const bRight = stacks[3].pop(); stacks[2].push(bRight);
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(...stCounts1), { runTime: 0.35 }),
    new M.Transform(bLeft, makeBlock(stSlot(1, 1), C.cyan), { pathArc: -0.9, runTime: 1.4 }),
    new M.Transform(bRight, makeBlock(stSlot(2, 1), ORANGE), { pathArc: 0.9, runTime: 1.4 }),
    ...say('SHARE 8 BLOCKS EQUALLY', C.green)
  );

  // Beat 26: 8 / 4 = 2 bits per token
  const lvlY = ST_BASE + 2 * ST_PITCH;
  const levelLine = new M.DashedLine({ start: [stX(0) - ST_SP / 2, lvlY, 0], end: [stX(3) + ST_SP / 2, lvlY, 0], color: C.amber });
  const tag2 = pill('2 BITS EACH', C.amber, 17); tag2.moveTo([CX, lvlY + 0.48, 0]);
  const stCounts2 = countRow([2, 2, 2, 2], C.amber);

  await until(S(26));
  await play(
    new M.Create(levelLine, { runTime: 0.7 }),
    new M.FadeIn(tag2, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...stCounts2), { runTime: 0.6 }),
    ...fbox(['total = 8 bits', 'tasks = 4', ['8 ÷ 4 = 2 bits/token', C.amber]], C.green),
    ...say('8 ÷ 4 = 2 BITS PER TOKEN', C.amber)
  );

  await until(S(27));
  await play(
    new M.Indicate(tag2, { color: C.amber, runTime: 0.8 }),
    ...say('AVERAGE LOSS PER TOKEN = 2 BITS', C.amber)
  );

  const qBadge = makeCard('2 bits / token  =  ?', [CX, P ? -2.2 : -0.35, 0], C.violet, P ? 5.2 : 5.4, 1.0, P ? 22 : 24);
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(floor, ...stNamesM, blockNote, ...stacks.flat(), levelLine, tag2, ...stCounts2), { runTime: 0.55 }),
    new M.FadeIn(qBadge, { runTime: 0.7 }),
    ...fbox([['avg loss = 2 bits', C.amber], ['what does this mean?', C.violet]], C.violet),
    ...say('WHAT DOES 2 BITS TELL US?', C.violet)
  );

  // --- Beats 29-38: 4 equally likely word cards -> Perplexity = 4 ------------
  const CHOICES = ['opens', 'closes', 'starts', 'ends'];
  const CH_SP = P ? 1.82 : 1.92;
  const CH_W = P ? 1.62 : 1.7;
  const CH_Y = P ? -1.8 : 0.45;
  const chX = k => CX + (k - 1.5) * CH_SP;
  const tableLine = new M.Line({ start: [chX(0) - CH_W / 2 - 0.15, CH_Y - 0.52, 0], end: [chX(3) + CH_W / 2 + 0.15, CH_Y - 0.52, 0], color: C.muted, strokeWidth: 2.5 });
  const chCards = CHOICES.map((w, k) => makeCard(w, [chX(k), CH_Y, 0], C.cyan, CH_W, P ? 0.8 : 0.7, P ? 18 : 19));


  const CH_BAR_BASE = P ? -4.8 : -1.35;
  const CH_BAR_H = P ? 1.6 : 0.95;
  const chTracks = CHOICES.map((_, k) => {
    const r = new M.RoundedRectangle({ width: CH_W * 0.68 + 0.08, height: CH_BAR_H + 0.08, cornerRadius: 0.06, color: C.line, strokeWidth: 1.5 });
    r.moveTo([chX(k), CH_BAR_BASE + CH_BAR_H / 2, 0]);
    return r;
  });
  const chBars = CHOICES.map((_, k) => {
    const r = new M.Rectangle({ width: CH_W * 0.68, height: CH_BAR_H, color: C.cyan, strokeWidth: 2 });
    r.setFill(C.cyan, 0.78); r.moveTo([chX(k), CH_BAR_BASE + CH_BAR_H / 2, 0]);
    return r;
  });
  await until(S(29));
  await play(
    new M.FadeOut(qBadge, { runTime: 0.45 }),
    new M.Create(tableLine, { runTime: 0.6 }),
    new M.LaggedStart(chCards.map(c => new M.FadeIn(c, { runTime: 0.45 })), { lagRatio: 0.16, runTime: 1.3 }),
    new M.FadeIn(new M.VGroup(...chTracks), { runTime: 0.8 }),
    ...fbox(['4 cards on a table', ['4 possible next words', C.cyan]]),
    ...say('4 POSSIBLE NEXT WORDS')
  );

  await until(S(30));
  await play(
    new M.LaggedStart(chBars.map(b => new M.FadeIn(b, { runTime: 0.45 })), { lagRatio: 0.12, runTime: 1.0 }),
    ...say('ALL 4 EQUALLY LIKELY')
  );

  const chPcts = CHOICES.map((_, k) => {
    const t = T('25%', P ? 19 : 17, C.cyan, true, true);
    t.moveTo([chX(k), CH_BAR_BASE - 0.3, 0]);
    return t;
  });
  await until(S(31));
  await play(
    new M.LaggedStart(chPcts.map(t => new M.FadeIn(t, { runTime: 0.4 })), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['4 equal choices', ['1/4 = 25% each', C.cyan]]),
    ...say('EACH WORD = 1/4 = 25%')
  );

  // Beat 32: 100% -> 50% -> 25% (2 halvings)
  const H2_Y = P ? -6.0 : -2.45;
  const h2Sp = P ? 2.1 : 2.25;
  const h2Nodes = ['100%', '50%', '25%'].map((s, k) =>
    makeCard(s, [CX + (k - 1) * h2Sp, H2_Y, 0], k === 2 ? C.amber : C.cyan, P ? 1.3 : 1.4, 0.5, P ? 16 : 17));
  const h2Arrs = [0, 1].map(k => {
    const x1 = CX + (k - 1) * h2Sp + (P ? 0.7 : 0.74), x2 = CX + k * h2Sp - (P ? 0.7 : 0.74);
    const ar = new M.Arrow({ start: [x1, H2_Y, 0], end: [x2, H2_Y, 0], color: C.amber, strokeWidth: 2 });
    const lb = T('÷2', 15, C.amber, true); lb.moveTo([(x1 + x2) / 2, H2_Y + 0.3, 0]);
    return new M.VGroup(ar, lb);
  });

  await until(S(32));
  await play(
    new M.LaggedStart([
      new M.FadeIn(h2Nodes[0], { runTime: 0.35 }),
      new M.FadeIn(h2Arrs[0], { runTime: 0.35 }), new M.FadeIn(h2Nodes[1], { runTime: 0.35 }),
      new M.FadeIn(h2Arrs[1], { runTime: 0.35 }), new M.FadeIn(h2Nodes[2], { runTime: 0.35 })
    ], { lagRatio: 0.25, runTime: 1.6 }),
    ...fbox(['100% → 50%  (1)', ['50%  → 25%  (2)', C.amber]], C.amber),
    ...say('100% → 50% → 25% (2 HALVINGS)', C.amber)
  );

  const twoBitBadge = pill('LOSS = 2 BITS', C.amber, 18); twoBitBadge.moveTo([CX, P ? -6.0 : -2.45, 0]);
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(...h2Nodes, ...h2Arrs), { runTime: 0.35 }), new M.FadeIn(twoBitBadge, { runTime: 0.6 }),
    ...fbox(['4 equal words (25%)', ['loss = 2 bits', C.amber]], C.amber),
    ...say('4 EQUAL WORDS → 2 BITS', C.amber)
  );

  const eqBanner = makeCard('Our model: 2 bits  =  4 equal words: 2 bits', [CX, P ? -6.0 : -2.45, 0], C.green, P ? 7.2 : 7.4, P ? 0.75 : 0.62, P ? 17 : 17);
  await until(S(34));
  const fadeH2 = [new M.FadeOut(twoBitBadge, { runTime: 0.35 })];
  await play(
    ...fadeH2,
    new M.FadeIn(eqBanner, { runTime: 0.65 }),
    ...fbox(['our model:     2 bits', '4 equal words: 2 bits', ['same average loss!', C.green]], C.green),
    ...say('SAME LOSS AS 4 EQUAL CHOICES', C.green)
  );

  await until(S(35));
  await play(
    ...fbox([['perplexity', C.violet], 'effective number of', 'equally likely choices'], C.violet),
    ...say('CALLED: PERPLEXITY', C.violet)
  );

  const chNums = CHOICES.map((_, k) => {
    const t = T(String(k + 1), 20, C.amber, true, true);
    t.moveTo([chX(k), CH_Y + 0.62, 0]);
    return t;
  });
  await until(S(36));
  await play(
    new M.LaggedStart(chNums.map(n => new M.FadeIn(n, { runTime: 0.35 })), { lagRatio: 0.14, runTime: 0.9 }),
    ...fbox(['average loss = 2 bits', ['perplexity   = 4', C.amber]], C.amber),
    ...say('PERPLEXITY = 4', C.amber)
  );

  // Beat 37: does not mean literally only 4 words
  const vocabDots = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 14; c++) {
      const d = new M.Dot({ point: [CX + (c - 6.5) * (P ? 0.48 : 0.52), (P ? -5.75 : -2.3) - r * 0.32, 0], radius: 0.06, color: C.muted });
      d.setFill(C.muted, 0.55); vocabDots.push(d);
    }
  }
  const notOnly = T('every vocabulary word still gets a probability', P ? 17 : 17, C.pink);
  notOnly.moveTo([CX, P ? -6.55 : -3.15, 0]);
  await until(S(37));
  await play(
    new M.FadeOut(eqBanner, { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(...vocabDots, notOnly), { runTime: 0.7 }),
    ...say('NOT ONLY 4 POSSIBLE WORDS', C.pink)
  );

  await until(S(38));
  await play(
    new M.LaggedStart(chCards.map(c => new M.Indicate(c, { color: C.amber, runTime: 0.5 })), { lagRatio: 0.14, runTime: 1.3 }),
    ...fbox([['perplexity = 4', C.amber], 'uncertainty equivalent', 'to 4 equal choices'], C.amber),
    ...say('EQUIVALENT TO 4 EQUAL CHOICES', C.amber)
  );

  // --- Beats 39-44: Untrained model (1,000) vs Perfect model (1) -------------
  const uNet = net({ layers: [2, 3, 2], center: [CX, P ? -2.5 : 0.0, 0], width: P ? 4.2 : 4.2, height: P ? 2.0 : 1.45, r: P ? 0.26 : 0.21, color: C.muted });
  const uLab = T('Untrained model', P ? 19 : 20, C.pink, false, true); uLab.moveTo([CX, P ? -1.05 : 1.22, 0]);

  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(tableLine, ...chCards, ...chTracks, ...chBars, ...chPcts, ...chNums, ...vocabDots, notOnly), { runTime: 0.5 }),
    new M.FadeIn(uNet.group, { runTime: 0.8 }),
    new M.FadeIn(uLab, { runTime: 0.6 }),
    ...fbox([['Untrained model', C.pink], 'has not learned yet'], C.pink),
    ...say('UNTRAINED MODEL', C.pink)
  );

  // Beat 40: vocabulary of 1,000 tokens
  const vCells = [];
  const vCols = 16, vRows = 4;
  const vTop = P ? -4.3 : -1.3;
  for (let r = 0; r < vRows; r++) {
    for (let c = 0; c < vCols; c++) {
      const cell = new M.Rectangle({ width: P ? 0.3 : 0.33, height: P ? 0.22 : 0.16, color: C.cyan, strokeWidth: 1 });
      cell.setFill(C.cyan, 0.35);
      cell.moveTo([CX + (c - (vCols - 1) / 2) * (P ? 0.38 : 0.42), vTop - r * (P ? 0.32 : 0.26), 0]);
      vCells.push(cell);
    }
  }
  const vLabel = pill('VOCABULARY = 1,000 TOKENS', C.cyan, P ? 17 : 16); vLabel.moveTo([CX, vTop - (P ? 1.45 : 1.28), 0]);
  await until(S(40));
  await play(
    new M.LaggedStart(vCells.map(c => new M.FadeIn(c, { runTime: 0.25 })), { lagRatio: 0.015, runTime: 1.2 }),
    new M.FadeIn(vLabel, { runTime: 0.6 }),
    ...fbox(['vocabulary = 1,000 tokens']),
    ...say('VOCABULARY = 1,000 TOKENS')
  );

  // Beat 41: every token gets 0.1%
  const flatBar = new M.RoundedRectangle({ width: P ? 6.0 : 6.6, height: 0.28, cornerRadius: 0.08, color: C.pink, strokeWidth: 2 });
  flatBar.setFill(C.pink, 0.7); flatBar.moveTo([CX, P ? -4.9 : -3.45, 0]);
  const flatTxt = T('0.1% each (1 ÷ 1,000)', P ? 17 : 18, C.pink, true, true); flatTxt.moveTo([CX, P ? -4.4 : -3.05, 0]);
  await until(S(41));
  await play(
    ...(P ? [new M.FadeOut(new M.VGroup(...vCells, vLabel), { runTime: 0.4 })] : []),
    new M.FadeIn(flatBar, { runTime: 0.6 }),
    new M.FadeIn(flatTxt, { runTime: 0.6 }),
    ...fbox(['vocabulary  = 1,000', ['probability = 0.1% each', C.pink]], C.pink),
    ...say('EVERY TOKEN = 0.1%', C.pink)
  );

  // Beat 42: loss nearly 10 bits, perplexity 1,000
  const uResult = makeCard('Loss ≈ 10 bits  ·  Perplexity = 1,000', [CX, P ? -5.9 : -3.3, 0], C.pink, P ? 7.0 : 6.8, P ? 0.75 : 0.62, P ? 17 : 17);
  await until(S(42));
  await play(
    ...(P ? [new M.FadeIn(uResult, { runTime: 0.7 })] : [new M.FadeOut(new M.VGroup(flatBar, flatTxt), { runTime: 0.35 }), new M.FadeIn(uResult, { runTime: 0.7 })]),
    ...fbox(['probability = 0.1%', 'avg loss    ≈ 10 bits', ['perplexity  = 1,000', C.pink]], C.pink),
    ...say('LOSS ≈ 10 BITS  ·  PPL = 1,000', C.pink)
  );

  // Beat 43: Perfect model gives 100% to correct token (side-by-side / stacked summary)
  const pLeftPos = P ? [0, -0.2, 0] : [CX - 2.05, -0.5, 0];
  const pRightPos = P ? [0, -3.6, 0] : [CX + 2.05, -0.5, 0];
  const pW = P ? 6.8 : 3.7, pH = P ? 3.0 : 3.2;

  const uBox = new M.RoundedRectangle({ width: pW, height: pH, cornerRadius: 0.2, color: C.pink, strokeWidth: 2 });
  uBox.setFill(C.card, 0.92); uBox.moveTo(pLeftPos);
  const uHead = T('Untrained model', P ? 19 : 18, C.pink, false, true); uHead.moveTo([pLeftPos[0], pLeftPos[1] + pH / 2 - 0.35, 0]);
  const uFlat = new M.Rectangle({ width: pW - 0.9, height: 0.2, color: C.pink, strokeWidth: 1.5 });
  uFlat.setFill(C.pink, 0.75); uFlat.moveTo([pLeftPos[0], pLeftPos[1] - 0.05, 0]);
  const uStat = T('0.1% · ≈10 bits · PPL 1,000', P ? 18 : 15, C.pink, true); uStat.moveTo([pLeftPos[0], pLeftPos[1] - pH / 2 + 0.42, 0]);

  const gBox = new M.RoundedRectangle({ width: pW, height: pH, cornerRadius: 0.2, color: C.green, strokeWidth: 2.2 });
  gBox.setFill(C.card, 0.92); gBox.moveTo(pRightPos);
  const gHead = T('Perfect model', P ? 19 : 18, C.green, false, true); gHead.moveTo([pRightPos[0], pRightPos[1] + pH / 2 - 0.35, 0]);
  const gTall = new M.Rectangle({ width: 0.55, height: P ? 1.3 : 1.35, color: C.green, strokeWidth: 2 });
  gTall.setFill(C.green, 0.85); gTall.moveTo([pRightPos[0] - 0.9, pRightPos[1] - 0.05, 0]);
  const g100 = T('100%', P ? 19 : 17, C.green, true, true); g100.moveTo([pRightPos[0] + 0.55, pRightPos[1] + 0.1, 0]);
  const gOther = T('others: 0%', P ? 17 : 15, C.muted, true); gOther.moveTo([pRightPos[0] + 0.55, pRightPos[1] - 0.32, 0]);

  const fadeU = P ? [uNet.group, uLab, flatBar, flatTxt, uResult] : [uNet.group, uLab, ...vCells, vLabel, uResult];
  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(...fadeU), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(uBox, uHead, uFlat, uStat), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(gBox, gHead, gTall, g100, gOther), { runTime: 0.8 }),
    ...fbox([['Perfect model', C.green], 'correct token = 100%'], C.green),
    ...say('PERFECT MODEL: 100% ON TARGET', C.green)
  );

  const gStat = T('0 bits · Perplexity = 1', P ? 17 : 15, C.green, true, true);
  gStat.moveTo([pRightPos[0], pRightPos[1] - pH / 2 + 0.4, 0]);
  await until(S(44));
  await play(
    new M.FadeIn(gStat, { runTime: 0.6 }),
    new M.Indicate(gTall, { color: C.green, runTime: 0.7 }),
    ...fbox(['probability = 100%', 'avg loss    = 0 bits', ['perplexity  = 1', C.green]], C.green),
    ...say('LOSS = 0 BITS  ·  PPL = 1', C.green)
  );

  // --- Beats 45-47: The Formula perplexity = 2 ^ (average loss) --------------
  const tblRows = [
    ['0 bits', '→', 'perplexity = 1', C.green],
    ['2 bits', '→', 'perplexity = 4', C.amber],
    ['≈10 bits', '→', 'perplexity = 1,000', C.pink]
  ];
  const tblTop = P ? 0.3 : 0.75;
  const tblSp = P ? 0.95 : 0.65;
  const tblMobs = tblRows.map(([a, ar, b, col], k) =>
    makeCard(`${a}   ${ar}   ${b}`, [CX, tblTop - k * tblSp, 0], col, P ? 7.0 : 6.6, P ? 0.72 : 0.56, P ? 18 : 18));

  await until(S(45));
  await play(
    new M.FadeOut(new M.VGroup(uBox, uHead, uFlat, uStat, gBox, gHead, gTall, g100, gOther, gStat), { runTime: 0.5 }),
    new M.LaggedStart(tblMobs.map(r => new M.FadeIn(r, { runTime: 0.45 })), { lagRatio: 0.16, runTime: 1.1 }),
    ...fbox(['loss (bits) → perplexity', ['0  → 1', C.green], ['2  → 4', C.amber]]),
    ...say('ONE SHORT FORMULA')
  );

  const formCard = makeCard('perplexity = 2 ^ (avg loss)', [CX, P ? -2.9 : -1.55, 0], C.cyan, P ? 7.0 : 7.0, P ? 1.0 : 0.88, P ? 22 : 22);
  await until(S(46));
  await play(
    new M.FadeIn(formCard, { runTime: 0.8 }),
    ...fbox([['perplexity = 2 ^ (avg loss)', C.cyan], 'loss measured in bits']),
    ...say('PERPLEXITY = 2 ^ (AVG LOSS)')
  );

  const calcCard = makeCard('2 ^ 2   =   2 × 2   =   4', [CX, P ? -4.4 : -2.52, 0], C.amber, P ? 6.6 : 6.4, P ? 0.95 : 0.76, P ? 22 : 22);
  await until(S(47));
  await play(
    new M.Indicate(tblMobs[1], { color: C.amber, runTime: 0.7 }),
    new M.FadeIn(calcCard, { runTime: 0.8 }),
    ...fbox(['perplexity = 2 ^ 2', '           = 2 × 2', ['           = 4', C.amber]], C.amber),
    ...say('2 × 2 = 4', C.amber)
  );

  // --- Beats 48-52: Compare models fairly & traps ----------------------------
  const cY1 = P ? -0.6 : 0.45, cY2 = P ? -2.5 : -0.75;
  const barX0 = CX - (P ? 2.6 : 3.2);
  const barMax = P ? 5.2 : 6.2;

  const labMA = T('Model A', P ? 18 : 19, C.cyan, false, true); labMA.moveTo([barX0 + 0.7, cY1 + 0.44, 0]);
  const barMA = new M.RoundedRectangle({ width: barMax * 0.25, height: 0.5, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2 });
  barMA.setFill(C.cyan, 0.82); barMA.moveTo([barX0 + barMax * 0.125, cY1, 0]);
  const valMA = T('PPL = 4 (2 bits)', P ? 17 : 18, C.cyan, true, true); valMA.moveTo([barX0 + barMax * 0.25 + 1.55, cY1, 0]);

  const labMB = T('Model B', P ? 18 : 19, C.pink, false, true); labMB.moveTo([barX0 + 0.7, cY2 + 0.44, 0]);
  const barMB = new M.RoundedRectangle({ width: barMax * 0.82, height: 0.5, cornerRadius: 0.1, color: C.pink, strokeWidth: 2 });
  barMB.setFill(C.pink, 0.75); barMB.moveTo([barX0 + barMax * 0.41, cY2, 0]);
  const valMB = T('PPL = 16 (4 bits)', P ? 16 : 17, C.pink, true, true); valMB.moveTo([CX, cY2 - 0.52, 0]);

  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(...tblMobs, formCard, calcCard), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(labMA, barMA, valMA, labMB, barMB, valMB), { runTime: 0.85 }),
    ...fbox([['Model A: PPL = 4', C.cyan], ['Model B: PPL = 16', C.pink]]),
    ...say('COMPARE LANGUAGE MODELS')
  );

  const winPill = pill('LOWER = HIGHER PROBABILITIES', C.green, P ? 17 : 16); winPill.moveTo([CX, cY1 + (P ? 0.92 : 0.78), 0]);
  await until(S(49));
  await play(
    new M.FadeIn(winPill, { runTime: 0.65 }),
    new M.Indicate(barMA, { color: C.green, runTime: 0.8 }),
    ...fbox(['Model A: PPL 4  (25%)', 'Model B: PPL 16 (6.25%)', ['lower perplexity wins', C.green]], C.green),
    ...say('LOWER PERPLEXITY = BETTER', C.green)
  );

  const fairBanner = makeCard('✓ Same test text   ·   ✓ Same tokens', [CX, P ? -4.6 : -2.25, 0], C.amber, P ? 7.2 : 7.2, P ? 0.85 : 0.7, P ? 18 : 18);
  await until(S(50));
  await play(
    new M.FadeIn(fairBanner, { runTime: 0.7 }),
    ...fbox([['Fair comparison:', C.amber], '✓ same test text', '✓ same tokens'], C.amber),
    ...say('RULE 1: SAME TEXT & TOKENS', C.amber)
  );

  // Beat 51: Separate training text from test text
  const sepY = P ? -1.7 : -0.35;
  const boxW = P ? 3.2 : 3.3, boxH = P ? 3.0 : 2.2;
  const trPos = [CX - (P ? 1.85 : 2.05), sepY, 0];
  const tePos = [CX + (P ? 1.85 : 2.05), sepY, 0];
  const trBox = makeCard('Training text', trPos, C.muted, boxW, boxH, P ? 18 : 20, false);
  const teBox = makeCard('Test text', tePos, C.green, boxW, boxH, P ? 18 : 20, false);
  const wall = new M.DashedLine({ start: [CX, sepY + boxH / 2 + 0.35, 0], end: [CX, sepY - boxH / 2 - 0.35, 0], color: C.amber });
  const sepTag = pill('KEEP SEPARATE', C.green, P ? 18 : 16); sepTag.moveTo([CX, sepY - boxH / 2 - 0.7, 0]);

  await until(S(51));
  await play(
    new M.FadeOut(new M.VGroup(labMA, barMA, valMA, labMB, barMB, valMB, winPill, fairBanner), { runTime: 0.5 }),
    new M.FadeIn(trBox, { runTime: 0.6 }),
    new M.FadeIn(teBox, { runTime: 0.6 }),
    new M.Create(wall, { runTime: 0.6 }),
    new M.FadeIn(sepTag, { runTime: 0.6 }),
    ...fbox([['Fair comparison:', C.green], '✓ training ≠ test text'], C.green),
    ...say('RULE 2: HELD-OUT TEST TEXT', C.green)
  );

  // Beat 52: Trap — memorizing test text gives fake low perplexity
  const leakArr = new M.Arrow({ start: [trPos[0] + 0.4, sepY + 0.65, 0], end: [tePos[0] - 0.4, sepY + 0.65, 0], color: C.pink, strokeWidth: 3.5 });
  const trapTag = makeCard('Memorized! Fake low perplexity', [CX, sepY - boxH / 2 - 0.7, 0], C.pink, P ? 6.2 : 6.6, 0.64, P ? 17 : 18, false);
  await until(S(52));
  await play(
    new M.FadeOut(sepTag, { runTime: 0.35 }),
    new M.Create(leakArr, { runTime: 0.7 }),
    new M.FadeIn(trapTag, { runTime: 0.7 }),
    ...fbox([['Trap:', C.pink], 'memorized text gives', 'a fake low perplexity'], C.pink),
    ...say('TRAP: MEMORIZED = FAKE LOW PPL', C.pink)
  );

  // --- Beat 53: One-sentence recap -------------------------------------------
  const recCards = CHOICES.map((w, k) => makeCard(w, [chX(k), P ? -1.0 : 0.05, 0], C.cyan, CH_W, P ? 0.85 : 0.72, P ? 18 : 19));
  const recNums = CHOICES.map((_, k) => {
    const t = T(String(k + 1), 20, C.amber, true, true);
    t.moveTo([chX(k), P ? -0.2 : 0.72, 0]);
    return t;
  });
  const recLine = makeCard('avg loss = 2 bits  →  perplexity = 4', [CX, P ? -2.9 : -1.45, 0], C.amber, P ? 7.0 : 6.8, P ? 0.95 : 0.78, P ? 20 : 20);
  const recSub = T(P ? 'same uncertainty as 4 equal choices' : 'uncertainty as an equivalent number of equal choices', P ? 19 : 17, C.green);
  recSub.moveTo([CX, P ? -4.0 : -2.25, 0]);

  await until(S(53));
  await play(
    new M.FadeOut(new M.VGroup(trBox, teBox, wall, leakArr, trapTag), { runTime: 0.5 }),
    new M.LaggedStart(recCards.map(c => new M.FadeIn(c, { runTime: 0.45 })), { lagRatio: 0.14, runTime: 1.1 }),
    new M.FadeIn(new M.VGroup(...recNums, recLine, recSub), { runTime: 0.8 }),
    ...fbox([['perplexity = 2 ^ (avg loss)', C.cyan], ['2 bits → 4 equal choices', C.amber], ['lower = more certain', C.green]], C.amber),
    ...say('PERPLEXITY = EQUIVALENT CHOICES', C.amber)
  );
}

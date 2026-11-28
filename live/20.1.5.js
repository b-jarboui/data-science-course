// 20.1.5 Masked language modeling: learning from words on both sides.
// Beat i = sentence i (0-based, 54 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;

  const PILL = P ? [0, 2.6, 0] : [0, 1.98, 0];
  const BOXP = P ? [0, -5.75, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 18);

  // Formula box (one at a time, matching reference 1.2.4)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20, lh = P ? 0.48 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.2;
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

  function makeCard(word, pos, w, h, border = C.cyan, textCol = C.ink, fontSize = P ? 20 : 21) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color: border, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const mono = word === '<end>' || word === '?' || word === 'MASK';
    const t = T(word, fontSize, textCol, mono, true);
    if (t.getWidth() > w - 0.18) t.scale((w - 0.18) / t.getWidth());
    t.moveTo(pos);
    return new M.VGroup(r, t);
  }

  function makeCover(pos, w, h, label = '?', border = C.amber) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color: border, strokeWidth: 2.5 });
    r.setFill(border === C.amber ? '#2c2210' : '#2a1527', 0.98);
    r.moveTo([pos[0], pos[1], 0.02]);
    const t = T(label, P ? 20 : 21, border, true, true);
    if (t.getWidth() > w - 0.16) t.scale((w - 0.16) / t.getWidth());
    t.moveTo([pos[0], pos[1], 0.03]);
    return new M.VGroup(r, t);
  }

  function styleNetEdges(N, weights) {
    for (let l = 0; l < N.edges.length; l++) {
      for (let i = 0; i < N.edges[l].length; i++) {
        for (let j = 0; j < N.edges[l][i].length; j++) {
          const w = weights[l]?.[i]?.[j] ?? 0.5;
          const a = Math.min(1, Math.abs(w));
          const ln = N.edges[l][i][j];
          ln.setColor(w < 0 ? C.pink : C.cyan);
          ln.setStrokeWidth(1.5 + 3.4 * a);
          ln.setStrokeOpacity(0.35 + 0.55 * a);
        }
      }
    }
  }

  function trackNet(N) {
    const vals = {};
    return {
      val(l, i, s, col = C.ink) {
        const a = N.value(l, i, s, col);
        vals[l + ':' + i] = a[0].mobject;
        return a;
      },
      all() {
        return [...N.edges.flat(2), ...N.nodes.flat(), ...N.labels, ...Object.values(vals)];
      }
    };
  }

  // --- Phase A: Campus newsletter & 3 glowing token cards (beats 0-11) ---
  const paperW = P ? 7.0 : 7.2, paperH = P ? 4.2 : 3.1, paperY = P ? -1.4 : -0.35;
  const paperBg = new M.RoundedRectangle({ width: paperW, height: paperH, cornerRadius: 0.2, color: C.cyan, strokeWidth: 2 });
  paperBg.setFill(C.card, 0.96); paperBg.moveTo([0, paperY, 0]);
  const paperHead = T('CAMPUS NEWSLETTER', P ? 18 : 20, C.cyan, true, true);
  paperHead.moveTo([0, paperY + paperH / 2 - 0.45, 0]);
  const paperRule = new M.Line({ start: [-paperW / 2 + 0.4, paperY + paperH / 2 - 0.78, 0], end: [paperW / 2 - 0.4, paperY + paperH / 2 - 0.78, 0], color: C.line, strokeWidth: 2 });
  const dec1 = new M.Line({ start: [-paperW / 2 + 0.6, paperY - 0.85, 0], end: [paperW / 2 - 0.6, paperY - 0.85, 0], color: C.line, strokeWidth: 3 });
  const dec2 = new M.Line({ start: [-paperW / 2 + 0.6, paperY - 1.18, 0], end: [paperW / 2 - 1.8, paperY - 1.18, 0], color: C.line, strokeWidth: 3 });

  const pwLeft = T('Pool', P ? 28 : 32, C.ink, false, true); pwLeft.moveTo([P ? -1.75 : -2.0, paperY + 0.1, 0]);
  const pwRight = T('today.', P ? 28 : 32, C.ink, false, true); pwRight.moveTo([P ? 1.85 : 2.1, paperY + 0.1, 0]);
  const patch = makeCover([0, paperY + 0.1, 0], P ? 1.8 : 2.05, 0.72, '?', C.amber);

  // Beat 0
  await until(S(0));
  await play(
    new M.FadeIn(new M.VGroup(paperBg, paperHead, paperRule, dec1, dec2, pwLeft, pwRight)),
    new M.FadeIn(patch),
    ...say('CAMPUS NEWSLETTER')
  );

  // Beat 1
  await until(S(1));
  await play(new M.Indicate(patch, { color: C.amber }), ...say('IS THE POOL OPEN TODAY?', C.amber));

  // Beat 2
  const clueL = new M.Arrow({ start: [P ? -1.75 : -2.0, paperY - 0.45, 0], end: [-0.45, paperY - 0.35, 0], color: C.cyan, strokeWidth: 2.5 });
  const clueR = new M.Arrow({ start: [P ? 1.85 : 2.1, paperY - 0.45, 0], end: [0.45, paperY - 0.35, 0], color: C.cyan, strokeWidth: 2.5 });
  await until(S(2));
  await play(new M.Create(clueL), new M.Create(clueR), ...say('CLUES ON BOTH SIDES?', C.cyan));

  // Beat 3
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(paperBg, paperHead, paperRule, dec1, dec2, pwLeft, pwRight, patch, clueL, clueR), { runTime: 0.7 }),
    ...say('THE POOL NEWSLETTER', C.cyan)
  );

  // Beat 4
  const fullSentence = T('Pool   closed   today', P ? 32 : 38, C.ink, false, true);
  fullSentence.moveTo([0, P ? -2.1 : -0.15, 0]);
  await until(S(4));
  await play(new M.FadeIn(fullSentence), ...say('COMPLETE NEWSLETTER', C.cyan));

  // Beat 5: 3 separate glowing cards
  const cwA = P ? 2.1 : 2.3, chA = P ? 1.1 : 0.88, spA = P ? 2.4 : 2.75, cyA = P ? -2.1 : -0.15;
  const words3 = ['Pool', 'closed', 'today'];
  const posA = k => [(k - 1) * spA, cyA, 0];
  const cardsA = words3.map((w, k) => makeCard(w, posA(k), cwA, chA, C.cyan, C.ink, P ? 22 : 25));
  await until(S(5));
  await play(
    new M.FadeOut(fullSentence),
    new M.LaggedStart(cardsA.map(c => new M.FadeIn(c)), { lagRatio: 0.16, runTime: 1.1 }),
    ...say('3 GLOWING CARDS', C.cyan)
  );

  // Beat 6: each small piece of text is a token
  const tokTagsA = words3.map((_, k) => {
    const t = T('token', P ? 16 : 17, C.muted, true);
    t.moveTo([posA(k)[0], cyA - chA / 2 - 0.3, 0]);
    return t;
  });
  await until(S(6));
  await play(
    new M.LaggedStart(tokTagsA.map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 0.9 }),
    ...say('EACH PIECE = 1 TOKEN', C.cyan)
  );

  // Beat 7: each word is one token
  await until(S(7));
  await play(
    new M.LaggedStart(cardsA.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.18, runTime: 1.4 }),
    ...say('3 WORDS = 3 TOKENS', C.cyan)
  );

  // Beat 8: cover middle card (closed)
  const covMidA = makeCover(posA(1), cwA, chA, '?', C.amber);
  await until(S(8));
  await play(new M.FadeIn(covMidA), ...say('HIDE THE MIDDLE CARD', C.amber));

  // Beat 9: cover last card (today) as well, only Pool visible
  const covRightA = makeCover(posA(2), cwA, chA, '—', C.pink);
  await until(S(9));
  await play(new M.FadeIn(covRightA), new M.Indicate(cardsA[0], { color: C.cyan }), ...say('ONLY "Pool" IS VISIBLE', C.pink));

  // Beat 10: What word might come after Pool?
  await until(S(10));
  await play(new M.Indicate(covMidA, { color: C.amber, runTime: 0.7 }), ...say('WHAT COMES AFTER "Pool"?', C.amber));

  // Beat 11: Perhaps opens, is or closed
  const candWords = ['opens', 'is', 'closed'];
  const candChips = candWords.map((w, k) => makeCard(w, [(k - 1) * (P ? 2.4 : 2.3), cyA - (P ? 2.5 : 1.75), 0], P ? 2.0 : 1.85, P ? 0.8 : 0.62, C.violet, C.violet, P ? 21 : 20));
  await until(S(11));
  await play(
    new M.LaggedStart(candChips.map(c => new M.FadeIn(c)), { lagRatio: 0.16, runTime: 1.0 }),
    ...say('opens, is, or closed?', C.violet)
  );

  // --- Phase B & C: Neural network + probability bars (beats 12-35) ---
  const cwB = P ? 1.8 : 1.5, chB = P ? 0.64 : 0.58, spB = P ? 2.12 : 1.78;
  const cxB = P ? 0 : -2.2, cyB = P ? 1.3 : 1.05;
  const posB = k => [cxB + (k - 1) * spB, cyB, 0];
  const cardsB = words3.map((w, k) => makeCard(w, posB(k), cwB, chB, C.cyan, C.ink, P ? 19 : 19));
  const covMidB = makeCover(posB(1), cwB, chB, '?', C.amber);
  const covRightB = makeCover(posB(2), cwB, chB, '—', C.pink);

  const N = net({
    layers: [2, 3, 2],
    center: P ? [0.45, -1.4, 0] : [-2.2, -1.15, 0],
    width: P ? 4.2 : 4.5,
    height: P ? 2.8 : 2.25,
    r: P ? 0.32 : 0.28,
    names: ['Pool', 'today'],
    outName: ''
  });
  styleNetEdges(N, [
    [[0.75, -0.45, 0.60], [0.55, 0.85, -0.50]],
    [[0.80, -0.35], [-0.40, 0.70], [0.65, 0.55]]
  ]);
  const NH = trackNet(N);

  // Beat 12: Draw our language model as circles in columns, connected by lines
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...cardsA, ...tokTagsA, covMidA, covRightA, ...candChips), { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...cardsB, covMidB, covRightB), { runTime: 0.7 }),
    ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS', C.cyan)
  );
  await play(
    new M.LaggedStart(N.nodes.flat().map(n => new M.FadeIn(n)), { lagRatio: 0.08, runTime: 0.9 }),
    new M.LaggedStart(N.edges.flat(2).map(e => new M.FadeIn(e)), { lagRatio: 0.04, runTime: 1.0 }),
    new M.FadeIn(N.labels[0], { runTime: 0.8 }),
    new M.FadeIn(N.labels[1], { runTime: 0.8 })
  );

  // Beat 13: Send the word Pool into the network as numbers
  await until(S(13));
  await play(
    new M.Indicate(cardsB[0], { color: C.cyan }),
    ...say('SEND "Pool" AS NUMBERS', C.cyan)
  );

  // Beat 14: Watch the numerical signals travel through the connected circles
  await until(S(14));
  await play(
    ...N.flow(0, C.cyan),
    ...say('NUMBERS FLOW THROUGH THE LAYERS', C.amber)
  );
  await play(
    ...N.flow(1, C.amber),
  );

  // Probability bar panel geometry
  const BAR_X = P ? -1.65 : 2.85;
  const BAR_MAX = P ? 4.3 : 2.9;
  const BAR_H = P ? 0.38 : 0.36;
  const BAR_Y0 = P ? -4.3 : 0.15;
  const BAR_STEP = P ? 0.78 : 0.70;
  const barY = i => BAR_Y0 - i * BAR_STEP;
  const barTitlePos = P ? [0, -3.65, 0] : [4.25, 0.80, 0];

  const makeBar = (y, pct, col) => {
    const w = Math.max(0.08, pct / 100 * BAR_MAX);
    const r = new M.Rectangle({ width: w, height: BAR_H, color: col, strokeWidth: 1.5 });
    r.setFill(col, 0.82);
    r.moveTo([BAR_X + w / 2, y, 0]);
    return r;
  };
  const makePct = (y, pct, col) => {
    const w = Math.max(0.08, pct / 100 * BAR_MAX);
    const t = T(`${pct}%`, P ? 18 : 19, col, true, true);
    t.moveTo([BAR_X + w + 0.16 + t.getWidth() / 2, y, 0]);
    return t;
  };

  let barHead = T('PROBABILITY (LEFT ONLY)', P ? 17 : 16, C.muted, true, true);
  barHead.moveTo(barTitlePos);
  const barAxis = new M.Line({ start: [BAR_X, barY(0) + 0.3, 0], end: [BAR_X, barY(3) - 0.3, 0], color: C.line, strokeWidth: 2 });
  const barNames = ['opens', 'is', 'closed', 'other'].map((w, i) => {
    const t = T(w, P ? 18 : 19, w === 'closed' ? C.pink : C.ink, true);
    t.moveTo([BAR_X - 0.22 - t.getWidth() / 2, barY(i), 0]);
    return t;
  });

  // Beat 15: The network produces a list of possible words and their chances
  await until(S(15));
  await play(
    new M.FadeIn(barHead),
    new M.Create(barAxis),
    new M.LaggedStart(barNames.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.9 }),
    ...say('POSSIBLE WORDS & PROBABILITIES', C.cyan)
  );

  // Beat 16: opens 40%
  const barOpens = makeBar(barY(0), 40, C.amber);
  let pctOpens = makePct(barY(0), 40, C.amber);
  await until(S(16));
  await play(new M.FadeIn(barOpens), new M.FadeIn(pctOpens), ...say('opens: 40%', C.amber));

  // Beat 17: is 30%
  const barIs = makeBar(barY(1), 30, C.cyan);
  let pctIs = makePct(barY(1), 30, C.cyan);
  await until(S(17));
  await play(new M.FadeIn(barIs), new M.FadeIn(pctIs), ...say('is: 30%', C.cyan));

  // Beat 18: closed 20%
  const barClosed = makeBar(barY(2), 20, C.pink);
  let pctClosed = makePct(barY(2), 20, C.pink);
  await until(S(18));
  await play(new M.FadeIn(barClosed), new M.FadeIn(pctClosed), ...say('closed: 20%', C.pink));

  // Beat 19: other 10%
  const barOther = makeBar(barY(3), 10, C.muted);
  let pctOther = makePct(barY(3), 10, C.muted);
  await until(S(19));
  await play(new M.FadeIn(barOther), new M.FadeIn(pctOther), ...say('other words: 10%', C.muted));

  // Beat 20: With only the word Pool, the model prefers opens
  await until(S(20));
  await play(
    new M.Indicate(barOpens, { color: C.amber }),
    new M.Indicate(pctOpens, { color: C.amber }),
    ...say('LEFT ONLY → PREFERS "opens"', C.amber)
  );

  // Beat 21: Now uncover the last card, which contains the word today
  await until(S(21));
  await play(
    new M.FadeOut(covRightB),
    new M.Indicate(cardsB[2], { color: C.green }),
    ...say('UNCOVER "today"', C.green)
  );

  // Beat 22: Keep the middle card hidden
  await until(S(22));
  await play(new M.Indicate(covMidB, { color: C.amber, runTime: 0.7 }), ...say('MIDDLE CARD STAYS HIDDEN', C.amber));

  // Beat 23: You can now read Pool, a hidden word, and today
  await until(S(23));
  await play(
    new M.LaggedStart([
      new M.Indicate(cardsB[0], { color: C.cyan }),
      new M.Indicate(covMidB, { color: C.amber }),
      new M.Indicate(cardsB[2], { color: C.cyan })
    ], { lagRatio: 0.25, runTime: 1.5 }),
    ...say('Pool  [ ? ]  today', C.cyan)
  );

  // Beat 24: The word today gives you another clue about the missing word
  const rightClueArr = new M.Arrow({
    start: [posB(2)[0], cyB - chB / 2 - 0.10, 0],
    end: [posB(1)[0] + 0.15, cyB - chB / 2 - 0.10, 0],
    color: C.green, strokeWidth: 2.8
  });
  await until(S(24));
  await play(new M.Create(rightClueArr), new M.Indicate(cardsB[2], { color: C.green }), ...say('"today" = RIGHT-SIDE CLUE', C.green));

  // Beat 25: Send both visible words into the network
  await until(S(25));
  await play(
    new M.FadeOut(rightClueArr),
    new M.Indicate(N.nodes[0][0], { color: C.cyan }),
    new M.Indicate(N.nodes[0][1], { color: C.green }),
    ...say('SEND BOTH WORDS INTO NETWORK', C.green)
  );

  // Beat 26: Watch the signals from both words help the network predict
  await until(S(26));
  await play(
    ...N.flow(0, C.green),
    ...say('BOTH SIDES GUIDE PREDICTION', C.green)
  );
  await play(
    ...N.flow(1, C.cyan),
  );

  // Beat 27: The model now gives closed a chance of eighty percent
  const barHead2 = T('PROBABILITY (BOTH SIDES)', P ? 17 : 16, C.green, true, true);
  barHead2.moveTo(barTitlePos);
  const pctClosed2 = makePct(barY(2), 80, C.green);
  const closedLbl2 = T('closed', P ? 18 : 19, C.green, true, true);
  closedLbl2.moveTo([BAR_X - 0.22 - closedLbl2.getWidth() / 2, barY(2), 0]);
  await until(S(27));
  await play(
    new M.FadeOut(barHead), new M.FadeIn(barHead2),
    new M.Transform(barClosed, makeBar(barY(2), 80, C.green)),
    new M.FadeOut(pctClosed), new M.FadeIn(pctClosed2),
    new M.FadeOut(barNames[2]), new M.FadeIn(closedLbl2),
    new M.FadeOut(barIs), new M.FadeOut(pctIs), new M.FadeOut(barNames[1]),
    ...say('closed: 80%', C.green)
  );
  barHead = barHead2; pctClosed = pctClosed2; barNames[2] = closedLbl2;

  // Beat 28: The word opens receives fifteen percent
  const pctOpens2 = makePct(barY(0), 15, C.cyan);
  await until(S(28));
  await play(
    new M.Transform(barOpens, makeBar(barY(0), 15, C.cyan)),
    new M.FadeOut(pctOpens), new M.FadeIn(pctOpens2),
    ...say('opens: 15%', C.cyan)
  );
  pctOpens = pctOpens2;

  // Beat 29: All other possible words together receive five percent
  const pctOther2 = makePct(barY(3), 5, C.muted);
  await until(S(29));
  await play(
    new M.Transform(barOther, makeBar(barY(3), 5, C.muted)),
    new M.FadeOut(pctOther), new M.FadeIn(pctOther2),
    ...say('other words: 5%', C.muted)
  );
  pctOther = pctOther2;

  // Beat 30: The chance of closed rises from twenty percent to eighty percent
  await until(S(30));
  await play(
    new M.Indicate(barClosed, { color: C.green }),
    new M.Flash(pctClosed, { color: C.green }),
    ...say('closed: 20% → 80%', C.green)
  );

  // Beat 31: Reveal the middle card and compare the prediction with the original word
  await until(S(31));
  await play(
    new M.FadeOut(covMidB),
    new M.Indicate(cardsB[1], { color: C.green }),
    ...say('REVEAL & COMPARE', C.amber)
  );

  // Beat 32: The original word is closed, which the model now considers most likely
  await until(S(32));
  await play(
    new M.Indicate(cardsB[1], { color: C.green }),
    new M.Indicate(barClosed, { color: C.green }),
    ...say('MATCH: "closed" (80%)', C.green)
  );

  // Beat 33: Covering a token so the model cannot see its original text is called masking
  const maskCover = makeCover(posB(1), cwB, chB, 'MASK', C.amber);
  await until(S(33));
  await play(new M.FadeIn(maskCover), ...say('MASKING = HIDING A TOKEN', C.amber));

  // Beat 34: Learning to predict hidden tokens using visible tokens on both sides is called masked language modeling
  const bothL = new M.Arrow({ start: [posB(0)[0], cyB - chB / 2 - 0.10, 0], end: [posB(1)[0] - 0.15, cyB - chB / 2 - 0.10, 0], color: C.cyan, strokeWidth: 2.5 });
  const bothR = new M.Arrow({ start: [posB(2)[0], cyB - chB / 2 - 0.10, 0], end: [posB(1)[0] + 0.15, cyB - chB / 2 - 0.10, 0], color: C.cyan, strokeWidth: 2.5 });
  await until(S(34));
  await play(new M.Create(bothL), new M.Create(bothR), ...N.flow(0, C.cyan), ...say('MASKED LANGUAGE MODELING', C.cyan));

  // Beat 35: The computer uses the original hidden word as the correct answer, called the target
  const targetTag = pill('TARGET', C.green, P ? 17 : 15);
  targetTag.moveTo([posB(1)[0], cyB - chB / 2 - 0.36, 0]);
  await until(S(35));
  await play(
    new M.FadeOut(maskCover),
    new M.FadeOut(bothL), new M.FadeOut(bothR),
    new M.FadeIn(targetTag),
    new M.Indicate(cardsB[1], { color: C.green }),
    ...say('ORIGINAL WORD = TARGET', C.green)
  );

  // --- Phase D: Packed 12-token block & 15% masking rule (beats 36-45) ---
  const BLOCK = ['Library', 'opens', 'at', 'nine', '<end>', 'Pool', 'closed', 'today', '<end>', 'Exams', 'start', '<end>'];
  const bCols = P ? 4 : 6;
  const bW = P ? 1.66 : 1.24, bH = P ? 0.7 : 0.56;
  const bSpX = P ? 1.76 : 1.35, bSpY = P ? 0.78 : 0.78;
  const bCx = P ? 0 : -2.4, bTopY = P ? 1.0 : 0.85;
  const bPos = i => {
    const r = Math.floor(i / bCols), c = i % bCols;
    return [bCx + (c - (bCols - 1) / 2) * bSpX, bTopY - r * bSpY, 0];
  };
  const blockCards = BLOCK.map((w, i) => {
    const isEnd = w === '<end>';
    return makeCard(w, bPos(i), bW, bH, isEnd ? C.amber : C.cyan, isEnd ? C.amber : C.ink, P ? 17 : 16);
  });

  // Beat 36: Let's try this method with our packed training block containing twelve tokens
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...cardsB, targetTag, ...NH.all(), barHead, barAxis, ...barNames, barOpens, pctOpens, barClosed, pctClosed, barOther, pctOther), { runTime: 0.7 }),
    ...say('PACKED BLOCK = 12 TOKENS', C.cyan)
  );
  await play(
    new M.LaggedStart(blockCards.map(c => new M.FadeIn(c)), { lagRatio: 0.07, runTime: 1.3 })
  );

  // Beat 37: Usually select about fifteen percent of the tokens for prediction
  await until(S(37));
  await play(
    ...fbox(['total tokens = 12', ['select share = 15%', C.amber]], C.amber),
    ...say('MASK ABOUT 15% OF TOKENS', C.amber)
  );

  // Beat 38: Multiply twelve by fifteen percent
  await until(S(38));
  await play(
    ...fbox(['total = 12', 'share = 15% (0.15)', ['12 × 0.15 = ?', C.amber]], C.amber),
    ...say('12 × 15%', C.amber)
  );

  // Beat 39: The result is one point eight, which means about two tokens
  await until(S(39));
  await play(
    ...fbox(['12 × 0.15 = 1.8', ['≈ 2 tokens to mask', C.green]], C.green),
    ...say('1.8 → ABOUT 2 TOKENS', C.green)
  );

  // Beat 40: Choose two tokens and cover their cards (indices 3: "nine", 6: "closed")
  const mIdx = [3, 6];
  const mCovers = mIdx.map(i => makeCover(bPos(i), bW, bH, 'MASK', C.amber));
  await until(S(40));
  await play(
    new M.FadeIn(mCovers[0]),
    new M.FadeIn(mCovers[1]),
    ...say('HIDE 2 TOKEN CARDS', C.amber)
  );

  // Beat 41: Send the remaining visible text and the hidden positions into the network
  const N2 = net({
    layers: [3, 4, 2],
    center: P ? [-1.2, -3.0, 0] : [-2.4, -1.75, 0],
    width: P ? 3.8 : 5.0,
    height: P ? 2.4 : 1.55,
    r: P ? 0.28 : 0.22,
    names: [],
    outName: ''
  });
  styleNetEdges(N2, [
    [[0.7, -0.4, 0.5, 0.3], [0.6, 0.8, -0.5, 0.4], [-0.3, 0.5, 0.7, -0.6]],
    [[0.8, -0.2], [0.5, 0.7], [-0.4, 0.6], [0.3, 0.8]]
  ]);
  const NH2 = trackNet(N2);

  await until(S(41));
  await play(
    new M.LaggedStart(N2.nodes.flat().map(n => new M.FadeIn(n)), { lagRatio: 0.05, runTime: 0.8 }),
    new M.LaggedStart(N2.edges.flat(2).map(e => new M.FadeIn(e)), { lagRatio: 0.02, runTime: 0.9 }),
    ...say('VISIBLE + HIDDEN → NETWORK', C.cyan)
  );
  await play(...N2.flow(0, C.cyan));

  // Beat 42: The network predicts the original tokens at those two hidden positions
  const pOut0 = N2.pos(2, 0), pOut1 = N2.pos(2, 1);
  const beside = (g, o) => g.moveTo([o[0] + 0.45 + g.submobjects[0].getWidth() / 2, o[1], 0]);
  const pred0 = beside(pill('nine?', C.amber, P ? 17 : 16), pOut0);
  const pred1 = beside(pill('closed?', C.amber, P ? 17 : 16), pOut1);
  await until(S(42));
  await play(
    ...N2.flow(1, C.amber),
    new M.FadeIn(pred0),
    new M.FadeIn(pred1),
    ...say('PREDICT 2 HIDDEN TOKENS', C.amber)
  );

  // Beat 43: The computer compares the predictions with the original tokens to guide learning
  const ok0 = beside(pill('= nine ✓', C.green, P ? 17 : 16), pOut0);
  const ok1 = beside(pill('= closed ✓', C.green, P ? 17 : 16), pOut1);
  await until(S(43));
  await play(
    new M.FadeOut(mCovers[0]), new M.FadeOut(mCovers[1]),
    new M.FadeOut(pred0), new M.FadeOut(pred1),
    new M.FadeIn(ok0), new M.FadeIn(ok1),
    new M.Indicate(blockCards[3], { color: C.green }),
    new M.Indicate(blockCards[6], { color: C.green }),
    ...N2.weight(1, 0, 0, 0.95),
    ...N2.weight(1, 3, 1, 0.95),
    ...say('COMPARE WITH TARGETS → LEARN', C.green)
  );

  // Beat 44: We can write our selection process in one short formula
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(...NH2.all(), ok0, ok1), { runTime: 0.8 }),
    ...say('THE SELECTION FORMULA', C.cyan)
  );

  // Beat 45: Number of selected tokens equals total number of tokens multiplied by selected share
  await until(S(45));
  await play(
    ...fbox([
      ['selected = total × share', C.ink],
      ['         = 12 × 0.15', C.muted],
      ['         = 1.8 ≈ 2 tokens', C.amber]
    ], C.cyan),
    ...say('SELECTED = TOTAL × SHARE', C.cyan)
  );

  // --- Phase E: What it is for, traps, and recap (beats 46-53) ---
  // Beat 46: Use masked language modeling to teach a model how words relate to the words around them
  const relL = new M.Arrow({ start: [bPos(5)[0], bPos(5)[1] - bH / 2 - 0.10, 0], end: [bPos(6)[0] - 0.15, bPos(6)[1] - bH / 2 - 0.10, 0], color: C.cyan, strokeWidth: 2.5 });
  const relR = new M.Arrow({ start: [bPos(7)[0], bPos(7)[1] - bH / 2 - 0.10, 0], end: [bPos(6)[0] + 0.15, bPos(6)[1] - bH / 2 - 0.10, 0], color: C.cyan, strokeWidth: 2.5 });
  await until(S(46));
  await play(
    ...clearBox(),
    new M.Create(relL), new M.Create(relR),
    new M.Indicate(blockCards[6], { color: C.cyan }),
    ...say('LEARN HOW WORDS RELATE', C.cyan)
  );

  // Beat 47: Useful when you want a model to understand the meaning of existing text
  await until(S(47));
  await play(
    new M.LaggedStart(blockCards.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.06, runTime: 1.4 }),
    ...say('USE FOR: UNDERSTANDING TEXT', C.green)
  );

  // Beat 48: Notice that our small training block gives the model only two prediction targets
  const cmpBaseY = P ? -2.6 : -1.25;
  const cmpRowX = P ? -3.2 : -5.6;
  const dotSp = P ? 0.36 : 0.48;
  const DOT0 = P ? 0.1 : 2.55;  // phone: label above its row of dots
  const mlmLbl = T('Masked LM:', P ? 18 : 18, C.pink, true, true);
  mlmLbl.moveTo([cmpRowX + mlmLbl.getWidth() / 2, cmpBaseY + (P ? 0.5 : 0), 0]);
  const mlmDots = BLOCK.map((_, i) => {
    const active = i === 3 || i === 6;
    const d = new M.Dot({ point: [cmpRowX + DOT0 + i * dotSp, cmpBaseY, 0], radius: active ? 0.12 : 0.07, color: active ? C.pink : C.line });
    d.setFill(active ? C.pink : C.line, active ? 1 : 0.6);
    return d;
  });
  const mlmCnt = T('2 targets', P ? 18 : 18, C.pink, true, true);
  mlmCnt.moveTo([cmpRowX + DOT0 + 12 * dotSp + 0.15 + mlmCnt.getWidth() / 2, cmpBaseY, 0]);

  await until(S(48));
  await play(
    new M.FadeOut(relL), new M.FadeOut(relR),
    new M.Indicate(blockCards[3], { color: C.pink }),
    new M.Indicate(blockCards[6], { color: C.pink }),
    new M.FadeIn(mlmLbl),
    new M.LaggedStart(mlmDots.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 0.9 }),
    new M.FadeIn(mlmCnt),
    ...say('TRAP 1: ONLY 2 TARGETS', C.pink)
  );

  // Beat 49: Next-token prediction can provide eleven targets from the same block
  const nxtY = cmpBaseY - (P ? 1.4 : 0.78);
  const nxtLbl = T('Next-token:', P ? 18 : 18, C.cyan, true, true);
  nxtLbl.moveTo([cmpRowX + nxtLbl.getWidth() / 2, nxtY + (P ? 0.5 : 0), 0]);
  const nxtDots = BLOCK.map((_, i) => {
    const active = i >= 1;
    const d = new M.Dot({ point: [cmpRowX + DOT0 + i * dotSp, nxtY, 0], radius: active ? 0.11 : 0.07, color: active ? C.cyan : C.line });
    d.setFill(active ? C.cyan : C.line, active ? 1 : 0.6);
    return d;
  });
  const nxtCnt = T('11 targets', P ? 18 : 18, C.cyan, true, true);
  nxtCnt.moveTo([cmpRowX + DOT0 + 12 * dotSp + 0.15 + nxtCnt.getWidth() / 2, nxtY, 0]);

  await until(S(49));
  await play(
    new M.FadeIn(nxtLbl),
    new M.LaggedStart(nxtDots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 1.0 }),
    new M.FadeIn(nxtCnt),
    ...say('NEXT-TOKEN: 11 TARGETS', C.cyan)
  );

  // Beat 50: Masked language modeling allows the network to use words after a hidden position
  const cyE = P ? -2.2 : 0.15;
  const posE = k => [(k - 1) * spA, cyE, 0];
  const ePool = makeCard('Pool', posE(0), cwA, chA, C.cyan, C.ink, P ? 22 : 24);
  const eMid = makeCard('closed', posE(1), cwA, chA, C.green, C.green, P ? 22 : 24);
  const eCov = makeCover(posE(1), cwA, chA, '?', C.amber);
  const eToday = makeCard('today', posE(2), cwA, chA, C.amber, C.amber, P ? 22 : 24);
  const eArrL = new M.Arrow({ start: [posE(0)[0], cyE - chA / 2 - 0.16, 0], end: [posE(1)[0] - 0.2, cyE - chA / 2 - 0.16, 0], color: C.cyan, strokeWidth: 2.8 });
  const eArrR = new M.Arrow({ start: [posE(2)[0], cyE - chA / 2 - 0.16, 0], end: [posE(1)[0] + 0.2, cyE - chA / 2 - 0.16, 0], color: C.amber, strokeWidth: 2.8 });
  const futTag = T('future word', P ? 18 : 17, C.amber, true, true);
  futTag.moveTo([posE(2)[0], cyE + chA / 2 + 0.34, 0]);

  await until(S(50));
  await play(
    new M.FadeOut(new M.VGroup(...blockCards, mlmLbl, ...mlmDots, mlmCnt, nxtLbl, ...nxtDots, nxtCnt), { runTime: 0.7 }),
    ...say('USES WORDS AFTER THE GAP', C.amber)
  );
  await play(
    new M.FadeIn(new M.VGroup(ePool, eMid, eCov, eToday, futTag)),
    new M.Create(eArrL),
    new M.Create(eArrR)
  );

  // Beat 51: When writing new text from left to right, those future words do not exist yet
  const emptyBox = new M.RoundedRectangle({ width: cwA, height: chA, cornerRadius: 0.14, color: C.pink, strokeWidth: 2 });
  emptyBox.setFill(C.bg, 0.5); emptyBox.moveTo(posE(2));
  const emptyTxt = T(P ? 'not yet' : 'not written yet', P ? 18 : 15, C.pink, true, true);
  emptyTxt.moveTo(posE(2));
  const emptyGrp = new M.VGroup(emptyBox, emptyTxt);
  await until(S(51));
  await play(
    new M.FadeOut(eToday), new M.FadeOut(eArrR), new M.FadeOut(futTag),
    new M.FadeIn(emptyGrp),
    new M.Indicate(eArrL, { color: C.cyan }),
    ...say('WRITING LEFT → RIGHT: NO FUTURE WORDS', C.pink)
  );

  // Beat 52: Not naturally suited to writing text one token at a time
  const useGood = pill('UNDERSTANDING TEXT  ✓', C.green, P ? 19 : 17);
  useGood.moveTo([P ? 0 : -2.6, cyE - (P ? 2.4 : 1.75), 0]);
  const useBad = pill('WRITING TOKEN BY TOKEN  ✗', C.pink, P ? 19 : 17);
  useBad.moveTo([P ? 0 : 2.6, cyE - (P ? 3.4 : 1.75), 0]);
  await until(S(52));
  await play(
    new M.FadeIn(useGood),
    new M.FadeIn(useBad),
    new M.Indicate(emptyGrp, { color: C.pink }),
    ...say('NOT BUILT FOR WRITING LEFT → RIGHT', C.pink)
  );

  // Beat 53: Recap
  const eTodayFinal = makeCard('today', posE(2), cwA, chA, C.cyan, C.ink, P ? 22 : 24);
  const eArrRFinal = new M.Arrow({ start: [posE(2)[0], cyE - chA / 2 - 0.16, 0], end: [posE(1)[0] + 0.2, cyE - chA / 2 - 0.16, 0], color: C.cyan, strokeWidth: 2.8 });
  await until(S(53));
  await play(
    new M.FadeOut(new M.VGroup(eCov, emptyGrp, useBad)),
    new M.FadeIn(eTodayFinal),
    new M.Create(eArrRFinal),
    new M.Indicate(eMid, { color: C.green }),
    ...say('PREDICT HIDDEN TOKENS FROM BOTH SIDES', C.green)
  );
}

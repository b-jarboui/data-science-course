// 20.1.4 Next-token prediction: learning to predict what comes next.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;
  const ORANGE = '#fb923c';
  const PILL = P ? [0, 2.6, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, -5.1, 0] : [0, -1.75, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  // Formula box (at most one on screen at a time)
  let boxNow = null;
  function fbox(lines, color = C.cyan, pos = BOXP) {
    const size = P ? 23 : 22, lh = P ? 0.5 : 0.44;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const left = pos[0] - wd / 2 + 0.35, top = pos[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 8.5;
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

  // Reusable helpers (all parts positioned via moveTo before grouping)
  const CW = P ? 1.36 : 2.0, CH = P ? 1.05 : 0.92, STEP = P ? 1.5 : 2.3;
  const colX = (k, n = 5) => (k - (n - 1) / 2) * STEP;

  function makeCard(label, x, y, color = C.cyan, w = CW, h = CH, fs = P ? 18 : 23) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.96); r.moveTo([x, y, 0]);
    const t = T(label, fs, color, true, true);
    if (t.getWidth() > w - 0.18) t.scale((w - 0.18) / t.getWidth());
    t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }

  function makeCover(x, y, w = CW, h = CH, color = C.muted) {
    const r = new M.RoundedRectangle({ width: w + 0.04, height: h + 0.04, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.bg, 0.98); r.moveTo([x, y, 0]);
    const q = T('?', P ? 22 : 26, color, true, true); q.moveTo([x, y, 0]);
    return new M.VGroup(r, q);
  }

  function makeOutline(x0, x1, y, h, color = C.cyan, sw = 2.6) {
    const r = new M.RoundedRectangle({ width: (x1 - x0) + 0.18, height: h + 0.18, cornerRadius: 0.16, color, strokeWidth: sw });
    r.setFill(color, 0.08); r.moveTo([(x0 + x1) / 2, y, 0]);
    return r;
  }

  function makeArrow(a, b, color = C.amber, sw = 2.6, head = 0.16) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const tip = [b[0], b[1], 0];
    const h1 = [b[0] - ux * head + px * head * 0.55, b[1] - uy * head + py * head * 0.55, 0];
    const h2 = [b[0] - ux * head - px * head * 0.55, b[1] - uy * head - py * head * 0.55, 0];
    return new M.VGroup(
      new M.Line({ start: [a[0], a[1], 0], end: tip, color, strokeWidth: sw }),
      new M.Line({ start: h1, end: tip, color, strokeWidth: sw }),
      new M.Line({ start: h2, end: tip, color, strokeWidth: sw })
    );
  }

  // ===========================================================================
  // ACT 1 (0-6): Campus newsletter hook with hidden last word
  // ===========================================================================
  const NY = P ? -1.1 : -0.1;
  const nw = P ? 7.2 : 9.4, nh = P ? 4.0 : 2.55;
  const newsBox = new M.RoundedRectangle({ width: nw, height: nh, cornerRadius: 0.2, color: C.muted, strokeWidth: 2 });
  newsBox.setFill(C.card, 0.94); newsBox.moveTo([0, NY, 0]);
  const newsHead = T('CAMPUS NEWSLETTER', P ? 17 : 17, C.muted, true, true);
  newsHead.moveTo([0, NY + nh / 2 - 0.42, 0]);
  const newsRule = new M.Line({ start: [-nw / 2 + 0.35, NY + nh / 2 - 0.72, 0], end: [nw / 2 - 0.35, NY + nh / 2 - 0.72, 0], color: C.line, strokeWidth: 1.5 });
  const newsFrame = new M.VGroup(newsBox, newsHead, newsRule);

  const wPos = P ? [-2.15, -0.65, 0.65, 2.05] : [-2.85, -0.9, 0.75, 2.45];
  const wY = NY - 0.25;
  const nWords = ['Library', 'opens', 'at'].map((w, i) => {
    const t = T(w, P ? 26 : 32, C.cyan, false, true); t.moveTo([wPos[i], wY, 0]); return t;
  });
  const hideSlot = makeCover(wPos[3], wY, P ? 1.55 : 2.1, P ? 0.78 : 0.88, C.amber);

  // Beat 0
  await until(S(0));
  await play(new M.FadeIn(newsFrame), new M.FadeIn(hideSlot), ...say('CAMPUS NEWSLETTER: LAST WORD HIDDEN'));

  // Beat 1
  await until(S(1));
  await play(new M.LaggedStart(nWords.map(w => new M.FadeIn(w)), { lagRatio: 0.25, runTime: 1.4 }), ...say('VISIBLE: LIBRARY OPENS AT'));

  // Beat 2
  await until(S(2));
  await play(new M.Indicate(hideSlot, { color: C.amber, runTime: 1.1 }), ...say('WHAT WORD COMES NEXT?', C.amber));

  // Beat 3
  const guessY = P ? -4.0 : -2.1;
  const guessX = P ? [-2.1, 0, 2.1] : [-2.6, 0, 2.6];
  const guesses = ['nine', 'ten', 'noon'].map((g, i) => pill(g, C.amber, P ? 22 : 21).moveTo([guessX[i], guessY, 0]));
  await until(S(3));
  await play(new M.LaggedStart(guesses.map(g => new M.FadeIn(g)), { lagRatio: 0.22, runTime: 1.3 }), ...say('PERHAPS NINE, TEN OR NOON', C.amber));

  // Beat 4
  const ctxBox = makeOutline(wPos[0] - (P ? 0.78 : 1.05), wPos[2] + (P ? 0.35 : 0.45), wY, P ? 0.76 : 0.86, C.cyan, 2.2);
  const ctxArr = makeArrow([wPos[2] + (P ? 0.48 : 0.62), wY], [wPos[3] - (P ? 0.86 : 1.15), wY], C.cyan, 2.6, 0.16);
  await until(S(4));
  await play(new M.Create(ctxBox), new M.FadeIn(ctxArr), ...say('PREDICT FROM WORDS YOU ALREADY SEE', C.cyan));

  // Beat 5
  const nineRev = makeCard('nine', wPos[3], wY, C.green, P ? 1.55 : 2.1, P ? 0.78 : 0.88, P ? 22 : 28);
  const nineDot = new M.Dot({ point: [wPos[3], wY, 0], radius: 0.01, color: C.green });
  await until(S(5));
  await play(new M.FadeOut(hideSlot), new M.FadeOut(new M.VGroup(...guesses)), new M.FadeIn(nineRev),
    new M.Flash(nineDot, { color: C.green }), ...say('REVEALED: NINE', C.green));

  // Beat 6
  const mini1 = pill('Pool closed [today]', C.violet, P ? 19 : 17).moveTo([P ? 0 : -2.5, P ? -4.0 : -2.05, 0]);
  const mini2 = pill('Exams [start]', C.violet, P ? 19 : 17).moveTo([P ? 0 : 2.5, P ? -5.0 : -2.05, 0]);
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(ctxBox, ctxArr)),
    new M.LaggedStart([new M.FadeIn(mini1), new M.FadeIn(mini2)], { lagRatio: 0.35, runTime: 1.5 }),
    ...say('PRACTICE THIS PREDICTION MANY TIMES', C.violet));

  // ===========================================================================
  // ACT 2 (7-12): Glowing token cards + orange <end> marker
  // ===========================================================================
  const ROW_Y = P ? -2.4 : 0.15;
  const TOK5 = ['Library', 'opens', 'at', 'nine', '<end>'];
  const fullLine = T('Library   opens   at   nine', P ? 30 : 36, C.cyan, false, true);
  fullLine.moveTo([0, ROW_Y, 0]);

  // Beat 7
  await until(S(7));
  await play(new M.FadeOut(new M.VGroup(newsFrame, ...nWords, nineRev, mini1, mini2)),
    new M.FadeIn(fullLine), ...say('COMPLETE NEWSLETTER'));

  // Beat 8
  const cards4 = TOK5.slice(0, 4).map((w, k) => makeCard(w, colX(k, 5), ROW_Y, C.cyan));
  await until(S(8));
  await play(new M.FadeOut(fullLine),
    new M.LaggedStart(cards4.map(c => new M.FadeIn(c)), { lagRatio: 0.18, runTime: 1.5 }),
    ...say('EACH WORD ON A GLOWING CARD'));

  // Beat 9
  await until(S(9));
  await play(new M.LaggedStart(cards4.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.16, runTime: 1.6 }),
    ...say('EACH SMALL PIECE = 1 TOKEN', C.cyan));

  // Beat 10
  const idxLabels = [0, 1, 2, 3].map(k => {
    const t = T(String(k + 1), P ? 16 : 18, C.muted, true);
    t.moveTo([colX(k, 5), ROW_Y - CH / 2 - 0.35, 0]); return t;
  });
  await until(S(10));
  await play(new M.LaggedStart(idxLabels.map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 1.2 }),
    ...say('1 WORD = 1 TOKEN', C.cyan));

  // Beat 11
  const endCard = makeCard('<end>', colX(4, 5), ROW_Y, ORANGE);
  const idx5 = T('5', P ? 16 : 18, ORANGE, true); idx5.moveTo([colX(4, 5), ROW_Y - CH / 2 - 0.35, 0]);
  const endDot = new M.Dot({ point: [colX(4, 5), ROW_Y, 0], radius: 0.01, color: ORANGE });
  await until(S(11));
  await play(new M.FadeIn(endCard), new M.FadeIn(idx5), new M.Flash(endDot, { color: ORANGE }),
    ...say('ADD THE ORANGE END TOKEN', ORANGE));

  // Beat 12
  const all5 = [...cards4, endCard];
  const allIdx = [...idxLabels, idx5];
  const spanY = ROW_Y - CH / 2 - 0.85;
  const spanLine = new M.Line({ start: [colX(0, 5) - CW / 2, spanY, 0], end: [colX(4, 5) + CW / 2, spanY, 0], color: C.amber, strokeWidth: 2.2 });
  const spanLab = T('5 tokens', P ? 18 : 20, C.amber, true, true); spanLab.moveTo([0, spanY - 0.35, 0]);
  await until(S(12));
  await play(new M.Create(spanLine), new M.FadeIn(spanLab), ...say('5 TOKENS INCLUDING <end>', C.amber));

  // ===========================================================================
  // ACT 3 (13-25): Cover all except first, predict & reveal one by one
  // ===========================================================================
  const covers = [1, 2, 3, 4].map(k => makeCover(colX(k, 5), ROW_Y, CW, CH, k === 4 ? ORANGE : C.muted));

  // Beat 13
  await until(S(13));
  await play(new M.FadeOut(new M.VGroup(spanLine, spanLab)),
    new M.LaggedStart(covers.map(c => new M.FadeIn(c)), { lagRatio: 0.14, runTime: 1.4 }),
    ...say('COVER ALL EXCEPT THE FIRST', C.muted));

  // Beat 14: Task 1 (Library -> opens)
  const arrY = ROW_Y + CH / 2 + 0.45;
  let visBox = makeOutline(colX(0, 5) - CW / 2, colX(0, 5) + CW / 2, ROW_Y, CH, C.cyan, 2.5);
  let predBox = makeOutline(colX(1, 5) - CW / 2, colX(1, 5) + CW / 2, ROW_Y, CH, C.amber, 2.8);
  let predArr = makeArrow([colX(0, 5), arrY], [colX(1, 5), arrY], C.amber, 2.6, 0.16);
  await until(S(14));
  await play(new M.Create(visBox), new M.Create(predBox), new M.FadeIn(predArr),
    ...fbox(['Sees:    Library', ['Predict: ?', C.amber]], C.amber), ...say('TASK 1: SEE LIBRARY → PREDICT ?', C.amber));

  // Beat 15: Reveal opens
  const flashAt = k => new M.Dot({ point: [colX(k, 5), ROW_Y, 0], radius: 0.01, color: C.green });
  await until(S(15));
  await play(new M.FadeOut(covers[0]), new M.FadeOut(new M.VGroup(visBox, predBox, predArr)),
    new M.Flash(flashAt(1), { color: C.green }), ...fbox(['Sees:    Library', ['Target:  opens', C.green]], C.green), ...say('REVEALED: OPENS', C.green));

  // Beat 16: Visible Library opens
  visBox = makeOutline(colX(0, 5) - CW / 2, colX(1, 5) + CW / 2, ROW_Y, CH, C.cyan, 2.5);
  await until(S(16));
  await play(new M.Create(visBox), ...say('VISIBLE: LIBRARY OPENS', C.cyan));

  // Beat 17: Task 2 (predict at)
  predBox = makeOutline(colX(2, 5) - CW / 2, colX(2, 5) + CW / 2, ROW_Y, CH, C.amber, 2.8);
  predArr = makeArrow([colX(1, 5), arrY], [colX(2, 5), arrY], C.amber, 2.6, 0.16);
  await until(S(17));
  await play(new M.Create(predBox), new M.FadeIn(predArr), ...fbox(['Sees:    Library opens', ['Predict: ?', C.amber]], C.amber), ...say('TASK 2: PREDICT AT', C.amber));

  // Beat 18: Reveal at -> Library opens at
  const visBox3 = makeOutline(colX(0, 5) - CW / 2, colX(2, 5) + CW / 2, ROW_Y, CH, C.cyan, 2.5);
  await until(S(18));
  await play(new M.FadeOut(covers[1]), new M.FadeOut(new M.VGroup(visBox, predBox, predArr)),
    new M.Create(visBox3), new M.Flash(flashAt(2), { color: C.green }),
    ...fbox(['Sees:    Library opens', ['Target:  at', C.green]], C.green), ...say('VISIBLE: LIBRARY OPENS AT', C.cyan));
  visBox = visBox3;

  // Beat 19: Task 3 (predict nine)
  predBox = makeOutline(colX(3, 5) - CW / 2, colX(3, 5) + CW / 2, ROW_Y, CH, C.amber, 2.8);
  predArr = makeArrow([colX(2, 5), arrY], [colX(3, 5), arrY], C.amber, 2.6, 0.16);
  await until(S(19));
  await play(new M.Create(predBox), new M.FadeIn(predArr), ...fbox(['Sees:    Library opens at', ['Predict: ?', C.amber]], C.amber), ...say('TASK 3: PREDICT NINE', C.amber));

  // Beat 20: Reveal nine -> Library opens at nine
  const visBox4 = makeOutline(colX(0, 5) - CW / 2, colX(3, 5) + CW / 2, ROW_Y, CH, C.cyan, 2.5);
  await until(S(20));
  await play(new M.FadeOut(covers[2]), new M.FadeOut(new M.VGroup(visBox, predBox, predArr)),
    new M.Create(visBox4), new M.Flash(flashAt(3), { color: C.green }),
    ...fbox(['Sees:    Library opens at', ['Target:  nine', C.green]], C.green), ...say('VISIBLE: LIBRARY OPENS AT NINE', C.cyan));
  visBox = visBox4;

  // Beat 21: Task 4 (predict <end>)
  predBox = makeOutline(colX(4, 5) - CW / 2, colX(4, 5) + CW / 2, ROW_Y, CH, ORANGE, 2.8);
  predArr = makeArrow([colX(3, 5), arrY], [colX(4, 5), arrY], ORANGE, 2.6, 0.16);
  await until(S(21));
  await play(new M.Create(predBox), new M.FadeIn(predArr), ...fbox(['Sees:    Library opens at nine', ['Predict: ?', ORANGE]], ORANGE), ...say('TASK 4: PREDICT <end>', ORANGE));

  // Beat 22: Next-token prediction
  await until(S(22));
  await play(new M.FadeOut(covers[3]), new M.FadeOut(new M.VGroup(visBox, predBox, predArr)),
    new M.Flash(flashAt(4), { color: ORANGE }), ...fbox(['Sees:    Library opens at nine', ['Target:  <end>', ORANGE]], ORANGE), ...say('NEXT-TOKEN PREDICTION', C.green));

  // Beat 23: Each correct answer = target
  const targetTags = [1, 2, 3, 4].map(k => {
    const t = T('target', P ? 15 : 16, k === 4 ? ORANGE : C.green, true, true);
    t.moveTo([colX(k, 5), ROW_Y - CH / 2 - 0.78, 0]); return t;
  });
  await until(S(23));
  await play(...clearBox(), new M.LaggedStart(targetTags.map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 1.2 }),
    new M.LaggedStart(all5.slice(1).map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.14, runTime: 1.2 }),
    ...say('CORRECT ANSWER = TARGET', C.green));

  // Beat 24
  const noManual = T('No one writes the targets', P ? 22 : 20, C.violet);
  noManual.moveTo([0, ROW_Y - (P ? 2.6 : 1.95), 0]);
  await until(S(24));
  await play(new M.FadeIn(noManual), ...say('NO MANUAL TARGETS NEEDED', C.violet));

  // Beat 25
  await until(S(25));
  await play(new M.LaggedStart(all5.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.6 }),
    ...say('THE TEXT ALREADY HAS EVERY ANSWER', C.cyan));

  // ===========================================================================
  // ACT 4 (26-34): Copy row and shift left by 1 -> Inputs & Targets
  // ===========================================================================
  const TOP_Y = P ? -0.5 : 0.6;
  const BOT_Y = P ? -2.9 : -0.95;
  const topRow = TOK5.map((w, k) => makeCard(w, colX(k, 5), TOP_Y, k === 4 ? ORANGE : C.cyan));
  const botRow0 = TOK5.map((w, k) => makeCard(w, colX(k, 5), BOT_Y, k === 4 ? ORANGE : C.cyan));
  const botRow = TOK5.slice(1).map((w, k) => makeCard(w, colX(k, 5), BOT_Y, k === 3 ? ORANGE : C.green));

  // Beat 26
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(...all5, ...allIdx, ...targetTags, noManual)),
    new M.LaggedStart(topRow.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.4 }),
    ...say('5 TOKEN CARDS IN ONE ROW'));

  // Beat 27
  await until(S(27));
  await play(new M.LaggedStart(botRow0.map(c => new M.FadeIn(c, { shift: [0, -0.45, 0] })), { lagRatio: 0.1, runTime: 1.5 }),
    ...say('COPY THE ROW DIRECTLY BELOW'));

  // Beat 28: Shift lower row 1 position to the left
  const dimTopEnd = new M.RoundedRectangle({ width: CW + 0.04, height: CH + 0.04, cornerRadius: 0.14, color: C.line, strokeWidth: 1.5 });
  dimTopEnd.setFill(C.bg, 0.72); dimTopEnd.moveTo([colX(4, 5), TOP_Y, 0]);
  await until(S(28));
  await play(
    ...botRow0.map(c => new M.FadeOut(c, { shift: [-STEP, 0, 0], runTime: 1.2 })),
    ...botRow.map(c => new M.FadeIn(c, { shift: [-STEP, 0, 0], runTime: 1.2 })),
    new M.FadeIn(dimTopEnd, { runTime: 1.2 }),
    ...say('SHIFT LOWER ROW LEFT BY 1', C.amber));

  // Beats 29-32: Pair alignment (30, 31, 32 are fast!)
  const pairArr = k => makeArrow([colX(k, 5), TOP_Y - CH / 2 - 0.06], [colX(k, 5), BOT_Y + CH / 2 + 0.06], k === 3 ? ORANGE : C.amber, 2.5, 0.15);
  const pairOut = k => {
    const r = new M.RoundedRectangle({ width: CW + 0.24, height: (TOP_Y - BOT_Y) + CH + 0.24, cornerRadius: 0.18, color: k === 3 ? ORANGE : C.amber, strokeWidth: 2.5 });
    r.setFill(k === 3 ? ORANGE : C.amber, 0.07); r.moveTo([colX(k, 5), (TOP_Y + BOT_Y) / 2, 0]); return r;
  };
  const pArrs = [0, 1, 2, 3].map(pairArr);

  // Beat 29
  let pOutNow = pairOut(0);
  await until(S(29));
  await play(new M.FadeIn(pArrs[0], { runTime: 0.8 }), new M.Create(pOutNow, { runTime: 0.8 }), ...say('LIBRARY → OPENS', C.amber));

  // Beat 30 (1.47s gap)
  const pOut1 = pairOut(1);
  await until(S(30));
  await play(new M.FadeOut(pOutNow, { runTime: 0.55 }), new M.FadeIn(pArrs[1], { runTime: 0.55 }), new M.FadeIn(pOut1, { runTime: 0.55 }), ...say('OPENS → AT', C.amber));
  pOutNow = pOut1;

  // Beat 31 (1.35s gap)
  const pOut2 = pairOut(2);
  await until(S(31));
  await play(new M.FadeOut(pOutNow, { runTime: 0.55 }), new M.FadeIn(pArrs[2], { runTime: 0.55 }), new M.FadeIn(pOut2, { runTime: 0.55 }), ...say('AT → NINE', C.amber));
  pOutNow = pOut2;

  // Beat 32 (1.87s gap)
  const pOut3 = pairOut(3);
  await until(S(32));
  await play(new M.FadeOut(pOutNow, { runTime: 0.65 }), new M.FadeIn(pArrs[3], { runTime: 0.65 }), new M.FadeIn(pOut3, { runTime: 0.65 }), ...say('NINE → <end>', ORANGE));
  pOutNow = pOut3;

  // Beat 33: Inputs
  const inBox = makeOutline(colX(0, 5) - CW / 2, colX(3, 5) + CW / 2, TOP_Y, CH, C.cyan, 2.4);
  const inLab = T('INPUTS', P ? 19 : 18, C.cyan, true, true);
  inLab.moveTo([(colX(0, 5) + colX(3, 5)) / 2, TOP_Y + CH / 2 + 0.34, 0]);
  await until(S(33));
  await play(new M.FadeOut(pOutNow), new M.Create(inBox), new M.FadeIn(inLab), ...say('UPPER ROW = INPUTS', C.cyan));

  // Beat 34: Targets
  const tgBox = makeOutline(colX(0, 5) - CW / 2, colX(3, 5) + CW / 2, BOT_Y, CH, C.green, 2.4);
  const tgLab = T('TARGETS', P ? 19 : 18, C.green, true, true);
  tgLab.moveTo([(colX(0, 5) + colX(3, 5)) / 2, BOT_Y - CH / 2 - 0.36, 0]);
  await until(S(34));
  await play(new M.Create(tgBox), new M.FadeIn(tgLab), ...say('LOWER ROW = TARGETS', C.green));

  // ===========================================================================
  // ACT 5 (35-43): Neural network via L.net(...) + forward signal + chances
  // ===========================================================================
  const netCenter = P ? [0.1, -1.3, 0] : [-1.6, -0.95, 0];
  const netW = P ? 5.2 : 5.2, netH = P ? 3.2 : 2.55, netR = P ? 0.3 : 0.25;
  const N = net({ layers: [3, 4, 3], center: netCenter, width: netW, height: netH, r: netR, names: ['x1', 'x2', 'x3'] });
  // Style initial weights (positive cyan, negative pink, varied thickness)
  const initW0 = [[0.8, -0.5, 0.4, -0.3], [-0.4, 0.7, -0.6, 0.5], [0.5, 0.3, 0.9, -0.7]];
  const initW1 = [[0.7, -0.4, 0.3], [-0.5, 0.8, -0.3], [0.9, -0.6, 0.5], [-0.4, 0.5, 0.8]];
  [initW0, initW1].forEach((mat, l) => mat.forEach((row, i) => row.forEach((w, j) => {
    const ln = N.edges[l][i][j], a = Math.min(1, Math.abs(w));
    ln.setColor(w < 0 ? C.pink : C.cyan); ln.setStrokeWidth(1.5 + 3.6 * a); ln.setStrokeOpacity(0.35 + 0.55 * a);
  })));
  const netVals = {};
  function setVal(l, i, s, col = C.ink) {
    const a = N.value(l, i, s, col);
    netVals[l + ':' + i] = a[0].mobject;
    return a;
  }
  const layerNames = ['input', 'hidden', 'output'].map((name, l) => {
    const p = N.pos(l, 0);
    const t = T(name, P ? 15 : 15, C.muted, true);
    t.moveTo([p[0], netCenter[1] - netH / 2 - 0.52, 0]); return t;
  });

  // Beat 35: Draw neural network
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(...topRow, ...botRow, dimTopEnd, ...pArrs, inBox, inLab, tgBox, tgLab)),
    new M.FadeIn(N.group), new M.FadeIn(new M.VGroup(...layerNames)),
    ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS', C.cyan));

  // Mini input token strip above the network
  const MINI_Y = P ? 1.45 : 1.15, MINI_W = P ? 1.6 : 1.7, MINI_H = P ? 0.7 : 0.56, MINI_ST = P ? 1.76 : 1.95;
  const miniX = k => (k - 1.5) * MINI_ST;
  const miniToks = ['Library', 'opens', 'at', 'nine'].map((w, k) => makeCard(w, miniX(k), MINI_Y, C.cyan, MINI_W, MINI_H, P ? 17 : 17));

  // Beat 36: Input tokens as numbers
  await until(S(36));
  await play(
    new M.LaggedStart(miniToks.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.2 }),
    ...N.nodes[0].map(c => new M.Indicate(c, { color: C.violet })),
    ...say('INPUT TOKENS BECOME NUMBERS', C.violet));

  // Beat 37: Glowing signals left to right
  await until(S(37));
  await play(...N.flow(0, C.cyan), ...say('NUMBERS FLOW LEFT TO RIGHT', C.amber));
  await play(...N.flow(1, C.amber));

  // Probability bars helper (aligned with output layer on laptop, cleanly below network on phone)
  let barsNow = null;
  function makeBars(rows) {
    const parts = [];
    const maxW = P ? 3.4 : 2.55, barH = P ? 0.44 : 0.32;
    rows.forEach(([word, pct, col], j) => {
      const y = P ? -3.85 - j * 0.85 : N.pos(2, j)[1];
      const lx = P ? -2.7 : 2.15;
      const bx0 = P ? -1.75 : 2.95;
      const px = P ? 2.6 : 6.1;
      const wl = T(word, P ? 19 : 17, col, true, true); wl.moveTo([lx, y, 0]);
      const track = new M.RoundedRectangle({ width: maxW, height: barH, cornerRadius: 0.08, color: C.line, strokeWidth: 1.5 });
      track.setFill(C.card, 0.9); track.moveTo([bx0 + maxW / 2, y, 0]);
      const fw = Math.max(0.18, maxW * pct / 100);
      const fill = new M.RoundedRectangle({ width: fw, height: barH - 0.04, cornerRadius: 0.07, color: col, strokeWidth: 0 });
      fill.setFill(col, 0.85); fill.moveTo([bx0 + fw / 2, y, 0]);
      const pl = T(`${pct}%`, P ? 19 : 17, col, true, true); pl.moveTo([px, y, 0]);
      parts.push(wl, track, fill, pl);
    });
    return new M.VGroup(...parts);
  }
  function swapBars(rows) {
    const nb = makeBars(rows);
    const a = [new M.FadeIn(nb)];
    if (barsNow) a.push(new M.FadeOut(barsNow));
    barsNow = nb;
    return a;
  }

  // Beat 38: Output chances
  await until(S(38));
  await play(...swapBars([['nine', 50, C.green], ['ten', 25, C.cyan], ['noon', 25, C.cyan]]),
    ...say('A PROBABILITY FOR EACH NEXT TOKEN', C.amber));

  // Position masking covers & active highlight on the mini token strip
  const miniDim = [1, 2, 3].map(k => {
    const r = new M.RoundedRectangle({ width: MINI_W + 0.04, height: MINI_H + 0.04, cornerRadius: 0.14, color: C.line, strokeWidth: 1.5 });
    r.setFill(C.bg, 0.78); r.moveTo([miniX(k), MINI_Y, 0]); return r;
  });
  let miniHi = makeOutline(miniX(0) - MINI_W / 2, miniX(0) + MINI_W / 2, MINI_Y, MINI_H, C.cyan, 2.5);

  // Beat 39: Position 1 (Library -> opens)
  await until(S(39));
  await play(
    new M.FadeIn(miniDim[0]), new M.FadeIn(miniDim[1]), new M.FadeIn(miniDim[2]),
    new M.Create(miniHi),
    ...N.flow(0, C.cyan),
    ...swapBars([['opens', 45, C.green], ['is', 35, C.muted], ['has', 20, C.muted]]),
    ...say('POS 1: LIBRARY → OPENS', C.green));

  // Beat 40: Position 2 (Library opens -> at)
  const miniHi2 = makeOutline(miniX(0) - MINI_W / 2, miniX(1) + MINI_W / 2, MINI_Y, MINI_H, C.cyan, 2.5);
  await until(S(40));
  await play(
    new M.FadeOut(miniDim[0]), new M.FadeOut(miniHi), new M.Create(miniHi2),
    ...N.flow(1, C.cyan),
    ...swapBars([['at', 55, C.green], ['on', 25, C.muted], ['early', 20, C.muted]]),
    ...say('POS 2: LIBRARY OPENS → AT', C.green));
  miniHi = miniHi2;

  // Beat 41: Position 3 (Library opens at -> nine)
  const miniHi3 = makeOutline(miniX(0) - MINI_W / 2, miniX(2) + MINI_W / 2, MINI_Y, MINI_H, C.cyan, 2.5);
  await until(S(41));
  await play(
    new M.FadeOut(miniDim[1]), new M.FadeOut(miniHi), new M.Create(miniHi3),
    ...N.flow(0, C.cyan),
    ...swapBars([['nine', 50, C.green], ['ten', 25, C.cyan], ['noon', 25, C.cyan]]),
    ...say('POS 3: LIBRARY OPENS AT → NINE', C.green));
  miniHi = miniHi3;

  // Beat 42: Position 4 (all 4 words -> <end>)
  const miniHi4 = makeOutline(miniX(0) - MINI_W / 2, miniX(3) + MINI_W / 2, MINI_Y, MINI_H, C.cyan, 2.5);
  await until(S(42));
  await play(
    new M.FadeOut(miniDim[2]), new M.FadeOut(miniHi), new M.Create(miniHi4),
    ...N.flow(1, ORANGE),
    ...swapBars([['<end>', 60, ORANGE], ['am', 25, C.muted], ['today', 15, C.muted]]),
    ...say('POS 4: ALL 4 WORDS → <end>', ORANGE));
  miniHi = miniHi4;

  // Beat 43: Compare prediction with target & send pink learning signal right-to-left
  const cmpBadge = pill('PREDICTION  vs  TARGET  →  UPDATE', C.amber, P ? 17 : 16);
  cmpBadge.moveTo([P ? 0 : 4.2, P ? -6.4 : -2.6, 0]);
  const gradDots = [0, 1, 2].map(j => new M.Dot({ point: N.pos(2, j), radius: 0.1, color: ORANGE }));
  const gradMid = [0, 1, 2].map(j => new M.Dot({ point: N.pos(1, j), radius: 0.1, color: ORANGE }));
  const gradEnd = [0, 1, 2].map(j => new M.Dot({ point: N.pos(0, j), radius: 0.1, color: ORANGE }));
  await until(S(43));
  await play(new M.FadeIn(cmpBadge), ...gradDots.map(d => new M.FadeIn(d, { runTime: 0.4 })),
    ...say('GRADIENTS FLOW BACK: WEIGHTS CHANGE', ORANGE));
  await play(...gradDots.map((d, j) => new M.Transform(d, gradMid[j], { runTime: 0.8 })),
    ...N.weight(1, 0, 0, 1.0), ...N.weight(1, 2, 0, 1.0));
  await play(...gradDots.map((d, j) => new M.Transform(d, gradEnd[j], { runTime: 0.8 })),
    ...N.weight(0, 0, 0, 1.0), ...N.weight(0, 2, 2, 1.0));

  // ===========================================================================
  // ACT 6 (44-47): Counting prediction tasks & formula (5->4, 12->11)
  // ===========================================================================
  const CROW_Y = P ? -1.6 : 0.2;
  const countCards = TOK5.map((w, k) => makeCard(w, colX(k, 5), CROW_Y, k === 4 ? ORANGE : C.cyan));
  const taskLinks = [0, 1, 2, 3].map(k => {
    const ax = colX(k, 5) + 0.15, bx = colX(k + 1, 5) - 0.15, ay = CROW_Y + CH / 2 + 0.36;
    const arr = makeArrow([ax, ay], [bx, ay], C.amber, 2.4, 0.14);
    const num = T(String(k + 1), P ? 18 : 17, C.amber, true, true);
    num.moveTo([(ax + bx) / 2, ay + 0.32, 0]);
    return new M.VGroup(arr, num);
  });

  // Beat 44: 5 tokens -> 4 prediction tasks
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(N.group, ...Object.values(netVals), ...layerNames, ...miniToks, miniHi, barsNow, cmpBadge, ...gradDots)),
    new M.LaggedStart(countCards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.1 }),
    new M.LaggedStart(taskLinks.map(l => new M.FadeIn(l)), { lagRatio: 0.16, runTime: 1.4 }),
    ...say('5 TOKENS → 4 PREDICTION TASKS', C.amber));

  // Beat 45: One short formula
  await until(S(45));
  await play(...fbox(['tokens = 5', ['tasks  = 4', C.amber]]), ...say('ONE SHORT FORMULA', C.cyan));

  // Beat 46: tasks = tokens - 1
  await until(S(46));
  await play(...fbox([['tasks = tokens − 1', C.ink], ['      = 5 − 1 = 4', C.amber]]), ...say('TASKS = TOKENS − 1', C.cyan));

  // Beat 47: Packed block of 12 tokens -> 11 prediction tasks
  const PACK12 = ['Library', 'opens', 'at', 'nine', '<end>', 'Pool', 'closed', 'today', '<end>', 'Exams', 'start', '<end>'];
  const pCols = P ? 4 : 6;
  const pW = P ? 1.62 : 1.76, pH = P ? 0.8 : 0.62, pSX = P ? 1.76 : 1.94, pSY = P ? 1.05 : 0.94;
  const pTopY = P ? 1.0 : 0.88;
  const packCards = PACK12.map((w, i) => {
    const r = Math.floor(i / pCols), c = i % pCols;
    const x = (c - (pCols - 1) / 2) * pSX, y = pTopY - r * pSY;
    return makeCard(w, x, y, w === '<end>' ? ORANGE : C.cyan, pW, pH, P ? 17 : 17);
  });
  const packBadge = T('12 tokens  →  11 neighbour pairs', P ? 19 : 18, C.green, true);
  packBadge.moveTo([0, P ? -2.4 : -0.7, 0]);
  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(...countCards, ...taskLinks)),
    new M.LaggedStart(packCards.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.8 }),
    new M.FadeIn(packBadge),
    ...fbox([['tasks = tokens − 1', C.ink], ['      = 12 − 1 = 11', C.green]], C.green, P ? [0, -3.8, 0] : [0, -1.9, 0]),
    ...say('12 TOKENS → 11 PREDICTION TASKS', C.green));

  // ===========================================================================
  // ACT 7 (48-51): Seeing future token = cheating -> Causal masking
  // ===========================================================================
  const PK_Y = P ? -0.3 : 0.72;
  const pkCards = ['Library', 'opens', 'at', 'nine'].map((w, k) =>
    makeCard(w, (k - 1.5) * STEP, PK_Y, k === 3 ? C.pink : C.cyan));
  const predSlot = makeCard('predict: ?', (2 - 1.5) * STEP, P ? -2.6 : -1.0, C.amber, P ? 2.6 : 2.8, P ? 0.95 : 0.86, P ? 21 : 21);
  const peekArr = makeArrow([(3 - 1.5) * STEP, PK_Y - CH / 2 - 0.08], [(2 - 1.5) * STEP + 0.55, (P ? -2.6 : -1.0) + 0.52], C.pink, 3.0, 0.18);

  // Beat 48: Imagine network sees nine while predicting nine
  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(...packCards, packBadge)), ...clearBox(),
    new M.LaggedStart(pkCards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.1 }),
    new M.FadeIn(predSlot), new M.FadeIn(peekArr),
    ...say('WHAT IF IT CAN ALREADY SEE NINE?', C.pink));

  // Beat 49: Copy instead of learning
  const copyCard = makeCard('COPY: nine', (2 - 1.5) * STEP, P ? -2.6 : -1.0, C.pink, P ? 2.6 : 2.8, P ? 0.95 : 0.86, P ? 21 : 21);
  const copyTag = pill('COPIES — DOES NOT LEARN!', C.pink, P ? 19 : 18);
  copyTag.moveTo([0, P ? -4.2 : -2.2, 0]);
  const copyDot = new M.Dot({ point: [(2 - 1.5) * STEP, P ? -2.6 : -1.0, 0], radius: 0.01, color: C.pink });
  await until(S(49));
  await play(new M.FadeOut(predSlot), new M.FadeIn(copyCard), new M.FadeIn(copyTag),
    new M.Flash(copyDot, { color: C.pink }), ...say('COPIES INSTEAD OF PREDICTING', C.pink));

  // Beat 50: Hide future tokens -> 4x4 Causal Mask Grid
  const MS_TOK = ['Library', 'opens', 'at', 'nine'];
  const cs = P ? 1.0 : 0.78;
  const gCX = P ? 0.7 : 0.45, gCY = P ? -2.2 : -0.55;
  const cellPos = (r, c) => [gCX + (c - 1.5) * cs, gCY + (1.5 - r) * cs, 0];
  const maskVisible = [], maskBlocked = [], maskLabels = [];
  MS_TOK.forEach((w, i) => {
    const rl = T(w, P ? 17 : 16, C.cyan, true); rl.moveTo([gCX - 2 * cs - 0.18 - rl.getWidth() / 2, cellPos(i, 0)[1], 0]);
    const cl = T(w, P ? 15 : 15, C.muted, true); cl.moveTo([cellPos(0, i)[0], gCY + 2 * cs + 0.28, 0]);
    maskLabels.push(rl, cl);
  });
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const p = cellPos(r, c), hidden = c > r;
      const sq = new M.RoundedRectangle({ width: cs - 0.1, height: cs - 0.1, cornerRadius: 0.09, color: hidden ? C.pink : C.cyan, strokeWidth: 2 });
      sq.setFill(hidden ? C.pink : C.cyan, hidden ? 0.16 : 0.22); sq.moveTo(p);
      const sym = T(hidden ? '✕' : '✓', P ? 20 : 18, hidden ? C.pink : C.cyan, true, true); sym.moveTo(p);
      const cell = new M.VGroup(sq, sym);
      (hidden ? maskBlocked : maskVisible).push(cell);
    }
  }
  const leg = T('✓ can see     ✕ hidden future', P ? 18 : 17, C.muted, true);
  leg.moveTo([0, gCY - 2 * cs - 0.45, 0]);

  await until(S(50));
  await play(
    new M.FadeOut(new M.VGroup(...pkCards, copyCard, peekArr, copyTag)),
    new M.FadeIn(new M.VGroup(...maskLabels, leg)),
    new M.LaggedStart(maskVisible.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.0 }),
    new M.LaggedStart(maskBlocked.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.2 }),
    ...say('HIDE FUTURE TOKENS AT EVERY POSITION', C.pink));

  // Beat 51: Causal masking
  await until(S(51));
  await play(new M.LaggedStart(maskBlocked.map(c => new M.Indicate(c, { color: C.pink })), { lagRatio: 0.1, runTime: 1.3 }),
    ...say('CAUSAL MASKING', C.amber));

  // ===========================================================================
  // ACT 8 (52-54): What it is for & recap
  // ===========================================================================
  const RTOP = P ? -0.2 : 0.75, RBOT = P ? -1.9 : -0.35;
  const rIn = TOK5.slice(0, 4).map((w, k) => makeCard(w, (k - 1.5) * STEP, RTOP, C.cyan, CW, P ? 0.9 : 0.76, P ? 18 : 20));
  const rTg = TOK5.slice(1).map((w, k) => makeCard(w, (k - 1.5) * STEP, RBOT, k === 3 ? ORANGE : C.green, CW, P ? 0.9 : 0.76, P ? 18 : 20));
  const rArrs = [0, 1, 2, 3].map(k => makeArrow([(k - 1.5) * STEP, RTOP - (P ? 0.48 : 0.42)], [(k - 1.5) * STEP, RBOT + (P ? 0.48 : 0.42)], C.amber, 2.2, 0.13));

  // Beat 52: Teach from ordinary text without manually writing answers
  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(...maskLabels, leg, ...maskVisible, ...maskBlocked)),
    new M.LaggedStart(rIn.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.1 }),
    new M.LaggedStart(rTg.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.1 }),
    new M.FadeIn(new M.VGroup(...rArrs)),
    ...say('LEARN FROM ORDINARY TEXT AUTOMATICALLY', C.green));

  // Beat 53: Every new piece of text supplies more practice
  const extra1 = pill('Pool closed today <end>  →  3 tasks', C.cyan, P ? 18 : 17);
  extra1.moveTo([0, P ? -3.6 : -1.55, 0]);
  const extra2 = pill('Exams start <end>  →  2 tasks', C.violet, P ? 18 : 17);
  extra2.moveTo([0, P ? -4.6 : -2.32, 0]);
  await until(S(53));
  await play(new M.LaggedStart([new M.FadeIn(extra1), new M.FadeIn(extra2)], { lagRatio: 0.3, runTime: 1.5 }),
    ...say('EVERY TEXT = MORE PRACTICE', C.cyan));

  // Beat 54: Recap
  await until(S(54));
  await play(new M.LaggedStart(rTg.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.15, runTime: 1.8 }),
    ...say('PREDICT NEXT TOKEN FROM PAST TOKENS ONLY', C.amber));
}

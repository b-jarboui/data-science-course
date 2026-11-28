// 5.1.1 Bernoulli trials (live manim-web lesson).
// Beat i = sentence i (0-based, 42 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const ORANGE = '#fb923c';
  const CX = P ? 0 : -2.1;
  const PILL = P ? [0, 2.0, 0] : [0, 1.9, 0];
  const BOXP = P ? [0, 3.3, 0] : [4.35, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // 20 urgent indices out of 100 (natural clusters & gaps, not every 5th)
  const URG_IDX = new Set([2, 7, 11, 12, 18, 24, 30, 35, 39, 43, 47, 56, 61, 62, 68, 74, 80, 85, 89, 94]);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.38 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.325, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  // helpers built purely from proven primitives
  function makeArrow(a, b, color = C.muted, sw = 2.4, head = 0.16) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const tip = [b[0], b[1], 0];
    const h1 = [b[0] - ux * head + px * head * 0.58, b[1] - uy * head + py * head * 0.58, 0];
    const h2 = [b[0] - ux * head - px * head * 0.58, b[1] - uy * head - py * head * 0.58, 0];
    return new M.VGroup(
      new M.Line({ start: [a[0], a[1], 0], end: tip, color, strokeWidth: sw }),
      new M.Line({ start: h1, end: tip, color, strokeWidth: sw }),
      new M.Line({ start: h2, end: tip, color, strokeWidth: sw })
    );
  }

  function makePerson(x, y, color = C.ink) {
    const head = new M.Circle({ radius: 0.14, color }); head.setFill(color, 1); head.moveTo([x, y + 0.24, 0]);
    const body = new M.Arc({ radius: 0.24, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([x, y - 0.08, 0]);
    return new M.VGroup(head, body);
  }

  function makeCard(x, y, w, h, color, fillOp = 0.25, label = '', labelSize = 20, labelColor = color) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: Math.min(0.14, w * 0.22), color, strokeWidth: 2 });
    r.setFill(color, fillOp); r.moveTo([x, y, 0]);
    if (!label) {
      const l1 = new M.Line({ start: [x - w * 0.28, y + h * 0.14, 0], end: [x + w * 0.28, y + h * 0.14, 0], color, strokeWidth: 2 });
      const l2 = new M.Line({ start: [x - w * 0.28, y - h * 0.1, 0], end: [x + w * 0.12, y - h * 0.1, 0], color, strokeWidth: 2 });
      return new M.VGroup(r, l1, l2);
    }
    const tx = T(label, labelSize, labelColor, true, true); tx.moveTo([x, y, 0]);
    return new M.VGroup(r, tx);
  }

  function makeGridRect(idx, gx, gy, dx, dy, cw, ch, color, fillOp) {
    const r = Math.floor(idx / 10), c = idx % 10;
    const rect = new M.Rectangle({ width: cw, height: ch, color, strokeWidth: 1.4 });
    rect.setFill(color, fillOp);
    rect.moveTo([gx + (c - 4.5) * dx, gy + (4.5 - r) * dy, 0]);
    return rect;
  }

  function makeFulcrum(x, y, w, h, color) {
    const apex = [x, y, 0], bl = [x - w / 2, y - h, 0], br = [x + w / 2, y - h, 0];
    return new M.VGroup(
      new M.Line({ start: apex, end: bl, color, strokeWidth: 3 }),
      new M.Line({ start: apex, end: br, color, strokeWidth: 3 }),
      new M.Line({ start: bl, end: br, color, strokeWidth: 3 })
    );
  }

  // === 0-1: Support desk & messages called tickets ===========================
  const deskObjs = [];
  const custPos = P ? [[-2.1, 0.25], [0, 0.25], [2.1, 0.25]] : [[-4.3, 0.55], [-4.3, -0.55], [-4.3, -1.65]];
  const deskPos = P ? [0, -3.1, 0] : [2.8, -0.55, 0];
  const deskW = P ? 5.2 : 3.5, deskH = P ? 1.35 : 2.2;
  const custs = custPos.map(([x, y]) => makePerson(x, y));
  const deskRect = new M.RoundedRectangle({ width: deskW, height: deskH, cornerRadius: 0.2, color: C.cyan, strokeWidth: 2.5 });
  deskRect.setFill(C.card, 0.92); deskRect.moveTo(deskPos);
  const deskTxt = T('SUPPORT DESK', P ? 21 : 22, C.cyan, true, true); deskTxt.moveTo([deskPos[0], deskPos[1], 0]);
  const deskGrp = new M.VGroup(deskRect, deskTxt);
  const msgCards = [], msgArrows = [];
  custPos.forEach(([x, y], k) => {
    const a = P ? [x, y - 0.35] : [x + 0.55, y];
    const b = P ? [deskPos[0] + (k - 1) * 1.3, deskPos[1] + deskH / 2 + 0.16] : [deskPos[0] - deskW / 2 - 0.18, deskPos[1] + (1 - k) * 0.55];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    msgArrows.push(makeArrow(a, b, C.muted, 2));
    msgCards.push(makeCard(mid[0], mid[1], 0.72, 0.52, C.cyan, 0.25));
  });
  deskObjs.push(...custs, deskGrp, ...msgArrows, ...msgCards);

  await until(S(0));
  await play(
    new M.LaggedStart(custs.map(c => new M.FadeIn(c)), { lagRatio: 0.18, runTime: 0.9 }),
    new M.FadeIn(deskGrp, { runTime: 0.9 }),
    new M.LaggedStart(msgArrows.map(a => new M.FadeIn(a)), { lagRatio: 0.18, runTime: 1.1 }),
    new M.LaggedStart(msgCards.map(c => new M.FadeIn(c)), { lagRatio: 0.18, runTime: 1.2 }),
    ...say('SUPPORT DESK')
  );

  const ticketTag = pill('TICKET', C.amber, 16);
  ticketTag.moveTo(P ? [0, -1.7, 0] : [-1.05, 0.85, 0]);
  deskObjs.push(ticketTag);
  await until(S(1));
  await play(
    new M.LaggedStart(msgCards.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.12, runTime: 0.9 }),
    new M.FadeIn(ticketTag, { runTime: 0.7 }),
    ...say('EACH MESSAGE = A TICKET', C.amber)
  );

  // === 2-3: Urgent vs not urgent + next ticket "?" ===========================
  const sampleObjs = [];
  const sY = P ? -0.25 : -0.35;
  const sX = P ? [-2.6, -1.3, 0, 1.3, 2.6] : [-5.2, -3.7, -2.2, -0.7, 0.8];
  const sW = P ? 1.0 : 1.15, sH = P ? 1.25 : 1.45;
  const sampleCards = sX.map((x, k) => makeCard(x, sY, sW, sH, k === 0 ? ORANGE : C.cyan, k === 0 ? 0.35 : 0.2));
  const urgLbl = T('urgent', P ? 17 : 19, ORANGE, true, true); urgLbl.moveTo([sX[0], sY - sH / 2 - 0.38, 0]);
  const calmLbl = T('not urgent', P ? 17 : 19, C.cyan, true); calmLbl.moveTo([(sX[1] + sX[4]) / 2, sY - sH / 2 - 0.38, 0]);
  const calmBar = new M.Line({ start: [sX[1] - sW / 2, sY - sH / 2 - 0.14, 0], end: [sX[4] + sW / 2, sY - sH / 2 - 0.14, 0], color: C.cyan, strokeWidth: 2 });
  sampleObjs.push(...sampleCards, urgLbl, calmLbl, calmBar);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...deskObjs), { runTime: 0.55 }),
    new M.LaggedStart(sampleCards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.4 }),
    new M.FadeIn(urgLbl, { runTime: 0.9 }),
    new M.FadeIn(calmLbl, { runTime: 0.9 }),
    new M.Create(calmBar, { runTime: 0.9 }),
    ...say('SOME URGENT · MOST NOT URGENT', ORANGE)
  );

  const nextPos = P ? [0, -3.15, 0] : [4.1, -0.35, 0];
  const nextCard = makeCard(nextPos[0], nextPos[1], P ? 1.45 : 1.55, P ? 1.65 : 1.85, C.amber, 0.16, '?', 44, C.amber);
  const nextLbl = T('next ticket', P ? 18 : 20, C.amber, true); nextLbl.moveTo([nextPos[0], nextPos[1] - (P ? 1.15 : 1.25), 0]);
  const nextArr = P ? makeArrow([0, -1.45], [0, -2.15], C.amber) : makeArrow([1.75, -0.35], [3.05, -0.35], C.amber);
  sampleObjs.push(nextCard, nextLbl, nextArr);
  await until(S(3));
  await play(
    new M.FadeIn(nextArr, { runTime: 0.7 }),
    new M.FadeIn(nextCard, { runTime: 0.9 }),
    new M.FadeIn(nextLbl, { runTime: 0.9 }),
    ...say('HOW TO DESCRIBE THE NEXT TICKET?', C.amber)
  );

  // === 4-7: 100 tickets arrive, glow orange/blue, ~20 vs ~80, 1 in 5 =========
  const gx = P ? 0 : CX, gy = P ? -0.65 : -0.48;
  const gdx = P ? 0.66 : 0.62, gdy = P ? 0.41 : 0.37;
  const gcw = P ? 0.54 : 0.50, gch = P ? 0.29 : 0.26;
  const gridCards = Array.from({ length: 100 }, (_, i) => makeGridRect(i, gx, gy, gdx, gdy, gcw, gch, C.muted, 0.22));
  const countObjs = [];

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...sampleObjs), { runTime: 0.45 }),
    new M.LaggedStart(gridCards.map(c => new M.FadeIn(c)), { lagRatio: 0.015, runTime: 2.0 }),
    ...say('100 TICKETS ARRIVE')
  );

  await until(S(5));
  await play(
    new M.LaggedStart(gridCards.map((c, i) => {
      const urg = URG_IDX.has(i);
      return new M.Transform(c, makeGridRect(i, gx, gy, gdx, gdy, gcw, gch, urg ? ORANGE : C.cyan, urg ? 0.88 : 0.45));
    }), { lagRatio: 0.015, runTime: 2.0 }),
    ...say('ORANGE = URGENT · BLUE = NOT URGENT', ORANGE)
  );

  const bx0 = P ? -2.95 : 2.35, bMax = P ? 3.9 : 2.45;
  const by1 = P ? -3.65 : -1.75, by2 = P ? -4.4 : -2.35, bh = P ? 0.42 : 0.36;
  const barU = new M.Rectangle({ width: bMax * 0.2, height: bh, color: ORANGE, strokeWidth: 2 });
  barU.setFill(ORANGE, 0.85); barU.moveTo([bx0 + bMax * 0.1, by1, 0]);
  const barC = new M.Rectangle({ width: bMax * 0.8, height: bh, color: C.cyan, strokeWidth: 2 });
  barC.setFill(C.cyan, 0.55); barC.moveTo([bx0 + bMax * 0.4, by2, 0]);
  const lblU = T('~20 orange', P ? 18 : 17, ORANGE, true, true);
  lblU.moveTo([bx0 + bMax * 0.2 + 0.18 + lblU.getWidth() / 2, by1, 0]);
  const lblC = T('~80 blue', P ? 18 : 17, C.cyan, true, true);
  lblC.moveTo([bx0 + bMax * 0.8 + 0.18 + lblC.getWidth() / 2, by2, 0]);
  countObjs.push(barU, barC, lblU, lblC);

  await until(S(6));
  await play(
    new M.FadeIn(barU), new M.FadeIn(barC), new M.FadeIn(lblU), new M.FadeIn(lblC),
    ...say('~20 ORANGE  ·  ~80 BLUE', ORANGE)
  );

  await until(S(7));
  await play(
    new M.Indicate(barU, { color: C.amber }),
    ...fbox(['chance of urgent', '20 in 100', ['= 1 in 5', ORANGE]], ORANGE),
    ...say('CHANCE OF URGENT = 1 IN 5', ORANGE)
  );

  // === 8-12: One single ticket, trial, indicator (1 or 0) ====================
  const trialObjs = [];
  const onePos = P ? [0, 0.35, 0] : [-4.5, -0.45, 0];
  const oneCard = makeCard(onePos[0], onePos[1], P ? 1.35 : 1.45, P ? 1.5 : 1.75, C.amber, 0.18, '?', 42, C.amber);
  const outU = P ? [-1.85, -2.25, 0] : [-0.45, 0.35, 0];
  const outC = P ? [1.85, -2.25, 0] : [-0.45, -1.25, 0];
  const ow = P ? 2.6 : 2.55, oh = P ? 0.95 : 1.0;
  const cardU = makeCard(outU[0], outU[1], ow, oh, ORANGE, 0.3, 'urgent', 21, ORANGE);
  const cardC = makeCard(outC[0], outC[1], ow, oh, C.cyan, 0.22, 'not urgent', 21, C.cyan);
  const arrU = P ? makeArrow([-0.35, -0.5], [-1.45, -1.65], ORANGE) : makeArrow([-3.55, -0.1], [-1.9, 0.3], ORANGE);
  const arrC = P ? makeArrow([0.35, -0.5], [1.45, -1.65], C.cyan) : makeArrow([-3.55, -0.8], [-1.9, -1.2], C.cyan);
  trialObjs.push(oneCard, cardU, cardC, arrU, arrC);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(...gridCards, ...countObjs), { runTime: 0.55 }),
    ...clearBox(),
    new M.FadeIn(oneCard), new M.FadeIn(arrU), new M.FadeIn(arrC),
    new M.FadeIn(cardU), new M.FadeIn(cardC),
    ...say('ONE TICKET → 2 OUTCOMES')
  );

  const trialLbl = pill('1 TRIAL', C.green, 16);
  trialLbl.moveTo(P ? [0, -0.9, 0] : [-4.5, -1.75, 0]);
  trialObjs.push(trialLbl);
  await until(S(9));
  await play(
    new M.FadeIn(trialLbl),
    new M.LaggedStart([new M.Indicate(cardU, { color: ORANGE }), new M.Indicate(cardC, { color: C.cyan })], { lagRatio: 0.45, runTime: 1.8 }),
    ...say('TRIAL = ONE UNCERTAIN TRY', C.green)
  );

  const numArrU = P ? makeArrow([-1.85, -2.85], [-1.85, -3.75], C.amber) : makeArrow([1.05, 0.35], [2.45, 0.35], C.amber);
  const numArrC = P ? makeArrow([1.85, -2.85], [1.85, -3.75], C.amber) : makeArrow([1.05, -1.25], [2.45, -1.25], C.amber);
  trialObjs.push(numArrU, numArrC);
  await until(S(10));
  await play(
    new M.FadeIn(numArrU, { runTime: 0.8 }),
    new M.FadeIn(numArrC, { runTime: 0.8 }),
    ...say('TURN THE ANSWER INTO A NUMBER', C.amber)
  );

  const bU = P ? [-1.85, -4.45, 0] : [3.4, 0.35, 0];
  const bC = P ? [1.85, -4.45, 0] : [3.4, -1.25, 0];
  const badge1 = makeCard(bU[0], bU[1], 1.15, 1.05, ORANGE, 0.32, '1', 38, ORANGE);
  const badge0 = makeCard(bC[0], bC[1], 1.15, 1.05, C.cyan, 0.25, '0', 38, C.cyan);
  trialObjs.push(badge1, badge0);
  await until(S(11));
  await play(
    new M.FadeIn(badge1), new M.FadeIn(badge0),
    new M.Flash(badge1, { color: ORANGE }), new M.Flash(badge0, { color: C.cyan }),
    ...say('URGENT → 1  ·  NOT URGENT → 0', ORANGE)
  );

  await until(S(12));
  await play(
    new M.Indicate(badge1, { color: C.green }),
    new M.Indicate(badge0, { color: C.green }),
    ...say('INDICATOR = 1 FOR YES, 0 FOR NO', C.green)
  );

  // === 13-19: Single number 1/5, 4/5, whole 1, Bernoulli trial, letter p =====
  const barObjs = [];
  const barCX = P ? 0 : CX, barY = P ? -1.3 : -0.45;
  const segW = P ? 1.2 : 1.3, segH = P ? 1.1 : 1.15;
  const segX = k => barCX + (k - 2) * segW;
  const makeSeg = (k, color, op) => {
    const r = new M.Rectangle({ width: segW - 0.06, height: segH, color, strokeWidth: 2 });
    r.setFill(color, op); r.moveTo([segX(k), barY, 0]);
    return r;
  };
  const fifths = [0, 1, 2, 3, 4].map(k => makeSeg(k, C.muted, 0.12));
  const ptrArr = makeArrow([segX(0), barY + 1.35], [segX(0), barY + segH / 2 + 0.14], ORANGE);
  const ptrLbl = T('chance of 1', P ? 17 : 18, ORANGE, true, true);
  ptrLbl.moveTo([segX(0) + (P ? 0.45 : 0.35), barY + 1.62, 0]);
  barObjs.push(...fifths, ptrArr, ptrLbl);

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(...trialObjs), { runTime: 0.55 }),
    new M.LaggedStart(fifths.map(f => new M.FadeIn(f)), { lagRatio: 0.08, runTime: 0.9 }),
    new M.FadeIn(ptrArr), new M.FadeIn(ptrLbl),
    ...say('ONE NUMBER TELLS THE WHOLE STORY', ORANGE)
  );

  const l15 = T('1/5', P ? 22 : 22, C.bg, true, true); l15.moveTo([segX(0), barY, 0]);
  barObjs.push(l15);
  await until(S(14));
  await play(
    new M.Transform(fifths[0], makeSeg(0, ORANGE, 0.78), { runTime: 0.8 }),
    new M.FadeIn(l15, { runTime: 0.8 }),
    ...fbox([['chance of 1 = 1/5', ORANGE]], ORANGE),
    ...say('CHANCE OF 1 = 1/5', ORANGE)
  );

  const l45 = T('4/5', P ? 22 : 22, C.cyan, true, true); l45.moveTo([(segX(1) + segX(4)) / 2, barY, 0]);
  barObjs.push(l45);
  await until(S(15));
  await play(
    new M.LaggedStart([1, 2, 3, 4].map(k => new M.Transform(fifths[k], makeSeg(k, C.cyan, 0.42))), { lagRatio: 0.1, runTime: 1.1 }),
    new M.FadeIn(l45),
    ...fbox([['chance of 1 = 1/5', ORANGE], ['chance of 0 = 4/5', C.cyan]], C.cyan),
    ...say('CHANCE OF 0 = 4/5', C.cyan)
  );

  const wY = barY - segH / 2 - 0.35;
  const wL = segX(0) - segW / 2 + 0.03, wR = segX(4) + segW / 2 - 0.03;
  const wholeLine = new M.VGroup(
    new M.Line({ start: [wL, wY, 0], end: [wR, wY, 0], color: C.amber, strokeWidth: 2.5 }),
    new M.Line({ start: [wL, wY + 0.12, 0], end: [wL, wY - 0.12, 0], color: C.amber, strokeWidth: 2.5 }),
    new M.Line({ start: [wR, wY + 0.12, 0], end: [wR, wY - 0.12, 0], color: C.amber, strokeWidth: 2.5 })
  );
  const wholeLbl = T('1 whole', P ? 18 : 19, C.amber, true, true); wholeLbl.moveTo([barCX, wY - 0.34, 0]);
  barObjs.push(wholeLine, wholeLbl);
  await until(S(16));
  await play(
    new M.Create(wholeLine), new M.FadeIn(wholeLbl),
    ...fbox([['chance of 1 = 1/5', ORANGE], ['chance of 0 = 4/5', C.cyan], ['1/5 + 4/5   = 1', C.amber]], C.amber),
    ...say('1/5 + 4/5 = 1 WHOLE', C.amber)
  );

  const modelBox = new M.RoundedRectangle({ width: segW * 5 + 0.55, height: segH + 1.65, cornerRadius: 0.2, color: C.green, strokeWidth: 2 });
  modelBox.moveTo([barCX, barY - 0.32, 0]);
  const modelLbl = T('BERNOULLI TRIAL', P ? 20 : 21, C.green, true, true);
  modelLbl.moveTo([barCX, barY - segH / 2 - 1.45, 0]);
  barObjs.push(modelBox, modelLbl);
  await until(S(17));
  await play(
    new M.Create(modelBox), new M.FadeIn(modelLbl),
    ...say('BERNOULLI TRIAL', C.green)
  );

  const pBadge = pill('p', ORANGE, 22); pBadge.moveTo([segX(0), barY + 1.62, 0]);
  barObjs.push(pBadge);
  await until(S(18));
  await play(
    new M.FadeOut(ptrLbl), new M.FadeIn(pBadge),
    ...fbox([['p = chance of yes', ORANGE], ['(p for probability)', C.muted]], ORANGE),
    ...say('p = PROBABILITY (CHANCE) OF YES', ORANGE)
  );

  await until(S(19));
  await play(
    new M.Indicate(pBadge, { color: C.amber, runTime: 0.8 }),
    ...fbox([['p = 1/5', ORANGE]], ORANGE),
    ...say('p = 1/5', ORANGE)
  );

  // === 20-24: Expected value (long-run mean) of the indicator ================
  const evObjs = [];
  const evY = P ? -2.35 : -1.55;
  const evL = P ? -2.6 : -5.1, evR = P ? 2.6 : 0.9;
  const evX = u => evL + u * (evR - evL);
  const evLine = new M.Line({ start: [evL - 0.35, evY, 0], end: [evR + 0.35, evY, 0], color: C.muted, strokeWidth: 3 });
  const evTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((u, idx) => {
    const lbls = ['0', '', '', '', '', '1'];
    const tk = new M.Line({ start: [evX(u), evY - 0.08, 0], end: [evX(u), evY + 0.08, 0], color: C.muted, strokeWidth: 2 });
    if (!lbls[idx]) return tk;
    const tx = T(lbls[idx], 18, idx === 0 ? C.cyan : idx === 5 ? ORANGE : C.amber, true, true);
    tx.moveTo([evX(u), evY - 0.36, 0]);
    return new M.VGroup(tk, tx);
  });
  const barHMax = P ? 3.2 : 2.75;
  const h0 = barHMax * 0.8, h1 = barHMax * 0.2, bwEV = 0.88;
  const evBar0 = new M.Rectangle({ width: bwEV, height: h0, color: C.cyan, strokeWidth: 2 });
  evBar0.setFill(C.cyan, 0.48); evBar0.moveTo([evX(0), evY + h0 / 2, 0]);
  const evBar1 = new M.Rectangle({ width: bwEV, height: h1, color: ORANGE, strokeWidth: 2 });
  evBar1.setFill(ORANGE, 0.82); evBar1.moveTo([evX(1), evY + h1 / 2, 0]);
  const evLab0 = T('4/5', 19, C.cyan, true, true); evLab0.moveTo([evX(0), evY + h0 + 0.28, 0]);
  const evLab1 = T('1/5', 19, ORANGE, true, true); evLab1.moveTo([evX(1), evY + h1 + 0.28, 0]);
  evObjs.push(evLine, ...evTicks, evBar0, evBar1, evLab0, evLab1);

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(...barObjs), { runTime: 0.55 }),
    new M.Create(evLine), new M.FadeIn(new M.VGroup(...evTicks)),
    new M.FadeIn(evBar0), new M.FadeIn(evBar1), new M.FadeIn(evLab0), new M.FadeIn(evLab1),
    ...fbox([['expected value', C.amber], ['value × chance', C.muted]], C.amber),
    ...say('EXPECTED VALUE = LONG-RUN MEAN', C.amber)
  );

  await until(S(21));
  await play(
    new M.Indicate(evBar0, { color: C.cyan }),
    ...fbox([['0 × 4/5 = 0', C.cyan]], C.cyan),
    ...say('0 × 4/5 = 0', C.cyan)
  );

  await until(S(22));
  await play(
    new M.Indicate(evBar1, { color: ORANGE }),
    ...fbox([['0 × 4/5 = 0', C.cyan], ['1 × 1/5 = 1/5', ORANGE]], ORANGE),
    ...say('1 × 1/5 = 1/5', ORANGE)
  );

  const fulc = makeFulcrum(evX(0.2), evY - 0.04, 0.55, 0.52, C.amber);
  const fulcDash = new M.DashedLine({ start: [evX(0.2), evY, 0], end: [evX(0.2), evY + barHMax * 0.65, 0], color: C.amber });
  const fulcTag = pill('mean = 1/5', C.amber, 16); fulcTag.moveTo([evX(0.2) + 0.45, evY - 1.05, 0]);
  evObjs.push(fulc, fulcDash, fulcTag);
  await until(S(23));
  await play(
    new M.Create(fulc), new M.Create(fulcDash), new M.FadeIn(fulcTag),
    ...fbox([['0 × 4/5 = 0', C.cyan], ['1 × 1/5 = 1/5', ORANGE], ['sum     = 1/5', C.amber]], C.amber),
    ...say('EXPECTED VALUE = 1/5', C.amber)
  );

  const pMeanTag = pill('= p', ORANGE, 17); pMeanTag.moveTo([evX(0.2) + 0.45, evY - 1.65, 0]);
  evObjs.push(pMeanTag);
  await until(S(24));
  await play(
    new M.Indicate(fulc, { color: C.amber }), new M.FadeIn(pMeanTag),
    ...fbox([['mean of indicator', C.ink], ['= p', C.amber], ['= 1/5', ORANGE]], C.amber),
    ...say('MEAN OF AN INDICATOR = p', C.amber)
  );

  // === 25-26: Over many tickets, average of 0s and 1s = share of urgent ======
  const g2Cards = Array.from({ length: 100 }, (_, i) => {
    const urg = URG_IDX.has(i);
    return makeGridRect(i, gx, gy, gdx, gdy, gcw, gch, urg ? ORANGE : C.cyan, urg ? 0.88 : 0.42);
  });
  const legY = P ? -3.45 : -2.68;
  const leg1 = pill('20 ONES (URGENT)', ORANGE, 15); leg1.moveTo([gx - (P ? 1.65 : 1.75), legY, 0]);
  const leg0 = pill('80 ZEROS (NOT)', C.cyan, 15); leg0.moveTo([gx + (P ? 1.65 : 1.75), legY, 0]);
  const g2Legend = [leg1, leg0];

  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(...evObjs), { runTime: 0.55 }),
    new M.LaggedStart(g2Cards.map(c => new M.FadeIn(c)), { lagRatio: 0.01, runTime: 1.5 }),
    new M.FadeIn(leg1), new M.FadeIn(leg0),
    ...fbox([['average of 0s and 1s', C.ink], ['= share of urgent', C.amber]], C.amber),
    ...say('AVERAGE OF 0s & 1s = SHARE OF URGENT', C.amber)
  );

  const urgCards2 = g2Cards.filter((_, i) => URG_IDX.has(i));
  await until(S(26));
  await play(
    new M.LaggedStart(urgCards2.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.04, runTime: 1.6 }),
    ...fbox([['20 ones ÷ 100 cards', ORANGE], ['= 20 / 100', C.ink], ['= 1/5', C.amber]], C.amber),
    ...say('20 ÷ 100 = 1/5', C.amber)
  );

  // === 27-30: Variance = p(1 - p) = 4/25 = 0.16; peak at 1/2, 0 when certain =
  const spObjs = [];
  const spY = P ? -1.4 : -0.65;
  const spL = P ? -2.6 : -5.1, spR = P ? 2.6 : 0.9;
  const spX = u => spL + u * (spR - spL);
  const spLine = new M.Line({ start: [spL - 0.3, spY, 0], end: [spR + 0.3, spY, 0], color: C.muted, strokeWidth: 3 });
  const d0 = new M.Dot({ point: [spX(0), spY, 0], radius: 0.15, color: C.cyan });
  const dm = new M.Dot({ point: [spX(0.2), spY, 0], radius: 0.15, color: C.amber });
  const d1 = new M.Dot({ point: [spX(1), spY, 0], radius: 0.15, color: ORANGE });
  const t0 = T('0', 20, C.cyan, true, true); t0.moveTo([spX(0), spY - 0.45, 0]);
  const tm = T('mean 1/5', 17, C.amber, true, true); tm.moveTo([spX(0.2), spY - 0.45, 0]);
  const t1 = T('1', 20, ORANGE, true, true); t1.moveTo([spX(1), spY - 0.45, 0]);
  const spArrL = makeArrow([spX(0.2) - 0.18, spY + 0.55], [spX(0) + 0.1, spY + 0.55], C.violet, 2.8);
  const spArrR = makeArrow([spX(0.2) + 0.18, spY + 0.55], [spX(1) - 0.1, spY + 0.55], C.violet, 2.8);
  const spTag = T('spread around the mean', P ? 17 : 18, C.violet, true); spTag.moveTo([(spL + spR) / 2, spY + 1.05, 0]);
  spObjs.push(spLine, d0, dm, d1, t0, tm, t1, spArrL, spArrR, spTag);

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(...g2Cards, ...g2Legend), { runTime: 0.55 }),
    new M.Create(spLine), new M.FadeIn(d0), new M.FadeIn(dm), new M.FadeIn(d1),
    new M.FadeIn(t0), new M.FadeIn(tm), new M.FadeIn(t1),
    new M.FadeIn(spArrL), new M.FadeIn(spArrR), new M.FadeIn(spTag),
    ...fbox([['variance', C.violet], ['spread around mean', C.muted]], C.violet),
    ...say('VARIANCE = SPREAD AROUND THE MEAN', C.violet)
  );

  const pSegLbl = T('p', 20, ORANGE, true, true); pSegLbl.moveTo([(spX(0) + spX(0.2)) / 2, spY + 0.25, 0]);
  const qSegLbl = T('1 − p', 20, C.cyan, true, true); qSegLbl.moveTo([(spX(0.2) + spX(1)) / 2, spY + 0.25, 0]);
  spObjs.push(pSegLbl, qSegLbl);
  await until(S(28));
  await play(
    new M.FadeIn(pSegLbl), new M.FadeIn(qSegLbl),
    ...fbox([['variance', C.violet], ['= p × (1 − p)', C.amber]], C.violet),
    ...say('VARIANCE = p × (1 − p)', C.violet)
  );

  // 29: 5x5 grid showing 1/5 x 4/5 = 4/25 = 0.16
  const areaObjs = [];
  const acx = P ? 0 : CX, acy = P ? -1.45 : -0.45, acs = P ? 0.66 : 0.56;
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const hit = c === 0 && r < 4;
      const sq = new M.Rectangle({ width: acs - 0.06, height: acs - 0.06, color: hit ? C.violet : C.line, strokeWidth: hit ? 2.2 : 1.5 });
      sq.setFill(hit ? C.violet : C.card, hit ? 0.78 : 0.6);
      sq.moveTo([acx + (c - 2) * acs, acy + (r - 2) * acs, 0]);
      cells.push(sq);
    }
  }
  const aLeft = acx - 2.5 * acs, aBot = acy - 2.5 * acs;
  const lblP = T('p = 1/5', P ? 17 : 18, ORANGE, true, true); lblP.moveTo([acx - 2 * acs, aBot - 0.38, 0]);
  const lblQ = T('1−p = 4/5', P ? 17 : 18, C.cyan, true, true); lblQ.moveTo([aLeft - (P ? 0.95 : 1.05), acy - 0.5 * acs, 0]);
  const lblA = pill('4 / 25 = 0.16', C.violet, 16); lblA.moveTo([acx + 0.55 * acs, acy + 2.5 * acs + 0.45, 0]);
  areaObjs.push(...cells, lblP, lblQ, lblA);

  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(...spObjs), { runTime: 0.55 }),
    new M.LaggedStart(cells.map(sq => new M.FadeIn(sq)), { lagRatio: 0.02, runTime: 1.1 }),
    new M.FadeIn(lblP), new M.FadeIn(lblQ), new M.FadeIn(lblA),
    ...fbox([['variance = p × (1 − p)', C.violet], ['         = 1/5 × 4/5', C.ink], ['         = 4/25 = 0.16', C.amber]], C.violet),
    ...say('1/5 × 4/5 = 4/25 = 0.16', C.violet)
  );

  // 30: Spread largest at p=1/2 (0.25), zero at p=0 and p=1
  const vbarObjs = [];
  const vbBase = P ? -3.3 : -1.85, vbMax = P ? 2.8 : 2.25;
  const vbPs = [0, 0.2, 0.5, 0.8, 1];
  const vbVs = [0, 0.16, 0.25, 0.16, 0];
  const vbSp = P ? 1.25 : 1.3;
  const vbLine = new M.Line({ start: [acx - 2.6 * vbSp, vbBase, 0], end: [acx + 2.6 * vbSp, vbBase, 0], color: C.muted, strokeWidth: 2.5 });
  vbarObjs.push(vbLine);
  let peakBar = null;
  vbPs.forEach((pv, k) => {
    const x = acx + (k - 2) * vbSp, h = (vbVs[k] / 0.25) * vbMax;
    const col = k === 2 ? C.amber : (k === 0 || k === 4) ? C.muted : C.violet;
    const pl = T('p = ' + String(pv), P ? 17 : 18, col, true, k === 2);
    pl.moveTo([x, vbBase - 0.38, 0]); vbarObjs.push(pl);
    if (h > 0.05) {
      const bar = new M.Rectangle({ width: 0.66, height: h, color: col, strokeWidth: 2 });
      bar.setFill(col, k === 2 ? 0.82 : 0.55); bar.moveTo([x, vbBase + h / 2, 0]);
      const vl = T(vbVs[k].toFixed(2), 19, col, true, k === 2); vl.moveTo([x, vbBase + h + 0.3, 0]);
      vbarObjs.push(bar, vl);
      if (k === 2) peakBar = bar;
    } else {
      const dt = new M.Dot({ point: [x, vbBase, 0], radius: 0.11, color: C.muted });
      const vl = T('0', 19, C.muted, true); vl.moveTo([x, vbBase + 0.34, 0]);
      vbarObjs.push(dt, vl);
    }
  });
  const peakLbl = T('largest', 17, C.amber, true, true); peakLbl.moveTo([acx, vbBase + vbMax + 0.65, 0]);
  vbarObjs.push(peakLbl);

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(...areaObjs), { runTime: 0.55 }),
    new M.Create(vbLine),
    new M.LaggedStart(vbarObjs.slice(1).map(o => new M.FadeIn(o)), { lagRatio: 0.05, runTime: 1.2 }),
    ...fbox([['p = 0 or 1 → var = 0', C.muted], ['p = 1/2    → var = 0.25', C.amber], ['  (largest spread)', C.violet]], C.violet),
    ...say('LARGEST AT 50/50 · ZERO WHEN CERTAIN', C.violet)
  );

  // === 31-32: Short version in one line (U, P(U=1)=p, P(U=0)=1-p) ============
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(...vbarObjs), { runTime: 0.6 }),
    ...clearBox(),
    ...say('THE SHORT VERSION', C.cyan)
  );

  const shortObjs = [];
  const tUpos = P ? [-1.8, -1.35, 0] : [-4.05, -0.45, 0];
  const tCpos = P ? [1.8, -1.35, 0] : [-0.25, -0.45, 0];
  const tw = P ? 3.25 : 3.3, th = P ? 2.3 : 2.4;
  function makeShortTile(pos, color, title, sub, prob) {
    const r = new M.RoundedRectangle({ width: tw, height: th, cornerRadius: 0.2, color, strokeWidth: 2.5 });
    r.setFill(color, 0.16); r.moveTo(pos);
    const t1 = T(title, 30, color, true, true); t1.moveTo([pos[0], pos[1] + 0.55, 0]);
    const t2 = T(sub, 18, C.ink, false); t2.moveTo([pos[0], pos[1] - 0.05, 0]);
    const t3 = T(prob, 18, color, true, true); t3.moveTo([pos[0], pos[1] - 0.65, 0]);
    return new M.VGroup(r, t1, t2, t3);
  }
  const tileU = makeShortTile(tUpos, ORANGE, 'U = 1', 'urgent', 'P(U = 1) = p');
  const tileC = makeShortTile(tCpos, C.cyan, 'U = 0', 'not urgent', 'P(U = 0) = 1 − p');
  shortObjs.push(tileU, tileC);

  await until(S(32));
  await play(
    new M.FadeIn(tileU), new M.FadeIn(tileC),
    ...fbox([['U = indicator (1 or 0)', C.ink], ['P(U = 1) = p', ORANGE], ['P(U = 0) = 1 − p', C.cyan]], C.cyan),
    ...say('P(U = 1) = p  ·  P(U = 0) = 1 − p', C.cyan)
  );

  // === 33-35: What it is for & building block ================================
  const useObjs = [];
  const ynY = P ? 0.65 : 0.85;
  const ynL = pill('YES → 1', ORANGE, 18); ynL.moveTo([-1.55, ynY, 0]);
  const ynR = pill('NO → 0', C.cyan, 18); ynR.moveTo([1.55, ynY, 0]);
  useObjs.push(ynL, ynR);

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(...shortObjs), { runTime: 0.55 }),
    ...clearBox(),
    new M.FadeIn(ynL), new M.FadeIn(ynR),
    ...say('EVERY YES-OR-NO QUESTION', C.green)
  );

  const exData = [
    ['Customer', 'buys (1)', 'does not (0)'],
    ['Factory part', 'faulty (1)', 'good (0)'],
    ['Patient', 'recovers (1)', 'does not (0)']
  ];
  const exCards = exData.map(([head, yes, no], k) => {
    const pos = P ? [0, -0.75 - k * 1.65, 0] : [(k - 1) * 4.2, -0.75, 0];
    const cw = P ? 6.5 : 3.7, ch = P ? 1.35 : 2.3;
    const r = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.18, color: C.green, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo(pos);
    const thd = T(head, P ? 21 : 22, C.ink, false, true);
    const ty = T(yes, 21, ORANGE, true, true);
    const tn = T(no, 21, C.cyan, true);
    if (P) {
      thd.moveTo([pos[0], pos[1] + 0.3, 0]);
      ty.moveTo([pos[0] - 1.55, pos[1] - 0.25, 0]);
      tn.moveTo([pos[0] + 1.55, pos[1] - 0.25, 0]);
    } else {
      thd.moveTo([pos[0], pos[1] + 0.65, 0]);
      ty.moveTo([pos[0], pos[1] - 0.05, 0]);
      tn.moveTo([pos[0], pos[1] - 0.65, 0]);
    }
    return new M.VGroup(r, thd, ty, tn);
  });
  useObjs.push(...exCards);

  await until(S(34));
  await play(
    new M.LaggedStart(exCards.map(c => new M.FadeIn(c)), { lagRatio: 0.45, runTime: 3.4 }),
    ...say('ONE MODEL, MANY QUESTIONS', C.green)
  );

  const buildObjs = [];
  const b1Pos = P ? [0, 0.1, 0] : [-4.0, -0.5, 0];
  const b1 = makeCard(b1Pos[0], b1Pos[1], 1.25, 1.35, ORANGE, 0.3, '1', 34, ORANGE);
  const b1Lbl = T('1 trial', 18, ORANGE, true); b1Lbl.moveTo([b1Pos[0], b1Pos[1] - 1.0, 0]);
  const bArr = P ? makeArrow([0, -1.25], [0, -2.15], C.cyan, 2.8) : makeArrow([-2.7, -0.5], [-1.3, -0.5], C.cyan, 2.8);
  const manyY = P ? -3.1 : -0.5;
  const manyCols = [ORANGE, C.cyan, C.cyan, ORANGE, C.cyan];
  const manyBlocks = manyCols.map((col, k) => {
    const x = P ? (k - 2) * 1.15 : 0.2 + k * 1.15;
    return makeCard(x, manyY, 0.92, 1.15, col, col === ORANGE ? 0.35 : 0.22, col === ORANGE ? '1' : '0', 26, col);
  });
  const manyLbl = T('count many trials together', P ? 18 : 19, C.cyan, true);
  manyLbl.moveTo([P ? 0 : 2.5, manyY - 1.0, 0]);
  buildObjs.push(b1, b1Lbl, bArr, ...manyBlocks, manyLbl);

  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(...useObjs), { runTime: 0.55 }),
    new M.FadeIn(b1), new M.FadeIn(b1Lbl), new M.FadeIn(bArr),
    new M.LaggedStart(manyBlocks.map(b => new M.FadeIn(b)), { lagRatio: 0.12, runTime: 1.4 }),
    new M.FadeIn(manyLbl),
    ...say('BUILDING BLOCK FOR MANY TRIALS', C.cyan)
  );

  // === 36-39: Common trap: chance != schedule, streaks, long-run settling ====
  const trapObjs = [];
  const trapHead = T('1 in 5 is a chance, not a schedule', P ? 20 : 24, C.pink, false, true);
  trapHead.moveTo([0, P ? 0.75 : 0.95, 0]);
  trapObjs.push(trapHead);

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...buildObjs), { runTime: 0.55 }),
    new M.FadeIn(trapHead),
    ...say('TRAP: CHANCE ≠ SCHEDULE', C.pink)
  );

  const schY = P ? -0.45 : -0.1, schSp = P ? 0.46 : 0.72, schW = P ? 0.36 : 0.56, schH = P ? 0.58 : 0.78;
  const schCards = Array.from({ length: 15 }, (_, k) => {
    const urg = (k + 1) % 5 === 0;
    const r = new M.Rectangle({ width: schW, height: schH, color: urg ? ORANGE : C.cyan, strokeWidth: 1.8 });
    r.setFill(urg ? ORANGE : C.cyan, urg ? 0.85 : 0.38);
    r.moveTo([(k - 7) * schSp, schY, 0]);
    return r;
  });
  const strike = new M.Line({ start: [-7.5 * schSp, schY - 0.38, 0], end: [7.5 * schSp, schY + 0.38, 0], color: C.pink, strokeWidth: 4 });
  const schLbl = T('✗  not every 5th ticket', P ? 17 : 19, C.pink, true, true); schLbl.moveTo([0, schY - 0.72, 0]);
  trapObjs.push(...schCards, strike, schLbl);

  await until(S(37));
  await play(
    new M.LaggedStart(schCards.map(c => new M.FadeIn(c)), { lagRatio: 0.04, runTime: 1.0 }),
    new M.Create(strike), new M.FadeIn(schLbl),
    ...say('NOT EVERY 5TH TICKET', C.pink)
  );

  const stY = P ? -2.65 : -1.85;
  const stCards = Array.from({ length: 13 }, (_, k) => {
    const urg = k < 3;
    const r = new M.Rectangle({ width: schW, height: schH, color: urg ? ORANGE : C.cyan, strokeWidth: 1.8 });
    r.setFill(urg ? ORANGE : C.cyan, urg ? 0.88 : 0.38);
    r.moveTo([(k - 6) * schSp, stY, 0]);
    return r;
  });
  const stLblU = T('3 urgent', P ? 16 : 18, ORANGE, true, true); stLblU.moveTo([-5 * schSp, stY - 0.72, 0]);
  const stLblC = T('then 10 calm', P ? 16 : 18, C.cyan, true, true); stLblC.moveTo([1.5 * schSp, stY - 0.72, 0]);
  trapObjs.push(...stCards, stLblU, stLblC);

  await until(S(38));
  await play(
    new M.LaggedStart(stCards.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.5 }),
    new M.FadeIn(stLblU), new M.FadeIn(stLblC),
    ...say('STREAKS & GAPS HAPPEN NATURALLY', ORANGE)
  );

  // 39: Running share settling near 1/5 over 100 tickets
  const runObjs = [];
  const rx0 = P ? -2.9 : -4.8, rx1 = P ? 3.1 : 4.8;
  const ry0 = P ? -3.4 : -2.15, ry1 = P ? 0.6 : 0.85;
  const rx = n => rx0 + (n / 100) * (rx1 - rx0);
  const ry = v => ry0 + (v / 0.5) * (ry1 - ry0);
  const axX = new M.Line({ start: [rx0, ry0, 0], end: [rx1, ry0, 0], color: C.muted, strokeWidth: 2.5 });
  const axY = new M.Line({ start: [rx0, ry0, 0], end: [rx0, ry1, 0], color: C.muted, strokeWidth: 2.5 });
  const axLabX = T('tickets arrived (1 → 100)', P ? 16 : 18, C.muted, true); axLabX.moveTo([(rx0 + rx1) / 2, ry0 - 0.45, 0]);
  const axLabY = T('share', P ? 15 : 17, C.muted, true); axLabY.moveTo([rx0 - 0.1, ry1 + 0.3, 0]);
  const dash15 = new M.DashedLine({ start: [rx0, ry(0.2), 0], end: [rx1, ry(0.2), 0], color: C.amber });
  const tag15 = pill('1/5 = 0.20', C.amber, 15); tag15.moveTo([rx1 - 0.95, ry(0.2) + 0.42, 0]);
  const pts = [
    [1, 0], [3, 0.33], [5, 0.4], [8, 0.25], [12, 0.17], [16, 0.25], [20, 0.2],
    [25, 0.16], [32, 0.22], [40, 0.18], [50, 0.22], [62, 0.19], [75, 0.21], [88, 0.2], [100, 0.2]
  ];
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    segs.push(new M.Line({
      start: [rx(pts[i][0]), ry(pts[i][1]), 0],
      end: [rx(pts[i + 1][0]), ry(pts[i + 1][1]), 0],
      color: ORANGE, strokeWidth: 3.5
    }));
  }
  const endDot = new M.Dot({ point: [rx(100), ry(0.2), 0], radius: 0.12, color: C.amber });
  runObjs.push(axX, axY, axLabX, axLabY, dash15, tag15, ...segs, endDot);

  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(...trapObjs), { runTime: 0.5 }),
    new M.Create(axX), new M.Create(axY), new M.FadeIn(axLabX), new M.FadeIn(axLabY),
    new M.Create(dash15), new M.FadeIn(tag15),
    new M.LaggedStart(segs.map(sg => new M.Create(sg)), { lagRatio: 0.12, runTime: 1.8 }),
    new M.FadeIn(endDot),
    ...say('OVER MANY TICKETS → SETTLES NEAR 1/5', C.amber)
  );

  // === 40-41: Preview of 5.1.2 & one-sentence recap ==========================
  const next5Objs = [];
  const n5Cols = [ORANGE, C.cyan, ORANGE, C.cyan, C.cyan];
  const n5Sp = P ? 1.35 : 1.7, n5Y = P ? -1.1 : -0.35;
  const n5Cards = n5Cols.map((col, k) => makeCard((k - 2) * n5Sp, n5Y, P ? 1.05 : 1.25, P ? 1.35 : 1.6, col, col === ORANGE ? 0.35 : 0.22, col === ORANGE ? '1' : '0', 30, col));
  const n5Lbl = T('5 tickets at once → count the urgent ones', P ? 18 : 22, C.ink, false, true);
  n5Lbl.moveTo([0, n5Y - 1.35, 0]);
  next5Objs.push(...n5Cards, n5Lbl);

  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(...runObjs), { runTime: 0.55 }),
    new M.LaggedStart(n5Cards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.3 }),
    new M.FadeIn(n5Lbl),
    ...say('NEXT: COUNT URGENT IN 5 TICKETS')
  );

  const recY = P ? -1.4 : -0.45;
  const recCard = makeCard(P ? 0 : -4.4, P ? 0.2 : recY, P ? 1.3 : 1.4, P ? 1.4 : 1.65, C.green, 0.18, '?', 40, C.green);
  const recA1 = P ? makeArrow([-0.3, -0.6], [-1.4, -1.65], ORANGE) : makeArrow([-3.5, -0.1], [-1.95, 0.3], ORANGE);
  const recA0 = P ? makeArrow([0.3, -0.6], [1.4, -1.65], C.cyan) : makeArrow([-3.5, -0.8], [-1.95, -1.2], C.cyan);
  const rec1 = makeCard(P ? -1.8 : -0.45, P ? -2.35 : 0.35, 2.5, 1.0, ORANGE, 0.28, '1  (p)', 22, ORANGE);
  const rec0 = makeCard(P ? 1.8 : -0.45, P ? -2.35 : -1.25, 2.5, 1.0, C.cyan, 0.22, '0  (1 − p)', 22, C.cyan);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(...next5Objs), { runTime: 0.55 }),
    new M.FadeIn(recCard), new M.FadeIn(recA1), new M.FadeIn(recA0),
    new M.FadeIn(rec1), new M.FadeIn(rec0),
    ...fbox([
      ['Bernoulli trial', C.green],
      ['P(U = 1) = p', ORANGE],
      ['mean = p', C.amber],
      ['var  = p(1 − p)', C.violet]
    ], C.green),
    ...say('ONE YES/NO TRY · DESCRIBED BY p', C.green)
  );
}

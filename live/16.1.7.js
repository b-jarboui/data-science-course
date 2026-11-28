// 16.1.7 Fairness criteria: do urgent homes have an equal chance of being selected?
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const HOMES = [
    { id: 'A', dist: 'North', col: C.cyan,   risk: 90, list: true,  urgent: true  },
    { id: 'B', dist: 'North', col: C.cyan,   risk: 10, list: false, urgent: false },
    { id: 'C', dist: 'South', col: C.violet, risk: 50, list: true,  urgent: true  },
    { id: 'D', dist: 'South', col: C.violet, risk: 30, list: false, urgent: true  },
  ];

  const PILL = P ? [0, 3.85, 0] : [0, 1.98, 0];
  const BOXP = P ? [0, -3.55, 0] : [4.25, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // Formula box: one at a time, auto-scales to stay inside its lane.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.42;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.96); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.21 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.65 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.5 })];
  }

  // Reusable primitive builders (all parts placed with moveTo before grouping)
  function badge(text, color, cx, cy, w, h, size = P ? 14 : 15, fillOp = 0.16) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: h / 2, color, strokeWidth: 2 });
    r.setFill(color, fillOp); r.moveTo([cx, cy, 0]);
    const t = T(text, size, color, true, true); t.moveTo([cx, cy, 0]);
    return new M.VGroup(r, t);
  }

  function house(cx, cy, color, sc = 1) {
    const bw = 0.42 * sc, bh = 0.32 * sc, rw = 0.28 * sc, rh = 0.24 * sc;
    const body = new M.Rectangle({ width: bw, height: bh, color, strokeWidth: 2.2 });
    body.setFill(color, 0.2); body.moveTo([cx, cy - bh * 0.22, 0]);
    const topY = cy - bh * 0.22 + bh / 2;
    const r1 = new M.Line({ start: [cx - rw, topY, 0], end: [cx, topY + rh, 0], color, strokeWidth: 2.6 });
    const r2 = new M.Line({ start: [cx, topY + rh, 0], end: [cx + rw, topY, 0], color, strokeWidth: 2.6 });
    return new M.VGroup(body, r1, r2);
  }

  function greenCheck(cx, cy, r = P ? 0.22 : 0.21) {
    const circ = new M.Circle({ radius: r, color: C.green, strokeWidth: 2.4 });
    circ.setFill(C.green, 0.94); circ.moveTo([cx, cy, 0]);
    const l1 = new M.Line({ start: [cx - r * 0.42, cy - r * 0.02, 0], end: [cx - r * 0.08, cy - r * 0.36, 0], color: C.bg, strokeWidth: 3.4 });
    const l2 = new M.Line({ start: [cx - r * 0.08, cy - r * 0.36, 0], end: [cx + r * 0.46, cy + r * 0.34, 0], color: C.bg, strokeWidth: 3.4 });
    return new M.VGroup(circ, l1, l2);
  }

  function noMark(cx, cy, r = P ? 0.22 : 0.21) {
    const circ = new M.Circle({ radius: r, color: C.pink, strokeWidth: 2 });
    circ.setFill(C.pink, 0.1); circ.moveTo([cx, cy, 0]);
    const bar = new M.Line({ start: [cx - r * 0.42, cy, 0], end: [cx + r * 0.42, cy, 0], color: C.pink, strokeWidth: 3 });
    return new M.VGroup(circ, bar);
  }

  function openBasket(cx, cy, w, h, color, labelText) {
    const bg = new M.Rectangle({ width: w, height: h, color, strokeWidth: 0 });
    bg.setFill(color, 0.06); bg.setStrokeOpacity(0); bg.moveTo([cx, cy, -0.01]);
    const xL = cx - w / 2, xR = cx + w / 2, yT = cy + h / 2, yB = cy - h / 2;
    const left = new M.Line({ start: [xL, yT, 0], end: [xL, yB, 0], color, strokeWidth: 3.4 });
    const bot  = new M.Line({ start: [xL, yB, 0], end: [xR, yB, 0], color, strokeWidth: 3.4 });
    const right = new M.Line({ start: [xR, yB, 0], end: [xR, yT, 0], color, strokeWidth: 3.4 });
    const lipL = new M.Line({ start: [xL - 0.14, yT, 0], end: [xL, yT, 0], color, strokeWidth: 3.4 });
    const lipR = new M.Line({ start: [xR, yT, 0], end: [xR + 0.14, yT, 0], color, strokeWidth: 3.4 });
    const lab = T(labelText, P ? 16 : 17, color, false, true);
    lab.moveTo([cx, yB - 0.34, 0]);
    return new M.VGroup(bg, left, bot, right, lipL, lipR, lab);
  }

  // =========================================================================
  // STAGE 1 (Beats 0-2): Two districts & the fairness question
  // =========================================================================
  const s1Objs = [];
  const dPosN = P ? [0, 1.3, 0] : [-3.1, -0.45, 0];
  const dPosS = P ? [0, -1.85, 0] : [3.1, -0.45, 0];
  const dW = P ? 5.8 : 4.5, dH = P ? 2.25 : 2.75;

  const cardN = new M.RoundedRectangle({ width: dW, height: dH, cornerRadius: 0.24, color: C.cyan, strokeWidth: 2.5 });
  cardN.setFill(C.card, 0.92); cardN.moveTo(dPosN);
  const titleN = T('North district', P ? 24 : 25, C.cyan, false, true);
  titleN.moveTo([dPosN[0], dPosN[1] + dH / 2 - 0.42, 0]);
  const hNA = house(dPosN[0] - 1.15, dPosN[1] - 0.2, C.cyan, 1.25);
  const hNB = house(dPosN[0] + 1.15, dPosN[1] - 0.2, C.cyan, 1.25);
  const lblNA = T('Home A', 16, C.ink); lblNA.moveTo([dPosN[0] - 1.15, dPosN[1] - 0.78, 0]);
  const lblNB = T('Home B', 16, C.ink); lblNB.moveTo([dPosN[0] + 1.15, dPosN[1] - 0.78, 0]);
  const grpN = new M.VGroup(cardN, titleN, hNA, hNB, lblNA, lblNB);

  const cardS = new M.RoundedRectangle({ width: dW, height: dH, cornerRadius: 0.24, color: C.violet, strokeWidth: 2.5 });
  cardS.setFill(C.card, 0.92); cardS.moveTo(dPosS);
  const titleS = T('South district', P ? 24 : 25, C.violet, false, true);
  titleS.moveTo([dPosS[0], dPosS[1] + dH / 2 - 0.42, 0]);
  const hSC = house(dPosS[0] - 1.15, dPosS[1] - 0.2, C.violet, 1.25);
  const hSD = house(dPosS[0] + 1.15, dPosS[1] - 0.2, C.violet, 1.25);
  const lblSC = T('Home C', 16, C.ink); lblSC.moveTo([dPosS[0] - 1.15, dPosS[1] - 0.78, 0]);
  const lblSD = T('Home D', 16, C.ink); lblSD.moveTo([dPosS[0] + 1.15, dPosS[1] - 0.78, 0]);
  const grpS = new M.VGroup(cardS, titleS, hSC, hSD, lblSC, lblSD);
  s1Objs.push(grpN, grpS);

  // Beat 0
  await until(S(0));
  await play(new M.FadeIn(grpN, { runTime: 0.8 }), new M.FadeIn(grpS, { runTime: 0.8 }), ...say('NORTH & SOUTH DISTRICTS', C.cyan));

  // Beat 1: urgent water problems highlighted
  const alertPts = [
    [dPosN[0] - 1.15 + 0.45, dPosN[1] + 0.22, 0],
    [dPosS[0] - 1.15 + 0.45, dPosS[1] + 0.22, 0],
    [dPosS[0] + 1.15 + 0.45, dPosS[1] + 0.22, 0],
  ];
  const alerts = alertPts.map(([x, y]) => {
    const c = new M.Circle({ radius: 0.17, color: C.pink, strokeWidth: 2 });
    c.setFill(C.pink, 0.92); c.moveTo([x, y, 0]);
    const ex = T('!', 17, C.bg, true, true); ex.moveTo([x, y, 0]);
    return new M.VGroup(c, ex);
  });
  s1Objs.push(...alerts);
  await until(S(1));
  await play(new M.LaggedStart(alerts.map(a => new M.FadeIn(a)), { lagRatio: 0.2, runTime: 1.1 }), ...say('URGENT WATER PROBLEMS NEED HELP', C.pink));

  // Beat 2: equal chance?
  const eqPos = P ? [0, -0.28, 0] : [0, -0.45, 0];
  const eqQ = badge('= ?', C.amber, eqPos[0], eqPos[1], 1.15, 0.62, 22, 0.18);
  s1Objs.push(eqQ);
  await until(S(2));
  await play(new M.FadeIn(eqQ, { runTime: 0.7 }), new M.Indicate(grpN, { color: C.amber, runTime: 0.9 }), new M.Indicate(grpS, { color: C.amber, runTime: 0.9 }),
    ...say('EQUAL CHANCE OF JOINING TODAY’S LIST?', C.amber));

  // =========================================================================
  // STAGE 2 (Beats 3-15): Four requests in fixed row order with risk strips
  // =========================================================================
  const tObjs = [];
  const ROW_Y = P ? [1.75, 0.42, -0.91, -2.24] : [0.68, -0.22, -1.12, -2.02];
  const HDR_Y = P ? 2.75 : 1.34;
  const X_HOME = P ? -3.22 : -5.55;
  const X_DIST = P ? -3.22 : -3.95;
  const BAR_X0 = P ? -2.42 : -2.75;
  const BAR_W  = P ? 2.66  : 4.15;
  const BAR_X1 = BAR_X0 + BAR_W;
  const BAR_H  = P ? 0.34  : 0.36;
  const X_PCT  = P ? 0.72  : 1.96;
  const X_LIST = P ? 1.72  : 3.55;
  const X_URG  = P ? 3.04  : 5.45;
  const bx = pct => BAR_X0 + (pct / 100) * BAR_W;

  const hHome = T(P ? 'Home' : 'Home', P ? 15 : 16, C.muted, false, true); hHome.moveTo([X_HOME, HDR_Y, 0]);
  const hDist = T('District', 16, C.muted, false, true); hDist.moveTo([X_DIST, HDR_Y, 0]);
  const hRisk = T('Predicted risk', P ? 15 : 16, C.muted, false, true); hRisk.moveTo([bx(22), HDR_Y, 0]);
  const hList = T(P ? 'List' : "Today's list", P ? 15 : 16, C.amber, false, true); hList.moveTo([X_LIST, HDR_Y, 0]);
  const hUrg  = T(P ? 'Urgent?' : 'Confirmed', P ? 15 : 16, C.pink, false, true); hUrg.moveTo([X_URG, HDR_Y, 0]);

  const rowBases = HOMES.map((hm, i) => {
    const ry = ROW_Y[i];
    const rowBg = new M.RoundedRectangle({ width: P ? 7.5 : 12.8, height: P ? 1.06 : 0.74, cornerRadius: 0.12, color: C.grid, strokeWidth: 1.2 });
    rowBg.setFill(C.card, 0.85); rowBg.moveTo([P ? 0 : -0.05, ry, -0.02]);
    const nm = T(P ? hm.id : `Home ${hm.id}`, P ? 20 : 19, C.ink, true, true);
    nm.moveTo([X_HOME, P ? ry + 0.2 : ry, 0]);
    const trk = new M.RoundedRectangle({ width: BAR_W, height: BAR_H, cornerRadius: 0.08, color: C.grid, strokeWidth: 1.5 });
    trk.setFill(C.bg, 0.9); trk.moveTo([(BAR_X0 + BAR_X1) / 2, ry, -0.01]);
    return new M.VGroup(rowBg, nm, trk);
  });

  const scaleY = P ? -3.02 : -2.65;
  const scaleTicks = [0, 50, 100].map(v => {
    const x = bx(v);
    const tk = new M.Line({ start: [x, scaleY + 0.16, 0], end: [x, scaleY + 0.28, 0], color: C.muted, strokeWidth: 1.6 });
    const lb = T(`${v}%`, 15, C.muted, true); lb.moveTo([x, scaleY - 0.04, 0]);
    return new M.VGroup(tk, lb);
  });

  const baseHeaders = P ? [hHome, hRisk] : [hHome, hDist, hRisk];
  tObjs.push(...baseHeaders, ...rowBases, ...scaleTicks);

  // Beat 3: four requests
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...s1Objs), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...baseHeaders, ...scaleTicks), { runTime: 0.7 }),
    new M.LaggedStart(rowBases.map(r => new M.FadeIn(r)), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('FOUR PAST REQUESTS', C.cyan)
  );

  // Beats 4-5: North & South labels alongside colors
  const distBadges = HOMES.map((hm, i) => {
    const ry = ROW_Y[i];
    return badge(hm.dist, hm.col, X_DIST, P ? ry - 0.24 : ry, P ? 1.08 : 1.25, P ? 0.36 : 0.42, 15, 0.16);
  });
  tObjs.push(...distBadges);

  await until(S(4));
  await play(new M.FadeIn(distBadges[0], { runTime: 0.7 }), new M.FadeIn(distBadges[1], { runTime: 0.7 }), ...say('A & B: NORTH DISTRICT', C.cyan));

  await until(S(5));
  await play(new M.FadeIn(distBadges[2], { runTime: 0.7 }), new M.FadeIn(distBadges[3], { runTime: 0.7 }), ...say('C & D: SOUTH DISTRICT', C.violet));

  // Beats 6-9: predicted risk strips (90%, 10%, 50%, 30%)
  const riskFills = HOMES.map((hm, i) => {
    const ry = ROW_Y[i], fw = Math.max(0.18, (hm.risk / 100) * BAR_W);
    const bar = new M.RoundedRectangle({ width: fw, height: BAR_H - 0.06, cornerRadius: 0.06, color: hm.col, strokeWidth: 1.2 });
    bar.setFill(hm.col, 0.84); bar.moveTo([BAR_X0 + fw / 2, ry, 0]);
    const pct = T(`${hm.risk}%`, P ? 16 : 17, hm.col, true, true); pct.moveTo([X_PCT, ry, 0]);
    return new M.VGroup(bar, pct);
  });
  tObjs.push(...riskFills);

  await until(S(6));
  await play(new M.FadeIn(riskFills[0], { runTime: 0.75 }), ...say('HOME A: 90% PREDICTED RISK', C.cyan));

  await until(S(7));
  await play(new M.FadeIn(riskFills[1], { runTime: 0.65 }), ...say('HOME B: 10% PREDICTED RISK', C.cyan));

  await until(S(8));
  await play(new M.FadeIn(riskFills[2], { runTime: 0.65 }), ...say('HOME C: 50% PREDICTED RISK', C.violet));

  await until(S(9));
  await play(new M.FadeIn(riskFills[3], { runTime: 0.65 }), ...say('HOME D: 30% PREDICTED RISK', C.violet));

  // Beat 10: 50% rule dashed line
  const ruleLine = new M.DashedLine({ start: [bx(50), ROW_Y[0] + (P ? 0.56 : 0.42), 0.02], end: [bx(50), ROW_Y[3] - (P ? 0.56 : 0.42), 0.02], color: C.amber });
  const ruleTag = T('50% rule', 15, C.amber, true, true);
  ruleTag.moveTo([bx(50) + (P ? 0.55 : 0.62), HDR_Y, 0]);
  tObjs.push(ruleLine, ruleTag, hList);
  await until(S(10));
  await play(new M.Create(ruleLine, { runTime: 0.8 }), new M.FadeIn(ruleTag, { runTime: 0.6 }), new M.FadeIn(hList, { runTime: 0.6 }),
    ...say('RULE: 50% OR MORE → TODAY’S LIST', C.amber));

  // Beats 11-12: dispatch decision marks (A, C join; B, D stay off)
  const listBadges = HOMES.map((hm, i) =>
    badge(hm.list ? 'LIST' : 'OFF', hm.list ? C.amber : C.muted, X_LIST, ROW_Y[i], P ? 0.96 : 1.32, P ? 0.4 : 0.42, 15, hm.list ? 0.2 : 0.08)
  );
  tObjs.push(...listBadges);

  await until(S(11));
  await play(new M.FadeIn(listBadges[0], { runTime: 0.65 }), new M.FadeIn(listBadges[2], { runTime: 0.65 }),
    new M.Indicate(riskFills[0], { color: C.amber, runTime: 0.7 }), new M.Indicate(riskFills[2], { color: C.amber, runTime: 0.7 }),
    ...say('A & C JOIN TODAY’S LIST', C.amber));

  await until(S(12));
  await play(new M.FadeIn(listBadges[1], { runTime: 0.65 }), new M.FadeIn(listBadges[3], { runTime: 0.65 }),
    ...say('B & D STAY OFF THE LIST', C.muted));

  // Beats 13-15: confirmed urgent marks (separate column)
  tObjs.push(hUrg);
  await until(S(13));
  await play(new M.FadeIn(hUrg, { runTime: 0.6 }), ...say('LATER CREW INSPECTION: CONFIRMED URGENT?', C.pink));

  const urgBadges = HOMES.map((hm, i) =>
    badge(hm.urgent ? (P ? 'YES' : 'URGENT') : (P ? 'NO' : 'NOT URGENT'),
      hm.urgent ? C.pink : C.muted, X_URG, ROW_Y[i], P ? 1.2 : 1.72, P ? 0.4 : 0.42, 15, hm.urgent ? 0.2 : 0.08)
  );
  tObjs.push(...urgBadges);

  await until(S(14));
  await play(new M.FadeIn(urgBadges[0], { runTime: 0.7 }), new M.FadeIn(urgBadges[2], { runTime: 0.7 }), new M.FadeIn(urgBadges[3], { runTime: 0.7 }),
    ...say('A, C & D: CONFIRMED URGENT', C.pink));

  await until(S(15));
  await play(new M.FadeIn(urgBadges[1], { runTime: 0.65 }), ...say('HOME B: NOT URGENT', C.muted));

  // =========================================================================
  // STAGE 3 (Beats 16-35): Two district baskets, green marks, equal opportunity, TPR
  // =========================================================================
  const bObjs = [];
  const MINI_Y = P ? 2.68 : 1.04;
  const MINI_XS = P ? [-2.73, -0.91, 0.91, 2.73] : [-5.25, -3.45, -1.65, 0.15];
  const MINI_W = P ? 1.70 : 1.66, MINI_H = P ? 0.84 : 0.78;

  const minis = HOMES.map((hm, i) => {
    const mx = MINI_XS[i];
    const r = new M.RoundedRectangle({ width: MINI_W, height: MINI_H, cornerRadius: 0.12, color: hm.urgent ? hm.col : C.muted, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([mx, MINI_Y, 0]);
    const t1 = T(`Home ${hm.id}`, P ? 15 : 16, hm.urgent ? C.ink : C.muted, true, true);
    t1.moveTo([mx, MINI_Y + 0.16, 0]);
    const t2 = T(hm.urgent ? 'urgent' : 'not urgent', 15, hm.urgent ? hm.col : C.muted, true);
    t2.moveTo([mx, MINI_Y - 0.18, 0]);
    return new M.VGroup(r, t1, t2);
  });

  const BN_X = P ? -1.86 : -4.35, BS_X = P ? 1.86 : -0.75;
  const B_Y = P ? -0.40 : -1.45;
  const B_W = P ? 3.2 : 3.05, B_H = P ? 2.8 : 2.25;
  const basketN = openBasket(BN_X, B_Y, B_W, B_H, C.cyan, 'North basket');
  const basketS = openBasket(BS_X, B_Y, B_W, B_H, C.violet, 'South basket');
  bObjs.push(...minis, basketN, basketS);

  // Beat 16: two baskets
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(...tObjs), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...minis), { runTime: 0.7 }),
    new M.Create(basketN, { runTime: 0.9 }),
    new M.Create(basketS, { runTime: 0.9 }),
    ...say('TWO BASKETS: ONE PER DISTRICT', C.cyan)
  );

  // Beat 17: place a copy of each confirmed urgent request
  await until(S(17));
  await play(
    new M.Indicate(minis[0], { color: C.pink, runTime: 0.85 }),
    new M.Indicate(minis[2], { color: C.pink, runTime: 0.85 }),
    new M.Indicate(minis[3], { color: C.pink, runTime: 0.85 }),
    ...say('COPY CONFIRMED URGENT REQUESTS INTO BASKETS', C.pink)
  );

  function basketItem(hm, cx, cy) {
    const iw = B_W - 0.48, ih = P ? 0.72 : 0.68;
    const r = new M.RoundedRectangle({ width: iw, height: ih, cornerRadius: 0.12, color: hm.col, strokeWidth: 2 });
    r.setFill(C.card, 0.96); r.moveTo([cx, cy, 0]);
    const t1 = T(`Home ${hm.id}`, P ? 17 : 18, C.ink, true, true);
    t1.moveTo([cx - iw * 0.19, cy + 0.12, 0]);
    const t2 = T(hm.list ? "today's list" : 'off list', 15, hm.list ? C.amber : C.muted, true);
    t2.moveTo([cx - iw * 0.19, cy - 0.17, 0]);
    return new M.VGroup(r, t1, t2);
  }

  const posA = [BN_X, B_Y - 0.42, 0];
  const posC = [BS_X, B_Y + 0.42, 0];
  const posD = [BS_X, B_Y - 0.52, 0];
  const itemA = basketItem(HOMES[0], posA[0], posA[1]);
  const itemC = basketItem(HOMES[2], posC[0], posC[1]);
  const itemD = basketItem(HOMES[3], posD[0], posD[1]);
  bObjs.push(itemA, itemC, itemD);

  // Beat 18: North basket contains Home A
  await until(S(18));
  await play(new M.FadeIn(itemA, { runTime: 0.75 }), new M.Indicate(minis[0], { color: C.cyan, runTime: 0.7 }),
    ...say('NORTH BASKET: HOME A', C.cyan));

  // Beat 19: South basket contains Homes C and D
  await until(S(19));
  await play(new M.LaggedStart([new M.FadeIn(itemC), new M.FadeIn(itemD)], { lagRatio: 0.35, runTime: 1.0 }),
    ...say('SOUTH BASKET: HOMES C & D', C.violet));

  // Beat 20: Home B stays outside
  const outTag = badge('STAYS OUTSIDE', C.muted, MINI_XS[1], MINI_Y - (P ? 0.68 : 0.64), P ? 1.95 : 2.0, 0.38, 15, 0.12);
  bObjs.push(outTag);
  await until(S(20));
  await play(new M.FadeIn(outTag, { runTime: 0.65 }), new M.Indicate(minis[1], { color: C.muted, runTime: 0.8 }),
    ...say('HOME B STAYS OUTSIDE (NOT URGENT)', C.muted));

  // Beat 21: green mark rule
  await until(S(21));
  await play(new M.Indicate(basketN, { color: C.green, runTime: 0.8 }), new M.Indicate(basketS, { color: C.green, runTime: 0.8 }),
    ...say('GREEN MARK = URGENT & ON TODAY’S LIST', C.green));

  const markDx = (B_W - 0.48) * 0.33;
  const markA = greenCheck(posA[0] + markDx, posA[1]);
  const markC = greenCheck(posC[0] + markDx, posC[1]);
  const missD = noMark(posD[0] + markDx, posD[1]);
  bObjs.push(markA, markC, missD);

  // Beat 22: Home A receives green mark
  await until(S(22));
  await play(new M.FadeIn(markA, { runTime: 0.65 }), new M.Flash(markA, { color: C.green, runTime: 0.7 }),
    ...say('HOME A: GREEN MARK ✓', C.green));

  // Beat 23: Home C receives green mark
  await until(S(23));
  await play(new M.FadeIn(markC, { runTime: 0.65 }), new M.Flash(markC, { color: C.green, runTime: 0.7 }),
    ...say('HOME C: GREEN MARK ✓', C.green));

  // Beat 24: Home D does not receive green mark
  await until(S(24));
  await play(new M.FadeIn(missD, { runTime: 0.65 }), ...say('HOME D: NO GREEN MARK', C.pink));

  // Beat 25: compare shares
  const midX = (BN_X + BS_X) / 2, topBY = B_Y + B_H / 2 + 0.28;
  const CHIP_HALF = P ? 1.28 : 1.33;
  const compLine = new M.VGroup(
    new M.DashedLine({ start: [BN_X + 0.6, topBY, 0], end: [midX - CHIP_HALF - 0.08, topBY, 0], color: C.amber }),
    new M.DashedLine({ start: [midX + CHIP_HALF + 0.08, topBY, 0], end: [BS_X - 0.6, topBY, 0], color: C.amber }));
  const compTag = badge('COMPARE SHARES', C.amber, midX, topBY, P ? 2.3 : 2.4, 0.40, 15, 0.18);
  await until(S(25));
  await play(new M.Create(compLine, { runTime: 0.7 }), new M.FadeIn(compTag, { runTime: 0.7 }),
    ...say('COMPARE GREEN-MARK SHARE IN EACH BASKET', C.amber));

  // Beat 26: want same share
  const wantEq = badge('WANT: SAME SHARE', C.amber, midX, topBY, P ? 2.45 : 2.5, 0.40, 15, 0.2);
  await until(S(26));
  await play(new M.FadeOut(compTag, { runTime: 0.5 }), new M.FadeIn(wantEq, { runTime: 0.6 }),
    ...say('GOAL: SAME SHARE IN BOTH DISTRICTS', C.amber));

  // Beat 27: equal opportunity
  const eoTag = badge('EQUAL OPPORTUNITY', C.green, midX, topBY, P ? 2.55 : 2.65, 0.42, 15, 0.22);
  await until(S(27));
  await play(new M.FadeOut(wantEq, { runTime: 0.5 }), new M.FadeIn(eoTag, { runTime: 0.6 }),
    ...say('EQUAL OPPORTUNITY', C.green));

  // Beat 28: meaning of equal opportunity
  await until(S(28));
  await play(...fbox([
    ['Equal opportunity', C.green],
    ['urgent requests have the', C.ink],
    ['same chance of selection', C.ink],
    ['across both districts', C.muted],
  ], C.green), ...say('SAME SELECTION CHANCE FOR URGENT HOMES', C.green));

  // Beat 29: count North basket
  await until(S(29));
  await play(new M.FadeOut(new M.VGroup(compLine, eoTag), { runTime: 0.5 }),
    new M.Indicate(basketN, { color: C.cyan, runTime: 0.8 }),
    ...fbox([['North basket', C.cyan], 'green marks = ?'], C.cyan),
    ...say('COUNT: NORTH BASKET', C.cyan));

  // Beat 30: 1 out of 1
  const badgeN1 = badge('1 / 1', C.cyan, BN_X, B_Y + B_H / 2 + 0.26, 1.15, 0.42, 16, 0.18);
  await until(S(30));
  await play(new M.Flash(markA, { color: C.green, runTime: 0.7 }), new M.FadeIn(badgeN1, { runTime: 0.65 }),
    ...fbox([['North basket', C.cyan], ['selected urgent = 1', C.green], ['all urgent      = 1', C.ink]], C.cyan),
    ...say('NORTH: 1 OUT OF 1 URGENT SELECTED', C.cyan));

  // Beat 31: 1 / 1 = 100%
  const badgeN100 = badge('100%', C.cyan, BN_X, B_Y + B_H / 2 + 0.26, 1.25, 0.44, 17, 0.22);
  bObjs.push(badgeN100);
  await until(S(31));
  await play(new M.FadeOut(badgeN1, { runTime: 0.5 }), new M.FadeIn(badgeN100, { runTime: 0.65 }),
    ...fbox([['North basket', C.cyan], '1 ÷ 1 = 1', ['      = 100%', C.cyan]], C.cyan),
    ...say('NORTH: 1 ÷ 1 = 100%', C.cyan));

  // Beat 32: count South basket
  await until(S(32));
  await play(new M.Indicate(basketS, { color: C.violet, runTime: 0.8 }),
    ...fbox([['North = 100%', C.cyan], ['South basket', C.violet], 'green marks = ?'], C.violet),
    ...say('COUNT: SOUTH BASKET', C.violet));

  // Beat 33: 1 out of 2
  const badgeS1 = badge('1 / 2', C.violet, BS_X, B_Y + B_H / 2 + 0.26, 1.15, 0.42, 16, 0.18);
  await until(S(33));
  await play(new M.Flash(markC, { color: C.green, runTime: 0.7 }), new M.FadeIn(badgeS1, { runTime: 0.65 }),
    ...fbox([['North = 100%', C.cyan], ['South basket', C.violet], ['selected urgent = 1', C.green], ['all urgent      = 2', C.ink]], C.violet),
    ...say('SOUTH: 1 OUT OF 2 URGENT SELECTED', C.violet));

  // Beat 34: 1 / 2 = 50%
  const badgeS50 = badge('50%', C.violet, BS_X, B_Y + B_H / 2 + 0.26, 1.2, 0.44, 17, 0.22);
  bObjs.push(badgeS50);
  await until(S(34));
  await play(new M.FadeOut(badgeS1, { runTime: 0.5 }), new M.FadeIn(badgeS50, { runTime: 0.65 }),
    ...fbox([['North = 100%', C.cyan], ['South: 1 ÷ 2 = 0.5', C.violet], ['             = 50%', C.violet]], C.violet),
    ...say('SOUTH: 1 ÷ 2 = 50%', C.violet));

  // Beat 35: true positive rate
  await until(S(35));
  await play(
    ...fbox([['True positive rate', C.amber], ['North = 100%', C.cyan], ['South =  50%', C.violet]], C.amber),
    ...say('TRUE POSITIVE RATE', C.amber)
  );

  // =========================================================================
  // STAGE 4 (Beats 36-47): Two horizontal rate bars, gap, and short formulas
  // =========================================================================
  const barObjs = [];
  const GX0 = P ? -2.05 : -4.85, GW = P ? 5.15 : 5.65, GX1 = GX0 + GW;
  const GY_BOT = P ? -0.48 : -1.9, GY_TOP = P ? 2.42 : 1.05;
  const Y_BARN = P ? 1.72 : 0.42, Y_BARS = P ? 0.36 : -0.88, BH = P ? 0.76 : 0.72;
  const gx = pct => GX0 + (pct / 100) * GW;

  const baseAxis = new M.Line({ start: [GX0, GY_BOT, 0], end: [GX1, GY_BOT, 0], color: C.muted, strokeWidth: 2.2 });
  const gridLines = [0, 50, 100].map(v => {
    const x = gx(v);
    const gl = new M.DashedLine({ start: [x, GY_BOT, -0.01], end: [x, GY_TOP, -0.01], color: C.grid });
    const lb = T(`${v}%`, P ? 15 : 16, C.muted, true); lb.moveTo([x, GY_BOT - 0.34, 0]);
    return new M.VGroup(gl, lb);
  });
  const labBarN = T('North', P ? 19 : 20, C.cyan, false, true); labBarN.moveTo([GX0 - (P ? 0.82 : 0.85), Y_BARN, 0]);
  const labBarS = T('South', P ? 19 : 20, C.violet, false, true); labBarS.moveTo([GX0 - (P ? 0.82 : 0.85), Y_BARS, 0]);
  barObjs.push(baseAxis, ...gridLines, labBarN, labBarS);

  // Beat 36: draw two bars axes
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...bObjs), { runTime: 0.6 }),
    new M.Create(baseAxis, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...gridLines, labBarN, labBarS), { runTime: 0.7 }),
    ...say('COMPARE THE TWO TRUE POSITIVE RATES', C.cyan)
  );

  // Beat 37: North bar reaches 100%
  const rBarN = new M.RoundedRectangle({ width: GW, height: BH, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2 });
  rBarN.setFill(C.cyan, 0.84); rBarN.moveTo([GX0 + GW / 2, Y_BARN, 0]);
  const tBarN = T('100%', P ? 20 : 21, C.bg, true, true); tBarN.moveTo([GX0 + GW / 2, Y_BARN, 0.01]);
  const grpBarN = new M.VGroup(rBarN, tBarN);
  barObjs.push(grpBarN);
  await until(S(37));
  await play(new M.FadeIn(grpBarN, { runTime: 0.75 }), ...say('NORTH BAR: 100%', C.cyan));

  // Beat 38: South bar reaches 50%
  const rBarS = new M.RoundedRectangle({ width: GW * 0.5, height: BH, cornerRadius: 0.1, color: C.violet, strokeWidth: 2 });
  rBarS.setFill(C.violet, 0.84); rBarS.moveTo([GX0 + GW * 0.25, Y_BARS, 0]);
  const tBarS = T('50%', P ? 20 : 21, C.bg, true, true); tBarS.moveTo([GX0 + GW * 0.25, Y_BARS, 0.01]);
  const grpBarS = new M.VGroup(rBarS, tBarS);
  barObjs.push(grpBarS);
  await until(S(38));
  await play(new M.FadeIn(grpBarS, { runTime: 0.75 }), ...say('SOUTH BAR: 50%', C.violet));

  // Beat 39: distance = 50 percentage points
  const gapShade = new M.Rectangle({ width: GW * 0.5, height: BH, color: C.amber, strokeWidth: 1.5 });
  gapShade.setFill(C.amber, 0.16); gapShade.moveTo([gx(75), Y_BARS, -0.01]);
  const dropN = new M.DashedLine({ start: [gx(100), Y_BARN - BH / 2, 0.01], end: [gx(100), Y_BARS - BH / 2, 0.01], color: C.amber });
  const gapSpan = new M.Line({ start: [gx(50) + 0.05, Y_BARS, 0.02], end: [gx(100) - 0.05, Y_BARS, 0.02], color: C.amber, strokeWidth: 3.5 });
  const gapCapL = new M.Line({ start: [gx(50) + 0.05, Y_BARS - 0.18, 0.02], end: [gx(50) + 0.05, Y_BARS + 0.18, 0.02], color: C.amber, strokeWidth: 3.5 });
  const gapCapR = new M.Line({ start: [gx(100) - 0.05, Y_BARS - 0.18, 0.02], end: [gx(100) - 0.05, Y_BARS + 0.18, 0.02], color: C.amber, strokeWidth: 3.5 });
  const gapLbl = badge('50 pts', C.amber, gx(75), (Y_BARN + Y_BARS) / 2, 1.35, 0.44, 17, 0.22);
  const gapGrp = new M.VGroup(gapShade, dropN, gapSpan, gapCapL, gapCapR, gapLbl);
  barObjs.push(gapGrp);

  await until(S(39));
  await play(new M.FadeIn(gapGrp, { runTime: 0.85 }), ...say('DISTANCE = 50 PERCENTAGE POINTS', C.amber));

  // Beat 40: equal-opportunity gap
  await until(S(40));
  await play(new M.Indicate(gapGrp, { color: C.amber, runTime: 0.85 }), ...say('EQUAL-OPPORTUNITY GAP', C.amber));

  // Beat 41: two short formulas
  await until(S(41));
  await play(...fbox([
    ['Two short formulas', C.ink],
    ['1. True positive rate', C.cyan],
    ['2. Equal-opportunity gap', C.amber],
  ], C.cyan), ...say('WRITE BOTH AS SHORT FORMULAS', C.cyan));

  // Beat 42: TPR formula
  await until(S(42));
  await play(...fbox([
    ['True positive rate =', C.cyan],
    ['  selected urgent', C.green],
    ['÷ all confirmed urgent', C.ink],
  ], C.cyan), ...say('RATE = SELECTED URGENT ÷ ALL URGENT', C.cyan));

  // Beat 43: multiply by 100
  await until(S(43));
  await play(...fbox([
    ['Rate = (selected ÷ all) × 100%', C.amber],
    ['North: (1 ÷ 1) × 100 = 100%', C.cyan],
    ['South: (1 ÷ 2) × 100 =  50%', C.violet],
  ], C.cyan), ...say('MULTIPLY BY 100 FOR A PERCENTAGE', C.cyan));

  // Beat 44: gap formula
  await until(S(44));
  await play(...fbox([
    ['Equal-opportunity gap =', C.amber],
    ['  higher rate − lower rate', C.ink],
  ], C.amber), ...say('GAP = HIGHER RATE − LOWER RATE', C.amber));

  // Beat 45: 100 - 50 = 50 points
  await until(S(45));
  await play(new M.Indicate(gapLbl, { color: C.amber, runTime: 0.8 }),
    ...fbox([
      ['Gap = higher − lower', C.muted],
      ['    = 100% − 50%', C.ink],
      ['    = 50 percentage points', C.amber],
    ], C.amber), ...say('100 − 50 = 50 PERCENTAGE POINTS', C.amber));

  // Beat 46: gap of zero
  const ghostBox = new M.RoundedRectangle({ width: GW * 0.5, height: BH, cornerRadius: 0.1, color: C.green, strokeWidth: 2.5 });
  ghostBox.setFill(C.green, 0.16); ghostBox.moveTo([gx(75), Y_BARS, 0.03]);
  const zeroTag = badge('GAP = 0', C.green, gx(75), Y_BARS, 1.45, 0.44, 16, 0.25);
  const zeroGrp = new M.VGroup(ghostBox, zeroTag);
  await until(S(46));
  await play(new M.FadeIn(zeroGrp, { runTime: 0.7 }),
    ...fbox([
      ['Gap = 0 points', C.green],
      ['→ both groups have the', C.ink],
      ['  same true positive rate', C.green],
    ], C.green), ...say('GAP = 0 MEANS EQUAL RATES', C.green));

  // Beat 47: what equal opportunity checks
  await until(S(47));
  await play(new M.FadeOut(zeroGrp, { runTime: 0.5 }), new M.Indicate(gapGrp, { color: C.pink, runTime: 0.9 }),
    ...fbox([
      ['What it checks:', C.amber],
      ['Are urgent requests missed', C.ink],
      ['more often in one group?', C.pink],
    ], C.amber), ...say('CHECKS IF ONE GROUP MISSES MORE URGENT HOMES', C.amber));

  // =========================================================================
  // STAGE 5 (Beats 48-54): Nonurgent blind spot, small counts, recap
  // =========================================================================
  const nuObjs = [];
  const NU_XN = P ? -1.85 : -4.25, NU_XS = P ? 1.85 : -0.75;
  const NU_Y = P ? 0.6 : -0.45, NU_W = P ? 3.25 : 3.1, NU_H = P ? 2.45 : 2.5;

  const nuCardN = new M.RoundedRectangle({ width: NU_W, height: NU_H, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.2 });
  nuCardN.setFill(C.card, 0.94); nuCardN.moveTo([NU_XN, NU_Y, 0]);
  const nuTitN = T('North · nonurgent', P ? 15 : 16, C.cyan, false, true);
  nuTitN.moveTo([NU_XN, NU_Y + NU_H / 2 - 0.36, 0]);

  const nuCardS = new M.RoundedRectangle({ width: NU_W, height: NU_H, cornerRadius: 0.18, color: C.violet, strokeWidth: 2.2 });
  nuCardS.setFill(C.card, 0.94); nuCardS.moveTo([NU_XS, NU_Y, 0]);
  const nuTitS = T('South · nonurgent', P ? 15 : 16, C.violet, false, true);
  nuTitS.moveTo([NU_XS, NU_Y + NU_H / 2 - 0.36, 0]);
  const nuShell = new M.VGroup(nuCardN, nuTitN, nuCardS, nuTitS);
  nuObjs.push(nuShell);

  // Beat 48: blind spot for nonurgent requests
  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(...barObjs), { runTime: 0.6 }),
    new M.FadeIn(nuShell, { runTime: 0.75 }),
    ...fbox([
      ['Not measured here:', C.pink],
      ['how often nonurgent homes', C.ink],
      ['join today’s list', C.muted],
    ], C.pink),
    ...say('DOES NOT TRACK NONURGENT REQUESTS', C.pink)
  );

  // Beat 49: North has 1 (Home B), South has none (0)
  const itemB = badge('Home B · OFF', C.cyan, NU_XN, NU_Y + 0.05, NU_W - 0.6, 0.56, 15, 0.14);
  const cntBN = T('count = 1', 16, C.cyan, true, true); cntBN.moveTo([NU_XN, NU_Y - 0.72, 0]);
  const noneS = badge('none in data', C.muted, NU_XS, NU_Y + 0.05, NU_W - 0.6, 0.56, 15, 0.08);
  const cntBS = T('count = 0', 16, C.pink, true, true); cntBS.moveTo([NU_XS, NU_Y - 0.72, 0]);
  const nuData = new M.VGroup(itemB, cntBN, noneS, cntBS);
  nuObjs.push(nuData);
  await until(S(49));
  await play(new M.FadeIn(nuData, { runTime: 0.75 }), ...say('NONURGENT: NORTH = 1, SOUTH = 0', C.amber));

  // Beat 50: cannot compare
  const qBadge = badge('?  CANNOT COMPARE', C.pink, NU_XS, NU_Y - 0.72, NU_W - 0.3, 0.46, 15, 0.22);
  nuObjs.push(qBadge);
  await until(S(50));
  await play(new M.FadeIn(qBadge, { runTime: 0.7 }),
    ...fbox([
      ['Nonurgent flagged:', C.muted],
      ['North: 0 / 1', C.cyan],
      ['South: 0 / 0  (no data)', C.pink],
    ], C.pink),
    ...say('CANNOT COMPARE WITH ZERO IN SOUTH', C.pink));

  // Beat 51: different fairness criteria
  const critList = [
    ['Equal opportunity', 'urgent homes selected', C.green],
    ['False-alarm rate', 'nonurgent homes flagged', C.muted],
    ['Selection rate', 'all homes on today’s list', C.muted],
  ];
  const critCards = critList.map(([title, sub, col], i) => {
    const cx = P ? 0 : (i - 1) * 4.15;
    const cy = P ? (1.7 - i * 1.95) : -0.35;
    const cw = P ? 6.2 : 3.7, ch = P ? 1.48 : 2.1;
    const r = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.18, color: col, strokeWidth: i === 0 ? 3 : 1.8 });
    r.setFill(C.card, 0.94); r.moveTo([cx, cy, 0]);
    const t1 = T(title, P ? 20 : 19, col, false, true); t1.moveTo([cx, cy + 0.28, 0]);
    const t2 = T(sub, P ? 16 : 15, i === 0 ? C.ink : C.muted); t2.moveTo([cx, cy - 0.24, 0]);
    return new M.VGroup(r, t1, t2);
  });
  await until(S(51));
  await play(
    new M.FadeOut(new M.VGroup(...nuObjs), { runTime: 0.6 }),
    ...clearBox(),
    new M.LaggedStart(critCards.map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.0 }),
    ...say('DIFFERENT CRITERIA MEASURE DIFFERENT THINGS', C.violet)
  );

  // Beat 52: caution — very few requests, need more data
  const cautObjs = [];
  const CX_C = P ? 0 : -2.5, CY_C = P ? 0.85 : -0.45;
  const cBox = new M.RoundedRectangle({ width: P ? 6.6 : 6.4, height: P ? 2.8 : 2.7, cornerRadius: 0.2, color: C.amber, strokeWidth: 2 });
  cBox.setFill(C.card, 0.94); cBox.moveTo([CX_C, CY_C, 0]);
  const cHead = T('Our urgent data: only 3 homes', P ? 18 : 19, C.amber, false, true);
  cHead.moveTo([CX_C, CY_C + 0.95, 0]);
  const dA = new M.Dot({ point: [CX_C - 2.1, CY_C + 0.2, 0], radius: 0.22, color: C.cyan });
  const tA = T('A', 16, C.bg, true, true); tA.moveTo([CX_C - 2.1, CY_C + 0.2, 0.01]);
  const dC = new M.Dot({ point: [CX_C - 1.35, CY_C + 0.2, 0], radius: 0.22, color: C.violet });
  const tC = T('C', 16, C.bg, true, true); tC.moveTo([CX_C - 1.35, CY_C + 0.2, 0.01]);
  const dD = new M.Dot({ point: [CX_C - 0.6, CY_C + 0.2, 0], radius: 0.22, color: C.violet });
  const tD = T('D', 16, C.bg, true, true); tD.moveTo([CX_C - 0.6, CY_C + 0.2, 0.01]);
  const ghostDots = [];
  for (let k = 0; k < 5; k++) {
    const gd = new M.Circle({ radius: 0.18, color: C.muted, strokeWidth: 1.8 });
    gd.setFill(C.muted, 0.14); gd.moveTo([CX_C + 0.25 + k * 0.52, CY_C + 0.2, 0]);
    ghostDots.push(gd);
  }
  const cSub = T('Collect many more visits before judging fairness', P ? 15 : 16, C.muted);
  cSub.moveTo([CX_C, CY_C - 0.68, 0]);
  const cautGrp = new M.VGroup(cBox, cHead, dA, tA, dC, tC, dD, tD, ...ghostDots, cSub);
  cautObjs.push(cautGrp);

  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(...critCards), { runTime: 0.55 }),
    new M.FadeIn(cautGrp, { runTime: 0.8 }),
    ...fbox([
      ['Small sample warning', C.amber],
      ['North urgent: 1', C.cyan],
      ['South urgent: 2', C.violet],
      ['→ need more data!', C.amber],
    ], C.amber),
    ...say('CAUTION: VERY FEW REQUESTS IN OUR DATA', C.amber)
  );

  // Beat 53: gap of zero != fair in every way
  const zY = P ? 0.35 : -0.35;
  const zCard = new M.RoundedRectangle({ width: P ? 6.6 : 8.6, height: P ? 2.4 : 2.3, cornerRadius: 0.22, color: C.pink, strokeWidth: 2.2 });
  zCard.setFill(C.card, 0.96); zCard.moveTo([0, zY, 0]);
  const zLeft = badge('GAP = 0', C.green, P ? 0 : -2.55, P ? zY + 0.55 : zY, 2.0, 0.64, 21, 0.2);
  const zNeq = T('≠', P ? 34 : 38, C.pink, true, true); zNeq.moveTo([P ? 0 : -0.85, P ? zY - 0.02 : zY, 0]);
  const zRight = T('fair in every way', P ? 24 : 26, C.ink, false, true); zRight.moveTo([P ? 0 : 1.75, P ? zY - 0.62 : zY, 0]);
  const zGrp = new M.VGroup(zCard, zLeft, zNeq, zRight);

  await until(S(53));
  await play(
    new M.FadeOut(new M.VGroup(...cautObjs), { runTime: 0.55 }),
    ...clearBox(),
    new M.FadeIn(zGrp, { runTime: 0.75 }),
    ...say('GAP = 0 DOES NOT MEAN FAIR IN EVERY WAY', C.pink)
  );

  // Beat 54: final one-sentence recap
  const rcY = P ? -0.25 : -0.4;
  const rcW = P ? 6.9 : 10.6, rcH = P ? 4.3 : 3.2;
  const rcBg = new M.RoundedRectangle({ width: rcW, height: rcH, cornerRadius: 0.24, color: C.green, strokeWidth: 2.5 });
  rcBg.setFill(C.card, 0.96); rcBg.moveTo([0, rcY, 0]);
  const rcTitle = T('Equal opportunity', P ? 24 : 26, C.green, false, true);
  rcTitle.moveTo([0, rcY + rcH / 2 - 0.52, 0]);
  const rcLine1 = T('Compares how often urgent homes are selected', P ? 16 : 19, C.ink);
  rcLine1.moveTo([0, rcY + rcH / 2 - 1.05, 0]);

  const mX0 = P ? -1.8 : -3.4, mW = P ? 4.2 : 6.2;
  const mN = new M.RoundedRectangle({ width: mW, height: 0.42, cornerRadius: 0.08, color: C.cyan, strokeWidth: 1.5 });
  mN.setFill(C.cyan, 0.85); mN.moveTo([mX0 + mW / 2, rcY + (P ? 0.15 : 0.02), 0]);
  const mNL = T('North  100%', P ? 15 : 16, C.cyan, true, true);
  mNL.moveTo([mX0 - (P ? 0.75 : 0.9), rcY + (P ? 0.15 : 0.02), 0]);

  const mS = new M.RoundedRectangle({ width: mW * 0.5, height: 0.42, cornerRadius: 0.08, color: C.violet, strokeWidth: 1.5 });
  mS.setFill(C.violet, 0.85); mS.moveTo([mX0 + mW * 0.25, rcY - (P ? 0.55 : 0.58), 0]);
  const mSL = T('South   50%', P ? 15 : 16, C.violet, true, true);
  mSL.moveTo([mX0 - (P ? 0.75 : 0.9), rcY - (P ? 0.55 : 0.58), 0]);

  const mGap = badge('Gap = 50 pts', C.amber, mX0 + mW * 0.75, rcY - (P ? 0.55 : 0.58), P ? 1.95 : 2.1, 0.42, 15, 0.2);
  const rcForm = T('Rate = selected urgent ÷ all urgent × 100%', P ? 15 : 17, C.amber, true);
  rcForm.moveTo([0, rcY - rcH / 2 + 0.52, 0]);

  const rcGrp = new M.VGroup(rcBg, rcTitle, rcLine1, mN, mNL, mS, mSL, mGap, rcForm);
  await until(S(54));
  await play(
    new M.FadeOut(zGrp, { runTime: 0.6 }),
    new M.FadeIn(rcGrp, { runTime: 0.9 }),
    ...say('EQUAL OPPORTUNITY: FAIRNESS FOR URGENT NEED', C.green)
  );
}

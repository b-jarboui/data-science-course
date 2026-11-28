// 16.2.9 Experiment tracking: remember how each result was made.
// Beat i = sentence i (0-based, 52 sentences: 0..51). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const PILL = P ? [0, 3.85, 0] : [0, 1.98, 0];
  const BOXP = P ? [0, 2.35, 0] : [4.25, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 18);
  const out = (...xs) => xs.flat().filter(Boolean).map(x => new M.FadeOut(x, { runTime: 0.6 }));

  function fitText(s, size, color = C.ink, maxW = 99, mono = false, bold = false) {
    const t = T(s, size, color, mono, bold);
    if (t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    return t;
  }

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.40;
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
    const maxw = P ? FW - 0.9 : 4.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.5 })];
  }

  function makeArrow(a, b, color = C.muted, sw = 2.5, head = 0.16) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const shaft = new M.Line({ start: a, end: b, color, strokeWidth: sw });
    const h1 = new M.Line({ start: b, end: [b[0] - ux * head + px * head * 0.65, b[1] - uy * head + py * head * 0.65, 0], color, strokeWidth: sw });
    const h2 = new M.Line({ start: b, end: [b[0] - ux * head - px * head * 0.65, b[1] - uy * head - py * head * 0.65, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, h1, h2);
  }

  function shopCard(name, color, pos, w, h) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const awning = new M.Rectangle({ width: w - 0.14, height: 0.24, color, strokeWidth: 1 });
    awning.setFill(color, 0.32); awning.moveTo([pos[0], pos[1] + h / 2 - 0.2, 0]);
    const title = fitText(name, P ? 20 : 22, color, w - 0.35, false, true);
    title.moveTo([pos[0], pos[1] - 0.02, 0]);
    const sub = fitText('bakery', P ? 14 : 15, C.muted, w - 0.4);
    sub.moveTo([pos[0], pos[1] - 0.44, 0]);
    return new M.VGroup(r, awning, title, sub);
  }

  function ticketSlip(id, shop, time, amt, pos, w, h, extraTag = '') {
    const col = shop === 'North' ? C.cyan : C.amber;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.13, color: col, strokeWidth: 2.2 });
    r.setFill(C.card, 0.96); r.moveTo(pos);
    const bar = new M.Rectangle({ width: 0.09, height: h - 0.2, color: col, strokeWidth: 0 });
    bar.setFill(col, 0.9); bar.moveTo([pos[0] - w / 2 + 0.12, pos[1], 0]);
    const parts = [r, bar];
    if (w > h * 1.4) {
      const tId = fitText(`Ticket ${id}`, P ? 16 : 15, C.ink, w * 0.48, true, true);
      tId.moveTo([pos[0] - w * 0.16, pos[1] + h * 0.2, 0]);
      const tShop = fitText(shop, P ? 13 : 13, col, w * 0.45, false, true);
      tShop.moveTo([pos[0] - w * 0.16, pos[1] - h * 0.2, 0]);
      const tAmt = fitText(`$${amt}`, P ? 22 : 20, col, w * 0.32, true, true);
      tAmt.moveTo([pos[0] + w * 0.3, pos[1], 0]);
      parts.push(tId, tShop, tAmt);
    } else {
      const tId = fitText(`Ticket ${id}`, 14, C.ink, w - 0.24, true, true);
      tId.moveTo([pos[0] + 0.04, pos[1] + h * 0.3, 0]);
      const tShop = fitText(shop, 13, col, w - 0.24, false, true);
      tShop.moveTo([pos[0] + 0.04, pos[1] + h * 0.05, 0]);
      const tAmt = fitText(`$${amt}`, 23, col, w - 0.24, true, true);
      tAmt.moveTo([pos[0] + 0.04, pos[1] - h * 0.25, 0]);
      parts.push(tId, tShop, tAmt);
    }
    if (extraTag) {
      const tagBg = new M.RoundedRectangle({ width: 0.68, height: 0.24, cornerRadius: 0.08, color: C.pink, strokeWidth: 1.5 });
      tagBg.setFill(C.bg, 0.95); tagBg.moveTo([pos[0] + w / 2 - 0.38, pos[1] + h / 2 - 0.02, 0]);
      const tagT = fitText(extraTag, 10, C.pink, 0.58, true, true);
      tagT.moveTo([pos[0] + w / 2 - 0.38, pos[1] + h / 2 - 0.02, 0]);
      parts.push(tagBg, tagT);
    }
    return new M.VGroup(...parts);
  }

  function miniTicket(id, shop, amt, pos, w, h, late = false) {
    const col = shop === 'North' ? C.cyan : C.amber;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.09, color: late ? C.pink : col, strokeWidth: late ? 2.4 : 1.8 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const t1 = fitText(`${id} · ${shop[0]}`, P ? 12 : 12, col, w - 0.14, true, true);
    t1.moveTo([pos[0], pos[1] + h * 0.22, 0]);
    const t2 = fitText(`$${amt}`, P ? 15 : 15, late ? C.pink : C.ink, w - 0.14, true, true);
    t2.moveTo([pos[0], pos[1] - h * 0.2, 0]);
    return new M.VGroup(r, t1, t2);
  }

  // ==================== ACT 1: 0..4 Bakery, Tue 7 a.m. forecast $34, Wed question ====================
  const northPos = P ? [-1.85, 1.55, 0] : [-4.1, 0.2, 0];
  const southPos = P ? [1.85, 1.55, 0] : [4.1, 0.2, 0];
  const shopW = P ? 3.2 : 3.3, shopH = P ? 1.55 : 1.7;
  const northShop = shopCard('North shop', C.cyan, northPos, shopW, shopH);
  const southShop = shopCard('South shop', C.amber, southPos, shopW, shopH);

  await until(S(0));
  await play(
    new M.LaggedStart([new M.FadeIn(northShop, { runTime: 0.8 }), new M.FadeIn(southShop, { runTime: 0.8 })], { lagRatio: 0.35, runTime: 1.3 }),
    ...say('NORTH & SOUTH SHOPS', C.cyan)
  );

  // 1: Tue 7:00 a.m. timeline + forecast card (?)
  const tlY = P ? -2.85 : -1.85, tlX = P ? 3.1 : 5.2;
  const tlLine = new M.Line({ start: [-tlX, tlY, 0], end: [tlX, tlY, 0], color: C.muted, strokeWidth: 2.5 });
  const xMon = P ? -2.2 : -3.7, xTue = 0, xWed = P ? 2.2 : 3.7;
  const dotMon = new M.Dot({ point: [xMon, tlY, 0], radius: 0.09, color: C.muted });
  const lblMon = fitText('Mon', 16, C.muted, 1.4, true); lblMon.moveTo([xMon, tlY - 0.36, 0]);
  const dotTue = new M.Dot({ point: [xTue, tlY, 0], radius: 0.13, color: C.cyan });
  const lblTue = fitText('Tue 7:00 a.m.', P ? 15 : 17, C.cyan, 2.4, true, true); lblTue.moveTo([xTue, tlY - 0.36, 0]);
  const dotWed = new M.Dot({ point: [xWed, tlY, 0], radius: 0.09, color: C.muted });
  const lblWed = fitText('Wed', 16, C.muted, 1.4, true); lblWed.moveTo([xWed, tlY - 0.36, 0]);
  const timeline = new M.VGroup(tlLine, dotMon, lblMon, dotTue, lblTue, dotWed, lblWed);

  const fcPos = P ? [0, -0.75, 0] : [0, 0.2, 0];
  const fcW = P ? 4.4 : 3.4, fcH = P ? 1.7 : 1.7;
  const fcBox = new M.RoundedRectangle({ width: fcW, height: fcH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  fcBox.setFill(C.card, 0.96); fcBox.moveTo(fcPos);
  const fcHead = fitText('TUESDAY FORECAST', P ? 15 : 15, C.muted, fcW - 0.3, true, true);
  fcHead.moveTo([fcPos[0], fcPos[1] + 0.48, 0]);
  const fcQ = fitText('?', 34, C.cyan, 1.5, true, true); fcQ.moveTo([fcPos[0], fcPos[1] - 0.12, 0]);

  await until(S(1));
  await play(
    new M.Create(tlLine, { runTime: 0.7 }),
    ...[dotMon, lblMon, dotTue, lblTue, dotWed, lblWed].map(x => new M.FadeIn(x, { runTime: 0.7 })),
    new M.FadeIn(fcBox, { runTime: 0.7 }),
    new M.FadeIn(fcHead, { runTime: 0.7 }),
    new M.FadeIn(fcQ, { runTime: 0.7 }),
    ...say('TUE 7:00 A.M. · FORECAST', C.cyan)
  );

  // 2: Forecast is $34
  const fcVal = fitText('$34', 36, C.amber, 2.2, true, true); fcVal.moveTo([fcPos[0], fcPos[1] - 0.12, 0]);
  await until(S(2));
  await play(
    new M.FadeOut(fcQ, { runTime: 0.4 }),
    new M.FadeIn(fcVal, { runTime: 0.6 }),
    new M.Flash(fcVal, { color: C.amber, flashRadius: 0.35, lineLength: 0.22, runTime: 0.8 }),
    ...say('FORECAST = $34', C.amber)
  );

  // 3: Wednesday look back
  const wedRing = new M.Circle({ radius: 0.22, color: C.violet, strokeWidth: 2.5 });
  wedRing.moveTo([xWed, tlY, 0]);
  const lookBack = new M.DashedLine({ start: [xWed, tlY + 0.24, 0], end: [fcPos[0] + 0.6, fcPos[1] - fcH / 2 - 0.08, 0], color: C.violet });
  const wedTag = fitText('How was $34 made?', P ? 16 : 17, C.violet, 3.4, true, true);
  wedTag.moveTo([P ? 1.3 : 2.3, P ? -2.05 : -1.15, 0]);

  await until(S(3));
  await play(
    new M.Create(wedRing, { runTime: 0.6 }),
    new M.Create(lookBack, { runTime: 0.7 }),
    new M.FadeIn(wedTag, { runTime: 0.7 }),
    ...say('WEDNESDAY: HOW WAS $34 MADE?', C.violet)
  );

  // 4: Is knowing $34 alone enough?
  const qMarkL = fitText('?', 28, C.pink, 0.8, true, true); qMarkL.moveTo([fcPos[0] - fcW / 2 - 0.45, fcPos[1], 0]);
  const qMarkR = fitText('?', 28, C.pink, 0.8, true, true); qMarkR.moveTo([fcPos[0] + fcW / 2 + 0.45, fcPos[1], 0]);
  const fcPink = new M.RoundedRectangle({ width: fcW + 0.16, height: fcH + 0.16, cornerRadius: 0.2, color: C.pink, strokeWidth: 2.5 });
  fcPink.moveTo(fcPos);

  await until(S(4));
  await play(
    ...out(northShop, southShop, tlLine, dotMon, lblMon, dotTue, lblTue, dotWed, lblWed, wedRing, lookBack, wedTag),
    new M.Create(fcPink, { runTime: 0.7 }),
    new M.FadeIn(qMarkL, { runTime: 0.6 }),
    new M.FadeIn(qMarkR, { runTime: 0.6 }),
    ...say('IS "$34" ALONE ENOUGH?', C.pink)
  );

  // ==================== ACT 2: 5..17 Dawn snapshot, 4 tickets, running sum, rule ====================
  const dawnCX = P ? 0 : -2.35, dawnY = P ? -0.95 : -0.15;
  const dawnW = P ? 7.1 : 7.5, dawnH = P ? 3.8 : 2.85;
  const dawnBox = new M.RoundedRectangle({ width: dawnW, height: dawnH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.2 });
  dawnBox.setFill(C.card, 0.55); dawnBox.moveTo([dawnCX, dawnY, 0]);
  const dawnHdr0 = fitText('TUESDAY MORNING SALES RECORDS', P ? 15 : 16, C.muted, dawnW - 0.5, true, true);
  dawnHdr0.moveTo([dawnCX, dawnY + dawnH / 2 - 0.32, 0]);

  // 6: Named Dawn, 4 empty ticket slots
  const dawnHdr = fitText('SNAPSHOT: DAWN  (Monday sales)', P ? 16 : 17, C.cyan, dawnW - 0.5, true, true);
  dawnHdr.moveTo([dawnCX, dawnY + dawnH / 2 - 0.32, 0]);
  const tW = P ? 3.1 : 1.56, tH = P ? 1.2 : 1.85;
  const tPos = P
    ? [[-1.68, dawnY + 0.35, 0], [1.68, dawnY + 0.35, 0], [-1.68, dawnY - 1.05, 0], [1.68, dawnY - 1.05, 0]]
    : [0, 1, 2, 3].map(k => [dawnCX + (k - 1.5) * 1.76, dawnY - 0.22, 0]);
  const slots = tPos.map(p => {
    const r = new M.RoundedRectangle({ width: tW, height: tH, cornerRadius: 0.13, color: C.line, strokeWidth: 1.5 });
    r.setFill(C.bg, 0.4); r.moveTo(p); return r;
  });

  const slotQ = tPos.map(p => { const q = fitText('?', 30, C.muted, 1, true, true); q.moveTo(p); return q; });

  await until(S(5));
  await play(
    ...out(fcBox, fcHead, fcVal, fcPink, qMarkL, qMarkR),
    new M.Create(dawnBox, { runTime: 0.8 }),
    new M.FadeIn(dawnHdr0, { runTime: 0.7 }),
    new M.LaggedStart(slots.map(s0 => new M.FadeIn(s0, { runTime: 0.5 })), { lagRatio: 0.15, runTime: 0.9 }),
    ...slotQ.map(q => new M.FadeIn(q, { runTime: 0.7 })),
    ...say('TUESDAY MORNING SALES RECORDS', C.cyan)
  );

  await until(S(6));
  await play(
    new M.FadeOut(dawnHdr0, { runTime: 0.4 }),
    new M.FadeIn(dawnHdr, { runTime: 0.6 }),
    ...say('SNAPSHOT: DAWN (4 TICKETS)', C.cyan)
  );

  // 7..10: Tickets A ($4), C ($6), D ($10), E ($14)
  const dawnData = [
    ['A', 'North', 'Mon 9a', 4],
    ['C', 'South', 'Mon 10a', 6],
    ['D', 'South', 'Mon 12p', 10],
    ['E', 'South', 'Mon 2p', 14]
  ];
  const tickets = dawnData.map(([id, shop, tm, amt], i) => ticketSlip(id, shop, tm, amt, tPos[i], tW, tH));

  for (let i = 0; i < 4; i++) {
    await until(S(7 + i));
    const col = dawnData[i][1] === 'North' ? C.cyan : C.amber;
    await play(
      new M.FadeOut(slotQ[i], { runTime: 0.3 }), new M.FadeIn(tickets[i], { runTime: 0.6 }),
      new M.Flash(tickets[i], { color: col, flashRadius: 0.28, lineLength: 0.18, runTime: 0.7 })
    );
  }

  // 11: 4 + 6 = 10
  await until(S(11));
  await play(
    new M.Indicate(tickets[0], { color: C.amber, runTime: 0.8 }),
    new M.Indicate(tickets[1], { color: C.amber, runTime: 0.8 }),
    ...fbox(['Dawn total', ['4 + 6 = $10', C.amber]], C.amber),
    ...say('ADD THE 4 TICKETS', C.amber)
  );

  // 12: + 10 = 20
  await until(S(12));
  await play(
    new M.Indicate(tickets[2], { color: C.amber, runTime: 0.8 }),
    ...fbox(['Dawn total', '4 + 6 = 10', ['10 + 10 = $20', C.amber]], C.amber)
  );

  // 13: + 14 = 34
  await until(S(13));
  await play(
    new M.Indicate(tickets[3], { color: C.amber, runTime: 0.8 }),
    ...fbox(['Dawn total', '10 + 10 = 20', ['20 + 14 = $34', C.amber]], C.amber),
    ...say('MONDAY TOTAL = $34', C.amber)
  );

  // 14: Simple rule
  await until(S(14));
  await play(
    ...fbox([['bakery rule', C.green], 'simple forecast rule'], C.green),
    ...say('A SIMPLE FORECAST RULE', C.green)
  );

  // 15: Today = yesterday (rule bar below Dawn)
  const ruleY = P ? -3.85 : -2.28;
  const rBW = P ? 2.85 : 3.0, rBH = P ? 0.92 : 0.84;
  const monBoxP = [dawnCX - (P ? 1.95 : 2.1), ruleY, 0];
  const tueBoxP = [dawnCX + (P ? 1.95 : 2.1), ruleY, 0];
  const monBox = new M.RoundedRectangle({ width: rBW, height: rBH, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  monBox.setFill(C.card, 0.95); monBox.moveTo(monBoxP);
  const monLbl = fitText('Yesterday (Mon)', P ? 14 : 15, C.cyan, rBW - 0.25, true);
  monLbl.moveTo([monBoxP[0], monBoxP[1] + 0.18, 0]);
  const tueBox = new M.RoundedRectangle({ width: rBW, height: rBH, cornerRadius: 0.14, color: C.amber, strokeWidth: 2 });
  tueBox.setFill(C.card, 0.95); tueBox.moveTo(tueBoxP);
  const tueLbl = fitText('Today (Tue)', P ? 14 : 15, C.amber, rBW - 0.25, true);
  tueLbl.moveTo([tueBoxP[0], tueBoxP[1] + 0.18, 0]);
  const ruleArr = makeArrow([monBoxP[0] + rBW / 2 + 0.12, ruleY, 0], [tueBoxP[0] - rBW / 2 - 0.12, ruleY, 0], C.green, 2.8, 0.16);

  await until(S(15));
  await play(
    new M.FadeIn(monBox, { runTime: 0.6 }),
    new M.FadeIn(monLbl, { runTime: 0.6 }),
    new M.FadeIn(ruleArr, { runTime: 0.6 }),
    new M.FadeIn(tueBox, { runTime: 0.6 }),
    new M.FadeIn(tueLbl, { runTime: 0.6 }),
    ...fbox([['bakery rule', C.green], 'today = yesterday'], C.green),
    ...say('TODAY = YESTERDAY', C.green)
  );

  // 16: Monday's saved sales total $34
  const monVal = fitText('$34', 22, C.cyan, 1.5, true, true); monVal.moveTo([monBoxP[0], monBoxP[1] - 0.18, 0]);
  await until(S(16));
  await play(
    new M.FadeIn(monVal, { runTime: 0.6 }),
    new M.Indicate(monBox, { color: C.cyan, runTime: 0.8 }),
    ...fbox(['Monday (Dawn)', ['total = $34', C.cyan]], C.cyan)
  );

  // 17: So the computer predicts $34 for Tuesday
  const tueVal = fitText('$34', 22, C.amber, 1.5, true, true); tueVal.moveTo([tueBoxP[0], tueBoxP[1] - 0.18, 0]);
  await until(S(17));
  await play(
    new M.FadeIn(tueVal, { runTime: 0.6 }),
    new M.Flash(tueVal, { color: C.amber, flashRadius: 0.25, lineLength: 0.18, runTime: 0.7 }),
    ...fbox(['Monday (Dawn) = $34', ['Tue forecast  = $34', C.amber]], C.amber),
    ...say('TUESDAY FORECAST = $34', C.amber)
  );

  // ==================== ACT 3: 18..26 Weeks later, Baker analogy, Definitions ====================
  const wY1 = P ? 1.4 : 0.45;
  const wLPos = [P ? -1.9 : -3.2, wY1, 0], wRPos = [P ? 1.9 : 3.2, wY1, 0];
  const wW = P ? 2.9 : 3.4, wH = 1.1;
  const wLeft = new M.VGroup(
    (() => { const r = new M.RoundedRectangle({ width: wW, height: wH, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(wLPos); return r; })(),
    fitText('Tue 7:00 a.m.', P ? 15 : 17, C.cyan, wW - 0.3, true, true).moveTo([wLPos[0], wLPos[1] + 0.18, 0]),
    fitText('Forecast: $34', P ? 16 : 18, C.amber, wW - 0.3, true, true).moveTo([wLPos[0], wLPos[1] - 0.22, 0])
  );
  const wRight = new M.VGroup(
    (() => { const r = new M.RoundedRectangle({ width: wW, height: wH, cornerRadius: 0.14, color: C.violet, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(wRPos); return r; })(),
    fitText('Weeks later', P ? 16 : 18, C.violet, wW - 0.3, true, true).moveTo([wRPos[0], wRPos[1] + 0.18, 0]),
    fitText('Repeat work?', P ? 15 : 17, C.ink, wW - 0.3, true).moveTo([wRPos[0], wRPos[1] - 0.22, 0])
  );
  const wArr = makeArrow([wLPos[0] + wW / 2 + 0.15, wY1, 0], [wRPos[0] - wW / 2 - 0.15, wY1, 0], C.violet, 2.5, 0.16);

  await until(S(18));
  await play(
    ...out(dawnBox, dawnHdr, ...slots, ...tickets, monBox, monLbl, monVal, tueBox, tueLbl, tueVal, ruleArr),
    ...clearBox(),
    new M.FadeIn(wLeft, { runTime: 0.7 }),
    new M.FadeIn(wArr, { runTime: 0.7 }),
    new M.FadeIn(wRight, { runTime: 0.7 }),
    ...say('SEVERAL WEEKS LATER...', C.violet)
  );

  // 19: Sales records may have changed, instructions may differ
  const warnPos1 = P ? [0, -0.55, 0] : [-2.85, -1.35, 0];
  const warnPos2 = P ? [0, -2.0, 0] : [2.85, -1.35, 0];
  const warnW = P ? 6.2 : 5.0, warnH = P ? 1.0 : 1.05;
  const makeWarn = (txt, pos) => {
    const r = new M.RoundedRectangle({ width: warnW, height: warnH, cornerRadius: 0.14, color: C.pink, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const t = fitText(txt, P ? 17 : 18, C.pink, warnW - 0.4, false, true); t.moveTo(pos);
    return new M.VGroup(r, t);
  };
  const warn1 = makeWarn('Sales records may have changed?', warnPos1);
  const warn2 = makeWarn('Instructions may be different?', warnPos2);

  await until(S(19));
  await play(
    new M.LaggedStart([new M.FadeIn(warn1, { runTime: 0.7 }), new M.FadeIn(warn2, { runTime: 0.7 })], { lagRatio: 0.4, runTime: 1.4 }),
    ...say('DATA OR INSTRUCTIONS MAY CHANGE', C.pink)
  );

  // 20: Baker analogy — bread loaf
  const loafP = P ? [0, 1.55, 0] : [-3.5, -0.35, 0];
  const loafDome = new M.Arc({ radius: 1.15, startAngle: 0, angle: Math.PI, color: C.amber, strokeWidth: 3 });
  loafDome.setFill(C.amber, 0.22); loafDome.moveTo([loafP[0], loafP[1] + 0.15, 0]);
  const loafBase = new M.Line({ start: [loafP[0] - 1.15, loafP[1] - 0.42, 0], end: [loafP[0] + 1.15, loafP[1] - 0.42, 0], color: C.amber, strokeWidth: 3 });
  const score1 = new M.Line({ start: [loafP[0] - 0.55, loafP[1] + 0.32, 0], end: [loafP[0] - 0.25, loafP[1] + 0.02, 0], color: C.amber, strokeWidth: 2.5 });
  const score2 = new M.Line({ start: [loafP[0] - 0.05, loafP[1] + 0.42, 0], end: [loafP[0] + 0.25, loafP[1] + 0.08, 0], color: C.amber, strokeWidth: 2.5 });
  const score3 = new M.Line({ start: [loafP[0] + 0.42, loafP[1] + 0.32, 0], end: [loafP[0] + 0.68, loafP[1] + 0.02, 0], color: C.amber, strokeWidth: 2.5 });
  const loafLbl = fitText('Same bread again', P ? 18 : 19, C.amber, 3.2, false, true);
  loafLbl.moveTo([loafP[0], loafP[1] - 0.85, 0]);
  const bread = new M.VGroup(loafDome, loafBase, score1, score2, score3, loafLbl);

  await until(S(20));
  await play(
    ...out(wLeft, wRight, wArr, warn1, warn2),
    new M.FadeIn(bread, { runTime: 0.8 }),
    ...say('MAKING THE SAME BREAD AGAIN', C.amber)
  );

  // 21: Baker's 4 details
  const bakerItems = [
    ['1. Recipe', C.cyan],
    ['2. Ingredients', C.amber],
    ['3. Oven used', C.violet],
    ['4. Temperature', C.green]
  ];
  const bW = P ? 5.8 : 4.8, bH = P ? 0.72 : 0.68;
  const bakerChips = bakerItems.map(([txt, col], i) => {
    const pos = P ? [0, -0.35 - i * 0.95, 0] : [2.3, 0.9 - i * 0.86, 0];
    const r = new M.RoundedRectangle({ width: bW, height: bH, cornerRadius: 0.14, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const t = fitText(txt, P ? 18 : 19, col, bW - 0.5, true, true);
    t.moveTo([pos[0] - bW / 2 + 0.35 + t.getWidth() / 2, pos[1], 0]);
    return new M.VGroup(r, t);
  });

  await until(S(21));
  await play(
    new M.LaggedStart(bakerChips.map(c0 => new M.FadeIn(c0, { runTime: 0.6 })), { lagRatio: 0.35, runTime: 2.2 }),
    ...say('4 DETAILS WRITTEN DOWN', C.cyan)
  );

  // 22: Recording only the finished bread is not enough
  const breadWarn = new M.RoundedRectangle({ width: 3.1, height: 2.35, cornerRadius: 0.18, color: C.pink, strokeWidth: 2.5 });
  breadWarn.moveTo([loafP[0], loafP[1] - 0.1, 0]);
  const notEnough = fitText('NOT ENOUGH ALONE', P ? 16 : 17, C.pink, 3.0, true, true);
  notEnough.moveTo([loafP[0], loafP[1] - 1.55, 0]);

  await until(S(22));
  await play(
    ...out(...bakerChips),
    new M.Create(breadWarn, { runTime: 0.7 }),
    new M.FadeIn(notEnough, { runTime: 0.6 }),
    ...say('ONLY THE BREAD IS NOT ENOUGH', C.pink)
  );

  // 23: Similar record for our forecast
  const blankCard = new M.RoundedRectangle({ width: P ? 6.2 : 6.6, height: P ? 3.2 : 2.6, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.2 });
  blankCard.setFill(C.card, 0.8); blankCard.moveTo([0, P ? -0.4 : -0.35, 0]);
  const blankTxt = fitText('FORECAST RECORD', P ? 22 : 24, C.cyan, 5.4, true, true);
  blankTxt.moveTo([0, P ? -0.4 : -0.35, 0]);

  await until(S(23));
  await play(
    ...out(bread, breadWarn, notEnough),
    new M.Create(blankCard, { runTime: 0.7 }),
    new M.FadeIn(blankTxt, { runTime: 0.6 }),
    ...say('SAME IDEA FOR OUR FORECAST', C.cyan)
  );

  // 24..26: Definitions (Run, Experiment, Experiment tracking)
  const defW = P ? 7.0 : 9.4, defH = P ? 1.45 : 1.05;
  const defYs = P ? [1.65, -0.35, -2.35] : [0.75, -0.55, -1.85];
  function defCard(term, desc, color, y) {
    const r = new M.RoundedRectangle({ width: defW, height: defH, cornerRadius: 0.15, color, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95); r.moveTo([0, y, 0]);
    const tTerm = fitText(term, P ? 18 : 20, color, defW - 0.5, true, true);
    const tDesc = fitText(desc, P ? 16 : 17, C.ink, defW - 0.5, false, false);
    if (P) {
      tTerm.moveTo([0, y + 0.3, 0]);
      tDesc.moveTo([0, y - 0.25, 0]);
    } else {
      tTerm.moveTo([-defW / 2 + 0.38 + tTerm.getWidth() / 2, y, 0]);
      tDesc.moveTo([defW / 2 - 0.38 - tDesc.getWidth() / 2, y, 0]);
    }
    return new M.VGroup(r, tTerm, tDesc);
  }
  const def1 = defCard('RUN', 'Computer follows instructions → produces a result', C.cyan, defYs[0]);
  const def2 = defCard('EXPERIMENT', 'Try a method and study its result', C.amber, defYs[1]);
  const def3 = defCard('EXPERIMENT TRACKING', 'Record how each run works and what it produces', C.green, defYs[2]);

  await until(S(24));
  await play(...out(blankCard, blankTxt), new M.FadeIn(def1, { runTime: 0.8 }), ...say('RUN = ONE EXECUTION → RESULT', C.cyan));
  await until(S(25));
  await play(new M.FadeIn(def2, { runTime: 0.8 }), ...say('EXPERIMENT = TRY & STUDY', C.amber));
  await until(S(26));
  await play(new M.FadeIn(def3, { runTime: 0.8 }), ...say('EXPERIMENT TRACKING', C.green));

  // ==================== ACT 4: 27..44 Build the Tuesday Morning Run Card ====================
  const rcCX = P ? 0 : -2.35, rcY = P ? -1.55 : -0.45;
  const rcW = P ? 7.2 : 7.5, rcH = P ? 5.3 : 4.25;
  const rcFrame = new M.RoundedRectangle({ width: rcW, height: rcH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.4 });
  rcFrame.setFill(C.card, 0.96); rcFrame.moveTo([rcCX, rcY, 0]);
  const rcHead = fitText('RUN CARD · TUESDAY MORNING', P ? 16 : 17, C.cyan, rcW - 0.5, true, true);
  rcHead.moveTo([rcCX, rcY + rcH / 2 - 0.34, 0]);

  const rowH = P ? 0.74 : 0.58;
  const rowW = rcW - 0.5;
  const rowYs = [0, 1, 2, 3, 4].map(k => rcY + rcH / 2 - (P ? 1.0 : 0.86) - k * (P ? 0.86 : 0.68) - (k === 4 ? (P ? 0.16 : 0.12) : 0));
  const rcDiv = new M.Line({
    start: [rcCX - rowW / 2, (rowYs[3] + rowYs[4]) / 2, 0],
    end: [rcCX + rowW / 2, (rowYs[3] + rowYs[4]) / 2, 0],
    color: C.line, strokeWidth: 2
  });
  const rowBgs = rowYs.map(y => {
    const r = new M.RoundedRectangle({ width: rowW, height: rowH, cornerRadius: 0.1, color: C.line, strokeWidth: 1.5 });
    r.setFill(C.bg, 0.65); r.moveTo([rcCX, y, 0]); return r;
  });

  const leftEdge = rcCX - rowW / 2 + 0.24;
  const rightEdge = rcCX + rowW / 2 - 0.24;
  const keyText = (s, col, rowIdx) => {
    const t = fitText(s, P ? 15 : 16, col, rowW * 0.48, true, true);
    t.moveTo([leftEdge + t.getWidth() / 2, rowYs[rowIdx], 0]); return t;
  };
  const valText = (s, col, rowIdx) => {
    const t = fitText(s, P ? 16 : 17, col, rowW * 0.5, true, true);
    t.moveTo([rightEdge - t.getWidth() / 2, rowYs[rowIdx], 0]); return t;
  };
  const rowHighlight = (rowIdx, col) => {
    const r = new M.RoundedRectangle({ width: rowW, height: rowH, cornerRadius: 0.1, color: col, strokeWidth: 2.2 });
    r.moveTo([rcCX, rowYs[rowIdx], 0]); return r;
  };

  await until(S(27));
  await play(
    ...out(def1, def2, def3),
    new M.Create(rcFrame, { runTime: 0.7 }),
    new M.FadeIn(rcHead, { runTime: 0.7 }),
    new M.FadeIn(rcDiv, { runTime: 0.6 }),
    new M.LaggedStart(rowBgs.map(b => new M.FadeIn(b, { runTime: 0.4 })), { lagRatio: 0.12, runTime: 0.8 }),
    ...say('BUILD THE RUN CARD', C.cyan)
  );

  // 28: First, instructions
  const k0a = keyText('1. INSTRUCTIONS', C.cyan, 0);
  const hl0 = rowHighlight(0, C.cyan);
  await until(S(28));
  await play(new M.Create(hl0, { runTime: 0.6 }), new M.FadeIn(k0a, { runTime: 0.6 }), ...say('1. INSTRUCTIONS', C.cyan));

  // 29: Called code
  const k0b = keyText('1. CODE', C.cyan, 0);
  await until(S(29));
  await play(new M.FadeOut(k0a, { runTime: 0.4 }), new M.FadeIn(k0b, { runTime: 0.6 }), ...say('CODE = COMPUTER INSTRUCTIONS', C.cyan));

  // 30: Baseline One
  const v0 = valText('Baseline One', C.ink, 0);
  await until(S(30));
  await play(new M.FadeIn(v0, { runTime: 0.6 }), new M.Flash(v0, { color: C.cyan, flashRadius: 0.22, lineLength: 0.15, runTime: 0.7 }), ...say('CODE: BASELINE ONE', C.cyan));

  // 31: Second, exact copy of sales records
  const k1 = keyText('2. DATA', C.amber, 1);
  const hl1 = rowHighlight(1, C.amber);
  await until(S(31));
  await play(new M.Create(hl1, { runTime: 0.6 }), new M.FadeIn(k1, { runTime: 0.6 }), ...say('2. EXACT DATA COPY', C.amber));

  // 32: Write Dawn (short beat: 1.57s)
  const v1 = valText('Dawn', C.amber, 1);
  await until(S(32));
  await play(new M.FadeIn(v1, { runTime: 0.5 }), new M.Flash(v1, { color: C.amber, flashRadius: 0.22, lineLength: 0.15, runTime: 0.6 }), ...say('DATA: DAWN', C.amber));

  // 33: Third, programs and their versions
  const k2a = keyText('3. PROGRAMS & VERSIONS', C.violet, 2);
  const hl2 = rowHighlight(2, C.violet);
  await until(S(33));
  await play(new M.Create(hl2, { runTime: 0.6 }), new M.FadeIn(k2a, { runTime: 0.6 }), ...say('3. PROGRAMS & VERSIONS', C.violet));

  // 34: Software environment
  const k2b = keyText('3. ENVIRONMENT', C.violet, 2);
  await until(S(34));
  await play(new M.FadeOut(k2a, { runTime: 0.4 }), new M.FadeIn(k2b, { runTime: 0.6 }), ...say('SOFTWARE ENVIRONMENT', C.violet));

  // 35: Bakery Setup
  const v2 = valText('Bakery Setup', C.ink, 2);
  await until(S(35));
  await play(new M.FadeIn(v2, { runTime: 0.6 }), new M.Flash(v2, { color: C.violet, flashRadius: 0.22, lineLength: 0.15, runTime: 0.7 }), ...say('ENVIRONMENT: BAKERY SETUP', C.violet));

  // 36: Fourth, choices
  const k3a = keyText('4. CHOICES', C.green, 3);
  const hl3 = rowHighlight(3, C.green);
  await until(S(36));
  await play(new M.Create(hl3, { runTime: 0.6 }), new M.FadeIn(k3a, { runTime: 0.6 }), ...say('4. CHOICES FOR THE CODE', C.green));

  // 37: Called settings (short beat: 2.11s)
  const k3b = keyText('4. SETTINGS', C.green, 3);
  await until(S(37));
  await play(new M.FadeOut(k3a, { runTime: 0.4 }), new M.FadeIn(k3b, { runTime: 0.5 }), ...say('SETTINGS = CHOICES', C.green));

  // 38: 1 previous day
  const v3 = valText('1 previous day', C.ink, 3);
  await until(S(38));
  await play(new M.FadeIn(v3, { runTime: 0.6 }), new M.Flash(v3, { color: C.green, flashRadius: 0.22, lineLength: 0.15, runTime: 0.7 }), ...say('SETTINGS: 1 PREVIOUS DAY', C.green));

  // 39: Result $34 and time Tue 7:00 a.m.
  const k4 = keyText('RESULT', C.amber, 4);
  const v4 = valText('$34 · Tue 7:00 a.m.', C.amber, 4);
  const hl4 = rowHighlight(4, C.amber);
  await until(S(39));
  await play(
    new M.Create(hl4, { runTime: 0.6 }),
    new M.FadeIn(k4, { runTime: 0.6 }),
    new M.FadeIn(v4, { runTime: 0.6 }),
    new M.Flash(v4, { color: C.amber, flashRadius: 0.28, lineLength: 0.18, runTime: 0.8 }),
    ...say('RESULT: $34 AT TUE 7:00 A.M.', C.amber)
  );

  // 40: Run card connects the result to everything used
  await until(S(40));
  await play(
    new M.LaggedStart([hl0, hl1, hl2, hl3, hl4].map(h0 => new M.Indicate(h0, { color: C.green, runTime: 0.7 })), { lagRatio: 0.22, runTime: 2.2 }),
    ...say('RESULT LINKED TO ALL 4 DETAILS', C.green)
  );

  // 41: Forecast rule in one short line, called a formula
  await until(S(41));
  await play(
    ...fbox([['formula', C.cyan], 'rule in one short line'], C.cyan),
    ...say('FORMULA = RULE IN ONE LINE', C.cyan)
  );

  // 42: Formula text
  await until(S(42));
  await play(
    ...fbox([['forecast =', C.cyan], '  previous day total', '  from saved copy', ['  (Dawn → $34)', C.amber]], C.cyan),
    ...say('DEPENDS ON THE SELECTED COPY', C.amber)
  );

  // 43: Repeat earlier work & compare different runs
  await until(S(43));
  await play(
    new M.Indicate(rcFrame, { color: C.green, runTime: 0.9 }),
    ...fbox([['experiment tracking', C.green], '  • repeat earlier work', '  • compare results'], C.green),
    ...say('REPEAT WORK · COMPARE RUNS', C.green)
  );

  // 44: Forget to record which saved copy we used
  const v1Miss = valText('??? (not recorded)', C.pink, 1);
  const hl1Pink = rowHighlight(1, C.pink);
  await until(S(44));
  await play(
    ...clearBox(),
    new M.FadeOut(v1, { runTime: 0.4 }),
    new M.FadeOut(hl1, { runTime: 0.4 }),
    new M.Create(hl1Pink, { runTime: 0.6 }),
    new M.FadeIn(v1Miss, { runTime: 0.6 }),
    ...say('WHAT IF WE FORGET THE DATA?', C.pink)
  );

  // ==================== ACT 5: 45..51 Snapshot Updated (+B $8 -> $42), Compare, Recap ====================
  const cW = P ? 7.1 : 6.0, cH = P ? 3.55 : 4.25;
  const c1P = P ? [0, 1.35, 0] : [-3.3, -0.45, 0];
  const c2P = P ? [0, -2.55, 0] : [3.3, -0.45, 0];

  const c1Frame = new M.RoundedRectangle({ width: cW, height: cH, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2.2 });
  c1Frame.setFill(C.card, 0.94); c1Frame.moveTo(c1P);
  const c1Hdr = fitText('DAWN · Tue 6:00 a.m.', P ? 15 : 16, C.cyan, cW - 0.4, true, true);
  c1Hdr.moveTo([c1P[0], c1P[1] + cH / 2 - 0.3, 0]);

  const mW = P ? 1.18 : 1.02, mH = P ? 0.72 : 0.78;
  const mtY1 = c1P[1] + cH / 2 - (P ? 1.15 : 1.25);
  const dawnMinis = [
    ['A', 'North', 4], ['C', 'South', 6], ['D', 'South', 10], ['E', 'South', 14]
  ].map(([id, sh, amt], i) => miniTicket(id, sh, amt, [c1P[0] + (i - 1.5) * (mW + 0.12), mtY1, 0], mW, mH));
  const c1Tot = fitText('Monday total = $34', P ? 15 : 16, C.amber, cW - 0.5, true, true);
  c1Tot.moveTo([c1P[0], mtY1 - (P ? 0.62 : 0.72), 0]);

  const c2Frame = new M.RoundedRectangle({ width: cW, height: cH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.2 });
  c2Frame.setFill(C.card, 0.94); c2Frame.moveTo(c2P);
  const c2Hdr = fitText('UPDATED · Tue 8:30 a.m.', P ? 15 : 16, C.amber, cW - 0.4, true, true);
  c2Hdr.moveTo([c2P[0], c2P[1] + cH / 2 - 0.3, 0]);

  await until(S(45));
  await play(
    ...out(rcFrame, rcHead, rcDiv, ...rowBgs, hl0, hl1Pink, hl2, hl3, hl4, k0b, v0, k1, v1Miss, k2b, v2, k3b, v3, k4, v4),
    new M.FadeIn(c1Frame, { runTime: 0.7 }),
    new M.FadeIn(c1Hdr, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...dawnMinis), { runTime: 0.7 }),
    new M.FadeIn(c1Tot, { runTime: 0.7 }),
    new M.Create(c2Frame, { runTime: 0.8 }),
    new M.FadeIn(c2Hdr, { runTime: 0.7 }),
    ...say('8:30 A.M. · SNAPSHOT UPDATED', C.amber)
  );

  // 46: Updated includes late ticket B ($8)
  const mtY2 = c2P[1] + cH / 2 - (P ? 1.15 : 1.25);
  const mW5 = P ? 1.18 : 1.02;
  const updOrder = [['A', 'North', 4, false], ['B', 'North', 8, true], ['C', 'South', 6, false], ['D', 'South', 10, false], ['E', 'South', 14, false]];
  const updMinis = updOrder.map(([id, sh, amt, late], i) =>
    miniTicket(id, sh, amt, [c2P[0] + (i - 2) * (mW5 + 0.12), mtY2, 0], mW5, mH, late)
  );
  const lateTag = fitText('LATE +$8', 15, C.pink, 1.6, true, true);
  lateTag.moveTo([c2P[0] - (mW5 + 0.12), c2P[1] + cH / 2 - (P ? 0.64 : 0.66), 0]);

  await until(S(46));
  await play(
    new M.LaggedStart(updMinis.map(m => new M.FadeIn(m, { runTime: 0.5 })), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(lateTag, { runTime: 0.6 }),
    new M.Flash(updMinis[1], { color: C.pink, flashRadius: 0.28, lineLength: 0.18, runTime: 0.8 }),
    ...say('LATE TICKET B (+$8)', C.pink)
  );

  // 47: 34 + 8 = 42
  const c2Tot = fitText('$34 + $8 = $42', P ? 16 : 17, C.amber, cW - 0.5, true, true);
  c2Tot.moveTo([c2P[0], mtY2 - (P ? 0.62 : 0.72), 0]);

  await until(S(47));
  await play(
    new M.FadeIn(c2Tot, { runTime: 0.6 }),
    new M.Flash(c2Tot, { color: C.amber, flashRadius: 0.25, lineLength: 0.16, runTime: 0.7 }),
    ...say('34 + 8 = $42', C.amber)
  );

  // 48: Same instructions -> $34 vs $42
  const mkRowLine = (cx, y, txt, col) => fitText(txt, P ? 14 : 15, col, cW - 0.6, true, true).moveTo([cx, y, 0]);
  const r1Y = c1P[1] - (P ? 0.42 : 0.52), r2Y = c1P[1] - (P ? 0.88 : 1.05), r3Y = c1P[1] - (P ? 1.38 : 1.62);
  const s1Y = c2P[1] - (P ? 0.42 : 0.52), s2Y = c2P[1] - (P ? 0.88 : 1.05), s3Y = c2P[1] - (P ? 1.38 : 1.62);

  const c1Code = mkRowLine(c1P[0], r1Y, 'Code: Baseline One', C.ink);
  const c1Data = mkRowLine(c1P[0], r2Y, 'Data: Dawn', C.cyan);
  const c1Res = mkRowLine(c1P[0], r3Y, 'Forecast: $34', C.amber);

  const c2Code = mkRowLine(c2P[0], s1Y, 'Code: Baseline One', C.ink);
  const c2Data = mkRowLine(c2P[0], s2Y, 'Data: Updated', C.amber);
  const c2Res = mkRowLine(c2P[0], s3Y, 'Forecast: $42', C.amber);

  await until(S(48));
  await play(
    new M.FadeIn(c1Code, { runTime: 0.6 }), new M.FadeIn(c1Data, { runTime: 0.6 }), new M.FadeIn(c1Res, { runTime: 0.6 }),
    new M.FadeIn(c2Code, { runTime: 0.6 }), new M.FadeIn(c2Data, { runTime: 0.6 }), new M.FadeIn(c2Res, { runTime: 0.6 }),
    ...say('SAME CODE → $34 VS $42', C.amber)
  );

  // 49: Data changed, code stayed the same
  const boxH = P ? 0.36 : 0.42, boxW = cW - 0.55;
  const same1 = new M.RoundedRectangle({ width: boxW, height: boxH, cornerRadius: 0.08, color: C.green, strokeWidth: 2 }); same1.moveTo([c1P[0], r1Y, 0]);
  const same2 = new M.RoundedRectangle({ width: boxW, height: boxH, cornerRadius: 0.08, color: C.green, strokeWidth: 2 }); same2.moveTo([c2P[0], s1Y, 0]);
  const diff1 = new M.RoundedRectangle({ width: boxW, height: boxH, cornerRadius: 0.08, color: C.pink, strokeWidth: 2.5 }); diff1.moveTo([c1P[0], r2Y, 0]);
  const diff2 = new M.RoundedRectangle({ width: boxW, height: boxH, cornerRadius: 0.08, color: C.pink, strokeWidth: 2.5 }); diff2.moveTo([c2P[0], s2Y, 0]);

  await until(S(49));
  await play(
    new M.Create(same1, { runTime: 0.6 }), new M.Create(same2, { runTime: 0.6 }),
    new M.Create(diff1, { runTime: 0.6 }), new M.Create(diff2, { runTime: 0.6 }),
    new M.Indicate(diff1, { color: C.pink, runTime: 0.9 }),
    new M.Indicate(diff2, { color: C.pink, runTime: 0.9 }),
    ...say('DATA CHANGED · CODE STAYED SAME', C.pink)
  );

  // 50: Without run card, mystery!
  const maskH = P ? 0.92 : 1.05;
  const mkMask = (cx, y) => {
    const r = new M.RoundedRectangle({ width: boxW + 0.1, height: maskH, cornerRadius: 0.1, color: C.pink, strokeWidth: 2.2 });
    r.setFill(C.bg, 0.96); r.moveTo([cx, y, 0]);
    const t = fitText('???  (no run card)', P ? 15 : 16, C.pink, boxW - 0.2, true, true); t.moveTo([cx, y, 0]);
    return new M.VGroup(r, t);
  };
  const mask1 = mkMask(c1P[0], (r1Y + r2Y) / 2);
  const mask2 = mkMask(c2P[0], (s1Y + s2Y) / 2);
  const midQ = fitText('?', 34, C.pink, 1.0, true, true);
  midQ.moveTo([0, P ? -0.6 : -0.45, 0]);

  await until(S(50));
  await play(
    new M.FadeIn(mask1, { runTime: 0.6 }),
    new M.FadeIn(mask2, { runTime: 0.6 }),
    new M.FadeIn(midQ, { runTime: 0.6 }),
    ...say('NO RUN CARD → MYSTERY', C.pink)
  );

  // 51: Recap — connects each result to code, data, software environment and settings
  const finW = P ? 7.2 : 8.8, finH = P ? 5.6 : 4.25;
  const finY = P ? -0.95 : -0.45;
  const finBox = new M.RoundedRectangle({ width: finW, height: finH, cornerRadius: 0.2, color: C.green, strokeWidth: 2.5 });
  finBox.setFill(C.card, 0.96); finBox.moveTo([0, finY, 0]);
  const finHdr = fitText('EXPERIMENT TRACKING · RUN CARD', P ? 16 : 18, C.green, finW - 0.5, true, true);
  finHdr.moveTo([0, finY + finH / 2 - 0.36, 0]);

  const recapRows = [
    ['1. CODE', 'Baseline One', C.cyan],
    ['2. DATA', 'Dawn (or Updated)', C.amber],
    ['3. ENVIRONMENT', 'Bakery Setup', C.violet],
    ['4. SETTINGS', '1 previous day', C.green],
    ['RESULT', '$34 · Tue 7:00 a.m.', C.amber]
  ];
  const fRowW = finW - 0.6, fRowH = P ? 0.78 : 0.58;
  const fLeft = -fRowW / 2 + 0.25, fRight = fRowW / 2 - 0.25;
  const fCards = recapRows.map(([k, v, col], i) => {
    const y = finY + finH / 2 - (P ? 1.08 : 0.88) - i * (P ? 0.92 : 0.69) - (i === 4 ? 0.1 : 0);
    const r = new M.RoundedRectangle({ width: fRowW, height: fRowH, cornerRadius: 0.1, color: col, strokeWidth: 2 });
    r.setFill(C.bg, 0.72); r.moveTo([0, y, 0]);
    const tk = fitText(k, P ? 15 : 16, col, fRowW * 0.45, true, true); tk.moveTo([fLeft + tk.getWidth() / 2, y, 0]);
    const tv = fitText(v, P ? 15 : 17, i === 4 ? C.amber : C.ink, fRowW * 0.5, true, true); tv.moveTo([fRight - tv.getWidth() / 2, y, 0]);
    return new M.VGroup(r, tk, tv);
  });

  await until(S(51));
  await play(
    ...out(c1Frame, c1Hdr, ...dawnMinis, c1Tot, c2Frame, c2Hdr, ...updMinis, lateTag, c2Tot,
      c1Code, c1Data, c1Res, c2Code, c2Data, c2Res, same1, same2, diff1, diff2, mask1, mask2, midQ),
    new M.FadeIn(finBox, { runTime: 0.7 }),
    new M.FadeIn(finHdr, { runTime: 0.7 }),
    new M.LaggedStart(fCards.map(fc => new M.FadeIn(fc, { runTime: 0.5 })), { lagRatio: 0.18, runTime: 1.5 }),
    ...say('CODE · DATA · ENVIRONMENT · SETTINGS', C.green)
  );
}

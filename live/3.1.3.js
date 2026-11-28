// 3.1.3 API pagination: following every page (live manim-web lesson).
// Beat i = sentence i (0-based, 0..41). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const ORDERS = [
    { id: 101, store: 'North', page: 1, amt: 40, col: C.cyan },
    { id: 102, store: 'South', page: 1, amt: 15, col: C.pink },
    { id: 103, store: 'North', page: 2, amt: 50, col: C.cyan },
    { id: 104, store: 'South', page: 2, amt: 25, col: C.pink },
  ];

  // Layout zones: laptop y in [-3.0, 2.3], phone y in [-5.5, 4.3]
  const PILL = P ? [0, 3.92, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, -3.75, 0] : [4.35, -0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  function fitT(text, size, color = C.ink, maxW = null, mono = false, bold = false) {
    const t = T(text, size, color, mono, bold);
    if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    return t;
  }

  function cardBox(x, y, w, h, color = C.cyan, fill = C.card, op = 0.94, sw = 2) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: sw });
    r.setFill(fill, op);
    r.moveTo([x, y, 0]);
    return r;
  }

  function makeArrow(p1, p2, color = C.amber, sw = 2.6, head = 0.16) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const ang = 0.48;
    const shaft = new M.Line({ start: p1, end: p2, color, strokeWidth: sw });
    const w1 = new M.Line({
      start: p2,
      end: [p2[0] - head * (ux * Math.cos(ang) - uy * Math.sin(ang)), p2[1] - head * (uy * Math.cos(ang) + ux * Math.sin(ang)), 0],
      color, strokeWidth: sw
    });
    const w2 = new M.Line({
      start: p2,
      end: [p2[0] - head * (ux * Math.cos(-ang) - uy * Math.sin(-ang)), p2[1] - head * (uy * Math.cos(-ang) + ux * Math.sin(-ang)), 0],
      color, strokeWidth: sw
    });
    return new M.VGroup(shaft, w1, w2);
  }

  function orderCardRow(x, y, w, h, o, showAmt = false, dim = false) {
    const col = dim ? C.muted : o.col;
    const r = cardBox(x, y, w, h, col, col, dim ? 0.08 : 0.15, dim ? 1.4 : 2);
    const left = fitT(`Order ${o.id} · ${o.store}`, P ? 17 : 18, dim ? C.muted : C.ink, showAmt ? w * 0.62 : w - 0.35, true, true);
    left.moveTo([showAmt ? x - w / 2 + 0.18 + left.getWidth() / 2 : x, y, 0]);
    if (!showAmt) return new M.VGroup(r, left);
    const right = fitT(`$${o.amt}`, P ? 17 : 18, dim ? C.muted : C.amber, w * 0.28, true, true);
    right.moveTo([x + w / 2 - 0.18 - right.getWidth() / 2, y, 0]);
    return new M.VGroup(r, left, right);
  }

  // Formula box: one at a time, matching reference style
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.42 : 0.41;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.96); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }

  // =========================================================================
  // BEATS 0-3: Bookstore website, computer door, API, request
  // =========================================================================
  const CLI = P ? [0, 2.05, 0] : [-4.45, -0.55, 0];
  const SRV = P ? [0, -1.95, 0] : [4.35, -0.55, 0];
  const DOOR = P ? [0, 0.12, 0] : [0, -0.55, 0];
  const cw1 = P ? 6.2 : 3.7, ch1 = P ? 1.55 : 2.8;
  const sw1 = P ? 6.2 : 4.1, sh1 = P ? 2.15 : 2.95;

  const cliBox = cardBox(CLI[0], CLI[1], cw1, ch1, C.cyan);
  const cliTit = fitT('Our program', P ? 20 : 22, C.cyan, cw1 - 0.4, false, true);
  cliTit.moveTo([CLI[0], CLI[1] + (P ? 0.32 : 0.72), 0]);
  const cliSub = fitT('wants every January order', P ? 15 : 16, C.muted, cw1 - 0.4);
  cliSub.moveTo([CLI[0], CLI[1] - (P ? 0.22 : 0.05), 0]);
  const cliCard = new M.VGroup(cliBox, cliTit, cliSub);

  const srvBox = cardBox(SRV[0], SRV[1], sw1, sh1, C.violet);
  const srvTit = fitT('Bookstore website', P ? 20 : 21, C.violet, sw1 - 0.4, false, true);
  srvTit.moveTo([SRV[0], SRV[1] + sh1 / 2 - 0.35, 0]);
  const srvChips = ORDERS.map((o, k) => {
    const col = k % 2, row = Math.floor(k / 2);
    const gx = SRV[0] + (col - 0.5) * (P ? 2.65 : 1.75);
    const gy = SRV[1] + (P ? 0.12 : 0.15) - row * (P ? 0.62 : 0.78);
    const r = cardBox(gx, gy, P ? 2.35 : 1.5, P ? 0.48 : 0.58, o.col, o.col, 0.16, 1.8);
    const t = fitT(`#${o.id}`, P ? 16 : 17, C.ink, 1.3, true, true); t.moveTo([gx, gy, 0]);
    return new M.VGroup(r, t);
  });
  const srvCard = new M.VGroup(srvBox, srvTit, ...srvChips);

  await until(S(0));
  await play(new M.FadeIn(cliCard, { runTime: 1.0 }), new M.FadeIn(srvCard, { runTime: 1.2 }), ...say('BOOKSTORE: ALL JANUARY ORDERS', C.cyan));

  // Beat 1: a door made for computers
  const doorOuter = cardBox(DOOR[0], DOOR[1], P ? 2.6 : 1.55, P ? 0.92 : 1.9, C.amber, C.card, 0.96, 2.5);
  const doorKnob = new M.Dot({ point: [DOOR[0] + (P ? 0.98 : 0.46), DOOR[1], 0], radius: 0.07, color: C.amber });
  const doorLbl1 = fitT('computer door', P ? 16 : 16, C.amber, P ? 2.0 : 1.3, true, true);
  doorLbl1.moveTo([DOOR[0] - (P ? 0.12 : 0), DOOR[1], 0]);
  await until(S(1));
  await play(new M.FadeIn(doorOuter, { runTime: 0.9 }), new M.FadeIn(doorKnob, { runTime: 0.9 }), new M.FadeIn(doorLbl1, { runTime: 0.9 }), ...say('A DOOR MADE FOR COMPUTERS', C.amber));

  // Beat 2: this door is called an API
  const doorLbl2 = fitT('API', P ? 24 : 26, C.amber, 1.3, true, true);
  doorLbl2.moveTo([DOOR[0] - (P ? 0.12 : 0), DOOR[1], 0]);
  const link1 = P
    ? makeArrow([0, CLI[1] - ch1 / 2 - 0.06, 0], [0, DOOR[1] + 0.5, 0], C.muted, 2.2)
    : makeArrow([CLI[0] + cw1 / 2 + 0.08, DOOR[1], 0], [DOOR[0] - 0.84, DOOR[1], 0], C.muted, 2.2);
  const link2 = P
    ? makeArrow([0, DOOR[1] - 0.5, 0], [0, SRV[1] + sh1 / 2 + 0.08, 0], C.muted, 2.2)
    : makeArrow([DOOR[0] + 0.84, DOOR[1], 0], [SRV[0] - sw1 / 2 - 0.08, DOOR[1], 0], C.muted, 2.2);
  await until(S(2));
  await play(new M.FadeOut(doorLbl1, { runTime: 0.6 }), new M.FadeIn(doorLbl2, { runTime: 0.8 }),
    new M.Create(link1, { runTime: 1.0 }), new M.Create(link2, { runTime: 1.0 }),
    ...say('API = ONE PROGRAM ASKS ANOTHER', C.amber));

  // Beat 3: our question to the API
  const reqTag = pill('“Send the orders”', C.cyan, P ? 15 : 16);
  reqTag.moveTo(P ? [2.15, 0.92, 0] : [-2.05, 0.45, 0]);
  const reqArr = P
    ? makeArrow([0.28, CLI[1] - ch1 / 2 - 0.08, 0], [0.28, DOOR[1] + 0.52, 0], C.cyan, 3)
    : makeArrow([CLI[0] + cw1 / 2 + 0.1, DOOR[1] + 0.32, 0], [DOOR[0] - 0.86, DOOR[1] + 0.32, 0], C.cyan, 3);
  await until(S(3));
  await play(new M.Create(reqArr, { runTime: 0.9 }), new M.FadeIn(reqTag, { runTime: 0.9 }), ...say('REQUEST: SEND THE ORDERS', C.cyan));

  // =========================================================================
  // BEATS 4-16: Page 1, waiter analogy, pagination, Page 2, stop signal
  // =========================================================================
  const P1C = P ? [0, 1.65, 0] : [-3.3, -0.60, 0];
  const P2C = P ? [0, -1.65, 0] : [3.3, -0.60, 0];
  const PW = P ? 6.5 : 4.7, PH = P ? 2.55 : 3.35;
  const rowH = P ? 0.52 : 0.64;
  const pRowY = (cy, idx) => cy + (P ? 0.34 - idx * 0.64 : 0.46 - idx * 0.82);
  const pFootY = cy => cy - PH / 2 + (P ? 0.38 : 0.48);

  const p1Frame = cardBox(P1C[0], P1C[1], PW, PH, C.cyan);
  const p1Head1 = fitT('First answer', P ? 19 : 21, C.cyan, PW - 0.6, true, true);
  p1Head1.moveTo([P1C[0], P1C[1] + PH / 2 - (P ? 0.30 : 0.38), 0]);

  // Beat 4 (short beat: 1.66s) — the answer arrives with its two orders
  const p1Rows = [
    orderCardRow(P1C[0], pRowY(P1C[1], 0), PW - 0.55, rowH, ORDERS[0], false),
    orderCardRow(P1C[0], pRowY(P1C[1], 1), PW - 0.55, rowH, ORDERS[1], false),
  ];
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(cliCard, srvCard, doorOuter, doorKnob, doorLbl2, link1, link2, reqArr, reqTag), { runTime: 0.8 }),
    new M.FadeIn(p1Frame, { runTime: 0.9 }), new M.FadeIn(p1Head1, { runTime: 0.9 }),
    ...p1Rows.map(r => new M.FadeIn(r, { runTime: 0.9 })),
    ...say('FIRST ANSWER', C.cyan));

  // Beat 5: two orders: 101 and 102
  await until(S(5));
  await play(new M.LaggedStart(p1Rows.map(r => new M.Indicate(r, { color: C.cyan })), { lagRatio: 0.35, runTime: 1.4 }),
    ...say('2 ORDERS: 101 AND 102', C.cyan));

  // Beat 6: bottom note: next page, 2
  const p1NoteBox = cardBox(P1C[0], pFootY(P1C[1]), PW - 0.55, P ? 0.46 : 0.54, C.amber, C.amber, 0.14, 2);
  const p1NoteTxt = fitT('next page: 2', P ? 17 : 18, C.amber, PW - 0.8, true, true);
  p1NoteTxt.moveTo([P1C[0], pFootY(P1C[1]), 0]);
  const p1Note = new M.VGroup(p1NoteBox, p1NoteTxt);
  await until(S(6));
  await play(new M.FadeIn(p1Note, { runTime: 0.9 }), new M.Flash(p1NoteBox, { color: C.amber, flashRadius: 0.35, runTime: 0.9 }),
    ...say('NOTE: NEXT PAGE = 2', C.amber));

  // Beat 7: not everything at once — a few at a time
  const ghostR = cardBox(P2C[0], P2C[1], PW, PH, C.muted, C.card, 0.35, 1.5);
  const ghostT1 = fitT('more orders waiting...', P ? 17 : 18, C.muted, PW - 0.6, true);
  ghostT1.moveTo([P2C[0], P2C[1] + 0.15, 0]);
  const ghostT2 = fitT('(not sent all at once)', P ? 15 : 16, C.muted, PW - 0.6);
  ghostT2.moveTo([P2C[0], P2C[1] - 0.30, 0]);
  const ghostCard = new M.VGroup(ghostR, ghostT1, ghostT2);
  await until(S(7));
  await play(new M.FadeIn(ghostCard, { runTime: 1.0 }),
    new M.LaggedStart(p1Rows.map(r => new M.Indicate(r, { color: C.amber })), { lagRatio: 0.25, runTime: 1.2 }),
    ...say('A FEW ORDERS AT A TIME', C.muted));

  // Beat 8: each answer is called a page (2 orders per page)
  const p1Head2 = fitT('PAGE 1', P ? 20 : 22, C.cyan, PW * 0.45, true, true);
  p1Head2.moveTo([P1C[0] - PW / 2 + 0.35 + p1Head2.getWidth() / 2, P1C[1] + PH / 2 - (P ? 0.30 : 0.38), 0]);
  const p1Badge = fitT('2 orders / page', P ? 14 : 15, C.muted, PW * 0.48, true);
  p1Badge.moveTo([P1C[0] + PW / 2 - 0.32 - p1Badge.getWidth() / 2, P1C[1] + PH / 2 - (P ? 0.30 : 0.38), 0]);
  await until(S(8));
  await play(new M.FadeOut(new M.VGroup(ghostCard, p1Head1), { runTime: 0.7 }),
    new M.FadeIn(p1Head2, { runTime: 0.9 }), new M.FadeIn(p1Badge, { runTime: 0.9 }),
    ...say('EACH ANSWER = A PAGE (2 ORDERS)', C.cyan));

  // Beat 9: waiter bringing two plates per trip
  const WX = P2C[0], WY = P2C[1];
  const kitBox = cardBox(WX - (P ? 2.25 : 1.75), WY, P ? 1.5 : 1.35, P ? 1.45 : 1.7, C.violet, C.card, 0.9, 1.8);
  const kitLbl = fitT('Kitchen', P ? 15 : 16, C.violet, 1.2, false, true); kitLbl.moveTo([WX - (P ? 2.25 : 1.75), WY, 0]);
  const tblBox = cardBox(WX + (P ? 2.25 : 1.75), WY, P ? 1.5 : 1.35, P ? 1.45 : 1.7, C.green, C.card, 0.9, 1.8);
  const tblLbl = fitT('Table', P ? 15 : 16, C.green, 1.2, false, true); tblLbl.moveTo([WX + (P ? 2.25 : 1.75), WY, 0]);
  const trayStartX = WX - (P ? 0.85 : 0.55), trayEndX = WX + (P ? 0.85 : 0.55);
  const tray = cardBox(trayStartX, WY - 0.25, P ? 1.25 : 1.1, 0.14, C.amber, C.amber, 0.9, 1.5);
  const plate1 = new M.Circle({ radius: 0.22, color: C.cyan, strokeWidth: 2.5 }); plate1.setFill(C.cyan, 0.22); plate1.moveTo([trayStartX - 0.28, WY + 0.08, 0]);
  const plate2 = new M.Circle({ radius: 0.22, color: C.pink, strokeWidth: 2.5 }); plate2.setFill(C.pink, 0.22); plate2.moveTo([trayStartX + 0.28, WY + 0.08, 0]);
  const trayDst = cardBox(trayEndX, WY - 0.25, P ? 1.25 : 1.1, 0.14, C.amber, C.amber, 0.9, 1.5);
  const plate1Dst = new M.Circle({ radius: 0.22, color: C.cyan, strokeWidth: 2.5 }); plate1Dst.setFill(C.cyan, 0.22); plate1Dst.moveTo([trayEndX - 0.28, WY + 0.08, 0]);
  const plate2Dst = new M.Circle({ radius: 0.22, color: C.pink, strokeWidth: 2.5 }); plate2Dst.setFill(C.pink, 0.22); plate2Dst.moveTo([trayEndX + 0.28, WY + 0.08, 0]);
  const waiterCap = fitT('2 plates per trip', P ? 16 : 17, C.violet, 3.8, true, true);
  waiterCap.moveTo([WX, WY - (P ? 1.05 : 1.25), 0]);
  await until(S(9));
  await play(new M.FadeIn(new M.VGroup(kitBox, kitLbl, tblBox, tblLbl, waiterCap), { runTime: 0.7 }),
    new M.FadeIn(tray, { runTime: 0.7 }), new M.FadeIn(plate1, { runTime: 0.7 }), new M.FadeIn(plate2, { runTime: 0.7 }),
    ...say('LIKE A WAITER: 2 PLATES PER TRIP', C.violet));
  await play(new M.Transform(tray, trayDst, { runTime: 1.3 }),
    new M.Transform(plate1, plate1Dst, { runTime: 1.3 }),
    new M.Transform(plate2, plate2Dst, { runTime: 1.3 }));

  // Beat 10: pagination
  await until(S(10));
  await play(new M.FadeOut(new M.VGroup(kitBox, kitLbl, tblBox, tblLbl, waiterCap, tray, plate1, plate2), { runTime: 0.8 }),
    new M.Indicate(p1Head2, { color: C.green, runTime: 1.0 }),
    ...say('PAGINATION = PAGE BY PAGE', C.green));

  // Beat 11: keep asking until the last page arrives
  await until(S(11));
  await play(new M.Indicate(p1Note, { color: C.amber, runTime: 1.1 }),
    ...say('KEEP ASKING UNTIL THE LAST PAGE', C.amber));

  // Beat 12: ask again for page 2
  const reqP2Arrow = P
    ? makeArrow([0, P1C[1] - PH / 2 - 0.06, 0], [0, P2C[1] + PH / 2 + 0.08, 0], C.amber, 3)
    : makeArrow([P1C[0] + PW / 2 + 0.1, P1C[1] - 0.55, 0], [P2C[0] - PW / 2 - 0.1, P2C[1] - 0.55, 0], C.amber, 3);
  const reqP2Tag = fitT('Ask: page 2', P ? 15 : 16, C.amber, 2.2, true, true);
  reqP2Tag.moveTo(P ? [1.45, 0, 0] : [0, P1C[1] - 0.18, 0]);
  await until(S(12));
  await play(new M.Create(reqP2Arrow, { runTime: 0.9 }), new M.FadeIn(reqP2Tag, { runTime: 0.9 }),
    ...say('REQUEST: PAGE 2', C.amber));

  // Beat 13: Page 2 holds orders 103 and 104
  const p2Box = cardBox(P2C[0], P2C[1], PW, PH, C.cyan);
  const p2Head = fitT('PAGE 2', P ? 20 : 22, C.cyan, PW * 0.45, true, true);
  p2Head.moveTo([P2C[0] - PW / 2 + 0.35 + p2Head.getWidth() / 2, P2C[1] + PH / 2 - (P ? 0.30 : 0.38), 0]);
  const p2Badge = fitT('2 orders / page', P ? 14 : 15, C.muted, PW * 0.48, true);
  p2Badge.moveTo([P2C[0] + PW / 2 - 0.32 - p2Badge.getWidth() / 2, P2C[1] + PH / 2 - (P ? 0.30 : 0.38), 0]);
  const p2Card = new M.VGroup(p2Box, p2Head, p2Badge);
  const p2Rows = [
    orderCardRow(P2C[0], pRowY(P2C[1], 0), PW - 0.55, rowH, ORDERS[2], false),
    orderCardRow(P2C[0], pRowY(P2C[1], 1), PW - 0.55, rowH, ORDERS[3], false),
  ];
  await until(S(13));
  await play(new M.FadeIn(p2Card, { runTime: 0.8 }),
    new M.LaggedStart(p2Rows.map(r => new M.FadeIn(r)), { lagRatio: 0.35, runTime: 1.4 }),
    ...say('PAGE 2: ORDERS 103 AND 104', C.cyan));

  // Beat 14: bottom of page 2 — no next-page note
  const p2FootBox = cardBox(P2C[0], pFootY(P2C[1]), PW - 0.55, P ? 0.46 : 0.54, C.muted, C.card, 0.4, 1.5);
  const p2FootTxt = fitT('next page: —  (none)', P ? 16 : 17, C.muted, PW - 0.8, true);
  p2FootTxt.moveTo([P2C[0], pFootY(P2C[1]), 0]);
  const p2EmptyNote = new M.VGroup(p2FootBox, p2FootTxt);
  await until(S(14));
  await play(new M.FadeIn(p2EmptyNote, { runTime: 0.9 }), ...say('NO NEXT-PAGE NOTE', C.muted));

  // Beat 15: missing note is the stop signal
  const stopTag = pill('STOP ✓', C.green, P ? 16 : 17);
  stopTag.moveTo(P ? [0, P2C[1] - PH / 2 - 0.48, 0] : [P2C[0], P2C[1] - PH / 2 - 0.42, 0]);
  await until(S(15));
  await play(new M.FadeIn(stopTag, { runTime: 0.9 }), new M.Flash(stopTag, { color: C.green, flashRadius: 0.35, runTime: 0.9 }),
    ...say('NO MORE PAGES → STOP', C.green));

  // Beat 16: page number vs cursor code — same idea
  const exY = P ? -4.25 : -2.72;
  const ex1 = pill('next_page: 2', C.amber, P ? 15 : 15);
  const ex2 = pill('next_code: "k9x2"', C.violet, P ? 15 : 15);
  ex1.moveTo(P ? [-1.85, exY, 0] : [-3.3, exY, 0]);
  ex2.moveTo(P ? [1.85, exY, 0] : [0.1, exY, 0]);
  const exMid = fitT('or', P ? 15 : 16, C.muted, 0.6);
  exMid.moveTo(P ? [0, exY, 0] : [-1.6, exY, 0]);
  const cursorEx = new M.VGroup(ex1, exMid, ex2);
  await until(S(16));
  await play(new M.FadeIn(cursorEx, { runTime: 1.0 }), ...say('PAGE NUMBER OR CODE: SAME IDEA', C.violet));

  // =========================================================================
  // BEATS 17-26: Combine pages -> 4 orders -> add amounts -> $130
  // =========================================================================
  const TCX = P ? 0 : -2.35, TCY = P ? 0.95 : -0.55;
  const TW = P ? 7.0 : 7.1, TH = P ? 3.85 : 3.65;
  const tTop = TCY + TH / 2;
  const colXs = [TCX - TW * 0.37, TCX - TW * 0.13, TCX + TW * 0.11, TCX + TW * 0.35];
  const rowYs = [0, 1, 2, 3].map(k => tTop - (P ? 1.05 + k * 0.78 : 1.02 + k * 0.74));

  const tblFrame = cardBox(TCX, TCY, TW, TH, C.line, C.card, 0.92, 2);
  const hdrY = tTop - 0.38;
  const hdrLine = new M.Line({ start: [TCX - TW / 2 + 0.18, hdrY - 0.28, 0], end: [TCX + TW / 2 - 0.18, hdrY - 0.28, 0], color: C.line, strokeWidth: 2 });
  const hOrder = fitT('Order', P ? 16 : 17, C.muted, 1.3, true, true); hOrder.moveTo([colXs[0], hdrY, 0]);
  const hStore = fitT('Store', P ? 16 : 17, C.muted, 1.3, true, true); hStore.moveTo([colXs[1], hdrY, 0]);
  const hPage = fitT('Page', P ? 16 : 17, C.muted, 1.3, true, true); hPage.moveTo([colXs[2], hdrY, 0]);
  const tblHdr = new M.VGroup(hdrLine, hOrder, hStore, hPage);

  // Beat 17 (short beat: 2.25s)
  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(p1Frame, p1Head2, p1Badge, ...p1Rows, p1Note, reqP2Arrow, reqP2Tag, p2Card, ...p2Rows, p2EmptyNote, stopTag, cursorEx), { runTime: 0.8 }),
    new M.FadeIn(tblFrame, { runTime: 0.9 }), new M.FadeIn(tblHdr, { runTime: 0.9 }),
    ...say('COMBINE ALL PAGES', C.cyan));

  // Build the 4 combined table rows (keeping bg rects separately for Beat 23-25 fill highlight)
  const tblBgs = [];
  const tblRows = ORDERS.map((o, k) => {
    const bg = cardBox(TCX, rowYs[k], TW - 0.36, P ? 0.62 : 0.58, o.col, o.col, 0.13, 1.8);
    tblBgs.push(bg);
    const tId = fitT(String(o.id), P ? 17 : 18, C.ink, 1.2, true, true); tId.moveTo([colXs[0], rowYs[k], 0]);
    const tSt = fitT(o.store, P ? 17 : 18, o.col, 1.3, false, true); tSt.moveTo([colXs[1], rowYs[k], 0]);
    const tPg = fitT(`Page ${o.page}`, P ? 16 : 17, C.muted, 1.4, true); tPg.moveTo([colXs[2], rowYs[k], 0]);
    return new M.VGroup(bg, tId, tSt, tPg);
  });

  // Beat 18: Page 1 gave 2 orders; Page 2 gave 2 orders
  await until(S(18));
  await play(new M.FadeIn(tblRows[0], { runTime: 0.8 }), new M.FadeIn(tblRows[1], { runTime: 0.8 }),
    ...fbox([['page 1:  2 orders', C.cyan]]), ...say('PAGE 1: 2   ·   PAGE 2: 2', C.cyan));
  await play(new M.FadeIn(tblRows[2], { runTime: 0.8 }), new M.FadeIn(tblRows[3], { runTime: 0.8 }),
    ...fbox(['page 1:  2 orders', ['page 2:  2 orders', C.cyan]]));

  // Beat 19: 2 + 2 = 4 January orders
  await until(S(19));
  await play(
    ...fbox(['page 1:  2 orders', 'page 2:  2 orders', ['total:   2 + 2 = 4', C.green]], C.green),
    new M.LaggedStart(tblRows.map(r => new M.Indicate(r, { color: C.green })), { lagRatio: 0.14, runTime: 1.2 }),
    ...say('2 + 2 = 4 JANUARY ORDERS', C.green));

  // Beat 20: check the money too
  const amtHdr = fitT('Amount', P ? 16 : 17, C.amber, 1.4, true, true);
  amtHdr.moveTo([colXs[3], hdrY, 0]);
  await until(S(20));
  await play(new M.FadeIn(amtHdr, { runTime: 0.9 }),
    ...fbox(['January sales', ['each order amount', C.amber]], C.amber),
    ...say('CHECK THE MONEY', C.amber));

  const amtTxts = ORDERS.map((o, k) => {
    const t = fitT(`$${o.amt}`, P ? 18 : 19, C.amber, 1.3, true, true);
    t.moveTo([colXs[3], rowYs[k], 0]);
    return t;
  });

  // Beat 21: order 101 = $40, order 102 = $15
  await until(S(21));
  await play(new M.FadeIn(amtTxts[0], { runTime: 0.8 }), new M.Flash(amtTxts[0], { color: C.amber, flashRadius: 0.25, runTime: 0.8 }),
    ...fbox([['order 101 = $40', C.amber]], C.amber), ...say('101: $40   ·   102: $15', C.amber));
  await play(new M.FadeIn(amtTxts[1], { runTime: 0.8 }), new M.Flash(amtTxts[1], { color: C.amber, flashRadius: 0.25, runTime: 0.8 }),
    ...fbox(['order 101 = $40', ['order 102 = $15', C.amber]], C.amber));

  // Beat 22: order 103 = $50, order 104 = $25
  await until(S(22));
  await play(new M.FadeIn(amtTxts[2], { runTime: 0.8 }), new M.Flash(amtTxts[2], { color: C.amber, flashRadius: 0.25, runTime: 0.8 }),
    ...fbox(['order 101 = $40', 'order 102 = $15', ['order 103 = $50', C.amber]], C.amber),
    ...say('103: $50   ·   104: $25', C.amber));
  await play(new M.FadeIn(amtTxts[3], { runTime: 0.8 }), new M.Flash(amtTxts[3], { color: C.amber, flashRadius: 0.25, runTime: 0.8 }),
    ...fbox(['order 101 = $40', 'order 102 = $15', 'order 103 = $50', ['order 104 = $25', C.amber]], C.amber));

  // Beat 23: 40 + 15 = 55
  await until(S(23));
  tblBgs[0].setFill(C.amber, 0.28); tblBgs[1].setFill(C.amber, 0.28);
  await play(...fbox(['running total', ['40 + 15 = 55', C.amber]], C.amber), ...say('40 + 15 = $55', C.amber));

  // Beat 24: 55 + 50 = 105
  await until(S(24));
  tblBgs[0].setFill(ORDERS[0].col, 0.13); tblBgs[1].setFill(ORDERS[1].col, 0.13);
  tblBgs[2].setFill(C.amber, 0.28);
  await play(...fbox(['running total', '40 + 15 = 55', ['55 + 50 = 105', C.amber]], C.amber), ...say('55 + 50 = $105', C.amber));

  // Beat 25: 105 + 25 = 130
  await until(S(25));
  tblBgs[2].setFill(ORDERS[2].col, 0.13);
  tblBgs[3].setFill(C.amber, 0.28);
  await play(...fbox(['running total', '40 + 15 = 55', '55 + 50 = 105', ['105 + 25 = 130', C.amber]], C.amber),
    ...say('105 + 25 = $130', C.amber));

  // Beat 26: January sales = $130
  await until(S(26));
  tblBgs[3].setFill(ORDERS[3].col, 0.13);
  await play(
    ...fbox(['January sales', ['4 orders', C.cyan], ['total = $130', C.green]], C.green),
    new M.LaggedStart(amtTxts.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.12, runTime: 1.0 }),
    ...say('JANUARY SALES = $130', C.green));

  // =========================================================================
  // BEATS 27-32: The recipe / loop, where pagination is used, protection
  // =========================================================================
  const RX = P ? -0.35 : -0.45;
  const RW = P ? 5.65 : 7.4;
  const RH = P ? 0.90 : 0.70;
  const RYS = P ? [1.85, 0.65, -0.55, -1.75] : [0.75, -0.10, -0.95, -1.80];

  const recTitle = fitT('PAGINATION RECIPE', P ? 18 : 19, C.muted, RW, true, true);
  recTitle.moveTo([RX, P ? 2.75 : 1.38, 0]);

  // Beat 27 (short beat: 2.65s)
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(tblFrame, tblHdr, amtHdr, ...tblRows, ...amtTxts), { runTime: 0.8 }),
    ...clearBox(),
    new M.FadeIn(recTitle, { runTime: 0.9 }),
    ...say('THE RULE: A SHORT RECIPE', C.cyan));

  // Beat 28: 4 steps of the recipe
  const stepSpecs = [
    ['1. Ask for a page', C.cyan],
    ['2. Keep its orders', C.cyan],
    ['3. Next-page note? → Ask for that page', C.amber],
    ['4. No next-page note? → Stop', C.green],
  ];
  const recSteps = stepSpecs.map(([txt, col], i) => {
    const r = cardBox(RX, RYS[i], RW, RH, col, col, 0.13, 2);
    const t = fitT(txt, P ? 17 : 19, C.ink, RW - 0.5, false, true);
    t.moveTo([RX - RW / 2 + 0.28 + t.getWidth() / 2, RYS[i], 0]);
    return new M.VGroup(r, t);
  });
  await until(S(28));
  await play(new M.LaggedStart(recSteps.map(s => new M.FadeIn(s)), { lagRatio: 0.35, runTime: 3.6 }),
    ...say('ASK → KEEP → NEXT PAGE → STOP', C.cyan));

  // Beat 29: loop arrow from Step 3 back to Step 1
  const rxR = RX + RW / 2 + 0.08;
  const loopX = rxR + (P ? 0.82 : 1.25);
  const loopOut = new M.Line({ start: [rxR, RYS[2], 0], end: [loopX, RYS[2], 0], color: C.violet, strokeWidth: 3 });
  const loopUp = new M.Line({ start: [loopX, RYS[2], 0], end: [loopX, RYS[0], 0], color: C.violet, strokeWidth: 3 });
  const loopIn = makeArrow([loopX, RYS[0], 0], [rxR, RYS[0], 0], C.violet, 3, 0.18);
  const loopArr = new M.VGroup(loopOut, loopUp, loopIn);
  const loopTag = pill('LOOP', C.violet, P ? 15 : 17);
  loopTag.moveTo([loopX + (P ? -0.15 : 0.72), (RYS[0] + RYS[2]) / 2, 0]);
  await until(S(29));
  await play(new M.Create(loopArr, { runTime: 1.1 }), new M.FadeIn(loopTag, { runTime: 0.9 }),
    ...say('LOOP = REPEAT AGAIN AND AGAIN', C.violet));

  // Beat 30: keep turning pages until there is no next page
  await until(S(30));
  await play(new M.Indicate(loopArr, { color: C.green, runTime: 1.0 }),
    new M.Indicate(recSteps[3], { color: C.green, runTime: 1.0 }),
    ...say('KEEP TURNING PAGES UNTIL NONE LEFT', C.green));

  // Beat 31: used almost everywhere — shops, maps, social media, weather
  const domSpecs = [
    ['Shops', 'orders & products', C.cyan],
    ['Maps', 'places & routes', C.green],
    ['Social media', 'posts & replies', C.pink],
    ['Weather', 'hourly readings', C.amber],
  ];
  const dw = P ? 3.25 : 5.2, dh = P ? 1.65 : 1.45;
  const dPos = P
    ? [[-1.78, 1.35], [1.78, 1.35], [-1.78, -0.75], [1.78, -0.75]]
    : [[-2.95, 0.35], [2.95, 0.35], [-2.95, -1.40], [2.95, -1.40]];
  const domCards = domSpecs.map(([name, sub, col], i) => {
    const [dx, dy] = dPos[i];
    const r = cardBox(dx, dy, dw, dh, col, col, 0.12, 2);
    const t1 = fitT(name, P ? 20 : 23, col, dw - 0.4, false, true); t1.moveTo([dx, dy + 0.22, 0]);
    const t2 = fitT(sub, P ? 15 : 17, C.muted, dw - 0.4); t2.moveTo([dx, dy - 0.28, 0]);
    return new M.VGroup(r, t1, t2);
  });
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(recTitle, ...recSteps, loopArr, loopTag), { runTime: 0.7 }),
    new M.LaggedStart(domCards.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 3.0 }),
    ...say('USED ALMOST EVERYWHERE ONLINE', C.cyan));

  // Beat 32: protects the website from millions of records in one go
  const badC = P ? [0, 1.45, 0] : [-3.25, -0.55, 0];
  const goodC = P ? [0, -1.55, 0] : [3.25, -0.55, 0];
  const pw2 = P ? 6.4 : 5.2, ph2 = P ? 2.15 : 2.65;
  const badCard = new M.VGroup(
    cardBox(badC[0], badC[1], pw2, ph2, C.pink, C.pink, 0.14, 2.2),
    fitT('1,000,000+ records at once', P ? 18 : 20, C.pink, pw2 - 0.5, true, true).moveTo([badC[0], badC[1] + 0.32, 0]),
    fitT('✕  overloads the website', P ? 16 : 17, C.muted, pw2 - 0.5).moveTo([badC[0], badC[1] - 0.32, 0])
  );
  const miniPgs = [1, 2, 3].map(n => {
    const mx = goodC[0] + (n - 2) * (P ? 1.85 : 1.55);
    const mr = cardBox(mx, goodC[1] + 0.22, P ? 1.55 : 1.32, 0.76, C.cyan, C.cyan, 0.16, 1.8);
    const mt = fitT(`Page ${n}`, P ? 15 : 16, C.ink, 1.2, true, true); mt.moveTo([mx, goodC[1] + 0.22, 0]);
    return new M.VGroup(mr, mt);
  });
  const goodCard = new M.VGroup(
    cardBox(goodC[0], goodC[1], pw2, ph2, C.green, C.card, 0.92, 2.2),
    ...miniPgs,
    fitT('✓  small, safe pages', P ? 16 : 17, C.green, pw2 - 0.5, false, true).moveTo([goodC[0], goodC[1] - 0.62, 0])
  );
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(...domCards), { runTime: 0.7 }),
    new M.FadeIn(badCard, { runTime: 1.0 }), new M.FadeIn(goodCard, { runTime: 1.0 }),
    ...say('PROTECTS THE WEBSITE', C.green));

  // =========================================================================
  // BEATS 33-39: The common trap & safety checklist
  // =========================================================================
  const TP1 = P ? [-1.85, 1.55, 0] : [-4.10, -0.45, 0];
  const TP2 = P ? [1.85, 1.55, 0] : [0.00, -0.45, 0];
  const TPW = P ? 3.3 : 3.45, TPH = P ? 2.55 : 2.85;
  const tRowH = P ? 0.52 : 0.60;
  function miniPageCard(cx, cy, title, ords, dim = false) {
    const col = dim ? C.muted : C.cyan;
    const box = cardBox(cx, cy, TPW, TPH, col, C.card, dim ? 0.42 : 0.94, dim ? 1.5 : 2);
    const hd = fitT(title, P ? 17 : 18, col, TPW - 0.35, true, true);
    hd.moveTo([cx, cy + TPH / 2 - 0.32, 0]);
    const r0 = orderCardRow(cx, cy + 0.28, TPW - 0.36, tRowH, ords[0], true, dim);
    const r1 = orderCardRow(cx, cy - 0.42, TPW - 0.36, tRowH, ords[1], true, dim);
    const ft = fitT(dim ? 'MISSED!' : 'next page: 2', P ? 14 : 15, dim ? C.pink : C.amber, TPW - 0.35, true, true);
    ft.moveTo([cx, cy - TPH / 2 + 0.30, 0]);
    return new M.VGroup(box, hd, r0, r1, ft);
  }

  const trapP1 = miniPageCard(TP1[0], TP1[1], 'PAGE 1', [ORDERS[0], ORDERS[1]], false);
  const trapP2Bright = miniPageCard(TP2[0], TP2[1], 'PAGE 2', [ORDERS[2], ORDERS[3]], false);
  const trapP2Dim = miniPageCard(TP2[0], TP2[1], 'PAGE 2', [ORDERS[2], ORDERS[3]], true);

  // Beat 33: common trap — ask once and stop
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(badCard, goodCard), { runTime: 0.7 }),
    new M.FadeIn(trapP1, { runTime: 1.0 }), new M.FadeIn(trapP2Bright, { runTime: 1.0 }),
    ...say('TRAP: ASK ONCE AND STOP', C.pink));

  // Beat 34: stop after page 1 -> only orders 101 & 102
  const barX = (TP1[0] + TP2[0]) / 2;
  const barLine = new M.DashedLine({ start: [barX, TP1[1] - TPH / 2 - 0.08, 0], end: [barX, TP1[1] + TPH / 2 + 0.08, 0], color: C.pink });
  const barPill = pill('STOPPED', C.pink, P ? 13 : 14);
  barPill.moveTo([barX, TP1[1] + TPH / 2 + (P ? 0.32 : 0.25), 0]);
  const stopBarrier = new M.VGroup(barLine, barPill);
  await until(S(34));
  await play(
    new M.FadeOut(trapP2Bright, { runTime: 0.8 }), new M.FadeIn(trapP2Dim, { runTime: 0.8 }),
    new M.Create(barLine, { runTime: 0.9 }), new M.FadeIn(barPill, { runTime: 0.9 }),
    ...fbox(['stopped after page 1', ['kept: 101, 102', C.pink], ['not asked: page 2', C.muted]], C.pink),
    ...say('ONLY ORDERS 101 AND 102', C.pink));

  // Beat 35: 40 + 15 = $55
  await until(S(35));
  await play(
    new M.Indicate(trapP1, { color: C.pink, runTime: 0.9 }),
    ...fbox(['page 1 only', 'order 101 = $40', 'order 102 = $15', ['40 + 15 = $55', C.pink]], C.pink),
    ...say('40 + 15 = $55', C.pink));

  // Beat 36: report $55 instead of $130, no error message at all
  const bx0 = P ? -3.35 : -5.75, bMaxW = P ? 5.2 : 5.7;
  const bY1 = P ? -0.50 : -2.35, bY2 = P ? -1.18 : -2.92;
  const bH = P ? 0.44 : 0.38;
  const w55 = bMaxW * (55 / 130);
  const bar55 = cardBox(bx0 + w55 / 2, bY1, w55, bH, C.pink, C.pink, 0.8, 1.5);
  const bar55Ghost = cardBox(bx0 + w55 + (bMaxW - w55) / 2, bY1, bMaxW - w55, bH, C.pink, C.pink, 0.12, 1.2);
  const lbl55 = fitT('$55 reported', P ? 15 : 16, C.pink, 2.2, true, true);
  lbl55.moveTo([bx0 + bMaxW + 0.18 + lbl55.getWidth() / 2, bY1, 0]);
  const bar130 = cardBox(bx0 + bMaxW / 2, bY2, bMaxW, bH, C.green, C.green, 0.78, 1.5);
  const lbl130 = fitT('$130 true', P ? 15 : 16, C.green, 2.2, true, true);
  lbl130.moveTo([bx0 + bMaxW + 0.18 + lbl130.getWidth() / 2, bY2, 0]);
  const cmpBars = new M.VGroup(bar55Ghost, bar55, lbl55, bar130, lbl130);
  await until(S(36));
  await play(
    new M.FadeIn(cmpBars, { runTime: 1.1 }),
    ...fbox([['reported:  $55', C.pink], ['true total: $130', C.green], ['missing:   $75', C.amber], ['error:     none', C.muted]], C.pink),
    ...say('$55 INSTEAD OF $130 · NO ERROR!', C.pink));

  // Beat 37: data look fine, just incomplete
  await until(S(37));
  await play(new M.Indicate(trapP2Dim, { color: C.amber, runTime: 0.9 }),
    ...say('LOOKS FINE — BUT INCOMPLETE', C.amber));

  // Beat 38-39: Always check (2-item checklist)
  const chkW = P ? 6.8 : 9.8, chkH = P ? 1.55 : 1.18;
  const chkY1 = P ? 1.35 : 0.35, chkY2 = P ? -0.65 : -1.15;
  function checkCard(y, num, main, sub) {
    const r = cardBox(0, y, chkW, chkH, C.green, C.card, 0.95, 2.2);
    const badge = new M.Circle({ radius: P ? 0.30 : 0.28, color: C.green, strokeWidth: 2.2 });
    badge.setFill(C.green, 0.2); badge.moveTo([-chkW / 2 + 0.58, y, 0]);
    const ck = fitT('✓', P ? 20 : 20, C.green, 0.4, true, true); ck.moveTo([-chkW / 2 + 0.58, y, 0]);
    const t1 = fitT(`${num}. ${main}`, P ? 18 : 20, C.ink, chkW - 1.4, false, true);
    t1.moveTo([-chkW / 2 + 1.12 + t1.getWidth() / 2, y + (P ? 0.24 : 0.19), 0]);
    const t2 = fitT(sub, P ? 15 : 16, C.muted, chkW - 1.4, true);
    t2.moveTo([-chkW / 2 + 1.12 + t2.getWidth() / 2, y - (P ? 0.26 : 0.23), 0]);
    return new M.VGroup(r, badge, ck, t1, t2);
  }
  const chk1 = checkCard(chkY1, 1, 'Did the last page have no next-page note?', 'next page: — (none)  →  safe to stop');
  const chk2 = checkCard(chkY2, 2, 'Compare your count with the API total', 'collected 4 orders  ==  API total 4');

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(trapP1, trapP2Dim, stopBarrier, cmpBars), { runTime: 0.8 }),
    ...clearBox(),
    new M.FadeIn(chk1, { runTime: 1.0 }),
    ...say('CHECK 1: NO NEXT-PAGE NOTE?', C.green));

  await until(S(39));
  await play(new M.FadeIn(chk2, { runTime: 1.0 }),
    ...say('CHECK 2: COMPARE TOTAL COUNT', C.green));

  // =========================================================================
  // BEATS 40-41: Next lesson preview & one-sentence recap
  // =========================================================================
  const prevW = P ? 7.0 : 10.2, prevH = P ? 1.45 : 1.3;
  const prevY = P ? 0.75 : -0.35;
  const nextPrev = new M.VGroup(
    cardBox(0, prevY, prevW, prevH, C.violet, C.violet, 0.14, 2.2),
    fitT('101  |  1  |  North  |  B1  |  2  |  $10', P ? 17 : 21, C.ink, prevW - 0.5, true, true).moveTo([0, prevY, 0]),
    fitT('What does one row stand for?', P ? 18 : 20, C.violet, prevW - 0.4, false, true).moveTo([0, prevY - (P ? 1.35 : 1.25), 0])
  );
  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(chk1, chk2), { runTime: 0.8 }),
    new M.FadeIn(nextPrev, { runTime: 1.0 }),
    ...say('NEXT: WHAT DOES ONE ROW MEAN?', C.violet));

  // Beat 41: one-sentence recap
  const rw3 = P ? 6.2 : 3.45, rh3 = P ? 1.60 : 2.35;
  const rPos = P ? [[0, 2.05, 0], [0, -0.35, 0], [0, -2.75, 0]] : [[-4.35, -0.55, 0], [0, -0.55, 0], [4.35, -0.55, 0]];
  const rc1 = new M.VGroup(
    cardBox(rPos[0][0], rPos[0][1], rw3, rh3, C.cyan),
    fitT('PAGE 1', P ? 18 : 19, C.cyan, rw3 - 0.4, true, true).moveTo([rPos[0][0], rPos[0][1] + (P ? 0.36 : 0.65), 0]),
    fitT('101 ($40), 102 ($15)', P ? 16 : 16, C.ink, rw3 - 0.35, true).moveTo([rPos[0][0], rPos[0][1] - 0.02, 0]),
    fitT('next page: 2', P ? 15 : 15, C.amber, rw3 - 0.35, true, true).moveTo([rPos[0][0], rPos[0][1] - (P ? 0.44 : 0.68), 0])
  );
  const rc2 = new M.VGroup(
    cardBox(rPos[1][0], rPos[1][1], rw3, rh3, C.cyan),
    fitT('PAGE 2', P ? 18 : 19, C.cyan, rw3 - 0.4, true, true).moveTo([rPos[1][0], rPos[1][1] + (P ? 0.36 : 0.65), 0]),
    fitT('103 ($50), 104 ($25)', P ? 16 : 16, C.ink, rw3 - 0.35, true).moveTo([rPos[1][0], rPos[1][1] - 0.02, 0]),
    fitT('next page: none', P ? 15 : 15, C.muted, rw3 - 0.35, true).moveTo([rPos[1][0], rPos[1][1] - (P ? 0.44 : 0.68), 0])
  );
  const rc3 = new M.VGroup(
    cardBox(rPos[2][0], rPos[2][1], rw3, rh3, C.green, C.green, 0.14, 2.4),
    fitT('STOP ✓', P ? 20 : 22, C.green, rw3 - 0.4, true, true).moveTo([rPos[2][0], rPos[2][1] + (P ? 0.36 : 0.58), 0]),
    fitT('4 orders · $130', P ? 18 : 19, C.ink, rw3 - 0.35, true, true).moveTo([rPos[2][0], rPos[2][1] - (P ? 0.24 : 0.28), 0])
  );
  const ra1 = P
    ? makeArrow([0, rPos[0][1] - rh3 / 2 - 0.06, 0], [0, rPos[1][1] + rh3 / 2 + 0.06, 0], C.amber, 2.8)
    : makeArrow([rPos[0][0] + rw3 / 2 + 0.08, -0.55, 0], [rPos[1][0] - rw3 / 2 - 0.08, -0.55, 0], C.amber, 2.8);
  const ra2 = P
    ? makeArrow([0, rPos[1][1] - rh3 / 2 - 0.06, 0], [0, rPos[2][1] + rh3 / 2 + 0.06, 0], C.green, 2.8)
    : makeArrow([rPos[1][0] + rw3 / 2 + 0.08, -0.55, 0], [rPos[2][0] - rw3 / 2 - 0.08, -0.55, 0], C.green, 2.8);

  await until(S(41));
  await play(
    new M.FadeOut(nextPrev, { runTime: 0.7 }),
    new M.LaggedStart([new M.FadeIn(rc1), new M.Create(ra1), new M.FadeIn(rc2), new M.Create(ra2), new M.FadeIn(rc3)], { lagRatio: 0.22, runTime: 2.2 }),
    ...say('FOLLOW NEXT-PAGE UNTIL NONE', C.green));
}

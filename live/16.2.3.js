// 16.2.3 Incremental processing: update only what changes.
// Beat i = sentence i (0-based, 0..48). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared Chapter 16.2 bakery data (exact)
  const TICKETS = {
    A: { id: 'A', shop: 'North', time: 'Mon 9 am', amount: 4 },
    B: { id: 'B', shop: 'North', time: 'Mon 11 am', amount: 8 },
    C: { id: 'C', shop: 'South', time: 'Mon 10 am', amount: 6 },
    D: { id: 'D', shop: 'South', time: 'Mon noon', amount: 10 },
    E: { id: 'E', shop: 'South', time: 'Mon 2 pm', amount: 14 },
  };
  const shopCol = shop => (shop === 'North' ? C.cyan : C.amber);

  // Responsive layout zones (phone: y in [-5.5, 4.3], laptop: y in [-3.0, 2.3])
  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.45, -0.35, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 18 : 19);

  // Drawing helpers
  function txt(str, size, color = C.ink, pos = [0, 0, 0], mono = false, bold = false, maxW = Infinity) {
    const t = T(String(str), size, color, mono, bold);
    if (t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    t.moveTo(pos);
    return t;
  }

  function rrect(w, h, pos, color, fill = C.card, fillOp = 0.95, stroke = 2, r = 0.12) {
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: r, color, strokeWidth: stroke });
    box.setFill(fill, fillOp);
    box.moveTo(pos);
    return box;
  }

  function srect(w, h, pos, color, fillOp = 0.85, stroke = 1) {
    const box = new M.Rectangle({ width: w, height: h, color, strokeWidth: stroke });
    box.setFill(color, fillOp);
    box.moveTo(pos);
    return box;
  }

  function seg(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: a, end: b, color, strokeWidth });
  }

  function arrow(a, b, color = C.cyan, strokeWidth = 2.6) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, sz = 0.14;
    const pL = [b[0] - sz * ux + sz * 0.55 * uy, b[1] - sz * uy - sz * 0.55 * ux, 0];
    const pR = [b[0] - sz * ux - sz * 0.55 * uy, b[1] - sz * uy + sz * 0.55 * ux, 0];
    return new M.VGroup(seg(a, b, color, strokeWidth), seg(pL, b, color, strokeWidth), seg(pR, b, color, strokeWidth));
  }

  function badge(label, pos, color, size = 15, maxW = 3.2) {
    const t = T(label, size, color, true, true);
    const w = Math.min(maxW, t.getWidth() + 0.34);
    if (t.getWidth() > w - 0.22) t.scale((w - 0.22) / t.getWidth());
    const h = 0.36;
    const bg = rrect(w, h, pos, color, C.bg, 0.95, 1.8, h / 2);
    t.moveTo(pos);
    return new M.VGroup(bg, t);
  }

  const fadeIn = (o, runTime = 0.55) => new M.FadeIn(o, { runTime });
  const fadeOut = (o, runTime = 0.4) => new M.FadeOut(o, { runTime });
  const pulse = (o, color = C.amber, runTime = 0.65) => new M.Indicate(o, { color, scaleFactor: 1.05, runTime });

  // Formula box (one at a time, cleanly separated from data and pill)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const old = boxNow;
    boxNow = null;
    if (!lines || !lines.length) return old ? [fadeOut(old, 0.35)] : [];
    const size = P ? 20 : 19, lh = P ? 0.36 : 0.38;
    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.34;
    const bg = rrect(wd, ht, BOXP, color, C.card, 0.96, 2, 0.16);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(bg, ...texts);
    const maxw = P ? FW - 0.9 : 4.25, maxh = P ? 1.38 : 3.2;
    const sc = Math.min(1, maxw / wd, maxh / ht);
    if (sc < 1) { g.scale(sc); g.moveTo(BOXP); }
    boxNow = g;
    const a = [fadeIn(g, 0.45)];
    if (old) a.push(fadeOut(old, 0.35));
    return a;
  }

  // Glowing ticket slip (North = cyan, South = amber, visible shop name & amount)
  function slip(id, pos, w, h, overrideColor = null, tag = '') {
    const d = TICKETS[id];
    const col = overrideColor || shopCol(d.shop);
    const [x, y] = pos;
    const glow = rrect(w + 0.08, h + 0.08, pos, col, col, 0.12, 1, 0.11);
    const bg = rrect(w, h, pos, col, C.card, 0.97, 2, 0.09);
    const bw = w * 0.16, bh = h * 0.72;
    const idBox = rrect(bw, bh, [x - w * 0.38, y, 0], col, col, 0.18, 1.4, 0.06);
    const idTxt = txt(id, P ? 20 : 19, col, [x - w * 0.38, y, 0], true, true, bw - 0.06);
    const shopTxt = txt(d.shop, P ? 17 : 16, col, [x - w * 0.06, y + h * 0.19, 0], false, true, w * 0.44);
    const subLabel = tag || d.time;
    const subCol = tag ? C.pink : C.muted;
    const timeTxt = txt(subLabel, P ? 13 : 13, subCol, [x - w * 0.06, y - h * 0.21, 0], false, !!tag, w * 0.46);
    const div = seg([x + w * 0.21, y - h * 0.34, 0], [x + w * 0.21, y + h * 0.34, 0], C.line, 1.4);
    const amtTxt = txt(`$${d.amount}`, P ? 21 : 20, col, [x + w * 0.355, y, 0], true, true, w * 0.25);
    return new M.VGroup(glow, bg, idBox, idTxt, shopTxt, timeTxt, div, amtTxt);
  }

  // Bakery storefront helper (beats 0-2)
  function shopCard(name, pos) {
    const col = shopCol(name), [x, y] = pos;
    const w = P ? 2.85 : 3.05, h = 1.3;
    const body = rrect(w, h, pos, col, C.card, 0.95, 2, 0.1);
    const roof = rrect(w, 0.34, [x, y + h / 2 - 0.17, 0], col, col, 0.22, 1.5, 0.08);
    const label = txt(`${name.toUpperCase()} SHOP`, 18, col, [x, y + h / 2 - 0.17, 0], true, true, w - 0.2);
    const door = rrect(0.42, 0.68, [x + w * 0.26, y - 0.28, 0], col, col, 0.14, 1.5, 0.05);
    const win = rrect(1.05, 0.52, [x - w * 0.17, y - 0.18, 0], col, col, 0.1, 1.4, 0.06);
    const loaf = rrect(0.56, 0.26, [x - w * 0.17, y - 0.2, 0], C.amber, C.amber, 0.55, 1.2, 0.12);
    return new M.VGroup(body, roof, label, door, win, loaf);
  }

  // Main computer icon helper (beats 1-2)
  function computerCard(pos) {
    const [x, y] = pos;
    const monitor = rrect(2.2, 1.18, [x, y + 0.1, 0], C.violet, C.card, 0.96, 2, 0.1);
    const screen = rrect(1.88, 0.86, [x, y + 0.12, 0], C.cyan, C.cyan, 0.1, 1.2, 0.06);
    const sLine1 = txt('TOTAL SALES', 14, C.muted, [x, y + 0.3, 0], true, true, 1.7);
    const sLine2 = txt('$?', 28, C.amber, [x, y - 0.04, 0], true, true, 1.7);
    const stand = seg([x, y - 0.49, 0], [x, y - 0.72, 0], C.violet, 4);
    const base = seg([x - 0.46, y - 0.72, 0], [x + 0.46, y - 0.72, 0], C.violet, 3);
    const cap = txt('MAIN COMPUTER', 15, C.violet, [x, y - 0.98, 0], true, true, 2.4);
    return new M.VGroup(monitor, screen, sLine1, sLine2, stand, base, cap);
  }

  // Clock bar helper
  const CLOCK_P = [CX, P ? 1.40 : 1.28, 0];
  function clockBar(timeStr, color = C.cyan) {
    const [x, y] = CLOCK_P;
    const w = P ? 3.9 : 3.7, h = 0.44;
    const bg = rrect(w, h, CLOCK_P, color, C.card, 0.95, 1.8, h / 2);
    const dial = new M.Circle({ radius: 0.13, color, strokeWidth: 1.8 });
    dial.setFill(C.bg, 0.9);
    dial.moveTo([x - w / 2 + 0.3, y, 0]);
    const hand1 = seg([x - w / 2 + 0.3, y, 0], [x - w / 2 + 0.3, y + 0.08, 0], color, 1.6);
    const hand2 = seg([x - w / 2 + 0.3, y, 0], [x - w / 2 + 0.37, y - 0.02, 0], color, 1.6);
    const label = txt(timeStr, P ? 16 : 16, color, [x + 0.14, y, 0], true, true, w - 0.75);
    return new M.VGroup(bg, dial, hand1, hand2, label);
  }

  // ============================================================
  // BEATS 0–2: Intro — Bakery, Morning Total, Late Ticket
  // ============================================================
  const ICX = P ? CX : 0, IS = P ? 1 : 1.25;
  const shopY = P ? 0.55 : 0.45;
  const shopDX = P ? 1.75 : 2.7;
  const northShop = shopCard('North', [ICX - shopDX, shopY, 0]);
  const southShop = shopCard('South', [ICX + shopDX, shopY, 0]);
  if (!P) { northShop.scale(IS); southShop.scale(IS); }

  await until(S(0));
  await play(
    new M.LaggedStart([fadeIn(northShop), fadeIn(southShop)], { lagRatio: 0.25, runTime: 1.0 }),
    ...say('OUR BAKERY: NORTH & SOUTH')
  );

  const compPos = [ICX, P ? -1.95 : -1.75, 0];
  const comp = computerCard(compPos);
  if (!P) comp.scale(IS);
  const linkN = new M.DashedLine({ start: [ICX - shopDX, shopY - 0.68 * IS, 0], end: [ICX - 0.45, compPos[1] + 0.72 * IS, 0], color: C.cyan });
  const linkS = new M.DashedLine({ start: [ICX + shopDX, shopY - 0.68 * IS, 0], end: [ICX + 0.45, compPos[1] + 0.72 * IS, 0], color: C.amber });

  await until(S(1));
  await play(fadeIn(comp), new M.Create(linkN, { runTime: 0.5 }), new M.Create(linkS, { runTime: 0.5 }),
    ...say('EVERY MORNING: TOTAL SALES'));

  const lateBPos = P ? [ICX, -3.95, 0] : [ICX - 3.9, -1.75, 0];
  const lateB = slip('B', lateBPos, P ? 2.9 : 2.55, 0.72, C.cyan, 'LATE TICKET');
  const lateArr = P
    ? arrow([ICX, -3.52, 0], [ICX, -3.12, 0], C.amber)
    : arrow([ICX - 2.55, -1.75, 0], [ICX - 1.85, -1.75, 0], C.amber);

  await until(S(2));
  await play(fadeIn(lateB), fadeIn(lateArr), ...say('LATE TICKET: RECALCULATE ALL?', C.amber));

  // ============================================================
  // BEATS 3–15: Tuesday 6 a.m. — Four Tickets & Initial Total ($34)
  // ============================================================
  const TX = CX - (P ? 1.85 : 2.15);
  const TW = P ? 3.25 : 3.65, TH = P ? 0.68 : 0.56;
  const TY0 = P ? 0.25 : 0.36, TY_STEP = P ? 0.86 : 0.68;
  const slotPos = k => [TX, TY0 - k * TY_STEP, 0];
  const BY = P ? -3.72 : -2.58;

  const BX = CX + (P ? 1.85 : 2.05);
  const BW = P ? 3.20 : 3.45, BH = P ? 2.60 : 2.15;
  const TOT_Y = P ? -1.04 : -0.66;

  let clockNow = clockBar('TUESDAY · 6:00 AM', C.cyan);

  await until(S(3));
  await play(
    fadeOut(northShop), fadeOut(southShop), fadeOut(comp), fadeOut(linkN), fadeOut(linkS),
    fadeOut(lateB), fadeOut(lateArr),
    fadeIn(clockNow),
    ...say('TUESDAY · 6:00 AM')
  );

  const colHdr = txt('RECEIVED MONDAY TICKETS', P ? 14 : 15, C.muted, [TX, P ? 0.84 : 0.82, 0], true, true, TW + 0.2);
  const emptySlots = [0, 1, 2, 3].map(k => rrect(TW, TH, slotPos(k), C.line, C.card, 0.35, 1.5, 0.09));

  await until(S(4));
  await play(
    fadeIn(colHdr),
    new M.LaggedStart(emptySlots.map(s => fadeIn(s, 0.35)), { lagRatio: 0.12, runTime: 0.85 }),
    ...say('4 MONDAY TICKETS RECEIVED')
  );

  const earlierIds = ['A', 'C', 'D', 'E'];
  const earlierSlips = earlierIds.map((id, k) => slip(id, slotPos(k), TW, TH));

  // Beats 5-8: each ticket appears
  const ticketPills = [
    ['TICKET A · NORTH · $4', C.cyan],
    ['TICKET C · SOUTH · $6', C.amber],
    ['TICKET D · SOUTH · $10', C.amber],
    ['TICKET E · SOUTH · $14', C.amber],
  ];
  for (let k = 0; k < 4; k++) {
    await until(S(5 + k));
    await play(
      fadeOut(emptySlots[k], 0.3),
      fadeIn(earlierSlips[k], 0.5),
      new M.Flash(earlierSlips[k], { color: ticketPills[k][1], flashRadius: 0.32, lineLength: 0.18 }),
      ...say(ticketPills[k][0], ticketPills[k][1])
    );
  }

  // Beat 9: empty box for Monday's total
  let totalFrame = rrect(BW, BH, [BX, TOT_Y, 0], C.cyan, C.card, 0.95, 2.4, 0.16);
  const totalHdr = txt('MONDAY TOTAL', P ? 16 : 16, C.muted, [BX, TOT_Y + BH / 2 - 0.34, 0], true, true, BW - 0.3);
  const totalDiv = seg([BX - BW / 2 + 0.25, TOT_Y + BH / 2 - 0.62, 0], [BX + BW / 2 - 0.25, TOT_Y + BH / 2 - 0.62, 0], C.line, 1.4);

  await until(S(9));
  await play(fadeIn(totalFrame), fadeIn(totalHdr), fadeIn(totalDiv), ...say('EMPTY BOX FOR MONDAY’S TOTAL'));

  // Helper to render the big total number and bottom status inside Monday Total box
  const makeTotalVal = (val, col = C.ink) => txt(`$${val}`, P ? 46 : 44, col, [BX, TOT_Y - 0.04, 0], true, true, BW - 0.4);
  const makeTotalStatus = (str, col = C.muted) => txt(str, P ? 14 : 14, col, [BX, TOT_Y - BH / 2 + 0.34, 0], true, true, BW - 0.3);

  let totalVal = makeTotalVal(0, C.muted);
  let totalStatus = makeTotalStatus('STARTING TOTAL', C.muted);

  // Beat 10: start with $0
  await until(S(10));
  await play(fadeIn(totalVal, 0.4), fadeIn(totalStatus, 0.4), ...fbox(['Monday total', ['$0', C.muted]]), ...say('START AT $0', C.muted));

  // Beats 11-14: add A ($4), C ($6), D ($10), E ($14)
  const addSteps = [
    { k: 0, prev: 0, add: 4, next: 4, col: C.cyan, pillTxt: '+$4 → TOTAL $4' },
    { k: 1, prev: 4, add: 6, next: 10, col: C.amber, pillTxt: '+$6 → TOTAL $10' },
    { k: 2, prev: 10, add: 10, next: 20, col: C.amber, pillTxt: '+$10 → TOTAL $20' },
    { k: 3, prev: 20, add: 14, next: 34, col: C.amber, pillTxt: '+$14 → TOTAL $34' },
  ];
  for (let i = 0; i < addSteps.length; i++) {
    const st = addSteps[i];
    await until(S(11 + i));
    const nextVal = makeTotalVal(st.next, C.ink);
    const nextStatus = makeTotalStatus(`ADDED TICKET ${earlierIds[st.k]} (+$${st.add})`, st.col);
    await play(
      pulse(earlierSlips[st.k], st.col),
      fadeOut(totalVal, 0.3), fadeIn(nextVal, 0.45),
      fadeOut(totalStatus, 0.3), fadeIn(nextStatus, 0.45),
      ...fbox(['Monday total so far', [`$${st.prev} + $${st.add} = $${st.next}`, st.col]], st.col),
      ...say(st.pillTxt, st.col)
    );
    totalVal = nextVal;
    totalStatus = nextStatus;
  }

  // Beat 15: computer saves $34
  await until(S(15));
  const savedFrame = rrect(BW, BH, [BX, TOT_Y, 0], C.green, C.card, 0.95, 2.8, 0.16);
  const savedVal = makeTotalVal(34, C.green);
  const savedStatus = makeTotalStatus('SAVED · 6:00 AM', C.green);
  await play(
    fadeOut(totalFrame, 0.3), fadeIn(savedFrame, 0.45),
    fadeOut(totalVal, 0.3), fadeIn(savedVal, 0.45),
    fadeOut(totalStatus, 0.3), fadeIn(savedStatus, 0.45),
    ...fbox(['Saved Monday total', ['$34', C.green], ['(A + C + D + E)', C.muted]], C.green),
    ...say('SAVED: MONDAY TOTAL = $34', C.green)
  );
  totalFrame = savedFrame;
  totalVal = savedVal;
  totalStatus = savedStatus;

  // ============================================================
  // BEATS 16–22: Tuesday 8 a.m. — Late Ticket B Arrives
  // ============================================================
  await until(S(16));
  const clock8 = clockBar('TUESDAY · 8:00 AM', C.amber);
  await play(fadeOut(clockNow, 0.35), fadeIn(clock8, 0.45), ...say('TUESDAY · 8:00 AM', C.amber));
  clockNow = clock8;

  const newHdr = txt('NEWLY RECEIVED', P ? 15 : 14, C.cyan, [TX, P ? -3.14 : -2.18, 0], true, true, TW);
  const slipB = slip('B', [TX, BY, 0], TW, TH);

  await until(S(17));
  await play(
    fadeIn(newHdr, 0.4), fadeIn(slipB, 0.55),
    new M.Flash(slipB, { color: C.cyan, flashRadius: 0.34, lineLength: 0.2 }),
    ...fbox(['Ticket B arrives (8 am)', ['North · Monday sale · $8', C.cyan]]),
    ...say('TICKET B ARRIVES · $8', C.cyan)
  );

  await until(S(18));
  await play(
    pulse(slipB, C.cyan),
    ...fbox(['Ticket B · $8', ['Sale: Monday 11 am', C.cyan], ['Arrived: Tuesday 8 am', C.amber]]),
    ...say('MONDAY SALE · ARRIVED TUESDAY', C.cyan)
  );

  await until(S(19));
  await play(pulse(totalVal, C.amber), ...say('UPDATE MONDAY’S TOTAL', C.amber));

  // Beat 20: Option 1 — re-read all 5 tickets from $0
  await until(S(20));
  await play(
    new M.LaggedStart([...earlierSlips, slipB].map(o => pulse(o, C.pink, 0.5)), { lagRatio: 0.28, runTime: 1.8 }),
    ...fbox([['Option 1: from $0', C.pink], '$4+$6+$10+$14+$8 = $42', ['Reads all 5 tickets', C.muted]], C.pink),
    ...say('WAY 1: RE-READ ALL 5 FROM $0', C.pink)
  );

  // Beat 21: Look at the $34 already saved
  await until(S(21));
  await play(
    pulse(totalFrame, C.green), pulse(totalVal, C.green),
    ...fbox(['Already saved:', ['Monday total = $34', C.green]], C.green),
    ...say('WE ALREADY SAVED $34', C.green)
  );

  // Beat 22: $34 already includes the earlier 4 tickets
  const fourFrame = rrect(TW + 0.24, 3 * TY_STEP + TH + 0.22, [TX, TY0 - 1.5 * TY_STEP, 0], C.green, C.green, 0.06, 2, 0.14);
  const fourToTot = arrow([TX + TW / 2 + 0.14, TOT_Y, 0], [BX - BW / 2 - 0.06, TOT_Y, 0], C.green, 2.8);

  await until(S(22));
  await play(
    new M.Create(fourFrame, { runTime: 0.6 }), fadeIn(fourToTot, 0.5),
    ...fbox(['$34 already includes:', ['A($4) + C($6) + D($10) + E($14)', C.green]], C.green),
    ...say('$34 ALREADY INCLUDES A, C, D, E', C.green)
  );

  // ============================================================
  // BEATS 23–25: Shopping Notebook Analogy
  // ============================================================
  const workspaceAll = () => [clockNow, colHdr, ...earlierSlips, newHdr, slipB, totalFrame, totalHdr, totalDiv, totalVal, totalStatus];

  const nbY = P ? -1.4 : -0.52;
  const nbW = P ? 6.2 : 6.4, nbH = P ? 5.1 : 3.55;
  const nbBg = rrect(nbW, nbH, [CX, nbY, 0], C.violet, C.card, 0.96, 2.2, 0.16);
  const nbTitle = txt('SHOPPING NOTEBOOK', P ? 20 : 19, C.violet, [CX, nbY + nbH / 2 - 0.36, 0], true, true, nbW - 0.6);
  const nbRuleTop = seg([CX - nbW / 2 + 0.35, nbY + nbH / 2 - 0.64, 0], [CX + nbW / 2 - 0.35, nbY + nbH / 2 - 0.64, 0], C.line, 1.5);
  const nbItems = [
    ['Bread', '$4'],
    ['Milk', '$6'],
    ['Fruit', '$10'],
    ['Cheese', '$14'],
  ];
  const nbPitch = P ? 0.52 : 0.36;
  const nbTopY = nbY + nbH / 2 - (P ? 1.05 : 0.94);
  const nbItemRows = nbItems.map(([name, price], i) => {
    const ry = nbTopY - i * nbPitch;
    return new M.VGroup(
      txt(name, P ? 18 : 16, C.muted, [CX - nbW / 2 + 1.35, ry, 0], true, false, 2.2),
      txt(price, P ? 18 : 16, C.muted, [CX + nbW / 2 - 1.15, ry, 0], true, false, 1.2)
    );
  });
  const nbRuleMidY = nbTopY - 3.65 * nbPitch;
  const nbRuleMid = seg([CX - nbW / 2 + 0.45, nbRuleMidY, 0], [CX + nbW / 2 - 0.45, nbRuleMidY, 0], C.muted, 1.5);
  const nbTotY = nbRuleMidY - (P ? 0.44 : 0.34);
  const nbTotRow = new M.VGroup(
    txt('Total so far', P ? 19 : 17, C.green, [CX - nbW / 2 + 1.75, nbTotY, 0], true, true, 3.0),
    txt('$34', P ? 21 : 19, C.green, [CX + nbW / 2 - 1.15, nbTotY, 0], true, true, 1.4)
  );

  await until(S(23));
  await play(
    ...workspaceAll().map(o => fadeOut(o, 0.35)), fadeOut(fourFrame, 0.35), fadeOut(fourToTot, 0.35),
    fadeIn(nbBg, 0.5), fadeIn(nbTitle, 0.5), fadeIn(nbRuleTop, 0.5),
    ...nbItemRows.map(o => fadeIn(o, 0.5)), fadeIn(nbRuleMid, 0.5), fadeIn(nbTotRow, 0.5),
    ...fbox(['Shopping notebook', ['Current total = $34', C.green]], C.violet),
    ...say('ANALOGY: A SHOPPING NOTEBOOK', C.violet)
  );

  const nbNewY = nbTotY - (P ? 0.54 : 0.40);
  const nbFinalY = nbNewY - (P ? 0.58 : 0.42);
  const nbNewRow = new M.VGroup(
    txt('+ New item', P ? 19 : 17, C.cyan, [CX - nbW / 2 + 1.75, nbNewY, 0], true, true, 3.0),
    txt('+$8', P ? 20 : 18, C.cyan, [CX + nbW / 2 - 1.15, nbNewY, 0], true, true, 1.4)
  );
  const nbFinalRow = new M.VGroup(
    txt('New total', P ? 20 : 18, C.amber, [CX - nbW / 2 + 1.75, nbFinalY, 0], true, true, 3.0),
    txt('$42', P ? 22 : 20, C.amber, [CX + nbW / 2 - 1.15, nbFinalY, 0], true, true, 1.4)
  );

  await until(S(24));
  await play(
    fadeIn(nbNewRow, 0.45), fadeIn(nbFinalRow, 0.55),
    ...fbox(['Total so far: $34', ['+ new item:   $8', C.cyan], ['New total:   $42', C.amber]], C.violet),
    ...say('ADD NEW PRICE TO CURRENT TOTAL', C.violet)
  );

  const nbSkipBadge = badge('ALREADY IN $34 · SKIP', [CX + 0.05, nbTopY - 1.5 * nbPitch, 0], C.green, P ? 14 : 13, 3.5);
  await until(S(25));
  await play(
    fadeIn(nbSkipBadge, 0.45),
    ...say('NO NEED TO RE-ADD EARLIER ITEMS', C.muted)
  );

  // ============================================================
  // BEATS 26–39: Back to Computer — Incremental Processing & 4 Steps
  // ============================================================
  const notebookAll = [nbBg, nbTitle, nbRuleTop, ...nbItemRows, nbRuleMid, nbTotRow, nbNewRow, nbFinalRow, nbSkipBadge];

  // Rebuild clean workspace elements for return (never reuse faded-out mobjects)
  clockNow = clockBar('TUESDAY · 8:00 AM', C.amber);
  const colHdr2 = txt('EARLIER 4 TICKETS', P ? 14 : 15, C.muted, [TX, P ? 0.84 : 0.82, 0], true, true, TW + 0.2);
  const earlier2 = earlierIds.map((id, k) => slip(id, slotPos(k), TW, TH));
  const newHdr2 = txt('NEWLY RECEIVED', P ? 15 : 14, C.cyan, [TX, P ? -3.14 : -2.18, 0], true, true, TW);
  const slipB2 = slip('B', [TX, BY, 0], TW, TH);
  totalFrame = rrect(BW, BH, [BX, TOT_Y, 0], C.green, C.card, 0.95, 2.6, 0.16);
  const totalHdr2 = txt('MONDAY TOTAL', P ? 16 : 16, C.muted, [BX, TOT_Y + BH / 2 - 0.34, 0], true, true, BW - 0.3);
  const totalDiv2 = seg([BX - BW / 2 + 0.25, TOT_Y + BH / 2 - 0.62, 0], [BX + BW / 2 - 0.25, TOT_Y + BH / 2 - 0.62, 0], C.line, 1.4);
  totalVal = makeTotalVal(34, C.green);
  totalStatus = makeTotalStatus('PREVIOUS TOTAL', C.green);

  await until(S(26));
  await play(
    ...notebookAll.map(o => fadeOut(o, 0.35)),
    fadeIn(clockNow, 0.45), fadeIn(colHdr2, 0.45), ...earlier2.map(o => fadeIn(o, 0.45)),
    fadeIn(newHdr2, 0.45), fadeIn(slipB2, 0.45),
    fadeIn(totalFrame, 0.45), fadeIn(totalHdr2, 0.45), fadeIn(totalDiv2, 0.45),
    fadeIn(totalVal, 0.45), fadeIn(totalStatus, 0.45),
    ...fbox(['Same idea for the computer', ['Keep $34 · add only new B', C.cyan]]),
    ...say('THE COMPUTER WORKS THE SAME WAY')
  );

  // Beat 27: keeps previous total and adds only new ticket
  const bToTotArr = arrow([TX + TW / 2 + 0.14, BY + 0.18, 0], [BX - 0.2, TOT_Y - BH / 2 - 0.1, 0], C.cyan, 2.8);
  await until(S(27));
  await play(
    pulse(totalVal, C.green), pulse(slipB2, C.cyan), fadeIn(bToTotArr, 0.5),
    ...fbox(['Keep previous total: $34', ['Add only Ticket B:  +$8', C.cyan]], C.green),
    ...say('KEEP $34 · ADD ONLY NEW TICKET', C.green)
  );

  // Beat 28: Introduce the name: incremental processing
  await until(S(28));
  await play(
    pulse(totalFrame, C.green), pulse(slipB2, C.green),
    ...fbox([['INCREMENTAL PROCESSING', C.green], 'Work only with new changes', 'Do not repeat earlier work'], C.green),
    ...say('INCREMENTAL PROCESSING', C.green)
  );

  // Beat 29: Let's watch the computer update Monday's total
  await until(S(29));
  await play(
    fadeOut(bToTotArr, 0.35),
    ...fbox(['Updating Monday’s total', ['Step by step...', C.cyan]]),
    ...say('WATCH THE UPDATE STEP BY STEP')
  );

  // Beat 30: Step 1 — read previous total ($34)
  const step1Ring = rrect(BW + 0.16, BH + 0.16, [BX, TOT_Y, 0], C.cyan, C.cyan, 0.05, 2.5, 0.18);
  await until(S(30));
  await play(
    fadeIn(step1Ring, 0.45), pulse(totalVal, C.cyan),
    ...fbox([['Step 1: Read previous total', C.cyan], 'previous total = $34']),
    ...say('STEP 1: READ PREVIOUS TOTAL ($34)')
  );

  // Beat 31: Step 2 — read newly received ticket B ($8)
  const step2Arr = arrow([TX + TW / 2 + 0.14, BY + 0.18, 0], [BX - 0.2, TOT_Y - BH / 2 - 0.1, 0], C.cyan, 3);
  await until(S(31));
  await play(
    fadeOut(step1Ring, 0.3), pulse(slipB2, C.cyan), fadeIn(step2Arr, 0.5),
    new M.Flash(slipB2, { color: C.cyan, flashRadius: 0.32, lineLength: 0.18 }),
    ...fbox(['Step 1: previous = $34', ['Step 2: read Ticket B = $8', C.cyan]]),
    ...say('STEP 2: READ NEW TICKET B ($8)')
  );

  // Beat 32: Step 3 — add $8 to $34
  const plus8Tag = badge('+$8', [BX, TOT_Y - BH / 2 - 0.34, 0], C.amber, 18, 1.4);
  await until(S(32));
  await play(
    fadeIn(plus8Tag, 0.45), pulse(totalVal, C.amber),
    ...fbox([['Step 3: Add $8 to $34', C.amber], '$34 + $8'], C.amber),
    ...say('STEP 3: ADD $8 TO $34', C.amber)
  );

  // Beat 33: 34 + 8 = 42
  const val42 = makeTotalVal(42, C.amber);
  const st42 = makeTotalStatus('$34 + $8 = $42', C.amber);
  await until(S(33));
  await play(
    fadeOut(totalVal, 0.3), fadeIn(val42, 0.45),
    fadeOut(totalStatus, 0.3), fadeIn(st42, 0.45),
    new M.Flash(val42, { color: C.amber, flashRadius: 0.36, lineLength: 0.2 }),
    ...fbox(['Step 3: Add $8 to $34', ['$34 + $8 = $42', C.amber]], C.amber),
    ...say('$34 + $8 = $42', C.amber)
  );
  totalVal = val42;
  totalStatus = st42;

  // Beat 34: Step 4 — save $42 as Monday's new total
  const val42Green = makeTotalVal(42, C.green);
  const stSaved42 = makeTotalStatus('SAVED · NEW TOTAL', C.green);
  const bCheck = badge('✓ INCLUDED', [TX, P ? -3.14 : -2.18, 0], C.green, P ? 15 : 13, 1.9);
  await until(S(34));
  await play(
    fadeOut(step2Arr, 0.3), fadeOut(plus8Tag, 0.3),
    fadeOut(totalVal, 0.3), fadeIn(val42Green, 0.45),
    fadeOut(totalStatus, 0.3), fadeIn(stSaved42, 0.45),
    fadeOut(newHdr2, 0.3), fadeIn(bCheck, 0.45),
    ...fbox([['Step 4: Save new total', C.green], ['Monday total = $42', C.green]], C.green),
    ...say('STEP 4: SAVE NEW TOTAL ($42)', C.green)
  );
  totalVal = val42Green;
  totalStatus = stSaved42;

  // Beat 35: Look at the earlier four tickets
  const untouchedFrame = rrect(TW + 0.22, 3 * TY_STEP + TH + 0.2, [TX, TY0 - 1.5 * TY_STEP, 0], C.muted, C.muted, 0.05, 2, 0.14);
  await until(S(35));
  await play(new M.Create(untouchedFrame, { runTime: 0.55 }), ...say('LOOK AT TICKETS A, C, D, E', C.muted));

  // Beat 36: Computer did not need to read them again
  const skipTag = badge('NOT RE-READ · 0 READS', [TX, TY0 - 1.5 * TY_STEP, 0], C.green, P ? 14 : 13, TW - 0.1);
  await until(S(36));
  await play(
    fadeIn(skipTag, 0.45),
    ...fbox(['Earlier 4 tickets: 0 reads', ['New ticket B:      1 read', C.green]], C.green),
    ...say('EARLIER 4 TICKETS: NOT RE-READ', C.green)
  );

  // Beat 37: Formula introduction
  await until(S(37));
  await play(
    fadeOut(untouchedFrame, 0.35), fadeOut(skipTag, 0.35),
    ...fbox([['THE FORMULA', C.cyan], 'One short line']),
    ...say('FORMULA = ONE SHORT LINE')
  );

  // Beat 38: New total = previous total + new sale
  await until(S(38));
  await play(
    pulse(totalVal, C.cyan), pulse(slipB2, C.cyan),
    ...fbox([['new total =', C.cyan], '  previous total + new sale']),
    ...say('NEW = PREVIOUS + NEW SALE')
  );

  // Beat 39: 42 = 34 + 8
  await until(S(39));
  await play(
    pulse(totalVal, C.amber),
    ...fbox([['new total = previous + new', C.muted], ['      $42 = $34      + $8', C.amber]], C.amber),
    ...say('$42 = $34 + $8', C.amber)
  );

  // ============================================================
  // BEATS 40–42: Scale Comparison — Thousands of Sales
  // ============================================================
  const workspace2All = [clockNow, colHdr2, ...earlier2, newHdr2, slipB2, bCheck, totalFrame, totalHdr2, totalDiv2, totalVal, totalStatus];

  const gridCX = CX - (P ? 1.15 : 1.45), gridY = P ? 0.15 : 0.36;
  const gridW = P ? 4.3 : 4.7, gridH = P ? 2.0 : 1.72;
  const gridFrame = rrect(gridW, gridH, [gridCX, gridY, 0], C.muted, C.card, 0.92, 1.8, 0.14);
  const gridHdr = txt('1,000+ EARLIER SALES', P ? 14 : 14, C.muted, [gridCX, gridY + gridH / 2 - 0.24, 0], true, true, gridW - 0.3);
  const dots = [];
  const dCols = 12, dRows = 5;
  for (let r = 0; r < dRows; r++) {
    for (let c = 0; c < dCols; c++) {
      const dx = gridCX + (c - (dCols - 1) / 2) * ((gridW - 0.6) / dCols);
      const dy = gridY - 0.14 + (r - (dRows - 1) / 2) * ((gridH - 0.72) / dRows);
      const col = (r + c) % 3 === 0 ? C.cyan : C.amber;
      const d = new M.Dot({ point: [dx, dy, 0], radius: 0.055, color: col });
      d.setFill(col, 0.85);
      dots.push(d);
    }
  }
  const dotGroup = new M.VGroup(...dots);

  const newCardX = CX + (P ? 2.35 : 2.60);
  const newCard = new M.VGroup(
    rrect(1.75, 1.2, [newCardX, gridY, 0], C.cyan, C.card, 0.96, 2.2, 0.12),
    txt('1 NEW', 16, C.cyan, [newCardX, gridY + 0.2, 0], true, true, 1.5),
    txt('SALE', 16, C.cyan, [newCardX, gridY - 0.18, 0], true, true, 1.5)
  );

  await until(S(40));
  await play(
    ...workspace2All.map(o => fadeOut(o, 0.35)),
    fadeIn(gridFrame, 0.5), fadeIn(gridHdr, 0.5), fadeIn(dotGroup, 0.6), fadeIn(newCard, 0.5),
    ...fbox(['Large business:', '1,000+ earlier sales', ['1 newly received sale', C.cyan]], C.violet),
    ...say('THOUSANDS OF EARLIER SALES', C.violet)
  );

  // Beat 41: Work comparison bars
  const barX0 = CX - (P ? 3.2 : 3.55);
  const fullW = P ? 6.2 : 7.0;
  const bar1Y = P ? -2.15 : -1.22, bar2Y = P ? -3.45 : -2.22;
  const bar1Lbl = txt('Re-read all sales (1,001 reads)', P ? 15 : 15, C.pink, [barX0 + 2.35, bar1Y + 0.42, 0], true, true, fullW);
  const bar1 = srect(fullW, 0.38, [barX0 + fullW / 2, bar1Y, 0], C.pink, 0.8);
  const bar2Lbl = txt('Incremental: new only (1 read)', P ? 15 : 15, C.green, [barX0 + 2.35, bar2Y + 0.42, 0], true, true, fullW);
  const bar2 = srect(0.24, 0.38, [barX0 + 0.12, bar2Y, 0], C.green, 0.95);
  const saveNote = badge('MASSIVE WORK SAVED', [barX0 + 2.45, bar2Y, 0], C.green, 14, 3.6);

  await until(S(41));
  await play(
    fadeIn(bar1Lbl, 0.4), fadeIn(bar1, 0.55),
    fadeIn(bar2Lbl, 0.4), fadeIn(bar2, 0.55), fadeIn(saveNote, 0.55),
    ...fbox([['Re-read all:  1,001 reads', C.pink], ['Incremental:  1 new read', C.green], ['Saves huge work!', C.amber]], C.green),
    ...say('SAVES A GREAT DEAL OF WORK', C.green)
  );

  // Beat 42: Purpose of incremental processing
  await until(S(42));
  await play(
    pulse(bar2, C.green), pulse(saveNote, C.green),
    ...fbox([['Incremental processing:', C.green], '• Keep totals up to date', '• Skip repeated work'], C.green),
    ...say('UP TO DATE · NO REPEATED WORK', C.green)
  );

  // ============================================================
  // BEATS 43–47: The Trap — Duplicate Ticket B ($42 -> $50)
  // ============================================================
  const scaleAll = [gridFrame, gridHdr, dotGroup, newCard, bar1Lbl, bar1, bar2Lbl, bar2, saveNote];

  const trapFrame = rrect(BW, BH, [BX, TOT_Y, 0], C.green, C.card, 0.95, 2.4, 0.16);
  const trapHdr = txt('MONDAY TOTAL', P ? 16 : 16, C.muted, [BX, TOT_Y + BH / 2 - 0.34, 0], true, true, BW - 0.3);
  const trapDiv = seg([BX - BW / 2 + 0.25, TOT_Y + BH / 2 - 0.62, 0], [BX + BW / 2 - 0.25, TOT_Y + BH / 2 - 0.62, 0], C.line, 1.4);
  let trapVal = makeTotalVal(42, C.green);
  let trapStatus = makeTotalStatus('B ALREADY COUNTED', C.green);

  const bOrig = slip('B', [TX, TOT_Y + 0.55, 0], TW, TH);
  const bOrigBadge = badge('✓ COUNTED ONCE', [TX, TOT_Y + 0.55 + TH / 2 + 0.24, 0], C.green, 13, 2.4);
  const bCopy = slip('B', [TX, TOT_Y - 0.85, 0], TW, TH, C.pink, 'COPY 2 · SENT AGAIN');

  await until(S(43));
  await play(
    ...scaleAll.map(o => fadeOut(o, 0.35)),
    fadeIn(trapFrame, 0.45), fadeIn(trapHdr, 0.45), fadeIn(trapDiv, 0.45), fadeIn(trapVal, 0.45), fadeIn(trapStatus, 0.45),
    fadeIn(bOrig, 0.45), fadeIn(bOrigBadge, 0.45), fadeIn(bCopy, 0.55),
    new M.Flash(bCopy, { color: C.pink, flashRadius: 0.34, lineLength: 0.2 }),
    ...fbox([['What if North retries?', C.pink], 'Ticket B ($8) arrives again!'], C.pink),
    ...say('TRAP: TICKET B SENT AGAIN?', C.pink)
  );

  // Beat 44: Computer mistakes copy 2 for another sale
  const dupArr = arrow([TX + TW / 2 + 0.12, TOT_Y - 0.72, 0], [BX - BW / 2 - 0.08, TOT_Y - 0.3, 0], C.pink, 3);
  const qTag = badge('NEW SALE?', [TX, TOT_Y - 0.85 - TH / 2 - 0.28, 0], C.pink, 14, 2.0);
  await until(S(44));
  await play(
    pulse(bCopy, C.pink), fadeIn(dupArr, 0.5), fadeIn(qTag, 0.45),
    ...fbox(['Computer sees Ticket B', ['Mistakes copy for new sale!', C.pink]], C.pink),
    ...say('MISTAKEN FOR ANOTHER SALE', C.pink)
  );

  // Beat 45: Wrongly raises total from $42 to $50
  const wrongFrame = rrect(BW, BH, [BX, TOT_Y, 0], C.pink, C.card, 0.95, 2.8, 0.16);
  const val50 = makeTotalVal(50, C.pink);
  const st50 = makeTotalStatus('WRONG! B COUNTED TWICE', C.pink);
  await until(S(45));
  await play(
    fadeOut(trapFrame, 0.3), fadeIn(wrongFrame, 0.45),
    fadeOut(trapVal, 0.3), fadeIn(val50, 0.45),
    fadeOut(trapStatus, 0.3), fadeIn(st50, 0.45),
    new M.Flash(val50, { color: C.pink, flashRadius: 0.36, lineLength: 0.2 }),
    ...fbox([['$42 + $8 = $50  (WRONG!)', C.pink], 'Same $8 counted twice', ['True total = $42', C.green]], C.pink),
    ...say('$42 + $8 = $50 (COUNTED TWICE!)', C.pink)
  );
  trapVal = val50;
  trapStatus = st50;

  // Beat 46: Must know which tickets are already counted
  const listY = P ? -3.45 : -2.42;
  const countedCard = new M.VGroup(
    rrect(P ? 6.6 : 7.4, 0.72, [CX, listY, 0], C.amber, C.card, 0.96, 2, 0.12),
    txt('ALREADY COUNTED:   A ✓   C ✓   D ✓   E ✓   B ✓', P ? 15 : 16, C.amber, [CX, listY, 0], true, true, P ? 6.2 : 7.0)
  );
  await until(S(46));
  await play(
    fadeIn(countedCard, 0.5),
    ...fbox([['Already counted:', C.amber], 'A, C, D, E, B', 'Check before adding!'], C.amber),
    ...say('TRACK ALREADY COUNTED TICKETS', C.amber)
  );

  // Beat 47: Next lesson — prevent this mistake
  const nextBadge = badge('NEXT LESSON: BLOCK DUPLICATES', [BX, TOT_Y + BH / 2 + 0.34, 0], C.violet, 14, BW + 0.4);
  await until(S(47));
  await play(
    fadeIn(nextBadge, 0.45), pulse(countedCard, C.violet),
    ...fbox([['Next lesson:', C.violet], 'Keep $42 even if B repeats'], C.violet),
    ...say('NEXT LESSON: PREVENT THIS MISTAKE', C.violet)
  );

  // ============================================================
  // BEAT 48: Final Recap
  // ============================================================
  const trapAll = [wrongFrame, trapHdr, trapDiv, trapVal, trapStatus, bOrig, bOrigBadge, bCopy, dupArr, qTag, countedCard, nextBadge];

  function recapCard(title, big, sub, pos, w, h, col) {
    const [x, y] = pos;
    return new M.VGroup(
      rrect(w, h, pos, col, C.card, 0.96, 2.2, 0.14),
      txt(title, P ? 15 : 14, col, [x, y + h * 0.30, 0], true, true, w - 0.2),
      txt(big, P ? 34 : 32, col, [x, y - 0.02, 0], true, true, w - 0.2),
      txt(sub, P ? 14 : 13, C.muted, [x, y - h * 0.32, 0], false, false, w - 0.2)
    );
  }

  let r1, r2, r3, opPlus, opEq;
  if (P) {
    const cw = 5.4, ch = 1.22;
    r1 = recapCard('PREVIOUS RESULT', '$34', 'already saved', [0, 0.55, 0], cw, ch, C.green);
    opPlus = txt('+', 30, C.ink, [0, -0.35, 0], true, true);
    r2 = recapCard('NEW CHANGE ONLY', '+$8', 'Ticket B (not yet included)', [0, -1.25, 0], cw, ch, C.cyan);
    opEq = txt('=', 30, C.ink, [0, -2.15, 0], true, true);
    r3 = recapCard('UPDATED RESULT', '$42', 'no repeated work', [0, -3.05, 0], cw, ch, C.amber);
  } else {
    const cw = 2.18, ch = 1.75, ry = -0.45;
    r1 = recapCard('PREVIOUS', '$34', 'already saved', [CX - 2.95, ry, 0], cw, ch, C.green);
    opPlus = txt('+', 30, C.ink, [CX - 1.48, ry, 0], true, true);
    r2 = recapCard('NEW CHANGE', '+$8', 'Ticket B only', [CX, ry, 0], cw, ch, C.cyan);
    opEq = txt('=', 30, C.ink, [CX + 1.48, ry, 0], true, true);
    r3 = recapCard('NEW TOTAL', '$42', 'up to date', [CX + 2.95, ry, 0], cw, ch, C.amber);
  }

  await until(S(48));
  await play(
    ...trapAll.map(o => fadeOut(o, 0.35)),
    fadeIn(r1, 0.5), fadeIn(opPlus, 0.5), fadeIn(r2, 0.5), fadeIn(opEq, 0.5), fadeIn(r3, 0.5),
    ...fbox([['Incremental processing:', C.green], 'Keep previous result ($34)', 'Add only new changes (+$8)', ['Updated total = $42', C.amber]], C.green),
    ...say('KEEP PREVIOUS · ADD ONLY NEW', C.green)
  );
}

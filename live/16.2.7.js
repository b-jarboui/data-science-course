// 16.2.7 Distributed aggregation: combine results from different groups.
// Beat i = sentence i in lesson.json (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.75, 0] : [4.3, -0.3, 0];   // phone: formula card below the picture (uses the lower third)

  const TICKETS = [
    { id: 'A', shop: 'North', amt: 4, col: C.cyan },
    { id: 'B', shop: 'North', amt: 8, col: C.cyan },
    { id: 'C', shop: 'South', amt: 6, col: C.amber },
    { id: 'D', shop: 'South', amt: 10, col: C.amber },
    { id: 'E', shop: 'South', amt: 14, col: C.amber },
  ];

  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);
  const fadeIn = (o, runTime = 0.42) => new M.FadeIn(o, { runTime });
  const fadeOut = (o, runTime = 0.34) => new M.FadeOut(o, { runTime });
  const pulse = (o, color = C.amber, runTime = 0.65) =>
    new M.Indicate(o, { color, scaleFactor: 1.04, runTime });

  function txt(s, x, y, size, color = C.ink, maxW = null, bold = false) {
    const t = T(String(s), size, color, true, bold);
    if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function panel(x, y, w, h, color, fill = C.card, op = 0.94, sw = 2) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: sw });
    r.setFill(fill, op);
    r.moveTo([x, y, 0]);
    return r;
  }

  function arrow(a, b, color = C.muted, sw = 2.6) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, hl = 0.17, hw = 0.085;
    const base = [b[0] - ux * hl, b[1] - uy * hl, 0];
    const stem = new M.Line({ start: [a[0], a[1], 0], end: base, color, strokeWidth: sw });
    const tip = new M.Polygon({
      vertices: [
        [b[0], b[1], 0],
        [base[0] - uy * hw, base[1] + ux * hw, 0],
        [base[0] + uy * hw, base[1] - ux * hw, 0],
      ],
      color, strokeWidth: 1,
    });
    tip.setFill(color, 1);
    return new M.VGroup(stem, tip);
  }

  // Formula box: up to 3 lines, stays clear of PILL and data on both laptop and phone.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20, lh = P ? 0.44 : 0.41;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true, true));
    const cw = T('0000000000', size, C.ink, true, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = panel(BOXP[0], BOXP[1], wd, ht, color, C.card, 0.95);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [fadeIn(g)];
    if (boxNow) a.push(fadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    const a = boxNow ? [fadeOut(boxNow)] : [];
    boxNow = null;
    return a;
  }

  function shopfront(name, x, y, color) {
    const roof = new M.Polygon({
      vertices: [[x - 1.25, y + 0.56, 0], [x, y + 1.18, 0], [x + 1.25, y + 0.56, 0]],
      color, strokeWidth: 2,
    });
    roof.setFill(color, 0.22);
    return new M.VGroup(
      panel(x, y, 2.25, 1.10, color),
      roof,
      txt(name, x, y, 25, color, 1.9, true),
    );
  }

  function slipCard(t, x, y, w = 1.10, h = 1.08, compact = false) {
    return new M.VGroup(
      panel(x, y, w, h, t.col, C.card, 0.96),
      txt(compact ? t.id : `Ticket ${t.id}`, x, y + h * 0.28, compact ? 16 : 15, t.col, w - 0.14, true),
      txt(`$${t.amt}`, x, y - 0.02, compact ? 19 : 22, C.ink, w - 0.14, true),
      txt(t.shop, x, y - h * 0.31, compact ? 15 : 14, C.muted, w - 0.14),
    );
  }

  function personIcon(x, y, color) {
    const head = new M.Circle({ radius: 0.15, color });
    head.setFill(color, 1);
    head.moveTo([x, y + 0.34, 0]);
    const body = new M.Arc({ radius: 0.27, startAngle: 0, angle: Math.PI, color });
    body.setFill(color, 1);
    body.moveTo([x, y - 0.02, 0]);
    return new M.VGroup(head, body);
  }

  function packet(text, x, y, w, h, color) {
    return new M.VGroup(
      panel(x, y, w, h, color, C.bg, 0.96, 2.2),
      txt(text, x, y, P ? 16 : 15, color, w - 0.20, true),
    );
  }

  // --- 0-1: North & South bakery shops ---
  const shopY0 = P ? -0.95 : -0.60;
  const shopN = shopfront('North', CX - 1.75, shopY0, C.cyan);
  const shopS = shopfront('South', CX + 1.75, shopY0, C.amber);

  await until(S(0));
  await play(fadeIn(shopN), fadeIn(shopS), ...say('NORTH & SOUTH BAKERY SHOPS'));

  await until(S(1));
  await play(...fbox(['Monday sales', ['Average per sale?', C.amber]], C.amber),
    ...say('MONDAY: AVERAGE PER SALE?', C.amber));

  // --- 2-9: Two separate shop computers & Monday's five tickets ---
  const compY = P ? -1.40 : -0.78;
  const compH = P ? 2.55 : 2.15;
  const compNX = CX - 2.02, compNW = 2.98;
  const compSX = CX + 1.60, compSW = 3.82;
  const compN = new M.VGroup(
    panel(compNX, compY, compNW, compH, C.cyan),
    txt('North computer', compNX, compY + compH / 2 - 0.32, P ? 19 : 18, C.cyan, compNW - 0.25, true),
  );
  const compS = new M.VGroup(
    panel(compSX, compY, compSW, compH, C.amber),
    txt('South computer', compSX, compY + compH / 2 - 0.32, P ? 19 : 18, C.amber, compSW - 0.25, true),
  );
  const divider = new M.DashedLine({
    start: [CX - 0.42, compY - compH / 2 - 0.15, 0],
    end: [CX - 0.42, compY + compH / 2 + 0.15, 0],
    color: C.muted,
  });

  await until(S(2));
  await play(fadeOut(shopN), fadeOut(shopS), fadeIn(compN), fadeIn(compS), new M.Create(divider, { runTime: 0.45 }),
    ...say('TWO SEPARATE COMPUTERS'));

  const qY = compY + compH / 2 + (P ? 0.72 : 0.62);
  const qBadge = new M.VGroup(
    panel(CX, qY, 3.1, 0.56, C.amber, C.bg, 0.94),
    txt('Answer without all tickets?', CX, qY, 15, C.amber, 2.85, true),
  );
  await until(S(3));
  await play(fadeIn(qBadge), pulse(compN, C.cyan), pulse(compS, C.amber),
    ...say('WITHOUT SENDING EVERY TICKET?', C.amber));

  await until(S(4));
  await play(fadeOut(qBadge),
    ...fbox(['Monday sales', ['5 tickets (B arrived)', C.cyan]], C.cyan),
    ...say('MONDAY: 5 SALES (LATE B ARRIVED)'));

  const slipY = compY - 0.22;
  const slipXs = [CX - 2.66, CX - 1.38, CX + 0.36, CX + 1.60, CX + 2.84];
  const slips = TICKETS.map((t, i) => slipCard(t, slipXs[i], slipY, 1.08, 1.12));

  await until(S(5));
  await play(fadeIn(slips[0]), ...fbox(['North computer', ['Ticket A: $4', C.cyan]], C.cyan),
    ...say('NORTH: TICKET A ($4)', C.cyan));

  await until(S(6));
  await play(fadeIn(slips[1]), ...fbox(['North computer', 'Ticket A: $4', ['Ticket B: $8', C.cyan]], C.cyan),
    ...say('NORTH: TICKET B ($8)', C.cyan));

  await until(S(7));
  await play(fadeIn(slips[2]), ...fbox(['South computer', ['Ticket C: $6', C.amber]], C.amber),
    ...say('SOUTH: TICKET C ($6)', C.amber));

  await until(S(8));
  await play(fadeIn(slips[3]), ...fbox(['South computer', 'Ticket C: $6', ['Ticket D: $10', C.amber]], C.amber),
    ...say('SOUTH: TICKET D ($10)', C.amber));

  await until(S(9));
  await play(fadeIn(slips[4]), ...fbox(['South computer', 'C: $6   D: $10', ['Ticket E: $14', C.amber]], C.amber),
    ...say('SOUTH: TICKET E ($14)', C.amber));

  // --- 10-13: Dollar-block stacks & fair share ---
  const BASE = P ? -3.85 : -2.15;
  const PITCH = P ? 0.30 : 0.215;
  const BW = P ? 0.78 : 0.74;
  const COLX = [CX - 2.55, CX - 1.37, CX + 0.25, CX + 1.43, CX + 2.61];
  const blockAt = (col, j, color) => {
    const b = new M.Rectangle({ width: BW, height: PITCH * 0.78, color, strokeWidth: 1 });
    b.setFill(color, 0.84);
    b.moveTo([COLX[col], BASE + (j + 0.5) * PITCH, 0]);
    return b;
  };
  const stacks = TICKETS.map((t, k) => Array.from({ length: t.amt }, (_, j) => blockAt(k, j, t.col)));
  const floor = new M.Line({ start: [COLX[0] - 0.55, BASE, 0], end: [COLX[4] + 0.55, BASE, 0], color: C.muted, strokeWidth: 2 });
  const stackLabels = TICKETS.map((t, k) =>
    txt(`${t.id} $${t.amt}`, COLX[k], BASE - 0.30, P ? 16 : 16, t.col, 1.1, true));
  const blockNote = txt('1 block = $1', CX + 2.1, BASE - 0.68, 15, C.muted, 2.2);

  await until(S(10));
  await play(
    fadeOut(compN), fadeOut(compS), fadeOut(divider),
    ...slips.map(o => fadeOut(o)),
    ...clearBox(),
    new M.Create(floor, { runTime: 0.45 }),
    ...stackLabels.map(o => fadeIn(o)),
    fadeIn(blockNote),
    new M.LaggedStart(
      stacks.map(st => new M.LaggedStart(st.map(b => fadeIn(b, 0.22)), { lagRatio: 0.08 })),
      { lagRatio: 0.14, runTime: 1.9 },
    ),
    ...say('EACH BLOCK = $1'),
  );

  const topY = BASE + 14 * PITCH + 0.36;
  const grpN = pill('NORTH: 2 STACKS', C.cyan, P ? 15 : 15).moveTo([CX - 1.96, topY, 0]);
  const grpS = pill('SOUTH: 3 STACKS', C.amber, P ? 15 : 15).moveTo([CX + 1.43, topY, 0]);

  await until(S(11));
  await play(fadeIn(grpN), fadeIn(grpS), ...say('NORTH: 2 STACKS · SOUTH: 3 STACKS'));

  const fairY = BASE + 8.4 * PITCH;
  const fairLine = new M.DashedLine({
    start: [COLX[0] - 0.55, fairY, 0],
    end: [COLX[4] + 0.55, fairY, 0],
    color: C.green,
  });
  const fairTag = pill('FAIR SHARE = ?', C.green, 15).moveTo([CX - 2.15, fairY + 0.40, 0]);

  await until(S(12));
  await play(new M.Create(fairLine, { runTime: 0.55 }), fadeIn(fairTag),
    ...say('ONE FAIR SHARE FOR ALL 5 SALES', C.green));

  await until(S(13));
  await play(pulse(fairLine, C.green), pulse(fairTag, C.green),
    ...fbox(['Goal', ['Fair share = mean', C.green], ['(average per sale)', C.muted]], C.green),
    ...say('FAIR SHARE = MEAN (AVERAGE)', C.green));

  // --- 14-16: Analogy — two people counting money at separate tables ---
  const tblY = P ? -1.25 : -0.68;
  const t1X = CX - 1.85, t2X = CX + 1.85;
  const table1 = new M.VGroup(
    personIcon(t1X, tblY + 0.62, C.cyan),
    panel(t1X, tblY - 0.18, 2.5, 0.92, C.cyan, C.card, 0.94),
    txt('Table 1', t1X, tblY + 0.08, 16, C.cyan, 2.2, true),
    txt('$4   $8', t1X, tblY - 0.34, 18, C.ink, 2.2, true),
  );
  const table2 = new M.VGroup(
    personIcon(t2X, tblY + 0.62, C.amber),
    panel(t2X, tblY - 0.18, 2.75, 0.92, C.amber, C.card, 0.94),
    txt('Table 2', t2X, tblY + 0.08, 16, C.amber, 2.4, true),
    txt('$6   $10   $14', t2X, tblY - 0.34, 18, C.ink, 2.5, true),
  );

  await until(S(14));
  await play(
    fadeOut(floor), fadeOut(blockNote), fadeOut(grpN), fadeOut(grpS),
    fadeOut(fairLine), fadeOut(fairTag),
    ...stackLabels.map(o => fadeOut(o)),
    ...stacks.flat().map(o => fadeOut(o)),
    ...clearBox(),
    fadeIn(table1), fadeIn(table2),
    ...say('TWO PEOPLE AT SEPARATE TABLES'),
  );

  const sumTag1 = pill('TABLE 1: $12', C.cyan, 16).moveTo([t1X, tblY - 1.05, 0]);
  const sumTag2 = pill('TABLE 2: $30', C.amber, 16).moveTo([t2X, tblY - 1.05, 0]);

  await until(S(15));
  await play(fadeIn(sumTag1), fadeIn(sumTag2),
    ...fbox(['Separate counts', ['Table 1: $12', C.cyan], ['Table 2: $30', C.amber]], C.amber),
    ...say('EACH COUNTS THEIR OWN TABLE', C.amber));

  const totY = tblY - (P ? 2.15 : 1.92);
  const arrT1 = arrow([t1X + 0.2, tblY - 1.34], [CX - 0.6, totY + 0.30], C.cyan);
  const arrT2 = arrow([t2X - 0.2, tblY - 1.34], [CX + 0.6, totY + 0.30], C.amber);
  const totBadge = pill('TOGETHER: $12 + $30 = $42', C.green, 16).moveTo([CX, totY, 0]);

  await until(S(16));
  await play(fadeIn(arrT1), fadeIn(arrT2), fadeIn(totBadge),
    ...fbox(['Combine totals', ['$12 + $30 = $42', C.green]], C.green),
    ...say('COMBINE TOTALS TOGETHER', C.green));

  // --- 17-35: Distributed 3-computer architecture ---
  const mainY = P ? 0.35 : 0.48, mainW = P ? 6.6 : 5.6, mainH = P ? 2.25 : 1.72;
  const shopY = P ? -3.35 : -2.02, shopH = P ? 2.30 : 1.66;
  const netNX = P ? -1.92 : CX - 2.02, netNW = P ? 3.04 : 2.98;
  const netSX = P ? 1.60 : CX + 1.60, netSW = 3.82;

  const netMain = new M.VGroup(
    panel(CX, mainY, mainW, mainH, C.green),
    txt('Main computer', CX, mainY + mainH / 2 - (P ? 0.28 : 0.24), P ? 19 : 18, C.green, mainW - 0.4, true),
  );
  const netNorth = new M.VGroup(
    panel(netNX, shopY, netNW, shopH, C.cyan),
    txt('North computer', netNX, shopY + shopH / 2 - 0.26, P ? 18 : 17, C.cyan, netNW - 0.25, true),
  );
  const netSouth = new M.VGroup(
    panel(netSX, shopY, netSW, shopH, C.amber),
    txt('South computer', netSX, shopY + shopH / 2 - 0.26, P ? 18 : 17, C.amber, netSW - 0.25, true),
  );
  const arrNM = arrow(
    [netNX + 0.25, shopY + shopH / 2 + 0.04],
    [CX - 1.25, mainY - mainH / 2 - 0.04],
    C.cyan,
  );
  const arrSM = arrow(
    [netSX - 0.25, shopY + shopH / 2 + 0.04],
    [CX + 1.25, mainY - mainH / 2 - 0.04],
    C.amber,
  );

  const miniY = shopY + (P ? 0.02 : -0.02);
  const miniH = P ? 0.92 : 0.78;
  const miniXs = [netNX - 0.68, netNX + 0.68, netSX - 1.22, netSX, netSX + 1.22];
  const miniSlips = TICKETS.map((t, i) => slipCard(t, miniXs[i], miniY, 1.06, miniH, true));

  await until(S(17));
  await play(
    fadeOut(table1), fadeOut(table2), fadeOut(sumTag1), fadeOut(sumTag2),
    fadeOut(arrT1), fadeOut(arrT2), fadeOut(totBadge),
    ...clearBox(),
    fadeIn(netMain), fadeIn(netNorth), fadeIn(netSouth), fadeIn(arrNM), fadeIn(arrSM),
    ...miniSlips.map(o => fadeIn(o)),
    ...say('SHOP COMPUTERS + MAIN COMPUTER'),
  );

  await until(S(18));
  await play(
    new M.LaggedStart(miniSlips.map(o => pulse(o, C.violet, 0.5)), { lagRatio: 0.12, runTime: 1.2 }),
    ...fbox(['Aggregation', ['combine numbers into', C.muted], ['one summary', C.violet]], C.violet),
    ...say('NUMBERS → SUMMARY = AGGREGATION', C.violet),
  );

  await until(S(19));
  await play(
    new M.LaggedStart([pulse(netNorth, C.violet), pulse(netSouth, C.violet), pulse(netMain, C.violet)],
      { lagRatio: 0.25, runTime: 1.3 }),
    ...fbox(['Distributed aggregation', ['separate computers', C.cyan], ['share the work', C.violet]], C.violet),
    ...say('DISTRIBUTED AGGREGATION', C.violet),
  );

  // --- 20-25: North computes sum & count and sends them ---
  const outN = panel(netNX, shopY, netNW + 0.12, shopH + 0.12, C.cyan, C.bg, 0, 3.2);
  await until(S(20));
  await play(new M.Create(outN, { runTime: 0.45 }),
    ...fbox(['North computer', ['Tickets: A, B', C.cyan]], C.cyan),
    ...say('START AT NORTH', C.cyan));

  await until(S(21));
  await play(pulse(miniSlips[0], C.cyan), pulse(miniSlips[1], C.cyan),
    ...fbox(['North sum', ['$4 + $8 = $12', C.cyan]], C.cyan),
    ...say('NORTH: $4 + $8 = $12', C.cyan));

  const locY = shopY - shopH / 2 + (P ? 0.34 : 0.24);
  const locSumN = txt('sum = $12', netNX, locY, P ? 17 : 15, C.cyan, netNW - 0.3, true);
  await until(S(22));
  await play(fadeIn(locSumN),
    ...fbox(['North computer', ['sum = $12', C.cyan]], C.cyan),
    ...say('SUM = TOTAL OF AMOUNTS', C.cyan));

  const locBothN = txt('sum $12 · count 2', netNX, locY, P ? 17 : 15, C.cyan, netNW - 0.25, true);
  await until(S(23));
  await play(fadeOut(locSumN), fadeIn(locBothN), pulse(miniSlips[0], C.cyan), pulse(miniSlips[1], C.cyan),
    ...fbox(['North computer', 'sum   = $12', ['count = 2', C.cyan]], C.cyan),
    ...say('NORTH COUNT = 2 TICKETS', C.cyan));

  await until(S(24));
  await play(pulse(locBothN, C.cyan), ...say('COUNT = HOW MANY SALES', C.cyan));

  const pktRowY = mainY + (P ? 0.10 : 0.07);
  const pktW = P ? 2.85 : 2.48, pktH = P ? 0.54 : 0.46;
  const pktN = packet('North: $12, 2', netNX, locY, pktW, pktH, C.cyan);
  const pktNTarget = packet('North: $12, 2', CX - (P ? 1.55 : 1.34), pktRowY, pktW, pktH, C.cyan);

  await until(S(25));
  await play(new M.Transform(pktN, pktNTarget, { runTime: 1.0 }), pulse(arrNM, C.cyan),
    ...say('NORTH SENDS: SUM $12, COUNT 2', C.cyan));

  // --- 26-31: South computes sum & count and sends them ---
  const outS = panel(netSX, shopY, netSW + 0.12, shopH + 0.12, C.amber, C.bg, 0, 3.2);
  await until(S(26));
  await play(fadeOut(outN), new M.Create(outS, { runTime: 0.45 }),
    ...fbox(['South computer', ['Tickets: C, D, E', C.amber]], C.amber),
    ...say('NOW AT SOUTH', C.amber));

  await until(S(27));
  await play(pulse(miniSlips[2], C.amber), pulse(miniSlips[3], C.amber),
    ...fbox(['South sum', ['$6 + $10 = $16', C.amber]], C.amber),
    ...say('SOUTH: $6 + $10 = $16', C.amber));

  await until(S(28));
  await play(pulse(miniSlips[4], C.amber),
    ...fbox(['South sum', '$6 + $10 = $16', ['$16 + $14 = $30', C.amber]], C.amber),
    ...say('SOUTH: $16 + $14 = $30', C.amber));

  const locBothS = txt('sum $30 · count 3', netSX, locY, P ? 17 : 15, C.amber, netSW - 0.25, true);
  await until(S(29));
  await play(fadeIn(locBothS),
    ...fbox(['South computer', 'sum   = $30', ['count = 3', C.amber]], C.amber),
    ...say('SOUTH: SUM $30, COUNT 3', C.amber));

  const pktS = packet('South: $30, 3', netSX, locY, pktW, pktH, C.amber);
  const pktSTarget = packet('South: $30, 3', CX + (P ? 1.55 : 1.34), pktRowY, pktW, pktH, C.amber);

  await until(S(30));
  await play(new M.Transform(pktS, pktSTarget, { runTime: 1.0 }), pulse(arrSM, C.amber),
    ...say('SOUTH SENDS: SUM $30, COUNT 3', C.amber));

  const outM = panel(CX, mainY, mainW + 0.12, mainH + 0.12, C.green, C.bg, 0, 3.2);
  await until(S(31));
  await play(fadeOut(outS), new M.Create(outM, { runTime: 0.45 }), pulse(pktN, C.cyan), pulse(pktS, C.amber),
    ...fbox(['Main received', ['North: $12, 2', C.cyan], ['South: $30, 3', C.amber]], C.green),
    ...say('2 SMALL SUMMARIES, NOT 5 TICKETS', C.green));

  // --- 32-35: Main combines sums & counts ---
  const combRowY = mainY - (P ? 0.65 : 0.52);
  await until(S(32));
  await play(pulse(pktN, C.amber), pulse(pktS, C.amber),
    ...fbox(['Step 1: combine sums', ['$12 + $30', C.amber]], C.amber),
    ...say('STEP 1: COMBINE THE SUMS', C.amber));

  const combSum = packet('sum = $42', CX - (P ? 1.55 : 1.34), combRowY, pktW, P ? 0.50 : 0.42, C.amber);
  await until(S(33));
  await play(fadeIn(combSum),
    ...fbox(['Step 1: combine sums', ['$12 + $30 = $42', C.amber]], C.amber),
    ...say('$12 + $30 = $42', C.amber));

  await until(S(34));
  await play(pulse(pktN, C.green), pulse(pktS, C.green),
    ...fbox(['Step 2: combine counts', ['2 + 3', C.green]], C.green),
    ...say('STEP 2: COMBINE THE COUNTS', C.green));

  const combCnt = packet('count = 5', CX + (P ? 1.55 : 1.34), combRowY, pktW, P ? 0.50 : 0.42, C.green);
  await until(S(35));
  await play(fadeIn(combCnt),
    ...fbox(['Step 2: combine counts', ['2 + 3 = 5 sales', C.green]], C.green),
    ...say('2 + 3 = 5 SALES', C.green));

  // --- 36-40: Share $42 equally among 5 sales & formula ---
  const eqBase = P ? -3.35 : -2.02;
  const eqH = P ? 2.55 : 1.92;
  const eqTop = eqBase + eqH;
  const eqXs = [-2.4, -1.2, 0, 1.2, 2.4].map(dx => CX + dx);
  const eqFloor = new M.Line({ start: [eqXs[0] - 0.65, eqBase, 0], end: [eqXs[4] + 0.65, eqBase, 0], color: C.muted, strokeWidth: 2 });
  const eqBars = TICKETS.map((t, i) => {
    const b = new M.Rectangle({ width: 0.80, height: eqH, color: t.col, strokeWidth: 2 });
    b.setFill(t.col, 0.72);
    b.moveTo([eqXs[i], eqBase + eqH / 2, 0]);
    return b;
  });
  const eqNames = TICKETS.map((t, i) => txt(t.id, eqXs[i], eqBase - 0.30, 18, t.col, 0.8, true));
  const eqQs = TICKETS.map((_, i) => txt('?', eqXs[i], eqTop + 0.28, 18, C.green, 0.8, true));
  const eqLine = new M.DashedLine({ start: [eqXs[0] - 0.65, eqTop, 0], end: [eqXs[4] + 0.65, eqTop, 0], color: C.green });
  const eqBanner = txt('$42 shared equally among 5 sales', CX, eqBase - 0.72, P ? 17 : 16, C.muted, 6.2);

  await until(S(36));
  await play(
    fadeOut(netMain), fadeOut(netNorth), fadeOut(netSouth), fadeOut(arrNM), fadeOut(arrSM),
    fadeOut(locBothN), fadeOut(locBothS), fadeOut(pktN), fadeOut(pktS), fadeOut(outM),
    fadeOut(combSum), fadeOut(combCnt),
    ...miniSlips.map(o => fadeOut(o)),
    new M.Create(eqFloor, { runTime: 0.45 }),
    new M.Create(eqLine, { runTime: 0.45 }),
    fadeIn(eqBanner),
    ...eqBars.map(o => fadeIn(o)),
    ...eqNames.map(o => fadeIn(o)),
    ...eqQs.map(o => fadeIn(o)),
    ...fbox(['Step 3: share equally', ['$42 ÷ 5 = ?', C.green]], C.green),
    ...say('STEP 3: SHARE $42 AMONG 5 SALES', C.green),
  );

  const eqVals = TICKETS.map((_, i) => txt('$8.40', eqXs[i], eqTop + 0.28, 16, C.amber, 0.95, true));
  const eqTag = pill('MEAN = $8.40 EACH', C.amber, 17).moveTo([CX, eqTop + 0.85, 0]);

  await until(S(37));
  await play(
    ...eqQs.map(o => fadeOut(o)),
    ...eqVals.map(o => fadeIn(o)),
    fadeIn(eqTag),
    ...fbox(['Combined sum  = $42', 'Combined count = 5', ['$42 ÷ 5 = $8.40', C.amber]], C.amber),
    ...say('$42 ÷ 5 = $8.40', C.amber),
  );

  await until(S(38));
  await play(pulse(eqTag, C.green), pulse(eqLine, C.green),
    ...say('OVERALL MEAN = $8.40 PER SALE', C.green));

  await until(S(39));
  await play(...fbox(['Formula', ['one short line', C.muted]], C.cyan),
    ...say('FORMULA = ONE SHORT LINE', C.cyan));

  await until(S(40));
  await play(
    ...fbox([['overall mean =', C.ink], ['combined sum ÷ combined count', C.cyan], ['= $42 ÷ 5 = $8.40', C.amber]], C.cyan),
    ...say('COMBINED SUM ÷ COMBINED COUNT', C.cyan),
  );

  // --- 41: Scaling to many computers ---
  const manyMainY = P ? 0.50 : 0.42;
  const manyShopY = P ? -2.35 : -1.55;
  const manyMain = new M.VGroup(
    panel(CX, manyMainY, 3.6, 0.95, C.green),
    txt('Main computer', CX, manyMainY + 0.16, 18, C.green, 3.2, true),
    txt('combines all sums & counts', CX, manyMainY - 0.18, 14, C.ink, 3.3),
  );
  const manyShops = [0, 1, 2, 3].map(i => {
    const sx = CX + (i - 1.5) * 1.68;
    const col = i % 2 === 0 ? C.cyan : C.amber;
    return new M.VGroup(
      panel(sx, manyShopY, 1.48, 1.12, col),
      txt(`Shop ${i + 1}`, sx, manyShopY + 0.24, 15, col, 1.3, true),
      txt('sum, count', sx, manyShopY - 0.18, 13, C.muted, 1.3),
    );
  });
  const manyArrows = [0, 1, 2, 3].map(i => {
    const sx = CX + (i - 1.5) * 1.68;
    return arrow([sx, manyShopY + 0.60], [CX + (i - 1.5) * 0.72, manyMainY - 0.52], i % 2 === 0 ? C.cyan : C.amber);
  });

  await until(S(41));
  await play(
    fadeOut(eqFloor), fadeOut(eqLine), fadeOut(eqBanner), fadeOut(eqTag),
    ...eqBars.map(o => fadeOut(o)),
    ...eqNames.map(o => fadeOut(o)),
    ...eqVals.map(o => fadeOut(o)),
    fadeIn(manyMain),
    new M.LaggedStart(manyShops.map(o => fadeIn(o)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.LaggedStart(manyArrows.map(o => fadeIn(o)), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('MANY COMPUTERS SHARE THE WORK', C.violet),
  );

  // --- 42: Common mistake intro ---
  const warnCard = new M.VGroup(
    panel(CX, P ? -1.0 : -0.5, P ? 6.2 : 5.8, 1.55, C.pink, C.card, 0.96, 2.5),
    txt('Common mistake', CX, (P ? -1.0 : -0.5) + 0.30, 22, C.pink, 5.4, true),
    txt('Averaging the shop means directly?', CX, (P ? -1.0 : -0.5) - 0.26, 18, C.ink, 5.4),
  );

  await until(S(42));
  await play(
    fadeOut(manyMain),
    ...manyShops.map(o => fadeOut(o)),
    ...manyArrows.map(o => fadeOut(o)),
    ...clearBox(),
    fadeIn(warnCard),
    ...say('A COMMON MISTAKE', C.pink),
  );

  // --- 43-53: Compare averaging shop means ($8.00) vs true overall mean ($8.40) ---
  const cardY = P ? 0.38 : 0.52;
  const cardH = P ? 1.65 : 1.42;
  const cardW = 3.18;
  const cardN = new M.VGroup(
    panel(CX - 1.78, cardY, cardW, cardH, C.cyan),
    txt('North shop', CX - 1.78, cardY + cardH * 0.28, 18, C.cyan, cardW - 0.3, true),
    txt('$12 ÷ 2 sales', CX - 1.78, cardY - 0.02, 16, C.muted, cardW - 0.3),
  );
  const cardS = new M.VGroup(
    panel(CX + 1.78, cardY, cardW, cardH, C.amber),
    txt('South shop', CX + 1.78, cardY + cardH * 0.28, 18, C.amber, cardW - 0.3, true),
    txt('$30 ÷ 3 sales', CX + 1.78, cardY - 0.02, 16, C.muted, cardW - 0.3),
  );

  const scaleY = P ? -3.05 : -1.88;
  const nx = v => CX + (v - 8) * 1.2;
  const scaleLine = new M.Line({ start: [nx(5.2), scaleY, 0], end: [nx(10.8), scaleY, 0], color: C.muted, strokeWidth: 3 });
  const scaleTicks = [6, 7, 8, 9, 10].map(v => new M.VGroup(
    new M.Line({ start: [nx(v), scaleY - 0.09, 0], end: [nx(v), scaleY + 0.09, 0], color: C.muted }),
    txt(`$${v}`, nx(v), scaleY - 0.34, 16, C.muted, 0.7, true),
  ));

  await until(S(43));
  await play(
    fadeOut(warnCard),
    fadeIn(cardN), fadeIn(cardS),
    new M.Create(scaleLine, { runTime: 0.45 }),
    ...scaleTicks.map(o => fadeIn(o)),
    ...say('MEAN FOR EACH SHOP SEPARATELY'),
  );

  const meanTextN = txt('mean = $6', CX - 1.78, cardY - cardH * 0.30, 19, C.cyan, cardW - 0.3, true);
  const dotStep = P ? 0.36 : 0.32;
  const dotY0 = scaleY + (P ? 0.34 : 0.28);
  const dotN1 = new M.Dot({ point: [nx(6), dotY0, 0], radius: 0.13, color: C.cyan });

  await until(S(44));
  await play(fadeIn(meanTextN), fadeIn(dotN1), new M.Flash(dotN1, { color: C.cyan }),
    ...fbox(['North mean', ['$12 ÷ 2 = $6', C.cyan]], C.cyan),
    ...say('NORTH MEAN = $6 PER SALE', C.cyan));

  const meanTextS = txt('mean = $10', CX + 1.78, cardY - cardH * 0.30, 19, C.amber, cardW - 0.3, true);
  const dotS1 = new M.Dot({ point: [nx(10), dotY0, 0], radius: 0.13, color: C.amber });

  await until(S(45));
  await play(fadeIn(meanTextS), fadeIn(dotS1), new M.Flash(dotS1, { color: C.amber }),
    ...fbox(['South mean', ['$30 ÷ 3 = $10', C.amber]], C.amber),
    ...say('SOUTH MEAN = $10 PER SALE', C.amber));

  await until(S(46));
  await play(pulse(dotN1, C.pink), pulse(dotS1, C.pink),
    ...fbox(['Equal importance?', ['North $6  ·  South $10', C.pink]], C.pink),
    ...say('EQUAL IMPORTANCE FOR BOTH MEANS?', C.pink));

  await until(S(47));
  await play(...fbox(['Average the means?', ['$6 + $10 = $16', C.pink]], C.pink),
    ...say('$6 + $10 = $16', C.pink));

  const tagY = scaleY - (P ? 1.25 : 0.84);
  const wrongDot = new M.Dot({ point: [nx(8), scaleY, 0], radius: 0.11, color: C.pink });
  const wrongStem = new M.Line({ start: [nx(8), scaleY - 0.10, 0], end: [CX - 1.15, tagY + 0.22, 0], color: C.pink, strokeWidth: 2 });
  const wrongTag = pill('$8.00', C.pink, 16).moveTo([CX - 1.15, tagY, 0]);

  await until(S(48));
  await play(fadeIn(wrongDot), new M.Create(wrongStem, { runTime: 0.35 }), fadeIn(wrongTag),
    ...fbox(['Average the means?', '$6 + $10 = $16', ['$16 ÷ 2 = $8.00', C.pink]], C.pink),
    ...say('$16 ÷ 2 = $8.00', C.pink));

  const rightDot = new M.Dot({ point: [nx(8.4), scaleY, 0], radius: 0.12, color: C.green });
  const rightStem = new M.Line({ start: [nx(8.4), scaleY - 0.10, 0], end: [CX + 1.35, tagY + 0.22, 0], color: C.green, strokeWidth: 2 });
  const rightTag = pill('$8.40 ✓', C.green, 16).moveTo([CX + 1.35, tagY, 0]);
  const wrongTagX = pill('$8.00 ✗', C.pink, 16).moveTo([CX - 1.15, tagY, 0]);

  await until(S(49));
  await play(
    fadeOut(wrongTag), fadeIn(wrongTagX),
    fadeIn(rightDot), new M.Create(rightStem, { runTime: 0.35 }), fadeIn(rightTag),
    ...fbox(['Shop-mean avg: $8.00 ✗', ['Correct mean:  $8.40 ✓', C.green]], C.green),
    ...say('CORRECT MEAN IS $8.40, NOT $8.00', C.green),
  );

  const dotN2 = new M.Dot({ point: [nx(6), dotY0 + dotStep, 0], radius: 0.13, color: C.cyan });
  const dotS2 = new M.Dot({ point: [nx(10), dotY0 + dotStep, 0], radius: 0.13, color: C.amber });
  const dotS3 = new M.Dot({ point: [nx(10), dotY0 + 2 * dotStep, 0], radius: 0.13, color: C.amber });
  const cntTagN = txt('2 sales', nx(6), dotY0 + 2 * dotStep + 0.08, 15, C.cyan, 1.4, true);
  const cntTagS = txt('3 sales', nx(10), dotY0 + 3 * dotStep + 0.08, 15, C.amber, 1.4, true);

  await until(S(50));
  await play(fadeIn(dotN2), fadeIn(dotS2), fadeIn(dotS3), fadeIn(cntTagN), fadeIn(cntTagS),
    ...say('NORTH: 2 SALES · SOUTH: 3 SALES', C.amber));

  await until(S(51));
  await play(pulse(wrongTagX, C.pink), pulse(cntTagN, C.cyan), pulse(cntTagS, C.amber),
    ...say('EQUAL SHOP WEIGHT IGNORES 2 vs 3', C.pink));

  const allDots = [dotN1, dotN2, dotS1, dotS2, dotS3];
  await until(S(52));
  await play(
    new M.LaggedStart(allDots.map(d => pulse(d, C.green, 0.55)), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('SAME IMPORTANCE FOR EVERY SALE', C.green),
  );

  await until(S(53));
  await play(
    pulse(rightTag, C.green), pulse(rightDot, C.green),
    ...fbox([['Combine sums & counts', C.ink], ['before dividing:', C.muted], ['$42 ÷ 5 = $8.40', C.green]], C.green),
    ...say('COMBINE SUMS & COUNTS BEFORE DIVIDING', C.green),
  );
}

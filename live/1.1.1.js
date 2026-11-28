// lesson 1.1.1
// The observational unit: what one row represents.
// Live manim-web scene. Beat i begins at narration sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // short headings so they stay large and readable on a phone
  const HEAD = ['Order', 'Time', 'Drink', 'Size', 'Price $', 'Wait s', 'Takeaway'];
  const ROWS = [
    ['1', '8:05', 'coffee', 'small', '3', '120', 'yes'],
    ['2', '8:11', 'tea', 'medium', '4', '90', 'no'],
    ['3', '8:20', 'coffee', 'large', '5', '150', 'yes'],
    ['4', '8:26', 'juice', 'medium', '4', '60', 'no'],
    ['5', '8:40', 'coffee', 'medium', '4', '180', 'yes'],
    ['6', '8:52', 'tea', 'small', '3', '60', 'no'],
  ];

  // Laptop: table left, explanation right. Phone: table centred, explanation below.
  const TC = P ? [0, 0.35, 0] : [-2.75, -0.5, 0];
  const CX = TC[0];
  const PILL = P ? [0, 4.1, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.45, 0] : [4.3, -0.45, 0];
  const BOXW = P ? FW - 1.0 : 4.0;
  const BOX_TOP = -3.05; // phone only: top edge of the explanation card
  const say = (s, color = C.cyan) => showA(s, color, PILL);

  // Formula/explanation card, matching the approved live lesson helper.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;
    const rows = lines.map(line => Array.isArray(line) ? line : [line, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;
    const frame = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => {
      const indent = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + indent + t.getWidth() / 2, top - i * lh, 0]);
    });
    const group = new M.VGroup(frame, ...texts);
    const maxw = P ? FW - 1.2 : 4.8;
    const f = wd > maxw ? maxw / wd : 1;
    if (f < 1) group.scale(f);
    // phone: hang the card from just under the table, so tall cards never cover it
    if (P) group.moveTo([BOXP[0], BOX_TOP - ht * f / 2, 0]);
    const animations = [new M.FadeIn(group)];
    if (boxNow) animations.push(new M.FadeOut(boxNow));
    boxNow = group;
    return animations;
  }

  function fitText(t, maxWidth) {
    const w = t.getWidth();
    if (w > maxWidth) t.scale(maxWidth / w);
    return t;
  }

  // ---------- Opening picture: notebook and cafe ----------
  // k = size of the opening picture (bigger on phone so it fills the screen)
  // phone: cup on top, big notebook below, so the whole tall frame is used
  const k = P ? 1.6 : 1.3;
  const nbCenter = P ? [0, -2.3, 0] : [-2.3, -0.5, 0];
  const nx = nbCenter[0], ny = nbCenter[1];
  const notebookFrame = new M.RoundedRectangle({ width: 2.2 * k, height: 2.8 * k, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2.5 });
  notebookFrame.setFill(C.card, 0.95);
  notebookFrame.moveTo(nbCenter);
  const spine = new M.Line({ start: [nx - 0.8 * k, ny + 1.15 * k, 0], end: [nx - 0.8 * k, ny - 1.15 * k, 0], color: C.cyan, strokeWidth: 2 });
  const rules = Array.from({ length: 6 }, (_, i) => new M.Line({
    start: [nx - 0.55 * k, ny + (0.88 - i * 0.36) * k, 0],
    end: [nx + 0.78 * k, ny + (0.88 - i * 0.36) * k, 0],
    color: C.muted,
    strokeWidth: 1.5,
  }));
  const notebookLabel = T('notebook', 20, C.muted);
  notebookLabel.moveTo([nx, ny - 1.4 * k - 0.35, 0]);
  const notebook = new M.VGroup(notebookFrame, spine, notebookLabel);

  const cupCenter = P ? [0, 1.85, 0] : [2.3, -0.5, 0];
  const cupBody = new M.RoundedRectangle({ width: 0.95 * k, height: 0.9 * k, cornerRadius: 0.1, color: C.amber, strokeWidth: 2.5 });
  cupBody.setFill(C.amber, 0.16);
  cupBody.moveTo(cupCenter);
  const handle = new M.Arc({ radius: 0.24 * k, startAngle: -Math.PI / 2, angle: Math.PI, color: C.amber, strokeWidth: 2.5 });
  handle.moveTo([cupCenter[0] + 0.53 * k, cupCenter[1] + 0.02, 0]);
  const steam = [-0.22, 0, 0.22].map(dx => new M.Line({
    start: [cupCenter[0] + dx * k, cupCenter[1] + 0.58 * k, 0],
    end: [cupCenter[0] + (dx + 0.04) * k, cupCenter[1] + 1.02 * k, 0],
    color: C.muted,
    strokeWidth: 2,
  }));
  const cafeLabel = T('café', 20, C.muted);
  cafeLabel.moveTo([cupCenter[0], cupCenter[1] - 0.45 * k - 0.4, 0]);
  const cup = new M.VGroup(cupBody, handle, ...steam);
  const cafe = new M.VGroup(cup, cafeLabel);

  // ---------- Six notebook notes ----------
  const NW = P ? 3.3 : 2.6;
  const NH = P ? 1.6 : 1.0;
  const noteCols = P ? 2 : 3;
  const gx = P ? 3.55 : 2.85;
  const gy = P ? 2.5 : 1.3;
  const NC = P ? [0, -1.0, 0] : TC; // centre of the note grid
  const noteCards = [];
  const noteTexts = [];
  const noteGroups = ROWS.map((row, i) => {
    const rr = Math.floor(i / noteCols);
    const cc = i % noteCols;
    const nrows = 6 / noteCols;
    const pos = [
      NC[0] + (cc - (noteCols - 1) / 2) * gx,
      NC[1] + ((nrows - 1) / 2 - rr) * gy,
      0,
    ];
    const card = new M.RoundedRectangle({ width: NW, height: NH, cornerRadius: 0.1, color: C.ink, strokeWidth: 1.5 });
    card.setFill(C.card, 0.95);
    card.moveTo(pos);
    const time = T(row[1], P ? 26 : 20, C.amber, true);
    time.moveTo([pos[0], pos[1] + (P ? 0.32 : 0.2), 0]);
    const detail = T(`${row[3]} ${row[2]}`, P ? 26 : 20, C.ink, true);
    fitText(detail, NW - 0.24);
    detail.moveTo([pos[0], pos[1] - (P ? 0.32 : 0.2), 0]);
    noteCards.push(card);
    noteTexts.push(new M.VGroup(time, detail));
    return new M.VGroup(card, time, detail);
  });

  // ---------- Table geometry ----------
  const baseWidths = [0.8, 0.9, 1.05, 1.3, 1.0, 0.95, 1.35];
  const widthScale = P ? 6.6 / baseWidths.reduce((a, b) => a + b, 0) : 1;
  const CW = baseWidths.map(w => w * widthScale);
  const RH = P ? 0.86 : 0.55;
  const TW = CW.reduce((a, b) => a + b, 0);
  const FS = P ? 21 : 22;
  const HS = P ? 19 : 19;
  const x0 = TC[0] - TW / 2;
  const y0 = TC[1] + 3.5 * RH;
  const cx = c => x0 + CW.slice(0, c).reduce((a, b) => a + b, 0) + CW[c] / 2;
  const cy = r => y0 - (r + 0.5) * RH; // 0 = header; 1..6 = orders

  const tableCard = new M.RoundedRectangle({ width: TW + 0.24, height: 7 * RH + 0.24, cornerRadius: 0.16, color: C.muted, strokeWidth: 1.5 });
  tableCard.setFill(C.card, 0.96);
  tableCard.moveTo(TC);
  const rects = Array.from({ length: 7 }, (_, r) => CW.map((w, c) => {
    const cell = new M.Rectangle({ width: w, height: RH, color: C.muted, strokeWidth: 1.2 });
    cell.setFill(r === 0 ? C.cyan : C.card, r === 0 ? 0.14 : 0.88);
    cell.moveTo([cx(c), cy(r), 0]);
    return cell;
  }));
  const heads = HEAD.map((h, c) => {
    const t = T(h, HS, c === 0 ? C.muted : C.cyan, false);
    fitText(t, CW[c] - 0.1);
    t.moveTo([cx(c), cy(0), 0]);
    return t;
  });
  // the same headings, dim, so the header row is never empty while the rows are explained
  const headsDim = HEAD.map((h, c) => {
    const t = T(h, HS, C.muted, false);
    fitText(t, CW[c] - 0.1);
    t.moveTo([cx(c), cy(0), 0]);
    return t;
  });
  const vals = ROWS.map((row, r) => row.map((v, c) => {
    const t = T(v, FS, c === 0 ? C.muted : C.ink, c === 0 || c === 1 || c === 4 || c === 5);
    fitText(t, CW[c] - 0.1);
    t.moveTo([cx(c), cy(r + 1), 0]);
    return t;
  }));
  const valueRows = vals.map(row => new M.VGroup(...row));

  function outline(width, height, center, color, strokeWidth = 3, opacity = 0.04) {
    const r = new M.Rectangle({ width, height, color, strokeWidth });
    r.setFill(color, opacity);
    r.moveTo(center);
    return r;
  }
  function rowBox(r, c0 = 0, c1 = 6, color = C.amber, sw = 3) {
    const left = x0 + CW.slice(0, c0).reduce((a, b) => a + b, 0);
    const width = CW.slice(c0, c1 + 1).reduce((a, b) => a + b, 0);
    return outline(width - 0.04, RH - 0.04, [left + width / 2, cy(r), 0], color, sw, 0.035);
  }
  function cellBox(r, c, color = C.amber) {
    return outline(CW[c] - 0.1, RH - 0.08, [cx(c), cy(r), 0], color, 3.5, 0.07);
  }
  function colBox(c, color = C.cyan, opacity = 0.07) {
    return outline(CW[c] - 0.06, 7 * RH - 0.04, [cx(c), TC[1], 0], color, 3, opacity);
  }
  function headerGlow() {
    return outline(TW, RH - 0.02, [TC[0], cy(0), 0], C.cyan, 2.5, 0.02);
  }
  function focusCell(c, color = C.amber) {
    return new M.VGroup(cellBox(1, c, color), cellBox(0, c, color));
  }

  // Small person icon built only from supported primitives.
  function personIcon(center, color = C.violet, scale = 1) {
    const head = new M.Circle({ radius: 0.12 * scale, color, strokeWidth: 2 });
    head.setFill(color, 0.12);
    head.moveTo([center[0], center[1] + 0.19 * scale, 0]);
    const body = new M.Arc({ radius: 0.22 * scale, startAngle: 0, angle: Math.PI, color, strokeWidth: 2.5 });
    body.moveTo([center[0], center[1] - 0.04 * scale, 0]);
    return new M.VGroup(head, body);
  }

  // ---------- Beat 0: welcome ----------
  await until(S(0));
  await play(new M.FadeIn(notebook), ...say('WELCOME: ONE STEP AT A TIME', C.cyan));

  // ---------- Beats 1-4: data science, cafe, question, notebook ----------
  await until(S(1));
  await play(...say('DATA SCIENCE = LEARNING FROM NOTES', C.cyan));
  await play(new M.LaggedStart(rules.map(line => new M.Create(line)), { lagRatio: 0.2, runTime: 1.2 }));

  await until(S(2));
  await play(new M.FadeIn(cafe), ...say('OUR FIRST NOTES: A SMALL CAFE', C.amber));

  await until(S(3));
  await play(...say('HOW MANY CUSTOMERS, 8 TO 9?', C.amber), new M.Indicate(cup, { color: C.amber }));

  await until(S(4));
  await play(new M.FadeOut(cafe), ...say('ONE SHORT NOTE FOR EVERY ORDER', C.cyan));

  // ---------- Beats 5-9: six notes become data ----------
  const notesTag = pill('6 NOTES', C.cyan, 16);
  notesTag.moveTo([TC[0], P ? -5.0 : -2.15, 0]);
  await until(S(5));
  await play(new M.FadeOut(notebook), new M.FadeOut(new M.VGroup(...rules)), ...say("NOTES FROM 8 TO 9 O'CLOCK", C.muted),
    new M.LaggedStart(noteCards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.2 }));

  await until(S(6));
  await play(new M.FadeIn(noteGroups[0]), new M.Indicate(noteCards[0], { color: C.amber }), ...say('NOTE 1: SMALL COFFEE, 8:05', C.amber));

  await until(S(7));
  await play(new M.FadeIn(noteGroups[1]), new M.Indicate(noteCards[1], { color: C.amber }), ...say('NOTE 2: MEDIUM TEA, 8:11', C.amber));

  await until(S(8));
  await play(new M.LaggedStart(noteGroups.slice(2).map(n => new M.FadeIn(n)), { lagRatio: 0.3, runTime: 2.0 }), new M.FadeIn(notesTag), ...say('SIX NOTES IN ALL', C.cyan));

  await until(S(9));
  await play(...say('DATA = FACTS WRITTEN DOWN', C.green), new M.LaggedStart(noteGroups.map(n => new M.Indicate(n, { color: C.green })), { lagRatio: 0.1, runTime: 1.6 }));

  // ---------- Beats 10-13: notes become a table ----------
  await until(S(10));
  await play(new M.FadeOut(new M.VGroup(...noteGroups)), new M.FadeOut(notesTag), new M.FadeIn(tableCard),
    new M.LaggedStart(rects.flat().map(cell => new M.FadeIn(cell)), { lagRatio: 0.012, runTime: 1.5 }),
    ...say('A TABLE: A GRID OF SMALL BOXES', C.cyan));
  await play(new M.FadeIn(new M.VGroup(...headsDim)));

  const rowArrowY = cy(1) - RH * 0.32;
  const rowArrow = new M.VGroup(
    new M.Line({ start: [x0 - 0.04, rowArrowY, 0], end: [x0 + TW + 0.04, rowArrowY, 0], color: C.amber, strokeWidth: 3.5 }),
    new M.Line({ start: [x0 + TW - 0.16, rowArrowY + 0.12, 0], end: [x0 + TW + 0.04, rowArrowY, 0], color: C.amber, strokeWidth: 3.5 }),
    new M.Line({ start: [x0 + TW - 0.16, rowArrowY - 0.12, 0], end: [x0 + TW + 0.04, rowArrowY, 0], color: C.amber, strokeWidth: 3.5 }),
  );
  let rowOneOutline = null;

  await until(S(11));
  rowOneOutline = rowBox(1, 0, 6, C.amber, 3.5);
  await play(new M.LaggedStart(valueRows.map(r => new M.FadeIn(r)), { lagRatio: 0.18, runTime: 1.8 }),
    new M.Create(rowOneOutline), new M.Create(rowArrow), ...say('ROW = ONE LINE GOING ACROSS', C.amber),
    ...fbox([['row', C.amber], '= one line going across', '= one note']));
  await play(new M.FadeOut(rowArrow));

  const headGlow = headerGlow();
  await until(S(12));
  await play(new M.FadeOut(rowOneOutline), ...headsDim.map((h, c) => new M.Transform(h, heads[c])),
    new M.Create(headGlow), ...say('HEADINGS: WHAT EACH BOX HOLDS', C.cyan),
    ...fbox([['heading', C.cyan], '= what each box holds', 'time, drink, price ...']));
  await play(new M.LaggedStart([1, 2, 4].map(c => new M.Indicate(headsDim[c], { color: C.amber })), { lagRatio: 0.25, runTime: 1.0 }));

  await until(S(13));
  await play(new M.FadeOut(headGlow), ...say('WHAT DOES ONE ROW DESCRIBE?', C.amber),
    ...fbox([['question:', C.amber], '1 row = ?'], C.amber));

  // ---------- Beats 14-20: follow row one, one box at a time ----------
  const faintRow = rowBox(1, 0, 6, C.muted, 2);
  let currentFocus = null;
  await until(S(14));
  await play(new M.Create(faintRow), ...say('FOLLOW ROW 1, BOX BY BOX', C.amber));

  // the facts of row 1 collect in the card, one line per box, as the voice reads them
  const facts = [];
  const factCard = line => { facts.push(line); return fbox([['row 1 says:', C.amber], ...facts], C.amber); };

  await until(S(15));
  currentFocus = focusCell(0, C.muted);
  await play(new M.FadeIn(currentFocus), new M.Indicate(vals[0][0], { color: C.muted }), ...say('LABEL ONLY: LIKE A TICKET NUMBER', C.muted),
    ...factCard(['label    1 (a number)', C.muted]));

  await until(S(16));
  const timeFocus = focusCell(1, C.amber);
  await play(new M.FadeOut(currentFocus), new M.FadeIn(timeFocus), new M.Indicate(vals[0][1], { color: C.amber }), ...say('TIME OF ORDER: 8:05', C.amber),
    ...factCard('time     8:05'));
  currentFocus = timeFocus;

  await until(S(17));
  const drinkFocus = focusCell(2, C.amber);
  const sizeFocus = focusCell(3, C.amber);
  await play(new M.FadeOut(currentFocus), new M.FadeIn(drinkFocus), new M.Indicate(vals[0][2], { color: C.amber }), ...say('DRINK: COFFEE', C.amber),
    ...factCard('drink    coffee'));
  await play(new M.FadeOut(drinkFocus), new M.FadeIn(sizeFocus), new M.Indicate(vals[0][3], { color: C.amber }), ...say('SIZE: SMALL', C.amber),
    ...factCard('size     small'));
  currentFocus = sizeFocus;

  await until(S(18));
  const priceFocus = focusCell(4, C.amber);
  await play(new M.FadeOut(currentFocus), new M.FadeIn(priceFocus), new M.Indicate(vals[0][4], { color: C.amber }), ...say('PRICE: 3 DOLLARS', C.amber),
    ...factCard('price    3 dollars'));
  currentFocus = priceFocus;

  await until(S(19));
  const waitFocus = focusCell(5, C.amber);
  await play(new M.FadeOut(currentFocus), new M.FadeIn(waitFocus), new M.Indicate(vals[0][5], { color: C.amber }), ...say('WAITING TIME: 120 SECONDS', C.amber),
    ...factCard('wait     120 seconds'));
  currentFocus = waitFocus;

  await until(S(20));
  const takeawayFocus = focusCell(6, C.amber);
  await play(new M.FadeOut(currentFocus), new M.FadeIn(takeawayFocus), new M.Indicate(vals[0][6], { color: C.amber }), ...say('TAKEAWAY: YES', C.amber),
    ...factCard('takeaway yes'));
  currentFocus = takeawayFocus;

  // ---------- Beats 21-27: the row describes one order ----------
  const firstOrderOutline = rowBox(1, 1, 6, C.amber, 3.5);
  await until(S(21));
  facts.shift(); // the label is not a fact about the order
  await play(new M.FadeOut(currentFocus), new M.FadeOut(faintRow), new M.Create(firstOrderOutline),
    ...say('ALL THESE FACTS: THE SAME ONE ORDER', C.amber), ...factCard(['= facts about 1 order', C.green]));

  await until(S(22));
  await play(...fbox([['row 1 = 1 order', C.amber]], C.amber));

  const secondOrderOutline = rowBox(2, 1, 6, C.green, 3.5);
  await until(S(23));
  await play(new M.FadeOut(firstOrderOutline), new M.Create(secondOrderOutline),
    ...fbox([['row 1 = 1 order', C.amber], ['row 2 = 1 order', C.green]], C.amber));

  const allRowOutlines = Array.from({ length: 6 }, (_, i) => rowBox(i + 1, 0, 6, C.green, 2.5));
  await until(S(24));
  await play(new M.FadeOut(secondOrderOutline), new M.LaggedStart(allRowOutlines.map(r => new M.Create(r)), { lagRatio: 0.15, runTime: 1.5 }),
    ...fbox(['1 note', '= 1 order', ['= 1 row', C.green]], C.green), ...say('ONE NOTE, ONE ORDER, ONE ROW', C.green));

  await until(S(25));
  await play(new M.FadeOut(new M.VGroup(...allRowOutlines)),
    ...fbox([['observational unit', C.violet], '= what one row', '  describes'], C.violet),
    ...say('OBSERVATIONAL UNIT', C.violet));

  await until(S(26));
  await play(...fbox([['observational unit', C.violet], 'observational:', '  looked at, written down', 'unit: one single thing'], C.violet));

  const unitRowOutline = rowBox(1, 0, 6, C.violet, 3.5);
  await until(S(27));
  await play(new M.Create(unitRowOutline),
    ...fbox([['observational unit', C.violet], ['here: one order', C.amber]], C.violet));

  // ---------- Beats 28-34: six orders do not prove six customers ----------
  await until(S(28));
  await play(new M.FadeOut(unitRowOutline), ...say('BACK TO THE QUESTION: HOW MANY CUSTOMERS?', C.amber));

  const badgeX = x0 + TW + (P ? 0.38 : 0.42);
  const badges = Array.from({ length: 6 }, (_, i) => {
    const circle = new M.Circle({ radius: P ? 0.17 : 0.19, color: C.amber, strokeWidth: 2.5 });
    circle.setFill(C.card, 1);
    circle.moveTo([badgeX, cy(i + 1), 0]);
    const number = T(String(i + 1), 15, C.amber, true);
    number.moveTo([badgeX, cy(i + 1), 0]);
    return new M.VGroup(circle, number);
  });
  const countFormula = () => fbox([['rows = 6', C.amber]], C.amber);

  await until(S(29));
  await play(...say('COUNT THE ROWS: 1, 2, 3, 4, 5, 6', C.amber));
  for (let i = 0; i < 6; i++) {
    const flashRow = rowBox(i + 1, 0, 6, C.amber, 3);
    await play(new M.FadeIn(badges[i]), new M.Create(flashRow));
    await play(new M.FadeOut(flashRow));
  }
  await play(...countFormula());

  await until(S(30));
  await play(...fbox(['rows      = 6', ['orders    = 6', C.amber], ['customers = ?', C.violet]], C.amber),
    ...say('6 ORDERS. BUT 6 CUSTOMERS?', C.violet));

  const repeatRow1 = rowBox(1, 0, 6, C.violet, 3.5);
  const repeatRow6 = rowBox(6, 0, 6, C.violet, 3.5);
  const personX = badgeX;
  const personTop = personIcon([personX, cy(1)], C.violet, P ? 0.72 : 0.82);
  const personBottom = personIcon([personX, cy(6)], C.violet, P ? 0.72 : 0.82);
  const repeatLink = new M.DashedLine({ start: [personX, cy(1) - 0.25, 0], end: [personX, cy(6) + 0.25, 0], color: C.violet, strokeWidth: 2.5 });

  await until(S(31));
  await play(new M.FadeOut(new M.VGroup(...badges)), new M.Create(repeatRow1), new M.Create(repeatRow6),
    ...say('IMAGINE: THE SAME PERSON ORDERS TWICE', C.violet));
  await play(new M.FadeIn(personTop), new M.FadeIn(personBottom), new M.Create(repeatLink));

  await until(S(32));
  await play(...fbox([['1 person', C.violet], '= 2 rows', '(2 orders)'], C.violet));

  const noNameBoxes = HEAD.map((_, c) => cellBox(0, c, C.violet));
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(repeatRow1, repeatRow6, personTop, personBottom, repeatLink)),
    new M.LaggedStart(noNameBoxes.map(b => new M.Create(b)), { lagRatio: 0.12, runTime: 1.4 }),
    ...say('NO CUSTOMER NAME: WHO ORDERED?', C.violet));
  await play(...fbox(['headings:', 'Order  Time  Drink  Size', 'Price  Wait  Takeaway?', ['no customer name', C.violet]], C.violet));

  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(...noNameBoxes)),
    ...fbox(['orders    = 6', ['customers = 6', C.violet], ['            or fewer', C.violet]], C.amber),
    ...say('THIS TABLE ALONE CANNOT TELL', C.violet));

  // ---------- Beats 35-36: a guest list has a different unit ----------
  const guestW = P ? 3.4 : 3.3;
  const guestH = 0.5;
  const guestTop = BOXP[1] + 0.75;
  const guestHeaderRect = new M.Rectangle({ width: guestW, height: guestH, color: C.green, strokeWidth: 1.5 });
  guestHeaderRect.setFill(C.cyan, 0.12);
  guestHeaderRect.moveTo([BOXP[0], guestTop, 0]);
  const guestHeaderText = T('Guest list', 18, C.green, true);
  guestHeaderText.moveTo([BOXP[0], guestTop, 0]);
  const guestRows = [];
  const guestIcons = [];
  for (let i = 0; i < 3; i++) {
    const y = guestTop - (i + 1) * guestH;
    const rect = new M.Rectangle({ width: guestW, height: guestH, color: C.muted, strokeWidth: 1.2 });
    rect.setFill(C.card, 0.95);
    rect.moveTo([BOXP[0], y, 0]);
    const icon = personIcon([BOXP[0] - guestW / 2 + 0.42, y], C.green, 0.62);
    const label = T(`guest ${i + 1}`, 17, C.ink);
    label.moveTo([BOXP[0] + 0.2, y, 0]);
    guestRows.push(new M.VGroup(rect, icon, label));
    guestIcons.push(icon);
  }
  const guestList = new M.VGroup(guestHeaderRect, guestHeaderText, ...guestRows);

  await until(S(35));
  const removeBox = boxNow ? [new M.FadeOut(boxNow)] : [];
  await play(...removeBox, new M.FadeIn(guestList), ...say('GUEST LIST: ONE ROW = ONE PERSON', C.green));
  boxNow = null;

  await until(S(36));
  await play(...say('COUNT ROWS = COUNT PEOPLE', C.green),
    new M.LaggedStart(guestIcons.map(icon => new M.Indicate(icon, { color: C.green })), { lagRatio: 0.3, runTime: 1.4 }));

  // ---------- Beats 37-41: what the unit tells us ----------
  await until(S(37));
  await play(new M.FadeOut(guestList), ...say('THE UNIT = WHAT YOU ARE COUNTING', C.cyan),
    ...fbox(['count rows', ['= count orders', C.amber]], C.cyan));

  const priceColumn = colBox(4, C.amber, 0.08);
  await until(S(38));
  await play(new M.Create(priceColumn),
    ...fbox(['add the prices', ['= money from', C.amber], ['  6 orders', C.amber]], C.cyan),
    ...say('A TOTAL IS ABOUT THE UNIT TOO', C.amber));
  await play(new M.LaggedStart(vals.map(row => new M.Indicate(row[4], { color: C.amber })), { lagRatio: 0.2, runTime: 1.8 }));

  const askRow = rowBox(1, 0, 6, C.amber, 3.5);
  await until(S(39));
  await play(new M.FadeOut(priceColumn), new M.Create(askRow),
    ...fbox(['before you count', 'or add, ask:', ['1 row = ?', C.amber]], C.amber),
    ...say('FIRST ASK: WHAT IS ONE ROW?', C.amber));

  const drinkColumn = colBox(2, C.cyan, 0.08);
  await until(S(40));
  await play(new M.FadeOut(askRow), new M.Create(drinkColumn),
    ...fbox(['next lesson:', ['one heading at a time', C.cyan]], C.cyan),
    ...say('NEXT: LOOK DOWN THE TABLE', C.cyan));
  await play(new M.LaggedStart(vals.map(row => new M.Indicate(row[2], { color: C.cyan })), { lagRatio: 0.25, runTime: 1.8 }));

  const recapRows = Array.from({ length: 6 }, (_, i) => rowBox(i + 1, 0, 6, C.green, 2.5));
  await until(S(41));
  await play(new M.FadeOut(drinkColumn), new M.LaggedStart(recapRows.map(r => new M.Create(r)), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox([['observational unit', C.violet], '= what one row', '  describes', ['cafe: 1 row = 1 order', C.green]], C.green),
    ...say('RECAP: ONE ROW IS ONE ORDER', C.green));
}

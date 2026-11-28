// 5.1.2 Binomial counts: count the yeses in a fixed number of trials.
// Beat i = sentence i (0-based, 49 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const URG = '#ff6b4a'; // red-orange for urgent tickets (chapters/5.1.md)

  // Layout constants: laptop 14.22x8 (y in [-3.0, 2.3]), phone 8x14.22 (y in [-5.5, 4.3])
  const CX = P ? 0 : -2.1;
  const PILL = P ? [0, 3.95, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, 2.55, 0] : [4.5, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  // Single formula box at a time (never overlaps the visual zone)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.39 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.4 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow, { runTime: 0.4 })];
    boxNow = null;
    return a;
  }

  // Reusable helpers (every child placed with moveTo before grouping)
  function fitText(t, maxW) {
    const w = t.getWidth();
    if (w > maxW) t.scale(maxW / w);
    return t;
  }

  function makeCard(x, y, w, h, kind, small = false) {
    const col = kind === 'U' ? URG : kind === 'N' ? C.cyan : C.muted;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: small ? 0.08 : 0.14, color: col, strokeWidth: small ? 1.6 : 2.2 });
    r.setFill(kind === 'empty' ? C.card : col, kind === 'empty' ? 0.35 : kind === '?' ? 0.14 : 0.22);
    r.moveTo([x, y, 0]);
    if (kind === 'empty') return r;
    const ch = kind === 'U' ? 'U' : kind === 'N' ? 'N' : '?';
    const main = T(ch, small ? (P ? 18 : 16) : (P ? 28 : 30), col, true, true);
    main.moveTo([x, small ? y : y + (kind === '?' ? 0 : 0.14), 0]);
    if (small || kind === '?') return new M.VGroup(r, main);
    const sub = T(kind === 'U' ? 'urgent' : 'calm', 15, col);
    sub.moveTo([x, y - 0.36, 0]);
    return new M.VGroup(r, main, sub);
  }

  function makePanel(x, y, w, h, lines, color = C.cyan, fillOp = 0.92) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, fillOp); r.moveTo([x, y, 0]);
    const step = lines.length > 1 ? Math.min(0.46, (h - 0.34) / lines.length) : 0;
    const top = y + ((lines.length - 1) * step) / 2;
    const parts = [r];
    lines.forEach((ln, i) => {
      const [txt, col = C.ink, sz = 19, mono = false, bold = false] = ln;
      const t = fitText(T(txt, sz, col, mono, bold), w - 0.28);
      t.moveTo([x, top - i * step, 0]);
      parts.push(t);
    });
    return new M.VGroup(...parts);
  }

  function staffIcon(x, y, label) {
    const head = new M.Circle({ radius: 0.20, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, y + 0.44, 0]);
    const body = new M.Arc({ radius: 0.36, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, y - 0.04, 0]);
    const badge = new M.RoundedRectangle({ width: 1.55, height: 0.38, cornerRadius: 0.19, color: URG, strokeWidth: 1.8 });
    badge.setFill(URG, 0.18); badge.moveTo([x, y - 0.45, 0]);
    const txt = T(label, 15, URG, true, true); txt.moveTo([x, y - 0.45, 0]);
    return new M.VGroup(head, body, badge, txt);
  }

  // Geometry for the 5 ticket slots
  const CW = P ? 1.15 : 1.25, CH = P ? 1.50 : 1.60, CSP = P ? 1.38 : 1.55;
  const CARD_Y = P ? -0.35 : 0.10;
  const slotX = k => CX + (k - 2) * CSP;

  // 0: Two staff members for urgent tickets
  const staff = [staffIcon(CX - (P ? 1.15 : 1.35), P ? -1.1 : -0.35, 'URGENT 1'),
                 staffIcon(CX + (P ? 1.15 : 1.35), P ? -1.1 : -0.35, 'URGENT 2')];
  await until(S(0));
  await play(new M.LaggedStart(staff.map(s => new M.FadeIn(s)), { lagRatio: 0.25, runTime: 1.0 }),
    ...say('2 STAFF FOR URGENT TICKETS', URG));

  // 1: Next five tickets — what is the chance exactly two are urgent?
  const qCards = [0, 1, 2, 3, 4].map(k => makeCard(slotX(k), CARD_Y, CW, CH, '?'));
  const qNums = [0, 1, 2, 3, 4].map(k => {
    const t = T(String(k + 1), 16, C.muted, true);
    t.moveTo([slotX(k), CARD_Y + CH / 2 + 0.28, 0]);
    return t;
  });
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...staff), { runTime: 0.5 }),
    new M.LaggedStart(qCards.map((c, k) => new M.FadeIn(new M.VGroup(c, qNums[k]))), { lagRatio: 0.12, runTime: 1.2 }),
    ...say('NEXT 5 TICKETS: EXACTLY 2 URGENT?', C.amber));

  // 2: Each ticket is urgent with chance 1 in 5
  const barY = CARD_Y - CH / 2 - (P ? 1.15 : 0.95);
  const segW = P ? 0.86 : 0.92, segH = 0.42;
  const chanceSegs = [0, 1, 2, 3, 4].map(k => {
    const col = k === 0 ? URG : C.cyan;
    const r = new M.RoundedRectangle({ width: segW, height: segH, cornerRadius: 0.08, color: col, strokeWidth: 1.8 });
    r.setFill(col, 0.32); r.moveTo([CX + (k - 2) * (segW + 0.12), barY, 0]);
    const t = T(k === 0 ? 'U' : 'N', 15, col, true, true); t.moveTo([CX + (k - 2) * (segW + 0.12), barY, 0]);
    return new M.VGroup(r, t);
  });
  const chanceNote = T('1 in 5 urgent   ·   4 in 5 calm', P ? 16 : 17, C.muted);
  chanceNote.moveTo([CX, barY - 0.50, 0]);
  await until(S(2));
  await play(new M.LaggedStart(chanceSegs.map(g => new M.FadeIn(g)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(chanceNote, { runTime: 0.6 }),
    ...fbox(['each ticket', ['urgent:     1/5', URG], ['not urgent: 4/5', C.cyan]], URG),
    ...say('EACH TICKET: 1 IN 5 URGENT', URG));

  // 3: Tickets do not affect each other (independent)
  const c0Urg = makeCard(slotX(0), CARD_Y, CW, CH, 'U');
  const wallX = (slotX(0) + slotX(1)) / 2;
  const wall = new M.DashedLine({ start: [wallX, CARD_Y - CH / 2 - 0.12, 0], end: [wallX, CARD_Y + CH / 2 + 0.12, 0], color: C.pink });
  const stillTag = T('still 1/5', 15, C.amber, true, true);
  stillTag.moveTo([slotX(1), CARD_Y - CH / 2 - 0.34, 0]);
  await until(S(3));
  await play(new M.FadeOut(qCards[0], { runTime: 0.4 }), new M.FadeIn(c0Urg, { runTime: 0.5 }),
    new M.Create(wall, { runTime: 0.5 }), new M.FadeIn(stillTag, { runTime: 0.5 }),
    ...say('INDEPENDENT: ONE TELLS NOTHING ABOUT THE NEXT', C.cyan));

  // 4: Five Bernoulli trials, all with the same p
  const pLabels = [0, 1, 2, 3, 4].map(k => {
    const t = T('p = 1/5', 17, C.violet, true, true);
    t.moveTo([slotX(k), CARD_Y - CH / 2 - 0.38, 0]);
    return t;
  });
  const c0Reset = makeCard(slotX(0), CARD_Y, CW, CH, '?');
  await until(S(4));
  await play(new M.FadeOut(new M.VGroup(c0Urg, wall, stillTag, ...chanceSegs, chanceNote), { runTime: 0.5 }),
    new M.FadeIn(c0Reset, { runTime: 0.5 }),
    new M.LaggedStart(pLabels.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['5 Bernoulli trials', ['same p = 1/5', C.violet], 'independent'], C.violet),
    ...say('5 BERNOULLI TRIALS, SAME p = 1/5', C.violet));

  // 5: Lay out five empty card slots
  const emptySlots = [0, 1, 2, 3, 4].map(k => makeCard(slotX(k), CARD_Y, CW, CH, 'empty'));
  const slotNums = [0, 1, 2, 3, 4].map(k => {
    const t = T(String(k + 1), 17, C.cyan, true, true);
    t.moveTo([slotX(k), CARD_Y + CH / 2 + 0.28, 0]);
    return t;
  });
  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(c0Reset, ...qCards.slice(1), ...qNums, ...pLabels), { runTime: 0.45 }),
    ...clearBox(),
    new M.LaggedStart(emptySlots.map((sl, k) => new M.FadeIn(new M.VGroup(sl, slotNums[k]))), { lagRatio: 0.1, runTime: 0.9 }),
    ...say('5 EMPTY CARD SLOTS', C.cyan));

  // 6: One way to get exactly two urgent: U U N N N
  let activeCards = ['U', 'U', 'N', 'N', 'N'].map((kind, k) => makeCard(slotX(k), CARD_Y, CW, CH, kind));
  await until(S(6));
  await play(new M.LaggedStart(activeCards.map(c => new M.FadeIn(c)), { lagRatio: 0.16, runTime: 1.4 }),
    ...say('ONE ORDER: U  U  N  N  N', URG));

  // 7: Its chance is a product because tickets are independent
  const FRAC_Y = CARD_Y - CH / 2 - 0.58;
  const timesSigns = [0, 1, 2, 3].map(k => {
    const t = T('×', P ? 20 : 22, C.amber, true, true);
    t.moveTo([(slotX(k) + slotX(k + 1)) / 2, FRAC_Y, 0]);
    return t;
  });
  await until(S(7));
  await play(new M.LaggedStart(timesSigns.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.7 }),
    ...fbox(['one order: U U N N N', ['independent → multiply', C.amber]], C.amber),
    ...say('INDEPENDENT → MULTIPLY THE CHANCES', C.amber));

  // 8: 1/5 × 1/5 × 4/5 × 4/5 × 4/5
  const fracs = ['1/5', '1/5', '4/5', '4/5', '4/5'].map((s, k) => {
    const t = T(s, P ? 20 : 22, k < 2 ? URG : C.cyan, true, true);
    t.moveTo([slotX(k), FRAC_Y, 0]);
    return t;
  });
  await until(S(8));
  await play(new M.LaggedStart(fracs.map(t => new M.FadeIn(t)), { lagRatio: 0.18, runTime: 1.6 }),
    ...fbox(['U U N N N', ['1/5 × 1/5 × 4/5 × 4/5 × 4/5', C.amber]], C.amber),
    ...say('1/5 × 1/5 × 4/5 × 4/5 × 4/5', C.amber));

  // 9: Top: 1 × 1 × 4 × 4 × 4 = 64
  const topLine = T('top:  1 × 1 × 4 × 4 × 4 = 64', P ? 17 : 18, C.amber, true, true);
  topLine.moveTo([CX, FRAC_Y - 0.62, 0]);
  await until(S(9));
  await play(new M.FadeIn(topLine, { runTime: 0.6 }),
    new M.LaggedStart(fracs.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox(['top:    1×1×4×4×4', ['      = 64', C.amber]], C.amber),
    ...say('TOP: 1 × 1 × 4 × 4 × 4 = 64', C.amber));

  // 10: Bottom: 5 × 5 × 5 × 5 × 5 = 3125
  const botLine = T('bottom:  5 × 5 × 5 × 5 × 5 = 3,125', P ? 17 : 18, C.cyan, true, true);
  botLine.moveTo([CX, FRAC_Y - 1.10, 0]);
  await until(S(10));
  await play(new M.FadeIn(botLine, { runTime: 0.6 }),
    ...fbox(['top:    1×1×4×4×4 = 64', ['bottom: 5×5×5×5×5 = 3125', C.cyan]], C.cyan),
    ...say('BOTTOM: 5×5×5×5×5 = 3,125', C.cyan));

  // 11: One order = 64 / 3125 ≈ 2 in 100
  await until(S(11));
  await play(...fbox(['one order (U U N N N)', '= 64 / 3125', ['= 0.02048  (≈ 2 in 100)', C.amber]], C.amber),
    ...say('ONE ORDER = 64/3125 ≈ 2 IN 100', C.amber));

  // 12: But the two urgent tickets could sit in other slots
  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(...fracs, ...timesSigns, topLine, botLine), { runTime: 0.45 }),
    ...clearBox(),
    new M.Indicate(activeCards[0], { color: URG, runTime: 0.7 }),
    new M.Indicate(activeCards[1], { color: URG, runTime: 0.7 }),
    ...say('THE 2 URGENT CAN SIT IN OTHER SLOTS', URG));

  // 13: Urgent in slots 1 & 3, or 1 & 4, or 4 & 5
  function patternCards(u1, u2) {
    return [0, 1, 2, 3, 4].map(k => makeCard(slotX(k), CARD_Y, CW, CH, (k === u1 || k === u2) ? 'U' : 'N'));
  }
  const pat13 = patternCards(0, 2);
  const pat14 = patternCards(0, 3);
  const pat45 = patternCards(3, 4);
  await until(S(13));
  await play(new M.FadeOut(new M.VGroup(...activeCards), { runTime: 0.35 }),
    new M.FadeIn(new M.VGroup(...pat13), { runTime: 0.45 }),
    ...say('SLOTS (1, 3) · (1, 4) · (4, 5)...', URG));
  await until(S(13) + 1.55);
  await play(new M.FadeOut(new M.VGroup(...pat13), { runTime: 0.35 }),
    new M.FadeIn(new M.VGroup(...pat14), { runTime: 0.45 }));
  await until(S(13) + 3.05);
  await play(new M.FadeOut(new M.VGroup(...pat14), { runTime: 0.35 }),
    new M.FadeIn(new M.VGroup(...pat45), { runTime: 0.45 }));
  activeCards = pat45;

  // 14: How many orders? Choose which 2 of the 5 slots are urgent
  const chip1 = makeCard(CX - 0.85, CARD_Y - 1.55, 0.95, 0.72, 'U', true);
  const chip2 = makeCard(CX + 0.85, CARD_Y - 1.55, 0.95, 0.72, 'U', true);
  const chipTxt = T('choose 2 of the 5 slots', P ? 17 : 18, C.violet, false, true);
  chipTxt.moveTo([CX, CARD_Y - 2.22, 0]);
  await until(S(14));
  await play(new M.FadeOut(new M.VGroup(...activeCards), { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(chip1, chip2, chipTxt), { runTime: 0.6 }),
    ...say('CHOOSE 2 OF THE 5 SLOTS', C.violet));

  // 15: Five choose two
  await until(S(15));
  await play(...fbox(['5 slots, choose 2', ['5 choose 2  =  C(5, 2)', C.violet]], C.violet),
    ...say('5 CHOOSE 2  =  C(5, 2)', C.violet));

  // 16: Five choose two is ten — show all 10 orders, one row each
  const ORDERS = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]];
  const RY = P ? 0.74 : 0.40;
  const RTOP = P ? 1.55 : 1.30;
  const MCW = P ? 0.66 : 0.62, MCH = P ? 0.52 : 0.32, MCSP = P ? 0.78 : 0.74;
  const ROW_CX = P ? -0.92 : -3.20;
  const rowY = r => RTOP - r * RY;
  const rowGroups = ORDERS.map((pair, r) => {
    const y = rowY(r);
    const num = T(String(r + 1), P ? 17 : 16, C.muted, true);
    num.moveTo([ROW_CX - 2 * MCSP - (P ? 0.70 : 0.68), y, 0]);
    const cells = [0, 1, 2, 3, 4].map(k =>
      makeCard(ROW_CX + (k - 2) * MCSP, y, MCW, MCH, (k === pair[0] || k === pair[1]) ? 'U' : 'N', true));
    return new M.VGroup(num, ...cells);
  });
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(...emptySlots, ...slotNums, chip1, chip2, chipTxt), { runTime: 0.4 }),
    new M.LaggedStart(rowGroups.map(g => new M.FadeIn(g)), { lagRatio: 0.08, runTime: 1.5 }),
    ...fbox(['5 choose 2 = 10', ['all 10 orders', C.violet]], C.violet),
    ...say('ALL 10 ORDERS WITH 2 URGENT', C.violet));

  // 17: Every order has the same chance (2 urgent, 3 calm)
  const probX = ROW_CX + 2 * MCSP + (P ? 1.55 : 1.55);
  const probLabels = ORDERS.map((_, r) => {
    const t = T('0.02048', P ? 19 : 18, C.amber, true);
    t.moveTo([probX, rowY(r), 0]);
    return t;
  });
  await until(S(17));
  await play(new M.LaggedStart(probLabels.map(t => new M.FadeIn(t)), { lagRatio: 0.07, runTime: 1.3 }),
    ...say('EVERY ORDER = 2 URGENT, 3 CALM → SAME CHANCE', C.amber));

  // 18: Add ten equal pieces: 10 × about 2 in 100
  const colH = 9 * RY + MCH + 0.24;
  const colBox = new M.RoundedRectangle({ width: P ? 1.75 : 1.65, height: colH, cornerRadius: 0.14, color: C.amber, strokeWidth: 2 });
  colBox.moveTo([probX, (rowY(0) + rowY(9)) / 2, 0]);
  await until(S(18));
  await play(new M.Create(colBox, { runTime: 0.7 }),
    ...fbox(['10 equal orders', 'each = 0.02048', ['sum  = 10 × 0.02048', C.amber]], C.amber),
    ...say('ADD 10 EQUAL PIECES', C.amber));

  // 19: Answer is about 20 in 100; exact 0.2048
  await until(S(19));
  await play(...fbox(['10 × 0.02048', ['= 0.2048', C.green], ['≈ 20 in 100', C.green]], C.green),
    ...say('P(2 URGENT) = 0.2048  (≈ 20%)', C.green));

  // 20: Exactly two urgent tickets happen about 1 time in 5
  await until(S(20));
  await play(new M.Indicate(colBox, { color: C.green, runTime: 0.9 }),
    ...fbox(['P(2 urgent) = 0.2048', ['≈ 1 time in 5', C.green]], C.green),
    ...say('ABOUT 1 TIME IN 5', C.green));

  // 21: Do the same for every count, from 0 to 5 — build bar chart axis
  const PROBS = [0.32768, 0.4096, 0.2048, 0.0512, 0.0064, 0.00032];
  const BAR_BASE = P ? -3.35 : -1.90;
  const BAR_MAXH = P ? 3.60 : 2.65;
  const BAR_SP = P ? 1.12 : 1.25;
  const BAR_W = P ? 0.74 : 0.82;
  const bx = k => CX + (k - 2.5) * BAR_SP;
  const barH = p => Math.max(p > 0.002 ? 0.08 : 0.04, (p / 0.41) * BAR_MAXH);

  const axisLine = new M.Line({ start: [bx(0) - BAR_SP * 0.55, BAR_BASE, 0], end: [bx(5) + BAR_SP * 0.55, BAR_BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const xTicks = [0, 1, 2, 3, 4, 5].map(k => {
    const t = T(String(k), P ? 20 : 19, C.ink, true, true);
    t.moveTo([bx(k), BAR_BASE - (P ? 0.65 : 0.52), 0]);
    return t;
  });
  const xCaption = T('urgent tickets (out of 5)', P ? 17 : 16, C.muted);
  xCaption.moveTo([CX, BAR_BASE - (P ? 1.15 : 0.90), 0]);

  function makeBar(k, color) {
    const h = barH(PROBS[k]);
    const r = new M.Rectangle({ width: BAR_W, height: h, color, strokeWidth: 2 });
    r.setFill(color, 0.72);
    r.moveTo([bx(k), BAR_BASE + h / 2, 0]);
    return r;
  }
  function makeBarLabel(k, text, color, xOff = 0) {
    const h = barH(PROBS[k]);
    const t = T(text, P ? 16 : 16, color, true, true);
    t.moveTo([bx(k) + xOff, BAR_BASE + h + 0.28, 0]);
    return t;
  }

  await until(S(21));
  await play(new M.FadeOut(new M.VGroup(...rowGroups, ...probLabels, colBox), { runTime: 0.45 }),
    ...clearBox(),
    new M.Create(axisLine, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...xTicks, xCaption), { runTime: 0.6 }),
    ...say('EVERY COUNT: 0 TO 5 URGENT', C.cyan));

  // 22: Zero urgent: about 33 in 100
  const bars = [];
  const barLabs = [];
  bars[0] = makeBar(0, C.cyan);
  barLabs[0] = makeBarLabel(0, '33%', C.cyan);
  await until(S(22));
  await play(new M.FadeIn(bars[0], { runTime: 0.6 }), new M.FadeIn(barLabs[0], { runTime: 0.6 }),
    ...fbox(['k = 0 urgent', ['P = 0.32768', C.cyan], '≈ 33 in 100'], C.cyan),
    ...say('0 URGENT: ≈ 33 IN 100', C.cyan));

  // 23: One urgent: about 41 in 100 — most likely count
  bars[1] = makeBar(1, C.amber);
  barLabs[1] = makeBarLabel(1, '41%', C.amber);
  const likelyTag = pill('MOST LIKELY', C.amber, P ? 14 : 15);
  likelyTag.moveTo([bx(1), BAR_BASE + barH(PROBS[1]) + 0.78, 0]);
  await until(S(23));
  await play(new M.FadeIn(bars[1], { runTime: 0.6 }), new M.FadeIn(barLabs[1], { runTime: 0.6 }),
    new M.FadeIn(likelyTag, { runTime: 0.6 }),
    ...fbox(['k = 1 urgent', ['P = 0.4096 (≈ 41%)', C.amber], ['most likely count', C.amber]], C.amber),
    ...say('1 URGENT: ≈ 41 IN 100 (MOST LIKELY)', C.amber));

  // 24: Two urgent: about 20 in 100
  bars[2] = makeBar(2, URG);
  barLabs[2] = makeBarLabel(2, '20%', URG);
  await until(S(24));
  await play(new M.FadeIn(bars[2], { runTime: 0.55 }), new M.FadeIn(barLabs[2], { runTime: 0.55 }),
    ...fbox(['k = 2 urgent', ['P = 0.2048', URG], '≈ 20 in 100'], URG),
    ...say('2 URGENT: ≈ 20 IN 100', URG));

  // 25: Three urgent: about 5 in 100
  bars[3] = makeBar(3, C.cyan);
  barLabs[3] = makeBarLabel(3, '5%', C.cyan);
  await until(S(25));
  await play(new M.FadeIn(bars[3], { runTime: 0.55 }), new M.FadeIn(barLabs[3], { runTime: 0.55 }),
    ...fbox(['k = 3 urgent', ['P = 0.0512', C.cyan], '≈ 5 in 100'], C.cyan),
    ...say('3 URGENT: ≈ 5 IN 100', C.cyan));

  // 26: Four or five urgent: less than 1 in 100 together
  bars[4] = makeBar(4, C.muted);
  bars[5] = makeBar(5, C.muted);
  const lab45 = T('<1%', 16, C.muted, true, true);
  lab45.moveTo([(bx(4) + bx(5)) / 2, BAR_BASE + 0.36, 0]);
  await until(S(26));
  await play(new M.FadeIn(bars[4], { runTime: 0.55 }), new M.FadeIn(bars[5], { runTime: 0.55 }),
    new M.FadeIn(lab45, { runTime: 0.55 }),
    ...fbox(['k = 4: 0.0064', 'k = 5: 0.00032', ['together < 1 in 100', C.muted]], C.muted),
    ...say('4 OR 5 URGENT: < 1 IN 100 TOGETHER', C.muted));

  // 27: Six bars add up to one whole
  await until(S(27));
  await play(new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox(['all 6 bars together', '0.328+0.410+0.205', '+0.051+0.006+0.0003', ['sum = 1.000 (1 whole)', C.green]], C.green),
    ...say('ALL 6 BARS ADD UP TO 1 WHOLE', C.green));

  // 28: Called the binomial distribution
  const distBox = new M.RoundedRectangle({
    width: (bx(5) - bx(0)) + BAR_W + 0.55,
    height: BAR_MAXH + 0.85,
    cornerRadius: 0.16,
    color: C.violet,
    strokeWidth: 2
  });
  distBox.moveTo([CX, BAR_BASE + (BAR_MAXH + 0.55) / 2, 0]);
  await until(S(28));
  await play(new M.Create(distBox, { runTime: 0.7 }),
    ...fbox(['Binomial distribution', ['pattern of chances', C.violet], 'for counts 0 to 5'], C.violet),
    ...say('THE BINOMIAL DISTRIBUTION', C.violet));

  // 29: Binomial = two names (yes or no)
  await until(S(29));
  await play(new M.FadeOut(distBox, { runTime: 0.45 }),
    ...fbox(['bi-nomial = "two names"', ['each trial: YES or NO', C.violet], 'urgent (U) / calm (N)'], C.violet),
    ...say('BI-NOMIAL = TWO NAMES: YES OR NO', C.violet));

  // 30: Needs two numbers: n = 5, p = 1/5
  await until(S(30));
  await play(...fbox(['needs two numbers:', ['n = 5   (trials)', C.cyan], ['p = 1/5 (chance of yes)', URG]], C.cyan),
    ...say('TWO NUMBERS: n = 5,  p = 1/5', C.cyan));

  // 31: Where do the bars balance? Expected value
  const fx = bx(1), fy = BAR_BASE - 0.03, fw = 0.24, fh = P ? 0.34 : 0.28;
  const fulcrum = new M.VGroup(
    new M.Line({ start: [fx, fy, 0], end: [fx - fw, fy - fh, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [fx, fy, 0], end: [fx + fw, fy - fh, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [fx - fw, fy - fh, 0], end: [fx + fw, fy - fh, 0], color: C.amber, strokeWidth: 3 }),
    new M.Dot({ point: [fx, fy, 0], radius: 0.07, color: C.amber })
  );
  const meanLine = new M.DashedLine({ start: [fx, BAR_BASE, 0], end: [fx, BAR_BASE + BAR_MAXH + 0.15, 0], color: C.amber });
  await until(S(31));
  await play(new M.FadeOut(likelyTag, { runTime: 0.4 }),
    new M.Create(fulcrum, { runTime: 0.6 }), new M.Create(meanLine, { runTime: 0.6 }),
    ...fbox(['balance point', ['= expected value', C.amber]], C.amber),
    ...say('BALANCE POINT = EXPECTED VALUE', C.amber));

  // 32: n × p = 5 × 1/5 = 1 urgent ticket
  const meanTag = pill('BALANCE = 1', C.amber, P ? 15 : 16);
  meanTag.moveTo([bx(3.15), BAR_BASE + barH(PROBS[1]) - 0.15, 0]);
  await until(S(32));
  await play(new M.FadeIn(meanTag, { runTime: 0.55 }),
    new M.Flash(fulcrum.submobjects[3], { color: C.amber, runTime: 0.7 }),
    ...fbox(['expected value (mean)', '= n × p', '= 5 × 1/5', ['= 1 urgent ticket', C.amber]], C.amber),
    ...say('EXPECTED VALUE = n × p = 1', C.amber));

  // 33: Now the short version of what we did, in one line
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(fulcrum, meanLine, meanTag), { runTime: 0.45 }),
    ...fbox(['the short version', ['in one line', C.cyan]], C.cyan),
    ...say('THE SHORT VERSION IN ONE LINE', C.cyan));

  // 34: Let k be the number of yeses we want, here 2
  await until(S(34));
  await play(new M.Indicate(bars[2], { color: URG, runTime: 0.75 }),
    ...fbox(['k = yeses we want', ['here: k = 2', URG]], URG),
    ...say('k = YESES WE WANT (HERE k = 2)', URG));

  // 35: p^k means p multiplied by itself k times
  await until(S(35));
  await play(...fbox(['p^k = p × p × ... (k times)', ['here: (1/5)² = 1/5 × 1/5', C.amber]], C.amber),
    ...say('p^k = p MULTIPLIED k TIMES', C.amber));

  // 36: Formula: P(k yeses) = C(n, k) × p^k × (1 − p)^(n − k)
  // Laptop: three cards in a row. Phone: three rows (formula card left, number card right).
  const FCW = P ? 3.6 : 3.00, FCH = P ? 1.00 : 0.96, FSP = P ? 2.45 : 3.85;
  const F_Y = P ? 1.70 : 0.52;
  const PFX = -1.85, PNX = 2.3, PRY = k => 1.95 - k * 1.95;
  const fPos = k => P ? [PFX, PRY(k)] : [(k - 1) * FSP, F_Y];
  const fHead = T('P(k yeses)  =', P ? 22 : 22, C.ink, true, true);
  fHead.moveTo([0, P ? 3.1 : 1.32, 0]);
  const fCards = [
    makePanel(...fPos(0), FCW, FCH, [['C(n, k)', C.violet, 26, true, true]], C.violet),
    makePanel(...fPos(1), FCW, FCH, [['p^k', URG, 26, true, true]], URG),
    makePanel(...fPos(2), FCW, FCH, [['(1 − p)^(n − k)', C.cyan, P ? 22 : 23, true, true]], C.cyan),
  ];
  const fTimes = P ? [
    T('×', 24, C.muted, true, true).moveTo([PFX, (PRY(0) + PRY(1)) / 2 - 0.15, 0]),
    T('×', 24, C.muted, true, true).moveTo([PFX, (PRY(1) + PRY(2)) / 2 - 0.15, 0]),
  ] : [
    T('×', 26, C.muted, true, true).moveTo([-FSP / 2, F_Y, 0]),
    T('×', 26, C.muted, true, true).moveTo([FSP / 2, F_Y, 0]),
  ];
  await until(S(36));
  await play(new M.FadeOut(new M.VGroup(axisLine, ...xTicks, xCaption, ...bars, ...barLabs, lab45), { runTime: 0.45 }),
    ...clearBox(),
    new M.FadeIn(fHead, { runTime: 0.5 }),
    new M.LaggedStart([
      new M.FadeIn(fCards[0]), new M.FadeIn(fTimes[0]),
      new M.FadeIn(fCards[1]), new M.FadeIn(fTimes[1]),
      new M.FadeIn(fCards[2])
    ], { lagRatio: 0.18, runTime: 1.8 }),
    ...say('P(k) = C(n,k) × p^k × (1 − p)^(n − k)', C.cyan));

  // 37: Read it in words: number of orders × chance of yeses × chance of nos
  const W_Y = P ? 0.62 : -0.35;
  const wordLabels = P ? [
    T('number of orders', 18, C.violet, false, true).moveTo([PFX, PRY(0) - 0.72, 0]),
    T('chance of the yeses', 18, URG, false, true).moveTo([PFX, PRY(1) - 0.72, 0]),
    T('chance of the nos', 18, C.cyan, false, true).moveTo([PFX, PRY(2) - 0.72, 0]),
  ] : [
    T('number of orders', 17, C.violet, false, true).moveTo([-FSP, W_Y, 0]),
    T('chance of the yeses', 17, URG, false, true).moveTo([0, W_Y, 0]),
    T('chance of the nos', 17, C.cyan, false, true).moveTo([FSP, W_Y, 0]),
  ];
  await until(S(37));
  await play(new M.LaggedStart(wordLabels.map(w => new M.FadeIn(w)), { lagRatio: 0.25, runTime: 1.3 }),
    ...say('ORDERS × YESES × NOS', C.amber));

  // 38: Here: 10 × (1/5)² × (4/5)³
  const N_Y = P ? -0.85 : -1.20;
  const nPos = k => P ? [PNX, PRY(k)] : [(k - 1) * FSP, N_Y];
  const NCW = P ? 2.3 : FCW;
  const numCards = [
    makePanel(...nPos(0), NCW, 0.82, [['10', C.violet, 26, true, true]], C.violet),
    makePanel(...nPos(1), NCW, 0.82, [['(1/5)²', URG, 24, true, true]], URG),
    makePanel(...nPos(2), NCW, 0.82, [['(4/5)³', C.cyan, 24, true, true]], C.cyan),
  ];
  const nTimes = P ? [
    T('×', 24, C.muted, true, true).moveTo([PNX, (PRY(0) + PRY(1)) / 2, 0]),
    T('×', 24, C.muted, true, true).moveTo([PNX, (PRY(1) + PRY(2)) / 2, 0]),
  ] : [
    T('×', P ? 22 : 26, C.muted, true, true).moveTo([-FSP / 2, N_Y, 0]),
    T('×', P ? 22 : 26, C.muted, true, true).moveTo([FSP / 2, N_Y, 0]),
  ];
  await until(S(38));
  await play(new M.LaggedStart([
    new M.FadeIn(numCards[0]), new M.FadeIn(nTimes[0]),
    new M.FadeIn(numCards[1]), new M.FadeIn(nTimes[1]),
    new M.FadeIn(numCards[2])
  ], { lagRatio: 0.18, runTime: 1.4 }),
    ...say('10 × (1/5)² × (4/5)³', C.amber));

  // 39: Gives 0.2048 again
  const resPanel = makePanel(0, P ? -3.9 : -2.28, P ? 6.6 : 6.4, 0.80,
    [['= 0.2048   (about 20 in 100)', C.green, P ? 22 : 24, true, true]], C.green);
  await until(S(39));
  await play(new M.FadeIn(resPanel, { runTime: 0.65 }),
    ...say('= 0.2048 AGAIN', C.green));

  // 40: What is it for? Counts successes in a fixed number of yes-or-no tries
  const forTop = makePanel(0, P ? 2.10 : 0.72, P ? 6.8 : 9.6, P ? 1.40 : 1.25, [
    ['Count YESes in a fixed number of tries', C.ink, P ? 20 : 23, false, true],
    ['fixed n tries   ·   each try: YES or NO', C.muted, P ? 16 : 18, true, false]
  ], C.green);
  await until(S(40));
  await play(new M.FadeOut(new M.VGroup(fHead, ...fCards, ...fTimes, ...wordLabels, ...numCards, ...nTimes, resPanel), { runTime: 0.45 }),
    new M.FadeIn(forTop, { runTime: 0.65 }),
    ...say('WHAT IT IS FOR: COUNT YESES IN n TRIES', C.green));

  // 41: Buyers among visitors, faulty parts in a box, patients who recover
  const exData = [
    ['BUYERS', 'among fixed visitors', C.cyan],
    ['FAULTY PARTS', 'in a fixed box', URG],
    ['RECOVERIES', 'in a patient trial', C.green],
  ];
  const exCards = exData.map(([title, sub, col], k) => P
    ? makePanel(0, -0.05 - k * 1.65, 6.4, 1.30, [[title, col, 21, true, true], [sub, C.ink, 18]], col)
    : makePanel((k - 1) * 4.2, -1.15, 3.75, 1.55, [[title, col, 20, true, true], [sub, C.ink, 18]], col));
  await until(S(41));
  await play(new M.LaggedStart(exCards.map(c => new M.FadeIn(c)), { lagRatio: 0.22, runTime: 1.4 }),
    ...say('REAL-WORLD EXAMPLES', C.cyan));

  // 42: Manager learns 2 urgent in 5 happen often enough to plan for
  const mgrY = P ? 0.55 : 0.45;
  const mgrCards = ['U', 'U', 'N', 'N', 'N'].map((kind, k) =>
    makeCard((k - 2) * (P ? 1.32 : 1.50), mgrY, P ? 1.10 : 1.22, P ? 1.40 : 1.48, kind));
  const mgrNote = makePanel(0, P ? -1.85 : -1.55, P ? 6.6 : 8.8, P ? 1.50 : 1.35, [
    ['2 urgent in 5 tickets  ≈  20%  (1 in 5)', C.amber, P ? 20 : 22, true, true],
    ['Often enough for the manager to plan staffing', C.ink, P ? 17 : 19]
  ], C.amber);
  await until(S(42));
  await play(new M.FadeOut(new M.VGroup(forTop, ...exCards), { runTime: 0.45 }),
    new M.LaggedStart(mgrCards.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 0.7 }),
    new M.FadeIn(mgrNote, { runTime: 0.6 }),
    ...say('≈ 20%: OFTEN ENOUGH TO PLAN FOR', C.amber));

  // 43: Common trap — binomial needs three things
  const chkX = P ? 0 : -2.65, chkW = P ? 6.8 : 6.6;
  const chkTop = P ? 2.40 : 0.85;
  const chkHead = T('The binomial needs 3 things:', P ? 21 : 22, C.pink, false, true);
  chkHead.moveTo([chkX, chkTop, 0]);
  const chkFrames = [0, 1, 2].map(k => {
    const r = new M.RoundedRectangle({ width: chkW, height: 0.78, cornerRadius: 0.14, color: C.muted, strokeWidth: 1.6 });
    r.setFill(C.card, 0.75); r.moveTo([chkX, chkTop - 0.82 - k * 0.96, 0]);
    return r;
  });
  await until(S(43));
  await play(new M.FadeOut(new M.VGroup(...mgrCards, mgrNote), { runTime: 0.45 }),
    new M.FadeIn(chkHead, { runTime: 0.5 }),
    new M.LaggedStart(chkFrames.map(r => new M.FadeIn(r)), { lagRatio: 0.15, runTime: 0.8 }),
    ...say('COMMON TRAP: NEEDS 3 THINGS', C.pink));

  // 44: Fixed number of trials, same chance each time, independent
  const chkLines = [
    '✓  1. Fixed number of trials (n)',
    '✓  2. Same chance each time (p)',
    '✓  3. Trials do not affect each other',
  ];
  const chkItems = chkLines.map((txt, k) =>
    makePanel(chkX, chkTop - 0.82 - k * 0.96, chkW, 0.78, [[txt, C.green, P ? 18 : 19, false, true]], C.green));
  await until(S(44));
  await play(new M.FadeOut(new M.VGroup(...chkFrames), { runTime: 0.3 }),
    new M.LaggedStart(chkItems.map(c => new M.FadeIn(c)), { lagRatio: 0.28, runTime: 1.6 }),
    ...say('FIXED n · SAME p · INDEPENDENT', C.green));

  // 45: Power-cut burst breaks independence
  const burstX = P ? 0 : 3.55, burstY = P ? -2.05 : 0.10;
  const bSp = P ? 1.25 : 1.02, bW = P ? 0.90 : 0.76, bH = P ? 1.05 : 0.92;
  const burstTitle = T('POWER CUT BURST', P ? 18 : 18, URG, true, true);
  burstTitle.moveTo([burstX, burstY + bH / 2 + 0.42, 0]);
  const burstCards = [0, 1, 2, 3, 4].map(k => makeCard(burstX + (k - 2) * bSp, burstY, bW, bH, 'U', true));
  const burstLinks = [0, 1, 2, 3].map(k => new M.Line({
    start: [burstX + (k - 2) * bSp + bW / 2 + 0.04, burstY, 0],
    end: [burstX + (k - 1) * bSp - bW / 2 - 0.04, burstY, 0],
    color: C.pink, strokeWidth: 3.5
  }));
  const brokenItem = makePanel(chkX, chkTop - 0.82 - 2 * 0.96, chkW, 0.78,
    [['✗  3. NOT INDEPENDENT (bursts!)', C.pink, P ? 18 : 19, false, true]], C.pink);
  await until(S(45));
  await play(new M.FadeOut(chkItems[2], { runTime: 0.35 }),
    new M.FadeIn(brokenItem, { runTime: 0.45 }),
    new M.FadeIn(burstTitle, { runTime: 0.5 }),
    new M.LaggedStart(burstCards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.LaggedStart(burstLinks.map(l => new M.Create(l)), { lagRatio: 0.1, runTime: 0.7 }),
    ...say('BURSTS BREAK INDEPENDENCE', C.pink));

  // 46: Then the binomial gives the wrong chances
  const wrongBox = makePanel(burstX, burstY - bH / 2 - (P ? 1.00 : 0.95), P ? 6.2 : 5.2, 0.84,
    [['✗  Binomial gives the wrong chances', C.pink, P ? 18 : 18, false, true]], C.pink);
  await until(S(46));
  await play(new M.FadeIn(wrongBox, { runTime: 0.6 }),
    ...say('BINOMIAL GIVES WRONG CHANCES', C.pink));

  // 47: Next lesson — stop fixing n; how long until the first urgent one?
  const nextY = P ? 0.35 : 0.15;
  const nSp = P ? 1.25 : 1.55, nW = P ? 1.02 : 1.20, nH = P ? 1.32 : 1.48;
  const waitKinds = ['N', 'N', 'N', 'N', 'U'];
  const waitCards = waitKinds.map((kind, k) => makeCard((k - 2) * nSp, nextY, nW, nH, kind));
  const waitNote = makePanel(0, nextY - nH / 2 - (P ? 1.25 : 1.10), P ? 6.8 : 9.4, 1.10, [
    ['How many tickets until the FIRST urgent one?', C.violet, P ? 18 : 21, false, true],
    ['Next lesson: geometric waiting counts', C.muted, P ? 16 : 17, true]
  ], C.violet);
  await until(S(47));
  await play(new M.FadeOut(new M.VGroup(chkHead, chkItems[0], chkItems[1], brokenItem, burstTitle, ...burstCards, ...burstLinks, wrongBox), { runTime: 0.45 }),
    new M.LaggedStart(waitCards.map(c => new M.FadeIn(c)), { lagRatio: 0.16, runTime: 1.2 }),
    new M.FadeIn(waitNote, { runTime: 0.65 }),
    ...say('NEXT LESSON: WAIT UNTIL FIRST URGENT', C.violet));

  // 48: One-sentence recap
  const recap = P ? makePanel(0, -0.35, 7.0, 3.6, [
    ['BINOMIAL COUNTS', C.cyan, 23, true, true],
    ['Counts yeses in n independent trials', C.ink, 20, false, true],
    ['each with the same chance p', C.ink, 20],
    ['mean = n × p', C.amber, 22, true, true],
    ['P(k) = (n choose k) × p^k', C.amber, 21, true, true],
    ['× (1 − p)^(n − k)', C.amber, 21, true, true]
  ], C.amber) : makePanel(0, -0.30, 10.6, 3.0, [
    ['BINOMIAL COUNTS', C.cyan, 26, true, true],
    ['Counts yeses in n independent trials', C.ink, 23, false, true],
    ['each with the same chance p', C.ink, 23],
    ['mean = n × p', C.amber, 22, true, true],
    ['P(k) = (n choose k) × p^k × (1 − p)^(n − k)', C.amber, 20, true, true]
  ], C.amber);
  await until(S(48));
  await play(new M.FadeOut(new M.VGroup(...waitCards, waitNote), { runTime: 0.45 }),
    new M.FadeIn(recap, { runTime: 0.8 }),
    ...say('BINOMIAL: YESES IN n INDEPENDENT TRIALS', C.amber));
}

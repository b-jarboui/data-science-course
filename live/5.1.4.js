// 5.1.4 Negative binomial counts
// Beat i = sentence i (0-based, 42 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const URG = '#ff6b4a'; // red-orange for urgent tickets (yes)
  const CALM = C.cyan;   // cyan for calm tickets (no)
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 3.92, 0] : [0, 1.98, 0];
  const BOXP = P ? [0, 2.48, 0] : [4.45, -0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // Formula box: one at a time, lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan, sz = 0) {
    const size = sz || (P ? 20 : 19), lh = (P ? 0.40 : 0.39) * size / (P ? 20 : 19);
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
    const maxw = P ? FW - 0.8 : 4.35;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  // Track active stage mobjects so transitions are clean and never double-fade
  let stage = [];
  const keep = (...objs) => { stage.push(...objs); return objs; };
  function clearStage() {
    if (!stage.length) return [];
    const a = [new M.FadeOut(new M.VGroup(...stage))];
    stage = [];
    return a;
  }

  // Exact negative binomial probabilities for r = 3, p = 0.2
  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    let res = 1;
    for (let i = 1; i <= Math.min(k, n - k); i++) res = res * (n - i + 1) / i;
    return Math.round(res);
  }
  const nbProb = (k, r = 3, p = 0.2) => comb(k - 1, r - 1) * Math.pow(p, r) * Math.pow(1 - p, k - r);

  // Card helper: places every part directly at [x, y, 0] via moveTo
  function makeCard(x, y, kind, { w = 0.8, h = 1.0, fontSize = 22, opacity = null, stroke = 2 } = {}) {
    const isU = kind === 'U', isN = kind === 'N', isQ = kind === '?';
    const col = isU ? URG : isN ? CALM : C.muted;
    const fillOp = opacity != null ? opacity : (isU ? 0.28 : isN ? 0.16 : 0.08);
    const bg = new M.RoundedRectangle({ width: w, height: h, cornerRadius: Math.min(0.14, w * 0.22), color: col, strokeWidth: stroke });
    bg.setFill(col, fillOp); bg.moveTo([x, y, 0]);
    const glyph = isU ? 'U' : isN ? 'C' : isQ ? '?' : '·';
    const txt = T(glyph, fontSize, col, true, true); txt.moveTo([x, y, 0]);
    return new M.VGroup(bg, txt);
  }

  function frameBox(x, y, w, h, color, fillOp = 0.06, strokeWidth = 2.5, r = 0.14) {
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: r, color, strokeWidth });
    box.setFill(color, fillOp); box.moveTo([x, y, 0]);
    return box;
  }

  // =========================================================================
  // ACT 1 (Beats 0-4): Situation, question, p = 1/5, earliest ticket 3
  // =========================================================================

  // Beat 0: The urgent expert is busy. Call a second expert after the third urgent ticket.
  const introSeq = ['N', 'U', 'N', 'N', 'U', 'N', 'U'];
  const introY = P ? -1.1 : -0.45;
  const introPitch = P ? 0.95 : 1.06;
  const introCards = introSeq.map((k, i) => makeCard(CX + (i - 3) * introPitch, introY, k, {
    w: P ? 0.78 : 0.86, h: P ? 1.02 : 1.12, fontSize: P ? 22 : 24
  }));
  const introNums = introSeq.map((_, i) => {
    const t = T(String(i + 1), P ? 15 : 17, C.muted, true);
    t.moveTo([CX + (i - 3) * introPitch, introY - (P ? 0.76 : 0.82), 0]);
    return t;
  });
  const urgCounts = [[1, '1st'], [4, '2nd'], [6, '3rd']].map(([idx, lbl]) => {
    const t = T(lbl, P ? 15 : 17, idx === 6 ? C.amber : URG, true, true);
    t.moveTo([CX + (idx - 3) * introPitch, introY + (P ? 0.78 : 0.84), 0]);
    return t;
  });
  const busyTag = pill('EXPERT 1: BUSY', C.muted, P ? 15 : 16);
  busyTag.moveTo([CX - (P ? 1.5 : 2.1), introY - (P ? 1.55 : 1.5), 0]);
  const callTag = pill('CALL EXPERT 2', C.amber, P ? 15 : 16);
  callTag.moveTo([CX + (P ? 1.55 : 1.85), introY - (P ? 1.55 : 1.5), 0]);
  const callRing = frameBox(CX + 3 * introPitch, introY, P ? 0.92 : 1.02, P ? 1.16 : 1.26, C.amber, 0, 3);
  keep(...introCards, ...introNums, ...urgCounts, busyTag, callTag, callRing);

  await until(S(0));
  await play(
    new M.LaggedStart(introCards.map(c => new M.FadeIn(c)), { lagRatio: 0.14, runTime: 1.5 }),
    new M.FadeIn(new M.VGroup(...introNums, busyTag)),
    ...say('CALL 2ND EXPERT AFTER 3RD URGENT', URG)
  );
  await until(S(0) + 3.0);
  await play(
    new M.LaggedStart(urgCounts.map(u => new M.FadeIn(u)), { lagRatio: 0.25, runTime: 1.1 }),
    new M.Create(callRing), new M.FadeIn(callTag)
  );

  // Beat 1: She asks: on which ticket will the third urgent one arrive?
  const qCards = Array.from({ length: 6 }, (_, i) => makeCard(CX + (i - 2.75) * introPitch, introY, '?', {
    w: P ? 0.78 : 0.86, h: P ? 1.02 : 1.12, fontSize: P ? 24 : 26
  }));
  const qNums = Array.from({ length: 6 }, (_, i) => {
    const t = T(String(i + 1), P ? 15 : 17, C.muted, true);
    t.moveTo([CX + (i - 2.75) * introPitch, introY - (P ? 0.76 : 0.82), 0]);
    return t;
  });
  const qDots = T('...', 28, C.muted, true, true);
  qDots.moveTo([CX + 3.15 * introPitch, introY, 0]);
  const qBadge = pill('3RD URGENT = TICKET # ?', C.amber, P ? 17 : 18);
  qBadge.moveTo([CX, introY + (P ? 1.15 : 1.1), 0]);

  await until(S(1));
  await play(
    ...clearStage(),
    new M.LaggedStart(qCards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...qNums, qDots, qBadge)),
    ...say('WHICH TICKET IS THE 3RD URGENT?', C.amber)
  );
  keep(...qCards, ...qNums, qDots, qBadge);

  // Beat 2: Each ticket is urgent with a chance of one in five, independently.
  const stripY = P ? -3.35 : -1.95;
  const stripPitch = P ? 0.92 : 0.98;
  const stripCards = ['U', 'N', 'N', 'N', 'N'].map((k, i) => makeCard(CX + (i - 2) * stripPitch, stripY, k, {
    w: P ? 0.72 : 0.76, h: P ? 0.82 : 0.84, fontSize: 20
  }));
  const stripNote = T('1 urgent in 5  ·  each ticket independent', P ? 16 : 18, C.muted);
  stripNote.moveTo([CX, stripY - 0.75, 0]);

  await until(S(2));
  await play(
    new M.LaggedStart(stripCards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.0 }),
    new M.FadeIn(stripNote),
    ...fbox([['urgent (U) = 1/5', URG], ['calm   (C) = 4/5', CALM], ['independent trials', C.muted]]),
    ...say('EACH TICKET: 1 IN 5 URGENT', URG)
  );
  keep(...stripCards, stripNote);

  // Beat 3: The earliest possible answer is ticket three: three urgent in a row.
  const eY = P ? -1.1 : -0.35;
  const ePitch = P ? 1.55 : 1.72;
  const eCards = [0, 1, 2].map(i => makeCard(CX + (i - 1) * ePitch, eY, 'U', {
    w: P ? 1.12 : 1.22, h: P ? 1.38 : 1.44, fontSize: 32, opacity: 0.34, stroke: 2.5
  }));
  const eNums = [0, 1, 2].map(i => {
    const t = T(`#${i + 1}`, P ? 18 : 20, i === 2 ? C.amber : C.muted, true, i === 2);
    t.moveTo([CX + (i - 1) * ePitch, eY - 0.98, 0]);
    return t;
  });
  const eTag = pill('3RD URGENT', C.amber, P ? 15 : 16);
  eTag.moveTo([CX + ePitch, eY + 1.08, 0]);
  const eRing = frameBox(CX + ePitch, eY, P ? 1.28 : 1.38, P ? 1.54 : 1.60, C.amber, 0, 3);

  await until(S(3));
  await play(
    ...clearStage(), ...clearBox(),
    new M.LaggedStart(eCards.map(c => new M.FadeIn(c)), { lagRatio: 0.22, runTime: 1.1 }),
    new M.FadeIn(new M.VGroup(...eNums, eTag)),
    new M.Create(eRing),
    ...say('EARLIEST ANSWER: TICKET 3', URG)
  );
  keep(...eCards, ...eNums, eTag, eRing);

  // Beat 4: One fifth, three times: one in one hundred and twenty-five. Very rare.
  const eFracs = [0, 1, 2].map(i => {
    const t = T('1/5', P ? 20 : 22, URG, true, true);
    t.moveTo([CX + (i - 1) * ePitch, eY - 1.55, 0]);
    return t;
  });
  const eTimes = [0, 1].map(i => {
    const t = T('×', P ? 20 : 22, C.muted, true);
    t.moveTo([CX + (i - 0.5) * ePitch, eY - 1.55, 0]);
    return t;
  });

  await until(S(4));
  await play(
    new M.LaggedStart(eFracs.map(f => new M.FadeIn(f)), { lagRatio: 0.22, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...eTimes)),
    ...fbox([['ticket 3:  U  U  U', URG], ['1/5 × 1/5 × 1/5', C.ink], ['= 1 / 125  (0.8%)', C.amber]], URG),
    ...say('1/5 × 1/5 × 1/5 = 1/125  (VERY RARE)', C.amber)
  );
  keep(...eFracs, ...eTimes);

  // =========================================================================
  // ACT 2 (Beats 5-14): Worked example for ticket 5 (6 rows, 96/3125 ≈ 3%)
  // =========================================================================

  // Beat 5: Let's try ticket five. What must happen?
  const s5Y = P ? -1.15 : -0.4;
  const s5Pitch = P ? 1.16 : 1.32;
  const s5Gap = P ? 0.24 : 0.28;
  const s5X = i => CX + (i - 2) * s5Pitch + (i === 4 ? s5Gap / 2 : -s5Gap / 2);
  const s5W = P ? 0.92 : 1.04, s5H = P ? 1.16 : 1.24;
  const s5Empty = [0, 1, 2, 3, 4].map(i => makeCard(s5X(i), s5Y, '?', { w: s5W, h: s5H, fontSize: 24 }));
  const s5Nums = [0, 1, 2, 3, 4].map(i => {
    const t = T(String(i + 1), P ? 18 : 19, C.muted, true);
    t.moveTo([s5X(i), s5Y - 0.86, 0]);
    return t;
  });

  await until(S(5));
  await play(
    ...clearStage(), ...clearBox(),
    new M.LaggedStart(s5Empty.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...s5Nums)),
    ...say('TRY TICKET 5: WHAT MUST HAPPEN?', C.amber)
  );
  keep(...s5Empty.slice(0, 4), ...s5Nums);

  // Beat 6: Ticket five must be urgent. It is the third one.
  const s5Last = makeCard(s5X(4), s5Y, 'U', { w: s5W, h: s5H, fontSize: 28, opacity: 0.36, stroke: 3 });
  const s5LastRing = frameBox(s5X(4), s5Y, s5W + 0.16, s5H + 0.16, URG, 0, 3);
  const s5LastTag = T('3rd U', P ? 18 : 19, URG, true, true);
  s5LastTag.moveTo([s5X(4), s5Y + 0.94, 0]);
  const s5Dot = new M.Dot({ point: [s5X(4), s5Y, 0], radius: 0.04, color: URG }); s5Dot.setFill(URG, 0);

  await until(S(6));
  await play(
    new M.FadeOut(s5Empty[4]),
    new M.FadeIn(s5Last), new M.Create(s5LastRing), new M.FadeIn(s5LastTag),
    new M.Flash(s5Dot, { color: URG }),
    ...say('TICKET 5 MUST BE URGENT (3RD ONE)', URG)
  );
  keep(s5Last, s5LastRing, s5LastTag);

  // Beat 7: So among the first four tickets, exactly two are urgent and two are calm.
  const box4X = (s5X(0) + s5X(3)) / 2;
  const box4W = (s5X(3) - s5X(0)) + s5W + 0.34;
  const box4 = frameBox(box4X, s5Y, box4W, s5H + 0.36, C.cyan, 0.04, 2.5, 0.18);
  const box4Top = T('first 4 tickets', P ? 17 : 18, C.cyan, true);
  box4Top.moveTo([box4X, s5Y + 1.02, 0]);
  const box4Bot = T('2 urgent  +  2 calm', P ? 18 : 20, C.amber, true, true);
  box4Bot.moveTo([box4X, s5Y - 1.38, 0]);

  await until(S(7));
  await play(
    new M.Create(box4), new M.FadeIn(box4Top), new M.FadeIn(box4Bot),
    ...say('FIRST 4 SLOTS: 2 URGENT, 2 CALM', C.cyan)
  );
  keep(box4, box4Top, box4Bot);

  // Beat 8: How many ways can two urgent sit in four slots? Four choose two is six.
  await until(S(8));
  await play(
    new M.Indicate(box4, { color: C.amber }),
    ...fbox([['2 urgent in 4 slots', C.ink], ['4 choose 2 = 6 ways', C.amber]], C.amber),
    ...say('4 CHOOSE 2 = 6 WAYS', C.amber)
  );

  // Beat 9: Here they are, six rows of cards.
  const VALID6 = ['UUNNU', 'UNUNU', 'UNNUU', 'NUUNU', 'NUNUU', 'NNUUU'];
  const gCX = P ? 0.15 : -2.25;
  const gPX = P ? 0.96 : 0.90, gGap = P ? 0.22 : 0.22;
  const gCW = P ? 0.78 : 0.72, gCH = P ? 0.52 : 0.45;
  const gPY = P ? 0.70 : 0.58;
  const gTopY = P ? -0.35 : 0.92;
  const gColX = c => gCX + (c - 2) * gPX + (c === 4 ? gGap / 2 : -gGap / 2);
  const gRowY = r => gTopY - r * gPY;

  const colHeads = [0, 1, 2, 3, 4].map(c => {
    const t = T(c === 4 ? '5 (U)' : String(c + 1), P ? 15 : 16, c === 4 ? URG : C.muted, true, c === 4);
    t.moveTo([gColX(c), gTopY + (P ? 0.54 : 0.46), 0]);
    return t;
  });
  const divX = (gColX(3) + gColX(4)) / 2;
  const gDiv = new M.DashedLine({
    start: [divX, gTopY + 0.34, 0],
    end: [divX, gRowY(5) - 0.32, 0],
    color: C.muted
  });
  const rowGroups = VALID6.map((str, r) => {
    const num = T(`${r + 1}`, P ? 15 : 16, C.muted, true);
    num.moveTo([gColX(0) - (P ? 0.72 : 0.68), gRowY(r), 0]);
    const cards = [...str].map((ch, c) => makeCard(gColX(c), gRowY(r), ch, {
      w: gCW, h: gCH, fontSize: P ? 18 : 17, stroke: c === 4 ? 2.4 : 1.8
    }));
    return new M.VGroup(num, ...cards);
  });

  await until(S(9));
  await play(
    ...clearStage(),
    new M.FadeIn(new M.VGroup(...colHeads)), new M.Create(gDiv),
    new M.LaggedStart(rowGroups.map(rg => new M.FadeIn(rg)), { lagRatio: 0.14, runTime: 1.2 }),
    ...say('6 ROWS OF 5 CARDS', C.cyan)
  );
  keep(...colHeads, gDiv, ...rowGroups);

  // Beat 10: Each full row has three urgent tickets and two calm ones.
  const row0W = (gColX(4) - gColX(0)) + gCW + 0.24;
  const row0HL = frameBox((gColX(0) + gColX(4)) / 2, gRowY(0), row0W, gCH + 0.16, C.amber, 0.04, 2.5, 0.12);

  await until(S(10));
  await play(
    new M.Create(row0HL),
    ...fbox([['each full row:', C.muted], ['3 urgent (U)', URG], ['2 calm   (C)', CALM]]),
    ...say('EACH ROW: 3 URGENT + 2 CALM', URG)
  );

  // Beat 11: Its chance: one fifth three times, four fifths twice.
  const facY = gRowY(5) - (P ? 0.70 : 0.56);
  const facRow = [...VALID6[0]].map((ch, c) => {
    const isU = ch === 'U';
    const t = T(isU ? '1/5' : '4/5', P ? 17 : 17, isU ? URG : CALM, true, true);
    t.moveTo([gColX(c), facY, 0]);
    return t;
  });
  const facTimes = [0, 1, 2, 3].map(c => {
    const t = T('×', 16, C.muted, true);
    t.moveTo([(gColX(c) + gColX(c + 1)) / 2, facY, 0]);
    return t;
  });

  await until(S(11));
  await play(
    new M.LaggedStart(facRow.map(f => new M.FadeIn(f)), { lagRatio: 0.14, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...facTimes)),
    ...fbox([['one row chance:', C.muted], ['(1/5)³ × (4/5)²', C.ink], ['1/5 three times', URG], ['4/5 twice', CALM]], C.cyan),
    ...say('ONE ROW: (1/5)³ × (4/5)²', C.cyan)
  );
  keep(...facRow, ...facTimes);

  // Beat 12: On top, 1×1×1×4×4 = 16. Underneath, 3,125.
  await until(S(12));
  await play(
    ...fbox([['top:    1×1×1×4×4 = 16', C.amber], ['bottom: 5×5×5×5×5', C.muted]], C.amber),
    ...say('TOP: 1×1×1×4×4 = 16', C.amber)
  );
  await until(S(12) + 4.1);
  await play(
    ...fbox([['top:    1×1×1×4×4 = 16', C.ink], ['bottom: 5⁵ = 3,125', C.cyan], ['one row = 16 / 3,125', C.amber]], C.amber),
    ...say('ONE ROW = 16 / 3,125', C.amber)
  );

  // Beat 13: Six rows, each with that chance: about three in a hundred.
  await until(S(13));
  await play(
    new M.FadeOut(row0HL),
    new M.LaggedStart(rowGroups.map(rg => new M.Indicate(rg, { color: C.green })), { lagRatio: 0.14, runTime: 1.4 }),
    ...fbox([['6 rows × 16 / 3,125', C.ink], ['= 96 / 3,125', C.cyan], ['≈ 0.031  (≈ 3%)', C.amber]], C.green),
    ...say('6 ROWS × 16/3125 ≈ 3 IN 100', C.green)
  );

  // Beat 14: So the third urgent ticket lands exactly on ticket five about three times in a hundred.
  const col5Box = frameBox(gColX(4), (gRowY(0) + gRowY(5)) / 2, gCW + 0.18, (gRowY(0) - gRowY(5)) + gCH + 0.18, C.amber, 0.03, 2.5, 0.12);
  await until(S(14));
  await play(
    new M.Create(col5Box),
    ...say('3RD URGENT ON TICKET 5: ~3%', C.amber)
  );
  keep(col5Box);

  // =========================================================================
  // ACT 3 (Beats 15-19): Full bar chart (k = 3..28), peak 10-11, Name & Compare
  // =========================================================================

  // Beat 15: Doing the same for every ticket number gives a row of bars.
  const KMIN = 3, KMAX = 28, NK = KMAX - KMIN + 1;
  const bx0 = P ? -3.05 : -5.65, bx1 = P ? 3.35 : 5.85;
  const bBase = P ? -3.35 : -2.10;
  const bMaxH = P ? 4.15 : 2.85;
  const bStep = (bx1 - bx0) / NK;
  const bW = bStep * 0.74;
  const bMaxP = 0.065;
  const bX = k => bx0 + (k - KMIN + 0.5) * bStep;

  const axisX = new M.Line({ start: [bx0 - 0.12, bBase, 0], end: [bx1 + 0.25, bBase, 0], color: C.muted, strokeWidth: 2.2 });
  const axisY = new M.Line({ start: [bx0 - 0.12, bBase, 0], end: [bx0 - 0.12, bBase + bMaxH + 0.2, 0], color: C.muted, strokeWidth: 2 });
  const yTicks = [0, 0.03, 0.06].map(pv => {
    const yy = bBase + (pv / bMaxP) * bMaxH;
    const t = T(`${Math.round(pv * 100)}%`, 17, C.muted, true);
    t.moveTo([bx0 - (P ? 0.44 : 0.52), yy, 0]);
    return t;
  });
  const xTicks = [3, 5, 10, 15, 20, 25].map(k => {
    const tick = new M.Line({ start: [bX(k), bBase - 0.07, 0], end: [bX(k), bBase + 0.07, 0], color: C.muted, strokeWidth: 1.8 });
    const lbl = T(String(k), P ? 15 : 16, k === 5 ? C.amber : C.muted, true);
    lbl.moveTo([bX(k), bBase - 0.32, 0]);
    return new M.VGroup(tick, lbl);
  });
  const xTitle = T('ticket number of 3rd urgent', P ? 17 : 18, C.muted);
  xTitle.moveTo([(bx0 + bx1) / 2, bBase - (P ? 0.85 : 0.72), 0]);

  const bars = [];
  for (let k = KMIN; k <= KMAX; k++) {
    const pv = nbProb(k, 3, 0.2);
    const bh = Math.max(0.05, (pv / bMaxP) * bMaxH);
    const col = k === 5 ? C.amber : C.cyan;
    const bar = new M.Rectangle({ width: bW, height: bh, color: col, strokeWidth: 1.2 });
    bar.setFill(col, k === 5 ? 0.88 : 0.74);
    bar.moveTo([bX(k), bBase + bh / 2, 0]);
    bars.push(bar);
  }

  await until(S(15));
  await play(
    ...clearStage(), ...clearBox(),
    new M.Create(axisX), new M.Create(axisY),
    new M.FadeIn(new M.VGroup(...yTicks, ...xTicks, xTitle)),
    new M.LaggedStart(bars.map(b => new M.FadeIn(b)), { lagRatio: 0.05, runTime: 1.5 }),
    ...say('CHANCE FOR EVERY TICKET NUMBER', C.cyan)
  );
  keep(axisX, axisY, ...yTicks, ...xTicks, xTitle, ...bars);

  // Beat 16: The bars rise slowly, peak around tickets ten and eleven, then fade away to the right.
  const bar10 = bars[10 - KMIN], bar11 = bars[11 - KMIN];
  const peakY = bBase + (nbProb(10, 3, 0.2) / bMaxP) * bMaxH;
  const peakTag = pill('PEAK: 10 & 11 (~6%)', C.amber, P ? 15 : 16);
  peakTag.moveTo([(bX(10) + bX(11)) / 2, peakY + (P ? 0.56 : 0.48), 0]);
  const fadeArrow = new M.Arrow({
    start: [bX(16), bBase + bMaxH * 0.55, 0],
    end: [bX(27), bBase + bMaxH * 0.24, 0],
    color: C.muted, strokeWidth: 2.2
  });
  const fadeTxt = T('fades right', P ? 15 : 16, C.muted);
  fadeTxt.moveTo([bX(22), bBase + bMaxH * 0.62, 0]);

  await until(S(16));
  bars[5 - KMIN].setFill(C.cyan, 0.74); bars[5 - KMIN].setColor(C.cyan);
  bar10.setFill(C.amber, 0.92); bar10.setColor(C.amber);
  bar11.setFill(C.amber, 0.92); bar11.setColor(C.amber);
  await play(
    new M.FadeIn(peakTag),
    new M.Indicate(bar10, { color: C.amber }), new M.Indicate(bar11, { color: C.amber }),
    new M.Create(fadeArrow), new M.FadeIn(fadeTxt),
    ...say('RISES, PEAKS AT 10 & 11, THEN FADES', C.amber)
  );
  keep(peakTag, fadeArrow, fadeTxt);

  // Beat 17: The ticket number of the third yes is called a negative binomial count.
  await until(S(17));
  await play(
    new M.Indicate(xTitle, { color: C.green }),
    ...say('NEGATIVE BINOMIAL COUNT', C.green)
  );

  // Beat 18: The name is strange. The binomial fixes the number of trials and counts the yeses.
  const c1Pos = P ? [0, 1.05, 0] : [-3.35, -0.45, 0];
  const c2Pos = P ? [0, -2.35, 0] : [3.35, -0.45, 0];
  const cardW = P ? 6.5 : 5.4, cardH = P ? 2.45 : 3.0;

  function compareCard(pos, title, line1, line2, color, miniKinds, miniNote) {
    const [x, y] = pos;
    const bg = frameBox(x, y, cardW, cardH, color, 0.08, 2.5, 0.2);
    const hd = T(title, P ? 22 : 24, color, true, true); hd.moveTo([x, y + cardH * 0.34, 0]);
    const l1 = T(line1, P ? 18 : 19, C.ink, false, true); l1.moveTo([x, y + cardH * 0.11, 0]);
    const l2 = T(line2, P ? 17 : 18, C.muted); l2.moveTo([x, y - cardH * 0.08, 0]);
    const mp = P ? 0.72 : 0.68;
    const minis = miniKinds.map((mk, i) => makeCard(x + (i - (miniKinds.length - 1) / 2) * mp, y - cardH * 0.31, mk, {
      w: P ? 0.56 : 0.52, h: P ? 0.54 : 0.54, fontSize: 16
    }));
    const mn = T(miniNote, 18, color, true, true); mn.moveTo([x + (miniKinds.length * mp) / 2 + 0.55, y - cardH * 0.31, 0]);
    return new M.VGroup(bg, hd, l1, l2, ...minis, mn);
  }

  const binCard = compareCard(c1Pos, 'BINOMIAL', 'Fixes number of trials (5)', 'Counts the yeses (?)', C.cyan, ['N', 'U', 'N', 'U', 'N'], '2 U');
  const nbCard = compareCard(c2Pos, 'NEGATIVE BINOMIAL', 'Fixes number of yeses (3)', 'Counts the trials (?)', C.amber, ['N', 'U', 'N', 'U', 'U'], '# ?');
  const revTag = pill('REVERSE', C.violet, P ? 15 : 16);
  revTag.moveTo(P ? [0, -0.65, 0] : [0, -0.45, 0]);

  await until(S(18));
  await play(
    ...clearStage(),
    new M.FadeIn(binCard),
    ...say('BINOMIAL: FIX TRIALS, COUNT YESES', C.cyan)
  );
  keep(binCard);

  // Beat 19: This one does the reverse: it fixes the number of yeses and counts the trials.
  await until(S(19));
  await play(
    new M.FadeIn(revTag), new M.FadeIn(nbCard),
    ...say('REVERSE: FIX YESES, COUNT TRIALS', C.amber)
  );
  keep(revTag, nbCard);

  // =========================================================================
  // ACT 4 (Beats 20-25): Mean wait = 3 geometric waits = 5 + 5 + 5 = 15 = r / p
  // =========================================================================

  // Beat 20: How long is the wait on average? Think of three geometric waits, one after another.
  const wPos = P ? [[0, 0.20], [0, -1.60], [0, -3.40]] : [[-4.95, -0.35], [-2.15, -0.35], [0.65, -0.35]];
  const wBoxW = P ? 5.3 : 2.38, wBoxH = P ? 1.12 : 1.32;
  const wMiniP = P ? 0.96 : 0.43, wMiniW = P ? 0.78 : 0.36, wMiniH = P ? 0.72 : 0.62;
  const waitSegs = [], waitUrgDots = [];

  for (let w = 0; w < 3; w++) {
    const [wx, wy] = wPos[w];
    const bx = frameBox(wx, wy, wBoxW, wBoxH, C.cyan, 0.06, 2, 0.16);
    const title = T(`WAIT ${w + 1}`, P ? 15 : 16, C.cyan, true, true);
    title.moveTo(P ? [wx - wBoxW / 2 - 0.72, wy, 0] : [wx, wy + 0.92, 0]);
    const minis = ['N', 'N', 'N', 'N', 'U'].map((k, i) => makeCard(wx + (i - 2) * wMiniP, wy, k, {
      w: wMiniW, h: wMiniH, fontSize: P ? 19 : 14, stroke: 1.6
    }));
    const d = new M.Dot({ point: [wx + 2 * wMiniP, wy, 0], radius: 0.03, color: URG }); d.setFill(URG, 0);
    waitUrgDots.push(d);
    waitSegs.push(new M.VGroup(bx, title, ...minis));
  }

  await until(S(20));
  await play(
    ...clearStage(),
    new M.LaggedStart(waitSegs.map(ws => new M.FadeIn(ws)), { lagRatio: 0.25, runTime: 1.4 }),
    ...say('AVERAGE WAIT = 3 GEOMETRIC WAITS', C.cyan)
  );
  keep(...waitSegs);

  // Beat 21: Because tickets have no memory, each wait starts fresh after an urgent ticket.
  const freshArrows = [0, 1].map(i => P
    ? new M.Arrow({ start: [0, wPos[i][1] - wBoxH / 2 - 0.06, 0], end: [0, wPos[i + 1][1] + wBoxH / 2 + 0.06, 0], color: C.green, strokeWidth: 2.5 })
    : new M.Arrow({ start: [wPos[i][0] + wBoxW / 2 + 0.04, -0.35, 0], end: [wPos[i + 1][0] - wBoxW / 2 - 0.04, -0.35, 0], color: C.green, strokeWidth: 2.5 })
  );
  const freshLabels = [0, 1].map(i => {
    const t = T('fresh', 17, C.green, true);
    t.moveTo(P ? [0.78, (wPos[i][1] + wPos[i + 1][1]) / 2, 0] : [(wPos[i][0] + wPos[i + 1][0]) / 2, 0.52, 0]);
    return t;
  });

  await until(S(21));
  await play(
    new M.Flash(waitUrgDots[0], { color: URG }), new M.Flash(waitUrgDots[1], { color: URG }),
    ...freshArrows.map(a => new M.Create(a)),
    new M.FadeIn(new M.VGroup(...freshLabels)),
    ...say('NO MEMORY: EACH WAIT STARTS FRESH', C.green)
  );
  keep(...freshArrows, ...freshLabels);

  // Beat 22: Wait for the first: 5 on average. Then the second: 5 more. Then the third: 5 more.
  const avgLabels = ['avg 5', '+ 5', '+ 5'].map((txt, w) => {
    const [wx, wy] = wPos[w];
    const p = pill(txt, C.amber, P ? 15 : 16);
    p.moveTo(P ? [wx + wBoxW / 2 + 0.68, wy, 0] : [wx, wy - 1.08, 0]);
    return p;
  });

  await until(S(22));
  await play(
    new M.FadeIn(avgLabels[0]), new M.Indicate(waitSegs[0], { color: C.amber }),
    ...say('5 ON AVERAGE, THEN +5, THEN +5', C.amber)
  );
  await until(S(22) + 2.8);
  await play(new M.FadeIn(avgLabels[1]), new M.Indicate(waitSegs[1], { color: C.amber }));
  await until(S(22) + 5.1);
  await play(new M.FadeIn(avgLabels[2]), new M.Indicate(waitSegs[2], { color: C.amber }));
  keep(...avgLabels);

  // Beat 23: Five plus five plus five makes fifteen tickets.
  const totPill = pill('5 + 5 + 5 = 15 TICKETS', C.amber, P ? 18 : 18);
  totPill.moveTo(P ? [0, -4.65, 0] : [-2.15, -2.18, 0]);

  await until(S(23));
  await play(
    new M.FadeIn(totPill),
    ...fbox([['wait 1 = 5', C.ink], ['wait 2 = 5', C.ink], ['wait 3 = 5', C.ink], ['mean = 15 tickets', C.amber]], C.amber),
    ...say('5 + 5 + 5 = 15 TICKETS', C.amber)
  );
  keep(totPill);

  // Beat 24: In words, the mean wait is r divided by p, where r is the number of yeses we want.
  await until(S(24));
  await play(
    ...fbox([['mean wait = r ÷ p', C.amber], ['r = yeses wanted', URG], ['p = chance of yes', C.cyan]], C.cyan),
    ...say('MEAN WAIT = r ÷ p', C.green)
  );

  // Beat 25: Here, three divided by one fifth is fifteen.
  await until(S(25));
  await play(
    new M.Indicate(totPill, { color: C.green }),
    ...fbox([['mean = r ÷ p', C.muted], ['     = 3 ÷ (1/5)', C.ink], ['     = 15 tickets', C.amber]], C.green),
    ...say('3 ÷ (1/5) = 15 TICKETS', C.amber)
  );

  // =========================================================================
  // ACT 5 (Beats 26-33): Formula piece by piece, k = 5 check, r = 1 geometric
  // =========================================================================

  // Beat 26: Now the short version of what we did for ticket five.
  const fY = P ? -1.45 : -0.40;
  const fSeq = ['U', 'N', 'U', 'N', 'U'];
  const fCards = fSeq.map((k, i) => makeCard(s5X(i), fY, k, { w: s5W, h: s5H, fontSize: 26 }));
  const fNums = [0, 1, 2, 3, 4].map(i => {
    const t = T(String(i + 1), P ? 17 : 18, C.muted, true);
    t.moveTo([s5X(i), fY - 0.85, 0]);
    return t;
  });
  const fDiv = new M.DashedLine({
    start: [(s5X(3) + s5X(4)) / 2, fY + 0.85, 0],
    end: [(s5X(3) + s5X(4)) / 2, fY - 0.85, 0],
    color: C.muted
  });

  await until(S(26));
  await play(
    ...clearStage(), ...clearBox(),
    new M.LaggedStart(fCards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...fNums)), new M.Create(fDiv),
    ...say('NOW THE SHORT VERSION', C.cyan)
  );
  keep(...fCards, ...fNums, fDiv);

  // Beat 27: Let k be the trial where the r-th yes lands, here five.
  const fkRing = frameBox(s5X(4), fY, s5W + 0.16, s5H + 0.16, C.amber, 0, 3);
  const fkTag = T('k = 5', P ? 18 : 19, C.amber, true, true);
  fkTag.moveTo([s5X(4), fY + 0.96, 0]);

  await until(S(27));
  await play(
    new M.Create(fkRing), new M.FadeIn(fkTag),
    ...fbox([['k = trial of r-th yes', C.amber], ['here: k = 5,  r = 3', C.muted]], C.amber),
    ...say('k = TRIAL OF r-TH YES  (k = 5)', C.amber)
  );
  keep(fkRing, fkTag);

  // Beat 28: First, choose where the earlier r minus one yeses sit, among the first k minus one trials.
  const fBox4 = frameBox(box4X, fY, box4W, s5H + 0.34, C.cyan, 0.04, 2.5, 0.16);
  const fBox4Top = T('k−1 = 4 earlier trials', P ? 16 : 17, C.cyan, true);
  fBox4Top.moveTo([box4X, fY + 1.02, 0]);
  const fBox4Bot = T('place r−1 = 2 yeses', P ? 16 : 17, C.amber, true);
  fBox4Bot.moveTo([box4X, fY - 1.38, 0]);

  await until(S(28));
  await play(
    new M.Create(fBox4), new M.FadeIn(fBox4Top), new M.FadeIn(fBox4Bot),
    ...fbox([['P(k) =', C.ink], ['  C(k−1, r−1)', C.amber], ['  earlier yeses', C.muted]], C.amber),
    ...say('CHOOSE r−1 YESES IN k−1 TRIALS', C.amber)
  );
  keep(fBox4, fBox4Top, fBox4Bot);

  // Beat 29: Then multiply by p to the power r, for the yeses.
  const pTags = [0, 2, 4].map(i => {
    const t = T('p', P ? 20 : 21, URG, true, true);
    t.moveTo([s5X(i), fY - 1.92, 0]);
    return t;
  });

  await until(S(29));
  await play(
    new M.LaggedStart([0, 2, 4].map(i => new M.Indicate(fCards[i], { color: URG })), { lagRatio: 0.18, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...pTags)),
    ...fbox([['P(k) =', C.ink], ['  C(k−1, r−1)', C.muted], ['  × p^r       (r yeses)', URG]], URG),
    ...say('MULTIPLY BY p^r FOR THE YESES', URG)
  );
  keep(...pTags);

  // Beat 30: And multiply by one minus p to the power k minus r, for the nos.
  const qTags = [1, 3].map(i => {
    const t = T('1−p', P ? 18 : 19, CALM, true, true);
    t.moveTo([s5X(i), fY - 1.92, 0]);
    return t;
  });

  await until(S(30));
  await play(
    new M.LaggedStart([1, 3].map(i => new M.Indicate(fCards[i], { color: CALM })), { lagRatio: 0.2, runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...qTags)),
    ...fbox([['P(k) = C(k−1, r−1)', C.ink], ['     × p^r', URG], ['     × (1−p)^(k−r)', CALM]], C.cyan),
    ...say('MULTIPLY BY (1−p)^(k−r) FOR NOS', CALM)
  );
  keep(...qTags);

  // Beat 31: Read it: arrange r minus one yeses among the earlier trials, then make the last trial a yes.
  await until(S(31));
  await play(
    new M.Indicate(fBox4, { color: C.cyan }),
    ...fbox([['C(k−1, r−1) p^r (1−p)^(k−r)', C.amber], ['1. r−1 yeses early', C.muted], ['2. last trial is a yes', URG]], C.amber),
    ...say('ARRANGE EARLY YESES, END ON YES', C.amber)
  );
  await until(S(31) + 3.6);
  await play(new M.Indicate(fCards[4], { color: URG }), new M.Indicate(fkRing, { color: URG }));

  // Beat 32: For k equals five: four choose two is six, times one fifth three times, times four fifths twice.
  await until(S(32));
  await play(
    new M.LaggedStart(fCards.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.1, runTime: 1.1 }),
    ...fbox([['k = 5,  r = 3,  p = 1/5', C.muted], ['C(4,2) × (1/5)³ × (4/5)²', C.ink], ['= 6 × 16/3125 ≈ 0.031', C.green]], C.green),
    ...say('C(4,2) × (1/5)³ × (4/5)² ≈ 3%', C.green)
  );

  // Beat 33: With r equal to one, this is the geometric count from the last lesson.
  const geoCards = ['N', 'N', 'N', 'N', 'U'].map((k, i) => makeCard(s5X(i), fY, k, { w: s5W, h: s5H, fontSize: 26 }));
  const geoNote = T('r = 1: first yes lands on slot k', P ? 17 : 18, C.violet, true);
  geoNote.moveTo([CX, fY - 1.35, 0]);

  await until(S(33));
  await play(
    ...clearStage(),
    new M.FadeIn(new M.VGroup(...geoCards, geoNote)),
    ...fbox([['when r = 1:', C.violet], ['C(k−1, 0) = 1', C.muted], ['P = p × (1−p)^(k−1)', C.violet], ['→ geometric count!', C.green]], C.violet),
    ...say('r = 1 → GEOMETRIC COUNT', C.violet)
  );
  keep(...geoCards, geoNote);

  // =========================================================================
  // ACT 6 (Beats 34-35): What is it for?
  // =========================================================================

  // Beat 34: What is it for? It plans for a target number of successes.
  const goalY = P ? 0.5 : 0.1;
  const goalTargets = [0, 1, 2].map(i => {
    const gx = (i - 1) * (P ? 1.7 : 2.1);
    const outer = new M.Circle({ radius: 0.52, color: C.green, strokeWidth: 2.5 });
    outer.setFill(C.green, 0.14); outer.moveTo([gx, goalY, 0]);
    const txt = T(`#${i + 1}`, 22, C.green, true, true); txt.moveTo([gx, goalY, 0]);
    return new M.VGroup(outer, txt);
  });
  const goalCaption = T('Target: r successes — how many tries?', P ? 21 : 24, C.ink, false, true);
  goalCaption.moveTo([0, goalY - 1.25, 0]);

  await until(S(34));
  await play(
    ...clearStage(), ...clearBox(),
    new M.LaggedStart(goalTargets.map(g => new M.FadeIn(g)), { lagRatio: 0.2, runTime: 1.0 }),
    new M.FadeIn(goalCaption),
    ...say('PLANS FOR A TARGET OF r SUCCESSES', C.green)
  );
  keep(...goalTargets, goalCaption);

  // Beat 35: How many calls to make three sales. How many tickets until the third urgent needs a second expert.
  const u1Pos = P ? [0, 0.85, 0] : [-3.35, -0.45, 0];
  const u2Pos = P ? [0, -2.35, 0] : [3.35, -0.45, 0];
  const useW = P ? 6.6 : 5.6, useH = P ? 2.35 : 2.85;

  function useCard(pos, title, sub, seq, accent) {
    const [x, y] = pos;
    const bg = frameBox(x, y, useW, useH, accent, 0.08, 2.5, 0.2);
    const hd = T(title, P ? 22 : 24, accent, true, true); hd.moveTo([x, y + useH * 0.30, 0]);
    const sb = T(sub, P ? 17 : 18, C.muted); sb.moveTo([x, y + useH * 0.06, 0]);
    const sp = P ? 0.72 : 0.66;
    const items = seq.map((k, i) => {
      const ix = x + (i - (seq.length - 1) / 2) * sp, iy = y - useH * 0.26;
      const isHit = k === 'Y';
      const r = new M.RoundedRectangle({ width: 0.54, height: 0.54, cornerRadius: 0.1, color: isHit ? accent : C.muted, strokeWidth: 2 });
      r.setFill(isHit ? accent : C.muted, isHit ? 0.32 : 0.1); r.moveTo([ix, iy, 0]);
      const tx = T(isHit ? '✓' : '·', 20, isHit ? accent : C.muted, true, true); tx.moveTo([ix, iy, 0]);
      return new M.VGroup(r, tx);
    });
    return new M.VGroup(bg, hd, sb, ...items);
  }

  const salesCard = useCard(u1Pos, 'SALES CALLS', 'Calls until 3rd sale', ['N', 'Y', 'N', 'N', 'Y', 'N', 'Y'], C.green);
  const deskCard = useCard(u2Pos, 'SUPPORT DESK', 'Tickets until 3rd urgent', ['N', 'N', 'Y', 'N', 'Y', 'N', 'Y'], URG);

  await until(S(35));
  await play(
    ...clearStage(),
    new M.FadeIn(salesCard),
    ...say('REAL USES: SALES & SUPPORT STAFFING', C.cyan)
  );
  await until(S(35) + 3.0);
  await play(new M.FadeIn(deskCard));
  keep(salesCard, deskCard);

  // =========================================================================
  // ACT 7 (Beats 36-39): Common trap ("by ticket 5" vs "on ticket 5")
  // =========================================================================

  // Beat 36: Here is the common trap. Do not forget that the last trial must be a yes.
  const tY = P ? -0.4 : -0.35;
  const tPitch = P ? 1.24 : 1.55;
  const tCards = [0, 1, 2, 3, 4].map(i => makeCard((i - 2) * tPitch, tY, i === 4 ? 'U' : '?', {
    w: P ? 0.96 : 1.15, h: P ? 1.22 : 1.38, fontSize: 28, stroke: i === 4 ? 3 : 2
  }));
  const tRing = frameBox(2 * tPitch, tY, P ? 1.14 : 1.34, P ? 1.40 : 1.56, C.pink, 0, 3.2);
  const tWarn = pill('SLOT 5 MUST BE YES (U)!', C.pink, P ? 17 : 19);
  tWarn.moveTo([0, tY - (P ? 1.45 : 1.42), 0]);

  await until(S(36));
  await play(
    ...clearStage(),
    new M.FadeIn(new M.VGroup(...tCards)), new M.Create(tRing), new M.FadeIn(tWarn),
    ...say('TRAP: LAST TRIAL MUST BE A YES', C.pink)
  );
  keep(...tCards, tRing, tWarn);

  // Beat 37: If you only ask for three urgent tickets among the first five, you also count other rows.
  const EXTRA4 = ['UUUNN', 'UUNUN', 'UNUUN', 'NUUUN'];
  const EXTRA_HIT = [2, 3, 3, 3]; // 0-based index of the 3rd U in each extra row

  // Left/Top: 6 valid rows; Right/Bottom: 4 extra trap rows
  const vCX = P ? 0 : -3.25, vTop = P ? 2.6 : 0.72, vPY = P ? 0.6 : 0.50;
  const vPX = P ? 0.9 : 0.74, vCW = P ? 0.74 : 0.58, vCH = P ? 0.48 : 0.38;
  const eCX = P ? 0 : 3.05, eTop = P ? -1.95 : 0.60, ePY = P ? 0.62 : 0.70;
  const ePX = P ? 0.9 : 0.82, eCW = P ? 0.74 : 0.66, eCH = P ? 0.48 : 0.48;

  const vHead = T('ON TICKET 5  (6 rows)', P ? 17 : 18, C.green, true, true);
  vHead.moveTo([vCX, vTop + (P ? 0.50 : 0.52), 0]);
  const vRows = VALID6.map((str, r) => new M.VGroup(...[...str].map((ch, c) =>
    makeCard(vCX + (c - 2) * vPX, vTop - r * vPY, ch, { w: vCW, h: vCH, fontSize: P ? 18 : 16, stroke: 1.5 })
  )));
  const vFrame = frameBox(vCX, vTop - 2.5 * vPY, 5 * vPX + 0.34, 6 * vPY + 0.24, C.green, 0.03, 2, 0.16);

  const eHead = T('EXTRA ROWS  (4 rows, end in C)', P ? 16 : 17, C.pink, true, true);
  eHead.moveTo([eCX, eTop + (P ? 0.64 : 0.58), 0]);
  const eRows = EXTRA4.map((str, r) => new M.VGroup(...[...str].map((ch, c) =>
    makeCard(eCX + (c - 2) * ePX, eTop - r * ePY, ch, { w: eCW, h: eCH, fontSize: 18, stroke: 1.8 })
  )));
  const eFrame = frameBox(eCX, eTop - 1.5 * ePY, 5 * ePX + 0.38, 4 * ePY + 0.28, C.pink, 0.05, 2.2, 0.16);

  await until(S(37));
  await play(
    ...clearStage(),
    new M.FadeIn(new M.VGroup(vFrame, vHead, ...vRows)),
    new M.FadeIn(new M.VGroup(eFrame, eHead)),
    new M.LaggedStart(eRows.map(er => new M.FadeIn(er)), { lagRatio: 0.16, runTime: 1.0 }),
    ...say('3 URGENT IN 5 = 6 + 4 EXTRA ROWS', C.pink)
  );
  keep(vFrame, vHead, ...vRows, eFrame, eHead, ...eRows);

  // Beat 38: In those rows, the third urgent ticket came earlier, on ticket three or four.
  const hitRings = EXTRA_HIT.map((colIdx, r) => frameBox(
    eCX + (colIdx - 2) * ePX, eTop - r * ePY, eCW + 0.14, eCH + 0.12, C.amber, 0, 3, 0.1
  ));
  const hitTags = EXTRA_HIT.map((colIdx, r) => {
    const t = T(`#${colIdx + 1}!`, P ? 15 : 16, C.amber, true, true);
    t.moveTo([eCX + 2.5 * ePX + (P ? 0.56 : 0.55), eTop - r * ePY, 0]);
    return t;
  });

  await until(S(38));
  await play(
    new M.LaggedStart(hitRings.map(hr => new M.Create(hr)), { lagRatio: 0.2, runTime: 1.1 }),
    new M.LaggedStart(hitTags.map(ht => new M.FadeIn(ht)), { lagRatio: 0.2, runTime: 1.1 }),
    ...say('3RD URGENT ALREADY CAME ON #3 OR #4', C.amber)
  );
  keep(...hitRings, ...hitTags);

  // Beat 39: That answers a different question: by ticket five, not on ticket five.
  const byPill = pill('BY TICKET 5 = 10 ROWS', C.pink, P ? 15 : 16);
  byPill.moveTo(P ? [0, -4.6, 0] : [eCX, eTop - 3 * ePY - 0.72, 0]);
  const onPill = pill('ON TICKET 5 = 6 ROWS ✓', C.green, P ? 15 : 16);
  onPill.moveTo(P ? [0, -5.2, 0] : [vCX, vTop - 5 * vPY - 0.62, 0]);

  await until(S(39));
  await play(
    new M.FadeIn(byPill), new M.FadeIn(onPill),
    new M.Indicate(vFrame, { color: C.green }),
    ...say('“BY TICKET 5” ≠ “ON TICKET 5”', C.pink)
  );
  keep(byPill, onPill);

  // =========================================================================
  // ACT 8 (Beats 40-41): Next lesson preview & one-sentence recap
  // =========================================================================

  // Beat 40: In the next lesson, we leave endless arrivals and audit a small fixed batch.
  const bBoxY = P ? -0.8 : -0.35;
  const bRowSp = P ? 1.12 : 1.24, bColSp = P ? 1.12 : 1.22;
  const batchSeq = ['U', 'N', 'N', 'U', 'N', 'N', 'U', 'N', 'N', 'N'];
  const batchBox = frameBox(0, bBoxY, 5 * bColSp + 0.65, 2 * bRowSp + 0.65, C.violet, 0.06, 2.5, 0.22);
  const batchTitle = T('FIXED BATCH OF 10 TICKETS', P ? 18 : 20, C.violet, true, true);
  batchTitle.moveTo([0, bBoxY + bRowSp + 0.66, 0]);
  const batchCards = batchSeq.map((k, idx) => {
    const r = Math.floor(idx / 5), c = idx % 5;
    return makeCard((c - 2) * bColSp, bBoxY + (0.5 - r) * bRowSp, k, {
      w: P ? 0.86 : 0.94, h: P ? 0.86 : 0.92, fontSize: 22
    });
  });
  const auditRings = [0, 3].map(idx => {
    const r = Math.floor(idx / 5), c = idx % 5;
    return frameBox((c - 2) * bColSp, bBoxY + (0.5 - r) * bRowSp, P ? 1.0 : 1.08, P ? 1.0 : 1.06, C.amber, 0, 3);
  });
  const auditNote = pill('AUDIT 2 WITHOUT REPLACEMENT', C.amber, P ? 15 : 17);
  auditNote.moveTo([0, bBoxY - bRowSp - 0.72, 0]);

  await until(S(40));
  await play(
    ...clearStage(),
    new M.Create(batchBox), new M.FadeIn(batchTitle),
    new M.LaggedStart(batchCards.map(bc => new M.FadeIn(bc)), { lagRatio: 0.06, runTime: 1.0 }),
    ...auditRings.map(ar => new M.Create(ar)),
    new M.FadeIn(auditNote),
    ...say('NEXT: AUDIT A SMALL FIXED BATCH', C.violet)
  );
  keep(batchBox, batchTitle, ...batchCards, ...auditRings, auditNote);

  // Beat 41: In one sentence: the negative binomial counts the trials needed for r yeses, and the mean wait is r over p.
  const endY = P ? -1.85 : -0.45;
  const endSeq = ['N', 'U', 'N', 'N', 'U', 'N', 'U'];
  const endPitch = P ? 0.94 : 1.04;
  const endCards = endSeq.map((k, i) => makeCard(CX + (i - 3) * endPitch, endY, k, {
    w: P ? 0.76 : 0.84, h: P ? 0.98 : 1.08, fontSize: 22
  }));
  const endRing = frameBox(CX + 3 * endPitch, endY, P ? 0.90 : 1.00, P ? 1.12 : 1.22, C.amber, 0, 3);
  const endSub = T('count trials until r-th yes', P ? 19 : 21, C.ink, false, true);
  endSub.moveTo([CX, endY - (P ? 1.05 : 1.05), 0]);
  const endMean = pill('MEAN WAIT = r ÷ p', C.amber, P ? 18 : 19);
  endMean.moveTo([CX, endY - (P ? 1.85 : 1.75), 0]);

  await until(S(41));
  await play(
    ...clearStage(),
    new M.LaggedStart(endCards.map(ec => new M.FadeIn(ec)), { lagRatio: 0.1, runTime: 1.0 }),
    new M.Create(endRing), new M.FadeIn(endSub), new M.FadeIn(endMean),
    ...fbox([
      ['NEGATIVE BINOMIAL', C.green],
      ['trials until r-th yes', C.ink],
      ['P(k) = C(k−1, r−1)', C.cyan],
      ['       × p^r × (1−p)^(k−r)', C.cyan],
      ['mean wait = r ÷ p', C.amber]
    ], C.green, P ? 21 : 20),
    ...say('TRIALS FOR r YESES · MEAN = r ÷ p', C.green)
  );
}

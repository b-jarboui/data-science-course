// 5.1.5 Hypergeometric counts (live manim-web lesson synced with timing.json).
// Beat i = sentence i (0-based, 0..41). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const ORG = '#fb923c', BLU = C.cyan;

  // Layout constants: phone (8 x 14.22, y in [-5.5, 4.3]) vs laptop (14.22 x 8, y in [-3.0, 2.3])
  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 1.55, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.12, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.39 : 0.40;
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
    const maxw = P ? FW - 0.7 : 4.6;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // 2x5 batch card geometry
  const CW = P ? 1.02 : 1.12, CH = P ? 1.00 : 0.84;
  const DX = P ? 1.28 : 1.44, DY = P ? 1.32 : 1.06;
  const GY0 = P ? 0.10 : 0.64, GY1 = GY0 - DY;
  const cardPos = k => [CX + ((k % 5) - 2) * DX, k < 5 ? GY0 : GY1, 0];

  function makeCard(pos, col, num, tag = '', fillOp = 0.24) {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.12, color: col, strokeWidth: 2.2 });
    r.setFill(col, fillOp); r.moveTo(pos);
    const bar = new M.Rectangle({ width: CW - 0.18, height: 0.11, color: col, strokeWidth: 0 });
    bar.setFill(col, 0.85); bar.moveTo([pos[0], pos[1] + CH / 2 - 0.14, 0]);
    const t = T(String(num), P ? 20 : 19, C.ink, true, true);
    t.moveTo([pos[0], pos[1] + (tag ? 0.02 : -0.05), 0]);
    const parts = [r, bar, t];
    if (tag) {
      const tg = T(tag, P ? 13 : 12, col, true, true);
      tg.moveTo([pos[0], pos[1] - CH / 2 + 0.18, 0]);
      parts.push(tg);
    }
    return new M.VGroup(...parts);
  }

  function makeGoneSlot(pos) {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.12, color: C.muted, strokeWidth: 1.5 });
    r.setFill(C.bg, 0.55); r.moveTo(pos);
    const t = T('GONE', P ? 13 : 12, C.muted, true, true);
    t.moveTo(pos);
    return new M.VGroup(r, t);
  }

  function makeBatchFrame() {
    const r = new M.RoundedRectangle({ width: 4 * DX + CW + 0.44, height: DY + CH + 0.38, cornerRadius: 0.18, color: C.line, strokeWidth: 1.8 });
    r.setFill(C.card, 0.35);
    r.moveTo([CX, (GY0 + GY1) / 2, 0]);
    return r;
  }

  function makeAuditSlot(pos, label) {
    const r = new M.RoundedRectangle({ width: CW + 0.12, height: CH + 0.10, cornerRadius: 0.13, color: C.amber, strokeWidth: 2 });
    r.setFill(C.card, 0.5); r.moveTo(pos);
    const lab = T(label, P ? 15 : 15, C.muted, true);
    lab.moveTo([pos[0], pos[1] - CH / 2 - 0.28, 0]);
    return new M.VGroup(r, lab);
  }

  // --- ACT 1: 10 CLOSED TICKETS & AUDIT QUESTION (Beats 0-6) ---
  const batchFrame = makeBatchFrame();
  const neutralCards = Array.from({ length: 10 }, (_, k) => makeCard(cardPos(k), C.muted, k + 1, '', 0.16));
  await until(S(0));
  await play(
    new M.FadeIn(batchFrame, { runTime: 0.6 }),
    new M.LaggedStart(neutralCards.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.3 }),
    ...say('10 CLOSED TICKETS')
  );

  // Beat 1: 3 urgent, 7 not urgent
  const cards = Array.from({ length: 10 }, (_, k) => makeCard(cardPos(k), k < 3 ? ORG : BLU, k + 1, k < 3 ? 'URG' : 'ok'));
  const legY = GY1 - CH / 2 - (P ? 0.46 : 0.36);
  const legUrg = T('3 urgent', P ? 19 : 18, ORG, true, true); legUrg.moveTo([CX - (P ? 1.4 : 1.7), legY, 0]);
  const legNot = T('7 not urgent', P ? 19 : 18, BLU, true, true); legNot.moveTo([CX + (P ? 1.35 : 1.6), legY, 0]);
  await until(S(1));
  await play(
    new M.FadeOut(new M.VGroup(...neutralCards), { runTime: 0.4 }),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.07, runTime: 1.1 }),
    new M.FadeIn(legUrg), new M.FadeIn(legNot),
    ...say('3 URGENT · 7 NOT URGENT', ORG)
  );

  // Beat 2: Auditor picks 2 different tickets
  const SLOT_Y = P ? -3.55 : -2.06;
  const slot1Pos = [CX - (P ? 1.15 : 1.35), SLOT_Y, 0];
  const slot2Pos = [CX + (P ? 1.15 : 1.35), SLOT_Y, 0];
  const slot1 = makeAuditSlot(slot1Pos, '1st pick');
  const slot2 = makeAuditSlot(slot2Pos, '2nd pick');
  await until(S(2));
  await play(new M.FadeIn(slot1), new M.FadeIn(slot2), ...say('AUDITOR PICKS 2 DIFFERENT TICKETS', C.amber));

  // Beat 3: What is the chance both are urgent?
  const q1 = T('?', P ? 30 : 28, ORG, true, true); q1.moveTo(slot1Pos);
  const q2 = T('?', P ? 30 : 28, ORG, true, true); q2.moveTo(slot2Pos);
  await until(S(3));
  await play(
    new M.FadeIn(q1), new M.FadeIn(q2),
    new M.LaggedStart(cards.slice(0, 3).map(c => new M.Indicate(c, { color: ORG })), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('CHANCE BOTH ARE URGENT?', ORG)
  );

  // Beat 4: Lay out 10 cards: 3 orange, 7 blue
  const legOrg = T('3 orange', P ? 19 : 18, ORG, true, true); legOrg.moveTo([CX - (P ? 1.4 : 1.7), legY, 0]);
  const legBlu = T('7 blue', P ? 19 : 18, BLU, true, true); legBlu.moveTo([CX + (P ? 1.35 : 1.6), legY, 0]);
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(q1, q2, legUrg, legNot), { runTime: 0.5 }),
    new M.FadeIn(legOrg), new M.FadeIn(legBlu),
    new M.LaggedStart(cards.slice(0, 3).map(c => new M.Indicate(c, { color: ORG })), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('3 ORANGE · 7 BLUE', ORG)
  );

  // Beat 5: Pick one card, not put back, then pick a second from the rest
  const gone0 = makeGoneSlot(cardPos(0));
  const picked0 = makeCard(slot1Pos, ORG, 1, 'URG', 0.34);
  const gone1 = makeGoneSlot(cardPos(1));
  const picked1 = makeCard(slot2Pos, ORG, 2, 'URG', 0.34);
  await until(S(5));
  await play(
    new M.FadeOut(cards[0], { runTime: 0.5 }),
    new M.FadeIn(gone0, { runTime: 0.5 }),
    new M.FadeIn(picked0, { runTime: 0.7 }),
    new M.Flash(picked0, { color: ORG, runTime: 0.6 }),
    ...say('1ST PICK: NOT PUT BACK', C.amber)
  );
  await until(S(5) + 2.2);
  await play(
    new M.FadeOut(cards[1], { runTime: 0.5 }),
    new M.FadeIn(gone1, { runTime: 0.5 }),
    new M.FadeIn(picked1, { runTime: 0.7 }),
    new M.Flash(picked1, { color: ORG, runTime: 0.6 }),
    ...say('2ND PICK: FROM THE REST', C.amber)
  );

  // Beat 6: Sampling without replacement
  const noRetTag = pill('NO RETURN', C.violet, P ? 14 : 15);
  noRetTag.moveTo([CX, SLOT_Y + CH / 2 + 0.38, 0]);
  await until(S(6));
  await play(
    new M.FadeIn(noRetTag, { runTime: 0.6 }),
    ...fbox([['without replacement', C.violet], ['picked card stays out', C.muted]], C.violet),
    ...say('SAMPLING WITHOUT REPLACEMENT', C.violet)
  );

  // --- ACT 2: COUNTING ALL 45 PAIRS & 3 ORANGE PAIRS (Beats 7-11) ---
  const STEP = P ? 0.50 : 0.38;
  const MX = CX + (P ? 0.25 : 0.18), MY = P ? -2.05 : -0.82;
  const mPos = (r, c) => [MX + (c - 4) * STEP, MY + (4 - r) * STEP, 0];

  function buildMatrixHeaders() {
    const rowLabs = Array.from({ length: 9 }, (_, r) => {
      const t = T(String(r + 1), P ? 16 : 14, r < 3 ? ORG : BLU, true, true);
      t.moveTo([MX - 4.9 * STEP, MY + (4 - r) * STEP, 0]);
      return t;
    });
    const colLabs = Array.from({ length: 9 }, (_, c) => {
      const cardNum = c + 2;
      const t = T(String(cardNum), P ? 16 : 14, cardNum <= 3 ? ORG : BLU, true, true);
      t.moveTo([MX + (c - 4) * STEP, MY + 4.95 * STEP, 0]);
      return t;
    });
    return { rowLabs, colLabs };
  }

  // Beat 7: Count all possible pairs: 10 choose 2
  const { rowLabs: mRowLabs, colLabs: mColLabs } = buildMatrixHeaders();
  const mTitle = T('every pair of 2 cards', P ? 16 : 15, C.muted, true);
  mTitle.moveTo([MX, MY + 5.75 * STEP, 0]);
  const mDots = [];
  for (let r = 0; r < 9; r++) {
    for (let c = r; c < 9; c++) {
      const d = new M.Dot({ point: mPos(r, c), radius: P ? 0.10 : 0.08, color: C.muted });
      d.setFill(C.cyan, 0.38);
      mDots.push({ r, c, dot: d });
    }
  }
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(batchFrame, ...cards.slice(2), gone0, gone1, picked0, picked1, legOrg, legBlu, slot1, slot2, noRetTag), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...mRowLabs, ...mColLabs, mTitle), { runTime: 0.8 }),
    new M.LaggedStart(mDots.map(x => new M.FadeIn(x.dot)), { lagRatio: 0.03, runTime: 1.7 }),
    ...fbox([['all pairs = C(10, 2)', C.cyan], ['10 choose 2', C.muted]], C.cyan),
    ...say('ALL POSSIBLE PAIRS: 10 CHOOSE 2', C.cyan)
  );

  // Beat 8: 10 choose 2 is 45 pairs
  await until(S(8));
  await play(
    new M.LaggedStart(mDots.map(x => new M.Indicate(x.dot, { color: C.cyan })), { lagRatio: 0.03, runTime: 1.7 }),
    ...fbox([['all pairs = C(10, 2)', C.cyan], ['          = 45 pairs', C.ink]], C.cyan),
    ...say('45 POSSIBLE PAIRS', C.cyan)
  );

  // Beat 9: Now count pairs where both cards are orange
  const orgBox = new M.RoundedRectangle({ width: 2 * STEP + 0.24, height: 2 * STEP + 0.24, cornerRadius: 0.12, color: ORG, strokeWidth: 2.2 });
  orgBox.setFill(ORG, 0.08);
  orgBox.moveTo([MX - 3.5 * STEP, MY + 3.5 * STEP, 0]);
  await until(S(9));
  await play(new M.Create(orgBox, { runTime: 0.8 }), ...say('PAIRS WITH BOTH ORANGE', ORG));

  // Beat 10: 3 orange cards -> 3 choose 2 = 3 pairs
  const orgCoords = [[0, 0], [0, 1], [1, 1]];
  const orgGlows = orgCoords.map(([r, c]) => {
    const p = mPos(r, c);
    const halo = new M.Dot({ point: p, radius: P ? 0.19 : 0.15, color: ORG }); halo.setFill(ORG, 0.24);
    const core = new M.Dot({ point: p, radius: P ? 0.11 : 0.09, color: ORG }); core.setFill(ORG, 1);
    return new M.VGroup(halo, core);
  });
  await until(S(10));
  await play(
    new M.LaggedStart(orgGlows.map(g => new M.FadeIn(g)), { lagRatio: 0.25, runTime: 1.1 }),
    ...fbox([['all pairs   = 45', C.muted], ['both orange = C(3, 2)', ORG], ['            = 3 pairs', ORG]], ORG),
    ...say('3 CHOOSE 2 = 3 ORANGE PAIRS', ORG)
  );

  // Beat 11: Chance is 3/45 = 1/15
  await until(S(11));
  await play(
    new M.LaggedStart(orgGlows.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.15, runTime: 0.9 }),
    ...fbox([['both orange = 3', ORG], ['all pairs   = 45', C.cyan], ['P(2) = 3/45 = 1/15', C.amber]], C.amber),
    ...say('CHANCE = 3 / 45 = 1 IN 15', C.amber)
  );

  // --- ACT 3: STEP-BY-STEP CHECK (Beats 12-16) ---
  const sFrame = makeBatchFrame();
  const sCards = Array.from({ length: 10 }, (_, k) => makeCard(cardPos(k), k < 3 ? ORG : BLU, k + 1, k < 3 ? 'URG' : 'ok'));
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...mRowLabs, ...mColLabs, mTitle, ...mDots.map(x => x.dot), orgBox, ...orgGlows), { runTime: 0.6 }),
    new M.FadeIn(sFrame, { runTime: 0.5 }),
    new M.LaggedStart(sCards.map(c => new M.FadeIn(c)), { lagRatio: 0.05, runTime: 0.8 }),
    ...fbox([['step-by-step check', C.green], ['one draw at a time', C.muted]], C.green),
    ...say('CHECK: ONE DRAW AT A TIME', C.green)
  );

  // Beat 13: First draw: 3 orange out of 10 -> 3/10
  const STEP_Y = P ? -3.45 : -2.05;
  function makeStepChip(x, y, topTxt, botTxt, col) {
    const w = P ? 2.1 : 2.25, h = P ? 1.05 : 0.92;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo([x, y, 0]);
    const t1 = T(topTxt, P ? 14 : 13, C.muted, true); t1.moveTo([x, y + h * 0.22, 0]);
    const t2 = T(botTxt, P ? 24 : 22, col, true, true); t2.moveTo([x, y - h * 0.18, 0]);
    return new M.VGroup(r, t1, t2);
  }
  const draw1Box = makeStepChip(CX - (P ? 2.15 : 2.55), STEP_Y, '1st draw', '3 / 10', ORG);
  await until(S(13));
  await play(
    new M.LaggedStart(sCards.slice(0, 3).map(c => new M.Indicate(c, { color: ORG })), { lagRatio: 0.14, runTime: 1.0 }),
    new M.FadeIn(draw1Box, { runTime: 0.7 }),
    ...fbox([['1st draw: 3 of 10', ORG], ['chance  = 3/10', ORG]], ORG),
    ...say('1ST DRAW: 3 OUT OF 10', ORG)
  );

  // Beat 14: Second draw: 1 orange gone, 2 orange left out of 9
  const sGone0 = makeGoneSlot(cardPos(0));
  const leftTag = T('2 orange left out of 9 cards', P ? 17 : 16, C.amber, true);
  leftTag.moveTo([CX, legY, 0]);
  await until(S(14));
  await play(
    new M.FadeOut(sCards[0], { runTime: 0.5 }),
    new M.FadeIn(sGone0, { runTime: 0.5 }),
    new M.FadeIn(leftTag, { runTime: 0.6 }),
    new M.LaggedStart(sCards.slice(1, 3).map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('1 GONE → 2 ORANGE OF 9 LEFT', C.amber)
  );

  // Beat 15 (SHORT ~1.5s): Chance two ninths
  const draw2Box = makeStepChip(CX + (P ? 0.45 : 0.25), STEP_Y, '2nd draw', '2 / 9', C.amber);
  await until(S(15));
  await play(
    new M.FadeIn(draw2Box, { runTime: 0.6 }),
    ...fbox([['1st draw: 3/10', ORG], ['2nd draw: 2/9', C.amber]], C.amber),
    ...say('2ND DRAW: 2 / 9', C.amber)
  );

  // Beat 16: 3/10 * 2/9 = 6/90 = 1/15. Same answer.
  const timesSym = T('×', P ? 26 : 24, C.ink, true, true);
  timesSym.moveTo([CX - (P ? 0.85 : 1.15), STEP_Y, 0]);
  const eqRes = T('= 1/15 ✓', P ? 22 : 21, C.green, true, true);
  eqRes.moveTo([CX + (P ? 2.45 : 2.45), STEP_Y, 0]);
  await until(S(16));
  await play(
    new M.FadeIn(timesSym, { runTime: 0.5 }),
    new M.FadeIn(eqRes, { runTime: 0.7 }),
    ...fbox([['3/10 × 2/9 = 6/90', C.ink], ['           = 1/15 ✓', C.green], ['same answer', C.muted]], C.green),
    ...say('3/10 × 2/9 = 6/90 = 1/15 ✓', C.green)
  );

  // --- ACT 4A: ALL THREE OUTCOMES IN THE 45-PAIR TRIANGLE (Beats 17-20) ---
  const { rowLabs: m2RowLabs, colLabs: m2ColLabs } = buildMatrixHeaders();
  const m2OrgDots = [], m2MixMuted = [], m2MixBright = [], m2BluMuted = [], m2BluBright = [];
  for (let r = 0; r < 9; r++) {
    for (let c = r; c < 9; c++) {
      const p = mPos(r, c);
      if (r < 3 && c < 2) {
        const d = new M.Dot({ point: p, radius: P ? 0.11 : 0.09, color: ORG }); d.setFill(ORG, 1);
        m2OrgDots.push(d);
      } else if (r < 3 && c >= 2) {
        const dm = new M.Dot({ point: p, radius: P ? 0.09 : 0.075, color: C.muted }); dm.setFill(C.muted, 0.35);
        const db = new M.Dot({ point: p, radius: P ? 0.11 : 0.09, color: C.amber }); db.setFill(C.amber, 0.95);
        m2MixMuted.push(dm); m2MixBright.push(db);
      } else {
        const dm = new M.Dot({ point: p, radius: P ? 0.09 : 0.075, color: C.muted }); dm.setFill(C.muted, 0.35);
        const db = new M.Dot({ point: p, radius: P ? 0.11 : 0.09, color: BLU }); db.setFill(BLU, 0.95);
        m2BluMuted.push(dm); m2BluBright.push(db);
      }
    }
  }
  // group boxes stay inside their own cells (no overlap between the three groups)
  const orgBox2 = new M.RoundedRectangle({ width: 2 * STEP - 0.07, height: 2 * STEP - 0.07, cornerRadius: 0.1, color: ORG, strokeWidth: 2 });
  orgBox2.setFill(ORG, 0.08); orgBox2.moveTo([MX - 3.5 * STEP, MY + 3.5 * STEP, 0]);

  const mixBox = new M.RoundedRectangle({ width: 7 * STEP - 0.07, height: 3 * STEP - 0.07, cornerRadius: 0.1, color: C.amber, strokeWidth: 2.2 });
  mixBox.setFill(C.amber, 0.07); mixBox.moveTo([MX + 1.0 * STEP, MY + 3.0 * STEP, 0]);

  // Beat 17: Exactly 1 orange: pick 1 of 3 orange and 1 of 7 blue
  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(sFrame, ...sCards.slice(1), sGone0, leftTag, draw1Box, draw2Box, timesSym, eqRes), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...m2RowLabs, ...m2ColLabs, ...m2OrgDots, ...m2MixMuted, ...m2BluMuted, orgBox2), { runTime: 0.8 }),
    new M.Create(mixBox, { runTime: 0.9 }),
    ...fbox([['1 orange, 1 blue:', C.amber], ['pick 1 of 3 orange', ORG], ['and  1 of 7 blue', BLU]], C.amber),
    ...say('1 ORANGE + 1 BLUE', C.amber)
  );

  // Beat 18: 3 * 7 = 21 pairs -> 21/45 = 7/15
  // tags sit in the empty lower-left half of the grid, left-aligned, one row each
  // (below the grid, centred: never on the dots or the group boxes)
  const placeLeft = (t, y) => { t.moveTo([MX - 0.5 * STEP, y, 0]); return t; };
  const mixTag = placeLeft(T('one orange: 21', P ? 17 : 15, C.amber, true, true), MY - 5.3 * STEP);
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(...m2MixMuted), { runTime: 0.4 }),
    new M.LaggedStart(m2MixBright.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 1.2 }),
    new M.FadeIn(mixTag, { runTime: 0.6 }),
    ...fbox([['1 orange = 3 × 7 = 21', C.amber], ['P(1) = 21/45 = 7/15', C.amber]], C.amber),
    ...say('21 / 45 = 7 IN 15', C.amber)
  );

  // Beat 19: No orange: 7 choose 2 = 21 pairs
  const bluBox = new M.RoundedRectangle({ width: 6 * STEP - 0.07, height: 6 * STEP - 0.07, cornerRadius: 0.1, color: BLU, strokeWidth: 2 });
  bluBox.setFill(BLU, 0.06); bluBox.moveTo([MX + 1.5 * STEP, MY - 1.5 * STEP, 0]);
  const bluTag = placeLeft(T('no orange: 21', P ? 17 : 15, BLU, true, true), MY - 6.2 * STEP);
  await until(S(19));
  await play(
    new M.Create(bluBox, { runTime: 0.7 }),
    new M.FadeOut(new M.VGroup(...m2BluMuted), { runTime: 0.4 }),
    new M.LaggedStart(m2BluBright.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 1.1 }),
    new M.FadeIn(bluTag, { runTime: 0.6 }),
    ...fbox([['0 orange = C(7, 2) = 21', BLU], ['P(0) = 21/45 = 7/15', BLU]], BLU),
    ...say('0 ORANGE: 21 / 45 = 7 IN 15', BLU)
  );

  // Beat 20: Check 3 + 21 + 21 = 45
  const sumBadge = pill('3 + 21 + 21 = 45 ✓', C.green, P ? 15 : 14);
  sumBadge.moveTo([MX - 0.5 * STEP, MY - 7.3 * STEP, 0]);
  await until(S(20));
  await play(
    new M.FadeIn(sumBadge, { runTime: 0.7 }),
    ...fbox([['2 orange:   3', ORG], ['1 orange:  21', C.amber], ['0 orange:  21', BLU], ['total = 45 pairs ✓', C.green]], C.green),
    ...say('3 + 21 + 21 = 45 PAIRS ✓', C.green)
  );

  // --- ACT 4B: DISTRIBUTION BARS & MEAN 0.6 (Beats 21-22) ---
  const BY = P ? -3.85 : -2.15, BH = P ? 3.2 : 2.35;
  const BSTEP = P ? 1.85 : 2.05, BARW = P ? 1.12 : 1.28;
  const bx = k => CX + (k - 1) * BSTEP;
  const probs = [7 / 15, 7 / 15, 1 / 15];
  const barCols = [BLU, C.amber, ORG];
  const barTxts = ['7/15', '7/15', '1/15'];

  const barBase = new M.Line({ start: [bx(0) - BARW * 0.85, BY, 0], end: [bx(2) + BARW * 0.85, BY, 0], color: C.muted, strokeWidth: 2.5 });
  const bars = probs.map((p, k) => {
    const h = (p / 0.5) * BH;
    const r = new M.Rectangle({ width: BARW, height: h, color: barCols[k], strokeWidth: 2 });
    r.setFill(barCols[k], 0.72);
    r.moveTo([bx(k), BY + h / 2, 0]);
    return r;
  });
  const barVals = probs.map((p, k) => {
    const h = (p / 0.5) * BH;
    const t = T(barTxts[k], P ? 19 : 18, barCols[k], true, true);
    t.moveTo([bx(k), BY + h + 0.30, 0]);
    return t;
  });
  const barLabs = [0, 1, 2].map(k => {
    const t = T(String(k), P ? 20 : 19, C.ink, true, true);
    t.moveTo([bx(k), BY - 0.34, 0]);
    return t;
  });
  const barAxisLab = T('urgent tickets in audit', P ? 17 : 16, C.muted);
  barAxisLab.moveTo([CX, BY - 0.72, 0]);

  const meanX = bx(0) + 0.6 * BSTEP;
  const meanLine = new M.DashedLine({ start: [meanX, BY, 0], end: [meanX, BY + BH + 0.12, 0], color: C.green });
  const meanPill = pill('MEAN = 0.6', C.green, P ? 15 : 15);
  meanPill.moveTo([meanX, BY + BH + 0.48, 0]);

  // Beat 21: Mean = 2 * 3/10 = 0.6 urgent tickets
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(...m2RowLabs, ...m2ColLabs, ...m2OrgDots, ...m2MixBright, ...m2BluBright, orgBox2, mixBox, bluBox, mixTag, bluTag, sumBadge), { runTime: 0.6 }),
    new M.Create(barBase, { runTime: 0.5 }),
    new M.LaggedStart(bars.map((b, k) => new M.FadeIn(new M.VGroup(b, barVals[k], barLabs[k]))), { lagRatio: 0.18, runTime: 1.0 }),
    new M.FadeIn(barAxisLab, { runTime: 0.5 }),
    new M.Create(meanLine, { runTime: 0.8 }),
    new M.FadeIn(meanPill, { runTime: 0.8 }),
    ...fbox([['average urgent found:', C.muted], ['mean = 2 × 3/10', C.ink], ['     = 0.6 tickets', C.green]], C.green),
    ...say('AVERAGE = 0.6 URGENT TICKETS', C.green)
  );

  // Wait: bars[k], barVals[k], barLabs[k] were wrapped in VGroups inside FadeIn above — keep those 3 VGroups!
  // Let's make sure we track the exact bar groups so Beat 22 Indicate and Beat 23 FadeOut work cleanly.
  // (Refactored cleanly below: we fade in bars, barVals, barLabs directly without wrapping them into throwaway VGroups.)

  // Beat 22: These chances are called the hypergeometric distribution
  await until(S(22));
  await play(
    new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.18, runTime: 1.1 }),
    ...fbox([['hypergeometric', C.violet], ['distribution', C.violet], ['P(0)=7/15  P(1)=7/15', C.muted], ['P(2)=1/15', ORG]], C.violet),
    ...say('HYPERGEOMETRIC DISTRIBUTION', C.violet)
  );

  // --- ACT 5A: SMALL FIXED BATCH & THREE PARAMETERS (Beats 23-25) ---
  const pFrame = makeBatchFrame();
  const pCards = Array.from({ length: 10 }, (_, k) => makeCard(cardPos(k), k < 3 ? ORG : BLU, k + 1, k < 3 ? 'YES' : 'no'));
  const pSlot1 = makeAuditSlot(slot1Pos, 'draw 1');
  const pSlot2 = makeAuditSlot(slot2Pos, 'draw 2');

  // Beat 23: Counts yeses from a small fixed batch, without putting back
  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(barBase, ...bars, ...barVals, ...barLabs, barAxisLab, meanLine, meanPill), { runTime: 0.6 }),
    new M.FadeIn(pFrame, { runTime: 0.5 }),
    new M.LaggedStart(pCards.map(c => new M.FadeIn(c)), { lagRatio: 0.05, runTime: 0.9 }),
    new M.FadeIn(pSlot1, { runTime: 0.6 }), new M.FadeIn(pSlot2, { runTime: 0.6 }),
    ...say('SMALL FIXED BATCH · NO RETURN', C.violet)
  );

  // Beat 24 (long ~8.9s): Needs 3 numbers: batch size 10, yeses 3, drawn 2
  const pTagN = pill('BATCH = 10', C.cyan, P ? 15 : 15); pTagN.moveTo([CX - (P ? 2.1 : 2.55), legY, 0]);
  const pTagK = pill('YESES = 3', ORG, P ? 15 : 15); pTagK.moveTo([CX + (P ? 0.15 : 0.1), legY, 0]);
  const pTagn = pill('DRAW = 2', C.amber, P ? 15 : 15); pTagn.moveTo([CX + (P ? 2.2 : 2.55), legY, 0]);
  await until(S(24));
  await play(
    new M.Indicate(pFrame, { color: C.cyan, runTime: 0.8 }),
    new M.FadeIn(pTagN, { runTime: 0.7 }),
    ...fbox([['3 numbers needed:', C.muted], ['batch size = 10', C.cyan]], C.cyan),
    ...say('1) BATCH SIZE = 10', C.cyan)
  );
  await until(S(24) + 2.9);
  await play(
    new M.LaggedStart(pCards.slice(0, 3).map(c => new M.Indicate(c, { color: ORG })), { lagRatio: 0.12, runTime: 0.8 }),
    new M.FadeIn(pTagK, { runTime: 0.7 }),
    ...fbox([['batch size = 10', C.cyan], ['yeses      = 3', ORG]], ORG),
    ...say('2) YESES IN BATCH = 3', ORG)
  );
  await until(S(24) + 5.7);
  await play(
    new M.Indicate(pSlot1, { color: C.amber, runTime: 0.7 }),
    new M.Indicate(pSlot2, { color: C.amber, runTime: 0.7 }),
    new M.FadeIn(pTagn, { runTime: 0.7 }),
    ...fbox([['batch size = 10', C.cyan], ['yeses      = 3', ORG], ['drawn      = 2', C.amber]], C.amber),
    ...say('3) NUMBER DRAWN = 2', C.amber)
  );

  // Beat 25: Short version in words: good pairs / all pairs
  await until(S(25));
  await play(
    ...fbox([['in words:', C.muted], ['chance = good pairs', C.amber], ['       ÷ all pairs', C.cyan]], C.cyan),
    ...say('GOOD PAIRS ÷ ALL PAIRS', C.cyan)
  );

  // --- ACT 5B: FOUR LETTERS & THE FORMULA (Beats 26-31) ---
  const LW = P ? 3.1 : 3.4, LH = P ? 1.65 : 1.35;
  const LX = P ? 1.72 : 1.92, LY_MID = P ? -1.85 : -0.65, LY_OFF = P ? 1.02 : 0.84;
  const lPos = [
    [CX - LX, LY_MID + LY_OFF, 0],
    [CX + LX, LY_MID + LY_OFF, 0],
    [CX - LX, LY_MID - LY_OFF, 0],
    [CX + LX, LY_MID - LY_OFF, 0]
  ];
  function makeLetterCard(pos, sym, col) {
    const r = new M.RoundedRectangle({ width: LW, height: LH, cornerRadius: 0.16, color: col, strokeWidth: 2.2 });
    r.setFill(C.card, 0.92); r.moveTo(pos);
    const t = T(sym, P ? 34 : 32, col, true, true);
    t.moveTo([pos[0] - LW * 0.28, pos[1] + LH * 0.14, 0]);
    return new M.VGroup(r, t);
  }
  function makeLetterVal(pos, valTxt, descTxt, col) {
    const tv = T(valTxt, P ? 26 : 24, C.ink, true, true);
    tv.moveTo([pos[0] + LW * 0.14, pos[1] + LH * 0.14, 0]);
    const td = T(descTxt, P ? 16 : 15, col, false, false);
    td.moveTo([pos[0], pos[1] - LH * 0.26, 0]);
    return new M.VGroup(tv, td);
  }

  const lCardN = makeLetterCard(lPos[0], 'N', C.cyan);
  const lCardK = makeLetterCard(lPos[1], 'K', ORG);
  const lCardn = makeLetterCard(lPos[2], 'n', C.amber);
  const lCardk = makeLetterCard(lPos[3], 'k', C.green);

  // Beat 26: Four letters appear on screen
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(pFrame, ...pCards, pSlot1, pSlot2, pTagN, pTagK, pTagn), { runTime: 0.6 }),
    new M.LaggedStart([lCardN, lCardK, lCardn, lCardk].map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox([['four letters:', C.muted], ['N, K, n  and  k', C.ink]], C.cyan),
    ...say('FOUR LETTERS: N, K, n, k', C.cyan)
  );

  // Beat 27: Big N = 10 (batch size), Big K = 3 (yeses in batch)
  const lValN = makeLetterVal(lPos[0], '= 10', 'batch size', C.cyan);
  const lValK = makeLetterVal(lPos[1], '= 3', 'yeses in batch', ORG);
  await until(S(27));
  await play(
    new M.FadeIn(lValN, { runTime: 0.7 }),
    new M.Indicate(lCardN, { color: C.cyan, runTime: 0.7 }),
    ...fbox([['N = 10  (batch size)', C.cyan]], C.cyan),
    ...say('N = 10 · BATCH SIZE', C.cyan)
  );
  await until(S(27) + 2.8);
  await play(
    new M.FadeIn(lValK, { runTime: 0.7 }),
    new M.Indicate(lCardK, { color: ORG, runTime: 0.7 }),
    ...fbox([['N = 10  (batch size)', C.cyan], ['K = 3   (yeses in batch)', ORG]], ORG),
    ...say('K = 3 · YESES IN BATCH', ORG)
  );

  // Beat 28: Small n = 2 (number drawn), Small k = 2 (yeses we want)
  const lValn = makeLetterVal(lPos[2], '= 2', 'number drawn', C.amber);
  const lValk = makeLetterVal(lPos[3], '= 2', 'yeses we want', C.green);
  await until(S(28));
  await play(
    new M.FadeIn(lValn, { runTime: 0.7 }),
    new M.Indicate(lCardn, { color: C.amber, runTime: 0.7 }),
    ...fbox([['N = 10,  K = 3', C.muted], ['n = 2   (number drawn)', C.amber]], C.amber),
    ...say('n = 2 · NUMBER DRAWN', C.amber)
  );
  await until(S(28) + 2.9);
  await play(
    new M.FadeIn(lValk, { runTime: 0.7 }),
    new M.Indicate(lCardk, { color: C.green, runTime: 0.7 }),
    ...fbox([['N = 10,  K = 3', C.muted], ['n = 2,   k = 2', C.green]], C.green),
    ...say('k = 2 · YESES WE WANT', C.green)
  );

  // Beat 29: Numerator: C(K, k) * C(N - K, n - k)
  await until(S(29));
  await play(
    new M.Indicate(lCardK, { color: ORG, runTime: 0.8 }),
    new M.Indicate(lCardk, { color: C.green, runTime: 0.8 }),
    ...fbox([
      ['top = C(K, k) × C(N−K, n−k)', C.ink],
      ['    = C(3, 2) × C(7, 0)', ORG],
      ['    = 3 × 1 = 3', C.amber]
    ], ORG),
    ...say('C(K, k) × C(N−K, n−k)', ORG)
  );

  // Beat 30: Divide by C(N, n)
  await until(S(30));
  await play(
    new M.Indicate(lCardN, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(lCardn, { color: C.amber, runTime: 0.8 }),
    ...fbox([
      ['P = C(K,k) × C(N−K,n−k)', C.ink],
      ['    ÷ C(N, n)', C.cyan],
      ['  = 3 ÷ 45 = 1/15', C.amber]
    ], C.cyan),
    ...say('DIVIDE BY C(N, n)', C.cyan)
  );

  // Beat 31: Read it in words
  await until(S(31));
  await play(
    new M.LaggedStart([lCardK, lCardk, lCardN, lCardn].map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.14, runTime: 1.2 }),
    ...fbox([
      ['  ways to pick yeses', ORG],
      ['× ways to pick nos', BLU],
      ['÷ all ways to pick', C.amber]
    ], C.amber),
    ...say('YES WAYS × NO WAYS ÷ ALL WAYS', C.amber)
  );

  // --- ACT 6: WHAT IS IT FOR? (Beats 32-33) ---
  function makeUseCard(pos, title, sub, col, kind) {
    const w = P ? 6.0 : 2.35, h = P ? 1.32 : 2.45;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo(pos);
    const ix = P ? pos[0] - 2.1 : pos[0], iy = P ? pos[1] : pos[1] + 0.55;
    const iconParts = [];
    if (kind === 0) {
      for (let j = 0; j < 3; j++) {
        const c = new M.RoundedRectangle({ width: 0.34, height: 0.44, cornerRadius: 0.05, color: j === 0 ? ORG : BLU, strokeWidth: 1.8 });
        c.setFill(j === 0 ? ORG : BLU, 0.3); c.moveTo([ix + (j - 1) * 0.42, iy, 0]);
        iconParts.push(c);
      }
    } else if (kind === 1) {
      for (let j = 0; j < 6; j++) {
        const d = new M.Dot({ point: [ix + ((j % 3) - 1) * 0.34, iy + (j < 3 ? 0.16 : -0.16), 0], radius: 0.11, color: j === 1 ? ORG : C.green });
        d.setFill(j === 1 ? ORG : C.green, 0.9);
        iconParts.push(d);
      }
    } else {
      for (let j = 0; j < 3; j++) {
        const c = new M.Circle({ radius: 0.22, color: col, strokeWidth: 2 });
        c.setFill(col, 0.25); c.moveTo([ix + (j - 1) * 0.48, iy, 0]);
        const n = T(String([7, 14, 29][j]), 13, C.ink, true, true);
        n.moveTo([ix + (j - 1) * 0.48, iy, 0]);
        iconParts.push(c, n);
      }
    }
    const tx = P ? pos[0] + 0.65 : pos[0];
    const t1 = T(title, P ? 22 : 19, col, false, true);
    t1.moveTo([tx, P ? pos[1] + 0.22 : pos[1] - 0.28, 0]);
    const t2 = T(sub, P ? 15 : 14, C.muted);
    t2.moveTo([tx, P ? pos[1] - 0.24 : pos[1] - 0.72, 0]);
    return new M.VGroup(r, ...iconParts, t1, t2);
  }

  const usePos = P
    ? [[0, 0.10, 0], [0, -1.55, 0], [0, -3.20, 0]]
    : [[CX - 2.65, -0.65, 0], [CX, -0.65, 0], [CX + 2.65, -0.65, 0]];
  const useCards = [
    makeUseCard(usePos[0], 'Audits', 'sample closed tickets', C.cyan, 0),
    makeUseCard(usePos[1], 'Quality checks', 'inspect a small box', C.green, 1),
    makeUseCard(usePos[2], 'Lotteries', 'balls stay out', C.amber, 2)
  ];

  // Beat 32: Audits, quality checks, and lotteries
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(lCardN, lCardK, lCardn, lCardk, lValN, lValK, lValn, lValk), { runTime: 0.5 }),
    new M.LaggedStart(useCards.map(c => new M.FadeIn(c)), { lagRatio: 0.22, runTime: 1.3 }),
    ...fbox([['use hypergeometric for:', C.green], ['• audits', C.cyan], ['• quality checks', C.green], ['• lotteries', C.amber]], C.green),
    ...say('WHAT IS IT FOR?', C.green)
  );

  // Beat 33: Inspect a few items from a small batch, no replacement
  await until(S(33));
  await play(
    new M.LaggedStart(useCards.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.16, runTime: 1.2 }),
    ...say('SMALL BATCH · NO REPLACEMENT', C.cyan)
  );

  // --- ACT 7: COMMON TRAP (BINOMIAL) & HUGE BATCH (Beats 34-39) ---
  const TY = P ? -3.65 : -2.15, TH = P ? 3.4 : 2.5;
  const TBX = CX - (P ? 1.45 : 1.75), THX = CX + (P ? 1.45 : 1.75);
  const TBARW = P ? 1.55 : 1.80;
  const tBase = new M.Line({ start: [TBX - TBARW * 0.9, TY, 0], end: [THX + TBARW * 0.9, TY, 0], color: C.muted, strokeWidth: 2.5 });
  const tLabBin = T('Binomial\n(put back)', P ? 16 : 15, C.pink, true); tLabBin.moveTo([TBX, TY - 0.50, 0]);
  const tLabHyp = T('True\n(no return)', P ? 16 : 15, ORG, true); tLabHyp.moveTo([THX, TY - 0.50, 0]);

  // question marks: which chance does each method give? (replaced by the bars)
  const mkQ = (x, col) => {
    const r = new M.RoundedRectangle({ width: TBARW, height: TH * 0.45, cornerRadius: 0.12, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([x, TY + TH * 0.225 + 0.04, 0]);
    const q = T('?', P ? 40 : 38, col, true, true); q.moveTo([x, TY + TH * 0.225 + 0.04, 0]);
    return new M.VGroup(r, q);
  };
  const tQBin = mkQ(TBX, C.pink), tQHyp = mkQ(THX, ORG);

  // Beat 34: Common trap: tempting to use binomial from lesson 2
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(...useCards), { runTime: 0.5 }),
    new M.Create(tBase, { runTime: 0.6 }),
    new M.FadeIn(tLabBin, { runTime: 0.6 }), new M.FadeIn(tLabHyp, { runTime: 0.6 }),
    new M.FadeIn(tQBin, { runTime: 0.6 }), new M.FadeIn(tQHyp, { runTime: 0.6 }),
    ...fbox([['common trap:', C.pink], ['using the binomial', C.pink], ['from lesson 5.1.2', C.muted]], C.pink),
    ...say('TRAP: USING THE BINOMIAL', C.pink)
  );

  // Beat 35: 3/10 * 3/10 = 9 in 100
  const hBin = 0.90 * TH;
  const tBarBin = new M.Rectangle({ width: TBARW, height: hBin, color: C.pink, strokeWidth: 2 });
  tBarBin.setFill(C.pink, 0.72); tBarBin.moveTo([TBX, TY + hBin / 2, 0]);
  const tValBin = T('9 / 100  (9%)', P ? 18 : 17, C.pink, true, true);
  tValBin.moveTo([TBX, TY + hBin + 0.30, 0]);
  await until(S(35));
  await play(
    new M.FadeOut(tQBin, { runTime: 0.4 }),
    new M.FadeIn(tBarBin, { runTime: 0.7 }),
    new M.FadeIn(tValBin, { runTime: 0.7 }),
    ...fbox([['binomial (wrong):', C.pink], ['3/10 × 3/10 = 9/100', C.pink], ['            = 9%', C.pink]], C.pink),
    ...say('3/10 × 3/10 = 9 IN 100', C.pink)
  );

  // Beat 36: Pretends the first orange card was put back
  const tRetTag = pill('3/10 AGAIN?', C.pink, P ? 15 : 14);
  tRetTag.moveTo([TBX, TY + hBin * 0.5, 0]);
  await until(S(36));
  await play(
    new M.FadeIn(tRetTag, { runTime: 0.6 }),
    ...say('PRETENDS CARD WAS PUT BACK', C.pink)
  );

  // Beat 37: It was not. Only 2 of 9 remain.
  const tNoRet = pill('✕ NOT PUT BACK', C.pink, P ? 14 : 14);
  tNoRet.moveTo([TBX, TY + hBin * 0.5, 0]);
  const tLeftTag = pill('2 OF 9 LEFT', ORG, P ? 15 : 14);
  tLeftTag.moveTo([THX, TY + 0.667 * TH + 0.82, 0]);
  await until(S(37));
  await play(
    new M.FadeOut(tRetTag, { runTime: 0.4 }),
    new M.FadeIn(tNoRet, { runTime: 0.6 }),
    new M.FadeIn(tLeftTag, { runTime: 0.7 }),
    ...fbox([['card was NOT put back', C.pink], ['only 2 of 9 remain', ORG], ['3/10 × 2/9 = 1/15', ORG]], ORG),
    ...say('ONLY 2 OF 9 REMAIN', ORG)
  );

  // Beat 38: True chance 1/15, about 7 in 100, is lower
  const hHyp = (1 / 15 / 0.10) * TH;
  const tBarHyp = new M.Rectangle({ width: TBARW, height: hHyp, color: ORG, strokeWidth: 2 });
  tBarHyp.setFill(ORG, 0.78); tBarHyp.moveTo([THX, TY + hHyp / 2, 0]);
  const tValHyp = T('1/15 (~7%)', P ? 18 : 17, ORG, true, true);
  tValHyp.moveTo([THX, TY + hHyp + 0.30, 0]);
  const tDiffArr = new M.Arrow({ start: [CX, TY + hBin, 0], end: [CX, TY + hHyp, 0], color: C.amber, strokeWidth: 3 });
  await until(S(38));
  await play(
    new M.FadeOut(tQHyp, { runTime: 0.4 }),
    new M.FadeIn(tBarHyp, { runTime: 0.7 }),
    new M.FadeIn(tValHyp, { runTime: 0.7 }),
    new M.Create(tDiffArr, { runTime: 0.7 }),
    ...fbox([['binomial: 9/100 (9.0%)', C.pink], ['true:     1/15  (6.7%)', ORG], ['true chance is lower', C.amber]], ORG),
    ...say('TRUE CHANCE: 1/15 (~7 IN 100)', ORG)
  );

  // Beat 39: Huge batch -> two answers become almost the same
  const hTitle = T('Huge batch: 1000 cards (300 orange)', P ? 17 : 16, C.green, true, true);
  hTitle.moveTo([CX, TY + TH + 0.42, 0]);
  const hBarBin = new M.Rectangle({ width: TBARW, height: 0.90 * TH, color: C.pink, strokeWidth: 2 });
  hBarBin.setFill(C.pink, 0.65); hBarBin.moveTo([TBX, TY + 0.45 * TH, 0]);
  const hValBin = T('9.00%', P ? 19 : 18, C.pink, true, true); hValBin.moveTo([TBX, TY + 0.90 * TH + 0.28, 0]);
  const hLabBin = T('Binomial', P ? 16 : 15, C.pink, true); hLabBin.moveTo([TBX, TY - 0.38, 0]);

  const hBarHyp = new M.Rectangle({ width: TBARW, height: 0.898 * TH, color: C.green, strokeWidth: 2 });
  hBarHyp.setFill(C.green, 0.75); hBarHyp.moveTo([THX, TY + 0.449 * TH, 0]);
  const hValHyp = T('8.98%', P ? 19 : 18, C.green, true, true); hValHyp.moveTo([THX, TY + 0.898 * TH + 0.28, 0]);
  const hLabHyp = T('True', P ? 16 : 15, C.green, true); hLabHyp.moveTo([THX, TY - 0.38, 0]);

  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(tBarBin, tValBin, tNoRet, tLeftTag, tBarHyp, tValHyp, tDiffArr, tLabBin, tLabHyp), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(hTitle, hBarBin, hValBin, hLabBin, hBarHyp, hValHyp, hLabHyp), { runTime: 0.9 }),
    ...fbox([['batch of 1000 (300 org):', C.muted], ['binomial: 9.00%', C.pink], ['true:     8.98%', C.green], ['almost the same', C.green]], C.green),
    ...say('HUGE BATCH → ALMOST THE SAME', C.green)
  );

  // --- ACT 8: NEXT LESSON TEASER & RECAP (Beats 40-41) ---
  const POY = P ? -1.85 : -0.65;
  const POL = P ? 6.0 : 7.0;
  const poX0 = CX - POL / 2;
  const poLine = new M.Line({ start: [poX0, POY, 0], end: [poX0 + POL, POY, 0], color: C.muted, strokeWidth: 3 });
  const poTicks = [0, 30, 60].map(m => {
    const x = poX0 + (m / 60) * POL;
    return new M.VGroup(
      new M.Line({ start: [x, POY - 0.10, 0], end: [x, POY + 0.10, 0], color: C.muted, strokeWidth: 2 }),
      T(`${m} min`, P ? 16 : 15, C.muted, true).moveTo([x, POY - 0.42, 0])
    );
  });
  const poDots = [7, 19, 24, 43, 54].map(m => {
    const x = poX0 + (m / 60) * POL;
    const stem = new M.Line({ start: [x, POY, 0], end: [x, POY + 0.55, 0], color: ORG, strokeWidth: 2 });
    const d = new M.Dot({ point: [x, POY + 0.62, 0], radius: 0.13, color: ORG }); d.setFill(ORG, 1);
    return new M.VGroup(stem, d);
  });
  const poLab = T('next: 5.1.6 Poisson — arrivals in 1 hour', P ? 17 : 16, C.violet, true);
  poLab.moveTo([CX, POY - 1.05, 0]);

  // Beat 40: Next lesson: tickets arriving in one hour, no fixed number of trials
  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(tBase, hTitle, hBarBin, hValBin, hLabBin, hBarHyp, hValHyp, hLabHyp), { runTime: 0.6 }),
    new M.Create(poLine, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...poTicks, poLab), { runTime: 0.6 }),
    new M.LaggedStart(poDots.map(d => new M.FadeIn(d)), { lagRatio: 0.18, runTime: 1.1 }),
    ...fbox([['next lesson: 5.1.6', C.violet], ['arrivals in 1 hour', C.ink], ['no fixed batch size', C.muted]], C.violet),
    ...say('NEXT: TICKETS IN 1 HOUR', C.violet)
  );

  // Beat 41: Final one-sentence recap
  const rFrame = makeBatchFrame();
  const rCards = Array.from({ length: 10 }, (_, k) =>
    k < 2 ? makeGoneSlot(cardPos(k)) : makeCard(cardPos(k), k < 3 ? ORG : BLU, k + 1, k < 3 ? 'YES' : 'no')
  );
  const rPick0 = makeCard(slot1Pos, ORG, 1, 'YES', 0.34);
  const rPick1 = makeCard(slot2Pos, ORG, 2, 'YES', 0.34);
  const rTag = pill('WITHOUT REPLACEMENT', C.amber, P ? 15 : 15);
  rTag.moveTo([CX, legY, 0]);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(poLine, ...poTicks, ...poDots, poLab), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(rFrame, ...rCards, rPick0, rPick1, rTag), { runTime: 0.9 }),
    ...fbox([
      ['hypergeometric:', C.amber],
      ['small fixed batch (N, K)', C.cyan],
      ['draw n, no replacement', ORG],
      ['count yeses (k)', C.green]
    ], C.amber),
    ...say('YESES · SMALL BATCH · NO RETURN', C.amber)
  );
}

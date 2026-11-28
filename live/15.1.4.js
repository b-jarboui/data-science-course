// 15.1.4 Upper confidence bounds: give less-tested choices a chance.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const ORANGE = '#fb923c';

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.1;
  const PILL = P ? [0, 4.3, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.75, 0] : [4.35, -0.45, 0];
  const BASE = P ? -1.55 : -1.45;
  const CH = P ? 5.0 : 2.82;
  const YMAX = 2.4;
  const UNIT = CH / YMAX;
  const XA = CX - (P ? 1.42 : 1.55), XB = CX + (P ? 1.42 : 1.55);
  const BW = P ? 1.32 : 1.42;
  const XAXIS = CX - (P ? 2.85 : 3.10);
  const XEND = CX + (P ? 2.75 : 2.85);
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 18);

  // Formula box: one box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan, rt = 0.55) {
    const size = P ? 21 : 19, lh = P ? 0.42 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: rt })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: Math.min(0.4, rt) }));
    boxNow = g;
    return a;
  }

  // Replaceable label slots (never wraps existing objects into VGroups)
  const slots = {};
  function swap(key, mobj, rt = 0.45) {
    const a = [];
    if (slots[key]) a.push(new M.FadeOut(slots[key], { runTime: rt }));
    if (mobj) a.push(new M.FadeIn(mobj, { runTime: rt }));
    slots[key] = mobj || null;
    return a;
  }
  function clearSlots(keys = Object.keys(slots), rt = 0.45) {
    const out = [];
    for (const k of keys) {
      if (slots[k]) { out.push(new M.FadeOut(slots[k], { runTime: rt })); slots[k] = null; }
    }
    return out;
  }

  // Shared icon & dot builders (all parts placed with moveTo before grouping)
  function quizIcon(x, y, s = 1) {
    const r = new M.RoundedRectangle({ width: 0.42 * s, height: 0.48 * s, cornerRadius: 0.08 * s, color: C.cyan, strokeWidth: 2 });
    r.setFill(C.bg, 0.9); r.moveTo([x, y, 0]);
    const q = T('Q', Math.round(18 * s), C.cyan, true, true); q.moveTo([x, y, 0]);
    return new M.VGroup(r, q);
  }
  function reminderIcon(x, y, s = 1) {
    const c = new M.Circle({ radius: 0.23 * s, color: ORANGE, strokeWidth: 2 });
    c.setFill(C.bg, 0.9); c.moveTo([x, y, 0]);
    const h1 = new M.Line({ start: [x, y, 0], end: [x, y + 0.13 * s, 0], color: ORANGE, strokeWidth: 2.2 });
    const h2 = new M.Line({ start: [x, y, 0], end: [x + 0.10 * s, y - 0.04 * s, 0], color: ORANGE, strokeWidth: 2.2 });
    return new M.VGroup(c, h1, h2);
  }
  function rewardDot(pos, kind, rad = 0.22) {
    // kind: 1 = green ✓, 0 = grey ✕, '?' = dark unobserved ?
    const [x, y] = pos;
    const col = kind === 1 ? C.green : C.muted;
    const sym = kind === 1 ? '✓' : (kind === 0 ? '✕' : '?');
    const symCol = kind === 1 ? C.green : (kind === 0 ? C.muted : C.amber);
    const parts = [];
    if (kind === 1) {
      const halo = new M.Dot({ point: [x, y, 0], radius: rad * 1.42, color: C.green });
      halo.setFill(C.green, 0.16);
      parts.push(halo);
    }
    const c = new M.Circle({ radius: rad, color: col, strokeWidth: 2.2 });
    c.setFill(kind === '?' ? C.card : col, kind === '?' ? 0.95 : 0.22); c.moveTo([x, y, 0]);
    const t = T(sym, Math.max(10, Math.round(rad * 84)), symCol, true, true); t.moveTo([x, y, 0]);
    parts.push(c, t);
    return new M.VGroup(...parts);
  }

  // Bar geometry builders
  function solidRect(x, rate, color) {
    const h = Math.max(0.05, rate * UNIT);
    const r = new M.Rectangle({ width: BW, height: h, color, strokeWidth: 2 });
    r.setFill(color, rate > 0 ? 0.84 : 0.28);
    r.moveTo([x, BASE + h / 2, 0]);
    return r;
  }
  function bonusRect(x, rate, bonus) {
    const h = Math.max(0.05, bonus * UNIT);
    const y0 = BASE + Math.max(0.05, rate * UNIT);
    const r = new M.Rectangle({ width: BW, height: h, color: C.violet, strokeWidth: 2 });
    r.setFill(C.violet, 0.24);
    r.moveTo([x, y0 + h / 2, 0]);
    return r;
  }
  function makeAxes() {
    const parts = [];
    parts.push(new M.Line({ start: [XAXIS, BASE, 0], end: [XAXIS, BASE + CH, 0], color: C.muted, strokeWidth: 2.2 }));
    parts.push(new M.Line({ start: [XAXIS, BASE, 0], end: [XEND, BASE, 0], color: C.muted, strokeWidth: 2.2 }));
    for (const v of [0, 0.5, 1.0, 1.5, 2.0]) {
      const y = BASE + v * UNIT;
      parts.push(new M.Line({ start: [XAXIS - 0.08, y, 0], end: [XAXIS + 0.08, y, 0], color: C.muted, strokeWidth: 2 }));
      if (v > 0) {
        const g = new M.Line({ start: [XAXIS, y, -0.01], end: [XEND, y, -0.01], color: C.line, strokeWidth: 1 });
        g.setStrokeOpacity(v === 1 ? 0.65 : 0.35);
        parts.push(g);
      }
      const lb = T(v % 1 === 0 ? String(v) : v.toFixed(1), P ? 15 : 16, C.muted, true);
      lb.moveTo([XAXIS - 0.38, y, 0]);
      parts.push(lb);
    }
    const yLab = T('score', P ? 17 : 15, C.muted, true);
    yLab.moveTo([XAXIS + 0.05, BASE + CH + 0.24, 0]);
    parts.push(yLab);
    // Prompt column icons & headers below BASE
    const yName = BASE - (P ? 0.34 : 0.30);
    const aTit = T('Prompt A', P ? 17 : 18, C.cyan, false, true); aTit.moveTo([XA + 0.16, yName, 0]);
    const bTit = T('Prompt B', P ? 17 : 18, ORANGE, false, true); bTit.moveTo([XB + 0.16, yName, 0]);
    parts.push(quizIcon(XA - 0.82, yName, 0.62), aTit, reminderIcon(XB - 0.82, yName, 0.62), bTit);
    return new M.VGroup(...parts);
  }
  const dotPos = (armX, idx) => {
    const col = idx % 5, row = Math.floor(idx / 5);
    const sp = P ? 0.42 : 0.36;
    const y0 = BASE - (P ? 1.08 : 0.94);
    const dy = P ? 0.46 : 0.38;
    return [armX + (col - 2) * sp, y0 - row * dy, 0];
  };
  const fmt2 = x => x.toFixed(2);
  const dotR = P ? 0.16 : 0.14;

  // ===========================================================================
  // BEATS 0–6: Study app, Prompt A (quiz) & Prompt B (reminder), first 2 learners
  // ===========================================================================
  const cardW = P ? 3.35 : 4.25, cardH = P ? 3.9 : 3.25;
  const cAY = P ? 0.9 : -0.55, cAX = P ? -1.85 : -2.55, cBX = P ? 1.85 : 2.55;
  function makePromptCard(x, y, title, sub, color, isA) {
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.22, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const ic = isA ? quizIcon(x - (P ? 1.05 : 1.35), y + cardH / 2 - 0.48, 0.88) : reminderIcon(x - (P ? 1.05 : 1.35), y + cardH / 2 - 0.48, 0.88);
    const tt = T(title, P ? 22 : 24, color, false, true); tt.moveTo([x + 0.18, y + cardH / 2 - 0.48, 0]);
    const st = T(sub, P ? 15 : 16, C.muted); st.moveTo([x, y + cardH / 2 - 0.95, 0]);
    return { bg: new M.VGroup(r, ic, tt), sub: st };
  }
  const cardA = makePromptCard(cAX, cAY, 'Prompt A', 'Try a quick quiz!', C.cyan, true);
  const cardB = makePromptCard(cBX, cAY, 'Prompt B', 'Time for more practice!', ORANGE, false);

  await until(S(0));
  await play(new M.FadeIn(cardA.bg, { runTime: 0.9 }), new M.FadeIn(cardB.bg, { runTime: 0.9 }),
    ...(P ? fbox([['Goal:', C.green], 'more learners return', 'the next day'], C.green) : []),
    ...say('WHICH PROMPT HELPS LEARNERS RETURN?', C.cyan));

  await until(S(1));
  await play(new M.FadeIn(cardA.sub, { runTime: 0.6 }), new M.FadeIn(cardB.sub, { runTime: 0.6 }),
    new M.Indicate(cardA.bg, { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(cardB.bg, { color: ORANGE, runTime: 0.9 }),
    ...say('A: QUIZ   ·   B: REMINDER', C.amber));

  const l1Dot = rewardDot([cAX, cAY - 0.15, 0], 1, P ? 0.34 : 0.32);
  const l1Tag = T('Learner 1: returns (1)', P ? 15 : 16, C.green); l1Tag.moveTo([cAX, cAY - 0.80, 0]);
  await until(S(2));
  await play(new M.FadeIn(l1Dot, { runTime: 0.7 }), new M.Flash(l1Dot, { color: C.green, runTime: 0.6 }),
    new M.FadeIn(l1Tag, { runTime: 0.6 }), ...(P ? fbox([['Learner 1 → A', C.cyan], ['returns: reward 1', C.green]], C.green) : []),
    ...say('LEARNER 1 → A: RETURNS (+1)', C.green));

  const l2Dot = rewardDot([cBX, cAY - 0.15, 0], 0, P ? 0.34 : 0.32);
  const l2Tag = T('Learner 2: no return (0)', P ? 15 : 16, C.muted); l2Tag.moveTo([cBX, cAY - 0.80, 0]);
  await until(S(3));
  await play(new M.FadeIn(l2Dot, { runTime: 0.7 }), new M.FadeIn(l2Tag, { runTime: 0.6 }),
    ...(P ? fbox([['Learner 1 → A: reward 1', C.cyan], ['Learner 2 → B: reward 0', ORANGE]], C.muted) : []),
    ...say('LEARNER 2 → B: NO RETURN (0)', C.muted));

  const rateA0 = T('1 / 1  =  100%', P ? 20 : 22, C.cyan, true, true); rateA0.moveTo([cAX, cAY - 1.32, 0]);
  await until(S(4));
  await play(new M.FadeIn(rateA0, { runTime: 0.6 }), new M.Indicate(rateA0, { color: C.cyan, runTime: 0.8 }),
    ...(P ? fbox([['A: 1 ÷ 1 = 100%', C.cyan]], C.cyan) : []),
    ...say('A ESTIMATE: 100%', C.cyan));

  const rateB0 = T('0 / 1  =  0%', P ? 20 : 22, ORANGE, true, true); rateB0.moveTo([cBX, cAY - 1.32, 0]);
  await until(S(5));
  await play(new M.FadeIn(rateB0, { runTime: 0.6 }), new M.Indicate(rateB0, { color: ORANGE, runTime: 0.8 }),
    ...(P ? fbox([['A: 1 ÷ 1 = 100%', C.cyan], ['B: 0 ÷ 1 = 0%', ORANGE]], ORANGE) : []),
    ...say('B ESTIMATE: 0%', ORANGE));

  const qBadgeA = pill('ONLY 1 LEARNER?', C.amber, P ? 15 : 14); qBadgeA.moveTo([cAX, cAY + cardH / 2 + 0.35, 0]);
  const qBadgeB = pill('ONLY 1 LEARNER?', C.amber, P ? 15 : 14); qBadgeB.moveTo([cBX, cAY + cardH / 2 + 0.35, 0]);
  await until(S(6));
  await play(new M.FadeIn(qBadgeA, { runTime: 0.6 }), new M.FadeIn(qBadgeB, { runTime: 0.6 }),
    ...(P ? fbox([['Only 1 learner each.', C.amber], 'Can we trust this?'], C.amber) : []),
    ...say('CAN WE TRUST JUST ONE RESULT?', C.amber));

  // ===========================================================================
  // BEATS 7–9: Restaurant two-meals analogy
  // ===========================================================================
  const mY = P ? 0.6 : -0.45, mAX = P ? -1.8 : -2.5, mBX = P ? 1.8 : 2.5;
  function makeMeal(x, y, name, col) {
    const outer = new M.Circle({ radius: P ? 0.82 : 0.92, color: col, strokeWidth: 2.5 });
    outer.setFill(C.card, 0.95); outer.moveTo([x, y + 0.45, 0]);
    const inner = new M.Circle({ radius: P ? 0.56 : 0.64, color: col, strokeWidth: 1.4 });
    inner.setStrokeOpacity(0.5); inner.moveTo([x, y + 0.45, 0]);
    const lb = T(name, P ? 18 : 20, col, false, true); lb.moveTo([x, y + 0.45, 0]);
    return new M.VGroup(outer, inner, lb);
  }
  const meal1 = makeMeal(mAX, mY, 'Meal 1', C.cyan);
  const meal2 = makeMeal(mBX, mY, 'Meal 2', ORANGE);
  const meal1Good = rewardDot([mAX - 0.9, mY - 1.05, 0], 1, 0.24);
  const meal2Bad = rewardDot([mBX - 0.9, mY - 1.05, 0], 0, 0.24);

  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(cardA.bg, cardA.sub, cardB.bg, cardB.sub, l1Dot, l1Tag, l2Dot, l2Tag, rateA0, rateB0, qBadgeA, qBadgeB), { runTime: 0.6 }),
    new M.FadeIn(meal1, { runTime: 0.8 }), new M.FadeIn(meal2, { runTime: 0.8 }),
    new M.FadeIn(meal1Good, { runTime: 0.8 }), new M.FadeIn(meal2Bad, { runTime: 0.8 }),
    ...say('TRY TWO MEALS ONCE EACH', C.amber));

  const m1Unknowns = [0, 1, 2].map(k => rewardDot([mAX - 0.3 + k * 0.6, mY - 1.05, 0], '?', 0.24));
  await until(S(8));
  await play(new M.LaggedStart(m1Unknowns.map(u => new M.FadeIn(u)), { lagRatio: 0.2, runTime: 1.0 }),
    ...(P ? fbox([['One good meal', C.cyan], 'does not mean', 'always good'], C.amber) : []),
    ...say('ONE GOOD MEAL ≠ ALWAYS GOOD', C.amber));

  const m2Unknowns = [0, 1, 2].map(k => rewardDot([mBX - 0.3 + k * 0.6, mY - 1.05, 0], '?', 0.24));
  await until(S(9));
  await play(new M.LaggedStart(m2Unknowns.map(u => new M.FadeIn(u)), { lagRatio: 0.2, runTime: 0.9 }),
    ...(P ? fbox([['More visits', C.violet], '→ more trust'], C.violet) : []),
    ...say('MORE VISITS → MORE TRUST', C.violet));

  // ===========================================================================
  // BEATS 10–19: Introduce UCB bars (solid rate + transparent uncertainty bonus)
  // ===========================================================================
  let axes = makeAxes();
  let dotsA = [rewardDot(dotPos(XA, 0), 1, dotR)];
  let dotsB = [rewardDot(dotPos(XB, 0), 0, dotR)];
  const metaPosA = [XA, BASE - (P ? 0.70 : 0.60), 0];
  const metaPosB = [XB, BASE - (P ? 0.70 : 0.60), 0];

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(meal1, meal2, meal1Good, meal2Bad, ...m1Unknowns, ...m2Unknowns), { runTime: 0.55 }),
    new M.FadeIn(axes, { runTime: 0.75 }),
    new M.FadeIn(dotsA[0], { runTime: 0.6 }), new M.FadeIn(dotsB[0], { runTime: 0.6 }),
    ...swap('metaA', T('1/1 · 100%', P ? 17 : 16, C.cyan, true).moveTo(metaPosA)),
    ...swap('metaB', T('0/1 · 0%', P ? 17 : 16, ORANGE, true).moveTo(metaPosB)),
    ...fbox([['Same problem:', C.cyan], 'only 1 result', 'for each prompt'], C.cyan),
    ...say('SAME PROBLEM IN OUR APP', C.cyan));

  const fewA = rewardDot([XA, BASE + 1.05 * UNIT, 0], '?', 0.28);
  const fewB = rewardDot([XB, BASE + 0.55 * UNIT, 0], '?', 0.28);
  await until(S(11));
  await play(new M.FadeIn(fewA, { runTime: 0.6 }), new M.FadeIn(fewB, { runTime: 0.6 }),
    ...say('FEW RESULTS → LESS SURE', C.violet));

  await until(S(12));
  await play(new M.Indicate(fewA, { color: C.violet, runTime: 0.8 }), new M.Indicate(fewB, { color: C.violet, runTime: 0.8 }),
    ...fbox([['uncertainty', C.violet], 'how little we know', 'about a prompt'], C.violet),
    ...say('UNCERTAINTY = LACK OF KNOWLEDGE', C.violet));

  let barA = solidRect(XA, 1.0, C.cyan);
  let barB = solidRect(XB, 0.0, ORANGE);
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(fewA, fewB), { runTime: 0.4 }),
    new M.FadeIn(barA, { runTime: 0.85 }), new M.FadeIn(barB, { runTime: 0.85 }),
    ...say('SOLID BAR = ESTIMATED RETURN RATE', C.cyan));

  const initBon = Math.sqrt(2 * Math.log(2) / 1); // 1.1774
  let bonA = bonusRect(XA, 1.0, initBon);
  let bonB = bonusRect(XB, 0.0, initBon);
  await until(S(14));
  await play(new M.FadeIn(bonA, { runTime: 0.9 }), new M.FadeIn(bonB, { runTime: 0.9 }),
    ...say('TRANSPARENT BAR = UNCERTAINTY', C.violet));

  const bonLabelA0 = T('+ bonus', P ? 18 : 16, C.ink, true).moveTo([XA, BASE + (1.0 + initBon / 2) * UNIT, 0]);
  const bonLabelB0 = T('+ bonus', P ? 18 : 16, C.ink, true).moveTo([XB, BASE + (initBon / 2) * UNIT, 0]);
  await until(S(15));
  await play(
    new M.Indicate(bonA, { color: C.violet, runTime: 0.8 }), new M.Indicate(bonB, { color: C.violet, runTime: 0.8 }),
    ...swap('bonA', bonLabelA0), ...swap('bonB', bonLabelB0),
    ...say('UNCERTAINTY BONUS', C.violet));

  const scCapA0 = T('A score', P ? 16 : 17, C.amber, true, true).moveTo([XA, BASE + (1.0 + initBon) * UNIT + 0.24, 0]);
  const scCapB0 = T('B score', P ? 16 : 17, C.amber, true, true).moveTo([XB, BASE + initBon * UNIT + 0.24, 0]);
  await until(S(16));
  await play(
    ...swap('scA', scCapA0), ...swap('scB', scCapB0),
    ...fbox([['score = rate + bonus', C.amber], ['solid', C.cyan], ['+ transparent', C.violet]], C.amber),
    ...say('SCORE = RETURN RATE + BONUS', C.amber));

  await until(S(17));
  await play(new M.Indicate(barA, { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(bonB, { color: C.violet, runTime: 0.9 }),
    ...say('HIGH SCORE: WORKS WELL OR LESS KNOWN', C.amber));

  const topLineA = new M.Line({ start: [XA - BW / 2 - 0.1, BASE + (1.0 + initBon) * UNIT, 0], end: [XA + BW / 2 + 0.1, BASE + (1.0 + initBon) * UNIT, 0], color: C.green, strokeWidth: 4 });
  const topLineB = new M.Line({ start: [XB - BW / 2 - 0.1, BASE + initBon * UNIT, 0], end: [XB + BW / 2 + 0.1, BASE + initBon * UNIT, 0], color: C.green, strokeWidth: 4 });
  await until(S(18));
  await play(new M.Create(topLineA, { runTime: 0.7 }), new M.Create(topLineB, { runTime: 0.7 }),
    ...say('UPPER CONFIDENCE BOUND (UCB)', C.green));

  await until(S(19));
  await play(new M.FadeOut(new M.VGroup(topLineA, topLineB), { runTime: 0.4 }),
    new M.Indicate(scCapA0, { color: C.amber, runTime: 0.9 }),
    ...say('ALWAYS CHOOSE THE HIGHEST SCORE', C.amber));

  // ===========================================================================
  // BEATS 20–37: Worked example step-by-step (Steps 1, 2, 3) with exact numbers
  // ===========================================================================
  // Helper to update bars and labels cleanly
  function setChartState(nA, rA, nB, rB, showScores = true, rt = 0.7) {
    const N = nA + nB;
    const rateA = rA / nA, rateB = rB / nB;
    const bA = Math.sqrt(2 * Math.log(N) / nA), bB = Math.sqrt(2 * Math.log(N) / nB);
    const sA = rateA + bA, sB = rateB + bB;
    const anims = [
      new M.Transform(barA, solidRect(XA, rateA, C.cyan), { runTime: rt }),
      new M.Transform(barB, solidRect(XB, rateB, ORANGE), { runTime: rt }),
      new M.Transform(bonA, bonusRect(XA, rateA, bA), { runTime: rt }),
      new M.Transform(bonB, bonusRect(XB, rateB, bB), { runTime: rt }),
      ...swap('metaA', T(`${rA}/${nA} · ${fmt2(rateA)}`, P ? 17 : 16, C.cyan, true).moveTo(metaPosA), rt * 0.6),
      ...swap('metaB', T(`${rB}/${nB} · ${fmt2(rateB)}`, P ? 17 : 16, ORANGE, true).moveTo(metaPosB), rt * 0.6),
      ...swap('bonA', T(`+${fmt2(bA)}`, P ? 18 : 16, C.ink, true).moveTo([XA, BASE + (rateA + bA / 2) * UNIT, 0]), rt * 0.6),
      ...swap('bonB', T(`+${fmt2(bB)}`, P ? 18 : 16, C.ink, true).moveTo([XB, BASE + (rateB + bB / 2) * UNIT, 0]), rt * 0.6),
    ];
    if (showScores) {
      anims.push(
        ...swap('scA', T(fmt2(sA), P ? 17 : 18, sA >= sB ? C.amber : C.muted, true, true).moveTo([XA, BASE + sA * UNIT + 0.24, 0]), rt * 0.6),
        ...swap('scB', T(fmt2(sB), P ? 17 : 18, sB > sA ? C.amber : C.muted, true, true).moveTo([XB, BASE + sB * UNIT + 0.24, 0]), rt * 0.6)
      );
    }
    return { anims, rateA, rateB, bA, bB, sA, sB };
  }

  // Beat 20: Rates between 0 and 1
  await until(S(20));
  await play(
    ...swap('metaA', T('1/1 · 1.00', P ? 17 : 16, C.cyan, true).moveTo(metaPosA)),
    ...swap('metaB', T('0/1 · 0.00', P ? 17 : 16, ORANGE, true).moveTo(metaPosB)),
    ...clearSlots(['scA', 'scB', 'bonA', 'bonB']),
    ...fbox(['Step 1 · total = 2', ['A rate = 1.00', C.cyan], ['B rate = 0.00', ORANGE]], C.cyan),
    ...say('STEP 1 · RATES FROM 0 TO 1', C.cyan));

  // Beat 21: Both bonuses ~ 1.18
  await until(S(21));
  await play(
    ...swap('bonA', T('+1.18', P ? 18 : 16, C.ink, true).moveTo([XA, BASE + (1.0 + initBon / 2) * UNIT, 0])),
    ...swap('bonB', T('+1.18', P ? 18 : 16, C.ink, true).moveTo([XB, BASE + (initBon / 2) * UNIT, 0])),
    new M.Indicate(bonA, { color: C.violet, runTime: 0.8 }), new M.Indicate(bonB, { color: C.violet, runTime: 0.8 }),
    ...fbox(['Step 1 · 1 try each', ['A bonus ≈ 1.18', C.violet], ['B bonus ≈ 1.18', C.violet]], C.violet),
    ...say('1 RESULT EACH → SAME BONUS (+1.18)', C.violet));

  // Beat 22: A scores 2.18, B scores 1.18
  await until(S(22));
  await play(
    ...swap('scA', T('2.18', P ? 18 : 19, C.amber, true, true).moveTo([XA, BASE + (1.0 + initBon) * UNIT + 0.24, 0])),
    ...swap('scB', T('1.18', P ? 18 : 19, C.muted, true, true).moveTo([XB, BASE + initBon * UNIT + 0.24, 0])),
    ...fbox(['Step 1 scores:', ['A: 1.00 + 1.18 = 2.18', C.amber], ['B: 0.00 + 1.18 = 1.18', C.muted]], C.amber),
    ...say('A = 2.18   vs   B = 1.18', C.amber));

  // Beat 23: Choose A (unobserved ?)
  const qA2 = rewardDot(dotPos(XA, 1), '?', dotR);
  await until(S(23));
  await play(new M.Indicate(slots.scA, { color: C.cyan, runTime: 0.8 }), new M.FadeIn(qA2, { runTime: 0.5 }),
    ...say('2.18 > 1.18 → CHOOSE A', C.cyan));

  // Beat 24 (short 2.08s): Learner does not return
  const dA2 = rewardDot(dotPos(XA, 1), 0, dotR);
  dotsA.push(dA2);
  await until(S(24));
  await play(new M.FadeOut(qA2, { runTime: 0.35 }), new M.FadeIn(dA2, { runTime: 0.55 }),
    ...say('RESULT: NO RETURN (0)', C.muted));

  // Beat 25: A is now 1/2 = 0.50
  await until(S(25));
  await play(
    new M.Transform(barA, solidRect(XA, 0.5, C.cyan), { runTime: 0.8 }),
    new M.Transform(bonA, bonusRect(XA, 0.5, initBon), { runTime: 0.8 }),
    ...swap('metaA', T('1/2 · 0.50', P ? 17 : 16, C.cyan, true).moveTo(metaPosA)),
    ...clearSlots(['scA', 'scB', 'bonA']),
    ...fbox(['After choice:', ['A: 1 / 2 = 0.50', C.cyan], ['B: 0 / 1 = 0.00', ORANGE]], C.cyan),
    ...say('A ESTIMATE DROPS TO 0.50', C.cyan));

  // Beat 26: Recalculate both bonuses (total = 3)
  await until(S(26));
  await play(
    new M.Indicate(bonA, { color: C.violet, runTime: 0.7 }), new M.Indicate(bonB, { color: C.violet, runTime: 0.7 }),
    ...fbox(['Step 2 · total = 3', ['recalculate bonuses', C.violet]], C.violet),
    ...say('STEP 2 · RECALCULATE BONUSES', C.violet));

  // Beat 27: A has 2 results -> bonus ~ 1.05
  const bA2 = Math.sqrt(2 * Math.log(3) / 2); // 1.048
  await until(S(27));
  await play(
    new M.Transform(bonA, bonusRect(XA, 0.5, bA2), { runTime: 0.8 }),
    ...swap('bonA', T('+1.05', P ? 18 : 16, C.ink, true).moveTo([XA, BASE + (0.5 + bA2 / 2) * UNIT, 0])),
    ...fbox(['Step 2 · total = 3', ['A (2 tries): +1.05', C.cyan]], C.cyan),
    ...say('A HAS 2 RESULTS → BONUS SHRINKS (+1.05)', C.cyan));

  // Beat 28: B has 1 result -> bonus grows to ~ 1.48
  const bB2 = Math.sqrt(2 * Math.log(3) / 1); // 1.482
  await until(S(28));
  await play(
    new M.Transform(bonB, bonusRect(XB, 0.0, bB2), { runTime: 0.85 }),
    ...swap('bonB', T('+1.48', P ? 18 : 16, C.ink, true).moveTo([XB, BASE + (bB2 / 2) * UNIT, 0])),
    ...fbox(['Step 2 · total = 3', ['A (2 tries): +1.05', C.cyan], ['B (1 try):   +1.48', ORANGE]], ORANGE),
    ...say('B STILL HAS 1 RESULT → BONUS GROWS (+1.48)', ORANGE));

  // Beat 29: A scores 1.55, B scores 1.48
  await until(S(29));
  await play(
    ...swap('scA', T('1.55', P ? 18 : 19, C.amber, true, true).moveTo([XA, BASE + (0.5 + bA2) * UNIT + 0.24, 0])),
    ...swap('scB', T('1.48', P ? 18 : 19, C.muted, true, true).moveTo([XB, BASE + bB2 * UNIT + 0.24, 0])),
    ...fbox(['Step 2 scores:', ['A: 0.50 + 1.05 = 1.55', C.amber], ['B: 0.00 + 1.48 = 1.48', C.muted]], C.amber),
    ...say('A = 1.55   vs   B = 1.48', C.amber));

  // Beat 30: Choose A again
  const qA3 = rewardDot(dotPos(XA, 2), '?', dotR);
  await until(S(30));
  await play(new M.Indicate(slots.scA, { color: C.cyan, runTime: 0.8 }), new M.FadeIn(qA3, { runTime: 0.5 }),
    ...say('1.55 > 1.48 → CHOOSE A AGAIN', C.cyan));

  // Beat 31 (short 2.37s): Does not return either
  const dA3 = rewardDot(dotPos(XA, 2), 0, dotR);
  dotsA.push(dA3);
  await until(S(31));
  await play(new M.FadeOut(qA3, { runTime: 0.35 }), new M.FadeIn(dA3, { runTime: 0.55 }),
    ...say('RESULT: NO RETURN (0)', C.muted));

  // Beat 32: A now 1/3 ~ 0.33
  await until(S(32));
  await play(
    new M.Transform(barA, solidRect(XA, 1 / 3, C.cyan), { runTime: 0.85 }),
    new M.Transform(bonA, bonusRect(XA, 1 / 3, bA2), { runTime: 0.85 }),
    ...swap('metaA', T('1/3 · 0.33', P ? 17 : 16, C.cyan, true).moveTo(metaPosA)),
    ...clearSlots(['scA', 'scB', 'bonA']),
    ...fbox(['After choice:', ['A: 1 / 3 ≈ 0.33', C.cyan], ['B: 0 / 1 = 0.00', ORANGE]], C.cyan),
    ...say('A ESTIMATE DROPS TO 0.33', C.cyan));

  // Beat 33: Step 3 (total = 4), A now scores ~ 1.29
  const bA3 = Math.sqrt(2 * Math.log(4) / 3); // 0.961
  const sA3 = 1 / 3 + bA3; // 1.295
  await until(S(33));
  await play(
    new M.Transform(bonA, bonusRect(XA, 1 / 3, bA3), { runTime: 0.8 }),
    ...swap('bonA', T('+0.96', P ? 18 : 16, C.ink, true).moveTo([XA, BASE + (1 / 3 + bA3 / 2) * UNIT, 0])),
    ...swap('scA', T('1.29', P ? 18 : 19, C.muted, true, true).moveTo([XA, BASE + sA3 * UNIT + 0.24, 0])),
    ...fbox(['Step 3 · total = 4', ['A: 0.33 + 0.96 = 1.29', C.cyan]], C.cyan),
    ...say('STEP 3 (TOTAL = 4) · A = 1.29', C.cyan));

  // Beat 34: B scores ~ 1.67 even though rate is still 0
  const bB3 = Math.sqrt(2 * Math.log(4) / 1); // 1.665
  await until(S(34));
  await play(
    new M.Transform(bonB, bonusRect(XB, 0.0, bB3), { runTime: 0.9 }),
    ...swap('bonB', T('+1.67', P ? 18 : 16, C.ink, true).moveTo([XB, BASE + (bB3 / 2) * UNIT, 0])),
    ...swap('scB', T('1.67', P ? 18 : 19, C.amber, true, true).moveTo([XB, BASE + bB3 * UNIT + 0.24, 0])),
    ...fbox(['Step 3 · total = 4', ['A: 0.33 + 0.96 = 1.29', C.muted], ['B: 0.00 + 1.67 = 1.67', C.amber]], ORANGE),
    ...say('B = 1.67 (EVEN WITH 0.00 RATE!)', ORANGE));

  // Beat 35: B has higher score because we know much less about B
  await until(S(35));
  await play(new M.Indicate(bonB, { color: ORANGE, runTime: 0.85 }),
    new M.Indicate(slots.scB, { color: C.amber, runTime: 0.85 }),
    ...say('B WINS: LESS TESTED → BIGGER BONUS', ORANGE));

  // Beat 36: App chooses B, learner returns!
  const dB2 = rewardDot(dotPos(XB, 1), 1, dotR);
  dotsB.push(dB2);
  await until(S(36));
  await play(new M.FadeIn(dB2, { runTime: 0.65 }), new M.Flash(dB2, { color: C.green, runTime: 0.6 }),
    ...say('CHOOSE B → LEARNER RETURNS (+1)', C.green));

  // Beat 37: B now has 1/2 = 0.50
  const st5 = setChartState(3, 1, 2, 1, true, 0.85);
  await until(S(37));
  await play(...st5.anims,
    ...fbox(['After choice (total = 5):', ['A: 1 / 3 = 0.33', C.cyan], ['B: 1 / 2 = 0.50', ORANGE]], ORANGE),
    ...say('B ESTIMATE JUMPS TO 0.50', ORANGE));

  // ===========================================================================
  // BEATS 38–39: Speed up through fixed reward sequences (chapters/15.1.md)
  // Fixed sequences: A = [1,0,0,1,0,1,0,1,0,1], B = [0,1,1,1,0,1,1,1,1,0]
  // Already used: A[0..2] (nA=3, rA=1), B[0..1] (nB=2, rB=1)
  // ===========================================================================
  const seqA = [1, 0, 0, 1, 0, 1, 0, 1, 0, 1];
  const seqB = [0, 1, 1, 1, 0, 1, 1, 1, 1, 0];
  let nA = 3, rA = 1, nB = 2, rB = 1;

  async function runOneFastStep(rt = 0.45) {
    const N = nA + nB;
    const sA = rA / nA + Math.sqrt(2 * Math.log(N) / nA);
    const sB = rB / nB + Math.sqrt(2 * Math.log(N) / nB);
    let newDot;
    if (sA >= sB) {
      const rew = seqA[nA];
      newDot = rewardDot(dotPos(XA, nA), rew, dotR);
      dotsA.push(newDot);
      nA++; rA += rew;
    } else {
      const rew = seqB[nB];
      newDot = rewardDot(dotPos(XB, nB), rew, dotR);
      dotsB.push(newDot);
      nB++; rB += rew;
    }
    const upd = setChartState(nA, rA, nB, rB, true, rt);
    await play(new M.FadeIn(newDot, { runTime: rt * 0.7 }), ...upd.anims,
      ...fbox([`Total choices = ${nA + nB}`, [`A: ${rA}/${nA} = ${fmt2(rA / nA)}`, C.cyan], [`B: ${rB}/${nB} = ${fmt2(rB / nB)}`, ORANGE]], C.cyan, rt));
  }

  // Beat 38: 5 quick steps (total 5 -> 10)
  await until(S(38));
  await play(...say('COLLECTING MORE RESULTS...', C.cyan));
  for (let s = 0; s < 5; s++) await runOneFastStep(0.45);

  // Beat 39: 5 more quick steps (total 10 -> 15: A ends 2/5=0.40, B ends 7/10=0.70)
  await until(S(39));
  await play(...say('B GETS MORE CHOICES (HIGHER RATE)', C.green));
  for (let s = 0; s < 5; s++) await runOneFastStep(0.42);
  await play(new M.Indicate(barB, { color: C.green, runTime: 0.8 }),
    ...fbox(['After 15 choices:', ['A: 2/5  = 0.40 (5 tries)', C.muted], ['B: 7/10 = 0.70 (10 tries)', C.green]], C.green));

  // ===========================================================================
  // BEATS 40–47: Step-by-step build of the uncertainty bonus formula
  // Example anchored to Step 3 (total = 4, A = 3 choices, B = 1 choice)
  // ===========================================================================
  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(axes, barA, barB, bonA, bonB, ...dotsA, ...dotsB), { runTime: 0.65 }),
    ...clearSlots(),
    ...fbox([['uncertainty bonus', C.violet], 'build it step by step'], C.violet),
    ...say('HOW TO CALCULATE THE BONUS', C.violet));

  // Beat 41: Total choices across both prompts (example N = 4: 3 for A, 1 for B)
  const fy = P ? 0.6 : -0.45;
  const nCard = new M.RoundedRectangle({ width: P ? 5.6 : 6.0, height: 2.1, cornerRadius: 0.2, color: C.cyan, strokeWidth: 2.2 });
  nCard.setFill(C.card, 0.95); nCard.moveTo([CX, fy, 0]);
  const nTitle = T('Total choices = 4', P ? 24 : 26, C.cyan, true, true); nTitle.moveTo([CX, fy + 0.52, 0]);
  const nDots = [0, 1, 2, 3].map(k => {
    const col = k < 3 ? C.cyan : ORANGE;
    const c = new M.Circle({ radius: 0.28, color: col, strokeWidth: 2.5 });
    c.setFill(col, 0.24); c.moveTo([CX + (k - 1.5) * 0.95, fy - 0.34, 0]);
    const t = T(k < 3 ? 'A' : 'B', 18, col, true, true); t.moveTo([CX + (k - 1.5) * 0.95, fy - 0.34, 0]);
    return new M.VGroup(c, t);
  });
  await until(S(41));
  await play(new M.FadeIn(nCard, { runTime: 0.6 }), new M.FadeIn(nTitle, { runTime: 0.6 }),
    new M.LaggedStart(nDots.map(d => new M.FadeIn(d)), { lagRatio: 0.14, runTime: 0.8 }),
    ...fbox(['1. total choices', ['   example: 4', C.cyan]], C.cyan),
    ...say('STEP 1: TOTAL CHOICES', C.cyan));

  // Beat 42: Natural logarithm curve — grows slowly as total grows
  const gX0 = CX - (P ? 2.6 : 2.8), gX1 = CX + (P ? 2.6 : 2.6);
  const gY0 = P ? -2.4 : -1.75, gW = gX1 - gX0, gH = P ? 4.6 : 2.45;
  const gx = n => gX0 + ((n - 1) / 19) * gW;
  const gy = v => gY0 + (v / 3.4) * gH;
  const lnAxesParts = [
    new M.Line({ start: [gX0, gY0, 0], end: [gX1, gY0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [gX0, gY0, 0], end: [gX0, gY0 + gH, 0], color: C.muted, strokeWidth: 2 }),
    T('total choices', P ? 17 : 15, C.muted).moveTo([CX, gY0 - 0.38, 0]),
    T('ln(total)', P ? 17 : 15, C.violet, true).moveTo([gX0 + 0.55, gY0 + gH + 0.22, 0]),
  ];
  for (const n of [1, 4, 10, 20]) {
    lnAxesParts.push(T(String(n), P ? 16 : 14, C.muted, true).moveTo([gx(n), gY0 - 0.18, 0]));
  }
  const lnAxes = new M.VGroup(...lnAxesParts);
  const lnSegs = [];
  for (let n = 1; n < 20; n++) {
    lnSegs.push(new M.Line({ start: [gx(n), gy(Math.log(n)), 0], end: [gx(n + 1), gy(Math.log(n + 1)), 0], color: C.violet, strokeWidth: 4 }));
  }
  const pt4 = new M.Dot({ point: [gx(4), gy(Math.log(4)), 0], radius: 0.10, color: C.amber });
  const pt4Lab = T('ln(4) ≈ 1.39', P ? 17 : 16, C.amber, true).moveTo([gx(4) + 1.15, gy(Math.log(4)) - 0.32, 0]);
  const pt20Lab = T('ln(20) ≈ 3.00', P ? 17 : 15, C.violet, true).moveTo([gx(16), gy(Math.log(20)) + 0.22, 0]);

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(nCard, nTitle, ...nDots), { runTime: 0.45 }),
    new M.FadeIn(lnAxes, { runTime: 0.6 }),
    new M.LaggedStart(lnSegs.map(s => new M.Create(s, { runTime: 0.25 })), { lagRatio: 0.12, runTime: 1.4 }),
    new M.FadeIn(pt4, { runTime: 0.6 }), new M.FadeIn(pt4Lab, { runTime: 0.6 }), new M.FadeIn(pt20Lab, { runTime: 0.6 }),
    ...fbox(['2. natural logarithm', ['   ln(total)', C.violet], ['   ln(4) ≈ 1.39', C.amber]], C.violet),
    ...say('NATURAL LOGARITHM GROWS SLOWLY', C.violet));

  // Beat 43: Calculator [ ln ] button
  const keyX = CX + (P ? 1.55 : 1.75), keyY = gY0 + gH * 0.34;
  const keyBox = new M.RoundedRectangle({ width: 1.35, height: 0.92, cornerRadius: 0.16, color: C.amber, strokeWidth: 3 });
  keyBox.setFill(C.card, 0.98); keyBox.moveTo([keyX, keyY, 0]);
  const keyTxt = T('ln', 28, C.amber, true, true); keyTxt.moveTo([keyX, keyY, 0]);
  const calcKey = new M.VGroup(keyBox, keyTxt);
  await until(S(43));
  await play(new M.FadeIn(calcKey, { runTime: 0.6 }), new M.Indicate(calcKey, { color: C.amber, runTime: 0.9 }),
    ...fbox(['calculator button:', ['   [ ln ]', C.amber], 'ln(4) ≈ 1.39'], C.amber),
    ...say('USE THE [ ln ] BUTTON', C.amber));

  // Beat 44 (short 2.24s): Multiply the result by 2
  const m2Card = new M.RoundedRectangle({ width: P ? 6.2 : 6.4, height: 1.35, cornerRadius: 0.18, color: C.violet, strokeWidth: 2.2 });
  m2Card.setFill(C.card, 0.95); m2Card.moveTo([CX, fy + 0.5, 0]);
  const m2Txt = T('2 × ln(4)  ≈  2 × 1.39  =  2.77', P ? 18 : 21, C.violet, true, true); m2Txt.moveTo([CX, fy + 0.5, 0]);
  const step44 = new M.VGroup(m2Card, m2Txt);
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(lnAxes, ...lnSegs, pt4, pt4Lab, pt20Lab, calcKey), { runTime: 0.45 }),
    new M.FadeIn(step44, { runTime: 0.55 }),
    ...fbox(['3. multiply by 2', ['   2 × ln(total)', C.violet], '   2 × 1.39 = 2.77'], C.violet),
    ...say('MULTIPLY BY 2', C.violet));

  // Beat 45: Divide by number of choices of the prompt we are scoring
  const divCard = new M.RoundedRectangle({ width: P ? 6.2 : 6.4, height: 1.55, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.2 });
  divCard.setFill(C.card, 0.95); divCard.moveTo([CX, fy - 1.15, 0]);
  const divB = T('B (1 choice):  2.77 ÷ 1 = 2.77', P ? 17 : 19, ORANGE, true); divB.moveTo([CX, fy - 0.84, 0]);
  const divA = T('A (3 choices): 2.77 ÷ 3 = 0.92', P ? 17 : 19, C.cyan, true); divA.moveTo([CX, fy - 1.44, 0]);
  const step45 = new M.VGroup(divCard, divB, divA);
  await until(S(45));
  await play(new M.FadeIn(step45, { runTime: 0.7 }),
    ...fbox(['4. divide by prompt choices', ['   2 × ln(total) ÷ choices', C.cyan], '   B: 2.77 ÷ 1 = 2.77'], C.cyan),
    ...say('DIVIDE BY PROMPT CHOICES', C.cyan));

  // Beat 46: Square root
  const rtCard = new M.RoundedRectangle({ width: 6.4, height: 1.95, cornerRadius: 0.2, color: C.green, strokeWidth: 2.4 });
  rtCard.setFill(C.card, 0.96); rtCard.moveTo([CX, fy - 0.2, 0]);
  const rt1 = T('√2.77  ≈  1.67', P ? 24 : 26, C.green, true, true); rt1.moveTo([CX, fy + 0.32, 0]);
  const rt2 = T('because  1.67 × 1.67  ≈  2.77', P ? 16 : 18, C.ink, true); rt2.moveTo([CX, fy - 0.28, 0]);
  const rt3 = T('and for A:  √0.92  ≈  0.96', P ? 16 : 18, C.cyan, true); rt3.moveTo([CX, fy - 0.80, 0]);
  const step46 = new M.VGroup(rtCard, rt1, rt2, rt3);
  await until(S(46));
  await play(new M.FadeOut(new M.VGroup(step44, step45), { runTime: 0.45 }),
    new M.FadeIn(step46, { runTime: 0.8 }),
    ...fbox(['5. take the square root', ['   √(2.77) ≈ 1.67', C.green], '   1.67 × 1.67 ≈ 2.77'], C.green),
    ...say('SQUARE ROOT: √(VALUE)', C.green));

  // Beat 47: Full uncertainty bonus formula
  const fCard = new M.RoundedRectangle({ width: 6.8, height: 2.15, cornerRadius: 0.22, color: C.violet, strokeWidth: 2.6 });
  fCard.setFill(C.card, 0.96); fCard.moveTo([CX, fy - 0.15, 0]);
  const f1 = T('uncertainty bonus =', P ? 18 : 20, C.muted, true); f1.moveTo([CX, fy + 0.48, 0]);
  const f2 = T('√( 2 × ln(total) ÷ choices )', P ? 18 : 21, C.violet, true, true); f2.moveTo([CX, fy - 0.14, 0]);
  const f3 = T('B: 1.67    ·    A: 0.96', P ? 17 : 18, C.amber, true); f3.moveTo([CX, fy - 0.78, 0]);
  const fullForm = new M.VGroup(fCard, f1, f2, f3);
  await until(S(47));
  await play(new M.FadeOut(step46, { runTime: 0.45 }), new M.FadeIn(fullForm, { runTime: 0.8 }),
    ...fbox([['bonus =', C.violet], '√(2 × ln(total) ÷ choices)'], C.violet),
    ...say('UNCERTAINTY BONUS FORMULA', C.violet));

  // ===========================================================================
  // BEATS 48–54: Score formula, behavior, traps, bridge, recap
  // ===========================================================================
  // Bring back the stacked UCB bars cleanly (starting at Step 3: A=0.33+0.96=1.29, B=0.00+1.67=1.67)
  axes = makeAxes();
  barA = solidRect(XA, 1 / 3, C.cyan);
  barB = solidRect(XB, 0.0, ORANGE);
  bonA = bonusRect(XA, 1 / 3, bA3);
  bonB = bonusRect(XB, 0.0, bB3);

  await until(S(48));
  await play(
    new M.FadeOut(fullForm, { runTime: 0.45 }),
    new M.FadeIn(axes, { runTime: 0.7 }),
    new M.FadeIn(barA, { runTime: 0.7 }), new M.FadeIn(barB, { runTime: 0.7 }),
    new M.FadeIn(bonA, { runTime: 0.7 }), new M.FadeIn(bonB, { runTime: 0.7 }),
    ...swap('metaA', T('1/3 · 0.33', P ? 17 : 16, C.cyan, true).moveTo(metaPosA)),
    ...swap('metaB', T('0/1 · 0.00', P ? 17 : 16, ORANGE, true).moveTo(metaPosB)),
    ...swap('bonA', T('+0.96', P ? 18 : 16, C.ink, true).moveTo([XA, BASE + (1 / 3 + bA3 / 2) * UNIT, 0])),
    ...swap('bonB', T('+1.67', P ? 18 : 16, C.ink, true).moveTo([XB, BASE + (bB3 / 2) * UNIT, 0])),
    ...swap('scA', T('1.29', P ? 17 : 18, C.muted, true, true).moveTo([XA, BASE + sA3 * UNIT + 0.24, 0])),
    ...swap('scB', T('1.67', P ? 17 : 18, C.amber, true, true).moveTo([XB, BASE + bB3 * UNIT + 0.24, 0])),
    ...fbox([['score = rate + bonus', C.amber], ['rate', C.cyan], ['+ √(2·ln(N) ÷ n)', C.violet]], C.amber),
    ...say('SCORE = RATE + UNCERTAINTY BONUS', C.amber));

  // Beat 49: More choices shrink bonus, ignoring grows bonus
  const arrDown = T('↓ smaller bonus', P ? 17 : 15, C.cyan, true).moveTo([XA, BASE + 1.55 * UNIT, 0]);
  const arrUp = T('↑ bigger bonus', P ? 17 : 15, ORANGE, true).moveTo([XB, BASE + 2.08 * UNIT, 0]);
  await until(S(49));
  await play(
    new M.Transform(bonA, bonusRect(XA, 1 / 3, 0.72), { runTime: 1.0 }),
    new M.Transform(bonB, bonusRect(XB, 0.0, 1.85), { runTime: 1.0 }),
    ...clearSlots(['bonA', 'bonB', 'scA', 'scB']),
    ...swap('arrA', arrDown), ...swap('arrB', arrUp),
    ...fbox(['More choices:', ['  bonus shrinks ↓', C.cyan], 'Ignored prompt:', ['  bonus grows ↑', ORANGE]], C.violet),
    ...say('MORE CHOICES ↓ BONUS · IGNORED ↑ BONUS', C.violet));

  // Beat 50: Earn rewards while exploring prompts that need testing (settled 15-choice view)
  const stFinal = setChartState(5, 2, 10, 7, true, 0.9);
  await until(S(50));
  await play(...clearSlots(['arrA', 'arrB']), ...stFinal.anims,
    ...fbox(['UCB balance:', ['earn rewards (B)', C.green], ['+ test less-known', C.violet]], C.green),
    ...say('EARN REWARDS + EXPLORE UNTESTED', C.green));

  // Beat 51: Trap 1 — score is not a return rate, can be > 1
  const lineOne = new M.DashedLine({ start: [XAXIS, BASE + 1.0 * UNIT, 0], end: [XEND, BASE + 1.0 * UNIT, 0], color: C.pink });
  const oneTag = pill('RATE MAX = 1.0', C.pink, P ? 16 : 14); oneTag.moveTo([XEND + 0.95, BASE + 1.0 * UNIT, 0]);
  await until(S(51));
  await play(new M.Create(lineOne, { runTime: 0.7 }), ...(P ? [] : [new M.FadeIn(oneTag, { runTime: 0.6 })]),
    ...clearSlots(['bonA', 'bonB']),
    new M.Indicate(slots.scB, { color: C.pink, runTime: 0.8 }),
    ...fbox([['Watch out:', C.pink], 'score can be > 1', 'score ≠ return rate'], C.pink),
    ...say('SCORE IS NOT A RATE (CAN BE > 1)', C.pink));

  // Beat 52: Trap 2 — needs at least 1 result from each prompt first
  const needTag = pill('NEED ≥ 1 RESULT EACH', C.pink, P ? 16 : 15); needTag.moveTo([CX, BASE + 2.15 * UNIT, 0]);
  await until(S(52));
  await play(new M.FadeOut(lineOne, { runTime: 0.45 }), ...(P ? [] : [new M.FadeOut(oneTag, { runTime: 0.45 })]),
    new M.FadeIn(needTag, { runTime: 0.65 }),
    ...fbox([['First step:', C.pink], 'try each prompt once', 'cannot divide by 0'], C.pink),
    ...say('TRY EACH PROMPT ONCE FIRST', C.pink));

  // Beat 53: Next lesson teaser (soft curves hint of plausible rates)
  const pX0 = CX - 2.3, pW = 4.6, pY0 = BASE + 0.35;
  const bellSegs = (mu, sig, col) => {
    const segs = [];
    const NSEG = 26;
    for (let i = 0; i < NSEG; i++) {
      const t1 = i / NSEG, t2 = (i + 1) / NSEG;
      const g1 = Math.exp(-0.5 * Math.pow((t1 - mu) / sig, 2)) * 1.9;
      const g2 = Math.exp(-0.5 * Math.pow((t2 - mu) / sig, 2)) * 1.9;
      segs.push(new M.Line({ start: [pX0 + t1 * pW, pY0 + g1, 0], end: [pX0 + t2 * pW, pY0 + g2, 0], color: col, strokeWidth: 3.5 }));
    }
    return segs;
  };
  const curveASegs = bellSegs(0.45, 0.16, C.cyan);
  const curveBSegs = bellSegs(0.70, 0.12, ORANGE);
  const curveBase = new M.Line({ start: [pX0, pY0, 0], end: [pX0 + pW, pY0, 0], color: C.muted, strokeWidth: 2 });
  const curveLab = new M.VGroup(
    T('possible return rate', P ? 17 : 15, C.muted).moveTo([pX0 + pW / 2, pY0 - 0.55, 0]),
    T('0', P ? 17 : 15, C.muted, true).moveTo([pX0, pY0 - 0.25, 0]),
    T('1', P ? 17 : 15, C.muted, true).moveTo([pX0 + pW, pY0 - 0.25, 0]));
  await until(S(53));
  await play(
    new M.FadeOut(new M.VGroup(axes, barA, barB, bonA, bonB, needTag), { runTime: 0.5 }),
    ...clearSlots(),
    new M.Create(curveBase, { runTime: 0.5 }), new M.FadeIn(curveLab, { runTime: 0.5 }),
    new M.LaggedStart(curveASegs.map(s => new M.Create(s, { runTime: 0.2 })), { lagRatio: 0.08, runTime: 0.85 }),
    new M.LaggedStart(curveBSegs.map(s => new M.Create(s, { runTime: 0.2 })), { lagRatio: 0.08, runTime: 0.85 }),
    ...fbox(['Next lesson:', ['another way to handle', C.cyan], ['uncertainty', C.violet]], C.cyan),
    ...say('NEXT LESSON: ANOTHER WAY TO CHOOSE', C.cyan));

  // Beat 54: Recap
  axes = makeAxes();
  barA = solidRect(XA, 0.40, C.cyan);
  barB = solidRect(XB, 0.70, ORANGE);
  const bAF = Math.sqrt(2 * Math.log(15) / 5);
  const bBF = Math.sqrt(2 * Math.log(15) / 10);
  bonA = bonusRect(XA, 0.40, bAF);
  bonB = bonusRect(XB, 0.70, bBF);
  await until(S(54));
  await play(
    new M.FadeOut(new M.VGroup(curveBase, curveLab, ...curveASegs, ...curveBSegs), { runTime: 0.5 }),
    new M.FadeIn(axes, { runTime: 0.7 }),
    new M.FadeIn(barA, { runTime: 0.7 }), new M.FadeIn(barB, { runTime: 0.7 }),
    new M.FadeIn(bonA, { runTime: 0.7 }), new M.FadeIn(bonB, { runTime: 0.7 }),
    ...swap('metaA', T('2/5 · 0.40', P ? 17 : 16, C.cyan, true).moveTo(metaPosA)),
    ...swap('metaB', T('7/10 · 0.70', P ? 17 : 16, ORANGE, true).moveTo(metaPosB)),
    ...swap('scA', T(fmt2(0.4 + bAF), P ? 17 : 18, C.muted, true, true).moveTo([XA, BASE + (0.4 + bAF) * UNIT + 0.24, 0])),
    ...swap('scB', T(fmt2(0.7 + bBF), P ? 17 : 18, C.muted, true, true).moveTo([XB, BASE + (0.7 + bBF) * UNIT + 0.24, 0])),
    ...fbox([['Remember (UCB):', C.green], 'score = rate + bonus', 'choose good prompts', '+ test the less-known'], C.green),
    ...say('CHOOSE WELL · NEVER IGNORE THE UNTESTED', C.green));
}

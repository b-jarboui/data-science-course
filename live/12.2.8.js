// 12.2.8 Preprocessing pipelines: learn only from the training bikes.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const KM = [1000, 2000, 3000, 3000, 3000, 4000, 4000, 4000];
  const BR = ['Falcon', 'Ridge', 'Swift', 'Falcon', 'Ridge', 'Swift', 'Falcon', 'Ridge'];
  const bcol = b => b === 'Falcon' ? C.cyan : b === 'Ridge' ? C.amber : C.pink;

  const PILL = P ? [0, 3.7, 0] : [0, 2.08, 0];
  const BOXP = P ? [0, -3.55, 0] : [4.55, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---------- bike cards ----------
  const GX = 0, GY = P ? 0.55 : -0.3, DX = P ? 1.88 : 2.15, DY = P ? 2.15 : 2.0;
  const CW = P ? 1.66 : 1.92, CH = 1.55;
  const cardPos = i => [GX + ((i % 4) - 1.5) * DX, GY + (i < 4 ? DY / 2 : -DY / 2), 0];
  function makeCard(i) {
    const pos = cardPos(i), col = bcol(BR[i]);
    const bg = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: col, strokeWidth: 2 });
    bg.setFill(C.card, 0.92); bg.moveTo(pos);
    const idT = T(`#${i + 1}`, P ? 14 : 15, C.muted, true); idT.moveTo([pos[0] - CW / 2 + 0.28, pos[1] + CH / 2 - 0.24, 0]);
    const brT = T(BR[i], P ? 17 : 19, col, true); brT.moveTo([pos[0], pos[1] + 0.12, 0]);
    const kmT = T(`${KM[i].toLocaleString('en-US')} km`, P ? 15 : 17, C.ink, true); kmT.moveTo([pos[0], pos[1] - 0.36, 0]);
    return new M.VGroup(bg, idT, brT, kmT);
  }
  const fw = 3 * DX + CW + 0.34, fh = CH + 0.36;
  function folds() {
    const ra = new M.RoundedRectangle({ width: fw, height: fh, cornerRadius: 0.18, color: C.violet, strokeWidth: 2.5 });
    ra.moveTo([GX, GY + DY / 2, 0]);
    const la = pill('FOLD A', C.violet, P ? 14 : 15); la.moveTo([GX - fw / 2 + 0.65, GY + DY / 2 + fh / 2 + 0.16, 0]);
    const rb = new M.RoundedRectangle({ width: fw, height: fh, cornerRadius: 0.18, color: C.green, strokeWidth: 2.5 });
    rb.moveTo([GX, GY - DY / 2, 0]);
    const lb = pill('FOLD B', C.green, P ? 14 : 15); lb.moveTo([GX - fw / 2 + 0.65, GY - DY / 2 - fh / 2 - 0.18, 0]);
    return { ra, la, rb, lb };
  }
  const roleTag = (s, col, row) => {
    const p = pill(s, col, P ? 14 : 15);
    p.moveTo([GX + fw / 2 - 0.75, row === 0 ? GY + DY / 2 + fh / 2 + 0.16 : GY - DY / 2 - fh / 2 - 0.18, 0]);
    return p;
  };

  // 0: one bike, price unknown
  const qBg = new M.RoundedRectangle({ width: 2.8, height: 2.0, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  qBg.setFill(C.card, 0.95); qBg.moveTo([0, -0.2, 0]);
  const qT1 = T('USED BIKE', 20, C.cyan, true); qT1.moveTo([0, 0.35, 0]);
  const qT2 = T('Price: $ ?', 26, C.amber, true); qT2.moveTo([0, -0.35, 0]);
  const qG = new M.VGroup(qBg, qT1, qT2);
  await until(S(0)); await play(new M.FadeIn(qG), ...say('HOW GOOD IS THE MODEL?'));

  // 1: eight cards
  let cards = KM.map((_, i) => makeCard(i));
  await until(S(1));
  await play(new M.FadeOut(qG), new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.6 }),
    ...say('DO NOT TEST ON THE BIKES IT LEARNS FROM', C.amber));

  // 2-7 folds
  let F = folds();
  await until(S(2)); await play(...say('8 CARDS → 2 GROUPS', C.cyan));
  await until(S(3)); await play(new M.Create(F.ra), new M.FadeIn(F.la), ...say('FOLD A = BIKES 1 TO 4', C.violet));
  await until(S(4)); await play(new M.Create(F.rb), new M.FadeIn(F.lb), ...say('FOLD B = BIKES 5 TO 8', C.green));
  await until(S(5)); await play(...say('A FOLD = ONE PART OF THE DATA', C.muted));
  let tA = roleTag('TEACH', C.violet, 0), tB = roleTag('TEST', C.green, 1);
  await until(S(6)); await play(new M.FadeIn(tA), new M.FadeIn(tB), ...say('A TEACHES · B TESTS', C.violet));
  await until(S(7));
  await play(new M.LaggedStart(cards.slice(4).map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }),
    ...say('PREDICTED PRICE vs REAL PRICE', C.green));

  // 8-15 the recipe / pipeline
  await until(S(8));
  await play(new M.FadeOut(new M.VGroup(...cards, F.ra, F.la, F.rb, F.lb, tA, tB)), ...say('FIRST: PREPARE THE DATA', C.amber));

  const SW = P ? 3.8 : 2.5, SH = P ? 1.0 : 1.2;
  const stepPos = k => P ? [0, 2.4 - k * 1.5, 0] : [-4.65 + k * 3.1, -0.3, 0];
  function stepBox(k, l1, l2, col) {
    const p = stepPos(k);
    const r = new M.RoundedRectangle({ width: SW, height: SH, cornerRadius: 0.14, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    const a = T(l1, P ? 17 : 17, col, true), b = T(l2, P ? 15 : 15, C.ink, true);
    if (P) { a.moveTo([p[0], p[1] + 0.2, 0]); b.moveTo([p[0], p[1] - 0.2, 0]); }
    else { a.moveTo([p[0], p[1] + 0.22, 0]); b.moveTo([p[0], p[1] - 0.22, 0]); }
    return new M.VGroup(r, a, b);
  }
  const steps = [
    stepBox(0, '1 FILL', 'missing numbers', C.cyan),
    stepBox(1, '2 STANDARDIZE', 'mileage', C.amber),
    stepBox(2, '3 ENCODE', P ? 'brand + condition → numbers' : 'brand + grade', C.pink),
  ];
  const model = stepBox(3, 'MODEL', 'predicts price', C.green);
  const arrows = [0, 1, 2].map(k => {
    const a = stepPos(k), b = stepPos(k + 1);
    return P ? new M.Arrow({ start: [0, a[1] - SH / 2 - 0.02, 0], end: [0, b[1] + SH / 2 + 0.02, 0], color: C.muted, buff: 0 })
      : new M.Arrow({ start: [a[0] + SW / 2 + 0.02, a[1], 0], end: [b[0] - SW / 2 - 0.02, b[1], 0], color: C.muted, buff: 0 });
  });
  await until(S(9));
  await play(new M.LaggedStart(steps.map(s => new M.FadeIn(s)), { lagRatio: 0.6, runTime: 3.5 }), ...say('FILL · STANDARDIZE · ENCODE', C.cyan));
  await until(S(10)); await play(...say('THESE STEPS PREPARE THE DATA', C.cyan));
  await until(S(11)); await play(...say('PREPROCESSING', C.green));
  await until(S(12)); await play(new M.LaggedStart(arrows.slice(0, 2).map(a => new M.GrowArrow(a)), { lagRatio: 0.5, runTime: 1.4 }), ...say('A RECIPE: ALWAYS THE SAME ORDER', C.amber));
  await until(S(13)); await play(new M.GrowArrow(arrows[2]), new M.FadeIn(model), ...say('MODEL AT THE END', C.green));
  const PW = P ? SW + 0.6 : 4 * SW + 3 * 0.6 + 0.6, PH = P ? 4 * SH + 3 * 0.5 + 0.6 : SH + 0.6;
  const pc = P ? [0, 2.4 - 1.5 * 1.5, 0] : [0, -0.3, 0];
  const pipeR = new M.RoundedRectangle({ width: PW, height: PH, cornerRadius: 0.22, color: C.violet, strokeWidth: 3 });
  pipeR.moveTo(pc);
  const pipeL = pill('PIPELINE', C.violet, P ? 16 : 17); pipeL.moveTo([pc[0], pc[1] - PH / 2 - 0.32, 0]);
  await until(S(14)); await play(new M.Create(pipeR), new M.FadeIn(pipeL), ...say('PREPROCESSING + MODEL = PIPELINE', C.violet));
  await until(S(15)); await play(new M.Indicate(steps[1].submobjects[1], { color: C.amber }), ...say('RULE: WHAT MAY EACH STEP LEARN?', C.amber));

  // 16-27 number line, the leaky way
  const LY = P ? 0.3 : -1.2, LW = P ? 6.4 : 8.0, X0 = P ? -3.55 : -6.2;
  const n2x = v => X0 + v / 5000 * LW;
  const axis = new M.Line({ start: [X0, LY, 0], end: [X0 + LW, LY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [0, 1000, 2000, 3000, 4000, 5000].map(v => new M.VGroup(
    new M.Line({ start: [n2x(v), LY - 0.07, 0], end: [n2x(v), LY + 0.07, 0], color: C.muted }),
    T(v === 0 ? '0' : `${v / 1000},000`, P ? 14 : 16, C.muted, true).moveTo([n2x(v), LY - 0.35, 0])));
  const unit = T('km', 16, C.muted); unit.moveTo([X0 + LW + 0.4, LY, 0]);
  const stackIdx = KM.map((v, i) => KM.slice(0, i).filter(x => x === v).length);
  const dpos = i => [n2x(KM[i]), LY + 0.38 + stackIdx[i] * 0.45, 0];
  const mkDot = (i, col) => { const d = new M.Circle({ radius: 0.16, color: col, strokeWidth: 2 }); d.setFill(col, 0.85); d.moveTo(dpos(i)); return d; };
  const dots = KM.map((_, i) => mkDot(i, i < 4 ? C.violet : C.green));
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(...steps, ...arrows, model, pipeR, pipeL)), new M.Create(axis), new M.FadeIn(new M.VGroup(...ticks, unit)),
    ...say('MILEAGE OF ALL 8 BIKES', C.cyan));
  await play(new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.15, runTime: 1.6 }));
  await until(S(17)); await play(new M.Flash(dots[0], { color: C.violet }), new M.Flash(dots[7], { color: C.green }), ...say('FROM 1,000 TO 4,000 KM', C.cyan));
  await until(S(18)); await play(...fbox([['standardized =', C.ink], ['(km − mean) ÷ scale', C.amber]], C.amber), ...say('DISTANCE FROM THE MEAN, COMMON SCALE', C.amber));

  const meanLine = (v, col) => new M.DashedLine({ start: [n2x(v), LY - 0.12, 0], end: [n2x(v), LY + 1.6, 0], color: col });
  const meanTag = (s, v, col) => { const p = pill(s, col, P ? 13 : 15); p.moveTo([n2x(v), LY + 1.9, 0]); return p; };
  const scaleBar = (a, b, col) => new M.Line({ start: [n2x(a), LY - 0.72, 0], end: [n2x(b), LY - 0.72, 0], color: col, strokeWidth: 5 });
  const scaleTag = (s, a, b, col) => { const t = T(s, P ? 14 : 15, col, true); t.moveTo([(n2x(a) + n2x(b)) / 2, LY - 1.02, 0]); return t; };

  let mL = meanLine(3000, C.amber), mT = meanTag('MEAN 3,000', 3000, C.amber);
  await until(S(19));
  await play(new M.Create(mL), new M.FadeIn(mT), ...fbox([['all 8 bikes', C.ink], '24,000 ÷ 8', ['mean = 3,000 km', C.amber]], C.amber));
  let sB = scaleBar(3000, 4000, C.pink), sT = scaleTag('scale 1,000', 3000, 4000, C.pink);
  await until(S(20));
  await play(new M.Create(sB), new M.FadeIn(sT), ...fbox([['all 8 bikes', C.ink], 'mean  = 3,000 km', ['scale = 1,000 km', C.pink], ['(standard deviation)', C.muted]], C.pink));

  const tagAt = (s, col) => { const p = pill(s, col, P ? 13 : 15); const d = dpos(5); p.moveTo([d[0] + 0.2 + p.getWidth() / 2, d[1], 0]); return p; };
  let b6 = tagAt('#6', C.green);
  await until(S(21)); await play(new M.FadeIn(b6), new M.Flash(dots[5], { color: C.green }), ...say('BIKE 6 · FOLD B · 4,000 KM', C.green));
  await until(S(22)); await play(...fbox([['bike 6', C.green], ['4,000 − 3,000 = 1,000', C.ink]], C.green));
  let b6v = tagAt('#6 → +1', C.amber);
  await until(S(23)); await play(new M.FadeOut(b6), new M.FadeIn(b6v), ...fbox([['bike 6', C.green], '4,000 − 3,000 = 1,000', ['1,000 ÷ 1,000 = +1', C.amber]], C.green));
  await until(S(24)); await play(new M.Flash(dots[5], { color: C.pink }), ...say('BUT BIKE 6 IS A TEST BIKE!', C.pink));
  await until(S(25)); await play(new M.LaggedStart(dots.slice(4).map(d => new M.Flash(d, { color: C.pink })), { lagRatio: 0.2, runTime: 1.4 }),
    new M.Indicate(mT, { color: C.pink }), ...say('ITS KM HELPED SET MEAN + SCALE', C.pink));
  await until(S(26)); await play(...say('TEST INFO ENTERED TRAINING', C.pink));
  await until(S(27)); await play(...fbox([['DATA LEAKAGE', C.pink], 'test bikes shaped', 'the rules'], C.pink), ...say('DATA LEAKAGE', C.pink));

  // 28-35 the honest way: learn from fold A only
  const grey = KM.map((_, i) => mkDot(i, C.muted)).slice(4);
  const held = pill('FOLD B HELD OUT', C.muted, P ? 13 : 14); held.moveTo([n2x(4000), LY + 1.95 + 0.3, 0]);
  await until(S(28));
  await play(new M.FadeOut(new M.VGroup(mL, mT, sB, sT, b6v, ...dots.slice(4))), ...dropBox(), new M.FadeIn(new M.VGroup(...grey)),
    ...say('START AGAIN: KEEP FOLD B APART', C.green));
  await play(new M.FadeIn(held));
  await until(S(29));
  await play(new M.LaggedStart(dots.slice(0, 4).map(d => new M.Flash(d, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox([['fold A mileage', C.violet], '1,000  2,000', '3,000  3,000'], C.violet));
  await until(S(30)); await play(...fbox([['fold A mileage', C.violet], '1,000 + 2,000', '+ 3,000 + 3,000', ['= 9,000 km', C.amber]], C.violet));
  mL = meanLine(2250, C.amber); mT = meanTag('MEAN 2,250', 2250, C.amber);
  await until(S(31)); await play(new M.Create(mL), new M.FadeIn(mT), ...fbox([['fold A', C.violet], '9,000 ÷ 4', ['mean = 2,250 km', C.amber]], C.violet));
  const segs = [0, 1, 2, 3].map(i => { const p = dpos(i); return new M.Line({ start: [p[0], p[1], 0], end: [n2x(2250), p[1], 0], color: C.violet, strokeWidth: 4 }); });
  await until(S(32));
  await play(new M.LaggedStart(segs.map(s => new M.Create(s)), { lagRatio: 0.3, runTime: 1.6 }),
    ...fbox([['distance from 2,250', C.violet], ['(in thousand km)', C.muted], '−1.25  −0.25', '+0.75  +0.75'], C.violet));
  await until(S(33));
  await play(...fbox([['squared:', C.violet], '1.5625 + 0.0625', '+ 0.5625 + 0.5625', ['= 2.75   ÷ 4 = 0.6875', C.ink], ['√0.6875 ≈ 0.829', C.amber]], C.violet));
  await until(S(34)); await play(...say('SAME STEPS AS THE STANDARD DEVIATION', C.violet));
  sB = scaleBar(2250, 3079, C.pink); sT = scaleTag('scale ≈ 829', 2250, 3079, C.pink);
  await until(S(35)); await play(new M.FadeOut(new M.VGroup(...segs)), new M.Create(sB), new M.FadeIn(sT),
    ...fbox([['fold A', C.violet], 'mean  = 2,250 km', ['scale ≈ 829 km', C.pink]], C.violet));

  // 36-40 save rules, train, test
  await until(S(36)); await play(...fbox([['SAVED IN PIPELINE', C.green], 'mean  = 2,250', 'scale = 829'], C.green), ...say('SAVE MEAN + SCALE', C.green));
  await until(S(37)); await play(...say('EVERY RULE: FROM FOLD A ONLY', C.violet));
  await until(S(38)); await play(new M.LaggedStart(dots.slice(0, 4).map(d => new M.Indicate(d, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }),
    ...say('MODEL LEARNS FROM FOLD A', C.violet));
  await until(S(39)); await play(new M.FadeOut(new M.VGroup(...grey, held)), new M.FadeIn(new M.VGroup(...dots.slice(4))), ...say('NOW TEST ON FOLD B', C.green));
  await until(S(40)); await play(...say('SAVED RULES · LEARN NOTHING NEW', C.green));

  // 41-46 bike 6 again
  b6 = tagAt('#6', C.green);
  await until(S(41)); await play(new M.FadeIn(b6), new M.Flash(dots[5], { color: C.green }), ...say('BIKE 6 AGAIN', C.green));
  await until(S(42)); await play(...fbox([['bike 6', C.green], ['4,000 − 2,250 = 1,750', C.ink]], C.green));
  b6v = tagAt('#6 → 2.1', C.amber);
  await until(S(43)); await play(new M.FadeOut(b6), new M.FadeIn(b6v), ...fbox([['bike 6', C.green], '4,000 − 2,250 = 1,750', ['1,750 ÷ 829 ≈ 2.1', C.amber]], C.green));
  await until(S(44)); await play(...fbox([['bike 6', C.green], ['leaky:   +1', C.pink], ['honest: ≈ 2.1', C.amber]], C.green), ...say('BEFORE: +1', C.pink));
  await until(S(45)); await play(new M.Indicate(b6v, { color: C.amber }), ...say('FAR ABOVE THE TRAINING BIKES', C.amber));
  await until(S(46)); await play(...fbox([['standardized =', C.ink], '(km − training mean)', ['÷ training scale', C.amber]], C.cyan), ...say('THE SAME FORMULA', C.cyan));

  // 47-50 swap roles
  cards = KM.map((_, i) => makeCard(i)); F = folds();
  tA = roleTag('TEST', C.violet, 0); tB = roleTag('TRAIN', C.green, 1);
  await until(S(47));
  await play(new M.FadeOut(new M.VGroup(axis, ...ticks, unit, ...dots, mL, mT, sB, sT, b6v)), ...dropBox(),
    new M.FadeIn(new M.VGroup(...cards)), ...say('SWAP: TRAIN ON B, TEST ON A', C.green));
  await play(new M.Create(F.ra), new M.Create(F.rb), new M.FadeIn(new M.VGroup(F.la, F.lb, tA, tB)));
  await until(S(48));
  await play(new M.LaggedStart(cards.slice(4).map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.2, runTime: 1.4 }),
    ...say('FRESH PIPELINE · RULES FROM FOLD B ONLY', C.green));
  await until(S(49)); await play(new M.LaggedStart(cards.slice(0, 4).map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }),
    ...say('TEST ON FOLD A · RULES UNCHANGED', C.violet));
  await until(S(50)); await play(...say('A FAIRER PICTURE FOR NEW BIKES', C.cyan));

  // 51-52 final pipeline, new bike
  await until(S(51)); await play(new M.FadeOut(new M.VGroup(F.ra, F.rb, F.la, F.lb, tA, tB)), ...say('FINAL PIPELINE: ALL 8 BIKES', C.cyan));
  await play(new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.1, runTime: 1.4 }));
  const nPos = P ? [0, 0.6, 0] : [-2.2, -0.3, 0];
  const nBg = new M.RoundedRectangle({ width: 2.6, height: 1.7, cornerRadius: 0.16, color: C.muted, strokeWidth: 2.5 });
  nBg.setFill(C.card, 0.95); nBg.moveTo(nPos);
  const n1 = T('NEW BIKE', 17, C.muted, true); n1.moveTo([nPos[0], nPos[1] + 0.45, 0]);
  const n2 = T('Comet', 19, C.muted, true); n2.moveTo([nPos[0], nPos[1], 0]);
  const n3 = T('6,000 km', 18, C.ink, true); n3.moveTo([nPos[0], nPos[1] - 0.45, 0]);
  const nG = new M.VGroup(nBg, n1, n2, n3);
  await until(S(52));
  await play(new M.FadeOut(new M.VGroup(...cards)), new M.FadeIn(nG),
    ...fbox([['saved rules (8 bikes)', C.green], '(6,000 − 3,000) ÷ 1,000', ['= +3', C.amber], ['→ model → price', C.cyan]], C.green));

  // 53-54 summary
  await until(S(53)); await play(...say('STEPS IN ORDER · NO LEAKS', C.green));
  await until(S(54));
  await play(new M.FadeOut(nG), ...fbox([['1. split the data first', C.violet], ['2. learn rules on training', C.green], ['3. reuse them for testing', C.amber]], C.cyan),
    ...say('SPLIT · LEARN · REUSE', C.amber));
}

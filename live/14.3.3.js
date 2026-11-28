// 14.3.3 Loadings and scores: what the directions and positions tell us
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const TEA_A = [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3];
  const TEA_G = [7, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7];
  const ATT = ['Fl', 'Ja', 'Ro', 'Bl', 'Ho', 'Fr', 'Rt', 'To', 'Nu', 'Co', 'Ca', 'Sm'];
  const FULL1 = ['Floral', 'Jasmine', 'Rose', 'Blossom', 'Honey', 'Fruit'];
  const FULL2 = ['Roast', 'Toast', 'Nut', 'Cocoa', 'Caramel', 'Smoke'];
  const LOAD = 1 / Math.sqrt(6);

  const CX = P ? 0 : -2.2;
  const PILL = P ? [0, 1.9, 0] : [CX, 1.95, 0];
  const PILL_MID = P ? [0, 1.9, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.3, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan, where = PILL) => showA(s, c, where, P ? 17 : 18);
  const sayMid = (s, c = C.cyan) => showA(s, c, PILL_MID, P ? 17 : 18);

  // Formula box: one on screen at a time
  let boxNow = null;
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.39 : 0.38;
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
    const maxw = P ? FW - 0.9 : 4.3;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  const gCol = k => (k < 6 ? C.cyan : C.amber);

  // ---------------------------------------------------------------------------
  // 0-1: Customer wish & question
  // ---------------------------------------------------------------------------
  const cardW = P ? 3.4 : 4.2, cardH = P ? 3.8 : 3.0;
  const c1p = P ? [-1.85, -1.9, 0] : [-2.6, -0.5, 0];
  const c2p = P ? [1.85, -1.9, 0] : [2.6, -0.5, 0];
  function wishCard(center, title, level, badge, col) {
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo(center);
    const hd = T(title, P ? 18 : 22, col, false, true); hd.moveTo([center[0], center[1] + cardH / 2 - 0.42, 0]);
    const barW = P ? 0.85 : 1.0, maxH = P ? 2.2 : 1.45, h = maxH * level;
    const base = center[1] - cardH / 2 + 0.65;
    const track = new M.Rectangle({ width: barW, height: maxH, color: C.grid, strokeWidth: 1.5 });
    track.setFill(C.bg, 0.8); track.moveTo([center[0], base + maxH / 2, 0]);
    const fill = new M.Rectangle({ width: barW, height: h, color: col, strokeWidth: 1 });
    fill.setFill(col, 0.85); fill.moveTo([center[0], base + h / 2, 0]);
    const tag = T(badge, P ? 16 : 18, col, true, true); tag.moveTo([center[0], base - 0.34, 0]);
    return [r, hd, track, fill, tag];
  }
  const wishObjs = [
    ...wishCard(c1p, 'Flower smells', 0.85, 'STRONG', C.cyan),
    ...wishCard(c2p, 'Roasted taste', 0.25, 'LITTLE', C.amber)
  ];
  await until(S(0));
  await play(new M.LaggedStart(wishObjs.map(o => new M.FadeIn(o)), { lagRatio: 0.06, runTime: 1.2 }), ...sayMid('CUSTOMER WISH', C.cyan));

  const pmC = P ? [0, -1.6, 0] : [0, -0.5, 0];
  const pmW = P ? 2.6 : 3.2, pmH = P ? 2.1 : 1.85;
  const pmAxX = new M.Arrow({ start: [pmC[0] - pmW, pmC[1], 0], end: [pmC[0] + pmW, pmC[1], 0], color: C.cyan, strokeWidth: 3 });
  const pmAxY = new M.Arrow({ start: [pmC[0], pmC[1] - pmH, 0], end: [pmC[0], pmC[1] + pmH, 0], color: C.amber, strokeWidth: 3 });
  const pmLx = T('Flower →', P ? 16 : 18, C.cyan); pmLx.moveTo([pmC[0] + pmW - 0.4, pmC[1] + 0.35, 0]);
  const pmLy = T('Roast ↑', P ? 16 : 18, C.amber); pmLy.moveTo([pmC[0], pmC[1] + pmH + 0.32, 0]);
  const pmSpot = [pmC[0] + pmW * 0.58, pmC[1] - pmH * 0.56, 0];
  const pmRing = new M.Circle({ radius: 0.55, color: C.green, strokeWidth: 3 }); pmRing.setFill(C.green, 0.14); pmRing.moveTo(pmSpot);
  const pmQ = T('?', 34, C.green, true, true); pmQ.moveTo(pmSpot);
  const prevMap = [pmAxX, pmAxY, pmLx, pmLy, pmRing, pmQ];
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...wishObjs), { runTime: 0.4 }), new M.FadeIn(new M.VGroup(...prevMap), { runTime: 0.9 }), ...sayMid('CAN OUR 2D MAP FIND IT?', C.amber));

  // ---------------------------------------------------------------------------
  // 2-8: Original 12 tasting scores for Tea A and Tea G
  // ---------------------------------------------------------------------------
  const p2Sp = P ? 0.5 : 0.44, p2Gap = P ? 0.22 : 0.2, p2Bw = P ? 0.36 : 0.3;
  const p2Unit = P ? 0.18 : 0.26;
  const p2Ax = P ? 0 : -3.45, p2Ay = P ? -0.9 : -1.95;
  const p2Gx = P ? 0 : 3.45, p2Gy = P ? -4.5 : -1.95;

  function p2BarX(cx, k) {
    const span = 11 * p2Sp + p2Gap;
    return cx - span / 2 + k * p2Sp + (k >= 6 ? p2Gap : 0);
  }
  function makeProfileBase(cx, baseY, title) {
    const leftX = p2BarX(cx, 0) - p2Sp * 0.6, rightX = p2BarX(cx, 11) + p2Sp * 0.6;
    const floor = new M.Line({ start: [leftX, baseY, 0], end: [rightX, baseY, 0], color: C.muted, strokeWidth: 2 });
    const mid5 = new M.DashedLine({ start: [leftX, baseY + 5 * p2Unit, 0], end: [rightX, baseY + 5 * p2Unit, 0], color: C.grid });
    const lbl5 = T('5', P ? 15 : 13, C.muted, true); lbl5.moveTo([leftX - 0.22, baseY + 5 * p2Unit, 0]);
    const head = pill(title, C.ink, P ? 15 : 17); head.moveTo([cx, baseY + 10 * p2Unit + (P ? 0.42 : 0.48), 0]);
    const ticks = ATT.map((a, k) => {
      const t = T(String(k + 1), P ? 15 : 12, gCol(k), true);
      t.moveTo([p2BarX(cx, k), baseY - 0.22, 0]);
      return t;
    });
    const g1 = T('Flower (1–6)', P ? 15 : 14, C.cyan); g1.moveTo([(p2BarX(cx, 0) + p2BarX(cx, 5)) / 2, baseY - 0.54, 0]);
    const g2 = T('Roast (7–12)', P ? 15 : 14, C.amber); g2.moveTo([(p2BarX(cx, 6) + p2BarX(cx, 11)) / 2, baseY - 0.54, 0]);
    return [floor, mid5, lbl5, head, ...ticks, g1, g2];
  }
  function makeProfileBars(cx, baseY, vals, start, end) {
    const bars = [], labs = [];
    for (let k = start; k < end; k++) {
      const v = vals[k], h = Math.max(0.05, v * p2Unit), col = gCol(k), x = p2BarX(cx, k);
      const b = new M.Rectangle({ width: p2Bw, height: h, color: col, strokeWidth: 1 });
      b.setFill(col, 0.84); b.moveTo([x, baseY + h / 2, 0]);
      const t = T(String(v), P ? 15 : 14, col, true);
      t.moveTo([x, baseY + h + 0.19, 0]);
      bars.push(b); labs.push(t);
    }
    return { bars, labs };
  }

  const baseA = makeProfileBase(p2Ax, p2Ay, 'TEA A');
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(...prevMap), { runTime: 0.4 }), new M.FadeIn(new M.VGroup(...baseA), { runTime: 0.8 }), ...sayMid('TEA A: 12 TASTING SCORES', C.cyan));

  const profA1 = makeProfileBars(p2Ax, p2Ay, TEA_A, 0, 6);
  await until(S(3));
  await play(
    new M.LaggedStart(profA1.bars.map((b, i) => new M.FadeIn(new M.VGroup(b, profA1.labs[i]))), { lagRatio: 0.14, runTime: 1.5 }),
    ...sayMid('FIRST 6 (FLOWER): 1, 3, 2, 2, 2, 2', C.cyan)
  );

  const profA2 = makeProfileBars(p2Ax, p2Ay, TEA_A, 6, 12);
  await until(S(4));
  await play(
    new M.LaggedStart(profA2.bars.map((b, i) => new M.FadeIn(new M.VGroup(b, profA2.labs[i]))), { lagRatio: 0.1, runTime: 0.9 }),
    ...sayMid('LAST 6 (ROAST): ALL 3', C.amber)
  );

  const baseG = makeProfileBase(p2Gx, p2Gy, 'TEA G');
  await until(S(5));
  await play(new M.FadeIn(new M.VGroup(...baseG), { runTime: 0.8 }), ...sayMid('BESIDE TEA A: TEA G', C.cyan));

  const profG1 = makeProfileBars(p2Gx, p2Gy, TEA_G, 0, 6);
  await until(S(6));
  await play(
    new M.LaggedStart(profG1.bars.map((b, i) => new M.FadeIn(new M.VGroup(b, profG1.labs[i]))), { lagRatio: 0.14, runTime: 1.5 }),
    ...sayMid('TEA G FIRST 6: 7, 9, 8, 8, 8, 8', C.cyan)
  );

  const profG2 = makeProfileBars(p2Gx, p2Gy, TEA_G, 6, 12);
  await until(S(7));
  await play(
    new M.LaggedStart(profG2.bars.map((b, i) => new M.FadeIn(new M.VGroup(b, profG2.labs[i]))), { lagRatio: 0.1, runTime: 0.9 }),
    ...sayMid('TEA G LAST 6: ALL 7', C.amber)
  );

  await until(S(8));
  await play(
    new M.LaggedStart([...profG1.bars, ...profG2.bars].map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.04, runTime: 1.3 }),
    ...sayMid('TEA G IS HIGHER IN BOTH GROUPS', C.green)
  );

  // ---------------------------------------------------------------------------
  // 9-12: Two principal components overview
  // ---------------------------------------------------------------------------
  const pcO = P ? [0, -1.7, 0] : [0, -0.55, 0];
  const pcLenX = P ? 2.8 : 4.2, pcLenY = P ? 2.2 : 1.4;
  const pc1Arr = new M.Arrow({ start: [pcO[0] - pcLenX, pcO[1], 0], end: [pcO[0] + pcLenX, pcO[1], 0], color: C.cyan, strokeWidth: 4 });
  const pc2Arr = new M.Arrow({ start: [pcO[0], pcO[1] - pcLenY, 0], end: [pcO[0], pcO[1] + pcLenY, 0], color: C.amber, strokeWidth: 4 });
  const pcODot = new M.Dot({ point: pcO, radius: 0.09, color: C.ink });
  const pc1Title = T('Direction 1 (PC 1)', P ? 16 : 19, C.cyan, false, true); pc1Title.moveTo([pcO[0] + pcLenX - 0.65, pcO[1] + 0.36, 0]);
  const pc2Title = T('Direction 2 (PC 2)', P ? 16 : 19, C.amber, false, true); pc2Title.moveTo([pcO[0], pcO[1] + pcLenY + (P ? 0.34 : 0.3), 0]);

  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...baseA, ...profA1.bars, ...profA1.labs, ...profA2.bars, ...profA2.labs, ...baseG, ...profG1.bars, ...profG1.labs, ...profG2.bars, ...profG2.labs), { runTime: 0.45 }),
    new M.Create(pc1Arr, { runTime: 0.8 }),
    new M.Create(pc2Arr, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(pcODot, pc1Title, pc2Title), { runTime: 0.8 }),
    ...sayMid('TWO PRINCIPAL COMPONENTS', C.cyan)
  );

  const g1Pills = FULL1.map((name, i) => {
    const p = pill(name, C.cyan, P ? 15 : 14);
    const x = P ? (i % 3 - 1) * 2.1 : (i - 2.5) * 1.95;
    const y = P ? pcO[1] - 2.95 - Math.floor(i / 3) * 0.55 : pcO[1] - 0.58;
    p.moveTo([x, y, 0]);
    return p;
  });
  await until(S(10));
  await play(
    new M.Indicate(pc1Arr, { color: C.cyan }),
    new M.LaggedStart(g1Pills.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 1.1 }),
    ...sayMid('PC 1: FIRST 6 ATTRIBUTES TOGETHER', C.cyan)
  );

  const g2Pills = FULL2.map((name, i) => {
    const p = pill(name, C.amber, P ? 15 : 14);
    const x = P ? (i % 3 - 1) * 2.1 : pcO[0] + (i < 3 ? -2.35 : 2.35);
    const y = P ? pcO[1] + 2.9 + Math.floor(i / 3) * 0.52 : pcO[1] + 0.55 + (i % 3) * 0.52;
    p.moveTo([x, y, 0]);
    return p;
  });
  await until(S(11));
  await play(
    new M.Indicate(pc2Arr, { color: C.amber }),
    new M.LaggedStart(g2Pills.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 1.1 }),
    ...sayMid('PC 2: LAST 6 ATTRIBUTES TOGETHER', C.amber)
  );

  const q1 = pill('? each', C.amber, 15); q1.moveTo([pcO[0] + pcLenX * 0.55, pcO[1] - 0.38, 0]);
  const q2 = pill('? each', C.amber, 15); q2.moveTo([pcO[0] + 0.85, pcO[1] + pcLenY * 0.55, 0]);
  await until(S(12));
  await play(new M.FadeIn(q1), new M.FadeIn(q2), ...sayMid('HOW MUCH DOES EACH CONTRIBUTE?', C.amber));

  // ---------------------------------------------------------------------------
  // 13-24: Twelve small controls = loadings
  // ---------------------------------------------------------------------------
  const slSp = P ? 0.51 : 0.56, slGap = P ? 0.22 : 0.24;
  const slZeroY = P ? -2.3 : -0.65;
  const slHalfH = P ? 1.75 : 1.25;
  const slX = k => CX - (11 * slSp + slGap) / 2 + k * slSp + (k >= 6 ? slGap : 0);
  const slY = v => slZeroY + v * slHalfH;

  const slLeft = slX(0) - 0.42, slRight = slX(11) + 0.42;
  const slZeroLine = new M.Line({ start: [slLeft, slZeroY, 0], end: [slRight, slZeroY, 0], color: C.muted, strokeWidth: 2 });
  const slT0 = T('0', P ? 15 : 14, C.muted, true); slT0.moveTo([slLeft - 0.22, slZeroY, 0]);
  const slTp = T('+1', P ? 15 : 13, C.cyan, true); slTp.moveTo([slLeft - 0.26, slY(1), 0]);
  const slTm = T('−1', P ? 15 : 13, C.pink, true); slTm.moveTo([slLeft - 0.26, slY(-1), 0]);
  const slHead = T('Direction 1 (PC 1) controls', P ? 17 : 18, C.cyan, false, true);
  slHead.moveTo([CX, slZeroY + slHalfH + 0.42, 0]);
  const slTracks = ATT.map((_, k) => new M.Line({ start: [slX(k), slY(-1), -0.01], end: [slX(k), slY(1), -0.01], color: C.grid, strokeWidth: 3 }));
  const slLabs = ATT.map((a, k) => {
    const t = T(a, P ? 15 : 13, gCol(k), true);
    t.moveTo([slX(k), slY(-1) - 0.28, 0]);
    return t;
  });
  const slG1 = T('First 6: Flower', P ? 15 : 15, C.cyan); slG1.moveTo([(slX(0) + slX(5)) / 2, slY(-1) - 0.64, 0]);
  const slG2 = T('Last 6: Roast', P ? 15 : 15, C.amber); slG2.moveTo([(slX(6) + slX(11)) / 2, slY(-1) - 0.64, 0]);
  const ctrlBase = [slZeroLine, slT0, slTp, slTm, slHead, ...slTracks, ...slLabs, slG1, slG2];

  const makeKnob = (k, v, col) => {
    const d = new M.Dot({ point: [slX(k), slY(v), 0.02], radius: P ? 0.13 : 0.12, color: col });
    return d;
  };
  const makeFill = (k, v, col) => {
    const h = Math.max(0.04, Math.abs(v) * slHalfH);
    const y = v >= 0 ? slZeroY + h / 2 : slZeroY - h / 2;
    const r = new M.Rectangle({ width: P ? 0.16 : 0.18, height: h, color: col, strokeWidth: 1 });
    r.setFill(col, 0.85); r.moveTo([slX(k), y, 0.01]);
    return r;
  };
  const knobs = ATT.map((_, k) => makeKnob(k, 0, C.muted));
  const fills = ATT.map((_, k) => makeFill(k, 0, gCol(k)));

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(pc1Arr, pc2Arr, pcODot, pc1Title, pc2Title, ...g1Pills, ...g2Pills, q1, q2), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(...ctrlBase, ...fills, ...knobs), { runTime: 0.9 }),
    ...say('12 CONTROLS: ONE PER ATTRIBUTE', C.cyan)
  );

  await until(S(14));
  await play(
    ...Array.from({ length: 6 }, (_, k) => new M.Transform(knobs[k], makeKnob(k, LOAD, C.cyan))),
    ...Array.from({ length: 6 }, (_, k) => new M.Transform(fills[k], makeFill(k, LOAD, C.cyan))),
    ...say('PC 1: FIRST 6 EQUAL & POSITIVE', C.cyan)
  );

  const zeroTags = Array.from({ length: 6 }, (_, j) => {
    const t = T('0', P ? 15 : 15, C.muted, true);
    t.moveTo([slX(6 + j), slZeroY + 0.34, 0]);
    return t;
  });
  await until(S(15));
  await play(
    new M.LaggedStart(zeroTags.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 0.8 }),
    ...say('LAST 6 SET TO ZERO', C.muted)
  );

  await until(S(16));
  await play(
    new M.LaggedStart(knobs.slice(0, 6).map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.06, runTime: 0.8 }),
    ...say('THESE SETTINGS = LOADINGS', C.green)
  );

  await until(S(17));
  await play(
    ...fbox(['loading =', 'how an attribute', 'contributes to', ['a direction', C.cyan]], C.cyan),
    ...say('LOADINGS DEFINE A DIRECTION', C.cyan)
  );

  const posArr = new M.Arrow({ start: [slX(0), slZeroY + 0.05, 0], end: [slX(0), slY(0.85), 0], color: C.cyan, strokeWidth: 4 });
  const posLbl = T('+', 22, C.cyan, true, true); posLbl.moveTo([slX(0), slY(0.98), 0]);
  await until(S(18));
  await play(
    new M.FadeIn(posArr), new M.FadeIn(posLbl),
    ...fbox([['positive loading (+)', C.cyan], 'points toward', 'higher scores'], C.cyan),
    ...say('POSITIVE → HIGHER SCORES', C.cyan)
  );

  const negArr = new M.Arrow({ start: [slX(0), slZeroY - 0.05, 0], end: [slX(0), slY(-0.85), 0], color: C.pink, strokeWidth: 4 });
  const negLbl = T('−', 22, C.pink, true, true); negLbl.moveTo([slX(0), slY(-0.92), 0]);
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(posArr, posLbl), { runTime: 0.35 }),
    new M.Transform(knobs[0], makeKnob(0, -LOAD, C.pink)),
    new M.Transform(fills[0], makeFill(0, -LOAD, C.pink)),
    new M.FadeIn(negArr), new M.FadeIn(negLbl),
    ...fbox([['negative loading (−)', C.pink], 'points toward', 'lower scores'], C.pink),
    ...say('NEGATIVE → LOWER SCORES', C.pink)
  );

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(negArr, negLbl), { runTime: 0.35 }),
    new M.Transform(knobs[0], makeKnob(0, LOAD, C.cyan)),
    new M.Transform(fills[0], makeFill(0, LOAD, C.cyan)),
    new M.LaggedStart(zeroTags.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.07, runTime: 0.9 }),
    ...fbox([['zero loading (0)', C.muted], 'attribute does not', 'contribute'], C.muted),
    ...say('ZERO → NO CONTRIBUTION', C.muted)
  );

  const uY = slY(-1) - 1.12;
  const uArr1 = new M.Arrow({ start: [CX - 2.3, uY, 0], end: [CX - 0.3, uY, 0], color: C.cyan, strokeWidth: 4 });
  const uLbl1 = T('PC 1: length = 1', P ? 15 : 15, C.cyan, true); uLbl1.moveTo([CX - 1.3, uY + 0.28, 0]);
  await until(S(21));
  await play(
    new M.Create(uArr1), new M.FadeIn(uLbl1),
    ...fbox(['every direction arrow', ['has length = 1', C.amber]], C.amber),
    ...say('EVERY DIRECTION HAS LENGTH 1', C.amber)
  );

  const uArr2 = new M.Arrow({ start: [CX + 0.3, uY, 0], end: [CX + 2.3, uY, 0], color: C.amber, strokeWidth: 4 });
  const uLbl2 = T('PC 2: length = 1', P ? 15 : 15, C.amber, true); uLbl2.moveTo([CX + 1.3, uY + 0.28, 0]);
  await until(S(22));
  await play(
    new M.Create(uArr2), new M.FadeIn(uLbl2),
    ...fbox(['same length (1)', ['= fair comparison', C.green]], C.green),
    ...say('SAME LENGTH = FAIR COMPARISON', C.green)
  );

  const loadValPill = pill('each ≈ 0.4082', C.cyan, P ? 15 : 15);
  loadValPill.moveTo([(slX(0) + slX(5)) / 2, slY(LOAD) + 0.48, 0]);
  await until(S(23));
  await play(
    new M.FadeIn(loadValPill),
    ...fbox(['6 equal loadings:', 'each = 1 / √6', ['≈ 0.4082', C.cyan]], C.cyan),
    ...say('EACH LOADING ≈ 0.4082', C.cyan)
  );

  await until(S(24));
  await play(
    new M.Indicate(slHead, { color: C.violet }),
    ...fbox(['loadings belong to', ['the direction,', C.violet], 'not to one tea'], C.violet),
    ...say('LOADINGS BELONG TO THE DIRECTION', C.violet)
  );

  // ---------------------------------------------------------------------------
  // 25-39: Center Tea A and compute PC 1 component score
  // ---------------------------------------------------------------------------
  const cUnit = P ? 0.45 : 0.3;
  const cY0 = P ? -4.3 : -2.15;
  const cY5 = cY0 + 5 * cUnit;
  const cBw = P ? 0.35 : 0.38;

  const cLeft = slX(0) - 0.36, cRight = slX(11) + 0.36;
  const cFloor = new M.Line({ start: [cLeft, cY0, 0], end: [cRight, cY0, 0], color: C.muted, strokeWidth: 2 });
  const cHead = pill('TEA A', C.cyan, P ? 15 : 16); cHead.moveTo([CX, cY0 + 10 * cUnit + (P ? 0.35 : 0.25), 0]);
  const cAttLabs = ATT.map((a, k) => {
    const t = T(a, P ? 15 : 13, gCol(k), true);
    t.moveTo([slX(k), cY0 - 0.34, 0]);
    return t;
  });
  const cG1 = T('First 6: Flower', P ? 15 : 15, C.cyan); cG1.moveTo([(slX(0) + slX(5)) / 2, cY0 - 0.72, 0]);
  const cG2 = T('Last 6: Roast', P ? 15 : 15, C.amber); cG2.moveTo([(slX(6) + slX(11)) / 2, cY0 - 0.72, 0]);
  const cBase = [cHead, ...cAttLabs, cG1, cG2];

  const makeOrigBar = (k, v) => {
    const h = Math.max(0.05, v * cUnit), col = gCol(k);
    const b = new M.Rectangle({ width: cBw, height: h, color: col, strokeWidth: 1 });
    b.setFill(col, 0.84); b.moveTo([slX(k), cY0 + h / 2, 0]);
    return b;
  };
  const makeCentBar = (k, c) => {
    const h = Math.max(0.05, Math.abs(c) * cUnit), col = gCol(k);
    const y = c >= 0 ? cY5 + h / 2 : cY5 - h / 2;
    const b = new M.Rectangle({ width: cBw, height: h, color: col, strokeWidth: 1 });
    b.setFill(col, 0.84); b.moveTo([slX(k), y, 0]);
    return b;
  };
  const makeValLbl = (k, txt, y, col) => {
    const t = T(txt, P ? 15 : 14, col, true);
    t.moveTo([slX(k), y, 0]);
    return t;
  };

  const cBars = TEA_A.map((v, k) => makeOrigBar(k, v));
  const cVals = TEA_A.map((v, k) => makeValLbl(k, String(v), cY0 + v * cUnit + 0.2, gCol(k)));

  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(...ctrlBase, ...fills, ...knobs, ...zeroTags, uArr1, uLbl1, uArr2, uLbl2, loadValPill), { runTime: 0.45 }),
    ...clearBox(),
    new M.FadeIn(new M.VGroup(cFloor, ...cBase, ...cBars, ...cVals), { runTime: 0.85 }),
    ...say('TEA A ALONG DIRECTION 1', C.cyan)
  );

  const meanLine = new M.DashedLine({ start: [cLeft, cY5, 0], end: [cRight, cY5, 0], color: C.amber });
  const meanLbl = T('mean = 5', P ? 15 : 15, C.amber, true); meanLbl.moveTo([cRight - 0.65, cY5 + 0.24, 0]);
  await until(S(26));
  await play(
    new M.Create(meanLine), new M.FadeIn(meanLbl),
    ...fbox(['step 1: center', ['centered = score − 5', C.amber]], C.amber),
    ...say('SUBTRACT MEAN = 5', C.amber)
  );

  const cValsNew = [];
  function swapVals(indices) {
    const anims = [];
    for (const k of indices) {
      const c = TEA_A[k] - 5;
      const txt = c < 0 ? '−' + Math.abs(c) : String(c);
      const nt = makeValLbl(k, txt, cY5 + c * cUnit - 0.22, gCol(k));
      anims.push(new M.FadeOut(cVals[k]), new M.FadeIn(nt));
      cVals[k] = nt;
      cValsNew.push(nt);
    }
    return anims;
  }

  await until(S(27));
  await play(
    new M.Transform(cBars[0], makeCentBar(0, -4)),
    new M.Transform(cBars[1], makeCentBar(1, -2)),
    ...swapVals([0, 1]),
    ...fbox(['first two centered:', ['1 − 5 = −4', C.cyan], ['3 − 5 = −2', C.cyan]], C.cyan),
    ...say('FIRST TWO: −4 AND −2', C.cyan)
  );

  await until(S(28));
  await play(
    ...[2, 3, 4, 5].map(k => new M.Transform(cBars[k], makeCentBar(k, -3))),
    ...swapVals([2, 3, 4, 5]),
    ...fbox(['next four centered:', ['2 − 5 = −3  (×4)', C.cyan]], C.cyan),
    ...say('NEXT FOUR: ALL −3', C.cyan)
  );

  await until(S(29));
  await play(
    ...[6, 7, 8, 9, 10, 11].map(k => new M.Transform(cBars[k], makeCentBar(k, -2))),
    ...swapVals([6, 7, 8, 9, 10, 11]),
    ...fbox(['last six centered:', ['3 − 5 = −2  (×6)', C.amber]], C.amber),
    ...say('LAST SIX: ALL −2', C.amber)
  );

  const meanLbl0 = T('0 (mean)', P ? 15 : 15, C.amber, true); meanLbl0.moveTo([cRight - 0.65, cY5 + 0.24, 0]);
  const distArr = new M.Arrow({ start: [slX(0) - 0.34, cY5, 0], end: [slX(0) - 0.34, cY5 - 4 * cUnit, 0], color: C.cyan, strokeWidth: 3 });
  await until(S(30));
  await play(
    new M.FadeOut(cFloor),
    new M.FadeOut(meanLbl), new M.FadeIn(meanLbl0),
    new M.Create(distArr),
    ...fbox(['centered score =', ['distance from mean', C.cyan]], C.cyan),
    ...say('HOW FAR FROM THE MEAN', C.cyan)
  );

  const lTag1 = pill('× 0.4082 each', C.cyan, P ? 15 : 14); lTag1.moveTo([(slX(0) + slX(5)) / 2, cY5 + 0.65, 0]);
  const lTag2 = pill('× 0 each', C.muted, P ? 15 : 14); lTag2.moveTo([(slX(6) + slX(11)) / 2, cY5 + 0.65, 0]);
  await until(S(31));
  await play(
    new M.FadeOut(distArr),
    new M.FadeIn(lTag1), new M.FadeIn(lTag2),
    ...fbox(['multiply each', 'centered score', ['by its loading', C.amber]], C.amber),
    ...say('MULTIPLY EACH BY ITS LOADING', C.amber)
  );

  const box1W = slX(5) - slX(0) + cBw + 0.32, box1H = 4.6 * cUnit + 0.45;
  const hiBox1 = new M.RoundedRectangle({ width: box1W, height: box1H, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  hiBox1.moveTo([(slX(0) + slX(5)) / 2, cY5 - 2.2 * cUnit - 0.05, 0]);
  await until(S(32));
  await play(
    new M.Create(hiBox1),
    ...fbox(['first 6 loadings', 'are equal →', ['add scores first', C.cyan]], C.cyan),
    ...say('EQUAL LOADINGS → ADD FIRST 6', C.cyan)
  );

  await until(S(33));
  await play(
    new M.Indicate(cBars[0], { color: C.amber }),
    new M.Indicate(cBars[1], { color: C.amber }),
    ...fbox(['first 6 sum:', ['−4 + (−2) = −6', C.amber]], C.amber),
    ...say('−4 + (−2) = −6', C.amber)
  );

  await until(S(34));
  await play(
    new M.LaggedStart([2, 3, 4, 5].map(k => new M.Indicate(cBars[k], { color: C.amber })), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox(['−6 + 4 × (−3)', ['= −18', C.amber]], C.amber),
    ...say('−6 + 4 × (−3) = −18', C.amber)
  );

  await until(S(35));
  await play(
    new M.Indicate(lTag1, { color: C.cyan }),
    ...fbox(['sum = −18', 'loading ≈ 0.4082', ['−18 × 0.4082', C.cyan]], C.cyan),
    ...say('−18 × 0.4082', C.cyan)
  );

  await until(S(36));
  await play(
    ...fbox(['exact: −18 × (1 / √6)', ['≈ −7.35', C.amber]], C.amber),
    ...say('PC 1 SCORE = −7.35', C.amber)
  );

  await until(S(37));
  await play(
    new M.Indicate(lTag2, { color: C.muted }),
    ...fbox(['last 6 loadings = 0', '6 × (−2) × 0 = 0', ['PC 1 = −7.35', C.amber]], C.muted),
    ...say('LAST 6 × 0 = 0', C.muted)
  );

  await until(S(38));
  await play(
    ...fbox(['Tea A: PC 1', ['component score', C.green], ['= −7.35', C.green]], C.green),
    ...say('COMPONENT SCORE', C.green)
  );

  await until(S(39));
  await play(
    new M.LaggedStart([0, 1, 2, 3, 4, 5].map(k => new M.Indicate(cBars[k], { color: C.pink })), { lagRatio: 0.08, runTime: 1.1 }),
    ...say('BELOW MEAN → NEGATIVE SCORE', C.pink)
  );

  // ---------------------------------------------------------------------------
  // 40-43: Tea A along Direction 2 (PC 2)
  // ---------------------------------------------------------------------------
  const lTag1b = pill('× 0 each', C.muted, P ? 15 : 14); lTag1b.moveTo([(slX(0) + slX(5)) / 2, cY5 + 0.65, 0]);
  const lTag2b = pill('× 0.4082 each', C.amber, P ? 15 : 14); lTag2b.moveTo([(slX(6) + slX(11)) / 2, cY5 + 0.65, 0]);
  const box2W = slX(11) - slX(6) + cBw + 0.32, box2H = 2.9 * cUnit + 0.45;
  const hiBox2 = new M.RoundedRectangle({ width: box2W, height: box2H, cornerRadius: 0.14, color: C.amber, strokeWidth: 2 });
  hiBox2.moveTo([(slX(6) + slX(11)) / 2, cY5 - 1.35 * cUnit - 0.05, 0]);

  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(hiBox1, lTag1, lTag2), { runTime: 0.4 }),
    new M.Create(hiBox2), new M.FadeIn(lTag1b), new M.FadeIn(lTag2b),
    ...fbox(['Direction 2 (PC 2):', 'first 6 = 0', ['last 6 ≈ 0.4082', C.amber]], C.amber),
    ...say('PC 2: ONLY LAST 6 POSITIVE', C.amber)
  );

  await until(S(41));
  await play(
    new M.LaggedStart([6, 7, 8, 9, 10, 11].map(k => new M.Indicate(cBars[k], { color: C.amber })), { lagRatio: 0.08, runTime: 1.0 }),
    ...fbox(['last 6 sum:', ['6 × (−2) = −12', C.amber]], C.amber),
    ...say('6 × (−2) = −12', C.amber)
  );

  await until(S(42));
  await play(
    new M.Indicate(lTag2b, { color: C.amber }),
    ...fbox(['sum = −12', ['−12 × (1 / √6)', C.amber]], C.amber),
    ...say('−12 × EXACT LOADING', C.amber)
  );

  await until(S(43));
  await play(
    ...fbox(['Tea A scores:', ['PC 1 = −7.35', C.cyan], ['PC 2 = −4.90', C.amber]], C.amber),
    ...say('PC 2 SCORE = −4.90', C.amber)
  );

  // ---------------------------------------------------------------------------
  // 44-48: 2D Component-Score Map (Tea A, Tea G, Tea E)
  // ---------------------------------------------------------------------------
  const MX = P ? 0 : -2.15, MY = P ? -1.95 : -0.55;
  const SX = P ? 0.29 : 0.3, SY = P ? 0.34 : 0.24;
  const mapPt = (x, y) => [MX + x * SX, MY + y * SY, 0];

  const mAxX = new M.Arrow({ start: mapPt(-10, 0), end: mapPt(10, 0), color: C.cyan, strokeWidth: 3 });
  const mAxY = new M.Arrow({ start: mapPt(0, -7.5), end: mapPt(0, 7.5), color: C.amber, strokeWidth: 3 });
  const mLx = T('PC 1 (Flower →)', P ? 15 : 16, C.cyan, false, true); mLx.moveTo([MX + (P ? 1.85 : 2.1), MY + 0.34, 0]);
  const mLy = T('PC 2 (Roast ↑)', P ? 15 : 16, C.amber, false, true); mLy.moveTo([MX, MY + (P ? 2.84 : 2.02), 0]);
  const mZero = T('0', P ? 15 : 13, C.muted, true); mZero.moveTo([MX - 0.2, MY - 0.22, 0]);

  function makeTeaPlot(x, y, label, col, dyLbl) {
    const p = mapPt(x, y);
    const gx = new M.DashedLine({ start: mapPt(x, 0), end: p, color: C.grid });
    const gy = new M.DashedLine({ start: mapPt(0, y), end: p, color: C.grid });
    const halo = new M.Dot({ point: p, radius: 0.28, color: col }); halo.setFill(col, 0.2);
    const dot = new M.Dot({ point: p, radius: 0.13, color: col });
    const lx = P ? (x < 0 ? -1.85 : 1.85) : p[0];
    const lbl = T(label, P ? 15 : 15, col, true, true); lbl.moveTo([lx, p[1] + dyLbl, 0]);
    return { gx, gy, halo, dot, lbl, p };
  }

  const plotA = makeTeaPlot(-7.35, -4.9, 'A (−7.35, −4.90)', C.cyan, P ? -0.58 : -0.48);
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(...cBase, ...cBars, ...cVals, meanLine, meanLbl0, hiBox2, lTag1b, lTag2b), { runTime: 0.45 }),
    new M.Create(mAxX, { runTime: 0.7 }),
    new M.Create(mAxY, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(mLx, mLy, mZero, plotA.gx, plotA.gy, plotA.halo, plotA.dot, plotA.lbl), { runTime: 0.9 }),
    new M.Flash(plotA.dot, { color: C.cyan }),
    ...say('TEA A ON THE MAP', C.cyan)
  );

  await until(S(45));
  await play(
    ...fbox(['Tea G (above mean):', ['PC 1: +18/√6 = +7.35', C.cyan], ['PC 2: +12/√6 = +4.90', C.amber]], C.amber),
    ...say('TEA G: ABOVE MEAN IN BOTH', C.amber)
  );

  const plotG = makeTeaPlot(7.35, 4.9, 'G (+7.35, +4.90)', C.amber, P ? 0.56 : 0.46);
  await until(S(46));
  await play(
    new M.FadeIn(new M.VGroup(plotG.gx, plotG.gy, plotG.halo, plotG.dot, plotG.lbl)),
    new M.Flash(plotG.dot, { color: C.amber }),
    ...say('TEA G: (+7.35, +4.90)', C.amber)
  );

  const plotE = makeTeaPlot(7.35, -4.9, 'E (+7.35, −4.90)', C.green, P ? -0.58 : -0.48);
  await until(S(47));
  await play(
    new M.FadeIn(new M.VGroup(plotE.gx, plotE.gy, plotE.halo, plotE.dot, plotE.lbl)),
    new M.Flash(plotE.dot, { color: C.green }),
    ...fbox(['Tea E:', ['PC 1 = +7.35 (flower)', C.cyan], ['PC 2 = −4.90 (roast)', C.amber]], C.green),
    ...say('TEA E: (+7.35, −4.90)', C.green)
  );

  const matchRing = new M.Circle({ radius: 0.42, color: C.green, strokeWidth: 3 });
  matchRing.moveTo(plotE.p);
  const matchTag = pill('CUSTOMER MATCH', C.green, P ? 15 : 14);
  matchTag.moveTo([P ? 1.85 : plotE.p[0], plotE.p[1] + (P ? 0.7 : 0.62), 0]);
  await until(S(48));
  await play(
    new M.Create(matchRing), new M.FadeIn(matchTag),
    new M.Indicate(plotE.dot, { color: C.green }),
    ...say('TEA E MATCHES THE CUSTOMER!', C.green)
  );

  // ---------------------------------------------------------------------------
  // 49-54: Formula, what each is for, trap, recap
  // ---------------------------------------------------------------------------
  await until(S(49));
  await play(
    ...fbox(['one short formula', ['for any tea & direction', C.cyan]], C.cyan),
    ...say('ONE SHORT FORMULA', C.cyan)
  );

  await until(S(50));
  await play(
    ...fbox(['component score =', ['sum of (centered score', C.cyan], ['        × loading)', C.amber]], C.cyan),
    ...say('SCORE = SUM (CENTERED × LOADING)', C.cyan)
  );

  await until(S(51));
  await play(
    new M.Indicate(mAxX, { color: C.cyan }),
    new M.Indicate(mAxY, { color: C.amber }),
    ...say('LOADINGS → WHAT A DIRECTION MEANS', C.cyan)
  );

  await until(S(52));
  await play(
    new M.LaggedStart([plotA.dot, plotG.dot, plotE.dot].map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.18, runTime: 1.4 }),
    ...say('SCORES → WHERE EACH TEA SITS', C.amber)
  );

  await until(S(53));
  await play(
    new M.Indicate(plotE.dot, { color: C.pink }),
    ...fbox([['negative score', C.pink], '= below the mean', ['NOT bad (little roast)', C.green]], C.pink),
    ...say('NEGATIVE = BELOW MEAN, NOT BAD', C.pink)
  );

  await until(S(54));
  await play(
    new M.Indicate(mAxX, { color: C.cyan }),
    new M.Indicate(plotE.dot, { color: C.amber }),
    ...fbox([['loadings → directions', C.cyan], ['scores   → tea positions', C.amber]], C.green),
    ...say('LOADINGS: DIRECTIONS · SCORES: TEAS', C.green)
  );
}

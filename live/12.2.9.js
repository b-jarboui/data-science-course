// 12.2.9 Feature selection: lucky coin columns.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const PR = [700, 400, 300, 500, 200, 200, 600, 300];
  const BR = ['Falcon', 'Ridge', 'Swift', 'Falcon', 'Ridge', 'Swift', 'Falcon', 'Ridge'];
  const bcol = b => b === 'Falcon' ? C.cyan : b === 'Ridge' ? C.amber : C.pink;

  const PILL = P ? [0, 3.7, 0] : [0, 2.08, 0];
  const BOXP = P ? [0, -3.55, 0] : [4.6, -0.4, 0];
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
    const maxw = P ? FW - 0.8 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---------- cards ----------
  const GX = P ? 0 : -1.75, GY = P ? 0.55 : -0.73, DX = P ? 1.88 : 1.95, DY = P ? 2.15 : 2.0;
  const CW = P ? 1.66 : 1.75, CH = 1.55;
  const cardPos = i => [GX + ((i % 4) - 1.5) * DX, GY + (i < 4 ? DY / 2 : -DY / 2), 0];
  function makeCard(i) {
    const pos = cardPos(i), col = bcol(BR[i]);
    const bg = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: col, strokeWidth: 2 });
    bg.setFill(C.card, 0.92); bg.moveTo(pos);
    const idT = T(`#${i + 1}`, 15, C.muted, true); idT.moveTo([pos[0] - CW / 2 + 0.28, pos[1] + CH / 2 - 0.24, 0]);
    const brT = T(BR[i], P ? 16 : 17, col, true); brT.moveTo([pos[0], pos[1] + 0.05, 0]);
    const prT = T(`$${PR[i]}`, P ? 18 : 19, C.ink, true); prT.moveTo([pos[0], pos[1] - 0.38, 0]);
    return new M.VGroup(bg, idT, brT, prT);
  }
  function yn(i, yes) {
    const pos = cardPos(i);
    const p = pill(yes ? 'YES' : 'NO', yes ? C.green : C.muted, 15);
    p.moveTo([pos[0] + CW / 2 - 0.48, pos[1] + CH / 2 - 0.24, 0]);
    return p;
  }
  function tagBelow(i, s, col) {
    const pos = cardPos(i);
    const p = pill(s, col, 15);
    p.moveTo([pos[0], pos[1] - CH / 2, 0]);
    return p;
  }
  const fw = 3 * DX + CW + 0.34, fh = CH + 0.36;
  function folds() {
    const ra = new M.RoundedRectangle({ width: fw, height: fh, cornerRadius: 0.18, color: C.violet, strokeWidth: 2.5 });
    ra.moveTo([GX, GY + DY / 2, 0]);
    const la = pill('FOLD A', C.violet, 15); la.moveTo([GX - fw / 2 + 0.65, GY + DY / 2 + fh / 2 + 0.16, 0]);
    const rb = new M.RoundedRectangle({ width: fw, height: fh, cornerRadius: 0.18, color: C.green, strokeWidth: 2.5 });
    rb.moveTo([GX, GY - DY / 2, 0]);
    const lb = pill('FOLD B', C.green, 15); lb.moveTo([GX - fw / 2 + 0.65, GY - DY / 2 - fh / 2 - 0.18, 0]);
    return { ra, la, rb, lb };
  }
  const roleTag = (s, col, row) => {
    const p = pill(s, col, 15);
    p.moveTo([GX + fw / 2 - 0.75, row === 0 ? GY + DY / 2 + fh / 2 + 0.16 : GY - DY / 2 - fh / 2 - 0.18, 0]);
    return p;
  };

  // 0-2 question
  const qBg = new M.RoundedRectangle({ width: 3.0, height: 2.0, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  qBg.setFill(C.card, 0.95); qBg.moveTo([0, -0.2, 0]);
  const qT1 = T('USED BIKE', 20, C.cyan, true); qT1.moveTo([0, 0.35, 0]);
  const qT2 = T('Price: $ ?', 26, C.amber, true); qT2.moveTo([0, -0.35, 0]);
  const qG = new M.VGroup(qBg, qT1, qT2);
  await until(S(0)); await play(new M.FadeIn(qG), ...say('PREDICT A USED-BIKE PRICE'));
  await until(S(1)); await play(...say('AGE · MILEAGE · BRAND · CONDITION', C.cyan));
  await until(S(2)); await play(new M.Indicate(qT2, { color: C.amber }), ...say('SELLER IN A BLUE SHIRT: USEFUL?', C.amber));

  // 3 cards
  let cards = PR.map((_, i) => makeCard(i));
  await until(S(3));
  await play(new M.FadeOut(qG), new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.6 }), ...say('8 SOLD BIKES + PRICES'));

  // 4-9 twenty coin columns
  // In this example, column 1 is the first column with the lowest fold A miss.
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const COL1 = [1, 0, 0, 1, 1, 0, 1, 0], COL2 = [1, 1, 0, 0, 0, 1, 1, 0];
  const grid = Array.from({ length: 20 }, (_, c) => Array.from({ length: 8 }, (_, r) => c === 0 ? COL1[r] : c === 1 ? COL2[r] : (rnd() < 0.5 ? 1 : 0)));
  const CS = P ? 0.33 : 0.4, GCX = P ? 0.25 : -1.2, GCY = P ? 0.6 : -0.35;
  const cellP = (c, r) => [GCX + (c - 9.5) * CS, GCY + (3.5 - r) * CS, 0];
  const cells = [];
  grid.forEach((col, c) => col.forEach((v, r) => {
    const q = new M.Square({ sideLength: CS * 0.8, color: v ? C.green : C.muted, strokeWidth: 1 });
    q.setFill(v ? C.green : C.muted, v ? 0.8 : 0.25); q.moveTo(cellP(c, r)); cells.push(q);
  }));
  const rowLab = Array.from({ length: 8 }, (_, r) => { const t = T(`#${r + 1}`, 15, C.muted, true); t.moveTo([cellP(0, r)[0] - CS * 1.1, cellP(0, r)[1], 0]); return t; });
  const gridTitle = T('20 coin columns', P ? 15 : 17, C.amber, true); gridTitle.moveTo([GCX, cellP(0, 0)[1] + CS * 1.1, 0]);
  await until(S(4));
  await play(new M.FadeOut(new M.VGroup(...cards)), new M.FadeIn(new M.VGroup(...rowLab, gridTitle)),
    new M.LaggedStart(cells.map(q => new M.FadeIn(q)), { lagRatio: 0.006, runTime: 2.0 }), ...say('+ 20 EXTRA COLUMNS', C.amber));
  const colBox = new M.Rectangle({ width: CS * 1.05, height: CS * 8.3, color: C.amber, strokeWidth: 3 });
  colBox.moveTo([cellP(0, 0)[0], GCY, 0]);
  const legY = new M.Square({ sideLength: 0.26, color: C.green }); legY.setFill(C.green, 0.8);
  const legN = new M.Square({ sideLength: 0.26, color: C.muted }); legN.setFill(C.muted, 0.25);
  const LGY = cellP(0, 7)[1] - CS * 1.3;
  legY.moveTo([GCX - 1.4, LGY, 0]); legN.moveTo([GCX + 0.4, LGY, 0]);
  const legYT = T('yes', 15, C.green, true); legYT.moveTo([GCX - 0.95, LGY, 0]);
  const legNT = T('no', 15, C.muted, true); legNT.moveTo([GCX + 0.8, LGY, 0]);
  await until(S(5)); await play(new M.Create(colBox), new M.FadeIn(new M.VGroup(legY, legN, legYT, legNT)), ...say('EACH BIKE: YES OR NO', C.green));
  const coinP = P ? [0, -2.9, 0] : [4.6, -0.35, 0];
  const coin = new M.Circle({ radius: 0.6, color: C.amber, strokeWidth: 4 }); coin.setFill(C.amber, 0.25); coin.moveTo(coinP);
  const coinY = T('YES', 20, C.green, true); coinY.moveTo(coinP);
  const coinN = T('NO', 20, C.muted, true); coinN.moveTo(coinP);
  await until(S(6)); await play(new M.FadeIn(coin), new M.FadeIn(coinY), ...say('ANSWER = A COIN TOSS', C.amber));
  await until(S(7)); await play(new M.FadeOut(coinY), new M.FadeIn(coinN), ...say('ONE SIDE YES · OTHER SIDE NO', C.amber));
  await until(S(7) + 1.6); await play(new M.FadeOut(coinN), new M.FadeIn(coinY));
  await until(S(8)); await play(...say('NOTHING TO DO WITH PRICES', C.muted));
  await until(S(9)); await play(new M.Indicate(colBox, { color: C.amber }), ...say('USEFUL JUST BY CHANCE?', C.amber));

  // 10-12 folds
  cards = PR.map((_, i) => makeCard(i));
  let F = folds();
  await until(S(10));
  await play(new M.FadeOut(new M.VGroup(...cells, ...rowLab, gridTitle, colBox, legY, legN, legYT, legNT, coin, coinY)),
    new M.FadeIn(new M.VGroup(...cards)), ...say('TWO GROUPS AGAIN', C.cyan));
  await until(S(11)); await play(new M.Create(F.ra), new M.Create(F.rb), new M.FadeIn(new M.VGroup(F.la, F.lb)), ...say('FOLD A: 1–4 · FOLD B: 5–8', C.violet));
  let tA = roleTag('LEARN', C.violet, 0), tB = roleTag('TEST', C.green, 1);
  await until(S(12)); await play(new M.FadeIn(tA), new M.FadeIn(tB), ...say('LEARN ON A · TEST ON B', C.violet));

  // 13-25 coin column 1 on fold A
  let b1 = [0, 1, 2, 3].map(i => yn(i, COL1[i]));
  await until(S(13)); await play(...b1.map(b => new M.FadeIn(b, { runTime: 0.18 })), ...say('COIN COLUMN 1', C.amber));
  await until(S(14)); await play(new M.Indicate(cards[0].submobjects[3], { color: C.green }), new M.Indicate(cards[3].submobjects[3], { color: C.green }),
    ...fbox([['YES group', C.green], '$700, $500'], C.green));
  await until(S(15)); await play(...fbox([['YES group', C.green], '700 + 500 = 1,200', '1,200 ÷ 2'], C.green));
  await until(S(16)); await play(...fbox([['YES group', C.green], '700 + 500 = 1,200', ['1,200 ÷ 2 = $600', C.amber]], C.green));
  await until(S(17)); await play(new M.Indicate(cards[1].submobjects[3], { color: C.muted }), new M.Indicate(cards[2].submobjects[3], { color: C.muted }),
    ...fbox([['YES → $600', C.green], ['NO group', C.muted], '400 + 300 = 700'], C.cyan));
  await until(S(18)); await play(...fbox([['YES → $600', C.green], ['NO group', C.muted], '400 + 300 = 700', ['700 ÷ 2 = $350', C.amber]], C.cyan));
  await until(S(19)); await play(...fbox([['model rule', C.ink], ['YES → $600', C.green], ['NO  → $350', C.muted]], C.cyan), ...say('YES → $600 · NO → $350', C.cyan));
  await until(S(20)); await play(...say('PREDICTED vs REAL (TRAINING BIKES)', C.amber));
  let miss = [];
  const addMiss = (i, v) => { const p = tagBelow(i, `miss ${v}`, C.pink); miss.push(p); return new M.FadeIn(p); };
  await until(S(21)); await play(addMiss(0, 100), ...fbox([['bike 1', C.ink], 'real 700 · predict 600', ['miss = 100', C.pink]], C.pink));
  await until(S(22)); await play(addMiss(3, 100), ...fbox([['bike 4', C.ink], 'real 500 · predict 600', ['miss = 100', C.pink]], C.pink));
  await until(S(23)); await play(addMiss(1, 50), addMiss(2, 50), ...fbox([['bikes 2, 3', C.ink], 'real 400, 300', 'predict 350', ['miss = 50 each', C.pink]], C.pink));
  await until(S(24)); await play(...fbox([['4 misses', C.pink], ['100 + 100 + 50 + 50', C.ink], ['= 300', C.amber]], C.pink));
  await until(S(25)); await play(...fbox([['column 1', C.amber], '300 ÷ 4', ['average miss = $75', C.amber]], C.amber), ...say('AVERAGE MISS: $75', C.amber));

  // 26-31 coin column 2
  let b2 = [0, 1, 2, 3].map(i => yn(i, COL2[i]));
  await until(S(26)); await play(new M.FadeOut(new M.VGroup(...b1, ...miss)), ...b2.map(b => new M.FadeIn(b)), ...say('COIN COLUMN 2', C.amber));
  miss = [];
  await until(S(27)); await play(new M.Indicate(cards[0].submobjects[3], { color: C.green }), new M.Indicate(cards[1].submobjects[3], { color: C.green }),
    ...fbox([['YES group', C.green], '(700 + 400) ÷ 2', ['= $550', C.amber]], C.green));
  await until(S(28)); await play(new M.Indicate(cards[2].submobjects[3], { color: C.muted }), new M.Indicate(cards[3].submobjects[3], { color: C.muted }),
    ...fbox([['YES → $550', C.green], ['NO group', C.muted], '(300 + 500) ÷ 2', ['= $400', C.amber]], C.cyan));
  await until(S(29)); await play(addMiss(0, 150), addMiss(1, 150), addMiss(2, 100), addMiss(3, 100),
    ...fbox([['4 misses', C.pink], '150 + 150 + 100 + 100', ['= 500', C.amber]], C.pink));
  await until(S(30)); await play(...fbox([['column 2', C.amber], '500 ÷ 4', ['average miss = $125', C.amber]], C.amber), ...say('AVERAGE MISS: $125', C.amber));
  await until(S(31)); await play(...fbox([['training fit', C.ink], ['column 1: $75  ✓', C.green], ['column 2: $125', C.muted]], C.green), ...say('COLUMN 1 FITS BETTER', C.green));
  await until(S(32)); await play(...say('CHECK ALL 20 · KEEP THE BEST', C.cyan));
  await until(S(33)); await play(...say('FEATURE SELECTION', C.green));
  await until(S(34)); await play(...say('ALL 20 = COIN TOSSES', C.amber));
  await until(S(35)); await play(...say('GOOD FIT ≠ USEFUL · MAYBE LUCK', C.amber));

  // 36-38 test column 1 on fold B
  b1 = [0, 1, 2, 3, 4, 5, 6, 7].map(i => yn(i, COL1[i]));
  await until(S(36));
  await play(new M.FadeOut(new M.VGroup(...b2, ...miss)), ...dropBox(), ...b1.map(b => new M.FadeIn(b)), ...say('TEST COLUMN 1 ON FOLD B', C.green));
  const preds = [4, 5, 6, 7].map(i => tagBelow(i, `predict ${COL1[i] ? 600 : 350}`, C.amber));
  await until(S(37)); await play(...preds.map(p => new M.FadeIn(p)), ...fbox([['rule from fold A', C.violet], ['YES → $600', C.green], ['NO  → $350', C.muted]], C.violet));
  const testMisses = [4, 5, 6, 7].map(i => tagBelow(i, `miss ${Math.abs(PR[i] - (COL1[i] ? 600 : 350))}`, C.pink));
  await until(S(38)); await play(...preds.map(p => new M.FadeOut(p)),
    ...testMisses.map(p => new M.FadeIn(p)),
    ...fbox([['score =', C.ink], 'total of misses', ['÷ number of test bikes', C.amber]], C.green), ...say('SCORE = AVERAGE MISS ON TEST BIKES', C.green));

  // 39-40 swap
  const tA2 = roleTag('TEST', C.violet, 0), tB2 = roleTag('LEARN', C.green, 1);
  await until(S(39)); await play(new M.FadeOut(new M.VGroup(tA, tB, ...b1, ...testMisses)), new M.FadeIn(tA2), new M.FadeIn(tB2), ...dropBox(),
    ...say('SWAP: CHOOSE AGAIN USING FOLD B ONLY', C.green));
  tA = tA2; tB = tB2;
  await until(S(40)); await play(new M.LaggedStart(cards.slice(0, 4).map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }),
    ...say('LEARN MEANS ON B · TEST ON A', C.violet));

  // 41-45 baseline that ignores coins
  await until(S(41)); await play(...say('COMPARE: IGNORE ALL 20 COIN COLUMNS', C.cyan));
  miss = [];
  const mB = [275, 275, 125, 175], mA = [375, 75, 25, 175];
  await until(S(42)); await play(new M.FadeOut(new M.VGroup(tA, tB)), ...fbox([['train on A', C.violet], '1,900 ÷ 4', ['always $475', C.amber]], C.violet),
    ...[4, 5, 6, 7].map((i, k) => addMiss(i, mB[k])));
  await until(S(43)); await play(...fbox([['train on B', C.green], '1,300 ÷ 4', ['always $325', C.amber]], C.green),
    ...[0, 1, 2, 3].map((i, k) => addMiss(i, mA[k])));
  await until(S(44)); await play(...fbox([['8 misses', C.pink], '375 + 75 + 25 + 175', '+ 275 + 275 + 125 + 175', ['= 1,500', C.amber]], C.pink));
  await until(S(45)); await play(...fbox([['ignore coins', C.cyan], '1,500 ÷ 8 = 187.5', ['≈ $190 average miss', C.amber]], C.cyan), ...say('NO COINS: ABOUT $190', C.cyan));

  // 46-47 the leak
  await until(S(46)); await play(new M.FadeOut(new M.VGroup(...miss)), ...dropBox(),
    new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.pink })), { lagRatio: 0.1, runTime: 1.6 }), ...say('CHOOSE WITH ALL 8 BIKES FIRST?', C.pink));
  await until(S(47)); await play(new M.LaggedStart(cards.slice(4).map(c => new M.Indicate(c, { color: C.pink })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox([['the CHOICE', C.pink], 'already saw', 'the test bikes'], C.pink), ...say('DATA LEAKAGE IN THE CHOICE', C.pink));

  // 48-52 2,000 repeats: bar chart
  const BY = P ? -2.0 : -2.3, HS = P ? 4.4 : 3.5, BW = P ? 1.5 : 1.5;
  const BXs = P ? [-2.4, 0, 2.4] : [-5.0, -2.6, -0.2];
  const barH = v => v / 240 * HS;
  const base = new M.Line({ start: [BXs[0] - 1.1, BY, 0], end: [BXs[2] + 1.1, BY, 0], color: C.muted, strokeWidth: 3 });
  function bar(k, v, col, l1, l2, val) {
    const r = new M.Rectangle({ width: BW, height: barH(v), color: col, strokeWidth: 2 });
    r.setFill(col, 0.7); r.moveTo([BXs[k], BY + barH(v) / 2, 0]);
    const vt = T(val, P ? 17 : 18, col, true); vt.moveTo([BXs[k], BY + barH(v) + 0.28, 0]);
    const a = T(l1, 15, C.ink, true); a.moveTo([BXs[k], BY - 0.3, 0]);
    const b = T(l2, 15, C.muted, true); b.moveTo([BXs[k], BY - 0.62, 0]);
    return new M.VGroup(r, vt, a, b);
  }
  const bar0 = bar(0, 190, C.cyan, 'no coins', 'baseline', '≈ $190');
  const bar1 = bar(1, 140, C.pink, 'choose on', 'all 8 bikes', '≈ $140');
  const bar2 = bar(2, 240, C.green, 'choose on', 'training only', '≈ $240');
  const ref = new M.DashedLine({ start: [BXs[0] - 1.0, BY + barH(190), 0], end: [BXs[2] + 1.0, BY + barH(190), 0], color: C.cyan });
  const yT = T('average miss', 15, C.muted, true); yT.moveTo([BXs[0] - 0.2, BY + HS + 0.15, 0]);
  if (P) BOXP[1] = -4.3;
  await until(S(48));
  await play(new M.FadeOut(new M.VGroup(...cards, F.ra, F.rb, F.la, F.lb)), ...dropBox(), new M.Create(base), new M.FadeIn(yT), new M.FadeIn(bar0),
    ...fbox([['2,000 repeats', C.amber], ['fresh coins each time', C.muted]], C.amber), ...say('REPEAT 2,000 TIMES', C.amber));
  await play(new M.Create(ref));
  await until(S(49)); await play(new M.FadeIn(bar1), ...say('CHOOSE ON ALL 8: ≈ $140', C.pink));
  await until(S(50)); await play(new M.Indicate(bar1, { color: C.pink }), ...fbox([['looks better…', C.pink], ['but it is LEAKAGE', C.pink]], C.pink), ...say('A MISLEADING TEST', C.pink));
  await until(S(51)); await play(new M.FadeIn(bar2), ...say('CHOOSE ON TRAINING ONLY: ≈ $240', C.green));
  await until(S(52)); await play(new M.Indicate(ref, { color: C.cyan }), ...fbox([['$240 > $190', C.green], ['worse than no coins', C.ink], ['= the truth', C.green]], C.green), ...say('WORSE THAN IGNORING THE COINS', C.green));

  // 53-54 takeaway
  await until(S(53)); await play(...say('ONLY SEPARATE TEST BIKES TELL THE TRUTH', C.amber));
  await until(S(54)); await play(...fbox([['choose features:', C.violet], ['  training bikes', C.ink], ['test them:', C.green], ['  separate bikes', C.ink]], C.cyan),
    ...say('CHOOSE ON TRAINING · TEST ON SEPARATE BIKES', C.green));
}

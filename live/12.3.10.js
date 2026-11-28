// 12.3.10 Regularization: can a worse fit be better? (live version of script.v7.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers from chapters/12.3.md.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const AGE = [1, 2, 3, 4, 5, 6], MIL = [2, 4, 6, 8, 10, 12], STK = [2, 4, 3, 1, 0, 5], PRICE = [10, 6, 8, 7, 3, 5];
  // rule A = the usual (unpenalized) fit, rule B = the line 10 − age (chapters/12.3.md, review/qa/math_scratch/12.3_rework.py)
  const WA = [-3, 1, 0.3], WB = [-1, -1, 0];
  // rule A on the old bikes: guesses 8.9 8.2 7.1 5.8 4.6 4.4, misses +1.1 −2.2 +0.9 +1.2 −1.6 +0.6 (≈ 11.2 ÷ 6 ≈ 1.9)
  const GA = [8.9, 8.2, 7.1, 5.8, 4.6, 4.4], GB = [9, 8, 7, 6, 5, 4];
  const MA = ['+1.1', '−2.2', '+0.9', '+1.2', '−1.6', '+0.6'], SA = ['1.2', '4.8', '0.8', '1.4', '2.6', '0.4'];
  const PILL = P ? [0, 2.3, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.0, -1.85, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const sg = v => { v = +v.toFixed(2); return v > 0 ? '+' + v : v < 0 ? '−' + -v : '0'; };
  const sq = w => +(w * w).toFixed(2);
  // table: 8 columns, a header row and rows 0-5 (row 6 holds one extra bike)
  const tx = k => P ? -3.29 + k * 0.94 : -6.45 + k * 0.92;
  const HY = P ? 1.6 : 1.2, ty = r => (P ? 1.1 : 0.65) - r * (P ? 0.48 : 0.55);
  const HS = P ? 15 : 14, VS = P ? 17 : 19;
  // dials on the right (laptop) or at the bottom (phone); LC = centre of the free picture area
  const DX = P ? [-2.3, 0, 2.3] : [2.3, 4.0, 5.7], DY = P ? -3.1 : 0.55, R = 0.48;
  const LC = P ? [0, 0.2, 0] : [-3.3, -0.6, 0];

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // a bike drawn from lines and two wheels
  function bike(cx, cy, k, color) {
    const p = (x, y) => [cx + x * k, cy + y * k, 0];
    const seg = (a, b) => new M.Line({ start: p(...a), end: p(...b), color, strokeWidth: 3 });
    const wheel = x => { const c = new M.Circle({ radius: 0.42 * k, color, strokeWidth: 3 }); c.moveTo(p(x, 0)); return c; };
    return new M.VGroup(wheel(-0.8), wheel(0.8), seg([-0.8, 0], [-0.1, 0]), seg([-0.1, 0], [0.45, 0.6]), seg([0.45, 0.6], [-0.35, 0.6]),
      seg([-0.35, 0.6], [-0.8, 0]), seg([-0.35, 0.6], [-0.1, 0]), seg([0.45, 0.6], [0.8, 0]), seg([0.45, 0.6], [0.4, 0.85]),
      seg([0.28, 0.85], [0.58, 0.85]), seg([-0.55, 0.72], [-0.2, 0.72]));
  }

  // 0-2 the shop and the question
  const shop = bike(0, P ? -0.6 : -0.9, 1.5, C.cyan);
  await until(S(0)); await play(new M.FadeIn(shop, { shift: [0, 0.2, 0] }), ...say('THE USED-BIKE SHOP'));
  const ZC = P ? [[0, 0.5], [0, -2.7]] : [[-3.2, -0.5], [3.2, -0.5]];
  function zone(z, title, color, mk) {
    const [cx, cy] = ZC[z];
    const r = new M.RoundedRectangle({ width: P ? 5.6 : 4.8, height: 2.6, cornerRadius: 0.16, color, strokeWidth: 2 }); r.moveTo([cx, cy, 0]);
    const t = T(title, VS, color, true, true); t.moveTo([cx, cy + 0.85, 0]);
    return [r, t, ...Array.from({ length: 6 }, (_, i) => mk([cx + (i % 3 - 1) * 1.2, cy + 0.05 - Math.floor(i / 3) * 0.75, 0]))];
  }
  const zoneOld = zone(0, 'LAST MONTH', C.cyan, p => new M.Dot({ point: p, radius: 0.14, color: C.cyan }));
  const zoneNew = zone(1, 'NEXT MONTH', C.amber, p => T('?', VS + 6, C.amber, true, true).moveTo(p));
  await until(S(1)); await play(new M.FadeOut(shop), new M.FadeIn(new M.VGroup(...zoneOld)), new M.FadeIn(new M.VGroup(...zoneNew)), ...say('A PRICE RULE FOR NEXT MONTH’S BIKES'));
  await until(S(2)); await play(new M.LaggedStart(zoneNew.slice(2).map(q => new M.Indicate(q, { color: C.amber })), { lagRatio: 0.15, runTime: 1.6 }),
    ...say('FIT OLD BIKES A LITTLE WORSE, YET BETTER?', C.amber));

  // 3-8 the six bikes and their inputs
  const cell = (s, k, r, color = C.ink) => { const t = T(String(s), r < 0 ? HS : VS, r < 0 ? C.muted : color, true, r < 0); t.moveTo([tx(k), r < 0 ? HY : ty(r), 0]); return t; };
  const column = (k, head, vs, color) => [cell(head, k, -1), ...vs.map((v, r) => cell(v, k, r, color))];
  const rule = new M.Line({ start: [tx(0) - 0.45, HY - 0.27, 0], end: [tx(7) + 0.45, HY - 0.27, 0], color: C.line, strokeWidth: 2 });
  const bikeCol = column(0, 'BIKE', [1, 2, 3, 4, 5, 6], C.cyan);
  await until(S(3)); await play(new M.FadeOut(new M.VGroup(...zoneOld, ...zoneNew)), new M.Create(rule),
    new M.LaggedStart(bikeCol.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.2 }), ...say('SIX OLD BIKES'));
  const ageCol = column(1, 'AGE', AGE), milCol = column(2, 'MILES', MIL), stkCol = column(3, 'STICK.', STK);
  await until(S(4)); await play(new M.LaggedStart([ageCol, milCol, stkCol].map(c => new M.FadeIn(new M.VGroup(...c))), { lagRatio: 0.5, runTime: 2.4 }),
    ...say('3 INPUTS: AGE · MILEAGE · STICKERS'));
  await until(S(5)); await play(new M.LaggedStart([ageCol[0], milCol[0], stkCol[0]].map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('INPUT = KNOWN BEFORE WE PRICE THE BIKE'));
  await until(S(6)); await play(new M.LaggedStart(milCol.slice(1).map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.6 }),
    ...say('MILEAGE = HOW FAR RIDDEN (1,000 KM)'));
  await until(S(7)); await play(new M.LaggedStart(AGE.flatMap((_, r) => [ageCol[r + 1], milCol[r + 1]]).map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.12, runTime: 2.6 }),
    ...say('AGE ↑  MILEAGE ↑  BOTH MEASURE WEAR', C.amber));
  await until(S(8)); await play(new M.LaggedStart(stkCol.slice(1).map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.12, runTime: 1.6 }),
    ...say('STICKERS: NOTHING TO DO WITH PRICE', C.pink));

  // 9-14 one weight per input: three dials
  const ang = w => Math.PI / 2 - w * Math.PI / 6;
  const tip = (k, w, r = R * 0.7) => [DX[k] + r * Math.cos(ang(w)), DY + r * Math.sin(ang(w)), 0];
  const hand = (k, w) => new M.Line({ start: [DX[k], DY, 0], end: tip(k, w), color: C.amber, strokeWidth: 4 });
  const faces = [], hands = [], hubs = [], names = [];
  ['AGE', 'MILEAGE', 'STICKERS'].forEach((n, k) => {
    const f = new M.Circle({ radius: R, color: C.muted, strokeWidth: 2 }); f.setFill(C.card, 0.95); f.moveTo([DX[k], DY, 0]);
    const t = T(n, HS + 2, C.muted, true); t.moveTo([DX[k], DY - R - 0.3, 0]);
    faces.push(f); hands.push(hand(k, 0)); hubs.push(new M.Dot({ point: [DX[k], DY, 0], radius: 0.06, color: C.amber })); names.push(t);
  });
  let wNow = [0, 0, 0];
  const vals = [null, null, null];
  function turn(ws, o = {}) {
    const a = [];
    ws.forEach((w, k) => {
      if (w === wNow[k] && vals[k]) return;
      if (w !== wNow[k]) a.push(new M.Transform(hands[k], hand(k, w), o));
      if (vals[k]) a.push(new M.FadeOut(vals[k], o));
      vals[k] = T(sg(w), VS, C.amber, true, true); vals[k].moveTo([DX[k], DY + R + 0.27, 0]);
      a.push(new M.FadeIn(vals[k], o));
    });
    wNow = ws.slice();
    return a;
  }
  await until(S(9)); await play(new M.LaggedStart(faces.map((f, k) => new M.FadeIn(new M.VGroup(f, hands[k], hubs[k], names[k]))), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('ONE WEIGHT FOR EACH INPUT'));
  await until(S(10)); await play(new M.LaggedStart(hands.map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.25, runTime: 1.4 }),
    ...say('WEIGHT = HOW STRONGLY IT MOVES THE PRICE', C.amber));
  const signs = DX.flatMap(x => [T('−', VS + 4, C.pink, true, true).moveTo([x - R - 0.2, DY, 0]), T('+', VS + 4, C.green, true, true).moveTo([x + R + 0.2, DY, 0])]);
  await until(S(11)); await play(new M.FadeIn(new M.VGroup(...signs)), ...say('−  PULLS PRICE DOWN     +  PUSHES IT UP'));
  await until(S(12)); await play(new M.LaggedStart(faces.map(f => new M.Indicate(f, { color: C.violet })), { lagRatio: 0.25, runTime: 1.6 }),
    ...say('THREE DIALS ON A MIXING DESK', C.violet));
  const ticks = DX.flatMap((_, k) => [-3, -2, -1, 0, 1, 2, 3].map(w => new M.Line({ start: tip(k, w, R - 0.1), end: tip(k, w, R), color: C.muted, strokeWidth: 2 })));
  await until(S(13)); await play(new M.FadeIn(new M.VGroup(...ticks)), ...say('RESCALED: ONE STEP = SAME ON EVERY DIAL'));
  await until(S(14)); await play(...turn(WA), ...say('RULE A:  −3   +1   +0.3'));

  // 15-19 rule A: guess, miss, squared miss, training error
  const priceCol = column(4, 'PRICE', PRICE, C.cyan);
  const guessA = column(5, 'GUESS', GA, C.amber), missA = column(6, 'MISS', MA, C.pink);
  const sqA = column(7, 'MISS²', SA, C.violet);
  await until(S(15)); await play(new M.FadeIn(new M.VGroup(...priceCol)), new M.LaggedStart(guessA.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.4 }),
    ...say('GUESS VS REAL PRICE (IN $100s)', C.amber));
  await until(S(15) + 2.6); await play(new M.LaggedStart(missA.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.4 }), ...say('MISS = REAL PRICE − GUESS', C.pink));
  await until(S(16)); await play(new M.LaggedStart(missA.slice(1).map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.15, runTime: 1.6 }));
  await until(S(17)); await play(new M.LaggedStart(sqA.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.4 }), ...say('SQUARE: MISS × MISS', C.violet));
  await until(S(17) + 2.9); await play(...fbox(['add the 6 squared misses:', '1.2 + 4.8 + 0.8', '+ 1.4 + 2.6 + 0.4'], C.violet));
  await until(S(18)); await play(...fbox(['sum ≈ 11.2', ['11.2 ÷ 6 ≈ 1.9', C.amber]], C.amber), ...say('TRAINING ERROR = AVERAGE SQUARED MISS', C.amber));
  await until(S(19)); await play(...fbox(['rule A', ['training error ≈ 1.9', C.amber]], C.amber), ...say('RULE A: 1.9', C.amber));

  // 20-21 rule B
  const guessB = column(5, 'GUESS', GB, C.amber), missB = column(6, 'MISS', PRICE.map((p, i) => sg(p - GB[i])), C.pink);
  const sqB = column(7, 'MISS²', PRICE.map((p, i) => (p - GB[i]) ** 2), C.violet);
  await until(S(20)); await play(...turn(WB), new M.FadeOut(new M.VGroup(...guessA, ...missA, ...sqA)), new M.FadeIn(new M.VGroup(...guessB, ...missB, ...sqB)),
    ...say('RULE B:  −1   −1   0'));
  await until(S(21)); await play(...fbox(['rule A: 1.9', 'rule B: (1+4+1+1+4+1) ÷ 6', ['        = 12 ÷ 6 = 2', C.amber]], C.amber), ...say('2 AGAINST 1.9: A LITTLE WORSE', C.amber));

  // 22-26 rule A's dials: hard, jumpy, overfitting
  await until(S(22)); await play(...turn(WA), new M.FadeOut(new M.VGroup(...guessB, ...missB, ...sqB)), ...unbox(), ...say('PICK RULE A? LOOK AT ITS DIALS', C.amber));
  await until(S(23)); await play(new M.LaggedStart([faces[0], faces[1]].map(f => new M.Indicate(f, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('RULE A TURNS ITS DIALS HARD', C.amber));
  await until(S(23) + 2.4); await play(new M.Indicate(faces[2], { color: C.pink }), new M.Flash(hubs[2], { color: C.pink }), ...say('IT EVEN LISTENS TO STICKERS', C.pink));
  const odd = [cell('new', 0, 6, C.cyan), cell(2, 1, 6), cell(4, 2, 6), cell(30, 3, 6, C.pink)];
  const wild = T('price way off!', VS, C.pink, true, true); wild.moveTo([tx(5), ty(6), 0]);
  await until(S(24)); await play(new M.LaggedStart([...odd, wild].map(t => new M.FadeIn(t)), { lagRatio: 0.25, runTime: 1.8 }), ...say('ONE ODD INPUT → A WILDLY WRONG PRICE', C.pink));
  await play(new M.Flash(odd[3], { color: C.pink, flashRadius: 0.4 }), new M.Indicate(wild, { color: C.pink }));
  await until(S(25)); await play(new M.FadeOut(new M.VGroup(...odd, wild)), new M.LaggedStart(stkCol.slice(1).map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.12, runTime: 1.6 }),
    ...say('IT LEARNS LUCK, NOT THE PATTERN', C.pink));
  await until(S(26)); await play(...fbox(['overfitting:', 'fits old data so closely', ['that new data goes wrong', C.pink]], C.pink), ...say('OVERFITTING', C.pink));

  // 27-35 the fee: size, penalty weight, total
  await until(S(27)); await play(new M.FadeOut(new M.VGroup(rule, ...bikeCol, ...ageCol, ...milCol, ...stkCol, ...priceCol)), ...unbox(),
    ...say('IDEA: A FEE FOR TURNING DIALS HARD', C.green));
  await play(new M.LaggedStart(faces.map(f => new M.Indicate(f, { color: C.green })), { lagRatio: 0.25, runTime: 1.4 }));
  await until(S(28)); await play(...fbox(['size = (age weight)²', '     + (mileage weight)²', '     + (sticker weight)²'], C.violet), ...say('SQUARE EACH WEIGHT, THEN ADD', C.violet));
  await until(S(29)); await play(...say('MINUS × MINUS = PLUS:  (−3) × (−3) = 9', C.violet));
  const SQ = P ? 0.6 : 0.7, SQX = P ? [-1.7, 1.7] : [-4.9, -2.2], SQB = P ? -0.9 : -1.7;
  const squares = [1, 2].map((n, q) => {
    const parts = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const b = new M.Rectangle({ width: SQ, height: SQ, color: C.violet, strokeWidth: 2 }); b.setFill(C.violet, 0.35);
      b.moveTo([SQX[q] + (i - (n - 1) / 2) * SQ, SQB + (j + 0.5) * SQ, 0]); parts.push(b);
    }
    const t = T(`${n}² = ${n * n}`, VS, C.violet, true, true); t.moveTo([SQX[q], SQB - 0.3, 0]);
    return new M.VGroup(...parts, t);
  });
  await until(S(30)); await play(new M.LaggedStart(squares.map(g => new M.FadeIn(g)), { lagRatio: 0.5, runTime: 1.6 }), ...say('BIG WEIGHTS COUNT MUCH MORE', C.violet));
  await until(S(31)); await play(new M.FadeOut(new M.VGroup(...squares)), ...fbox(['size of the weights', ['= sum of squared weights', C.violet]], C.violet),
    ...say('THE SIZE OF THE WEIGHTS', C.violet));
  await until(S(32)); await play(...fbox(['penalty = penalty weight × size'], C.amber), ...say('PENALTY WEIGHT: CHOSEN IN ADVANCE', C.amber));
  await until(S(33)); await play(...fbox(['penalty weight = 0.5', ['penalty = 0.5 × size', C.violet]], C.amber), ...say('TODAY: PENALTY WEIGHT = ONE HALF', C.amber));
  await until(S(34)); await play(...fbox(['total = training error', '      + penalty', ['lowest total wins', C.green]], C.green), ...say('LOWEST TOTAL WINS', C.green));
  await until(S(35)); await play(...fbox(['regularization =', 'training error', ['+ penalty for big weights', C.violet]], C.green), ...say('REGULARIZATION', C.green));

  // 36-40 rule A worked out
  const sqLines = ws => ws.map(w => `${w < 0 ? `(${sg(w)})` : w}² = ${sq(w)}`);
  const sqStep = k => [...fbox(sqLines(wNow).slice(0, k + 1), C.violet), new M.Indicate(vals[k], { color: C.violet })];
  const BX = P ? [-1.7, 1.7] : [-4.9, -2.2], BB = P ? -1.3 : -2.45, BU = P ? 0.4 : 0.42, BW = P ? 1.3 : 1.4;
  function bar(q, parts, top, color, name) {
    const out = [];
    let y = 0;
    for (const [v, c, label] of parts) {
      const r = new M.Rectangle({ width: BW, height: v * BU, color: c, strokeWidth: 1.5 }); r.setFill(c, 0.78); r.moveTo([BX[q], BB + (y + v / 2) * BU, 0]);
      out.push(r);
      if (label) { const t = T(label, P ? 16 : 15, C.bg, true, true); t.moveTo([BX[q], BB + (y + v / 2) * BU, 0]); out.push(t); }
      y += v;
    }
    const tt = T(top, VS + 2, color, true, true); tt.moveTo([BX[q], BB + y * BU + 0.27, 0]);
    const nt = T(name, HS + 2, C.ink, true); nt.moveTo([BX[q], BB - 0.28, 0]);
    return [...out, tt, nt];
  }
  const LGX = P ? 0 : -0.55;
  const legend = [T('training error', HS + 1, C.cyan, true).moveTo([LGX, BB + 0.45, 0]), T('penalty', HS + 1, C.violet, true).moveTo([LGX, BB + 1.05, 0])];
  const floorA = new M.Line({ start: [BX[0] - BW, BB, 0], end: [BX[1] + BW, BB, 0], color: C.muted, strokeWidth: 2 });
  await until(S(36)); await play(...unbox(), new M.LaggedStart(vals.map(v => new M.Indicate(v, { color: C.cyan })), { lagRatio: 0.25, runTime: 1.4 }),
    ...say('RULE A:  −3   +1   +0.3'));
  await until(S(37)); await play(...sqStep(0));
  await until(S(37) + 1.9); await play(...sqStep(1));
  await until(S(37) + 3.8); await play(...sqStep(2));
  await until(S(38)); await play(...fbox(['9 + 1 + 0.09', ['size ≈ 10', C.violet]], C.violet), ...say('RULE A SIZE ≈ 10', C.violet));
  await until(S(39)); await play(...fbox(['size ≈ 10', ['penalty ≈ 0.5 × 10 = 5', C.violet]], C.violet), ...say('PENALTY = HALF OF 10 = 5', C.violet));
  const barA = bar(0, [[1.9, C.cyan, '1.9'], [5, C.violet, '5']], '≈ 7', C.amber, 'RULE A');
  await until(S(40)); await play(...fbox(['training error ≈ 1.9', 'penalty        ≈ 5', ['total ≈ 1.9 + 5 ≈ 7', C.amber]], C.amber),
    new M.Create(floorA), new M.FadeIn(new M.VGroup(...barA, ...legend)), ...say('RULE A TOTAL ≈ 7', C.amber));

  // 41-46 rule B worked out
  await until(S(41)); await play(...turn(WB), ...say('NOW RULE B'));
  await until(S(42)); await play(...sqStep(0));
  await until(S(42) + 1.9); await play(...sqStep(1));
  await until(S(42) + 3.8); await play(...sqStep(2));
  await until(S(43)); await play(...fbox(['1 + 1 + 0', ['size = 2', C.violet]], C.violet), ...say('RULE B SIZE = 2', C.violet));
  await until(S(44)); await play(...fbox(['size = 2', ['penalty = 0.5 × 2 = 1', C.violet]], C.violet), ...say('PENALTY = HALF OF 2 = 1', C.violet));
  const barB = bar(1, [[2, C.cyan, '2'], [1, C.violet, '1']], '3', C.amber, 'RULE B');
  await until(S(45)); await play(...fbox(['training error = 2', 'penalty        = 1', ['total = 2 + 1 = 3', C.amber]], C.amber),
    new M.FadeIn(new M.VGroup(...barB)), ...say('RULE B TOTAL = 3', C.amber));
  await until(S(46)); await play(new M.Indicate(barB[barB.length - 2], { color: C.green }), new M.Flash(barB[barB.length - 2], { color: C.green, flashRadius: 0.4 }),
    ...say('RULE B WINS: 3 AGAINST 7', C.green));

  // 47-49 the real test on next month's bikes
  const newBikes = Array.from({ length: 6 }, (_, i) => bike(LC[0] + (i - 2.5) * (P ? 1.0 : 0.95), LC[1], 0.3, C.amber));
  await until(S(47)); await play(new M.FadeOut(new M.VGroup(...barA, ...barB, ...legend, floorA)), ...unbox(),
    new M.LaggedStart(newBikes.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.4 }), ...say('THE REAL TEST: 6 NEW BIKES', C.amber));
  const floorT = new M.Line({ start: [BX[0] - BW, BB, 0], end: [BX[1] + BW, BB, 0], color: C.muted, strokeWidth: 2 });
  const testA = bar(0, [[4, C.pink]], '4', C.pink, 'RULE A'), testB = bar(1, [[2.5, C.pink]], '2.5', C.pink, 'RULE B');
  await until(S(48)); await play(new M.FadeOut(new M.VGroup(...newBikes)), new M.Create(floorT), new M.FadeIn(new M.VGroup(...testA)), ...say('ERROR ON NEXT MONTH’S BIKES', C.pink));
  await until(S(48) + 2.3); await play(new M.FadeIn(new M.VGroup(...testB)));
  await until(S(49)); await play(new M.Indicate(testB[testB.length - 2], { color: C.green }), ...say('WORSE ON OLD BIKES, BETTER ON NEW ONES', C.green));

  // 50-51 in practice: training turns the dials step by step
  await until(S(50)); await play(new M.FadeOut(new M.VGroup(...testA, ...testB, floorT)), ...say('IN PRACTICE: NO READY-MADE RULES', C.muted));
  const stepW = n => WA.map((a, k) => a + (WB[k] - a) * n / 4);
  const CTP = [LC[0], LC[1] + (P ? 1.3 : 1.2), 0];
  let counter = T('step 0', VS + 4, C.ink, true, true); counter.moveTo(CTP);
  // the total after each training step (from WA to WB): 7.0, 5.2, 4.0, 3.2, 3.0
  const TOT = [7.0, 5.2, 4.0, 3.2, 3.0];
  const LX0 = LC[0] - (P ? 2.4 : 2.2), LW = P ? 4.8 : 4.4, LY0 = LC[1] - (P ? 1.4 : 1.5), LH = P ? 2.0 : 1.9;
  const lpx = n => LX0 + n / 4 * LW, lpy = v => LY0 + v / 7 * LH;
  const lAxes = new M.VGroup(new M.Line({ start: [LX0, LY0, 0], end: [LX0 + LW + 0.2, LY0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [LX0, LY0, 0], end: [LX0, LY0 + LH + 0.2, 0], color: C.muted, strokeWidth: 2 }),
    T('training step', HS + 2, C.muted, true).moveTo([LX0 + LW / 2, LY0 - 0.32, 0]),
    T('total', HS + 2, C.amber, true).moveTo([LX0 - 0.1, LY0 + LH + 0.42, 0]));
  const lDot = n => new M.Dot({ point: [lpx(n), lpy(TOT[n]), 0], radius: 0.08, color: C.amber });
  const lLab = n => T(TOT[n].toFixed(1), HS + 2, C.amber, true).moveTo([lpx(n), lpy(TOT[n]) + 0.3, 0]);
  const lossParts = [lDot(0), lLab(0)];
  await until(S(51)); await play(...turn(WA, { runTime: 0.5 }), new M.FadeIn(counter, { runTime: 0.5 }), new M.FadeIn(lAxes), new M.FadeIn(new M.VGroup(...lossParts)),
    ...say('TRAINING: STEP BY STEP, TOTAL GOING DOWN', C.green));
  for (let n = 1; n <= 4; n++) {
    const next = T(`step ${n}`, VS + 4, C.ink, true, true); next.moveTo(CTP);
    const seg = new M.Line({ start: [lpx(n - 1), lpy(TOT[n - 1]), 0], end: [lpx(n), lpy(TOT[n]), 0], color: C.amber, strokeWidth: 3 });
    const pts = [seg, lDot(n), lLab(n)]; lossParts.push(...pts);
    await play(...turn(stepW(n), { runTime: 0.8 }), new M.FadeOut(counter, { runTime: 0.4 }), new M.FadeIn(next, { runTime: 0.4 }), new M.FadeIn(new M.VGroup(...pts), { runTime: 0.6 }));
    counter = next;
  }

  // 52-54 the formula
  await until(S(52)); await play(new M.FadeOut(new M.VGroup(counter, lAxes, ...lossParts)), ...fbox(['total = training error', '      + penalty weight × size']), ...say('THE SHORT VERSION'));
  await until(S(53)); await play(...fbox(['total = training error', '      + penalty weight', ['        × sum of squared weights', C.violet]]));
  await until(S(54)); await play(...fbox(['total = training error', ['      + λ × sum of squared weights', C.amber], ['λ = “lambda” = penalty weight', C.amber]]),
    ...say('λ = LAMBDA, LIKE AN UPSIDE-DOWN y', C.amber));

  // 55-58 what it is for
  await until(S(55)); await play(...unbox(), ...say('WHAT IS IT FOR?', C.green));
  await until(S(56)); await play(new M.LaggedStart(names.map((t, k) => new M.Indicate(t, { color: k < 2 ? C.amber : C.pink })), { lagRatio: 0.3, runTime: 1.6 }),
    ...say('MANY INPUTS: USELESS OR OVERLAPPING', C.amber));
  await until(S(57)); await play(new M.LaggedStart(hands.map(l => new M.Indicate(l, { color: C.green })), { lagRatio: 0.25, runTime: 1.4 }),
    ...say('SMALL, CALM WEIGHTS → BETTER ON NEW BIKES', C.green));
  await until(S(58)); await play(new M.Indicate(faces[2], { color: C.violet }), new M.Flash(hubs[2], { color: C.violet }), ...say('STICKERS: DIAL AT 0 IN RULE B', C.violet));
  await until(S(58) + 3.6); await play(...say('PUSHED TOWARD ZERO, RARELY EXACTLY ZERO', C.violet));

  // 59-63 the trap: choosing the penalty weight
  const SL = P ? { y: 0.2, x0: -3, x1: 3 } : { y: -1.0, x0: -6.2, x1: -0.6 };
  const kx = t => SL.x0 + t * (SL.x1 - SL.x0);
  const track = new M.Line({ start: [SL.x0, SL.y, 0], end: [SL.x1, SL.y, 0], color: C.muted, strokeWidth: 4 });
  const slTitle = T('penalty weight λ', VS, C.amber, true, true); slTitle.moveTo([(SL.x0 + SL.x1) / 2, SL.y + 0.6, 0]);
  const ends = [T('small', HS + 2, C.muted, true).moveTo([SL.x0 + 0.4, SL.y - 0.4, 0]), T('big', HS + 2, C.muted, true).moveTo([SL.x1 - 0.3, SL.y - 0.4, 0])];
  const knobAt = t => { const c = new M.Circle({ radius: 0.17, color: C.amber, strokeWidth: 2 }); c.setFill(C.amber, 0.9); c.moveTo([kx(t), SL.y, 0]); return c; };
  const knob = knobAt(0.5);
  await until(S(59)); await play(new M.FadeIn(new M.VGroup(track, slTitle, ...ends)), new M.FadeIn(knob), ...say('THE TRAP: CHOOSING λ', C.pink));
  await until(S(60)); await play(new M.Transform(knob, knobAt(0.05)), ...turn(WA), ...say('TOO SMALL: STILL OVERFITS', C.pink));
  await until(S(61)); await play(new M.Transform(knob, knobAt(0.95)), ...turn([-0.2, -0.2, 0]), ...say('TOO BIG: EVERY DIAL SQUEEZED', C.pink));
  await until(S(62)); await play(new M.LaggedStart([faces[0], faces[1]].map(f => new M.Indicate(f, { color: C.pink })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('MISSES REAL WEAR: BAD ON OLD AND NEW', C.pink));
  const tries = [0.2, 0.35, 0.65, 0.8].map(t => new M.Dot({ point: [kx(t), SL.y, 0], radius: 0.09, color: C.green }));
  await until(S(63)); await play(new M.LaggedStart(tries.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 1.4 }), new M.Transform(knob, knobAt(0.5)), ...turn(WB),
    ...say('TRY SEVERAL λ, SCORE ON UNSEEN BIKES', C.green));

  // 64-68 Try it
  await until(S(64)); await play(new M.FadeOut(new M.VGroup(track, slTitle, ...ends, knob, ...tries)), ...say('TRY IT: DRAG 3 WEIGHTS + THE PENALTY'));
  await play(new M.LaggedStart(faces.map(f => new M.Indicate(f, { color: C.cyan })), { lagRatio: 0.25, runTime: 1.4 }));
  await until(S(65)); await play(...fbox(['training error = 2', 'penalty        = 1', ['total          = 3', C.amber]]), ...say('WATCH THEM CHANGE LIVE'));
  await until(S(66)); await play(...say('CHALLENGE 1: A TOTAL BELOW 7', C.amber));
  await until(S(67)); await play(...say('CHALLENGE 2: λ = 0 → WHICH RULE WINS?', C.amber));
  await until(S(68)); await play(...say('NEW DATA: DOES THE IDEA STILL HOLD?', C.amber));

  // 69 recap
  await until(S(69)); await play(...fbox(['total = training error', ['      + λ × sum of squared weights', C.violet]], C.green),
    ...say('REGULARIZATION: A FEE FOR BIG WEIGHTS', C.green));
}

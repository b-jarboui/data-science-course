// lesson 12.2.4
// 12.2.4 Target encoding: a price clue from a brand.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const BIKES = [
    { id: 1, brand: 'Falcon', price: 700, col: C.cyan },
    { id: 2, brand: 'Ridge',  price: 400, col: C.amber },
    { id: 3, brand: 'Swift',  price: 300, col: C.pink },
    { id: 4, brand: 'Falcon', price: 500, col: C.cyan },
    { id: 5, brand: 'Ridge',  price: 200, col: C.amber },
    { id: 6, brand: 'Swift',  price: 200, col: C.pink },
    { id: 7, brand: 'Falcon', price: 600, col: C.cyan },
    { id: 8, brand: 'Ridge',  price: 300, col: C.amber },
  ];

  const PILL = P ? [0, 3.7, 0] : [0, 2.08, 0];
  const BOXP = P ? [0, -5.25, 0] : [4.4, -0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Laptop: 2 rows x 4 cards. Phone: 4 rows x 2 cards (bikes 1-4 = top two rows = fold A).
  const GX = P ? 0 : -2.05;
  const GY = P ? -0.475 : -0.25;
  const DX = P ? 3.44 : 2.15;
  const DY = P ? 3.7 : 2.0;
  const CW = P ? 3.1 : 1.92;
  const CH = P ? 1.3 : 1.55;
  const ROWY = [2.15, 0.6, -1.55, -3.1];
  const cardPos = i => P
    ? [((i % 2) - 0.5) * DX, ROWY[Math.floor(i / 2)], 0]
    : [GX + ((i % 4) - 1.5) * DX, GY + (i < 4 ? DY / 2 : -DY / 2), 0];

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

  function makeCard(b, pos) {
    const bg = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: b.col, strokeWidth: 2 });
    bg.setFill(C.card, 0.92); bg.moveTo(pos);
    const idT = T(`#${b.id}`, P ? 17 : 15, C.muted, true);
    idT.moveTo(P ? [pos[0] + CW / 2 - 0.36, pos[1] + CH / 2 - 0.28, 0] : [pos[0] - CW / 2 + 0.28, pos[1] + CH / 2 - 0.24, 0]);
    const brT = T(b.brand, P ? 21 : 19, b.col, true);
    brT.moveTo([pos[0] - (P ? 0.6 : 0), pos[1] + (P ? 0.24 : 0.18), 0]);
    const prT = T(`$${b.price}`, P ? 23 : 20, C.ink, true);
    prT.moveTo([pos[0] - (P ? 0.6 : 0), pos[1] - (P ? 0.24 : 0.32), 0]);
    return { g: new M.VGroup(bg, idT, brT, prT), bg, prT, pos };
  }

  function makeBadge(pos, val, col) {
    const r = new M.RoundedRectangle({ width: P ? 1.15 : 1.02, height: P ? 0.42 : 0.38, cornerRadius: 0.1, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.98);
    const bp = P ? [pos[0] + 0.85, pos[1] - 0.2, 0] : [pos[0], pos[1] - CH / 2 - 0.04, 0];
    r.moveTo(bp);
    const t = T(String(val), P ? 19 : 16, col, true);
    t.moveTo(bp);
    return new M.VGroup(r, t);
  }

  function makeMask(pos) {
    const r = new M.RoundedRectangle({ width: P ? 1.1 : CW * 0.62, height: P ? 0.46 : 0.44, cornerRadius: 0.08, color: C.muted, strokeWidth: 1.5 });
    r.setFill(C.card, 0.98);
    const mp = [pos[0] - (P ? 0.6 : 0), pos[1] - (P ? 0.24 : 0.32), 0];
    r.moveTo(mp);
    const t = T('???', P ? 19 : 17, C.muted, true);
    t.moveTo(mp);
    return new M.VGroup(r, t);
  }

  // 0-2: intro website & mystery bike
  // the mystery bike: a listing card with a simple bike drawing
  const QY = P ? -0.6 : -0.6, QS = P ? 1.25 : 0.8;
  const qCard = new M.RoundedRectangle({ width: P ? 6.4 : 4.6, height: P ? 6.6 : 4.3, cornerRadius: 0.22, color: C.cyan, strokeWidth: 2.5 });
  qCard.setFill(C.card, 0.95); qCard.moveTo([0, QY, 0]);
  const qTitle = T('USED BIKE FOR SALE', P ? 24 : 22, C.cyan, true); qTitle.moveTo([0, QY + (P ? 2.65 : 1.8), 0]);
  const bk = (x, y) => [x * QS, QY + 0.35 + y * QS, 0];
  const wheelL = new M.Circle({ radius: 0.85 * QS, color: C.ink, strokeWidth: 3 }); wheelL.moveTo(bk(-1.35, -0.45));
  const wheelR = new M.Circle({ radius: 0.85 * QS, color: C.ink, strokeWidth: 3 }); wheelR.moveTo(bk(1.35, -0.45));
  const fr = [[[-1.35, -0.45], [-0.25, 0.65]], [[-0.25, 0.65], [1.0, 0.65]], [[1.0, 0.65], [1.35, -0.45]],
    [[-1.35, -0.45], [0.05, -0.45]], [[0.05, -0.45], [-0.25, 0.65]], [[0.05, -0.45], [1.0, 0.65]],
    [[-0.25, 0.65], [-0.4, 0.95]], [[-0.6, 0.95], [-0.15, 0.95]], [[1.0, 0.65], [0.9, 1.05]], [[0.7, 1.05], [1.15, 1.05]]]
    .map(([a, b]) => new M.Line({ start: bk(...a), end: bk(...b), color: C.cyan, strokeWidth: 4 }));
  const qPrice = T('Price: $ ?', P ? 36 : 30, C.amber, true); qPrice.moveTo([0, QY - (P ? 2.4 : 1.65), 0]);
  const qGroup = new M.VGroup(qCard, qTitle, wheelL, wheelR, ...fr, qPrice);

  await until(S(0)); await play(new M.FadeIn(qGroup), ...say('USED-BIKE WEBSITE'));
  await until(S(1)); await play(new M.Indicate(qPrice, { color: C.amber }), ...say('WHAT PRICE SHOULD I ASK?', C.amber));
  await until(S(2)); await play(...say('8 SOLD BIKES LAST YEAR', C.cyan));

  // 3: draw 8 glowing cards
  const cards = BIKES.map((b, i) => makeCard(b, cardPos(i)));
  await until(S(3));
  await play(
    new M.FadeOut(qGroup),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c.g)), { lagRatio: 0.08, runTime: 1.6 }),
    ...say('8 CARDS: BRAND + SALE PRICE')
  );

  // 4-6: highlight by brand
  const falcons = [0, 3, 6], ridges = [1, 4, 7], swifts = [2, 5];
  await until(S(4));
  await play(
    ...falcons.map(i => new M.Indicate(cards[i].g, { color: C.cyan })),
    ...say('FALCON: $700, $500, $600', C.cyan)
  );
  await until(S(5));
  await play(
    ...ridges.map(i => new M.Indicate(cards[i].g, { color: C.amber })),
    ...say('RIDGE: $400, $200, $300', C.amber)
  );
  await until(S(6));
  await play(
    ...swifts.map(i => new M.Indicate(cards[i].g, { color: C.pink })),
    ...say('SWIFT: $300, $200', C.pink)
  );

  // 7-8: training bikes & question
  await until(S(7)); await play(...say('TRAINING BIKES = EXAMPLES TO LEARN FROM', C.cyan));
  await until(S(8)); await play(...say('CAN BRAND GIVE A USEFUL NUMBER?', C.amber));

  // 9-13: Swift mean = 250
  await until(S(9));
  await play(
    ...swifts.map(i => new M.Indicate(cards[i].g, { color: C.pink })),
    ...say('GROUP THE 2 SWIFT BIKES', C.pink)
  );
  await until(S(10));
  await play(...fbox([['Swift prices', C.pink], '300 + 200 = 500'], C.pink));
  await until(S(11));
  await play(...fbox([['Swift prices', C.pink], '300 + 200 = 500', ['500 ÷ 2 = 250', C.amber]], C.pink));
  await until(S(12));
  await play(...say('SWIFT MEAN PRICE = $250', C.pink));

  const naiveBadges = [];
  const swB = swifts.map(i => { const b = makeBadge(cards[i].pos, 250, C.pink); naiveBadges.push(b); return b; });
  await until(S(13));
  await play(...swB.map(b => new M.FadeIn(b)), ...say('REPLACE SWIFT WITH 250', C.pink));

  // 14-15: Falcon mean = 600, Ridge mean = 300
  const faB = falcons.map(i => { const b = makeBadge(cards[i].pos, 600, C.cyan); naiveBadges.push(b); return b; });
  await until(S(14));
  await play(
    ...faB.map(b => new M.FadeIn(b)),
    ...fbox([['Falcon mean', C.cyan], '(700 + 500 + 600) ÷ 3', ['= 600', C.cyan]], C.cyan),
    ...say('FALCON MEAN = $600', C.cyan)
  );

  const riB = ridges.map(i => { const b = makeBadge(cards[i].pos, 300, C.amber); naiveBadges.push(b); return b; });
  await until(S(15));
  await play(
    ...riB.map(b => new M.FadeIn(b)),
    ...fbox([['Ridge mean', C.amber], '(400 + 200 + 300) ÷ 3', ['= 300', C.amber]], C.amber),
    ...say('RIDGE MEAN = $300', C.amber)
  );

  // 16-17: target & target encoding
  await until(S(16)); await play(...say('TARGET = PRICE WE WANT TO PREDICT', C.green));
  await until(S(17)); await play(...say('TARGET ENCODING: BRAND → MEAN TARGET', C.cyan));

  // 18-23: leakage problem
  await until(S(18));
  await play(
    new M.Indicate(cards[2].g, { color: C.pink }),
    ...say('LOOK AT BIKE #3 (SWIFT, $300)', C.pink)
  );
  await until(S(19));
  await play(
    ...fbox([['Bike #3 number: 250', C.pink], 'uses its OWN $300!', ['(300 + 200) ÷ 2', C.amber]], C.pink),
    ...say('ITS OWN PRICE IS INSIDE ITS NUMBER', C.amber)
  );
  await until(S(20));
  await play(...fbox([['1-bike brand:', C.amber], 'price = $450'], C.amber), ...say('WHAT IF A BRAND HAS ONLY 1 BIKE?', C.amber));
  await until(S(21));
  await play(...fbox([['1-bike brand:', C.amber], 'price = $450', ['mean = $450 (exact!)', C.pink]], C.pink));
  await until(S(22)); await play(...say('FOR A NEW BIKE, PRICE IS UNKNOWN', C.muted));
  await until(S(23)); await play(...say('DATA LEAKAGE: CLUE FROM THE ANSWER', C.pink));

  // 24: prevent leakage -> clear naive badges
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(...naiveBadges)),
    ...(boxNow ? [new M.FadeOut(boxNow)] : []),
    ...say('HOW CAN WE PREVENT LEAKAGE?', C.green)
  );
  boxNow = null;

  // 25-28: split into Fold A (top row) and Fold B (bottom row)
  const fw = P ? DX + CW + 0.34 : 3 * DX + CW + 0.34, fh = P ? (ROWY[0] - ROWY[1]) + CH + 0.5 : CH + 0.36;
  const fAY = P ? (ROWY[0] + ROWY[1]) / 2 : GY + DY / 2, fBY = P ? (ROWY[2] + ROWY[3]) / 2 : GY - DY / 2;
  const foldARect = new M.RoundedRectangle({ width: fw, height: fh, cornerRadius: 0.18, color: C.violet, strokeWidth: 2.5 });
  foldARect.moveTo([GX, fAY, 0]);
  const foldALab = pill('FOLD A', C.violet, P ? 17 : 15);
  foldALab.moveTo(P ? [0, fAY + fh / 2, 0] : [GX - fw / 2 + 0.65, fAY + fh / 2 + 0.16, 0]);

  const foldBRect = new M.RoundedRectangle({ width: fw, height: fh, cornerRadius: 0.18, color: C.green, strokeWidth: 2.5 });
  foldBRect.moveTo([GX, fBY, 0]);
  const foldBLab = pill('FOLD B', C.green, P ? 17 : 15);
  foldBLab.moveTo(P ? [0, fBY + fh / 2, 0] : [GX - fw / 2 + 0.65, fBY - fh / 2 - 0.18, 0]);

  await until(S(25)); await play(...say('SPLIT 8 BIKES INTO 2 FOLDS', C.violet));
  await until(S(26)); await play(new M.Create(foldARect), new M.FadeIn(foldALab), ...say('FOLD A = BIKES 1 TO 4', C.violet));
  await until(S(27)); await play(new M.Create(foldBRect), new M.FadeIn(foldBLab), ...say('FOLD B = BIKES 5 TO 8', C.green));
  await until(S(28)); await play(...say('FOLD = ONE PART OF TRAINING BIKES', C.muted));

  // 29-34: hide Fold A prices, learn from Fold B
  const masksA = [0, 1, 2, 3].map(i => makeMask(cards[i].pos));
  await until(S(29));
  await play(...masksA.map(m => new M.FadeIn(m)), ...say('HIDE FOLD A → LEARN FROM FOLD B', C.green));

  await until(S(30));
  await play(
    new M.Indicate(cards[6].g, { color: C.cyan }),
    ...fbox([['From Fold B:', C.green], ['Falcon (#7): $600', C.cyan]], C.green)
  );
  const oofBadges = [];
  const b1 = makeBadge(cards[0].pos, 600, C.cyan);
  const b4 = makeBadge(cards[3].pos, 600, C.cyan);
  oofBadges.push(b1, b4);
  await until(S(31));
  await play(new M.FadeIn(b1), new M.FadeIn(b4), ...say('BIKES #1, #4 GET 600', C.cyan));

  await until(S(32));
  await play(
    new M.Indicate(cards[4].g, { color: C.amber }),
    new M.Indicate(cards[7].g, { color: C.amber }),
    ...fbox([['From Fold B:', C.green], ['Ridge (#5, #8):', C.amber], '200 + 300 = 500'], C.green)
  );
  const b2 = makeBadge(cards[1].pos, 250, C.amber);
  oofBadges.push(b2);
  await until(S(33));
  await play(
    new M.FadeIn(b2),
    ...fbox([['From Fold B:', C.green], ['Ridge: 500 ÷ 2 = 250', C.amber], 'Bike #2 → 250'], C.green)
  );

  const b3 = makeBadge(cards[2].pos, 200, C.pink);
  oofBadges.push(b3);
  await until(S(34));
  await play(
    new M.Indicate(cards[5].g, { color: C.pink }),
    new M.FadeIn(b3),
    ...fbox([['From Fold B:', C.green], ['Swift (#6): $200', C.pink], 'Bike #3 → 200'], C.green)
  );

  // 35-39: swap roles -> hide Fold B, learn from Fold A
  const masksB = [4, 5, 6, 7].map(i => makeMask(cards[i].pos));
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(...masksA)),
    ...masksB.map(m => new M.FadeIn(m)),
    ...say('SWAP: HIDE FOLD B → LEARN FROM FOLD A', C.violet)
  );

  await until(S(36));
  await play(
    new M.Indicate(cards[0].g, { color: C.cyan }),
    new M.Indicate(cards[3].g, { color: C.cyan }),
    ...fbox([['From Fold A:', C.violet], ['Falcon (#1, #4):', C.cyan], '700 + 500 = 1,200'], C.violet)
  );
  const b7 = makeBadge(cards[6].pos, 600, C.cyan);
  oofBadges.push(b7);
  await until(S(37));
  await play(
    new M.FadeIn(b7),
    ...fbox([['From Fold A:', C.violet], ['Falcon: 1,200 ÷ 2 = 600', C.cyan], 'Bike #7 → 600'], C.violet)
  );

  const b5 = makeBadge(cards[4].pos, 400, C.amber);
  const b8 = makeBadge(cards[7].pos, 400, C.amber);
  oofBadges.push(b5, b8);
  await until(S(38));
  await play(
    new M.Indicate(cards[1].g, { color: C.amber }),
    new M.FadeIn(b5), new M.FadeIn(b8),
    ...fbox([['From Fold A:', C.violet], ['Ridge (#2): $400', C.amber], 'Bikes #5, #8 → 400'], C.violet)
  );

  const b6 = makeBadge(cards[5].pos, 300, C.pink);
  oofBadges.push(b6);
  await until(S(39));
  await play(
    new M.Indicate(cards[2].g, { color: C.pink }),
    new M.FadeIn(b6),
    ...fbox([['From Fold A:', C.violet], ['Swift (#3): $300', C.pink], 'Bike #6 → 300'], C.violet)
  );

  // 40-43: reveal all & formula
  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(...masksB)),
    ...say('NO BIKE USED ITS OWN PRICE', C.green)
  );
  await until(S(41));
  await play(...say('OUT-OF-FOLD TARGET ENCODING', C.cyan));
  await until(S(42));
  await play(...say('THE FORMULA', C.amber));
  await until(S(43));
  await play(...fbox([
    ['brand number =', C.ink],
    ['  other-fold brand total', C.cyan],
    ['  ÷ other-fold brand count', C.amber],
  ], C.cyan));

  // 44-52: new bikes this year (Falcon N2 & unseen Comet N1)
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(foldARect, foldALab, foldBRect, foldBLab, ...oofBadges)),
    ...say('NEW BIKE ARRIVES THIS YEAR?', C.amber)
  );
  await until(S(45));
  await play(...say('LEARN BRAND MEANS FROM ALL 8 BIKES', C.green));

  // new bikes sit under the card grid (laptop) / under fold B (phone), clear of the formula box
  const NW = P ? 3.1 : 2.2, NH = P ? 1.05 : 1.1, NT = P ? 19 : 17, NV = P ? 22 : 20;
  const n2Pos = P ? [-1.72, -4.65, 0] : [-3.3, -3.05, 0];
  const n2Bg = new M.RoundedRectangle({ width: NW, height: NH, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  n2Bg.setFill(C.card, 0.95); n2Bg.moveTo(n2Pos);
  const n2T1 = T('NEW: Falcon', NT, C.cyan, true); n2T1.moveTo([n2Pos[0], n2Pos[1] + 0.22, 0]);
  const n2T2 = T('→ 600', NV, C.ink, true); n2T2.moveTo([n2Pos[0], n2Pos[1] - 0.24, 0]);
  const n2Card = new M.VGroup(n2Bg, n2T1, n2T2);

  await until(S(46));
  await play(
    ...(boxNow ? [new M.FadeOut(boxNow)] : []),
    new M.FadeIn(n2Card),
    ...falcons.map(i => new M.Indicate(cards[i].g, { color: C.cyan })),
    ...say('NEW FALCON → 600', C.cyan)
  );
  boxNow = null;

  const n1Pos = P ? [1.72, -4.65, 0] : [-0.8, -3.05, 0];
  const n1Bg = new M.RoundedRectangle({ width: NW, height: NH, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  n1Bg.setFill(C.card, 0.95); n1Bg.moveTo(n1Pos);
  const n1T1 = T('NEW: Comet', NT, C.muted, true); n1T1.moveTo([n1Pos[0], n1Pos[1] + 0.22, 0]);
  const n1T2 = T('unseen!', NT, C.amber, true); n1T2.moveTo([n1Pos[0], n1Pos[1] - 0.24, 0]);
  const n1Card = new M.VGroup(n1Bg, n1T1, n1T2);

  await until(S(47));
  await play(new M.FadeIn(n1Card), ...say('UNSEEN BRAND: COMET', C.muted));

  // Shift BOXP slightly down on laptop so it sits cleanly under the two new-bike cards
  const OLD_BOXP = BOXP.slice();
  if (P) BOXP[1] = -6.2;

  await until(S(48));
  await play(...fbox([['All 8 training bikes:', C.ink], 'total = $3,200'], C.amber));
  await until(S(49));
  await play(...fbox([['All 8 training bikes:', C.ink], 'total = $3,200', ['3,200 ÷ 8 = $400', C.green]], C.green));

  const n1Fix = T('→ 400', NV, C.green, true); n1Fix.moveTo([n1Pos[0], n1Pos[1] - 0.24, 0]);
  await until(S(50));
  await play(new M.FadeOut(n1T2), new M.FadeIn(n1Fix), ...say('COMET GETS OVERALL MEAN: 400', C.green));

  await until(S(51));
  await play(...say('FALLBACK RULE = OVERALL MEAN', C.green));
  await until(S(52));
  await play(...fbox([['Fallback rule:', C.green], 'unseen or missing brand', ['→ mean of allowed bikes', C.amber]], C.green));

  // 53-54: closing takeaway
  BOXP[0] = OLD_BOXP[0]; BOXP[1] = OLD_BOXP[1];
  await until(S(53)); await play(...say('TARGET ENCODING: BRAND PRICE CLUES', C.cyan));
  await until(S(54)); await play(...say('CLUE FROM OTHER BIKES, NEVER ITS OWN', C.green));
}

// 12.3.4 K-fold cross-validation: every fold gets a turn as the test group.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const PRICE = [10, 6, 8, 7, 3, 5];
  const PILL = P ? [0, 3.95, 0] : [0, 2.08, 0];
  const BOXP = P ? [0, -4.45, 0] : [4.0, -2.15, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 18, lh = P ? 0.42 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---------- 0-1 shop ----------
  const shopBg = new M.RoundedRectangle({ width: 3.4, height: 2.1, cornerRadius: 0.2, color: C.cyan, strokeWidth: 2.5 });
  shopBg.setFill(C.card, 0.95); shopBg.moveTo([0, -0.2, 0]);
  const shopT = T('USED-BIKE SHOP', 20, C.cyan, true); shopT.moveTo([0, 0.4, 0]);
  const shopQ = T('next bike: $ ?', 22, C.amber, true); shopQ.moveTo([0, -0.4, 0]);
  const shop = new M.VGroup(shopBg, shopT, shopQ);
  await until(S(0)); await play(new M.FadeIn(shop), ...say('YOUR BIKE SHOP'));
  await until(S(1)); await play(new M.Indicate(shopQ, { color: C.amber }), ...say('PREDICT THE NEXT PRICE', C.amber));

  // ---------- plot ----------
  const BASE = P ? -0.2 : -2.0, X1 = P ? -2.75 : -5.4, XP = P ? 1.1 : 0.92, YP = 0.3;
  const gx = x => X1 + (x - 1) * XP, gy = y => BASE + y * YP;
  const axX = new M.Line({ start: [gx(0.4), BASE, 0], end: [gx(6.5), BASE, 0], color: C.muted, strokeWidth: 3 });
  const axY = new M.Line({ start: [gx(0.4), BASE, 0], end: [gx(0.4), gy(11.2), 0], color: C.muted, strokeWidth: 3 });
  const xl = [1, 2, 3, 4, 5, 6].map(v => T(String(v), 15, C.muted, true).moveTo([gx(v), BASE - 0.25, 0]));
  const yl = [0, 5, 10].map(v => T(String(v), 15, C.muted, true).moveTo([gx(0.4) - 0.3, gy(v), 0]));
  const xName = T('age (years)', 15, C.muted, true); xName.moveTo([gx(6.5) + (P ? -0.3 : 0.75), BASE + (P ? 0.25 : 0), 0]);
  const yName = T('price ($100s)', 15, C.muted, true); yName.moveTo([gx(0.4) + 1.0, gy(11.2) + 0.22, 0]);
  const axes = new M.VGroup(axX, axY, ...xl, ...yl, xName, yName);
  const mkDot = (i, col = C.cyan) => {
    const p = [gx(i + 1), gy(PRICE[i]), 0];
    const halo = new M.Dot({ point: p, radius: 0.17, color: col }); halo.setFill(col, 0.2);
    const core = new M.Dot({ point: p, radius: 0.09, color: col }); core.setFill(col, 1);
    return new M.VGroup(halo, core);
  };
  const dots = PRICE.map((_, i) => mkDot(i));

  await until(S(2)); await play(new M.FadeOut(shop), new M.Create(axX), new M.Create(axY), ...say('6 BIKES ALREADY SOLD'));
  await until(S(3)); await play(new M.FadeIn(new M.VGroup(...xl, ...yl, xName, yName)), ...say('AGE IN YEARS · PRICE IN $100s', C.muted));
  for (let i = 0; i < 6; i++) {
    await until(S(4 + i));
    await play(new M.FadeIn(dots[i]), new M.Flash(dots[i].submobjects[1], { color: C.cyan }),
      ...fbox([[`bike ${i + 1}`, C.cyan], `age ${i + 1} · price ${PRICE[i]}`], C.cyan));
  }
  await until(S(10)); await play(...dropBox(), ...say('ONE DOT = ONE BIKE (AGE, PRICE)'));

  // curves fitted on all six bikes (chapters/12.3.md): line 10 − x, least-squares quadratic, degree-5 through every dot
  const yellow = x => 10 - x;
  const green = x => 11 - 1.75 * x + 3 / 28 * x * x;
  const pinkF = x => PRICE.reduce((t, v, i) => t + v * PRICE.reduce((w, _, j) => i === j ? w : w * (x - j - 1) / (i - j), 1), 0);
  function curve(f, col, n) {
    const segs = [];
    for (let k = 0; k < n; k++) {
      const a = 0.8 + 5.4 * k / n, b = 0.8 + 5.4 * (k + 1) / n, ya = f(a), yb = f(b);
      if (ya < -0.3 || ya > 11.5 || yb < -0.3 || yb > 11.5) continue;
      segs.push(new M.Line({ start: [gx(a), gy(ya), 0], end: [gx(b), gy(yb), 0], color: col, strokeWidth: 4 }));
    }
    return new M.VGroup(...segs);
  }
  const cY = curve(yellow, C.amber, 1), cG = curve(green, C.green, 40), cP = curve(pinkF, C.pink, 80);
  await until(S(11)); await play(new M.Create(cY), ...say('A STRAIGHT LINE', C.amber));
  await until(S(12)); await play(new M.Create(cG), ...say('A GENTLE CURVE · A VERY BENDY CURVE', C.green));
  await play(new M.Create(cP));
  await until(S(13)); await play(...say('EACH ONE = A MODEL', C.cyan));
  await until(S(14)); await play(...say('WHICH IS BEST FOR NEW BIKES?', C.amber));
  await until(S(15)); await play(...say('HIDE SOME PRICES WHILE IT LEARNS', C.violet));
  await until(S(16)); await play(...say('LEARN ON SOME QUESTIONS · TEST ON OTHERS', C.violet));

  // folds
  const FY = BASE - 0.55;
  const fold = k => {
    const a = gx(2 * k + 1) - 0.3, b = gx(2 * k + 2) + 0.3;
    const ln = new M.Line({ start: [a, FY, 0], end: [b, FY, 0], color: C.violet, strokeWidth: 5 });
    const t = T(`fold ${k + 1}`, 15, C.violet, true); t.moveTo([(a + b) / 2, FY - 0.27, 0]);
    return new M.VGroup(ln, t);
  };
  const folds = [0, 1, 2].map(fold);
  await until(S(17)); await play(...say('6 BIKES → 3 GROUPS OF 2', C.violet));
  await until(S(18)); await play(new M.FadeIn(folds[0]), ...say('GROUP 1: BIKES 1 + 2', C.violet));
  await until(S(19)); await play(new M.FadeIn(folds[1]), ...say('GROUP 2: BIKES 3 + 4', C.violet));
  await until(S(20)); await play(new M.FadeIn(folds[2]), ...say('GROUP 3: BIKES 5 + 6', C.violet));
  await until(S(21)); await play(...say('EACH GROUP = A FOLD', C.violet));
  await until(S(22)); await play(new M.LaggedStart(folds.map(f => new M.Indicate(f, { color: C.amber })), { lagRatio: 0.4, runTime: 2.0 }),
    ...say('EACH FOLD: ONE TURN AS TEST', C.amber));
  await until(S(23)); await play(...say('K-FOLD CROSS-VALIDATION', C.cyan), ...fbox([['K = number of folds', C.cyan]], C.cyan));
  await until(S(24)); await play(...fbox([['K = 3', C.amber]], C.amber), ...say('HERE K = 3', C.amber));

  // score table (scores computed from the six bikes: review/qa/math_scratch/12.3_rework.py)
  const TX = P ? [-2.75, -0.95, 0.35, 1.65, 3.0] : [1.75, 3.3, 4.3, 5.3, 6.35];
  const TY = P ? [-1.45, -2.05, -2.6, -3.15] : [1.2, 0.55, -0.05, -0.65];
  const NAMES = [['line', C.amber], ['gentle', C.green], ['bendy', C.pink]];
  const SC = [[4.5, 2.3, 4.5, 3.8], [59, 20, 59, 46], [1053, 20, 1053, 709]];
  const head = ['F1', 'F2', 'F3', 'mean'].map((s, k) => T(s, 16, k === 3 ? C.cyan : C.violet, true).moveTo([TX[k + 1], TY[0], 0]));
  const rowN = NAMES.map(([s, c], m) => T(s, 17, c, true).moveTo([TX[0], TY[m + 1], 0]));
  const tLine = new M.Line({ start: [TX[0] - 0.6, (TY[0] + TY[1]) / 2, 0], end: [TX[4] + 0.5, (TY[0] + TY[1]) / 2, 0], color: C.muted, strokeWidth: 1.5 });
  const cell = (m, f, v, col) => T(String(v), 18, col, true).moveTo([TX[f + 1], TY[m + 1], 0]);

  // refits on the four visible bikes (coefficients highest power first)
  const FITS = [
    [[-1.3, 11.6], [0.75, -8.05, 25.85], [1.5, -19.5, 80, -97]],
    [[-1, 9.5], [0.75, -6.25, 15.5], [0.75, -6.25, 15.5]],
    [[-0.7, 9.5], [0.75, -4.45, 13.25], [-1.5, 12, -29.5, 29]]];
  const pv = (c, x) => c.reduce((a, k) => a * x + k, 0);
  const COLS = [C.amber, C.green, C.pink];
  const foldCurves = k => FITS[k].map((c, m) => curve(x => pv(c, x), COLS[m], m === 0 ? 1 : 60));
  function marks(k) {
    const out = [];
    FITS[k].forEach((c, m) => [2 * k, 2 * k + 1].forEach(i => {
      const v = pv(c, i + 1);
      if (v < 0 || v > 11.2) return;
      const sq = new M.Rectangle({ width: 0.17, height: 0.17, color: COLS[m], strokeWidth: 2 }); sq.setFill(C.bg, 1);
      sq.moveTo([gx(i + 1) + (m === 2 ? 0.16 : 0), gy(v), 0]); out.push(sq);
    }));
    return out;
  }
  function band(k) {
    const r = new M.Rectangle({ width: 2 * XP, height: gy(11.2) - BASE, color: C.violet, strokeWidth: 0 });
    r.setFill(C.violet, 0.10); r.moveTo([(gx(2 * k + 1) + gx(2 * k + 2)) / 2, (BASE + gy(11.2)) / 2, 0]);
    return r;
  }

  // hide / reveal one fold
  const ringFor = i => {
    const p = [gx(i + 1), gy(PRICE[i]), 0];
    const r = new M.Circle({ radius: 0.2, color: C.muted, strokeWidth: 2 }); r.moveTo(p);
    const q = T('?', 16, C.muted, true); q.moveTo(p);
    return new M.VGroup(r, q);
  };
  let rings = [], fc = [], mk = [], bd = null;
  function hide(k) {
    rings = [2 * k, 2 * k + 1].map(ringFor);
    return [new M.FadeOut(dots[2 * k]), new M.FadeOut(dots[2 * k + 1]), new M.FadeIn(new M.VGroup(...rings))];
  }
  function reveal(k) {
    mk = marks(k);
    const a = [new M.FadeOut(new M.VGroup(...rings)), new M.FadeIn(dots[2 * k]), new M.FadeIn(dots[2 * k + 1])];
    if (mk.length) a.push(new M.FadeIn(new M.VGroup(...mk)));
    rings = [];
    return a;
  }
  function clearFold() {
    const gone = [...fc, ...mk, ...(bd ? [bd] : [])];
    fc = []; mk = []; bd = null;
    return gone.length ? [new M.FadeOut(new M.VGroup(...gone))] : [];
  }
  function fitFold(k) {
    fc = foldCurves(k);
    return fc.map(c => new M.Create(c));
  }
  function startFold(k) {
    bd = band(k);
    return [new M.FadeIn(bd), ...hide(k), new M.Indicate(folds[k], { color: C.violet })];
  }

  await until(S(25)); await play(...dropBox(), new M.FadeOut(new M.VGroup(cY, cG, cP)), ...startFold(0), ...say('HIDE PRICES OF BIKES 1 + 2', C.violet));
  await until(S(26)); await play(...fitFold(0), ...say('FIT EACH MODEL ON THE OTHER 4', C.cyan));
  await until(S(27)); await play(new M.Indicate(fc[2], { color: C.pink }), ...say('BENDY: THROUGH ALL 4 TRAINING BIKES', C.pink));
  await until(S(28)); await play(...reveal(0), ...say('PREDICT THE 2 HIDDEN PRICES', C.amber));
  await until(S(29)); await play(...fbox([['difference =', C.ink], ['predicted − real', C.amber]], C.amber));
  await until(S(30)); await play(...fbox([['difference =', C.ink], ['predicted − real', C.amber], ['square it: d × d ≥ 0', C.green]], C.amber));
  await until(S(31)); await play(...fbox([['mean of the squares', C.ink], ['= mean squared error', C.amber], ['(MSE)', C.muted]], C.amber), ...say('MEAN SQUARED ERROR', C.amber));
  await until(S(32)); await play(...say('SMALLER SCORE = CLOSER PREDICTIONS', C.green));
  await until(S(33)); await play(...dropBox(), new M.FadeIn(new M.VGroup(...head, ...rowN, tLine)), new M.Indicate(folds[0], { color: C.violet }),
    ...say('HIDDEN BIKES: OUTSIDE THE AGES 3 TO 6', C.violet));

  const cells = [];
  const fill = (m, f, col) => { const c = cell(m, f, SC[m][f], col); cells.push(c); return new M.FadeIn(c); };
  const scoreBox = (m, g, r, s) => fbox([[NAMES[m][0] === 'line' ? 'straight line' : NAMES[m][0] + ' curve', COLS[m]],
    `guesses ${g}`, `real prices ${r}`, [`score ≈ ${s}`, COLS[m]]], COLS[m]);
  const point = m => fc[m] && fc[m].submobjects.length ? [new M.Indicate(fc[m], { color: COLS[m] })] : [];
  // fold 1
  await until(S(34)); await play(fill(0, 0, C.amber), ...point(0), ...scoreBox(0, '10.3, 9', '10, 6', '4.5'), ...say('FOLD 1 SCORES', C.violet));
  await until(S(35)); await play(fill(1, 0, C.green), ...point(1), ...scoreBox(1, '18.6, 12.8', '10, 6', '59'));
  await until(S(36)); await play(fill(2, 0, C.pink), ...point(2), ...scoreBox(2, '−35, −3', '10, 6', '1053'));
  // fold 2
  await until(S(37)); await play(...dropBox(), ...clearFold(), ...say('HIDE BIKES 3 + 4 · FIT AGAIN', C.violet));
  await play(...startFold(1));
  await play(...fitFold(1));
  await until(S(38)); await play(...reveal(1), fill(0, 1, C.amber), ...point(0), ...scoreBox(0, '6.5, 5.5', '8, 7', '2.3'), ...say('FOLD 2 SCORES', C.violet));
  await until(S(39)); await play(fill(1, 1, C.green), ...point(1), ...scoreBox(1, '3.5, 2.5', '8, 7', '20'));
  await until(S(40)); await play(fill(2, 1, C.pink), ...point(2), ...scoreBox(2, '3.5, 2.5', '8, 7', '20'));
  // fold 3
  await until(S(41)); await play(...dropBox(), ...clearFold(), ...say('HIDE BIKES 5 + 6 · FIT AGAIN', C.violet));
  await play(...startFold(2));
  await play(...fitFold(2));
  await until(S(42)); await play(...reveal(2), fill(0, 2, C.amber), ...point(0), ...scoreBox(0, '6, 5.3', '3, 5', '4.5'), ...say('FOLD 3 SCORES', C.violet));
  await until(S(43)); await play(fill(1, 2, C.green), ...point(1), ...scoreBox(1, '9.8, 13.6', '3, 5', '59'));
  await until(S(44)); await play(fill(2, 2, C.pink), ...point(2), ...scoreBox(2, '−6, −40', '3, 5', '1053'));
  await until(S(45)); await play(...dropBox(), ...clearFold(), new M.LaggedStart(folds.map(f => new M.Indicate(f, { color: C.amber })), { lagRatio: 0.3, runTime: 1.6 }),
    ...say('EVERY BIKE HAD A TURN AS TEST', C.amber));

  // means
  await until(S(46)); await play(...fbox([['line', C.amber], '4.5 + 2.3 + 4.5 ≈ 11.3'], C.amber));
  await until(S(47)); await play(fill(0, 3, C.cyan), ...fbox([['line', C.amber], '4.5 + 2.3 + 4.5 ≈ 11.3', ['11.3 ÷ 3 ≈ 3.8', C.cyan]], C.amber));
  await until(S(48)); await play(...fbox([['gentle', C.green], '59 + 20 + 59 ≈ 139'], C.green));
  await until(S(49)); await play(fill(1, 3, C.cyan), ...fbox([['gentle', C.green], '59 + 20 + 59 ≈ 139', ['139 ÷ 3 ≈ 46', C.cyan]], C.green));
  await until(S(50)); await play(fill(2, 3, C.cyan), ...fbox([['bendy', C.pink], '1053 + 20 + 1053 ≈ 2126', ['2126 ÷ 3 ≈ 709', C.cyan]], C.pink));
  await until(S(51)); await play(...fbox([['CV score =', C.ink], ['sum of fold scores', C.amber], ['÷ number of folds', C.cyan]], C.cyan), ...say('THE FORMULA', C.cyan));
  const win = new M.RoundedRectangle({ width: TX[4] - TX[0] + 1.2, height: 0.5, cornerRadius: 0.12, color: C.green, strokeWidth: 3 });
  win.moveTo([(TX[0] + TX[4]) / 2 + 0.05, TY[1], 0]);
  const cY2 = curve(yellow, C.amber, 1);
  await until(S(52)); await play(new M.Create(win), new M.Create(cY2), ...dropBox(), ...say('CHOOSE THE STRAIGHT LINE: 3.8', C.green));
  await until(S(53)); await play(...fbox([['few bikes to learn from:', C.muted], ['curves swing at the ends', C.pink], ['the line stays calm', C.amber]], C.muted),
    ...say('FEW BIKES: THE SIMPLE MODEL WINS', C.amber));
  await until(S(54)); await play(...fbox([['every fold', C.violet], ['gets a turn as test', C.amber]], C.cyan), ...say('K-FOLD CV HELPS YOU CHOOSE', C.cyan));
}

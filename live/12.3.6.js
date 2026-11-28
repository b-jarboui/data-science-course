// 12.3.6 Hyperparameters vs fitted parameters.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const PRICE = [10, 6, 8, 7, 3, 5];
  const PILL = P ? [0, 3.95, 0] : [0, 2.08, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.2, -1.75, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 18, lh = P ? 0.4 : 0.37;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.6, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.3, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 5.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---------- plot ----------
  const BASE = P ? -0.1 : -2.0, X1 = P ? -2.3 : -5.3, XP = P ? 0.98 : 0.92, YP = 0.3;
  const gx = x => X1 + (x - 1) * XP, gy = y => BASE + y * YP;
  const axX = new M.Line({ start: [gx(0), BASE, 0], end: [gx(6.5), BASE, 0], color: C.muted, strokeWidth: 3 });
  const axY = new M.Line({ start: [gx(0), BASE, 0], end: [gx(0), gy(11.2), 0], color: C.muted, strokeWidth: 3 });
  const xl = [1, 2, 3, 4, 5, 6].map(v => T(String(v), 15, C.muted, true).moveTo([gx(v), BASE - 0.25, 0]));
  const yl = [0, 5, 10].map(v => T(String(v), 15, C.muted, true).moveTo([gx(0) - 0.28, gy(v), 0]));
  const xName = T('age', 15, C.muted, true); xName.moveTo([gx(6.5) + 0.1, BASE + 0.25, 0]);
  const yName = T('price ($100s)', 15, C.muted, true); yName.moveTo([gx(0) + 1.0, gy(11.2) + 0.22, 0]);
  const mkDot = (x, y, col = C.cyan) => {
    const p = [gx(x), gy(y), 0];
    const halo = new M.Dot({ point: p, radius: 0.17, color: col }); halo.setFill(col, 0.2);
    const core = new M.Dot({ point: p, radius: 0.09, color: col }); core.setFill(col, 1);
    return new M.VGroup(halo, core);
  };
  const dots = PRICE.map((v, i) => mkDot(i + 1, v));

  const yellow = x => 10 - x;
  const green = x => 11 - 1.75 * x + 3 / 28 * x * x; // least-squares quadratic on the six bikes (chapters/12.3.md)
  const pinkF = x => PRICE.reduce((t, v, i) => t + v * PRICE.reduce((w, _, j) => i === j ? w : w * (x - j - 1) / (i - j), 1), 0);
  function curve(f, col, n, a0 = 0.8, a1 = 6.2, sw = 4) {
    const segs = [];
    for (let k = 0; k < n; k++) {
      const a = a0 + (a1 - a0) * k / n, b = a0 + (a1 - a0) * (k + 1) / n, ya = f(a), yb = f(b);
      if (ya < -0.3 || ya > 11.5 || yb < -0.3 || yb > 11.5) continue;
      segs.push(new M.Line({ start: [gx(a), gy(ya), 0], end: [gx(b), gy(yb), 0], color: col, strokeWidth: sw }));
    }
    return new M.VGroup(...segs);
  }

  await until(S(0)); await play(...say('PREDICT A USED-BIKE PRICE'));
  await until(S(1)); await play(new M.Create(axX), new M.Create(axY), new M.FadeIn(new M.VGroup(...xl, ...yl, xName, yName)), ...say('6 BIKES FROM OUR SHOP'));
  await play(new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.15, runTime: 1.2 }));
  await until(S(2)); await play(new M.LaggedStart(dots.map(d => new M.Flash(d.submobjects[1], { color: C.cyan })), { lagRatio: 0.12, runTime: 1.6 }),
    ...say('DOT = AGE (YEARS) + PRICE ($100s)'));
  await until(S(3)); await play(...say('THE MODEL LEARNS FROM THESE 6', C.cyan));
  await until(S(4)); await play(...say('BUT FIRST: SOME CHOICES', C.amber));
  let cY = curve(yellow, C.amber, 1), cG = curve(green, C.green, 40), cP = curve(pinkF, C.pink, 80);
  await until(S(5)); await play(new M.Create(cY), ...say('A STRAIGHT LINE?', C.amber));
  await until(S(6)); await play(new M.Create(cG), ...say('A GENTLE CURVE?', C.green));
  await until(S(7)); await play(new M.Create(cP), ...say('A VERY BENDY CURVE?', C.pink));
  await until(S(8)); await play(...say('EACH CHOICE = A DIFFERENT FREEDOM', C.violet));

  // 9-13 rulers
  const rl = (x0, y0, x1, y1) => new M.Line({ start: [gx(x0), gy(y0), 0], end: [gx(x1), gy(y1), 0], color: C.amber, strokeWidth: 12 });
  const ruler = rl(1, 8, 6, 8);
  const rT = T('rigid ruler', 16, C.amber, true); rT.moveTo([gx(3.5), gy(10.6), 0]);
  await until(S(9)); await play(new M.FadeOut(new M.VGroup(cY, cG, cP)), new M.Create(ruler), new M.FadeIn(rT), ...say('A RIGID RULER', C.amber));
  await until(S(10)); await play(new M.Transform(ruler, rl(1, 6, 6, 6)), ...say('MOVE IT · TURN IT · NO BENDING', C.amber));
  await play(new M.Transform(ruler, rl(0.8, 10.2, 6.2, 3.8)));
  const NF = 24;
  const flexPts = f => Array.from({ length: NF + 1 }, (_, k) => { const x = 0.8 + 5.4 * k / NF; return [gx(x), gy(f(x)), 0]; });
  const flexSeg = (pts, k) => new M.Line({ start: pts[k], end: pts[k + 1], color: C.green, strokeWidth: 12 });
  const straight = flexPts(x => 10 - x), bent = flexPts(x => green(x) + 1.2 * Math.sin((x - 1) * 1.6));
  const flex = Array.from({ length: NF }, (_, k) => flexSeg(straight, k));
  const fT = T('flexible ruler', 16, C.green, true); fT.moveTo([gx(3.5), gy(10.6), 0]);
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(ruler, rT)), new M.FadeIn(new M.VGroup(...flex)), new M.FadeIn(fT), ...say('A FLEXIBLE RULER CAN BEND', C.green));
  await play(...flex.map((s, k) => new M.Transform(s, flexSeg(bent, k))));
  await until(S(12)); await play(...say('THE RULER DECIDES THE SHAPES', C.violet));
  await until(S(13)); await play(new M.FadeOut(new M.VGroup(...flex, fT)), ...say('SAME KIND OF CHOICE FOR OUR MODEL', C.cyan));

  // ---------- settings panel ----------
  const PR = P ? [-1.35, -2.15] : [1.0, 0.2];
  const LBX = P ? -2.2 : 2.85, OX = P ? [0.7, 1.7, 2.7] : [4.75, 5.55, 6.35];
  const lab = (s, r) => { const t = T(s, 16, C.ink, true); t.moveTo([LBX, PR[r], 0]); return t; };
  const opt = (s, r, k, col) => { const p = pill(s, col, P ? 15 : 15); p.moveTo([OX[k], PR[r], 0]); return p; };
  const degL = lab('degree', 0), wL = lab('penalty weight', 1);
  const degO = ['1', '2', '5'].map((s, k) => opt(s, 0, k, [C.amber, C.green, C.pink][k]));
  const wO = ['0', '1', '4'].map((s, k) => opt(s, 1, k, C.violet));
  const ring = (r, k, col) => { const q = new M.RoundedRectangle({ width: 0.72, height: 0.58, cornerRadius: 0.12, color: col, strokeWidth: 3 }); q.moveTo([OX[k], PR[r], 0]); return q; };

  // 14-18 degree
  await until(S(14)); await play(new M.FadeIn(degL), new M.LaggedStart(degO.map(o => new M.FadeIn(o)), { lagRatio: 0.3, runTime: 1.2 }),
    ...say('DEGREE = POSSIBLE SHAPES', C.cyan));
  let sel = ring(0, 0, C.amber);
  cY = curve(yellow, C.amber, 1); cG = curve(green, C.green, 40); cP = curve(pinkF, C.pink, 80);
  await until(S(15)); await play(new M.Create(sel), new M.Create(cY), ...say('DEGREE 1 → STRAIGHT LINE', C.amber));
  let sel2 = ring(0, 1, C.green);
  await until(S(16)); await play(new M.FadeOut(sel), new M.FadeIn(sel2), new M.FadeOut(cY), new M.Create(cG), ...say('DEGREE 2 → GENTLE CURVE', C.green));
  sel = ring(0, 2, C.pink);
  await until(S(17)); await play(new M.FadeOut(sel2), new M.FadeIn(sel), new M.FadeOut(cG), new M.Create(cP), ...say('DEGREE 5 → VERY BENDY', C.pink));
  const thin = new M.VGroup(curve(yellow, C.amber, 1, 0.8, 6.2, 2), curve(green, C.green, 40, 0.8, 6.2, 2), curve(pinkF, C.pink, 80, 0.8, 6.2, 2));
  await until(S(18)); await play(new M.FadeOut(sel), new M.FadeOut(cP), new M.FadeIn(thin), ...say('CHOOSE THE DEGREE BEFORE LEARNING', C.amber));

  // 19-25 penalty weight
  await until(S(19)); await play(...fbox([['price formula:', C.ink], ['avoid very large', C.violet], ['numbers in it', C.violet]], C.violet),
    ...say('AVOID VERY LARGE NUMBERS', C.violet));
  await until(S(20)); await play(...fbox([['cost =', C.ink], 'price misses', ['+ extra cost if', C.violet], ['  numbers are large', C.violet]], C.violet));
  await until(S(21)); await play(...say('EXTRA COST = PENALTY', C.violet));
  await until(S(22)); await play(new M.FadeIn(wL), ...fbox([['cost =', C.ink], 'price misses', ['+ weight × penalty', C.violet]], C.violet),
    ...say('PENALTY WEIGHT: HOW MUCH IT MATTERS', C.violet));
  await until(S(23)); await play(new M.LaggedStart(wO.map(o => new M.FadeIn(o)), { lagRatio: 0.3, runTime: 1.2 }), ...say('TRY 0, 1 OR 4', C.violet));
  sel = ring(1, 0, C.violet);
  await until(S(24)); await play(new M.Create(sel), ...fbox([['weight 0', C.violet], 'no penalty'], C.violet));
  sel2 = ring(1, 2, C.violet);
  await until(S(25)); await play(new M.FadeOut(sel), new M.FadeIn(sel2), ...fbox([['weight 4', C.violet], 'penalty counts', 'more than weight 1'], C.violet));

  // 26-27 hyperparameters
  const hp = pill('HYPERPARAMETERS', C.amber, P ? 15 : 16);
  hp.moveTo(P ? [0, -2.75, 0] : [4.6, 1.6, 0]);
  await until(S(26)); await play(new M.FadeOut(sel2), new M.FadeIn(hp), ...fbox([['hyperparameter =', C.amber], 'a setting we choose', 'BEFORE learning'], C.amber), ...say('HYPERPARAMETERS', C.amber));
  await until(S(27)); await play(new M.Indicate(degL, { color: C.amber }), new M.Indicate(wL, { color: C.amber }), ...say('DEGREE + PENALTY WEIGHT', C.amber));

  // 28-41 fit with degree 1, weight 0
  await until(S(28)); await play(...dropBox(), ...say('WHAT DOES THE MODEL LEARN?', C.cyan));
  sel = ring(0, 0, C.amber); sel2 = ring(1, 0, C.violet);
  await until(S(29)); await play(new M.FadeOut(thin), new M.Create(sel), new M.Create(sel2), ...say('CHOOSE: DEGREE 1 · WEIGHT 0', C.amber));
  await until(S(30)); await play(...say('FIND A STRAIGHT LINE FOR 6 BIKES', C.amber));
  const fit = curve(yellow, C.amber, 1, 0, 6.3);
  const gaps = PRICE.map((v, i) => new M.DashedLine({ start: [gx(i + 1), gy(v), 0], end: [gx(i + 1), gy(yellow(i + 1)), 0], color: C.violet }));
  await play(new M.Create(fit));
  await until(S(31)); await play(...gaps.map(g => new M.Create(g)), ...fbox([['fitting =', C.cyan], 'find the numbers that', 'bring predictions close', 'to the real prices'], C.cyan));
  const d0 = mkDot(0, 10, C.amber);
  const t10 = pill('10', C.amber, 16); t10.moveTo([gx(0) - 0.15, gy(10) + 0.47, 0]);
  await until(S(32)); await play(new M.FadeOut(new M.VGroup(...gaps)), new M.FadeIn(d0), new M.FadeIn(t10), ...say('AGE 0 → PRICE 10', C.amber));
  const stepH = new M.Line({ start: [gx(2), gy(8), 0], end: [gx(3), gy(8), 0], color: C.green, strokeWidth: 4 });
  const stepV = new M.Line({ start: [gx(3), gy(8), 0], end: [gx(3), gy(7), 0], color: C.pink, strokeWidth: 4 });
  const stT = T('−1 per year', 15, C.pink, true); stT.moveTo([gx(2.4), gy(8) + 0.42, 0]);
  await until(S(33)); await play(new M.Create(stepH), new M.Create(stepV), new M.FadeIn(stT), ...say('+1 YEAR → PRICE −1', C.pink));
  await until(S(34)); await play(...say('A SHORT FORMULA', C.cyan));
  await until(S(35)); await play(...fbox([['predicted price', C.ink], ['= 10 − age', C.amber]], C.amber));
  const d1 = mkDot(1, 9, C.amber), d4 = mkDot(4, 6, C.amber);
  await until(S(36)); await play(new M.FadeIn(d1), ...fbox([['predicted price', C.ink], '= 10 − age', ['age 1: 10 − 1 = 9', C.amber]], C.amber));
  await until(S(37)); await play(new M.FadeIn(d4), ...fbox([['predicted price', C.ink], '= 10 − age', 'age 1: 10 − 1 = 9', ['age 4: 10 − 4 = 6', C.amber]], C.amber));
  await until(S(38)); await play(new M.FadeOut(new M.VGroup(d1, d4)), ...fbox([['start = 10', C.amber], ['change per year = −1', C.pink]], C.amber));
  await until(S(39)); await play(...say('10 AND −1 = COEFFICIENTS', C.green));
  await until(S(40)); await play(new M.LaggedStart(dots.map(d => new M.Flash(d.submobjects[1], { color: C.green })), { lagRatio: 0.12, runTime: 1.4 }),
    ...say('LEARNED FROM THE TRAINING BIKES', C.green));
  await until(S(41)); await play(...fbox([['fitted parameters', C.green], 'start = 10', 'change per year = −1'], C.green), ...say('FITTED PARAMETERS', C.green));

  // 42-43 compare
  await until(S(42)); await play(new M.Indicate(hp, { color: C.amber }), ...say('TWO KINDS OF NUMBERS', C.cyan));
  await until(S(43)); await play(...fbox([['WE choose:', C.amber], '  degree 1, weight 0', ['MODEL learns:', C.green], '  10 and −1'], C.cyan),
    ...say('WE CHOOSE · THE MODEL LEARNS', C.cyan));

  // 44-50 tuning with cross-validation
  await until(S(44)); await play(new M.FadeOut(new M.VGroup(d0, t10, stepH, stepV, stT)), ...dropBox(), ...say('WHICH SETTINGS TO CHOOSE?', C.amber));
  const FY = BASE - 0.55;
  const folds = [0, 1, 2].map(k => {
    const a = gx(2 * k + 1) - 0.3, b = gx(2 * k + 2) + 0.3;
    const ln = new M.Line({ start: [a, FY, 0], end: [b, FY, 0], color: C.violet, strokeWidth: 5 });
    const t = T(`fold ${k + 1}`, 14, C.violet, true); t.moveTo([(a + b) / 2, FY - 0.25, 0]);
    return new M.VGroup(ln, t);
  });
  await until(S(45)); await play(new M.LaggedStart(folds.map(f => new M.FadeIn(f)), { lagRatio: 0.3, runTime: 1.4 }), ...say('EACH GROUP: A TURN AS TEST', C.violet));
  await until(S(46)); await play(...say('CROSS-VALIDATION', C.violet));
  await until(S(47)); await play(new M.FadeOut(sel), ...say('REPEAT FOR EACH SETTING', C.violet));
  const cols = [C.amber, C.green, C.pink], fs = [yellow, green, pinkF];
  let cur = null, curSel = null;
  const SCORE = ['3.0', '1.5', '5.0'];
  await until(S(48));
  for (let k = 0; k < 3; k++) {
    const c = curve(fs[k], cols[k], k ? 60 : 1), s = ring(0, k, cols[k]);
    const a = [new M.Create(c), new M.FadeIn(s)];
    if (cur) a.push(new M.FadeOut(cur), new M.FadeOut(curSel));
    else a.push(new M.FadeOut(fit));
    if (k === 0) a.push(...say('NEW COEFFICIENTS EACH TIME', C.cyan));
    await play(...a);
    cur = c; curSel = s;
    if (k < 2) await until(S(48) + 1.3 * (k + 1));
  }
  await until(S(49)); await play(...fbox([['validation score', C.violet], ['(hidden bikes)', C.muted], ['degree 1: 3.8  ✓', C.amber], ['degree 2: 46', C.green], ['bendiest: 709', C.pink]], C.violet),
    ...say('COMPARE ON HIDDEN BIKES', C.violet));
  await until(S(50)); await play(new M.FadeOut(curSel), new M.FadeOut(cur), ...say('THIS IS CALLED TUNING', C.green));
  curSel = ring(0, 0, C.amber); cur = curve(yellow, C.amber, 1);
  await play(new M.FadeIn(curSel), new M.Create(cur));

  // 51-54 careful
  await until(S(51)); await play(...fbox([['training error', C.muted], ['degree 1: 2.0', C.amber], ['degree 2: 1.9', C.green], ['degree 5: 0  (!)', C.pink]], C.pink),
    ...say('MORE FREEDOM → FEWER TRAINING MISSES', C.pink));
  await until(S(52)); await play(...say('NOT BETTER FOR NEW BIKES', C.pink));
  await until(S(53)); await play(...fbox([['choose by', C.ink], ['validation score', C.violet], ['(hidden bikes)', C.muted]], C.violet), ...say('CHOOSE BY VALIDATION SCORES', C.violet));
  await until(S(54)); await play(...fbox([['hyperparameters:', C.amber], '  control HOW it learns', ['fitted parameters:', C.green], '  WHAT it learns'], C.cyan),
    ...say('CHOSEN SETTINGS vs LEARNED NUMBERS', C.cyan));
}

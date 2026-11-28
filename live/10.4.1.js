// 10.4.1 Deviance: twice the log-likelihood gap from a perfect fit.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const RED = '#f87171';
  const MA = C.amber, MB = C.cyan, MC = C.pink;
  const PILL = [0, P ? 2.65 : 1.85, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.3, -0.5, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 19);
  const fade = o => new M.FadeIn(o);
  const out = o => new M.FadeOut(o);
  const lag = (a, rt = 1.2, lr = 0.1) => new M.LaggedStart(a, { lagRatio: lr, runTime: rt });

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.39;
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.56, ht = rows.length * lh + 0.3;
    const [x, y] = BOXP;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    texts.forEach((t, i) => t.moveTo([x - wd / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 5.2;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [fade(g)]; if (boxNow) a.push(out(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [out(boxNow)] : []; boxNow = null; return a; };

  // grid: 4 rows x 10 appointments
  const SX = P ? 0.52 : 0.45, GX = P ? 0 : -1.8, R = P ? 0.14 : 0.12;
  const ROWY = P ? [1.5, 0.6, -0.3, -1.2] : [0.95, 0.4, -0.15, -0.7];
  const MISS = [1, 1, 3, 5];
  const dx = k => GX + (k - 4.5) * SX;
  const kept = [], missed = [], all = [], whites = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) {
    const p = [dx(k), ROWY[r], 0];
    const d = new M.Dot({ point: p, radius: R, color: C.ink }); d.setFill(C.ink, 0.9);
    all.push(d);
    if (k < MISS[r]) {
      const halo = new M.Dot({ point: p, radius: R * 1.9, color: RED }); halo.setFill(RED, 0.25);
      const rd = new M.Dot({ point: p, radius: R, color: RED }); rd.setFill(RED, 1);
      missed.push(new M.VGroup(halo, rd));
    } else { kept.push(d); }
  }
  const NAMES = ['reminder, AM', 'reminder, PM', 'no reminder, AM', 'no reminder, PM'];
  const rowLabels = NAMES.map((s, r) => {
    const t = T(s, P ? 17 : 16, r < 2 ? C.cyan : C.ink);
    const maxw = P ? 4.0 : 2.6; if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    if (P) t.moveTo([dx(0) - 0.15 + t.getWidth() / 2, ROWY[r] + 0.47, 0]);
    else t.moveTo([dx(0) - 0.35 - t.getWidth() / 2, ROWY[r], 0]);
    return t;
  });
  // small phone icons next to reminder rows
  const phones = [0, 1].map(r => {
    const x = dx(9) + 0.48, y = ROWY[r];
    const b = new M.RoundedRectangle({ width: 0.3, height: 0.5, cornerRadius: 0.06, color: C.cyan, strokeWidth: 2.5 });
    b.setFill(C.card, 0.95); b.moveTo([x, y, 0]);
    const scr = new M.Rectangle({ width: 0.2, height: 0.3, color: C.cyan, strokeWidth: 1 }); scr.setFill(C.cyan, 0.55); scr.moveTo([x, y + 0.04, 0]);
    const btn = new M.Dot({ point: [x, y - 0.18, 0], radius: 0.03, color: C.cyan }); btn.setFill(C.cyan, 1);
    return new M.VGroup(b, scr, btn);
  });

  const box = (x1, y1, x2, y2, color) => {
    const b = new M.RoundedRectangle({ width: x2 - x1, height: y2 - y1, cornerRadius: 0.12, color, strokeWidth: 2.5 });
    b.moveTo([(x1 + x2) / 2, (y1 + y2) / 2, 0]); return b;
  };
  const half = (P ? 0.6 : 0.55) / 2;
  const gx1 = dx(0) - 0.24, gx2 = dx(9) + 0.24;
  const TAGX = P ? 3.25 : dx(9) + 1.05;
  const tag = (s, color, y) => { const p = pill(s, color, P ? 16 : 16); p.moveTo([TAGX, y, 0]); return p; };
  const rowBand = (r1, r2, color) => box(gx1, ROWY[r2] - half + 0.03, gx2, ROWY[r1] + half - 0.03, color);

  // 0-1
  await until(S(0)); await play(lag(all.map(fade), 1.6, 0.04), ...say('40 APPOINTMENTS'));
  await until(S(1)); await play(...say('WHICH RULE FITS BEST?', C.amber));
  // 2-4 dots
  await until(S(2)); await play(lag(all.slice(0, 10).map(d => new M.Indicate(d, { color: C.cyan })), 1.2), ...say('1 DOT = 1 APPOINTMENT'));
  await until(S(3)); await play(lag(missed.map(fade), 1.2), ...say('10 MISSED', RED));
  await until(S(4)); await play(lag(kept.map(d => new M.Indicate(d, { color: C.ink })), 1.6, 0.03), ...say('30 KEPT', C.ink));
  // 5-6 groups
  await until(S(5)); await play(fade(new M.VGroup(...phones)), ...rowLabels.map(fade), ...say('20 GOT A TEXT REMINDER', C.cyan));
  await until(S(6)); await play(lag(rowLabels.map(t => new M.Indicate(t, { color: C.amber })), 1.2, 0.2), ...say('EACH: 10 MORNING + 10 AFTERNOON', C.muted));
  // 7-11 three models
  await until(S(7)); await play(...say('MODEL = RULE: A MISS CHANCE FOR EACH', C.violet));
  const boxA = rowBand(0, 3, MA), tagA = tag('0.25', MA, (ROWY[0] + ROWY[3]) / 2);
  await until(S(8)); await play(out(new M.VGroup(...phones)), new M.Create(boxA), fade(tagA), ...say('MODEL A: ONE SHARED CHANCE', MA));
  await until(S(9)); await play(...fbox([['Model A', MA], '10 missed ÷ 40', ['= 1 in 4 = 0.25', MA]], MA));
  const boxB = [rowBand(0, 1, MB), rowBand(2, 3, MB)];
  const tagB = [tag('0.1', MB, (ROWY[0] + ROWY[1]) / 2), tag('0.4', MB, (ROWY[2] + ROWY[3]) / 2)];
  await until(S(10)); await play(out(boxA), out(tagA), ...clearBox(), ...boxB.map(b => new M.Create(b)), ...tagB.map(fade), ...say('MODEL B: REMINDER / NO REMINDER', MB));
  const boxC = [0, 1, 2, 3].map(r => rowBand(r, r, MC));
  const tagC = ['0.1', '0.1', '0.3', '0.5'].map((s, r) => tag(s, MC, ROWY[r]));
  await until(S(11)); await play(...boxB.map(out), ...tagB.map(out), ...boxC.map(b => new M.Create(b)), ...tagC.map(fade), ...say('MODEL C: EVERY ROW ITS OWN CHANCE', MC));
  await until(S(12)); await play(...say('FIT = SET CHANCES FROM THE RECORD', C.green));
  await until(S(13)); await play(...fbox(['with reminder:', '2 missed of 20', ['chance = 2 ÷ 20 = 0.1', MB]], MB));

  // 14-17 Model A scores
  const tagA2 = tag('0.25', MA, (ROWY[0] + ROWY[3]) / 2);
  const boxA2 = rowBand(0, 3, MA);
  const redOne = missed[2], ring = new M.Circle({ radius: R * 2.4, color: C.amber, strokeWidth: 3 }); ring.moveTo([dx(0), ROWY[2], 0]);
  await until(S(14)); await play(...boxC.map(out), ...tagC.map(out), ...clearBox(), new M.Create(boxA2), fade(tagA2), ...say('MODEL A: LOOK AT ONE RED DOT', MA));
  await play(new M.Create(ring), new M.Indicate(redOne, { color: C.amber }));
  await until(S(15)); await play(...fbox([['red dot (missed)', RED], ['score = 1 in 4 = 0.25', MA]], MA));
  const ring2 = new M.Circle({ radius: R * 2.4, color: C.ink, strokeWidth: 3 }); ring2.moveTo([dx(5), ROWY[2], 0]);
  await until(S(16)); await play(out(ring), new M.Create(ring2), ...say('KEPT: 3 CHANCES IN 4', C.ink));
  await until(S(17)); await play(...fbox([['red dot   → 0.25', RED], ['white dot → 0.75', C.ink]], MA));
  // 18-19 independent
  const ring3 = new M.Circle({ radius: R * 2.4, color: C.violet, strokeWidth: 3 }); ring3.moveTo([dx(8), ROWY[0], 0]);
  await until(S(18)); await play(new M.Create(ring3), ...say('EACH OUTCOME INDEPENDENT', C.violet));
  await until(S(19)); await play(new M.Indicate(ring2, { color: C.violet }), ...say('ONE GIVES NO CLUE ABOUT ANOTHER', C.violet));
  // 20-22 likelihood
  await until(S(20)); await play(out(ring2), out(ring3), ...say('MULTIPLY ALL 40 SCORES', C.amber),
    ...fbox(['0.25 × 0.25 × …  (10 red)', '× 0.75 × 0.75 × …  (30 white)'], MA));
  await until(S(21)); await play(...say('THIS SCORE = THE LIKELIHOOD', C.green));
  await until(S(22)); await play(...fbox(['likelihood', '= 0.25¹⁰ × 0.75³⁰', ['≈ 0.00000000017', RED]], MA), ...say('TINY!', RED));
  // 23-25 the log
  await until(S(23)); await play(...say('USE THE NATURAL LOG (LN KEY)', C.cyan));
  await until(S(24)); await play(...fbox([['log = ln', C.cyan]], C.cyan));
  await until(S(25)); await play(...fbox(['log(a × b) = log a + log b', ['multiply → add', C.green]], C.cyan), ...say('LOG TURNS × INTO +', C.green));

  // 26-29 a log ruler under the grid
  const LY = P ? -2.45 : -2.05, LX1 = P ? -3.3 : -6.2, LX2 = P ? 3.0 : 0.4;
  const lx = v => LX1 + (v + 3) / 3 * (LX2 - LX1);
  const ruler = new M.Line({ start: [LX1, LY, 0], end: [LX2, LY, 0], color: C.muted, strokeWidth: 3 });
  const rticks = [-3, -2, -1, 0].map(v => new M.VGroup(
    new M.Line({ start: [lx(v), LY - 0.08, 0], end: [lx(v), LY + 0.08, 0], color: C.muted }),
    T(v === 0 ? '0' : '−' + (-v), 15, C.muted, true).moveTo([lx(v), LY - 0.3, 0])));
  const rname = T('log', 15, C.cyan); rname.moveTo([LX1 - 0.05 + 0.0, LY + 0.32, 0]);
  const pin = (v, color, label) => {
    const d = new M.Dot({ point: [lx(v), LY, 0], radius: 0.11, color }); d.setFill(color, 1);
    const t = T(label, P ? 16 : 16, color, true); t.moveTo([lx(v), LY + 0.37, 0]);
    return new M.VGroup(d, t);
  };
  const pin1 = pin(0, C.green, '1 → 0');
  await until(S(26)); await play(new M.Create(ruler), fade(new M.VGroup(...rticks)), fade(rname), ...fbox([['log 1 = 0', C.green]], C.green));
  await play(fade(pin1));
  const neg = new M.Line({ start: [LX1, LY, 0], end: [lx(0), LY, 0], color: RED, strokeWidth: 5 });
  await until(S(27)); await play(new M.Create(neg), ...say('CHANCE BELOW 1 → LOG BELOW 0', RED));
  const pinR = pin(-1.39, RED, '0.25 → −1.39');
  await until(S(28)); await play(out(pin1), fade(pinR), ...fbox([['log 0.25 ≈ −1.39', RED]], RED));
  const pinW = pin(-0.29, C.ink, '0.75 → −0.29');
  await until(S(29)); await play(fade(pinW), ...fbox([['log 0.25 ≈ −1.39', RED], 'log 0.75 ≈ −0.29'], C.ink));

  // 30-33 add the logs
  await until(S(30)); await play(lag(missed.map(m => new M.Indicate(m, { color: RED })), 1.4),
    ...fbox(['10 red × (−1.39)', ['= −13.9', RED]], RED));
  await until(S(31)); await play(lag(kept.map(d => new M.Indicate(d, { color: C.ink })), 1.6, 0.03),
    ...fbox([['10 red:   −13.9', RED], '30 white × (−0.288)', '= −8.6'], C.ink));
  await until(S(32)); await play(...fbox([['−13.9 + (−8.6)', C.ink], ['≈ −22.5', MA]], MA));
  await until(S(33)); await play(...say('LOG-LIKELIHOOD (A) = −22.5', MA));

  // 34-39 saturated model
  const logStuff = new M.VGroup(ruler, ...rticks, rname, neg, pinR, pinW);
  const sq = all.map(d => { const s = new M.Square({ sideLength: P ? 0.42 : 0.38, color: C.violet, strokeWidth: 1.5 }); s.moveTo(d.getCenter()); return s; });
  await until(S(34)); await play(out(logStuff), out(boxA2), out(tagA2), ...clearBox(), ...say('EVERY DOT ITS OWN CHANCE', C.violet));
  await play(lag(sq.map(s => new M.Create(s)), 1.4, 0.03));
  await until(S(35)); await play(lag(missed.map(m => new M.Indicate(m, { color: RED })), 1.2), ...fbox([['red dot: chance missed = 1', RED]], C.violet));
  await until(S(36)); await play(lag(kept.map(d => new M.Indicate(d, { color: C.ink })), 1.4, 0.03), ...fbox([['red dot: chance missed = 1', RED], 'white dot: chance kept = 1'], C.violet));
  await until(S(37)); await play(...say('EVERY SCORE = 1', C.violet));
  await until(S(38)); await play(...fbox(['log 1 = 0', ['40 logs add to 0', C.violet]], C.violet));
  await until(S(39)); await play(...say('SATURATED MODEL: PERFECT FIT', C.violet));

  // 40-42 the gap and the deviance bar
  const SY = P ? 1.3 : 0.75, SX1 = P ? -3.0 : -6.0, SX2 = P ? 2.8 : 0.5;
  const sx = v => SX1 + (v + 25) / 25 * (SX2 - SX1);
  const scale = new M.Line({ start: [SX1, SY, 0], end: [SX2, SY, 0], color: C.muted, strokeWidth: 3 });
  const sname = T('log-likelihood', 16, C.muted); sname.moveTo([SX1 + 0.85, SY + 0.32, 0]);
  const mk = (v, color, label) => {
    const d = new M.Dot({ point: [sx(v), SY, 0], radius: 0.12, color }); d.setFill(color, 1);
    const t = T(label, P ? 16 : 16, color, true); t.moveTo([sx(v), SY - 0.37, 0]);
    return new M.VGroup(d, t);
  };
  const mA = mk(-22.5, MA, 'A −22.5'), mS = mk(0, C.violet, 'saturated 0');
  const gapLine = new M.Line({ start: [sx(-22.5), SY + 0.3, 0], end: [sx(0), SY + 0.3, 0], color: MA, strokeWidth: 4 });
  const gapTxt = T('gap 22.5', P ? 17 : 17, MA, true); gapTxt.moveTo([(sx(-22.5) + sx(0)) / 2, SY + 0.58, 0]);
  const grid = new M.VGroup(...all, ...missed, ...rowLabels, ...sq);
  await until(S(40)); await play(out(grid), ...clearBox(), fade(scale), fade(mA), fade(mS), ...say('FROM −22.5 TO 0', MA));
  await play(new M.Create(gapLine), fade(gapTxt));

  // bars
  const BY = P ? [-0.5, -1.2, -1.9, -2.6] : [-0.7, -1.3, -1.9, -2.5];
  const BX0 = P ? -2.6 : -5.6, BLEN = P ? 4.8 : 5.6, BH = P ? 0.36 : 0.36;
  const bar = (i, val, color, name) => {
    const w = Math.max(0.02, val / 45 * BLEN);
    const r = new M.Rectangle({ width: w, height: BH, color, strokeWidth: 1.5 }); r.setFill(color, 0.75);
    r.moveTo([BX0 + w / 2, BY[i], 0]);
    const n = T(name, P ? 15 : 16, color, true); n.moveTo([BX0 - 0.3 - n.getWidth() / 2, BY[i], 0]);
    const v = T(val.toFixed(1), P ? 18 : 18, color, true); v.moveTo([BX0 + w + 0.2 + v.getWidth() / 2, BY[i], 0]);
    return { r, n, v, g: new M.VGroup(r, n, v) };
  };
  const bA = bar(0, 45.0, MA, 'A'), bB = bar(1, 39.9, MB, 'B'), bC = bar(2, 39.1, MC, 'C');
  await until(S(41)); await play(fade(bA.n), new M.FadeIn(bA.r, { shift: [0.3, 0, 0] }), fade(bA.v),
    ...fbox(['2 × 22.5', ['= 45.0', MA]], MA), ...say('DOUBLE THE GAP', MA));
  await until(S(42)); await play(new M.Indicate(bA.v, { color: MA }), ...say('DOUBLED GAP = DEVIANCE', MA));

  // 43-46 B and C
  const scaleStuff = new M.VGroup(scale, sname, mA, mS, gapLine, gapTxt);
  await until(S(43)); await play(out(scaleStuff), ...fbox([['Model B', MB], 'missed with reminder: 0.1', 'missed without: 0.4'], MB), ...say('SAME STEPS FOR B', MB));
  await until(S(44)); await play(fade(bB.g), ...fbox([['Model B', MB], 'log-likelihood −19.96', ['deviance ≈ 39.9', MB]], MB));
  await until(S(45)); await play(fade(bC.g), ...fbox([['Model C', MC], 'chances 0.1, 0.1, 0.3, 0.5', ['deviance ≈ 39.1', MC]], MC), ...say('C: EACH ROW ITS OWN CHANCE', MC));
  await until(S(46)); await play(new M.Indicate(bC.r, { color: MC }), ...say('SHORTEST BAR = CLOSEST FIT', C.green));

  // 47-49 the rule
  await until(S(47)); await play(...fbox(['saturated − model', '(log-likelihoods)', ['A: 0 − (−22.5) = 22.5', MA]], C.violet));
  await until(S(48)); await play(...fbox(['deviance', '= 2 × (saturated − model)', ['A: 2 × 22.5 = 45.0', MA]], C.green), ...say('DEVIANCE = 2 × DIFFERENCE', C.green));
  await until(S(49)); await play(lag([bA.r, bB.r, bC.r].map(r => new M.Indicate(r, { color: C.green })), 1.4, 0.3), ...say('COMPARE FITS ON THE SAME DATA', C.green));

  // 50-51 the trap
  const bS = bar(3, 0, C.violet, 'sat.');
  await until(S(50)); await play(fade(bS.g), ...say('TRAP: DEVIANCE 0 IS NOT BEST', RED));
  const q = T('new patient?  no rule', P ? 15 : 16, RED, true); q.moveTo([BX0 + 1.0 + q.getWidth() / 2, BY[3], 0]);
  await until(S(51)); await play(fade(q), ...fbox([['saturated = memory', C.violet], ['no rule for a new one', RED]], RED), ...say('IT ONLY MEMORISES', RED));

  // 52-54 C vs B
  await until(S(52)); await play(out(q), ...fbox([['C with shared chances:', MC], '0.1, 0.1, 0.4, 0.4', ['= Model B', MB]], MC), ...say('C CAN COPY B', MC));
  await until(S(53)); await play(new M.Indicate(bC.v, { color: MC }), ...fbox(['more chances to set', ['→ C 39.1 < B 39.9', MC]], MC), ...say('MORE CHANCES → CLOSER FIT', MC));
  await until(S(54)); await play(...fbox(['deviance =', '2 × (0 − log-likelihood)', ['shorter bar = closer fit', C.green]], C.green), ...say('DEVIANCE: SHORTER = CLOSER', C.green));
}

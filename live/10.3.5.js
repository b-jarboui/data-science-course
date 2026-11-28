// 10.3.5 Exposure offsets. Beat i = sentence i. Lina: full year, 2 visits. Omar: half year (from July), 2 visits.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const TEAL = '#40D9C2', RED = '#F87181';
  const CX = P ? 0 : -2.55;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.25, -0.15, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ---------- helpers ----------
  const tx = (s, size, color, pos, mono = false, maxW = 0) => { const t = T(s, size, color, mono); if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth()); t.moveTo(pos); return t; };
  const ln = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dl = (a, b, color = C.muted) => new M.DashedLine({ start: a, end: b, color });
  const dot = (p, color = TEAL, r = 0.09) => { const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1); return d; };
  const bar = (w, h, p, color, op = 0.8) => { const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1.5 }); r.setFill(color, op); r.moveTo(p); return r; };
  const tag = (s, color, p, size = 15) => { const t = pill(s, color, size); t.moveTo(p); return t; };
  const arrow = (a, b, color = C.amber, w = 3) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, h = Math.min(0.16, l * 0.35), q = h * 0.6;
    return new M.VGroup(ln(a, b, color, w), ln(b, [b[0] - h * ux - q * uy, b[1] - h * uy + q * ux, 0], color, w), ln(b, [b[0] - h * ux + q * uy, b[1] - h * uy - q * ux, 0], color, w));
  };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x));
  let pic = [], mk = [];
  const picture = (...o) => { const n = o.filter(Boolean); const a = [...fout(...pic, ...mk), ...fin(...n)]; pic = n; mk = []; return a; };
  const add = (...o) => { const n = o.filter(Boolean); pic.push(...n); return fin(...n); };
  const marks = (...o) => { const n = o.filter(Boolean); const a = [...fout(...mk), ...fin(...n)]; mk = n; return a; };
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [new M.FadeOut(boxNow)] : [];
    if (!lines) { boxNow = null; return a; }
    const size = P ? 21 : 20, lh = P ? 0.39 : 0.43;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.64, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const sc = Math.min(1, (P ? FW - 1.1 : 4.35) / wd, (P ? 1.75 : 3.6) / ht);
    if (sc < 1) g.scale(sc);
    g.moveTo(BOXP);
    a.push(new M.FadeIn(g)); boxNow = g; return a;
  }
  function patient(p, color = TEAL, s = 1) {
    const head = new M.Circle({ radius: 0.13 * s, color }); head.setFill(color, 1); head.moveTo([p[0], p[1] + 0.2 * s, 0]);
    const body = new M.Arc({ radius: 0.23 * s, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 0.85); body.moveTo([p[0], p[1] - 0.05 * s, 0]);
    return new M.VGroup(head, body);
  }

  // ---------- picture A: time bars ----------
  const TX0 = CX - (P ? 3.2 : 3.3), TX1 = CX + (P ? 3.2 : 3.3);
  const mx = m => TX0 + m / 12 * (TX1 - TX0);     // months since January 1
  const YL = P ? 0.2 : 0.75, YO = P ? -2.0 : -0.55, YA = P ? -3.9 : -1.6, BH = P ? 0.42 : 0.34;
  const axis = new M.VGroup(ln([TX0, YA, 0], [TX1, YA, 0], C.muted, 2),
    ...[0, 6, 12].map(m => ln([mx(m), YA - 0.07, 0], [mx(m), YA + 0.07, 0], C.muted, 2)),
    tx('Jan', 15, C.muted, [mx(0), YA - 0.28, 0]), tx('Jul', 15, C.muted, [mx(6), YA - 0.28, 0]), tx('end of year', 15, C.muted, [mx(12) - 0.3, YA - 0.28, 0]));
  const linaBar = bar(mx(12) - mx(0), BH, [(mx(0) + mx(12)) / 2, YL, 0], TEAL, 0.3);
  const omarBar = bar(mx(12) - mx(6), BH, [(mx(6) + mx(12)) / 2, YO, 0], C.violet, 0.3);
  const linaName = tx('Lina', 18, TEAL, [mx(0) + 0.35, YL + 0.45, 0]);
  const omarName = tx('Omar', 18, C.violet, [mx(6) + 0.4, YO + 0.45, 0]);
  const linaDots = [3, 9].map(m => dot([mx(m), YL, 0], C.amber, 0.12));
  const omarDots = [8, 11].map(m => dot([mx(m), YO, 0], C.amber, 0.12));

  // 0 two patients
  const pl = patient([CX - 1.4, P ? 0.2 : 0.3, 0], TEAL, 1.3), po = patient([CX + 1.4, P ? 0.2 : 0.3, 0], C.violet, 1.3);
  const nl = tx('Lina', 20, TEAL, [CX - 1.4, P ? -0.45 : -0.35, 0]), no = tx('Omar', 20, C.violet, [CX + 1.4, P ? -0.45 : -0.35, 0]);
  const sub = tx('1 condition each · 2 visits each', 17, C.muted, [CX, P ? -1.05 : -0.95, 0], false, P ? 7 : 7);
  await until(S(0)); await play(...picture(pl, po, nl, no, sub), ...say('LINA AND OMAR: 2 VISITS EACH', TEAL));
  // 1 same pace?
  await until(S(1)); await play(...say('THE SAME PACE?', C.amber));
  // 2 Lina's full-year bar
  await until(S(2)); await play(...picture(axis, linaBar, linaName), ...say('LINA: A FULL YEAR', TEAL));
  await play(...add(...linaDots));
  // 3 Omar half-year bar
  await until(S(3)); await play(...add(omarBar, omarName), ...say('OMAR JOINS IN JULY', C.violet));
  await play(...add(...omarDots));
  // 4 both have two dots, Omar's half as long
  const halfTag = tag('HALF AS LONG', C.violet, [mx(3), YO, 0], 15);
  await until(S(4)); await play(...marks(halfTag), new M.LaggedStart([...linaDots, ...omarDots].map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...say('2 DOTS EACH · OMAR’S BAR IS HALF', C.violet));
  // 5 copy beside the first half
  const copyBar = bar(mx(6) - mx(0), BH, [(mx(0) + mx(6)) / 2, YO, 0], C.violet, 0.12);
  const copyDots = [2, 5].map(m => dot([mx(m), YO, 0], C.violet, 0.11));
  await until(S(5)); await play(...marks(), ...add(copyBar, ...copyDots), ...say('COPY OMAR’S HALF YEAR', C.violet));
  // 6 four visits in a year
  const fourTag = tag('4 VISITS IN A YEAR', C.amber, [mx(6), YO - 0.6, 0], 15);
  await until(S(6)); await play(...add(fourTag), ...fbox(['same pace:', '2 + 2 = 4', ['4 visits per year', C.amber]], C.amber), ...say('SAME PACE → 4 IN A YEAR', C.amber));
  // 7 rate
  await until(S(7)); await play(...fbox([['RATE', C.cyan], 'visits per', 'stretch of time'], C.cyan), ...say('RATE = VISITS PER TIME', C.cyan));
  // 8 Lina's rate
  const linaRate = tag('2 PER YEAR', TEAL, [mx(9), YL + 0.55, 0], 15);
  await until(S(8)); await play(...add(linaRate), ...fbox(['Lina:', '2 visits ÷ 1 year', ['= 2 per year', TEAL]], TEAL), ...say('LINA: 2 VISITS PER YEAR', TEAL));
  // 9 Omar's rate
  await until(S(9)); await play(...fout(copyBar, ...copyDots), ...fbox(['Omar:', '2 visits ÷ ½ year', ['= 4 per year', C.violet]], C.violet), ...say('OMAR: 4 VISITS PER YEAR', C.violet));
  pic = pic.filter(o => ![copyBar, ...copyDots].includes(o));
  // 10 exposure
  const brL = new M.VGroup(ln([mx(0), YL - 0.3, 0], [mx(12), YL - 0.3, 0], TEAL, 2), tx('exposure 1 year', 15, TEAL, [mx(6), YL - 0.52, 0]));
  const brO = new M.VGroup(ln([mx(6), YO - 0.3, 0], [mx(12), YO - 0.3, 0], C.violet, 2), tx('exposure ½ year', 15, C.violet, [mx(9), YO - 0.52, 0]));
  await until(S(10)); await play(...fout(fourTag), ...marks(brL, brO), ...fbox([['EXPOSURE', C.green], 'the time we watch', 'each person'], C.green), ...say('TIME WATCHED = EXPOSURE', C.green));
  pic = pic.filter(o => o !== fourTag);
  // 11-17 what the model predicts
  await until(S(11)); await play(...fbox(['the clinic’s model:', ['what does it expect?', C.amber]], C.amber), ...say('WHAT DOES THE MODEL PREDICT?', C.amber));
  await until(S(12)); await play(...fbox(['1 condition', ['model rate =', C.amber], ['2 visits per year', C.amber]], C.amber), ...say('MODEL: 2 VISITS PER YEAR', C.amber));
  await until(S(13)); await play(new M.Indicate(brL.submobjects[1], { color: TEAL }), ...say('LINA: 1 YEAR WATCHED', TEAL));
  const expL = tag('EXPECTED 2', C.amber, [mx(3), YL + 0.55, 0], 15);
  await until(S(14)); await play(...add(expL), ...fbox(['Lina:', '1 year × 2 per year', ['= 2 expected visits', C.amber]], C.amber), ...say('1 × 2 = 2 EXPECTED', C.amber));
  await until(S(15)); await play(new M.Indicate(brO.submobjects[1], { color: C.violet }), ...say('OMAR: HALF A YEAR WATCHED', C.violet));
  const expO = tag('EXPECTED 1', C.amber, [mx(9), YO + 0.55, 0], 15);
  await until(S(16)); await play(...add(expO), ...fbox(['Omar:', '½ year × 2 per year', ['= 1 expected visit', C.amber]], C.amber), ...say('½ × 2 = 1 EXPECTED', C.amber));
  await until(S(17)); await play(new M.LaggedStart(omarDots.map(d => new M.Indicate(d, { color: RED })), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox(['Omar:', 'seen 2, expected 1', ['twice as many', RED]], RED), ...say('OMAR: TWICE WHAT IS EXPECTED', RED));

  // ---------- picture B: the growth curve ----------
  const GY0 = P ? -4.0 : -2.4, GY1 = P ? 1.1 : 1.25;
  const HX0 = CX - (P ? 3.3 : 3.4), HX1 = CX + (P ? 3.3 : 3.4);
  const hx = s => HX0 + (s + 1.0) / 2.2 * (HX1 - HX0);
  const hy = v => GY0 + v / 3.2 * (GY1 - GY0);
  const curve = new M.VGroup(...Array.from({ length: 36 }, (_, i) => {
    const s0 = -1.0 + i * 2.15 / 36, s1 = s0 + 2.15 / 36;
    return ln([hx(s0), hy(Math.exp(s0)), 0], [hx(s1), hy(Math.exp(s1)), 0], C.cyan, 3.5);
  }));
  const cAxes = new M.VGroup(ln([HX0, GY0, 0], [HX1, GY0, 0], C.muted, 2), ln([hx(0), GY0, 0], [hx(0), GY1, 0], C.muted, 1.5),
    ...[[-0.69, '−0.69'], [0, '0'], [0.69, '0.69']].map(([s, t]) => tx(t, 15, C.muted, [hx(s), GY0 - 0.27, 0], true)),
    tx('score', 15, C.violet, [HX1 - 0.4, GY0 - 0.3, 0]),
    ...[1, 2, 3].map(v => tx(String(v), 16, C.muted, [hx(0) - 0.4, hy(v), 0], true)),
    tx('expected count', 15, C.cyan, [hx(0) - 1.25, GY1 + 0.1, 0]));
  await until(S(18)); await play(...fbox(null), ...picture(), ...say('CAN THE SCORE DO THIS?', C.violet));
  await until(S(19)); await play(...picture(cAxes), new M.Create(curve), ...say('THE GROWTH CURVE AGAIN', C.cyan));
  pic.push(curve);
  // 20 adding to score multiplies
  const p1 = dot([hx(0), hy(1), 0], C.muted, 0.09), p2 = dot([hx(0.69), hy(2), 0], C.amber, 0.12);
  const rightArr = arrow([hx(0) + 0.05, GY0 + 0.3, 0], [hx(0.69) - 0.05, GY0 + 0.3, 0], C.green, 2.5);
  const rightTxt = tx('+0.69 → ×2', 15, C.green, [(hx(0) + hx(0.69)) / 2, GY0 + 0.58, 0], true);
  await until(S(20)); await play(...add(p1, p2), ...marks(rightArr, rightTxt), ...fbox(['add to the score', ['→ count × something', C.green]], C.green), ...say('ADD TO SCORE → MULTIPLY COUNT', C.green));
  // 21 moving left smaller
  const leftArr = arrow([hx(0.5), hy(0.6), 0], [hx(-0.6), hy(0.6), 0], C.amber, 2.5);
  await until(S(21)); await play(...marks(leftArr), ...say('MOVE LEFT → SMALLER', C.amber));
  // 22 halve: move left 0.69
  const halfArr = arrow([hx(0.69) - 0.05, GY0 + 0.3, 0], [hx(0) + 0.05, GY0 + 0.3, 0], C.amber, 2.5);
  const halfTxt = tx('−0.69 → ½', 15, C.amber, [(hx(0) + hx(0.69)) / 2, GY0 + 0.58, 0], true);
  await until(S(22)); await play(...marks(halfArr, halfTxt), ...fbox(['to halve the count:', ['move left ≈ 0.69', C.amber]], C.amber), ...say('HALVE IT: MOVE LEFT 0.69', C.amber));
  // 23 Omar from 2 to 1
  const omarPt = tag('OMAR 2 → 1', C.violet, [hx(0) + 1.0, hy(1) - 0.05, 0], 15);
  const omarDot = dot([hx(0), hy(1), 0], C.violet, 0.13);
  await until(S(23)); await play(...add(omarDot, omarPt), ...say('OMAR: EXPECTED 2 → 1', C.violet));
  // 24 Lina stays
  const linaPt = tag('LINA STAYS AT 2', TEAL, P ? [hx(0.69) - 1.05, hy(2) + 0.45, 0] : [hx(0.69) + 1.2, hy(2) - 0.38, 0], 15);
  await until(S(24)); await play(...add(linaPt), new M.Indicate(p2, { color: TEAL }), ...say('LINA: FULL YEAR, NO MOVE', TEAL));
  // 25-28 log of multiplier
  await until(S(25)); await play(...marks(), ...fbox([['log of a multiplier', C.violet], '= how far to move', 'on the score scale'], C.violet), ...say('LOG = HOW FAR TO MOVE', C.violet));
  await until(S(26)); await play(...fbox(['Lina: × 1', ['log 1 = 0', C.violet], 'no move'], TEAL), new M.Indicate(linaPt.submobjects[1], { color: TEAL }), ...say('LOG OF 1 = 0', TEAL));
  await until(S(27)); await play(...fbox(['Omar: × ½', ['log ½ ≈ −0.69', C.violet], 'score falls'], C.violet), ...marks(halfArr, halfTxt), ...say('LOG OF ½ ≈ −0.69', C.violet));
  await until(S(28)); await play(...fbox([['EXPOSURE OFFSET', C.green], '= log(time watched)', 'fixed adjustment', 'to the score'], C.green), ...say('LOG OF TIME = EXPOSURE OFFSET', C.green));
  // 29-33 the rule
  await until(S(29)); await play(...marks(), ...say('THE COUNT RULE IN WORDS', C.cyan));
  await until(S(30)); await play(...fbox(['expected count =', ['time watched', C.green], ['× expected rate', C.amber]], C.cyan), ...say('COUNT = TIME × RATE', C.cyan));
  await until(S(31)); await play(...fbox(['expected rate', ['= e ^ score', C.cyan], '(before the time', ' adjustment)'], C.cyan), ...say('RATE = e TO THE SCORE', C.cyan));
  await until(S(32)); await play(...fbox(['log(expected count)', ['= log(time)', C.green], ['+ usual score', C.violet]], C.violet), ...say('LOG COUNT = LOG TIME + SCORE', C.violet));
  await until(S(33)); await play(...fbox(['log(time) is added once', ['multiplier fixed at 1', C.green], 'not learned'], C.green), ...say('COEFFICIENT FIXED AT 1', C.green));
  // 34 use
  await until(S(34)); await play(...fbox(['use an offset to', ['compare rates', C.green], 'over different times'], C.green), ...say('COMPARE RATES OVER DIFFERENT TIMES', C.green));

  // ---------- picture C: the trap ----------
  const KX = P ? [-1.6, 1.6] : [CX - 1.6, CX + 1.6], KB = P ? -4.4 : -2.3, KU = P ? 1.2 : 0.75;
  const kAxis = new M.VGroup(ln([KX[0] - 1.3, KB, 0], [KX[1] + 1.3, KB, 0], C.muted, 2),
    tx('½ year', 17, C.muted, [KX[0] - 0.55, KB - 0.27, 0]), tx('1 year', 17, C.muted, [KX[0] + 0.55, KB - 0.27, 0]),
    tx('½ year', 17, C.muted, [KX[1] - 0.55, KB - 0.27, 0]), tx('1 year', 17, C.muted, [KX[1] + 0.55, KB - 0.27, 0]),
    tx('offset (fixed)', 16, C.green, [KX[0], KB - 0.68, 0]), tx('model chooses', 16, RED, [KX[1], KB - 0.68, 0]),
    tx('expected visits', 17, C.muted, [CX, KB + 4.6 * KU, 0]));
  const kb = (x, v, color, op) => bar(0.7, v * KU, [x, KB + v * KU / 2, 0], color, op);
  const offBars = [kb(KX[0] - 0.55, 1, C.green, 0.75), kb(KX[0] + 0.55, 2, C.green, 0.75)];
  const offNums = [tx('1', 16, C.ink, [KX[0] - 0.55, KB + 1 * KU + 0.22, 0], true), tx('2', 16, C.ink, [KX[0] + 0.55, KB + 2 * KU + 0.22, 0], true)];
  const freeBars = [kb(KX[1] - 0.55, 1, RED, 0.6), kb(KX[1] + 0.55, 1.5, RED, 0.6)];
  const dbl = dl([KX[1] + 0.15, KB + 2 * KU, 0], [KX[1] + 0.95, KB + 2 * KU, 0], C.green);
  const lessTxt = tx('less than double', 16, RED, [KX[1] + 0.55, KB + 2 * KU + 0.25, 0]);
  await until(S(35)); await play(...picture(kAxis, ...offBars, ...offNums), ...fbox([['TRAP', RED], 'letting the model', 'choose how much', 'log(time) to add'], RED), ...say('TRAP: LET THE MODEL CHOOSE?', RED));
  await until(S(36)); await play(...add(...freeBars, dbl, lessTxt), ...say('DOUBLE TIME, LESS THAN DOUBLE VISITS', RED));
  await until(S(37)); await play(new M.LaggedStart(offBars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox(['exposure offset:', ['count grows in step', C.green], ['with time watched', C.green]], C.green), ...say('COUNT GROWS IN STEP WITH TIME', C.green));
}

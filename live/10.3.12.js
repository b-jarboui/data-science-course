// 10.3.12 Quantile regression. Beat i = sentence i. Log 5: morning 5,5,10,10,10,15,15,20,40; afternoon 10,10,15,20,20,25,30,40,60.
// Cost: too low 4 tokens per minute, too high 1 token per minute. Morning: 15→155, 20→150, 25→170, 40→230. Afternoon: 30→240, 35→235, 40→230, 45→250.
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
  const outline = (w, h, p, color) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth: 2 }); r.setFill(color, 0.04); r.moveTo(p); return r; };
  const tag = (s, color, p, size = 15) => { const t = pill(s, color, size); t.moveTo(p); return t; };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x));
  let pic = [], mk = [];
  const picture = (...o) => { const n = o.filter(Boolean); const a = [...fout(...pic, ...mk), ...fin(...n)]; pic = n; mk = []; return a; };
  const add = (...o) => { const n = o.filter(Boolean); pic.push(...n); return fin(...n); };
  const drop = (...o) => { pic = pic.filter(x => !o.includes(x)); return fout(...o); };
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

  // ---------- data ----------
  const AM = [5, 5, 10, 10, 10, 15, 15, 20, 40], PM = [10, 10, 15, 20, 20, 25, 30, 40, 60];

  // ---------- layout ----------
  const MX0 = P ? -3.4 : CX - 3.5, MX1 = P ? 3.4 : CX + 3.5;
  const mx = v => MX0 + v / 60 * (MX1 - MX0);
  const DY0 = P ? 0.35 : 0.5, DP = P ? 0.28 : 0.25;
  const LY0 = P ? -4.3 : -2.5, LY1 = P ? -1.2 : -0.85;
  const ly = v => LY0 + (v - 140) / 120 * (LY1 - LY0);
  const gx = g => MX0 + 0.3 + (g - 10) / 40 * (MX1 - MX0 - 0.6);
  const axis = new M.VGroup(ln([MX0, DY0, 0], [MX1, DY0, 0], C.muted, 2),
    ...[0, 10, 20, 30, 40, 50, 60].map(v => tx(String(v), 15, C.muted, [mx(v), DY0 - 0.24, 0], true)),
    tx('minutes', 15, C.muted, [MX1 - 0.35, DY0 - 0.52, 0]));
  const dotsOf = (data, color) => { const used = {}; return data.map(v => { const j = used[v] || 0; used[v] = j + 1; return dot([mx(v), DY0 + 0.17 + j * DP, 0], color, 0.1); }); };
  const posOf = data => { const used = {}; return data.map(v => { const j = used[v] || 0; used[v] = j + 1; return [mx(v), DY0 + 0.17 + j * DP, 0]; }); };
  let marker = null;
  const markerObj = (g, color = C.amber) => new M.VGroup(ln([mx(g), DY0 - 0.05, 0], [mx(g), DY0 + 1.05, 0], color, 3.5),
    tag('GUESS ' + g, color, [mx(g), DY0 - 0.64, 0], 15));
  const setMarker = g => { const n = markerObj(g); const a = [...fout(marker), ...fin(n)]; marker = n; return a; };
  // loss chart
  const lossAxes = new M.VGroup(ln([MX0, LY0, 0], [MX1, LY0, 0], C.muted, 1.6), ln([MX0, LY0, 0], [MX0, LY1, 0], C.muted, 1.6),
    tx('loss (tokens)', 16, RED, [MX0 + 0.85, LY1 + 0.2, 0]), tx('guess (minutes)', 15, C.muted, [(MX0 + MX1) / 2, LY0 - 0.5, 0]));
  const lossPt = (g, v) => new M.VGroup(dot([gx(g), ly(v), 0], RED, 0.1), tx(String(v), 16, RED, [gx(g), ly(v) + 0.26, 0], true), tx(String(g), 15, C.muted, [gx(g), LY0 - 0.2, 0], true));
  const seg = (a, b) => ln([gx(a[0]), ly(a[1]), 0], [gx(b[0]), ly(b[1]), 0], RED, 2.5);
  const gaps = (data, g) => posOf(data).map((p, i) => data[i] === g ? null : ln([mx(g), p[1], 0], [p[0], p[1], 0], data[i] > g ? RED : TEAL, 3)).filter(Boolean);

  // 0-2
  await until(S(0)); await play(...say('A TIME THAT COVERS MOST?', C.amber));
  await until(S(1)); await play(...fbox(['a time that', ['at least 80%', C.amber], 'of patients', 'do not exceed'], C.amber), ...say('AT LEAST 80% WAIT LESS OR EQUAL', C.amber));
  const am = dotsOf(AM, TEAL);
  const amLab = tx('9 morning waits', 17, TEAL, [mx(51), DY0 + 0.75, 0]);
  await until(S(2)); await play(...add(axis, amLab), new M.LaggedStart(am.map(d => new M.FadeIn(d)), { lagRatio: 0.15, runTime: 2 }), ...say('9 MORNING WAITS, SHORT → LONG', TEAL));
  pic.push(...am);
  await until(S(3)); await play(...setMarker(20), ...say('MARKER AT 20 MINUTES', C.amber));
  const leftBox = outline(mx(20) - mx(5) + 0.5, 1.0, [(mx(5) + mx(20)) / 2, DY0 + 0.45, 0], TEAL);
  await until(S(4)); await play(...marks(leftBox), ...fbox(['at or left of 20:', ['8 of 9 dots', TEAL], '8 ÷ 9 ≈ 89%'], TEAL), ...say('8 OF 9 AT OR BELOW 20', TEAL));
  await until(S(5)); await play(...marks(), new M.Indicate(am[8], { color: RED }), ...say('ONLY THE 40-MINUTE WAIT IS LONGER', RED));
  await until(S(6)); await play(...fbox([['QUANTILE', C.amber], 'a cutoff for', 'a chosen share'], C.amber), ...say('THIS CUTOFF = A QUANTILE', C.amber));
  await until(S(7)); await play(...fbox(['morning or', 'afternoon:', ['different cutoffs?', C.violet]], C.violet), ...say('MORNING vs AFTERNOON?', C.violet));
  // 8-11 the token game
  await until(S(8)); await play(...fbox(['pay tokens when', 'your guess differs', 'from a wait'], C.amber), ...say('PAY TOKENS FOR A MISS', C.amber));
  await until(S(9)); await play(...fbox([['guess too LOW:', RED], ['4 tokens per minute', RED]], RED), ...say('TOO LOW: 4 TOKENS PER MINUTE', RED));
  await until(S(10)); await play(...fbox([['too LOW: 4 / minute', RED], ['too HIGH: 1 / minute', TEAL]], C.amber), ...say('TOO HIGH: 1 TOKEN PER MINUTE', TEAL));
  await until(S(11)); await play(new M.Indicate(am[7], { color: C.green }), ...fbox([['too LOW: 4 / minute', RED], ['too HIGH: 1 / minute', TEAL], ['on a dot: 0', C.green]], C.amber), ...say('ON A DOT: NO COST', C.green));
  // 12-16 guess 15
  await until(S(12)); await play(...setMarker(15), ...say('TRY 15 MINUTES', C.amber));
  const gap40 = new M.VGroup(ln([mx(15), posOf(AM)[8][1], 0], [mx(40), posOf(AM)[8][1], 0], RED, 3.5), tx('25 too low', 15, RED, [mx(27.5), posOf(AM)[8][1] + 0.22, 0]));
  await until(S(13)); await play(...marks(gap40), ...say('40-MIN WAIT: 25 MINUTES TOO LOW', RED));
  await until(S(14)); await play(...fbox(['25 minutes × 4', ['= 100 tokens', RED]], RED), ...say('25 × 4 = 100 TOKENS', RED));
  const p15 = lossPt(15, 155);
  await until(S(15)); await play(...marks(...gaps(AM, 15)), ...add(lossAxes, p15), ...fbox(['too low: 20 & 40 → 120', 'too high: 10+10+5+5+5 → 35', ['total = 155 tokens', RED]], RED), ...say('ALL DOTS: 155 TOKENS', RED));
  await until(S(16)); await play(...fbox([['LOSS', RED], 'the total cost', 'of a guess'], RED), ...say('THE TOTAL COST = THE LOSS', RED));
  // 17-21 guess 20
  await until(S(17)); await play(...marks(), ...setMarker(20), ...say('MOVE TO 20', C.amber));
  const gap40b = new M.VGroup(ln([mx(20), posOf(AM)[8][1], 0], [mx(40), posOf(AM)[8][1], 0], RED, 3.5), tx('20 × 4 = 80', 15, RED, [mx(30), posOf(AM)[8][1] + 0.22, 0], true));
  await until(S(18)); await play(...marks(gap40b), ...fbox(['40 − 20 = 20 too low', ['20 × 4 = 80 tokens', RED]], RED), ...say('40-MIN WAIT NOW COSTS 80', RED));
  const leftGaps = gaps(AM.slice(0, 7), 20);
  await until(S(19)); await play(...marks(gap40b, ...leftGaps), ...say('NOW THE SHORTER WAITS', TEAL));
  await until(S(20)); await play(...fbox(['15+15+10+10+10+5+5', ['= 70 minutes over', TEAL], ['= 70 tokens', TEAL]], TEAL), ...say('GAPS ADD TO 70 → 70 TOKENS', TEAL));
  const p20 = lossPt(20, 150), s1520 = seg([15, 155], [20, 150]);
  await until(S(21)); await play(...add(p20, s1520), ...fbox(['80 + 70', ['= 150 tokens', RED]], RED), ...say('LOSS FALLS TO 150', RED));
  // 22-26 guess 25 and the dip
  await until(S(22)); await play(...marks(...gaps(AM, 25)), ...setMarker(25), ...say('TRY 25', C.amber));
  const p25 = lossPt(25, 170), s2025 = seg([20, 150], [25, 170]);
  await until(S(23)); await play(...add(p25, s2025), ...fbox(['guess 25', ['loss = 170', RED]], RED), ...say('LOSS RISES TO 170', RED));
  const minAM = tag('LOWEST', C.green, [gx(20), ly(150) + 0.66, 0], 15);
  await until(S(24)); await play(...marks(), ...setMarker(20), ...add(minAM), ...say('MORNING: LOWEST LOSS AT 20', C.green));
  await until(S(25)); await play(...fbox(['from 20, moving', 'either way', ['adds more than', RED], ['it saves', RED]], C.green), ...say('ANY MOVE COSTS MORE', C.green));
  const p40 = lossPt(40, 230), s2540 = seg([25, 170], [40, 230]);
  await until(S(26)); await play(...add(p40, s2540), new M.Indicate(p20, { color: C.green }), ...say('THE LOSS LINE DIPS AT 20', C.green));
  // 27-33 afternoon
  const pm = dotsOf(PM, C.violet);
  const pmLab = tx('9 afternoon waits', 17, C.violet, [mx(50), DY0 + 0.75, 0]);
  const morningDone = [amLab, ...am, p15, p20, p25, p40, s1520, s2025, s2540, minAM];
  await until(S(27)); await play(...fbox(null), ...drop(...morningDone), ...fout(marker), ...add(pmLab), new M.LaggedStart(pm.map(d => new M.FadeIn(d)), { lagRatio: 0.12, runTime: 1.6 }), ...say('NOW THE 9 AFTERNOON WAITS', C.violet));
  marker = null; pic.push(...pm);
  const q30 = lossPt(30, 240);
  await until(S(28)); await play(...setMarker(30), ...add(q30), ...say('GUESS 30: LOSS 240', RED));
  const q35 = lossPt(35, 235), t1 = seg([30, 240], [35, 235]);
  await until(S(29)); await play(...setMarker(35), ...add(q35, t1), ...say('MOVE RIGHT: 35', C.amber));
  await until(S(30)); await play(new M.Indicate(q35, { color: RED }), ...say('LOSS FALLS TO 235', RED));
  const q40 = lossPt(40, 230), t2 = seg([35, 235], [40, 230]);
  await until(S(31)); await play(...setMarker(40), ...add(q40, t2), ...say('AT 40: LOSS 230', RED));
  const q45 = lossPt(45, 250), t3 = seg([40, 230], [45, 250]);
  await until(S(32)); await play(...setMarker(45), ...add(q45, t3), ...say('AT 45: LOSS RISES TO 250', RED));
  const minPM = tag('LOWEST', C.green, [gx(40), ly(230) - 0.42, 0], 15);
  await until(S(33)); await play(...setMarker(40), ...add(minPM), ...fbox(['afternoon cutoff', ['40 minutes', C.green]], C.green), ...say('AFTERNOON: LOWEST AT 40', C.green));
  await until(S(34)); await play(...fbox([['QUANTILE REGRESSION', C.amber], 'cutoff from facts', 'like the session', 'morning 20 · afternoon 40'], C.amber), ...say('= QUANTILE REGRESSION', C.amber));
  // 35-38 why 4 and 1: five parts
  const PX = P ? [-2.0, -1.0, 0, 1.0, 2.0] : [CX - 2, CX - 1, CX, CX + 1, CX + 2];
  const PY = P ? -2.6 : -1.3;
  const parts = PX.map((x, i) => bar(0.85, 0.85, [x, PY, 0], i < 4 ? RED : TEAL, 0.75));
  const partLab = [tx('4 for too low', 15, RED, [(PX[0] + PX[3]) / 2, PY - 0.7, 0]), tx('1 for too high', 15, TEAL, [PX[4], PY - 0.7, 0], false, 1.4)];
  await until(S(35)); await play(...fbox(null), ...fout(marker), ...picture(), ...say('WHY 4 AND 1?', C.amber));
  marker = null;
  await until(S(36)); await play(...add(...parts), ...say('4 + 1 = 5 PARTS', C.amber));
  await until(S(37)); await play(...add(...partLab), ...fbox(['4 of 5 parts', ['= 80%', C.amber]], C.amber), ...say('4 OF 5 = 80%', C.amber));
  const brace = new M.VGroup(ln([PX[0] - 0.42, PY + 0.6, 0], [PX[3] + 0.42, PY + 0.6, 0], C.amber, 3), tx('80%', 18, C.amber, [(PX[0] + PX[3]) / 2, PY + 0.85, 0], true));
  await until(S(38)); await play(...add(brace), ...fbox(['low guesses cost more', ['→ cutoff moves up', C.amber], ['to the 80% point', C.amber]], C.amber), ...say('PUSHES THE CUTOFF TO 80%', C.amber));
  // 39-41 the rule
  await until(S(39)); await play(...say('THE RULE IN WORDS', C.cyan));
  await until(S(40)); await play(...fbox(['loss =', [' 4 × minutes too low', RED], ['+ 1 × minutes too high', TEAL]], C.cyan), ...say('LOSS = 4 × LOW + HIGH', C.cyan));
  // fitted rule picture
  const FB = P ? -4.0 : -2.4, FU = P ? 0.06 : 0.045;
  const fx = P ? [-1.4, 1.4] : [CX - 1.5, CX + 1.5];
  const fBars = [bar(1.2, 20 * FU, [fx[0], FB + 10 * FU, 0], TEAL, 0.75), bar(1.2, 40 * FU, [fx[1], FB + 20 * FU, 0], C.violet, 0.75)];
  const fLabs = [tx('morning', 15, C.muted, [fx[0], FB - 0.25, 0]), tx('afternoon', 15, C.muted, [fx[1], FB - 0.25, 0]),
    tx('20', 18, C.ink, [fx[0], FB + 20 * FU + 0.25, 0], true), tx('20 + 20 = 40', 18, C.ink, [fx[1], FB + 40 * FU + 0.25, 0], true)];
  await until(S(41)); await play(...picture(ln([fx[0] - 1, FB, 0], [fx[1] + 1, FB, 0], C.muted, 2), ...fBars, ...fLabs),
    ...fbox(['80% cutoff =', '20 + 20 × afternoon', ['(afternoon = 1,', C.muted], [' morning = 0)', C.muted]], C.green), ...say('START 20 · +20 IN THE AFTERNOON', C.green));
  await until(S(42)); await play(...fbox(['use it for a', ['planning time', C.green], 'that covers a', 'chosen share'], C.green), ...say('PLAN A TIME FOR A CHOSEN SHARE', C.green));
  // 43-44 trap
  const pm2 = dotsOf(PM, C.violet);
  await until(S(43)); await play(...picture(axis, ...pm2), ...fbox([['TRAP', RED], 'a high cutoff', 'from very few waits'], RED), ...say('TRAP: HIGH CUTOFF, FEW WAITS', RED));
  await until(S(44)); await play(new M.LaggedStart([pm2[7], pm2[8]].map(d => new M.Indicate(d, { color: RED })), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['only 9 dots:', ['move the 40 or 60', RED], 'and the answer', 'can change'], RED), ...say('ONE LONG WAIT CAN MOVE IT', RED));
  const endCut = new M.VGroup(ln([mx(40), DY0 - 0.05, 0], [mx(40), DY0 + 1.05, 0], C.green, 3.5), tag('80% CUTOFF: 40', C.green, [mx(40), DY0 - 0.64, 0], 15));
  await until(S(45)); await play(...add(endCut), ...fbox(['different prices', 'for too low and', 'too high', ['→ cutoff for a share', C.amber]], C.amber), ...say('QUANTILE REGRESSION: UNEVEN PRICES', C.amber));
}

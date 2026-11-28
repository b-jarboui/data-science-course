// 10.4.4 Bayesian information criterion: a fee per parameter that grows with the sample size.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const RED = '#f87171';
  const MA = C.amber, MB = C.cyan, MC = C.pink, FEE = C.violet, AICC = C.green;
  const PILL = [0, P ? 2.65 : 1.85, 0];
  const BOXP = P ? [0, -5.75, 0] : [4.95, -0.6, 0];
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
    const maxw = P ? FW - 0.9 : 4.1;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [fade(g)]; if (boxNow) a.push(out(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [out(boxNow)] : []; boxNow = null; return a; };
  const rect = (x, y0, h, w, color, op = 0.72) => { const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1.5 }); r.setFill(color, op); r.moveTo([x, y0 + h / 2, 0]); return r; };

  // grid of the 40 appointments
  const GX = P ? 0.15 : -4.6, GY = P ? 1.45 : 0.3, SX = P ? 0.45 : 0.38, SY = P ? 0.42 : 0.38, R = P ? 0.12 : 0.11;
  const MISS = [1, 1, 3, 5];
  const dots = [], reds = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) {
    const p = [GX + (k - 4.5) * SX, GY + (1.5 - r) * SY, 0];
    if (k < MISS[r]) { const d = new M.Dot({ point: p, radius: R * 1.15, color: RED }); d.setFill(RED, 1); reds.push(d); dots.push(d); }
    else { const d = new M.Dot({ point: p, radius: R, color: C.ink }); d.setFill(C.ink, 0.85); dots.push(d); }
  }
  const phones = [0, 1].map(r => { const x = GX - 4.5 * SX - 0.42, y = GY + (1.5 - r) * SY;
    const b = new M.RoundedRectangle({ width: 0.22, height: 0.34, cornerRadius: 0.05, color: C.cyan, strokeWidth: 2 }); b.setFill(C.card, 0.95); b.moveTo([x, y, 0]);
    const scr = new M.Rectangle({ width: 0.14, height: 0.18, color: C.cyan, strokeWidth: 1 }); scr.setFill(C.cyan, 0.6); scr.moveTo([x, y + 0.03, 0]);
    return new M.VGroup(b, scr); });
  const capY = GY - 2 * SY - 0.16;
  let gridCap = T('40 appointments', 16, C.muted); gridCap.moveTo([GX, capY, 0]);

  // part 1 bars (start at 30)
  const BASE = P ? -4.0 : -2.75, BOT = 30, TOPV = 55;
  const U = ((P ? -0.35 : 1.35) - BASE) / (TOPV - BOT);
  const XS = P ? [-2.0, 0, 2.0] : [-1.4, 0.3, 2.0], BW = P ? 1.1 : 1.05;
  const yv = v => BASE + (v - BOT) * U;
  const DEV = [45.0, 39.9, 39.1], K = [1, 2, 4], COL = [MA, MB, MC], NM = ['A', 'B', 'C'], FULL = ['48.7', '47.3', '53.8'];
  let floor, fromLab, bars, names;
  const makeP1 = () => {
    floor = new M.Line({ start: [XS[0] - 0.9, BASE, 0], end: [XS[2] + 0.9, BASE, 0], color: C.muted, strokeWidth: 2 });
    fromLab = T('bars start at 30 (cut ≈)', 16, C.muted); fromLab.moveTo([XS[0] - 0.9 + fromLab.getWidth() / 2, BASE - 0.66, 0]);
    bars = DEV.map((v, i) => rect(XS[i], BASE, (v - BOT) * U, BW, COL[i]));
    names = NM.map((s, i) => T(s, 18, COL[i], true).moveTo([XS[i], BASE - 0.3, 0]));
  };
  makeP1();
  const valLab = (s, v, i, color) => T(s, P ? 15 : 16, color || COL[i], true).moveTo([XS[i], yv(v) + 0.22, 0]);
  const vals = DEV.map((v, i) => valLab(v.toFixed(1), v, i));
  const part1 = () => [...bars, ...names, floor, fromLab];

  // 0-5
  await until(S(0)); await play(lag(dots.map(fade), 1.0, 0.03), fade(new M.VGroup(...phones, gridCap)), new M.Create(floor), ...say('40 DOTS, THREE FIT BARS', C.muted));
  await play(lag(bars.map(b => new M.FadeIn(b, { shift: [0, 0.3, 0] })), 1.0, 0.25), fade(new M.VGroup(...names, ...vals, fromLab)));
  await until(S(1)); await play(...say('SAME FEE FOR A WHOLE YEAR?', C.amber));
  const DX = P ? 3.3 : 3.2;
  const demo = rect(DX, yv(44), 2 * U, 0.7, FEE, 0.75);
  const demoT = T('1 block', 16, FEE, true); demoT.moveTo([DX, yv(44) + 2 * U + 0.22, 0]);
  await until(S(2)); await play(fade(demo), fade(demoT), ...say('ONE FEE BLOCK PER PARAMETER', FEE));
  const demoT2 = T('AIC: 2', 16, AICC, true); demoT2.moveTo([DX, yv(44) + 2 * U + 0.22, 0]);
  await until(S(3)); await play(out(demoT), fade(demoT2), ...say('AIC: EVERY BLOCK = 2 UNITS', AICC));
  await until(S(4)); await play(...say('OTHER RULE: BLOCK SIZE FROM RECORD SIZE', FEE));
  await until(S(5)); await play(...fbox(['sample size =', ['number of appointments', FEE]], FEE));

  // 6-10 block heights by sample size
  const BH = P ? 0.38 : 0.4;
  const BXS = P ? [-2.4, -0.8, 0.8, 2.4] : [-1.8, -0.4, 1.0, 2.4];
  const KB = [['AIC', 2.0, AICC, '2'], ['n = 8', 2.08, FEE, '2.1'], ['n = 40', 3.69, FEE, '3.7'], ['n = 400', 5.99, FEE, '6.0']];
  const kblocks = KB.map(([n, v, c, s], i) => new M.VGroup(rect(BXS[i], BASE, v * BH, 0.8, c, 0.8),
    T(n, 15, c, true).moveTo([BXS[i], BASE - 0.3, 0]), T(s, P ? 15 : 16, c, true).moveTo([BXS[i], BASE + v * BH + 0.24, 0])));
  const floor2 = new M.Line({ start: [BXS[0] - 0.7, BASE, 0], end: [BXS[3] + 0.7, BASE, 0], color: C.muted, strokeWidth: 2 });
  await until(S(6)); await play(out(demo), out(demoT2), out(new M.VGroup(...part1(), ...vals)), fade(floor2), fade(kblocks[0]),
    ...fbox(['block = log(sample size)', ['log grows slowly', C.muted]], FEE));
  await until(S(7)); await play(fade(kblocks[1]), ...fbox(['8 appointments:', ['log 8 ≈ 2.1 ≈ AIC’s 2', FEE]], FEE));
  await until(S(8)); await play(fade(kblocks[2]), ...fbox(['40 appointments:', ['log 40 ≈ 3.7', FEE]], FEE));
  await until(S(9)); await play(fade(kblocks[3]), ...fbox(['400 appointments:', ['log 400 ≈ 6.0', FEE]], FEE));
  await until(S(10)); await play(new M.Indicate(kblocks[0], { color: AICC }), ...say('AIC STAYS AT 2', AICC));

  // 11-19 stack blocks of 3.7 for n = 40
  const vals2 = DEV.map((v, i) => valLab(v.toFixed(1), v, i));
  makeP1();
  await until(S(11)); await play(out(new M.VGroup(...kblocks, floor2)), lag([...part1(), ...vals2].map(fade), 0.8, 0.05),
    ...fbox(['40 appointments:', ['1 block = 3.7 units', FEE]], FEE), ...say('BLOCK = 3.7 UNITS', FEE));
  const blocks = [[], [], []];
  const stack = async (i, beatA, beatB, lines1, lines2, beatC, lines3) => {
    await until(S(beatA)); await play(new M.Indicate(bars[i], { color: COL[i] }), ...fbox(lines1, COL[i]));
    for (let j = 0; j < K[i]; j++) { const b = rect(XS[i], yv(DEV[i] + 3.69 * j) + 0.02, 3.69 * U * 0.9, BW * 0.9, FEE, 0.75); blocks[i].push(b); }
    await until(S(beatB)); await play(out(vals2[i]), lag(blocks[i].map(b => new M.FadeIn(b, { shift: [0, -0.3, 0] })), 1.0, 0.3), ...fbox(lines2, COL[i]));
    if (beatC !== undefined) await until(S(beatC));
    const nv = valLab(FULL[i], DEV[i] + 3.69 * K[i], i, C.ink);
    await play(fade(nv), ...(lines3 ? fbox(lines3, COL[i]) : [])); vals2[i] = nv;
  };
  await stack(0, 12, 13, [['A: 45.0', MA], '1 parameter'], ['45.0 + 3.7', ['≈ 48.7', MA]]);
  await stack(1, 14, 15, [['B: 39.9', MB], '2 parameters'], ['39.9 + 7.4', ['≈ 47.3', MB]]);
  await stack(2, 16, 17, [['C: 39.1', MC], '4 parameters'], ['39.1 + 14.8'], 18, ['39.1 + 14.8', ['≈ 53.8', MC]]);
  const low = new M.DashedLine({ start: [XS[0] - 0.7, yv(47.3), 0], end: [XS[2] + 0.7, yv(47.3), 0], color: C.green });
  await until(S(19)); await play(new M.Create(low), new M.Indicate(vals2[1], { color: MB }), ...say('B HAS THE SHORTEST FULL BAR', MB));
  // 20-23 name and formula
  await until(S(20)); await play(...say('BIC = BAYESIAN INFORMATION CRITERION', FEE));
  await until(S(21)); await play(...fbox(['fit bar = deviance', ['= 2 × gap from perfect', C.muted]], C.green));
  await until(S(22)); await play(...fbox(['fee = log(sample size)', ['      × parameters', FEE]], FEE));
  await until(S(23)); await play(...fbox(['BIC = deviance', ['    + log(n) × parameters', FEE]], FEE), ...say('BIC = FIT + GROWING FEE', FEE));

  // 24-27 a whole year: 400 appointments
  const part1All = new M.VGroup(...part1(), ...vals2, ...blocks.flat(), low);
  const CDX = P ? 1.4 : 1.25, CX0 = P ? 0 : -2.3, CYR = P ? [1.55, 0.25] : [0.75, -0.45];
  const cards = [], cardMiss = [];
  for (let i = 0; i < 10; i++) {
    const x = CX0 + ((i % 5) - 2) * CDX, y = CYR[Math.floor(i / 5)];
    const r = new M.RoundedRectangle({ width: CDX - 0.18, height: 1.0, cornerRadius: 0.12, color: C.amber, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const t = T('40', 20, C.ink, true); t.moveTo([x, y + 0.2, 0]);
    const m = T('10 missed', 15, RED); m.moveTo([x, y - 0.22, 0]); cardMiss.push(m);
    cards.push(new M.VGroup(r, t, m));
  }
  const capYear = T('× 10  →  400 appointments', 20, C.amber, true); capYear.moveTo([CX0, CYR[1] - 0.95, 0]);
  await until(S(24)); await play(out(part1All), ...clearBox(), out(gridCap), out(new M.VGroup(...dots, ...phones)), lag(cards.map(fade), 1.0, 0.08), fade(capYear), ...say('A YEAR: 400 APPOINTMENTS', C.amber));
  await until(S(25)); await play(lag(cards.map(d => new M.Indicate(d, { color: C.amber })), 1.4, 0.06), ...fbox(['every group:', ['kept × 10, missed × 10', C.amber]], C.amber));
  await until(S(26)); await play(lag(cardMiss.map(d => new M.Indicate(d, { color: RED })), 1.0, 0.08), ...fbox([['10 missed of 40', RED], ['→ 100 missed of 400', RED]], RED));
  await until(S(27)); await play(...say('SAME LOGS, COUNTED 10 TIMES', C.amber));

  // 28-38 two panels: AIC and BIC at n = 400, bars start at 380
  const B2 = P ? -4.0 : -2.75, BOT2 = 380, TOP2 = 420, U2 = ((P ? 0.2 : 0.95) - B2) / (TOP2 - BOT2);
  const y2 = v => B2 + (v - BOT2) * U2, W2 = P ? 0.75 : 0.8;
  const PX = P ? { aB: -2.85, aC: -1.85, bB: 0.85, bC: 1.85 } : { aB: -2.3, aC: -1.2, bB: 0.9, bC: 2.0 };
  const mk = (x, v, color) => rect(x, B2, (v - BOT2) * U2, W2, color);
  const pB1 = mk(PX.aB, 399.2, MB), pC1 = mk(PX.aC, 390.8, MC), pB2 = mk(PX.bB, 399.2, MB), pC2 = mk(PX.bC, 390.8, MC);
  const nm = (s, x, c) => T(s, 17, c, true).moveTo([x, B2 - 0.3, 0]);
  const fl = (x1, x2) => new M.Line({ start: [x1 - 0.65, B2, 0], end: [x2 + 0.65, B2, 0], color: C.muted, strokeWidth: 2 });
  const ttl = (s, x, c) => T(s, P ? 18 : 19, c, true).moveTo([x, P ? 0.75 : 1.3, 0]);
  const panelStatic = new M.VGroup(fl(PX.aB, PX.aC), fl(PX.bB, PX.bC), nm('B', PX.aB, MB), nm('C', PX.aC, MC), nm('B', PX.bB, MB), nm('C', PX.bC, MC),
    ttl('AIC', (PX.aB + PX.aC) / 2, AICC), ttl('BIC', (PX.bB + PX.bC) / 2, FEE));
  const from2 = T('bars start at 380 (cut ≈)', 16, C.muted); from2.moveTo([PX.aB - 0.65 + from2.getWidth() / 2, B2 - 0.66, 0]);
  const bk = PX.aB - 0.55, brk2 = new M.VGroup(
    new M.Line({ start: [bk - 0.1, B2 - 0.12, 0], end: [bk + 0.02, B2 + 0.12, 0], color: C.ink, strokeWidth: 2.5 }),
    new M.Line({ start: [bk + 0.04, B2 - 0.12, 0], end: [bk + 0.16, B2 + 0.12, 0], color: C.ink, strokeWidth: 2.5 }));
  const v2 = (s, x, v, c) => T(s, 17, c, true).moveTo([x, y2(v) + 0.28, 0]);
  const pv = [v2('399.2', PX.aB, 399.2, MB), v2('390.8', PX.aC, 390.8, MC), v2('399.2', PX.bB, 399.2, MB), v2('390.8', PX.bC, 390.8, MC)];
  await until(S(28)); await play(out(new M.VGroup(...cards, capYear)), fade(panelStatic), fade(from2), fade(brk2),
    lag([pB1, pC1, pB2, pC2].map(b => new M.FadeIn(b, { shift: [0, 0.3, 0] })), 1.0, 0.15), fade(new M.VGroup(...pv)),
    ...fbox(['deviance × 10:', ['A 449.9', MA], ['B 399.2', MB], ['C 390.8', MC]], C.amber), ...say('FIT BARS 10 TIMES TALLER', C.amber));
  await until(S(29)); await play(...fbox(['B − C gap at 40:', '39.96 − 39.12 = 0.84', ['× 10', C.amber]], C.green));
  const gapMark = (x, c) => {
    const ln = new M.Line({ start: [x, y2(390.8), 0], end: [x, y2(399.2), 0], color: C.green, strokeWidth: 4 });
    const dl = new M.DashedLine({ start: [x - 1.6, y2(399.2), 0], end: [x, y2(399.2), 0], color: C.green });
    const t = T('8.4', 18, C.green, true); t.moveTo([x + 0.32, (y2(390.8) + y2(399.2)) / 2, 0]);
    return new M.VGroup(ln, dl, t);
  };
  const g1 = gapMark(PX.aC + W2 / 2 + 0.12), g2 = gapMark(PX.bC + W2 / 2 + 0.12);
  await until(S(30)); await play(fade(g1), fade(g2), ...fbox(['new gap', ['≈ 8.4', C.green]], C.green), ...say('FIT GAIN OF C OVER B: 8.4', C.green));
  // AIC blocks
  const blk = (x, v0, j, h, c) => rect(x, y2(v0 + h * j) + 0.01, h * U2 * 0.88, W2 * 0.9, c, 0.8);
  const aB = [0, 1].map(j => blk(PX.aB, 399.2, j, 2, AICC)), aC = [0, 1, 2, 3].map(j => blk(PX.aC, 390.8, j, 2, AICC));
  await until(S(31)); await play(out(pv[0]), out(pv[1]), lag([...aB, ...aC].map(b => new M.FadeIn(b, { shift: [0, -0.2, 0] })), 1.2, 0.15),
    ...fbox(['AIC fee:', ['C pays 4 more than B', AICC]], AICC));
  await until(S(32)); await play(...fbox(['gain 8.4 > fee 4', ['→ C is worth it', AICC]], AICC));
  const aVB = v2('403.2', PX.aB, 403.2, C.ink), aVC = v2('398.8', PX.aC, 398.8, C.ink);
  await until(S(33)); await play(fade(aVB), fade(aVC), new M.Indicate(pC1, { color: MC }), ...say('400 APPOINTMENTS: AIC PICKS C', AICC));
  // BIC blocks
  const bB = [0, 1].map(j => blk(PX.bB, 399.2, j, 5.99, FEE)), bC = [0, 1, 2, 3].map(j => blk(PX.bC, 390.8, j, 5.99, FEE));
  await until(S(34)); await play(out(pv[2]), out(pv[3]), lag([...bB, ...bC].map(b => new M.FadeIn(b, { shift: [0, -0.2, 0] })), 1.2, 0.15),
    ...fbox(['BIC fee:', ['C pays about 12 more', FEE]], FEE));
  await until(S(35)); await play(...fbox(['gain 8.4 < fee 12', ['→ C not worth it', RED]], FEE));
  await until(S(36)); await play(new M.Indicate(pB2, { color: MB }), ...say('BIC STILL PICKS B', FEE));
  const bVB = v2('411.2', PX.bB, 411.2, C.ink), bVC = v2('414.8', PX.bC, 414.8, C.ink);
  await until(S(37)); await play(fade(bVB), ...fbox([['BIC  B ≈ 411.2', MB]], FEE));
  await until(S(38)); await play(fade(bVC), ...fbox([['BIC  B ≈ 411.2', MB], ['BIC  C ≈ 414.8', MC]], FEE));
  await until(S(39)); await play(...say('THE TWO RULES CAN DISAGREE', C.amber));
  await until(S(40)); await play(...fbox(['BIC: fee per parameter', ['grows with the number', FEE], ['of appointments', FEE]], FEE));
  // 41-43 trap and summary
  await until(S(41)); await play(...say('TRAP: AIC OF ONE vs BIC OF ANOTHER', RED), ...fbox([['AIC C 398.8', AICC], ['vs BIC B 411.2', FEE], ['✗ not comparable', RED]], RED));
  await until(S(42)); await play(...fbox(['same rule', ['same appointments', C.green]], C.green), ...say('SAME RULE, SAME DATA', C.green));
  await until(S(43)); await play(...fbox(['BIC = deviance', ['    + log(n) × parameters', FEE]], FEE), ...say('BIC: FEE GROWS WITH THE RECORD', FEE));
}

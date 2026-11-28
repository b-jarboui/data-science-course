// 10.4.3 Akaike information criterion: deviance bars plus a fee of 2 per parameter.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const RED = '#f87171';
  const MA = C.amber, MB = C.cyan, MC = C.pink, FEE = C.violet;
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

  // small grid of the 40 appointments
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
  const gridCap = T('40 appointments', 16, C.muted); gridCap.moveTo([GX, GY - 2 * SY - 0.16, 0]);
  const grid = new M.VGroup(...dots, ...phones, gridCap);

  // vertical bars, starting at 30
  const BASE = P ? -4.0 : -2.75, TOPV = 48, BOT = 30;
  const U = ((P ? -0.4 : 1.35) - BASE) / (TOPV - BOT);
  const XS = P ? [-2.0, 0, 2.0] : [-1.4, 0.3, 2.0], BW = P ? 1.1 : 1.05;
  const yv = v => BASE + (v - BOT) * U;
  const floor = new M.Line({ start: [XS[0] - 0.9, BASE, 0], end: [XS[2] + 0.9, BASE, 0], color: C.muted, strokeWidth: 2 });
  const fromLab = T('bars start at 30 (cut ≈)', 16, C.muted); fromLab.moveTo([XS[0] - 0.9 + fromLab.getWidth() / 2, BASE - 0.66, 0]);
  const bx = XS[0] - 0.72, brk = new M.VGroup(
    new M.Line({ start: [bx - 0.1, BASE - 0.12, 0], end: [bx + 0.02, BASE + 0.12, 0], color: C.ink, strokeWidth: 2.5 }),
    new M.Line({ start: [bx + 0.04, BASE - 0.12, 0], end: [bx + 0.16, BASE + 0.12, 0], color: C.ink, strokeWidth: 2.5 }));
  const DEV = [45.0, 39.9, 39.1], K = [1, 2, 4], COL = [MA, MB, MC], NM = ['A', 'B', 'C'];
  const bars = DEV.map((v, i) => { const r = new M.Rectangle({ width: BW, height: (v - BOT) * U, color: COL[i], strokeWidth: 1.5 }); r.setFill(COL[i], 0.7); r.moveTo([XS[i], BASE + (v - BOT) * U / 2, 0]); return r; });
  const names = NM.map((s, i) => T(s, 18, COL[i], true).moveTo([XS[i], BASE - 0.3, 0]));
  const valLab = (v, i, color) => T(v.toFixed(1), P ? 15 : 16, color || COL[i], true).moveTo([XS[i], yv(v) + 0.22, 0]);
  const vals = DEV.map((v, i) => valLab(v, i));
  const block = (i, j) => { const b = new M.Rectangle({ width: BW * 0.9, height: 2 * U * 0.88, color: FEE, strokeWidth: 1.5 }); b.setFill(FEE, 0.75); b.moveTo([XS[i], yv(DEV[i] + 2 * j + 1), 0]); return b; };

  // 0-4
  await until(S(0)); await play(new M.Create(floor), fade(new M.VGroup(...names)), ...say('PICK ONE OF THREE MODELS', C.violet));
  await until(S(1)); await play(lag(dots.map(fade), 1.0, 0.03), fade(new M.VGroup(...phones, gridCap)), ...say('SAME 40 DOTS, THREE BARS', C.muted));
  await play(lag(bars.map(b => new M.FadeIn(b, { shift: [0, 0.3, 0] })), 1.0, 0.25), fade(new M.VGroup(...vals, fromLab, brk)));
  await until(S(2)); await play(...fbox(['deviance =', '2 × gap from', ['a perfect fit', C.green]], C.green));
  await until(S(3)); await play(...say('SHORTER BAR = CLOSER FIT', C.green));
  await until(S(4)); await play(new M.Indicate(bars[2], { color: MC }), ...say('C IS SHORTEST (NO BLOCKS YET)', MC));
  // 5-10 the fee blocks
  await until(S(5)); await play(lag(reds.map(d => new M.Indicate(d, { color: RED })), 1.2), ...say('EXTRA SETTINGS CATCH CHANCE', C.amber));
  const DX = P ? 3.3 : 3.2;
  const demo = new M.Rectangle({ width: 0.7, height: 2 * U * 0.88, color: FEE, strokeWidth: 1.5 }); demo.setFill(FEE, 0.75); demo.moveTo([DX, yv(42), 0]);
  const demoT = T('1 block', 16, FEE, true); demoT.moveTo([DX, yv(42) + 0.42, 0]);
  await until(S(6)); await play(fade(demo), fade(demoT), ...say('ONE BLOCK PER ADJUSTABLE CHANCE', FEE));
  await until(S(7)); await play(...say('SETTING = PARAMETER', FEE));
  await until(S(8)); await play(new M.Indicate(demo, { color: FEE }), ...say('BLOCK = A FEE IN POINTS', FEE));
  await until(S(9)); await play(...fbox(['a new setting helps', 'if the bar shrinks', ['more than its block adds', FEE]], FEE));
  const demoT2 = T('2 units', 16, FEE, true); demoT2.moveTo([DX, yv(42) + 0.42, 0]);
  await until(S(10)); await play(out(demoT), fade(demoT2), ...fbox([['1 block = 2 units', FEE]], FEE));
  await until(S(11)); await play(out(demo), out(demoT2), ...say('STACK ONE MODEL AT A TIME', FEE));

  // 12-17 stack blocks
  const blocks = [[], [], []];
  const stack = async (i, beatA, beatB, lines1, lines2) => {
    await until(S(beatA)); await play(new M.Indicate(bars[i], { color: COL[i] }), ...fbox(lines1, COL[i]));
    for (let j = 0; j < K[i]; j++) blocks[i].push(block(i, j));
    const nv = valLab(DEV[i] + 2 * K[i], i, C.ink);
    await until(S(beatB)); await play(out(vals[i]), lag(blocks[i].map(b => new M.FadeIn(b, { shift: [0, -0.3, 0] })), 1.0, 0.3), ...fbox(lines2, COL[i]));
    await play(fade(nv)); vals[i] = nv;
  };
  await stack(0, 12, 13, [['A: 45.0', MA], '1 parameter'], ['45.0 + 2', ['= 47.0', MA]]);
  await stack(1, 14, 15, [['B: 39.9', MB], '2 parameters'], ['39.9 + 4', ['= 43.9', MB]]);
  await stack(2, 16, 17, [['C: 39.1', MC], '4 parameters'], ['39.1 + 8', ['= 47.1', MC]]);

  // 18-23 compare
  await until(S(18)); await play(...say('COMPARE THE FULL HEIGHTS', C.green));
  const low = new M.DashedLine({ start: [XS[0] - 0.7, yv(43.9), 0], end: [XS[2] + 0.7, yv(43.9), 0], color: C.green });
  await until(S(19)); await play(new M.Create(low), new M.Indicate(vals[1], { color: C.green }), ...say('B IS LOWEST: 43.9', MB));
  await until(S(20)); await play(...fbox(['A → B:', ['bar shrinks 5.1', C.green]], MB));
  await until(S(21)); await play(new M.Indicate(blocks[1][1], { color: FEE }), ...fbox(['A → B:', ['bar shrinks 5.1', C.green], ['new block adds 2', FEE], ['→ worth it', C.green]], MB));
  await until(S(22)); await play(...fbox(['B → C:', ['bar shrinks 0.8', C.green]], MC));
  await until(S(23)); await play(lag(blocks[2].slice(2).map(b => new M.Indicate(b, { color: FEE })), 0.8, 0.3),
    ...fbox(['B → C:', ['bar shrinks 0.8', C.green], ['new blocks add 4', FEE], ['→ not worth it', RED]], MC));
  // 24-28 the name and formula
  await until(S(24)); await play(...say('AIC = AKAIKE INFORMATION CRITERION', C.green));
  await until(S(25)); await play(...say('CRITERION = A RULE FOR CHOOSING', C.muted));
  await until(S(26)); await play(...fbox(['AIC = deviance', ['    + 2 × parameters', FEE]], C.green));
  await until(S(27)); await play(...fbox(['perfect fit:', ['log-likelihood = 0', C.green]], C.green));
  await until(S(28)); await play(...fbox(['AIC = −2 × log-likelihood', ['    + 2 × parameters', FEE]], C.green));
  // 29-33 why the fee
  await until(S(29)); await play(lag(dots.map(d => new M.Indicate(d, { color: C.amber })), 1.4, 0.02),...say('OWN DATA FIT > FRESH DATA FIT', C.amber));
  await until(S(30)); await play(lag(reds.map(d => new M.Indicate(d, { color: RED })), 1.2), ...say('MORE SETTINGS MATCH MORE LUCK', C.amber));
  await until(S(31)); await play(lag(blocks.flat().map(b => new M.Indicate(b, { color: FEE })), 1.4, 0.1), ...say('THE FEE PAYS BACK SOME OF THAT', FEE));
  await until(S(32)); await play(new M.Indicate(bars[1], { color: MB }), ...say('LOWEST AIC → BEST GUESS FOR NEW', MB));
  await until(S(33)); await play(...fbox(['rank models that', 'learn from the', ['same appointments', C.green]], C.green));
  // 34-35 non-nested rules
  const CW = P ? 2.7 : 3.2;
  const card = (x, y, s, color) => { const r = new M.RoundedRectangle({ width: CW, height: 0.62, cornerRadius: 0.14, color, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo([x, y, 0]); const t = T(s, P ? 15 : 16, color, true); t.moveTo([x, y, 0]); return new M.VGroup(r, t); };
  const c1 = P ? card(-1.9 + 0.45, 1.75, 'reminders only', MB) : card(GX, 0.75, 'reminders only', MB);
  const c2 = P ? card(1.9 - 0.45, 0.95, 'time of day only', C.violet) : card(GX, -0.35, 'time of day only', C.violet);
  await until(S(34)); await play(out(grid), fade(c1), fade(c2), ...say('TWO DIFFERENT RULES', C.violet));
  await until(S(35)); await play(...fbox(['neither copies', 'the other:', ['AIC still', C.green], ['compares them', C.green]], C.green));
  // 36-40 the trap and the summary
  await until(S(36)); await play(out(c1), out(c2), fade(grid), ...say('TRAP: 43.9 IS NOT A GRADE', RED));
  await until(S(37)); await play(...fbox(['compare on the same data:', ['A 47.0', MA], ['B 43.9', MB], ['C 47.1', MC]], C.green));
  await until(S(38)); await play(new M.Indicate(vals[0], { color: MA }), new M.Indicate(vals[2], { color: MC }), ...fbox(['A 47.0 vs C 47.1', ['differ by 0.1', C.muted], '→ no real preference'], C.muted));
  await until(S(39)); await play(...fbox(['fee = 2 per parameter', ['for any number', C.muted], ['of appointments', C.muted]], FEE), ...say('FEE STAYS 2', FEE));
  await until(S(40)); await play(new M.Indicate(bars[1], { color: MB }), ...fbox(['AIC = deviance', ['    + 2 × parameters', FEE], ['lowest wins: B', MB]], C.green), ...say('AIC: FIT + 2 PER PARAMETER', C.green));
}

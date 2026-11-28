// 7.4.8 Reporting a test: effect, interval, p-value and the action rule.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const RED = '#f87171', MOR = C.amber, NIG = C.violet;
  const PILL = [0, P ? 2.65 : 1.85, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.5, -0.6, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);
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
    const maxw = P ? FW - 0.9 : 4.7;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [fade(g)]; if (boxNow) a.push(out(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [out(boxNow)] : []; boxNow = null; return a; };

  // ---------- part 1: two rows of 50 cookies on a grams line ----------
  const AX = P ? -1.5 : -1.6, RY = P ? [0.75, -0.45] : [0.85, -0.45];
  const GX1 = P ? -3.5 : -6.2, GX2 = P ? 3.5 : 1.6;
  const gx = g => GX1 + (g - 27) / 6 * (GX2 - GX1);
  const axis = new M.Line({ start: [GX1, AX, 0], end: [GX2, AX, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [27, 28, 29, 30, 31, 32, 33].map(v => new M.VGroup(
    new M.Line({ start: [gx(v), AX - 0.07, 0], end: [gx(v), AX + 0.07, 0], color: C.muted }),
    T(String(v), P ? 17 : 15, C.muted, true).moveTo([gx(v), AX - 0.32, 0])));
  const unit = T('grams', P ? 17 : 15, C.muted); unit.moveTo([GX2 - 0.4, AX - 0.68, 0]);
  const target = new M.DashedLine({ start: [gx(30), AX, 0], end: [gx(30), RY[0] + 0.55, 0], color: C.green });
  const targetT = T('target 30 g', P ? 17 : 15, C.green, true); targetT.moveTo([gx(30), RY[0] + 0.78, 0]);
  // fixed sample of 50 weights per shift, shifted to the exact means
  let s = 11; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const normal = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const sample = mean => { const a = Array.from({ length: 50 }, () => Math.max(-2.6, Math.min(2.6, normal() * 0.9))); const m = a.reduce((x, y) => x + y, 0) / 50; return a.map(v => v - m + mean); };
  const W = [sample(30.0), sample(29.2)], COL = [MOR, NIG];
  const rowDots = W.map((ws, r) => ws.map((w, i) => { const d = new M.Dot({ point: [gx(w), RY[r] + ((i * 37) % 11 - 5) * 0.045, 0], radius: P ? 0.06 : 0.065, color: COL[r] }); d.setFill(COL[r], 0.85); return d; }));
  const rowLab = ['morning', 'night'].map((n, r) => { const t = T(n, P ? 17 : 16, COL[r], true); t.moveTo([GX1 + t.getWidth() / 2, RY[r] + (P ? 0.42 : 0.42), 0]); return t; });
  const meanMk = (r, m) => {
    const ln = new M.Line({ start: [gx(m), RY[r] - 0.35, 0], end: [gx(m), RY[r] + 0.35, 0], color: C.ink, strokeWidth: 4 });
    const t = T('mean ' + m.toFixed(1), P ? 16 : 15, C.ink, true); t.moveTo([gx(m) + (r ? -1 : 1) * (0.2 + t.getWidth() / 2), RY[r] + 0.45, 0]);
    return new M.VGroup(ln, t);
  };

  await until(S(0)); await play(...say('NIGHT SHIFT: ADJUST THE COOKIE LINE?', NIG), ...fbox(['question:', ['adjust the night', NIG], ['cookie line?', NIG]], NIG));
  await until(S(1)); await play(...clearBox(), new M.Create(axis), fade(new M.VGroup(...ticks, unit)), new M.Create(target), fade(targetT), ...say('TARGET: 30 GRAMS', C.green));
  await until(S(2)); await play(...fbox(['action rule:', ['change only if gap > 2 g', RED]], RED));
  const rowLines = RY.map((y, r) => new M.Line({ start: [GX1, y, 0], end: [GX2, y, 0], color: C.line, strokeWidth: 2 }));
  await until(S(3)); await play(fade(rowLab[0]), fade(rowLab[1]), ...rowLines.map(l => new M.Create(l)), ...say('ONE ROW PER SHIFT', C.muted));
  await until(S(4)); await play(lag(rowDots[0].map(fade), 1.2, 0.03), lag(rowDots[1].map(fade), 1.2, 0.03), ...say('50 COOKIES FROM EACH SHIFT', C.ink));
  const m0 = meanMk(0, 30.0), m1 = meanMk(1, 29.2);
  await until(S(5)); await play(...fbox(['mean = sum of weights', ['      ÷ 50 cookies', C.cyan]], C.cyan));
  await until(S(5) + 2.0); await play(fade(m0), fade(m1));
  await until(S(6)); await play(...say('MEAN = FAIR SHARE OF THE WEIGHT', C.cyan),
    ...fbox([['morning 30.0 g', MOR], ['night   29.2 g', NIG]], C.cyan));

  // ---------- part 2: the ruler "night lighter by ... grams" ----------
  const RYL = P ? -1.2 : -1.0, RX1 = P ? -3.4 : -6.0, K = P ? 2.27 : 2.4;
  const rx = v => RX1 + (v + 0.5) * K;
  const ruler = new M.Line({ start: [RX1, RYL, 0], end: [rx(2.5), RYL, 0], color: C.muted, strokeWidth: 3 });
  const rticks = [0, 0.5, 1, 1.5, 2, 2.5].map(v => new M.VGroup(
    new M.Line({ start: [rx(v), RYL - 0.07, 0], end: [rx(v), RYL + 0.07, 0], color: C.muted }),
    T(String(v), P ? 17 : 15, C.muted, true).moveTo([rx(v), RYL - 0.32, 0])));
  const rname = T('night lighter by … grams', P ? 17 : 15, C.muted); rname.moveTo([rx(1.0), RYL - 0.7, 0]);
  const part1 = new M.VGroup(axis, ...ticks, unit, target, targetT, ...rowLab, ...rowLines, ...rowDots[0], ...rowDots[1], m0, m1);
  await until(S(7)); await play(out(part1), ...clearBox(), new M.Create(ruler), fade(new M.VGroup(...rticks, rname)), ...say('A RULER FOR THE GAP', C.cyan));
  const zero = new M.Line({ start: [rx(0), RYL, 0], end: [rx(0), RYL + 1.6, 0], color: C.ink, strokeWidth: 2 });
  const zeroT = T('0 = equal means', P ? 16 : 15, C.ink, true); zeroT.moveTo([rx(0) + (P ? 0.55 : 0.2) + 0.0, RYL + 1.8, 0]);
  zeroT.moveTo([Math.max(rx(0), RX1 + zeroT.getWidth() / 2), RYL + 1.8, 0]);
  await until(S(8)); await play(new M.Create(zero), fade(zeroT));
  const act = new M.DashedLine({ start: [rx(2), RYL, 0], end: [rx(2), RYL + 1.6, 0], color: RED });
  const actT = T('action line 2 g', P ? 16 : 15, RED, true); actT.moveTo([Math.min(rx(2), rx(2.5) - actT.getWidth() / 2 + 0.2), RYL + 1.8, 0]);
  await until(S(9)); await play(new M.Create(act), fade(actT), ...say('ACT ONLY BEYOND 2 g', RED));
  await until(S(10)); await play(...fbox(['30.0 − 29.2', ['= 0.8 g lighter', NIG]], NIG));
  const halo = new M.Dot({ point: [rx(0.8), RYL + 0.55, 0], radius: 0.26, color: NIG }); halo.setFill(NIG, 0.22);
  const dot = new M.Dot({ point: [rx(0.8), RYL + 0.55, 0], radius: 0.12, color: NIG }); dot.setFill(NIG, 1);
  const dotT = T('0.8', P ? 19 : 17, NIG, true); dotT.moveTo([rx(0.8), RYL + 0.95, 0]);
  await until(S(11)); await play(fade(halo), fade(dot), fade(dotT), new M.Flash(dot, { color: NIG }));
  await until(S(12)); await play(new M.Indicate(dotT, { color: NIG }), ...say('SIZE AND DIRECTION OF THE GAP', NIG));
  await until(S(13)); await play(...say('ESTIMATED EFFECT = 0.8 g', NIG));
  await until(S(14)); await play(...fbox(['0.8 ÷ 30', ['≈ 2.7 % of the target', NIG]], NIG));
  // another sample could differ
  const ghosts = [0.55, 1.05, 0.7, 0.95, 0.45].map((v, i) => { const d = new M.Dot({ point: [rx(v), RYL + 0.2 + (i % 2) * 0.12, 0], radius: 0.08, color: C.muted }); d.setFill(C.muted, 0.8); return d; });
  await until(S(15)); await play(lag(ghosts.map(fade), 1.4, 0.2), ...say('ANOTHER BATCH → ANOTHER GAP', C.muted));
  const ci = new M.Line({ start: [rx(0.3), RYL + 0.55, 0], end: [rx(1.3), RYL + 0.55, 0], color: NIG, strokeWidth: 5 });
  const capL = new M.Line({ start: [rx(0.3), RYL + 0.4, 0], end: [rx(0.3), RYL + 0.7, 0], color: NIG, strokeWidth: 5 });
  const capR = new M.Line({ start: [rx(1.3), RYL + 0.4, 0], end: [rx(1.3), RYL + 0.7, 0], color: NIG, strokeWidth: 5 });
  const ciEnds = [T('0.3', P ? 17 : 15, NIG, true).moveTo([rx(0.3), RYL + 0.95, 0]), T('1.3', P ? 17 : 15, NIG, true).moveTo([rx(1.3), RYL + 0.95, 0])];
  await until(S(16)); await play(out(new M.VGroup(...ghosts)), new M.Create(ci), new M.Create(capL), new M.Create(capR), fade(new M.VGroup(...ciEnds)));
  const ciT = T('95% confidence interval', P ? 16 : 15, NIG, true); ciT.moveTo([rx(0.8), RYL + 1.35, 0]);
  await until(S(17)); await play(fade(ciT), ...say('95% CONFIDENCE INTERVAL', NIG));
  await until(S(18)); await play(...say('HOW UNSURE WE ARE ABOUT THE GAP', NIG));
  await until(S(19)); await play(...fbox(['if conditions hold:', ['95 in 100 such intervals', NIG], ['contain the true gap', NIG]], NIG));
  await until(S(20)); await play(new M.Indicate(ciEnds[0], { color: C.green }), new M.Indicate(capL, { color: C.green }), ...say('END NEAREST ZERO: 0.3', C.green));
  await until(S(21)); await play(...fbox(['0.3 > 0', ['night still lighter', C.green]], C.green));
  await until(S(22)); await play(new M.Indicate(ciEnds[1], { color: RED }), new M.Indicate(capR, { color: RED }), ...say('OTHER END: 1.3', RED));
  await until(S(23)); await play(...fbox(['1.3 < 2', ['short of the action line', RED]], RED));

  // 24-29 the p-value with a "same means" curve
  await until(S(24)); await play(...say('NOW THE TEST RESULT', C.amber));
  await until(S(25)); await play(...fbox([['p = 0.002', C.amber]], C.amber));
  const HB = P ? 1.7 : 1.75, sd = 0.255;
  const bell = []; let prev = null;
  for (let v = -0.5; v <= 1.0001; v += 0.04) { const p = [rx(v), RYL + HB * Math.exp(-v * v / (2 * sd * sd)), 0]; if (prev) bell.push(new M.Line({ start: prev, end: p, color: C.amber, strokeWidth: 3 })); prev = p; }
  const bellG = new M.VGroup(...bell);
  const ciStuff = new M.VGroup(ci, capL, capR, ...ciEnds, ciT);
  await until(S(26)); await play(out(ciStuff), out(zeroT), new M.Create(bellG), ...say('IMAGINE: SAME MEANS', C.amber));
  const tail = new M.Line({ start: [rx(0.8), RYL + 0.02, 0], end: [rx(1.0), RYL + 0.02, 0], color: RED, strokeWidth: 7 });
  const tailT = T('this far or farther: 0.002', P ? 16 : 15, RED, true); tailT.moveTo([rx(0.8) + tailT.getWidth() / 2 - 0.2, RYL + 1.5, 0]);
  if (P) tailT.moveTo([rx(1.0) + 0.3, RYL + 1.25, 0]);
  await until(S(27)); await play(new M.Create(tail), fade(tailT), ...fbox(['p = chance of a result', ['at least this extreme', C.amber], ['if the means were equal', C.muted]], C.amber));
  await until(S(28)); await play(...say('SMALL p → THE MEANS DIFFER', C.green));
  await until(S(29)); await play(out(new M.VGroup(bellG, tail, tailT)), new M.Indicate(act, { color: RED }), ...say('BUT IS IT BIG ENOUGH TO ACT?', RED));

  // 30-34 the report
  const ci2 = new M.VGroup(
    new M.Line({ start: [rx(0.3), RYL + 0.55, 0], end: [rx(1.3), RYL + 0.55, 0], color: NIG, strokeWidth: 5 }),
    new M.Line({ start: [rx(0.3), RYL + 0.4, 0], end: [rx(0.3), RYL + 0.7, 0], color: NIG, strokeWidth: 5 }),
    new M.Line({ start: [rx(1.3), RYL + 0.4, 0], end: [rx(1.3), RYL + 0.7, 0], color: NIG, strokeWidth: 5 }));
  await until(S(30)); await play(fade(ci2), ...say('THE REPORTING RULE', C.cyan));
  await until(S(31)); await play(...fbox([['gap: 0.8 g lighter', NIG], ['95% CI: 0.3 to 1.3 g', NIG], ['p = 0.002', C.amber], ['act only if gap > 2 g', RED]], C.cyan));
  const zone = new M.Rectangle({ width: rx(1.3) - rx(0.3), height: 1.3, color: C.green, strokeWidth: 2 }); zone.setFill(C.green, 0.12);
  zone.moveTo([(rx(0.3) + rx(1.3)) / 2, RYL + 0.65, 0]);
  await until(S(32)); await play(new M.Create(zone), ...say('WHOLE RANGE BELOW THE ACTION LINE', C.green));
  await until(S(33)); await play(...fbox(['decision:', ['no change to the line', C.green], ['keep checking weights', C.green]], C.green));
  await until(S(34)); await play(...say('EFFECT → INTERVAL → p → DECISION', C.cyan));
  // 35-37 trap and summary
  await until(S(35)); await play(out(zone), ...say('TRAP: SMALL p ≠ BIG GAP', RED), ...fbox(['p = 0.002 is small', ['gap 0.8 g is small too', RED]], RED));
  await until(S(36)); await play(new M.Indicate(dot, { color: NIG }), new M.Indicate(ci2, { color: NIG }), ...say('DOT + LINE = SIZE IN GRAMS', NIG));
  await until(S(37)); await play(...fbox([['how big: 0.8 g', NIG], ['how sure: 0.3 to 1.3 g', NIG], ['decision: below 2 g, no change', C.green]], C.green), ...say('SIZE, UNCERTAINTY, DECISION', C.green));
}

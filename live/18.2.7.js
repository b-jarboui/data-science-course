// 18.2.7 Normalizing flows: stretching a simple distribution. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const SAYP = P ? [0, 4.15, 0] : [-3.4, 1.85, 0];
  const LS = P ? 17 : 15;
  const say = (s, c = C.cyan) => showA(s, c, SAYP);
  const BOXP = P ? [0, -5.45, 0] : [-4.5, -2.0, 0];

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21, lh = P ? 0.4 : 0.42;
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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // pot
  const PX = P ? 0 : -4.6, PB = P ? 1.15 : -0.9, UX = P ? 0.3 : 0.22, UY = P ? 0.46 : 0.38;
  function pot(m, color) {
    const [b, mi, r] = m, x = PX, y0 = PB;
    const v = [[x + b * UX, y0], [x + mi * UX, y0 + 2 * UY], [x + r * UX, y0 + 4 * UY], [x - r * UX, y0 + 4 * UY], [x - mi * UX, y0 + 2 * UY], [x - b * UX, y0]];
    const p = new M.Polygon({ vertices: v.map(([a, c]) => [a, c, 0]), color, strokeWidth: 3 }); p.setFill(color, 0.14); return p;
  }
  const rimDot = r => { const d = new M.Dot({ point: [PX + r * UX, PB + 4 * UY, 0], radius: 0.08, color: C.ink }); return d; };
  const LABP = P ? [2.95, PB + 1.0, 0] : [PX, PB + 4 * UY + 0.32, 0];
  const potLab = (m, c) => { const t = T(m.map(v => String(v)).join(', '), 17, c, true); t.moveTo(LABP); return t; };

  // number lines
  const K = P ? 1.5 : 1.3, XC = P ? 0 : 2.6, LZ = P ? -1.05 : 0.5, LR = P ? -3.55 : -1.9;
  const zx = z => XC + z * K, ux = u => XC + u * K;   // z line; stretched line uses u = 2z
  const zLine = new M.Line({ start: [zx(-1), LZ, 0], end: [zx(1), LZ, 0], color: C.violet, strokeWidth: 4 });
  const zTicks = [-1, -0.5, 0, 0.5, 1].map(v => new M.VGroup(
    new M.Line({ start: [zx(v), LZ - 0.08, 0], end: [zx(v), LZ + 0.08, 0], color: C.violet }),
    T(v < 0 ? '−' + Math.abs(v) : String(v), LS, C.violet, true).moveTo([zx(v), LZ - 0.34, 0])));
  const ZV = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  const zDots = ZV.map(z => { const d = new M.Dot({ point: [zx(z), LZ, 0], radius: 0.075, color: C.violet }); return d; });
  const zName = T('latent z', LS, C.violet); zName.moveTo(P ? [zx(-1), LZ - 0.72, 0] : [zx(-1) - 0.85, LZ, 0]);

  const pot0 = pot([1, 3, 4], C.cyan);
  // opening: the rim takes many widths (faint outlines), then bowl B1 stays
  const ghosts = [1.5, 2.5, 3.5, 4.5].map((r, k) => {
    const gx = P ? (k - 1.5) * 1.9 : -2.6 + (k - 1.5) * 1.8, gy = P ? PB + 0.4 : PB + 0.3, gu = P ? 0.17 : 0.13, gv = P ? 0.26 : 0.22;
    const v = [[1, 0], [3, 2], [r, 4], [-r, 4], [-3, 2], [-1, 0]].map(([w, h]) => [gx + w * gu, gy + h * gv, 0]);
    const g = new M.Polygon({ vertices: v, color: C.amber, strokeWidth: 3 }); g.setFill(C.amber, 0.12); return g; });
  await until(S(0)); await play(new M.LaggedStart(ghosts.map(g => new M.Create(g)), { lagRatio: 0.25, runTime: 1.6 }), ...fbox(['bottom, middle: fixed', ['rim: many widths', C.amber]], C.amber), ...say('GOAL: MANY DIFFERENT RIM WIDTHS', C.amber));
  const lab0 = potLab([1, 3, 4], C.cyan);
  await until(S(1)); await play(new M.FadeOut(new M.VGroup(...ghosts)), new M.Create(pot0), new M.FadeIn(lab0), ...say('BOWL B1: 1, 3, 4'));
  let rd = rimDot(4);
  await until(S(2)); await play(new M.FadeIn(rd), new M.Flash(rd, { color: C.ink }), ...say('BOTTOM, MIDDLE FIXED · RIM CHANGES'));

  // 3-6 uniform line
  await until(S(3)); await play(new M.Create(zLine), new M.FadeIn(new M.VGroup(...zTicks, zName)), ...say('LATENT VALUES: −1 TO 1', C.violet));
  const pick = new M.Dot({ point: [zx(0.3), LZ, 0], radius: 0.12, color: C.violet }); pick.setFill(C.violet, 1);
  await until(S(4)); await play(new M.FadeIn(pick), new M.Flash(pick, { color: C.violet }), ...say('PICK ONE AT RANDOM', C.violet));
  const segA = new M.Line({ start: [zx(-0.9), LZ + 0.22, 0], end: [zx(-0.4), LZ + 0.22, 0], color: C.green, strokeWidth: 6 });
  const segB = new M.Line({ start: [zx(0.4), LZ + 0.22, 0], end: [zx(0.9), LZ + 0.22, 0], color: C.green, strokeWidth: 6 });
  await until(S(5)); await play(new M.FadeOut(pick), new M.Create(segA), new M.Create(segB), ...say('SAME LENGTH = SAME PROBABILITY', C.green));
  await until(S(6)); await play(...say('UNIFORM DISTRIBUTION', C.green));

  // 7-11 the rubber band
  await until(S(7)); await play(new M.FadeOut(new M.VGroup(segA, segB)), new M.LaggedStart(zDots.map(d => new M.FadeIn(d)), { lagRatio: 0.1, runTime: 1.2 }), ...say('A RUBBER BAND WITH EVENLY SPACED DOTS', C.violet));
  await until(S(8)); await play(new M.LaggedStart(zDots.map(d => new M.Indicate(d, { color: C.ink })), { lagRatio: 0.1, runTime: 1.5 }), ...say('EACH DOT = ONE LATENT VALUE', C.violet));
  const rLine = new M.Line({ start: [ux(-2), LR, 0], end: [ux(2), LR, 0], color: C.amber, strokeWidth: 4 });
  const rDots = ZV.map(z => { const d = new M.Dot({ point: [ux(2 * z), LR, 0], radius: 0.075, color: C.amber }); return d; });
  const guides = [0, 4, 8].map(i => { const g = new M.DashedLine({ start: [zx(ZV[i]), LZ - 0.5, 0], end: [ux(2 * ZV[i]), LR + 0.1, 0], color: C.muted }); return g; });
  await until(S(9)); await play(...say('STRETCH TO TWICE THE LENGTH?', C.amber));
  await play(new M.TransformFromCopy(zLine, rLine), ...zDots.map((d, i) => new M.TransformFromCopy(d, rDots[i])), new M.FadeIn(new M.VGroup(...guides)));
  await until(S(10)); await play(new M.LaggedStart(rDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.1, runTime: 1.5 }), ...say('SAME 9 DOTS, FURTHER APART', C.amber));
  await until(S(11)); await play(...say('SAME DOTS, TWICE THE DISTANCE', C.amber));

  // 12-18 the rule: × 2, then + 3
  await until(S(12)); await play(new M.FadeOut(new M.VGroup(...guides)), ...say('A NEW GENERATOR: LATENT VALUES → RIMS'));
  const lab2 = [-2, -1, 0, 1, 2].map(u => new M.VGroup(
    new M.Line({ start: [ux(u), LR - 0.08, 0], end: [ux(u), LR + 0.08, 0], color: C.amber }),
    T(u < 0 ? '−' + Math.abs(u) : String(u), LS, C.amber, true).moveTo([ux(u), LR - 0.34, 0])));
  const lab3 = [-2, -1, 0, 1, 2].map(u => new M.VGroup(
    new M.Line({ start: [ux(u), LR - 0.08, 0], end: [ux(u), LR + 0.08, 0], color: C.amber }),
    T(String(u + 3), LS, C.amber, true).moveTo([ux(u), LR - 0.34, 0])));
  const rName = T('rim', LS, C.amber); rName.moveTo(P ? [ux(-2), LR + 0.62, 0] : [ux(-2) - 0.5, LR, 0]);
  await until(S(13)); await play(...fbox(['step 1', ['× 2', C.amber]]), ...say('MULTIPLY EVERY NUMBER BY 2', C.amber));
  await until(S(14)); await play(new M.FadeIn(new M.VGroup(...lab2)), ...say('NOW −2 TO 2', C.amber));
  await until(S(15)); await play(...fbox(['step 1   × 2', ['step 2   + 3', C.amber]]), ...say('ADD 3 TO EVERY NUMBER', C.amber));
  await until(S(16)); await play(new M.FadeOut(new M.VGroup(...lab2)), new M.FadeIn(new M.VGroup(...lab3)), ...say('NOW 1 TO 5', C.amber));
  await until(S(17)); await play(new M.FadeIn(rName), ...say('EACH NUMBER = A POSSIBLE RIM', C.amber));
  await until(S(18)); await play(...fbox([['rim = 3 + 2 × z', C.amber]], C.amber), ...say('A FIXED RULE = A TRANSFORMATION', C.green));

  // 19-24 five examples drive the pot
  let potNow = pot0, labNow = lab0, arrow = null;
  const EX = [[-1, 1], [-0.5, 2], [0, 3], [0.5, 4], [1, 5]];
  for (let k = 0; k < 5; k++) {
    const [z, r] = EX[k];
    await until(S(19 + k));
    const a = new M.Arrow({ start: [zx(z), LZ - 0.15, 0], end: [ux(2 * z), LR + 0.15, 0], color: C.ink, strokeWidth: 3, buff: 0 });
    const np = pot([1, 3, r], C.amber), nl = potLab([1, 3, r], C.amber), nd = rimDot(r);
    const zs = z < 0 ? '−' + Math.abs(z) : String(z);
    const anims = [new M.Create(a), new M.Transform(potNow, np), new M.FadeOut(labNow), new M.FadeIn(nl), new M.Transform(rd, nd),
      ...fbox([`z = ${zs}`, [`rim = 3 + 2 × ${z < 0 ? '(' + zs + ')' : zs}`, C.amber], [`    = ${r}`, C.amber]], C.amber)];
    if (arrow) anims.push(new M.FadeOut(arrow));
    await play(...anims, ...say(`z = ${zs}  →  RIM ${r}`, C.amber));
    labNow = nl; arrow = a;
  }
  await until(S(24)); await play(new M.FadeOut(arrow), ...dropBox(), ...say('MOVE ALONG THE LINE, THE POT CHANGES', C.amber));
  arrow = null;
  for (const r of [1, 2.5, 4]) {
    const nl = potLab([1, 3, r], C.amber);
    await play(new M.Transform(potNow, pot([1, 3, r], C.amber), { runTime: 0.8 }), new M.Transform(rd, rimDot(r), { runTime: 0.8 }), new M.FadeOut(labNow, { runTime: 0.8 }), new M.FadeIn(nl, { runTime: 0.8 }));
    labNow = nl;
  }

  // 25-26 lengths
  await until(S(25)); await play(new M.Indicate(zLine, { color: C.violet }), ...fbox(['old line', ['  length 2', C.violet]], C.violet));
  await until(S(26)); await play(new M.Indicate(rLine, { color: C.amber }), ...fbox(['old line', ['  length 2', C.violet], 'new line', ['  length 4', C.amber]], C.amber));

  // 27-35 density bars
  const H = P ? 1.2 : 1.1;
  const bar = (x0, x1, y, h, c, op = 0.35) => { const r = new M.Rectangle({ width: x1 - x0, height: h, color: c, strokeWidth: 2 }); r.setFill(c, op); r.moveTo([(x0 + x1) / 2, y + h / 2, 0]); return r; };
  const zBar = bar(zx(-1), zx(1), LZ + 0.02, H * 0.5, C.violet);
  const rBar = bar(ux(-2), ux(2), LR + 0.02, H * 0.25, C.amber);
  const zBarT = T('0.5', 17, C.violet, true, true); zBarT.moveTo([zx(1) + 0.4, LZ + H * 0.5, 0]);
  const rBarT = T('0.25', 17, C.amber, true, true); rBarT.moveTo([ux(2) + (P ? 0.4 : 0.45), LR + H * 0.25 + 0.05, 0]);
  if (P) rBarT.moveTo([ux(1.5), LR + H * 0.25 + 0.25, 0]);
  await until(S(27)); await play(...dropBox(), ...say('HOW IS PROBABILITY SPREAD?', C.green));
  await until(S(28)); await play(new M.FadeIn(zBar), ...say('A FLAT BAR OVER THE OLD LINE', C.violet));
  await until(S(29)); await play(new M.Indicate(zBar, { color: C.violet }), ...say('HEIGHT = PROBABILITY PER UNIT OF LENGTH', C.violet));
  await until(S(30)); await play(...say('HEIGHT = PROBABILITY DENSITY', C.green));
  await until(S(31)); await play(...fbox(['total probability  1', ['length            2', C.violet]], C.violet));
  await until(S(32)); await play(new M.FadeIn(zBarT), ...fbox(['total probability  1', 'length            2', ['density  1 ÷ 2 = 0.5', C.violet]], C.violet));
  await until(S(33)); await play(new M.FadeIn(rBar), ...fbox(['total probability  1', ['length            4', C.amber]], C.amber), ...say('SAME TOTAL, 4 UNITS LONG', C.amber));
  await until(S(34)); await play(new M.FadeIn(rBarT), ...fbox(['total probability  1', 'length            4', ['density  1 ÷ 4 = 0.25', C.amber]], C.amber));
  await until(S(35)); await play(new M.Indicate(zBarT, { color: C.violet }), new M.Indicate(rBarT, { color: C.amber }), ...say('2 × LONGER → HALF AS HIGH', C.green));

  // 36-42 a section keeps its probability
  const zSec = bar(zx(-0.5), zx(0.5), LZ + 0.02, H * 0.5, C.green, 0.45);
  const rSec = bar(ux(-1), ux(1), LR + 0.02, H * 0.25, C.green, 0.45);
  await until(S(36)); await play(new M.FadeIn(zSec), ...dropBox(), ...say('SECTION: −0.5 TO 0.5', C.green));
  await until(S(37)); await play(...fbox(['length   1', ['density  0.5', C.violet]], C.green));
  await until(S(38)); await play(...fbox(['length   1', ['density  0.5', C.violet], ['1 × 0.5 = 0.5', C.green]], C.green), ...say('PROBABILITY = LENGTH × DENSITY', C.green));
  await until(S(39)); await play(new M.TransformFromCopy(zSec, rSec), ...fbox([['same section,', C.green], ['now from 2 to 4', C.amber]], C.green), ...say('SAME SECTION NOW 2 TO 4', C.green));
  await until(S(40)); await play(...fbox(['length   2', ['density  0.25', C.amber]], C.green));
  await until(S(41)); await play(...fbox(['length   2', ['density  0.25', C.amber], ['2 × 0.25 = 0.5', C.green]], C.green), ...say('STILL 0.5', C.green));
  await until(S(42)); await play(new M.Indicate(zSec, { color: C.green }), new M.Indicate(rSec, { color: C.green }), ...say('POSITIONS MOVED · NO PROBABILITY LOST', C.green));

  // 43-48 go back: invertible
  await until(S(43)); await play(new M.FadeOut(new M.VGroup(zSec, rSec)), ...dropBox(), ...say('CAN WE GO BACKWARDS?', C.cyan));
  const r4 = new M.Dot({ point: [ux(1), LR, 0], radius: 0.14, color: C.ink }); r4.setFill(C.ink, 1);
  await until(S(44)); await play(new M.FadeIn(r4), new M.Flash(r4, { color: C.ink }), new M.Transform(potNow, pot([1, 3, 4], C.amber)), new M.Transform(rd, rimDot(4)), ...fbox([['rim = 4', C.amber]], C.amber));
  await until(S(45)); await play(...fbox([['rim = 4', C.amber], '4 − 3 = 1'], C.amber), ...say('SUBTRACT 3'));
  const back = new M.Arrow({ start: [ux(1), LR + 0.15, 0], end: [zx(0.5), LZ - 0.15, 0], color: C.violet, strokeWidth: 3, buff: 0 });
  const z5 = new M.Dot({ point: [zx(0.5), LZ, 0], radius: 0.14, color: C.violet }); z5.setFill(C.violet, 1);
  await until(S(46)); await play(new M.Create(back), new M.FadeIn(z5), ...fbox([['rim = 4', C.amber], '4 − 3 = 1', ['1 ÷ 2 = 0.5 = z', C.violet]], C.violet), ...say('BACK TO z = 0.5', C.violet));
  await until(S(47)); await play(...say('WE CAN UNDO IT: INVERTIBLE', C.green), ...fbox(['forward   rim = 3 + 2 × z', ['backward  z = (rim − 3) ÷ 2', C.violet]], C.green));
  await until(S(48)); await play(...fbox([['normalizing flow:', C.green], ['simple ⇄ complex', C.ink], ['data back to a simple shape', C.muted]], C.green), ...say('NORMALIZING FLOW', C.green));

  // 49-51 the formula
  await until(S(49)); await play(new M.FadeOut(new M.VGroup(back, z5, r4)), ...say('ONE FORMULA', C.cyan));
  await until(S(50)); await play(...fbox(['new density =', '  old density ÷ |stretch|', ['  = 0.5 ÷ 2 = 0.25', C.amber]], C.amber));
  await until(S(51)); await play(new M.Indicate(rBar, { color: C.amber }), ...say('SIMPLE → COMPLEX, DENSITY KNOWN', C.green));

  // 52-54 a rule that cannot be undone
  const bad = ZV.map((z, i) => zDots[i].copy());
  const badT = ZV.map(() => { const d = new M.Dot({ point: [ux(0), LR, 0], radius: 0.075, color: C.pink }); return d; });
  await until(S(52)); await play(...dropBox(), ...say('EVERY z → THE SAME RIM 3?', C.pink));
  const l3 = potLab([1, 3, 3], C.pink);
  await play(...bad.map((d, i) => new M.Transform(d, badT[i])), new M.Transform(potNow, pot([1, 3, 3], C.pink)), new M.Transform(rd, rimDot(3)), new M.FadeOut(labNow), new M.FadeIn(l3));
  labNow = l3;
  const l4 = potLab([1, 3, 4], C.amber);
  const cross = T('✗ cannot go back', 18, C.pink, false, true); cross.moveTo(P ? [0, LR - 0.8, 0] : [ux(0), LR - 0.75, 0]);
  await until(S(53)); await play(new M.FadeIn(cross), ...say('NOT INVERTIBLE: IT FAILS', C.pink));
  await until(S(54)); await play(new M.FadeOut(new M.VGroup(...bad, cross)), new M.Transform(potNow, pot([1, 3, 4], C.amber)), new M.Transform(rd, rimDot(4)), new M.FadeOut(labNow), new M.FadeIn(l4),
    ...fbox(['invertible transformation', ['total probability stays 1', C.green]], C.green), ...say('FLOWS: INVERTIBLE, PROBABILITY KEPT', C.green));
}

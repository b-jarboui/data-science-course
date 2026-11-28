// 18.2.8 Autoregressive generation: one coordinate at a time. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c, P ? [0, 4.15, 0] : undefined);
  const LS = P ? 17 : 15;
  const SH = { B1: [1, 3, 4], B2: [2, 3, 5], V1: [1, 3, 2], V2: [2, 4, 1] };
  const ORDER = ['B1', 'B2', 'V1', 'V2'];

  // originals row
  const OX = P ? [-2.78, -0.93, 0.93, 2.78] : [-6.0, -4.6, -3.2, -1.8];
  const UX = P ? 0.16 : 0.12, UY = 0.25, OB = P ? 2.3 : 0.3;
  function pot(m, x, y0, color, ux = UX, uy = UY, fo = 0.14) {
    const [b, mi, r] = m;
    const v = [[x + b * ux, y0], [x + mi * ux, y0 + 2 * uy], [x + r * ux, y0 + 4 * uy], [x - r * ux, y0 + 4 * uy], [x - mi * ux, y0 + 2 * uy], [x - b * ux, y0]];
    const p = new M.Polygon({ vertices: v.map(([a, c]) => [a, c, 0]), color, strokeWidth: 3 }); p.setFill(color, fo); return p;
  }
  const orig = ORDER.map((n, k) => pot(SH[n], OX[k], OB, C.cyan));
  const olab = ORDER.map((n, k) => {
    const a = T(n, P ? 17 : 15, C.cyan, true, true); a.moveTo([OX[k], OB - 0.3, 0]);
    const b = T(SH[n].join(', '), P ? 16 : 14, C.muted, true); b.moveTo([OX[k], OB - 0.62, 0]);
    return [a, b];
  });
  const half = P ? 0.88 : 0.66;
  const mark = ks => ks.map(k => { const r = new M.Rectangle({ width: 2 * half - 0.1, height: 2.05, color: C.ink, strokeWidth: 2 }); r.moveTo([OX[k], OB + 0.18, 0]); return r; });

  // drawing canvas
  const CX = P ? 0 : 0.2, DX = P ? 0.7 : 0.56, DB = P ? -4.2 : -2.75, DY = P ? 1.4 : 0.9;
  const cx = w => CX + w * DX, Y = [DB, DB + DY, DB + 2 * DY];
  const cline = new M.DashedLine({ start: [CX, DB - 0.2, 0], end: [CX, Y[2] + 0.25, 0], color: C.muted });
  const hlines = Y.map(y => { const l = new M.Line({ start: [cx(-5.4), y, 0], end: [cx(5.4), y, 0], color: C.grid, strokeWidth: 2 }); return l; });
  const hname = ['bottom', 'middle', 'rim'].map((s, i) => { const t = T(s, LS, C.muted); t.moveTo([cx(-5.4) + t.getWidth() / 2, Y[i] + 0.22, 0]); return t; });

  // panel
  const PAN = P ? [0, -5.75, 0] : [5.3, 0.75, 0];
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.4 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(PAN);
    const left = PAN[0] - wd / 2 + 0.35, top = PAN[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 3.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ghost candidates with probabilities, chosen points, segments
  let ghosts = null;
  function ghost(h, opts) {
    const parts = [];
    opts.forEach(([w, p]) => {
      const d = new M.Dot({ point: [cx(w), Y[h], 0], radius: 0.17, color: C.amber }); d.setFill(C.amber, 0.35);
      const t = T(p, P ? 18 : 16, C.amber, true, true); t.moveTo([cx(w), Y[h] + 0.4, 0]);
      parts.push(d, t);
    });
    const g = new M.VGroup(...parts);
    const a = [new M.FadeIn(g)]; if (ghosts) a.push(new M.FadeOut(ghosts)); ghosts = g; return a;
  }
  const dropGhost = () => { const a = ghosts ? [new M.FadeOut(ghosts)] : []; ghosts = null; return a; };
  let drawn = [];
  function point(h, w, prev) {
    const d = new M.Dot({ point: [cx(w), Y[h], 0], radius: 0.1, color: C.ink }); d.setFill(C.ink, 1);
    const t = T(String(w), 18, C.ink, true, true); t.moveTo([cx(w) + 0.32, Y[h] - 0.08, 0]);
    const a = [new M.FadeIn(d), new M.Flash(d, { color: C.ink }), new M.FadeIn(t)];
    drawn.push(d, t);
    if (prev != null) { const s = new M.Line({ start: [cx(prev), Y[h - 1], 0], end: [cx(w), Y[h], 0], color: C.ink, strokeWidth: 4 }); a.push(new M.Create(s)); drawn.push(s); }
    return a;
  }
  function finish(m) { const p = pot(m, CX, DB, C.amber, DX, DY / 2, 0.18); drawn.push(p); return [new M.Create(p)]; }
  const clearDrawn = () => { const a = drawn.length ? [new M.FadeOut(new M.VGroup(...drawn))] : []; drawn = []; return a; };

  // 0-3
  await until(S(0)); await play(new M.Create(cline), ...hlines.map(l => new M.Create(l)), ...say('DRAW A POT FROM THE BOTTOM UP', C.amber));
  const qd = new M.Dot({ point: [cx(2), Y[0], 0], radius: 0.17, color: C.amber }); qd.setFill(C.amber, 0.35);
  const qt = T('?', 26, C.amber, true, true); qt.moveTo([cx(2), Y[0] + 0.45, 0]);
  await until(S(1)); await play(new M.FadeIn(qd), new M.FadeIn(qt), ...say('WHERE SHOULD EACH NEW POINT GO?', C.amber));
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(qd, qt)), new M.LaggedStart(orig.map(p => new M.Create(p)), { lagRatio: 0.2, runTime: 1.6 }), ...say('THE 4 ORIGINAL SHAPES'));
  await until(S(3)); await play(new M.FadeIn(new M.VGroup(...hname)), new M.LaggedStart(hlines.map(l => new M.Indicate(l, { color: C.ink })), { lagRatio: 0.4, runTime: 1.4 }), ...say('3 MEASUREMENTS: BOTTOM · MIDDLE · RIM'));
  for (let k = 0; k < 4; k++) {
    await until(S(4 + k));
    await play(new M.Indicate(orig[k], { color: C.ink }), new M.FadeIn(new M.VGroup(...olab[k])), ...say(`${ORDER[k]}: ${SH[ORDER[k]].join(', ')}`));
  }

  // 8-11
  await until(S(8)); await play(...say('DRAW THE RIGHT EDGE, ONE POINT AT A TIME', C.amber));
  await until(S(9)); await play(new M.LaggedStart(hlines.map(l => new M.Indicate(l, { color: C.ink })), { lagRatio: 0.6, runTime: 2.4 }), ...say('BOTTOM → MIDDLE → RIM'));
  await until(S(10)); await play(...say('EACH NEW POINT MUST FIT THE EARLIER ONES', C.violet));
  await until(S(11)); await play(...say('LEARN THIS FROM THE ORIGINALS', C.green));

  // 12-18 bottom
  await until(S(12)); await play(new M.LaggedStart(olab.map(l => new M.Indicate(l[1], { color: C.ink })), { lagRatio: 0.2, runTime: 1.4 }), ...fbox(['bottoms:', '  1, 2, 1, 2']), ...say('LOOK AT THE BOTTOMS'));
  let mk = mark([0, 2]);
  await until(S(13)); await play(...mk.map(r => new M.Create(r)), ...fbox(['bottom 1:  2 shapes']));
  let mk2 = mark([1, 3]);
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(...mk)), ...mk2.map(r => new M.Create(r)), ...fbox(['bottom 1:  2 shapes', 'bottom 2:  2 shapes']));
  await until(S(15)); await play(new M.FadeOut(new M.VGroup(...mk2)), ...ghost(0, [[1, '0.5'], [2, '0.5']]), ...fbox(['bottom 1:  2/4 = 0.5', 'bottom 2:  2/4 = 0.5'], C.amber), ...say('EACH BOTTOM: 1/2'));
  await until(S(16)); await play(...say('CHOOSE AT RANDOM WITH THESE PROBABILITIES', C.amber));
  await until(S(17)); await play(new M.Indicate(ghosts.submobjects[2], { color: C.ink }), ...say('FIRST CHOICE: 2', C.ink));
  await until(S(18)); await play(...dropGhost(), ...point(0, 2), ...say('BOTTOM POINT AT 2'));

  // 19-24 middle given bottom 2
  mk = mark([1, 3]);
  await until(S(19)); await play(...mk.map(r => new M.Create(r)), ...say('ONLY SHAPES WITH BOTTOM 2'));
  await until(S(20)); await play(new M.Indicate(olab[1][1], { color: C.amber }), new M.Indicate(olab[3][1], { color: C.amber }), ...fbox(['bottom 2:', '  middle 3  →  1 shape', '  middle 4  →  1 shape']));
  await until(S(21)); await play(...ghost(1, [[3, '0.5'], [4, '0.5']]), ...fbox(['given bottom 2:', ['  middle 3  0.5', C.amber], ['  middle 4  0.5', C.amber]], C.amber));
  await until(S(22)); await play(...say('DEPENDS ON AN EARLIER CHOICE = CONDITIONAL', C.violet));
  await until(S(23)); await play(new M.Indicate(ghosts.submobjects[0], { color: C.ink }), ...say('NEXT CHOICE: 3', C.ink));
  await until(S(24)); await play(...dropGhost(), ...point(1, 3, 2), ...say('MIDDLE POINT, CONNECTED'));

  // 25-31 rim given bottom 2, middle 3
  const mk3 = mark([1]);
  await until(S(25)); await play(new M.FadeOut(new M.VGroup(...mk)), ...mk3.map(r => new M.Create(r)), ...say('BOTTOM 2 AND MIDDLE 3?'));
  await until(S(26)); await play(new M.Indicate(orig[1], { color: C.ink }), ...say('ONLY B2 MATCHES'));
  await until(S(27)); await play(...ghost(2, [[5, '1']]), ...fbox(['given bottom 2', 'and middle 3:', ['  rim 5: probability 1', C.amber]], C.amber));
  await until(S(28)); await play(...dropGhost(), ...point(2, 5, 3), ...say('RIM POINT AT 5: EDGE DONE'));
  await until(S(29)); await play(new M.FadeOut(new M.VGroup(...mk3)), ...finish(SH.B2), ...say('MIRROR TO THE LEFT: A BOWL', C.amber));
  await until(S(30)); await play(...fbox(['generated:', ['  2, 3, 5', C.amber]], C.amber), ...say('2, 3, 5: ONE AT A TIME', C.amber));
  await until(S(31)); await play(...say('AUTOREGRESSIVE GENERATION', C.green));

  // 32-37 the network
  const N = net(P ? { layers: [2, 3, 2], center: [0.2, -5.85, 0], width: 3.6, height: 1.3, r: 0.32, names: ['bottom', 'middle'] }
                  : { layers: [2, 3, 2], center: [5.1, 0.85, 0], width: 2.0, height: 1.5, r: 0.3, names: ['bottom', 'middle'] });
  const W0 = [[0.7, -0.4, 0.5], [0.3, 0.8, -0.6]], W1 = [[0.6, -0.5], [-0.3, 0.9], [0.8, 0.2]];
  let outL = null;
  function outLabels(a, b) {
    const ts = [a, b].map((s, i) => { const p = N.pos(2, i); const t = T(s, P ? 17 : 15, C.amber); t.moveTo([p[0] + 0.32 + t.getWidth() / 2, p[1], 0]); return t; });
    const g = new M.VGroup(...ts); const an = [new M.FadeIn(g)]; if (outL) an.push(new M.FadeOut(outL)); outL = g; return an;
  }
  let fl = null;
  function pulse(l, col) {
    const cps = N.edges[l].flat().map(ln => { const f = ln.copy(); f.setColor(col); f.setStrokeWidth(5); f.setStrokeOpacity(1); return f; });
    const a = [new M.LaggedStart(cps.map(f => new M.Create(f)), { lagRatio: 0.1, runTime: 0.8 })];
    if (fl) a.push(new M.FadeOut(fl)); fl = new M.VGroup(...cps); return a;
  }
  const dropPulse = () => { const a = fl ? [new M.FadeOut(fl)] : []; fl = null; return a; };
  await until(S(32)); await play(...dropBox(), new M.FadeIn(N.group), ...say('A NETWORK CAN LEARN THESE PROBABILITIES', C.green));
  await play(...W0.map((r, i) => r.map((w, j) => N.weight(0, i, j, w))).flat(2), ...W1.map((r, i) => r.map((w, j) => N.weight(1, i, j, w))).flat(2));
  await until(S(33)); await play(new M.LaggedStart(N.nodes.flat().map(n => new M.Indicate(n, { color: C.ink })), { lagRatio: 0.1, runTime: 1.6 }), ...say('NEURONS IN LAYERS, CONNECTED'));
  await until(S(34)); await play(...N.value(0, 0, '2'), ...N.value(0, 1, '?', C.muted), ...say('LEFT: MEASUREMENTS ALREADY CHOSEN', C.violet));
  await until(S(35)); await play(...pulse(0, C.cyan));
  await play(...pulse(1, C.cyan), ...N.value(2, 0, '0.5', C.amber), ...N.value(2, 1, '0.5', C.amber), ...outLabels('mid 3', 'mid 4'), ...say('RIGHT: PROBABILITIES OF THE NEXT ONE', C.amber));
  await until(S(36)); await play(...N.value(0, 1, '3'), ...pulse(0, C.cyan), ...say('FEED IN THE NEW MEASUREMENT TOO', C.violet));
  await until(S(37)); await play(...pulse(1, C.cyan), ...N.value(2, 0, '1', C.amber), ...N.value(2, 1, '0', C.amber), ...outLabels('rim 5', 'other'), ...say('A NEW SET OF PROBABILITIES', C.amber));

  // 38-43 probability of the bowl
  await until(S(38));
  await play(...dropPulse(), new M.FadeOut(new M.VGroup(N.group, outL)), ...N.value(0, 0, ''), ...N.value(0, 1, ''), ...N.value(2, 0, ''), ...N.value(2, 1, ''), ...say('PROBABILITY OF THE WHOLE BOWL?', C.green));
  outL = null;
  await until(S(39)); await play(...fbox(['P(B2)', ['  bottom 2   0.5', C.amber]], C.green));
  await until(S(40)); await play(...fbox(['P(B2)', '  bottom 2   0.5', ['  middle 3   0.5', C.amber]], C.green));
  await until(S(41)); await play(...fbox(['P(B2)', '  0.5 × 0.5', ['  rim 5      1', C.amber]], C.green));
  await until(S(42)); await play(...fbox(['P(B2)', ['  0.5 × 0.5 × 1', C.amber]], C.green), ...say('MULTIPLY THE STEPS', C.green));
  await until(S(43)); await play(...fbox(['P(B2)', '  0.5 × 0.5 × 1', ['  = 0.25 = 25%', C.amber]], C.amber), ...say('ONE QUARTER = 25%', C.amber));

  // 44-48 a second generation
  await until(S(44)); await play(...clearDrawn(), ...dropBox(), ...say('ANOTHER SHAPE: BOTTOM 1', C.amber));
  await play(...point(0, 1));
  mk = mark([0, 2]);
  await until(S(45)); await play(...mk.map(r => new M.Create(r)), ...ghost(1, [[3, '1']]), ...say('BOTH HAVE MIDDLE 3 → PROBABILITY 1'));
  await play(...dropGhost(), ...point(1, 3, 1));
  await until(S(46)); await play(...ghost(2, [[2, '0.5'], [4, '0.5']]), ...say('RIM 2 OR 4: 1/2 EACH', C.amber));
  await until(S(47)); await play(new M.FadeOut(new M.VGroup(...mk)), ...dropGhost(), ...point(2, 4, 3), ...say('CHOOSE 4 → BOWL B1', C.amber));
  await play(...finish(SH.B1));
  await until(S(48)); await play(...fbox(['P(B1)', '  0.5 × 1 × 0.5', ['  = 0.25', C.amber]], C.amber), ...say('AGAIN ONE QUARTER', C.amber));

  // 49-54 formula and limits
  await until(S(49)); await play(...say('AS A FORMULA', C.cyan));
  await until(S(50)); await play(...fbox(['P(shape) = P(bottom)', '  × P(middle | bottom)', '  × P(rim | bottom, middle)'], C.cyan));
  await until(S(51)); await play(...say('ORDERED DATA: SHAPES · SENTENCES · SOUNDS', C.green));
  await until(S(52)); await play(...fbox(['each original  0.25', ['4 × 0.25 = 1', C.green]], C.green), new M.LaggedStart(orig.map(g => new M.Indicate(g, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }), ...say('SMALL MODEL: ONLY THE 4 ORIGINALS'));
  const bad = new M.Dot({ point: [cx(1), Y[0], 0], radius: 0.2, color: C.pink }); bad.setFill(C.pink, 0.35);
  await until(S(53)); await play(new M.FadeIn(bad), new M.Flash(bad, { color: C.pink }), ...say('TRAP: AN EARLY MISTAKE AFFECTS ALL LATER STEPS', C.pink));
  await play(new M.LaggedStart(hlines.map(l => new M.Indicate(l, { color: C.pink })), { lagRatio: 0.5, runTime: 1.6 }));
  await until(S(54)); await play(new M.FadeOut(bad), ...fbox(['one part at a time,', ['using the parts', C.amber], ['already made', C.amber]], C.amber), ...say('AUTOREGRESSIVE: BUILD STEP BY STEP', C.green));
}

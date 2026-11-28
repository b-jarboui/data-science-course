// 18.2.6 Mode collapse: when a generator loses variety. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c, P ? [0, 4.15, 0] : undefined);
  const SH = { B1: [1, 3, 4], B2: [2, 3, 5], V1: [1, 3, 2], V2: [2, 4, 1] };
  const ORDER = ['B1', 'B2', 'V1', 'V2'];

  // layout
  const OX = P ? [-2.78, -0.93, 0.93, 2.78] : [-6.0, -4.6, -3.2, -1.8];
  const UX = P ? 0.16 : 0.12, UY = 0.25;
  const OB = P ? 2.25 : 0.3;          // original row base
  const GB = P ? -4.9 : -2.2;          // generated row base
  const PAN = P ? [0, -1.05, 0] : [3.4, 0.0, 0];   // one panel: network / formula box / bars

  // silhouette from (bottom, middle, rim) half-widths at heights 0, 2, 4
  function pot(m, x, y0, color, ux = UX, uy = UY, fo = 0.14) {
    const [b, mi, r] = m;
    const v = [[x + b * ux, y0], [x + mi * ux, y0 + 2 * uy], [x + r * ux, y0 + 4 * uy], [x - r * ux, y0 + 4 * uy], [x - mi * ux, y0 + 2 * uy], [x - b * ux, y0]];
    const p = new M.Polygon({ vertices: v.map(([a, c]) => [a, c, 0]), color, strokeWidth: 3 });
    p.setFill(color, fo); return p;
  }
  function potLab(name, x, y0, color) {
    const a = T(name, P ? 15 : 15, color, true, true); a.moveTo([x, y0 - 0.28, 0]);
    const b = T(SH[name].join(', '), P ? 16 : 14, C.muted, true); b.moveTo([x, y0 - 0.58, 0]);
    return [a, b];
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // family share bars in the panel
  let barsNow = null;
  function bars(pb, pv, color) {
    const W = P ? 3.4 : 2.4, x0 = PAN[0] - (P ? 2.0 : 1.4), parts = [];
    [['bowls', pb, PAN[1] + 0.4], ['vases', pv, PAN[1] - 0.4]].forEach(([s, v, y]) => {
      const t = T(s, 16, C.ink); t.moveTo([x0 - 0.15 - t.getWidth() / 2, y, 0]);
      const w = Math.max(0.04, W * v / 100);
      const r = new M.Rectangle({ width: w, height: 0.36, color, strokeWidth: 2 }); r.setFill(color, 0.55); r.moveTo([x0 + w / 2, y, 0]);
      const q = T(v + '%', 17, color, true, true); q.moveTo([x0 + w + 0.2 + q.getWidth() / 2, y, 0]);
      parts.push(t, r, q);
    });
    const g = new M.VGroup(...parts);
    const a = [new M.FadeIn(g)]; if (barsNow) a.push(new M.FadeOut(barsNow));
    barsNow = g; return a;
  }
  const dropBars = () => { const a = barsNow ? [new M.FadeOut(barsNow)] : []; barsNow = null; return a; };

  const rect = (x0, y0, x1, y1, color, w = 2) => { const r = new M.Rectangle({ width: x1 - x0, height: y1 - y0, color, strokeWidth: w }); r.moveTo([(x0 + x1) / 2, (y0 + y1) / 2, 0]); return r; };

  // 0-1 the studio and its goal: an empty new collection waits at the bottom
  const qm = [0, 1, 2, 3].map(k => { const t = T('?', 34, C.amber, true, true); t.moveTo([OX[k], GB + 0.5, 0]); return t; });
  const qCap = T('new collection', P ? 18 : 16, C.amber); qCap.moveTo([P ? 0 : (OX[0] + OX[3]) / 2, GB - 0.6, 0]);
  await until(S(0)); await play(new M.LaggedStart(qm.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.2 }), new M.FadeIn(qCap), ...say('A GENERATOR MAKES A NEW COLLECTION', C.amber));
  await until(S(1)); await play(...say('WANTED: BOWLS AND VASES', C.cyan));

  // 2-6 the four originals
  const orig = ORDER.map((n, k) => pot(SH[n], OX[k], OB, C.cyan));
  const olab = ORDER.map((n, k) => potLab(n, OX[k], OB, C.cyan));
  await until(S(2)); await play(new M.LaggedStart(orig.map(p => new M.Create(p)), { lagRatio: 0.2, runTime: 1.6 }), ...say('THE 4 ORIGINAL SHAPES'));
  for (let k = 0; k < 4; k++) {
    await until(S(3 + k));
    await play(new M.Indicate(orig[k], { color: C.ink }), new M.FadeIn(new M.VGroup(...olab[k])),
      ...say(`${ORDER[k]}: BOTTOM ${SH[ORDER[k]][0]}, MIDDLE ${SH[ORDER[k]][1]}, RIM ${SH[ORDER[k]][2]}`));
  }

  // 7-8 two families, 50% each
  const fy0 = OB - 1.1, fy1 = OB + 1.15;
  const half = P ? 0.88 : 0.68;
  const bowlBox = rect(OX[0] - half, fy0, OX[1] + half, fy1, C.cyan, 2);
  const vaseBox = rect(OX[2] - half, fy0, OX[3] + half, fy1, C.violet, 2);
  const bowlT = T('bowls', 15, C.cyan); bowlT.moveTo([(OX[0] + OX[1]) / 2, OB - 0.88, 0]);
  const vaseT = T('vases', 15, C.violet); vaseT.moveTo([(OX[2] + OX[3]) / 2, OB - 0.88, 0]);
  await until(S(7)); await play(new M.Create(bowlBox), new M.Create(vaseBox), new M.FadeIn(bowlT), new M.FadeIn(vaseT), ...say('4 SHAPES · 2 FAMILIES'));
  await until(S(8)); await play(...bars(50, 50, C.cyan), ...say('ORIGINAL: 50% BOWLS, 50% VASES'));

  // 9-14 the generator network keeps making B1
  const N = net(P ? { layers: [1, 3, 3], center: PAN, width: 3.6, height: 1.6, r: 0.3, names: ['z'] }
                  : { layers: [1, 3, 3], center: PAN, width: 3.0, height: 1.8, r: 0.28, names: ['z'] });
  const outs = ['bottom', 'middle', 'rim'].map((s, i) => { const p = N.pos(2, i); const t = T(s, P ? 16 : 15, C.amber); t.moveTo([p[0] + 0.36 + t.getWidth() / 2, p[1], 0]); return t; });
  const W0 = [0.8, -0.5, 0.6], W1 = [[0.7, 0.3, -0.4], [-0.6, 0.9, 0.2], [0.4, -0.3, 0.8]];
  await until(S(9));
  await play(...dropBars(), new M.FadeOut(new M.VGroup(...qm, qCap)), new M.FadeIn(N.group), new M.FadeIn(new M.VGroup(...outs)), ...say('THE GENERATOR NETWORK', C.amber));
  await play(...W0.map((w, j) => N.weight(0, 0, j, w)).flat(), ...W1.map((r, i) => r.map((w, j) => N.weight(1, i, j, w))).flat(2));
  let fl = null;
  function pulse(l, col) {
    const cps = N.edges[l].flat().map(ln => { const f = ln.copy(); f.setColor(col); f.setStrokeWidth(5); f.setStrokeOpacity(1); return f; });
    const a = [new M.LaggedStart(cps.map(f => new M.Create(f)), { lagRatio: 0.1, runTime: 0.8 })];
    if (fl) a.push(new M.FadeOut(fl)); fl = new M.VGroup(...cps); return a;
  }
  const dropPulse = () => { const a = fl ? [new M.FadeOut(fl)] : []; fl = null; return a; };
  const gen = [], glab = [];
  async function make(k, name, zs) {
    await play(...N.value(0, 0, zs, C.violet), ...pulse(0, C.violet));
    const m = SH[name];
    const p = pot(m, OX[k], GB, C.amber), lab = potLab(name, OX[k], GB, C.amber);
    gen.push(p); glab.push(...lab);
    await play(...pulse(1, C.amber), ...N.value(2, 0, m[0], C.amber), ...N.value(2, 1, m[1], C.amber), ...N.value(2, 2, m[2], C.amber),
      new M.FadeIn(p), new M.FadeIn(new M.VGroup(...lab)));
  }
  await until(S(10)); await play(...say('A RANDOM LATENT VALUE z GOES IN', C.violet)); await make(0, 'B1', 'z1');
  await until(S(11)); await play(...say('OUT: BOWL 1, 3, 4', C.amber));
  await until(S(12)); await play(...say('NEW z  →  SAME BOWL', C.pink)); await make(1, 'B1', 'z2');
  await until(S(13)); await play(...say('3RD z  →  SAME BOWL', C.pink)); await make(2, 'B1', 'z3');
  await until(S(14)); await play(...say('4TH z  →  SAME BOWL', C.pink)); await make(3, 'B1', 'z4');

  // 15-22 look at the generated collection
  await until(S(15)); await play(...say('CYAN = ORIGINAL · AMBER = GENERATED'));
  await until(S(16)); await play(new M.LaggedStart(gen.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.3, runTime: 2 }), ...say('EACH BOWL ALONE LOOKS GOOD ✓', C.green));
  await until(S(17)); await play(...say('BUT TOGETHER?', C.amber));
  const genBox = rect(OX[0] - half, GB - 0.8, OX[3] + half, GB + 1.15, C.amber, 2);
  await until(S(18)); await play(new M.Create(genBox), ...say('4 SHAPES, ONLY 1 DESIGN', C.amber));
  await until(S(19)); await play(new M.Indicate(bowlBox, { color: C.amber }), ...say('ALL 4 ARE BOWLS', C.amber));
  await until(S(20)); await play(new M.Indicate(vaseBox, { color: C.pink }), ...say('NO VASES AT ALL', C.pink));
  await until(S(21)); await play(...say('A SHOP THAT FORGETS HOW TO MAKE VASES', C.violet));
  await until(S(22)); await play(...say('QUALITY KEPT · VARIETY LOST', C.pink));

  // 23-27 modes
  await until(S(23)); await play(...say('THIS CAN HAPPEN WHEN A GENERATOR LEARNS'));
  await until(S(24)); await play(...N.value(0, 0, 'z5', C.violet), ...pulse(0, C.violet), ...say('DIFFERENT z  →  SAME SHAPE', C.pink));
  await play(...pulse(1, C.amber));
  await until(S(25)); await play(new M.Indicate(bowlBox, { color: C.cyan }), ...say('MODE = A GROUP OF SIMILAR EXAMPLES', C.green));
  await until(S(26)); await play(new M.Indicate(vaseBox, { color: C.violet }), ...say('2 FAMILIES = 2 MODES', C.green));
  await until(S(27)); await play(new M.Indicate(genBox, { color: C.pink }), ...say('A MODE IS LOST = MODE COLLAPSE', C.pink));

  // 28-32 count designs and families
  await until(S(28));
  await play(...dropPulse(), new M.FadeOut(new M.VGroup(N.group, ...outs)), ...N.value(0, 0, ''), ...N.value(2, 0, ''), ...N.value(2, 1, ''), ...N.value(2, 2, ''), ...say('CHECK: COUNT DESIGNS AND FAMILIES', C.green));
  await until(S(29)); await play(...fbox(['designs', '  original  4', ['  generated 1', C.amber]]));
  await until(S(30)); await play(...fbox(['designs', '  original  4', ['  generated 1', C.amber], 'families', '  original  2', ['  generated 1', C.amber]]));
  await until(S(31)); await play(...dropBox(), ...bars(100, 0, C.amber), ...say('GENERATED: 100% BOWLS', C.amber));
  await until(S(32)); await play(...say('VASES: 0%', C.pink));

  // 33-37 another generator
  await until(S(33)); await play(new M.FadeOut(new M.VGroup(...gen, ...glab, genBox)),...dropBars(), ...say('ANOTHER GENERATOR: 4 OUTPUTS', C.amber));
  const G2 = ['B1', 'V2', 'B2', 'V1'];
  const gen2 = G2.map((n, k) => pot(SH[n], OX[k], GB, C.amber)), glab2 = G2.map((n, k) => potLab(n, OX[k], GB, C.amber));
  await until(S(34)); await play(new M.LaggedStart(gen2.map((p, k) => new M.FadeIn(new M.VGroup(p, ...glab2[k]))), { lagRatio: 0.6, runTime: Math.max(2, E(34) - S(34) - 0.5) }), ...say('B1 · V2 · B2 · V1', C.amber));
  await until(S(35)); await play(...fbox(['designs   4', 'families  2'], C.green), ...say('4 DESIGNS · BOTH FAMILIES', C.green));
  await until(S(36)); await play(...dropBox(), ...bars(50, 50, C.amber), ...say('50% BOWLS · 50% VASES', C.green));
  await until(S(37)); await play(...say('GOOD VARIETY = ALL GROUPS OF THE DATA', C.green));

  // 38-46 small samples mislead
  await until(S(38)); await play(...say('BUT 4 SHAPES IS A SMALL SAMPLE', C.amber));
  await until(S(39)); await play(new M.FadeOut(new M.VGroup(...gen2, ...glab2.flat())), ...dropBars(), ...fbox(['bowl  1/2', 'vase  1/2']), ...say('BALANCED: BOWL OR VASE, 1/2 EACH'));
  await until(S(40)); await play(...say('INDEPENDENT: EARLIER CHOICES DO NOT MATTER', C.violet));
  const q4 = [0, 1, 2, 3].map(k => pot(SH.B1, OX[k], GB, C.amber));
  const h4 = [0, 1, 2, 3].map(k => { const t = T('1/2', 15, C.amber, true); t.moveTo([OX[k], GB - 0.3, 0]); return t; });
  await until(S(41)); await play(new M.LaggedStart(q4.map((p, k) => new M.FadeIn(new M.VGroup(p, h4[k]))), { lagRatio: 0.3, runTime: 1.6 }), ...fbox(['4 bowls', '  1/2 × 1/2 × 1/2 × 1/2']), ...say('4 BOWLS IN A ROW'));
  await until(S(42)); await play(...fbox(['4 bowls', '  1/2 × 1/2 × 1/2 × 1/2', ['  = 1/16', C.amber]]));
  await until(S(43)); await play(...q4.map((p, k) => new M.Transform(p, pot(SH.V1, OX[k], GB, C.amber))), ...fbox(['4 bowls  1/16', ['4 vases  1/16', C.amber]]), ...say('4 VASES: ALSO 1/16'));
  await until(S(44)); await play(...fbox(['4 bowls  1/16', '4 vases  1/16', ['either:  1/16 + 1/16', C.amber]]), ...say('EITHER ONE = 4 OF ONE FAMILY → ADD', C.violet));
  await until(S(45)); await play(...fbox(['4 bowls  1/16', '4 vases  1/16', 'either:  1/16 + 1/16', ['  = 2/16 = 1/8', C.amber], ['  = 12.5%', C.amber]], C.amber));
  await until(S(46)); await play(...say('BALANCED CAN STILL GIVE 4 OF ONE FAMILY', C.amber));

  // 47-48 many outputs
  const n = 10, sp = P ? 1.25 : 0.56, tux = P ? 0.13 : 0.065, tuy = P ? 0.16 : 0.11;
  const bal = ['B', 'V', 'V', 'B', 'V', 'B', 'B', 'V', 'B', 'V'];
  // phone: each generator gets 2 rows of 5 bigger shapes; laptop: 1 row of 10
  const rowY = P ? [-0.55, -3.5] : [PAN[1] + 0.35, PAN[1] - 1.05];
  const cell = (g, i) => P ? [(i % 5 - 2) * sp, rowY[g] - 0.55 - (i < 5 ? 0 : 1.05)] : [PAN[0] - (n - 1) * sp / 2 + i * sp, rowY[g] - 0.18];
  const rowT = [['balanced: 5 bowls, 5 vases', C.green], ['collapsed: 10 bowls, 0 vases', C.pink]].map(([s, c], i) => { const t = T(s, P ? 18 : 15, c); t.moveTo([PAN[0], rowY[i] + (P ? 0.45 : 0.62), 0]); return t; });
  const r1 = bal.map((f, i) => pot(f === 'B' ? SH.B1 : SH.V1, cell(0, i)[0], cell(0, i)[1], C.amber, tux, tuy, 0.2));
  const r2 = bal.map((_, i) => pot(SH.B1, cell(1, i)[0], cell(1, i)[1], C.amber, tux, tuy, 0.2));
  await until(S(47));
  await play(new M.FadeOut(new M.VGroup(...q4, ...h4)), ...dropBox(), new M.FadeIn(new M.VGroup(...rowT)), ...say('MANY MORE OUTPUTS: COUNT THEM'));
  const run = Math.max(3, E(48) - S(47) - 2.5);
  await play(new M.LaggedStart(r1.map((p, i) => new M.FadeIn(new M.VGroup(p, r2[i]))), { lagRatio: 0.5, runTime: run }));
  await until(S(48)); await play(...say('BALANCED: BOTH · COLLAPSED: ONLY BOWLS', C.amber));
  await until(S(49)); await play(new M.LaggedStart(r2.map(g => new M.Indicate(g, { color: C.pink })), { lagRatio: 0.1, runTime: 1.6 }), ...say('CONVINCING SHAPES, BUT VARIETY LOST', C.pink));

  // 50-53 the second trap and the summary
  await until(S(50)); await play(new M.FadeOut(new M.VGroup(...r1, ...r2, ...rowT)), ...say('TRAP: COUNTING DESIGNS ONLY', C.amber));
  const DB = ['B1', 'B2', 'B1', 'B2'];
  const gen3 = DB.map((nm, k) => pot(SH[nm], OX[k], GB, C.amber)), glab3 = DB.map((nm, k) => potLab(nm, OX[k], GB, C.amber));
  await until(S(51)); await play(new M.LaggedStart(gen3.map((p, k) => new M.FadeIn(new M.VGroup(p, ...glab3[k]))), { lagRatio: 0.3, runTime: 1.6 }), ...fbox(['designs   2', ['families  1', C.pink], ['vases     0', C.pink]], C.pink), ...say('DIFFERENT BOWLS, STILL NO VASE', C.pink));
  await until(S(52)); await play(new M.LaggedStart(orig.map(g => new M.Indicate(g, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }), ...fbox(['check both:', ['quality of each shape', C.cyan], ['variety across many', C.green]], C.green), ...say('QUALITY + VARIETY', C.green));
  await until(S(53)); await play(new M.Indicate(vaseBox, { color: C.pink }), ...say('MODE COLLAPSE = ONLY PART OF THE VARIETY', C.pink));
}

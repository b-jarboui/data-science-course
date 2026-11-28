// 17.3.11 Semantic segmentation: giving every pixel a label. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const G = [[4, 4, 4, 4], [4, 4, 1, 1], [4, 4, 1, 1], [4, 4, 4, 4]];
  const LB = G.map(r => r.map(v => v === 1 ? 1 : 0));
  const say = (s, c = C.cyan) => showA(s, c);
  const BOXP = P ? [0, -3.3, 0] : [0, -0.6, 0];
  const CHIP = C.pink, SOUND = C.cyan;

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
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
    const maxw = P ? FW - 1.2 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };
  const rect = (x0, y0, x1, y1, color, w = 3) => {
    const r = new M.Rectangle({ width: x1 - x0, height: y1 - y0, color, strokeWidth: w });
    r.moveTo([(x0 + x1) / 2, (y0 + y1) / 2, 0]); return r;
  };

  // original picture (left) and the new grid (right)
  const BS = P ? 0.68 : 0.85;
  const TC = P ? [-1.95, 0.55] : [-4.6, -0.6], SC = P ? [1.95, 0.55] : [4.6, -0.6];
  const at = (O, r, c) => [O[0] + (c - 1.5) * BS, O[1] + (1.5 - r) * BS, 0];
  const cellBox = (O, r, c, color, w = 4) => { const p = at(O, r, c); return rect(p[0] - BS / 2, p[1] - BS / 2, p[0] + BS / 2, p[1] + BS / 2, color, w); };
  const rowBox = (O, r, color) => rect(O[0] - 2 * BS - 0.05, at(O, r, 0)[1] - BS / 2 - 0.03, O[0] + 2 * BS + 0.05, at(O, r, 0)[1] + BS / 2 + 0.03, color, 4);
  const shade = v => v === 4 ? '#3a4a78' : '#141a30';
  const tile = [], nums = [], seg = [], segLab = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const q = new M.Rectangle({ width: BS, height: BS, color: C.muted, strokeWidth: 1 });
    q.setFill(shade(G[r][c]), 1); q.moveTo(at(TC, r, c)); tile.push(q);
    const t = T(String(G[r][c]), 18, G[r][c] === 4 ? C.ink : C.pink, true); t.moveTo(at(TC, r, c)); nums.push(t);
    const s = new M.Rectangle({ width: BS, height: BS, color: C.muted, strokeWidth: 2 }); s.setFill(C.card, 0.95); s.moveTo(at(SC, r, c)); seg.push(s);
    const lab = LB[r][c], f = new M.Rectangle({ width: BS * 0.86, height: BS * 0.86, color: lab ? CHIP : SOUND, strokeWidth: 0 });
    f.setFill(lab ? CHIP : SOUND, lab ? 0.5 : 0.12); f.moveTo(at(SC, r, c));
    const lt = T(String(lab), 19, lab ? C.ink : SOUND, true, true); lt.moveTo(at(SC, r, c));
    segLab.push(new M.VGroup(f, lt));
  }
  const rowNums = [0, 1, 2, 3].map(r => { const t = T(String(r + 1), 15, C.amber, true); t.moveTo([TC[0] - 2 * BS - 0.25, at(TC, r, 0)[1], 0]); return t; });

  await until(S(0)); await play(new M.LaggedStart(tile.map(q => new M.FadeIn(q)), { lagRatio: 0.04, runTime: 1.2 }), ...say('REPAIR THE CHIPPED SURFACE'));
  const dark = [6, 7, 10, 11];
  await until(S(1)); await play(new M.LaggedStart(dark.map(i => new M.Indicate(tile[i], { color: C.pink })), { lagRatio: 0.2, runTime: 1.4 }), ...say('ONLY THE DAMAGED PART', C.pink));
  const bb = rect(at(TC, 1, 2)[0] - BS / 2 - 0.1, at(TC, 2, 2)[1] - BS / 2 - 0.1, at(TC, 1, 3)[0] + BS / 2 + 0.1, at(TC, 1, 2)[1] + BS / 2 + 0.1, C.amber, 5);
  await until(S(2)); await play(new M.Create(bb), ...say('A BOX SAYS WHERE THE CHIP IS', C.amber));
  await until(S(3)); await play(new M.Indicate(bb, { color: C.amber }), ...say('BUT A CHIP CAN HAVE AN UNEVEN SHAPE', C.amber));
  await until(S(4)); await play(new M.FadeOut(bb), ...say('WHICH PIXELS EXACTLY?', C.amber));
  await until(S(5)); await play(new M.FadeIn(new M.VGroup(...rowNums)), ...say('4 ROWS × 4 COLUMNS'));
  await until(S(6)); await play(new M.LaggedStart(tile.map(q => new M.Indicate(q, { color: C.cyan })), { lagRatio: 0.06, runTime: 1.6 }), ...say('16 PIXELS'));
  const idx = v => nums.filter((_, i) => G[Math.floor(i / 4)][i % 4] === v);
  await until(S(7)); await play(new M.LaggedStart(idx(4).map(t => new M.FadeIn(t)), { lagRatio: 0.06, runTime: 1.2 }), ...say('SMOOTH = 4'));
  await until(S(8)); await play(new M.LaggedStart(idx(1).map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1 }), ...say('CHIPPED = 1', C.pink));
  await until(S(9)); await play(new M.LaggedStart(seg.map(s => new M.FadeIn(s)), { lagRatio: 0.04, runTime: 1.4 }), ...say('AN EMPTY GRID BESIDE IT'));
  const m1 = [cellBox(TC, 0, 0, C.amber), cellBox(SC, 0, 0, C.amber)], m2 = [cellBox(TC, 2, 3, C.violet), cellBox(SC, 2, 3, C.violet)];
  await until(S(10)); await play(...m1.map(b => new M.Create(b)), ...say('EVERY SQUARE ↔ ONE PIXEL'));
  await play(...m2.map(b => new M.Create(b)));
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(...m1, ...m2)), ...fbox(['two pens:']), ...say('TWO COLORED PENS', C.violet));
  await until(S(12)); await play(...fbox(['two pens:', ['pen 1: chipped', CHIP]]));
  await until(S(13)); await play(...fbox(['two pens:', ['pen 1: chipped', CHIP], ['pen 2: sound', SOUND]]));
  await until(S(14)); await play(...say('SOUND = NO DAMAGE', SOUND));
  await until(S(15)); await play(...fbox(['2 classes:', ['chipped', CHIP], ['sound', SOUND]]), ...say('CHIPPED, SOUND = CLASSES', C.violet));
  await until(S(16)); await play(...say('A CLASS FOR EVERY PIXEL = SEMANTIC SEGMENTATION', C.green));
  await until(S(17)); await play(...fbox([['semantic', C.green], '= about meaning'], C.green), ...say('SEMANTIC = MEANING', C.green));
  await until(S(18)); await play(...fbox(['what a pixel shows,', 'not how bright it is'], C.green), ...say('WHAT DOES EACH PIXEL SHOW?', C.green));

  // the network: 16 inputs, 4 middle, 16 outputs
  const NR = P ? 0.085 : 0.09;
  const N = net(P ? { layers: [16, 4, 16], center: [0, -3.95, 0], width: 5.4, height: 4.1, r: NR }
                  : { layers: [16, 4, 16], center: [0, -0.65, 0], width: 3.6, height: 3.4, r: NR });
  N.nodes[0].forEach((n, i) => n.setFill(G[Math.floor(i / 4)][i % 4] === 4 ? '#c9d2e6' : '#141a30', 1));
  N.edges.flat(2).forEach(l => { l.setStrokeOpacity(0.18); l.setStrokeWidth(1); });
  async function flow(rows, color = C.amber) {
    const ds = [], ts = [];
    const add = (l, i, j) => {
      const a = N.pos(l, i), b = N.pos(l + 1, j);
      const d = new M.Dot({ point: [a[0] + NR, a[1], 0], radius: 0.045, color }); d.setFill(color, 1);
      const t = new M.Dot({ point: [b[0] - NR, b[1], 0], radius: 0.045, color }); t.setFill(color, 1);
      ds.push(d); ts.push(t);
    };
    const ins = rows.flatMap(r => [0, 1, 2, 3].map(c => r * 4 + c));
    ins.forEach(i => [0, 1, 2, 3].forEach(j => add(0, i, j)));
    [0, 1, 2, 3].forEach(i => ins.forEach(j => add(1, i, j)));
    const n0 = ins.length * 4;
    await play(...ds.slice(0, n0).map(d => new M.FadeIn(d, { runTime: 0.1 })));
    await play(...ds.slice(0, n0).map((d, k) => new M.Transform(d, ts[k], { runTime: 0.6 })));
    await play(new M.FadeOut(new M.VGroup(...ds.slice(0, n0)), { runTime: 0.15 }), ...ds.slice(n0).map(d => new M.FadeIn(d, { runTime: 0.15 })));
    await play(...ds.slice(n0).map((d, k) => new M.Transform(d, ts[n0 + k], { runTime: 0.6 })));
    await play(new M.FadeOut(new M.VGroup(...ds.slice(n0)), { runTime: 0.2 }));
  }
  const inLab = T('16 readings', 14, C.muted), outLab = T('16 labels', 14, C.muted);
  const p0 = N.pos(0, 15), p2 = N.pos(2, 15);
  inLab.moveTo([p0[0], p0[1] - 0.3, 0]); outLab.moveTo([p2[0], p2[1] - 0.3, 0]);
  await until(S(19)); await play(...dropBox(), ...say('A SMALL NEURAL NETWORK', C.violet));
  await until(S(20)); await play(new M.FadeIn(N.group), new M.FadeIn(inLab), ...say('16 READINGS IN 16 CIRCLES'));
  await until(S(21)); await play(...say('THROUGH CONNECTED CIRCLES'));
  await flow([0, 1, 2, 3]);
  await until(S(22)); await play(new M.FadeIn(outLab), new M.LaggedStart(N.nodes[2].map(n => new M.Indicate(n, { color: C.amber })), { lagRatio: 0.05, runTime: 1.4 }), ...say('16 OUTPUTS: ONE PER PIXEL', C.amber));
  await until(S(23)); await play(...say('THIS EXAMPLE: A FIXED RULE', C.violet));
  await until(S(24)); await play(...say('READING 1 → CHIPPED', CHIP));
  await until(S(25)); await play(...say('READING 4 → SOUND', SOUND));
  const leg1 = pill('1 = CHIPPED', CHIP, 13), leg0 = pill('0 = SOUND', SOUND, 13);
  leg1.moveTo(P ? [SC[0] - 0.75, SC[1] - 2 * BS - 0.4, 0] : [SC[0] - 0.8, SC[1] - 2 * BS - 0.45, 0]);
  leg0.moveTo(P ? [SC[0] + 0.8, SC[1] - 2 * BS - 0.4, 0] : [SC[0] + 0.85, SC[1] - 2 * BS - 0.45, 0]);
  await until(S(26)); await play(new M.FadeIn(leg1), ...say('CHIPPED → LABEL 1', CHIP));
  await until(S(27)); await play(new M.FadeIn(leg0), ...say('SOUND → LABEL 0', SOUND));
  await until(S(28)); await play(...say('LABELS NAME CLASSES, NOT BRIGHTNESS', C.violet));

  // row by row
  let rb = rowBox(TC, 0, C.amber);
  const setOut = r => [0, 1, 2, 3].forEach(c => N.nodes[2][r * 4 + c].setFill(LB[r][c] ? CHIP : SOUND, 0.9));
  const rowAnims = r => [new M.LaggedStart([0, 1, 2, 3].map(c => new M.FadeIn(segLab[r * 4 + c])), { lagRatio: 0.2, runTime: 1.0 })];
  await until(S(29)); await play(new M.Create(rb), new M.LaggedStart([0, 1, 2, 3].map(i => new M.Indicate(N.nodes[0][i], { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }), ...say('ROW 1 THROUGH THE NETWORK', C.amber));
  await until(S(30)); await play(...say('ALL 4 READINGS = 4'));
  await until(S(31)); await play(...say('4 LABELS OF 0', SOUND)); await flow([0]); setOut(0);
  await until(S(32)); await play(...rowAnims(0), ...say('INTO ROW 1 OF THE NEW GRID'));
  await until(S(33)); await play(new M.Transform(rb, rowBox(TC, 1, C.amber)), ...say('ROW 2', C.amber));
  await until(S(34)); await play(...say('READINGS: 4, 4, 1, 1'));
  await until(S(35)); await play(...say('LABELS: 0, 0, 1, 1', CHIP)); await flow([1]); setOut(1);
  await until(S(36)); await play(...rowAnims(1), ...say('INTO ROW 2 OF THE NEW GRID'));
  await until(S(37)); await play(new M.Transform(rb, rowBox(TC, 2, C.amber)), ...say('ROW 3: SAME READINGS, SAME LABELS', C.amber));
  await flow([2]); setOut(2); await play(...rowAnims(2));
  await until(S(38)); await play(new M.Transform(rb, rowBox(TC, 3, C.amber)), ...say('ROW 4: FOUR ZEROS', SOUND));
  await flow([3]); setOut(3); await play(...rowAnims(3));

  // 39-48 the segmentation map
  await until(S(39)); await play(new M.FadeOut(new M.VGroup(N.group, inLab, outLab, rb)), ...say('A LABEL FOR EVERY PIXEL', C.green));
  await until(S(40)); await play(...fbox([['segmentation map', C.green], '= a grid of', '  class labels'], C.green), ...say('SEGMENTATION MAP', C.green));
  await until(S(41)); await play(...say('THE RULE IN SHORT FORM'));
  await until(S(42)); await play(...fbox([['label = 1', CHIP], '  if brightness = 1']));
  await until(S(43)); await play(...fbox([['label = 1', CHIP], '  if brightness = 1', ['label = 0', SOUND], '  if brightness = 4']));
  await until(S(44)); await play(...dropBox(), ...say('COUNT THE 1s', CHIP));
  const ones = [6, 7, 10, 11];
  await until(S(45)); await play(new M.LaggedStart(ones.map(i => new M.Indicate(segLab[i], { color: CHIP })), { lagRatio: 0.3, runTime: 1.8 }), ...fbox([['2 + 2 = 4 chipped', CHIP]]));
  await until(S(46)); await play(...fbox([['2 + 2 = 4 chipped', CHIP], ['16 − 4 = 12 sound', SOUND]]), ...say('12 SOUND PIXELS', SOUND));
  const cut = rect(at(SC, 1, 2)[0] - BS / 2 - 0.05, at(SC, 2, 2)[1] - BS / 2 - 0.05, at(SC, 1, 3)[0] + BS / 2 + 0.05, at(SC, 1, 2)[1] + BS / 2 + 0.05, C.green, 5);
  await until(S(47)); await play(new M.Create(cut), ...say('FOLLOWS THE SHAPE, PIXEL BY PIXEL', C.green));
  await until(S(48)); await play(...fbox([['shape and size', C.green], 'of the damage'], C.green), ...say('FIND THE SHAPE AND SIZE OF DAMAGE', C.green));

  // 49-51 a shadow fools the rule
  const shadow = new M.Rectangle({ width: BS, height: BS, color: C.muted, strokeWidth: 1 }); shadow.setFill('#141a30', 1); shadow.moveTo(at(TC, 3, 0));
  const sh1 = T('1', 18, C.pink, true); sh1.moveTo(at(TC, 3, 0));
  const shTag = pill('SHADOW', C.muted, 15); shTag.moveTo([at(TC, 3, 0)[0], at(TC, 3, 0)[1] - BS / 2 - 0.3, 0]);
  await until(S(49)); await play(new M.FadeOut(cut), ...dropBox(), new M.FadeOut(nums[12]), new M.FadeIn(shadow), new M.FadeIn(sh1), new M.FadeIn(shTag), ...say('A SHADOW MAKES A SOUND PIXEL DARK', C.amber));
  const wrongF = new M.Rectangle({ width: BS * 0.86, height: BS * 0.86, color: CHIP, strokeWidth: 0 }); wrongF.setFill(CHIP, 0.5); wrongF.moveTo(at(SC, 3, 0));
  const wrongT = T('1', 19, C.ink, true, true); wrongT.moveTo(at(SC, 3, 0));
  const wrongB = cellBox(SC, 3, 0, C.amber, 5);
  const wrongTag = pill('WRONG', C.amber, 15); wrongTag.moveTo([at(SC, 3, 0)[0], at(SC, 3, 0)[1] - BS / 2 - 0.3, 0]);
  await until(S(50)); await play(new M.FadeOut(segLab[12]), new M.FadeIn(wrongF), new M.FadeIn(wrongT), new M.Create(wrongB), new M.FadeIn(wrongTag), new M.FadeOut(new M.VGroup(leg1, leg0)),
    ...say('BRIGHTNESS 1 → WRONGLY LABELLED CHIPPED', C.amber));
  const nb = [cellBox(TC, 2, 0, C.green, 3), cellBox(TC, 3, 1, C.green, 3)];
  await until(S(51)); await play(...nb.map(b => new M.Create(b)), ...say('REAL NETWORKS ALSO USE NEIGHBOR PIXELS', C.green),
    ...fbox(['real networks use', ['neighbors + patterns,', C.green], 'not just brightness'], C.green));
  await until(S(52)); await play(new M.FadeOut(new M.VGroup(...nb)), ...say('SEGMENTATION: A CLASS FOR EVERY PIXEL', C.green),
    ...fbox([['semantic segmentation', C.green], 'every pixel', 'gets a class'], C.green));
}

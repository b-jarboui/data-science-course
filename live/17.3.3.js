// 17.3.3 Weight sharing: one filter for many places. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const G = [[4, 4, 4, 4], [4, 4, 1, 1], [4, 4, 1, 1], [4, 4, 4, 4]];
  const say = (s, c = C.cyan) => showA(s, c);
  const BOXP = P ? [0, -4.55, 0] : [4.55, -0.6, 0];

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
    const maxw = P ? FW - 1.2 : 3.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };
  const rect = (x0, y0, x1, y1, color, w = 3) => {
    const r = new M.Rectangle({ width: x1 - x0, height: y1 - y0, color, strokeWidth: w });
    r.moveTo([(x0 + x1) / 2, (y0 + y1) / 2, 0]); return r;
  };

  // tile in the camera view
  const BC = P ? [0.2, 0.5, 0] : [-4.4, -0.6, 0], BS = P ? 0.6 : 0.72;
  const bpos = (r, c) => [BC[0] + (c - 1.5) * BS, BC[1] + (1.5 - r) * BS, 0];
  const shade = v => v === 4 ? '#3a4a78' : '#151b33';
  const bx0 = BC[0] - 2 * BS, bx1 = BC[0] + 2 * BS, by0 = BC[1] - 2 * BS, by1 = BC[1] + 2 * BS;
  const tile = [], nums = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const q = new M.Rectangle({ width: BS, height: BS, color: C.muted, strokeWidth: 1 });
    q.setFill(shade(G[r][c]), 1); q.moveTo(bpos(r, c)); tile.push(q);
    const t = T(String(G[r][c]), P ? 16 : 19, G[r][c] === 4 ? C.ink : C.pink, true); t.moveTo(bpos(r, c)); nums.push(t);
  }
  const rowNums = [0, 1, 2, 3].map(r => { const t = T(String(r + 1), 15, C.amber, true); t.moveTo([bx0 - 0.3, bpos(r, 0)[1], 0]); return t; });

  await until(S(0)); await play(new M.LaggedStart(tile.map(q => new M.FadeIn(q)), { lagRatio: 0.04, runTime: 1.2 }), ...say('HUNDREDS OF TILES EVERY DAY'));
  const chipBox = rect(bpos(1, 2)[0] - BS / 2, bpos(2, 2)[1] - BS / 2, bx1, bpos(1, 2)[1] + BS / 2, C.pink, 4);
  await until(S(1)); await play(new M.Create(chipBox), ...say('A CHIP CAN BE ANYWHERE', C.pink));
  await until(S(2)); await play(...say('A NEW FILTER FOR EVERY PLACE?', C.amber));
  await until(S(3)); await play(new M.FadeOut(chipBox), new M.FadeIn(new M.VGroup(...nums, ...rowNums)), ...say('4 ROWS × 4 COLUMNS'));
  const rowBox = rect(bx0 - 0.05, bpos(1, 0)[1] - BS / 2, bx1 + 0.05, bpos(1, 0)[1] + BS / 2, C.amber, 3);
  await until(S(4)); await play(new M.Create(rowBox), ...say('ROW 2: THE CHIP BEGINS', C.amber));
  await until(S(5)); await play(new M.LaggedStart([4, 5, 6, 7].map(i => new M.Indicate(nums[i], { color: C.amber })), { lagRatio: 0.4, runTime: 2 }), ...fbox(['row 2:', ['4  4  1  1', C.amber]]));
  await until(S(6)); await play(...fbox(['filter', [' left  =  1', C.cyan], [' right = −1', C.pink]]), ...say('FILTER: 1 AND −1'));

  // sliding window with its two weight tags
  const win = c => rect(bpos(1, c)[0] - BS / 2 - 0.04, bpos(1, c)[1] - BS / 2 - 0.04, bpos(1, c + 1)[0] + BS / 2 + 0.04, bpos(1, c)[1] + BS / 2 + 0.04, C.green, 6);
  const tags = c => { const a = pill('1', C.cyan, 15), b = pill('−1', C.pink, 15); a.moveTo([bpos(0, c)[0], by1 + 0.3, 0]); b.moveTo([bpos(0, c + 1)[0], by1 + 0.3, 0]); return [a, b]; };
  const window = win(0); let tg = tags(0);
  await until(S(7)); await play(new M.FadeOut(rowBox), new M.Create(window), new M.FadeIn(tg[0]), new M.FadeIn(tg[1]), ...fbox(['position 1:', ['4, 4', C.amber]]), ...say('FIRST TWO PIXELS', C.green));
  for (const c of [1, 2]) {
    await until(S(7 + c)); const nt = tags(c);
    await play(new M.Transform(window, win(c)), new M.FadeOut(tg[0]), new M.FadeOut(tg[1]), new M.FadeIn(nt[0]), new M.FadeIn(nt[1]),
      ...fbox([`position ${c + 1}:`, [c === 1 ? '4, 1' : '1, 1', C.amber]]), ...say('ONE PIXEL RIGHT  →', C.green));
    tg = nt;
  }
  await until(S(10)); await play(new M.Indicate(tg[0], { color: C.cyan }), new M.Indicate(tg[1], { color: C.pink }), ...say('READINGS CHANGE, WEIGHTS STAY', C.violet));

  // stamp
  const prints = [0, 1, 2].map(i => { const g = pill('1 | −1', C.violet, 15); g.moveTo(P ? [(i - 1) * 2.0, -3.2, 0] : [4.55, 0.3 - i * 0.8, 0]); return g; });
  await until(S(11)); await play(...dropBox(), new M.FadeIn(prints[0]), ...say('LIKE A STAMP', C.violet));
  await until(S(12)); await play(new M.LaggedStart([prints[1], prints[2]].map(p => new M.FadeIn(p)), { lagRatio: 0.5, runTime: 1.4 }), ...say('MOVE IT, SAME SHAPE', C.violet));
  await until(S(13)); await play(...say('OUR FILTER = A STAMP', C.violet));
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(...prints)), ...say('SAME WEIGHTS, MANY PLACES = WEIGHT SHARING', C.green));

  // 15-31 network view
  const N = net(P ? { layers: [4, 3], center: [0, -2.3, 0], width: 4.6, height: 1.9, r: 0.26 }
                  : { layers: [4, 3], center: [0.15, -0.6, 0], width: 3.6, height: 2.5, r: 0.27 });
  await until(S(15)); await play(new M.FadeOut(new M.VGroup(window, ...tg)), ...say('INSIDE THE NETWORK'));
  await until(S(16)); await play(new M.LaggedStart(N.nodes[0].map(n => new M.FadeIn(n)), { lagRatio: 0.2, runTime: 1 }),
    ...N.value(0, 0, '4'), ...N.value(0, 1, '4'), ...N.value(0, 2, '1', C.pink), ...N.value(0, 3, '1', C.pink), ...say('4 INPUT READINGS'));
  await until(S(17)); await play(new M.LaggedStart(N.nodes[1].map(n => new M.FadeIn(n)), { lagRatio: 0.2, runTime: 1 }), ...say('3 OUTPUTS: ONE PER POSITION', C.amber));
  const used = [];
  for (let j = 0; j < 3; j++) {
    await until(S(18 + j));
    const e = [N.edges[0][j][j], N.edges[0][j + 1][j]]; used.push(...e);
    await play(...e.map(l => new M.Create(l)), new M.Indicate(N.nodes[1][j], { color: C.amber }), ...say(`POSITION ${j + 1}: INPUTS ${j + 1} AND ${j + 2}`));
  }
  await until(S(21)); await play(...[0, 1, 2].flatMap(j => N.weight(0, j, j, 1)), ...say('EVERY LEFT LINE: WEIGHT 1', C.cyan));
  await until(S(22)); await play(...[0, 1, 2].flatMap(j => N.weight(0, j + 1, j, -1)), ...say('EVERY RIGHT LINE: WEIGHT −1', C.pink));
  // signal pulses: dots travel along chosen lines (leave no marks behind)
  async function flow(pairs, ...anims) {
    const R = P ? 0.26 : 0.27, ds = [], ts = [];
    pairs.forEach(([i, j]) => {
      const a = N.pos(0, i), b = N.pos(1, j);
      const d = new M.Dot({ point: [a[0] + R, a[1], 0], radius: 0.08, color: C.amber }); d.setFill(C.amber, 1);
      const t = new M.Dot({ point: [b[0] - R, b[1], 0], radius: 0.08, color: C.amber }); t.setFill(C.amber, 1);
      ds.push(d); ts.push(t);
    });
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.15 })), ...anims);
    await play(...ds.map((d, k) => new M.Transform(d, ts[k], { runTime: 0.8 })));
    await play(new M.FadeOut(new M.VGroup(...ds), { runTime: 0.25 }));
  }
  const pinks = [[1, 0], [2, 1], [3, 2]], pairsAll = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]];
  await until(S(23)); await flow(pinks, ...say('WATCH THE PINK LINES', C.pink));
  const steps = [['4', '4 × −1 = −4'], ['1', '1 × −1 = −1'], ['1', '1 × −1 = −1']];
  let lines = [];
  for (let j = 0; j < 3; j++) {
    await until(S(24 + 2 * j)); await flow([pinks[j]], new M.Indicate(N.nodes[0][j + 1], { color: C.amber }), ...say(`POSITION ${j + 1}: RIGHT READING ${steps[j][0]}`));
    lines = lines.concat([[`pos ${j + 1}: ${steps[j][1]}`, C.pink]]);
    await until(S(25 + 2 * j)); await play(...fbox(lines, C.pink));
  }
  await until(S(30)); await flow(pairsAll,
    ...say('EACH OUTPUT ADDS ITS TWO RESULTS', C.amber), ...fbox(['4 + (−4) = 0', '4 + (−1) = 3', '1 + (−1) = 0']));
  await until(S(31)); await play(...N.value(1, 0, '0', C.amber), ...N.value(1, 1, '3', C.amber), ...N.value(1, 2, '0', C.amber), ...say('SCORES: 0, 3, 0', C.amber));

  // 32-38 change the shared weight
  await until(S(32)); await play(...say('CHANGE THE SHARED −1 TO 0', C.amber), ...fbox(['right weight', ['−1  →  0', C.amber]], C.amber));
  await until(S(33)); await play(...[0, 1, 2].flatMap(j => N.weight(0, j + 1, j, 0)), ...N.value(1, 0, ''), ...N.value(1, 1, ''), ...N.value(1, 2, ''), ...say('ALL 3 RIGHT LINES CHANGE TOGETHER', C.pink));
  const nl = ['4×1 + 4×0 = 4', '4×1 + 1×0 = 4', '1×1 + 1×0 = 1'], sc2 = ['4', '4', '1'];
  for (let j = 0; j < 3; j++) {
    await until(S(34 + j)); await play(...N.value(1, j, sc2[j], C.green), ...fbox(nl.slice(0, j + 1).map(s => [s, C.green]), C.green));
  }
  await until(S(37)); await play(...say('NEW SCORES: 4, 4, 1', C.green));
  await until(S(38)); await play(new M.LaggedStart(N.nodes[1].map(n => new M.Indicate(n, { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }), ...say('ONE WEIGHT CHANGED → ALL 3 SCORES CHANGED', C.green));

  // 39-45 counting weights
  const mid = (l, i) => { const s = l.getStart(), e = l.getEnd(), f = i % 2 ? 0.7 : 0.3; return [s[0] + (e[0] - s[0]) * f, s[1] + (e[1] - s[1]) * f, 0]; };
  const own = used.map((l, i) => { const t = pill('w' + (i + 1), C.amber, 15); t.moveTo(mid(l, i)); return t; });
  await until(S(39)); await play(...[0, 1, 2].flatMap(j => N.weight(0, j + 1, j, -1)), ...N.value(1, 0, ''), ...N.value(1, 1, ''), ...N.value(1, 2, ''), ...dropBox(), ...say('HOW MANY WEIGHTS TO LEARN?'));
  await until(S(40)); await play(new M.LaggedStart(own.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.6 }), ...say('NO SHARING: OWN WEIGHTS EVERYWHERE', C.amber));
  await until(S(41)); await play(...fbox(['no sharing:', ['2 + 2 + 2 = 6', C.amber]], C.amber));
  const shared = used.map((l, i) => { const t = pill(i % 2 ? '−1' : '1', i % 2 ? C.pink : C.cyan, 15); t.moveTo(mid(l, i)); return t; });
  await until(S(42)); await play(new M.FadeOut(new M.VGroup(...own)), new M.FadeIn(new M.VGroup(...shared)), ...say('SHARING: ONLY 2 WEIGHTS', C.green),
    ...fbox(['no sharing: 6', ['sharing:    2', C.green]], C.green));
  await until(S(43)); await play(...say('TWO SHORT FORMULAS'));
  await until(S(44)); await play(...fbox([['no sharing:', C.amber], 'positions × weights', '= 3 × 2 = 6'], C.amber));
  await until(S(45)); await play(...fbox([['sharing:', C.green], 'weights in 1 filter', '= 2'], C.green));
  await until(S(46)); await play(...say('A LARGE PICTURE: MANY, MANY POSITIONS', C.amber));
  await until(S(47)); await play(...say('SHARING = FEWER WEIGHTS TO LEARN', C.green));
  await until(S(48)); await play(new M.FadeOut(new M.VGroup(...shared, ...used, ...N.nodes.flat())), ...N.value(0, 0, ''), ...N.value(0, 1, ''), ...N.value(0, 2, ''), ...N.value(0, 3, ''), ...dropBox(),
    ...say('SAME FILTER SEARCHES EVERYWHERE', C.green));
  if (!P) {
    const old = [...tile, ...nums, ...rowNums]; BC[0] += 2.9;
    const nt = [], nn = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const q = new M.Rectangle({ width: BS, height: BS, color: C.muted, strokeWidth: 1 });
      q.setFill(shade(G[r][c]), 1); q.moveTo(bpos(r, c)); nt.push(q);
      const t = T(String(G[r][c]), 19, G[r][c] === 4 ? C.ink : C.pink, true); t.moveTo(bpos(r, c)); nn.push(t);
    }
    const nr = [0, 1, 2, 3].map(r => { const t = T(String(r + 1), 15, C.amber, true); t.moveTo([BC[0] - 2 * BS - 0.3, bpos(r, 0)[1], 0]); return t; });
    await play(new M.FadeOut(new M.VGroup(...old)), new M.FadeIn(new M.VGroup(...nt, ...nn, ...nr)));
    tile.splice(0, 16, ...nt); nums.splice(0, 16, ...nn);
  }
  await play(new M.LaggedStart(nums.map(q => new M.Indicate(q, { color: C.green })), { lagRatio: 0.05, runTime: 1.6 }));

  // 49-52 other filters
  await until(S(49)); await play(...say('ONE FILTER ≠ EVERY PATTERN', C.pink));
  const hw = rect(bpos(1, 1)[0] - BS / 2 - 0.04, bpos(1, 1)[1] - BS / 2 - 0.04, bpos(1, 2)[0] + BS / 2 + 0.04, bpos(1, 1)[1] + BS / 2 + 0.04, C.cyan, 6);
  await until(S(50)); await play(new M.Create(hw), ...say('FILTER 1: LEFT ↔ RIGHT IN A ROW'), ...fbox([['filter 1', C.cyan], '[ 1, −1 ]', 'side by side']));
  const vw = rect(bpos(0, 2)[0] - BS / 2 - 0.04, bpos(1, 2)[1] - BS / 2 - 0.04, bpos(0, 2)[0] + BS / 2 + 0.04, bpos(0, 2)[1] + BS / 2 + 0.04, C.violet, 6);
  await until(S(51)); await play(new M.Create(vw), ...say('FILTER 2: ABOVE ↕ BELOW', C.violet), ...fbox([['filter 2', C.violet], 'above and', 'below']));
  await until(S(52)); await play(...say('EACH FILTER: OWN WEIGHTS, SHARED EVERYWHERE', C.violet));
  await until(S(53)); await play(new M.FadeOut(new M.VGroup(hw, vw)), ...say('WEIGHT SHARING: SAME WEIGHTS, MANY PLACES', C.green),
    ...fbox(['one filter', 'same weights', ['many places', C.green]], C.green));
}

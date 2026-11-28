// 21.1.5 Approximate nearest neighbors: search only the closest groups (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Picture: a meaning map. Each dot is the tip of a passage's meaning arrow (1 dot = 10 passages),
// 12 groups in a 4 x 3 grid, each with an amber centre; the question is an amber arrow.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -3.6, CY = P ? -0.55 : -0.45, W = P ? 7.4 : 6.4, H = P ? 4.5 : 4.8;
  const GW = W / 4, GH = H / 3, map = (u, v) => [CX - W / 2 + u * GW, CY - H / 2 + v * GH, 0];
  const PILL = P ? [0, 2.15, 0] : [3.4, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [3.4, 0.5, 0];
  const NOTEP = P ? [0, -3.1, 0] : [CX, 2.15, 0];
  const BX = P ? -2.4 : 1.6, BL = P ? 4.6 : 3.9, BY = P ? [-3.65, -4.15] : [-0.75, -1.2];
  const GX = P ? -3.3 : 1.0, GY = P ? -4.65 : -1.7, GS = 0.14, FX = P ? -1.7 : 2.6;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const fmtN = v => v.toLocaleString('en-US');

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
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
    const maxw = P ? FW - 1.2 : 5.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // the archive: 10 dots per group. Three groups near the question are placed by hand so that
  // the truly closest passage sits just across a border, in the third-closest group.
  const BASE = [[0.25, 0.3], [0.5, 0.2], [0.75, 0.3], [0.3, 0.55], [0.55, 0.5], [0.8, 0.58], [0.22, 0.8], [0.47, 0.76], [0.7, 0.8], [0.5, 0.36]];
  const HAND = {
    4: [[0.6, 0.5], [0.8, 0.45], [0.95, 0.6], [0.7, 0.7], [0.88, 0.78], [0.95, 0.92], [0.65, 0.88], [0.55, 0.75], [0.82, 0.3], [0.85, 0.62]],
    5: [[0.15, 0.2], [0.35, 0.15], [0.6, 0.2], [0.85, 0.15], [0.2, 0.42], [0.5, 0.4], [0.8, 0.4], [0.85, 0.65], [0.65, 0.55], [0.9, 0.88]],
    9: [[0.4, 0.08], [0.2, 0.6], [0.45, 0.7], [0.7, 0.6], [0.85, 0.8], [0.3, 0.88], [0.6, 0.9], [0.15, 0.78], [0.75, 0.72], [0.5, 0.55]]
  };
  const jit = (g, j, t) => { const x = Math.sin(g * 12.9898 + j * 78.233 + t) * 43758.5453; return (x - Math.floor(x) - 0.5) * 0.14; };
  const pts = [];
  for (let g = 0; g < 12; g++) (HAND[g] || BASE.map(([a, b], j) => [a + jit(g, j, 0), b + jit(g, j, 7)]))
    .forEach(([a, b]) => pts.push({ g, p: map(g % 4 + a, Math.floor(g / 4) + b), col: C.cyan, hot: false }));
  pts.forEach(d => { d.m = new M.Dot({ point: d.p, radius: 0.06, color: C.cyan }); });
  const dots = pts.map(d => d.m), inGroup = g => pts.filter(d => d.g === g).map(d => d.m);
  const cen = Array.from({ length: 12 }, (_, g) => { const m = pts.filter(d => d.g === g);
    return [m.reduce((a, d) => a + d.p[0], 0) / m.length, m.reduce((a, d) => a + d.p[1], 0) / m.length, 0]; });
  const O = map(2, 1.5), Q = map(1.4, 1.85);
  const order = cen.map((_, g) => g).sort((a, b) => dist(Q, cen[a]) - dist(Q, cen[b]));
  const nearest = list => list.reduce((b, d) => dist(Q, d.p) < dist(Q, b.p) ? d : b);
  const best = nearest(pts), second = nearest(pts.filter(d => order.slice(0, 2).includes(d.g)));
  let open = new Set(order);
  const shade = () => pts.forEach(d => { d.m.setColor(d.col); d.m.setFill(d.col, open.has(d.g) ? 1 : d.hot ? 0.9 : 0.2); });
  const groupColor = g => (g % 4 + Math.floor(g / 4)) % 2 ? C.violet : C.cyan;
  const arrow = (end, color, w = 3) => new M.Arrow({ start: O, end, color, strokeWidth: w, buff: 0, tipLength: 0.16 });

  // 0-2 the archive: 1,200 passages, each with its meaning arrow
  const frame = new M.Rectangle({ width: W, height: H, color: C.line, strokeWidth: 2 }); frame.moveTo([CX, CY, 0]);
  const note = T('1 dot = 10 passages', P ? 19 : 18, C.ink); note.moveTo(NOTEP);
  await until(S(0)); await play(new M.Create(frame), new M.FadeIn(note),
    new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 4 }), ...say('HELP ARCHIVE: 1,200 PASSAGES'));
  await until(S(1)); await play(new M.Indicate(pts[62].m, { color: C.amber }), new M.Flash(pts[62].m, { color: C.amber }), ...say('PASSAGE = ONE SHORT PIECE OF TEXT'));
  const oDot = new M.Dot({ point: O, radius: 0.07, color: C.muted });
  const samples = [70, 15, 104].map(i => arrow(pts[i].p, C.cyan, 2));
  await until(S(2)); await play(new M.FadeIn(oDot), new M.LaggedStart(samples.map(a => new M.Create(a)), { lagRatio: 0.3, runTime: 1.6 }), ...say('EACH DOT = TIP OF A MEANING ARROW'));

  // 3-6 plain dense retrieval: compare with every passage
  const qArrow = arrow(Q, C.amber, 4);
  await until(S(3)); await play(new M.FadeOut(new M.VGroup(...samples)), new M.Create(qArrow), ...say('QUESTION → COMPARE WITH EVERY PASSAGE', C.amber));
  await play(new M.LaggedStart(dots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.05, runTime: 3 }));
  const cmp = new M.Line({ start: Q, end: pts[70].p, color: C.amber, strokeWidth: 2 });
  await until(S(4)); await play(new M.Create(cmp), ...fbox(['one comparison = one score', ['0.6×0.8 + 0.8×0.6 = 0.96', C.amber]]), ...say('COMPARISON = ONE MULTIPLY-AND-ADD'));
  await until(S(5)); await play(new M.FadeOut(cmp), ...fbox(['1 question', ['1,200 comparisons', C.amber]]), ...say('1,200 FOR EVERY QUESTION', C.amber));
  await until(S(6)); await play(...fbox(['millions of passages', ['millions of comparisons', C.pink]], C.pink), ...say('MILLIONS: FAR TOO SLOW', C.pink));

  // 7-8 the bookshop: walk to the cooking shelf
  const SH = P ? 1.4 : 1.05, shop = [];
  ['novels', 'travel', 'cooking', 'history'].forEach((name, k) => {
    const x = BOXP[0] + (k - 1.5) * SH, c = k === 2 ? C.amber : C.cyan;
    const r = new M.Rectangle({ width: SH - 0.25, height: 0.8, color: C.muted, strokeWidth: 2 }); r.moveTo([x, BOXP[1] + 0.15, 0]);
    const lab = T(name, 15, k === 2 ? C.amber : C.muted); lab.moveTo([x, BOXP[1] - 0.5, 0]);
    shop.push(r, lab);
    for (let j = 0; j < 5; j++) {
      const bh = 0.42 + 0.08 * ((j + k) % 3), b = new M.Rectangle({ width: 0.1, height: bh, color: c, strokeWidth: 1 });
      b.setFill(c, 0.8); b.moveTo([x + (j - 2) * 0.15, BOXP[1] - 0.2 + bh / 2, 0]); shop.push(b);
    }
  });
  const shopG = new M.VGroup(...shop);
  const cook = new M.Rectangle({ width: SH - 0.1, height: 1.35, color: C.amber, strokeWidth: 3 }); cook.moveTo([BOXP[0] + 0.5 * SH, BOXP[1] - 0.05, 0]);
  await until(S(7)); await play(...clearBox(), new M.FadeIn(shopG), ...say('BOOKSHOP: NOT EVERY BOOK', C.violet));
  await until(S(7) + 3.2); await play(new M.Create(cook), ...say('WALK TO THE COOKING SHELF', C.amber));
  await until(S(8)); await play(new M.FadeOut(shopG), new M.FadeOut(cook), ...say('SAME IDEA FOR OUR ARROWS', C.violet));

  // 9-13 groups and centres, built in advance
  const borders = [1, 2, 3].map(u => new M.DashedLine({ start: map(u, 0), end: map(u, 3), color: C.muted }))
    .concat([1, 2].map(v => new M.DashedLine({ start: map(0, v), end: map(4, v), color: C.muted })));
  await until(S(9));
  pts.forEach(d => { d.col = groupColor(d.g); }); shade();
  await play(new M.FadeOut(qArrow), new M.LaggedStart(borders.map(b => new M.Create(b)), { lagRatio: 0.2, runTime: 1.6 }), ...say('BEFORE ANY QUESTION: 12 GROUPS', C.violet));
  await until(S(10)); await play(new M.LaggedStart(inGroup(6).map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.15, runTime: 2 }), ...say('CLUSTERING: SIMILAR POINTS TOGETHER', C.violet));
  await until(S(11)); await play(new M.LaggedStart(inGroup(2).map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.15, runTime: 2 }),
    ...fbox(['1 group = 100 passages', ['12 × 100 = 1,200', C.amber]]), ...say('EACH GROUP: 100 PASSAGES', C.violet));
  const centres = cen.map(c => { const r = new M.Rectangle({ width: 0.18, height: 0.18, color: C.amber, strokeWidth: 2 }); r.setFill(C.amber, 1); r.moveTo(c); return r; });
  await until(S(12)); await play(new M.LaggedStart(centres.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.8 }), ...say('CENTRE = AVERAGE OF ITS ARROWS', C.amber));
  await until(S(13)); await play(new M.LaggedStart(centres.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.1, runTime: 1.8 }), ...say('BUILT ONCE, REUSED EVERY TIME', C.violet));

  // 14-19 a question: centres first, then two groups
  const qArrow2 = arrow(Q, C.amber, 4);
  const qTip = new M.Dot({ point: Q, radius: 0.08, color: C.amber });
  await until(S(14)); await play(new M.Create(qArrow2), new M.FadeIn(qTip), new M.Flash(qTip, { color: C.amber }), ...say('A QUESTION ARRIVES', C.amber));
  const rays = cen.map(c => new M.Line({ start: Q, end: c, color: C.amber, strokeWidth: 1.5 }));
  await until(S(15)); await play(new M.LaggedStart(rays.map(r => new M.Create(r)), { lagRatio: 0.1, runTime: 2 }),
    ...fbox(['step 1: the centres', ['12 comparisons', C.amber]]), ...say('STEP 1: COMPARE WITH 12 CENTRES', C.amber));
  const outlines = Array.from({ length: 12 }, (_, g) => { const r = new M.Rectangle({ width: GW - 0.08, height: GH - 0.08, color: C.green, strokeWidth: 3 }); r.moveTo(map(g % 4 + 0.5, Math.floor(g / 4) + 0.5)); return r; });
  const [g1, g2, g3] = order;
  await until(S(16));
  open = new Set([g1, g2]); shade();
  await play(new M.FadeOut(new M.VGroup(...rays.filter((_, g) => g !== g1 && g !== g2))), new M.Create(outlines[g1]), new M.Create(outlines[g2]),
    ...say('STEP 2: OPEN THE 2 CLOSEST GROUPS', C.green));
  await until(S(17)); await play(new M.FadeOut(rays[g1]), new M.FadeOut(rays[g2]),
    new M.LaggedStart(inGroup(g1).concat(inGroup(g2)).map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.08, runTime: 2.4 }),
    ...fbox(['step 1: 12 centres', ['step 3: 2 × 100 = 200', C.amber]]), ...say('STEP 3: COMPARE INSIDE THEM', C.amber));
  await until(S(18)); await play(...fbox(['12 + 200', ['= 212 comparisons', C.amber]]), ...say('TOTAL: 212 COMPARISONS', C.amber));
  const bar = (n, y, c) => { const w = n / 1212 * BL, r = new M.Rectangle({ width: w, height: 0.2, color: c, strokeWidth: 1 }); r.setFill(c, 0.85); r.moveTo([BX + w / 2, y, 0]); return r; };
  const nameLab = (s, y) => { const t = T(s, P ? 18 : 17, C.ink, true); t.moveTo([BX - 0.12 - t.getWidth() / 2, y, 0]); return t; };
  const numLab = (n, y, c) => { const t = T(fmtN(n), P ? 18 : 17, c, true); t.moveTo([BX + n / 1212 * BL + 0.12 + t.getWidth() / 2, y, 0]); return t; };
  const bar1 = bar(1200, BY[0], C.muted), bar2 = bar(212, BY[1], C.amber);
  let num2 = numLab(212, BY[1], C.amber);
  const setNum = (n, c) => { const t = numLab(n, BY[1], c), a = [new M.FadeIn(t), new M.FadeOut(num2)]; num2 = t; return a; };
  await until(S(19)); await play(new M.FadeIn(nameLab('exact', BY[0])), new M.FadeIn(bar1), new M.FadeIn(numLab(1200, BY[0], C.muted)),
    new M.FadeIn(nameLab('groups', BY[1])), new M.FadeIn(bar2), new M.FadeIn(num2),
    ...fbox(['212 instead of 1,200', ['212 ÷ 1,200 ≈ 0.18', C.green]], C.green), ...say('FEWER THAN ONE IN FIVE', C.green));

  // 20-22 the miss: the true best sits across the border
  await until(S(20)); await play(new M.Indicate(qTip, { color: C.amber }), ...say('IS THE ANSWER STILL RIGHT?', C.amber));
  const missLine = new M.DashedLine({ start: Q, end: best.p, color: C.pink });
  await until(S(21));
  best.hot = true; best.col = C.pink; shade();
  await play(new M.Create(missLine), new M.Flash(best.m, { color: C.pink }), new M.Indicate(borders[4], { color: C.pink }), ...say('TRUE BEST: IN A 3RD GROUP', C.pink));
  await until(S(22)); await play(new M.Indicate(best.m, { color: C.pink }), ...say('NEVER LOOKED AT → MISSED', C.pink));

  // 23-25 recall on 100 test questions
  const sq = (i, c, op) => { const r = new M.Rectangle({ width: 0.11, height: 0.11, color: c, strokeWidth: 1 }); r.setFill(c, op); r.moveTo([GX + (i % 10) * GS, GY - Math.floor(i / 10) * GS, 0]); return r; };
  const tests = Array.from({ length: 100 }, (_, i) => sq(i, C.muted, 0.15));
  const MISS = [7, 18, 26, 39, 45, 58, 63, 77, 84, 92], STILL = [26, 63, 92];
  let foundNow = null;
  const found = (s, c = C.green) => { const t = T(s, 17, c, true); t.moveTo([FX + t.getWidth() / 2, GY - 4.5 * GS, 0]);
    const a = [new M.FadeIn(t)]; if (foundNow) a.push(new M.FadeOut(foundNow)); foundNow = t; return a; };
  await until(S(23)); await play(new M.LaggedStart(tests.map(t => new M.FadeIn(t)), { lagRatio: 0.02, runTime: 1.6 }), ...found('100 test questions', C.muted),
    ...fbox(['100 test questions', ['true best known for each', C.muted]]), ...say('TEST: 100 KNOWN QUESTIONS', C.violet));
  await until(S(24)); await play(new M.LaggedStart(tests.map((t, i) => new M.Transform(t, sq(i, MISS.includes(i) ? C.pink : C.green, 0.85))), { lagRatio: 0.02, runTime: 2.4 }),
    ...found('90 of 100 found'), ...fbox(['2 groups opened', ['found 90 of 100', C.green]], C.green), ...say('TWO GROUPS: FOUND 90 TIMES', C.green));
  await until(S(25)); await play(new M.Indicate(foundNow, { color: C.green }), ...fbox(['recall = 90 ÷ 100', ['       = 90%', C.green]], C.green), ...say('RECALL = SHARE FOUND', C.green));

  // 26-30 turn the dial: 3 groups, then all 12
  await until(S(26));
  open.add(g3); best.col = C.green; shade();
  await play(new M.Create(outlines[g3]), new M.FadeOut(missLine), new M.Flash(best.m, { color: C.green }), ...say('OPEN 3 GROUPS', C.green));
  await until(S(27)); await play(new M.Transform(bar2, bar(312, BY[1], C.amber)), ...setNum(312, C.amber),
    ...fbox(['12 + 300 = 312', ['312 ÷ 1,200 ≈ 1/4', C.amber]]), ...say('ABOUT A QUARTER OF THE WORK', C.amber));
  const fixed3 = MISS.filter(i => !STILL.includes(i));
  await until(S(28)); await play(new M.LaggedStart(fixed3.map(i => new M.Transform(tests[i], sq(i, C.green, 0.85))), { lagRatio: 0.2, runTime: 1.4 }),
    ...found('97 of 100 found'), ...fbox(['3 groups opened', ['recall = 97%', C.green]], C.green), ...say('RECALL 97%', C.green));
  const rest = order.slice(3);
  await until(S(29));
  open = new Set(order); shade();
  await play(new M.LaggedStart(rest.map(g => new M.Create(outlines[g])), { lagRatio: 0.15, runTime: 1.6 }),
    new M.Transform(bar2, bar(1212, BY[1], C.pink)), ...setNum(1212, C.pink),
    ...fbox(['12 + 1,200', ['= 1,212 comparisons', C.pink]], C.pink), ...say('OPEN ALL 12 GROUPS', C.pink));
  await until(S(30)); await play(...STILL.map(i => new M.Transform(tests[i], sq(i, C.green, 0.85))), new M.Indicate(bar2, { color: C.pink }),
    ...found('100 of 100 found'), ...fbox(['1,212 > 1,200', ['recall = 100%', C.green]], C.pink), ...say('MORE WORK THAN THE PLAIN SEARCH', C.pink));

  // 31-32 the dial
  const DC = [BOXP[0], BOXP[1] - 0.45, 0], DR = 0.75;
  const needleAt = n => { const a = Math.PI * (1 - (n - 1) / 11);
    return new M.Line({ start: DC, end: [DC[0] + 0.66 * Math.cos(a), DC[1] + 0.66 * Math.sin(a), 0], color: C.amber, strokeWidth: 5 }); };
  const arc = new M.Arc({ radius: DR, startAngle: 0, angle: Math.PI, color: C.muted, strokeWidth: 3 }); arc.moveTo([DC[0], DC[1] + DR / 2, 0]);
  const hub = new M.Dot({ point: DC, radius: 0.07, color: C.amber });
  const end1 = T('1', 18, C.ink, true); end1.moveTo([DC[0] - DR - 0.2, DC[1] - 0.2, 0]);
  const end12 = T('12', 18, C.ink, true); end12.moveTo([DC[0] + DR + 0.3, DC[1] - 0.2, 0]);
  const dialCap = T('groups opened', 17, C.ink); dialCap.moveTo([DC[0], DC[1] - 0.3, 0]);
  const dialG = new M.VGroup(arc, hub, end1, end12, dialCap), needle = needleAt(12);
  await until(S(31)); await play(...clearBox(), new M.FadeIn(dialG), new M.Create(needle), ...say('GROUPS OPENED = A DIAL', C.amber));
  await until(S(32)); await play(new M.Indicate(needle, { color: C.amber }), new M.Indicate(bar2, { color: C.pink }), ...say('MORE: SLOWER, FEWER MISSES', C.amber));
  await until(S(32) + 3.4);
  open = new Set([g1, g2]); best.col = C.pink; shade();
  await play(new M.Transform(needle, needleAt(2)), new M.FadeOut(new M.VGroup(...order.slice(2).map(g => outlines[g]))),
    new M.Transform(bar2, bar(212, BY[1], C.amber)), ...setNum(212, C.amber),
    ...MISS.map(i => new M.Transform(tests[i], sq(i, C.pink, 0.85))), ...found('90 of 100 found'), ...say('FEWER: FASTER, MORE MISSES', C.green));

  // 33-37 the names and the two numbers in words
  const nnRing = new M.Circle({ radius: dist(Q, best.p) + 0.1, color: C.cyan, strokeWidth: 2 }); nnRing.moveTo(Q);
  await until(S(33)); await play(new M.FadeOut(dialG), new M.FadeOut(needle), new M.Create(nnRing), new M.Indicate(best.m, { color: C.cyan }),
    ...fbox(['the exact closest arrows:', ['nearest neighbor search', C.cyan]]), ...say('NEIGHBORS = THE CLOSEST POINTS'));
  await until(S(34)); await play(new M.Indicate(outlines[g1], { color: C.green }), new M.Indicate(outlines[g2], { color: C.green }),
    ...fbox(['exact:  nearest neighbor search', ['almost always, much less work:', C.green], ['approximate nearest neighbor search', C.green]], C.green),
    ...say('ALMOST ALWAYS, MUCH LESS WORK', C.green));
  await until(S(35)); await play(new M.FadeOut(nnRing), ...say('APPROXIMATE = CLOSE, NOT GUARANTEED', C.violet));
  await until(S(36)); await play(new M.LaggedStart(centres.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.08, runTime: 1.6 }),
    ...fbox(['work = number of centres', '     + passages in opened groups', ['     = 12 + 200 = 212', C.amber]], C.amber), ...say('WORK IN WORDS', C.amber));
  await until(S(37)); await play(new M.Indicate(foundNow, { color: C.green }),
    ...fbox(['recall = questions where best found', '         ÷ all questions', ['       = 90 ÷ 100 = 90%', C.green]], C.green), ...say('RECALL IN WORDS', C.green));

  // 38-42 what it is for, the trap, the summary
  await until(S(38)); await play(new M.Flash(qTip, { color: C.amber }), new M.Indicate(bar2, { color: C.amber }), ...say('FOR: HUGE COLLECTIONS, FAST ANSWERS', C.green));
  await until(S(39)); await play(new M.Indicate(bar2, { color: C.amber }), ...say('TRAP: SPEED SHOWS, MISSES HIDE', C.pink));
  const secondLine = new M.Line({ start: Q, end: second.p, color: C.green, strokeWidth: 2 });
  await until(S(40)); await play(new M.Create(secondLine), new M.Flash(second.m, { color: C.green }), new M.Indicate(best.m, { color: C.pink }),
    ...say('NO ERROR: ANSWERS FROM 2ND BEST', C.amber));
  await until(S(41)); await play(new M.LaggedStart(MISS.map(i => new M.Indicate(tests[i], { color: C.pink })), { lagRatio: 0.15, runTime: 1.6 }),
    ...fbox(['test questions first:', ['recall = 90%', C.green], ['then turn the dial', C.ink]], C.green), ...say('MEASURE RECALL FIRST', C.green));
  await until(S(42)); await play(new M.Indicate(outlines[g1], { color: C.green }), new M.Indicate(outlines[g2], { color: C.green }),
    ...fbox(['work:   212 instead of 1,200', ['recall: 90%', C.green]], C.green), ...say('ONLY THE CLOSEST GROUPS: LESS WORK', C.green));
}

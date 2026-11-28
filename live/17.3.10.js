// 17.3.10 Object detection: finding where the chip is. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const G = [[4, 4, 4, 4], [4, 4, 1, 1], [4, 4, 1, 1], [4, 4, 4, 4]];
  const say = (s, c = C.cyan) => showA(s, c);
  const BOXP = P ? [0, -4.7, 0] : [4.6, -0.6, 0];

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
    const maxw = P ? FW - 1.2 : 3.4;
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
  const BC = P ? [0.0, -0.55, 0] : [-4.3, -0.6, 0], BS = P ? 0.9 : 0.75;
  const bpos = (r, c) => [BC[0] + (c - 1.5) * BS, BC[1] + (1.5 - r) * BS, 0];
  const shade = v => v === 4 ? '#3a4a78' : '#141a30';
  const bx0 = BC[0] - 2 * BS, bx1 = BC[0] + 2 * BS, by0 = BC[1] - 2 * BS, by1 = BC[1] + 2 * BS;
  const tile = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const q = new M.Rectangle({ width: BS, height: BS, color: C.muted, strokeWidth: 1 });
    q.setFill(shade(G[r][c]), 1); q.moveTo(bpos(r, c)); tile.push(q);
  }
  const rowNums = [0, 1, 2, 3].map(r => { const t = T(String(r + 1), 15, C.amber, true); t.moveTo([bx0 - 0.3, bpos(r, 0)[1], 0]); return t; });
  const colNums = [0, 1, 2, 3].map(c => { const t = T(String(c + 1), 15, C.violet, true); t.moveTo([bpos(0, c)[0], by1 + 0.28, 0]); return t; });
  // a box over rows r0..r1, columns c0..c1 (0-based)
  const ext = (r0, r1, c0, c1, g = 0) => [bpos(0, c0)[0] - BS / 2 - g, bpos(r1, 0)[1] - BS / 2 - g, bpos(0, c1)[0] + BS / 2 + g, bpos(r0, 0)[1] + BS / 2 + g];
  const solidBox = (r0, r1, c0, c1, color, g) => { const [x0, y0, x1, y1] = ext(r0, r1, c0, c1, g); return rect(x0, y0, x1, y1, color, 6); };
  const dashBox = (r0, r1, c0, c1, color, g) => {
    const [x0, y0, x1, y1] = ext(r0, r1, c0, c1, g);
    return [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]]
      .map(([a, b]) => new M.DashedLine({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color, strokeWidth: 5 }));
  };
  const cells = (r0, r1, c0, c1) => { const a = []; for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) a.push([r, c]); return a; };
  const cover = (rc, color, op) => rc.map(([r, c]) => { const q = new M.Rectangle({ width: BS * 0.9, height: BS * 0.9, color, strokeWidth: 0 }); q.setFill(color, op); q.moveTo(bpos(r, c)); return q; });
  const REF = C.cyan, PRED = C.amber;

  await until(S(0)); await play(new M.LaggedStart(tile.map(q => new M.FadeIn(q)), { lagRatio: 0.04, runTime: 1.2 }), ...say('A MACHINE THAT REPAIRS TILES'));
  await until(S(1)); await play(...say('"CHIPPED" IS NOT ENOUGH', C.amber));
  await until(S(2)); await play(...say('WHERE IS THE CHIP?', C.amber));
  await until(S(3)); await play(new M.FadeIn(new M.VGroup(...rowNums, ...colNums)), ...say('4 ROWS × 4 COLUMNS'));
  const dark = [6, 7, 10, 11];
  await until(S(4)); await play(new M.LaggedStart(dark.map(i => new M.Indicate(tile[i], { color: C.pink })), { lagRatio: 0.2, runTime: 1.4 }), ...say('4 DARK PIXELS = THE CHIP', C.pink));
  const tmp = solidBox(1, 2, 2, 3, C.ink, 0.04);
  await until(S(5)); await play(new M.Create(tmp), ...say('DRAW A RECTANGLE AROUND THEM'));
  await until(S(6)); await play(new M.Indicate(tmp, { color: C.ink }), ...say('THE RECTANGLE SAYS WHERE'));
  await until(S(7)); await play(...say('FIND + MARK THE PLACE = OBJECT DETECTION', C.green), ...fbox([['object detection', C.green], 'find it and', 'mark where it is'], C.green));
  await until(S(8)); await play(...fbox([['bounding box', C.cyan], '= a rectangle', 'that marks the place']), ...say('BOUNDING BOX'));

  // reference box (solid, cyan)
  const refBox = solidBox(1, 2, 2, 3, REF, 0.04);
  const refLab = pill('REFERENCE', REF, 13); refLab.moveTo(P ? [bx1 + 0.85, by1 + 0.05, 0] : [bx1 + 0.95, BC[1] + 0.35, 0]);
  await until(S(9)); await play(new M.FadeOut(tmp), new M.Create(refBox), ...say('A WORKER DRAWS THE REAL BOX', REF));
  await until(S(10)); await play(new M.Indicate(rowNums[1], { color: C.amber }), new M.Indicate(rowNums[2], { color: C.amber }), ...fbox([['worker\'s box', REF], 'rows 2–3']));
  await until(S(11)); await play(new M.Indicate(colNums[2], { color: C.violet }), new M.Indicate(colNums[3], { color: C.violet }), ...fbox([['worker\'s box', REF], 'rows 2–3', 'columns 3–4']));
  await until(S(12)); await play(new M.FadeIn(refLab), ...say('REFERENCE BOX = USED FOR COMPARISON', REF));
  await until(S(13)); await play(...dropBox(), ...say('WHAT DOES THE NETWORK FIND?', C.violet));

  // network
  const NR = P ? 0.22 : 0.24;
  const N = net(P ? { layers: [4, 3, 3, 4], center: [-0.7, -3.85, 0], width: 3.6, height: 1.8, r: NR }
                  : { layers: [4, 3, 3, 4], center: [1.1, -0.6, 0], width: 3.0, height: 2.6, r: NR });
  const outNames = ['top row', 'bottom row', 'left column', 'right column'].map((s, i) => {
    const t = T(s, P ? 15 : 17, i < 2 ? C.amber : C.violet); const p = N.pos(3, i); t.moveTo([p[0] + NR + 0.15 + t.getWidth() / 2, p[1], 0]); return t; });
  async function flow(l) {
    const ds = [], ts = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => {
      const a = N.pos(l, i), b = N.pos(l + 1, j);
      const d = new M.Dot({ point: [a[0] + NR, a[1], 0], radius: 0.06, color: C.amber }); d.setFill(C.amber, 1);
      const t = new M.Dot({ point: [b[0] - NR, b[1], 0], radius: 0.06, color: C.amber }); t.setFill(C.amber, 1);
      ds.push(d); ts.push(t);
    }));
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.1 })));
    await play(...ds.map((d, k) => new M.Transform(d, ts[k], { runTime: 0.6 })));
    await play(new M.FadeOut(new M.VGroup(...ds), { runTime: 0.2 }));
  }
  await until(S(14)); await play(new M.FadeIn(N.group), ...N.value(0, 0, '4'), ...N.value(0, 1, '4'), ...N.value(0, 2, '1', C.pink), ...N.value(0, 3, '1', C.pink), ...say('PIXEL READINGS GO IN'));
  await until(S(15)); await play(...say('THROUGH CONNECTED CIRCLES'));
  await flow(0); await flow(1); await flow(2);
  await until(S(16)); await play(new M.FadeIn(new M.VGroup(...outNames)), ...say('OUTPUT: THE 4 SIDES OF A BOX', C.amber));
  await until(S(17)); await play(...N.value(3, 0, '2', C.amber), ...N.value(3, 1, '3', C.amber), ...say('ROWS 2 AND 3', C.amber));
  await until(S(18)); await play(...N.value(3, 2, '2', C.violet), ...N.value(3, 3, '3', C.violet), ...say('BUT COLUMNS 2 AND 3', C.violet));
  await until(S(19)); await play(...say('PREDICTED BOX = THE NETWORK\'S ANSWER', PRED));

  // predicted box (dashed, amber)
  let predBox = dashBox(1, 2, 1, 2, PRED, 0.12);
  const predLabAt = c0 => { const t = pill('PREDICTED', PRED, 13); t.moveTo([(bpos(0, c0)[0] + bpos(0, c0 + 1)[0]) / 2, by0 - 0.38, 0]); return t; };
  let predLab = predLabAt(1);
  await until(S(20)); await play(new M.FadeOut(new M.VGroup(N.group, ...outNames)), ...[0, 1, 2, 3].flatMap(i => N.value(0, i, '')), ...[0, 1, 2, 3].flatMap(i => N.value(3, i, '')),
    ...predBox.map(l => new M.Create(l)), new M.FadeIn(predLab), ...say('BOTH BOXES ON ONE PICTURE'));
  await until(S(21)); await play(...fbox([['reference: solid', REF], ['predicted: dashed', PRED]]), ...say('SAME SIZE, DIFFERENT PLACES'));
  await until(S(22)); await play(...say('HOW WELL DO THEY MATCH?', C.amber));
  const refC = cells(1, 2, 2, 3), predC = cells(1, 2, 1, 2);
  const refCov = cover(refC, REF, 0.28), predCov = cover(predC, PRED, 0.28);
  await until(S(23)); await play(new M.FadeIn(new M.VGroup(...refCov)), new M.FadeIn(new M.VGroup(...predCov)), ...say('2 SEE-THROUGH SHEETS'));
  const both = [[1, 2], [2, 2]], only = [[1, 1], [2, 1], [1, 3], [2, 3]];
  const tileAt = ([r, c]) => tile[r * 4 + c];
  await until(S(24)); await play(new M.LaggedStart(both.map(rc => new M.Indicate(tileAt(rc), { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }), ...say('SOME SQUARES: BOTH SHEETS', C.green));
  await until(S(25)); await play(new M.LaggedStart(only.map(rc => new M.Indicate(tileAt(rc), { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }), ...say('OTHERS: ONLY ONE SHEET', C.violet));
  await until(S(26)); await play(...fbox(['in both', '÷ all covered']), ...say('WHAT SHARE IS IN BOTH?'));
  await until(S(27)); await play(new M.Indicate(refBox, { color: REF }), ...say('COUNT THE REFERENCE BOX', REF));
  await until(S(28)); await play(new M.LaggedStart(refC.map(rc => new M.Indicate(tileAt(rc), { color: REF })), { lagRatio: 0.25, runTime: 1.6 }), ...fbox([['reference: 2 × 2 = 4', REF]]));
  await until(S(29)); await play(new M.LaggedStart(predC.map(rc => new M.Indicate(tileAt(rc), { color: PRED })), { lagRatio: 0.25, runTime: 1.6 }), ...fbox([['reference: 4', REF], ['predicted: 4', PRED]]));
  await until(S(30)); await play(...say('SQUARES IN BOTH BOXES?', C.green));
  const inter = cover(both, C.green, 0.7);
  await until(S(31)); await play(new M.FadeIn(new M.VGroup(...inter)), ...say('ONLY COLUMN 3', C.green));
  await until(S(32)); await play(...say('IN BOTH = INTERSECTION', C.green), ...fbox([['intersection', C.green], 'covered by both']));
  await until(S(33)); await play(...fbox([['intersection = 2', C.green]]));
  await until(S(34)); await play(...say('COVERED BY EITHER OR BOTH', C.violet));
  const unionC = cells(1, 2, 1, 3);
  const tags = unionC.map(([r, c], i) => { const p = bpos(r, c); const d = new M.Circle({ radius: 0.21, color: C.violet, strokeWidth: 2 }); d.setFill(C.card, 0.95); d.moveTo(p); const t = T(String(i + 1), P ? 19 : 20, C.ink, true, true); t.moveTo(p); return new M.VGroup(d, t); });
  await until(S(35)); await play(new M.LaggedStart(tags.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 2.4 }), ...say('COUNT EACH SQUARE ONLY ONCE', C.violet));
  await until(S(36)); await play(...fbox([['intersection = 2', C.green], ['union        = 6', C.violet]]));
  const uni = rect(...ext(1, 2, 1, 3, 0.22), C.violet, 3);
  await until(S(37)); await play(new M.Create(uni), ...say('ALL COVERED SQUARES = UNION', C.violet));
  await until(S(38)); await play(...say('THEY AGREE ON 2 OF 6 SQUARES'));
  await until(S(39)); await play(...fbox([['intersection = 2', C.green], ['union        = 6', C.violet], '2 ÷ 6']));
  await until(S(40)); await play(...fbox([['intersection = 2', C.green], ['union        = 6', C.violet], ['2 ÷ 6 = 1/3', C.amber]], C.amber), ...say('ONE THIRD', C.amber));
  await until(S(41)); await play(...say('INTERSECTION OVER UNION (IoU)', C.amber));
  await until(S(42)); await play(...say('A SHORT FORMULA'));
  await until(S(43)); await play(...fbox(['IoU =', [' intersection area', C.green], [' ÷ union area', C.violet]]));

  // 44-47 shift the predicted box
  const predBox2 = dashBox(1, 2, 2, 3, PRED, 0.12), predLab2 = predLabAt(2);
  await until(S(44)); await play(new M.FadeOut(new M.VGroup(...tags, ...inter, ...predCov, uni)), ...dropBox(),
    ...predBox.map((l, i) => new M.Transform(l, predBox2[i], { runTime: 1.4 })), new M.FadeOut(predLab), new M.FadeIn(predLab2), ...say('MOVE PREDICTED BOX 1 COLUMN RIGHT  →', PRED));
  const inter2 = cover(refC, C.green, 0.7);
  await until(S(45)); await play(new M.FadeIn(new M.VGroup(...inter2)), ...say('NOW THE SAME 4 SQUARES', C.green));
  await until(S(46)); await play(...fbox([['intersection = 4', C.green], ['union        = 4', C.violet]]));
  await until(S(47)); await play(...fbox([['intersection = 4', C.green], ['union        = 4', C.violet], ['4 ÷ 4 = 1', C.amber]], C.green), ...say('IoU = 1: A PERFECT MATCH', C.green));
  await until(S(48)); await play(...say('IoU TESTS HOW WELL A NETWORK FINDS PLACES'));
  await until(S(49)); await play(...say('BUT: RIGHT PLACE ≠ KNOWS WHAT IS INSIDE', C.pink));
  await until(S(50)); await play(...fbox(['also needed:', 'the right name', ['"chipped"', C.pink]], C.pink), ...say('IT MUST ALSO NAME WHAT IT FOUND', C.pink));
  await until(S(51)); await play(...fbox([['detection → where', C.cyan], ['IoU → how well', C.amber], '  two boxes match'], C.green), ...say('DETECTION FINDS PLACES, IoU MEASURES THE MATCH', C.green));
}

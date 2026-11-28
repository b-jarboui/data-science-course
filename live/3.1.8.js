// 3.1.8 Grouped aggregation: one total per shop (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const ROWS = [
    { o: 101, l: 1, s: 'North', c: 2, p: 10, a: 20 },
    { o: 101, l: 2, s: 'North', c: 1, p: 20, a: 20 },
    { o: 102, l: 1, s: 'South', c: 1, p: 15, a: 15 },
    { o: 103, l: 1, s: 'North', c: 1, p: 20, a: 20 },
    { o: 103, l: 2, s: 'North', c: 2, p: 15, a: 30 },
    { o: 104, l: 1, s: 'South', c: 1, p: 25, a: 25 }];
  const NORTH = [0, 1, 3, 4], SOUTH = [2, 5];
  const CX = P ? 0 : -2.2, HY = P ? 1.25 : 1.2, RH = P ? 0.5 : 0.42;
  const W = [1.05, 0.85, 1.3, 1.25, 1.15, 1.4], HEAD = ['ORDER', 'LINE', 'STORE', 'COPIES', 'PRICE', 'AMOUNT'];
  const TW = W.reduce((a, b) => a + b, 0), X0 = CX - TW / 2;
  const colx = j => X0 + W.slice(0, j).reduce((a, b) => a + b, 0) + W[j] / 2;
  const yOf = slot => HY - slot * RH;
  const PILL = P ? [0, 1.95, 0] : [CX, 1.85, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const at = (i, f) => S(i) + f * (E(i) - S(i));
  const tone = s => s === 'North' ? C.cyan : C.pink;

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21, lh = P ? 0.4 : 0.42;
    const spec = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = spec.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (spec[i][0].length - spec[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = spec.length * lh + 0.4;
    const maxw = P ? FW - 1.2 : 4.0, k = Math.min(1, maxw / wd);
    const BOXP = P ? [0, 4.3 - ht * k / 2, 0] : [4.3, -0.3, 0];
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (spec[i][0].length - spec[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // table parts: glowing cells, North rows cyan, South rows pink
  const cell = (j, y, color, fill = 0.08) => { const r = new M.Rectangle({ width: W[j], height: RH, color, strokeWidth: 1 }); r.setFill(color, fill); r.moveTo([colx(j), y, 0]); return r; };
  const txt = (s, j, y, color, size = 18) => { const t = T(String(s), size, color, true); t.moveTo([colx(j), y, 0]); return t; };
  const head = HEAD.map((h, j) => [cell(j, HY, C.muted, 0.15), txt(h, j, HY, C.muted, P ? 15 : 14)]);
  const rows = ROWS.map((r, k) => {
    const y = yOf(k + 1), c = tone(r.s), vals = [r.o, r.l, r.s, r.c, r.p];
    const cells = vals.map((_, j) => cell(j, y, c));
    const texts = vals.map((v, j) => txt(v, j, y, j === 2 ? c : C.ink));
    return { ...r, y, cells, texts, amtCell: cell(5, y, c), q: txt('?', 5, y, C.muted), amt: null, parts: [...cells, ...texts] };
  });
  // slide a whole row to a new height, part by part
  const moveRow = (r, y, arc) => {
    const dy = y - r.y; r.y = y;
    if (!dy) return [];
    return r.parts.map(p => { const c = p.getCenter(), t = p.copy(); t.moveTo([c[0], c[1] + dy, 0]); return new M.Transform(p, t, { pathArc: arc }); });
  };
  const tag = (s, slot, c) => { const t = T(s, 16, c, true, true); t.moveTo([X0 + t.getWidth() / 2 + 0.05, yOf(slot), 0]); return t; };
  const outline = (s0, s1, c, w = TW, x = CX) => { const r = new M.Rectangle({ width: w, height: (s1 - s0 + 1) * RH - 0.06, color: c, strokeWidth: 2.5 }); r.moveTo([x, (yOf(s0) + yOf(s1)) / 2, 0]); return r; };

  // 0 the question: two shops, unknown sales
  const shop = (name, x, c) => {
    const b = new M.RoundedRectangle({ width: 2.6, height: 1.5, cornerRadius: 0.16, color: c, strokeWidth: 2 }); b.setFill(c, 0.1); b.moveTo([x, 0, 0]);
    const n = T(name, 20, c, true, true); n.moveTo([x, 0.3, 0]);
    const q = T('$ ?', 30, C.ink, true, true); q.moveTo([x, -0.25, 0]);
    return [b, n, q];
  };
  const shops = [...shop('NORTH', CX - 1.7, C.cyan), ...shop('SOUTH', CX + 1.7, C.pink)];
  await until(S(0)); await play(new M.LaggedStart(shops.map(m => new M.FadeIn(m)), { lagRatio: 0.15, runTime: 1.4 }), ...say('HOW MUCH DID EACH SHOP SELL IN JANUARY?', C.amber));

  // 1 six order lines, two numbers wanted
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...shops)),
    new M.LaggedStart([head.slice(0, 5).flat(), ...rows.map(r => r.parts)].map(ps => new M.LaggedStart(ps.map(m => new M.FadeIn(m)), { lagRatio: 0.02 })), { lagRatio: 0.2, runTime: 1.8 }),
    ...say('6 ROWS: ONE PER ORDER LINE'));
  await until(at(1, 0.6)); await play(...say('THE OWNER WANTS JUST 2 NUMBERS', C.amber));

  // 2-3 the amount column
  await until(S(2));
  await play(new M.FadeIn(head[5][0]), new M.FadeIn(head[5][1]),
    new M.LaggedStart(rows.flatMap(r => [r.amtCell, r.q]).map(m => new M.FadeIn(m)), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('EACH ROW NEEDS ITS MONEY VALUE', C.amber));
  rows.forEach(r => r.parts.push(r.amtCell));
  await until(S(3));
  await play(new M.Indicate(head[3][1], { color: C.amber }), new M.Indicate(head[4][1], { color: C.amber }),
    ...fbox(['amount = copies × price']), ...say('THE MONEY FROM ONE ROW = THE AMOUNT', C.amber));

  // 4-9 one row at a time: copies × price
  let hl = null;
  for (let k = 0; k < 6; k++) {
    const i = 4 + k, r = rows[k];
    await until(S(i));
    const box = new M.Rectangle({ width: TW + 0.14, height: RH + 0.1, color: C.amber, strokeWidth: 3 }); box.moveTo([CX, r.y, 0]);
    const out = hl ? [new M.FadeOut(hl)] : []; hl = box;
    await play(new M.FadeIn(box), ...out, new M.Indicate(r.texts[3], { color: C.amber }), new M.Indicate(r.texts[4], { color: C.amber }),
      ...fbox(['amount = copies × price', [`${r.c} × ${r.p} = ?`, C.amber]]));
    await until(at(i, k === 0 ? 0.7 : 0.6));
    r.amt = txt(r.a, 5, r.y, C.amber);
    await play(new M.FadeOut(r.q), new M.FadeIn(r.amt), ...fbox(['amount = copies × price', [`${r.c} × ${r.p} = ${r.a}`, C.amber]]));
    r.parts.push(r.amt);
  }

  // 10-12 sort the rows into two piles by store
  await until(S(10));
  await play(new M.FadeOut(hl), ...clearBox(), new M.LaggedStart(rows.map(r => new M.Indicate(r.texts[2], { color: tone(r.s) })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('SORT THE ROWS INTO 2 PILES, BY STORE', C.violet));
  await play(...NORTH.flatMap((k, n) => moveRow(rows[k], yOf(2 + n), 0.3)), ...SOUTH.flatMap((k, n) => moveRow(rows[k], yOf(7 + n), 0.6)));
  let tagN = tag('NORTH PILE', 1, C.cyan), tagS = tag('SOUTH PILE', 6, C.pink);
  await until(S(11)); await play(new M.FadeIn(tagN), new M.LaggedStart(NORTH.map(k => new M.Indicate(rows[k].amt, { color: C.cyan })), { lagRatio: 0.3, runTime: 2.4 }), ...say('NORTH PILE: 4 ROWS', C.cyan));
  await until(S(12)); await play(new M.FadeIn(tagS), new M.LaggedStart(SOUTH.map(k => new M.Indicate(rows[k].amt, { color: C.pink })), { lagRatio: 0.4, runTime: 1.8 }), ...say('SOUTH PILE: 2 ROWS', C.pink));

  // 13 each pile is a group
  const oN = outline(1, 5, C.violet), oS = outline(6, 8, C.violet);
  let tagN2 = tag('NORTH GROUP', 1, C.cyan), tagS2 = tag('SOUTH GROUP', 6, C.pink);
  await until(S(13)); await play(new M.Create(oN), new M.Create(oS), new M.FadeOut(tagN), new M.FadeOut(tagS), new M.FadeIn(tagN2), new M.FadeIn(tagS2), ...say('EACH PILE = A GROUP · GROUPED BY STORE', C.violet));
  tagN = tagN2; tagS = tagS2;

  // 14-16 add up each pile
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(oN, oS)), new M.Indicate(head[5][1], { color: C.green }), ...say('NOW ADD UP EACH PILE', C.green));
  const runN = ['20 + 20 = 40', '40 + 20 = 60', '60 + 30 = 90'], lit = [[0, 1], [3], [4]], when = [0, 0.45, 0.7];
  tagN2 = tag('NORTH GROUP · SUM 90', 1, C.cyan);
  for (let j = 0; j < 3; j++) {
    await until(at(15, when[j]));
    lit[j].forEach(k => rows[k].amtCell.setFill(C.green, 0.35));
    const extra = j === 2 ? [new M.FadeOut(tagN), new M.FadeIn(tagN2)] : [];
    await play(...fbox(['North', ...runN.slice(0, j + 1).map((s, m) => m === j ? [s, C.amber] : s)]), ...extra);
  }
  tagN = tagN2;
  await until(S(16));
  NORTH.forEach(k => rows[k].amtCell.setFill(C.cyan, 0.08));
  SOUTH.forEach(k => rows[k].amtCell.setFill(C.green, 0.35));
  tagS2 = tag('SOUTH GROUP · SUM 40', 6, C.pink);
  await play(...fbox(['South', ['15 + 25 = 40', C.amber]], C.pink), new M.FadeOut(tagS), new M.FadeIn(tagS2));
  tagS = tagS2;

  // 17 six rows become two rows
  // result table: on the phone it is taller and larger, so it fills the screen
  const RW = P ? 2.9 : 1.9, RXa = CX - RW / 2, RXb = CX + RW / 2;
  const RRH = P ? 0.8 : RH, RHY = P ? 0.3 : HY, rY = slot => RHY - slot * RRH;
  const rcell = (x, y, c, f = 0.08, h = RH) => { const r = new M.Rectangle({ width: RW, height: h, color: c, strokeWidth: 1 }); r.setFill(c, f); r.moveTo([x, y, 0]); return r; };
  const rtxt = (s, x, y, c, size = 18) => { const t = T(s, size, c, true); t.moveTo([x, y, 0]); return t; };
  const RFS = P ? 24 : 18, RHS = P ? 16 : 14;
  const resHead = [rcell(RXa, RHY, C.muted, 0.15, RRH), rtxt('STORE', RXa, RHY, C.muted, RHS), rcell(RXb, RHY, C.muted, 0.15, RRH), rtxt('SUM(AMOUNT)', RXb, RHY, C.muted, RHS)];
  const resN = [rcell(RXa, rY(1), C.cyan, 0.08, RRH), rtxt('North', RXa, rY(1), C.cyan, RFS), rcell(RXb, rY(1), C.cyan, 0.08, RRH), rtxt('90', RXb, rY(1), C.amber, RFS)];
  const resS = [rcell(RXa, rY(2), C.pink, 0.08, RRH), rtxt('South', RXa, rY(2), C.pink, RFS), rcell(RXb, rY(2), C.pink, 0.08, RRH), rtxt('40', RXb, rY(2), C.amber, RFS)];
  await until(S(17));
  SOUTH.forEach(k => rows[k].amtCell.setFill(C.pink, 0.08));
  await play(new M.FadeOut(new M.VGroup(tagN, tagS, ...head.flat())), ...clearBox(),
    ...NORTH.flatMap(k => moveRow(rows[k], rY(1), 0.25)), ...SOUTH.flatMap(k => moveRow(rows[k], rY(2), 0.25)),
    ...say('6 ROWS → 2 ROWS', C.amber));
  await play(new M.FadeOut(new M.VGroup(...rows.flatMap(r => r.parts))),
    new M.LaggedStart([...resHead, ...resN, ...resS].map(m => new M.FadeIn(m)), { lagRatio: 0.05, runTime: 1.2 }));

  // 18-20 aggregation, other summaries, grouped aggregation
  await until(S(18)); await play(new M.LaggedStart([resN[3], resS[3]].map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.4, runTime: 1.6 }), ...say('AGGREGATION: MANY VALUES → ONE NUMBER', C.green));
  await until(S(19)); await play(...fbox(['North: 20 20 20 30', ['sum   = 90', C.amber]]), ...say('SUM · COUNT · MEAN · LARGEST', C.green));
  await until(at(19, 0.4)); await play(...fbox(['North: 20 20 20 30', ['sum   = 90', C.amber], 'count = 4', 'mean  = 22.5', 'max   = 30']));
  await until(S(20)); await play(...clearBox(), new M.LaggedStart([resN[1], resN[3], resS[1], resS[3]].map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.25, runTime: 2.0 }),
    ...say('ONCE PER GROUP = GROUPED AGGREGATION', C.green));

  // 21 one till per shop
  const TILLY = P ? -2.9 : -1.3;
  const till = (name, money, x, c) => {
    const b = new M.RoundedRectangle({ width: 2.8, height: 1.3, cornerRadius: 0.14, color: c, strokeWidth: 2 }); b.setFill(c, 0.1); b.moveTo([x, TILLY, 0]);
    const n = T(name, 15, c, true, true); n.moveTo([x, TILLY + 0.38, 0]);
    const m = T(money, 30, C.amber, true, true); m.moveTo([x, TILLY - 0.1, 0]);
    const handle = new M.Line({ start: [x - 0.45, TILLY - 0.5, 0], end: [x + 0.45, TILLY - 0.5, 0], color: c, strokeWidth: 3 });
    return [b, n, m, handle];
  };
  const tills = [...till('NORTH TILL', '$90', CX - 1.6, C.cyan), ...till('SOUTH TILL', '$40', CX + 1.6, C.pink)];
  await until(S(21)); await play(new M.LaggedStart(tills.map(m => new M.FadeIn(m)), { lagRatio: 0.1, runTime: 1.4 }), ...say('LIKE COUNTING EACH TILL', C.amber));

  // 22 check: nothing lost
  await until(S(22)); await play(...fbox(['before: 6 rows = 130', ['after:  90 + 40 = 130', C.amber], ['nothing lost ✓', C.green]], C.green), ...say('CHECK: SAME TOTAL, 130', C.green));

  // 23-25 the SQL
  const SQL = ['SELECT store,', '  SUM(copies * price)', 'FROM sales', 'GROUP BY store'];
  await until(S(23)); await play(new M.FadeOut(new M.VGroup(...tills)), ...fbox(SQL), ...say('IN SQL', C.cyan));
  await until(S(24)); await play(...fbox([SQL[0], [SQL[1], C.amber], SQL[2], SQL[3]]), ...say('SUM = ADD UP', C.amber));
  await until(at(24, 0.4)); await play(...fbox([SQL[0], [SQL[1], C.amber], SQL[2], [SQL[3], C.green]]), ...say('GROUP BY STORE = ONE PILE PER STORE', C.green));
  await until(S(25)); await play(new M.LaggedStart([resN[3], resS[3]].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.4, runTime: 1.6 }), ...say('SPLIT BY STORE, THEN ADD UP EACH PILE', C.green));

  // 26 the new grain
  const grain = T('1 row = 1 store', 16, C.violet); grain.moveTo(P ? [CX, rY(2) - RRH / 2 - 0.4, 0] : [CX + RW + 1.05, (rY(1) + rY(2)) / 2, 0]);
  await until(S(26)); await play(...clearBox(), new M.FadeIn(grain), new M.Indicate(resN[1], { color: C.violet }), new M.Indicate(resS[1], { color: C.violet }), ...say('NEW GRAIN: 1 ROW = 1 STORE', C.violet));

  // 27-28 what it is for
  const REP = ['sales per shop', 'visits per day', 'complaints per route'];
  await until(S(27)); await play(...say('MOST REPORTS ARE BUILT THIS WAY', C.cyan));
  for (const [j, f] of [[1, 0.45], [2, 0.65], [3, 0.82]]) { await until(at(27, f)); await play(...fbox(REP.slice(0, j))); }
  await until(S(28)); await play(...fbox(['for each shop:  sales', 'for each day:   visits', 'for each route: complaints']), ...say('QUESTIONS THAT START WITH “FOR EACH”', C.amber));

  // 29-33 the trap: adding the wrong column
  const MY = P ? -2.5 : -0.35, MW = 1.3, mx = j => CX + (j - 1) * MW;
  const mcell = (x, y, c, f) => { const r = new M.Rectangle({ width: MW, height: RH, color: c, strokeWidth: 1 }); r.setFill(c, f); r.moveTo([x, y, 0]); return r; };
  const mini = [], miniT = [[], [], []];
  ['COPIES', 'PRICE', 'AMOUNT'].forEach((h, j) => mini.push(mcell(mx(j), MY, C.muted, 0.15), rtxt(h, mx(j), MY, C.muted, P ? 15 : 14)));
  NORTH.forEach((k, i) => {
    const r = ROWS[k], y = MY - (i + 1) * RH;
    [r.c, r.p, r.a].forEach((v, j) => { const t = rtxt(String(v), mx(j), y, j === 2 ? C.amber : C.ink); mini.push(mcell(mx(j), y, C.cyan, 0.08), t); miniT[j].push(t); });
  });
  const miniLab = T('NORTH', 16, C.cyan, true, true); miniLab.moveTo([CX - 1.5 * MW - 0.6, MY - 2.5 * RH, 0]);
  const colBox = (j, c) => { const r = new M.Rectangle({ width: MW + 0.1, height: 5 * RH + 0.1, color: c, strokeWidth: 3 }); r.moveTo([mx(j), MY - 2 * RH, 0]); return r; };
  const oPrice = colBox(1, C.pink), oAmt = colBox(2, C.green);
  await until(S(29)); await play(new M.FadeOut(grain), ...clearBox(), new M.LaggedStart([miniLab, ...mini].map(m => new M.FadeIn(m)), { lagRatio: 0.03, runTime: 1.4 }), ...say('TRAP: ADDING THE WRONG COLUMN', C.pink));
  await until(S(30)); await play(new M.Create(oPrice), ...say('SUPPOSE WE ADD THE PRICE…', C.pink));
  await until(S(31)); await play(new M.LaggedStart(miniT[1].map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.3, runTime: 2.0 }),
    ...fbox([['price: 10 + 20 + 20 + 15', C.pink], ['     = 65', C.pink]], C.pink));
  await until(S(32)); await play(new M.Create(oAmt), new M.Indicate(resN[3], { color: C.green }),
    ...fbox([['price  sum = 65 ✗', C.pink], ['amount sum = 90 ✓', C.green]], C.green), ...say('NORTH REALLY MADE 90', C.green));
  await until(at(32, 0.5)); await play(new M.LaggedStart(miniT[0].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.3, runTime: 1.6 }), ...say('THE PRICE FORGETS THE COPIES', C.pink));
  await until(S(33)); await play(...fbox(['1 price  = $ for 1 copy', '1 amount = $ for 1 row', ['add the amount ✓', C.green]]), ...say('ASK: DOES ADDING THIS COLUMN MAKE SENSE?', C.amber));

  // 34-35 the detail is gone
  await until(S(34)); await play(new M.FadeOut(new M.VGroup(...mini, miniLab, oPrice, oAmt)), ...fbox(['North 90 = ? + ? + ? + ?', 'South 40 = ? + ?'], C.muted), ...say('THE DETAIL IS GONE', C.muted));
  await until(S(35)); await play(...clearBox(), ...say('NEXT: ADD UP AND KEEP EVERY ROW', C.violet));

  // 36 summary
  await until(S(36)); await play(...fbox(['1. sort rows into groups', '2. one number per group', ['6 rows → 2 rows', C.amber]], C.green),
    new M.Flash(resN[3], { color: C.amber }), new M.Flash(resS[3], { color: C.amber }), ...say('GROUPED AGGREGATION', C.green));
}

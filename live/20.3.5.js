// 20.3.5 Top-k sampling: keep the k most likely tokens, share their probabilities again, then draw (script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers: chapters/20.3.md (fixed).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const FIRST = [['at', 45], ['on', 30], ['soon', 15], ['late', 6], ['purple', 4]];
  const SECOND = [['nine', 40], ['ten', 30], ['noon', 30]];
  const HOT = [33, 27, 19, 12, 10];   // the first step at temperature 2 (20.3.4)
  const WORDS = ['The', 'library', 'will', 'open'];
  const CX = P ? 0 : -1.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const PRE = P ? [-3.6, 1.2] : [-6.3, 1.15];
  // bar charts: bars start at x0 (100% = bl long), rows go down from y0 by dy, the k line reaches cut × bl
  const G = P ? { x0: -2.1, bl: 4.6, y0: 0.15, dy: 0.95, bh: 0.5, size: 21, cut: 0.8 }
    : { x0: -4.6, bl: 6.0, y0: 0.45, dy: 0.66, bh: 0.4, size: 20, cut: 0.8 };
  const GA = P ? { x0: -1.9, bl: 4.4, y0: 0.9, dy: 0.62, bh: 0.38, size: 19, cut: 0.6 }
    : { x0: -5.6, bl: 3.6, y0: 0.45, dy: 0.58, bh: 0.34, size: 18, cut: 0.5 };
  const GB = P ? { ...GA, y0: -3.4 } : { ...GA, x0: -1.1 };
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent; at most 3 lines (phone)
  let boxNow = null;
  function fbox(lines, color = C.cyan, hi = false) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const at = P ? (hi ? [0, 4.3 - ht / 2, 0] : [0, -5.4, 0]) : (hi ? [5.0, -0.3, 0] : BOXP);
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const left = at[0] - wd / 2 + 0.35, top = at[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.6 : (hi ? 3.4 : 4.0);
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function noBox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // token cards: the words so far, left to right
  let cardSize = P ? 20 : 22;
  const cardW = s => T(s, cardSize, C.ink, true).getWidth() + 0.24;
  const longest = [...WORDS, 'purple'].reduce((a, w) => a + cardW(w), 0), room = P ? FW - 0.8 : 7;
  if (longest > room) cardSize *= room / longest;
  function card(s, x, color = C.ink) {
    const t = T(s, cardSize, color, true), w = t.getWidth() + 0.12;
    const r = new M.RoundedRectangle({ width: w, height: P ? 0.5 : 0.48, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([x + w / 2, PRE[1], 0]); t.moveTo([x + w / 2, PRE[1], 0]);
    const g = new M.VGroup(r, t); g.end = x + w + 0.12; return g;
  }
  const prefix = () => { let x = PRE[0]; return WORDS.map(s => { const c = card(s, x); x = c.end; return c; }); };

  // chance bars: one row = token word, bar, percent
  const rowY = (g, i) => g.y0 - i * g.dy;
  const barW = (g, v) => Math.max(0.02, v / 100 * g.bl);
  function bar(g, i, v, color = C.cyan) {
    const w = barW(g, v), b = new M.Rectangle({ width: w, height: g.bh, color, strokeWidth: 1 });
    b.setFill(color, 0.85); b.moveTo([g.x0 + w / 2, rowY(g, i), 0]); return b;
  }
  function pct(g, i, v, color = C.ink) {
    const t = T(`${v}%`, g.size - 2, color, true); t.moveTo([g.x0 + barW(g, v) + 0.12 + t.getWidth() / 2, rowY(g, i), 0]); return t;
  }
  function word(g, i, s, color = C.ink) {
    const t = T(s, g.size, color, true); t.moveTo([g.x0 - 0.15 - t.getWidth() / 2, rowY(g, i), 0]); return t;
  }
  const makeRows = (g, data) => data.map(([s, v], i) => ({ lab: word(g, i, s), bar: bar(g, i, v), pct: pct(g, i, v) }));
  const parts = r => [r.lab, r.bar, r.pct];
  const rowIn = r => parts(r).map(m => new M.FadeIn(m, { runTime: 0.7 }));
  const setBar = (r, g, i, v, color = C.cyan) => new M.Transform(r.bar, bar(g, i, v, color));
  function setPct(r, g, i, v, color = C.ink) { const old = r.pct; r.pct = pct(g, i, v, color); return [new M.FadeOut(old), new M.FadeIn(r.pct)]; }
  // the k line sits just below the k-th row
  const cutY = (g, k) => rowY(g, k - 1) - g.dy / 2;
  const cutLine = (g, k) => new M.DashedLine({ start: [g.x0 - 1.1, cutY(g, k), 0], end: [g.x0 + g.bl * g.cut, cutY(g, k), 0], color: C.amber });
  function tagK(g, k, at = k) {
    const t = T(`k = ${k}`, g.size, C.amber, true, true);
    t.moveTo([g.x0 + g.bl * g.cut + 0.15 + t.getWidth() / 2, cutY(g, at), 0]); return t;
  }

  // 0-2 the problem from the last lesson
  let pre = prefix();
  await until(S(0)); await play(new M.LaggedStart(pre.map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.4 }), ...fbox(['drawing at random', ['→ varied answers', C.cyan]]), ...say('DRAWING AT RANDOM → VARIETY'));
  const bad = card('purple', pre[3].end, C.pink);
  await until(S(1)); await play(new M.FadeIn(bad), ...fbox(['but silly tokens', ['like “purple” can', C.pink], ['still be drawn', C.pink]], C.pink), ...say('PROBLEM: “PURPLE” CAN STILL BE DRAWN', C.pink));
  await play(new M.Indicate(bad, { color: C.pink }));
  await until(S(2)); await play(new M.FadeOut(bad), ...say('KEEP VARIETY, REMOVE NONSENSE?', C.amber));

  // 3-4 the first step: five chances
  await until(S(3)); await play(...noBox(), new M.LaggedStart(pre.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.4 }), ...say('FIRST STEP: WHAT COMES NEXT?'));
  let rows = makeRows(G, FIRST);
  const said = [0, 1.7, 2.9, 4.1, 5.2];
  for (let i = 0; i < 5; i++) {
    await until(S(4) + said[i]);
    await play(...rowIn(rows[i]), ...(i === 0 ? say('THE PROBABILITY OF EACH NEXT TOKEN') : []));
  }

  // 5-7 keep only the tallest bars: k = 2
  await until(S(5)); await play(...say('BEFORE DRAWING: KEEP ONLY THE TALLEST', C.amber));
  let cut = cutLine(G, 2), ktag = tagK(G, 2);
  await until(S(6)); await play(new M.Create(cut), ...say('KEEP TWO', C.amber));
  await until(S(6) + 1.6); await play(new M.FadeIn(ktag), ...say('THIS NUMBER IS k:  k = 2', C.amber));
  await until(S(7)); await play(new M.Indicate(rows[0].bar, { color: C.cyan }), new M.Indicate(rows[1].bar, { color: C.cyan }), ...say('“AT” AND “ON” STAY'));
  await until(S(7) + 1.6); await play(...rows.slice(2).map((r, j) => setBar(r, G, j + 2, FIRST[j + 2][1], C.pink)), ...fbox(['k = 2: keep at, on', ['remove soon, late,', C.pink], ['purple', C.pink]], C.pink), ...say('SOON, LATE, PURPLE: REMOVED', C.pink));
  await play(new M.FadeOut(new M.VGroup(...rows.slice(2).flatMap(parts))));
  let kept = rows.slice(0, 2);

  // 8-14 share the chances out again
  await until(S(8)); await play(...fbox(['kept total', ['45 + 30 = 75%', C.cyan]]), ...say('THE TWO KEPT BARS: 75%'));
  await until(S(9)); await play(...fbox(['kept total = 75%', ['must be 100%', C.amber]], C.amber), ...say('PROBABILITIES MUST ADD UP TO 100%', C.amber));
  await until(S(9) + 2.3); await play(...say('SO: SHARE THEM OUT AGAIN', C.amber));
  await until(S(10)); await play(...fbox(['at: its part of 75', 'on: its part of 75']), ...say('EACH GETS ITS PART OF THE 75'));
  await until(S(11)); await play(...fbox(['at had 45 out of 75']), ...say('“AT”: 45 OUT OF 75'));
  await until(S(11) + 3.0); await play(...fbox(['at = 45 ÷ 75', ['   = 0.6', C.cyan]]));
  await until(S(11) + 6.0); await play(setBar(kept[0], G, 0, 60), ...setPct(kept[0], G, 0, 60, C.cyan), ...fbox(['at = 45 ÷ 75', '   = 0.6', ['   = 60%', C.cyan]]));
  await until(S(12)); await play(...fbox(['on had 30 out of 75']), ...say('“ON”: 30 OUT OF 75'));
  await until(S(12) + 2.4); await play(...fbox(['on = 30 ÷ 75', ['   = 0.4', C.cyan]]));
  await until(S(12) + 3.9); await play(setBar(kept[1], G, 1, 40), ...setPct(kept[1], G, 1, 40, C.cyan), ...fbox(['on = 30 ÷ 75', '   = 0.4', ['   = 40%', C.cyan]]));
  await until(S(13)); await play(new M.Indicate(kept[0].pct, { color: C.green }), new M.Indicate(kept[1].pct, { color: C.green }),
    ...fbox([['60% + 40% = 100%', C.green]], C.green), ...say('60 + 40 = 100 ✓', C.green));
  await until(S(14)); await play(...fbox(['before: 45 ÷ 30 = 1.5', ['now:    60 ÷ 40 = 1.5', C.cyan]]), ...say('“AT” STILL 1.5 × “ON”', C.violet));

  // 15-16 draw from these two only
  const drawn = card('at', pre[3].end, C.cyan);
  await until(S(15)); await play(new M.Flash(kept[0].bar, { color: C.cyan }), ...fbox(['draw:', ['at 60%  or  on 40%', C.cyan]]), ...say('DRAW FROM THESE TWO ONLY'));
  await play(new M.FadeIn(drawn, { shift: [0, 0.12, 0] }));
  const ghost = [word(G, 4, 'purple', C.pink), pct(G, 4, 0, C.pink)];
  await until(S(16)); await play(...ghost.map(m => new M.FadeIn(m)), ...say('“PURPLE”: 0% AT THIS STEP', C.pink));

  // 17-21 the name, the words, the special case
  await until(S(17)); await play(new M.FadeOut(new M.VGroup(...ghost, drawn)), ...fbox([['top-k sampling', C.green]], C.green), ...say('THIS IS TOP-K SAMPLING', C.green));
  await until(S(18)); await play(...say('REMEMBER: SAMPLING = DRAWING AT RANDOM', C.green));
  await until(S(18) + 2.6); await play(new M.Indicate(ktag, { color: C.amber }), ...say('TOP-K = ONLY THE k MOST LIKELY', C.green));
  await until(S(19)); await play(...say('IN WORDS', C.cyan));
  await until(S(19) + 0.8); await play(...fbox(['1 sort the tokens']));
  await until(S(19) + 2.1); await play(...fbox(['1 sort the tokens', '2 keep the top k']));
  await until(S(19) + 3.4); await play(...fbox(['1 sort the tokens', '2 keep the top k', ['3 ÷ their total', C.cyan]]));
  await until(S(19) + 5.6); await play(...fbox(['1 sort the tokens', '2 keep the top k', ['3 ÷ their total, draw', C.cyan]]));
  await until(S(20)); await play(...fbox(['45 ÷ 75 + 30 ÷ 75', '= 75 ÷ 75', ['= 100%', C.green]], C.green), ...say('÷ THEIR TOTAL → 100% AGAIN', C.green));
  const cut1 = cutLine(G, 1), tag1 = tagK(G, 1);
  await until(S(21)); await play(new M.FadeOut(cut), new M.FadeOut(ktag), new M.Create(cut1), new M.FadeIn(tag1), ...say('SPECIAL CASE: k = 1', C.amber));
  cut = cut1; ktag = tag1;
  await until(S(21) + 2.6); await play(setBar(kept[1], G, 1, 40, C.pink), ...fbox(['k = 1: keep “at” only', ['at = 45 ÷ 45 = 100%', C.amber]], C.amber), ...say('ALWAYS THE TOP TOKEN', C.amber));
  await play(new M.FadeOut(new M.VGroup(...parts(kept[1]))), setBar(kept[0], G, 0, 100), ...setPct(kept[0], G, 0, 100, C.cyan));
  await until(S(21) + 5.0); await play(...say('k = 1 IS GREEDY DECODING', C.violet));

  // 22-24 together with temperature: reshape, then cut the tail
  const old = kept[0];
  rows = makeRows(G, FIRST);
  await until(S(22)); await play(new M.FadeOut(new M.VGroup(...parts(old), cut, ktag)), ...noBox(),
    new M.LaggedStart(rows.flatMap(rowIn), { lagRatio: 0.05, runTime: 1.4 }), ...say('TOP-K + TEMPERATURE', C.violet));
  const tl = G.x0 - 1.3, tr = G.x0 + G.bl * 0.5, tt = rowY(G, 2) + G.dy / 2, tb = rowY(G, 4) - G.dy / 2;
  const tailBox = new M.RoundedRectangle({ width: tr - tl, height: tt - tb, cornerRadius: 0.14, color: C.pink, strokeWidth: 2 });
  tailBox.moveTo([(tl + tr) / 2, (tt + tb) / 2, 0]);
  const tailTag = T('tail', 20, C.pink, true, true); tailTag.moveTo([tr + 0.2 + tailTag.getWidth() / 2, (tt + tb) / 2, 0]);
  await until(S(23)); await play(new M.Create(tailBox), new M.FadeIn(tailTag), ...say('TAIL = THE UNLIKELY END OF THE LIST', C.pink));
  await until(S(24)); await play(...rows.map((r, i) => setBar(r, G, i, HOT[i])), ...rows.flatMap((r, i) => setPct(r, G, i, HOT[i])),
    ...fbox(['temperature 2:', '45  30  15  6  4', ['33  27  19  12  10', C.amber]], C.amber), ...say('TEMPERATURE RESHAPES THE PROBABILITIES', C.amber));
  cut = cutLine(G, 2); ktag = tagK(G, 2);
  await until(S(24) + 2.4); await play(new M.FadeOut(new M.VGroup(...rows.slice(2).flatMap(parts), tailBox, tailTag)),
    new M.Create(cut), new M.FadeIn(ktag), ...say('TOP-K CUTS OFF THE TAIL', C.pink));
  kept = rows.slice(0, 2);

  // 25-28 what it is for
  await until(S(25)); await play(setBar(kept[0], G, 0, 55), ...setPct(kept[0], G, 0, 55, C.cyan), setBar(kept[1], G, 1, 45), ...setPct(kept[1], G, 1, 45, C.cyan),
    ...fbox(['kept: 33 + 27 = 60', 'share again:', ['33 ÷ 60 = 55%', C.cyan], ['27 ÷ 60 = 45%', C.cyan]]), ...say('WHAT IS TOP-K SAMPLING FOR?', C.violet));
  await until(S(26)); await play(new M.Indicate(kept[0].bar, { color: C.cyan }), new M.Indicate(kept[1].bar, { color: C.cyan }), ...say('VARIED ANSWERS, NO SILLY TOKENS', C.green));
  const DC = P ? 10 : 16, DR = P ? 10 : 6, DS = P ? 0.55 : 0.38, DOT = P ? [0, -2.2] : [CX, -0.95];
  const dots = [];
  for (let r = 0; r < DR; r++) for (let c = 0; c < DC; c++) {
    const n = dots.length, p = [DOT[0] + (c - (DC - 1) / 2) * DS, DOT[1] + ((DR - 1) / 2 - r) * DS, 0];
    dots.push(new M.Dot({ point: p, radius: n < 4 ? 0.13 : 0.07, color: n < 4 ? C.cyan : C.muted }));
  }
  const dotNote = T('1 dot = 1 possible token (only a few shown)', P ? 17 : 17, C.muted);
  dotNote.moveTo([DOT[0], DOT[1] + (DR - 1) / 2 * DS + 0.55, 0]);
  await until(S(27)); await play(new M.FadeOut(new M.VGroup(...kept.flatMap(parts), cut, ktag, ...pre)), ...noBox(), new M.FadeIn(dotNote),
    new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.02, runTime: 1.6 }), ...say('REAL MODELS: TENS OF THOUSANDS OF TOKENS'));
  await until(S(27) + 3.2);
  dots.slice(4).forEach(d => { d.setFill(C.pink, 1); d.setColor(C.pink); });
  await play(...say('MOST OF THEM MAKE NO SENSE', C.pink));
  await until(S(28)); await play(new M.LaggedStart(dots.slice(4).map(d => new M.FadeOut(d)), { lagRatio: 0.02, runTime: 1.6 }), ...say('ONE SIMPLE CUT: ALL OF THOSE GONE', C.green));

  // 29-34 the trap: the next step
  await until(S(29)); await play(new M.FadeOut(new M.VGroup(...dots.slice(0, 4), dotNote)), ...say('NOW THE TRAP', C.pink));
  pre = prefix();
  const atCard = card('at', pre[3].end, C.cyan);
  const rows2 = makeRows(G, SECOND);
  await until(S(30)); await play(new M.LaggedStart([...pre, atCard].map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.4 }),
    new M.FadeIn(new M.VGroup(...rows2.flatMap(r => [r.lab, r.bar]))), ...fbox(['after “…open at”:', ['nine, ten or noon?', C.cyan]]), ...say('NEXT STEP: AFTER “…WILL OPEN AT”'));
  const said2 = [1.2, 2.6, 3.8];
  for (let i = 0; i < 3; i++) {
    await until(S(31) + said2[i]);
    await play(new M.FadeIn(rows2[i].pct), new M.Indicate(rows2[i].bar, { color: C.cyan, runTime: 0.6 }), ...(i === 0 ? say('NINE 40%   TEN 30%   NOON 30%') : []));
  }
  cut = cutLine(G, 2); ktag = tagK(G, 2);
  await until(S(32)); await play(new M.Create(cut), new M.FadeIn(ktag), ...fbox(['k = 2', ['keep: nine, ten', C.cyan]]), ...say('k STILL 2: KEEP NINE AND TEN', C.amber));
  await until(S(33)); await play(setBar(rows2[2], G, 2, 30, C.pink), new M.Indicate(rows2[1].pct, { color: C.amber }), new M.Indicate(rows2[2].pct, { color: C.amber }),
    ...fbox(['k = 2', ['keep: nine, ten', C.cyan], ['drop: noon', C.pink]]), ...say('NOON 30% = TEN 30%, BUT CUT', C.pink));
  await until(S(34)); await play(new M.LaggedStart(rows2.map(r => new M.Indicate(r.lab, { color: C.green })), { lagRatio: 0.3, runTime: 1.6 }), ...say('3 GOOD CHOICES, k ALLOWS ONLY 2', C.pink));

  // 35-37 a bigger k?
  const cut5 = cutLine(G, 3), tag5 = tagK(G, 5, 3);
  await until(S(35)); await play(new M.FadeOut(cut), new M.FadeOut(ktag), new M.Create(cut5), new M.FadeIn(tag5), ...say('A BIGGER k?  k = 5', C.amber));
  cut = cut5; ktag = tag5;
  await until(S(36)); await play(setBar(rows2[2], G, 2, 30), ...fbox(['k = 5, only 3 tokens', ['keep all 3', C.green]], C.green), ...say('NOON SURVIVES', C.green));
  rows = makeRows(G, FIRST);
  const cutAll = cutLine(G, 5), tagAll = tagK(G, 5);
  await until(S(37)); await play(new M.FadeOut(new M.VGroup(...rows2.flatMap(parts), atCard, cut, ktag)),
    new M.LaggedStart(rows.flatMap(rowIn), { lagRatio: 0.05, runTime: 1.4 }), new M.Create(cutAll), new M.FadeIn(tagAll),
    ...fbox(['first step, k = 5', ['keep all 5', C.amber]], C.amber), ...say('BACK AT THE FIRST STEP: ALL 5 KEPT', C.amber));
  cut = cutAll; ktag = tagAll;
  await until(S(37) + 3.6); await play(new M.Indicate(rows[4].bar, { color: C.pink }), new M.Indicate(rows[4].lab, { color: C.pink }), ...say('“PURPLE” IS BACK', C.pink));

  // 38-39 one fixed k for every step, whatever the shape
  const A = makeRows(GA, FIRST), B = makeRows(GB, SECOND);
  const title = (g, s) => { const t = T(s, P ? 18 : 18, C.muted, true); t.moveTo([P ? 0 : g.x0 + 0.6, g.y0 + 0.6, 0]); return t; };
  const titles = [title(GA, 'after “…open”'), title(GB, 'after “…open at”')];
  await until(S(38)); await play(new M.FadeOut(new M.VGroup(...rows.flatMap(parts), cut, ktag, ...pre)), ...noBox(),
    new M.LaggedStart([...titles, ...A.flatMap(parts), ...B.flatMap(parts)].map(m => new M.FadeIn(m)), { lagRatio: 0.03, runTime: 1.6 }),
    ...say('SOME STEPS NEED FEW TOKENS, OTHERS MORE'));
  await until(S(38) + 3.3);
  [...A.slice(2), ...B.slice(2)].forEach(r => { r.bar.setFill(C.pink, 0.85); r.bar.setColor(C.pink); });
  const cutA = cutLine(GA, 2), cutB = cutLine(GB, 2), tagA = tagK(GA, 2), tagB = tagK(GB, 2);
  await play(new M.Create(cutA), new M.Create(cutB), new M.FadeIn(tagA), new M.FadeIn(tagB),
    ...fbox(['step 1: k = 2', 'step 2: k = 2', ['same k every step', C.amber]], C.amber, true), ...say('k STAYS THE SAME AT EVERY STEP', C.amber));
  const shapeY = (g, n) => P ? rowY(g, n - 1) - 0.55 : rowY(GA, 4) - 0.55;
  const shapeA = T('peaked', 19, C.violet, true, true), shapeB = T('spread out', 19, C.violet, true, true);
  shapeA.moveTo([P ? 0 : GA.x0 + 0.6, shapeY(GA, 5), 0]); shapeB.moveTo([P ? 0 : GB.x0 + 0.6, shapeY(GB, 3), 0]);
  await until(S(39)); await play(new M.FadeIn(shapeA), new M.FadeIn(shapeB), ...say('A FIXED k IGNORES THE SHAPE', C.pink));

  // 40-41 next lesson and recap
  await until(S(40)); await play(...say('NEXT: KEEP TOKENS BY ADDING UP PROBABILITIES', C.violet));
  await until(S(41)); await play(...fbox([['top-k: keep the k', C.green], 'most likely, share', 'again, then draw'], C.green, true),
    ...say('DRAW ONLY FROM THE k MOST LIKELY', C.green));
}

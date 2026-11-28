// 21.2.3 Retrieval recall: did the right passage reach the assistant? (live version, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const BLUE = '#60a5fa';
  const RANK = [1, 1, 2, 1, 3, 1, 2, 1, 5, 1];      // place of each card's source passage (Q1..Q10)
  const RIGHT = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1];     // assistant A: 7 of 10 right, wrong on Q1, Q5, Q9
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.6, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fitW = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const label = (s, size, color, p, mono = true, bold = false) => { const t = T(s, size, color, mono, bold); t.moveTo(p); return t; };
  const bar = (p, w, h = 0.2, color = C.cyan, op = 0.8) => { const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1 }); r.setFill(color, op); r.moveTo(p); return r; };
  const card = (p, w, h, color = C.cyan) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(p); return r; };
  const arrow = (a, b, color = C.muted) => new M.Arrow({ start: a, end: b, color, strokeWidth: 3 });

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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // the guide: a box of passage strips; the assistant: a blue circle
  function guide(c, w, h, n) {
    const box = card(c, w, h, C.muted);
    const title = label('GUIDE', 16, C.muted, [c[0], c[1] + h / 2 - 0.3, 0], true, true);
    const top = c[1] + h / 2 - 0.75, pitch = (h - 1.1) / (n - 1);
    const lines = Array.from({ length: n }, (_, i) => bar([c[0], top - i * pitch, 0], w - 0.6));
    return { box, title, lines };
  }
  function bot(c, r) {
    const ring = new M.Circle({ radius: r, color: BLUE, strokeWidth: 3 }); ring.setFill(BLUE, 0.15); ring.moveTo(c);
    return [ring, label('A', 26, BLUE, c, false, true), label('assistant', 15, C.muted, [c[0], c[1] - r - 0.3, 0], false)];
  }

  // 0 the library assistant answers from the guide
  const G0 = P ? [0, 0.1, 0] : [-3.2, -0.4, 0], A0 = P ? [0, -3.9, 0] : [3.2, -0.4, 0];
  const g0 = guide(G0, P ? 3.0 : 2.4, P ? 2.9 : 3.2, P ? 5 : 6);
  const b0 = bot(A0, 0.6);
  const a0 = P ? arrow([0, -1.55, 0], [0, -3.2, 0]) : arrow([-1.8, -0.4, 0], [2.5, -0.4, 0]);
  const intro = [g0.box, g0.title, ...g0.lines, a0, ...b0];
  await until(S(0)); await play(new M.LaggedStart(intro.map(x => new M.FadeIn(x)), { lagRatio: 0.06, runTime: 1.6 }), ...say('ASSISTANT ANSWERS FROM THE GUIDE'));

  // 1 ten held-out question cards
  const small = k => P ? [((k % 5) - 2) * 1.45, k < 5 ? 0.4 : -1.7, 0] : [(k - 4.5) * 1.25, -0.4, 0];
  const cards1 = RANK.map((_, k) => card(small(k), P ? 1.1 : 0.95, P ? 1.5 : 1.3));
  const cardLab1 = RANK.map((_, k) => label('Q' + (k + 1), 18, C.cyan, small(k), true, true));
  const heldNote = fitW(T('held out: kept aside, never seen while building', P ? 14 : 16, C.muted), FW - 0.8);
  heldNote.moveTo([0, P ? -3.0 : -1.6, 0]);
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...intro)), ...say('10 HELD-OUT TEST CARDS'));
  await play(new M.LaggedStart(cards1.flatMap((c, k) => [new M.FadeIn(c), new M.FadeIn(cardLab1[k])]), { lagRatio: 0.06, runTime: 1.6 }), new M.FadeIn(heldNote));

  // 2-5 one card, close up: card 9
  const BC = P ? [0, -0.9, 0] : [0, -0.45, 0], BWD = P ? 7.2 : 7.0, BHT = P ? 4.4 : 3.5;
  const btop = BC[1] + BHT / 2, bl = BC[0] - BWD / 2 + 0.35, cx0 = P ? -0.1 : -0.2, cw = BC[0] + BWD / 2 - 0.35 - cx0;
  const RP = P ? 0.9 : 0.72, rowY = i => btop - 0.95 - i * RP;
  const names = ['QUESTION', 'DATE', 'SOURCE PASSAGE', 'AGREED ANSWER'].map((s, i) => {
    const t = fitW(T(s, P ? 16 : 17, C.ink, true, true), cx0 - bl - 0.25); t.moveTo([bl + t.getWidth() / 2, rowY(i), 0]); return t; });
  const qBar = bar([cx0 + 0.45 * cw, rowY(0), 0], 0.9 * cw);
  const dBar = bar([cx0 + 0.6, rowY(1), 0], 1.2);
  const pBars = [0, 1, 2].map(j => bar([cx0 + (j === 2 ? 0.3 : 0.45) * cw, rowY(2) + (1 - j) * 0.2, 0], (j === 2 ? 0.6 : 0.9) * cw, 0.12));
  const aBar = bar([cx0 + 0.35 * cw, rowY(3), 0], 0.7 * cw, 0.2, C.green);
  const libs = [0.8, 0.92].map(f => new M.Dot({ point: [cx0 + f * cw, rowY(3), 0], radius: 0.09, color: C.green }));
  const bigCard = card(BC, BWD, BHT);
  const bigLab = label('Q9', 20, C.cyan, [bl + 0.25, btop - 0.38, 0], true, true);
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(...cards1.filter((_, k) => k !== 8), ...cardLab1, heldNote)), new M.FadeOut(cards1[8]), new M.FadeIn(bigCard));
  const fields = [[names[0], qBar], [names[1], dBar], [names[2], ...pBars], [names[3], aBar, ...libs]];
  await play(new M.FadeIn(bigLab), new M.LaggedStart(fields.map(f => new M.LaggedStart(f.map(x => new M.FadeIn(x)), { lagRatio: 0.2 })), { lagRatio: 0.3, runTime: 2.2 }),
    ...say('QUESTION · DATE · SOURCE PASSAGE · ANSWER'));

  await until(S(3));
  pBars.forEach(b => { b.setColor(C.amber); b.setFill(C.amber, 0.9); });
  await play(new M.LaggedStart([names[2], ...pBars].map(x => new M.Indicate(x, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...say('A FEW SENTENCES THAT ANSWER IT', C.amber));

  const qText = fitW(T('How do I book room R12?', P ? 16 : 18, C.ink), cw); qText.moveTo([cx0 + qText.getWidth() / 2, rowY(0), 0]);
  await until(S(4)); await play(new M.FadeOut(qBar), new M.FadeIn(qText), new M.Indicate(bigLab, { color: C.amber }), ...say('CARD 9: BOOK ROOM R12', C.amber));

  const xc = [BC[0] + BWD / 2 - 0.5, btop - 0.42], xs = 0.18;
  const cross = [new M.Line({ start: [xc[0] - xs, xc[1] - xs, 0], end: [xc[0] + xs, xc[1] + xs, 0], color: C.pink, strokeWidth: 5 }),
    new M.Line({ start: [xc[0] - xs, xc[1] + xs, 0], end: [xc[0] + xs, xc[1] - xs, 0], color: C.pink, strokeWidth: 5 })];
  await until(S(5)); await play(new M.Create(cross[0]), new M.Create(cross[1]), ...say('THE ASSISTANT GOT IT WRONG. WHY?', C.pink));

  // 6-11 the search step: guide -> retriever -> ranking -> top 3 -> answer
  const GB = P ? [-2.2, -0.65, 0] : [-5.2, -0.45, 0];
  const gb = guide(GB, P ? 2.6 : 2.2, P ? 3.8 : 3.6, 8);
  const SB = P ? [-2.2, -3.3, 0] : [-2.5, -0.45, 0];
  const sBox = new M.RoundedRectangle({ width: P ? 2.4 : 2.0, height: P ? 0.65 : 0.8, cornerRadius: 0.14, color: C.violet, strokeWidth: 2 });
  sBox.setFill(C.card, 0.95); sBox.moveTo(SB);
  const sText = label('SEARCH', 17, C.violet, SB, true, true);
  const AB = P ? [3.0, -4.25, 0] : [3.9, 0.7, 0];
  const bB = bot(AB, P ? 0.5 : 0.55);
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(bigCard, bigLab, ...names, qText, dBar, ...pBars, aBar, ...libs, ...cross)),
    new M.FadeIn(gb.box), new M.FadeIn(gb.title), ...gb.lines.map(x => new M.FadeIn(x)), new M.FadeIn(sBox), new M.FadeIn(sText),
    ...bB.map(x => new M.FadeIn(x)), ...say('FIRST, A SEARCH THROUGH THE GUIDE', C.violet));
  await play(new M.LaggedStart(gb.lines.map(x => new M.Indicate(x, { color: C.violet })), { lagRatio: 0.15, runTime: 1.4 }));

  const rText = label('RETRIEVER', 17, C.violet, SB, true, true);
  await until(S(7)); await play(new M.FadeOut(sText), new M.FadeIn(rText), new M.Indicate(sBox, { color: C.violet }), ...say('RETRIEVER: FETCHES PASSAGES', C.violet));

  const RKY = p => (P ? 1.0 : 1.1) - (p - 1) * 0.4, RNX = P ? 0.5 : -0.6, RSX = P ? 1.95 : 0.6, RSW = P ? 1.8 : 1.6;
  const PLACE = [4, 1, 7, 5, 2, 8, 3, 6];   // where each guide passage lands in the ranking for card 9's question
  const nums = [1, 2, 3, 4, 5, 6, 7, 8].map(p => label(String(p), 17, C.muted, [RNX, RKY(p), 0], true, true));
  const ranked = []; PLACE.forEach((p, i) => { ranked[p] = gb.lines[i]; });
  await until(S(8));
  await play(new M.LaggedStart(nums.map(n => new M.FadeIn(n)), { lagRatio: 0.08, runTime: 0.8 }), ...say('RANKING: BEST MATCH FIRST'));
  await play(new M.LaggedStart(gb.lines.map((b, i) => new M.Transform(b, bar([RSX, RKY(PLACE[i]), 0], RSW))), { lagRatio: 0.2, runTime: 2.6 }));

  const bx = P ? 3.05 : 1.6;
  const brace = new M.Line({ start: [bx, RKY(1) + 0.15, 0], end: [bx, RKY(3) - 0.15, 0], color: BLUE, strokeWidth: 4 });
  const readA = P ? arrow([3.35, RKY(2), 0], [3.35, -3.68, 0], BLUE) : arrow([1.75, RKY(2), 0], [3.3, RKY(2), 0], BLUE);
  await until(S(9));
  ranked.slice(4).forEach(b => { b.setColor(C.muted); b.setFill(C.muted, 0.3); });
  await play(new M.Create(brace), new M.Create(readA), ...say('IT READS ONLY THE TOP 3', BLUE));

  const AN = P ? [0.9, -4.25, 0] : [3.9, -1.3, 0];
  const ansBox = card(AN, 2.0, 0.6, C.green), ansT = label('ANSWER', 16, C.green, AN, true, true);
  const ansA = P ? arrow([2.45, -4.25, 0], [1.95, -4.25, 0], C.green) : arrow([3.9, -0.42, 0], [3.9, -0.97, 0], C.green);
  await until(S(10)); await play(new M.Create(ansA), new M.FadeIn(ansBox), new M.FadeIn(ansT), ...say('IT WRITES ITS ANSWER FROM THOSE 3', C.green));

  await until(S(11));
  ranked[5].setColor(C.amber); ranked[5].setFill(C.amber, 0.9);
  await play(new M.Indicate(ranked[5], { color: C.amber }), new M.Indicate(nums[4], { color: C.amber }), ...say('WHERE DID THE SOURCE PASSAGE LAND?', C.amber));

  // 12-15 ten cards, each with the place of its source passage
  const CX = P ? 0.35 : -2.0, SP = P ? 0.66 : 0.82, HY = P ? 1.4 : 1.1;
  const col = k => CX + (k - 4.5) * SP;
  const RY = p => P ? 0.6 - (p - 1) * 0.55 : 0.45 - (p - 1) * 0.48;
  const cutY = p => RY(p) - (P ? 0.275 : 0.24);
  const RLX = col(0) - (P ? 0.7 : 0.75), MY = P ? -2.6 : -2.3;
  const cutLine = p => new M.Line({ start: [col(0) - SP / 2, cutY(p), 0], end: [col(9) + SP / 2, cutY(p), 0], color: C.violet, strokeWidth: 4 });
  const heads = RANK.map((_, k) => card([col(k), HY, 0], P ? 0.62 : 0.66, 0.78));
  const qlabs = RANK.map((_, k) => label('Q' + (k + 1), P ? 15 : 15, C.ink, [col(k), HY + 0.19, 0]));
  const placeT = RANK.map((r, k) => label(String(r), P ? 18 : 18, k === 8 ? C.amber : C.cyan, [col(k), HY - 0.16, 0], true, true));
  const marks = RANK.map((r, k) => bar([col(k), RY(r), 0], P ? 0.48 : 0.56, 0.26, k === 8 ? C.amber : C.cyan, 0.85));
  const rowHead = label('place', P ? 15 : 16, C.ink, [RLX, HY, 0], false);
  const rowLab = [1, 2, 3, 4, 5, 6, 7].map(p => label(p === 7 ? '…' : String(p), P ? 17 : 17, C.ink, [RLX, RY(p), 0], true, true));
  const idx = f => RANK.map((_, k) => k).filter(k => f(RANK[k]));
  const shade = k => marks.forEach((m, j) => m.setFill(j === 8 ? C.amber : C.cyan, RANK[j] <= k ? 0.85 : 0.25));
  const reveal = ks => new M.LaggedStart(ks.flatMap(k => [new M.FadeIn(placeT[k]), new M.FadeIn(marks[k], { shift: [0, -0.2, 0] })]), { lagRatio: 0.12, runTime: 1.6 });
  const stage = [gb.box, gb.title, ...gb.lines, sBox, rText, ...nums, ...bB, brace, readA, ansA, ansBox, ansT];
  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(...stage)), ...say('10 CARDS: WRITE THE PLACE ON EACH'));
  await play(new M.LaggedStart(heads.flatMap((c, k) => [new M.FadeIn(c), new M.FadeIn(qlabs[k])]), { lagRatio: 0.06, runTime: 1.4 }),
    new M.LaggedStart([rowHead, ...rowLab.slice(0, 5)].map(x => new M.FadeIn(x)), { lagRatio: 0.15, runTime: 1.2 }));

  await until(S(13)); await play(reveal(idx(r => r === 1)), ...say('6 CARDS: PLACE 1'));
  await until(S(14)); await play(reveal(idx(r => r === 2 || r === 3)), ...say('3 MORE: PLACE 2 OR 3'));
  await until(S(15)); await play(reveal([8]), new M.Flash(marks[8], { color: C.amber }), ...say('CARD 9: PLACE 5', C.amber));

  // 16-20 the cut line under the top 3
  const cut = cutLine(3);
  await until(S(16)); await play(new M.Create(cut), ...say('CUT LINE UNDER THE TOP 3', C.violet));
  await until(S(17));
  shade(3);
  await play(new M.LaggedStart(idx(r => r <= 3).map(k => new M.Indicate(marks[k], { color: C.green })), { lagRatio: 0.1, runTime: 1.6 }), ...say('ABOVE: READ.  BELOW: NEVER SEEN', C.green));
  await until(S(18)); await play(new M.Indicate(marks[8], { color: C.pink }), new M.Flash(marks[8], { color: C.pink }), ...say('CARD 9: PLACE 5, BELOW THE LINE', C.pink));
  await until(S(19)); await play(new M.Indicate(placeT[8], { color: C.pink }), ...say('NEVER READ: HOW TO BOOK ROOM R12', C.pink));
  await until(S(20)); await play(new M.Indicate(heads[8], { color: C.pink }), ...say('THE MISTAKE BEGAN IN THE SEARCH', C.pink));

  // 21-28 move the cut line: 1, 3, 5
  await until(S(21)); await play(...fbox(['cards: 10', 'cut line under place 3']), ...say('ALL 10 CARDS: MOVE THE LINE', C.violet));
  await until(S(22));
  shade(1);
  await play(new M.Transform(cut, cutLine(1)), ...fbox(['cut under place 1', 'above it: ? of 10']), ...say('LINE UNDER PLACE 1', C.violet));
  await until(S(23));
  await play(new M.LaggedStart(idx(r => r === 1).map(k => new M.Indicate(marks[k], { color: C.green })), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox(['cut under place 1', ['above it: 6 of 10', C.amber]]));
  await until(S(24)); await play(...fbox(['6 of 10', '= 60 of 100', ['= 60 %', C.amber]]), ...say('PERCENT = OUT OF EVERY 100', C.amber));
  await until(S(25));
  shade(3);
  await play(new M.Transform(cut, cutLine(3)), ...fbox(['cut under place 3', 'above it: ? of 10']), ...say('LINE UNDER PLACE 3', C.violet));
  await until(S(26));
  await play(new M.LaggedStart(idx(r => r === 2 || r === 3).map(k => new M.Indicate(marks[k], { color: C.green })), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox(['6 + 3 = 9 of 10', ['= 90 %', C.amber]]));
  await until(S(27));
  shade(5);
  await play(new M.Transform(cut, cutLine(5)), ...fbox(['cut under place 5', 'above it: ? of 10']), ...say('LINE UNDER PLACE 5', C.violet));
  await until(S(28)); await play(new M.Indicate(marks[8], { color: C.green }), new M.Flash(marks[8], { color: C.green }), ...fbox(['9 + 1 = 10 of 10', ['= 100 %', C.amber]]));

  // 29-32 the name: recall at k
  await until(S(29)); await play(new M.LaggedStart(marks.map(m => new M.Indicate(m, { color: C.green })), { lagRatio: 0.08, runTime: 1.4 }), ...say('RECALL = SHARE OF CARDS ABOVE THE LINE', C.green));
  await until(S(30)); await play(...say('RECALL: HOW MUCH WE NEEDED WAS FETCHED', C.green));
  await until(S(31));
  await play(new M.LaggedStart([0, 2, 4].map(p => new M.Indicate(rowLab[p], { color: C.violet })), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['k = places above the line', ['k = 1, 3 or 5', C.violet]], C.violet), ...say('k = PLACES ABOVE THE LINE', C.violet));
  await until(S(32)); await play(...fbox([['recall at 1 = 60 %', C.ink], ['recall at 3 = 90 %', C.ink], ['recall at 5 = 100 %', C.amber]]), ...say('RECALL AT k', C.green));

  // 33-35 the rule
  await until(S(33)); await play(...say('THE RULE IN ONE LINE'));
  await until(S(34)); await play(...fbox(['recall at k =', '  cards with source in top k', ['  ÷ number of cards', C.amber]]));
  await until(S(35));
  shade(3);
  await play(new M.Transform(cut, cutLine(3)), ...fbox(['recall at 3 = 9 ÷ 10', ['            = 90 %', C.amber]]), ...say('FOR k = 3', C.violet));

  // 36-38 what it is for
  await until(S(36)); await play(...say('IT CHECKS THE SEARCH, BEFORE ANY WRITING', C.green));
  await until(S(37)); await play(new M.LaggedStart(rowLab.slice(0, 3).map(x => new M.Indicate(x, { color: BLUE })), { lagRatio: 0.2, runTime: 1.2 }), ...say('READS 3 → RECALL AT 3 MATTERS HERE', BLUE));
  await until(S(38)); await play(new M.Indicate(marks[8], { color: C.pink }), ...say('BELOW THE LINE? FIX THE RETRIEVER FIRST', C.pink));

  // 39-41 good recall is not the whole story
  await until(S(39)); await play(...fbox(['recall at 3 = 90 %']), ...say('GOOD RECALL IS NOT THE WHOLE STORY', C.violet));
  const ticks = RIGHT.map((r, k) => label(r ? '✓' : '✗', P ? 18 : 20, r ? C.green : C.pink, [col(k), MY, 0], false, true));
  const tickHead = label('answer', P ? 12 : 14, C.muted, [RLX, MY, 0], false);
  await until(S(40));
  await play(new M.FadeIn(tickHead), new M.LaggedStart(ticks.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox(['recall at 3 = 90 %', ['right answers = 7 of 10', C.amber]]), ...say('ONLY 7 OF 10 ANSWERS RIGHT', C.amber));
  await until(S(41));
  await play(new M.LaggedStart([0, 4].flatMap(k => [new M.Indicate(marks[k], { color: C.pink }), new M.Indicate(ticks[k], { color: C.pink })]), { lagRatio: 0.2, runTime: 1.6 }),
    ...say('Q1, Q5: FETCHED, YET WRONG LATER', C.pink));

  // 42-46 the trap: the line at the very bottom
  await until(S(42));
  await play(new M.FadeOut(new M.VGroup(...ticks, tickHead)), new M.FadeIn(rowLab[5]), new M.FadeIn(rowLab[6]), ...say('TRAP: LINE AT THE VERY BOTTOM', C.pink));
  shade(99);
  await play(new M.Transform(cut, cutLine(7)));
  await until(S(43)); await play(...fbox(['line at the very bottom', ['recall = 100 %', C.pink]], C.pink), ...say('RECALL = 100 %, EVERY TIME', C.pink));
  const pile = Array.from({ length: P ? 8 : 14 }, (_, i) => bar(P ? [0.9, -5.25 + i * 0.16, 0] : [4.6, -2.3 + i * 0.16, 0], P ? 2.8 : 2.2, 0.12, C.muted, 0.6));
  const pileLab = P ? label('the whole guide', 14, C.muted, [-2.0, -4.7, 0], false) : label('the whole guide', 15, C.muted, [4.6, 0.14, 0], false);
  await until(S(44));
  await play(...clearBox(), new M.LaggedStart(pile.map(b => new M.FadeIn(b, { shift: [0, -0.15, 0] })), { lagRatio: 0.12, runTime: 1.8 }), new M.FadeIn(pileLab),
    ...say('A PILE AS BIG AS THE WHOLE GUIDE', C.pink));
  await until(S(45)); await play(new M.LaggedStart(pile.map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.08, runTime: 1.4 }), ...say('NOT A GOOD SEARCH: NO SEARCH AT ALL', C.pink));
  await until(S(46));
  shade(3);
  await play(new M.FadeOut(new M.VGroup(...pile, pileLab, rowLab[5], rowLab[6])), new M.Transform(cut, cutLine(3)),
    ...fbox([['recall = 90 %  (which k?)', C.pink], ['recall at 3 = 90 %', C.green]]), ...say('NO k: THE NUMBER MEANS NOTHING', C.pink));

  // 47 in one sentence
  await until(S(47)); await play(...fbox(['recall at k =', '  share of questions whose', ['  source is in the top k', C.amber]]), ...say('ALWAYS SAY WHICH k', C.green));
}

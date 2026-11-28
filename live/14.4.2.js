// 14.4.2 Lift: is the connection stronger than chance?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Exact shared bookshop data (chapters/14.4.md)
  const BASKETS = [
    ['Trail', 'River'],
    ['Trail', 'River', 'Clues'],
    ['Trail', 'River'],
    ['Trail', 'Clues'],
    ['River', 'Castle'],
    ['Clues', 'Castle'],
    ['Clues'],
    ['Castle'],
  ];
  const BCOL = { Trail: C.green, River: C.cyan, Clues: C.amber, Castle: C.violet };

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.2;
  // Phone: pill at the top, formula box below the picture (whole height used)
  const PILL = P ? [0, 3.75, 0] : [CX, 2.02, 0];
  const BOXP = P ? [0, -4.95, 0] : [4.55, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function fitText(text, size, color, maxW, mono = false, bold = false) {
    const t = T(text, size, color, mono, bold);
    if (t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    return t;
  }

  // Formula box: one box at a time, at most 3 lines so phone stays within y <= 4.3
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.39 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }

  function bookCard(name, pos, w, h, opts = {}) {
    const col = opts.color || BCOL[name] || C.cyan;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: Math.min(0.11, h * 0.32), color: col, strokeWidth: opts.strokeWidth ?? 2 });
    r.setFill(col, opts.fillOpacity ?? 0.18);
    r.moveTo(pos);
    const t = fitText(opts.label || name, opts.fontSize || 16, col, w - 0.14, false, true);
    t.moveTo(pos);
    return new M.VGroup(r, t);
  }

  function basketShell(label, pos, w, h, opts = {}) {
    const col = opts.color || C.line;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color: col, strokeWidth: opts.strokeWidth ?? 2 });
    r.setFill(C.card, opts.fillOpacity ?? 0.94);
    r.moveTo(pos);
    const hr = opts.handleR ?? (P ? 0.14 : 0.16);
    const handle = new M.Arc({ radius: hr, startAngle: 0, angle: Math.PI, color: opts.handleColor || C.muted, strokeWidth: 2 });
    handle.moveTo([pos[0], pos[1] + h / 2 + hr * 0.48, 0]);
    const num = fitText(label, opts.fontSize || 15, opts.labelColor || C.muted, w - 0.2, true, true);
    num.moveTo([pos[0], pos[1] + h / 2 - 0.2, 0]);
    return new M.VGroup(handle, r, num);
  }

  function frameRect(pos, w, h, color, strokeWidth = 3) {
    const r = new M.RoundedRectangle({ width: w + 0.08, height: h + 0.08, cornerRadius: 0.16, color, strokeWidth });
    r.setFill(color, 0.06);
    r.moveTo([pos[0], pos[1], 0.02]);
    return r;
  }

  function makeArrow(a, b, color, strokeWidth = 3) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const hl = 0.2, hw = 0.11;
    const tip = [b[0], b[1], 0];
    const w1 = [b[0] - ux * hl + px * hw, b[1] - uy * hl + py * hw, 0];
    const w2 = [b[0] - ux * hl - px * hw, b[1] - uy * hl - py * hw, 0];
    return new M.VGroup(
      new M.Line({ start: [a[0], a[1], 0], end: tip, color, strokeWidth }),
      new M.Line({ start: w1, end: tip, color, strokeWidth }),
      new M.Line({ start: w2, end: tip, color, strokeWidth })
    );
  }

  // --- 0-1: The small bookshop and the question (Trail -> River?) -----------
  const introW = P ? 3.1 : 2.35, introH = P ? 1.45 : 0.92;
  const introPos = P
    ? [[-1.85, 1.35, 0], [1.85, 1.35, 0], [-1.85, -0.75, 0], [1.85, -0.75, 0]]
    : [[CX - 1.85, 0.35, 0], [CX + 1.85, 0.35, 0], [CX - 1.85, -1.15, 0], [CX + 1.85, -1.15, 0]];
  const introNames = ['Trail', 'River', 'Clues', 'Castle'];
  const introCards = introNames.map((n, k) => bookCard(n, introPos[k], introW, introH, { fontSize: 22, fillOpacity: 0.22 }));
  const shelfY = P ? -1.85 : -1.85;
  const introShelf = new M.Line({ start: [CX - (P ? 3.2 : 3.4), shelfY, 0], end: [CX + (P ? 3.2 : 3.4), shelfY, 0], color: C.muted, strokeWidth: 2 });

  await until(S(0));
  await play(
    new M.LaggedStart(introCards.map(c => new M.FadeIn(c, { runTime: 0.5 })), { lagRatio: 0.12, runTime: 1.0 }),
    new M.Create(introShelf, { runTime: 0.7 }),
    ...fbox([['A small bookshop', C.cyan], 'Which books do readers', 'buy together?']),
    ...say('THE SMALL BOOKSHOP')
  );

  const arrowY = introPos[0][1];
  const introArrow = makeArrow([introPos[0][0] + introW / 2 + 0.15, arrowY, 0], [introPos[1][0] - introW / 2 - 0.15, arrowY, 0], C.amber, 4);
  const introQ = pill('SUGGEST?', C.amber, 16);
  introQ.moveTo([CX, arrowY + 0.52, 0]);

  await until(S(1));
  await play(
    new M.Create(introArrow, { runTime: 0.65 }),
    new M.FadeIn(introQ, { runTime: 0.55 }),
    new M.Indicate(introCards[0], { color: C.green, runTime: 0.8 }),
    new M.Indicate(introCards[1], { color: C.cyan, runTime: 0.8 }),
    ...say('BUYS TRAIL: SUGGEST RIVER?', C.amber)
  );

  // --- 2-9: Eight shopping baskets and confidence recap ---------------------
  const BW = P ? 3.32 : 1.92, BH = P ? 1.5 : 1.80;
  const bPos = k => P
    ? [(k % 2 === 0 ? -1.82 : 1.82), 2.45 - Math.floor(k / 2) * 1.85, 0]
    : [CX + ((k % 4) - 1.5) * 2.10, (k < 4 ? 0.52 : -1.64), 0];
  const slotW = P ? 0.96 : 1.58, slotH = P ? 0.42 : 0.34;
  const bSlot = (k, s) => {
    const [bx, by] = bPos(k);
    return P
      ? [bx + (s - 1) * 1.06, by - 0.14, 0]
      : [bx, by + 0.24 - s * 0.42, 0];
  };

  const baskets = BASKETS.map((books, k) => {
    const pos = bPos(k);
    const shell = basketShell(`Basket ${k + 1}`, pos, BW, BH, { fontSize: P ? 15 : 14 });
    const cards = {};
    books.forEach((name, s) => {
      cards[name] = bookCard(name, bSlot(k, s), slotW, slotH, { fontSize: P ? 15 : 15 });
    });
    return { k, pos, shell, cards, parts: [shell, ...Object.values(cards)] };
  });

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...introCards, introShelf, introArrow, introQ), { runTime: 0.45 }),
    new M.LaggedStart(baskets.map(b => new M.LaggedStart(b.parts.map(p => new M.FadeIn(p, { runTime: 0.45 })), { lagRatio: 0.05 })), { lagRatio: 0.07, runTime: 1.4 }),
    ...say('8 SHOPPING BASKETS')
  );

  await until(S(3));
  await play(
    new M.LaggedStart([baskets[0].shell, baskets[1].shell].map(sh => new M.Indicate(sh, { color: C.cyan, runTime: 0.7 })), { lagRatio: 0.25, runTime: 1.1 }),
    ...say('BOOKS BOUGHT TOGETHER', C.muted)
  );

  await until(S(4));
  await play(
    new M.LaggedStart([0, 1, 2, 3].map(k => new M.Indicate(baskets[k].cards.Trail, { color: C.green, runTime: 0.7 })), { lagRatio: 0.12, runTime: 1.1 }),
    ...say('FIND BASKETS WITH TRAIL', C.green)
  );

  const trailHL = [0, 1, 2, 3].map(k => frameRect(baskets[k].pos, BW, BH, C.green, 3));
  await until(S(5));
  await play(
    new M.LaggedStart(trailHL.map(r => new M.Create(r, { runTime: 0.45 })), { lagRatio: 0.14, runTime: 1.1 }),
    ...fbox([['Baskets with Trail', C.green], ['  = 4 (baskets 1-4)', C.ink]], C.green),
    ...say('BASKETS 1, 2, 3, 4 HAVE TRAIL', C.green)
  );

  const riverInTrailHL = [0, 1, 2].map(k => frameRect(bSlot(k, 1), slotW, slotH, C.cyan, 3));
  await until(S(6));
  await play(
    new M.LaggedStart(riverInTrailHL.map(r => new M.Create(r, { runTime: 0.45 })), { lagRatio: 0.18, runTime: 1.0 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(baskets[k].cards.River, { color: C.cyan, runTime: 0.6 })), { lagRatio: 0.15, runTime: 1.0 }),
    ...fbox(['With Trail:        4', ['Also with River:   3', C.cyan]], C.cyan),
    ...say('3 OF 4 ALSO HAVE RIVER', C.cyan)
  );

  await until(S(7));
  await play(
    ...fbox(['With Trail:        4', 'Also with River:   3', ['3 of 4 = 75%', C.amber]], C.amber),
    ...say('75% OF TRAIL BASKETS HAVE RIVER', C.amber)
  );

  await until(S(8));
  await play(
    ...fbox([['Rule: Trail -> River', C.green], ['Confidence = 3 of 4', C.ink], ['           = 75%', C.amber]], C.amber),
    ...say('CONFIDENCE = 75%', C.amber)
  );

  await until(S(9));
  await play(
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(baskets[k].cards.River, { color: C.amber, runTime: 0.7 })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('75% SOUNDS STRONG...', C.amber)
  );

  // --- 10-16: The trap — what if River is already popular? ------------------
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(...trailHL, ...riverInTrailHL), { runTime: 0.45 }),
    ...say('WHAT IF RIVER IS ALREADY POPULAR?', C.pink)
  );

  const missingIdx = [3, 5, 6, 7];
  const extraRivers = missingIdx.map(k => bookCard('River', bSlot(k, BASKETS[k].length), slotW, slotH, { color: C.pink, fillOpacity: 0.25, fontSize: P ? 15 : 15 }));
  await until(S(11));
  await play(
    new M.LaggedStart(extraRivers.map(c => new M.FadeIn(c, { runTime: 0.5 })), { lagRatio: 0.14, runTime: 1.0 }),
    ...fbox([['Imagine:', C.pink], 'Every basket (8 of 8)', 'contains River'], C.pink),
    ...say('IMAGINE: RIVER IN ALL 8 BASKETS', C.pink)
  );

  const hypTrailHL = [0, 1, 2, 3].map(k => frameRect(baskets[k].pos, BW, BH, C.cyan, 3));
  await until(S(12));
  await play(
    new M.LaggedStart(hypTrailHL.map(r => new M.Create(r, { runTime: 0.45 })), { lagRatio: 0.12, runTime: 1.0 }),
    ...say('ALL 4 TRAIL BASKETS HAVE RIVER', C.cyan)
  );

  await until(S(13));
  await play(
    ...fbox([['If River in all 8:', C.pink], 'Confidence = 4 of 4', ['           = 100%', C.pink]], C.pink),
    ...say('CONFIDENCE = 100%', C.pink)
  );

  const hypNoTrailHL = [4, 5, 6, 7].map(k => frameRect(baskets[k].pos, BW, BH, C.pink, 3));
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...hypTrailHL), { runTime: 0.4 }),
    new M.LaggedStart(hypNoTrailHL.map(r => new M.Create(r, { runTime: 0.45 })), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['With Trail:    4 of 4', ['Without Trail: 4 of 4', C.pink], ['No difference!', C.pink]], C.pink),
    ...say('WITHOUT TRAIL: ALSO 4 OF 4', C.pink)
  );

  await until(S(15));
  await play(
    ...fbox([['High confidence alone', C.pink], 'does not show a', 'special connection'], C.pink),
    ...say('HIGH CONFIDENCE ALONE CAN MISLEAD', C.pink)
  );

  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(...hypNoTrailHL), { runTime: 0.45 }),
    ...say('WE NEED SOMETHING TO COMPARE WITH', C.violet)
  );

  // --- 17-25: Usual share of River & independence ---------------------------
  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(...extraRivers), { runTime: 0.5 }),
    ...fbox(['8 real baskets', 'Check River overall']),
    ...say('BACK TO THE 8 REAL BASKETS', C.cyan)
  );

  const allBoxW = P ? 7.2 : 8.46, allBoxH = P ? 7.45 : 4.22;
  const allBoxCenter = P ? [0, -0.35, 0] : [CX, -0.54, 0];
  const allBox = new M.RoundedRectangle({ width: allBoxW, height: allBoxH, cornerRadius: 0.2, color: C.muted, strokeWidth: 2 });
  allBox.setFill(C.cyan, 0.03);
  allBox.moveTo([allBoxCenter[0], allBoxCenter[1], -0.01]);

  await until(S(18));
  await play(
    new M.Create(allBox, { runTime: 0.7 }),
    ...say('CHECK RIVER IN ALL 8 BASKETS', C.cyan)
  );

  const riverIdx = [0, 1, 2, 4];
  const allRiverHL = riverIdx.map(k => frameRect(baskets[k].pos, BW, BH, C.cyan, 3));
  await until(S(19));
  await play(
    new M.LaggedStart(allRiverHL.map(r => new M.Create(r, { runTime: 0.45 })), { lagRatio: 0.14, runTime: 1.1 }),
    new M.LaggedStart(riverIdx.map(k => new M.Indicate(baskets[k].cards.River, { color: C.cyan, runTime: 0.6 })), { lagRatio: 0.14, runTime: 1.1 }),
    ...say('RIVER IN BASKETS 1, 2, 3, 5', C.cyan)
  );

  await until(S(20));
  await play(
    ...fbox(['All baskets:  8', ['With River:   4', C.cyan]], C.cyan),
    ...say('4 OUT OF 8 BASKETS', C.cyan)
  );

  await until(S(21));
  await play(
    ...fbox(['River overall: 4 of 8', ['             = half', C.cyan]], C.cyan),
    ...say('HALF OF ALL BASKETS HAVE RIVER', C.cyan)
  );

  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(allBox, ...allRiverHL), { runTime: 0.5 }),
    ...say('WHAT IF TRAIL MAKES NO DIFFERENCE?', C.violet)
  );

  const indepTrailHL = [0, 1, 2, 3].map(k => frameRect(baskets[k].pos, BW, BH, C.violet, 3));
  await until(S(23));
  await play(
    new M.LaggedStart(indepTrailHL.map(r => new M.Create(r, { runTime: 0.45 })), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['If no difference:', ['expect River in half', C.violet], ['of Trail baskets', C.violet]], C.violet),
    ...say('EXPECT RIVER IN HALF OF TRAIL BASKETS', C.violet)
  );

  await until(S(24));
  await play(
    ...say('THIS IDEA IS INDEPENDENCE', C.violet)
  );

  await until(S(25));
  await play(
    ...fbox([['Independence:', C.violet], 'One purchase does not', 'change the other'], C.violet),
    ...say('NO CHANGE IN CHANCE = INDEPENDENCE', C.violet)
  );

  // --- 26-27: Clear stage and introduce Lift --------------------------------
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(...baskets.flatMap(b => b.parts), ...indepTrailHL), { runTime: 0.55 }),
    ...say('COMPARE EXPECTED vs OBSERVED', C.amber)
  );

  await until(S(27));
  await play(
    ...fbox([['Lift:', C.amber], 'Compare what we see', 'with what we expect'], C.amber),
    ...say('THIS COMPARISON IS CALLED LIFT', C.amber)
  );

  // --- 28-41: Expected (2) vs Observed (3) and the Lift formula -------------
  const EW = P ? 1.66 : 1.76, EH = P ? 1.6 : 1.38;
  const expPos = k => P
    ? [-2.73 + k * 1.82, 0.6, 0]
    : [CX - 2.15 + ((k % 2) === 0 ? -0.97 : 0.97), (k < 2 ? 0.26 : -1.34), 0];
  const obsPos = k => P
    ? [-2.73 + k * 1.82, -2.45, 0]
    : [CX + 2.15 + ((k % 2) === 0 ? -0.97 : 0.97), (k < 2 ? 0.26 : -1.34), 0];

  const expCenter = P ? [0, 1.95, 0] : [CX - 2.15, 1.38, 0];
  const obsCenter = P ? [0, -1.2, 0] : [CX + 2.15, 1.38, 0];
  const expHeader = fitText('EXPECTED (independence)', 17, C.violet, P ? 6.8 : 4.0, true, true);
  expHeader.moveTo(expCenter);
  const obsHeader = fitText('OBSERVED (real baskets)', 17, C.cyan, P ? 6.8 : 4.0, true, true);
  obsHeader.moveTo(obsCenter);

  const expShells = [0, 1, 2, 3].map(k => basketShell(`Trail #${k + 1}`, expPos(k), EW, EH, { color: C.violet, labelColor: C.green, fontSize: P ? 15 : 13, handleR: 0.12 }));
  const expSlotW = EW - 0.34, expSlotH = 0.40;
  const expSlotPos = k => [expPos(k)[0], expPos(k)[1] - 0.14, 0];
  const expSlots = [0, 1, 2, 3].map(k => {
    const r = new M.RoundedRectangle({ width: expSlotW, height: expSlotH, cornerRadius: 0.1, color: C.muted, strokeWidth: 1.5 });
    r.setFill(C.bg, 0.5);
    r.moveTo(expSlotPos(k));
    return r;
  });

  await until(S(28));
  await play(
    new M.FadeIn(expHeader, { runTime: 0.5 }),
    new M.LaggedStart(expShells.map(sh => new M.FadeIn(sh, { runTime: 0.45 })), { lagRatio: 0.12, runTime: 0.9 }),
    new M.LaggedStart(expSlots.map(sl => new M.Create(sl, { runTime: 0.4 })), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('4 EMPTY TRAIL BASKETS', C.violet)
  );

  await until(S(29));
  await play(
    ...fbox(['Trail baskets = 4', ['Expect half with River', C.violet]], C.violet),
    ...say('EXPECT HALF OF THESE 4', C.violet)
  );

  await until(S(30));
  await play(
    ...fbox(['Trail baskets = 4', ['Half of 4 = 2', C.violet]], C.violet),
    ...say('HALF OF 4 IS 2', C.violet)
  );

  const expRivers = [0, 1].map(k => bookCard('River', expSlotPos(k), expSlotW, expSlotH, { color: C.violet, fillOpacity: 0.28, fontSize: 16 }));
  const expRiverHL = [0, 1].map(k => frameRect(expPos(k), EW, EH, C.violet, 3));
  await until(S(31));
  await play(
    new M.LaggedStart(expRivers.map(c => new M.FadeIn(c, { runTime: 0.5 })), { lagRatio: 0.25, runTime: 0.9 }),
    new M.LaggedStart(expRiverHL.map(r => new M.Create(r, { runTime: 0.45 })), { lagRatio: 0.25, runTime: 0.9 }),
    ...say('PLACE RIVER IN 2 BASKETS', C.violet)
  );

  const expBadge = pill('EXPECTED = 2', C.violet, 17);
  expBadge.moveTo(P ? [0, -0.55, 0] : [CX - 2.15, -2.42, 0]);
  await until(S(32));
  await play(
    new M.FadeIn(expBadge, { runTime: 0.55 }),
    ...fbox([['Expected count = 2', C.violet], '(under independence)'], C.violet),
    ...say('EXPECTED COUNT = 2', C.violet)
  );

  const compDiv = P
    ? new M.Line({ start: [-3.5, -0.85, 0], end: [3.5, -0.85, 0], color: C.line, strokeWidth: 2 })
    : new M.Line({ start: [CX, 1.5, 0], end: [CX, -2.6, 0], color: C.line, strokeWidth: 2 });

  const obsBaskets = [0, 1, 2, 3].map(k => {
    const pos = obsPos(k);
    const shell = basketShell(`Real #${k + 1}`, pos, EW, EH, { color: C.line, labelColor: C.muted, fontSize: P ? 15 : 13, handleR: 0.12 });
    const cards = {};
    BASKETS[k].forEach((name, s) => {
      const cy = P ? pos[1] + 0.24 - s * 0.38 : pos[1] + 0.18 - s * 0.31;
      cards[name] = bookCard(name, [pos[0], cy, 0], EW - 0.3, P ? 0.34 : 0.26, { fontSize: P ? 15 : 13 });
    });
    return { k, pos, shell, cards, parts: [shell, ...Object.values(cards)] };
  });

  await until(S(33));
  await play(
    new M.Create(compDiv, { runTime: 0.5 }),
    new M.FadeIn(obsHeader, { runTime: 0.5 }),
    new M.LaggedStart(obsBaskets.map(b => new M.LaggedStart(b.parts.map(p => new M.FadeIn(p, { runTime: 0.45 })), { lagRatio: 0.05 })), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('THE 4 REAL TRAIL BASKETS', C.cyan)
  );

  const obsRiverHL = [0, 1, 2].map(k => frameRect(obsPos(k), EW, EH, C.cyan, 3));
  await until(S(34));
  await play(
    new M.LaggedStart(obsRiverHL.map(r => new M.Create(r, { runTime: 0.45 })), { lagRatio: 0.18, runTime: 1.0 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(obsBaskets[k].cards.River, { color: C.cyan, runTime: 0.65 })), { lagRatio: 0.16, runTime: 1.0 }),
    ...say('IN REAL BASKETS: RIVER APPEARS 3 TIMES', C.cyan)
  );

  const obsBadge = pill('OBSERVED = 3', C.cyan, 17);
  obsBadge.moveTo(P ? [0, -3.7, 0] : [CX + 2.15, -2.42, 0]);
  await until(S(35));
  await play(
    new M.FadeIn(obsBadge, { runTime: 0.55 }),
    ...fbox([['Expected = 2', C.violet], ['Observed = 3', C.cyan]], C.cyan),
    ...say('OBSERVED COUNT = 3', C.cyan)
  );

  await until(S(36));
  await play(
    new M.Indicate(expBadge, { color: C.violet, runTime: 0.8 }),
    new M.Indicate(obsBadge, { color: C.cyan, runTime: 0.8 }),
    ...say('EXPECT 2   vs   OBSERVE 3', C.amber)
  );

  await until(S(37));
  await play(
    ...fbox([['Expected = 2', C.violet], ['Observed = 3', C.cyan], ['How many times 2 is 3?', C.amber]], C.amber),
    ...say('HOW MANY TIMES THE EXPECTED COUNT?', C.amber)
  );

  await until(S(38));
  await play(
    ...say('THE LIFT FORMULA', C.amber)
  );

  await until(S(39));
  await play(
    ...fbox([['lift = observed ÷ expected', C.ink]], C.amber),
    ...say('LIFT = OBSERVED ÷ EXPECTED', C.amber)
  );

  await until(S(40));
  await play(
    ...fbox([['lift = observed ÷ expected', C.ink], ['     = 3 ÷ 2', C.muted], ['     = 1.5', C.amber]], C.amber),
    ...say('3 ÷ 2 = 1.5', C.amber)
  );

  await until(S(41));
  await play(
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(obsBaskets[k].cards.River, { color: C.amber, runTime: 0.65 })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('1.5 TIMES AS COMMON WITH TRAIL', C.green)
  );

  // --- 42-47: Interpreting Lift on a scale (= 1, above 1, below 1) ----------
  const SX0 = P ? -3.15 : -5.9, SX1 = P ? 3.15 : 1.5, SY = P ? 0.4 : -0.35;
  const v2x = v => SX0 + (v / 2) * (SX1 - SX0);
  const scaleLine = new M.Line({ start: [SX0, SY, 0], end: [SX1, SY, 0], color: C.muted, strokeWidth: 3 });
  const scaleTicks = [0, 0.5, 1, 1.5, 2].map(v => new M.VGroup(
    new M.Line({ start: [v2x(v), SY - 0.1, 0], end: [v2x(v), SY + 0.1, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), 18, v === 1 ? C.violet : C.muted, true, v === 1).moveTo([v2x(v), SY - 0.36, 0])
  ));
  const oneLine = new M.DashedLine({ start: [v2x(1), SY, 0], end: [v2x(1), SY + 0.42, 0], color: C.violet });
  const oneDot = new M.Dot({ point: [v2x(1), SY, 0], radius: 0.13, color: C.violet });
  const oneLabSize = P ? 18 : 16;
  const oneLab = fitText('1 = as expected (independence)', oneLabSize, C.violet, P ? 6.4 : 6.2, false, true);
  oneLab.moveTo([v2x(1), SY - 0.92, 0]);

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(
      expHeader, ...expShells, ...expSlots, ...expRivers, ...expRiverHL, expBadge,
      compDiv, obsHeader, ...obsBaskets.flatMap(b => b.parts), ...obsRiverHL, obsBadge
    ), { runTime: 0.5 }),
    new M.Create(scaleLine, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...scaleTicks), { runTime: 0.55 }),
    new M.Create(oneLine, { runTime: 0.55 }),
    new M.FadeIn(oneDot, { runTime: 0.45 }),
    new M.FadeIn(oneLab, { runTime: 0.5 }),
    ...fbox([['Lift = 1', C.violet], 'Observed equals expected', '(independence)'], C.violet),
    ...say('LIFT = 1: AS EXPECTED', C.violet)
  );

  const aboveBar = makeArrow([v2x(1) + 0.08, SY + 0.22, 0], [v2x(2), SY + 0.22, 0], C.green, 5);
  // phone: the two meanings get their own full-width rows under the scale (readable size)
  const aboveLab = fitText('Above 1: more than expected', P ? 18 : 16, C.green, P ? 7.2 : (SX1 - v2x(1)) - 0.25, false, true);
  aboveLab.moveTo(P ? [0, SY - 2.1, 0] : [v2x(1) + 0.18 + aboveLab.getWidth() / 2, SY - 1.35, 0]);
  await until(S(43));
  await play(
    new M.Create(aboveBar, { runTime: 0.6 }),
    new M.FadeIn(aboveLab, { runTime: 0.55 }),
    ...fbox([['Lift above 1', C.green], 'More shared purchases', 'than expected'], C.green),
    ...say('LIFT ABOVE 1: MORE THAN EXPECTED', C.green)
  );

  const belowBar = makeArrow([v2x(1) - 0.08, SY + 0.22, 0], [v2x(0), SY + 0.22, 0], C.pink, 5);
  const belowLab = fitText('Below 1: fewer than expected', P ? 18 : 16, C.pink, P ? 7.2 : (v2x(1) - SX0) - 0.25, false, true);
  belowLab.moveTo(P ? [0, SY - 2.8, 0] : [v2x(1) - 0.18 - belowLab.getWidth() / 2, SY - 1.35, 0]);
  await until(S(44));
  await play(
    new M.Create(belowBar, { runTime: 0.6 }),
    new M.FadeIn(belowLab, { runTime: 0.55 }),
    ...fbox([['Lift below 1', C.pink], 'Fewer shared purchases', 'than expected'], C.pink),
    ...say('LIFT BELOW 1: FEWER THAN EXPECTED', C.pink)
  );

  const ourHalo = new M.Dot({ point: [v2x(1.5), SY, 0], radius: 0.28, color: C.amber });
  ourHalo.setFill(C.amber, 0.22);
  const ourDot = new M.Dot({ point: [v2x(1.5), SY, 0], radius: 0.14, color: C.amber });
  // short stem below the label row; the tag sits above the label (nothing crosses the words)
  const ourStem = new M.Line({ start: [v2x(1.5), SY + 0.3, 0], end: [v2x(1.5), SY + (P ? 0.75 : 0.44), 0], color: C.amber, strokeWidth: 2 });
  const ourTag = pill('Trail → River: 1.5', C.amber, 16);
  ourTag.moveTo([Math.min(v2x(1.5), SX1 - ourTag.getWidth() / 2), SY + (P ? 1.0 : 1.3), 0]);

  await until(S(45));
  await play(
    new M.FadeIn(ourHalo, { runTime: 0.45 }),
    new M.FadeIn(ourDot, { runTime: 0.45 }),
    new M.Flash(ourDot, { color: C.amber, runTime: 0.65 }),
    new M.Create(ourStem, { runTime: 0.45 }),
    new M.FadeIn(ourTag, { runTime: 0.55 }),
    ...fbox([['Trail → River', C.green], ['lift = 3 ÷ 2 = 1.5', C.amber], ['Above 1: stronger', C.green]], C.amber),
    ...say('OUR LIFT = 1.5 (ABOVE 1)', C.amber)
  );

  const shopBadge = pill('BOOKSHOP: SUGGEST RIVER WITH TRAIL', C.green, 15);
  shopBadge.moveTo([CX, SY - (P ? 3.7 : 2.0), 0]);
  await until(S(46));
  await play(
    new M.FadeIn(shopBadge, { runTime: 0.55 }),
    new M.Indicate(ourTag, { color: C.green, runTime: 0.75 }),
    ...say('USE LIFT TO FIND STRONGER CONNECTIONS', C.green)
  );

  await until(S(47));
  await play(
    ...fbox(['Confidence: 3 of 4', ['River overall: 4 of 8', C.cyan], ['Lift = 3 ÷ 2 = 1.5', C.amber]], C.cyan),
    ...say('LIFT ALSO USES OVERALL POPULARITY', C.cyan)
  );

  // --- 48-51: Cautions (small sample, not causation) and recap --------------
  const tileW = P ? 1.35 : 1.45, tileH = 0.82;
  const tileCenterY = P ? -0.6 : -0.35;
  const smallTiles = Array.from({ length: 8 }, (_, k) => {
    const x = CX + ((k % 4) - 1.5) * (tileW + 0.22);
    const y = tileCenterY + (k < 4 ? 0.58 : -0.58);
    return basketShell(`#${k + 1}`, [x, y, 0], tileW, tileH, { color: C.pink, labelColor: C.pink, fontSize: 17, handleR: 0.1 });
  });
  const smallFrame = new M.RoundedRectangle({ width: 4 * (tileW + 0.22) + 0.35, height: 2.55, cornerRadius: 0.2, color: C.pink, strokeWidth: 2 });
  smallFrame.setFill(C.pink, 0.05);
  smallFrame.moveTo([CX, tileCenterY, -0.01]);
  const smallNote = fitText('Only 8 baskets total', 18, C.pink, 6.2, false, true);
  smallNote.moveTo([CX, tileCenterY - 1.62, 0]);

  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(
      scaleLine, ...scaleTicks, oneLine, oneDot, oneLab,
      aboveBar, aboveLab, belowBar, belowLab,
      ourHalo, ourDot, ourStem, ourTag, shopBadge
    ), { runTime: 0.5 }),
    new M.Create(smallFrame, { runTime: 0.55 }),
    new M.LaggedStart(smallTiles.map(t => new M.FadeIn(t, { runTime: 0.4 })), { lagRatio: 0.06, runTime: 0.85 }),
    new M.FadeIn(smallNote, { runTime: 0.5 }),
    ...fbox([['Caution:', C.pink], 'Only 8 baskets'], C.pink),
    ...say('ONLY 8 BASKETS', C.pink)
  );

  await until(S(49));
  await play(
    new M.LaggedStart(smallTiles.map(t => new M.Indicate(t, { color: C.pink, runTime: 0.5 })), { lagRatio: 0.06, runTime: 0.9 }),
    ...fbox([['Small data:', C.pink], 'A strong lift can', 'appear by chance'], C.pink),
    ...say('SMALL DATA: MAY HAPPEN BY CHANCE', C.pink)
  );

  const cY = P ? -0.6 : -0.35;
  const cOff = P ? 1.95 : 2.15;
  const causeTrail = bookCard('Trail', [CX - cOff, cY, 0], 2.1, 0.92, { fontSize: 22, fillOpacity: 0.22 });
  const causeRiver = bookCard('River', [CX + cOff, cY, 0], 2.1, 0.92, { fontSize: 22, fillOpacity: 0.22 });
  const causeArrow = makeArrow([CX - cOff + 1.2, cY, 0], [CX + cOff - 1.2, cY, 0], C.muted, 4);
  const causeCross1 = new M.Line({ start: [CX - 0.36, cY - 0.36, 0.02], end: [CX + 0.36, cY + 0.36, 0.02], color: C.pink, strokeWidth: 5 });
  const causeCross2 = new M.Line({ start: [CX - 0.36, cY + 0.36, 0.02], end: [CX + 0.36, cY - 0.36, 0.02], color: C.pink, strokeWidth: 5 });
  const causeNote = fitText('Buying Trail does not prove it causes River', 18, C.pink, P ? 6.8 : 7.8, false, true);
  causeNote.moveTo([CX, cY - 1.15, 0]);

  await until(S(50));
  await play(
    new M.FadeOut(new M.VGroup(...smallTiles, smallFrame, smallNote), { runTime: 0.45 }),
    new M.FadeIn(causeTrail, { runTime: 0.5 }),
    new M.FadeIn(causeRiver, { runTime: 0.5 }),
    new M.Create(causeArrow, { runTime: 0.5 }),
    new M.Create(causeCross1, { runTime: 0.45 }),
    new M.Create(causeCross2, { runTime: 0.45 }),
    new M.FadeIn(causeNote, { runTime: 0.5 }),
    ...fbox([['High lift is NOT cause', C.pink], 'Connection, not proof'], C.pink),
    ...say('HIGH LIFT DOES NOT PROVE CAUSE', C.pink)
  );

  const rY = P ? -0.6 : -0.35;
  const recapExp = pill('EXPECTED: 2', C.violet, P ? 18 : 19);
  const recapObs = pill('OBSERVED: 3', C.cyan, P ? 18 : 19);
  const recapLift = pill('LIFT = 1.5', C.amber, P ? 21 : 22);
  recapExp.moveTo(P ? [-1.75, rY + 0.65, 0] : [CX - 2.35, rY + 0.55, 0]);
  recapObs.moveTo(P ? [1.75, rY + 0.65, 0] : [CX + 2.35, rY + 0.55, 0]);
  recapLift.moveTo([CX, rY - 0.75, 0]);
  const recapArrow1 = makeArrow([recapExp.getCenter()[0] + 0.3, rY + 0.28, 0], [CX - 0.45, rY - 0.32, 0], C.violet, 3);
  const recapArrow2 = makeArrow([recapObs.getCenter()[0] - 0.3, rY + 0.28, 0], [CX + 0.45, rY - 0.32, 0], C.cyan, 3);
  const recapSub = fitText('Observed compared with expected under independence', 17, C.ink, P ? 7.0 : 8.0);
  recapSub.moveTo([CX, rY - 1.55, 0]);

  await until(S(51));
  await play(
    new M.FadeOut(new M.VGroup(causeTrail, causeRiver, causeArrow, causeCross1, causeCross2, causeNote), { runTime: 0.45 }),
    new M.FadeIn(recapExp, { runTime: 0.55 }),
    new M.FadeIn(recapObs, { runTime: 0.55 }),
    new M.Create(recapArrow1, { runTime: 0.55 }),
    new M.Create(recapArrow2, { runTime: 0.55 }),
    new M.FadeIn(recapLift, { runTime: 0.6 }),
    new M.FadeIn(recapSub, { runTime: 0.6 }),
    ...fbox([['lift = observed ÷ expected', C.ink], ['     = 3 ÷ 2 = 1.5', C.amber]], C.amber),
    ...say('LIFT = OBSERVED ÷ EXPECTED', C.amber)
  );
}

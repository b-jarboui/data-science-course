// 21.1.11 Bounded tool loops: keep calling tools until the answer is verified or the step budget runs out.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.2, 0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const at = (i, f) => S(i) + (E(i) - S(i)) * f;

  // left panel: step budget on top, step log below; right panel (laptop) or bottom (phone): the shelf
  const LX = P ? -3.6 : -6.5, LW = P ? 7.2 : 7.4, MID = LX + LW / 2;
  const BUDX = P ? 0.6 : -2.6, BUDY = P ? 1.4 : 1.1, BSP = 0.65, BS = 0.5;
  const ROW0 = P ? 0.55 : 0.45, RP = P ? 0.75 : 0.62, R2 = P ? 0.3 : 0.28;
  const SHX = P ? 0 : 4.2, SHY = P ? -4.4 : -2.0, BKS = 0.95, BKW = 0.62, BKH = 0.9;
  const CY = P ? -0.9 : -0.7, CSP = P ? 2.5 : 2.1, CW = P ? 1.7 : 1.5;
  const put = (t, x, y) => { t.moveTo([x, y, 0]); return t; };
  const left = (t, x, y, w) => { let tw = t.getWidth(); if (w && tw > w) { t.scale(w / tw); tw = w; } t.moveTo([x + tw / 2, y, 0]); return t; };
  const right = (t, x, y) => { t.moveTo([x - t.getWidth() / 2, y, 0]); return t; };

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
    const lft = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([lft + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function clearBox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  function person(x, y, color = C.ink) {
    const head = new M.Circle({ radius: 0.14, color }); head.setFill(color, 1); head.moveTo([x, y + 0.36, 0]);
    const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([x, y + 0.02, 0]);
    return new M.VGroup(head, body);
  }
  function dashedBox(x, y, w, hgt, color) {
    const a = [x - w / 2, y - hgt / 2], b = [x + w / 2, y + hgt / 2];
    return [[a[0], a[1], a[0], b[1]], [a[0], b[1], b[0], b[1]], [b[0], b[1], b[0], a[1]], [b[0], a[1], a[0], a[1]]]
      .map(([x1, y1, x2, y2]) => new M.DashedLine({ start: [x1, y1, 0], end: [x2, y2, 0], color }));
  }

  // 0 the question
  const visitor = person(MID, P ? -0.9 : -0.6);
  await until(S(0)); await play(new M.FadeIn(visitor), ...say('IS BOOK 2 OF MOON GARDEN ON THE SHELF?', C.amber));

  // 1 the series: four books on a shelf
  const bx = k => SHX + (k - 1.5) * BKS;
  const books = [0, 1, 2, 3].map(k => { const r = new M.Rectangle({ width: BKW, height: BKH, color: C.violet, strokeWidth: 2 }); r.setFill(C.violet, 0.35); r.moveTo([bx(k), SHY, 0]); return r; });
  const bnums = books.map((_, k) => put(T(String(k + 1), 22, C.ink, true, true), bx(k), SHY));
  const shelf = new M.Line({ start: [bx(0) - 0.6, SHY - BKH / 2 - 0.03, 0], end: [bx(3) + 0.6, SHY - BKH / 2 - 0.03, 0], color: C.muted, strokeWidth: 3 });
  const series = put(T('Moon Garden: 4 books', 16, C.muted), SHX, SHY - BKH / 2 - 0.32);
  await until(S(1)); await play(new M.Create(shelf), new M.LaggedStart(books.map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...bnums, series)), ...say('MOON GARDEN = 4 BOOKS', C.violet));

  // 2 title of book two unknown
  const TY = SHY + BKH / 2 + 0.28;
  let title2 = put(T('?', 24, C.amber, true, true), bx(1), TY);
  await until(S(2));
  books[1].setFill(C.amber, 0.45); books[1].setColor(C.amber);
  await play(new M.FadeIn(title2), new M.Indicate(books[1], { color: C.amber }), ...say('ONE LOOKUP IS NOT ENOUGH: BOOK 2 TITLE = ?', C.amber));

  // 3 several calls in a row
  const chain = [];
  for (let k = 0; k < 3; k++) {
    const x = MID + (k - 1) * CSP;
    const r = new M.RoundedRectangle({ width: CW, height: 0.6, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 }); r.setFill(C.card, 0.9); r.moveTo([x, CY, 0]);
    chain.push(r, put(T(`call ${k + 1}`, 17, C.cyan, true), x, CY));
    if (k < 2) chain.push(new M.Arrow({ start: [x + CW / 2, CY, 0], end: [x + CSP - CW / 2, CY, 0], color: C.muted, strokeWidth: 2, buff: 0 }));
  }
  await until(S(3)); await play(new M.FadeOut(visitor), new M.LaggedStart(chain.map(o => new M.FadeIn(o)), { lagRatio: 0.2, runTime: 2.0 }),
    ...say('SEVERAL CALLS IN A ROW, EACH USES THE LAST RESULT'));

  // 4 two tools
  await until(S(4)); await play(...fbox([['tools:', C.muted], ['check_catalog(title)', C.cyan], ['check_series(series)', C.violet]]), ...say('2 TOOLS'));

  // 5 the limit: five step slots
  const sx = k => BUDX + (k - 2) * BSP;
  const slots = [0, 1, 2, 3, 4].map(k => { const r = new M.RoundedRectangle({ width: BS, height: BS, cornerRadius: 0.08, color: C.amber, strokeWidth: 2 }); r.setFill(C.card, 0.6); r.moveTo([sx(k), BUDY, 0]); return r; });
  const snums = slots.map((_, k) => put(T(String(k + 1), 18, C.amber, true, true), sx(k), BUDY));
  let blabel = right(T('limit', 17, C.muted), sx(0) - BS / 2 - 0.2, BUDY);
  const use = k => slots[k].setFill(C.amber, 0.4);
  const empty = () => slots.forEach(s => s.setFill(C.card, 0.6));
  await until(S(5)); await play(new M.FadeOut(new M.VGroup(...chain)), new M.LaggedStart(slots.map(s => new M.FadeIn(s)), { lagRatio: 0.15, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...snums, blabel)), ...fbox(['limit = 5 steps', ['1 step = 1 tool call', C.amber]], C.amber), ...say('LIMIT: AT MOST 5 STEPS', C.amber));

  // the step log: one row per tool call, its result underneath
  let rows = [], calls = [];
  function call(k, s, color) {
    const y = ROW0 - k * RP;
    const c = new M.Circle({ radius: 0.16, color: C.amber, strokeWidth: 2 }); c.setFill(C.card, 1); c.moveTo([LX + 0.16, y, 0]);
    const n = put(T(String(k + 1), 15, C.amber, true, true), LX + 0.16, y);
    const t = left(T(s, P ? 19 : 17, color, true), LX + 0.45, y, LW - 0.45);
    rows.push(c, n, t); calls.push(t);
    return new M.VGroup(c, n, t);
  }
  function result(k, s, color) {
    const t = left(T('→ ' + s, P ? 18 : 16, color, true), LX + 0.45, ROW0 - k * RP - R2, LW - 0.45);
    rows.push(t); return t;
  }

  // 6-8 step one
  await until(S(6)); use(0);
  await play(new M.FadeIn(call(0, 'check_catalog("Moon Garden book two")', C.cyan)), new M.Indicate(slots[0], { color: C.amber }), ...say('STEP 1', C.amber));
  const r1 = result(0, 'no match', C.pink);
  await until(S(7)); await play(new M.FadeIn(r1), ...say('NO MATCH', C.pink));
  await until(S(8)); await play(new M.Indicate(r1, { color: C.pink }), ...say('READ THE RESULT → TRY SOMETHING ELSE', C.violet));

  // 9-10 step two
  await until(S(9)); use(1);
  await play(new M.FadeIn(call(1, 'check_series("Moon Garden")', C.violet)), new M.Indicate(slots[1], { color: C.amber }), ...say('STEP 2', C.amber));
  const r2 = result(1, 'book 2 = "The Silver Gate"', C.green);
  const newTitle = put(T('The Silver Gate', 15, C.green, false, true), bx(1), TY);
  await until(S(10)); await play(new M.FadeIn(r2), new M.FadeOut(title2), new M.FadeIn(newTitle), ...say('BOOK 2 = THE SILVER GATE', C.green));
  title2 = newTitle;

  // 11-12 step three
  await until(S(11)); use(2);
  await play(new M.FadeIn(call(2, 'check_catalog("The Silver Gate")', C.cyan)), new M.Indicate(slots[2], { color: C.amber }), ...say('STEP 3', C.amber));
  const r3 = result(2, '2 copies · 0 on shelf · first due 3 Dec', C.amber);
  await until(S(12)); await play(new M.FadeIn(r3), ...say('NONE ON THE SHELF · FIRST DUE 3 DECEMBER', C.pink));

  // 13-17 the check: every fact backed by a tool result
  await until(S(13)); await play(new M.LaggedStart([r2, r3].map(r => new M.Indicate(r, { color: C.green })), { lagRatio: 0.4, runTime: 1.4 }), ...say('EVERYTHING IT NEEDS', C.green));
  await until(S(14)); await play(...fbox([['every fact in the answer', C.ink], ['backed by a tool result?', C.amber]], C.amber), ...say('THE APP CHECKS FIRST', C.amber));
  await until(S(15)); await play(...fbox([['backed by a tool result?', C.amber], ['The Silver Gate  ← step 2', C.green]], C.amber), new M.Indicate(r2, { color: C.green }));
  await until(S(16)); await play(...fbox([['backed by a tool result?', C.amber], ['The Silver Gate  ← step 2', C.green], ['out, due 3 Dec   ← step 3', C.green]], C.amber), new M.Indicate(r3, { color: C.green }));
  await until(S(17)); await play(...fbox([['backed by a tool result?', C.amber], ['The Silver Gate  ← step 2', C.green], ['out, due 3 Dec   ← step 3', C.green]], C.green), ...say('EVERY FACT BACKED = VERIFIED', C.green));

  // 18-19 stop after 3 of 5
  const stop = new M.Line({ start: [(sx(2) + sx(3)) / 2, BUDY - 0.42, 0], end: [(sx(2) + sx(3)) / 2, BUDY + 0.42, 0], color: C.green, strokeWidth: 5 });
  await until(S(18)); await play(new M.Create(stop), new M.LaggedStart([slots[3], slots[4]].map(s => new M.Indicate(s, { color: C.muted })), { lagRatio: 0.3, runTime: 1.2 }), ...say('STOP: 3 OF 5 STEPS USED', C.green));
  await until(S(19)); await play(...fbox([['answer:', C.muted], 'No, both copies are out.', ['First due back 3 December.', C.green]], C.green), ...say('THE ANSWER', C.green));

  // 20-21 a harder question: book nine
  await until(S(20)); empty();
  await play(new M.FadeOut(new M.VGroup(...rows, stop)), ...clearBox(), ...say('IS BOOK 9 ON THE SHELF?', C.amber));
  rows = []; calls = [];
  const ghost = [...dashedBox(bx(4), SHY, BKW, BKH, C.pink), put(T('9?', 20, C.pink, true, true), bx(4), SHY)];
  await until(S(21)); await play(new M.FadeIn(new M.VGroup(...ghost)), new M.LaggedStart(books.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }),
    ...say('ONLY 4 BOOKS: THERE IS NO BOOK 9', C.pink));

  // 22-23 five steps, nothing found
  await until(S(22)); use(0);
  await play(new M.FadeIn(call(0, 'check_catalog("Moon Garden book nine")', C.cyan)), new M.FadeIn(result(0, 'no match', C.pink)), ...say('STEP 1: NO MATCH', C.pink));
  await until(at(22, 0.5)); use(1);
  await play(new M.FadeIn(call(1, 'check_series("Moon Garden")', C.violet)), new M.FadeIn(result(1, 'only 4 books', C.pink)), ...say('STEP 2: ONLY 4 BOOKS', C.pink));
  const tries = [['check_catalog("Moongarden 9")', C.cyan], ['check_catalog("Moon Garden nine")', C.cyan], ['check_series("Moon Gardens")', C.violet]];
  for (let k = 2; k < 5; k++) {
    await until(at(23, 0.05 + (k - 2) * 0.28)); use(k);
    const extra = k === 2 ? say('STEPS 3, 4, 5: OTHER WORDS → NOTHING', C.pink) : [];
    await play(new M.FadeIn(call(k, ...tries[k - 2])), new M.FadeIn(result(k, 'no match', C.pink)), ...extra);
  }

  // 24 without a limit: more and more steps
  const more = [];
  for (let k = 5; k < (P ? 7 : 8); k++) more.push(...dashedBox(sx(k), BUDY, BS, BS, C.muted), put(T(String(k + 1), 18, C.muted, true), sx(k), BUDY));
  await until(S(24)); await play(new M.LaggedStart(more.map(o => new M.FadeIn(o)), { lagRatio: 0.05, runTime: 1.6 }), ...say('NO LIMIT: IT TRIES ON AND ON, THE VISITOR WAITS', C.pink));

  // 25-27 budget used up: stop, honest answer
  await until(S(25)); await play(new M.FadeOut(new M.VGroup(...more)), new M.Flash(slots[4], { color: C.pink }), ...say('AFTER STEP 5: BUDGET USED UP', C.pink));
  const stop2 = new M.Line({ start: [sx(4) + BSP / 2, BUDY - 0.42, 0], end: [sx(4) + BSP / 2, BUDY + 0.42, 0], color: C.pink, strokeWidth: 5 });
  await until(S(26)); await play(new M.Create(stop2), ...say('THE LOOP STOPS, EVEN WITH NO ANSWER', C.pink));
  await until(S(27)); await play(...fbox([['answer:', C.muted], 'I could not find it.', ['Please ask at the desk.', C.violet]], C.violet), ...say('NO GUESS: AN HONEST ANSWER', C.violet));

  // 28-30 the names
  await until(S(28)); await play(new M.FadeOut(new M.VGroup(...ghost)), new M.LaggedStart(calls.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.25, runTime: 2.2 }),
    ...fbox([['tool loop:', C.green], 'call → result → next call'], C.green), ...say('THIS IS A TOOL LOOP', C.green));
  await until(S(29)); await play(new M.LaggedStart(slots.map(s => new M.Indicate(s, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }), ...say('BOUNDED TOOL LOOP = A LOOP WITH A LIMIT', C.green));
  const nl = right(T('step budget', 17, C.amber, false, true), sx(0) - BS / 2 - 0.2, BUDY);
  await until(S(30)); await play(new M.FadeOut(blabel), new M.FadeIn(nl), ...say('THE LIMIT = THE STEP BUDGET', C.amber));
  blabel = nl;

  // 31 searching for your keys
  await until(S(31)); empty();
  await play(new M.FadeOut(new M.VGroup(...rows, stop2)), ...clearBox(), ...say('LOOKING FOR YOUR KEYS', C.violet));
  rows = []; calls = [];
  const keys = [], nots = [];
  ['drawer', 'coat', 'bag'].forEach((w, k) => {
    const x = MID + (k - 1) * CSP;
    const r = new M.RoundedRectangle({ width: CW, height: 0.6, cornerRadius: 0.12, color: C.violet, strokeWidth: 2 }); r.setFill(C.card, 0.9); r.moveTo([x, CY, 0]);
    keys.push(r, put(T(w, 17, C.violet), x, CY));
    nots.push(put(T('not here', 15, C.pink), x, CY - 0.55));
  });
  await until(at(31, 0.3)); await play(new M.LaggedStart(keys.map(o => new M.FadeIn(o)), { lagRatio: 0.15, runTime: 1.2 }));
  await until(at(31, 0.58)); await play(new M.LaggedStart(nots.map(o => new M.FadeIn(o)), { lagRatio: 0.3, runTime: 1.0 }));
  await until(at(31, 0.8)); await play(...say('NOT THERE → STOP AND ASK SOMEONE', C.violet));

  // 32-35 two ways to stop
  const cards = [], cardsBody = [];
  [[C.green, 'STOP 1', 'answer verified', 'every fact backed'], [C.pink, 'STOP 2', 'step budget', 'used up']].forEach(([col, head, a, b], k) => {
    const x = P ? 0 : MID + (k ? 1.9 : -1.9), y = P ? (k ? -2.1 : -0.1) : -0.6, w = P ? 6.8 : 3.6, hgt = P ? 1.5 : 1.7;
    const r = new M.RoundedRectangle({ width: w, height: hgt, cornerRadius: 0.16, color: col, strokeWidth: 2 }); r.setFill(C.card, 0.9); r.moveTo([x, y, 0]);
    cards.push(r, put(T(head, 19, col, true, true), x, y + hgt / 2 - 0.35));
    cardsBody.push([put(T(a, 18, C.ink), x, y - (P ? 0.05 : 0.15)), put(T(b, 18, C.muted), x, y - (P ? 0.45 : 0.55))]);
  });
  await until(S(32)); await play(new M.FadeOut(new M.VGroup(...keys, ...nots)), new M.FadeIn(new M.VGroup(...cards, ...cardsBody.flat())), ...say('TWO WAYS TO STOP'));
  await until(S(33)); await play(new M.Indicate(cards[1], { color: C.green }), ...say('STOP 1: THE ANSWER IS VERIFIED', C.green));
  await until(S(34)); await play(new M.Indicate(cards[3], { color: C.pink }), ...say('STOP 2: THE STEP BUDGET IS USED UP', C.pink));
  await until(S(35)); await play(...fbox(['keep calling tools', ['until verified', C.green], ['or budget used up', C.pink]]), ...say('WHICHEVER COMES FIRST', C.amber));

  // 36-37 what it is for
  await until(S(36)); await play(new M.LaggedStart([cards[1], cards[3]].map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.4, runTime: 1.4 }), ...say('MULTI-STEP QUESTIONS, NO RUNNING AWAY', C.green));
  await until(S(37)); await play(new M.LaggedStart(slots.map(s => new M.Indicate(s, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox(['1 step = time + money', ['at most 5 steps', C.amber], ['= cost known in advance', C.green]], C.amber), ...say('EACH STEP COSTS TIME AND MONEY', C.amber));

  // 38-41 the trap: a budget picked by guesswork
  await until(S(38)); await play(new M.FadeOut(new M.VGroup(...cards, ...cardsBody.flat())), ...say('TRAP: A BUDGET BY GUESSWORK', C.pink));
  const BX0 = LX + (P ? 1.25 : 1.45), PCH = P ? 0.30 : 0.36, YA = P ? -0.3 : -0.2, YB = P ? -2.0 : -1.6;
  const blk = (j, y, col) => { const b = new M.Rectangle({ width: PCH * 0.8, height: 0.52, color: col, strokeWidth: 1 }); b.setFill(col, 0.82); b.moveTo([BX0 + (j + 0.5) * PCH, y, 0]); return b; };
  const mk = b => new M.Line({ start: [BX0 + b * PCH, YA + 0.42, 0], end: [BX0 + b * PCH, YB - 0.42, 0], color: C.amber, strokeWidth: 4 });
  const mlab = b => { const t = T(`budget ${b}`, 18, C.amber, true); const x = Math.min(BX0 + b * PCH, (P ? FW / 2 : 2.1) - 0.2 - t.getWidth() / 2); return put(t, x, YA + 0.7); };
  const labA = left(T('book 2', 20, C.ink), LX, YA), labB = left(T('book 9', 20, C.ink), LX, YB);
  const rowA = [0, 1, 2].map(j => blk(j, YA, j < 2 ? C.green : C.pink));
  const rowB = Array.from({ length: 20 }, (_, j) => blk(j, YB, C.pink));
  let marker = mk(2), mtag = mlab(2);
  await until(S(39)); await play(new M.FadeIn(labA), new M.LaggedStart(rowA.map(b => new M.FadeIn(b)), { lagRatio: 0.3, runTime: 1.0 }),
    new M.Create(marker), new M.FadeIn(mtag), ...say('TOO SMALL: BOOK 2 IS CUT OFF AFTER 2 STEPS', C.pink));
  await until(S(40)); rowA[2].setFill(C.green, 0.82); rowA[2].setColor(C.green);
  let tag = mlab(20);
  await play(new M.FadeIn(labB), new M.LaggedStart(rowB.map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 2.0 }),
    new M.Transform(marker, mk(20)), new M.FadeOut(mtag), new M.FadeIn(tag), ...say('TOO BIG: BOOK 9 WASTES MANY STEPS', C.pink));
  mtag = tag; tag = mlab(5);
  await until(S(41)); await play(new M.FadeOut(new M.VGroup(...rowB.slice(5))), new M.Transform(marker, mk(5)), new M.FadeOut(mtag), new M.FadeIn(tag),
    ...say('COUNT THE STEPS REAL QUESTIONS NEED', C.green));
  mtag = tag;

  // 42-43 close and recap
  await until(S(42)); await play(new M.FadeOut(new M.VGroup(labA, labB, ...rowA, ...rowB.slice(0, 5), marker, mtag)),
    ...fbox([['chapter 21.1:', C.muted], 'prompts, retrieval, tools'], C.violet), ...say('NEXT: MEASURE HOW GOOD THE ANSWERS ARE', C.violet));
  await until(S(43)); await play(...fbox(['keep calling tools', ['until verified', C.green], ['or budget runs out', C.pink]], C.green), ...say('BOUNDED TOOL LOOP', C.green));
}

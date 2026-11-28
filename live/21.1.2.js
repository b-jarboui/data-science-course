// 21.1.2 Structured output: the model fills a fixed form (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Shared data: chapters/21.1.md.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const FX = P ? 0 : -2.6;                                    // form centre x
  const PILL = P ? [0, 1.75, 0] : [FX, 1.85, 0];
  const SLOT = P ? [0, 3.3, 0] : [4.1, -0.3, 0];              // the one side picture / formula box
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const at = (m, x, y) => { m.moveTo([x, y, 0]); return m; };
  const left = (t, x, y) => { t.moveTo([x + t.getWidth() / 2, y, 0]); return t; };

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
    r.setFill(C.card, 0.95); r.moveTo(SLOT);
    const lx = SLOT[0] - wd / 2 + 0.35, top = SLOT[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([lx + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 5.0;
    if (wd > maxw) g.scale(maxw / wd);
    if (P) g.moveTo([0, 4.25 - g.getHeight() / 2, 0]);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function fboxOut() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // speech bubble: lines = [['text', color]]
  function bubble(lines, color, p, maxw) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.4;
    const texts = lines.map(([s, c]) => T(s, size, c));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.5, ht = lines.length * lh + 0.35;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.2, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    texts.forEach((t, i) => left(t, p[0] - wd / 2 + 0.25, p[1] + ht / 2 - 0.175 - lh / 2 - i * lh));
    const g = new M.VGroup(r, ...texts);
    if (wd > maxw) g.scale(maxw / wd);
    return g;
  }
  const REQ = [['visitor:', C.muted], ['Please renew The Hobbit for me.', C.ink], ['My card number is 4417.', C.ink]];

  // 0-4 the assistant, the request, the library system
  const AS = P ? [0, 0.3] : [0, -0.2], BUB = P ? [0, 3.4, 0] : [-4.6, -0.2, 0], SYS = P ? [0, -3.6] : [4.6, -0.2], LY = P ? -1.4 : -2.2;
  const card = (w, h, color, p, lines) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); at(r, p[0], p[1]);
    const ts = lines.map(([s, sz, c, b], i) => at(T(s, sz, c, false, b), p[0], p[1] + (lines.length - 1) * 0.2 - i * 0.4));
    return new M.VGroup(r, ...ts);
  };
  const assistant = card(2.6, 1.1, C.cyan, AS, [['ASSISTANT', 20, C.cyan, true], ['a language model', 15, C.muted]]);
  await until(S(0)); await play(new M.FadeIn(assistant), ...say('ANSWERS QUESTIONS · TAKES REQUESTS'));

  const visitor = bubble(REQ, C.ink, BUB, P ? FW - 0.8 : 4.4);
  await until(S(1)); await play(new M.FadeIn(visitor), ...say('A VISITOR’S REQUEST', C.amber));

  const bar = (x, w, color) => { const b = new M.Rectangle({ width: w, height: 0.36, color, strokeWidth: 1 }); b.setFill(color, 0.8); return at(b, x, LY); };
  const loan = bar(-0.7, 2.0, C.cyan), more = bar(1.0, 1.4, C.amber);
  const loanT = at(T('loan', 17, C.cyan), -0.7, LY - 0.45), moreT = at(T('+ longer', 17, C.amber), 1.0, LY - 0.45);
  await until(S(2)); await play(new M.FadeIn(loan), new M.FadeIn(loanT), ...say('RENEW = MAKE A LOAN LAST LONGER', C.amber));
  await play(new M.Create(more), new M.FadeIn(moreT));

  const system = card(2.8, 1.1, C.violet, SYS, [['LIBRARY SYSTEM', 19, C.violet, true], ['a computer program', 15, C.muted]]);
  await until(S(3)); await play(new M.FadeIn(system), ...say('THE SYSTEM RENEWS, NOT THE MODEL', C.violet));

  const a0 = P ? [0, AS[1] - 0.65, 0] : [AS[0] + 1.4, AS[1], 0], a1 = P ? [0, SYS[1] + 0.65, 0] : [SYS[0] - 1.5, SYS[1], 0];
  const send = new M.Arrow({ start: a0, end: a1, color: C.muted, strokeWidth: 3 });
  const mid = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2], q = 0.18;
  const cross = [new M.Line({ start: [mid[0] - q, mid[1] - q, 0], end: [mid[0] + q, mid[1] + q, 0], color: C.pink, strokeWidth: 4 }),
    new M.Line({ start: [mid[0] - q, mid[1] + q, 0], end: [mid[0] + q, mid[1] - q, 0], color: C.pink, strokeWidth: 4 })];
  await until(S(4)); await play(new M.FadeOut(new M.VGroup(loan, more, loanT, moreT)), new M.Create(send), ...say('IT CANNOT READ A FRIENDLY SENTENCE', C.pink));
  await play(...cross.map(l => new M.Create(l)));
  await until(S(4) + 2.4); await play(...say('IT NEEDS A FILLED-IN FORM', C.green));

  // 5-8 the paper form with three boxes
  const ROWS = P ? [0.35, -1.75, -3.95] : [0.75, -0.65, -2.05];
  const FCX = P ? 0 : -1.7, FWID = P ? 6.8 : 4.6, FHT = 0.62;
  const labY = r => P ? ROWS[r] + 0.62 : ROWS[r];
  const numX = P ? -3.35 : -5.7, nameX = P ? -3.0 : -5.4;
  const itemX = k => FCX + (k - 1) * FWID / 3, sqX = k => itemX(k) - (P ? 0.75 : 0.55);
  const cellX = j => FCX - FWID / 2 + 0.4 + j * 0.62;
  function makeForm() {
    const paper = new M.RoundedRectangle({ width: P ? 7.6 : 6.8, height: P ? 6.1 : 4.2, cornerRadius: 0.2, color: C.muted, strokeWidth: 2 });
    paper.setFill(C.card, 0.6); at(paper, FX, P ? -1.7 : -0.65);
    const nums = [0, 1, 2].map(r => at(T(String(r + 1), 22, C.muted, true, true), numX, labY(r)));
    const names = ['action', 'title', 'card'].map((s, r) => left(T(s, 22, C.ink, true), nameX, labY(r)));
    const fields = ROWS.map(y => at(new M.Rectangle({ width: FWID, height: FHT, color: C.cyan, strokeWidth: 2 }), FCX, y));
    const squares = [0, 1, 2].map(k => at(new M.Rectangle({ width: 0.28, height: 0.28, color: C.ink, strokeWidth: 2 }), sqX(k), ROWS[0]));
    const choices = ['renew', 'reserve', 'hours'].map((s, k) => left(T(s, 20, C.ink), sqX(k) + 0.24, ROWS[0]));
    const cells = [0, 1, 2, 3].map(j => at(new M.Rectangle({ width: 0.46, height: 0.46, color: C.cyan, strokeWidth: 2 }), cellX(j), ROWS[2]));
    return { paper, nums, names, fields, squares, choices, cells };
  }
  function values(cardNo) {
    const tick = at(T('✓', 26, C.green, false, true), sqX(0), ROWS[0] + 0.04);
    const title = left(T('The Hobbit', 22, C.amber), FCX - FWID / 2 + 0.25, ROWS[1]);
    const digits = cardNo.split('').map((d, j) => at(T(d, 22, C.amber, true, true), cellX(j), ROWS[2]));
    return { tick, title, digits };
  }
  const F1 = makeForm();
  await until(S(5)); await play(new M.FadeOut(new M.VGroup(assistant, visitor, system, send, ...cross)), ...say('A PAPER FORM WITH 3 BOXES'));
  await play(new M.FadeIn(F1.paper), new M.LaggedStart(F1.fields.map(f => new M.Create(f)), { lagRatio: 0.3, runTime: 1.2 }), ...F1.nums.map(n => new M.FadeIn(n)));

  const hoursNote = T('hours = opening hours', 16, C.muted);
  at(hoursNote, Math.min(itemX(2), FX + (P ? 3.8 : 3.4) - 0.3 - hoursNote.getWidth() / 2), ROWS[0] - (P ? 0.55 : 0.5));
  await until(S(6)); await play(new M.FadeIn(F1.names[0]), new M.Indicate(F1.fields[0], { color: C.amber }), ...say('BOX 1: ACTION · TICK ONE OF 3', C.amber));
  await play(new M.LaggedStart([0, 1, 2].flatMap(k => [new M.FadeIn(F1.squares[k]), new M.FadeIn(F1.choices[k])]), { lagRatio: 0.35, runTime: 3.0 }));
  await until(S(6) + 5.0); await play(new M.FadeIn(hoursNote));

  await until(S(7)); await play(new M.FadeIn(F1.names[1]), new M.Indicate(F1.fields[1], { color: C.amber }), ...say('BOX 2: TITLE = THE BOOK NAME, AS TEXT', C.amber));

  await until(S(8)); await play(new M.FadeIn(F1.names[2]), ...say('BOX 3: CARD = EXACTLY 4 DIGITS', C.amber));
  await play(new M.LaggedStart(F1.cells.map(c => new M.Create(c)), { lagRatio: 0.3, runTime: 1.2 }));

  // 9-12 the model fills it from the visitor's sentence
  const visitor2 = bubble(REQ, C.ink, SLOT, P ? FW - 0.8 : 5.0);
  await until(S(9)); await play(new M.FadeIn(visitor2), ...say('THE MODEL FILLS THE FORM'));
  const V1 = values('4417');
  await until(S(10)); await play(new M.FadeIn(V1.tick), new M.Indicate(F1.choices[0], { color: C.amber }));
  await until(S(11)); await play(new M.FadeIn(V1.title, { shift: [0.15, 0, 0] }));
  await until(S(12)); await play(new M.LaggedStart(V1.digits.map(d => new M.FadeIn(d)), { lagRatio: 0.35, runTime: 1.4 }));

  // 13-16 the computer version, value, schema, structured output
  const JSON3 = ['{"action": "renew",', ' "title": "The Hobbit",', ' "card": 4417}'];
  await until(S(13)); await play(new M.FadeOut(visitor2), ...fbox(JSON3), ...say('BOX NAME, THEN WHAT GOES IN IT'));
  await until(S(14)); await play(...fbox([['{"action": "renew",', C.amber], JSON3[1], JSON3[2]]), ...say('VALUE = WHAT GOES IN A BOX', C.amber));
  await play(new M.Indicate(V1.tick, { color: C.amber }), new M.Indicate(F1.choices[0], { color: C.amber }));
  await until(S(15)); await play(...fbox(['schema:', ' action: renew/reserve/hours', ' title:  text', ' card:   4 digits'], C.green), ...say('SCHEMA = NAMED BOXES + ALLOWED VALUES', C.green));
  await play(new M.LaggedStart(F1.names.map(n => new M.Indicate(n, { color: C.green })), { lagRatio: 0.3, runTime: 1.5 }));
  await until(S(16)); await play(...fbox([...JSON3, ['= structured output', C.green]], C.green), ...say('STRUCTURED OUTPUT', C.green));

  // 17 fill the form, or chat?
  const chat = bubble([['model:', C.muted], ['"Sure! I would be happy', C.pink], ['to help you with that..."', C.pink]], C.pink, SLOT, P ? FW - 0.8 : 5.0);
  await until(S(17)); await play(...fboxOut(), new M.FadeOut(new M.VGroup(V1.tick, V1.title, ...V1.digits)), ...say('FILL THE FORM… OR CHAT?', C.amber));
  await play(new M.FadeIn(chat));

  // 18 tokens
  const TOKX = P ? [-1.3, 0, 1.3] : [SLOT[0] - 1.2, SLOT[0], SLOT[0] + 1.2], TOKY = P ? 3.0 : -0.3;
  const toks = ['The', 'Hob', 'bit'].map((s, i) => at(pill(s, C.cyan, 20), TOKX[i], TOKY));
  const tokNote = at(T('The Hobbit = 3 tokens', P ? 21 : 17, P ? C.ink : C.muted), SLOT[0], TOKY + (P ? 0.85 : 0.8));
  await until(S(18)); await play(new M.FadeOut(chat), new M.LaggedStart(toks.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), new M.FadeIn(tokNote), ...say('TOKEN = A SMALL PIECE OF TEXT'));

  // 19-24 one token at a time, with the form-breaking ones hidden
  const HEAD = P ? [0, 4.05] : [SLOT[0], 1.0];
  const gpos = (i, cols) => P
    ? [(i % cols - (cols - 1) / 2) * (cols > 4 ? 1.0 : 1.8), 3.35 - Math.floor(i / cols) * 0.7]
    : [SLOT[0] + (i % cols - (cols - 1) / 2) * (cols > 2 ? 0.8 : 1.8), 0.35 - Math.floor(i / cols) * 0.7];
  const chips = (list, cols) => list.map((s, i) => { const [x, y] = gpos(i, cols); return at(pill(s, s === 'close box' ? C.green : C.cyan, 18), x, y); });
  const head = at(T('next token?', P ? 21 : 17, P ? C.ink : C.muted), HEAD[0], HEAD[1]);
  const cand = chips(['renew', 'reserve', 'hours', 'Sure', 'Hello', 'I', '4', 'The'], P ? 4 : 2);
  await until(S(19)); F1.fields[0].setColor(C.amber);
  await play(new M.FadeOut(new M.VGroup(...toks, tokNote)), new M.FadeIn(head), new M.LaggedStart(cand.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.6 }), ...say('ONE TOKEN AT A TIME: WHICH NEXT?'));

  const breakers = cand.slice(3);
  await until(S(20)); await play(new M.LaggedStart(breakers.map(c => new M.Indicate(c, { color: C.pink })), { lagRatio: 0.2, runTime: 1.4 }), ...say('HIDE EVERY TOKEN THAT BREAKS THE FORM', C.pink));

  await until(S(21)); await play(new M.FadeOut(new M.VGroup(...breakers)), ...say('AFTER action: ONLY 3 CHOICES', C.amber));
  await play(new M.LaggedStart(cand.slice(0, 3).map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }));

  const V2 = values('4417');
  await until(S(22)); await play(new M.Indicate(cand[0], { color: C.green }), new M.FadeIn(V2.tick), ...say('CHATTING IS NOT EVEN POSSIBLE', C.pink));

  const cand2 = chips(['The', 'Hob', 'bit', 'Sure', '4', 'close box'], P ? 3 : 2);
  await until(S(23)); F1.fields[0].setColor(C.cyan); F1.fields[1].setColor(C.amber);
  await play(new M.FadeOut(new M.VGroup(...cand.slice(0, 3))), new M.LaggedStart(cand2.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.2 }), ...say('TITLE: ANY TEXT, UNTIL THE BOX CLOSES', C.amber));
  await play(new M.FadeIn(V2.title, { shift: [0.15, 0, 0] }));
  await play(new M.Indicate(cand2[5], { color: C.green }));

  const cand3 = chips(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], 5);
  await until(S(24)); F1.fields[1].setColor(C.cyan); F1.fields[2].setColor(C.amber);
  await play(new M.FadeOut(new M.VGroup(...cand2)), new M.LaggedStart(cand3.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.0 }), ...say('CARD: ONLY DIGITS, EXACTLY 4', C.amber));
  await play(new M.LaggedStart(V2.digits.map(d => new M.FadeIn(d)), { lagRatio: 0.35, runTime: 1.4 }));
  await play(new M.FadeOut(new M.VGroup(...cand3)));

  // 25-26 the name, and a website box that blocks letters
  await until(S(25)); F1.fields[2].setColor(C.cyan);
  await play(new M.FadeOut(head), ...fbox(['constrained decoding', ['constrained = limited', C.amber], ['decoding = choosing', C.cyan], ['  the next tokens', C.cyan]], C.amber), ...say('CONSTRAINED DECODING', C.amber));

  const WEB = P ? { lab: [0, 4.05], box: [0, 3.35], key: [-1.3, 2.6], no: [0.6, 2.6] }
    : { lab: [SLOT[0], 0.9], box: [SLOT[0], 0.1], key: [SLOT[0] - 0.9, -0.9], no: [SLOT[0] + 0.7, -0.9] };
  const webLab = at(T('website: phone number', 16, C.muted), ...WEB.lab);
  const webBox = at(new M.Rectangle({ width: 3.2, height: 0.6, color: C.cyan, strokeWidth: 2 }), ...WEB.box);
  const webTxt = left(T('0612', 22, C.ink, true), WEB.box[0] - 1.45, WEB.box[1]);
  const key = at(pill('A', C.pink, 20), ...WEB.key);
  const keyNo = at(T('✗ letters blocked', 17, C.pink), ...WEB.no);
  await until(S(26)); await play(...fboxOut(), new M.FadeIn(webLab), new M.Create(webBox), new M.FadeIn(webTxt), ...say('LIKE A PHONE NUMBER BOX ON A WEBSITE'));
  await play(new M.FadeIn(key), new M.Flash(key, { color: C.pink }));
  await play(new M.FadeIn(keyNo));

  // 27-29 the app checks the form once more
  await until(S(27)); await play(new M.FadeOut(new M.VGroup(webLab, webBox, webTxt, key, keyNo)), ...fbox(['the app checks', 'the form once more'], C.violet), ...say('THE APP CHECKS THE FORM', C.violet));
  await until(S(28)); await play(...fbox(['app check:', '3 boxes there?', 'action = a choice?', 'card = 4 digits?'], C.violet));
  await play(new M.LaggedStart(F1.fields.map(f => new M.Indicate(f, { color: C.violet })), { lagRatio: 0.6, runTime: 3.6 }));
  const OK = [['✓ 3 boxes there', C.green], ['✓ action = a choice', C.green], ['✓ card = 4 digits', C.green]];
  await until(S(29)); await play(...fbox(['app check:', ...OK], C.green), ...say('EVERY CHECK PASSES', C.green));
  await until(S(29) + 2.2); await play(...say('→ LIBRARY SYSTEM: LOAN RENEWED ✓', C.green));

  // 30-32 in words, and what it is for
  await until(S(30)); await play(...fbox(['structured output =', ' the model’s answer', [' → forced to fit a schema', C.amber], [' → then checked', C.green]]), ...say('ANSWER → FITS SCHEMA → CHECKED'));
  await until(S(31)); await play(new M.LaggedStart(F1.fields.map(f => new M.Indicate(f, { color: C.green })), { lagRatio: 0.3, runTime: 1.5 }), ...say('A PROGRAM CAN USE THE ANSWER SAFELY', C.green));
  await until(S(32)); await play(new M.LaggedStart(V2.digits.map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }), ...say('BOX 3 = A CARD NUMBER, EVERY TIME', C.green));

  // 33-38 the trap: a valid form with a wrong value
  await until(S(33)); await play(...fboxOut(), ...say('TRAP: A VALID FORM, A WRONG VALUE', C.pink));
  const d = V2.digits;
  const t2 = at(T('1', 22, C.amber, true, true), cellX(3), ROWS[2]), t3 = at(T('7', 22, C.amber, true, true), cellX(2), ROWS[2]);
  await until(S(34)); await play(...say('4417 → 4471: TWO DIGITS SWAPPED', C.amber));
  await play(new M.Transform(d[2], t2, { pathArc: 0.9 }), new M.Transform(d[3], t3, { pathArc: 0.9 }));
  await until(S(35)); await play(...fbox(['app check:', ...OK], C.green), ...say('STILL 4 DIGITS: EVERY CHECK PASSES', C.green));
  await until(S(36)); F1.cells.forEach(c => c.setColor(C.pink));
  await play(new M.LaggedStart(d.map(x => new M.Indicate(x, { color: C.pink })), { lagRatio: 0.2, runTime: 1.2 }), ...say('BUT IT IS SOMEONE ELSE’S CARD', C.pink));
  await until(S(37)); await play(...fbox(['the schema checks:', ['✓ the shape: 4 digits', C.green], ['✗ NOT the truth', C.pink]], C.pink), ...say('SHAPE, NOT TRUTH', C.pink));
  await until(S(38)); await play(...fbox(['visitor wrote: 4417', ['form says:     4471', C.pink], ['no match → ask:', C.amber], ['“Is 4471 your card?”', C.amber]], C.amber), ...say('IMPORTANT? COMPARE, OR ASK TO CONFIRM', C.amber));

  // 39 next: the six pages of the guide
  const PAGES = ['opening hours', 'borrowing', 'renewals', 'late fees', 'rooms', 'holidays'];
  const pageCol = k => k === 3 ? C.amber : k === 4 ? C.cyan : C.ink;
  const pages = PAGES.map((s, k) => {
    const [x, y] = P ? [(k % 3 - 1) * 2.5, k < 3 ? 0.0 : -2.8] : [(k - 2.5) * 2.1, -0.5];
    const r = new M.RoundedRectangle({ width: P ? 2.2 : 1.8, height: P ? 2.4 : 2.0, cornerRadius: 0.16, color: pageCol(k), strokeWidth: 2 });
    r.setFill(C.card, 0.9); at(r, x, y);
    return [r, at(T('page ' + (k + 1), 19, pageCol(k), true, true), x, y + 0.4), at(T(s, 15, pageCol(k)), x, y - 0.3)];
  }).flat();
  await until(S(39)); await play(...fboxOut(), new M.FadeOut(new M.VGroup(F1.paper, ...F1.nums, ...F1.names, ...F1.fields, ...F1.squares, ...F1.choices, ...F1.cells, hoursNote, V2.tick, V2.title, ...V2.digits)), ...say('NEXT: WHICH PAGE ANSWERS A QUESTION?'));
  await play(new M.LaggedStart(pages.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.6 }));

  // 40 in one sentence
  const F2 = makeForm(), V3 = values('4417');
  const parts2 = [F2.paper, ...F2.nums, ...F2.names, ...F2.fields, ...F2.squares, ...F2.choices, ...F2.cells, V3.tick, V3.title, ...V3.digits];
  await until(S(40)); await play(new M.FadeOut(new M.VGroup(...pages)), ...parts2.map(p => new M.FadeIn(p)),
    ...fbox(['the model fills a fixed form', ['→ a program can use it', C.green]], C.green), ...say('STRUCTURED OUTPUT', C.green));
}

// 21.1.1 Few-shot prompting: show the pattern with worked examples (live version, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.3, -1.4, 0];
  const MODELP = P ? [0, 1.3, 0] : [4.3, 0.75, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // the prompt: a box on the left (laptop) or below the model (phone); rows come in pairs (Q, A)
  const PX = P ? 0 : -2.9, PW = P ? 7.6 : 7.4, PTOP = P ? -0.1 : 1.35, PBOT = P ? -5.45 : -2.95;
  const PL = PX - PW / 2 + 0.3, LH = P ? 0.5 : 0.42, GG = 0.3, SZ = P ? 18 : 20;
  const rowY = i => PTOP - 0.8 - i * LH - Math.floor(i / 2) * GG;
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const at = (t, x, y) => { t.moveTo([x + t.getWidth() / 2, y, 0]); return t; };
  const row = (s, i, color = C.ink) => at(fit(T(s, SZ, color), PW - 0.6), PL, rowY(i));
  const after = (t, s, color) => at(T(s, SZ, color), t.getCenter()[0] + t.getWidth() / 2, t.getCenter()[1]);
  const outline = (i, color) => {
    const r = new M.RoundedRectangle({ width: PW - 0.24, height: 2 * LH + 0.12, cornerRadius: 0.1, color, strokeWidth: 1.5 });
    r.moveTo([PX, (rowY(i) + rowY(i + 1)) / 2, 0]); return r;
  };
  const slotLine = a => {
    const x = a.getCenter()[0] + a.getWidth() / 2 + 0.1, y = a.getCenter()[1] - 0.16;
    return new M.Line({ start: [x, y, 0], end: [x + 2.4, y, 0], color: C.muted, strokeWidth: 2 });
  };

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
    const maxw = P ? FW - 1.2 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // 0-1 the guide: six page cards (page 4 amber, page 5 cyan)
  const PCOL = [C.ink, C.ink, C.ink, C.amber, C.cyan, C.ink];
  const TOPICS = ['Opening hours', 'Borrowing', 'Renewals', 'Late fees', 'Rooms, printing', 'Holidays'];
  const CW = P ? 2.2 : 1.9, CH = P ? 1.4 : 1.3;
  const cardP = k => P ? [(k % 3 - 1) * 2.5, k < 3 ? -2.0 : -3.7, 0] : [(k - 2.5) * 2.15, -1.6, 0];
  const cards = [], topics = [];
  for (let k = 0; k < 6; k++) {
    const p = cardP(k);
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: PCOL[k], strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    const n = T(String(k + 1), 30, PCOL[k], true, true); n.moveTo([p[0], p[1] + 0.22, 0]);
    cards.push(new M.VGroup(r, n));
    { const t = fit(T(TOPICS[k], 15, C.muted), CW - 0.15); t.moveTo([p[0], p[1] - 0.33, 0]); topics.push(t); }
  }
  await until(S(0)); await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.6 }), ...say('A TOWN LIBRARY GUIDE: 6 PAGES'));
  await until(S(1)); await play(new M.LaggedStart(topics.map(t => new M.FadeIn(t)), { lagRatio: 0.45, runTime: 5.0 }), ...say('PAGE 1 HOURS · 2 BORROWING · 3 RENEWALS', C.muted));

  // 2-3 the assistant is a language model
  const modelBox = new M.RoundedRectangle({ width: P ? 3.4 : 2.8, height: 0.85, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
  modelBox.setFill(C.card, 0.95); modelBox.moveTo(MODELP);
  const modelLab = T('ASSISTANT', 19, C.ink, true, true); modelLab.moveTo(MODELP);
  await until(S(2)); await play(new M.FadeIn(modelBox), new M.FadeIn(modelLab), ...say('AN ASSISTANT ANSWERS FROM THE GUIDE', C.violet));
  const lmLab = fit(T('LANGUAGE MODEL', 19, C.ink, true, true), (P ? 3.4 : 2.8) - 0.3); lmLab.moveTo(MODELP);
  await until(S(3)); await play(new M.Transform(modelLab, lmLab), ...say('THE MODEL FROM THE LAST UNIT', C.violet));

  // 4 one token at a time; "re" + "new" are two tokens of one word
  const TOK = ['You', 'can', 're', 'new', 'a', 'loan', 'twice', '.'];
  const chips = TOK.map(s => {
    const t = T(s, 20, C.cyan, true);
    const r = new M.RoundedRectangle({ width: t.getWidth() + 0.1, height: 0.5, cornerRadius: 0.1, color: C.cyan, strokeWidth: 1.5 });
    r.setFill(C.card, 0.95); return new M.VGroup(r, t);
  });
  const TX0 = P ? -3.7 : -6.4, TX1 = P ? 3.7 : 2.6, TY = P ? -0.2 : 0.6;
  const gaps = TOK.map((_, k) => k === 3 ? 0.02 : 0.14);
  const tw = chips.map(c => c.submobjects[0].getWidth());
  const tf = Math.min(1, (TX1 - TX0) / (tw.reduce((a, b) => a + b, 0) + gaps.slice(1).reduce((a, b) => a + b, 0)));
  let tx = TX0;
  chips.forEach((c, k) => { if (k) tx += gaps[k] * tf; c.scale(tf); c.moveTo([tx + tw[k] * tf / 2, TY, 0]); tx += tw[k] * tf; });
  await until(S(4)); await play(new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.5, runTime: 3.0 }), ...say('IT WRITES ONE TOKEN AT A TIME'));
  await until(S(4) + 3.6); await play(new M.Indicate(chips[2], { color: C.amber }), new M.Indicate(chips[3], { color: C.amber }), ...say('TOKEN = A WORD OR PART OF A WORD', C.amber));

  // 5 the prompt
  const promptBox = new M.RoundedRectangle({ width: PW, height: PTOP - PBOT, cornerRadius: 0.18, color: C.muted, strokeWidth: 2 });
  promptBox.setFill(C.card, 0.6); promptBox.moveTo([PX, (PTOP + PBOT) / 2, 0]);
  const promptLab = at(T('PROMPT', 15, C.muted, true, true), PL, PTOP - 0.3);
  const arrow = new M.Arrow({ start: P ? [0, PTOP + 0.05, 0] : [PX + PW / 2 + 0.05, MODELP[1], 0],
    end: P ? [0, MODELP[1] - 0.45, 0] : [MODELP[0] - 1.45, MODELP[1], 0], color: C.muted, buff: 0 });
  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(...cards, ...topics, ...chips)), new M.Create(promptBox), new M.FadeIn(promptLab), new M.FadeIn(arrow),
    ...say('PROMPT = THE TEXT GIVEN BEFORE IT WRITES'));

  // 6-7 the question and what the library wants
  await until(S(6)); await play(...say('“HOW MANY TIMES CAN I RENEW A LOAN?”', C.amber));
  await until(S(7)); await play(...fbox(['wanted:', ['a short answer', C.green], ['+ the page', C.green]], C.green), ...say('SHORT ANSWER + THE PAGE', C.green));

  // 8-10 only the question: a long paragraph, no page
  const qz = row('Q: How many times can I renew a loan?', 0, C.amber);
  await until(S(8)); await play(new M.FadeIn(qz), ...say('ONLY THE QUESTION', C.muted));
  const PARA = ['A: Libraries are wonderful places! Most of them', 'let you renew books, and the friendly staff', 'are always happy to help you with any', 'questions about loans. Enjoy your visit!'];
  const para = PARA.map((s, k) => at(fit(T(s, SZ, C.ink), PW - 0.6), PL, rowY(0) - (k + 1) * LH));
  await until(S(9)); await play(new M.Indicate(modelBox, { color: C.violet }), new M.LaggedStart(para.map(t => new M.FadeIn(t)), { lagRatio: 0.6, runTime: 3.2 }), ...say('A LONG, FRIENDLY PARAGRAPH', C.muted));
  await until(S(10)); await play(...fbox(['wanted:', ['a short answer   ✗', C.pink], ['+ the page       ✗', C.pink]], C.pink), ...say('NO PAGE NAMED: NOT WHAT WE WANTED', C.pink));

  // 11-13 describing in words is unclear
  const instr = row('Be short. Name the page.', 1, C.violet);
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(...para)), new M.FadeIn(instr), ...say('DESCRIBE THE WISH IN WORDS?', C.violet));
  const BW3 = P ? [0.5, 2.0, 4.0] : [0.5, 2.0, 4.4], BL = ['3 words?', 'one sentence?', 'a whole paragraph?'];
  const bars = BW3.flatMap((w, k) => {
    const y = rowY(1) - (k + 1) * LH * 1.2;
    const b = new M.Rectangle({ width: w, height: 0.2, color: C.violet, strokeWidth: 1 }); b.setFill(C.violet, 0.7); b.moveTo([PL + w / 2, y, 0]);
    return [b, at(T(BL[k], 16, C.muted), PL + w + 0.1, y)];
  });
  await until(S(12)); await play(new M.LaggedStart(bars.map(b => new M.FadeIn(b)), { lagRatio: 0.3, runTime: 2.0 }), ...say('HOW SHORT IS SHORT?', C.violet));
  await until(S(13)); await play(new M.FadeOut(new M.VGroup(qz, instr, ...bars)), ...say('CLEARER: SHOW WHAT A GOOD ANSWER LOOKS LIKE', C.green));

  // 14 teaching a new helper at the desk
  function person(p, color) {
    const head = new M.Circle({ radius: 0.14, color }); head.setFill(color, 1); head.moveTo([p[0], p[1] + 0.36, 0]);
    const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([p[0], p[1] + 0.02, 0]);
    return new M.VGroup(head, body);
  }
  const YOU = P ? [-2.6, -2.8, 0] : [-5.7, -0.8, 0], HELP = P ? [2.6, -2.8, 0] : [-0.1, -0.8, 0];
  const you = person(YOU, C.ink), helper = person(HELP, C.cyan);
  const youLab = T('you', 16, C.muted); youLab.moveTo([YOU[0], YOU[1] - 0.45, 0]);
  const helpLab = T('new helper', 16, C.muted); helpLab.moveTo([HELP[0], HELP[1] - 0.45, 0]);
  const qa = [0, 1].map(k => {
    const p = P ? [0, -2.3 - k, 0] : [-2.9, -0.3 - k, 0];
    const r = new M.RoundedRectangle({ width: 1.9, height: 0.6, cornerRadius: 0.12, color: C.green, strokeWidth: 1.5 }); r.setFill(C.card, 0.95); r.moveTo(p);
    const t = T('Q → A', 18, C.green, true); t.moveTo(p);
    return new M.VGroup(r, t);
  });
  await until(S(14)); await play(new M.FadeIn(you), new M.FadeIn(helper), new M.FadeIn(youLab), new M.FadeIn(helpLab), ...say('NOT A SPEECH…', C.muted));
  await until(S(14) + 3.4); await play(new M.LaggedStart(qa.map(c => new M.FadeIn(c)), { lagRatio: 0.6, runTime: 1.6 }), ...say('…2 QUESTIONS ANSWERED IN FRONT OF THEM', C.green));

  // 15-20 two worked examples, then the real question
  const box1 = outline(0, C.cyan), box2 = outline(2, C.cyan), boxQ = outline(4, C.amber);
  await until(S(15)); await play(new M.FadeOut(new M.VGroup(you, helper, youLab, helpLab, ...qa)), new M.Create(box1), new M.Create(box2), new M.Create(boxQ), ...say('2 WORKED EXAMPLES, THEN THE REAL QUESTION', C.green));
  const q0 = row('Q: When does the library open on Saturday?', 0);
  await until(S(16)); await play(new M.FadeIn(q0), ...say('EXAMPLE 1', C.cyan));
  const a0 = at(T('A:', SZ, C.muted), PL, rowY(1)), f0 = after(a0, 'At ten.', C.green), p0 = after(f0, '(Page 1)', C.green);
  await until(S(17)); await play(new M.LaggedStart([a0, f0, p0].map(t => new M.FadeIn(t)), { lagRatio: 0.5, runTime: 1.6 }));
  const q2 = row('Q: How many books can I borrow?', 2);
  await until(S(18)); await play(new M.FadeIn(q2), ...say('EXAMPLE 2', C.cyan));
  const a1 = at(T('A:', SZ, C.muted), PL, rowY(3)), f1 = after(a1, 'Five.', C.green), p1 = after(f1, '(Page 2)', C.green);
  await until(S(19)); await play(new M.LaggedStart([a1, f1, p1].map(t => new M.FadeIn(t)), { lagRatio: 0.5, runTime: 1.6 }));
  const q4 = row('Q: How many times can I renew a loan?', 4, C.amber);
  const ansA = at(T('A:', SZ, C.muted), PL, rowY(5)), slot = slotLine(ansA);
  await until(S(20)); await play(new M.FadeIn(q4), new M.FadeIn(ansA), new M.Create(slot), ...say('THE REAL QUESTION', C.amber));

  // 21-22 the pattern, copied
  await until(S(21)); await play(new M.LaggedStart([f0, f1, p0, p1].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.45, runTime: 3.0 }), ...say('PATTERN: A SHORT FACT, THEN THE PAGE', C.green));
  const af = after(ansA, 'Twice.', C.green), ap = after(af, '(Page 3)', C.green);
  await until(S(22)); await play(new M.FadeOut(slot), new M.Indicate(modelBox, { color: C.violet }), new M.LaggedStart([af, ap].map(t => new M.FadeIn(t)), { lagRatio: 0.5, runTime: 1.4 }),
    ...fbox(['wanted:', ['a short answer   ✓', C.green], ['+ the page       ✓', C.green]], C.green), ...say('TWICE. (PAGE 3)', C.green));

  // 23-24 nothing learned, only steered
  await until(S(23)); await play(...say('THE MODEL LEARNED NOTHING NEW', C.violet));
  await until(S(23) + 2.4); await play(...fbox([['inner numbers', C.muted], 'before  0.42  -1.07  0.88', 'after   0.42  -1.07  0.88'], C.violet), ...say('INNER NUMBERS: NO CHANGE', C.violet));
  await until(S(24)); promptBox.setColor(C.cyan); promptBox.setFill(C.card, 0.6); await play(...say('THE EXAMPLES STEER ONLY THIS ONE PROMPT', C.cyan));

  // 25-28 the names: demonstration, shot, few-shot, zero-shot
  const TAGX = PX + PW / 2 - 0.85;
  const tag1 = pill('DEMO 1', C.cyan, 15).moveTo([TAGX, rowY(1), 0]), tag2 = pill('DEMO 2', C.cyan, 15).moveTo([TAGX, rowY(3), 0]);
  await until(S(25)); promptBox.setColor(C.muted); promptBox.setFill(C.card, 0.6);
  await play(new M.FadeIn(tag1), new M.FadeIn(tag2), ...say('EACH WORKED EXAMPLE = A DEMONSTRATION', C.green));
  await until(S(26)); await play(new M.Transform(tag1, pill('SHOT 1', C.cyan, 15).moveTo([TAGX, rowY(1), 0])),
    new M.Transform(tag2, pill('SHOT 2', C.cyan, 15).moveTo([TAGX, rowY(3), 0])), ...say('DEMONSTRATION = SHOT = ONE TRY', C.cyan));
  await until(S(27)); await play(...fbox(['few-shot prompting', ['= a few demonstrations', C.green], ['here: 2 shots', C.amber]], C.green), ...say('FEW-SHOT PROMPTING', C.green));
  await until(S(28)); await play(...fbox(['zero-shot prompting', ['= no demonstration', C.pink], 'only the question'], C.pink), ...say('ZERO-SHOT = NO DEMONSTRATION', C.pink));

  // 29-31 the recipe
  const ex1 = [q0, a0, f0, p0], ex2 = [q2, a1, f1, p1];
  await until(S(29)); await play(...say('THE RECIPE: 3 PARTS, IN ORDER', C.amber));
  await until(S(30)); await play(...fbox(['1  demonstrations'], C.amber), new M.LaggedStart([...ex1, ...ex2].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.12, runTime: 1.8 }));
  await until(S(30) + 2.5); await play(...fbox(['1  demonstrations', '2  real question'], C.amber), new M.Indicate(q4, { color: C.amber }));
  await until(S(30) + 4.9); await play(...fbox(['1  demonstrations', '2  real question', ['3  empty space: answer', C.green]], C.amber),
    new M.LaggedStart([ansA, af, ap].map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.3, runTime: 1.6 }));
  await until(S(31)); await play(...fbox(['few-shot prompt =', ' a few Q + A examples', [' + the new question', C.amber]]), ...say('IN WORDS', C.cyan));

  // 32-34 what it is for, quick, but takes room
  await until(S(32)); await play(...fbox(['shape  : fact, then page', 'length : a few words', 'style  : plain'], C.green), ...say('IT FIXES SHAPE, LENGTH AND STYLE', C.green));
  await until(S(33)); await play(new M.LaggedStart([...ex1, ...ex2].map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.12, runTime: 1.8 }), ...say('QUICK: CHANGE A FEW LINES OF TEXT', C.green));
  await until(S(33) + 2.2); await play(new M.Indicate(modelBox, { color: C.violet }), new M.Indicate(modelLab, { color: C.violet }), ...say('NOT THE MODEL', C.violet));
  await until(S(34)); await play(...fbox([['room in the prompt', C.muted], ['■■■■□□□□□□  2 examples', C.cyan]]), ...say('EACH EXAMPLE TAKES ROOM', C.cyan));
  await until(S(34) + 2.6); await play(...fbox([['room in the prompt', C.muted], ['■■■■□□□□□□  2 examples', C.cyan], ['■■■■■■■■■■  full!', C.pink]], C.pink), ...say('IT CAN ONLY READ SO MUCH AT ONCE', C.pink));
  await until(S(34) + 5.2); await play(...say('SO KEEP THEM FEW', C.amber));

  // 35-41 the trap: it copies accidents too
  await until(S(35)); await play(...say('TRAP: IT COPIES ACCIDENTS TOO', C.pink));
  await until(S(36)); await play(new M.LaggedStart([f0, f1].map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.6, runTime: 2.0 }), ...say('BOTH EXAMPLES: ONE SHORT FACT', C.pink));
  const q4b = row('Q: What do I pay for a late children’s book?', 4, C.amber), slot2 = slotLine(ansA);
  await until(S(37)); await play(new M.FadeOut(new M.VGroup(q4, af, ap)), new M.FadeIn(q4b), new M.Create(slot2), ...say('A NEW QUESTION', C.amber));
  await until(S(38)); await play(...fbox([['page 4 says:', C.amber], 'late book: 20 cents a day'], C.amber), ...say('PAGE 4: LATE FEES', C.amber));
  await until(S(38) + 3.3); await play(...fbox([['page 4 says:', C.amber], 'late book: 20 cents a day', ['children’s books: no fee', C.green]], C.amber));
  const exception = boxNow.submobjects[3];
  const wf = after(ansA, 'Twenty cents a day.', C.pink), wp = after(wf, '(Page 4)', C.pink);
  await until(S(39)); await play(new M.FadeOut(slot2), new M.Indicate(modelBox, { color: C.violet }), new M.LaggedStart([wf, wp].map(t => new M.FadeIn(t)), { lagRatio: 0.5, runTime: 1.6 }), ...say('COPIED: ONE SHORT FACT', C.pink));
  await until(S(40)); await play(new M.Indicate(exception, { color: C.pink }), ...say('THE EXCEPTION IS DROPPED', C.pink));
  await until(S(40) + 3.3); await play(new M.LaggedStart([...ex1, ...ex2].map(t => new M.Indicate(t, { color: C.muted })), { lagRatio: 0.12, runTime: 1.8 }), ...say('NO EXAMPLE HAD AN EXCEPTION', C.muted));
  const rf = after(ansA, 'Nothing.', C.green), rp = after(rf, '(Page 4)', C.green);
  await until(S(41)); await play(new M.FadeOut(new M.VGroup(wf, wp)), new M.FadeIn(rf), new M.FadeIn(rp), ...say('RIGHT ANSWER: NOTHING', C.green));

  // 42-44 choosing demonstrations, next, summary
  await until(S(42)); await play(...fbox(['good demonstrations:', 'like the real questions', ['+ one with an exception', C.green]], C.green), ...say('PICK DEMONSTRATIONS LIKE THE REAL QUESTIONS', C.green));
  await until(S(43)); await play(...say('NEXT: AN EXACT FORM A COMPUTER CAN READ', C.violet));
  await until(S(44)); await play(...fbox(['few-shot prompting:', 'show a few worked examples', ['→ it copies their pattern', C.green]]), ...say('A FEW EXAMPLES → THE MODEL COPIES THE PATTERN', C.green));
}

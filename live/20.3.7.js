// 20.3.7 Context windows: one fixed token budget (live lesson, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const Q1 = ['Is', 'the', 'café', 'open', '?'], A1 = ['Yes', ',', 'until', 'six', '.'];
  const Q2 = ['When', 'will', 'the', 'library', 'open', '?'], R7 = ['The', 'library', 'will', 'open', 'at', 'ten', '.'];
  const N = 20, COLS = P ? 5 : 10, PX = P ? 1.3 : 1.18, RY = P ? 1.2 : 0.95, BW = P ? 1.18 : 1.08, BH = P ? 0.8 : 0.72, ROW0 = P ? 1.4 : 1.05;
  const ROWS = Math.ceil(N / COLS);
  const PILL = P ? [0, 2.65, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -4.45, 0] : [0, -2.25, 0];
  const slot = i => [((i % COLS) - (COLS - 1) / 2) * PX, ROW0 - Math.floor(i / COLS) * RY, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

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
    const maxw = P ? FW - 1.0 : 8.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // 0-5 the chat
  const IY = P ? 0.9 : -0.1, IX = P ? 2.7 : 5.6, XR = P ? 3.6 : 4.2, BY = P ? [-0.6, -2.1, -3.6] : [1.0, 0.0, -1.0];
  function person(x, y) {
    const head = new M.Circle({ radius: 0.14, color: C.cyan }); head.setFill(C.cyan, 1); head.moveTo([x, y + 0.36, 0]);
    const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color: C.cyan }); body.setFill(C.cyan, 1); body.moveTo([x, y + 0.02, 0]);
    return new M.VGroup(head, body);
  }
  function bot(x, y) {
    const r = new M.RoundedRectangle({ width: 0.6, height: 0.48, cornerRadius: 0.12, color: C.green, strokeWidth: 2 }); r.setFill(C.green, 0.15); r.moveTo([x, y + 0.24, 0]);
    const e1 = new M.Dot({ point: [x - 0.12, y + 0.27, 0], radius: 0.05, color: C.green });
    const e2 = new M.Dot({ point: [x + 0.12, y + 0.27, 0], radius: 0.05, color: C.green });
    const ant = new M.Line({ start: [x, y + 0.48, 0], end: [x, y + 0.6, 0], color: C.green, strokeWidth: 2 });
    return new M.VGroup(r, e1, e2, ant);
  }
  function bubble(text, color, y, right) {
    const t = T(text, P ? 22 : 22, C.ink);
    const maxw = P ? FW - 2.2 : 7;
    if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    const w = t.getWidth() + 0.4, x = right ? XR - w / 2 : -XR + w / 2;
    const r = new M.RoundedRectangle({ width: w, height: P ? 0.75 : 0.62, cornerRadius: 0.22, color, strokeWidth: 2 }); r.setFill(color, 0.14); r.moveTo([x, y, 0]);
    t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }
  const who = [person(IX, IY), T('student', 17, C.muted).moveTo([IX, IY - 0.28, 0]),
    bot(-IX, IY), T('assistant', 17, C.muted).moveTo([-IX, IY - 0.28, 0])];
  const b1 = bubble('Is the café open?', C.cyan, BY[0], true);
  const b2 = bubble('Yes, until six.', C.cyan, BY[1], false);
  const b3 = bubble('When will the library open?', C.violet, BY[2], true);

  await until(S(0)); await play(new M.LaggedStart(who.map(o => new M.FadeIn(o)), { lagRatio: 0.2, runTime: 1.4 }), ...fbox(['a student chats with', ['the campus assistant', C.cyan]]), ...say('A STUDENT AND THE ASSISTANT'));
  await until(S(1)); await play(new M.FadeIn(b1, { shift: [0, 0.12, 0] }), ...say('EARLIER QUESTION', C.cyan));
  await until(S(2)); await play(new M.FadeIn(b2, { shift: [0, 0.12, 0] }), ...say('EARLIER ANSWER', C.cyan));
  await until(S(3)); await play(new M.FadeIn(b3, { shift: [0, 0.12, 0] }), ...unbox(), ...say('NEW QUESTION', C.violet));
  await until(S(4)); await play(new M.LaggedStart([b1, b2, b3].map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.3, runTime: 2.2 }), ...say('IT READS THE WHOLE CHAT'));
  await until(S(5)); await play(...say('ONLY SO MANY TOKENS AT ONCE', C.pink));

  // 6-9 the window: twenty boxes, one token each
  const boxes = Array.from({ length: N }, (_, i) => {
    const b = new M.Rectangle({ width: BW, height: BH, color: C.muted, strokeWidth: 2 }); b.setFill(C.card, 0.6); b.moveTo(slot(i)); return b;
  });
  await until(S(6)); await play(new M.FadeOut(new M.VGroup(...who, b1, b2, b3)),
    new M.LaggedStart(boxes.map(b => new M.Create(b)), { lagRatio: 0.08, runTime: 2.0 }), ...say('PICTURE THE LIMIT: 20 BOXES'));
  await until(S(7)); await play(new M.Indicate(boxes[0], { color: C.amber }), ...say('1 BOX = 1 TOKEN', C.amber));
  await until(S(7) + 3.0); await play(...say('EACH WORD OR MARK = 1 TOKEN', C.amber), ...fbox(['café  → 1 token', '?     → 1 token']));

  const ww = (COLS - 1) * PX + BW + 0.3, wh = (ROWS - 1) * RY + BH + 0.3, WC = [0, ROW0 - (ROWS - 1) * RY / 2, 0];
  const win = new M.RoundedRectangle({ width: ww, height: wh, cornerRadius: 0.16, color: C.green, strokeWidth: 3 }); win.moveTo(WC);
  const tag = T('context window: 20 tokens', 19, C.green);
  tag.moveTo([0, WC[1] - wh / 2 - 0.32, 0]);
  await until(S(8)); await play(new M.Create(win), new M.FadeIn(tag), ...say('THE CONTEXT WINDOW', C.green));
  await until(S(9)); await play(...say('IT HOLDS EVERYTHING', C.green),
    ...fbox([['earlier messages', C.cyan], ['+ the new question', C.violet], ['+ the reply', C.amber]], C.green));

  // 10-15 fill it with the chat
  const card = (i, word, color) => {
    const r = new M.Rectangle({ width: BW, height: BH, color, strokeWidth: 2 }); r.setFill(color, 0.25); r.moveTo(slot(i));
    const t = T(word, P ? 18 : 19, C.ink, false, true);
    if (t.getWidth() > BW - 0.06) t.scale((BW - 0.06) / t.getWidth());
    t.moveTo(slot(i));
    return new M.VGroup(r, t);
  };
  const fillIn = (cards, runTime) => new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.5, runTime });
  const q1 = Q1.map((w, k) => card(k, w, C.cyan)), a1 = A1.map((w, k) => card(5 + k, w, C.cyan));
  const q2 = Q2.map((w, k) => card(10 + k, w, C.violet));
  const L1 = ['café question   5', C.cyan], L2 = ['café answer     5', C.cyan], L3 = ['new question    6', C.violet];

  await until(S(10)); await play(...say('LET’S FILL IT', C.amber), ...fbox(['used  0 / 20']));
  await until(S(11)); await play(...say('“IS THE CAFÉ OPEN?”', C.cyan));
  await until(S(11) + 1.5); await play(fillIn(q1, 3.0));
  await play(...fbox([L1, ['used  5 / 20', C.amber]]));
  await until(S(12)); await play(...say('“YES, UNTIL SIX.”', C.cyan));
  await until(S(12) + 1.5); await play(fillIn(a1, 3.0));
  await play(...fbox([L1, L2, ['used 10 / 20', C.amber]]));
  await until(S(13)); await play(...say('“WHEN WILL THE LIBRARY OPEN?”', C.violet));
  await until(S(13) + 1.8); await play(fillIn(q2, 3.0));
  await play(...fbox([L1, L2, L3]));
  await until(S(14)); await play(new M.LaggedStart([...q1, ...a1, ...q2].map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.1, runTime: 2.4 }),
    ...fbox([L1, L2, L3, ['5 + 5 + 6 = 16 used', C.amber]]), ...say('16 BOXES USED', C.amber));
  await until(S(15)); await play(new M.LaggedStart(boxes.slice(16).map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.3, runTime: 1.6 }),
    ...fbox(['20 − 16 = 4', ['4 boxes left for the reply', C.amber]]), ...say('4 BOXES LEFT FOR THE REPLY', C.amber));

  // 16-21 the reply runs out of boxes
  const r4 = R7.slice(0, 4).map((w, k) => card(16 + k, w, C.amber));
  await until(S(16)); await play(new M.Indicate(boxes[16], { color: C.amber }), ...say('WRITING: ONE TOKEN PER BOX', C.amber));
  await until(S(17)); await play(fillIn(r4, 2.4));
  await until(S(18)); await play(new M.Indicate(win, { color: C.pink }), ...say('FULL: THE MODEL MUST STOP', C.pink),
    ...fbox(['used  20 / 20', ['no box left: stop', C.pink]], C.pink));
  await until(S(19)); await play(...say('THE REPLY IS CUT', C.pink),
    ...fbox(['the student sees:', ['The library will open', C.amber], ['… and nothing more', C.pink]], C.pink));
  await until(S(20)); await play(...say('THE FULL REPLY NEEDS 7', C.amber),
    ...fbox(['full reply:', ['The library will open at ten .', C.amber], 'needs 7 boxes'], C.amber));
  await until(S(21)); await play(...say('4 BOXES < 7 TOKENS', C.pink), ...fbox(['needs  7', 'has    4', ['4 < 7: not enough', C.pink]], C.pink));

  // 22-28 the fix: reserve 8, drop the oldest
  await until(S(22)); await play(...say('HOW DO WE FIX IT?', C.amber));
  await until(S(23)); await play(new M.FadeOut(new M.VGroup(...r4)), ...unbox(), ...say('KEEP BOXES FREE FOR THE REPLY', C.amber));
  const res = Array.from({ length: 8 }, (_, k) => {
    const o = new M.Rectangle({ width: BW + 0.05, height: BH + 0.08, color: C.amber, strokeWidth: 3 }); o.moveTo(slot(12 + k)); return o;
  });
  await until(S(24)); await play(new M.LaggedStart(res.map(o => new M.Create(o)), { lagRatio: 0.15, runTime: 1.6 }),
    ...say('RESERVE 8 FOR THE REPLY', C.amber), ...fbox(['reserve   8', ['20 − 8 = 12 for messages', C.cyan]], C.amber));
  await until(S(25)); await play(new M.LaggedStart(q2.slice(2).map(c => new M.Indicate(c, { color: C.pink })), { lagRatio: 0.25, runTime: 1.6 }),
    ...say('16 DO NOT FIT INTO 12', C.pink), ...fbox(['messages  16', 'room      12', ['16 > 12: too many', C.pink]], C.pink));
  const gone = [...Q1, ...A1].map((w, k) => card(k, w, C.pink));
  await until(S(26)); await play(new M.FadeOut(new M.VGroup(...q1, ...a1)),
    new M.LaggedStart(gone.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.2 }), ...say('DROP THE OLDEST FIRST', C.pink));
  await until(S(26) + 2.6); await play(new M.LaggedStart(gone.map(c => new M.Indicate(c, { color: C.pink })), { lagRatio: 0.1, runTime: 1.6 }));
  const q2b = Q2.map((w, k) => card(k, w, C.violet));
  await until(S(27)); await play(new M.FadeOut(new M.VGroup(...gone)),
    ...fbox([['dropped  5 + 5 = 10', C.pink], ['left: new question  6', C.violet]], C.pink));
  await until(S(27) + 2.0); await play(new M.FadeOut(new M.VGroup(...q2)),
    new M.LaggedStart(q2b.map(c => new M.FadeIn(c)), { lagRatio: 0.3, runTime: 1.6 }));
  await until(S(28)); await play(new M.Indicate(win, { color: C.green }), ...say('6 + 8 = 14: IT FITS', C.green),
    ...fbox(['6 + 8 = 14', ['14 ≤ 20: it fits', C.green]], C.green));

  // 29-30 the full reply, inside the reserve
  const r7 = R7.map((w, k) => card(12 + k, w, C.amber));
  await until(S(29)); await play(...say('NOW THE REPLY HAS ROOM', C.green));
  await until(S(29) + 1.2); await play(fillIn(r7, 2.0));
  await until(S(30)); await play(new M.LaggedStart(r7.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.15, runTime: 1.6 }),
    ...say('7 TOKENS INSIDE THE 8', C.green), ...fbox(['reply     7', 'reserved  8', ['7 ≤ 8: it fits', C.green]], C.green));

  // 31-34 the rule
  await until(S(31)); await play(new M.Indicate(win, { color: C.green }), ...say('ONE FIXED BUDGET FOR ALL', C.green));
  await until(S(32)); await play(...say('EVERYTHING MUST FIT', C.amber),
    ...fbox([['earlier messages', C.cyan], ['+ new question', C.violet], ['+ reply', C.amber], 'must fit in the window'], C.amber));
  await until(S(33)); await play(...say('REAL WINDOWS: THOUSANDS', C.violet),
    ...fbox(['our window    20 tokens', ['real windows  many thousands', C.violet]], C.violet));
  await until(S(34)); await play(new M.Indicate(win, { color: C.amber }), ...say('SAME RULE: THEY CAN FILL UP', C.amber));

  // 35-39 what it is for
  await until(S(35)); await play(...say('WHAT IS IT FOR?', C.green));
  await until(S(36)); await play(new M.Indicate(win, { color: C.green }), ...say('HOW MUCH IT SEES AT ONCE', C.green));
  await until(S(37)); await play(new M.LaggedStart(boxes.slice(0, 6).map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }),
    ...say('PLAN THE BUDGET', C.green), ...fbox(['window    20', 'question   6', 'reserve    8', ['free       6', C.green]], C.green));
  await until(S(38)); await play(...say('KEEP · DROP · LEAVE ROOM', C.green),
    ...fbox([['keep:  new question', C.violet], ['drop:  oldest messages', C.pink], ['leave: 8 for the reply', C.amber]], C.green));
  await until(S(39)); await play(...say('OR: A SHORT SUMMARY', C.green),
    ...fbox(['old messages  10 tokens', ['summary: café open until six', C.green], ['              4 tokens', C.green]], C.green));

  // 40-44 the trap
  await until(S(40)); await play(...say('NOW THE TRAP', C.pink));
  await until(S(41)); await play(...say('DROPPED = GONE', C.pink),
    ...fbox(['dropped:', ['Is the café open ?', C.pink], ['Yes , until six .', C.pink]], C.pink));
  await until(S(42)); await play(...fbox(['new question:', ['Until when is the café open?', C.violet]], C.pink));
  await until(S(42) + 3.2); await play(...say('IT CANNOT SEE “UNTIL SIX”', C.pink),
    ...fbox(['new question:', ['Until when is the café open?', C.violet], ['“until six”: not in the window', C.pink]], C.pink));
  await until(S(43)); await play(...say('IT MAY GUESS WRONG', C.pink));
  await until(S(44)); await play(new M.LaggedStart([...q2b, ...r7].map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.08, runTime: 2.2 }),
    ...say('IT ONLY SEES THE WINDOW', C.amber));

  // 45 recap
  await until(S(45)); await play(...say('RECAP: ONE FIXED BUDGET', C.green),
    ...fbox(['window = 20 tokens', 'earlier + question + reply', ['must fit, or something', C.amber], ['is dropped', C.amber]], C.green));
}

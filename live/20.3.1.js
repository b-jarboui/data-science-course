// 20.3.1 Autoregressive decoding: predict one token, add it, predict again (live lesson, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers: chapters/20.3.md.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const TOK = ['The', 'library', 'will', 'open', 'at', 'ten', '.'];
  const STEP1 = [['at', 45], ['on', 30], ['soon', 15], ['late', 6], ['purple', 4]];
  const STEP2 = [['nine', 40], ['ten', 30], ['noon', 30]];
  const STEP3 = [['"."', 90], ['tomorrow', 10]];
  const COLS = [C.cyan, C.violet, C.amber, C.green, C.pink];
  const ROWY = P ? 1.2 : 0.95, CS = P ? 20 : 24, CH0 = P ? 0.6 : 0.68, GAP = 0.14;
  const BX = P ? -2.0 : -4.6, BL = P ? 5.0 : 7.0, BH = P ? 0.5 : 0.36, BY = P ? -0.5 : -0.35, BG = P ? 1.1 : 0.55;
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.5, 0] : [3.7, -1.1, 0], BOXC = P ? [0, -4.6, 0] : [0, -1.3, 0];
  const BOXS = P ? BOXC : BOXP;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // token cards: one fixed slot per token of the final answer, the prefix grows left to right
  const tw = s => Math.max(CH0 * 0.9, T(s, CS, C.ink, false, true).getWidth() * 0.9 + 0.3);
  const W = TOK.map(tw), ROWW = W.reduce((a, b) => a + b, 0) + GAP * (TOK.length - 1);
  const K = Math.min(1, (FW - (P ? 0.5 : 1.6)) / ROWW), CH = CH0 * K;
  const lefts = W.map((_, i) => -ROWW * K / 2 + (W.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i) * K);
  const lx = i => lefts[i], rx = i => lefts[i] + W[i] * K, cx = i => lefts[i] + W[i] * K / 2;
  function card(s, x0, kind = 'old', y = ROWY) {
    const col = kind === 'bad' ? C.pink : C.cyan, w = tw(s);
    const r = new M.RoundedRectangle({ width: w, height: CH0, cornerRadius: 0.1, color: col, strokeWidth: kind === 'old' ? 2 : 3 });
    r.setFill(kind === 'old' ? C.card : col, kind === 'old' ? 0.95 : 0.22);
    const g = new M.VGroup(r, T(s, CS, kind === 'old' ? C.ink : col, false, true));
    g.scale(K); g.moveTo([x0 + w * K / 2, y, 0]);
    return g;
  }
  function slotQ(x0) {
    const r = new M.Rectangle({ width: CH0, height: CH0, color: C.muted, strokeWidth: 2 }); r.setFill(C.bg, 0.6);
    const g = new M.VGroup(r, T('?', CS, C.muted, false, true));
    g.scale(K); g.moveTo([x0 + CH0 * K / 2, ROWY, 0]);
    return g;
  }
  function bracket(n) {
    const y = ROWY - CH / 2 - 0.14, a = lx(0), b = rx(n - 1);
    const t = T(`PREFIX · ${n} TOKENS`, P ? 17 : 16, C.amber, true); t.moveTo([(a + b) / 2, y - 0.29, 0]);
    return new M.VGroup(new M.Line({ start: [a, y, 0], end: [b, y, 0], color: C.amber, strokeWidth: 2 }),
      new M.Line({ start: [a, y, 0], end: [a, y + 0.1, 0], color: C.amber, strokeWidth: 2 }),
      new M.Line({ start: [b, y, 0], end: [b, y + 0.1, 0], color: C.amber, strokeWidth: 2 }), t);
  }

  // probability bars: token label, bar (width = percent), percent label
  function bars(list, cols) {
    const yAt = k => BY - k * BG, size = P ? 19 : 19;
    const axis = new M.Line({ start: [BX, yAt(0) + BH, 0], end: [BX, yAt(list.length - 1) - BH, 0], color: C.muted, strokeWidth: 2 });
    const labels = list.map(([s], k) => { const t = T(s, size, C.ink, true); t.moveTo([BX - 0.2 - t.getWidth() / 2, yAt(k), 0]); return t; });
    const rects = list.map(([, p], k) => { const c = cols ? cols[k] : C.cyan, w = p / 100 * BL, r = new M.Rectangle({ width: w, height: BH, color: c, strokeWidth: 1 }); r.setFill(c, 0.78); r.moveTo([BX + w / 2, yAt(k), 0]); return r; });
    const pcts = list.map(([, p], k) => { const t = T(p + '%', size, cols ? cols[k] : C.cyan, true); t.moveTo([BX + p / 100 * BL + 0.2 + t.getWidth() / 2, yAt(k), 0]); return t; });
    return { axis, labels, rects, pcts, all: () => [axis, ...labels, ...rects, ...pcts] };
  }
  const dim = (set, keep) => set.rects.forEach((r, k) => { if (k !== keep) { r.setColor(C.muted); r.setFill(C.muted, 0.35); } });

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan, at = BOXP) {
    const size = P ? 20 : 21, lh = P ? 0.4 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const left = at[0] - wd / 2 + 0.35, top = at[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.6 : (at === BOXP ? 5.2 : FW - 2);
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // 0-1 a student asks the campus assistant (a language model)
  const STU = P ? [-2.7, 0.3] : [-5.0, -0.4];
  const head = new M.Circle({ radius: 0.16, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([STU[0], STU[1] + 0.4, 0]);
  const body = new M.Arc({ radius: 0.3, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([STU[0], STU[1] + 0.02, 0]);
  const student = new M.VGroup(head, body);
  const q = T('“When does the library open?”', P ? 19 : 24, C.amber);
  const qmax = FW / 2 - 0.3 - (STU[0] + 0.55); if (q.getWidth() > qmax) q.scale(qmax / q.getWidth());
  q.moveTo([STU[0] + 0.55 + q.getWidth() / 2, STU[1] + 0.25, 0]);
  const AS = P ? [0, -4.4] : [4.6, -0.7];
  const abox = new M.RoundedRectangle({ width: P ? 4.6 : 3.2, height: 1.4, cornerRadius: 0.18, color: C.violet, strokeWidth: 2 });
  abox.setFill(C.card, 0.95); abox.moveTo([AS[0], AS[1], 0]);
  const at1 = T('CAMPUS ASSISTANT', P ? 20 : 20, C.violet, true, true); at1.moveTo([AS[0], AS[1] + 0.25, 0]);
  const at2 = T('predicts the next token', P ? 18 : 17, C.ink); at2.moveTo([AS[0], AS[1] - 0.27, 0]);
  const assistant = new M.VGroup(abox, at1, at2);
  const link = new M.Arrow({ start: [STU[0] + (P ? 1.6 : 1.0), STU[1] - 0.25, 0], end: [AS[0] - (P ? 0 : 1.7), AS[1] + (P ? 0.75 : 0.1), 0], color: C.muted });
  await until(S(0)); await play(new M.FadeIn(student), new M.FadeIn(q), new M.FadeIn(assistant), new M.Create(link), ...say('A STUDENT ASKS THE CAMPUS ASSISTANT', C.amber));
  await until(S(1)); await play(new M.Indicate(assistant, { color: C.violet }), ...say('REMEMBER: A LANGUAGE MODEL', C.violet));

  // 2-3 four words already written
  const written = T('The library will open', P ? 24 : 30, C.ink, false, true); written.moveTo([0, ROWY, 0]);
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(student, q, link)), new M.FadeIn(written), ...say('4 WORDS WRITTEN SO FAR'));
  const dots = T('…', P ? 28 : 34, C.amber, false, true); dots.moveTo([written.getWidth() * 0.45 + 0.4, ROWY, 0]);
  await until(S(3)); await play(new M.FadeIn(dots), ...say('HOW DOES IT WRITE THE REST?', C.amber));

  // 4-7 cards, tokens, prefix
  const cards = [0, 1, 2, 3].map(i => card(TOK[i], lx(i)));
  await until(S(4)); await play(new M.FadeOut(new M.VGroup(written, dots)),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.6 }), ...say('ONE CARD PER WORD'));
  await until(S(5)); await play(new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }), ...say('1 CARD = 1 TOKEN'));
  const demo = T('open → 1 token      . → 1 token', P ? 18 : 20, C.muted, true); demo.moveTo([P ? 0 : -1.2, P ? -1.4 : -1.0, 0]);
  await until(S(6)); await play(new M.FadeIn(demo), ...say('WORD OR MARK = 1 TOKEN', C.muted));
  let brk = bracket(4);
  await until(S(7)); await play(new M.FadeOut(demo), new M.FadeIn(brk), ...say('PREFIX = TOKENS WRITTEN SO FAR', C.amber));

  // 8-9 the model reads the prefix and gives probabilities
  let ph = slotQ(lx(4));
  await until(S(8)); await play(new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }),
    new M.FadeIn(ph), ...say('READ ALL → PROBABILITY PER NEXT TOKEN'));
  await until(S(9)); await play(new M.FadeOut(assistant), ...fbox(['probability = the chance it happens', ['in percent: picks out of 100 tries', C.amber]], C.amber, BOXC),
    ...say('PROBABILITY = TIMES OUT OF 100 TRIES', C.amber));

  // 10-16 five tokens, one bar per sentence
  const b1 = bars(STEP1, COLS);
  await until(S(10)); await play(...unbox(), new M.Create(b1.axis),
    new M.LaggedStart(b1.labels.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.2 }), ...say('5 POSSIBLE NEXT TOKENS'));
  for (let k = 0; k < 5; k++) {
    await until(S(11 + k));
    await play(new M.FadeIn(b1.rects[k], { shift: [0.3, 0, 0] }), new M.FadeIn(b1.pcts[k]));
  }
  await until(S(16)); await play(...fbox(['45 + 30 + 15 + 6 + 4', ['= 100%', C.amber]], C.amber), ...say('TOGETHER: 100%', C.amber));

  // 17-19 sampling: draw one ticket out of 100, coloured like the bars
  const TC = P ? 20 : 10, TR = 100 / TC, TP = P ? 0.3 : 0.22, TS = P ? 0.22 : 0.16;
  const TCEN = P ? [0, -6.0] : [BOXP[0], BOXP[1]];
  const colOf = i => i < 45 ? 0 : i < 75 ? 1 : i < 90 ? 2 : i < 96 ? 3 : 4;
  const tickets = Array.from({ length: 100 }, (_, i) => {
    const c = COLS[colOf(i)], r = new M.Rectangle({ width: TS, height: TS, color: c, strokeWidth: 1 }); r.setFill(c, 0.85);
    r.moveTo([TCEN[0] + (i % TC - (TC - 1) / 2) * TP, TCEN[1] + ((TR - 1) / 2 - Math.floor(i / TC)) * TP, 0]); return r;
  });
  await until(S(17)); await play(...unbox(), new M.LaggedStart(tickets.map(t => new M.FadeIn(t)), { lagRatio: 0.02, runTime: 1.5 }),
    ...say('SAMPLING: DRAW 1 TICKET OUT OF 100'));
  await until(S(18));
  await play(new M.LaggedStart(tickets.slice(0, 45).map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.05, runTime: 2.0 }),
    new M.Indicate(b1.rects[0], { color: C.cyan }), ...say('“AT”: 45 OF 100 TICKETS'));
  await until(S(19)); dim(b1, 0);
  await play(new M.Flash(tickets[22], { color: C.cyan }), new M.Indicate(b1.rects[0], { color: C.cyan }), ...say('THIS TIME: “AT”'));

  // 20-21 add the card, the prefix grows to 5
  const c4 = card('at', lx(4), 'new');
  await until(S(20)); await play(new M.FadeOut(new M.VGroup(...tickets, ph)), new M.FadeIn(c4, { shift: [0, 0.4, 0] }), ...say('ADD THE NEW CARD TO THE END'));
  let nb = bracket(5);
  await until(S(21)); await play(new M.FadeOut(brk), new M.FadeIn(nb), ...say('PREFIX: 5 TOKENS', C.amber)); brk = nb;

  // 22-26 predict again from the longer prefix
  ph = slotQ(lx(5));
  await until(S(22)); await play(new M.FadeOut(new M.VGroup(...b1.all())), new M.FadeIn(ph),
    ...fbox(['read all 5 tokens', ['→ new probabilities', C.amber]], C.amber, BOXC), ...say('KEY MOVE: READ IT ALL, PREDICT AGAIN', C.amber));
  await play(new M.LaggedStart([...cards, c4].map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.5 }));
  const b2 = bars(STEP2);
  await until(S(23)); await play(...unbox(), new M.Create(b2.axis), new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(new M.VGroup(b2.labels[k], b2.rects[k], b2.pcts[k]))),
    { lagRatio: 1, runTime: Math.max(3, E(23) - S(23) - 1.0) }), ...say('NEW PROBABILITIES AFTER “AT”'));
  await until(S(24)); dim(b2, 1);
  await play(new M.Indicate(b2.rects[1], { color: C.cyan }), new M.Indicate(b2.labels[1], { color: C.cyan }), ...say('THIS TIME: “TEN”'));
  await until(S(25)); await play(new M.Indicate(b2.rects[0], { color: C.amber }),
    ...fbox(['ten 30%  <  nine 40%', ['a random draw can still pick it', C.amber]], C.amber, BOXS), ...say('TEN WAS NOT THE TOP TOKEN', C.amber));
  const c5 = card('ten', lx(5), 'new');
  nb = bracket(6);
  await until(S(26)); await play(new M.FadeOut(new M.VGroup(ph, brk)), new M.FadeIn(c5, { shift: [0, 0.4, 0] }), new M.FadeIn(nb), ...say('PREFIX: 6 TOKENS', C.amber)); brk = nb;

  // 27-29 once more: the full stop
  ph = slotQ(lx(6));
  await until(S(27)); await play(new M.FadeOut(new M.VGroup(...b2.all())), ...unbox(), new M.FadeIn(ph), ...say('READ ALL SIX, PREDICT ONCE MORE'));
  await play(new M.LaggedStart([...cards, c4, c5].map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.5 }));
  const b3 = bars(STEP3);
  await until(S(28)); await play(new M.Create(b3.axis), new M.FadeIn(new M.VGroup(...b3.labels, ...b3.rects, ...b3.pcts)), ...say('FULL STOP: 90% → DRAWN'));
  dim(b3, 0); await play(new M.Indicate(b3.rects[0], { color: C.cyan }));
  const c6 = card('.', lx(6), 'new');
  await until(S(29)); await play(new M.FadeOut(new M.VGroup(...b3.all(), ph, brk)), new M.FadeIn(c6, { shift: [0, 0.4, 0] }), ...say('HERE THE FULL STOP ENDS THE ANSWER', C.green));

  // 30-31 end token, the answer
  const ew = tw('END') * K, ey = ROWY - CH - 0.45;
  const endc = card('END', cx(6) - ew / 2, 'new', ey);
  const endl = T('special token = “stop here”', P ? 17 : 17, C.green); endl.moveTo([cx(6) - ew / 2 - 0.25 - endl.getWidth() / 2, ey, 0]);
  await until(S(30)); await play(new M.FadeIn(endc), new M.FadeIn(endl), ...say('REAL MODELS: AN END TOKEN', C.green));
  const row7 = [...cards, c4, c5, c6];
  await until(S(31)); await play(new M.FadeOut(new M.VGroup(endc, endl)),
    new M.LaggedStart(row7.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.15, runTime: 1.8 }),
    ...fbox(['answer to the student:', ['The library will open at ten.', C.green]], C.green, BOXC), ...say('“THE LIBRARY WILL OPEN AT TEN.”', C.green));

  // 32-33 count: three tokens, three predictions, each reads everything before it
  const nums = [4, 5, 6].map(i => { const t = T(String(i - 3), 18, C.amber, true); t.moveTo([cx(i), ROWY - CH / 2 - 0.3, 0]); return t; });
  await until(S(32)); await play(new M.LaggedStart(nums.map(n => new M.FadeIn(n)), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox(['new tokens  = 3', ['predictions = 3', C.amber]], C.amber, BOXC), ...say('3 NEW TOKENS = 3 PREDICTIONS', C.amber));
  const steps = [0, 1, 2].map(k => {
    const y = (P ? -0.5 : -0.25) - k * (P ? 0.9 : 0.45), end = rx(3 + k);
    const ln = new M.Line({ start: [lx(0), y, 0], end: [end, y, 0], color: C.amber, strokeWidth: 3 });
    const ar = new M.Arrow({ start: [end, y, 0], end: [cx(4 + k), ROWY - CH / 2 - 0.05, 0], color: C.cyan });
    const lb = T(`reads ${4 + k}`, P ? 17 : 15, C.amber, true); lb.moveTo([lx(0) + 0.1 + lb.getWidth() / 2, y - 0.22, 0]);
    return new M.VGroup(ln, ar, lb);
  });
  await until(S(33)); await play(new M.FadeOut(new M.VGroup(...nums)), ...fbox(['each prediction reads', ['everything written before it', C.amber]], C.cyan, BOXC),
    new M.LaggedStart(steps.map(g => new M.FadeIn(g)), { lagRatio: 1, runTime: Math.max(3, E(33) - S(33) - 1.0) }), ...say('EACH STEP READS EVERYTHING BEFORE IT'));

  // 34-38 the name and the loop
  const NAME = ['autoregressive decoding', C.green];
  await until(S(34)); await play(new M.FadeOut(new M.VGroup(...steps)), ...fbox([NAME], C.green, BOXC), ...say('AUTOREGRESSIVE DECODING', C.green));
  await until(S(35)); await play(...fbox([NAME, 'decoding = probabilities → text'], C.green, BOXC), ...say('DECODING: PROBABILITIES → TEXT', C.green));
  await until(S(36)); await play(...fbox([NAME, 'decoding = probabilities → text', 'autoregressive = each token depends', '      on the tokens already written'], C.green, BOXC),
    ...say('EACH TOKEN DEPENDS ON TOKENS SO FAR', C.green));
  const LOOP = ['1. predict one token', '2. add it to the prefix', '3. predict again from the', '   longer prefix'];
  await until(S(37)); await play(...fbox(LOOP, C.cyan, BOXC), ...say('THE LOOP IN WORDS'));
  await until(S(38)); await play(...fbox([...LOOP, ['repeat until END token', C.amber], ['or a length limit', C.amber]], C.cyan, BOXC), ...say('REPEAT UNTIL END OR LENGTH LIMIT', C.amber));

  // 39-42 what it is for, and the choice of how to pick
  await until(S(39)); await play(new M.LaggedStart(row7.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.4, runTime: 3.0 }),
    ...say('HOW A LANGUAGE MODEL WRITES ANY TEXT', C.green));
  const b4 = bars(STEP1);
  await until(S(40)); await play(...unbox(), new M.Create(b4.axis), new M.LaggedStart([0, 1, 2, 3, 4].map(k => new M.FadeIn(new M.VGroup(b4.labels[k], b4.rects[k], b4.pcts[k]))),
    { lagRatio: 0.2, runTime: 1.6 }), ...say('HOW WE PICK EACH TOKEN = A CHOICE', C.violet));
  await until(S(41)); await play(...say('NEXT LESSONS COMPARE THE CHOICES', C.violet));
  const d42 = E(42) - S(42);
  await until(S(42)); await play(...fbox(['· always take the top token', '· keep several options', '· change how the draw works'], C.violet),
    new M.Indicate(b4.rects[0], { color: C.cyan }));
  await until(S(42) + d42 * 0.4); await play(new M.LaggedStart([0, 1].map(k => new M.Indicate(b4.rects[k], { color: C.cyan })), { lagRatio: 0.3, runTime: 1.2 }));
  await until(S(42) + d42 * 0.7); await play(new M.LaggedStart(b4.rects.map(r => new M.Indicate(r, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }));

  // 43-47 the trap: no plan, one unlucky token steers the rest
  await until(S(43)); await play(new M.FadeOut(new M.VGroup(...b4.all())), ...unbox(), ...say('A COMMON TRAP', C.pink));
  const xa = lx(0) - 0.15, xb = rx(6) + 0.15, y0 = ROWY - CH / 2 - 0.15, y1 = ROWY + CH / 2 + 0.15;
  const planLabel = T('planned first?', P ? 18 : 20, C.pink); planLabel.moveTo([0, y0 - 0.35, 0]);
  const plan = new M.VGroup(new M.DashedLine({ start: [xa, y0, 0], end: [xb, y0, 0], color: C.pink }), new M.DashedLine({ start: [xa, y1, 0], end: [xb, y1, 0], color: C.pink }),
    new M.DashedLine({ start: [xa, y0, 0], end: [xa, y1, 0], color: C.pink }), new M.DashedLine({ start: [xb, y0, 0], end: [xb, y1, 0], color: C.pink }), planLabel);
  await until(S(44)); await play(new M.FadeIn(plan), ...fbox(['myth: the model plans', '      the whole sentence first'], C.pink, BOXC), ...say('PLANS THE WHOLE SENTENCE FIRST?', C.pink));
  await until(S(45)); await play(new M.FadeOut(plan), new M.LaggedStart([c4, c5, c6].map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.5, runTime: 2.5 }),
    ...fbox(['no plan: once added, a token stays', ['every later prediction builds on it', C.amber]], C.cyan, BOXC), ...say('NO: ONCE ADDED, A TOKEN STAYS'));
  const cp = card('purple', lx(4), 'bad');
  ph = slotQ(lx(4) + (tw('purple') + GAP) * K);
  await until(S(46)); await play(new M.FadeOut(new M.VGroup(c4, c5, c6)), new M.FadeIn(cp, { shift: [0, 0.4, 0] }), new M.FadeIn(ph),
    ...fbox(['if the draw had picked “purple”:', ['The library will open purple …', C.pink]], C.pink, BOXC), ...say('IF IT HAD DRAWN “PURPLE”…', C.pink));
  await until(S(47)); await play(new M.Indicate(cp, { color: C.pink }), new M.Indicate(ph, { color: C.pink }), ...say('ONE UNLUCKY TOKEN STEERS THE REST', C.pink));

  // 48 recap
  const fresh = [4, 5, 6].map(i => card(TOK[i], lx(i), 'new'));
  await until(S(48)); await play(new M.FadeOut(new M.VGroup(cp, ph)), new M.LaggedStart(fresh.map(c => new M.FadeIn(c)), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox(['predict one token', 'add it to the prefix', ['predict again from', C.amber], ['everything so far', C.amber]], C.green, BOXC), ...say('RECAP: ONE TOKEN AT A TIME', C.green));
}

// 20.3.10 Inference batching: one shared step for many requests (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers from chapters/20.3.md.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.4;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.55, 0] : [4.3, -0.3, 0];
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
    const maxw = P ? FW - 0.6 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // students and the machine
  const CROWD_Y = P ? 0.6 : 0.5, MY = P ? -1.8 : -1.0, GAP = P ? 0.85 : 0.8;
  function crowd(qmarks) {
    return Array.from({ length: 8 }, (_, k) => {
      const x = CX + (k - 3.5) * GAP;
      const head = new M.Circle({ radius: 0.14, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, CROWD_Y + 0.36, 0]);
      const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, CROWD_Y + 0.02, 0]);
      const parts = [head, body];
      if (qmarks) parts.push(T('?', 22, C.amber, false, true).moveTo([x, CROWD_Y + 0.78, 0]));
      return new M.VGroup(...parts);
    });
  }
  function machine() {
    const r = new M.RoundedRectangle({ width: 2.8, height: 0.9, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([CX, MY, 0]);
    const t = T('1 MACHINE', 20, C.violet, true, true); t.moveTo([CX, MY, 0]);
    return new M.VGroup(r, t);
  }
  const links = () => Array.from({ length: 8 }, (_, k) => new M.Line({ start: [CX + (k - 3.5) * GAP, CROWD_Y - 0.2, 0],
    end: [CX + (k - 3.5) * 0.3, MY + 0.47, 0], color: C.muted, strokeWidth: 1.5 }));

  // time axis in milliseconds and step blocks on it
  const AX0 = P ? -2.2 : -5.4, AX1 = P ? 3.6 : 1.6, AXY = P ? -3.4 : -2.2, LBX = P ? -3.05 : -6.2;
  function axis(max, every) {
    const sx = v => AX0 + v / max * (AX1 - AX0);
    const ln = new M.Line({ start: [AX0, AXY, 0], end: [AX1, AXY, 0], color: C.muted, strokeWidth: 3 });
    const parts = [];
    for (let v = 0; v <= max; v += every) parts.push(
      new M.Line({ start: [sx(v), AXY - 0.07, 0], end: [sx(v), AXY + 0.07, 0], color: C.muted }),
      T(String(v), P ? 17 : 17, C.muted, true).moveTo([sx(v), AXY - 0.34, 0]));
    parts.push(T('milliseconds (ms)', P ? 17 : 17, C.muted).moveTo([(AX0 + AX1) / 2, AXY - 0.74, 0]));
    return { sx, ln, parts };
  }
  const BH = P ? 0.46 : 0.34;
  function stepBlock(sx, t0, dur, ys, color = C.cyan, pad = 0.03) {
    const x0 = sx(t0) + pad, x1 = sx(t0 + dur) - 0.03, top = Math.max(...ys) + BH / 2, bot = Math.min(...ys) - BH / 2;
    const r = new M.Rectangle({ width: x1 - x0, height: top - bot, color, strokeWidth: 2 });
    r.setFill(color, 0.25); r.moveTo([(x0 + x1) / 2, (top + bot) / 2, 0]);
    const dots = ys.map(y => new M.Dot({ point: [(x0 + x1) / 2, y, 0], radius: 0.08, color }));
    return new M.VGroup(r, ...dots);
  }
  const lab = (s, y, c = C.muted) => T(s, P ? 16 : 17, c).moveTo([LBX, y, 0]);

  // 0-1 many students, one machine
  const ppl = crowd(true);
  await until(S(0)); await play(new M.LaggedStart(ppl.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 1.4 }), ...fbox(['many students', ['ask at once', C.amber]], C.amber), ...say('MANY QUESTIONS AT ONCE', C.amber));
  const mac = machine(), lk = links();
  await until(S(1)); await play(new M.FadeIn(mac), new M.LaggedStart(lk.map(l => new M.Create(l)), { lagRatio: 0.1, runTime: 1.2 }),
    ...say('1 MACHINE: SERVE THEM ALL QUICKLY?', C.violet));

  // 2 one decoding step = one next token
  const preY = P ? -0.6 : 0.3, gx = CX - 0.6;
  const pre = T('The library will open', P ? 24 : 28, C.ink);
  pre.moveTo([gx, preY, 0]);
  const tx = gx + pre.getWidth() / 2 + 0.65;
  const tokR = new M.RoundedRectangle({ width: 0.9, height: 0.6, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 });
  tokR.setFill(C.cyan, 0.15); tokR.moveTo([tx, preY, 0]);
  const tokT = T('at', P ? 24 : 28, C.cyan, false, true); tokT.moveTo([tx, preY, 0]);
  const tok = new M.VGroup(tokR, tokT);
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(...ppl, mac, ...lk)), new M.FadeIn(pre), ...fbox(['1 decoding step', ['= 1 next token', C.cyan]]), ...say('1 DECODING STEP = 1 NEXT TOKEN'));
  await play(new M.FadeIn(tok), new M.Flash(tok, { color: C.cyan, flashRadius: 0.6 }));

  // 3 milliseconds
  let ax = axis(100, 25);
  await until(S(3)); await play(new M.FadeOut(new M.VGroup(pre, tok)), new M.Create(ax.ln), new M.FadeIn(new M.VGroup(...ax.parts)), ...fbox(['1 ms = 1 thousandth', ['of a second', C.cyan]]),
    ...say('1 ms = 1 THOUSANDTH OF A SECOND'));

  // 4-5 alone: 20 ms per step, 50 tokens per second
  const ROW1 = P ? 0.95 : 1.0, rowB = k => (P ? -0.25 : 0.05) - k * (P ? 0.72 : 0.48);
  const aloneLab = lab('alone', ROW1, C.ink);
  const alone = [0, 1, 2, 3, 4].map(i => stepBlock(ax.sx, i * 20, 20, [ROW1]));
  const ms20 = T('20 ms', P ? 17 : 17, C.cyan, true).moveTo([ax.sx(10), ROW1 + 0.42, 0]);
  await until(S(4)); await play(new M.FadeIn(aloneLab), new M.FadeIn(alone[0]), new M.FadeIn(ms20), ...fbox(['alone:', ['1 step = 20 ms', C.cyan]]), ...say('ALONE: 1 STEP = 20 ms'));
  await until(S(5)); await play(new M.LaggedStart(alone.slice(1).map(b => new M.FadeIn(b)), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['1 second = 1000 ms', '1000 ÷ 20 = 50 steps', ['= 50 tokens per second', C.amber]]), ...say('5 TOKENS IN 100 ms'));

  // 6-8 four students in one shared step of 25 ms
  await until(S(6)); await play(...say('A SURPRISE', C.violet));
  const rowLabs = [0, 1, 2, 3].map(k => lab(`student ${k + 1}`, rowB(k), C.ink));
  const ys = [0, 1, 2, 3].map(rowB);
  const batch = [0, 1, 2, 3].map(i => stepBlock(ax.sx, i * 25, 25, ys));
  await until(S(7)); await play(...fbox(['4 students:', ['1 shared step', C.violet]], C.violet), new M.FadeIn(new M.VGroup(...rowLabs)), new M.FadeIn(batch[0]), ...say('4 STUDENTS, 1 SHARED STEP', C.violet));
  const ms25 = T('25 ms', P ? 17 : 17, C.violet, true).moveTo([ax.sx(12.5), rowB(0) + (P ? 0.5 : 0.45), 0]);
  await until(S(8)); await play(new M.FadeIn(ms25), new M.Indicate(ms20, { color: C.amber }), ...say('25 ms: ONLY A LITTLE MORE THAN 20', C.violet));

  // 9-10 why: the weights are read once
  await until(S(9)); await play(...fbox(['weights = learned numbers', ['read from memory', C.violet], ['= much of each step', C.violet]], C.violet),
    ...say('WHERE DOES THE TIME GO?', C.violet));
  await until(S(10)); await play(new M.Indicate(batch[0], { color: C.violet }), ...say('WEIGHTS READ ONCE → USED FOR ALL 4', C.violet));

  // 11-14 forty steps, four tokens each, 160 per second
  await until(S(11)); await play(new M.LaggedStart(batch.slice(1).map(b => new M.FadeIn(b)), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['1 second = 1000 ms', ['1000 ÷ 25 = 40 steps', C.amber]]), ...say('4 SHARED STEPS IN 100 ms'));
  await until(S(12)); await play(new M.LaggedStart(batch[0].submobjects.slice(1).map(d => new M.Flash(d, { color: C.cyan })), { lagRatio: 0.25, runTime: 1.4 }),
    ...say('EACH STEP: 4 TOKENS, 1 PER STUDENT'));
  await until(S(13)); await play(...fbox(['40 steps × 4 tokens', ['= 160 tokens per second', C.amber]]), ...say('160 TOKENS PER SECOND', C.amber));
  await until(S(14)); await play(...fbox(['alone: 50 per second', 'batch of 4:', '  160 per second', ['160 > 3 × 50 = 150', C.amber]]),
    ...say('MORE THAN 3 TIMES AS MUCH', C.amber));

  // 15-17 the names
  await until(S(15)); await play(new M.LaggedStart(batch.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }),
    ...say('BATCHING = GROUP REQUESTS INTO 1 STEP', C.green));
  await until(S(16)); await play(new M.LaggedStart(rowLabs.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('EACH QUESTION = A REQUEST', C.green));
  const bx0 = LBX - (P ? 0.55 : 0.72), bx1 = AX1 + 0.12, by0 = rowB(3) - 0.27, by1 = rowB(0) + 0.27;
  const batchBox = new M.Rectangle({ width: bx1 - bx0, height: by1 - by0, color: C.green, strokeWidth: 2 });
  batchBox.moveTo([(bx0 + bx1) / 2, (by0 + by1) / 2, 0]);
  await until(S(16) + 2.0); await play(new M.Create(batchBox), ...say('THE GROUP = A BATCH', C.green));
  await until(S(17)); await play(new M.FadeOut(batchBox), ...say('THROUGHPUT = TOKENS PER SECOND', C.green));

  // 18-20 the formula in words, twice
  await until(S(18)); await play(...fbox(['throughput =', '  tokens per step', '  ÷ time per step'], C.green));
  await until(S(19)); await play(new M.Indicate(alone[0], { color: C.amber }), ...fbox(['alone:', '  1 token ÷ 20 ms', ['  = 50 per second', C.amber]], C.green));
  await until(S(20)); await play(new M.Indicate(batch[0], { color: C.amber }), ...fbox(['batch of 4:', '  4 tokens ÷ 25 ms', ['  = 160 per second', C.amber]], C.green));

  // 21-22 arrivals on a timeline
  await until(S(21)); await play(new M.FadeOut(new M.VGroup(ax.ln, ...ax.parts, aloneLab, ...alone, ms20, ms25, ...rowLabs, ...batch)), ...unbox(),
    ...say('BUT STUDENTS ARRIVE AT DIFFERENT TIMES', C.amber));
  ax = axis(60, 10);
  const QY = k => (P ? 0.7 : 0.9) - k * (P ? 0.95 : 0.6);
  const qLabs = [0, 1, 2, 3].map(k => lab(`student ${k + 1}`, QY(k), C.ink));
  const guides = [0, 1, 2, 3].map(k => new M.Line({ start: [AX0, QY(k), 0], end: [AX1, QY(k), 0], color: C.grid, strokeWidth: 1 }));
  await until(S(22)); await play(new M.Create(ax.ln), new M.FadeIn(new M.VGroup(...ax.parts, ...qLabs, ...guides)), ...say('4 STUDENTS ON A TIMELINE'));

  // 23 they ask at 0, 10, 20, 30 ms
  const ARR = [0, 10, 20, 30], arrDots = [];
  for (let k = 0; k < 4; k++) {
    await until(S(23) + k * 2.2);
    const d = new M.Dot({ point: [ax.sx(ARR[k]), QY(k), 0], radius: 0.13, color: C.cyan });
    arrDots.push(d);
    await play(new M.FadeIn(d), new M.Flash(d, { color: C.cyan }), ...say(`STUDENT ${k + 1} ASKS AT ${ARR[k]} ms`));
  }

  // 24 the batch starts at 30 ms
  const startLine = new M.DashedLine({ start: [ax.sx(30), QY(0) + 0.4, 0], end: [ax.sx(30), QY(3) + 0.22, 0], color: C.amber });
  const qStep = stepBlock(ax.sx, 30, 25, [0, 1, 2, 3].map(QY), C.cyan, 0.2);
  await until(S(24)); await play(new M.Create(startLine), ...say('WAIT FOR STUDENT 4 → START AT 30 ms', C.amber));
  await play(new M.FadeIn(qStep));

  // 25 each one's wait
  const waits = [], waitLabs = [];
  for (let k = 0; k < 4; k++) {
    await until(S(25) + k * 1.75);
    const w = 30 - ARR[k], y = QY(k), t = T(`${w} ms`, P ? 17 : 17, C.amber, true);
    waitLabs.push(t);
    if (w) {
      const bar = new M.Line({ start: [ax.sx(ARR[k]) + 0.15, y, 0], end: [ax.sx(30) - 0.05, y, 0], color: C.amber, strokeWidth: 6 });
      waits.push(bar);
      t.moveTo([(ax.sx(ARR[k]) + ax.sx(30)) / 2, y + 0.3, 0]);
      await play(new M.Create(bar), new M.FadeIn(t), ...say(`STUDENT ${k + 1} WAITS ${w} ms`, C.amber));
    } else {
      t.moveTo([ax.sx(30) - 0.6, y + 0.3, 0]);
      await play(new M.FadeIn(t), ...say('STUDENT 4 WAITS 0 ms', C.amber));
    }
  }

  // 26-28 total, average, the name
  await until(S(26)); await play(...fbox(['30 + 20 + 10 + 0', ['= 60 ms of waiting', C.amber]], C.amber), ...say('60 ms SHARED BY 4 STUDENTS', C.amber));
  await until(S(27)); await play(...fbox(['60 ÷ 4 = 15', ['average wait = 15 ms', C.amber]], C.amber));
  await until(S(28)); await play(new M.LaggedStart(waits.map(w => new M.Indicate(w, { color: C.amber })), { lagRatio: 0.25, runTime: 1.4 }),
    ...say('QUEUING DELAY = WAITING IN LINE', C.amber));

  // 29-31 the trade
  const CW = P ? 6.4 : 4.4, CH = P ? 2.3 : 2.4;
  const cardAt = P ? [[0, 0.1], [0, -2.8]] : [[-2.5, -0.5], [2.5, -0.5]];
  function card([x, y], title, color) {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.2, color, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([x, y, 0]);
    const t = T(title, 18, color, true, true).moveTo([x, y + CH / 2 - 0.38, 0]);
    return new M.VGroup(r, t);
  }
  const cardText = ([x, y], small, big, color) => [T(small, 20, color).moveTo([x, y + 0.12, 0]), T(big, 32, color, true, true).moveTo([x, y - 0.55, 0])];
  const gain = card(cardAt[0], 'GAIN', C.green), cost = card(cardAt[1], 'COST', C.pink);
  await until(S(29)); await play(new M.FadeOut(new M.VGroup(ax.ln, ...ax.parts, ...qLabs, ...guides, ...arrDots, startLine, qStep, ...waits, ...waitLabs)),
    ...unbox(), new M.FadeIn(gain), new M.FadeIn(cost), ...say('BATCHING IS A TRADE', C.violet));
  const gainTxt = cardText(cardAt[0], 'tokens per second', '50 → 160', C.green);
  await until(S(30)); await play(new M.FadeIn(new M.VGroup(...gainTxt)), ...say('MANY MORE TOKENS PER SECOND', C.green));
  const costTxt = cardText(cardAt[1], 'wait before the first token', 'average 15 ms', C.pink);
  await until(S(31)); await play(new M.FadeIn(new M.VGroup(...costTxt)), ...say('BUT A LITTLE WAITING FIRST', C.pink));

  // 32-33 what it is for
  await until(S(32)); await play(...say('WHAT IS IT FOR?'));
  const ppl2 = crowd(false), mac2 = machine(), lk2 = links();
  await until(S(33)); await play(new M.FadeOut(new M.VGroup(gain, cost, ...gainTxt, ...costTxt)), ...say('1 MACHINE, MANY PEOPLE → CHEAPER ANSWERS', C.green));
  await play(new M.LaggedStart(ppl2.map(p => new M.FadeIn(p)), { lagRatio: 0.1, runTime: 1.2 }), new M.FadeIn(mac2),
    new M.LaggedStart(lk2.map(l => new M.Create(l)), { lagRatio: 0.1, runTime: 1.2 }));

  // 34 the two choices: batch size and longest wait
  const SY = P ? -3.2 : -2.2, SCX = P ? -1.6 : CX - 1.1, SS = 0.5;
  const slotAt = (k, n = 4, pitch = 0.65, cx = SCX) => [cx + (k - (n - 1) / 2) * pitch, SY, 0];
  const outline = (p, size, color = C.cyan) => { const r = new M.Rectangle({ width: size, height: size, color, strokeWidth: 2 }); r.moveTo(p); return r; };
  const filled = (p, size, color = C.cyan) => { const r = new M.Rectangle({ width: size, height: size, color, strokeWidth: 1 }); r.setFill(color, 0.82); r.moveTo(p); return r; };
  const slots = [0, 1, 2, 3].map(k => outline(slotAt(k), SS));
  const TX0 = SCX + 1.6, TX1 = TX0 + (P ? 3.2 : 2.6);
  const track = new M.Line({ start: [TX0, SY, 0], end: [TX1, SY, 0], color: C.line, strokeWidth: 6 });
  const sLab = T('batch size 4', 17, C.muted).moveTo([SCX, SY - 0.5, 0]);
  const tLab = T('longest wait', 17, C.muted).moveTo([(TX0 + TX1) / 2, SY - 0.5, 0]);
  await until(S(34)); await play(new M.FadeIn(new M.VGroup(...slots, track, sLab, tLab)),
    ...fbox(['builders choose:', '  batch size', '  longest wait']), ...say('CHOOSE: BATCH SIZE + LONGEST WAIT'));

  // 35 the rule: full, or the wait runs out
  const fills = [0, 1, 2, 3].map(k => filled(slotAt(k), SS - 0.14));
  const timer = new M.Line({ start: [TX0, SY, 0], end: [TX1, SY, 0], color: C.amber, strokeWidth: 6 });
  await until(S(35)); await play(new M.LaggedStart(fills.map(f => new M.FadeIn(f)), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['start the batch when', '  it is full', '  OR the wait runs out'], C.amber), ...say('FULL → START', C.amber));
  await until(S(35) + 3.0); await play(new M.FadeOut(new M.VGroup(fills[2], fills[3])), ...say('OR: WAIT RUNS OUT → START', C.amber));
  await play(new M.Create(timer, { runTime: 1.6 }));
  fills.length = 2;

  // 36 a new request joins between two steps
  const joiner = filled(slotAt(2), SS - 0.14, C.green);
  await until(S(36)); await play(...say('NEW REQUEST JOINS BETWEEN 2 STEPS', C.green));
  await play(new M.FadeIn(joiner), new M.Flash(joiner, { color: C.green, flashRadius: 0.45 }));

  // 37-39 the trap: a big batch with few students online
  await until(S(37)); await play(...unbox(), ...say('THE TRAP', C.pink));
  await until(S(38)); await play(...say('BIGGER IS NOT ALWAYS BETTER', C.pink));
  const big = Array.from({ length: 12 }, (_, k) => outline(slotAt(k, 12, 0.48, CX), 0.4, C.pink));
  const bigFill = [0, 1].map(k => filled(slotAt(k, 12, 0.48, CX), 0.28));
  const waitLong = new M.Line({ start: [slotAt(0, 12, 0.48, CX)[0] - 0.2, SY - 0.5, 0], end: [slotAt(11, 12, 0.48, CX)[0] + 0.2, SY - 0.5, 0],
    color: C.pink, strokeWidth: 6 });
  await until(S(39)); await play(new M.FadeOut(new M.VGroup(...slots, ...fills, joiner, timer, track, sLab, tLab, ...ppl2.slice(2), ...lk2.slice(2))),
    ...say('FEW STUDENTS ONLINE', C.pink));
  await play(new M.FadeIn(new M.VGroup(...big, ...bigFill)), ...say('BIG BATCH FILLS SLOWLY → LONG WAIT', C.pink));
  await play(new M.Create(waitLong, { runTime: 2.4 }));

  // 40-41 slower steps; throughput is not a fast reply
  await until(S(40)); await play(...fbox(['1 request:  20 ms', '4 requests: 25 ms', ['bigger batch', C.pink], ['→ slower step', C.pink]], C.pink),
    ...say('MORE WORK IN EACH STEP', C.pink));
  await until(S(41)); await play(new M.Indicate(mac2, { color: C.pink }), ...say('HIGH THROUGHPUT ≠ FAST REPLY FOR EACH', C.pink));

  // 42 recap
  const gain2 = card(cardAt[0], 'GAIN: SHARED STEPS', C.green), cost2 = card(cardAt[1], 'COST: SOME WAITING', C.pink);
  const g2 = cardText(cardAt[0], 'tokens per second', '50 → 160', C.green), c2 = cardText(cardAt[1], 'wait before the first token', 'average 15 ms', C.pink);
  await until(S(42)); await play(new M.FadeOut(new M.VGroup(...big, ...bigFill, waitLong, ...ppl2.slice(0, 2), ...lk2.slice(0, 2), mac2)), ...unbox(),
    new M.FadeIn(new M.VGroup(gain2, cost2, ...g2, ...c2)), ...say('BATCHING: SHARED STEPS, MORE TOKENS, SOME WAIT', C.green));
}

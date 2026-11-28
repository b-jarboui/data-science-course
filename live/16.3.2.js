// 16.3.2 Training–serving skew. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.65, 0] : [4.3, -0.3, 0];
  const LX = P ? -3.2 : -5.7;
  const enter = o => new M.FadeIn(o, { runTime: 0.4 });
  const leave = o => new M.FadeOut(o, { runTime: 0.3 });
  const emph = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.6 });

  function label(text, x, y, maxW, color = C.ink, size = 20, mono = false) {
    const t = T(text, size, color, mono, true);
    if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    t.moveTo([x, y, 0]); return t;
  }
  function leftLabel(text, x, y, color = C.ink, size = 20, mono = false) {
    const t = T(text, size, color, mono, true); t.moveTo([x + t.getWidth() / 2, y, 0]); return t;
  }
  function rect(x, y, w, h, color, fill, sw = 2) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.13, color, strokeWidth: sw });
    if (fill) r.setFill(fill, 0.95); r.moveTo([x, y, 0]); return r;
  }
  let pillNow = null;
  function say(text, color = C.cyan) {
    const p = pill(text, color, P ? 18 : 19);
    const maxW = P ? FW - 0.8 : 7.25;
    if (p.getWidth() > maxW) p.scale(maxW / p.getWidth());
    p.moveTo(PILL);
    const a = pillNow ? [leave(pillNow)] : []; pillNow = p; a.push(enter(p)); return a;
  }
  let boxNow = null;
  function setBox(g) { const a = [enter(g)]; if (boxNow) a.push(leave(boxNow)); boxNow = g; return a; }
  function clearBox() { const a = boxNow ? [leave(boxNow)] : []; boxNow = null; return a; }
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    return setBox(g);
  }
  function card(name, route, x, y, w = 3.2) {
    const rc = route === 'North' ? C.cyan : C.pink;
    const box = rect(x, y, w, 0.72, C.line, C.card);
    const icon = rect(x - w / 2 + 0.38, y, 0.36, 0.32, rc, C.card, 1.5);
    const tape = new M.Line({ start: [x - w / 2 + 0.38, y + 0.15, 0], end: [x - w / 2 + 0.38, y + 0.02, 0], color: rc, strokeWidth: 2 });
    const nm = leftLabel(name, x - w / 2 + 0.75, y, C.ink, 21);
    const tagT = T(route, 16, rc, true, true);
    const tag = new M.VGroup(rect(x + w / 2 - 0.62, y, 0.98, 0.38, rc, C.bg, 1.5), tagT);
    tagT.moveTo([x + w / 2 - 0.62, y, 0]);
    return new M.VGroup(box, icon, tape, nm, tag);
  }
  const arrow = (a, b, color = C.muted) => new M.Arrow({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color, strokeWidth: 2.5 });
  function numTag(text, x, y, color) {
    const t = T(text, 20, color, true, true);
    return new M.VGroup(rect(x, y, Math.max(0.7, t.getWidth() + 0.3), 0.46, color, C.bg, 1.8), t.moveTo([x, y, 0]));
  }

  // 0-3 Nell and her wait
  const CARD = P ? [-1.4, 1.3] : [CX - 1.6, 0.9];
  const nell = card('Nell', 'North', ...CARD);
  await until(S(0)); await play(enter(nell), ...say('GETTING NELL READY'));
  const waitT = leftLabel('Loading wait: 2 min', LX, P ? 0.35 : -0.05, C.amber, 20);
  await until(S(1)); await play(enter(waitT), ...say('NELL WAITS 2 MINUTES', C.amber));
  const LBP = P ? [0, -1.1] : [CX + 1.6, -0.05];
  const lateBox = new M.VGroup(rect(LBP[0], LBP[1], P ? 4.2 : 2.9, 0.95, C.cyan, C.card),
    label('chance of', LBP[0], LBP[1] + 0.2, null, C.ink, 18), label('LATE delivery', LBP[0], LBP[1] - 0.2, null, C.cyan, 19, true));
  const waitArr = P ? arrow([-1.6, 0.05], [-0.6, -0.55], C.muted) : arrow([LX + 2.75, -0.05], [LBP[0] - 1.5, -0.05], C.muted);
  const wrongQ = label('wrong number?', LBP[0], LBP[1] - (P ? 0.85 : 0.8), null, C.pink, 19, true);
  await until(S(2)); await play(emph(waitT), enter(waitArr), enter(lateBox), ...say('WAIT → CHANCE OF LATE DELIVERY'));
  await until(S(3)); await play(enter(wrongQ), ...say('WHAT IF THE MODEL GETS THE WRONG NUMBER?', C.pink));

  // 4-11 a stopwatch: 2 minutes = 120 seconds
  const SW = P ? [2.3, 1.3] : [CX + 2.0, 0.9], r = 0.45;
  const face = new M.Circle({ radius: r, color: C.amber, strokeWidth: 2.5 }); face.setFill(C.card, 0.95); face.moveTo([SW[0], SW[1], 0]);
  const knob = rect(SW[0], SW[1] + r + 0.08, 0.2, 0.12, C.amber, C.amber, 1);
  const hand = new M.Line({ start: [SW[0], SW[1], 0], end: [SW[0], SW[1] + 0.8 * r, 0], color: C.ink, strokeWidth: 3 });
  let read = label('0 min', SW[0], SW[1] - r - 0.3, null, C.amber, 18, true);
  await until(S(4)); await play(leave(waitT), leave(waitArr), leave(lateBox), leave(wrongQ), enter(face), enter(knob), enter(hand), enter(read), ...say('NELL NEXT TO A CLOCK'));
  await until(S(5)); await play(new M.Flash(face, { color: C.green }), ...say('THE CLOCK STARTS', C.green));
  const read2 = label('2 min', SW[0], SW[1] - r - 0.3, null, C.amber, 18, true);
  await until(S(6)); await play(new M.Rotate(hand, { angle: -4 * Math.PI, aboutPoint: [SW[0], SW[1], 0], runTime: 1.2 }), leave(read), enter(read2), ...say('STOP AFTER 2 MINUTES', C.amber));
  read = read2;
  const BW = P ? 2.6 : 2.8, BH = 0.42, bx = LX + 1.6 + BW / 2;
  const by1 = P ? 0.2 : -0.2, by2 = P ? -0.5 : -0.9;
  const bar = (y, c) => { const b = new M.Rectangle({ width: BW, height: BH, color: c, strokeWidth: 1.5 }); b.setFill(c, 0.45); b.moveTo([bx, y, 0]); return b; };
  const min1 = new M.VGroup(leftLabel('minute 1', LX, by1, C.ink, 17), bar(by1, C.cyan), label('60 seconds', bx, by1, BW - 0.2, C.ink, 17, true));
  const min2 = new M.VGroup(leftLabel('minute 2', LX, by2, C.ink, 17), bar(by2, C.violet), label('60 seconds', bx, by2, BW - 0.2, C.ink, 17, true));
  await until(S(7)); await play(...fbox(['1 minute = 60 seconds'], C.cyan), ...say('EACH MINUTE = 60 SECONDS'));
  await until(S(8)); await play(enter(min1));
  await until(S(9)); await play(enter(min2));
  const sumT = leftLabel('60 + 60 = 120 seconds', LX, P ? -1.25 : -1.65, C.amber, 21, true);
  await until(S(10)); await play(enter(sumT), ...say('60 + 60 = 120 SECONDS', C.amber));
  await until(S(11)); await play(...fbox(['2 minutes', ['= 120 seconds', C.amber], ['the same wait', C.green]], C.green), ...say('SAME WAIT, TWO WAYS TO WRITE IT', C.green));

  // 12-30 two paths to the model
  const MX = P ? 2.4 : CX + 2.3, MY = P ? 0.25 : -0.4, MW = P ? 1.5 : 1.6;
  const Y1 = P ? 1.25 : 0.7, Y2 = P ? -0.75 : -1.5;
  const xs = LX + 0.05, xe = MX - MW / 2 - 0.08;
  const e1 = [xe, MY + 0.22], e2 = [xe, MY - 0.22];
  const along = (y, e, f) => [xs + (e[0] - xs) * f, y + (e[1] - y) * f];
  const model = new M.VGroup(rect(MX, MY, MW, 0.9, C.violet, C.card), label('MODEL', MX, MY, MW - 0.2, C.violet, 21, true));
  const path1 = arrow([xs, Y1], e1, C.cyan), path2 = arrow([xs, Y2], e2, C.pink);
  const name1 = leftLabel('TRAINING path', xs, Y1 + 0.38, C.cyan, 17, true);
  const name2 = leftLabel('SERVING path', xs, Y2 - 0.38, C.pink, 17, true);
  await until(S(12));
  await play(...[nell, face, knob, hand, read, min1, min2, sumT].map(leave), ...clearBox(), enter(model), ...say('TWO PATHS INTO THE MODEL', C.violet));
  await until(S(13)); await play(new M.Create(path1), enter(name1), ...say('PATH 1: WHEN THE MODEL LEARNS', C.cyan));
  await until(S(14)); await play(...fbox(['Training', ['teaching a model', C.muted], ['from past examples', C.muted]], C.cyan));
  const expT = label('expects minutes', MX, MY - 0.72, P ? 2.8 : 2.0, C.violet, P ? 18 : 16);
  await until(S(15)); await play(enter(expT), ...say('TRAINING USES MINUTES', C.cyan));
  const p1a = along(Y1, e1, 0.15), p1b = along(Y1, e1, 0.72);
  let t1 = numTag('2', p1a[0], p1a[1] + 0.02, C.cyan);
  await until(S(16)); await play(enter(t1), ...say('SEND NELL’S WAIT ON PATH 1', C.cyan));
  const t1b = numTag('2', p1b[0], p1b[1] + 0.02, C.cyan);
  await until(S(17)); await play(leave(t1), enter(t1b), ...say('PATH 1 SENDS 2 = 2 MINUTES', C.cyan)); t1 = t1b;
  await until(S(18)); await play(new M.Create(path2), enter(name2), ...say('NOW THE SECOND PATH', C.pink));
  await until(S(19)); await play(...say('PATH 2: WHEN WE NEED A PREDICTION', C.pink));
  await until(S(20)); await play(...fbox(['Serving', ['giving predictions', C.muted], ['when they are needed', C.muted]], C.pink));
  const p2a = along(Y2, e2, 0.15), p2b = along(Y2, e2, 0.72);
  let t2 = numTag('120', p2a[0], p2a[1] + 0.02, C.pink);
  const secT = leftLabel('live clock: seconds', xs, Y2 - 0.75, C.muted, P ? 18 : 16);
  await until(S(21)); await play(enter(t2), enter(secT), ...say('LIVE CLOCK COUNTS SECONDS', C.pink));
  const t2b = numTag('120', p2b[0], p2b[1] + 0.02, C.pink);
  await until(S(22)); await play(leave(t2), enter(t2b), ...say('PATH 2 SENDS 120, NOT CHANGED', C.pink)); t2 = t2b;
  const readT = label('reads 120 minutes!', MX, MY - (P ? 1.12 : 1.08), P ? 2.8 : 2.1, C.pink, P ? 18 : 16, true);
  await until(S(23)); await play(enter(readT), ...say('THE MODEL READS 120 AS MINUTES', C.pink));
  await until(S(24)); await play(...clearBox(), ...say('SIDE BY SIDE', C.violet));
  await until(S(25)); await play(emph(t1, C.cyan), ...say('TRAINING SENDS 2', C.cyan));
  await until(S(26)); await play(emph(t2, C.pink), ...say('SERVING SENDS 120', C.pink));
  await until(S(27)); await play(...fbox(['same wait', ['training: 2', C.cyan], ['serving:  120', C.pink]], C.amber), ...say('SAME WAIT, VERY DIFFERENT NUMBERS', C.amber));
  await until(S(28)); await play(emph(model, C.pink), ...say('THE PREDICTION MAY BE WRONG', C.pink));
  await until(S(29)); await play(...fbox(['Training–serving skew', ['information prepared', C.muted], ['differently in the', C.muted], ['two paths', C.muted]], C.pink));
  await until(S(30)); await play(...say('HERE: MINUTES VS SECONDS', C.amber));

  // 31-40 120 seconds as blocks, groups of 60
  const paths = [model, path1, path2, name1, name2, expT, t1, t2, secT, readT];
  const fixQ = new M.VGroup(label('120 seconds', P ? 0 : CX, P ? 0.2 : -0.3, null, C.pink, 28, true),
    label('= ? minutes', P ? 0 : CX, P ? -0.5 : -1.0, null, C.green, 28, true));
  await until(S(31)); await play(...paths.map(leave), ...clearBox(), enter(fixQ), ...say('LET’S FIX THE SERVING PATH', C.green));
  const sp = P ? 0.29 : 0.26, bs = P ? 0.22 : 0.2, GY = P ? 0.2 : -0.5, gap = P ? 3.3 : 3.2;
  const pos = (k, split) => {
    const g = Math.floor(k / 60), j = k % 60, rr = Math.floor(j / 10), c = j % 10;
    const gx = (P ? 0 : CX) + (split ? (g - 0.5) * gap : (g - 0.5) * (10 * sp));
    const yy = split ? GY + (2.5 - rr) * sp : GY + (2.5 - rr) * sp;
    return [gx + (c - 4.5) * sp, yy, 0];
  };
  const blk = (p, c = C.cyan) => { const b = new M.Rectangle({ width: bs, height: bs, color: c, strokeWidth: 1 }); b.setFill(c, 0.75); b.moveTo(p); return b; };
  const blocks = Array.from({ length: 120 }, (_, k) => blk(pos(k, false)));
  await until(S(32)); await play(leave(fixQ), new M.LaggedStart(blocks.map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 2.0 }), ...say('120 SECONDS AS SMALL BLOCKS'));
  const oneT = label('1 block = 1 second', P ? 0 : CX, GY - 1.35, null, C.muted, 17);
  await until(S(33)); await play(enter(oneT), ...say('EACH BLOCK = 1 SECOND'));
  await until(S(34));
  await play(new M.LaggedStart(blocks.map((b, k) => new M.Transform(b, blk(pos(k, true), k < 60 ? C.cyan : C.violet))), { lagRatio: 0.01, runTime: 2.2 }),
    ...say('GROUPS OF 60 BLOCKS', C.violet));
  const gBox = g => {
    const cx = (P ? 0 : CX) + (g - 0.5) * gap;
    const b = new M.RoundedRectangle({ width: 10 * sp + 0.2, height: 6 * sp + 0.2, cornerRadius: 0.1, color: g ? C.violet : C.cyan, strokeWidth: 2 });
    b.moveTo([cx, GY, 0]);
    return new M.VGroup(b, label('1 minute', cx, GY + 3 * sp + 0.35, null, g ? C.violet : C.cyan, 18, true));
  };
  const gb1 = gBox(0), gb2 = gBox(1);
  await until(S(35)); await play(enter(gb1), ...say('FIRST GROUP = 1 MINUTE', C.cyan));
  await until(S(36)); await play(enter(gb2), ...say('SECOND GROUP = 1 MINUTE', C.violet));
  await until(S(37)); await play(...fbox(['2 groups', ['= 2 minutes', C.amber]], C.amber), ...say('2 GROUPS = 2 MINUTES', C.amber));
  await until(S(38)); await play(...say('WRITE IT AS A FORMULA', C.cyan));
  await until(S(39)); await play(...fbox(['minutes = seconds ÷ 60'], C.cyan));
  await until(S(40)); await play(...fbox(['minutes = seconds ÷ 60', [' = 120 ÷ 60', C.muted], [' = 2', C.amber]], C.amber), ...say('120 ÷ 60 = 2', C.amber));

  // 41-48 the corrected path
  const conv = new M.VGroup(rect(...along(Y2, e2, 0.42), 0.9, 0.46, C.green, C.card), label('÷ 60', ...along(Y2, e2, 0.42), 0.8, C.green, 18, true));
  const path2b = arrow([xs, Y2], e2, C.green);
  const name2b = leftLabel('SERVING path (fixed)', xs, Y2 - 0.38, C.green, 17, true);
  const m2 = new M.VGroup(rect(MX, MY, MW, 0.9, C.violet, C.card), label('MODEL', MX, MY, MW - 0.2, C.violet, 21, true));
  const p1 = arrow([xs, Y1], e1, C.cyan), n1 = leftLabel('TRAINING path', xs, Y1 + 0.38, C.cyan, 17, true);
  const tt1 = numTag('2', p1b[0], p1b[1] + 0.02, C.cyan);
  let tt2 = numTag('120', p2a[0], p2a[1] + 0.02, C.pink);
  await until(S(41));
  await play(...blocks.map(leave), leave(gb1), leave(gb2), leave(oneT), enter(m2), enter(p1), enter(n1), enter(tt1), enter(path2b), enter(name2b), enter(conv), enter(tt2),
    ...say('THE FIXED PATH SENDS 2', C.green));
  const tt2b = numTag('2', p2b[0], p2b[1] + 0.02, C.green);
  await play(leave(tt2), enter(tt2b)); tt2 = tt2b;
  await until(S(42)); await play(emph(tt1, C.cyan), emph(tt2, C.green), ...fbox(['training: 2 minutes', ['serving:  2 minutes', C.green]], C.green), ...say('SAME NUMBER, SAME MEANING', C.green));
  await until(S(43)); await play(...say('COMPARE PATHS BEFORE REAL DECISIONS', C.amber));
  await until(S(44)); await play(...fbox(['Test', ['send the same example', C.muted], ['through both paths', C.muted], ['compare the results', C.muted]], C.amber));
  await until(S(45)); await play(...say('“IT GOT A NUMBER” IS NOT ENOUGH', C.pink));
  await until(S(46)); await play(...fbox(['2     looks fine', '120   looks fine', ['minutes or seconds?', C.pink]], C.pink), ...say('BOTH NUMBERS LOOK VALID', C.pink));
  await until(S(47)); await play(...fbox(['Check', ['what each number means', C.muted], ['how each path prepares it', C.muted]], C.amber), ...say('CHECK MEANING AND PREPARATION', C.amber));
  await until(S(48)); await play(...clearBox(), emph(conv, C.green), ...say('SAME PREPARATION IN TRAINING AND SERVING', C.green));
}

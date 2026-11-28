// 16.3.1 Serving modes. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP0 = P ? [0, -3.65, 0] : [4.3, -0.3, 0], BOXP = BOXP0;
  const LX = P ? -3.2 : -5.7;            // left edge of the picture area
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
  function fbox(lines, color = C.cyan, at = null) {
    const BOXP = at || BOXP0;
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
  function clock(x, y, hour, r = 0.42) {
    const face = new M.Circle({ radius: r, color: C.amber, strokeWidth: 2.5 }); face.setFill(C.card, 0.95); face.moveTo([x, y, 0]);
    const th = hour / 12 * 2 * Math.PI;
    const hh = new M.Line({ start: [x, y, 0], end: [x + 0.55 * r * Math.sin(th), y + 0.55 * r * Math.cos(th), 0], color: C.ink, strokeWidth: 3 });
    const mh = new M.Line({ start: [x, y, 0], end: [x, y + 0.82 * r, 0], color: C.ink, strokeWidth: 2 });
    const t = label(`${hour}:00 AM`, x, y - r - 0.28, null, C.amber, 18, true);
    return new M.VGroup(face, hh, mh, t);
  }
  const arrow = (a, b, color = C.muted) => new M.Arrow({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color, strokeWidth: 2.5 });

  // layout
  const CARD = P ? [-1.4, 1.3] : [CX - 1.6, 0.9];
  const CLK = P ? [2.3, 1.3] : [CX + 2.0, 0.9];
  const INFO1 = P ? 0.25 : -0.1, INFO2 = P ? -0.3 : -0.65;
  const MODEL = P ? [2.3, -0.05] : [CX + 2.0, -0.4];
  const BUB = P ? [2.3, -1.55] : [CX + 2.0, -2.0];

  // 0-1 the depot
  const DX = P ? 0 : CX, DY = P ? -0.1 : -0.6;
  const roof = new M.Polygon({ vertices: [[DX - 1.7, DY + 0.8, 0], [DX + 1.7, DY + 0.8, 0], [DX, DY + 1.5, 0]], color: C.cyan, strokeWidth: 2 });
  roof.setFill(C.card, 0.9);
  const shed = rect(DX, DY, 3.4, 1.6, C.cyan, C.card);
  const dname = label('DEPOT', DX, DY + 0.5, null, C.cyan, 22, true);
  const boxes = [-0.8, 0, 0.8].map(dx => rect(DX + dx, DY - 0.35, 0.5, 0.45, C.amber, C.bg, 1.5));
  const depot = [roof, shed, dname, ...boxes];
  await until(S(0));
  await play(new M.LaggedStart(depot.map(enter), { lagRatio: 0.15, runTime: 1.0 }), ...say('A PARCEL DEPOT'));
  const inA = arrow([DX - 3.3 + (P ? 0.4 : 0), DY - 0.35], [DX - 1.8, DY - 0.35], C.green);
  const outA = arrow([DX + 1.8, DY - 0.35], [DX + 3.3 - (P ? 0.4 : 0), DY - 0.35], C.amber);
  const inT = label('collected', DX - 2.5 + (P ? 0.2 : 0), DY - 0.8, 1.4, C.green, 16);
  const outT = label('sent out', DX + 2.5 - (P ? 0.2 : 0), DY - 0.8, 1.4, C.amber, 16);
  await until(S(1)); await play(enter(inA), enter(outA), enter(inT), enter(outT), ...say('PARCELS COME IN, PARCELS GO OUT'));

  // 2-3 promised time and late
  const TY = P ? -0.2 : -0.9, TL = P ? 6.2 : 6.4, tx0 = (P ? 0 : CX) - TL / 2;
  const tline = new M.Line({ start: [tx0, TY, 0], end: [tx0 + TL, TY, 0], color: C.muted, strokeWidth: 2 });
  const timeT = label('time →', tx0 + TL - 0.5, TY - 0.4, null, C.muted, 16);
  const prom = new M.Dot({ point: [tx0 + TL * 0.45, TY, 0], radius: 0.1, color: C.cyan });
  const promT = label('Promised time', tx0 + TL * 0.45, TY + 0.45, 2.4, C.cyan, 18);
  await until(S(2));
  await play(...[...depot, inA, outA, inT, outT].map(leave), enter(tline), enter(timeT), enter(prom), enter(promT), ...say('EACH PARCEL HAS A PROMISED TIME'));
  const arr = new M.Dot({ point: [tx0 + TL * 0.75, TY, 0], radius: 0.1, color: C.pink });
  const arrT = label('Arrives', tx0 + TL * 0.75, TY + 0.45, 1.6, C.pink, 18);
  const lateT = label('LATE', tx0 + TL * 0.75, TY - 0.55, null, C.pink, 22, true);
  await until(S(3)); await play(enter(arr), enter(arrT), enter(lateT), ...say('MISSES THE TIME = LATE', C.pink));

  // 4-5 when to estimate?
  await until(S(4)); await play(...say('CHANCE OF BEING LATE?', C.amber));
  const optA = clock(P ? -1.5 : CX - 1.7, P ? -0.2 : -0.6, 6);
  const optB = new M.VGroup(rect(P ? 1.6 : CX + 1.7, P ? -0.2 : -0.6, 2.6, 0.9, C.amber, C.card),
    label('Just before', P ? 1.6 : CX + 1.7, (P ? -0.2 : -0.6) + 0.18, 2.3, C.amber, 18),
    label('it leaves', P ? 1.6 : CX + 1.7, (P ? -0.2 : -0.6) - 0.18, 2.3, C.amber, 18));
  const orT = label('or', P ? 0 : CX, P ? -0.2 : -0.6, null, C.muted, 20);
  await until(S(5));
  await play(...[tline, timeT, prom, promT, arr, arrT, lateT].map(leave), enter(optA), enter(orT), enter(optB), ...say('EARLY MORNING OR JUST BEFORE?', C.amber));

  // 6-8 Nell on the North route
  const nell = card('Nell', 'North', ...CARD);
  await until(S(6)); await play(leave(optA), leave(orT), leave(optB), enter(nell), ...say('A PARCEL CALLED NELL'));
  await until(S(7)); await play(emph(nell.submobjects[4], C.cyan), ...say('BOOKED ON THE NORTH ROUTE'));
  const RY = P ? 0.0 : -0.5;
  const route = new M.VGroup(
    new M.Dot({ point: [LX + 0.3, RY, 0], radius: 0.1, color: C.cyan }),
    new M.DashedLine({ start: [LX + 0.3, RY, 0], end: [LX + (P ? 5.9 : 5.6), RY, 0], color: C.cyan }),
    new M.Dot({ point: [LX + (P ? 5.9 : 5.6), RY, 0], radius: 0.1, color: C.cyan }),
    label('depot', LX + 0.5, RY - 0.38, null, C.muted, 16),
    label('North customers', LX + (P ? 5.2 : 4.9), RY - 0.38, 2.4, C.cyan, 16));
  await until(S(8)); await play(enter(route), ...fbox(['Route', ['the path a parcel', C.muted], ['takes for delivery', C.muted]]));

  // 9-12 information at 6 a.m.
  let clk = clock(...CLK, 6);
  await until(S(9)); await play(leave(route), enter(clk), ...say('6 AM: WHAT THE DEPOT KNOWS', C.amber));
  const info1 = leftLabel('Route: North', LX, INFO1, C.cyan, 20);
  let info2 = leftLabel('Loading wait: 2 min', LX, INFO2, C.ink, 20);
  await until(S(10)); await play(enter(info1), ...say('PLANNED ROUTE: NORTH'));
  await until(S(11)); await play(enter(info2), ...say('EXPECTED LOADING WAIT: 2 MINUTES'));
  await until(S(12)); await play(emph(info2), ...fbox(['Loading wait', ['time before workers', C.muted], ['load the parcel', C.muted]], C.amber));

  // 13-15 the model
  const model = new M.VGroup(rect(MODEL[0], MODEL[1], P ? 1.6 : 1.8, 0.8, C.violet, C.card),
    label('MODEL', MODEL[0], MODEL[1], null, C.violet, 22, true));
  const mw = P ? 0.8 : 0.9;
  const feed = new M.VGroup(
    arrow([LX + (P ? 3.15 : 3.4), (INFO1 + INFO2) / 2], [MODEL[0] - mw - 0.05, MODEL[1]], C.muted));
  await until(S(13)); await play(enter(model), enter(feed), ...say('2 PIECES OF INFORMATION → MODEL', C.violet));
  await until(S(14)); await play(emph(model, C.violet), ...fbox(['Model', ['uses information', C.muted], ['to make a prediction', C.muted]], C.violet));
  await until(S(15)); await play(...fbox(['Prediction', ['an estimate of something', C.muted], ['we do not know yet', C.muted]], C.violet));

  // 16-20 the score
  const ring = (color) => { const c = new M.Circle({ radius: 0.5, color, strokeWidth: 2.5 }); c.setFill(C.card, 0.95); c.moveTo([BUB[0], BUB[1], 0]); return c; };
  const bubble = new M.VGroup(ring(C.amber),
    label('40%', BUB[0], BUB[1], null, C.amber, 24, true));
  const down = arrow([MODEL[0], MODEL[1] - 0.45], [BUB[0], BUB[1] + 0.55], C.amber);
  await until(S(16)); await play(enter(down), enter(bubble), ...say('40% CHANCE OF LATE DELIVERY', C.amber));
  await until(S(17)); await play(...fbox(['Percent', ['= out of 100', C.amber]], C.amber));
  // 100 parcels, 40 late
  const gs = P ? 0.17 : 0.2, gx = BOXP[0] - (P ? 1.5 : 0), gy = BOXP[1] - (P ? 0.05 : 0.25);
  const dots = [];
  for (let k = 0; k < 100; k++) {
    const r = Math.floor(k / 10), c = k % 10, late = k < 40;
    const d = new M.Dot({ point: [gx + (c - 4.5) * gs, gy + (4.5 - r) * gs, 0], radius: P ? 0.055 : 0.065, color: late ? C.pink : C.muted });
    dots.push(d);
  }
  const gridBox = rect(BOXP[0], BOXP[1], P ? FW - 1.2 : 4.0, P ? 2.3 : 2.9, C.amber, C.card);
  const gTitle = P ? label('40 of 100', BOXP[0] + 1.6, BOXP[1] + 0.25, 2.6, C.pink, 22, true)
    : label('40 of 100 arrive late', BOXP[0], BOXP[1] + 1.15, 3.6, C.pink, 20, true);
  const gSub = P ? label('arrive late', BOXP[0] + 1.6, BOXP[1] - 0.25, 2.6, C.pink, 20) : null;
  const grid = new M.VGroup(gridBox, ...dots, gTitle, ...(gSub ? [gSub] : []));
  await until(S(18)); await play(...setBox(grid), ...say('40 OUT OF 100 PARCELS LIKE NELL', C.pink));
  await until(S(19)); await play(emph(bubble), ...say('THIS NUMBER = NELL’S SCORE', C.amber));
  const tagX = P ? CARD[0] + 1.6 + 0.55 : CARD[0] + 1.6 + 0.55;
  const scoreTag = new M.VGroup(rect(tagX, CARD[1], 0.9, 0.46, C.amber, C.bg, 1.5), label('40%', tagX, CARD[1], 0.8, C.amber, 19, true));
  await until(S(20)); await play(leave(bubble), leave(down), enter(scoreTag), ...clearBox(), ...say('SCORE SAVED NEXT TO NELL', C.amber));

  // 21-26 dispatch at 8 a.m.
  let clk8 = clock(...CLK, 8);
  await until(S(21)); await play(leave(clk), enter(clk8), ...say('8 AM: NELL IS READY TO LEAVE', C.amber));
  await until(S(22)); await play(...fbox(['Dispatch', ['sending a parcel', C.muted], ['on its delivery route', C.muted]], C.amber));
  const same1 = leftLabel('✓ same', LX + (P ? 3.3 : 3.5), INFO1 + (P ? 0.45 : 0.5), C.green, 16);
  await until(S(23)); await play(leave(feed), leave(model), emph(info1, C.green), emph(info2, C.green), enter(same1), ...say('ROUTE AND WAIT: NOT CHANGED', C.green));
  await until(S(24)); await play(emph(scoreTag), ...say('USE THE SCORE MADE AT 6 AM', C.green));
  // review rule on a 0-100 scale
  const SY = P ? -1.35 : -1.85, SL = P ? 6.2 : 6.2, sx0 = LX + 0.2, s2x = v => sx0 + v / 100 * SL;
  const zone = new M.Rectangle({ width: SL / 2, height: 0.3, color: C.amber, strokeWidth: 0 });
  zone.setFill(C.amber, 0.35); zone.moveTo([s2x(75), SY, 0]);
  const scale = new M.VGroup(new M.Line({ start: [sx0, SY, 0], end: [sx0 + SL, SY, 0], color: C.muted, strokeWidth: 2 }), zone,
    ...[0, 50, 100].map(v => label(`${v}%`, s2x(v), SY - 0.4, null, C.muted, 18, true)),
    label('REVIEW', s2x(75), SY + 0.42, null, C.amber, 19, true));
  await until(S(25)); await play(enter(scale), ...fbox(['Review rule', ['score ≥ 50%', C.amber]], C.amber));
  const mark = new M.VGroup(new M.Dot({ point: [s2x(40), SY, 0], radius: 0.12, color: C.cyan }), label('Nell 40%', s2x(40), SY + 0.42, null, C.cyan, 19, true));
  await until(S(26)); await play(enter(mark), ...say('40% IS BELOW 50%: NO REVIEW', C.cyan));

  // 27-29 serving and batch serving
  await until(S(27)); await play(...say('SERVING', C.violet), ...fbox(['Serving', ['giving model scores', C.muted], ['to people or systems', C.muted]], C.violet));
  const batch = [['Nell', 40], ['Oak', 20], ['Pine', 20], ['Reed', 20]].map(([n, s], i) => {
    const y = (P ? 1.3 : 0.9) - i * (P ? 0.82 : 0.78), x = P ? -0.6 : CX - 0.8, w = P ? 4.6 : 3.6;
    const c = card(n, 'North', x, y, w);
    const tx = x + w / 2 + 0.6;
    return new M.VGroup(c, rect(tx, y, 0.9, 0.46, C.amber, C.bg, 1.5), label(`${s}%`, tx, y, 0.8, C.amber, 19, true));
  });
  const old1 = [nell, scoreTag, clk8, info1, info2, same1, scale, mark];
  await until(S(28));
  await play(...old1.map(leave), new M.LaggedStart(batch.map(enter), { lagRatio: 0.18, runTime: 1.2 }), ...say('MANY SCORES TOGETHER, BEFORE DISPATCH'));
  await until(S(29)); await play(new M.LaggedStart(batch.map(b => emph(b.submobjects[1])), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox(['Batch serving', ['prepare scores early', C.muted], ['and save them', C.muted]], C.cyan));

  // 30-32 a different morning
  const nell2 = card('Nell', 'North', ...CARD);
  const tag2 = new M.VGroup(rect(tagX, CARD[1], 0.9, 0.46, C.amber, C.bg, 1.5), label('40%', tagX, CARD[1], 0.8, C.amber, 19, true));
  clk = clock(...CLK, 6);
  await until(S(30)); await play(...batch.map(leave), ...clearBox(), enter(nell2), enter(clk), ...say('A DIFFERENT MORNING, SAME PARCEL', C.violet));
  const info1b = leftLabel('Route: North', LX, INFO1, C.cyan, 20);
  info2 = leftLabel('Loading wait: 2 min', LX, INFO2, C.ink, 20);
  await until(S(31)); await play(enter(info1b), enter(info2), enter(tag2), ...say('6 AM: THE SAME 40% SCORE', C.amber));
  clk8 = clock(...CLK, 8);
  const info2n = leftLabel('Loading wait: 6 min', LX, INFO2, C.amber, 20);
  await until(S(32)); await play(leave(clk), enter(clk8), leave(info2), enter(info2n), ...say('JUST BEFORE DISPATCH: WAIT 2 → 6 MIN', C.amber));

  // 33-39 the change in wait
  await until(S(33)); await play(emph(info2n), ...say('HOW MUCH DID THE WAIT CHANGE?', C.amber));
  const BS = P ? 0.5 : 0.55, bw = P ? 0.4 : 0.45, bx0 = LX + (P ? 1.4 : 1.5);
  const R1 = P ? -0.95 : -1.3, R2 = P ? -1.6 : -2.05;
  const blk = (k, y, color) => { const b = new M.Rectangle({ width: bw, height: bw, color, strokeWidth: 1.5 }); b.setFill(color, 0.75); b.moveTo([bx0 + k * BS, y, 0]); return b; };
  const oldRow = [0, 1].map(k => blk(k, R1, C.cyan));
  const newRow = [0, 1, 2, 3, 4, 5].map(k => blk(k, R2, k < 2 ? C.cyan : C.amber));
  const oldT = leftLabel('old', LX, R1, C.cyan, 18), newT = leftLabel('new', LX, R2, C.amber, 18);
  await until(S(34)); await play(enter(oldT), new M.LaggedStart(oldRow.map(enter), { lagRatio: 0.3, runTime: 0.7 }), ...say('OLD WAIT = 2 BLOCKS', C.cyan));
  await until(S(35)); await play(enter(newT), new M.LaggedStart(newRow.map(enter), { lagRatio: 0.2, runTime: 1.2 }), ...say('NEW WAIT = 6 BLOCKS', C.amber));
  const extra = new M.Rectangle({ width: 4 * BS + 0.1, height: bw + 0.2, color: C.pink, strokeWidth: 2.5 });
  extra.moveTo([bx0 + 3.5 * BS, R2, 0]);
  const plus4 = label('+4', bx0 + 6 * BS + 0.15, R2, null, C.pink, 22, true);
  await until(S(36)); await play(new M.Create(extra), enter(plus4), ...say('4 EXTRA BLOCKS', C.pink));
  await until(S(37)); await play(...fbox(['6 − 2 = 4 minutes'], C.pink));
  await until(S(38)); await play(...say('WRITE IT AS A FORMULA', C.cyan));
  await until(S(39)); await play(...fbox(['change in wait', ' = new wait − old wait', [' = 6 − 2', C.muted], [' = 4 minutes', C.amber]], C.amber));

  // 40-44 live serving
  const blocks = [...oldRow, ...newRow, oldT, newT, extra, plus4];
  await until(S(40)); await play(...blocks.map(leave), emph(tag2, C.pink), emph(info2n), ...say('SAVED SCORE USED 2 MIN · NOW IT IS 6', C.pink));
  const model2 = new M.VGroup(rect(MODEL[0], MODEL[1], P ? 1.6 : 1.8, 0.8, C.violet, C.card),
    label('MODEL', MODEL[0], MODEL[1], null, C.violet, 22, true));
  const feed2 = arrow([LX + (P ? 3.15 : 3.4), (INFO1 + INFO2) / 2], [MODEL[0] - mw - 0.05, MODEL[1]], C.amber);
  await until(S(41)); await play(enter(model2), enter(feed2), ...say('SEND THE CURRENT INFORMATION', C.amber));
  await until(S(42)); await play(...say('LIVE SERVING', C.green), ...fbox(['Live serving', ['ask for a new score', C.muted], ['when we need it', C.muted]], C.green));
  const down2 = arrow([MODEL[0], MODEL[1] - 0.45], [BUB[0], BUB[1] + 0.55], C.green);
  const qb = new M.VGroup(ring(C.green),
    label('?', BUB[0], BUB[1], null, C.green, 28, true));
  await until(S(43)); await play(enter(down2), enter(qb), ...say('NEW SCORE: NOT KNOWN YET', C.green));
  await until(S(44)); await play(emph(model2, C.violet), ...say('MODEL USES THE 6-MINUTE WAIT', C.violet));

  // 45-49 when to use which
  const old2 = [nell2, tag2, clk8, info1b, info2n, model2, feed2, down2, qb];
  const colW = P ? FW - 1.2 : 4.8, colH = P ? 2.0 : 2.9;
  const BXc = P ? [0, 1.0] : [-2.55, -0.45], LVc = P ? [0, -1.3] : [2.55, -0.45];
  const lineY = (c, i) => c[1] + colH / 2 - (P ? 0.35 : 0.45) - i * (P ? 0.45 : 0.6);
  const bCard = new M.VGroup(rect(BXc[0], BXc[1], colW, colH, C.cyan, C.card),
    label('BATCH', BXc[0], lineY(BXc, 0), null, C.cyan, 22, true),
    label('information stays the same', BXc[0], lineY(BXc, 1), colW - 0.3, C.ink, P ? 19 : 20),
    label('score is ready when needed', BXc[0], lineY(BXc, 2), colW - 0.3, C.ink, P ? 19 : 20));
  const lCard = new M.VGroup(rect(LVc[0], LVc[1], colW, colH, C.green, C.card),
    label('LIVE', LVc[0], lineY(LVc, 0), null, C.green, 22, true),
    label('information can change', LVc[0], lineY(LVc, 1), colW - 0.3, C.ink, P ? 19 : 20),
    label('ask just before dispatch', LVc[0], lineY(LVc, 2), colW - 0.3, C.ink, P ? 19 : 20));
  await until(S(45)); await play(...old2.map(leave), ...clearBox(), enter(bCard), ...say('BATCH: SAME INFORMATION', C.cyan));
  await until(S(46)); await play(enter(lCard), ...say('LIVE: INFORMATION CAN CHANGE', C.green));
  const waitT = label('needs time for the reply', LVc[0], lineY(LVc, 3), colW - 0.3, C.amber, P ? 19 : 20);
  await until(S(47)); await play(enter(waitT), ...say('A LIVE REQUEST TAKES TIME', C.amber));
  await until(S(48)); await play(...say('MISTAKE: OLD SCORE AFTER A CHANGE', C.pink),
    ...fbox([['Mistake', C.pink], ['saved score used', C.muted], ['after information changed', C.muted]], C.pink, P ? null : [0, -3.0, 0]));
  await until(S(49)); await play(...clearBox(), emph(bCard, C.cyan), emph(lCard, C.green), ...say('SAME INFO → BATCH · CHANGED INFO → LIVE', C.green));
}

// 2.3.6 Uncertainty on a chart: read the line around the dot (live manim-web lesson).
// Beat i = sentence i (0-based, 0..32). Runs in site/live/engine.js.
// Chapter facts (chapters/2.3.md): 500 route-A riders asked, 72% satisfied (360 of 500),
// 95% interval from 68% to 76%. The interval is about the overall share, not about single riders.
// The "true share" and the extra samples (beats 17-23) are an example: no number is shown for the true share.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const RA = '#60a5fa';
  // ---------------- layout ----------------
  const PILL = P ? [0, 2.3, 0] : [-2.45, 1.92, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.55, -0.6, 0];
  const XS = P ? 0.27 : 0.3;                       // units per percent point
  const XC = P ? 0 : -2.45;                        // x of 72%
  const X = p => XC + (p - 72) * XS;
  const AXY = P ? -4.3 : -2.35;                    // the percent ruler
  const ROWY = P ? -3.0 : -1.35;                   // our survey's dot and line
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = 20, lh = P ? 0.38 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.62, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.6 : 4.6;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  const hideBox = () => { if (!boxNow) return []; const b = boxNow; boxNow = null; return [new M.FadeOut(b, { runTime: 0.5 })]; };
  const line = (a, b, col, w = 3) => new M.Line({ start: a, end: b, color: col, strokeWidth: w });
  const dot = (x, y, r, col) => { const d = new M.Dot({ point: [x, y, 0], radius: r, color: col }); d.setFill(col, 1); return d; };
  const txt = (s, size, col, p, mono = false, bold = false) => T(s, size, col, mono, bold).moveTo(p);
  function rider(x, y, col, sc = 1) {
    const head = new M.Circle({ radius: 0.1 * sc, color: col, strokeWidth: 1.5 }); head.setFill(col, 1); head.moveTo([x, y + 0.17 * sc, 0]);
    const body = new M.Arc({ radius: 0.17 * sc, startAngle: 0, angle: Math.PI, color: col }); body.setFill(col, 1); body.moveTo([x, y - 0.06 * sc, 0]);
    return new M.VGroup(head, body);
  }
  // one interval: line from lo to hi with end caps and a centre dot
  function interval(lo, mid, hi, y, col, w = 3, r = P ? 0.12 : 0.11, cap = 0.13) {
    return new M.VGroup(line([X(lo), y, 0], [X(hi), y, 0], col, w),
      line([X(lo), y - cap, 0], [X(lo), y + cap, 0], col, w), line([X(hi), y - cap, 0], [X(hi), y + cap, 0], col, w),
      dot(X(mid), y, r, col));
  }

  // =========================================================================
  // 0-4: the survey
  // =========================================================================
  const bX = P ? -1.1 : -4.0, bY = P ? -1.0 : -0.4, bs = P ? 1.1 : 1.25;
  const busBody = new M.RoundedRectangle({ width: 2.4 * bs, height: 1.15 * bs, cornerRadius: 0.2 * bs, color: RA, strokeWidth: 2.5 });
  busBody.setFill(C.card, 0.95); busBody.moveTo([bX, bY, 0]);
  const busWins = [-0.78, -0.26, 0.26, 0.78].map(dx => { const w = new M.RoundedRectangle({ width: 0.4 * bs, height: 0.34 * bs, cornerRadius: 0.05, color: RA, strokeWidth: 1.5 }); w.setFill(RA, 0.35); w.moveTo([bX + dx * bs, bY + 0.2 * bs, 0]); return w; });
  const busTag = txt('A', 22, C.ink, [bX, bY - 0.25 * bs, 0], true, true);
  const wheels = [-0.7, 0.7].map(dx => { const c = new M.Circle({ radius: 0.2 * bs, color: C.ink, strokeWidth: 2.5 }); c.setFill(C.bg, 1); c.moveTo([bX + dx * bs, bY - 0.58 * bs, 0]); return c; });
  const cX = P ? 1.9 : -0.3;
  const clip = new M.RoundedRectangle({ width: P ? 1.6 : 1.5, height: P ? 2.0 : 1.9, cornerRadius: 0.12, color: C.amber, strokeWidth: 2.5 }); clip.setFill(C.card, 0.95); clip.moveTo([cX, bY, 0]);
  const clipHead = txt('SURVEY', P ? 16 : 16, C.amber, [cX, bY + 0.62, 0], true, true);
  const clipRows = [0, 1, 2].map(k => new M.VGroup(
    new M.RoundedRectangle({ width: 0.22, height: 0.22, cornerRadius: 0.03, color: C.ink, strokeWidth: 1.6 }).moveTo([cX - 0.42, bY + 0.2 - k * 0.42, 0]),
    line([cX - 0.18, bY + 0.2 - k * 0.42, 0], [cX + 0.5, bY + 0.2 - k * 0.42, 0], C.muted, 2)));
  const intro = new M.VGroup(busBody, ...busWins, busTag, ...wheels, clip, clipHead, ...clipRows);
  const introCap = txt('How do riders feel about route A?', P ? 21 : 22, C.ink, [P ? 0.3 : -2.15, bY - (P ? 1.7 : 1.55), 0], false, true);

  await until(S(0));
  await play(new M.FadeIn(intro, { shift: [0, 0.15, 0] }), new M.FadeIn(introCap), ...say('ROUTE A: A RIDER SURVEY'));

  await until(S(1));
  await play(...fbox([['question:', C.muted], ['how many riders', C.amber], ['are happy?', C.amber]], C.amber), ...say('HOW MANY RIDERS ARE HAPPY?', C.amber));

  // 2: 500 riders asked (25 x 20 dots)
  const gC = P ? [0, -1.6] : [-2.45, -0.55], gs = P ? 0.27 : 0.15, gr = P ? 0.08 : 0.05;
  const people = [];
  for (let i = 0; i < 500; i++) { const c = i % 25, r = Math.floor(i / 25); people.push(dot(gC[0] + (c - 12) * gs, gC[1] + (9.5 - r) * gs, gr, C.muted)); }
  const peopleG = new M.VGroup(...people);
  const peopleCap = txt('500 route A riders asked', P ? 18 : 18, C.ink, [gC[0], gC[1] - 10 * gs - 0.3, 0], false, true);
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(intro, introCap)), new M.FadeIn(peopleG), new M.FadeIn(peopleCap),
    ...fbox([['the survey asks', C.ink], ['500 route A riders', C.cyan]], C.cyan), ...say('500 RIDERS ASKED'));

  // 3: 360 of 500 satisfied = 72%
  const peopleCol = people.map((p, i) => dot(p.getCenter()[0], p.getCenter()[1], gr, i < 360 ? C.cyan : '#3a4468'));
  const satCap = txt('360 satisfied of 500', P ? 18 : 18, C.cyan, [gC[0], gC[1] - 10 * gs - 0.3, 0], false, true);
  await until(S(3));
  const peopleColG = new M.VGroup(...peopleCol);
  await play(new M.FadeOut(peopleG, { runTime: 0.8 }), new M.FadeIn(peopleColG, { runTime: 0.8 }), new M.Transform(peopleCap, satCap),
    ...fbox([['360 of 500 satisfied', C.cyan], ['= 72%', C.green]], C.green), ...say('72% SAY THEY ARE SATISFIED', C.green));

  // 4: 72 of every 100
  await until(S(4));
  await play(...fbox([['72%', C.green], ['= 72 of every 100', C.ink], ['who answer', C.ink]], C.green), ...say('72 OUT OF EVERY 100'));

  // =========================================================================
  // 5-8: the dot on the ruler (the estimate)
  // =========================================================================
  const ax = line([X(60), AXY, 0], [X(84), AXY, 0], C.muted, 2.5);
  const tks = [60, 64, 68, 72, 76, 80, 84].flatMap(p => [line([X(p), AXY - 0.08, 0], [X(p), AXY + 0.08, 0], C.muted, 2),
    txt(p + '%', P ? 16 : 16, C.muted, [X(p), AXY - 0.32, 0], true)]);
  const axTitle = txt('satisfied riders (%)', P ? 18 : 17, C.muted, [X(72), AXY - (P ? 0.75 : 0.68), 0], false, true);
  const ruler = new M.VGroup(ax, ...tks, axTitle);
  const est = dot(X(72), ROWY, P ? 0.14 : 0.13, RA);
  const estLab = txt('72%', P ? 20 : 20, RA, [X(72), ROWY + 0.4, 0], true, true);
  const guide72 = new M.DashedLine({ start: [X(72), AXY, 0], end: [X(72), ROWY - 0.15, 0], color: RA, strokeWidth: 1.6 });
  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(peopleColG, peopleCap)), new M.FadeIn(ruler), new M.FadeIn(est, { scale: 0.5 }), new M.FadeIn(estLab), new M.Create(guide72),
    ...fbox([['1 dot at 72%', RA]], RA), ...say('ONE DOT AT 72%', RA));

  await until(S(6));
  await play(new M.Flash(est, { color: RA }),
    ...fbox([['the dot = estimate', RA], ['our guess for ALL', C.ink], ['route A riders', C.ink]], RA), ...say('ESTIMATE = OUR GUESS FOR ALL RIDERS', RA));

  // 7: a new group of 500 could land a bit elsewhere
  const ghostY = ROWY + (P ? 1.25 : 0.95);
  const ghosts = [70.5, 73.5, 71.5].map((p, k) => dot(X(p), ghostY + (k === 2 ? (P ? 0.4 : 0.32) : 0), P ? 0.12 : 0.11, C.muted));
  const ghostLab = txt('new groups of 500?', P ? 17 : 17, C.muted, [X(72), ghostY + (P ? 0.85 : 0.68), 0], false, true);
  await until(S(7));
  await play(new M.LaggedStart(ghosts.map(g => new M.FadeIn(g)), { lagRatio: 0.3, runTime: 1.0 }), new M.FadeIn(ghostLab),
    ...fbox([['a new group of 500:', C.ink], ['a slightly', C.amber], ['different answer?', C.amber]], C.amber), ...say('A NEW GROUP: A DIFFERENT ANSWER?', C.amber));

  await until(S(8));
  await play(...fbox([['different people,', C.ink], ['different answers', C.amber]], C.amber), ...say('DIFFERENT PEOPLE, DIFFERENT ANSWERS', C.amber));

  // =========================================================================
  // 9-15: the line around the dot = the interval
  // =========================================================================
  const stub = line([X(71), ROWY, 0], [X(73), ROWY, 0], RA, 3);
  await until(S(9));
  await play(new M.FadeOut(new M.VGroup(...ghosts, ghostLab)), new M.Create(stub), ...hideBox(), ...say('A LINE THROUGH THE DOT', RA));

  const leftL = line([X(68), ROWY, 0], [X(72), ROWY, 0], RA, 3), leftCap = line([X(68), ROWY - 0.13, 0], [X(68), ROWY + 0.13, 0], RA, 3);
  const lab68 = txt('68%', P ? 19 : 19, RA, [X(68), ROWY + 0.4, 0], true, true);
  const g68 = new M.DashedLine({ start: [X(68), AXY, 0], end: [X(68), ROWY - 0.15, 0], color: RA, strokeWidth: 1.4 });
  await until(S(10));
  await play(new M.Create(leftL), new M.Create(leftCap), new M.FadeIn(lab68), new M.Create(g68), ...say('START AT 68%', RA));

  const rightL = line([X(72), ROWY, 0], [X(76), ROWY, 0], RA, 3), rightCap = line([X(76), ROWY - 0.13, 0], [X(76), ROWY + 0.13, 0], RA, 3);
  const lab76 = txt('76%', P ? 19 : 19, RA, [X(76), ROWY + 0.4, 0], true, true);
  const g76 = new M.DashedLine({ start: [X(76), AXY, 0], end: [X(76), ROWY - 0.15, 0], color: RA, strokeWidth: 1.4 });
  await until(S(11));
  await play(new M.Create(rightL), new M.Create(rightCap), new M.FadeIn(lab76), new M.Create(g76), ...say('END AT 76%', RA));
  const ours = new M.VGroup(stub, leftL, leftCap, rightL, rightCap, est);      // remove-only group
  const oursLabs = [estLab, lab68, lab76, guide72, g68, g76];

  // 12: estimate and room around it
  const roomY = ROWY + (P ? 0.85 : 0.8);
  const room = new M.VGroup(line([X(68), roomY, 0], [X(76), roomY, 0], C.amber, 2.5),
    line([X(68), roomY, 0], [X(68), roomY - 0.15, 0], C.amber, 2.5), line([X(76), roomY, 0], [X(76), roomY - 0.15, 0], C.amber, 2.5));
  const roomLab = txt('room around the estimate', P ? 17 : 17, C.amber, [X(72), roomY + 0.3, 0], false, true);
  await until(S(12));
  await play(new M.Create(room), new M.FadeIn(roomLab),
    ...fbox([['dot: the estimate', RA], ['line: room around it', C.amber]], C.amber), ...say('THE ESTIMATE AND ROOM AROUND IT', C.amber));

  await until(S(13));
  await play(...fbox([['the room shows', C.ink], ['uncertainty:', C.amber], ['we cannot pin down', C.ink], ['the exact share', C.ink]], C.amber), ...say('UNCERTAINTY', C.amber));

  await until(S(14));
  await play(...fbox([['a range like this', C.ink], ['is an interval', C.cyan]], C.cyan), ...say('INTERVAL = A RANGE'));

  // 15: the label on the chart
  const ciTag = pill('95% CONFIDENCE INTERVAL', C.green, P ? 16 : 16).moveTo([X(72), roomY + 0.3, 0]);
  await until(S(15));
  await play(new M.FadeOut(new M.VGroup(room, roomLab)), new M.FadeIn(ciTag),
    ...fbox([['label: 95% confidence', C.green], ['interval = the name', C.ink], ['of this kind of range', C.ink]], C.green), ...say('95% CONFIDENCE INTERVAL', C.green));

  // =========================================================================
  // 16-23: many samples, a fixed true share
  // =========================================================================
  await until(S(16));
  await play(new M.Indicate(ciTag, { color: C.green }), ...fbox([['what does the', C.ink], ['label mean?', C.green]], C.green), ...say('WHAT THE LABEL MEANS', C.green));

  // stacked rows: each new sample gives its own dot and line (half width 4 points, like ours)
  const RB = P ? -3.55 : -1.85, RSP = P ? 0.25 : 0.145;
  const C1 = [72, 74.5, 71, 73.5, 75, 70.5, 72.5, 76, 73, 71.5, 74, 69.5, 72, 75.5, 73, 78, 71, 74.5, 72.5, 70];   // row 16 (78) misses 73
  const C2 = [73.5, 71, 74, 72, 70, 75.5, 73, 71.5, 76.5, 72, 74, 70.5, 73, 68.5, 75, 72.5, 71, 74.5, 73, 72];     // row 13 (68.5) misses 73
  const TRUE = 73;
  const rowAt = (c, k, col) => interval(c - 4, c, c + 4, RB + k * RSP, col, 2.2, P ? 0.07 : 0.055, 0.07);
  const rows1 = C1.map((c, k) => rowAt(c, k, C.cyan));
  await until(S(17));
  await play(new M.FadeOut(new M.VGroup(ours, ...oursLabs, ciTag)),
    new M.LaggedStart(rows1.slice(0, 3).map(r => new M.FadeIn(r)), { lagRatio: 0.35, runTime: 1.2 }),
    ...fbox([['many new samples,', C.ink], ['taken the same way', C.cyan]], C.cyan), ...say('MANY NEW SAMPLES'));

  await until(S(18));
  await play(...fbox([['sample = a group', C.cyan], ['picked from the people', C.ink], ['we want to know about', C.ink]], C.cyan), ...say('SAMPLE = A GROUP WE PICK'));

  await until(S(19));
  await play(new M.LaggedStart(rows1.slice(3).map(r => new M.FadeIn(r)), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox([['each sample:', C.ink], ['its own dot and line', C.cyan]], C.cyan), ...say('EACH SAMPLE: ITS OWN DOT AND LINE'));

  // 20: about 95 in 100 contain the true share (here 19 of 20)
  const rowsHit = C1.map((c, k) => rowAt(c, k, Math.abs(c - TRUE) <= 4 ? C.green : C.pink));
  const topY = RB + 19 * RSP + 0.25;
  const trueLine = new M.DashedLine({ start: [X(TRUE), RB - 0.2, 0], end: [X(TRUE), topY, 0], color: C.green, strokeWidth: 2.5 });
  const trueLab = txt('true share (fixed)', P ? 17 : 17, C.green, [X(TRUE), topY + 0.28, 0], false, true);
  await until(S(20));
  await play(...rows1.map((r, k) => new M.Transform(r, rowsHit[k], { runTime: 0.8 })),
    ...fbox([['about 95 in 100', C.green], ['such lines contain', C.ink], ['the true share', C.green], ['here: 19 of 20', C.muted]], C.green), ...say('ABOUT 95 IN 100 CONTAIN THE TRUE SHARE', C.green));

  await until(S(21));
  await play(new M.Create(trueLine), new M.FadeIn(trueLab),
    ...fbox([['a fixed mark:', C.green], ['the share among', C.ink], ['ALL route A riders', C.ink]], C.green), ...say('A FIXED MARK: THE TRUE SHARE', C.green));

  await until(S(22));
  await play(new M.Indicate(trueLab, { color: C.green }),
    ...fbox([['true share = % of ALL', C.green], ['route A riders', C.ink], ['who would say yes', C.ink]], C.green), ...say('TRUE SHARE: ALL RIDERS', C.green));

  // 23: samples change, the true share stays
  const rows2 = C2.map((c, k) => rowAt(c, k, Math.abs(c - TRUE) <= 4 ? C.green : C.pink));
  await until(S(23));
  await play(...rows1.map((r, k) => new M.Transform(r, rows2[k], { runTime: 1.2 })), new M.Indicate(trueLine, { color: C.green }),
    ...fbox([['samples change,', C.cyan], ['the true share', C.green], ['stays fixed', C.green]], C.green), ...say('SAMPLES CHANGE, THE TRUE SHARE STAYS', C.green));

  // =========================================================================
  // 24-29: read the chart in order; what it is for
  // =========================================================================
  const ours2 = interval(68, 72, 76, ROWY, RA);
  const l72 = txt('72%', 20, RA, [X(72), ROWY + 0.4, 0], true, true);
  const l68 = txt('68%', 19, RA, [X(68), ROWY + 0.4, 0], true, true);
  const l76 = txt('76%', 19, RA, [X(76), ROWY + 0.4, 0], true, true);
  const tag2 = pill('95% CONFIDENCE INTERVAL', C.green, 16).moveTo([X(72), roomY + 0.3, 0]);
  await until(S(24));
  await play(new M.FadeOut(new M.VGroup(...rows1, trueLine, trueLab)), new M.FadeIn(ours2), new M.FadeIn(new M.VGroup(l72, l68, l76)), new M.FadeIn(tag2),
    ...fbox([['read in order:', C.cyan]], C.cyan), ...say('READ THIS CHART IN ORDER'));

  await until(S(25));
  await play(new M.Indicate(l72, { color: C.amber, scaleFactor: 1.4 }), new M.Flash(ours2.submobjects[3], { color: C.amber }),
    ...fbox([['read in order:', C.cyan], ['1. the dot: 72%', RA]], C.cyan), ...say('1. THE DOT: 72%', RA));

  await until(S(26));
  await play(new M.Indicate(l68, { color: C.amber, scaleFactor: 1.4 }), new M.Indicate(l76, { color: C.amber, scaleFactor: 1.4 }),
    ...fbox([['read in order:', C.cyan], ['1. the dot: 72%', RA], ['2. ends: 68% to 76%', RA]], C.cyan), ...say('2. BOTH ENDS: 68% TO 76%', RA));

  await until(S(27));
  await play(new M.Indicate(tag2, { color: C.green, scaleFactor: 1.15 }),
    ...fbox([['read in order:', C.cyan], ['1. the dot: 72%', RA], ['2. ends: 68% to 76%', RA], ['3. the label', C.green]], C.cyan), ...say('3. THE LABEL: HOW IT WAS MADE', C.green));

  await until(S(28));
  await play(...fbox([['use it to judge', C.ink], ['how precise a', C.ink], ['survey estimate is', C.cyan]], C.cyan), ...say('HOW PRECISE IS THE ESTIMATE?'));

  // 29: a shorter line (another survey, example) = more precise
  const shortY = ROWY + (P ? 1.95 : 1.7);
  const shortI = interval(70, 72, 74, shortY, C.violet);
  const shortLab = txt('another survey (example): 70% to 74%', P ? 16 : 16, C.violet, [X(72), shortY + 0.38, 0], false, true);
  await until(S(29));
  await play(new M.FadeIn(shortI), new M.FadeIn(shortLab),
    ...fbox([['both 95% intervals:', C.ink], ['68-76: 8 points', RA], ['70-74: 4 points', C.violet], ['shorter = more precise', C.green]], C.green), ...say('SHORTER LINE = MORE PRECISE', C.green));

  // =========================================================================
  // 30-32: the trap and recap
  // =========================================================================
  const trapX = [68, 76].map(p => txt('✗ not a rider', P ? 16 : 16, C.pink, [X(p), ROWY - 0.45, 0], false, true));
  await until(S(30));
  await play(new M.FadeOut(new M.VGroup(shortI, shortLab)), new M.FadeIn(new M.VGroup(...trapX)),
    new M.Indicate(l68, { color: C.pink, scaleFactor: 1.3 }), new M.Indicate(l76, { color: C.pink, scaleFactor: 1.3 }),
    ...fbox([['trap:', C.pink], ['the ends are NOT', C.pink], ['scores of riders', C.ink]], C.pink), ...say('TRAP: ENDS ARE NOT RIDER SCORES', C.pink));

  // 31: each rider answers yes or no
  const rY = ROWY + (P ? 1.95 : 1.65);
  const ans = ['yes', 'yes', 'no', 'yes', 'yes', 'no'];
  const riders = ans.map((a, k) => {
    const x = X(72) + (k - 2.5) * (P ? 1.1 : 1.0);
    const col = a === 'yes' ? C.green : C.muted;
    return new M.VGroup(rider(x, rY, col, P ? 1.1 : 1.0), txt(a, P ? 17 : 17, col, [x, rY + 0.55, 0], true, true));
  });
  await until(S(31));
  await play(new M.FadeOut(new M.VGroup(...trapX)), new M.LaggedStart(riders.map(r => new M.FadeIn(r)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox([['each rider: yes / no', C.ink], ['interval: about the', C.green], ['share who say yes', C.green]], C.green), ...say('INTERVAL = ABOUT THE SHARE WHO SAY YES', C.green));

  await until(S(32));
  await play(new M.FadeOut(new M.VGroup(...riders)),
    ...fbox([['dot = survey estimate', RA], ['labeled interval =', C.green], ['uncertainty about', C.ink], ['the overall share', C.ink]], C.green), ...say('ESTIMATE + UNCERTAINTY', C.green));
}

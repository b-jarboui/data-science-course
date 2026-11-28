// 1.2.6 The mode: the value that appears most often.
// Beat i = sentence i (0-based, 61 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 1.85, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.45, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time (matches 1.2.4 reference)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  const mkDot = (p, r, col) => { const d = new M.Dot({ point: p, radius: r, color: col }); d.setFill(col, 1); return d; };
  const mkHalo = (p, r, col) => { const h = new M.Dot({ point: p, radius: r, color: col }); h.setFill(col, 0.18); return h; };

  // 0: small café icon
  const cy = P ? -2.0 : -0.35;
  const cup = new M.RoundedRectangle({ width: 1.5, height: 1.35, cornerRadius: 0.22, color: C.amber, strokeWidth: 3 });
  cup.setFill(C.card, 0.95); cup.moveTo([0, cy, 0]);
  const handle = new M.Arc({ radius: 0.38, startAngle: -Math.PI / 2, angle: Math.PI, color: C.amber, strokeWidth: 3 });
  handle.moveTo([0.92, cy + 0.05, 0]);
  const saucer = new M.Line({ start: [-1.15, cy - 0.82, 0], end: [1.15, cy - 0.82, 0], color: C.amber, strokeWidth: 3 });
  const st1 = new M.Arc({ radius: 0.22, startAngle: -0.6, angle: 1.8, color: C.cyan, strokeWidth: 2.5 }); st1.moveTo([-0.28, cy + 1.02, 0]);
  const st2 = new M.Arc({ radius: 0.22, startAngle: -0.6, angle: 1.8, color: C.cyan, strokeWidth: 2.5 }); st2.moveTo([0.28, cy + 1.08, 0]);
  const cafeIcon = new M.VGroup(cup, handle, saucer, st1, st2);
  if (P) { cafeIcon.scale(1.6); cafeIcon.moveTo([0, cy, 0]); }
  await until(S(0));
  await play(new M.FadeIn(cafeIcon), ...say('A SMALL CAFÉ', C.amber));

  // 1-3: eight morning customers & recording waits
  const custIcons = [], qTags = [];
  const custSp = P ? 0.9 : 1.08, custY = P ? -2.4 : -0.35, ks = P ? 1.3 : 1;
  for (let k = 0; k < 8; k++) {
    const x = (k - 3.5) * custSp;
    const head = new M.Circle({ radius: 0.14 * ks, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, custY + 0.36 * ks, 0]);
    const body = new M.Arc({ radius: 0.25 * ks, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, custY + 0.02 * ks, 0]);
    custIcons.push(new M.VGroup(head, body));
    const q = T('?', P ? 22 : 20, C.cyan, true); q.moveTo([x, custY - 0.5 * ks, 0]);
    qTags.push(q);
  }
  await until(S(1));
  await play(new M.FadeOut(cafeIcon), new M.LaggedStart(custIcons.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.4 }), ...say('8 MORNING CUSTOMERS'));
  await until(S(2));
  await play(new M.LaggedStart(qTags.map(q => new M.FadeIn(q)), { lagRatio: 0.08, runTime: 1.2 }), ...say('RECORD EACH WAIT (MINUTES)', C.cyan));
  await until(S(3));
  await play(new M.LaggedStart(custIcons.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.08, runTime: 1.3 }), ...say('WHICH WAIT HAPPENED MOST OFTEN?', C.amber));

  // 4: minutes line (1 to 6)
  const AX_Y = P ? -2.8 : -1.55;
  const L0 = P ? 6.0 : 10.4, x0 = -L0 / 2;
  const xZoom = v => x0 + ((v - 1) / 5) * L0;
  const DY = P ? 0.62 : 0.52, R_DOT = P ? 0.17 : 0.16, R_HALO = P ? 0.30 : 0.28;
  const axLine = new M.Line({ start: [xZoom(1) - 0.45, AX_Y, 0], end: [xZoom(6) + 0.45, AX_Y, 0], color: C.muted, strokeWidth: 3 });
  const tickLines = [], tickNums = [];
  for (let v = 1; v <= 6; v++) {
    tickLines.push(new M.Line({ start: [xZoom(v), AX_Y - 0.09, 0], end: [xZoom(v), AX_Y + 0.09, 0], color: C.muted, strokeWidth: 2.5 }));
    const lbl = T(String(v), P ? 20 : 22, C.muted, true); lbl.moveTo([xZoom(v), AX_Y - 0.42, 0]);
    tickNums.push(lbl);
  }
  const unitLab = T('minutes', P ? 16 : 18, C.muted); unitLab.moveTo([xZoom(6) - 0.05, AX_Y - 0.92, 0]);

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...custIcons, ...qTags)),
    new M.Create(axLine),
    ...tickLines.map(t => new M.FadeIn(t)),
    ...tickNums.map(t => new M.FadeIn(t)),
    new M.FadeIn(unitLab),
    ...say('WAIT TIMES (MINUTES)')
  );

  // 5-11: morning shift waits in arrival order: 3, 1, 4, 2, 3, 6, 2, 3
  const countsZ = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const waitDots = [];
  const zoomPos = (val, idx) => [xZoom(val), AX_Y + 0.45 + idx * DY, 0];
  function addWait(val, col = C.cyan) {
    const idx = countsZ[val]++;
    const p = zoomPos(val, idx);
    const halo = mkHalo(p, R_HALO, col), dot = mkDot(p, R_DOT, col);
    const item = { val, idx, halo, dot };
    waitDots.push(item);
    return item;
  }

  // 5: first wait is 3
  const w0 = addWait(3);
  await until(S(5));
  await play(new M.FadeIn(w0.halo), new M.FadeIn(w0.dot), new M.Flash(w0.dot, { color: C.cyan }), ...say('FIRST WAIT: 3 MINUTES'));

  // 6: each dot is one customer
  await until(S(6));
  await play(new M.Indicate(w0.dot, { color: C.amber }), ...say('1 DOT = 1 CUSTOMER', C.amber));

  // 7: 1, 4, and 2 minutes
  const w1 = addWait(1), w2 = addWait(4), w3 = addWait(2);
  await until(S(7));
  await play(
    new M.LaggedStart([
      new M.FadeIn(w1.halo), new M.FadeIn(w1.dot),
      new M.FadeIn(w2.halo), new M.FadeIn(w2.dot),
      new M.FadeIn(w3.halo), new M.FadeIn(w3.dot),
    ], { lagRatio: 0.2, runTime: 1.8 }),
    ...say('NEXT: 1, 4, AND 2 MINUTES')
  );

  // 8: second 3
  const w4 = addWait(3);
  await until(S(8));
  await play(new M.FadeIn(w4.halo), new M.FadeIn(w4.dot), new M.Flash(w4.dot, { color: C.cyan }), ...say('ANOTHER 3 → STACKS UP'));

  // 9: 6 minutes
  const w5 = addWait(6);
  await until(S(9));
  await play(new M.FadeIn(w5.halo), new M.FadeIn(w5.dot), new M.Flash(w5.dot, { color: C.cyan }), ...say('THEN: 6 MINUTES'));

  // 10: second 2
  const w6 = addWait(2);
  await until(S(10));
  await play(new M.FadeIn(w6.halo), new M.FadeIn(w6.dot), new M.Flash(w6.dot, { color: C.cyan }), ...say('ANOTHER 2 → STACKS UP'));

  // 11: third 3
  const w7 = addWait(3);
  await until(S(11));
  await play(new M.FadeIn(w7.halo), new M.FadeIn(w7.dot), new M.Flash(w7.dot, { color: C.cyan }), ...say('THIRD 3 → STACK OF THREE'));

  // 12-13: data
  const dataBox = new M.RoundedRectangle({ width: L0 + 0.85, height: 3 * DY + 0.5, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  dataBox.moveTo([0, AX_Y + 0.45 + DY, 0]);
  await until(S(12));
  await play(new M.Create(dataBox), ...say('THESE 8 WAITS = OUR DATA'));
  await until(S(13));
  await play(new M.Indicate(dataBox, { color: C.cyan }), ...say('DATA = FACTS WE COLLECTED'));

  // 14-15: voting & tallest stack
  await until(S(14));
  await play(new M.FadeOut(dataBox), new M.LaggedStart(waitDots.map(w => new M.Indicate(w.dot, { color: C.amber })), { lagRatio: 0.08, runTime: 1.5 }), ...say('EACH DOT = 1 VOTE', C.amber));

  const mkWinBox = (n, xPos, dy) => {
    const h = n * dy + 0.32;
    const r = new M.RoundedRectangle({ width: P ? 0.78 : 0.88, height: h, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
    r.moveTo([xPos, AX_Y + 0.45 + ((n - 1) / 2) * dy, 0]);
    return r;
  };
  const winBox3 = mkWinBox(3, xZoom(3), DY);
  await until(S(15));
  await play(new M.Create(winBox3), ...say('WINNER = TALLEST STACK', C.amber));

  // 16-18: counts per stack
  const mkCnt = (val, n, col) => {
    const t = T(String(n), P ? 19 : 21, col, true);
    const y = n > 0 ? AX_Y + 0.45 + (n - 1) * DY + 0.72 : AX_Y + 0.36; // clear of the stack's highlight box
    t.moveTo([xZoom(val), y, 0]);
    return t;
  };
  const cnt1 = mkCnt(1, 1, C.muted), cnt4 = mkCnt(4, 1, C.muted), cnt6 = mkCnt(6, 1, C.muted);
  await until(S(16));
  await play(
    new M.FadeIn(cnt1), new M.FadeIn(cnt4), new M.FadeIn(cnt6),
    new M.Indicate(w1.dot, { color: C.cyan }), new M.Indicate(w2.dot, { color: C.cyan }), new M.Indicate(w5.dot, { color: C.cyan }),
    ...say('1, 4, AND 6 → 1 DOT EACH', C.muted)
  );

  const cnt2 = mkCnt(2, 2, C.cyan), cnt5 = mkCnt(5, 0, C.muted);
  await until(S(17));
  await play(
    new M.FadeIn(cnt2), new M.FadeIn(cnt5),
    new M.Indicate(w3.dot, { color: C.cyan }), new M.Indicate(w6.dot, { color: C.cyan }),
    ...say('2 → 2 DOTS, 5 → NONE', C.muted)
  );

  const cnt3 = mkCnt(3, 3, C.amber);
  await until(S(18));
  await play(new M.FadeIn(cnt3), new M.Indicate(winBox3, { color: C.amber }), ...say('TALLEST STACK: 3 MINUTES', C.amber));

  // 19-20: naming the mode & both numbers are 3
  const modeTag = pill('MODE = 3 MIN', C.amber, P ? 16 : 18);
  modeTag.moveTo([xZoom(3), AX_Y - 0.96, 0]);
  await until(S(19));
  await play(new M.FadeIn(modeTag), ...say('MODE = MOST COMMON RESULT', C.green));

  await until(S(20));
  await play(new M.Indicate(cnt3, { color: C.violet }), new M.Indicate(tickNums[2], { color: C.amber }), ...say('3 CUSTOMERS, 3 MINUTES', C.violet));

  // 21-24: ninth customer at 3 min → 4 is the count, 3 is the mode
  const w8 = addWait(3, C.green);
  const winBox4 = mkWinBox(4, xZoom(3), DY);
  await until(S(21));
  await play(
    new M.FadeOut(cnt3), new M.FadeOut(winBox3), new M.FadeIn(winBox4),
    new M.FadeIn(w8.halo), new M.FadeIn(w8.dot), new M.Flash(w8.dot, { color: C.green }),
    ...say('+1 CUSTOMER AT 3 MINUTES', C.green)
  );

  const cnt3Now = mkCnt(3, 4, C.violet);
  await until(S(22));
  await play(
    new M.FadeIn(cnt3Now),
    new M.LaggedStart([w0, w4, w7, w8].map(w => new M.Indicate(w.dot, { color: C.violet })), { lagRatio: 0.12, runTime: 1.4 }),
    ...say('NOW 4 DOTS ABOVE 3', C.violet)
  );

  const countTag = T('← count', P ? 16 : 18, C.pink);
  countTag.moveTo([xZoom(3) + (P ? 0.95 : 1.08), AX_Y + 0.45 + 3 * DY + 0.72, 0]);
  await until(S(23));
  await play(new M.FadeIn(countTag), new M.Indicate(cnt3Now, { color: C.pink }), ...say('4 = COUNT, NOT THE MODE', C.pink));

  const val3Box = new M.RoundedRectangle({ width: 0.62, height: 0.52, cornerRadius: 0.12, color: C.amber, strokeWidth: 2.5 });
  val3Box.moveTo([xZoom(3), AX_Y - 0.42, 0]);
  await until(S(24));
  await play(new M.Create(val3Box), new M.Indicate(modeTag, { color: C.amber }), ...say('MODE = 3 MINUTES (THE WAIT)', C.amber));

  // 25: coffee machine jams at 4 minutes (w2 is the 4-min customer)
  const p4 = zoomPos(4, 0);
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(winBox4, cnt1, cnt2, cnt3Now, cnt4, cnt5, cnt6, countTag, val3Box, modeTag)),
    new M.Transform(w2.dot, mkDot(p4, R_DOT, C.pink)),
    new M.Transform(w2.halo, mkHalo(p4, R_HALO, C.pink)),
    new M.Flash(w2.dot, { color: C.pink }),
    ...say('COFFEE MACHINE JAMS AT 4 MIN', C.pink)
  );

  // 26: rescale axis to 1..16 and slide the 4-min dot to 14 min
  const L1 = P ? 6.6 : 11.4, x1 = -L1 / 2;
  const xWide = v => x1 + ((v - 1) / 15) * L1;
  const DY_W = P ? 0.46 : 0.48, R_DOT_W = P ? 0.13 : 0.15, R_HALO_W = P ? 0.21 : 0.25;
  const widePos = (val, idx) => [xWide(val), AX_Y + 0.42 + idx * DY_W, 0];

  const axLineW = new M.Line({ start: [xWide(1) - 0.3, AX_Y, 0], end: [xWide(16) + 0.3, AX_Y, 0], color: C.muted, strokeWidth: 3 });
  const tickLinesW = [], tickNumsW = [];
  const showTicks = P ? [1, 2, 3, 4, 6, 10, 14] : [1, 2, 3, 4, 6, 8, 10, 12, 14, 16];
  for (let v = 1; v <= 16; v++) {
    tickLinesW.push(new M.Line({ start: [xWide(v), AX_Y - 0.08, 0], end: [xWide(v), AX_Y + 0.08, 0], color: C.muted, strokeWidth: 2 }));
    if (showTicks.includes(v)) {
      const lbl = T(String(v), P ? 16 : 19, v === 14 ? C.pink : C.muted, true);
      lbl.moveTo([xWide(v), AX_Y - 0.40, 0]);
      tickNumsW.push(lbl);
    }
  }
  const unitLabW = T('minutes', P ? 15 : 17, C.muted);
  unitLabW.moveTo([xWide(16) - 0.35, AX_Y - 0.92, 0]);

  w2.val = 14; w2.idx = 0;
  const dotTransforms = waitDots.flatMap(w => {
    const col = w === w2 ? C.pink : C.cyan;
    const np = widePos(w.val, w.idx);
    return [new M.Transform(w.halo, mkHalo(np, R_HALO_W, col)), new M.Transform(w.dot, mkDot(np, R_DOT_W, col))];
  });
  const jamLab = T('14', P ? 18 : 20, C.pink, true);
  jamLab.moveTo([xWide(14), AX_Y + 0.42 + 0.46, 0]);

  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(axLine, ...tickLines, ...tickNums, unitLab)),
    new M.Create(axLineW),
    ...tickLinesW.map(t => new M.FadeIn(t)),
    ...tickNumsW.map(t => new M.FadeIn(t)),
    new M.FadeIn(unitLabW),
    ...dotTransforms,
    new M.FadeIn(jamLab),
    ...say('4 MINUTES → 14 MINUTES', C.pink)
  );

  // 27: average gets pulled right from 3.0 to 4.11
  const avgY = AX_Y - 0.88;
  const avgBase = new M.Dot({ point: [xWide(3), avgY, 0], radius: 0.08, color: C.muted }); avgBase.setFill(C.muted, 1);
  const avgDot = mkDot([xWide(3), avgY, 0], 0.11, C.amber);
  const avgPull = new M.Line({ start: [xWide(3), avgY, 0], end: [xWide(4.11), avgY, 0], color: C.amber, strokeWidth: 3.5 });
  const avgLab = T('average →', P ? 16 : 17, C.amber, true);
  avgLab.moveTo([xWide(3.6), avgY - 0.36, 0]);

  await until(S(27));
  await play(
    new M.FadeIn(avgBase),
    new M.Create(avgPull),
    new M.Transform(avgDot, mkDot([xWide(4.11), avgY, 0], 0.11, C.amber)),
    new M.FadeIn(avgLab),
    ...say('AVERAGE GETS PULLED UP', C.amber)
  );

  // 28-30: pause & guess, look at stacks, only 1 dot moved
  await until(S(28));
  await play(...say('DOES THE MODE CHANGE?', C.violet));
  await until(S(29));
  await play(new M.LaggedStart(waitDots.map(w => new M.Indicate(w.dot, { color: C.cyan })), { lagRatio: 0.06, runTime: 1.1 }), ...say('LOOK AT THE STACKS', C.muted));
  await until(S(30));
  await play(new M.Flash(w2.dot, { color: C.pink }), new M.Indicate(w2.dot, { color: C.pink }), ...say('ONLY 1 DOT MOVED', C.pink));

  // 31: stack above 3 is still tallest -> mode stays 3
  const winBox3W = new M.RoundedRectangle({ width: P ? 0.42 : 0.56, height: 4 * DY_W + 0.24, cornerRadius: 0.12, color: C.amber, strokeWidth: 2.5 });
  winBox3W.moveTo([xWide(3), AX_Y + 0.42 + 1.5 * DY_W, 0]);
  const modeStayTag = pill('MODE = 3 MIN', C.green, P ? 16 : 18);
  modeStayTag.moveTo([xWide(3) + (P ? 0.75 : 0.0), AX_Y + 0.42 + 3 * DY_W + 0.65, 0]);
  await until(S(31));
  await play(new M.Create(winBox3W), new M.FadeIn(modeStayTag), ...say('MODE STAYS 3 MINUTES', C.green));

  // 32: stretching even farther (14 -> 16) never pulls the mode
  const jamLab2 = T('16', P ? 18 : 20, C.pink, true);
  jamLab2.moveTo([xWide(16), AX_Y + 0.42 + 0.46, 0]);
  const avgPull2 = new M.Line({ start: [xWide(3), avgY, 0], end: [xWide(4.33), avgY, 0], color: C.amber, strokeWidth: 3.5 });
  await until(S(32));
  await play(
    new M.Transform(w2.dot, mkDot(widePos(16, 0), R_DOT_W, C.pink)),
    new M.Transform(w2.halo, mkHalo(widePos(16, 0), R_HALO_W, C.pink)),
    new M.FadeOut(jamLab), new M.FadeIn(jamLab2),
    new M.Transform(avgPull, avgPull2),
    new M.Transform(avgDot, mkDot([xWide(4.33), avgY, 0], 0.11, C.amber)),
    new M.Indicate(winBox3W, { color: C.green }),
    ...say('EXTREME WAITS DON’T PULL MODE', C.green)
  );


  // 34-38: café's top drink: coffee, tea, juice
  const DCX = P ? 0 : -2.3, DSP = P ? 2.2 : 2.3;
  const colD = k => DCX + (k - 1) * DSP;
  const DBASE = P ? -2.6 : -1.55, DDY = P ? 0.62 : 0.56;
  const DR_DOT = P ? 0.20 : 0.19, DR_HALO = P ? 0.34 : 0.32;
  const dBase = new M.Line({ start: [colD(0) - 1.05, DBASE, 0], end: [colD(2) + 1.05, DBASE, 0], color: C.muted, strokeWidth: 3 });
  const dNames = ['coffee', 'tea', 'juice'];
  const dLabels = dNames.map((name, k) => {
    const t = T(name, P ? 22 : 24, C.ink); t.moveTo([colD(k), DBASE - 0.48, 0]); return t;
  });

  // 33: works with words too: the minutes chart goes, a chart with drink NAMES on its line comes in
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(
      axLineW, ...tickLinesW, ...tickNumsW, unitLabW,
      ...waitDots.flatMap(w => [w.halo, w.dot]),
      jamLab2, avgBase, avgPull, avgDot, avgLab, winBox3W, modeStayTag
    )),
    new M.Create(dBase), ...dLabels.map(l => new M.FadeIn(l)),
    ...say('WORKS WITH WORDS TOO', C.cyan)
  );

  await until(S(34));
  await play(new M.LaggedStart(dLabels.map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...say('CAFÉ’S TOP DRINK?', C.amber));

  await until(S(35));
  await play(...say('1 DOT = 1 ORDER', C.cyan));

  const drinkStacks = [[], [], []];
  function addDrink(colIdx, col = C.cyan) {
    const j = drinkStacks[colIdx].length;
    const p = [colD(colIdx), DBASE + 0.55 + j * DDY, 0];
    const halo = mkHalo(p, DR_HALO, col), dot = mkDot(p, DR_DOT, col);
    const item = { halo, dot, colIdx, j };
    drinkStacks[colIdx].push(item);
    return item;
  }

  // 36: coffee, then tea
  const dC0 = addDrink(0), dT0 = addDrink(1);
  await until(S(36));
  await play(
    new M.LaggedStart([new M.FadeIn(dC0.halo), new M.FadeIn(dC0.dot), new M.FadeIn(dT0.halo), new M.FadeIn(dT0.dot)], { lagRatio: 0.22, runTime: 1.2 }),
    ...say('COFFEE, THEN TEA', C.cyan)
  );

  // 37: second coffee, then juice
  const dC1 = addDrink(0), dJ0 = addDrink(2);
  await until(S(37));
  await play(
    new M.LaggedStart([new M.FadeIn(dC1.halo), new M.FadeIn(dC1.dot), new M.FadeIn(dJ0.halo), new M.FadeIn(dJ0.dot)], { lagRatio: 0.22, runTime: 1.2 }),
    ...say('SECOND COFFEE, THEN JUICE', C.cyan)
  );

  // 38: third coffee, second tea
  const dC2 = addDrink(0), dT1 = addDrink(1);
  await until(S(38));
  await play(
    new M.LaggedStart([new M.FadeIn(dC2.halo), new M.FadeIn(dC2.dot), new M.FadeIn(dT1.halo), new M.FadeIn(dT1.dot)], { lagRatio: 0.22, runTime: 1.2 }),
    ...say('THIRD COFFEE, SECOND TEA', C.cyan)
  );

  // 39-43: find the mode in two steps
  await until(S(39));
  await play(...say('FIND THE MODE IN 2 STEPS', C.amber));

  await until(S(40));
  await play(...say('STEP 1: COUNT EACH DRINK', C.amber), ...fbox([['Step 1: count each', C.amber], ['coffee  tea  juice', C.muted]], C.amber));

  const mkDCnt = (colIdx, n, col = C.cyan) => {
    const t = T(String(n), P ? 22 : 24, col, true);
    t.moveTo([colD(colIdx), DBASE + 0.55 + (n - 1) * DDY + 0.76, 0]); // clear of the winner box edge
    return t;
  };
  const dCnts = [mkDCnt(0, 3, C.amber), mkDCnt(1, 2, C.cyan), mkDCnt(2, 1, C.cyan)];
  await until(S(41));
  await play(...dCnts.map(c => new M.FadeIn(c)), ...fbox([['coffee : 3', C.cyan], ['tea    : 2', C.cyan], ['juice  : 1', C.cyan]], C.cyan));

  await until(S(42));
  await play(
    new M.Indicate(dCnts[0], { color: C.amber }),
    ...say('STEP 2: HIGHEST COUNT', C.amber),
    ...fbox([['coffee : 3  ← highest', C.amber], ['tea    : 2', C.muted], ['juice  : 1', C.muted]], C.amber)
  );

  const coffeeBox = new M.RoundedRectangle({ width: 0.92, height: 3 * DDY + 0.36, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  coffeeBox.moveTo([colD(0), DBASE + 0.55 + DDY, 0]);
  await until(S(43));
  await play(
    new M.Create(coffeeBox),
    new M.Indicate(dLabels[0], { color: C.amber }),
    ...say('MODE = COFFEE', C.amber),
    ...fbox([['coffee : 3  (highest)', C.cyan], ['mode   = coffee', C.amber]], C.amber)
  );

  // 44-52: value, frequency, and the short rule
  await until(S(44));
  await play(
    new M.FadeOut(coffeeBox),
    ...say('SAME TWO PIECES', C.violet),
    ...fbox([['piece 1: the answer', C.cyan], ['piece 2: how often', C.amber]], C.violet)
  );

  await until(S(45));
  await play(...say('EVERYDAY: VALUE = PRICE / NUMBER', C.muted), ...fbox([['everyday:', C.muted], ['value = price or number', C.ink]], C.muted));

  await until(S(46));
  await play(...say('IN DATA: VALUE = ANY ANSWER', C.cyan), ...fbox([['in data:', C.cyan], ['value = any recorded answer', C.ink]], C.cyan));

  await until(S(47));
  await play(
    new M.LaggedStart(dLabels.map(l => new M.Indicate(l, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.5 }),
    ...fbox([['values:', C.cyan], ['3 min, coffee, tea, juice', C.ink]], C.cyan)
  );

  await until(S(48));
  await play(
    new M.LaggedStart(dCnts.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.2, runTime: 1.5 }),
    ...say('FREQUENCY = HOW OFTEN', C.amber),
    ...fbox([['frequency =', C.amber], ['how often a value appears', C.ink]], C.amber)
  );

  await until(S(49));
  await play(
    new M.Indicate(dLabels[0], { color: C.cyan }),
    new M.Indicate(dCnts[0], { color: C.amber }),
    ...fbox([['value     = coffee', C.cyan], ['frequency = 3', C.amber]], C.cyan)
  );

  await until(S(50));
  await play(...say('ONE SHORT RULE', C.green));

  await until(S(51));
  await play(
    ...say('MODE = HIGHEST FREQUENCY', C.green),
    ...fbox([['mode = value with', C.green], ['       highest frequency', C.amber]], C.green)
  );

  await until(S(52));
  await play(
    new M.LaggedStart(drinkStacks[0].map(d => new M.Indicate(d.dot, { color: C.green })), { lagRatio: 0.15, runTime: 1.3 }),
    ...say('USE: MOST COMMON CHOICE', C.green)
  );

  // 53-59: traps — tie (two modes) & no mode
  await until(S(53));
  await play(...say('TRAP: NOT ALWAYS 1 WINNER', C.pink), ...fbox([['trap:', C.pink], ['not always one winner', C.ink]], C.pink));

  await until(S(54));
  await play(
    new M.Indicate(dCnts[0], { color: C.cyan }),
    new M.Indicate(dCnts[1], { color: C.cyan }),
    ...fbox([['coffee : 3', C.cyan], ['tea    : 2', C.cyan], ['juice  : 1', C.muted]], C.cyan)
  );

  // 55: one more customer orders tea
  const dT2 = addDrink(1, C.pink);
  const cntT3 = mkDCnt(1, 3, C.pink);
  await until(S(55));
  await play(
    new M.FadeIn(dT2.halo), new M.FadeIn(dT2.dot), new M.Flash(dT2.dot, { color: C.pink }),
    new M.FadeOut(dCnts[1]), new M.FadeIn(cntT3),
    ...say('+1 ORDER FOR TEA', C.pink)
  );

  // 56: tie at 3 -> two modes
  const tieY = DBASE + 0.55 + 2 * DDY + 0.30;
  const tieLine = new M.DashedLine({ start: [colD(0) - 0.7, tieY, 0], end: [colD(1) + 0.7, tieY, 0], color: C.amber });
  await until(S(56));
  await play(
    new M.Create(tieLine),
    new M.Indicate(dLabels[0], { color: C.amber }),
    new M.Indicate(dLabels[1], { color: C.amber }),
    ...say('TIE → TWO MODES', C.amber),
    ...fbox([['coffee : 3   tea : 3', C.amber], ['modes  = coffee & tea', C.amber]], C.amber)
  );

  // 57-59: every drink once -> no mode
  const cnt1All = [mkDCnt(0, 1, C.muted), mkDCnt(1, 1, C.muted), mkDCnt(2, 1, C.muted)];
  await until(S(57));
  await play(
    new M.FadeOut(new M.VGroup(
      dC1.halo, dC1.dot, dC2.halo, dC2.dot,
      dT1.halo, dT1.dot, dT2.halo, dT2.dot,
      tieLine, dCnts[0], cntT3, dCnts[2]
    )),
    ...cnt1All.map(c => new M.FadeIn(c)),
    ...say('ALL DIFFERENT DRINKS?', C.violet)
  );

  const flatY = DBASE + 0.55 + 0.30;
  const flatLine = new M.DashedLine({ start: [colD(0) - 0.8, flatY, 0], end: [colD(2) + 0.8, flatY, 0], color: C.muted });
  await until(S(58));
  await play(
    new M.Create(flatLine),
    new M.Indicate(dC0.dot, { color: C.muted }),
    new M.Indicate(dT0.dot, { color: C.muted }),
    new M.Indicate(dJ0.dot, { color: C.muted }),
    ...fbox([['coffee:1  tea:1  juice:1', C.muted], ['nothing stands out', C.muted]], C.muted)
  );

  await until(S(59));
  await play(...say('NO REPEATS → NO MODE', C.pink), ...fbox([['every frequency = 1', C.muted], ['no mode', C.pink]], C.pink));

  // 60: recap
  // the morning drink stacks come back (coffee 3, tea 2, juice 1) with the winner boxed
  const back = [addDrink(0), addDrink(0), addDrink(1)];
  back[0].halo.moveTo([colD(0), DBASE + 0.55 + DDY, 0]); back[0].dot.moveTo([colD(0), DBASE + 0.55 + DDY, 0]);
  back[1].halo.moveTo([colD(0), DBASE + 0.55 + 2 * DDY, 0]); back[1].dot.moveTo([colD(0), DBASE + 0.55 + 2 * DDY, 0]);
  back[2].halo.moveTo([colD(1), DBASE + 0.55 + DDY, 0]); back[2].dot.moveTo([colD(1), DBASE + 0.55 + DDY, 0]);
  const finalCnts = [mkDCnt(0, 3, C.amber), mkDCnt(1, 2, C.cyan), mkDCnt(2, 1, C.cyan)];
  const finalBox = new M.RoundedRectangle({ width: 0.92, height: 3 * DDY + 0.36, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  finalBox.moveTo([colD(0), DBASE + 0.55 + DDY, 0]);
  const recapNum = pill('NUMBERS → 3 MINUTES', C.cyan, P ? 20 : 19);
  recapNum.moveTo(P ? [0, -4.3, 0] : [4.45, -1.75, 0]);
  const recapWord = pill('WORDS → COFFEE', C.green, P ? 20 : 19);
  recapWord.moveTo(P ? [0, -5.2, 0] : [4.45, -2.5, 0]);
  await until(S(60));
  await play(
    new M.FadeOut(new M.VGroup(flatLine, ...cnt1All)),
    ...back.flatMap(d => [new M.FadeIn(d.halo), new M.FadeIn(d.dot)]),
    ...finalCnts.map(c => new M.FadeIn(c)),
    new M.Create(finalBox),
    new M.FadeIn(recapNum),
    new M.FadeIn(recapWord),
    ...say('MODE: MOST COMMON VALUE', C.amber),
    ...fbox([['mode = value that appears', C.green], ['       most often', C.amber]], C.amber)
  );
}

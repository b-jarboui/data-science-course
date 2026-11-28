// 2.3.4 Overplotting: show the dots under the dots (live manim-web lesson).
// Beat i = sentence i (0-based, 0..36). Runs in site/live/engine.js.
// Chapter facts (chapters/2.3.md): 500 trips, waits in whole minutes 0-15, most waits 2-6 minutes.
// The exact count per minute is not in the data sheet: FREQ below is an example that totals 500
// and keeps most waits (385 of 500) in 2-6 minutes. No per-minute count is shown on screen.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const FREQ = [5, 15, 60, 85, 95, 80, 65, 30, 20, 12, 9, 7, 5, 4, 3, 5];   // sum 500

  // pale "paper" chart so see-through dots get DARKER where they meet (as the voice says)
  const GDARK = '#15803d', PKDARK = '#be185d';   // darker green / pink for marks drawn ON the pale paper
  const PAPER = '#E6EEF7', PGRID = '#C9D5E4', PINK = '#22364F', INK = '#1456A0';
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixA = a => '#' + hex(PAPER).map((p, i) => Math.round(p + (hex(INK)[i] - p) * a).toString(16).padStart(2, '0')).join('');
  const shade = (n, a) => mixA(1 - Math.pow(1 - a, n));          // n see-through dots of opacity a on top of each other

  // ---------------- layout: laptop 14.22 x 8, phone 8 x 14.22 ----------------
  const PILL = P ? [0, 2.3, 0] : [-2.45, 1.92, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.55, -0.55, 0];
  const PX0 = P ? -3.75 : -6.35, PX1 = P ? 3.75 : 1.45;          // paper panel left / right
  const AXX = PX0 + (P ? 0.78 : 0.8);                            // the ruler (axis) x
  const Y0 = P ? -5.45 : -2.62, Y15 = P ? 1.05 : 1.1;            // y of 0 and of 15 minutes
  const PY0 = Y0 - (P ? 0.4 : 0.33), PY1 = Y15 + (P ? 0.7 : 0.42);
  const Y = m => Y0 + (m / 15) * (Y15 - Y0);
  const DX = (AXX + PX1) / 2 + 0.05;                             // dot column x
  const HALF = (PX1 - AXX) / 2 - 0.3;                            // widest sideways shift
  const NOTE_Y = PY0 - (P ? 0.45 : 0.38);                        // notes go UNDER the panel, never on the dots
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const RD = P ? 0.19 : 0.14;                                    // demo dot radius
  const RC = P ? 0.17 : 0.11;                                    // column dot radius (smaller than 1 minute)
  const RJ = P ? 0.05 : 0.042;                                   // cloud dot radius

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
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  const hideBox = () => { if (!boxNow) return []; const b = boxNow; boxNow = null; return [new M.FadeOut(b)]; };

  const dot = (x, y, r, col) => { const d = new M.Dot({ point: [x, y, 0], radius: r, color: col }); d.setFill(col, 1); return d; };
  const line = (a, b, col, w = 2) => new M.Line({ start: a, end: b, color: col, strokeWidth: w });
  const txt = (s, size, col, p, mono = false, bold = false) => T(s, size, col, mono, bold).moveTo(p);
  function dblArrow(x0, x1, y, col) {
    const t = 0.11;
    return new M.VGroup(line([x0, y, 0], [x1, y, 0], col, 2.6),
      line([x0, y, 0], [x0 + t, y + t * 0.8, 0], col, 2.6), line([x0, y, 0], [x0 + t, y - t * 0.8, 0], col, 2.6),
      line([x1, y, 0], [x1 - t, y + t * 0.8, 0], col, 2.6), line([x1, y, 0], [x1 - t, y - t * 0.8, 0], col, 2.6));
  }
  // seeded random numbers so the jitter is the same every time
  let seed = 20231;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // =========================================================================
  // 0-3: the question, 500 trips, whole minutes
  // =========================================================================
  const busX = P ? -1.0 : -3.6, busY = P ? -0.9 : -0.35, bs = P ? 1.15 : 1.35;
  const busBody = new M.RoundedRectangle({ width: 2.4 * bs, height: 1.15 * bs, cornerRadius: 0.2 * bs, color: C.cyan, strokeWidth: 2.5 });
  busBody.setFill(C.card, 0.95); busBody.moveTo([busX, busY, 0]);
  const busWins = [-0.78, -0.26, 0.26, 0.78].map(dx => {
    const w = new M.RoundedRectangle({ width: 0.4 * bs, height: 0.34 * bs, cornerRadius: 0.05, color: C.cyan, strokeWidth: 1.5 });
    w.setFill(C.cyan, 0.3); w.moveTo([busX + dx * bs, busY + 0.2 * bs, 0]); return w;
  });
  const wheels = [-0.7, 0.7].map(dx => { const c = new M.Circle({ radius: 0.2 * bs, color: C.ink, strokeWidth: 2.5 }); c.setFill(C.bg, 1); c.moveTo([busX + dx * bs, busY - 0.58 * bs, 0]); return c; });
  const clkX = P ? 2.1 : 0.4, clkR = P ? 0.85 : 0.9;
  const clk = new M.Circle({ radius: clkR, color: C.amber, strokeWidth: 3 }); clk.setFill(C.card, 0.95); clk.moveTo([clkX, busY, 0]);
  const hand1 = line([clkX, busY, 0], [clkX, busY + clkR * 0.7, 0], C.amber, 3.5);
  const hand2 = line([clkX, busY, 0], [clkX + clkR * 0.5, busY - clkR * 0.25, 0], C.amber, 3.5);
  const busCap = txt('How long do people wait?', P ? 22 : 24, C.ink, [P ? 0.4 : -1.6, busY - (P ? 1.75 : 1.65), 0], false, true);
  const scene0 = new M.VGroup(busBody, ...busWins, ...wheels, clk, hand1, hand2);

  await until(S(0));
  await play(new M.FadeIn(scene0, { shift: [0, 0.15, 0] }), new M.FadeIn(busCap), ...say('WAITING FOR THE BUS'));

  // 1: Where do most waits fall?
  await until(S(1));
  await play(new M.Indicate(clk, { color: C.amber }),
    ...fbox([['Question:', C.muted], ['where do most', C.amber], ['waits fall?', C.amber]], C.amber),
    ...say('WHERE DO MOST WAITS FALL?', C.amber));

  // 2: 500 trips -> a block of 500 small dots (25 x 20)
  const gCols = 25, gRows = 20, gs = P ? 0.25 : 0.15;
  const gCX = P ? 0 : -2.45, gCY = P ? -2.0 : -0.75;
  const gridDots = [];
  for (let i = 0; i < 500; i++) {
    const c = i % gCols, r = Math.floor(i / gCols);
    gridDots.push(dot(gCX + (c - (gCols - 1) / 2) * gs, gCY + ((gRows - 1) / 2 - r) * gs, P ? 0.075 : 0.05, C.cyan));
  }
  const gridG = new M.VGroup(...gridDots);
  const gridCap = txt('each dot = 1 trip', P ? 18 : 18, C.muted, [gCX, gCY - (gRows / 2) * gs - 0.32, 0]);
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(scene0, busCap)), new M.FadeIn(gridG, { runTime: 1.0 }), new M.FadeIn(gridCap),
    ...fbox([['500 bus trips', C.cyan], ['1 wait for each trip', C.ink]], C.cyan),
    ...say('500 TRIPS RECORDED'));

  // 3: whole minutes
  await until(S(3));
  await play(...fbox([['each wait in', C.ink], ['whole minutes:', C.ink], ['0, 1, 2, ... 15', C.amber]], C.amber),
    ...say('WHOLE MINUTES: 0 TO 15', C.amber));

  // =========================================================================
  // 4-8: the ruler, one dot per trip, the second dot covers the first
  // =========================================================================
  const paper = new M.RoundedRectangle({ width: PX1 - PX0, height: PY1 - PY0, cornerRadius: 0.14, color: PGRID, strokeWidth: 1.5 });
  paper.setFill(PAPER, 1); paper.moveTo([(PX0 + PX1) / 2, (PY0 + PY1) / 2, 0]);
  const grid = [];
  for (let m = 0; m <= 15; m++) grid.push(line([AXX, Y(m), 0], [PX1 - 0.15, Y(m), 0], PGRID, 1));
  const axis = line([AXX, Y0, 0], [AXX, Y15 + 0.05, 0], PINK, 2.5);
  const tickLab = {};
  const ticks = [];
  for (let m = 0; m <= 15; m++) {
    ticks.push(line([AXX - 0.08, Y(m), 0], [AXX, Y(m), 0], PINK, 1.6));
    if (m % 2 === 0 && m !== 14 || m === 15) {
      const t = txt(String(m), P ? 17 : 16, PINK, [AXX - 0.32, Y(m), 0], true, true);
      tickLab[m] = t; ticks.push(t);
    }
  }
  const axTitle = txt('wait (minutes)', P ? 18 : 16, PINK, [AXX + (P ? 1.15 : 1.0), PY1 - (P ? 0.3 : 0.2), 0], false, true);
  const chart = new M.VGroup(paper, ...grid, axis, ...ticks, axTitle);

  await until(S(4));
  await play(new M.FadeOut(new M.VGroup(gridG, gridCap)), ...hideBox(),
    new M.FadeIn(chart), ...say('A RULER FROM 0 TO 15 MINUTES'));

  // 5: one dot at the recorded wait of each trip (an example trip of 7 minutes)
  const ex = dot(DX, Y(7), RD, INK);
  const exLab = txt('a trip: 7 min', P ? 18 : 17, PINK, [DX + RD + (P ? 0.95 : 0.85), Y(7), 0], false, true);
  await until(S(5));
  await play(new M.FadeIn(ex, { shift: [0, -0.3, 0] }), new M.FadeIn(exLab),
    ...fbox([['1 trip = 1 dot', C.cyan], ['dot height = its wait', C.ink]], C.cyan),
    ...say('ONE DOT FOR EACH TRIP'));

  // 6: trip 1 waited 2 minutes -> dot at 2
  const d1 = dot(DX, Y(2), RD, INK);
  const guide2 = new M.DashedLine({ start: [AXX, Y(2), 0], end: [DX - RD, Y(2), 0], color: PINK, strokeWidth: 1.6 });
  const lab1 = txt('trip 1: 2 min', P ? 18 : 17, PINK, [DX + RD + (P ? 0.95 : 0.85), Y(2), 0], false, true);
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(ex, exLab)), new M.FadeIn(d1, { shift: [0, -0.3, 0] }), new M.Create(guide2), new M.FadeIn(lab1),
    new M.Indicate(tickLab[2], { color: C.pink }),
    ...fbox([['trip 1: 2 minutes', C.cyan], ['dot at 2', C.ink]], C.cyan),
    ...say('TRIP 1: 2 MINUTES → DOT AT 2'));

  // 7: trip 2 also 2 minutes -> drops onto the same spot
  const d2 = dot(DX, Y(2), RD, INK);
  const lab2 = txt('trip 2: 2 min', P ? 18 : 17, PINK, [DX + RD + (P ? 0.95 : 0.85), Y(2) + (P ? 0.42 : 0.3), 0], false, true);
  await until(S(7));
  await play(new M.FadeIn(d2, { shift: [0, -0.9, 0], runTime: 1.0 }), new M.FadeIn(lab2),
    ...fbox([['trip 1: 2 minutes', C.cyan], ['trip 2: 2 minutes', C.amber], ['same spot', C.ink]], C.amber),
    ...say('TRIP 2: ALSO 2 MINUTES', C.amber));

  // 8: the second dot covers the first
  const ring = new M.Circle({ radius: RD + 0.12, color: PKDARK, strokeWidth: 3 }); ring.moveTo([DX, Y(2), 0]);
  await until(S(8));
  await play(new M.Create(ring),
    ...fbox([['2 trips', C.ink], ['but only 1 dot seen', C.pink]], C.pink),
    ...say('THE SECOND DOT COVERS THE FIRST', C.pink));

  // =========================================================================
  // 9-13: coins, then all 500 trips -> overplotting
  // =========================================================================
  const cc = BOXP, cw = P ? 6.6 : 4.3, ch = P ? 1.95 : 3.0;
  const coinCard = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  coinCard.setFill(C.card, 0.95); coinCard.moveTo(cc);
  const sideX = cc[0] - cw / 4, topX = cc[0] + cw / 4, coinY = cc[1] + (P ? 0.2 : 0.3);
  const stack = [0, 1, 2, 3, 4].map(k => {
    const c = new M.RoundedRectangle({ width: P ? 1.1 : 1.0, height: 0.13, cornerRadius: 0.05, color: '#b45309', strokeWidth: 1.5 });
    c.setFill(C.amber, 1); c.moveTo([sideX, coinY - 0.3 + k * 0.155, 0]); return c;
  });
  const topCoin = new M.Circle({ radius: P ? 0.4 : 0.48, color: '#b45309', strokeWidth: 2.5 }); topCoin.setFill(C.amber, 1); topCoin.moveTo([topX, coinY, 0]);
  const coinL1 = txt('side: 5 coins', P ? 17 : 18, C.ink, [sideX, cc[1] - ch / 2 + (P ? 0.3 : 0.45), 0], false, true);
  const coinL2 = txt('top: looks like 1', P ? 17 : 18, C.amber, [topX, cc[1] - ch / 2 + (P ? 0.3 : 0.45), 0], false, true);
  const coins = new M.VGroup(coinCard, ...stack, topCoin, coinL1, coinL2);

  await until(S(9));
  await play(...hideBox(), new M.FadeIn(coins), ...say('LIKE A PILE OF COINS', C.amber));

  await until(S(10));
  await play(new M.Indicate(topCoin, { color: C.pink }), ...say('A PILE CAN LOOK LIKE ONE COIN', C.amber));

  // 11: all 500 trips, plotted with no help -> one dot per minute
  const colDots = [];
  for (let m = 0; m <= 15; m++) if (FREQ[m] > 0) colDots.push(dot(DX, Y(m), RC, INK));
  await until(S(11));
  await play(new M.FadeOut(new M.VGroup(coins, d1, d2, lab1, lab2, ring, guide2)),
    new M.LaggedStart(colDots.map(d => new M.FadeIn(d, { shift: [0, -0.2, 0] })), { lagRatio: 0.08, runTime: 1.3 }),
    ...fbox([['500 trips', C.ink], ['look like 16 dots', C.pink]], C.pink),
    ...say('500 TRIPS → ONLY 16 DOTS SEEN', C.pink));

  // 12-13: the name
  await until(S(12));
  await play(...fbox([['this problem is called', C.muted], ['overplotting', C.pink]], C.pink),
    ...say('OVERPLOTTING', C.pink));
  await until(S(13));
  await play(new M.LaggedStart(colDots.map(d => new M.Indicate(d, { color: C.pink, scaleFactor: 1.3 })), { lagRatio: 0.05, runTime: 1.4 }),
    ...fbox([['overplotting =', C.pink], ['one mark covers', C.ink], ['another', C.ink]], C.pink),
    ...say('ONE MARK COVERS ANOTHER', C.pink));

  // =========================================================================
  // 14-20: transparency
  // =========================================================================
  const A1 = 0.35;                                   // opacity of one pale dot in the 2-dot example
  await until(S(14));
  await play(new M.FadeOut(new M.VGroup(...colDots)),
    ...fbox([['first way:', C.muted], ['make each dot pale,', C.cyan], ['so you see through it', C.cyan]], C.cyan),
    ...say('FIRST WAY: PALE DOTS'));

  await until(S(15));
  await play(...fbox([['a see-through dot', C.ink], ['is called', C.muted], ['transparency', C.cyan]], C.cyan),
    ...say('TRANSPARENCY = SEE-THROUGH'));

  // 16: first pale dot at 2
  const p1 = dot(DX, Y(2), RD, shade(1, A1));
  const pLab1 = txt('1 pale dot', P ? 18 : 17, PINK, [DX + RD + (P ? 0.85 : 0.75), Y(2), 0], false, true);
  await until(S(16));
  await play(new M.FadeIn(p1, { shift: [0, -0.3, 0] }), new M.FadeIn(pLab1),
    ...fbox([['trip 1: 2 minutes', C.cyan], ['1 pale dot', C.ink]], C.cyan),
    ...say('PALE DOT AT 2 MINUTES'));

  // 17: second pale dot on the same spot (where two see-through dots meet, the colour adds up)
  const p2 = dot(DX, Y(2), RD, shade(2, A1));
  const pLab2 = txt('2 pale dots', P ? 18 : 17, PINK, [DX + RD + (P ? 0.9 : 0.8), Y(2), 0], false, true);
  await until(S(17));
  await play(new M.FadeIn(p2, { shift: [0, -0.9, 0], runTime: 1.0 }), new M.Transform(pLab1, pLab2),
    ...fbox([['trip 2: 2 minutes', C.amber], ['same spot', C.ink]], C.amber),
    ...say('SECOND PALE DOT, SAME SPOT', C.amber));

  // 18: together they look darker -> side by side swatches 1 dot / 2 dots
  // a 1-dot sample beside it, so the eye can compare pale vs darker
  const p1s = dot(DX - (P ? 1.6 : 1.3), Y(2), RD, shade(1, A1));
  const p1sLab = txt('1 dot', P ? 18 : 16, PINK, [DX - (P ? 1.6 : 1.3), Y(2) - (P ? 0.45 : 0.36), 0], false, true);
  const p2sLab = txt('2 dots', P ? 18 : 16, PINK, [DX, Y(2) - (P ? 0.45 : 0.36), 0], false, true);
  await until(S(18));
  await play(new M.FadeIn(p1s), new M.FadeIn(p1sLab), new M.FadeIn(p2sLab), new M.FadeOut(pLab1),
    ...fbox([['1 dot  : pale', C.ink], ['2 dots : darker', C.cyan]], C.cyan),
    ...say('TOGETHER THEY LOOK DARKER'));

  // 19: all 500 trips as pale dots: darker = more dots
  const AC = 0.1;
  const paleCol = [];
  for (let m = 0; m <= 15; m++) paleCol.push(dot(DX, Y(m), RC, shade(FREQ[m], AC)));
  await until(S(19));
  await play(new M.FadeOut(new M.VGroup(p1, p2, p1s, p1sLab, p2sLab)),
    new M.LaggedStart(paleCol.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 1.2 }),
    ...fbox([['all 500 trips, pale', C.ink], ['darker = more dots', C.cyan]], C.cyan),
    ...say('DARKER = MORE DOTS MEET'));

  // 20: too many dots -> every busy minute is fully dark
  const busy = new M.RoundedRectangle({ width: RC * 2 + 0.3, height: Y(6) - Y(2) + RC * 2 + 0.2, cornerRadius: 0.1, color: PKDARK, strokeWidth: 2.5 });
  busy.moveTo([DX, (Y(2) + Y(6)) / 2, 0]);
  const busyNote = txt('2 to 6 min: all equally dark', P ? 18 : 17, C.pink, [P ? 0 : (PX0 + PX1) / 2, NOTE_Y, 0], false, true);
  await until(S(20));
  await play(new M.Create(busy), new M.FadeIn(busyNote),
    ...fbox([['too many dots:', C.pink], ['all look fully dark', C.ink], ['differences hidden', C.pink]], C.pink),
    ...say('TOO MANY DOTS: DARKNESS HIDES AGAIN', C.pink));

  // =========================================================================
  // 21-27: jitter
  // =========================================================================
  await until(S(21));
  await play(new M.FadeOut(new M.VGroup(...paleCol, busy, busyNote)),
    ...fbox([['second way', C.green], ['to show the pile', C.ink]], C.green),
    ...say('ANOTHER WAY', C.green));

  // 22: same ruler, two trips of 2 minutes on the same spot
  const j1 = dot(DX, Y(2), RD, INK), j2 = dot(DX, Y(2), RD, INK);
  await until(S(22));
  await play(new M.Indicate(axis, { color: C.green }), new M.FadeIn(j1), new M.FadeIn(j2),
    ...fbox([['same ruler', C.green], ['2 trips at 2 minutes', C.ink]], C.green),
    ...say('SAME RULER, SAME 2 DOTS', C.green));

  // 23: a small random sideways move for each dot
  const sh = P ? 0.55 : 0.42;
  const j1t = dot(DX - sh, Y(2), RD, INK), j2t = dot(DX + sh, Y(2), RD, INK);
  const sideArrow = dblArrow(DX - sh - 0.05, DX + sh + 0.05, Y(2) + (P ? 0.55 : 0.42), GDARK);
  await until(S(23));
  await play(new M.Transform(j1, j1t), new M.Transform(j2, j2t), new M.FadeIn(sideArrow),
    ...fbox([['small sideways move', C.green], ['chosen by chance', C.ink]], C.green),
    ...say('SMALL RANDOM SIDEWAYS MOVE', C.green));

  // 24: height unchanged
  const level = new M.DashedLine({ start: [AXX, Y(2), 0], end: [DX + sh + 0.6, Y(2), 0], color: PINK, strokeWidth: 1.8 });
  await until(S(24));
  await play(new M.Create(level),
    ...fbox([['height stays', C.ink], ['exactly at 2', C.amber]], C.amber),
    ...say('HEIGHT STAYS THE SAME', C.amber));

  // 25: check against the ruler
  await until(S(25));
  await play(new M.Indicate(tickLab[2], { color: C.pink, scaleFactor: 1.6 }), new M.Indicate(level, { color: C.amber }),
    ...say('CHECK THE RULER: 2', C.amber));

  // 26: both still 2 minutes, both visible
  const jl1 = txt('trip 1', P ? 18 : 16, PINK, [DX - sh, Y(2) - (P ? 0.45 : 0.36), 0], false, true);
  const jl2 = txt('trip 2', P ? 18 : 16, PINK, [DX + sh, Y(2) - (P ? 0.45 : 0.36), 0], false, true);
  await until(S(26));
  await play(new M.FadeIn(jl1), new M.FadeIn(jl2),
    ...fbox([['2 trips = 2 dots seen', C.green], ['both at 2 minutes', C.ink]], C.green),
    ...say('BOTH 2 MINUTES, BOTH VISIBLE', C.green));

  // 27: name
  await until(S(27));
  await play(...fbox([['this small shift', C.muted], ['is called jitter', C.green]], C.green),
    ...say('JITTER = SMALL SIDEWAYS SHIFT', C.green));

  // =========================================================================
  // 28-32: the rule, then all 500 trips with jitter
  // =========================================================================
  await until(S(28));
  await play(...fbox([['the drawing rule:', C.cyan]], C.cyan), ...say('THE DRAWING RULE'));

  const mkUp = () => new M.VGroup(line([AXX + 0.22, Y(0), 0], [AXX + 0.22, Y(15) - 0.05, 0], GDARK, 3),
    line([AXX + 0.22, Y(15) - 0.05, 0], [AXX + 0.12, Y(15) - 0.18, 0], GDARK, 3),
    line([AXX + 0.22, Y(15) - 0.05, 0], [AXX + 0.32, Y(15) - 0.18, 0], GDARK, 3));
  const upArr = mkUp(), upArr2 = mkUp();
  await until(S(29));
  await play(new M.Create(upArr),
    ...fbox([['dot height', C.green], ['= recorded wait', C.ink]], C.green),
    ...say('DOT HEIGHT = RECORDED WAIT', C.green));

  await until(S(30));
  await play(new M.Indicate(sideArrow, { color: C.amber }),
    ...fbox([['dot height', C.green], ['= recorded wait', C.ink], ['sideways shift:', C.amber], ['only to see dots', C.ink]], C.amber),
    ...say('SIDEWAYS SHIFT: ONLY TO SEE', C.amber));

  // 31: all 500 trips, each with a small random sideways shift
  const cloud = [];
  for (let m = 0; m <= 15; m++) for (let i = 0; i < FREQ[m]; i++) cloud.push(dot(DX + (rnd() * 2 - 1) * HALF, Y(m), RJ, INK));
  const band = new M.RoundedRectangle({ width: 2 * HALF + 0.3, height: Y(6) - Y(2) + (P ? 0.36 : 0.22), cornerRadius: 0.1, color: '#15803d', strokeWidth: 3 });
  band.moveTo([DX, (Y(2) + Y(6)) / 2, 0]);
  await until(S(31));
  await play(new M.FadeOut(new M.VGroup(j1, j2, jl1, jl2, level, sideArrow, upArr)),
    new M.FadeIn(new M.VGroup(...cloud), { runTime: 1.2 }), new M.Create(band, { runTime: 1.0 }),
    ...fbox([['all 500 trips', C.ink], ['with jitter', C.green]], C.green),
    ...say('MANY DOTS FROM 2 TO 6 MINUTES', C.green));

  await until(S(32));
  await play(new M.Indicate(band, { color: C.green }),
    ...fbox([['most waits:', C.ink], ['2 to 6 minutes', C.green]], C.green),
    ...say('MOST WAITS: 2 TO 6 MINUTES', C.green));

  // =========================================================================
  // 33-36: what it is for, the trap, recap
  // =========================================================================
  await until(S(33));
  await play(new M.FadeOut(band),
    ...fbox([['marks hide each other?', C.ink], ['use transparency', C.cyan], ['or jitter', C.green]], C.cyan),
    ...say('USE EITHER WAY WHEN MARKS HIDE', C.cyan));

  // 34: trap: the sideways spread is NOT a measurement
  const trapY = Y(11.5);
  const trapArrow = dblArrow(DX - HALF, DX + HALF, trapY, PKDARK);
  const trapNote = txt('sideways: NOT measured', P ? 19 : 18, C.pink, [P ? 0 : (PX0 + PX1) / 2, NOTE_Y, 0], false, true);
  await until(S(34));
  await play(new M.Create(trapArrow), new M.FadeIn(trapNote),
    ...fbox([['trap:', C.pink], ['sideways spread', C.ink], ['is not a measurement', C.pink]], C.pink),
    ...say('TRAP: SIDEWAYS IS NOT DATA', C.pink));

  // 35: only height shows the wait
  const heightNote = txt('only height = wait', P ? 19 : 18, C.green, [P ? 0 : (PX0 + PX1) / 2, NOTE_Y, 0], false, true);
  await until(S(35));
  await play(new M.FadeOut(trapArrow), new M.Create(upArr2), new M.Transform(trapNote, heightNote),
    ...fbox([['only height', C.green], ['shows the wait', C.ink]], C.green),
    ...say('ONLY HEIGHT SHOWS THE WAIT', C.green));

  // 36: recap
  await until(S(36));
  await play(...fbox([['dots cover each other?', C.ink], ['transparency or', C.cyan], ['a small sideways shift', C.green]], C.green),
    ...say('SHOW WHERE THE DOTS GATHER', C.green));
}

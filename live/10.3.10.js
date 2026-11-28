// 10.3.10 Kaplan–Meier curves (live manim-web lesson).
// Beat i = sentence i (0-based, 43 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const PATIENTS = [
    { name: 'Amal',  w: 2,  visit: true  },
    { name: 'Badr',  w: 3,  visit: true  },
    { name: 'Chen',  w: 4,  visit: false },
    { name: 'Dina',  w: 6,  visit: true  },
    { name: 'Eli',   w: 7,  visit: false },
    { name: 'Farah', w: 9,  visit: true  },
    { name: 'Gus',   w: 12, visit: false },
    { name: 'Hana',  w: 12, visit: false },
  ];

  // Shared geometry: phone (8 x 14.22, y in [-5.5, 4.3]) & laptop (14.22 x 8, y in [-3.0, 2.3])
  const GX0 = P ? -2.35 : -5.25;
  const GX1 = P ?  3.10 :  1.55;
  const GW  = GX1 - GX0;
  const BAR_TOP = P ?  1.45 :  1.50;
  const BAR_SP  = P ?  0.34 :  0.22;
  const KY1 = P ? -1.90 : -0.78;
  const KY0 = P ? -5.05 : -2.85;
  const KH  = KY1 - KY0;

  const PILL = P ? [0, 2.05, 0] : [(GX0 + GX1) / 2, 2.02, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.60, -0.30, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const wx   = w   => GX0 + (w / 12) * GW;
  const barY = i   => BAR_TOP - i * BAR_SP;
  const ky   = pct => KY0 + (pct / 100) * KH;

  // Formula / live readout box (one at a time, max 4 lines)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 18 : 20, lh = P ? 0.35 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Helpers for patient wait bars (clinic-teal closed end, soft-red open arrow)
  const bars = PATIENTS.map((p, i) => {
    const y = barY(i);
    const col = p.visit ? C.cyan : C.pink;
    const nameText = T(p.name, 16, C.ink);
    nameText.moveTo([GX0 - 0.18 - nameText.getWidth() / 2, y, 0]);
    const shaft = new M.Line({ start: [wx(0), y, 0], end: [wx(p.w), y, 0], color: col, strokeWidth: P ? 4.5 : 4 });
    let endMark, wing1 = null, wing2 = null, tipDot = null;
    if (p.visit) {
      endMark = new M.Dot({ point: [wx(p.w), y, 0], radius: P ? 0.085 : 0.08, color: C.cyan });
      tipDot = endMark;
    } else {
      wing1 = new M.Line({ start: [wx(p.w) - 0.14, y + 0.085, 0], end: [wx(p.w) + 0.02, y, 0], color: C.pink, strokeWidth: P ? 3.5 : 3 });
      wing2 = new M.Line({ start: [wx(p.w) - 0.14, y - 0.085, 0], end: [wx(p.w) + 0.02, y, 0], color: C.pink, strokeWidth: P ? 3.5 : 3 });
      tipDot = new M.Dot({ point: [wx(p.w) + 0.01, y, 0], radius: 0.035, color: C.pink });
      endMark = new M.VGroup(wing1, wing2, tipDot);
    }
    const wTag = p.visit ? String(p.w) : `${p.w}+`;
    const wLabel = T(wTag, 15, C.muted, true);
    wLabel.moveTo([wx(p.w) + 0.16 + wLabel.getWidth() / 2, y, 0]);
    const group = new M.VGroup(nameText, shaft, endMark, wLabel);
    return { ...p, i, y, col, nameText, shaft, endMark, wing1, wing2, tipDot, wLabel, group };
  });

  function setBarOpacity(i, op) {
    const b = bars[i];
    b.shaft.setStrokeOpacity(op);
    if (b.visit) {
      b.endMark.setFill(C.cyan, op);
    } else {
      b.wing1.setStrokeOpacity(op);
      b.wing2.setStrokeOpacity(op);
      b.tipDot.setFill(C.pink, op);
    }
  }

  // Scan line & risk-set dots helpers (never re-wrap kept objects)
  let scanNow = null;
  function moveScan(w) {
    const ln = new M.DashedLine({ start: [wx(w), BAR_TOP + 0.14, 0], end: [wx(w), KY0, 0], color: C.amber });
    ln.setStrokeOpacity(0.55);
    const a = [new M.FadeIn(ln)];
    if (scanNow) a.push(new M.FadeOut(scanNow));
    scanNow = ln;
    return a;
  }
  function clearScan() {
    if (!scanNow) return [];
    const old = scanNow; scanNow = null;
    return [new M.FadeOut(old)];
  }

  let riskDots = [];
  function setRiskDots(w, startIdx) {
    const prev = riskDots;
    const dots = [];
    for (let i = startIdx; i < 8; i++) {
      const d = new M.Dot({ point: [wx(w), barY(i), 0], radius: P ? 0.085 : 0.075, color: C.violet });
      d.setFill(C.violet, 1);
      dots.push(d);
    }
    riskDots = dots;
    const a = [new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 0.7 })];
    if (prev.length) a.push(new M.FadeOut(new M.VGroup(...prev)));
    return a;
  }
  function clearRiskDots() {
    if (!riskDots.length) return [];
    const old = riskDots; riskDots = [];
    return [new M.FadeOut(new M.VGroup(...old))];
  }

  // Height-slice visual: splits height [0, topPct] at week w into n equal rectangles
  function makeSlices(w, topPct, n) {
    const x = wx(w) + 0.22;
    const bw = P ? 0.30 : 0.34;
    const totalH = ky(topPct) - KY0;
    const sh = totalH / n;
    return Array.from({ length: n }, (_, k) => {
      const rect = new M.Rectangle({ width: bw, height: Math.max(0.06, sh - 0.03), color: C.cyan, strokeWidth: 1.5 });
      rect.setFill(C.cyan, 0.38);
      rect.moveTo([x, KY0 + (k + 0.5) * sh, 0]);
      return rect;
    });
  }

  // Curve segment & censoring tick helpers
  const curveSegs = [];
  const dropSegs = [];
  function hSeg(w1, w2, pct) {
    const ln = new M.Line({ start: [wx(w1), ky(pct), 0], end: [wx(w2), ky(pct), 0], color: C.cyan, strokeWidth: 4 });
    curveSegs.push(ln);
    return ln;
  }
  function vSeg(w, pct1, pct2) {
    const ln = new M.Line({ start: [wx(w), ky(pct1), 0], end: [wx(w), ky(pct2), 0], color: C.cyan, strokeWidth: 4 });
    curveSegs.push(ln);
    dropSegs.push(ln);
    return ln;
  }
  function censorTick(w, pct) {
    return new M.Line({ start: [wx(w), ky(pct) - 0.11, 0], end: [wx(w), ky(pct) + 0.11, 0], color: C.pink, strokeWidth: 3.5 });
  }
  function stepDot(w, pct, color = C.cyan) {
    return new M.Dot({ point: [wx(w), ky(pct), 0], radius: 0.075, color });
  }

  // --- Beat 0: clinic question + top timeline for the wait bars ---
  const barBaseY = barY(7) - (P ? 0.24 : 0.16);
  const topAxis = new M.Line({ start: [GX0, barBaseY, 0], end: [GX1, barBaseY, 0], color: C.muted, strokeWidth: 2 });
  const topTicks = [0, 2, 4, 6, 8, 10, 12].map(w => new M.VGroup(
    new M.Line({ start: [wx(w), barBaseY - 0.05, 0], end: [wx(w), barBaseY + 0.05, 0], color: C.muted, strokeWidth: 1.5 }),
    T(String(w), 15, C.muted, true).moveTo([wx(w), barBaseY - 0.20, 0])
  ));
  const topUnit = T('weeks', 15, C.muted);
  topUnit.moveTo([GX1 + (P ? -0.15 : 0.42), barBaseY - (P ? 0.38 : 0.02), 0]);
  const topAxisGroup = new M.VGroup(topAxis, ...topTicks, topUnit);

  await until(S(0));
  await play(new M.Create(topAxis), new M.FadeIn(new M.VGroup(...topTicks, topUnit)),
    ...fbox([['QUESTION', C.amber], ['after each week,', C.ink], ['what share still waits?', C.cyan]], C.amber),
    ...say('SHARE STILL WAITING EACH WEEK?', C.amber));

  // --- Beat 1: put the eight wait bars back on the screen ---
  await until(S(1));
  await play(new M.LaggedStart(bars.map(b => new M.FadeIn(b.group)), { lagRatio: 0.1, runTime: 1.4 }), ...say('8 PATIENTS · WAIT BARS', C.cyan));

  // --- Beat 2: closed end = follow-up visit ---
  const visitBars = bars.filter(b => b.visit);
  await until(S(2));
  await play(
    new M.LaggedStart(visitBars.map(b => new M.Indicate(b.endMark, { color: C.amber })), { lagRatio: 0.15, runTime: 1.3 }),
    ...visitBars.map(b => new M.Flash(b.tipDot, { color: C.cyan, flashRadius: 0.14, lineLength: 0.12 })),
    ...say('● CLOSED END = FOLLOW-UP VISIT', C.cyan)
  );

  // --- Beat 3: open end = stopped watching before a follow-up ---
  const openBars = bars.filter(b => !b.visit);
  await until(S(3));
  await play(
    new M.LaggedStart(openBars.map(b => new M.Indicate(b.endMark, { color: C.amber })), { lagRatio: 0.15, runTime: 1.3 }),
    ...say('▶ OPEN END = STOPPED WATCHING', C.pink)
  );

  // --- Beat 4: all eight waiting at start -> draw the graph at 100% ---
  const kmXAxis = new M.Line({ start: [GX0, KY0, 0], end: [GX1, KY0, 0], color: C.muted, strokeWidth: 2.5 });
  const kmYAxis = new M.Line({ start: [GX0, KY0, 0], end: [GX0, KY1 + 0.15, 0], color: C.muted, strokeWidth: 2.5 });
  const kmXTicks = [0, 2, 4, 6, 8, 10, 12].map(w => new M.VGroup(
    new M.Line({ start: [wx(w), KY0 - 0.06, 0], end: [wx(w), KY0 + 0.06, 0], color: C.muted, strokeWidth: 1.5 }),
    T(String(w), 15, C.muted, true).moveTo([wx(w), KY0 - 0.25, 0])
  ));
  const kmYTicks = [0, 50, 100].map(pct => {
    const lbl = T(`${pct}%`, 15, C.muted, true);
    lbl.moveTo([GX0 - 0.16 - lbl.getWidth() / 2, ky(pct), 0]);
    const gline = new M.Line({ start: [GX0, ky(pct), -0.01], end: [GX1, ky(pct), -0.01], color: C.grid, strokeWidth: 1 });
    gline.setStrokeOpacity(pct === 0 ? 0 : 0.45);
    return new M.VGroup(
      new M.Line({ start: [GX0 - 0.06, ky(pct), 0], end: [GX0 + 0.06, ky(pct), 0], color: C.muted, strokeWidth: 1.5 }),
      lbl, gline
    );
  });
  const kmUnit = T('weeks', 15, C.muted);
  kmUnit.moveTo(P ? [GX1 - 0.20, KY0 - 0.48, 0] : [GX1 + 0.44, KY0 - 0.02, 0]);
  const startDot = stepDot(0, 100, C.cyan);
  const lbl100 = T('100%', 16, C.cyan, true);
  lbl100.moveTo([wx(0) + 0.48, ky(100) + 0.18, 0]);

  await until(S(4));
  await play(
    new M.FadeOut(topAxisGroup),
    new M.Create(kmXAxis), new M.Create(kmYAxis),
    new M.FadeIn(new M.VGroup(...kmXTicks, ...kmYTicks, kmUnit)),
    new M.FadeIn(startDot), new M.FadeIn(lbl100),
    new M.Flash(startDot, { color: C.cyan, flashRadius: 0.16, lineLength: 0.14 }),
    ...say('START: ALL 8 WAITING = 100%', C.cyan)
  );

  // --- Beat 5: look just before Amal's visit in week 2 ---
  const seg0_2 = hSeg(0, 2, 100);
  await until(S(5));
  await play(new M.Create(seg0_2), ...moveScan(2), ...say('JUST BEFORE WEEK 2 · AMAL', C.amber));

  // --- Beat 6: eight patients still waiting and watched ---
  await until(S(6));
  await play(...setRiskDots(2, 0), ...say('8 PATIENTS WAITING & WATCHED', C.violet));

  // --- Beat 7: risk set definition ---
  const riskBox = new M.RoundedRectangle({
    width: 0.38, height: (barY(0) - barY(7)) + 0.28, cornerRadius: 0.12, color: C.violet, strokeWidth: 2
  });
  riskBox.setFill(C.violet, 0.10);
  riskBox.moveTo([wx(2), (barY(0) + barY(7)) / 2, 0]);
  await until(S(7));
  await play(
    new M.Create(riskBox),
    ...fbox([['WEEK 2 · AMAL', C.amber], ['risk set = 8', C.violet], ['waiting & watched', C.muted]], C.violet),
    ...say('RISK SET = 8 PEOPLE', C.violet)
  );

  // --- Beat 8: Amal's follow-up is the event ---
  await until(S(8));
  await play(
    new M.FadeOut(riskBox),
    new M.Indicate(bars[0].endMark, { color: C.amber }),
    new M.Flash(bars[0].tipDot, { color: C.amber, flashRadius: 0.16, lineLength: 0.14 }),
    ...say('EVENT = FOLLOW-UP VISIT (AMAL)', C.amber)
  );

  // --- Beat 9: after Amal's visit, 7 of 8 stay waiting ---
  await until(S(9));
  setBarOpacity(0, 0.25);
  const amalDot = riskDots.shift();
  await play(
    new M.FadeOut(amalDot),
    new M.LaggedStart(riskDots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.05, runTime: 0.8 }),
    ...fbox([['WEEK 2 · AMAL', C.amber], ['risk set: 8', C.violet], ['stay waiting: 7 of 8', C.cyan]], C.cyan),
    ...say('7 OF 8 STAY WAITING', C.cyan)
  );

  // --- Beat 10: keep 7 of the 8 equal parts of starting height ---
  const slices2 = makeSlices(2, 100, 8);
  await until(S(10));
  await play(
    new M.LaggedStart(slices2.map(r => new M.FadeIn(r)), { lagRatio: 0.08, runTime: 0.9 }),
    ...say('KEEP 7 OF 8 EQUAL PARTS', C.cyan)
  );
  const drop2 = slices2.pop();
  drop2.setColor(C.pink); drop2.setFill(C.pink, 0.80);
  await play(new M.FadeOut(drop2, { shift: [0, 0.22, 0], runTime: 0.7 }));

  // --- Beat 11: line steps down to 87.5% ---
  const v2 = vSeg(2, 100, 87.5);
  const dot2 = stepDot(2, 87.5);
  const lbl87 = T('87.5%', 16, C.cyan, true);
  lbl87.moveTo([wx(2) - 0.12 - lbl87.getWidth() / 2, ky(87.5) - 0.16, 0]);
  await until(S(11));
  await play(
    new M.Create(v2), new M.FadeIn(dot2), new M.FadeIn(lbl87),
    new M.FadeOut(new M.VGroup(...slices2)),
    ...fbox([['WEEK 2 · AMAL', C.amber], ['keep 7 of 8 of 100%', C.ink], ['share = 87.5%', C.cyan]], C.cyan),
    ...say('STEPS DOWN TO 87.5%', C.cyan)
  );

  // --- Beat 12: before Badr's visit in week 3, 7 people still waiting and watched ---
  const seg2_3 = hSeg(2, 3, 87.5);
  await until(S(12));
  await play(
    new M.Create(seg2_3),
    ...moveScan(3),
    ...setRiskDots(3, 1),
    ...fbox([['WEEK 3 · BADR', C.amber], ['risk set: 7', C.violet], ['waiting & watched', C.muted]], C.violet),
    ...say('WEEK 3: RISK SET = 7', C.violet)
  );

  // --- Beat 13: Badr gets a visit -> 6 of 7 stay waiting ---
  await until(S(13));
  setBarOpacity(1, 0.25);
  const badrDot = riskDots.shift();
  await play(
    new M.Flash(bars[1].tipDot, { color: C.amber, flashRadius: 0.16, lineLength: 0.14 }),
    new M.FadeOut(badrDot),
    new M.LaggedStart(riskDots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.06, runTime: 0.8 }),
    ...fbox([['WEEK 3 · BADR', C.amber], ['risk set: 7', C.violet], ['stay waiting: 6 of 7', C.cyan]], C.cyan),
    ...say('BADR VISITS · 6 OF 7 STAY', C.amber)
  );

  // --- Beat 14: split current height into 7 equal parts ---
  const slices3 = makeSlices(3, 87.5, 7);
  await until(S(14));
  await play(
    new M.LaggedStart(slices3.map(r => new M.FadeIn(r)), { lagRatio: 0.08, runTime: 1.0 }),
    ...say('SPLIT 87.5% INTO 7 EQUAL PARTS', C.cyan)
  );

  // --- Beat 15: keep 6 of those 7 parts ---
  await until(S(15));
  const drop3 = slices3.pop();
  drop3.setColor(C.pink); drop3.setFill(C.pink, 0.80);
  await play(new M.FadeOut(drop3, { shift: [0, 0.22, 0], runTime: 0.85 }), ...say('KEEP 6 OF 7 PARTS', C.cyan));

  // --- Beat 16: line steps down to 75% ---
  const v3 = vSeg(3, 87.5, 75);
  const dot3 = stepDot(3, 75);
  const lbl75 = T('75%', 16, C.cyan, true);
  lbl75.moveTo([wx(3) + 0.12 + lbl75.getWidth() / 2, ky(75) - 0.20, 0]);
  await until(S(16));
  await play(
    new M.Create(v3), new M.FadeIn(dot3), new M.FadeIn(lbl75),
    new M.FadeOut(new M.VGroup(...slices3)),
    ...fbox([['WEEK 3 · BADR', C.amber], ['keep 6 of 7 of 87.5%', C.ink], ['share = 75%', C.cyan]], C.cyan),
    ...say('STEPS DOWN TO 75%', C.cyan)
  );

  // --- Beat 17: week 4, Chen's bar ends with an arrow ---
  const seg3_4 = hSeg(3, 4, 75);
  await until(S(17));
  await play(
    new M.Create(seg3_4),
    ...moveScan(4),
    new M.Indicate(bars[2].endMark, { color: C.amber }),
    new M.Flash(bars[2].tipDot, { color: C.pink, flashRadius: 0.16, lineLength: 0.14 }),
    ...say('WEEK 4 · CHEN: OPEN END ▶', C.pink)
  );

  // --- Beat 18: no visit for Chen -> line stays at 75% ---
  const tick4 = censorTick(4, 75);
  await until(S(18));
  await play(
    new M.Create(tick4),
    new M.Indicate(seg3_4, { color: C.pink }),
    ...fbox([['WEEK 4 · CHEN ▶', C.pink], ['no follow-up seen', C.muted], ['line stays at 75%', C.cyan]], C.pink),
    ...say('NO VISIT → STAYS AT 75%', C.pink)
  );

  // --- Beat 19: risk set drops from 6 to 5 ---
  await until(S(19));
  setBarOpacity(2, 0.25);
  await play(
    ...setRiskDots(4, 3),
    ...fbox([['WEEK 4 · CHEN ▶', C.pink], ['line stays at 75%', C.cyan], ['risk set: 6 → 5', C.violet]], C.violet),
    ...say('RISK SET DROPS: 6 → 5', C.violet)
  );

  // --- Beat 20: week 6, Dina gets a follow-up ---
  const seg4_6 = hSeg(4, 6, 75);
  await until(S(20));
  await play(
    new M.Create(seg4_6),
    ...moveScan(6),
    ...setRiskDots(6, 3),
    new M.Flash(bars[3].tipDot, { color: C.amber, flashRadius: 0.16, lineLength: 0.14 }),
    ...say('WEEK 6 · DINA GETS A VISIT', C.amber)
  );

  // --- Beat 21: 4 of 5 stay waiting ---
  await until(S(21));
  setBarOpacity(3, 0.25);
  const dinaDot = riskDots.shift();
  await play(
    new M.FadeOut(dinaDot, { runTime: 0.7 }),
    ...fbox([['WEEK 6 · DINA', C.amber], ['risk set: 5', C.violet], ['stay waiting: 4 of 5', C.cyan]], C.cyan),
    ...say('4 OF 5 STAY WAITING', C.cyan)
  );

  // --- Beat 22: keep 4/5 of 75% -> 60% ---
  const slices6 = makeSlices(6, 75, 5);
  await until(S(22));
  await play(
    new M.LaggedStart(slices6.map(r => new M.FadeIn(r)), { lagRatio: 0.08, runTime: 0.85 }),
    ...say('KEEP 4/5 OF 75% = 60%', C.cyan)
  );
  const drop6 = slices6.pop();
  drop6.setColor(C.pink); drop6.setFill(C.pink, 0.80);
  const v6 = vSeg(6, 75, 60);
  const dot6 = stepDot(6, 60);
  const lbl60 = T('60%', 16, C.cyan, true);
  lbl60.moveTo([wx(6) + 0.10 + lbl60.getWidth() / 2, ky(60) + 0.20, 0]);
  await play(
    new M.FadeOut(drop6, { shift: [0, 0.22, 0], runTime: 0.9 }),
    new M.FadeOut(new M.VGroup(...slices6), { runTime: 0.9 }),
    new M.Create(v6, { runTime: 0.9 }), new M.FadeIn(dot6), new M.FadeIn(lbl60),
    ...fbox([['WEEK 6 · DINA', C.amber], ['4/5 of 75% = 60%', C.ink], ['share = 60%', C.cyan]], C.cyan)
  );

  // --- Beat 23: week 7, clinic stops watching Eli ---
  const seg6_7 = hSeg(6, 7, 60);
  await until(S(23));
  await play(
    new M.Create(seg6_7),
    ...moveScan(7),
    new M.Indicate(bars[4].endMark, { color: C.amber }),
    new M.Flash(bars[4].tipDot, { color: C.pink, flashRadius: 0.16, lineLength: 0.14 }),
    ...fbox([['WEEK 7 · ELI ▶', C.pink], ['risk set: 4', C.violet], ['open end: no visit', C.muted]], C.pink),
    ...say('WEEK 7 · ELI: OPEN END ▶', C.pink)
  );

  // --- Beat 24: Eli's open end leaves 3 patients under watch ---
  await until(S(24));
  setBarOpacity(4, 0.25);
  await play(
    ...setRiskDots(7, 5),
    ...fbox([['WEEK 7 · ELI ▶', C.pink], ['risk set: 4 → 3', C.violet], ['Farah, Gus, Hana', C.muted]], C.violet),
    ...say('3 PATIENTS STILL WATCHED', C.violet)
  );

  // --- Beat 25: no follow-up at Eli's open end -> line stays level ---
  const tick7 = censorTick(7, 60);
  await until(S(25));
  await play(
    new M.Create(tick7),
    new M.Indicate(seg6_7, { color: C.pink }),
    ...fbox([['WEEK 7 · ELI ▶', C.pink], ['no visit seen', C.muted], ['line stays at 60%', C.cyan], ['risk set: 3', C.violet]], C.pink),
    ...say('NO VISIT → STAYS AT 60%', C.pink)
  );

  // --- Beat 26: week 9, Farah gets a follow-up ---
  const seg7_9 = hSeg(7, 9, 60);
  await until(S(26));
  await play(
    new M.Create(seg7_9),
    ...moveScan(9),
    ...setRiskDots(9, 5),
    new M.Flash(bars[5].tipDot, { color: C.amber, flashRadius: 0.16, lineLength: 0.14 }),
    ...say('WEEK 9 · FARAH GETS A VISIT', C.amber)
  );

  // --- Beat 27: 2 of 3 stay waiting ---
  await until(S(27));
  setBarOpacity(5, 0.25);
  const farahDot = riskDots.shift();
  await play(
    new M.FadeOut(farahDot, { runTime: 0.7 }),
    new M.LaggedStart(riskDots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.1, runTime: 0.7 }),
    ...fbox([['WEEK 9 · FARAH', C.amber], ['risk set: 3', C.violet], ['stay waiting: 2 of 3', C.cyan]], C.cyan),
    ...say('2 OF 3 STAY WAITING', C.cyan)
  );

  // --- Beat 28: keep 2/3 of 60% -> 40% ---
  const slices9 = makeSlices(9, 60, 3);
  await until(S(28));
  await play(
    new M.LaggedStart(slices9.map(r => new M.FadeIn(r)), { lagRatio: 0.1, runTime: 0.85 }),
    ...say('KEEP 2/3 OF 60% = 40%', C.cyan)
  );
  const drop9 = slices9.pop();
  drop9.setColor(C.pink); drop9.setFill(C.pink, 0.80);
  const v9 = vSeg(9, 60, 40);
  const dot9 = stepDot(9, 40);
  const lbl40 = T('40%', 16, C.cyan, true);
  lbl40.moveTo([wx(9) + 0.10 + lbl40.getWidth() / 2, ky(40) - 0.22, 0]);
  await play(
    new M.FadeOut(drop9, { shift: [0, 0.22, 0], runTime: 0.9 }),
    new M.FadeOut(new M.VGroup(...slices9), { runTime: 0.9 }),
    new M.Create(v9, { runTime: 0.9 }), new M.FadeIn(dot9), new M.FadeIn(lbl40),
    ...fbox([['WEEK 9 · FARAH', C.amber], ['2/3 of 60% = 40%', C.ink], ['share = 40%', C.cyan]], C.cyan)
  );

  // --- Beat 29: week 12, both Gus and Hana reach open ends ---
  const seg9_12 = hSeg(9, 12, 40);
  const tick12 = censorTick(12, 40);
  await until(S(29));
  await play(
    new M.Create(seg9_12), new M.Create(tick12),
    ...moveScan(12),
    ...clearRiskDots(),
    new M.Indicate(bars[6].endMark, { color: C.amber }),
    new M.Indicate(bars[7].endMark, { color: C.amber }),
    ...say('WEEK 12 · GUS & HANA ▶', C.pink)
  );

  // --- Beat 30: no patients stay under watch after week 12 ---
  await until(S(30));
  setBarOpacity(6, 0.25); setBarOpacity(7, 0.25);
  await play(
    ...clearScan(),
    ...fbox([['WEEK 12 · GUS, HANA ▶', C.pink], ['risk set: 2 → 0', C.violet], ['study ends', C.muted]], C.muted),
    ...say('RISK SET = 0 AFTER WEEK 12', C.muted)
  );

  // --- Beat 31: the line ends at 40% ---
  const endDot = stepDot(12, 40, C.amber);
  const lblEnd = T('40%', 16, C.amber, true);
  lblEnd.moveTo([wx(12) + 0.16 + lblEnd.getWidth() / 2, ky(40), 0]);
  await until(S(31));
  await play(
    new M.FadeIn(endDot), new M.FadeOut(lbl40), new M.FadeIn(lblEnd),
    new M.Flash(endDot, { color: C.amber, flashRadius: 0.16, lineLength: 0.14 }),
    ...fbox([['WEEK 12 · END', C.amber], ['risk set: 0', C.muted], ['curve ends at 40%', C.amber]], C.amber),
    ...say('LINE ENDS AT 40%', C.amber)
  );

  // --- Beat 32: this staircase is called a Kaplan–Meier curve ---
  await until(S(32));
  bars.forEach((_, i) => setBarOpacity(i, 0.72));
  await play(
    new M.LaggedStart(curveSegs.map(s => new M.Indicate(s, { color: C.amber })), { lagRatio: 0.08, runTime: 1.5 }),
    ...say('KAPLAN–MEIER CURVE', C.green)
  );

  // --- Beat 33: also called a survival curve, survival = still waiting ---
  await until(S(33));
  await play(
    ...fbox([['KAPLAN–MEIER CURVE', C.green], ['also: survival curve', C.cyan], ['survival = still waiting', C.amber]], C.green),
    ...say('SURVIVAL CURVE = STILL WAITING', C.cyan)
  );

  // --- Beat 34: here is the rule for each step ---
  await until(S(34));
  await play(
    new M.LaggedStart(dropSegs.map(s => new M.Indicate(s, { color: C.amber })), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('THE RULE FOR EACH STEP', C.amber)
  );

  // --- Beat 35: the formula in words ---
  await until(S(35));
  await play(
    ...fbox([
      ['EACH VISIT STEP', C.amber],
      ['new share = old share', C.ink],
      ['  × (stay ÷ risk set)', C.cyan],
      ['open end: stay level', C.pink]
    ], C.cyan),
    ...say('NEW = OLD × (STAY ÷ RISK SET)', C.cyan)
  );

  // --- Beat 36: estimate how many out of 100 still waiting after a given week ---
  const readV = new M.DashedLine({ start: [wx(6), KY0, 0], end: [wx(6), ky(60), 0], color: C.green });
  const readH = new M.DashedLine({ start: [GX0, ky(60), 0], end: [wx(6), ky(60), 0], color: C.green });
  await until(S(36));
  await play(
    new M.Create(readV), new M.Create(readH),
    new M.Flash(dot6, { color: C.green, flashRadius: 0.18, lineLength: 0.14 }),
    ...fbox([['READING THE CURVE', C.green], ['after week 6: 60%', C.cyan], ['≈ 60 of 100 waiting', C.amber]], C.green),
    ...say('ESTIMATE SHARE AT ANY WEEK', C.green)
  );

  // --- Beat 37: median wait = first time curve reaches half (50%) or less ---
  const halfLine = new M.DashedLine({ start: [GX0, ky(50), 0], end: [GX1, ky(50), 0], color: C.amber });
  const halfTag = T('50%', 15, C.amber, true);
  halfTag.moveTo([GX0 - 0.16 - halfTag.getWidth() / 2, ky(50), 0]);
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(readV, readH)),
    new M.Create(halfLine), new M.FadeIn(halfTag),
    ...fbox([['MEDIAN WAIT', C.amber], ['first week curve', C.ink], ['reaches 50% or less', C.amber]], C.amber),
    ...say('MEDIAN = FIRST TIME AT 50% OR LESS', C.amber)
  );

  // --- Beat 38: here the curve first passes half in week 9 ---
  const medV = new M.DashedLine({ start: [wx(9), ky(50), 0], end: [wx(9), KY0, 0], color: C.amber });
  const medDot = stepDot(9, 50, C.amber);
  await until(S(38));
  await play(
    new M.Create(medV), new M.FadeIn(medDot),
    new M.Flash(medDot, { color: C.amber, flashRadius: 0.18, lineLength: 0.14 }),
    ...fbox([['MEDIAN WAIT', C.amber], ['passes 50% at week 9', C.cyan], ['median = 9 weeks', C.amber]], C.amber),
    ...say('MEDIAN WAIT = 9 WEEKS', C.amber)
  );

  // --- Beat 39: trap — counting 4 visits out of 8 and saying 50% still waiting ---
  const trapDot = stepDot(12, 50, C.pink);
  const trapLbl = T('50%?', 16, C.pink, true);
  trapLbl.moveTo([wx(12) - 0.38, ky(50) + 0.22, 0]);
  await until(S(39));
  await play(
    new M.FadeIn(trapDot), new M.FadeIn(trapLbl),
    new M.Flash(trapDot, { color: C.pink, flashRadius: 0.16, lineLength: 0.14 }),
    new M.LaggedStart(visitBars.map(b => new M.Indicate(b.endMark, { color: C.pink })), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox([['COMMON TRAP', C.pink], ['4 visits of 8 ≠ 50% left', C.pink], ['ignores open ends!', C.muted], ['KM curve: 40% left', C.cyan]], C.pink),
    ...say('TRAP: 4 OF 8 VISITS ≠ 50% WAITING', C.pink)
  );

  // --- Beat 40: open-end patients still count until we stop watching ---
  await until(S(40));
  bars.forEach((b, i) => setBarOpacity(i, b.visit ? 0.30 : 1.0));
  await play(
    new M.FadeOut(new M.VGroup(trapDot, trapLbl, medV, medDot)),
    new M.LaggedStart(openBars.map(b => new M.Indicate(b.shaft, { color: C.pink })), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox([['OPEN ENDS STILL COUNT', C.pink], ['Chen counts in wk 2, 3', C.ink], ['Eli counts in wk 2, 3, 6', C.ink], ['until we stop watching', C.cyan]], C.pink),
    ...say('OPEN ENDS COUNT UNTIL THEY LEAVE', C.pink)
  );

  // --- Beat 41: rely on those still seen to represent those who leave ---
  await until(S(41));
  bars.forEach((_, i) => setBarOpacity(i, i >= 5 ? 1.0 : 0.28));
  await play(
    new M.LaggedStart([5, 6, 7].map(i => new M.Indicate(bars[i].shaft, { color: C.violet })), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox([['KEY ASSUMPTION', C.violet], ['still watched represent', C.ink], ['those who left our view', C.pink]], C.violet),
    ...say('WATCHED REPRESENT THOSE WHO LEFT', C.violet)
  );

  // --- Beat 42: one-sentence recap ---
  await until(S(42));
  bars.forEach((_, i) => setBarOpacity(i, 0.85));
  await play(
    new M.LaggedStart(curveSegs.map(s => new M.Indicate(s, { color: C.green })), { lagRatio: 0.08, runTime: 1.6 }),
    ...fbox([
      ['KAPLAN–MEIER CURVE', C.green],
      ['• step down at visits', C.cyan],
      ['• stay flat at open ends', C.pink],
      ['• use risk set each time', C.violet]
    ], C.green),
    ...say('UPDATE AT EACH VISIT USING THE RISK SET', C.green)
  );
}

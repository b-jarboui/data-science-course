// 5.1.3 Geometric waiting counts (live lesson, script.v4.md).
// Beat i = sentence i (0-based, 0..36). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const URG = '#fb713c';
  const CX = P ? 0 : -2.2;
  const BOXP = P ? [0, 3.35, 0] : [4.45, -0.35, 0];
  const PILL = P ? [0, 1.92, 0] : [CX, 1.95, 0];
  const PILL_C = P ? [0, 2.35, 0] : [0, 1.95, 0];
  const say = (s, c = C.cyan, centered = false) => showA(s, c, centered ? PILL_C : PILL);

  // Formula box: one at a time, lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan, sz = 0) {
    const size = sz || (P ? 19 : 20), lh = (P ? 0.38 : 0.41) * size / (P ? 19 : 20);
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  // Ticket card helper: builds a glowing support-ticket card centered at pos
  function makeCard(pos, kind, label, w, h, fsize = 15) {
    const col = kind === 'urgent' ? URG : kind === 'calm' ? C.cyan : kind === 'pink' ? C.pink : kind === 'green' ? C.green : C.muted;
    const op = kind === 'urgent' ? 0.28 : kind === 'calm' ? 0.16 : kind === 'pink' ? 0.18 : kind === 'green' ? 0.22 : 0.07;
    const txtCol = kind === 'dim' ? C.muted : kind === 'mystery' ? C.ink : col;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color: col, strokeWidth: kind === 'dim' ? 1.5 : 2 });
    r.setFill(col, op); r.moveTo(pos);
    const topBar = new M.Line({
      start: [pos[0] - w * 0.32, pos[1] + h * 0.30, 0],
      end: [pos[0] + w * 0.32, pos[1] + h * 0.30, 0],
      color: col, strokeWidth: kind === 'dim' ? 2 : 3
    });
    const txt = T(label, fsize, txtCol, true, kind === 'urgent' || kind === 'green');
    txt.moveTo([pos[0], pos[1] - h * 0.07, 0]);
    return new M.VGroup(r, topBar, txt);
  }

  // Crisp arrow built from Line segments
  function makeArrow(p1, p2, color = C.amber, sw = 2.5, head = 0.14) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const c = 0.866, s = 0.5;
    const b1 = [p2[0] - head * (ux * c - uy * s), p2[1] - head * (uy * c + ux * s), 0];
    const b2 = [p2[0] - head * (ux * c + uy * s), p2[1] - head * (uy * c - ux * s), 0];
    return new M.VGroup(
      new M.Line({ start: p1, end: p2, color, strokeWidth: sw }),
      new M.Line({ start: b1, end: p2, color, strokeWidth: sw }),
      new M.Line({ start: b2, end: p2, color, strokeWidth: sw })
    );
  }

  // Fulcrum triangle parts (kept separate so each line/dot transforms cleanly)
  function makeFulcrumParts(x, yBase, color = C.amber) {
    const hw = P ? 0.25 : 0.28, ht = P ? 0.42 : 0.40;
    const tip = [x, yBase, 0], bl = [x - hw, yBase - ht, 0], br = [x + hw, yBase - ht, 0];
    const l1 = new M.Line({ start: tip, end: bl, color, strokeWidth: 3 });
    const l2 = new M.Line({ start: tip, end: br, color, strokeWidth: 3 });
    const l3 = new M.Line({ start: bl, end: br, color, strokeWidth: 3 });
    const dot = new M.Dot({ point: tip, radius: 0.08, color });
    return [l1, l2, l3, dot];
  }

  // ── 0-1: Staff member starts her shift & asks which ticket is first urgent ──
  const sx = P ? -1.15 : -1.8, sy = P ? -0.35 : 0.15;
  const head = new M.Circle({ radius: 0.24, color: C.ink }); head.setFill(C.ink, 0.95); head.moveTo([sx, sy + 0.56, 0]);
  const body = new M.Arc({ radius: 0.44, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 0.95); body.moveTo([sx, sy - 0.02, 0]);
  const deskLine = new M.Line({ start: [sx - 0.75, sy - 0.06, 0], end: [sx + 0.75, sy - 0.06, 0], color: C.muted, strokeWidth: 3 });
  const staffIcon = new M.VGroup(head, body, deskLine);
  const urgBadge = makeCard([P ? 1.15 : 1.55, sy + 0.28, 0], 'urgent', 'urgent', P ? 1.65 : 1.85, P ? 1.05 : 1.1, P ? 18 : 20);
  const urgSub = T('urgent-ticket expert', P ? 15 : 17, URG); urgSub.moveTo([P ? 1.15 : 1.55, sy - 0.48, 0]);
  await until(S(0));
  await play(new M.FadeIn(staffIcon), new M.FadeIn(urgBadge), new M.FadeIn(urgSub), ...say('NEW SHIFT · URGENT EXPERT', URG, true));

  const qY = P ? -2.35 : -1.65;
  const qStep = P ? 1.15 : 1.52;
  const qCards = [0, 1, 2, 3, 4].map(i => {
    const x = (i - 2) * qStep - (P ? 0.2 : 0.3);
    const card = makeCard([x, qY, 0], 'mystery', '?', P ? 0.92 : 1.18, P ? 0.85 : 0.92, P ? 20 : 22);
    const num = T(String(i + 1), P ? 15 : 17, C.muted, true); num.moveTo([x, qY - 0.68, 0]);
    return new M.VGroup(card, num);
  });
  const qDots = T('...', P ? 22 : 26, C.muted, true); qDots.moveTo([2 * qStep + (P ? 0.65 : 0.85), qY, 0]);
  await until(S(1));
  await play(
    new M.LaggedStart([...qCards.map(c => new M.FadeIn(c)), new M.FadeIn(qDots)], { lagRatio: 0.14, runTime: 1.5 }),
    ...say('ON WHICH TICKET IS THE FIRST URGENT?', C.amber, true)
  );

  // ── 2: 1 in 5 urgent, independently ──
  const oddsY = P ? -0.75 : -0.15;
  const oStep = P ? 1.30 : 1.78, oW = P ? 1.06 : 1.44, oH = P ? 0.96 : 1.12;
  const oddsCards = [0, 1, 2, 3, 4].map(i => {
    const x = (i - 2) * oStep;
    return makeCard([x, oddsY, 0], i === 0 ? 'urgent' : 'calm', i === 0 ? 'urgent' : 'calm', oW, oH, P ? 14 : 17);
  });
  const oUrgLab = T('1/5 urgent', P ? 16 : 19, URG, true); oUrgLab.moveTo([-2 * oStep, oddsY - 0.95, 0]);
  const oCalmLine = new M.Line({ start: [-oStep - oW / 2, oddsY - 0.72, 0], end: [2 * oStep + oW / 2, oddsY - 0.72, 0], color: C.cyan, strokeWidth: 2 });
  const oCalmLab = T('4/5 calm', P ? 16 : 19, C.cyan, true); oCalmLab.moveTo([0.5 * oStep, oddsY - 1.05, 0]);
  const oNote = T('each ticket is independent', P ? 16 : 18, C.muted); oNote.moveTo([0, oddsY - 1.75, 0]);
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(staffIcon, urgBadge, urgSub, ...qCards, qDots)),
    new M.LaggedStart(oddsCards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.3 }),
    new M.FadeIn(oUrgLab), new M.Create(oCalmLine), new M.FadeIn(oCalmLab), new M.FadeIn(oNote),
    ...say('1 IN 5 URGENT  ·  INDEPENDENT', URG, true)
  );

  // ── 3-9: Watch tickets arrive one by one, stop at first orange card ──
  const rY = P ? [0.1, -1.2, -2.5, -3.8] : [0.48, -0.36, -1.20, -2.04];
  const rColX = c => (P ? -2.2 : -4.65) + c * (P ? 1.14 : 1.25);
  const rLabX = P ? -3.25 : -5.78;
  const rProbX = P ? 2.82 : 0.75;
  const rCW = P ? 1.04 : 1.04, rCH = P ? 0.86 : 0.62;
  const RCF = 15;
  const hdrY = P ? 0.95 : 1.16;

  const colHdrs = [0, 1, 2, 3].map(c => {
    const t = T('#' + (c + 1), P ? 16 : 17, C.muted, true);
    t.moveTo([rColX(c), hdrY, 0]);
    return t;
  });
  const hdrTitle = T('ticket', 16, C.muted); hdrTitle.moveTo([rLabX, hdrY, 0]);
  const hdrProb = T('chance', 16, C.muted); hdrProb.moveTo([rProbX, hdrY, 0]);
  const hdrLine = new M.Line({ start: [rLabX - 0.45, hdrY - 0.25, 0], end: [rProbX + 0.55, hdrY - 0.25, 0], color: C.line, strokeWidth: 2 });

  // row labels shown up front so the table is not empty while the voice sets the rule
  const rowLabs = ['1st', '2nd', '3rd', '4th'].map((s, i) => {
    const t = T(s, P ? 17 : 17, i === 0 ? URG : C.cyan, true); t.moveTo([rLabX, rY[i], 0]); return t;
  });
  const firstQ = makeCard([rColX(0), rY[0], 0], 'mystery', '?', rCW, rCH, 20);
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...oddsCards, oUrgLab, oCalmLine, oCalmLab, oNote)),
    new M.FadeIn(new M.VGroup(hdrTitle, ...colHdrs, hdrProb)), new M.Create(hdrLine),
    new M.LaggedStart(rowLabs.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.0 }),
    new M.FadeIn(firstQ),
    ...say('STOP AT THE FIRST ORANGE CARD', URG)
  );

  const rowMobs = [hdrTitle, ...colHdrs, hdrProb, hdrLine];

  // 4: 1st ticket
  const [r1Lab, r2Lab, r3Lab, r4Lab] = rowLabs;
  const r1C0 = makeCard([rColX(0), rY[0], 0], 'urgent', 'urgent', rCW, rCH, RCF);
  const r1P = T('0.20', P ? 16 : 18, URG, true); r1P.moveTo([rProbX, rY[0], 0]);
  rowMobs.push(r1Lab, r1C0, r1P);
  await until(S(4));
  await play(
    new M.FadeOut(firstQ), new M.FadeIn(r1C0), new M.Flash(r1C0, { color: URG, flashRadius: 0.35 }), new M.FadeIn(r1P),
    ...fbox(['1st ticket urgent', ['1/5 = 0.20', URG]], URG),
    ...say('FIRST TICKET: 1/5 = 0.20', URG)
  );

  // 5: 2nd ticket (calm, then urgent)
  const r2C0 = makeCard([rColX(0), rY[1], 0], 'calm', 'calm', rCW, rCH, RCF);
  const r2C1 = makeCard([rColX(1), rY[1], 0], 'urgent', 'urgent', rCW, rCH, RCF);
  rowMobs.push(r2Lab, r2C0, r2C1);
  await until(S(5));
  await play(
    new M.LaggedStart([new M.FadeIn(r2C0), new M.FadeIn(r2C1)], { lagRatio: 0.5, runTime: 1.5 }),
    ...say('2ND: 1 CALM, THEN 1 URGENT', C.cyan)
  );

  // 6: 4/5 × 1/5 = 4/25 = 0.16
  const r2P = T('0.16', P ? 16 : 18, C.amber, true); r2P.moveTo([rProbX, rY[1], 0]);
  rowMobs.push(r2P);
  await until(S(6));
  await play(
    new M.Flash(r2C1, { color: URG, flashRadius: 0.32 }), new M.FadeIn(r2P),
    ...fbox(['2nd ticket urgent', '4/5 × 1/5 = 4/25', ['= 0.16', C.amber]], C.amber),
    ...say('4/5 × 1/5 = 4/25 = 0.16', C.amber)
  );

  // 7: 3rd ticket (2 calm, then urgent)
  const r3C0 = makeCard([rColX(0), rY[2], 0], 'calm', 'calm', rCW, rCH, RCF);
  const r3C1 = makeCard([rColX(1), rY[2], 0], 'calm', 'calm', rCW, rCH, RCF);
  const r3C2 = makeCard([rColX(2), rY[2], 0], 'urgent', 'urgent', rCW, rCH, RCF);
  rowMobs.push(r3Lab, r3C0, r3C1, r3C2);
  await until(S(7));
  await play(
    new M.LaggedStart([new M.FadeIn(r3C0), new M.FadeIn(r3C1), new M.FadeIn(r3C2)], { lagRatio: 0.4, runTime: 1.6 }),
    ...fbox(['3rd ticket urgent', ['4/5 × 4/5 × 1/5', C.cyan]], C.cyan),
    ...say('3RD: 2 CALM, THEN 1 URGENT', C.cyan)
  );

  // 8: 4/5 × 4/5 × 1/5 = 0.128
  const r3P = T('0.128', P ? 15 : 17, C.amber, true); r3P.moveTo([rProbX, rY[2], 0]);
  rowMobs.push(r3P);
  await until(S(8));
  await play(
    new M.Flash(r3C2, { color: URG, flashRadius: 0.32 }), new M.FadeIn(r3P),
    ...fbox(['3rd ticket urgent', '4/5 × 4/5 × 1/5', ['= 16/125 = 0.128', C.amber]], C.amber),
    ...say('4/5 × 4/5 × 1/5 = 0.128', C.amber)
  );

  // 9: 4th ticket (3 calm, then urgent, ≈ 0.10)
  const r4C0 = makeCard([rColX(0), rY[3], 0], 'calm', 'calm', rCW, rCH, RCF);
  const r4C1 = makeCard([rColX(1), rY[3], 0], 'calm', 'calm', rCW, rCH, RCF);
  const r4C2 = makeCard([rColX(2), rY[3], 0], 'calm', 'calm', rCW, rCH, RCF);
  const r4C3 = makeCard([rColX(3), rY[3], 0], 'urgent', 'urgent', rCW, rCH, RCF);
  const r4P = T('≈ 0.10', P ? 15 : 17, C.amber, true); r4P.moveTo([rProbX, rY[3], 0]);
  rowMobs.push(r4Lab, r4C0, r4C1, r4C2, r4C3, r4P);
  await until(S(9));
  await play(
    new M.LaggedStart([new M.FadeIn(r4C0), new M.FadeIn(r4C1), new M.FadeIn(r4C2), new M.FadeIn(r4C3)], { lagRatio: 0.32, runTime: 1.8 }),
    new M.FadeIn(r4P),
    ...fbox(['4th ticket urgent', '(4/5)³ × 1/5 = 0.1024', ['≈ 0.10', C.amber]], C.amber),
    ...say('4TH: 3 CALM, 1 URGENT ≈ 0.10', C.amber)
  );

  // ── 10-16: The geometric bar chart (k = 1..10 + forever tail) ──
  const NBARS = 10;
  const probs = Array.from({ length: NBARS }, (_, i) => Math.pow(0.8, i) * 0.2);
  const BBASE = P ? -3.80 : -2.10;
  const BSCALE = P ? 18.0 : 13.5;
  const barStep = P ? 0.61 : 0.72, barW = P ? 0.43 : 0.52;
  const barX = k => (P ? -2.92 : -5.65) + (k - 1) * barStep;
  const barTop = k => BBASE + probs[k - 1] * BSCALE;

  const floor = new M.Line({ start: [barX(1) - barW, BBASE, 0], end: [barX(NBARS) + barW + 0.55, BBASE, 0], color: C.muted, strokeWidth: 2 });
  const bars = probs.map((p, i) => {
    const h = p * BSCALE;
    const b = new M.Rectangle({ width: barW, height: h, color: C.cyan, strokeWidth: 2 });
    b.setFill(C.cyan, 0.72);
    b.moveTo([barX(i + 1), BBASE + h / 2, 0]);
    return b;
  });
  const xLabs = Array.from({ length: NBARS }, (_, i) => {
    const t = T(String(i + 1), P ? 15 : 17, C.muted, true);
    t.moveTo([barX(i + 1), BBASE - 0.28, 0]);
    return t;
  });
  const valTexts = ['0.20', '0.16', '0.128', '0.10'];
  const valLabs = valTexts.map((s, i) => {
    const t = T(s, P ? 16 : 17, C.cyan, true);
    t.moveTo([barX(i + 1), barTop(i + 1) + 0.26, 0]);
    return t;
  });

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(...rowMobs)), ...clearBox(),
    new M.Create(floor),
    new M.LaggedStart([0, 1, 2, 3].map(i => new M.FadeIn(bars[i])), { lagRatio: 0.45, runTime: 3.0 }),
    new M.LaggedStart([0, 1, 2, 3].map(i => new M.FadeIn(xLabs[i])), { lagRatio: 0.45, runTime: 2.2 }),
    new M.LaggedStart(valLabs.map(v => new M.FadeIn(v)), { lagRatio: 0.45, runTime: 3.0 }),
    ...say('BARS: 0.20, 0.16, 0.128, ≈ 0.10', C.cyan)
  );

  // 11: Each bar is 4/5 of the one before
  const stepArrows = [1, 2, 3].map(k => {
    const x1 = barX(k) + 0.08, y1 = barTop(k) + 0.50;
    const x2 = barX(k + 1) - 0.05, y2 = barTop(k + 1) + 0.50;
    const arr = makeArrow([x1, y1, 0], [x2, y2, 0], C.amber, 2.2, 0.11);
    const lbl = T('×4/5', 15, C.amber, true);
    lbl.moveTo([(x1 + x2) / 2 + 0.14, (y1 + y2) / 2 + 0.24, 0]);
    return new M.VGroup(arr, lbl);
  });
  await until(S(11));
  await play(
    new M.LaggedStart(stepArrows.map(a => new M.FadeIn(a)), { lagRatio: 0.25, runTime: 1.5 }),
    ...fbox(['bar pattern', ['next = previous × 4/5', C.amber]], C.amber),
    ...say('EACH BAR = 4/5 OF THE ONE BEFORE', C.amber)
  );

  // 12: Each extra ticket of waiting needs one more calm ticket
  await until(S(12));
  await play(
    new M.LaggedStart(stepArrows.map(a => new M.Indicate(a, { color: C.cyan })), { lagRatio: 0.25, runTime: 2.0 }),
    ...fbox(['+1 ticket of waiting', '+1 calm ticket needed', ['costs a factor of 4/5', C.cyan]], C.cyan),
    ...say('ONE MORE CALM TICKET → × 4/5', C.cyan)
  );

  // 13: Bars shrink step by step, never reach zero
  const tailText = T('→ ...', P ? 15 : 17, C.violet, true);
  tailText.moveTo([barX(NBARS) + (P ? 0.62 : 0.68), BBASE + 0.22, 0]);
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(...stepArrows)),
    new M.LaggedStart(bars.slice(4).map(b => new M.FadeIn(b)), { lagRatio: 0.22, runTime: 2.4 }),
    new M.LaggedStart(xLabs.slice(4).map(l => new M.FadeIn(l)), { lagRatio: 0.22, runTime: 2.0 }),
    new M.FadeIn(tailText),
    ...fbox(['k = 5:  0.082', 'k = 8:  0.042', ['k = 10: 0.027  → ...', C.violet]], C.violet),
    ...say('SHRINKS FOREVER · NEVER ZERO', C.violet)
  );

  // 14: Added together forever = 1
  await until(S(14));
  await play(
    new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.08, runTime: 2.2 }),
    ...fbox(['0.20 + 0.16 + 0.128 + ...', ['sum forever = 1', C.green]], C.green),
    ...say('ALL BARS ADDED FOREVER = 1', C.green)
  );

  // 15: Geometric waiting count
  await until(S(15));
  await play(
    new M.LaggedStart(xLabs.map(l => new M.Indicate(l, { color: C.green })), { lagRatio: 0.06, runTime: 1.6 }),
    ...fbox([['Geometric waiting count', C.green], 'ticket number of', 'the first urgent ("yes")'], C.green),
    ...say('GEOMETRIC WAITING COUNT', C.green)
  );

  // 16: Shrinking staircase
  const stairLines = [];
  for (let k = 1; k <= NBARS; k++) {
    const lx = barX(k) - barW / 2, rx = barX(k) + barW / 2, ty = barTop(k) + 0.05;
    stairLines.push(new M.Line({ start: [lx, ty, 0], end: [rx, ty, 0], color: C.amber, strokeWidth: 3 }));
    if (k < NBARS) {
      stairLines.push(new M.Line({ start: [rx, ty, 0], end: [barX(k + 1) - barW / 2, barTop(k + 1) + 0.05, 0], color: C.amber, strokeWidth: 2 }));
    }
  }
  await until(S(16));
  await play(
    new M.LaggedStart(stairLines.map(l => new M.Create(l)), { lagRatio: 0.06, runTime: 2.2 }),
    ...say('LIKE A SHRINKING STAIRCASE', C.amber)
  );

  // ── 17-20: Expected value / balance point at 5 ──
  const fulc = makeFulcrumParts(barX(2.6), BBASE, C.amber);
  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(...stairLines)),
    ...fulc.map(p => new M.FadeIn(p)),
    ...fbox(['expected value', ['balance point of the bars', C.amber]], C.amber),
    ...say('AVERAGE WAIT = BALANCE POINT', C.amber)
  );

  // 18: Balance at 5 tickets (short 2.5s window)
  const fulcTarget = makeFulcrumParts(barX(5), BBASE, C.amber);
  const balLine = new M.DashedLine({ start: [barX(5), BBASE, 0], end: [barX(5), barTop(1) + 0.15, 0], color: C.amber });
  const balTag = T('5', P ? 18 : 20, C.amber, true, true); balTag.moveTo([barX(5), BBASE - 0.66, 0]);
  bars[4].setFill(C.amber, 0.85); bars[4].setColor(C.amber);
  await until(S(18));
  await play(
    ...fulc.map((p, i) => new M.Transform(p, fulcTarget[i], { runTime: 1.0 })),
    new M.FadeOut(xLabs[4]),
    new M.Create(balLine, { runTime: 1.0 }),
    new M.FadeIn(balTag),
    ...say('THE BARS BALANCE AT 5 TICKETS', C.amber)
  );

  // 19: 1 in 5 urgent -> wait 5 on average
  await until(S(19));
  await play(
    new M.Flash(fulc[3], { color: C.amber, flashRadius: 0.25 }),
    new M.Indicate(bars[4], { color: C.amber }),
    ...fbox(['1 in 5 tickets is urgent', 'average wait:', ['5 tickets', C.amber]], C.amber),
    ...say('1 IN 5 URGENT  →  WAIT 5 ON AVERAGE', C.amber)
  );

  // 20: Mean wait = 1 divided by p
  await until(S(20));
  await play(
    ...fbox([['mean wait = 1 ÷ p', C.ink], ['          = 1 ÷ (1/5)', C.muted], ['          = 5 tickets', C.amber]], C.green),
    ...say('MEAN WAIT = 1 ÷ p', C.green)
  );

  // ── 21-24: The short version (formula) ──
  const yAxisTag = T('Y =', P ? 15 : 17, C.cyan, true, true);
  yAxisTag.moveTo([barX(1) - (P ? 0.56 : 0.62), BBASE - 0.28, 0]);
  await until(S(21));
  await play(
    new M.FadeIn(yAxisTag),
    ...fbox([['Y = ticket of first yes', C.cyan], 'p = 1/5   (urgent)', '1 − p = 4/5  (calm)'], C.cyan),
    ...say('Y = TICKET OF THE FIRST YES', C.cyan)
  );

  await until(S(22));
  await play(
    ...fbox([['P(Y = k) = (1 − p)ᵏ⁻¹ × p', C.amber], ['(1 − p)ᵏ⁻¹  k − 1 calm first', C.cyan], ['× p        then urgent', URG]], C.amber),
    ...say('P(Y = k) = (1 − p)ᵏ⁻¹ × p', C.amber)
  );

  // 23: Read it: k-1 calm tickets, then one urgent ticket
  // recipe sits clear of the chart: laptop under the formula box, phone between pill and chart
  const recX = P ? 0.1 : 4.25, recY = P ? 1.05 : -2.0;
  const rCard1 = makeCard([recX - 1.35, recY, 0], 'calm', 'calm', 1.0, 0.66, 15);
  const rDots = T('···', 20, C.cyan, true); rDots.moveTo([recX - 0.5, recY, 0]);
  const rCard2 = makeCard([recX + 0.35, recY, 0], 'calm', 'calm', 1.0, 0.66, 15);
  const rCardU = makeCard([recX + 1.55, recY, 0], 'urgent', 'urgent', 1.1, 0.66, 15);
  const rLblC = T('k − 1 calm', 16, C.cyan, true); rLblC.moveTo([recX - 0.5, recY - 0.56, 0]);
  const rLblU = T('1 urgent', 16, URG, true); rLblU.moveTo([recX + 1.55, recY - 0.56, 0]);
  const recipeGroup = new M.VGroup(rCard1, rDots, rCard2, rCardU, rLblC, rLblU);
  await until(S(23));
  await play(
    new M.FadeIn(recipeGroup),
    ...say('k − 1 CALM, THEN 1 URGENT', C.cyan)
  );

  // 24: Check k = 3
  bars[4].setFill(C.cyan, 0.72); bars[4].setColor(C.cyan);
  bars[2].setFill(URG, 0.88); bars[2].setColor(URG);
  await until(S(24));
  await play(
    new M.FadeOut(recipeGroup),
    new M.Indicate(bars[2], { color: URG }),
    new M.Flash(valLabs[2], { color: URG, flashRadius: 0.28 }),
    ...fbox([['k = 3:', URG], 'P(Y = 3) = (4/5)² × 1/5', '         = 0.8 × 0.8 × 0.2', ['         = 0.128  ✓', C.green]], C.green),
    ...say('CHECK k = 3:  (4/5)² × 1/5 = 0.128', C.green)
  );

  // ── 25-26: What it is for ──
  const chartAll = [floor, ...bars, ...xLabs.filter((_, i) => i !== 4), ...valLabs, tailText, ...fulc, balLine, balTag, yAxisTag];
  const waitY = P ? -0.9 : -0.25, wStep = P ? 1.55 : 2.1;
  const wCards = [0, 1, 2].map(i => makeCard([(i - 1.65) * wStep, waitY, 0], 'calm', 'no', P ? 1.15 : 1.5, P ? 0.95 : 1.05, P ? 18 : 20));
  const wArr = makeArrow([0.92 * wStep, waitY, 0], [1.22 * wStep, waitY, 0], C.green, 3, 0.14);
  const wYes = makeCard([1.85 * wStep, waitY, 0], 'green', 'YES!', P ? 1.35 : 1.7, P ? 1.0 : 1.1, P ? 19 : 22);
  const wSub = T('count trials until the first success', P ? 17 : 20, C.muted); wSub.moveTo([0, waitY - 1.15, 0]);
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(...chartAll)), ...clearBox(),
    new M.LaggedStart([...wCards.map(c => new M.FadeIn(c)), new M.FadeIn(wArr), new M.FadeIn(wYes)], { lagRatio: 0.18, runTime: 1.5 }),
    new M.FadeIn(wSub),
    ...say('WAITING FOR A FIRST SUCCESS', C.green, true)
  );

  // 26: Three everyday examples
  function appCard(pos, title, sub, nNo, col) {
    const cw = P ? 6.2 : 3.7, ch = P ? 1.42 : 2.3;
    const r = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.18, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.94); r.moveTo(pos);
    const t1 = T(title, P ? 19 : 21, col, true, true); t1.moveTo([pos[0], pos[1] + (P ? 0.36 : 0.62), 0]);
    const t2 = T(sub, P ? 15 : 16, C.muted); t2.moveTo([pos[0], pos[1] + (P ? -0.02 : 0.14), 0]);
    const dots = [];
    const total = nNo + 1, ds = 0.42;
    for (let i = 0; i < total; i++) {
      const dx = pos[0] + (i - (total - 1) / 2) * ds, dy = pos[1] - (P ? 0.40 : 0.56);
      const d = new M.Dot({ point: [dx, dy, 0], radius: i === nNo ? 0.12 : 0.08, color: i === nNo ? col : C.muted });
      d.setFill(i === nNo ? col : C.muted, i === nNo ? 1 : 0.45);
      dots.push(d);
    }
    return new M.VGroup(r, t1, t2, ...dots);
  }
  const appPos = P ? [[0, 0.35, 0], [0, -1.45, 0], [0, -3.25, 0]] : [[-4.2, -0.35, 0], [0, -0.35, 0], [4.2, -0.35, 0]];
  const apps = [
    appCard(appPos[0], 'CALLS → SALE', 'calls until a first buyer', 3, C.cyan),
    appCard(appPos[1], 'TRIES → FAIL', 'tries until a part fails', 4, URG),
    appCard(appPos[2], 'DAYS → RAIN', 'days until a rainy day', 2, C.violet),
  ];
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(...wCards, wArr, wYes, wSub)),
    new M.LaggedStart(apps.map(a => new M.FadeIn(a)), { lagRatio: 0.55, runTime: 3.8 }),
    ...say('THREE EVERYDAY WAITS', C.cyan, true)
  );

  // ── 27-34: The common trap (memoryless) ──
  const mY = P ? -0.65 : -0.15;
  const mCW = P ? 0.96 : 1.12, mCH = P ? 1.02 : 1.12;
  const mX = P ? [-2.90, -1.78, -0.66, 0.46, 2.32] : [-5.65, -4.35, -3.05, -1.75, 0.35];
  const mDivX = P ? 1.35 : -0.75;

  const calm4 = [0, 1, 2, 3].map(i => makeCard([mX[i], mY, 0], 'calm', 'calm', mCW, mCH, P ? 14 : 16));
  const mNums = [0, 1, 2, 3].map(i => {
    const t = T('#' + (i + 1), P ? 14 : 16, C.muted, true);
    t.moveTo([mX[i], mY - (P ? 0.78 : 0.85), 0]);
    return t;
  });
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(...apps)),
    new M.LaggedStart(calm4.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.6 }),
    new M.FadeIn(new M.VGroup(...mNums)),
    ...say('THE TRAP: 4 CALM IN A ROW', C.pink)
  );

  // 28: Surely the next one is due? (short 2.8s window)
  const card5 = makeCard([mX[4], mY, 0], 'pink', '?', mCW + 0.08, mCH, P ? 22 : 24);
  const num5 = T('#5', P ? 15 : 17, C.pink, true, true); num5.moveTo([mX[4], mY - (P ? 0.78 : 0.85), 0]);
  const dueTag = T('DUE?', P ? 17 : 19, C.pink, true, true); dueTag.moveTo([mX[4], mY + (P ? 0.82 : 0.88), 0]);
  await until(S(28));
  await play(
    new M.FadeIn(card5), new M.FadeIn(num5), new M.FadeIn(dueTag),
    new M.Indicate(card5, { color: C.pink }),
    ...say('IS TICKET #5 “DUE” TO BE URGENT?', C.pink)
  );

  // 29: 4 calm in a row happen often: (4/5)^4 = 0.4096 ≈ 41 in 100
  const box4W = mX[3] - mX[0] + mCW + 0.34, box4H = mCH + 0.36;
  const frame4 = new M.RoundedRectangle({ width: box4W, height: box4H, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  frame4.moveTo([(mX[0] + mX[3]) / 2, mY, 0]);
  await until(S(29));
  await play(
    new M.Create(frame4),
    ...fbox(['4 calm in a row:', '(4/5)⁴ = 0.8⁴', ['= 0.4096  (≈ 41%)', C.cyan], ['happens often!', C.muted]], C.cyan),
    ...say('4 CALM IN A ROW ≈ 41 IN 100', C.cyan)
  );

  // 30: Tickets do not remember each other (short 2.5s window)
  const divider = new M.DashedLine({ start: [mDivX, mY - 1.15, 0], end: [mDivX, mY + 1.15, 0], color: C.amber });
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(frame4, dueTag)),
    new M.Create(divider, { runTime: 0.9 }),
    ...say('TICKETS DO NOT REMEMBER', C.amber)
  );

  // 31: Fifth ticket still urgent with chance 1 in 5
  const card5Real = makeCard([mX[4], mY, 0], 'urgent', '1/5', mCW + 0.08, mCH, P ? 20 : 22);
  const badge5 = T('20% urgent', P ? 14 : 16, URG, true); badge5.moveTo([mX[4], mY - (P ? 1.25 : 1.32), 0]);
  await until(S(31));
  await play(
    new M.FadeOut(card5), new M.FadeIn(card5Real), new M.Flash(card5Real, { color: URG, flashRadius: 0.36 }),
    new M.FadeIn(badge5),
    ...fbox(['ticket #5 alone:', ['P(urgent) = 1/5', URG], 'still 20%, no more'], URG),
    ...say('TICKET #5: STILL 1 IN 5', URG)
  );

  // 32: Waiting starts fresh
  const dim4 = [0, 1, 2, 3].map(i => makeCard([mX[i], mY, 0], 'dim', 'calm', mCW, mCH, P ? 14 : 16));
  const freshTag = T('FRESH START', P ? 14 : 16, C.green, true, true); freshTag.moveTo([mX[4], mY + (P ? 0.85 : 0.90), 0]);
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(...calm4)),
    new M.FadeIn(new M.VGroup(...dim4)),
    new M.FadeIn(freshTag),
    ...say('WAITING STARTS FRESH', C.green)
  );

  // 33: Memoryless
  await until(S(33));
  await play(
    new M.Indicate(divider, { color: C.violet }),
    ...fbox([['Memoryless', C.violet], 'no memory of', 'the wait so far'], C.violet),
    ...say('MEMORYLESS: NO MEMORY OF THE WAIT', C.violet)
  );

  // 34: After 4 calm tickets, expected extra wait is still 5
  const spanY = P ? -2.95 : -2.05;
  const spanL = P ? 0.85 : -0.60, spanR = P ? 3.25 : 1.65;
  const extraArr = makeArrow([spanL, spanY, 0], [spanR, spanY, 0], C.amber, 3, 0.14);
  const extraLab = T('extra wait = 5 tickets', P ? 16 : 18, C.amber, true); extraLab.moveTo([(spanL + spanR) / 2, spanY - 0.42, 0]);
  await until(S(34));
  await play(
    new M.FadeIn(extraArr), new M.FadeIn(extraLab),
    ...fbox(['after 4 calm tickets:', 'expected extra wait', ['= 1 ÷ (1/5) = 5', C.amber]], C.amber),
    ...say('EXPECTED EXTRA WAIT = STILL 5', C.amber)
  );

  // ── 35: Bridge to next lesson (wait for the 3rd urgent) ──
  const memAll = [...dim4, ...mNums, card5Real, num5, badge5, divider, freshTag, extraArr, extraLab];
  const brKinds = ['calm', 'urgent', 'calm', 'calm', 'urgent', 'calm', 'urgent'];
  const brY = P ? -1.0 : -0.30, brStep = P ? 1.00 : 1.54, brCW = P ? 0.84 : 1.22, brCH = P ? 0.94 : 1.08;
  const brCards = brKinds.map((k, i) => makeCard([(i - 3) * brStep, brY, 0], k, k === 'urgent' ? 'urgent' : 'calm', brCW, brCH, P ? 12 : 15));
  const brTags = [[1, '1st'], [4, '2nd'], [6, '3rd']].map(([idx, s]) => {
    const t = T(s, P ? 16 : 19, idx === 6 ? C.amber : URG, true, true);
    t.moveTo([(idx - 3) * brStep, brY + (P ? 0.82 : 0.88), 0]);
    return t;
  });
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(...memAll)), ...clearBox(),
    new M.LaggedStart(brCards.map(c => new M.FadeIn(c)), { lagRatio: 0.14, runTime: 1.8 }),
    new M.FadeIn(new M.VGroup(...brTags)),
    new M.Flash(brCards[6], { color: C.amber, flashRadius: 0.42 }),
    ...say('NEXT LESSON: WAIT FOR THE 3RD URGENT', C.violet, true)
  );

  // ── 36: One-sentence recap ──
  const recBase = P ? -4.25 : -2.15, recScale = P ? 15.5 : 13.0;
  const recStep = P ? 1.10 : 1.12, recBW = P ? 0.72 : 0.76;
  const recBX = k => (P ? -2.20 : -4.45) + (k - 1) * recStep;
  const recFloor = new M.Line({ start: [recBX(1) - 0.55, recBase, 0], end: [recBX(5) + 0.85, recBase, 0], color: C.muted, strokeWidth: 2 });
  const recBars = [0, 1, 2, 3, 4].map(i => {
    const h = probs[i] * recScale;
    const b = new M.Rectangle({ width: recBW, height: h, color: i === 4 ? C.amber : C.cyan, strokeWidth: 2 });
    b.setFill(i === 4 ? C.amber : C.cyan, i === 4 ? 0.85 : 0.72);
    b.moveTo([recBX(i + 1), recBase + h / 2, 0]);
    return b;
  });
  const recNums = [0, 1, 2, 3, 4].map(i => {
    const t = T(String(i + 1), P ? 16 : 18, i === 4 ? C.amber : C.muted, true, i === 4);
    t.moveTo([recBX(i + 1), recBase - 0.30, 0]);
    return t;
  });
  const recTail = T('→ ...', P ? 16 : 18, C.muted, true); recTail.moveTo([recBX(5) + 0.78, recBase + 0.35, 0]);
  const recBal = T('mean = 1 ÷ p', P ? 18 : 19, C.amber, true);
  const recBalY = recBase + probs[0] * recScale + 0.1;
  recBal.moveTo([recBX(5) + 0.1, recBalY, 0]);
  const recBalLn = new M.DashedLine({ start: [recBX(5), recBalY - 0.22, 0], end: [recBX(5), recBase + probs[4] * recScale + 0.08, 0], color: C.amber });
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...brCards, ...brTags)),
    new M.Create(recFloor),
    new M.LaggedStart(recBars.map(b => new M.FadeIn(b)), { lagRatio: 0.14, runTime: 1.4 }),
    new M.FadeIn(new M.VGroup(...recNums, recTail, recBal)), new M.Create(recBalLn),
    ...fbox([['Geometric waiting count', C.green], 'Y = trial of the first yes', 'P(Y = k) = (1 − p)ᵏ⁻¹ × p', ['average wait = 1 ÷ p', C.amber]], C.amber, P ? 22 : 21),
    ...say('FIRST YES  ·  AVERAGE WAIT = 1 ÷ p', C.amber)
  );
}

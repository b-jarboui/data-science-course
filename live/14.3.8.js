// 14.3.8 UMAP: building a map from neighbors (live manim-web lesson).
// Beat i = sentence i (0-based, 0..54). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // --- shared chapter 14.3 data (exact) ------------------------------------
  const TEAS = [
    { id: 'A', scores: [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3] },
    { id: 'B', scores: [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3] },
    { id: 'C', scores: [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7] },
    { id: 'D', scores: [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7] },
  ];

  // Exact full-batch UMAP trajectory (a=1, b=1, lr=0.25, edges A-B and C-D)
  function computeTrajectory(nSteps = 10, lr = 0.25) {
    const adj = [
      [0, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
    ];
    let pts = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const evalState = p => {
      const gx = [0, 0, 0, 0], gy = [0, 0, 0, 0];
      let loss = 0;
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          const dx = p[i][0] - p[j][0], dy = p[i][1] - p[j][1];
          const d2 = dx * dx + dy * dy, w = adj[i][j], q = 1 / (1 + d2);
          if (w > 0) loss -= w * Math.log(Math.max(1e-12, q));
          if (w < 1) loss -= (1 - w) * Math.log(Math.max(1e-12, d2 / (1 + d2)));
          const coef = 2 * w * q - 2 * (1 - w) / (Math.max(1e-6, d2) * (1 + d2));
          gx[i] += coef * dx; gy[i] += coef * dy;
          gx[j] -= coef * dx; gy[j] -= coef * dy;
        }
      }
      return { loss, gx, gy };
    };
    const out = [];
    for (let k = 0; k <= nSteps; k++) {
      const { loss, gx, gy } = evalState(pts);
      out.push({ pts: pts.map(v => v.slice()), loss, dxD: -lr * gx[3], dyD: -lr * gy[3] });
      pts = pts.map((v, i) => [v[0] - lr * gx[i], v[1] - lr * gy[i]]);
    }
    return out;
  }
  const TRAJ = computeTrajectory(10, 0.25);

  // --- layout constants (phone: y in [-5.5, 4.3], laptop: y in [-3.0, 2.3]) ---
  const MC = P ? [0, -1.25] : [-2.55, -0.65];
  const MS = P ? 1.6 : 1.32;
  const PILL = P ? [0, 1.98, 0] : [MC[0], 1.95, 0];
  const BOXP = P ? [0, 3.30, 0] : [4.35, 0.92, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Convert map coordinate (mx, my) to screen point; keep tiny visual floor so settled pairs stay legible
  const toScr = (mx, my, minSep = false) => {
    const vy = minSep && Math.abs(my) < 0.13 ? (my >= 0 ? 0.13 : -0.13) : my;
    return [MC[0] + mx * MS, MC[1] + vy * MS, 0];
  };
  const labelOffset = idx => (idx === 1 || idx === 3) ? [0, 0.34] : [0, -0.34];
  const labPos = (mx, my, idx, minSep = false) => {
    const p = toScr(mx, my, minSep), o = labelOffset(idx);
    return [p[0] + o[0], p[1] + o[1], 0];
  };

  // --- formula box helper (one box at a time, matches 1.2.4) ---------------
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.38 : 0.40;
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
    const maxw = P ? FW - 0.9 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.45 })];
  }

  // --- primitive helpers (no VGroup.shift, fills via setFill) --------------
  const mkDot = (p, r, col, op = 1) => {
    const d = new M.Dot({ point: p, radius: r, color: col });
    d.setFill(col, op);
    return d;
  };
  const mkLine = (a, b, col, sw = 3, op = 1) => {
    const l = new M.Line({ start: a, end: b, color: col, strokeWidth: sw });
    l.setStrokeOpacity(op);
    return l;
  };
  function makeArrow(a, b, color = C.cyan, sw = 3, tip = 0.16) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const shaft = new M.Line({ start: a, end: b, color, strokeWidth: sw });
    const w1 = new M.Line({ start: b, end: [b[0] - ux * tip + px * tip * 0.55, b[1] - uy * tip + py * tip * 0.55, 0], color, strokeWidth: sw });
    const w2 = new M.Line({ start: b, end: [b[0] - ux * tip - px * tip * 0.55, b[1] - uy * tip - py * tip * 0.55, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, w1, w2);
  }
  function makeDoubleArrow(a, b, color = C.pink, sw = 3, tip = 0.16) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const shaft = new M.Line({ start: a, end: b, color, strokeWidth: sw });
    const b1 = new M.Line({ start: b, end: [b[0] - ux * tip + px * tip * 0.55, b[1] - uy * tip + py * tip * 0.55, 0], color, strokeWidth: sw });
    const b2 = new M.Line({ start: b, end: [b[0] - ux * tip - px * tip * 0.55, b[1] - uy * tip - py * tip * 0.55, 0], color, strokeWidth: sw });
    const a1 = new M.Line({ start: a, end: [a[0] + ux * tip + px * tip * 0.55, a[1] + uy * tip + py * tip * 0.55, 0], color, strokeWidth: sw });
    const a2 = new M.Line({ start: a, end: [a[0] + ux * tip - px * tip * 0.55, a[1] + uy * tip - py * tip * 0.55, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, b1, b2, a1, a2);
  }

  // =========================================================================
  // 0–2: INTRO — TEAS ON A 2D SHELF
  // =========================================================================
  const shelfW = P ? 6.4 : 6.4, shelfH = P ? 4.0 : 3.3;
  const shelfRect = new M.RoundedRectangle({ width: shelfW, height: shelfH, cornerRadius: 0.22, color: C.muted, strokeWidth: 2 });
  shelfRect.setFill(C.card, 0.55); shelfRect.moveTo([MC[0], MC[1], 0]);
  const shelfLab = T('2D tea shelf', P ? 17 : 18, C.muted);
  shelfLab.moveTo([MC[0], MC[1] - shelfH / 2 - 0.30, 0]);
  const introCoords = [[-1.1, -0.55], [-0.85, 0.55], [0.85, -0.55], [1.1, 0.55]];
  const introDots = introCoords.map((p, i) => {
    const sp = [MC[0] + p[0] * (P ? 1.9 : 1.55), MC[1] + p[1] * (P ? 1.5 : 1.15), 0];
    const col = i < 2 ? C.cyan : C.amber;
    const h = mkDot(sp, 0.30, col, 0.18), d = mkDot(sp, 0.14, col, 1);
    const t = T(TEAS[i].id, 20, C.ink, true, true); t.moveTo([sp[0], sp[1] + 0.36, 0]);
    return new M.VGroup(h, d, t);
  });

  await until(S(0));
  await play(
    new M.FadeIn(shelfRect, { runTime: 0.7 }),
    new M.FadeIn(shelfLab, { runTime: 0.7 }),
    new M.LaggedStart(introDots.map(g => new M.FadeIn(g)), { lagRatio: 0.14, runTime: 1.2 }),
    ...say('ARRANGE SIMILAR TEAS TOGETHER', C.cyan)
  );

  // S(1): 12 tasting scores -> 2 shelf directions
  const dirX = makeArrow([MC[0] - shelfW / 2 + 0.45, MC[1] - shelfH / 2 + 0.35, 0], [MC[0] + shelfW / 2 - 0.45, MC[1] - shelfH / 2 + 0.35, 0], C.amber, 2.5, 0.14);
  const dirY = makeArrow([MC[0] - shelfW / 2 + 0.45, MC[1] - shelfH / 2 + 0.35, 0], [MC[0] - shelfW / 2 + 0.45, MC[1] + shelfH / 2 - 0.35, 0], C.amber, 2.5, 0.14);
  const dirXLab = T('direction 1', 15, C.amber); dirXLab.moveTo([MC[0] + 0.2, MC[1] - shelfH / 2 + 0.58, 0]);
  const dirYLab = T('direction 2', 15, C.amber); dirYLab.moveTo([MC[0] - shelfW / 2 + 1.28, MC[1] + shelfH / 2 - 0.50, 0]);
  await until(S(1));
  await play(
    new M.FadeIn(dirX, { runTime: 0.7 }), new M.FadeIn(dirY, { runTime: 0.7 }),
    new M.FadeIn(dirXLab, { runTime: 0.7 }), new M.FadeIn(dirYLab, { runTime: 0.7 }),
    ...fbox(['each tea: 12 scores', ['shelf:     2 directions', C.amber]], C.amber),
    ...say('12 SCORES → 2 DIRECTIONS', C.amber)
  );

  // S(2): keep closest relationships?
  const p0 = [MC[0] + introCoords[0][0] * (P ? 1.9 : 1.55), MC[1] + introCoords[0][1] * (P ? 1.5 : 1.15), 0];
  const p1 = [MC[0] + introCoords[1][0] * (P ? 1.9 : 1.55), MC[1] + introCoords[1][1] * (P ? 1.5 : 1.15), 0];
  const p2 = [MC[0] + introCoords[2][0] * (P ? 1.9 : 1.55), MC[1] + introCoords[2][1] * (P ? 1.5 : 1.15), 0];
  const p3 = [MC[0] + introCoords[3][0] * (P ? 1.9 : 1.55), MC[1] + introCoords[3][1] * (P ? 1.5 : 1.15), 0];
  const prev1 = new M.DashedLine({ start: p0, end: p1, color: C.violet });
  const prev2 = new M.DashedLine({ start: p2, end: p3, color: C.violet });
  await until(S(2));
  await play(
    new M.Create(prev1, { runTime: 0.7 }), new M.Create(prev2, { runTime: 0.7 }),
    new M.Indicate(introDots[0], { color: C.violet, runTime: 0.8 }),
    new M.Indicate(introDots[1], { color: C.violet, runTime: 0.8 }),
    ...say('KEEP CLOSEST RELATIONSHIPS?', C.violet)
  );

  // =========================================================================
  // 3–9: TWELVE TASTING SCORES & SQUARED DISTANCES FOR A, B, C, D
  // =========================================================================
  const cardW = P ? 3.35 : 3.50, cardH = P ? 2.45 : 1.78;
  const cardCenters = P
    ? [[-1.80, -0.25], [1.80, -0.25], [-1.80, -2.95], [1.80, -2.95]]
    : [[-4.45, 0.35], [-0.65, 0.35], [-4.45, -1.65], [-0.65, -1.65]];
  const barPitch = P ? 0.22 : 0.23, barW = P ? 0.16 : 0.17, maxBarH = P ? 1.6 : 1.05;

  const cards = [], cardBorders = [], cardBars = [];
  TEAS.forEach((tea, idx) => {
    const [cx, cy] = cardCenters[idx];
    const border = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.14, color: C.line, strokeWidth: 2 });
    border.setFill(C.card, 0.90); border.moveTo([cx, cy, 0]);
    const baseY = cy - cardH / 2 + 0.34;
    const baseLine = mkLine([cx - cardW / 2 + 0.38, baseY, 0], [cx + cardW / 2 - 0.18, baseY, 0], C.muted, 1.5, 0.6);
    const letter = T(tea.id, 22, C.ink, true, true);
    letter.moveTo([cx - cardW / 2 + 0.28, cy + cardH / 2 - 0.28, 0]);
    const bars = tea.scores.map((scVal, j) => {
      const col = j < 6 ? C.cyan : C.amber;
      const h = (scVal / 10) * maxBarH;
      const bx = cx - cardW / 2 + 0.56 + j * barPitch;
      const b = new M.Rectangle({ width: barW, height: h, color: col, strokeWidth: 1 });
      b.setFill(col, 0.85);
      b.moveTo([bx, baseY + h / 2, 0]);
      return b;
    });
    cardBorders.push(border);
    cardBars.push(bars);
    cards.push(new M.VGroup(border, baseLine, letter, ...bars));
  });
  const legendBar = T('cyan: floral–fruit (6)   amber: roast–smoke (6)', P ? 15 : 15, C.muted);
  legendBar.moveTo([P ? 0 : MC[0], P ? -4.55 : -2.76, 0]);

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(shelfRect, shelfLab, dirX, dirY, dirXLab, dirYLab, prev1, prev2, ...introDots), { runTime: 0.55 }),
    ...fbox([['first 6: floral–fruit', C.cyan], ['last 6:  roast–smoke', C.amber]], C.cyan),
    ...say('12 TASTING SCORES: A, B, C, D', C.cyan)
  );
  await play(
    new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.1 }),
    new M.FadeIn(legendBar, { runTime: 0.6 })
  );

  // S(4): squared differences between matching scores
  const makeCardHighlight = (idx, col) => {
    const [cx, cy] = cardCenters[idx];
    const r = new M.RoundedRectangle({ width: cardW + 0.08, height: cardH + 0.08, cornerRadius: 0.16, color: col, strokeWidth: 3.5 });
    r.moveTo([cx, cy, 0]);
    return r;
  };
  let hlA = makeCardHighlight(0, C.pink);
  let hlOther = makeCardHighlight(1, C.pink);
  // Pink outline around Floral & Jasmine bars (bars 0 & 1) of A and B
  const fjBox = idx => {
    const [cx, cy] = cardCenters[idx], baseY = cy - cardH / 2 + 0.34;
    const x0 = cx - cardW / 2 + 0.56 + 0.5 * barPitch;
    const r = new M.RoundedRectangle({ width: barPitch * 2 + 0.10, height: 0.48, cornerRadius: 0.06, color: C.pink, strokeWidth: 2.5 });
    r.moveTo([x0, baseY + 0.24, 0]);
    return r;
  };
  const fjA = fjBox(0), fjB = fjBox(1);

  await until(S(4));
  await play(
    new M.Create(fjA, { runTime: 0.6 }), new M.Create(fjB, { runTime: 0.6 }),
    ...fbox(['squared distance:', 'sum of (score1 − score2)²', ['across all 12 attributes', C.muted]], C.cyan),
    ...say('SQUARE DIFFERENCES, THEN ADD', C.cyan)
  );

  // S(5): smaller squared distance = more similar
  await until(S(5));
  await play(
    new M.Indicate(cards[0], { color: C.green, runTime: 0.9 }),
    new M.Indicate(cards[1], { color: C.green, runTime: 0.9 }),
    ...say('SMALLER DISTANCE = MORE SIMILAR', C.green)
  );

  // S(6): squared distance A to B = 8
  hlA = makeCardHighlight(0, C.green);
  hlOther = makeCardHighlight(1, C.green);
  await until(S(6));
  await play(
    new M.Create(hlA, { runTime: 0.5 }), new M.Create(hlOther, { runTime: 0.5 }),
    ...fbox(['A to B:', ['(1−3)² + (3−1)² = 8', C.green], ['other 10 scores match', C.muted]], C.green),
    ...say('SQUARED DISTANCE (A, B) = 8', C.green)
  );

  // S(7): squared distance A to C = 96
  const hlC = makeCardHighlight(2, C.amber);
  const hlA2 = makeCardHighlight(0, C.amber);
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(hlA, hlOther, fjA, fjB), { runTime: 0.35 }),
    new M.Create(hlA2, { runTime: 0.5 }), new M.Create(hlC, { runTime: 0.5 }),
    ...fbox(['A to B:    8', ['A to C:   96  (6 × 4²)', C.amber]], C.amber),
    ...say('SQUARED DISTANCE (A, C) = 96', C.amber)
  );

  // S(8): squared distance A to D = 104
  const hlD = makeCardHighlight(3, C.pink);
  const hlA3 = makeCardHighlight(0, C.pink);
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(hlA2, hlC), { runTime: 0.35 }),
    new M.Create(hlA3, { runTime: 0.5 }), new M.Create(hlD, { runTime: 0.5 }),
    ...fbox(['A to B:    8', 'A to C:   96', ['A to D:  104  (8 + 96)', C.pink]], C.pink),
    ...say('SQUARED DISTANCE (A, D) = 104', C.pink)
  );

  // S(9): tea B is the closest neighbor of tea A
  const hlAWin = makeCardHighlight(0, C.green);
  const hlBWin = makeCardHighlight(1, C.green);
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(hlA3, hlD), { runTime: 0.35 }),
    new M.Create(hlAWin, { runTime: 0.45 }), new M.Create(hlBWin, { runTime: 0.45 }),
    ...fbox([['A to B:    8  ← closest', C.green], ['A to C:   96', C.muted], ['A to D:  104', C.muted]], C.green),
    ...say('CLOSEST NEIGHBOR OF A = B', C.green)
  );

  // =========================================================================
  // 10–22: GRAPH, NEIGHBORHOODS, PULL & PUSH, UMAP IDEA
  // =========================================================================
  const initPts = TRAJ[0].pts; // A(-1,-1), B(-1,1), C(1,-1), D(1,1)
  const dotColors = [C.cyan, C.cyan, C.amber, C.amber];
  const halos = initPts.map((p, i) => mkDot(toScr(p[0], p[1]), 0.30, dotColors[i], 0.20));
  const dots = initPts.map((p, i) => mkDot(toScr(p[0], p[1]), 0.14, dotColors[i], 1));
  const labs = initPts.map((p, i) => {
    const t = T(TEAS[i].id, 22, C.ink, true, true);
    t.moveTo(labPos(p[0], p[1], i));
    return t;
  });

  // Glowing edges: outer glow + inner core (kept ungrouped for clean Transforms)
  const pA0 = toScr(initPts[0][0], initPts[0][1]), pB0 = toScr(initPts[1][0], initPts[1][1]);
  const pC0 = toScr(initPts[2][0], initPts[2][1]), pD0 = toScr(initPts[3][0], initPts[3][1]);
  const eAB_glow = mkLine(pA0, pB0, C.cyan, 11, 0.24);
  const eAB_core = mkLine(pA0, pB0, C.cyan, 3.8, 0.95);
  const eCD_glow = mkLine(pC0, pD0, C.amber, 11, 0.24);
  const eCD_core = mkLine(pC0, pD0, C.amber, 3.8, 0.95);

  // S(10): draw glowing line connecting A to B
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(...cards, legendBar, hlAWin, hlBWin), { runTime: 0.5 }),
    ...fbox([['A — B  (dist² = 8)', C.cyan]], C.cyan),
    ...say('CONNECT A TO B', C.cyan)
  );
  await play(
    new M.Create(eAB_glow, { runTime: 0.7 }), new M.Create(eAB_core, { runTime: 0.7 }),
    ...halos.map(h => new M.FadeIn(h, { runTime: 0.5 })),
    ...dots.map(d => new M.FadeIn(d, { runTime: 0.5 })),
    ...labs.map(l => new M.FadeIn(l, { runTime: 0.5 }))
  );

  // S(11): repeat search for each remaining tea
  const scan1 = new M.DashedLine({ start: pC0, end: pA0, color: C.muted });
  const scan2 = new M.DashedLine({ start: pC0, end: pD0, color: C.amber });
  const scan3 = new M.DashedLine({ start: pD0, end: pB0, color: C.muted });
  await until(S(11));
  await play(
    new M.Create(scan1, { runTime: 0.6 }), new M.Create(scan2, { runTime: 0.6 }), new M.Create(scan3, { runTime: 0.6 }),
    ...fbox(['B → closest is A (8)', 'C → closest is D (8)', 'D → closest is C (8)'], C.amber),
    ...say('SEARCH EACH REMAINING TEA', C.amber)
  );

  // S(12): B chooses A, C and D choose each other
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(scan1, scan2, scan3), { runTime: 0.4 }),
    new M.Create(eCD_glow, { runTime: 0.75 }), new M.Create(eCD_core, { runTime: 0.75 }),
    new M.Flash(dots[1], { color: C.cyan, runTime: 0.6 }),
    new M.Flash(dots[2], { color: C.amber, runTime: 0.6 }),
    new M.Flash(dots[3], { color: C.amber, runTime: 0.6 }),
    ...say('B ↔ A   AND   C ↔ D', C.cyan)
  );

  // S(13): four dots with two glowing lines
  await until(S(13));
  await play(
    ...fbox(['dots:  4  (A, B, C, D)', ['lines: 2  (A—B, C—D)', C.cyan]], C.cyan),
    ...say('4 DOTS, 2 GLOWING LINES', C.cyan)
  );

  // S(14): called a graph
  const graphBox = new M.RoundedRectangle({ width: MS * 3.05, height: MS * 3.05, cornerRadius: 0.22, color: C.violet, strokeWidth: 2.5 });
  graphBox.moveTo([MC[0], MC[1], 0]);
  const graphTag = pill('GRAPH', C.violet, 16);
  graphTag.moveTo([MC[0], MC[1] + MS * 1.52 + 0.02, 0]);
  await until(S(14));
  await play(
    new M.Create(graphBox, { runTime: 0.7 }), new M.FadeIn(graphTag, { runTime: 0.6 }),
    ...say('DOTS + LINES = A GRAPH', C.violet)
  );

  // S(15): each dot = tea, each line = close relationship
  await until(S(15));
  await play(
    new M.LaggedStart(dots.map(d => new M.Indicate(d, { color: C.ink })), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox([['dot  = one tea', C.ink], ['line = close neighbor', C.cyan]], C.cyan),
    ...say('DOT = TEA · LINE = CLOSE NEIGHBOR', C.cyan)
  );

  // S(16): two small neighborhoods
  const nb1 = new M.RoundedRectangle({ width: 1.18, height: MS * 2.95, cornerRadius: 0.55, color: C.cyan, strokeWidth: 2 });
  nb1.setFill(C.cyan, 0.07); nb1.moveTo([toScr(-1, 0)[0], MC[1], 0]);
  const nb2 = new M.RoundedRectangle({ width: 1.18, height: MS * 2.95, cornerRadius: 0.55, color: C.amber, strokeWidth: 2 });
  nb2.setFill(C.amber, 0.07); nb2.moveTo([toScr(1, 0)[0], MC[1], 0]);
  const nb1T = T('group 1', 15, C.cyan); nb1T.moveTo([toScr(-1, 0)[0], MC[1] - MS * 1.66, 0]);
  const nb2T = T('group 2', 15, C.amber); nb2T.moveTo([toScr(1, 0)[0], MC[1] - MS * 1.66, 0]);
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(graphBox, graphTag), { runTime: 0.4 }),
    new M.FadeIn(nb1, { runTime: 0.6 }), new M.FadeIn(nb2, { runTime: 0.6 }),
    new M.FadeIn(nb1T, { runTime: 0.6 }), new M.FadeIn(nb2T, { runTime: 0.6 }),
    ...fbox(['neighborhoods:', ['{A, B}  nearby pair', C.cyan], ['{C, D}  nearby pair', C.amber]], C.green),
    ...say('TWO SMALL NEIGHBORHOODS', C.green)
  );

  // S(17): connected dots pull toward each other
  const pullArrows = [
    makeArrow([pA0[0], pA0[1] + 0.25, 0], [pA0[0], pA0[1] + 0.95, 0], C.cyan, 3.5, 0.16),
    makeArrow([pB0[0], pB0[1] - 0.25, 0], [pB0[0], pB0[1] - 0.95, 0], C.cyan, 3.5, 0.16),
    makeArrow([pC0[0], pC0[1] + 0.25, 0], [pC0[0], pC0[1] + 0.95, 0], C.cyan, 3.5, 0.16),
    makeArrow([pD0[0], pD0[1] - 0.25, 0], [pD0[0], pD0[1] - 0.95, 0], C.cyan, 3.5, 0.16),
  ];
  await until(S(17));
  await play(
    new M.LaggedStart(pullArrows.map(a => new M.FadeIn(a)), { lagRatio: 0.1, runTime: 0.9 }),
    ...fbox([['connected: pull together', C.cyan], ['like stretchy bands', C.muted]], C.cyan),
    ...say('CONNECTED DOTS PULL TOGETHER', C.cyan)
  );

  // S(18): unconnected dots push away
  const pushArrows = [
    makeArrow([pB0[0] - 0.24, pB0[1], 0], [pB0[0] - 0.85, pB0[1], 0], C.pink, 3.5, 0.16),
    makeArrow([pA0[0] - 0.24, pA0[1], 0], [pA0[0] - 0.85, pA0[1], 0], C.pink, 3.5, 0.16),
    makeArrow([pD0[0] + 0.24, pD0[1], 0], [pD0[0] + 0.85, pD0[1], 0], C.pink, 3.5, 0.16),
    makeArrow([pC0[0] + 0.24, pC0[1], 0], [pC0[0] + 0.85, pC0[1], 0], C.pink, 3.5, 0.16),
  ];
  await until(S(18));
  await play(
    new M.LaggedStart(pushArrows.map(a => new M.FadeIn(a)), { lagRatio: 0.08, runTime: 0.8 }),
    ...fbox([['connected:     pull together', C.cyan], ['not connected: push apart', C.pink]], C.pink),
    ...say('UNCONNECTED DOTS PUSH APART', C.pink)
  );

  // S(19): arrange dots on a flat 2D map
  const mapXMin = -2.15, mapXMax = 2.15, mapYMin = -1.35, mapYMax = 1.35;
  const axX = mkLine(toScr(mapXMin, 0), toScr(mapXMax, 0), C.muted, 2, 0.65);
  const axY = mkLine(toScr(0, mapYMin), toScr(0, mapYMax), C.muted, 2, 0.65);
  const mapTicks = [];
  for (const v of [-2, -1, 1, 2]) {
    const p = toScr(v, 0);
    mapTicks.push(mkLine([p[0], p[1] - 0.07, 0], [p[0], p[1] + 0.07, 0], C.muted, 2, 0.7));
    const t = T(String(v), 15, C.muted, true); t.moveTo([p[0], p[1] - 0.24, 0]); mapTicks.push(t);
  }
  for (const v of [-1, 1]) {
    const p = toScr(0, v);
    mapTicks.push(mkLine([p[0] - 0.07, p[1], 0], [p[0] + 0.07, p[1], 0], C.muted, 2, 0.7));
    const t = T(String(v), 15, C.muted, true); t.moveTo([p[0] - 0.25, p[1], 0]); mapTicks.push(t);
  }
  const mapAxes = new M.VGroup(axX, axY, ...mapTicks);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(nb1, nb2, nb1T, nb2T, ...pullArrows, ...pushArrows), { runTime: 0.45 }),
    new M.FadeIn(mapAxes, { runTime: 0.75 }),
    ...say('ARRANGE ON A FLAT 2D MAP', C.amber)
  );

  // S(20): UMAP
  await until(S(20));
  await play(
    ...fbox([['UMAP', C.amber], '1. connect close neighbors', '2. pull connected, push others'], C.amber),
    ...say('THIS METHOD IS CALLED UMAP', C.amber)
  );

  // S(21): 1 closest neighbor each
  await until(S(21));
  await play(
    new M.Indicate(eAB_core, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(eCD_core, { color: C.amber, runTime: 0.8 }),
    ...fbox(['our teaching graph:', ['1 closest neighbor each', C.cyan], 'strength = 1 or 0'], C.cyan),
    ...say('OUR EXAMPLE: 1 NEIGHBOR EACH', C.cyan)
  );

  // S(22): in practice, several neighbors with different strengths
  const weak1 = new M.DashedLine({ start: pA0, end: pC0, color: C.violet });
  const weak2 = new M.DashedLine({ start: pB0, end: pD0, color: C.violet });
  const weak3 = new M.DashedLine({ start: pA0, end: pD0, color: C.muted });
  await until(S(22));
  await play(
    new M.Create(weak1, { runTime: 0.6 }), new M.Create(weak2, { runTime: 0.6 }), new M.Create(weak3, { runTime: 0.6 }),
    ...fbox(['in practice:', ['several neighbors per dot', C.violet], ['different strengths (0 to 1)', C.muted]], C.violet),
    ...say('IN PRACTICE: SEVERAL WEIGHTED NEIGHBORS', C.violet)
  );

  // =========================================================================
  // 23–27: STARTING SQUARE & STARTING LOSS
  // =========================================================================
  const sqRect = new M.Rectangle({ width: MS * 2, height: MS * 2, color: C.muted, strokeWidth: 1.5 });
  sqRect.moveTo([MC[0], MC[1], 0]);
  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(weak1, weak2, weak3), { runTime: 0.4 }),
    new M.Create(sqRect, { runTime: 0.7 }),
    ...fbox(['starting square:', 'A (−1, −1)   B (−1,  1)', 'C ( 1, −1)   D ( 1,  1)'], C.cyan),
    ...say('START: FOUR DOTS IN A SQUARE', C.cyan)
  );

  // S(24): each dot starts 1 step from center in both directions
  const origDot = mkDot(toScr(0, 0), 0.08, C.ink, 0.9);
  await until(S(24));
  await play(
    new M.FadeIn(origDot, { runTime: 0.5 }),
    new M.LaggedStart(dots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.1, runTime: 0.9 }),
    ...say('1 STEP FROM CENTER IN X AND Y', C.muted)
  );

  // S(25): tea D starts at (1, 1)
  const dProjX = new M.DashedLine({ start: pD0, end: toScr(1, 0), color: C.amber });
  const dProjY = new M.DashedLine({ start: pD0, end: toScr(0, 1), color: C.amber });
  const dRing = new M.Circle({ radius: 0.25, color: C.amber, strokeWidth: 3 });
  dRing.moveTo(pD0);
  await until(S(25));
  await play(
    new M.Create(dProjX, { runTime: 0.5 }), new M.Create(dProjY, { runTime: 0.5 }),
    new M.Create(dRing, { runTime: 0.5 }), new M.Flash(dots[3], { color: C.amber, runTime: 0.6 }),
    ...fbox([['tea D start: (1.000, 1.000)', C.amber], ['1 right, 1 up', C.muted]], C.amber),
    ...say('TEA D STARTS AT (1, 1)', C.amber)
  );

  // S(26): loss plot axes appear
  const LX0 = P ? -2.75 : 2.65, LY0 = P ? -5.25 : -2.48;
  const LW = P ? 5.50 : 3.55, LH = P ? 1.50 : 1.55;
  const lPt = (step, loss) => [LX0 + (step / 10) * LW, LY0 + (Math.min(4.2, loss) / 4.2) * LH, 0];

  const lossAxX = mkLine([LX0, LY0, 0], [LX0 + LW, LY0, 0], C.muted, 2, 0.8);
  const lossAxY = mkLine([LX0, LY0, 0], [LX0, LY0 + LH, 0], C.muted, 2, 0.8);
  const lossTitle = T('loss', P ? 16 : 16, C.pink, true, true);
  lossTitle.moveTo([LX0 + 0.35, LY0 + LH + 0.20, 0]);
  const lossStepLab = T('step', P ? 15 : 15, C.muted, true);
  lossStepLab.moveTo([LX0 + LW + 0.45, LY0, 0]);
  const lossTicks = [];
  for (const sTick of [0, 5, 10]) {
    const p = lPt(sTick, 0);
    lossTicks.push(mkLine([p[0], p[1] - 0.06, 0], [p[0], p[1] + 0.06, 0], C.muted, 1.8, 0.8));
    const t = T(String(sTick), P ? 15 : 13, C.muted, true); t.moveTo([p[0], p[1] - 0.24, 0]); lossTicks.push(t);
  }
  for (const yTick of [0, 2, 4]) {
    const p = lPt(0, yTick);
    lossTicks.push(mkLine([p[0] - 0.06, p[1], 0], [p[0] + 0.06, p[1], 0], C.muted, 1.8, 0.8));
    const t = T(String(yTick), P ? 15 : 13, C.muted, true); t.moveTo([p[0] - 0.24, p[1], 0]); lossTicks.push(t);
  }
  const lossPanel = new M.VGroup(lossAxX, lossAxY, lossTitle, lossStepLab, ...lossTicks);

  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(dProjX, dProjY, sqRect, origDot), { runTime: 0.4 }),
    new M.FadeIn(lossPanel, { runTime: 0.7 }),
    ...fbox(['loss measures mismatch', ['lower loss = better map', C.green]], C.pink),
    ...say('LOSS = HOW POORLY MAP MATCHES', C.pink)
  );

  // S(27): starting loss 3.901
  const lossDots = [mkDot(lPt(0, TRAJ[0].loss), 0.08, C.pink, 1)];
  const lossSegs = [];
  await until(S(27));
  await play(
    new M.FadeIn(lossDots[0], { runTime: 0.5 }),
    new M.Flash(lossDots[0], { color: C.pink, runTime: 0.6 }),
    ...fbox(['step 0 (start)', 'D = (1.000, 1.000)', ['loss = 3.901', C.pink]], C.pink),
    ...say('STARTING LOSS = 3.901', C.pink)
  );

  // =========================================================================
  // 28–32: HOW EACH STEP WORKS, FOLLOWING TEA D
  // =========================================================================
  const allForces = [
    makeArrow([pA0[0], pA0[1] + 0.20, 0], [pA0[0], pA0[1] + 0.70, 0], C.cyan, 2.8, 0.13),
    makeArrow([pB0[0], pB0[1] - 0.20, 0], [pB0[0], pB0[1] - 0.70, 0], C.cyan, 2.8, 0.13),
    makeArrow([pC0[0], pC0[1] + 0.20, 0], [pC0[0], pC0[1] + 0.70, 0], C.cyan, 2.8, 0.13),
    makeArrow([pD0[0], pD0[1] - 0.20, 0], [pD0[0], pD0[1] - 0.70, 0], C.cyan, 2.8, 0.13),
    makeArrow([pA0[0] - 0.18, pA0[1], 0], [pA0[0] - 0.62, pA0[1], 0], C.pink, 2.8, 0.13),
    makeArrow([pB0[0] - 0.18, pB0[1], 0], [pB0[0] - 0.62, pB0[1], 0], C.pink, 2.8, 0.13),
    makeArrow([pC0[0] + 0.18, pC0[1], 0], [pC0[0] + 0.62, pC0[1], 0], C.pink, 2.8, 0.13),
    makeArrow([pD0[0] + 0.18, pD0[1], 0], [pD0[0] + 0.62, pD0[1], 0], C.pink, 2.8, 0.13),
  ];
  await until(S(28));
  await play(
    new M.LaggedStart(allForces.map(a => new M.FadeIn(a)), { lagRatio: 0.06, runTime: 0.9 }),
    ...say('BALANCE PULL AND PUSH EACH STEP', C.cyan)
  );

  // S(29): each dot moves a small amount to reduce loss
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(...allForces), { runTime: 0.5 }),
    ...say('SMALL STEP → LOWER LOSS', C.green)
  );

  // S(30): follow tea D
  await until(S(30));
  await play(
    new M.Indicate(dRing, { color: C.amber, runTime: 0.9 }),
    new M.Flash(dots[3], { color: C.amber, runTime: 0.6 }),
    ...say('FOLLOW TEA D AS ALL FOUR MOVE', C.amber)
  );

  // S(31): C pulls D downward
  const dPullC = makeArrow([pD0[0], pD0[1] - 0.22, 0], [pD0[0], pD0[1] - 1.05, 0], C.cyan, 4, 0.18);
  await until(S(31));
  await play(
    new M.FadeIn(dPullC, { runTime: 0.6 }),
    new M.Indicate(eCD_core, { color: C.cyan, runTime: 0.7 }),
    ...fbox(['forces on tea D:', ['C pulls D downward', C.cyan]], C.cyan),
    ...say('C PULLS D DOWNWARD', C.cyan)
  );

  // S(32): A and B push D away
  const dPushB = makeArrow([pD0[0] + 0.20, pD0[1], 0], [pD0[0] + 0.95, pD0[1], 0], C.pink, 3.8, 0.16);
  const dPushA = makeArrow([pD0[0] + 0.16, pD0[1] + 0.16, 0], [pD0[0] + 0.62, pD0[1] + 0.62, 0], C.pink, 3.2, 0.14);
  await until(S(32));
  await play(
    new M.FadeIn(dPushB, { runTime: 0.6 }), new M.FadeIn(dPushA, { runTime: 0.6 }),
    ...fbox(['forces on tea D:', ['C pulls D downward', C.cyan], ['A and B push D away', C.pink]], C.pink),
    ...say('A AND B PUSH D AWAY', C.pink)
  );

  // Helper to animate all 4 dots + edges + labels + D ring to trajectory step k
  function moveToStepAnims(k, runTime = 0.75, minSep = false) {
    const pts = TRAJ[k].pts;
    const scr = pts.map(p => toScr(p[0], p[1], minSep));
    const anims = [];
    for (let i = 0; i < 4; i++) {
      anims.push(new M.Transform(halos[i], mkDot(scr[i], 0.30, dotColors[i], 0.20), { runTime }));
      anims.push(new M.Transform(dots[i], mkDot(scr[i], 0.14, dotColors[i], 1), { runTime }));
      const nl = T(TEAS[i].id, 22, C.ink, true, true);
      nl.moveTo(labPos(pts[i][0], pts[i][1], i, minSep));
      anims.push(new M.FadeOut(labs[i], { runTime: runTime * 0.85 }));
      anims.push(new M.FadeIn(nl, { runTime: runTime * 0.85 }));
      labs[i] = nl;
    }
    anims.push(new M.Transform(eAB_glow, mkLine(scr[0], scr[1], C.cyan, 11, 0.24), { runTime }));
    anims.push(new M.Transform(eAB_core, mkLine(scr[0], scr[1], C.cyan, 3.8, 0.95), { runTime }));
    anims.push(new M.Transform(eCD_glow, mkLine(scr[2], scr[3], C.amber, 11, 0.24), { runTime }));
    anims.push(new M.Transform(eCD_core, mkLine(scr[2], scr[3], C.amber, 3.8, 0.95), { runTime }));
    const nr = new M.Circle({ radius: 0.25, color: C.amber, strokeWidth: 3 });
    nr.moveTo(scr[3]);
    anims.push(new M.Transform(dRing, nr, { runTime }));
    return anims;
  }

  function addLossPointAnims(k, runTime = 0.55) {
    const prev = lPt(k - 1, TRAJ[k - 1].loss), cur = lPt(k, TRAJ[k].loss);
    const seg = mkLine(prev, cur, C.green, 3.2, 1);
    const dot = mkDot(cur, 0.065, C.green, 1);
    lossSegs.push(seg); lossDots.push(dot);
    return [new M.Create(seg, { runTime }), new M.FadeIn(dot, { runTime })];
  }

  // =========================================================================
  // 33–36: ITERATION 1 (SLOW, EXACT NUMBERS)
  // =========================================================================
  const pD0Scr = toScr(TRAJ[0].pts[3][0], TRAJ[0].pts[3][1]);
  const s1Right = makeArrow([pD0Scr[0] + 0.18, pD0Scr[1], 0], [pD0Scr[0] + 0.65, pD0Scr[1], 0], C.amber, 3.5, 0.14);
  const s1Down = makeArrow([pD0Scr[0], pD0Scr[1] - 0.18, 0], [pD0Scr[0], pD0Scr[1] - 0.88, 0], C.cyan, 3.5, 0.15);

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(dPullC, dPushB, dPushA), { runTime: 0.35 }),
    new M.FadeIn(s1Right, { runTime: 0.6 }),
    ...fbox(['step 1: tea D moves', ['right: +0.064', C.amber]], C.amber),
    ...say('STEP 1: +0.064 RIGHT', C.amber)
  );

  await until(S(34));
  await play(
    new M.FadeIn(s1Down, { runTime: 0.6 }),
    ...fbox(['step 1: tea D moves', ['right: +0.064', C.amber], ['down:  −0.186', C.cyan]], C.cyan),
    ...say('STEP 1: −0.186 DOWN', C.cyan)
  );

  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(s1Right, s1Down), { runTime: 0.35 }),
    ...moveToStepAnims(1, 0.95),
    ...fbox(['step 1', ['D = (1.064, 0.814)', C.amber], 'change (+0.064, −0.186)'], C.amber),
    ...say('D → (1.064, 0.814)', C.amber)
  );

  await until(S(36));
  await play(
    ...addLossPointAnims(1, 0.6),
    ...fbox(['step 1', 'D = (1.064, 0.814)', ['loss = 3.249', C.green]], C.green),
    ...say('LOSS FALLS TO 3.249', C.green)
  );

  // =========================================================================
  // 37–39: ITERATION 2 (SLOW, EXACT NUMBERS)
  // =========================================================================
  const pD1Scr = toScr(TRAJ[1].pts[3][0], TRAJ[1].pts[3][1]);
  const s2Right = makeArrow([pD1Scr[0] + 0.18, pD1Scr[1], 0], [pD1Scr[0] + 0.62, pD1Scr[1], 0], C.amber, 3.5, 0.14);
  const s2Down = makeArrow([pD1Scr[0], pD1Scr[1] - 0.18, 0], [pD1Scr[0], pD1Scr[1] - 0.92, 0], C.cyan, 3.5, 0.15);

  await until(S(37));
  await play(
    new M.FadeIn(s2Right, { runTime: 0.55 }), new M.FadeIn(s2Down, { runTime: 0.55 }),
    ...fbox(['step 2: tea D moves', ['right: +0.061', C.amber], ['down:  −0.209', C.cyan]], C.amber),
    ...say('STEP 2: (+0.061, −0.209)', C.amber)
  );

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(s2Right, s2Down), { runTime: 0.35 }),
    ...moveToStepAnims(2, 0.95),
    ...fbox(['step 2', ['D = (1.125, 0.605)', C.amber], 'change (+0.061, −0.209)'], C.amber),
    ...say('D → (1.125, 0.605)', C.amber)
  );

  await until(S(39));
  await play(
    ...addLossPointAnims(2, 0.6),
    ...fbox(['step 2', 'D = (1.125, 0.605)', ['loss = 2.449', C.green]], C.green),
    ...say('LOSS FALLS TO 2.449', C.green)
  );

  // =========================================================================
  // 40–42: ITERATION 3 (SLOW, EXACT NUMBERS)
  // =========================================================================
  const pD2Scr = toScr(TRAJ[2].pts[3][0], TRAJ[2].pts[3][1]);
  const s3Right = makeArrow([pD2Scr[0] + 0.18, pD2Scr[1], 0], [pD2Scr[0] + 0.60, pD2Scr[1], 0], C.amber, 3.5, 0.14);
  const s3Down = makeArrow([pD2Scr[0], pD2Scr[1] - 0.18, 0], [pD2Scr[0], pD2Scr[1] - 0.95, 0], C.cyan, 3.5, 0.15);

  await until(S(40));
  await play(
    new M.FadeIn(s3Right, { runTime: 0.55 }), new M.FadeIn(s3Down, { runTime: 0.55 }),
    ...fbox(['step 3: tea D moves', ['right: +0.060', C.amber], ['down:  −0.233', C.cyan]], C.amber),
    ...say('STEP 3: (+0.060, −0.233)', C.amber)
  );

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(s3Right, s3Down), { runTime: 0.35 }),
    ...moveToStepAnims(3, 0.95),
    ...fbox(['step 3', ['D = (1.184, 0.372)', C.amber], 'change (+0.060, −0.233)'], C.amber),
    ...say('D → (1.184, 0.372)', C.amber)
  );

  await until(S(42));
  await play(
    ...addLossPointAnims(3, 0.6),
    ...fbox(['step 3', 'D = (1.184, 0.372)', ['loss = 1.508', C.green]], C.green),
    ...say('LOSS FALLS TO 1.508', C.green)
  );

  // =========================================================================
  // 43–45: FAST STEPS 4 → 10, LOSS DESCENDS, TWO CLEAR NEIGHBORHOODS
  // =========================================================================
  await until(S(43));
  for (let k = 4; k <= 9; k++) {
    const extra = k === 4 ? say('STEPS 4 → 10: LOSS DESCENDS', C.green) : [];
    const dPos = TRAJ[k].pts[3];
    const boxUpdate = (k === 4 || k === 6 || k === 9)
      ? fbox([`step ${k}`, `D = (${dPos[0].toFixed(3)}, ${Math.max(0, dPos[1]).toFixed(3)})`, [`loss = ${TRAJ[k].loss.toFixed(3)}`, C.green]], C.green)
      : [];
    await play(...moveToStepAnims(k, 0.42, true), ...addLossPointAnims(k, 0.42), ...extra, ...boxUpdate);
  }

  // S(44): after 10 steps, D ≈ (1.507, 0.000), loss ≈ 0.418
  await until(S(44));
  await play(
    ...moveToStepAnims(10, 0.7, true),
    ...addLossPointAnims(10, 0.7),
    new M.Flash(lossDots[lossDots.length - 1], { color: C.green, runTime: 0.6 }),
    ...fbox(['after 10 steps', ['D ≈ (1.507, 0.000)', C.amber], ['loss ≈ 0.418', C.green]], C.green),
    ...say('STEP 10: LOSS = 0.418', C.green)
  );

  // S(45): two neighborhoods clearly visible
  const x10 = TRAJ[10].pts[3][0];
  const grpL = new M.Circle({ radius: 0.62, color: C.cyan, strokeWidth: 2.5 });
  grpL.setFill(C.cyan, 0.08); grpL.moveTo(toScr(-x10, 0));
  const grpR = new M.Circle({ radius: 0.62, color: C.amber, strokeWidth: 2.5 });
  grpR.setFill(C.amber, 0.08); grpR.moveTo(toScr(x10, 0));
  await until(S(45));
  await play(
    new M.FadeOut(dRing, { runTime: 0.35 }),
    new M.FadeIn(grpL, { runTime: 0.6 }), new M.FadeIn(grpR, { runTime: 0.6 }),
    ...say('TWO CLEAR NEIGHBORHOODS', C.green)
  );

  // =========================================================================
  // 46–49: MAP SIMILARITY FORMULA (MATH COMES LAST)
  // =========================================================================
  const pC10 = toScr(x10, -0.13), pD10 = toScr(x10, 0.13), pA10 = toScr(-x10, -0.13);
  const nearBr = makeDoubleArrow([pC10[0] + 0.34, pC10[1], 0], [pD10[0] + 0.34, pD10[1], 0], C.green, 2.8, 0.10);
  const farBr = makeDoubleArrow([pA10[0] + 0.22, pA10[1] - 0.55, 0], [pC10[0] - 0.22, pC10[1] - 0.55, 0], C.pink, 2.8, 0.14);
  const farLab = T('far apart', 15, C.pink); farLab.moveTo([MC[0], pA10[1] - 0.80, 0]);
  const nearLab = T('close', 15, C.green); nearLab.moveTo(P ? [pC10[0] + 0.1, pC10[1] - 0.85, 0] : [pC10[0] + 1.3, MC[1], 0]);

  await until(S(46));
  await play(
    new M.FadeIn(nearBr, { runTime: 0.6 }), new M.FadeIn(nearLab, { runTime: 0.6 }),
    new M.FadeIn(farBr, { runTime: 0.6 }), new M.FadeIn(farLab, { runTime: 0.6 }),
    ...say('MEASURE PAIR DISTANCES ON MAP', C.cyan)
  );

  // S(47): map similarity = 1 / (1 + squared distance)
  await until(S(47));
  await play(
    ...fbox([['map similarity =', C.ink], ['  1 ÷ (1 + distance²)', C.cyan]], C.cyan),
    ...say('SIMILARITY = 1 ÷ (1 + d²)', C.cyan)
  );

  // S(48): nearby = high similarity, distant = low similarity
  await until(S(48));
  await play(
    new M.Indicate(grpR, { color: C.green, runTime: 0.8 }),
    new M.Indicate(farBr, { color: C.pink, runTime: 0.8 }),
    ...fbox([['nearby (C,D):  1 ÷ (1+0) ≈ 1.00', C.green], ['distant (A,D): 1 ÷ (1+9) ≈ 0.10', C.pink]], C.amber),
    ...say('NEARBY = HIGH · DISTANT = LOW', C.amber)
  );

  // S(49): match map similarities to graph connections
  await until(S(49));
  await play(
    new M.Indicate(eAB_core, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(eCD_core, { color: C.amber, runTime: 0.8 }),
    ...fbox(['match map to original graph:', ['connected:     sim → 1', C.cyan], ['not connected: sim → 0', C.pink]], C.cyan),
    ...say('MATCH MAP SIMILARITIES TO GRAPH', C.cyan)
  );

  // =========================================================================
  // 50–54: WHAT IT IS FOR, THE GAP TRAP, RECAP
  // =========================================================================
  await until(S(50));
  await play(
    new M.FadeOut(new M.VGroup(nearBr, nearLab, farBr, farLab), { runTime: 0.45 }),
    new M.Indicate(grpL, { color: C.green, runTime: 0.8 }),
    new M.Indicate(grpR, { color: C.green, runTime: 0.8 }),
    ...fbox([['WHEN TO USE UMAP', C.green], 'explore neighborhoods in', 'many-attribute data'], C.green),
    ...say('USE UMAP TO EXPLORE NEIGHBORHOODS', C.green)
  );

  // S(51): no connection between the two neighborhoods
  const noConnLine = new M.DashedLine({ start: [toScr(-x10, 0)[0] + 0.66, MC[1], 0], end: [toScr(x10, 0)[0] - 0.66, MC[1], 0], color: C.pink });
  const noConnTag = pill('NO CONNECTION', C.pink, 14);
  noConnTag.moveTo([MC[0], MC[1] + 0.42, 0]);
  await until(S(51));
  await play(
    new M.Create(noConnLine, { runTime: 0.65 }), new M.FadeIn(noConnTag, { runTime: 0.6 }),
    ...say('NO CONNECTION BETWEEN GROUPS', C.pink)
  );

  // S(52): gap can continue growing even after each neighborhood has settled
  const xFar = 1.92;
  const scrFar = [toScr(-xFar, -0.13), toScr(-xFar, 0.13), toScr(xFar, -0.13), toScr(xFar, 0.13)];
  const driftAnims = [];
  for (let i = 0; i < 4; i++) {
    driftAnims.push(new M.Transform(halos[i], mkDot(scrFar[i], 0.30, dotColors[i], 0.20), { runTime: 1.4 }));
    driftAnims.push(new M.Transform(dots[i], mkDot(scrFar[i], 0.14, dotColors[i], 1), { runTime: 1.4 }));
    const nl = T(TEAS[i].id, 22, C.ink, true, true);
    const sx = i < 2 ? -xFar : xFar, sy = (i === 1 || i === 3) ? 0.13 : -0.13;
    nl.moveTo(labPos(sx, sy, i, true));
    driftAnims.push(new M.FadeOut(labs[i], { runTime: 1.0 }));
    driftAnims.push(new M.FadeIn(nl, { runTime: 1.0 }));
    labs[i] = nl;
  }
  driftAnims.push(new M.Transform(eAB_glow, mkLine(scrFar[0], scrFar[1], C.cyan, 11, 0.24), { runTime: 1.4 }));
  driftAnims.push(new M.Transform(eAB_core, mkLine(scrFar[0], scrFar[1], C.cyan, 3.8, 0.95), { runTime: 1.4 }));
  driftAnims.push(new M.Transform(eCD_glow, mkLine(scrFar[2], scrFar[3], C.amber, 11, 0.24), { runTime: 1.4 }));
  driftAnims.push(new M.Transform(eCD_core, mkLine(scrFar[2], scrFar[3], C.amber, 3.8, 0.95), { runTime: 1.4 }));
  const grpL2 = new M.Circle({ radius: 0.62, color: C.cyan, strokeWidth: 2.5 });
  grpL2.setFill(C.cyan, 0.08); grpL2.moveTo(toScr(-xFar, 0));
  const grpR2 = new M.Circle({ radius: 0.62, color: C.amber, strokeWidth: 2.5 });
  grpR2.setFill(C.amber, 0.08); grpR2.moveTo(toScr(xFar, 0));
  driftAnims.push(new M.Transform(grpL, grpL2, { runTime: 1.4 }));
  driftAnims.push(new M.Transform(grpR, grpR2, { runTime: 1.4 }));
  const gapArrow = makeDoubleArrow([toScr(-xFar, 0)[0] + 0.68, MC[1], 0], [toScr(xFar, 0)[0] - 0.68, MC[1], 0], C.pink, 3.5, 0.16);

  await until(S(52));
  await play(
    new M.FadeOut(noConnLine, { runTime: 0.35 }),
    new M.FadeIn(gapArrow, { runTime: 1.2 }),
    ...driftAnims,
    ...say('UNCONNECTED GAP KEEPS GROWING', C.pink)
  );

  // S(53): large gap does not necessarily measure original difference
  const gapQ = pill('GAP SIZE ≠ SCORE DIFFERENCE', C.amber, 14);
  gapQ.moveTo([MC[0], MC[1] - 0.48, 0]);
  await until(S(53));
  await play(
    new M.FadeIn(gapQ, { runTime: 0.6 }),
    ...fbox([['WATCH OUT', C.pink], 'gap between groups ≠', 'true score difference'], C.pink),
    ...say('GAP SIZE ≠ TRUE DIFFERENCE', C.amber)
  );

  // S(54): final one-sentence recap
  await until(S(54));
  await play(
    new M.Indicate(grpL, { color: C.green, runTime: 0.9 }),
    new M.Indicate(grpR, { color: C.green, runTime: 0.9 }),
    ...fbox([['REMEMBER: UMAP', C.cyan], ['✓ keeps close neighborhoods', C.green], ['✗ space between groups misleads', C.pink]], C.cyan),
    ...say('NEIGHBORHOODS YES · GAP SIZE NO', C.amber)
  );
}

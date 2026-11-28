// 10.3.3 Odds ratios (live manim-web scene, script.v8.md).
// Beat i = sentence i (0-based, 43 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const TEAL = '#2dd4bf', RED = '#f87171';
  const CX = P ? 0 : -2.15;
  const PILL = P ? [0, 2.15, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.45, -0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Formula box: one box at a time; lines = ['text' | ['text', color]]; leading spaces indent.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.68, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.34, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow, { runTime: 0.5 })];
    boxNow = null;
    return a;
  }

  // Helpers: crisp chevron arrow, dot, and rounded card (all placed via moveTo).
  function arrow(a, b, col = C.muted, sw = 2.5, tip = 0.15) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const w1 = [b[0] - ux * tip + px * tip * 0.55, b[1] - uy * tip + py * tip * 0.55, 0];
    const w2 = [b[0] - ux * tip - px * tip * 0.55, b[1] - uy * tip - py * tip * 0.55, 0];
    return new M.VGroup(
      new M.Line({ start: a, end: b, color: col, strokeWidth: sw }),
      new M.Line({ start: w1, end: b, color: col, strokeWidth: sw }),
      new M.Line({ start: w2, end: b, color: col, strokeWidth: sw })
    );
  }

  function makeDot(pt, col, r) {
    const d = new M.Dot({ point: pt, radius: r, color: col });
    d.setFill(col, 0.95);
    return d;
  }

  function card(pos, w, h, col, lines, fillOp = 0.94) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    r.setFill(C.card, fillOp); r.moveTo(pos);
    const n = lines.length, step = h / (n + 0.7);
    const ts = lines.map(([s, sz, c, mono, bold], i) => {
      const t = T(s, sz, c, !!mono, !!bold);
      t.moveTo([pos[0], pos[1] + ((n - 1) / 2 - i) * step, 0]);
      return t;
    });
    return new M.VGroup(r, ...ts);
  }

  // ── BEAT 0: Opening question — 0, 1, 2 clinic reminders ───────────────────────
  const introY = P ? -1.3 : -0.35, introDx = P ? 2.25 : 2.55, introW = P ? 1.65 : 1.9, introH = P ? 1.85 : 1.75;
  const introCards = [0, 1, 2].map(k => card(
    [CX + (k - 1) * introDx, introY, 0], introW, introH, k === 0 ? C.muted : C.cyan,
    [[k === 1 ? '1 reminder' : `${k} reminders`, P ? 15 : 17, C.ink, false, true], ['come?', P ? 19 : 21, TEAL, true, true]]
  ));
  const introArrs = [0, 1].map(k => {
    const x1 = CX + (k - 1) * introDx + introW / 2 + 0.08;
    const x2 = CX + k * introDx - introW / 2 - 0.08;
    const plus = T('+1', 15, C.amber, true, true); plus.moveTo([(x1 + x2) / 2, introY + 0.30, 0]);
    return new M.VGroup(arrow([x1, introY, 0], [x2, introY, 0], C.amber, 2.5, 0.13), plus);
  });
  await until(S(0));
  await play(
    new M.LaggedStart([...introCards.map(c => new M.FadeIn(c)), ...introArrs.map(a => new M.FadeIn(a))], { lagRatio: 0.18, runTime: 1.7 }),
    ...say('HOW DO REMINDERS CHANGE ATTENDANCE?', C.amber)
  );

  // ── BEATS 1-10: 0 reminders — 100 patients (75 teal, 25 red), 4 piles of 25 ───
  const dotY0 = P ? -0.85 : -0.35;
  const sx0 = P ? 0.31 : 0.36, sy0 = 0.36, dr0 = P ? 0.085 : 0.105;
  const gridPos0 = (c, r) => [CX + (c - 9.5) * sx0, dotY0 + (2 - r) * sy0, 0];
  // Order dots column-major so indices 0..74 are the left 15x5 block (75 came) and 75..99 are the right 5x5 block (25 missed).
  const dots0 = [];
  for (let c = 0; c < 20; c++) {
    for (let r = 0; r < 5; r++) dots0.push(makeDot(gridPos0(c, r), C.muted, dr0));
  }
  const hdr0 = T('0 reminders · 100 patients', P ? 20 : 21, C.ink, false, true);
  hdr0.moveTo([CX, P ? 1.25 : 1.30, 0]);

  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...introCards, ...introArrs), { runTime: 0.5 }), ...say('0 REMINDERS: 100 PATIENTS'));
  await play(new M.FadeIn(hdr0, { runTime: 0.5 }), new M.LaggedStart(dots0.map(d => new M.FadeIn(d)), { lagRatio: 0.01, runTime: 1.2 }));

  await until(S(2));
  const lbl75 = T('75 came', P ? 20 : 21, TEAL, true, true);
  lbl75.moveTo([CX - 2.5 * sx0, dotY0 - 1.15, 0]);
  await play(
    new M.LaggedStart(dots0.slice(0, 75).map((d, i) => new M.Transform(d, makeDot(gridPos0(Math.floor(i / 5), i % 5), TEAL, dr0))), { lagRatio: 0.008, runTime: 1.3 }),
    new M.FadeIn(lbl75), ...say('75 CAME', TEAL)
  );

  await until(S(3));
  const lbl25 = T('25 missed', P ? 20 : 21, RED, true, true);
  lbl25.moveTo([CX + 7.5 * sx0, dotY0 - 1.15, 0]);
  await play(
    new M.LaggedStart(dots0.slice(75).map((d, i) => {
      const k = 75 + i;
      return new M.Transform(d, makeDot(gridPos0(Math.floor(k / 5), k % 5), RED, dr0));
    }), { lagRatio: 0.015, runTime: 1.1 }),
    new M.FadeIn(lbl25), ...say('25 MISSED', RED)
  );

  // Beat 4: Rearrange into 4 piles of 25 (three 5x5 teal piles + one 5x5 red pile)
  const pileXs = P ? [-2.55, -1.00, 0.55, 2.35] : [-5.10, -3.30, -1.50, 0.65];
  const px0 = P ? 0.27 : 0.31, py0 = 0.33;
  const pilePos = (idx) => {
    const p = Math.floor(idx / 25), inside = idx % 25, c = Math.floor(inside / 5), r = inside % 5;
    return [pileXs[p] + (c - 2) * px0, dotY0 + (2 - r) * py0, 0];
  };
  const pileW = 4 * px0 + 0.30, pileH = 4 * py0 + 0.34;
  const pileBoxes = pileXs.map((x, p) => {
    const col = p < 3 ? TEAL : RED;
    const b = new M.RoundedRectangle({ width: pileW, height: pileH, cornerRadius: 0.12, color: col, strokeWidth: 1.8 });
    b.setFill(col, 0.08); b.moveTo([x, dotY0, 0]);
    return b;
  });
  const pileNums = pileXs.map((x, p) => {
    const t = T('25', P ? 18 : 19, p < 3 ? TEAL : RED, true, true);
    t.moveTo([x, dotY0 - pileH / 2 - 0.28, 0]);
    return t;
  });

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(lbl75, lbl25), { runTime: 0.4 }),
    new M.LaggedStart(dots0.map((d, i) => new M.Transform(d, makeDot(pilePos(i), i < 75 ? TEAL : RED, dr0))), { lagRatio: 0.008, runTime: 2.1 }),
    ...say('PILES OF 25 DOTS', TEAL)
  );
  await play(...pileBoxes.map(b => new M.Create(b, { runTime: 0.7 })), ...pileNums.map(n => new M.FadeIn(n, { runTime: 0.7 })));

  // Beat 5: 3 teal piles for 1 red pile
  const lbl3p = T('3 teal piles', P ? 18 : 19, TEAL, false, true);
  lbl3p.moveTo([(pileXs[0] + pileXs[2]) / 2, dotY0 + pileH / 2 + 0.30, 0]);
  const lbl1p = T('1 red pile', P ? 18 : 19, RED, false, true);
  lbl1p.moveTo([pileXs[3], dotY0 + pileH / 2 + 0.30, 0]);
  await until(S(5));
  await play(new M.FadeIn(lbl3p), new M.FadeIn(lbl1p), ...say('3 TEAL PILES FOR 1 RED PILE', C.amber));

  // Beat 6: For every 1 who misses, 3 come
  const rY = P ? -2.85 : -2.18;
  const miniT = [0, 1, 2].map(k => makeDot([CX - 1.45 + k * 0.38, rY, 0], TEAL, 0.13));
  const miniTxtL = T('3 come', P ? 18 : 19, TEAL, true, true); miniTxtL.moveTo([CX - 1.07, rY - 0.38, 0]);
  const miniColon = T(':', 24, C.amber, true, true); miniColon.moveTo([CX + 0.05, rY, 0]);
  const miniR = makeDot([CX + 0.75, rY, 0], RED, 0.13);
  const miniTxtR = T('1 misses', P ? 18 : 19, RED, true, true); miniTxtR.moveTo([CX + 0.75, rY - 0.38, 0]);
  const ratioRow = new M.VGroup(...miniT, miniTxtL, miniColon, miniR, miniTxtR);
  await until(S(6));
  await play(new M.FadeIn(ratioRow), ...say('3 COME FOR EVERY 1 WHO MISSES', TEAL));

  // Beat 7: Odds of coming: 3 to 1, or just 3
  await until(S(7));
  await play(...fbox(['0 reminders', ['odds = 3 to 1 = 3', C.amber]], C.amber), ...say('ODDS OF COMING = 3', C.amber));

  // Beat 8: Divide came by missed
  await until(S(8));
  await play(
    ...fbox([['odds = came ÷ missed', C.ink], ['     = 75 ÷ 25', C.muted], ['     = 3', C.amber]], C.amber),
    new M.Indicate(lbl3p, { color: TEAL }), new M.Indicate(lbl1p, { color: RED }),
    ...say('ODDS = CAME ÷ MISSED', C.amber)
  );

  // Beat 9: Compare with everyone for chance
  const allW = (pileXs[3] + pileW / 2) - (pileXs[0] - pileW / 2) + 0.34;
  const allCx = (pileXs[0] + pileXs[3]) / 2;
  const allBox = new M.RoundedRectangle({ width: allW, height: pileH + 0.34, cornerRadius: 0.16, color: C.violet, strokeWidth: 2.5 });
  allBox.moveTo([allCx, dotY0, 0]);
  const allLbl = T('everyone = 100 patients', P ? 19 : 20, C.violet, true, true);
  allLbl.moveTo([allCx, dotY0 - pileH / 2 - 0.75, 0]);
  await until(S(9));
  await play(new M.FadeOut(ratioRow, { runTime: 0.5 }), new M.Create(allBox), new M.FadeIn(allLbl), ...say('CHANCE = CAME ÷ EVERYONE', C.violet));

  // Beat 10: 75 out of 100 = 75%
  await until(S(10));
  await play(
    ...fbox([['chance = 75 ÷ 100 = 75%', C.violet], ['odds   = 75 ÷ 25  = 3', C.amber]], C.violet),
    ...say('CHANCE 75%  ≠  ODDS 3', C.violet)
  );

  // ── BEATS 11-13: 1 reminder — 100 patients (90 came, 10 missed) ──────────────
  const g1Y = P ? -1.15 : -0.45, sx1 = P ? 0.44 : 0.42, sy1 = P ? 0.38 : 0.29, gap1 = 0.36, dr1 = P ? 0.105 : 0.095;
  const gridPos1 = (c, r) => {
    const totalW = 9 * sx1 + gap1;
    const x = CX - totalW / 2 + c * sx1 + (c === 9 ? gap1 : 0);
    const y = g1Y + (4.5 - r) * sy1;
    return [x, y, 0];
  };
  const dots1 = [];
  for (let c = 0; c < 10; c++) {
    for (let r = 0; r < 10; r++) dots1.push(makeDot(gridPos1(c, r), C.muted, dr1));
  }
  const hdr1 = T('1 reminder · 100 patients', P ? 20 : 21, C.ink, false, true);
  hdr1.moveTo([CX, P ? 1.20 : 1.30, 0]);

  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(hdr0, ...dots0, ...pileBoxes, ...pileNums, lbl3p, lbl1p, allBox, allLbl), { runTime: 0.55 }),
    ...clearBox(), ...say('1 REMINDER: 100 PATIENTS')
  );
  await play(new M.FadeIn(hdr1, { runTime: 0.45 }), new M.LaggedStart(dots1.map(d => new M.FadeIn(d)), { lagRatio: 0.008, runTime: 1.0 }));

  const divX1 = (gridPos1(8, 0)[0] + gridPos1(9, 0)[0]) / 2;
  const div1 = new M.DashedLine({ start: [divX1, g1Y - 5 * sy1, 0], end: [divX1, g1Y + 5 * sy1, 0], color: C.muted });
  const lbl90 = T('90 came', P ? 20 : 21, TEAL, true, true);
  lbl90.moveTo([(gridPos1(0, 0)[0] + gridPos1(8, 0)[0]) / 2, g1Y - 5.2 * sy1 - 0.30, 0]);
  const lbl10 = T('10 missed', P ? 19 : 20, RED, true, true);
  lbl10.moveTo([gridPos1(9, 0)[0] + 0.18, g1Y - 5.2 * sy1 - 0.30, 0]);

  await until(S(12));
  await play(
    new M.LaggedStart(dots1.map((d, i) => new M.Transform(d, makeDot(gridPos1(Math.floor(i / 10), i % 10), i < 90 ? TEAL : RED, dr1))), { lagRatio: 0.005, runTime: 1.0 }),
    new M.Create(div1, { runTime: 0.6 }), new M.FadeIn(lbl90), new M.FadeIn(lbl10),
    ...say('90 CAME · 10 MISSED', TEAL)
  );

  await until(S(13));
  await play(
    ...fbox(['1 reminder', ['odds = 90 ÷ 10', C.ink], ['     = 9', C.amber]], C.amber),
    ...say('1 REMINDER → ODDS = 9', C.amber)
  );

  // ── BEATS 14-16: 2 reminders — 28 patients (27 came, 1 missed) ───────────────
  const g2Y = P ? -1.15 : -0.35, sx2 = P ? 0.72 : 0.76, sy2 = P ? 0.72 : 0.62, dr2 = 0.19;
  const gridPos2 = (i) => [CX + ((i % 7) - 3) * sx2, g2Y + (1.5 - Math.floor(i / 7)) * sy2, 0];
  const dots2 = Array.from({ length: 28 }, (_, i) => makeDot(gridPos2(i), C.muted, dr2));
  const hdr2 = T('2 reminders · 28 patients', P ? 20 : 21, C.ink, false, true);
  hdr2.moveTo([CX, P ? 1.15 : 1.28, 0]);

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(hdr1, ...dots1, div1, lbl90, lbl10), { runTime: 0.55 }),
    ...clearBox(), ...say('2 REMINDERS: 28 PATIENTS')
  );
  await play(new M.FadeIn(hdr2, { runTime: 0.45 }), new M.LaggedStart(dots2.map(d => new M.FadeIn(d)), { lagRatio: 0.025, runTime: 1.0 }));

  const ring1 = new M.Circle({ radius: dr2 + 0.12, color: RED, strokeWidth: 2.5 });
  ring1.moveTo(gridPos2(27));
  const lbl27 = T('27 came', P ? 20 : 21, TEAL, true, true);
  lbl27.moveTo([CX - 0.9, g2Y - 1.5 * sy2 - 0.62, 0]);
  const lbl1 = T('1 missed', P ? 20 : 21, RED, true, true);
  lbl1.moveTo([CX + 1.55, g2Y - 1.5 * sy2 - 0.62, 0]);

  await until(S(15));
  await play(
    new M.LaggedStart(dots2.map((d, i) => new M.Transform(d, makeDot(gridPos2(i), i < 27 ? TEAL : RED, dr2))), { lagRatio: 0.015, runTime: 0.95 }),
    new M.Create(ring1, { runTime: 0.6 }), new M.Flash(dots2[27], { color: RED }),
    new M.FadeIn(lbl27), new M.FadeIn(lbl1),
    ...say('27 CAME · 1 MISSED', TEAL)
  );

  await until(S(16));
  await play(
    ...fbox(['2 reminders', ['odds = 27 ÷ 1', C.ink], ['     = 27', C.amber]], C.amber),
    ...say('2 REMINDERS → ODDS = 27', C.amber)
  );

  // ── BEATS 17-22: Odds in order (3, 9, 27) and the odds ratio ─────────────────
  const barY0 = P ? -3.8 : -2.15, unitH = P ? 0.12 : 0.10, barSp = P ? 2.15 : 2.35, barW = P ? 1.05 : 1.15;
  const oddsVals = [3, 9, 27], barX = [0, 1, 2].map(k => CX + (k - 1) * barSp);
  const barTop = oddsVals.map(v => barY0 + v * unitH);
  const barFloor = new M.Line({ start: [barX[0] - barW * 0.85, barY0, 0], end: [barX[2] + barW * 0.85, barY0, 0], color: C.muted, strokeWidth: 2 });
  const bars = oddsVals.map((v, k) => {
    const h = v * unitH;
    const b = new M.Rectangle({ width: barW, height: h, color: TEAL, strokeWidth: 2 });
    b.setFill(TEAL, 0.78); b.moveTo([barX[k], barY0 + h / 2, 0]);
    return b;
  });
  const barNums = oddsVals.map((v, k) => {
    const t = T(String(v), P ? 24 : 25, C.amber, true, true);
    t.moveTo([barX[k], barTop[k] + 0.30, 0]);
    return t;
  });
  const barNames = ['0 rem', '1 rem', '2 rem'].map((s, k) => {
    const t = T(s, P ? 18 : 19, C.ink, false, true);
    t.moveTo([barX[k], barY0 - 0.32, 0]);
    return t;
  });
  const barSubs = ['75 ÷ 25', '90 ÷ 10', '27 ÷ 1'].map((s, k) => {
    const t = T(s, 17, C.ink, true);
    t.moveTo([barX[k], barY0 - 0.70, 0]);
    return t;
  });

  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(hdr2, ...dots2, ring1, lbl27, lbl1), { runTime: 0.5 }),
    ...fbox([['0 rem → odds  3', TEAL], ['1 rem → odds  9', TEAL], ['2 rem → odds 27', C.amber]], C.amber),
    ...say('ODDS IN ORDER: 3,  9,  27', C.amber)
  );
  await play(
    new M.Create(barFloor, { runTime: 0.5 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(bars[k])), { lagRatio: 0.25, runTime: 1.2 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(barNums[k])), { lagRatio: 0.25, runTime: 1.2 }),
    ...barNames.map(n => new M.FadeIn(n, { runTime: 0.6 })),
    ...barSubs.map(n => new M.FadeIn(n, { runTime: 0.6 }))
  );

  // Beat 18: 9 is 3 times 3 (with 3 equal slices inside bar 9)
  const cuts9 = [3, 6].map(v => new M.DashedLine({
    start: [barX[1] - barW / 2, barY0 + v * unitH, 0], end: [barX[1] + barW / 2, barY0 + v * unitH, 0], color: C.bg
  }));
  const arr39 = arrow([barX[0] + 0.42, barTop[0] + 0.45, 0], [barX[1] - 0.42, barTop[1] + 0.18, 0], C.green, 2.8, 0.16);
  const tag39 = pill('× 3', C.green, 17); tag39.moveTo([(barX[0] + barX[1]) / 2 - 0.12, (barTop[0] + barTop[1]) / 2 + 0.72, 0]);
  await until(S(18));
  await play(...cuts9.map(l => new M.Create(l, { runTime: 0.6 })), new M.FadeIn(arr39), new M.FadeIn(tag39), ...say('9 IS 3 TIMES 3', C.green));

  // Beat 19: 27 is 3 times 9 (with 3 equal slices inside bar 27)
  const cuts27 = [9, 18].map(v => new M.DashedLine({
    start: [barX[2] - barW / 2, barY0 + v * unitH, 0], end: [barX[2] + barW / 2, barY0 + v * unitH, 0], color: C.bg
  }));
  const arr927 = arrow([barX[1] + 0.42, barTop[1] + 0.45, 0], [barX[2] - 0.42, barTop[2] - 0.25, 0], C.green, 2.8, 0.16);
  const tag927 = pill('× 3', C.green, 17); tag927.moveTo([(barX[1] + barX[2]) / 2 - 0.18, (barTop[1] + barTop[2]) / 2 + 0.50, 0]);
  await until(S(19));
  await play(...cuts27.map(l => new M.Create(l, { runTime: 0.6 })), new M.FadeIn(arr927), new M.FadeIn(tag927), ...say('27 IS 3 TIMES 9', C.green));

  // Beat 20: How many times one group's odds fit into the other's
  await until(S(20));
  await play(new M.Indicate(tag39, { color: C.amber }), new M.Indicate(tag927, { color: C.amber }), ...say('HOW MANY TIMES DO THE ODDS FIT?', C.cyan));

  // Beat 21: That number is the odds ratio
  await until(S(21));
  await play(...fbox([['odds ratio =', C.amber], ['  new odds ÷ old odds', C.ink]], C.amber), ...say('ODDS RATIO', C.amber));

  // Beat 22: 1 reminder vs none: 9 ÷ 3 = 3
  await until(S(22));
  await play(
    new M.Indicate(bars[0], { color: C.amber }), new M.Indicate(bars[1], { color: C.amber }), new M.Indicate(tag39, { color: C.green }),
    ...fbox(['1 rem vs 0 rem', ['odds ratio = 9 ÷ 3', C.ink], ['           = 3', C.green]], C.green),
    ...say('ODDS RATIO = 9 ÷ 3 = 3', C.green)
  );

  // ── BEATS 23-29: Score line from 10.3.2 & natural log (log odds) ─────────────
  const SY = P ? -2.30 : -1.15, OY = P ? -0.25 : 0.35;
  const sX0 = P ? -2.45 : -5.55, sX1 = P ? 3.35 : 1.45;
  const sx = v => sX0 + (v / 4) * (sX1 - sX0);
  const scores = [1.1, 2.2, 3.3];
  const rowLblX = P ? -3.20 : -6.15;

  const sLine = new M.Line({ start: [sX0, SY, 0], end: [sX1, SY, 0], color: C.muted, strokeWidth: 3 });
  const sTicks = [];
  for (let v = 0; v <= 4; v++) {
    sTicks.push(new M.Line({ start: [sx(v), SY - 0.08, 0], end: [sx(v), SY + 0.08, 0], color: C.muted, strokeWidth: 2 }));
    if (v === 0 || v === 4) {
      const t = T(String(v), 16, C.muted, true); t.moveTo([sx(v), SY - 0.36, 0]); sTicks.push(t);
    }
  }
  const sRowLbl = T('score', P ? 16 : 17, C.amber, true, true); sRowLbl.moveTo([rowLblX, SY, 0]);
  const sDots = scores.map(v => makeDot([sx(v), SY, 0], C.amber, 0.13));
  const sVals = scores.map(v => { const t = T(String(v), P ? 18 : 19, C.amber, true, true); t.moveTo([sx(v), SY - 0.40, 0]); return t; });
  const sRems = ['0 rem', '1 rem', '2 rem'].map((s, k) => { const t = T(s, 17, C.ink); t.moveTo([sx(scores[k]), SY - 0.76, 0]); return t; });

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(barFloor, ...bars, ...barNums, ...barNames, ...barSubs, arr39, tag39, ...cuts9, arr927, tag927, ...cuts27), { runTime: 0.55 }),
    ...clearBox(), ...say('THE SCORE LINE (FROM 10.3.2)', C.amber)
  );
  await play(
    new M.Create(sLine, { runTime: 0.7 }),
    ...sTicks.map(t => new M.FadeIn(t, { runTime: 0.5 })),
    new M.FadeIn(sRowLbl, { runTime: 0.5 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(sDots[k])), { lagRatio: 0.2, runTime: 0.9 }),
    ...sVals.map(t => new M.FadeIn(t, { runTime: 0.7 })),
    ...sRems.map(t => new M.FadeIn(t, { runTime: 0.7 }))
  );

  // Beat 24: Place the odds beside the scores
  const oRowLbl = T('odds', P ? 16 : 17, TEAL, true, true); oRowLbl.moveTo([rowLblX, OY, 0]);
  const oBadges = oddsVals.map((v, k) => card([sx(scores[k]), OY, 0], P ? 0.95 : 1.05, 0.56, TEAL, [[String(v), P ? 20 : 21, TEAL, true, true]]));
  const vLinks = scores.map(v => new M.DashedLine({ start: [sx(v), OY - 0.30, 0], end: [sx(v), SY + 0.16, 0], color: C.muted }));
  await until(S(24));
  await play(
    new M.FadeIn(oRowLbl),
    new M.LaggedStart(vLinks.map(l => new M.Create(l)), { lagRatio: 0.18, runTime: 0.9 }),
    new M.LaggedStart(oBadges.map(b => new M.FadeIn(b)), { lagRatio: 0.18, runTime: 0.9 }),
    ...say('ODDS BESIDE THE SCORES', TEAL)
  );

  // Beat 25: Every extra reminder multiplies the odds by 3
  const mulY = OY + 0.58;
  const mulArrs = [0, 1].map(k => arrow([sx(scores[k]) + 0.25, mulY, 0], [sx(scores[k + 1]) - 0.25, mulY, 0], C.green, 2.8, 0.15));
  const mulTags = [0, 1].map(k => {
    const t = T('× 3', P ? 18 : 19, C.green, true, true);
    t.moveTo([(sx(scores[k]) + sx(scores[k + 1])) / 2, mulY + 0.30, 0]);
    return t;
  });
  await until(S(25));
  await play(
    new M.LaggedStart([0, 1].map(k => new M.FadeIn(mulArrs[k])), { lagRatio: 0.3, runTime: 1.0 }),
    new M.LaggedStart([0, 1].map(k => new M.FadeIn(mulTags[k])), { lagRatio: 0.3, runTime: 1.0 }),
    ...say('ODDS: × 3 EACH REMINDER', C.green)
  );

  // Beat 26: On the score line, every extra reminder adds about 1.1
  const addY = SY - 1.15;
  const addArrs = [0, 1].map(k => arrow([sx(scores[k]) + 0.25, addY, 0], [sx(scores[k + 1]) - 0.25, addY, 0], C.amber, 2.8, 0.15));
  const addTags = [0, 1].map(k => {
    const t = T('+ 1.1', P ? 18 : 19, C.amber, true, true);
    t.moveTo([(sx(scores[k]) + sx(scores[k + 1])) / 2, addY - 0.32, 0]);
    return t;
  });
  await until(S(26));
  await play(
    new M.LaggedStart([0, 1].map(k => new M.FadeIn(addArrs[k])), { lagRatio: 0.3, runTime: 1.0 }),
    new M.LaggedStart([0, 1].map(k => new M.FadeIn(addTags[k])), { lagRatio: 0.3, runTime: 1.0 }),
    ...say('SCORE: + 1.1 EACH REMINDER', C.amber)
  );

  // Beat 27: Logarithm turns multiplication into addition
  const logMidY = (OY + SY) / 2;
  const logBadge = new M.VGroup(
    arrow([rowLblX, OY - 0.30, 0], [rowLblX, SY + 0.30, 0], C.violet, 2.6, 0.14),
    pill('log', C.violet, 15).moveTo([rowLblX, logMidY, 0])
  );
  await until(S(27));
  await play(
    new M.FadeIn(logBadge),
    ...fbox([['log turns', C.violet], ['× (multiply) → + (add)', C.ink]], C.violet),
    ...say('LOG: MULTIPLY → ADD', C.violet)
  );

  // Beat 28: Natural log uses e
  await until(S(28));
  await play(
    ...fbox([['base e ≈ 2.718', C.amber], ['natural log = ln', C.violet]], C.violet),
    ...say('NATURAL LOG USES e', C.violet)
  );

  // Beat 29: Score is natural log of the odds, called log odds
  await until(S(29));
  await play(
    new M.LaggedStart(vLinks.map(l => new M.Indicate(l, { color: C.violet })), { lagRatio: 0.18, runTime: 1.2 }),
    ...fbox([['score = ln(odds)', C.amber], ['      = log odds', C.violet], ['ln(3) ≈ 1.1', C.muted]], C.amber),
    ...say('SCORE = LOG ODDS', C.amber)
  );

  // ── BEATS 30-35: Reversing with e to a power & coefficient formula ───────────
  const revY = P ? 0.15 : 0.35, revDx = P ? 2.05 : 2.35;
  const revLeft = card([CX - revDx, revY, 0], P ? 1.85 : 2.1, 0.95, TEAL, [['odds', 15, C.muted, true], ['3', 24, TEAL, true, true]]);
  const revRight = card([CX + revDx, revY, 0], P ? 1.85 : 2.1, 0.95, C.amber, [['score', 15, C.muted, true], ['1.1', 24, C.amber, true, true]]);
  const revTopA = arrow([CX - revDx + (P ? 1.05 : 1.18), revY + 0.22, 0], [CX + revDx - (P ? 1.05 : 1.18), revY + 0.22, 0], C.muted, 2.2, 0.14);
  const revTopT = T('ln', 17, C.muted, true, true); revTopT.moveTo([CX, revY + 0.50, 0]);
  const revTop = new M.VGroup(revTopA, revTopT);
  const revBotA = arrow([CX + revDx - (P ? 1.05 : 1.18), revY - 0.22, 0], [CX - revDx + (P ? 1.05 : 1.18), revY - 0.22, 0], C.green, 3.2, 0.17);
  const revBotT = T('reverse using e', P ? 16 : 17, C.green, true, true); revBotT.moveTo([CX, revY - 0.56, 0]);
  const revBot = new M.VGroup(revBotA, revBotT);

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(sLine, ...sTicks, ...sDots, ...sVals, ...sRems, sRowLbl, oRowLbl, ...oBadges, ...vLinks, ...mulArrs, ...mulTags, ...addArrs, ...addTags, logBadge), { runTime: 0.55 }),
    ...clearBox(), ...say('REVERSE NATURAL LOG USING e', C.green)
  );
  await play(new M.FadeIn(revLeft), new M.FadeIn(revRight), new M.FadeIn(revTop), new M.FadeIn(revBot));

  // Beat 31: Callback to e on the S-shaped curve
  const scY = P ? -2.35 : -1.55, scW = 3.6, scH = 1.65;
  const scRect = new M.RoundedRectangle({ width: scW, height: scH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  scRect.setFill(C.card, 0.94); scRect.moveTo([CX, scY, 0]);
  const scAxX = new M.Line({ start: [CX - 1.35, scY - 0.45, 0], end: [CX + 1.35, scY - 0.45, 0], color: C.muted, strokeWidth: 1.5 });
  const scAxY = new M.Line({ start: [CX, scY - 0.50, 0], end: [CX, scY + 0.35, 0], color: C.muted, strokeWidth: 1.5 });
  const scSegs = [];
  for (let k = 0; k < 18; k++) {
    const t0 = -4.2 + k * 8.4 / 18, t1 = -4.2 + (k + 1) * 8.4 / 18;
    const y0 = 1 / (1 + Math.exp(-t0)), y1 = 1 / (1 + Math.exp(-t1));
    scSegs.push(new M.Line({
      start: [CX + t0 * 0.28, scY - 0.42 + y0 * 0.72, 0],
      end: [CX + t1 * 0.28, scY - 0.42 + y1 * 0.72, 0],
      color: TEAL, strokeWidth: 3
    }));
  }
  const scLbl = T('S-curve uses e', 16, C.amber, true, true); scLbl.moveTo([CX, scY + 0.56, 0]);
  const scurveBox = new M.VGroup(scRect, scAxX, scAxY, ...scSegs, scLbl);

  await until(S(31));
  await play(new M.FadeIn(scurveBox), ...say('YOU MET e ON THE S-CURVE', C.amber));

  // Beat 32: Calculator button for e to a power, with score step as power
  const btnY = P ? -1.15 : -0.25, btnDx = P ? 2.35 : 2.65;
  const stepCard = card([CX - btnDx, btnY, 0], P ? 1.60 : 1.75, 1.05, C.amber, [['score step', 15, C.muted], ['+ 1.1', 23, C.amber, true, true]]);
  const btnOuter = new M.RoundedRectangle({ width: 1.65, height: 1.20, cornerRadius: 0.20, color: C.green, strokeWidth: 3 });
  btnOuter.setFill('#142347', 0.98); btnOuter.moveTo([CX, btnY, 0]);
  const btnInner = new M.RoundedRectangle({ width: 1.45, height: 1.00, cornerRadius: 0.14, color: C.green, strokeWidth: 1 });
  btnInner.setFill(C.card, 0.45); btnInner.moveTo([CX, btnY, 0]);
  const btnTxt = T('e^x', 28, C.green, true, true); btnTxt.moveTo([CX, btnY + 0.08, 0]);
  const btnSub = T('button', 15, C.muted, true); btnSub.moveTo([CX, btnY - 0.34, 0]);
  const expBtn = new M.VGroup(btnOuter, btnInner, btnTxt, btnSub);
  const inArr = arrow([CX - btnDx + (P ? 0.88 : 0.96), btnY, 0], [CX - 0.92, btnY, 0], C.amber, 2.8, 0.15);

  await until(S(32));
  await play(new M.FadeOut(new M.VGroup(revLeft, revRight, revTop, revBot, scurveBox), { runTime: 0.5 }), ...say('BUTTON: e TO THE POWER OF THE STEP', C.green));
  await play(
    new M.FadeIn(stepCard), new M.FadeIn(inArr), new M.FadeIn(expBtn),
    ...fbox([['score step = +1.1', C.amber], ['press  e^1.1', C.green]], C.green)
  );

  // Beat 33: Turns +1.1 back into multiplier × 3
  const outArr = arrow([CX + 0.92, btnY, 0], [CX + btnDx - (P ? 0.88 : 0.96), btnY, 0], C.green, 2.8, 0.15);
  const multCard = card([CX + btnDx, btnY, 0], P ? 1.60 : 1.75, 1.05, TEAL, [['multiplier', 15, C.muted], ['× 3', 24, TEAL, true, true]]);
  await until(S(33));
  await play(
    new M.Indicate(expBtn, { color: C.amber }),
    new M.FadeIn(outArr), new M.FadeIn(multCard),
    ...fbox([['+ 1.1  →  e^1.1 ≈ 3', C.amber], ['adding → multiplying', TEAL]], C.amber),
    ...say('e^1.1 ≈ 3  (MULTIPLIER)', C.amber)
  );

  // Beat 34: Number added to score for one more reminder = coefficient
  const coeffTag = pill('COEFFICIENT', C.cyan, 15);
  coeffTag.moveTo([CX - btnDx, btnY - 0.95, 0]);
  await until(S(34));
  await play(
    new M.FadeIn(coeffTag), new M.Indicate(stepCard, { color: C.cyan }),
    ...fbox(['score = 1.1 + 1.1 × rem', ['coefficient = 1.1', C.cyan]], C.cyan),
    ...say('COEFFICIENT = +1.1 PER REMINDER', C.cyan)
  );

  // Beat 35: Odds ratio = e to the power of the coefficient
  await until(S(35));
  await play(
    new M.Indicate(expBtn, { color: C.amber }), new M.Indicate(multCard, { color: C.amber }),
    ...fbox([['odds ratio = e^(coeff)', C.amber], ['           = e^1.1', C.ink], ['           ≈ 3', C.green]], C.amber),
    ...say('ODDS RATIO = e^(COEFFICIENT)', C.amber)
  );

  // ── BEAT 36: What it is for — how odds change for one more reminder ──────────
  const uY = P ? -1.15 : -0.25, uDx = P ? 2.15 : 2.4;
  const useL = card([CX - uDx, uY, 0], P ? 2.0 : 2.25, 1.15, C.muted, [['0 reminders', 16, C.ink, false, true], ['odds = 3', 18, TEAL, true]]);
  const useR = card([CX + uDx, uY, 0], P ? 2.0 : 2.25, 1.15, TEAL, [['1 reminder', 16, C.ink, false, true], ['odds = 9', 18, C.amber, true]]);
  const useArr = arrow([CX - uDx + (P ? 1.10 : 1.22), uY, 0], [CX + uDx - (P ? 1.10 : 1.22), uY, 0], C.green, 3.0, 0.16);
  const useTop = pill('ODDS × 3', C.green, 17); useTop.moveTo([CX, uY + 0.55, 0]);
  const useSub = T('+1 reminder', 16, C.amber, true, true); useSub.moveTo([CX, uY - 0.42, 0]);

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(stepCard, inArr, expBtn, outArr, multCard, coeffTag), { runTime: 0.5 }),
    ...clearBox(), ...say('USE: HOW ODDS CHANGE FOR +1 REMINDER', TEAL)
  );
  await play(new M.FadeIn(useL), new M.FadeIn(useR), new M.FadeIn(useArr), new M.FadeIn(useTop), new M.FadeIn(useSub));

  // ── BEATS 37-38: Same age held fixed (conditional comparison) ────────────────
  const ageY1 = P ? -0.35 : 0.35, ageY2 = P ? -2.15 : -1.15;
  const ageDx = P ? 2.05 : 2.35, ageW = P ? 2.35 : 2.65, ageH = 1.05;
  function ageRow(y, age, col) {
    const l = card([CX - ageDx, y, 0], ageW, ageH, col, [[`Age ${age}`, 17, col, true, true], ['0 reminders', 15, C.muted]]);
    const r = card([CX + ageDx, y, 0], ageW, ageH, col, [[`Age ${age}`, 17, col, true, true], ['1 reminder', 15, TEAL]]);
    const a = arrow([CX - ageDx + ageW / 2 + 0.10, y, 0], [CX + ageDx - ageW / 2 - 0.10, y, 0], C.green, 2.6, 0.14);
    const t = T('× 3', 17, C.green, true, true); t.moveTo([CX, y + 0.30, 0]);
    return [l, r, a, t];
  }
  const ageItems = [...ageRow(ageY1, 50, C.cyan), ...ageRow(ageY2, 70, C.violet)];

  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(useL, useR, useArr, useTop, useSub), { runTime: 0.5 }),
    ...fbox(['with age in model:', ['compare same age', C.cyan], ['50 vs 50 · 70 vs 70', C.muted]], C.cyan),
    ...say('MODEL WITH AGE: COMPARE SAME AGE', C.cyan)
  );
  await play(new M.LaggedStart(ageItems.map(o => new M.FadeIn(o)), { lagRatio: 0.10, runTime: 1.2 }));

  const fixedTag = pill('ANOTHER FACT HELD FIXED (AGE)', C.violet, 16);
  fixedTag.moveTo([CX, P ? -3.45 : -2.25, 0]);
  await until(S(38));
  await play(
    new M.FadeIn(fixedTag), new M.Indicate(ageItems[0], { color: C.violet }), new M.Indicate(ageItems[1], { color: C.violet }),
    ...fbox([['conditional comparison', C.violet], ['= hold other facts fixed', C.ink]], C.violet),
    ...say('CONDITIONAL COMPARISON', C.violet)
  );

  // ── BEATS 39-41: Common trap — triple odds ≠ triple chance ───────────────────
  const trY = P ? 0.25 : 0.65, trDx = P ? 1.85 : 2.15, trW = P ? 3.25 : 3.7, trH = 1.05;
  const trapL = card([CX - trDx, trY, 0], trW, trH, C.green, [['ODDS: 3 → 9', P ? 17 : 18, C.ink, true, true], ['× 3  ✓', P ? 19 : 20, C.green, true, true]]);
  const trapR = card([CX + trDx, trY, 0], trW, trH, RED, [['CHANCE: 75% → 90%', P ? 15 : 17, C.ink, true, true], ['× 3 ?', P ? 19 : 20, RED, true, true]]);
  const xPos = [CX + trDx, trY - 0.22, 0];
  const redX = new M.VGroup(
    new M.Line({ start: [xPos[0] - 0.52, xPos[1] - 0.20, 0], end: [xPos[0] + 0.52, xPos[1] + 0.20, 0], color: RED, strokeWidth: 4 }),
    new M.Line({ start: [xPos[0] - 0.52, xPos[1] + 0.20, 0], end: [xPos[0] + 0.52, xPos[1] - 0.20, 0], color: RED, strokeWidth: 4 })
  );

  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(...ageItems, fixedTag), { runTime: 0.5 }),
    ...fbox([['TRAP:', RED], ['odds × 3 ≠ chance × 3', C.ink]], RED),
    ...say('TRAP: TRIPLE ODDS ≠ TRIPLE CHANCE', RED)
  );
  await play(new M.FadeIn(trapL), new M.FadeIn(trapR), new M.Create(redX, { runTime: 0.7 }));

  // Beat 40: Chance rises from 75% to 90%
  const pLen = P ? 4.6 : 5.8, pX0 = CX - pLen / 2, pH = 0.52;
  const pYs = P ? [-1.50, -2.55] : [-0.75, -1.65];
  const pData = [[0.75, '0 rem', '75%'], [0.90, '1 rem', '90%']];
  const pTracks = pYs.map(y => {
    const r = new M.RoundedRectangle({ width: pLen, height: pH, cornerRadius: 0.10, color: C.muted, strokeWidth: 1.5 });
    r.setFill(C.card, 0.7); r.moveTo([CX, y, 0]);
    return r;
  });
  const pBars = pData.map(([frac], k) => {
    const w = pLen * frac;
    const b = new M.RoundedRectangle({ width: w, height: pH - 0.06, cornerRadius: 0.08, color: TEAL, strokeWidth: 1.5 });
    b.setFill(TEAL, 0.80); b.moveTo([pX0 + w / 2, pYs[k], 0]);
    return b;
  });
  const pNames = pData.map(([, name], k) => {
    const t = T(name, P ? 16 : 17, C.muted, true); t.moveTo([pX0 - 0.62, pYs[k], 0]); return t;
  });
  const pVals = pData.map(([, , pct], k) => {
    const t = T(pct, P ? 18 : 19, C.amber, true, true); t.moveTo([pX0 + pLen + 0.52, pYs[k], 0]); return t;
  });

  await until(S(40));
  await play(
    ...pTracks.map(r => new M.FadeIn(r, { runTime: 0.5 })),
    new M.LaggedStart(pBars.map(b => new M.FadeIn(b)), { lagRatio: 0.3, runTime: 1.0 }),
    ...pNames.map(t => new M.FadeIn(t)), ...pVals.map(t => new M.FadeIn(t)),
    ...say('CHANCE RISES: 75% → 90%', TEAL)
  );

  // Beat 41: 90 ÷ 75 = 1.2 (only 1.2 times, not 3)
  const ratioBadge = pill('90% ÷ 75% = × 1.2   (ONLY 1.2 TIMES)', C.amber, P ? 16 : 17);
  ratioBadge.moveTo([CX, P ? -3.75 : -2.55, 0]);
  await until(S(41));
  await play(
    new M.FadeIn(ratioBadge), new M.Indicate(pVals[1], { color: C.amber }),
    ...fbox(['chance ratio:', ['90 ÷ 75 = 1.2', C.amber], ['(not 3!)', RED]], C.amber),
    ...say('90 ÷ 75 = 1.2  (NOT 3)', C.amber)
  );

  // ── BEAT 42: Recap — odds ratio = how many times odds change ─────────────────
  const finY = P ? -1.10 : -0.25, finDx = P ? 2.35 : 2.65, finW = P ? 1.65 : 1.9, finH = 1.25;
  const finCards = [
    ['0 rem', 'odds 3', TEAL],
    ['1 rem', 'odds 9', TEAL],
    ['2 rem', 'odds 27', C.amber]
  ].map(([a, b, col], k) => card([CX + (k - 1) * finDx, finY, 0], finW, finH, col, [[a, 15, C.muted], [b, P ? 19 : 21, col, true, true]]));
  const finArrs = [0, 1].map(k => {
    const x1 = CX + (k - 1) * finDx + finW / 2 + 0.08;
    const x2 = CX + k * finDx - finW / 2 - 0.08;
    const lbl = T('× 3', 16, C.green, true, true); lbl.moveTo([(x1 + x2) / 2, finY + 0.34, 0]);
    return new M.VGroup(arrow([x1, finY, 0], [x2, finY, 0], C.green, 2.8, 0.14), lbl);
  });
  const finTag = pill('ODDS RATIO = 3  PER EXTRA REMINDER', C.green, P ? 16 : 18);
  finTag.moveTo([CX, finY - 1.35, 0]);

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(trapL, trapR, redX, ...pTracks, ...pBars, ...pNames, ...pVals, ratioBadge), { runTime: 0.55 }),
    ...fbox([['odds ratio = e^(coeff)', C.amber], ['e^1.1 ≈ 3', C.green], ['+1 rem → odds × 3', TEAL]], C.green),
    ...say('ODDS RATIO = HOW MANY TIMES ODDS CHANGE', C.green)
  );
  await play(
    new M.LaggedStart([...finCards.map(c => new M.FadeIn(c)), ...finArrs.map(a => new M.FadeIn(a))], { lagRatio: 0.16, runTime: 1.4 }),
    new M.FadeIn(finTag)
  );
}

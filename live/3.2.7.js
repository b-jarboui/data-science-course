// 3.2.7 Simple imputation: filling gaps with the mean keeps the mean, but shrinks the spread.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const R = [19, null, 31, 19, null, 31], MEAN = 25, REAL = [0, 2, 3, 5], GAPS = [1, 4];
  const BASE = P ? -5.2 : -2.6, U = P ? 0.32 : 0.2;
  const X0 = P ? -3.4 : -6.3, SP = P ? 1.0 : 1.2, X1 = P ? 2.3 : 0.9;
  const CX = P ? 0 : (X0 + X1) / 2;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.45, -0.3, 0];
  const bx = k => X0 + (P ? 0.45 : 0.75) + k * SP, ty = t => BASE + (t - 15) * U;
  const GAPY = BASE + 0.42, HALO = P ? 0.24 : 0.28, VS = P ? 18 : 18, TILE = P ? 0.56 : 0.5, TOFF = P ? 0.4 : 0.42;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // one thing at a time in the box slot (table, formula box, bars)
  let slotNow = null;
  function toSlot(g) { const a = [new M.FadeIn(g)]; if (slotNow) a.push(new M.FadeOut(slotNow)); slotNow = g; return a; }
  function clearSlot() { const a = slotNow ? [new M.FadeOut(slotNow)] : []; slotNow = null; return a; }

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    return toSlot(g);
  }

  // a reading: glowing dot + value (below the dot when under the mean, above when over it)
  function reading(k, v, color) {
    const p = [bx(k), ty(v), 0];
    const halo = new M.Dot({ point: p, radius: HALO, color }); halo.setFill(color, 0.18);
    const d = new M.Dot({ point: p, radius: 0.12, color });
    const lab = T(String(v), VS, color, true); lab.moveTo([p[0], p[1] + (v < MEAN ? -0.36 : 0.36), 0]);
    return new M.VGroup(halo, d, lab);
  }
  // a gap: hollow dashed circle with a question mark
  function gapMark(k) {
    const c = [bx(k), GAPY, 0], r = 0.17, n = 12, parts = [];
    for (let j = 0; j < n; j++) {
      const a0 = j * 2 * Math.PI / n, a1 = a0 + Math.PI / n;
      parts.push(new M.Line({ start: [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0), 0], end: [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1), 0], color: C.muted, strokeWidth: 3 }));
    }
    const q = T('?', 16, C.muted, true); q.moveTo(c);
    return new M.VGroup(...parts, q);
  }
  const filled = () => GAPS.map(k => reading(k, MEAN, C.green));

  // 0 six beds, six sensors
  const beds = R.map((_, k) => {
    const r = new M.Rectangle({ width: P ? 0.72 : 0.84, height: 0.18, color: C.green, strokeWidth: 2 }); r.setFill(C.green, 0.3); r.moveTo([bx(k), BASE - 0.2, 0]);
    const sensor = new M.Rectangle({ width: 0.16, height: 0.1, color: C.ink, strokeWidth: 1 }); sensor.setFill(C.ink, 1); sensor.moveTo([bx(k), BASE - 0.2, 0]);
    const num = T(String(k + 1), P ? 16 : 17, C.muted, true); num.moveTo([bx(k), BASE - 0.52, 0]);
    return new M.VGroup(r, sensor, num);
  });
  const bedWord = T('bed', 15, C.muted); bedWord.moveTo([X0 - 0.3, BASE - 0.52, 0]);
  // a plant and a sensor stake on every bed, so the first picture is not empty
  const stakeTop = ty(P ? 27 : 26);
  const stakes = R.map((_, k) => {
    const x = bx(k);
    const pole = new M.Line({ start: [x + 0.2, BASE - 0.1, 0], end: [x + 0.2, stakeTop, 0], color: C.muted, strokeWidth: 2 });
    const head = new M.RoundedRectangle({ width: 0.36, height: 0.26, cornerRadius: 0.06, color: C.cyan, strokeWidth: 2 });
    head.setFill(C.card, 0.95); head.moveTo([x + 0.2, stakeTop + 0.13, 0]);
    const led = new M.Dot({ point: [x + 0.2, stakeTop + 0.13, 0], radius: 0.05, color: C.cyan });
    const stem = new M.Line({ start: [x - 0.12, BASE - 0.1, 0], end: [x - 0.12, BASE + (P ? 1.0 : 0.7), 0], color: C.green, strokeWidth: 3 });
    const leaves = [[-0.3, 0.45], [0.06, 0.7], [-0.12, P ? 1.05 : 0.8]].map(([dx, dy]) => {
      const c = new M.Circle({ radius: P ? 0.15 : 0.12, color: C.green, strokeWidth: 2 }); c.setFill(C.green, 0.45);
      c.moveTo([x + dx, BASE + dy * (P ? 1.2 : 0.85), 0]); return c;
    });
    return new M.VGroup(pole, head, led, stem, ...leaves);
  });
  const stakeWord = T('sensor', P ? 16 : 16, C.cyan); stakeWord.moveTo([bx(0) + 0.2, stakeTop + 0.6, 0]);
  await until(S(0)); await play(new M.LaggedStart(beds.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.6 }), new M.FadeIn(bedWord),
    new M.LaggedStart(stakes.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.8 }), new M.FadeIn(stakeWord), ...say('6 BEDS · 6 SENSORS', C.green));

  // 1 noon: a temperature axis for the readings
  const axis = new M.Line({ start: [X0, BASE, 0], end: [X0, ty(35) + 0.15, 0], color: C.muted, strokeWidth: 2 });
  const grid = [15, 20, 25, 30, 35].map(t => new M.VGroup(
    new M.Line({ start: [X0, ty(t), -0.01], end: [X1, ty(t), -0.01], color: t === 15 ? C.muted : C.line, strokeWidth: t === 15 ? 2 : 1 }),
    T(String(t), P ? 15 : 16, C.muted, true).moveTo([X0 - 0.28, ty(t), 0])));
  const unit = T('°C', 15, C.muted); unit.moveTo([X0 - 0.28, ty(35) + 0.3, 0]);
  await until(S(1)); await play(new M.FadeOut(new M.VGroup(...stakes, stakeWord)), new M.Create(axis), new M.LaggedStart(grid.map(g => new M.FadeIn(g)), { lagRatio: 0.1, runTime: 1.2 }), new M.FadeIn(unit), ...say('NOON: ONE READING EACH'));

  // 2-7 the readings, bed by bed
  const dots = [], gaps = [];
  for (let k = 0; k < 6; k++) {
    await until(S(2 + k));
    if (R[k] === null) {
      gaps[k] = gapMark(k);
      await play(new M.FadeIn(gaps[k]), new M.Indicate(beds[k], { color: C.pink }), ...say(k === 1 ? 'MISSING: RADIO GLITCH' : 'MISSING AGAIN: RANDOM GLITCH', C.muted));
    } else {
      dots[k] = reading(k, R[k], C.cyan);
      await play(new M.FadeIn(dots[k]), new M.Flash(dots[k].submobjects[1], { color: C.cyan }));
    }
  }
  const realDots = REAL.map(k => dots[k]);

  // 8 readings differ a lot
  await until(S(8)); await play(new M.LaggedStart(realDots.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.2, runTime: 1.8 }), ...say('SHADY 19 · SUNNY 31'));

  // 9 the table has empty cells
  const CW = 0.7, cells = [], gapCells = [];
  R.forEach((v, k) => {
    const x = BOXP[0] + (k - 2.5) * CW, y = BOXP[1] - 0.12;
    const r = new M.Rectangle({ width: CW, height: 0.5, color: v === null ? C.pink : C.cyan, strokeWidth: v === null ? 3 : 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const head = T(String(k + 1), 16, C.muted, true); head.moveTo([x, y + 0.48, 0]);
    cells.push(r, head);
    if (v === null) gapCells.push(r);
    else { const t = T(String(v), 18, C.cyan, true); t.moveTo([x, y, 0]); cells.push(t); }
  });
  await until(S(9)); await play(...toSlot(new M.VGroup(...cells)), ...say('EMPTY CELLS → PROGRAMS FAIL', C.pink));
  await until(S(9) + 2.6); await play(new M.LaggedStart(gapCells.map(r => new M.Indicate(r, { color: C.pink })), { lagRatio: 0.3, runTime: 1.2 }));

  // 10 imputation
  await until(S(10)); await play(...say('IMPUTATION = FILL A GAP WITH A GUESS', C.green), new M.LaggedStart(GAPS.map(k => new M.Indicate(gaps[k], { color: C.green })), { lagRatio: 0.3, runTime: 1.4 }));

  // 11-13 the mean of the four real readings
  await until(S(11)); await play(...clearSlot(), ...say('SIMPLEST GUESS: MEAN OF THE 4', C.amber), new M.LaggedStart(realDots.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }));
  await until(S(12)); await play(...fbox(['19 + 31 + 19 + 31', ['= 100', C.amber]], C.amber), ...say('ADD THE 4 READINGS', C.amber));
  const meanLine = new M.DashedLine({ start: [X0, ty(MEAN), 0], end: [X1, ty(MEAN), 0], color: C.amber });
  const tag = pill('MEAN 25', C.amber, 15); tag.moveTo([X1 + (P ? 0.68 : 0.7), ty(MEAN), 0]);
  await until(S(13)); await play(...fbox(['sum   = 100', 'count = 4', ['mean  = 100 ÷ 4 = 25', C.amber]], C.amber), new M.Create(meanLine), new M.FadeIn(tag), ...say('MEAN = 25', C.amber));

  // 14-15 write 25 into both gaps
  let fills = filled();
  await until(S(14));
  await play(new M.FadeOut(new M.VGroup(...GAPS.map(k => gaps[k]))), ...fills.map(f => new M.FadeIn(f, { shift: [0, 0.3, 0] })), ...fills.map(f => new M.Flash(f.submobjects[1], { color: C.green })));
  await until(S(14) + 3.8); await play(...say('MEAN IMPUTATION', C.green));
  await until(S(15)); await play(new M.Indicate(meanLine, { color: C.green }), new M.LaggedStart(fills.map(f => new M.Indicate(f, { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }), ...say('FILLED DOTS SIT ON THE MEAN', C.green));

  // 16-18 mean of all six beds
  const all6 = [dots[0], fills[0], dots[2], dots[3], fills[1], dots[5]];
  await until(S(16)); await play(new M.LaggedStart(all6.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.15, runTime: 1.6 }), ...say('MEAN OF ALL 6 BEDS?', C.amber));
  await until(S(17)); await play(...fbox(['100 + 25 + 25', ['= 150', C.amber]], C.amber));
  await until(S(18)); await play(...fbox(['sum   = 150', 'count = 6', ['mean  = 150 ÷ 6 = 25', C.amber]], C.amber));
  await until(S(18) + 2.8); await play(new M.Indicate(tag, { color: C.green }), ...say('MEAN UNCHANGED ✓', C.green));

  // 19-20 spread
  await until(S(19)); await play(...clearSlot(), ...say('SPREAD: HOW FAR FROM THE MEAN', C.violet));
  await until(S(20)); await play(...fbox(['standard deviation', ['= a typical distance', C.violet], ['  from the mean', C.violet]], C.violet), ...say('SD = TYPICAL DISTANCE', C.violet));

  // 21 before filling: four real readings, each 6 from the mean
  await until(S(21));
  const gaps2 = GAPS.map(k => gapMark(k));
  await play(new M.FadeOut(new M.VGroup(...fills)), ...gaps2.map(g => new M.FadeIn(g)), ...say('BEFORE FILLING: 4 REAL READINGS', C.muted));
  const segs = REAL.map(k => { const v = R[k], low = v < MEAN;
    return new M.Line({ start: [bx(k), ty(v) + (low ? 0.12 : -0.12), 0], end: [bx(k), ty(MEAN), 0], color: C.violet, strokeWidth: 4 }); });
  const sixes = REAL.map(k => { const t = T('6', VS, C.violet, true); t.moveTo([bx(k) - 0.24, ty((R[k] + MEAN) / 2), 0]); return t; });
  await until(S(21) + 2.2);
  await play(new M.LaggedStart(segs.map(l => new M.Create(l)), { lagRatio: 0.2, runTime: 1.4 }), new M.LaggedStart(sixes.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox(['25 − 19 = 6  below', '31 − 25 = 6  above'], C.violet), ...say('EACH IS 6 FROM THE MEAN', C.violet));

  // 22-26 spread before filling
  const tiles = REAL.map(k => { const c = [bx(k) + TOFF, ty((R[k] + MEAN) / 2), 0];
    const sq = new M.Rectangle({ width: TILE, height: TILE, color: C.violet, strokeWidth: 2 }); sq.setFill(C.violet, 0.25); sq.moveTo(c);
    const t = T('36', 16, C.ink, true); t.moveTo(c); return new M.VGroup(sq, t); });
  await until(S(22)); await play(new M.LaggedStart(tiles.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.4 }), ...fbox(['each distance squared:', ['6 × 6 = 36', C.violet]], C.violet), ...say('SQUARE EACH DISTANCE', C.violet));
  await until(S(23)); await play(new M.LaggedStart(tiles.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }), ...fbox(['36 + 36 + 36 + 36', ['= 4 × 36 = 144', C.amber]], C.violet), ...say('4 SQUARES = 144', C.violet));
  await until(S(24)); await play(...fbox(['144 ÷ (4 − 1)', '= 144 ÷ 3', ['= 48', C.amber]], C.violet), ...say('DIVIDE BY COUNT − 1 = 3', C.violet));
  await until(S(25)); await play(...fbox(['take the square root:', ['√48  (back to °C)', C.amber]], C.violet), ...say('SQUARE ROOT UNDOES THE SQUARE', C.violet));
  await until(S(26)); await play(...fbox(['spread before filling:', ['SD = √48 ≈ 6.9 °C', C.amber]], C.violet), new M.LaggedStart(segs.map(l => new M.Indicate(l, { color: C.violet })), { lagRatio: 0.2, runTime: 1.2 }), ...say('SPREAD BEFORE ≈ 6.9 °C', C.violet));

  // 27-30 after filling: two zero distances
  await until(S(27));
  fills = filled();
  await play(new M.FadeOut(new M.VGroup(...gaps2)), ...fills.map(f => new M.FadeIn(f, { shift: [0, 0.3, 0] })), ...say('AFTER FILLING: 2 GUESSES AT 25', C.green));
  const zeros = GAPS.map(k => { const t = T('0', VS, C.green, true); t.moveTo([bx(k) + 0.36, ty(MEAN) - 0.32, 0]); return t; });
  await until(S(27) + 3.0); await play(new M.LaggedStart(zeros.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.0 }), ...say('DISTANCE 0: NO SQUARE ADDED', C.green));
  await until(S(28)); await play(new M.LaggedStart(tiles.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...fbox(['36 + 36 + 36 + 36', '+ 0 + 0', ['= 144', C.amber]], C.violet), ...say('SQUARES STILL TOTAL 144', C.violet));
  await until(S(29)); await play(...fbox(['144 ÷ (6 − 1)', '= 144 ÷ 5', ['= 28.8', C.amber]], C.violet), ...say('NOW DIVIDE BY 6 − 1 = 5', C.violet));
  await until(S(30)); await play(...fbox(['spread after filling:', ['SD = √28.8 ≈ 5.4 °C', C.amber]], C.green), ...say('SPREAD AFTER ≈ 5.4 °C', C.green));

  // 31 the spread shrank: two bars
  const BL = P ? 0.6 : 0.45, left = BOXP[0] - 6.9 * BL / 2;
  const bar = (v, color, y, label) => {
    const r = new M.Rectangle({ width: v * BL, height: 0.3, color, strokeWidth: 2 }); r.setFill(color, 0.6); r.moveTo([left + v * BL / 2, y, 0]);
    const t = T(label, 17, color, true); t.moveTo([left + t.getWidth() / 2, y + 0.36, 0]); return [r, t];
  };
  const [b1, l1] = bar(6.9, C.violet, BOXP[1] + 0.3, 'before  6.9 °C'), [b2, l2] = bar(5.4, C.green, BOXP[1] - 0.55, 'after   5.4 °C');
  await until(S(31)); await play(...toSlot(new M.VGroup(b1, l1, b2, l2)), ...say('SPREAD SHRANK: 6.9 → 5.4', C.pink));

  // 32-34 nothing real changed
  await until(S(32)); await play(new M.LaggedStart(realDots.map(g => new M.Indicate(g, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }), ...say('NOTHING REAL CHANGED', C.cyan));
  await until(S(32) + 3.0); await play(new M.LaggedStart(fills.map(f => new M.Indicate(f, { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }), ...say('ONLY 2 GUESSES, ON THE MEAN', C.green));
  await until(S(33)); await play(new M.Indicate(b2, { color: C.pink }), ...say('LOOKS CALMER THAN IT IS', C.pink));
  await until(S(34)); await play(...fbox(['readings shown:  6', ['really measured: 4', C.pink]], C.pink), new M.LaggedStart(realDots.map(g => new M.Indicate(g, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.4 }), ...say('ONLY 4 REALLY MEASURED', C.pink));

  // 35-37 summary and use
  await until(S(35)); await play(...fbox(['every gap ← 25', ['(the observed mean)', C.muted]], C.green), new M.LaggedStart(fills.map(f => new M.Indicate(f, { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }), ...say('IN SHORT: GAP ← OBSERVED MEAN', C.green));
  await until(S(36)); await play(...fbox(['mean: 25 → 25   same', ['SD: 6.9 → 5.4   smaller', C.pink]], C.amber), ...say('SAME MEAN, SMALLER SPREAD', C.amber));
  await until(S(37)); await play(...fbox(['quick fix when:', ['gaps are few + random', C.green], ['you need only the mean', C.green]], C.green), ...say('WHAT IS IT FOR?', C.green));

  // 38-40 traps
  await until(S(38)); await play(...clearSlot(), new M.LaggedStart(fills.map(f => new M.Indicate(f, { color: C.pink })), { lagRatio: 0.3, runTime: 1.4 }), ...say('TRAP: FILLED ≠ REAL DATA', C.pink));
  const IW = P ? 4.2 : 3.2;
  const iv = (w, color, y, label) => {
    const xa = BOXP[0] - w / 2, xb = BOXP[0] + w / 2;
    const ln = new M.Line({ start: [xa, y, 0], end: [xb, y, 0], color, strokeWidth: 4 });
    const ca = new M.Line({ start: [xa, y - 0.14, 0], end: [xa, y + 0.14, 0], color, strokeWidth: 4 });
    const cb = new M.Line({ start: [xb, y - 0.14, 0], end: [xb, y + 0.14, 0], color, strokeWidth: 4 });
    const t = T(label, 16, color); t.moveTo([BOXP[0], y + 0.38, 0]);
    return [ln, ca, cb, t];
  };
  const ivs = [...iv(IW, C.violet, BOXP[1] + 0.3, 'what we really know'), ...iv(IW * 5.4 / 6.9, C.pink, BOXP[1] - 0.55, 'what the filled table claims')];
  await until(S(39)); await play(...toSlot(new M.VGroup(...ivs)), ...say('LOOKS NARROWER AND SURER', C.pink));
  await until(S(40)); await play(...fbox(['sensor C, hot day:', 'true mean     30', ['filled mean   25', C.pink]], C.amber), ...say('GAPS NOT RANDOM → MEAN WRONG', C.amber));

  // 41 one sentence
  await until(S(41)); await play(...fbox(['keeps:  mean 25', ['hides:  spread 6.9 → 5.4', C.pink]], C.amber), new M.Indicate(meanLine, { color: C.amber }),
    new M.LaggedStart(segs.map(l => new M.Indicate(l, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }), ...say('KEEPS THE MEAN, HIDES THE SPREAD', C.amber));
}

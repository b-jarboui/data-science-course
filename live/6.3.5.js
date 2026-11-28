// 6.3.5 Posterior prediction: predicting the next batch of 4 parts.
// Beat i = sentence i (0-based, 39 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.2;
  const PILL = P ? [0, 1.85, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box helper: one box on screen at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.37 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.85 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.65 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.5 })];
  }

  // Exact Beta(5, 15) density (peak at 4/18 ≈ 22.2%, height ≈ 4.21)
  const betaPdf = p => (p <= 0 || p >= 1) ? 0 : 58140 * Math.pow(p, 4) * Math.pow(1 - p, 14);

  // Simple arrow built from verified Line primitives
  function makeArrow(from, to, color = C.cyan, sw = 2.6, headLen = 0.17) {
    const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, ang = 0.52;
    const lx = to[0] - headLen * (ux * Math.cos(ang) - uy * Math.sin(ang));
    const ly = to[1] - headLen * (uy * Math.cos(ang) + ux * Math.sin(ang));
    const rx = to[0] - headLen * (ux * Math.cos(-ang) - uy * Math.sin(-ang));
    const ry = to[1] - headLen * (uy * Math.cos(-ang) + ux * Math.sin(-ang));
    return new M.VGroup(
      new M.Line({ start: from, end: to, color, strokeWidth: sw }),
      new M.Line({ start: to, end: [lx, ly, 0], color, strokeWidth: sw }),
      new M.Line({ start: to, end: [rx, ry, 0], color, strokeWidth: sw })
    );
  }

  // Phone-charger icon: state = 'unknown' | 'pass' | 'fail'
  function charger(x, y, state = 'unknown', sc = 1) {
    const w = 0.72 * sc, h = 0.88 * sc;
    const col = state === 'pass' ? C.green : state === 'fail' ? C.pink : C.cyan;
    const p1 = new M.Rectangle({ width: 0.09 * sc, height: 0.16 * sc, color: C.muted, strokeWidth: 1 });
    p1.setFill(C.muted, 0.9); p1.moveTo([x - 0.17 * sc, y + h / 2 + 0.08 * sc, 0]);
    const p2 = new M.Rectangle({ width: 0.09 * sc, height: 0.16 * sc, color: C.muted, strokeWidth: 1 });
    p2.setFill(C.muted, 0.9); p2.moveTo([x + 0.17 * sc, y + h / 2 + 0.08 * sc, 0]);
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.11 * sc, color: col, strokeWidth: 2.2 });
    body.setFill(col, state === 'unknown' ? 0.12 : 0.24); body.moveTo([x, y, 0]);
    const glyph = state === 'pass' ? '✓' : state === 'fail' ? '×' : '?';
    const sym = T(glyph, Math.round(28 * sc), col, false, true); sym.moveTo([x, y, 0]);
    return new M.VGroup(p1, p2, body, sym);
  }

  // Smooth filled Beta(5, 15) hill from 0% to 60% using thin Rectangle strips + top Line segments
  function makeHill(x0, x1, baseY, maxH, color = C.green, showAxis = true) {
    const pMax = 0.60, N = 60, dx = (x1 - x0) / N;
    const p2x = p => x0 + (p / pMax) * (x1 - x0);
    const h2y = p => baseY + (betaPdf(p) / 4.25) * maxH;
    const parts = [];
    for (let i = 0; i < N; i++) {
      const pm = (i + 0.5) / N * pMax;
      const hh = (betaPdf(pm) / 4.25) * maxH;
      if (hh > 0.01) {
        const s = new M.Rectangle({ width: dx * 1.04, height: hh, color, strokeWidth: 1 });
        s.setFill(color, 0.22); s.setStrokeOpacity(0);
        s.moveTo([x0 + (i + 0.5) * dx, baseY + hh / 2, 0]);
        parts.push(s);
      }
    }
    for (let i = 0; i < N; i++) {
      const p0 = i / N * pMax, p1 = (i + 1) / N * pMax;
      parts.push(new M.Line({ start: [p2x(p0), h2y(p0), 0], end: [p2x(p1), h2y(p1), 0], color, strokeWidth: 3.2 }));
    }
    if (showAxis) {
      parts.push(new M.Line({ start: [x0, baseY, 0], end: [x1, baseY, 0], color: C.muted, strokeWidth: 2.2 }));
      const tickVals = [0, 10, 20, 30, 40, 50, 60];
      for (const v of tickVals) {
        const tx = p2x(v / 100);
        parts.push(new M.Line({ start: [tx, baseY - 0.07, 0], end: [tx, baseY + 0.07, 0], color: C.muted, strokeWidth: 1.5 }));
        const lbl = T(v === 60 ? '60%' : String(v), P ? 17 : 16, C.muted, true);
        lbl.moveTo([tx, baseY - 0.30, 0]);
        parts.push(lbl);
      }
      const axLbl = T('failure rate', P ? 17 : 16, C.muted);
      axLbl.moveTo([(x0 + x1) / 2, baseY - 0.62, 0]);
      parts.push(axLbl);
    }
    return { group: new M.VGroup(...parts), p2x, h2y };
  }

  // =========================================================================
  // BEAT 0: From failure rate to real parts
  // =========================================================================
  const H0_X0 = P ? -3.2 : -5.7, H0_X1 = P ? 3.2 : 1.3;
  const H0_BASE = P ? -3.6 : -1.55, H0_H = P ? 4.2 : 2.7;
  const hill0 = makeHill(H0_X0, H0_X1, H0_BASE, H0_H, C.green, true);
  const hill0Tag = T('posterior: Beta(5, 15)', P ? 17 : 18, C.green, true);
  hill0Tag.moveTo([CX, H0_BASE + H0_H + 0.25, 0]);

  await until(S(0));
  await play(
    new M.FadeIn(hill0.group, { runTime: 1.0 }),
    new M.FadeIn(hill0Tag, { runTime: 0.9 }),
    ...say('FROM FAILURE RATE → REAL PARTS', C.green),
    ...fbox(['so far: failure rate', ['now: real parts', C.cyan]])
  );

  // =========================================================================
  // BEATS 1-5: Tomorrow's 4 parts & the plug-in shortcut (25% -> 75%^4 ≈ 32%)
  // =========================================================================
  const PART_Y = P ? -3.0 : -1.35;
  const PART_SP = P ? 1.62 : 1.65;
  const partX = k => CX + (k - 1.5) * PART_SP;
  const partsQ = [0, 1, 2, 3].map(k => charger(partX(k), PART_Y, 'unknown', P ? 1.0 : 1.05));
  const partNums = [0, 1, 2, 3].map(k => {
    const t = T(`part ${k + 1}`, P ? 15 : 16, C.muted, true);
    t.moveTo([partX(k), PART_Y - 0.78, 0]);
    return t;
  });

  await until(S(1));
  await play(
    new M.FadeOut(new M.VGroup(hill0.group, hill0Tag), { runTime: 0.6 }),
    new M.LaggedStart(partsQ.map(p => new M.FadeIn(p)), { lagRatio: 0.14, runTime: 1.1 }),
    new M.FadeIn(new M.VGroup(...partNums), { runTime: 0.9 }),
    ...say('TOMORROW: 4 PARTS — ALL PASS?', C.amber),
    ...fbox(['tomorrow: 4 parts', ['chance all 4 pass = ?', C.amber]], C.amber)
  );

  // Beat 2: Pretend one best rate = 25%
  const RLINE_Y = P ? -0.2 : 0.72;
  const RL_X0 = P ? -3.1 : -5.4, RL_X1 = P ? 3.1 : 1.0;
  const rp2x = p => RL_X0 + (p / 0.60) * (RL_X1 - RL_X0);
  const rLine = new M.Line({ start: [RL_X0, RLINE_Y, 0], end: [RL_X1, RLINE_Y, 0], color: C.muted, strokeWidth: 2.4 });
  const rTicks = [0, 20, 40, 60].map(v => new M.VGroup(
    new M.Line({ start: [rp2x(v / 100), RLINE_Y - 0.07, 0], end: [rp2x(v / 100), RLINE_Y + 0.07, 0], color: C.muted }),
    T(`${v}%`, P ? 17 : 15, C.muted, true).moveTo([rp2x(v / 100), RLINE_Y - 0.32, 0])
  ));
  const pinPt = [rp2x(0.25), RLINE_Y, 0];
  const pinHalo = new M.Dot({ point: pinPt, radius: 0.24, color: C.amber }); pinHalo.setFill(C.amber, 0.22);
  const pinDot = new M.Dot({ point: pinPt, radius: 0.11, color: C.amber });
  const pinLbl = T('25%', P ? 18 : 19, C.amber, true, true); pinLbl.moveTo([pinPt[0], RLINE_Y + 0.36, 0]);

  await until(S(2));
  await play(
    new M.Create(rLine, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...rTicks), { runTime: 0.7 }),
    new M.FadeIn(pinHalo, { runTime: 0.7 }),
    new M.FadeIn(pinDot, { runTime: 0.7 }),
    new M.FadeIn(pinLbl, { runTime: 0.7 }),
    new M.Flash(pinDot, { color: C.amber, runTime: 0.8 }),
    ...say('EASY WAY: ASSUME RATE = 25%', C.amber),
    ...fbox(['best single rate = 25%', ['pretend it is exact', C.muted]], C.amber)
  );

  // Beat 3: Each part passes with 75%
  const partsPass = [0, 1, 2, 3].map(k => charger(partX(k), PART_Y, 'pass', P ? 1.0 : 1.05));
  const p75Tags = [0, 1, 2, 3].map(k => {
    const t = T('75%', P ? 18 : 20, C.green, true, true);
    t.moveTo([partX(k), PART_Y + 0.88, 0]);
    return t;
  });

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...partsQ), { runTime: 0.45 }),
    new M.LaggedStart(partsPass.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.LaggedStart(p75Tags.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('EACH PART PASSES: 75%', C.green),
    ...fbox(['fail rate  = 25%', ['pass chance = 75%', C.green]], C.green)
  );

  // Beat 4: 0.75 × 0.75 × 0.75 × 0.75 ≈ 32%
  const timesSigns = [0, 1, 2].map(k => {
    const t = T('×', P ? 20 : 22, C.amber, true, true);
    t.moveTo([(partX(k) + partX(k + 1)) / 2, PART_Y + 0.88, 0]);
    return t;
  });

  await until(S(4));
  await play(
    new M.LaggedStart(timesSigns.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.0 }),
    new M.LaggedStart(partsPass.map(p => new M.Indicate(p, { color: C.amber })), { lagRatio: 0.18, runTime: 1.6 }),
    ...say('0.75 × 0.75 × 0.75 × 0.75 ≈ 32%', C.amber),
    ...fbox(['all 4 pass (plug-in):', '0.75 × 0.75 × 0.75 × 0.75', ['= 0.316 ≈ 32%', C.amber]], C.amber)
  );

  // Beat 5: Plug-in prediction forgets the doubt
  const pinRing = new M.Circle({ radius: 0.34, color: C.pink, strokeWidth: 2.5 });
  pinRing.moveTo(pinPt);

  await until(S(5));
  await play(
    new M.Create(pinRing, { runTime: 0.7 }),
    new M.Indicate(pinDot, { color: C.pink, runTime: 0.9 }),
    ...say('PLUG-IN PREDICTION: FORGETS DOUBT', C.pink),
    ...fbox(['plug-in prediction:', 'uses 25% only', ['ignores all doubt', C.pink]], C.pink)
  );

  // =========================================================================
  // BEATS 6-13: Posterior hill as a crowd of 1,000 people + imagined batches
  // =========================================================================
  const HILL_X0 = P ? -3.2 : -5.7, HILL_X1 = P ? 3.2 : 1.3;
  const HILL_BASE = P ? -2.2 : -0.55, HILL_H = P ? 3.0 : 1.92;
  const hill = makeHill(HILL_X0, HILL_X1, HILL_BASE, HILL_H, C.green, true);
  const x25 = hill.p2x(0.25);
  const dash25 = new M.DashedLine({ start: [x25, HILL_BASE, 0], end: [x25, hill.h2y(0.25) + 0.12, 0], color: C.amber, strokeWidth: 2.2 });
  const lbl25 = T('25%', P ? 17 : 16, C.amber, true, true); lbl25.moveTo([x25, HILL_BASE + HILL_H + 0.16, 0]);
  const arrLow = makeArrow([x25 - 0.18, HILL_BASE + HILL_H * 0.58, 0], [hill.p2x(0.11), HILL_BASE + HILL_H * 0.58, 0], C.cyan, 2.4);
  const arrHi = makeArrow([x25 + 0.18, HILL_BASE + HILL_H * 0.58, 0], [hill.p2x(0.42), HILL_BASE + HILL_H * 0.58, 0], C.pink, 2.4);
  const txtLow = T('lower', P ? 17 : 15, C.cyan, true); txtLow.moveTo([hill.p2x(0.14), HILL_BASE + HILL_H * 0.74, 0]);
  const txtHi = T('higher', P ? 17 : 15, C.pink, true); txtHi.moveTo([hill.p2x(0.37), HILL_BASE + HILL_H * 0.74, 0]);

  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(rLine, ...rTicks, pinHalo, pinDot, pinLbl, pinRing, ...partsPass, ...partNums, ...p75Tags, ...timesSigns), { runTime: 0.6 }),
    new M.FadeIn(hill.group, { runTime: 0.9 }),
    new M.Create(dash25, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(lbl25, arrLow, arrHi, txtLow, txtHi), { runTime: 0.9 }),
    ...say('THE RATE COULD BE LOWER OR HIGHER', C.green),
    ...fbox(['posterior: Beta(5, 15)', 'mean = 25%', ['real rate may differ', C.green]], C.green)
  );

  // Beat 7: Let's see what that doubt does (short: 1.82s)
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(arrLow, arrHi, txtLow, txtHi, dash25, lbl25), { runTime: 0.6 }),
    ...say('WHAT DOES THAT DOUBT DO?', C.cyan)
  );

  // Beat 8: Crowd of 1,000 people standing under the green hill
  const crowdDots = [];
  const tallDots = [];
  let dot10 = null, dot25 = null, dot45 = null;
  const colRates = [];
  for (let i = 3; i <= 20; i++) colRates.push(i * 0.025); // 7.5% to 50% in 2.5% steps
  const dotStepY = HILL_H / 9.9;
  for (const p of colRates) {
    const nCol = Math.max(p >= 0.075 && p <= 0.50 ? 1 : 0, Math.round((betaPdf(p) / 4.25) * 9));
    const cx = hill.p2x(p);
    for (let j = 0; j < nCol; j++) {
      const cy = HILL_BASE + (j + 0.55) * dotStepY;
      const d = new M.Dot({ point: [cx, cy, 0], radius: P ? 0.068 : 0.072, color: C.green });
      d.setFill(C.green, 0.92);
      crowdDots.push(d);
      if (p >= 0.19 && p <= 0.31) tallDots.push(d);
      if (Math.abs(p - 0.10) < 0.005 && j === nCol - 1) dot10 = d;
      if (Math.abs(p - 0.25) < 0.005 && j === nCol - 1) dot25 = d;
      if (Math.abs(p - 0.45) < 0.005 && j === nCol - 1) dot45 = d;
    }
  }

  await until(S(8));
  await play(
    new M.LaggedStart(crowdDots.map(d => new M.FadeIn(d)), { lagRatio: 0.015, runTime: 1.8 }),
    ...say('CROWD OF 1,000 POSSIBLE RATES', C.green),
    ...fbox(['picture 1,000 people', ['each holds 1 rate', C.green]], C.green)
  );

  // Beat 9: More people where the green hill is tall, fewer where low
  await until(S(9));
  await play(
    new M.LaggedStart(tallDots.filter((_, idx) => idx % 3 === 0).map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.05, runTime: 1.5 }),
    ...say('TALL HILL = MORE PEOPLE', C.green)
  );

  // Beat 10: Most stand near 20-30%, few near 10%, few near 45%
  const midW = hill.p2x(0.31) - hill.p2x(0.19);
  const midBox = new M.RoundedRectangle({ width: midW, height: HILL_H + 0.12, cornerRadius: 0.12, color: C.green, strokeWidth: 2 });
  midBox.setFill(C.green, 0.08); midBox.moveTo([hill.p2x(0.25), HILL_BASE + HILL_H / 2 + 0.04, 0]);
  const midLbl = T('most: 20–30%', P ? 17 : 15, C.green, true, true);
  midLbl.moveTo([hill.p2x(0.25), HILL_BASE + HILL_H + 0.24, 0]);
  const ring10 = new M.Circle({ radius: 0.18, color: C.cyan, strokeWidth: 2.4 }); ring10.moveTo(dot10.getCenter());
  const lbl10 = T('10%', P ? 18 : 16, C.cyan, true, true); lbl10.moveTo([hill.p2x(0.10) - 0.15, dot10.getCenter()[1] + 0.34, 0]);
  const ring45 = new M.Circle({ radius: 0.18, color: C.pink, strokeWidth: 2.4 }); ring45.moveTo(dot45.getCenter());
  const lbl45 = T('45%', P ? 18 : 16, C.pink, true, true); lbl45.moveTo([hill.p2x(0.45) + 0.1, dot45.getCenter()[1] + 0.36, 0]);

  await until(S(10));
  await play(
    new M.Create(midBox, { runTime: 0.7 }),
    new M.FadeIn(midLbl, { runTime: 0.6 }),
    new M.Create(ring10, { runTime: 0.6 }),
    new M.FadeIn(lbl10, { runTime: 0.6 }),
    new M.Create(ring45, { runTime: 0.6 }),
    new M.FadeIn(lbl45, { runTime: 0.6 }),
    ...say('MOST: 20–30% · FEW: 10% OR 45%', C.cyan),
    ...fbox(['most crowd: 20% – 30%', ['a few near: 10%', C.cyan], ['a few near: 45%', C.pink]])
  );

  // Beat 11: Each person imagines tomorrow's batch of 4
  const BATCH_Y = P ? -4.75 : -2.02;
  const B_SP = P ? 1.25 : 1.15;
  const bx = k => CX + (k - 1.5) * B_SP;
  const bScale = P ? 0.84 : 0.76;
  const batchQ = [0, 1, 2, 3].map(k => charger(bx(k), BATCH_Y, 'unknown', bScale));
  const arr25 = makeArrow([hill.p2x(0.25), HILL_BASE - 0.76, 0], [CX, BATCH_Y + 0.62, 0], C.green, 2.2);
  const bCap11 = T('imagined batch of 4', P ? 17 : 15, C.muted, true);
  bCap11.moveTo([CX, BATCH_Y - 0.66, 0]);

  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(midBox, midLbl), { runTime: 0.45 }),
    new M.FadeIn(arr25, { runTime: 0.6 }),
    new M.LaggedStart(batchQ.map(p => new M.FadeIn(p)), { lagRatio: 0.1, runTime: 0.8 }),
    new M.FadeIn(bCap11, { runTime: 0.6 }),
    ...say('EACH PERSON IMAGINES 4 PARTS', C.cyan),
    ...fbox(['for every person:', 'imagine 4 parts', ['using their own rate', C.cyan]])
  );

  // Beat 12: Person at 10% usually sees all 4 pass
  const batch10 = [0, 1, 2, 3].map(k => charger(bx(k), BATCH_Y, 'pass', bScale));
  const arr10 = makeArrow([hill.p2x(0.10), HILL_BASE - 0.76, 0], [bx(1), BATCH_Y + 0.62, 0], C.cyan, 2.4);
  const bCap12 = T('rate 10%  →  all 4 pass', P ? 18 : 16, C.green, true, true);
  bCap12.moveTo([CX, BATCH_Y - 0.66, 0]);

  await until(S(12));
  await play(
    new M.Flash(dot10, { color: C.cyan, runTime: 0.7 }),
    new M.FadeOut(new M.VGroup(arr25, ...batchQ, bCap11), { runTime: 0.4 }),
    new M.FadeIn(arr10, { runTime: 0.55 }),
    new M.LaggedStart(batch10.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 0.75 }),
    new M.FadeIn(bCap12, { runTime: 0.55 }),
    ...say('AT 10%: USUALLY ALL 4 PASS', C.green),
    ...fbox(['person at 10%:', ['✓ ✓ ✓ ✓  (0 fail)', C.green], ['usually all 4 pass', C.muted]], C.green)
  );

  // Beat 13: Person at 45% often sees 2+ failures
  const batch45 = ['fail', 'pass', 'fail', 'pass'].map((st, k) => charger(bx(k), BATCH_Y, st, bScale));
  const arr45 = makeArrow([hill.p2x(0.45), HILL_BASE - 0.76, 0], [bx(2), BATCH_Y + 0.62, 0], C.pink, 2.4);
  const bCap13 = T('rate 45%  →  often 2+ fail', P ? 18 : 16, C.pink, true, true);
  bCap13.moveTo([CX, BATCH_Y - 0.66, 0]);

  await until(S(13));
  await play(
    new M.Flash(dot45, { color: C.pink, runTime: 0.7 }),
    new M.FadeOut(new M.VGroup(arr10, ...batch10, bCap12), { runTime: 0.4 }),
    new M.FadeIn(arr45, { runTime: 0.55 }),
    new M.LaggedStart(batch45.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 0.75 }),
    new M.FadeIn(bCap13, { runTime: 0.55 }),
    ...say('AT 45%: OFTEN 2+ FAILURES', C.pink),
    ...fbox(['person at 45%:', ['× ✓ × ✓  (2+ fail)', C.pink], ['often 2 or more fail', C.muted]], C.pink)
  );

  // =========================================================================
  // BEATS 14-25: Pool & count -> Posterior predictive bars vs Plug-in bars
  // =========================================================================
  const BAR_X0 = P ? -2.95 : -5.3, BAR_X1 = P ? 3.25 : 1.15;
  const BAR_BASE = P ? -4.9 : -2.15, BAR_H = P ? 5.3 : 3.0;
  const binW = (BAR_X1 - BAR_X0) / 4;
  const binCX = i => BAR_X0 + (i + 0.5) * binW;
  const pctY = pct => BAR_BASE + (pct / 50) * BAR_H;
  const barW = binW * 0.34;
  const predX = i => binCX(i) - barW * 0.56;
  const plugX = i => binCX(i) + barW * 0.56;

  // Chart axes & gridlines (0% to 50%)
  const chartParts = [
    new M.Line({ start: [BAR_X0, BAR_BASE, 0], end: [BAR_X1, BAR_BASE, 0], color: C.muted, strokeWidth: 2.2 })
  ];
  for (const g of [10, 20, 30, 40]) {
    const gy = pctY(g);
    const gl = new M.Line({ start: [BAR_X0, gy, 0], end: [BAR_X1, gy, 0], color: C.line, strokeWidth: 1.2 });
    gl.setStrokeOpacity(0.55);
    const gt = T(`${g}%`, P ? 15 : 14, C.muted, true);
    gt.moveTo([BAR_X0 - 0.38, gy, 0]);
    chartParts.push(gl, gt);
  }
  const catNames = ['0 fail', '1 fail', '2 fail', '3+ fail'];
  catNames.forEach((name, i) => {
    const t = T(name, P ? 17 : 17, C.ink, true, true);
    t.moveTo([binCX(i), BAR_BASE - 0.30, 0]);
    chartParts.push(t);
  });
  const allPassSub = T('(all pass)', P ? 15 : 14, C.green);
  allPassSub.moveTo([binCX(0), BAR_BASE - 0.60, 0]);
  chartParts.push(allPassSub);
  const chartAxes = new M.VGroup(...chartParts);

  const trialCounts = [8, 9, 5, 2]; // 24 dots matching 35/38/20/7 proportions
  const trialDots = [];
  trialCounts.forEach((cnt, bin) => {
    for (let j = 0; j < cnt; j++) {
      const col = j % 2, row = Math.floor(j / 2);
      const tx = predX(bin) + (col - 0.5) * (P ? 0.26 : 0.22);
      const ty = BAR_BASE + 0.22 + row * (P ? 0.32 : 0.26);
      const d = new M.Dot({ point: [tx, ty, 0], radius: P ? 0.11 : 0.085, color: C.violet });
      d.setFill(C.violet, 0.9);
      trialDots.push(d);
    }
  });

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(hill.group, ...crowdDots, ring10, lbl10, ring45, lbl45, arr45, ...batch45, bCap13), { runTime: 0.6 }),
    new M.FadeIn(chartAxes, { runTime: 0.75 }),
    new M.LaggedStart(trialDots.map(d => new M.FadeIn(d, { shift: [0, -0.5, 0] })), { lagRatio: 0.05, runTime: 1.8 }),
    ...say('POOL ALL 1,000 BATCHES & COUNT', C.cyan),
    ...fbox(['1,000 imagined batches', ['count failures in each', C.cyan]])
  );

  // Beat 15: Simulation — many random trials falling into the 4 bins

  await until(S(15));
  await play(
    new M.LaggedStart(trialDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.04, runTime: 1.6 }),
    ...say('SIMULATION: MANY TRIALS, THEN COUNT', C.violet),
    ...fbox(['simulation (unit 5):', '1. pick rate from hill', '2. run random batch', ['3. count outcomes', C.violet]], C.violet)
  );

  // Helper to build a single bar + label
  function makeBar(cx, pct, color) {
    const h = Math.max(0.06, (pct / 50) * BAR_H);
    const r = new M.Rectangle({ width: barW, height: h, color, strokeWidth: 2 });
    r.setFill(color, 0.80); r.moveTo([cx, BAR_BASE + h / 2, 0]);
    const lbl = T(`${pct}%`, P ? 18 : 17, color, true, true);
    lbl.moveTo([cx, BAR_BASE + h + 0.24, 0]);
    return { r, lbl };
  }

  const PRED = [35, 38, 20, 7];
  const PLUG = [32, 42, 21, 5];
  const predBars = PRED.map((v, i) => makeBar(predX(i), v, C.cyan));
  const plugBars = PLUG.map((v, i) => makeBar(plugX(i), v, C.amber));

  // Beat 16: All four pass ≈ 35%
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(...trialDots), { runTime: 0.45 }),
    new M.FadeIn(predBars[0].r, { shift: [0, 0.2, 0], runTime: 0.75 }),
    new M.FadeIn(predBars[0].lbl, { runTime: 0.7 }),
    ...say('ALL 4 PASS: 35%', C.cyan),
    ...fbox(['posterior predictive:', ['0 fail (all pass): 35%', C.cyan]])
  );

  // Beat 17: Exactly 1 failure ≈ 38%
  await until(S(17));
  await play(
    new M.FadeIn(predBars[1].r, { shift: [0, 0.2, 0], runTime: 0.7 }),
    new M.FadeIn(predBars[1].lbl, { runTime: 0.65 }),
    ...say('EXACTLY 1 FAILURE: 38%', C.cyan),
    ...fbox(['posterior predictive:', '0 fail: 35%', ['1 fail: 38%', C.cyan]])
  );

  // Beat 18: Exactly 2 ≈ 20%
  await until(S(18));
  await play(
    new M.FadeIn(predBars[2].r, { shift: [0, 0.2, 0], runTime: 0.65 }),
    new M.FadeIn(predBars[2].lbl, { runTime: 0.6 }),
    ...say('EXACTLY 2 FAILURES: 20%', C.cyan),
    ...fbox(['posterior predictive:', '0 fail: 35%   1 fail: 38%', ['2 fail: 20%', C.cyan]])
  );

  // Beat 19: Three or more ≈ 7%
  await until(S(19));
  await play(
    new M.FadeIn(predBars[3].r, { shift: [0, 0.2, 0], runTime: 0.65 }),
    new M.FadeIn(predBars[3].lbl, { runTime: 0.6 }),
    ...say('3 OR MORE FAILURES: 7%', C.cyan),
    ...fbox(['posterior predictive:', '0 fail: 35%   1 fail: 38%', ['2 fail: 20%   3+ fail: 7%', C.cyan]])
  );

  // Beat 20: Put these next to plug-in answers (short: 2.44s)
  const legY = BAR_BASE + BAR_H + (P ? 0.35 : 0.22);
  const sw1 = new M.Rectangle({ width: 0.24, height: 0.16, color: C.cyan, strokeWidth: 1 });
  sw1.setFill(C.cyan, 0.85); sw1.moveTo([CX - 2.1, legY, 0]);
  const lt1 = T('predictive', P ? 15 : 16, C.cyan, true); lt1.moveTo([CX - 1.15, legY, 0]);
  const sw2 = new M.Rectangle({ width: 0.24, height: 0.16, color: C.amber, strokeWidth: 1 });
  sw2.setFill(C.amber, 0.85); sw2.moveTo([CX + 0.55, legY, 0]);
  const lt2 = T('plug-in (25%)', P ? 15 : 16, C.amber, true); lt2.moveTo([CX + 1.65, legY, 0]);
  const legend = new M.VGroup(sw1, lt1, sw2, lt2);

  await until(S(20));
  await play(
    new M.LaggedStart(plugBars.flatMap(b => [new M.FadeIn(b.r, { shift: [0, 0.15, 0] }), new M.FadeIn(b.lbl)]), { lagRatio: 0.08, runTime: 1.0 }),
    new M.FadeIn(legend, { runTime: 0.7 }),
    ...say('PREDICTIVE vs PLUG-IN', C.amber)
  );

  // Beat 21: All four pass: 35% vs 32%
  const hi0 = new M.RoundedRectangle({ width: binW * 0.92, height: (39 / 50) * BAR_H + 0.55, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2.2 });
  hi0.moveTo([binCX(0), BAR_BASE + ((39 / 50) * BAR_H + 0.55) / 2 - 0.04, 0]);

  await until(S(21));
  await play(
    new M.Create(hi0, { runTime: 0.65 }),
    new M.Indicate(predBars[0].lbl, { color: C.green, runTime: 0.9 }),
    ...say('ALL 4 PASS: 35% vs 32%', C.cyan),
    ...fbox(['all 4 pass (0 fail):', ['predictive: 35%', C.cyan], ['plug-in:    32%', C.amber], ['+3 points higher', C.green]])
  );

  // Beat 22: Three or more failures: 7% vs 5%
  const hi3 = new M.RoundedRectangle({ width: binW * 0.92, height: (13 / 50) * BAR_H + 0.55, cornerRadius: 0.12, color: C.pink, strokeWidth: 2.2 });
  hi3.moveTo([binCX(3), BAR_BASE + ((13 / 50) * BAR_H + 0.55) / 2 - 0.04, 0]);

  await until(S(22));
  await play(
    new M.FadeOut(hi0, { runTime: 0.4 }),
    new M.Create(hi3, { runTime: 0.65 }),
    new M.Indicate(predBars[3].lbl, { color: C.pink, runTime: 0.9 }),
    ...say('3+ FAILURES: 7% vs 5%', C.pink),
    ...fbox(['3 or more failures:', ['predictive: 7%', C.cyan], ['plug-in:    5%', C.amber], ['+2 points higher', C.pink]], C.pink)
  );

  // Beat 23: Both ends have grown — more spread out because of doubt
  const hi0b = new M.RoundedRectangle({ width: binW * 0.92, height: (39 / 50) * BAR_H + 0.55, cornerRadius: 0.12, color: C.violet, strokeWidth: 2.2 });
  hi0b.moveTo([binCX(0), BAR_BASE + ((39 / 50) * BAR_H + 0.55) / 2 - 0.04, 0]);
  const widL = makeArrow([binCX(1) - 0.2, pctY(46), 0], [binCX(0) - 0.2, pctY(46), 0], C.violet, 2.5);
  const widR = makeArrow([binCX(2) + 0.2, pctY(46), 0], [binCX(3) + 0.2, pctY(46), 0], C.violet, 2.5);
  const widTxt = T('wider spread', P ? 15 : 16, C.violet, true, true);
  widTxt.moveTo([CX, pctY(46), 0]);

  await until(S(23));
  await play(
    new M.Create(hi0b, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(widL, widR, widTxt), { runTime: 0.7 }),
    ...say('BOTH ENDS GREW: CARRIES DOUBT', C.violet),
    ...fbox(['both ends grew:', '0 fail:  32% → 35%', '3+ fail:  5% → 7%', ['wider = keeps doubt', C.violet]], C.violet)
  );

  // Beat 24: Name it — Posterior predictive distribution
  const distFrame = new M.RoundedRectangle({ width: (BAR_X1 - BAR_X0) + 0.25, height: BAR_H + 0.85, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2.2 });
  distFrame.moveTo([(BAR_X0 + BAR_X1) / 2, BAR_BASE + BAR_H / 2 - 0.12, 0]);

  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(hi3, hi0b, widL, widR, widTxt, legend, ...plugBars.flatMap(b => [b.r, b.lbl])), { runTime: 0.55 }),
    new M.Create(distFrame, { runTime: 0.75 }),
    ...say('POSTERIOR PREDICTIVE DISTRIBUTION', C.cyan),
    ...fbox(['posterior predictive', '= distribution of', ['  future data', C.cyan]])
  );

  // Beat 25: Answers what data we should expect next
  await until(S(25));
  await play(
    new M.LaggedStart(predBars.map(b => new M.Indicate(b.r, { color: C.green })), { lagRatio: 0.14, runTime: 1.4 }),
    ...say('WHAT DATA SHOULD WE EXPECT NEXT?', C.green)
  );

  // =========================================================================
  // BEAT 26: One single next part -> posterior mean = 25%
  // =========================================================================
  const sPart = charger(P ? 0 : CX - 2.2, P ? -0.55 : -0.55, 'unknown', P ? 1.35 : 1.35);
  const sPartLbl = T('next 1 part', P ? 17 : 18, C.ink, true, true);
  sPartLbl.moveTo([P ? 0 : CX - 2.2, P ? -1.55 : -1.55, 0]);
  const sBarX0 = P ? -2.2 : CX - 0.55;
  const sBarMaxW = P ? 4.4 : 3.5;
  const sFailY = P ? -2.45 : -0.10, sPassY = P ? -3.45 : -1.05;
  const sFailBar = new M.Rectangle({ width: sBarMaxW * 0.25, height: 0.46, color: C.pink, strokeWidth: 2 });
  sFailBar.setFill(C.pink, 0.82); sFailBar.moveTo([sBarX0 + sBarMaxW * 0.125, sFailY, 0]);
  const sFailLbl = T('fail: 25%', P ? 18 : 19, C.pink, true, true);
  sFailLbl.moveTo([sBarX0 + sBarMaxW * 0.25 + 1.05, sFailY, 0]);
  const sPassBar = new M.Rectangle({ width: sBarMaxW * 0.75, height: 0.46, color: C.green, strokeWidth: 2 });
  sPassBar.setFill(C.green, 0.75); sPassBar.moveTo([sBarX0 + sBarMaxW * 0.375, sPassY, 0]);
  const sPassLbl = T('pass: 75%', P ? 18 : 19, C.green, true, true);
  sPassLbl.moveTo([sBarX0 + sBarMaxW * 0.75 + (P ? 0.0 : 0.0), sPassY - (P ? 0.52 : 0.52), 0]);
  if (!P) sPassLbl.moveTo([sBarX0 + sBarMaxW * 0.375, sPassY - 0.50, 0]);
  else sPassLbl.moveTo([sBarX0 + sBarMaxW * 0.375, sPassY - 0.50, 0]);
  const singleGrp = new M.VGroup(sPart, sPartLbl, sFailBar, sFailLbl, sPassBar, sPassLbl);

  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(chartAxes, distFrame, ...predBars.flatMap(b => [b.r, b.lbl])), { runTime: 0.55 }),
    new M.FadeIn(singleGrp, { runTime: 0.9 }),
    ...say('NEXT SINGLE PART FAILS: 25%', C.amber),
    ...fbox(['1 single next part:', ['P(fail) = posterior mean', C.amber], ['        = 25%', C.pink]], C.amber)
  );

  // =========================================================================
  // BEATS 27-29: The short version in words & weighted vote
  // =========================================================================
  await until(S(27));
  await play(
    new M.FadeOut(singleGrp, { runTime: 0.5 }),
    ...say('THE SHORT VERSION IN WORDS', C.cyan),
    ...fbox(['posterior prediction', ['in plain words:', C.cyan]])
  );

  function stepCard(x, y, w, h, lines, color) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, 0.94); r.moveTo([x, y, 0]);
    const ts = lines.map((s, i) => {
      const t = T(s, P ? 17 : 17, i === 0 ? color : C.ink, true, i === 0);
      t.moveTo([x, y + ((lines.length - 1) / 2 - i) * 0.34, 0]);
      return t;
    });
    return new M.VGroup(r, ...ts);
  }

  let flowCards, flowArrows;
  if (P) {
    flowCards = [
      stepCard(0, 0.35, 5.4, 0.95, ['1. EACH PLAUSIBLE RATE', '10%, 20%, 25%, 30%, 45%'], C.green),
      stepCard(0, -1.15, 5.4, 0.95, ['2. CHANCE UNDER IT', 'predict batch for that rate'], C.cyan),
      stepCard(0, -2.65, 5.4, 0.95, ['3. WEIGHTED AVERAGE', 'over the posterior hill'], C.amber)
    ];
    flowArrows = [
      makeArrow([0, -0.18, 0], [0, -0.62, 0], C.muted, 2.4),
      makeArrow([0, -1.68, 0], [0, -2.12, 0], C.muted, 2.4)
    ];
  } else {
    const cw = 2.25, ch = 1.15, fy = 0.25;
    flowCards = [
      stepCard(CX - 2.65, fy, cw, ch, ['1. EACH RATE', '10% … 45%'], C.green),
      stepCard(CX, fy, cw, ch, ['2. ITS CHANCE', 'for next batch'], C.cyan),
      stepCard(CX + 2.65, fy, cw, ch, ['3. AVERAGE', 'by posterior'], C.amber)
    ];
    flowArrows = [
      makeArrow([CX - 1.48, fy, 0], [CX - 1.17, fy, 0], C.muted, 2.4),
      makeArrow([CX + 1.17, fy, 0], [CX + 1.48, fy, 0], C.muted, 2.4)
    ];
  }

  await until(S(28));
  await play(
    new M.LaggedStart([
      new M.FadeIn(flowCards[0]),
      new M.FadeIn(flowArrows[0]),
      new M.FadeIn(flowCards[1]),
      new M.FadeIn(flowArrows[1]),
      new M.FadeIn(flowCards[2])
    ], { lagRatio: 0.22, runTime: 1.6 }),
    ...say('AVERAGE OVER EVERY PLAUSIBLE RATE', C.green),
    ...fbox(['P(future result) =', '  chance under each rate', ['  averaged over posterior', C.green]], C.green)
  );

  // Beat 29: Weighted vote where more believable rates get more say
  const voteY = P ? -4.75 : -2.15;
  const voteSpecs = [
    { lbl: '10%', h: 0.35, col: C.cyan, dx: -1.8 },
    { lbl: '25%', h: 1.05, col: C.green, dx: 0 },
    { lbl: '45%', h: 0.22, col: C.pink, dx: 1.8 }
  ];
  const voteParts = [];
  for (const v of voteSpecs) {
    const vx = CX + v.dx;
    const r = new M.Rectangle({ width: 0.72, height: v.h, color: v.col, strokeWidth: 2 });
    r.setFill(v.col, 0.78); r.moveTo([vx, voteY + v.h / 2, 0]);
    const t = T(v.lbl, P ? 15 : 16, v.col, true, true); t.moveTo([vx, voteY - 0.28, 0]);
    voteParts.push(r, t);
  }
  const voteNote = T('bigger hill = bigger vote', P ? 15 : 16, C.amber, true);
  voteNote.moveTo([CX, voteY + 1.32, 0]);
  const voteGrp = new M.VGroup(...voteParts, voteNote);

  await until(S(29));
  await play(
    new M.FadeIn(voteGrp, { runTime: 0.9 }),
    ...say('MORE BELIEVABLE RATES GET MORE SAY', C.amber),
    ...fbox(['everyday version:', 'ask every plausible rate', ['take a weighted vote', C.amber]], C.amber)
  );

  // =========================================================================
  // BEATS 30-33: Why this matters — real parts, spares, returns, bad days
  // =========================================================================
  const shopY = P ? -0.75 : 0.25;
  const shopParts = ['pass', 'fail', 'pass', 'fail'].map((st, k) => charger(CX + (k - 1.5) * 1.45, shopY, st, P ? 0.95 : 0.95));
  const shopLine = new M.Line({ start: [CX - 3.0, shopY - 0.65, 0], end: [CX + 3.0, shopY - 0.65, 0], color: C.muted, strokeWidth: 2 });

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(...flowCards, ...flowArrows, voteGrp), { runTime: 0.55 }),
    new M.Create(shopLine, { runTime: 0.55 }),
    new M.LaggedStart(shopParts.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('PLANS ARE FOR REAL PARTS', C.amber),
    ...fbox(['why it matters:', ['plans are for real parts', C.cyan], ['not abstract rates', C.muted]])
  );

  // Beat 31: Spares & returns
  const badge1 = stepCard(P ? 0 : CX - 1.85, P ? -2.35 : -1.55, P ? 5.2 : 3.2, 0.92, ['SPARE PARTS', 'how many to keep?'], C.cyan);
  const badge2 = stepCard(P ? 0 : CX + 1.85, P ? -3.65 : -1.55, P ? 5.2 : 3.2, 0.92, ['RETURNS', 'how many to expect?'], C.pink);

  await until(S(31));
  await play(
    new M.FadeIn(badge1, { runTime: 0.7 }),
    new M.FadeIn(badge2, { runTime: 0.7 }),
    ...say('SPARES & RETURNS NEED COUNTS', C.cyan)
  );

  // Beat 32: Bad-day zoom — predictive 7% vs plug-in 5%
  const Z_BASE = P ? -3.85 : -2.15, Z_H = P ? 3.8 : 2.75; // 10% scale
  const zPredH = (7 / 10) * Z_H, zPlugH = (5 / 10) * Z_H;
  const zPredX = CX - 1.15, zPlugX = CX + 1.15;
  const zAxis = new M.Line({ start: [CX - 2.6, Z_BASE, 0], end: [CX + 2.6, Z_BASE, 0], color: C.muted, strokeWidth: 2.2 });
  const zPredBar = new M.Rectangle({ width: 1.25, height: zPredH, color: C.cyan, strokeWidth: 2.2 });
  zPredBar.setFill(C.cyan, 0.82); zPredBar.moveTo([zPredX, Z_BASE + zPredH / 2, 0]);
  const zPredVal = T('7%', P ? 22 : 24, C.cyan, true, true); zPredVal.moveTo([zPredX, Z_BASE + zPredH + 0.30, 0]);
  const zPredSub = T('predictive', P ? 15 : 16, C.cyan, true); zPredSub.moveTo([zPredX, Z_BASE - 0.32, 0]);
  const zPlugBar = new M.Rectangle({ width: 1.25, height: zPlugH, color: C.amber, strokeWidth: 2.2 });
  zPlugBar.setFill(C.amber, 0.80); zPlugBar.moveTo([zPlugX, Z_BASE + zPlugH / 2, 0]);
  const zPlugVal = T('5%', P ? 22 : 24, C.amber, true, true); zPlugVal.moveTo([zPlugX, Z_BASE + zPlugH + 0.30, 0]);
  const zPlugSub = T('plug-in', P ? 15 : 16, C.amber, true); zPlugSub.moveTo([zPlugX, Z_BASE - 0.32, 0]);
  const zTitle = T('bad day: 3 or more failures', P ? 17 : 18, C.pink, true, true);
  zTitle.moveTo([CX, Z_BASE + Z_H + 0.15, 0]);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(...shopParts, shopLine, badge1, badge2), { runTime: 0.5 }),
    new M.Create(zAxis, { runTime: 0.5 }),
    new M.FadeIn(zTitle, { runTime: 0.6 }),
    new M.FadeIn(zPredBar, { shift: [0, 0.2, 0], runTime: 0.75 }),
    new M.FadeIn(new M.VGroup(zPredVal, zPredSub), { runTime: 0.65 }),
    ...say('PREDICTIVE PREPARES FOR BAD DAYS (7%)', C.cyan),
    ...fbox(['bad day (3+ fail):', ['predictive: 7%', C.cyan], ['plan for bad days too', C.green]])
  );

  // Beat 33: Plug-in makes bad days look rarer (5% vs 7%)
  const zDash = new M.DashedLine({ start: [zPredX + 0.65, Z_BASE + zPredH, 0], end: [zPlugX + 0.65, Z_BASE + zPredH, 0], color: C.pink, strokeWidth: 2 });
  const zGap = T('looks rarer!', P ? 15 : 16, C.pink, true, true);
  zGap.moveTo([zPlugX, Z_BASE + zPredH + 0.26, 0]);

  await until(S(33));
  await play(
    new M.FadeIn(zPlugBar, { shift: [0, 0.2, 0], runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(zPlugVal, zPlugSub), { runTime: 0.6 }),
    new M.Create(zDash, { runTime: 0.55 }),
    new M.FadeIn(zGap, { runTime: 0.55 }),
    ...say('PLUG-IN MAKES BAD DAYS LOOK RARER', C.pink),
    ...fbox(['bad day (3+ fail):', ['plug-in:    5% (too low)', C.amber], ['predictive: 7%', C.cyan]], C.pink)
  );

  // =========================================================================
  // BEATS 34-37: Common trap, two sources of spread, and bridge to 6.3.6
  // =========================================================================
  const trapW = P ? 6.2 : 6.6;
  const trapTop = stepCard(CX, P ? -0.35 : 0.65, trapW, 1.05, ['RATE’S 95% INTERVAL', '9%  to  46%   (about the rate)'], C.green);
  const trapNeq = T('≠', P ? 36 : 38, C.pink, false, true); trapNeq.moveTo([CX, P ? -1.75 : -0.55, 0]);
  const trapBot = stepCard(CX, P ? -3.15 : -1.75, trapW, 1.05, ['FUTURE COUNTS SPREAD', '0, 1, 2, 3, 4 failures (about parts)'], C.cyan);

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(zAxis, zTitle, zPredBar, zPredVal, zPredSub, zPlugBar, zPlugVal, zPlugSub, zDash, zGap), { runTime: 0.5 }),
    new M.FadeIn(trapTop, { runTime: 0.7 }),
    new M.FadeIn(trapNeq, { runTime: 0.6 }),
    new M.FadeIn(trapBot, { runTime: 0.7 }),
    ...say('TRAP: RATE INTERVAL ≠ FUTURE COUNTS', C.pink),
    ...fbox(['common trap:', ['rate interval: 9%–46%', C.green], ['future counts: 0 to 4', C.cyan]], C.pink)
  );

  // Beat 35: Even if we knew the rate exactly, batches vary by chance
  const srcW = P ? 6.4 : 6.8, srcH = P ? 1.2 : 0.96;
  const srcY1 = P ? 0.10 : 0.68, srcY2 = P ? -1.55 : -0.62, srcY3 = P ? -3.20 : -1.92;
  const src1 = stepCard(CX, srcY1, srcW, srcH, ['1. CHANCE IN EACH BATCH', 'even at exact 25%, batches vary'], C.amber);

  const exSets = [['pass', 'pass', 'pass', 'pass'], ['fail', 'pass', 'pass', 'pass'], ['fail', 'pass', 'fail', 'pass']];
  const exNames = ['0 fail', '1 fail', '2 fail'];
  const exParts = [];
  const exSc = P ? 0.62 : 0.6, exSp = P ? 0.66 : 0.56;
  exSets.forEach((set, g) => {
    const gx = P ? 0 : CX + (g - 1) * 2.8;
    const gy = P ? srcY2 + 0.35 - g * 1.6 : srcY2 - 0.35;
    set.forEach((st, k) => exParts.push(charger(gx + (k - 1.5) * exSp, gy, st, exSc)));
    const t = T(`batch ${g + 1}: ${exNames[g]}`, P ? 17 : 16, C.amber, true, true);
    t.moveTo([gx, gy - (P ? 0.55 : 0.6), 0]);
    exParts.push(t);
  });

  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(trapTop, trapNeq, trapBot), { runTime: 0.5 }),
    new M.FadeIn(src1, { runTime: 0.8 }),
    new M.LaggedStart(exParts.map(p => new M.FadeIn(p)), { lagRatio: 0.06, runTime: 1.4 }),
    ...say('EVEN AT EXACT 25%, BATCHES VARY', C.amber),
    ...fbox(['spread source 1:', ['random chance in batch', C.amber]], C.amber)
  );

  // Beat 36: Predictive includes BOTH sources
  const plus12 = T('+', P ? 26 : 26, C.cyan, true, true); plus12.moveTo([CX, (srcY1 + srcY2) / 2, 0]);
  const src2 = stepCard(CX, srcY2, srcW, srcH, ['2. DOUBT ABOUT THE RATE', 'posterior hill: rate could be 10% … 45%'], C.green);

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...exParts), { runTime: 0.4 }),
    new M.FadeIn(plus12, { runTime: 0.5 }),
    new M.FadeIn(src2, { runTime: 0.8 }),
    ...say('PREDICTIVE = CHANCE + RATE DOUBT', C.cyan),
    ...fbox(['predictive spread =', ['  batch chance', C.amber], ['+ rate doubt', C.green]])
  );

  // Beat 37: Third source — the prior itself (next lesson 6.3.6)
  const src3 = stepCard(CX, srcY3, srcW, srcH, ['3. THE PRIOR ITSELF?', 'next lesson (6.3.6): how much it matters'], C.violet);

  await until(S(37));
  await play(
    new M.FadeIn(src3, { runTime: 0.8 }),
    ...say('NEXT LESSON: DOES THE PRIOR MATTER?', C.violet),
    ...fbox(['next up (6.3.6):', ['how much does the prior', C.violet], ['change the answer?', C.violet]], C.violet)
  );

  // =========================================================================
  // BEAT 38: One-sentence recap
  // =========================================================================
  let recapHill, recapArr, recapBars;
  if (P) {
    recapHill = makeHill(-2.7, 2.7, -1.0, 1.85, C.green, false);
    const rHLbl = T('posterior (weights)', 16, C.green, true, true); rHLbl.moveTo([0, -1.32, 0]);
    recapArr = makeArrow([0, -1.65, 0], [0, -2.25, 0], C.amber, 2.8);
    const rParts = [rHLbl];
    const rBase = -4.55, rH = 1.95;
    rParts.push(new M.Line({ start: [-2.6, rBase, 0], end: [2.6, rBase, 0], color: C.muted, strokeWidth: 2 }));
    PRED.forEach((v, i) => {
      const rx = -1.8 + i * 1.2, hh = (v / 42) * rH;
      const r = new M.Rectangle({ width: 0.72, height: hh, color: C.cyan, strokeWidth: 2 });
      r.setFill(C.cyan, 0.82); r.moveTo([rx, rBase + hh / 2, 0]);
      const t = T(`${v}%`, 17, C.cyan, true, true); t.moveTo([rx, rBase + hh + 0.24, 0]);
      const c = T(catNames[i], 15, C.muted, true); c.moveTo([rx, rBase - 0.25, 0]);
      rParts.push(r, t, c);
    });
    recapBars = new M.VGroup(...rParts);
  } else {
    recapHill = makeHill(-5.7, -2.55, -1.35, 2.15, C.green, false);
    const rHLbl = T('posterior', 16, C.green, true, true); rHLbl.moveTo([-4.12, -1.70, 0]);
    recapArr = makeArrow([-2.3, -0.35, 0], [-1.55, -0.35, 0], C.amber, 2.8);
    const rParts = [rHLbl];
    const rBase = -1.35, rH = 2.15;
    rParts.push(new M.Line({ start: [-1.35, rBase, 0], end: [1.55, rBase, 0], color: C.muted, strokeWidth: 2 }));
    PRED.forEach((v, i) => {
      const rx = -0.95 + i * 0.72, hh = (v / 42) * rH;
      const r = new M.Rectangle({ width: 0.48, height: hh, color: C.cyan, strokeWidth: 2 });
      r.setFill(C.cyan, 0.82); r.moveTo([rx, rBase + hh / 2, 0]);
      const t = T(`${v}%`, 15, C.cyan, true, true); t.moveTo([rx, rBase + hh + 0.22, 0]);
      const c = T(['0', '1', '2', '3+'][i], 14, C.muted, true); c.moveTo([rx, rBase - 0.28, 0]);
      rParts.push(r, t, c);
    });
    const rBLbl = T('future batch', 16, C.cyan, true, true); rBLbl.moveTo([0.1, -1.92, 0]);
    rParts.push(rBLbl);
    recapBars = new M.VGroup(...rParts);
  }

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(src1, plus12, src2, src3), { runTime: 0.55 }),
    new M.FadeIn(recapHill.group, { runTime: 0.8 }),
    new M.FadeIn(recapArr, { runTime: 0.7 }),
    new M.FadeIn(recapBars, { runTime: 0.85 }),
    ...say('AVERAGE EVERY RATE, WEIGHTED BY POSTERIOR', C.green),
    ...fbox(['to predict new data:', 'average every plausible', 'rate’s prediction,', ['weighted by posterior', C.green]], C.green)
  );
}

// 1.3.6 Standard deviation: back to days (live manim-web lesson).
// Beat i = sentence i (0-based, 0..55). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const D = [3, 4, 4, 5, 6, 6, 7];
  const GAPS = [-2, -1, -1, 0, 1, 1, 2];
  const SIDES = [2, 1, 1, 0, 1, 1, 2];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.6, 0] : [4.35, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box at a time, lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.38 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Helpers: number line (2..8 days), parcel icons, horizontal chevron arrows
  const LW = P ? 6.6 : 7.0, LX0 = CX - LW / 2, DAY_U = LW / 6;
  const d2x = v => LX0 + (v - 2) * DAY_U;
  const NY = P ? 0.2 : -1.05;

  function makeNumberLine(y, showUnit = true) {
    const line = new M.Line({ start: [LX0, y, 0], end: [LX0 + LW, y, 0], color: C.muted, strokeWidth: 3 });
    const ticks = [2, 3, 4, 5, 6, 7, 8].map(v => new M.VGroup(
      new M.Line({ start: [d2x(v), y - 0.08, 0], end: [d2x(v), y + 0.08, 0], color: C.muted, strokeWidth: 2 }),
      T(String(v), P ? 18 : 19, C.muted, true).moveTo([d2x(v), y - 0.34, 0])
    ));
    const parts = [line, ...ticks];
    let unit = null;
    if (showUnit) {
      unit = T('days', 17, C.muted);
      unit.moveTo([LX0 + LW - 0.25, y - 0.66, 0]);
      parts.push(unit);
    }
    return { line, ticks, unit, parts };
  }

  function makeArrow(x1, x2, y, color, sw = 3) {
    const dir = x2 >= x1 ? 1 : -1;
    const tip = Math.min(0.16, Math.abs(x2 - x1) * 0.32);
    const shaft = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const top = new M.Line({ start: [x2 - dir * tip, y + tip * 0.65, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const bot = new M.Line({ start: [x2 - dir * tip, y - tip * 0.65, 0], end: [x2, y, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, top, bot);
  }

  function makeParcelIcon(x, y) {
    const box = new M.RoundedRectangle({ width: 0.56, height: 0.46, cornerRadius: 0.07, color: C.cyan, strokeWidth: 2 });
    box.setFill(C.cyan, 0.22); box.moveTo([x, y, 0]);
    const hLine = new M.Line({ start: [x - 0.28, y, 0], end: [x + 0.28, y, 0], color: C.amber, strokeWidth: 2 });
    const vLine = new M.Line({ start: [x, y - 0.23, 0], end: [x, y + 0.23, 0], color: C.amber, strokeWidth: 2 });
    return new M.VGroup(box, hLine, vLine);
  }

  // 0: Coffee parcels intro
  const parcels = D.map((_, k) => makeParcelIcon(CX + (k - 3) * (P ? 0.92 : 1.0), NY + 0.6));
  await until(S(0));
  await play(new M.LaggedStart(parcels.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox(['coffee bean parcels:', ['how much do delivery', C.cyan], ['times change?', C.cyan]], C.cyan), ...say('COFFEE PARCEL DELIVERIES'));

  // 1: Days number line
  const nl1 = makeNumberLine(NY, true);
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...parcels)), new M.Create(nl1.line), new M.FadeIn(new M.VGroup(...nl1.ticks, nl1.unit)), ...fbox(['last week:', ['7 parcels, in days', C.cyan]], C.cyan), ...say('7 PARCELS, MEASURED IN DAYS'));

  // 2: Seven parcels placed on the days line: 3, 4, 4, 5, 6, 6, 7
  const dots1 = D.map((v, k) => {
    const up = D.slice(0, k).filter(x => x === v).length;
    const p = [d2x(v), NY + 0.36 + up * 0.56, 0];
    const halo = new M.Dot({ point: p, radius: 0.27, color: C.cyan }); halo.setFill(C.cyan, 0.2);
    const d = new M.Dot({ point: p, radius: 0.12, color: C.cyan }); d.setFill(C.cyan, 1);
    return { g: new M.VGroup(halo, d), d, halo, p, v, up };
  });
  await until(S(2));
  await play(new M.LaggedStart(dots1.map(o => new M.FadeIn(o.g)), { lagRatio: 0.4, runTime: 3.4 }), ...fbox(['days:', ['3, 4, 4, 5, 6, 6, 7', C.cyan]], C.cyan), ...say('3, 4, 4, 5, 6, 6, 7 DAYS'));

  // 3: Sum = 35 days
  await until(S(3));
  await play(
    new M.LaggedStart(dots1.map(o => new M.Indicate(o.g, { color: C.amber })), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox(['3+4+4+5+6+6+7', ['total = 35 days', C.amber]], C.amber),
    ...say('TOTAL = 35 DAYS', C.amber)
  );

  // 4: Share 35 equally across 7 = 5
  const meanLine1 = new M.DashedLine({ start: [d2x(5), NY - 0.1, 0], end: [d2x(5), NY + 1.85, 0], color: C.amber });
  const meanTag5 = pill('5 DAYS', C.amber, 17); meanTag5.moveTo([d2x(5), NY + 2.15, 0]);
  await until(S(4));
  await play(
    new M.Create(meanLine1), new M.FadeIn(meanTag5),
    ...fbox(['total = 35 days', 'count = 7 parcels', ['35 ÷ 7 = 5 days', C.amber]], C.amber),
    ...say('EQUAL SHARE = 5 DAYS', C.amber)
  );

  // 5: Average = mean
  const meanTag = pill('MEAN = 5', C.amber, 17); meanTag.moveTo([d2x(5), NY + 2.15, 0]);
  await until(S(5));
  await play(
    new M.FadeOut(meanTag5), new M.FadeIn(meanTag),
    ...fbox(['35 ÷ 7 = 5 days', ['mean = 5 days', C.amber]], C.amber),
    ...say('AVERAGE = MEAN = 5 DAYS', C.amber)
  );

  // 6: How far each parcel sits from 5
  await until(S(6));
  await play(new M.Indicate(meanLine1, { color: C.cyan }), ...say('HOW FAR FROM 5?', C.cyan));

  // 7: Early parcels -> minus gaps (staggered heights so no arrows overlap)
  const guide3 = new M.DashedLine({ start: [d2x(3), NY + 0.48, 0], end: [d2x(3), NY + 1.48, 0], color: C.green });
  const arrL1 = makeArrow(d2x(5) - 0.04, d2x(4) + 0.16, NY + 0.36, C.green);
  const labL1 = T('−1', 18, C.green, true); labL1.moveTo([(d2x(5) + d2x(4)) / 2, NY + 0.58, 0]);
  const arrL2 = makeArrow(d2x(5) - 0.04, d2x(4) + 0.16, NY + 0.92, C.green);
  const labL2 = T('−1', 18, C.green, true); labL2.moveTo([(d2x(5) + d2x(4)) / 2, NY + 1.14, 0]);
  const arrL3 = makeArrow(d2x(5) - 0.04, d2x(3) + 0.04, NY + 1.48, C.green);
  const labL3 = T('−2', 18, C.green, true); labL3.moveTo([(d2x(5) + d2x(3)) / 2, NY + 1.72, 0]);
  const earlyParts = [guide3, arrL1, labL1, arrL2, labL2, arrL3, labL3];
  await until(S(7));
  await play(
    new M.LaggedStart(earlyParts.map(x => new M.FadeIn(x)), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox(['gaps from 5:', ['early: −2, −1, −1', C.green]], C.green),
    ...say('EARLY = MINUS GAPS', C.green)
  );

  // 8: Late parcels -> plus gaps
  const guide7 = new M.DashedLine({ start: [d2x(7), NY + 0.48, 0], end: [d2x(7), NY + 1.48, 0], color: C.pink });
  const arrR1 = makeArrow(d2x(5) + 0.04, d2x(6) - 0.16, NY + 0.36, C.pink);
  const labR1 = T('+1', 18, C.pink, true); labR1.moveTo([(d2x(5) + d2x(6)) / 2, NY + 0.58, 0]);
  const arrR2 = makeArrow(d2x(5) + 0.04, d2x(6) - 0.16, NY + 0.92, C.pink);
  const labR2 = T('+1', 18, C.pink, true); labR2.moveTo([(d2x(5) + d2x(6)) / 2, NY + 1.14, 0]);
  const arrR3 = makeArrow(d2x(5) + 0.04, d2x(7) - 0.04, NY + 1.48, C.pink);
  const labR3 = T('+2', 18, C.pink, true); labR3.moveTo([(d2x(5) + d2x(7)) / 2, NY + 1.72, 0]);
  const lateParts = [guide7, arrR1, labR1, arrR2, labR2, arrR3, labR3];
  await until(S(8));
  await play(
    new M.LaggedStart(lateParts.map(x => new M.FadeIn(x)), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox(['gaps from 5:', ['early: −2, −1, −1', C.green], ['late:  +1, +1, +2', C.pink]], C.pink),
    ...say('LATE = PLUS GAPS', C.pink)
  );

  // 9: Minus and plus gaps cancel to zero
  await until(S(9));
  await play(
    new M.Indicate(arrL3, { color: C.amber }), new M.Indicate(arrR3, { color: C.amber }),
    ...fbox([['−2 − 1 − 1 = −4', C.green], ['+1 + 1 + 2 = +4', C.pink], ['−4 + 4 = 0', C.amber]], C.amber),
    ...say('GAPS CANCEL OUT TO ZERO', C.amber)
  );

  // 10: Multiply each gap by itself
  await until(S(10));
  await play(
    ...fbox(['stop the canceling:', ['gap × gap', C.violet]], C.violet),
    ...say('MULTIPLY EACH GAP BY ITSELF', C.violet)
  );

  // 11: Minus times minus = plus
  await until(S(11));
  await play(
    new M.Indicate(labL3, { color: C.green }), new M.Indicate(labL2, { color: C.green }),
    ...fbox([['(−2) × (−2) = +4', C.green], ['(−1) × (−1) = +1', C.green]], C.green),
    ...say('MINUS × MINUS = PLUS', C.green)
  );

  // 12: Transition to 7 parcels with real squares (built from 12 individual 1x1 unit tiles)
  const SU = P ? 0.56 : 0.60;
  const SQ_GAP = P ? 0.22 : 0.26;
  const SQ_BASE = P ? 0.45 : -1.2;
  const slotW = SIDES.map(s => (s || 0.55) * SU);
  const totalW = slotW.reduce((a, b) => a + b, 0) + (D.length - 1) * SQ_GAP;
  const sqx = [];
  let curX = CX - totalW / 2;
  for (let k = 0; k < D.length; k++) {
    sqx.push(curX + slotW[k] / 2);
    curX += slotW[k] + SQ_GAP;
  }

  const sqFloor = new M.Line({ start: [CX - totalW / 2 - 0.25, SQ_BASE, 0], end: [CX + totalW / 2 + 0.25, SQ_BASE, 0], color: C.muted, strokeWidth: 2 });
  const valLabs = D.map((v, k) => T(String(v), 19, C.cyan, true).moveTo([sqx[k], SQ_BASE - 0.34, 0]));
  const gapLabs = GAPS.map((g, k) => T(g > 0 ? `+${g}` : g < 0 ? `−${-g}` : '0', 17, g < 0 ? C.green : g > 0 ? C.pink : C.amber, true).moveTo([sqx[k], SQ_BASE - 0.80, 0]));
  const outlines = SIDES.map((s, k) => {
    if (!s) return null;
    const r = new M.Rectangle({ width: s * SU, height: s * SU, color: C.muted, strokeWidth: 1.5 });
    r.setFill(C.card, 0.35);
    r.moveTo([sqx[k], SQ_BASE + (s * SU) / 2, 0]);
    return r;
  }).filter(Boolean);

  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...nl1.parts, ...dots1.map(o => o.g), meanLine1, meanTag, ...earlyParts, ...lateParts), { runTime: 0.7 }),
    ...say('EACH GAP × GAP = A SQUARE', C.violet)
  );
  await play(
    new M.Create(sqFloor),
    ...valLabs.map(v => new M.FadeIn(v)),
    ...gapLabs.map(g => new M.FadeIn(g)),
    new M.LaggedStart(outlines.map(o => new M.FadeIn(o)), { lagRatio: 0.1, runTime: 1.2 }),
    ...fbox(['bigger gap →', ['much larger square', C.violet]], C.violet)
  );

  // 13: Days times days = square days
  await until(S(13));
  await play(
    new M.Indicate(outlines[0], { color: C.amber }),
    ...fbox(['m × m = square metres', ['days × days = sq days', C.amber]], C.amber),
    ...say('DAYS × DAYS = SQUARE DAYS', C.amber)
  );

  // Helper to build an individual 1x1 unit tile
  const unitTile = (x, y, col = C.cyan) => {
    const r = new M.Rectangle({ width: SU * 0.94, height: SU * 0.94, color: col, strokeWidth: 1.5 });
    r.setFill(col, 0.45);
    r.moveTo([x, y, 0]);
    return r;
  };
  const tiles = []; // 12 individual unit tiles, never wrapped in a VGroup until FadeOut
  const borders = [];
  const areaLabs = [];
  const makeParcelSquare = k => {
    const s = SIDES[k], created = [];
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        const tx = sqx[k] + (c - (s - 1) / 2) * SU;
        const ty = SQ_BASE + (r + 0.5) * SU;
        const t = unitTile(tx, ty, C.cyan);
        tiles.push(t);
        created.push(t);
      }
    }
    const b = new M.Rectangle({ width: s * SU, height: s * SU, color: C.cyan, strokeWidth: 2.5 });
    b.setFill(C.cyan, 0.01);
    b.moveTo([sqx[k], SQ_BASE + (s * SU) / 2, 0]);
    borders.push(b);
    const al = T(String(s * s), 20, C.amber, true);
    al.moveTo([sqx[k], SQ_BASE + s * SU + 0.28, 0]);
    areaLabs.push(al);
    return { created, b, al };
  };

  // 14: 3 is 2 days early, 7 is 2 days late
  await until(S(14));
  await play(
    new M.Indicate(valLabs[0], { color: C.amber }), new M.Indicate(valLabs[6], { color: C.amber }),
    ...fbox(['3 is 2 days early (−2)', '7 is 2 days late  (+2)']),
    ...say('3 (−2 DAYS) AND 7 (+2 DAYS)', C.cyan)
  );

  // 15: Each gives a 2x2 square of area 4 square days
  const sq0 = makeParcelSquare(0);
  const sq6 = makeParcelSquare(6);
  await until(S(15));
  await play(
    new M.LaggedStart([...sq0.created, ...sq6.created].map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.3 }),
    new M.Create(sq0.b), new M.Create(sq6.b), new M.FadeIn(sq0.al), new M.FadeIn(sq6.al),
    ...fbox(['3 → 2 × 2 = 4 sq days', '7 → 2 × 2 = 4 sq days'], C.cyan),
    ...say('AREA = 4 SQUARE DAYS EACH', C.cyan)
  );

  // 16: Both 4-day parcels -> two squares of 1
  const sq1 = makeParcelSquare(1);
  const sq2 = makeParcelSquare(2);
  await until(S(16));
  await play(
    ...sq1.created.map(t => new M.FadeIn(t)), ...sq2.created.map(t => new M.FadeIn(t)),
    new M.Create(sq1.b), new M.Create(sq2.b), new M.FadeIn(sq1.al), new M.FadeIn(sq2.al),
    ...fbox(['4 → 1 × 1 = 1 sq day', '4 → 1 × 1 = 1 sq day'], C.cyan),
    ...say('TWO SQUARES OF 1', C.cyan)
  );

  // 17: Both 6-day parcels -> two more squares of 1
  const sq4 = makeParcelSquare(4);
  const sq5 = makeParcelSquare(5);
  await until(S(17));
  await play(
    ...sq4.created.map(t => new M.FadeIn(t)), ...sq5.created.map(t => new M.FadeIn(t)),
    new M.Create(sq4.b), new M.Create(sq5.b), new M.FadeIn(sq4.al), new M.FadeIn(sq5.al),
    ...fbox(['6 → 1 × 1 = 1 sq day', '6 → 1 × 1 = 1 sq day'], C.cyan),
    ...say('TWO MORE SQUARES OF 1', C.cyan)
  );

  // 18: The 5-day parcel adds zero
  const zeroDot = new M.Dot({ point: [sqx[3], SQ_BASE + 0.14, 0], radius: 0.09, color: C.amber });
  zeroDot.setFill(C.amber, 1);
  const zeroLab = T('0', 20, C.amber, true); zeroLab.moveTo([sqx[3], SQ_BASE + 0.44, 0]);
  await until(S(18));
  await play(
    new M.FadeIn(zeroDot), new M.FadeIn(zeroLab),
    ...fbox(['5 → 0 × 0 = 0 sq days'], C.amber),
    ...say('5 ADDS ZERO', C.amber)
  );

  // 19: Two larger squares make 8, smaller ones add 2 on each side
  await until(S(19));
  await play(
    new M.Indicate(sq0.b, { color: C.amber }), new M.Indicate(sq6.b, { color: C.amber }),
    ...fbox(['large: 4 + 4 = 8', 'small: 2 + 2 = 4', ['8 + 4', C.amber]], C.amber),
    ...say('4 + 4 = 8, PLUS 2 AND 2', C.amber)
  );

  // 20: Total = 12 square days
  await until(S(20));
  await play(
    new M.LaggedStart(tiles.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.06, runTime: 1.4 }),
    ...fbox(['4+1+1+0+1+1+4', ['total = 12 sq days', C.amber]], C.amber),
    ...say('TOTAL = 12 SQUARE DAYS', C.amber)
  );

  // 21: One typical square area from that 12
  await until(S(21));
  await play(
    ...fbox(['total = 12 sq days', ['find one typical square', C.violet]], C.violet),
    ...say('ONE TYPICAL SQUARE AREA?', C.violet)
  );

  // 22: Seven parcels are a sample
  const sampleBox = new M.RoundedRectangle({ width: totalW + 0.35, height: 0.56, cornerRadius: 0.12, color: C.violet, strokeWidth: 2 });
  sampleBox.setFill(C.violet, 0.06);
  sampleBox.moveTo([CX, SQ_BASE - 0.34, 0]);
  await until(S(22));
  await play(new M.Create(sampleBox), ...say('7 PARCELS = A SAMPLE', C.violet));

  // 23: Only 6 parcels are free to vary
  const freeMarks = D.slice(0, 6).map((_, k) =>
    new M.Line({ start: [sqx[k] - 0.2, SQ_BASE - 0.54, 0], end: [sqx[k] + 0.2, SQ_BASE - 0.54, 0], color: C.green, strokeWidth: 3 })
  );
  await until(S(23));
  await play(
    new M.LaggedStart(freeMarks.map(m => new M.Create(m)), { lagRatio: 0.12, runTime: 1.2 }),
    ...fbox(['7 parcels in sample', ['6 are free to vary', C.green]], C.green),
    ...say('6 PARCELS FREE TO VARY', C.green)
  );

  // 24: Seventh is locked in
  const lockBox = new M.RoundedRectangle({ width: 0.52, height: 0.42, cornerRadius: 0.08, color: C.pink, strokeWidth: 2 });
  lockBox.setFill(C.pink, 0.12); lockBox.moveTo([sqx[6], SQ_BASE - 0.34, 0]);
  const lockTag = T('locked', 15, C.pink); lockTag.moveTo([sqx[6], SQ_BASE - 1.15, 0]);
  await until(S(24));
  await play(
    new M.Create(lockBox), new M.FadeIn(lockTag),
    ...fbox(['6 free to vary', ['7th locked to balance', C.pink]], C.pink),
    ...say('7TH LOCKED IN TO BALANCE', C.pink)
  );

  // 25: Sharing across 7 makes spread slightly too small
  await until(S(25));
  await play(
    ...fbox([['12 ÷ 7 ≈ 1.71 (too low)', C.muted], ['use 6 instead (7 − 1)', C.green]], C.amber),
    ...say('DIVIDING BY 7 IS TOO SMALL', C.muted)
  );

  // 26: Share the 12 square days across 6 equal piles of 2
  const shareSp = P ? 1.02 : 1.12;
  const shareX = i => CX + (i - 2.5) * shareSp;
  const shareSlots = Array.from({ length: 6 }, (_, i) => T(String(i + 1), 18, C.green, true).moveTo([shareX(i), SQ_BASE - 0.35, 0]));
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(...outlines, ...borders, ...areaLabs, zeroDot, zeroLab, sampleBox, ...freeMarks, lockBox, lockTag, ...valLabs, ...gapLabs), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...shareSlots)),
    ...fbox(['total = 12 sq days', ['share across 6', C.green]], C.green),
    ...say('SHARE 12 ACROSS 6', C.green)
  );
  await play(new M.LaggedStart(tiles.map((t, i) => {
    const col = i % 6, row = Math.floor(i / 6);
    return new M.Transform(t, unitTile(shareX(col), SQ_BASE + (row + 0.5) * SU, C.cyan), { pathArc: 0.35 });
  }), { lagRatio: 0.06, runTime: 1.7 }));

  // 27: 12 ÷ 6 = 2 square days
  const varLvlY = SQ_BASE + 2 * SU;
  const varLine = new M.DashedLine({ start: [shareX(0) - shareSp / 2, varLvlY, 0], end: [shareX(5) + shareSp / 2, varLvlY, 0], color: C.amber });
  const varTag = pill('2 SQ DAYS EACH', C.amber, 17); varTag.moveTo([CX, varLvlY + 0.48, 0]);
  await until(S(27));
  await play(
    new M.Create(varLine), new M.FadeIn(varTag),
    ...fbox(['12 ÷ 6', ['= 2 square days', C.amber]], C.amber),
    ...say('12 ÷ 6 = 2 SQUARE DAYS', C.amber)
  );

  // 28: Sample variance (first appearance of the word "variance")
  await until(S(28));
  await play(
    new M.LaggedStart(tiles.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.04, runTime: 1.2 }),
    ...fbox(['sample variance', ['= 12 ÷ 6', C.muted], ['= 2 square days', C.amber]], C.amber),
    ...say('VARIANCE = 2 SQUARE DAYS', C.amber)
  );

  // 29: Nobody plans deliveries in square days
  await until(S(29));
  await play(
    ...fbox(['variance = 2 sq days', ['unit: square days?', C.pink]], C.pink),
    ...say('NOBODY PLANS IN SQUARE DAYS', C.pink)
  );

  // 30: Spread in ordinary days
  await until(S(30));
  await play(
    ...fbox(['square days → days', ['back to ordinary days', C.cyan]], C.cyan),
    ...say('WE WANT ORDINARY DAYS', C.cyan)
  );

  // 31: Imagine a square with area = 2 square days
  const U2 = P ? 1.2 : 1.12;
  const SQC = [CX, P ? 0.45 : -0.65, 0];
  const S2 = Math.SQRT2 * U2;
  const BL = [SQC[0] - S2 / 2, SQC[1] - U2, 0];
  const SQ_SEP = P ? 0.5 : 0.6;
  const oneX = BL[0] - SQ_SEP - U2 / 2, twoX = BL[0] + S2 + SQ_SEP + U2;

  const varSq = new M.Rectangle({ width: S2, height: S2, color: C.cyan, strokeWidth: 3 });
  varSq.setFill(C.cyan, 0.28);
  varSq.moveTo([BL[0] + S2 / 2, BL[1] + S2 / 2, 0]);
  const varSqArea = T('area = 2', P ? 22 : 21, C.ink, true);
  varSqArea.moveTo([BL[0] + S2 / 2, BL[1] + S2 / 2 + 0.22, 0]);
  const varSqUnit = T('sq days', P ? 18 : 17, C.cyan, true);
  varSqUnit.moveTo([BL[0] + S2 / 2, BL[1] + S2 / 2 - 0.10, 0]);

  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(...tiles, ...shareSlots, sqFloor, varLine, varTag)),
    new M.Create(varSq), new M.FadeIn(varSqArea), new M.FadeIn(varSqUnit),
    ...fbox(['square area', ['= 2 square days', C.cyan]], C.cyan),
    ...say('A SQUARE OF AREA 2', C.cyan)
  );

  // 32: How long is one side? (short sentence: 1.28s)
  const botSide = new M.Line({ start: [BL[0], BL[1], 0], end: [BL[0] + S2, BL[1], 0], color: C.amber, strokeWidth: 6 });
  const qBot = T('side = ?', 20, C.amber, true); qBot.moveTo([BL[0] + S2 / 2, BL[1] - 0.36, 0]);
  await until(S(32));
  await play(
    new M.Create(botSide, { runTime: 0.75 }), new M.FadeIn(qBot, { runTime: 0.75 }),
    ...say('HOW LONG IS ONE SIDE?', C.amber)
  );

  // 33: Length that times itself makes 2
  const leftSide = new M.Line({ start: [BL[0], BL[1], 0], end: [BL[0], BL[1] + S2, 0], color: C.amber, strokeWidth: 4 });
  const qLeft = T('?', 20, C.amber, true); qLeft.moveTo([BL[0] - 0.3, BL[1] + S2 / 2, 0]);
  await until(S(33));
  await play(
    new M.Create(leftSide), new M.FadeIn(qLeft),
    ...fbox(['side × side = 2', ['what length fits?', C.amber]], C.amber),
    ...say('SIDE × SIDE = 2', C.amber)
  );

  // 34: 1 x 1 = 1, too small
  const sqOne = new M.Rectangle({ width: U2, height: U2, color: C.pink, strokeWidth: 2.5 });
  sqOne.setFill(C.pink, 0.25);
  sqOne.moveTo([oneX, BL[1] + U2 / 2, 0]);
  const labOne = T('1 × 1 = 1', 18, C.pink, true); labOne.moveTo([oneX, BL[1] - 0.36, 0]);
  const tick1 = T('side 1', 17, C.pink, true); tick1.moveTo([oneX, BL[1] + U2 + 0.3, 0]);
  await until(S(34));
  await play(
    new M.FadeIn(sqOne), new M.FadeIn(labOne), new M.FadeIn(tick1),
    ...fbox([['1 × 1 = 1 (too small)', C.pink]], C.pink),
    ...say('1 × 1 = 1 (TOO SMALL)', C.pink)
  );

  // 35: 2 x 2 = 4, too big
  const sqTwo = new M.Rectangle({ width: 2 * U2, height: 2 * U2, color: C.violet, strokeWidth: 2.5 });
  sqTwo.setFill(C.violet, 0.18);
  sqTwo.moveTo([twoX, BL[1] + U2, 0]);
  const labTwo = T('2 × 2 = 4', 18, C.violet, true); labTwo.moveTo([twoX, BL[1] - 0.36, 0]);
  const tick2 = T('side 2', 17, C.violet, true); tick2.moveTo([twoX, BL[1] + 2 * U2 + 0.3, 0]);
  await until(S(35));
  await play(
    new M.FadeIn(sqTwo), new M.FadeIn(labTwo), new M.FadeIn(tick2),
    ...fbox([['1 × 1 = 1 (too small)', C.pink], ['2 × 2 = 4 (too big)', C.violet]], C.violet),
    ...say('2 × 2 = 4 (TOO BIG)', C.violet)
  );

  // 36: Side lies between 1 and 2
  await until(S(36));
  await play(
    new M.Indicate(botSide, { color: C.amber }),
    ...fbox([['1 × 1 = 1 (too small)', C.pink], ['2 × 2 = 4 (too big)', C.violet], ['side: between 1 and 2', C.amber]], C.amber),
    ...say('BETWEEN 1 AND 2', C.amber)
  );

  // 37: Calculator gives about 1.41
  const valBot = T('1.41 days', 21, C.amber, true); valBot.moveTo([BL[0] + S2 / 2, BL[1] - 0.36, 0]);
  const valLeft = T('1.41', 19, C.amber, true); valLeft.moveTo([BL[0] - 0.52, BL[1] + S2 / 2, 0]);
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(sqOne, labOne, tick1, sqTwo, labTwo, tick2, qBot, qLeft)),
    new M.FadeIn(valBot), new M.FadeIn(valLeft),
    ...fbox(['side ≈ 1.41 days', ['just under 1.5 days', C.amber]], C.amber),
    ...say('SIDE ≈ 1.41 DAYS', C.amber)
  );

  // 38: Check: 1.41 x 1.41 ≈ 2
  await until(S(38));
  await play(
    new M.Indicate(varSq, { color: C.green }),
    ...fbox(['check:', ['1.41 × 1.41 ≈ 1.99', C.green], ['very close to 2', C.amber]], C.green),
    ...say('1.41 × 1.41 ≈ 2', C.green)
  );

  // 39: Taking the square root (first appearance of √)
  await until(S(39));
  await play(
    new M.Indicate(botSide, { color: C.violet }),
    ...fbox(['area → side:', ['square root', C.violet], ['√2 ≈ 1.41', C.amber]], C.violet),
    ...say('TAKING THE SQUARE ROOT', C.violet)
  );

  // 40: Back from square days to 1.41 days
  await until(S(40));
  await play(
    new M.Indicate(valBot, { color: C.cyan }),
    ...fbox(['2 square days', ['→ √2 ≈ 1.41 days', C.cyan]], C.cyan),
    ...say('BACK TO 1.41 DAYS', C.cyan)
  );

  // 41: Gap from average = deviation
  await until(S(41));
  await play(
    ...fbox(['gap from mean', ['= deviation', C.cyan]], C.cyan),
    ...say('GAP FROM MEAN = DEVIATION', C.cyan)
  );

  // 42: Standard deviation (first appearance of "standard deviation")
  await until(S(42));
  await play(
    new M.Indicate(botSide, { color: C.amber }),
    ...fbox(['standard deviation', ['= 1.41 days', C.amber]], C.amber),
    ...say('STANDARD DEVIATION = 1.41', C.amber)
  );

  // 43: From area of 2, we found its side
  await until(S(43));
  await play(
    new M.Indicate(varSqArea, { color: C.cyan }), new M.Indicate(valBot, { color: C.amber }),
    ...say('AREA 2 → SIDE 1.41 DAYS', C.green)
  );

  // 44: Standard deviation = square root of variance
  await until(S(44));
  await play(
    ...fbox([['standard deviation', C.ink], ['= √variance', C.amber], ['= √2 ≈ 1.41 days', C.green]], C.amber),
    ...say('SD = SQUARE ROOT OF VARIANCE', C.amber)
  );

  // 45: Picture around 5, round 1.41 to 1.4
  const YA = P ? 1.65 : 0.05;
  const YB = P ? -1.45 : -2.22;
  const bandH = P ? 0.95 : 0.88;
  const nlA = makeNumberLine(YA, true);
  const dotsA = D.map((v, k) => {
    const up = D.slice(0, k).filter(x => x === v).length;
    const p = [d2x(v), YA + (P ? 0.34 : 0.30) + up * (P ? 0.42 : 0.38), 0];
    const halo = new M.Dot({ point: p, radius: P ? 0.24 : 0.22, color: C.cyan }); halo.setFill(C.cyan, 0.2);
    const d = new M.Dot({ point: p, radius: 0.11, color: C.cyan }); d.setFill(C.cyan, 1);
    return { g: new M.VGroup(halo, d), d, halo, p, v };
  });
  const meanLineA = new M.DashedLine({ start: [d2x(5), YA - 0.08, 0], end: [d2x(5), YA + bandH + 0.08, 0], color: C.amber });

  await until(S(45));
  await play(
    new M.FadeOut(new M.VGroup(varSq, varSqArea, varSqUnit, botSide, leftSide, valBot, valLeft)),
    new M.Create(nlA.line), new M.FadeIn(new M.VGroup(...nlA.ticks, nlA.unit)),
    ...dotsA.map(o => new M.FadeIn(o.g)), new M.Create(meanLineA),
    ...fbox(['round 1.41 → 1.4', ['center at mean = 5', C.amber]], C.amber),
    ...say('ROUND 1.41 TO 1.4 AROUND 5', C.amber)
  );

  // 46: Step down 1.4 from 5 -> 3.6 days
  const bandL = new M.Rectangle({ width: d2x(5) - d2x(3.6), height: bandH, color: C.amber, strokeWidth: 0 });
  bandL.setFill(C.amber, 0.16); bandL.moveTo([(d2x(3.6) + d2x(5)) / 2, YA + bandH / 2, 0]);
  const edgeL = new M.DashedLine({ start: [d2x(3.6), YA - 0.12, 0], end: [d2x(3.6), YA + bandH, 0], color: C.amber });
  const arrLo = makeArrow(d2x(5) - 0.04, d2x(3.6) + 0.04, YA + bandH + 0.10, C.amber, 2.5);
  const labLo = T('3.6', 17, C.amber, true); labLo.moveTo([d2x(3.6), YA - 0.60, 0]);
  await until(S(46));
  await play(
    new M.FadeIn(bandL), new M.Create(edgeL), new M.FadeIn(arrLo), new M.FadeIn(labLo),
    ...fbox(['5 − 1.4 = 3.6 days'], C.amber),
    ...say('5 − 1.4 = 3.6 DAYS', C.amber)
  );

  // 47: Step up 1.4 from 5 -> 6.4 days
  const bandR = new M.Rectangle({ width: d2x(6.4) - d2x(5), height: bandH, color: C.amber, strokeWidth: 0 });
  bandR.setFill(C.amber, 0.16); bandR.moveTo([(d2x(5) + d2x(6.4)) / 2, YA + bandH / 2, 0]);
  const edgeR = new M.DashedLine({ start: [d2x(6.4), YA - 0.12, 0], end: [d2x(6.4), YA + bandH, 0], color: C.amber });
  const arrHi = makeArrow(d2x(5) + 0.04, d2x(6.4) - 0.04, YA + bandH + 0.10, C.amber, 2.5);
  const labHi = T('6.4', 17, C.amber, true); labHi.moveTo([d2x(6.4), YA - 0.60, 0]);
  await until(S(47));
  await play(
    new M.FadeIn(bandR), new M.Create(edgeR), new M.FadeIn(arrHi), new M.FadeIn(labHi),
    ...fbox(['5 − 1.4 = 3.6 days', ['5 + 1.4 = 6.4 days', C.amber]], C.amber),
    ...say('5 + 1.4 = 6.4 DAYS', C.amber)
  );

  // 48: 5 of 7 parcels fall inside that band (4, 4, 5, 6, 6)
  const insideA = dotsA.slice(1, 6);
  await until(S(48));
  insideA.forEach(o => {
    o.d.setFill(C.green, 1); o.d.setColor(C.green);
    o.halo.setFill(C.green, 0.24); o.halo.setColor(C.green);
  });
  await play(
    new M.LaggedStart(insideA.map(o => new M.Indicate(o.g, { color: C.green })), { lagRatio: 0.16, runTime: 1.8 }),
    ...fbox(['band: 3.6 to 6.4', ['5 of 7 inside', C.green], ['(4, 4, 5, 6, 6)', C.muted]], C.green),
    ...say('5 OF 7 PARCELS INSIDE BAND', C.green)
  );

  // 49: Standard deviation compares two cafes with the same average
  const titleA = T('This café: mean = 5, SD = 1.41', P ? 18 : 19, C.amber);
  titleA.moveTo([CX, YA + bandH + (P ? 0.38 : 0.36), 0]);
  await until(S(49));
  await play(
    new M.FadeIn(titleA),
    ...fbox(['same average: 5 days', ['compare spread (SD)', C.cyan]], C.cyan),
    ...say('COMPARE TWO CAFÉS (MEAN = 5)', C.cyan)
  );

  // 50: Second cafe: mean = 5, SD = 0.5 days ([4.5, 4.5, 4.5, 5, 5.5, 5.5, 5.5] -> exact mean 5, exact SD 0.5)
  const DB = [4.5, 4.5, 4.5, 5, 5.5, 5.5, 5.5];
  const nlB = makeNumberLine(YB, true);
  const bandBH = P ? 1.0 : 0.92;
  const meanLineB = new M.DashedLine({ start: [d2x(5), YB - 0.08, 0], end: [d2x(5), YB + bandBH + 0.02, 0], color: C.amber });
  const bandB = new M.Rectangle({ width: d2x(5.5) - d2x(4.5), height: bandBH, color: C.green, strokeWidth: 2 });
  bandB.setFill(C.green, 0.18); bandB.moveTo([d2x(5), YB + bandBH / 2, 0]);
  const dotsB = DB.map((v, k) => {
    const up = DB.slice(0, k).filter(x => x === v).length;
    const p = [d2x(v), YB + (P ? 0.26 : 0.22) + up * (P ? 0.30 : 0.27), 0];
    const halo = new M.Dot({ point: p, radius: P ? 0.2 : 0.18, color: C.green }); halo.setFill(C.green, 0.2);
    const d = new M.Dot({ point: p, radius: 0.095, color: C.green }); d.setFill(C.green, 1);
    return new M.VGroup(halo, d);
  });
  const titleB = T('Other café: mean = 5, SD = 0.5', P ? 18 : 19, C.green);
  titleB.moveTo([CX, YB + (P ? 1.28 : 1.18), 0]);
  const cafeB = [...nlB.parts, meanLineB, bandB, ...dotsB, titleB];

  await until(S(50));
  await play(
    new M.Create(nlB.line), new M.FadeIn(new M.VGroup(...nlB.ticks, nlB.unit)),
    new M.Create(meanLineB), new M.FadeIn(bandB), new M.FadeIn(titleB),
    new M.LaggedStart(dotsB.map(g => new M.FadeIn(g)), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox(['This café:  SD = 1.41', ['Other café: SD = 0.5', C.green]], C.green),
    ...say('OTHER CAFÉ: SD = 0.5 DAYS', C.green)
  );

  // 51: Smaller SD = more consistent
  await until(S(51));
  await play(
    new M.Indicate(bandB, { color: C.green }),
    ...fbox(['Other café: SD = 0.5', ['more consistent', C.green]], C.green),
    ...say('SMALLER SD = MORE CONSISTENT', C.green)
  );

  // 52: Larger SD = more widely scattered
  await until(S(52));
  await play(
    new M.Indicate(bandL, { color: C.amber }), new M.Indicate(bandR, { color: C.amber }),
    ...fbox(['This café: SD = 1.41', ['more scattered', C.amber]], C.amber),
    ...say('LARGER SD = MORE SCATTERED', C.amber)
  );

  // 53: Trap — typical spread, not a limit
  await until(S(53));
  await play(
    new M.FadeOut(new M.VGroup(...cafeB)),
    ...fbox(['±1 SD = typical spread', ['NOT a hard limit', C.pink]], C.pink),
    ...say('TYPICAL SPREAD, NOT A LIMIT', C.pink)
  );

  // 54: 3-day and 7-day parcels fall outside
  const ring3 = new M.Circle({ radius: 0.28, color: C.pink }); ring3.setFill(C.pink, 0.14); ring3.moveTo(dotsA[0].p);
  const ring7 = new M.Circle({ radius: 0.28, color: C.pink }); ring7.setFill(C.pink, 0.14); ring7.moveTo(dotsA[6].p);
  await until(S(54));
  dotsA[0].d.setFill(C.pink, 1); dotsA[0].d.setColor(C.pink);
  dotsA[6].d.setFill(C.pink, 1); dotsA[6].d.setColor(C.pink);
  await play(
    new M.Create(ring3), new M.Create(ring7),
    new M.Flash(dotsA[0].d, { color: C.pink }), new M.Flash(dotsA[6].d, { color: C.pink }),
    ...fbox(['band: 3.6 to 6.4 days', ['3 and 7 fall outside!', C.pink]], C.pink),
    ...say('3 AND 7 FALL OUTSIDE', C.pink)
  );

  // 55: One-sentence recap
  await until(S(55));
  await play(
    new M.Indicate(bandL, { color: C.amber }), new M.Indicate(bandR, { color: C.amber }),
    ...fbox(['variance = 2 sq days', ['SD = √2 ≈ 1.41 days', C.amber], ['typical spread in days', C.green]], C.amber),
    ...say('SD = TYPICAL SPREAD IN DAYS', C.amber)
  );
}

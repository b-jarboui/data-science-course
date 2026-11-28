// 3.2.8 Multiple imputation: fill each gap several plausible ways (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const REAL = [19, null, 31, 19, null, 31], REALK = [0, 2, 3, 5], GAPK = [1, 4];
  const FILLS = [[17, 27], [21, 29], [23, 33]], SUMS = [144, 150, 156], MEANS = [24, 25, 26];
  const CX = P ? -0.55 : -2.9, PITCH = P ? 0.95 : 0.92, CW = P ? 0.85 : 0.82, CH = P ? 0.6 : 0.62;
  const HEADY = P ? 1.3 : 1.15, ROWY = P ? [0.55, -1.0, -2.35, -3.7] : [0.55, -0.4, -1.25, -2.1];
  const MX = P ? 3.05 : 0.85, NS = P ? 20 : 22, LS = P ? 14 : 15;
  const PILL = P ? [0, 2.25, 0] : [-2.6, 1.85, 0];
  let BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const colx = k => CX + (k - 2.5) * PITCH;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fin = list => list.map(o => new M.FadeIn(o));
  const txt = (s, x, y, color, size = NS, mono = true, bold = true) => { const t = T(String(s), size, color, mono, bold); t.moveTo([x, y, 0]); return t; };

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
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
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function boxOut() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // table parts: glowing cells, cyan readings, hollow dashed rings for gaps
  function ring(x, y, color = C.muted) {
    const R = CH * 0.42, n = 10, seg = [];
    const pt = a => [x + R * Math.cos(a), y + R * Math.sin(a), 0];
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n, b = a + Math.PI / n, mid = (a + b) / 2;
      seg.push(new M.Line({ start: pt(a), end: pt(mid), color, strokeWidth: 2 }), new M.Line({ start: pt(mid), end: pt(b), color, strokeWidth: 2 }));
    }
    return new M.VGroup(...seg);
  }
  function cell(x, y, color = C.cyan) {
    const r = new M.Rectangle({ width: CW, height: CH, color, strokeWidth: 2 });
    r.setFill(C.card, 0.7); r.setStrokeOpacity(0.45); r.moveTo([x, y, 0]); return r;
  }
  function makeRow(r) {
    const y = ROWY[r];
    const cells = REAL.map((_, k) => cell(colx(k), y));
    const reals = REALK.map(k => txt(REAL[k], colx(k), y, C.cyan));
    const rings = GAPK.map(k => ring(colx(k), y));
    const all = [...cells, ...reals, ...rings];
    let label = null;
    if (r) {
      const at = P ? [colx(0) - CW / 2 + 0.36, y + CH / 2 + 0.2] : [colx(0) - CW / 2 - 0.5, y];
      label = txt(`copy ${r}`, at[0], at[1], C.muted, LS, false, false); all.push(label);
    }
    return { cells, reals, rings, label, all };
  }
  const header = () => REAL.map((_, k) => txt(`bed ${k + 1}`, colx(k), HEADY, C.muted, LS, false, false));

  // 0-2 six beds, four readings, two gaps
  const head = header(), row0 = makeRow(0);
  await until(S(0)); await play(new M.LaggedStart([...head, ...row0.cells].map(o => new M.FadeIn(o)), { lagRatio: 0.08, runTime: 1.2 }), ...say('6 PLANT BEDS · NOON'));
  await until(S(1)); await play(new M.LaggedStart(row0.reals.map(t => new M.FadeIn(t)), { lagRatio: 0.35, runTime: 2.4 }), ...say('READINGS: 19 · 31 · 19 · 31'));
  await until(S(2)); await play(...fin(row0.rings), ...say('BEDS 2 AND 5: MISSING (RADIO GLITCH)', C.pink));

  // 3-5 last time: one guess, the mean
  const m25 = GAPK.map(k => txt(25, colx(k), ROWY[0], C.amber));
  await until(S(3)); await play(...fin(m25), ...say('LAST TIME: BOTH GAPS = MEAN 25', C.amber));
  await until(S(4)); await play(...fbox(['mean   = 25  (still right)', ['spread ≈ 6.9 → 5.4', C.pink]], C.pink), ...say('TOO SURE OF ITSELF', C.pink));
  const qs = GAPK.map(k => txt('?', colx(k), ROWY[0], C.pink));
  await until(S(5)); await play(...m25.map((t, i) => new M.ReplacementTransform(t, qs[i])), ...boxOut(), ...say('WE PRETENDED TO KNOW THEM. WE DON’T.', C.pink));

  // 6-8 several believable guesses = plausible values
  const guesses = GAPK.map(k => txt('? ? ?', colx(k), ROWY[0], C.green, P ? 13 : 14));
  await until(S(6)); await play(...qs.map((q, i) => new M.ReplacementTransform(q, guesses[i])), ...say('SEVERAL BELIEVABLE GUESSES', C.green));
  await until(S(7)); await play(new M.LaggedStart([0, 2, 1, 3].map(i => new M.Indicate(row0.reals[i], { color: i === 0 || i === 2 ? C.cyan : C.amber })), { lagRatio: 0.35, runTime: 2.6 }), ...say('LIKE THE REAL ONES: 19 COOL · 31 WARM', C.green));
  await until(S(8)); await play(...guesses.map(g => new M.Indicate(g, { color: C.green })), ...say('PLAUSIBLE VALUE = A BELIEVABLE GUESS', C.green));

  // 9-12 three copies, each with its own plausible fills
  const rows = [1, 2, 3].map(r => makeRow(r));
  await until(S(9));
  await play(...guesses.map(g => new M.FadeOut(g)), ...say('3 COPIES OF THE TABLE', C.green),
    new M.LaggedStart(rows.map(rw => new M.LaggedStart(rw.all.map(o => new M.FadeIn(o)), { lagRatio: 0.02 })), { lagRatio: 0.4, runTime: 2.4 }));
  const fills = [];
  for (let r = 0; r < 3; r++) {
    await until(S(10 + r));
    const f = GAPK.map((k, i) => txt(FILLS[r][i], colx(k), ROWY[r + 1], C.green));
    fills.push(f);
    await play(...fin(f), ...f.map(t => new M.Flash(t, { color: C.green, flashRadius: 0.35 })), ...say(`COPY ${r + 1}: ${FILLS[r][0]} AND ${FILLS[r][1]}`, C.green));
  }

  // 13-20 the same calculation on every copy
  const meanHead = txt('mean', MX, HEADY, C.amber, LS, false, false);
  const mcells = [1, 2, 3].map(r => cell(MX, ROWY[r], C.amber));
  await until(S(13)); await play(...fin([meanHead, ...mcells]), ...say('SAME CALCULATION ON EVERY COPY', C.amber));
  await until(S(14));
  await play(new M.LaggedStart(rows.flatMap(rw => rw.reals).map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.06, runTime: 1.8 }),
    ...fbox(['real readings', '19 + 31 + 19 + 31', ['= 100', C.cyan]], C.cyan));
  const means = [];
  for (let r = 0; r < 3; r++) {
    const [a, b] = FILLS[r];
    await until(S(15 + 2 * r));
    await play(...fills[r].map(t => new M.Indicate(t, { color: C.green })), ...fbox([`copy ${r + 1}`, `100 + ${a} + ${b}`, [`= ${SUMS[r]}`, C.amber]], C.amber));
    await until(S(16 + 2 * r));
    const m = txt(MEANS[r], MX, ROWY[r + 1], C.amber); means.push(m);
    await play(new M.FadeIn(m), new M.Flash(m, { color: C.amber, flashRadius: 0.35 }), ...fbox([`copy ${r + 1}`, `100 + ${a} + ${b} = ${SUMS[r]}`, [`${SUMS[r]} ÷ 6 = ${MEANS[r]}`, C.amber]], C.amber));
  }

  // 21-23 step one: average the answers
  await until(S(21)); await play(new M.LaggedStart(means.map(m => new M.Indicate(m, { color: C.amber })), { lagRatio: 0.3, runTime: 1.8 }), ...boxOut(), ...say('3 COPIES → 3 ANSWERS: 24 · 25 · 26', C.amber));
  await until(S(22)); await play(...say('STEP 1: AVERAGE THE 3 ANSWERS', C.amber));
  await until(S(23)); await play(...fbox(['24 + 25 + 26 = 75'], C.amber));
  await until(S(23) + 3.8); await play(...fbox(['24 + 25 + 26 = 75', '75 ÷ 3 = 25', ['estimate = 25', C.amber]], C.amber));

  // 24-25 step two: how much the answers disagree
  const NLW = P ? 5.2 : 3.4, NY = P ? 3.2 : -0.6, n2x = v => BOXP[0] + (v - 25) / 4 * NLW;
  const nline = new M.Line({ start: [n2x(23), NY, 0], end: [n2x(27), NY, 0], color: C.muted, strokeWidth: 3 });
  const nticks = [23, 24, 25, 26, 27].flatMap(v => [new M.Line({ start: [n2x(v), NY - 0.07, 0], end: [n2x(v), NY + 0.07, 0], color: C.muted }), txt(v, n2x(v), NY - 0.35, C.muted, P ? 16 : 17, true, false)]);
  const ndots = MEANS.map(v => new M.Dot({ point: [n2x(v), NY, 0], radius: 0.11, color: v === 25 ? C.amber : C.green }));
  const narrows = [24, 26].map(v => new M.Arrow({ start: [n2x(25) + Math.sign(v - 25) * 0.1, NY + 0.42, 0], end: [n2x(v), NY + 0.42, 0], color: C.violet, buff: 0 }));
  const nlabs = [['−1', 24.5], ['+1', 25.5]].map(([s, v]) => txt(s, n2x(v), NY + 0.75, C.violet, P ? 17 : 18));
  await until(S(24));
  await play(...boxOut(), new M.Create(nline), ...fin(nticks), new M.LaggedStart(ndots.map(d => new M.FadeIn(d)), { lagRatio: 0.3, runTime: 1.2 }), ...say('STEP 2: HOW MUCH DO THE ANSWERS DISAGREE?', C.violet));
  await until(S(24) + 3.0); await play(...fin([...narrows, ...nlabs]));
  await until(S(25)); await play(new M.LaggedStart(fills.flat().map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.12, runTime: 2.2 }), ...say('DISAGREEMENT = DOUBT FROM THE GAPS', C.violet));

  // 26-29 uncertainty: usual, plus the disagreement
  const UX0 = P ? -3.5 : -6.2, UX1 = P ? 3.5 : 1.6, u2x = v => UX0 + (v - 15) / 20 * (UX1 - UX0);
  const AX = P ? -2.8 : -2.5, BY = P ? -0.9 : -1.2, MY = P ? 0.7 : -0.1, LX = P ? -2.5 : -5.0, US = P ? 15 : 16;
  const bar = (v0, v1, y, color, op, hh = 0.34) => { const r = new M.Rectangle({ width: u2x(v1) - u2x(v0), height: hh, color, strokeWidth: 2 }); r.setFill(color, op); r.moveTo([(u2x(v0) + u2x(v1)) / 2, y, 0]); return r; };
  const axis = new M.Line({ start: [UX0, AX, 0], end: [UX1, AX, 0], color: C.muted, strokeWidth: 3 });
  const axT = [19, 25, 31].flatMap(v => [new M.Line({ start: [u2x(v), AX - 0.07, 0], end: [u2x(v), AX + 0.07, 0], color: C.muted }), txt(v, u2x(v), AX - 0.35, C.muted, 17, true, false)]);
  const deg = txt('°C', UX1 - 0.15, AX - 0.35, C.muted, 16, false, false);
  const est = new M.Dot({ point: [u2x(25), BY, 0], radius: 0.11, color: C.amber });
  const estLab = txt('estimate 25 °C', u2x(25), BY + 0.6, C.amber, US, false, true);
  const arrows = [-1, 1].map(sg => new M.Arrow({ start: [u2x(25) + sg * 0.18, BY, 0], end: [u2x(25 + sg * 2.5), BY, 0], color: C.violet, buff: 0 }));
  const arrLab = txt('might be this far off', u2x(25), BY - 0.5, C.violet, US, false, false);
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(...head, ...row0.all, ...rows.flatMap(rw => rw.all), ...fills.flat(), meanHead, ...mcells, ...means, nline, ...nticks, ...ndots, ...narrows, ...nlabs)),
    ...say('UNCERTAINTY: HOW FAR FROM THE TRUTH?', C.violet));
  if (P) BOXP = [0, -4.9, 0];                               // phone: formula cards below the picture from here on
  await play(new M.Create(axis), ...fin([...axT, deg, est, estLab, ...arrows, arrLab]));

  const band = bar(23, 27, BY, C.cyan, 0.22);
  const est2 = new M.Dot({ point: [u2x(25), BY, 0], radius: 0.11, color: C.amber });
  const usualLab = txt('usual uncertainty', u2x(25), BY - 0.5, C.cyan, US, false, false);
  const readDots = [19, 19, 31, 31].map((v, i) => new M.Dot({ point: [u2x(v), AX + 0.25 + (i % 2) * 0.3, 0], radius: 0.09, color: C.cyan }));
  await until(S(27));
  await play(new M.FadeOut(new M.VGroup(...arrows, arrLab, est)), new M.FadeIn(band), new M.FadeIn(est2), new M.FadeIn(usualLab),
    new M.LaggedStart(readDots.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 1.4 }), ...say('USUAL UNCERTAINTY: READINGS VARY BED TO BED', C.cyan));
  const ext = [bar(22.3, 23, BY, C.green, 0.4), bar(27, 27.7, BY, C.green, 0.4)];
  const extLab = txt('+ disagreement', u2x(27.7) + (P ? 0.95 : 1.0), BY, C.green, US, false, true);
  await until(S(28)); await play(...fin([...ext, extLab]), ...say('+ DISAGREEMENT BETWEEN COPIES', C.green));
  const outline = new M.Rectangle({ width: u2x(27.7) - u2x(22.3) + 0.2, height: 0.58, color: C.amber, strokeWidth: 2 });
  outline.moveTo([u2x(25), BY, 0]);
  await until(S(29)); await play(new M.Create(outline), new M.Indicate(estLab, { color: C.amber }), ...say('FINAL: 25 °C, SLIGHTLY WIDER INTERVAL', C.amber));

  // 30-35 the name, real practice, the recipe
  await until(S(30)); await play(...fbox(['one fill:   mean imputation', ['many fills: multiple imputation', C.green]], C.green), ...say('MULTIPLE = MANY FILLS INSTEAD OF ONE', C.green));
  const icons = Array.from({ length: 20 }, (_, i) => {
    const x = P ? -3.15 + (i % 10) * 0.7 : -6.0 + i * 0.37, y = P ? 0.75 - Math.floor(i / 10) * 0.7 : 0.75;
    const w = P ? 0.5 : 0.28, hh = P ? 0.42 : 0.36, col = i < 5 ? C.green : C.cyan;
    const r = new M.Rectangle({ width: w, height: hh, color: col, strokeWidth: 2 }); r.setFill(col, i < 5 ? 0.35 : 0.12); r.moveTo([x, y, 0]);
    const l1 = new M.Line({ start: [x - w / 2, y + hh / 6, 0], end: [x + w / 2, y + hh / 6, 0], color: col, strokeWidth: 1 });
    const l2 = new M.Line({ start: [x - w / 2, y - hh / 6, 0], end: [x + w / 2, y - hh / 6, 0], color: col, strokeWidth: 1 });
    return new M.VGroup(r, l1, l2);
  });
  const ix = i => P ? -3.15 + (i % 10) * 0.7 : -6.0 + i * 0.37;
  const lab5 = txt('5', ix(4), P ? 1.17 : 0.3, C.green, 16);
  const lab20 = txt('20', ix(19), P ? -0.4 : 0.3, C.cyan, 16);
  await until(S(31)); await play(new M.LaggedStart(icons.map(i => new M.FadeIn(i)), { lagRatio: 0.15, runTime: 2.5 }), new M.FadeIn(lab5), new M.FadeIn(lab20), ...say('REAL WORK: 5 TO 20 COPIES, RANDOM FILLS', C.amber));
  await until(S(32)); await play(new M.FadeOut(new M.VGroup(...icons, lab5, lab20)), ...fbox(['1  fill gaps several plausible ways', '2  analyse each copy', ['3  combine', C.amber]]), ...say('IN SHORT: FILL · ANALYSE · COMBINE', C.cyan));
  await until(S(33)); await play(...fbox(['analyse each copy =', 'the same calculation', ['here the mean: 24, 25, 26', C.amber]]));
  await until(S(34)); await play(new M.Indicate(est2, { color: C.amber }), ...fbox(['estimate = average of answers', ['(24 + 25 + 26) ÷ 3 = 25', C.amber]], C.amber));
  await until(S(35)); await play(new M.Indicate(band, { color: C.cyan }), ...ext.map(e => new M.Indicate(e, { color: C.green })), ...fbox(['total uncertainty', ['= usual uncertainty', C.cyan], ['+ disagreement', C.green]], C.green));

  // 36-38 compare with mean imputation
  const miLab = txt('mean imputation', LX, MY, C.pink, US, false, true);
  const mband = bar(23.8, 26.2, MY, C.pink, 0.2, 0.3);
  const mest = new M.Dot({ point: [u2x(25), MY, 0], radius: 0.11, color: C.amber });
  const multLab = txt('multiple imputation', LX, BY, C.green, US, false, true);
  const estTop = txt('estimate 25 °C (both)', u2x(25), MY + 0.55, C.amber, US, false, true);
  await until(S(36)); await play(...boxOut(), new M.Transform(estLab, estTop), new M.FadeIn(miLab), new M.FadeIn(mband), new M.FadeIn(mest), new M.FadeIn(multLab), ...say('MEAN IMPUTATION: 25, NO SIGN OF GAPS', C.pink));
  await until(S(37)); await play(...ext.map(e => new M.Indicate(e, { color: C.green })), new M.Indicate(extLab, { color: C.green }), ...say('MULTIPLE IMPUTATION: 25 + HONEST EXTRA DOUBT', C.green));
  await until(S(38)); await play(...say('FOR: HONEST ESTIMATES FROM DATA WITH GAPS', C.green));

  // 39-40 the trap: averaging the tables into one
  const head2 = header(), meanHead2 = txt('mean', MX, HEADY, C.amber, LS, false, false);
  const rowsB = [1, 2, 3].map(r => makeRow(r));
  const fillsB = FILLS.map((f, r) => GAPK.map((k, i) => txt(f[i], colx(k), ROWY[r + 1], C.green)));
  const mcellsB = [1, 2, 3].map(r => cell(MX, ROWY[r], C.amber));
  const meansB = MEANS.map((v, r) => txt(v, MX, ROWY[r + 1], C.amber));
  await until(S(39));
  await play(new M.FadeOut(new M.VGroup(axis, ...axT, deg, est2, estLab, band, usualLab, ...readDots, ...ext, extLab, outline, miLab, mband, mest, multLab)),
    ...fin([...head2, meanHead2, ...rowsB.flatMap(rw => rw.all), ...mcellsB, ...fillsB.flat(), ...meansB]), ...say('TRAP: AVERAGE THE TABLES INTO ONE', C.pink));
  const avg = [['20.3', 1], ['29.7', 4]].map(([s, k]) => txt(s, colx(k), ROWY[2], C.pink, P ? 17 : 19));
  const oneAt = P ? [colx(0) - CW / 2 + 0.5, ROWY[2] + CH / 2 + 0.2] : [colx(0) - CW / 2 - 0.5, ROWY[2]];
  const oneLab = txt(P ? 'one table' : 'one', oneAt[0], oneAt[1], C.pink, LS, false, true);
  await until(S(39) + 2.0);
  await play(new M.FadeOut(new M.VGroup(...rowsB[0].all, ...fillsB[0], mcellsB[0], meansB[0]), { shift: [0, ROWY[2] - ROWY[1], 0] }),
    new M.FadeOut(new M.VGroup(...rowsB[2].all, ...fillsB[2], mcellsB[2], meansB[2]), { shift: [0, ROWY[2] - ROWY[3], 0] }),
    ...fillsB[1].map((t, i) => new M.ReplacementTransform(t, avg[i])), new M.FadeOut(rowsB[1].label), new M.FadeIn(oneLab));
  await until(S(40)); await play(new M.Indicate(meansB[1], { color: C.pink }), ...fbox(['one table → one answer: 25', ['disagreement = 0', C.pink], 'false certainty'], C.pink), ...say('DISAGREEMENT THROWN AWAY → FALSE CERTAINTY', C.pink));

  // 41 fills must be plausible
  const row0b = makeRow(0);
  await until(S(41));
  await play(new M.FadeOut(new M.VGroup(...rowsB[1].cells, ...rowsB[1].reals, ...rowsB[1].rings, ...avg, oneLab, mcellsB[1], meansB[1], meanHead2)), ...boxOut(),
    ...fin(row0b.all), ...say('FILLS MUST BE PLAUSIBLE', C.green));
  await until(S(41) + 2.0); await play(new M.LaggedStart(row0b.rings.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }), ...say('GAPS NOT RANDOM? FILLS MUST ACCOUNT FOR WHY', C.amber));

  // 42 one sentence
  await until(S(42));
  await play(...row0b.rings.map(g => new M.Indicate(g, { color: C.green })), ...fbox(['3 believable fills', '→ answers 24, 25, 26', ['→ 25, honest wider interval', C.green]], C.green),
    ...say('SEVERAL FILLS → HONEST, WIDER UNCERTAINTY', C.green));
}

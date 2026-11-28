// 10.2.9 Heteroskedasticity: when errors spread out.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);

  const CARDS = [
    { id: 'A', area: 40, nb: 'Cedar',   rent: 980,  fit: 1000, res: -20, off:  0 },
    { id: 'B', area: 40, nb: 'Cedar',   rent: 1000, fit: 1000, res:   0, off: -1 },
    { id: 'C', area: 40, nb: 'Station', rent: 1000, fit: 1000, res:   0, off:  1 },
    { id: 'D', area: 40, nb: 'Station', rent: 1020, fit: 1000, res:  20, off:  0 },
    { id: 'E', area: 50, nb: 'Cedar',   rent: 1060, fit: 1100, res: -40, off:  0 },
    { id: 'F', area: 50, nb: 'Cedar',   rent: 1100, fit: 1100, res:   0, off: -1 },
    { id: 'G', area: 50, nb: 'Station', rent: 1100, fit: 1100, res:   0, off:  1 },
    { id: 'H', area: 50, nb: 'Station', rent: 1140, fit: 1100, res:  40, off:  0 },
    { id: 'I', area: 60, nb: 'Cedar',   rent: 1320, fit: 1400, res: -80, off:  0 },
    { id: 'J', area: 60, nb: 'Cedar',   rent: 1400, fit: 1400, res:   0, off: -1 },
    { id: 'K', area: 60, nb: 'Cedar',   rent: 1400, fit: 1400, res:   0, off:  1 },
    { id: 'L', area: 60, nb: 'Cedar',   rent: 1480, fit: 1400, res:  80, off:  0 },
  ];

  // Layout bounds: laptop y in [-3.0, 2.3], phone y in [-5.5, 4.3]
  const PX0 = P ? -2.70 : -5.55, PX1 = P ? 3.45 : 1.25;
  const PY0 = P ? -4.55 : -2.25, PY1 = P ? 1.10 : 1.25;
  const CX = (PX0 + PX1) / 2, CY = (PY0 + PY1) / 2;
  const PILL = P ? [0, 1.88, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.45, -0.45, 0];
  const DX = P ? 0.14 : 0.13;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Coordinate maps
  const a2x = a => PX0 + (a - 35) / 30 * (PX1 - PX0);
  const r2y = r => PY0 + (r - 920) / 620 * (PY1 - PY0);
  const f2x = f => PX0 + (f - 930) / 550 * (PX1 - PX0);
  const res2y = e => PY0 + (e + 108) / 216 * (PY1 - PY0);

  // Formula box: one box at a time, never over data
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.39 : 0.41;
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
    const maxw = P ? FW - 0.9 : 4.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Cedar = cyan circle, Station = amber square (with soft glow halo)
  function makeMark(nb, p) {
    const col = nb === 'Cedar' ? C.cyan : C.amber;
    const halo = new M.Dot({ point: p, radius: 0.21, color: col });
    halo.setFill(col, 0.18);
    let shape;
    if (nb === 'Cedar') {
      shape = new M.Dot({ point: p, radius: 0.095, color: col });
    } else {
      shape = new M.Rectangle({ width: 0.17, height: 0.17, color: col, strokeWidth: 1.5 });
      shape.setFill(col, 1);
      shape.moveTo(p);
    }
    return new M.VGroup(halo, shape);
  }

  function makeLegend() {
    const lx = PX0 + 0.35, ly = PY1 - 0.22;
    const cDot = new M.Dot({ point: [lx, ly, 0], radius: 0.08, color: C.cyan });
    const cTxt = T('Cedar', P ? 14 : 15, C.cyan);
    cTxt.moveTo([lx + 0.18 + cTxt.getWidth() / 2, ly, 0]);
    const sx = lx + 1.35;
    const sSq = new M.Rectangle({ width: 0.14, height: 0.14, color: C.amber, strokeWidth: 1.5 });
    sSq.setFill(C.amber, 1); sSq.moveTo([sx, ly, 0]);
    const sTxt = T('Station', P ? 14 : 15, C.amber);
    sTxt.moveTo([sx + 0.18 + sTxt.getWidth() / 2, ly, 0]);
    return new M.VGroup(cDot, cTxt, sSq, sTxt);
  }

  // 0: how far a rent prediction usually misses
  const pLine = new M.DashedLine({ start: [CX - 1.9, CY - 0.35, 0], end: [CX + 1.9, CY - 0.35, 0], color: C.green });
  const pLab = T('predicted rent', P ? 16 : 17, C.green); pLab.moveTo([CX + 1.1, CY - 0.65, 0]);
  const aDot = makeMark('Cedar', [CX, CY + 0.65, 0]);
  const aLab = T('asking rent', P ? 16 : 17, C.cyan); aLab.moveTo([CX, CY + 1.0, 0]);
  const gBar = new M.Line({ start: [CX, CY - 0.35, 0], end: [CX, CY + 0.56, 0], color: C.amber, strokeWidth: 3.5 });
  const gTag = T('miss = ?', P ? 18 : 19, C.amber, true, true); gTag.moveTo([CX + 0.95, CY + 0.12, 0]);
  const intro0 = new M.VGroup(pLine, pLab, gBar, aDot, aLab, gTag);
  await until(S(0));
  await play(new M.FadeIn(intro0, { runTime: 1.0 }), ...say('HOW FAR DOES A PREDICTION MISS?'));

  // 1: same size misses for small and large apartments?
  const sX = CX - (P ? 1.55 : 1.75), lX = CX + (P ? 1.45 : 1.65);
  const sBox = new M.RoundedRectangle({ width: 1.15, height: 0.95, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2.5 });
  sBox.setFill(C.card, 0.92); sBox.moveTo([sX, CY + 0.2, 0]);
  const sTxt = T('Small\n40 m²', P ? 16 : 17, C.cyan, true); sTxt.moveTo([sX, CY + 0.2, 0]);
  const sGap = new M.Line({ start: [sX + 0.85, CY - 0.15, 0], end: [sX + 0.85, CY + 0.55, 0], color: C.amber, strokeWidth: 3.5 });
  const sQ = T('?', 20, C.amber, true, true); sQ.moveTo([sX + 1.12, CY + 0.2, 0]);

  const lBox = new M.RoundedRectangle({ width: 1.7, height: 1.35, cornerRadius: 0.1, color: C.pink, strokeWidth: 2.5 });
  lBox.setFill(C.card, 0.92); lBox.moveTo([lX, CY + 0.2, 0]);
  const lTxt = T('Large\n60 m²', P ? 16 : 17, C.pink, true); lTxt.moveTo([lX, CY + 0.2, 0]);
  const lGap = new M.Line({ start: [lX + 1.12, CY - 0.35, 0], end: [lX + 1.12, CY + 0.75, 0], color: C.amber, strokeWidth: 3.5 });
  const lQ = T('?', 20, C.amber, true, true); lQ.moveTo([lX + 1.38, CY + 0.2, 0]);
  const intro1 = new M.VGroup(sBox, sTxt, sGap, sQ, lBox, lTxt, lGap, lQ);
  await until(S(1));
  await play(new M.FadeOut(intro0, { runTime: 0.5 }), ...say('SAME MISS FOR SMALL AND LARGE?', C.amber));
  await play(new M.FadeIn(intro1, { runTime: 0.9 }));

  // 2: 12 listings grouped by floor area (Rent vs Area)
  const rAxisX = new M.Line({ start: [PX0, PY0, 0], end: [PX1, PY0, 0], color: C.muted, strokeWidth: 2.5 });
  const rAxisY = new M.Line({ start: [PX0, PY0, 0], end: [PX0, PY1, 0], color: C.muted, strokeWidth: 2.5 });
  const rTicks = [];
  for (const a of [40, 50, 60]) {
    const x = a2x(a);
    rTicks.push(new M.Line({ start: [x, PY0 - 0.08, 0], end: [x, PY0 + 0.08, 0], color: C.muted, strokeWidth: 2 }));
    const t = T(`${a} m²`, P ? 15 : 16, C.muted, true); t.moveTo([x, PY0 - 0.32, 0]); rTicks.push(t);
  }
  for (const r of [1000, 1200, 1400]) {
    const y = r2y(r);
    const gl = new M.Line({ start: [PX0, y, -0.01], end: [PX1, y, -0.01], color: C.line, strokeWidth: 1 });
    gl.setStrokeOpacity(0.5); rTicks.push(gl);
    rTicks.push(new M.Line({ start: [PX0 - 0.08, y, 0], end: [PX0 + 0.08, y, 0], color: C.muted, strokeWidth: 2 }));
    const t = T(`$${r.toLocaleString()}`, P ? 13 : 15, C.muted, true);
    t.moveTo([PX0 - 0.16 - t.getWidth() / 2, y, 0]); rTicks.push(t);
  }
  const rXLab = T('Floor area (square metres)', P ? 15 : 16, C.muted);
  rXLab.moveTo([CX, PY0 - 0.66, 0]);
  const rYLab = T('Rent ($)', P ? 14 : 15, C.muted);
  rYLab.moveTo([PX0 + 0.45, PY1 + 0.16, 0]);
  const rLegend = makeLegend();
  const rAxesGroup = new M.VGroup(rAxisX, rAxisY, ...rTicks, rXLab, rYLab, rLegend);
  const rDots = CARDS.map(c => makeMark(c.nb, [a2x(c.area) + c.off * DX, r2y(c.rent), 0]));

  await until(S(2));
  await play(new M.FadeOut(intro1, { runTime: 0.45 }), ...say('12 LISTINGS BY FLOOR AREA'));
  await play(
    new M.FadeIn(rAxesGroup, { runTime: 0.7 }),
    new M.LaggedStart(rDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.2 })
  );

  // 3: curved rule passes through the average rent for each size
  const curveSegs = [];
  const NSEG = 24;
  for (let i = 0; i < NSEG; i++) {
    const a1 = 38 + 24 * i / NSEG, a2 = 38 + 24 * (i + 1) / NSEG;
    const y1 = 1000 + (a1 - 40) * (a1 - 40), y2 = 1000 + (a2 - 40) * (a2 - 40);
    curveSegs.push(new M.Line({ start: [a2x(a1), r2y(y1), -0.005], end: [a2x(a2), r2y(y2), -0.005], color: C.green, strokeWidth: 3 }));
  }
  const fitPts = [[40, 1000], [50, 1100], [60, 1400]];
  const fitMarks = fitPts.map(([a, f]) => {
    const c = new M.Circle({ radius: 0.14, color: C.green, strokeWidth: 2.5 });
    c.setFill(C.bg, 0.3); c.moveTo([a2x(a), r2y(f), 0.01]);
    return c;
  });
  await until(S(3));
  await play(
    new M.LaggedStart(curveSegs.map(s => new M.Create(s)), { lagRatio: 0.05, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...fitMarks), { runTime: 0.8 }),
    ...say('CURVED RULE THROUGH GROUP AVERAGES', C.green)
  );

  // 4: predicted rent is called its fitted rent
  const fitTag = T('fitted curve', P ? 15 : 16, C.green, true);
  fitTag.moveTo([a2x(54.8), r2y(1170), 0]);
  await until(S(4));
  await play(
    new M.FadeIn(fitTag, { runTime: 0.6 }),
    new M.LaggedStart(fitMarks.map(m => new M.Indicate(m, { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('PREDICTED RENT = FITTED RENT', C.green)
  );

  // 5: fitted amounts are 1,000, 1,100, and 1,400 dollars
  // labels right of each group, clear of the dot glows and the curve
  const fitLab = (s, a, dy) => { const t = T(s, P ? 15 : 16, C.green, true); return t.moveTo([a2x(a) + 0.34 + t.getWidth() / 2, r2y(a === 40 ? 1000 : a === 50 ? 1100 : 1400) + dy, 0]); };
  const fitLabs = [fitLab('$1,000', 40, -0.30), fitLab('$1,100', 50, -0.30), fitLab('$1,400', 60, 0)];
  await until(S(5));
  await play(
    new M.LaggedStart(fitLabs.map(t => new M.FadeIn(t)), { lagRatio: 0.35, runTime: 1.5 }),
    ...fbox([['fitted rent', C.green], '40 m² → $1,000', '50 m² → $1,100', '60 m² → $1,400'], C.green),
    ...say('FITTED: $1,000 · $1,100 · $1,400', C.green)
  );

  // 6: repeated sentence reinforcing the three fitted amounts
  await until(S(6));
  await play(
    new M.LaggedStart(fitLabs.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.35, runTime: 1.6 }),
    ...say('ONE FITTED RENT PER SIZE', C.green)
  );

  // 7: signed gap from fitted rent to asking rent for each dot
  const gapLines = [];
  const gapLabels = [];
  CARDS.forEach(c => {
    if (c.res === 0) return;
    const x = a2x(c.area), y0 = r2y(c.fit), y1 = r2y(c.rent);
    const col = c.res > 0 ? C.green : C.pink;
    gapLines.push(new M.Line({ start: [x, y0, 0.005], end: [x, y1, 0.005], color: col, strokeWidth: 3.5 }));
    const txt = T(c.res > 0 ? `+${c.res}` : `−${Math.abs(c.res)}`, P ? 14 : 15, col, true);
    txt.moveTo([x - 0.42, (y0 + y1) / 2, 0]);
    gapLabels.push(txt);
  });
  await until(S(7));
  await play(
    new M.LaggedStart(gapLines.map(ln => new M.Create(ln)), { lagRatio: 0.12, runTime: 1.3 }),
    ...say('GAP = ASKING RENT − FITTED RENT', C.amber)
  );

  // 8: that gap is the residual, positive above and negative below
  await until(S(8));
  await play(
    new M.LaggedStart(gapLabels.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.2 }),
    ...fbox([['residual = asking − fitted', C.ink], ['+ above fitted curve', C.green], ['− below fitted curve', C.pink]], C.cyan),
    ...say('RESIDUAL: + ABOVE, − BELOW')
  );

  // 9: a listing with the predicted rent has a residual of zero
  const zeroRentDots = [rDots[1], rDots[2], rDots[5], rDots[6], rDots[9], rDots[10]];
  await until(S(9));
  await play(
    new M.LaggedStart(zeroRentDots.map(d => new M.Flash(d, { color: C.amber, flashRadius: 0.18, lineLength: 0.15 })), { lagRatio: 0.1, runTime: 1.2 }),
    ...fbox([['residual = asking − fitted', C.ink], ['+ above fitted curve', C.green], ['− below fitted curve', C.pink], ['0 on fitted curve', C.amber]], C.cyan),
    ...say('ON THE CURVE → RESIDUAL = 0', C.amber)
  );

  // 10: place fitted rent along the bottom and residual up the side
  const resAxisX = new M.Line({ start: [PX0, PY0, 0], end: [PX1, PY0, 0], color: C.muted, strokeWidth: 2.5 });
  const resAxisY = new M.Line({ start: [PX0, PY0, 0], end: [PX0, PY1, 0], color: C.muted, strokeWidth: 2.5 });
  const zeroLine = new M.DashedLine({ start: [PX0, res2y(0), -0.005], end: [PX1, res2y(0), -0.005], color: C.muted });
  const resTicks = [];
  for (const f of [1000, 1100, 1400]) {
    const x = f2x(f);
    resTicks.push(new M.Line({ start: [x, PY0 - 0.08, 0], end: [x, PY0 + 0.08, 0], color: C.muted, strokeWidth: 2 }));
    const t = T(`$${f.toLocaleString()}`, P ? 14 : 15, C.muted, true);
    t.moveTo([x, PY0 - 0.32, 0]); resTicks.push(t);
  }
  for (const e of [-80, -40, 0, 40, 80]) {
    const y = res2y(e);
    if (e !== 0) {
      const gl = new M.Line({ start: [PX0, y, -0.01], end: [PX1, y, -0.01], color: C.line, strokeWidth: 1 });
      gl.setStrokeOpacity(0.45); resTicks.push(gl);
    }
    resTicks.push(new M.Line({ start: [PX0 - 0.08, y, 0], end: [PX0 + 0.08, y, 0], color: C.muted, strokeWidth: 2 }));
    const txt = e > 0 ? `+${e}` : (e < 0 ? `−${Math.abs(e)}` : '0');
    const t = T(txt, P ? 14 : 15, e === 0 ? C.ink : C.muted, true);
    t.moveTo([PX0 - 0.16 - t.getWidth() / 2, y, 0]); resTicks.push(t);
  }
  const resXLab = T('Fitted rent ($)', P ? 15 : 16, C.muted);
  resXLab.moveTo([CX, PY0 - 0.66, 0]);
  const resYLab = T('Residual ($)', P ? 14 : 15, C.muted);
  resYLab.moveTo([PX0 + 0.62, PY1 + 0.16, 0]);
  const resLegend = makeLegend();
  const resAxesGroup = new M.VGroup(resAxisX, resAxisY, ...resTicks, resXLab, resYLab, resLegend);
  const resDots = CARDS.map(c => makeMark(c.nb, [f2x(c.fit) + c.off * DX, res2y(c.res), 0]));

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(rAxesGroup, ...rDots, ...curveSegs, ...fitMarks, fitTag, ...fitLabs, ...gapLines, ...gapLabels), { runTime: 0.65 }),
    ...fbox([['residual plot', C.cyan], 'bottom: fitted rent', 'side:   residual ($)'], C.cyan),
    ...say('FITTED RENT vs RESIDUAL')
  );
  await play(
    new M.FadeIn(resAxesGroup, { runTime: 0.6 }),
    new M.Create(zeroLine, { runTime: 0.6 }),
    new M.LaggedStart(resDots.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 1.0 })
  );

  // 11: every size group has its average residual on the zero line
  const bandW = P ? 0.52 : 0.56;
  const avgBars = [1000, 1100, 1400].map(f => {
    const x = f2x(f);
    return new M.Line({ start: [x - bandW / 2 - 0.04, res2y(0), 0.01], end: [x + bandW / 2 + 0.04, res2y(0), 0.01], color: C.amber, strokeWidth: 4.5 });
  });
  await until(S(11));
  await play(
    new M.LaggedStart(avgBars.map(b => new M.Create(b)), { lagRatio: 0.2, runTime: 1.1 }),
    ...fbox([['group average residual', C.amber], 'Small:  0', 'Medium: 0', 'Large:  0'], C.amber),
    ...say('ALL THREE GROUP AVERAGES = 0', C.amber)
  );

  // Helper to build a vertical spread band with top/bottom caps
  function makeBand(fit, half, col) {
    const x = f2x(fit), h = res2y(half) - res2y(-half);
    const rect = new M.Rectangle({ width: bandW, height: h, color: col, strokeWidth: 2 });
    rect.setFill(col, 0.2); rect.moveTo([x, res2y(0), -0.008]);
    const top = new M.Line({ start: [x - bandW / 2, res2y(half), 0.005], end: [x + bandW / 2, res2y(half), 0.005], color: col, strokeWidth: 3 });
    const bot = new M.Line({ start: [x - bandW / 2, res2y(-half), 0.005], end: [x + bandW / 2, res2y(-half), 0.005], color: col, strokeWidth: 3 });
    return new M.VGroup(rect, top, bot);
  }

  // 12-14: small apartments (-20, 0, 0, +20), draw band, $40
  const smDots = resDots.slice(0, 4);
  const mdDots = resDots.slice(4, 8);
  const lgDots = resDots.slice(8, 12);
  await until(S(12));
  await play(
    new M.LaggedStart(smDots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.22, runTime: 1.6 }),
    ...fbox([['Small ($1,000)', C.cyan], 'gaps: −20, 0, 0, +20'], C.cyan),
    ...say('SMALL: −20, 0, 0, +20', C.cyan)
  );

  const smBand = makeBand(1000, 20, C.cyan);
  await until(S(13));
  await play(new M.FadeIn(smBand, { runTime: 0.9 }), ...say('BAND = LOWEST TO HIGHEST', C.cyan));

  const smWLab = T('$40', P ? 16 : 17, C.cyan, true, true);
  smWLab.moveTo([f2x(1000), res2y(20) + 0.26, 0]);
  await until(S(14));
  await play(
    new M.FadeIn(smWLab, { runTime: 0.7 }),
    ...fbox([['Small ($1,000)', C.cyan], 'gaps: −20, 0, 0, +20', ['band = $40', C.cyan]], C.cyan),
    ...say('SMALL BAND = $40', C.cyan)
  );

  // 15-16: medium apartments (-40, 0, 0, +40), band $80
  await until(S(15));
  await play(
    new M.LaggedStart(mdDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.22, runTime: 1.6 }),
    ...fbox([['Medium ($1,100)', C.amber], 'gaps: −40, 0, 0, +40'], C.amber),
    ...say('MEDIUM: −40, 0, 0, +40', C.amber)
  );

  const mdBand = makeBand(1100, 40, C.amber);
  const mdWLab = T('$80', P ? 16 : 17, C.amber, true, true);
  mdWLab.moveTo([f2x(1100), res2y(40) + 0.26, 0]);
  await until(S(16));
  await play(
    new M.FadeIn(mdBand, { runTime: 0.8 }),
    new M.FadeIn(mdWLab, { runTime: 0.8 }),
    ...fbox([['Medium ($1,100)', C.amber], 'gaps: −40, 0, 0, +40', ['band = $80', C.amber]], C.amber),
    ...say('MEDIUM BAND = $80', C.amber)
  );

  // 17-18: large apartments (-80, 0, 0, +80), band $160
  await until(S(17));
  await play(
    new M.LaggedStart(lgDots.map(d => new M.Indicate(d, { color: C.pink })), { lagRatio: 0.22, runTime: 1.6 }),
    ...fbox([['Large ($1,400)', C.pink], 'gaps: −80, 0, 0, +80'], C.pink),
    ...say('LARGE: −80, 0, 0, +80', C.pink)
  );

  const lgBand = makeBand(1400, 80, C.pink);
  const lgWLab = T('$160', P ? 16 : 17, C.pink, true, true);
  lgWLab.moveTo([f2x(1400), res2y(80) + 0.26, 0]);
  await until(S(18));
  await play(
    new M.FadeIn(lgBand, { runTime: 0.8 }),
    new M.FadeIn(lgWLab, { runTime: 0.8 }),
    ...fbox([['Large ($1,400)', C.pink], 'gaps: −80, 0, 0, +80', ['band = $160', C.pink]], C.pink),
    ...say('LARGE BAND = $160', C.pink)
  );

  // 19: the bands widen like an open fan
  const fanTop1 = new M.Line({ start: [f2x(1000) - bandW / 2, res2y(20), 0.01], end: [f2x(1100), res2y(40), 0.01], color: C.pink, strokeWidth: 3 });
  const fanTop2 = new M.Line({ start: [f2x(1100), res2y(40), 0.01], end: [f2x(1400) + bandW / 2, res2y(80), 0.01], color: C.pink, strokeWidth: 3 });
  const fanBot1 = new M.Line({ start: [f2x(1000) - bandW / 2, res2y(-20), 0.01], end: [f2x(1100), res2y(-40), 0.01], color: C.pink, strokeWidth: 3 });
  const fanBot2 = new M.Line({ start: [f2x(1100), res2y(-40), 0.01], end: [f2x(1400) + bandW / 2, res2y(-80), 0.01], color: C.pink, strokeWidth: 3 });
  const fanLines = [fanTop1, fanTop2, fanBot1, fanBot2];
  await until(S(19));
  await play(
    new M.Create(fanTop1, { runTime: 0.6 }),
    new M.Create(fanTop2, { runTime: 0.9 }),
    new M.Create(fanBot1, { runTime: 0.6 }),
    new M.Create(fanBot2, { runTime: 0.9 }),
    ...say('FAN SHAPE: $40 → $80 → $160', C.pink)
  );

  // 20: all three centers at zero, dots spread differently
  await until(S(20));
  await play(
    new M.LaggedStart(avgBars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox([['centers: 0, 0, 0', C.amber], ['bands:   $40, $80, $160', C.pink]], C.amber),
    ...say('SAME CENTER (0), DIFFERENT SPREAD', C.amber)
  );

  // 21: a number times itself is its square
  await until(S(21));
  await play(
    ...fbox([['square = number × itself', C.violet], '(−20)² = 400', '(+20)² = 400'], C.violet),
    ...say('SQUARE = NUMBER × ITSELF', C.violet)
  );

  // 22: squaring stops positive and negative gaps from canceling
  await until(S(22));
  await play(
    new M.Flash(smDots[0], { color: C.violet, flashRadius: 0.18, lineLength: 0.15 }),
    new M.Flash(smDots[3], { color: C.violet, flashRadius: 0.18, lineLength: 0.15 }),
    ...fbox([['−20 + 20 = 0  (cancels)', C.muted], ['400 + 400 = 800  (adds)', C.violet]], C.violet),
    ...say('SQUARING STOPS CANCELING', C.violet)
  );

  // 23: measure spread with the average of the squared gaps
  await until(S(23));
  await play(
    ...fbox([['measure spread with:', C.muted], ['average of squared gaps', C.cyan]], C.cyan),
    ...say('AVERAGE OF SQUARED GAPS')
  );

  // 24: small group, each 20-dollar gap gives 400 when squared
  await until(S(24));
  await play(
    new M.Indicate(smDots[0], { color: C.cyan }),
    new M.Indicate(smDots[3], { color: C.cyan }),
    ...fbox([['Small (−20, 0, 0, +20)', C.cyan], '(−20)² = 400', '(+20)² = 400'], C.cyan),
    ...say('SMALL: (±20)² = 400 EACH')
  );

  // 25: the two zero gaps add nothing
  await until(S(25));
  await play(
    new M.Indicate(smDots[1], { color: C.muted }),
    new M.Indicate(smDots[2], { color: C.muted }),
    ...fbox([['Small squared gaps', C.cyan], '400, 0, 0, 400', ['0² = 0  (adds nothing)', C.muted]], C.cyan),
    ...say('0² = 0 (ADDS NOTHING)', C.muted)
  );

  // 26: the four squared gaps total 800
  await until(S(26));
  await play(
    new M.Indicate(smBand, { color: C.cyan }),
    ...fbox([['Small squared gaps', C.cyan], '400 + 0 + 0 + 400', ['total = 800', C.amber]], C.cyan),
    ...say('SMALL TOTAL = 800', C.amber)
  );

  // 27: share 800 equally across 4 listings to get 200
  const smSqLab = T('avg² 200', 16, C.cyan, true, true);
  smSqLab.moveTo([f2x(1000) - (P ? 0.22 : 0), res2y(-20) - 0.34, 0]);
  await until(S(27));
  await play(
    new M.FadeIn(smSqLab, { runTime: 0.7 }),
    ...fbox([['Small ($1,000)', C.cyan], 'total = 800,  count = 4', ['800 ÷ 4 = 200', C.cyan]], C.cyan),
    ...say('SMALL AVG SQUARED GAP = 200')
  );

  // 28: medium group average squared gap is 800
  const mdSqLab = T('avg² 800', 16, C.amber, true, true);
  mdSqLab.moveTo([f2x(1100), res2y(-40) - 0.34, 0]);
  await until(S(28));
  await play(
    new M.Indicate(mdBand, { color: C.amber }),
    new M.FadeIn(mdSqLab, { runTime: 0.7 }),
    ...fbox([['Medium ($1,100)', C.amber], '1600 + 0 + 0 + 1600 = 3200', ['3,200 ÷ 4 = 800', C.amber]], C.amber),
    ...say('MEDIUM AVG SQUARED GAP = 800', C.amber)
  );

  // 29: large group average squared gap is 3,200
  // left of the large band (below it there is no room above the axis)
  const lgSqLab = T('avg² 3,200', 16, C.pink, true, true);
  lgSqLab.moveTo([f2x(1400) - bandW / 2 - 0.14 - lgSqLab.getWidth() / 2, res2y(-46), 0]);
  await until(S(29));
  await play(
    new M.Indicate(lgBand, { color: C.pink }),
    new M.FadeIn(lgSqLab, { runTime: 0.7 }),
    ...fbox([['Large ($1,400)', C.pink], '6400 + 0 + 0 + 6400 = 12800', ['12,800 ÷ 4 = 3,200', C.pink]], C.pink),
    ...say('LARGE AVG SQUARED GAP = 3,200', C.pink)
  );

  // 30: clues about error variance
  await until(S(30));
  await play(
    new M.LaggedStart([smSqLab, mdSqLab, lgSqLab].map(t => new M.Indicate(t, { color: C.violet })), { lagRatio: 0.25, runTime: 1.4 }),
    ...fbox([['error variance clues', C.violet], ['Small:     200', C.cyan], ['Medium:    800', C.amber], ['Large:   3,200', C.pink]], C.violet),
    ...say('ERROR VARIANCE = SQUARED SPREAD', C.violet)
  );

  // 31: heteroskedasticity
  await until(S(31));
  await play(
    new M.LaggedStart(fanLines.map(ln => new M.Indicate(ln, { color: C.pink })), { lagRatio: 0.12, runTime: 1.3 }),
    ...fbox([['heteroskedasticity', C.pink], 'error spread changes', 'with floor area'], C.pink),
    ...say('HETEROSKEDASTICITY', C.pink)
  );

  // 32: fan gives a clue that error spread grows with size
  await until(S(32));
  await play(
    new M.LaggedStart([smBand, mdBand, lgBand].map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.25, runTime: 1.3 }),
    ...say('FAN → SPREAD GROWS WITH SIZE', C.pink)
  );

  // 33: the short rule
  await until(S(33));
  await play(
    ...fbox([['avg squared gap', C.cyan], '  = total of squared gaps', '    ÷ count'], C.cyan),
    ...say('SHORT RULE: TOTAL SQUARED ÷ COUNT')
  );

  // 34: what this plot is for
  await until(S(34));
  await play(
    new M.LaggedStart([smWLab, mdWLab, lgWLab].map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.22, runTime: 1.3 }),
    ...fbox([['check the residual plot', C.green], 'do some fitted rents', 'have larger errors?'], C.green),
    ...say('USE: CHECK FOR WIDER ERRORS', C.green)
  );

  // 35: the trap is to look only at each group's average residual
  await until(S(35));
  await play(
    new M.LaggedStart(avgBars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox([['trap: average residual', C.amber], 'Small:  0', 'Medium: 0', 'Large:  0'], C.amber),
    ...say('TRAP: CHECKING ONLY THE AVERAGE', C.amber)
  );

  // 36: all three averages are zero, and still the bands have different widths
  await until(S(36));
  await play(
    new M.LaggedStart([smBand, mdBand, lgBand].map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.22, runTime: 1.3 }),
    ...fbox([['averages: 0 · 0 · 0', C.amber], ['bands:  $40 · $80 · $160', C.pink]], C.pink),
    ...say('AVERAGES ALL 0, BANDS STILL WIDEN', C.pink)
  );

  // 37: recap
  await until(S(37));
  await play(
    new M.LaggedStart(fanLines.map(ln => new M.Indicate(ln, { color: C.green })), { lagRatio: 0.12, runTime: 1.3 }),
    ...fbox([['fan of residuals', C.green], 'error spread changes', 'across predictions'], C.green),
    ...say('FAN = CHANGING ERROR SPREAD', C.green)
  );
}

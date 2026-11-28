// 10.2.6 Log transformations: From log rent to percent.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);
  const pill = (s, c, size = 20) => L.pill(s, c, P ? Math.max(size, 16) : Math.max(size, 14));

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 2.15, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.4, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Helpers (all parts placed with moveTo; fills set with setFill)
  const textAt = (s, size, color, pos, mono = false, bold = false) => {
    const t = T(s, size, color, mono, bold);
    t.moveTo(pos);
    return t;
  };
  const line = (a, b, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: a, end: b, color, strokeWidth });
  const dash = (a, b, color = C.muted) =>
    new M.DashedLine({ start: a, end: b, color });
  const cardRect = (width, height, pos, color, fill = C.card, opacity = 0.94, radius = 0.14) => {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: radius, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    r.moveTo(pos);
    return r;
  };
  const barRect = (x, y0, y1, width, color, opacity = 0.86) => {
    const h = Math.max(0.03, y1 - y0);
    const r = new M.Rectangle({ width, height: h, color, strokeWidth: 2 });
    r.setFill(color, opacity);
    r.moveTo([x, y0 + h / 2, 0]);
    return r;
  };
  const glowDot = (p, color = C.cyan, r = 0.11) => {
    const halo = new M.Dot({ point: p, radius: r * 2.2, color });
    halo.setFill(color, 0.18);
    const d = new M.Dot({ point: p, radius: r, color });
    d.setFill(color, 1);
    return new M.VGroup(halo, d);
  };
  const arrow = (a, b, color = C.amber, width = 3) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const h = Math.min(0.16, len * 0.34), w = h * 0.56;
    const l = [b[0] - h * ux - w * uy, b[1] - h * uy + w * ux, 0];
    const r = [b[0] - h * ux + w * uy, b[1] - h * uy - w * ux, 0];
    return new M.VGroup(line(a, b, color, width), line(b, l, color, width), line(b, r, color, width));
  };
  const gapBar = (xA, xB, y, color = C.green, width = 3.5) => {
    const cap = 0.11;
    return new M.VGroup(
      line([xA, y, 0], [xB, y, 0], color, width),
      line([xA, y - cap, 0], [xA, y + cap, 0], color, width),
      line([xB, y - cap, 0], [xB, y + cap, 0], color, width),
    );
  };
  const fadeOutAll = (...objs) => objs.flat().filter(Boolean).map(o => new M.FadeOut(o));

  // Formula box (one at a time, never over data; pass null to clear)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    if (!lines) {
      const a = boxNow ? [new M.FadeOut(boxNow)] : [];
      boxNow = null;
      return a;
    }
    const size = P ? 20 : 20, lh = P ? 0.38 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.25, maxh = P ? 1.56 : 3.5;
    const sc0 = Math.min(1, maxw / wd, maxh / ht);
    if (sc0 < 1) g.scale(sc0);
    g.moveTo(BOXP);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // =========================================================================
  // 0-1: Two starting rents and the extra-space question
  // =========================================================================
  const introY = P ? -1.45 : -0.55;
  const introDX = P ? 1.65 : 1.8;
  const introW = P ? 2.9 : 3.15, introH = P ? 3.2 : 2.75;

  function makeIntroCard(cx, label, rentStr, color) {
    const bg = cardRect(introW, introH, [cx, introY, 0], color, C.card, 0.92);
    const hdr = textAt(label, P ? 16 : 17, color, [cx, introY + introH / 2 - 0.36, 0], true, true);
    const rent = textAt(rentStr, P ? 26 : 28, C.ink, [cx, introY + introH / 2 - 0.88, 0], true, true);
    const baseBox = new M.Rectangle({ width: 1.28, height: 0.78, color, strokeWidth: 2 });
    baseBox.setFill(color, 0.18);
    baseBox.moveTo([cx - 0.38, introY - 0.32, 0]);
    const baseLab = textAt('base', 14, color, [cx - 0.38, introY - 0.32, 0]);
    const extBox = new M.Rectangle({ width: 0.72, height: 0.78, color: C.green, strokeWidth: 2 });
    extBox.setFill(C.green, 0.16);
    extBox.moveTo([cx + 0.64, introY - 0.32, 0]);
    const extLab = textAt('+10 m²', 13, C.green, [cx + 0.64, introY - 0.32, 0], true, true);
    return new M.VGroup(bg, hdr, rent, baseBox, baseLab, extBox, extLab);
  }

  const introCard1 = makeIntroCard(CX - introDX, 'RENT 1', '$1,000', C.cyan);
  const introCard2 = makeIntroCard(CX + introDX, 'RENT 2', '$1,400', C.amber);

  await until(S(0));
  await play(
    new M.LaggedStart([new M.FadeIn(introCard1), new M.FadeIn(introCard2)], { lagRatio: 0.25, runTime: 1.1 }),
    ...say('TWO STARTING RENTS · +10 m² SPACE'),
  );

  const introQ1 = textAt('+$?   same %?', P ? 16 : 17, C.green, [CX - introDX, introY - introH / 2 + 0.38, 0], true, true);
  const introQ2 = textAt('+$?   same %?', P ? 16 : 17, C.green, [CX + introDX, introY - introH / 2 + 0.38, 0], true, true);

  await until(S(1));
  await play(
    new M.FadeIn(introQ1),
    new M.FadeIn(introQ2),
    ...say('SAME PERCENT, DIFFERENT DOLLARS?', C.amber),
  );

  // =========================================================================
  // 2-13: Two rent bars, +10 m² rises, tenths, 10%, multiplier 1.1
  // =========================================================================
  const BAR_Y0 = P ? -4.35 : -2.2;
  const BAR_Y1 = P ? 1.05 : 1.2;
  const MAX_RENT = 1750;
  const rent2y = v => BAR_Y0 + (v / MAX_RENT) * (BAR_Y1 - BAR_Y0);
  const AX_X = CX - (P ? 2.45 : 2.75);
  const AX_X1 = CX + (P ? 3.25 : 3.45);
  const B1_X = CX - (P ? 1.35 : 1.05);
  const B2_X = CX + (P ? 1.45 : 1.45);
  const BAR_W = P ? 1.24 : 1.34;

  const axisParts = [
    line([AX_X, BAR_Y0, 0], [AX_X1, BAR_Y0, 0], C.muted, 2.5),
    line([AX_X, BAR_Y0, 0], [AX_X, BAR_Y1 + 0.08, 0], C.muted, 2.5),
  ];
  for (const v of [0, 500, 1000, 1500]) {
    const y = rent2y(v);
    axisParts.push(line([AX_X, y, 0], [AX_X1, y, 0], C.grid, 1));
    axisParts.push(line([AX_X - 0.08, y, 0], [AX_X + 0.08, y, 0], C.muted, 1.5));
    const lab = T('$' + v.toLocaleString('en-US'), P ? 14 : 15, C.muted, true);
    lab.moveTo([AX_X - 0.14 - lab.getWidth() / 2, y, 0]);
    axisParts.push(lab);
  }
  const barAxes = new M.VGroup(...axisParts);
  const barName1 = textAt('Rent 1', 17, C.cyan, [B1_X, BAR_Y0 - 0.3, 0], false, true);
  const barName2 = textAt('Rent 2', 17, C.amber, [B2_X, BAR_Y0 - 0.3, 0], false, true);

  await until(S(2));
  await play(
    ...fadeOutAll(introCard1, introCard2, introQ1, introQ2),
    new M.FadeIn(barAxes),
    new M.FadeIn(barName1),
    new M.FadeIn(barName2),
    ...say('TWO BARS FOR TWO RENT PREDICTIONS'),
  );

  // 3: first starts at $1,000
  const bar1 = barRect(B1_X, BAR_Y0, BAR_Y0 + 0.04, BAR_W, C.cyan, 0.78);
  const bar1Full = barRect(B1_X, BAR_Y0, rent2y(1000), BAR_W, C.cyan, 0.78);
  const bar1Val = textAt('$1,000', 19, C.cyan, [B1_X, rent2y(1000) + 0.26, 0], true, true);

  await until(S(3));
  await play(
    new M.Transform(bar1, bar1Full, { runTime: 0.9 }),
    new M.FadeIn(bar1Val),
    ...say('FIRST START: $1,000', C.cyan),
  );

  // 4: second starts at $1,400
  const bar2 = barRect(B2_X, BAR_Y0, BAR_Y0 + 0.04, BAR_W, C.amber, 0.78);
  const bar2Full = barRect(B2_X, BAR_Y0, rent2y(1400), BAR_W, C.amber, 0.78);
  const bar2Val = textAt('$1,400', 19, C.amber, [B2_X, rent2y(1400) + 0.26, 0], true, true);

  await until(S(4));
  await play(
    new M.Transform(bar2, bar2Full, { runTime: 0.9 }),
    new M.FadeIn(bar2Val),
    ...say('SECOND START: $1,400', C.amber),
  );

  // 5: add 10 square metres, other details fixed
  const plus10Tag1 = pill('+10 m²', C.green, P ? 15 : 16).moveTo([B1_X, rent2y(1000) + 0.72, 0]);
  const plus10Tag2 = pill('+10 m²', C.green, P ? 15 : 16).moveTo([B2_X, rent2y(1400) + 0.72, 0]);
  const fixedNote = textAt('other details fixed in each comparison', P ? 14 : 15, C.muted, [(B1_X + B2_X) / 2, BAR_Y0 - 0.68, 0]);

  await until(S(5));
  await play(
    new M.FadeIn(plus10Tag1),
    new M.FadeIn(plus10Tag2),
    new M.FadeIn(fixedNote),
    ...say('+10 m² · OTHER DETAILS FIXED', C.green),
  );

  // 6: first becomes $1,100
  const cap1 = barRect(B1_X, rent2y(1000), rent2y(1000) + 0.03, BAR_W, C.green, 0.86);
  const cap1Full = barRect(B1_X, rent2y(1000), rent2y(1100), BAR_W, C.green, 0.86);
  const bar1In = textAt('$1,000', 16, C.bg, [B1_X, (BAR_Y0 + rent2y(1000)) / 2, 0], true, true);
  const bar1New = textAt('$1,100', 19, C.cyan, [B1_X, rent2y(1100) + 0.26, 0], true, true);

  await until(S(6));
  await play(
    new M.Transform(cap1, cap1Full, { runTime: 0.9 }),
    new M.FadeOut(bar1Val),
    new M.FadeOut(plus10Tag1),
    new M.FadeIn(bar1In),
    new M.FadeIn(bar1New),
    new M.Flash(cap1Full, { color: C.green }),
    ...say('FIRST PREDICTION: $1,100', C.cyan),
  );

  // 7: second becomes $1,540
  const cap2 = barRect(B2_X, rent2y(1400), rent2y(1400) + 0.03, BAR_W, C.green, 0.86);
  const cap2Full = barRect(B2_X, rent2y(1400), rent2y(1540), BAR_W, C.green, 0.86);
  const bar2In = textAt('$1,400', 16, C.bg, [B2_X, (BAR_Y0 + rent2y(1400)) / 2, 0], true, true);
  const bar2New = textAt('$1,540', 19, C.amber, [B2_X, rent2y(1540) + 0.26, 0], true, true);

  await until(S(7));
  await play(
    new M.Transform(cap2, cap2Full, { runTime: 0.9 }),
    new M.FadeOut(bar2Val),
    new M.FadeOut(plus10Tag2),
    new M.FadeIn(bar2In),
    new M.FadeIn(bar2New),
    new M.Flash(cap2Full, { color: C.green }),
    ...say('SECOND PREDICTION: $1,540', C.amber),
  );

  // 8: first rose by $100
  const sideX1 = B1_X + BAR_W / 2 + 0.14;
  const sideX2 = B2_X + BAR_W / 2 + 0.14;
  const cap1Mid = (rent2y(1000) + rent2y(1100)) / 2;
  const cap2Mid = (rent2y(1400) + rent2y(1540)) / 2;

  function makeRiseMark(sx, y0, y1, text) {
    const br = new M.VGroup(
      line([sx, y0, 0], [sx, y1, 0], C.green, 3),
      line([sx - 0.06, y0, 0], [sx + 0.06, y0, 0], C.green, 2.5),
      line([sx - 0.06, y1, 0], [sx + 0.06, y1, 0], C.green, 2.5),
    );
    const t = T(text, P ? 15 : 16, C.green, true, true);
    t.moveTo([sx + 0.1 + t.getWidth() / 2, (y0 + y1) / 2, 0]);
    return new M.VGroup(br, t);
  }

  const rise1Mark = makeRiseMark(sideX1, rent2y(1000), rent2y(1100), '+$100');
  await until(S(8));
  await play(
    new M.FadeIn(rise1Mark),
    new M.Indicate(cap1, { color: C.green }),
    ...say('FIRST RISE: +$100', C.green),
  );

  // 9: second rose by $140
  const rise2Mark = makeRiseMark(sideX2, rent2y(1400), rent2y(1540), '+$140');
  await until(S(9));
  await play(
    new M.FadeIn(rise2Mark),
    new M.Indicate(cap2, { color: C.green }),
    ...say('SECOND RISE: +$140', C.green),
  );

  // 10: each rise is one tenth of its own starting rent (draw 10 equal slices inside both bars)
  function makeTenths(bx, topRent) {
    const lines = [];
    for (let k = 1; k < 10; k++) {
      const y = rent2y(topRent * k / 10);
      const ln = line([bx - BAR_W / 2 + 0.03, y, 0], [bx + BAR_W / 2 - 0.03, y, 0], C.bg, 1.6);
      ln.setStrokeOpacity(0.55);
      lines.push(ln);
    }
    return new M.VGroup(...lines);
  }

  const dividers1 = makeTenths(B1_X, 1000);
  const dividers2 = makeTenths(B2_X, 1400);
  const tag1X = sideX1 + 0.48;
  const tag2X = sideX2 + 0.48;
  const tenth1 = textAt('= 1/10', P ? 15 : 16, C.green, [tag1X, cap1Mid - 0.34, 0], true, true);
  const tenth2 = textAt('= 1/10', P ? 15 : 16, C.green, [tag2X, cap2Mid - 0.36, 0], true, true);

  await until(S(10));
  await play(
    new M.FadeOut(bar1In),
    new M.FadeOut(bar2In),
    new M.FadeIn(dividers1),
    new M.FadeIn(dividers2),
    new M.FadeIn(tenth1),
    new M.FadeIn(tenth2),
    ...fbox([
      ['100 ÷ 1,000 = 1/10', C.cyan],
      ['140 ÷ 1,400 = 1/10', C.amber],
    ], C.green),
    ...say('EACH RISE = 1/10 OF ITS START', C.green),
  );

  // 11: one tenth is ten percent, or ten parts out of a hundred
  const pct1 = textAt('= +10%', P ? 15 : 16, C.green, [tag1X, cap1Mid - 0.34, 0], true, true);
  const pct2 = textAt('= +10%', P ? 15 : 16, C.green, [tag2X, cap2Mid - 0.36, 0], true, true);

  await until(S(11));
  await play(
    new M.FadeOut(tenth1),
    new M.FadeOut(tenth2),
    new M.FadeIn(pct1),
    new M.FadeIn(pct2),
    ...fbox([
      '1/10 = 10 / 100',
      ['     = 10%', C.green],
    ], C.green),
    ...say('1/10 = 10% (10 OUT OF 100)', C.green),
  );

  // 12: both rents follow the same rule: multiply by 1.1
  const mult1 = pill('× 1.1', C.amber, P ? 14 : 15).moveTo([tag1X, cap1Mid - 0.78, 0]);
  const mult2 = pill('× 1.1', C.amber, P ? 14 : 15).moveTo([tag2X, cap2Mid - 0.8, 0]);

  await until(S(12));
  await play(
    new M.FadeIn(mult1),
    new M.FadeIn(mult2),
    ...fbox([
      ['$1,000 × 1.1 = $1,100', C.cyan],
      ['$1,400 × 1.1 = $1,540', C.amber],
      ['same rule: × 1.1', C.green],
    ], C.amber),
    ...say('SAME RULE: MULTIPLY BY 1.1', C.amber),
  );

  // 13: the number you multiply by is called a multiplier
  await until(S(13));
  await play(
    new M.Indicate(mult1, { color: C.amber }),
    new M.Indicate(mult2, { color: C.amber }),
    ...fbox([
      ['multiplier = 1.1', C.amber],
      'start × 1.1 = new rent',
    ], C.amber),
    ...say('MULTIPLIER = 1.1', C.amber),
  );

  // =========================================================================
  // 14-22: Multiplier ruler, equal gaps, natural log scale, coefficient
  // =========================================================================
  const R_W = P ? 5.9 : 6.4;
  const R_X0 = CX - R_W / 2;
  const R_X1 = CX + R_W / 2;
  const LN_MIN = Math.log(900), LN_MAX = Math.log(1650);
  const log2x = v => R_X0 + (Math.log(v) - LN_MIN) / (LN_MAX - LN_MIN) * R_W;

  const LOG_Y = P ? 1.15 : 1.15;
  const RULER_Y = P ? 0.45 : 0.58;
  const ROW1_Y = P ? -1.3 : -0.78;
  const ROW2_Y = P ? -3.3 : -1.98;

  const rulerParts = [
    line([R_X0, RULER_Y, 0], [R_X1, RULER_Y, 0], C.ink, 3),
  ];
  // the ruler is in dollars but spaced by multipliers (equal gap = same × step)
  const rulerName = T('rent in $ (spaced by ×)', 14, C.muted);
  rulerName.moveTo([R_X0 + rulerName.getWidth() / 2, RULER_Y + 0.26, 0]);
  rulerParts.push(rulerName);
  for (const v of [900, 1000, 1200, 1400, 1600]) {
    const x = log2x(v);
    rulerParts.push(line([x, RULER_Y - 0.1, 0], [x, RULER_Y + 0.1, 0], C.ink, 2));
    rulerParts.push(textAt('$' + v.toLocaleString('en-US'), P ? 13 : 14, C.muted, [x, RULER_Y - 0.28, 0], true));
  }
  const rulerGroup = new M.VGroup(...rulerParts);

  await until(S(14));
  await play(
    ...fadeOutAll(
      barAxes, barName1, barName2, bar1, bar2, fixedNote, cap1, cap2,
      bar1New, bar2New, rise1Mark, rise2Mark,
      dividers1, dividers2, pct1, pct2, mult1, mult2,
    ),
    ...fbox(null),
    new M.FadeIn(rulerGroup),
    ...say('RULER: EQUAL GAPS = EQUAL MULTIPLIERS', C.cyan),
  );

  // 15: mark the pair of dollar amounts on each row
  const x1000 = log2x(1000), x1100 = log2x(1100), x1400 = log2x(1400), x1540 = log2x(1540);
  const mid1X = (x1000 + x1100) / 2, mid2X = (x1400 + x1540) / 2;

  function makeRowTrack(y, xA, xB, lblA, lblB, rowName, color) {
    const tr = line([R_X0, y, 0], [R_X1, y, 0], C.grid, 2);
    // drop lines start below the ruler's tick labels
    const d1 = dash([xA, RULER_Y - 0.48, 0], [xA, y, 0], color);
    const d2 = dash([xB, RULER_Y - 0.48, 0], [xB, y, 0], color);
    d1.setStrokeOpacity(0.45);
    d2.setStrokeOpacity(0.45);
    const nm = textAt(rowName, P ? 14 : 15, color, [R_X0 + 0.36, y + 0.24, 0], false, true);
    const gA = glowDot([xA, y, 0], color, 0.1);
    const gB = glowDot([xB, y, 0], color, 0.1);
    const tA = textAt(lblA, P ? 14 : 15, color, [xA - 0.12, y - 0.34, 0], true, true);
    const tB = textAt(lblB, P ? 14 : 15, color, [xB + 0.12, y - 0.34, 0], true, true);
    return new M.VGroup(tr, d1, d2, nm, gA, gB, tA, tB);
  }

  const row1Track = makeRowTrack(ROW1_Y, x1000, x1100, '$1,000', '$1,100', 'Row 1', C.cyan);
  const row2Track = makeRowTrack(ROW2_Y, x1400, x1540, '$1,400', '$1,540', 'Row 2', C.amber);

  await until(S(15));
  await play(
    new M.FadeIn(row1Track),
    new M.FadeIn(row2Track),
    ...say('MARK EACH PAIR OF DOLLAR AMOUNTS', C.amber),
  );

  // 16: each pair has the same gap because both use the same multiplier
  const gap1Y = ROW1_Y + 0.26, gap2Y = ROW2_Y + 0.26;
  const gap1Bar = gapBar(x1000, x1100, gap1Y, C.green, 3.5);
  const gap2Bar = gapBar(x1400, x1540, gap2Y, C.green, 3.5);
  // gap labels sit beside the pair (row 1 to the right, row 2 to the left), clear of the drop lines
  const gapAt = (t, row) => t.moveTo(row === 1 ? [x1100 + 0.22 + t.getWidth() / 2, gap1Y, 0] : [x1400 - 0.22 - t.getWidth() / 2, gap2Y, 0]);
  const gap1Text = gapAt(textAt('× 1.1', P ? 15 : 16, C.green, [0, 0, 0], true, true), 1);
  const gap2Text = gapAt(textAt('× 1.1', P ? 15 : 16, C.green, [0, 0, 0], true, true), 2);

  await until(S(16));
  await play(
    new M.FadeIn(gap1Bar),
    new M.FadeIn(gap2Bar),
    new M.FadeIn(gap1Text),
    new M.FadeIn(gap2Text),
    ...say('SAME GAP = SAME MULTIPLIER (× 1.1)', C.green),
  );
  // Slide an exact copy of Row 1's gap down to Row 2 to prove equal width
  const caliper = gapBar(x1000, x1100, gap1Y, C.amber, 4);
  const caliperAt2 = gapBar(x1400, x1540, gap2Y, C.amber, 4);
  await play(new M.Transform(caliper, caliperAt2, { runTime: 1.25 }));
  await play(new M.FadeOut(caliper, { runTime: 0.45 }));

  // 17: natural logarithm (natural log) puts positive numbers on such a ruler
  const logMarks = [
    [x1000 - 0.08, '6.908', C.cyan],
    [x1100 + 0.08, '7.003', C.cyan],
    [x1400 - 0.08, '7.244', C.amber],
    [x1540 + 0.08, '7.340', C.amber],
  ];
  const logParts = [
    (t => t.moveTo([R_X0 + t.getWidth() / 2, LOG_Y + 0.34, 0]))(T('ln(rent):', 14, C.violet, true, true)),
    ...logMarks.map(([x, s, col]) => textAt(s, P ? 13 : 14, col, [x, LOG_Y, 0], true, true)),
  ];
  const logScaleGroup = new M.VGroup(...logParts);

  await until(S(17));
  await play(
    new M.FadeIn(logScaleGroup),
    ...fbox([
      ['natural log (ln)', C.violet],
      'ln(1,000) ≈ 6.908',
      'ln(1,400) ≈ 7.244',
    ], C.violet),
    ...say('NATURAL LOGARITHM (ln)', C.violet),
  );

  // 18: natural log of the multiplier gives the change on that ruler
  const gap1Ln = gapAt(textAt('= ln(1.1)', P ? 14 : 15, C.green, [0, 0, 0], true, true), 1);
  const gap2Ln = gapAt(textAt('= ln(1.1)', P ? 14 : 15, C.green, [0, 0, 0], true, true), 2);

  await until(S(18));
  await play(
    new M.FadeOut(gap1Text),
    new M.FadeOut(gap2Text),
    new M.FadeIn(gap1Ln),
    new M.FadeIn(gap2Ln),
    ...fbox([
      ['gap on log ruler', C.green],
      '= ln(multiplier)',
      '= ln(1.1)',
    ], C.green),
    ...say('GAP = ln(MULTIPLIER)', C.green),
  );

  // 19: for 1.1, natural log is about 0.09531
  const gap1Num = gapAt(textAt('+0.09531', P ? 15 : 16, C.green, [0, 0, 0], true, true), 1);
  const gap2Num = gapAt(textAt('+0.09531', P ? 15 : 16, C.green, [0, 0, 0], true, true), 2);

  await until(S(19));
  await play(
    new M.FadeOut(gap1Ln),
    new M.FadeOut(gap2Ln),
    new M.FadeIn(gap1Num),
    new M.FadeIn(gap2Num),
    ...fbox([
      'multiplier = 1.1',
      ['ln(1.1) ≈ 0.09531', C.green],
    ], C.green),
    ...say('ln(1.1) ≈ 0.09531', C.green),
  );

  // 20: changing rent numbers to this scale is called a log transformation
  const logTransformArrows = new M.VGroup(
    ...[x1000, x1100, x1400, x1540].map(x => arrow([x, RULER_Y + 0.14, 0], [x, LOG_Y - 0.18, 0], C.violet, 2)),
  );

  await until(S(20));
  await play(
    new M.FadeIn(logTransformArrows),
    ...fbox([
      ['log transformation', C.violet],
      'rent ($) → ln(rent)',
    ], C.violet),
    ...say('LOG TRANSFORMATION', C.violet),
  );

  // 21: for +10 m², the model adds the same small amount to log rent
  const stepTxt = P ? '+0.09531' : '+10 m²: +0.09531';
  const gap1Step = gapAt(textAt(stepTxt, P ? 14 : 15, C.cyan, [0, 0, 0], true, true), 1);
  const gap2Step = gapAt(textAt(stepTxt, P ? 14 : 15, C.amber, [0, 0, 0], true, true), 2);

  await until(S(21));
  await play(
    new M.FadeOut(gap1Num),
    new M.FadeOut(gap2Num),
    new M.FadeIn(gap1Step),
    new M.FadeIn(gap2Step),
    new M.Indicate(gap1Bar, { color: C.cyan }),
    new M.Indicate(gap2Bar, { color: C.amber }),
    ...fbox([
      '6.908 + 0.09531 = 7.003',
      '7.244 + 0.09531 = 7.340',
      ['same step: +0.09531', C.green],
    ], C.cyan),
    ...say('+10 m² ADDS +0.09531 TO LOG RENT', C.cyan),
  );

  // 22: this fixed amount for one step is called a coefficient
  const coefBadge = pill('COEFFICIENT = +0.09531', C.amber, P ? 14 : 15).moveTo([CX, ROW2_Y - 0.82, 0]);

  await until(S(22));
  await play(
    new M.FadeIn(coefBadge),
    new M.Indicate(gap2Bar, { color: C.amber }),
    ...fbox([
      ['coefficient', C.amber],
      '+0.09531 per +10 m²',
      'on the log rent scale',
    ], C.amber),
    ...say('COEFFICIENT = +0.09531', C.amber),
  );

  // =========================================================================
  // 23-30: Recover multiplier with exp, then subtract 1 and multiply by 100
  // =========================================================================
  const BRIDGE_Y = P ? 0.15 : 0.35;
  const TILE_DX = P ? 2.15 : 2.38;
  const TILE_W = P ? 2.1 : 2.22, TILE_H = 1.12;

  const coefTile = new M.VGroup(
    cardRect(TILE_W, TILE_H, [CX - TILE_DX, BRIDGE_Y, 0], C.violet),
    textAt('coefficient', 14, C.muted, [CX - TILE_DX, BRIDGE_Y + 0.3, 0]),
  );
  const coefVal1 = textAt('0.09531', P ? 18 : 19, C.violet, [CX - TILE_DX, BRIDGE_Y - 0.14, 0], true, true);

  const multTile = new M.VGroup(
    cardRect(TILE_W, TILE_H, [CX + TILE_DX, BRIDGE_Y, 0], C.amber),
    textAt('multiplier', 14, C.muted, [CX + TILE_DX, BRIDGE_Y + 0.3, 0]),
  );
  const multValQ = textAt('?', 24, C.amber, [CX + TILE_DX, BRIDGE_Y - 0.14, 0], true, true);

  const midUnknown = new M.VGroup(
    new M.Circle({ radius: 0.38, color: C.muted, strokeWidth: 2 }).moveTo([CX, BRIDGE_Y, 0]),
    textAt('?', 22, C.muted, [CX, BRIDGE_Y, 0], true, true),
  );
  const bridgeArrL = arrow([CX - TILE_DX + TILE_W / 2 + 0.1, BRIDGE_Y, 0], [CX - 0.68, BRIDGE_Y, 0], C.green, 3);
  const bridgeArrR = arrow([CX + 0.68, BRIDGE_Y, 0], [CX + TILE_DX - TILE_W / 2 - 0.1, BRIDGE_Y, 0], C.green, 3);

  await until(S(23));
  await play(
    ...fadeOutAll(
      rulerGroup, row1Track, row2Track, gap1Bar, gap2Bar, gap1Step, gap2Step,
      logScaleGroup, logTransformArrows, coefBadge,
    ),
    new M.FadeIn(coefTile),
    new M.FadeIn(coefVal1),
    new M.FadeIn(midUnknown),
    new M.FadeIn(multTile),
    new M.FadeIn(multValQ),
    new M.FadeIn(bridgeArrL),
    new M.FadeIn(bridgeArrR),
    ...fbox([
      ['step 1:', C.amber],
      'recover the multiplier',
      'before reading $ or %',
    ], C.amber),
    ...say('FIRST: RECOVER THE MULTIPLIER', C.amber),
  );

  // 24: calculator function that undoes natural log is the exponential
  const topY = BRIDGE_Y + 0.88;
  const lnTopArc = new M.VGroup(
    line([CX + TILE_DX, BRIDGE_Y + TILE_H / 2 + 0.05, 0], [CX + TILE_DX, topY, 0], C.violet, 2),
    arrow([CX + TILE_DX, topY, 0], [CX - TILE_DX, topY, 0], C.violet, 2.5),
    line([CX - TILE_DX, topY, 0], [CX - TILE_DX, BRIDGE_Y + TILE_H / 2 + 0.05, 0], C.violet, 2),
    textAt('ln  (to log scale)', P ? 14 : 15, C.violet, [CX, topY + 0.22, 0], true),
  );
  const expUndoLab = textAt('exponential  (undoes ln)', P ? 14 : 15, C.green, [CX, BRIDGE_Y - 0.78, 0], true, true);

  await until(S(24));
  await play(
    new M.FadeIn(lnTopArc),
    new M.FadeIn(expUndoLab),
    ...say('EXPONENTIAL UNDOES NATURAL LOG', C.green),
  );

  // 25: the exponential button often says exp
  const expKey = cardRect(1.18, 0.78, [CX, BRIDGE_Y, 0], C.green, C.green, 0.16, 0.16);
  const expBtn = new M.VGroup(expKey, textAt('exp', 22, C.green, [CX, BRIDGE_Y, 0], true, true));

  await until(S(25));
  await play(
    new M.FadeOut(midUnknown),
    new M.FadeIn(expBtn),
    new M.Flash(expKey, { color: C.green }),
    ...say('EXPONENTIAL BUTTON: exp', C.green),
  );

  // 26: use the coefficient before rounding
  const coefValExact = new M.VGroup(
    textAt('0.09531018...', P ? 14 : 15, C.cyan, [CX - TILE_DX, BRIDGE_Y - 0.08, 0], true, true),
    textAt('before rounding', 12, C.muted, [CX - TILE_DX, BRIDGE_Y - 0.36, 0]),
  );

  await until(S(26));
  await play(
    new M.FadeOut(coefVal1),
    new M.FadeIn(coefValExact),
    ...fbox([
      'use exact coefficient:',
      ['0.09531018...', C.cyan],
      '(before rounding)',
    ], C.cyan),
    ...say('USE COEFFICIENT BEFORE ROUNDING', C.cyan),
  );

  // 27: exponential of that coefficient gives 1.1
  const multVal11 = textAt('1.1', 26, C.amber, [CX + TILE_DX, BRIDGE_Y - 0.14, 0], true, true);

  await until(S(27));
  await play(
    new M.FadeOut(multValQ),
    new M.FadeIn(multVal11),
    new M.Flash(expKey, { color: C.amber }),
    ...fbox([
      'exp(0.09531018...)',
      ['  = 1.1', C.amber],
    ], C.amber),
    ...say('exp(COEF) = 1.1', C.amber),
  );

  // 28: multiplying by 1 would give the starting rent again
  const BAR11_Y = P ? -2.35 : -1.5;
  const M_W = P ? 5.6 : 5.9;
  const M_X0 = CX - M_W / 2;
  const W10 = M_W * (1.0 / 1.1);
  const W01 = M_W - W10;
  const M_H = 0.64;

  const bar10Box = new M.Rectangle({ width: W10, height: M_H, color: C.cyan, strokeWidth: 2 });
  bar10Box.setFill(C.cyan, 0.25);
  bar10Box.moveTo([M_X0 + W10 / 2, BAR11_Y, 0]);
  const bar10 = new M.VGroup(
    bar10Box,
    textAt('1.0  =  starting rent', P ? 15 : 16, C.cyan, [M_X0 + W10 / 2, BAR11_Y, 0], true, true),
  );

  const bar01Box = new M.Rectangle({ width: W01, height: M_H, color: C.green, strokeWidth: 2.5 });
  bar01Box.setFill(C.green, 0.32);
  bar01Box.moveTo([M_X0 + W10 + W01 / 2, BAR11_Y, 0]);
  const bar01 = new M.VGroup(
    bar01Box,
    textAt('0.1', P ? 14 : 15, C.green, [M_X0 + W10 + W01 / 2, BAR11_Y, 0], true, true),
  );

  const braceY = BAR11_Y + M_H / 2 + 0.16;
  const bar11Brace = new M.VGroup(
    gapBar(M_X0, M_X0 + M_W, braceY, C.amber, 2.5),
    textAt('multiplier = 1.1', P ? 14 : 15, C.amber, [CX, braceY + 0.24, 0], true, true),
  );

  await until(S(28));
  await play(
    new M.FadeIn(bar10),
    new M.FadeIn(bar01),
    new M.FadeIn(bar11Brace),
    ...fbox([
      'multiplier = 1.1',
      ['× 1.0 → starting rent', C.cyan],
    ], C.cyan),
    ...say('× 1.0 = STARTING RENT AGAIN', C.cyan),
  );

  // 29: subtract 1 to leave 0.1, the increase as a share of starting rent
  const dimMask = new M.Rectangle({ width: W10, height: M_H, color: C.muted, strokeWidth: 1.5 });
  dimMask.setFill(C.bg, 0.65);
  dimMask.moveTo([M_X0 + W10 / 2, BAR11_Y, 0]);
  const minusOneTag = new M.VGroup(
    dimMask,
    textAt('− 1', 18, C.muted, [M_X0 + W10 / 2, BAR11_Y, 0], true, true),
  );
  const shareY = BAR11_Y - M_H / 2 - 0.42;
  const shareNote = textAt('1.1 − 1 = 0.1  (increase share)', P ? 15 : 16, C.green, [CX - 0.55, shareY, 0], true, true);

  await until(S(29));
  await play(
    new M.FadeIn(minusOneTag),
    new M.Indicate(bar01, { color: C.green }),
    new M.FadeIn(shareNote),
    ...fbox([
      ['1.1 − 1 = 0.1', C.green],
      'increase share = 0.1',
    ], C.green),
    ...say('SUBTRACT 1 → 0.1 (INCREASE SHARE)', C.green),
  );

  // 30: multiply that share by 100 to get 10 percent
  const pctBadgeX = CX + (P ? 2.15 : 2.35);
  const pctArrow = new M.VGroup(
    arrow([CX + (P ? 0.95 : 1.15), shareY, 0], [pctBadgeX - 0.62, shareY, 0], C.green, 3),
    textAt('×100', 13, C.green, [(CX + (P ? 0.95 : 1.15) + pctBadgeX - 0.62) / 2, shareY + 0.22, 0], true, true),
  );
  const pct10Badge = pill('+10%', C.green, P ? 17 : 18).moveTo([pctBadgeX, shareY, 0]);

  await until(S(30));
  await play(
    new M.FadeIn(pctArrow),
    new M.FadeIn(pct10Badge),
    ...fbox([
      '1.1 − 1 = 0.1',
      ['0.1 × 100 = 10%', C.green],
    ], C.green),
    ...say('0.1 × 100 = 10%', C.green),
  );

  // =========================================================================
  // 31-33: Apply the multiplier 1.1 to each starting rent
  // =========================================================================
  const APP_Y1 = P ? -0.35 : 0.35;
  const APP_Y2 = P ? -2.6 : -1.35;
  const APP_DX = P ? 2.05 : 2.25;
  const APP_W = P ? 1.85 : 2.0, APP_H = 0.92;

  function makeAppRow(y, startStr, color) {
    const startBox = new M.VGroup(
      cardRect(APP_W, APP_H, [CX - APP_DX, y, 0], color),
      textAt(startStr, P ? 22 : 24, color, [CX - APP_DX, y, 0], true, true),
    );
    const arr = new M.VGroup(
      arrow([CX - APP_DX + APP_W / 2 + 0.15, y, 0], [CX + APP_DX - APP_W / 2 - 0.15, y, 0], C.amber, 3.5),
      pill('× 1.1', C.amber, P ? 15 : 16).moveTo([CX, y + 0.42, 0]),
    );
    const qBox = new M.VGroup(
      cardRect(APP_W, APP_H, [CX + APP_DX, y, 0], C.muted),
      textAt('?', 24, C.muted, [CX + APP_DX, y, 0], true, true),
    );
    return { startBox, arr, qBox };
  }

  const app1 = makeAppRow(APP_Y1, '$1,000', C.cyan);
  const app2 = makeAppRow(APP_Y2, '$1,400', C.amber);

  await until(S(31));
  await play(
    ...fadeOutAll(
      coefTile, coefValExact, expBtn, multTile, multVal11, bridgeArrL, bridgeArrR,
      lnTopArc, expUndoLab, bar10, bar01, bar11Brace, minusOneTag, shareNote, pctArrow, pct10Badge,
    ),
    new M.FadeIn(app1.startBox),
    new M.FadeIn(app1.arr),
    new M.FadeIn(app1.qBox),
    new M.FadeIn(app2.startBox),
    new M.FadeIn(app2.arr),
    new M.FadeIn(app2.qBox),
    ...fbox([
      ['apply multiplier 1.1', C.amber],
      'start × 1.1 = new rent',
    ], C.amber),
    ...say('APPLY × 1.1 TO EACH STARTING RENT', C.amber),
  );

  // 32: $1,000 × 1.1 = $1,100
  const app1OutRect = cardRect(APP_W, APP_H, [CX + APP_DX, APP_Y1, 0], C.cyan);
  const app1Out = new M.VGroup(
    app1OutRect,
    textAt('$1,100', P ? 22 : 24, C.cyan, [CX + APP_DX, APP_Y1, 0], true, true),
    textAt('+$100  (+10%)', P ? 14 : 15, C.green, [CX + APP_DX, APP_Y1 - 0.68, 0], true, true),
  );

  await until(S(32));
  await play(
    new M.FadeOut(app1.qBox),
    new M.FadeIn(app1Out),
    new M.Flash(app1OutRect, { color: C.cyan }),
    ...fbox([
      ['$1,000 × 1.1 = $1,100', C.cyan],
      'rise = +$100 (+10%)',
    ], C.cyan),
    ...say('$1,000 × 1.1 = $1,100', C.cyan),
  );

  // 33: $1,400 × 1.1 = $1,540
  const app2OutRect = cardRect(APP_W, APP_H, [CX + APP_DX, APP_Y2, 0], C.amber);
  const app2Out = new M.VGroup(
    app2OutRect,
    textAt('$1,540', P ? 22 : 24, C.amber, [CX + APP_DX, APP_Y2, 0], true, true),
    textAt('+$140  (+10%)', P ? 14 : 15, C.green, [CX + APP_DX, APP_Y2 - 0.68, 0], true, true),
  );

  await until(S(33));
  await play(
    new M.FadeOut(app2.qBox),
    new M.FadeIn(app2Out),
    new M.Flash(app2OutRect, { color: C.amber }),
    ...fbox([
      ['$1,000 × 1.1 = $1,100', C.cyan],
      ['$1,400 × 1.1 = $1,540', C.amber],
      'rise = +$140 (+10%)',
    ], C.amber),
    ...say('$1,400 × 1.1 = $1,540', C.amber),
  );

  // =========================================================================
  // 34-35: Model predicts log rent first, then exp() puts predictions in dollars
  // =========================================================================
  const COL_DX = P ? 1.88 : 2.08;
  const COL_W = P ? 2.75 : 3.0, COL_H = 1.02;
  const P_HY = P ? 0.9 : 1.05;
  const P_Y1 = P ? -0.35 : 0.1;
  const P_Y2 = P ? -2.05 : -1.35;

  const predLeftCol = new M.VGroup(
    textAt('1. LOG RENT PREDICTIONS', P ? 13 : 14, C.violet, [CX - COL_DX, P_HY, 0], true, true),
    cardRect(COL_W, COL_H, [CX - COL_DX, P_Y1, 0], C.violet),
    textAt('6.908  →  7.003', P ? 15 : 16, C.cyan, [CX - COL_DX, P_Y1 + 0.14, 0], true, true),
    textAt('+0.09531', 13, C.green, [CX - COL_DX, P_Y1 - 0.24, 0], true),
    cardRect(COL_W, COL_H, [CX - COL_DX, P_Y2, 0], C.violet),
    textAt('7.244  →  7.340', P ? 15 : 16, C.amber, [CX - COL_DX, P_Y2 + 0.14, 0], true, true),
    textAt('+0.09531', 13, C.green, [CX - COL_DX, P_Y2 - 0.24, 0], true),
  );

  await until(S(34));
  await play(
    ...fadeOutAll(app1.startBox, app1.arr, app1Out, app2.startBox, app2.arr, app2Out),
    new M.FadeIn(predLeftCol),
    ...fbox([
      ['1. model predicts', C.violet],
      '   log rent first',
      '   (+0.09531 step)',
    ], C.violet),
    ...say('MODEL PREDICTS LOG RENT FIRST', C.violet),
  );

  const predExpArrows = new M.VGroup(
    arrow([CX - COL_DX + COL_W / 2 + 0.08, P_Y1, 0], [CX + COL_DX - COL_W / 2 - 0.08, P_Y1, 0], C.green, 3),
    textAt('exp', 13, C.green, [CX, P_Y1 + 0.24, 0], true, true),
    arrow([CX - COL_DX + COL_W / 2 + 0.08, P_Y2, 0], [CX + COL_DX - COL_W / 2 - 0.08, P_Y2, 0], C.green, 3),
    textAt('exp', 13, C.green, [CX, P_Y2 + 0.24, 0], true, true),
  );
  const predRightCol = new M.VGroup(
    textAt('2. BACK IN DOLLARS', P ? 13 : 14, C.green, [CX + COL_DX, P_HY, 0], true, true),
    cardRect(COL_W, COL_H, [CX + COL_DX, P_Y1, 0], C.cyan),
    textAt('$1,000 → $1,100', P ? 15 : 16, C.cyan, [CX + COL_DX, P_Y1 + 0.14, 0], true, true),
    textAt('+$100  (+10%)', 13, C.green, [CX + COL_DX, P_Y1 - 0.24, 0], true),
    cardRect(COL_W, COL_H, [CX + COL_DX, P_Y2, 0], C.amber),
    textAt('$1,400 → $1,540', P ? 15 : 16, C.amber, [CX + COL_DX, P_Y2 + 0.14, 0], true, true),
    textAt('+$140  (+10%)', 13, C.green, [CX + COL_DX, P_Y2 - 0.24, 0], true),
  );

  await until(S(35));
  await play(
    new M.FadeIn(predExpArrows),
    new M.FadeIn(predRightCol),
    ...fbox([
      '1. model predicts log rent',
      ['2. exp() → dollars', C.green],
      'exp(7.003) ≈ $1,100',
      'exp(7.340) ≈ $1,540',
    ], C.green),
    ...say('exp() PUTS PREDICTIONS IN DOLLARS', C.green),
  );

  // =========================================================================
  // 36-37: The percent-change formula
  // =========================================================================
  const F1_POS = P ? [CX, -0.35, 0] : [CX - 1.75, -0.4, 0];
  const F2_POS = P ? [CX, -2.55, 0] : [CX + 1.85, -0.4, 0];
  const F_W = P ? 5.2 : 3.25, F_H = 1.5;

  const formPart1 = new M.VGroup(
    cardRect(F_W, F_H, F1_POS, C.cyan),
    textAt('STEP 1', 14, C.muted, [F1_POS[0], F1_POS[1] + 0.45, 0], true, true),
    textAt('exp(coef) − 1', P ? 22 : 21, C.cyan, [F1_POS[0], F1_POS[1] + 0.02, 0], true, true),
    textAt('= 1.1 − 1 = 0.1', P ? 16 : 15, C.amber, [F1_POS[0], F1_POS[1] - 0.44, 0], true),
  );

  await until(S(36));
  await play(
    ...fadeOutAll(predLeftCol, predExpArrows, predRightCol),
    new M.FadeIn(formPart1),
    ...fbox([
      ['step 1:', C.cyan],
      'exp(coef) − 1',
      '= 1.1 − 1 = 0.1',
    ], C.cyan),
    ...say('STEP 1: exp(COEF) − 1', C.cyan),
  );

  const formConn = P
    ? arrow([CX, F1_POS[1] - F_H / 2 - 0.08, 0], [CX, F2_POS[1] + F_H / 2 + 0.08, 0], C.green, 3)
    : arrow([F1_POS[0] + F_W / 2 + 0.06, F1_POS[1], 0], [F2_POS[0] - F_W / 2 - 0.06, F2_POS[1], 0], C.green, 3);
  const formPart2 = new M.VGroup(
    formConn,
    cardRect(F_W, F_H, F2_POS, C.green),
    textAt('STEP 2', 14, C.muted, [F2_POS[0], F2_POS[1] + 0.45, 0], true, true),
    textAt('× 100 = % change', P ? 20 : 19, C.green, [F2_POS[0], F2_POS[1] + 0.02, 0], true, true),
    textAt('0.1 × 100 = 10%', P ? 16 : 15, C.amber, [F2_POS[0], F2_POS[1] - 0.44, 0], true),
  );

  await until(S(37));
  await play(
    new M.FadeIn(formPart2),
    ...fbox([
      ['percent change =', C.ink],
      ['(exp(coef) − 1) × 100', C.green],
      ['= (1.1 − 1) × 100 = 10%', C.amber],
    ], C.green),
    ...say('FORMULA: (exp(COEF) − 1) × 100', C.green),
  );

  // =========================================================================
  // 38: When to use a log rent rule (same % change per extra area step)
  // =========================================================================
  const ST_Y0 = P ? -4.1 : -2.2;
  const ST_H = P ? 4.4 : 2.9;
  const st2y = v => ST_Y0 + (v / 1450) * ST_H;
  const ST_SP = P ? 2.05 : 2.2;
  const ST_W = P ? 1.2 : 1.3;
  const stData = [
    { x: CX - ST_SP, val: 1000, lbl: 'Start', col: C.cyan },
    { x: CX,         val: 1100, lbl: '+10 m²', col: C.cyan },
    { x: CX + ST_SP, val: 1210, lbl: '+20 m²', col: C.cyan },
  ];
  const stParts = [
    line([CX - ST_SP - 0.9, ST_Y0, 0], [CX + ST_SP + 0.9, ST_Y0, 0], C.muted, 2.5),
  ];
  stData.forEach(d => {
    stParts.push(barRect(d.x, ST_Y0, st2y(d.val), ST_W, d.col, 0.78));
    stParts.push(textAt('$' + d.val.toLocaleString('en-US'), 17, d.col, [d.x, st2y(d.val) + 0.24, 0], true, true));
    stParts.push(textAt(d.lbl, 15, C.muted, [d.x, ST_Y0 - 0.3, 0], true));
  });
  for (let k = 0; k < 2; k++) {
    const a = stData[k], b = stData[k + 1];
    const yA = st2y(a.val) + 0.56, yB = st2y(b.val) + 0.56;
    stParts.push(arrow([a.x + 0.3, yA, 0], [b.x - 0.3, yB, 0], C.green, 3));
    stParts.push(textAt('+10%', 15, C.green, [(a.x + b.x) / 2, (yA + yB) / 2 + 0.25, 0], true, true));
  }
  const stairGroup = new M.VGroup(...stParts);

  await until(S(38));
  await play(
    ...fadeOutAll(formPart1, formPart2),
    new M.FadeIn(stairGroup),
    ...fbox([
      ['use log rent when:', C.cyan],
      'each +10 m² step adds',
      ['the same % change (+10%)', C.green],
    ], C.cyan),
    ...say('USE LOG RENT FOR CONSTANT % STEPS', C.cyan),
  );

  // =========================================================================
  // 39-41: The trap (9.5% shortcut) vs exact multiplier (10%)
  // =========================================================================
  const T_Y0 = P ? -4.1 : -2.1;
  const T_Y1 = P ? 0.85 : 1.05;
  const pct2y = p => T_Y0 + (p / 12) * (T_Y1 - T_Y0);
  const T_AX = CX - (P ? 2.55 : 2.8);
  const T_X1 = CX + (P ? 2.95 : 3.15);
  const T_LX = CX - (P ? 1.1 : 1.25);
  const T_RX = CX + (P ? 1.45 : 1.55);
  const T_BW = P ? 1.3 : 1.4;

  const trapAxesParts = [
    line([T_AX, T_Y0, 0], [T_X1, T_Y0, 0], C.muted, 2.5),
    line([T_AX, T_Y0, 0], [T_AX, T_Y1 + 0.08, 0], C.muted, 2.5),
    dash([T_AX, pct2y(10), 0], [T_X1, pct2y(10), 0], C.green),
  ];
  for (const p of [0, 5, 10]) {
    const y = pct2y(p);
    trapAxesParts.push(line([T_AX - 0.07, y, 0], [T_AX + 0.07, y, 0], C.muted, 1.5));
    const lab = T(p + '%', P ? 14 : 15, p === 10 ? C.green : C.muted, true, p === 10);
    lab.moveTo([T_AX - 0.14 - lab.getWidth() / 2, y, 0]);
    trapAxesParts.push(lab);
  }
  const trapAxes = new M.VGroup(...trapAxesParts);

  const trapFrame = new M.VGroup(
    cardRect(T_BW + 0.55, T_Y1 - T_Y0 + 0.45, [T_LX, (T_Y0 + T_Y1) / 2 + 0.1, 0], C.pink, C.pink, 0.05),
    textAt('TRAP: DIRECT %', P ? 13 : 14, C.pink, [T_LX, T_Y0 - 0.34, 0], true, true),
  );
  const exactFrame = new M.VGroup(
    cardRect(T_BW + 0.55, T_Y1 - T_Y0 + 0.45, [T_RX, (T_Y0 + T_Y1) / 2 + 0.1, 0], C.green, C.green, 0.05),
    textAt('EXACT MULTIPLIER', P ? 13 : 14, C.green, [T_RX, T_Y0 - 0.34, 0], true, true),
  );

  await until(S(39));
  await play(
    new M.FadeOut(stairGroup),
    new M.FadeIn(trapAxes),
    new M.FadeIn(trapFrame),
    new M.FadeIn(exactFrame),
    ...fbox([
      ['THE TRAP:', C.pink],
      'reading 0.09531 directly',
      'as a percent',
    ], C.pink),
    ...say('TRAP: READING LOG COEF AS %', C.pink),
  );

  // 40: multiplying rounded coefficient by 100 gives about 9.5%
  const trapBar = barRect(T_LX, T_Y0, T_Y0 + 0.04, T_BW, C.pink, 0.78);
  const trapBarFull = barRect(T_LX, T_Y0, pct2y(9.531), T_BW, C.pink, 0.78);
  const trapVal = new M.VGroup(
    textAt('≈ 9.5%  ✕', P ? 16 : 17, C.pink, [T_LX, pct2y(9.531) + 0.28, 0], true, true),
    textAt('0.09531 × 100', P ? 12 : 13, C.muted, [T_LX, T_Y0 - 0.68, 0], true),
  );

  await until(S(40));
  await play(
    new M.Transform(trapBar, trapBarFull, { runTime: 0.9 }),
    new M.FadeIn(trapVal),
    ...fbox([
      ['shortcut (too low):', C.pink],
      '0.09531 × 100 ≈ 9.5%',
    ], C.pink),
    ...say('0.09531 × 100 ≈ 9.5%', C.pink),
  );

  // 41: the model's exact multiplier gives 10%
  const exactBar = barRect(T_RX, T_Y0, T_Y0 + 0.04, T_BW, C.green, 0.82);
  const exactBarFull = barRect(T_RX, T_Y0, pct2y(10), T_BW, C.green, 0.82);
  const exactVal = new M.VGroup(
    textAt('10%  ✓', P ? 16 : 17, C.green, [T_RX, pct2y(10) + 0.28, 0], true, true),
    textAt('(1.1 − 1) × 100', P ? 12 : 13, C.green, [T_RX, T_Y0 - 0.68, 0], true),
  );
  const shortfallNote = textAt('short of 10%', 12, C.pink, [T_LX, (pct2y(9.531) + pct2y(10)) / 2 - 0.16, 0]);

  await until(S(41));
  await play(
    new M.Transform(exactBar, exactBarFull, { runTime: 0.9 }),
    new M.FadeIn(exactVal),
    new M.FadeIn(shortfallNote),
    ...fbox([
      ['shortcut: ≈ 9.5%', C.pink],
      ['exact:      10%', C.green],
      '(exp(coef) − 1) × 100',
    ], C.green),
    ...say('EXACT MULTIPLIER GIVES 10%', C.green),
  );

  // =========================================================================
  // 42: Final one-sentence recap
  // =========================================================================
  const RC_W = P ? 6.4 : 6.6;
  const RC_Y1 = P ? -0.15 : 0.45;
  const RC_Y2 = P ? -2.75 : -1.55;

  const recapTop = new M.VGroup(
    cardRect(RC_W, 1.25, [CX, RC_Y1, 0], C.violet),
    textAt('FIXED STEP ON LOG RENT SCALE', P ? 15 : 16, C.violet, [CX, RC_Y1 + 0.28, 0], true, true),
    textAt('+10 m²   →   +0.09531  (same step)', P ? 16 : 17, C.ink, [CX, RC_Y1 - 0.22, 0], true),
  );
  const recapArr = new M.VGroup(
    arrow([CX, RC_Y1 - 0.68, 0], [CX, RC_Y2 + 0.86, 0], C.green, 3.5),
    pill('exp()', C.green, P ? 14 : 15).moveTo([CX + 0.92, (RC_Y1 - 0.68 + RC_Y2 + 0.86) / 2, 0]),
  );
  const recapBot = new M.VGroup(
    cardRect(RC_W, 1.6, [CX, RC_Y2, 0], C.green),
    textAt('FIXED PERCENT IN DOLLAR PREDICTIONS', P ? 15 : 16, C.green, [CX, RC_Y2 + 0.48, 0], true, true),
    textAt('$1,000 → $1,100   (+$100,  +10%)', P ? 15 : 16, C.cyan, [CX, RC_Y2 - 0.02, 0], true),
    textAt('$1,400 → $1,540   (+$140,  +10%)', P ? 15 : 16, C.amber, [CX, RC_Y2 - 0.48, 0], true),
  );

  await until(S(42));
  await play(
    ...fadeOutAll(trapAxes, trapFrame, exactFrame, trapBar, trapVal, exactBar, exactVal, shortfallNote),
    new M.FadeIn(recapTop),
    new M.FadeIn(recapArr),
    new M.FadeIn(recapBot),
    ...fbox([
      ['fixed log step', C.violet],
      '  +0.09531',
      ['fixed % in dollars', C.green],
      '  +10% (× 1.1)',
    ], C.amber),
    ...say('FIXED LOG STEP = FIXED % IN DOLLARS', C.amber),
  );
}

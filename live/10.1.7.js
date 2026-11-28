// 10.1.7 Residual standard error.
// Beat i = sentence i (0-based, 34 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Shared chapter 10.1 data (chapters/10.1.md): 12 apartments across buildings X (0), Y (1), Z (2)
  const APTS = [
    { a: 40, r: 860, b: 0 }, { a: 40, r: 770, b: 1 }, { a: 40, r: 770, b: 2 },
    { a: 60, r: 1040, b: 0 }, { a: 60, r: 1020, b: 1 }, { a: 60, r: 940, b: 2 },
    { a: 80, r: 1250, b: 0 }, { a: 80, r: 1210, b: 1 }, { a: 80, r: 1140, b: 2 },
    { a: 100, r: 1470, b: 0 }, { a: 100, r: 1380, b: 1 }, { a: 100, r: 1350, b: 2 },
  ];
  const BCOL = [C.cyan, C.amber, C.pink];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 1.88, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.28, 0] : [4.45, -0.4, 0];
  const PX0 = P ? -2.65 : -6.05, PX1 = P ? 3.45 : 1.55;
  const SY0 = P ? -4.55 : -2.4, SY1 = P ? 1.0 : 1.18;
  const DX = P ? 0.11 : 0.14, DR = P ? 0.068 : 0.075;

  const ax = a => PX0 + (a - 30) / 80 * (PX1 - PX0);
  const ay = r => SY0 + (r - 650) / 900 * (SY1 - SY0);
  const mVis = (10 / 900 * (SY1 - SY0)) / (1 / 80 * (PX1 - PX0));
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box on screen at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.37 : 0.41;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.66, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.33, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 4.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }

  // Fresh scatter plot builder (axes, ticks, labels, legend, 12 dots, fitted line, optional 12 sticks)
  function buildPlot(withSticks = true) {
    const xAxis = new M.Line({ start: [PX0, SY0, 0], end: [PX1, SY0, 0], color: C.muted, strokeWidth: 2 });
    const yAxis = new M.Line({ start: [PX0, SY0, 0], end: [PX0, SY1, 0], color: C.muted, strokeWidth: 2 });
    const parts = [xAxis, yAxis];
    for (const a of [40, 60, 80, 100]) {
      const x = ax(a);
      parts.push(
        new M.Line({ start: [x, SY0 - 0.07, 0], end: [x, SY0 + 0.07, 0], color: C.muted }),
        T(String(a), P ? 17 : 16, C.muted, true).moveTo([x, SY0 - 0.29, 0])
      );
    }
    for (const r of [800, 1000, 1200, 1400]) {
      const y = ay(r);
      parts.push(
        new M.Line({ start: [PX0 - 0.07, y, 0], end: [PX0 + 0.07, y, 0], color: C.muted }),
        T(r.toLocaleString('en-US'), P ? 16 : 15, C.muted, true).moveTo([PX0 - (P ? 0.50 : 0.58), y, 0])
      );
    }
    parts.push(
      T('area (m²)', P ? 15 : 16, C.muted).moveTo([(PX0 + PX1) / 2, SY0 - 0.54, 0]),
      T('rent ($)', P ? 15 : 16, C.muted).moveTo([PX0 + 0.55, SY1 + 0.2, 0])
    );
    ['X', 'Y', 'Z'].forEach((name, i) => {
      const lx = PX1 - 1.7 + i * 0.68, ly = SY1 + 0.2;
      parts.push(
        new M.Dot({ point: [lx, ly, 0], radius: 0.06, color: BCOL[i] }),
        T(name, P ? 15 : 16, BCOL[i], true, true).moveTo([lx + 0.22, ly, 0])
      );
    });
    const frame = new M.VGroup(...parts);
    const line = new M.Line({
      start: [ax(34), ay(740), 0],
      end: [ax(106), ay(1460), 0],
      color: C.ink,
      strokeWidth: 3,
    });
    const dots = APTS.map(({ a, r, b }) =>
      new M.Dot({ point: [ax(a) + (b - 1) * DX, ay(r), 0], radius: DR, color: BCOL[b] })
    );
    const sticks = withSticks ? APTS.map(({ a, r, b }) => {
      const dx = (b - 1) * DX, px = ax(a) + dx, ly = ay(400 + 10 * a) + mVis * dx;
      return new M.Line({ start: [px, ly, 0], end: [px, ay(r), 0], color: BCOL[b], strokeWidth: 3 });
    }) : [];
    return { frame, line, dots, sticks };
  }

  // Fresh horizontal total bar builder for sharing 25,000 among N slices
  const BAR_W = P ? 6.4 : 7.0, BAR_H = P ? 0.66 : 0.58, BAR_Y = P ? 0.45 : 0.62;
  const SQ_Y = P ? -2.25 : -1.35, SQ_S = P ? 2.05 : 1.5;

  function buildBar(count, col) {
    const xL = CX - BAR_W / 2, step = BAR_W / count;
    const rect = new M.Rectangle({ width: BAR_W, height: BAR_H, color: C.amber, strokeWidth: 2 });
    rect.setFill(C.amber, 0.22); rect.moveTo([CX, BAR_Y, 0]);
    const title = T('sum of squared residuals = 25,000', P ? 17 : 18, C.amber, true);
    title.moveTo([CX, BAR_Y + BAR_H / 2 + 0.3, 0]);
    const divs = Array.from({ length: count - 1 }, (_, k) =>
      new M.Line({
        start: [xL + (k + 1) * step, BAR_Y - BAR_H / 2, 0],
        end: [xL + (k + 1) * step, BAR_Y + BAR_H / 2, 0],
        color: col,
        strokeWidth: 2,
      })
    );
    const nums = Array.from({ length: count }, (_, k) =>
      T(String(k + 1), P ? 14 : 15, col, true).moveTo([xL + (k + 0.5) * step, BAR_Y - BAR_H / 2 - 0.25, 0])
    );
    const slice = new M.Rectangle({ width: step - 0.04, height: BAR_H - 0.04, color: C.amber, strokeWidth: 2 });
    slice.setFill(C.amber, 0.58); slice.moveTo([xL + 0.5 * step, BAR_Y, 0]);
    return { rect, title, divs, nums, slice };
  }

  function buildSquare(areaText, sideText, color) {
    const sq = new M.Rectangle({ width: SQ_S, height: SQ_S, color, strokeWidth: 2.5 });
    sq.setFill(color, 0.18); sq.moveTo([CX, SQ_Y, 0]);
    const inside = T(areaText, P ? 18 : 17, C.amber, true, true).moveTo([CX, SQ_Y, 0]);
    const bot = T(sideText, P ? 20 : 19, color, true, true).moveTo([CX, SQ_Y - SQ_S / 2 - 0.3, 0]);
    const left = T(sideText, P ? 20 : 19, color, true, true).moveTo([CX - SQ_S / 2 - (P ? 0.65 : 0.68), SQ_Y, 0]);
    return { sq, inside, bot, left };
  }

  // --- ACT 1 (0-4): Scatter plot, 12 residual sticks, typical stick length ---
  const p1 = buildPlot(true);

  await until(S(0));
  await play(
    new M.FadeIn(p1.frame, { runTime: 0.7 }),
    new M.Create(p1.line, { runTime: 0.8 }),
    new M.LaggedStart(p1.dots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 0.9 }),
    ...say('R² = 96%  →  HOW MANY DOLLARS?', C.amber),
    ...fbox([['R² = 96% (a share)', C.muted], ['Renter wants: dollars', C.amber]], C.amber)
  );

  await until(S(1));
  await play(
    new M.Indicate(p1.line, { color: C.cyan, runTime: 0.9 }),
    new M.Flash(p1.dots[6], { color: C.cyan, runTime: 0.8 }),
    new M.Flash(p1.dots[5], { color: C.pink, runTime: 0.8 }),
    ...say('HOW FAR FROM THE LINE?', C.cyan)
  );

  await until(S(2));
  await play(
    new M.LaggedStart(p1.sticks.map(st => new M.Create(st)), { lagRatio: 0.08, runTime: 1.2 }),
    ...say('12 RESIDUAL STICKS', C.cyan)
  );

  await until(S(3));
  await play(
    new M.LaggedStart(p1.sticks.map(st => new M.Indicate(st, { color: C.amber })), { lagRatio: 0.06, runTime: 1.1 }),
    ...say('ONE TYPICAL STICK LENGTH', C.amber),
    ...fbox(['12 vertical gaps ($)', ['typical gap = ? $', C.amber]], C.amber)
  );

  await until(S(4));
  await play(
    new M.LaggedStart(p1.sticks.map(st => new M.Indicate(st, { color: C.violet })), { lagRatio: 0.06, runTime: 1.4 }),
    ...say('CH. 1: STANDARD DEVIATION', C.violet),
    ...fbox([['Ch. 1: std. deviation', C.violet], 'typical gap from mean', ['Now: typical gap from line', C.cyan]], C.violet)
  );

  // --- ACT 2 (5-9): Share 25,000 among 12, then square root = $45.60 ---
  const bar12 = buildBar(12, C.cyan);

  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(p1.frame, p1.line, ...p1.dots, ...p1.sticks), { runTime: 0.6 }),
    new M.FadeIn(bar12.rect, { runTime: 0.7 }),
    new M.FadeIn(bar12.title, { runTime: 0.7 }),
    ...say('SUM OF SQUARED RESIDUALS = 25,000', C.amber),
    ...fbox(['sum of squared residuals', ['= 25,000', C.amber]], C.amber)
  );

  await until(S(6));
  await play(
    new M.LaggedStart(bar12.divs.map(d => new M.Create(d)), { lagRatio: 0.06, runTime: 0.9 }),
    new M.LaggedStart(bar12.nums.map(n => new M.FadeIn(n)), { lagRatio: 0.05, runTime: 0.9 }),
    ...say('FIRST GUESS: SHARE AMONG 12', C.cyan),
    ...fbox(['total = 25,000', ['share among 12', C.cyan]], C.cyan)
  );

  const share12Tag = pill('≈ 2,083 EACH', C.amber, P ? 16 : 17).moveTo([CX, P ? -0.9 : -0.55, 0]);
  await until(S(7));
  await play(
    new M.FadeIn(bar12.slice, { runTime: 0.6 }),
    new M.FadeIn(share12Tag, { runTime: 0.6 }),
    ...say('25,000 ÷ 12 ≈ 2,083 EACH', C.amber),
    ...fbox(['25,000 ÷ 12', ['≈ 2,083 per apartment', C.amber]], C.amber)
  );

  const sq12 = buildSquare('≈ 2,083', '$45.60', C.cyan);
  await until(S(8));
  await play(
    new M.FadeOut(share12Tag, { runTime: 0.4 }),
    new M.Create(sq12.sq, { runTime: 0.8 }),
    new M.FadeIn(sq12.inside, { runTime: 0.7 }),
    new M.FadeIn(sq12.bot, { runTime: 0.7 }),
    new M.FadeIn(sq12.left, { runTime: 0.7 }),
    ...say('SQUARE ROOT  →  $45.60', C.cyan),
    ...fbox(['25,000 ÷ 12 ≈ 2,083', ['√2,083 ≈ $45.60', C.cyan]], C.cyan)
  );

  const sqRule = T('45.6 × 45.6 ≈ 2,083', P ? 18 : 17, C.violet, true).moveTo([CX, SQ_Y - SQ_S / 2 - 0.68, 0]);
  await until(S(9));
  await play(
    new M.Indicate(sq12.bot, { color: C.violet, runTime: 0.9 }),
    new M.Indicate(sq12.left, { color: C.violet, runTime: 0.9 }),
    new M.FadeIn(sqRule, { runTime: 0.7 }),
    ...say('SIDE × SIDE = AREA', C.violet),
    ...fbox([['square root:', C.violet], 'side × side = area', ['45.6 × 45.6 ≈ 2,083', C.cyan]], C.violet)
  );

  // --- ACT 3 (10-18): Why ÷12 is too small — 2 apartments & 10 degrees of freedom ---
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(
      bar12.rect, bar12.title, ...bar12.divs, ...bar12.nums, bar12.slice,
      sq12.sq, sq12.inside, sq12.bot, sq12.left, sqRule
    ), { runTime: 0.6 }),
    ...say('TOO SMALL — HERE IS WHY', C.pink),
    ...fbox([['$45.60 is too small', C.pink], 'Here is why'], C.pink)
  );

  const p2 = buildPlot(false);
  await until(S(11));
  await play(
    new M.FadeIn(p2.frame, { runTime: 0.6 }),
    new M.FadeIn(p2.line, { runTime: 0.6 }),
    new M.LaggedStart(p2.dots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 0.7 }),
    ...say('THE LINE HUGS THESE DOTS', C.cyan)
  );

  // Snap line perfectly through 2 remaining dots: X at (40, 860) and Z at (100, 1350)
  const xA = ax(40) - DX, yA = ay(860);
  const xB = ax(100) + DX, yB = ay(1350);
  const sl2 = (yB - yA) / (xB - xA);
  const twoLine = new M.Line({
    start: [ax(34), yA + sl2 * (ax(34) - xA), 0],
    end: [ax(106), yA + sl2 * (ax(106) - xA), 0],
    color: C.ink,
    strokeWidth: 3,
  });
  const drop10 = p2.dots.filter((_, k) => k !== 0 && k !== 11);

  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...drop10), { runTime: 0.6 }),
    new M.Transform(p2.line, twoLine, { runTime: 1.0 }),
    ...say('2 APARTMENTS  →  PERFECT FIT', C.amber),
    ...fbox(['2 apartments', ['line hits BOTH dots', C.amber]], C.amber)
  );

  const zeroA = T('gap = 0', P ? 16 : 17, C.pink, true, true).moveTo([xA + 0.55, yA + 0.35, 0]);
  const zeroB = T('gap = 0', P ? 16 : 17, C.pink, true, true).moveTo([xB - 0.55, yB - 0.35, 0]);
  await until(S(13));
  await play(
    new M.Flash(p2.dots[0], { color: C.pink, runTime: 0.8 }),
    new M.Flash(p2.dots[11], { color: C.pink, runTime: 0.8 }),
    new M.FadeIn(zeroA, { runTime: 0.6 }),
    new M.FadeIn(zeroB, { runTime: 0.6 }),
    ...say('BOTH RESIDUALS = 0', C.pink),
    ...fbox(['residual 1 = 0', 'residual 2 = 0', ['even with real noise!', C.pink]], C.pink)
  );

  const ringA = new M.Circle({ radius: 0.24, color: C.pink, strokeWidth: 2.5 });
  ringA.setFill(C.pink, 0.14); ringA.moveTo([xA, yA, 0]);
  const ringB = new M.Circle({ radius: 0.24, color: C.pink, strokeWidth: 2.5 });
  ringB.setFill(C.pink, 0.14); ringB.moveTo([xB, yB, 0]);
  await until(S(14));
  await play(
    new M.Create(ringA, { runTime: 0.6 }),
    new M.Create(ringB, { runTime: 0.6 }),
    ...say('NOTHING LEFT TO MEASURE NOISE', C.pink),
    ...fbox(['2 apartments', '− 2 used by the line', ['= 0 left for noise', C.pink]], C.pink)
  );

  // 12 information tokens in a 2x6 grid
  const tokSpX = P ? 1.08 : 1.16, tokSpY = P ? 1.45 : 1.25;
  const tokCY = P ? -1.4 : -0.5, tokR = P ? 0.34 : 0.31;
  const tokens = Array.from({ length: 12 }, (_, k) => {
    const row = Math.floor(k / 6), col = k % 6;
    const x = CX + (col - 2.5) * tokSpX, y = tokCY + (0.5 - row) * tokSpY;
    const circ = new M.Circle({ radius: tokR, color: C.cyan, strokeWidth: 2.5 });
    circ.setFill(C.cyan, 0.18); circ.moveTo([x, y, 0]);
    const num = T(String(k + 1), P ? 18 : 18, C.ink, true, true).moveTo([x, y, 0]);
    return { g: new M.VGroup(circ, num), circ, x, y };
  });

  tokens[0].circ.setColor(C.violet); tokens[0].circ.setFill(C.violet, 0.4);
  const usedTok = T('used', P ? 16 : 16, C.violet, true, true).moveTo([tokens[0].x, tokens[0].y + tokR + 0.28, 0]);
  await until(S(15));
  await play(
    new M.FadeIn(usedTok, { runTime: 0.6 }),
    new M.FadeOut(new M.VGroup(p2.frame, p2.line, p2.dots[0], p2.dots[11], zeroA, zeroB, ringA, ringB), { runTime: 0.5 }),
    new M.LaggedStart(tokens.map(tk => new M.FadeIn(tk.g)), { lagRatio: 0.05, runTime: 0.9 }),
    ...say('1 FITTED NUMBER = 1 PIECE USED', C.violet),
    ...fbox(['12 pieces of information', ['1 fitted number = 1 used', C.violet]], C.violet)
  );

  const tagSlope = T('slope', P ? 15 : 16, C.pink, true, true).moveTo([tokens[0].x, tokens[0].y + tokR + 0.28, 0]);
  const tagInt = T('intercept', P ? 15 : 16, C.pink, true, true).moveTo([tokens[1].x + 0.1, tokens[1].y + tokR + 0.28, 0]);
  await until(S(16));
  tokens[0].circ.setFill(C.pink, 0.38); tokens[0].circ.setColor(C.pink);
  tokens[1].circ.setFill(C.pink, 0.38); tokens[1].circ.setColor(C.pink);
  await play(
    new M.FadeOut(usedTok, { runTime: 0.3 }),
    new M.Indicate(tokens[0].g, { color: C.pink, runTime: 0.8 }),
    new M.Indicate(tokens[1].g, { color: C.pink, runTime: 0.8 }),
    new M.FadeIn(tagSlope, { runTime: 0.6 }),
    new M.FadeIn(tagInt, { runTime: 0.6 }),
    ...say('2 FITTED: SLOPE & INTERCEPT', C.pink),
    ...fbox(['Line fitted 2 numbers:', ['1. slope', C.pink], ['2. intercept', C.pink]], C.pink)
  );

  const leftNote = T('10 pieces left', P ? 20 : 19, C.green, true, true).moveTo([CX, tokCY - 0.5 * tokSpY - tokR - 0.55, 0]);
  const rem10 = tokens.slice(2);
  await until(S(17));
  rem10.forEach(tk => { tk.circ.setFill(C.green, 0.32); tk.circ.setColor(C.green); });
  await play(
    new M.LaggedStart(rem10.map(tk => new M.Indicate(tk.g, { color: C.green })), { lagRatio: 0.06, runTime: 1.0 }),
    new M.FadeIn(leftNote, { runTime: 0.6 }),
    ...say('12 − 2 = 10 PIECES LEFT', C.green),
    ...fbox(['12 apartments', ['− 2 used (slope, intercept)', C.pink], ['= 10 pieces left', C.green]], C.green)
  );

  const dofNote = pill('10 DEGREES OF FREEDOM', C.green, P ? 16 : 17).moveTo([CX, tokCY - 0.5 * tokSpY - tokR - 0.55, 0]);
  await until(S(18));
  await play(
    new M.FadeOut(leftNote, { runTime: 0.4 }),
    new M.FadeIn(dofNote, { runTime: 0.6 }),
    new M.LaggedStart(rem10.map(tk => new M.Indicate(tk.g, { color: C.amber })), { lagRatio: 0.06, runTime: 1.1 }),
    ...say('DEGREES OF FREEDOM = 10', C.green),
    ...fbox([['degrees of freedom', C.green], ['= 12 − 2 = 10', C.amber]], C.green)
  );

  // --- ACT 4 (19-27): Share 25,000 among 10 -> 2,500 -> sqrt = $50 -> ±$50 band -> Formula ---
  const bar10 = buildBar(10, C.green);
  const usedTag = pill('2 USED BY LINE  →  DIVIDE BY 10', C.pink, P ? 15 : 15).moveTo([CX, P ? -0.9 : -0.55, 0]);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...tokens.map(tk => tk.g), tagSlope, tagInt, dofNote), { runTime: 0.5 }),
    new M.FadeIn(bar10.rect, { runTime: 0.6 }),
    new M.FadeIn(bar10.title, { runTime: 0.6 }),
    new M.LaggedStart(bar10.divs.map(d => new M.Create(d)), { lagRatio: 0.05, runTime: 0.8 }),
    new M.LaggedStart(bar10.nums.map(n => new M.FadeIn(n)), { lagRatio: 0.04, runTime: 0.8 }),
    new M.FadeIn(usedTag, { runTime: 0.6 }),
    ...say('SHARE 25,000 AMONG 10', C.green),
    ...fbox(['sum of squared residuals', '= 25,000', ['share among 10 (not 12)', C.green]], C.green)
  );

  const share10Tag = pill('2,500 EACH', C.amber, P ? 16 : 17).moveTo([CX, P ? -0.9 : -0.55, 0]);
  await until(S(20));
  await play(
    new M.FadeOut(usedTag, { runTime: 0.4 }),
    new M.FadeIn(bar10.slice, { runTime: 0.6 }),
    new M.FadeIn(share10Tag, { runTime: 0.6 }),
    ...say('25,000 ÷ 10 = 2,500', C.amber),
    ...fbox(['25,000 ÷ 10', ['= 2,500', C.amber]], C.amber)
  );

  const sq10 = buildSquare('2,500', '$50', C.amber);
  await until(S(21));
  await play(
    new M.FadeOut(share10Tag, { runTime: 0.4 }),
    new M.Create(sq10.sq, { runTime: 0.8 }),
    new M.FadeIn(sq10.inside, { runTime: 0.6 }),
    new M.FadeIn(sq10.bot, { runTime: 0.6 }),
    new M.FadeIn(sq10.left, { runTime: 0.6 }),
    ...say('√2,500 = $50', C.amber),
    ...fbox(['25,000 ÷ 10 = 2,500', ['√2,500 = $50', C.amber], ['(50 × 50 = 2,500)', C.muted]], C.amber)
  );

  // Return to scatter plot with ±$50 typical-gap band
  const p3 = buildPlot(true);
  const bandHi = new M.DashedLine({ start: [ax(34), ay(790), 0], end: [ax(106), ay(1510), 0], color: C.amber });
  const bandLo = new M.DashedLine({ start: [ax(34), ay(690), 0], end: [ax(106), ay(1410), 0], color: C.amber });
  const brX = ax(106) + 0.12;
  const brTop = new M.Line({ start: [brX, ay(1410), 0], end: [brX, ay(1510), 0], color: C.amber, strokeWidth: 3 });
  const brCap = new M.Line({ start: [brX - 0.08, ay(1510), 0], end: [brX + 0.08, ay(1510), 0], color: C.amber, strokeWidth: 3 });
  const plus50 = T('+$50', P ? 18 : 18, C.amber, true, true).moveTo([brX + (P ? 0.36 : 0.45), ay(1510), 0]);
  const minus50 = T('−$50', P ? 18 : 18, C.amber, true, true).moveTo([brX + (P ? 0.36 : 0.45), ay(1410), 0]);

  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(
      bar10.rect, bar10.title, ...bar10.divs, ...bar10.nums, bar10.slice,
      sq10.sq, sq10.inside, sq10.bot, sq10.left
    ), { runTime: 0.5 }),
    new M.FadeIn(p3.frame, { runTime: 0.6 }),
    new M.FadeIn(p3.line, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...p3.dots), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...p3.sticks), { runTime: 0.6 }),
    new M.Create(bandHi, { runTime: 0.8 }),
    new M.Create(bandLo, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(brTop, brCap, plus50, minus50), { runTime: 0.7 }),
    ...say('TYPICAL GAP ≈ $50 FROM LINE', C.amber),
    ...fbox([['typical gap = $50', C.amber], 'above or below the line'], C.amber)
  );

  // S(23): closer (Y at 60/80/100) vs farther (X at 40/100, Z at 60/80)
  await until(S(23));
  await play(
    ...[4, 7, 10].map(k => new M.Flash(p3.dots[k], { color: C.green, runTime: 0.9 })),
    ...[0, 5, 8, 9].map(k => new M.Flash(p3.dots[k], { color: C.pink, runTime: 0.9 })),
    ...say('SOME CLOSER, SOME FARTHER', C.cyan)
  );

  await until(S(24));
  await play(
    new M.Indicate(plus50, { color: C.green, runTime: 0.9 }),
    new M.Indicate(minus50, { color: C.green, runTime: 0.9 }),
    ...say('RESIDUAL STANDARD ERROR', C.green),
    ...fbox([['Residual standard error', C.green], ['= $50', C.amber]], C.green)
  );

  await until(S(25));
  await play(
    ...say('1. SUM OF SQUARED RESIDUALS', C.cyan),
    ...fbox([['1. sum of squared residuals', C.cyan], '   = 25,000'], C.cyan)
  );

  await until(S(26));
  await play(
    ...say('2. DIVIDE BY APARTMENTS − 2', C.green),
    ...fbox(['1. sum of squares = 25,000', ['2. ÷ (12 − 2)     = 2,500', C.green]], C.green)
  );

  // S(27) is 1.70s long — keep animations crisp (<= 0.65s)
  await until(S(27));
  await play(
    ...say('3. TAKE THE SQUARE ROOT', C.amber),
    ...fbox(['1. sum of squares = 25,000', '2. ÷ (12 − 2)     = 2,500', ['3. √2,500         = $50', C.amber]], C.amber)
  );

  // --- ACT 5 (28-33): What it is for, the ÷12 trap, and one-sentence recap ---
  await until(S(28));
  await play(
    new M.Indicate(bandHi, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(bandLo, { color: C.amber, runTime: 0.8 }),
    ...say('NOISE AROUND THE LINE, IN $', C.green),
    ...fbox([['Residual standard error:', C.green], '√(25,000 ÷ (12 − 2))', ['= $50', C.amber]], C.green)
  );

  await until(S(29));
  await play(
    ...say('NEXT: SLOPE & PREDICTIONS', C.violet),
    ...fbox([['Used next for:', C.violet], '• slope uncertainty', '• prediction ranges'], C.violet)
  );

  // Comparison bars: ÷12 (~$46, pink) vs ÷10 ($50, green)
  const baseY = P ? -3.7 : -2.1, maxH = P ? 3.7 : 2.65;
  const dxBar = P ? 1.55 : 1.75, bw = P ? 1.65 : 1.85;
  const h46 = 45.64 / 55 * maxH, h50 = 50 / 55 * maxH;
  const cFloor = new M.Line({ start: [CX - dxBar - bw * 0.75, baseY, 0], end: [CX + dxBar + bw * 0.75, baseY, 0], color: C.muted, strokeWidth: 2 });
  const bar46 = new M.Rectangle({ width: bw, height: h46, color: C.pink, strokeWidth: 2.5 });
  bar46.setFill(C.pink, 0.35); bar46.moveTo([CX - dxBar, baseY + h46 / 2, 0]);
  const bar50 = new M.Rectangle({ width: bw, height: h50, color: C.green, strokeWidth: 2.5 });
  bar50.setFill(C.green, 0.35); bar50.moveTo([CX + dxBar, baseY + h50 / 2, 0]);

  const val46 = T('~$46', P ? 22 : 21, C.pink, true, true).moveTo([CX - dxBar, baseY + h50 + 0.32, 0]);
  const val50 = T('$50', P ? 22 : 21, C.amber, true, true).moveTo([CX + dxBar, baseY + h50 + 0.32, 0]);
  const sub46 = T('÷ 12', P ? 18 : 17, C.pink, true).moveTo([CX - dxBar, baseY - 0.32, 0]);
  const sub50 = T('÷ 10 (12 − 2)', P ? 18 : 17, C.green, true).moveTo([CX + dxBar, baseY - 0.32, 0]);

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(
      p3.frame, p3.line, ...p3.dots, ...p3.sticks, bandHi, bandLo, brTop, brCap, plus50, minus50
    ), { runTime: 0.5 }),
    new M.Create(cFloor, { runTime: 0.5 }),
    new M.FadeIn(bar46, { runTime: 0.7 }),
    new M.FadeIn(bar50, { runTime: 0.7 }),
    new M.FadeIn(sub46, { runTime: 0.6 }),
    new M.FadeIn(sub50, { runTime: 0.6 }),
    ...say('TRAP: DIVIDING BY 12', C.pink),
    ...fbox([['TRAP: dividing by 12', C.pink], 'noise looks too small'], C.pink)
  );

  const ref50 = new M.DashedLine({ start: [CX - dxBar - bw * 0.7, baseY + h50, 0], end: [CX + dxBar + bw * 0.7, baseY + h50, 0], color: C.amber });
  await until(S(31));
  await play(
    new M.Create(ref50, { runTime: 0.7 }),
    new M.FadeIn(val46, { runTime: 0.6 }),
    new M.FadeIn(val50, { runTime: 0.6 }),
    ...say('~$46 INSTEAD OF $50', C.pink),
    ...fbox([['÷ 12 → ~$46  (too small)', C.pink], ['÷ 10 →  $50  (honest)', C.green]], C.pink)
  );

  const warnTag = T('too optimistic', P ? 16 : 16, C.pink, true).moveTo([CX - dxBar, baseY - 0.68, 0]);
  const okTag = T('honest noise', P ? 16 : 16, C.green, true).moveTo([CX + dxBar, baseY - 0.68, 0]);
  await until(S(32));
  await play(
    new M.Indicate(bar46, { color: C.pink, runTime: 0.9 }),
    new M.FadeIn(warnTag, { runTime: 0.6 }),
    new M.FadeIn(okTag, { runTime: 0.6 }),
    ...say('LOOKS BETTER THAN REALITY', C.pink)
  );

  await until(S(33));
  await play(
    new M.Indicate(bar50, { color: C.amber, runTime: 1.0 }),
    new M.Indicate(val50, { color: C.amber, runTime: 1.0 }),
    ...say('RESIDUAL STANDARD ERROR = $50', C.green),
    ...fbox([
      ['Residual standard error', C.green],
      'typical gap from the line',
      ['√(25,000 ÷ 10) = $50', C.amber],
      ['10 degrees of freedom', C.cyan],
    ], C.green)
  );
}

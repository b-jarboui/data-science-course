// 6.3.6 Prior sensitivity: does the prior matter? (live manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based, 40 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Layout constants: portrait phone (8 x 14.22, y in [-5.5, 4.3]) and laptop (14.22 x 8, y in [-3.0, 2.3])
  const X0 = P ? -3.35 : -6.25, X1 = P ? 3.35 : 1.65, L0 = X1 - X0, CX = (X0 + X1) / 2;
  const BASE = P ? -0.35 : -1.35;
  const HMAX = P ? 2.85 : 2.65;
  const YMAX_SMALL = 4.65;
  const YMAX_BIG = 9.80;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.35, 0] : [4.55, -0.35, 0];
  const BOX_MAXW = P ? FW - 0.75 : 4.25;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const px = pct => X0 + (pct / 100) * L0;
  const py = (dens, yMax) => BASE + (dens / yMax) * HMAX;

  // Exact Beta PDF for integer shape numbers a, b >= 1
  const logFact = n => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
  const betaPdf = (x, a, b) => {
    if (x <= 0) return a === 1 ? b : 0;
    if (x >= 1) return b === 1 ? a : 0;
    const logB = logFact(a - 1) + logFact(b - 1) - logFact(a + b - 1);
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logB);
  };

  // One formula box at a time (matches approved reference 1.2.4)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.40 : 0.38;
    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g, { runTime: 0.65 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }

  // Drawing helpers (every returned object is fresh, placed with moveTo, fills via setFill)
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

  function makeDoubleArrow(from, to, color = C.amber, sw = 2.6, headLen = 0.15) {
    const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, ang = 0.52;
    const tip = (pt, dir) => {
      const ex = dir * ux, ey = dir * uy;
      return [
        new M.Line({ start: pt, end: [pt[0] - headLen * (ex * Math.cos(ang) - ey * Math.sin(ang)), pt[1] - headLen * (ey * Math.cos(ang) + ex * Math.sin(ang)), 0], color, strokeWidth: sw }),
        new M.Line({ start: pt, end: [pt[0] - headLen * (ex * Math.cos(-ang) - ey * Math.sin(-ang)), pt[1] - headLen * (ey * Math.cos(-ang) + ex * Math.sin(-ang)), 0], color, strokeWidth: sw })
      ];
    };
    return new M.VGroup(
      new M.Line({ start: from, end: to, color, strokeWidth: sw }),
      ...tip(to, 1),
      ...tip(from, -1)
    );
  }

  function makePerson(x, y, color, role, sub) {
    const head = new M.Circle({ radius: 0.22, color });
    head.setFill(color, 0.92);
    head.moveTo([x, y + 0.52, 0]);
    const body = new M.Arc({ radius: 0.38, startAngle: 0, angle: Math.PI, color });
    body.setFill(color, 0.85);
    body.moveTo([x, y + 0.02, 0]);
    const rLab = T(role, P ? 18 : 19, color, true, true);
    rLab.moveTo([x, y - 0.36, 0]);
    const sLab = T(sub, P ? 15 : 16, C.muted, true);
    sLab.moveTo([x, y - 0.68, 0]);
    return new M.VGroup(head, body, rLab, sLab);
  }

  function makePart(x, y, fail, ghost = false, scale = 1) {
    const col = fail ? C.pink : C.green;
    const w = (P ? 0.42 : 0.46) * scale, h = (P ? 0.36 : 0.40) * scale;
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.07 * scale, color: col, strokeWidth: ghost ? 1.5 : 2 });
    body.setFill(col, ghost ? 0.14 : 0.34);
    body.moveTo([x, y, 0]);
    const prH = 0.09 * scale, prDx = w * 0.22;
    const p1 = new M.Line({ start: [x - prDx, y + h / 2, 0], end: [x - prDx, y + h / 2 + prH, 0], color: col, strokeWidth: 2 });
    const p2 = new M.Line({ start: [x + prDx, y + h / 2, 0], end: [x + prDx, y + h / 2 + prH, 0], color: col, strokeWidth: 2 });
    const mark = T(fail ? '✕' : '✓', Math.round((P ? 14 : 16) * scale), col, true, true);
    mark.moveTo([x, y, 0]);
    return new M.VGroup(body, p1, p2, mark);
  }

  function makeDot(p, color, r = 0.095) {
    const halo = new M.Dot({ point: p, radius: r * 2.1, color });
    halo.setFill(color, 0.22);
    const d = new M.Dot({ point: p, radius: r, color });
    d.setFill(color, 1);
    return { g: new M.VGroup(halo, d), d };
  }

  function makeCard(x, y, w, h, lines, color) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95);
    r.moveTo([x, y, 0]);
    const ts = lines.map((item, i) => {
      const [txt, col, sz, bld] = Array.isArray(item)
        ? item
        : [item, i === 0 ? color : C.ink, P ? 16 : 17, i === 0];
      const t = T(txt, sz, col, true, bld);
      t.moveTo([x, y + ((lines.length - 1) / 2 - i) * (P ? 0.38 : 0.36), 0]);
      return t;
    });
    return new M.VGroup(r, ...ts);
  }

  function makeAxis(y = BASE, x0 = X0, x1 = X1, showUnit = true) {
    const span = x1 - x0;
    const xOf = pct => x0 + (pct / 100) * span;
    const line = new M.Line({ start: [x0, y, 0], end: [x1, y, 0], color: C.muted, strokeWidth: 2.8 });
    const parts = [];
    for (let v = 0; v <= 100; v += 20) {
      const x = xOf(v);
      parts.push(new M.Line({ start: [x, y - 0.08, 0], end: [x, y + 0.08, 0], color: C.muted, strokeWidth: 2 }));
      const t = T(v + '%', P ? 16 : 16, C.muted, true);
      t.moveTo([x, y - 0.31, 0]);
      parts.push(t);
    }
    const unit = showUnit ? T('failure rate', P ? 16 : 15, C.muted) : null;
    if (unit) unit.moveTo([(x0 + x1) / 2, y - 0.62, 0]);
    return { line, ticks: new M.VGroup(...parts), unit, xOf };
  }

  function makeBetaHill(a, b, color, yMax = YMAX_SMALL, fillOp = 0.17, nSeg = 64, x0 = X0, x1 = X1, base = BASE, hMax = HMAX) {
    const span = x1 - x0;
    const xOf = pct => x0 + (pct / 100) * span;
    const yOf = dens => base + (dens / yMax) * hMax;
    const pts = [];
    for (let i = 0; i <= nSeg; i++) {
      const pct = (i / nSeg) * 100;
      pts.push([xOf(pct), yOf(betaPdf(pct / 100, a, b)), 0]);
    }
    const dx = span / nSeg;
    const strips = [];
    const glowLines = [];
    const segs = [];
    for (let i = 0; i < nSeg; i++) {
      const h = Math.max(0.004, (betaPdf((i + 0.5) / nSeg, a, b) / yMax) * hMax);
      const r = new M.Rectangle({ width: dx + 0.015, height: h, color, strokeWidth: 0 });
      r.setFill(color, fillOp);
      r.setStrokeOpacity(0);
      r.moveTo([xOf(((i + 0.5) / nSeg) * 100), base + h / 2, 0]);
      strips.push(r);
      const g = new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: 6.5 });
      g.setStrokeOpacity(0.18);
      glowLines.push(g);
      segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: 3.1 }));
    }
    return { fill: new M.VGroup(...strips), glow: new M.VGroup(...glowLines), segs };
  }

  function makeGhostCurve(a, b, color, yMax = YMAX_BIG, nSeg = 54) {
    const segs = [];
    for (let i = 0; i < nSeg; i++) {
      const p0 = [px((i / nSeg) * 100), py(betaPdf(i / nSeg, a, b), yMax), 0];
      const p1 = [px(((i + 1) / nSeg) * 100), py(betaPdf((i + 1) / nSeg, a, b), yMax), 0];
      const l = new M.Line({ start: p0, end: p1, color, strokeWidth: 2 });
      l.setStrokeOpacity(0.45);
      segs.push(l);
    }
    return new M.VGroup(...segs);
  }

  function makeIntervalBar(loPct, hiPct, y, color, labelText, labelX) {
    const xL = px(loPct), xR = px(hiPct);
    const bar = new M.Line({ start: [xL, y, 0], end: [xR, y, 0], color, strokeWidth: 5 });
    const cL = new M.Line({ start: [xL, y - 0.12, 0], end: [xL, y + 0.12, 0], color, strokeWidth: 2.8 });
    const cR = new M.Line({ start: [xR, y - 0.12, 0], end: [xR, y + 0.12, 0], color, strokeWidth: 2.8 });
    const dL = new M.Dot({ point: [xL, y, 0], radius: 0.065, color }); dL.setFill(color, 1);
    const dR = new M.Dot({ point: [xR, y, 0], radius: 0.065, color }); dR.setFill(color, 1);
    const lab = T(labelText, P ? 17 : 15, color, true, true);
    lab.moveTo([labelX, y, 0]);
    return new M.VGroup(bar, cL, cR, dL, dR, lab);
  }

  // ==================== ACT 1 (0–3): Owner vs new manager ====================

  // 0: A new manager joins the repair shop. She looks at the owner's prior and frowns.
  const introY = P ? 1.55 : 0.45;
  const introDx = P ? 1.75 : 2.05;
  const ownerIcon = makePerson(CX - introDx, introY, C.cyan, 'OWNER', 'starts at 20%');
  const mgrIcon = makePerson(CX + introDx, introY, C.violet, 'NEW MANAGER', 'frowns…');
  const ownerBubble = makeCard(CX - introDx, introY - 1.55, P ? 2.95 : 3.15, 0.88, [
    ['Owner’s prior', C.cyan, P ? 16 : 17, true],
    ['mean = 20%', C.ink, P ? 15 : 16, false]
  ], C.cyan);

  await until(S(0));
  await play(
    new M.LaggedStart([new M.FadeIn(ownerIcon), new M.FadeIn(ownerBubble), new M.FadeIn(mgrIcon)], { lagRatio: 0.25, runTime: 1.5 }),
    ...fbox([['Owner: starts at 20%', C.cyan], ['New manager: frowns…', C.violet]], C.violet),
    ...say('NEW MANAGER QUESTIONS THE PRIOR', C.violet)
  );

  // 1: Why start at twenty percent? she asks. I would not assume anything.
  const mgrBubble = makeCard(CX + introDx, introY - 1.55, P ? 2.95 : 3.15, 0.88, [
    ['“Why 20%?”', C.amber, P ? 16 : 17, true],
    ['assume nothing!', C.violet, P ? 15 : 16, false]
  ], C.violet);

  await until(S(1));
  await play(
    new M.Indicate(mgrIcon, { color: C.violet, runTime: 0.9 }),
    new M.FadeIn(mgrBubble, { runTime: 0.8 }),
    ...fbox([['Owner:   start at 20%', C.cyan], ['Manager: assume nothing', C.violet]], C.amber),
    ...say('“WHY 20%? ASSUME NOTHING”', C.amber)
  );

  // 2: Who is right? Both priors seem reasonable.
  const bothTag = pill('BOTH PRIORS SEEM REASONABLE', C.green, P ? 16 : 17);
  bothTag.moveTo([CX, introY - 2.65, 0]);

  await until(S(2));
  await play(
    new M.Indicate(ownerBubble, { color: C.green, runTime: 0.8 }),
    new M.Indicate(mgrBubble, { color: C.green, runTime: 0.8 }),
    new M.FadeIn(bothTag, { runTime: 0.8 }),
    ...say('WHO IS RIGHT? BOTH ARE REASONABLE', C.green)
  );

  // 3: So let's try both, and compare the answers.
  const arrL = makeArrow([CX - introDx, introY - 2.02, 0], [CX - 0.75, introY - 2.42, 0], C.cyan, 2.4);
  const arrR = makeArrow([CX + introDx, introY - 2.02, 0], [CX + 0.75, introY - 2.42, 0], C.violet, 2.4);

  await until(S(3));
  await play(
    new M.FadeIn(arrL, { runTime: 0.7 }),
    new M.FadeIn(arrR, { runTime: 0.7 }),
    ...fbox([['Plan:', C.cyan], '1. try Owner’s prior', '2. try Manager’s prior', ['3. compare answers', C.amber]], C.cyan),
    ...say('TRY BOTH & COMPARE THE ANSWERS', C.cyan)
  );

  // ==================== ACT 2 (4–8): Beta(2, 8) vs flat Beta(1, 1) ====================

  // 4: The owner's prior is beta two, eight. As if two failures and eight passes were already seen. Its mean is twenty percent.
  const ownY = P ? 1.85 : 0.72;
  const ownTitle = T('Owner’s prior: Beta(2, 8)   ·   mean = 20%', P ? 17 : 18, C.cyan, true, true);
  ownTitle.moveTo([CX, ownY + 0.62, 0]);
  const ownSp = P ? 0.62 : 0.68;
  const ownParts = Array.from({ length: 10 }, (_, k) =>
    makePart(CX + (k - 4.5) * ownSp, ownY, k < 2, true, 0.95)
  );
  const ownSub = T(P ? 'as if 2 fail + 8 pass already seen' : 'as if 2 failures and 8 passes already seen', P ? 17 : 15, C.muted, true);
  ownSub.moveTo([CX, ownY - 0.50, 0]);

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(ownerIcon, mgrIcon, ownerBubble, mgrBubble, bothTag, arrL, arrR), { runTime: 0.55 }),
    new M.FadeIn(ownTitle, { runTime: 0.7 }),
    new M.LaggedStart(ownParts.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 1.4 }),
    new M.FadeIn(ownSub, { runTime: 0.8 }),
    ...fbox([['Owner: Beta(2, 8)', C.cyan], 'as if 2 fail, 8 pass', ['mean = 2 ÷ 10 = 20%', C.amber]], C.cyan),
    ...say('OWNER PRIOR: BETA(2, 8) · MEAN 20%', C.cyan)
  );

  // 5: The manager's prior is beta one, one. As if only one failure and one pass were seen. It is perfectly flat.
  const mgrY = P ? -0.75 : -1.25;
  const mgrTitle = T('Manager’s prior: Beta(1, 1)   ·   perfectly flat', P ? 17 : 18, C.violet, true, true);
  mgrTitle.moveTo([CX, mgrY + 0.62, 0]);
  const mgrParts = [
    makePart(CX - 0.45, mgrY, true, true, 1.05),
    makePart(CX + 0.45, mgrY, false, true, 1.05)
  ];
  const mgrSub = T(P ? 'as if 1 fail + 1 pass: flat' : 'as if 1 failure and 1 pass — flat across all rates', P ? 17 : 15, C.muted, true);
  mgrSub.moveTo([CX, mgrY - 0.52, 0]);

  await until(S(5));
  await play(
    new M.FadeIn(mgrTitle, { runTime: 0.7 }),
    new M.LaggedStart(mgrParts.map(p => new M.FadeIn(p)), { lagRatio: 0.25, runTime: 1.0 }),
    new M.FadeIn(mgrSub, { runTime: 0.8 }),
    ...fbox([['Owner:   Beta(2, 8)', C.cyan], ['Manager: Beta(1, 1)', C.violet], 'as if 1 fail, 1 pass', ['perfectly flat', C.violet]], C.violet),
    ...say('MANAGER PRIOR: BETA(1, 1) · FLAT', C.violet)
  );

  // 6: Flat means every rate from zero to one hundred percent gets the same belief.
  const ax1 = makeAxis(BASE, X0, X1, true);
  const flatHill = makeBetaHill(1, 1, C.violet, YMAX_SMALL, 0.18, 60);
  const flatY = py(1, YMAX_SMALL);
  const eqDots = [10, 30, 50, 70, 90].map(v => makeDot([px(v), flatY, 0], C.violet, 0.075));

  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(ownTitle, ...ownParts, ownSub, mgrTitle, ...mgrParts, mgrSub), { runTime: 0.5 }),
    new M.Create(ax1.line, { runTime: 0.7 }),
    new M.FadeIn(ax1.ticks, { runTime: 0.7 }),
    new M.FadeIn(ax1.unit, { runTime: 0.7 }),
    new M.FadeIn(flatHill.fill, { runTime: 0.9 }),
    new M.FadeIn(flatHill.glow, { runTime: 0.9 }),
    new M.LaggedStart(flatHill.segs.map(l => new M.Create(l)), { lagRatio: 0.02, runTime: 1.1 }),
    new M.LaggedStart(eqDots.map(d => new M.FadeIn(d.g)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox([['Beta(1, 1) — flat', C.violet], 'every rate 0% to 100%', 'gets the same belief'], C.violet),
    ...say('FLAT = EVERY RATE GETS EQUAL BELIEF', C.violet)
  );

  // 7: Even flat is a choice. It says a rate of ninety percent is as believable as twenty, before any data.
  const d20 = makeDot([px(20), flatY, 0], C.amber, 0.095);
  const d90 = makeDot([px(90), flatY, 0], C.amber, 0.095);
  const v20 = new M.DashedLine({ start: [px(20), BASE, 0], end: [px(20), flatY, 0], color: C.amber });
  const v90 = new M.DashedLine({ start: [px(90), BASE, 0], end: [px(90), flatY, 0], color: C.amber });
  const eqBar = makeDoubleArrow([px(22), flatY + 0.42, 0], [px(88), flatY + 0.42, 0], C.amber, 2.4);
  const eqLab = T('same belief: 20% = 90%', P ? 16 : 17, C.amber, true, true);
  eqLab.moveTo([px(55), flatY + 0.76, 0]);

  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(...eqDots.map(d => d.g)), { runTime: 0.4 }),
    new M.Create(v20, { runTime: 0.6 }),
    new M.Create(v90, { runTime: 0.6 }),
    new M.FadeIn(d20.g, { runTime: 0.6 }),
    new M.FadeIn(d90.g, { runTime: 0.6 }),
    new M.Flash(d20.d, { color: C.amber, runTime: 0.7 }),
    new M.Flash(d90.d, { color: C.amber, runTime: 0.7 }),
    new M.FadeIn(eqBar, { runTime: 0.7 }),
    new M.FadeIn(eqLab, { runTime: 0.7 }),
    ...fbox([['Even flat is a choice:', C.amber], 'belief at 90%', ['= belief at 20%', C.violet], '(before any data)'], C.amber),
    ...say('EVEN FLAT IS A CHOICE: 90% = 20%', C.amber)
  );

  // 8: Let's draw the two priors: a blue hill leaning left, and a flat purple line.
  const ownerPriorHill = makeBetaHill(2, 8, C.cyan, YMAX_SMALL, 0.18, 60);
  const ownPriorTag = T('Owner: Beta(2, 8)', P ? 15 : 16, C.cyan, true, true);
  ownPriorTag.moveTo([px(33), py(betaPdf(0.125, 2, 8), YMAX_SMALL) + 0.20, 0]);
  const mgrPriorTag = T('Manager: Beta(1, 1)', P ? 15 : 16, C.violet, true, true);
  mgrPriorTag.moveTo([px(72), flatY + 0.34, 0]);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(v20, v90, d20.g, d90.g, eqBar, eqLab), { runTime: 0.45 }),
    new M.FadeIn(ownerPriorHill.fill, { runTime: 0.9 }),
    new M.FadeIn(ownerPriorHill.glow, { runTime: 0.9 }),
    new M.LaggedStart(ownerPriorHill.segs.map(l => new M.Create(l)), { lagRatio: 0.02, runTime: 1.2 }),
    new M.FadeIn(ownPriorTag, { runTime: 0.7 }),
    new M.FadeIn(mgrPriorTag, { runTime: 0.7 }),
    ...fbox([['Blue:   Owner Beta(2, 8)', C.cyan], ['Purple: Manager Beta(1, 1)', C.violet]], C.cyan),
    ...say('BLUE HILL vs FLAT PURPLE LINE', C.cyan)
  );

  // ==================== ACT 3 (9–18): Small batch (3 fail, 7 pass) ====================

  // 9: Now both receive the same batch: three failures and seven passes.
  const batchY = P ? -1.65 : -2.22;
  const batchSp = P ? 0.62 : 0.68;
  const batchParts = Array.from({ length: 10 }, (_, k) =>
    makePart(CX + (k - 4.5) * batchSp, batchY, k < 3, false, 0.90)
  );
  const batchLab = T('Same batch: 3 failures, 7 passes (10 parts)', P ? 14 : 15, C.amber, true);
  batchLab.moveTo([CX, batchY - 0.46, 0]);

  await until(S(9));
  await play(
    new M.FadeOut(ax1.unit, { runTime: 0.4 }),
    new M.LaggedStart(batchParts.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 1.2 }),
    new M.FadeIn(batchLab, { runTime: 0.7 }),
    ...fbox([['Same batch (10 parts):', C.amber], ['+3 failures', C.pink], ['+7 passes', C.green]], C.amber),
    ...say('SAME BATCH: 3 FAILURES, 7 PASSES', C.amber)
  );

  // 10: We update by adding, as in lesson three: failures to the first number, passes to the second.
  await until(S(10));
  await play(
    new M.LaggedStart(batchParts.slice(0, 3).map(p => new M.Indicate(p, { color: C.pink })), { lagRatio: 0.14, runTime: 1.0 }),
    new M.LaggedStart(batchParts.slice(3).map(p => new M.Indicate(p, { color: C.green })), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox([['Update rule (6.3.3):', C.amber], ['+ failures → 1st number', C.pink], ['+ passes   → 2nd number', C.green]], C.amber),
    ...say('JUST ADD: +FAILURES, +PASSES', C.amber)
  );

  // 11: Owner: two plus three is five, eight plus seven is fifteen. Beta five, fifteen.
  await until(S(11));
  await play(
    new M.Indicate(ownPriorTag, { color: C.cyan, runTime: 1.0 }),
    ...fbox([['Owner prior: Beta(2, 8)', C.cyan], '  2 + 3 = 5   (fail)', '  8 + 7 = 15  (pass)', ['→ Beta(5, 15)', C.cyan]], C.cyan),
    ...say('OWNER: BETA(2+3, 8+7) = BETA(5, 15)', C.cyan)
  );

  // 12: Manager: one plus three is four, one plus seven is eight. Beta four, eight.
  await until(S(12));
  await play(
    new M.Indicate(mgrPriorTag, { color: C.violet, runTime: 1.0 }),
    ...fbox([['Manager prior: Beta(1, 1)', C.violet], '  1 + 3 = 4   (fail)', '  1 + 7 = 8   (pass)', ['→ Beta(4, 8)', C.violet]], C.violet),
    ...say('MANAGER: BETA(1+3, 1+7) = BETA(4, 8)', C.violet)
  );

  // 13: Let's draw the two posteriors. (short beat: 1.75s)
  const ownPost10 = makeBetaHill(5, 15, C.cyan, YMAX_SMALL, 0.18, 60);
  const mgrPost10 = makeBetaHill(4, 8, C.violet, YMAX_SMALL, 0.16, 60);
  const ownP10Tag = T('Owner Beta(5, 15)', P ? 16 : 15, C.cyan, true, true);
  ownP10Tag.moveTo([px(21), py(betaPdf(4 / 18, 5, 15), YMAX_SMALL) + 0.24, 0]);
  const mgrP10Tag = T('Manager Beta(4, 8)', P ? 16 : 15, C.violet, true, true);
  mgrP10Tag.moveTo([px(58), py(betaPdf(0.30, 4, 8), YMAX_SMALL) + 0.16, 0]);

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(
      ownerPriorHill.fill, ownerPriorHill.glow, ...ownerPriorHill.segs,
      flatHill.fill, flatHill.glow, ...flatHill.segs,
      ownPriorTag, mgrPriorTag, ...batchParts, batchLab
    ), { runTime: 0.45 }),
    new M.FadeIn(ownPost10.fill, { runTime: 0.85 }),
    new M.FadeIn(ownPost10.glow, { runTime: 0.85 }),
    new M.LaggedStart(ownPost10.segs.map(l => new M.Create(l)), { lagRatio: 0.015, runTime: 0.9 }),
    new M.FadeIn(mgrPost10.fill, { runTime: 0.85 }),
    new M.FadeIn(mgrPost10.glow, { runTime: 0.85 }),
    new M.LaggedStart(mgrPost10.segs.map(l => new M.Create(l)), { lagRatio: 0.015, runTime: 0.9 }),
    new M.FadeIn(ownP10Tag, { runTime: 0.8 }),
    new M.FadeIn(mgrP10Tag, { runTime: 0.8 }),
    ...say('TWO POSTERIORS (10 PARTS)', C.cyan)
  );

  // 14: The owner's mean is five out of twenty, twenty five percent.
  const m25Line = new M.DashedLine({ start: [px(25), BASE, 0], end: [px(25), py(betaPdf(0.25, 5, 15), YMAX_SMALL), 0], color: C.cyan });
  const m25Dot = makeDot([px(25), BASE, 0], C.cyan, 0.085);
  const m25Lab = T('owner mean 25%', P ? 17 : 16, C.cyan, true, true);
  m25Lab.moveTo([Math.min(X1 - m25Lab.getWidth() / 2, px(80)), BASE + HMAX * 0.40, 0]);

  await until(S(14));
  await play(
    new M.Create(m25Line, { runTime: 0.7 }),
    new M.FadeIn(m25Dot.g, { runTime: 0.7 }),
    new M.FadeIn(m25Lab, { runTime: 0.7 }),
    new M.Flash(m25Dot.d, { color: C.cyan, runTime: 0.7 }),
    ...fbox([['Owner: Beta(5, 15)', C.cyan], ['mean = 5 ÷ 20 = 25%', C.cyan]], C.cyan),
    ...say('OWNER MEAN: 5 ÷ 20 = 25%', C.cyan)
  );

  // 15: The manager's mean is four out of twelve, about thirty three percent.
  const m33Line = new M.DashedLine({ start: [px(33.33), BASE, 0], end: [px(33.33), py(betaPdf(1 / 3, 4, 8), YMAX_SMALL), 0], color: C.violet });
  const m33Dot = makeDot([px(33.33), BASE, 0], C.violet, 0.085);
  const m33Lab = T('manager mean 33%', P ? 17 : 16, C.violet, true, true);
  m33Lab.moveTo([Math.min(X1 - m33Lab.getWidth() / 2, px(80)), BASE + HMAX * 0.40 - (P ? 0.42 : 0.36), 0]);

  await until(S(15));
  await play(
    new M.Create(m33Line, { runTime: 0.7 }),
    new M.FadeIn(m33Dot.g, { runTime: 0.7 }),
    new M.FadeIn(m33Lab, { runTime: 0.7 }),
    new M.Flash(m33Dot.d, { color: C.violet, runTime: 0.7 }),
    ...fbox([['Owner:   5 ÷ 20 = 25%', C.cyan], ['Manager: 4 ÷ 12 ≈ 33%', C.violet], ['gap = 8 points', C.amber]], C.violet),
    ...say('MANAGER MEAN: 4 ÷ 12 ≈ 33%', C.violet)
  );

  // 16: The owner's ninety five percent credible interval runs from nine to forty six percent.
  const ciY1 = P ? -1.40 : -2.12;
  const ciY2 = P ? -2.15 : -2.66;
  const ownCI10 = makeIntervalBar(9, 46, ciY1, C.cyan, 'Owner: 9%–46%', px(74));

  await until(S(16));
  await play(
    new M.FadeIn(ownCI10, { runTime: 0.85 }),
    ...fbox([['Owner Beta(5, 15):', C.cyan], 'mean = 25%', ['95% CI: 9% to 46%', C.cyan]], C.cyan),
    ...say('OWNER 95% INTERVAL: 9% TO 46%', C.cyan)
  );

  // 17: The manager's runs from eleven to sixty one percent.
  const mgrCI10 = makeIntervalBar(11, 61, ciY2, C.violet, 'Mgr: 11%–61%', px(81));

  await until(S(17));
  await play(
    new M.FadeIn(mgrCI10, { runTime: 0.85 }),
    ...fbox([['Owner   95% CI:  9%–46%', C.cyan], ['Manager 95% CI: 11%–61%', C.violet]], C.violet),
    ...say('MANAGER 95% INTERVAL: 11% TO 61%', C.violet)
  );

  // 18: The two answers are clearly different. With only ten parts, the prior still matters.
  const gapY = BASE + HMAX + 0.18;
  const gapArr = new M.VGroup(
    makeDoubleArrow([px(25.4), gapY, 0], [px(32.9), gapY, 0], C.amber, 2.6, 0.11),
    new M.DashedLine({ start: [px(25), py(betaPdf(0.25, 5, 15), YMAX_SMALL), 0], end: [px(25), gapY, 0], color: C.cyan }),
    new M.DashedLine({ start: [px(33.33), py(betaPdf(1 / 3, 4, 8), YMAX_SMALL), 0], end: [px(33.33), gapY, 0], color: C.violet }));
  const gapTag = T('8 pts apart', P ? 18 : 16, C.amber, true, true);
  gapTag.moveTo([px(33.33) + 0.25 + gapTag.getWidth() / 2, gapY, 0]);
  const extraTail = new M.Line({ start: [px(46), ciY2, 0], end: [px(61), ciY2, 0], color: C.pink, strokeWidth: 6.5 });

  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(ownP10Tag, mgrP10Tag), { runTime: 0.4 }),
    new M.FadeIn(gapArr, { runTime: 0.7 }),
    new M.FadeIn(gapTag, { runTime: 0.7 }),
    new M.Create(extraTail, { runTime: 0.7 }),
    ...fbox([['Only 10 parts:', C.amber], 'means:  25% vs 33%', '95% CI: 9–46% vs 11–61%', ['→ prior still matters', C.pink]], C.amber),
    ...say('10 PARTS: THE PRIOR STILL MATTERS', C.amber)
  );

  // ==================== ACT 4 (19–26): Big batch (100 parts: 30 fail, 70 pass) ====================

  // 19: Now imagine a different, much bigger batch: one hundred parts, of which thirty fail and seventy pass.
  const gridCX = CX, gridCY = P ? 0.45 : -0.45;
  const gDx = P ? 0.44 : 0.46, gDy = P ? 0.35 : 0.30;
  const cells = [];
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 10; row++) {
      const fail = col < 3;
      const colr = fail ? C.pink : C.green;
      const sq = new M.RoundedRectangle({ width: gDx * 0.78, height: gDy * 0.76, cornerRadius: 0.04, color: colr, strokeWidth: 1.2 });
      sq.setFill(colr, fail ? 0.78 : 0.56);
      sq.moveTo([gridCX + (col - 4.5) * gDx, gridCY + (4.5 - row) * gDy, 0]);
      cells.push(sq);
    }
  }
  const bigGridCap = T(P ? '100 parts: 30 fail (pink), 70 pass' : '100 parts:  30 failures (pink)  ·  70 passes (green)', P ? 17 : 15, C.amber, true, true);
  bigGridCap.moveTo([gridCX, gridCY - 5 * gDy - 0.38, 0]);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(
      ax1.line, ax1.ticks, ownPost10.fill, ownPost10.glow, ...ownPost10.segs,
      mgrPost10.fill, mgrPost10.glow, ...mgrPost10.segs,
      m25Line, m25Dot.g, m25Lab, m33Line, m33Dot.g, m33Lab, ownCI10, mgrCI10,
      gapArr, gapTag, extraTail
    ), { runTime: 0.55 }),
    new M.LaggedStart(cells.map(c => new M.FadeIn(c)), { lagRatio: 0.008, runTime: 1.5 }),
    new M.FadeIn(bigGridCap, { runTime: 0.8 }),
    ...fbox([['Much bigger batch:', C.amber], ['30 failures', C.pink], ['70 passes', C.green], 'total = 100 parts'], C.amber),
    ...say('BIG BATCH: 100 PARTS (30 FAIL, 70 PASS)', C.amber)
  );

  // 20: Let's go back to the two starting priors, and update each with this big batch.
  const ax2 = makeAxis(BASE, X0, X1, false);
  const ghostOwn = makeGhostCurve(2, 8, C.cyan, YMAX_BIG, 54);
  const ghostMgr = makeGhostCurve(1, 1, C.violet, YMAX_BIG, 54);
  const ghostNote = T(P ? 'priors + 100 parts (30 fail, 70 pass)' : 'starting priors + 100 parts (30 fail, 70 pass)', P ? 16 : 15, C.muted, true);
  ghostNote.moveTo([CX, BASE + HMAX * 0.50, 0]);

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(...cells, bigGridCap), { runTime: 0.5 }),
    new M.Create(ax2.line, { runTime: 0.7 }),
    new M.FadeIn(ax2.ticks, { runTime: 0.7 }),
    new M.FadeIn(ghostOwn, { runTime: 0.8 }),
    new M.FadeIn(ghostMgr, { runTime: 0.8 }),
    new M.FadeIn(ghostNote, { runTime: 0.8 }),
    ...fbox([['Back to both priors:', C.ink], ['Owner:   Beta(2, 8)', C.cyan], ['Manager: Beta(1, 1)', C.violet], ['+ 30 fail, + 70 pass', C.amber]], C.cyan),
    ...say('BACK TO BOTH PRIORS + 100 PARTS', C.cyan)
  );

  // 21: Owner: two plus thirty, eight plus seventy. Beta thirty two, seventy eight. Its mean is about twenty nine percent.
  const ownPost100 = makeBetaHill(32, 78, C.cyan, YMAX_BIG, 0.20, 72);
  const m29Line = new M.DashedLine({ start: [px(29.09), BASE, 0], end: [px(29.09), py(betaPdf(32 / 110, 32, 78), YMAX_BIG), 0], color: C.cyan });
  const m29Dot = makeDot([px(29.09), BASE, 0], C.cyan, 0.08);
  const ownP100Tag = T('Owner ≈ 29%', P ? 17 : 16, C.cyan, true, true);
  const tagY100 = P ? BASE + HMAX + 0.5 : py(7.8, YMAX_BIG);
  const ownTX = P ? px(30) - 1.05 : px(17) - 0.15 - ownP100Tag.getWidth() / 2;
  ownP100Tag.moveTo([ownTX, tagY100, 0]);
  const ownP100Arr = P ? makeArrow([ownTX + 0.2, tagY100 - 0.22, 0], [px(27.5), py(9.3, YMAX_BIG), 0], C.cyan, 2.2, 0.13)
    : makeArrow([ownTX + ownP100Tag.getWidth() / 2 + 0.05, py(7.4, YMAX_BIG), 0], [px(26.5), py(7.0, YMAX_BIG), 0], C.cyan, 2.2, 0.13);

  await until(S(21));
  await play(
    new M.FadeOut(ghostNote, { runTime: 0.4 }),
    new M.FadeIn(ownPost100.fill, { runTime: 0.9 }),
    new M.FadeIn(ownPost100.glow, { runTime: 0.9 }),
    new M.LaggedStart(ownPost100.segs.map(l => new M.Create(l)), { lagRatio: 0.015, runTime: 1.2 }),
    new M.Create(m29Line, { runTime: 0.7 }),
    new M.FadeIn(m29Dot.g, { runTime: 0.7 }),
    new M.FadeIn(ownP100Tag, { runTime: 0.7 }),
    new M.FadeIn(ownP100Arr, { runTime: 0.7 }),
    ...fbox([['Owner: Beta(2+30, 8+70)', C.cyan], '= Beta(32, 78)', ['mean = 32 ÷ 110 ≈ 29%', C.cyan]], C.cyan),
    ...say('OWNER: BETA(32, 78) · MEAN ≈ 29%', C.cyan)
  );

  // 22: Manager: one plus thirty, one plus seventy. Beta thirty one, seventy one. Its mean is about thirty percent.
  const mgrPost100 = makeBetaHill(31, 71, C.violet, YMAX_BIG, 0.18, 72);
  const m30Line = new M.DashedLine({ start: [px(30.39), BASE, 0], end: [px(30.39), py(betaPdf(31 / 102, 31, 71), YMAX_BIG), 0], color: C.violet });
  const m30Dot = makeDot([px(30.39), BASE, 0], C.violet, 0.08);
  const mgrP100Tag = T('Manager ≈ 30%', P ? 17 : 16, C.violet, true, true);
  const mgrTX = P ? px(30) + 1.25 : px(43) + 0.15 + mgrP100Tag.getWidth() / 2;
  mgrP100Tag.moveTo([mgrTX, tagY100, 0]);
  const mgrP100Arr = P ? makeArrow([mgrTX - 0.3, tagY100 - 0.22, 0], [px(33), py(8.6, YMAX_BIG), 0], C.violet, 2.2, 0.13)
    : makeArrow([mgrTX - mgrP100Tag.getWidth() / 2 - 0.05, py(7.4, YMAX_BIG), 0], [px(34.5), py(7.0, YMAX_BIG), 0], C.violet, 2.2, 0.13);

  await until(S(22));
  await play(
    new M.FadeIn(mgrPost100.fill, { runTime: 0.9 }),
    new M.FadeIn(mgrPost100.glow, { runTime: 0.9 }),
    new M.LaggedStart(mgrPost100.segs.map(l => new M.Create(l)), { lagRatio: 0.015, runTime: 1.2 }),
    new M.Create(m30Line, { runTime: 0.7 }),
    new M.FadeIn(m30Dot.g, { runTime: 0.7 }),
    new M.FadeIn(mgrP100Tag, { runTime: 0.7 }),
    new M.FadeIn(mgrP100Arr, { runTime: 0.7 }),
    ...fbox([['Manager: Beta(1+30, 1+70)', C.violet], '= Beta(31, 71)', ['mean = 31 ÷ 102 ≈ 30%', C.violet]], C.violet),
    ...say('MANAGER: BETA(31, 71) · MEAN ≈ 30%', C.violet)
  );

  // 23: Their ninety five percent intervals now overlap almost completely, both roughly from twenty to forty percent.
  const ownCI100 = makeIntervalBar(21, 38, ciY1, C.cyan, 'Owner: 21%–38%', px(66));
  const mgrCI100 = makeIntervalBar(22, 40, ciY2, C.violet, 'Mgr:   22%–40%', px(66));

  await until(S(23));
  await play(
    new M.FadeIn(ownCI100, { runTime: 0.8 }),
    new M.FadeIn(mgrCI100, { runTime: 0.8 }),
    ...fbox([['Owner   95% CI: 21%–38%', C.cyan], ['Manager 95% CI: 22%–40%', C.violet], ['both ≈ 20% to 40%', C.green]], C.green),
    ...say('95% INTERVALS OVERLAP: ≈ 20%–40%', C.green)
  );

  // 24: The two hills have nearly merged into one. (short beat: 2.47s)
  const mergeBox = new M.RoundedRectangle({ width: px(43) - px(17), height: HMAX + 0.16, cornerRadius: 0.16, color: C.green, strokeWidth: 2.4 });
  mergeBox.setFill(C.green, 0.07);
  mergeBox.moveTo([px(30), BASE + HMAX / 2 + 0.04, 0]);

  await until(S(24));
  await play(
    new M.Create(mergeBox, { runTime: 0.8 }),
    ...say('THE TWO HILLS NEARLY MERGED', C.green)
  );

  // 25: With lots of data, the data speak louder than the prior.
  const loudTag = pill('DATA SPEAK LOUDER', C.green, P ? 16 : 17);
  loudTag.moveTo([px(66), py(4.5, YMAX_BIG), 0]);

  await until(S(25));
  await play(
    new M.Indicate(mergeBox, { color: C.green, runTime: 0.9 }),
    new M.FadeIn(loudTag, { runTime: 0.7 }),
    ...fbox([['10 parts:  25% vs 33%', C.amber], ['100 parts: 29% vs 30%', C.green], ['more data → priors fade', C.green]], C.green),
    ...say('LOTS OF DATA → DATA SPEAK LOUDER', C.green)
  );

  // 26: It is like two people with different first guesses about a new restaurant. After many visits, they agree.
  const rX0 = X0 + 0.85, rX1 = X1 - 0.65, rCY = P ? 0.55 : -0.35;
  const rAxis = new M.Line({ start: [rX0, rCY - 1.55, 0], end: [rX1, rCY - 1.55, 0], color: C.muted, strokeWidth: 2.2 });
  const rTicks = [['1st guess', 0], ['3 visits', 0.35], ['10 visits', 0.70], ['many visits', 1]].map(([txt, f]) => {
    const x = rX0 + f * (rX1 - rX0);
    const t = T(txt, P ? 15 : 14, C.muted, true);
    t.moveTo([x, rCY - 1.88, 0]);
    return new M.VGroup(new M.Line({ start: [x, rCY - 1.62, 0], end: [x, rCY - 1.48, 0], color: C.muted }), t);
  });
  const pathA = [], pathB = [];
  const N_PATH = 28;
  for (let i = 0; i < N_PATH; i++) {
    const t0 = i / N_PATH, t1 = (i + 1) / N_PATH;
    const xA0 = rX0 + t0 * (rX1 - rX0), xA1 = rX0 + t1 * (rX1 - rX0);
    const yA0 = rCY + 1.25 * Math.exp(-3.2 * t0), yA1 = rCY + 1.25 * Math.exp(-3.2 * t1);
    const yB0 = rCY - 1.15 * Math.exp(-3.2 * t0), yB1 = rCY - 1.15 * Math.exp(-3.2 * t1);
    pathA.push(new M.Line({ start: [xA0, yA0, 0], end: [xA1, yA1, 0], color: C.cyan, strokeWidth: 3.2 }));
    pathB.push(new M.Line({ start: [xA0, yB0, 0], end: [xA1, yB1, 0], color: C.violet, strokeWidth: 3.2 }));
  }
  const dotA0 = makeDot([rX0, rCY + 1.25, 0], C.cyan, 0.10);
  const dotB0 = makeDot([rX0, rCY - 1.15, 0], C.violet, 0.10);
  const dotEnd = makeDot([rX1, rCY, 0], C.green, 0.12);
  const labA0 = T('“Great!”', P ? 15 : 16, C.cyan, true, true); labA0.moveTo([rX0 + 0.55, rCY + 1.56, 0]);
  const labB0 = T('“Doubt it”', P ? 15 : 16, C.violet, true, true); labB0.moveTo([rX0 + 0.65, rCY - 1.12, 0]);
  const labEnd = T('Agree!', P ? 17 : 18, C.green, true, true); labEnd.moveTo([rX1 - 0.15, rCY + 0.44, 0]);

  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(
      ax2.line, ax2.ticks, ghostOwn, ghostMgr,
      ownPost100.fill, ownPost100.glow, ...ownPost100.segs,
      mgrPost100.fill, mgrPost100.glow, ...mgrPost100.segs,
      m29Line, m29Dot.g, ownP100Tag, ownP100Arr,
      m30Line, m30Dot.g, mgrP100Tag, mgrP100Arr,
      ownCI100, mgrCI100, mergeBox, loudTag
    ), { runTime: 0.55 }),
    new M.Create(rAxis, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...rTicks), { runTime: 0.7 }),
    new M.FadeIn(dotA0.g, { runTime: 0.6 }),
    new M.FadeIn(dotB0.g, { runTime: 0.6 }),
    new M.FadeIn(labA0, { runTime: 0.6 }),
    new M.FadeIn(labB0, { runTime: 0.6 }),
    new M.LaggedStart(pathA.map(l => new M.Create(l)), { lagRatio: 0.04, runTime: 1.5 }),
    new M.LaggedStart(pathB.map(l => new M.Create(l)), { lagRatio: 0.04, runTime: 1.5 }),
    new M.FadeIn(dotEnd.g, { runTime: 0.9 }),
    new M.FadeIn(labEnd, { runTime: 0.9 }),
    ...fbox([['New restaurant:', C.amber], 'different first guesses', ['many visits → they agree', C.green]], C.green),
    ...say('DIFFERENT FIRST GUESSES → AGREE', C.green)
  );

  // ==================== ACT 5 (27–35): Name it, the 3-step habit, what it is for ====================

  // 27: Checking how much the answer changes when you change the prior is called prior sensitivity analysis.
  const defY = P ? 1.75 : 0.65;
  const defDx = P ? 1.85 : 2.15;
  const defW = P ? 2.75 : 3.05;
  const defL = makeCard(CX - defDx, defY, defW, 1.05, [
    ['CHANGE PRIOR', C.violet, P ? 16 : 17, true],
    ['Beta(2,8) → Beta(1,1)', C.muted, P ? 13 : 14, false]
  ], C.violet);
  const defArr = makeArrow([CX - defDx + defW / 2 + 0.08, defY, 0], [CX + defDx - defW / 2 - 0.08, defY, 0], C.amber, 2.8);
  const defR = makeCard(CX + defDx, defY, defW, 1.05, [
    ['CHECK ANSWER', C.cyan, P ? 16 : 17, true],
    ['how much does it move?', C.muted, P ? 13 : 14, false]
  ], C.cyan);
  const psaBanner = pill('PRIOR SENSITIVITY ANALYSIS', C.cyan, P ? 18 : 20);
  psaBanner.moveTo([CX, defY - 1.18, 0]);

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(rAxis, ...rTicks, ...pathA, ...pathB, dotA0.g, dotB0.g, dotEnd.g, labA0, labB0, labEnd), { runTime: 0.5 }),
    new M.FadeIn(defL, { runTime: 0.7 }),
    new M.FadeIn(defArr, { runTime: 0.7 }),
    new M.FadeIn(defR, { runTime: 0.7 }),
    new M.FadeIn(psaBanner, { runTime: 0.85 }),
    ...fbox([['Prior sensitivity analysis:', C.cyan], 'change the prior,', 'check how much', ['the answer moves', C.amber]], C.cyan),
    ...say('PRIOR SENSITIVITY ANALYSIS', C.cyan)
  );

  // 28: Sensitivity means: how strongly does the answer react?
  let sensLo, sensHi;
  if (P) {
    sensLo = makeCard(CX, -0.85, 6.2, 0.96, [
      ['LOW SENSITIVITY', C.green, 16, true],
      ['answer barely moves → sturdy', C.ink, 14, false]
    ], C.green);
    sensHi = makeCard(CX, -2.08, 6.2, 0.96, [
      ['HIGH SENSITIVITY', C.pink, 16, true],
      ['answer jumps a lot → fragile', C.ink, 14, false]
    ], C.pink);
  } else {
    sensLo = makeCard(CX - 1.95, -1.78, 3.60, 1.05, [
      ['LOW SENSITIVITY', C.green, 16, true],
      ['barely moves → sturdy', C.ink, 14, false]
    ], C.green);
    sensHi = makeCard(CX + 1.95, -1.78, 3.60, 1.05, [
      ['HIGH SENSITIVITY', C.pink, 16, true],
      ['jumps a lot → fragile', C.ink, 14, false]
    ], C.pink);
  }

  await until(S(28));
  await play(
    new M.FadeIn(sensLo, { runTime: 0.75 }),
    new M.FadeIn(sensHi, { runTime: 0.75 }),
    ...fbox([['Sensitivity:', C.amber], ['barely moves → sturdy', C.green], ['jumps a lot  → sensitive', C.pink]], C.amber),
    ...say('SENSITIVITY = HOW MUCH IT REACTS', C.amber)
  );

  // 29: There is no formula to learn here. The recipe is a habit.
  const habitHdr = makeCard(CX, P ? 0.55 : -0.35, P ? 6.2 : 6.6, 1.35, [
    ['NO FORMULA TO MEMORIZE', C.cyan, P ? 20 : 21, true],
    ['The recipe is a simple 3-step habit', C.amber, P ? 16 : 17, false]
  ], C.cyan);

  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(defL, defArr, defR, psaBanner, sensLo, sensHi), { runTime: 0.5 }),
    new M.FadeIn(habitHdr, { runTime: 0.8 }),
    ...fbox([['No formula to learn', C.cyan], ['The recipe is a habit', C.amber]], C.cyan),
    ...say('NO FORMULA: THE RECIPE IS A HABIT', C.cyan)
  );

  // 30-32: Steps 1, 2, 3
  const stY1 = P ? 2.05 : 0.82, stY2 = P ? 0.30 : -0.55, stY3 = P ? -1.45 : -1.92;
  const stW = P ? 6.4 : 7.0, stH = P ? 1.15 : 0.96;
  const step1 = makeCard(CX, stY1, stW, stH, [
    ['STEP 1 · PICK 2 OR 3 PRIORS', C.cyan, P ? 17 : 18, true],
    ['priors a sensible person could defend', C.ink, P ? 15 : 15, false]
  ], C.cyan);
  const stepA1 = makeArrow([CX, stY1 - stH / 2 - 0.05, 0], [CX, stY2 + stH / 2 + 0.05, 0], C.muted, 2.4);
  const step2 = makeCard(CX, stY2, stW, stH, [
    ['STEP 2 · UPDATE EACH ONE', C.amber, P ? 17 : 18, true],
    ['run all of them with the exact same data', C.ink, P ? 15 : 15, false]
  ], C.amber);
  const stepA2 = makeArrow([CX, stY2 - stH / 2 - 0.05, 0], [CX, stY3 + stH / 2 + 0.05, 0], C.muted, 2.4);
  const step3 = makeCard(CX, stY3, stW, stH, [
    ['STEP 3 · COMPARE POSTERIORS', C.green, P ? 17 : 18, true],
    ['compare the answers and the decisions they lead to', C.ink, P ? 14 : 15, false]
  ], C.green);

  // 30: Step one: pick two or three priors that a sensible person could defend.
  await until(S(30));
  await play(
    new M.FadeOut(habitHdr, { runTime: 0.45 }),
    new M.FadeIn(step1, { runTime: 0.8 }),
    ...fbox([['1. Pick 2–3 priors', C.cyan], '   a sensible person', '   could defend'], C.cyan),
    ...say('STEP 1: PICK 2–3 SENSIBLE PRIORS', C.cyan)
  );

  // 31: Step two: update each one with the same data.
  await until(S(31));
  await play(
    new M.FadeIn(stepA1, { runTime: 0.5 }),
    new M.FadeIn(step2, { runTime: 0.8 }),
    ...fbox([['1. Pick 2–3 priors', C.muted], ['2. Update each one', C.amber], '   with the same data'], C.amber),
    ...say('STEP 2: UPDATE WITH THE SAME DATA', C.amber)
  );

  // 32: Step three: compare the posteriors and the decisions they lead to.
  await until(S(32));
  await play(
    new M.FadeIn(stepA2, { runTime: 0.5 }),
    new M.FadeIn(step3, { runTime: 0.8 }),
    ...fbox([['1. Pick 2–3 priors', C.muted], ['2. Update with same data', C.muted], ['3. Compare posteriors', C.green], ['   and decisions', C.green]], C.green),
    ...say('STEP 3: COMPARE ANSWERS & DECISIONS', C.green)
  );

  // 33: If the answers agree, report them with confidence.
  const brAgree = P
    ? makeCard(CX, 1.45, 6.4, 1.55, [
      ['IF ANSWERS AGREE  ✓', C.green, 19, true],
      ['Report them with confidence', C.ink, 16, false]
    ], C.green)
    : makeCard(CX - 1.95, -0.35, 3.60, 2.05, [
      ['ANSWERS AGREE ✓', C.green, 18, true],
      ['Report them', C.ink, 16, false],
      ['with confidence', C.ink, 16, false]
    ], C.green);

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(step1, stepA1, step2, stepA2, step3), { runTime: 0.5 }),
    new M.FadeIn(brAgree, { runTime: 0.8 }),
    ...fbox([['If answers agree:', C.green], 'report with confidence'], C.green),
    ...say('AGREE → REPORT WITH CONFIDENCE', C.green)
  );

  // 34: If they disagree, say so honestly. You need more data, or better reasons for your prior.
  const brDis = P
    ? makeCard(CX, -0.75, 6.4, 1.75, [
      ['IF ANSWERS DISAGREE', C.pink, 19, true],
      ['Say so honestly', C.amber, 16, true],
      ['Need more data, or better prior reasons', C.ink, 14, false]
    ], C.pink)
    : makeCard(CX + 1.95, -0.35, 3.60, 2.05, [
      ['DISAGREE', C.pink, 18, true],
      ['Say so honestly', C.amber, 16, true],
      ['Need more data or', C.ink, 14, false],
      ['better prior reasons', C.ink, 14, false]
    ], C.pink);

  await until(S(34));
  await play(
    new M.FadeIn(brDis, { runTime: 0.85 }),
    ...fbox([['If answers disagree:', C.pink], 'say so honestly', '→ gather more data', '→ or justify your prior'], C.pink),
    ...say('DISAGREE → BE HONEST · NEED MORE DATA', C.pink)
  );

  // 35: What is it for? It shows whether your conclusion comes from the data, or from your starting belief.
  let wfData, wfPrior, wfConc, wfArr1, wfArr2;
  if (P) {
    wfData = makeCard(CX, 2.05, 5.6, 0.96, [['THE DATA', C.green, 19, true], ['what you observed', C.muted, 14, false]], C.green);
    wfConc = makeCard(CX, 0.20, 5.6, 1.05, [['YOUR CONCLUSION', C.cyan, 19, true], ['which side is driving it?', C.amber, 15, false]], C.cyan);
    wfPrior = makeCard(CX, -1.65, 5.6, 0.96, [['STARTING BELIEF', C.violet, 19, true], ['your chosen prior', C.muted, 14, false]], C.violet);
    wfArr1 = makeArrow([CX, 1.52, 0], [CX, 0.78, 0], C.green, 2.8);
    wfArr2 = makeArrow([CX, -1.12, 0], [CX, -0.38, 0], C.violet, 2.8);
  } else {
    wfData = makeCard(CX - 2.65, -0.35, 2.15, 1.40, [['THE DATA', C.green, 17, true], ['observed', C.muted, 14, false]], C.green);
    wfConc = makeCard(CX, -0.35, 2.25, 1.50, [['CONCLUSION', C.cyan, 17, true], ['driven by?', C.amber, 14, false]], C.cyan);
    wfPrior = makeCard(CX + 2.65, -0.35, 2.15, 1.40, [['THE PRIOR', C.violet, 17, true], ['first belief', C.muted, 14, false]], C.violet);
    wfArr1 = makeArrow([CX - 1.52, -0.35, 0], [CX - 1.18, -0.35, 0], C.green, 2.8);
    wfArr2 = makeArrow([CX + 1.52, -0.35, 0], [CX + 1.18, -0.35, 0], C.violet, 2.8);
  }

  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(brAgree, brDis), { runTime: 0.5 }),
    new M.LaggedStart([
      new M.FadeIn(wfData), new M.FadeIn(wfArr1),
      new M.FadeIn(wfConc),
      new M.FadeIn(wfArr2), new M.FadeIn(wfPrior)
    ], { lagRatio: 0.16, runTime: 1.4 }),
    ...fbox([['What is it for?', C.cyan], 'checks whether result is:', ['• from the data', C.green], ['• or starting belief', C.violet]], C.cyan),
    ...say('WHAT IS IT FOR? DATA vs STARTING BELIEF', C.cyan)
  );

  // ==================== ACT 6 (36–39): Common trap (prior shopping) & recap ====================

  // 36: Here is a common trap. Do not shop for a prior after seeing the results.
  const trTopY = P ? 2.05 : 0.78, trBotY = P ? -0.45 : -1.15;
  const trRes = makeCard(CX, trTopY, P ? 5.6 : 6.0, 0.96, [
    ['SEE RESULTS FIRST', C.amber, P ? 17 : 18, true],
    ['then go shopping for a prior…', C.muted, P ? 14 : 15, false]
  ], C.amber);
  const trArr = makeArrow([CX, trTopY - 0.54, 0], [CX, trBotY + 0.58, 0], C.pink, 2.8);
  const trX = T('✕', P ? 32 : 34, C.pink, true, true);
  trX.moveTo([CX + 0.55, (trTopY + trBotY) / 2, 0]);
  const shSp = P ? 2.15 : 2.35, shW = P ? 1.92 : 2.10;
  const shA = makeCard(CX - shSp, trBotY, shW, 0.96, [['Prior A', C.muted, 15, true], ['too high', C.muted, 13, false]], C.muted);
  const shB = makeCard(CX, trBotY, shW, 0.96, [['Prior B', C.pink, 15, true], ['“hoped for!”', C.pink, 13, true]], C.pink);
  const shC = makeCard(CX + shSp, trBotY, shW, 0.96, [['Prior C', C.muted, 15, true], ['too low', C.muted, 13, false]], C.muted);

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(wfData, wfConc, wfPrior, wfArr1, wfArr2), { runTime: 0.5 }),
    new M.FadeIn(trRes, { runTime: 0.7 }),
    new M.FadeIn(trArr, { runTime: 0.7 }),
    new M.FadeIn(trX, { runTime: 0.7 }),
    new M.LaggedStart([new M.FadeIn(shA), new M.FadeIn(shB), new M.FadeIn(shC)], { lagRatio: 0.14, runTime: 1.0 }),
    ...fbox([['Common trap:', C.pink], 'do NOT shop for a prior', 'after seeing results'], C.pink),
    ...say('TRAP: DO NOT SHOP FOR A PRIOR', C.pink)
  );

  // 37: Choosing the prior that gives the answer you hoped for is cheating, even if it feels small.
  const cheatRing = new M.RoundedRectangle({ width: shW + 0.24, height: 1.18, cornerRadius: 0.18, color: C.pink, strokeWidth: 3.2 });
  cheatRing.moveTo([CX, trBotY, 0]);
  const cheatPill = pill('✕  THIS IS CHEATING', C.pink, P ? 17 : 18);
  cheatPill.moveTo([CX, trBotY - 1.18, 0]);

  await until(S(37));
  await play(
    new M.Create(cheatRing, { runTime: 0.7 }),
    new M.Indicate(shB, { color: C.pink, runTime: 0.9 }),
    new M.FadeIn(cheatPill, { runTime: 0.7 }),
    ...fbox([['Picking the prior that', C.pink], ['gives what you hoped', C.pink], ['= cheating', C.pink]], C.pink),
    ...say('CHERRY-PICKING A PRIOR IS CHEATING', C.pink)
  );

  // 38: Choose and write down your priors before you look at the data.
  let ro1, ro2, roArr;
  if (P) {
    ro1 = makeCard(CX, 1.45, 6.2, 1.25, [['1. WRITE DOWN PRIORS', C.cyan, 18, true], ['choose before seeing data', C.ink, 15, false]], C.cyan);
    roArr = makeArrow([CX, 0.76, 0], [CX, -0.02, 0], C.green, 3.0);
    ro2 = makeCard(CX, -0.72, 6.2, 1.25, [['2. LOOK AT THE DATA', C.green, 18, true], ['update and compare honestly', C.ink, 15, false]], C.green);
  } else {
    ro1 = makeCard(CX - 2.05, -0.35, 3.35, 1.55, [['1. WRITE PRIORS', C.cyan, 17, true], ['before seeing data', C.ink, 15, false]], C.cyan);
    roArr = makeArrow([CX - 0.32, -0.35, 0], [CX + 0.32, -0.35, 0], C.green, 3.0);
    ro2 = makeCard(CX + 2.05, -0.35, 3.35, 1.55, [['2. LOOK AT DATA', C.green, 17, true], ['update honestly', C.ink, 15, false]], C.green);
  }

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(trRes, trArr, trX, shA, shB, shC, cheatRing, cheatPill), { runTime: 0.5 }),
    new M.FadeIn(ro1, { runTime: 0.7 }),
    new M.FadeIn(roArr, { runTime: 0.7 }),
    new M.FadeIn(ro2, { runTime: 0.7 }),
    ...fbox([['Right order:', C.green], ['1. Write down priors', C.cyan], ['2. Then look at data', C.green]], C.green),
    ...say('WRITE DOWN PRIORS BEFORE DATA', C.green)
  );

  // 39: In one sentence: rerun the analysis with other reasonable priors; if the answer barely moves, the data are doing the talking.
  let recSmallAx, recBigAx, recS1, recS2, recB1, recB2, recSTag, recBTag;
  if (P) {
    recSmallAx = makeAxis(0.65, -3.0, 3.0, false);
    recS1 = makeBetaHill(5, 15, C.cyan, YMAX_SMALL, 0.18, 48, -3.0, 3.0, 0.65, 1.75);
    recS2 = makeBetaHill(4, 8, C.violet, YMAX_SMALL, 0.16, 48, -3.0, 3.0, 0.65, 1.75);
    recSTag = T('10 parts: 25% vs 33% (prior matters)', 14, C.amber, true, true);
    recSTag.moveTo([0, 2.75, 0]);

    recBigAx = makeAxis(-2.15, -3.0, 3.0, false);
    recB1 = makeBetaHill(32, 78, C.cyan, YMAX_BIG, 0.20, 56, -3.0, 3.0, -2.15, 1.75);
    recB2 = makeBetaHill(31, 71, C.violet, YMAX_BIG, 0.18, 56, -3.0, 3.0, -2.15, 1.75);
    recBTag = T('100 parts: 29% vs 30% (data talking)', 14, C.green, true, true);
    recBTag.moveTo([0, -0.08, 0]);
  } else {
    const sX0 = -6.20, sX1 = -2.65, bX0 = -1.95, bX1 = 1.60, rBase = -1.55, rH = 2.25;
    recSmallAx = makeAxis(rBase, sX0, sX1, false);
    recS1 = makeBetaHill(5, 15, C.cyan, YMAX_SMALL, 0.18, 44, sX0, sX1, rBase, rH);
    recS2 = makeBetaHill(4, 8, C.violet, YMAX_SMALL, 0.16, 44, sX0, sX1, rBase, rH);
    recSTag = T('10 parts: prior matters', 15, C.amber, true, true);
    recSTag.moveTo([(sX0 + sX1) / 2, rBase + rH + 0.34, 0]);

    recBigAx = makeAxis(rBase, bX0, bX1, false);
    recB1 = makeBetaHill(32, 78, C.cyan, YMAX_BIG, 0.20, 52, bX0, bX1, rBase, rH);
    recB2 = makeBetaHill(31, 71, C.violet, YMAX_BIG, 0.18, 52, bX0, bX1, rBase, rH);
    recBTag = T('100 parts: data talking', 15, C.green, true, true);
    recBTag.moveTo([(bX0 + bX1) / 2, rBase + rH + 0.34, 0]);
  }

  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(ro1, roArr, ro2), { runTime: 0.5 }),
    new M.Create(recSmallAx.line, { runTime: 0.7 }),
    new M.FadeIn(recSmallAx.ticks, { runTime: 0.7 }),
    new M.FadeIn(recS1.fill, { runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...recS1.segs), { runTime: 0.9 }),
    new M.FadeIn(recS2.fill, { runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...recS2.segs), { runTime: 0.9 }),
    new M.FadeIn(recSTag, { runTime: 0.8 }),
    new M.Create(recBigAx.line, { runTime: 0.7 }),
    new M.FadeIn(recBigAx.ticks, { runTime: 0.7 }),
    new M.FadeIn(recB1.fill, { runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...recB1.segs), { runTime: 1.0 }),
    new M.FadeIn(recB2.fill, { runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...recB2.segs), { runTime: 1.0 }),
    new M.FadeIn(recBTag, { runTime: 0.9 }),
    ...fbox([['One-sentence recap:', C.green], 'rerun with other priors;', 'if answer barely moves,', ['data are doing the talking', C.amber]], C.green),
    ...say('BARELY MOVES → DATA DO THE TALKING', C.green)
  );
}

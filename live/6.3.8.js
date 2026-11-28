// 6.3.8 Chain diagnostics: live animation in site/live/engine.js.
// Beat i = sentence i (0-based, 38 sentences). Shared example: repair shop Beta(5, 15).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // --- layout: laptop (14.22 x 8, y in [-3.0, 2.3]) vs phone (8 x 14.22, y in [-5.5, 4.3]) ---
  const X0 = P ? -2.75 : -5.85, X1 = P ? 3.45 : 1.85;
  const Y0 = P ? -5.5 : -2.20, Y1 = P ? 0.85 : 1.15;
  const CX = (X0 + X1) / 2, CW = X1 - X0, CH = Y1 - Y0;
  const PILL = P ? [0, 1.68, 0] : [CX, 1.90, 0];
  const BOXP = P ? [0, 3.22, 0] : [4.55, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // centered hill layout for opening act (beats 0-6, before formula box appears)
  const HX0 = P ? -3.15 : -5.2, HX1 = P ? 3.15 : 5.2;
  const HY0 = P ? -4.6 : -2.15, HY1 = P ? 0.55 : 1.05;
  const hx = p => HX0 + (p / 100) * (HX1 - HX0);
  const hy = v => HY0 + v * (HY1 - HY0);

  // trace plot coordinate helpers (rate 0..100 on y, fraction 0..1 on x)
  const tx = u => X0 + u * CW;
  const ty = r => Y0 + (r / 100) * CH;

  // 4 chains: 5%, 30%, 60%, 90%
  const STARTS = [5, 30, 60, 90];
  const COLS = [C.cyan, C.green, C.amber, C.pink];
  const GOOD_MEANS = [24, 25, 26, 25];
  const BAD_MEANS = [5, 16, 56, 83];

  // --- single formula box (replaces previous) ---
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.35 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.3;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.7 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }

  // --- Beta(5, 15) density normalized to peak = 1 at mode 4/18 ---
  const rawBeta = p => (p <= 0 || p >= 1) ? 0 : Math.pow(p, 4) * Math.pow(1 - p, 14);
  const BETA_MAX = rawBeta(4 / 18);
  const betaH = pct => rawBeta(pct / 100) / BETA_MAX;
  const bimodalH = pct => Math.max(betaH(pct), 0.74 * Math.exp(-Math.pow((pct - 78) / 6.5, 2)));

  // --- deterministic PRNG for realistic, reproducible MCMC traces ---
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const randNorm = u => Math.sqrt(-2 * Math.log(Math.max(1e-9, u()))) * Math.cos(2 * Math.PI * u());

  // Good run: 4 chains, 64 plotted steps (0..7 warm-up drop/climb, 8..63 fuzzy caterpillar over 5..60%)
  const N_GOOD = 64, WARM_IDX = 8;
  const GOOD_TRACES = STARTS.map((start, c) => {
    const u = rng(6381 + c * 97);
    const pts = [start];
    let p = start / 100;
    // quick convergence in warm-up
    const warmTargets = [
      [5, 12, 18, 25, 21, 29, 23, 27],
      [30, 26, 21, 29, 24, 18, 27, 23],
      [60, 48, 39, 31, 26, 33, 24, 28],
      [90, 74, 59, 46, 35, 28, 22, 26],
    ][c];
    for (let i = 1; i < WARM_IDX; i++) pts.push(warmTargets[i]);
    p = pts[WARM_IDX - 1] / 100;
    const tail = [];
    for (let i = WARM_IDX; i < N_GOOD; i++) {
      for (let s = 0; s < 28; s++) {
        const prop = p + 0.105 * randNorm(u);
        if (prop > 0.04 && prop < 0.62) {
          const acc = Math.min(1, rawBeta(prop) / Math.max(1e-18, rawBeta(p)));
          if (u() < acc) p = prop;
        }
      }
      tail.push(p * 100);
    }
    // gently align sample mean to exact lesson value (24, 25, 26, 25)
    const curMean = tail.reduce((a, b) => a + b, 0) / tail.length;
    const shift = GOOD_MEANS[c] - curMean;
    for (const v of tail) pts.push(Math.max(5, Math.min(60, v + shift)));
    return pts;
  });

  // Bad run: 4 chains, 45 plotted steps (slow snail crawl, means 5, 16, 56, 83%)
  const N_BAD = 45;
  const BAD_TRACES = STARTS.map((start, c) => {
    const u = rng(9103 + c * 131);
    const ends = [5.3, 10.0, 53.0, 79.0];
    const curves = [0.6, 1.8, 0.9, 1.3];
    const pts = [start];
    for (let i = 1; i < N_BAD; i++) {
      const f = i / (N_BAD - 1);
      const base = start + (ends[c] - start) * Math.pow(f, 1 / curves[c]);
      const jitter = (u() - 0.5) * (c === 0 ? 1.4 : 2.6);
      pts.push(Math.max(2, Math.min(96, base + jitter)));
    }
    const mean = pts.reduce((a, b) => a + b, 0) / pts.length;
    const shift = BAD_MEANS[c] - mean;
    return pts.map((v, i) => i === 0 ? start : Math.max(2.5, Math.min(96, v + shift * Math.min(1, i / 4))));
  });

  // --- helpers to build reusable geometry ---
  function buildHill(xFn, yFn, hFn, color, steps = 54, withBars = true) {
    const segs = [], bars = [];
    const bw = (xFn(100) - xFn(0)) / steps * 0.84;
    for (let i = 0; i < steps; i++) {
      const p1 = (i / steps) * 100, p2 = ((i + 1) / steps) * 100;
      const y1 = yFn(hFn(p1)), y2 = yFn(hFn(p2));
      segs.push(new M.Line({ start: [xFn(p1), y1, 0], end: [xFn(p2), y2, 0], color, strokeWidth: 3 }));
      if (withBars) {
        const hm = hFn((p1 + p2) / 2);
        const bh = Math.max(0.01, yFn(hm) - yFn(0));
        if (bh > 0.03) {
          const r = new M.Rectangle({ width: bw, height: bh, color, strokeWidth: 0 });
          r.setFill(color, 0.22);
          r.moveTo([xFn((p1 + p2) / 2), yFn(0) + bh / 2, 0]);
          bars.push(r);
        }
      }
    }
    return { segs, bars };
  }

  function makeTraceSegs(traces, x0, x1, y0, y1, fromIdx, toIdx, sw = 2.0, op = 0.9) {
    const N = traces[0].length - 1;
    const px = i => x0 + (i / N) * (x1 - x0);
    const py = r => y0 + (r / 100) * (y1 - y0);
    return traces.map((pts, c) => {
      const segs = [];
      for (let i = fromIdx; i < toIdx; i++) {
        const l = new M.Line({ start: [px(i), py(pts[i]), 0], end: [px(i + 1), py(pts[i + 1]), 0], color: COLS[c], strokeWidth: sw });
        if (op < 1) l.setStrokeOpacity(op);
        segs.push(l);
      }
      return segs;
    });
  }

  function makeWalker(x, y, color, r = 0.12) {
    const halo = new M.Dot({ point: [x, y, 0], radius: r * 2.3, color }); halo.setFill(color, 0.22);
    const core = new M.Dot({ point: [x, y, 0], radius: r, color }); core.setFill(color, 1);
    return { halo, core };
  }

  function spanBar(x, yLow, yHigh, color, label, side = 1) {
    const vline = new M.Line({ start: [x, yLow, 0], end: [x, yHigh, 0], color, strokeWidth: 3 });
    const cap1 = new M.Line({ start: [x - 0.11, yLow, 0], end: [x + 0.11, yLow, 0], color, strokeWidth: 3 });
    const cap2 = new M.Line({ start: [x - 0.11, yHigh, 0], end: [x + 0.11, yHigh, 0], color, strokeWidth: 3 });
    const t = T(label, P ? 16 : 15, color, true, true);
    t.moveTo([x + side * (t.getWidth() / 2 + 0.2), (yLow + yHigh) / 2, 0]);
    const bg = new M.RoundedRectangle({ width: t.getWidth() + 0.2, height: t.getHeight() + 0.16, cornerRadius: 0.06, color, strokeWidth: 1.5 });
    bg.setFill(C.bg, 0.92); bg.moveTo(t.getCenter());
    return new M.VGroup(vline, cap1, cap2, bg, t);
  }

  // =========================================================================
  // ACT 1: POSTERIOR HILL & FOUR WALKERS (Beats 0-6)
  // =========================================================================

  // Beat 0: Last lesson, a walker wandered over the posterior hill and its footprints drew the hill
  const hAxis = new M.Line({ start: [HX0, HY0, 0], end: [HX1, HY0, 0], color: C.muted, strokeWidth: 2.5 });
  const hTicks = [0, 25, 50, 75, 100].map(v => new M.VGroup(
    new M.Line({ start: [hx(v), HY0 - 0.08, 0], end: [hx(v), HY0 + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(`${v}%`, P ? 15 : 17, C.muted, true).moveTo([hx(v), HY0 - 0.34, 0])
  ));
  const hAxisLab = T('failure rate', P ? 16 : 17, C.muted);
  hAxisLab.moveTo([(HX0 + HX1) / 2, HY0 - 0.72, 0]);
  const { segs: hillSegs, bars: hillBars } = buildHill(hx, hy, betaH, C.green, 52, true);
  const hillCurve = new M.VGroup(...hillSegs);
  const hillFill = new M.VGroup(...hillBars);

  const hopRates = [24, 18, 29, 22, 34, 15, 26, 20, 31, 25];
  const footprints = hopRates.map((r, i) => {
    const d = new M.Dot({ point: [hx(r), hy(betaH(r) * (0.28 + (i % 3) * 0.24)), 0], radius: 0.075, color: C.cyan });
    d.setFill(C.cyan, 0.85);
    return d;
  });
  const w0 = makeWalker(hx(24), hy(betaH(24)), C.cyan, 0.13);

  await until(S(0));
  await play(
    new M.Create(hAxis, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...hTicks, hAxisLab), { runTime: 0.8 }),
    new M.FadeIn(hillFill, { runTime: 1.0 }),
    new M.FadeIn(hillCurve, { runTime: 1.0 }),
    ...say('LAST LESSON: ONE WALKER ON THE HILL')
  );
  await play(
    new M.FadeIn(w0.halo, { runTime: 0.4 }),
    new M.FadeIn(w0.core, { runTime: 0.4 }),
    new M.LaggedStart(footprints.map(d => new M.FadeIn(d, { runTime: 0.35 })), { lagRatio: 0.22, runTime: 2.2 })
  );

  // Beat 1: How do we know the walker explored the whole hill, and did not get stuck?
  const stuckRing = new M.Circle({ radius: 0.48, color: C.amber, strokeWidth: 2.5 });
  stuckRing.setFill(C.amber, 0.10);
  stuckRing.moveTo([hx(25), hy(0.55), 0]);
  const qMark = T('?  did it get stuck?', P ? 17 : 20, C.amber, true, true);
  qMark.moveTo([hx(64), hy(0.66), 0]);
  await until(S(1));
  await play(
    new M.Create(stuckRing, { runTime: 0.9 }),
    new M.FadeIn(qMark, { runTime: 0.8 }),
    ...say('DID IT EXPLORE THE WHOLE HILL?', C.amber)
  );

  // Beat 2: In real problems, we cannot compare with an exact answer. Check the walk itself.
  const noExact = T('exact hill unknown', P ? 17 : 19, C.muted, true);
  noExact.moveTo([hx(62), hy(0.72), 0]);
  await until(S(2));
  await play(
    new M.FadeOut(hillCurve, { runTime: 0.8 }),
    new M.FadeOut(hillFill, { runTime: 0.8 }),
    new M.FadeOut(stuckRing, { runTime: 0.6 }),
    new M.FadeOut(qMark, { runTime: 0.6 }),
    new M.FadeIn(noExact, { runTime: 0.8 }),
    ...say('NO EXACT ANSWER — CHECK THE WALK', C.amber)
  );

  // Beat 3: Send several walkers, starting from very different places
  const { segs: refSegs } = buildHill(hx, hy, betaH, C.green, 52, false);
  refSegs.forEach(s => s.setStrokeOpacity(0.32));
  const refHill = new M.VGroup(...refSegs);
  const walkers = STARTS.map((r, c) => makeWalker(hx(r), HY0 + 0.24, COLS[c], 0.13));
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(w0.halo, w0.core, ...footprints, noExact), { runTime: 0.6 }),
    new M.FadeIn(refHill, { runTime: 0.7 }),
    new M.LaggedStart(walkers.map(w => new M.FadeIn(w.halo, { runTime: 0.45 })), { lagRatio: 0.18, runTime: 1.5 }),
    new M.LaggedStart(walkers.map(w => new M.FadeIn(w.core, { runTime: 0.45 })), { lagRatio: 0.18, runTime: 1.5 }),
    ...say('SEND SEVERAL WALKERS FROM FAR APART')
  );

  // Beat 4: If they all end up wandering over the same ground, they probably found the whole hill
  const gathered = [18, 23, 27, 32];
  const gBox = new M.RoundedRectangle({ width: hx(42) - hx(10), height: hy(0.95) - HY0, cornerRadius: 0.16, color: C.green, strokeWidth: 2 });
  gBox.setFill(C.green, 0.08);
  gBox.moveTo([hx(26), (HY0 + hy(0.95)) / 2, 0]);
  const gLab = T('same ground', P ? 16 : 18, C.green, true, true);
  gLab.moveTo([hx(26), hy(1.06), 0]);
  await until(S(4));
  await play(
    ...walkers.flatMap((w, c) => {
      const txp = hx(gathered[c]), typ = hy(betaH(gathered[c]) * 0.72);
      const tHalo = new M.Dot({ point: [txp, typ, 0], radius: 0.30, color: COLS[c] }); tHalo.setFill(COLS[c], 0.22);
      const tCore = new M.Dot({ point: [txp, typ, 0], radius: 0.13, color: COLS[c] }); tCore.setFill(COLS[c], 1);
      return [
        new M.Transform(w.halo, tHalo, { pathArc: c < 2 ? -0.45 : 0.45, runTime: 1.4 }),
        new M.Transform(w.core, tCore, { pathArc: c < 2 ? -0.45 : 0.45, runTime: 1.4 }),
      ];
    }),
    new M.Create(gBox, { runTime: 1.1 }),
    new M.FadeIn(gLab, { runTime: 1.0 }),
    ...say('SAME GROUND → FOUND THE HILL', C.green)
  );

  // Beat 5: Each walker's path is called a chain (short beat: 2.38s)
  await until(S(5));
  await play(
    ...walkers.map((w, c) => new M.Indicate(w.core, { color: COLS[c], runTime: 0.9 })),
    ...say('EACH WALKER’S PATH = A CHAIN', C.violet)
  );

  // Beat 6: Let's start four chains on our repair shop hill: at 5, 30, 60 and 90 percent
  const startPins = STARTS.map((r, c) => {
    const px = hx(r), py = HY0 + 0.65;
    const stem = new M.Line({ start: [px, HY0, 0], end: [px, py, 0], color: COLS[c], strokeWidth: 2 });
    const lbl = T(`${r}%`, P ? 17 : 19, COLS[c], true, true);
    lbl.moveTo([px, py + 0.38, 0]);
    return new M.VGroup(stem, lbl);
  });
  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(gBox, gLab), { runTime: 0.5 }),
    ...walkers.flatMap((w, c) => {
      const px = hx(STARTS[c]), py = HY0 + 0.65;
      const tHalo = new M.Dot({ point: [px, py, 0], radius: 0.30, color: COLS[c] }); tHalo.setFill(COLS[c], 0.22);
      const tCore = new M.Dot({ point: [px, py, 0], radius: 0.13, color: COLS[c] }); tCore.setFill(COLS[c], 1);
      return [
        new M.Transform(w.halo, tHalo, { runTime: 1.1 }),
        new M.Transform(w.core, tCore, { runTime: 1.1 }),
      ];
    }),
    new M.LaggedStart(startPins.map(p => new M.FadeIn(p, { runTime: 0.45 })), { lagRatio: 0.18, runTime: 1.5 }),
    ...say('4 STARTS: 5%, 30%, 60%, 90%')
  );

  // =========================================================================
  // ACT 2: TRACE PLOT & GOOD RUN (Beats 7-13)
  // =========================================================================

  // Beat 7: Step number along bottom, rate up the side
  const xAxis = new M.Line({ start: [X0, Y0, 0], end: [X1, Y0, 0], color: C.muted, strokeWidth: 2.5 });
  const yAxis = new M.Line({ start: [X0, Y0, 0], end: [X0, Y1, 0], color: C.muted, strokeWidth: 2.5 });
  const hGrid = [25, 50, 75, 100].map(v => {
    const l = new M.Line({ start: [X0, ty(v), 0], end: [X1, ty(v), 0], color: C.grid, strokeWidth: 1 });
    l.setStrokeOpacity(0.45);
    return l;
  });
  const yTicks = [0, 25, 50, 75, 100].map(v => new M.VGroup(
    new M.Line({ start: [X0 - 0.08, ty(v), 0], end: [X0, ty(v), 0], color: C.muted, strokeWidth: 2 }),
    T(`${v}%`, P ? 16 : 15, C.muted, true).moveTo([X0 - (P ? 0.52 : 0.55), ty(v), 0])
  ));
  const makeXTicks = maxStep => [0, 0.25, 0.5, 0.75, 1].map(u => new M.VGroup(
    new M.Line({ start: [tx(u), Y0 - 0.08, 0], end: [tx(u), Y0, 0], color: C.muted, strokeWidth: 2 }),
    T(String(Math.round(u * maxStep)), P ? 15 : 15, C.muted, true).moveTo([tx(u), Y0 - 0.30, 0])
  ));
  let xTickGroup = new M.VGroup(...makeXTicks(2000));
  const xLab = T('step number', P ? 15 : 16, C.muted); xLab.moveTo([CX, Y0 - 0.64, 0]);
  const yLab = T('rate', P ? 15 : 16, C.muted); yLab.moveTo([X0 - (P ? 0.45 : 0.50), Y1 + 0.28, 0]);
  const startDots = STARTS.map((r, c) => {
    const d = new M.Dot({ point: [X0, ty(r), 0], radius: 0.11, color: COLS[c] }); d.setFill(COLS[c], 1);
    return d;
  });

  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(hAxis, ...hTicks, hAxisLab, refHill, ...startPins, ...walkers.flatMap(w => [w.halo, w.core])), { runTime: 0.6 })
  );
  await play(
    new M.Create(xAxis, { runTime: 0.8 }),
    new M.Create(yAxis, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...hGrid, ...yTicks, xTickGroup, xLab, yLab), { runTime: 0.9 }),
    new M.LaggedStart(startDots.map(d => new M.FadeIn(d, { runTime: 0.35 })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('BOTTOM = STEP   ·   SIDE = RATE')
  );

  // Beat 8: Trace plot traces where the walker stood at each step
  const demoPts = [[0.0, 30], [0.06, 38], [0.12, 26], [0.18, 34], [0.24, 21], [0.30, 29]];
  const demoSegs = [];
  const demoDots = [];
  for (let i = 0; i < demoPts.length; i++) {
    const [u, r] = demoPts[i];
    const d = new M.Dot({ point: [tx(u), ty(r), 0], radius: 0.085, color: C.green }); d.setFill(C.green, 1);
    demoDots.push(d);
    if (i > 0) {
      const [pu, pr] = demoPts[i - 1];
      demoSegs.push(new M.Line({ start: [tx(pu), ty(pr), 0], end: [tx(u), ty(r), 0], color: C.green, strokeWidth: 3 }));
    }
  }
  await until(S(8));
  await play(
    new M.LaggedStart(demoSegs.map(l => new M.Create(l, { runTime: 0.35 })), { lagRatio: 0.35, runTime: 1.5 }),
    new M.LaggedStart(demoDots.map(d => new M.FadeIn(d, { runTime: 0.25 })), { lagRatio: 0.30, runTime: 1.5 }),
    ...say('TRACE PLOT = WALKER’S PATH OVER STEPS', C.violet)
  );

  // Beat 9: Good run — step moves rate by ~10% (e.g. 20 to 30%), 2,000 steps each
  const stepDemo = spanBar(tx(0.18), ty(20), ty(30), C.amber, '±10% step', 1);
  const dot20 = new M.Dot({ point: [tx(0.18), ty(20), 0], radius: 0.08, color: C.amber }); dot20.setFill(C.amber, 1);
  const dot30 = new M.Dot({ point: [tx(0.18), ty(30), 0], radius: 0.08, color: C.amber }); dot30.setFill(C.amber, 1);
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...demoSegs, ...demoDots), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(stepDemo, dot20, dot30), { runTime: 0.8 }),
    ...fbox([['GOOD RUN', C.green], 'step size ≈ 10%', 'steps     = 2,000', 'chains    = 4'], C.green),
    ...say('GOOD RUN: STEP ≈ 10%, 2,000 STEPS', C.green)
  );

  // Beat 10: Look at the traces — 90% drops quickly, 5% climbs quickly
  const goodWarmSegs = makeTraceSegs(GOOD_TRACES, X0, X1, Y0, Y1, 0, WARM_IDX, 2.3, 0.95);
  const goodRestSegs = makeTraceSegs(GOOD_TRACES, X0, X1, Y0, Y1, WARM_IDX, N_GOOD - 1, 1.9, 0.88);
  const dropTag = T('90% ↓', P ? 15 : 17, C.pink, true, true);
  dropTag.moveTo([tx(0.12), ty(82), 0]);
  const climbTag = T('5% ↑', P ? 15 : 17, C.cyan, true, true);
  climbTag.moveTo([tx(0.13), ty(10), 0]);
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(stepDemo, dot20, dot30), { runTime: 0.4 }),
    ...goodWarmSegs.map(segs => new M.LaggedStart(segs.map(l => new M.Create(l, { runTime: 0.3 })), { lagRatio: 0.25, runTime: 2.0 })),
    new M.FadeIn(dropTag, { runTime: 0.7 }),
    new M.FadeIn(climbTag, { runTime: 0.7 }),
    ...say('90% DROPS FAST  ·  5% CLIMBS FAST', C.amber)
  );

  // Beat 11: All four colours wiggle up and down over the same band, roughly 5 to 60%
  const bandLow = new M.DashedLine({ start: [tx(0.12), ty(5), 0], end: [X1, ty(5), 0], color: C.green });
  const bandHigh = new M.DashedLine({ start: [tx(0.12), ty(60), 0], end: [X1, ty(60), 0], color: C.green });
  const bandTag = T('5% – 60% band', P ? 16 : 16, C.green, true, true);
  bandTag.moveTo([tx(0.75), ty(67), 0]);
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(dropTag, climbTag), { runTime: 0.4 }),
    ...goodRestSegs.map(segs => new M.LaggedStart(segs.map(l => new M.Create(l, { runTime: 0.14 })), { lagRatio: 0.08, runTime: 3.1 })),
    new M.Create(bandLow, { runTime: 0.9 }),
    new M.Create(bandHigh, { runTime: 0.9 }),
    new M.FadeIn(bandTag, { runTime: 0.8 }),
    ...say('ALL 4 WIGGLE IN SAME BAND (5–60%)', C.green)
  );

  // Beat 12: One fuzzy caterpillar — good mixing
  const catBox = new M.RoundedRectangle({ width: X1 - tx(0.12) + 0.1, height: ty(62) - ty(4), cornerRadius: 0.16, color: C.green, strokeWidth: 2.5 });
  catBox.setFill(C.green, 0.06);
  catBox.moveTo([(tx(0.12) + X1) / 2, (ty(4) + ty(62)) / 2, 0]);
  const catTag = pill('FUZZY CATERPILLAR', C.green, P ? 16 : 16);
  catTag.moveTo([tx(0.56), ty(74), 0]);
  await until(S(12));
  await play(
    new M.FadeOut(bandTag, { runTime: 0.4 }),
    new M.Create(catBox, { runTime: 1.0 }),
    new M.FadeIn(catTag, { runTime: 0.8 }),
    ...say('GOOD MIXING = ONE FUZZY CATERPILLAR', C.green)
  );

  // Beat 13: Four chain means are 24, 25, 26 and 25 percent. They agree.
  const goodMeanLines = GOOD_MEANS.map((m, c) =>
    new M.DashedLine({ start: [tx(0.12), ty(m), 0], end: [X1, ty(m), 0], color: COLS[c] })
  );
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(catBox, catTag, bandLow, bandHigh), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...goodMeanLines), { runTime: 0.8 }),
    ...fbox([
      ['GOOD RUN MEANS', C.green],
      ['start  5% → 24%', C.cyan],
      ['start 30% → 25%', C.green],
      ['start 60% → 26%', C.amber],
      ['start 90% → 25%', C.pink],
    ], C.green),
    ...say('MEANS: 24, 25, 26, 25% — THEY AGREE', C.green)
  );

  // =========================================================================
  // ACT 3: THE BAD RUN (Beats 14-18)
  // =========================================================================

  // Beat 14: Bad run — tiny steps ~0.5%, only 200 steps each
  const allGoodSegs = [...goodWarmSegs.flat(), ...goodRestSegs.flat()];
  const xTick200 = new M.VGroup(...makeXTicks(200));
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...allGoodSegs, ...goodMeanLines, xTickGroup), { runTime: 0.6 }),
    new M.FadeIn(xTick200, { runTime: 0.7 }),
    ...fbox([['BAD RUN', C.pink], 'step size ≈ 0.5%', 'steps     = 200', 'chains    = 4'], C.pink),
    ...say('BAD RUN: TINY 0.5% STEPS, ONLY 200', C.pink)
  );
  xTickGroup = xTick200;

  // Beat 15: Each chain crawls slowly, like a snail
  const badSegs = makeTraceSegs(BAD_TRACES, X0, X1, Y0, Y1, 0, N_BAD - 1, 2.5, 0.95);
  await until(S(15));
  await play(
    ...badSegs.map(segs => new M.LaggedStart(segs.map(l => new M.Create(l, { runTime: 0.16 })), { lagRatio: 0.09, runTime: 2.5 })),
    ...say('EACH CHAIN CRAWLS LIKE A SNAIL', C.pink)
  );

  // Beat 16: Chain from 90 is still near 80; chain from 5 is still near 5
  const end90 = BAD_TRACES[3][N_BAD - 1], end5 = BAD_TRACES[0][N_BAD - 1];
  const dotEnd90 = new M.Dot({ point: [X1, ty(end90), 0], radius: 0.11, color: C.pink }); dotEnd90.setFill(C.pink, 1);
  const dotEnd5 = new M.Dot({ point: [X1, ty(end5), 0], radius: 0.11, color: C.cyan }); dotEnd5.setFill(C.cyan, 1);
  const labEnd90 = T('~80%', P ? 15 : 17, C.pink, true, true); labEnd90.moveTo([X1 - 0.55, ty(end90) + 0.34, 0]);
  const labEnd5 = T('~5%', P ? 15 : 17, C.cyan, true, true); labEnd5.moveTo([X1 - 0.52, ty(end5) + 0.34, 0]);
  await until(S(16));
  await play(
    new M.FadeIn(new M.VGroup(dotEnd90, dotEnd5, labEnd90, labEnd5), { runTime: 0.6 }),
    new M.Flash(dotEnd90, { color: C.pink, runTime: 0.8 }),
    new M.Flash(dotEnd5, { color: C.cyan, runTime: 0.8 }),
    ...say('90% STILL NEAR 80%  ·  5% NEAR 5%', C.pink)
  );

  // Beat 17: Four lines never meet. Means are 5, 16, 56 and 83 percent.
  const badMeanLines = BAD_MEANS.map((m, c) =>
    new M.DashedLine({ start: [X0, ty(m), 0], end: [X1, ty(m), 0], color: COLS[c] })
  );
  await until(S(17));
  await play(
    new M.FadeIn(new M.VGroup(...badMeanLines), { runTime: 0.8 }),
    ...fbox([
      ['BAD RUN MEANS', C.pink],
      ['start  5% →  5%', C.cyan],
      ['start 30% → 16%', C.green],
      ['start 60% → 56%', C.amber],
      ['start 90% → 83%', C.pink],
    ], C.pink),
    ...say('MEANS: 5, 16, 56, 83% — NEVER MEET', C.pink)
  );

  // Beat 18: Each chain describes a different hill. None of them is right. (3.58s)
  const miniHills = BAD_MEANS.map((m, c) => {
    const segs = [];
    for (let k = -6; k < 6; k++) {
      const r1 = m + k * 0.9, r2 = m + (k + 1) * 0.9;
      const w1 = 0.45 * Math.exp(-Math.pow(k / 3, 2));
      const w2 = 0.45 * Math.exp(-Math.pow((k + 1) / 3, 2));
      segs.push(new M.Line({ start: [X1 - w1, ty(r1), 0], end: [X1 - w2, ty(r2), 0], color: COLS[c], strokeWidth: 3 }));
    }
    return new M.VGroup(...segs);
  });
  await until(S(18));
  await play(
    new M.LaggedStart(miniHills.map(g => new M.FadeIn(g, { runTime: 0.35 })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('4 DIFFERENT HILLS — NONE IS RIGHT', C.pink)
  );

  // =========================================================================
  // ACT 4: WITHIN vs BETWEEN SPREAD & R-HAT (Beats 19-30)
  // =========================================================================

  // Beat 19: Compare two kinds of spread (twin Good vs Bad panels)
  const GAP = P ? 0.48 : 0.65;
  const PW = (CW - GAP) / 2;
  const GX0 = X0, GX1 = X0 + PW;
  const BX0 = GX1 + GAP, BX1 = X1;
  const PY0 = Y0 + 0.15, PY1 = Y1 - 0.15;
  const py = r => PY0 + (r / 100) * (PY1 - PY0);

  const gFrame = new M.RoundedRectangle({ width: PW, height: PY1 - PY0, cornerRadius: 0.12, color: C.line, strokeWidth: 2 });
  gFrame.setFill(C.card, 0.45); gFrame.moveTo([(GX0 + GX1) / 2, (PY0 + PY1) / 2, 0]);
  const bFrame = new M.RoundedRectangle({ width: PW, height: PY1 - PY0, cornerRadius: 0.12, color: C.line, strokeWidth: 2 });
  bFrame.setFill(C.card, 0.45); bFrame.moveTo([(BX0 + BX1) / 2, (PY0 + PY1) / 2, 0]);
  const gTitle = T('GOOD RUN', P ? 16 : 16, C.green, true, true); gTitle.moveTo([(GX0 + GX1) / 2, PY1 + 0.24, 0]);
  const bTitle = T('BAD RUN', P ? 16 : 16, C.pink, true, true); bTitle.moveTo([(BX0 + BX1) / 2, PY1 + 0.24, 0]);

  const miniGoodSegs = makeTraceSegs(GOOD_TRACES, GX0 + 0.08, GX1 - 0.35, PY0, PY1, 0, N_GOOD - 1, 1.5, 0.85).flat();
  const miniBadSegs = makeTraceSegs(BAD_TRACES, BX0 + 0.08, BX1 - 0.35, PY0, PY1, 0, N_BAD - 1, 1.8, 0.9).flat();
  const twinBase = new M.VGroup(gFrame, bFrame, gTitle, bTitle, ...miniGoodSegs, ...miniBadSegs);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(xAxis, yAxis, ...hGrid, ...yTicks, xTickGroup, xLab, yLab, ...startDots,
      ...badSegs.flat(), dotEnd90, dotEnd5, labEnd90, labEnd5, ...badMeanLines, ...miniHills), { runTime: 0.55 })
  );
  await play(
    new M.FadeIn(twinBase, { runTime: 0.9 }),
    ...fbox([['TWO KINDS OF SPREAD', C.cyan], '1. within each chain', '2. between chains'], C.cyan),
    ...say('ONE NUMBER: COMPARE TWO SPREADS')
  );

  // Beat 20: Spread within each chain: how much one walker moves around
  const withinGood = spanBar(GX0 + 0.55, py(6), py(58), C.cyan, 'within', 1);
  const withinBad = spanBar(BX0 + 0.55, py(78), py(90), C.cyan, 'within', 1);
  await until(S(20));
  await play(
    new M.FadeIn(withinGood, { runTime: 0.8 }),
    new M.FadeIn(withinBad, { runTime: 0.8 }),
    ...fbox([['WITHIN SPREAD', C.cyan], 'how much ONE walker', 'moves up and down'], C.cyan),
    ...say('WITHIN = HOW MUCH ONE WALKER MOVES', C.cyan)
  );

  // Beat 21: Spread between chains: how far apart the walkers' averages are
  const gMeanDots = GOOD_MEANS.map((m, c) => {
    const d = new M.Dot({ point: [GX1 - 0.18, py(m), 0], radius: 0.065, color: COLS[c] }); d.setFill(COLS[c], 1);
    return d;
  });
  const bMeanDots = BAD_MEANS.map((m, c) => {
    const d = new M.Dot({ point: [BX1 - 0.18, py(m), 0], radius: 0.065, color: COLS[c] }); d.setFill(COLS[c], 1);
    return d;
  });
  const betweenGood = spanBar(GX1 - 0.18, py(22), py(28), C.amber, 'between', -1);
  const betweenBad = spanBar(BX1 - 0.18, py(5), py(83), C.amber, 'between', -1);
  await until(S(21));
  await play(
    new M.FadeIn(new M.VGroup(...gMeanDots, ...bMeanDots), { runTime: 0.6 }),
    new M.FadeIn(betweenGood, { runTime: 0.8 }),
    new M.FadeIn(betweenBad, { runTime: 0.8 }),
    ...fbox([['BETWEEN SPREAD', C.amber], 'how far apart the', 'walkers’ averages are'], C.amber),
    ...say('BETWEEN = GAP AMONG CHAIN AVERAGES', C.amber)
  );

  // Beat 22: If all chains explore the same hill, between spread is small compared with within spread
  const goodGlow = new M.RoundedRectangle({ width: PW + 0.14, height: PY1 - PY0 + 0.14, cornerRadius: 0.15, color: C.green, strokeWidth: 3 });
  goodGlow.moveTo([(GX0 + GX1) / 2, (PY0 + PY1) / 2, 0]);
  await until(S(22));
  await play(
    new M.Create(goodGlow, { runTime: 0.9 }),
    new M.Indicate(withinGood, { color: C.cyan, runTime: 0.9 }),
    ...fbox([['SAME HILL', C.green], ['between  ≪  within', C.amber], 'means nearly equal'], C.green),
    ...say('SAME HILL: BETWEEN ≪ WITHIN', C.green)
  );

  // Beat 23: Called R-hat: a letter R with a small hat on top
  const rCenter = [CX, (PY0 + PY1) / 2, 0];
  const rCard = new M.RoundedRectangle({ width: 1.75, height: 1.85, cornerRadius: 0.22, color: C.violet, strokeWidth: 2.5 });
  rCard.setFill(C.bg, 0.95); rCard.moveTo(rCenter);
  const bigR = T('R', 62, C.violet, false, true); bigR.moveTo([rCenter[0], rCenter[1] - 0.16, 0]);
  const hatL = new M.Line({ start: [rCenter[0] - 0.26, rCenter[1] + 0.44, 0], end: [rCenter[0], rCenter[1] + 0.68, 0], color: C.amber, strokeWidth: 4 });
  const hatR = new M.Line({ start: [rCenter[0], rCenter[1] + 0.68, 0], end: [rCenter[0] + 0.26, rCenter[1] + 0.44, 0], color: C.amber, strokeWidth: 4 });
  const rHatBadge = new M.VGroup(rCard, bigR, hatL, hatR);
  await until(S(23));
  await play(
    new M.FadeOut(goodGlow, { runTime: 0.4 }),
    new M.FadeIn(rHatBadge, { runTime: 0.8 }),
    ...fbox([['R-hat', C.violet], 'compares between', 'vs within spread'], C.violet),
    ...say('R-HAT: LETTER R WITH A HAT', C.violet)
  );

  // Beat 24: R-hat is 1 when chains agree, grows bigger than 1 when they disagree
  await until(S(24));
  await play(
    new M.FadeOut(rHatBadge, { runTime: 0.5 }),
    ...fbox([['R-hat SCALE', C.violet], ['= 1.00 → agree', C.green], ['> 1.01 → disagree', C.pink]], C.violet),
    ...say('R-HAT = 1 AGREE  ·  > 1 DISAGREE', C.violet)
  );

  // Beat 25: Good run R-hat = 1.00 after dropping first short stretch
  const warmW = (GX1 - 0.35 - (GX0 + 0.08)) * (WARM_IDX / (N_GOOD - 1));
  const warmShade = new M.Rectangle({ width: warmW, height: PY1 - PY0 - 0.04, color: C.amber, strokeWidth: 1.5 });
  warmShade.setFill(C.amber, 0.18);
  warmShade.moveTo([GX0 + 0.08 + warmW / 2, (PY0 + PY1) / 2, 0]);
  const gRhatPill = pill('R-hat = 1.00', C.green, P ? 16 : 16);
  gRhatPill.moveTo([(GX0 + GX1) / 2, PY0 - 0.38, 0]);
  await until(S(25));
  await play(
    new M.FadeIn(warmShade, { runTime: 0.7 }),
    new M.FadeIn(gRhatPill, { runTime: 0.7 }),
    ...fbox([['GOOD RUN', C.green], 'drop warm-up stretch', ['R-hat = 1.00  ✓', C.green]], C.green),
    ...say('GOOD RUN: R-HAT = 1.00', C.green)
  );

  // Beat 26: Bad run R-hat ≈ 7 (short beat: 3.16s)
  const bRhatPill = pill('R-hat ≈ 7', C.pink, P ? 16 : 16);
  bRhatPill.moveTo([(BX0 + BX1) / 2, PY0 - 0.38, 0]);
  await until(S(26));
  await play(
    new M.FadeIn(bRhatPill, { runTime: 0.6 }),
    ...fbox([['BAD RUN', C.pink], 'chains never meet', ['R-hat ≈ 7.0   ✗', C.pink]], C.pink),
    ...say('BAD RUN: R-HAT ≈ 7', C.pink)
  );

  // Beat 27: Rule of thumb: trust chains only when R-hat < 1.01
  const GY = (Y0 + Y1) / 2 - 0.1;
  const gLineL = X0 + 0.35, gLineR = X1 - 0.35, gW = gLineR - gLineL;
  const gX = u => gLineL + u * gW;
  const okZone = new M.Rectangle({ width: gW * 0.24, height: 0.42, color: C.green, strokeWidth: 0 });
  okZone.setFill(C.green, 0.26); okZone.moveTo([gX(0.12), GY, 0]);
  const badZone = new M.Rectangle({ width: gW * 0.76, height: 0.42, color: C.pink, strokeWidth: 0 });
  badZone.setFill(C.pink, 0.16); badZone.moveTo([gX(0.62), GY, 0]);
  const gaugeAxis = new M.Line({ start: [gLineL, GY, 0], end: [gLineR, GY, 0], color: C.muted, strokeWidth: 3 });
  const cutLine = new M.DashedLine({ start: [gX(0.24), GY - 0.72, 0], end: [gX(0.24), GY + 0.85, 0], color: C.amber });
  const cutLab = T('1.01', P ? 17 : 19, C.amber, true, true); cutLab.moveTo([gX(0.24), GY + 1.08, 0]);
  const gTicks = [[0, '1.00'], [0.48, '1.05'], [0.72, '1.10'], [0.96, '≈ 7']].map(([u, s]) => new M.VGroup(
    new M.Line({ start: [gX(u), GY - 0.12, 0], end: [gX(u), GY + 0.12, 0], color: C.muted, strokeWidth: 2 }),
    T(s, P ? 16 : 16, C.muted, true).moveTo([gX(u), GY - 0.42, 0])
  ));
  const goodDot = new M.Dot({ point: [gX(0.02), GY, 0], radius: 0.14, color: C.green }); goodDot.setFill(C.green, 1);
  const badDot = new M.Dot({ point: [gX(0.96), GY, 0], radius: 0.14, color: C.pink }); badDot.setFill(C.pink, 1);
  const okTxt = T('TRUST ✓', P ? 16 : 16, C.green, true, true); okTxt.moveTo([gX(0.11), GY - 0.88, 0]);
  const noTxt = T('DO NOT TRUST ✗', P ? 16 : 16, C.pink, true, true); noTxt.moveTo([gX(0.64), GY - 0.88, 0]);

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(twinBase, withinGood, withinBad, ...gMeanDots, ...bMeanDots,
      betweenGood, betweenBad, warmShade, gRhatPill, bRhatPill), { runTime: 0.55 })
  );
  await play(
    new M.FadeIn(new M.VGroup(okZone, badZone, ...gTicks, cutLab, okTxt, noTxt), { runTime: 0.8 }),
    new M.Create(gaugeAxis, { runTime: 0.7 }),
    new M.Create(cutLine, { runTime: 0.7 }),
    new M.FadeIn(goodDot, { runTime: 0.6 }),
    new M.FadeIn(badDot, { runTime: 0.6 }),
    ...fbox([['RULE OF THUMB', C.amber], ['R-hat < 1.01  → trust', C.green], ['R-hat ≥ 1.01  → warn', C.pink]], C.amber),
    ...say('RULE OF THUMB: R-HAT < 1.01', C.amber)
  );

  // Beat 28: Here is the short version, in words (short beat: 2.88s)
  await until(S(28));
  await play(
    ...fbox([['IN WORDS', C.cyan], 'how R-hat works'], C.cyan),
    ...say('THE SHORT VERSION')
  );

  // Beat 29: R-hat compares between vs within spread. Close to 1 means agreement.
  await until(S(29));
  await play(
    new M.Flash(goodDot, { color: C.green, runTime: 0.9 }),
    ...fbox([
      ['R-hat compares:', C.cyan],
      ['  between spread', C.amber],
      ['  vs within spread', C.cyan],
      ['near 1 → agree', C.green],
    ], C.green),
    ...say('BETWEEN vs WITHIN → NEAR 1 = AGREE', C.green)
  );

  // Beat 30: Everyday words: walkers starting far apart tell the same story
  const sCenter = [CX, (Y0 + Y1) / 2, 0];
  const storyCircle = new M.Circle({ radius: P ? 0.95 : 0.88, color: C.green, strokeWidth: 2.5 });
  storyCircle.setFill(C.green, 0.14); storyCircle.moveTo(sCenter);
  const storyTxt = T('SAME STORY', P ? 16 : 18, C.green, true, true); storyTxt.moveTo(sCenter);
  const corners = [
    [CX - (P ? 2.4 : 2.9), Y1 - 0.35],
    [CX - (P ? 2.4 : 2.9), Y0 + 0.35],
    [CX + (P ? 2.4 : 2.9), Y1 - 0.35],
    [CX + (P ? 2.4 : 2.9), Y0 + 0.35],
  ];
  const storyRays = corners.map(([x, y], c) => {
    const dx = sCenter[0] - x, dy = sCenter[1] - y, d = Math.hypot(dx, dy);
    const stop = (d - (P ? 1.02 : 0.96)) / d;
    const dot = new M.Dot({ point: [x, y, 0], radius: 0.13, color: COLS[c] }); dot.setFill(COLS[c], 1);
    const lbl = T(`${STARTS[c]}%`, P ? 16 : 16, COLS[c], true, true);
    lbl.moveTo([x, y + (y > sCenter[1] ? 0.34 : -0.34), 0]);
    const ln = new M.Line({ start: [x, y, 0], end: [x + dx * stop, y + dy * stop, 0], color: COLS[c], strokeWidth: 2.5 });
    return new M.VGroup(ln, dot, lbl);
  });

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(okZone, badZone, gaugeAxis, cutLine, cutLab, ...gTicks, goodDot, badDot, okTxt, noTxt), { runTime: 0.55 })
  );
  await play(
    new M.Create(storyCircle, { runTime: 0.8 }),
    new M.FadeIn(storyTxt, { runTime: 0.8 }),
    new M.LaggedStart(storyRays.map(r => new M.FadeIn(r, { runTime: 0.45 })), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox([['EVERYDAY WORDS', C.green], 'far-apart starts', '→ tell same story', '→ believe the story'], C.green),
    ...say('FAR-APART STARTS → SAME STORY', C.green)
  );

  // =========================================================================
  // ACT 5: FIXES, WARM-UP, PURPOSE, TRAP & RECAP (Beats 31-37)
  // =========================================================================

  function makeCard(x, y, w, h, text, color) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo([x, y, 0]);
    const t = T(text, P ? 18 : 20, color, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }

  // Beat 31: If the check fails: run longer, change step size, or rethink the model
  const cardW = P ? 5.6 : 6.4, cardH = P ? 0.86 : 0.78, midY = (Y0 + Y1) / 2;
  const fixCards = [
    makeCard(CX, midY + (P ? 1.15 : 1.02), cardW, cardH, '1.  Run longer chains', C.cyan),
    makeCard(CX, midY, cardW, cardH, '2.  Change the step size', C.amber),
    makeCard(CX, midY - (P ? 1.15 : 1.02), cardW, cardH, '3.  Rethink the model', C.violet),
  ];
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(storyCircle, storyTxt, ...storyRays), { runTime: 0.55 })
  );
  await play(
    new M.LaggedStart(fixCards.map(c => new M.FadeIn(c, { runTime: 0.55 })), { lagRatio: 0.25, runTime: 1.4 }),
    ...fbox([['IF CHECK FAILS', C.pink], '• more steps', '• better step size', '• rethink model'], C.amber),
    ...say('IF CHECK FAILS: 3 FIXES', C.amber)
  );

  // Beat 32: Throw away the first stretch (warm-up)
  const wBox = new M.RoundedRectangle({ width: CW, height: CH * 0.86, cornerRadius: 0.14, color: C.line, strokeWidth: 2 });
  wBox.setFill(C.card, 0.45); wBox.moveTo([CX, midY, 0]);
  const WY0 = midY - CH * 0.43, WY1 = midY + CH * 0.43;
  const wSegs = makeTraceSegs(GOOD_TRACES, X0 + 0.1, X1 - 0.1, WY0 + 0.1, WY1 - 0.1, 0, N_GOOD - 1, 1.7, 0.88).flat();
  const splitX = X0 + 0.1 + (CW - 0.2) * (WARM_IDX / (N_GOOD - 1));
  const dropRect = new M.Rectangle({ width: splitX - (X0 + 0.1), height: CH * 0.84, color: C.pink, strokeWidth: 2 });
  dropRect.setFill(C.pink, 0.22); dropRect.moveTo([(X0 + 0.1 + splitX) / 2, midY, 0]);
  const splitLine = new M.DashedLine({ start: [splitX, WY0, 0], end: [splitX, WY1, 0], color: C.amber });
  const dropLbl = T('WARM-UP (DROP)', P ? 16 : 15, C.pink, true, true);
  dropLbl.moveTo([(X0 + splitX) / 2 + 0.35, WY1 + 0.28, 0]);
  const keepLbl = T('KEEP FOR RESULTS →', P ? 16 : 15, C.green, true, true);
  keepLbl.moveTo([(splitX + X1) / 2, WY1 + 0.28, 0]);
  const warmGroup = new M.VGroup(wBox, ...wSegs, dropRect, splitLine, dropLbl, keepLbl);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(...fixCards), { runTime: 0.5 })
  );
  await play(
    new M.FadeIn(warmGroup, { runTime: 1.0 }),
    ...fbox([['WARM-UP', C.amber], 'drop first stretch', 'while chains travel', 'from their starts'], C.amber),
    ...say('WARM-UP = DROP THE FIRST STRETCH', C.amber)
  );

  // Beat 33: What is it for? Check whether MCMC draws can be trusted before reporting
  const pipeCards = P ? [
    makeCard(CX, midY + 1.25, 5.2, 0.82, 'MCMC draws', C.cyan),
    makeCard(CX, midY, 5.2, 0.92, 'CHECK: traces + R-hat', C.green),
    makeCard(CX, midY - 1.25, 5.2, 0.82, 'Report numbers', C.amber),
  ] : [
    makeCard(X0 + 1.2, midY, 2.2, 0.95, 'MCMC draws', C.cyan),
    makeCard(CX, midY, 2.7, 1.05, 'Traces + R-hat', C.green),
    makeCard(X1 - 1.2, midY, 2.2, 0.95, 'Report', C.amber),
  ];
  const pipeLinks = P ? [
    new M.Line({ start: [CX, midY + 0.84, 0], end: [CX, midY + 0.46, 0], color: C.muted, strokeWidth: 3 }),
    new M.Line({ start: [CX, midY - 0.46, 0], end: [CX, midY - 0.84, 0], color: C.muted, strokeWidth: 3 }),
  ] : [
    new M.Line({ start: [X0 + 2.3, midY, 0], end: [CX - 1.35, midY, 0], color: C.muted, strokeWidth: 3 }),
    new M.Line({ start: [CX + 1.35, midY, 0], end: [X1 - 2.3, midY, 0], color: C.muted, strokeWidth: 3 }),
  ];

  await until(S(33));
  await play(new M.FadeOut(warmGroup, { runTime: 0.5 }));
  await play(
    new M.LaggedStart([
      new M.FadeIn(pipeCards[0], { runTime: 0.45 }),
      new M.Create(pipeLinks[0], { runTime: 0.3 }),
      new M.FadeIn(pipeCards[1], { runTime: 0.5 }),
      new M.Create(pipeLinks[1], { runTime: 0.3 }),
      new M.FadeIn(pipeCards[2], { runTime: 0.45 }),
    ], { lagRatio: 0.25, runTime: 1.6 }),
    ...fbox([['WHAT IS IT FOR?', C.green], 'check draws FIRST', 'before reporting', 'any number'], C.green),
    ...say('CHECK BEFORE REPORTING NUMBERS', C.green)
  );

  // Beat 34: Common trap — passing checks does not prove chains are right
  const txB = p => X0 + (p / 100) * CW;
  const tyB = v => Y0 + 0.25 + v * (CH - 0.65);
  const trapAxis = new M.Line({ start: [X0, tyB(0), 0], end: [X1, tyB(0), 0], color: C.muted, strokeWidth: 2.5 });
  const trapTicks = [0, 25, 50, 75, 100].map(v =>
    T(`${v}%`, P ? 15 : 15, C.muted, true).moveTo([txB(v), tyB(0) - 0.30, 0])
  );
  const { segs: biSegs, bars: biBars } = buildHill(txB, tyB, bimodalH, C.cyan, 56, true);
  const biGroup = new M.VGroup(trapAxis, ...trapTicks, ...biBars, ...biSegs);

  const trapDots = [19, 23, 27, 31].map((r, c) => {
    const d = new M.Dot({ point: [txB(r), tyB(betaH(r) * 0.85), 0], radius: P ? 0.14 : 0.11, color: COLS[c] }); d.setFill(COLS[c], 1);
    return d;
  });
  const okTrap = pill('4 chains agree: R-hat = 1.00', C.green, P ? 15 : 15);
  okTrap.moveTo([Math.max(X0 + 2.0, txB(25)), tyB(1.08), 0]);

  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(...pipeCards, ...pipeLinks), { runTime: 0.5 }));
  await play(
    new M.FadeIn(biGroup, { runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...trapDots, okTrap), { runTime: 0.7 }),
    ...fbox([['COMMON TRAP', C.pink], 'passing ≠ proof', 'chains can still', 'miss part of hill'], C.pink),
    ...say('TRAP: PASSING CHECKS ≠ PROOF', C.pink)
  );

  // Beat 35: Every walker misses the same hidden part — agree and still wrong
  const missCircle = new M.Circle({ radius: P ? 0.65 : 0.72, color: C.pink, strokeWidth: 3 });
  missCircle.setFill(C.pink, 0.14); missCircle.moveTo([txB(78), tyB(0.45), 0]);
  const missLab = T('HIDDEN PEAK!', P ? 16 : 16, C.pink, true, true);
  missLab.moveTo([txB(78), tyB(0.95), 0]);

  await until(S(35));
  await play(
    new M.LaggedStart(trapDots.map(d => new M.Flash(d, { color: C.amber })), { lagRatio: 0.15, runTime: 1.0 }),
    new M.Create(missCircle, { runTime: 0.8 }),
    new M.FadeIn(missLab, { runTime: 0.7 }),
    ...fbox([['ALL 4 ON LEFT PEAK', C.amber], ['R-hat = 1.00 (agree)', C.green], ['right peak missed ✗', C.pink]], C.pink),
    ...say('ALL AGREE — AND ALL STILL WRONG', C.pink)
  );

  // Beat 36: Start far apart, look at trace plots, use R-hat as a warning light
  const habitCards = [
    makeCard(CX, midY + (P ? 1.15 : 1.02), cardW, cardH, '1.  Start chains far apart', C.cyan),
    makeCard(CX, midY, cardW, cardH, '2.  Look at trace plots', C.green),
    makeCard(CX, midY - (P ? 1.15 : 1.02), cardW, cardH, '3.  R-hat = warning light', C.amber),
  ];
  await until(S(36));
  await play(new M.FadeOut(new M.VGroup(biGroup, ...trapDots, okTrap, missCircle, missLab), { runTime: 0.5 }));
  await play(
    new M.LaggedStart(habitCards.map(c => new M.FadeIn(c, { runTime: 0.5 })), { lagRatio: 0.25, runTime: 1.5 }),
    ...fbox([['GOOD HABITS', C.cyan], '• far-apart starts', '• inspect traces', '• R-hat = warning'], C.amber),
    ...say('R-HAT = WARNING LIGHT, NOT GUARANTEE', C.amber)
  );

  // Beat 37: One-sentence recap
  await until(S(37));
  await play(
    new M.LaggedStart(habitCards.map((c, i) => new M.Indicate(c, { color: [C.cyan, C.green, C.amber][i], runTime: 0.7 })), { lagRatio: 0.25, runTime: 1.8 }),
    ...fbox([['IN ONE SENTENCE', C.green], ['• far-apart starts', C.cyan], ['• traces mix well', C.green], ['• R-hat < 1.01', C.amber]], C.green),
    ...say('MIXED TRACES + R-HAT ≈ 1 → TRUST', C.green)
  );
}

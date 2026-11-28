// 6.3.7 Markov chain Monte Carlo (live Manim-web lesson).
// Beat i = sentence i (0-based, 0..42). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  // --- layout constants (phone: 8 x 14.22, laptop: 14.22 x 8) ----------------
  const X0 = P ? -3.2 : -6.1, X1 = P ? 3.2 : 1.5, CX = (X0 + X1) / 2;
  const BASE = P ? -5.2 : -2.10, H_MAX = P ? 5.9 : 3.05, MAX_H = 4.6;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.45, -0.35, 0];
  const px = r => X0 + r * (X1 - X0);
  const py = h => BASE + (h / MAX_H) * H_MAX;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // --- formula box (one at a time, max 3 lines) ------------------------------
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.41 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.3;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }

  // --- exact Beta(5, 15) and bimodal mystery hill + seeded MCMC --------------
  const betaH = r => (r <= 0 || r >= 1) ? 0 : 58140 * Math.pow(r, 4) * Math.pow(1 - r, 14);
  const rawMystery = r => (r <= 0.02 || r >= 0.98) ? 0
    : 3.7 * Math.exp(-Math.pow((r - 0.30) / 0.11, 2)) + 2.6 * Math.exp(-Math.pow((r - 0.66) / 0.10, 2));
  let mArea = 0;
  for (let i = 0; i < 400; i++) mArea += rawMystery((i + 0.5) / 400) / 400;
  const mysteryH = r => rawMystery(r) / mArea;

  function makeRng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function runChain(fn, nSteps, start, stepSpan, seed) {
    const rng = makeRng(seed);
    let x = start, hx = fn(x);
    const out = new Float64Array(nSteps);
    for (let i = 0; i < nSteps; i++) {
      const prop = x + (rng() * 2 - 1) * stepSpan;
      if (prop > 0.002 && prop < 0.998) {
        const hp = fn(prop);
        if (hp >= hx || rng() < hp / hx) { x = prop; hx = hp; }
      }
      out[i] = x;
    }
    return out;
  }
  const N_BINS = 25, BW = 1 / N_BINS;
  function histHeights(samples, count) {
    const bins = new Array(N_BINS).fill(0);
    for (let i = 0; i < count; i++) {
      const k = Math.min(N_BINS - 1, Math.max(0, Math.floor(samples[i] * N_BINS)));
      bins[k]++;
    }
    return bins.map(c => c / (count * BW));
  }

  const betaSamples = runChain(betaH, 5000, 0.25, 0.14, 6372026);
  const h500 = histHeights(betaSamples, 500);
  const h2000 = histHeights(betaSamples, 2000);
  const h5000 = histHeights(betaSamples, 5000);
  const mysterySamples = runChain(mysteryH, 5000, 0.30, 0.24, 637991);
  const hMystery = histHeights(mysterySamples, 5000);

  // --- drawing helpers -------------------------------------------------------
  function makeAxis() {
    const parts = [new M.Line({ start: [X0, BASE, 0], end: [X1, BASE, 0], color: C.muted, strokeWidth: 3 })];
    for (const v of [0, 20, 40, 60, 80, 100]) {
      const x = px(v / 100);
      parts.push(new M.Line({ start: [x, BASE - 0.08, 0], end: [x, BASE + 0.08, 0], color: C.muted, strokeWidth: 2 }));
      const lb = T(`${v}%`, P ? 15 : 16, C.muted, true);
      lb.moveTo([x, BASE - 0.34, 0]);
      parts.push(lb);
    }
    const cap = T('failure rate', P ? 16 : 16, C.muted);
    cap.moveTo([CX, BASE - 0.72, 0]);
    parts.push(cap);
    return new M.VGroup(...parts);
  }

  function makeCurve(fn, color, sw = 3.5, opacity = 1, steps = 64) {
    const segs = [];
    for (let i = 0; i < steps; i++) {
      const r0 = i / steps, r1 = (i + 1) / steps;
      const l = new M.Line({ start: [px(r0), py(fn(r0)), 0], end: [px(r1), py(fn(r1)), 0], color, strokeWidth: sw });
      if (opacity < 1) l.setStrokeOpacity(opacity);
      segs.push(l);
    }
    return new M.VGroup(...segs);
  }

  function makeFill(fn, color, opacity = 0.16, strips = 56) {
    const sw = (X1 - X0) / strips;
    const rects = [];
    for (let i = 0; i < strips; i++) {
      const r = (i + 0.5) / strips;
      const ht = Math.max(0.01, (fn(r) / MAX_H) * H_MAX);
      if (ht < 0.02) continue;
      const b = new M.Rectangle({ width: sw + 0.015, height: ht, color, strokeWidth: 0 });
      b.setFill(color, opacity);
      b.moveTo([px(r), BASE + ht / 2, 0]);
      rects.push(b);
    }
    return new M.VGroup(...rects);
  }

  function makeBar(k, h, color = C.cyan, opacity = 0.72) {
    const w = (X1 - X0) / N_BINS * 0.84;
    const ht = Math.max(0.02, Math.min(H_MAX * 1.04, (h / MAX_H) * H_MAX));
    const b = new M.Rectangle({ width: w, height: ht, color, strokeWidth: 1 });
    b.setFill(color, opacity);
    b.moveTo([px((k + 0.5) * BW), BASE + ht / 2, 0]);
    return b;
  }

  function makeWalker(r, color = C.amber) {
    const x = px(r), y = BASE;
    const foot = new M.Dot({ point: [x, y, 0], radius: 0.09, color });
    foot.setFill(color, 1);
    const body = new M.Polygon({ vertices: Array.from({ length: 13 }, (_, i) => [x + 0.17 * Math.cos(Math.PI * i / 12), y + 0.05 + 0.17 * Math.sin(Math.PI * i / 12), 0]), color, strokeWidth: 2 });
    body.setFill(color, 0.95);
    const head = new M.Circle({ radius: 0.10, color });
    head.setFill(color, 1);
    head.moveTo([x, y + 0.37, 0]);
    return new M.VGroup(foot, body, head);
  }

  function makeArrow(p1, p2, color, sw = 2.6) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, sz = 0.16;
    const t1 = [p2[0] - sz * (ux * 0.85 - uy * 0.52), p2[1] - sz * (uy * 0.85 + ux * 0.52), 0];
    const t2 = [p2[0] - sz * (ux * 0.85 + uy * 0.52), p2[1] - sz * (uy * 0.85 - ux * 0.52), 0];
    return new M.VGroup(
      new M.Line({ start: p1, end: p2, color, strokeWidth: sw }),
      new M.Line({ start: p2, end: t1, color, strokeWidth: sw }),
      new M.Line({ start: p2, end: t2, color, strokeWidth: sw })
    );
  }

  function makeProbe(r, h, color, labelText, labelOffsetX = 0) {
    const x = px(r), y = py(h);
    const stick = new M.Line({ start: [x, BASE, 0], end: [x, y, 0], color, strokeWidth: 3.5 });
    const dot = new M.Dot({ point: [x, y, 0], radius: 0.10, color });
    dot.setFill(color, 1);
    const items = [stick, dot];
    if (labelText) {
      const lb = T(labelText, P ? 17 : 18, color, true, true);
      lb.moveTo([x + labelOffsetX, y + 0.30, 0]);
      items.push(lb);
    }
    return new M.VGroup(...items);
  }

  function makeMeter(total, filled, fillColor, caption, cx, cy) {
    const sp = P ? 0.25 : 0.27;
    const items = [];
    const cols = total > 5 ? 5 : total;
    const rows = Math.ceil(total / cols);
    for (let i = 0; i < total; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const x = cx + (c - (cols - 1) / 2) * sp;
      const y = cy + ((rows - 1) / 2 - r) * sp;
      const on = i < filled;
      const d = new M.Circle({ radius: 0.085, color: on ? fillColor : C.muted, strokeWidth: 2 });
      d.setFill(on ? fillColor : C.bg, on ? 0.9 : 0.4);
      d.moveTo([x, y, 0]);
      items.push(d);
    }
    const lb = T(caption, P ? 16 : 17, fillColor, true, true);
    lb.moveTo([cx, cy + rows * sp / 2 + 0.26, 0]);
    items.push(lb);
    return new M.VGroup(...items);
  }

  // === BEAT 0: easy repair shop posterior Beta(5, 15) ========================
  const axis = makeAxis();
  const easyFill = makeFill(betaH, C.green, 0.18);
  const easyCurve = makeCurve(betaH, C.green, 3.6);
  const betaTag = T('Beta(5, 15)', P ? 19 : 20, C.green, true, true);
  betaTag.moveTo([px(0.24), py(4.15) + 0.36, 0]);

  await until(S(0));
  await play(
    new M.Create(axis, { runTime: 0.9 }),
    new M.FadeIn(easyFill, { runTime: 1.0 }),
    new M.Create(easyCurve, { runTime: 1.2 }),
    new M.FadeIn(betaTag, { runTime: 0.8 }),
    ...say('REPAIR SHOP: EASY POSTERIOR', C.green),
    ...fbox(['Beta(2 + 3, 8 + 7)', ['= Beta(5, 15)', C.green]], C.green)
  );

  // === BEAT 1: real models have many machines, workers, unknown rates ========
  const cardData = [
    ['MACHINES', 'm1 · m2 · m3', C.cyan, CX - (P ? 2.1 : 2.5)],
    ['WORKERS', 'w1 · w2 · w3', C.amber, CX],
    ['RATES', 'r1 · r2 · r3 …', C.pink, CX + (P ? 2.1 : 2.5)]
  ];
  const modelCards = cardData.map(([title, sub, col, x]) => {
    const w = P ? 1.85 : 2.15, h = 1.25;
    const y = BASE + H_MAX * 0.56;
    const rect = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    rect.setFill(C.card, 0.92); rect.moveTo([x, y, 0]);
    const t1 = T(title, P ? 15 : 17, col, true, true); t1.moveTo([x, y + 0.24, 0]);
    const t2 = T(sub, P ? 15 : 16, C.ink, true); t2.moveTo([x, y - 0.22, 0]);
    return new M.VGroup(rect, t1, t2);
  });
  const cardLinks = [
    makeArrow([cardData[0][3] + (P ? 0.95 : 1.10), BASE + H_MAX * 0.56, 0], [cardData[1][3] - (P ? 0.95 : 1.10), BASE + H_MAX * 0.56, 0], C.muted, 2),
    makeArrow([cardData[1][3] + (P ? 0.95 : 1.10), BASE + H_MAX * 0.56, 0], [cardData[2][3] - (P ? 0.95 : 1.10), BASE + H_MAX * 0.56, 0], C.muted, 2)
  ];

  await until(S(1));
  await play(
    new M.FadeOut(easyFill, { runTime: 0.6 }),
    new M.FadeOut(easyCurve, { runTime: 0.6 }),
    new M.FadeOut(betaTag, { runTime: 0.6 }),
    new M.LaggedStart(modelCards.map(c => new M.FadeIn(c, { runTime: 0.7 })), { lagRatio: 0.25, runTime: 1.4 }),
    new M.FadeIn(cardLinks[0], { runTime: 0.8 }),
    new M.FadeIn(cardLinks[1], { runTime: 0.8 }),
    ...say('MANY UNKNOWNS AT ONCE', C.pink),
    ...fbox(['machines & workers', ['many unknown rates', C.pink]], C.pink)
  );

  // === BEAT 2: posterior has no neat name, no simple area formula ============
  const mystCurve = makeCurve(mysteryH, C.violet, 3.5);
  const mystFill = makeFill(mysteryH, C.violet, 0.14);
  const qArea = T('area = ???', P ? 20 : 22, C.pink, true, true);
  qArea.moveTo([px(0.30), py(1.35), 0]);

  await until(S(2));
  await play(
    ...modelCards.map(c => new M.FadeOut(c, { runTime: 0.6 })),
    ...cardLinks.map(l => new M.FadeOut(l, { runTime: 0.6 })),
    new M.FadeIn(mystFill, { runTime: 0.9 }),
    new M.Create(mystCurve, { runTime: 1.2 }),
    new M.FadeIn(qArea, { runTime: 0.8 }),
    ...say('NO NEAT NAME, NO AREA FORMULA', C.violet),
    ...fbox(['posterior shape: ???', ['no simple area formula', C.pink]], C.violet)
  );

  // === BEAT 3: we can still check the height at any single point =============
  const mystGhost = makeCurve(mysteryH, C.muted, 2, 0.22);
  const probe1 = makeProbe(0.34, mysteryH(0.34), C.cyan, 'height', 0.55);

  await until(S(3));
  await play(
    new M.FadeOut(mystFill, { runTime: 0.6 }),
    new M.FadeOut(mystCurve, { runTime: 0.6 }),
    new M.FadeOut(qArea, { runTime: 0.6 }),
    new M.FadeIn(mystGhost, { runTime: 0.6 }),
    new M.Create(probe1, { runTime: 1.0 }),
    ...say('CHECK HEIGHT AT ANY ONE POINT', C.cyan),
    ...fbox(['pick one point', ['→ measure its height', C.cyan]])
  );

  // === BEAT 4: height = prior x likelihood, before rescaling =================
  const probe1Hi = makeProbe(0.34, mysteryH(0.34), C.amber, 'prior × likelihood', 0.35);

  await until(S(4));
  await play(
    new M.FadeOut(probe1, { runTime: 0.5 }),
    new M.FadeIn(probe1Hi, { runTime: 0.8 }),
    ...say('HEIGHT = PRIOR × LIKELIHOOD', C.amber),
    ...fbox([['height = prior × likelihood', C.amber], ['(before rescaling)', C.muted]], C.amber)
  );

  // === BEAT 5: puzzle: whole hill from one height at a time? =================
  const probeA = makeProbe(0.18, mysteryH(0.18), C.violet);
  const probeB = makeProbe(0.58, mysteryH(0.58), C.violet);
  const qTop = T('whole hill?', P ? 20 : 22, C.violet, true, true);
  qTop.moveTo([px(0.50), py(3.85), 0]);

  await until(S(5));
  await play(
    new M.Create(probeA, { runTime: 0.7 }),
    new M.Create(probeB, { runTime: 0.7 }),
    new M.FadeIn(qTop, { runTime: 0.8 }),
    ...say('PUZZLE: ONE HEIGHT → WHOLE HILL?', C.violet),
    ...fbox(['can check: 1 point at a time', ['want: the whole hill', C.green]], C.violet)
  );

  // === BEAT 6: use our easy hill Beta(5, 15) to check at the end =============
  const hillFill = makeFill(betaH, C.green, 0.16);
  const hillCurve = makeCurve(betaH, C.green, 3.6);
  const hillTag = T('Beta(5, 15)', P ? 18 : 19, C.green, true, true);
  hillTag.moveTo([px(0.22), py(4.15) + 0.38, 0]);

  await until(S(6));
  await play(
    new M.FadeOut(mystGhost, { runTime: 0.5 }),
    new M.FadeOut(probe1Hi, { runTime: 0.5 }),
    new M.FadeOut(probeA, { runTime: 0.5 }),
    new M.FadeOut(probeB, { runTime: 0.5 }),
    new M.FadeOut(qTop, { runTime: 0.5 }),
    new M.FadeIn(hillFill, { runTime: 0.9 }),
    new M.Create(hillCurve, { runTime: 1.1 }),
    new M.FadeIn(hillTag, { runTime: 0.7 }),
    ...say('TEST ON OUR EASY HILL: BETA(5, 15)', C.green),
    ...fbox([['test hill: Beta(5, 15)', C.green], ['(we know the answer)', C.muted]], C.green)
  );

  // === BEAT 7: walker standing on the rate line at 25% =======================
  const walker = makeWalker(0.25, C.amber);
  const w25Tag = T('25%', P ? 17 : 18, C.amber, true, true);
  w25Tag.moveTo([px(0.25), BASE + 0.72, 0]);

  await until(S(7));
  await play(
    new M.FadeIn(walker, { runTime: 0.8 }),
    new M.Flash(walker.submobjects[0], { color: C.amber, runTime: 0.8 }),
    new M.FadeIn(w25Tag, { runTime: 0.7 }),
    ...say('WALKER STANDS AT 25%', C.amber),
    ...fbox([['walker standing at: 25%', C.amber]], C.amber)
  );

  // === BEAT 8: picks a nearby spot at random, left or right (proposal) =======
  const propY = BASE + 0.25;
  const arrL = makeArrow([px(0.23), propY, 0], [px(0.14), propY, 0], C.violet, 2.8);
  const arrR = makeArrow([px(0.27), propY, 0], [px(0.36), propY, 0], C.violet, 2.8);
  const ringL = new M.Circle({ radius: 0.11, color: C.violet, strokeWidth: 2.5 });
  ringL.moveTo([px(0.13), BASE, 0]);
  const ringR = new M.Circle({ radius: 0.11, color: C.violet, strokeWidth: 2.5 });
  ringR.moveTo([px(0.37), BASE, 0]);

  await until(S(8));
  await play(
    new M.FadeIn(arrL, { runTime: 0.8 }),
    new M.FadeIn(arrR, { runTime: 0.8 }),
    new M.FadeIn(ringL, { runTime: 0.8 }),
    new M.FadeIn(ringR, { runTime: 0.8 }),
    ...say('PROPOSAL: A NEARBY RANDOM SPOT', C.violet),
    ...fbox(['standing at: 25%', ['proposal: little left or right', C.violet]], C.violet)
  );

  // === BEAT 9: left and right equally likely, no built-in lean ===============
  const p50L = T('50%', P ? 15 : 16, C.cyan, true, true);
  p50L.moveTo([px(0.13), BASE + 0.56, 0]);
  const p50R = T('50%', P ? 15 : 16, C.cyan, true, true);
  p50R.moveTo([px(0.37), BASE + 0.56, 0]);

  await until(S(9));
  await play(
    new M.FadeIn(p50L, { runTime: 0.7 }),
    new M.FadeIn(p50R, { runTime: 0.7 }),
    new M.Indicate(arrL, { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(arrR, { color: C.cyan, runTime: 0.9 }),
    ...say('LEFT & RIGHT EQUALLY LIKELY', C.cyan),
    ...fbox(['left  = 50%   right = 50%', ['no built-in lean', C.cyan]])
  );

  // === BEAT 10: Rule 1: higher on the hill -> always move ====================
  const r1Probe = makeProbe(0.21, betaH(0.21), C.green);
  const r1Tag = T('HIGHER → MOVE', P ? 16 : 17, C.green, true, true);
  r1Tag.moveTo([px(0.42), py(3.6), 0]);

  await until(S(10));
  await play(
    new M.FadeOut(arrL, { runTime: 0.5 }),
    new M.FadeOut(arrR, { runTime: 0.5 }),
    new M.FadeOut(ringL, { runTime: 0.5 }),
    new M.FadeOut(ringR, { runTime: 0.5 }),
    new M.FadeOut(p50L, { runTime: 0.5 }),
    new M.FadeOut(p50R, { runTime: 0.5 }),
    new M.FadeOut(w25Tag, { runTime: 0.5 }),
    new M.Create(r1Probe, { runTime: 0.8 }),
    new M.FadeIn(r1Tag, { runTime: 0.8 }),
    ...say('RULE 1: HIGHER → ALWAYS MOVE', C.green),
    ...fbox([['Rule 1: proposed is higher', C.green], ['→ always move (100%)', C.green]], C.green)
  );

  // === BEAT 11: Rule 2: lower -> move only sometimes =========================
  const r2Probe = makeProbe(0.35, betaH(0.35), C.amber);
  const r2Tag = T('LOWER → SOMETIMES', P ? 16 : 17, C.amber, true, true);
  r2Tag.moveTo([px(0.55), py(2.4), 0]);

  await until(S(11));
  await play(
    new M.FadeOut(r1Probe, { runTime: 0.5 }),
    new M.FadeOut(r1Tag, { runTime: 0.5 }),
    new M.Create(r2Probe, { runTime: 0.8 }),
    new M.FadeIn(r2Tag, { runTime: 0.8 }),
    ...say('RULE 2: LOWER → SOMETIMES MOVE', C.amber),
    ...fbox([['Rule 2: proposed is lower', C.amber], ['→ move only sometimes', C.amber], ['(lower = less often)', C.muted]], C.amber)
  );

  // === BEAT 12: chance = new height / old height =============================
  await until(S(12));
  await play(
    new M.Indicate(r2Probe, { color: C.cyan, runTime: 0.9 }),
    ...say('CHANCE = NEW HEIGHT ÷ OLD HEIGHT', C.cyan),
    ...fbox(['chance of moving =', ['  new height ÷ old height', C.amber]])
  );

  // === BEAT 13: try it: walker at 25% proposes 20% ===========================
  const ring20 = new M.Circle({ radius: 0.11, color: C.violet, strokeWidth: 2.8 });
  ring20.moveTo([px(0.20), BASE, 0]);
  const arr25to20 = makeArrow([px(0.25), BASE + 0.55, 0], [px(0.20), BASE + 0.55, 0], C.violet, 2.8);
  const tagProp20 = T('propose 20%', P ? 15 : 16, C.violet, true, true);
  tagProp20.moveTo([px(0.11), BASE + 0.85, 0]);

  await until(S(13));
  await play(
    new M.FadeOut(r2Probe, { runTime: 0.5 }),
    new M.FadeOut(r2Tag, { runTime: 0.5 }),
    new M.FadeOut(hillTag, { runTime: 0.5 }),
    new M.FadeIn(ring20, { runTime: 0.7 }),
    new M.FadeIn(arr25to20, { runTime: 0.7 }),
    new M.FadeIn(tagProp20, { runTime: 0.7 }),
    ...say('TRY IT: 25% → PROPOSE 20%', C.violet),
    ...fbox(['walker at: 25%', ['proposal:  20%', C.violet]], C.violet)
  );

  // === BEAT 14: read heights: 20% ≈ 4.1, 25% ≈ 4.05 ==========================
  const p20 = makeProbe(0.20, betaH(0.20), C.green, '4.1', P ? -0.58 : -0.62);
  const p25 = makeProbe(0.25, betaH(0.25), C.amber, '4.05', P ? 0.65 : 0.72);

  await until(S(14));
  await play(
    new M.FadeOut(tagProp20, { runTime: 0.4 }),
    new M.Create(p20, { runTime: 1.0 }),
    new M.Create(p25, { runTime: 1.0 }),
    ...say('HEIGHTS: 4.1 AT 20% · 4.05 AT 25%', C.cyan),
    ...fbox([['height(20%) ≈ 4.1', C.green], ['height(25%) ≈ 4.05', C.amber]])
  );

  // === BEAT 15: so 20% is a little higher (short 2.14s) ======================
  await until(S(15));
  await play(
    new M.Indicate(p20, { color: C.green, runTime: 0.85 }),
    ...say('20% IS A LITTLE HIGHER', C.green),
    ...fbox(['4.1 > 4.05', ['→ 20% is higher', C.green]], C.green)
  );

  // === BEAT 16: Rule 1: move, walker steps to 20% ============================
  await until(S(16));
  await play(
    new M.FadeOut(arr25to20, { runTime: 0.4 }),
    new M.FadeOut(ring20, { runTime: 0.4 }),
    new M.Transform(walker, makeWalker(0.20, C.green), { pathArc: 0.8, runTime: 1.0 }),
    ...say('RULE 1: STEP TO 20%', C.green),
    ...fbox([['Rule 1: always move', C.green], ['walker steps to 20%', C.green]], C.green)
  );

  // === BEAT 17: another time, from 25% proposes 30% ==========================
  const ring30 = new M.Circle({ radius: 0.11, color: C.violet, strokeWidth: 2.8 });
  ring30.moveTo([px(0.30), BASE, 0]);
  const arr25to30 = makeArrow([px(0.25), BASE + 0.55, 0], [px(0.30), BASE + 0.55, 0], C.violet, 2.8);

  await until(S(17));
  await play(
    new M.FadeOut(p20, { runTime: 0.4 }),
    new M.Transform(walker, makeWalker(0.25, C.amber), { runTime: 0.7 }),
    new M.FadeIn(ring30, { runTime: 0.7 }),
    new M.FadeIn(arr25to30, { runTime: 0.7 }),
    ...say('FROM 25% → PROPOSE 30%', C.violet),
    ...fbox(['walker at: 25%', ['proposal:  30%', C.violet]], C.violet)
  );

  // === BEAT 18: height at 30% ≈ 3.2 (lower) ==================================
  const p30 = makeProbe(0.30, betaH(0.30), C.amber, '3.2', P ? 0.58 : 0.62);

  await until(S(18));
  await play(
    new M.Create(p30, { runTime: 0.9 }),
    ...say('HEIGHT AT 30% ≈ 3.2 (LOWER)', C.amber),
    ...fbox(['height(25%) ≈ 4.05', ['height(30%) ≈ 3.2 (lower)', C.amber]], C.amber)
  );

  // === BEAT 19: 3.2 / 4.05 ≈ 0.8 =============================================
  const meter5 = makeMeter(5, 4, C.green, '4 in 5 move', px(0.74), py(2.3));

  await until(S(19));
  await play(
    new M.FadeIn(meter5, { runTime: 0.9 }),
    ...say('3.2 ÷ 4.05 ≈ 0.8', C.amber),
    ...fbox(['new ÷ old = 3.2 ÷ 4.05', ['≈ 0.8  (4 in 5)', C.amber]], C.amber)
  );

  // === BEAT 20: move with chance 4 in 5, else stay and record again ==========
  const stayRing = new M.Circle({ radius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  stayRing.moveTo([px(0.25), BASE, 0]);
  const stayTag = T('stay → record 25%', P ? 15 : 16, C.cyan, true, true);
  stayTag.moveTo([px(0.74), py(1.35), 0]);

  await until(S(20));
  await play(
    new M.Indicate(meter5, { color: C.green, runTime: 1.0 }),
    new M.FadeIn(stayRing, { runTime: 0.8 }),
    new M.FadeIn(stayTag, { runTime: 0.8 }),
    ...say('4 IN 5 MOVE · 1 IN 5 STAY & RECORD', C.amber),
    ...fbox([['4 in 5: step to 30%', C.green], ['1 in 5: stay at 25%', C.amber], ['(record 25% again)', C.muted]], C.amber)
  );

  // === BEAT 21: propose 40% -> height ≈ 1.2 ==================================
  const ring40 = new M.Circle({ radius: 0.11, color: C.pink, strokeWidth: 2.8 });
  ring40.moveTo([px(0.40), BASE, 0]);
  const arr25to40 = makeArrow([px(0.26), BASE + 0.55, 0], [px(0.39), BASE + 0.55, 0], C.pink, 2.8);
  const p40 = makeProbe(0.40, betaH(0.40), C.pink, '1.2', P ? 0.55 : 0.58);

  await until(S(21));
  await play(
    new M.FadeOut(ring30, { runTime: 0.45 }),
    new M.FadeOut(arr25to30, { runTime: 0.45 }),
    new M.FadeOut(p30, { runTime: 0.45 }),
    new M.FadeOut(meter5, { runTime: 0.45 }),
    new M.FadeOut(stayRing, { runTime: 0.45 }),
    new M.FadeOut(stayTag, { runTime: 0.45 }),
    new M.FadeIn(ring40, { runTime: 0.7 }),
    new M.FadeIn(arr25to40, { runTime: 0.7 }),
    new M.Create(p40, { runTime: 0.9 }),
    ...say('PROPOSE 40% → HEIGHT ≈ 1.2', C.pink),
    ...fbox(['height(25%) ≈ 4.05', ['height(40%) ≈ 1.2', C.pink]], C.pink)
  );

  // === BEAT 22: 1.2 / 4.05 ≈ 0.3 (3 in 10) ===================================
  const meter10 = makeMeter(10, 3, C.pink, '3 in 10 move', px(0.75), py(2.3));

  await until(S(22));
  await play(
    new M.FadeIn(meter10, { runTime: 0.9 }),
    ...say('1.2 ÷ 4.05 ≈ 0.3 (3 IN 10)', C.pink),
    ...fbox(['new ÷ old = 1.2 ÷ 4.05', ['≈ 0.3  (3 in 10)', C.pink]], C.pink)
  );

  // === BEAT 23: notice: only ever divided one height by another ==============
  await until(S(23));
  await play(
    new M.FadeOut(meter10, { runTime: 0.45 }),
    new M.FadeOut(arr25to40, { runTime: 0.45 }),
    new M.FadeOut(ring40, { runTime: 0.45 }),
    new M.Indicate(p25, { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(p40, { color: C.cyan, runTime: 0.9 }),
    ...say('ONLY DIVIDED ONE HEIGHT BY ANOTHER', C.cyan),
    ...fbox(['only ever needed:', ['  new height ÷ old height', C.cyan]])
  );

  // === BEAT 24: never needed the rescaling total from lesson two =============
  await until(S(24));
  await play(
    ...say('NO RESCALING TOTAL NEEDED', C.green),
    ...fbox(['(new ÷ total) ÷ (old ÷ total)', ['= new ÷ old', C.green], ['rescaling total cancels!', C.amber]], C.green)
  );

  // === BEAT 25: let the walker take thousands of steps, mark each place ======
  const hillGhost = makeCurve(betaH, C.green, 2.2, 0.28);
  const demoSteps = [0.25, 0.21, 0.29, 0.24, 0.18, 0.26, 0.33, 0.28, 0.19, 0.23, 0.31, 0.22];
  const footprints = demoSteps.map((r, i) => {
    const d = new M.Dot({ point: [px(r), BASE + 0.08 + (i % 3) * 0.08, 0], radius: 0.07, color: C.cyan });
    d.setFill(C.cyan, 0.9);
    return d;
  });

  await until(S(25));
  await play(
    new M.FadeOut(p25, { runTime: 0.4 }),
    new M.FadeOut(p40, { runTime: 0.4 }),
    new M.FadeOut(hillFill, { runTime: 0.5 }),
    new M.FadeOut(hillCurve, { runTime: 0.5 }),
    new M.FadeIn(hillGhost, { runTime: 0.5 }),
    ...say('WALKER TAKES THOUSANDS OF STEPS', C.cyan),
    ...fbox(['walker stepping...', ['marking each spot', C.cyan]])
  );
  await play(
    new M.LaggedStart(footprints.map(d => new M.FadeIn(d, { runTime: 0.25 })), { lagRatio: 0.35, runTime: 2.6 }),
    new M.Transform(walker, makeWalker(0.22, C.amber), { runTime: 2.2 })
  );

  // === BEAT 26: watch the footprints pile up into a histogram ================
  const histBars = h500.map((h, k) => makeBar(k, h, C.cyan, 0.74));

  await until(S(26));
  await play(
    ...footprints.map(d => new M.FadeOut(d, { runTime: 0.4 })),
    new M.LaggedStart(histBars.map(b => new M.FadeIn(b, { runTime: 0.45 })), { lagRatio: 0.05, runTime: 1.3 }),
    ...say('FOOTPRINTS PILE INTO A HISTOGRAM', C.cyan),
    ...fbox(['steps: 500', ['footprints → histogram', C.cyan]])
  );

  // === BEAT 27: most time near the top, rarely visits the low tails ==========
  const peakTag = T('MOST TIME HERE', P ? 15 : 16, C.amber, true, true);
  peakTag.moveTo([px(0.47), py(3.9), 0]);
  const tailTag = T('RARE IN TAILS', P ? 15 : 16, C.muted, true, true);
  tailTag.moveTo([px(0.72), py(0.95), 0]);

  await until(S(27));
  await play(
    ...histBars.map((b, k) => new M.Transform(b, makeBar(k, h2000[k], C.cyan, 0.76), { runTime: 1.3 })),
    new M.FadeIn(peakTag, { runTime: 0.8 }),
    new M.FadeIn(tailTag, { runTime: 0.8 }),
    ...say('MOST TIME AT PEAK · RARE IN TAILS', C.amber),
    ...fbox(['steps: 2,000', ['peak: crowded', C.amber], ['tails: rarely visited', C.muted]], C.amber)
  );

  // === BEAT 28: after 5,000 steps, histogram has the shape of the green hill =
  const hillBright = makeCurve(betaH, C.green, 4.0);

  await until(S(28));
  await play(
    new M.FadeOut(peakTag, { runTime: 0.45 }),
    new M.FadeOut(tailTag, { runTime: 0.45 }),
    new M.FadeOut(hillGhost, { runTime: 0.45 }),
    ...histBars.map((b, k) => new M.Transform(b, makeBar(k, h5000[k], C.cyan, 0.68), { runTime: 1.2 })),
    new M.Create(hillBright, { runTime: 1.4 }),
    ...say('5,000 STEPS = SHAPE OF GREEN HILL', C.green),
    ...fbox([['steps: 5,000', C.cyan], ['matches the green hill!', C.green]], C.green)
  );

  // === BEAT 29: mean ≈ 25%, middle 95% from about 8% to 46% ==================
  const meanLine = new M.DashedLine({ start: [px(0.25), BASE, 0], end: [px(0.25), py(4.35), 0], color: C.amber });
  const meanTag = T('mean ≈ 25%', P ? 16 : 17, C.amber, true, true);
  meanTag.moveTo([px(0.29), py(4.55), 0]);
  const ciBar = new M.Line({ start: [px(0.08), BASE + 0.04, 0], end: [px(0.46), BASE + 0.04, 0], color: C.amber, strokeWidth: 6 });
  const ciL = new M.Line({ start: [px(0.08), BASE, 0], end: [px(0.08), py(1.3), 0], color: C.amber, strokeWidth: 2.5 });
  const ciR = new M.Line({ start: [px(0.46), BASE, 0], end: [px(0.46), py(1.3), 0], color: C.amber, strokeWidth: 2.5 });
  const ciTag = T('95%: 8% to 46%', P ? 15 : 16, C.amber, true, true);
  ciTag.moveTo([px(0.70), py(1.55), 0]);

  await until(S(29));
  await play(
    new M.Create(meanLine, { runTime: 0.9 }),
    new M.FadeIn(meanTag, { runTime: 0.7 }),
    new M.Create(ciBar, { runTime: 0.9 }),
    new M.Create(ciL, { runTime: 0.7 }),
    new M.Create(ciR, { runTime: 0.7 }),
    new M.FadeIn(ciTag, { runTime: 0.7 }),
    ...say('MEAN ≈ 25% · MIDDLE 95%: 8% TO 46%', C.amber),
    ...fbox(['5,000 footprints:', ['mean ≈ 25%', C.amber], ['95%  ≈ 8% to 46%', C.cyan]], C.amber)
  );

  // === BEAT 30: matches exact answer: mean 25%, interval 9 to 46 =============
  await until(S(30));
  await play(
    new M.Indicate(hillBright, { color: C.green, runTime: 1.2 }),
    ...say('MATCHES EXACT BETA(5, 15)', C.green),
    ...fbox(['footprints: 25% (8–46%)', ['exact:      25% (9–46%)', C.green], ['✓ close match', C.amber]], C.green)
  );

  // === BEAT 31: Markov chain Monte Carlo (MCMC) ==============================
  const badgeMC = pill('MONTE CARLO', C.amber, P ? 15 : 16);
  badgeMC.moveTo([px(0.74), py(2.8), 0]);
  const badgeMK = pill('MARKOV CHAIN', C.cyan, P ? 15 : 16);
  badgeMK.moveTo([px(0.74), py(1.85), 0]);

  await until(S(31));
  await play(
    new M.FadeOut(meanLine, { runTime: 0.45 }),
    new M.FadeOut(meanTag, { runTime: 0.45 }),
    new M.FadeOut(ciBar, { runTime: 0.45 }),
    new M.FadeOut(ciL, { runTime: 0.45 }),
    new M.FadeOut(ciR, { runTime: 0.45 }),
    new M.FadeOut(ciTag, { runTime: 0.45 }),
    new M.FadeIn(badgeMK, { runTime: 0.8 }),
    new M.FadeIn(badgeMC, { runTime: 0.8 }),
    ...say('MARKOV CHAIN MONTE CARLO (MCMC)', C.violet),
    ...fbox([['MCMC', C.violet], ['= Markov chain', C.cyan], ['+ Monte Carlo', C.amber]], C.violet)
  );

  // === BEAT 32: Monte Carlo = random draws ===================================
  await until(S(32));
  await play(
    new M.Indicate(badgeMC, { color: C.amber, runTime: 0.9 }),
    new M.LaggedStart([3, 5, 6, 8, 10].map(k => new M.Indicate(histBars[k], { color: C.amber, runTime: 0.5 })), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('MONTE CARLO = RANDOM DRAWS', C.amber),
    ...fbox([['Monte Carlo', C.amber], ['= using random draws', C.ink], ['(from Unit 5)', C.muted]], C.amber)
  );

  // === BEAT 33: Markov chain = each step depends only on now =================
  const hop1 = makeArrow([px(0.22), BASE + 0.58, 0], [px(0.31), BASE + 0.58, 0], C.cyan, 2.8);
  const hop2 = makeArrow([px(0.31), BASE + 0.78, 0], [px(0.24), BASE + 0.78, 0], C.cyan, 2.8);

  await until(S(33));
  await play(
    new M.Indicate(badgeMK, { color: C.cyan, runTime: 0.8 }),
    new M.FadeIn(hop1, { runTime: 0.6 }),
    new M.Transform(walker, makeWalker(0.31, C.amber), { pathArc: -0.6, runTime: 0.8 }),
    ...say('MARKOV CHAIN = STEP FROM NOW ONLY', C.cyan),
    ...fbox([['Markov chain', C.cyan], ['next step uses only', C.ink], ['where you stand now', C.cyan]])
  );
  await play(
    new M.FadeIn(hop2, { runTime: 0.5 }),
    new M.Transform(walker, makeWalker(0.24, C.amber), { pathArc: 0.6, runTime: 0.8 })
  );

  // === BEAT 34: here is the short version, in words (short 2.87s) ============
  await until(S(34));
  await play(
    new M.FadeOut(badgeMC, { runTime: 0.45 }),
    new M.FadeOut(badgeMK, { runTime: 0.45 }),
    new M.FadeOut(hop1, { runTime: 0.45 }),
    new M.FadeOut(hop2, { runTime: 0.45 }),
    ...say('THE SHORT VERSION, IN WORDS', C.ink),
    ...fbox([['MCMC in plain words:', C.cyan], '1. propose a step', '2. move or stay, then record'])
  );

  // === BEAT 35: propose nearby, accept with chance min(1, new / old) =========
  const shortArr = makeArrow([px(0.24), BASE + 0.58, 0], [px(0.32), BASE + 0.58, 0], C.amber, 2.8);

  await until(S(35));
  await play(
    new M.FadeIn(shortArr, { runTime: 0.7 }),
    ...say('ACCEPT CHANCE = MIN(1, NEW ÷ OLD)', C.amber),
    ...fbox(['1. propose a nearby value', ['2. accept chance =', C.ink], ['   min(1, new ÷ old)', C.amber]], C.amber)
  );

  // === BEAT 36: wander, always climb, sometimes step down, record ============
  await until(S(36));
  await play(
    new M.FadeOut(shortArr, { runTime: 0.4 }),
    new M.Transform(walker, makeWalker(0.21, C.green), { pathArc: 0.7, runTime: 0.9 }),
    ...say('WANDER · CLIMB · STEP DOWN · RECORD', C.green),
    ...fbox([['wander · always climb', C.green], ['sometimes step down', C.amber], ['record where you stand', C.cyan]], C.green)
  );

  // === BEAT 37: what is it for? posteriors with no simple formula ============
  const mystBright = makeCurve(mysteryH, C.violet, 3.8);

  await until(S(37));
  await play(
    new M.FadeOut(hillBright, { runTime: 0.5 }),
    new M.FadeOut(walker, { runTime: 0.5 }),
    ...histBars.map((b, k) => new M.Transform(b, makeBar(k, hMystery[k], C.cyan, 0.72), { runTime: 1.2 })),
    new M.Create(mystBright, { runTime: 1.2 }),
    ...say('FOR POSTERIORS WITH NO FORMULA', C.violet),
    ...fbox(['no simple formula?', ['→ MCMC draws trace it', C.cyan]], C.violet)
  );

  // === BEAT 38: from those draws: means, credible intervals, predictions =====
  const mMean = new M.DashedLine({ start: [px(0.44), BASE, 0], end: [px(0.44), py(3.6), 0], color: C.amber });
  const mCi = new M.Line({ start: [px(0.15), BASE + 0.04, 0], end: [px(0.79), BASE + 0.04, 0], color: C.green, strokeWidth: 6 });
  const mTag = T('mean · 95% · predict', P ? 16 : 17, C.green, true, true);
  mTag.moveTo([px(0.50), py(3.95), 0]);

  await until(S(38));
  await play(
    new M.Create(mMean, { runTime: 0.8 }),
    new M.Create(mCi, { runTime: 0.8 }),
    new M.FadeIn(mTag, { runTime: 0.8 }),
    ...say('MEANS · INTERVALS · PREDICTIONS', C.green),
    ...fbox(['just count the draws:', ['mean & credible interval', C.amber], ['and predictions', C.green]], C.green)
  );

  // === BEAT 39: common trap: first footprints depend on start ================
  const hillTrap = makeCurve(betaH, C.green, 3.4);
  const badWalker = makeWalker(0.86, C.pink);
  const badPath = [0.86, 0.83, 0.80, 0.77, 0.74];
  const badDots = badPath.map((r, i) => {
    const d = new M.Dot({ point: [px(r), BASE + 0.09 + (i % 2) * 0.08, 0], radius: 0.075, color: C.pink });
    d.setFill(C.pink, 0.95);
    return d;
  });
  const startTag = T('started at 86%', P ? 15 : 16, C.pink, true, true);
  startTag.moveTo([px(0.80), BASE + 0.85, 0]);

  await until(S(39));
  await play(
    new M.FadeOut(mystBright, { runTime: 0.45 }),
    new M.FadeOut(mMean, { runTime: 0.45 }),
    new M.FadeOut(mCi, { runTime: 0.45 }),
    new M.FadeOut(mTag, { runTime: 0.45 }),
    ...histBars.map(b => new M.FadeOut(b, { runTime: 0.45 })),
    new M.Create(hillTrap, { runTime: 0.9 }),
    new M.FadeIn(badWalker, { runTime: 0.7 }),
    new M.FadeIn(startTag, { runTime: 0.7 }),
    ...say('TRAP: FIRST STEPS DEPEND ON START', C.pink),
    ...fbox([['Trap 1: starting spot', C.pink], ['early prints stay near start', C.muted]], C.pink)
  );
  await play(
    new M.LaggedStart(badDots.map(d => new M.FadeIn(d, { runTime: 0.25 })), { lagRatio: 0.35, runTime: 1.4 }),
    new M.Transform(badWalker, makeWalker(0.74, C.pink), { runTime: 1.4 })
  );

  // === BEAT 40: too few steps or wrong step size misses part of the hill =====
  const badHist = [16, 17, 18, 19, 20].map((k, i) => makeBar(k, [0.4, 0.9, 1.5, 1.1, 0.6][i], C.pink, 0.72));
  const missedTag = T('MISSED THE PEAK!', P ? 16 : 17, C.pink, true, true);
  missedTag.moveTo([px(0.24), py(4.45), 0]);

  await until(S(40));
  await play(
    new M.FadeOut(startTag, { runTime: 0.4 }),
    ...badDots.map(d => new M.FadeOut(d, { runTime: 0.4 })),
    new M.LaggedStart(badHist.map(b => new M.FadeIn(b, { runTime: 0.45 })), { lagRatio: 0.12, runTime: 1.0 }),
    new M.FadeIn(missedTag, { runTime: 0.8 }),
    ...say('TOO FEW OR TINY STEPS MISS THE HILL', C.pink),
    ...fbox([['Trap 2: too few / tiny steps', C.pink], ['→ misses part of the hill', C.amber]], C.pink)
  );

  // === BEAT 41: only matches once explored well; next lesson checks that =====
  const finalBars = h5000.map((h, k) => makeBar(k, h, C.cyan, 0.70));

  await until(S(41));
  await play(
    new M.FadeOut(badWalker, { runTime: 0.45 }),
    new M.FadeOut(missedTag, { runTime: 0.45 }),
    ...badHist.map(b => new M.FadeOut(b, { runTime: 0.45 })),
    new M.LaggedStart(finalBars.map(b => new M.FadeIn(b, { runTime: 0.45 })), { lagRatio: 0.04, runTime: 1.4 }),
    ...say('NEXT LESSON: CHECK THE EXPLORATION', C.green),
    ...fbox([['good run: full hill explored', C.green], ['next: how to check that', C.cyan]], C.green)
  );

  // === BEAT 42: one-sentence recap ===========================================
  const finalWalker = makeWalker(0.23, C.amber);

  await until(S(42));
  await play(
    new M.FadeIn(finalWalker, { runTime: 0.8 }),
    new M.Flash(finalWalker.submobjects[0], { color: C.amber, runTime: 0.9 }),
    new M.Indicate(hillTrap, { color: C.green, runTime: 1.3 }),
    ...say('WALKER PREFERS HIGH GROUND → POSTERIOR', C.amber),
    ...fbox([['MCMC:', C.amber], ['prefers higher ground', C.green], ['footprints trace posterior', C.cyan]], C.amber)
  );
}

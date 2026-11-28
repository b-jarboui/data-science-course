// 10.4.6 Try it: Posterior predictive checks.
// Tap clinic dots to change the record (or make a random clinic), switch between Model A (1 shared chance)
// and Model B (separate chances per group), step through individual replays or press Play with a speed
// slider, watch the replicated histogram and tail-share settling curve grow, and solve 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const RED = '#ef4444';
  const RED_GLOW = '#f87171';

  // Exact clinic record from chapters/10.4.md: 4 rows x 10 cols
  // Rows 0-1: Reminder (1 + 1 = 2 missed); Rows 2-3: No reminder (3 + 5 = 8 missed)
  const DEFAULT_MISS = new Set([3, 17, 21, 25, 28, 30, 32, 34, 36, 39]);

  let missed = new Set(DEFAULT_MISS);
  let model = 'A';       // 'A' (one shared chance) | 'B' (separate chances)
  let metric = 'gap';    // 'gap' | 'total'
  let playing = false;
  let speedIdx = 2;      // 0..4 -> [2, 15, 80, 350, 1200] replays/sec
  const SPEEDS = [2, 15, 80, 350, 1200];
  const SPEED_LABELS = ['Slow (2/s)', 'Medium (15/s)', 'Fast (80/s)', 'Very fast (350/s)', 'Turbo (1200/s)'];
  const MAX_REPLAYS = 200000;

  let replays = 0;
  let manualSteps = 0;
  let totHist = new Int32Array(41); // 0..40
  let gapHist = new Int32Array(41); // -20..+20 (index = gap + 20)
  let tailHitsGap = 0;
  let tailHitsTot = 0;
  let curvePts = []; // { n, share } sampled points for settling curve
  let lastDraw = null; // { pA, pRem, pNo, simRem, simNo, total, gap }
  let raf = 0;
  let lastTs = 0;
  let carry = 0;

  // Exact Beta(a, b) sampler for integer a, b >= 1 via Gamma(a, 1) / (Gamma(a, 1) + Gamma(b, 1))
  function sampleBeta(a, b) {
    let x = 0, y = 0;
    for (let i = 0; i < a; i++) x -= Math.log(1 - Math.random());
    for (let i = 0; i < b; i++) y -= Math.log(1 - Math.random());
    return x / (x + y);
  }
  function sampleBinom(n, p) {
    let k = 0;
    for (let i = 0; i < n; i++) if (Math.random() < p) k++;
    return k;
  }

  // Exact Beta PDF for drawing smooth posterior curves
  const LF = [0];
  for (let i = 1; i <= 60; i++) LF.push(LF[i - 1] + Math.log(i));
  const lbeta = (a, b) => LF[a - 1] + LF[b - 1] - LF[a + b - 1];
  const betaPdf = (x, a, b) => (x <= 0 || x >= 1) ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lbeta(a, b));

  function clinicCounts() {
    let rem = 0, no = 0;
    for (const i of missed) {
      if (i < 20) rem++; else no++;
    }
    return { rem, no, total: rem + no, gap: no - rem };
  }

  function clearReplays() {
    replays = 0;
    totHist.fill(0);
    gapHist.fill(0);
    tailHitsGap = 0;
    tailHitsTot = 0;
    curvePts = [];
    lastDraw = null;
    carry = 0;
  }

  function runReplays(count) {
    const cc = clinicCounts();
    const aA = 1 + cc.total, bA = 1 + 40 - cc.total;
    const aR = 1 + cc.rem, bR = 1 + 20 - cc.rem;
    const aN = 1 + cc.no, bN = 1 + 20 - cc.no;
    const limit = Math.min(count, MAX_REPLAYS - replays);
    for (let k = 0; k < limit; k++) {
      let simRem, simNo, pA = null, pRem = null, pNo = null;
      if (model === 'A') {
        pA = sampleBeta(aA, bA);
        simRem = sampleBinom(20, pA);
        simNo = sampleBinom(20, pA);
      } else {
        pRem = sampleBeta(aR, bR);
        pNo = sampleBeta(aN, bN);
        simRem = sampleBinom(20, pRem);
        simNo = sampleBinom(20, pNo);
      }
      const total = simRem + simNo;
      const gap = simNo - simRem;
      replays++;
      totHist[total]++;
      gapHist[gap + 20]++;
      if (cc.gap >= 0 ? gap >= cc.gap : gap <= cc.gap) tailHitsGap++;
      if (total >= cc.total) tailHitsTot++;
      lastDraw = { pA, pRem, pNo, simRem, simNo, total, gap };

      // Record settling-curve checkpoints densely early on, then periodically
      const stride = replays <= 40 ? 1 : replays <= 300 ? 5 : replays <= 2000 ? 25 : replays <= 15000 ? 150 : 1000;
      if (replays === 1 || replays % stride === 0 || k === limit - 1) {
        const share = (metric === 'gap' ? tailHitsGap : tailHitsTot) / replays;
        curvePts.push({ n: replays, share });
        if (curvePts.length > 260) {
          // Thin older points slightly to keep SVG crisp
          const next = [];
          for (let i = 0; i < curvePts.length; i++) if (i % 2 === 0 || i === curvePts.length - 1) next.push(curvePts[i]);
          curvePts = next;
        }
      }
    }
    if (replays >= MAX_REPLAYS) stopPlay();
  }

  function stopPlay() {
    playing = false;
    cancelAnimationFrame(raf);
    raf = 0;
    syncButtons();
  }

  function togglePlay() {
    if (playing) { stopPlay(); return; }
    if (replays >= MAX_REPLAYS) clearReplays();
    playing = true;
    lastTs = performance.now();
    syncButtons();
    const loop = now => {
      if (!playing) return;
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      carry += SPEEDS[speedIdx] * dt;
      const todo = Math.floor(carry);
      if (todo > 0) {
        carry -= todo;
        runReplays(todo);
        draw();
      }
      if (playing) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  // Build UI
  const svg = s('svg', { viewBox: '0 0 700 525' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');

  const btnA = btn('Model A (1 chance)', () => { if (model !== 'A') { model = 'A'; stopPlay(); clearReplays(); draw(); } });
  const btnB = btn('Model B (2 chances)', () => { if (model !== 'B') { model = 'B'; stopPlay(); clearReplays(); draw(); } });
  const btnGap = btn('Check: Gap', () => { if (metric !== 'gap') { metric = 'gap'; rebuildCurve(); draw(); } });
  const btnTot = btn('Check: Total', () => { if (metric !== 'total') { metric = 'total'; rebuildCurve(); draw(); } });

  const btnStep = btn('Step (+1 replay)', () => {
    stopPlay();
    manualSteps++;
    runReplays(1);
    draw();
  }, 'go');
  const btnPlay = btn('Play', togglePlay);
  const btnBurst = btn('+500 replays', () => { runReplays(500); draw(); });
  const btnReset = btn('Reset replays', () => { stopPlay(); clearReplays(); draw(); });

  const speedVal = h('span', { class: 'sim-note', style: { margin: 0 } }, SPEED_LABELS[speedIdx]);
  const speedSlider = h('input', {
    type: 'range', min: 0, max: 4, step: 1, value: speedIdx,
    style: { width: '130px', accentColor: C.cyan },
    oninput: e => { speedIdx = +e.target.value; speedVal.textContent = SPEED_LABELS[speedIdx]; }
  });

  const btnNew = btn('New clinic (random)', () => {
    stopPlay();
    const pR = (rnd(1, 7)) / 20;
    const pN = (rnd(2, 11)) / 20;
    missed = new Set();
    for (let i = 0; i < 20; i++) if (Math.random() < pR) missed.add(i);
    for (let i = 20; i < 40; i++) if (Math.random() < pN) missed.add(i);
    clearReplays();
    draw();
  });
  const btnDef = btn('Clinic default (2 vs 8)', () => {
    stopPlay();
    missed = new Set(DEFAULT_MISS);
    clearReplays();
    draw();
  });

  function rebuildCurve() {
    // Re-anchor settling curve when switching metric mid-run
    if (replays === 0) { curvePts = []; return; }
    const share = (metric === 'gap' ? tailHitsGap : tailHitsTot) / replays;
    curvePts = [{ n: replays, share }];
  }

  function syncButtons() {
    btnA.className = 'sim-btn ' + (model === 'A' ? 'go' : '');
    btnB.className = 'sim-btn ' + (model === 'B' ? 'go' : '');
    btnGap.className = 'sim-btn ' + (metric === 'gap' ? 'go' : '');
    btnTot.className = 'sim-btn ' + (metric === 'total' ? 'go' : '');
    btnPlay.textContent = playing ? 'Pause' : 'Play';
    btnPlay.className = 'sim-btn ' + (playing ? 'go' : '');
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: posterior predictive check'),
    h('p', { class: 'sub' }, 'Tap any dot in the clinic record to toggle missed/kept. Choose Model A or Model B, then Step or Play to watch replays build up and check whether the clinic pattern looks typical.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' }, btnA, btnB, btnGap, btnTot),
        h('div', { class: 'sim-row' }, btnStep, btnPlay, btnBurst, btnReset),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed:'), speedSlider, speedVal),
        h('div', { class: 'sim-row' }, btnNew, btnDef)
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  const chal = challenges(ch, [
    {
      text: 'Under Model A and Check: Gap on the clinic data (2 vs 8), press Step at least 3 times, then run at least 200 replays.',
      check: st => st.model === 'A' && st.metric === 'gap' && st.manualSteps >= 3 && st.replays >= 200 && st.rem === 2 && st.no === 8,
      why: 'Only about 2 in 100 Model A replays reach a gap of 6 or more. The clinic’s reminder gap looks rare when both groups share one chance.'
    },
    {
      text: 'Keep Model A on the clinic data (2 vs 8), switch to Check: Total, and run at least 200 replays. Does the total of 10 look typical?',
      check: st => st.model === 'A' && st.metric === 'total' && st.replays >= 200 && st.rem === 2 && st.no === 8,
      why: 'Yes! The clinic’s 10 misses sit near the middle because Model A learned its chance from the total. Checking only the total hides the gap.'
    },
    {
      text: 'Switch to Model B and Check: Gap on the clinic data (2 vs 8), then run at least 200 replays.',
      check: st => st.model === 'B' && st.metric === 'gap' && st.replays >= 200 && st.rem === 2 && st.no === 8,
      why: 'About half of Model B’s replays reach 6 or more. Separate chances for each group let the model match the real gap.'
    },
    {
      text: 'Tap dots in the clinic grid so both groups have nearly the same misses (gap of 0 or 1), then run at least 200 Model A Gap replays.',
      check: st => st.model === 'A' && st.metric === 'gap' && st.replays >= 200 && Math.abs(st.gap) <= 1,
      why: 'Now Model A passes easily! A posterior predictive check only flags a model when the real data have a pattern the model cannot copy.'
    }
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = NARROW ? 690 : 525;
  const F = NARROW ? 1.12 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function toggleDot(idx) {
    stopPlay();
    if (missed.has(idx)) missed.delete(idx); else missed.add(idx);
    clearReplays();
    draw();
  }

  function draw() {
    syncButtons();
    const cc = clinicCounts();
    const k = [];
    const mono = 'Consolas, monospace';

    // --- PANEL 1: INTERACTIVE 40 CLINIC DOTS ---
    const gX0 = NARROW ? 92 : 92;
    const gDx = NARROW ? 27.5 : 23.5;
    const gYs = NARROW ? [34, 58, 94, 118] : [34, 56, 88, 110];
    const gR = NARROW ? 8.2 : 7.4;

    k.push(s('text', { x: 14, y: 15, fill: C.ink, 'font-size': 12.5 * F, 'font-weight': 700 },
      `CLINIC RECORD (tap dots) · total ${cc.total}, gap ${cc.gap}`));

    // Phone icon next to reminder rows
    const py = (gYs[0] + gYs[1]) / 2;
    k.push(
      s('rect', { x: 14, y: py - 10, width: 12, height: 20, rx: 2.5, fill: C.card, stroke: C.cyan, 'stroke-width': 1.5 }),
      s('rect', { x: 16.5, y: py - 7, width: 7, height: 11, fill: C.cyan, 'fill-opacity': 0.3 }),
      s('circle', { cx: 20, cy: py + 7, r: 1.2, fill: C.cyan }),
      s('text', { x: 31, y: py - 1, fill: C.cyan, 'font-size': 11 * F, 'font-weight': 700 }, 'Rem'),
      s('text', { x: 31, y: py + 12, fill: C.cyan, 'font-size': 10.5 * F, 'font-family': mono }, `${cc.rem}/20`)
    );
    const ny = (gYs[2] + gYs[3]) / 2;
    k.push(
      s('text', { x: 14, y: ny - 1, fill: C.muted, 'font-size': 11 * F, 'font-weight': 700 }, 'No rem'),
      s('text', { x: 14, y: ny + 12, fill: C.muted, 'font-size': 10.5 * F, 'font-family': mono }, `${cc.no}/20`)
    );

    for (let i = 0; i < 40; i++) {
      const r = Math.floor(i / 10), c = i % 10;
      const cx = gX0 + c * gDx, cy = gYs[r];
      const isM = missed.has(i);
      if (isM) k.push(s('circle', { cx, cy, r: gR * 1.55, fill: RED_GLOW, 'fill-opacity': 0.24 }));
      k.push(s('circle', {
        cx, cy, r: gR,
        fill: isM ? RED : C.ink, 'fill-opacity': isM ? 1 : 0.84,
        stroke: isM ? RED_GLOW : C.ink, 'stroke-width': 1
      }));
      // Generous invisible tap target
      const hit = s('circle', { cx, cy, r: gR + 4.5, fill: 'transparent', style: 'cursor:pointer' });
      hit.addEventListener('click', () => toggleDot(i));
      k.push(hit);
    }

    // --- PANEL 2: POSTERIOR CURVE(S) & LATEST DRAWN CHANCE ---
    const pX0 = NARROW ? 24 : 368;
    const pW = NARROW ? 352 : 316;
    const pY0 = NARROW ? 250 : 122;
    const pH = NARROW ? 78 : 88;
    k.push(s('text', { x: pX0, y: pY0 - pH - 18, fill: model === 'A' ? C.amber : C.cyan, 'font-size': 12.5 * F, 'font-weight': 700 },
      model === 'A' ? 'MODEL A POSTERIOR (1 shared chance)' : 'MODEL B POSTERIORS (2 group chances)'));
    k.push(s('line', { x1: pX0, x2: pX0 + pW, y1: pY0, y2: pY0, stroke: C.muted, 'stroke-width': 1.5 }));
    for (const tv of [0, 0.25, 0.5, 0.75, 1]) {
      const tx = pX0 + tv * pW;
      k.push(
        s('line', { x1: tx, x2: tx, y1: pY0, y2: pY0 + 5, stroke: C.muted }),
        s('text', { x: tx, y: pY0 + 16, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': mono }, String(tv))
      );
    }

    const curves = model === 'A'
      ? [{ a: 1 + cc.total, b: 1 + 40 - cc.total, col: C.amber, draw: lastDraw?.pA, lbl: 'shared' }]
      : [
          { a: 1 + cc.rem, b: 1 + 20 - cc.rem, col: C.cyan, draw: lastDraw?.pRem, lbl: 'rem' },
          { a: 1 + cc.no, b: 1 + 20 - cc.no, col: C.pink, draw: lastDraw?.pNo, lbl: 'no rem' }
        ];
    let peakAll = 1;
    const NSEG = 60;
    const samples = curves.map(cv => {
      const pts = [];
      for (let i = 0; i <= NSEG; i++) {
        const p = Math.min(0.999, Math.max(0.001, i / NSEG));
        const y = betaPdf(p, cv.a, cv.b);
        if (y > peakAll) peakAll = y;
        pts.push([p, y]);
      }
      return pts;
    });

    curves.forEach((cv, ci) => {
      const pts = samples[ci];
      const poly = [`${pX0},${pY0}`];
      const linePts = [];
      for (const [p, y] of pts) {
        const x = pX0 + p * pW;
        const yy = pY0 - (y / peakAll) * pH;
        poly.push(`${x.toFixed(1)},${yy.toFixed(1)}`);
        linePts.push(`${x.toFixed(1)},${yy.toFixed(1)}`);
      }
      poly.push(`${pX0 + pW},${pY0}`);
      k.push(
        s('polygon', { points: poly.join(' '), fill: cv.col, 'fill-opacity': 0.22 }),
        s('polyline', { points: linePts.join(' '), fill: 'none', stroke: cv.col, 'stroke-width': 2.5 })
      );
      if (cv.draw != null) {
        const dx = pX0 + cv.draw * pW;
        const dy = pY0 - (betaPdf(Math.min(0.999, Math.max(0.001, cv.draw)), cv.a, cv.b) / peakAll) * pH;
        k.push(
          s('line', { x1: dx, x2: dx, y1: pY0, y2: dy, stroke: cv.col, 'stroke-dasharray': '4 3', 'stroke-width': 1.5 }),
          s('circle', { cx: dx, cy: dy, r: 5, fill: cv.col, stroke: C.bg, 'stroke-width': 1.5 })
        );
      }
    });

    // --- PANEL 3: GROWING REPLICATED HISTOGRAM ---
    const hX0 = NARROW ? 30 : 42;
    const hW = NARROW ? 356 : 642;
    const hTop = NARROW ? 305 : 178;
    const hBot = NARROW ? 485 : 352;
    const hH = hBot - hTop;
    const isGap = metric === 'gap';
    const minV = isGap ? -12 : 0;
    const maxV = isGap ? 12 : 24;
    const span = maxV - minV + 1;
    const obsVal = isGap ? cc.gap : cc.total;
    const barCol = model === 'A' ? C.amber : C.cyan;
    const counts = [];
    for (let v = minV; v <= maxV; v++) counts.push(isGap ? gapHist[v + 20] : totHist[v]);
    const maxCnt = Math.max(1, ...counts);

    k.push(s('text', { x: hX0, y: hTop - 10, fill: C.ink, 'font-size': 12.5 * F, 'font-weight': 700 },
      `${model === 'A' ? 'MODEL A' : 'MODEL B'} REPLICATED ${isGap ? 'GAPS (no rem − rem)' : 'TOTAL MISSED'} · ${replays.toLocaleString()} replays`));

    const bw = hW / span;
    const xOf = v => hX0 + (v - minV + 0.5) * bw;

    // Horizontal guide lines
    for (let g = 0; g <= 2; g++) {
      const gy = hBot - (g / 2) * hH;
      k.push(s('line', { x1: hX0, x2: hX0 + hW, y1: gy, y2: gy, stroke: C.line }));
    }

    // Bars
    const tailShare = replays > 0 ? (isGap ? tailHitsGap : tailHitsTot) / replays : null;
    const isRare = isGap && tailShare != null && tailShare < 0.05;
    counts.forEach((cnt, idx) => {
      if (cnt <= 0) return;
      const v = minV + idx;
      const bh = Math.max(2, (cnt / maxCnt) * hH);
      const inTail = isGap ? (obsVal >= 0 ? v >= obsVal : v <= obsVal) : v >= obsVal;
      const fill = inTail ? (isRare ? RED : C.green) : barCol;
      k.push(s('rect', {
        x: hX0 + idx * bw + 1.5, y: hBot - bh, width: Math.max(2, bw - 3), height: bh,
        rx: 2, fill, 'fill-opacity': inTail ? 0.92 : 0.72
      }));
    });

    // Latest replay marker dot on axis
    if (lastDraw) {
      const lv = isGap ? lastDraw.gap : lastDraw.total;
      if (lv >= minV && lv <= maxV) {
        k.push(s('circle', { cx: xOf(lv), cy: hBot, r: 4.5, fill: C.ink, stroke: barCol, 'stroke-width': 2 }));
      }
    }

    // Observed clinic line + pill
    const obsClamped = Math.max(minV, Math.min(maxV, obsVal));
    const ox = xOf(obsClamped);
    const obsCol = isRare ? RED : C.green;
    const pillW = 94 * F;
    const pillX = Math.max(hX0, Math.min(hX0 + hW - pillW, ox - pillW / 2));
    k.push(
      s('line', { x1: ox, x2: ox, y1: hTop + 18, y2: hBot, stroke: obsCol, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }),
      s('rect', { x: pillX, y: hTop - 2, width: pillW, height: 21 * F, rx: 10.5 * F, fill: C.bg, stroke: obsCol, 'stroke-width': 1.5 }),
      s('text', { x: pillX + pillW / 2, y: hTop + 12.5 * F, fill: obsCol, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono },
        `CLINIC: ${obsVal}`)
    );

    // Axis ticks
    const ticks = isGap ? [-12, -8, -4, 0, 4, 8, 12] : [0, 5, 10, 15, 20, 24];
    for (const tv of ticks) {
      const tx = xOf(tv);
      k.push(
        s('line', { x1: tx, x2: tx, y1: hBot, y2: hBot + 5, stroke: C.muted }),
        s('text', { x: tx, y: hBot + 18, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': mono }, String(tv))
      );
    }

    // --- PANEL 4: SETTLING CURVE (TAIL SHARE VS REPLAYS) ---
    const cX0 = hX0, cW = hW;
    const cTop = NARROW ? 545 : 408;
    const cBot = NARROW ? 660 : 500;
    const cH = cBot - cTop;
    const tailLabel = isGap
      ? (obsVal >= 0 ? `gap ≥ ${obsVal}` : `gap ≤ ${obsVal}`)
      : `total ≥ ${obsVal}`;

    k.push(s('text', { x: cX0, y: cTop - 10, fill: C.ink, 'font-size': 12 * F, 'font-weight': 700 },
      `SETTLING CURVE: share of replays with ${tailLabel}`));

    for (const pct of [0, 0.5, 1]) {
      const gy = cBot - pct * cH;
      k.push(
        s('line', { x1: cX0, x2: cX0 + cW, y1: gy, y2: gy, stroke: C.line }),
        s('text', { x: cX0 - 6, y: gy + 4, fill: C.muted, 'font-size': 10 * F, 'text-anchor': 'end', 'font-family': mono }, `${Math.round(pct * 100)}%`)
      );
    }

    if (curvePts.length >= 2) {
      const maxN = Math.max(10, replays);
      const ptsStr = curvePts.map(pt => {
        const px = cX0 + (pt.n / maxN) * cW;
        const py2 = cBot - pt.share * cH;
        return `${px.toFixed(1)},${py2.toFixed(1)}`;
      }).join(' ');
      k.push(s('polyline', { points: ptsStr, fill: 'none', stroke: obsCol, 'stroke-width': 2.5 }));
      const lastPt = curvePts[curvePts.length - 1];
      const lx = cX0 + (lastPt.n / maxN) * cW;
      const ly = cBot - lastPt.share * cH;
      k.push(
        s('circle', { cx: lx, cy: ly, r: 4, fill: obsCol }),
        s('text', { x: Math.min(cX0 + cW - 4, lx - 6), y: Math.max(cTop + 14, ly - 8), fill: obsCol, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': mono },
          `${(lastPt.share * 100).toFixed(1)}%`)
      );
    } else if (replays === 0) {
      k.push(s('text', { x: cX0 + cW / 2, y: (cTop + cBot) / 2 + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' },
        'Press Step or Play to watch the share settle'));
    }

    k.push(s('text', { x: cX0 + cW, y: cBot + 16, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'end', 'font-family': mono },
      `replays: 0 → ${Math.max(10, replays).toLocaleString()}`));

    svg.replaceChildren(...k);

    // --- FORMULA BOX & EXPLANATION NOTE ---
    const pctStr = tailShare == null ? '—' : `${(tailShare * 100).toFixed(1)}%`;
    const drawLine = !lastDraw
      ? 'last replay: (press Step or Play)'
      : model === 'A'
        ? `draw p = ${fmt(lastDraw.pA)} → rem ${lastDraw.simRem}, no ${lastDraw.simNo}`
        : `draws: ${fmt(lastDraw.pRem)}, ${fmt(lastDraw.pNo)} → ${lastDraw.simRem}, ${lastDraw.simNo}`;
    const lastRes = !lastDraw
      ? '  total = —   gap = —'
      : `  total = ${lastDraw.total}   gap = ${lastDraw.gap}`;
    const hitCount = isGap ? tailHitsGap : tailHitsTot;

    fbox(box, [
      [`Model ${model} · ${replays.toLocaleString()} replays`, model === 'A' ? C.amber : C.cyan],
      `clinic: rem ${cc.rem}, no ${cc.no} → tot ${cc.total}, gap ${cc.gap}`,
      drawLine,
      lastRes,
      [`replays (${tailLabel}): ${hitCount.toLocaleString()} (${pctStr})`, tailShare == null ? C.muted : obsCol]
    ]);

    if (replays === 0) {
      note.textContent = 'Press Step to walk through one replay and see its drawn chance and counts, or press Play to run many replays.';
    } else if (!isGap && model === 'A') {
      note.textContent = 'Under Model A, the total missed almost always looks typical because Model A learned its shared chance from that total.';
    } else if (isRare) {
      note.textContent = `Only ${pctStr} of Model ${model} replays reach this gap. The clinic’s split looks rare under this model.`;
    } else {
      note.textContent = `${pctStr} of Model ${model} replays reach this value — the clinic’s pattern sits comfortably inside what this model produces.`;
    }

    chal.update({
      model, metric, replays, manualSteps,
      rem: cc.rem, no: cc.no, total: cc.total, gap: cc.gap
    });
  }

  draw();
  return () => stopPlay();
}

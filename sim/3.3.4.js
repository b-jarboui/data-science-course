// 3.3.4 Try it: stratified sampling.
// Draw random samples from City & Hill campuses, compare simple random vs stratified
// (weighted and unweighted), drag the campus split, and run many trials to watch the estimates pile up.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const ORANGE = '#fb923c';

  // Build an exact 1,000-student population whose campus means match cityMean and hillMean exactly
  function makePopulation(cityN, cityMean, hillMean) {
    const fillGroup = (n, mean, spread) => {
      const arr = [];
      for (let i = 0; i < n; i++) {
        // Symmetric triangular spread around mean
        const r = Math.round((Math.random() + Math.random() - 1) * spread);
        arr.push(Math.max(5, Math.min(60, mean + r)));
      }
      // Adjust gently so group mean is exact
      let diff = n * mean - arr.reduce((a, b) => a + b, 0);
      for (let k = 0; diff !== 0 && k < n * 4; k++) {
        const idx = k % n, step = diff > 0 ? 1 : -1;
        if (arr[idx] + step >= 5 && arr[idx] + step <= 60) { arr[idx] += step; diff -= step; }
      }
      return arr;
    };
    return {
      city: fillGroup(cityN, cityMean, 9),
      hill: fillGroup(1000 - cityN, hillMean, 9)
    };
  }

  let cityN = 600, cityMean = 20, hillMean = 45;
  let pop = makePopulation(cityN, cityMean, hillMean);
  let mode = 'strat'; // 'strat' | 'unweighted' | 'srs'
  let hist = { srs: [], strat: [], unweighted: [] };
  let isRandomPop = false;
  let anim = 0;

  // Tracking for challenges
  let unweightedDraws = 0, stratDrawsAt800 = 0, randomRuns = 0, randomStratSinceNew = 0;

  // Initial state matches the exact lesson example (City mean 22, Hill mean 42, weighted 30, plain middle 32)
  let lastDraw = {
    mode: 'strat',
    cityDots: new Set([2, 8, 14, 21, 27, 33, 39, 44, 50, 56]),
    hillDots: new Set([61, 65, 68, 72, 76, 80, 84, 89, 93, 97]),
    cMean: 22, hMean: 42, cCount: 10, hCount: 10, est: 30
  };

  const trueMean = () => (cityN * cityMean + (1000 - cityN) * hillMean) / 1000;
  const r1 = x => Math.round(x * 10) / 10;
  const r2 = x => Math.round(x * 100) / 100;

  const svg = s('svg', { viewBox: '0 0 700 476' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const splitLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const bStrat = btn('Stratified (weighted)', () => setMode('strat'), 'go');
  const bUnw = btn('Stratified (no weights)', () => setMode('unweighted'));
  const bSrs = btn('Simple random', () => setMode('srs'));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: stratified sampling'),
    h('p', { class: 'sub' }, 'Cyan dots are City students; orange dots are Hill students. Draw samples, drag the split between campuses, and watch where the estimates pile up.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, bStrat, bUnw, bSrs),
        h('div', { class: 'sim-row' },
          btn('Draw 1 sample', () => { cancelAnimationFrame(anim); drawOne(); draw(); }, 'go'),
          btn('Run 50 samples', () => runMany(50)),
          btn('New data (random)', () => newRandomData()),
          btn('Start again', () => resetAll())),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('City −100', () => setCityN(cityN - 100)),
          btn('City +100', () => setCityN(cityN + 100)),
          splitLabel)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Switch to “Stratified (no weights)” and draw a sample. Watch where the estimate lands compared to the dashed truth line.',
      check: st => st.unweightedDraws >= 1,
      why: 'Without weights, the smaller Hill campus counts as much as City, pulling the estimate away from the truth.'
    },
    {
      text: 'Run at least 50 samples with “Simple random”, then at least 50 with “Stratified (weighted)”. Which pile of estimates stays tighter around the truth?',
      check: st => st.srsCount >= 50 && st.stratCount >= 50,
      why: 'Stratified sampling stays much tighter because every sample keeps the exact right mix of both campuses.'
    },
    {
      text: 'Change City campus to 800 students (and Hill to 200), then draw a weighted stratified sample.',
      check: st => st.cityN === 800 && st.stratDrawsAt800 >= 1,
      why: 'With 800 City and 200 Hill, the weights become 8 and 2, so the weighted estimate follows the new truth line.'
    },
    {
      text: 'Press “New data (random)” and run 50 weighted stratified samples. Do the estimates still pile up on the dashed truth line?',
      check: st => st.randomRuns >= 1,
      why: 'Yes! Whatever the group sizes or trip times, weighting each group mean by its size aims straight at the true mean.'
    }
  ]);

  function updateModeButtons() {
    bStrat.className = 'sim-btn ' + (mode === 'strat' ? 'go' : '');
    bUnw.className = 'sim-btn ' + (mode === 'unweighted' ? 'go' : '');
    bSrs.className = 'sim-btn ' + (mode === 'srs' ? 'go' : '');
  }

  function setMode(m) {
    cancelAnimationFrame(anim);
    mode = m;
    updateModeButtons();
    if (lastDraw && lastDraw.mode !== 'srs' && m !== 'srs') {
      const wC = cityN / 100, wH = (1000 - cityN) / 100;
      const est = m === 'strat' ? (wC * lastDraw.cMean + wH * lastDraw.hMean) / 10 : (lastDraw.cMean + lastDraw.hMean) / 2;
      lastDraw = { ...lastDraw, mode: m, est };
    }
    draw();
  }

  function setCityN(n) {
    const clamped = Math.max(100, Math.min(900, Math.round(n / 100) * 100));
    if (clamped === cityN) return;
    cancelAnimationFrame(anim);
    cityN = clamped;
    pop = makePopulation(cityN, cityMean, hillMean);
    hist = { srs: [], strat: [], unweighted: [] };
    lastDraw = null;
    draw();
  }

  function newRandomData() {
    cancelAnimationFrame(anim);
    cityN = rnd(2, 8) * 100;
    if (cityN === 500) cityN = 700;
    cityMean = rnd(14, 24);
    hillMean = rnd(36, 48);
    pop = makePopulation(cityN, cityMean, hillMean);
    hist = { srs: [], strat: [], unweighted: [] };
    isRandomPop = true;
    randomStratSinceNew = 0;
    lastDraw = null;
    drawOne();
    draw();
  }

  function resetAll() {
    cancelAnimationFrame(anim);
    cityN = 600; cityMean = 20; hillMean = 45;
    pop = makePopulation(cityN, cityMean, hillMean);
    mode = 'strat';
    hist = { srs: [], strat: [], unweighted: [] };
    isRandomPop = false;
    randomStratSinceNew = 0;
    lastDraw = {
      mode: 'strat',
      cityDots: new Set([2, 8, 14, 21, 27, 33, 39, 44, 50, 56]),
      hillDots: new Set([61, 65, 68, 72, 76, 80, 84, 89, 93, 97]),
      cMean: 22, hMean: 42, cCount: 10, hCount: 10, est: 30
    };
    updateModeButtons();
    draw();
  }

  // Pick k unique indices from [0, n)
  function pickIndices(n, k) {
    const picked = new Set();
    while (picked.size < k) picked.add(Math.floor(Math.random() * n));
    return [...picked];
  }

  function drawOne() {
    const wC = cityN / 100, wH = (1000 - cityN) / 100;
    if (mode === 'srs') {
      const idx = pickIndices(1000, 20);
      let sum = 0, cCount = 0, hCount = 0;
      const cDots = new Set(), hDots = new Set();
      idx.forEach(i => {
        if (i < cityN) { sum += pop.city[i]; cCount++; cDots.add(Math.floor(i / 10)); }
        else { sum += pop.hill[i - cityN]; hCount++; hDots.add(Math.floor(i / 10)); }
      });
      const est = sum / 20;
      hist.srs.push(est);
      lastDraw = { mode: 'srs', cityDots: cDots, hillDots: hDots, cCount, hCount, est };
    } else {
      const cIdx = pickIndices(cityN, 10);
      const hIdx = pickIndices(1000 - cityN, 10);
      const cMean = cIdx.reduce((a, i) => a + pop.city[i], 0) / 10;
      const hMean = hIdx.reduce((a, i) => a + pop.hill[i], 0) / 10;
      const cDots = new Set(cIdx.map(i => Math.floor(i / 10)));
      const hDots = new Set(hIdx.map(i => Math.floor((cityN + i) / 10)));
      const est = mode === 'strat' ? (wC * cMean + wH * hMean) / 10 : (cMean + hMean) / 2;
      hist[mode].push(est);
      lastDraw = { mode, cityDots: cDots, hillDots: hDots, cMean, hMean, cCount: 10, hCount: 10, est };
      if (mode === 'unweighted') unweightedDraws++;
      if (mode === 'strat' && cityN === 800) stratDrawsAt800++;
      if (mode === 'strat' && isRandomPop) {
        randomStratSinceNew++;
        if (randomStratSinceNew >= 50) randomRuns++;
      }
    }
  }

  function runMany(count) {
    cancelAnimationFrame(anim);
    let left = count;
    const step = () => {
      const batch = Math.min(left, 3);
      for (let i = 0; i < batch; i++) drawOne();
      left -= batch;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} 476`);

  const POP_TOP = 26, ROW_STEP = 13.5, SPLIT_GAP = 22;
  const DOT_X0 = NARROW ? 132 : 185, DOT_STEP = NARROW ? 26 : 36;
  const AX0 = NARROW ? 24 : 36, AX1 = VW - (NARROW ? 18 : 26);

  // Dragging the split divider directly in SVG changes City / Hill campus size
  let draggingSplit = false;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const splitY = () => POP_TOP + (cityN / 100) * ROW_STEP + SPLIT_GAP / 2 - ROW_STEP * 0.4;

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y >= POP_TOP - 8 && p.y <= POP_TOP + 10 * ROW_STEP + SPLIT_GAP + 14) {
      if (Math.abs(p.y - splitY()) < 22) {
        draggingSplit = true;
        svg.setPointerCapture(e.pointerId);
      }
    }
  });
  svg.addEventListener('pointermove', e => {
    if (!draggingSplit) return;
    const p = toSvg(e);
    const rows = Math.max(1, Math.min(9, Math.round((p.y - POP_TOP - SPLIT_GAP / 2) / ROW_STEP)));
    setCityN(rows * 100);
  });
  svg.addEventListener('pointerup', () => { draggingSplit = false; });

  function draw() {
    const tm = trueMean(), cityRows = cityN / 100, hillN = 1000 - cityN;
    const wC = cityRows, wH = 10 - cityRows;
    const k = [];

    // --- Top: 100-dot population split into City (top) and Hill (bottom) ---
    const cTop = POP_TOP - 8, cBot = POP_TOP + (cityRows - 1) * ROW_STEP + 8;
    const hTop = POP_TOP + cityRows * ROW_STEP + SPLIT_GAP - 8;
    const hBot = POP_TOP + 9 * ROW_STEP + SPLIT_GAP + 8;
    const boxX = DOT_X0 - 14, boxW = 9 * DOT_STEP + 28;

    k.push(
      s('rect', { x: boxX, y: cTop, width: boxW, height: cBot - cTop, rx: 8, fill: C.cyan, 'fill-opacity': 0.06, stroke: C.cyan, 'stroke-opacity': 0.5 }),
      s('rect', { x: boxX, y: hTop, width: boxW, height: hBot - hTop, rx: 8, fill: ORANGE, 'fill-opacity': 0.06, stroke: ORANGE, 'stroke-opacity': 0.5 })
    );

    // Campus labels on the left
    const cMidY = (cTop + cBot) / 2, hMidY = (hTop + hBot) / 2;
    k.push(
      s('text', { x: boxX - 10, y: cMidY - 2, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `City: ${cityN}`),
      s('text', { x: boxX - 10, y: cMidY + 13, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `avg ${cityMean} min`),
      s('text', { x: boxX - 10, y: hMidY - 2, fill: ORANGE, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `Hill: ${hillN}`),
      s('text', { x: boxX - 10, y: hMidY + 13, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `avg ${hillMean} min`)
    );

    // Draggable split divider between strata
    const sy = (cBot + hTop) / 2;
    k.push(
      s('line', { x1: boxX, x2: boxX + boxW, y1: sy, y2: sy, stroke: C.muted, 'stroke-dasharray': '5 5', 'stroke-width': 1.5 }),
      s('rect', { x: boxX + boxW / 2 - 46, y: sy - 8, width: 92, height: 16, rx: 8, fill: C.card, stroke: C.muted, style: 'cursor:ns-resize' }),
      s('text', { x: boxX + boxW / 2, y: sy + 3.5, fill: C.muted, 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'cursor:ns-resize;user-select:none' }, '⇅ drag split')
    );

    // 100 student dots (each dot = 10 students)
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), c = i % 10;
      const isCity = r < cityRows;
      const cx = DOT_X0 + c * DOT_STEP;
      const cy = POP_TOP + r * ROW_STEP + (isCity ? 0 : SPLIT_GAP);
      const col = isCity ? C.cyan : ORANGE;
      const sampled = lastDraw && (isCity ? lastDraw.cityDots.has(i) : lastDraw.hillDots.has(i));
      if (sampled) {
        k.push(s('circle', { cx, cy, r: 6.2, fill: col, 'fill-opacity': 0.22, stroke: col, 'stroke-width': 1.5 }));
      }
      k.push(s('circle', {
        cx, cy,
        r: sampled ? 4.2 : 3.2,
        fill: lastDraw ? (sampled ? col : C.muted) : col,
        'fill-opacity': lastDraw ? (sampled ? 1 : 0.28) : 0.85
      }));
    }

    // Right-side count tags on wide screens
    if (!NARROW && lastDraw) {
      k.push(
        s('text', { x: boxX + boxW + 12, y: cMidY + 4, fill: C.cyan, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, `${lastDraw.cCount} picked`),
        s('text', { x: boxX + boxW + 12, y: hMidY + 4, fill: ORANGE, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, `${lastDraw.hCount} picked`)
      );
    }

    // --- Bottom: 3 aligned estimate histograms on shared minutes axis ---
    const minV = 10, maxV = 50;
    const xOf = v => AX0 + Math.max(0, Math.min(1, (v - minV) / (maxV - minV))) * (AX1 - AX0);
    const lanes = [
      { key: 'srs', label: 'Simple random (20)', col: C.violet, top: 214, bot: 274 },
      { key: 'strat', label: 'Stratified · weighted (10 + 10)', col: C.green, top: 286, bot: 346 },
      { key: 'unweighted', label: 'Stratified · NO weights', col: C.pink, top: 358, bot: 418 }
    ];

    const binW = 1; // 1-minute bins across 10..50
    const nBins = (maxV - minV) / binW;

    lanes.forEach(ln => {
      const active = mode === ln.key;
      k.push(s('rect', {
        x: AX0, y: ln.top, width: AX1 - AX0, height: ln.bot - ln.top, rx: 6,
        fill: active ? '#ffffff' : C.bg, 'fill-opacity': active ? 0.045 : 0.45,
        stroke: active ? ln.col : C.line, 'stroke-opacity': active ? 0.7 : 0.7
      }));
      const vals = hist[ln.key];
      const counts = new Array(nBins).fill(0);
      vals.forEach(v => {
        const b = Math.max(0, Math.min(nBins - 1, Math.floor((v - minV) / binW)));
        counts[b]++;
      });
      const maxC = Math.max(5, ...counts);
      const bw = (AX1 - AX0) / nBins;
      const maxH = ln.bot - ln.top - 18;
      counts.forEach((cnt, b) => {
        if (!cnt) return;
        const bh = (cnt / maxC) * maxH;
        k.push(s('rect', {
          x: AX0 + b * bw + 0.8, y: ln.bot - bh - 1,
          width: Math.max(2, bw - 1.6), height: bh, rx: 1.5,
          fill: ln.col, 'fill-opacity': 0.8
        }));
      });
      k.push(
        s('text', { x: AX0 + 8, y: ln.top + 14, fill: active ? ln.col : C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, ln.label),
        s('text', { x: AX1 - 8, y: ln.top + 14, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, vals.length ? `${vals.length} runs` : '')
      );
      if (lastDraw && lastDraw.mode === ln.key) {
        const ex = xOf(lastDraw.est);
        k.push(s('circle', { cx: ex, cy: ln.bot - 4, r: 5.5, fill: ln.col, stroke: C.bg, 'stroke-width': 1.8 }));
      }
    });

    // Shared minutes axis
    const AY = 432;
    k.push(s('line', { x1: AX0, x2: AX1, y1: AY, y2: AY, stroke: C.muted, 'stroke-width': 2 }));
    for (let g = minV; g <= maxV; g += 5) {
      const gx = xOf(g), major = g % 10 === 0;
      k.push(s('line', { x1: gx, x2: gx, y1: AY, y2: AY + (major ? 7 : 4), stroke: C.muted }));
      if (major) {
        k.push(s('text', { x: gx, y: AY + 22, fill: C.muted, 'font-size': 12.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g));
      }
    }
    k.push(s('text', { x: AX1, y: AY + 38, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'minutes'));

    // Dashed amber truth line through all 3 lanes
    const tx = xOf(tm);
    const pillW = 86 * F;
    const pillX = Math.max(AX0, Math.min(AX1 - pillW, tx - pillW / 2));
    k.push(
      s('line', { x1: tx, x2: tx, y1: 204, y2: AY, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
      s('rect', { x: pillX, y: 186, width: pillW, height: 20, rx: 10, fill: C.bg, stroke: C.amber }),
      s('text', { x: pillX + pillW / 2, y: 200, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `TRUE ${fmt(r1(tm))}`)
    );

    svg.replaceChildren(...k);

    // Formula box
    if (!lastDraw) {
      fbox(box, [
        [`City: ${cityN} (weight ${wC})`, C.cyan],
        [`Hill: ${hillN} (weight ${wH})`, ORANGE],
        [`true mean = ${fmt(r2(tm))} min`, C.amber],
        'Press “Draw 1 sample” to begin.'
      ]);
    } else if (lastDraw.mode === 'strat') {
      const p1 = r1(wC * lastDraw.cMean), p2 = r1(wH * lastDraw.hMean);
      fbox(box, [
        [`City (10): mean = ${fmt(r1(lastDraw.cMean))}`, C.cyan],
        [`Hill (10): mean = ${fmt(r1(lastDraw.hMean))}`, ORANGE],
        `weights: ${wC} and ${wH} (out of 10)`,
        [`(${wC}×${fmt(r1(lastDraw.cMean))} + ${wH}×${fmt(r1(lastDraw.hMean))}) ÷ 10`, C.ink],
        [`= (${fmt(p1)} + ${fmt(p2)}) ÷ 10 = ${fmt(r2(lastDraw.est))}`, C.green],
        [`true mean = ${fmt(r2(tm))}`, C.amber]
      ]);
    } else if (lastDraw.mode === 'unweighted') {
      const gap = r2(lastDraw.est - tm);
      const sign = gap >= 0 ? '+' : '−';
      fbox(box, [
        [`City (10): mean = ${fmt(r1(lastDraw.cMean))}`, C.cyan],
        [`Hill (10): mean = ${fmt(r1(lastDraw.hMean))}`, ORANGE],
        ['plain middle (no weights):', C.pink],
        [`(${fmt(r1(lastDraw.cMean))} + ${fmt(r1(lastDraw.hMean))}) ÷ 2 = ${fmt(r2(lastDraw.est))}`, C.pink],
        [`true mean = ${fmt(r2(tm))} (off by ${sign}${fmt(Math.abs(gap))})`, C.amber]
      ]);
    } else {
      const gap = r2(lastDraw.est - tm);
      const sign = gap >= 0 ? '+' : '−';
      fbox(box, [
        'Simple random sample of 20:',
        [`${lastDraw.cCount} City + ${lastDraw.hCount} Hill`, C.ink],
        [`sample mean = ${fmt(r2(lastDraw.est))}`, C.violet],
        [`true mean   = ${fmt(r2(tm))} (off by ${sign}${fmt(Math.abs(gap))})`, C.amber]
      ]);
    }

    note.textContent = mode === 'strat'
      ? 'Weighted stratified sampling keeps 10 from each campus and lets each campus count according to its real size.'
      : mode === 'unweighted'
        ? 'Forgetting the weights treats both campuses as 50% each, pulling the estimate toward the smaller campus.'
        : 'Simple random sampling can get unlucky mixes of City and Hill students, so its estimates spread wider.';

    splitLabel.textContent = `Split: ${cityN} City (wt ${wC}) · ${hillN} Hill (wt ${wH})`;

    chal.update({
      unweightedDraws,
      srsCount: hist.srs.length,
      stratCount: hist.strat.length,
      cityN,
      stratDrawsAt800,
      randomRuns
    });
  }

  updateModeButtons();
  draw();
  return () => cancelAnimationFrame(anim);
}

// 14.3.8 Try it: UMAP building a map from neighbors.
// Interactive iterative optimization: Step, Play/Pause with speed slider, Reset,
// New start, New random data, live dot dragging, learning rate & k-neighbors knobs,
// live loss-vs-iteration curve, and 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  // Shared chapter 14.3 teaching teas (exact scores)
  const LESSON_TEAS = [
    { id: 'A', group: 0, scores: [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3] },
    { id: 'B', group: 0, scores: [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3] },
    { id: 'C', group: 1, scores: [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7] },
    { id: 'D', group: 1, scores: [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7] },
  ];
  const LESSON_START = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const GROUP_COLORS = [C.cyan, C.amber, C.violet];

  // --- simulation state ----------------------------------------------------
  let teas = LESSON_TEAS;
  let isRandomData = false;
  let kNeighbors = 1;
  let lr = 0.25;
  let speed = 5; // steps per second
  let showForces = true;
  let sel = 3; // follow Tea D by default

  let pts = LESSON_START.map(p => p.slice());
  let adj = [];
  let step = 0;
  let lossHist = [];
  let lastStep = null; // { idx, oldPos, newPos, dx, dy, oldLoss, newLoss }
  let playing = false;
  let timer = null;

  // Challenge tracking
  let manualSteps = 0;
  let lossJumpedUp = false;

  // --- math helpers --------------------------------------------------------
  function sqDistScores(a, b) {
    let sum = 0;
    for (let m = 0; m < a.length; m++) { const d = a[m] - b[m]; sum += d * d; }
    return sum;
  }

  // Symmetric k-NN graph: closest neighbor gets strength 1; further neighbors (rank >= 2)
  // get smaller strength so learners see both disconnected k=1 and weighted k>1 graphs.
  function buildGraph(list, k) {
    const n = list.length;
    const W = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      const order = [];
      for (let j = 0; j < n; j++) {
        if (i !== j) order.push({ j, d2: sqDistScores(list[i].scores, list[j].scores) });
      }
      order.sort((a, b) => a.d2 - b.d2 || a.j - b.j);
      for (let r = 0; r < Math.min(k, order.length); r++) {
        const j = order[r].j;
        const w = r === 0 ? 1 : 0.45;
        W[i][j] = Math.max(W[i][j], w);
        W[j][i] = Math.max(W[j][i], w);
      }
    }
    return W;
  }

  function evalUMAP(positions, W) {
    const n = positions.length;
    const gx = new Array(n).fill(0), gy = new Array(n).fill(0);
    const pullX = new Array(n).fill(0), pullY = new Array(n).fill(0);
    const pushX = new Array(n).fill(0), pushY = new Array(n).fill(0);
    let loss = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[i][0] - positions[j][0];
        const dy = positions[i][1] - positions[j][1];
        const d2 = dx * dx + dy * dy;
        const w = W[i][j];
        const q = 1 / (1 + d2);
        if (w > 0) loss -= w * Math.log(Math.max(1e-12, q));
        if (w < 1) loss -= (1 - w) * Math.log(Math.max(1e-12, d2 / (1 + d2)));
        const d2Safe = Math.max(1e-3, d2);
        const attr = 2 * w * q;
        const rep = -2 * (1 - w) / (d2Safe * (1 + d2));
        const coef = attr + rep;
        gx[i] += coef * dx; gy[i] += coef * dy;
        gx[j] -= coef * dx; gy[j] -= coef * dy;
        // Force directions (-grad) for visualization
        pullX[i] -= attr * dx; pullY[i] -= attr * dy;
        pullX[j] += attr * dx; pullY[j] += attr * dy;
        pushX[i] -= rep * dx; pushY[i] -= rep * dy;
        pushX[j] += rep * dx; pushY[j] += rep * dy;
      }
    }
    return { loss, gx, gy, pullX, pullY, pushX, pushY };
  }

  function makeRandomTeas() {
    const nGroups = 3, perGroup = 2, out = [];
    const names = ['A', 'B', 'C', 'D', 'E', 'F'];
    const centers = Array.from({ length: nGroups }, () =>
      Array.from({ length: 12 }, () => rnd(1, 9))
    );
    // Ensure groups are well separated in attribute space
    centers[0] = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2].map(v => Math.max(0, Math.min(10, v + rnd(-1, 1))));
    centers[1] = [2, 2, 2, 2, 2, 2, 8, 8, 8, 8, 8, 8].map(v => Math.max(0, Math.min(10, v + rnd(-1, 1))));
    centers[2] = [8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3].map(v => Math.max(0, Math.min(10, v + rnd(-1, 1))));
    for (let g = 0; g < nGroups; g++) {
      for (let m = 0; m < perGroup; m++) {
        const idx = g * perGroup + m;
        const scores = centers[g].map(v => Math.max(0, Math.min(10, v + rnd(-1, 1))));
        out.push({ id: names[idx], group: g, scores });
      }
    }
    return out;
  }

  function randomPositions(n) {
    return Array.from({ length: n }, () => [
      Math.round((Math.random() * 2.4 - 1.2) * 100) / 100,
      Math.round((Math.random() * 2.0 - 1.0) * 100) / 100,
    ]);
  }

  // --- DOM setup -----------------------------------------------------------
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const F = NARROW ? 1.2 : 1;
  const MVW = NARROW ? 420 : 620, MVH = NARROW ? 360 : 390;
  const LVW = NARROW ? 420 : 420, LVH = NARROW ? 185 : 195;

  const mapSvg = s('svg', { viewBox: `0 0 ${MVW} ${MVH}` });
  const lossSvg = s('svg', { viewBox: `0 0 ${LVW} ${LVH}` });
  const statusRow = h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.55rem' } });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const playBtn = btn('Play', () => togglePlay(), 'go');
  const lrVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } });
  const lrSlider = h('input', {
    type: 'range', min: '0.05', max: '1.60', step: '0.05', value: String(lr),
    style: { width: '130px', accentColor: C.amber },
    oninput: e => { lr = +e.target.value; draw(); }
  });
  const spVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } });
  const spSlider = h('input', {
    type: 'range', min: '1', max: '15', step: '1', value: String(speed),
    style: { width: '105px', accentColor: C.cyan },
    oninput: e => { speed = +e.target.value; if (playing) { stopPlay(); startPlay(); } draw(); }
  });
  const kVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.green, fontWeight: 700 } });
  const kSlider = h('input', {
    type: 'range', min: '1', max: '3', step: '1', value: String(kNeighbors),
    style: { width: '90px', accentColor: C.green },
    oninput: e => {
      kNeighbors = +e.target.value;
      adj = buildGraph(teas, kNeighbors);
      lossHist = [evalUMAP(pts, adj).loss];
      step = 0; lastStep = null;
      draw();
    }
  });
  const forceBtn = btn('Forces: ON', () => {
    showForces = !showForces;
    forceBtn.textContent = showForces ? 'Forces: ON' : 'Forces: OFF';
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: UMAP from neighbors'),
    h('p', { class: 'sub' }, 'Glowing lines connect close neighbors. Press Step or Play to pull connected dots together and push unconnected dots apart — or drag any dot yourself.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        statusRow,
        mapSvg,
        h('div', { class: 'sim-row' },
          btn('Step', () => doStep(true), 'go'),
          playBtn,
          btn('Reset', () => resetLesson()),
          btn('New start', () => newStart()),
          btn('New data (random)', () => newRandomData()),
          forceBtn),
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem' } }, 'Step size:', lrSlider, lrVal),
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem' } }, 'Neighbors k:', kSlider, kVal),
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem' } }, 'Speed:', spSlider, spVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' },
          h('div', { style: { font: '700 .85rem/1.3 Consolas, monospace', color: C.pink, marginBottom: '.35rem' } }, 'LOSS VS ITERATION'),
          lossSvg),
        h('div', { class: 'sim-card' }, ch)))));

  // --- challenges (self-checking) ------------------------------------------
  const chal = challenges(ch, [
    {
      text: 'Press Step three times to follow tea D, then press Play until the loss drops below 0.50.',
      check: st => st.manualSteps >= 3 && st.loss < 0.50,
      why: 'Yes! Each step balances pull and push. On the four teas, ten steps bring the loss down to 0.418.'
    },
    {
      text: 'Press Reset, raise Step size above 1.0, and press Step or Play. Can you make the loss jump UP instead of down?',
      check: st => st.lr > 1.0 && st.lossJumpedUp,
      why: 'Too big a step overshoots the low-loss spot, so dots bounce around and the loss rises instead of falling.'
    },
    {
      text: 'Press Reset, keep Neighbors k = 1, and run past 25 steps. Watch the gap between {A, B} and {C, D}.',
      check: st => !st.isRandomData && st.k === 1 && st.step >= 25 && st.gap > 3.4,
      why: 'Because no line links the two pairs, they keep pushing apart even after each neighborhood has settled.'
    },
    {
      text: 'Press “New data (random)”, predict where the connected pairs will gather, then press Play to watch UMAP settle.',
      check: st => st.isRandomData && st.step >= 12 && st.loss < st.startLoss * 0.65,
      why: 'UMAP works on any dataset: connected neighbors pull into groups while unconnected dots spread out.'
    },
  ]);

  // --- iteration controls --------------------------------------------------
  function stopPlay() {
    playing = false;
    if (timer !== null) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function startPlay() {
    if (playing) return;
    playing = true;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => doStep(false), Math.max(50, Math.round(1000 / speed)));
  }
  function togglePlay() { playing ? stopPlay() : startPlay(); }

  function doStep(isManual) {
    const before = evalUMAP(pts, adj);
    const oldPos = pts[sel].slice();
    const next = pts.map((p, i) => {
      const nx = p[0] - lr * before.gx[i];
      const ny = p[1] - lr * before.gy[i];
      // Clamp extreme divergence so dots remain visible when learner breaks learning rate
      return [Math.max(-6, Math.min(6, nx)), Math.max(-6, Math.min(6, ny))];
    });
    const after = evalUMAP(next, adj);
    pts = next;
    step += 1;
    lossHist.push(after.loss);
    if (lossHist.length > 200) lossHist.shift();
    if (isManual) manualSteps += 1;
    if (after.loss > before.loss + 0.02) lossJumpedUp = true;
    lastStep = {
      idx: sel,
      oldPos,
      newPos: pts[sel].slice(),
      dx: pts[sel][0] - oldPos[0],
      dy: pts[sel][1] - oldPos[1],
      oldLoss: before.loss,
      newLoss: after.loss,
    };
    draw();
  }

  function resetLesson() {
    stopPlay();
    teas = LESSON_TEAS;
    isRandomData = false;
    kNeighbors = 1; kSlider.value = '1';
    lr = 0.25; lrSlider.value = '0.25';
    sel = 3;
    pts = LESSON_START.map(p => p.slice());
    adj = buildGraph(teas, kNeighbors);
    step = 0; lastStep = null;
    lossHist = [evalUMAP(pts, adj).loss];
    draw();
  }

  function newStart() {
    stopPlay();
    pts = randomPositions(teas.length);
    step = 0; lastStep = null;
    lossHist = [evalUMAP(pts, adj).loss];
    draw();
  }

  function newRandomData() {
    stopPlay();
    teas = makeRandomTeas();
    isRandomData = true;
    sel = 0;
    pts = randomPositions(teas.length);
    adj = buildGraph(teas, kNeighbors);
    step = 0; lastStep = null;
    lossHist = [evalUMAP(pts, adj).loss];
    draw();
  }

  // --- map viewport & pointer dragging -------------------------------------
  function mapScale() {
    let maxAbs = 2.1;
    for (const [x, y] of pts) maxAbs = Math.max(maxAbs, Math.abs(x) + 0.45, Math.abs(y) + 0.45);
    const pad = 34;
    const sc = Math.min((MVW - 2 * pad) / (2 * maxAbs), (MVH - 2 * pad) / (2 * maxAbs));
    return { cx: MVW / 2, cy: MVH / 2, sc, span: maxAbs };
  }
  const toSvgPt = (x, y, vp) => [vp.cx + x * vp.sc, vp.cy - y * vp.sc];
  const fromSvgPt = (sx, sy, vp) => [(sx - vp.cx) / vp.sc, (vp.cy - sy) / vp.sc];

  let dragging = -1;
  let dragVp = null;
  const pointerToSvg = e => {
    const p = mapSvg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(mapSvg.getScreenCTM().inverse());
  };

  mapSvg.addEventListener('pointerdown', e => {
    const vp = mapScale();
    const p = pointerToSvg(e);
    let best = -1, bestD = 30;
    pts.forEach(([x, y], i) => {
      const [sx, sy] = toSvgPt(x, y, vp);
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    stopPlay();
    sel = best; dragging = best; dragVp = vp;
    mapSvg.setPointerCapture(e.pointerId);
    onDrag(e);
  });

  function onDrag(e) {
    if (dragging < 0 || !dragVp) return;
    const p = pointerToSvg(e);
    const [mx, my] = fromSvgPt(p.x, p.y, dragVp);
    pts[dragging] = [
      Math.max(-4.5, Math.min(4.5, mx)),
      Math.max(-4.5, Math.min(4.5, my)),
    ];
    lastStep = null;
    lossHist[lossHist.length - 1] = evalUMAP(pts, adj).loss;
    draw();
  }
  mapSvg.addEventListener('pointermove', onDrag);
  mapSvg.addEventListener('pointerup', () => { dragging = -1; dragVp = null; });
  mapSvg.addEventListener('pointercancel', () => { dragging = -1; dragVp = null; });

  // --- SVG drawing helpers -------------------------------------------------
  function svgArrow(x1, y1, x2, y2, col, sw = 2.6) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 4) return [];
    const ux = dx / len, uy = dy / len, px = -uy, py = ux, tip = 8;
    return [
      s('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round' }),
      s('line', { x1: x2, y1: y2, x2: x2 - ux * tip + px * 4.5, y2: y2 - uy * tip + py * 4.5, stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round' }),
      s('line', { x1: x2, y1: y2, x2: x2 - ux * tip - px * 4.5, y2: y2 - uy * tip - py * 4.5, stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round' }),
    ];
  }

  function drawMap(ev) {
    const vp = mapScale();
    const els = [];
    // Background grid & axes
    const stepGrid = vp.span > 3.5 ? 2 : 1;
    const maxTick = Math.floor(vp.span);
    for (let g = -maxTick; g <= maxTick; g += stepGrid) {
      const [gx] = toSvgPt(g, 0, vp);
      const [, gy] = toSvgPt(0, g, vp);
      const isAxis = g === 0;
      els.push(s('line', { x1: gx, x2: gx, y1: 12, y2: MVH - 12, stroke: isAxis ? '#3c4c7a' : C.line, 'stroke-width': isAxis ? 1.8 : 1 }));
      els.push(s('line', { x1: 12, x2: MVW - 12, y1: gy, y2: gy, stroke: isAxis ? '#3c4c7a' : C.line, 'stroke-width': isAxis ? 1.8 : 1 }));
      if (!isAxis) {
        els.push(s('text', { x: gx, y: vp.cy + 16, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g));
        els.push(s('text', { x: vp.cx - 8, y: gy + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
      }
    }

    // Glowing neighbor edges
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const w = adj[i][j];
        if (w <= 0) continue;
        const [x1, y1] = toSvgPt(pts[i][0], pts[i][1], vp);
        const [x2, y2] = toSvgPt(pts[j][0], pts[j][1], vp);
        const col = w >= 0.9 ? GROUP_COLORS[teas[i].group % 3] : C.violet;
        els.push(s('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': w >= 0.9 ? 11 : 6, 'stroke-opacity': w >= 0.9 ? 0.22 : 0.14, 'stroke-linecap': 'round' }));
        els.push(s('line', {
          x1, y1, x2, y2, stroke: col,
          'stroke-width': w >= 0.9 ? 3.2 : 1.8,
          'stroke-dasharray': w >= 0.9 ? null : '6 5',
          'stroke-linecap': 'round'
        }));
      }
    }

    // Pull & push force arrows on selected tea
    if (showForces) {
      const [sx, sy] = toSvgPt(pts[sel][0], pts[sel][1], vp);
      const scaleF = 44;
      const clampLen = (vx, vy, maxL) => {
        const l = Math.hypot(vx, vy);
        return l > maxL ? [vx * maxL / l, vy * maxL / l] : [vx, vy];
      };
      const [plx, ply] = clampLen(ev.pullX[sel] * scaleF, -ev.pullY[sel] * scaleF, 68);
      const [psx, psy] = clampLen(ev.pushX[sel] * scaleF, -ev.pushY[sel] * scaleF, 68);
      els.push(...svgArrow(sx, sy, sx + plx, sy + ply, C.cyan, 2.8));
      els.push(...svgArrow(sx, sy, sx + psx, sy + psy, C.pink, 2.8));
    }

    // Dots & tea letters (always visible; slight label stagger when pairs sit right on top)
    pts.forEach(([x, y], i) => {
      const [sx, sy] = toSvgPt(x, y, vp);
      const col = GROUP_COLORS[teas[i].group % 3];
      if (i === sel) {
        els.push(s('circle', { cx: sx, cy: sy, r: 21, fill: 'none', stroke: C.amber, 'stroke-width': 2.2, 'stroke-dasharray': '5 4' }));
      }
      els.push(s('circle', { cx: sx, cy: sy, r: 16, fill: col, 'fill-opacity': 0.18 }));
      els.push(s('circle', { cx: sx, cy: sy, r: 8.5, fill: col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor: grab' }));
      const dyLab = (i % 2 === 0) ? 24 : -16;
      els.push(s('text', {
        x: sx, y: sy + dyLab, fill: C.ink, 'font-size': 15 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events: none'
      }, teas[i].id));
    });

    // Small legend inside map corner
    if (showForces) {
      els.push(s('text', { x: 16, y: 22, fill: C.cyan, 'font-size': 12 * F, 'font-family': 'Consolas' }, '→ pull (connected)'));
      els.push(s('text', { x: 16, y: 38, fill: C.pink, 'font-size': 12 * F, 'font-family': 'Consolas' }, '→ push (not connected)'));
    }
    mapSvg.replaceChildren(...els);
  }

  function drawLoss() {
    const padL = 44, padR = 16, padT = 16, padB = 30;
    const w = LVW - padL - padR, hh = LVH - padT - padB;
    const maxY = Math.max(4.2, ...lossHist) * 1.05;
    const maxX = Math.max(10, lossHist.length - 1);
    const sx = i => padL + (i / maxX) * w;
    const sy = v => padT + hh - (Math.min(maxY, v) / maxY) * hh;
    const els = [];

    // Gridlines
    const yTicks = [0, Math.round(maxY / 2), Math.round(maxY)];
    for (const v of yTicks) {
      const y = sy(v);
      els.push(s('line', { x1: padL, x2: padL + w, y1: y, y2: y, stroke: C.line }));
      els.push(s('text', { x: padL - 7, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, v));
    }
    els.push(s('line', { x1: padL, x2: padL, y1: padT, y2: padT + hh, stroke: C.muted, 'stroke-width': 1.5 }));
    els.push(s('line', { x1: padL, x2: padL + w, y1: padT + hh, y2: padT + hh, stroke: C.muted, 'stroke-width': 1.5 }));
    for (const xT of [0, Math.round(maxX / 2), maxX]) {
      const x = sx(xT);
      els.push(s('text', { x, y: padT + hh + 17, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, xT));
    }

    // Curve
    if (lossHist.length > 1) {
      const d = lossHist.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
      els.push(s('path', { d, fill: 'none', stroke: C.green, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
    }
    const lastI = lossHist.length - 1;
    const lastCol = lastStep && lastStep.newLoss > lastStep.oldLoss + 0.005 ? C.pink : C.green;
    els.push(s('circle', { cx: sx(lastI), cy: sy(lossHist[lastI]), r: 4.5, fill: lastCol }));
    lossSvg.replaceChildren(...els);
  }

  function f3(x) { return (x >= 0 ? '' : '−') + Math.abs(x).toFixed(3); }
  function s3(x) { return (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(3); }

  function draw() {
    const ev = evalUMAP(pts, adj);
    const curLoss = ev.loss;

    lrVal.textContent = lr.toFixed(2);
    kVal.textContent = String(kNeighbors);
    spVal.textContent = `${speed}/s`;

    statusRow.replaceChildren(
      pill(`STEP ${step}`, C.cyan),
      pill(`LOSS ${curLoss.toFixed(3)}`, lastStep && lastStep.newLoss > lastStep.oldLoss + 0.005 ? C.pink : C.green),
      pill(`FOLLOWING TEA ${teas[sel].id}`, C.amber)
    );

    drawMap(ev);
    drawLoss();

    // Formula box: exact step numbers (old, change, new, loss) or live similarity readout
    const tid = teas[sel].id;
    if (lastStep && lastStep.idx === sel) {
      const up = lastStep.newLoss > lastStep.oldLoss + 0.001;
      fbox(box, [
        `step ${step}  (tea ${tid})`,
        `old:    (${f3(lastStep.oldPos[0])}, ${f3(lastStep.oldPos[1])})`,
        [`change: (${s3(lastStep.dx)}, ${s3(lastStep.dy)})`, C.amber],
        [`new:    (${f3(lastStep.newPos[0])}, ${f3(lastStep.newPos[1])})`, C.cyan],
        [`loss:   ${lastStep.oldLoss.toFixed(3)} → ${lastStep.newLoss.toFixed(3)}`, up ? C.pink : C.green],
      ]);
      note.textContent = up
        ? 'The loss jumped UP! Try lowering the step size so each move stays controlled.'
        : 'Pull from connected neighbors and push from unconnected dots moved every dot to lower the loss.';
    } else {
      // Find one connected and one unconnected pair involving sel for similarity readout
      let connJ = -1, unconnJ = -1;
      for (let j = 0; j < pts.length; j++) {
        if (j === sel) continue;
        if (adj[sel][j] > 0 && connJ < 0) connJ = j;
        if (adj[sel][j] === 0 && unconnJ < 0) unconnJ = j;
      }
      const simPair = (i, j) => {
        const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
        const d2 = dx * dx + dy * dy;
        return { d2, sim: 1 / (1 + d2) };
      };
      const lines = [
        `step ${step}  ·  tea ${tid} at (${f3(pts[sel][0])}, ${f3(pts[sel][1])})`,
        ['sim = 1 ÷ (1 + map dist²)', C.muted],
      ];
      if (connJ >= 0) {
        const { sim } = simPair(sel, connJ);
        lines.push([`connected ${tid}–${teas[connJ].id}:     sim = ${sim.toFixed(2)}`, C.cyan]);
      }
      if (unconnJ >= 0) {
        const { sim } = simPair(sel, unconnJ);
        lines.push([`not connected ${tid}–${teas[unconnJ].id}: sim = ${sim.toFixed(2)}`, C.pink]);
      }
      lines.push([`loss = ${curLoss.toFixed(3)}`, C.amber]);
      fbox(box, lines);
      note.textContent = 'Drag any dot to see the loss change live, or press Step to watch one UMAP update.';
    }

    // Gap between {A,B} center and {C,D} center on lesson data
    let gap = 0;
    if (!isRandomData && pts.length === 4) {
      const m1x = (pts[0][0] + pts[1][0]) / 2, m1y = (pts[0][1] + pts[1][1]) / 2;
      const m2x = (pts[2][0] + pts[3][0]) / 2, m2y = (pts[2][1] + pts[3][1]) / 2;
      gap = Math.hypot(m2x - m1x, m2y - m1y);
    }

    chal.update({
      step,
      manualSteps,
      loss: curLoss,
      startLoss: lossHist[0] || curLoss,
      lr,
      k: kNeighbors,
      lossJumpedUp,
      gap,
      isRandomData,
    });
  }

  adj = buildGraph(teas, kNeighbors);
  lossHist = [evalUMAP(pts, adj).loss];
  draw();
  return () => stopPlay();
}

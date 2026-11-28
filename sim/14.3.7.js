// 14.3.7 Try it: t-SNE keeping neighbors close on a map.
// Iterative learning: Step, Play/Pause with speed slider, Reset, New start, New data (random),
// drag any dot, step size & neighbor width knobs, live loss-vs-iteration curve, 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;

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
  let sigma = 4;   // neighbor width (Gaussian bandwidth on the tasting scores)
  let lr = 1;      // step size
  let speed = 5;   // steps per second
  let showForces = true;
  let sel = 3;     // follow tea D by default

  let pts = LESSON_START.map(p => p.slice());
  let Pm = [];
  let step = 0;
  let lossHist = [];
  let lastStep = null; // { idx, oldPos, newPos, dx, dy, oldLoss, newLoss }
  let playing = false;
  let timer = null;
  let manualSteps = 0;

  // --- math helpers --------------------------------------------------------
  const sqDist = (a, b) => a.reduce((sum, v, m) => sum + (v - b[m]) ** 2, 0);

  // Score shares: Gaussian neighbors with width sigma, then symmetric shares that add to 1
  function buildP(list, sg) {
    const n = list.length;
    const cond = list.map((a, i) => {
      const d = list.map((b, j) => i === j ? Infinity : sqDist(a.scores, b.scores));
      const dmin = Math.min(...d);
      const w = d.map(v => v === Infinity ? 0 : Math.exp(-(v - dmin) / (2 * sg * sg)));
      const z = w.reduce((x, y) => x + y, 0);
      return w.map(v => v / z);
    });
    return cond.map((r, i) => r.map((v, j) => (v + cond[j][i]) / (2 * n)));
  }

  // Map weights 1 / (1 + d²), map shares q, loss (how poorly q matches p) and the move for every dot
  function evalTSNE(y, Pq) {
    const n = y.length;
    let Z = 0;
    const W = y.map((a, i) => y.map((b, j) => {
      if (i === j) return 0;
      const w = 1 / (1 + (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2); Z += w; return w;
    }));
    let loss = 0;
    const gx = new Array(n).fill(0), gy = new Array(n).fill(0);
    const pullX = new Array(n).fill(0), pullY = new Array(n).fill(0);
    const pushX = new Array(n).fill(0), pushY = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const q = W[i][j] / Z, p = Pq[i][j];
      if (p > 1e-12) loss += p * Math.log(p / Math.max(1e-12, q));
      const dx = y[i][0] - y[j][0], dy = y[i][1] - y[j][1];
      const c = 4 * (p - q) * W[i][j];
      gx[i] += c * dx; gy[i] += c * dy;
      pullX[i] -= 4 * p * W[i][j] * dx; pullY[i] -= 4 * p * W[i][j] * dy;
      pushX[i] += 4 * q * W[i][j] * dx; pushY[i] += 4 * q * W[i][j] * dy;
    }
    return { loss, gx, gy, pullX, pullY, pushX, pushY, W, Z };
  }

  function makeRandomTeas() {
    const names = ['A', 'B', 'C', 'D', 'E', 'F'], out = [];
    const base = [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 8, 8, 8, 8, 8, 8],
      [8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
    ];
    const clamp = v => Math.max(0, Math.min(10, v));
    base.forEach((b, g) => {
      const center = b.map(v => clamp(v + rnd(-1, 1)));
      for (let m = 0; m < 2; m++) out.push({ id: names[g * 2 + m], group: g, scores: center.map(v => clamp(v + rnd(-1, 1))) });
    });
    return out;
  }
  const randomPositions = n => Array.from({ length: n }, () => [
    Math.round((Math.random() * 2.4 - 1.2) * 100) / 100,
    Math.round((Math.random() * 2.0 - 1.0) * 100) / 100,
  ]);

  // --- DOM setup -----------------------------------------------------------
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const F = NARROW ? 1.2 : 1;
  const MVW = NARROW ? 420 : 620, MVH = NARROW ? 360 : 390;
  const LVW = 420, LVH = NARROW ? 185 : 195;

  const mapSvg = s('svg', { viewBox: `0 0 ${MVW} ${MVH}` });
  const lossSvg = s('svg', { viewBox: `0 0 ${LVW} ${LVH}` });
  const statusRow = h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.55rem' } });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const playBtn = btn('Play', () => togglePlay(), 'go');
  const mono = col => ({ fontFamily: 'Consolas, monospace', color: col, fontWeight: 700 });
  const lrVal = h('span', { style: mono(C.amber) });
  const lrSlider = h('input', {
    type: 'range', min: '0.1', max: '3', step: '0.1', value: String(lr),
    style: { width: '130px', accentColor: C.amber },
    oninput: e => { lr = +e.target.value; draw(); }
  });
  const sgVal = h('span', { style: mono(C.green) });
  const sgSlider = h('input', {
    type: 'range', min: '1', max: '20', step: '1', value: String(sigma),
    style: { width: '110px', accentColor: C.green },
    oninput: e => { sigma = +e.target.value; Pm = buildP(teas, sigma); restartCurve(); draw(); }
  });
  const spVal = h('span', { style: mono(C.cyan) });
  const spSlider = h('input', {
    type: 'range', min: '1', max: '15', step: '1', value: String(speed),
    style: { width: '105px', accentColor: C.cyan },
    oninput: e => { speed = +e.target.value; if (playing) { stopPlay(); startPlay(); } draw(); }
  });
  const forceBtn = btn('Forces: ON', () => {
    showForces = !showForces;
    forceBtn.textContent = showForces ? 'Forces: ON' : 'Forces: OFF';
    draw();
  });
  const knob = (label, slider, val) => h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem' } }, label, slider, val);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: t-SNE keeps neighbors close'),
    h('p', { class: 'sub' }, 'Glowing lines join teas with similar tasting scores. Press Step or Play: close neighbors pull together, and dots that sit misleadingly close are pushed apart. You can also drag any dot.'),
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
          knob('Step size:', lrSlider, lrVal),
          knob('Neighbor width:', sgSlider, sgVal),
          knob('Speed:', spSlider, spVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' },
          h('div', { style: { font: '700 .85rem/1.3 Consolas, monospace', color: C.pink, marginBottom: '.35rem' } }, 'LOSS VS ITERATION'),
          lossSvg),
        h('div', { class: 'sim-card' }, ch)))));

  // --- challenges (self-checking) ------------------------------------------
  const chal = challenges(ch, [
    {
      text: 'Press Step three times and compare tea D with the video: (1.390, 0.566). Then press Play until the loss is below 0.10.',
      check: st => !st.isRandomData && st.manualSteps >= 3 && st.loss < 0.10,
      why: 'Yes! Every step moves each dot a little to lower the loss, and the steps get smaller as the map settles.'
    },
    {
      text: 'Press Reset, set Step size to 0.2 or less, and run 20 steps. Does the loss get as low as the video’s 0.142 after step 3?',
      check: st => !st.isRandomData && st.lr <= 0.2 && st.step >= 20 && st.loss > 0.142,
      why: 'No: with tiny steps the dots barely move, so 20 small steps do less than 3 normal ones.'
    },
    {
      text: 'Predict first: will the space between pair {A, B} and pair {C, D} shrink or grow? Press Reset, then Play past step 20.',
      check: st => !st.isRandomData && st.step >= 20 && st.gap > 2.6,
      why: 'It grows: t-SNE keeps the pairs tight and pushes the groups apart, so the gap size is not an exact measure of taste.'
    },
    {
      text: 'Press “New data (random)”, guess which dots will pair up, then press Play until the loss is less than half where it started.',
      check: st => st.isRandomData && st.step >= 5 && st.loss < st.startLoss * 0.5,
      why: 'It works on any data: teas with similar scores end up together on the map, whatever the start.'
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

  function restartCurve() {
    step = 0; lastStep = null;
    lossHist = [evalTSNE(pts, Pm).loss];
  }

  function doStep(isManual) {
    const before = evalTSNE(pts, Pm);
    const oldPos = pts[sel].slice();
    pts = pts.map((p, i) => [
      Math.max(-8, Math.min(8, p[0] - lr * before.gx[i])),
      Math.max(-8, Math.min(8, p[1] - lr * before.gy[i])),
    ]);
    const after = evalTSNE(pts, Pm);
    step += 1;
    lossHist.push(after.loss);
    if (lossHist.length > 200) lossHist.shift();
    if (isManual) manualSteps += 1;
    lastStep = {
      idx: sel, oldPos, newPos: pts[sel].slice(),
      dx: pts[sel][0] - oldPos[0], dy: pts[sel][1] - oldPos[1],
      oldLoss: before.loss, newLoss: after.loss,
    };
    draw();
  }

  function resetLesson() {
    stopPlay();
    teas = LESSON_TEAS; isRandomData = false;
    sigma = 4; sgSlider.value = '4';
    sel = 3;
    pts = LESSON_START.map(p => p.slice());
    Pm = buildP(teas, sigma);
    restartCurve();
    draw();
  }
  function newStart() {
    stopPlay();
    pts = randomPositions(teas.length);
    restartCurve();
    draw();
  }
  function newRandomData() {
    stopPlay();
    teas = makeRandomTeas(); isRandomData = true;
    sel = 0;
    pts = randomPositions(teas.length);
    Pm = buildP(teas, sigma);
    restartCurve();
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

  let dragging = -1, dragVp = null;
  const pointerToSvg = e => {
    const p = mapSvg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(mapSvg.getScreenCTM().inverse());
  };
  mapSvg.addEventListener('pointerdown', e => {
    const vp = mapScale(), p = pointerToSvg(e);
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
    pts[dragging] = [Math.max(-4.5, Math.min(4.5, mx)), Math.max(-4.5, Math.min(4.5, my))];
    lastStep = null;
    lossHist[lossHist.length - 1] = evalTSNE(pts, Pm).loss;
    draw();
  }
  mapSvg.addEventListener('pointermove', onDrag);
  mapSvg.addEventListener('pointerup', () => { dragging = -1; dragVp = null; });
  mapSvg.addEventListener('pointercancel', () => { dragging = -1; dragVp = null; });

  // --- SVG drawing ---------------------------------------------------------
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
    const vp = mapScale(), els = [];
    const stepGrid = vp.span > 3.5 ? 2 : 1, maxTick = Math.floor(vp.span);
    for (let g = -maxTick; g <= maxTick; g += stepGrid) {
      const [gx] = toSvgPt(g, 0, vp), [, gy] = toSvgPt(0, g, vp), isAxis = g === 0;
      els.push(s('line', { x1: gx, x2: gx, y1: 12, y2: MVH - 12, stroke: isAxis ? '#3c4c7a' : C.line, 'stroke-width': isAxis ? 1.8 : 1 }));
      els.push(s('line', { x1: 12, x2: MVW - 12, y1: gy, y2: gy, stroke: isAxis ? '#3c4c7a' : C.line, 'stroke-width': isAxis ? 1.8 : 1 }));
      if (!isAxis) {
        els.push(s('text', { x: gx, y: vp.cy + 16, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g));
        els.push(s('text', { x: vp.cx - 8, y: gy + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
      }
    }

    // Glowing links: thickness = share from the tasting scores
    let maxP = 0;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) maxP = Math.max(maxP, Pm[i][j]);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = Pm[i][j] / (maxP || 1);
      if (a < 0.04) continue;
      const [x1, y1] = toSvgPt(pts[i][0], pts[i][1], vp), [x2, y2] = toSvgPt(pts[j][0], pts[j][1], vp);
      const strong = a > 0.5;
      const col = strong && teas[i].group === teas[j].group ? GROUP_COLORS[teas[i].group % 3] : C.violet;
      if (strong) els.push(s('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': 11, 'stroke-opacity': 0.22, 'stroke-linecap': 'round' }));
      els.push(s('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': 1 + 2.4 * a, 'stroke-opacity': 0.35 + 0.6 * a, 'stroke-dasharray': strong ? null : '6 5', 'stroke-linecap': 'round' }));
    }

    // Pull & push on the followed tea
    if (showForces) {
      const [sx, sy] = toSvgPt(pts[sel][0], pts[sel][1], vp), scaleF = 160;
      const clampLen = (vx, vy, maxL) => { const l = Math.hypot(vx, vy); return l > maxL ? [vx * maxL / l, vy * maxL / l] : [vx, vy]; };
      const [plx, ply] = clampLen(ev.pullX[sel] * scaleF, -ev.pullY[sel] * scaleF, 68);
      const [psx, psy] = clampLen(ev.pushX[sel] * scaleF, -ev.pushY[sel] * scaleF, 68);
      els.push(...svgArrow(sx, sy, sx + plx, sy + ply, C.cyan, 2.8));
      els.push(...svgArrow(sx, sy, sx + psx, sy + psy, C.pink, 2.8));
    }

    // Dots & tea letters (always visible)
    pts.forEach(([x, y], i) => {
      const [sx, sy] = toSvgPt(x, y, vp), col = GROUP_COLORS[teas[i].group % 3];
      if (i === sel) els.push(s('circle', { cx: sx, cy: sy, r: 21, fill: 'none', stroke: C.amber, 'stroke-width': 2.2, 'stroke-dasharray': '5 4' }));
      els.push(s('circle', { cx: sx, cy: sy, r: 16, fill: col, 'fill-opacity': 0.18 }));
      els.push(s('circle', { cx: sx, cy: sy, r: 8.5, fill: col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor: grab' }));
      els.push(s('text', { x: sx, y: sy + (i % 2 === 0 ? 24 : -16), fill: C.ink, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events: none' }, teas[i].id));
    });

    if (showForces) {
      els.push(s('text', { x: 16, y: 22, fill: C.cyan, 'font-size': 12 * F, 'font-family': 'Consolas' }, '→ pull (close neighbors)'));
      els.push(s('text', { x: 16, y: 38, fill: C.pink, 'font-size': 12 * F, 'font-family': 'Consolas' }, '→ push (misleadingly close)'));
    }
    mapSvg.replaceChildren(...els);
  }

  function drawLoss() {
    const padL = 44, padR = 16, padT = 16, padB = 30;
    const w = LVW - padL - padR, hh = LVH - padT - padB;
    const maxY = Math.max(0.6, ...lossHist) * 1.05, maxX = Math.max(20, lossHist.length - 1);
    const sx = i => padL + (i / maxX) * w;
    const sy = v => padT + hh - (Math.min(maxY, v) / maxY) * hh;
    const els = [];
    for (const v of [0, maxY / 2, maxY]) {
      const y = sy(v);
      els.push(s('line', { x1: padL, x2: padL + w, y1: y, y2: y, stroke: C.line }));
      els.push(s('text', { x: padL - 7, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, v.toFixed(2)));
    }
    els.push(s('line', { x1: padL, x2: padL, y1: padT, y2: padT + hh, stroke: C.muted, 'stroke-width': 1.5 }));
    els.push(s('line', { x1: padL, x2: padL + w, y1: padT + hh, y2: padT + hh, stroke: C.muted, 'stroke-width': 1.5 }));
    for (const xT of [0, Math.round(maxX / 2), maxX]) {
      els.push(s('text', { x: sx(xT), y: padT + hh + 17, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, xT));
    }
    if (lossHist.length > 1) {
      const d = lossHist.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
      els.push(s('path', { d, fill: 'none', stroke: C.green, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
    }
    const lastI = lossHist.length - 1;
    const up = lastStep && lastStep.newLoss > lastStep.oldLoss + 0.0005;
    els.push(s('circle', { cx: sx(lastI), cy: sy(lossHist[lastI]), r: 4.5, fill: up ? C.pink : C.green }));
    lossSvg.replaceChildren(...els);
  }

  const f3 = x => (x >= 0 ? '' : '−') + Math.abs(x).toFixed(3);
  const s3 = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(3);

  function draw() {
    const ev = evalTSNE(pts, Pm), curLoss = ev.loss;
    lrVal.textContent = lr.toFixed(1);
    sgVal.textContent = String(sigma);
    spVal.textContent = `${speed}/s`;
    const up = lastStep && lastStep.newLoss > lastStep.oldLoss + 0.0005;

    statusRow.replaceChildren(
      pill(`STEP ${step}`, C.cyan),
      pill(`LOSS ${curLoss.toFixed(3)}`, up ? C.pink : C.green),
      pill(`FOLLOWING TEA ${teas[sel].id}`, C.amber)
    );
    drawMap(ev);
    drawLoss();

    const tid = teas[sel].id;
    if (lastStep && lastStep.idx === sel) {
      fbox(box, [
        `step ${step}  (tea ${tid})`,
        `old:    (${f3(lastStep.oldPos[0])}, ${f3(lastStep.oldPos[1])})`,
        [`change: (${s3(lastStep.dx)}, ${s3(lastStep.dy)})`, C.amber],
        [`new:    (${f3(lastStep.newPos[0])}, ${f3(lastStep.newPos[1])})`, C.cyan],
        [`loss:   ${lastStep.oldLoss.toFixed(3)} → ${lastStep.newLoss.toFixed(3)}`, up ? C.pink : C.green],
      ]);
      note.textContent = up
        ? 'The loss went UP on this step. Try a smaller step size so each move stays controlled.'
        : 'Every dot moved a little: pulled toward close neighbors, pushed away from dots that sat misleadingly close.';
    } else {
      // closest and farthest tea by tasting scores, with score share vs map share
      let near = -1, far = -1;
      for (let j = 0; j < pts.length; j++) {
        if (j === sel) continue;
        if (near < 0 || Pm[sel][j] > Pm[sel][near]) near = j;
        if (far < 0 || Pm[sel][j] < Pm[sel][far]) far = j;
      }
      const q = j => ev.W[sel][j] / ev.Z;
      fbox(box, [
        `step ${step} · tea ${tid} at (${f3(pts[sel][0])}, ${f3(pts[sel][1])})`,
        ['map weight = 1 ÷ (1 + distance²)', C.muted],
        [`${tid}–${teas[near].id}: scores ${Pm[sel][near].toFixed(3)} · map ${q(near).toFixed(3)}`, C.cyan],
        [`${tid}–${teas[far].id}: scores ${Pm[sel][far].toFixed(3)} · map ${q(far).toFixed(3)}`, C.pink],
        [`loss = ${curLoss.toFixed(3)}`, C.amber],
      ]);
      note.textContent = 'Shares from the scores vs shares on the map: the loss is small when they match. Drag a dot to see it change, or press Step.';
    }

    // gap between the {A, B} and {C, D} pair centers on the lesson teas
    let gap = 0;
    if (!isRandomData && pts.length === 4) {
      const m1x = (pts[0][0] + pts[1][0]) / 2, m1y = (pts[0][1] + pts[1][1]) / 2;
      const m2x = (pts[2][0] + pts[3][0]) / 2, m2y = (pts[2][1] + pts[3][1]) / 2;
      gap = Math.hypot(m2x - m1x, m2y - m1y);
    }
    chal.update({ step, manualSteps, loss: curLoss, startLoss: lossHist[0] || curLoss, lr, sigma, gap, isRandomData });
  }

  Pm = buildP(teas, sigma);
  restartCurve();
  draw();
  return () => stopPlay();
}

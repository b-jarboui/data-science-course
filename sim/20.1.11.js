// 20.1.11 Try it: mixed precision & loss scaling (iterative weight training).
// Step through real IEEE-754 16-bit vs mixed-precision updates, adjust learning rate and loss scale,
// watch the number line, 16-bit gradient range, and loss-versus-iteration curve update live.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;

  // Real IEEE-754 binary16 (FP16) quantizer:
  // smallest positive subnormal = 2^-24 (~5.96e-8), max finite = 65504, step near 1 = 2^-10 (~0.000977).
  const FP16_MIN = Math.pow(2, -24);
  const FP16_NORM = Math.pow(2, -14);
  const FP16_MAX = 65504;
  function toFP16(x) {
    if (!Number.isFinite(x)) return x;
    const sgn = x < 0 ? -1 : 1, a = Math.abs(x);
    if (a === 0) return 0;
    if (a > FP16_MAX) return sgn * Infinity;
    if (a < FP16_NORM) return sgn * Math.round(a / FP16_MIN) * FP16_MIN;
    const exp = Math.floor(Math.log2(a));
    const step = Math.pow(2, exp - 10);
    return sgn * Math.round(a / step) * step;
  }
  function fp16Step(w) {
    const a = Math.max(FP16_NORM, Math.abs(w));
    return Math.pow(2, Math.floor(Math.log2(a)) - 10);
  }

  function fmtDec(x, minDec = 4) {
    if (!Number.isFinite(x)) return 'overflow!';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a < 1e-4) return x.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
    const d = Math.max(minDec, a < 0.01 ? 8 : 4);
    return x.toFixed(d).replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  }

  // Scenarios
  const SCENARIOS = {
    small: () => ({
      id: 'small', label: 'Lesson example (w = 1, +0.0001)',
      w0: 1.0, target: 1.002, gMag: 0.001, defaultLr: 0.1, defaultScale: 1,
      viewMin: 0.9996, viewMax: 1.0024, minDec: 4, isRandom: false
    }),
    tiny: () => ({
      id: 'tiny', label: 'Tiny gradient (0.00000001)',
      w0: 0.0001, target: 0.0001001, gMag: 1e-8, defaultLr: 1.0, defaultScale: 1,
      viewMin: 0.00009998, viewMax: 0.00010014, minDec: 8, isRandom: false
    }),
    random: () => {
      const tinyKind = Math.random() < 0.45;
      if (tinyKind) {
        const gMag = rnd(1, 3) * 1e-8;
        const w0 = rnd(1, 5) * 0.0001;
        const target = +(w0 + gMag * rnd(8, 12)).toFixed(9);
        const span = target - w0;
        return {
          id: 'random', label: 'Random tiny-gradient task',
          w0, target, gMag, defaultLr: 1.0, defaultScale: 1,
          viewMin: w0 - span * 0.2, viewMax: target + span * 0.25, minDec: 8, isRandom: true
        };
      }
      const w0 = rnd(1, 3);
      const st16 = fp16Step(w0);
      const stepWanted = +(st16 * (0.12 + Math.random() * 0.18)).toFixed(4);
      const gMag = +(stepWanted * 10).toFixed(4);
      const target = +(w0 + stepWanted * rnd(12, 18)).toFixed(4);
      const span = target - w0;
      return {
        id: 'random', label: 'Random small-update task',
        w0, target, gMag, defaultLr: 0.1, defaultScale: 1,
        viewMin: w0 - span * 0.18, viewMax: target + span * 0.22, minDec: 4, isRandom: true
      };
    }
  };

  let sc = SCENARIOS.small();
  let mode = 'fp16';        // 'fp16' | 'mixed' | 'fp32'
  let lr = sc.defaultLr;
  let scale = sc.defaultScale;
  let speed = 3;            // steps per second
  let w = sc.w0;
  let stepCount = 0;
  let lossHist = [2.0];
  let lastInfo = null;
  let timer = 0;
  let playing = false;

  const lossAt = val => {
    if (!Number.isFinite(val)) return Infinity;
    const dist0 = Math.max(1e-12, Math.abs(sc.target - sc.w0));
    return (Math.abs(val - sc.target) / dist0) * 2.0;
  };
  const trueGradAt = val => {
    const err = val - sc.target;
    const knee = sc.gMag * sc.defaultLr;
    if (Math.abs(err) >= knee) return Math.sign(err) * sc.gMag;
    return (err / knee) * sc.gMag;
  };

  function resetRun(keepKnobs = true) {
    stopPlay();
    if (!keepKnobs) { lr = sc.defaultLr; scale = sc.defaultScale; }
    w = mode === 'fp16' ? toFP16(sc.w0) : sc.w0;
    stepCount = 0;
    lossHist = [lossAt(w)];
    lastInfo = null;
    syncControls();
    draw();
  }

  function doStep() {
    if (!Number.isFinite(w)) { stopPlay(); return; }
    const oldW = w;
    const gTrue = trueGradAt(oldW);
    let gUsed = gTrue, gScaled = gTrue * scale, gStored16 = gScaled;
    let underflow = false, overflow = false, roundedBack = false;

    if (mode === 'fp32') {
      gUsed = gTrue;
    } else {
      gStored16 = toFP16(gScaled);
      if (!Number.isFinite(gStored16)) {
        overflow = true;
        gUsed = gStored16;
      } else {
        if (gTrue !== 0 && gStored16 === 0) underflow = true;
        gUsed = gStored16 / scale; // restored in 32-bit
      }
    }

    const rawDelta = -lr * gUsed;
    const rawNewW = oldW + rawDelta;
    let newW = rawNewW;
    if (mode === 'fp16') {
      newW = toFP16(rawNewW);
      if (Math.abs(rawDelta) > 0 && newW === oldW && !underflow && !overflow) roundedBack = true;
    }

    w = newW;
    stepCount++;
    const newLoss = lossAt(w);
    lossHist.push(Number.isFinite(newLoss) ? Math.min(8, newLoss) : 8);
    lastInfo = { oldW, gTrue, gScaled, gStored16, gUsed, rawDelta, rawNewW, newW, newLoss, underflow, overflow, roundedBack };
    if (overflow || stepCount >= 80) stopPlay();
    draw();
  }

  function stopPlay() {
    playing = false;
    if (timer) { clearInterval(timer); timer = 0; }
    if (playBtn) playBtn.textContent = '▶ Play';
  }
  function togglePlay() {
    if (playing) { stopPlay(); return; }
    playing = true;
    playBtn.textContent = '❚❚ Pause';
    timer = setInterval(doStep, Math.round(1000 / speed));
  }
  function setSpeed(v) {
    speed = v;
    if (playing) { clearInterval(timer); timer = setInterval(doStep, Math.round(1000 / speed)); }
  }

  // UI elements
  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const iterPill = pill('STEP 0', C.cyan);
  const memPill = pill('2 MB (16-BIT)', C.amber);

  const playBtn = btn('▶ Play', togglePlay, 'go');
  const modeBtns = {};
  const scaleBtns = {};
  const lrSlider = h('input', { type: 'range', min: 0, max: 100, step: 1, value: 30, style: { width: '130px', accentColor: C.cyan } });
  const lrLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const spdSlider = h('input', { type: 'range', min: 1, max: 12, step: 1, value: speed, style: { width: '90px', accentColor: C.cyan } });
  const spdLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });

  // Learning rate maps cleanly around sc.defaultLr (from 0.25x to 12x defaultLr)
  const lrFromSlider = v => {
    const mult = Math.pow(10, -0.6 + (v / 100) * 1.8); // ~0.25x .. 15.8x
    return +(sc.defaultLr * mult).toPrecision(2);
  };
  const sliderFromLr = val => {
    const mult = Math.max(0.25, Math.min(15.8, val / sc.defaultLr));
    return Math.round(((Math.log10(mult) + 0.6) / 1.8) * 100);
  };
  lrSlider.addEventListener('input', () => { lr = lrFromSlider(+lrSlider.value); syncControls(); draw(); });
  spdSlider.addEventListener('input', () => { setSpeed(+spdSlider.value); syncControls(); });

  const setMode = m => { mode = m; resetRun(true); };
  const setScale = scVal => { scale = scVal; syncControls(); draw(); };
  const loadScenario = key => { sc = SCENARIOS[key](); resetRun(false); };

  const SCALES = [1, 64, 1024, 65536];

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: mixed precision & loss scaling'),
    h('p', { class: 'sub' }, 'Step through weight updates one by one. Compare Pure 16-bit with Mixed precision, and use Loss scaling to save tiny gradients from turning into zero.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.6rem', justifyContent: 'space-between' } }, iterPill, memPill),
        svg,
        h('div', { class: 'sim-row' },
          btn('Step (+1)', doStep, 'go'),
          playBtn,
          btn('Reset', () => resetRun(true)),
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed:'),
          spdSlider, spdLabel
        ),
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Precision:'),
          modeBtns.fp16 = btn('Pure 16-bit', () => setMode('fp16')),
          modeBtns.mixed = btn('Mixed precision', () => setMode('mixed')),
          modeBtns.fp32 = btn('Full 32-bit', () => setMode('fp32'))
        ),
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Loss scale:'),
          ...SCALES.map(sv => (scaleBtns[sv] = btn(sv.toLocaleString() + '×', () => setScale(sv)))),
          h('span', { class: 'sim-note', style: { margin: 0, marginLeft: '.3rem' } }, 'Learning rate:'),
          lrSlider, lrLabel
        ),
        h('div', { class: 'sim-row' },
          btn('Lesson example (w=1)', () => loadScenario('small')),
          btn('Tiny gradient (1e−8)', () => loadScenario('tiny')),
          btn('New data (random)', () => loadScenario('random'))
        )
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  function syncControls() {
    for (const [k, b] of Object.entries(modeBtns)) b.className = 'sim-btn' + (mode === k ? ' go' : '');
    for (const [k, b] of Object.entries(scaleBtns)) b.className = 'sim-btn' + (scale === +k ? ' go' : '');
    lrSlider.value = sliderFromLr(lr);
    lrLabel.textContent = fmtDec(lr, 2);
    spdLabel.textContent = `${speed}/s`;
  }

  const chal = challenges(ch, [
    {
      text: 'In Pure 16-bit on the Lesson example, run 10 steps. Does the weight stay stuck at 1?',
      check: st => st.mode === 'fp16' && st.scenario === 'small' && st.step >= 10 && Math.abs(st.w - 1) < 1e-9,
      why: 'Yes! Each +0.0001 update landed closer to 1 than to 1.001, so 16-bit rounded it back to 1 every time and the loss stayed flat.'
    },
    {
      text: 'Switch to Mixed precision and run at least 10 steps so the weight passes 1.001 and the loss drops.',
      check: st => st.mode === 'mixed' && st.scenario === 'small' && st.step >= 10 && st.w >= 1.00099 && st.loss <= 1.05,
      why: 'Right! Keeping the main weight copy in 32-bit protected every +0.0001 update, so the weight reached 1.001 and the loss fell steadily.'
    },
    {
      text: 'Tap “Tiny gradient (1e−8)”. With Loss scale = 1× it vanishes to 0. Set Mixed precision and Loss scale = 1,024×, then take at least 5 steps.',
      check: st => st.scenario === 'tiny' && st.mode === 'mixed' && st.scale >= 1024 && st.step >= 5 && st.loss <= 1.1,
      why: 'Multiplying the loss by 1,024 lifted the tiny gradient above 0.00000006 so 16-bit could store it, then dividing by 1,024 in 32-bit restored the true update.'
    },
    {
      text: 'Press “New data (random)” and use Mixed precision with a working Loss scale to cut the loss in half.',
      check: st => st.isRandom && st.mode === 'mixed' && st.step >= 3 && st.loss <= 1.0 && !st.overflow,
      why: 'Nice! Even on fresh random numbers, mixed precision plus loss scaling keeps small changes and tiny gradients alive.'
    }
  ]);

  // Layout geometry (responsive for phone and laptop)
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 500 : 470, F = NARROW ? 1.12 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 42 : 56, X1 = VW - 22, PW = X1 - X0;

  // Interactive drag of target weight on the top number line
  let draggingTarget = false;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const nlY1 = 56, nlY2 = 112;
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < 18 || p.y > 142) return;
    draggingTarget = true; svg.setPointerCapture(e.pointerId); moveTarget(e);
  });
  function moveTarget(e) {
    if (!draggingTarget) return;
    const p = toSvg(e);
    const frac = Math.max(0.08, Math.min(0.95, (p.x - X0) / PW));
    const nv = sc.viewMin + frac * (sc.viewMax - sc.viewMin);
    if (Math.abs(nv - sc.w0) > (sc.viewMax - sc.viewMin) * 0.05) {
      sc.target = nv;
      resetRun(true);
    }
  }
  svg.addEventListener('pointermove', moveTarget);
  svg.addEventListener('pointerup', () => { draggingTarget = false; });

  function draw() {
    const k = [];
    const curLoss = lossAt(w);
    iterPill.textContent = `STEP ${stepCount}`;
    if (mode === 'fp16') { memPill.textContent = '16-BIT · 2 MB'; memPill.style.color = C.amber; memPill.style.borderColor = C.amber; }
    else if (mode === 'mixed') { memPill.textContent = 'MIXED · 16-BIT MATH + 32-BIT COPY'; memPill.style.color = C.green; memPill.style.borderColor = C.green; }
    else { memPill.textContent = '32-BIT · 4 MB'; memPill.style.color = C.cyan; memPill.style.borderColor = C.cyan; }

    // --- BAND 1: Number lines (16-bit ticks vs 32-bit smooth) ---
    const v2x = val => X0 + Math.max(0, Math.min(1, (val - sc.viewMin) / (sc.viewMax - sc.viewMin))) * PW;
    k.push(s('text', { x: X0, y: 22, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700 }, 'Weight on the number line (drag green target)'));

    // 16-bit line
    k.push(
      s('text', { x: X0 - 6, y: nlY1 + 4, fill: C.amber, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '16-bit'),
      s('line', { x1: X0, x2: X1, y1: nlY1, y2: nlY1, stroke: C.amber, 'stroke-width': 2.5, 'stroke-opacity': mode === 'fp16' ? 1 : 0.45 })
    );
    // Draw actual FP16 ticks inside [viewMin, viewMax]
    const st16 = fp16Step(sc.w0);
    if ((sc.viewMax - sc.viewMin) / st16 < 30) {
      const firstTick = Math.ceil(sc.viewMin / st16) * st16;
      for (let t = firstTick; t <= sc.viewMax + 1e-12; t += st16) {
        const tx = v2x(t);
        k.push(s('line', { x1: tx, x2: tx, y1: nlY1 - 9, y2: nlY1 + 9, stroke: C.amber, 'stroke-width': 2.2 }),
          s('text', { x: tx, y: nlY1 + 24, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmtDec(t, 3)));
      }
    } else {
      for (let i = 0; i <= 4; i++) {
        const t = sc.viewMin + (i / 4) * (sc.viewMax - sc.viewMin), tx = v2x(t);
        k.push(s('line', { x1: tx, x2: tx, y1: nlY1 - 6, y2: nlY1 + 6, stroke: C.amber, 'stroke-width': 1.5 }));
      }
    }

    // 32-bit line
    k.push(
      s('text', { x: X0 - 6, y: nlY2 + 4, fill: C.cyan, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '32-bit'),
      s('line', { x1: X0, x2: X1, y1: nlY2, y2: nlY2, stroke: C.cyan, 'stroke-width': 2.5, 'stroke-opacity': mode === 'fp16' ? 0.45 : 1 })
    );
    for (let i = 0; i <= 10; i++) {
      const t = sc.viewMin + (i / 10) * (sc.viewMax - sc.viewMin), tx = v2x(t);
      k.push(s('line', { x1: tx, x2: tx, y1: nlY2 - (i % 5 === 0 ? 7 : 4), y2: nlY2 + (i % 5 === 0 ? 7 : 4), stroke: C.cyan, 'stroke-width': 1.2, 'stroke-opacity': 0.7 }));
    }

    // Target dashed vertical marker
    const xTgt = v2x(sc.target);
    k.push(
      s('line', { x1: xTgt, x2: xTgt, y1: nlY1 - 18, y2: nlY2 + 18, stroke: C.green, 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
      s('text', { x: xTgt, y: nlY1 - 21, fill: C.green, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'target')
    );

    // Current weight dot on the active line (+ bounce-back arc if 16-bit rounded back)
    const activeY = mode === 'fp16' ? nlY1 : nlY2;
    const activeCol = mode === 'fp16' ? C.amber : (mode === 'mixed' ? C.green : C.cyan);
    if (Number.isFinite(w)) {
      const xW = v2x(w);
      if (lastInfo?.roundedBack) {
        const xTry = v2x(lastInfo.rawNewW);
        k.push(s('path', { d: `M ${xTry} ${nlY1 - 4} Q ${(xTry + xW) / 2} ${nlY1 - 24} ${xW} ${nlY1 - 5}`, fill: 'none', stroke: C.pink, 'stroke-width': 2.2 }),
          s('text', { x: Math.min(X1 - 50, xTry + 6), y: nlY1 - 24, fill: C.pink, 'font-size': 10.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'rounded back!'));
      }
      k.push(
        s('circle', { cx: xW, cy: activeY, r: 9, fill: activeCol, 'fill-opacity': 0.25 }),
        s('circle', { cx: xW, cy: activeY, r: 5.5, fill: activeCol }),
        s('text', { x: Math.max(X0 + 36, Math.min(X1 - 36, xW)), y: activeY + (mode === 'fp16' ? -13 : 22), fill: activeCol, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmtDec(w, sc.minDec))
      );
    }

    // --- BAND 2: Gradient in 16-bit range (log10 from 1e-10 to 1e6) ---
    const gY = 186, gH = 26;
    const logMin = -10, logMax = 6;
    const g2x = v => {
      if (!Number.isFinite(v)) return X1;
      const a = Math.abs(v);
      if (a <= 0) return X0;
      const lg = Math.max(logMin, Math.min(logMax, Math.log10(a)));
      return X0 + ((lg - logMin) / (logMax - logMin)) * PW;
    };
    const xFloor = g2x(FP16_MIN), xCeil = g2x(FP16_MAX);
    k.push(
      s('text', { x: X0, y: gY - 14, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700 }, 'Gradient inside 16-bit range (0.00000006 to 65,504)'),
      s('rect', { x: X0, y: gY, width: xFloor - X0, height: gH, fill: C.pink, 'fill-opacity': 0.22, rx: 4 }),
      s('rect', { x: xFloor, y: gY, width: xCeil - xFloor, height: gH, fill: C.green, 'fill-opacity': 0.16 }),
      s('rect', { x: xCeil, y: gY, width: X1 - xCeil, height: gH, fill: C.pink, 'fill-opacity': 0.22, rx: 4 }),
      s('line', { x1: xFloor, x2: xFloor, y1: gY - 4, y2: gY + gH + 4, stroke: C.pink, 'stroke-width': 2, 'stroke-dasharray': '4 3' }),
      s('line', { x1: xCeil, x2: xCeil, y1: gY - 4, y2: gY + gH + 4, stroke: C.pink, 'stroke-width': 2, 'stroke-dasharray': '4 3' }),
      s('text', { x: (X0 + xFloor) / 2, y: gY + gH + 15, fill: C.pink, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'becomes 0'),
      s('text', { x: (xFloor + xCeil) / 2, y: gY + gH + 15, fill: C.green, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '16-bit safe zone'),
      s('text', { x: xCeil, y: gY + gH + 15, fill: C.pink, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'overflow')
    );

    const gCur = Math.abs(trueGradAt(Number.isFinite(w) ? w : sc.w0));
    const gSc = gCur * scale;
    const xG = g2x(gCur), xGS = g2x(gSc);
    if (scale > 1 && gCur > 0) {
      k.push(s('line', { x1: xG, x2: xGS, y1: gY + gH / 2, y2: gY + gH / 2, stroke: C.amber, 'stroke-width': 2.5 }));
    }
    k.push(s('circle', { cx: xG, cy: gY + gH / 2, r: 5, fill: C.cyan }));
    const gAlive = gSc >= FP16_MIN && gSc <= FP16_MAX;
    k.push(s('circle', { cx: xGS, cy: gY + gH / 2, r: 6.5, fill: mode === 'fp32' ? C.cyan : (gAlive ? C.green : C.pink) }));

    // --- BAND 3: Loss vs. Iteration curve ---
    const cTop = 262, cBot = VH - 36, cH = cBot - cTop;
    const maxStep = Math.max(20, stepCount + 2);
    const maxLoss = Math.max(2.4, ...lossHist.filter(Number.isFinite));
    const sx = i => X0 + (i / maxStep) * PW;
    const sy = l => cBot - (Math.min(maxLoss, l) / maxLoss) * cH;

    k.push(
      s('text', { x: X0, y: cTop - 10, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700 }, 'Loss vs. iteration (lower is better)'),
      s('line', { x1: X0, x2: X1, y1: cBot, y2: cBot, stroke: C.line, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X0, y1: cTop, y2: cBot, stroke: C.line, 'stroke-width': 2 }),
      s('text', { x: X0 - 8, y: cBot + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0'),
      s('text', { x: X0 - 8, y: sy(2) + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '2.0'),
      s('line', { x1: X0, x2: X1, y1: sy(2), y2: sy(2), stroke: C.line, 'stroke-dasharray': '4 4' }),
      s('text', { x: X1, y: cBot + 20, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `step ${maxStep}`),
      s('text', { x: X0, y: cBot + 20, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, 'step 0')
    );

    if (lossHist.length > 1) {
      const pts = lossHist.map((l, i) => `${sx(i).toFixed(1)},${sy(l).toFixed(1)}`).join(' ');
      k.push(s('polyline', { points: pts, fill: 'none', stroke: activeCol, 'stroke-width': 3 }));
    }
    lossHist.forEach((l, i) => {
      if (lossHist.length <= 28 || i === lossHist.length - 1 || i % 3 === 0) {
        k.push(s('circle', { cx: sx(i), cy: sy(l), r: i === lossHist.length - 1 ? 5 : 3, fill: activeCol }));
      }
    });

    svg.replaceChildren(...k);

    // Formula box: show exact step numbers
    if (!lastInfo) {
      fbox(box, [
        [`task   = ${sc.label}`, C.ink],
        [`weight = ${fmtDec(w, sc.minDec)}  (target ${fmtDec(sc.target, sc.minDec)})`, C.cyan],
        [`grad   = ${fmtDec(gCur, 4)}   scale = ${scale.toLocaleString()}×`, C.amber],
        [`loss   = ${curLoss.toFixed(2)}   (press Step or Play)`, C.green]
      ]);
    } else {
      const L = lastInfo;
      const lines = [
        [`step ${stepCount}   mode = ${mode === 'fp16' ? 'Pure 16-bit' : mode === 'mixed' ? 'Mixed precision' : 'Full 32-bit'}`, C.ink],
        [`old w   = ${fmtDec(L.oldW, sc.minDec)}   loss = ${Number.isFinite(L.newLoss) ? L.newLoss.toFixed(2) : 'overflow'}`, C.cyan],
        [`grad    = ${fmtDec(L.gTrue, 4)} × ${scale.toLocaleString()} → ${mode === 'fp32' ? fmtDec(L.gTrue, 4) : fmtDec(L.gStored16, 4)}`, L.underflow || L.overflow ? C.pink : C.amber],
        [`change  = ${L.rawDelta >= 0 ? '+' : ''}${fmtDec(L.rawDelta, sc.minDec)}`, L.underflow ? C.pink : C.ink],
        [`new w   = ${fmtDec(L.newW, sc.minDec)}${L.roundedBack ? '  (16-bit rounded back!)' : ''}`, L.roundedBack || L.overflow ? C.pink : C.green]
      ];
      fbox(box, lines);
    }

    // Plain-English live note
    if (lastInfo?.overflow) {
      note.textContent = 'Overflow! The scaled gradient went above 65,504 (the largest 16-bit number). Lower the Loss scale and press Reset.';
    } else if (lastInfo?.underflow) {
      note.textContent = 'The gradient was smaller than 0.00000006, so 16-bit turned it into 0! Raise Loss scale (try 1,024×) to keep the signal alive.';
    } else if (lastInfo?.roundedBack) {
      note.textContent = 'Small update lost: the change was smaller than half the gap between 16-bit numbers, so Pure 16-bit rounded the weight right back.';
    } else if (curLoss < 0.05) {
      note.textContent = 'Settled near the target! The loss dropped cleanly because every small weight update was preserved.';
    } else if (mode === 'mixed') {
      note.textContent = 'Mixed precision keeps the main weight in 32-bit (saving small changes) while running fast math in 16-bit.';
    } else if (mode === 'fp16') {
      note.textContent = 'Pure 16-bit saves half the memory, but stores every updated weight on coarse 16-bit marks.';
    } else {
      note.textContent = 'Full 32-bit keeps every tiny change, but uses twice as much memory as 16-bit.';
    }

    chal.update({
      mode, scenario: sc.id, isRandom: sc.isRandom, step: stepCount,
      w, loss: curLoss, scale, overflow: !!lastInfo?.overflow
    });
  }

  syncControls();
  draw();
  return () => stopPlay();
}

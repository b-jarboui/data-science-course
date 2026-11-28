// 3.3.2 Try it: sampling frames and undercoverage bias.
// Drag the cyan picture frame across the 1,000-student university (or use the buttons),
// pick a sample size, draw 1 or 30 samples, and test whether a bigger sample fixes a bad frame.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Build 1,000 students in 20 columns of 50 so every 50-student slice has an exact group mean.
  const HALF_OFFSETS = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 11, 12, 13, 14, 15];
  function makePop(nDrivers, driverMean, otherMean) {
    const arr = [];
    for (let col = 0; col < 20; col++) {
      const m = col * 50 < nDrivers ? driverMean : otherMean;
      const offs = [];
      for (const d of HALF_OFFSETS) offs.push(-d, d);
      for (let i = offs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [offs[i], offs[j]] = [offs[j], offs[i]];
      }
      for (const d of offs) arr.push(m + d);
    }
    return arr;
  }

  let nDrivers = 250, driverMean = 24, otherMean = 32;
  let pop = makePop(nDrivers, driverMean, otherMean);
  let frameSize = 250; // 100..1000 in steps of 50
  let sampleN = 25;
  let samples = [];
  let lastPickedDots = new Set();
  let anim = 0;
  let isRandom = false, bigBadDraws = 0, randomBadDone = false, randomFullDone = false;

  const svg = s('svg', { viewBox: '0 0 700 455' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const sizeRow = h('div', { class: 'sim-row', style: { alignItems: 'center' } });
  const frameLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the sampling frame'),
    h('p', { class: 'sub' }, 'The 100 dots represent all 1,000 students (1 dot = 10 students). Drag the right edge of the cyan frame to change who is on the list, then draw samples.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−50', () => setFrame(frameSize - 50)),
          btn('+50', () => setFrame(frameSize + 50)),
          btn('Permit list', () => setFrame(nDrivers)),
          btn('Full roster (1,000)', () => setFrame(1000)),
          frameLabel),
        sizeRow,
        h('div', { class: 'sim-row' },
          btn('Draw 1 sample', () => drawMany(1), 'go'),
          btn('Draw 30 samples', () => drawMany(30), 'go'),
          btn('Clear samples', () => { stopAnim(); samples = []; lastPickedDots.clear(); draw(); }),
          btn('New data', () => newData()),
          btn('Reset', () => reset()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const trueMean = () => (nDrivers * driverMean + (1000 - nDrivers) * otherMean) / 1000;
  const frameMean = () => {
    const inDrv = Math.min(frameSize, nDrivers);
    const inOth = Math.max(0, frameSize - nDrivers);
    return (inDrv * driverMean + inOth * otherMean) / frameSize;
  };
  const effN = () => Math.min(sampleN, frameSize);

  const chal = challenges(ch, [
    { text: 'Keep the permit list (250 students) and press “Draw 30 samples”. Where do the samples land?',
      check: st => st.frameSize === st.nDrivers && st.samples.length >= 30,
      why: 'Every sample comes from drivers only, so the dots pile up around the frame mean (24) instead of the true mean (30).' },
    { text: 'Still on the permit list, set sample size to 250 and draw samples. Does a bigger sample reach the true mean?',
      check: st => st.bigBadDraws >= 1,
      why: 'No! Even asking all 250 drivers settles right at 24, never 30. A bigger sample cannot fix a frame that leaves people out.' },
    { text: 'Drag the cyan frame (or press “Full roster”) to cover all 1,000 students, then draw 30 samples.',
      check: st => st.frameSize === 1000 && st.samples.length >= 30,
      why: 'With all 1,000 students in the frame, the samples center right on the true mean—undercoverage bias is gone!' },
    { text: 'Press “New data”, draw samples with the permit list, then widen the frame to 1,000 and draw again.',
      check: st => st.randomBadDone && st.randomFullDone,
      why: 'It holds for any university: a missing group pulls samples away from the truth, and a full frame brings them back on target.' }
  ]);

  function renderSizeRow() {
    sizeRow.replaceChildren(
      h('span', { class: 'sim-note', style: { margin: 0, marginRight: '.25rem' } }, 'Sample size:'),
      ...[10, 25, 50, 100, 250].map(n => btn(String(n), () => setSampleN(n), sampleN === n ? 'go' : ''))
    );
  }

  function stopAnim() { cancelAnimationFrame(anim); anim = 0; }

  function setFrame(val) {
    const next = Math.max(100, Math.min(1000, Math.round(val / 50) * 50));
    if (next === frameSize) return;
    stopAnim();
    frameSize = next;
    samples = [];
    lastPickedDots.clear();
    draw();
  }

  function setSampleN(n) {
    if (n === sampleN) return;
    stopAnim();
    sampleN = n;
    samples = [];
    lastPickedDots.clear();
    renderSizeRow();
    draw();
  }

  function newData() {
    stopAnim();
    nDrivers = rnd(3, 9) * 50; // 150..450
    driverMean = rnd(16, 25);
    otherMean = rnd(driverMean + 6, Math.min(44, driverMean + 16));
    pop = makePop(nDrivers, driverMean, otherMean);
    frameSize = nDrivers;
    samples = [];
    lastPickedDots.clear();
    isRandom = true;
    randomBadDone = false;
    randomFullDone = false;
    draw();
  }

  function reset() {
    stopAnim();
    nDrivers = 250; driverMean = 24; otherMean = 32;
    pop = makePop(nDrivers, driverMean, otherMean);
    frameSize = 250; sampleN = 25;
    samples = [];
    lastPickedDots.clear();
    isRandom = false;
    renderSizeRow();
    draw();
  }

  function sampleOnce() {
    const k = effN();
    // Draw k students without replacement from 0..frameSize-1
    let sum = 0;
    if (k === frameSize) {
      for (let i = 0; i < frameSize; i++) sum += pop[i];
    } else {
      const used = new Set();
      while (used.size < k) {
        const idx = Math.floor(Math.random() * frameSize);
        if (!used.has(idx)) { used.add(idx); sum += pop[idx]; }
      }
    }
    // Pick visual dots inside the frame to highlight for this sample
    lastPickedDots.clear();
    const frameCols = frameSize / 50;
    const totalFrameDots = frameCols * 5;
    const visCount = Math.min(totalFrameDots, Math.max(1, Math.round(k / 10)));
    while (lastPickedDots.size < visCount) {
      lastPickedDots.add(Math.floor(Math.random() * totalFrameDots));
    }
    samples.push(sum / k);
    if (samples.length > 240) samples.shift();
    if (frameSize === nDrivers && sampleN >= 250) bigBadDraws++;
    if (isRandom && frameSize === nDrivers) randomBadDone = true;
    if (isRandom && frameSize === 1000) randomFullDone = true;
  }

  function drawMany(count) {
    stopAnim();
    if (count === 1) { sampleOnce(); draw(); return; }
    let left = count;
    const step = () => {
      const batch = Math.min(left, 2);
      for (let i = 0; i < batch; i++) sampleOnce();
      left -= batch;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 470 : 455, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const GX0 = NARROW ? 18 : 34, GX1 = VW - (NARROW ? 18 : 34);
  const GTOP = 38, GBOT = 176;
  const AXIS_X0 = NARROW ? 24 : 44, AXIS_X1 = VW - (NARROW ? 24 : 44);
  const PLOT_TOP = 248, AXIS_Y = NARROW ? 412 : 398;

  // Drag right edge of the cyan frame on the population grid
  let dragging = false;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const updateDrag = e => {
    if (!dragging) return;
    const p = toSvg(e);
    const frac = Math.max(0.1, Math.min(1, (p.x - GX0) / (GX1 - GX0)));
    setFrame(Math.round(frac * 20) * 50);
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y >= GTOP - 16 && p.y <= GBOT + 20) {
      dragging = true;
      svg.setPointerCapture(e.pointerId);
      updateDrag(e);
    }
  });
  svg.addEventListener('pointermove', updateDrag);
  svg.addEventListener('pointerup', () => { dragging = false; });

  function draw() {
    const tm = trueMean(), fm = frameMean(), bias = fm - tm;
    const frameCols = frameSize / 50, drvCols = nDrivers / 50;
    const colW = (GX1 - GX0) / 20, rowH = (GBOT - GTOP) / 5;
    const dotR = NARROW ? 5.2 : 7.0;
    const k = [];

    // Top section header
    k.push(
      s('text', { x: GX0, y: 22, fill: C.ink, 'font-size': 13.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        'POPULATION: 1,000'),
      s('text', { x: GX1, y: 22, fill: C.cyan, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `FRAME: ${frameSize} (${Math.round(frameSize / 10)}%)`)
    );

    // Subtle divider marking drivers vs non-drivers
    const drvEdgeX = GX0 + drvCols * colW;
    k.push(s('rect', { x: GX0, y: GTOP, width: drvEdgeX - GX0, height: GBOT - GTOP, fill: C.cyan, 'fill-opacity': 0.05, rx: 6 }));

    // 100 dots (20 cols x 5 rows; each dot = 10 students)
    for (let c = 0; c < 20; c++) {
      const inFrame = c < frameCols;
      const isDrv = c < drvCols;
      for (let r = 0; r < 5; r++) {
        const cx = GX0 + (c + 0.5) * colW;
        const cy = GTOP + (r + 0.5) * rowH;
        const idx = c * 5 + r;
        const picked = inFrame && lastPickedDots.has(idx);
        const fill = picked ? C.amber : (inFrame ? (isDrv ? C.cyan : C.green) : C.muted);
        const op = picked ? 1 : (inFrame ? 0.9 : 0.35);
        k.push(s('circle', { cx, cy, r: picked ? dotR * 1.18 : dotR, fill, 'fill-opacity': op }));
      }
    }

    // Glowing cyan picture frame around columns 0..frameCols-1
    const fx1 = GX0 + frameCols * colW;
    const frameCol = frameSize === 1000 ? C.green : C.cyan;
    k.push(
      s('rect', {
        x: GX0 - 2, y: GTOP - 2, width: fx1 - GX0 + 4, height: GBOT - GTOP + 4,
        fill: 'none', stroke: frameCol, 'stroke-width': 3, rx: 8
      }),
      // Draggable handle on right edge of frame
      s('rect', { x: fx1 - 9, y: (GTOP + GBOT) / 2 - 18, width: 18, height: 36, rx: 9, fill: C.bg, stroke: frameCol, 'stroke-width': 2 }),
      s('text', { x: fx1, y: (GTOP + GBOT) / 2 + 4, fill: frameCol, 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '↔')
    );

    // Legend under grid
    const missed = 1000 - frameSize;
    k.push(
      s('text', { x: GX0, y: GBOT + 22, fill: C.cyan, 'font-size': 12.5 * F, 'font-family': 'Consolas' },
        `Drivers: ${nDrivers} (${driverMean}m)`),
      s('text', { x: GX1, y: GBOT + 22, fill: missed > 0 ? C.pink : C.green, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        missed > 0 ? `Missed: ${missed} (${Math.round(missed / 10)}%)` : 'All 1,000 in frame ✓'),
      s('line', { x1: AXIS_X0, x2: AXIS_X1, y1: 218, y2: 218, stroke: C.line })
    );

    // Lower plot: sample means on minutes line
    const minV = Math.max(5, Math.floor((Math.min(driverMean, otherMean) - 8) / 5) * 5);
    const maxV = Math.min(60, Math.ceil((Math.max(driverMean, otherMean) + 8) / 5) * 5);
    const xOf = v => AXIS_X0 + (v - minV) / (maxV - minV) * (AXIS_X1 - AXIS_X0);

    k.push(
      s('text', { x: AXIS_X0, y: 238, fill: C.muted, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `SAMPLE MEANS (${samples.length} DRAWN, n = ${effN()})`),
      s('line', { x1: AXIS_X0, x2: AXIS_X1, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2 })
    );

    for (let t = minV; t <= maxV; t += 5) {
      const tx = xOf(t);
      k.push(
        s('line', { x1: tx, x2: tx, y1: AXIS_Y - 5, y2: AXIS_Y + 5, stroke: C.muted }),
        s('text', { x: tx, y: AXIS_Y + 21, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, t)
      );
    }
    k.push(s('text', { x: AXIS_X1, y: AXIS_Y + 38, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end' }, 'minutes'));

    // True mean & frame mean reference lines
    const xt = xOf(tm), xf = xOf(fm);
    k.push(s('line', { x1: xt, x2: xt, y1: PLOT_TOP + 12, y2: AXIS_Y, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }));
    if (Math.abs(bias) >= 0.05) {
      k.push(s('line', { x1: xf, x2: xf, y1: PLOT_TOP + 12, y2: AXIS_Y, stroke: C.cyan, 'stroke-width': 2.5, 'stroke-dasharray': '4 5' }));
    }

    // Labels for True & Frame lines (avoid overlapping each other)
    if (Math.abs(bias) < 0.05) {
      const tw = 148 * F;
      const lx = Math.max(AXIS_X0 + tw / 2, Math.min(AXIS_X1 - tw / 2, xt));
      k.push(
        s('rect', { x: lx - tw / 2, y: PLOT_TOP + 4, width: tw, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: C.green }),
        s('text', { x: lx, y: PLOT_TOP + 19 * F, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `FRAME = TRUE ${fmt(r2(tm))}`)
      );
    } else {
      const close = Math.abs(xt - xf) < 98 * F;
      const bw = 90 * F;
      const txL = Math.max(AXIS_X0 + bw / 2, Math.min(AXIS_X1 - bw / 2, xt));
      const fxL = Math.max(AXIS_X0 + bw / 2, Math.min(AXIS_X1 - bw / 2, xf));
      const fyTop = close ? PLOT_TOP + 28 * F : PLOT_TOP + 4;
      k.push(
        s('rect', { x: txL - bw / 2, y: PLOT_TOP + 4, width: bw, height: 21 * F, rx: 10 * F, fill: C.bg, stroke: C.amber }),
        s('text', { x: txL, y: PLOT_TOP + 18 * F, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `TRUE ${fmt(r2(tm))}`),
        s('rect', { x: fxL - bw / 2, y: fyTop, width: bw, height: 21 * F, rx: 10 * F, fill: C.bg, stroke: C.cyan }),
        s('text', { x: fxL, y: fyTop + 14 * F, fill: C.cyan, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `FRAME ${fmt(r2(fm))}`)
      );
      // Pink bias gap bar
      const gapY = close ? PLOT_TOP + 62 * F : PLOT_TOP + 38 * F;
      k.push(
        s('line', { x1: xt, x2: xf, y1: gapY, y2: gapY, stroke: C.pink, 'stroke-width': 3 }),
        s('circle', { cx: xf, cy: gapY, r: 4, fill: C.pink }),
        s('text', { x: (xt + xf) / 2, y: gapY - 6, fill: C.pink, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `bias ${bias > 0 ? '+' : ''}${fmt(r2(bias))}`)
      );
    }

    // Histogram / stacked dotplot of drawn sample means (0.5-min bins)
    if (samples.length) {
      const bins = new Map();
      for (const m of samples) {
        const b = Math.round(m * 2) / 2;
        bins.set(b, (bins.get(b) || 0) + 1);
      }
      const maxStack = Math.max(1, ...bins.values());
      const availH = AXIS_Y - (PLOT_TOP + 76 * F);
      const stepY = Math.min(10, availH / maxStack);
      const rDot = Math.max(2.6, Math.min(4.6, stepY * 0.45));
      for (const [b, cnt] of bins.entries()) {
        const bx = xOf(b);
        for (let i = 0; i < cnt; i++) {
          const by = AXIS_Y - 5 - i * stepY;
          k.push(s('circle', { cx: bx, cy: by, r: rDot, fill: frameCol, 'fill-opacity': 0.88 }));
        }
      }
      // Solid marker for the latest sample mean
      const last = samples[samples.length - 1];
      const xl = xOf(last);
      k.push(s('circle', { cx: xl, cy: AXIS_Y, r: 6, fill: C.amber, stroke: C.bg, 'stroke-width': 1.5 }));
    } else {
      k.push(s('text', { x: (AXIS_X0 + AXIS_X1) / 2, y: (PLOT_TOP + AXIS_Y) / 2 + 24, fill: C.muted, 'font-size': 13.5 * F, 'text-anchor': 'middle' },
        'Press “Draw 1 sample” or “Draw 30 samples” to see where they land.'));
    }

    svg.replaceChildren(...k);

    // Formula box & live summary
    const sampleAvg = samples.length ? avg(samples) : null;
    const lines = [
      [`population = 1,000  (true mean = ${fmt(r2(tm))})`, C.amber],
      [`frame      = ${frameSize}    (frame mean = ${fmt(r2(fm))})`, frameCol],
      [missed > 0 ? `missed     = ${missed}    (${Math.round(missed / 10)}% undercoverage)` : 'missed     = 0      (full coverage!)', missed > 0 ? C.pink : C.green],
      [`sample n   = ${effN()}${sampleN > frameSize ? ` (all in frame)` : ''}  ·  drawn = ${samples.length}`, C.ink]
    ];
    if (sampleAvg !== null) {
      const gap = sampleAvg - tm;
      lines.push([`samples avg = ${fmt(r2(sampleAvg))}  (gap = ${gap > 0 ? '+' : ''}${fmt(r2(gap))} min)`, Math.abs(bias) >= 0.05 ? C.pink : C.green]);
    } else {
      lines.push([`bias (frame − truth) = ${bias > 0 ? '+' : ''}${fmt(r2(bias))} min`, Math.abs(bias) >= 0.05 ? C.pink : C.green]);
    }
    fbox(box, lines);

    frameLabel.textContent = `Frame: ${frameSize} of 1,000`;
    note.textContent = missed > 0
      ? `The frame misses ${missed} students whose trips average ${otherMean} min, so samples aim at ${fmt(r2(fm))} instead of ${fmt(r2(tm))}.`
      : `All 1,000 students are inside the frame. Samples vary from draw to draw, but they aim straight at the true mean (${fmt(r2(tm))} min).`;

    chal.update({
      frameSize, nDrivers, sampleN, effN: effN(), samples,
      bigBadDraws, randomBadDone, randomFullDone
    });
  }

  renderSizeRow();
  draw();
  return () => stopAnim();
}

// 3.3.1 Try it: population and sample.
// Explore a 1,000-student roster: tap dots to swap students in or out of the sample,
// draw fresh samples, run 50 samples to watch estimates gather around the true mean,
// change sample size, or create a brand-new university.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const N = 1000, COLS = 40, ROWS = 25;
  const LESSON_SAMPLE = [15, 20, 25, 10, 40, 50, 30, 20, 35, 35];
  const LESSON_IDX = [52, 138, 193, 369, 462, 555, 685, 775, 868, 956];

  function buildPopulation(targetMean, useLesson) {
    const trips = new Array(N);
    for (let i = 0; i < N; i++) {
      const base = i < 600 ? targetMean - 10 : targetMean + 15;
      trips[i] = Math.max(5, Math.min(58, base + rnd(-8, 8)));
    }
    for (let i = N - 1; i > 0; i--) {
      const j = rnd(0, i);
      const t = trips[i]; trips[i] = trips[j]; trips[j] = t;
    }
    const fixed = new Set(useLesson ? LESSON_IDX : []);
    if (useLesson) LESSON_SAMPLE.forEach((v, k) => { trips[LESSON_IDX[k]] = v; });
    let diff = N * targetMean - trips.reduce((a, b) => a + b, 0);
    let guard = 0;
    while (diff !== 0 && guard < 200000) {
      const idx = rnd(0, N - 1);
      if (fixed.has(idx)) { guard++; continue; }
      if (diff > 0 && trips[idx] < 58) { trips[idx]++; diff--; }
      else if (diff < 0 && trips[idx] > 5) { trips[idx]--; diff++; }
      guard++;
    }
    return trips;
  }

  let trueMean = 30;
  let trips = buildPopulation(30, true);
  let sample = new Set(LESSON_IDX);
  let sampleSize = 10;
  let peek = true;
  let history = [28];
  let anim = 0, running = false;
  let taps = 0, singleDraws = 0, bigRunDone = false;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 472 : 464, F = NARROW ? 1.15 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const sizeVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.cyan } }, '10 students');
  const slider = h('input', {
    type: 'range', min: 5, max: 100, step: 5, value: 10,
    style: { accentColor: C.cyan, flex: '1 1 140px', minHeight: '36px', cursor: 'pointer' },
    oninput: () => {
      stopRun();
      sampleSize = +slider.value;
      sizeVal.textContent = `${sampleSize} students`;
      history = [];
      drawSample(true);
    }
  });
  const peekBtn = btn('Hide true mean', () => {
    peek = !peek;
    peekBtn.textContent = peek ? 'Hide true mean' : 'Peek at true mean';
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: population and sample'),
    h('p', { class: 'sub' }, 'All 1,000 dots are the population. The lit cyan dots are your sample. Tap any dot to swap it in or out, or draw new samples.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Sample size:'),
          slider, sizeVal),
        h('div', { class: 'sim-row' },
          btn('Draw 1 sample', () => { stopRun(); singleDraws++; drawSample(true); }, 'go'),
          btn('Run 50 samples', () => runMany(50)),
          peekBtn,
          btn('New data', () => newUniversity()),
          btn('Start again', () => reset()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Tap any grey dot on the roster to add a student to your sample, or tap a lit dot to remove one.',
      check: st => st.taps >= 1,
      why: 'Swapping even one student moves the sample mean, while the true population mean never moves.'
    },
    {
      text: 'Press “Draw 1 sample” three times. Does every sample give the exact same mean?',
      check: st => st.singleDraws >= 3,
      why: 'No: each sample of students gives a slightly different estimate, even though the population mean is fixed.'
    },
    {
      text: 'Press “Run 50 samples” and watch the dots build up around the dashed line.',
      check: st => st.historyCount >= 50,
      why: 'Single samples land a little low or high, but together they pile up right around the true population mean.'
    },
    {
      text: 'Slide the sample size to 50 or more, then press “Run 50 samples” again. Do the estimates stay closer?',
      check: st => st.bigRunDone,
      why: 'Yes! Asking more students makes the estimates cluster much more tightly around the true population mean.'
    }
  ]);

  // SVG geometry
  const GX0 = NARROW ? 18 : 36, GW = VW - GX0 * 2;
  const GY0 = 32, GH = 216;
  const DX = GW / (COLS - 1), DY = GH / (ROWS - 1);
  const X0 = NARROW ? 24 : 38, X1 = VW - X0, NY = 398;
  const xOf = v => X0 + (Math.max(0, Math.min(60, v)) / 60) * (X1 - X0);

  // Build static roster background + 1,000 reusable dot nodes once for smooth 60fps runs
  const headerText = s('text', { x: GX0, y: 17, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' },
    NARROW ? 'POPULATION: 1,000 (TAP ANY DOT)' : 'POPULATION ROSTER: 1,000 STUDENTS (TAP ANY DOT TO SWAP)');
  const rosterBox = s('rect', { x: GX0 - 10, y: GY0 - 8, width: GW + 20, height: GH + 16, rx: 10, fill: '#0b1020', stroke: C.line });
  const rosterLayer = s('g');
  const overlay = s('g');
  const dotEls = [];
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / COLS), c = i % COLS;
    const el = s('circle', { cx: GX0 + c * DX, cy: GY0 + r * DY, r: NARROW ? 2.1 : 2.6, fill: C.muted, 'fill-opacity': 0.32 });
    dotEls.push(el);
    rosterLayer.append(el);
  }
  svg.replaceChildren(headerText, rosterBox, rosterLayer, overlay);

  function stopRun() {
    running = false;
    cancelAnimationFrame(anim);
  }

  function pickIndices(k) {
    const out = new Set();
    while (out.size < k) out.add(rnd(0, N - 1));
    return out;
  }

  function sampleStats() {
    const vals = [];
    sample.forEach(i => vals.push(trips[i]));
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = sum / vals.length;
    return { vals, sum, mean, n: vals.length };
  }

  function drawSample(record) {
    sample = pickIndices(sampleSize);
    const st = sampleStats();
    if (record) history.push(st.mean);
    draw();
  }

  function runMany(count) {
    stopRun();
    running = true;
    let left = count;
    const step = () => {
      if (!running) return;
      const batch = Math.min(left, 2);
      for (let b = 0; b < batch; b++) {
        sample = pickIndices(sampleSize);
        history.push(sampleStats().mean);
        left--;
      }
      if (left <= 0 && sampleSize >= 50) bigRunDone = true;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
      else running = false;
    };
    anim = requestAnimationFrame(step);
  }

  function newUniversity() {
    stopRun();
    let next = rnd(22, 38);
    if (next === trueMean) next = trueMean === 30 ? 34 : 30;
    trueMean = next;
    trips = buildPopulation(trueMean, false);
    history = [];
    drawSample(true);
  }

  function reset() {
    stopRun();
    trueMean = 30;
    trips = buildPopulation(30, true);
    sampleSize = 10;
    slider.value = 10;
    sizeVal.textContent = '10 students';
    sample = new Set(LESSON_IDX);
    history = [28];
    draw();
  }

  // Tap any dot on the roster to toggle it in or out of the sample
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.x < GX0 - 10 || p.x > GX0 + GW + 10 || p.y < GY0 - 10 || p.y > GY0 + GH + 10) return;
    stopRun();
    const c = Math.max(0, Math.min(COLS - 1, Math.round((p.x - GX0) / DX)));
    const r = Math.max(0, Math.min(ROWS - 1, Math.round((p.y - GY0) / DY)));
    const idx = r * COLS + c;
    if (sample.has(idx)) {
      if (sample.size > 2) { sample.delete(idx); taps++; }
    } else {
      sample.add(idx); taps++;
    }
    sampleSize = Math.max(5, Math.min(100, Math.round(sample.size / 5) * 5));
    slider.value = sampleSize;
    sizeVal.textContent = `${sample.size} students`;
    draw();
  });

  function draw() {
    const { vals, sum, mean, n } = sampleStats();
    const rLit = NARROW ? 3.8 : 4.5, rDim = NARROW ? 2.1 : 2.6;
    const halos = [];

    for (let i = 0; i < N; i++) {
      const el = dotEls[i];
      if (sample.has(i)) {
        el.setAttribute('r', rLit);
        el.setAttribute('fill', C.cyan);
        el.setAttribute('fill-opacity', '1');
        const r = Math.floor(i / COLS), c = i % COLS;
        halos.push(s('circle', { cx: GX0 + c * DX, cy: GY0 + r * DY, r: NARROW ? 7 : 8.5, fill: C.cyan, 'fill-opacity': 0.22 }));
      } else {
        el.setAttribute('r', rDim);
        el.setAttribute('fill', C.muted);
        el.setAttribute('fill-opacity', '0.32');
      }
    }

    const k = [...halos];

    // Number line & ticks
    k.push(s('line', { x1: X0, x2: X1, y1: NY, y2: NY, stroke: C.muted, 'stroke-width': 2.5 }));
    for (let g = 0; g <= 60; g += 10) {
      const xg = xOf(g);
      k.push(
        s('line', { x1: xg, x2: xg, y1: NY - 5, y2: NY + 5, stroke: C.muted }),
        s('text', { x: xg, y: NY + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g)
      );
    }

    // Histogram of past sample means (binned by 1 minute)
    const bins = new Map();
    history.forEach(m => {
      const b = Math.round(m);
      bins.set(b, (bins.get(b) || 0) + 1);
    });
    const maxBin = Math.max(1, ...bins.values());
    const dotStep = Math.min(8, 92 / maxBin);
    const dotR = Math.max(2.2, Math.min(3.8, dotStep * 0.44));
    bins.forEach((cnt, b) => {
      const xb = xOf(b);
      for (let j = 0; j < cnt; j++) {
        k.push(s('circle', { cx: xb, cy: NY - 9 - j * dotStep, r: dotR, fill: C.violet, 'fill-opacity': 0.85 }));
      }
    });
    if (history.length > 1) {
      k.push(s('text', { x: X0, y: 280, fill: C.violet, 'font-size': 11.5 * F, 'font-family': 'Consolas' },
        `${history.length} SAMPLES DRAWN`));
    }

    // True population mean dashed line
    if (peek) {
      const xt = xOf(trueMean);
      const tw = 96 * F, tx = Math.max(X0, Math.min(X1 - tw, xt - tw / 2));
      k.push(
        s('line', { x1: xt, x2: xt, y1: 288, y2: NY + 4, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '7 6' }),
        s('rect', { x: tx, y: 263, width: tw, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: C.amber }),
        s('text', { x: tx + tw / 2, y: 263 + 15 * F, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `TRUE ${fmt(trueMean)}`)
      );
    }

    // Current sample mean solid marker
    const xm = xOf(mean);
    const sw = 114 * F, sx = Math.max(X0, Math.min(X1 - sw, xm - sw / 2));
    k.push(
      s('line', { x1: xm, x2: xm, y1: NY - 24, y2: NY + 24, stroke: C.cyan, 'stroke-width': 3.5 }),
      s('circle', { cx: xm, cy: NY, r: 5.5, fill: C.cyan }),
      s('rect', { x: sx, y: NY + 27, width: sw, height: 24 * F, rx: 12 * F, fill: C.bg, stroke: C.cyan }),
      s('text', { x: sx + sw / 2, y: NY + 27 + 16.5 * F, fill: C.cyan, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `SAMPLE ${fmt(Math.round(mean * 10) / 10)}`)
    );

    overlay.replaceChildren(...k);

    // Formula box
    const mRound = Math.round(mean * 100) / 100;
    const gap = Math.round(Math.abs(mean - trueMean) * 100) / 100;
    const listLine = n <= 10 ? `trips  = ${vals.join(' + ')}` : `sum    = ${sum} (from ${n} trips)`;
    const lines = [
      `population = ${N} students`,
      `sample     = ${n} students`,
      listLine,
      [`sample mean = ${sum} ÷ ${n} = ${fmt(mRound)}`, C.cyan],
      peek
        ? [`true mean   = ${fmt(trueMean)} (gap: ${fmt(gap)})`, C.amber]
        : ['true mean   = hidden', C.muted]
    ];
    fbox(box, lines);

    note.textContent = !peek
      ? 'The true population mean is hidden, just like in real life. Your sample mean is your best estimate.'
      : history.length >= 20
        ? `Each purple dot is one sample’s estimate. Notice how the ${history.length} estimates gather around the dashed true mean (${trueMean} min).`
        : `Your sample of ${n} estimates ${fmt(mRound)} minutes. The true mean of all 1,000 students is ${trueMean} minutes.`;

    chal.update({ taps, singleDraws, historyCount: history.length, bigRunDone });
  }

  draw();
  return () => stopRun();
}

// 6.3.2 Try it: posterior updating (Bayes' rule on five candidate failure rates).
// Tap parts in the batch to flip Fail/Pass, drag blue prior bars (or use -5/+5),
// draw fresh random batches, chain updates step by step, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const RATES = [10, 20, 30, 40, 50];
  const START_PRIOR = [10, 30, 30, 20, 10];
  const START_BATCH = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0]; // 3 fail, 7 pass

  let prior = START_PRIOR.slice();
  let batch = START_BATCH.slice();
  let sel = 2; // 30% selected initially
  let trueRate = 0.3;
  let randomBatches = 0;
  let chained = 0;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: updating belief with data'),
    h('p', { class: 'sub' }, 'Tap any charger part at the top to flip Fail/Pass. Drag any blue prior bar up or down (or tap a rate and use −5 / +5) to see how the green posterior updates live.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5 prior', () => bumpPrior(-5)),
          btn('+5 prior', () => bumpPrior(5)),
          btn('Flat prior', () => { prior = [20, 20, 20, 20, 20]; draw(); }),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('+1 Fail', () => addPart(1)),
          btn('+1 Pass', () => addPart(0)),
          btn('−1 Part', () => { if (batch.length > 1) { batch.pop(); draw(); } }),
          btn('New batch (random)', newRandomBatch),
          btn('Next batch (keep learning)', nextChainedBatch, 'go'),
          btn('Start again', resetAll))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Tap the parts in the batch to make 5 failures and 5 passes. Watch the green bars move right.',
      check: st => st.fails === 5 && st.passes === 5,
      why: 'Yes! With half the batch failing, 40% and 50% explain the batch better and gain belief, while 10% nearly vanishes.' },
    { text: 'Set the blue 30% prior bar to 0 points. Does 30% get any green posterior belief?',
      check: st => st.prior[2] === 0,
      why: 'Never! Zero times any likelihood is still zero. A rate given 0 in the prior can never come back.' },
    { text: 'Press “Start again”, then press “New batch (random)” twice. Notice how each fresh batch shifts the green bars.',
      check: st => st.randomBatches >= 2,
      why: 'Every time, Bayes’ rule rewards the rates that explain the new batch best and moves the posterior toward them.' },
    { text: 'Press “Next batch (keep learning)” twice. Watch today’s posterior become tomorrow’s prior.',
      check: st => st.chained >= 2,
      why: 'Each batch turns the old posterior into the new prior, so learning goes on step by step without starting over.' },
  ]);

  // Helpers for exact Bayes calculation
  function roundTo100(weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum <= 0) return [20, 20, 20, 20, 20];
    const exact = weights.map(w => (w / sum) * 100);
    const floors = exact.map(Math.floor);
    let left = 100 - floors.reduce((a, b) => a + b, 0);
    const order = exact.map((e, i) => [e - floors[i], i]).sort((a, b) => b[0] - a[0]);
    for (let k = 0; k < left; k++) floors[order[k][1]]++;
    return floors;
  }

  function compute() {
    const fails = batch.filter(x => x === 1).length;
    const passes = batch.length - fails;
    const raw = RATES.map(r => {
      const p = r / 100;
      return Math.pow(p, fails) * Math.pow(1 - p, passes);
    });
    const maxRaw = Math.max(...raw);
    const like = raw.map(v => maxRaw > 0 ? v / maxRaw : 1);
    const priorShare = prior.map(v => v / 100);
    const prod = priorShare.map((ps, i) => ps * like[i]);
    const prodSum = prod.reduce((a, b) => a + b, 0);
    const postExact = prod.map(v => prodSum > 0 ? (v / prodSum) * 100 : 20);
    const post = roundTo100(postExact);
    return { fails, passes, like, priorShare, prod, prodSum, postExact, post };
  }

  function setPrior(idx, target) {
    const val = Math.max(0, Math.min(100, Math.round(target)));
    const rem = 100 - val;
    const others = prior.map((p, i) => (i === idx ? 0 : p));
    const osum = others.reduce((a, b) => a + b, 0);
    const next = prior.slice();
    next[idx] = val;
    if (rem === 0) {
      for (let i = 0; i < 5; i++) if (i !== idx) next[i] = 0;
    } else if (osum === 0) {
      const base = Math.floor(rem / 4);
      let extra = rem - base * 4;
      for (let i = 0; i < 5; i++) if (i !== idx) { next[i] = base + (extra > 0 ? 1 : 0); extra--; }
    } else {
      const exact = others.map(v => (v / osum) * rem);
      const floors = exact.map(Math.floor);
      let left = rem - floors.reduce((a, b) => a + b, 0);
      const order = exact.map((e, i) => [i === idx ? -1 : e - floors[i], i]).sort((a, b) => b[0] - a[0]);
      for (let k = 0; k < left; k++) floors[order[k][1]]++;
      for (let i = 0; i < 5; i++) if (i !== idx) next[i] = floors[i];
    }
    prior = next;
  }

  function bumpPrior(d) { setPrior(sel, prior[sel] + d); draw(); }
  function addPart(fail) { if (batch.length < 30) { batch.push(fail); draw(); } }
  function sampleBatch(rate, n = 10) { return Array.from({ length: n }, () => (Math.random() < rate ? 1 : 0)); }

  function newRandomBatch() {
    const choices = [0.1, 0.2, 0.3, 0.4, 0.5];
    trueRate = choices[rnd(0, choices.length - 1)];
    batch = sampleBatch(trueRate, 10);
    randomBatches++;
    draw();
  }

  function nextChainedBatch() {
    const { post } = compute();
    prior = post.slice();
    batch = sampleBatch(trueRate, 10);
    chained++;
    draw();
  }

  function resetAll() {
    prior = START_PRIOR.slice();
    batch = START_BATCH.slice();
    sel = 2;
    trueRate = 0.3;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 470, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 38 : 54, X1 = VW - 12;
  const BATCH_TOP = 16, CHART_TOP = 148, BASE = 418;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const groupW = () => (X1 - X0) / 5;
  const maxScale = st => Math.max(50, Math.ceil(Math.max(...prior, ...st.post) / 10) * 10);
  const ptToY = (pts, mx) => BASE - (pts / mx) * (BASE - CHART_TOP);
  const yToPt = (y, mx) => Math.max(0, Math.min(100, ((BASE - y) / (BASE - CHART_TOP)) * mx));

  // Part grid layout (rows of 10)
  function partLayout() {
    const cols = 10;
    const rows = Math.ceil(batch.length / cols);
    const pw = NARROW ? 30 : 48;
    const ph = rows === 1 ? 30 : rows === 2 ? 24 : 20;
    const gapX = NARROW ? 6 : 12;
    const gapY = rows === 3 ? 6 : 8;
    const rowW = cols * pw + (cols - 1) * gapX;
    const sx = (VW - rowW) / 2;
    const sy = BATCH_TOP + (rows === 1 ? 18 : rows === 2 ? 8 : 2);
    return { cols, pw, ph, gapX, gapY, sx, sy };
  }

  // Pointer interaction: tap parts to flip, tap/drag chart to select or adjust blue prior bar
  let dragging = -1, dragMx = 50, dragMoved = false, downY = 0, hitBlue = false;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < CHART_TOP - 32) {
      const { cols, pw, ph, gapX, gapY, sx, sy } = partLayout();
      for (let j = 0; j < batch.length; j++) {
        const r = Math.floor(j / cols), c = j % cols;
        const x = sx + c * (pw + gapX), y = sy + r * (ph + gapY);
        if (p.x >= x - 3 && p.x <= x + pw + 3 && p.y >= y - 4 && p.y <= y + ph + 4) {
          batch[j] = batch[j] ? 0 : 1;
          draw();
          return;
        }
      }
      return;
    }
    const gw = groupW();
    const i = Math.floor((p.x - X0) / gw);
    if (i < 0 || i >= 5) return;
    sel = i;
    const gx = X0 + gw * (i + 0.5);
    hitBlue = p.x < gx - gw * 0.04;
    dragging = i;
    dragMx = maxScale(compute());
    dragMoved = false;
    downY = p.y;
    svg.setPointerCapture(e.pointerId);
    if (hitBlue && p.y <= BASE + 10) setPrior(i, yToPt(p.y, dragMx));
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    if (!hitBlue && Math.abs(p.y - downY) < 8) return;
    dragMoved = true;
    setPrior(dragging, yToPt(p.y, dragMx));
    draw();
  });

  svg.addEventListener('pointerup', () => { dragging = -1; dragMoved = false; });

  function draw() {
    const st = compute();
    const mx = maxScale(st);
    const gw = groupW();
    const bw = NARROW ? 16 : 28;
    const bgap = NARROW ? 3 : 6;
    const k = [];

    // Batch section header + parts
    const { cols, pw, ph, gapX, gapY, sx, sy } = partLayout();
    batch.forEach((fail, j) => {
      const r = Math.floor(j / cols), c = j % cols;
      const x = sx + c * (pw + gapX), y = sy + r * (ph + gapY);
      const col = fail ? C.pink : C.green;
      k.push(
        s('line', { x1: x + pw * 0.34, x2: x + pw * 0.34, y1: y - 4, y2: y, stroke: col, 'stroke-width': 2 }),
        s('line', { x1: x + pw * 0.66, x2: x + pw * 0.66, y1: y - 4, y2: y, stroke: col, 'stroke-width': 2 }),
        s('rect', { x, y, width: pw, height: ph, rx: 5, fill: col, 'fill-opacity': 0.88, stroke: col, 'stroke-width': 1.5, style: 'cursor:pointer' }),
        s('text', { x: x + pw / 2, y: y + ph * 0.68, fill: C.bg, 'font-size': (ph >= 26 ? 13 : 11) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, fail ? 'F' : 'P')
      );
    });

    // Batch count + color legend row
    const legY = CHART_TOP - 24;
    const batchPct = Math.round((st.fails / batch.length) * 100);
    k.push(
      s('text', { x: X0, y: legY, fill: C.ink, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `Batch (${batch.length}): ${st.fails}F / ${st.passes}P (${batchPct}%)`)
    );
    const items = [['Prior', C.cyan], ['Like', C.amber], ['Post', C.green]];
    const itemSpan = NARROW ? 56 : 82;
    const legStart = X1 - items.length * itemSpan + 8;
    items.forEach(([label, col], idx) => {
      const lx = legStart + idx * itemSpan;
      k.push(
        s('rect', { x: lx, y: legY - 10, width: 10, height: 10, rx: 2, fill: col, 'fill-opacity': 0.85 }),
        s('text', { x: lx + 14, y: legY, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, label)
      );
    });

    // Horizontal gridlines (points out of 100)
    const step = mx > 60 ? 20 : 10;
    for (let g = 0; g <= mx; g += step) {
      const y = ptToY(g, mx);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 7, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // Five candidate groups: blue prior (draggable), orange likelihood, green posterior
    const likeMaxPx = (BASE - CHART_TOP) * 0.88;
    RATES.forEach((rate, i) => {
      const cx = X0 + gw * (i + 0.5);
      const xPrior = cx - bw * 1.5 - bgap;
      const xLike = cx - bw * 0.5;
      const xPost = cx + bw * 0.5 + bgap;

      if (i === sel) {
        k.push(s('rect', { x: cx - gw / 2 + 3, y: CHART_TOP - 8, width: gw - 6, height: BASE - CHART_TOP + 38, rx: 8, fill: '#ffffff', 'fill-opacity': 0.05, stroke: C.line }));
      }

      // Prior bar (blue, draggable)
      const yp = ptToY(prior[i], mx), hp = Math.max(2, BASE - yp);
      k.push(
        s('rect', { x: xPrior, y: BASE - hp, width: bw, height: hp, rx: 3, fill: C.cyan, 'fill-opacity': 0.84, stroke: C.cyan, style: 'cursor:ns-resize' }),
        s('line', { x1: xPrior + 4, x2: xPrior + bw - 4, y1: BASE - hp + 4, y2: BASE - hp + 4, stroke: C.bg, 'stroke-width': 2, 'stroke-opacity': 0.65 }),
        s('text', { x: xPrior + bw / 2, y: BASE - hp - 6, fill: C.cyan, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, prior[i])
      );

      // Likelihood score bar (orange, scaled to 0..1)
      const hl = Math.max(2, st.like[i] * likeMaxPx);
      const likeStr = st.like[i] >= 0.995 ? '1' : st.like[i].toFixed(2).replace(/^0/, '');
      k.push(
        s('rect', { x: xLike, y: BASE - hl, width: bw, height: hl, rx: 3, fill: C.amber, 'fill-opacity': 0.82, stroke: C.amber }),
        s('text', { x: xLike + bw / 2, y: BASE - hl - 6, fill: C.amber, 'font-size': 10.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, likeStr)
      );

      // Posterior bar (green, points out of 100)
      const yq = ptToY(st.post[i], mx), hq = Math.max(2, BASE - yq);
      k.push(
        s('rect', { x: xPost, y: BASE - hq, width: bw, height: hq, rx: 3, fill: C.green, 'fill-opacity': 0.86, stroke: C.green }),
        s('text', { x: xPost + bw / 2, y: BASE - hq - 6, fill: C.green, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, st.post[i])
      );

      // Candidate rate label
      k.push(s('text', { x: cx, y: BASE + 22, fill: i === sel ? C.ink : C.muted, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${rate}%`));
    });

    k.push(s('text', { x: (X0 + X1) / 2, y: BASE + 44, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'candidate failure rate'));
    svg.replaceChildren(...k);

    // Formula box for selected candidate rate
    const pSh = st.priorShare[sel].toFixed(2);
    const lSc = st.like[sel] >= 0.995 ? '1.00' : st.like[sel].toFixed(2);
    const pr = st.prod[sel].toFixed(3);
    const tot = st.prodSum.toFixed(3);
    fbox(box, [
      [`Rate ${RATES[sel]}%  (selected)`, C.ink],
      [`prior      = ${pSh}  (${prior[sel]} pts)`, C.cyan],
      [`likelihood = ${lSc}  (best = 1)`, C.amber],
      `product    = ${pSh} × ${lSc} = ${pr}`,
      `sum of 5   = ${tot}`,
      [`posterior  = ${pr} ÷ ${tot} = ${st.post[sel]} pts`, C.green],
    ]);

    const bestIdx = st.post.indexOf(Math.max(...st.post));
    note.textContent = prior[sel] === 0
      ? `${RATES[sel]}% has 0 prior points, so 0 × ${lSc} = 0. Even strong data cannot bring a 0-point prior back.`
      : `Batch share is ${st.fails}/${batch.length} (${batchPct}%). Highest posterior belief is now on ${RATES[bestIdx]}% (${st.post[bestIdx]} points).`;
    selLabel.textContent = `Selected: ${RATES[sel]}% (prior ${prior[sel]} pts)`;

    chal.update({
      prior: prior.slice(),
      post: st.post.slice(),
      fails: st.fails,
      passes: st.passes,
      totalParts: batch.length,
      randomBatches,
      chained
    });
  }

  draw();
  return () => {};
}

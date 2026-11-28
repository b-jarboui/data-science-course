// 5.1.2 Try it: Binomial counts.
// Adjust n (number of tickets) and p (chance each ticket is urgent), tap any bar to inspect k,
// run 1 or 100 simulated batches to watch observed counts match the binomial pattern,
// try random data, and solve 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const URG = '#ff6b4a';

  let n = 5, p = 0.2, kSel = 2;
  let runs = 0, counts = new Array(13).fill(0);
  let lastBatch = [1, 1, 0, 0, 0]; // 1 = urgent, 0 = calm
  let anim = 0, usedRandom = false;

  const comb = (N, K) => {
    if (K < 0 || K > N) return 0;
    let r = 1;
    for (let i = 1; i <= Math.min(K, N - K); i++) r = (r * (N - i + 1)) / i;
    return Math.round(r);
  };
  const pmf = (N, P, K) => comb(N, K) * Math.pow(P, K) * Math.pow(1 - P, N - K);
  const pct = x => (x * 100 >= 1 || x === 0 ? fmt(Math.round(x * 1000) / 10) : (x * 100).toFixed(2)) + '%';

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  // Sliders & numeric labels
  const nVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } });
  const pVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: URG, fontWeight: 700 } });
  const nSlider = h('input', {
    type: 'range', min: 1, max: 12, step: 1, value: n,
    style: { flex: '1 1 120px', accentColor: C.cyan },
    oninput: () => setParams(+nSlider.value, p)
  });
  const pSlider = h('input', {
    type: 'range', min: 5, max: 95, step: 5, value: Math.round(p * 100),
    style: { flex: '1 1 120px', accentColor: URG },
    oninput: () => setParams(n, +pSlider.value / 100)
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: binomial counts'),
    h('p', { class: 'sub' }, 'Change the number of tickets (n) or the urgent chance (p). Tap any bar to inspect that count, or run batches to see the pattern build up.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          h('span', { style: { minWidth: '5.5rem', fontWeight: 600 } }, 'Tickets (n):'),
          btn('−', () => setParams(Math.max(1, n - 1), p)),
          nSlider,
          btn('+', () => setParams(Math.min(12, n + 1), p)),
          nVal),
        h('div', { class: 'sim-row' },
          h('span', { style: { minWidth: '5.5rem', fontWeight: 600 } }, 'Urgent (p):'),
          btn('−', () => setParams(n, Math.max(0.05, Math.round((p - 0.05) * 100) / 100))),
          pSlider,
          btn('+', () => setParams(n, Math.min(0.95, Math.round((p + 0.05) * 100) / 100))),
          pVal),
        h('div', { class: 'sim-row' },
          btn('Run 1 batch', () => { runBatches(1); }, 'go'),
          btn('Run 100 batches', () => { animateBatches(100); }, 'go'),
          btn('New data (random)', () => randomData()),
          btn('Reset (n=5, p=0.2)', () => resetLesson()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'With n = 5 and p = 0.20, tap the bar for the most likely number of urgent tickets.',
      check: st => st.n === 5 && Math.abs(st.p - 0.2) < 1e-6 && st.k === 1,
      why: 'Yes! One urgent ticket happens about 41% of the time—and the balance point n × p is also 1.'
    },
    {
      text: 'Keep n = 5 and change p until the balance point (mean) is exactly 3 urgent tickets.',
      check: st => st.n === 5 && Math.abs(st.mean - 3) < 1e-6,
      why: 'Right: 5 × 0.60 = 3. Raising the chance per ticket slides the whole distribution and its balance point right.'
    },
    {
      text: 'Press “Run 100 batches” so at least 100 batches are simulated. Do the green bars match the exact bars?',
      check: st => st.runs >= 100,
      why: 'With many independent batches, the observed counts line up closely with the exact binomial chances.'
    },
    {
      text: 'Press “New data (random)”, then adjust p until the bars are completely symmetric.',
      check: st => st.usedRandom && Math.abs(st.p - 0.5) < 1e-6,
      why: 'Yes! When p = 0.50, yes and no are equally likely, so the bars mirror each other around n ÷ 2.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 460 : 440, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 38 : 52, X1 = VW - 14;
  const CARD_TOP = 16, CARD_H = NARROW ? 42 : 44;
  const CHART_TOP = NARROW ? 102 : 98, BASE = NARROW ? 386 : 368;

  function clearSim() {
    cancelAnimationFrame(anim);
    runs = 0;
    counts = new Array(13).fill(0);
    lastBatch = Array.from({ length: n }, (_, i) => (i < Math.min(kSel, n) ? 1 : 0));
  }

  function setParams(newN, newP) {
    n = newN;
    p = Math.round(newP * 100) / 100;
    kSel = Math.min(kSel, n);
    nSlider.value = n;
    pSlider.value = Math.round(p * 100);
    clearSim();
    draw();
  }

  function randomData() {
    const newN = rnd(3, 10);
    const choices = [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8];
    const newP = choices[rnd(0, choices.length - 1)];
    usedRandom = true;
    kSel = Math.round(newN * newP);
    setParams(newN, newP);
  }

  function resetLesson() {
    usedRandom = false;
    kSel = 2;
    setParams(5, 0.2);
  }

  function sampleOne() {
    let u = 0;
    const batch = [];
    for (let i = 0; i < n; i++) {
      const isU = Math.random() < p ? 1 : 0;
      batch.push(isU);
      u += isU;
    }
    lastBatch = batch;
    counts[u]++;
    runs++;
    return u;
  }

  function runBatches(count) {
    cancelAnimationFrame(anim);
    let lastU = kSel;
    for (let i = 0; i < count; i++) lastU = sampleOne();
    if (count === 1) kSel = lastU;
    draw();
  }

  function animateBatches(total) {
    cancelAnimationFrame(anim);
    let left = total;
    const step = () => {
      const chunk = Math.min(left, 5);
      for (let i = 0; i < chunk; i++) sampleOne();
      left -= chunk;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Tap/click any bar column to select k
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    if (pt.y < CHART_TOP - 10 || pt.y > BASE + 44) return;
    const sl = (X1 - X0) / (n + 1);
    const idx = Math.floor((pt.x - X0) / sl);
    if (idx >= 0 && idx <= n) {
      kSel = idx;
      draw();
    }
  });

  function draw() {
    const probs = Array.from({ length: n + 1 }, (_, k) => pmf(n, p, k));
    const obs = runs > 0 ? Array.from({ length: n + 1 }, (_, k) => counts[k] / runs) : probs.map(() => 0);
    const maxP = Math.max(0.25, ...probs, ...obs) * 1.15;
    const sl = (X1 - X0) / (n + 1);
    const bw = Math.min(54, sl * 0.72);
    const chartH = BASE - CHART_TOP;
    const el = [];

    // Top strip: latest batch of n glowing ticket cards
    const batchU = lastBatch.reduce((a, b) => a + b, 0);
    const cardGap = 6, cardW = Math.min(44, (X1 - X0 - (n - 1) * cardGap) / n);
    const rowW = n * cardW + (n - 1) * cardGap;
    const startX = X0 + ((X1 - X0) - rowW) / 2;
    el.push(s('text', {
      x: X0, y: CARD_TOP + 12, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas'
    }, runs > 0 ? `Latest batch (#${runs}): ${batchU} urgent of ${n}` : `Sample order: ${batchU} urgent of ${n}`));

    const cY = CARD_TOP + 20;
    lastBatch.forEach((isU, i) => {
      const col = isU ? URG : C.cyan;
      const cx = startX + i * (cardW + cardGap);
      el.push(
        s('rect', { x: cx, y: cY, width: cardW, height: CARD_H - 8, rx: 6, fill: col, 'fill-opacity': 0.22, stroke: col, 'stroke-width': 1.8 }),
        s('text', {
          x: cx + cardW / 2, y: cY + (CARD_H - 8) / 2 + 5 * F, fill: col,
          'font-size': (n > 9 ? 13 : 15) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, isU ? 'U' : 'N')
      );
    });

    // Horizontal gridlines
    const stepG = maxP > 0.6 ? 0.2 : 0.1;
    for (let g = 0; g <= maxP + 1e-6; g += stepG) {
      const y = BASE - (g / maxP) * chartH;
      if (y < CHART_TOP - 4) continue;
      el.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 6, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${Math.round(g * 100)}%`)
      );
    }

    // Legend (top-right of chart)
    if (runs > 0) {
      el.push(
        s('rect', { x: X1 - 154 * F, y: CHART_TOP - 16, width: 10, height: 10, rx: 2, fill: C.cyan, 'fill-opacity': 0.4, stroke: C.cyan }),
        s('text', { x: X1 - 140 * F, y: CHART_TOP - 7, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, 'exact'),
        s('rect', { x: X1 - 88 * F, y: CHART_TOP - 16, width: 10, height: 10, rx: 2, fill: C.green, 'fill-opacity': 0.85 }),
        s('text', { x: X1 - 74 * F, y: CHART_TOP - 7, fill: C.green, 'font-size': 11 * F, 'font-family': 'Consolas' }, `sim (${runs})`)
      );
    }

    // Bars for k = 0..n
    for (let k = 0; k <= n; k++) {
      const cx = X0 + sl * (k + 0.5);
      const isSel = k === kSel;
      const col = isSel ? URG : C.cyan;
      if (isSel) {
        el.push(s('rect', {
          x: cx - sl / 2 + 2, y: CHART_TOP - 4, width: sl - 4, height: BASE - CHART_TOP + 34,
          rx: 7, fill: '#ffffff', 'fill-opacity': 0.05
        }));
      }
      const hExact = Math.max(probs[k] > 1e-6 ? 3 : 0, (probs[k] / maxP) * chartH);
      el.push(s('rect', {
        x: cx - bw / 2, y: BASE - hExact, width: bw, height: hExact, rx: 3,
        fill: col, 'fill-opacity': isSel ? 0.52 : 0.34, stroke: col, 'stroke-width': isSel ? 2.4 : 1.6
      }));

      // Green inner bar for simulated frequency
      if (runs > 0 && obs[k] > 0) {
        const hSim = Math.max(2, (obs[k] / maxP) * chartH);
        const sw = Math.max(6, bw * 0.44);
        el.push(s('rect', {
          x: cx - sw / 2, y: BASE - hSim, width: sw, height: hSim, rx: 2,
          fill: C.green, 'fill-opacity': 0.85
        }));
      }

      // Percentage label above taller or selected bars
      if (isSel || probs[k] >= 0.04 || n <= 6) {
        const topY = BASE - Math.max(hExact, runs > 0 ? (obs[k] / maxP) * chartH : 0) - 6;
        el.push(s('text', {
          x: cx, y: Math.max(CHART_TOP + 10, topY), fill: col,
          'font-size': (n > 8 ? 10 : 12) * F, 'font-weight': isSel ? 700 : 600,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, probs[k] >= 0.005 ? `${Math.round(probs[k] * 100)}%` : '<1%'));
      }

      // Tick label k
      el.push(s('text', {
        x: cx, y: BASE + 24 * F, fill: isSel ? URG : C.ink,
        'font-size': (n > 9 ? 12 : 14) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, k));
    }

    // Baseline and amber balance point (mean = n * p)
    const mean = n * p;
    const xm = X0 + sl * (mean + 0.5);
    el.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: xm, x2: xm, y1: CHART_TOP, y2: BASE, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
      s('polygon', { points: `${xm},${BASE + 1} ${xm - 8},${BASE + 14} ${xm + 8},${BASE + 14}`, fill: C.amber }),
      s('text', {
        x: Math.min(X1 - 52 * F, Math.max(X0 + 52 * F, xm)), y: BASE + 44 * F, fill: C.amber,
        'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `balance = ${fmt(Math.round(mean * 100) / 100)}`)
    );

    svg.replaceChildren(...el);

    // Update controls and formula box
    nVal.textContent = String(n);
    pVal.textContent = p.toFixed(2);

    const ways = comb(n, kSel);
    const oneOrder = Math.pow(p, kSel) * Math.pow(1 - p, n - kSel);
    const exactP = probs[kSel];
    const q = Math.round((1 - p) * 100) / 100;
    const lines = [
      `n = ${n} trials,  p = ${p.toFixed(2)}  (1 − p = ${q.toFixed(2)})`,
      `k = ${kSel} urgent:  C(${n}, ${kSel}) = ${ways} orders`,
      `one order = ${p.toFixed(2)}^${kSel} × ${q.toFixed(2)}^${n - kSel} = ${oneOrder < 0.0001 ? oneOrder.toExponential(1) : oneOrder.toFixed(5)}`,
      [`P(X = ${kSel}) = ${exactP.toFixed(4)}  (${pct(exactP)})`, URG],
      [`balance (mean) = ${n} × ${p.toFixed(2)} = ${fmt(Math.round(mean * 100) / 100)}`, C.amber]
    ];
    if (runs > 0) {
      lines.push([`simulated (${runs} batches): ${counts[kSel]}/${runs} = ${pct(obs[kSel])}`, C.green]);
    }
    fbox(box, lines);

    note.textContent = runs > 0
      ? `Green inner bars show your ${runs} simulated batches. Tap any bar to inspect its formula.`
      : 'Tap any bar to see its exact formula: number of orders times the chance of one order.';

    chal.update({ n, p, k: kSel, mean: Math.round(mean * 1000) / 1000, runs, usedRandom });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

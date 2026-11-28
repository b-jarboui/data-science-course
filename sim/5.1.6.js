// 5.1.6 Try it: Poisson counts.
// Adjust the mean rate and time stretch, simulate random hours (or rush+night hours),
// watch the count bars converge to the Poisson distribution, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const URG = '#fb6f4a';
  const MAX_K = 7; // bins 0, 1, 2, 3, 4, 5, 6, 7+

  let rate = 2.0;        // urgent tickets per hour
  let hours = 1.0;       // 0.5, 1, or 2
  let trap = false;      // false = steady rate, true = half rush (2*mean) + half night (0)
  let selK = 0;          // selected bar k to inspect in formula box
  let counts = new Array(MAX_K + 1).fill(0);
  let samples = [];      // all simulated counts for exact sample mean & variance
  let lastArrivals = [0.24, 0.76];
  let lastWasRush = null;
  let anim = 0;

  const mean = () => Math.round(rate * hours * 100) / 100;
  function fact(k) { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; }
  function poisP(k, m) {
    if (m <= 0) return k === 0 ? 1 : 0;
    return Math.exp(-m) * Math.pow(m, k) / fact(k);
  }
  function poisBins(m) {
    const arr = [];
    let sum = 0;
    for (let k = 0; k < MAX_K; k++) { const p = poisP(k, m); arr.push(p); sum += p; }
    arr.push(Math.max(0, 1 - sum));
    return arr;
  }
  function randPoisson(lam) {
    if (lam <= 0) return 0;
    const L = Math.exp(-lam);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }
  function sampleStats() {
    const n = samples.length;
    if (!n) return { n: 0, sMean: 0, sVar: 0 };
    const sMean = samples.reduce((a, b) => a + b, 0) / n;
    const sVar = samples.reduce((a, b) => a + (b - sMean) * (b - sMean), 0) / n;
    return { n, sMean, sVar };
  }

  function simulateOne() {
    const m = mean();
    let lam = m;
    if (trap) {
      const rush = Math.random() < 0.5;
      lam = rush ? 2 * m : 0;
      lastWasRush = rush;
    } else {
      lastWasRush = null;
    }
    const k = randPoisson(lam);
    samples.push(k);
    counts[Math.min(k, MAX_K)]++;
    lastArrivals = Array.from({ length: Math.min(k, 24) }, () => Math.random()).sort((a, b) => a - b);
  }

  function clearSim() {
    cancelAnimationFrame(anim);
    counts = new Array(MAX_K + 1).fill(0);
    samples = [];
    lastWasRush = null;
    const m = mean();
    const demoK = Math.round(m);
    lastArrivals = Array.from({ length: demoK }, (_, i) => (i + 0.5) / Math.max(1, demoK));
  }

  function runBatch(total) {
    cancelAnimationFrame(anim);
    let left = total;
    const step = () => {
      const chunk = Math.min(left, 6);
      for (let i = 0; i < chunk; i++) simulateOne();
      left -= chunk;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // UI controls
  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const rateOut = h('span', { class: 'sim-pill', style: { color: C.amber, borderColor: C.amber } });
  const rateSlider = h('input', {
    type: 'range', min: '0.5', max: '6', step: '0.5', value: String(rate),
    style: { flex: '1 1 140px', accentColor: C.cyan },
    oninput: e => { rate = parseFloat(e.target.value); clearSim(); draw(); }
  });

  const stretchBtns = [0.5, 1, 2].map(hr => {
    const label = hr === 0.5 ? '½ hour' : hr === 1 ? '1 hour' : '2 hours';
    return { hr, el: btn(label, () => { hours = hr; clearSim(); draw(); }) };
  });
  const steadyBtn = btn('Steady rate', () => { trap = false; clearSim(); draw(); });
  const trapBtn = btn('Rush + night (trap)', () => { trap = true; clearSim(); draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Poisson counts'),
    h('p', { class: 'sub' }, 'Set the average rate and time stretch, then run random hours. Tap any bar to inspect its chance.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Mean rate:'),
          rateSlider, rateOut),
        h('div', { class: 'sim-row' },
          ...stretchBtns.map(b => b.el),
          steadyBtn, trapBtn),
        h('div', { class: 'sim-row' },
          btn('Simulate 1 hour', () => { simulateOne(); draw(); }, 'go'),
          btn('Simulate 100 hours', () => runBatch(100), 'go'),
          btn('New data', () => { clearSim(); runBatch(100); }),
          btn('Reset', () => {
            rate = 2.0; hours = 1.0; trap = false; selK = 0;
            rateSlider.value = '2';
            clearSim(); draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  // Challenges
  const chal = challenges(ch, [
    {
      text: 'With 2 per hour and 1 hour (steady rate), run at least 100 hours. Watch the simulated bars settle onto the Poisson outline.',
      check: st => !st.trap && st.mean === 2 && st.n >= 100,
      why: 'Yes! Over many random hours, the observed bars match the Poisson shape closely, and quiet hours happen near 13.5% of the time.'
    },
    {
      text: 'Switch the stretch to ½ hour (keeping 2 per hour, steady). Notice what happens to the chance of a quiet stretch.',
      check: st => !st.trap && st.rate === 2 && st.hours === 0.5,
      why: 'Half the time halves the mean to 1, so a quiet half hour jumps from 13.5% up to 36.8% (about 37 in 100).'
    },
    {
      text: 'Raise the steady mean until the chance of 0 urgent tickets drops below 5%.',
      check: st => !st.trap && st.p0 < 0.05,
      why: 'Right: once the mean count passes 3 (e^(−3) ≈ 5%), seeing zero arrivals becomes rare.'
    },
    {
      text: 'Turn on “Rush + night (trap)” and run at least 100 hours. Compare the sample variance to the mean.',
      check: st => st.trap && st.n >= 100 && st.sVar > st.sMean * 1.4,
      why: 'Mixing busy rush hours with quiet nights spreads the counts wide, so the variance becomes much bigger than the mean.'
    }
  ]);

  // SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 38 : 54, X1 = VW - 16;
  const STRIP_Y = 34, STRIP_H = 34;
  const TOP = 128, BASE = 388;

  // Tap any bar to select k
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < TOP - 10 || p.y > BASE + 35) return;
    const sl = (X1 - X0) / (MAX_K + 1);
    const k = Math.floor((p.x - X0) / sl);
    if (k >= 0 && k <= MAX_K) { selK = k; draw(); }
  });

  function draw() {
    const m = mean();
    const theo = poisBins(m);
    const { n, sMean, sVar } = sampleStats();
    const obs = counts.map(c => n ? c / n : 0);

    // Update active button styling
    rateOut.textContent = `${fmt(rate)} / hr`;
    stretchBtns.forEach(b => { b.el.className = 'sim-btn' + (b.hr === hours ? ' go' : ''); });
    steadyBtn.className = 'sim-btn' + (!trap ? ' go' : '');
    trapBtn.className = 'sim-btn' + (trap ? ' go' : '');

    const kEls = [];

    // --- Top arrival strip ---
    const mins = Math.round(hours * 60);
    const stripTag = n === 0
      ? `Latest stretch (${mins} min)`
      : trap
        ? `Last stretch (${mins} min · ${lastWasRush ? 'Monday rush' : 'Quiet night'}): ${samples[samples.length - 1]} urgent`
        : `Last stretch (${mins} min): ${samples[samples.length - 1]} urgent`;
    kEls.push(
      s('text', { x: X0, y: STRIP_Y - 10, fill: C.muted, 'font-size': 12.5 * F, 'font-family': 'Consolas' }, stripTag),
      s('rect', { x: X0, y: STRIP_Y, width: X1 - X0, height: STRIP_H, rx: 8, fill: C.bg, stroke: trap ? C.pink : C.cyan, 'stroke-width': 1.8 })
    );
    lastArrivals.forEach(f => {
      const dx = X0 + 10 + f * (X1 - X0 - 20), dy = STRIP_Y + STRIP_H / 2;
      kEls.push(
        s('circle', { cx: dx, cy: dy, r: 9, fill: URG, 'fill-opacity': 0.22 }),
        s('circle', { cx: dx, cy: dy, r: 4.5, fill: URG })
      );
    });
    kEls.push(
      s('text', { x: X0, y: STRIP_Y + STRIP_H + 15, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, '0 min'),
      s('text', { x: X1, y: STRIP_Y + STRIP_H + 15, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${mins} min`)
    );

    // --- Count bars ---
    const maxP = Math.max(0.35, ...theo, ...obs) * 1.12;
    const gridSteps = maxP > 0.6 ? [0, 0.2, 0.4, 0.6, 0.8] : [0, 0.1, 0.2, 0.3, 0.4, 0.5];
    gridSteps.forEach(g => {
      if (g > maxP) return;
      const y = BASE - (g / maxP) * (BASE - TOP);
      kEls.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 7, y: y + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${Math.round(g * 100)}%`)
      );
    });

    const sl = (X1 - X0) / (MAX_K + 1);
    const bw = Math.min(54, sl * 0.68);
    for (let k = 0; k <= MAX_K; k++) {
      const cx = X0 + sl * (k + 0.5);
      if (k === selK) {
        kEls.push(s('rect', { x: cx - sl / 2 + 2, y: TOP - 8, width: sl - 4, height: BASE - TOP + 34, rx: 8, fill: '#ffffff', 'fill-opacity': 0.05 }));
      }
      // Simulated observed bar (filled)
      if (n > 0) {
        const oh = (obs[k] / maxP) * (BASE - TOP);
        const col = trap ? C.pink : URG;
        kEls.push(s('rect', { x: cx - bw * 0.38, y: BASE - oh, width: bw * 0.76, height: oh, rx: 4, fill: col, 'fill-opacity': 0.78 }));
      }
      // Theoretical Poisson bar (glowing cyan outline + soft fill)
      const th = (theo[k] / maxP) * (BASE - TOP);
      kEls.push(s('rect', {
        x: cx - bw / 2, y: BASE - th, width: bw, height: th, rx: 4,
        fill: C.cyan, 'fill-opacity': n > 0 ? 0.14 : 0.48,
        stroke: k === selK ? C.amber : C.cyan, 'stroke-width': k === selK ? 2.6 : 1.8
      }));
      const topPct = Math.round((n > 0 ? obs[k] : theo[k]) * 100);
      const topH = Math.max(th, n > 0 ? (obs[k] / maxP) * (BASE - TOP) : 0);
      kEls.push(
        s('text', { x: cx, y: Math.max(TOP - 2, BASE - topH - 6), fill: k === selK ? C.amber : C.ink, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${topPct}%`),
        s('text', { x: cx, y: BASE + 22, fill: k === selK ? C.amber : C.ink, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, k === MAX_K ? `${MAX_K}+` : String(k))
      );
    }

    // Mean vertical dashed line
    const meanBin = Math.min(MAX_K, m);
    const xm = X0 + sl * (meanBin + 0.5);
    kEls.push(
      s('line', { x1: xm, x2: xm, y1: TOP - 12, y2: BASE, stroke: C.amber, 'stroke-width': 2.4, 'stroke-dasharray': '7 6' }),
      s('text', { x: Math.min(X1 - 36, Math.max(X0 + 36, xm)), y: TOP - 18, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `MEAN ${fmt(m)}`)
    );

    // Legend
    const legY = BASE + 44;
    kEls.push(
      s('rect', { x: X0, y: legY - 10, width: 12, height: 12, rx: 2, fill: C.cyan, 'fill-opacity': 0.25, stroke: C.cyan }),
      s('text', { x: X0 + 18, y: legY, fill: C.muted, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, 'Poisson model'),
      s('rect', { x: X0 + 138 * F, y: legY - 10, width: 12, height: 12, rx: 2, fill: trap ? C.pink : URG, 'fill-opacity': 0.8 }),
      s('text', { x: X0 + 156 * F, y: legY, fill: C.muted, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, n ? `Simulated (${n} hrs)` : 'Simulated (press Simulate)')
    );

    svg.replaceChildren(...kEls);

    // --- Formula box ---
    const pSel = theo[selK];
    const lines = [
      `mean = ${fmt(rate)} × ${fmt(hours)} = ${fmt(m)}`,
      selK < MAX_K
        ? [`P(${selK}) = e^(−${fmt(m)}) × ${fmt(m)}^${selK} ÷ ${selK}! = ${(pSel * 100).toFixed(1)}%`, C.amber]
        : [`P(${MAX_K}+) = 1 − P(0..${MAX_K - 1}) = ${(pSel * 100).toFixed(1)}%`, C.amber],
    ];
    if (n > 0) {
      const obsPct = (obs[selK] * 100).toFixed(1);
      lines.push(`Simulated (${n} hrs): k=${selK === MAX_K ? `${MAX_K}+` : selK} in ${obsPct}%`);
      const match = Math.abs(sVar - sMean) <= Math.max(0.6, sMean * 0.35);
      lines.push([`sample mean = ${sMean.toFixed(2)},  var = ${sVar.toFixed(2)}`, trap || !match ? C.pink : C.green]);
    } else {
      lines.push(['Poisson: mean = variance = ' + fmt(m), C.green]);
    }
    fbox(box, lines);

    note.textContent = trap
      ? 'Trap mode: half the stretches are busy rush hours (rate 2×) and half are quiet nights (rate 0). Watch variance grow much bigger than the mean.'
      : 'Cyan outlines show the exact Poisson chances. Simulate random hours to watch the counts settle onto them.';

    chal.update({ rate, hours, mean: m, trap, n, sMean, sVar, p0: theo[0] });
  }

  clearSim();
  draw();
  return () => cancelAnimationFrame(anim);
}

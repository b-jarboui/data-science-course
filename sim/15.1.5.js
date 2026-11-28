// 15.1.5 Try it: Thompson sampling.
// Each prompt keeps a curve of possible return rates. Step draws one rate from each curve, chooses the higher draw,
// shows the learner's result and updates that curve. Play runs many learners; cumulative regret grows as a curve.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;
  const ORANGE = '#fb923c';
  const RATES = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

  // State
  let pA = 0.50, pB = 0.70, prior = 1, speed = 4, playing = false, timer = null;
  let aA = 2, bA = 1, aB = 1, bB = 2, nA = 1, nB = 1, N = 2, regret = 0, regretHist = [0], last = null;
  let priorRun = 1, autoB = 0, newDataCount = 0;

  // Random draws from a Beta curve: Beta(a, b) = Ga / (Ga + Gb)
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function gamma(k) {   // Marsaglia-Tsang, k >= 1
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do { x = gauss(); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  const drawBeta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };

  // Height of a Beta curve
  const lf = [0];
  const lnFact = n => { while (lf.length <= n) lf.push(lf[lf.length - 1] + Math.log(lf.length)); return lf[n]; };
  const pdf = (a, b, x) => {
    if (x <= 0) return a === 1 ? b : 0;
    if (x >= 1) return b === 1 ? a : 0;
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + lnFact(a + b - 1) - lnFact(a - 1) - lnFact(b - 1));
  };
  const peak = (a, b) => a + b > 2 ? pdf(a, b, (a - 1) / (a + b - 2)) : 1;

  // Layout
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 600 : 440, F = NARROW ? 1.15 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const iterPill = pill('LEARNER 2', C.cyan);
  const label = () => h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const spLabel = label(), prLabel = label(), aLabel = label(), bLabel = label();
  const slider = (min, max, step, value, color, on) => h('input', {
    type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
    style: { flex: '1 1 110px', accentColor: color }, oninput: e => on(+e.target.value)
  });
  const aSlider = slider(0.05, 0.95, 0.05, pA, C.cyan, v => { pA = Math.round(v * 100) / 100; draw(); });
  const bSlider = slider(0.05, 0.95, 0.05, pB, ORANGE, v => { pB = Math.round(v * 100) / 100; draw(); });
  const spSlider = slider(1, 20, 1, speed, C.cyan, v => { speed = v; if (playing) { stopPlay(); startPlay(); } draw(); });
  const prSlider = slider(1, 10, 1, prior, C.violet, v => { prior = v; reset(false); });
  const playBtn = btn('Play', () => togglePlay());
  const labelled = (text, input, lab) => h('div', { class: 'sim-row', style: { alignItems: 'center' } },
    h('span', { class: 'sim-note', style: { margin: 0 } }, text), input, lab);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Thompson sampling'),
    h('p', { class: 'sub' }, 'Each curve shows the return rates that are still possible for a prompt. Step draws one rate from each curve, the app chooses the higher draw, and the learner’s result updates that curve.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.55rem' } }, iterPill),
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stopPlay(); step(); }, 'go'),
          playBtn,
          btn('Reset', () => reset(false)),
          btn('New data', () => newData())),
        h('div', { class: 'sim-row' },
          btn('Give A to a learner', () => { stopPlay(); step('A'); }),
          btn('Give B to a learner', () => { stopPlay(); step('B'); })),
        labelled('Speed:', spSlider, spLabel),
        labelled('Starting numbers:', prSlider, prLabel),
        labelled('Hidden true rate A:', aSlider, aLabel),
        labelled('Hidden true rate B:', bSlider, bLabel)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'B starts looking like 0%. Press Step until the app chooses B by itself.',
      check: st => st.autoB >= 1,
      why: 'B’s curve still allowed high rates, so one of its draws beat A’s draw. That is how Thompson sampling explores.' },
    { text: 'Predict first: with A at 50% and B at 70%, which prompt will get most choices? Then press Play until learner 100.',
      check: st => st.pA === 0.5 && st.pB === 0.7 && st.N >= 100,
      why: 'In most runs B gets far more choices: its curve gathers near 70%, so its draws usually beat A’s.' },
    { text: 'Set the starting numbers to 10, then run at least 60 learners. Do the curves move faster or slower?',
      check: st => st.priorRun >= 10 && st.N >= 60,
      why: 'Slower. Starting at (10, 10) makes the curves narrow around 50% before any result, so each result moves them less.' },
    { text: 'Press New data, then run at least 100 learners. Does the app find the better prompt without being told?',
      check: st => st.newDataCount >= 1 && st.N >= 100,
      why: 'It only sees ✓ and ✕, yet the better prompt’s curve wins the draws more and more often.' },
  ]);

  function step(forced = null) {
    if (N >= 500) { stopPlay(); return; }
    const dA = drawBeta(aA, bA), dB = drawBeta(aB, bB);
    const meanA = aA / (aA + bA), meanB = aB / (aB + bB);
    const arm = forced || (dA >= dB ? 'A' : 'B');
    const p = arm === 'A' ? pA : pB, rew = Math.random() < p ? 1 : 0;
    const before = arm === 'A' ? [aA, bA] : [aB, bB];
    if (arm === 'A') { nA++; if (rew) aA++; else bA++; } else { nB++; if (rew) aB++; else bB++; }
    N++;
    regret += Math.max(pA, pB) - p;
    regretHist.push(regret);
    if (!forced && arm === 'B') autoB++;
    last = { dA, dB, arm, rew, forced: !!forced, before, after: arm === 'A' ? [aA, bA] : [aB, bB], meanA, meanB };
    if (N >= 500) stopPlay();
    draw();
  }

  // Start: A shown once (✓ in the chapter example), B shown once (✕). New data starts with fresh random results.
  function reset(random = false) {
    stopPlay();
    priorRun = prior;
    const a0 = random ? (Math.random() < pA ? 1 : 0) : 1, b0 = random ? (Math.random() < pB ? 1 : 0) : 0;
    aA = prior + a0; bA = prior + 1 - a0; aB = prior + b0; bB = prior + 1 - b0;
    nA = 1; nB = 1; N = 2;
    const m = Math.max(pA, pB);
    regret = (m - pA) + (m - pB);
    regretHist = [0, m - pA, regret];
    autoB = 0; last = null;
    draw();
  }

  function newData() {
    let a = RATES[rnd(0, RATES.length - 1)], b = RATES[rnd(0, RATES.length - 1)];
    while (Math.abs(a - b) < 0.2) b = RATES[rnd(0, RATES.length - 1)];
    pA = a; pB = b;
    aSlider.value = String(pA); bSlider.value = String(pB);
    newDataCount++;
    reset(true);
  }

  function startPlay() {
    if (playing) return;
    if (N >= 500) reset(false);
    playing = true;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => step(), Math.max(45, Math.round(1000 / speed)));
  }
  function stopPlay() {
    playing = false;
    playBtn.textContent = 'Play';
    if (timer !== null) { clearInterval(timer); timer = null; }
  }
  function togglePlay() { if (playing) stopPlay(); else startPlay(); }

  function draw() {
    const els = [];
    const Z = NARROW ? { x0: 40, x1: 385, top: 70, base: 300 } : { x0: 46, x1: 400, top: 70, base: 340 };
    const R = NARROW ? { x0: 50, x1: 385, top: 390, base: 545 } : { x0: 450, x1: 680, top: 70, base: 340 };
    const mono = 'Consolas';

    // --- 1. Curves of possible return rates ---
    const yMax = Math.max(3, peak(aA, bA), peak(aB, bB)) * 1.08;
    const X = r => Z.x0 + r * (Z.x1 - Z.x0), Y = d => Z.base - Math.min(d, yMax) / yMax * (Z.base - Z.top);
    for (const r of [0, 0.25, 0.5, 0.75, 1]) {
      els.push(s('line', { x1: X(r), x2: X(r), y1: Z.top, y2: Z.base, stroke: C.line, 'stroke-opacity': 0.7 }),
        s('text', { x: X(r), y: Z.base + 18, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': mono }, `${r * 100}%`));
    }
    els.push(
      s('line', { x1: Z.x0, x2: Z.x0, y1: Z.top, y2: Z.base, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: Z.x0, x2: Z.x1, y1: Z.base, y2: Z.base, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: (Z.x0 + Z.x1) / 2, y: Z.base + 38, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'possible return rate'),
      s('text', { x: Z.x0 + 6, y: Z.top + 14, fill: C.muted, 'font-size': 12 * F }, '↑ chance'));

    // hidden true rates (the app never sees these)
    [[pA, 'true A', 0], [pB, 'true B', Math.abs(pA - pB) < 0.15 ? 14 : 0]].forEach(([p, nm, dy]) => {
      els.push(s('line', { x1: X(p), x2: X(p), y1: Z.top, y2: Z.base, stroke: C.green, 'stroke-width': 1.5, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.7 }),
        s('text', { x: X(p), y: Z.top - 6 - dy, fill: C.green, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': mono }, nm));
    });

    const path = (a, b) => {
      const pts = [`${X(0)},${Z.base}`];
      for (let i = 0; i <= 120; i++) { const x = i / 120; pts.push(`${X(x).toFixed(1)},${Y(pdf(a, b, x)).toFixed(1)}`); }
      pts.push(`${X(1)},${Z.base}`);
      return pts.join(' ');
    };
    els.push(s('polygon', { points: path(aA, bA), fill: C.cyan, 'fill-opacity': 0.15, stroke: C.cyan, 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      s('polygon', { points: path(aB, bB), fill: ORANGE, 'fill-opacity': 0.12, stroke: ORANGE, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));

    // last draws
    if (last) {
      [[last.dA, aA, bA, C.cyan, 'A', last.arm === 'A'], [last.dB, aB, bB, ORANGE, 'B', last.arm === 'B']].forEach(([d, a, b, col, nm, won], k) => {
        const x = X(d), y = Y(pdf(a, b, d));
        els.push(s('line', { x1: x, x2: x, y1: Z.base, y2: y, stroke: col, 'stroke-width': won ? 3 : 1.5, 'stroke-dasharray': '6 4' }),
          s('circle', { cx: x, cy: y, r: won ? 6 : 4, fill: col }),
          s('text', { x, y: Math.max(Z.top + 12, y - 10 - k * 14), fill: col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, `${nm} ${d.toFixed(2)}`));
      });
    }

    // legends
    els.push(
      s('text', { x: Z.x0, y: Z.top - 46, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'font-family': mono }, `A (quiz)     Beta(${aA}, ${bA}) · chosen ${nA}`),
      s('text', { x: Z.x0, y: Z.top - 28, fill: ORANGE, 'font-size': 13 * F, 'font-weight': 700, 'font-family': mono }, `B (reminder) Beta(${aB}, ${bB}) · chosen ${nB}`));

    // --- 2. Cumulative regret vs learners ---
    const cW = R.x1 - R.x0, cH = R.base - R.top;
    const maxT = Math.max(20, N), maxR = Math.max(2, Math.ceil(regret * 1.15));
    const avg = regret / N;
    els.push(
      s('text', { x: R.x0, y: R.top - 28, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': mono }, 'CUMULATIVE REGRET'),
      s('text', { x: R.x0, y: R.top - 10, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'font-family': mono }, `avg ${avg.toFixed(3)} per learner`));
    for (let i = 0; i <= 4; i++) {
      const val = maxR * i / 4, y = R.base - i / 4 * cH;
      els.push(s('line', { x1: R.x0, x2: R.x1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.65 }),
        s('text', { x: R.x0 - 7, y: y + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': mono }, String(Math.round(val * 10) / 10)));
    }
    els.push(s('line', { x1: R.x0, x2: R.x0, y1: R.top, y2: R.base, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: R.x0, x2: R.x1, y1: R.base, y2: R.base, stroke: C.muted, 'stroke-width': 1.5 }));
    for (const t of [0, Math.round(maxT / 2), maxT]) {
      els.push(s('text', { x: R.x0 + t / maxT * cW, y: R.base + 18, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': mono }, String(t)));
    }
    els.push(s('text', { x: (R.x0 + R.x1) / 2, y: R.base + 36, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'learners'));
    const pts = regretHist.map((r, i) => `${(R.x0 + i / maxT * cW).toFixed(1)},${(R.base - r / maxR * cH).toFixed(1)}`).join(' ');
    els.push(s('polyline', { points: pts, fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    const lx = R.x0 + N / maxT * cW, ly = R.base - regret / maxR * cH;
    els.push(s('circle', { cx: lx, cy: ly, r: 5, fill: C.amber }),
      s('text', { x: Math.min(R.x1 - 6, lx + 8), y: Math.max(R.top + 14, ly - 8), fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': lx > R.x1 - 40 ? 'end' : 'start', 'font-family': mono }, regret.toFixed(2)));

    svg.replaceChildren(...els);

    // --- 3. Formula box and readouts ---
    iterPill.textContent = `LEARNER ${N}  (A: ${nA} · B: ${nB})`;
    spLabel.textContent = `${speed}/sec`;
    prLabel.textContent = `(${prior}, ${prior})`;
    aLabel.textContent = `${Math.round(pA * 100)}%`;
    bLabel.textContent = `${Math.round(pB * 100)}%`;
    const lines = last ? [
      `learner ${N}: draw A ${last.dA.toFixed(2)} · B ${last.dB.toFixed(2)}`,
      [`${last.forced ? 'you chose' : 'higher draw →'} ${last.arm} → ${last.rew ? 'returns ✓ (1)' : 'no return ✕ (0)'}`, last.rew ? C.green : C.muted],
      [`${last.arm}: Beta(${last.before.join(', ')}) → Beta(${last.after.join(', ')})`, last.arm === 'A' ? C.cyan : ORANGE],
    ] : [
      [`start: Beta(${prior}, ${prior}) for each`, C.violet],
      ['A shown once → ✓', C.green],
      ['B shown once → ✕', C.muted],
    ];
    fbox(box, [...lines,
      `first  = ${prior} + returns`,
      `second = ${prior} + no returns`,
      [`regret ${regret.toFixed(2)} (avg ${avg.toFixed(3)})`, C.amber]]);

    if (!last) {
      note.textContent = 'Press Step to watch one learner, or Play to watch many. The green dashed lines are the hidden true rates: the app never sees them.';
    } else if (last.forced) {
      note.textContent = 'You chose this prompt yourself. Its curve still learns from the result.';
    } else if ((last.arm === 'B' && last.meanB < last.meanA) || (last.arm === 'A' && last.meanA < last.meanB)) {
      note.textContent = `${last.arm}’s curve looked worse on average, but its draw was higher this time. That is exploration.`;
    } else if (N >= 500) {
      note.textContent = 'Learner 500 reached. Press Reset or New data to start again.';
    } else {
      note.textContent = 'A drawn rate is only one possible rate. Even a high draw can be followed by a learner who does not return.';
    }

    chal.update({ autoB, N, pA, pB, priorRun, newDataCount });
  }

  reset(false);
  return () => stopPlay();
}

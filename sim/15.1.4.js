// 15.1.4 Try it: Upper confidence bounds (UCB) live simulation.
// Step through choices one by one, run automatically with speed control, adjust the bonus weight k,
// tap a prompt bar to test it directly, generate new hidden rates, and watch cumulative regret grow.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const ORANGE = '#fb923c';

  // State
  let pA = 0.50, pB = 0.70;
  let nA = 1, rA = 1, histA = [1];
  let nB = 1, rB = 0, histB = [0];
  let cumRegret = 0.20, regretHist = [0, 0.20, 0.20];
  let k = 2.0, speed = 4, reveal = false, playing = false, timer = null;
  let steps = 0, stepsAtZero = 0, newDataCount = 0, stepsSinceNewData = 0;
  let lastStep = null;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 550 : 440, F = NARROW ? 1.15 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const iterPill = pill('CHOICE #2', C.cyan);
  const kLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const spLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });

  const kSlider = h('input', {
    type: 'range', min: '0', max: '4', step: '0.2', value: String(k),
    style: { flex: '1 1 110px', accentColor: C.violet },
    oninput: e => { k = Math.round(+e.target.value * 10) / 10; draw(); }
  });
  const spSlider = h('input', {
    type: 'range', min: '1', max: '20', step: '1', value: String(speed),
    style: { flex: '1 1 110px', accentColor: C.cyan },
    oninput: e => { speed = +e.target.value; if (playing) { stopPlay(); startPlay(); } draw(); }
  });

  const playBtn = btn('Play', () => togglePlay());
  const revealBtn = btn('Reveal true rates', () => { reveal = !reveal; revealBtn.textContent = reveal ? 'Hide true rates' : 'Reveal true rates'; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: upper confidence bounds'),
    h('p', { class: 'sub' }, 'Solid bars show each estimated return rate. Transparent violet bars show the uncertainty bonus. Press Step or Play to watch UCB learn, or tap either prompt bar to test it yourself.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.55rem', justifyContent: 'space-between' } },
          iterPill, revealBtn),
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stopPlay(); step(); }, 'go'),
          playBtn,
          btn('Reset', () => reset(false)),
          btn('New data', () => newData())),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Bonus weight k:'), kSlider, kLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed:'), spSlider, spLabel)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Keep k = 2 and press Step until the app tries Prompt B at least once.',
      check: st => st.k === 2 && st.nB >= 2 && st.steps >= 1,
      why: 'Yes! Even with a 0.00 return rate, ignoring B made its uncertainty bonus grow until B beat A’s score.' },
    { text: 'Press Play and run to at least 40 choices (with k = 2). Watch average regret per choice drop.',
      check: st => st.k === 2 && st.N >= 40,
      why: 'As results build up, the bonuses shrink and the app chooses the stronger prompt more often, so average regret falls.' },
    { text: 'Set bonus weight k to 0, press Reset, and run at least 20 choices. Watch what happens with no bonus.',
      check: st => st.k === 0 && st.stepsAtZero >= 18 && st.N >= 20,
      why: 'With k = 0 there is no uncertainty bonus. Once Prompt B starts at 0%, the app can ignore it forever and miss the better prompt!' },
    { text: 'Set k back to 2, press New data, and run to at least 40 choices to see UCB discover the new winner.',
      check: st => st.k === 2 && st.newDataCount >= 1 && st.stepsSinceNewData >= 38 && st.N >= 40,
      why: 'Every time, UCB balances picking the current leader with testing the less-known prompt — without knowing the true rates.' },
  ]);

  function stats() {
    const N = nA + nB;
    const rateA = rA / nA, rateB = rB / nB;
    const bonA = k > 0 ? Math.sqrt(k * Math.log(N) / nA) : 0;
    const bonB = k > 0 ? Math.sqrt(k * Math.log(N) / nB) : 0;
    const scA = rateA + bonA, scB = rateB + bonB;
    return { N, rateA, rateB, bonA, bonB, scA, scB };
  }

  function step(forcedArm = null) {
    const st = stats();
    const arm = forcedArm || (st.scA >= st.scB ? 'A' : 'B');
    const trueP = arm === 'A' ? pA : pB;
    const rew = Math.random() < trueP ? 1 : 0;
    if (arm === 'A') { nA++; rA += rew; histA.push(rew); }
    else { nB++; rB += rew; histB.push(rew); }
    const pStar = Math.max(pA, pB);
    cumRegret += pStar - trueP;
    regretHist.push(cumRegret);
    steps++;
    if (k === 0) stepsAtZero++;
    if (newDataCount > 0) stepsSinceNewData++;
    lastStep = { beforeN: st.N, arm, rew, forced: !!forcedArm, ...st };
    if (nA + nB >= 300) stopPlay();
    draw();
  }

  function reset(freshStart = false) {
    stopPlay();
    const pStar = Math.max(pA, pB);
    if (!freshStart && pA === 0.50 && pB === 0.70) {
      // Exact chapter initial state: A tried once (1), B tried once (0)
      nA = 1; rA = 1; histA = [1];
      nB = 1; rB = 0; histB = [0];
    } else {
      const a0 = Math.random() < pA ? 1 : 0;
      const b0 = Math.random() < pB ? 1 : 0;
      nA = 1; rA = a0; histA = [a0];
      nB = 1; rB = b0; histB = [b0];
    }
    const r1 = pStar - pA, r2 = pStar - pB;
    cumRegret = r1 + r2;
    regretHist = [0, r1, cumRegret];
    steps = 0; stepsAtZero = 0;
    if (freshStart) stepsSinceNewData = 0;
    lastStep = null;
    draw();
  }

  function newData() {
    const pool = [0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85];
    let a = pool[rnd(0, pool.length - 1)], b = pool[rnd(0, pool.length - 1)];
    while (Math.abs(a - b) < 0.20) b = pool[rnd(0, pool.length - 1)];
    pA = a; pB = b;
    newDataCount++;
    stepsSinceNewData = 0;
    reset(true);
  }

  function startPlay() {
    if (playing) return;
    if (nA + nB >= 300) reset(false);
    playing = true;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => step(), Math.max(45, Math.round(1000 / speed)));
  }
  function stopPlay() {
    playing = false;
    playBtn.textContent = 'Play';
    if (timer !== null) { clearInterval(timer); timer = null; }
  }
  function togglePlay() { playing ? stopPlay() : startPlay(); }

  // Direct tap/click on bar A or bar B to test that prompt manually
  const barZone = NARROW
    ? { x0: 44, x1: 382, top: 28, base: 235 }
    : { x0: 44, x1: 332, top: 34, base: 318 };
  const curveZone = NARROW
    ? { x0: 52, x1: 382, top: 356, base: 512 }
    : { x0: 404, x1: 680, top: 54, base: 318 };

  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < barZone.top || p.y > barZone.base + 70 || p.x < barZone.x0 || p.x > barZone.x1) return;
    const mid = (barZone.x0 + barZone.x1) / 2;
    stopPlay();
    step(p.x < mid ? 'A' : 'B');
  });

  function draw() {
    const st = stats();
    const { N, rateA, rateB, bonA, bonB, scA, scB } = st;
    const els = [];

    // --- 1. Stacked UCB Bars ---
    const bX0 = barZone.x0, bX1 = barZone.x1, bTop = barZone.top, bBase = barZone.base;
    const yMax = Math.max(2.4, Math.ceil((Math.max(scA, scB) + 0.3) * 2) / 2);
    const bH = bBase - bTop, unit = bH / yMax;
    const xA = bX0 + (bX1 - bX0) * 0.27, xB = bX0 + (bX1 - bX0) * 0.73;
    const bw = Math.min(82, (bX1 - bX0) * 0.28);

    // Subtle clickable column guides
    els.push(
      s('rect', { x: bX0 + 4, y: bTop, width: (bX1 - bX0) / 2 - 8, height: bH + 64, rx: 10, fill: '#ffffff', 'fill-opacity': 0.02, style: 'cursor:pointer' }),
      s('rect', { x: (bX0 + bX1) / 2 + 4, y: bTop, width: (bX1 - bX0) / 2 - 8, height: bH + 64, rx: 10, fill: '#ffffff', 'fill-opacity': 0.02, style: 'cursor:pointer' })
    );

    // Y gridlines
    const stepTick = yMax > 3.2 ? 1.0 : 0.5;
    for (let g = 0; g <= yMax + 1e-6; g += stepTick) {
      const y = bBase - g * unit;
      const isOne = Math.abs(g - 1) < 1e-6;
      els.push(
        s('line', { x1: bX0, x2: bX1, y1: y, y2: y, stroke: isOne ? C.pink : C.line, 'stroke-opacity': isOne ? 0.55 : 0.7, 'stroke-dasharray': isOne ? '5 4' : null }),
        s('text', { x: bX0 - 7, y: y + 4, fill: isOne ? C.pink : C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(Math.round(g * 10) / 10))
      );
    }
    els.push(
      s('line', { x1: bX0, x2: bX0, y1: bTop, y2: bBase, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: bX0, x2: bX1, y1: bBase, y2: bBase, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: bX0, y: bTop - 10, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'UCB SCORE (tap bar to test)')
    );

    function drawBar(cx, rate, bon, sc, col, name, r, n, hist, isWinner, trueRate) {
      const hRate = Math.max(3, rate * unit);
      const hBon = bon * unit;
      const yRate = bBase - hRate;
      const yTop = bBase - (rate + bon) * unit;
      // Solid return-rate bar
      els.push(s('rect', { x: cx - bw / 2, y: yRate, width: bw, height: hRate, rx: 3, fill: col, 'fill-opacity': rate > 0 ? 0.84 : 0.3, stroke: col, 'stroke-width': 1.5 }));
      // Transparent uncertainty bonus bar
      if (hBon > 1) {
        els.push(s('rect', { x: cx - bw / 2, y: yTop, width: bw, height: Math.max(0, yRate - yTop), rx: 3, fill: C.violet, 'fill-opacity': 0.25, stroke: C.violet, 'stroke-width': 1.8, 'stroke-dasharray': '5 3' }));
        if (yRate - yTop > 18) {
          els.push(s('text', { x: cx, y: (yTop + yRate) / 2 + 4, fill: C.violet, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '+' + bon.toFixed(2)));
        }
      }
      // Score badge above bar
      const badgeW = 54 * F, badgeH = 22 * F, by = Math.max(bTop + 2, yTop - badgeH - 5);
      els.push(
        s('rect', { x: cx - badgeW / 2, y: by, width: badgeW, height: badgeH, rx: 11 * F, fill: C.bg, stroke: isWinner ? C.amber : C.line, 'stroke-width': isWinner ? 2 : 1 }),
        s('text', { x: cx, y: by + 15 * F, fill: isWinner ? C.amber : C.muted, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, sc.toFixed(2))
      );
      // Optional true rate dashed marker
      if (reveal) {
        const yt = bBase - trueRate * unit;
        els.push(
          s('line', { x1: cx - bw / 2 - 8, x2: cx + bw / 2 + 8, y1: yt, y2: yt, stroke: C.green, 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }),
          s('text', { x: cx + bw / 2 + 10, y: yt + 4, fill: C.green, 'font-size': 11 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${Math.round(trueRate * 100)}%`)
        );
      }
      // Prompt name & counts
      els.push(
        s('text', { x: cx, y: bBase + 20, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle' }, name),
        s('text', { x: cx, y: bBase + 38, fill: C.ink, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${r}/${n} (${rate.toFixed(2)})`)
      );
      // Last 10 observed reward dots (green ✓ / grey ✕)
      const recent = hist.slice(-10);
      const cols = Math.min(5, recent.length);
      const sp = 18;
      recent.forEach((v, idx) => {
        const colIdx = idx % 5, rowIdx = Math.floor(idx / 5);
        const rowLen = rowIdx === 0 ? cols : recent.length - 5;
        const dx = cx + (colIdx - (rowLen - 1) / 2) * sp;
        const dy = bBase + 56 + rowIdx * 18;
        const dc = v === 1 ? C.green : C.muted;
        els.push(
          s('circle', { cx: dx, cy: dy, r: 7, fill: dc, 'fill-opacity': 0.2, stroke: dc, 'stroke-width': 1.4 }),
          s('text', { x: dx, y: dy + 3.5, fill: dc, 'font-size': 9.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v === 1 ? '✓' : '✕')
        );
      });
    }

    drawBar(xA, rateA, bonA, scA, C.cyan, 'Prompt A (Quiz)', rA, nA, histA, scA >= scB, pA);
    drawBar(xB, rateB, bonB, scB, ORANGE, 'Prompt B (Reminder)', rB, nB, histB, scB > scA, pB);

    // --- 2. Cumulative Regret vs Choice # Curve ---
    const cX0 = curveZone.x0, cX1 = curveZone.x1, cTop = curveZone.top, cBase = curveZone.base;
    const cW = cX1 - cX0, cH = cBase - cTop;
    const maxT = Math.max(20, N);
    const maxR = Math.max(2, Math.ceil(cumRegret * 1.15));
    const avgReg = cumRegret / N;

    els.push(
      s('text', { x: cX0, y: cTop - 22, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'CUMULATIVE REGRET'),
      s('text', { x: cX1, y: cTop - 22, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `avg ${avgReg.toFixed(3)}/choice`)
    );
    // Horizontal ticks
    for (let i = 0; i <= 4; i++) {
      const val = (maxR * i) / 4, y = cBase - (i / 4) * cH;
      els.push(
        s('line', { x1: cX0, x2: cX1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.65 }),
        s('text', { x: cX0 - 7, y: y + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(Math.round(val * 10) / 10))
      );
    }
    // Axes
    els.push(
      s('line', { x1: cX0, x2: cX0, y1: cTop, y2: cBase, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: cX0, x2: cX1, y1: cBase, y2: cBase, stroke: C.muted, 'stroke-width': 1.5 })
    );
    // X ticks
    for (const t of [0, Math.round(maxT / 2), maxT]) {
      const x = cX0 + (t / maxT) * cW;
      els.push(s('text', { x, y: cBase + 18, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, String(t)));
    }
    els.push(s('text', { x: (cX0 + cX1) / 2, y: cBase + 36, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'total choices'));

    // Polyline path for regret history
    const pts = regretHist.map((r, idx) => `${(cX0 + (idx / maxT) * cW).toFixed(1)},${(cBase - (r / maxR) * cH).toFixed(1)}`).join(' ');
    els.push(s('polyline', { points: pts, fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    const lx = cX0 + (N / maxT) * cW, ly = cBase - (cumRegret / maxR) * cH;
    els.push(
      s('circle', { cx: lx, cy: ly, r: 5, fill: C.amber }),
      s('text', { x: Math.min(cX1 - 6, lx + 8), y: Math.max(cTop + 14, ly - 8), fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, cumRegret.toFixed(2))
    );

    svg.replaceChildren(...els);

    // --- 3. Formula box & Readouts ---
    iterPill.textContent = `CHOICES: ${N}  (A:${nA} · B:${nB})`;
    kLabel.textContent = k === 0 ? 'k = 0 (no bonus)' : `k = ${k.toFixed(1)}`;
    spLabel.textContent = `${speed}/sec`;

    const lastLine = lastStep
      ? [`Last: ${lastStep.forced ? 'tapped' : 'picked'} ${lastStep.arm} → ${lastStep.rew ? 'returned ✓ (+1)' : 'no return ✕ (0)'}`, lastStep.rew ? C.green : C.muted]
      : ['Next: press Step or Play', C.muted];
    fbox(box, [
      `bonus = √(${k.toFixed(1)} × ln(${N}) ÷ n)`,
      [`A: ${rateA.toFixed(2)} + ${bonA.toFixed(2)} = ${scA.toFixed(2)}`, scA >= scB ? C.amber : C.cyan],
      [`B: ${rateB.toFixed(2)} + ${bonB.toFixed(2)} = ${scB.toFixed(2)}`, scB > scA ? C.amber : ORANGE],
      lastLine,
      [`Regret: ${cumRegret.toFixed(2)}  (avg ${avgReg.toFixed(3)}/choice)`, C.amber]
    ]);

    if (k === 0) {
      note.textContent = 'Bonus weight k = 0 turns off exploration. A prompt that starts with 0 returns can be ignored forever!';
    } else if (lastStep && !lastStep.forced && lastStep.arm === 'B' && lastStep.rateB < lastStep.rateA) {
      note.textContent = 'B had a lower estimated rate, but its larger uncertainty bonus gave it the higher score!';
    } else if (reveal) {
      note.textContent = `True hidden return rates: A = ${Math.round(pA * 100)}%, B = ${Math.round(pB * 100)}%. UCB never sees these — it only sees ✓ and ✕.`;
    } else {
      note.textContent = 'Scores can be greater than 1 because they add the uncertainty bonus to the estimated return rate. Tap either bar to test it directly.';
    }

    chal.update({ k, N, nA, nB, steps, stepsAtZero, newDataCount, stepsSinceNewData });
  }

  draw();
  return () => stopPlay();
}

// 15.1.2 Try it: Exploration and exploitation.
// Learners step or run an app choosing between Prompt A (quiz) and Prompt B (reminder),
// tap either card to explore by hand, adjust the exploration chance, watch estimates and
// cumulative regret evolve, and solve 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const ORANGE = '#fb923c';

  let trueA = 0.50, trueB = 0.70;
  let aHist = [1], bHist = [0];
  let steps = 0, cumRegret = 0, regretHist = [0], worstHist = [0];
  let explorePct = 0, speed = 4, reveal = false, usedNewData = false, manualB = 0;
  let lastAction = null; // { arm: 'A'|'B', mode: 'exploit'|'explore'|'manual', reward: 0|1, oldEst, newEst }
  let timer = null;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const playBtn = btn('Play', () => togglePlay(), '');
  const revealBtn = btn('Reveal true rates', () => { reveal = !reveal; revealBtn.textContent = reveal ? 'Hide true rates' : 'Reveal true rates'; draw(); }, 'ghost');
  const expVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.violet, fontWeight: 700 } }, '0%');
  const expSlider = h('input', {
    type: 'range', min: 0, max: 100, step: 5, value: 0,
    style: { accentColor: C.violet, flex: '1 1 130px' },
    oninput: e => { explorePct = +e.target.value; expVal.textContent = explorePct + '%'; draw(); }
  });
  const spdVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } }, '4×');
  const spdSlider = h('input', {
    type: 'range', min: 1, max: 10, step: 1, value: 4,
    style: { accentColor: C.cyan, flex: '1 1 90px' },
    oninput: e => { speed = +e.target.value; spdVal.textContent = speed + '×'; if (timer) { stop(); start(); } }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: explore or exploit'),
    h('p', { class: 'sub' }, 'Prompt A starts at 1/1 (100%) and Prompt B starts at 0/1 (0%). Press Step or Play to watch the app choose, adjust Explore chance, or tap a prompt card to try it yourself.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); stepAuto(); }, 'go'),
          playBtn,
          btn('Reset', () => reset(false)),
          btn('New data (random)', () => reset(true))),
        h('div', { class: 'sim-row' },
          btn('Try A (Quiz)', () => { stop(); takeChoice('A', 'manual'); }),
          btn('Try B (Reminder)', () => { stop(); takeChoice('B', 'manual'); }),
          revealBtn),
        h('div', { class: 'sim-row', style: { justifyContent: 'space-between' } },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.5rem', flex: '1 1 220px', fontSize: '.92rem' } },
            'Explore chance:', expSlider, expVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.5rem', flex: '0 1 180px', fontSize: '.92rem' } },
            'Speed:', spdSlider, spdVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const rateA = () => sum(aHist) / aHist.length;
  const rateB = () => sum(bHist) / bHist.length;
  const bestP = () => Math.max(trueA, trueB);
  const gapP = () => Math.abs(trueB - trueA);
  const pctStr = x => Math.round(x * 1000) / 10 + '%';

  const chal = challenges(ch, [
    {
      text: 'Keep Explore chance at 0% and press Play for at least 15 steps. Watch if Prompt B is ever tried again.',
      check: st => st.steps >= 15 && st.explorePct === 0 && (st.bCount === 1 || st.aCount === 1),
      why: 'With 0% exploration, the prompt that scored 0 first stays stuck at 0% and is never tried again.'
    },
    {
      text: 'Tap Prompt B (or press “Try B”) at least 4 times to explore it and watch its estimate climb from 0%.',
      check: st => st.manualB >= 4 && st.bRate > 0,
      why: 'Yes! Exploring B gathers new results and shows its first zero was just unlucky.'
    },
    {
      text: 'Press Reset, set Explore chance between 10% and 30%, and run at least 30 steps until average regret drops below 0.10.',
      check: st => st.steps >= 30 && st.explorePct >= 10 && st.explorePct <= 30 && st.avgRegret < 0.10,
      why: 'Great balance! Occasional exploration finds the better prompt, then exploitation earns high rewards.'
    },
    {
      text: 'Press “New data”, set Explore chance to 100%, and run at least 20 steps to see too much exploration.',
      check: st => st.usedNewData && st.explorePct === 100 && st.steps >= 20,
      why: 'At 100% exploration the app never uses what it learns, so it wastes half its choices on the worse prompt.'
    }
  ]);

  function takeChoice(arm, mode) {
    const oldEst = arm === 'A' ? rateA() : rateB();
    const p = arm === 'A' ? trueA : trueB;
    const reward = Math.random() < p ? 1 : 0;
    if (arm === 'A') aHist.push(reward);
    else { bHist.push(reward); if (mode === 'manual') manualB++; }
    const newEst = arm === 'A' ? rateA() : rateB();
    steps++;
    cumRegret += bestP() - p;
    regretHist.push(cumRegret);
    worstHist.push(steps * gapP());
    lastAction = { arm, mode, reward, oldEst, newEst };
    draw();
  }

  function stepAuto() {
    const explore = Math.random() * 100 < explorePct;
    if (explore) {
      takeChoice(Math.random() < 0.5 ? 'A' : 'B', 'explore');
    } else {
      const rA = rateA(), rB = rateB();
      // Tie breaks to A, matching chapter 15.1
      takeChoice(rA >= rB ? 'A' : 'B', 'exploit');
    }
  }

  function stepMs() { return Math.round(980 - (speed - 1) * 98); }
  function start() {
    if (timer) return;
    playBtn.textContent = 'Pause';
    playBtn.classList.add('go');
    timer = setInterval(() => {
      if (steps >= 120) { stop(); return; }
      stepAuto();
    }, stepMs());
  }
  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    playBtn.textContent = 'Play';
    playBtn.classList.remove('go');
  }
  function togglePlay() { if (timer) stop(); else start(); }

  function reset(randomNew) {
    stop();
    if (randomNew) {
      usedNewData = true;
      // Fresh hidden probabilities with a clear difference of at least 0.20
      const low = rnd(25, 55) / 100;
      const high = Math.min(0.85, low + rnd(20, 30) / 100);
      if (Math.random() < 0.5) { trueA = low; trueB = high; } else { trueA = high; trueB = low; }
      // Start with one observation each so one looks 100% and one looks 0%, or random initial draws
      aHist = [Math.random() < trueA ? 1 : 0];
      bHist = [Math.random() < trueB ? 1 : 0];
      if (aHist[0] === bHist[0]) {
        // Make one 1 and one 0 so the initial dilemma is clear
        if (trueA < trueB) { aHist = [1]; bHist = [0]; } else { aHist = [0]; bHist = [1]; }
      }
    } else {
      trueA = 0.50; trueB = 0.70;
      aHist = [1]; bHist = [0];
    }
    steps = 0; cumRegret = 0; regretHist = [0]; worstHist = [0];
    manualB = 0; lastAction = null;
    draw();
  }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 520 : 470, F = NARROW ? 1.06 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function drawCard(k, id, x, y, w, hgt, col, title, sub, hist, trueP) {
    const r = sum(hist), n = hist.length, est = r / n;
    const isLast = lastAction && lastAction.arm === id;
    const g = s('g', { style: 'cursor:pointer' });
    g.addEventListener('click', () => { stop(); takeChoice(id, 'manual'); });

    g.append(s('rect', {
      x, y, width: w, height: hgt, rx: 14,
      fill: C.bg, stroke: isLast ? C.ink : col, 'stroke-width': isLast ? 2.6 : 1.8
    }));

    // Icon
    const ix = x + 22, iy = y + 26;
    if (id === 'A') {
      g.append(
        s('rect', { x: ix - 11, y: iy - 11, width: 22, height: 22, rx: 5, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-width': 1.8 }),
        s('text', { x: ix, y: iy + 5, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '?')
      );
    } else {
      g.append(
        s('path', { d: `M${ix - 9},${iy + 5} A9,9 0 0 1 ${ix + 9},${iy + 5} Z`, fill: col, 'fill-opacity': 0.24, stroke: col, 'stroke-width': 1.8 }),
        s('line', { x1: ix - 11, x2: ix + 11, y1: iy + 5, y2: iy + 5, stroke: col, 'stroke-width': 2 }),
        s('circle', { cx: ix, cy: iy + 9, r: 2.5, fill: col })
      );
    }

    g.append(
      s('text', { x: x + 42, y: y + 25, fill: col, 'font-size': 16 * F, 'font-weight': 700 }, title),
      s('text', { x: x + 42, y: y + 42, fill: C.muted, 'font-size': 12 * F }, sub)
    );

    // Last choice badge
    if (isLast) {
      const mCol = lastAction.mode === 'explore' ? C.violet : lastAction.mode === 'manual' ? C.cyan : C.amber;
      const mTxt = (lastAction.mode === 'explore' ? 'EXPLORE' : lastAction.mode === 'manual' ? 'MANUAL' : 'EXPLOIT') +
        (lastAction.reward ? ' +1' : ' 0');
      const bw = 96 * F;
      g.append(
        s('rect', { x: x + w - bw - 10, y: y + 12, width: bw, height: 22, rx: 11, fill: C.card, stroke: mCol, 'stroke-width': 1.4 }),
        s('text', { x: x + w - bw / 2 - 10, y: y + 27, fill: mCol, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, mTxt)
      );
    }

    // Recent reward dots (up to last 20 shown in 2 rows of 10)
    const shown = hist.slice(-20);
    const cols = 10, rad = NARROW ? 6.5 : 8.5, padX = 14, innerW = w - padX * 2;
    const stepX = innerW / cols;
    shown.forEach((val, idx) => {
      const row = Math.floor(idx / cols), colIdx = idx % cols;
      const cx = x + padX + (colIdx + 0.5) * stepX;
      const cy = y + 68 + row * (NARROW ? 20 : 24);
      const dc = val ? C.green : C.muted;
      g.append(
        s('circle', { cx, cy, r: rad, fill: dc, 'fill-opacity': val ? 0.24 : 0.16, stroke: dc, 'stroke-width': 1.5 }),
        s('text', { x: cx, y: cy + 4, fill: dc, 'font-size': (NARROW ? 9.5 : 11), 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, val ? '✓' : '×')
      );
    });
    if (hist.length > 20) {
      g.append(s('text', { x: x + w - 12, y: y + (NARROW ? 108 : 114), fill: C.muted, 'font-size': 10.5, 'text-anchor': 'end', 'font-family': 'Consolas' }, `last 20 of ${n}`));
    }

    // Count & estimated rate
    const statsY = y + (NARROW ? 132 : 138);
    g.append(
      s('text', { x: x + 14, y: statsY, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${r} / ${n} returned`),
      s('text', { x: x + w - 14, y: statsY, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, pctStr(est))
    );

    // Return-rate bar + transparent uncertainty band
    const bx = x + 14, by = statsY + 14, barW = w - 28, barH = 18;
    const hw = Math.min(0.42, 0.42 / Math.sqrt(n));
    const uLo = Math.max(0, est - hw), uHi = Math.min(1, est + hw);
    g.append(
      s('rect', { x: bx, y: by, width: barW, height: barH, rx: 5, fill: C.card, stroke: C.line }),
      s('rect', { x: bx + uLo * barW, y: by - 4, width: Math.max(8, (uHi - uLo) * barW), height: barH + 8, rx: 6, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-opacity': 0.45, 'stroke-width': 1 }),
      s('rect', { x: bx, y: by, width: Math.max(est > 0 ? 4 : 0, est * barW), height: barH, rx: 5, fill: col, 'fill-opacity': 0.86 })
    );

    // Optional revealed true rate marker
    const footY = by + barH + 22;
    if (reveal) {
      const tx = bx + trueP * barW;
      g.append(
        s('line', { x1: tx, x2: tx, y1: by - 6, y2: by + barH + 6, stroke: C.green, 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }),
        s('text', { x: bx, y: footY, fill: C.green, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `True rate: ${Math.round(trueP * 100)}%`)
      );
    } else {
      g.append(
        s('text', { x: bx, y: footY, fill: C.muted, 'font-size': 12 * F }, 'Tap card to try this prompt')
      );
    }

    k.push(g);
  }

  function draw() {
    const k = [];
    const pad = 12, gap = 12, cardW = (VW - pad * 2 - gap) / 2, cardH = NARROW ? 206 : 210;
    drawCard(k, 'A', pad, 10, cardW, cardH, C.cyan, 'Prompt A', 'Quick quiz', aHist, trueA);
    drawCard(k, 'B', pad + cardW + gap, 10, cardW, cardH, ORANGE, 'Prompt B', 'Reminder', bHist, trueB);

    // Cumulative regret curve
    const gx = pad + 44, gy = cardH + 56, gw = VW - gx - 18, gh = VH - gy - 32;
    const maxStep = Math.max(20, steps);
    const maxReg = Math.max(4, worstHist[worstHist.length - 1], cumRegret * 1.15);
    const sx = i => gx + (i / maxStep) * gw;
    const sy = v => gy + gh - (v / maxReg) * gh;

    k.push(
      s('rect', { x: pad, y: cardH + 22, width: VW - pad * 2, height: VH - cardH - 30, rx: 12, fill: C.bg, stroke: C.line }),
      s('text', { x: pad + 14, y: cardH + 42, fill: C.ink, 'font-size': 13.5 * F, 'font-weight': 700 }, 'Cumulative regret (expected returns missed)'),
      s('text', { x: VW - pad - 14, y: cardH + 42, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `Step ${steps}`)
    );

    // Gridlines
    for (let j = 0; j <= 4; j++) {
      const val = (maxReg * j) / 4, y = sy(val);
      k.push(
        s('line', { x1: gx, x2: gx + gw, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.7 }),
        s('text', { x: gx - 8, y: y + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(Math.round(val * 10) / 10))
      );
    }
    // X ticks
    for (let t = 0; t <= maxStep; t += Math.max(5, Math.ceil(maxStep / 4 / 5) * 5)) {
      const x = sx(t);
      k.push(s('text', { x, y: gy + gh + 18, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, t));
    }

    // Reference line: always picking the worse prompt
    const worstPts = worstHist.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
    if (worstHist.length > 1) {
      k.push(s('polyline', { points: worstPts, fill: 'none', stroke: C.muted, 'stroke-width': 1.6, 'stroke-dasharray': '5 5' }));
    }

    // Actual cumulative regret curve
    const regPts = regretHist.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
    if (regretHist.length > 1) {
      k.push(s('polyline', { points: regPts, fill: 'none', stroke: C.pink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    const lx = sx(steps), ly = sy(cumRegret);
    k.push(s('circle', { cx: lx, cy: ly, r: 4.5, fill: C.pink }));

    // Legend inside chart
    const avgReg = steps > 0 ? cumRegret / steps : 0;
    k.push(
      s('text', { x: gx + 8, y: gy + 15, fill: C.pink, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `Regret: ${cumRegret.toFixed(2)}   Avg/step: ${avgReg.toFixed(2)}`),
      s('text', { x: gx + gw - 4, y: gy + 15, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end' }, 'dashed = always worse')
    );

    svg.replaceChildren(...k);

    // Formula box
    const rA = sum(aHist), nA = aHist.length, rB = sum(bHist), nB = bHist.length;
    const stepLine = lastAction
      ? `step ${steps}: ${lastAction.arm} (${lastAction.mode}) → reward ${lastAction.reward}`
      : 'step 0: initial 1 trial each';
    const changeLine = lastAction
      ? `  ${lastAction.arm}: ${pctStr(lastAction.oldEst)} → ${pctStr(lastAction.newEst)}`
      : '  waiting for first choice...';
    fbox(box, [
      [stepLine, lastAction ? (lastAction.reward ? C.green : C.muted) : C.ink],
      [changeLine, lastAction ? (lastAction.arm === 'A' ? C.cyan : ORANGE) : C.muted],
      [`A: ${rA} ÷ ${nA} = ${pctStr(rA / nA)}`, C.cyan],
      [`B: ${rB} ÷ ${nB} = ${pctStr(rB / nB)}`, ORANGE],
      [`avg regret/step = ${avgReg.toFixed(2)}`, C.amber]
    ]);

    if (steps === 0) {
      note.textContent = 'Right now A looks better (100% vs 0%), so exploitation picks A. Try stepping with 0% exploration, then raise Explore chance.';
    } else if (explorePct === 0 && (nA === 1 || nB === 1)) {
      note.textContent = 'With 0% exploration, the app keeps choosing the same prompt and never checks if the other one is actually better.';
    } else if (explorePct === 100) {
      note.textContent = 'At 100% exploration every choice is random, so the app wastes half its choices even after learning which prompt is stronger.';
    } else {
      note.textContent = avgReg < gapP() * 0.55
        ? 'The app is discovering the stronger prompt and using it — notice the regret curve flattening out.'
        : 'Each step balances earning rewards now (exploitation) with checking the less-known prompt (exploration).';
    }

    chal.update({
      steps,
      explorePct,
      aCount: nA,
      bCount: nB,
      aRate: rA / nA,
      bRate: rB / nB,
      avgRegret: avgReg,
      manualB,
      usedNewData
    });
  }

  draw();
  return () => stop();
}

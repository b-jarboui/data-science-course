// 5.1.3 Try it: geometric waiting counts.
// Change the chance p of an urgent ticket, tap any bar to inspect P(Y = k),
// watch single waits or run batches of random waits, and test the memoryless property after 4 calm tickets.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const URG = '#fb713c';
  const KMAX = 12;

  let p = 0.20, sel = 1, afterFour = false;
  let counts = Array(KMAX + 1).fill(0); // 1..KMAX; overflow tracked in totalRuns/totalWait
  let totalRuns = 0, totalWait = 0;
  let lastWait = 0, animStep = 0, animTotal = 0, timer = 0;
  let newDataCount = 0, afterFourRuns = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const pVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: URG } });
  const slider = h('input', { type: 'range', min: '0.10', max: '0.50', step: '0.05', value: '0.20', style: { flex: '1 1 140px', accentColor: URG } });
  const memBtn = btn('After 4 calm: OFF', toggleAfterFour);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: waiting for the first urgent ticket'),
    h('p', { class: 'sub' }, 'Tickets arrive one by one until the first orange urgent card. Adjust the urgent chance, tap any bar, or run fresh random waits.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Chance urgent (p):'),
          slider, pVal),
        h('div', { class: 'sim-row' },
          btn('Watch 1 wait', watchOne, 'go'),
          btn('Run 50 waits', () => runBatch(50)),
          btn('New data', newData),
          memBtn,
          btn('Start again', resetAll))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r3 = x => Math.round(x * 1000) / 1000;
  const r2 = x => Math.round(x * 100) / 100;
  const geomP = k => Math.pow(1 - p, k - 1) * p;
  const theoMean = () => 1 / p;

  const chal = challenges(ch, [
    { text: 'Keep p at 20% and tap bar 3 to check the chance of waiting 3 tickets.',
      check: st => st.sel === 3 && Math.abs(st.p - 0.20) < 1e-6,
      why: 'Yes! Two calm tickets (0.8 × 0.8) then one urgent (0.2) gives 0.128 — exactly 4/5 of bar 2.' },
    { text: 'Move the slider until the average wait is exactly 4 tickets.',
      check: st => Math.abs(st.p - 0.25) < 1e-6,
      why: 'Right: when 1 in 4 tickets is urgent (p = 0.25), the bars balance at 1 ÷ 0.25 = 4 tickets.' },
    { text: 'Press “New data” twice to simulate fresh random waits. Does the average stay close to 1 ÷ p?',
      check: st => st.newDataCount >= 2,
      why: 'Every fresh batch follows the same shrinking staircase, and the observed average stays near 1 ÷ p.' },
    { text: 'Turn on “After 4 calm” and press “New data”. Does the extra wait shrink, or stay near 1 ÷ p?',
      check: st => st.afterFour && st.afterFourRuns >= 50,
      why: 'It stays right near 1 ÷ p! Past calm tickets do not make the next one due — waiting starts fresh.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 42 : 52, X1 = VW - 14, TOP = 114, BASE = 378;
  const slot = () => (X1 - X0) / KMAX;

  function stopAnim() { clearTimeout(timer); timer = 0; animStep = 0; animTotal = 0; }
  function clearRuns() { stopAnim(); counts.fill(0); totalRuns = 0; totalWait = 0; lastWait = 0; }

  // Honest ticket-by-ticket draw. In "after 4 calm" mode, simulate full streams and keep
  // shifts whose first 4 tickets were calm, returning the EXTRA tickets waited after #4.
  function drawWait() {
    if (afterFour) {
      while (true) {
        let ok = true;
        for (let i = 0; i < 4; i++) if (Math.random() < p) { ok = false; break; }
        if (ok) break;
      }
    }
    let w = 1;
    while (Math.random() >= p && w < 200) w++;
    return w;
  }

  function recordWait(w) {
    totalRuns++;
    totalWait += w;
    if (w >= 1 && w <= KMAX) counts[w]++;
    if (afterFour) afterFourRuns++;
    lastWait = w;
  }

  function watchOne() {
    stopAnim();
    const w = drawWait();
    animTotal = w;
    const cap = NARROW ? 7 : 11;
    const steps = Math.min(w, cap);
    animStep = 1;
    draw();
    const tick = () => {
      if (animStep < steps) {
        animStep++;
        draw();
        timer = setTimeout(tick, 220);
      } else {
        animStep = 0;
        animTotal = 0;
        recordWait(w);
        draw();
      }
    };
    if (steps > 1) timer = setTimeout(tick, 220);
    else { animStep = 0; animTotal = 0; recordWait(w); draw(); }
  }

  function runBatch(n) {
    stopAnim();
    for (let i = 0; i < n; i++) recordWait(drawWait());
    draw();
  }

  function newData() {
    clearRuns();
    newDataCount++;
    for (let i = 0; i < 200; i++) recordWait(drawWait());
    draw();
  }

  function toggleAfterFour() {
    afterFour = !afterFour;
    memBtn.textContent = afterFour ? 'After 4 calm: ON' : 'After 4 calm: OFF';
    memBtn.className = afterFour ? 'sim-btn go' : 'sim-btn';
    clearRuns();
    draw();
  }

  function resetAll() {
    p = 0.20; sel = 1; afterFour = false;
    slider.value = '0.20';
    memBtn.textContent = 'After 4 calm: OFF';
    memBtn.className = 'sim-btn';
    clearRuns();
    draw();
  }

  slider.addEventListener('input', () => {
    p = Math.round(parseFloat(slider.value) * 100) / 100;
    clearRuns();
    draw();
  });

  // Tap any bar 1..12 to inspect its formula and step ratio
  const toSvg = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    if (pt.y < TOP - 10 || pt.y > BASE + 32) return;
    const i = Math.floor((pt.x - X0) / slot()) + 1;
    if (i >= 1 && i <= KMAX) { sel = i; draw(); }
  });

  function drawTicketStrip(k) {
    k.push(s('rect', { x: 10, y: 8, width: VW - 20, height: 74, rx: 10, fill: '#0b1020', stroke: afterFour ? C.violet : C.line, 'stroke-width': 1.5 }));
    const title = afterFour
      ? (animTotal ? 'AFTER 4 CALM · WATCHING EXTRA WAIT...' : lastWait ? `AFTER 4 CALM · LAST EXTRA WAIT: ${lastWait}` : 'AFTER 4 CALM · PRESS WATCH OR NEW DATA')
      : (animTotal ? 'WATCHING TICKETS ARRIVE...' : lastWait ? `LAST WAIT: ${lastWait} ${lastWait === 1 ? 'TICKET' : 'TICKETS'}` : 'PRESS “WATCH 1 WAIT” OR “NEW DATA”');
    k.push(s('text', { x: 22, y: 26, fill: afterFour ? C.violet : C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, title));

    const yCard = 36, ch = 36;
    let x = 22;
    if (afterFour) {
      const dw = NARROW ? 22 : 34;
      for (let i = 0; i < 4; i++) {
        k.push(s('rect', { x, y: yCard, width: dw, height: ch, rx: 5, fill: C.muted, 'fill-opacity': 0.12, stroke: C.muted, 'stroke-opacity': 0.55 }),
          s('text', { x: x + dw / 2, y: yCard + 22, fill: C.muted, 'font-size': 10 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, NARROW ? 'c' : 'calm'));
        x += dw + 4;
      }
      k.push(s('line', { x1: x + 3, x2: x + 3, y1: yCard - 2, y2: yCard + ch + 2, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
      x += 12;
    }

    const showing = animTotal ? animStep : lastWait;
    const ended = !animTotal && lastWait > 0;
    const avail = VW - 22 - x;
    const cw = NARROW ? 34 : 46, gap = 5;
    const maxSlots = Math.max(2, Math.floor(avail / (cw + gap)));

    if (!showing) {
      for (let i = 0; i < Math.min(4, maxSlots); i++) {
        k.push(s('rect', { x: x + i * (cw + gap), y: yCard, width: cw, height: ch, rx: 6, fill: C.muted, 'fill-opacity': 0.06, stroke: C.line, 'stroke-dasharray': '4 3' }),
          s('text', { x: x + i * (cw + gap) + cw / 2, y: yCard + 23, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '?'));
      }
      return;
    }

    if (showing <= maxSlots) {
      for (let i = 0; i < showing; i++) {
        const isUrg = ended && i === showing - 1;
        const col = isUrg ? URG : C.cyan;
        k.push(s('rect', { x: x + i * (cw + gap), y: yCard, width: cw, height: ch, rx: 6, fill: col, 'fill-opacity': isUrg ? 0.28 : 0.14, stroke: col, 'stroke-width': isUrg ? 2 : 1.5 }),
          s('text', { x: x + i * (cw + gap) + cw / 2, y: yCard + 22, fill: col, 'font-size': 10.5 * F, 'font-weight': isUrg ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas' }, isUrg ? 'URG' : 'calm'));
      }
    } else {
      const calmCount = showing - (ended ? 1 : 0);
      k.push(s('rect', { x, y: yCard, width: cw, height: ch, rx: 6, fill: C.cyan, 'fill-opacity': 0.14, stroke: C.cyan }),
        s('text', { x: x + cw / 2, y: yCard + 22, fill: C.cyan, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'calm'),
        s('text', { x: x + cw + 46, y: yCard + 22, fill: C.cyan, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `× ${calmCount} calm`));
      if (ended) {
        const ux = x + cw + 92;
        k.push(s('rect', { x: ux, y: yCard, width: cw + 4, height: ch, rx: 6, fill: URG, 'fill-opacity': 0.28, stroke: URG, 'stroke-width': 2 }),
          s('text', { x: ux + (cw + 4) / 2, y: yCard + 22, fill: URG, 'font-size': 10.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'URG'));
      }
    }
  }

  function draw() {
    const sl = slot(), bw = Math.min(40, sl * 0.72);
    const emp = counts.map(c => totalRuns ? c / totalRuns : 0);
    const maxEmp = Math.max(0, ...emp.slice(1));
    const maxY = Math.max(0.25, p * 1.18, maxEmp * 1.12);
    const yOf = val => BASE - (val / maxY) * (BASE - TOP);
    const cxOf = k => X0 + sl * (k - 0.5);

    const k = [];
    drawTicketStrip(k);

    // Horizontal grid lines
    const step = maxY > 0.45 ? 0.10 : 0.05;
    for (let g = 0; g <= maxY + 1e-6; g += step) {
      const y = yOf(g);
      if (y < TOP - 6) continue;
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 6, y: y + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${Math.round(g * 100)}%`));
    }

    // Bars 1..12: theoretical geometric outline + simulated empirical fill
    for (let i = 1; i <= KMAX; i++) {
      const cx = cxOf(i), theo = geomP(i), obs = emp[i];
      const yt = yOf(theo), ht = Math.max(0, BASE - yt);
      if (i === sel) {
        k.push(s('rect', { x: cx - sl / 2 + 2, y: TOP - 6, width: sl - 4, height: BASE - TOP + 6, fill: '#ffffff', 'fill-opacity': 0.05, rx: 6 }));
      }
      // Simulated filled bar
      if (totalRuns > 0 && obs > 0) {
        const yo = yOf(obs), ho = Math.max(0, BASE - yo);
        k.push(s('rect', { x: cx - bw * 0.42, y: yo, width: bw * 0.84, height: ho, rx: 2, fill: URG, 'fill-opacity': 0.55 }));
      }
      // Theoretical staircase bar
      const col = i === sel ? C.amber : C.cyan;
      k.push(s('rect', { x: cx - bw / 2, y: yt, width: bw, height: ht, rx: 2.5, fill: col, 'fill-opacity': totalRuns ? 0.16 : 0.42, stroke: col, 'stroke-width': i === sel ? 2.4 : 1.6 }));

      if (i === sel) {
        k.push(s('text', { x: cx, y: Math.max(TOP + 10, yt - 6), fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r3(theo))));
      }
      k.push(s('text', { x: cx, y: BASE + 20, fill: i === sel ? C.amber : C.muted, 'font-size': 12.5 * F, 'font-weight': i === sel ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas' }, i));
    }

    // X-axis caption & legend
    k.push(s('text', { x: (X0 + X1) / 2, y: BASE + 44, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
      afterFour ? 'extra tickets after 4 calm (tap any bar)' : 'ticket of first urgent (tap any bar)'));

    // Balance point (theoretical mean 1/p)
    const m = theoMean();
    const xm = cxOf(Math.min(KMAX + 0.3, m));
    k.push(
      s('line', { x1: xm, x2: xm, y1: TOP, y2: BASE, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
      s('polygon', { points: `${xm},${BASE} ${xm - 8},${BASE + 12} ${xm + 8},${BASE + 12}`, fill: C.amber }),
      s('rect', { x: Math.min(X1 - 118 * F, Math.max(X0, xm - 56 * F)), y: TOP - 20, width: 112 * F, height: 22, rx: 11, fill: C.bg, stroke: C.amber }),
      s('text', { x: Math.min(X1 - 62 * F, Math.max(X0 + 56 * F, xm)), y: TOP - 5, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEAN ' + fmt(r2(m)))
    );

    // Observed average marker (green) once runs exist
    if (totalRuns > 0) {
      const obsM = totalWait / totalRuns;
      const xo = cxOf(Math.min(KMAX + 0.3, obsM));
      const pillX = Math.min(X1 - 118 * F, Math.max(X0, xo - 56 * F));
      const pillY = Math.abs(xo - xm) < 115 * F ? TOP + 6 : TOP - 20;
      k.push(
        s('line', { x1: xo, x2: xo, y1: pillY + 22, y2: BASE, stroke: C.green, 'stroke-width': 2, 'stroke-opacity': 0.85 }),
        s('circle', { cx: xo, cy: BASE, r: 5, fill: C.green }),
        s('rect', { x: pillX, y: pillY, width: 112 * F, height: 22, rx: 11, fill: C.bg, stroke: C.green }),
        s('text', { x: pillX + 56 * F, y: pillY + 15, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'SIM ' + fmt(r2(obsM)))
      );
    }

    svg.replaceChildren(...k);

    const q = r2(1 - p), pk = r3(geomP(sel));
    const pct = Math.round(p * 100);
    pVal.textContent = `${pct}% (1 in ${fmt(r2(1 / p))})`;

    const lines = [
      `p = ${fmt(p)}   1 − p = ${fmt(q)}`,
      [`P(Y = ${sel}) = ${fmt(q)}^${sel - 1} × ${fmt(p)} = ${fmt(pk)}`, C.amber],
      sel > 1 ? `bar ${sel} ÷ bar ${sel - 1} = ${fmt(q)}` : `first ticket chance = ${fmt(p)}`,
      [`mean wait = 1 ÷ ${fmt(p)} = ${fmt(r2(m))}`, C.amber],
    ];
    if (totalRuns > 0) {
      lines.push([`simulated (${totalRuns}): avg = ${fmt(r2(totalWait / totalRuns))}`, C.green]);
    }
    fbox(box, lines);

    note.textContent = afterFour
      ? 'Memoryless test: every simulated shift started with 4 calm tickets, then counted the EXTRA wait. Notice the staircase and average match 1 ÷ p.'
      : totalRuns > 0
        ? 'Cyan outlines show the exact geometric staircase; orange bars show your simulated waits.'
        : 'Each bar is (1 − p) of the bar before it. Press “Watch 1 wait” or “New data” to test the model with random shifts.';

    chal.update({ p, sel, totalRuns, newDataCount, afterFour, afterFourRuns });
  }

  draw();
  return () => stopAnim();
}

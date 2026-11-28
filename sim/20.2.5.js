// 20.2.5 Try it: Reward modeling — score gap, sigmoid chance, and training steps.
// Drag chosen (A) and rejected (B) scores, step or run training, adjust learning rate,
// watch the sigmoid and loss curve update live, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const BLUE = '#60a5fa';

  const sig = g => 1 / (1 + Math.exp(-g));
  const lossOf = g => Math.log(1 + Math.exp(-g));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r2 = x => Math.round(x * 100) / 100;
  const sgn = v => (v > 0.004 ? '+' : v < -0.004 ? '−' : '') + Math.abs(v).toFixed(2);

  let rA = 0, rB = 0, lr = 1.0, speed = 2, step = 0;
  let history = [lossOf(0)];
  let lastStep = null; // { oldA, oldB, oldGap, oldP, oldLoss, change, newA, newB, newGap, newP, newLoss }
  let timer = null;
  let usedStep = false, usedPlay = false, startedBackwards = false;

  const svg = s('svg', { viewBox: '0 0 700 430' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const statsRow = h('div', { class: 'sim-row', style: { marginTop: '0', marginBottom: '.65rem' } });

  const lrVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } }, '1.0');
  const lrIn = h('input', {
    type: 'range', min: '0.1', max: '4.0', step: '0.1', value: '1.0',
    oninput: e => { lr = +e.target.value; lrVal.textContent = lr.toFixed(1); draw(); }
  });
  const spdVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } }, '2/s');
  const spdIn = h('input', {
    type: 'range', min: '1', max: '10', step: '1', value: '2',
    oninput: e => { speed = +e.target.value; spdVal.textContent = `${speed}/s`; if (timer) { stopPlay(); startPlay(); } }
  });
  const playBtn = btn('Play', togglePlay, 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: train a reward model'),
    h('p', { class: 'sub' }, 'People prefer Reply A (“At six.”) over Reply B (long). Drag A or B on the score line, or step through training and watch the chance rise and the loss fall.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        statsRow,
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stopPlay(); usedStep = true; doStep(); }, 'go'),
          playBtn,
          btn('Reset', resetAll),
          btn('New start (random)', randomStart),
          btn('Shift both +1', shiftBoth)),
        h('div', { class: 'sim-row', style: { gap: '1rem' } },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.94rem' } },
            'Learning rate: ', lrIn, lrVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.94rem' } },
            'Speed: ', spdIn, spdVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Press Step three times with learning rate 1.0 so the loss drops below 0.15.',
      check: st => st.usedStep && st.step >= 3 && st.loss < 0.15 && Math.abs(st.lr - 1.0) < 0.05,
      why: 'Yes! Each step adds (1 − chance) to A and subtracts it from B. As chance climbs (50% → 73% → 82% → 87%), the updates shrink and loss falls.'
    },
    {
      text: 'Drag A and B to new positions (not 0 and 0) with a gap of 2.0 so A’s chance is about 88%.',
      check: st => Math.abs((st.rA - st.rB) - 2.0) <= 0.14 && (Math.abs(st.rA) > 0.15 || Math.abs(st.rB) > 0.15),
      why: 'Right! Whether scores are (+1, −1) or (+2, 0) or (+3, +1), any pair with gap 2 gives 88%. Try “Shift both +1” — only the gap matters.'
    },
    {
      text: 'Press Reset, lower learning rate to 0.2 or less, and press Step 3 times. See how slowly the loss drops.',
      check: st => st.lr <= 0.21 && st.step >= 3 && st.loss > 0.45,
      why: 'With a tiny learning rate, each nudge is small, so 3 steps barely move the scores or the loss.'
    },
    {
      text: 'Drag B above A (or press New start until B > A), then press Play until the loss falls below 0.10.',
      check: st => st.startedBackwards && st.usedPlay && st.loss < 0.10,
      why: 'Even from a bad start where the model prefers B, repeated steps pull A past B and drive the loss near zero.'
    },
  ]);

  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function startPlay() {
    usedPlay = true;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      doStep();
      if (step >= 60 || lossOf(rA - rB) < 0.005) stopPlay();
    }, Math.round(1000 / speed));
  }
  function togglePlay() {
    if (timer) stopPlay();
    else startPlay();
  }

  function resetAll() {
    stopPlay();
    rA = 0; rB = 0; step = 0;
    history = [lossOf(0)];
    lastStep = null;
    startedBackwards = false;
    draw();
  }
  function randomStart() {
    stopPlay();
    rA = rnd(-25, 25) / 10;
    rB = rnd(-25, 25) / 10;
    step = 0;
    history = [lossOf(rA - rB)];
    lastStep = null;
    startedBackwards = rB > rA + 0.05;
    draw();
  }
  function shiftBoth() {
    stopPlay();
    if (Math.max(rA, rB) + 1 > 6) {
      rA = r2(rA - 1); rB = r2(rB - 1);
    } else {
      rA = r2(rA + 1); rB = r2(rB + 1);
    }
    lastStep = null;
    draw();
  }

  function doStep() {
    const oldA = rA, oldB = rB, oldGap = oldA - oldB;
    const oldP = sig(oldGap), oldLoss = lossOf(oldGap);
    const change = lr * (1 - oldP);
    rA = clamp(oldA + change, -6, 6);
    rB = clamp(oldB - change, -6, 6);
    step++;
    const newGap = rA - rB, newP = sig(newGap), newLoss = lossOf(newGap);
    history.push(newLoss);
    lastStep = { oldA, oldB, oldGap, oldP, oldLoss, change, newA: rA, newB: rB, newGap, newP, newLoss };
    draw();
  }

  // Responsive geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 560 : 430, F = NARROW ? 1.08 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const NL = NARROW
    ? { x0: 36, x1: 384, y: 76 }
    : { x0: 48, x1: 652, y: 78 };
  const SIG = NARROW
    ? { x0: 54, x1: 384, y0: 325, y1: 175 }
    : { x0: 56, x1: 326, y0: 388, y1: 178 };
  const LOS = NARROW
    ? { x0: 54, x1: 384, y0: 530, y1: 385 }
    : { x0: 396, x1: 668, y0: 388, y1: 178 };

  const lim = () => Math.max(4, Math.ceil(Math.max(Math.abs(rA), Math.abs(rB)) + 0.4));
  const nlx = v => NL.x0 + (v + lim()) / (2 * lim()) * (NL.x1 - NL.x0);
  const x2nl = x => ((x - NL.x0) / (NL.x1 - NL.x0) * 2 - 1) * lim();

  // Drag dot A or dot B on the number line
  let drag = null;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (Math.abs(p.y - NL.y) > 52) return;
    const xA = nlx(rA), xB = nlx(rB);
    const dA = Math.hypot(p.x - xA, p.y - (NL.y - 16));
    const dB = Math.hypot(p.x - xB, p.y - (NL.y + 16));
    if (Math.min(dA, dB) > 48) return;
    drag = dA <= dB ? 'A' : 'B';
    stopPlay();
    svg.setPointerCapture(e.pointerId);
    onDrag(e);
  });
  function onDrag(e) {
    if (!drag) return;
    const p = toSvg(e);
    const val = clamp(Math.round(x2nl(p.x) * 10) / 10, -4, 4);
    if (drag === 'A') rA = val;
    else rB = val;
    step = 0;
    history = [lossOf(rA - rB)];
    lastStep = null;
    startedBackwards = rB > rA + 0.05;
    draw();
  }
  svg.addEventListener('pointermove', onDrag);
  svg.addEventListener('pointerup', () => { drag = null; draw(); });
  svg.addEventListener('pointercancel', () => { drag = null; draw(); });

  function draw() {
    const gap = rA - rB, p = sig(gap), loss = lossOf(gap), L = lim();
    const k = [];

    // --- 1. Score Number Line ---
    k.push(
      s('text', { x: NL.x0, y: 24, fill: C.muted, 'font-size': 13 * F, 'font-family': 'Consolas', 'font-weight': 700 }, 'REWARD SCORES  (DRAG A OR B)'),
      s('line', { x1: NL.x0, x2: NL.x1, y1: NL.y, y2: NL.y, stroke: C.muted, 'stroke-width': 2.5 })
    );
    for (let v = -L; v <= L; v++) {
      const x = nlx(v);
      k.push(
        s('line', { x1: x, x2: x, y1: NL.y - 6, y2: NL.y + 6, stroke: v === 0 ? C.ink : C.line, 'stroke-width': v === 0 ? 2 : 1.5 }),
        s('text', { x, y: NL.y + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v > 0 ? `+${v}` : String(v))
      );
    }
    const xA = nlx(rA), xB = nlx(rB);
    // Gap bar between B and A
    if (Math.abs(xA - xB) > 2) {
      k.push(
        s('line', { x1: xB, x2: xA, y1: NL.y, y2: NL.y, stroke: gap >= 0 ? C.amber : C.pink, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .85 }),
        s('text', { x: (xA + xB) / 2, y: NL.y + 42, fill: gap >= 0 ? C.amber : C.pink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `gap = ${sgn(gap)}`)
      );
    }
    // Dots A (above) and B (below/on line)
    const yA = NL.y - 14, yB = NL.y + 14;
    k.push(
      s('circle', { cx: xA, cy: yA, r: drag === 'A' ? 19 : 15, fill: C.cyan, 'fill-opacity': .2 }),
      s('circle', { cx: xA, cy: yA, r: 9, fill: C.cyan, stroke: C.bg, 'stroke-width': 2, style: 'cursor:grab' }),
      s('text', { x: xA, y: yA - 16, fill: C.cyan, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `A: ${sgn(rA)}`),

      s('circle', { cx: xB, cy: yB, r: drag === 'B' ? 19 : 15, fill: BLUE, 'fill-opacity': .2 }),
      s('circle', { cx: xB, cy: yB, r: 9, fill: BLUE, stroke: C.bg, 'stroke-width': 2, style: 'cursor:grab' }),
      s('text', { x: xB, y: yB + 26, fill: BLUE, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `B: ${sgn(rB)}`)
    );

    // --- 2. Sigmoid Curve ---
    const gMax = Math.max(4, Math.ceil(Math.abs(gap) + 0.5));
    const sx = g => SIG.x0 + (clamp(g, -gMax, gMax) + gMax) / (2 * gMax) * (SIG.x1 - SIG.x0);
    const sy = pv => SIG.y0 - pv * (SIG.y0 - SIG.y1);
    k.push(
      s('text', { x: (SIG.x0 + SIG.x1) / 2, y: SIG.y1 - 14, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'SIGMOID: GAP → CHANCE'),
      s('line', { x1: SIG.x0, x2: SIG.x1, y1: SIG.y0, y2: SIG.y0, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: SIG.x0, x2: SIG.x0, y1: SIG.y0, y2: SIG.y1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: SIG.x0, x2: SIG.x1, y1: sy(0.5), y2: sy(0.5), stroke: C.line, 'stroke-dasharray': '5 5' }),
      s('line', { x1: sx(0), x2: sx(0), y1: SIG.y0, y2: SIG.y1, stroke: C.line, 'stroke-dasharray': '5 5' })
    );
    [[0, '0%'], [0.5, '50%'], [1, '100%']].forEach(([v, txt]) => {
      k.push(s('text', { x: SIG.x0 - 7, y: sy(v) + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, txt));
    });
    [-gMax, 0, gMax].forEach(v => {
      k.push(s('text', { x: sx(v), y: SIG.y0 + 17, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v > 0 ? `+${v}` : String(v)));
    });
    const pts = [];
    for (let i = 0; i <= 50; i++) {
      const g = -gMax + i * (2 * gMax / 50);
      pts.push(`${sx(g).toFixed(1)},${sy(sig(g)).toFixed(1)}`);
    }
    const px = sx(gap), py = sy(p);
    k.push(
      s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 3 }),
      s('line', { x1: px, x2: px, y1: SIG.y0, y2: py, stroke: C.amber, 'stroke-dasharray': '4 4', 'stroke-width': 1.5 }),
      s('line', { x1: SIG.x0, x2: px, y1: py, y2: py, stroke: C.amber, 'stroke-dasharray': '4 4', 'stroke-width': 1.5 }),
      s('circle', { cx: px, cy: py, r: 7, fill: C.amber, stroke: C.bg, 'stroke-width': 2 }),
      s('text', { x: clamp(px + (gap > 0 ? -36 : 36), SIG.x0 + 34, SIG.x1 - 30), y: clamp(py - 12, SIG.y1 + 16, SIG.y0 - 8),
        fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${Math.round(p * 100)}%`)
    );

    // --- 3. Loss vs Iteration Curve ---
    const maxStep = Math.max(10, history.length - 1);
    const maxLoss = Math.max(0.8, Math.ceil(Math.max(...history) * 5) / 5);
    const lx = i => LOS.x0 + i / maxStep * (LOS.x1 - LOS.x0);
    const ly = v => LOS.y0 - clamp(v, 0, maxLoss) / maxLoss * (LOS.y0 - LOS.y1);
    k.push(
      s('text', { x: (LOS.x0 + LOS.x1) / 2, y: LOS.y1 - 14, fill: C.pink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'LOSS VS ITERATION'),
      s('line', { x1: LOS.x0, x2: LOS.x1, y1: LOS.y0, y2: LOS.y0, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: LOS.x0, x2: LOS.x0, y1: LOS.y0, y2: LOS.y1, stroke: C.muted, 'stroke-width': 1.5 })
    );
    [0, maxLoss / 2, maxLoss].forEach(v => {
      k.push(
        s('line', { x1: LOS.x0, x2: LOS.x1, y1: ly(v), y2: ly(v), stroke: C.line, 'stroke-dasharray': '4 4' }),
        s('text', { x: LOS.x0 - 7, y: ly(v) + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, v.toFixed(1))
      );
    });
    [0, Math.round(maxStep / 2), maxStep].forEach(v => {
      k.push(s('text', { x: lx(v), y: LOS.y0 + 17, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, String(v)));
    });
    if (history.length > 1) {
      const lpts = history.map((v, i) => `${lx(i).toFixed(1)},${ly(v).toFixed(1)}`).join(' ');
      k.push(s('polyline', { points: lpts, fill: 'none', stroke: C.pink, 'stroke-width': 3 }));
    }
    history.forEach((v, i) => {
      const isLast = i === history.length - 1;
      if (isLast || history.length <= 16) {
        k.push(s('circle', { cx: lx(i), cy: ly(v), r: isLast ? 6 : 3.5, fill: C.pink, stroke: isLast ? C.bg : 'none', 'stroke-width': 1.5 }));
      }
    });
    const lastX = lx(history.length - 1), lastY = ly(history[history.length - 1]);
    k.push(s('text', { x: clamp(lastX + 22, LOS.x0 + 26, LOS.x1 - 24), y: clamp(lastY - 10, LOS.y1 + 14, LOS.y0 - 8),
      fill: C.pink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, loss.toFixed(2)));

    svg.replaceChildren(...k);

    // Top live status pills
    statsRow.replaceChildren(
      pill(`STEP ${step}`, C.amber),
      pill(`GAP ${sgn(gap)}`, gap >= 0 ? C.cyan : C.pink),
      pill(`CHANCE ${Math.round(p * 100)}%`, C.green),
      pill(`LOSS ${loss.toFixed(2)}`, C.pink)
    );

    // Formula box
    if (lastStep) {
      const st = lastStep;
      fbox(box, [
        [`step ${step}   (lr = ${lr.toFixed(1)})`, C.amber],
        `old:    A = ${sgn(st.oldA)},  B = ${sgn(st.oldB)}`,
        [`change = ${lr.toFixed(1)} × (1 − ${st.oldP.toFixed(2)}) = ${st.change.toFixed(2)}`, C.amber],
        [`new:    A = ${sgn(st.newA)},  B = ${sgn(st.newB)}`, C.cyan],
        [`gap = ${sgn(st.newGap)}  →  chance = ${Math.round(st.newP * 100)}%`, C.green],
        [`loss:   ${st.oldLoss.toFixed(2)} → ${st.newLoss.toFixed(2)}`, C.pink]
      ]);
    } else {
      const nextChg = lr * (1 - p);
      fbox(box, [
        [`step ${step}   (lr = ${lr.toFixed(1)})`, C.muted],
        [`A = ${sgn(rA)},  B = ${sgn(rB)}`, C.cyan],
        [`gap    = A − B = ${sgn(gap)}`, C.amber],
        [`chance = sigmoid(${fmt(r2(gap))}) = ${Math.round(p * 100)}%`, C.green],
        [`loss   = −ln(${p.toFixed(2)}) = ${loss.toFixed(2)}`, C.pink],
        [`next change = ${lr.toFixed(1)} × (1 − ${p.toFixed(2)}) = ${nextChg.toFixed(2)}`, C.muted]
      ]);
    }

    note.textContent = gap < 0
      ? 'Right now B has a higher score than A, so the model is surprised (high loss). Press Step or Play to push A above B.'
      : 'Notice how each step shrinks as A’s chance nears 100%, because (1 − chance) gets smaller.';

    chal.update({ rA, rB, lr, step, loss, usedStep, usedPlay, startedBackwards });
  }

  draw();
  return () => stopPlay();
}

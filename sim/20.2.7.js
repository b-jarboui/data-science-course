// 20.2.7 Try it: Reference-policy penalties (KL-regularized learning).
// Learners step through or animate reward training with a frozen reference policy,
// adjust strength (penalty weight) and learning rate, drag chance bars directly,
// generate fresh random datasets, and solve 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const BLUE = '#60a5fa';
  const ORANGE = '#fb923c';
  const RCOL = [C.cyan, BLUE, C.pink, ORANGE];
  const LETTERS = ['A', 'B', 'C', 'D'];
  const NAMES = ['At six.', 'Long answer', 'At nine.', 'At six! ×3'];

  const DEFAULT_REF = [0.40, 0.40, 0.15, 0.05];
  const DEFAULT_REW = [2.0, 0.5, -1.5, 3.0];

  let ref = DEFAULT_REF.slice();
  let rew = DEFAULT_REW.slice();
  let custom = false;
  let beta = 1.0;
  let lr = 0.4;
  let speed = 3; // steps per second
  let iter = 0;
  let playing = false;
  let timer = null;
  let lastStepInfo = null;

  let z = ref.map(p => Math.log(p));
  let p = ref.slice();
  let hist = [];

  const softmax = arr => {
    const mx = Math.max(...arr);
    const ex = arr.map(v => Math.exp(Math.max(-25, Math.min(25, v - mx))));
    const sm = ex.reduce((a, b) => a + b, 0);
    return ex.map(v => v / sm);
  };

  function metrics(prob) {
    let avgR = 0, kl = 0;
    const penR = [];
    for (let i = 0; i < 4; i++) {
      const pi = Math.max(1e-9, prob[i]);
      const ratio = pi / ref[i];
      const lnRat = Math.log(ratio);
      avgR += prob[i] * rew[i];
      kl += prob[i] > 1e-7 ? prob[i] * lnRat : 0;
      penR.push(rew[i] - beta * lnRat);
    }
    const score = avgR - beta * kl;
    return { avgR, kl: Math.max(0, kl), score, penR };
  }

  function resetHistory() {
    iter = 0;
    z = ref.map(v => Math.log(v));
    p = ref.slice();
    lastStepInfo = null;
    const m = metrics(p);
    hist = [{ iter: 0, score: m.score, avgR: m.avgR, pen: beta * m.kl }];
  }
  resetHistory();

  function stop() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
    playBtn.className = 'sim-btn go';
  }

  function stepOnce() {
    const before = metrics(p);
    // Natural gradient / mirror ascent step for KL-regularized objective
    const effLr = lr / Math.max(1, beta);
    const dz = p.map((_, i) => effLr * (before.penR[i] - before.score));
    z = z.map((v, i) => v + dz[i]);
    // Keep logits centered to avoid numeric drift
    const zm = z.reduce((a, b) => a + b, 0) / 4;
    z = z.map(v => Math.max(-14, Math.min(14, v - zm)));
    p = softmax(z);
    iter++;
    const after = metrics(p);
    hist.push({ iter, score: after.score, avgR: after.avgR, pen: beta * after.kl });
    if (hist.length > 160) hist = hist.slice(-160);
    lastStepInfo = {
      dScore: after.score - before.score,
      dPenR: after.penR[3],
      dChance: p[3] * 100,
    };
    draw();
  }

  function togglePlay() {
    if (playing) { stop(); return; }
    playing = true;
    playBtn.textContent = 'Pause';
    playBtn.className = 'sim-btn';
    timer = setInterval(stepOnce, Math.round(1000 / speed));
  }

  function restartTimer() {
    if (!playing) return;
    clearInterval(timer);
    timer = setInterval(stepOnce, Math.round(1000 / speed));
  }

  function newData() {
    stop();
    const rA = rnd(30, 44), rB = rnd(26, 38), rD = rnd(3, 8);
    const rC = 100 - rA - rB - rD;
    ref = [rA / 100, rB / 100, rC / 100, rD / 100];
    rew = [
      Math.round((1.6 + Math.random() * 0.8) * 10) / 10,
      Math.round((0.2 + Math.random() * 0.6) * 10) / 10,
      -Math.round((1.0 + Math.random() * 1.0) * 10) / 10,
      Math.round((2.6 + Math.random() * 0.8) * 10) / 10,
    ];
    custom = true;
    resetHistory();
    draw();
  }

  // Controls & layout
  const svgBars = s('svg', { viewBox: '0 0 700 265' });
  const svgCurve = s('svg', { viewBox: '0 0 700 160' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const iterPill = pill('ITERATION 0', C.cyan);

  const playBtn = btn('Play', togglePlay, 'go');
  const stepBtn = btn('Step', () => { stop(); stepOnce(); });
  const resetBtn = btn('Reset', () => { stop(); resetHistory(); draw(); });
  const origBtn = btn('Library example', () => {
    stop(); ref = DEFAULT_REF.slice(); rew = DEFAULT_REW.slice(); custom = false; resetHistory(); draw();
  });
  const randBtn = btn('New data (random)', newData);

  const betaVal = h('strong', { style: { color: C.amber, fontFamily: 'Consolas, monospace' } }, '1.0');
  const betaSlider = h('input', {
    type: 'range', min: '0', max: '12', step: '0.5', value: '1',
    style: { flex: '1', minWidth: '110px', accentColor: C.amber },
    oninput: e => {
      beta = parseFloat(e.target.value);
      betaVal.textContent = fmt(beta);
      const m = metrics(p);
      if (hist.length) hist[hist.length - 1] = { iter, score: m.score, avgR: m.avgR, pen: beta * m.kl };
      draw();
    },
  });

  const lrVal = h('strong', { style: { color: C.cyan, fontFamily: 'Consolas, monospace' } }, '0.4');
  const lrSlider = h('input', {
    type: 'range', min: '0.1', max: '1.6', step: '0.1', value: '0.4',
    style: { flex: '1', minWidth: '90px', accentColor: C.cyan },
    oninput: e => { lr = parseFloat(e.target.value); lrVal.textContent = fmt(lr); draw(); },
  });

  const spdVal = h('strong', { style: { color: C.green, fontFamily: 'Consolas, monospace' } }, '3/s');
  const spdSlider = h('input', {
    type: 'range', min: '1', max: '10', step: '1', value: '3',
    style: { flex: '1', minWidth: '80px', accentColor: C.green },
    oninput: e => { speed = parseInt(e.target.value, 10); spdVal.textContent = `${speed}/s`; restartTimer(); },
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Reference-policy penalties'),
    h('p', { class: 'sub' }, 'Ghost bars show the frozen reference policy. Press Step or Play to train, change the penalty strength, or drag any bar directly to test a policy.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.5rem', justifyContent: 'space-between' } },
          iterPill,
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Drag any bar to set its chance')),
        svgBars,
        svgCurve,
        h('div', { class: 'sim-row' }, stepBtn, playBtn, resetBtn, randBtn, origBtn),
        h('div', { class: 'sim-row', style: { marginTop: '.75rem' } },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', flex: '1 1 210px' } },
            'Strength: ', betaSlider, betaVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', flex: '1 1 170px' } },
            'Step size: ', lrSlider, lrVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', flex: '1 1 150px' } },
            'Speed: ', spdSlider, spdVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  // Challenges
  const chal = challenges(ch, [
    {
      text: 'Set Strength to 0 and press Play (at least 5 steps). Watch which reply takes over.',
      check: st => st.beta === 0 && st.iter >= 5 && st.p[3] >= 0.70,
      why: 'With zero penalty, reward training chases D’s buggy +3 reward until D dominates, even though D is strange repetition.',
    },
    {
      text: 'Press Reset, set Strength to 1, and train for at least 8 steps on the library example.',
      check: st => !st.custom && Math.abs(st.beta - 1) < 1e-6 && st.iter >= 8 && st.p[0] >= 0.60 && st.p[3] <= 0.26,
      why: 'At strength 1, A leads near 64% while D stays near 22%. The penalty caps drift without stopping improvement.',
    },
    {
      text: 'Press Reset, raise Strength to 10 (or higher), and run at least 6 steps on the library example.',
      check: st => !st.custom && st.beta >= 10 && st.iter >= 6 && st.kl < 0.05,
      why: 'When strength is too high, the penalty pulls so hard that the model barely moves from the reference bars.',
    },
    {
      text: 'Press “New data (random)”, set Strength to 1, and train for at least 6 steps. Does the penalty still stop D taking over?',
      check: st => st.custom && Math.abs(st.beta - 1) < 1e-6 && st.iter >= 6 && st.p[3] < 0.65 && st.score > st.startScore + 0.04,
      why: 'Yes! On fresh data too, the reference-policy penalty raises the final score while stopping the rare trap reply from taking over.',
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.08 : 1;
  const BX0 = NARROW ? 94 : 158, BX1 = VW - (NARROW ? 66 : 112), BW = BX1 - BX0;
  const ROW_H = 54, TOP_Y = 30;
  svgBars.setAttribute('viewBox', `0 0 ${VW} 265`);
  svgCurve.setAttribute('viewBox', `0 0 ${VW} 160`);

  // Direct bar dragging
  let dragging = -1;
  const toSvg = e => {
    const pt = svgBars.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svgBars.getScreenCTM().inverse());
  };
  svgBars.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    const idx = Math.floor((pt.y - TOP_Y) / ROW_H);
    if (idx < 0 || idx > 3 || pt.x < BX0 - 14) return;
    stop();
    dragging = idx;
    svgBars.setPointerCapture(e.pointerId);
    applyDrag(pt.x);
  });
  function applyDrag(px) {
    if (dragging < 0) return;
    const q = Math.max(0.005, Math.min(0.99, (px - BX0) / BW));
    const otherSum = p.reduce((a, v, i) => i === dragging ? a : a + v, 0);
    const next = p.slice();
    next[dragging] = q;
    for (let i = 0; i < 4; i++) {
      if (i === dragging) continue;
      next[i] = otherSum > 1e-6 ? p[i] * (1 - q) / otherSum : (1 - q) / 3;
    }
    p = next;
    z = p.map(v => Math.log(Math.max(1e-5, v)));
    lastStepInfo = null;
    const m = metrics(p);
    hist[hist.length - 1] = { iter, score: m.score, avgR: m.avgR, pen: beta * m.kl };
    draw();
  }
  svgBars.addEventListener('pointermove', e => { if (dragging >= 0) applyDrag(toSvg(e).x); });
  svgBars.addEventListener('pointerup', () => { dragging = -1; });
  svgBars.addEventListener('pointercancel', () => { dragging = -1; });

  const r2 = x => Math.round(x * 100) / 100;

  function drawBars(m) {
    const els = [];
    // Legend
    els.push(
      s('rect', { x: BX0, y: 6, width: 16, height: 11, rx: 2, fill: C.muted, 'fill-opacity': 0.25, stroke: C.muted }),
      s('text', { x: BX0 + 22, y: 15, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'reference (frozen)'),
      s('rect', { x: BX0 + (NARROW ? 148 : 175), y: 8, width: 16, height: 8, rx: 2, fill: C.cyan, 'fill-opacity': 0.85 }),
      s('text', { x: BX0 + (NARROW ? 170 : 197), y: 15, fill: C.cyan, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'learning model')
    );

    // Grid lines
    for (const g of [0, 25, 50, 75, 100]) {
      const x = BX0 + (g / 100) * BW;
      els.push(
        s('line', { x1: x, x2: x, y1: TOP_Y, y2: TOP_Y + 4 * ROW_H - 8, stroke: C.line, 'stroke-dasharray': g ? '4 4' : null }),
        s('text', { x, y: TOP_Y + 4 * ROW_H + 12, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${g}%`)
      );
    }

    for (let i = 0; i < 4; i++) {
      const cy = TOP_Y + i * ROW_H + ROW_H / 2 - 4;
      const col = RCOL[i];
      const rw = rew[i] >= 0 ? `+${fmt(rew[i])}` : `−${fmt(Math.abs(rew[i]))}`;
      // Label & reward on left
      els.push(
        s('rect', { x: 6, y: cy - 15, width: 26, height: 28, rx: 6, fill: col, 'fill-opacity': 0.18, stroke: col }),
        s('text', { x: 19, y: cy + 4, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, LETTERS[i]),
        s('text', { x: 39, y: cy - 2, fill: C.ink, 'font-size': (NARROW ? 11 : 13) * F, 'font-weight': 600 }, NARROW ? NAMES[i].slice(0, 9) : NAMES[i]),
        s('text', { x: 39, y: cy + 14, fill: i === 2 ? C.pink : (i === 3 ? ORANGE : C.muted), 'font-size': 11 * F, 'font-family': 'Consolas' }, `rew ${rw}`)
      );

      // Ghost reference bar behind
      const gw = Math.max(2, ref[i] * BW);
      els.push(s('rect', {
        x: BX0, y: cy - 16, width: gw, height: 32, rx: 4,
        fill: C.muted, 'fill-opacity': 0.22, stroke: C.muted, 'stroke-width': 1.5,
      }));

      // Active learning bar in front
      const aw = Math.max(3, p[i] * BW);
      els.push(s('rect', {
        x: BX0, y: cy - 10, width: aw, height: 20, rx: 4,
        fill: col, 'fill-opacity': 0.88,
      }));
      // Drag handle dot at end of bar
      els.push(s('circle', { cx: BX0 + aw, cy, r: 5.5, fill: C.ink, stroke: col, 'stroke-width': 2 }));

      // Percent + penalised reward on right
      const pct = Math.round(p[i] * 100);
      const eff = r2(m.penR[i]);
      els.push(
        s('text', { x: BX1 + 10, y: cy - 1, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${pct}%`),
        s('text', { x: BX1 + 10, y: cy + 14, fill: C.muted, 'font-size': 10.5 * F, 'font-family': 'Consolas' }, NARROW ? `p:${fmt(eff)}` : `eff ${fmt(eff)}`)
      );
    }
    svgBars.replaceChildren(...els);
  }

  function drawCurve() {
    const els = [];
    const X0 = NARROW ? 46 : 58, X1 = VW - 18, Y0 = 26, Y1 = 132;
    const W = X1 - X0, H = Y1 - Y0;

    // Frame & labels
    els.push(
      s('text', { x: X0, y: 15, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'FINAL SCORE vs ITERATION'),
      s('text', { x: X1, y: 15, fill: C.pink, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '--- KL penalty'),
      s('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, stroke: C.line }),
      s('line', { x1: X0, x2: X0, y1: Y0, y2: Y1, stroke: C.line })
    );

    const allVals = hist.flatMap(d => [d.score, d.pen]);
    const yMin = Math.min(0, Math.floor(Math.min(...allVals) * 2) / 2);
    const yMax = Math.max(2.5, Math.ceil(Math.max(...allVals, 3.0) * 2) / 2);
    const toY = v => Y1 - ((v - yMin) / Math.max(0.5, yMax - yMin)) * H;
    const maxIt = Math.max(10, hist[hist.length - 1].iter);
    const minIt = hist[0].iter;
    const toX = it => X0 + ((it - minIt) / Math.max(1, maxIt - minIt)) * W;

    for (const v of [yMin, (yMin + yMax) / 2, yMax]) {
      const y = toY(v);
      els.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.55 }),
        s('text', { x: X0 - 6, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(r2(v)))
      );
    }
    els.push(
      s('text', { x: X0, y: Y1 + 16, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, `step ${minIt}`),
      s('text', { x: X1, y: Y1 + 16, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `step ${maxIt}`)
    );

    if (hist.length > 1) {
      const scorePts = hist.map(d => `${toX(d.iter).toFixed(1)},${toY(d.score).toFixed(1)}`).join(' ');
      const penPts = hist.map(d => `${toX(d.iter).toFixed(1)},${toY(d.pen).toFixed(1)}`).join(' ');
      els.push(
        s('polyline', { points: penPts, fill: 'none', stroke: C.pink, 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
        s('polyline', { points: scorePts, fill: 'none', stroke: C.cyan, 'stroke-width': 2.8 })
      );
    }
    const last = hist[hist.length - 1];
    els.push(
      s('circle', { cx: toX(last.iter), cy: toY(last.pen), r: 3.5, fill: C.pink }),
      s('circle', { cx: toX(last.iter), cy: toY(last.score), r: 4.5, fill: C.cyan, stroke: C.ink, 'stroke-width': 1.5 })
    );
    svgCurve.replaceChildren(...els);
  }

  function draw() {
    const m = metrics(p);
    iterPill.textContent = `ITERATION ${iter}`;
    drawBars(m);
    drawCurve();

    const penTot = beta * m.kl;
    const lines = [
      [`avg reward  = ${fmt(r2(m.avgR))}`, C.green],
      [`KL drift    = ${fmt(r2(m.kl))}`, C.violet],
      [`penalty     = ${fmt(beta)} × ${fmt(r2(m.kl))} = ${fmt(r2(penTot))}`, C.pink],
      [`final score = ${fmt(r2(m.avgR))} − ${fmt(r2(penTot))} = ${fmt(r2(m.score))}`, C.amber],
    ];
    if (lastStepInfo) {
      const sign = lastStepInfo.dScore >= 0 ? '+' : '−';
      lines.push([`last step:  Δscore ${sign}${fmt(r2(Math.abs(lastStepInfo.dScore)))}`, C.cyan]);
      lines.push([`D eff rew:  ${fmt(r2(lastStepInfo.dPenR))} (at ${Math.round(lastStepInfo.dChance)}%)`, ORANGE]);
    }
    fbox(box, lines);

    if (p[3] > 0.7) {
      note.textContent = 'Reply D is taking over! With little or no penalty, training chases D’s buggy high reward.';
    } else if (beta >= 8 && iter > 0) {
      note.textContent = 'High strength pulls tightly toward the ghost reference bars — safe, but the model barely learns.';
    } else if (iter > 0 && p[0] > 0.55 && p[3] < 0.30) {
      note.textContent = 'Balanced! Reply A leads while the penalty stops reply D from taking over.';
    } else {
      note.textContent = 'Final score = average reward − strength × KL divergence. Try strength 0, 1, and 10.';
    }

    const startScore = hist[0]?.score ?? m.score;
    chal.update({ beta, iter, p: p.slice(), kl: m.kl, score: m.score, startScore, custom });
  }

  draw();
  return () => stop();
}

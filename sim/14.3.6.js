// 14.3.6 Try it: Nonnegative matrix factorization — learning part amounts step by step.
// Pick a tea (or drag any of the 12 scores / make random data), step through projected gradient descent
// with live loss curve, adjust step size and speed, or drag amounts directly.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const ATTRS = ['Fl', 'Ja', 'Ro', 'Bl', 'Ho', 'Fr', 'Rt', 'To', 'Nu', 'Co', 'Ca', 'Sm'];
  const TEAS = {
    A: [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    B: [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    C: [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
    D: [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
    E: [7, 9, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
    F: [9, 7, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
    G: [7, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7],
    H: [9, 7, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7],
  };

  let teaName = 'A';
  let scores = TEAS.A.slice();
  let a1 = 0, a2 = 1;
  let startA1 = 0, startA2 = 1;
  let lr = 0.5;
  let speed = 2; // steps per second
  let stepCount = 0;
  let history = [];
  let lastInfo = null;
  let timer = null;
  let sawLessonStep3 = false;

  const r2 = x => Math.round(x * 100) / 100;
  const meanOf = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const means = () => [meanOf(scores.slice(0, 6)), meanOf(scores.slice(6, 12))];
  const calcLoss = (x1, x2) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = scores[i] - (i < 6 ? x1 : x2);
      sum += d * d;
    }
    return sum;
  };
  const minLoss = () => {
    const [m1, m2] = means();
    return calcLoss(Math.max(0, m1), Math.max(0, m2));
  };

  function resetHistory() {
    stepCount = 0;
    history = [{ step: 0, a1, a2, loss: calcLoss(a1, a2) }];
    lastInfo = null;
  }
  resetHistory();

  // DOM layout
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, F = NARROW ? 1.2 : 1;
  const svgBars = s('svg', { viewBox: `0 0 ${VW} 290` });
  const svgLoss = s('svg', { viewBox: `0 0 ${VW} 175`, style: 'margin-top:.55rem' });

  const statusRow = h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.65rem' } });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');

  const teaBtns = {};
  const playBtn = btn('Play', () => togglePlay(), '');

  const lrVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } });
  const lrSlider = h('input', {
    type: 'range', min: '0.1', max: '2.4', step: '0.05', value: String(lr),
    style: { flex: '1 1 130px', accentColor: C.amber },
    oninput: e => { lr = +e.target.value; draw(); }
  });

  const spVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } });
  const spSlider = h('input', {
    type: 'range', min: '1', max: '8', step: '1', value: String(speed),
    style: { flex: '1 1 100px', accentColor: C.cyan },
    oninput: e => {
      speed = +e.target.value;
      if (timer) { stopPlay(); startPlay(); }
      draw();
    }
  });

  const a1Val = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } });
  const a1Slider = h('input', {
    type: 'range', min: '0', max: '10', step: '0.25', value: String(a1),
    style: { flex: '1 1 110px', accentColor: C.cyan },
    oninput: e => { stopPlay(); a1 = +e.target.value; startA1 = a1; startA2 = a2; resetHistory(); draw(); }
  });

  const a2Val = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } });
  const a2Slider = h('input', {
    type: 'range', min: '0', max: '10', step: '0.25', value: String(a2),
    style: { flex: '1 1 110px', accentColor: C.amber },
    oninput: e => { stopPlay(); a2 = +e.target.value; startA1 = a1; startA2 = a2; resetHistory(); draw(); }
  });

  const teaRow = h('div', { class: 'sim-row' },
    ...Object.keys(TEAS).map(k => {
      const b = btn(k, () => selectTea(k));
      teaBtns[k] = b;
      return b;
    }),
    btn('New data', () => makeRandomTea())
  );

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: learn part amounts step by step'),
    h('p', { class: 'sub' }, 'Solid bars are the tea’s 12 scores (drag any bar to change it). Outlined bars are the rebuilt profile from two nonnegative parts. Press Step or Play to watch the amounts learn.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svgBars,
        svgLoss,
        h('div', { class: 'sim-row' },
          btn('Step', () => doStep(), 'go'),
          playBtn,
          btn('Reset', () => resetAll()),
          btn('New start', () => randomStart())
        ),
        teaRow,
        h('div', { class: 'sim-row' },
          h('span', { style: { color: '#b2bdd9', fontSize: '.9rem' } }, 'Step size:'), lrSlider, lrVal,
          h('span', { style: { color: '#b2bdd9', fontSize: '.9rem', marginLeft: '.4rem' } }, 'Speed:'), spSlider, spVal
        ),
        h('div', { class: 'sim-row' },
          h('span', { style: { color: C.cyan, fontSize: '.9rem' } }, 'Part 1:'), a1Slider, a1Val,
          h('span', { style: { color: C.amber, fontSize: '.9rem', marginLeft: '.4rem' } }, 'Part 2:'), a2Slider, a2Val
        )
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, statusRow, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  const chal = challenges(ch, [
    {
      text: 'Starting from Tea A at (0, 1) with step size 0.5, press Step 3 times so the loss falls from 50 to 2.75.',
      check: st => st.sawLessonStep3,
      why: 'Yes! Each step moves both amounts halfway toward the group means 2 and 3, cutting the extra loss by three quarters.'
    },
    {
      text: 'Pick Tea G, predict what amounts it will settle near, then press Play until the loss drops below 3.',
      check: st => st.teaName === 'G' && st.stepCount >= 1 && st.loss < 3,
      why: 'Right! Tea G settles at amounts 8 and 7, with a remaining loss of 2 from Floral and Jasmine.'
    },
    {
      text: 'Press Reset, then find the step size that reaches the lowest possible loss (2) in just 1 step.',
      check: st => st.stepCount === 1 && Math.abs(st.loss - st.minLoss) < 0.01 && (st.startA1 !== st.a1 || st.startA2 !== st.a2),
      why: 'Exact! Step size 1.0 jumps straight to each group’s mean in one step, hitting the floor loss immediately.'
    },
    {
      text: 'Set a step size so large that learning fails to settle: after 5 or more steps, the loss stays above 20.',
      check: st => st.stepCount >= 5 && st.loss > 20,
      why: 'Too big a step size (2.0 or more) overshoots past the mean every step, so the amounts bounce instead of settling.'
    }
  ]);

  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function startPlay() {
    if (timer) return;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      doStep();
      if (stepCount >= 40) stopPlay();
    }, Math.round(1000 / speed));
  }
  function togglePlay() {
    if (timer) stopPlay(); else startPlay();
  }

  function selectTea(k) {
    stopPlay();
    teaName = k;
    scores = TEAS[k].slice();
    a1 = 0; a2 = 1; startA1 = 0; startA2 = 1;
    resetHistory();
    draw();
  }

  function makeRandomTea() {
    stopPlay();
    teaName = 'Random';
    const g1 = rnd(2, 8), g2 = rnd(2, 8);
    scores = Array.from({ length: 12 }, (_, i) => {
      const base = i < 6 ? g1 : g2;
      const jitter = rnd(-1, 1);
      return Math.max(0, Math.min(10, base + jitter));
    });
    a1 = rnd(0, 2); a2 = rnd(0, 2);
    startA1 = a1; startA2 = a2;
    resetHistory();
    draw();
  }

  function randomStart() {
    stopPlay();
    a1 = rnd(0, 9); a2 = rnd(0, 9);
    startA1 = a1; startA2 = a2;
    resetHistory();
    draw();
  }

  function resetAll() {
    stopPlay();
    teaName = 'A';
    scores = TEAS.A.slice();
    lr = 0.5;
    a1 = 0; a2 = 1; startA1 = 0; startA2 = 1;
    lrSlider.value = '0.5';
    resetHistory();
    draw();
  }

  function doStep() {
    const [m1, m2] = means();
    const old1 = a1, old2 = a2, oldLoss = calcLoss(old1, old2);
    const raw1 = old1 + lr * (m1 - old1);
    const raw2 = old2 + lr * (m2 - old2);
    const clamped = raw1 < 0 || raw2 < 0;
    a1 = Math.max(0, raw1);
    a2 = Math.max(0, raw2);
    stepCount++;
    const newLoss = calcLoss(a1, a2);
    history.push({ step: stepCount, a1, a2, loss: newLoss });
    lastInfo = { old1, old2, d1: a1 - old1, d2: a2 - old2, a1, a2, oldLoss, newLoss, m1, m2, clamped };
    if (teaName === 'A' && Math.abs(lr - 0.5) < 1e-6 && startA1 === 0 && startA2 === 1 && stepCount === 3 && Math.abs(newLoss - 2.75) < 0.05) {
      sawLessonStep3 = true;
    }
    draw();
  }

  // Bar geometry & drag to edit any original score
  const BX0 = NARROW ? 34 : 46, BX1 = VW - 14, BBASE = 246, BTOP = 30;
  const maxBarVal = () => Math.max(10, ...scores, a1, a2);
  const barSlot = () => (BX1 - BX0) / 12;

  let dragging = -1;
  const toSvg = (svg, e) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(ctm.inverse());
  };
  svgBars.addEventListener('pointerdown', e => {
    const p = toSvg(svgBars, e);
    const idx = Math.floor((p.x - BX0) / barSlot());
    if (idx < 0 || idx >= 12) return;
    stopPlay();
    dragging = idx;
    svgBars.setPointerCapture(e.pointerId);
    dragMove(e);
  });
  const dragMove = e => {
    if (dragging < 0) return;
    const p = toSvg(svgBars, e);
    const u = (BBASE - BTOP) / maxBarVal();
    scores[dragging] = Math.max(0, Math.min(10, Math.round((BBASE - p.y) / u)));
    teaName = 'Custom';
    resetHistory();
    draw();
  };
  svgBars.addEventListener('pointermove', dragMove);
  svgBars.addEventListener('pointerup', () => { dragging = -1; });

  function drawBars() {
    const mx = maxBarVal();
    const u = (BBASE - BTOP) / mx;
    const sl = barSlot();
    const pw = Math.min(20, sl * 0.36);
    const off = pw * 0.56;
    const [m1, m2] = means();
    const k = [];

    // Gridlines
    const stepG = mx > 12 ? 4 : 2;
    for (let g = 0; g <= mx; g += stepG) {
      const y = BBASE - g * u;
      k.push(
        s('line', { x1: BX0, x2: BX1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: BX0 - 7, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // Group divider
    const midX = BX0 + 6 * sl;
    k.push(s('line', { x1: midX, x2: midX, y1: BTOP - 6, y2: BBASE, stroke: C.muted, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.5 }));

    // Dashed group mean target lines
    const ym1 = BBASE - m1 * u, ym2 = BBASE - m2 * u;
    k.push(
      s('line', { x1: BX0 + 2, x2: midX - 4, y1: ym1, y2: ym1, stroke: C.cyan, 'stroke-width': 2, 'stroke-dasharray': '6 5', 'stroke-opacity': 0.8 }),
      s('line', { x1: midX + 4, x2: BX1 - 2, y1: ym2, y2: ym2, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5', 'stroke-opacity': 0.8 })
    );

    // 12 paired bars
    for (let i = 0; i < 12; i++) {
      const cx = BX0 + sl * (i + 0.5);
      const col = i < 6 ? C.cyan : C.amber;
      const orig = scores[i];
      const guess = i < 6 ? a1 : a2;
      const oh = Math.max(2, orig * u);
      const gh = Math.max(2, guess * u);

      // Original filled bar
      k.push(s('rect', {
        x: cx - off - pw / 2, y: BBASE - oh, width: pw, height: oh,
        fill: col, 'fill-opacity': 0.84, stroke: col, 'stroke-width': 1, rx: 2
      }));
      // Rebuilt outlined bar
      k.push(s('rect', {
        x: cx + off - pw / 2, y: BBASE - gh, width: pw, height: gh,
        fill: col, 'fill-opacity': 0.14, stroke: col, 'stroke-width': 2.2, rx: 2
      }));
      // Pink difference line if mismatch
      if (Math.abs(orig - guess) > 0.05) {
        const yA = BBASE - orig * u, yB = BBASE - guess * u;
        k.push(s('line', { x1: cx + off, x2: cx + off, y1: yA, y2: yB, stroke: C.pink, 'stroke-width': 2.5, 'stroke-opacity': 0.8 }));
      }
      // Score number above original bar
      k.push(s('text', {
        x: cx - off, y: BBASE - oh - 5, fill: col, 'font-size': 10.5 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, orig));
      // Attribute label
      k.push(s('text', {
        x: cx, y: BBASE + 17, fill: col, 'font-size': 10.5 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, ATTRS[i]));
    }

    // Legend
    k.push(
      s('rect', { x: BX0 + 4, y: 6, width: 11, height: 11, fill: C.cyan, 'fill-opacity': 0.85, rx: 2 }),
      s('text', { x: BX0 + 20, y: 16, fill: C.ink, 'font-size': 11.5 * F, 'font-family': 'Segoe UI, sans-serif' }, `Tea ${teaName} (original)`),
      s('rect', { x: BX0 + (NARROW ? 165 : 210), y: 6, width: 11, height: 11, fill: C.amber, 'fill-opacity': 0.14, stroke: C.amber, 'stroke-width': 2, rx: 2 }),
      s('text', { x: BX0 + (NARROW ? 181 : 226), y: 16, fill: C.ink, 'font-size': 11.5 * F, 'font-family': 'Segoe UI, sans-serif' }, 'Rebuilt (outline)')
    );

    svgBars.replaceChildren(...k);
  }

  function drawLoss() {
    const LX0 = NARROW ? 44 : 54, LX1 = VW - 18, LBASE = 142, LTOP = 24;
    const maxStep = Math.max(8, history[history.length - 1].step);
    const maxL = Math.max(10, ...history.map(p => p.loss)) * 1.08;
    const px = st => LX0 + (st / maxStep) * (LX1 - LX0);
    const py = l => LBASE - (l / maxL) * (LBASE - LTOP);
    const fl = minLoss();
    const k = [];

    // Axes & title
    k.push(
      s('text', { x: LX0, y: 15, fill: C.pink, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'LOSS VS STEP (TOTAL SQUARED ERROR)'),
      s('line', { x1: LX0, x2: LX1, y1: LBASE, y2: LBASE, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: LX0, x2: LX0, y1: LTOP, y2: LBASE, stroke: C.muted, 'stroke-width': 1.5 })
    );

    // Y ticks
    [0, maxL / 2, maxL].forEach(v => {
      const y = py(v);
      k.push(
        s('line', { x1: LX0, x2: LX1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.7 }),
        s('text', { x: LX0 - 7, y: y + 4, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, Math.round(v))
      );
    });

    // X ticks
    const xStep = maxStep <= 10 ? 2 : Math.ceil(maxStep / 5);
    for (let st = 0; st <= maxStep; st += xStep) {
      k.push(s('text', { x: px(st), y: LBASE + 16, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, st));
    }

    // Floor line (minimum possible loss)
    const yfl = py(fl);
    k.push(
      s('line', { x1: LX0, x2: LX1, y1: yfl, y2: yfl, stroke: C.pink, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.75 }),
      s('text', { x: LX1, y: Math.max(LTOP + 10, yfl - 5), fill: C.pink, 'font-size': 10.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `floor = ${fmt(r2(fl))}`)
    );

    // Polyline + dots
    if (history.length > 1) {
      const pts = history.map(p => `${px(p.step).toFixed(1)},${py(p.loss).toFixed(1)}`).join(' ');
      k.push(s('polyline', { points: pts, fill: 'none', stroke: C.green, 'stroke-width': 2.5 }));
    }
    history.forEach((p, idx) => {
      const isLast = idx === history.length - 1;
      const col = idx === 0 ? C.pink : (isLast ? C.amber : C.green);
      k.push(s('circle', { cx: px(p.step), cy: py(p.loss), r: isLast ? 5 : 3.5, fill: col }));
    });
    const last = history[history.length - 1];
    k.push(s('text', {
      x: Math.min(LX1 - 24, px(last.step) + 8), y: Math.max(LTOP + 12, py(last.loss) - 7),
      fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas'
    }, fmt(r2(last.loss))));

    svgLoss.replaceChildren(...k);
  }

  function draw() {
    const loss = calcLoss(a1, a2);
    const fl = minLoss();
    const [m1, m2] = means();

    // Sync inputs & active tea highlight
    lrVal.textContent = lr.toFixed(2);
    spVal.textContent = `${speed}/s`;
    a1Slider.value = String(Math.min(10, r2(a1)));
    a2Slider.value = String(Math.min(10, r2(a2)));
    a1Val.textContent = fmt(r2(a1));
    a2Val.textContent = fmt(r2(a2));
    for (const [k, b] of Object.entries(teaBtns)) {
      b.className = 'sim-btn' + (teaName === k ? ' go' : '');
    }

    drawBars();
    drawLoss();

    statusRow.replaceChildren(
      pill(`TEA ${teaName}`, C.cyan),
      pill(`STEP ${stepCount}`, C.amber),
      pill(`LOSS ${fmt(r2(loss))}`, loss <= fl + 0.05 ? C.green : C.pink)
    );

    if (lastInfo) {
      const sgn = x => (x >= 0 ? `+${fmt(r2(x))}` : fmt(r2(x)));
      fbox(box, [
        `Step ${stepCount}  (step size = ${lr.toFixed(2)})`,
        [`means:  (${fmt(r2(m1))}, ${fmt(r2(m2))})`, C.muted],
        [`amt 1:  ${fmt(r2(lastInfo.old1))} ${sgn(lastInfo.d1)} → ${fmt(r2(lastInfo.a1))}`, C.cyan],
        [`amt 2:  ${fmt(r2(lastInfo.old2))} ${sgn(lastInfo.d2)} → ${fmt(r2(lastInfo.a2))}`, C.amber],
        [`loss:   ${fmt(r2(lastInfo.oldLoss))} → ${fmt(r2(lastInfo.newLoss))}`, lastInfo.newLoss <= lastInfo.oldLoss ? C.green : C.pink]
      ]);
    } else {
      fbox(box, [
        `Step 0  (start)`,
        [`means:  (${fmt(r2(m1))}, ${fmt(r2(m2))})`, C.muted],
        [`amt 1 = ${fmt(r2(a1))}`, C.cyan],
        [`amt 2 = ${fmt(r2(a2))}`, C.amber],
        [`loss  = ${fmt(r2(loss))}`, C.pink]
      ]);
    }

    if (lr >= 2.0 && stepCount >= 2) {
      note.textContent = 'Step size is too large (≥ 2.0): each update jumps past the mean, so the amounts bounce and never settle.';
    } else if (lastInfo?.clamped) {
      note.textContent = 'An amount tried to go below zero and was clamped to 0, because NMF never allows negative amounts.';
    } else if (loss <= fl + 0.05) {
      note.textContent = `Settled! Amounts (${fmt(r2(a1))}, ${fmt(r2(a2))}) match the group means. Remaining loss (${fmt(r2(fl))}) comes from differences within the groups.`;
    } else {
      note.textContent = 'Each step moves both amounts toward their group means (dashed lines), keeping every amount zero or positive.';
    }

    chal.update({
      teaName, stepCount, lr, a1, a2, startA1, startA2,
      loss, minLoss: fl, sawLessonStep3
    });
  }

  draw();
  return () => stopPlay();
}

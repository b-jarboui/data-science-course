// 14.4.8 Try it: matrix factorization learning step by step.
// Interactive latent factors (drag bars or run gradient descent), learning-rate & speed knobs,
// live unread-book predictions (River & Castle), growing loss curve, random data, and 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Chapter 14.4 colours
  const COL = {
    ana: C.cyan, trail: C.green, river: '#2dd4bf', clues: C.amber, castle: C.violet, err: C.pink,
  };

  // Fixed book factors from chapters/14.4.md
  const BF = { trail: [1, 0], clues: [0, 1], river: [1, 0.5], castle: [0.5, 1] };

  // State
  let target = [4, 2];       // Ana's real ratings: [Trail, Clues]
  let startF = [2, 0];       // Starting guess for Ana's factors
  let f = [2, 0];            // Current Ana factors [f1, f2]
  let lr = 0.5;              // Learning rate
  let speed = 5;             // 1 (slow) .. 10 (fast)
  let steps = 0;
  let history = [];          // Loss after each step [loss0, loss1, ...]
  let lastStep = null;       // { oldF, err, delta, newF, loss }
  let isRandom = false;
  let playing = false;
  let timer = null;
  let diverged = false;
  let selFactor = 0;         // 0 = f1 (Trail), 1 = f2 (Clues)

  const pred = (fac, bf) => fac[0] * bf[0] + fac[1] * bf[1];
  const calcLoss = fac => {
    const e1 = target[0] - pred(fac, BF.trail);
    const e2 = target[1] - pred(fac, BF.clues);
    return (e1 * e1 + e2 * e2) / 2;
  };
  const r2 = x => Math.round(x * 100) / 100;
  const fmtL = x => {
    if (!Number.isFinite(x)) return '∞';
    if (x === 0) return '0';
    if (x < 0.1) return x.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    if (x >= 100) return String(Math.round(x));
    return fmt(r2(x));
  };
  const fmtSigned = x => (x >= 0 ? '+' : '−') + fmt(r2(Math.abs(x)));

  history = [calcLoss(f)];

  // Controls & layout
  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const lrVal = h('span', { class: 'sim-pill', style: { color: C.amber, borderColor: C.amber } }, 'rate = 0.5');
  const lrSlider = h('input', {
    type: 'range', min: '0.1', max: '3.0', step: '0.1', value: '0.5',
    style: { flex: '1 1 8rem', accentColor: C.amber },
    oninput: e => { lr = Math.round(+e.target.value * 10) / 10; draw(); },
  });
  const spdVal = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '5.5rem' } }, 'Speed: 5');
  const spdSlider = h('input', {
    type: 'range', min: '1', max: '10', step: '1', value: '5',
    style: { flex: '1 1 6rem', accentColor: C.cyan },
    oninput: e => { speed = +e.target.value; if (playing) { stopPlay(); startPlay(); } draw(); },
  });
  const playBtn = btn('Play', () => togglePlay());
  const selLbl = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: matrix factorization learning'),
    h('p', { class: 'sub' }, 'Drag the cyan prediction bars (or tap −0.5 / +0.5) to change Ana’s hidden factors, or press Step and Play to watch gradient descent learn them.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stopPlay(); doStep(); }, 'go'),
          playBtn,
          btn('Reset', () => resetRun()),
          btn('New data (random)', () => newRandomData()),
          btn('Bookshop example', () => bookshopDefault())),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          lrVal, lrSlider, spdVal, spdSlider),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−0.5', () => nudge(-0.5)),
          btn('+0.5', () => nudge(0.5)),
          selLbl)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  // Challenges (easy -> deeper)
  const chal = challenges(ch, [
    {
      text: 'Keep learning rate at 0.5 and press “Step” 3 times. Watch the loss fall below 0.1.',
      check: st => st.steps >= 3 && st.loss < 0.1 && Math.abs(st.lr - 0.5) < 0.01,
      why: 'Yes! At rate 0.5, each step cuts both errors in half, so the loss drops from 4 to 1, 0.25, and 0.0625.',
    },
    {
      text: 'Press “Reset”, then find the learning rate that reaches loss = 0 in just 1 step.',
      check: st => st.steps === 1 && st.loss < 0.001,
      why: 'Right! A learning rate of 1 corrects 100% of each error at once, landing on the exact factors in one step.',
    },
    {
      text: 'Press “Reset”, set learning rate to 2.0 or higher, and take at least 3 steps. Does the loss fall?',
      check: st => st.lr >= 2 && st.steps >= 3 && st.loss >= st.startLoss - 0.001,
      why: 'No! When the learning rate is 2 or more, each step jumps past the target so the loss stays stuck or explodes.',
    },
    {
      text: 'Press “New data (random)”, choose a safe learning rate, and press “Play” until the loss is below 0.05.',
      check: st => st.isRandom && st.steps >= 2 && st.loss < 0.05,
      why: 'Great! Even on fresh ratings and a new starting guess, repeated steps learn Ana’s hidden factors.',
    },
  ]);

  // Actions
  function stopPlay() {
    playing = false;
    if (timer !== null) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function startPlay() {
    if (diverged) return;
    playing = true;
    playBtn.textContent = 'Pause';
    const ms = Math.round(920 - speed * 80); // 840ms at speed 1 -> 120ms at speed 10
    timer = setInterval(() => {
      doStep();
      const loss = calcLoss(f);
      if (diverged || steps >= 30 || (loss < 1e-4 && lr < 1.99)) stopPlay();
    }, ms);
  }
  function togglePlay() {
    if (playing) stopPlay();
    else startPlay();
    draw();
  }

  function doStep() {
    if (diverged) return;
    const oldF = f.slice();
    const p1 = pred(oldF, BF.trail), p2 = pred(oldF, BF.clues);
    const e1 = target[0] - p1, e2 = target[1] - p2;
    const d1 = lr * e1, d2 = lr * e2;
    const n1 = oldF[0] + d1, n2 = oldF[1] + d2;
    f = [n1, n2];
    steps++;
    const loss = calcLoss(f);
    history.push(loss);
    lastStep = { oldF, err: [e1, e2], delta: [d1, d2], newF: f.slice(), loss };
    if (Math.abs(n1) > 400 || Math.abs(n2) > 400 || loss > 1e5) {
      diverged = true;
      stopPlay();
    }
    draw();
  }

  function resetRun() {
    stopPlay();
    f = startF.slice();
    steps = 0;
    history = [calcLoss(f)];
    lastStep = null;
    diverged = false;
    draw();
  }

  function bookshopDefault() {
    stopPlay();
    target = [4, 2];
    startF = [2, 0];
    lr = 0.5;
    lrSlider.value = '0.5';
    isRandom = false;
    resetRun();
  }

  function newRandomData() {
    stopPlay();
    let t1, t2, s1, s2;
    do {
      t1 = rnd(1, 5);
      t2 = rnd(1, 5);
      s1 = rnd(0, 4);
      s2 = rnd(0, 4);
    } while (Math.abs(t1 - s1) + Math.abs(t2 - s2) < 3 || t1 === t2);
    target = [t1, t2];
    startF = [s1, s2];
    isRandom = true;
    resetRun();
  }

  function nudge(d) {
    stopPlay();
    f[selFactor] = Math.max(-2, Math.min(8, Math.round((f[selFactor] + d) * 4) / 4));
    startF = f.slice();
    steps = 0;
    history = [calcLoss(f)];
    lastStep = null;
    diverged = false;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 560 : 470, F = NARROW ? 1.06 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const BX0 = NARROW ? 66 : 96, BX1 = VW - (NARROW ? 94 : 138);
  const barW = BX1 - BX0;
  const star2x = v => BX0 + Math.max(0, Math.min(6, v)) / 6 * barW;

  const Y = NARROW
    ? { h1: 22, tr: 40, cl: 86, bh: 28, ax: 138, h2: 174, rv: 192, cs: 236, bh2: 26, sep: 282, h3: 308, cTop: 332, cBot: 512 }
    : { h1: 20, tr: 36, cl: 74, bh: 25, ax: 118, h2: 152, rv: 168, cs: 204, bh2: 24, sep: 246, h3: 270, cTop: 292, cBot: 432 };

  // Drag known rating bars to directly set Ana's f1 or f2
  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    let hit = -1;
    if (pt.y >= Y.tr - 6 && pt.y <= Y.tr + Y.bh + 6) hit = 0;
    else if (pt.y >= Y.cl - 6 && pt.y <= Y.cl + Y.bh + 6) hit = 1;
    if (hit < 0) return;
    stopPlay();
    selFactor = hit;
    dragging = hit;
    svg.setPointerCapture(e.pointerId);
    onMove(e);
  });
  const onMove = e => {
    if (dragging < 0) return;
    const pt = toSvg(e);
    const val = Math.max(0, Math.min(6, Math.round(((pt.x - BX0) / barW * 6) * 4) / 4));
    f[dragging] = val;
    startF = f.slice();
    steps = 0;
    history = [calcLoss(f)];
    lastStep = null;
    diverged = false;
    draw();
  };
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const pTr = pred(f, BF.trail), pCl = pred(f, BF.clues);
    const pRv = pred(f, BF.river), pCs = pred(f, BF.castle);
    const eTr = target[0] - pTr, eCl = target[1] - pCl;
    const loss = calcLoss(f);
    const k = [];

    // Section 1: Known ratings & Ana's factors
    k.push(s('text', { x: 14, y: Y.h1, fill: C.muted, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      NARROW ? 'KNOWN RATINGS (DRAG CYAN BARS)' : 'KNOWN RATINGS — DRAG CYAN BARS TO CHANGE ANA’S FACTORS'));

    const knownRows = [
      { idx: 0, name: 'Trail', col: COL.trail, y: Y.tr, predV: pTr, realV: target[0] },
      { idx: 1, name: 'Clues', col: COL.clues, y: Y.cl, predV: pCl, realV: target[1] },
    ];

    for (const r of knownRows) {
      if (selFactor === r.idx) {
        k.push(s('rect', { x: 8, y: r.y - 5, width: VW - 16, height: Y.bh + 10, rx: 8, fill: '#ffffff', 'fill-opacity': 0.045 }));
      }
      // Track background
      k.push(s('rect', { x: BX0, y: r.y, width: barW, height: Y.bh, rx: 5, fill: C.bg, stroke: C.line }));
      k.push(s('text', { x: BX0 - 10, y: r.y + Y.bh * 0.68, fill: r.col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end' }, r.name));

      // Predicted bar
      const px = star2x(r.predV), rx = star2x(r.realV);
      if (r.predV > 0) {
        k.push(s('rect', { x: BX0, y: r.y + 2, width: Math.max(4, px - BX0), height: Y.bh - 4, rx: 4, fill: COL.ana, 'fill-opacity': 0.82 }));
      }
      // Pink error segment between prediction and real rating
      if (Math.abs(px - rx) > 2) {
        const ex = Math.min(px, rx), ew = Math.abs(px - rx);
        k.push(s('rect', { x: ex, y: r.y + 5, width: ew, height: Y.bh - 10, rx: 3, fill: COL.err, 'fill-opacity': 0.38, stroke: COL.err, 'stroke-width': 1.5 }));
      }
      // Real rating target dashed line
      k.push(s('line', { x1: rx, x2: rx, y1: r.y - 4, y2: r.y + Y.bh + 4, stroke: r.col, 'stroke-width': 2.5, 'stroke-dasharray': '5 3' }));
      // Drag handle dot on predicted bar
      k.push(s('circle', { cx: px, cy: r.y + Y.bh / 2, r: 6.5, fill: COL.ana, stroke: C.bg, 'stroke-width': 2 }));
      // Value text on right
      const outOfRange = r.predV < 0 || r.predV > 6;
      k.push(s('text', { x: BX1 + 10, y: r.y + Y.bh * 0.68, fill: outOfRange ? COL.err : C.ink, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `${fmt(r2(r.predV))} / ${r.realV}★`));
    }

    // Star axis ticks (0..6)
    k.push(s('line', { x1: BX0, x2: BX1, y1: Y.ax - 12, y2: Y.ax - 12, stroke: C.line }));
    for (let v = 0; v <= 6; v++) {
      const x = star2x(v);
      k.push(s('line', { x1: x, x2: x, y1: Y.ax - 16, y2: Y.ax - 8, stroke: C.muted }),
        s('text', { x, y: Y.ax + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v + '★'));
    }

    // Section 2: Unread book predictions (River & Castle)
    k.push(s('text', { x: 14, y: Y.h2, fill: C.muted, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      `UNREAD BOOKS — ANA (${fmt(r2(f[0]))}, ${fmt(r2(f[1]))}) · BOOK`));

    const unreadRows = [
      { name: 'River', col: COL.river, y: Y.rv, predV: pRv, best: pRv >= pCs },
      { name: 'Castle', col: COL.castle, y: Y.cs, predV: pCs, best: pCs > pRv },
    ];
    for (const u of unreadRows) {
      k.push(s('rect', { x: BX0, y: u.y, width: barW, height: Y.bh2, rx: 5, fill: C.bg, stroke: u.best ? u.col : C.line, 'stroke-width': u.best ? 1.8 : 1 }));
      k.push(s('text', { x: BX0 - 10, y: u.y + Y.bh2 * 0.68, fill: u.col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end' }, u.name));
      if (u.predV > 0) {
        const ux = star2x(u.predV);
        k.push(s('rect', { x: BX0, y: u.y + 2, width: Math.max(4, ux - BX0), height: Y.bh2 - 4, rx: 4, fill: u.col, 'fill-opacity': 0.78 }));
      }
      const badge = u.best ? ' #1' : '';
      k.push(s('text', { x: BX1 + 10, y: u.y + Y.bh2 * 0.68, fill: u.col, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `${fmt(r2(u.predV))}★${badge}`));
    }

    // Divider
    k.push(s('line', { x1: 14, x2: VW - 14, y1: Y.sep, y2: Y.sep, stroke: C.line }));

    // Section 3: Growing Loss-vs-Iteration curve
    const badgeCol = diverged || (steps > 0 && loss >= history[0] - 0.001) ? COL.err : (loss < 0.05 ? C.green : C.amber);
    k.push(s('text', { x: 14, y: Y.h3, fill: C.muted, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'LOSS VS ITERATION'),
      s('text', { x: VW - 14, y: Y.h3, fill: badgeCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `STEP ${steps}  ·  LOSS ${fmtL(loss)}`));

    const CX0 = NARROW ? 48 : 60, CX1 = VW - 22;
    const maxStep = Math.max(8, history.length - 1);
    const maxLoss = Math.max(4, ...history.filter(Number.isFinite));
    const sx = i => CX0 + (i / maxStep) * (CX1 - CX0);
    const sy = v => Y.cBot - (Math.min(maxLoss, Math.max(0, v)) / maxLoss) * (Y.cBot - Y.cTop);

    // Grid lines
    for (const frac of [0, 0.25, 0.5, 1]) {
      const lv = maxLoss * frac, py = sy(lv);
      k.push(s('line', { x1: CX0, x2: CX1, y1: py, y2: py, stroke: C.line, 'stroke-dasharray': frac === 0 ? null : '4 4' }),
        s('text', { x: CX0 - 8, y: py + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmtL(lv)));
    }
    k.push(s('line', { x1: CX0, x2: CX0, y1: Y.cTop, y2: Y.cBot, stroke: C.muted }));

    // X ticks
    const tickEvery = maxStep > 16 ? 4 : (maxStep > 10 ? 2 : 1);
    for (let i = 0; i <= maxStep; i += tickEvery) {
      const px = sx(i);
      k.push(s('text', { x: px, y: Y.cBot + 18, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, i));
    }

    // Loss curve polyline & dots
    const pts = history.map((v, i) => `${sx(i)},${sy(v)}`).join(' ');
    if (history.length > 1) {
      k.push(s('polyline', { points: pts, fill: 'none', stroke: badgeCol, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    }
    history.forEach((v, i) => {
      const isLast = i === history.length - 1;
      k.push(s('circle', { cx: sx(i), cy: sy(v), r: isLast ? 5.5 : 3.5, fill: isLast ? badgeCol : C.cyan, stroke: C.bg, 'stroke-width': 1.5 }));
    });

    svg.replaceChildren(...k);

    // Formula box: show exact step arithmetic when stepping, or current dot products at step 0
    if (lastStep) {
      fbox(box, [
        [`Step ${steps}  (rate = ${fmt(lr)})`, C.amber],
        `old Ana = (${fmt(r2(lastStep.oldF[0]))}, ${fmt(r2(lastStep.oldF[1]))})`,
        `errors  = (${fmtSigned(lastStep.err[0])}, ${fmtSigned(lastStep.err[1])})`,
        [`change  = (${fmtSigned(lastStep.delta[0])}, ${fmtSigned(lastStep.delta[1])})`, C.cyan],
        [`new Ana = (${fmt(r2(lastStep.newF[0]))}, ${fmt(r2(lastStep.newF[1]))})`, COL.ana],
        [`Loss    = ${fmtL(lastStep.loss)}`, badgeCol],
        [`River ${fmt(r2(pRv))}★  ·  Castle ${fmt(r2(pCs))}★`, pRv >= pCs ? COL.river : COL.castle],
      ]);
    } else {
      fbox(box, [
        [`Ana = (${fmt(r2(f[0]))}, ${fmt(r2(f[1]))})   rate = ${fmt(lr)}`, COL.ana],
        `Trail: ${fmt(r2(f[0]))}×1 + ${fmt(r2(f[1]))}×0 = ${fmt(r2(pTr))}  (err ${fmtSigned(eTr)})`,
        `Clues: ${fmt(r2(f[0]))}×0 + ${fmt(r2(f[1]))}×1 = ${fmt(r2(pCl))}  (err ${fmtSigned(eCl)})`,
        [`Loss = (${fmtL(eTr * eTr)} + ${fmtL(eCl * eCl)}) ÷ 2 = ${fmtL(loss)}`, badgeCol],
        [`River  = ${fmt(r2(f[0]))}×1 + ${fmt(r2(f[1]))}×0.5 = ${fmt(r2(pRv))}★`, COL.river],
        [`Castle = ${fmt(r2(f[0]))}×0.5 + ${fmt(r2(f[1]))}×1 = ${fmt(r2(pCs))}★`, COL.castle],
      ]);
    }

    // Status note
    if (diverged) {
      note.textContent = 'Loss exploded! A learning rate above 2 makes each jump bigger than the last. Press Reset and try a smaller rate.';
    } else if (lr >= 2 && steps >= 2) {
      note.textContent = 'Notice how the factors jump past the target when the learning rate is 2 or larger. The loss does not shrink.';
    } else if (loss < 0.01) {
      const rec = pRv >= pCs ? 'River before Castle' : 'Castle before River';
      note.textContent = `Settled! Ana’s learned factors match her known ratings and recommend ${rec}.`;
    } else {
      note.textContent = 'Each step adds (learning rate × error) to Ana’s factors so the predicted bars move towards the dashed real ratings.';
    }

    lrVal.textContent = `rate = ${fmt(lr)}`;
    spdVal.textContent = `Speed: ${speed}`;
    selLbl.textContent = `Selected: Ana’s Factor ${selFactor + 1} (${selFactor === 0 ? 'Trail' : 'Clues'}) = ${fmt(r2(f[selFactor]))}`;

    chal.update({
      steps,
      loss,
      lr,
      startLoss: history[0],
      isRandom,
      f: f.slice(),
    });
  }

  draw();
  return () => stopPlay();
}

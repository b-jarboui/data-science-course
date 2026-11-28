// 10.4.5 Try it: Maximum a posteriori (MAP) estimation.
// Adjust the clinic's real record and the earlier network's pretend appointments,
// switch between probability curves and log scores, drag the test chance, and check challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const RED = '#fb646e';
  const DATA = C.amber;
  const PRIOR = C.violet;
  const POST = C.cyan;
  const WIN = C.green;

  let realM = 10, realN = 40;
  let priorM = 2, priorN = 20;
  let lastPriorRate = 0.1;
  let view = 'curves'; // 'curves' | 'log'
  let probe = 0.10;
  let movedProbe = false;
  let randomCount = 0;
  let chState = null;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 620, VH = 310, F = NARROW ? 1.12 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', 'aria-label': 'MAP curves' });
  const dotsEl = h('div', { style: { marginTop: '.65rem' } });
  const box = h('div');
  const note = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const tasks = h('div');

  const curvesTab = btn('Curves', () => { view = 'curves'; draw(); });
  const logTab = btn('Log scores', () => { view = 'log'; draw(); });

  const realMLab = h('span'), realNLab = h('span');
  const priorMLab = h('span'), priorNLab = h('span');

  const slider = (min, max, step, val, oninput) => h('input', {
    type: 'range', min, max, step, value: val,
    style: { width: '100%', minHeight: '34px' }, oninput
  });

  const realMSlider = slider(0, realN, 1, realM, e => {
    realM = Number(e.currentTarget.value);
    draw();
  });
  const realNSlider = slider(10, 100, 10, realN, e => {
    const rate = realN > 0 ? realM / realN : 0.25;
    realN = Number(e.currentTarget.value);
    realM = Math.min(realN, Math.round(realN * rate));
    realMSlider.max = String(realN);
    realMSlider.value = String(realM);
    draw();
  });
  const priorMSlider = slider(0, priorN, 1, priorM, e => {
    priorM = Number(e.currentTarget.value);
    if (priorN > 0) lastPriorRate = priorM / priorN;
    draw();
  });
  const priorNSlider = slider(0, 60, 5, priorN, e => {
    priorN = Number(e.currentTarget.value);
    priorM = priorN === 0 ? 0 : Math.min(priorN, Math.round(priorN * lastPriorRate));
    priorMSlider.max = String(priorN);
    priorMSlider.value = String(priorM);
    priorMSlider.disabled = priorN === 0;
    draw();
  });

  function setProbe(val, byUser = true) {
    probe = Math.max(0.02, Math.min(0.58, Math.round(val * 100) / 100));
    if (byUser) movedProbe = true;
    draw();
  }

  function newData() {
    const trueP = rnd(10, 45) / 100;
    const nextN = [20, 30, 40, 50, 60][rnd(0, 4)];
    let nextM = 0;
    for (let i = 0; i < nextN; i++) if (Math.random() < trueP) nextM++;
    if (nextM === realM && nextN === realN) nextM = Math.min(nextN, nextM + 1);
    realN = nextN;
    realM = nextM;
    realNSlider.value = String(realN);
    realMSlider.max = String(realN);
    realMSlider.value = String(realM);
    randomCount++;
    draw();
  }

  function resetAll() {
    realM = 10; realN = 40;
    priorM = 2; priorN = 20; lastPriorRate = 0.1;
    view = 'curves'; probe = 0.10; movedProbe = false;
    realNSlider.value = '40'; realMSlider.max = '40'; realMSlider.value = '10';
    priorNSlider.value = '20'; priorMSlider.max = '20'; priorMSlider.value = '2';
    priorMSlider.disabled = false;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: find the highest point (MAP)'),
    h('p', { class: 'sub' }, 'Change the real appointments and the pretend appointments, or drag across the graph to compare log scores.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Graph view' },
          curvesTab, logTab,
          btn('0.10', () => setProbe(0.10), 'ghost'),
          btn('0.20', () => setProbe(0.20), 'ghost'),
          btn('0.25', () => setProbe(0.25), 'ghost')),
        svg,
        dotsEl,
        h('div', { style: { marginTop: '.75rem', display: 'grid', gap: '.45rem' } },
          h('label', { style: { display: 'block', color: DATA } }, realMLab, realMSlider),
          h('label', { style: { display: 'block', color: DATA } }, realNLab, realNSlider),
          h('label', { style: { display: 'block', color: PRIOR } }, priorMLab, priorMSlider),
          h('label', { style: { display: 'block', color: PRIOR } }, priorNLab, priorNSlider)),
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Reset clinic data', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, tasks)))));

  const chal = challenges(tasks, [
    {
      text: 'Open Log scores and drag the test chance to the peak where the sum is closest to 0.',
      check: st => st.view === 'log' && st.movedProbe && Math.abs(st.probe - st.map) <= 0.01,
      why: 'Yes! Adding log likelihood and log prior peaks right at the MAP chance, the score closest to 0.'
    },
    {
      text: 'Set the pretend appointments to 0 (no prior weight) and see where MAP lands.',
      check: st => st.priorN === 0,
      why: 'With zero pretend appointments, MAP matches the clinic record exactly: real misses divided by real appointments.'
    },
    {
      text: 'Give the prior more appointments than the clinic record so MAP pulls closer to the prior than to the record.',
      check: st => st.priorN > st.realN && Math.abs(st.priorP - st.realP) >= 0.05 && Math.abs(st.map - st.priorP) < Math.abs(st.map - st.realP),
      why: 'When pretend appointments outnumber real ones, earlier experience pulls the combined peak closer to the prior.'
    },
    {
      text: 'Press “New data” twice and watch where the cyan MAP peak sits each time.',
      check: st => st.randomCount >= 2,
      why: 'Every time, MAP lands between the prior peak and the record peak, pulled toward whichever has more appointments.'
    }
  ]);

  const onTaskClick = () => { if (chState) chal.update(chState); };
  tasks.addEventListener('click', onTaskClick);

  // --- Exact log-score math ---
  function logRel(p, m, n) {
    if (n <= 0) return 0;
    const k = n - m;
    const at = q => (m > 0 ? m * Math.log(Math.max(1e-12, q)) : 0) + (k > 0 ? k * Math.log(Math.max(1e-12, 1 - q)) : 0);
    return at(p) - at(m / n);
  }
  const signed = (x, d = 2) => {
    const v = Math.abs(x) < 0.005 ? 0 : x;
    return v.toFixed(d).replace('-', '−');
  };

  // --- Plot geometry and pointer drag ---
  const X0 = NARROW ? 46 : 56, X1 = VW - 18;
  const YTOP = 34, YBOT = VH - 46;
  const PMAX = 0.6;
  const xFor = p => X0 + (p / PMAX) * (X1 - X0);
  const pFor = x => ((x - X0) / (X1 - X0)) * PMAX;

  let dragging = false;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    if (pt.x < X0 - 14 || pt.x > X1 + 14) return;
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    setProbe(pFor(pt.x), true);
  });
  svg.addEventListener('pointermove', e => {
    if (!dragging) return;
    setProbe(pFor(toSvg(e).x), true);
  });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  function renderDots() {
    const makeRow = (m, n, outlined) => {
      const cap = Math.min(n, 40);
      const redCount = n === 0 ? 0 : Math.round((m / n) * cap);
      const dots = [];
      for (let i = 0; i < cap; i++) {
        const isRed = i < redCount;
        dots.push(h('span', {
          style: {
            display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%',
            background: isRed ? RED : C.ink,
            boxShadow: outlined ? `0 0 0 1.8px ${PRIOR}` : (isRed ? `0 0 4px ${RED}` : 'none')
          }
        }));
      }
      return h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' } }, ...dots);
    };
    dotsEl.replaceChildren(
      h('div', { style: { fontSize: '.85rem', color: DATA, marginBottom: '3px' } },
        `Real: ${realM} red, ${realN - realM} white (${realN} total)`),
      makeRow(realM, realN, false),
      h('div', { style: { fontSize: '.85rem', color: PRIOR, margin: '6px 0 3px' } },
        priorN === 0 ? 'Pretend: 0 (flat prior)' : `Pretend (outlined): ${priorM} red, ${priorN - priorM} white (${priorN} total)`),
      priorN > 0 ? makeRow(priorM, priorN, true) : null
    );
  }

  function curvePath(fn, yMap, yClipMin, yClipMax) {
    const segs = [];
    let open = false;
    for (let i = 1; i <= 120; i++) {
      const p = (i / 120) * PMAX;
      const v = fn(p);
      if (v < yClipMin || v > yClipMax) { open = false; continue; }
      const x = xFor(p), y = yMap(v);
      segs.push(`${open ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
      open = true;
    }
    return segs.join(' ');
  }

  function drawCurves(realP, priorP, map, totalM, totalN) {
    const yLin = v => YBOT - v * (YBOT - YTOP);
    const parts = [];

    // Subtle plausible width band where normalized posterior >= 0.25
    const bandPts = [];
    let bandL = null, bandR = null;
    for (let i = 1; i <= 120; i++) {
      const p = (i / 120) * PMAX;
      const val = Math.exp(logRel(p, totalM, totalN));
      if (val >= 0.25) {
        if (bandL === null) bandL = p;
        bandR = p;
        bandPts.push(`${xFor(p).toFixed(1)},${yLin(val).toFixed(1)}`);
      }
    }
    if (bandPts.length > 2) {
      const d = `M${xFor(bandL).toFixed(1)},${YBOT} L${bandPts.join(' L')} L${xFor(bandR).toFixed(1)},${YBOT} Z`;
      parts.push(s('path', { d, fill: POST, 'fill-opacity': 0.16 }));
    }

    // Horizontal grid & axis
    parts.push(s('line', { x1: X0, x2: X1, y1: YBOT, y2: YBOT, stroke: C.muted, 'stroke-width': 2 }));
    for (const v of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) {
      const x = xFor(v);
      parts.push(
        s('line', { x1: x, x2: x, y1: YTOP, y2: YBOT, stroke: C.line, 'stroke-opacity': 0.5 }),
        s('text', { x, y: YBOT + 18, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          v === 0 ? '0' : v.toFixed(1))
      );
    }
    parts.push(s('text', { x: (X0 + X1) / 2, y: VH - 8, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' },
      'Possible miss chance (drag to test)'));

    // Curves: prior, likelihood, posterior
    if (priorN > 0) {
      parts.push(s('path', {
        d: curvePath(p => Math.exp(logRel(p, priorM, priorN)), yLin, 0, 1.01),
        fill: 'none', stroke: PRIOR, 'stroke-width': 2.4, 'stroke-opacity': 0.85
      }));
    } else {
      parts.push(s('line', {
        x1: X0, x2: X1, y1: yLin(1), y2: yLin(1),
        stroke: PRIOR, 'stroke-width': 2, 'stroke-dasharray': '6 5', 'stroke-opacity': 0.65
      }));
    }
    parts.push(
      s('path', {
        d: curvePath(p => Math.exp(logRel(p, realM, realN)), yLin, 0, 1.01),
        fill: 'none', stroke: DATA, 'stroke-width': 2.4, 'stroke-opacity': 0.85
      }),
      s('path', {
        d: curvePath(p => Math.exp(logRel(p, totalM, totalN)), yLin, 0, 1.01),
        fill: 'none', stroke: POST, 'stroke-width': 3.5
      })
    );

    // Peak marker for MAP
    if (map <= PMAX) {
      const mx = xFor(map);
      parts.push(
        s('line', { x1: mx, x2: mx, y1: YTOP, y2: YBOT, stroke: WIN, 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
        s('circle', { cx: mx, cy: YTOP, r: 5.5, fill: WIN }),
        s('text', {
          x: Math.min(X1 - 36, Math.max(X0 + 36, mx)), y: YTOP - 10,
          fill: WIN, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `MAP ${map.toFixed(2)}`)
      );
    }

    // Draggable probe line
    const px = xFor(probe);
    parts.push(
      s('line', { x1: px, x2: px, y1: YTOP, y2: YBOT, stroke: C.ink, 'stroke-width': 1.5, 'stroke-opacity': 0.55 }),
      s('circle', { cx: px, cy: YBOT, r: 6, fill: C.bg, stroke: C.ink, 'stroke-width': 2 })
    );

    // Legend top-right
    const items = [[PRIOR, 'Prior'], [DATA, 'Likelihood'], [POST, 'Posterior']];
    items.forEach(([col, name], i) => {
      const ly = YTOP + 14 + i * 18;
      parts.push(
        s('line', { x1: X1 - 92 * F, x2: X1 - 74 * F, y1: ly - 4, y2: ly - 4, stroke: col, 'stroke-width': 3 }),
        s('text', { x: X1 - 68 * F, y: ly, fill: col, 'font-size': 12 * F }, name)
      );
    });

    svg.replaceChildren(...parts);
    return { bandL, bandR };
  }

  function drawLog(map, totalM, totalN) {
    const LMIN = -5;
    const yLog = v => YTOP + (v / LMIN) * (YBOT - YTOP);
    const parts = [
      s('line', { x1: X0, x2: X1, y1: YTOP, y2: YTOP, stroke: C.ink, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X1, y1: YBOT, y2: YBOT, stroke: C.line, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: YTOP, y2: YBOT, stroke: C.muted, 'stroke-width': 1.8 })
    ];

    for (const v of [0, -1, -2, -3, -4, -5]) {
      const y = yLog(v);
      if (v < 0) parts.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.5 }));
      parts.push(s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' },
        v === 0 ? '0' : '−' + Math.abs(v)));
    }
    for (const v of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) {
      const x = xFor(v);
      parts.push(s('text', { x, y: YBOT + 18, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        v === 0 ? '0' : v.toFixed(1)));
    }
    parts.push(s('text', { x: (X0 + X1) / 2, y: VH - 8, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' },
      'Possible miss chance (drag to compare log scores)'));

    const sumFn = p => logRel(p, realM, realN) + logRel(p, priorM, priorN);
    if (priorN > 0) {
      parts.push(s('path', {
        d: curvePath(p => logRel(p, priorM, priorN), yLog, LMIN, 0.05),
        fill: 'none', stroke: PRIOR, 'stroke-width': 2.3
      }));
    }
    parts.push(
      s('path', {
        d: curvePath(p => logRel(p, realM, realN), yLog, LMIN, 0.05),
        fill: 'none', stroke: DATA, 'stroke-width': 2.3
      }),
      s('path', {
        d: curvePath(sumFn, yLog, LMIN, 0.05),
        fill: 'none', stroke: POST, 'stroke-width': 3.4
      })
    );

    // Probe vertical line and dots
    const px = xFor(probe);
    const lLike = logRel(probe, realM, realN);
    const lPrior = logRel(probe, priorM, priorN);
    const lSum = lLike + lPrior;
    const atPeak = Math.abs(probe - map) <= 0.01;

    parts.push(s('line', { x1: px, x2: px, y1: YTOP, y2: YBOT, stroke: atPeak ? WIN : C.ink, 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
    if (lLike >= LMIN) parts.push(s('circle', { cx: px, cy: yLog(lLike), r: 5, fill: DATA }));
    if (priorN > 0 && lPrior >= LMIN) parts.push(s('circle', { cx: px, cy: yLog(lPrior), r: 5, fill: PRIOR }));
    if (lSum >= LMIN) {
      parts.push(
        s('circle', { cx: px, cy: yLog(lSum), r: 6.5, fill: atPeak ? WIN : POST, stroke: C.bg, 'stroke-width': 2 }),
        s('text', {
          x: Math.min(X1 - 44, Math.max(X0 + 44, px)), y: YTOP - 10,
          fill: atPeak ? WIN : POST, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `p=${probe.toFixed(2)}  sum=${signed(lSum, 2)}`)
      );
    }

    svg.replaceChildren(...parts);
    return { lLike, lPrior, lSum };
  }

  function draw() {
    const realP = realM / realN;
    const priorP = priorN > 0 ? priorM / priorN : realP;
    const totalM = realM + priorM;
    const totalN = realN + priorN;
    const map = totalM / totalN;

    curvesTab.classList.toggle('go', view === 'curves');
    logTab.classList.toggle('go', view === 'log');
    curvesTab.setAttribute('aria-pressed', String(view === 'curves'));
    logTab.setAttribute('aria-pressed', String(view === 'log'));

    realMLab.textContent = `Real missed: ${realM} of ${realN} (${realP.toFixed(2)})`;
    realNLab.textContent = `Real appointments: ${realN}`;
    priorMLab.textContent = priorN === 0 ? 'Pretend missed: 0 (no prior)' : `Pretend missed: ${priorM} of ${priorN} (${priorP.toFixed(2)})`;
    priorNLab.textContent = `Pretend appointments (prior weight): ${priorN}`;

    renderDots();

    const lLike = logRel(probe, realM, realN);
    const lPrior = logRel(probe, priorM, priorN);
    const lSum = lLike + lPrior;

    if (view === 'curves') {
      const { bandL, bandR } = drawCurves(realP, priorP, map, totalM, totalN);
      fbox(box, [
        [`Real:    ${realM} / ${realN} = ${realP.toFixed(2)}`, DATA],
        [priorN === 0 ? 'Prior:   flat (0 pretend)' : `Prior:   ${priorM} / ${priorN} = ${priorP.toFixed(2)}`, PRIOR],
        `Combined: (${realM} + ${priorM}) ÷ (${realN} + ${priorN})`,
        [`MAP = ${totalM} ÷ ${totalN} = ${map.toFixed(2)}`, WIN]
      ]);
      const span = bandL != null ? ` The shaded width (${bandL.toFixed(2)} to ${bandR.toFixed(2)}) shows the uncertainty that remains.` : '';
      note.textContent = priorN === 0
        ? `With 0 pretend appointments, MAP matches the real share (${realP.toFixed(2)}).${span}`
        : `MAP sits between the prior (${priorP.toFixed(2)}) and the record (${realP.toFixed(2)}), pulled toward whichever has more appointments.${span}`;
    } else {
      drawLog(map, totalM, totalN);
      fbox(box, [
        [`Test chance = ${probe.toFixed(2)}`, C.ink],
        [`Log likelihood ≈ ${signed(lLike, 2)}`, DATA],
        [`Log prior      ≈ ${signed(lPrior, 2)}`, PRIOR],
        [`Sum            ≈ ${signed(lSum, 2)}`, Math.abs(probe - map) <= 0.01 ? WIN : POST],
        [`Peak (MAP) at ${map.toFixed(2)}`, WIN]
      ]);
      note.textContent = Math.abs(probe - map) <= 0.01
        ? `You are at the highest combined log score (${signed(lSum, 2)}). Shifting every score by a constant keeps the peak at ${map.toFixed(2)}.`
        : `Drag the line toward ${map.toFixed(2)} to make the sum closer to 0.`;
    }

    svg.setAttribute('aria-label', `MAP ${map.toFixed(2)}. Real ${realP.toFixed(2)}, prior ${priorN ? priorP.toFixed(2) : 'flat'}.`);
    chState = { view, probe, movedProbe, map, realM, realN, realP, priorM, priorN, priorP, randomCount };
    chal.update(chState);
  }

  draw();
  return () => tasks.removeEventListener('click', onTaskClick);
}

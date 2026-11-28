// 15.1.8 Try it: off-policy evaluation (inverse propensity weighting).
// Tap learner circles to flip outcomes, switch the new policy, vary original choice chances
// (to break overlap or create huge weights), and simulate fresh random records.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, fmt, challenges } = kit;

  // Shared lesson example from chapters/15.1.md (20 learners, 50/50 original policy)
  const START = {
    sA: [1, 1, 1, 1, 0], // Studied today + A: 4 / 5
    sB: [1, 1, 1, 0, 0], // Studied today + B: 3 / 5
    nA: [1, 0, 0, 0, 0], // Did not study + A: 1 / 5
    nB: [1, 1, 1, 1, 0], // Did not study + B: 4 / 5
  };
  // Hidden true return probabilities from chapters/15.1.md
  const TRUE_P = { sA: 0.80, sB: 0.60, nA: 0.20, nB: 0.80 };

  let data = cloneStart();
  let polS = 'A'; // new policy for learners who studied today ('A' or 'B')
  let polN = 'B'; // new policy for learners who did not study ('A' or 'B')
  let pA_S = 50;  // original policy % chance of A for studied today (0..100 step 5)
  let pA_N = 50;  // original policy % chance of A for did not study (0..100 step 5)
  let isLessonData = true;
  let history = []; // simulated IPW estimates (%)
  let smallPropTrials = 0;
  let playing = false;
  let timer = null;
  let speed = 3; // 1 (slow) .. 5 (fast)

  function cloneStart() {
    return { sA: START.sA.slice(), sB: START.sB.slice(), nA: START.nA.slice(), nB: START.nB.slice() };
  }

  function sampleRecord() {
    const out = { sA: [], sB: [], nA: [], nB: [] };
    for (let i = 0; i < 10; i++) {
      if (Math.random() < pA_S / 100) out.sA.push(Math.random() < TRUE_P.sA ? 1 : 0);
      else out.sB.push(Math.random() < TRUE_P.sB ? 1 : 0);
    }
    for (let i = 0; i < 10; i++) {
      if (Math.random() < pA_N / 100) out.nA.push(Math.random() < TRUE_P.nA ? 1 : 0);
      else out.nB.push(Math.random() < TRUE_P.nB ? 1 : 0);
    }
    return out;
  }

  function compute() {
    const pOld = {
      sA: pA_S / 100, sB: (100 - pA_S) / 100,
      nA: pA_N / 100, nB: (100 - pA_N) / 100,
    };
    const match = {
      sA: polS === 'A', sB: polS === 'B',
      nA: polN === 'A', nB: polN === 'B',
    };
    const keys = ['sA', 'sB', 'nA', 'nB'];
    const cells = {};
    let overlapOk = true, totalW = 0, totalN = 0;
    for (const k of keys) {
      const arr = data[k];
      const ret = arr.reduce((a, b) => a + b, 0);
      totalN += arr.length;
      let w = 0, broken = false;
      if (match[k]) {
        if (pOld[k] <= 0) { overlapOk = false; broken = true; w = null; }
        else w = 1 / pOld[k];
      }
      const wr = broken ? null : ret * w;
      if (wr != null) totalW += wr;
      cells[k] = { arr, n: arr.length, ret, match: match[k], pOld: pOld[k], w, wr, broken };
    }
    const est = overlapOk && totalN > 0 ? (totalW / totalN) * 100 : null;
    const trueRate = 0.5 * (polS === 'A' ? 80 : 60) + 0.5 * (polN === 'A' ? 20 : 80);
    return { cells, overlapOk, totalW, totalN, est, trueRate };
  }

  // Controls & layout
  const svg = s('svg', { viewBox: '0 0 700 480' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const btnSA = btn('A · Quiz', () => setPol('S', 'A'));
  const btnSB = btn('B · Reminder', () => setPol('S', 'B'));
  const btnNA = btn('A · Quiz', () => setPol('N', 'A'));
  const btnNB = btn('B · Reminder', () => setPol('N', 'B'));

  const slSVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.cyan } });
  const slNVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.amber } });
  const slS = h('input', { type: 'range', min: 0, max: 100, step: 5, value: pA_S, oninput: e => setProp('S', +e.target.value) });
  const slN = h('input', { type: 'range', min: 0, max: 100, step: 5, value: pA_N, oninput: e => setProp('N', +e.target.value) });

  const playBtn = btn('Play', () => togglePlay(), 'go');
  const speedVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const speedSl = h('input', {
    type: 'range', min: 1, max: 5, step: 1, value: speed,
    oninput: e => { speed = +e.target.value; if (playing) { stopPlay(); startPlay(); } draw(); }
  });
  const trialPill = h('span');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: off-policy evaluation'),
    h('p', { class: 'sub' }, 'Test a new prompt rule on old recorded results. Tap any learner circle to flip its outcome, switch the new rule, change the original chances, or draw fresh random records.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 700, color: C.ink } }, 'New rule · Studied today →'),
          btnSA, btnSB),
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 700, color: C.ink } }, 'New rule · Did not study →'),
          btnNA, btnNB),
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Original chance of A (studied):'),
          slS, slSVal),
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Original chance of A (not studied):'),
          slN, slNVal),
        h('div', { class: 'sim-row' },
          btn('Step (New data)', () => { stopPlay(); stepTrial(); }),
          playBtn,
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed:'),
          speedSl, speedVal,
          btn('Reset', () => resetAll()),
          trialPill)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Evaluate the policy that always chooses B (set both rows to B on the lesson data). Check its estimated return rate.',
      check: st => st.polS === 'B' && st.polN === 'B' && st.pA_S === 50 && st.pA_N === 50 && st.est === 70,
      why: 'Yes! Always choosing B uses only the B groups: (3 + 4) × 2 = 14, and 14 ÷ 20 = 70%, lower than the 80% new rule.'
    },
    {
      text: 'Switch back to the new rule (Studied → A, Did not study → B) at 50% original chances and run at least 5 random trials (Step or Play).',
      check: st => st.polS === 'A' && st.polN === 'B' && st.pA_S === 50 && st.pA_N === 50 && st.trials >= 5,
      why: 'Right: each 20-learner record varies a bit, because off-policy evaluation gives an estimate, not a guarantee — while the average centers near the true 80%.'
    },
    {
      text: 'Break overlap: set the original chance of A (studied today) to 0% while your new rule still chooses A for learners who studied today.',
      check: st => st.polS === 'A' && st.pA_S === 0,
      why: 'No overlap! Because the original policy never chose A for studied learners, we have zero results for that choice and cannot estimate the new rule.'
    },
    {
      text: 'See why tiny chances are unstable: set the original chance of A (studied today) to 5% (weight = 20) and run at least 3 new trials.',
      check: st => st.polS === 'A' && st.pA_S === 5 && st.smallPropTrials >= 3,
      why: 'With a 5% chance, each matching learner gets weight 20! Just one learner returning or not returning swings the estimate wildly.'
    }
  ]);

  function setPol(which, act) {
    stopPlay();
    if (which === 'S') polS = act; else polN = act;
    history = [];
    draw();
  }

  function setProp(which, val) {
    stopPlay();
    if (which === 'S') pA_S = val; else pA_N = val;
    isLessonData = false;
    history = [];
    data = sampleRecord();
    draw();
  }

  function stepTrial() {
    isLessonData = false;
    data = sampleRecord();
    const res = compute();
    if (res.est != null) {
      history.push(res.est);
      if (history.length > 40) history.shift();
      if (polS === 'A' && pA_S === 5) smallPropTrials++;
    }
    draw();
  }

  function startPlay() {
    if (playing) return;
    playing = true;
    const ms = [1100, 750, 480, 260, 130][speed - 1];
    timer = setInterval(() => {
      const res = compute();
      if (!res.overlapOk) { stopPlay(); draw(); return; }
      stepTrial();
    }, ms);
    draw();
  }

  function stopPlay() {
    playing = false;
    if (timer != null) { clearInterval(timer); timer = null; }
  }

  function togglePlay() {
    if (playing) { stopPlay(); draw(); }
    else startPlay();
  }

  function resetAll() {
    stopPlay();
    data = cloneStart();
    polS = 'A'; polN = 'B';
    pA_S = 50; pA_N = 50;
    slS.value = 50; slN.value = 50;
    isLessonData = true;
    history = [];
    smallPropTrials = 0;
    draw();
  }

  // Geometry for desktop vs phone
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 480;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const r1 = x => Math.round(x * 10) / 10;

  function drawCircle(k, cx, cy, state, r, onTap) {
    const g = s('g', { style: onTap ? 'cursor:pointer' : null });
    if (onTap) g.addEventListener('click', onTap);
    if (state === 1) {
      g.append(
        s('circle', { cx, cy, r: r * 1.25, fill: C.green, 'fill-opacity': 0.14 }),
        s('circle', { cx, cy, r, fill: C.green, 'fill-opacity': 0.22, stroke: C.green, 'stroke-width': 2 }),
        s('path', { d: `M ${cx - r * 0.42} ${cy + r * 0.02} L ${cx - r * 0.08} ${cy + r * 0.36} L ${cx + r * 0.45} ${cy - r * 0.34}`,
          fill: 'none', stroke: C.green, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      );
    } else if (state === 0) {
      g.append(
        s('circle', { cx, cy, r, fill: C.card, stroke: C.muted, 'stroke-width': 1.8 }),
        s('path', { d: `M ${cx - r * 0.33} ${cy - r * 0.33} L ${cx + r * 0.33} ${cy + r * 0.33} M ${cx + r * 0.33} ${cy - r * 0.33} L ${cx - r * 0.33} ${cy + r * 0.33}`,
          fill: 'none', stroke: C.muted, 'stroke-width': 2, 'stroke-linecap': 'round' })
      );
    } else {
      g.append(
        s('circle', { cx, cy, r, fill: C.bg, stroke: C.pink, 'stroke-width': 2 }),
        s('text', { x: cx, y: cy + 5, fill: C.pink, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '?')
      );
    }
    k.push(g);
  }

  function draw() {
    const res = compute();
    const k = [];

    // Button active styles
    btnSA.className = 'sim-btn ' + (polS === 'A' ? 'go' : '');
    btnSB.className = 'sim-btn ' + (polS === 'B' ? 'go' : '');
    btnNA.className = 'sim-btn ' + (polN === 'A' ? 'go' : '');
    btnNB.className = 'sim-btn ' + (polN === 'B' ? 'go' : '');
    playBtn.textContent = playing ? 'Pause' : 'Play';
    slSVal.textContent = `A: ${pA_S}% / B: ${100 - pA_S}%`;
    slNVal.textContent = `A: ${pA_N}% / B: ${100 - pA_N}%`;
    speedVal.textContent = ['Very slow', 'Slow', 'Medium', 'Fast', 'Very fast'][speed - 1];
    trialPill.replaceChildren(pill(`TRIALS: ${history.length}`, C.violet));

    // 2x2 table layout
    const colX = NARROW ? [10, 216] : [118, 410];
    const colW = NARROW ? 194 : 280;
    const rowY = NARROW ? [44, 182] : [32, 158];
    const rowH = NARROW ? 112 : 114;

    // Column headers
    k.push(
      s('text', { x: colX[0] + colW / 2, y: 20, fill: C.cyan, 'font-size': NARROW ? 14 : 16, 'font-weight': 700, 'text-anchor': 'middle' }, 'Prompt A · Quiz'),
      s('text', { x: colX[1] + colW / 2, y: 20, fill: C.amber, 'font-size': NARROW ? 14 : 16, 'font-weight': 700, 'text-anchor': 'middle' }, 'Prompt B · Reminder')
    );

    // Row headers
    if (NARROW) {
      k.push(
        s('text', { x: VW / 2, y: 38, fill: C.ink, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle' }, 'Studied today (10 learners)'),
        s('text', { x: VW / 2, y: 176, fill: C.ink, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle' }, 'Did not study (10 learners)')
      );
    } else {
      k.push(
        s('text', { x: 58, y: rowY[0] + 52, fill: C.ink, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle' }, 'Studied'),
        s('text', { x: 58, y: rowY[0] + 72, fill: C.ink, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle' }, 'today'),
        s('text', { x: 58, y: rowY[1] + 52, fill: C.ink, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle' }, 'Did not'),
        s('text', { x: 58, y: rowY[1] + 72, fill: C.ink, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle' }, 'study')
      );
    }

    const gridKeys = [['sA', 'sB'], ['nA', 'nB']];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const key = gridKeys[r][c];
        const cell = res.cells[key];
        const x = colX[c], y = rowY[r], w = colW, hgt = rowH;
        const accent = cell.broken ? C.pink : (cell.match ? (c === 0 ? C.cyan : C.amber) : C.line);
        const hugeW = cell.w != null && cell.w >= 10;

        k.push(s('rect', {
          x, y, width: w, height: hgt, rx: 12,
          fill: cell.broken ? C.bg : C.card,
          'fill-opacity': cell.match || cell.broken ? 0.96 : 0.48,
          stroke: hugeW ? C.pink : accent,
          'stroke-width': cell.match || cell.broken ? 2.5 : 1.2,
          'stroke-dasharray': cell.broken ? '6 4' : null
        }));

        // Top-left count & top-right weight pill
        const cntTxt = cell.broken ? '0 recorded' : `${cell.ret} / ${cell.n} ret`;
        k.push(s('text', {
          x: x + 10, y: y + 19, fill: cell.broken ? C.pink : (cell.match ? C.ink : C.muted),
          'font-size': NARROW ? 11.5 : 12.5, 'font-family': 'Consolas', 'font-weight': 700
        }, cntTxt));

        const wLabel = cell.broken ? 'NO OVERLAP' : `w = ${fmt(r1(cell.w))}`;
        const wCol = cell.broken || hugeW ? C.pink : (cell.match ? C.green : C.muted);
        const pw = cell.broken ? 86 : (wLabel.length * 7.6 + 16);
        k.push(
          s('rect', { x: x + w - pw - 8, y: y + 6, width: pw, height: 20, rx: 10, fill: C.bg, stroke: wCol, 'stroke-width': 1.4 }),
          s('text', { x: x + w - pw / 2 - 8, y: y + 20, fill: wCol, 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, wLabel)
        );

        // Learner circles (up to 10 in 2 neat rows of 5)
        if (cell.broken) {
          const rad = NARROW ? 11 : 13;
          const sp = NARROW ? 30 : 38;
          for (let i = 0; i < 4; i++) {
            drawCircle(k, x + w / 2 + (i - 1.5) * sp, y + 58, -1, rad, null);
          }
        } else if (cell.n === 0) {
          k.push(s('text', { x: x + w / 2, y: y + 62, fill: C.muted, 'font-size': 12.5, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '0 learners in sample'));
        } else {
          const twoRows = cell.n > 5;
          const rad = twoRows ? (NARROW ? 9.5 : 11) : (NARROW ? 12 : 14);
          const sp = twoRows ? (NARROW ? 31 : 40) : (NARROW ? 34 : 44);
          cell.arr.forEach((val, idx) => {
            const rowIdx = twoRows ? Math.floor(idx / 5) : 0;
            const colIdx = twoRows ? (idx % 5) : idx;
            const rowCount = twoRows ? (rowIdx === 0 ? 5 : cell.n - 5) : cell.n;
            const cx = x + w / 2 + (colIdx - (rowCount - 1) / 2) * sp;
            const cy = twoRows ? (y + 45 + rowIdx * 28) : (y + 58);
            drawCircle(k, cx, cy, val, rad, () => {
              stopPlay();
              data[key][idx] = data[key][idx] ? 0 : 1;
              isLessonData = false;
              draw();
            });
          });
        }

        // Bottom equation line inside cell
        const eqTxt = cell.broken
          ? 'old chance = 0%'
          : (cell.match ? `${cell.ret} × ${fmt(r1(cell.w))} = ${fmt(r1(cell.wr))}` : `${cell.ret} × 0 = 0 (skipped)`);
        const eqCol = cell.broken ? C.pink : (cell.match ? (hugeW ? C.pink : C.amber) : C.muted);
        k.push(s('text', {
          x: x + w / 2, y: y + hgt - 10, fill: eqCol,
          'font-size': NARROW ? 11.5 : 12.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, eqTxt));
      }
    }

    // Legend strip
    const legY = NARROW ? 310 : 292;
    k.push(
      s('text', { x: VW / 2, y: legY, fill: C.muted, 'font-size': NARROW ? 11.5 : 12.5, 'text-anchor': 'middle' },
        'Green ✓ = returned (1)   ·   Grey × = did not (0)   ·   Tap any circle to flip')
    );

    // Lower chart panel: trial history (or current estimate bar)
    const chartY = NARROW ? 324 : 308, chartH = VH - chartY - 8;
    const chartX = 10, chartW = VW - 20;
    k.push(s('rect', { x: chartX, y: chartY, width: chartW, height: chartH, rx: 12, fill: C.bg, stroke: C.line, 'stroke-width': 1.5 }));

    k.push(
      s('text', { x: chartX + 12, y: chartY + 19, fill: C.ink, 'font-size': NARROW ? 12 : 13, 'font-weight': 700 },
        history.length ? `Estimates across ${history.length} random trial${history.length === 1 ? '' : 's'}` : 'Current estimate vs hidden true rate'),
      s('text', { x: chartX + chartW - 12, y: chartY + 19, fill: C.green, 'font-size': NARROW ? 11.5 : 12.5, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `True rate: ${fmt(res.trueRate)}%`)
    );

    const px0 = chartX + 42, px1 = chartX + chartW - 14;
    const py0 = chartY + 32, py1 = chartY + chartH - 20;

    if (history.length === 0) {
      // Comparison bar: current estimate vs true rate
      const barY1 = py0 + 18, barY2 = py0 + 58, bh = 22;
      const maxBar = Math.max(100, res.est || 0);
      const toX = v => px0 + (Math.max(0, v) / maxBar) * (px1 - px0 - 52);

      // Estimate bar
      k.push(s('text', { x: px0 - 6, y: barY1 + 15, fill: C.amber, 'font-size': 11.5, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'Est'));
      if (res.est != null) {
        const bCol = res.est > 100 ? C.pink : C.amber;
        k.push(
          s('rect', { x: px0, y: barY1, width: Math.max(4, toX(res.est) - px0), height: bh, rx: 6, fill: bCol, 'fill-opacity': 0.85 }),
          s('text', { x: toX(res.est) + 8, y: barY1 + 15, fill: bCol, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas' }, `${fmt(r1(res.est))}%`)
        );
      } else {
        k.push(s('text', { x: px0 + 6, y: barY1 + 15, fill: C.pink, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas' }, 'Cannot estimate (no overlap)'));
      }

      // True bar
      k.push(
        s('text', { x: px0 - 6, y: barY2 + 15, fill: C.green, 'font-size': 11.5, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'True'),
        s('rect', { x: px0, y: barY2, width: Math.max(4, toX(res.trueRate) - px0), height: bh, rx: 6, fill: C.green, 'fill-opacity': 0.6 }),
        s('text', { x: toX(res.trueRate) + 8, y: barY2 + 15, fill: C.green, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas' }, `${fmt(res.trueRate)}%`),
        s('text', { x: (px0 + px1) / 2, y: py1 + 12, fill: C.muted, 'font-size': 11.5, 'text-anchor': 'middle' },
          'Press Step (New data) or Play to see how estimates vary across fresh samples.')
      );
    } else {
      // Growing trial plot
      const maxY = Math.max(120, Math.ceil(Math.max(...history, 100) / 20) * 20);
      const yOf = v => py1 - (v / maxY) * (py1 - py0);
      const stepX = history.length === 1 ? 0 : (px1 - px0) / Math.max(9, history.length - 1);

      for (const tick of [0, 50, 100, ...(maxY > 120 ? [maxY] : [])]) {
        const ty = yOf(tick);
        k.push(
          s('line', { x1: px0, x2: px1, y1: ty, y2: ty, stroke: C.line, 'stroke-width': 1 }),
          s('text', { x: px0 - 6, y: ty + 4, fill: C.muted, 'font-size': 10.5, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${tick}%`)
        );
      }

      // True rate dashed line
      const yTrue = yOf(res.trueRate);
      k.push(s('line', { x1: px0, x2: px1, y1: yTrue, y2: yTrue, stroke: C.green, 'stroke-width': 2, 'stroke-dasharray': '6 5' }));

      // Polyline of trial estimates + running mean
      let pts = '', avgPts = '', sum = 0;
      history.forEach((v, i) => {
        const x = px0 + i * stepX, y = yOf(v);
        sum += v;
        pts += `${x},${y} `;
        avgPts += `${x},${yOf(sum / (i + 1))} `;
      });
      if (history.length > 1) {
        k.push(
          s('polyline', { points: pts.trim(), fill: 'none', stroke: C.cyan, 'stroke-width': 1.8, 'stroke-opacity': 0.7 }),
          s('polyline', { points: avgPts.trim(), fill: 'none', stroke: C.amber, 'stroke-width': 2.5 })
        );
      }
      history.forEach((v, i) => {
        const x = px0 + i * stepX, y = yOf(v);
        const wild = v > 100 || Math.abs(v - res.trueRate) > 25;
        k.push(s('circle', { cx: x, cy: y, r: i === history.length - 1 ? 4.5 : 3, fill: wild ? C.pink : C.cyan }));
      });
      const avg = sum / history.length;
      k.push(s('text', { x: px0, y: py1 + 14, fill: C.amber, 'font-size': 11, 'font-family': 'Consolas' },
        `Running avg: ${fmt(r1(avg))}%  (latest: ${fmt(r1(history[history.length - 1]))}%)`));
    }

    svg.replaceChildren(...k);

    // Formula box
    if (!res.overlapOk) {
      fbox(box, [
        [`new policy: ${polS} (studied) / ${polN} (not)`, C.cyan],
        ['weight = new ÷ old = 100% ÷ 0%', C.pink],
        ['NO OVERLAP: cannot estimate!', C.pink],
        ['Every chosen action needs old chance > 0%.', C.muted]
      ]);
      note.textContent = 'Overlap is broken: the original policy gave 0% chance to an action your new policy wants to choose, so there are no recorded results for it.';
    } else {
      const c = res.cells;
      const parts = [c.sA.wr, c.sB.wr, c.nA.wr, c.nB.wr].map(v => fmt(r1(v)));
      const maxW = Math.max(c.sA.w, c.sB.w, c.nA.w, c.nB.w);
      const lines = [
        [`new policy: ${polS} (studied) / ${polN} (not)`, C.cyan],
        `weighted = ${parts.join(' + ')} = ${fmt(r1(res.totalW))}`,
        `learners = ${res.totalN}`,
        [`estimate = ${fmt(r1(res.totalW))} ÷ ${res.totalN} = ${fmt(r1(res.est))}%`, res.est > 100 ? C.pink : C.green]
      ];
      if (history.length > 0) {
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        lines.push([`avg over ${history.length} trials = ${fmt(r1(avg))}% (true ${res.trueRate}%)`, C.amber]);
      }
      fbox(box, lines);
      if (maxW >= 10) {
        note.textContent = `Warning: a very small original chance created weight ${fmt(r1(maxW))}. Press Step or Play to watch the estimate jump wildly from sample to sample!`;
      } else {
        note.textContent = 'Matching choices receive weight 1 ÷ original chance; non-matching choices receive weight 0. Divide the weighted total by all 20 learners.';
      }
    }

    chal.update({
      polS, polN, pA_S, pA_N, isLessonData,
      est: res.est == null ? null : Math.round(res.est * 100) / 100,
      trials: history.length,
      smallPropTrials
    });
  }

  draw();
  return () => stopPlay();
}

// 11.2.4 Try it: exponential smoothing.
// Step week by week, play/pause with speed control, drag any week's count,
// tune the smoothing weight, inspect the weight strip and error-vs-step curve,
// and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const HOTEL = [20, 24, 20, 23, 24, 29];
  const HOTEL_XMAS = 35;

  let counts = HOTEL.slice();
  let xmasReal = HOTEL_XMAS;
  let alpha = 0.5;
  let step = 1;           // current week reached (1..6)
  let revealed = false;   // whether week 7 (Christmas) is revealed
  let sel = 0;            // selected week index (0..5) for -1/+1
  let playing = false;
  let speed = 2;          // 1..5
  let timer = null;
  let usedNewData = false;
  let editedDot = false;

  const svg = s('svg', { viewBox: '0 0 700 540' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const iterBadge = h('span');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const alphaReadout = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.amber } });
  const speedReadout = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });

  const alphaSlider = h('input', {
    type: 'range', min: '0.1', max: '1', step: '0.05', value: String(alpha),
    style: { accentColor: C.amber, flex: '1 1 130px' },
    oninput: () => { alpha = Math.round(Number(alphaSlider.value) * 100) / 100; draw(); }
  });
  const speedSlider = h('input', {
    type: 'range', min: '1', max: '5', step: '1', value: String(speed),
    style: { accentColor: C.cyan, flex: '0 1 100px' },
    oninput: () => { speed = Number(speedSlider.value); draw(); }
  });

  const playBtn = btn('Play', togglePlay);
  const revealBtn = btn('Reveal Christmas', revealXmas);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: exponential smoothing'),
    h('p', { class: 'sub' }, 'Step through weeks 1 to 6 to see the amber level move partway toward each cyan dot. Drag any dot up or down, or slide the smoothing weight.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' },
          btn('Step →', stepOnce, 'go'),
          playBtn,
          btn('Reset', resetRun),
          revealBtn,
          iterBadge
        ),
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.5rem', flex: '1 1 220px' } },
            'Weight:', alphaSlider, alphaReadout),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.5rem', flex: '0 1 170px' } },
            'Speed:', speedSlider, speedReadout)
        ),
        h('div', { class: 'sim-row' },
          btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)),
          selLabel,
          btn('New data', newData),
          btn('Hotel data', hotelData)
        )
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  function compute() {
    const levels = [counts[0]];
    const gapsBefore = [];
    const gapsAfter = [];
    const moves = [];
    for (let i = 1; i < counts.length; i++) {
      const oldL = levels[i - 1];
      const gap = counts[i] - oldL;
      const mv = alpha * gap;
      const newL = oldL + mv;
      levels.push(newL);
      gapsBefore.push(gap);
      moves.push(mv);
      gapsAfter.push(counts[i] - newL);
    }
    return { levels, gapsBefore, gapsAfter, moves };
  }

  function weekWeights(t, a) {
    if (t === 1) return [1];
    const w = [];
    w.push(Math.pow(1 - a, t - 1));
    for (let k = 1; k < t; k++) w.push(a * Math.pow(1 - a, t - 1 - k));
    return w;
  }

  const r2 = x => Math.round(x * 100) / 100;
  const sgn = x => (x >= 0 ? '+' : '−') + fmt(r2(Math.abs(x)));
  const isDefaultData = () => counts.every((v, i) => v === HOTEL[i]) && xmasReal === HOTEL_XMAS;

  const chal = challenges(ch, [
    {
      text: 'On the hotel data with weight 0.5, press Step (or Play) through week 6 and press Reveal Christmas.',
      check: st => st.isDefault && Math.abs(st.alpha - 0.5) < 1e-6 && st.step >= 6 && st.revealed,
      why: 'Yes! At weight 0.5 the level finishes at 26 rooms, so the Christmas forecast is 26 — 9 rooms below the real 35.'
    },
    {
      text: 'Slide the weight all the way to 1.0 and reach week 6. Watch the amber line and the weight strip.',
      check: st => Math.abs(st.alpha - 1.0) < 1e-6 && st.step >= 6,
      why: 'At weight 1.0 the newest week gets 100% of the say: the marker jumps onto every dot with no smoothing at all.'
    },
    {
      text: 'Set a tiny weight (below 0.2), reach week 6, and reveal Christmas. Notice how far the marker lags behind.',
      check: st => st.alpha < 0.2 && st.step >= 6 && st.revealed,
      why: 'With a tiny weight each new week barely moves the marker, so the level lags far behind rising counts.'
    },
    {
      text: 'Press “New data” (or drag a week’s dot), then step to week 6. Check the pink and green error curves.',
      check: st => (st.usedNewData || st.editedDot) && st.step >= 6,
      why: 'On any data, moving partway toward each new dot always shrinks that week’s gap, while the forecast stays flat ahead.'
    }
  ]);

  function stopPlay() {
    playing = false;
    if (timer) { clearTimeout(timer); timer = null; }
    playBtn.textContent = 'Play';
  }

  function scheduleNext() {
    if (!playing) return;
    const ms = [1300, 900, 620, 420, 260][speed - 1] || 700;
    timer = setTimeout(() => {
      timer = null;
      if (!playing) return;
      if (step < 6) {
        step++;
        draw();
        scheduleNext();
      } else if (!revealed) {
        revealed = true;
        stopPlay();
        draw();
      } else {
        stopPlay();
        draw();
      }
    }, ms);
  }

  function togglePlay() {
    if (playing) { stopPlay(); return; }
    if (step >= 6 && revealed) { step = 1; revealed = false; }
    playing = true;
    playBtn.textContent = 'Pause';
    draw();
    scheduleNext();
  }

  function stepOnce() {
    stopPlay();
    if (step < 6) step++;
    else if (!revealed) revealed = true;
    draw();
  }

  function resetRun() {
    stopPlay();
    step = 1;
    revealed = false;
    draw();
  }

  function revealXmas() {
    stopPlay();
    if (step < 6) step = 6;
    revealed = !revealed;
    draw();
  }

  function bump(d) {
    counts[sel] = Math.max(0, Math.min(40, counts[sel] + d));
    editedDot = true;
    draw();
  }

  function newData() {
    stopPlay();
    let cur = rnd(14, 26);
    const drift = rnd(-1, 2);
    counts = [];
    for (let i = 0; i < 6; i++) {
      cur = Math.max(6, Math.min(36, cur + drift + rnd(-4, 4)));
      counts.push(cur);
    }
    xmasReal = Math.max(8, Math.min(40, counts[5] + rnd(2, 9)));
    step = 1;
    revealed = false;
    usedNewData = true;
    draw();
  }

  function hotelData() {
    stopPlay();
    counts = HOTEL.slice();
    xmasReal = HOTEL_XMAS;
    alpha = 0.5;
    alphaSlider.value = '0.5';
    step = 1;
    revealed = false;
    sel = 0;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 540, F = NARROW ? 1.12 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 38 : 54, X1 = VW - 16, WPLOT = X1 - X0;
  const YTOP = 28, YBASE = 248;
  const wx = w => X0 + (w - 0.5) * WPLOT / 8;
  const ry = v => YBASE - (v / 40) * (YBASE - YTOP);

  // Dragging cyan dots for weeks 1..6
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < YTOP - 14 || p.y > YBASE + 26) return;
    let best = -1, bestDist = WPLOT / 12;
    for (let i = 0; i < 6; i++) {
      const d = Math.abs(p.x - wx(i + 1));
      if (d < bestDist) { bestDist = d; best = i; }
    }
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    moveDot(e);
  });
  function moveDot(e) {
    if (dragging < 0) return;
    const p = toSvg(e);
    const v = Math.max(0, Math.min(40, Math.round(((YBASE - p.y) / (YBASE - YTOP)) * 40)));
    if (v !== counts[dragging]) { counts[dragging] = v; editedDot = true; }
    draw();
  }
  svg.addEventListener('pointermove', moveDot);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const { levels, gapsBefore, gapsAfter, moves } = compute();
    const k = [];

    // ---- 1. Hotel rooms chart ----
    for (let g = 0; g <= 40; g += 10) {
      const y = ry(g);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 7, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    }
    // Christmas week dashed guide
    k.push(s('line', { x1: wx(7), x2: wx(7), y1: YTOP, y2: YBASE, stroke: C.amber, 'stroke-opacity': 0.4, 'stroke-dasharray': '5 5' }),
      s('text', { x: wx(7), y: YTOP - 8, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'Xmas'));

    // Selected week subtle column highlight
    const colW = WPLOT / 8;
    k.push(s('rect', { x: wx(sel + 1) - colW * 0.44, y: YTOP - 4, width: colW * 0.88, height: YBASE - YTOP + 8, fill: '#ffffff', 'fill-opacity': 0.045, rx: 6 }));

    // X-axis week ticks
    for (let w = 1; w <= 8; w++) {
      k.push(s('text', {
        x: wx(w), y: YBASE + 19, fill: w === 7 ? C.amber : (w - 1 === sel ? C.cyan : C.muted),
        'font-size': 12.5 * F, 'font-weight': w === 7 || w - 1 === sel ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, w === 7 ? 'W7' : 'W' + w));
    }

    // Cyan actual polyline (weeks 1..6 always draggable; future weeks slightly dimmer if not yet reached)
    for (let i = 0; i < 5; i++) {
      const reached = i + 2 <= step;
      k.push(s('line', {
        x1: wx(i + 1), y1: ry(counts[i]), x2: wx(i + 2), y2: ry(counts[i + 1]),
        stroke: C.cyan, 'stroke-width': reached ? 2.8 : 1.8, 'stroke-opacity': reached ? 0.9 : 0.32
      }));
    }

    // Amber level polyline up to current step
    for (let i = 0; i < step - 1; i++) {
      k.push(s('line', {
        x1: wx(i + 1), y1: ry(levels[i]), x2: wx(i + 2), y2: ry(levels[i + 1]),
        stroke: C.amber, 'stroke-width': 3.4
      }));
    }

    // Current step before/after gap brackets (when step >= 2)
    if (step >= 2) {
      const idx = step - 1;
      const oldL = levels[idx - 1], newL = levels[idx], act = counts[idx];
      const cx = wx(step);
      // Horizontal dashed carry from old level
      k.push(s('line', { x1: wx(step - 1), y1: ry(oldL), x2: cx, y2: ry(oldL), stroke: C.amber, 'stroke-width': 1.8, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.75 }));
      // Gap before (pink) on left of dot
      k.push(s('line', { x1: cx - 12, y1: ry(oldL), x2: cx - 12, y2: ry(act), stroke: C.pink, 'stroke-width': 3.5 }));
      // Gap after (green) on right of dot
      k.push(s('line', { x1: cx + 12, y1: ry(newL), x2: cx + 12, y2: ry(act), stroke: C.green, 'stroke-width': 3.5 }));
    }

    // Flat dashed amber forecast ahead from current step's level
    const curL = levels[step - 1];
    k.push(s('line', {
      x1: wx(step), y1: ry(curL), x2: wx(8), y2: ry(curL),
      stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '8 6'
    }));
    // Forecast pill at week 7 if step === 6
    if (step === 6) {
      k.push(s('circle', { cx: wx(7), cy: ry(curL), r: 5.5, fill: C.bg, stroke: C.amber, 'stroke-width': 2.8 }));
      k.push(s('text', { x: wx(7), y: ry(curL) + 18, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(curL))));
    }

    // Cyan actual dots & labels (weeks 1..6)
    for (let i = 0; i < 6; i++) {
      const reached = i + 1 <= step;
      const cx = wx(i + 1), cy = ry(counts[i]);
      const above = !reached || counts[i] >= levels[i];
      k.push(s('circle', { cx, cy, r: i === sel ? 14 : 11, fill: C.cyan, 'fill-opacity': reached ? 0.2 : 0.08 }),
        s('circle', { cx, cy, r: 5.5, fill: C.cyan, 'fill-opacity': reached ? 1 : 0.45 }),
        s('text', {
          x: cx, y: cy + (above ? -13 : 19), fill: C.cyan, 'fill-opacity': reached ? 1 : 0.55,
          'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, counts[i]));
    }

    // Amber level dots & active ring marker
    for (let i = 0; i < step; i++) {
      const cx = wx(i + 1), cy = ry(levels[i]);
      const isCur = i === step - 1;
      if (isCur) {
        k.push(s('circle', { cx, cy, r: 10.5, fill: C.amber, 'fill-opacity': 0.22, stroke: C.amber, 'stroke-width': 3 }));
      } else {
        k.push(s('circle', { cx, cy, r: 4.5, fill: C.amber }));
      }
      const labBelow = counts[i] >= levels[i];
      if (!isCur || Math.abs(counts[i] - levels[i]) > 0.3 || i === 0) {
        k.push(s('text', {
          x: cx, y: cy + (labBelow ? 21 : -14), fill: C.amber,
          'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, fmt(r2(levels[i]))));
      }
    }

    // Week 7 Christmas dot (hidden badge or revealed white dot + error)
    if (revealed) {
      const cx7 = wx(7), cyReal = ry(xmasReal), cyFc = ry(levels[5]);
      k.push(s('line', { x1: cx7 + 10, y1: cyFc, x2: cx7 + 10, y2: cyReal, stroke: C.pink, 'stroke-width': 3.5 }),
        s('circle', { cx: cx7, cy: cyReal, r: 12, fill: C.ink, 'fill-opacity': 0.22 }),
        s('circle', { cx: cx7, cy: cyReal, r: 6, fill: C.ink }),
        s('text', { x: cx7, y: cyReal - 13, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, xmasReal),
        s('text', { x: cx7 + 16, y: (cyFc + cyReal) / 2 + 4, fill: C.pink, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, sgn(xmasReal - levels[5])));
    } else {
      const boxW = Math.min(34, colW * 0.72);
      k.push(s('rect', { x: wx(7) - boxW / 2, y: YTOP + 18, width: boxW, height: 30, rx: 6, fill: C.card, stroke: C.amber, 'stroke-width': 1.8 }),
        s('text', { x: wx(7), y: YTOP + 38, fill: C.amber, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '?'));
    }

    // ---- 2. Weight strip at current step ----
    const SY = 304, SH = 32;
    const wts = weekWeights(step, alpha);
    k.push(s('text', { x: X0, y: SY - 9, fill: C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      `WEIGHTS IN WEEK ${step} LEVEL (OLDEST → NEWEST)`));
    k.push(s('rect', { x: X0, y: SY, width: WPLOT, height: SH, rx: 5, fill: C.bg, stroke: C.line, 'stroke-width': 1.5 }));
    let sx = X0;
    wts.forEach((wt, i) => {
      const sw = wt * WPLOT;
      if (sw < 0.4) { sx += sw; return; }
      const isStart = i === 0 && step > 1;
      const col = isStart ? C.amber : C.cyan;
      const op = isStart ? 0.75 : (0.28 + 0.62 * ((i + 1) / step));
      k.push(s('rect', { x: sx, y: SY, width: sw, height: SH, fill: col, 'fill-opacity': op, stroke: C.bg, 'stroke-width': 1.4 }));
      const pct = Math.round(wt * 100);
      if (sw >= (NARROW ? 38 : 48)) {
        k.push(s('text', {
          x: sx + sw / 2, y: SY + 21, fill: (i === step - 1 || isStart) ? C.bg : C.ink,
          'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `W${i + 1} ${pct}%`));
      }
      sx += sw;
    });
    const summaryW = wts.map((wt, i) => `W${i + 1}:${fmt(Math.round(wt * 1000) / 10)}%`).reverse().join('  ');
    k.push(s('text', { x: X0, y: SY + SH + 16, fill: C.muted, 'font-size': 10.5 * F, 'font-family': 'Consolas' },
      summaryW.length > (NARROW ? 46 : 74) ? summaryW.slice(0, NARROW ? 44 : 72) + '…' : summaryW));

    // ---- 3. Error vs step curve (growing loss-versus-iteration) ----
    const EY0 = 402, EY1 = 504, EH = EY1 - EY0;
    const xmasErr = Math.abs(xmasReal - levels[5]);
    const maxErr = Math.max(10, ...gapsBefore.map(Math.abs), revealed ? xmasErr : 0);
    const ex = w => X0 + ((w - 2) / 5) * (WPLOT - 16) + 8;
    const ey = e => EY1 - (e / maxErr) * EH;

    k.push(s('text', { x: X0, y: EY0 - 10, fill: C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      'ERROR VS. STEP: BEFORE MOVE (PINK) · AFTER MOVE (GREEN)'));
    k.push(s('rect', { x: X0, y: EY0, width: WPLOT, height: EH, rx: 6, fill: C.bg, stroke: C.line, 'stroke-width': 1.2 }));
    for (const frac of [0, 0.5, 1]) {
      const val = Math.round(maxErr * frac);
      const y = ey(val);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.55 }),
        s('text', { x: X0 - 6, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, val));
    }
    for (let w = 2; w <= 7; w++) {
      k.push(s('text', {
        x: ex(w), y: EY1 + 17, fill: w === 7 ? C.amber : C.muted,
        'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, w === 7 ? 'Xmas' : 'W' + w));
    }
    // Growing pink (before move) and green (after move) lines up to current step
    const ptsBefore = [], ptsAfter = [];
    for (let w = 2; w <= step; w++) {
      const eb = Math.abs(gapsBefore[w - 2]), ea = Math.abs(gapsAfter[w - 2]);
      ptsBefore.push([ex(w), ey(eb), eb]);
      ptsAfter.push([ex(w), ey(ea), ea]);
    }
    if (ptsBefore.length >= 2) {
      k.push(s('polyline', { points: ptsBefore.map(p => `${p[0]},${p[1]}`).join(' '), fill: 'none', stroke: C.pink, 'stroke-width': 2.5 }),
        s('polyline', { points: ptsAfter.map(p => `${p[0]},${p[1]}`).join(' '), fill: 'none', stroke: C.green, 'stroke-width': 2.5 }));
    }
    ptsBefore.forEach(([x, y, val]) => {
      k.push(s('circle', { cx: x, cy: y, r: 4.5, fill: C.pink }),
        s('text', { x, y: y - 8, fill: C.pink, 'font-size': 10.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(val))));
    });
    ptsAfter.forEach(([x, y, val]) => {
      k.push(s('circle', { cx: x, cy: y, r: 4, fill: C.green }),
        s('text', { x, y: y + 14, fill: C.green, 'font-size': 10.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(val))));
    });
    if (revealed) {
      const x7 = ex(7), y7 = ey(xmasErr);
      k.push(s('circle', { cx: x7, cy: y7, r: 6, fill: C.amber, stroke: C.pink, 'stroke-width': 2 }),
        s('text', { x: x7, y: y7 - 10, fill: C.amber, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(xmasErr))));
    }

    svg.replaceChildren(...k);

    // ---- Formula box & UI readouts ----
    iterBadge.replaceChildren(pill(revealed ? 'STEP 6 / 6 · CHECKED' : `STEP ${step} / 6`, revealed ? C.green : C.cyan));
    alphaReadout.textContent = alpha.toFixed(2);
    speedReadout.textContent = `${speed}×`;
    selLabel.textContent = `Selected: W${sel + 1} (${counts[sel]} rooms)`;
    revealBtn.textContent = revealed ? 'Hide Christmas' : 'Reveal Christmas';

    if (step === 1) {
      fbox(box, [
        `week 1: count = ${counts[0]}`,
        [`start level   = ${counts[0]}`, C.amber],
        `weight        = ${alpha.toFixed(2)}`,
        ['press Step or Play to update', C.cyan]
      ]);
      note.textContent = 'Start by placing the amber marker on week 1’s count. Each step moves partway toward the next week’s dot.';
    } else if (revealed) {
      const fc = levels[5];
      const err = xmasReal - fc;
      const avgBefore = gapsBefore.reduce((a, b) => a + Math.abs(b), 0) / gapsBefore.length;
      fbox(box, [
        `last level (W6)    = ${fmt(r2(fc))}`,
        [`Christmas forecast = ${fmt(r2(fc))}`, C.amber],
        `real Christmas     = ${xmasReal}`,
        [`forecast error     = ${sgn(err)} (${err >= 0 ? 'low' : 'high'})`, C.pink],
        [`avg step error     = ${fmt(r2(avgBefore))}`, C.muted]
      ]);
      note.textContent = 'The dashed amber line stays flat ahead at the last level, so rising counts or a holiday jump leave it behind.';
    } else {
      const i = step - 1;
      const oldL = levels[i - 1], newL = levels[i], gap = gapsBefore[i - 1], mv = moves[i - 1], aft = gapsAfter[i - 1];
      fbox(box, [
        `week ${step}: count = ${counts[i]}`,
        `old level     = ${fmt(r2(oldL))}`,
        [`gap before    = ${sgn(gap)}`, C.pink],
        [`move (${alpha.toFixed(2)}×gap) = ${sgn(mv)}`, C.green],
        [`new level     = ${fmt(r2(newL))}`, C.amber],
        `gap after     = ${fmt(r2(Math.abs(aft)))}`
      ]);
      note.textContent = alpha === 1
        ? 'At weight 1.0 the marker jumps all the way onto the new dot, leaving zero gap after the move and zero smoothing.'
        : `Moving ${Math.round(alpha * 100)}% across the gap shrinks this week’s error from ${fmt(r2(Math.abs(gap)))} to ${fmt(r2(Math.abs(aft)))}.`;
    }

    chal.update({
      alpha, step, revealed,
      isDefault: isDefaultData(),
      usedNewData, editedDot
    });
  }

  draw();
  return () => stopPlay();
}

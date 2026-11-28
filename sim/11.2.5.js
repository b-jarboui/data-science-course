// 11.2.5 Try it: Holt's method (level + trend staircase, stepped week by week).
// Drag any week's room count, tune the level and trend weights, step or play through
// the weekly updates, watch the error curve grow, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const HOTEL = [20, 24, 20, 23, 24, 29, 35, 33];
  const MAX_STEP = 4; // steps 0..4 correspond to being at week 4..8

  let rooms = HOTEL.slice();
  let lw = 0.5;   // level weight
  let tw = 0.5;   // trend weight
  let step = 2;   // start at end of Week 6 (the lesson snapshot)
  let sel = 5;    // selected week index (0..7)
  let speed = 2;  // 1..4 (steps per ~2s .. 0.5s)
  let playing = false;
  let timer = null;
  let isRandom = false;
  let stepsClicked = 0;
  let steppedAtZero = false;

  const r2 = x => Math.round(x * 100) / 100;
  const sfmt = x => {
    const v = r2(x);
    return v > 0 ? '+' + fmt(v) : v < 0 ? '−' + fmt(Math.abs(v)) : '0';
  };

  function computeHolt(arr, a, b) {
    const L0 = arr[3];
    const T0 = (arr[3] - arr[0]) / 3;
    const states = [{ week: 4, level: L0, trend: T0, expected: null, real: arr[3], error: null, prevLevel: null, prevTrend: null, rise: null }];
    for (let k = 1; k <= MAX_STEP; k++) {
      const prev = states[k - 1];
      const expected = prev.level + prev.trend;
      const real = arr[3 + k];
      const error = real - expected;
      const level = expected + a * error;
      const rise = level - prev.level;
      const trend = prev.trend + b * (rise - prev.trend);
      states.push({ week: 4 + k, level, trend, expected, real, error, prevLevel: prev.level, prevTrend: prev.trend, rise });
    }
    return states;
  }

  function makeRandomHotel() {
    for (let tries = 0; tries < 12; tries++) {
      const dir = Math.random() < 0.65 ? 1 : -1;
      const slope = dir * rnd(1, 3);
      const base = dir > 0 ? rnd(10, 16) : rnd(27, 34);
      const arr = [];
      for (let i = 0; i < 8; i++) {
        const noise = i === 2 ? rnd(-2, 2) : rnd(-1, 1);
        arr.push(Math.max(4, Math.min(38, base + slope * i + noise)));
      }
      const st = computeHolt(arr, 0.5, 0.5);
      const mae = st.slice(1).reduce((acc, x) => acc + Math.abs(x.error), 0) / MAX_STEP;
      if (mae < 2.2) return arr;
    }
    return [14, 16, 17, 20, 22, 24, 26, 28];
  }

  // UI elements
  const svg = s('svg');
  const lossSvg = s('svg');
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const stepBadge = h('span');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const playBtn = btn('Play', togglePlay, 'go');

  const lwVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: '700' } });
  const twVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.green, fontWeight: '700' } });
  const spdVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: '700' } });

  const lwInput = h('input', {
    type: 'range', min: '0', max: '1', step: '0.05', value: String(lw),
    style: { width: '120px', accentColor: C.amber },
    oninput: e => { lw = +e.target.value; draw(); }
  });
  const twInput = h('input', {
    type: 'range', min: '0', max: '1', step: '0.05', value: String(tw),
    style: { width: '120px', accentColor: C.green },
    oninput: e => { tw = +e.target.value; draw(); }
  });
  const spdInput = h('input', {
    type: 'range', min: '1', max: '4', step: '1', value: String(speed),
    style: { width: '90px', accentColor: C.cyan },
    oninput: e => { speed = +e.target.value; draw(); }
  });

  const sliderWrap = (label, input, readout) => h('label', {
    style: { display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.9rem', color: '#cfd7f0' }
  }, label, input, readout);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Holt’s method'),
    h('p', { class: 'sub' }, 'Step through each week to see how the level and trend update, or drag any dot up and down and tune the two weights.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        lossSvg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Step', doStep, 'go'),
          playBtn,
          btn('Reset to Week 4', () => { stopPlay(); step = 0; draw(); }),
          stepBadge,
          sliderWrap('Speed', spdInput, spdVal)
        ),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          sliderWrap('Level weight', lwInput, lwVal),
          sliderWrap('Trend weight', twInput, twVal)
        ),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)),
          selLabel,
          btn('New data (random)', () => {
            stopPlay();
            rooms = makeRandomHotel();
            isRandom = true;
            step = 0;
            draw();
          }),
          btn('Hotel example', () => {
            stopPlay();
            rooms = HOTEL.slice();
            lw = 0.5; tw = 0.5;
            lwInput.value = '0.5'; twInput.value = '0.5';
            isRandom = false;
            step = 2;
            draw();
          })
        )
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  const chal = challenges(ch, [
    {
      text: 'Press "Step" until you reach Week 7 (Christmas) and see how far the staircase misses the holiday jump.',
      check: st => st.step >= 3 && st.stepsClicked >= 1,
      why: 'Yes! Holt’s staircase keeps the same weekly step, so a sudden holiday jump lands well above the forecast.'
    },
    {
      text: 'Set both Level weight and Trend weight to 0, then step or press Play. Watch the staircase freeze.',
      check: st => st.lw === 0 && st.tw === 0 && st.steppedAtZero,
      why: 'With zero weights, the model ignores every new room count and keeps its Week 4 staircase forever.'
    },
    {
      text: 'Set both weights to 1 and run through Week 8. See how sharply the staircase swings.',
      check: st => st.lw === 1 && st.tw === 1 && st.step === MAX_STEP,
      why: 'With weights of 1, Holt’s method chases every single jump in full, making the next forecast overshoot.'
    },
    {
      text: 'Press "New data (random)", run to Week 8, and tune the weights so average error is under 2.5 rooms.',
      check: st => st.isRandom && st.step === MAX_STEP && st.mae < 2.5,
      why: 'Nice! When room counts move steadily, moderate weights track the trend smoothly and keep errors small.'
    }
  ]);

  function stopPlay() {
    playing = false;
    if (timer !== null) { clearTimeout(timer); timer = null; }
    playBtn.textContent = 'Play';
  }

  function advanceOne() {
    if (step < MAX_STEP) {
      step++;
      stepsClicked++;
      if (lw === 0 && tw === 0) steppedAtZero = true;
    } else {
      step = 0;
    }
    draw();
  }

  function doStep() {
    stopPlay();
    advanceOne();
  }

  function tickPlay() {
    if (!playing) return;
    if (step >= MAX_STEP) {
      stopPlay();
      draw();
      return;
    }
    advanceOne();
    if (step >= MAX_STEP) {
      stopPlay();
      draw();
      return;
    }
    const ms = [1400, 950, 600, 340][speed - 1] || 950;
    timer = setTimeout(tickPlay, ms);
  }

  function togglePlay() {
    if (playing) { stopPlay(); return; }
    if (step >= MAX_STEP) { step = 0; draw(); }
    playing = true;
    playBtn.textContent = 'Pause';
    const ms = [1400, 950, 600, 340][speed - 1] || 950;
    timer = setTimeout(tickPlay, Math.min(450, ms));
  }

  function bump(d) {
    rooms[sel] = Math.max(0, Math.min(40, rooms[sel] + d));
    draw();
  }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 345, LVH = 140;
  const F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 40 : 54, X1 = VW - 18, TOP = 26, BASE = 294;
  const PAD = NARROW ? 22 : 34;
  const DX = (X1 - X0 - 2 * PAD) / 7;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  lossSvg.setAttribute('viewBox', `0 0 ${VW} ${LVH}`);

  const wx = i => X0 + PAD + i * DX;
  let yMin = 0, yMax = 40;
  const ry = v => BASE - ((v - yMin) / (yMax - yMin)) * (BASE - TOP);
  const yToRoom = y => yMin + ((BASE - y) / (BASE - TOP)) * (yMax - yMin);

  // Drag any week's dot up/down
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bestD = DX * 0.55;
    for (let i = 0; i < 8; i++) {
      const d = Math.abs(p.x - wx(i));
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    moveDot(e);
  });
  function moveDot(e) {
    if (dragging < 0) return;
    const p = toSvg(e);
    rooms[dragging] = Math.max(0, Math.min(40, Math.round(yToRoom(p.y))));
    draw();
  }
  svg.addEventListener('pointermove', moveDot);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const states = computeHolt(rooms, lw, tw);
    const cur = states[step];
    const curIdx = 3 + step; // 3..7 (weeks 4..8)

    // Compute forecasts ahead from curIdx
    const forecasts = [];
    for (let i = curIdx + 1; i < 8; i++) {
      forecasts.push({ idx: i, val: cur.level + cur.trend * (i - curIdx) });
    }

    // Auto-range y axis cleanly (at least 0..40, expands if weights=1 overshoots)
    const allVals = [...rooms, cur.level, ...forecasts.map(f => f.val), ...states.slice(0, step + 1).map(st => st.level)];
    yMin = Math.min(0, Math.floor(Math.min(...allVals) / 10) * 10);
    yMax = Math.max(40, Math.ceil(Math.max(...allVals) / 10) * 10);

    const k = [];
    // Horizontal grid lines
    const yStep = (yMax - yMin) > 60 ? 20 : 10;
    for (let g = yMin; g <= yMax; g += yStep) {
      const y = ry(g);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-width': g === 0 ? 1.8 : 1 }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }
    k.push(s('text', { x: X0, y: TOP - 10, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Segoe UI, Arial' }, 'rooms'));

    // Shaded future zone for weeks > curIdx
    if (curIdx < 7) {
      const fx0 = wx(curIdx) + DX * 0.5;
      k.push(s('rect', { x: fx0, y: TOP, width: X1 - fx0, height: BASE - TOP, fill: '#ffffff', 'fill-opacity': 0.025, rx: 6 }));
    }

    // Selected week highlight column
    k.push(s('rect', {
      x: wx(sel) - DX * 0.42, y: TOP - 4, width: DX * 0.84, height: BASE - TOP + 8,
      fill: '#ffffff', 'fill-opacity': 0.045, rx: 8
    }));

    // Real room series lines
    for (let i = 0; i < 7; i++) {
      const future = i >= curIdx;
      const col = i >= 5 && !future ? C.ink : C.cyan;
      k.push(s('line', {
        x1: wx(i), y1: ry(rooms[i]), x2: wx(i + 1), y2: ry(rooms[i + 1]),
        stroke: i >= 6 ? C.ink : col, 'stroke-width': future ? 1.8 : 2.6,
        'stroke-opacity': future ? 0.35 : 0.85, 'stroke-dasharray': future ? '4 4' : null
      }));
    }

    // Historical amber level path (from Week 4 to curIdx)
    for (let sIdx = 1; sIdx <= step; sIdx++) {
      const a = states[sIdx - 1], b = states[sIdx];
      k.push(s('line', {
        x1: wx(2 + sIdx), y1: ry(a.level), x2: wx(3 + sIdx), y2: ry(b.level),
        stroke: C.amber, 'stroke-width': 3, 'stroke-opacity': 0.9
      }));
    }

    // Current step's expected point + error bar (when step >= 1)
    if (step >= 1) {
      const prev = states[step - 1];
      const cx = wx(curIdx), yExp = ry(cur.expected), yReal = ry(cur.real), yPrev = ry(prev.level);
      k.push(
        s('line', { x1: wx(curIdx - 1), y1: yPrev, x2: cx, y2: yPrev, stroke: C.amber, 'stroke-width': 1.8, 'stroke-opacity': 0.5 }),
        s('line', { x1: cx, y1: yPrev, x2: cx, y2: yExp, stroke: C.amber, 'stroke-width': 1.8, 'stroke-opacity': 0.5 }),
        s('circle', { cx, cy: yExp, r: 5.5, fill: C.bg, stroke: C.amber, 'stroke-width': 2.2 })
      );
      if (Math.abs(cur.error) > 0.01) {
        k.push(
          s('line', { x1: cx, y1: yExp, x2: cx, y2: yReal, stroke: C.pink, 'stroke-width': 3.5 }),
          s('text', {
            x: cx + 10, y: (yExp + yReal) / 2 + 4, fill: C.pink,
            'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas'
          }, sfmt(cur.error))
        );
      }
    }

    // Forecast amber staircase from curIdx forward
    let prevX = wx(curIdx), prevY = ry(cur.level);
    for (const f of forecasts) {
      const fx = wx(f.idx), fy = ry(f.val);
      k.push(
        s('line', { x1: prevX, y1: prevY, x2: fx, y2: prevY, stroke: C.amber, 'stroke-width': 2.2, 'stroke-opacity': 0.75 }),
        s('line', { x1: fx, y1: prevY, x2: fx, y2: fy, stroke: C.amber, 'stroke-width': 2.2, 'stroke-opacity': 0.75 }),
        s('line', { x1: prevX, y1: prevY, x2: fx, y2: fy, stroke: C.amber, 'stroke-width': 2.6, 'stroke-dasharray': '6 5' })
      );
      // Forecast error gap to real dot (dim pink)
      const ryReal = ry(rooms[f.idx]);
      if (Math.abs(rooms[f.idx] - f.val) > 0.05) {
        k.push(s('line', {
          x1: fx, y1: fy, x2: fx, y2: ryReal,
          stroke: C.pink, 'stroke-width': 2.4, 'stroke-dasharray': '3 3', 'stroke-opacity': 0.75
        }));
      }
      k.push(
        s('circle', { cx: fx, cy: fy, r: 5.5, fill: C.amber }),
        s('text', {
          x: fx, y: fy + (f.val <= rooms[f.idx] ? 18 : -11), fill: C.amber,
          'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, fmt(r2(f.val)))
      );
      prevX = fx; prevY = fy;
    }

    // Real room dots + labels
    for (let i = 0; i < 8; i++) {
      const cx = wx(i), cy = ry(rooms[i]);
      const isHoliday = i >= 6;
      const isFuture = i > curIdx;
      const col = isHoliday ? C.ink : C.cyan;
      k.push(
        s('circle', { cx, cy, r: 12, fill: col, 'fill-opacity': isFuture ? 0.08 : 0.16 }),
        s('circle', { cx, cy, r: 6, fill: isFuture ? C.bg : col, stroke: col, 'stroke-width': 2.5 }),
        s('text', {
          x: cx, y: cy - 11, fill: col, 'fill-opacity': isFuture ? 0.65 : 1,
          'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, rooms[i])
      );
      // Week tick label
      const wLabel = i === 6 ? '7' : i === 7 ? '8' : String(i + 1);
      k.push(s('text', {
        x: cx, y: BASE + 20, fill: isHoliday ? C.amber : (i === sel ? C.cyan : C.muted),
        'font-size': 13 * F, 'font-weight': i === sel || isHoliday ? 700 : 400,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, wLabel));
      if (isHoliday) {
        k.push(s('text', {
          x: cx, y: BASE + 36, fill: C.amber, 'font-size': 11 * F,
          'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial'
        }, i === 6 ? 'Xmas' : 'NY'));
      }
    }

    // Glowing amber level marker at curIdx
    const lx = wx(curIdx), ly = ry(cur.level);
    k.push(
      s('circle', { cx: lx, cy: ly, r: 14, fill: C.amber, 'fill-opacity': 0.22 }),
      s('circle', { cx: lx, cy: ly, r: 6.5, fill: C.amber, stroke: C.bg, 'stroke-width': 1.5 })
    );

    svg.replaceChildren(...k);

    // Draw Error-vs-Step curve (growing as steps run)
    const completed = states.slice(1, step + 1);
    const absErrs = completed.map(st => Math.abs(st.error));
    const runMae = absErrs.map((_, idx) => absErrs.slice(0, idx + 1).reduce((a, b) => a + b, 0) / (idx + 1));
    const mae = runMae.length ? runMae[runMae.length - 1] : 0;
    const maxE = Math.max(8, ...absErrs, 1);

    const lk = [];
    const LX0 = X0, LX1 = X1, LTOP = 30, LBASE = LVH - 28;
    lk.push(
      s('text', { x: LX0, y: 16, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Segoe UI, Arial' }, 'Error at each step |real − expected|'),
      s('text', { x: LX1, y: 16, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        completed.length ? `Avg error: ${fmt(r2(mae))} rooms` : 'Avg error: —'),
      s('line', { x1: LX0, x2: LX1, y1: LBASE, y2: LBASE, stroke: C.line, 'stroke-width': 1.5 }),
      s('line', { x1: LX0, x2: LX1, y1: LTOP, y2: LTOP, stroke: C.line, 'stroke-dasharray': '3 4' }),
      s('text', { x: LX0 - 8, y: LBASE + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0'),
      s('text', { x: LX0 - 8, y: LTOP + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, Math.ceil(maxE))
    );

    const lSlot = (LX1 - LX0) / MAX_STEP;
    const lxPos = idx => LX0 + lSlot * (idx + 0.5);
    const lyPos = val => LBASE - (val / maxE) * (LBASE - LTOP);

    for (let idx = 0; idx < MAX_STEP; idx++) {
      const cx = lxPos(idx);
      lk.push(s('text', {
        x: cx, y: LBASE + 16, fill: idx < step ? C.ink : C.muted,
        'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `Step ${idx + 1} (Wk ${idx + 5})`));

      if (idx < completed.length) {
        const errVal = absErrs[idx];
        const barH = Math.max(2, LBASE - lyPos(errVal));
        const bw = Math.min(34, lSlot * 0.36);
        lk.push(
          s('rect', { x: cx - bw / 2, y: LBASE - barH, width: bw, height: barH, fill: C.pink, 'fill-opacity': 0.45, rx: 3 }),
          s('text', {
            x: cx, y: Math.max(LTOP + 10, LBASE - barH - 5), fill: C.pink,
            'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
          }, fmt(r2(errVal)))
        );
      }
    }
    // Running average error polyline
    for (let idx = 0; idx < runMae.length; idx++) {
      const cx = lxPos(idx), cy = lyPos(runMae[idx]);
      if (idx > 0) {
        lk.push(s('line', {
          x1: lxPos(idx - 1), y1: lyPos(runMae[idx - 1]), x2: cx, y2: cy,
          stroke: C.amber, 'stroke-width': 2.5
        }));
      }
      lk.push(s('circle', { cx, cy, r: 4, fill: C.amber }));
    }
    lossSvg.replaceChildren(...lk);

    // Update formula box with current step's exact numbers
    const lines = [];
    if (step === 0) {
      lines.push([`Start at Week 4 (Step 0 / ${MAX_STEP})`, C.muted]);
      lines.push([`level = ${fmt(r2(cur.level))}`, C.amber]);
      lines.push([`trend = (${rooms[3]} − ${rooms[0]}) ÷ 3 = ${sfmt(cur.trend)}`, C.green]);
      lines.push(`next guess (Wk 5) = ${fmt(r2(cur.level + cur.trend))}`);
    } else {
      lines.push([`Step ${step} / ${MAX_STEP} — Week ${cur.week}`, C.muted]);
      lines.push(`expected = ${fmt(r2(cur.prevLevel))} + (${sfmt(cur.prevTrend)}) = ${fmt(r2(cur.expected))}`);
      lines.push([`real = ${cur.real}   error = ${sfmt(cur.error)}`, Math.abs(cur.error) < 0.01 ? C.green : C.pink]);
      lines.push([`new level = ${fmt(r2(cur.expected))} + ${fmt(lw)} × (${sfmt(cur.error)}) = ${fmt(r2(cur.level))}`, C.amber]);
      lines.push(`level rise = ${fmt(r2(cur.level))} − ${fmt(r2(cur.prevLevel))} = ${sfmt(cur.rise)}`);
      lines.push([`new trend  = ${sfmt(cur.prevTrend)} + ${fmt(tw)} × (${sfmt(cur.rise - cur.prevTrend)}) = ${sfmt(cur.trend)}`, C.green]);
    }
    if (forecasts.length) {
      const fStr = forecasts.slice(0, 2).map(f => `Wk ${f.idx + 1}: ${fmt(r2(f.val))}`).join('   ');
      lines.push([`forecast → ${fStr}`, C.cyan]);
    }
    fbox(box, lines);

    note.textContent = step === 0
      ? 'At Week 4 we start the staircase from the first four counts. Press Step or Play to update week by week.'
      : step === 2 && !isRandom
        ? 'End of Week 6: level is 27 and trend is +2/wk, forecasting 29 for Christmas and 31 for New Year. Press Step to reveal Christmas!'
        : step === MAX_STEP
          ? `Finished all ${MAX_STEP} steps. Average absolute error is ${fmt(r2(mae))} rooms. Try changing the weights or dragging a dot!`
          : `Updated after Week ${cur.week}. Dashed amber stairs show the forecast from the latest level and trend.`;

    stepBadge.replaceChildren(pill(`STEP ${step} / ${MAX_STEP} · WK ${cur.week}`, C.amber));
    lwVal.textContent = lw.toFixed(2);
    twVal.textContent = tw.toFixed(2);
    spdVal.textContent = speed + '×';
    selLabel.textContent = `Week ${sel + 1}${sel === 6 ? ' (Xmas)' : sel === 7 ? ' (NY)' : ''}: ${rooms[sel]} rooms`;

    chal.update({
      step, maxStep: MAX_STEP, lw, tw, isRandom, mae,
      stepsClicked, steppedAtZero
    });
  }

  draw();
  return () => stopPlay();
}

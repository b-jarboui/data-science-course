// 11.2.6 Try it: Holt-Winters forecasts (iterative learning + live manipulation).
// Drag any Saturday dot, adjust level/trend/extra weights, step or play across weeks and years,
// watch the staircase, violet holiday blocks, and error curve update live, and solve 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const LESSON_Y1 = [20, 24, 20, 23, 24, 29, 35, 33];
  const LESSON_Y2 = [21, 22, 23, 24, 25, 27, 34, 32];
  const WK_NAMES = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'Xmas', 'NY'];
  const r2 = x => Math.round(x * 100) / 100;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // State
  let wLevel = 0.5, wTrend = 0.5, wExtra = 0.5;
  let speed = 1.5; // steps per second
  let playing = false, timer = null;
  let random = false, spikedYear1 = false, trapTriggered = false;
  let sel = 5; // selected week index (0..7), default Week 6
  let hotel = { base: 20, trend: 1.4, trueX: 6, trueNY: 2 };
  let years = [LESSON_Y1.slice()];
  let startExtras = { x: 4, ny: 2 };
  let yearStartExtras = [{ x: 4, ny: 2 }]; // extras entering each year
  let curYear = 0; // 0-based year index
  let curWeek = 3; // 0-based observed week index (3 = end of Week 4 -> 0 steps done)
  let totalSteps = 0;
  let history = []; // [{ step, year, week, err, absErr, isHoliday, noteLines }]

  function makeYearData(yIdx) {
    if (!random && yIdx === 0) return LESSON_Y1.slice();
    if (!random && yIdx === 1) return LESSON_Y2.slice();
    const out = [];
    const base = hotel.base + (random ? rnd(-1, 1) : 0);
    for (let w = 0; w < 8; w++) {
      const ex = w === 6 ? hotel.trueX : (w === 7 ? hotel.trueNY : 0);
      const noise = rnd(-1, 1);
      out.push(clamp(Math.round(base + hotel.trend * w + ex + noise), 8, 42));
    }
    return out;
  }

  function runYearUpTo(yData, initEx, upToWeek) {
    let level = yData[3];
    let trend = r2((yData[3] - yData[0]) / 3);
    let exX = initEx.x, exNY = initEx.ny;
    const levels = { 3: level };
    const forecasts = {};
    const stepLog = [];

    for (let w = 4; w <= upToWeek; w++) {
      const oldL = level, oldT = trend;
      const base = oldL + oldT;
      const oldEx = w === 6 ? exX : (w === 7 ? exNY : 0);
      const fcast = base + oldEx;
      const real = yData[w];
      const err = real - fcast;
      const deSeason = real - oldEx;
      level = base + wLevel * (deSeason - base);
      trend = oldT + wTrend * ((level - oldL) - oldT);
      let newEx = oldEx;
      if (w === 6) {
        const gapAbove = real - base;
        exX = oldEx + wExtra * (gapAbove - oldEx);
        newEx = exX;
      } else if (w === 7) {
        const gapAbove = real - base;
        exNY = oldEx + wExtra * (gapAbove - oldEx);
        newEx = exNY;
      }
      levels[w] = level;
      forecasts[w] = fcast;
      stepLog.push({
        week: w, oldL, oldT, base, oldEx, fcast, real, err,
        absErr: Math.abs(err), deSeason, newL: level, newT: trend, newEx,
        isHoliday: w >= 6
      });
    }
    return { level, trend, exX, exNY, levels, forecasts, stepLog };
  }

  function recomputeAll() {
    let ex = { x: startExtras.x, ny: startExtras.ny };
    history = [];
    yearStartExtras = [];
    let stepNum = 0;
    let curState = null;

    for (let y = 0; y <= curYear; y++) {
      yearStartExtras.push({ x: ex.x, ny: ex.ny });
      const limit = y < curYear ? 7 : curWeek;
      const res = runYearUpTo(years[y], ex, limit);
      for (const st of res.stepLog) {
        stepNum++;
        history.push({ step: stepNum, year: y + 1, ...st });
        if (spikedYear1 && wExtra >= 0.9 && y >= 1 && st.week === 6 && st.fcast > st.real + 1.5) {
          trapTriggered = true;
        }
      }
      ex = { x: res.exX, ny: res.exNY };
      if (y === curYear) curState = res;
    }
    totalSteps = stepNum;
    return curState;
  }

  // --- DOM ---
  const statusRow = h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.6rem' } });
  const svg = s('svg', { viewBox: '0 0 700 370' });
  const errSvg = s('svg', { viewBox: '0 0 320 135' });
  const errStats = h('div', { class: 'sim-note' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  function makeSlider(label, init, min, max, step, onChange, fmtVal = v => v.toFixed(1)) {
    const valEl = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, minWidth: '3.2ch', textAlign: 'right' } }, fmtVal(init));
    const inp = h('input', {
      type: 'range', min, max, step, value: init,
      style: { flex: '1 1 7rem', accentColor: C.cyan, cursor: 'pointer' },
      oninput: e => { const v = +e.target.value; valEl.textContent = fmtVal(v); onChange(v); }
    });
    const row = h('div', { class: 'sim-row', style: { marginTop: '.45rem' } },
      h('span', { style: { minWidth: '8.5rem', fontSize: '.92rem', color: '#cfd7f2' } }, label),
      inp, valEl);
    return {
      row,
      set(v) { inp.value = v; valEl.textContent = fmtVal(v); }
    };
  }

  const slLevel = makeSlider('Level weight', wLevel, 0, 1, 0.1, v => { wLevel = v; draw(); });
  const slTrend = makeSlider('Trend weight', wTrend, 0, 1, 0.1, v => { wTrend = v; draw(); });
  const slExtra = makeSlider('Extra weight', wExtra, 0, 1, 0.1, v => { wExtra = v; draw(); });
  const slSpeed = makeSlider('Play speed', speed, 0.5, 4, 0.5, v => {
    speed = v;
    if (playing) { stopPlay(); startPlay(); }
  }, v => v.toFixed(1) + '×');

  const playBtn = btn('Play', () => playing ? stopPlay() : startPlay());

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Holt–Winters forecasts'),
    h('p', { class: 'sub' }, 'Step through each week to watch the level, trend staircase, and violet holiday blocks update. Drag any dot up or down, or adjust the three weights.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        statusRow,
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stopPlay(); doStep(); }, 'go'),
          playBtn,
          btn('Reset', () => resetAll()),
          btn('New hotel (random)', () => newHotel()),
          btn('One-time Xmas spike', () => triggerSpike())),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        slLevel.row, slTrend.row, slExtra.row, slSpeed.row),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' },
          h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.45rem' } }, pill('FORECAST ERROR EACH STEP', C.cyan)),
          errSvg, errStats),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Press Step until Christmas arrives (Step 3). Watch the Christmas extra update from 4 to 5.',
      check: st => !st.random && st.year === 1 && st.week >= 6 && Math.abs(st.xmasExtra - 5) < 0.02,
      why: 'Yes! The staircase reached 29, real Christmas was 35 (gap 6), so halfway from 4 to 6 gave the new extra of 5.'
    },
    {
      text: 'Press Reset, step to Week 6 (Step 2), then drag Week 6’s dot up until the Christmas forecast reaches exactly 36.',
      check: st => !st.random && st.year === 1 && st.week === 5 && Math.abs(st.xmasForecast - 36) < 0.02,
      why: 'Spot on! Raising Week 6 to 33 lifted the level to 29 and trend to +3, so 29 + 3 + 4 = 36.'
    },
    {
      text: 'Test the trap: set Extra weight to 1.0, press “One-time Xmas spike”, then press Play into Year 2’s Christmas.',
      check: st => st.trapTriggered,
      why: 'Look at the error curve! With extra weight 1.0, Holt–Winters treated the one-time spike as permanent and overshot next Christmas.'
    },
    {
      text: 'Set Extra weight to 0.4 or 0.5, press “New hotel (random)”, and press Play for at least 2 full years (8 steps).',
      check: st => st.random && st.wExtra >= 0.35 && st.wExtra <= 0.55 && st.steps >= 8,
      why: 'Right! Across repeated seasons, gentle updates learn any hotel’s true holiday extras without chasing one noisy week.'
    }
  ]);

  function stopPlay() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function startPlay() {
    if (playing) return;
    playing = true;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      if (totalSteps >= 24) { stopPlay(); return; }
      doStep();
    }, Math.round(1000 / speed));
  }

  function doStep() {
    if (curWeek < 7) {
      curWeek++;
    } else {
      curYear++;
      if (!years[curYear]) years.push(makeYearData(curYear));
      curWeek = 4; // Week 5 of the next year
    }
    sel = curWeek;
    draw();
  }

  function resetAll() {
    stopPlay();
    random = false; spikedYear1 = false; trapTriggered = false;
    wLevel = 0.5; wTrend = 0.5; wExtra = 0.5;
    slLevel.set(wLevel); slTrend.set(wTrend); slExtra.set(wExtra);
    hotel = { base: 20, trend: 1.4, trueX: 6, trueNY: 2 };
    startExtras = { x: 4, ny: 2 };
    years = [LESSON_Y1.slice()];
    curYear = 0; curWeek = 3; sel = 5;
    draw();
  }

  function newHotel() {
    stopPlay();
    random = true; spikedYear1 = false;
    hotel = {
      base: rnd(15, 22),
      trend: rnd(5, 18) / 10,
      trueX: rnd(3, 9),
      trueNY: rnd(1, 6)
    };
    startExtras = { x: rnd(1, 4), ny: rnd(1, 4) };
    years = [makeYearData(0)];
    curYear = 0; curWeek = 3; sel = 5;
    draw();
  }

  function triggerSpike() {
    stopPlay();
    spikedYear1 = true;
    years[0][6] = clamp(years[0][6] + 6, 36, 42);
    if (curYear > 0 || curWeek > 5) {
      curYear = 0;
      curWeek = 5; // End of Week 6, right before the spiked Christmas
    }
    sel = 6;
    draw();
  }

  function bump(d) {
    years[curYear][sel] = clamp(years[curYear][sel] + d, 5, 43);
    draw();
  }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 370, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 36 : 48, X1 = VW - 14, TOP = 24, BASE = VH - 46;
  const MAXV = 45;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const slot = (X1 - X0) / 8;
  const wx = w => X0 + slot * (w + 0.5);
  const ry = v => BASE - (v / MAXV) * (BASE - TOP);
  const dy = (BASE - TOP) / MAXV;

  // Drag any week's dot vertically
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.x - X0) / slot);
    if (i < 0 || i > 7) return;
    sel = i; dragging = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    years[curYear][dragging] = clamp(Math.round((BASE - p.y) / dy), 5, 43);
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function drawBlocks(k, x, baseVal, extraVal, col, op = 0.8) {
    const bw = Math.min(44, slot * 0.62);
    const n = Math.max(0, extraVal);
    for (let b = 0; b < Math.ceil(n - 1e-6); b++) {
      const part = Math.min(1, n - b);
      const yTop = ry(baseVal + b + part);
      const hgt = Math.max(0, part * dy - 1.4);
      k.push(s('rect', {
        x: x - bw / 2, y: yTop + 0.7, width: bw, height: hgt,
        fill: col, 'fill-opacity': op, stroke: col, 'stroke-width': 1, rx: 1.5
      }));
    }
  }

  function drawErrorCurve() {
    const W = 320, H = 135, x0 = 34, x1 = W - 12, top = 14, bot = H - 24;
    const k = [];
    const maxE = Math.max(6, ...history.map(h => h.absErr));
    for (let g = 0; g <= maxE; g += Math.ceil(maxE / 3)) {
      const y = bot - (g / maxE) * (bot - top);
      k.push(
        s('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: x0 - 6, y: y + 4, fill: C.muted, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(r2(g)))
      );
    }
    if (!history.length) {
      k.push(s('text', { x: (x0 + x1) / 2, y: (top + bot) / 2, fill: C.muted, 'font-size': 13, 'text-anchor': 'middle' }, 'Press Step or Play to grow the curve'));
      errSvg.replaceChildren(...k);
      errStats.textContent = 'No steps yet. Each step adds one error point (violet = holiday).';
      return;
    }
    const n = Math.max(8, history.length);
    const sx = i => x0 + ((i + 0.5) / n) * (x1 - x0);
    const sy = e => bot - (e / maxE) * (bot - top);
    const pts = history.map((d, i) => `${sx(i).toFixed(1)},${sy(d.absErr).toFixed(1)}`).join(' ');
    k.push(s('polyline', { points: pts, fill: 'none', stroke: C.cyan, 'stroke-width': 2 }));
    history.forEach((d, i) => {
      const col = i === history.length - 1 ? C.amber : (d.isHoliday ? C.violet : C.cyan);
      k.push(s('circle', { cx: sx(i), cy: sy(d.absErr), r: i === history.length - 1 ? 5 : 3.8, fill: col }));
    });
    k.push(s('text', { x: (x0 + x1) / 2, y: H - 5, fill: C.muted, 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `steps (1..${history.length}) — violet = holiday`));
    errSvg.replaceChildren(...k);
    const avg = history.reduce((a, b) => a + b.absErr, 0) / history.length;
    const hols = history.filter(d => d.isHoliday);
    const hAvg = hols.length ? hols.reduce((a, b) => a + b.absErr, 0) / hols.length : null;
    errStats.textContent = `Mean abs error: ${fmt(r2(avg))} rooms` + (hAvg != null ? `  ·  Holiday avg: ${fmt(r2(hAvg))}` : '');
  }

  function draw() {
    const st = recomputeAll();
    const yData = years[curYear];
    const k = [];

    // Holiday background columns
    for (const hw of [6, 7]) {
      k.push(s('rect', {
        x: wx(hw) - slot * 0.44, y: TOP, width: slot * 0.88, height: BASE - TOP,
        fill: C.violet, 'fill-opacity': 0.08, rx: 6
      }));
    }
    // Selected column highlight
    k.push(s('rect', {
      x: wx(sel) - slot * 0.46, y: TOP - 6, width: slot * 0.92, height: BASE - TOP + 6,
      fill: '#ffffff', 'fill-opacity': 0.04, rx: 8
    }));

    // Horizontal grid
    for (let g = 0; g <= 40; g += 10) {
      const y = ry(g);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 7, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // Observed polyline for ordinary weeks up to curWeek
    const obsMax = Math.min(curWeek, 5);
    let linePts = '';
    for (let w = 0; w <= obsMax; w++) linePts += `${wx(w)},${ry(yData[w])} `;
    k.push(s('polyline', { points: linePts.trim(), fill: 'none', stroke: C.cyan, 'stroke-width': 2.6 }));

    // Amber staircase forward from curWeek to W7 (Xmas) and W8 (NY)
    const xmasStep = st.level + st.trend * (6 - curWeek);
    const nyStep = st.level + st.trend * (7 - curWeek);
    const xmasForecast = curWeek < 6 ? xmasStep + st.exX : st.forecasts[6];
    const nyForecast = curWeek < 7 ? nyStep + st.exNY : st.forecasts[7];

    if (curWeek < 7) {
      let sx = curWeek, sy = st.level;
      for (let w = curWeek + 1; w <= 7; w++) {
        const nextY = sy + st.trend;
        k.push(
          s('line', { x1: wx(sx), y1: ry(sy), x2: wx(w), y2: ry(sy), stroke: C.amber, 'stroke-width': 2.2, 'stroke-dasharray': '6 5' }),
          s('line', { x1: wx(w), y1: ry(sy), x2: wx(w), y2: ry(nextY), stroke: C.amber, 'stroke-width': 2.2, 'stroke-dasharray': '6 5' })
        );
        sx = w; sy = nextY;
      }
    }

    // Violet seasonal blocks on W7 and W8
    if (curWeek < 6) {
      drawBlocks(k, wx(6), xmasStep, st.exX, C.violet, 0.78);
      k.push(
        s('circle', { cx: wx(6), cy: ry(xmasForecast), r: 6.5, fill: C.amber }),
        s('text', { x: wx(6), y: ry(xmasForecast) - 11, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(xmasForecast)))
      );
    } else {
      // Show revealed Christmas blocks (updated height) and forecast ring + error bar
      const xLog = st.stepLog.find(d => d.week === 6);
      drawBlocks(k, wx(6), xLog.base, st.exX, C.violet, 0.78);
      k.push(
        s('line', { x1: wx(6), y1: ry(xLog.fcast), x2: wx(6), y2: ry(yData[6]), stroke: C.pink, 'stroke-width': 3 }),
        s('circle', { cx: wx(6), cy: ry(xLog.fcast), r: 6, fill: 'none', stroke: C.amber, 'stroke-width': 2.5 })
      );
    }

    if (curWeek < 7) {
      drawBlocks(k, wx(7), nyStep, st.exNY, C.violet, 0.78);
      k.push(
        s('circle', { cx: wx(7), cy: ry(nyForecast), r: 6.5, fill: C.amber }),
        s('text', { x: wx(7), y: ry(nyForecast) - 11, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(nyForecast)))
      );
    } else {
      const nyLog = st.stepLog.find(d => d.week === 7);
      drawBlocks(k, wx(7), nyLog.base, st.exNY, C.violet, 0.78);
      k.push(
        s('line', { x1: wx(7), y1: ry(nyLog.fcast), x2: wx(7), y2: ry(yData[7]), stroke: C.pink, 'stroke-width': 3 }),
        s('circle', { cx: wx(7), cy: ry(nyLog.fcast), r: 6, fill: 'none', stroke: C.amber, 'stroke-width': 2.5 })
      );
    }

    // Current level dot
    k.push(s('circle', { cx: wx(curWeek), cy: ry(st.level), r: 5.5, fill: C.amber, stroke: C.bg, 'stroke-width': 1.5 }));

    // Weekly dots (observed solid, future dashed draggable ghost)
    for (let w = 0; w < 8; w++) {
      const revealed = w <= curWeek;
      const isHol = w >= 6;
      const col = isHol ? C.ink : C.cyan;
      const cx = wx(w), cy = ry(yData[w]);
      if (revealed) {
        k.push(
          s('circle', { cx, cy, r: 11, fill: col, 'fill-opacity': 0.16 }),
          s('circle', { cx, cy, r: 5.5, fill: col }),
          s('text', { x: cx, y: cy - 11, fill: col, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, yData[w])
        );
      } else {
        k.push(
          s('circle', { cx, cy, r: 6, fill: C.card, stroke: col, 'stroke-opacity': 0.45, 'stroke-width': 1.8, 'stroke-dasharray': '3 3' }),
          s('text', { x: cx, y: cy + 4, fill: C.muted, 'font-size': 10 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '?')
        );
      }
      k.push(s('text', {
        x: cx, y: BASE + 20, fill: isHol ? C.violet : C.muted,
        'font-size': 12.5 * F, 'font-weight': isHol ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, WK_NAMES[w]));
    }
    svg.replaceChildren(...k);

    // Status pills
    statusRow.replaceChildren(
      pill(`STEP ${totalSteps} · YEAR ${curYear + 1} · ${WK_NAMES[curWeek]}`, C.amber),
      pill(`XMAS +${fmt(r2(st.exX))}`, C.violet),
      pill(`NY +${fmt(r2(st.exNY))}`, C.violet)
    );

    // Formula box: show latest step's numbers
    const last = st.stepLog[st.stepLog.length - 1];
    if (!last) {
      fbox(box, [
        `Start Year ${curYear + 1} (at W4)`,
        `level = ${fmt(r2(st.level))}   trend = ${st.trend >= 0 ? '+' : ''}${fmt(r2(st.trend))}/wk`,
        [`Xmas extra = +${fmt(r2(st.exX))}  NY = +${fmt(r2(st.exNY))}`, C.violet],
        [`Next guess (W5) = ${fmt(r2(st.level + st.trend))}`, C.amber]
      ]);
      note.textContent = 'Press Step to reveal Week 5, or Play to watch Holt–Winters learn across weeks and years.';
    } else if (last.isHoliday) {
      const hName = last.week === 6 ? 'Christmas' : 'New Year';
      const gapAbove = last.real - last.base;
      fbox(box, [
        [`Step ${totalSteps}: ${hName} (Year ${curYear + 1})`, C.violet],
        `guess ${fmt(r2(last.base))} + ${fmt(r2(last.oldEx))} = ${fmt(r2(last.fcast))}  |  real ${last.real}`,
        [`error = ${last.err >= 0 ? '+' : ''}${fmt(r2(last.err))}  (gap above stairs = ${fmt(r2(gapAbove))})`, Math.abs(last.err) <= 1 ? C.green : C.pink],
        [`extra: ${fmt(r2(last.oldEx))} → ${fmt(r2(last.newEx))}  |  level → ${fmt(r2(last.newL))}`, C.green]
      ]);
      note.textContent = `${hName} updated its seasonal extra toward ${fmt(r2(gapAbove))} using extra weight ${wExtra.toFixed(1)}, and removed old extra (${fmt(r2(last.real))} − ${fmt(r2(last.oldEx))} = ${fmt(r2(last.deSeason))}) before updating level.`;
    } else {
      fbox(box, [
        `Step ${totalSteps}: ${WK_NAMES[last.week]} (Year ${curYear + 1})`,
        `guess = ${fmt(r2(last.fcast))}  |  real = ${last.real}  |  err = ${last.err >= 0 ? '+' : ''}${fmt(r2(last.err))}`,
        [`level: ${fmt(r2(last.oldL))} → ${fmt(r2(last.newL))}   trend: ${fmt(r2(last.oldT))} → ${fmt(r2(last.newT))}`, C.amber],
        [`Forecasts: Xmas ${fmt(r2(xmasForecast))},  NY ${fmt(r2(nyForecast))}`, C.violet]
      ]);
      note.textContent = curWeek === 5
        ? 'End of Week 6: stairs step forward from the new level, and violet blocks sit on top for Christmas and New Year.'
        : 'Ordinary autumn weeks have extra = 0, so only level and trend update.';
    }

    selLabel.textContent = `Selected: ${WK_NAMES[sel]} (${yData[sel]} rooms)`;
    drawErrorCurve();

    chal.update({
      random,
      year: curYear + 1,
      week: curWeek,
      steps: totalSteps,
      wExtra,
      xmasExtra: st.exX,
      xmasForecast,
      trapTriggered
    });
  }

  draw();
  return () => stopPlay();
}

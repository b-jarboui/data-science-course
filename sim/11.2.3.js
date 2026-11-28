// 11.2.3 Try it: moving averages — slide the trailing window, level blocks, change k, drag weeks.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const START = [20, 24, 20, 23, 24, 29, 35]; // weeks 1..6 + week 7 (Christmas)
  const WHITE = '#ffffff';

  let v = START.slice();
  let k = 4;               // window size (1..6)
  let step = 1;            // 1..maxStep where maxStep = 7 - k
  let revealed = false;    // whether Christmas (week 7) is revealed
  let level = 0;           // 0 = real stacks in window, 1 = equal fair-share stacks
  let sel = 2;             // selected week index (default: week 3 storm)
  let playing = false;
  let speed = 1.2;         // steps per second
  let timer = 0, anim = 0;
  let random = false, randomPlays = 0, countedThisRun = false;

  const maxStep = () => 7 - k;
  const r2 = x => Math.round(x * 100) / 100;
  const sfmt = x => (x > 0 ? `+${fmt(r2(x))}` : x < 0 ? `−${fmt(r2(Math.abs(x)))}` : '0');
  const isDefault = () => v.join() === START.join();

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.18 : 1;

  const svg = s('svg', { viewBox: `0 0 ${VW} 375` });
  const errSvg = s('svg', { viewBox: `0 0 ${VW} 150` });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const stepPill = pill('', C.violet);
  const kLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.ink } });
  const spdLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const kSlider = h('input', {
    type: 'range', min: 1, max: 6, step: 1, value: String(k),
    style: { width: NARROW ? '105px' : '125px', accentColor: C.cyan },
    oninput: () => {
      stopPlay();
      k = +kSlider.value;
      step = Math.min(step, maxStep());
      if (step === maxStep()) revealed = true;
      level = 0;
      draw();
    }
  });

  const spdSlider = h('input', {
    type: 'range', min: '0.5', max: '3', step: '0.5', value: String(speed),
    style: { width: NARROW ? '85px' : '100px', accentColor: C.amber },
    oninput: () => {
      speed = +spdSlider.value;
      if (playing) { stopPlay(); startPlay(); }
      draw();
    }
  });

  const playBtn = btn('Play', () => (playing ? stopPlay() : startPlay()), 'go');
  const levelBtn = btn('Share blocks', () => goLevel(level < 0.5 ? 1 : 0));
  const revealBtn = btn('Reveal Xmas', () => { revealed = !revealed; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: moving averages'),
    h('p', { class: 'sub' }, 'Slide the trailing window across the hotel weeks, change window size k, or drag any dot up and down to test how moving averages react to dips and rising demand.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' },
          btn('Step ›', () => doStep(), 'go'),
          playBtn,
          btn('Reset steps', () => { stopPlay(); step = 1; revealed = false; level = 0; draw(); }),
          stepPill,
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.4rem' } },
            spdLabel, spdSlider)
        ),
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.4rem' } },
            kLabel, kSlider),
          levelBtn,
          revealBtn
        ),
        h('div', { class: 'sim-row' },
          btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)),
          selLabel
        ),
        h('div', { class: 'sim-row' },
          btn('New weeks (random)', () => newRandom()),
          btn('Start again', () => {
            stopPlay();
            v = START.slice(); k = 4; step = 1; revealed = false; level = 0; sel = 2; random = false;
            kSlider.value = '4';
            draw();
          })
        ),
        h('div', { style: { marginTop: '.9rem', borderTop: '1px solid #26305a', paddingTop: '.6rem' } },
          h('div', { class: 'sim-note', style: { margin: '0 0 .35rem', color: C.violet, fontFamily: 'Consolas, monospace', fontWeight: 700 } }, 'FORECAST ERROR BY STEP (|real − forecast|)'),
          errSvg
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
      text: 'Press “Step ›” until the 4-week window holds weeks 3 to 6. Check the Christmas forecast (24) and error (11).',
      check: st => st.k === 4 && st.isDefault && st.step === st.maxStep && st.revealed,
      why: 'Yes! Weeks 3 to 6 add up to 96, so 96 ÷ 4 = 24 rooms. Real Christmas is 35, leaving an error of 11.'
    },
    {
      text: 'Keep k = 4 on weeks 3 to 6 and drag week 3 (the storm) down to 12 rooms or less. Watch how gently the forecast moves.',
      check: st => st.k === 4 && st.step === st.maxStep && st.v[2] <= 12,
      why: 'Right: each week has only one quarter say, so dropping week 3 by 8 rooms lowers the 4-week forecast by only 2 rooms.'
    },
    {
      text: 'Press “Start again”, then lower window size k to 2 or 1 and step to Christmas to cut the lag error below 9 rooms.',
      check: st => st.isDefault && st.k <= 2 && st.step === st.maxStep && st.revealed && Math.abs(st.lastError) < 9,
      why: 'Shorter windows drop older, quieter weeks sooner, so the forecast catches up faster on rising demand — at the cost of less smoothing.'
    },
    {
      text: 'Press “New weeks (random)” and then “Play”, twice. Watch the window slide and the error curve grow.',
      check: st => st.randomPlays >= 2,
      why: 'Every time, the forecast is the fair share of the latest k weeks, and errors spike whenever demand climbs or drops sharply.'
    }
  ]);

  function windowStats(stIdx) {
    const start = stIdx - 1;       // 0-based start week
    const end = start + k - 1;     // 0-based end week
    const target = end + 1;        // 0-based forecast week
    const vals = v.slice(start, end + 1);
    const sum = vals.reduce((a, b) => a + b, 0);
    const fc = sum / k;
    const real = v[target];
    const err = real - fc;
    return { start, end, target, vals, sum, fc, real, err };
  }

  function doStep() {
    if (step < maxStep()) {
      step++;
      level = 0;
      if (step === maxStep()) revealed = true;
    } else if (!revealed) {
      revealed = true;
    } else {
      step = 1;
      level = 0;
      revealed = false;
    }
    draw();
  }

  function startPlay() {
    if (playing) return;
    if (step >= maxStep() && revealed) { step = 1; revealed = false; level = 0; }
    playing = true;
    countedThisRun = false;
    playBtn.textContent = 'Pause';
    draw();
    timer = setInterval(() => {
      if (step < maxStep()) {
        step++;
        if (step === maxStep()) revealed = true;
        draw();
      } else {
        if (!revealed) { revealed = true; draw(); }
        if (random && !countedThisRun) { randomPlays++; countedThisRun = true; }
        stopPlay();
        draw();
      }
    }, Math.round(1000 / speed));
  }

  function stopPlay() {
    if (timer) clearInterval(timer);
    timer = 0;
    playing = false;
    playBtn.textContent = 'Play';
  }

  function goLevel(target) {
    cancelAnimationFrame(anim);
    const from = level, t0 = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - t0) / 650);
      level = from + (target - from) * t * t * (3 - 2 * t);
      draw();
      if (t < 1) anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
  }

  function newRandom() {
    stopPlay();
    const base = rnd(14, 24);
    const trend = rnd(0, 2);
    v = Array.from({ length: 7 }, (_, i) => {
      const dip = i === 2 && rnd(0, 1) ? -rnd(4, 8) : 0;
      return Math.max(4, Math.min(39, base + i * trend + rnd(-3, 4) + dip));
    });
    random = true;
    step = 1;
    revealed = false;
    level = 0;
    draw();
  }

  function bump(d) {
    if (sel === 6 && !revealed) revealed = true;
    v[sel] = Math.max(0, Math.min(40, v[sel] + d));
    draw();
  }

  // Main chart geometry
  const X0 = NARROW ? 34 : 52, X1 = VW - 16, TOP = 28, BASE = 326;
  const UNIT = (BASE - TOP) / 40;
  const SLOT = (X1 - X0) / 7;
  const wx = i => X0 + SLOT * (i + 0.5);
  const ry = rooms => BASE - rooms * UNIT;

  // Pointer dragging on dots/columns
  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const i = Math.floor((p.x - X0) / SLOT);
    if (i < 0 || i > 6) return;
    if (i === 6 && !revealed) { revealed = true; }
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    onMove(e);
  });
  const onMove = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    v[dragging] = Math.max(0, Math.min(40, Math.round((BASE - p.y) / UNIT)));
    draw();
  };
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const cur = windowStats(step);
    const els = [];

    // Grid and y-axis labels
    for (let g = 0; g <= 40; g += 10) {
      const y = ry(g);
      els.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // Selected column highlight
    els.push(s('rect', {
      x: wx(sel) - SLOT * 0.45, y: TOP - 8, width: SLOT * 0.9, height: BASE - TOP + 8,
      fill: '#ffffff', 'fill-opacity': 0.04, rx: 8
    }));

    // Sliding window frame
    const fL = wx(cur.start) - SLOT * 0.44;
    const fR = wx(cur.end) + SLOT * 0.44;
    els.push(s('rect', {
      x: fL, y: TOP - 4, width: fR - fL, height: BASE - TOP + 6,
      fill: C.violet, 'fill-opacity': 0.08, stroke: C.violet, 'stroke-width': 2.5, rx: 10
    }));

    // Block stacks inside the active window (smoothly interpolates to fair share when leveled)
    const bw = Math.min(48, SLOT * 0.56);
    for (let i = cur.start; i <= cur.end; i++) {
      const hgt = v[i] + (cur.fc - v[i]) * level;
      const cx = wx(i);
      const col = i === 2 && isDefault() ? C.pink : C.cyan;
      const nBlocks = Math.ceil(hgt - 1e-9);
      for (let b = 0; b < nBlocks; b++) {
        const part = Math.min(1, hgt - b);
        const isFrac = part < 0.999;
        els.push(s('rect', {
          x: cx - bw / 2,
          y: BASE - (b + part) * UNIT + 0.5,
          width: bw,
          height: Math.max(0.8, part * UNIT - 1.1),
          fill: isFrac ? C.amber : col,
          'fill-opacity': 0.42,
          rx: 1.5
        }));
      }
    }

    // Dashed amber fair-share line inside window + extension to target week
    const yFc = ry(cur.fc);
    els.push(s('line', {
      x1: fL + 4, x2: wx(cur.target), y1: yFc, y2: yFc,
      stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '8 6'
    }));

    // Past step forecasts (dimmer amber dots so learner sees the path)
    for (let st = 1; st < step; st++) {
      const prev = windowStats(st);
      els.push(s('circle', {
        cx: wx(prev.target), cy: ry(prev.fc), r: 4.5,
        fill: C.amber, 'fill-opacity': 0.55
      }));
    }

    // Observed weeks 1..6 polyline + glowing cyan dots
    const polyPts = [];
    for (let i = 0; i < 6; i++) polyPts.push(`${wx(i)},${ry(v[i])}`);
    els.push(s('polyline', { points: polyPts.join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2.6 }));

    for (let i = 0; i < 6; i++) {
      const cx = wx(i), cy = ry(v[i]);
      const inWin = i >= cur.start && i <= cur.end;
      els.push(
        s('circle', { cx, cy, r: 12, fill: C.cyan, 'fill-opacity': inWin ? 0.24 : 0.12 }),
        s('circle', { cx, cy, r: 5.5, fill: C.cyan }),
        s('text', {
          x: cx, y: cy - 11, fill: inWin ? C.ink : C.cyan,
          'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, v[i])
      );
    }

    // Week 7 (Christmas): hidden cover or revealed white dot
    const x7 = wx(6);
    if (!revealed) {
      els.push(
        s('rect', {
          x: x7 - SLOT * 0.42, y: TOP - 2, width: SLOT * 0.84, height: BASE - TOP + 2,
          fill: C.bg, 'fill-opacity': 0.88, stroke: C.muted, 'stroke-dasharray': '5 5', rx: 8
        }),
        s('text', {
          x: x7, y: (TOP + BASE) / 2 + 8, fill: C.muted,
          'font-size': 22 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, '?')
      );
    } else {
      const y7 = ry(v[6]);
      els.push(
        s('circle', { cx: x7, cy: y7, r: 13, fill: WHITE, 'fill-opacity': 0.22 }),
        s('circle', { cx: x7, cy: y7, r: 6.5, fill: WHITE }),
        s('text', {
          x: x7, y: y7 - 12, fill: WHITE,
          'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, v[6])
      );
    }

    // Current forecast dot & violet error bar (if target is visible)
    const tx = wx(cur.target);
    const targetVisible = cur.target < 6 || revealed;
    if (targetVisible) {
      const yReal = ry(cur.real);
      els.push(
        s('line', { x1: tx, x2: tx, y1: yFc, y2: yReal, stroke: C.violet, 'stroke-width': 4 }),
        s('text', {
          x: tx - (cur.target === 6 ? 10 : -10),
          y: (yFc + yReal) / 2 + 4,
          fill: C.violet, 'font-size': 13 * F, 'font-weight': 700,
          'text-anchor': cur.target === 6 ? 'end' : 'start', 'font-family': 'Consolas'
        }, sfmt(cur.err))
      );
    }
    els.push(
      s('circle', { cx: tx, cy: yFc, r: 6, fill: C.amber, stroke: C.bg, 'stroke-width': 1.5 }),
      s('text', {
        x: tx, y: yFc + (targetVisible && cur.real < cur.fc ? -11 : 19),
        fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, fmt(r2(cur.fc)))
    );

    // X-axis week labels
    for (let i = 0; i < 7; i++) {
      els.push(s('text', {
        x: wx(i), y: BASE + 24,
        fill: i === 6 ? C.amber : (i === sel ? C.ink : C.muted),
        'font-size': 13 * F, 'font-weight': i === sel || i === 6 ? 700 : 400,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, i === 6 ? 'Xmas' : `Wk ${i + 1}`));
    }
    svg.replaceChildren(...els);

    // Error-vs-step curve
    const eEls = [];
    const eX0 = X0, eX1 = X1, eTop = 18, eBase = 120;
    const totalSteps = maxStep();
    const errs = [];
    for (let st = 1; st <= step; st++) {
      const info = windowStats(st);
      if (info.target < 6 || revealed) errs.push({ st, absErr: Math.abs(info.err), target: info.target });
    }
    const maxErr = Math.max(15, ...errs.map(e => Math.ceil(e.absErr / 5) * 5));
    for (let g = 0; g <= maxErr; g += 5) {
      const y = eBase - (g / maxErr) * (eBase - eTop);
      eEls.push(
        s('line', { x1: eX0, x2: eX1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: eX0 - 8, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }
    const sx = st => totalSteps === 1 ? (eX0 + eX1) / 2 : eX0 + 28 + ((st - 1) / (totalSteps - 1)) * (eX1 - eX0 - 56);
    for (let st = 1; st <= totalSteps; st++) {
      eEls.push(s('text', {
        x: sx(st), y: eBase + 18, fill: st === step ? C.amber : C.muted,
        'font-size': 11 * F, 'font-weight': st === step ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `Step ${st}`));
    }
    if (errs.length > 1) {
      const pts = errs.map(e => `${sx(e.st)},${eBase - (e.absErr / maxErr) * (eBase - eTop)}`).join(' ');
      eEls.push(s('polyline', { points: pts, fill: 'none', stroke: C.violet, 'stroke-width': 2.8 }));
    }
    errs.forEach(e => {
      const cx = sx(e.st), cy = eBase - (e.absErr / maxErr) * (eBase - eTop);
      eEls.push(
        s('circle', { cx, cy, r: e.st === step ? 6 : 4.5, fill: e.st === step ? C.amber : C.violet }),
        s('text', {
          x: cx, y: Math.max(13, cy - 8), fill: e.st === step ? C.amber : C.ink,
          'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, fmt(r2(e.absErr)))
      );
    });
    if (errs.length) {
      const avgErr = errs.reduce((a, e) => a + e.absErr, 0) / errs.length;
      eEls.push(s('text', {
        x: eX1, y: 13, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas'
      }, `avg |error| = ${fmt(r2(avgErr))} rooms`));
    }
    errSvg.replaceChildren(...eEls);

    // Formula box & labels
    const targetName = cur.target === 6 ? 'Xmas' : `Wk ${cur.target + 1}`;
    const lines = [
      [`Window: Wk ${cur.start + 1}–${cur.end + 1}  (k = ${k})`, C.violet],
      step > 1
        ? `slide: −${v[cur.start - 1]} (Wk ${cur.start})  +${v[cur.end]} (Wk ${cur.end + 1})`
        : `counts: ${cur.vals.join(' + ')}`,
      [`forecast(${targetName}) = ${cur.sum} ÷ ${k} = ${fmt(r2(cur.fc))}`, C.amber],
      targetVisible
        ? [`error = ${cur.real} − ${fmt(r2(cur.fc))} = ${sfmt(cur.err)}`, C.violet]
        : ['Christmas hidden — step or tap Reveal Xmas', C.muted]
    ];
    fbox(box, lines);

    stepPill.textContent = `STEP ${step} OF ${totalSteps}`;
    kLabel.textContent = `k = ${k} week${k === 1 ? '' : 's'}`;
    spdLabel.textContent = `Speed ${fmt(speed)}×`;
    levelBtn.textContent = level > 0.5 ? 'Real stacks' : 'Share blocks';
    revealBtn.textContent = revealed ? 'Hide Xmas' : 'Reveal Xmas';
    selLabel.textContent = `Selected: ${sel === 6 ? 'Xmas' : `Wk ${sel + 1}`} (${sel === 6 && !revealed ? '?' : v[sel]} rooms)`;
    note.textContent = `Each week inside the frame gives 1/${k} (${Math.round(100 / k)}%) of the forecast. Larger k smooths dips more, but lags further behind a rising trend.`;

    const lastInfo = windowStats(maxStep());
    chal.update({
      k, step, maxStep: totalSteps, revealed, v,
      isDefault: isDefault(),
      lastError: lastInfo.err,
      randomPlays
    });
  }

  draw();
  return () => { stopPlay(); cancelAnimationFrame(anim); };
}

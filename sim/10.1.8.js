// 10.1.8 Try it: slope uncertainty and the 95% confidence interval.
// Drag any apartment dot (area or rent), squeeze/spread the areas, change the noise,
// draw fresh random samples, or run 100 samples to test how often the 95% interval catches the true slope.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;

  // Exact shared apartments from chapters/10.1.md: building X (cyan), Y (amber), Z (pink)
  const START = [
    { x: 40, y: 860, b: 'X', col: C.cyan },  { x: 40, y: 770, b: 'Y', col: C.amber },  { x: 40, y: 770, b: 'Z', col: C.pink },
    { x: 60, y: 1040, b: 'X', col: C.cyan }, { x: 60, y: 1020, b: 'Y', col: C.amber }, { x: 60, y: 940, b: 'Z', col: C.pink },
    { x: 80, y: 1250, b: 'X', col: C.cyan }, { x: 80, y: 1210, b: 'Y', col: C.amber }, { x: 80, y: 1140, b: 'Z', col: C.pink },
    { x: 100, y: 1470, b: 'X', col: C.cyan },{ x: 100, y: 1380, b: 'Y', col: C.amber },{ x: 100, y: 1350, b: 'Z', col: C.pink },
  ];
  const T_STAR = 2.22813885; // 95% two-sided t multiplier for df = 12 - 2 = 10
  const TRUE_SLOPE = 10, TRUE_INT = 400, TRUE_NOISE = 50;

  let pts = START.map(p => ({ ...p }));
  let sel = -1, dragging = -1, anim = 0;
  let trials = 0, hits = 0, recent = [];

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: how sure is the slope?'),
    h('p', { class: 'sub' }, 'Drag any apartment left or right (area) or up and down (rent). Watch the white fitted line, the green 95% slope wedge, and the standard error update live.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Squeeze areas', () => scaleAreas(0.5)),
          btn('Spread areas', () => scaleAreas(1.4)),
          btn('Less noise', () => scaleNoise(0.65)),
          btn('More noise', () => scaleNoise(1.4))),
        h('div', { class: 'sim-row' },
          btn('New sample (random)', () => oneSample(true), 'go'),
          btn('Run 100 samples', () => runMany(100)),
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const randn = () => {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  function stats(list) {
    const n = list.length;
    const xbar = list.reduce((a, p) => a + p.x, 0) / n;
    const ybar = list.reduce((a, p) => a + p.y, 0) / n;
    let sxx = 0, sxy = 0;
    for (const p of list) { sxx += (p.x - xbar) ** 2; sxy += (p.x - xbar) * (p.y - ybar); }
    const safeSxx = Math.max(1, sxx);
    const slope = sxy / safeSxx;
    const intercept = ybar - slope * xbar;
    let ssr = 0;
    for (const p of list) ssr += (p.y - (intercept + slope * p.x)) ** 2;
    const rse = Math.sqrt(ssr / (n - 2));
    const se = rse / Math.sqrt(safeSxx);
    const margin = T_STAR * se;
    return { n, xbar, ybar, sxx, slope, intercept, rse, se, margin, low: slope - margin, high: slope + margin };
  }

  function scaleAreas(factor) {
    cancelAnimationFrame(anim);
    const st = stats(pts);
    const res = pts.map(p => p.y - (st.intercept + st.slope * p.x));
    pts = pts.map((p, i) => {
      const nx = Math.max(30, Math.min(110, Math.round(st.xbar + (p.x - st.xbar) * factor)));
      return { ...p, x: nx, y: Math.round(st.intercept + st.slope * nx + res[i]) };
    });
    draw();
  }

  function scaleNoise(factor) {
    cancelAnimationFrame(anim);
    const st = stats(pts);
    pts = pts.map(p => {
      const fit = st.intercept + st.slope * p.x;
      const ny = fit + (p.y - fit) * factor;
      return { ...p, y: Math.max(450, Math.min(1850, Math.round(ny))) };
    });
    draw();
  }

  function makeRandomSample() {
    return pts.map(p => ({ ...p, y: Math.round(TRUE_INT + TRUE_SLOPE * p.x + TRUE_NOISE * randn()) }));
  }

  function recordSample(samplePts) {
    pts = samplePts;
    const st = stats(pts);
    const hit = st.low <= TRUE_SLOPE && st.high >= TRUE_SLOPE;
    trials++;
    if (hit) hits++;
    recent.push({ low: st.low, high: st.high, slope: st.slope, hit });
    if (recent.length > 14) recent.shift();
    return st;
  }

  function oneSample(redraw) {
    cancelAnimationFrame(anim);
    recordSample(makeRandomSample());
    if (redraw) draw();
  }

  function runMany(count) {
    cancelAnimationFrame(anim);
    let left = count;
    const step = () => {
      const batch = Math.min(left, 4);
      for (let k = 0; k < batch; k++) recordSample(makeRandomSample());
      left -= batch;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function reset() {
    cancelAnimationFrame(anim);
    pts = START.map(p => ({ ...p }));
    sel = -1;
    trials = 0;
    hits = 0;
    recent = [];
    draw();
  }

  const chal = challenges(ch, [
    { text: 'Make the standard error smaller than $0.45 without widening the areas (try “Less noise” or drag dots closer to the line).',
      check: st => st.se < 0.45 && st.sxx <= 6600,
      why: 'Yes! Less noise around the line means less slope wobble, so the standard error drops.' },
    { text: 'Press “Start again”, then squeeze the areas closer to 70 until the standard error rises above $1.10.',
      check: st => st.se > 1.10 && st.sxx < 2500 && st.rse <= 65,
      why: 'Right: like holding a ruler with hands close together, narrow areas let the line wobble much more.' },
    { text: 'Make the 95% confidence interval include 0 (drag dots or add noise until the low end reaches 0 or below).',
      check: st => st.low <= 0,
      why: 'Now 0 is a plausible slope — with this data, you can no longer be sure rent rises with area.' },
    { text: 'Press “Start again”, then press “Run 100 samples”. See how often the 95% interval catches the true slope of 10.',
      check: st => st.trials >= 100,
      why: 'Usually around 95 out of 100! The 95% is how often this method catches the true slope across repeated samples.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 470, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 48 : 60, X1 = VW - 16, Y0 = 26, Y1 = 286;
  const AMIN = 25, AMAX = 115, RMIN = 600, RMAX = 1650;
  const ax = a => X0 + ((a - AMIN) / (AMAX - AMIN)) * (X1 - X0);
  const ay = r => Y1 - ((r - RMIN) / (RMAX - RMIN)) * (Y1 - Y0);
  const clampY = y => Math.max(Y0 - 6, Math.min(Y1 + 6, y));

  // Slope strip geometry (bottom section of SVG)
  const SX0 = NARROW ? 26 : 44, SX1 = VW - (NARROW ? 20 : 32);
  const SMIN = -2, SMAX = 18;
  const sx = v => SX0 + ((Math.max(SMIN, Math.min(SMAX, v)) - SMIN) / (SMAX - SMIN)) * (SX1 - SX0);

  // Drag any apartment dot (touch + mouse)
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bestD = 34 * F;
    pts.forEach((pt, i) => {
      const dx = ax(pt.x) - p.x, dy = clampY(ay(pt.y)) - p.y;
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    cancelAnimationFrame(anim);
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const nx = Math.max(30, Math.min(110, Math.round(AMIN + ((p.x - X0) / (X1 - X0)) * (AMAX - AMIN))));
    const ny = Math.max(630, Math.min(1620, Math.round((RMIN + ((Y1 - p.y) / (Y1 - Y0)) * (RMAX - RMIN)) / 10) * 10));
    pts[dragging] = { ...pts[dragging], x: nx, y: ny };
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const st = stats(pts);
    const k = [];

    // Grid & axes for scatter plot
    for (let r = 600; r <= 1600; r += 200) {
      const y = ay(r);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 7, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, r)
      );
    }
    for (const a of [40, 60, 80, 100]) {
      const x = ax(a);
      k.push(
        s('line', { x1: x, x2: x, y1: Y0, y2: Y1, stroke: C.line, 'stroke-opacity': 0.45 }),
        s('text', { x, y: Y1 + 17 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a)
      );
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: Y0, y2: Y1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: (X0 + X1) / 2, y: Y1 + 33 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'Area (m²)'),
      s('text', { x: X0 + 6, y: Y0 - 8, fill: C.muted, 'font-size': 12 * F }, 'Rent ($)')
    );

    // 95% slope CI wedge pivoting through (xbar, ybar)
    const aL = 28, aR = 112;
    const yLoL = clampY(ay(st.ybar + st.low * (aL - st.xbar)));
    const yHiL = clampY(ay(st.ybar + st.high * (aL - st.xbar)));
    const yLoR = clampY(ay(st.ybar + st.low * (aR - st.xbar)));
    const yHiR = clampY(ay(st.ybar + st.high * (aR - st.xbar)));
    const cx = ax(st.xbar), cy = clampY(ay(st.ybar));
    const polyPts = `${ax(aL)},${yLoL} ${cx},${cy} ${ax(aR)},${yLoR} ${ax(aR)},${yHiR} ${cx},${cy} ${ax(aL)},${yHiL}`;
    const hitTrue = st.low <= TRUE_SLOPE && st.high >= TRUE_SLOPE;
    const ciCol = trials > 0 && !hitTrue ? C.pink : C.green;
    k.push(
      s('polygon', { points: polyPts, fill: ciCol, 'fill-opacity': 0.13 }),
      s('line', { x1: ax(aL), y1: yLoL, x2: ax(aR), y2: yLoR, stroke: ciCol, 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }),
      s('line', { x1: ax(aL), y1: yHiL, x2: ax(aR), y2: yHiR, stroke: ciCol, 'stroke-width': 1.6, 'stroke-dasharray': '6 5' })
    );

    // Residual sticks
    pts.forEach(p => {
      const px = ax(p.x), py = clampY(ay(p.y)), fy = clampY(ay(st.intercept + st.slope * p.x));
      k.push(s('line', { x1: px, x2: px, y1: py, y2: fy, stroke: p.col, 'stroke-width': 1.4, 'stroke-opacity': 0.55 }));
    });

    // White fitted line & centre point
    k.push(
      s('line', { x1: ax(aL), y1: clampY(ay(st.intercept + st.slope * aL)), x2: ax(aR), y2: clampY(ay(st.intercept + st.slope * aR)), stroke: C.ink, 'stroke-width': 2.8 }),
      s('circle', { cx, cy, r: 4.5, fill: C.bg, stroke: C.amber, 'stroke-width': 2 })
    );

    // 12 draggable apartment dots (tiny visual nudge only for exact ties)
    pts.forEach((p, i) => {
      const tie = pts.slice(0, i).filter(q => q.x === p.x && q.y === p.y).length;
      const px = ax(p.x) + (tie ? 8 : 0), py = clampY(ay(p.y));
      k.push(
        s('circle', { cx: px, cy: py, r: (i === sel ? 14 : 11) * F, fill: p.col, 'fill-opacity': i === sel ? 0.30 : 0.16, style: 'cursor:grab' }),
        s('circle', { cx: px, cy: py, r: 5.8 * F, fill: p.col, stroke: i === sel ? C.ink : 'none', 'stroke-width': 2, style: 'cursor:grab' })
      );
    });

    // Bottom strip: Slope 95% Confidence Interval axis
    const AY = 414, BAR_Y = 384;
    k.push(
      s('line', { x1: SX0, x2: SX1, y1: 332, y2: 332, stroke: C.line }),
      s('text', { x: SX0, y: 351, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, '95% CONFIDENCE INTERVAL FOR SLOPE ($ / m²)'),
      s('line', { x1: SX0, x2: SX1, y1: AY, y2: AY, stroke: C.muted, 'stroke-width': 2 })
    );
    for (let v = 0; v <= 16; v += 2) {
      const x = sx(v);
      const col = v === 0 ? C.pink : C.muted;
      k.push(
        s('line', { x1: x, x2: x, y1: AY - 5, y2: AY + 5, stroke: col, 'stroke-width': v === 0 ? 2.5 : 1.5 }),
        s('text', { x, y: AY + 19 * F, fill: col, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v)
      );
    }
    // Reference markers at 0 (no rise) and 10 (true slope during simulations)
    k.push(s('line', { x1: sx(0), x2: sx(0), y1: BAR_Y - 12, y2: AY, stroke: C.pink, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
    if (trials > 0) {
      k.push(
        s('line', { x1: sx(TRUE_SLOPE), x2: sx(TRUE_SLOPE), y1: 358, y2: AY, stroke: C.amber, 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }),
        s('text', { x: sx(TRUE_SLOPE), y: 368, fill: C.amber, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'true = 10')
      );
    }

    // Recent simulated intervals (faint stack)
    recent.slice(0, -1).forEach((iv, idx) => {
      const y = AY - 4 - idx * 1.6;
      k.push(s('line', { x1: sx(iv.low), x2: sx(iv.high), y1: y, y2: y, stroke: iv.hit ? C.green : C.pink, 'stroke-width': 1.5, 'stroke-opacity': 0.35 }));
    });

    // Current 95% CI bar
    const xLo = sx(st.low), xHi = sx(st.high), xM = sx(st.slope);
    k.push(
      s('line', { x1: xLo, x2: xHi, y1: BAR_Y, y2: BAR_Y, stroke: ciCol, 'stroke-width': 7, 'stroke-linecap': 'round' }),
      s('line', { x1: xLo, x2: xLo, y1: BAR_Y - 9, y2: BAR_Y + 9, stroke: ciCol, 'stroke-width': 2.5 }),
      s('line', { x1: xHi, x2: xHi, y1: BAR_Y - 9, y2: BAR_Y + 9, stroke: ciCol, 'stroke-width': 2.5 }),
      s('circle', { cx: xM, cy: BAR_Y, r: 5.5, fill: C.ink }),
      s('text', { x: Math.max(SX0 + 22, xLo - 6), y: BAR_Y - 12, fill: ciCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(st.low)),
      s('text', { x: Math.min(SX1 - 22, xHi + 6), y: BAR_Y - 12, fill: ciCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'start', 'font-family': 'Consolas' }, fmt(st.high))
    );

    if (trials > 0) {
      const pct = Math.round((hits / trials) * 100);
      k.push(s('text', { x: SX1, y: 458, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `Caught true slope 10: ${hits} / ${trials} (${pct}%)`));
    } else {
      k.push(s('text', { x: SX1, y: 458, fill: st.low <= 0 ? C.pink : C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' },
        st.low <= 0 ? '0 is inside the interval' : '0 is outside the interval'));
    }

    svg.replaceChildren(...k);

    const r1 = x => Math.round(x * 10) / 10;
    const r2 = x => Math.round(x * 100) / 100;
    fbox(box, [
      `slope       = ${fmt(r2(st.slope))} $/m²`,
      [`noise (RSE) = $${fmt(r1(st.rse))}`, C.pink],
      [`area spread = ${Math.round(st.sxx).toLocaleString()} (√ ≈ ${fmt(r1(Math.sqrt(st.sxx)))})`, C.green],
      [`SE          = ${fmt(r1(st.rse))} ÷ ${fmt(r1(Math.sqrt(st.sxx)))} ≈ ${fmt(r2(st.se))}`, C.amber],
      `margin      = 2.23 × ${fmt(r2(st.se))} ≈ ${fmt(r2(st.margin))}`,
      [`95% CI      = ${fmt(r2(st.low))} to ${fmt(r2(st.high))}`, ciCol],
    ]);

    note.textContent = trials > 0
      ? `Across ${trials} random sample${trials === 1 ? '' : 's'} of 12 apartments, ${hits} (${Math.round(hits / trials * 100)}%) caught the true slope of 10. Each sample tilts around its own centre.`
      : 'Smaller noise or wider areas shrink the standard error and tighten the green 95% slope wedge.';

    chal.update({ ...st, trials, hits });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

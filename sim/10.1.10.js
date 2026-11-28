// 10.1.10 Try it: prediction intervals vs confidence intervals for the mean.
// The learner drags a new apartment listing on the scatter plot, simulates new apartments
// to watch ~95% land in the wide band, generates fresh random neighbourhoods, doubles the
// sample size, and completes 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  // Exact Chapter 10.1 shared example (12 apartments, buildings X, Y, Z)
  const START = [
    [40, 860, 'X'], [40, 770, 'Y'], [40, 770, 'Z'],
    [60, 1040, 'X'], [60, 1020, 'Y'], [60, 940, 'Z'],
    [80, 1250, 'X'], [80, 1210, 'Y'], [80, 1140, 'Z'],
    [100, 1470, 'X'], [100, 1380, 'Y'], [100, 1350, 'Z'],
  ];
  const BCOL = { X: C.cyan, Y: C.amber, Z: C.pink };

  let data = START.map(d => d.slice());
  let area = 70, ask = 1180;
  let simPts = []; // { x, y, inCI, inPI }
  let usedRandom = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const areaVal = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '5.5rem' } });
  const askVal = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '6.5rem' } });
  const areaSlider = h('input', { type: 'range', min: 35, max: 105, step: 1, value: area, style: { flex: '1', minWidth: '120px' } });
  const askSlider = h('input', { type: 'range', min: 620, max: 1580, step: 5, value: ask, style: { flex: '1', minWidth: '120px' } });

  areaSlider.addEventListener('input', () => { area = +areaSlider.value; draw(); });
  askSlider.addEventListener('input', () => { ask = +askSlider.value; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: predicting one new apartment'),
    h('p', { class: 'sub' }, 'Drag the green listing anywhere on the plot (or use the sliders). Compare the thin cyan band for the mean with the wide violet prediction band for one apartment.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Area:'), areaSlider, areaVal),
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Asking:'), askSlider, askVal),
        h('div', { class: 'sim-row' },
          btn('Simulate 1 apartment', () => simMany(1), 'go'),
          btn('Simulate 25 apartments', () => simMany(25), 'go'),
          btn('Double sample (24)', () => doubleSample()),
          btn('New data (random)', () => newData()),
          btn('Clear simulated', () => { simPts = []; draw(); }),
          btn('Start again', () => reset()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Move the green listing to 50 m², with an asking rent outside the thin cyan band but inside the wide violet band.',
      check: st => Math.abs(st.area - 50) <= 2 && !st.inCI && st.inPI,
      why: 'Right! That rent is ordinary for one 50 m² apartment, even though it sits outside the thin band for the mean.' },
    { text: 'Move the listing near the edge (40 m² or 100 m²) and watch how both bands widen away from 70 m².',
      check: st => st.area <= 42 || st.area >= 98,
      why: 'Yes: the line wobbles more far from the centre of the data, so both bands widen slightly at the edges.' },
    { text: 'Press “Simulate 25 apartments”. Do most single apartments land inside the wide band, or inside the thin band?',
      check: st => st.trials >= 25,
      why: 'About 95% land inside the wide prediction band, while the thin band for the mean misses most single apartments.' },
    { text: 'Press “New data (random)” and then “Double sample (24)”. Which band shrinks most?',
      check: st => st.usedRandom && st.n >= 24,
      why: 'More data shrinks the line’s wobble (the thin band), but one apartment still has its own noise, so the wide band stays wide.' },
  ]);

  // Exact 95% two-sided t critical value
  function tCrit(df) {
    const tbl = { 10: 2.22813885, 22: 2.07387307, 34: 2.0322445 };
    return tbl[df] || (1.96 + 2.37 / df + 3.0 / (df * df));
  }

  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function stats() {
    const n = data.length;
    const xbar = data.reduce((a, d) => a + d[0], 0) / n;
    const ybar = data.reduce((a, d) => a + d[1], 0) / n;
    let sxx = 0, sxy = 0;
    for (const [x, y] of data) { sxx += (x - xbar) ** 2; sxy += (x - xbar) * (y - ybar); }
    const slope = sxy / sxx;
    const intercept = ybar - slope * xbar;
    let ssr = 0;
    for (const [x, y] of data) ssr += (y - (intercept + slope * x)) ** 2;
    const df = n - 2;
    const rse = Math.sqrt(ssr / df);
    const t = tCrit(df);
    const fit = x => intercept + slope * x;
    const seMean = x => rse * Math.sqrt(1 / n + (x - xbar) ** 2 / sxx);
    const sePred = x => rse * Math.sqrt(1 + 1 / n + (x - xbar) ** 2 / sxx);
    return { n, df, xbar, ybar, sxx, slope, intercept, rse, t, fit, seMean, sePred };
  }

  function simMany(count) {
    const st = stats();
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? area : rnd(38, 102);
      const y = Math.round(st.fit(x) + randn() * st.sePred(x));
      const f = st.fit(x);
      simPts.push({
        x, y,
        inCI: Math.abs(y - f) <= st.t * st.seMean(x),
        inPI: Math.abs(y - f) <= st.t * st.sePred(x),
      });
    }
    if (simPts.length > 200) simPts = simPts.slice(-200);
    draw();
  }

  function doubleSample() {
    if (data.length >= 24) return;
    const st = stats();
    const bld = ['X', 'Y', 'Z'];
    const extra = [];
    for (const ax of [40, 60, 80, 100]) {
      for (let j = 0; j < 3; j++) {
        const noise = Math.round(randn() * st.rse * 0.92);
        extra.push([ax, Math.max(450, Math.round(st.fit(ax) + noise)), bld[j]]);
      }
    }
    data = data.concat(extra);
    draw();
  }

  function newData() {
    const ic = rnd(320, 520), sl = rnd(8, 12), noise = rnd(38, 68);
    const bld = ['X', 'Y', 'Z'];
    const fresh = [];
    for (const ax of [40, 60, 80, 100]) {
      for (let j = 0; j < 3; j++) {
        const y = Math.round(ic + sl * ax + randn() * noise);
        fresh.push([ax, Math.max(500, y), bld[j]]);
      }
    }
    data = fresh;
    simPts = [];
    usedRandom = true;
    const st = stats();
    ask = Math.round((st.fit(area) + st.rse * 1.4) / 5) * 5;
    draw();
  }

  function reset() {
    data = START.map(d => d.slice());
    area = 70; ask = 1180; simPts = []; usedRandom = false;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 380 : 440, F = NARROW ? 1.12 : 1;
  const X0 = NARROW ? 52 : 64, X1 = VW - 16, TOP = 24, BASE = VH - 46;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const XMIN = 30, XMAX = 110;
  let yMin = 600, yMax = 1600;
  const sx = x => X0 + (x - XMIN) / (XMAX - XMIN) * (X1 - X0);
  const sy = y => BASE - (y - yMin) / (yMax - yMin) * (BASE - TOP);
  const invX = px => XMIN + (px - X0) / (X1 - X0) * (XMAX - XMIN);
  const invY = py => yMin + (BASE - py) / (BASE - TOP) * (yMax - yMin);

  // Dragging the green listing directly on the SVG
  let dragging = false;
  const toSvg = e => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(ctm.inverse());
  };
  const updateFromPointer = e => {
    const p = toSvg(e);
    area = Math.max(35, Math.min(105, Math.round(invX(p.x))));
    ask = Math.max(yMin + 20, Math.min(yMax - 20, Math.round(invY(p.y) / 5) * 5));
    draw();
  };
  svg.addEventListener('pointerdown', e => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    updateFromPointer(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging) updateFromPointer(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  const money = v => '$' + Math.round(v).toLocaleString('en-US');

  function bandPath(st, halfFn) {
    const xs = [];
    for (let x = 35; x <= 105; x += 2.5) xs.push(x);
    const top = xs.map(x => `${sx(x).toFixed(1)},${sy(st.fit(x) + halfFn(x)).toFixed(1)}`);
    const bot = xs.slice().reverse().map(x => `${sx(x).toFixed(1)},${sy(st.fit(x) - halfFn(x)).toFixed(1)}`);
    return `M ${top.join(' L ')} L ${bot.join(' L ')} Z`;
  }

  function edgePath(st, halfFn, sign) {
    const xs = [];
    for (let x = 35; x <= 105; x += 2.5) xs.push(x);
    return 'M ' + xs.map(x => `${sx(x).toFixed(1)},${sy(st.fit(x) + sign * halfFn(x)).toFixed(1)}`).join(' L ');
  }

  function draw() {
    const st = stats();
    // Compute comfortable y bounds around data, bands, and listing
    const loNeed = Math.min(600, st.fit(35) - st.t * st.sePred(35) - 60, ...data.map(d => d[1] - 40));
    const hiNeed = Math.max(1600, st.fit(105) + st.t * st.sePred(105) + 60, ...data.map(d => d[1] + 40));
    yMin = Math.floor(loNeed / 200) * 200;
    yMax = Math.ceil(hiNeed / 200) * 200;

    askSlider.min = yMin + 20;
    askSlider.max = yMax - 20;
    ask = Math.max(yMin + 20, Math.min(yMax - 20, ask));
    areaSlider.value = area;
    askSlider.value = ask;
    areaVal.textContent = `${area} m²`;
    askVal.textContent = money(ask);

    const kids = [];

    // Grid & axes
    for (let y = yMin; y <= yMax; y += 200) {
      const py = sy(y);
      kids.push(
        s('line', { x1: X0, x2: X1, y1: py, y2: py, stroke: C.line }),
        s('text', { x: X0 - 8, y: py + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, y.toLocaleString('en-US'))
      );
    }
    for (const x of [40, 60, 80, 100]) {
      const px = sx(x);
      kids.push(
        s('line', { x1: px, x2: px, y1: TOP, y2: BASE, stroke: C.line, 'stroke-opacity': 0.5 }),
        s('text', { x: px, y: BASE + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, x)
      );
    }
    kids.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: (X0 + X1) / 2, y: VH - 6, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'Area (sq m)'),
      s('text', { x: X0 + 6, y: TOP + 12, fill: C.muted, 'font-size': 12 * F }, 'Rent ($)')
    );

    // Wide prediction band (violet) & thin confidence band (cyan)
    kids.push(
      s('path', { d: bandPath(st, x => st.t * st.sePred(x)), fill: C.violet, 'fill-opacity': 0.16 }),
      s('path', { d: edgePath(st, x => st.t * st.sePred(x), 1), fill: 'none', stroke: C.violet, 'stroke-width': 1.8, 'stroke-opacity': 0.75 }),
      s('path', { d: edgePath(st, x => st.t * st.sePred(x), -1), fill: 'none', stroke: C.violet, 'stroke-width': 1.8, 'stroke-opacity': 0.75 }),
      s('path', { d: bandPath(st, x => st.t * st.seMean(x)), fill: C.cyan, 'fill-opacity': 0.26 }),
      s('path', { d: edgePath(st, x => st.t * st.seMean(x), 1), fill: 'none', stroke: C.cyan, 'stroke-width': 1.6, 'stroke-opacity': 0.85 }),
      s('path', { d: edgePath(st, x => st.t * st.seMean(x), -1), fill: 'none', stroke: C.cyan, 'stroke-width': 1.6, 'stroke-opacity': 0.85 })
    );

    // Fitted white line
    kids.push(s('line', {
      x1: sx(35), y1: sy(st.fit(35)), x2: sx(105), y2: sy(st.fit(105)),
      stroke: C.ink, 'stroke-width': 2.5
    }));

    // Simulated new apartments (if any)
    for (const p of simPts) {
      kids.push(s('circle', {
        cx: sx(p.x), cy: sy(p.y), r: 3.5,
        fill: p.inPI ? C.green : C.pink, 'fill-opacity': 0.8,
        stroke: C.bg, 'stroke-width': 0.6
      }));
    }

    // Sample apartment dots (X cyan, Y amber, Z pink)
    for (const [x, y, b] of data) {
      kids.push(s('circle', {
        cx: sx(x), cy: sy(y), r: 5.5,
        fill: BCOL[b] || C.cyan, 'fill-opacity': 0.88,
        stroke: C.bg, 'stroke-width': 1
      }));
    }

    // Vertical slice at current listing area: PI bar + CI bar
    const fVal = st.fit(area);
    const seM = st.seMean(area), seP = st.sePred(area);
    const ciH = st.t * seM, piH = st.t * seP;
    const cx = sx(area);
    kids.push(
      s('line', { x1: cx, x2: cx, y1: sy(fVal - piH), y2: sy(fVal + piH), stroke: C.violet, 'stroke-width': 4 }),
      s('line', { x1: cx - 7, x2: cx + 7, y1: sy(fVal + piH), y2: sy(fVal + piH), stroke: C.violet, 'stroke-width': 3 }),
      s('line', { x1: cx - 7, x2: cx + 7, y1: sy(fVal - piH), y2: sy(fVal - piH), stroke: C.violet, 'stroke-width': 3 }),
      s('line', { x1: cx, x2: cx, y1: sy(fVal - ciH), y2: sy(fVal + ciH), stroke: C.cyan, 'stroke-width': 5 }),
      s('circle', { cx, cy: sy(fVal), r: 4.5, fill: C.ink })
    );

    // Draggable green listing dot
    const inCI = Math.abs(ask - fVal) <= ciH;
    const inPI = Math.abs(ask - fVal) <= piH;
    const dotCol = inPI ? C.green : C.pink;
    const cy = sy(ask);
    kids.push(
      s('circle', { cx, cy, r: 15, fill: dotCol, 'fill-opacity': 0.22 }),
      s('circle', { cx, cy, r: 7.5, fill: dotCol, stroke: C.bg, 'stroke-width': 2 }),
      s('text', {
        x: cx + (area > 84 ? -12 : 12), y: cy - 10,
        fill: dotCol, 'font-size': 13 * F, 'font-weight': 700,
        'text-anchor': area > 84 ? 'end' : 'start', 'font-family': 'Consolas'
      }, `${money(ask)}`)
    );

    // Compact legend at top-left inside plot
    kids.push(
      s('rect', { x: X0 + 10, y: TOP + 20, width: 12, height: 8, rx: 2, fill: C.cyan, 'fill-opacity': 0.55, stroke: C.cyan }),
      s('text', { x: X0 + 28, y: TOP + 28, fill: C.cyan, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, '95% mean band (thin)'),
      s('rect', { x: X0 + 10, y: TOP + 36, width: 12, height: 8, rx: 2, fill: C.violet, 'fill-opacity': 0.35, stroke: C.violet }),
      s('text', { x: X0 + 28, y: TOP + 44, fill: C.violet, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, '95% prediction band (wide)')
    );

    svg.replaceChildren(...kids);

    // Formula box: live step-by-step numbers
    const ciLo = fVal - ciH, ciHi = fVal + ciH;
    const piLo = fVal - piH, piHi = fVal + piH;
    const statusText = inCI
      ? `${money(ask)}: inside BOTH bands`
      : inPI
        ? `${money(ask)}: inside wide, outside thin`
        : `${money(ask)}: outside wide band (unusual)`;
    fbox(box, [
      `n = ${st.n}  (t = ${st.t.toFixed(2)})  at ${area} m²`,
      `fitted rent = ${money(fVal)}`,
      [`line wobble = $${Math.round(seM)}  → CI ${money(ciLo)}–${money(ciHi)}`, C.cyan],
      [`own noise   = $${Math.round(st.rse)}`, C.amber],
      [`combined    = √(${Math.round(seM)}² + ${Math.round(st.rse)}²) ≈ $${Math.round(seP)}`, C.violet],
      [`pred. band  = ${money(piLo)} to ${money(piHi)} (±$${Math.round(piH)})`, C.violet],
      [statusText, inPI ? C.green : C.pink],
    ]);

    // Plain-language note + simulation tally
    const baseMsg = inCI
      ? 'This price is close enough to fall inside both the thin mean band and the wide prediction band.'
      : inPI
        ? 'Ordinary for one apartment! The thin mean band would falsely flag it, because it ignores the apartment’s own noise.'
        : 'Outside the wide prediction band: unusually high or low for an apartment of this size in this neighbourhood.';
    if (simPts.length > 0) {
      const piHits = simPts.filter(p => p.inPI).length;
      const ciHits = simPts.filter(p => p.inCI).length;
      const piPct = Math.round(100 * piHits / simPts.length);
      const ciPct = Math.round(100 * ciHits / simPts.length);
      note.textContent = `Simulated ${simPts.length} apartments: ${piHits} (${piPct}%) fell inside the wide prediction band, only ${ciHits} (${ciPct}%) inside the thin mean band. ${baseMsg}`;
    } else {
      note.textContent = baseMsg;
    }

    chal.update({ area, ask, inCI, inPI, trials: simPts.length, usedRandom, n: st.n });
  }

  draw();
  return () => {};
}

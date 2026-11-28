// 2.3.3 Try it: ordinary axis vs logarithmic (log) axis.
// Drag dots up or down (or tap a year and multiply/divide), switch smoothly between
// an ordinary (+ equal) axis and a log (×10) axis, make random data, and test 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [100, 1000, 10000, 100000];
  const ADD_PRESET = [10000, 20000, 30000, 40000];
  const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
  const LIN_TICKS = [0, 25000, 50000, 75000, 100000];
  const LOG_TICKS = [100, 1000, 10000, 100000];

  let v = START.slice(), sel = 0;
  let logBlend = 0, target = 0, anim = 0;
  let toggledLog = false, viewedAddOrd = false, viewedAddLog = false;
  let isRandom = false, seenLinRnd = false, seenLogRnd = false, countedRnd = false, randomChecks = 0;

  const commafy = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const clamp = x => Math.max(100, Math.min(100000, Math.round(x)));
  function snapNice(raw) {
    const x = Math.max(100, Math.min(100000, raw));
    for (const p of LOG_TICKS) if (Math.abs(x - p) / p < 0.06) return p;
    if (x < 300) return Math.round(x / 10) * 10;
    if (x < 1000) return Math.round(x / 50) * 50;
    if (x < 5000) return Math.round(x / 100) * 100;
    if (x < 20000) return Math.round(x / 500) * 500;
    return Math.round(x / 1000) * 1000;
  }

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const btnLog = btn('Log axis (×10)', () => go(1), 'go');
  const btnOrd = btn('Ordinary axis', () => go(0));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: ordinary axis vs log axis'),
    h('p', { class: 'sub' }, 'Each dot is one year of riders per month on route D. Drag any dot up or down, or tap it and use the × / ÷ buttons, then switch axes.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('÷10', () => scaleSel(0.1)),
          btn('÷2', () => scaleSel(0.5)),
          btn('×2', () => scaleSel(2)),
          btn('×10', () => scaleSel(10)),
          selLabel),
        h('div', { class: 'sim-row' },
          btnLog,
          btnOrd,
          btn('New data', makeRandom),
          btn('Steady × (random)', makeSteady),
          btn('Same + each year', () => { v = ADD_PRESET.slice(); isRandom = false; updateFlags(); draw(); }),
          btn('Start again', () => { v = START.slice(); sel = 0; isRandom = false; go(0); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function ratios() { return [v[1] / v[0], v[2] / v[1], v[3] / v[2]]; }
  function diffs() { return [v[1] - v[0], v[2] - v[1], v[3] - v[2]]; }
  function steadyFactor() {
    const r = ratios(), lo = Math.min(...r), hi = Math.max(...r);
    if (lo <= 1.08) return null;
    return hi / lo <= 1.06 ? Math.round(((r[0] + r[1] + r[2]) / 3) * 100) / 100 : null;
  }
  function isSteadyAdd() {
    const d = diffs(), lo = Math.min(...d), hi = Math.max(...d);
    return lo > 0 && (hi - lo) <= Math.max(100, d[0] * 0.05);
  }

  function updateFlags() {
    if (target === 1) toggledLog = true;
    if (isSteadyAdd()) {
      if (target === 0) viewedAddOrd = true;
      if (target === 1) viewedAddLog = true;
    }
    if (isRandom) {
      if (target === 0) seenLinRnd = true;
      if (target === 1) seenLogRnd = true;
      if (seenLinRnd && seenLogRnd && !countedRnd) { countedRnd = true; randomChecks++; }
    }
  }

  function scaleSel(k) {
    v[sel] = clamp(v[sel] * k);
    isRandom = false;
    updateFlags();
    draw();
  }

  function makeRandom() {
    const vals = [];
    for (let i = 0; i < 4; i++) vals.push(snapNice(Math.pow(10, 2 + Math.random() * 3)));
    vals.sort((a, b) => a - b);
    vals[0] = snapNice(Math.min(vals[0], rnd(100, 600)));
    vals[3] = snapNice(Math.max(vals[3], rnd(35000, 95000)));
    v = vals;
    isRandom = true;
    seenLinRnd = (target === 0);
    seenLogRnd = (target === 1);
    countedRnd = false;
    updateFlags();
    draw();
  }

  function makeSteady() {
    const choices = [
      [100, 2], [200, 2], [500, 2], [1000, 2], [2000, 2], [5000, 2],
      [100, 3], [200, 3], [500, 3], [1000, 3], [2000, 3],
      [100, 4], [200, 4], [500, 4], [1000, 4],
      [100, 5], [200, 5], [400, 5], [500, 5],
      [100, 6], [200, 6], [100, 8], [150, 8]
    ];
    const [start, f] = choices[rnd(0, choices.length - 1)];
    v = [start, start * f, start * f * f, start * f * f * f];
    isRandom = false;
    updateFlags();
    draw();
  }

  const chal = challenges(ch, [
    { text: 'Press “Log axis (×10)” to see route D on the log ruler. Watch the three bottom dots.',
      check: st => st.isLog && st.toggledLog,
      why: 'Yes! On a log axis, every ×10 step has the same height, so all four years climb in a straight line.' },
    { text: 'On the log axis, make a different straight line with the same factor each year (not ×10).',
      check: st => st.isLog && st.sf !== null && Math.abs(st.sf - 10) > 0.08,
      why: 'Right! Any steady multiplying factor makes a straight line on a log axis — smaller factors just climb more gently.' },
    { text: 'Press “Same + each year” and view it on both axes. Does steady adding stay straight on a log axis?',
      check: st => st.steadyAdd && st.viewedAddOrd && st.viewedAddLog,
      why: 'No! Adding +10,000 each year is straight on an ordinary axis, but curves downward on a log axis because the factor shrinks each year.' },
    { text: 'Press “New data” twice and compare both axes each time. Does the log axis always lift small numbers off the floor?',
      check: st => st.randomChecks >= 2,
      why: 'Always. A log axis gives equal space to each ×10 jump, so small and huge numbers read clearly on the same chart.' },
  ]);

  // Geometry (responsive for phone and laptop)
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 74 : 92, X1 = VW - 24, BASE = 382, LOG_BASE = 358, TOP = 42;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const yrX = i => X0 + (X1 - X0) * (0.12 + i * 0.253);
  const yLin = val => BASE - (val / 100000) * (BASE - TOP);
  const yLog = val => LOG_BASE - ((Math.log10(Math.max(100, val)) - 2) / 3) * (LOG_BASE - TOP);
  const yOf = val => yLin(val) + (yLog(val) - yLin(val)) * logBlend;

  function go(t) {
    target = t;
    btnLog.className = 'sim-btn ' + (target === 1 ? 'go' : '');
    btnOrd.className = 'sim-btn ' + (target === 0 ? 'go' : '');
    updateFlags();
    cancelAnimationFrame(anim);
    const from = logBlend, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 750);
      logBlend = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  btnLog.className = 'sim-btn';
  btnOrd.className = 'sim-btn go';

  // Drag any dot vertically
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = 0, bestD = Infinity;
    for (let i = 0; i < 4; i++) {
      const d = Math.abs(p.x - yrX(i));
      if (d < bestD) { bestD = d; best = i; }
    }
    if (bestD > (X1 - X0) * 0.2) return;
    sel = best; dragging = best; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    if (target === 1) {
      const exp = 2 + Math.max(0, Math.min(3, ((LOG_BASE - p.y) / (LOG_BASE - TOP)) * 3));
      v[dragging] = snapNice(Math.pow(10, exp));
    } else {
      const raw = Math.max(100, Math.min(100000, ((BASE - p.y) / (BASE - TOP)) * 100000));
      v[dragging] = snapNice(raw);
    }
    isRandom = false;
    updateFlags();
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const k = [];
    const sf = steadyFactor();
    const sAdd = isSteadyAdd();
    const isLog = target === 1;
    const linOp = Math.max(0, 1 - logBlend * 1.45);
    const logOp = Math.max(0, (logBlend - 0.3) / 0.7);

    // Axes spines
    k.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X0, y1: TOP - 6, y2: BASE, stroke: C.muted, 'stroke-width': 2 })
    );

    // Linear gridlines & labels
    if (linOp > 0.01) {
      for (const g of LIN_TICKS) {
        const y = yLin(g);
        k.push(
          s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': linOp }),
          s('text', { x: X0 - 10, y: y + 4, fill: C.muted, 'fill-opacity': linOp, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, commafy(g))
        );
      }
    }

    // Log gridlines, labels & ×10 step markers
    if (logOp > 0.01) {
      LOG_TICKS.forEach((g, idx) => {
        const y = yLog(g);
        k.push(
          s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': logOp }),
          s('line', { x1: X0 - 5, x2: X0 + 5, y1: y, y2: y, stroke: C.cyan, 'stroke-width': 2, 'stroke-opacity': logOp }),
          s('text', { x: X0 - 10, y: y + 4, fill: C.cyan, 'fill-opacity': logOp, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, commafy(g))
        );
        if (idx < 3) {
          const ym = (y + yLog(LOG_TICKS[idx + 1])) / 2;
          k.push(s('text', { x: X0 - 12, y: ym + 4, fill: C.green, 'fill-opacity': logOp, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, '×10'));
        }
      });
    }

    // Selected column highlight & year labels
    const colW = (X1 - X0) * 0.22;
    YEARS.forEach((yr, i) => {
      const cx = yrX(i);
      if (i === sel) k.push(s('rect', { x: cx - colW / 2, y: TOP - 10, width: colW, height: BASE - TOP + 10, fill: '#ffffff', 'fill-opacity': 0.04, rx: 8 }));
      k.push(s('text', { x: cx, y: BASE + 24, fill: i === sel ? C.amber : C.muted, 'font-size': 13 * F, 'font-weight': i === sel ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas' }, yr));
    });

    // Connecting line & step labels
    const pts = v.map((val, i) => [yrX(i), yOf(val)]);
    const lineCol = (isLog && sf !== null) || (!isLog && sAdd) ? C.green : C.cyan;
    for (let i = 0; i < 3; i++) {
      k.push(s('line', { x1: pts[i][0], y1: pts[i][1], x2: pts[i + 1][0], y2: pts[i + 1][1], stroke: lineCol, 'stroke-width': 3.5 }));
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      const d = v[i + 1] - v[i], r = v[i + 1] / v[i];
      const tag = logBlend > 0.5 ? '×' + fmt(Math.round(r * 100) / 100) : (d >= 0 ? '+' : '') + commafy(d);
      const tagCol = logBlend > 0.5 ? (sf !== null ? C.green : C.amber) : (sAdd ? C.green : C.muted);
      k.push(s('text', { x: mx, y: my - 10, fill: tagCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, tag));
    }

    // Dots & value labels
    pts.forEach(([cx, cy], i) => {
      const col = i === sel ? C.amber : C.cyan;
      k.push(
        s('circle', { cx, cy, r: 15, fill: col, 'fill-opacity': 0.16 }),
        s('circle', { cx, cy, r: 7.5, fill: col }),
        s('text', { x: cx, y: cy - 15, fill: col, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, commafy(v[i]))
      );
    });

    // Top-right mode pill inside chart
    const pillTxt = logBlend > 0.5 ? 'LOG AXIS (×10)' : 'ORDINARY (+25,000)';
    const pillCol = logBlend > 0.5 ? C.green : C.amber;
    const pw = (NARROW ? 148 : 168) * F;
    k.push(
      s('rect', { x: X1 - pw, y: 8, width: pw, height: 24 * F, rx: 12 * F, fill: C.bg, stroke: pillCol }),
      s('text', { x: X1 - pw / 2, y: 8 + 16 * F, fill: pillCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, pillTxt)
    );

    svg.replaceChildren(...k);

    const r = ratios(), d = diffs();
    const fmtStep = i => {
      const sign = d[i] >= 0 ? '+' : '';
      return `Yr ${i + 1}→${i + 2}: ${sign}${commafy(d[i])}  (×${fmt(Math.round(r[i] * 100) / 100)})`;
    };
    const pattern = sf !== null
      ? [`Pattern: steady ×${fmt(sf)} growth`, C.green]
      : sAdd
        ? [`Pattern: steady +${commafy(d[0])} each year`, C.amber]
        : ['Pattern: changing step size', C.muted];
    fbox(box, [
      [isLog ? 'Axis:   log (each step = ×10)' : 'Axis:   ordinary (each step = +25,000)', isLog ? C.green : C.amber],
      fmtStep(0),
      fmtStep(1),
      fmtStep(2),
      pattern
    ]);

    note.textContent = isLog
      ? (sf !== null
        ? `Straight line on the log axis! Every year multiplies by ×${fmt(sf)}, even though the added riders jump from ${commafy(d[0])} to ${commafy(d[2])}.`
        : sAdd
          ? 'Adding the same amount every year makes the factor shrink, so the line bends downward on a log axis.'
          : 'On a log axis, equal steps up mean equal multiplying. Watch the × factors beside each jump.')
      : (v[0] <= 1000 && v[3] >= 50000
        ? 'On an ordinary axis, the biggest year pushes smaller years down onto the floor. Try switching to the log axis!'
        : 'On an ordinary axis, equal steps up mean equal adding. Switch to the log axis to compare.');

    selLabel.textContent = `Selected: ${YEARS[sel]} (${commafy(v[sel])} riders)`;
    chal.update({ isLog, toggledLog, sf, steadyAdd: sAdd, viewedAddOrd, viewedAddLog, randomChecks });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

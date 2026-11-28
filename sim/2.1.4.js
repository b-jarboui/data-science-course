// 2.1.4 Try it: density on a histogram with unequal bins.
// The learner switches between fair density heights and misleading count heights,
// drags the two bin borders (or taps -5 / +5), drags visit dots across borders,
// generates random library days, and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [5, 8, 10, 10, 12, 15, 15, 20, 25, 30, 30, 35, 40, 45, 50, 55, 60, 60, 75, 85, 90, 90, 95, 160];
  const MAX_M = 180;
  const BIN_COLS = [C.cyan, C.amber, C.pink];

  let v = START.slice();
  let b1 = 20, b2 = 60;
  let mode = 'density'; // 'density' | 'count'
  let selBin = 1;       // 0, 1, 2
  let selBorder = 0;    // 0 -> b1, 1 -> b2
  let sawCount = false;
  let isRandom = false;
  let movedOnRandom = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const borderLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const btnDensity = btn('Density (fair area)', () => setMode('density'), 'go');
  const btnCount = btn('Count (unfair)', () => setMode('count'));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: fair heights for unequal bins'),
    h('p', { class: 'sub' }, 'Drag the two glowing bin borders left or right (or tap a border and use −5 / +5). Switch between Density and Count to see why area must match share.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btnDensity, btnCount,
          btn('Equal 60-min bins', () => setBorders(60, 120))),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Border 1', () => { selBorder = 0; draw(); }),
          btn('Border 2', () => { selBorder = 1; draw(); }),
          btn('−5', () => nudgeBorder(-5)),
          btn('+5', () => nudgeBorder(5)),
          borderLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', makeRandom, 'go'),
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Switch to “Count (unfair)”, see how huge the 60–180 bar looks, then switch back to “Density (fair area)”.',
      check: st => st.sawCount && st.mode === 'density',
      why: 'Right! With count heights, a 2-hour bin looks huge even though it holds only one third of the visits. Density lowers it so shaded area matches share.' },
    { text: 'In Density mode, widen the first bin to 40 minutes (0–40). Notice it holds more visits (12 instead of 7), yet its height drops.',
      check: st => !st.isRandom && st.mode === 'density' && st.b1 === 40,
      why: 'Density is crowding per minute, not count. Doubling the width spreads those 12 visits out, so the height drops from 1.46% to 1.25% per minute.' },
    { text: 'Make all three bins equal width (0–60, 60–120, 120–180) by dragging the borders or pressing “Equal 60-min bins”.',
      check: st => st.b1 === 60 && st.b2 === 120,
      why: 'When all bins have the same width, dividing by width scales every bar equally — so count and density show the exact same shape.' },
    { text: 'Press “New data (random)”, then move either border in Density mode. Do all three areas still add up to 100%?',
      check: st => st.isRandom && st.movedOnRandom && st.mode === 'density',
      why: 'Always 100%! Every bar’s shaded area equals its share of the visits, so all three always add up to one whole.' },
  ]);

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.16 : 1;
  const X0 = NARROW ? 48 : 58, X1 = VW - 16;
  const DOT_TOP = 18, DOT_BOT = 78;
  const HANDLE_Y = 98;
  const TOP = 126, BASE = 386;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const min2x = m => X0 + (m / MAX_M) * (X1 - X0);
  const x2min = x => Math.max(0, Math.min(MAX_M - 1, Math.round(((x - X0) / (X1 - X0)) * MAX_M)));
  const snap5 = m => Math.round(m / 5) * 5;

  function setMode(m) {
    mode = m;
    if (m === 'count') sawCount = true;
    draw();
  }

  function setBorders(nb1, nb2) {
    b1 = Math.max(5, Math.min(MAX_M - 10, nb1));
    b2 = Math.max(b1 + 5, Math.min(MAX_M - 5, nb2));
    if (isRandom) movedOnRandom = true;
    draw();
  }

  function nudgeBorder(d) {
    if (selBorder === 0) setBorders(Math.min(b2 - 5, b1 + d), b2);
    else setBorders(b1, Math.max(b1 + 5, b2 + d));
  }

  function makeRandom() {
    const next = [];
    for (let i = 0; i < 24; i++) {
      const r = Math.random();
      if (r < 0.32) next.push(rnd(4, 24));
      else if (r < 0.68) next.push(rnd(20, 68));
      else if (r < 0.92) next.push(rnd(60, 125));
      else next.push(rnd(120, 175));
    }
    v = next;
    isRandom = true;
    movedOnRandom = false;
    draw();
  }

  function reset() {
    v = START.slice();
    b1 = 20; b2 = 60;
    mode = 'density';
    selBin = 1; selBorder = 0;
    isRandom = false; movedOnRandom = false;
    draw();
  }

  function computeBins() {
    const edges = [[0, b1], [b1, b2], [b2, MAX_M]];
    const counts = [0, 0, 0];
    for (const val of v) {
      if (val < b1) counts[0]++;
      else if (val < b2) counts[1]++;
      else counts[2]++;
    }
    const n = v.length;
    return edges.map(([a, b], i) => {
      const width = b - a;
      const share = (counts[i] / n) * 100;
      const density = share / width; // % per min
      return { a, b, width, count: counts[i], share, density, color: BIN_COLS[i] };
    });
  }

  // Pointer interaction: drag visit dots, drag border handles, or tap a bar to inspect it
  let dotCoords = [];
  let dragType = null; // 'border' | 'dot' | null
  let dragIdx = -1;

  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const xB1 = min2x(b1), xB2 = min2x(b2);
    const dB1 = Math.abs(p.x - xB1), dB2 = Math.abs(p.x - xB2);

    // Grab a border handle (handle bar strip or directly on a vertical border line)
    if (p.y >= DOT_BOT + 2 && p.y <= BASE + 10) {
      const near = Math.min(dB1, dB2);
      const hitRadius = p.y <= TOP ? 32 * F : 16 * F;
      if (near <= hitRadius) {
        dragType = 'border';
        dragIdx = dB1 <= dB2 ? 0 : 1;
        selBorder = dragIdx;
        svg.setPointerCapture(e.pointerId);
        draw();
        return;
      }
    }

    // Grab a visit dot in the top strip
    if (p.y <= DOT_BOT + 6) {
      let best = -1, bestD = 26 * F;
      dotCoords.forEach(dc => {
        const d = Math.hypot(p.x - dc.x, p.y - dc.y);
        if (d < bestD) { bestD = d; best = dc.idx; }
      });
      if (best >= 0) {
        dragType = 'dot';
        dragIdx = best;
        svg.setPointerCapture(e.pointerId);
        draw();
        return;
      }
    }

    // Tap a bar to inspect its formula details
    if (p.y >= TOP && p.y <= BASE && p.x >= X0 && p.x <= X1) {
      const m = x2min(p.x);
      selBin = m < b1 ? 0 : m < b2 ? 1 : 2;
      draw();
    }
  });

  svg.addEventListener('pointermove', e => {
    if (!dragType) return;
    const p = toSvg(e);
    if (dragType === 'border') {
      const m = snap5(x2min(p.x));
      if (dragIdx === 0) setBorders(Math.max(5, Math.min(b2 - 5, m)), b2);
      else setBorders(b1, Math.max(b1 + 5, Math.min(MAX_M - 5, m)));
    } else if (dragType === 'dot') {
      const m = x2min(p.x);
      v[dragIdx] = m;
      selBin = m < b1 ? 0 : m < b2 ? 1 : 2;
      draw();
    }
  });

  svg.addEventListener('pointerup', () => { dragType = null; dragIdx = -1; });

  function draw() {
    const bins = computeBins();
    const isDens = mode === 'density';
    const k = [];

    // Top dot strip
    k.push(
      s('rect', { x: X0, y: DOT_TOP - 8, width: X1 - X0, height: DOT_BOT - DOT_TOP + 12, rx: 10, fill: '#ffffff', 'fill-opacity': 0.03, stroke: C.line }),
      s('text', { x: X0 + 8, y: DOT_TOP + 5, fill: C.muted, 'font-size': 10.5 * F, 'font-family': 'Consolas' }, '24 VISITS (DRAG ANY DOT)'));

    // Y-axis scale
    const maxVal = isDens ? Math.max(1.6, ...bins.map(b => b.density) * 1.15) : Math.max(10, ...bins.map(b => b.count));
    const maxDens = Math.max(1.6, Math.ceil(Math.max(...bins.map(b => b.density)) * 2.15) / 2);
    const maxCnt = Math.max(10, Math.ceil(Math.max(...bins.map(b => b.count)) / 2) * 2);
    const yMax = isDens ? maxDens : maxCnt;
    const yStep = isDens ? (yMax > 3 ? 1.0 : 0.5) : (yMax > 14 ? 4 : 2);
    const y2py = val => BASE - (val / yMax) * (BASE - TOP);

    // Horizontal gridlines & y-axis ticks
    for (let g = 0; g <= yMax + 1e-6; g += yStep) {
      const y = y2py(g);
      const label = isDens ? `${g.toFixed(1)}%` : String(Math.round(g));
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 7, y: y + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, label));
    }
    k.push(s('text', { x: X0 - 6, y: TOP - 10, fill: isDens ? C.green : C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, isDens ? '%/min' : 'visits'));

    // Bars
    bins.forEach((b, i) => {
      const xL = min2x(b.a), xR = min2x(b.b), bw = xR - xL;
      const val = isDens ? b.density : b.count;
      const yTop = y2py(val), bh = Math.max(0, BASE - yTop);
      const isSel = i === selBin;
      if (isSel) {
        k.push(s('rect', { x: xL, y: TOP, width: bw, height: BASE - TOP, fill: b.color, 'fill-opacity': 0.06 }));
      }
      k.push(s('rect', {
        x: xL, y: yTop, width: bw, height: bh,
        fill: b.color, 'fill-opacity': isSel ? 0.82 : 0.62,
        stroke: isSel ? C.ink : C.bg, 'stroke-width': isSel ? 2.2 : 1.6,
        style: 'cursor:pointer'
      }));
      const topTxt = isDens ? `${fmt(b.share)}%` : `${b.count}`;
      k.push(s('text', {
        x: (xL + xR) / 2, y: Math.max(TOP + 12, yTop - 7),
        fill: b.color, 'font-size': 13 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, topTxt));
      if (bw > 56 * F && bh > 28) {
        k.push(s('text', {
          x: (xL + xR) / 2, y: yTop + bh / 2 + 5,
          fill: C.bg, 'font-size': 11.5 * F, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, isDens ? `area ${fmt(b.share)}%` : `${b.count} visits`));
      }
    });

    // Mode pill inside top-right corner of chart
    const mCol = isDens ? C.green : C.pink;
    const mTxt = isDens ? 'DENSITY: AREA = SHARE' : 'COUNT: WIDE BARS MISLEAD';
    const mw = (isDens ? 174 : 196) * F;
    k.push(
      s('rect', { x: X1 - mw, y: TOP - 2, width: mw, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: mCol, 'stroke-width': 1.4 }),
      s('text', { x: X1 - mw / 2, y: TOP + 13 * F, fill: mCol, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, mTxt));

    // X-axis and ticks
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));
    const ticks = [0, b1, b2, MAX_M];
    ticks.forEach(m => {
      const x = min2x(m);
      k.push(
        s('line', { x1: x, x2: x, y1: BASE, y2: BASE + 6, stroke: C.muted, 'stroke-width': 1.5 }),
        s('text', { x, y: BASE + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, m));
    });
    k.push(s('text', { x: X1, y: BASE + 39, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'minutes'));

    // Draggable border lines and handles (draw selected border on top)
    const borders = [
      { idx: 0, val: b1, label: `◀ ${b1} ▶` },
      { idx: 1, val: b2, label: `◀ ${b2} ▶` }
    ];
    borders.sort((a, b) => (a.idx === selBorder ? 1 : -1) - (b.idx === selBorder ? 1 : -1));
    borders.forEach(bd => {
      const x = min2x(bd.val), isSel = bd.idx === selBorder;
      const col = isSel ? C.amber : C.cyan;
      const pw = 56 * F, ph = 22 * F;
      const px = Math.max(X0 + pw / 2, Math.min(X1 - pw / 2, x));
      k.push(
        s('line', { x1: x, x2: x, y1: DOT_TOP - 8, y2: BASE, stroke: col, 'stroke-width': isSel ? 2.4 : 1.6, 'stroke-dasharray': '5 4', style: 'cursor:ew-resize' }),
        s('rect', { x: px - pw / 2, y: HANDLE_Y - ph / 2, width: pw, height: ph, rx: ph / 2, fill: C.bg, stroke: col, 'stroke-width': isSel ? 2.2 : 1.5, style: 'cursor:ew-resize' }),
        s('text', { x: px, y: HANDLE_Y + 4.5, fill: col, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'cursor:ew-resize;user-select:none' }, bd.label));
    });

    // Place visit dots in top strip
    const rDot = NARROW ? 5.0 : 4.8;
    const order = v.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
    const rowsLastX = [];
    dotCoords = [];
    order.forEach(({ val, idx }) => {
      const x = min2x(val);
      let row = 0;
      while (row < 3 && rowsLastX[row] != null && x - rowsLastX[row] < rDot * 2.15) row++;
      rowsLastX[row] = x;
      const y = DOT_BOT - 6 - row * (rDot * 2.2);
      dotCoords.push({ idx, x, y, val });
    });
    dotCoords.forEach(dc => {
      const bIdx = dc.val < b1 ? 0 : dc.val < b2 ? 1 : 2;
      const col = BIN_COLS[bIdx];
      k.push(s('circle', {
        cx: dc.x, cy: dc.y, r: rDot,
        fill: col, 'fill-opacity': bIdx === selBin ? 0.96 : 0.72,
        stroke: C.bg, 'stroke-width': 1, style: 'cursor:grab'
      }));
    });

    svg.replaceChildren(...k);

    // Button states & labels
    btnDensity.classList.toggle('go', isDens);
    btnCount.classList.toggle('go', !isDens);
    borderLabel.textContent = `Selected: Border ${selBorder + 1} (${selBorder === 0 ? b1 : b2} min)`;

    // Formula box
    const sb = bins[selBin];
    const totalArea = bins.reduce((acc, b) => acc + b.density * b.width, 0);
    if (isDens) {
      fbox(box, [
        [`bin ${sb.a}–${sb.b} (${sb.width} min) · ${sb.count} of ${v.length}`, sb.color],
        `share   = ${fmt(sb.share)}%`,
        [`density = ${fmt(sb.share)}% ÷ ${sb.width} = ${fmt(sb.density)}%/min`, C.amber],
        [`all areas = ${bins.map(b => fmt(b.share) + '%').join(' + ')} = ${Math.round(totalArea)}%`, C.green],
      ]);
      note.textContent = 'Density mode: each bar’s shaded area equals its exact share of visits, no matter how wide the bin is. Tap any bar to inspect it.';
    } else {
      const areas = bins.map(b => b.count * b.width);
      const sumA = areas.reduce((a, b) => a + b, 0) || 1;
      const visShare = (areas[selBin] / sumA) * 100;
      fbox(box, [
        [`bin ${sb.a}–${sb.b} (${sb.width} min) · ${sb.count} of ${v.length}`, sb.color],
        `true share   = ${fmt(sb.share)}%`,
        [`shaded space = ${fmt(visShare)}% of chart!`, C.pink],
        ['height = count (wide bins look too big)', C.muted],
      ]);
      note.textContent = 'Count mode: bar height ignores bin width, so wider bins steal far more shaded space than their true share.';
    }

    chal.update({ mode, sawCount, b1, b2, isRandom, movedOnRandom, bins, maxVal });
  }

  draw();
  return () => {};
}

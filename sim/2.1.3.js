// 2.1.3 Try it: histograms and bin width.
// The learner changes bin width, drags visit dots across bin borders (or uses -1 / +1),
// taps bins to inspect them, creates random library days, and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [5, 8, 10, 10, 12, 15, 15, 20, 25, 30, 30, 35, 40, 45, 50, 55, 60, 60, 75, 85, 90, 90, 95, 160];
  const PRESETS = [5, 10, 15, 20, 40, 60];

  let v = START.slice();
  let w = 20;
  let sel = 7; // starts on the 20-minute visit so the border rule is ready to test
  let selBin = 1;
  let isRandom = false;
  let widthsOnRandom = new Set();

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const widthLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', {
    type: 'range', min: 5, max: 60, step: 5, value: String(w),
    style: { width: '160px', accentColor: C.cyan, cursor: 'pointer' },
    oninput: e => setWidth(+e.target.value)
  });
  const presetBtns = PRESETS.map(pw => btn(`${pw} min`, () => setWidth(pw)));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: grouping visits into bins'),
    h('p', { class: 'sub' }, 'Change the bin width, or drag any dot along the top strip (or tap it and use −1 / +1) to watch it cross a border.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          widthLabel, slider, ...presetBtns),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5', () => bump(-5)), btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)), btn('+5', () => bump(5)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', makeRandom, 'go'),
          btn('Add a visit', () => {
            if (v.length < 40) { v.push(rnd(5, 165)); sel = v.length - 1; selBin = Math.floor(v[sel] / w); draw(); }
          }),
          btn('Remove a visit', () => {
            if (v.length > 4) { v.splice(sel, 1); sel = Math.min(sel, v.length - 1); selBin = Math.floor(v[sel] / w); draw(); }
          }),
          btn('Start again', () => {
            v = START.slice(); w = 20; sel = 7; selBin = 1;
            isRandom = false; widthsOnRandom = new Set();
            slider.value = String(w); draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press −1 (or drag the glowing 20-minute dot left) to move it into the 0–20 bin.',
      check: st => !st.isRandom && st.w === 20 && st.v[7] < 20,
      why: 'Yes! Right on the border (20) goes into 20–40, so dropping it below 20 moves it into 0–20.' },
    { text: 'Change the bin width to 40 minutes. Watch what happens to the small bump at 80–100.',
      check: st => st.w === 40,
      why: 'With 40-minute bins, the main bars step smoothly down (12, 7, 4) and the small bump disappears.' },
    { text: 'Try narrow 5-minute bins. Look at how many empty gaps appear.',
      check: st => st.w === 5,
      why: 'Narrow bins catch mostly 0, 1, or 2 visits each, turning the chart into choppy spikes.' },
    { text: 'Press “New data”, then try at least two different bin widths on the same new data.',
      check: st => st.isRandom && st.randomWidths >= 2,
      why: 'Good habit! Always try a few bin widths—bumps and gaps that stay across reasonable widths are the ones to trust.' },
  ]);

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 38 : 50, X1 = VW - 16;
  const DOT_TOP = 24, DOT_BOT = 92;
  const TOP = 118, BASE = 392;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const maxEdge = () => Math.max(180, Math.ceil((Math.max(...v, 160) + 1) / w) * w);
  const min2x = m => X0 + (m / maxEdge()) * (X1 - X0);
  const x2min = x => Math.max(0, Math.min(179, Math.round(((x - X0) / (X1 - X0)) * maxEdge())));

  function setWidth(nw) {
    w = nw;
    slider.value = String(w);
    if (isRandom) widthsOnRandom.add(w);
    selBin = Math.floor(v[sel] / w);
    draw();
  }

  function bump(d) {
    v[sel] = Math.max(0, Math.min(179, v[sel] + d));
    selBin = Math.floor(v[sel] / w);
    draw();
  }

  function makeRandom() {
    // Generate 24 varied Saturday visits: mostly short/medium plus a secondary cluster or long stay
    const next = [];
    const peak2 = rnd(70, 115);
    for (let i = 0; i < 24; i++) {
      const r = Math.random();
      if (r < 0.50) next.push(rnd(4, 38));
      else if (r < 0.72) next.push(rnd(35, 72));
      else if (r < 0.92) next.push(Math.max(10, Math.min(145, peak2 + rnd(-12, 12))));
      else next.push(rnd(130, 175));
    }
    v = next;
    sel = 0;
    isRandom = true;
    widthsOnRandom = new Set([w]);
    selBin = Math.floor(v[sel] / w);
    draw();
  }

  function computeBins() {
    const mx = maxEdge(), nBins = Math.ceil(mx / w);
    const counts = Array(nBins).fill(0);
    const members = Array.from({ length: nBins }, () => []);
    v.forEach((val, idx) => {
      const b = Math.min(nBins - 1, Math.floor(val / w));
      counts[b]++;
      members[b].push({ val, idx });
    });
    return { mx, nBins, counts, members };
  }

  // Track rendered dot screen coordinates for accurate touch/mouse grabbing
  let dotCoords = [];
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < TOP - 8) {
      let best = -1, bestD = 30 * F;
      dotCoords.forEach(dc => {
        const d = Math.hypot(p.x - dc.x, p.y - dc.y);
        if (d < bestD) { bestD = d; best = dc.idx; }
      });
      if (best >= 0) {
        sel = best; dragging = best;
        selBin = Math.floor(v[sel] / w);
        svg.setPointerCapture(e.pointerId);
        draw();
      }
    } else if (p.y >= TOP - 8 && p.y <= BASE + 16 && p.x >= X0 && p.x <= X1) {
      const { nBins, members } = computeBins();
      const b = Math.max(0, Math.min(nBins - 1, Math.floor(x2min(p.x) / w)));
      selBin = b;
      if (members[b].length) sel = members[b][0].idx;
      draw();
    }
  });

  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    v[dragging] = x2min(p.x);
    selBin = Math.floor(v[dragging] / w);
    draw();
  });

  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const { mx, nBins, counts, members } = computeBins();
    if (selBin >= nBins) selBin = nBins - 1;
    const maxCnt = Math.max(1, ...counts);
    const yStep = maxCnt > 12 ? 4 : maxCnt > 6 ? 2 : 1;
    const yMax = Math.max(4, Math.ceil(maxCnt / yStep) * yStep);
    const y2py = c => BASE - (c / yMax) * (BASE - TOP);
    const k = [];

    // Top dot strip frame
    k.push(
      s('rect', { x: X0, y: DOT_TOP - 8, width: X1 - X0, height: DOT_BOT - DOT_TOP + 12, rx: 10, fill: '#ffffff', 'fill-opacity': 0.03, stroke: C.line }),
      s('text', { x: X0 + 8, y: DOT_TOP + 6, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, 'VISITS (DRAG ANY DOT)'));

    // Faint vertical bin boundaries extending into the dot strip
    for (let b = 0; b <= nBins; b++) {
      const x = min2x(b * w);
      k.push(s('line', { x1: x, x2: x, y1: DOT_TOP - 8, y2: BASE, stroke: C.line, 'stroke-dasharray': b === 0 || b === nBins ? null : '4 5', 'stroke-opacity': w <= 5 ? 0.45 : 0.85 }));
    }

    // Horizontal y-axis gridlines and count ticks
    for (let g = 0; g <= yMax; g += yStep) {
      const y = y2py(g);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    }
    k.push(s('text', { x: X0 - 6, y: TOP - 10, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'visits'));

    // Histogram bars (touching side by side)
    for (let b = 0; b < nBins; b++) {
      const cnt = counts[b];
      const xL = min2x(b * w), xR = min2x((b + 1) * w), bw = xR - xL;
      const isSel = b === selBin;
      if (isSel) {
        k.push(s('rect', { x: xL, y: TOP, width: bw, height: BASE - TOP, fill: C.amber, 'fill-opacity': 0.06 }));
      }
      if (cnt > 0) {
        const yTop = y2py(cnt), bh = BASE - yTop;
        const col = isSel ? C.amber : C.cyan;
        k.push(s('rect', {
          x: xL, y: yTop, width: bw, height: bh,
          fill: col, 'fill-opacity': isSel ? 0.84 : 0.72,
          stroke: C.bg, 'stroke-width': w <= 5 ? 0.9 : 1.8
        }));
        if (w >= 10 || isSel) {
          k.push(s('text', {
            x: (xL + xR) / 2, y: yTop - 6, fill: col,
            'font-size': (w <= 10 ? 11 : 14) * F, 'font-weight': 700,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, cnt));
        }
      }
    }

    // X-axis line and non-overlapping tick labels
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));
    const tickStep = w >= 40 ? w : (NARROW ? 40 : 20);
    for (let m = 0; m <= mx; m += tickStep) {
      const x = min2x(m);
      k.push(
        s('line', { x1: x, x2: x, y1: BASE, y2: BASE + 6, stroke: C.muted, 'stroke-width': 1.5 }),
        s('text', { x, y: BASE + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, m));
    }
    k.push(s('text', { x: X1, y: BASE + 38, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'minutes'));

    // Place dots cleanly in the top strip (stacking horizontally close values)
    const rDot = (NARROW ? 5.5 : 5.2);
    const order = v.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
    const rowsLastX = [];
    dotCoords = [];
    order.forEach(({ val, idx }) => {
      const x = min2x(val);
      let row = 0;
      while (row < 4 && rowsLastX[row] != null && x - rowsLastX[row] < rDot * 2.15) row++;
      rowsLastX[row] = x;
      const y = DOT_BOT - 8 - row * (rDot * 2.25);
      dotCoords.push({ idx, x, y, val });
    });

    // Draw unselected dots first, then selected dot on top
    dotCoords.filter(d => d.idx !== sel).forEach(dc => {
      const inSelBin = Math.floor(dc.val / w) === selBin;
      k.push(s('circle', {
        cx: dc.x, cy: dc.y, r: rDot,
        fill: inSelBin ? C.amber : C.cyan, 'fill-opacity': inSelBin ? 0.9 : 0.85,
        stroke: C.bg, 'stroke-width': 1, style: 'cursor:grab'
      }));
    });
    const sd = dotCoords.find(d => d.idx === sel);
    if (sd) {
      k.push(
        s('circle', { cx: sd.x, cy: sd.y, r: rDot + 4.5, fill: C.amber, 'fill-opacity': 0.22, stroke: C.amber, 'stroke-width': 1.5 }),
        s('circle', { cx: sd.x, cy: sd.y, r: rDot + 1, fill: C.amber, stroke: C.bg, 'stroke-width': 1.2, style: 'cursor:grab' }),
        s('text', { x: Math.max(X0 + 18, Math.min(X1 - 18, sd.x)), y: DOT_TOP + 6, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${sd.val} min`));
    }

    svg.replaceChildren(...k);

    // Update active preset buttons and labels
    presetBtns.forEach((b, i) => b.classList.toggle('go', PRESETS[i] === w));
    widthLabel.textContent = `Bin width: ${w} min`;
    const sbL = selBin * w, sbR = (selBin + 1) * w;
    selLabel.textContent = `Selected: visit #${sel + 1} (${v[sel]} min → ${Math.floor(v[sel] / w) * w}–${(Math.floor(v[sel] / w) + 1) * w})`;

    // Formula / live readout box
    const tallestIdx = counts.indexOf(maxCnt);
    const binVals = members[selBin].map(m => m.val).sort((a, b) => a - b);
    const valStr = binVals.length ? (binVals.length <= 10 ? binVals.join(', ') : `${binVals.slice(0, 9).join(', ')}, …`) : 'empty';
    const emptyCount = counts.filter(c => c === 0).length;
    fbox(box, [
      [`bin width = ${w} min  (${nBins} bins)`, C.cyan],
      `visits    = ${v.length}   (empty bins: ${emptyCount})`,
      [`tallest   = ${tallestIdx * w}–${(tallestIdx + 1) * w} min (${maxCnt})`, C.green],
      [`bin ${sbL}–${sbR}: ${counts[selBin]}  [${valStr}]`, C.amber]
    ]);

    note.textContent = w <= 5
      ? 'Very narrow bins: most catch 0, 1, or 2 visits, turning the chart into choppy spikes.'
      : w >= 40
        ? 'Wide bins: bars look smooth, which can hide smaller bumps inside a wider range.'
        : 'Equal bin widths: bar height shows the exact count. A visit right on a border goes into the bin on the right.';

    chal.update({ v, w, counts, isRandom, randomWidths: widthsOnRandom.size });
  }

  draw();
  return () => {};
}

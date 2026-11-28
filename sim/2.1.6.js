// 2.1.6 Try it: Box plots — drag Saturday visits, watch quartiles, fences, whiskers, and outliers update live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Exact 24 Saturday visits from chapters/2.1.md (borrow: cyan, computer: violet, study: amber, event: pink)
  const START = [
    [5, C.cyan], [8, C.cyan], [10, C.cyan], [10, C.cyan], [12, C.cyan], [15, C.cyan], [15, C.cyan],
    [20, C.violet], [25, C.violet], [30, C.violet], [30, C.violet], [35, C.violet],
    [40, C.amber], [45, C.amber], [50, C.amber], [55, C.amber], [60, C.amber], [60, C.amber], [75, C.amber],
    [85, C.pink], [90, C.amber], [90, C.pink], [95, C.pink], [160, C.amber],
  ];
  // One-hump dataset with the EXACT same quartiles (15, 37.5, 67.5), whiskers (5, 95), and outlier (160)
  const ONE_HUMP = [
    5, 8, 9, 10, 10, 10, 20, 24, 28, 30, 32, 36,
    39, 42, 46, 50, 54, 59, 76, 77, 78, 79, 95, 160,
  ].map(v => [v, C.violet]);

  let visits = START.map(d => d.slice());
  let sel = 23; // start with the 160-minute outlier selected
  let showFences = true, showBars = false;
  let dragged = false, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 410' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const fenceBtn = btn('Hide fences', () => { showFences = !showFences; fenceBtn.textContent = showFences ? 'Hide fences' : 'Show fences'; draw(); });
  const barsBtn = btn('Show bars', () => { showBars = !showBars; barsBtn.textContent = showBars ? 'Hide bars' : 'Show bars'; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: build the box plot'),
    h('p', { class: 'sub' }, 'Each dot is one library visit (in minutes). Drag any dot left or right, or tap it and use the nudge buttons.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5', () => bump(-5)), btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)), btn('+5', () => bump(5)), selLabel),
        h('div', { class: 'sim-row' },
          fenceBtn,
          barsBtn,
          btn('Same box, 1 hump', () => {
            visits = ONE_HUMP.map(d => d.slice());
            showBars = true; barsBtn.textContent = 'Hide bars';
            sel = 23; draw();
          }),
          btn('New data (random)', () => {
            visits = makeRandom();
            randomCount++; sel = visits.length - 1; draw();
          }, 'go'),
          btn('Start again', () => {
            visits = START.map(d => d.slice());
            sel = 23; draw();
          }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function makeRandom() {
    const out = [];
    const cols = [C.cyan, C.violet, C.amber, C.pink];
    for (let i = 0; i < 23; i++) {
      const v = i < 9 ? rnd(5, 35) : i < 18 ? rnd(25, 75) : rnd(60, 110);
      out.push([v, cols[i < 7 ? 0 : i < 12 ? 1 : i < 20 ? 2 : 3]]);
    }
    // Sometimes include a long standout visit
    out.push([rnd(0, 1) ? rnd(135, 178) : rnd(75, 115), C.amber]);
    return out;
  }

  function median(a) {
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  function stats() {
    const vals = visits.map(d => d[0]).sort((a, b) => a - b);
    const n = vals.length, half = Math.floor(n / 2);
    const q1 = median(vals.slice(0, half));
    const med = median(vals);
    const q3 = median(vals.slice(n - half));
    const iqr = q3 - q1;
    const loFence = q1 - 1.5 * iqr;
    const hiFence = q3 + 1.5 * iqr;
    const inside = vals.filter(v => v >= loFence && v <= hiFence);
    const wLo = inside.length ? inside[0] : vals[0];
    const wHi = inside.length ? inside[inside.length - 1] : vals[n - 1];
    const outliers = vals.filter(v => v < loFence || v > hiFence);
    const hiOutliers = vals.filter(v => v > hiFence).length;
    return { vals, n, q1, med, q3, iqr, loFence, hiFence, wLo, wHi, outliers, hiOutliers };
  }

  const chal = challenges(ch, [
    { text: 'Drag the 160-minute outlier left until it falls inside the upper fence.',
      check: st => st.dragged && st.outliers.length === 0,
      why: 'Once a visit moves inside the upper fence, it stops being an outlier and the right whisker reaches out to it.' },
    { text: 'Pull visits past the upper fence so there are at least 2 outliers at once.',
      check: st => st.hiOutliers >= 2,
      why: 'Every visit past a fence gets its own dot, while the whisker stops at the last visit still inside.' },
    { text: 'Shrink the box so the interquartile range (IQR) is under 35 minutes.',
      check: st => st.iqr < 35,
      why: 'Bringing the middle half closer together shrinks the box—and pulls the fences closer in too.' },
    { text: 'Press “New data (random)” twice and watch the box and fences rebuild each time.',
      check: st => st.randomCount >= 2,
      why: 'The same steps—quartiles, IQR, and fences 1.5 box widths out—summarize any set of visits.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 24 : 38, X1 = VW - (NARROW ? 18 : 26), BASE = 352;
  const BOX_Y = 92, BOX_H = 54, DOT_BASE = 336;
  svg.setAttribute('viewBox', `0 0 ${VW} 410`);
  const n2x = v => X0 + (v / 180) * (X1 - X0);
  const x2n = x => Math.max(0, Math.min(180, Math.round(((x - X0) / (X1 - X0)) * 180)));

  let dotPos = [];
  function bump(d) {
    visits[sel][0] = Math.max(0, Math.min(180, visits[sel][0] + d));
    dragged = true;
    draw();
  }

  // Pointer drag: pick closest dot, drag horizontally along 0..180 minutes
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bestD = 34 * F;
    dotPos.forEach((pt, i) => {
      const d = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const nv = x2n(p.x);
    if (nv !== visits[dragging][0]) {
      visits[dragging][0] = nv;
      dragged = true;
      draw();
    }
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const st = stats();
    const k = [];
    const step = NARROW ? 30 : 20;

    // Grid & minutes axis
    for (let v = 0; v <= 180; v += step) {
      const x = n2x(v);
      k.push(
        s('line', { x1: x, x2: x, y1: 24, y2: BASE, stroke: C.line, 'stroke-width': 1 }),
        s('text', { x, y: BASE + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v)
      );
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
      s('text', { x: X1, y: BASE + 44, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial' }, 'minutes')
    );

    // Optional 20-minute histogram bars (ties directly to Trap 1!)
    if (showBars) {
      const bins = Array(9).fill(0);
      visits.forEach(([v]) => { const b = Math.min(8, Math.floor(v / 20)); bins[b]++; });
      const mx = Math.max(7, ...bins);
      const bw = (n2x(20) - n2x(0)) - 3;
      bins.forEach((cnt, b) => {
        if (!cnt) return;
        const bh = (cnt / mx) * 140;
        k.push(s('rect', {
          x: n2x(b * 20) + 1.5, y: BASE - bh, width: bw, height: bh,
          fill: C.violet, 'fill-opacity': 0.24, stroke: C.violet, 'stroke-opacity': 0.55, rx: 3
        }));
      });
    }

    // Fences (1.5 × IQR)
    if (showFences) {
      if (st.hiFence <= 180) {
        const fx = n2x(st.hiFence);
        k.push(
          s('line', { x1: fx, x2: fx, y1: 30, y2: BASE, stroke: C.pink, 'stroke-width': 2, 'stroke-dasharray': '7 6' }),
          s('text', { x: Math.min(X1 - 4, fx), y: 22, fill: C.pink, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': fx > X1 - 55 ? 'end' : 'middle', 'font-family': 'Consolas' }, `fence ${fmt(st.hiFence)}`)
        );
      } else {
        k.push(s('text', { x: X1 - 4, y: 22, fill: C.pink, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `upper fence ${fmt(st.hiFence)} →`));
      }
      if (st.loFence >= 0) {
        const fx = n2x(st.loFence);
        k.push(
          s('line', { x1: fx, x2: fx, y1: 30, y2: BASE, stroke: C.pink, 'stroke-width': 2, 'stroke-dasharray': '7 6' }),
          s('text', { x: Math.max(X0 + 4, fx), y: 22, fill: C.pink, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': fx < X0 + 55 ? 'start' : 'middle', 'font-family': 'Consolas' }, `fence ${fmt(st.loFence)}`)
        );
      } else {
        k.push(s('text', { x: X0 + 2, y: 22, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, `← lower fence ${fmt(st.loFence)}`));
      }
    }

    // Box plot: whiskers, box, median line, outlier dots
    const xWL = n2x(st.wLo), xQ1 = n2x(st.q1), xMed = n2x(st.med), xQ3 = n2x(st.q3), xWH = n2x(st.wHi);
    k.push(
      s('line', { x1: xWL, x2: xQ1, y1: BOX_Y, y2: BOX_Y, stroke: C.cyan, 'stroke-width': 3 }),
      s('line', { x1: xWL, x2: xWL, y1: BOX_Y - 16, y2: BOX_Y + 16, stroke: C.cyan, 'stroke-width': 3 }),
      s('line', { x1: xQ3, x2: xWH, y1: BOX_Y, y2: BOX_Y, stroke: C.cyan, 'stroke-width': 3 }),
      s('line', { x1: xWH, x2: xWH, y1: BOX_Y - 16, y2: BOX_Y + 16, stroke: C.cyan, 'stroke-width': 3 }),
      s('rect', { x: xQ1, y: BOX_Y - BOX_H / 2, width: Math.max(2, xQ3 - xQ1), height: BOX_H, fill: C.cyan, 'fill-opacity': 0.22, stroke: C.cyan, 'stroke-width': 3, rx: 3 }),
      s('line', { x1: xMed, x2: xMed, y1: BOX_Y - BOX_H / 2, y2: BOX_Y + BOX_H / 2, stroke: C.amber, 'stroke-width': 4 })
    );

    // Quartile & whisker labels
    const q3Shift = (xQ3 - xMed) < 34 * F ? 14 : 0;
    const q1Shift = (xMed - xQ1) < 34 * F ? -14 : 0;
    k.push(
      s('text', { x: xQ1 + q1Shift, y: BOX_Y - BOX_H / 2 - 8, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(st.q1)),
      s('text', { x: xMed, y: BOX_Y - BOX_H / 2 - 22, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(st.med)),
      s('text', { x: xQ3 + q3Shift, y: BOX_Y - BOX_H / 2 - 8, fill: C.violet, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(st.q3)),
      s('text', { x: xWL, y: BOX_Y + 34, fill: C.green, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(st.wLo)),
      s('text', { x: xWH, y: BOX_Y + 34, fill: C.green, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(st.wHi))
    );

    // IQR span under box
    const iqrY = BOX_Y + BOX_H / 2 + 26;
    if (xQ3 - xQ1 > 12) {
      k.push(
        s('line', { x1: xQ1, x2: xQ3, y1: iqrY, y2: iqrY, stroke: C.amber, 'stroke-width': 2 }),
        s('text', { x: (xQ1 + xQ3) / 2, y: iqrY + 16, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `IQR ${fmt(st.iqr)}`)
      );
    }

    // Outlier dots on the box-plot line
    st.outliers.forEach(ov => {
      const ox = n2x(ov);
      k.push(
        s('circle', { cx: ox, cy: BOX_Y, r: 12, fill: C.pink, 'fill-opacity': 0.2 }),
        s('circle', { cx: ox, cy: BOX_Y, r: 5.5, fill: C.pink }),
        s('text', { x: ox, y: BOX_Y - 14, fill: C.pink, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(ov))
      );
    });

    // 24 draggable visit dots (stacked cleanly when close in minutes)
    const buckets = new Map();
    dotPos = visits.map(([v, col], i) => {
      const key = Math.round(v / 3);
      const lvl = buckets.get(key) || 0;
      buckets.set(key, lvl + 1);
      const x = n2x(v), y = DOT_BASE - lvl * (18 * F);
      const isOut = v < st.loFence || v > st.hiFence;
      const fill = isOut ? C.pink : col;
      if (i === sel) {
        k.push(s('circle', { cx: x, cy: y, r: 14 * F, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      }
      k.push(
        s('circle', { cx: x, cy: y, r: 11 * F, fill, 'fill-opacity': 0.2 }),
        s('circle', { cx: x, cy: y, r: 5.8 * F, fill, style: 'cursor:grab' })
      );
      return { x, y };
    });

    svg.replaceChildren(...k);

    // Live formula box
    const outText = st.outliers.length ? `${st.outliers.length} (${st.outliers.map(fmt).join(', ')})` : 'none';
    fbox(box, [
      [`Q1 = ${fmt(st.q1)}   med = ${fmt(st.med)}   Q3 = ${fmt(st.q3)}`, C.cyan],
      [`IQR = ${fmt(st.q3)} − ${fmt(st.q1)} = ${fmt(st.iqr)} min`, C.amber],
      `1.5 × IQR = ${fmt(1.5 * st.iqr)} min`,
      [`fences: ${fmt(st.loFence)}  to  ${fmt(st.hiFence)}`, C.pink],
      [`whiskers: ${fmt(st.wLo)} to ${fmt(st.wHi)}   outliers: ${outText}`, C.green],
    ]);

    const selVal = visits[sel][0];
    const selOut = selVal < st.loFence || selVal > st.hiFence;
    selLabel.textContent = `Selected: visit #${sel + 1} (${selVal} min${selOut ? ' · outlier' : ''})`;
    note.textContent = showBars
      ? 'Compare the bars and the box plot: different shapes can share the exact same box, whiskers, and outlier.'
      : 'Drag any dot along the line. Watch how moving outer dots only moves a whisker—or crosses a fence to become an outlier.';

    chal.update({ ...st, dragged, randomCount });
  }

  draw();
  return () => {};
}

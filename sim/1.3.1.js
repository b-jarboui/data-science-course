// 1.3.1 Try it: range and interquartile range.
// Drag any parcel dot along the days line (or tap one and use -1 / +1), add a 21-day delay,
// generate random weeks, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [3, 4, 4, 5, 6, 6, 7];
  let v = START.slice(), sel = 6, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 390' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: full span and middle spread'),
    h('p', { class: 'sub' }, 'Each dot is one coffee parcel on a line marked in days. Drag a dot left or right, or tap it and use −1 / +1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 day', () => bump(-1)), btn('+1 day', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Make slowest 21 days', () => {
            const mx = Math.max(...v), idx = v.lastIndexOf(mx);
            v[idx] = 21; sel = idx; draw();
          }, 'go'),
          btn('New week (random)', () => {
            v = v.map(() => rnd(2, 12)).sort((a, b) => a - b);
            randomCount++; sel = 0; draw();
          }),
          btn('Add a parcel', () => {
            if (v.length < 10) { v.push(rnd(2, 10)); sel = v.length - 1; draw(); }
          }),
          btn('Remove a parcel', () => {
            if (v.length > 4) { v.pop(); sel = Math.min(sel, v.length - 1); draw(); }
          }),
          btn('Start again', () => { v = START.slice(); sel = 6; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const med = arr => {
    const m = arr.length;
    return m % 2 === 1 ? arr[(m - 1) / 2] : (arr[m / 2 - 1] + arr[m / 2]) / 2;
  };
  function stats() {
    const sorted = v.slice().sort((a, b) => a - b), n = sorted.length;
    const mid = med(sorted);
    const lower = n % 2 === 1 ? sorted.slice(0, (n - 1) / 2) : sorted.slice(0, n / 2);
    const upper = n % 2 === 1 ? sorted.slice((n + 1) / 2) : sorted.slice(n / 2);
    const q1 = med(lower), q3 = med(upper);
    const min = sorted[0], max = sorted[n - 1];
    return { sorted, n, mid, lower, upper, q1, q3, min, max, range: max - min, iqr: q3 - q1 };
  }

  const chal = challenges(ch, [
    { text: 'Drag the slowest parcel (or tap +1 day) until the range is 10 days.',
      check: st => st.range === 10,
      why: 'Nice! The gap from the fastest parcel to the slowest is now 10 days.' },
    { text: 'Press “Make slowest 21 days”. Watch the range jump while the interquartile range stays calm.',
      check: st => st.max === 21 && st.range >= 14 && st.iqr <= 4,
      why: 'Right: one very late parcel stretched the range way out, while the middle spread barely noticed.' },
    { text: 'Move the parcels so the range is at least 12 days, but the interquartile range is 0 days.',
      check: st => st.range >= 12 && st.iqr === 0,
      why: 'Yes! When the middle parcels all tie on the same day, the interquartile range is 0 even with far-apart ends.' },
    { text: 'Press “New week (random)” twice. Is the interquartile range always less than or equal to the range?',
      check: st => st.randomCount >= 2,
      why: 'Always. The middle stretch sits inside the full span, so the interquartile range can never beat the range.' },
  ]);

  // Geometry: responsive phone/laptop SVG coordinates
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 390, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 28 : 44, X1 = VW - (NARROW ? 20 : 34);
  const AXIS_Y = 205, IQR_Y = 268, RNG_Y = 330;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  let dragging = -1, dragMax = 0, dotPts = [];
  const axisMax = () => dragMax || (Math.max(...v) > 10 ? 24 : 12);
  const d2x = d => X0 + (d / axisMax()) * (X1 - X0);
  const x2d = x => Math.max(1, Math.min(24, Math.round(((x - X0) / (X1 - X0)) * axisMax())));
  const clampX = (x, pad) => Math.max(X0 + pad, Math.min(X1 - pad, x));

  function bump(d) {
    v[sel] = Math.max(1, Math.min(24, v[sel] + d));
    draw();
  }

  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bestD = 34 * F;
    dotPts.forEach((pt, i) => {
      const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (dist < bestD) { bestD = dist; best = i; }
    });
    if (best < 0) return;
    sel = best; dragging = best; dragMax = axisMax();
    svg.setPointerCapture(e.pointerId);
    draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const next = x2d(p.x);
    if (next !== v[dragging]) { v[dragging] = next; draw(); }
  });
  const endDrag = () => {
    if (dragging >= 0) { dragging = -1; dragMax = 0; draw(); }
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  function draw() {
    const st = stats(), mx = axisMax(), k = [];
    const step = mx <= 12 ? 1 : 4;
    const outlier = st.max >= 15;
    const rngCol = outlier ? C.pink : C.amber;

    // Grid & ticks
    for (let d = 0; d <= mx; d += step) {
      const x = d2x(d);
      k.push(
        s('line', { x1: x, x2: x, y1: 58, y2: AXIS_Y + 6, stroke: C.line, 'stroke-width': 1 }),
        s('text', { x, y: AXIS_Y + 24, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, d)
      );
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2.5 }),
      s('text', { x: X1, y: AXIS_Y + 42, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }, 'days')
    );

    // Green middle band + quartile vertical lines
    const xq1 = d2x(st.q1), xq3 = d2x(st.q3), xm = d2x(st.mid);
    if (xq3 > xq1) {
      k.push(s('rect', { x: xq1, y: 66, width: xq3 - xq1, height: AXIS_Y - 66, fill: C.green, 'fill-opacity': 0.12, rx: 4 }));
    }
    k.push(
      s('line', { x1: xm, x2: xm, y1: 72, y2: AXIS_Y, stroke: C.violet, 'stroke-width': 2, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.7 }),
      s('line', { x1: xq1, x2: xq1, y1: 54, y2: IQR_Y, stroke: C.green, 'stroke-width': 2.2, 'stroke-dasharray': '6 5' }),
      s('line', { x1: xq3, x2: xq3, y1: 54, y2: IQR_Y, stroke: C.green, 'stroke-width': 2.2, 'stroke-dasharray': '6 5' })
    );

    // Quartile labels (auto-avoid collision when close or tied)
    if (st.q1 === st.q3) {
      k.push(s('text', { x: clampX(xq1, 68 * F), y: 42, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `lower = upper = ${fmt(st.q1)}`));
    } else if (xq3 - xq1 < 95 * F) {
      k.push(
        s('text', { x: Math.max(X0 + 4, xq1 - 6), y: 42, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `lower ${fmt(st.q1)}`),
        s('text', { x: Math.min(X1 - 4, xq3 + 6), y: 42, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'start', 'font-family': 'Consolas' }, `upper ${fmt(st.q3)}`)
      );
    } else {
      k.push(
        s('text', { x: clampX(xq1, 36 * F), y: 42, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `lower ${fmt(st.q1)}`),
        s('text', { x: clampX(xq3, 36 * F), y: 42, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `upper ${fmt(st.q3)}`)
      );
    }

    // Parcel dots (stacked for ties)
    const counts = {}, r = NARROW ? 10.5 : 10, gap = NARROW ? 25 : 24;
    dotPts = v.map((val, i) => {
      const lvl = counts[val] || 0;
      counts[val] = lvl + 1;
      return { x: d2x(val), y: AXIS_Y - 24 - lvl * gap, val, i };
    });
    dotPts.forEach(pt => {
      const col = pt.val >= 15 ? C.pink : C.cyan;
      if (pt.i === sel) {
        k.push(s('circle', { cx: pt.x, cy: pt.y, r: r + 8, fill: 'none', stroke: C.amber, 'stroke-width': 2.5 }));
      }
      k.push(
        s('circle', { cx: pt.x, cy: pt.y, r: r + 5, fill: col, 'fill-opacity': 0.18 }),
        s('circle', { cx: pt.x, cy: pt.y, r, fill: col, style: { cursor: 'grab' } })
      );
    });
    // Column numbers above stacks
    Object.entries(counts).forEach(([valStr, cnt]) => {
      const val = Number(valStr), col = val >= 15 ? C.pink : C.cyan;
      k.push(s('text', { x: d2x(val), y: AXIS_Y - 24 - (cnt - 1) * gap - 18, fill: col, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, val));
    });

    // Interquartile range bar (green)
    const iqrMid = clampX((xq1 + xq3) / 2, 95 * F);
    k.push(
      s('line', { x1: xq1, x2: xq3, y1: IQR_Y, y2: IQR_Y, stroke: C.green, 'stroke-width': 4 }),
      s('line', { x1: xq1, x2: xq1, y1: IQR_Y - 8, y2: IQR_Y + 8, stroke: C.green, 'stroke-width': 3 }),
      s('line', { x1: xq3, x2: xq3, y1: IQR_Y - 8, y2: IQR_Y + 8, stroke: C.green, 'stroke-width': 3 }),
      s('text', { x: iqrMid, y: IQR_Y + 23, fill: C.green, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `interquartile range = ${fmt(st.iqr)} days`)
    );

    // Range bar (amber / pink)
    const xmin = d2x(st.min), xmax = d2x(st.max), rngMid = clampX((xmin + xmax) / 2, 72 * F);
    k.push(
      s('line', { x1: xmin, x2: xmin, y1: AXIS_Y, y2: RNG_Y, stroke: rngCol, 'stroke-width': 1.5, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.55 }),
      s('line', { x1: xmax, x2: xmax, y1: AXIS_Y, y2: RNG_Y, stroke: rngCol, 'stroke-width': 1.5, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.55 }),
      s('line', { x1: xmin, x2: xmax, y1: RNG_Y, y2: RNG_Y, stroke: rngCol, 'stroke-width': 4 }),
      s('line', { x1: xmin, x2: xmin, y1: RNG_Y - 8, y2: RNG_Y + 8, stroke: rngCol, 'stroke-width': 3 }),
      s('line', { x1: xmax, x2: xmax, y1: RNG_Y - 8, y2: RNG_Y + 8, stroke: rngCol, 'stroke-width': 3 }),
      s('text', { x: rngMid, y: RNG_Y + 23, fill: rngCol, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `range = ${fmt(st.range)} days`)
    );

    svg.replaceChildren(...k);

    fbox(box, [
      `sorted: ${st.sorted.join(', ')}`,
      `lower half: ${st.lower.join(', ')} → lower = ${fmt(st.q1)}`,
      `upper half: ${st.upper.join(', ')} → upper = ${fmt(st.q3)}`,
      [`range = ${fmt(st.max)} − ${fmt(st.min)} = ${fmt(st.range)} days`, rngCol],
      [`interquartile range = ${fmt(st.q3)} − ${fmt(st.q1)} = ${fmt(st.iqr)} days`, C.green],
    ]);
    note.textContent = st.n % 2 === 1
      ? `Odd count (${st.n}): leave out the center value (${fmt(st.mid)}) so both halves have ${st.lower.length} parcels.`
      : `Even count (${st.n}): split straight down the middle so both halves have ${st.lower.length} parcels.`;
    selLabel.textContent = `Selected: parcel ${sel + 1} (${v[sel]} days)`;
    chal.update({ ...st, randomCount });
  }

  draw();
  return () => {};
}

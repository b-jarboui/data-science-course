// 1.3.8 Try it: Sensitivity to extremes.
// Drag any parcel dot along the days line (or tap one and use -1 / +1) to see
// Mean, Range, and Standard Deviation jump while Median, IQR, and MAD stay put.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const NORMAL = [3, 4, 4, 5, 6, 6, 7];
  const LATE = [3, 4, 4, 5, 6, 6, 21];

  let v = NORMAL.slice(), base = NORMAL.slice();
  let sel = 6, isRandom = false;

  const r2 = x => Math.round(x * 100) / 100;
  function medianOf(arr) {
    const m = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2;
  }
  function stats(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const med = medianOf(sorted);
    const min = sorted[0], max = sorted[n - 1];
    const range = max - min;
    const half = Math.floor(n / 2);
    const lo = sorted.slice(0, half);
    const hi = sorted.slice(n % 2 ? half + 1 : half);
    const q1 = medianOf(lo), q3 = medianOf(hi);
    const iqr = q3 - q1;
    const ss = sorted.reduce((a, x) => a + (x - mean) * (x - mean), 0);
    const sd = Math.sqrt(ss / (n - 1));
    const dists = sorted.map(x => Math.abs(x - med)).sort((a, b) => a - b);
    const mad = medianOf(dists);
    return { sorted, n, sum, mean, med, min, max, range, q1, q3, iqr, sd, mad };
  }

  function makeRandomWeek() {
    let arr, st;
    do {
      const center = rnd(4, 8);
      arr = Array.from({ length: 7 }, () => Math.max(1, Math.min(12, center + rnd(-3, 3)))).sort((a, b) => a - b);
      st = stats(arr);
    } while (st.iqr < 1 || arr[6] - st.med < st.mad || arr[6] === arr[0]);
    v = arr.slice();
    base = arr.slice();
    sel = 6;
    isRandom = true;
    draw();
  }

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 485 : 445, F = NARROW ? 1.15 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: sensitivity to extremes'),
    h('p', { class: 'sub' }, 'Each dot is one coffee parcel in days. Drag any dot left or right (or tap it and use −1 / +1) to see which tools jump and which stay put.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 day', () => bump(-1)),
          btn('+1 day', () => bump(1)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Late week: 21 days', () => { v = LATE.slice(); base = NORMAL.slice(); isRandom = false; sel = 6; draw(); }, 'go'),
          btn('Normal week', () => { v = NORMAL.slice(); base = NORMAL.slice(); isRandom = false; sel = 6; draw(); }),
          btn('New week (random)', makeRandomWeek))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Drag the 7th parcel to 21 days (or tap “Late week: 21 days”). Watch which three tools jump.',
      check: st => !st.isRandom && st.max === 21 && st.med === 5 && Math.abs(st.mean - 7) < 1e-6,
      why: 'Yes! Mean (5 → 7), range (4 → 18), and standard deviation (1.41 → 6.27) all jumped, while median, IQR, and MAD never moved.' },
    { text: 'Pull one parcel high enough to push the mean to at least 8 days, while keeping the median at 5.',
      check: st => st.mean >= 8 && st.med === 5,
      why: 'Nice! One extreme parcel at 28+ days pulls the mean past 8, yet the middle parcel still sits at 5 days.' },
    { text: 'Now move enough parcels to push the median above 6 days.',
      check: st => st.med > 6,
      why: 'Right! One far-off dot cannot budge a resistant tool—you have to shift at least half the parcels.' },
    { text: 'Press “New week (random)”, then drag the last parcel to at least 25 days. Do median, IQR, and MAD stay locked?',
      check: st => st.isRandom && st.max >= 25 && st.med === st.baseMed && st.iqr === st.baseIqr && st.mad === st.baseMad && st.mean > st.baseMean,
      why: 'Every single time! Pulling the farthest parcel always shifts mean, range, and standard deviation while shielding the middle.' }
  ]);

  // Number-line geometry
  const X0 = NARROW ? 24 : 38, X1 = VW - (NARROW ? 24 : 38);
  const LINE_Y = 128;
  const maxAxis = () => Math.max(24, Math.ceil((Math.max(...v) + 1) / 5) * 5);
  const xOf = (val, mx = maxAxis()) => X0 + (val / mx) * (X1 - X0);

  function dotPositions(mx) {
    const counts = new Map();
    return v.map((val, i) => {
      const c = counts.get(val) || 0;
      counts.set(val, c + 1);
      return { i, val, cx: xOf(val, mx), cy: LINE_Y - 18 - c * 22 };
    });
  }

  function bump(d) {
    v[sel] = Math.max(1, Math.min(30, v[sel] + d));
    draw();
  }

  // Drag any dot horizontally along the days line
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > LINE_Y + 34) return;
    const pts = dotPositions(maxAxis());
    let best = -1, bestD = 38;
    for (const pt of pts) {
      const d = Math.hypot(pt.cx - p.x, pt.cy - p.y);
      if (d < bestD) { bestD = d; best = pt.i; }
    }
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e), mx = maxAxis();
    const raw = Math.round(((p.x - X0) / (X1 - X0)) * mx);
    v[dragging] = Math.max(1, Math.min(30, raw));
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const st = stats(v), bs = stats(base);
    const mx = maxAxis();
    const k = [];

    // IQR middle-half shaded band
    const xQ1 = xOf(st.q1, mx), xQ3 = xOf(st.q3, mx);
    k.push(
      s('rect', { x: xQ1, y: 52, width: Math.max(3, xQ3 - xQ1), height: LINE_Y - 52, fill: C.green, 'fill-opacity': 0.13, stroke: C.green, 'stroke-opacity': 0.55, rx: 4 }),
      s('text', { x: (xQ1 + xQ3) / 2, y: 66, fill: C.green, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'IQR')
    );

    // Axis line and ticks
    k.push(s('line', { x1: X0, x2: X1, y1: LINE_Y, y2: LINE_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    for (let t = 0; t <= mx; t += 5) {
      const tx = xOf(t, mx);
      k.push(
        s('line', { x1: tx, x2: tx, y1: LINE_Y - 5, y2: LINE_Y + 5, stroke: C.muted, 'stroke-width': 2 }),
        s('text', { x: tx, y: LINE_Y + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, t)
      );
    }
    k.push(s('text', { x: X1, y: LINE_Y + 34, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end' }, 'days'));

    // Range span bar beneath ticks
    const xMin = xOf(st.min, mx), xMax = xOf(st.max, mx);
    const rCol = st.range > bs.range ? C.pink : C.cyan;
    const ry = LINE_Y + 46;
    k.push(
      s('line', { x1: xMin, x2: xMax, y1: ry, y2: ry, stroke: rCol, 'stroke-width': 3 }),
      s('line', { x1: xMin, x2: xMin, y1: ry - 5, y2: ry + 5, stroke: rCol, 'stroke-width': 2.5 }),
      s('line', { x1: xMax, x2: xMax, y1: ry - 5, y2: ry + 5, stroke: rCol, 'stroke-width': 2.5 }),
      s('text', { x: (xMin + xMax) / 2, y: ry + 16, fill: rCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `range = ${fmt(st.range)} days`)
    );

    // Median & Mean vertical lines with non-overlapping tags
    const xMed = xOf(st.med, mx), xMean = xOf(st.mean, mx);
    const close = Math.abs(xMean - xMed) < 88 * F;
    const medY = 20, meanY = close ? 42 : 20;
    const clampX = x => Math.max(X0 + 48, Math.min(X1 - 48, x));
    k.push(
      s('line', { x1: xMed, x2: xMed, y1: medY + 6, y2: LINE_Y + 4, stroke: C.green, 'stroke-width': 2.5 }),
      s('rect', { x: clampX(xMed) - 44 * F, y: medY - 12, width: 88 * F, height: 20, rx: 10, fill: C.bg, stroke: C.green }),
      s('text', { x: clampX(xMed), y: medY + 2, fill: C.green, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MED ' + fmt(r2(st.med))),

      s('line', { x1: xMean, x2: xMean, y1: meanY + 6, y2: LINE_Y + 4, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }),
      s('rect', { x: clampX(xMean) - 46 * F, y: meanY - 12, width: 92 * F, height: 20, rx: 10, fill: C.bg, stroke: C.amber }),
      s('text', { x: clampX(xMean), y: meanY + 2, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEAN ' + fmt(r2(st.mean)))
    );

    // Parcel dots
    const fenceHi = st.q3 + 1.5 * Math.max(1, st.iqr);
    const fenceLo = st.q1 - 1.5 * Math.max(1, st.iqr);
    const pts = dotPositions(mx);
    for (const pt of pts) {
      const extreme = pt.val > fenceHi || pt.val < fenceLo;
      const col = extreme ? C.pink : C.cyan;
      k.push(
        s('circle', { cx: pt.cx, cy: pt.cy, r: 16, fill: col, 'fill-opacity': 0.18, style: { cursor: 'ew-resize' } }),
        s('circle', { cx: pt.cx, cy: pt.cy, r: 9.5, fill: col, stroke: pt.i === sel ? '#ffffff' : 'none', 'stroke-width': 2.5, style: { cursor: 'ew-resize' } })
      );
      if (pt.i === sel || extreme) {
        k.push(s('text', { x: pt.cx, y: pt.cy - 14, fill: pt.i === sel ? C.ink : C.pink, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, pt.val));
      }
    }

    // Bottom panel: live comparison meters for all 6 tools
    const topY = 210;
    k.push(s('line', { x1: 12, x2: VW - 12, y1: topY - 12, y2: topY - 12, stroke: C.line, 'stroke-width': 1.5 }));
    const colGap = 16, colW = (VW - 24 - colGap) / 2;
    const panels = [
      { title: 'SENSITIVE (reacts)', col: C.pink, x: 12, items: [
        { name: 'Mean', val: st.mean, base: bs.mean, cap: 15 },
        { name: 'Range', val: st.range, base: bs.range, cap: 28 },
        { name: 'Std dev', val: st.sd, base: bs.sd, cap: 11 }
      ] },
      { title: 'RESISTANT (stays put)', col: C.green, x: 12 + colW + colGap, items: [
        { name: 'Median', val: st.med, base: bs.med, cap: 15 },
        { name: 'IQR', val: st.iqr, base: bs.iqr, cap: 15 },
        { name: 'MAD', val: st.mad, base: bs.mad, cap: 10 }
      ] }
    ];

    for (const p of panels) {
      const cardH = VH - topY - 10;
      k.push(
        s('rect', { x: p.x, y: topY, width: colW, height: cardH, rx: 12, fill: C.bg, stroke: p.col, 'stroke-opacity': 0.55 }),
        s('text', { x: p.x + 12, y: topY + 24, fill: p.col, 'font-size': (NARROW ? 12.5 : 14) * F, 'font-weight': 700, 'font-family': 'Consolas' }, p.title)
      );
      const barW = colW - 24;
      p.items.forEach((it, idx) => {
        const y = topY + 54 + idx * (NARROW ? 66 : 58);
        const diff = r2(it.val - it.base);
        const moved = Math.abs(diff) >= 0.01;
        const deltaStr = moved ? ` (${diff > 0 ? '+' : ''}${fmt(diff)})` : ' (same)';
        const fillW = Math.min(barW, Math.max(4, (it.val / it.cap) * barW));
        const baseX = p.x + 12 + Math.min(barW, (it.base / it.cap) * barW);
        k.push(
          s('text', { x: p.x + 12, y, fill: C.ink, 'font-size': 13 * F, 'font-weight': 650 }, it.name),
          s('text', { x: p.x + colW - 12, y, fill: moved ? p.col : C.muted, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(r2(it.val)) + deltaStr),
          s('rect', { x: p.x + 12, y: y + 8, width: barW, height: 12, rx: 6, fill: C.line }),
          s('rect', { x: p.x + 12, y: y + 8, width: fillW, height: 12, rx: 6, fill: p.col, 'fill-opacity': 0.85 }),
          s('line', { x1: baseX, x2: baseX, y1: y + 5, y2: y + 23, stroke: C.ink, 'stroke-width': 2, 'stroke-opacity': 0.75 })
        );
      });
    }

    svg.replaceChildren(...k);

    fbox(box, [
      ['SENSITIVE (reacts)', C.pink],
      [`  mean    = ${st.sum} ÷ ${st.n} = ${fmt(r2(st.mean))}`, Math.abs(st.mean - bs.mean) > 1e-6 ? C.pink : C.ink],
      [`  range   = ${st.max} − ${st.min} = ${fmt(st.range)}`, st.range !== bs.range ? C.pink : C.ink],
      [`  std dev = ${fmt(r2(st.sd))}`, Math.abs(st.sd - bs.sd) > 0.01 ? C.pink : C.ink],
      ['RESISTANT (stays put)', C.green],
      [`  median  = ${fmt(r2(st.med))}`, C.green],
      [`  IQR     = ${fmt(st.q3)} − ${fmt(st.q1)} = ${fmt(st.iqr)}`, C.green],
      [`  MAD     = ${fmt(r2(st.mad))}`, C.green]
    ]);

    const anyExtreme = v.some(x => x > fenceHi || x < fenceLo);
    note.textContent = anyExtreme
      ? 'Notice the pink dot: it pulls Mean, Range, and Standard Deviation, while Median, IQR, and MAD shield the middle. Yet one customer still waited ' + st.max + ' days!'
      : 'The white tick on each bar marks the starting week. Drag one dot far to the right to create an extreme value.';
    selLabel.textContent = `Selected: parcel ${sel + 1} (${v[sel]} days)`;

    chal.update({
      isRandom,
      mean: r2(st.mean), med: st.med, range: st.range, iqr: st.iqr, sd: r2(st.sd), mad: st.mad, max: st.max,
      baseMean: r2(bs.mean), baseMed: bs.med, baseIqr: bs.iqr, baseMad: bs.mad
    });
  }

  draw();
  return () => {};
}

// 2.1.8 Try it: distribution shape — peaks, tails, skew, mean vs median.
// Drag any glowing dot along the time line (or tap it and use −5 / +5), change curve smoothness,
// toggle purpose colours, try presets or random distributions, and test the self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const PCOL = { borrow: C.cyan, computer: C.violet, study: C.amber, event: C.pink };
  const SAT_START = [
    { t: 5, p: 'borrow' }, { t: 8, p: 'borrow' }, { t: 10, p: 'borrow' }, { t: 10, p: 'borrow' },
    { t: 12, p: 'borrow' }, { t: 15, p: 'borrow' }, { t: 15, p: 'borrow' },
    { t: 20, p: 'computer' }, { t: 25, p: 'computer' }, { t: 30, p: 'computer' },
    { t: 30, p: 'computer' }, { t: 35, p: 'computer' },
    { t: 40, p: 'study' }, { t: 45, p: 'study' }, { t: 50, p: 'study' },
    { t: 55, p: 'study' }, { t: 60, p: 'study' }, { t: 60, p: 'study' },
    { t: 75, p: 'study' },
    { t: 85, p: 'event' }, { t: 90, p: 'study' }, { t: 90, p: 'event' }, { t: 95, p: 'event' },
    { t: 160, p: 'study' },
  ];
  const FILM_START = [10, 20, 35, 45, 60, 70, 75, 80, 80, 85, 85, 85, 85, 88, 88, 89, 90, 90, 90, 90, 90, 90, 90, 90]
    .map(t => ({ t, p: 'event' }));

  let dots = SAT_START.map(d => ({ ...d }));
  let sel = 23; // start with the 160-min afternoon visitor selected
  let bw = 11;
  let byPurpose = true;
  let randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 380' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const bwLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.cyan } });
  const bwSlider = h('input', {
    type: 'range', min: 6, max: 26, step: 1, value: String(bw),
    style: { flex: '1 1 10rem', accentColor: C.cyan, cursor: 'pointer' },
    oninput: () => { bw = +bwSlider.value; draw(); }
  });
  const purposeBtn = btn('Colour by purpose: ON', () => {
    byPurpose = !byPurpose;
    purposeBtn.textContent = byPurpose ? 'Colour by purpose: ON' : 'Colour by purpose: OFF';
    draw();
  });

  function makeRandomData() {
    const mode = rnd(0, 3);
    const out = [];
    const purposes = ['borrow', 'computer', 'study', 'event'];
    for (let i = 0; i < 24; i++) {
      let t;
      if (mode === 0) {
        // skewed right with tail
        t = i < 16 ? rnd(8, 38) : i < 21 ? rnd(45, 85) : rnd(115, 175);
      } else if (mode === 1) {
        // skewed left with tail
        t = i < 4 ? rnd(5, 55) : i < 9 ? rnd(70, 110) : rnd(125, 165);
      } else if (mode === 2) {
        // bimodal
        t = i < 12 ? rnd(12, 36) : rnd(110, 142);
      } else {
        // nearly symmetric mound
        t = Math.round((rnd(25, 135) + rnd(25, 135) + rnd(25, 135)) / 3);
      }
      out.push({ t, p: purposes[Math.min(3, Math.floor(t / 45))] });
    }
    return out;
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: peaks, tails and skew'),
    h('p', { class: 'sub' }, 'Drag any glowing dot left or right along the time line, or tap a dot and use −5 / +5. Watch how the curve, mean and median react.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5 min', () => bump(-5)), btn('+5 min', () => bump(5)), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Curve smoothness:'), bwSlider, bwLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => {
            dots = makeRandomData();
            sel = dots.length - 1;
            randomCount++;
            draw();
          }, 'go'),
          btn('Saturday library', () => { dots = SAT_START.map(d => ({ ...d })); sel = 23; bw = 11; bwSlider.value = '11'; draw(); }),
          btn('90-min film (skewed left)', () => { dots = FILM_START.map(d => ({ ...d })); sel = 0; bw = 10; bwSlider.value = '10'; draw(); }),
          purposeBtn,
          btn('Add 170-min visit', () => {
            if (dots.length < 30) { dots.push({ t: 170, p: 'study' }); sel = dots.length - 1; draw(); }
          }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10;
  const calcStats = () => {
    const vals = dots.map(d => d.t).slice().sort((a, b) => a - b);
    const n = vals.length;
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const mid = Math.floor(n / 2);
    const median = n % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
    return { vals, n, sum, mean, median, maxVal: vals[n - 1], minVal: vals[0] };
  };

  const chal = challenges(ch, [
    {
      text: 'Drag the 160-minute dot down to 100 minutes or less (or tap −5 min). Watch the mean drop while the median stays at 37.5.',
      check: st => st.n === 24 && st.median === 37.5 && st.maxVal <= 100 && st.mean < 45,
      why: 'Yes! The mean dropped, while the two middle visits (35 and 40) never moved — so the median stayed put at 37.5.'
    },
    {
      text: 'Make a shape skewed to the left so the mean sits at least 5 minutes below the median (try “90-min film” or drag dots).',
      check: st => st.mean <= st.median - 5,
      why: 'Right! When a long tail stretches to the left, those few short visits pull the fair share below the median.'
    },
    {
      text: 'Slide “Curve smoothness” up to 22 min or more and see how a smaller bump can flatten out and vanish.',
      check: st => st.bw >= 22,
      why: 'Good catch! A curve’s bumps depend on smoothness — always count how many dots make a peak and look for a real reason.'
    },
    {
      text: 'Press “New data (random)” three times. Notice which side the mean sits on compared to the median.',
      check: st => st.randomCount >= 3,
      why: 'Every time! Whatever the data, a long tail pulls the mean toward it while the median stays near the middle.'
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 360 : 380, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 24 : 38, X1 = VW - (NARROW ? 20 : 28);
  const BASE = VH - 66, TOP = 54, MAX_V = 180;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const xOf = v => X0 + (v / MAX_V) * (X1 - X0);
  const vOf = x => Math.max(0, Math.min(MAX_V, Math.round(((x - X0) / (X1 - X0)) * MAX_V)));

  function evalCurve(vals) {
    const N = 90, xs = [], ys = [];
    let maxY = 0;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * MAX_V;
      let y = 0;
      for (const v of vals) {
        const z = (x - v) / bw;
        y += Math.exp(-0.5 * z * z);
      }
      if (x < 3) y *= x / 3;
      xs.push(x); ys.push(y);
      if (y > maxY) maxY = y;
    }
    return { xs, ys, maxY: maxY || 1 };
  }

  function countPeaks(xs, ys, maxY) {
    const raw = [];
    for (let i = 1; i < ys.length - 1; i++) {
      if (ys[i] >= ys[i - 1] && ys[i] > ys[i + 1] && ys[i] >= 0.28 * maxY) {
        raw.push({ i, x: xs[i], y: ys[i] });
      }
    }
    // Keep peaks separated by a genuine dip (at least 10% drop)
    const kept = [];
    for (const pk of raw) {
      if (!kept.length) { kept.push(pk); continue; }
      const prev = kept[kept.length - 1];
      let minVal = Infinity;
      for (let j = prev.i; j <= pk.i; j++) if (ys[j] < minVal) minVal = ys[j];
      const dip = Math.min(prev.y, pk.y) - minVal;
      if (dip >= 0.10 * Math.min(prev.y, pk.y)) kept.push(pk);
      else if (pk.y > prev.y) kept[kept.length - 1] = pk;
    }
    return kept;
  }

  // Compute dot pixel coordinates (stacked gently when close)
  let dotCoords = [];
  function layoutDots() {
    const order = dots.map((d, idx) => ({ idx, t: d.t })).sort((a, b) => a.t - b.t || a.idx - b.idx);
    const rows = [];
    const minGap = NARROW ? 4.5 : 3.2;
    const stepY = NARROW ? 14 : 15;
    dotCoords = new Array(dots.length);
    for (const item of order) {
      let r = 0;
      while (rows[r] !== undefined && item.t - rows[r] < minGap) r++;
      rows[r] = item.t;
      dotCoords[item.idx] = { x: xOf(item.t), y: BASE - 12 - r * stepY };
    }
  }

  function bump(delta) {
    if (sel < 0 || sel >= dots.length) return;
    dots[sel].t = Math.max(0, Math.min(MAX_V, dots[sel].t + delta));
    draw();
  }

  // Pointer dragging for both touch and mouse
  let dragging = -1;
  const toSvg = e => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(ctm.inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bestD = 30 * F;
    dotCoords.forEach((c, i) => {
      const dist = Math.hypot(p.x - c.x, p.y - c.y);
      if (dist < bestD) { bestD = dist; best = i; }
    });
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    dots[dragging].t = vOf(p.x);
    draw();
  });
  const endDrag = () => { dragging = -1; };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  function draw() {
    const st = calcStats();
    layoutDots();
    const { xs, ys, maxY } = evalCurve(st.vals);
    const peaks = countPeaks(xs, ys, maxY);
    const k = [];

    // Subtle vertical grid & ticks
    const step = NARROW ? 30 : 20;
    for (let v = 0; v <= MAX_V; v += step) {
      const x = xOf(v);
      k.push(
        s('line', { x1: x, x2: x, y1: TOP, y2: BASE, stroke: C.line, 'stroke-width': 1 }),
        s('line', { x1: x, x2: x, y1: BASE, y2: BASE + 6, stroke: C.muted, 'stroke-width': 1.5 }),
        s('text', { x, y: BASE + 22 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v)
      );
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2.5 }),
      s('text', { x: X1, y: BASE + 44, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }, 'minutes')
    );

    // Smooth curve fill and stroke
    const curveH = BASE - TOP - 16;
    const pts = xs.map((x, i) => [xOf(x), BASE - (ys[i] / maxY) * curveH]);
    const areaD = `M ${pts[0][0].toFixed(1)} ${BASE} ` +
      pts.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1][0].toFixed(1)} ${BASE} Z`;
    const lineD = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} ` +
      pts.slice(1).map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    k.push(
      s('path', { d: areaD, fill: C.cyan, 'fill-opacity': 0.14 }),
      s('path', { d: lineD, fill: 'none', stroke: C.cyan, 'stroke-width': 3, 'stroke-linejoin': 'round' })
    );

    // Peak markers
    peaks.forEach((pk, idx) => {
      const px = xOf(pk.x), py = BASE - (pk.y / maxY) * curveH;
      k.push(
        s('circle', { cx: px, cy: py, r: 4.5, fill: C.pink }),
        s('text', { x: px, y: Math.max(TOP + 10, py - 10), fill: C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          peaks.length > 1 ? `PEAK ${idx + 1}` : 'PEAK')
      );
    });

    // Median (green dashed) & Mean (amber solid) markers with non-overlapping labels
    const xMed = xOf(st.median), xMean = xOf(st.mean);
    const meanRight = xMean >= xMed;
    const medAnchor = meanRight ? 'end' : 'start';
    const meanAnchor = meanRight ? 'start' : 'end';
    const medOff = meanRight ? -6 : 6;
    const meanOff = meanRight ? 6 : -6;
    const medLabelX = Math.max(X0 + 54, Math.min(X1 - 54, xMed + medOff));
    const meanLabelX = Math.max(X0 + 54, Math.min(X1 - 54, xMean + meanOff));

    k.push(
      s('line', { x1: xMed, x2: xMed, y1: TOP - 8, y2: BASE, stroke: C.green, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
      s('text', { x: medLabelX, y: TOP - 16, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': medAnchor, 'font-family': 'Consolas' }, `MED ${fmt(r1(st.median))}`),
      s('line', { x1: xMean, x2: xMean, y1: TOP + 6, y2: BASE, stroke: C.amber, 'stroke-width': 3 }),
      s('text', { x: meanLabelX, y: TOP - 16, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': meanAnchor, 'font-family': 'Consolas' }, `MEAN ${fmt(r1(st.mean))}`)
    );

    // Glowing data dots
    dots.forEach((d, i) => {
      const c = dotCoords[i];
      const col = byPurpose ? (PCOL[d.p] || C.cyan) : C.cyan;
      const isSel = i === sel;
      k.push(s('circle', { cx: c.x, cy: c.y, r: isSel ? 13 : 9.5, fill: col, 'fill-opacity': isSel ? 0.30 : 0.18 }));
      if (isSel) {
        k.push(s('circle', { cx: c.x, cy: c.y, r: 10.5, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      }
      k.push(s('circle', { cx: c.x, cy: c.y, r: isSel ? 6.2 : 5.2, fill: col, style: 'cursor: grab' }));
    });

    // Compact legend when colour-by-purpose is active
    if (byPurpose) {
      const items = [['borrow', C.cyan], ['computer', C.violet], ['study', C.amber], ['event', C.pink]];
      const legGap = (X1 - X0) / 4;
      items.forEach(([name, col], idx) => {
        const lx = X0 + idx * legGap + 8;
        k.push(
          s('circle', { cx: lx, cy: VH - 14, r: 4.5, fill: col }),
          s('text', { x: lx + 9, y: VH - 10, fill: col, 'font-size': 11.5 * F }, name)
        );
      });
    }

    svg.replaceChildren(...k);

    // Shape classification and live formula box
    const diff = st.mean - st.median;
    const skewWord = diff >= 3 ? 'skewed right' : diff <= -3 ? 'skewed left' : 'nearly symmetric';
    const skewCol = Math.abs(diff) >= 3 ? C.pink : C.green;
    const peakWord = peaks.length === 2 ? 'bimodal (2 peaks)' : peaks.length === 1 ? '1 peak' : `${peaks.length} peaks`;
    const gapText = Math.abs(diff) < 0.5
      ? 'Mean ≈ Median'
      : diff > 0 ? `Mean is +${fmt(r1(diff))} above Median` : `Mean is ${fmt(r1(Math.abs(diff)))} below Median`;

    fbox(box, [
      [`Shape  : ${skewWord}`, skewCol],
      [`Peaks  : ${peakWord}`, C.cyan],
      [`Median : ${fmt(r1(st.median))} min`, C.green],
      [`Mean   : ${fmt(r1(st.mean))} min`, C.amber],
      [gapText, Math.abs(diff) >= 3 ? C.amber : C.green],
    ]);

    note.textContent = diff >= 3
      ? `Long tail on the right pulls the mean (${fmt(r1(st.mean))}) above the median (${fmt(r1(st.median))}). The median describes a typical visit better here.`
      : diff <= -3
        ? `Long tail on the left pulls the mean (${fmt(r1(st.mean))}) below the median (${fmt(r1(st.median))}). Those few short visits pull the fair share down.`
        : `Both sides balance fairly well, so the mean (${fmt(r1(st.mean))}) and median (${fmt(r1(st.median))}) sit close together.`;

    const cur = dots[sel];
    selLabel.textContent = cur ? `Selected: #${sel + 1} (${cur.t} min${byPurpose ? ', ' + cur.p : ''})` : 'Tap any dot to select';
    bwLabel.textContent = `${bw} min`;

    chal.update({ ...st, bw, peaks: peaks.length, randomCount });
  }

  draw();
  return () => {};
}

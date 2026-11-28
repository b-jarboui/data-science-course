// 1.3.5 Try it: Sample variance — why divide by one less?
// Mode 1: drag 7 parcel delivery times and slide the center line to see squares grow/shrink.
// Mode 2: run many random samples from the café's population (true variance = 2) and compare ÷ 7 vs ÷ 6.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [3, 4, 4, 5, 6, 6, 7];
  // Population: uniform on {3, 4, 5, 6, 7} -> exact population mean = 5, exact population variance = 2.0
  const POP = [3, 4, 5, 6, 7];
  const TRUE_VAR = 2;

  let mode = 'one'; // 'one' | 'many'
  let v = START.slice(), sel = 0, center = 5, snapped = true;
  let newDataCount = 0;
  let est7 = [], est6 = [], lastSample = START.slice();
  let anim = 0, running = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const ctrLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const oneControls = h('div');
  const manyControls = h('div');
  const tabOne = btn('1 sample (squares)', () => setMode('one'), 'go');
  const tabMany = btn('Many samples (÷ 7 vs ÷ 6)', () => setMode('many'));

  oneControls.append(
    h('div', { class: 'sim-row', style: { alignItems: 'center' } },
      btn('−1 day', () => bumpParcel(-1)),
      btn('+1 day', () => bumpParcel(1)),
      selLabel),
    h('div', { class: 'sim-row', style: { alignItems: 'center' } },
      btn('Center −0.5', () => bumpCenter(-0.5)),
      btn('Center +0.5', () => bumpCenter(0.5)),
      btn('Snap to mean', () => { snapped = true; center = mean(); draw(); }, 'go'),
      ctrLabel),
    h('div', { class: 'sim-row' },
      btn('New data (random)', () => {
        v = Array.from({ length: 7 }, () => rnd(1, 9)).sort((a, b) => a - b);
        snapped = true; center = mean(); newDataCount++; draw();
      }),
      btn('Start again', () => { v = START.slice(); sel = 0; snapped = true; center = 5; draw(); }))
  );

  manyControls.append(
    h('div', { class: 'sim-row' },
      btn('Draw 1 sample', () => runBatch(1), 'go'),
      btn('Run 50 samples', () => runBatch(50), 'go'),
      btn('Run 200 samples', () => runBatch(200)),
      btn('Clear samples', () => { stopRun(); est7 = []; est6 = []; draw(); }))
  );

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: sample variance'),
    h('p', { class: 'sub' }, 'Drag parcels left or right on the days line, or slide the amber center line to watch the squares change. Switch to “Many samples” to test ÷ 7 against ÷ 6.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.6rem' } }, tabOne, tabMany),
        svg, oneControls, manyControls),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const mean = (arr = v) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const ssAt = (c, arr = v) => arr.reduce((sum, x) => sum + (x - c) * (x - c), 0);

  const chal = challenges(ch, [
    {
      text: 'Slide the center line from 5 to 6. Notice what happens to the total of the squares.',
      check: st => st.mode === 'one' && Math.abs(st.center - 6) < 0.05 && Math.abs(st.mean - 6) > 0.05,
      why: 'Right! Moving away from the sample mean lifts the total of the squares. The sample mean always gives the smallest possible total.'
    },
    {
      text: 'Keep the sample mean at 5 days, but spread the parcels out so sample variance (÷ 6) is bigger than 3.',
      check: st => st.mode === 'one' && Math.abs(st.mean - 5) < 0.01 && st.s2 > 3,
      why: 'Yes! Moving parcels farther from 5 makes their squares grow fast, while keeping the balance point at 5.'
    },
    {
      text: 'Press “New data (random)” twice. Is ÷ 6 always bigger than ÷ 7?',
      check: st => st.newDataCount >= 2,
      why: 'Always (whenever the parcels are not all identical): dividing the same total of squares by 6 instead of 7 lifts the estimate.'
    },
    {
      text: 'Switch to “Many samples” and run at least 100 samples. Compare the averages of ÷ 7 and ÷ 6 to the true variance (2).',
      check: st => st.trials >= 100,
      why: 'Look at the running averages: ÷ 7 sits too low (near 1.71), while ÷ 6 lands right near the true variance of 2!'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 28 : 44, X1 = VW - (NARROW ? 20 : 34);
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);

  const d2x = d => X0 + ((d - 1) / 8) * (X1 - X0);
  const x2d = x => 1 + ((x - X0) / (X1 - X0)) * 8;
  const AXIS_Y = 162, SQ_BASE = 402;

  function setMode(next) {
    mode = next;
    tabOne.className = 'sim-btn ' + (mode === 'one' ? 'go' : '');
    tabMany.className = 'sim-btn ' + (mode === 'many' ? 'go' : '');
    oneControls.style.display = mode === 'one' ? '' : 'none';
    manyControls.style.display = mode === 'many' ? '' : 'none';
    draw();
  }

  function bumpParcel(d) {
    v[sel] = Math.max(1, Math.min(9, v[sel] + d));
    if (snapped) center = mean();
    draw();
  }

  function bumpCenter(d) {
    snapped = false;
    center = Math.max(1, Math.min(9, Math.round((center + d) * 2) / 2));
    draw();
  }

  function sampleOnce() {
    const arr = Array.from({ length: 7 }, () => POP[rnd(0, POP.length - 1)]);
    const m = mean(arr);
    const ss = ssAt(m, arr);
    est7.push(ss / 7);
    est6.push(ss / 6);
    lastSample = arr.sort((a, b) => a - b);
  }

  function stopRun() {
    cancelAnimationFrame(anim);
    running = 0;
  }

  function runBatch(count) {
    stopRun();
    if (count === 1) { sampleOnce(); draw(); return; }
    running = count;
    const perFrame = Math.max(2, Math.ceil(count / 32));
    const step = () => {
      const n = Math.min(running, perFrame);
      for (let i = 0; i < n; i++) sampleOnce();
      running -= n;
      draw();
      if (running > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Pointer dragging in Mode 1 (parcels and center line)
  let dragKind = ''; // 'parcel' | 'center'
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  function parcelCoords() {
    const counts = {};
    return v.map((val, i) => {
      const k = counts[val] || 0;
      counts[val] = k + 1;
      return { i, val, x: d2x(val), y: AXIS_Y - 26 - k * 24 };
    });
  }

  svg.addEventListener('pointerdown', e => {
    if (mode !== 'one') return;
    const p = toSvg(e);
    const cx = d2x(center);
    // Check center-line handle at top first
    if (Math.abs(p.x - cx) < 28 && p.y >= 16 && p.y <= AXIS_Y + 6) {
      // If right on top of a dot, check if user aimed at handle (y < 60)
      const pts = parcelCoords();
      const nearDot = pts.find(pt => Math.hypot(p.x - pt.x, p.y - pt.y) < 18);
      if (!nearDot || p.y < 60) {
        dragKind = 'center';
        svg.setPointerCapture(e.pointerId);
        onMove(e);
        return;
      }
    }
    // Check nearest parcel dot
    const pts = parcelCoords();
    let best = -1, bestD = 34;
    for (const pt of pts) {
      const d = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (d < bestD) { bestD = d; best = pt.i; }
    }
    if (best >= 0) {
      sel = best;
      dragKind = 'parcel';
      svg.setPointerCapture(e.pointerId);
      onMove(e);
    }
  });

  const onMove = e => {
    if (!dragKind) return;
    const p = toSvg(e);
    const raw = Math.max(1, Math.min(9, x2d(p.x)));
    if (dragKind === 'parcel') {
      v[sel] = Math.round(raw);
      if (snapped) center = mean();
    } else if (dragKind === 'center') {
      snapped = false;
      center = Math.round(raw * 2) / 2;
    }
    draw();
  };
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', () => { dragKind = ''; });

  function drawOne(k) {
    const m = mean();
    const c = snapped ? m : center;
    center = c;
    const ssC = ssAt(c), ssM = ssAt(m);
    const v7 = ssM / v.length, v6 = ssM / (v.length - 1);
    const isAtMean = Math.abs(c - m) < 1e-6;
    const cCol = isAtMean ? C.amber : C.pink;

    // Days axis
    k.push(s('line', { x1: X0 - 8, x2: X1 + 8, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    for (let d = 1; d <= 9; d++) {
      const x = d2x(d);
      k.push(
        s('line', { x1: x, x2: x, y1: AXIS_Y - 5, y2: AXIS_Y + 5, stroke: C.muted, 'stroke-width': 2 }),
        s('text', { x, y: AXIS_Y + 21, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, d)
      );
    }
    k.push(s('text', { x: X1, y: AXIS_Y + 38, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }, 'days'));

    // Vertical center line + draggable handle
    const cx = d2x(c);
    k.push(
      s('line', { x1: cx, x2: cx, y1: 42, y2: AXIS_Y + 6, stroke: cCol, 'stroke-width': 3, 'stroke-dasharray': '7 5' }),
      s('rect', { x: cx - 54 * F, y: 12, width: 108 * F, height: 26, rx: 13, fill: C.bg, stroke: cCol, 'stroke-width': 2 }),
      s('text', { x: cx, y: 29, fill: cCol, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        (isAtMean ? 'MEAN ' : 'LINE ') + fmt(r2(c)))
    );

    // Sample mean faint marker when center line moved away
    if (!isAtMean) {
      const mx = d2x(m);
      k.push(
        s('line', { x1: mx, x2: mx, y1: 58, y2: AXIS_Y, stroke: C.amber, 'stroke-width': 1.5, 'stroke-dasharray': '3 4', opacity: 0.7 }),
        s('text', { x: mx, y: 53, fill: C.amber, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'mean ' + fmt(r2(m)))
      );
    }

    // Parcel dots & horizontal deviation arrows
    const pts = parcelCoords();
    pts.forEach(pt => {
      const gap = pt.val - c;
      if (Math.abs(gap) > 0.01) {
        const aCol = isAtMean ? (gap < 0 ? C.violet : C.green) : C.pink;
        k.push(s('line', { x1: cx, x2: pt.x, y1: pt.y, y2: pt.y, stroke: aCol, 'stroke-width': 2.5, opacity: 0.85 }));
      }
      if (pt.i === sel) {
        k.push(s('circle', { cx: pt.x, cy: pt.y, r: 15, fill: C.amber, 'fill-opacity': 0.2, stroke: C.amber, 'stroke-width': 1.8 }));
      }
      k.push(
        s('circle', { cx: pt.x, cy: pt.y, r: 11, fill: C.cyan, 'fill-opacity': 0.2 }),
        s('circle', { cx: pt.x, cy: pt.y, r: 6.5, fill: C.cyan })
      );
    });

    // Real squares shelf below axis
    const gaps = v.map(val => Math.abs(val - c));
    const maxGap = Math.max(3, ...gaps);
    const sumGap = gaps.reduce((a, b) => a + Math.max(0.7, b), 0);
    const availW = (X1 - X0) - 6 * 10;
    const u = Math.min(46, 155 / maxGap, availW / sumGap);

    k.push(s('line', { x1: X0 - 8, x2: X1 + 8, y1: SQ_BASE, y2: SQ_BASE, stroke: C.line, 'stroke-width': 2 }));
    const widths = gaps.map(g => Math.max(22, g * u));
    const totW = widths.reduce((a, b) => a + b, 0) + 6 * 10;
    let sx = (X0 + X1) / 2 - totW / 2;

    gaps.forEach((g, i) => {
      const sw = g * u, cxSq = sx + widths[i] / 2;
      const area = r2(g * g);
      const col = i === sel ? C.amber : (isAtMean ? C.cyan : C.pink);
      if (g > 0.01) {
        k.push(s('rect', { x: cxSq - sw / 2, y: SQ_BASE - sw, width: sw, height: sw, fill: col, 'fill-opacity': 0.72, stroke: col, 'stroke-width': 1.5, rx: 2 }));
        // Subtle 1x1 grid lines for whole-number parts
        for (let t = 1; t < g - 0.01; t++) {
          const lx = cxSq - sw / 2 + t * u, ly = SQ_BASE - t * u;
          k.push(
            s('line', { x1: lx, x2: lx, y1: SQ_BASE - sw, y2: SQ_BASE, stroke: C.bg, 'stroke-width': 1 }),
            s('line', { x1: cxSq - sw / 2, x2: cxSq + sw / 2, y1: ly, y2: ly, stroke: C.bg, 'stroke-width': 1 })
          );
        }
      } else {
        k.push(s('circle', { cx: cxSq, cy: SQ_BASE - 4, r: 4, fill: C.muted }));
      }
      k.push(
        s('text', { x: cxSq, y: SQ_BASE - sw - 7, fill: g > 0.01 ? col : C.muted, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(area)),
        s('text', { x: cxSq, y: SQ_BASE + 20, fill: i === sel ? C.amber : C.muted, 'font-size': 12.5 * F, 'font-weight': i === sel ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v[i])
      );
      sx += widths[i] + 10;
    });

    // Formula box + notes
    const sqStr = gaps.map(g => fmt(r2(g * g))).join('+');
    fbox(box, [
      `parcels: ${v.join(', ')}  (mean = ${fmt(r2(m))})`,
      isAtMean
        ? [`squares from ${fmt(r2(c))}: ${sqStr} = ${fmt(r2(ssC))}`, C.cyan]
        : [`squares from ${fmt(r2(c))}: total = ${fmt(r2(ssC))} (min at mean: ${fmt(r2(ssM))})`, C.pink],
      `÷ 7 (whole group): ${fmt(r2(ssM))} ÷ 7 = ${fmt(r2(v7))}`,
      [`÷ 6 (sample var):  ${fmt(r2(ssM))} ÷ 6 = ${fmt(r2(v6))}`, C.green]
    ]);
    note.textContent = isAtMean
      ? 'At the sample mean, the total of the squares is as small as possible. Drag the amber handle to test any other center.'
      : `Moving the center away from ${fmt(r2(m))} lifted the total of the squares from ${fmt(r2(ssM))} to ${fmt(r2(ssC))}.`;
    selLabel.textContent = `Parcel #${sel + 1}: ${v[sel]} days`;
    ctrLabel.textContent = `Center: ${fmt(r2(c))}`;

    chal.update({ mode, center: r2(c), mean: r2(m), s2: v6, newDataCount, trials: est6.length });
  }

  function drawMany(k) {
    const n = est6.length;
    const avg7 = n ? est7.reduce((a, b) => a + b, 0) / n : null;
    const avg6 = n ? est6.reduce((a, b) => a + b, 0) / n : null;
    const MAX_V = 5;
    const vx = val => X0 + (Math.min(MAX_V, val) / MAX_V) * (X1 - X0);

    // Header text
    k.push(s('text', { x: (X0 + X1) / 2, y: 24, fill: C.ink, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle' },
      `Population: {3, 4, 5, 6, 7} days · True variance = 2 · Samples run: ${n}`));

    // Two histogram tracks: top = ÷ 7 (pink), bottom = ÷ 6 (green)
    const tracks = [
      { label: 'Dividing by 7  (n)', data: est7, avg: avg7, col: C.pink, baseY: 205 },
      { label: 'Dividing by 6  (n − 1)', data: est6, avg: avg6, col: C.green, baseY: 385 }
    ];
    const bins = 20, bw = (X1 - X0) / bins;

    // Shared true variance = 2 dashed vertical line
    const tx = vx(TRUE_VAR);
    k.push(
      s('line', { x1: tx, x2: tx, y1: 42, y2: 396, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
      s('rect', { x: tx - 46 * F, y: 38, width: 92 * F, height: 22, rx: 11, fill: C.bg, stroke: C.amber }),
      s('text', { x: tx, y: 53, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'TRUE = 2')
    );

    tracks.forEach(tr => {
      k.push(
        s('line', { x1: X0, x2: X1, y1: tr.baseY, y2: tr.baseY, stroke: C.muted, 'stroke-width': 2 }),
        s('text', { x: X0, y: tr.baseY - 122, fill: tr.col, 'font-size': 13 * F, 'font-weight': 700 }, tr.label)
      );
      for (let t = 0; t <= MAX_V; t++) {
        const x = vx(t);
        k.push(
          s('line', { x1: x, x2: x, y1: tr.baseY, y2: tr.baseY + 5, stroke: C.muted }),
          s('text', { x, y: tr.baseY + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, t)
        );
      }
      if (tr.data.length) {
        const counts = new Array(bins).fill(0);
        tr.data.forEach(val => {
          const b = Math.min(bins - 1, Math.floor((val / MAX_V) * bins));
          counts[b]++;
        });
        const peak = Math.max(1, ...counts);
        counts.forEach((cnt, b) => {
          if (!cnt) return;
          const hgt = (cnt / peak) * 102;
          k.push(s('rect', {
            x: X0 + b * bw + 1.5, y: tr.baseY - hgt, width: Math.max(2, bw - 3), height: hgt,
            fill: tr.col, 'fill-opacity': 0.55, stroke: tr.col, 'stroke-width': 1, rx: 2
          }));
        });
        // Running average marker
        const ax = vx(tr.avg);
        k.push(
          s('line', { x1: ax, x2: ax, y1: tr.baseY - 112, y2: tr.baseY, stroke: tr.col, 'stroke-width': 3.5 }),
          s('rect', { x: Math.min(X1 - 92 * F, Math.max(X0, ax - 46 * F)), y: tr.baseY - 134, width: 92 * F, height: 22, rx: 11, fill: C.bg, stroke: tr.col }),
          s('text', { x: Math.min(X1 - 46 * F, Math.max(X0 + 46 * F, ax)), y: tr.baseY - 119, fill: tr.col, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
            'AVG ' + fmt(r2(tr.avg)))
        );
      } else {
        k.push(s('text', { x: (X0 + X1) / 2, y: tr.baseY - 50, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' },
          'Press “Run 50 samples” or “Draw 1 sample” below'));
      }
    });

    fbox(box, n ? [
      `samples drawn: ${n}  (7 parcels each)`,
      `last sample: ${lastSample.join(', ')}`,
      [`avg of ÷ 7: ${fmt(r2(avg7))}  (true = 2.00)`, C.pink],
      [`avg of ÷ 6: ${fmt(r2(avg6))}  (true = 2.00)`, C.green]
    ] : [
      'true population variance = 2.00',
      'each sample draws 7 random parcels',
      ['run samples to compare ÷ 7 vs ÷ 6', C.amber]
    ]);
    note.textContent = n
      ? 'Individual samples jump above and below 2. Watch where the two running averages settle as the sample count grows.'
      : 'Every trial picks 7 random parcels from the café’s population and computes both ÷ 7 and ÷ 6.';

    chal.update({ mode, center: r2(center), mean: r2(mean()), s2: ssAt(mean()) / 6, newDataCount, trials: n });
  }

  function draw() {
    const k = [];
    if (mode === 'one') drawOne(k);
    else drawMany(k);
    svg.replaceChildren(...k);
  }

  setMode('one');
  return () => stopRun();
}

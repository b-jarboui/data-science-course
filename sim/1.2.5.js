// 1.2.5 Try it: the middle of an ordered line (median vs mean).
// The learner drags bars (or uses -1 / +1), orders them from small to large,
// crosses off outer pairs, compares median vs mean on random data, and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const CLASS8 = [10, 12, 15, 18, 25, 30, 30, 90];
  const CAFE8 = [3, 5, 2, 14, 3, 4, 6, 3];

  let items = CLASS8.map((val, i) => ({ val, from: i, to: i }));
  let sel = 7, anim = 0, animT = 1, paired = false, isCafe = false;
  let randomPending = false, randomSorted = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the middle of an ordered line'),
    h('p', { class: 'sub' }, 'Drag any bar up or down (or tap it and use −1 / +1). Order the line, cross off outer pairs, and watch how the median (green) compares with the mean (amber).'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Order small → large', () => sortAnimated(), 'go'),
          btn('Cross off pairs', () => togglePairs()),
          btn('New data (random)', () => makeRandom()),
          btn('Add a value', () => addOne()),
          btn('Remove a value', () => removeOne()),
          btn('Café evening shift', () => loadCafe()),
          btn('Start again', () => loadClass()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const vals = () => items.map(it => it.val);
  const sortedVals = () => vals().slice().sort((a, b) => a - b);
  const isSorted = () => items.every((it, i) => i === 0 || items[i - 1].val <= it.val);
  const total = () => items.reduce((a, it) => a + it.val, 0);
  const mean = () => total() / items.length;
  const median = () => {
    const sv = sortedVals(), n = sv.length, m = Math.floor(n / 2);
    return n % 2 === 1 ? sv[m] : (sv[m - 1] + sv[m]) / 2;
  };
  const r2 = x => Math.round(x * 100) / 100;

  const chal = challenges(ch, [
    { text: 'Drag the 90-minute trip up to 140 or higher. Watch the mean climb while the median stays at 21.5.',
      check: st => st.n === 8 && st.max >= 140 && st.median === 21.5 && st.mean > 34,
      why: 'Yes! Stretching the biggest value pulls the mean up, while the middle pair (18 and 25) never moves.' },
    { text: 'Press “Remove a value” so 7 remain (an odd count), then press “Cross off pairs”.',
      check: st => st.n === 7 && st.paired,
      why: 'With an odd count, crossing off outer pairs leaves one number right in the middle — that is the median.' },
    { text: 'Press “Café evening shift”, then “Order small → large”. See how the median (3.5) stays below the mean (5).',
      check: st => st.isCafe && st.sorted,
      why: 'Ordering first puts the 14-minute jam at the end, leaving 3 and 4 in the middle while the mean is pulled to 5.' },
    { text: 'Press “New data (random)” and then “Order small → large”, twice. Does the median always sit at the middle?',
      check: st => st.randomSorted >= 2,
      why: 'Always. Once ordered, the median is the center value (odd count) or halfway between the center two (even count).' },
  ]);

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 38 : 52, X1 = VW - 12, BASE = 392, TOP = 34;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);

  const niceMax = () => {
    const m = Math.max(...vals());
    if (m <= 16) return 20;
    if (m <= 36) return 40;
    if (m <= 60) return 65;
    if (m <= 150) return 160;
    return 200;
  };
  let scaleMax = niceMax();
  const unit = () => (BASE - TOP) / scaleMax;
  const slot = () => (X1 - X0) / items.length;

  function stopAnim() {
    cancelAnimationFrame(anim);
    if (animT < 1) {
      items.sort((a, b) => a.to - b.to);
      items.forEach((it, i) => { it.from = i; it.to = i; });
      animT = 1;
    }
  }
  function resetIndices() {
    items.forEach((it, i) => { it.from = i; it.to = i; });
    animT = 1;
  }
  function changed(rescale = true) {
    stopAnim();
    paired = false;
    if (rescale) scaleMax = niceMax();
    draw();
  }
  function bump(d) {
    stopAnim();
    items[sel].val = Math.max(1, Math.min(200, items[sel].val + d));
    paired = false;
    scaleMax = niceMax();
    draw();
  }
  function loadClass() {
    stopAnim();
    items = CLASS8.map((val, i) => ({ val, from: i, to: i }));
    sel = 7; isCafe = false; randomPending = false; paired = false;
    scaleMax = niceMax();
    draw();
  }
  function loadCafe() {
    stopAnim();
    items = CAFE8.map((val, i) => ({ val, from: i, to: i }));
    sel = 3; isCafe = true; randomPending = false; paired = false;
    scaleMax = niceMax();
    draw();
  }
  function makeRandom() {
    stopAnim();
    const n = items.length;
    const arr = Array.from({ length: n }, () => rnd(4, 38));
    arr[rnd(0, n - 1)] = rnd(50, 95);
    if (arr.every((x, i) => i === 0 || arr[i - 1] <= x)) arr.reverse();
    items = arr.map((val, i) => ({ val, from: i, to: i }));
    sel = Math.min(sel, n - 1);
    isCafe = false; randomPending = true; paired = false;
    scaleMax = niceMax();
    draw();
  }
  function addOne() {
    if (items.length >= 10) return;
    stopAnim();
    items.push({ val: rnd(isCafe ? 2 : 8, isCafe ? 12 : 40), from: items.length, to: items.length });
    isCafe = false; paired = false;
    scaleMax = niceMax();
    draw();
  }
  function removeOne() {
    if (items.length <= 3) return;
    stopAnim();
    items.pop();
    sel = Math.min(sel, items.length - 1);
    isCafe = false; paired = false;
    scaleMax = niceMax();
    draw();
  }

  function sortAnimated(onDone) {
    stopAnim();
    if (isSorted()) {
      if (randomPending) { randomSorted++; randomPending = false; }
      if (onDone) onDone();
      draw();
      return;
    }
    const order = items.map((it, i) => ({ it, i })).sort((a, b) => a.it.val - b.it.val || a.i - b.i);
    const selectedItem = items[sel];
    order.forEach((entry, newIdx) => { entry.it.from = entry.i; entry.it.to = newIdx; });
    const t0 = performance.now();
    animT = 0;
    const step = now => {
      const k = Math.min(1, (now - t0) / 650);
      animT = k * k * (3 - 2 * k);
      if (k < 1) {
        draw();
        anim = requestAnimationFrame(step);
      } else {
        items = order.map((entry, idx) => ({ val: entry.it.val, from: idx, to: idx }));
        sel = Math.max(0, items.findIndex(it => it.val === selectedItem.val));
        animT = 1;
        if (randomPending) { randomSorted++; randomPending = false; }
        if (onDone) onDone();
        draw();
      }
    };
    anim = requestAnimationFrame(step);
  }

  function togglePairs() {
    if (paired) { paired = false; draw(); return; }
    if (!isSorted()) {
      sortAnimated(() => { paired = true; });
    } else {
      paired = true;
      draw();
    }
  }

  // Pointer drag on bars
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    stopAnim();
    const p = toSvg(e), i = Math.floor((p.x - X0) / slot());
    if (i < 0 || i >= items.length) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    items[dragging].val = Math.max(1, Math.min(Math.min(200, scaleMax), Math.round((BASE - p.y) / unit())));
    paired = false;
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => {
    if (dragging < 0) return;
    dragging = -1;
    scaleMax = niceMax();
    draw();
  });

  function draw() {
    const n = items.length, m = mean(), med = median(), u = unit(), sl = slot(), bw = Math.min(58, sl * 0.68);
    const sortedNow = animT === 1 && isSorted();
    const midLo = Math.floor((n - 1) / 2), midHi = Math.floor(n / 2);
    const k = [];

    // Gridlines
    const step = scaleMax <= 20 ? 5 : scaleMax <= 65 ? 10 : 20;
    for (let g = 0; g <= scaleMax; g += step) {
      const y = BASE - g * u;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // Bars
    const maxVal = Math.max(...vals());
    items.forEach((it, i) => {
      const pos = it.from + (it.to - it.from) * animT;
      const cx = X0 + sl * (pos + 0.5);
      const isMid = paired && sortedNow && (i === midLo || i === midHi);
      const isCrossed = paired && sortedNow && !isMid;
      const baseCol = isCafe ? C.pink : (it.val >= 60 && it.val === maxVal ? C.pink : C.cyan);
      const col = isMid ? C.green : (isCrossed ? C.muted : baseCol);
      const opacity = isCrossed ? 0.25 : 0.85;

      if (i === sel && animT === 1) {
        k.push(s('rect', { x: cx - sl / 2 + 3, y: TOP - 8, width: sl - 6, height: BASE - TOP + 8, fill: '#ffffff', 'fill-opacity': 0.05, rx: 8 }));
      }
      const hgt = Math.max(4, it.val * u);
      k.push(s('rect', { x: cx - bw / 2, y: BASE - hgt, width: bw, height: hgt, fill: col, 'fill-opacity': opacity, stroke: col, 'stroke-width': isMid ? 2 : 1, rx: 4 }));
      k.push(s('text', { x: cx, y: BASE + 24, fill: isCrossed ? C.muted : col, 'font-size': (n > 8 ? 14 : 17) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, it.val));

      if (isCrossed) {
        const xr = 10 * F, cy = BASE + 18;
        k.push(
          s('line', { x1: cx - xr, y1: cy - 8, x2: cx + xr, y2: cy + 8, stroke: C.pink, 'stroke-width': 2.2 }),
          s('line', { x1: cx - xr, y1: cy + 8, x2: cx + xr, y2: cy - 8, stroke: C.pink, 'stroke-width': 2.2 })
        );
      }
    });

    // Mean line (amber, pill on right)
    const yMean = BASE - m * u;
    const pillH = 26 * F, pillW = 132 * F;
    const clampY = y => Math.max(TOP + 2, Math.min(BASE - pillH - 4, y - pillH - 6));
    k.push(
      s('line', { x1: X0, x2: X1, y1: yMean, y2: yMean, stroke: C.amber, 'stroke-width': 2.8, 'stroke-dasharray': '9 7' }),
      s('rect', { x: X1 - pillW, y: clampY(yMean), width: pillW, height: pillH, rx: pillH / 2, fill: C.bg, stroke: C.amber, 'stroke-width': 1.8 }),
      s('text', { x: X1 - pillW / 2, y: clampY(yMean) + pillH * 0.68, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEAN ' + fmt(r2(m)))
    );

    // Median line (green, pill on left — never overlaps mean pill)
    const yMed = BASE - med * u;
    const medW = 142 * F;
    k.push(
      s('line', { x1: X0, x2: X1, y1: yMed, y2: yMed, stroke: C.green, 'stroke-width': 3, 'stroke-dasharray': '5 5' }),
      s('rect', { x: X0 + 4, y: clampY(yMed), width: medW, height: pillH, rx: pillH / 2, fill: C.bg, stroke: C.green, 'stroke-width': 1.8 }),
      s('text', { x: X0 + 4 + medW / 2, y: clampY(yMed) + pillH * 0.68, fill: C.green, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEDIAN ' + fmt(r2(med)))
    );

    svg.replaceChildren(...k);

    // Formula box
    const sv = sortedVals();
    const listStr = sv.join(', ');
    const midLine = n % 2 === 1
      ? `middle  = ${sv[midLo]} (center of ${n})`
      : `middle  = (${sv[midLo]} + ${sv[midHi]}) ÷ 2`;
    fbox(box, [
      listStr.length <= 32 ? `ordered = ${listStr}` : `ordered = ${n} values (small → large)`,
      midLine,
      [`median  = ${fmt(r2(med))}`, C.green],
      [`mean    = ${total()} ÷ ${n} = ${fmt(r2(m))}`, C.amber]
    ]);

    note.textContent = !sortedNow
      ? 'Not in order yet — press “Order small → large” to line them up before taking the middle.'
      : paired
        ? (n % 2 === 1
          ? `Outer pairs crossed off: ${sv[midLo]} stays right in the middle.`
          : `Outer pairs crossed off: ${sv[midLo]} and ${sv[midHi]} stay, and halfway is ${fmt(r2(med))}.`)
        : 'Ordered from small to large. Try dragging the biggest bar higher: watch the amber mean move while the green median stays put.';

    const unitWord = isCafe ? 'wait' : 'trip';
    selLabel.textContent = `Selected: ${unitWord} ${sel + 1} (${items[sel].val} min)`;

    chal.update({
      n,
      max: maxVal,
      median: r2(med),
      mean: r2(m),
      sorted: sortedNow,
      paired: paired && sortedNow,
      isCafe,
      randomSorted
    });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

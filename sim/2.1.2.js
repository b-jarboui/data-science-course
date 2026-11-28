// 2.1.2 Try it: dot plots, stacking, outliers, and the exact-seconds trap.
// The learner drags visitor dots left or right along a 0–160 minute number line
// (or taps one and uses -5 / -1 / +1 / +5), generates fresh random Saturdays,
// tests the 200-visitor exact-seconds trap, and solves self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const CATS = [
    { name: 'Borrow',   col: C.cyan },
    { name: 'Computer', col: C.violet },
    { name: 'Study',    col: C.amber },
    { name: 'Event',    col: C.pink },
  ];

  // Exact shared chapter 2.1 data: 24 Saturday library visitors
  const START = [
    [0, 5], [0, 8], [0, 10], [0, 10], [0, 12], [0, 15], [0, 15],
    [1, 20], [1, 25], [1, 30], [1, 30], [1, 35],
    [2, 40], [2, 45], [2, 50], [2, 55], [2, 60], [2, 60], [2, 75], [2, 90], [2, 160],
    [3, 85], [3, 90], [3, 95],
  ];

  let visitors = START.map(([cat, min], id) => ({ id, cat, min }));
  let nextId = visitors.length;
  let sel = visitors.length - 4; // 160-min study visitor selected initially? Let's select index 20 (160 min)
  sel = 20;
  let crowdMode = false;
  let crowdData = [];
  let randomCount = 0;
  let sawCrowd = false;
  let removedOutlier = false;

  function makeCrowd() {
    const out = [];
    for (let i = 0; i < 200; i++) {
      const r = Math.random();
      let base, cat;
      if (r < 0.30) { cat = 0; base = 4 + Math.random() * 14; }
      else if (r < 0.52) { cat = 1; base = 18 + Math.random() * 22; }
      else if (r < 0.84) { cat = 2; base = 38 + Math.random() * 54; }
      else if (r < 0.97) { cat = 3; base = 82 + Math.random() * 16; }
      else { cat = 2; base = 130 + Math.random() * 28; }
      // Round to exact second (1/60 minute)
      const sec = Math.max(1, Math.min(9600, Math.round(base * 60)));
      out.push({ cat, min: sec / 60, sec });
    }
    return out;
  }

  function makeRandomSaturday() {
    const list = [];
    const nBorrow = rnd(5, 8);
    const nComp = rnd(4, 6);
    const nEvent = rnd(2, 4);
    const nStudy = Math.max(5, 24 - nBorrow - nComp - nEvent);
    const pick = (a, b, step = 1) => a + rnd(0, Math.floor((b - a) / step)) * step;
    for (let i = 0; i < nBorrow; i++) list.push({ id: nextId++, cat: 0, min: pick(4, 18, 2) });
    for (let i = 0; i < nComp; i++) list.push({ id: nextId++, cat: 1, min: pick(20, 40, 5) });
    for (let i = 0; i < nStudy - 1; i++) list.push({ id: nextId++, cat: 2, min: pick(40, 90, 5) });
    // Occasionally include a realistic long-stay afternoon visitor
    list.push({ id: nextId++, cat: 2, min: Math.random() < 0.65 ? pick(140, 160, 5) : pick(60, 95, 5) });
    for (let i = 0; i < nEvent; i++) list.push({ id: nextId++, cat: 3, min: pick(80, 100, 5) });
    return list;
  }

  const svg = s('svg', { viewBox: '0 0 700 360' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const crowdBtn = btn('Trap: 200 exact times', toggleCrowd);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: dot plots'),
    h('p', { class: 'sub' }, 'Each dot is one visitor above their visit time. Drag any dot left or right, or tap a dot and use −5 / −1 / +1 / +5. Equal times stack up.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5', () => bump(-5)), btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)), btn('+5', () => bump(5)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => {
            crowdMode = false;
            visitors = makeRandomSaturday();
            sel = visitors.length - 1;
            randomCount++;
            draw();
          }, 'go'),
          crowdBtn,
          btn('Add visitor', () => {
            if (crowdMode || visitors.length >= 36) return;
            const cat = rnd(0, 3);
            const ranges = [[5, 18], [20, 35], [40, 90], [85, 95]];
            const [a, b] = ranges[cat];
            visitors.push({ id: nextId++, cat, min: rnd(a, b) });
            sel = visitors.length - 1;
            draw();
          }),
          btn('Remove selected', () => {
            if (crowdMode || visitors.length <= 6) return;
            visitors.splice(sel, 1);
            sel = Math.max(0, Math.min(sel, visitors.length - 1));
            draw();
          }),
          btn('Start again', () => {
            crowdMode = false;
            visitors = START.map(([cat, min], id) => ({ id, cat, min }));
            nextId = visitors.length;
            sel = 20;
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Make a stack of at least 4 dots at 30 minutes.',
      check: st => !st.crowd && st.countAt(30) >= 4,
      why: 'Yes! Every visitor with the same duration (30 minutes) stacks into one column.',
    },
    {
      text: 'Make a stack with at least 2 different colours at 50 minutes.',
      check: st => !st.crowd && st.coloursAt(50) >= 2,
      why: 'Right! A dot plot groups by the number on the line, so different reasons share a stack when their times match.',
    },
    {
      text: 'Drag the lonely outlier at 160 minutes closer to the rest until no outlier is left.',
      check: st => !st.crowd && st.outliers.length === 0 && st.removedOutlier,
      why: 'Nice! Once that long stay moves closer to the others, the wide gap disappears and no dot sits far away.',
    },
    {
      text: 'Press “New data (random)” twice, then try “Trap: 200 exact times” to see why dots blur.',
      check: st => st.randomCount >= 2 && st.sawCrowd,
      why: 'You saw both sides! Dot plots make small groups clear, while 200 exact-second times sit side by side and blur.',
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 360, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 24 : 36, X1 = VW - (NARROW ? 24 : 36);
  const AXIS_Y = 278;
  const DOT_R = NARROW ? 6.5 : 8;
  const STEP_Y = DOT_R * 2 + 4;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const xAt = m => X0 + (m / 160) * (X1 - X0);
  const mAt = x => Math.max(0, Math.min(160, Math.round(((x - X0) / (X1 - X0)) * 160)));

  function toggleCrowd() {
    crowdMode = !crowdMode;
    if (crowdMode) {
      crowdData = makeCrowd();
      sawCrowd = true;
    }
    draw();
  }

  function findOutliers(list) {
    const vals = list.map(v => v.min).sort((a, b) => a - b);
    const n = vals.length;
    if (n < 5) return [];
    const med = arr => {
      const m = Math.floor(arr.length / 2);
      return arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2;
    };
    const half = Math.floor(n / 2);
    const q1 = med(vals.slice(0, half));
    const q3 = med(vals.slice(n % 2 ? half + 1 : half));
    const iqr = Math.max(10, q3 - q1);
    const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
    return list.filter(v => v.min < lo || v.min > hi);
  }

  function computeLayout(list) {
    const bins = new Map();
    return list.map((v, idx) => {
      const key = v.min;
      const lvl = bins.get(key) || 0;
      bins.set(key, lvl + 1);
      return { idx, v, cx: xAt(v.min), cy: AXIS_Y - 14 - lvl * STEP_Y, lvl };
    });
  }

  function setMinute(index, newMin) {
    const before = findOutliers(visitors).length;
    visitors[index].min = Math.max(0, Math.min(160, newMin));
    const after = findOutliers(visitors).length;
    if (before > 0 && after === 0) removedOutlier = true;
    draw();
  }

  function bump(delta) {
    if (crowdMode || sel < 0 || sel >= visitors.length) return;
    setMinute(sel, visitors[sel].min + delta);
  }

  // Pointer drag interaction (works for mouse and touch)
  let dragging = -1;
  let renderedDots = [];
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    if (crowdMode) return;
    const p = toSvg(e);
    let best = -1, bestDist = NARROW ? 26 : 24;
    for (const item of renderedDots) {
      const d = Math.hypot(item.cx - p.x, item.cy - p.y);
      if (d < bestDist) { bestDist = d; best = item.idx; }
    }
    if (best >= 0) {
      sel = best;
      dragging = best;
      svg.setPointerCapture(e.pointerId);
      draw();
    }
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0 || crowdMode) return;
    const p = toSvg(e);
    const m = mAt(p.x);
    if (m !== visitors[dragging].min) setMinute(dragging, m);
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const k = [];

    // Subtle vertical grid lines & 0–160 ruler ticks
    for (let m = 0; m <= 160; m += 10) {
      const x = xAt(m);
      const major = m % 20 === 0;
      k.push(s('line', {
        x1: x, x2: x, y1: 42, y2: AXIS_Y,
        stroke: C.line, 'stroke-opacity': major ? 0.8 : 0.35, 'stroke-width': 1,
      }));
      k.push(s('line', {
        x1: x, x2: x, y1: AXIS_Y - (major ? 6 : 4), y2: AXIS_Y + (major ? 6 : 4),
        stroke: major ? C.ink : C.muted, 'stroke-width': major ? 2 : 1.2,
      }));
      if (!NARROW || major) {
        k.push(s('text', {
          x, y: AXIS_Y + 24, fill: major ? C.muted : '#52608a',
          'font-size': (NARROW ? 12 : 13) * F, 'text-anchor': 'middle', 'font-family': 'Consolas',
        }, m));
      }
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2.5 }),
      s('text', { x: X1, y: AXIS_Y + 46, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'duration (minutes)')
    );

    // Legend row along the bottom
    CATS.forEach((cat, i) => {
      const lx = X0 + i * (NARROW ? 88 : 115);
      const ly = AXIS_Y + 66;
      k.push(
        s('circle', { cx: lx + 6, cy: ly - 4, r: 6.5, fill: cat.col, 'fill-opacity': 0.22 }),
        s('circle', { cx: lx + 6, cy: ly - 4, r: 4, fill: cat.col }),
        s('text', { x: lx + 16, y: ly, fill: cat.col, 'font-size': (NARROW ? 12 : 13) * F, 'font-weight': 600, 'font-family': 'Segoe UI, Arial, sans-serif' }, cat.name)
      );
    });

    if (crowdMode) {
      renderedDots = [];
      // Badge at top
      const bw = NARROW ? 320 : 390;
      k.push(
        s('rect', { x: (VW - bw) / 2, y: 10, width: bw, height: 26, rx: 13, fill: C.bg, stroke: C.pink, 'stroke-width': 1.5 }),
        s('text', { x: VW / 2, y: 27, fill: C.pink, 'font-size': (NARROW ? 11.5 : 13) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '200 EXACT-SECOND VISITS · DOTS BLUR')
      );
      // Blur strip + 200 exact-second dots
      k.push(s('rect', { x: X0, y: AXIS_Y - 22, width: X1 - X0, height: 18, rx: 8, fill: C.cyan, 'fill-opacity': 0.2 }));
      const secBins = new Map();
      let maxStack = 0;
      for (const d of crowdData) {
        const lvl = secBins.get(d.sec) || 0;
        secBins.set(d.sec, lvl + 1);
        if (lvl + 1 > maxStack) maxStack = lvl + 1;
        const cx = xAt(d.min), cy = AXIS_Y - 12 - lvl * 12;
        const col = CATS[d.cat].col;
        k.push(s('circle', { cx, cy, r: 5.5, fill: col, 'fill-opacity': 0.72 }));
      }
      svg.replaceChildren(...k);

      const ex1 = crowdData[0], ex2 = crowdData[1];
      const fmtSec = sec => `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;
      fbox(box, [
        ['Visitors : 200 (exact seconds)', C.pink],
        `Examples : ${fmtSec(ex1.sec)}, ${fmtSec(ex2.sec)}`,
        `Tallest stack : ${maxStack} dot${maxStack === 1 ? '' : 's'}`,
        ['Pattern  : hidden in the blur!', C.pink],
      ]);
      crowdBtn.textContent = 'Back to 24 visitors';
      crowdBtn.className = 'sim-btn go';
      selLabel.textContent = 'Trap mode: exact seconds rarely match, so dots sit side by side.';
      note.textContent = 'Almost every visitor has a slightly different second, so dots refuse to stack and blur into one flat line.';
      chal.update({ crowd: true, countAt: () => 0, coloursAt: () => 0, outliers: [], removedOutlier, randomCount, sawCrowd });
      return;
    }

    // Normal interactive dot-plot mode
    renderedDots = computeLayout(visitors);
    const outliers = findOutliers(visitors);
    const outlierIds = new Set(outliers.map(v => v.id));

    // Top status pill
    const topTxt = outliers.length
      ? `OUTLIER FAR FROM REST: ${outliers.map(o => o.min + 'm').join(', ')}`
      : 'NO OUTLIERS · ALL DOTS NEAR THE GROUP';
    const topCol = outliers.length ? C.amber : C.green;
    const topW = NARROW ? 310 : 350;
    k.push(
      s('rect', { x: (VW - topW) / 2, y: 10, width: topW, height: 26, rx: 13, fill: C.bg, stroke: topCol, 'stroke-width': 1.5 }),
      s('text', { x: VW / 2, y: 27, fill: topCol, 'font-size': (NARROW ? 11.5 : 13) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, topTxt)
    );

    // Selected guide line
    const selItem = renderedDots[sel];
    if (selItem) {
      k.push(s('line', {
        x1: selItem.cx, x2: selItem.cx, y1: selItem.cy, y2: AXIS_Y,
        stroke: CATS[selItem.v.cat].col, 'stroke-width': 1.5, 'stroke-dasharray': '4 4',
      }));
    }

    // Draw dots
    for (const item of renderedDots) {
      const col = CATS[item.v.cat].col;
      const isSel = item.idx === sel;
      const isOut = outlierIds.has(item.v.id);
      if (isOut) {
        k.push(s('circle', { cx: item.cx, cy: item.cy, r: DOT_R + 7, fill: 'none', stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
      }
      if (isSel) {
        k.push(s('circle', { cx: item.cx, cy: item.cy, r: DOT_R + 5, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      }
      k.push(
        s('circle', { cx: item.cx, cy: item.cy, r: DOT_R * 1.7, fill: col, 'fill-opacity': isSel ? 0.34 : 0.20, style: 'cursor:grab' }),
        s('circle', { cx: item.cx, cy: item.cy, r: DOT_R, fill: col, style: 'cursor:grab' })
      );
    }

    // Floating value tag above selected dot
    if (selItem) {
      const tagX = Math.max(X0 + 36, Math.min(X1 - 36, selItem.cx));
      const tagY = Math.max(54, selItem.cy - DOT_R - 14);
      k.push(s('text', {
        x: tagX, y: tagY, fill: C.ink,
        'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
      }, `${selItem.v.min} min`));
    }

    svg.replaceChildren(...k);

    // Summary statistics for formula box and challenges
    const mins = visitors.map(v => v.min);
    const lo = Math.min(...mins), hi = Math.max(...mins);
    const byMin = new Map();
    for (const v of visitors) {
      if (!byMin.has(v.min)) byMin.set(v.min, []);
      byMin.get(v.min).push(v);
    }
    let maxH = 0, tallestAt = [];
    for (const [m, arr] of byMin.entries()) {
      if (arr.length > maxH) { maxH = arr.length; tallestAt = [m]; }
      else if (arr.length === maxH) tallestAt.push(m);
    }
    tallestAt.sort((a, b) => a - b);

    const cur = visitors[sel];
    const curStack = byMin.get(cur.min).length;
    const tallestTxt = tallestAt.length <= 4 ? tallestAt.join(', ') + ' min' : `${tallestAt.length} times`;

    const lines = [
      `Visitors : ${visitors.length} dots`,
      `Range    : ${lo} to ${hi} min`,
      [`Tallest  : ${maxH} dot${maxH === 1 ? '' : 's'} (at ${tallestTxt})`, C.cyan],
      [`Selected : ${CATS[cur.cat].name} · ${cur.min} min (stack ${curStack})`, CATS[cur.cat].col],
      outliers.length
        ? [`Outlier  : ${outliers.map(o => o.min).sort((a, b) => a - b).join(', ')} min`, C.amber]
        : ['Outlier  : none', C.green],
    ];
    fbox(box, lines);

    crowdBtn.textContent = 'Trap: 200 exact times';
    crowdBtn.className = 'sim-btn';
    selLabel.textContent = `Selected: ${CATS[cur.cat].name}, ${cur.min} min`;
    note.textContent = curStack > 1
      ? `${curStack} visitors stayed ${cur.min} minutes, so their dots share one stack above ${cur.min}.`
      : 'Read across the number line for minutes, and count dots upward for how many visitors.';

    const countAt = m => (byMin.get(m) || []).length;
    const coloursAt = m => new Set((byMin.get(m) || []).map(v => v.cat)).size;
    chal.update({
      crowd: false,
      countAt,
      coloursAt,
      outliers,
      removedOutlier,
      randomCount,
      sawCrowd,
      fmt,
    });
  }

  draw();
  return () => {};
}

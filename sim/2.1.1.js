// 2.1.1 Try it: bar charts, sorting, and the zero-scale trap.
// The learner drags category bars (or taps and uses -1 / +1), toggles dots vs bars,
// sorts longest to shortest, cuts off the scale to see how ratios stretch, and tests with random Saturdays.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const CATS = [
    { name: 'Borrow',   col: C.cyan },
    { name: 'Computer', col: C.violet },
    { name: 'Study',    col: C.amber },
    { name: 'Event',    col: C.pink },
  ];
  const START = [7, 5, 9, 3];

  let counts = START.slice();
  let sel = 2; // Study selected initially
  let sorted = false;
  let showDots = false;
  let scaleStart = 0;
  let isRandom = false;
  let countedThisRandom = false;
  let randomAtZero = 0;

  const svg = s('svg', { viewBox: '0 0 700 380' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const scaleVal = h('span', { class: 'sim-pill', style: { color: C.green, borderColor: C.green, margin: 0 } }, '0');
  const slider = h('input', {
    type: 'range', min: 0, max: 8, step: 1, value: 0,
    style: { flex: '1', minWidth: '140px', accentColor: C.pink, cursor: 'pointer' },
    oninput: e => { scaleStart = +e.target.value; draw(); },
  });
  const sortBtn = btn('Sort longest → shortest', () => { sorted = !sorted; draw(); }, 'go');
  const modeBtn = btn('Show dots', () => { showDots = !showDots; draw(); });
  const zeroBtn = btn('Back to 0', () => { scaleStart = 0; slider.value = 0; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: bar charts & the zero trap'),
    h('p', { class: 'sub' }, 'Drag any bar left or right to change its visitor count, or tap a row and use −1 / +1. Slide the scale start above 0 to see the trap.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { fontSize: '14px', color: C.muted, fontWeight: 600 } }, 'Scale starts at:'),
          slider, scaleVal, zeroBtn),
        h('div', { class: 'sim-row' },
          sortBtn,
          modeBtn,
          btn('New Saturday (random)', () => {
            do { counts = CATS.map(() => rnd(2, 12)); } while (Math.max(...counts) === Math.min(...counts));
            isRandom = true; countedThisRandom = false;
            clampScale(); draw();
          }),
          btn('Start again', () => {
            counts = START.slice(); sel = 2; sorted = false; showDots = false;
            scaleStart = 0; isRandom = false; countedThisRandom = false;
            clampScale(); draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Make Borrow the most common reason, with a count of 10.',
      check: st => st.counts[0] === 10 && st.counts[0] > st.counts[1] && st.counts[0] > st.counts[2] && st.counts[0] > st.counts[3],
      why: 'Yes! Borrow now has the longest bar (10 visitors), so you spot it right away.',
    },
    {
      text: 'Turn on “Sort longest → shortest” and adjust the bars so the total is exactly 30 visitors.',
      check: st => st.sorted && st.total === 30,
      why: 'Nice! Sorting puts the most common category at the top, and all four counts add up to 30.',
    },
    {
      text: 'Slide “Scale starts at” above 0 until “Looks like” is at least double “Real”.',
      check: st => st.scaleStart > 0 && st.realRatio > 1 && st.visRatio >= st.realRatio * 2,
      why: 'You caught the trap! Cutting off zero trims every bar on the left and stretches how large the gap looks.',
    },
    {
      text: 'Press “New Saturday (random)” twice, and make sure the scale is at 0 each time.',
      check: st => st.randomAtZero >= 2 && st.scaleStart === 0,
      why: 'Always check for zero! For any new data, starting the scale at 0 keeps every bar true to its count.',
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 380, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 90 : 118, X1 = VW - (NARROW ? 34 : 52);
  const TOP = 46, AXIS_Y = 320, ROW_H = (AXIS_Y - TOP) / 4, BH = ROW_H * 0.54;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const order = () => {
    const idx = [0, 1, 2, 3];
    return sorted ? idx.sort((a, b) => counts[b] - counts[a] || a - b) : idx;
  };
  const maxVal = () => Math.max(10, ...counts);
  const clampScale = () => {
    const mx = Math.max(2, Math.max(...counts) - 1);
    slider.max = mx;
    if (scaleStart > mx) scaleStart = mx;
    slider.value = scaleStart;
  };
  const stepPx = () => (X1 - X0) / Math.max(1, maxVal() - scaleStart);
  const bump = d => { counts[sel] = Math.max(1, Math.min(15, counts[sel] + d)); clampScale(); draw(); };

  // Drag any bar horizontally to change its count
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const v = Math.round(scaleStart + (p.x - X0) / stepPx());
    counts[dragging] = Math.max(1, Math.min(15, v));
    clampScale(); draw();
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const r = Math.floor((p.y - TOP) / ROW_H);
    if (r < 0 || r >= 4) return;
    const ord = order();
    sel = ord[r]; dragging = sel;
    svg.setPointerCapture(e.pointerId);
    if (p.x >= X0 - 12) move(e); else draw();
  });
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    clampScale();
    if (isRandom && !countedThisRandom && scaleStart === 0) {
      randomAtZero++;
      countedThisRandom = true;
    }

    const ord = order();
    const mx = maxVal();
    const sp = stepPx();
    const k = [];

    // Warning or safe badge at top of chart
    if (scaleStart > 0) {
      k.push(
        s('rect', { x: X0, y: 10, width: NARROW ? 218 : 258, height: 24, rx: 12, fill: C.bg, stroke: C.pink, 'stroke-width': 1.5 }),
        s('text', { x: X0 + (NARROW ? 109 : 129), y: 26, fill: C.pink, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `SCALE STARTS AT ${scaleStart} (CUT OFF!)`));
    } else {
      k.push(
        s('rect', { x: X0, y: 10, width: NARROW ? 156 : 180, height: 24, rx: 12, fill: C.bg, stroke: C.green, 'stroke-width': 1.5 }),
        s('text', { x: X0 + (NARROW ? 78 : 90), y: 26, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'SCALE STARTS AT 0 ✓'));
    }

    // Vertical gridlines & scale ticks from scaleStart to mx
    const tickStep = (NARROW && (mx - scaleStart) > 10) ? 2 : 1;
    for (let g = scaleStart; g <= mx; g++) {
      const x = X0 + (g - scaleStart) * sp;
      const isAxis = g === scaleStart;
      k.push(s('line', {
        x1: x, x2: x, y1: TOP, y2: AXIS_Y,
        stroke: isAxis ? (scaleStart > 0 ? C.pink : C.green) : C.line,
        'stroke-width': isAxis ? 2.5 : 1,
        'stroke-dasharray': (isAxis && scaleStart > 0) ? '6 4' : null,
      }));
      if (isAxis || g === mx || (g - scaleStart) % tickStep === 0) {
        const col = isAxis ? (scaleStart > 0 ? C.pink : C.green) : C.muted;
        k.push(
          s('line', { x1: x, x2: x, y1: AXIS_Y, y2: AXIS_Y + 6, stroke: col, 'stroke-width': 2 }),
          s('text', { x, y: AXIS_Y + 24, fill: col, 'font-size': 13 * F, 'font-weight': isAxis ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g));
      }
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2.5 }),
      s('text', { x: X1, y: AXIS_Y + 46, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'visitors'));

    // Draw 4 category rows
    ord.forEach((catIdx, r) => {
      const cat = CATS[catIdx];
      const val = counts[catIdx];
      const drawn = Math.max(0, val - scaleStart);
      const cy = TOP + ROW_H * (r + 0.5);

      if (catIdx === sel) {
        k.push(s('rect', { x: 6, y: TOP + ROW_H * r + 4, width: VW - 12, height: ROW_H - 8, rx: 10, fill: '#ffffff', 'fill-opacity': 0.05 }));
      }
      // Category label
      k.push(s('text', {
        x: X0 - 10, y: cy + 5, fill: cat.col, 'font-size': (NARROW ? 14 : 16) * F,
        'font-weight': catIdx === sel ? 700 : 600, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial, sans-serif',
      }, cat.name));

      if (showDots) {
        for (let j = scaleStart; j < val; j++) {
          const dx = X0 + (j - scaleStart + 0.5) * sp;
          const dr = Math.min(BH * 0.34, sp * 0.34);
          k.push(
            s('circle', { cx: dx, cy, r: dr * 1.6, fill: cat.col, 'fill-opacity': 0.18 }),
            s('circle', { cx: dx, cy, r: dr, fill: cat.col }));
        }
      } else if (drawn > 0) {
        const bw = drawn * sp;
        k.push(s('rect', {
          x: X0, y: cy - BH / 2, width: bw, height: BH, rx: 4,
          fill: cat.col, 'fill-opacity': 0.84, stroke: cat.col, 'stroke-width': 1.5,
        }));
        // Subtle 1-visitor step dividers inside the bar
        for (let j = 1; j < drawn; j++) {
          const sx = X0 + j * sp;
          k.push(s('line', { x1: sx, x2: sx, y1: cy - BH / 2 + 2, y2: cy + BH / 2 - 2, stroke: C.bg, 'stroke-opacity': 0.35, 'stroke-width': 1 }));
        }
      }

      // Real count label at tip of bar
      const tipX = X0 + drawn * sp + 8;
      k.push(s('text', {
        x: tipX, y: cy + 5, fill: drawn === 0 ? C.pink : cat.col,
        'font-size': (NARROW ? 14 : 16) * F, 'font-weight': 700, 'font-family': 'Consolas',
      }, drawn === 0 ? `${val} (hidden)` : String(val)));
    });

    svg.replaceChildren(...k);

    // Formula box + comparison math
    const total = counts.reduce((a, b) => a + b, 0);
    let hiIdx = 0, loIdx = 0;
    for (let i = 1; i < 4; i++) {
      if (counts[i] > counts[hiIdx]) hiIdx = i;
      if (counts[i] < counts[loIdx]) loIdx = i;
    }
    const hi = { name: CATS[hiIdx].name, n: counts[hiIdx] };
    const lo = { name: CATS[loIdx].name, n: counts[loIdx] };
    const realRatio = hi.n / lo.n;
    const hiDraw = Math.max(0, hi.n - scaleStart);
    const loDraw = Math.max(0, lo.n - scaleStart);
    const visRatio = loDraw === 0 ? (hiDraw > 0 ? Infinity : 1) : hiDraw / loDraw;

    const lines = [
      ...ord.map(i => [`${CATS[i].name.padEnd(9)}: ${counts[i]}`, CATS[i].col]),
      `Total    : ${total} visitors`,
      [`Real       : ${hi.n} ÷ ${lo.n} = ${fmt(realRatio)}×`, C.green],
    ];
    if (scaleStart === 0) {
      lines.push(['Looks like : same (starts at 0)', C.cyan]);
    } else if (loDraw === 0) {
      lines.push([`Looks like : ${lo.name} bar vanished!`, C.pink]);
    } else {
      lines.push([`Looks like : ${hiDraw} ÷ ${loDraw} = ${fmt(visRatio)}×`, C.pink]);
    }
    fbox(box, lines);

    // Live buttons & labels
    sortBtn.textContent = sorted ? 'Original order' : 'Sort longest → shortest';
    modeBtn.textContent = showDots ? 'Show bars' : 'Show dots';
    zeroBtn.className = 'sim-btn ' + (scaleStart > 0 ? 'go' : 'ghost');
    scaleVal.textContent = String(scaleStart);
    scaleVal.style.color = scaleStart > 0 ? C.pink : C.green;
    scaleVal.style.borderColor = scaleStart > 0 ? C.pink : C.green;
    selLabel.textContent = `Selected: ${CATS[sel].name} (${counts[sel]} visitors)`;
    note.textContent = scaleStart > 0
      ? `Scale starts at ${scaleStart}: every bar loses ${scaleStart} step${scaleStart === 1 ? '' : 's'} on the left, so ${hi.name} looks much longer than ${lo.name} than it really is.`
      : `Each bar’s length matches its count. ${hi.name} (${hi.n}) is ${fmt(realRatio)}× as large as ${lo.name} (${lo.n}).`;

    chal.update({
      counts: counts.slice(), total, sorted, scaleStart,
      realRatio: Math.round(realRatio * 1000) / 1000,
      visRatio: Number.isFinite(visRatio) ? Math.round(visRatio * 1000) / 1000 : Infinity,
      randomAtZero,
    });
  }

  draw();
  return () => {};
}

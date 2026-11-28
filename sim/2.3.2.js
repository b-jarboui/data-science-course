// 2.3.2 Try it: axis baselines.
// Move the baseline from 0 upward, drag any route's on-time percent, switch between
// bars and dots/line, try random routes, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [96, 94, 92];
  const NAMES = ['Route A', 'Route B', 'Route C'];
  const COLS = [C.cyan, C.amber, C.violet];

  let v = START.slice();
  let base = 0;
  let mode = 'bars'; // 'bars' | 'dots'
  let sel = 0;
  let random = false;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const baseRead = h('span', { class: 'sim-pill', style: { color: C.green, borderColor: C.green } }, 'BASELINE: 0%');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', {
    type: 'range', min: 0, max: 91, value: 0, step: 1,
    'aria-label': 'Axis baseline',
    style: { flex: '1 1 180px', minHeight: '36px', cursor: 'pointer', accentColor: C.pink },
    oninput: e => { base = +e.target.value; draw(); }
  });
  const btnBars = btn('Bars', () => { mode = 'bars'; draw(); }, 'go');
  const btnDots = btn('Dots & line', () => { mode = 'dots'; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: where the axis starts'),
    h('p', { class: 'sub' }, 'Slide the baseline up to cut the axis, or drag any route up or down. Watch how bar lengths stretch even when the real values stay close.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          baseRead, slider,
          btn('−1', () => bumpBase(-1)), btn('+1', () => bumpBase(1))),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Baseline = 0 (honest)', () => { base = 0; draw(); }, 'go'),
          btn('Baseline = 90 (cut)', () => { base = Math.min(90, maxBase()); draw(); }),
          btnBars, btnDots),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Route −1', () => bumpVal(-1)), btn('Route +1', () => bumpVal(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New routes (random)', () => newRoutes()),
          btn('Start again', () => { v = START.slice(); base = 0; mode = 'bars'; sel = 0; random = false; draw(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const minVal = () => Math.min(...v);
  const maxVal = () => Math.max(...v);
  const maxBase = () => Math.max(0, minVal() - 1);
  const r2 = x => Math.round(x * 100) / 100;

  function bumpBase(d) {
    base = Math.max(0, Math.min(maxBase(), base + d));
    draw();
  }
  function bumpVal(d) {
    v[sel] = Math.max(10, Math.min(100, v[sel] + d));
    if (base >= minVal()) base = maxBase();
    draw();
  }
  function newRoutes() {
    const lo = rnd(68, 90);
    const spread = rnd(3, Math.min(8, 99 - lo));
    const mid = lo + rnd(1, spread - 1);
    const arr = [lo + spread, mid, lo];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    v = arr;
    base = 0;
    mode = 'bars';
    random = true;
    draw();
  }

  const chal = challenges(ch, [
    {
      text: 'Move the baseline up to 90 so Route A’s bar looks 3 times as tall as Route C’s.',
      check: st => st.mode === 'bars' && st.base === 90 && Math.abs(st.barRatio - 3) < 0.05,
      why: 'Yes! Above 90, Route A is 6 units tall and Route C is 2 units tall — 3 times as tall, even though the real gap is only 4 points.'
    },
    {
      text: 'Keep the routes at 96, 94, and 92, and raise the baseline until the tallest bar looks at least 5 times the shortest.',
      check: st => st.mode === 'bars' && st.v[0] === 96 && st.v[1] === 94 && st.v[2] === 92 && st.barRatio >= 5,
      why: 'At baseline 91, Route A is 5 units and Route C is 1 unit. The closer the baseline gets to the lowest bar, the more it stretches the gap.'
    },
    {
      text: 'Keep the zoomed-in axis (baseline at least 80) and switch to “Dots & line” to show the small gap honestly.',
      check: st => st.mode === 'dots' && st.base >= 80,
      why: 'Right: dots and a line let you zoom in on small changes without filled bar lengths misleading the eye.'
    },
    {
      text: 'Press “New routes (random)” and raise the baseline until a small gap looks at least 3 times as big in Bars view.',
      check: st => st.random && st.mode === 'bars' && st.base > 0 && st.barRatio >= 3 && st.realRatio <= 1.25,
      why: 'It works on any close numbers: cutting the axis always makes a small real gap look much larger.'
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 420, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 52 : 66, X1 = VW - 18, BASE = 356, TOP = 42;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const slot = () => (X1 - X0) / 3;
  const yOf = val => BASE - ((val - base) / (100 - base)) * (BASE - TOP);

  // Drag bars/dots vertically to change values
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const i = Math.floor((p.x - X0) / slot());
    if (i < 0 || i > 2) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const frac = (BASE - p.y) / (BASE - TOP);
    const val = Math.round(base + frac * (100 - base));
    v[dragging] = Math.max(Math.max(10, base + 1), Math.min(100, val));
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function tickValues(b) {
    const span = 100 - b;
    const step = span > 50 ? 20 : span > 25 ? 10 : span > 12 ? 5 : span > 6 ? 2 : 1;
    const out = [b];
    const first = Math.ceil((b + 0.001) / step) * step;
    for (let g = first; g < 100; g += step) {
      if (g - b >= step * 0.45 && 100 - g >= step * 0.45) out.push(g);
    }
    out.push(100);
    return out;
  }

  function draw() {
    if (base > maxBase()) base = maxBase();
    slider.max = String(maxBase());
    slider.value = String(base);

    const hi = maxVal(), lo = minVal();
    const hiLen = hi - base, loLen = lo - base;
    const barRatio = hiLen / loLen;
    const realRatio = hi / lo;
    const gap = hi - lo;
    const isHonest = base === 0;
    const sl = slot(), bw = Math.min(92, sl * 0.48);

    const k = [];
    // Grid + axis ticks
    for (const g of tickValues(base)) {
      const y = yOf(g);
      const isBase = g === base;
      const col = isBase ? (isHonest ? C.green : C.pink) : C.muted;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: isBase ? col : C.line, 'stroke-width': isBase ? 3 : 1 }),
        s('text', { x: X0 - 10, y: y + 5, fill: col, 'font-size': 13 * F, 'font-weight': isBase ? 700 : 400, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${g}%`)
      );
    }
    // Y-axis line
    k.push(s('line', { x1: X0, x2: X0, y1: TOP - 10, y2: BASE, stroke: C.muted, 'stroke-width': 2.5 }));

    // Column highlights for selected route
    v.forEach((val, i) => {
      const cx = X0 + sl * (i + 0.5);
      if (i === sel) {
        k.push(s('rect', { x: cx - sl / 2 + 6, y: TOP - 8, width: sl - 12, height: BASE - TOP + 8, fill: '#ffffff', 'fill-opacity': 0.04, rx: 10 }));
      }
    });

    // Data: Bars or Dots & line
    if (mode === 'bars') {
      v.forEach((val, i) => {
        const cx = X0 + sl * (i + 0.5);
        const y = yOf(val);
        const hgt = Math.max(2, BASE - y);
        const len = val - base;
        k.push(
          s('rect', { x: cx - bw / 2, y, width: bw, height: hgt, fill: COLS[i], 'fill-opacity': 0.82, stroke: COLS[i], 'stroke-width': 2, rx: 4 }),
          s('text', { x: cx, y: y - 10, fill: COLS[i], 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${val}%`)
        );
        if (!isHonest && hgt > 26) {
          k.push(s('text', { x: cx, y: y + hgt / 2 + 5, fill: C.bg, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${len}u`));
        }
      });
    } else {
      const pts = v.map((val, i) => [X0 + sl * (i + 0.5), yOf(val)]);
      k.push(
        s('line', { x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1], stroke: C.ink, 'stroke-width': 3 }),
        s('line', { x1: pts[1][0], y1: pts[1][1], x2: pts[2][0], y2: pts[2][1], stroke: C.ink, 'stroke-width': 3 })
      );
      v.forEach((val, i) => {
        const [cx, cy] = pts[i];
        k.push(
          s('circle', { cx, cy, r: 16, fill: COLS[i], 'fill-opacity': 0.22 }),
          s('circle', { cx, cy, r: 8, fill: COLS[i] }),
          s('text', { x: cx, y: cy - 18, fill: COLS[i], 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${val}%`)
        );
      });
    }

    // Route labels along bottom
    v.forEach((_, i) => {
      const cx = X0 + sl * (i + 0.5);
      k.push(s('text', { x: cx, y: BASE + 28, fill: COLS[i], 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif' }, NAMES[i]));
    });

    // Status pill inside top-right of chart
    const pillCol = mode === 'dots' ? C.cyan : isHonest ? C.green : C.pink;
    const pillTxt = mode === 'dots' ? 'DOTS & LINE' : isHonest ? 'HONEST (FROM 0)' : `CUT AT ${base}% · ${fmt(r2(barRatio))}×`;
    const pw = Math.max(145, pillTxt.length * 9.2) * F;
    k.push(
      s('rect', { x: X1 - pw, y: 6, width: pw, height: 26 * F, rx: 13 * F, fill: C.bg, stroke: pillCol, 'stroke-width': 1.5 }),
      s('text', { x: X1 - pw / 2, y: 6 + 17.5 * F, fill: pillCol, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, pillTxt)
    );

    svg.replaceChildren(...k);

    // Update controls
    baseRead.textContent = `BASELINE: ${base}%`;
    baseRead.style.color = isHonest ? C.green : C.pink;
    baseRead.style.borderColor = isHonest ? C.green : C.pink;
    btnBars.className = 'sim-btn ' + (mode === 'bars' ? 'go' : '');
    btnDots.className = 'sim-btn ' + (mode === 'dots' ? 'go' : '');
    selLabel.textContent = `Selected: ${NAMES[sel]} (${v[sel]}%)`;

    // Formula box
    const lens = v.map(x => x - base);
    fbox(box, [
      ['bar length = value − baseline', C.ink],
      `A: ${v[0]} − ${base} = ${lens[0]}   B: ${lens[1]}   C: ${lens[2]}`,
      [mode === 'bars'
        ? `bars: ${hiLen} ÷ ${loLen} = ${fmt(r2(barRatio))}× taller`
        : `dots: zoomed to ${base}%–100% (no filled bars)`,
        mode === 'dots' ? C.cyan : isHonest ? C.green : C.pink],
      [`real: ${hi}% vs ${lo}% (gap = ${gap} pts, ${fmt(r2(realRatio))}×)`, C.green],
    ]);

    // Plain-word explanation
    if (mode === 'dots') {
      note.textContent = 'Dots and a line show small changes clearly without filled bar lengths stretching the comparison.';
    } else if (isHonest) {
      note.textContent = 'Baseline is 0: every bar’s length matches its whole value, so your eye reads the real gap fairly.';
    } else {
      note.textContent = `Axis cut at ${base}%: the tallest bar looks ${fmt(r2(barRatio))}× the shortest, even though the real gap is only ${gap} points.`;
    }

    chal.update({ v: v.slice(), base, mode, barRatio, realRatio, gap, random });
  }

  draw();
  return () => {};
}

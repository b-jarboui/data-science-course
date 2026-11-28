// 10.1.4 Try it: ordinary least squares.
// Tilt and shift the line with sliders, drag any apartment dot up or down,
// snap to the least squares line, generate random apartments, and test 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START = [
    { area: 40,  rent: 860,  bld: 'X', col: C.cyan,  dx: 0,  dir: 1 },
    { area: 40,  rent: 770,  bld: 'Y', col: C.amber, dx: -7, dir: -1 },
    { area: 40,  rent: 770,  bld: 'Z', col: C.pink,  dx: 7,  dir: 1 },
    { area: 60,  rent: 1040, bld: 'X', col: C.cyan,  dx: 0,  dir: 1 },
    { area: 60,  rent: 1020, bld: 'Y', col: C.amber, dx: 0,  dir: -1 },
    { area: 60,  rent: 940,  bld: 'Z', col: C.pink,  dx: 0,  dir: 1 },
    { area: 80,  rent: 1250, bld: 'X', col: C.cyan,  dx: 0,  dir: -1 },
    { area: 80,  rent: 1210, bld: 'Y', col: C.amber, dx: 0,  dir: 1 },
    { area: 80,  rent: 1140, bld: 'Z', col: C.pink,  dx: 0,  dir: -1 },
    { area: 100, rent: 1470, bld: 'X', col: C.cyan,  dx: 0,  dir: -1 },
    { area: 100, rent: 1380, bld: 'Y', col: C.amber, dx: 0,  dir: 1 },
    { area: 100, rent: 1350, bld: 'Z', col: C.pink,  dx: 0,  dir: -1 },
  ];

  let pts = START.map(p => ({ ...p }));
  let slope = 10, intercept = 400;
  let anim = 0, showSq = true;
  let hadHigh = false, manual = false, hasOutlier = false, outlierSnapped = false;
  let isRandom = false, randomSnaps = 0, snappedRandom = false;

  const svg = s('svg', { viewBox: '0 0 700 430' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const slopeVal = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '8.5rem', fontFamily: 'Consolas, monospace' } });
  const icVal = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '8.5rem', fontFamily: 'Consolas, monospace' } });
  const slopeInput = h('input', { type: 'range', min: '0', max: '20', step: '0.5', value: String(slope), style: { flex: '1 1 10rem' } });
  const icInput = h('input', { type: 'range', min: '-200', max: '1400', step: '10', value: String(intercept), style: { flex: '1 1 10rem' } });
  const sqBtn = btn('Hide squares', () => { showSq = !showSq; sqBtn.textContent = showSq ? 'Hide squares' : 'Show squares'; draw(); });

  slopeInput.addEventListener('input', () => {
    cancelAnimationFrame(anim);
    slope = +slopeInput.value;
    manual = true;
    draw();
  });
  icInput.addEventListener('input', () => {
    cancelAnimationFrame(anim);
    intercept = +icInput.value;
    manual = true;
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: ordinary least squares'),
    h('p', { class: 'sub' }, 'Move the sliders to tilt or shift the line, or drag any apartment dot up and down. Each square’s area is one squared residual.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slopeVal, slopeInput),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, icVal, icInput),
        h('div', { class: 'sim-row' },
          btn('Snap to best line', () => snapToBest(), 'go'),
          btn('Flat line (mean)', () => goFlat()),
          btn('Add an outlier', () => addOutlier()),
          btn('New apartments (random)', () => newData()),
          sqBtn,
          btn('Start again', () => reset()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function ols(list = pts) {
    const n = list.length;
    const mx = list.reduce((a, p) => a + p.area, 0) / n;
    const my = list.reduce((a, p) => a + p.rent, 0) / n;
    let sxx = 0, sxy = 0;
    for (const p of list) { sxx += (p.area - mx) ** 2; sxy += (p.area - mx) * (p.rent - my); }
    const m = sxx > 0 ? sxy / sxx : 0;
    const b = my - m * mx;
    const minSsr = list.reduce((a, p) => a + (p.rent - (b + m * p.area)) ** 2, 0);
    return { mx, my, m, b, minSsr };
  }

  function stats() {
    const best = ols();
    let sumRes = 0, ssr = 0;
    for (const p of pts) {
      const r = p.rent - (intercept + slope * p.area);
      sumRes += r;
      ssr += r * r;
    }
    return { best, sumRes, ssr };
  }

  const chal = challenges(ch, [
    {
      text: 'Press “Flat line (mean)”. Check both totals in the formula box.',
      check: st => st.isFlat,
      why: 'The plain residual sum is 0 because plus and minus cancel, while the sum of squares explodes — proving the flat line fits poorly.',
    },
    {
      text: 'From a flat or tilted line, move the slope and intercept sliders yourself until the sum of squares is within 10% of the lowest possible.',
      check: st => st.hadHigh && st.manual && st.ssr <= st.minSsr * 1.10,
      why: 'Nice! You climbed down to the bottom of the bowl, where the total area of the squares is as small as possible.',
    },
    {
      text: 'Drag one apartment far away from the line (or press “Add an outlier”), then press “Snap to best line”.',
      check: st => st.outlierSnapped,
      why: 'Because squaring makes big misses cost much more, one strange apartment can pull the whole least squares line toward it.',
    },
    {
      text: 'Press “New apartments (random)” and then “Snap to best line”, twice. Does the best line always hit the green centre dot?',
      check: st => st.randomSnaps >= 2,
      why: 'Every single time! Ordinary least squares always passes through the centre (mean area, mean rent) of the data.',
    },
  ]);

  function animateTo(targetB, targetM, onDone) {
    cancelAnimationFrame(anim);
    const fromB = intercept, fromM = slope, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 650);
      const e = k * k * (3 - 2 * k);
      intercept = fromB + (targetB - fromB) * e;
      slope = fromM + (targetM - fromM) * e;
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
      else if (onDone) onDone();
    };
    anim = requestAnimationFrame(step);
  }

  function snapToBest() {
    const best = ols();
    manual = false;
    if (hasOutlier) outlierSnapped = true;
    if (isRandom && !snappedRandom) { snappedRandom = true; randomSnaps++; }
    animateTo(best.b, best.m);
  }

  function goFlat() {
    const best = ols();
    manual = false;
    animateTo(best.my, 0);
  }

  function addOutlier() {
    cancelAnimationFrame(anim);
    if (pts.length < 13) {
      pts.push({ area: 100, rent: 700, bld: '!', col: C.pink, dx: 0, dir: -1, isOutlier: true });
    } else {
      pts[pts.length - 1].rent = 700;
    }
    hasOutlier = true;
    draw();
  }

  function newData() {
    cancelAnimationFrame(anim);
    const trueM = rnd(6, 13), trueB = rnd(260, 560);
    const areas = [40, 60, 80, 100];
    const blds = [['X', C.cyan], ['Y', C.amber], ['Z', C.pink]];
    pts = [];
    for (const a of areas) {
      blds.forEach(([bld, col], j) => {
        const rent = Math.max(550, Math.min(1750, Math.round((trueB + trueM * a + rnd(-80, 80)) / 10) * 10));
        pts.push({ area: a, rent, bld, col, dx: 0, dir: (a <= 60 ? 1 : -1) * (j === 1 ? -1 : 1) });
      });
    }
    // Offset any identical points slightly so every dot is distinct
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].area === pts[j].area && pts[i].rent === pts[j].rent) {
          pts[i].dx = -7; pts[j].dx = 7;
        }
      }
    }
    const best = ols();
    // Start slightly tilted away so snapping visibly moves to the centre & minimum
    slope = Math.max(0, Math.min(20, Math.round((best.m + (best.m > 10 ? -4 : 4)) * 2) / 2));
    intercept = Math.round((best.my - slope * best.mx + rnd(-60, 60)) / 10) * 10;
    isRandom = true; snappedRandom = false; hasOutlier = false; manual = false;
    draw();
  }

  function reset() {
    cancelAnimationFrame(anim);
    pts = START.map(p => ({ ...p }));
    slope = 10; intercept = 400;
    isRandom = false; snappedRandom = false; hasOutlier = false; manual = false;
    draw();
  }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 430, F = NARROW ? 1.22 : 1;
  const X0 = NARROW ? 56 : 68, X1 = VW - 18, Y0 = 42, Y1 = 372;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function yRange() {
    const ys = pts.map(p => p.rent);
    const lo = Math.min(600, Math.floor((Math.min(...ys) - 80) / 100) * 100);
    const hi = Math.max(1600, Math.ceil((Math.max(...ys) + 80) / 100) * 100);
    return [lo, hi];
  }
  const sx = a => X0 + (a - 30) / 80 * (X1 - X0);
  const sy = (r, lo, hi) => Y1 - (r - lo) / (hi - lo) * (Y1 - Y0);
  const invY = (py, lo, hi) => lo + (Y1 - py) / (Y1 - Y0) * (hi - lo);

  // Drag any apartment dot vertically
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), [lo, hi] = yRange();
    let bestI = -1, bestD = 28 * F;
    pts.forEach((pt, i) => {
      const dx = sx(pt.area) + pt.dx - p.x, dy = sy(pt.rent, lo, hi) - p.y;
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; bestI = i; }
    });
    if (bestI < 0) return;
    dragging = bestI;
    svg.setPointerCapture(e.pointerId);
    cancelAnimationFrame(anim);
    dragMove(e);
  });
  function dragMove(e) {
    if (dragging < 0) return;
    const p = toSvg(e), [lo, hi] = yRange();
    const nextRent = Math.max(450, Math.min(1950, Math.round(invY(p.y, lo, hi) / 10) * 10));
    pts[dragging].rent = nextRent;
    const baseFit = 400 + 10 * pts[dragging].area;
    if (Math.abs(nextRent - baseFit) >= 240) hasOutlier = true;
    draw();
  }
  svg.addEventListener('pointermove', dragMove);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  const comma = n => Math.round(n).toLocaleString('en-US');

  function draw() {
    const { best, sumRes, ssr } = stats();
    const [lo, hi] = yRange();
    const atBest = ssr <= best.minSsr * 1.005 + 1;
    if (ssr > best.minSsr * 1.5 + 10000) hadHigh = true;

    const k = [];
    // Grid & axes
    const stepY = (hi - lo) > 1200 ? 300 : 200;
    for (let r = Math.ceil(lo / stepY) * stepY; r <= hi; r += stepY) {
      const y = sy(r, lo, hi);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, comma(r)));
    }
    k.push(s('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X0, y1: Y0, y2: Y1, stroke: C.muted, 'stroke-width': 2 }));
    for (const a of [40, 60, 80, 100]) {
      const x = sx(a);
      k.push(s('line', { x1: x, x2: x, y1: Y1, y2: Y1 + 6, stroke: C.muted, 'stroke-width': 2 }),
        s('text', { x, y: Y1 + 22 * F, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a));
    }
    k.push(s('text', { x: (X0 + X1) / 2, y: VH - 8, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'area (square metres)'),
      s('text', { x: X0 + 6, y: Y0 - 12, fill: C.muted, 'font-size': 13 * F }, 'rent ($)'));

    // Squares & residual sticks
    const sqFillOp = slope === 0 ? 0.14 : 0.25;
    pts.forEach(pt => {
      const px = sx(pt.area) + pt.dx;
      const yDot = sy(pt.rent, lo, hi);
      const yFit = sy(intercept + slope * pt.area, lo, hi);
      const hgt = Math.abs(yDot - yFit);
      const topY = Math.min(yDot, yFit);
      if (showSq && hgt > 1) {
        let dir = slope === 0 ? (pt.area <= 65 ? 1 : -1) : pt.dir;
        if (dir > 0 && px + hgt > X1) dir = -1;
        if (dir < 0 && px - hgt < X0) dir = 1;
        const rx = dir > 0 ? px : px - hgt;
        k.push(s('rect', {
          x: Math.max(X0, rx), y: topY,
          width: Math.min(hgt, X1 - Math.max(X0, rx)), height: hgt,
          fill: pt.col, 'fill-opacity': sqFillOp, stroke: pt.col, 'stroke-opacity': 0.75, 'stroke-width': 1.2,
        }));
      }
      k.push(s('line', { x1: px, x2: px, y1: yDot, y2: yFit, stroke: pt.col, 'stroke-width': 2.2 }));
    });

    // Current line clipped to [32, 108]
    const a1 = 32, a2 = 108;
    const lineCol = atBest ? '#ffffff' : C.amber;
    k.push(s('line', {
      x1: sx(a1), y1: sy(intercept + slope * a1, lo, hi),
      x2: sx(a2), y2: sy(intercept + slope * a2, lo, hi),
      stroke: lineCol, 'stroke-width': 3.2,
    }));

    // Green centre point (mean area, mean rent)
    const cx = sx(best.mx), cy = sy(best.my, lo, hi);
    k.push(
      s('circle', { cx, cy, r: 10, fill: C.green, 'fill-opacity': 0.22, stroke: C.green, 'stroke-width': 1.6, 'stroke-dasharray': '3 2' }),
      s('circle', { cx, cy, r: 4, fill: C.green })
    );

    // Apartment dots
    pts.forEach((pt, i) => {
      const px = sx(pt.area) + pt.dx, py = sy(pt.rent, lo, hi);
      k.push(
        s('circle', { cx: px, cy: py, r: (i === dragging ? 13 : 9.5), fill: pt.col, 'fill-opacity': 0.24, style: 'cursor:ns-resize' }),
        s('circle', { cx: px, cy: py, r: 5.5, fill: pt.col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor:ns-resize' })
      );
      if (pt.isOutlier) {
        k.push(s('text', { x: px - 12, y: py + 4, fill: C.pink, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'outlier'));
      }
    });

    // Top-right badge for sum of squares
    const badgeCol = atBest ? C.green : C.amber;
    const bw = (NARROW ? 185 : 210), bh = 28 * F;
    k.push(
      s('rect', { x: X1 - bw, y: 6, width: bw, height: bh, rx: bh / 2, fill: C.bg, stroke: badgeCol, 'stroke-width': 1.5 }),
      s('text', { x: X1 - bw / 2, y: 6 + bh * 0.68, fill: badgeCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'SQUARES ' + comma(ssr))
    );

    svg.replaceChildren(...k);

    // Sync sliders & labels
    slopeInput.value = String(Math.max(0, Math.min(20, slope)));
    icInput.value = String(Math.max(-200, Math.min(1400, intercept)));
    slopeVal.textContent = `Slope: ${fmt(Math.round(slope * 100) / 100)}`;
    icVal.textContent = `Intercept: ${fmt(Math.round(intercept))}`;

    // Formula box
    const sign = slope >= 0 ? '+' : '−';
    const rSumStr = Math.abs(sumRes) < 0.5 ? '0' : (sumRes > 0 ? '+' : '−') + comma(Math.abs(sumRes));
    fbox(box, [
      `rent = ${fmt(Math.round(intercept))} ${sign} ${fmt(Math.round(Math.abs(slope) * 100) / 100)} × area`,
      `plain residual sum = ${rSumStr}`,
      [`sum of squares     = ${comma(ssr)}`, badgeCol],
      [`lowest possible    = ${comma(best.minSsr)}`, C.muted],
      [`centre: (${fmt(Math.round(best.mx * 10) / 10)} m², $${comma(best.my)})`, C.green],
    ]);

    note.textContent = atBest
      ? 'At the bottom of the bowl! This is the ordinary least squares line, and it passes right through the green centre dot.'
      : 'Every square shows one squared residual. Try shrinking the total area of the squares, or press “Snap to best line”.';

    const isFlat = Math.abs(slope) < 0.05 && Math.abs(intercept - best.my) < 12;
    chal.update({ isFlat, hadHigh, manual, ssr, minSsr: best.minSsr, outlierSnapped, randomSnaps });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

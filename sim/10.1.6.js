// 10.1.6 Try it: R-squared as the share of rent variation explained.
// Drag apartments up or down (or tap and use -$20 / +$20), switch between line sticks
// and baseline sticks, double all rents to test the "share, not dollars" trap, and make random data.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BCOL = { X: C.cyan, Y: C.amber, Z: C.pink };
  const BDX = { X: -1.6, Y: 0, Z: 1.6 }; // visual x offset in m² so dots never hide each other
  const START = [
    { a: 40, r: 860, b: 'X' }, { a: 40, r: 770, b: 'Y' }, { a: 40, r: 770, b: 'Z' },
    { a: 60, r: 1040, b: 'X' }, { a: 60, r: 1020, b: 'Y' }, { a: 60, r: 940, b: 'Z' },
    { a: 80, r: 1250, b: 'X' }, { a: 80, r: 1210, b: 'Y' }, { a: 80, r: 1140, b: 'Z' },
    { a: 100, r: 1470, b: 'X' }, { a: 100, r: 1380, b: 'Y' }, { a: 100, r: 1350, b: 'Z' },
  ];

  let pts = START.map(d => ({ ...d }));
  let sel = 1, mode = 'line', showSq = false, scale2 = false;
  let sawBase = false, sawLineAfterBase = false, randomCount = 0, lastAction = '';

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const bLine = btn('Line sticks', () => setMode('line'), 'go');
  const bBase = btn('Baseline sticks', () => setMode('base'));
  const bSq = btn('Show squares', () => { showSq = !showSq; lastAction = 'sq'; draw(); });
  const bMul = btn('Double all rents (×2)', () => {
    pts.forEach(d => { d.r = Math.round(d.r * 2); });
    scale2 = true; lastAction = 'double'; draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: R-squared'),
    h('p', { class: 'sub' }, 'Drag any apartment dot up or down to change its rent, or tap one and use −$20 / +$20. Watch the white least squares line, the sticks, and the green share bar update live.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$20', () => bump(-20)), btn('+$20', () => bump(20)), selLabel),
        h('div', { class: 'sim-row' },
          bLine, bBase, bSq,
          btn('New apartments (random)', () => {
            const sl = rnd(1, 13), ic = rnd(350, 680), noise = rnd(25, 270);
            pts = START.map(d => {
              const raw = ic + sl * d.a + rnd(-noise, noise);
              const r = Math.max(550, Math.min(1650, Math.round(raw / 10) * 10));
              return { a: d.a, r, b: d.b };
            });
            scale2 = false; randomCount++; lastAction = 'random'; draw();
          }),
          bMul,
          btn('Start again', () => {
            pts = START.map(d => ({ ...d }));
            sel = 1; mode = 'line'; showSq = false; scale2 = false; lastAction = ''; draw();
          }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function setMode(m) {
    mode = m;
    if (m === 'base') sawBase = true;
    if (m === 'line' && sawBase) sawLineAfterBase = true;
    lastAction = m;
    draw();
  }

  const chal = challenges(ch, [
    { text: 'Drag a few apartments closer to the white line until R-squared reaches at least 99%.',
      check: st => st.r2 >= 0.99,
      why: 'Yes! Closer dots make shorter sticks, so almost none of the rent variation is left over.' },
    { text: 'Pull apartments away from the line until R-squared drops below 50%.',
      check: st => st.r2 < 0.50,
      why: 'Right: when rents scatter widely around the line, the line explains less than half of the spread.' },
    { text: 'Press “Baseline sticks”, then switch back to “Line sticks” to compare the two sets of sticks.',
      check: st => st.sawBase && st.sawLineAfterBase,
      why: 'Baseline sticks measure total variation around the mean; line sticks measure what is left unexplained.' },
    { text: 'Press “New apartments (random)” twice. Does R-squared always stay between 0% and 100%?',
      check: st => st.randomCount >= 2,
      why: 'Always. For a least squares line, leftover variation is never below 0 and never bigger than total variation.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 470, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 56 : 66, X1 = VW - 18, TOP = 28, BOT = 326;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const yBounds = () => {
    const hi = Math.max(...pts.map(d => d.r)), lo = Math.min(...pts.map(d => d.r));
    if (!scale2 && hi <= 1700 && lo >= 500) return [500, 1700, 200];
    const minY = Math.max(0, Math.floor((lo - 150) / 400) * 400);
    const maxY = Math.max(minY + 1200, Math.ceil((hi + 150) / 400) * 400);
    const step = (maxY - minY) > 2000 ? 600 : 400;
    return [minY, maxY, step];
  };

  const sx = a => X0 + (a - 30) / 80 * (X1 - X0);
  const sy = (r, yMin, yMax) => BOT - (r - yMin) / (yMax - yMin) * (BOT - TOP);
  const comma = n => Math.round(n).toLocaleString('en-US');

  function stats() {
    const n = pts.length;
    const meanA = pts.reduce((s0, d) => s0 + d.a, 0) / n;
    const meanR = pts.reduce((s0, d) => s0 + d.r, 0) / n;
    let sxx = 0, sxy = 0, sst = 0;
    for (const d of pts) {
      const da = d.a - meanA, dr = d.r - meanR;
      sxx += da * da; sxy += da * dr; sst += dr * dr;
    }
    const slope = sxx > 0 ? sxy / sxx : 0;
    const intercept = meanR - slope * meanA;
    let sse = 0;
    for (const d of pts) {
      const err = d.r - (intercept + slope * d.a);
      sse += err * err;
    }
    const ssr = Math.max(0, sst - sse);
    const r2 = sst > 1e-6 ? Math.max(0, Math.min(1, 1 - sse / sst)) : 0;
    return { meanA, meanR, slope, intercept, sst, sse, ssr, r2 };
  }

  function bump(delta) {
    const [yMin, yMax] = yBounds();
    pts[sel].r = Math.max(yMin + 40, Math.min(yMax - 40, pts[sel].r + delta));
    lastAction = 'edit';
    draw();
  }

  // Drag any apartment dot vertically
  let dragging = -1, dragBounds = [500, 1700];
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), [yMin, yMax] = yBounds();
    let best = -1, bestD = 34 * F;
    pts.forEach((d, i) => {
      const px = sx(d.a + BDX[d.b]), py = sy(d.r, yMin, yMax);
      const dist = Math.hypot(p.x - px, p.y - py);
      if (dist < bestD) { bestD = dist; best = i; }
    });
    if (best < 0) return;
    sel = best; dragging = best; dragBounds = [yMin, yMax];
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e), [yMin, yMax] = dragBounds;
    const raw = yMin + (BOT - p.y) / (BOT - TOP) * (yMax - yMin);
    pts[dragging].r = Math.max(yMin + 40, Math.min(yMax - 40, Math.round(raw / 10) * 10));
    lastAction = 'drag';
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const st = stats();
    const [yMin, yMax, yStep] = yBounds();
    const k = [];

    // Grid and y-axis labels
    for (let yv = yMin; yv <= yMax; yv += yStep) {
      const y = sy(yv, yMin, yMax);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '$' + comma(yv))
      );
    }
    // Axes
    k.push(
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BOT, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X1, y1: BOT, y2: BOT, stroke: C.muted, 'stroke-width': 1.5 })
    );
    for (const a of [40, 60, 80, 100]) {
      const x = sx(a);
      k.push(
        s('line', { x1: x, x2: x, y1: BOT, y2: BOT + 6, stroke: C.muted }),
        s('text', { x, y: BOT + 21 * F, fill: C.muted, 'font-size': 12.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a + ' m²')
      );
    }

    // Flat baseline at mean rent
    const yMean = sy(st.meanR, yMin, yMax);
    k.push(
      s('line', { x1: X0, x2: X1, y1: yMean, y2: yMean, stroke: C.amber, 'stroke-width': mode === 'base' ? 3 : 2, 'stroke-dasharray': '8 6', 'stroke-opacity': mode === 'base' ? 1 : 0.75 }),
      s('text', { x: X1 - 4, y: yMean - 7, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'MEAN $' + comma(st.meanR))
    );

    // Sloped least squares line
    const yL = sy(st.intercept + st.slope * 32, yMin, yMax);
    const yR = sy(st.intercept + st.slope * 108, yMin, yMax);
    k.push(s('line', {
      x1: sx(32), y1: Math.max(TOP, Math.min(BOT, yL)),
      x2: sx(108), y2: Math.max(TOP, Math.min(BOT, yR)),
      stroke: C.ink, 'stroke-width': mode === 'line' ? 3 : 1.5, 'stroke-opacity': mode === 'line' ? 0.95 : 0.35
    }));

    // Sticks (and optional squares)
    const maxSqW = (sx(60) - sx(40)) * 0.48;
    pts.forEach((d, i) => {
      const px = sx(d.a + BDX[d.b]), py = sy(d.r, yMin, yMax);
      const targetR = mode === 'base' ? st.meanR : (st.intercept + st.slope * d.a);
      const ty = sy(targetR, yMin, yMax);
      const hgt = Math.abs(ty - py);
      if (showSq && hgt > 1) {
        const w = Math.min(hgt, maxSqW);
        const rx = d.a === 100 ? px - w : px;
        k.push(s('rect', {
          x: rx, y: Math.min(py, ty), width: w, height: hgt,
          fill: C.pink, 'fill-opacity': 0.2, stroke: C.pink, 'stroke-width': 1, 'stroke-opacity': 0.65
        }));
      }
      k.push(s('line', {
        x1: px, y1: py, x2: px, y2: ty,
        stroke: i === sel ? C.amber : C.pink,
        'stroke-width': i === sel ? 3 : 2, 'stroke-opacity': 0.9
      }));
    });

    // Apartment dots
    pts.forEach((d, i) => {
      const px = sx(d.a + BDX[d.b]), py = sy(d.r, yMin, yMax), col = BCOL[d.b];
      if (i === sel) {
        k.push(s('circle', { cx: px, cy: py, r: 14, fill: col, 'fill-opacity': 0.2, stroke: C.ink, 'stroke-width': 1.5 }));
      }
      k.push(s('circle', { cx: px, cy: py, r: 7, fill: col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor:ns-resize' }));
    });

    // Building key in top-left corner of plot
    [['X', C.cyan], ['Y', C.amber], ['Z', C.pink]].forEach(([name, col], idx) => {
      const lx = X0 + 14 + idx * 50 * F, ly = TOP + 12;
      k.push(
        s('circle', { cx: lx, cy: ly, r: 4.5, fill: col }),
        s('text', { x: lx + 9, y: ly + 4, fill: col, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, name)
      );
    });

    // Live R² share bar below the scatter plot
    const barY = 392, barH = 30, barW = X1 - X0;
    const gW = barW * st.r2, pW = barW - gW;
    const pct = Math.round(st.r2 * 1000) / 10;
    const leftPct = Math.round((1 - st.r2) * 1000) / 10;
    k.push(
      s('text', { x: X0, y: barY - 10, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `SHARE OF VARIATION: R² = ${fmt(pct)}%`),
      s('rect', { x: X0, y: barY, width: barW, height: barH, rx: 6, fill: C.bg, stroke: C.muted }),
      gW > 0.5 ? s('rect', { x: X0, y: barY, width: gW, height: barH, rx: 5, fill: C.green, 'fill-opacity': 0.84 }) : null,
      pW > 0.5 ? s('rect', { x: X0 + gW, y: barY, width: pW, height: barH, rx: 5, fill: C.pink, 'fill-opacity': 0.88 }) : null,
      gW > 95 * F ? s('text', { x: X0 + gW / 2, y: barY + 20, fill: C.bg, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `Explained ${fmt(pct)}%`) : null,
      pW > 85 * F ? s('text', { x: X0 + gW + pW / 2, y: barY + 20, fill: C.bg, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `Left ${fmt(leftPct)}%`) : null,
      s('text', { x: X0, y: barY + barH + 20, fill: C.green, 'font-size': 12 * F, 'font-family': 'Consolas' }, `Fitted: ${comma(st.ssr)}`),
      s('text', { x: X1, y: barY + barH + 20, fill: C.pink, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `Left over: ${comma(st.sse)}`)
    );

    svg.replaceChildren(...k.filter(Boolean));

    // Update active button styling
    bLine.className = 'sim-btn' + (mode === 'line' ? ' go' : '');
    bBase.className = 'sim-btn' + (mode === 'base' ? ' go' : '');
    bSq.className = 'sim-btn' + (showSq ? ' go' : '');
    bSq.textContent = showSq ? 'Hide squares' : 'Show squares';

    // Formula box
    const ratio = st.sst > 1e-6 ? st.sse / st.sst : 0;
    const r2Str = (Math.round(st.r2 * 100) / 100).toFixed(2);
    const ratioStr = (Math.round(ratio * 100) / 100).toFixed(2);
    fbox(box, [
      `mean rent  = $${comma(st.meanR)}`,
      [`total var  = ${comma(st.sst)}`, C.muted],
      [`leftover   = ${comma(st.sse)}`, C.pink],
      `R² = 1 − ${comma(st.sse)} ÷ ${comma(st.sst)}`,
      [`   = 1 − ${ratioStr} = ${r2Str} (${fmt(pct)}%)`, C.green],
    ]);

    // Contextual plain-language note
    if (lastAction === 'double') {
      note.textContent = 'Every rent and dollar stick doubled (and squared sticks grew 4×), yet R-squared did not move at all: R-squared is a share, not dollars.';
    } else if (mode === 'base') {
      note.textContent = 'Showing baseline sticks to the flat mean line. Squaring and adding these gives total variation.';
    } else {
      note.textContent = 'Showing sticks to our sloped line. R-squared compares their squared sum against the flat baseline’s squared sum.';
    }

    const cur = pts[sel];
    selLabel.textContent = `Selected: Bldg ${cur.b}, ${cur.a} m² ($${comma(cur.r)})`;
    chal.update({ r2: st.r2, sawBase, sawLineAfterBase, randomCount });
  }

  draw();
  return () => {};
}

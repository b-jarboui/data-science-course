// 10.1.3 Try it: residuals as vertical leftover gaps.
// Drag any apartment dot up or down (or tap and use -$10 / +$10), inspect its vertical residual,
// toggle the slanted trap, make fresh random apartments, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const BCOL = { X: C.cyan, Y: C.amber, Z: C.pink };
  const START = [
    { area: 40, rent: 860, bldg: 'X' }, { area: 40, rent: 770, bldg: 'Y' }, { area: 40, rent: 770, bldg: 'Z' },
    { area: 60, rent: 1040, bldg: 'X' }, { area: 60, rent: 1020, bldg: 'Y' }, { area: 60, rent: 940, bldg: 'Z' },
    { area: 80, rent: 1250, bldg: 'X' }, { area: 80, rent: 1210, bldg: 'Y' }, { area: 80, rent: 1140, bldg: 'Z' },
    { area: 100, rent: 1470, bldg: 'X' }, { area: 100, rent: 1380, bldg: 'Y' }, { area: 100, rent: 1350, bldg: 'Z' },
  ];

  let apts = START.map(a => ({ ...a }));
  let intercept = 400, slope = 10, sel = 6; // Building X, 80 m²
  let showAll = true, showTrap = false, sawTrap = false, randomCount = 0;
  let edited = new Set();

  const fitted = area => intercept + slope * area;
  const resid = a => a.rent - fitted(a.area);
  const sumResid = () => apts.reduce((acc, a) => acc + resid(a), 0);
  const signed = v => v > 0 ? `+$${v}` : v < 0 ? `−$${Math.abs(v)}` : '$0';

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const trapBtn = btn('Show slanted trap', () => {
    showTrap = !showTrap;
    if (showTrap) sawTrap = true;
    trapBtn.className = 'sim-btn ' + (showTrap ? 'go' : '');
    trapBtn.textContent = showTrap ? 'Hide slanted trap' : 'Show slanted trap';
    draw();
  });
  const allBtn = btn('Show selected stick only', () => {
    showAll = !showAll;
    allBtn.textContent = showAll ? 'Show selected stick only' : 'Show all 12 sticks';
    draw();
  });

  function tripleOffset() {
    for (let tries = 0; tries < 60; tries++) {
      const a = rnd(-7, 7) * 10, b = rnd(-7, 7) * 10, c = -(a + b);
      if (Math.abs(c) <= 80 && (a !== 0 || b !== 0)) return [a, b, c];
    }
    return [40, -10, -30];
  }

  function newData() {
    intercept = rnd(5, 10) * 50; // 250 to 500
    slope = rnd(8, 12);
    const areas = [40, 60, 80, 100], bldgs = ['X', 'Y', 'Z'];
    apts = [];
    for (const area of areas) {
      const offs = tripleOffset();
      bldgs.forEach((bldg, k) => apts.push({ area, rent: fitted(area) + offs[k], bldg }));
    }
    edited = new Set();
    randomCount++;
    draw();
  }

  function resetAll() {
    intercept = 400; slope = 10;
    apts = START.map(a => ({ ...a }));
    sel = 6; edited = new Set();
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: residuals'),
    h('p', { class: 'sub' }, 'Drag any apartment dot straight up or down to change its actual rent, or tap a dot and use −$10 / +$10. The white line gives the fitted rent; the vertical stick is the residual.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$10', () => bump(-10)),
          btn('+$10', () => bump(10)),
          selLabel),
        h('div', { class: 'sim-row' },
          trapBtn,
          allBtn,
          btn('New apartments (random)', newData, 'go'),
          btn('Start again', resetAll))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Drag Building X (80 m²) until its residual is exactly $0.',
      check: st => st.x80Resid === 0,
      why: 'Yes! When the dot sits right on the line, actual equals fitted, so nothing is left over.' },
    { text: 'Turn any apartment into a big bargain: give it a residual of −$100 or lower.',
      check: st => st.minResid <= -100,
      why: 'Right: a big minus residual sits far below the line — much cheaper than predicted for its size.' },
    { text: 'Change at least two apartments, then balance the 12 residuals so their sum is back to $0.',
      check: st => st.editedCount >= 2 && st.sum === 0,
      why: 'Nicely balanced! Every extra dollar above the line is cancelled by a dollar below it.' },
    { text: 'Press “New apartments (random)” twice and turn on “Show slanted trap”.',
      check: st => st.randomCount >= 2 && st.sawTrap,
      why: 'Every time, the residual is the straight up-and-down gap in dollars — never the slanted shortest line.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 56 : 66, X1 = VW - 18, TOP = 28, BASE = 384;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const AX0 = 28, AX1 = 112;
  const yBounds = () => {
    const lineMin = fitted(40), lineMax = fitted(100);
    const rents = apts.map(a => a.rent);
    const lo = Math.floor((Math.min(lineMin, ...rents) - 140) / 100) * 100;
    const hi = Math.ceil((Math.max(lineMax, ...rents) + 140) / 100) * 100;
    return [Math.max(200, lo), hi];
  };
  const x2s = area => X0 + (area - AX0) / (AX1 - AX0) * (X1 - X0);
  const y2s = (rent, lo, hi) => BASE - (rent - lo) / (hi - lo) * (BASE - TOP);
  const s2y = (py, lo, hi) => lo + (BASE - py) / (BASE - TOP) * (hi - lo);

  // Subtle horizontal nudge only when two dots at the same area sit nearly on top of each other
  function dotScreenX(i) {
    const a = apts[i], base = x2s(a.area);
    const close = apts.map((o, j) => (o.area === a.area && Math.abs(o.rent - a.rent) < 35 ? j : -1)).filter(j => j >= 0);
    if (close.length <= 1) return base;
    const pos = close.indexOf(i);
    return base + (pos - (close.length - 1) / 2) * (NARROW ? 11 : 14);
  }

  function bump(delta) {
    const [lo, hi] = yBounds();
    const minR = Math.max(200, fitted(apts[sel].area) - 250);
    const maxR = Math.min(2400, Math.max(hi, fitted(apts[sel].area) + 250));
    apts[sel].rent = Math.max(minR, Math.min(maxR, apts[sel].rent + delta));
    edited.add(sel);
    draw();
  }

  // Drag any dot vertically
  let dragging = -1, dragLo = 600, dragHi = 1600;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), [lo, hi] = yBounds();
    let best = -1, bestD = 38;
    apts.forEach((a, i) => {
      const d = Math.hypot(dotScreenX(i) - p.x, y2s(a.rent, lo, hi) - p.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    sel = best; dragging = best; dragLo = lo; dragHi = hi;
    svg.setPointerCapture(e.pointerId);
    draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const raw = Math.round(s2y(p.y, dragLo, dragHi) / 10) * 10;
    const minR = Math.max(200, fitted(apts[dragging].area) - 240);
    const maxR = Math.min(2400, fitted(apts[dragging].area) + 240);
    const next = Math.max(minR, Math.min(maxR, raw));
    if (next !== apts[dragging].rent) {
      apts[dragging].rent = next;
      edited.add(dragging);
      draw();
    }
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const [lo, hi] = yBounds();
    const k = [];
    const step = (hi - lo) > 1000 ? 200 : 100;
    for (let g = Math.ceil(lo / step) * step; g <= hi; g += step) {
      const y = y2s(g, lo, hi);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g.toLocaleString('en-US')));
    }
    for (const a of [40, 60, 80, 100]) {
      const x = x2s(a);
      k.push(s('line', { x1: x, x2: x, y1: TOP, y2: BASE, stroke: C.line, 'stroke-opacity': 0.55 }),
        s('text', { x, y: BASE + 22, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a));
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
      s('text', { x: (X0 + X1) / 2, y: BASE + 44, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'area (square metres)'),
      s('text', { x: X0 - 6, y: TOP - 10, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }, 'rent ($)')
    );

    // Glowing white fitted line
    const lx1 = x2s(AX0 + 2), ly1 = y2s(fitted(AX0 + 2), lo, hi);
    const lx2 = x2s(AX1 - 2), ly2 = y2s(fitted(AX1 - 2), lo, hi);
    k.push(
      s('line', { x1: lx1, y1: ly1, x2: lx2, y2: ly2, stroke: C.ink, 'stroke-width': 9, 'stroke-opacity': 0.14, 'stroke-linecap': 'round' }),
      s('line', { x1: lx1, y1: ly1, x2: lx2, y2: ly2, stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round' })
    );

    // Vertical residual sticks
    apts.forEach((a, i) => {
      if (!showAll && i !== sel) return;
      const sx = dotScreenX(i), yAct = y2s(a.rent, lo, hi), yFit = y2s(fitted(a.area), lo, hi);
      const r = resid(a), col = r > 0 ? C.green : r < 0 ? C.pink : C.amber;
      k.push(s('line', { x1: sx, y1: yFit, x2: sx, y2: yAct, stroke: col, 'stroke-width': i === sel ? 4.5 : 2.5, 'stroke-opacity': i === sel ? 1 : 0.78 }));
    });

    // Optional slanted trap overlay on selected apartment
    const sa = apts[sel], sRes = resid(sa);
    const sx = dotScreenX(sel), sy = y2s(sa.rent, lo, hi), syFit = y2s(fitted(sa.area), lo, hi);
    if (showTrap && Math.abs(sRes) >= 10) {
      const vx = lx2 - lx1, vy = ly2 - ly1;
      const t = ((sx - lx1) * vx + (sy - ly1) * vy) / (vx * vx + vy * vy);
      const fx = lx1 + t * vx, fy = ly1 + t * vy;
      k.push(
        s('line', { x1: sx, y1: sy, x2: fx, y2: fy, stroke: C.pink, 'stroke-width': 3, 'stroke-dasharray': '6 4' }),
        s('circle', { cx: fx, cy: fy, r: 4, fill: C.pink }),
        s('text', { x: (sx + fx) / 2 + (sRes > 0 ? 18 : -18), y: (sy + fy) / 2 + (sRes > 0 ? 12 : -8), fill: C.pink, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'slanted ✗')
      );
    }

    // Apartment dots
    apts.forEach((a, i) => {
      const x = dotScreenX(i), y = y2s(a.rent, lo, hi), col = BCOL[a.bldg];
      if (i === sel) {
        k.push(
          s('circle', { cx: x, cy: y, r: 16, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-width': 2 }),
          s('circle', { cx: x, cy: y2s(fitted(a.area), lo, hi), r: 5, fill: C.ink })
        );
      }
      k.push(s('circle', { cx: x, cy: y, r: i === sel ? 8 : 6.5, fill: col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor:ns-resize' }));
    });

    // Tag the selected residual cleanly beside its stick
    const tagCol = sRes > 0 ? C.green : sRes < 0 ? C.pink : C.amber;
    const tagX = Math.min(X1 - 38 * F, Math.max(X0 + 38 * F, sx + (sRes >= 0 ? -44 * F : 44 * F)));
    const tagY = (sy + syFit) / 2;
    k.push(
      s('rect', { x: tagX - 34 * F, y: tagY - 13 * F, width: 68 * F, height: 24 * F, rx: 12 * F, fill: C.bg, stroke: tagCol }),
      s('text', { x: tagX, y: tagY + 4 * F, fill: tagCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, signed(sRes))
    );

    // Building legend in bottom-right open corner
    [['X', C.cyan, 0], ['Y', C.amber, 44], ['Z', C.pink, 88]].forEach(([lbl, col, dx]) => {
      const lx = X1 - 116 + dx, ly = BASE - 16;
      k.push(
        s('circle', { cx: lx, cy: ly, r: 5, fill: col }),
        s('text', { x: lx + 10, y: ly + 4, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, lbl)
      );
    });

    svg.replaceChildren(...k);

    const fitVal = fitted(sa.area), sumR = sumResid();
    fbox(box, [
      `line: rent = ${intercept} + ${slope} × area`,
      [`Building ${sa.bldg} · ${sa.area} m²`, BCOL[sa.bldg]],
      `actual   = $${sa.rent}`,
      `fitted   = $${fitVal}`,
      [`residual = ${sa.rent} − ${fitVal} = ${signed(sRes)}`, tagCol],
      [`sum of all 12 = ${signed(sumR)}`, sumR === 0 ? C.green : C.muted],
    ]);

    note.textContent = showTrap
      ? 'The dashed pink line is the shortest slanted distance — it mixes square metres and dollars. The residual is always the straight vertical stick.'
      : sRes > 0
        ? `Above the line: this apartment costs $${sRes} more than the line predicts for ${sa.area} m².`
        : sRes < 0
          ? `Below the line: this apartment is $${Math.abs(sRes)} cheaper than the line predicts for ${sa.area} m².`
          : 'Right on the line: actual rent equals fitted rent, so the residual is $0.';

    selLabel.textContent = `Selected: Building ${sa.bldg}, ${sa.area} m² ($${sa.rent})`;

    const x80 = apts.find(a => a.bldg === 'X' && a.area === 80);
    const minResid = Math.min(...apts.map(resid));
    chal.update({
      x80Resid: x80 ? resid(x80) : 999,
      minResid,
      editedCount: edited.size,
      sum: sumR,
      randomCount,
      sawTrap,
    });
  }

  draw();
  return () => {};
}

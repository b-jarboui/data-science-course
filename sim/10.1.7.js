// 10.1.7 Try it: residual standard error and degrees of freedom.
// Drag any apartment dot up or down to change its rent (or tap and use -$10 / +$10),
// watch the fitted line, residual sticks, ±typical-gap band, and honest vs ÷n trap update live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START = [
    { x: 40, y: 860, b: 0 }, { x: 40, y: 770, b: 1 }, { x: 40, y: 770, b: 2 },
    { x: 60, y: 1040, b: 0 }, { x: 60, y: 1020, b: 1 }, { x: 60, y: 940, b: 2 },
    { x: 80, y: 1250, b: 0 }, { x: 80, y: 1210, b: 1 }, { x: 80, y: 1140, b: 2 },
    { x: 100, y: 1470, b: 0 }, { x: 100, y: 1380, b: 1 }, { x: 100, y: 1350, b: 2 },
  ];
  const BCOL = [C.cyan, C.amber, C.pink];
  const BNAME = ['X', 'Y', 'Z'];
  const AREAS = [40, 60, 80, 100];

  let pts = START.map(p => ({ ...p }));
  let sel = 6; // Building X, 80 m²
  let randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  function newRandom() {
    const slope = rnd(7, 13);
    const intercept = rnd(320, 480);
    const spread = rnd(35, 95);
    pts = [];
    for (const a of AREAS) {
      for (let b = 0; b < 3; b++) {
        const noise = rnd(-spread, spread);
        const y = Math.max(620, Math.min(1580, Math.round((intercept + slope * a + noise) / 5) * 5));
        pts.push({ x: a, y, b });
      }
    }
    sel = 0;
    randomCount++;
    draw();
  }

  function addApt() {
    if (pts.length >= 16) return;
    const fit = compute();
    const a = AREAS[pts.length % AREAS.length];
    const b = pts.length % 3;
    const base = fit.slope * a + fit.intercept;
    const sign = pts.length % 2 === 0 ? 1 : -1;
    const y = Math.max(620, Math.min(1580, Math.round((base + sign * rnd(35, 85)) / 5) * 5));
    pts.push({ x: a, y, b });
    sel = pts.length - 1;
    draw();
  }

  function removeApt() {
    if (pts.length <= 2) return;
    // Never remove the last point with a different area (keep at least 2 distinct areas)
    let idx = pts.length - 1;
    while (idx >= 0) {
      const rest = pts.filter((_, i) => i !== idx);
      if (new Set(rest.map(p => p.x)).size >= 2) break;
      idx--;
    }
    if (idx < 0) return;
    pts.splice(idx, 1);
    sel = Math.min(sel, pts.length - 1);
    draw();
  }

  function tryTwo() {
    pts = [
      { x: 40, y: 860, b: 0 },
      { x: 100, y: 1350, b: 2 },
    ];
    sel = 0;
    draw();
  }

  function bump(d) {
    if (!pts[sel]) return;
    pts[sel].y = Math.max(600, Math.min(1600, pts[sel].y + d));
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: residual standard error'),
    h('p', { class: 'sub' }, 'Each dot is one apartment and each stick is its gap from the fitted line. Drag any dot up or down, or tap it and use −$10 / +$10.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$10', () => bump(-10)),
          btn('+$10', () => bump(10)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newRandom, 'go'),
          btn('Add apartment', addApt),
          btn('Remove apartment', removeApt),
          btn('Try 2 apartments', tryTwo),
          btn('Start again', () => { pts = START.map(p => ({ ...p })); sel = 6; draw(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;

  function compute() {
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p.x, 0) / n;
    const my = pts.reduce((s, p) => s + p.y, 0) / n;
    const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
    const sxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
    const slope = sxx > 0 ? sxy / sxx : 0;
    const intercept = my - slope * mx;
    const resids = pts.map(p => p.y - (intercept + slope * p.x));
    const ssr = resids.reduce((s, e) => s + e * e, 0);
    const df = n - 2;
    const rse = df > 0 ? Math.sqrt(ssr / df) : null;
    const naive = Math.sqrt(ssr / n);
    return { n, slope, intercept, resids, ssr, df, rse, naive };
  }

  const chal = challenges(ch, [
    {
      text: 'Drag apartments closer to the white line until the residual standard error is under $25.',
      check: st => st.n >= 3 && st.rse !== null && st.rse < 25,
      why: 'Yes! Shorter residual sticks shrink the sum of squared residuals, so the typical gap drops.',
    },
    {
      text: 'Drop down to 2 apartments (tap “Try 2 apartments” or remove dots). Watch both residuals and the degrees of freedom.',
      check: st => st.n === 2,
      why: 'With 2 apartments, the line hits both dots so both residuals are 0, and 2 − 2 = 0 degrees of freedom leaves nothing to measure noise.',
    },
    {
      text: 'Set up exactly 4 apartments with some scatter. Compare the honest ÷ (4 − 2) value with the ÷ 4 trap.',
      check: st => st.n === 4 && st.rse !== null && st.rse > 5,
      why: 'With only 4 apartments, dividing by 4 instead of 2 cuts the squared noise in half — the trap is much worse on small groups.',
    },
    {
      text: 'Press “New data (random)” twice. Is the honest residual standard error always bigger than the ÷ apartments trap?',
      check: st => st.randomCount >= 2 && st.rse !== null && st.rse > 0,
      why: 'Always: sharing the same sum of squares among two fewer pieces gives a larger, honest picture of the noise.',
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 56 : 64, X1 = VW - 18, Y0 = 384, Y1 = 28;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const XMIN = 30, XMAX = 110, YMIN = 580, YMAX = 1620;
  const sx = a => X0 + (a - XMIN) / (XMAX - XMIN) * (X1 - X0);
  const sy = r => Y0 - (r - YMIN) / (YMAX - YMIN) * (Y0 - Y1);
  const dodge = b => (b - 1) * (NARROW ? 8 : 11);

  // Drag any dot vertically to change its rent
  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bestD = NARROW ? 36 : 28;
    pts.forEach((pt, i) => {
      const dx = sx(pt.x) + dodge(pt.b) - p.x;
      const dy = sy(pt.y) - p.y;
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    sel = best;
    dragging = best;
    svg.setPointerCapture(e.pointerId);
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const rent = YMIN + (Y0 - p.y) / (Y0 - Y1) * (YMAX - YMIN);
    pts[dragging].y = Math.max(600, Math.min(1600, Math.round(rent / 5) * 5));
    draw();
  });

  const endDrag = () => { dragging = -1; };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  function draw() {
    const st = compute();
    const { n, slope, intercept, resids, ssr, df, rse, naive } = st;
    const k = [];

    // Grid and axes
    for (let r = 600; r <= 1600; r += 200) {
      const y = sy(r);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '$' + r)
      );
    }
    for (const a of AREAS) {
      const x = sx(a);
      k.push(
        s('line', { x1: x, x2: x, y1: Y0, y2: Y0 + 6, stroke: C.muted }),
        s('text', { x, y: Y0 + 22, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a + ' m²')
      );
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: Y0, y2: Y0, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: Y1, y2: Y0, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: (X0 + X1) / 2, y: VH - 8, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial' }, 'Floor area (m²)')
    );

    // Legend (buildings X, Y, Z)
    BNAME.forEach((name, i) => {
      const lx = X0 + 16 + i * (NARROW ? 66 : 82), ly = Y1 + 12;
      k.push(
        s('circle', { cx: lx, cy: ly, r: 5, fill: BCOL[i] }),
        s('text', { x: lx + 10, y: ly + 4, fill: BCOL[i], 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'Bldg ' + name)
      );
    });

    // ±RSE typical-gap band around the fitted line
    const lx1 = 34, lx2 = 106;
    const ly1 = intercept + slope * lx1, ly2 = intercept + slope * lx2;
    const clampY = y => Math.max(Y1, Math.min(Y0, sy(y)));

    if (rse !== null && rse > 0) {
      const polyPts = [
        `${sx(lx1)},${clampY(ly1 + rse)}`,
        `${sx(lx2)},${clampY(ly2 + rse)}`,
        `${sx(lx2)},${clampY(ly2 - rse)}`,
        `${sx(lx1)},${clampY(ly1 - rse)}`,
      ].join(' ');
      k.push(
        s('polygon', { points: polyPts, fill: C.amber, 'fill-opacity': 0.1 }),
        s('line', { x1: sx(lx1), y1: clampY(ly1 + rse), x2: sx(lx2), y2: clampY(ly2 + rse), stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '7 6' }),
        s('line', { x1: sx(lx1), y1: clampY(ly1 - rse), x2: sx(lx2), y2: clampY(ly2 - rse), stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '7 6' })
      );
    }

    // White OLS fitted line
    k.push(s('line', {
      x1: sx(lx1), y1: clampY(ly1), x2: sx(lx2), y2: clampY(ly2),
      stroke: C.ink, 'stroke-width': 2.8,
    }));

    // Residual sticks and apartment dots
    const slopePx = (sy(ly2) - sy(ly1)) / (sx(lx2) - sx(lx1));
    pts.forEach((pt, i) => {
      const dx = dodge(pt.b);
      const px = sx(pt.x) + dx;
      const py = sy(pt.y);
      const lineY = sy(intercept + slope * pt.x) + slopePx * dx;
      const col = BCOL[pt.b];
      k.push(s('line', { x1: px, y1: lineY, x2: px, y2: py, stroke: col, 'stroke-width': i === sel ? 3.5 : 2.4, 'stroke-opacity': 0.9 }));
      if (i === sel) {
        k.push(s('circle', { cx: px, cy: py, r: NARROW ? 12 : 11, fill: col, 'fill-opacity': 0.22, stroke: C.ink, 'stroke-width': 1.5 }));
      }
      k.push(s('circle', { cx: px, cy: py, r: NARROW ? 7 : 6.5, fill: col, style: 'cursor:ns-resize' }));
    });

    // Live badge in top-right of plot
    const badgeW = NARROW ? 132 : 168;
    const badgeText = rse === null ? 'NO NOISE LEFT' : 'TYPICAL ±$' + fmt(r2(rse));
    const badgeCol = rse === null ? C.pink : C.amber;
    k.push(
      s('rect', { x: X1 - badgeW, y: Y1 - 2, width: badgeW, height: 28, rx: 14, fill: C.bg, stroke: badgeCol }),
      s('text', { x: X1 - badgeW / 2, y: Y1 + 17, fill: badgeCol, 'font-size': (NARROW ? 12.5 : 14) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, badgeText)
    );

    svg.replaceChildren(...k);

    // Formula box in plain words
    if (df <= 0) {
      fbox(box, [
        `sum of squares = 0`,
        [`degrees of freedom = ${n} − 2 = 0`, C.pink],
        ['nothing left to measure noise!', C.pink],
        [`÷ ${n} trap says $0 (misleading)`, C.muted],
      ]);
      note.textContent = 'Two apartments determine a line completely. Both residuals are 0, so we cannot measure the noise around the line.';
    } else {
      const avgSq = ssr / df;
      fbox(box, [
        `sum of squares = ${Math.round(ssr).toLocaleString('en-US')}`,
        `degrees of freedom = ${n} − 2 = ${df}`,
        `share (${df}) = ${fmt(r2(avgSq))}`,
        [`residual std. error = $${fmt(r2(rse))}`, C.amber],
        [`÷ ${n} trap = $${fmt(r2(naive))} (too small)`, C.pink],
      ]);
      note.textContent = 'The amber dashed band sits one residual standard error above and below the white line — the typical gap in dollars.';
    }

    const cur = pts[sel];
    if (cur) {
      const gap = Math.round(resids[sel]);
      const sign = gap >= 0 ? '+' : '−';
      selLabel.textContent = `Selected: Bldg ${BNAME[cur.b]}, ${cur.x} m², $${cur.y} (gap ${sign}$${Math.abs(gap)})`;
    }
    chal.update({ n, rse, naive, ssr, randomCount });
  }

  draw();
  return () => {};
}

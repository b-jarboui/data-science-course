// 10.1.1 Try it: conditional means.
// Drag any apartment dot up or down inside its size column (or tap and use -$10 / +$10),
// inspect how each column's conditional mean star updates live, make random neighbourhoods,
// and solve small self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const AREAS = [40, 60, 80, 100];
  const START = [
    [860, 770, 770],
    [1040, 1020, 940],
    [1250, 1210, 1140],
    [1470, 1380, 1350]
  ];
  const MIN_R = 500, MAX_R = 1700;
  const clone = a => a.map(col => col.slice());

  let cols = clone(START);
  let selC = 0, selI = 0, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: conditional means'),
    h('p', { class: 'sub' }, 'Each dot is one apartment. Drag a dot up or down inside its size column, or tap it and use −$10 / +$10. Each bright star is that column’s conditional mean.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$10', () => bump(-10)),
          btn('+$10', () => bump(10)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('New neighbourhood (random)', () => newNeighbourhood(), 'go'),
          btn('Add apt to column', () => addApt()),
          btn('Remove apt', () => removeApt()),
          btn('Start again', () => { cols = clone(START); selC = 0; selI = 0; draw(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const colSum = c => cols[c].reduce((a, b) => a + b, 0);
  const colMean = c => colSum(c) / cols[c].length;
  const money = x => {
    const v = r2(x), neg = v < 0, abs = Math.abs(v);
    const [whole, dec] = fmt(abs).split('.');
    return (neg ? '−$' : '$') + Number(whole).toLocaleString('en-US') + (dec ? '.' + dec : '');
  };
  const signed = x => {
    const v = r2(x);
    if (v === 0) return '$0';
    return (v > 0 ? '+' : '−') + money(Math.abs(v));
  };

  const chal = challenges(ch, [
    {
      text: 'In the 40 m² column, raise rents so its conditional mean becomes exactly $900.',
      check: st => st.means[0] === 900,
      why: 'Yes! Raising rents in the 40 m² column lifts its total, so its conditional mean moves up to $900 — while the other columns stay untouched.'
    },
    {
      text: 'Keep the 40 m² conditional mean at $800, but make the highest rent there at least $900.',
      check: st => st.means[0] === 800 && Math.max(...st.cols[0]) >= 900,
      why: 'Right: very different spreads can share the same conditional mean. The star describes the average, not each apartment.'
    },
    {
      text: 'Make the 80 m² conditional mean higher than the 100 m² conditional mean.',
      check: st => st.means[2] > st.means[3],
      why: 'Each column has its own conditional mean. Changing rents inside one size only moves that size’s star.'
    },
    {
      text: 'Press “New neighbourhood (random)” twice. Does each star always sit inside its column’s spread?',
      check: st => st.randomCount >= 2,
      why: 'Always. A conditional mean is the fair share of its column, so it always sits between that column’s lowest and highest rent.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 440, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 62 : 76, X1 = VW - 16, TOP = 26, BASE = 384;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const ax = a => X0 + (a - 20) / 100 * (X1 - X0);
  const ay = r => BASE - (r - MIN_R) / (MAX_R - MIN_R) * (BASE - TOP);
  const yToRent = y => Math.max(MIN_R, Math.min(MAX_R, Math.round((MIN_R + (BASE - y) / (BASE - TOP) * (MAX_R - MIN_R)) / 10) * 10));

  function bump(delta) {
    cols[selC][selI] = Math.max(MIN_R, Math.min(MAX_R, cols[selC][selI] + delta));
    draw();
  }

  function addApt() {
    if (cols[selC].length >= 6) return;
    const m = Math.round(colMean(selC) / 10) * 10;
    const v = Math.max(MIN_R, Math.min(MAX_R, m + rnd(-12, 12) * 10));
    cols[selC].push(v);
    selI = cols[selC].length - 1;
    draw();
  }

  function removeApt() {
    if (cols[selC].length <= 2) return;
    cols[selC].splice(selI, 1);
    selI = Math.min(selI, cols[selC].length - 1);
    draw();
  }

  function newNeighbourhood() {
    const base = rnd(68, 92) * 10;
    const step = rnd(14, 24) * 10;
    cols = AREAS.map((_, c) => {
      const target = base + c * step;
      return Array.from({ length: 3 }, () => Math.max(MIN_R, Math.min(MAX_R, target + rnd(-10, 10) * 10)));
    });
    selI = Math.min(selI, cols[selC].length - 1);
    randomCount++;
    draw();
  }

  // Spread overlapping or near-overlapping dots horizontally within a column
  function dotOffsets(vals) {
    const order = vals.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const dx = new Array(vals.length).fill(0);
    const step = NARROW ? 16 : 20;
    let k = 0;
    while (k < order.length) {
      let end = k + 1;
      while (end < order.length && order[end].v - order[k].v <= 30) end++;
      const cnt = end - k;
      if (cnt > 1) {
        for (let j = 0; j < cnt; j++) dx[order[k + j].i] = (j - (cnt - 1) / 2) * step;
      }
      k = end;
    }
    return dx;
  }

  function starPts(cx, cy, r) {
    const ri = r * 0.44, pts = [];
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 === 0 ? r : ri;
      pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  // Pointer dragging (touch + mouse)
  let dragging = null;
  let hitPoints = [];
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = null, bestD = 30 * F;
    for (const hp of hitPoints) {
      const d = Math.hypot(p.x - hp.x, p.y - hp.y);
      if (d < bestD) { bestD = d; best = hp; }
    }
    if (best) {
      selC = best.c;
      selI = best.i;
      dragging = { c: best.c, i: best.i };
      svg.setPointerCapture(e.pointerId);
      draw();
      return;
    }
    // Tapping empty space near a column selects that column
    let nearC = 0, nearDx = Infinity;
    AREAS.forEach((a, c) => {
      const d = Math.abs(p.x - ax(a));
      if (d < nearDx) { nearDx = d; nearC = c; }
    });
    selC = nearC;
    selI = Math.min(selI, cols[selC].length - 1);
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (!dragging) return;
    const p = toSvg(e);
    cols[dragging.c][dragging.i] = yToRent(p.y);
    draw();
  });

  const endDrag = () => { dragging = null; };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  function draw() {
    const means = AREAS.map((_, c) => colMean(c));
    const el = [];
    hitPoints = [];

    // Horizontal gridlines & y ticks
    for (let r = MIN_R; r <= MAX_R; r += 200) {
      const y = ay(r);
      el.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, money(r))
      );
    }

    // Selected column soft highlight band
    const colW = (ax(60) - ax(40)) * 0.72;
    el.push(s('rect', {
      x: ax(AREAS[selC]) - colW / 2, y: TOP - 6, width: colW, height: BASE - TOP + 10,
      fill: '#ffffff', 'fill-opacity': 0.045, stroke: C.amber, 'stroke-opacity': 0.35, rx: 10
    }));

    // Vertical column guides & x axis labels
    AREAS.forEach((a, c) => {
      const x = ax(a);
      el.push(
        s('line', { x1: x, x2: x, y1: TOP, y2: BASE, stroke: C.line, 'stroke-dasharray': '4 5' }),
        s('text', {
          x, y: BASE + 22, fill: c === selC ? C.amber : C.muted,
          'font-size': 13 * F, 'font-weight': c === selC ? 700 : 400,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `${a} m²`)
      );
    });

    // Axes lines & titles
    el.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 1.8 }),
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 1.8 }),
      s('text', { x: (X0 + X1) / 2, y: VH - 8, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'floor area (square metres)')
    );

    // Glowing white path connecting the four conditional mean stars
    const polyPts = AREAS.map((a, c) => `${ax(a).toFixed(1)},${ay(means[c]).toFixed(1)}`).join(' ');
    el.push(
      s('polyline', { points: polyPts, fill: 'none', stroke: C.cyan, 'stroke-opacity': 0.22, 'stroke-width': 8, 'stroke-linejoin': 'round' }),
      s('polyline', { points: polyPts, fill: 'none', stroke: C.ink, 'stroke-width': 2.8, 'stroke-linejoin': 'round' })
    );

    // Apartment dots per column
    AREAS.forEach((a, c) => {
      const x0 = ax(a), vals = cols[c], dxs = dotOffsets(vals);
      vals.forEach((val, i) => {
        const cx = x0 + dxs[i], cy = ay(val);
        const active = c === selC && i === selI;
        hitPoints.push({ c, i, x: cx, y: cy });

        // Vertical stick showing gap from selected dot to its star
        if (active) {
          const ym = ay(means[c]);
          el.push(s('line', { x1: cx, x2: cx, y1: ym, y2: cy, stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }));
          const diff = val - means[c];
          if (Math.abs(diff) >= 5) {
            el.push(s('text', {
              x: cx + (cx > X1 - 65 ? -10 : 12), y: (cy + ym) / 2 + 4,
              fill: C.pink, 'font-size': 12 * F, 'font-weight': 700,
              'text-anchor': cx > X1 - 65 ? 'end' : 'start', 'font-family': 'Consolas'
            }, signed(diff)));
          }
        }

        el.push(
          s('circle', { cx, cy, r: (active ? 15 : 11) * F, fill: active ? C.pink : C.cyan, 'fill-opacity': active ? 0.22 : 0.16 }),
          s('circle', { cx, cy, r: (active ? 7.5 : 6.2) * F, fill: active ? C.pink : C.cyan, stroke: active ? C.ink : 'none', 'stroke-width': active ? 2 : 0, style: 'cursor:ns-resize' })
        );
      });
    });

    // Conditional mean stars + labels on top
    AREAS.forEach((a, c) => {
      const cx = ax(a), cy = ay(means[c]), hi = c === selC;
      el.push(
        s('circle', { cx, cy, r: (hi ? 18 : 15) * F, fill: C.amber, 'fill-opacity': hi ? 0.24 : 0.16 }),
        s('polygon', { points: starPts(cx, cy, (hi ? 11.5 : 9.5) * F), fill: C.amber, stroke: C.bg, 'stroke-width': 1 })
      );
      const pw = (NARROW ? 56 : 62) * F, ph = 20 * F;
      const lx = Math.max(X0 + 4, cx - pw - 10);
      const ly = Math.max(TOP, cy - ph - 6);
      el.push(
        s('rect', { x: lx, y: ly, width: pw, height: ph, rx: ph / 2, fill: C.bg, stroke: C.amber, 'stroke-width': hi ? 1.8 : 1.1 }),
        s('text', { x: lx + pw / 2, y: ly + ph * 0.72, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, money(means[c]))
      );
    });

    svg.replaceChildren(...el);

    // Formula box for the selected column
    const vals = cols[selC], sum = colSum(selC), m = means[selC], n = vals.length;
    const list = vals.join(' + ');
    const aptVal = vals[selI], gap = aptVal - m;
    fbox(box, [
      [`condition: area = ${AREAS[selC]} m²`, C.violet],
      list.length <= 26 ? `rents = ${list}` : `rents = ${n} apartments added`,
      `sum   = ${money(sum)}   count = ${n}`,
      [`mean  = ${money(sum)} ÷ ${n} = ${money(m)}`, C.amber],
      [`selected apt: ${money(aptVal)} (${signed(gap)})`, C.pink]
    ]);

    const d1 = r2(means[1] - means[0]), d2 = r2(means[2] - means[1]), d3 = r2(means[3] - means[2]);
    const straight = Math.abs(d1 - d2) < 0.01 && Math.abs(d2 - d3) < 0.01;
    note.textContent = straight
      ? `All four stars sit on one straight line: each +20 m² step adds ${money(d1)} to the conditional mean.`
      : `The star at ${AREAS[selC]} m² is ${money(m)}. The selected apartment (${money(aptVal)}) sits ${Math.abs(r2(gap)) < 0.01 ? 'right on' : (gap > 0 ? money(gap) + ' above' : money(-gap) + ' below')} its star.`;
    selLabel.textContent = `Selected: ${AREAS[selC]} m² apt ${selI + 1} (${money(aptVal)})`;

    chal.update({
      cols,
      means: means.map(v => Math.round(v * 1000) / 1000),
      randomCount
    });
  }

  draw();
  return () => {};
}

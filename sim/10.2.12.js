// 10.2.12 Try it: Influential observations & Cook's distance.
// Tap any apartment listing (or its bar) to leave it out and compare both fitted lines.
// Drag a listing up/down (rent) or left/right (area) to see how Cook's distance reacts live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START = [
    { id: 'A', x: 40, y: 980,  n: 'Cedar' },
    { id: 'B', x: 40, y: 1000, n: 'Cedar' },
    { id: 'C', x: 40, y: 1000, n: 'Station' },
    { id: 'D', x: 40, y: 1020, n: 'Station' },
    { id: 'E', x: 50, y: 1060, n: 'Cedar' },
    { id: 'F', x: 50, y: 1100, n: 'Cedar' },
    { id: 'G', x: 50, y: 1100, n: 'Station' },
    { id: 'H', x: 50, y: 1140, n: 'Station' },
    { id: 'I', x: 60, y: 1320, n: 'Cedar' },
    { id: 'J', x: 60, y: 1400, n: 'Cedar' },
    { id: 'K', x: 60, y: 1400, n: 'Cedar' },
    { id: 'L', x: 60, y: 1480, n: 'Cedar' },
    { id: 'M', x: 60, y: 1800, n: 'Cedar' },
  ];

  let pts = START.map(p => ({ ...p }));
  let sel = 12; // card M selected initially
  let random = false;
  let inspectedThisRandom = false;
  let randomInspects = 0;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 56 : 64, X1 = VW - 18, TOP = 24, BASE = 318;
  const svg = s('svg', { viewBox: `0 0 ${VW} 360` });
  const barSvg = s('svg', { viewBox: `0 0 ${VW} 152`, style: 'margin-top:.55rem' });

  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  function bumpRent(d) {
    pts[sel].y = Math.max(900, Math.min(1900, pts[sel].y + d));
    draw();
  }
  function bumpArea(d) {
    pts[sel].x = Math.max(36, Math.min(64, pts[sel].x + d));
    draw();
  }
  function makeRandom() {
    const base = rnd(920, 1020);
    const slope = rnd(14, 24);
    const areas = [40, 40, 40, 40, 50, 50, 50, 50, 60, 60, 60, 60, 60];
    const ids = START.map(p => p.id);
    const next = areas.map((x, i) => ({
      id: ids[i],
      x,
      y: Math.max(900, Math.min(1850, Math.round((base + slope * (x - 40) + rnd(-70, 70)) / 10) * 10)),
      n: i % 3 === 2 ? 'Station' : 'Cedar',
    }));
    // Add one clear mover on an outer size so Cook's D stands out
    const outlierIdx = rnd(0, 1) ? rnd(8, 12) : rnd(0, 3);
    const dir = outlierIdx >= 8 ? 1 : -1;
    next[outlierIdx].y = Math.max(900, Math.min(1900, next[outlierIdx].y + dir * rnd(320, 460)));
    pts = next;
    random = true;
    inspectedThisRandom = false;
    const st = analyze(pts);
    sel = st.maxIdx === 0 ? 1 : 0;
    draw();
  }
  function reset() {
    pts = START.map(p => ({ ...p }));
    sel = 12;
    random = false;
    inspectedThisRandom = false;
    draw();
  }
  function pick(idx) {
    sel = idx;
    const st = analyze(pts);
    if (random && !inspectedThisRandom && sel === st.maxIdx) {
      inspectedThisRandom = true;
      randomInspects++;
    }
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Which listing moves the line?'),
    h('p', { class: 'sub' }, 'Tap any card (or bar below) to leave it out and compare both lines. Drag a card up or down to change its rent, or sideways to change its floor area.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        barSvg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$50', () => bumpRent(-50)),
          btn('+$50', () => bumpRent(50)),
          btn('← −5 m²', () => bumpArea(-5)),
          btn('+5 m² →', () => bumpArea(5)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn("Select highest Cook's D", () => pick(analyze(pts).maxIdx), 'go'),
          btn('New data (random)', makeRandom),
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Tap card I (60 m², $1,320) to check the second highest score.',
      check: st => !st.random && st.selId === 'I',
      why: "Yes! Card I has Cook's distance 0.10, about nine times smaller than M's 0.90.",
    },
    {
      text: "Select card M and drag it down (or tap −$50) until its Cook's distance is below 0.15.",
      check: st => !st.random && st.selId === 'M' && st.selD < 0.15 && st.selX >= 58,
      why: "When M's asking rent matches the other 60 m² listings, leaving M out barely moves the line.",
    },
    {
      text: "Keep M at $1,750 or higher, then drag M sideways to the middle (near 50 m²). Watch Cook's distance!",
      check: st => !st.random && st.selId === 'M' && st.selY >= 1750 && Math.abs(st.selX - 50) <= 2,
      why: "Right: a high rent in the middle lifts the line evenly instead of tilting it, cutting Cook's distance in half.",
    },
    {
      text: 'Press “New data (random)” and tap the tallest bar in the Cook’s distance chart, twice.',
      check: st => st.randomInspects >= 2,
      why: "Every time, the tallest Cook's distance bar points straight to the listing that shifts the fitted line most.",
    },
  ]);

  // OLS & exact leave-one-out Cook's distance
  function fitOLS(arr) {
    const n = arr.length;
    let sx = 0, sy = 0;
    for (const p of arr) { sx += p.x; sy += p.y; }
    const mx = sx / n, my = sy / n;
    let sxx = 0, sxy = 0;
    for (const p of arr) { const dx = p.x - mx; sxx += dx * dx; sxy += dx * (p.y - my); }
    const b = sxx > 1e-9 ? sxy / sxx : 0;
    const a = my - b * mx;
    return { a, b, hat: x => a + b * x };
  }

  function analyze(arr) {
    const full = fitOLS(arr);
    const n = arr.length;
    let rss = 0;
    const res = arr.map(p => { const r = p.y - full.hat(p.x); rss += r * r; return r; });
    const df = Math.max(1, n - 2);
    const mse = rss / df;
    const denom = 2 * mse;
    let maxIdx = 0, maxD = -1;
    const loo = arr.map((_, idx) => {
      const sub = arr.filter((__, j) => j !== idx);
      const fit = fitOLS(sub);
      let sumSqShift = 0;
      for (const p of arr) {
        const d = full.hat(p.x) - fit.hat(p.x);
        sumSqShift += d * d;
      }
      const cookD = denom > 1e-9 ? sumSqShift / denom : 0;
      if (cookD > maxD) { maxD = cookD; maxIdx = idx; }
      return { fit, sumSqShift, cookD };
    });
    return { full, res, rss, df, mse, denom, loo, maxIdx, maxD };
  }

  // Coordinate transforms for scatter SVG
  const xOf = a => X0 + ((a - 35) / 30) * (X1 - X0);
  const yOf = r => BASE - ((r - 850) / 1100) * (BASE - TOP);
  const aOf = px => 35 + ((px - X0) / (X1 - X0)) * 30;
  const rOf = py => 850 + ((BASE - py) / (BASE - TOP)) * 1100;

  // Separate coincident dots sideways while preserving exact height
  function displayCoords(arr) {
    const groups = new Map();
    arr.forEach((p, i) => {
      const key = `${Math.round(p.x)}:${Math.round(p.y)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    });
    const out = arr.map(p => ({ sx: xOf(p.x), sy: yOf(p.y) }));
    const step = NARROW ? 12 : 14;
    for (const idxs of groups.values()) {
      if (idxs.length > 1) {
        idxs.forEach((idx, k) => {
          out[idx].sx += (k - (idxs.length - 1) / 2) * step;
        });
      }
    }
    return out;
  }

  // Pointer dragging on scatter plot
  let dragging = -1, startPx = 0, startPy = 0, moved = false;
  const toSvg = (el, e) => {
    const p = el.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(el.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(svg, e);
    const coords = displayCoords(pts);
    let best = -1, bestDist = 34 * F;
    coords.forEach((c, i) => {
      const d = Math.hypot(p.x - c.sx, p.y - c.sy);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    if (best < 0) return;
    dragging = best;
    startPx = p.x; startPy = p.y; moved = false;
    svg.setPointerCapture(e.pointerId);
    pick(best);
  });

  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(svg, e);
    if (!moved && Math.hypot(p.x - startPx, p.y - startPy) < 5) return;
    moved = true;
    pts[dragging].x = Math.max(36, Math.min(64, Math.round(aOf(p.x))));
    pts[dragging].y = Math.max(900, Math.min(1900, Math.round(rOf(p.y) / 10) * 10));
    draw();
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  // Tap any bar in the Cook's distance chart
  barSvg.addEventListener('pointerdown', e => {
    const p = toSvg(barSvg, e);
    const bx0 = NARROW ? 38 : 48, bx1 = VW - 16;
    const idx = Math.floor((p.x - bx0) / ((bx1 - bx0) / pts.length));
    if (idx >= 0 && idx < pts.length) pick(idx);
  });

  const comma = x => Math.round(x).toLocaleString('en-US');

  function draw() {
    const st = analyze(pts);
    const cur = st.loo[sel];
    const coords = displayCoords(pts);
    const k = [];

    // Grid & y-axis ticks
    for (const r of [1000, 1200, 1400, 1600, 1800]) {
      const yy = yOf(r);
      k.push(
        s('line', { x1: X0, x2: X1, y1: yy, y2: yy, stroke: C.line }),
        s('text', { x: X0 - 8, y: yy + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, comma(r))
      );
    }
    // Axes
    k.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 1.5 })
    );
    for (const a of [40, 50, 60]) {
      const xx = xOf(a);
      k.push(
        s('line', { x1: xx, x2: xx, y1: BASE, y2: BASE + 6, stroke: C.muted }),
        s('text', { x: xx, y: BASE + 22, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a)
      );
    }
    k.push(
      s('text', { x: (X0 + X1) / 2, y: BASE + 38, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'floor area (m²)'),
      s('text', { x: X0 + 4, y: TOP - 7, fill: C.muted, 'font-size': 12 * F }, 'monthly rent ($)')
    );

    // Vertical shift segments between full line and leave-one-out line at every card
    pts.forEach((p, i) => {
      const xx = coords[i].sx;
      const y1 = yOf(st.full.hat(p.x));
      const y2 = yOf(cur.fit.hat(p.x));
      k.push(s('line', { x1: xx, x2: xx, y1, y2, stroke: C.violet, 'stroke-width': 3, 'stroke-opacity': 0.72 }));
    });

    // Both fitted lines
    k.push(
      s('line', {
        x1: xOf(36), y1: yOf(st.full.hat(36)),
        x2: xOf(64), y2: yOf(st.full.hat(64)),
        stroke: C.cyan, 'stroke-width': 3,
      }),
      s('line', {
        x1: xOf(36), y1: yOf(cur.fit.hat(36)),
        x2: xOf(64), y2: yOf(cur.fit.hat(64)),
        stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '8 6',
      })
    );

    // Legend in upper-left
    k.push(
      s('line', { x1: X0 + 10, x2: X0 + 30, y1: TOP + 12, y2: TOP + 12, stroke: C.cyan, 'stroke-width': 3 }),
      s('text', { x: X0 + 36, y: TOP + 16, fill: C.cyan, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'all 13'),
      s('line', { x1: X0 + 10, x2: X0 + 30, y1: TOP + 30, y2: TOP + 30, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '6 4' }),
      s('text', { x: X0 + 36, y: TOP + 34, fill: C.amber, 'font-size': 12 * F, 'font-family': 'Consolas' }, `without ${pts[sel].id}`)
    );

    // Listing markers (Cedar = cyan circle, Station = amber square; selected card has pink ring)
    pts.forEach((p, i) => {
      const { sx, sy } = coords[i];
      const col = p.n === 'Cedar' ? C.cyan : C.amber;
      const isSel = i === sel;
      if (isSel) {
        k.push(s('circle', { cx: sx, cy: sy, r: 14 * F, fill: C.pink, 'fill-opacity': 0.14, stroke: C.pink, 'stroke-width': 2.5 }));
      }
      if (p.n === 'Cedar') {
        k.push(s('circle', { cx: sx, cy: sy, r: 6.5 * F, fill: col, 'fill-opacity': isSel ? 0.55 : 0.92, stroke: isSel ? C.pink : C.bg, 'stroke-width': 1.5 }));
      } else {
        const r = 6 * F;
        k.push(s('rect', { x: sx - r, y: sy - r, width: 2 * r, height: 2 * r, rx: 1.5, fill: col, 'fill-opacity': isSel ? 0.55 : 0.92, stroke: isSel ? C.pink : C.bg, 'stroke-width': 1.5 }));
      }
      if (isSel) {
        const tx = sx > X1 - 64 ? sx - 18 * F : sx + 18 * F;
        const anc = sx > X1 - 64 ? 'end' : 'start';
        k.push(s('text', { x: tx, y: sy + 5, fill: C.pink, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': anc, 'font-family': 'Consolas' }, p.id));
      }
    });
    svg.replaceChildren(...k);

    // Cook's distance bar chart for all 13 listings
    const bk = [];
    const bx0 = NARROW ? 38 : 48, bx1 = VW - 16, bTop = 26, bBase = 122;
    const maxScale = Math.max(1.0, Math.ceil(st.maxD * 5) / 5);
    const slotW = (bx1 - bx0) / pts.length;
    const bw = Math.max(12, slotW * 0.62);

    bk.push(
      s('text', { x: bx0, y: 15, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, "COOK'S DISTANCE BY CARD (TAP ANY BAR)"),
      s('line', { x1: bx0, x2: bx1, y1: bBase, y2: bBase, stroke: C.muted, 'stroke-width': 1 })
    );
    const yHalf = bBase - (0.5 / maxScale) * (bBase - bTop);
    bk.push(
      s('line', { x1: bx0, x2: bx1, y1: yHalf, y2: yHalf, stroke: C.line, 'stroke-dasharray': '5 5' }),
      s('text', { x: bx0 - 6, y: yHalf + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0.5')
    );

    st.loo.forEach((item, i) => {
      const cx = bx0 + slotW * (i + 0.5);
      const hgt = Math.max(2, (item.cookD / maxScale) * (bBase - bTop));
      const isSel = i === sel;
      const isMax = i === st.maxIdx;
      const col = isSel ? C.pink : (isMax ? C.amber : C.cyan);
      if (isSel) {
        bk.push(s('rect', { x: cx - slotW / 2 + 2, y: bTop - 4, width: slotW - 4, height: bBase - bTop + 26, rx: 6, fill: '#ffffff', 'fill-opacity': 0.05 }));
      }
      bk.push(
        s('rect', { x: cx - bw / 2, y: bBase - hgt, width: bw, height: hgt, rx: 3, fill: col, 'fill-opacity': isSel ? 0.95 : 0.72 }),
        s('text', { x: cx, y: bBase + 16, fill: isSel ? C.pink : C.muted, 'font-size': 12 * F, 'font-weight': isSel ? 700 : 500, 'text-anchor': 'middle', 'font-family': 'Consolas' }, pts[i].id)
      );
      if (isSel || isMax || item.cookD >= 0.095) {
        bk.push(s('text', { x: cx, y: bBase - hgt - 5, fill: col, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, item.cookD.toFixed(2)));
      }
    });
    barSvg.replaceChildren(...bk);

    // Formula box & plain-English readout
    const selPt = pts[sel];
    const diffAtX = cur.fit.hat(selPt.x) - st.full.hat(selPt.x);
    const dirWord = diffAtX < -0.5 ? `drops by $${Math.round(Math.abs(diffAtX))}`
      : diffAtX > 0.5 ? `rises by $${Math.round(diffAtX)}` : 'barely changes';
    const dCol = cur.cookD >= 0.5 ? C.pink : cur.cookD >= 0.15 ? C.amber : C.cyan;

    fbox(box, [
      [`card ${selPt.id}: ${selPt.x} m², $${comma(selPt.y)}`, C.pink],
      `shift² sum   = ${comma(cur.sumSqShift)} $²`,
      `res. mean sq = ${comma(st.mse)} $² (df = ${st.df})`,
      `2 × RMS      = ${comma(st.denom)} $²`,
      [`Cook's D     = ${cur.cookD.toFixed(2)}`, dCol],
    ]);

    note.textContent = `Leaving card ${selPt.id} out: at ${selPt.x} m², the fitted rent ${dirWord}. Violet bars show the vertical shift at all 13 cards.`;
    selLabel.textContent = `Selected: card ${selPt.id} (${selPt.x} m², $${comma(selPt.y)})`;

    chal.update({
      random,
      selId: selPt.id,
      selX: selPt.x,
      selY: selPt.y,
      selD: cur.cookD,
      randomInspects,
    });
  }

  draw();
  return () => {};
}

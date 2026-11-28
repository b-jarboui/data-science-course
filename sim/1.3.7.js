// 1.3.7 Try it: Median absolute deviation (MAD).
// Drag any parcel dot along the days line (or tap it and use -1 / +1), lose one parcel to 21 days,
// try random weeks, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [3, 4, 4, 5, 6, 6, 7];
  const MAX_DAY = 22;
  let v = START.slice(), sel = 6, anim = 0, randoms = 0;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: typical distance from the middle'),
    h('p', { class: 'sub' }, 'Each glowing dot is one coffee parcel. Drag a dot left or right along the days line, or tap it and use −1 / +1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 day', () => bump(-1)), btn('+1 day', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Lose one parcel (→ 21 days)', () => loseParcel(), 'go'),
          btn('New week (random)', () => newWeek()),
          btn('Add a parcel', () => { if (v.length < 9) { v.push(rnd(2, 12)); sel = v.length - 1; stopAnim(); draw(); } }),
          btn('Remove a parcel', () => { if (v.length > 3) { v.pop(); sel = Math.min(sel, v.length - 1); stopAnim(); draw(); } }),
          btn('Start again', () => { stopAnim(); v = START.slice(); sel = 6; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const medOf = arr => {
    const a = arr.slice().sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };
  const r2 = x => Math.round(x * 100) / 100;

  const chal = challenges(ch, [
    { text: 'Drag the slowest parcel to 21 days (or press “Lose one parcel”). Does the MAD move?',
      check: st => st.max >= 20 && st.mad === 1,
      why: 'It stays at 1 day! The late parcel moves to the far end of the sorted distances, so the middle spot does not budge.' },
    { text: 'Spread the parcels out so the MAD is exactly 2 days.',
      check: st => st.mad === 2,
      why: 'Yes! Now the middle distance from the median is 2 days, so a typical parcel lands 2 days away.' },
    { text: 'Make the MAD equal to 0, while at least two parcels still arrive on different days.',
      check: st => st.mad === 0 && st.range > 0,
      why: 'Right: when more than half the parcels arrive on the exact same day, the middle distance is 0 — even with other slower or faster parcels.' },
    { text: 'Press “New week (random)” three times. Notice how at least half the parcels always land within one MAD of the median.',
      check: st => st.randoms >= 3,
      why: 'Always! Because MAD is the middle distance, at least half the parcels are at or closer than that distance in every week.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 430 : 410, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 24 : 38, X1 = VW - (NARROW ? 24 : 38);
  const LINE_Y = NARROW ? 196 : 190;
  const DOT_R = NARROW ? 8.5 : 10.5;
  const STACK_DY = NARROW ? 23 : 26;
  const TILE_Y = NARROW ? 316 : 304;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const d2x = d => X0 + (d / MAX_DAY) * (X1 - X0);
  const x2d = x => Math.max(1, Math.min(MAX_DAY, Math.round((x - X0) / (X1 - X0) * MAX_DAY)));

  function stopAnim() { cancelAnimationFrame(anim); anim = 0; }
  function bump(delta) {
    stopAnim();
    v[sel] = Math.max(1, Math.min(MAX_DAY, Math.round(v[sel]) + delta));
    draw();
  }
  function newWeek() {
    stopAnim();
    const base = rnd(4, 10);
    v = v.map((_, i) => i === v.length - 1 && Math.random() < 0.35
      ? rnd(15, 22)
      : Math.max(1, Math.min(MAX_DAY, base + rnd(-3, 3))));
    randoms++;
    draw();
  }
  function loseParcel() {
    stopAnim();
    // Pick the currently slowest parcel and slide it smoothly to 21 days
    let idx = 0;
    for (let i = 1; i < v.length; i++) if (v[i] > v[idx]) idx = i;
    sel = idx;
    const from = v[idx], to = 21, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 650);
      const ease = k * k * (3 - 2 * k);
      v[idx] = k < 1 ? from + (to - from) * ease : to;
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
      else anim = 0;
    };
    anim = requestAnimationFrame(step);
  }

  // Compute screen center of each parcel (with vertical stacking for ties)
  function dotCoords() {
    const counts = new Map();
    return v.map((val, i) => {
      const key = Math.round(val);
      const st = counts.get(key) || 0;
      counts.set(key, st + 1);
      return { i, val, cx: d2x(val), cy: LINE_Y - 22 - st * STACK_DY };
    });
  }

  // Pointer dragging (mouse & touch)
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > LINE_Y + 34) return; // only interact on the days-line panel
    const pts = dotCoords();
    let best = -1, bestD = 38;
    for (const pt of pts) {
      const dist = Math.hypot(pt.cx - p.x, pt.cy - p.y);
      if (dist < bestD) { bestD = dist; best = pt.i; }
    }
    if (best < 0) {
      // Fallback: pick nearest parcel horizontally if tapping near the line
      let bx = 999;
      for (const pt of pts) {
        const dx = Math.abs(pt.cx - p.x);
        if (dx < bx) { bx = dx; best = pt.i; }
      }
    }
    if (best < 0) return;
    stopAnim();
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    v[dragging] = x2d(p.x);
    draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    v[dragging] = x2d(toSvg(e).x);
    draw();
  });
  const endDrag = () => { dragging = -1; };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  function draw() {
    const n = v.length;
    const med = medOf(v);
    const rawDists = v.map(x => Math.abs(x - med));
    const sortedDists = rawDists.slice().sort((a, b) => a - b);
    const mad = medOf(sortedDists);
    const avgDist = rawDists.reduce((a, b) => a + b, 0) / n;
    const minV = Math.min(...v), maxV = Math.max(...v);
    const pts = dotCoords();

    const k = [];
    // Panel 1 title
    k.push(s('text', { x: X0, y: 22, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'DELIVERY DAYS (DRAG ANY DOT)'));

    // Green MAD band around median: [med - mad, med + mad]
    const bx0 = d2x(Math.max(0, med - mad)), bx1 = d2x(Math.min(MAX_DAY, med + mad));
    if (bx1 > bx0) {
      k.push(s('rect', { x: bx0, y: 56, width: bx1 - bx0, height: LINE_Y - 56, fill: C.green, 'fill-opacity': 0.12, rx: 6 }));
    }

    // Days line & ticks
    k.push(s('line', { x1: X0, x2: X1, y1: LINE_Y, y2: LINE_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    const step = NARROW ? 5 : 2;
    for (let d = 0; d <= MAX_DAY; d += step) {
      const x = d2x(d);
      k.push(s('line', { x1: x, x2: x, y1: LINE_Y - 5, y2: LINE_Y + 5, stroke: C.muted, 'stroke-width': 1.5 }),
        s('text', { x, y: LINE_Y + 21, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, d));
    }
    k.push(s('text', { x: X1, y: LINE_Y + 37, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial' }, 'days'));

    // Median dashed line & pill
    const xm = d2x(med);
    k.push(s('line', { x1: xm, x2: xm, y1: 52, y2: LINE_Y + 4, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }));
    const pillW = 108 * F, pillX = Math.max(X0, Math.min(X1 - pillW, xm - pillW / 2));
    k.push(s('rect', { x: pillX, y: 30, width: pillW, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: C.amber, 'stroke-width': 1.5 }),
      s('text', { x: pillX + pillW / 2, y: 30 + 15.5 * F, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEDIAN ' + fmt(r2(med))));

    // Horizontal distance lines from median to each parcel
    pts.forEach(pt => {
      const dist = Math.abs(pt.val - med);
      const isLate = dist >= 8 || pt.val >= 16;
      const col = isLate ? C.pink : (pt.i === sel ? C.amber : C.cyan);
      if (Math.abs(pt.cx - xm) > 2) {
        k.push(s('line', { x1: xm, x2: pt.cx, y1: pt.cy, y2: pt.cy, stroke: col, 'stroke-width': pt.i === sel ? 2.5 : 1.5, 'stroke-opacity': pt.i === sel ? 0.9 : 0.45 }));
      }
      if (pt.i === sel && dist > 0) {
        const midX = (xm + pt.cx) / 2;
        k.push(s('text', { x: midX, y: pt.cy - 8, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(dist))));
      }
    });

    // Parcel dots
    pts.forEach(pt => {
      const dist = Math.abs(pt.val - med);
      const isLate = dist >= 8 || pt.val >= 16;
      const col = isLate ? C.pink : C.cyan;
      if (pt.i === sel) {
        k.push(s('circle', { cx: pt.cx, cy: pt.cy, r: DOT_R + 7, fill: 'none', stroke: C.amber, 'stroke-width': 2 }));
      }
      k.push(s('circle', { cx: pt.cx, cy: pt.cy, r: DOT_R + 4, fill: col, 'fill-opacity': 0.2 }),
        s('circle', { cx: pt.cx, cy: pt.cy, r: DOT_R, fill: col, style: 'cursor:grab' }));
    });

    // Divider line between days line and sorted distances
    k.push(s('line', { x1: X0, x2: X1, y1: TILE_Y - 56, y2: TILE_Y - 56, stroke: C.line, 'stroke-width': 1 }));
    k.push(s('text', { x: X0, y: TILE_Y - 34, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'DISTANCES FROM MEDIAN (SORTED)'));

    // Sorted distance tiles
    const availW = X1 - X0;
    const gap = NARROW ? 6 : 10;
    const tw = Math.min(NARROW ? 46 : 64, (availW - gap * (n - 1)) / n);
    const th = NARROW ? 48 : 52;
    const totalW = n * tw + (n - 1) * gap;
    const sx0 = (VW - totalW) / 2;
    const midLo = Math.floor((n - 1) / 2), midHi = Math.ceil((n - 1) / 2);

    sortedDists.forEach((d, i) => {
      const x = sx0 + i * (tw + gap);
      const isMid = i === midLo || i === midHi;
      const isLate = d >= 8;
      const col = isMid ? C.green : (isLate ? C.pink : C.cyan);
      k.push(
        s('rect', { x, y: TILE_Y - th / 2, width: tw, height: th, rx: 10, fill: col, 'fill-opacity': isMid ? 0.22 : 0.12, stroke: col, 'stroke-width': isMid ? 2.5 : 1.5 }),
        s('text', { x: x + tw / 2, y: TILE_Y + 6 * F, fill: col, 'font-size': (n > 7 ? 15 : 18) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(d))),
        s('text', { x: x + tw / 2, y: TILE_Y + th / 2 + 18 * F, fill: isMid ? C.green : C.muted, 'font-size': 11.5 * F, 'font-weight': isMid ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas' }, String(i + 1))
      );
    });

    // MAD badge below middle tile(s)
    const midCenterX = (sx0 + midLo * (tw + gap) + sx0 + midHi * (tw + gap) + tw) / 2;
    const badgeW = 120 * F, badgeX = Math.max(X0, Math.min(X1 - badgeW, midCenterX - badgeW / 2));
    k.push(
      s('rect', { x: badgeX, y: TILE_Y + th / 2 + 28 * F, width: badgeW, height: 24 * F, rx: 12 * F, fill: C.bg, stroke: C.green, 'stroke-width': 1.8 }),
      s('text', { x: badgeX + badgeW / 2, y: TILE_Y + th / 2 + 44 * F, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MAD = ' + fmt(r2(mad)))
    );

    svg.replaceChildren(...k);

    // Formula box
    const sortedDays = v.map(x => fmt(r2(x))).sort((a, b) => Number(a) - Number(b)).join(', ');
    const distsTxt = sortedDists.map(x => fmt(r2(x))).join(', ');
    const avgPulled = avgDist > mad + 1.2;
    fbox(box, [
      `days   = ${sortedDays}`,
      [`median = ${fmt(r2(med))} days`, C.amber],
      `dists  = ${distsTxt}`,
      [`MAD    = ${fmt(r2(mad))} ${mad === 1 ? 'day' : 'days'}`, C.green],
      [`avg dist = ${fmt(r2(avgDist))} days`, avgPulled ? C.pink : C.muted],
    ]);

    const within = v.filter(x => Math.abs(x - med) <= mad + 1e-9).length;
    note.textContent = avgPulled
      ? `One extreme parcel pulls the average distance up to ${fmt(r2(avgDist))} days, while the MAD stays steady at ${fmt(r2(mad))}.`
      : `${within} of ${n} parcels (at least half) arrive within ${fmt(r2(mad))} ${mad === 1 ? 'day' : 'days'} of the median (${fmt(r2(med))} days).`;
    selLabel.textContent = `Selected: parcel ${sel + 1} (${fmt(r2(v[sel]))} days)`;

    chal.update({
      mad: Math.round(mad * 1000) / 1000,
      med: Math.round(med * 1000) / 1000,
      max: Math.round(maxV * 1000) / 1000,
      range: Math.round((maxV - minV) * 1000) / 1000,
      n,
      randoms,
    });
  }

  draw();
  return () => stopAnim();
}

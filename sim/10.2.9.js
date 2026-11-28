// 10.2.9 Try it: When errors spread out (Heteroskedasticity).
// The learner drags listing dots up or down (or taps one and uses -10 / +10),
// switches between the residual plot and rent vs area, compares fan vs equal spread,
// generates fresh random listings, and completes 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const BASE_CARDS = [
    { id: 'A', g: 0, area: 40, nb: 'Cedar',   fit: 1000, res: -20 },
    { id: 'B', g: 0, area: 40, nb: 'Cedar',   fit: 1000, res:   0 },
    { id: 'C', g: 0, area: 40, nb: 'Station', fit: 1000, res:   0 },
    { id: 'D', g: 0, area: 40, nb: 'Station', fit: 1000, res:  20 },
    { id: 'E', g: 1, area: 50, nb: 'Cedar',   fit: 1100, res: -40 },
    { id: 'F', g: 1, area: 50, nb: 'Cedar',   fit: 1100, res:   0 },
    { id: 'G', g: 1, area: 50, nb: 'Station', fit: 1100, res:   0 },
    { id: 'H', g: 1, area: 50, nb: 'Station', fit: 1100, res:  40 },
    { id: 'I', g: 2, area: 60, nb: 'Cedar',   fit: 1400, res: -80 },
    { id: 'J', g: 2, area: 60, nb: 'Cedar',   fit: 1400, res:   0 },
    { id: 'K', g: 2, area: 60, nb: 'Cedar',   fit: 1400, res:   0 },
    { id: 'L', g: 2, area: 60, nb: 'Cedar',   fit: 1400, res:  80 },
  ];
  const GROUPS = [
    { name: 'Small',  area: 40, fit: 1000, color: C.cyan },
    { name: 'Medium', area: 50, fit: 1100, color: C.amber },
    { name: 'Large',  area: 60, fit: 1400, color: C.pink },
  ];

  let res = BASE_CARDS.map(c => c.res);
  let sel = 3; // start on card D (+20)
  let view = 'resid'; // 'resid' | 'rent'
  let randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const viewBtn = btn('Show rent vs area', () => {
    view = view === 'resid' ? 'rent' : 'resid';
    viewBtn.textContent = view === 'resid' ? 'Show rent vs area' : 'Show residual plot';
    draw();
  });

  function genGroup(halfStep) {
    for (let tries = 0; tries < 60; tries++) {
      const a = rnd(-halfStep, halfStep) * 5;
      const b = rnd(-halfStep, halfStep) * 5;
      const c = rnd(-halfStep, halfStep) * 5;
      const d = -(a + b + c);
      const hi = Math.max(a, b, c, d), lo = Math.min(a, b, c, d);
      if (Math.abs(d) <= halfStep * 5 && hi - lo >= halfStep * 5) {
        return [a, b, c, d].sort((x, y) => x - y);
      }
    }
    return [-halfStep * 5, 0, 0, halfStep * 5];
  }

  function newRandom() {
    const g0 = genGroup(4);
    const g1 = genGroup(9);
    const g2 = genGroup(18);
    res = [...g0, ...g1, ...g2];
    randomCount++;
    draw();
  }

  function makeEqual() {
    res = [-40, 0, 0, 40, -40, 0, 0, 40, -40, 0, 0, 40];
    draw();
  }

  function resetAll() {
    res = BASE_CARDS.map(c => c.res);
    sel = 3;
    draw();
  }

  function bump(delta) {
    res[sel] = Math.max(-100, Math.min(100, res[sel] + delta));
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: when errors spread out'),
    h('p', { class: 'sub' }, 'Each dot is one listing (circle = Cedar, square = Station). Drag any dot up or down, or tap one and use −10 / +10 to change its residual.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−10', () => bump(-10)), btn('+10', () => bump(10)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New listings (random)', newRandom, 'go'),
          btn('Equal spread ($80 bands)', makeEqual),
          viewBtn,
          btn('Start again', resetAll))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10;
  const groupStats = g => {
    const vals = [0, 1, 2, 3].map(k => res[g * 4 + k]);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / 4;
    const sqs = vals.map(v => v * v);
    const sqSum = sqs.reduce((a, b) => a + b, 0);
    return { vals, lo, hi, band: hi - lo, avg, sqs, sqSum, msq: sqSum / 4 };
  };

  const chal = challenges(ch, [
    { text: 'Drag dots in the Small group ($1,000) so its band is $80 while its average residual stays 0.',
      check: st => st.bands[0] === 80 && Math.abs(st.avgs[0]) < 1e-6,
      why: 'Yes! Now the Small group has an $80 band centered on zero, matching the Medium group’s width.' },
    { text: 'Make all three groups have the same average squared gap (above 0) with all three averages at 0, so the fan disappears.',
      check: st => st.avgs.every(a => Math.abs(a) < 1e-6) && st.msq[0] > 0 && st.msq[0] === st.msq[1] && st.msq[1] === st.msq[2],
      why: 'Nice! When every group has the same squared spread, the bands run parallel instead of fanning out.' },
    { text: 'Build a reverse fan: Small band wider than Medium, Medium wider than Large, with all three averages at 0.',
      check: st => st.avgs.every(a => Math.abs(a) < 1e-6) && st.bands[0] > st.bands[1] && st.bands[1] > st.bands[2] && st.bands[2] > 0,
      why: 'Exactly! Error spread can shrink with size too — any changing spread across predictions is heteroskedasticity.' },
    { text: 'Press “New listings (random)” twice and compare the three bands and average squared gaps each time.',
      check: st => st.randomCount >= 2,
      why: 'Good! Even when individual listings change, a growing error spread still produces wider bands and larger average squared gaps.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 52 : 66, X1 = VW - 18, TOP = 36, BOT = 384;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const f2x = f => X0 + (f - 930) / 550 * (X1 - X0);
  const a2x = a => X0 + (a - 35) / 30 * (X1 - X0);
  const res2y = e => BOT - (e + 110) / 220 * (BOT - TOP);
  const y2res = y => ((BOT - y) / (BOT - TOP)) * 220 - 110;
  const rent2y = r => BOT - (r - 880) / 680 * (BOT - TOP);
  const y2rent = y => ((BOT - y) / (BOT - TOP)) * 680 + 880;

  // Dynamic sideways offset for dots sharing the same group and height
  function dotPositions() {
    const pos = new Array(12);
    for (let g = 0; g < 3; g++) {
      const idxs = [0, 1, 2, 3].map(k => g * 4 + k);
      const buckets = new Map();
      idxs.forEach(i => {
        const key = res[i];
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(i);
      });
      const baseX = view === 'resid' ? f2x(GROUPS[g].fit) : a2x(GROUPS[g].area);
      const step = 18 * F;
      for (const list of buckets.values()) {
        list.forEach((i, j) => {
          const dx = (j - (list.length - 1) / 2) * step;
          const cy = view === 'resid' ? res2y(res[i]) : rent2y(BASE_CARDS[i].fit + res[i]);
          pos[i] = { cx: baseX + dx, cy };
        });
      }
    }
    return pos;
  }

  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), pos = dotPositions();
    let best = -1, bestD = 36 * F;
    pos.forEach((pt, i) => {
      const d = Math.hypot(p.x - pt.cx, p.y - pt.cy);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const raw = view === 'resid' ? y2res(p.y) : y2rent(p.y) - BASE_CARDS[dragging].fit;
    res[dragging] = Math.max(-100, Math.min(100, Math.round(raw / 10) * 10));
    draw();
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const stats = [0, 1, 2].map(groupStats);
    const pos = dotPositions();
    const k = [];

    if (view === 'resid') {
      // Grid and y-ticks for residuals
      for (const e of [-100, -80, -40, 0, 40, 80, 100]) {
        const y = res2y(e);
        if (e === 0) {
          k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '7 6' }));
        } else {
          k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }));
        }
        if (e !== -100 && e !== 100) {
          const lbl = e > 0 ? `+${e}` : (e < 0 ? `−${Math.abs(e)}` : '0');
          k.push(s('text', { x: X0 - 8, y: y + 4 * F, fill: e === 0 ? C.ink : C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, lbl));
        }
      }
      // Axes
      k.push(s('line', { x1: X0, x2: X1, y1: BOT, y2: BOT, stroke: C.muted, 'stroke-width': 2 }),
        s('line', { x1: X0, x2: X0, y1: TOP, y2: BOT, stroke: C.muted, 'stroke-width': 2 }));
      // X ticks
      GROUPS.forEach(g => {
        const x = f2x(g.fit);
        k.push(s('line', { x1: x, x2: x, y1: BOT, y2: BOT + 6, stroke: C.muted, 'stroke-width': 2 }),
          s('text', { x, y: BOT + 22 * F, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `$${g.fit.toLocaleString()}`));
      });
      k.push(s('text', { x: (X0 + X1) / 2, y: VH - 8, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'Fitted rent ($)'),
        s('text', { x: X0 + 6, y: TOP - 10, fill: C.muted, 'font-size': 13 * F }, 'Residual ($)'));

      // Vertical bands & labels
      const bw = NARROW ? 46 : 64;
      GROUPS.forEach((g, gi) => {
        const st = stats[gi], x = f2x(g.fit);
        const yTop = res2y(st.hi), yBot = res2y(st.lo);
        const hgt = Math.max(4, yBot - yTop);
        k.push(s('rect', { x: x - bw / 2, y: yTop, width: bw, height: hgt, fill: g.color, 'fill-opacity': 0.16, stroke: g.color, 'stroke-width': 2, rx: 4 }));
        // Average residual marker bar
        const yAvg = res2y(st.avg);
        k.push(s('line', { x1: x - bw / 2 - 4, x2: x + bw / 2 + 4, y1: yAvg, y2: yAvg, stroke: C.amber, 'stroke-width': 3.5 }));
        // Band width above
        k.push(s('text', { x, y: Math.max(TOP + 12, yTop - 8), fill: g.color, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `$${fmt(st.band)}`));
        // Avg squared gap below
        k.push(s('text', { x, y: Math.min(BOT - 6, yBot + 18 * F), fill: g.color, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `avg² ${fmt(r1(st.msq))}`));
      });

      // Fan envelope lines connecting tops and bottoms of the 3 bands
      const topPts = GROUPS.map((g, gi) => `${f2x(g.fit)},${res2y(stats[gi].hi)}`).join(' ');
      const botPts = GROUPS.map((g, gi) => `${f2x(g.fit)},${res2y(stats[gi].lo)}`).join(' ');
      k.push(s('polyline', { points: topPts, fill: 'none', stroke: C.pink, 'stroke-width': 2.2, 'stroke-dasharray': '6 5', 'stroke-opacity': 0.85 }),
        s('polyline', { points: botPts, fill: 'none', stroke: C.pink, 'stroke-width': 2.2, 'stroke-dasharray': '6 5', 'stroke-opacity': 0.85 }));
    } else {
      // Rent vs Floor Area view
      for (const r of [900, 1000, 1100, 1200, 1300, 1400, 1500]) {
        const y = rent2y(r);
        k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }));
        if (r === 1000 || r === 1200 || r === 1400) {
          k.push(s('text', { x: X0 - 8, y: y + 4 * F, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `$${r.toLocaleString()}`));
        }
      }
      k.push(s('line', { x1: X0, x2: X1, y1: BOT, y2: BOT, stroke: C.muted, 'stroke-width': 2 }),
        s('line', { x1: X0, x2: X0, y1: TOP, y2: BOT, stroke: C.muted, 'stroke-width': 2 }));
      GROUPS.forEach(g => {
        const x = a2x(g.area);
        k.push(s('line', { x1: x, x2: x, y1: BOT, y2: BOT + 6, stroke: C.muted, 'stroke-width': 2 }),
          s('text', { x, y: BOT + 22 * F, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${g.area} m²`));
      });
      k.push(s('text', { x: (X0 + X1) / 2, y: VH - 8, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'Floor area (square metres)'),
        s('text', { x: X0 + 6, y: TOP - 10, fill: C.muted, 'font-size': 13 * F }, 'Asking rent ($)'));

      // Curved fitted rule y(a) = 1000 + (a - 40)^2
      const pts = [];
      for (let a = 37; a <= 63; a += 1) pts.push(`${a2x(a)},${rent2y(1000 + (a - 40) * (a - 40))}`);
      k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.green, 'stroke-width': 3 }));

      // Vertical residual bars from curve to dots
      BASE_CARDS.forEach((c, i) => {
        if (res[i] === 0) return;
        const pt = pos[i], yf = rent2y(c.fit);
        k.push(s('line', { x1: pt.cx, x2: pt.cx, y1: yf, y2: pt.cy, stroke: res[i] > 0 ? C.green : C.pink, 'stroke-width': 2.5, 'stroke-opacity': 0.85 }));
      });
    }

    // Legend top-left inside plot
    const lx = X0 + 16, ly = TOP + 14;
    k.push(s('circle', { cx: lx, cy: ly, r: 5.5 * F, fill: C.cyan }),
      s('text', { x: lx + 11 * F, y: ly + 4 * F, fill: C.cyan, 'font-size': 12.5 * F }, 'Cedar'),
      s('rect', { x: lx + 64 * F, y: ly - 5 * F, width: 10 * F, height: 10 * F, fill: C.amber }),
      s('text', { x: lx + 79 * F, y: ly + 4 * F, fill: C.amber, 'font-size': 12.5 * F }, 'Station'));

    // Listing dots (Cedar cyan circle, Station amber square)
    BASE_CARDS.forEach((c, i) => {
      const { cx, cy } = pos[i];
      const col = c.nb === 'Cedar' ? C.cyan : C.amber;
      const isSel = i === sel;
      k.push(s('circle', { cx, cy, r: (isSel ? 17 : 13) * F, fill: col, 'fill-opacity': isSel ? 0.28 : 0.14 }));
      if (isSel) {
        k.push(s('circle', { cx, cy, r: 14 * F, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      }
      if (c.nb === 'Cedar') {
        k.push(s('circle', { cx, cy, r: 6.5 * F, fill: col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor:ns-resize' }));
      } else {
        const sz = 12 * F;
        k.push(s('rect', { x: cx - sz / 2, y: cy - sz / 2, width: sz, height: sz, fill: col, stroke: C.bg, 'stroke-width': 1.5, rx: 2, style: 'cursor:ns-resize' }));
      }
    });

    svg.replaceChildren(...k);

    // Formula box for the selected group + all-group comparison
    const card = BASE_CARDS[sel], grp = GROUPS[card.g], st = stats[card.g];
    const fmtSign = v => v > 0 ? `+${v}` : (v < 0 ? `−${Math.abs(v)}` : '0');
    const gapStr = st.vals.map(fmtSign).join(', ');
    const sqStr = st.sqs.join(' + ');
    fbox(box, [
      [`${grp.name} ($${grp.fit.toLocaleString()}) · card ${card.id}`, grp.color],
      `gaps: ${gapStr}  (avg ${fmtSign(r1(st.avg))})`,
      `sq:   ${sqStr} = ${st.sqSum.toLocaleString()}`,
      [`avg²: ${st.sqSum.toLocaleString()} ÷ 4 = ${fmt(r1(st.msq))}`, grp.color],
      [`bands: $${fmt(stats[0].band)} · $${fmt(stats[1].band)} · $${fmt(stats[2].band)}`, C.pink],
      [`avg²:  ${fmt(r1(stats[0].msq))} · ${fmt(r1(stats[1].msq))} · ${fmt(r1(stats[2].msq))}`, C.violet],
    ]);

    const widening = stats[0].band < stats[1].band && stats[1].band < stats[2].band;
    const flat = stats[0].band === stats[1].band && stats[1].band === stats[2].band;
    note.textContent = flat
      ? 'All three bands have the same width: constant error spread (no fan).'
      : (widening
        ? 'The bands widen from Small to Large like an open fan: a clue of heteroskedasticity.'
        : 'Compare the three band widths and average squared gaps, not only the averages on the zero line.');

    selLabel.textContent = `Selected: card ${card.id} (${grp.name}, residual ${fmtSign(res[sel])}, rent $${(card.fit + res[sel]).toLocaleString()})`;

    chal.update({
      bands: stats.map(x => x.band),
      avgs: stats.map(x => x.avg),
      msq: stats.map(x => x.msq),
      randomCount,
    });
  }

  draw();
  return () => {};
}

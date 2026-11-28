// 10.2.10 Try it: robust standard errors (HC0 vs usual pooled SE).
// Drag any of the 6 apartment dots up or down, watch Usual SE and Robust (HC0) SE update live,
// simulate repeated 6-listing searches to see the actual slope spread, and solve 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START_S = [980, 1000, 1000, 1020];
  const START_L = [1320, 1480];

  let small = START_S.slice();
  let large = START_L.slice();
  let sel = 4; // 0..3 = small, 4..5 = large
  let trials = [];
  let lastGhost = null;
  let anim = 0;
  let isRandom = false;
  let simAfterRandom = false;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 515, F = NARROW ? 1.12 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: robust standard errors'),
    h('p', { class: 'sub' }, 'Drag any apartment dot up or down to change its monthly rent, or tap a dot and use −$10 / +$10. Compare Usual and Robust (HC0) standard errors, then simulate repeated searches.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$10', () => bump(-10)),
          btn('+$10', () => bump(10)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Simulate 200 searches', () => runSim(200), 'go'),
          btn('1 search', () => runSim(1)),
          btn('New listings (random)', () => newRandom()),
          btn('Equal spreads', () => {
            cancelAnimationFrame(anim);
            small = [960, 1000, 1000, 1040];
            large = [1360, 1440];
            trials = []; lastGhost = null; isRandom = false;
            draw();
          }),
          btn('Start again', () => {
            cancelAnimationFrame(anim);
            small = START_S.slice(); large = START_L.slice();
            sel = 4; trials = []; lastGhost = null; isRandom = false;
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const rss = (arr, m) => arr.reduce((a, v) => a + (v - m) * (v - m), 0);
  const r1 = x => Math.round(x * 10) / 10;
  const r2 = x => Math.round(x * 100) / 100;

  function stats() {
    const mS = avg(small), mL = avg(large), slope = mL - mS;
    const rssS = rss(small, mS), rssL = rss(large, mL);
    const shared = (rssS + rssL) / 4; // 6 - 2 = 4
    const uS = shared / 4, uL = shared / 2;
    const usualVar = uS + uL, usualSE = Math.sqrt(usualVar);
    const robS = rssS / 16, robL = rssL / 4; // n^2 = 16 and 4
    const robustVar = robS + robL, robustSE = Math.sqrt(robustVar);
    let simSD = null;
    if (trials.length >= 2) {
      const mt = avg(trials);
      simSD = Math.sqrt(rss(trials, mt) / (trials.length - 1));
    }
    return { mS, mL, slope, rssS, rssL, shared, uS, uL, usualVar, usualSE, robS, robL, robustVar, robustSE, simSD };
  }

  const chal = challenges(ch, [
    {
      text: 'Drag one of the large dots (60 m²) farther from its center until the Robust SE reaches at least $75.',
      check: st => st.robustSE >= 75,
      why: 'Yes! Widening the 2-listing large group pushes the Robust SE up fast because that group supplies its own spread.'
    },
    {
      text: 'Make both groups have similar spreads (or press “Equal spreads”) so Usual SE and Robust SE are within $4 of each other.',
      check: st => st.usualSE > 5 && Math.abs(st.usualSE - st.robustSE) <= 4,
      why: 'Right: when both groups have similar spreads, pooling and keeping them separate give nearly the same standard error.'
    },
    {
      text: 'Make the small group (4 dots) spread wider than the large group (2 dots), so Robust SE becomes at least $5 smaller than Usual SE.',
      check: st => st.usualSE - st.robustSE >= 5,
      why: 'Good catch! Robust SE is not always bigger. When the larger group is noisier, pooling spills that noise into the tighter group.'
    },
    {
      text: 'Press “New listings (random)” and then “Simulate 200 searches” to compare the real slope spread against both SE estimates.',
      check: st => st.simAfterRandom,
      why: 'Across repeated searches, the slope varies with each group’s own spread — and changing the SE never changes the fitted line.'
    },
  ]);

  // Scatter geometry
  const MIN_R = 800, MAX_R = 1650;
  const X0 = NARROW ? 56 : 74, X1 = VW - 18;
  const SY0 = 24, SY1 = 248;
  const x40 = X0 + (X1 - X0) * 0.27;
  const x60 = X0 + (X1 - X0) * 0.74;
  const sOff = NARROW ? [-34, -11, 11, 34] : [-51, -17, 17, 51];
  const lOff = NARROW ? [-18, 18] : [-24, 24];
  const yOf = r => SY1 - (r - MIN_R) / (MAX_R - MIN_R) * (SY1 - SY0);
  const rOf = y => Math.max(MIN_R + 10, Math.min(MAX_R - 10, Math.round((MIN_R + (SY1 - y) / (SY1 - SY0) * (MAX_R - MIN_R)) / 5) * 5));

  function dotCoords() {
    return [
      ...small.map((r, i) => ({ idx: i, grp: 'S', i, x: x40 + sOff[i], y: yOf(r), r })),
      ...large.map((r, i) => ({ idx: 4 + i, grp: 'L', i, x: x60 + lOff[i], y: yOf(r), r })),
    ];
  }

  function setRent(idx, val) {
    const v = Math.max(MIN_R + 10, Math.min(MAX_R - 10, val));
    if (idx < 4) small[idx] = v; else large[idx - 4] = v;
    cancelAnimationFrame(anim);
    trials = []; lastGhost = null;
    draw();
  }

  function bump(delta) {
    const cur = sel < 4 ? small[sel] : large[sel - 4];
    setRent(sel, cur + delta);
  }

  function newRandom() {
    cancelAnimationFrame(anim);
    const mS = rnd(94, 106) * 10;
    const mL = rnd(132, 148) * 10;
    const spS = rnd(10, 75);
    const spL = rnd(15, 95);
    const clamp = v => Math.max(MIN_R + 20, Math.min(MAX_R - 20, Math.round(v / 5) * 5));
    small = [clamp(mS - spS), clamp(mS - spS * 0.2), clamp(mS + spS * 0.2), clamp(mS + spS)];
    large = [clamp(mL - spL), clamp(mL + spL)];
    trials = []; lastGhost = null; isRandom = true;
    draw();
  }

  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function oneTrial(st) {
    const sdS = Math.sqrt(st.rssS / 4);
    const sdL = Math.sqrt(st.rssL / 2);
    const gs = [0, 1, 2, 3].map(() => st.mS + sdS * randn());
    const gl = [0, 1].map(() => st.mL + sdL * randn());
    const mS = avg(gs), mL = avg(gl);
    return { slope: mL - mS, gs, gl, mS, mL };
  }

  function runSim(count) {
    cancelAnimationFrame(anim);
    const st = stats();
    if (count === 1) {
      const tr = oneTrial(st);
      trials.push(tr.slope);
      lastGhost = tr;
      draw();
      return;
    }
    if (isRandom) simAfterRandom = true;
    let left = count;
    const step = () => {
      const batch = Math.min(left, 16);
      for (let k = 0; k < batch; k++) {
        const tr = oneTrial(st);
        trials.push(tr.slope);
        lastGhost = tr;
      }
      left -= batch;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Pointer drag on dots
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > SY1 + 26) return;
    let best = -1, bestD = 36;
    for (const d of dotCoords()) {
      const dist = Math.hypot(p.x - d.x, p.y - d.y);
      if (dist < bestD) { bestD = dist; best = d.idx; }
    }
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    setRent(best, rOf(p.y));
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    setRent(dragging, rOf(toSvg(e).y));
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const st = stats();
    const els = [];

    // 1. Scatter plot grid & axes
    for (const r of [800, 1000, 1200, 1400, 1600]) {
      const y = yOf(r);
      els.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '$' + r)
      );
    }
    els.push(
      s('line', { x1: X0, x2: X1, y1: SY1, y2: SY1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: SY0, y2: SY1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: x40, y: SY1 + 20, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '40 m² (4 small)'),
      s('text', { x: x60, y: SY1 + 20, fill: C.pink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '60 m² (2 large)')
    );

    // Ghost sample from latest simulated search
    if (lastGhost) {
      const gyS = yOf(Math.max(MIN_R, Math.min(MAX_R, lastGhost.mS)));
      const gyL = yOf(Math.max(MIN_R, Math.min(MAX_R, lastGhost.mL)));
      els.push(s('line', { x1: x40, y1: gyS, x2: x60, y2: gyL, stroke: C.violet, 'stroke-width': 2, 'stroke-dasharray': '5 4', opacity: 0.75 }));
      lastGhost.gs.forEach((r, i) => {
        const y = yOf(Math.max(MIN_R, Math.min(MAX_R, r)));
        els.push(s('circle', { cx: x40 + sOff[i], cy: y, r: 4, fill: C.violet, opacity: 0.45 }));
      });
      lastGhost.gl.forEach((r, i) => {
        const y = yOf(Math.max(MIN_R, Math.min(MAX_R, r)));
        els.push(s('circle', { cx: x60 + lOff[i], cy: y, r: 4, fill: C.violet, opacity: 0.45 }));
      });
    }

    // Group centers & fitted line
    const ymS = yOf(st.mS), ymL = yOf(st.mL);
    els.push(
      s('line', { x1: x40 - (NARROW ? 45 : 64), x2: x40 + (NARROW ? 45 : 64), y1: ymS, y2: ymS, stroke: C.cyan, 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }),
      s('line', { x1: x60 - (NARROW ? 34 : 44), x2: x60 + (NARROW ? 34 : 44), y1: ymL, y2: ymL, stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }),
      s('line', { x1: x40, y1: ymS, x2: x60, y2: ymL, stroke: C.amber, 'stroke-width': 3.2 })
    );

    // Slope pill on plot
    const mx = (x40 + x60) / 2, my = Math.max(SY0 + 18, Math.min(SY1 - 24, (ymS + ymL) / 2 - 22));
    const sw = NARROW ? 114 : 126;
    els.push(
      s('rect', { x: mx - sw / 2, y: my - 13, width: sw, height: 24, rx: 12, fill: C.bg, stroke: C.amber }),
      s('text', { x: mx, y: my + 4, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        'SLOPE ' + (st.slope >= 0 ? '+$' : '−$') + fmt(Math.abs(r1(st.slope))))
    );

    // Gap lines and draggable dots
    for (const d of dotCoords()) {
      const col = d.grp === 'S' ? C.cyan : C.pink;
      const cyM = d.grp === 'S' ? ymS : ymL;
      els.push(s('line', { x1: d.x, y1: cyM, x2: d.x, y2: d.y, stroke: col, 'stroke-width': 2, opacity: 0.75 }));
      els.push(s('circle', { cx: d.x, cy: d.y, r: d.idx === sel ? 14 : 11, fill: col, 'fill-opacity': d.idx === sel ? 0.28 : 0.16 }));
      if (d.idx === sel) els.push(s('circle', { cx: d.x, cy: d.y, r: 12, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      els.push(s('circle', { cx: d.x, cy: d.y, r: 6.5, fill: col, style: 'cursor:ns-resize' }));
    }

    // 2. SE Comparison bars (y = 290..366)
    const BY = 286, BX0 = NARROW ? 116 : 148, BX1 = VW - 86;
    const maxSE = Math.max(100, st.usualSE, st.robustSE, st.simSD || 0) * 1.12;
    const bwOf = v => Math.max(2, (v / maxSE) * (BX1 - BX0));

    els.push(s('line', { x1: 14, x2: VW - 14, y1: BY - 8, y2: BY - 8, stroke: C.line }));
    const rows = [
      { label: 'Usual SE', val: st.usualSE, col: C.amber, y: BY + 12 },
      { label: 'Robust (HC0)', val: st.robustSE, col: C.green, y: BY + 42 },
    ];
    if (st.simSD != null) rows.push({ label: `Sim SD (${trials.length})`, val: st.simSD, col: C.violet, y: BY + 72 });

    for (const r of rows) {
      const w = bwOf(r.val);
      els.push(
        s('text', { x: BX0 - 10, y: r.y + 13, fill: r.col, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, r.label),
        s('rect', { x: BX0, y: r.y, width: BX1 - BX0, height: 19, rx: 5, fill: '#141d3a' }),
        s('rect', { x: BX0, y: r.y, width: w, height: 19, rx: 5, fill: r.col, 'fill-opacity': 0.85 }),
        s('text', { x: BX0 + w + 8, y: r.y + 14, fill: r.col, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, '$' + fmt(r2(r.val)))
      );
    }

    // 3. Repeated-searches slope histogram (y = 392..502)
    const HY0 = 392, HY1 = 486, HX0 = 36, HX1 = VW - 22;
    els.push(s('rect', { x: HX0, y: HY0, width: HX1 - HX0, height: HY1 - HY0, rx: 8, fill: '#0c1328', stroke: C.line }));
    if (trials.length < 2) {
      els.push(s('text', {
        x: (HX0 + HX1) / 2, y: (HY0 + HY1) / 2 + 5, fill: C.muted,
        'font-size': 12.5 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif'
      }, trials.length === 1
        ? `1 search done (slope = $${fmt(r1(trials[0]))}). Press “Simulate 200 searches” to build the spread.`
        : 'Press “Simulate 200 searches” to see how much the slope varies across repeated searches.'));
    } else {
      const span = Math.max(120, Math.max(st.robustSE, st.usualSE, st.simSD) * 3.4);
      const lo = st.slope - span, hi = st.slope + span;
      const BINS = 24, counts = new Array(BINS).fill(0);
      for (const v of trials) {
        const b = Math.max(0, Math.min(BINS - 1, Math.floor((v - lo) / (hi - lo) * BINS)));
        counts[b]++;
      }
      const mxC = Math.max(1, ...counts), bw = (HX1 - HX0 - 16) / BINS;
      counts.forEach((c, i) => {
        if (!c) return;
        const bh = (c / mxC) * (HY1 - HY0 - 24);
        els.push(s('rect', {
          x: HX0 + 8 + i * bw + 1, y: HY1 - 4 - bh, width: Math.max(2, bw - 2), height: bh,
          rx: 2, fill: C.violet, 'fill-opacity': 0.78
        }));
      });
      const cxM = HX0 + 8 + ((st.slope - lo) / (hi - lo)) * (HX1 - HX0 - 16);
      els.push(
        s('line', { x1: cxM, x2: cxM, y1: HY0 + 4, y2: HY1 - 4, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '4 3' }),
        s('text', { x: HX0 + 10, y: HY0 + 16, fill: C.violet, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
          `Simulated slopes (${trials.length} searches) · actual SD = $${fmt(r2(st.simSD))}`),
        s('text', { x: HX0 + 8, y: HY1 + 16, fill: C.muted, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, '$' + Math.round(lo)),
        s('text', { x: cxM, y: HY1 + 16, fill: C.amber, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '$' + fmt(r1(st.slope))),
        s('text', { x: HX1 - 8, y: HY1 + 16, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '$' + Math.round(hi))
      );
    }

    svg.replaceChildren(...els);

    // Formula box
    fbox(box, [
      [`Slope  = $${fmt(r1(st.mL))} − $${fmt(r1(st.mS))} = $${fmt(r1(st.slope))}`, C.amber],
      [`Small basket (4) = ${Math.round(st.rssS).toLocaleString()}`, C.cyan],
      [`Large basket (2) = ${Math.round(st.rssL).toLocaleString()}`, C.pink],
      `Usual:  ${fmt(r1(st.uS))} + ${fmt(r1(st.uL))} = ${fmt(r1(st.usualVar))}`,
      [`        SE = √${fmt(r1(st.usualVar))} = $${fmt(r2(st.usualSE))}`, C.amber],
      `Robust: ${fmt(r1(st.robS))} + ${fmt(r1(st.robL))} = ${fmt(r1(st.robustVar))}`,
      [`        SE = √${fmt(r1(st.robustVar))} = $${fmt(r2(st.robustSE))}`, C.green],
    ]);

    const diff = st.robustSE - st.usualSE;
    note.textContent = Math.abs(diff) <= 3
      ? 'Both groups have similar spreads, so Usual SE and Robust (HC0) SE closely agree. The slope stays identical either way.'
      : diff > 0
        ? `Robust SE is $${fmt(r2(diff))} higher because the smaller 2-listing group has the wider spread. The predicted slope does not change.`
        : `Robust SE is $${fmt(r2(-diff))} lower because the 4-listing group has the wider spread, and pooling spills that noise into the tighter 2-listing group.`;

    const isSmall = sel < 4;
    const curVal = isSmall ? small[sel] : large[sel - 4];
    selLabel.textContent = `Selected: ${isSmall ? `Small #${sel + 1}` : `Large #${sel - 3}`} ($${curVal})`;

    chal.update({ usualSE: st.usualSE, robustSE: st.robustSE, simAfterRandom });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

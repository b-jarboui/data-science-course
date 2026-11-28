// 10.3.10 Try it: the Kaplan–Meier curve.
// Eight clinic waits aligned above the live Kaplan–Meier staircase. Drag any wait bar,
// flip a patient between a closed visit and an open arrow (+), step through the weeks to
// inspect each risk set, generate random clinics, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const NAMES = ['Amal', 'Badr', 'Chen', 'Dina', 'Eli', 'Farah', 'Gus', 'Hana'];
  const START = [
    { w: 2, open: false }, { w: 3, open: false }, { w: 4, open: true }, { w: 6, open: false },
    { w: 7, open: true }, { w: 9, open: false }, { w: 12, open: true }, { w: 12, open: true },
  ];
  const MAXW = 12;
  let pts = START.map(p => ({ ...p })), sel = 3, inspectW = 12, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const weekLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const toggleBtn = btn('Switch to arrow (+)', toggleOpen);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the Kaplan–Meier curve'),
    h('p', { class: 'sub' }, 'Drag any patient’s wait bar left or right, or tap a patient and switch between a follow-up visit and an open arrow (+). Tap the curve or step through the weeks to inspect the risk set.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 week', () => bump(-1)),
          btn('+1 week', () => bump(1)),
          toggleBtn,
          selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('‹ Prev week', () => stepWeek(-1)),
          btn('Next week ›', () => stepWeek(1)),
          btn('Week 12', () => { inspectW = 12; draw(); }),
          weekLabel),
        h('div', { class: 'sim-row' },
          btn('New clinic (random)', newClinic, 'go'),
          btn('Start again', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10;
  const pct = x => fmt(r1(x * 100)) + '%';

  function computeKM() {
    let surv = 1, median = null;
    const steps = [{ w: 0, atRisk: pts.length, events: 0, censored: 0, before: 1, after: 1, eNames: [], cNames: [] }];
    for (let w = 1; w <= MAXW; w++) {
      const atRisk = pts.filter(p => p.w >= w).length;
      const eNames = [], cNames = [];
      pts.forEach((p, i) => {
        if (p.w === w) (p.open ? cNames : eNames).push(NAMES[i]);
      });
      const events = eNames.length, censored = cNames.length;
      const before = surv;
      if (events > 0 && atRisk > 0) surv = surv * (atRisk - events) / atRisk;
      if (median == null && surv <= 0.5 + 1e-9) median = w;
      steps.push({ w, atRisk, events, censored, before, after: surv, eNames, cNames });
    }
    const totalEvents = pts.filter(p => !p.open).length;
    const naiveEnd = (pts.length - totalEvents) / pts.length;
    return { steps, kmEnd: surv, naiveEnd, median, totalEvents };
  }

  const chal = challenges(ch, [
    {
      text: 'Switch Dina (week 6) from a follow-up visit to an arrow (+). Watch what happens to the step at week 6.',
      check: st => st.pts[3].open && st.pts[3].w === 6,
      why: 'Yes! With an arrow, Dina was still waiting when we stopped watching, so the curve stays flat at week 6 and only the risk set shrinks.',
    },
    {
      text: 'Change the waits or visits so the median wait becomes week 6 (curve first reaches 50% or less at week 6).',
      check: st => st.median === 6,
      why: 'Right! Week 6 is now the first week the waiting share hits 50% or less, so the median wait is 6 weeks.',
    },
    {
      text: 'Make the naive week-12 share at least 15 percentage points higher than the Kaplan–Meier curve.',
      check: st => (st.naiveEnd - st.kmEnd) * 100 >= 15 - 1e-6,
      why: 'Nice! Early open ends shrink the risk set, so later visits cause bigger drops than the naive count expects.',
    },
    {
      text: 'Press “New clinic (random)” 3 times. Does an open arrow (+) ever make the curve step down?',
      check: st => st.randomCount >= 3,
      why: 'Never. An arrow only reduces the risk set for later weeks; the curve only steps down when a follow-up happens.',
    },
  ]);

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 62 : 70, X1 = VW - (NARROW ? 56 : 58);
  const TOP = 24, PITCH = 28, BH = 16;
  const DIVY = TOP + 8 * PITCH + 6;
  const GY1 = DIVY + 22, GY0 = GY1 + 165, GH = GY0 - GY1;
  const VH = GY0 + Math.round(32 * F) + 10;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const ux = (X1 - X0) / MAXW, xw = w => X0 + w * ux, yr = i => TOP + i * PITCH, yg = f => GY0 - f * GH;

  function bump(d) {
    pts[sel].w = Math.max(1, Math.min(MAXW, pts[sel].w + d));
    inspectW = pts[sel].w;
    draw();
  }
  function toggleOpen() {
    pts[sel].open = !pts[sel].open;
    inspectW = pts[sel].w;
    draw();
  }
  function stepWeek(d) {
    inspectW = Math.max(0, Math.min(MAXW, inspectW + d));
    draw();
  }
  function newClinic() {
    pts = NAMES.map(() => {
      const w = rnd(1, MAXW);
      const open = w === MAXW ? Math.random() < 0.75 : Math.random() < 0.38;
      return { w, open };
    });
    randomCount++;
    inspectW = MAXW;
    draw();
  }
  function reset() {
    pts = START.map(p => ({ ...p }));
    sel = 3; inspectW = MAXW;
    draw();
  }

  // Pointer interaction: drag a bar in top panel, or scrub week in bottom panel
  let dragMode = null, dragRow = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < DIVY) {
      const i = Math.round((p.y - TOP) / PITCH);
      if (i < 0 || i >= NAMES.length) return;
      sel = i; dragMode = 'bar'; dragRow = i;
    } else {
      dragMode = 'week';
    }
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (!dragMode) return;
    const p = toSvg(e);
    if (dragMode === 'bar') {
      if (p.x >= X0 - 4) {
        pts[dragRow].w = Math.max(1, Math.min(MAXW, Math.round((p.x - X0) / ux)));
        inspectW = pts[dragRow].w;
      }
      draw();
    } else if (dragMode === 'week') {
      inspectW = Math.max(0, Math.min(MAXW, Math.round((p.x - X0) / ux)));
      draw();
    }
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragMode = null; dragRow = -1; });

  function draw() {
    const km = computeKM();
    const cur = km.steps[inspectW];
    const k = [], mono = 'Consolas';

    // Shared vertical week grid
    for (let w = 0; w <= MAXW; w += 2) {
      const x = xw(w);
      k.push(
        s('line', { x1: x, x2: x, y1: TOP - 12, y2: GY0, stroke: C.line }),
        s('text', { x, y: GY0 + 20 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': mono }, w),
      );
    }

    // Divider line
    k.push(s('line', { x1: X0, x2: X1, y1: DIVY, y2: DIVY, stroke: C.line, 'stroke-width': 1.5 }));

    // Vertical inspection scanline
    const xi = xw(inspectW);
    k.push(s('line', { x1: xi, x2: xi, y1: TOP - 14, y2: GY0, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5' }));

    // Top panel: 8 patient wait bars
    NAMES.forEach((name, i) => {
      const y = yr(i), { w, open } = pts[i], col = open ? C.pink : C.cyan;
      const inRisk = inspectW === 0 || w >= inspectW;
      if (i === sel) {
        k.push(s('rect', { x: 2, y: y - PITCH / 2 + 1, width: VW - 4, height: PITCH - 2, rx: 6, fill: '#ffffff', 'fill-opacity': 0.06 }));
      }
      k.push(s('text', { x: X0 - 8, y, fill: inRisk ? C.ink : C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'dominant-baseline': 'central' }, name));
      for (let b = 0; b < w; b++) {
        k.push(s('rect', {
          x: xw(b) + 1, y: y - BH / 2, width: Math.max(1, ux - 2), height: BH, rx: 2,
          fill: col, 'fill-opacity': inRisk ? 0.85 : 0.28,
        }));
      }
      const xe = xw(w);
      if (!open) {
        k.push(s('line', { x1: xe, x2: xe, y1: y - BH / 2 - 3, y2: y + BH / 2 + 3, stroke: C.green, 'stroke-width': 3.5 }));
      } else {
        k.push(
          s('line', { x1: xe, x2: xe + 11, y1: y, y2: y, stroke: C.pink, 'stroke-width': 2.5 }),
          s('polygon', { points: `${xe + 17},${y} ${xe + 9},${y - 5} ${xe + 9},${y + 5}`, fill: C.pink }),
        );
      }
      k.push(s('text', {
        x: VW - 6, y, fill: col, 'font-size': 13 * F, 'font-weight': 700,
        'text-anchor': 'end', 'dominant-baseline': 'central', 'font-family': mono,
      }, open ? `${w}+` : w));
    });

    // Bottom panel: KM axes & horizontal gridlines
    for (const [f, lab] of [[0, '0%'], [0.5, '50%'], [1, '100%']]) {
      const y = yg(f);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: f === 0.5 ? C.amber : C.line, 'stroke-opacity': f === 0.5 ? 0.45 : 1, 'stroke-dasharray': f === 0.5 ? '6 5' : null }),
        s('text', { x: X0 - 8, y: y + 4, fill: f === 0.5 ? C.amber : C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': mono }, lab),
      );
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: GY0, y2: GY0, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X0, y1: GY1 - 4, y2: GY0, stroke: C.muted, 'stroke-width': 2 }),
      s('text', { x: X0 - 12, y: GY0 + 20 * F, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end' }, 'weeks'),
    );

    // KM staircase path
    let d = `M ${xw(0)} ${yg(1)}`;
    for (let w = 1; w <= MAXW; w++) {
      const st = km.steps[w];
      d += ` L ${xw(w)} ${yg(st.before)}`;
      if (st.after !== st.before) d += ` L ${xw(w)} ${yg(st.after)}`;
    }
    k.push(s('path', { d, fill: 'none', stroke: C.cyan, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }));

    // Censor ticks & visit dots on the curve
    for (let w = 1; w <= MAXW; w++) {
      const st = km.steps[w], x = xw(w);
      if (st.censored > 0) {
        const y = yg(st.after);
        k.push(s('line', { x1: x, x2: x, y1: y - 7, y2: y + 7, stroke: C.pink, 'stroke-width': 3 }));
      }
      if (st.events > 0) {
        k.push(s('circle', { cx: x, cy: yg(st.after), r: 4.5, fill: C.cyan, stroke: C.bg, 'stroke-width': 1.5 }));
      }
    }

    // Median marker
    if (km.median != null) {
      const xm = xw(km.median);
      k.push(
        s('line', { x1: xm, x2: xm, y1: yg(0.5), y2: GY0, stroke: C.green, 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
        s('circle', { cx: xm, cy: yg(0.5), r: 5, fill: C.green }),
      );
    }

    // Naive week-12 comparison dot
    const yn = yg(km.naiveEnd), yk = yg(km.kmEnd);
    k.push(
      s('circle', { cx: xw(MAXW), cy: yn, r: 5, fill: 'none', stroke: C.pink, 'stroke-width': 2.5 }),
      s('text', { x: xw(MAXW) + 8, y: yk + 4, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'font-family': mono }, pct(km.kmEnd)),
    );
    if (Math.abs(yn - yk) > 14) {
      k.push(s('text', { x: xw(MAXW) + 8, y: yn + 4, fill: C.pink, 'font-size': 11 * F, 'font-family': mono }, pct(km.naiveEnd) + '?'));
    }

    // Highlight current inspected point
    k.push(s('circle', { cx: xi, cy: yg(cur.after), r: 6.5, fill: C.amber, stroke: C.bg, 'stroke-width': 2 }));

    svg.replaceChildren(...k);

    // Formula box: show exact math at inspected week + summary
    const lines = [];
    if (inspectW === 0) {
      lines.push('week 0 (start): all 8 waiting', ['still waiting = 100%', C.cyan]);
    } else if (cur.events > 0) {
      const stay = cur.atRisk - cur.events;
      lines.push(
        `week ${inspectW} (${cur.eNames.join(', ')}): risk set = ${cur.atRisk}`,
        `stay waiting: ${stay} of ${cur.atRisk}`,
        [`${pct(cur.before)} × ${stay}/${cur.atRisk} = ${pct(cur.after)}`, C.amber],
      );
      if (cur.censored > 0) lines.push([`also open (+): ${cur.cNames.join(', ')}`, C.pink]);
    } else if (cur.censored > 0) {
      const nextRisk = cur.atRisk - cur.censored;
      lines.push(
        `week ${inspectW} (${cur.cNames.join(', ')}): open end (+)`,
        ['curve stays flat at ' + pct(cur.after), C.pink],
        `risk set: ${cur.atRisk} → ${nextRisk}`,
      );
    } else {
      lines.push(
        `week ${inspectW}: no visit, no open end`,
        `risk set = ${cur.atRisk}, curve stays at ${pct(cur.after)}`,
      );
    }
    lines.push(
      ['median wait: ' + (km.median != null ? `week ${km.median}` : 'not reached (> 50%)'), C.green],
      [`week 12: KM ${pct(km.kmEnd)}   naive ${pct(km.naiveEnd)}`, Math.abs(km.naiveEnd - km.kmEnd) > 0.005 ? C.pink : C.cyan],
    );
    fbox(box, lines);

    const openCnt = pts.filter(p => p.open).length;
    note.textContent = inspectW === 0
      ? 'At week 0 everyone is waiting, so the curve starts at 100%.'
      : cur.events > 0
        ? `At week ${inspectW}, ${cur.events} follow-up${cur.events > 1 ? 's' : ''} happened in a risk set of ${cur.atRisk}, so the curve stepped down.`
        : cur.censored > 0
          ? `At week ${inspectW}, ${cur.cNames.join(' and ')} left our view still waiting: no step down, only a smaller risk set.`
          : `${openCnt} open arrow${openCnt === 1 ? '' : 's'} in this clinic. Pink circle at week 12 = naive count (${pts.length - km.totalEvents} of ${pts.length}).`;

    toggleBtn.textContent = pts[sel].open ? 'Switch to follow-up' : 'Switch to arrow (+)';
    selLabel.textContent = `Selected: ${NAMES[sel]} (${pts[sel].open ? pts[sel].w + '+ open' : 'visit week ' + pts[sel].w})`;
    weekLabel.textContent = `Inspecting week ${inspectW} (${pct(cur.after)})`;

    chal.update({ pts, median: km.median, kmEnd: km.kmEnd, naiveEnd: km.naiveEnd, randomCount });
  }

  draw();
  return () => { dragMode = null; dragRow = -1; };
}

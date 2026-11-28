// 2.1.5 Try it: the cumulative staircase (empirical cumulative distribution).
// The learner drags a cutoff time (time -> share) or a target share (share -> time),
// toggles 0%-100% vs 0-to-1 scale, tests adding a 120-min visit into the flat gap,
// generates new random Saturdays, and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Exact 24 Saturday visits from chapters/2.1.md
  const START = [
    { t: 5,   p: 'borrow',   col: C.cyan },
    { t: 8,   p: 'borrow',   col: C.cyan },
    { t: 10,  p: 'borrow',   col: C.cyan },
    { t: 10,  p: 'borrow',   col: C.cyan },
    { t: 12,  p: 'borrow',   col: C.cyan },
    { t: 15,  p: 'borrow',   col: C.cyan },
    { t: 15,  p: 'borrow',   col: C.cyan },
    { t: 20,  p: 'computer', col: C.violet },
    { t: 25,  p: 'computer', col: C.violet },
    { t: 30,  p: 'computer', col: C.violet },
    { t: 30,  p: 'computer', col: C.violet },
    { t: 35,  p: 'computer', col: C.violet },
    { t: 40,  p: 'study',    col: C.amber },
    { t: 45,  p: 'study',    col: C.amber },
    { t: 50,  p: 'study',    col: C.amber },
    { t: 55,  p: 'study',    col: C.amber },
    { t: 60,  p: 'study',    col: C.amber },
    { t: 60,  p: 'study',    col: C.amber },
    { t: 75,  p: 'study',    col: C.amber },
    { t: 85,  p: 'event',    col: C.pink },
    { t: 90,  p: 'study',    col: C.amber },
    { t: 90,  p: 'event',    col: C.pink },
    { t: 95,  p: 'event',    col: C.pink },
    { t: 160, p: 'study',    col: C.amber },
  ];

  let visits = START.map(v => ({ ...v }));
  let isStart = true;
  let mode = 'time';     // 'time' (t -> share) or 'share' (target % -> t)
  let scale = 'pct';     // 'pct' (0%..100%) or 'prop' (0..1)
  let cutoff = 20;       // minutes
  let targetPct = 25;    // percent (0..100, step 5)
  let isRandom = false;
  let movedThisRandom = false;
  let randomChecks = 0;

  const svg = s('svg', { viewBox: '0 0 700 400' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');

  const ctrlLabel = h('span', { style: { fontSize: '14px', color: C.muted, fontWeight: 600 } }, 'Cutoff time:');
  const ctrlVal = h('span', { class: 'sim-pill', style: { color: C.amber, borderColor: C.amber, margin: 0 } }, '20 min');
  const slider = h('input', {
    type: 'range', min: 0, max: 165, step: 1, value: 20,
    style: { flex: '1', minWidth: '140px', accentColor: C.amber, cursor: 'pointer' },
    oninput: e => {
      if (mode === 'time') cutoff = +e.target.value;
      else targetPct = +e.target.value;
      markRandomMove();
      draw();
    },
  });

  const minusBig = btn('−5', () => stepCtrl(-5));
  const minusOne = btn('−1', () => stepCtrl(-1));
  const plusOne = btn('+1', () => stepCtrl(1));
  const plusBig = btn('+5', () => stepCtrl(5));
  const modeBtn = btn('Target share → time', () => {
    mode = mode === 'time' ? 'share' : 'time';
    syncSlider();
    draw();
  }, 'go');
  const scaleBtn = btn('Scale: 0 to 1', () => {
    scale = scale === 'pct' ? 'prop' : 'pct';
    draw();
  });

  function makeRandomSaturday() {
    const out = [];
    // 24 visits with realistic mix of short, medium, and occasional long visits
    for (let i = 0; i < 7; i++) out.push({ t: rnd(5, 22), p: 'borrow', col: C.cyan });
    for (let i = 0; i < 5; i++) out.push({ t: rnd(18, 48), p: 'computer', col: C.violet });
    for (let i = 0; i < 8; i++) out.push({ t: rnd(35, 95), p: 'study', col: C.amber });
    for (let i = 0; i < 3; i++) out.push({ t: rnd(70, 110), p: 'event', col: C.pink });
    out.push({ t: rnd(120, 165), p: 'study', col: C.amber });
    out.sort((a, b) => a.t - b.t);
    return out;
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the cumulative staircase'),
    h('p', { class: 'sub' }, 'Drag the dashed line on the chart (or use the slider) to read what share of visits finish by any time—or switch direction to find the time for any target share.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          ctrlLabel, slider, ctrlVal),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          minusBig, minusOne, plusOne, plusBig),
        h('div', { class: 'sim-row' },
          modeBtn,
          scaleBtn,
          btn('Add a 120-min visit', () => {
            if (visits.length < 32) {
              visits.push({ t: 120, p: 'study', col: C.amber });
              visits.sort((a, b) => a.t - b.t);
              isStart = false;
              draw();
            }
          }),
          btn('New Saturday (random)', () => {
            visits = makeRandomSaturday();
            isStart = false;
            isRandom = true;
            movedThisRandom = false;
            syncSlider();
            draw();
          }),
          btn('Start again', () => {
            visits = START.map(v => ({ ...v }));
            isStart = true;
            isRandom = false;
            movedThisRandom = false;
            mode = 'time';
            scale = 'pct';
            cutoff = 20;
            targetPct = 25;
            syncSlider();
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Drag the cutoff line to 30 minutes on the Saturday data. What share of visits finish in time?',
      check: st => st.isStart && st.mode === 'time' && st.cutoff === 30,
      why: 'Right! 11 of 24 visits finish within 30 minutes—about 46%, just under half.',
    },
    {
      text: 'Move the cutoff to 60 minutes and switch the axis to “0 to 1” to see that share as a decimal.',
      check: st => st.isStart && st.mode === 'time' && st.cutoff === 60 && st.scale === 'prop',
      why: 'Yes! 18 ÷ 24 = 0.75 (75%)—three quarters of visits finish within one hour.',
    },
    {
      text: 'Switch to “Target share → time” and set the target to 50%. By when have half the visits ended?',
      check: st => st.isStart && st.mode === 'share' && st.targetPct === 50,
      why: 'Spot on! Going across from 50% (12 visits) and dropping down lands at 35 minutes.',
    },
    {
      text: 'Press “New Saturday (random)” twice and move the line each time. Does the staircase ever drop down?',
      check: st => st.randomChecks >= 2,
      why: 'Never! Finished visits only add up as time grows, so every cumulative staircase climbs from 0% to 100%.',
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 400, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 56 : 72, X1 = VW - (NARROW ? 16 : 24);
  const TOP = 34, BASE = 326;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const maxT = () => Math.max(165, Math.ceil((Math.max(...visits.map(v => v.t)) + 5) / 15) * 15);
  const xOf = t => X0 + (t / maxT()) * (X1 - X0);
  const yOf = share => BASE - share * (BASE - TOP);

  function markRandomMove() {
    if (isRandom && !movedThisRandom) {
      movedThisRandom = true;
      randomChecks++;
    }
  }

  function syncSlider() {
    if (mode === 'time') {
      const mt = maxT();
      slider.min = 0; slider.max = mt; slider.step = 1;
      cutoff = Math.max(0, Math.min(mt, cutoff));
      slider.value = cutoff;
      slider.style.accentColor = C.amber;
    } else {
      slider.min = 0; slider.max = 100; slider.step = 5;
      targetPct = Math.max(0, Math.min(100, Math.round(targetPct / 5) * 5));
      slider.value = targetPct;
      slider.style.accentColor = C.violet;
    }
  }

  function stepCtrl(delta) {
    if (mode === 'time') {
      cutoff = Math.max(0, Math.min(maxT(), cutoff + delta));
    } else {
      const step = Math.abs(delta) === 1 ? delta * 5 : delta;
      targetPct = Math.max(0, Math.min(100, targetPct + step));
    }
    syncSlider();
    markRandomMove();
    draw();
  }

  // Pointer drag on SVG (horizontal for time mode, vertical for share mode)
  let dragging = false;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const applyPointer = e => {
    const p = toSvg(e);
    if (mode === 'time') {
      const raw = ((p.x - X0) / (X1 - X0)) * maxT();
      const clamped = Math.max(0, Math.min(maxT(), Math.round(raw)));
      const nearest5 = Math.round(clamped / 5) * 5;
      cutoff = Math.abs(clamped - nearest5) <= 2 ? Math.min(maxT(), nearest5) : clamped;
    } else {
      const raw = ((BASE - p.y) / (BASE - TOP)) * 100;
      targetPct = Math.max(0, Math.min(100, Math.round(raw / 5) * 5));
    }
    syncSlider();
    markRandomMove();
    draw();
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.x < X0 - 18 || p.x > X1 + 18 || p.y < TOP - 18 || p.y > BASE + 32) return;
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    applyPointer(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging) applyPointer(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  function draw() {
    syncSlider();
    const n = visits.length;
    const mt = maxT();
    const k = [];

    // Horizontal gridlines & y-axis labels
    const yStops = [0, 0.25, 0.5, 0.75, 1];
    for (const sh of yStops) {
      const y = yOf(sh);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: sh === 0 ? C.muted : C.line, 'stroke-width': sh === 0 ? 2 : 1 }));
      const lbl = scale === 'pct' ? `${Math.round(sh * 100)}%` : fmt(sh);
      k.push(s('text', {
        x: X0 - 10, y: y + 5, fill: scale === 'prop' ? C.cyan : C.muted,
        'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas',
      }, lbl));
    }
    // Y-axis line & title
    k.push(
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 2.2 }),
      s('text', { x: X0 - 6, y: TOP - 12, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial, sans-serif' },
        scale === 'pct' ? 'share (%)' : 'share (0–1)')
    );

    // X-axis ticks (every 30 min)
    for (let t = 0; t <= mt; t += 30) {
      const x = xOf(t);
      k.push(
        s('line', { x1: x, x2: x, y1: BASE, y2: BASE + 6, stroke: C.muted, 'stroke-width': 2 }),
        s('text', { x, y: BASE + 24, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, t)
      );
    }
    k.push(s('text', { x: X1, y: BASE + 48, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'visit length (minutes)'));

    // Compute active reading (forward or backward)
    let activeT, doneCount, activeShare;
    if (mode === 'time') {
      activeT = cutoff;
      doneCount = visits.filter(v => v.t <= activeT).length;
      activeShare = doneCount / n;
    } else {
      const needShare = targetPct / 100;
      const needK = Math.ceil(needShare * n);
      activeT = needK === 0 ? 0 : visits[needK - 1].t;
      doneCount = visits.filter(v => v.t <= activeT).length;
      activeShare = needShare;
    }

    // Subtle shaded region up to activeT
    if (activeT > 0) {
      k.push(s('rect', {
        x: X0, y: TOP, width: Math.max(0, xOf(activeT) - X0), height: BASE - TOP,
        fill: mode === 'time' ? C.amber : C.violet, 'fill-opacity': 0.05,
      }));
    }

    // Build staircase SVG path
    let dPath = `M ${xOf(0)} ${yOf(0)}`;
    let i = 0;
    while (i < n) {
      const t = visits[i].t;
      const prevSh = i / n;
      while (i < n && visits[i].t === t) i++;
      const nextSh = i / n;
      dPath += ` L ${xOf(t)} ${yOf(prevSh)} L ${xOf(t)} ${yOf(nextSh)}`;
    }
    dPath += ` L ${xOf(mt)} ${yOf(1)}`;
    k.push(s('path', { d: dPath, fill: 'none', stroke: C.cyan, 'stroke-width': 3.2, 'stroke-linejoin': 'miter' }));

    // Glowing visitor dots along the bottom axis
    const seen = new Map();
    for (const v of visits) {
      const stack = seen.get(v.t) || 0;
      seen.set(v.t, stack + 1);
      const cx = xOf(v.t);
      const cy = BASE - 7 - stack * 10;
      const included = v.t <= activeT;
      if (included) {
        k.push(s('circle', { cx, cy, r: 7.5, fill: v.col, 'fill-opacity': 0.22 }));
      }
      k.push(s('circle', { cx, cy, r: 4.2, fill: v.col, 'fill-opacity': included ? 1 : 0.28 }));
    }

    // Active reading guide lines & pill badge
    const accent = mode === 'time' ? C.amber : C.violet;
    const gx = xOf(activeT);
    const gy = yOf(activeShare);
    k.push(
      s('line', { x1: gx, x2: gx, y1: BASE, y2: gy, stroke: accent, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
      s('line', { x1: X0, x2: gx, y1: gy, y2: gy, stroke: accent, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
      s('circle', { cx: gx, cy: gy, r: 6.5, fill: accent, stroke: C.bg, 'stroke-width': 2 })
    );

    // Floating callout pill inside open space of chart
    const shareStr = scale === 'pct'
      ? `${fmt(Math.round(activeShare * 1000) / 10)}%`
      : fmt(Math.round(activeShare * 100) / 100);
    const badgeText = mode === 'time'
      ? `${activeT} min → ${shareStr}`
      : `${targetPct}% → ${activeT} min`;
    const bw = (NARROW ? 132 : 154) * F, bh = 26 * F;
    const bx = Math.min(X1 - bw - 4, Math.max(X0 + 8, gx + 12));
    const by = Math.max(TOP + 6, Math.min(BASE - bh - 34, gy - bh - 10));
    k.push(
      s('rect', { x: bx, y: by, width: bw, height: bh, rx: bh / 2, fill: C.bg, stroke: accent, 'stroke-width': 1.8 }),
      s('text', { x: bx + bw / 2, y: by + bh * 0.67, fill: accent, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, badgeText)
    );

    svg.replaceChildren(...k);

    // Formula box & live explanation
    const pctVal = Math.round((doneCount / n) * 1000) / 10;
    const propVal = Math.round((doneCount / n) * 100) / 100;
    if (mode === 'time') {
      fbox(box, [
        `cutoff time = ${activeT} min`,
        `finished ≤ ${activeT} = ${doneCount} of ${n}`,
        `share = ${doneCount} ÷ ${n}`,
        [scale === 'pct' ? `      = ${fmt(pctVal)}%  (${fmt(propVal)})` : `      = ${fmt(propVal)}  (${fmt(pctVal)}%)`, C.amber],
      ]);
      note.textContent = doneCount === 0
        ? `By ${activeT} minutes, no visits have finished yet.`
        : `By ${activeT} minutes, ${doneCount} of ${n} visitors have finished—${fmt(pctVal)}% of the day (or ${fmt(propVal)} on the 0-to-1 scale).`;
    } else {
      const needK = Math.ceil((targetPct / 100) * n);
      fbox(box, [
        `target share = ${targetPct}% (${fmt(targetPct / 100)})`,
        `visits needed = ${needK} of ${n}`,
        [`time needed = ${activeT} min`, C.violet],
        [`actual ≤ ${activeT} = ${doneCount}/${n} (${fmt(pctVal)}%)`, C.muted],
      ]);
      note.textContent = targetPct === 0
        ? '0% corresponds to the very start (0 minutes).'
        : `Go across from ${targetPct}% (${needK} visits) to the staircase and drop down: you land at ${activeT} minutes.`;
    }

    // Update control labels
    ctrlLabel.textContent = mode === 'time' ? 'Cutoff time:' : 'Target share:';
    ctrlVal.textContent = mode === 'time' ? `${cutoff} min` : `${targetPct}%`;
    ctrlVal.style.color = accent;
    ctrlVal.style.borderColor = accent;
    modeBtn.textContent = mode === 'time' ? 'Target share → time' : 'Cutoff time → share';
    scaleBtn.textContent = scale === 'pct' ? 'Scale: 0 to 1' : 'Scale: 0% to 100%';
    minusBig.textContent = mode === 'time' ? '−5 min' : '−10%';
    minusOne.textContent = mode === 'time' ? '−1 min' : '−5%';
    plusOne.textContent = mode === 'time' ? '+1 min' : '+5%';
    plusBig.textContent = mode === 'time' ? '+5 min' : '+10%';

    chal.update({ isStart, mode, scale, cutoff, targetPct, randomChecks });
  }

  draw();
  return () => {};
}

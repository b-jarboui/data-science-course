// 3.3.8 Try it: Observational studies vs Experiments.
// Tap any student dot to switch them between cycling and driving, drag a dot on the
// distance line to move where they live, flip a coin to assign groups by chance, or
// generate fresh random students.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Initial dataset matches the exact lesson numbers:
  // Cyclists: mean 15 min, mean 3 km; Drivers: mean 24 min, mean 12 km; Gap: 9 min.
  const INIT = [
    { d: 1.5, m: 'bike', n: -1.0, t0: 9 },  { d: 2.0, m: 'bike', n: -0.7, t0: 11 },
    { d: 2.0, m: 'bike', n: 0.3,  t0: 12 }, { d: 2.5, m: 'bike', n: -0.3, t0: 13 },
    { d: 2.5, m: 'bike', n: 0.7,  t0: 14 }, { d: 3.0, m: 'bike', n: 0.0,  t0: 15 },
    { d: 3.0, m: 'bike', n: 0.0,  t0: 15 }, { d: 3.5, m: 'bike', n: -0.7, t0: 16 },
    { d: 3.5, m: 'bike', n: 0.3,  t0: 17 }, { d: 4.0, m: 'bike', n: -0.3, t0: 18 },
    { d: 4.0, m: 'bike', n: 0.7,  t0: 19 }, { d: 4.5, m: 'bike', n: 1.0,  t0: 21 },
    { d: 7.5, m: 'car',  n: -1.2, t0: 16 }, { d: 8.5, m: 'car',  n: -0.8, t0: 18 },
    { d: 9.5, m: 'car',  n: -0.3, t0: 20 }, { d: 10.0, m: 'car', n: 0.0,  t0: 21 },
    { d: 10.5, m: 'car', n: 0.2,  t0: 22 }, { d: 11.5, m: 'car', n: -0.3, t0: 23 },
    { d: 12.0, m: 'car', n: 0.0,  t0: 24 }, { d: 13.0, m: 'car', n: 0.5,  t0: 26 },
    { d: 14.0, m: 'car', n: 0.0,  t0: 27 }, { d: 15.0, m: 'car', n: 0.5,  t0: 29 },
    { d: 15.5, m: 'car', n: 0.7,  t0: 30 }, { d: 17.0, m: 'car', n: 0.5,  t0: 32 },
  ];

  // Realistic trip-time model: cycling ~5 + 3.33*d (15 min at 3 km, 45 min at 12 km);
  // driving ~6 + 1.5*d (10.5 min at 3 km, 24 min at 12 km).
  const calcTime = (d, m, n) => m === 'bike'
    ? Math.max(4, Math.round(5 + (10 / 3) * d + n))
    : Math.max(6, Math.round(6 + 1.5 * d + n));

  function makeInitial() {
    return INIT.map(x => ({ d: x.d, m: x.m, n: x.n, t: x.t0 }));
  }

  let students = makeInitial();
  let mode = 'observational'; // 'observational' | 'experiment'
  let sel = 18; // Student #19: driver at 12 km (24 min)
  let switchedFarDriver = false;
  let everExperiment = false;
  let expTrials = 0;
  let obsAfterExp = false;

  const svg = s('svg', { viewBox: '0 0 700 450' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: observational study vs experiment'),
    h('p', { class: 'sub' }, 'Tap any dot to switch that student between cycling and driving, or drag a dot on the distance line. Then flip a coin to assign groups by chance.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Switch bike ↔ car', () => toggleStudent(sel)),
          btn('−1 km', () => bumpDist(-1)),
          btn('+1 km', () => bumpDist(1)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Flip a coin (Experiment)', () => runCoinFlip(), 'go'),
          btn('Let students choose (Observational)', () => runObservational()),
          btn('New students (random)', () => newRandomData()),
          btn('Start again', () => resetAll()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const r1 = x => x == null ? null : Math.round(x * 10) / 10;

  function toggleStudent(i) {
    const st = students[i];
    if (st.m === 'car' && st.d >= 10) switchedFarDriver = true;
    st.m = st.m === 'bike' ? 'car' : 'bike';
    st.t = calcTime(st.d, st.m, st.n);
    draw();
  }

  function bumpDist(delta) {
    const st = students[sel];
    st.d = Math.max(1, Math.min(18, Math.round((st.d + delta) * 2) / 2));
    st.t = calcTime(st.d, st.m, st.n);
    draw();
  }

  function assignByCoin(list) {
    // Independent fair coin flip per student; retry only if a group is empty
    for (let tries = 0; tries < 20; tries++) {
      let bikes = 0;
      list.forEach(st => { st.m = Math.random() < 0.5 ? 'bike' : 'car'; if (st.m === 'bike') bikes++; });
      if (bikes >= 3 && bikes <= list.length - 3) break;
    }
    list.forEach(st => { st.t = calcTime(st.d, st.m, st.n); });
  }

  function assignByChoice(list) {
    // Self-selection: close students usually cycle, far students usually drive
    list.forEach(st => {
      const pBike = st.d <= 5.5 ? 0.9 : st.d <= 7.5 ? 0.35 : 0.05;
      st.m = Math.random() < pBike ? 'bike' : 'car';
    });
    if (!list.some(st => st.m === 'bike')) list[0].m = 'bike';
    if (!list.some(st => st.m === 'car')) list[list.length - 1].m = 'car';
    list.forEach(st => { st.t = calcTime(st.d, st.m, st.n); });
  }

  function runCoinFlip() {
    mode = 'experiment';
    everExperiment = true;
    expTrials++;
    assignByCoin(students);
    draw();
  }

  function runObservational() {
    mode = 'observational';
    assignByChoice(students);
    draw();
  }

  function newRandomData() {
    const fresh = [];
    for (let i = 0; i < 12; i++) fresh.push({ d: rnd(2, 10) / 2, m: 'bike', n: (rnd(-2, 2)) * 0.5, t: 0 });
    for (let i = 0; i < 12; i++) fresh.push({ d: rnd(14, 34) / 2, m: 'car', n: (rnd(-2, 2)) * 0.5, t: 0 });
    students = fresh;
    if (mode === 'experiment') {
      everExperiment = true;
      expTrials++;
      assignByCoin(students);
    } else {
      assignByChoice(students);
      if (everExperiment) obsAfterExp = true;
    }
    draw();
  }

  function resetAll() {
    students = makeInitial();
    mode = 'observational';
    sel = 18;
    draw();
  }

  const chal = challenges(ch, [
    {
      text: 'Tap a driver who lives 10 km or more from campus to make them cycle. Watch what happens to their trip time.',
      check: st => st.switchedFarDriver,
      why: 'Their trip jumped up! Drivers only looked slower because they live much farther from campus.'
    },
    {
      text: 'Press “Flip a coin (Experiment)” to assign groups by chance. Compare the two average distances.',
      check: st => st.mode === 'experiment',
      why: 'With a coin flip, cyclists and drivers live about the same distance away — and now the true difference shows up.'
    },
    {
      text: 'In Experiment mode, press “Flip a coin” or “New students (random)” twice more. Do the average distances stay close?',
      check: st => st.expTrials >= 3,
      why: 'Yes. Assigning by chance balances hidden differences like distance, trial after trial.'
    },
    {
      text: 'Switch back to “Let students choose” and press “New students (random)”. Does the misleading gap come back?',
      check: st => st.obsAfterExp,
      why: 'Every time students pick their own group, distance splits them apart again and creates a misleading gap.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700;
  const VH = NARROW ? 470 : 450;
  const F = NARROW ? 1.12 : 1;
  const X0 = NARROW ? 28 : 42;
  const X1 = VW - (NARROW ? 16 : 24);
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const T_CYC_Y = 78, T_GAP_Y = 114, T_DRV_Y = 150, T_AX_Y = 188;
  const D_CYC_Y = NARROW ? 314 : 302, D_GAP_Y = NARROW ? 350 : 338, D_DRV_Y = NARROW ? 386 : 374, D_AX_Y = NARROW ? 424 : 412;

  const maxT = () => Math.max(35, Math.ceil(Math.max(...students.map(st => st.t)) / 10) * 10);
  const t2x = (v, mx) => X0 + (v / mx) * (X1 - X0);
  const d2x = v => X0 + (v / 20) * (X1 - X0);

  // Pointer interaction: tap any dot to switch bike/car; drag in distance panel to move distance
  let active = -1, panel = '', startPt = null, dragged = false;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  function dotCoords() {
    const mx = maxT();
    const bikes = [], cars = [];
    students.forEach((st, i) => (st.m === 'bike' ? bikes : cars).push(i));
    const rankMap = new Map();
    bikes.sort((a, b) => students[a].t - students[b].t).forEach((idx, r) => rankMap.set('t' + idx, r));
    cars.sort((a, b) => students[a].t - students[b].t).forEach((idx, r) => rankMap.set('t' + idx, r));
    bikes.sort((a, b) => students[a].d - students[b].d).forEach((idx, r) => rankMap.set('d' + idx, r));
    cars.sort((a, b) => students[a].d - students[b].d).forEach((idx, r) => rankMap.set('d' + idx, r));

    return students.map((st, i) => {
      const tr = rankMap.get('t' + i) || 0, dr = rankMap.get('d' + i) || 0;
      const ty = (st.m === 'bike' ? T_CYC_Y : T_DRV_Y) + (tr % 2 ? 7 : -7);
      const dy = (st.m === 'bike' ? D_CYC_Y : D_DRV_Y) + (dr % 2 ? 7 : -7);
      return { tx: t2x(st.t, mx), ty, dx: d2x(st.d), dy };
    });
  }

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), coords = dotCoords();
    let best = -1, bestDist = 26 * F, hitPanel = '';
    coords.forEach((c, i) => {
      const dt = Math.hypot(p.x - c.tx, p.y - c.ty);
      if (dt < bestDist) { bestDist = dt; best = i; hitPanel = 'time'; }
      const dd = Math.hypot(p.x - c.dx, p.y - c.dy);
      if (dd < bestDist) { bestDist = dd; best = i; hitPanel = 'dist'; }
    });
    if (best < 0) return;
    sel = best; active = best; panel = hitPanel; startPt = p; dragged = false;
    svg.setPointerCapture(e.pointerId);
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (active < 0 || panel !== 'dist') return;
    const p = toSvg(e);
    if (!dragged && Math.abs(p.x - startPt.x) < 6) return;
    dragged = true;
    const raw = ((p.x - X0) / (X1 - X0)) * 20;
    const st = students[active];
    st.d = Math.max(1, Math.min(18, Math.round(raw * 2) / 2));
    st.t = calcTime(st.d, st.m, st.n);
    draw();
  });

  svg.addEventListener('pointerup', e => {
    if (active < 0) return;
    const p = toSvg(e);
    if (!dragged && Math.hypot(p.x - startPt.x, p.y - startPt.y) <= 10) {
      toggleStudent(active);
    }
    active = -1;
  });

  function badgeEl(cx, y, text, color) {
    const bw = Math.max(76, text.length * 8.4 + 18) * F;
    const clamped = Math.max(X0 + bw / 2, Math.min(X1 - bw / 2, cx));
    return [
      s('rect', { x: clamped - bw / 2, y: y - 12 * F, width: bw, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: color, 'stroke-width': 1.5 }),
      s('text', { x: clamped, y: y + 3 * F, fill: color, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, text)
    ];
  }

  function draw() {
    const mx = maxT();
    const bikes = students.filter(st => st.m === 'bike');
    const cars = students.filter(st => st.m === 'car');
    const cT = avg(bikes.map(st => st.t)), dT = avg(cars.map(st => st.t));
    const cD = avg(bikes.map(st => st.d)), dD = avg(cars.map(st => st.d));
    const coords = dotCoords();
    const k = [];

    // ---- Top panel: Trip time ----
    k.push(s('text', { x: X0, y: 22, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700 }, 'Trip time (minutes)'));
    k.push(s('text', { x: X1, y: 22, fill: mode === 'experiment' ? C.green : C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
      mode === 'experiment' ? 'EXPERIMENT (COIN)' : 'OBSERVATIONAL (OWN CHOICE)'));

    const stepT = mx > 45 ? 20 : 10;
    for (let g = 0; g <= mx; g += stepT) {
      const x = t2x(g, mx);
      k.push(s('line', { x1: x, x2: x, y1: T_CYC_Y - 22, y2: T_AX_Y, stroke: C.line }),
        s('text', { x, y: T_AX_Y + 18, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g));
    }
    k.push(s('line', { x1: X0, x2: X1, y1: T_AX_Y, y2: T_AX_Y, stroke: C.muted, 'stroke-width': 2 }));
    k.push(s('text', { x: X0 + 2, y: T_CYC_Y - 20, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700 }, `Cyclists (${bikes.length})`));
    k.push(s('text', { x: X0 + 2, y: T_DRV_Y - 20, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700 }, `Drivers (${cars.length})`));

    if (cT != null) {
      const xc = t2x(cT, mx);
      k.push(s('line', { x1: xc, x2: xc, y1: T_CYC_Y - 24, y2: T_GAP_Y, stroke: C.cyan, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }));
      k.push(...badgeEl(xc, T_CYC_Y - 32, `${fmt(r1(cT))} min`, C.cyan));
    }
    if (dT != null) {
      const xd = t2x(dT, mx);
      k.push(s('line', { x1: xd, x2: xd, y1: T_GAP_Y, y2: T_DRV_Y + 26, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }));
      k.push(...badgeEl(xd, T_DRV_Y + 26, `${fmt(r1(dT))} min`, C.amber));
    }
    if (cT != null && dT != null && Math.abs(dT - cT) >= 0.5) {
      const xc = t2x(cT, mx), xd = t2x(dT, mx);
      const col = dT > cT ? C.pink : C.green;
      k.push(s('line', { x1: xc, x2: xd, y1: T_GAP_Y, y2: T_GAP_Y, stroke: col, 'stroke-width': 3 }));
      k.push(...badgeEl((xc + xd) / 2, T_GAP_Y, `gap ${fmt(r1(Math.abs(dT - cT)))} min`, col));
    }

    // ---- Divider ----
    const divY = NARROW ? 236 : 228;
    k.push(s('line', { x1: X0, x2: X1, y1: divY, y2: divY, stroke: C.line, 'stroke-dasharray': '4 6' }));

    // ---- Bottom panel: Distance from campus ----
    k.push(s('text', { x: X0, y: divY + 24, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700 }, 'Distance from campus (km)'));
    k.push(s('text', { x: X1, y: divY + 24, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end' }, 'drag dots left / right'));

    for (let g = 0; g <= 20; g += 5) {
      const x = d2x(g);
      k.push(s('line', { x1: x, x2: x, y1: D_CYC_Y - 22, y2: D_AX_Y, stroke: C.line }),
        s('text', { x, y: D_AX_Y + 18, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g === 0 ? '0 (campus)' : g));
    }
    k.push(s('line', { x1: X0, x2: X1, y1: D_AX_Y, y2: D_AX_Y, stroke: C.muted, 'stroke-width': 2 }));

    if (cD != null) {
      const xc = d2x(cD);
      k.push(s('line', { x1: xc, x2: xc, y1: D_CYC_Y - 24, y2: D_GAP_Y, stroke: C.cyan, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }));
      k.push(...badgeEl(xc, D_CYC_Y - 30, `${fmt(r1(cD))} km`, C.cyan));
    }
    if (dD != null) {
      const xd = d2x(dD);
      k.push(s('line', { x1: xd, x2: xd, y1: D_GAP_Y, y2: D_DRV_Y + 24, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }));
      k.push(...badgeEl(xd, D_DRV_Y + 24, `${fmt(r1(dD))} km`, C.amber));
    }
    if (cD != null && dD != null) {
      const xc = d2x(cD), xd = d2x(dD), dg = Math.abs(dD - cD);
      const col = dg < 2.2 ? C.green : C.pink;
      k.push(s('line', { x1: xc, x2: xd, y1: D_GAP_Y, y2: D_GAP_Y, stroke: col, 'stroke-width': 3 }));
      k.push(...badgeEl((xc + xd) / 2, D_GAP_Y, dg < 2.2 ? `alike (${fmt(r1(dg))} km)` : `${fmt(r1(dg))} km apart`, col));
    }

    // ---- Draw all 24 student dots in both panels ----
    students.forEach((st, i) => {
      const c = coords[i], col = st.m === 'bike' ? C.cyan : C.amber;
      const isSel = i === sel;
      if (isSel) {
        k.push(s('circle', { cx: c.tx, cy: c.ty, r: 12 * F, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
        k.push(s('circle', { cx: c.dx, cy: c.dy, r: 12 * F, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      }
      k.push(s('circle', { cx: c.tx, cy: c.ty, r: 6.5 * F, fill: col, 'fill-opacity': 0.9, style: 'cursor:pointer' }));
      k.push(s('circle', { cx: c.dx, cy: c.dy, r: 6.5 * F, fill: col, 'fill-opacity': 0.9, style: 'cursor:grab' }));
    });

    svg.replaceChildren(...k);

    // Formula box
    const tGap = cT != null && dT != null ? r1(dT - cT) : null;
    const dGap = cD != null && dD != null ? r1(Math.abs(dD - cD)) : null;
    const timeLine = tGap == null ? 'Time gap: —'
      : tGap > 0 ? `Time gap: cyclists ${fmt(tGap)} min faster`
      : tGap < 0 ? `Time gap: drivers ${fmt(-tGap)} min faster`
      : 'Time gap: 0 min (tied)';
    const distLine = dGap == null ? 'Dist gap: —'
      : dGap < 2.2 ? `Dist gap: ${fmt(dGap)} km (balanced!)`
      : `Dist gap: ${fmt(dGap)} km apart`;

    fbox(box, [
      [mode === 'experiment' ? 'Mode: Experiment (coin flip)' : 'Mode: Observational (own choice)', mode === 'experiment' ? C.green : C.amber],
      [`Cyclists: ${cT != null ? fmt(r1(cT)) + ' min' : '—'}  (${cD != null ? fmt(r1(cD)) + ' km' : '—'})`, C.cyan],
      [`Drivers:  ${dT != null ? fmt(r1(dT)) + ' min' : '—'}  (${dD != null ? fmt(r1(dD)) + ' km' : '—'})`, C.amber],
      [timeLine, tGap != null && tGap > 0 ? C.pink : C.green],
      [distLine, dGap != null && dGap < 2.2 ? C.green : C.pink],
    ]);

    note.textContent = mode === 'experiment'
      ? 'Coin flips give both groups similar average distances. Now the trip-time gap reflects how fast each travel mode really is.'
      : 'Students chose for themselves: nearby students cycle and far-away students drive, so distance hides inside the trip-time gap.';

    const st = students[sel];
    selLabel.textContent = `Student #${sel + 1}: ${st.m === 'bike' ? 'Cyclist' : 'Driver'}, ${fmt(st.d)} km, ${st.t} min`;

    chal.update({ mode, switchedFarDriver, expTrials, obsAfterExp });
  }

  draw();
  return () => {};
}

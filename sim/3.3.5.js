// 3.3.5 Try it: cluster sampling.
// Tap any of the 100 tutorial rooms, draw random cluster samples, run 50 draws to compare
// cluster sampling against drawing the same number of students one by one from the roster,
// generate fresh random universities, and solve 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const HILL = '#fb923c';
  const START_PICKED = [12, 47, 84]; // Room 1 (mean 18), Room 2 (mean 22), Room 3 (mean 47)

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const r1 = x => Math.round(x * 10) / 10;
  const r2 = x => Math.round(x * 100) / 100;

  // Build the exact chapter 3.3 university:
  // 60 City rooms (mean 20.0) + 40 Hill rooms (mean 45.0) = 1,000 students, true mean 30.0.
  function makeLessonUni() {
    const rooms = [];
    const cityPairs = [
      -5, 5, -4, 4, -4, 4, -3, 3, -3, 3, -3, 3, -2, 2, -2, 2, -2, 2, -2, 2,
      -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      -6, 6, -5, 5, -3, 3, -2, 2, -1, 1, -4, 4, -2, 2, -1, 1, 0, 0
    ];
    let cp = 0;
    for (let i = 0; i < 60; i++) {
      let trips;
      if (i === 12) trips = [15, 16, 17, 17, 18, 18, 19, 19, 20, 21]; // exact Room 1 (mean 18)
      else if (i === 47) trips = [19, 20, 21, 21, 22, 22, 23, 23, 24, 25]; // exact Room 2 (mean 22)
      else {
        const m = 20 + cityPairs[cp++];
        trips = [m - 3, m - 2, m - 1, m - 1, m, m, m + 1, m + 1, m + 2, m + 3];
      }
      rooms.push({ id: i, campus: 0, trips, mean: avg(trips) });
    }
    const hillPairs = [
      -6, 6, -5, 5, -5, 5, -4, 4, -4, 4, -3, 3, -3, 3, -3, 3, -2, 2, -2, 2,
      -2, 2, -1, 1, -1, 1, -1, 1, 0, 0, 0, 0, -4, 4, -3, 3, -1, 1
    ];
    let hp = 0;
    for (let i = 0; i < 40; i++) {
      const idx = 60 + i;
      let trips;
      if (idx === 84) trips = [43, 44, 45, 46, 47, 47, 48, 49, 50, 51]; // exact Room 3 (mean 47)
      else if (idx === 65) trips = [39, 40, 41, 42, 43, 43, 44, 45, 46, 47]; // balances Room 84 (mean 43)
      else {
        const m = 45 + hillPairs[hp++];
        trips = [m - 4, m - 3, m - 2, m - 1, m, m, m + 1, m + 2, m + 3, m + 4];
      }
      rooms.push({ id: idx, campus: 1, trips, mean: avg(trips) });
    }
    return finalizeUni(rooms, 60);
  }

  // Fresh random university: random campus split and room means, same tight-inside-room structure
  function makeRandomUni() {
    const cityN = rnd(38, 68);
    const cBase = rnd(14, 23), hBase = rnd(39, 50);
    const rooms = [];
    for (let i = 0; i < 100; i++) {
      const isHill = i >= cityN;
      const center = Math.max(8, Math.min(54, (isHill ? hBase : cBase) + rnd(-5, 5)));
      const off = isHill ? [-4, -3, -2, -1, 0, 0, 1, 2, 3, 4] : [-3, -2, -1, -1, 0, 0, 1, 1, 2, 3];
      const trips = off.map(d => Math.max(3, Math.min(59, center + d)));
      rooms.push({ id: i, campus: isHill ? 1 : 0, trips, mean: avg(trips) });
    }
    return finalizeUni(rooms, cityN);
  }

  function finalizeUni(rooms, cityCount) {
    const allStudents = rooms.flatMap(r => r.trips);
    return { rooms, cityCount, hillCount: 100 - cityCount, allStudents, trueMean: avg(allStudents) };
  }

  function pickKRooms(k) {
    const bag = Array.from({ length: 100 }, (_, i) => i);
    const out = [];
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(Math.random() * (100 - i));
      [bag[i], bag[j]] = [bag[j], bag[i]];
      out.push(bag[i]);
    }
    return out.sort((a, b) => a - b);
  }

  function rosterMean(n) {
    let sum = 0;
    const all = uni.allStudents, N = all.length;
    const used = new Set();
    while (used.size < n) {
      const idx = Math.floor(Math.random() * N);
      if (!used.has(idx)) { used.add(idx); sum += all[idx]; }
    }
    return sum / n;
  }

  let uni = makeLessonUni();
  let k = 3;
  let picked = START_PICKED.slice();
  let clusterEsts = [], rosterEsts = [];
  let freshData = false;
  let anim = 0;

  // UI skeleton
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 535 : 475, F = NARROW ? 1.12 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const kLab = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.ink } });
  const slider = h('input', {
    type: 'range', min: 1, max: 15, value: String(k),
    style: { flex: '1 1 120px', accentColor: C.cyan, minHeight: '32px', cursor: 'pointer' },
    oninput: () => {
      stopAnim();
      k = +slider.value;
      picked = pickKRooms(k);
      clusterEsts = []; rosterEsts = [];
      draw();
    }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: cluster sampling'),
    h('p', { class: 'sub' }, 'Each small box is one tutorial room of 10 students. Tap rooms to pick your own clusters, or run many draws to compare cluster sampling against drawing students one by one from the roster.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, kLab, slider),
        h('div', { class: 'sim-row' },
          btn('Draw 1 sample', () => { stopAnim(); drawOnce(true); }, 'go'),
          btn('Run 50 draws', () => runMany(50), 'go'),
          btn('Clear draws', () => { stopAnim(); clusterEsts = []; rosterEsts = []; draw(); }),
          btn('New data', () => {
            stopAnim();
            uni = makeRandomUni();
            freshData = true;
            picked = pickKRooms(k);
            clusterEsts = []; rosterEsts = [];
            draw();
          }),
          btn('Start again', () => {
            stopAnim();
            uni = makeLessonUni();
            freshData = false;
            k = 3; slider.value = '3';
            picked = START_PICKED.slice();
            clusterEsts = []; rosterEsts = [];
            draw();
          }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Tap rooms in the grid to pick 3 rooms from the same campus (all cyan or all orange). Watch the estimate.',
      check: st => st.picked.length === 3 && (st.allCity || st.allHill),
      why: 'Right! With only 3 rooms, picking all from one campus pulls the estimate far away from the truth line.' },
    { text: 'Set rooms to 3 and press “Run 50 draws”. Compare the spread of 3 rooms against 30 random students.',
      check: st => st.k === 3 && st.trials >= 50,
      why: 'Look how wide the cluster draws are: 30 students in 3 rooms bounce far more than 30 separate students from the roster.' },
    { text: 'Move the slider to at least 10 rooms, then press “Run 50 draws” to tighten the cluster estimates.',
      check: st => st.k >= 10 && st.trials >= 50,
      why: 'Yes! Picking more rooms adds more independent pieces of news, so the estimates cluster much closer to the truth.' },
    { text: 'Press “New data” for a fresh university, then press “Run 50 draws”. Does the roster sample still beat clusters of the same head count?',
      check: st => st.freshData && st.trials >= 50,
      why: 'Every time. Because people inside one room are alike, clusters give less new information per person than individuals.' }
  ]);

  // SVG layout coordinates
  const GX0 = NARROW ? 14 : 30, GX1 = VW - (NARROW ? 14 : 30);
  const GY0 = NARROW ? 34 : 30, GY1 = NARROW ? 224 : 188;
  const CW = (GX1 - GX0) / 10, CH = (GY1 - GY0) / 10;

  const AX0 = NARROW ? 26 : 44, AX1 = VW - (NARROW ? 18 : 28);
  const ax = v => AX0 + (Math.max(0, Math.min(60, v)) / 60) * (AX1 - AX0);
  const DOTS_Y0 = NARROW ? 250 : 210, DOTS_BASE = NARROW ? 326 : 276;
  const H1_TOP = NARROW ? 360 : 310, H1_BASE = NARROW ? 420 : 368;
  const H2_TOP = NARROW ? 446 : 394, H2_BASE = NARROW ? 506 : 450;

  function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = 0; } }

  function drawOnce(shouldDraw) {
    picked = pickKRooms(k);
    const cMean = avg(picked.map(id => uni.rooms[id].mean));
    const rMean = rosterMean(k * 10);
    clusterEsts.push(cMean);
    rosterEsts.push(rMean);
    if (shouldDraw) draw();
  }

  function runMany(count) {
    stopAnim();
    let left = count;
    const step = () => {
      const batch = Math.min(left, 2);
      for (let i = 0; i < batch; i++) drawOnce(false);
      left -= batch;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
      else anim = 0;
    };
    anim = requestAnimationFrame(step);
  }

  // Tap any room box in the 10x10 grid to toggle it
  const toSvg = e => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(ctm.inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (!p || p.x < GX0 || p.x > GX1 || p.y < GY0 || p.y > GY1) return;
    const col = Math.floor((p.x - GX0) / CW), row = Math.floor((p.y - GY0) / CH);
    const id = row * 10 + col;
    if (id < 0 || id >= 100) return;
    stopAnim();
    const pos = picked.indexOf(id);
    if (pos >= 0) {
      if (picked.length <= 1) return; // keep at least 1 room selected
      picked.splice(pos, 1);
    } else {
      picked.push(id);
      picked.sort((a, b) => a - b);
    }
    k = Math.max(1, Math.min(15, picked.length));
    slider.value = String(k);
    clusterEsts = []; rosterEsts = [];
    draw();
  });

  function histBins(vals) {
    const bins = new Array(30).fill(0); // 0..60 in 2-min bins
    for (const v of vals) {
      const b = Math.max(0, Math.min(29, Math.floor(v / 2)));
      bins[b]++;
    }
    return bins;
  }

  function draw() {
    const el = [];
    const selSet = new Set(picked);
    const pickedRooms = picked.map(id => uni.rooms[id]);
    const est = avg(pickedRooms.map(r => r.mean));
    const headCount = picked.length * 10;
    const tx = ax(uni.trueMean), ex = ax(est);

    // --- ZONE 1: 10x10 Grid of 100 Tutorial Rooms ---
    el.push(
      s('text', { x: GX0, y: GY0 - 10, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, '100 TUTORIAL ROOMS (TAP ANY ROOM)'),
      s('rect', { x: GX1 - (NARROW ? 132 : 165), y: GY0 - 20, width: 10, height: 10, rx: 2, fill: C.cyan }),
      s('text', { x: GX1 - (NARROW ? 118 : 150), y: GY0 - 10, fill: C.cyan, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, `City (${uni.cityCount})`),
      s('rect', { x: GX1 - (NARROW ? 62 : 78), y: GY0 - 20, width: 10, height: 10, rx: 2, fill: HILL }),
      s('text', { x: GX1 - (NARROW ? 48 : 63), y: GY0 - 10, fill: HILL, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, `Hill (${uni.hillCount})`)
    );
    for (let i = 0; i < 100; i++) {
      const r = uni.rooms[i], row = Math.floor(i / 10), col = i % 10;
      const x = GX0 + col * CW + 1.5, y = GY0 + row * CH + 1.2, w = CW - 3, hgt = CH - 2.4;
      const baseCol = r.campus === 0 ? C.cyan : HILL;
      const isSel = selSet.has(i);
      el.push(s('rect', {
        x, y, width: w, height: hgt, rx: 3,
        fill: baseCol, 'fill-opacity': isSel ? 0.90 : 0.14,
        stroke: isSel ? '#ffffff' : baseCol,
        'stroke-opacity': isSel ? 1 : 0.38,
        'stroke-width': isSel ? 1.8 : 0.9,
        style: 'cursor:pointer'
      }));
      if (isSel) {
        el.push(s('text', {
          x: x + w / 2, y: y + hgt / 2 + 4, fill: C.bg,
          'font-size': (NARROW ? 10.5 : 11.5), 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas', 'pointer-events': 'none'
        }, fmt(r1(r.mean))));
      }
    }

    // --- ZONE 2: Current Sample Dots on 0-60 Minutes Line ---
    el.push(
      s('text', { x: AX0, y: DOTS_Y0 - 6, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `CURRENT SAMPLE: ${picked.length} ROOM${picked.length === 1 ? '' : 'S'} (${headCount} STUDENTS)`),
      s('line', { x1: AX0, x2: AX1, y1: DOTS_BASE, y2: DOTS_BASE, stroke: C.muted, 'stroke-width': 1.5 })
    );
    const counts = new Map();
    pickedRooms.forEach(r => {
      const col = r.campus === 0 ? C.cyan : HILL;
      r.trips.forEach(v => {
        const key = Math.round(v);
        const c = counts.get(key) || 0;
        counts.set(key, c + 1);
        const stepY = headCount > 60 ? 3.8 : 6.2;
        const dy = Math.min(DOTS_BASE - DOTS_Y0 - 10, 6 + c * stepY);
        el.push(s('circle', {
          cx: ax(v), cy: DOTS_BASE - dy, r: headCount > 60 ? 2.6 : 3.4,
          fill: col, 'fill-opacity': 0.9
        }));
      });
    });

    // Estimate marker (solid green) & truth line (dashed amber) across Zone 2
    el.push(
      s('line', { x1: tx, x2: tx, y1: DOTS_Y0 + 2, y2: DOTS_BASE, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
      s('line', { x1: ex, x2: ex, y1: DOTS_Y0 + 2, y2: DOTS_BASE, stroke: C.green, 'stroke-width': 2.6 }),
      s('circle', { cx: ex, cy: DOTS_BASE, r: 4.5, fill: C.green }),
      s('text', {
        x: Math.max(AX0 + 26, Math.min(AX1 - 26, ex + (ex <= tx ? -28 : 28))), y: DOTS_Y0 + 12,
        fill: C.green, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `est ${fmt(r1(est))}`),
      s('text', {
        x: Math.max(AX0 + 32, Math.min(AX1 - 32, tx + (ex <= tx ? 34 : -34))), y: DOTS_Y0 + 12,
        fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `truth ${fmt(r1(uni.trueMean))}`)
    );

    // --- ZONE 3: Twin Histograms (Cluster vs Roster) ---
    const nTrials = clusterEsts.length;
    const cRange = nTrials ? ` · ${fmt(r1(Math.min(...clusterEsts)))}–${fmt(r1(Math.max(...clusterEsts)))} min` : '';
    const rRange = nTrials ? ` · ${fmt(r1(Math.min(...rosterEsts)))}–${fmt(r1(Math.max(...rosterEsts)))} min` : '';

    el.push(
      s('text', { x: AX0, y: H1_TOP - 8, fill: C.pink, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `CLUSTER DRAWS (${k} ROOM${k === 1 ? '' : 'S'} = ${k * 10})${cRange}`),
      s('line', { x1: AX0, x2: AX1, y1: H1_BASE, y2: H1_BASE, stroke: C.line, 'stroke-width': 1.4 }),
      s('text', { x: AX0, y: H2_TOP - 8, fill: C.green, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `ROSTER DRAWS (${k * 10} RANDOM STUDENTS)${rRange}`),
      s('line', { x1: AX0, x2: AX1, y1: H2_BASE, y2: H2_BASE, stroke: C.muted, 'stroke-width': 1.4 })
    );

    if (nTrials > 0) {
      const cb = histBins(clusterEsts), rb = histBins(rosterEsts);
      const maxC = Math.max(3, ...cb), maxR = Math.max(3, ...rb);
      const bw = (AX1 - AX0) / 30;
      for (let b = 0; b < 30; b++) {
        if (cb[b] > 0) {
          const bh = (cb[b] / maxC) * (H1_BASE - H1_TOP - 4);
          el.push(s('rect', {
            x: AX0 + b * bw + 1, y: H1_BASE - bh, width: Math.max(2, bw - 2), height: bh,
            rx: 2, fill: C.pink, 'fill-opacity': 0.82
          }));
        }
        if (rb[b] > 0) {
          const bh = (rb[b] / maxR) * (H2_BASE - H2_TOP - 4);
          el.push(s('rect', {
            x: AX0 + b * bw + 1, y: H2_BASE - bh, width: Math.max(2, bw - 2), height: bh,
            rx: 2, fill: C.green, 'fill-opacity': 0.82
          }));
        }
      }
    } else {
      el.push(s('text', {
        x: (AX0 + AX1) / 2, y: (H1_BASE + H2_TOP) / 2 + 4, fill: C.muted,
        'font-size': 12.5 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif'
      }, 'Press “Draw 1 sample” or “Run 50 draws” to compare spread.'));
    }

    // Truth line through both histograms + shared 0-60 axis ticks at bottom
    el.push(
      s('line', { x1: tx, x2: tx, y1: H1_TOP, y2: H1_BASE, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
      s('line', { x1: tx, x2: tx, y1: H2_TOP, y2: H2_BASE, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '5 4' })
    );
    for (let v = 0; v <= 60; v += 10) {
      const x = ax(v);
      el.push(
        s('line', { x1: x, x2: x, y1: H2_BASE, y2: H2_BASE + 5, stroke: C.muted }),
        s('text', { x, y: H2_BASE + 18, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v)
      );
    }
    el.push(s('text', { x: AX1, y: H2_BASE + 18, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'min'));

    svg.replaceChildren(...el);

    // Formula box
    const means = pickedRooms.map(r => fmt(r1(r.mean)));
    const sumMeans = r1(pickedRooms.reduce((a, r) => a + r.mean, 0));
    const lines = [
      `rooms    = ${picked.length} (${headCount} students)`,
      means.length <= 5 ? `means    = ${means.join(' + ')} = ${fmt(sumMeans)}` : `sum means= ${fmt(sumMeans)}`,
      [`estimate = ${fmt(sumMeans)} ÷ ${picked.length} = ${fmt(r2(est))} min`, C.green],
      [`truth    = ${fmt(r2(uni.trueMean))} min`, C.amber]
    ];
    if (nTrials > 0) {
      const cSpan = r1(Math.max(...clusterEsts) - Math.min(...clusterEsts));
      const rSpan = r1(Math.max(...rosterEsts) - Math.min(...rosterEsts));
      lines.push([`spread (${nTrials} draws): cluster ${fmt(cSpan)} vs roster ${fmt(rSpan)}`, C.pink]);
    }
    fbox(box, lines);

    const allCity = pickedRooms.every(r => r.campus === 0);
    const allHill = pickedRooms.every(r => r.campus === 1);
    note.textContent = allCity
      ? 'All picked rooms are on City campus, so the estimate sits well below the university truth.'
      : allHill
        ? 'All picked rooms are on Hill campus, so the estimate sits well above the university truth.'
        : nTrials >= 20
          ? `After ${nTrials} draws, notice how much wider ${k} rooms spread than ${k * 10} random students from the roster.`
          : 'Tap any room box above to change your sample, or press “Run 50 draws” to see how estimates bounce around the truth.';
    kLab.textContent = `Rooms: ${k} (${k * 10} students)`;

    chal.update({ k, picked, allCity, allHill, trials: nTrials, freshData });
  }

  draw();
  return () => stopAnim();
}

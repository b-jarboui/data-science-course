// 14.3.9 Try it: Embedding distortion — compare map distances with original distances.
// Drag teas A, B, C, D on the 2D map (or tap & nudge) and watch map distances,
// original vs map bars, and the distance ratio update live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const ATTRS = ['Fl', 'Ja', 'Ro', 'Bl', 'Ho', 'Fr', 'Rt', 'To', 'Nu', 'Co', 'Ca', 'Sm'];
  const LESSON_SCORES = [
    [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3], // A
    [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3], // B
    [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7], // C
    [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7], // D
  ];
  const LESSON_POS = [[0, 0], [1, 0], [10, 0], [11, 0]];
  const NAMES = ['A', 'B', 'C', 'D'];
  const COLORS = [C.cyan, C.cyan, C.amber, C.amber];
  const COMPARISONS = [
    { key: 'AD_BC', label: 'A–D vs B–C', p1: [0, 3], p2: [1, 2], n1: 'A–D', n2: 'B–C' },
    { key: 'AD_AB', label: 'A–D vs A–B', p1: [0, 3], p2: [0, 1], n1: 'A–D', n2: 'A–B' },
    { key: 'AC_BD', label: 'A–C vs B–D', p1: [0, 2], p2: [1, 3], n1: 'A–C', n2: 'B–D' },
  ];

  let scores = LESSON_SCORES.map(r => r.slice());
  let pos = LESSON_POS.map(p => p.slice());
  let sel = 3; // start with D selected (easy to drag or nudge)
  let compIdx = 0;
  let isLesson = true;
  let randomCount = 0;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 520 : 495, F = NARROW ? 1.15 : 1;

  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const profSvg = s('svg', { viewBox: '0 0 340 108', style: { marginTop: '0.75rem' } });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const compBtns = COMPARISONS.map((c, idx) =>
    btn(c.label, () => { compIdx = idx; draw(); }, idx === 0 ? 'go' : '')
  );

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: when a map changes the truth'),
    h('p', { class: 'sub' }, 'Drag teas A, B, C and D on the map, or tap a tea and use the arrow buttons. Watch how map distances and the distance ratio compare with the original 12 tasting scores.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('←', () => nudge(-0.5, 0)),
          btn('→', () => nudge(0.5, 0)),
          btn('↑', () => nudge(0, 0.5)),
          btn('↓', () => nudge(0, -0.5)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Lesson example', () => {
            scores = LESSON_SCORES.map(r => r.slice());
            pos = LESSON_POS.map(p => p.slice());
            isLesson = true;
            compIdx = 0;
            draw();
          }, 'go'),
          btn('New teas (random)', () => {
            makeRandomTeas();
            isLesson = false;
            randomCount++;
            draw();
          }),
          btn('New map (random)', () => {
            pos = makeRandomMap();
            draw();
          })),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Compare:'),
          ...compBtns)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note, profSvg),
        h('div', { class: 'sim-card' }, ch)))));

  const dist12 = (i, j) => {
    let sum = 0;
    for (let k = 0; k < 12; k++) {
      const d = scores[i][k] - scores[j][k];
      sum += d * d;
    }
    return Math.sqrt(sum);
  };
  const dist2 = (i, j) => Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]);
  const r2 = x => Math.round(x * 100) / 100;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function makeRandomMap() {
    const x1 = rnd(0, 2), x2 = rnd(9, 11);
    return [
      [x1, rnd(-2, 2) * 0.5],
      [x1 + rnd(1, 3) * 0.5, rnd(-2, 2) * 0.5],
      [x2 - rnd(1, 3) * 0.5, rnd(-2, 2) * 0.5],
      [x2, rnd(-2, 2) * 0.5],
    ];
  }

  function makeRandomTeas() {
    const f1 = rnd(1, 3), r1 = rnd(1, 4);
    const f2 = rnd(1, 4), r2v = rnd(6, 9);
    const jitter = (base, lo, hi) => clamp(base + rnd(lo, hi), 0, 10);
    const makePair = (fBase, rBase) => {
      const a = [], b = [];
      for (let k = 0; k < 12; k++) {
        const base = k < 6 ? fBase : rBase;
        a.push(jitter(base, -1, 1));
        b.push(k < 2 ? jitter(base, -2, 2) : a[k] + (k === 6 ? rnd(-1, 1) : 0));
        b[k] = clamp(b[k], 0, 10);
      }
      if (a[0] === b[0] && a[1] === b[1]) b[0] = clamp(a[0] + (a[0] <= 5 ? 2 : -2), 0, 10);
      return [a, b];
    };
    const [A, B] = makePair(f1, r1);
    const [Ctea, D] = makePair(f2, r2v);
    scores = [A, B, Ctea, D];
    pos = makeRandomMap();
  }

  const chal = challenges(ch, [
    {
      text: 'On the lesson teas, drag a tea so the map distance ratio (A–D ÷ B–C) is at least 1.35.',
      check: st => st.isLesson && st.compKey === 'AD_BC' && Number.isFinite(st.mapRatio) && st.mapRatio >= 1.35,
      why: 'Yes! Moving just one tea stretched the map ratio past 1.35, even though the original tasting scores never changed.'
    },
    {
      text: 'On the lesson teas, move the dots into 2D so A–D and B–C have nearly equal map distances (ratio 0.97 to 1.03) while A–B and C–D each stay under 4 steps.',
      check: st => st.isLesson && st.compKey === 'AD_BC' && st.mapRatio >= 0.97 && st.mapRatio <= 1.03 && st.dAB > 0.25 && st.dCD > 0.25 && st.dAB <= 4 && st.dCD <= 4 && st.dAD >= 5,
      why: 'Nice! Lifting the teas off one line into a 2D rectangle lets A–D and B–C match, removing that map distortion.'
    },
    {
      text: 'Drag the teas so close neighbors A and B look farther apart on the map than B and C — the opposite of their original tasting scores.',
      check: st => st.dAB > st.dBC && st.origAB < st.origBC,
      why: 'Right: a distorted map can even reverse which pair looks closer. Always check original measurements.'
    },
    {
      text: 'Press “New teas (random)” twice and compare the original ratio with the map ratio each time.',
      check: st => st.randomCount >= 2,
      why: 'With fresh teas, a small map almost never preserves every distance ratio exactly. Explore on the map, conclude from original data.'
    }
  ]);

  // Map coordinate frame inside SVG
  const MX0 = NARROW ? 36 : 50, MX1 = VW - 18;
  const MY0 = 26, MY1 = NARROW ? 250 : 258;
  const XMIN = -1, XMAX = 13, YMIN = -4, YMAX = 4;
  const x2s = x => MX0 + ((x - XMIN) / (XMAX - XMIN)) * (MX1 - MX0);
  const y2s = y => MY1 - ((y - YMIN) / (YMAX - YMIN)) * (MY1 - MY0);
  const s2x = sx => XMIN + ((sx - MX0) / (MX1 - MX0)) * (XMAX - XMIN);
  const s2y = sy => YMIN + ((MY1 - sy) / (MY1 - MY0)) * (YMAX - YMIN);

  function nudge(dx, dy) {
    pos[sel][0] = clamp(Math.round((pos[sel][0] + dx) * 2) / 2, XMIN, XMAX);
    pos[sel][1] = clamp(Math.round((pos[sel][1] + dy) * 2) / 2, YMIN, YMAX);
    draw();
  }

  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bestD = NARROW ? 40 : 32;
    for (let i = 0; i < 4; i++) {
      const d = Math.hypot(p.x - x2s(pos[i][0]), p.y - y2s(pos[i][1]));
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    pos[dragging][0] = clamp(Math.round(s2x(p.x) * 2) / 2, XMIN, XMAX);
    pos[dragging][1] = clamp(Math.round(s2y(p.y) * 2) / 2, YMIN, YMAX);
    draw();
  });

  const endDrag = () => { dragging = -1; };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  function drawProfile() {
    const sc = scores[sel];
    const items = [
      s('text', { x: 4, y: 14, fill: COLORS[sel], 'font-size': 12, 'font-weight': 700, 'font-family': 'Consolas' },
        `Original 12 scores — Tea ${NAMES[sel]} (6 floral cyan, 6 roast amber)`)
    ];
    const bx0 = 8, bw = 20, step = 27.5, base = 88, maxH = 56;
    items.push(s('line', { x1: bx0, x2: 334, y1: base, y2: base, stroke: C.line }));
    sc.forEach((v, i) => {
      const col = i < 6 ? C.cyan : C.amber;
      const hgt = Math.max(2, (v / 10) * maxH);
      const x = bx0 + i * step;
      items.push(
        s('rect', { x, y: base - hgt, width: bw, height: hgt, fill: col, 'fill-opacity': 0.82, rx: 2 }),
        s('text', { x: x + bw / 2, y: base - hgt - 3, fill: col, 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v),
        s('text', { x: x + bw / 2, y: base + 13, fill: C.muted, 'font-size': 9.5, 'text-anchor': 'middle', 'font-family': 'Consolas' }, ATTRS[i])
      );
    });
    profSvg.replaceChildren(...items);
  }

  function draw() {
    compBtns.forEach((b, i) => { b.className = 'sim-btn ' + (i === compIdx ? 'go' : ''); });

    const comp = COMPARISONS[compIdx];
    const orig1 = dist12(...comp.p1), orig2 = dist12(...comp.p2);
    const map1 = dist2(...comp.p1), map2 = dist2(...comp.p2);
    const origRatio = orig2 > 1e-6 ? orig1 / orig2 : Infinity;
    const mapRatio = map2 > 1e-6 ? map1 / map2 : Infinity;
    const pctErr = (Number.isFinite(origRatio) && Number.isFinite(mapRatio) && origRatio > 1e-6)
      ? Math.round(((mapRatio - origRatio) / origRatio) * 100)
      : null;

    const k = [];
    // Map background & grid
    k.push(s('rect', { x: MX0, y: MY0, width: MX1 - MX0, height: MY1 - MY0, rx: 10, fill: '#0b1020', stroke: C.line }));
    for (let gx = 0; gx <= 12; gx += 2) {
      const sx = x2s(gx);
      k.push(
        s('line', { x1: sx, x2: sx, y1: MY0, y2: MY1, stroke: C.line, 'stroke-opacity': 0.6 }),
        s('text', { x: sx, y: MY1 + 16, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, gx)
      );
    }
    for (let gy = -4; gy <= 4; gy += 2) {
      const sy = y2s(gy);
      k.push(
        s('line', { x1: MX0, x2: MX1, y1: sy, y2: sy, stroke: gy === 0 ? '#36457a' : C.line, 'stroke-opacity': gy === 0 ? 0.95 : 0.55 }),
        s('text', { x: MX0 - 8, y: sy + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, gy)
      );
    }
    k.push(s('text', { x: MX0 + 10, y: MY0 + 17, fill: C.muted, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, 'DRAG TEAS ON THIS 2D MAP'));

    // Close-pair connector lines (subtle)
    for (const [a, b, col] of [[0, 1, C.cyan], [2, 3, C.amber]]) {
      k.push(s('line', {
        x1: x2s(pos[a][0]), y1: y2s(pos[a][1]),
        x2: x2s(pos[b][0]), y2: y2s(pos[b][1]),
        stroke: col, 'stroke-width': 2.5, 'stroke-opacity': 0.45
      }));
    }

    // Highlighted compared pairs (p1 in pink, p2 in amber)
    const drawPairLine = ([a, b], col, label, offsetY) => {
      const x1 = x2s(pos[a][0]), y1 = y2s(pos[a][1]);
      const x2 = x2s(pos[b][0]), y2 = y2s(pos[b][1]);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + offsetY;
      const d = dist2(a, b);
      k.push(
        s('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': 3.2, 'stroke-dasharray': col === C.pink ? '8 5' : null }),
        s('rect', { x: mx - 46 * F, y: my - 12 * F, width: 92 * F, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: col }),
        s('text', { x: mx, y: my + 4 * F, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${label} ${fmt(r2(d))}`)
      );
    };
    drawPairLine(comp.p1, C.pink, comp.n1, -22 * F);
    drawPairLine(comp.p2, C.amber, comp.n2, 24 * F);

    // Draggable tea dots
    pos.forEach((p, i) => {
      const cx = x2s(p[0]), cy = y2s(p[1]), col = COLORS[i];
      if (i === sel) {
        k.push(s('circle', { cx, cy, r: 22 * F, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
      } else {
        k.push(s('circle', { cx, cy, r: 17 * F, fill: col, 'fill-opacity': 0.14 }));
      }
      k.push(
        s('circle', { cx, cy, r: 12 * F, fill: C.card, stroke: col, 'stroke-width': 3, style: 'cursor:grab' }),
        s('text', { x: cx, y: cy + 4.5 * F, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, NAMES[i])
      );
    });

    // Bottom section: live Original vs Map distance bars
    const BY0 = MY1 + 42;
    k.push(s('line', { x1: 12, x2: VW - 12, y1: BY0 - 14, y2: BY0 - 14, stroke: C.line }));
    const pairList = [
      { name: 'A–B', a: 0, b: 1, col: C.cyan },
      { name: 'C–D', a: 2, b: 3, col: C.cyan },
      { name: 'A–D', a: 0, b: 3, col: C.pink },
      { name: 'B–C', a: 1, b: 2, col: C.amber },
    ];
    const maxDist = Math.max(12, ...pairList.flatMap(p => [dist12(p.a, p.b), dist2(p.a, p.b)]));
    const colOrigX = NARROW ? 66 : 92;
    const colMapX = NARROW ? 248 : 408;
    const maxBarW = NARROW ? 112 : 215;

    k.push(
      s('text', { x: 16, y: BY0 + 6, fill: C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'PAIR'),
      s('text', { x: colOrigX, y: BY0 + 6, fill: C.cyan, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'ORIGINAL (12D)'),
      s('text', { x: colMapX, y: BY0 + 6, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'MAP (2D)')
    );

    const rowStep = NARROW ? 46 : 42;
    pairList.forEach((p, idx) => {
      const y = BY0 + 26 + idx * rowStep;
      const od = dist12(p.a, p.b), md = dist2(p.a, p.b);
      const ow = Math.max(4, (od / maxDist) * maxBarW);
      const mw = Math.max(4, (md / maxDist) * maxBarW);
      const active = (comp.p1[0] === p.a && comp.p1[1] === p.b) || (comp.p2[0] === p.a && comp.p2[1] === p.b);
      if (active) {
        k.push(s('rect', { x: 8, y: y - 8, width: VW - 16, height: 32, rx: 6, fill: '#ffffff', 'fill-opacity': 0.04 }));
      }
      k.push(
        s('text', { x: 16, y: y + 13, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, p.name),
        s('rect', { x: colOrigX, y: y, width: ow, height: 18, rx: 3, fill: idx < 2 ? C.cyan : C.amber, 'fill-opacity': 0.82 }),
        s('text', { x: colOrigX + ow + 7, y: y + 13, fill: idx < 2 ? C.cyan : C.amber, 'font-size': 12 * F, 'font-family': 'Consolas' }, fmt(r2(od))),
        s('rect', { x: colMapX, y: y, width: mw, height: 18, rx: 3, fill: p.col, 'fill-opacity': 0.82 }),
        s('text', { x: colMapX + mw + 7, y: y + 13, fill: p.col, 'font-size': 12 * F, 'font-family': 'Consolas' }, fmt(r2(md)))
      );
    });

    svg.replaceChildren(...k);

    // Formula box
    const ratioCol = pctErr == null ? C.pink : Math.abs(pctErr) <= 5 ? C.green : Math.abs(pctErr) <= 15 ? C.amber : C.pink;
    const origStr = Number.isFinite(origRatio) ? fmt(r2(origRatio)) : '—';
    const mapStr = Number.isFinite(mapRatio) ? fmt(r2(mapRatio)) : '∞';
    const diffLine = pctErr == null
      ? ['Map ratio undefined (distance = 0)', C.pink]
      : Math.abs(pctErr) <= 5
        ? [`Ratio difference: ${pctErr >= 0 ? '+' : ''}${pctErr}% (low distortion)`, C.green]
        : [`Ratio difference: ${pctErr >= 0 ? '+' : ''}${pctErr}% from map`, ratioCol];

    fbox(box, [
      `Comparing ${comp.n1} ÷ ${comp.n2}`,
      [`Original: ${fmt(r2(orig1))} ÷ ${fmt(r2(orig2))} = ${origStr}`, C.cyan],
      [`Map:      ${fmt(r2(map1))} ÷ ${fmt(r2(map2))} = ${mapStr}`, ratioCol],
      diffLine,
    ]);

    note.textContent = pctErr != null && Math.abs(pctErr) <= 5
      ? 'This map ratio closely matches the original tasting scores for these two pairs.'
      : 'The map changes the ratio between these two distances compared with the original 12 tasting scores.';

    selLabel.textContent = `Selected: Tea ${NAMES[sel]} at (${fmt(pos[sel][0])}, ${fmt(pos[sel][1])})`;
    drawProfile();

    chal.update({
      isLesson,
      compKey: comp.key,
      mapRatio,
      origRatio,
      dAB: dist2(0, 1),
      dCD: dist2(2, 3),
      dAD: dist2(0, 3),
      dBC: dist2(1, 2),
      origAB: dist12(0, 1),
      origBC: dist12(1, 2),
      randomCount,
    });
  }

  draw();
  return () => {};
}

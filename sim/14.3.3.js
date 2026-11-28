// 14.3.3 Try it: loadings and component scores.
// Drag any of the 12 tasting score bars (0 to 10) or flip PC 2 loadings,
// watch the live tea dot move on the 2D component-score map, and solve challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const ATTS = ['Flo', 'Jas', 'Ros', 'Blo', 'Hon', 'Fru', 'Roa', 'Toa', 'Nut', 'Coc', 'Car', 'Smo'];
  const PRESETS = {
    A: [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    C: [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
    E: [7, 9, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
    G: [7, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7],
  };
  const LOAD = 1 / Math.sqrt(6);

  let scores = PRESETS.A.slice();
  let labelName = 'Tea A';
  let sel = 0;
  let centeredView = false;
  let flipPC2 = false;
  let randomCount = 0;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 760;
  const VH = NARROW ? 560 : 400;
  const F = NARROW ? 1.05 : 1;

  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const centerBtn = btn('Show centered (−5)', () => { centeredView = !centeredView; draw(); });
  const flipBtn = btn('Flip PC 2 loadings (−)', () => { flipPC2 = !flipPC2; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: loadings and component scores'),
    h('p', { class: 'sub' }, 'Drag any tasting bar up or down (0 to 10), or tap a bar and use −1 / +1. Watch how centered scores and loadings place the tea on the 2D map.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Tea A', () => loadPreset('A')),
          btn('Tea C', () => loadPreset('C')),
          btn('Tea E', () => loadPreset('E')),
          btn('Tea G', () => loadPreset('G')),
          btn('New tea (random)', () => {
            scores = scores.map(() => rnd(0, 10));
            labelName = 'Random tea';
            randomCount++;
            draw();
          }, 'go'),
          centerBtn,
          flipBtn,
          btn('Reset', () => {
            scores = PRESETS.A.slice();
            labelName = 'Tea A';
            sel = 0;
            centeredView = false;
            flipPC2 = false;
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Make a tea for the customer: strong flower smells (PC 1 at least +5) and little roasted taste (PC 2 at most −4, with positive loadings).',
      check: st => !st.flipPC2 && st.pc1 >= 5 && st.pc2 <= -4,
      why: 'Yes! High flower scores give a positive PC 1 score, and low roasted scores give a negative PC 2 score — just like Tea E.'
    },
    {
      text: 'Make both component scores equal to 0 without setting every bar to 5.',
      check: st => Math.abs(st.pc1) < 1e-6 && Math.abs(st.pc2) < 1e-6 && st.scores.some(v => v !== 5),
      why: 'Right! Bars above 5 and below 5 in the same group cancel out, so the centered sum is 0.'
    },
    {
      text: 'Press “Flip PC 2 loadings”. Watch every tea flip on the map while the twelve tasting bars stay the same.',
      check: st => st.flipPC2,
      why: 'Loadings belong to the direction, not to the tea. Changing a loading sign flips every tea’s score along that direction.'
    },
    {
      text: 'Press “New tea (random)” twice. Does each component score always equal the group’s centered sum times its loading?',
      check: st => st.randomCount >= 2,
      why: 'Always! The same direction loadings turn any tea’s twelve centered scores into its position on the map.'
    }
  ]);

  // Layout coordinates for bar chart and 2D map inside one SVG
  const B = NARROW
    ? { x0: 32, x1: 388, top: 38, bot: 230 }
    : { x0: 36, x1: 424, top: 44, bot: 334 };
  const M = NARROW
    ? { cx: 200, cy: 418, rx: 148, ry: 108 }
    : { cx: 598, cy: 196, rx: 132, ry: 146 };

  const gap = NARROW ? 10 : 12;
  const slotW = (B.x1 - B.x0 - gap) / 12;
  const barX = k => B.x0 + k * slotW + (k >= 6 ? gap : 0) + slotW / 2;
  const yOf = val => B.bot - (val / 10) * (B.bot - B.top);
  const yMean = yOf(5);
  const mapX = pc1 => M.cx + (pc1 / 13) * M.rx;
  const mapY = pc2 => M.cy - (pc2 / 13) * M.ry;

  function calc(arr, flipped) {
    let sum1 = 0, sum2 = 0;
    for (let k = 0; k < 6; k++) sum1 += arr[k] - 5;
    for (let k = 6; k < 12; k++) sum2 += arr[k] - 5;
    const l2 = flipped ? -LOAD : LOAD;
    return { sum1, sum2, pc1: sum1 * LOAD, pc2: sum2 * l2 };
  }
  const r2 = x => Math.round(x * 100) / 100;
  const sgn = x => (x > 0 ? '+' : x < 0 ? '−' : '') + fmt(Math.abs(r2(x)));
  const sgnInt = x => (x > 0 ? '+' + x : x < 0 ? '−' + Math.abs(x) : '0');

  function loadPreset(key) {
    scores = PRESETS[key].slice();
    labelName = 'Tea ' + key;
    draw();
  }
  function bump(d) {
    scores[sel] = Math.max(0, Math.min(10, scores[sel] + d));
    labelName = 'Custom tea';
    draw();
  }

  // Pointer drag on bars
  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  function barIndexFromX(x) {
    if (x < B.x0 - 4 || x > B.x1 + 4) return -1;
    let best = -1, bestD = Infinity;
    for (let k = 0; k < 12; k++) {
      const d = Math.abs(x - barX(k));
      if (d < bestD) { bestD = d; best = k; }
    }
    return bestD <= slotW * 0.7 ? best : -1;
  }
  function handleMove(e) {
    if (dragging < 0) return;
    const pt = toSvg(e);
    const v = Math.max(0, Math.min(10, Math.round(((B.bot - pt.y) / (B.bot - B.top)) * 10)));
    if (scores[dragging] !== v) {
      scores[dragging] = v;
      labelName = 'Custom tea';
      draw();
    }
  }
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    if (pt.y < B.top - 24 || pt.y > B.bot + 30) return;
    const idx = barIndexFromX(pt.x);
    if (idx < 0) return;
    sel = idx;
    dragging = idx;
    svg.setPointerCapture(e.pointerId);
    handleMove(e);
    draw();
  });
  svg.addEventListener('pointermove', handleMove);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const st = calc(scores, flipPC2);
    const els = [];

    // --- Panel 1: 12 Tasting Score Bars ---
    els.push(s('text', { x: B.x0, y: B.top - 18, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700 },
      centeredView ? `${labelName}: centered scores (score − 5)` : `${labelName}: 12 tasting scores (drag bars)`));

    for (const tick of [0, 5, 10]) {
      const y = yOf(tick);
      const isMean = tick === 5;
      els.push(
        s('line', {
          x1: B.x0, x2: B.x1, y1: y, y2: y,
          stroke: isMean ? C.amber : C.line,
          'stroke-width': isMean ? 1.8 : 1,
          'stroke-dasharray': isMean ? '6 5' : null
        }),
        s('text', {
          x: B.x0 - 6, y: y + 4, fill: isMean ? C.amber : C.muted,
          'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas'
        }, centeredView ? String(tick - 5) : String(tick))
      );
    }

    const bw = Math.max(12, slotW * 0.72);
    scores.forEach((val, k) => {
      const cx = barX(k);
      const col = k < 6 ? C.cyan : C.amber;
      const yVal = yOf(val);
      if (k === sel) {
        els.push(s('rect', {
          x: cx - slotW / 2 + 1, y: B.top - 4, width: slotW - 2, height: B.bot - B.top + 8,
          fill: '#ffffff', 'fill-opacity': 0.06, rx: 5
        }));
      }
      const yTop = centeredView ? Math.min(yMean, yVal) : yVal;
      const yBot = centeredView ? Math.max(yMean, yVal) : B.bot;
      const hgt = Math.max(3, yBot - yTop);
      els.push(s('rect', {
        x: cx - bw / 2, y: centeredView && val === 5 ? yMean - 1.5 : yTop,
        width: bw, height: hgt, fill: col, 'fill-opacity': 0.84, rx: 3
      }));
      const disp = centeredView ? sgnInt(val - 5) : String(val);
      const txtY = centeredView ? (val >= 5 ? yVal - 6 : yVal + 14) : yVal - 6;
      els.push(
        s('text', {
          x: cx, y: Math.max(B.top + 8, Math.min(B.bot - 2, txtY)),
          fill: col, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, disp),
        s('text', {
          x: cx, y: B.bot + 16, fill: col, 'font-size': 10 * F, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, ATTS[k])
      );
    });

    const g1Mid = (barX(0) + barX(5)) / 2;
    const g2Mid = (barX(6) + barX(11)) / 2;
    els.push(
      s('text', { x: g1Mid, y: B.bot + 34, fill: C.cyan, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle' },
        'Flower (× +0.4082)'),
      s('text', { x: g2Mid, y: B.bot + 34, fill: flipPC2 ? C.pink : C.amber, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle' },
        flipPC2 ? 'Roast (× −0.4082)' : 'Roast (× +0.4082)')
    );

    // --- Panel 2: 2D Component-Score Map ---
    const mapLeft = M.cx - M.rx, mapRight = M.cx + M.rx;
    const mapTop = M.cy - M.ry, mapBot = M.cy + M.ry;
    els.push(
      s('rect', {
        x: mapLeft - 10, y: mapTop - 22, width: M.rx * 2 + 20, height: M.ry * 2 + 42,
        fill: C.bg, stroke: C.line, rx: 10
      }),
      s('text', { x: M.cx, y: mapTop - 7, fill: C.ink, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle' },
        '2D Component-Score Map')
    );

    // Customer target zone (when loadings are standard positive)
    if (!flipPC2) {
      const zx1 = mapX(5), zx2 = mapX(13);
      const zy1 = mapY(-4), zy2 = mapY(-13);
      els.push(
        s('rect', {
          x: zx1, y: zy1, width: zx2 - zx1, height: zy2 - zy1,
          fill: C.green, 'fill-opacity': 0.1, stroke: C.green, 'stroke-dasharray': '5 4', rx: 6
        }),
        s('text', { x: (zx1 + zx2) / 2, y: zy2 - 8, fill: C.green, 'font-size': 10 * F, 'font-weight': 700, 'text-anchor': 'middle' },
          'Customer wish')
      );
    }

    // Axes
    els.push(
      s('line', { x1: mapLeft, x2: mapRight, y1: M.cy, y2: M.cy, stroke: C.cyan, 'stroke-width': 2 }),
      s('line', { x1: M.cx, x2: M.cx, y1: mapBot, y2: mapTop, stroke: flipPC2 ? C.pink : C.amber, 'stroke-width': 2 }),
      s('text', { x: mapRight - 4, y: M.cy - 6, fill: C.cyan, 'font-size': 10.5 * F, 'font-weight': 700, 'text-anchor': 'end' }, 'PC 1 →'),
      s('text', { x: M.cx + 6, y: mapTop + 13, fill: flipPC2 ? C.pink : C.amber, 'font-size': 10.5 * F, 'font-weight': 700 },
        flipPC2 ? 'PC 2 (−) ↑' : 'PC 2 ↑')
    );

    // Reference teas A, C, E, G
    for (const key of ['A', 'C', 'E', 'G']) {
      const p = calc(PRESETS[key], flipPC2);
      const px = mapX(p.pc1), py = mapY(p.pc2);
      els.push(
        s('circle', { cx: px, cy: py, r: 5, fill: C.muted, 'fill-opacity': 0.65 }),
        s('text', { x: px + (p.pc1 < 0 ? -9 : 9), y: py + 4, fill: C.muted, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': p.pc1 < 0 ? 'end' : 'start', 'font-family': 'Consolas' }, key)
      );
    }

    // Live tea point + guides
    const tx = mapX(st.pc1), ty = mapY(st.pc2);
    const inWish = !flipPC2 && st.pc1 >= 5 && st.pc2 <= -4;
    const dotCol = inWish ? C.green : C.cyan;
    els.push(
      s('line', { x1: tx, x2: tx, y1: M.cy, y2: ty, stroke: C.cyan, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.7 }),
      s('line', { x1: M.cx, x2: tx, y1: ty, y2: ty, stroke: flipPC2 ? C.pink : C.amber, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.7 }),
      s('circle', { cx: tx, cy: ty, r: 14, fill: dotCol, 'fill-opacity': 0.2 }),
      s('circle', { cx: tx, cy: ty, r: 7, fill: dotCol, stroke: C.ink, 'stroke-width': 1.5 }),
      s('text', {
        x: M.cx, y: mapBot + 15, fill: dotCol,
        'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `(${sgn(st.pc1)}, ${sgn(st.pc2)})`)
    );

    svg.replaceChildren(...els);

    // Formula box & UI text
    const l2Txt = flipPC2 ? '(−0.4082)' : '0.4082';
    fbox(box, [
      `centered = score − 5`,
      [`PC 1 = (${sgnInt(st.sum1)}) × 0.4082 = ${sgn(st.pc1)}`, C.cyan],
      [`PC 2 = (${sgnInt(st.sum2)}) × ${l2Txt} = ${sgn(st.pc2)}`, flipPC2 ? C.pink : C.amber],
      [inWish ? 'Matches customer: strong flower, little roast!' : 'Loadings → directions · Scores → tea position', inWish ? C.green : C.muted]
    ]);

    const flDesc = st.sum1 > 0 ? 'above mean on flower smells' : st.sum1 < 0 ? 'below mean on flower smells' : 'right at the mean on flower smells';
    const roDesc = st.sum2 > 0 ? 'above mean on roasted taste' : st.sum2 < 0 ? 'below mean on roasted taste' : 'right at the mean on roasted taste';
    note.textContent = `This tea is ${flDesc} and ${roDesc}. A negative score means below the mean, not bad.`;
    selLabel.textContent = `Selected: ${ATTS[sel]} = ${scores[sel]} (centered ${sgnInt(scores[sel] - 5)})`;
    centerBtn.textContent = centeredView ? 'Show original (0–10)' : 'Show centered (−5)';
    flipBtn.textContent = flipPC2 ? 'PC 2 loadings: −0.4082 (flip back)' : 'Flip PC 2 loadings (−)';

    chal.update({ pc1: st.pc1, pc2: st.pc2, scores, flipPC2, randomCount });
  }

  draw();
  return () => {};
}

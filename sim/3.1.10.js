// 3.1.10 Try it: Long and wide forms.
// The learner edits store-by-month sales, animates melting (wide -> long) and pivoting (long -> wide),
// adds/removes months to see columns vs rows, makes random reports, and solves self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const STORES = ['North', 'South'];
  const START = [[90, 110, 100], [40, 60, 50]];

  let data = START.map(r => r.slice()); // data[storeIdx][monthIdx]
  let sel = { st: 0, mo: 0 };
  let shape = 0; // 0 = wide, 1 = long (animated smoothly)
  let targetShape = 0;
  let anim = 0;
  let isRandom = false;
  let randomMelts = 0;
  let sawWideWithExtra = false;
  let sawLongWithExtra = false;
  let hitBoxes = [];

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: reshape wide and long'),
    h('p', { class: 'sub' }, 'Tap any sales cell to select it and change its value. Melt the table into long form, pivot it back to wide form, or add a new month to see how each shape grows.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−10', () => bump(-10)),
          btn('+10', () => bump(10)),
          btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Melt (Wide → Long)', () => go(1), 'go'),
          btn('Pivot (Long → Wide)', () => go(0)),
          btn('Add a month', addMonth),
          btn('Remove month', removeMonth),
          btn('New data (random)', newData),
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const monthCount = () => data[0].length;
  const storeTotal = si => data[si].reduce((a, b) => a + b, 0);
  const monthTotal = mi => data[0][mi] + data[1][mi];
  const grandTotal = () => storeTotal(0) + storeTotal(1);

  const chal = challenges(ch, [
    {
      text: 'Press “Melt (Wide → Long)” to reshape the table into long form. Check that all 6 numbers stay the same.',
      check: st => st.targetShape === 1 && st.shape > 0.95,
      why: 'Yes! Melting turns 2 rows × 3 month columns into 6 rows × 3 columns, without losing a single value.'
    },
    {
      text: 'Tap a January cell and use −10 / +10 (or −1 / +1) so January’s total (North + South) is exactly $150.',
      check: st => st.janTotal === 150,
      why: 'Right: both shapes hold the same numbers, so changing one value updates the January total in both.'
    },
    {
      text: 'Press “Add a month”, then view BOTH Wide and Long form. Notice Wide adds a column while Long keeps 3 columns.',
      check: st => st.months >= 4 && st.sawWideWithExtra && st.sawLongWithExtra,
      why: 'Exactly! In wide form every new month adds a column, while in long form it is just two more rows.'
    },
    {
      text: 'Press “New data (random)” and melt it to long form, twice. Do the North and South totals ever change?',
      check: st => st.randomMelts >= 2,
      why: 'Never. Reshaping only changes the layout—every number and every total stays identical.'
    }
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700;
  const VH = NARROW ? 470 : 440;
  const F = NARROW ? 1.05 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function recordExtraView() {
    if (monthCount() >= 4) {
      if (shape < 0.05) sawWideWithExtra = true;
      if (shape > 0.95) sawLongWithExtra = true;
    }
  }

  function bump(delta) {
    data[sel.st][sel.mo] = Math.max(0, Math.min(300, data[sel.st][sel.mo] + delta));
    draw();
  }

  function addMonth() {
    if (monthCount() >= ALL_MONTHS.length) return;
    data[0].push(rnd(6, 14) * 10);
    data[1].push(rnd(3, 9) * 10);
    recordExtraView();
    draw();
  }

  function removeMonth() {
    if (monthCount() <= 3) return;
    data[0].pop();
    data[1].pop();
    if (sel.mo >= monthCount()) sel.mo = monthCount() - 1;
    draw();
  }

  function newData() {
    const m = monthCount();
    data = [
      Array.from({ length: m }, () => rnd(5, 15) * 10),
      Array.from({ length: m }, () => rnd(2, 10) * 10)
    ];
    isRandom = true;
    if (targetShape === 1) {
      // snap to wide first so the learner can melt the fresh data
      cancelAnimationFrame(anim);
      shape = 0;
      targetShape = 0;
    }
    recordExtraView();
    draw();
  }

  function reset() {
    cancelAnimationFrame(anim);
    data = START.map(r => r.slice());
    sel = { st: 0, mo: 0 };
    shape = 0;
    targetShape = 0;
    isRandom = false;
    draw();
  }

  function go(next) {
    if (next === 1 && isRandom && targetShape === 0) {
      randomMelts++;
      isRandom = false;
    }
    targetShape = next;
    cancelAnimationFrame(anim);
    const from = shape, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 750);
      shape = from + (next - from) * k * k * (3 - 2 * k);
      if (k >= 1) recordExtraView();
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    for (const hb of hitBoxes) {
      if (p.x >= hb.x && p.x <= hb.x + hb.w && p.y >= hb.y && p.y <= hb.y + hb.h) {
        sel = { st: hb.st, mo: hb.mo };
        draw();
        return;
      }
    }
  });

  const lerp = (a, b, t) => a + (b - a) * t;

  function draw() {
    const m = monthCount();
    const nRows = 2 * m;
    const t = shape;
    const nodes = [];
    hitBoxes = [];

    // Title pill inside SVG
    const titleText = t < 0.5
      ? `WIDE FORM  (${2} rows × ${m + 1} cols · ${nRows} numbers)`
      : `LONG FORM  (${nRows} rows × 3 cols · ${nRows} numbers)`;
    const titleColor = t < 0.5 ? C.amber : C.green;
    nodes.push(
      s('rect', { x: 14, y: 8, width: VW - 28, height: 28, rx: 14, fill: C.bg, stroke: titleColor, 'stroke-width': 1.5 }),
      s('text', {
        x: VW / 2, y: 27, fill: titleColor, 'font-size': (NARROW ? 12 : 14) * F,
        'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, titleText)
    );

    // Wide geometry
    const padX = NARROW ? 12 : 24;
    const wGridW = VW - padX * 2;
    const wStoreW = Math.min(110, wGridW * 0.22);
    const wColW = (wGridW - wStoreW) / m;
    const wRowH = 58;
    const wTop = 105;

    // Long geometry
    const lGridW = Math.min(NARROW ? VW - 24 : 460, VW - 24);
    const lX0 = (VW - lGridW) / 2;
    const lColW = lGridW / 3;
    const lAvailH = VH - 64;
    const lRowH = Math.min(40, Math.floor(lAvailH / (nRows + 1)));
    const lTop = 48;

    // 1) Wide table frame (fades out as t -> 1)
    const wideOp = Math.max(0, 1 - t * 1.8);
    if (wideOp > 0.01) {
      const wg = s('g', { opacity: wideOp });
      // Header row
      const wHeaders = ['Store', ...ALL_MONTHS.slice(0, m)];
      wHeaders.forEach((lbl, ci) => {
        const x = ci === 0 ? padX : padX + wStoreW + (ci - 1) * wColW;
        const w = ci === 0 ? wStoreW : wColW;
        const col = ci === 0 ? C.muted : C.amber;
        wg.append(
          s('rect', { x: x + 2, y: wTop, width: w - 4, height: 42, rx: 6, fill: C.bg, stroke: col, 'stroke-width': 1.5 }),
          s('text', {
            x: x + w / 2, y: wTop + 26, fill: col, 'font-size': (NARROW ? 13 : 15) * F,
            'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
          }, lbl)
        );
      });
      // Store label cells (North, South)
      STORES.forEach((stName, si) => {
        const y = wTop + 46 + si * (wRowH + 4);
        const col = si === 0 ? C.cyan : C.pink;
        wg.append(
          s('rect', { x: padX + 2, y, width: wStoreW - 4, height: wRowH, rx: 6, fill: col, 'fill-opacity': 0.14, stroke: col, 'stroke-width': 1.5 }),
          s('text', {
            x: padX + wStoreW / 2, y: y + wRowH / 2 + 5, fill: col, 'font-size': (NARROW ? 13 : 16) * F,
            'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif'
          }, stName)
        );
      });
      // Column growth callout when months >= 4
      if (m >= 4) {
        const noteY = wTop + 46 + 2 * (wRowH + 4) + 28;
        wg.append(s('text', {
          x: VW / 2, y: noteY, fill: C.pink, 'font-size': (NARROW ? 12 : 14) * F,
          'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `Wide form grew wider: now ${m + 1} columns!`));
      }
      nodes.push(wg);
    }

    // 2) Long table header (fades in as t -> 1)
    const longOp = Math.max(0, (t - 0.35) / 0.65);
    if (longOp > 0.01) {
      const lg = s('g', { opacity: longOp });
      ['Store', 'Month', 'Sales ($)'].forEach((lbl, ci) => {
        const x = lX0 + ci * lColW;
        lg.append(
          s('rect', { x: x + 2, y: lTop, width: lColW - 4, height: lRowH - 3, rx: 6, fill: C.bg, stroke: C.green, 'stroke-width': 1.5 }),
          s('text', {
            x: x + lColW / 2, y: lTop + (lRowH - 3) / 2 + 5, fill: C.green,
            'font-size': (NARROW ? 12 : 14) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
          }, lbl)
        );
      });
      nodes.push(lg);
    }

    // 3) The 2*m data cells smoothly glide between Wide grid cells and Long rows!
    for (let si = 0; si < 2; si++) {
      const col = si === 0 ? C.cyan : C.pink;
      for (let mi = 0; mi < m; mi++) {
        const rowIdx = si * m + mi;
        const val = data[si][mi];
        const isSel = sel.st === si && sel.mo === mi;

        // Wide rect
        const wx = padX + wStoreW + mi * wColW + 2;
        const wy = wTop + 46 + si * (wRowH + 4);
        const ww = wColW - 4;
        const wh = wRowH;

        // Long rect (full 3-column row)
        const lx = lX0 + 2;
        const ly = lTop + (rowIdx + 1) * lRowH + 2;
        const lw = lGridW - 4;
        const lh = lRowH - 4;

        // Interpolated box
        const x = lerp(wx, lx, t);
        const y = lerp(wy, ly, t);
        const w = lerp(ww, lw, t);
        const hgt = lerp(wh, lh, t);

        hitBoxes.push({ x, y, w, h: hgt, st: si, mo: mi });

        nodes.push(s('rect', {
          x, y, width: w, height: hgt, rx: 6,
          fill: col, 'fill-opacity': isSel ? 0.30 : 0.14,
          stroke: isSel ? C.amber : col, 'stroke-width': isSel ? 2.8 : 1.5,
          style: 'cursor:pointer'
        }));

        // Inside-row column dividers in long form
        if (longOp > 0.05) {
          nodes.push(
            s('line', { x1: x + w / 3, x2: x + w / 3, y1: y + 3, y2: y + hgt - 3, stroke: C.line, opacity: longOp }),
            s('line', { x1: x + 2 * w / 3, x2: x + 2 * w / 3, y1: y + 3, y2: y + hgt - 3, stroke: C.line, opacity: longOp })
          );
          nodes.push(
            s('text', {
              x: x + w / 6, y: y + hgt / 2 + 5, fill: col, opacity: longOp,
              'font-size': (lRowH < 32 ? 12 : 14) * F, 'font-weight': 700,
              'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif', 'pointer-events': 'none'
            }, STORES[si]),
            s('text', {
              x: x + w / 2, y: y + hgt / 2 + 5, fill: C.ink, opacity: longOp,
              'font-size': (lRowH < 32 ? 12 : 14) * F, 'font-weight': 600,
              'text-anchor': 'middle', 'font-family': 'Consolas', 'pointer-events': 'none'
            }, ALL_MONTHS[mi])
          );
        }

        // Value text glides from center of wide cell to right third of long row
        const vx = lerp(x + w / 2, x + (5 * w) / 6, t);
        const vy = y + hgt / 2 + 5;
        nodes.push(s('text', {
          x: vx, y: vy, fill: isSel ? C.amber : col,
          'font-size': lerp(NARROW ? 15 : 18, lRowH < 32 ? 13 : 15, t) * F,
          'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', 'pointer-events': 'none'
        }, '$' + val));
      }
    }

    svg.replaceChildren(...nodes);

    // Formula box: shape, cell count, store totals, GROUP BY month totals
    const mList = ALL_MONTHS.slice(0, m).map((mn, i) => `${mn} $${monthTotal(i)}`).join(' · ');
    fbox(box, [
      [t < 0.5 ? `shape = WIDE  (2 rows × ${m + 1} cols)` : `shape = LONG  (${nRows} rows × 3 cols)`, t < 0.5 ? C.amber : C.green],
      `values = ${nRows} numbers   (all $${grandTotal()})`,
      [`North  = ${data[0].join(' + ')} = $${storeTotal(0)}`, C.cyan],
      [`South  = ${data[1].join(' + ')} = $${storeTotal(1)}`, C.pink],
      [`GROUP BY month: ${mList}`, C.amber]
    ]);

    note.textContent = t < 0.5
      ? 'Wide form puts each month in its own column—easy for people to compare across a row.'
      : 'Long form puts each value on its own row with its store and month labels—ready for GROUP BY and charts.';

    selLabel.textContent = `Selected: ${STORES[sel.st]}, ${ALL_MONTHS[sel.mo]} ($${data[sel.st][sel.mo]})`;

    chal.update({
      targetShape,
      shape,
      months: m,
      janTotal: monthTotal(0),
      randomMelts,
      sawWideWithExtra,
      sawLongWithExtra
    });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

// 16.2.7 Try it: distributed aggregation across North and South shops.
// Drag any sale stack up or down, add or remove sales in each shop, watch the two
// shop computers send (sum, count) to the main computer, and compare the true
// overall mean against the common mistake of averaging the two shop means.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const START_N = [4, 8];
  const START_S = [6, 10, 14];
  let north = START_N.slice();
  let south = START_S.slice();
  let sel = 0; // index into combined [...north, ...south]
  let randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 470', role: 'img', 'aria-label': 'Distributed aggregation across North and South shops' });
  const box = h('div');
  const note = h('div', { class: 'sim-note', role: 'status' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const bAddN = btn('+ North sale', () => addSale('N'));
  const bRemN = btn('− North sale', () => removeSale('N'));
  const bAddS = btn('+ South sale', () => addSale('S'));
  const bRemS = btn('− South sale', () => removeSale('S'));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: combine sums and counts'),
    h('p', { class: 'sub' }, 'Each stack is one sale, one block per dollar. Drag a stack up or down, or add and remove sales in either shop. Watch what North and South send to the main computer.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$1', () => bump(-1)),
          btn('+$1', () => bump(1)),
          selLabel),
        h('div', { class: 'sim-row' },
          bAddN, bRemN, bAddS, bRemS),
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Reset', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const money = x => {
    const r = Math.round(x * 100) / 100;
    return Math.abs(r - Math.round(r)) < 1e-9 ? `$${Math.round(r)}` : `$${r.toFixed(2)}`;
  };
  const sum = arr => arr.reduce((a, b) => a + b, 0);

  const chal = challenges(ch, [
    {
      text: 'Make the overall mean match the average of the two shop means by changing how many sales each shop has.',
      check: st => st.north.length === st.south.length,
      why: 'When both shops have the same number of sales, each shop carries the same weight, so the two methods give the same answer.',
    },
    {
      text: 'Make the average of the two shop means wrong by at least $2.00.',
      check: st => Math.abs(st.overall - st.wrong) >= 2,
      why: 'When one shop has more sales and a very different mean, giving both shops equal weight pulls the answer far off.',
    },
    {
      text: 'Keep 2 sales at North and 3 sales at South, and change the amounts so the overall mean is exactly $10.',
      check: st => st.north.length === 2 && st.south.length === 3 && Math.abs(st.overall - 10) < 1e-6,
      why: 'Yes! Five sales with a combined sum of $50 always give an overall mean of $10.',
    },
    {
      text: 'Press “New data” twice and watch the summaries North and South send.',
      check: st => st.randomCount >= 2,
      why: 'No matter how many tickets each shop has, each computer only needs to send its sum and its count.',
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 475, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 34 : 50, X1 = VW - 12;
  const TOP = 148, BASE = 418;
  const MAX_VAL = 20;
  const unit = () => (BASE - TOP) / MAX_VAL;
  const GAP = NARROW ? 14 : 24;

  function allSales() {
    return [
      ...north.map((v, i) => ({ shop: 'N', idx: i, val: v })),
      ...south.map((v, i) => ({ shop: 'S', idx: i, val: v })),
    ];
  }

  function colCenter(k, nN, nS) {
    const total = nN + nS;
    const avail = (X1 - X0) - GAP;
    const sw = avail / total;
    return X0 + sw * (k + 0.5) + (k >= nN ? GAP : 0);
  }

  function colWidth(nN, nS) {
    return ((X1 - X0) - GAP) / (nN + nS);
  }

  function clampSel() {
    const n = north.length + south.length;
    sel = Math.max(0, Math.min(n - 1, sel));
  }

  function setSale(k, val) {
    const v = Math.max(1, Math.min(MAX_VAL, val));
    if (k < north.length) north[k] = v;
    else south[k - north.length] = v;
  }

  function bump(d) {
    const sales = allSales();
    setSale(sel, sales[sel].val + d);
    draw();
  }

  function addSale(shop) {
    if (shop === 'N' && north.length < 5) {
      north.push(rnd(2, 18));
      sel = north.length - 1;
    } else if (shop === 'S' && south.length < 5) {
      south.push(rnd(2, 18));
      sel = north.length + south.length - 1;
    }
    draw();
  }

  function removeSale(shop) {
    if (shop === 'N' && north.length > 1) north.pop();
    else if (shop === 'S' && south.length > 1) south.pop();
    clampSel();
    draw();
  }

  function newData() {
    const nN = rnd(1, 4);
    let nS = rnd(1, 4);
    if (nS === nN) nS = (nS % 4) + 1;
    north = Array.from({ length: nN }, () => rnd(2, 18));
    south = Array.from({ length: nS }, () => rnd(2, 18));
    clampSel();
    randomCount++;
    draw();
  }

  function reset() {
    north = START_N.slice();
    south = START_S.slice();
    sel = 0;
    draw();
  }

  // Pointer drag on dollar-block stacks
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  function hitIndex(px) {
    const nN = north.length, nS = south.length;
    let best = -1, bestD = Infinity;
    for (let k = 0; k < nN + nS; k++) {
      const d = Math.abs(px - colCenter(k, nN, nS));
      if (d < bestD) { bestD = d; best = k; }
    }
    return bestD <= colWidth(nN, nS) * 0.65 ? best : -1;
  }

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < TOP - 16 || p.y > BASE + 38) return;
    const idx = hitIndex(p.x);
    if (idx < 0) return;
    sel = idx;
    dragging = idx;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });

  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const val = Math.round((BASE - p.y) / unit());
    setSale(dragging, val);
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function rect(x, y, w, hgt, stroke, fill = C.bg, op = 1, rx = 8, sw = 1.6) {
    return s('rect', { x, y, width: w, height: hgt, rx, stroke, fill, 'fill-opacity': op, 'stroke-width': sw });
  }

  function label(x, y, text, fill = C.ink, size = 13, weight = 700, anchor = 'middle') {
    return s('text', {
      x, y, fill, 'font-size': size, 'font-weight': weight,
      'text-anchor': anchor, 'font-family': 'Consolas, monospace',
    }, text);
  }

  function draw() {
    const nN = north.length, nS = south.length, totalCount = nN + nS;
    const sumN = sum(north), sumS = sum(south), totalSum = sumN + sumS;
    const meanN = sumN / nN, meanS = sumS / nS;
    const overall = totalSum / totalCount;
    const wrong = (meanN + meanS) / 2;
    const diff = Math.abs(overall - wrong);

    bAddN.disabled = nN >= 5;
    bRemN.disabled = nN <= 1;
    bAddS.disabled = nS >= 5;
    bRemS.disabled = nS <= 1;

    const k = [];
    const u = unit();
    const sw = colWidth(nN, nS);
    const bw = Math.min(54, sw * 0.72);

    // Top strip: North computer -> Main computer <- South computer
    const cardH = 88, cardY = 8;
    const sideW = NARROW ? 116 : 196;
    const midW = NARROW ? 124 : 210;
    const midX = (VW - midW) / 2;
    const leftX = 8;
    const rightX = VW - sideW - 8;

    // North card
    k.push(
      rect(leftX, cardY, sideW, cardH, C.cyan, C.bg, 0.92, 10, 1.8),
      label(leftX + sideW / 2, cardY + 21, 'NORTH', C.cyan, NARROW ? 12 : 14),
      label(leftX + sideW / 2, cardY + 44, `sum ${money(sumN)}`, C.ink, NARROW ? 12 : 14),
      label(leftX + sideW / 2, cardY + 62, `count ${nN}`, C.ink, NARROW ? 12 : 14),
      label(leftX + sideW / 2, cardY + 79, `mean ${money(meanN)}`, C.cyan, NARROW ? 11 : 12, 600),
    );
    // South card
    k.push(
      rect(rightX, cardY, sideW, cardH, C.amber, C.bg, 0.92, 10, 1.8),
      label(rightX + sideW / 2, cardY + 21, 'SOUTH', C.amber, NARROW ? 12 : 14),
      label(rightX + sideW / 2, cardY + 44, `sum ${money(sumS)}`, C.ink, NARROW ? 12 : 14),
      label(rightX + sideW / 2, cardY + 62, `count ${nS}`, C.ink, NARROW ? 12 : 14),
      label(rightX + sideW / 2, cardY + 79, `mean ${money(meanS)}`, C.amber, NARROW ? 11 : 12, 600),
    );
    // Main card
    k.push(
      rect(midX, cardY, midW, cardH, C.green, C.bg, 0.95, 10, 2),
      label(midX + midW / 2, cardY + 21, 'MAIN COMPUTER', C.green, NARROW ? 12 : 14),
      label(midX + midW / 2, cardY + 45, `${money(totalSum)} ÷ ${totalCount}`, C.ink, NARROW ? 13 : 15),
      label(midX + midW / 2, cardY + 71, `MEAN ${money(overall)}`, C.green, NARROW ? 14 : 17),
    );
    // Connecting arrows
    const arrowY = cardY + cardH / 2;
    k.push(
      s('line', { x1: leftX + sideW + 2, y1: arrowY, x2: midX - 4, y2: arrowY, stroke: C.cyan, 'stroke-width': 2.2 }),
      s('polygon', { points: `${midX - 2},${arrowY} ${midX - 9},${arrowY - 5} ${midX - 9},${arrowY + 5}`, fill: C.cyan }),
      s('line', { x1: rightX - 2, y1: arrowY, x2: midX + midW + 4, y2: arrowY, stroke: C.amber, 'stroke-width': 2.2 }),
      s('polygon', { points: `${midX + midW + 2},${arrowY} ${midX + midW + 9},${arrowY - 5} ${midX + midW + 9},${arrowY + 5}`, fill: C.amber }),
    );

    // Chart gridlines ($0 to $20)
    for (let g = 0; g <= MAX_VAL; g += 5) {
      const y = BASE - g * u;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        label(X0 - 7, y + 4, `$${g}`, C.muted, 12 * F, 600, 'end'),
      );
    }

    // Group divider & headers
    const sepX = X0 + sw * nN + GAP / 2;
    const northMid = X0 + (sw * nN) / 2;
    const southMid = sepX + GAP / 2 + (sw * nS) / 2;
    k.push(
      s('line', { x1: sepX, x2: sepX, y1: TOP - 16, y2: BASE + 38, stroke: C.muted, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.5 }),
      label(northMid, TOP - 24, `NORTH (${nN})`, C.cyan, 13 * F),
      label(southMid, TOP - 24, `SOUTH (${nS})`, C.amber, 13 * F),
    );

    // Dollar-block stacks
    const sales = allSales();
    sales.forEach((item, i) => {
      const cx = colCenter(i, nN, nS);
      const col = item.shop === 'N' ? C.cyan : C.amber;
      const letter = String.fromCharCode(65 + i);
      if (i === sel) {
        k.push(s('rect', {
          x: cx - sw / 2 + 2, y: TOP - 8, width: sw - 4, height: BASE - TOP + 8,
          fill: '#ffffff', 'fill-opacity': 0.05, rx: 8,
        }));
      }
      for (let b = 0; b < item.val; b++) {
        k.push(s('rect', {
          x: cx - bw / 2, y: BASE - (b + 1) * u + 1,
          width: bw, height: Math.max(2, u - 2),
          fill: col, 'fill-opacity': 0.84, rx: 2,
        }));
      }
      k.push(
        label(cx, BASE + 20, letter, col, (totalCount > 8 ? 12 : 14) * F),
        label(cx, BASE + 38, `$${item.val}`, C.ink, (totalCount > 8 ? 12 : 14) * F),
      );
    });

    // Wrong shop-mean average dashed line (pink) — pill on left
    const yWrong = BASE - wrong * u;
    const wrongW = NARROW ? 132 : 162;
    const wrongY = Math.max(TOP + 24, yWrong);
    k.push(
      s('line', { x1: X0, x2: X1, y1: yWrong, y2: yWrong, stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '6 6' }),
      rect(X0 + 4, wrongY - 26, wrongW, 22, C.pink, C.bg, 0.94, 11, 1.5),
      label(X0 + 4 + wrongW / 2, wrongY - 11, `SHOP AVG ${money(wrong)}`, C.pink, NARROW ? 11.5 : 13),
    );

    // Correct overall mean dashed line (green) — pill on right
    const yOverall = BASE - overall * u;
    const overW = NARROW ? 132 : 162;
    const overY = Math.max(TOP + 24, yOverall);
    k.push(
      s('line', { x1: X0, x2: X1, y1: yOverall, y2: yOverall, stroke: C.green, 'stroke-width': 3, 'stroke-dasharray': '9 6' }),
      rect(X1 - overW - 4, overY - 26, overW, 22, C.green, C.bg, 0.95, 11, 1.8),
      label(X1 - overW / 2 - 4, overY - 11, `OVERALL ${money(overall)}`, C.green, NARROW ? 11.5 : 13),
    );

    svg.replaceChildren(...k);

    fbox(box, [
      [`North: sum ${money(sumN)}, count ${nN}  (mean ${money(meanN)})`, C.cyan],
      [`South: sum ${money(sumS)}, count ${nS}  (mean ${money(meanS)})`, C.amber],
      [`Combined: ${money(totalSum)} ÷ ${totalCount} = ${money(overall)}`, C.green],
      [`Avg of means: (${money(meanN)} + ${money(meanS)}) ÷ 2 = ${money(wrong)}`, diff < 1e-6 ? C.green : C.pink],
      [`Sent to main: 4 numbers (not ${totalCount} tickets)`, C.muted],
    ]);

    if (diff < 1e-6) {
      note.textContent = nN === nS
        ? `Both shops have ${nN} ${nN === 1 ? 'sale' : 'sales'}, so averaging the shop means matches ${money(overall)}. Try adding a sale to one shop!`
        : `Both shops have the same mean (${money(meanN)}), so both methods give ${money(overall)}.`;
    } else {
      note.textContent = `North has ${nN} ${nN === 1 ? 'sale' : 'sales'} and South has ${nS}. Averaging the two shop means is off by ${money(diff)}.`;
    }

    const active = sales[sel];
    const activeLetter = String.fromCharCode(65 + sel);
    selLabel.textContent = `Selected: Ticket ${activeLetter} (${active.shop === 'N' ? 'North' : 'South'}, $${active.val})`;
    svg.setAttribute('aria-label', `North sum ${money(sumN)} count ${nN}. South sum ${money(sumS)} count ${nS}. Overall mean ${money(overall)}. Shop-mean average ${money(wrong)}.`);

    chal.update({ north, south, overall, wrong, randomCount });
  }

  draw();
  return () => {};
}

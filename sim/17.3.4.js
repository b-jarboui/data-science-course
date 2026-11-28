// 17.3.4 Try it: stride and padding on row 2 of the tile photo.
// Controls for stride (1, 2, 3), padding zeros at each end (0, 1, 2), stepping/tapping pairs,
// random new practice rows, and self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;
  const CHAPTER_ROW = [4, 4, 1, 1];
  const PRACTICE_ROWS = [
    [4, 1, 1, 1], [4, 1, 1, 4], [4, 1, 4, 1], [4, 1, 4, 4],
    [4, 4, 1, 4], [4, 4, 4, 1], [1, 4, 1, 1], [1, 4, 1, 4], [1, 4, 4, 1],
  ];

  let row = CHAPTER_ROW.slice();
  let stride = 2;
  let pad = 0;
  let sel = 0;
  let usedNewData = false;
  let predSubmitted = false;
  let predChoice = null;
  let predMsg = '';
  let lastChalIdx = 0;
  const chDone = [false, false, false];

  const svg = s('svg', { viewBox: '0 0 700 410' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const strideRow = h('div', { class: 'sim-row' });
  const padRow = h('div', { class: 'sim-row' });
  const navRow = h('div', { class: 'sim-row' });
  const predWrap = h('div', { class: 'sim-row' });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: stride and padding'),
    h('p', { class: 'sub' }, 'Change the stride or add zeros at each end. Tap any score below the row to move the 2-square filter, or tap a photo square to toggle 4 and 1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, strideRow, padRow, navRow, predWrap),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const isChapterRow = () => row.join(',') === CHAPTER_ROW.join(',');
  const rowLocked = () => (chal.index === 0 && !chDone[0]) || (chal.index === 1 && !chDone[1]);

  function paddedRow() {
    const z = Array(pad).fill(0);
    return [...z, ...row, ...z];
  }

  function positions() {
    const full = paddedRow();
    const out = [];
    for (let start = 0; start + 1 < full.length; start += stride) {
      const left = full[start], right = full[start + 1];
      const crossesChipEdge = left === 4 && right === 1 && start >= pad && start + 1 < pad + row.length;
      out.push({ start, left, right, score: left - right, crossesChipEdge });
    }
    return out;
  }

  const chal = challenges(ch, [
    {
      text: 'With a stride of 3 and 1 zero at each end, predict how many scores you’ll get.',
      check: st => {
        const ok = st.predSubmitted && st.predChoice === 2;
        if (ok) chDone[0] = true;
        return ok;
      },
      why: 'The filter makes one score at the first position and one more after a full three-square move.',
    },
    {
      text: 'Set the stride to 2, add 1 zero at each end, and select the score at the chip edge.',
      check: st => {
        const ok = st.isChapterRow && st.stride === 2 && st.pad === 1 && st.sel === 1;
        if (ok) chDone[1] = true;
        return ok;
      },
      why: 'The filter crosses the chip edge at the middle pair, where four minus one gives three.',
    },
    {
      text: 'Press “New data”, then choose a stride and padding and select a pair that crosses a bright-to-dark drop (score 3).',
      check: st => {
        const ok = st.usedNewData && st.selectedCrossesEdge && st.selectedScore === 3;
        if (ok) chDone[2] = true;
        return ok;
      },
      why: 'Yes! Checking the pairs shows whether your stride and padding land right across the edge.',
    },
  ]);

  // Restore chapter row whenever opening challenge 1 or challenge 2
  function syncChallenge() {
    if (chal.index !== lastChalIdx) {
      lastChalIdx = chal.index;
      if ((chal.index === 0 && !chDone[0]) || (chal.index === 1 && !chDone[1])) {
        row = CHAPTER_ROW.slice();
        sel = 0;
        predMsg = '';
      }
      draw();
    }
  }
  ch.addEventListener('click', () => syncChallenge());

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} 410`);

  function drawControls() {
    strideRow.replaceChildren(
      pill('STRIDE', C.amber),
      ...[1, 2, 3].map(v => btn(String(v), () => { stride = v; sel = 0; draw(); }, stride === v ? 'go' : ''))
    );
    padRow.replaceChildren(
      pill('PADDING (ZEROS EACH END)', C.violet),
      ...[0, 1, 2].map(v => btn(String(v), () => { pad = v; sel = 0; draw(); }, pad === v ? 'go' : ''))
    );

    const pos = positions();
    const locked = rowLocked();
    const newDataBtn = btn('New data', () => {
      if (rowLocked()) {
        note.textContent = 'The chapter row [4, 4, 1, 1] stays fixed until this challenge is done.';
        return;
      }
      const choices = PRACTICE_ROWS.filter(r => r.join(',') !== row.join(','));
      row = choices[rnd(0, choices.length - 1)].slice();
      usedNewData = true;
      sel = 0;
      draw();
    });
    if (locked) newDataBtn.style.opacity = '0.55';

    navRow.replaceChildren(
      btn('‹ Prev pair', () => { sel = (sel - 1 + pos.length) % pos.length; draw(); }),
      btn('Next pair ›', () => { sel = (sel + 1) % pos.length; draw(); }),
      newDataBtn,
      btn('Reset', () => {
        row = CHAPTER_ROW.slice();
        stride = 2;
        pad = 0;
        sel = 0;
        predMsg = '';
        draw();
      })
    );

    // Challenge 1 prediction buttons (reveal after learner submits)
    if (chal.index === 0 && !chDone[0]) {
      predWrap.style.display = '';
      predWrap.replaceChildren(
        pill('PREDICT SCORES (STRIDE 3, PAD 1)', C.cyan),
        ...[1, 2, 3, 4].map(n => btn(String(n), () => {
          predChoice = n;
          stride = 3;
          pad = 1;
          sel = 0;
          if (n === 2) {
            predSubmitted = true;
            predMsg = '';
          } else {
            predSubmitted = false;
            predMsg = `You predicted ${n}. Try the rule: 6 − 2 = 4 squares to move, divided by stride 3, rounded down, plus 1.`;
          }
          draw();
        }, predChoice === n ? 'go' : ''))
      );
    } else {
      predWrap.style.display = 'none';
      predWrap.replaceChildren();
    }
  }

  function draw() {
    const full = paddedRow();
    const pos = positions();
    if (sel >= pos.length) sel = 0;
    const hideForPred = chal.index === 0 && !chDone[0] && stride === 3 && pad === 1;
    const cur = pos[sel];

    const W = full.length;
    const margin = NARROW ? 16 : 36;
    const cell = Math.min(NARROW ? 56 : 74, (VW - 2 * margin) / W);
    const totalW = W * cell;
    const x0 = (VW - totalW) / 2;
    const rowY = 66;
    const scoreY = rowY + cell + 58;
    const k = [];

    // Header label above photo squares
    const photoX0 = x0 + pad * cell;
    const photoW = row.length * cell;
    k.push(s('text', {
      x: photoX0 + photoW / 2, y: rowY - 22, fill: C.muted,
      'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas',
    }, isChapterRow() ? 'TILE PHOTO — ROW 2' : 'PRACTICE ROW'));

    if (pad > 0) {
      k.push(
        s('text', { x: x0 + (pad * cell) / 2, y: rowY - 22, fill: C.violet, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'PAD'),
        s('text', { x: photoX0 + photoW + (pad * cell) / 2, y: rowY - 22, fill: C.violet, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'PAD')
      );
    }

    // Draw squares (padded zeros + photo squares)
    full.forEach((val, idx) => {
      const x = x0 + idx * cell;
      const isPad = idx < pad || idx >= pad + row.length;
      const isChip = !isPad && val === 1;
      const col = isPad ? C.violet : (isChip ? C.pink : C.cyan);
      const fillOp = isPad ? 0.14 : (isChip ? 0.16 : 0.28);

      const g = s('g', { style: isPad || rowLocked() ? '' : 'cursor:pointer' });
      g.append(s('rect', {
        x: x + 2, y: rowY, width: cell - 4, height: cell, rx: 6,
        fill: col, 'fill-opacity': fillOp, stroke: col, 'stroke-width': 2,
        'stroke-dasharray': isPad ? '6 4' : null,
      }));

      // Pattern hatch for chip and padding squares (distinguishable without colour alone)
      if (isChip || isPad) {
        const padIn = 10;
        g.append(
          s('line', { x1: x + padIn, y1: rowY + cell - padIn, x2: x + cell - padIn, y2: rowY + padIn, stroke: col, 'stroke-opacity': 0.28, 'stroke-width': 1.5 }),
          s('line', { x1: x + padIn, y1: rowY + cell / 2, x2: x + cell / 2, y2: rowY + padIn, stroke: col, 'stroke-opacity': 0.22, 'stroke-width': 1.5 })
        );
      }

      g.append(s('text', {
        x: x + cell / 2, y: rowY + cell / 2 + 7 * F,
        fill: isPad ? C.violet : (isChip ? C.pink : C.ink),
        'font-size': 22 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
      }, String(val)));

      if (!isPad) {
        const origIdx = idx - pad;
        g.append(s('text', {
          x: x + cell / 2, y: rowY - 6, fill: C.muted,
          'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas',
        }, `c${origIdx + 1}`));
        g.addEventListener('click', () => {
          if (rowLocked()) {
            note.textContent = 'The chapter row [4, 4, 1, 1] stays fixed until this challenge is done.';
            return;
          }
          row[origIdx] = row[origIdx] === 4 ? 1 : 4;
          draw();
        });
      }
      k.push(g);
    });

    // Mark every bright-to-dark chip edge inside the photo
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === 4 && row[i + 1] === 1) {
        const ex = x0 + (pad + i + 1) * cell;
        k.push(
          s('line', { x1: ex, x2: ex, y1: rowY - 8, y2: rowY + cell + 8, stroke: C.amber, 'stroke-width': 3.5, 'stroke-dasharray': '6 4' }),
          s('text', { x: ex, y: rowY + cell + 22, fill: C.amber, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'edge')
        );
      }
    }

    // Filter outline over selected pair (hidden while waiting for Ch 1 prediction)
    if (!hideForPred) {
      const fx = x0 + cur.start * cell;
      const winCol = cur.crossesChipEdge ? C.green : C.amber;
      k.push(s('rect', {
        x: fx + 1, y: rowY - 3, width: 2 * cell - 2, height: cell + 6, rx: 9,
        fill: winCol, 'fill-opacity': 0.1, stroke: winCol, 'stroke-width': 3.8,
      }));

      // Step arcs between consecutive positions
      for (let i = 0; i < pos.length - 1; i++) {
        const xA = x0 + (pos[i].start + 1) * cell;
        const xB = x0 + (pos[i + 1].start + 1) * cell;
        const midX = (xA + xB) / 2;
        k.push(
          s('path', {
            d: `M ${xA} ${scoreY - 22} Q ${midX} ${scoreY - 40} ${xB} ${scoreY - 22}`,
            fill: 'none', stroke: C.cyan, 'stroke-width': 2, 'stroke-opacity': 0.65,
          }),
          s('text', {
            x: midX, y: scoreY - 35, fill: C.cyan,
            'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas',
          }, `+${stride}`)
        );
      }

      // Clickable score badges under every fitting pair
      pos.forEach((p, idx) => {
        const cx = x0 + (p.start + 1) * cell;
        const isSel = idx === sel;
        const col = p.crossesChipEdge ? C.green : (p.score < 0 ? C.pink : C.amber);
        const bw = Math.min(54 * F, cell * 1.15), bh = 30 * F;
        const bg = s('g', { style: 'cursor:pointer' });
        bg.append(
          s('rect', {
            x: cx - bw / 2, y: scoreY - bh / 2, width: bw, height: bh, rx: bh / 2,
            fill: isSel ? col : C.bg, 'fill-opacity': isSel ? 0.24 : 0.95,
            stroke: col, 'stroke-width': isSel ? 3 : 1.8,
          }),
          s('text', {
            x: cx, y: scoreY + 5 * F, fill: col,
            'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
          }, p.score < 0 ? `−${Math.abs(p.score)}` : String(p.score)),
          s('text', {
            x: cx, y: scoreY + bh / 2 + 15, fill: isSel ? C.ink : C.muted,
            'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas',
          }, `#${idx + 1}`)
        );
        bg.addEventListener('click', () => { sel = idx; draw(); });
        k.push(bg);
      });
    } else {
      // Mask positions until Challenge 1 prediction is submitted
      k.push(
        s('rect', {
          x: x0 + 1, y: rowY - 3, width: 2 * cell - 2, height: cell + 6, rx: 9,
          fill: C.amber, 'fill-opacity': 0.08, stroke: C.amber, 'stroke-width': 3.2, 'stroke-dasharray': '7 5',
        }),
        s('text', {
          x: VW / 2, y: scoreY + 4, fill: C.amber,
          'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
        }, 'Predict the score count below to reveal the pairs!')
      );
    }

    // Mini 2-to-1 filter network at the bottom of the SVG
    const netY = 326, netW = NARROW ? 160 : 210;
    const inX = VW / 2 - netW / 2, outX = VW / 2 + netW / 2;
    const inY0 = netY - 34, inY1 = netY + 34, nr = NARROW ? 20 : 22;
    const leftVal = hideForPred ? '?' : String(cur.left);
    const rightVal = hideForPred ? '?' : String(cur.right);
    const outVal = hideForPred ? '?' : (cur.score < 0 ? `−${Math.abs(cur.score)}` : String(cur.score));
    const outCol = hideForPred ? C.muted : (cur.crossesChipEdge ? C.green : (cur.score < 0 ? C.pink : C.amber));

    k.push(
      s('line', { x1: inX + nr, y1: inY0, x2: outX - nr, y2: netY, stroke: C.cyan, 'stroke-width': 4 }),
      s('line', { x1: inX + nr, y1: inY1, x2: outX - nr, y2: netY, stroke: C.pink, 'stroke-width': 4 }),
      s('text', { x: VW / 2, y: (inY0 + netY) / 2 - 10, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '+1'),
      s('text', { x: VW / 2, y: (inY1 + netY) / 2 + 20, fill: C.pink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '−1'),
      s('circle', { cx: inX, cy: inY0, r: nr, fill: C.card, stroke: C.violet, 'stroke-width': 2.5 }),
      s('circle', { cx: inX, cy: inY1, r: nr, fill: C.card, stroke: C.violet, 'stroke-width': 2.5 }),
      s('circle', { cx: outX, cy: netY, r: nr, fill: C.card, stroke: outCol, 'stroke-width': 2.5 }),
      s('text', { x: inX, y: inY0 + 6, fill: C.ink, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, leftVal),
      s('text', { x: inX, y: inY1 + 6, fill: C.ink, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, rightVal),
      s('text', { x: outX, y: netY + 6, fill: outCol, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, outVal),
      s('text', { x: inX - nr - 10, y: inY0 + 5, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'left'),
      s('text', { x: inX - nr - 10, y: inY1 + 5, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'right'),
      s('text', { x: outX + nr + 10, y: netY + 5, fill: outCol, 'font-size': 13 * F, 'text-anchor': 'start', 'font-family': 'Consolas' }, 'score')
    );

    svg.replaceChildren(...k);

    // Formula box
    const room = W - 2;
    const moves = Math.floor(room / stride);
    const totalScores = moves + 1;
    const scoreStr = cur.score < 0 ? `−${Math.abs(cur.score)}` : String(cur.score);
    if (hideForPred) {
      fbox(box, [
        `row width  = 4 + 2×${pad} = ${W}`,
        `room       = ${W} − 2 = ${room}`,
        `stride     = ${stride}`,
        [`scores     = 1 + floor(${room} ÷ ${stride}) = ?`, C.amber],
      ]);
    } else {
      fbox(box, [
        `row width  = 4 + 2×${pad} = ${W}`,
        `room       = ${W} − 2 = ${room}`,
        `full moves = floor(${room} ÷ ${stride}) = ${moves}`,
        [`scores     = ${moves} + 1 = ${totalScores}`, C.cyan],
        [`pair #${sel + 1}: ${cur.left} − ${cur.right} = ${scoreStr}`, outCol],
      ]);
    }

    if (predMsg) {
      note.textContent = predMsg;
    } else if (hideForPred) {
      note.textContent = 'Use the formula above, then tap your prediction (1, 2, 3, or 4) to reveal the scores.';
    } else if (cur.crossesChipEdge) {
      note.textContent = `Pair #${sel + 1} crosses the chip edge! Brightness drops from 4 to 1, giving a score of 3.`;
    } else if (cur.start < pad || cur.start + 1 >= pad + row.length) {
      note.textContent = `Pair #${sel + 1} includes an added border zero (padding), so this score comes from outside the photo.`;
    } else {
      note.textContent = `Stride ${stride} and padding ${pad} fit ${totalScores} window${totalScores === 1 ? '' : 's'}. Tap any score badge to inspect its pair.`;
    }

    drawControls();
    chal.update({
      stride,
      pad,
      sel,
      isChapterRow: isChapterRow(),
      usedNewData,
      predSubmitted,
      predChoice,
      selectedScore: cur.score,
      selectedCrossesEdge: cur.crossesChipEdge,
    });
  }

  draw();
  return () => {};
}

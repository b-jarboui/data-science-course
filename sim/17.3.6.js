// 17.3.6 Try it: Max pooling on a 2x2 patch.
// Drag any score onto another square to swap them, or tap a square and change it with -1 / +1 / Set to 0.
// Tap New data to get a fresh patch and pick the biggest score before checking the formula box.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [0, 0, 0, 3];
  const POS_NAMES = ['top left', 'top right', 'bottom left', 'bottom right'];
  const POS_SHORT = ['r1 c1', 'r1 c2', 'r2 c1', 'r2 c2'];

  let scores = START.slice();
  let sel = 3; // starts on the 3 in the bottom-right square
  let revealed = true;
  let draggedThree = false;
  let isNewPatch = false;
  let pickedRightOnNew = false;
  let feedback = '';
  let drag = null;

  const svg = s('svg', { viewBox: '0 0 700 360' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const predictRow = h('div', { class: 'sim-row', style: { alignItems: 'center' } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: max pooling'),
    h('p', { class: 'sub' }, 'Drag a score to another square inside the outline to move it, or tap a square and use −1 / +1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        predictRow,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)),
          btn('Set to 0', () => setVal(0)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const maxScore = () => Math.max(...scores);
  const fmtSigned = v => (v < 0 ? '−' + fmt(Math.abs(v)) : fmt(v));

  const chal = challenges(ch, [
    {
      text: 'Predict the new score, then drag the three to another square inside the outline to check.',
      check: st => st.draggedThree && st.max === 3,
      why: 'Yes! Moving the 3 to another square inside the patch does not change the biggest score, so the new score stays 3.',
    },
    {
      text: 'The other three scores are already zero, so change the three to zero to make the new score zero.',
      check: st => st.scores.every(x => x === 0) && st.max === 0,
      why: 'Right! When every square in the patch holds 0, the biggest score is 0.',
    },
    {
      text: 'Tap New data, then choose the biggest score before you check the formula box.',
      check: st => st.pickedRightOnNew,
      why: 'Nice! Max pooling always keeps the biggest score in the patch, no matter which square holds it.',
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = NARROW ? 310 : 360;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const PX = NARROW ? 16 : 46;
  const PY = NARROW ? 52 : 54;
  const PAD = NARROW ? 8 : 12;
  const GAP = NARROW ? 8 : 12;
  const CELL = NARROW ? 88 : 120;
  const PW = PAD * 2 + CELL * 2 + GAP;
  const OUTX = NARROW ? 278 : 482;
  const OUTS = NARROW ? 108 : 156;
  const OUTY = PY + PW / 2 - OUTS / 2;

  function cellRect(i) {
    const r = Math.floor(i / 2), c = i % 2;
    return { x: PX + PAD + c * (CELL + GAP), y: PY + PAD + r * (CELL + GAP), w: CELL, h: CELL };
  }

  function hitCell(p) {
    for (let i = 0; i < 4; i++) {
      const b = cellRect(i);
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return i;
    }
    return -1;
  }

  function bump(d) {
    scores[sel] = Math.max(-5, Math.min(9, scores[sel] + d));
    revealed = true;
    feedback = '';
    draw();
  }

  function setVal(val) {
    scores[sel] = val;
    revealed = true;
    feedback = '';
    draw();
  }

  function newData() {
    const pool = [-3, -2, -1, 0, 0, 1, 2, 3, 4, 5, 6];
    let next = [0, 0, 0, 0];
    for (let tries = 0; tries < 20; tries++) {
      next = [0, 1, 2, 3].map(() => pool[rnd(0, pool.length - 1)]);
      if (new Set(next).size >= 3 && next.join() !== scores.join()) break;
    }
    scores = next;
    sel = 0;
    revealed = false;
    isNewPatch = true;
    feedback = 'Choose the biggest score below before checking the formula box.';
    draw();
  }

  function reset() {
    scores = START.slice();
    sel = 3;
    revealed = true;
    isNewPatch = false;
    feedback = '';
    draw();
  }

  function pick(val) {
    const mx = maxScore();
    const ok = val === mx;
    revealed = true;
    if (ok && isNewPatch) pickedRightOnNew = true;
    feedback = ok
      ? `Yes! ${fmtSigned(mx)} is the biggest score in this patch.`
      : `Good try — ${fmtSigned(mx)} is bigger than ${fmtSigned(val)}. Tap New data to try another patch.`;
    draw();
  }

  // Pointer drag to swap two squares inside the patch, or tap to select
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const i = hitCell(p);
    if (i < 0) return;
    sel = i;
    drag = { from: i, x: p.x, y: p.y, startX: p.x, startY: p.y, moved: false, over: i };
    svg.setPointerCapture(e.pointerId);
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = toSvg(e);
    drag.x = p.x;
    drag.y = p.y;
    if (Math.hypot(p.x - drag.startX, p.y - drag.startY) > 8) drag.moved = true;
    drag.over = hitCell(p);
    draw();
  });

  function finishDrag() {
    if (!drag) return;
    if (drag.moved && drag.over >= 0 && drag.over !== drag.from) {
      const a = scores[drag.from], b = scores[drag.over];
      scores[drag.from] = b;
      scores[drag.over] = a;
      if (a === 3 || b === 3) draggedThree = true;
      sel = drag.over;
      feedback = a === b ? 'Both squares held the same score.' : `Swapped ${POS_NAMES[drag.from]} and ${POS_NAMES[drag.over]}.`;
    }
    drag = null;
    draw();
  }
  svg.addEventListener('pointerup', finishDrag);
  svg.addEventListener('pointercancel', finishDrag);

  function draw() {
    const mx = maxScore();
    const k = [];

    // Patch heading and outline
    k.push(
      s('text', { x: PX + PW / 2, y: PY - 16, fill: C.amber, 'font-size': NARROW ? 15 : 17, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '2 × 2 PATCH'),
      s('rect', { x: PX, y: PY, width: PW, height: PW, rx: 14, fill: C.bg, stroke: C.amber, 'stroke-width': 3 })
    );

    // Four patch squares
    scores.forEach((val, i) => {
      const b = cellRect(i);
      const isMax = revealed && val === mx;
      const isSel = i === sel;
      const isDrop = drag && drag.moved && drag.over === i && drag.over !== drag.from;
      const isSrc = drag && drag.moved && drag.from === i;
      const stroke = isDrop ? C.green : (isSel ? C.cyan : (isMax ? C.amber : (val < 0 ? C.pink : '#344264')));
      const fill = isDrop ? C.green : (isMax ? C.amber : (val < 0 ? C.pink : '#141e3c'));
      const fillOp = isDrop ? 0.2 : (isMax ? 0.2 : (val < 0 ? 0.14 : 0.95));

      k.push(
        s('rect', {
          x: b.x, y: b.y, width: b.w, height: b.h, rx: 10,
          fill, 'fill-opacity': isSrc ? 0.35 : fillOp,
          stroke, 'stroke-width': isDrop || isSel ? 3 : 2,
          'stroke-dasharray': isSrc ? '6 5' : null,
          style: 'cursor: grab',
        }),
        s('text', {
          x: b.x + 8, y: b.y + (NARROW ? 16 : 20),
          fill: C.muted, 'font-size': NARROW ? 11 : 13, 'font-family': 'Consolas',
        }, POS_SHORT[i]),
        s('text', {
          x: b.x + b.w / 2, y: b.y + b.h / 2 + (NARROW ? 14 : 18),
          fill: isMax ? C.amber : (val < 0 ? C.pink : C.ink),
          'fill-opacity': isSrc ? 0.35 : 1,
          'font-size': NARROW ? 36 : 46, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas',
        }, fmtSigned(val))
      );
    });

    // Arrow from patch to pooled output
    const ax1 = PX + PW + (NARROW ? 10 : 20);
    const ax2 = OUTX - (NARROW ? 12 : 20);
    const ay = PY + PW / 2;
    k.push(
      s('line', { x1: ax1, y1: ay, x2: ax2, y2: ay, stroke: C.amber, 'stroke-width': 3.5 }),
      s('polyline', { points: `${ax2 - 11},${ay - 9} ${ax2},${ay} ${ax2 - 11},${ay + 9}`, fill: 'none', stroke: C.amber, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      s('text', { x: (ax1 + ax2) / 2, y: ay - 16, fill: C.muted, 'font-size': NARROW ? 13 : 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, NARROW ? 'max' : 'max pooling')
    );

    // Pooled output square
    k.push(
      s('text', { x: OUTX + OUTS / 2, y: OUTY - 16, fill: C.amber, 'font-size': NARROW ? 15 : 17, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'NEW SCORE'),
      s('rect', {
        x: OUTX, y: OUTY, width: OUTS, height: OUTS, rx: 14,
        fill: revealed ? C.amber : C.bg, 'fill-opacity': revealed ? 0.2 : 1,
        stroke: revealed ? C.amber : C.green, 'stroke-width': 3.5,
      }),
      s('text', {
        x: OUTX + OUTS / 2, y: OUTY + OUTS / 2 + (NARROW ? 18 : 22),
        fill: revealed ? C.amber : C.green,
        'font-size': NARROW ? 46 : 58, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas',
      }, revealed ? fmtSigned(mx) : '?'),
      s('text', {
        x: OUTX + OUTS / 2, y: OUTY + OUTS + 24,
        fill: C.muted, 'font-size': NARROW ? 12 : 14,
        'text-anchor': 'middle', 'font-family': 'Consolas',
      }, revealed ? 'exact spot lost' : 'pick below')
    );

    // Floating dragged card
    if (drag && drag.moved) {
      const sz = CELL * 0.84;
      const v = scores[drag.from];
      k.push(
        s('rect', {
          x: drag.x - sz / 2, y: drag.y - sz / 2, width: sz, height: sz, rx: 10,
          fill: C.card, 'fill-opacity': 0.94, stroke: C.amber, 'stroke-width': 3,
        }),
        s('text', {
          x: drag.x, y: drag.y + (NARROW ? 12 : 15),
          fill: C.amber, 'font-size': NARROW ? 34 : 42, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas',
        }, fmtSigned(v))
      );
    }

    svg.replaceChildren(...k);

    // Prediction buttons when waiting on New data
    if (!revealed) {
      const uniq = Array.from(new Set(scores)).sort((a, b) => a - b);
      predictRow.style.display = 'flex';
      predictRow.replaceChildren(
        h('span', { class: 'sim-note', style: { margin: 0, color: C.green, fontWeight: 700 } }, 'Biggest score:'),
        ...uniq.map(v => btn(fmtSigned(v), () => pick(v), 'go')),
        btn('Check formula box', () => { revealed = true; feedback = ''; draw(); }, 'ghost')
      );
    } else {
      predictRow.style.display = 'none';
      predictRow.replaceChildren();
    }

    // Formula box
    const topStr = `${fmtSigned(scores[0])}, ${fmtSigned(scores[1])}`;
    const botStr = `${fmtSigned(scores[2])}, ${fmtSigned(scores[3])}`;
    if (revealed) {
      fbox(box, [
        `top row:    ${topStr}`,
        `bottom row: ${botStr}`,
        'New score = biggest score in patch',
        [`          = ${fmtSigned(mx)}`, C.amber],
      ]);
    } else {
      fbox(box, [
        `top row:    ${topStr}`,
        `bottom row: ${botStr}`,
        'New score = biggest score in patch',
        ['          = ?  (choose a score first)', C.green],
      ]);
    }

    const negNote = revealed && scores.some(x => x < 0) && mx === 0
      ? 'Notice: 0 is bigger than any negative score, so 0 wins.'
      : 'Moving the biggest score to another square inside the patch keeps the same new score.';
    note.textContent = feedback || negNote;
    selLabel.textContent = `Selected: ${POS_NAMES[sel]} (${fmtSigned(scores[sel])})`;

    chal.update({
      scores: scores.slice(),
      max: mx,
      draggedThree,
      pickedRightOnNew,
    });
  }

  draw();
  return () => {};
}

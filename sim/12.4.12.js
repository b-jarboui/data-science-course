// 12.4.12 Try it: Conformal prediction intervals.
// Drag sorted calibration error bars (or tap + use -1/+1), slide target coverage,
// generate random exchangeable pump groups, run 25 repeated groups, or break exchangeability
// with shifted conditions, and check 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Exact shared dataset from chapters/12.4.md
  const START_CAL = [0, 1, 2, 3, 1, 2, 3, 4, 6].map((err, i) => ({ id: 'C' + (i + 1), err }));
  const START_EVAL = [
    { id: 'P1',  act: 12, pred: 18 },
    { id: 'P2',  act:  8, pred:  8 },
    { id: 'P3',  act: 14, pred: 14 },
    { id: 'P4',  act:  6, pred:  8 },
    { id: 'P5',  act: 16, pred: 15 },
    { id: 'P6',  act: 20, pred: 22 },
    { id: 'P7',  act: 18, pred: 17 },
    { id: 'P8',  act: 22, pred: 22 },
    { id: 'P9',  act: 24, pred: 25 },
    { id: 'P10', act: 26, pred: 24 },
    { id: 'P11', act: 28, pred: 28 },
    { id: 'P12', act: 30, pred: 31 },
  ];

  // Signed error pool matching the chapter's calibration distribution
  const ERR_POOL = [-6, -4, -3, -3, -2, -2, -1, -1, 0, 0, 1, 1, 2, 2, 3, 3, 4, 6];
  const sampleSignedErr = () => ERR_POOL[rnd(0, ERR_POOL.length - 1)];

  let cal = START_CAL.map(d => ({ ...d }));
  let baseEval = START_EVAL.map(d => ({ ...d }));
  let target = 80;
  let selId = 'C8';
  let shifted = false;
  let sameTrials = 0, sameCovSum = 0;
  let shiftTrials = 0, shiftCovSum = 0;
  let shiftedChecked = false;

  const svg = s('svg', { viewBox: '0 0 700 540' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const covLabel = h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 700, color: C.amber } });
  const covSlider = h('input', {
    type: 'range', min: 10, max: 90, step: 5, value: target,
    style: { flex: '1 1 140px', accentColor: C.amber, cursor: 'pointer' },
    oninput: e => { target = +e.target.value; draw(); }
  });
  const shiftBtn = btn('Conditions: Same', toggleShift);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Conformal prediction'),
    h('p', { class: 'sub' }, 'Drag any past error bar up or down (or tap it and use −1 / +1), move the target coverage slider, and test fresh random pump groups.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { fontWeight: 650 } }, 'Target coverage:'),
          covSlider, covLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 h', () => bump(-1)), btn('+1 h', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => newGroup(true), 'go'),
          btn('Run 25 random groups', () => runMany(25)),
          shiftBtn,
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Raise the target coverage slider to 90% under Same conditions. Watch which sorted bar is picked.',
      check: st => st.target === 90 && !st.shifted,
      why: 'At 90%, position ceil((9 + 1) × 0.90) = 9 picks the largest past error, widening every band so more outcomes fall inside.'
    },
    {
      text: 'Lower the target coverage until fewer than 10 of the 12 pumps fall inside their intervals (Same conditions).',
      check: st => st.inside < 10 && !st.shifted,
      why: 'A lower target picks a smaller past error, making every band narrower — more precise, but more actual outcomes fall outside.'
    },
    {
      text: 'Under Same conditions, test at least 3 fresh random groups (press “New data” or “Run 25 random groups”).',
      check: st => st.sameTrials >= 3,
      why: 'Individual 12-pump groups bounce above and below the target, while average coverage over comparable runs stays at or above the target.'
    },
    {
      text: 'Switch to “Shifted conditions” and see coverage drop below the target.',
      check: st => st.shifted && st.shiftedChecked && st.obsPct < st.target,
      why: 'When future pumps operate under different conditions, exchangeability breaks — past errors are too small to guarantee coverage.'
    }
  ]);

  function sortedCal() {
    return cal.slice().sort((a, b) => a.err - b.err || a.id.localeCompare(b.id));
  }
  function rankPos() {
    return Math.min(cal.length, Math.max(1, Math.ceil((cal.length + 1) * (target / 100))));
  }
  function currentEval() {
    return baseEval.map(p => ({
      id: p.id,
      pred: p.pred,
      act: shifted ? Math.max(1, p.act - 5) : p.act
    }));
  }

  function makeRandomSet() {
    const newCal = Array.from({ length: 9 }, (_, i) => ({
      id: 'C' + (i + 1),
      err: Math.abs(sampleSignedErr())
    }));
    const newEval = Array.from({ length: 12 }, (_, i) => {
      const pred = rnd(8, 30);
      const act = Math.max(1, Math.min(35, pred + sampleSignedErr()));
      return { id: 'P' + (i + 1), pred, act };
    });
    return { newCal, newEval };
  }

  function evalCoverage(calArr, evalArr, isShifted) {
    const sc = calArr.slice().sort((a, b) => a.err - b.err);
    const pos = Math.min(sc.length, Math.max(1, Math.ceil((sc.length + 1) * (target / 100))));
    const q = sc[pos - 1].err;
    let ins = 0;
    for (const p of evalArr) {
      const act = isShifted ? Math.max(1, p.act - 5) : p.act;
      if (Math.abs(p.pred - act) <= q) ins++;
    }
    return ins / evalArr.length;
  }

  function newGroup(record = true) {
    const { newCal, newEval } = makeRandomSet();
    cal = newCal;
    baseEval = newEval;
    if (record) {
      const cov = evalCoverage(cal, baseEval, shifted);
      if (shifted) { shiftTrials++; shiftCovSum += cov; shiftedChecked = true; }
      else { sameTrials++; sameCovSum += cov; }
    }
    draw();
  }

  function runMany(count) {
    for (let t = 0; t < count; t++) {
      const { newCal, newEval } = makeRandomSet();
      const cov = evalCoverage(newCal, newEval, shifted);
      if (shifted) { shiftTrials++; shiftCovSum += cov; shiftedChecked = true; }
      else { sameTrials++; sameCovSum += cov; }
      if (t === count - 1) { cal = newCal; baseEval = newEval; }
    }
    draw();
  }

  function toggleShift() {
    shifted = !shifted;
    if (shifted) shiftedChecked = true;
    shiftBtn.textContent = shifted ? 'Conditions: Shifted!' : 'Conditions: Same';
    shiftBtn.style.borderColor = shifted ? C.pink : '';
    shiftBtn.style.color = shifted ? C.pink : '';
    draw();
  }

  function reset() {
    cal = START_CAL.map(d => ({ ...d }));
    baseEval = START_EVAL.map(d => ({ ...d }));
    target = 80;
    covSlider.value = 80;
    selId = 'C8';
    shifted = false;
    shiftedChecked = false;
    sameTrials = 0; sameCovSum = 0;
    shiftTrials = 0; shiftCovSum = 0;
    shiftBtn.textContent = 'Conditions: Same';
    shiftBtn.style.borderColor = '';
    shiftBtn.style.color = '';
    draw();
  }

  function bump(d) {
    const item = cal.find(x => x.id === selId) || cal[0];
    item.err = Math.max(0, Math.min(10, item.err + d));
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 580 : 540, F = NARROW ? 1.12 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  // Top zone: sorted calibration bars
  const BX0 = NARROW ? 36 : 56, BX1 = VW - 16, BTOP = 34, BBASE = NARROW ? 186 : 178;
  const BMAX = 10;
  const bSlot = () => (BX1 - BX0) / cal.length;
  const bUnit = () => (BBASE - BTOP) / BMAX;

  // Bottom zone: 12 evaluation intervals
  const EX0 = NARROW ? 42 : 58, EX1 = VW - (NARROW ? 34 : 42);
  const ETOP = NARROW ? 242 : 228, EBASE = VH - 36;
  const e2x = v => EX0 + Math.max(0, Math.min(38, v)) / 38 * (EX1 - EX0);

  // Pointer drag on top calibration error bars
  let draggingId = null;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < BTOP - 16 || p.y > BBASE + 24) return;
    const i = Math.floor((p.x - BX0) / bSlot());
    const sc = sortedCal();
    if (i < 0 || i >= sc.length) return;
    selId = sc[i].id;
    draggingId = selId;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (!draggingId) return;
    const p = toSvg(e);
    const item = cal.find(x => x.id === draggingId);
    if (!item) return;
    item.err = Math.max(0, Math.min(BMAX, Math.round((BBASE - p.y) / bUnit())));
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { draggingId = null; });
  svg.addEventListener('pointercancel', () => { draggingId = null; });

  function draw() {
    const sc = sortedCal();
    const pos = rankPos();
    const q = sc[pos - 1].err;
    const ev = currentEval();
    const sl = bSlot(), bu = bUnit(), bw = Math.min(44, sl * 0.64);
    const k = [];

    // --- TOP: Sorted past calibration errors ---
    k.push(s('text', { x: BX0, y: 18, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      'PAST ERRORS (SORTED) — DRAG ANY BAR'));

    for (let g = 0; g <= BMAX; g += 2) {
      const y = BBASE - g * bu;
      k.push(s('line', { x1: BX0, x2: BX1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.7 }),
        s('text', { x: BX0 - 8, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    }

    sc.forEach((d, idx) => {
      const cx = BX0 + sl * (idx + 0.5);
      const isChosen = idx === pos - 1;
      const isSel = d.id === selId;
      const hgt = Math.max(4, d.err * bu);
      const col = isChosen ? C.amber : C.cyan;
      if (isSel) {
        k.push(s('rect', { x: cx - sl / 2 + 2, y: BTOP - 6, width: sl - 4, height: BBASE - BTOP + 26, rx: 6, fill: '#ffffff', 'fill-opacity': 0.06 }));
      }
      k.push(s('rect', {
        x: cx - bw / 2, y: BBASE - hgt, width: bw, height: hgt, rx: 3,
        fill: col, 'fill-opacity': isChosen ? 0.92 : 0.75,
        stroke: isChosen ? C.amber : col, 'stroke-width': isChosen ? 2 : 1
      }));
      k.push(s('text', {
        x: cx, y: BBASE - hgt - 6, fill: isChosen ? C.amber : C.ink,
        'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, d.err));
      k.push(s('text', {
        x: cx, y: BBASE + 16, fill: isChosen ? C.amber : C.muted,
        'font-size': 11 * F, 'font-weight': isChosen ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `#${idx + 1}`));
    });

    // Horizontal amber dashed line at chosen error q
    const yq = BBASE - q * bu;
    k.push(s('line', { x1: BX0, x2: BX1, y1: yq, y2: yq, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
    const pillW = NARROW ? 114 : 132;
    k.push(
      s('rect', { x: BX1 - pillW, y: Math.max(BTOP - 4, yq - 24), width: pillW, height: 20, rx: 10, fill: C.bg, stroke: C.amber }),
      s('text', { x: BX1 - pillW / 2, y: Math.max(BTOP + 10, yq - 10), fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `POS ${pos} → ±${q} h`)
    );

    // --- BOTTOM: 12 evaluation pump intervals ---
    k.push(s('text', { x: EX0, y: ETOP - 12, fill: shifted ? C.pink : C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      shifted ? '12 NEW PUMPS — SHIFTED CONDITIONS (−5h WEAR)' : '12 EVALUATION PUMPS — PREDICTION INTERVALS (±' + q + ' h)'));

    const rowH = (EBASE - ETOP) / ev.length;
    for (let tick = 0; tick <= 36; tick += 6) {
      const tx = e2x(tick);
      k.push(s('line', { x1: tx, x2: tx, y1: ETOP, y2: EBASE, stroke: C.line, 'stroke-opacity': 0.55 }),
        s('text', { x: tx, y: EBASE + 18, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, tick));
    }
    k.push(s('line', { x1: EX0, x2: EX1, y1: EBASE, y2: EBASE, stroke: C.muted, 'stroke-width': 1.5 }));
    k.push(s('text', { x: EX1, y: EBASE + 31, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'hours remaining'));

    let inside = 0;
    ev.forEach((p, idx) => {
      const cy = ETOP + (idx + 0.5) * rowH;
      const ok = Math.abs(p.pred - p.act) <= q;
      if (ok) inside++;
      const col = ok ? C.cyan : C.pink;
      const x1 = e2x(p.pred - q), x2 = e2x(p.pred + q), xp = e2x(p.pred), xa = e2x(p.act);
      const bh = Math.max(8, rowH * 0.52);

      k.push(s('text', { x: EX0 - 8, y: cy + 4, fill: ok ? C.muted : C.pink, 'font-size': 11 * F, 'font-weight': ok ? 400 : 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, p.id));
      k.push(s('rect', { x: x1, y: cy - bh / 2, width: Math.max(2, x2 - x1), height: bh, rx: 3, fill: col, 'fill-opacity': 0.25, stroke: col, 'stroke-width': 1.5 }));
      k.push(s('line', { x1: x1, x2: x1, y1: cy - bh * 0.65, y2: cy + bh * 0.65, stroke: col, 'stroke-width': 2 }));
      k.push(s('line', { x1: x2, x2: x2, y1: cy - bh * 0.65, y2: cy + bh * 0.65, stroke: col, 'stroke-width': 2 }));
      // Cyan predicted dot, white actual dot
      k.push(s('circle', { cx: xp, cy, r: 3.5, fill: C.cyan }));
      k.push(s('circle', { cx: xa, cy, r: 4.5, fill: C.ink, stroke: ok ? C.green : C.pink, 'stroke-width': 1.8 }));
      k.push(s('text', { x: EX1 + 12, y: cy + 5, fill: ok ? C.green : C.pink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'start', 'font-family': 'Consolas' }, ok ? '✓' : '✕'));
    });

    svg.replaceChildren(...k);

    const obsPct = Math.round((inside / ev.length) * 1000) / 10;
    const rawPos = Math.round((cal.length + 1) * (target / 100) * 100) / 100;
    const lines = [
      `n = ${cal.length} past errors, target = ${target}%`,
      `pos = ceil((${cal.length}+1) × ${fmt(target / 100)}) = ceil(${fmt(rawPos)}) = ${pos}`,
      [`q = #${pos} sorted error = ${q} h`, C.amber],
      `interval = pred ± ${q} h`,
      [`observed = ${inside} / ${ev.length} (${fmt(obsPct)}%)`, obsPct >= target ? C.green : C.pink]
    ];
    if (!shifted && sameTrials > 0) {
      const avg = Math.round((sameCovSum / sameTrials) * 1000) / 10;
      lines.push([`avg over ${sameTrials} same-cond groups: ${fmt(avg)}%`, avg >= target ? C.green : C.amber]);
    }
    if (shifted && shiftTrials > 0) {
      const avg = Math.round((shiftCovSum / shiftTrials) * 1000) / 10;
      lines.push([`avg over ${shiftTrials} shifted groups: ${fmt(avg)}%`, C.pink]);
    }
    fbox(box, lines);

    covLabel.textContent = `${target}%`;
    const selObj = cal.find(x => x.id === selId) || cal[0];
    selLabel.textContent = `Selected bar: ${selObj.id} (error ${selObj.err} h)`;
    note.textContent = shifted
      ? 'Shifted conditions: new pumps wear out 5 hours earlier than past pumps. Exchangeability no longer holds, so past errors undershoot.'
      : 'Blue dot = Tool A prediction, white dot = actual hours, shaded bar = pred ± q. The guarantee holds across repeated comparable groups.';

    chal.update({ target, q, inside, obsPct, shifted, shiftedChecked, sameTrials, shiftTrials });
  }

  draw();
  return () => {};
}

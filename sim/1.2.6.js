// 1.2.6 Try it: the mode (value with the highest frequency).
// The learner taps or drags stacks of dots for wait times (numbers) or café drinks (words),
// jams the coffee machine to see how the mode ignores an extreme wait, generates random data,
// and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START_WAITS = [1, 2, 3, 1, 0, 1]; // 3, 1, 4, 2, 3, 6, 2, 3 -> counts for 1..6 min
  const START_DRINKS = [3, 2, 1];         // coffee, tea, juice
  const MAX_DOTS = 7;

  let kind = 'waits';                     // 'waits' | 'drinks'
  let counts = START_WAITS.slice();
  let jamCount = 0;                       // count of 14-minute waits when machine jammed
  let jammed = false;
  let sel = 2;                            // selected column index

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const waitsBtn = btn('Waits (minutes)', () => switchKind('waits'), 'go');
  const drinksBtn = btn('Drinks (words)', () => switchKind('drinks'));
  const jamBtn = btn('Jam machine (4 → 14 min)', toggleJam);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the mode'),
    h('p', { class: 'sub' }, 'Each dot is one customer. Tap or drag any stack up or down to change its frequency, or tap a column and use −1 / +1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 dot', () => bump(-1)), btn('+1 dot', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          waitsBtn, drinksBtn, jamBtn,
          btn('New data (random)', randomize),
          btn('Start again', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const items = () => {
    if (kind === 'drinks') {
      return [
        { label: 'coffee', count: counts[0], num: null, outlier: false },
        { label: 'tea', count: counts[1], num: null, outlier: false },
        { label: 'juice', count: counts[2], num: null, outlier: false },
      ];
    }
    const list = [1, 2, 3, 4, 5, 6].map((v, i) => ({ label: String(v), count: counts[i], num: v, outlier: false }));
    if (jammed) list.push({ label: '14', count: jamCount, num: 14, outlier: true });
    return list;
  };

  const setCountAt = (i, val) => {
    const clamped = Math.max(0, Math.min(MAX_DOTS, val));
    if (kind === 'waits' && jammed && i === 6) jamCount = clamped;
    else if (i >= 0 && i < counts.length) counts[i] = clamped;
  };

  function stats() {
    const list = items();
    const total = list.reduce((a, x) => a + x.count, 0);
    const maxFreq = list.reduce((a, x) => Math.max(a, x.count), 0);
    const modes = maxFreq >= 2 ? list.filter(x => x.count === maxFreq).map(x => x.label) : [];
    let meanVal = null;
    if (kind === 'waits' && total > 0) {
      const sum = list.reduce((a, x) => a + x.num * x.count, 0);
      meanVal = sum / total;
    }
    return { list, total, maxFreq, modes, meanVal };
  }

  const chal = challenges(ch, [
    { text: 'In Waits (minutes), make 2 minutes the only mode.',
      check: st => st.kind === 'waits' && st.modes.length === 1 && st.modes[0] === '2',
      why: 'Yes! Now 2 minutes has the tallest stack, so the mode is the value below that stack: 2 minutes.' },
    { text: 'In Waits, press “Jam machine (4 → 14 min)”. Watch the mean move while the mode stays put.',
      check: st => st.kind === 'waits' && st.jammed && st.jamCount >= 1 && st.modes.length === 1 && st.modes[0] !== '14',
      why: 'Right: one 14-minute wait pulls the mean up, but a single dot never beats the tallest stack, so the mode does not move.' },
    { text: 'Switch to Drinks (words) and make a tie with two modes.',
      check: st => st.kind === 'drinks' && st.modes.length === 2,
      why: 'Exactly! The mode works with words too, and when two drinks tie for the highest frequency, both are modes.' },
    { text: 'Make a dataset with no mode (at least 2 customers, nothing repeats).',
      check: st => st.total >= 2 && st.modes.length === 0,
      why: 'When every present value has frequency 1, nothing stands out — so there is no mode.' },
  ]);

  function switchKind(next) {
    if (kind === next) return;
    kind = next;
    jammed = false; jamCount = 0;
    counts = next === 'waits' ? START_WAITS.slice() : START_DRINKS.slice();
    sel = next === 'waits' ? 2 : 0;
    draw();
  }

  function toggleJam() {
    if (kind !== 'waits') switchKind('waits');
    if (!jammed) {
      jammed = true;
      if (counts[3] > 0) { counts[3]--; jamCount = 1; } else { jamCount = 1; }
      sel = 6;
    } else {
      counts[3] = Math.min(MAX_DOTS, counts[3] + jamCount);
      jamCount = 0;
      jammed = false;
      sel = Math.min(sel, 5);
    }
    draw();
  }

  function randomize() {
    jammed = false; jamCount = 0;
    if (kind === 'waits') {
      counts = [0, 0, 0, 0, 0, 0];
      const n = rnd(7, 11);
      for (let k = 0; k < n; k++) {
        const i = rnd(0, 5);
        if (counts[i] < MAX_DOTS) counts[i]++;
      }
      sel = Math.min(sel, 5);
    } else {
      counts = [0, 0, 0];
      const n = rnd(5, 9);
      for (let k = 0; k < n; k++) {
        const i = rnd(0, 2);
        if (counts[i] < MAX_DOTS) counts[i]++;
      }
      sel = Math.min(sel, 2);
    }
    draw();
  }

  function reset() {
    jammed = false; jamCount = 0;
    counts = kind === 'waits' ? START_WAITS.slice() : START_DRINKS.slice();
    sel = kind === 'waits' ? 2 : 0;
    draw();
  }

  function bump(d) {
    const list = items();
    if (sel >= list.length) sel = list.length - 1;
    setCountAt(sel, list[sel].count + d);
    draw();
  }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 24 : 44, X1 = VW - (NARROW ? 16 : 30), BASE = 356, TOP = 54;
  svg.setAttribute('viewBox', `0 0 ${VW} 420`);
  const stepY = (BASE - TOP) / (MAX_DOTS + 0.4);
  const slotW = n => (X1 - X0) / n;

  // Pointer drag / tap on columns
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const applyPointer = e => {
    const list = items();
    if (dragging < 0 || dragging >= list.length) return;
    const p = toSvg(e);
    if (p.y > BASE + 8) { draw(); return; } // tapped label: select only
    const target = Math.max(0, Math.min(MAX_DOTS, Math.round((BASE - p.y) / stepY)));
    setCountAt(dragging, target);
    draw();
  };
  svg.addEventListener('pointerdown', e => {
    const list = items(), p = toSvg(e);
    const i = Math.floor((p.x - X0) / slotW(list.length));
    if (i < 0 || i >= list.length) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    applyPointer(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging >= 0) applyPointer(e); });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const st = stats();
    const { list, total, maxFreq, modes, meanVal } = st;
    const n = list.length, sl = slotW(n);
    const dotR = Math.min(18, Math.max(11, sl * 0.22));

    waitsBtn.className = 'sim-btn ' + (kind === 'waits' ? 'go' : '');
    drinksBtn.className = 'sim-btn ' + (kind === 'drinks' ? 'go' : '');
    jamBtn.style.display = kind === 'waits' ? '' : 'none';
    jamBtn.textContent = jammed ? 'Unjam machine (14 → 4)' : 'Jam machine (4 → 14 min)';
    jamBtn.className = 'sim-btn ' + (jammed ? 'go' : '');

    const k = [];
    // Subtle horizontal frequency guides
    for (let g = 1; g <= MAX_DOTS; g++) {
      const y = BASE - (g - 0.5) * stepY;
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.55 }));
    }
    // Baseline
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2.5 }));

    // Highest frequency dashed line when a mode exists
    if (maxFreq >= 2) {
      const yTop = BASE - maxFreq * stepY;
      k.push(
        s('line', { x1: X0, x2: X1, y1: yTop, y2: yTop, stroke: C.amber, 'stroke-width': 2.2, 'stroke-dasharray': '8 6' }),
        s('rect', { x: X1 - 148 * F, y: Math.max(6, yTop - 28 * F), width: 146 * F, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: C.amber }),
        s('text', { x: X1 - 75 * F, y: Math.max(21, yTop - 13 * F), fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `HIGHEST FREQ = ${maxFreq}`)
      );
    }

    // Visual break before 14-min jammed column
    if (kind === 'waits' && jammed) {
      const bx = X0 + sl * 6;
      k.push(s('text', { x: bx, y: BASE + 24, fill: C.pink, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '···'));
    }

    list.forEach((item, i) => {
      const cx = X0 + sl * (i + 0.5);
      const isMode = maxFreq >= 2 && item.count === maxFreq;
      const col = item.outlier ? C.pink : isMode ? C.amber : maxFreq <= 1 ? C.muted : C.cyan;

      // Selection highlight column
      if (i === sel) {
        k.push(s('rect', { x: cx - sl / 2 + 4, y: TOP - 10, width: sl - 8, height: BASE - TOP + 14, fill: '#ffffff', 'fill-opacity': 0.05, rx: 10 }));
      }
      // Mode outline box
      if (isMode) {
        const bw = Math.min(sl - 10, dotR * 3.1), bh = item.count * stepY + 10;
        k.push(s('rect', { x: cx - bw / 2, y: BASE - item.count * stepY - 5, width: bw, height: bh, fill: C.amber, 'fill-opacity': 0.09, stroke: C.amber, 'stroke-width': 2, rx: 12 }));
      }
      // Dots
      for (let d = 0; d < item.count; d++) {
        const cy = BASE - (d + 0.5) * stepY;
        k.push(
          s('circle', { cx, cy, r: dotR * 1.38, fill: col, 'fill-opacity': 0.16 }),
          s('circle', { cx, cy, r: dotR, fill: col })
        );
      }
      // Frequency count above stack
      const cyCnt = item.count > 0 ? BASE - item.count * stepY - 12 : BASE - 12;
      k.push(s('text', { x: cx, y: cyCnt, fill: item.count === 0 ? C.muted : col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, item.count));

      // Value label below axis
      const valCol = isMode ? C.amber : item.outlier ? C.pink : C.ink;
      k.push(s('text', { x: cx, y: BASE + 26, fill: valCol, 'font-size': (kind === 'drinks' ? 16 : 16) * F, 'font-weight': isMode ? 700 : 600, 'text-anchor': 'middle', 'font-family': kind === 'drinks' ? 'Segoe UI, Arial' : 'Consolas' }, item.label));
    });

    // Axis subtitle
    k.push(s('text', { x: (X0 + X1) / 2, y: BASE + 52, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial' }, kind === 'waits' ? 'values (wait time in minutes)' : 'values (drink choice)'));

    svg.replaceChildren(...k);

    // Formula box
    const freqLine = kind === 'waits'
      ? list.map(x => `${x.label}:${x.count}`).join('  ')
      : list.map(x => `${x.label}:${x.count}`).join('   ');
    const modeLine = total === 0
      ? ['mode = none (add dots)', C.muted]
      : modes.length === 0
        ? ['mode = none (nothing repeats)', C.pink]
        : modes.length === 1
          ? [`mode = ${modes[0]}${kind === 'waits' ? ' min' : ''} (freq ${maxFreq})`, C.amber]
          : [`modes = ${modes.join(' & ')} (tie at ${maxFreq})`, C.amber];
    const lines = [
      `values & freq: ${freqLine}`,
      `highest freq = ${maxFreq}`,
      modeLine,
    ];
    if (kind === 'waits' && meanVal !== null) {
      lines.push([`mean (average) = ${fmt(Math.round(meanVal * 100) / 100)} min`, jammed ? C.pink : C.muted]);
    }
    fbox(box, lines);

    note.textContent = total === 0
      ? 'Tap or drag any column to add customer dots.'
      : modes.length === 0
        ? 'Every present value appears once, so nothing stands out — there is no mode.'
        : modes.length === 1
          ? `The tallest stack sits above ${modes[0]}${kind === 'waits' ? ' minutes' : ''} (${maxFreq} customers). Remember: ${maxFreq} is the frequency, ${modes[0]} is the mode.`
          : `Tie at frequency ${maxFreq}: ${modes.join(' and ')} share the tallest stack, so there is more than one mode.`;

    const cur = list[Math.min(sel, list.length - 1)];
    selLabel.textContent = `Selected: ${cur.label}${kind === 'waits' ? ' min' : ''} (freq ${cur.count})`;

    chal.update({ kind, jammed, jamCount, total, maxFreq, modes, meanVal });
  }

  draw();
  return () => {};
}

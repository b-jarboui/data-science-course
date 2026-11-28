// 1.2.7 Try it: weighted means — when bigger groups count more.
// Drag either shift's stacks up/down (or tap a shift and step its mean or customer count),
// level all stacks together, compare with the halfway-point trap, make random shifts, and test challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = { n1: 8, m1: 3, n2: 16, m2: 1.5 };
  let { n1, m1, n2, m2 } = START;
  let sel = 0; // 0 = Morning, 1 = Lunch
  let level = 0, anim = 0, showTrap = true, randomLevels = 0, random = false;

  const svg = s('svg', { viewBox: '0 0 700 430' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const trapBtn = btn('Halfway trap: On', () => { showTrap = !showTrap; trapBtn.textContent = showTrap ? 'Halfway trap: On' : 'Halfway trap: Off'; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: weighted means'),
    h('p', { class: 'sub' }, 'Each stack is one customer’s wait in minute-blocks. Drag Morning (cyan) or Lunch (pink) up or down, or tap a shift and change its wait or customer count.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Wait −0.5', () => bumpMean(-0.5)),
          btn('Wait +0.5', () => bumpMean(0.5)),
          btn('People −1', () => bumpCount(-1)),
          btn('People +1', () => bumpCount(1)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Level all stacks', () => go(1), 'go'),
          btn('Back to shifts', () => go(0)),
          trapBtn,
          btn('New shifts (random)', () => {
            n1 = rnd(4, 16); n2 = rnd(4, 20);
            m1 = rnd(2, 11) / 2; m2 = rnd(2, 11) / 2;
            if (Math.abs(m1 - m2) < 0.5) m2 = m1 <= 3 ? m1 + 1.5 : m1 - 1.5;
            random = true; changed();
          }),
          btn('Start again', () => { ({ n1, m1, n2, m2 } = START); random = false; sel = 0; showTrap = true; trapBtn.textContent = 'Halfway trap: On'; changed(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const t1 = () => n1 * m1;
  const t2 = () => n2 * m2;
  const totalMin = () => t1() + t2();
  const totalPeople = () => n1 + n2;
  const wmean = () => totalMin() / totalPeople();
  const halfway = () => (m1 + m2) / 2;

  const chal = challenges(ch, [
    {
      text: 'Give both shifts the same number of customers (with different wait times). Watch the weighted mean and the halfway point.',
      check: st => st.n1 === st.n2 && Math.abs(st.m1 - st.m2) >= 0.5,
      why: 'When both groups have the same size, they count equally, so the weighted mean lands right on the halfway point.'
    },
    {
      text: 'Keep Morning at 3 min and Lunch at 1.5 min, and change customer counts so the weighted mean drops below 1.8 min.',
      check: st => st.m1 === 3 && st.m2 === 1.5 && st.wmean < 1.8,
      why: 'Yes! When Lunch has an even bigger share of the customers, it pulls the overall average even closer to 1.5.'
    },
    {
      text: 'With two different shift waits, make the overall weighted mean exactly 2.5 minutes.',
      check: st => Math.abs(st.wmean - 2.5) < 1e-6 && Math.abs(st.m1 - st.m2) >= 0.5,
      why: 'Spot on! Total minutes shared across all customers land right at 2.5, even though the two shifts differ.'
    },
    {
      text: 'Press “New shifts (random)” and then “Level all stacks”, twice. Does the leveled height always match the weighted mean?',
      check: st => st.randomLevels >= 2,
      why: 'Always. Levelling shares every minute-block equally across all customers, which is exactly the weighted mean.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 36 : 50, X1 = VW - 12, BASE = 368, TOP = 36;
  const MAX_V = 6;
  svg.setAttribute('viewBox', `0 0 ${VW} 430`);
  const unit = (BASE - TOP) / MAX_V;

  function layout() {
    const gap = NARROW ? 14 : 22;
    const avail = X1 - X0 - gap;
    const step = avail / (n1 + n2);
    const mEnd = X0 + n1 * step;
    const lStart = mEnd + gap;
    return { step, gap, mEnd, lStart, splitX: mEnd + gap / 2 };
  }

  function changed() { cancelAnimationFrame(anim); level = 0; draw(); }
  function bumpMean(d) {
    if (sel === 0) m1 = Math.max(0.5, Math.min(MAX_V, Math.round((m1 + d) * 2) / 2));
    else m2 = Math.max(0.5, Math.min(MAX_V, Math.round((m2 + d) * 2) / 2));
    changed();
  }
  function bumpCount(d) {
    if (sel === 0) n1 = Math.max(1, Math.min(24, n1 + d));
    else n2 = Math.max(1, Math.min(24, n2 + d));
    changed();
  }
  function go(target) {
    if (target === 1 && random && level < 0.5) randomLevels++;
    cancelAnimationFrame(anim);
    const from = level, t0 = performance.now();
    const stepAnim = now => {
      const k = Math.min(1, (now - t0) / 850);
      level = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(stepAnim);
    };
    anim = requestAnimationFrame(stepAnim);
  }

  // Drag either shift up/down to set its mean wait in 0.5-minute steps
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.x < X0 || p.x > X1) return;
    const { splitX } = layout();
    const side = p.x < splitX ? 0 : 1;
    sel = side; dragging = side;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const val = Math.max(0.5, Math.min(MAX_V, Math.round(((BASE - p.y) / unit) * 2) / 2));
    if (dragging === 0) m1 = val; else m2 = val;
    changed();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const wm = wmean(), hw = halfway();
    const { step, mEnd, lStart } = layout();
    const bw = Math.max(4, Math.min(34, step * 0.72));
    const k = [];

    // Grid lines (0..6 minutes)
    for (let g = 0; g <= MAX_V; g++) {
      const y = BASE - g * unit;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // Selection backdrop
    const selX = sel === 0 ? X0 : lStart;
    const selW = sel === 0 ? (mEnd - X0) : (X1 - lStart);
    k.push(s('rect', { x: selX - 2, y: TOP - 8, width: selW + 4, height: BASE - TOP + 10, fill: '#ffffff', 'fill-opacity': .04, rx: 8 }));

    // Helper to draw a shift's stacks
    function drawShift(count, meanVal, startX, color) {
      const hgt = meanVal + (wm - meanVal) * level;
      for (let i = 0; i < count; i++) {
        const cx = startX + step * (i + 0.5);
        for (let b = 0; b < Math.ceil(hgt - 1e-9); b++) {
          const part = Math.min(1, hgt - b);
          const bh = Math.max(1, part * unit - 1.6);
          k.push(s('rect', {
            x: cx - bw / 2, y: BASE - (b + part) * unit + 0.8,
            width: bw, height: bh, fill: color, 'fill-opacity': .84, rx: 1.5
          }));
        }
      }
      return hgt;
    }

    const h1 = drawShift(n1, m1, X0, C.cyan);
    const h2 = drawShift(n2, m2, lStart, C.pink);

    // Shift labels below floor
    const mMid = (X0 + mEnd) / 2, lMid = (lStart + X1) / 2;
    k.push(
      s('text', { x: mMid, y: BASE + 22, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `Morning: ${n1}`),
      s('text', { x: mMid, y: BASE + 40, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `${fmt(r2(h1))} min each`),
      s('text', { x: lMid, y: BASE + 22, fill: C.pink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `Lunch: ${n2}`),
      s('text', { x: lMid, y: BASE + 40, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `${fmt(r2(h2))} min each`)
    );

    // Halfway-point trap line (left badge so it never collides with the right weighted badge)
    if (showTrap) {
      const yh = BASE - hw * unit;
      const bwH = (NARROW ? 116 : 138) * F;
      const pillY = Math.max(6, yh - 28 * F);
      k.push(
        s('line', { x1: X0, x2: X1, y1: yh, y2: yh, stroke: C.violet, 'stroke-width': 2.5, 'stroke-dasharray': '5 5' }),
        s('rect', { x: X0 + 4, y: pillY, width: bwH, height: 24 * F, rx: 12 * F, fill: C.bg, stroke: C.violet }),
        s('text', { x: X0 + 4 + bwH / 2, y: pillY + 16 * F, fill: C.violet, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          'HALFWAY ' + fmt(r2(hw)))
      );
    }

    // True weighted mean line (right badge)
    const yw = BASE - wm * unit;
    const bwW = (NARROW ? 124 : 152) * F;
    const pillWY = Math.max(6, yw - 28 * F);
    k.push(
      s('line', { x1: X0, x2: X1, y1: yw, y2: yw, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '9 7' }),
      s('rect', { x: X1 - bwW, y: pillWY, width: bwW, height: 24 * F, rx: 12 * F, fill: C.bg, stroke: C.amber }),
      s('text', { x: X1 - bwW / 2, y: pillWY + 16 * F, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        'WEIGHTED ' + fmt(r2(wm)))
    );

    svg.replaceChildren(...k);

    // Formula box
    const lines = [
      [`Morning: ${n1} × ${fmt(m1)} = ${fmt(r2(t1()))} min`, C.cyan],
      [`Lunch:   ${n2} × ${fmt(m2)} = ${fmt(r2(t2()))} min`, C.pink],
      `Total:   ${fmt(r2(totalMin()))} ÷ ${totalPeople()} people`,
      [`Weighted mean = ${fmt(r2(wm))} min`, C.amber]
    ];
    if (showTrap) lines.push([`Halfway point = ${fmt(r2(hw))} min`, C.violet]);
    fbox(box, lines);

    const diff = Math.abs(wm - hw);
    note.textContent = level > 0.99
      ? `Levelled: all ${totalPeople()} customers now have the exact weighted mean (${fmt(r2(wm))} min).`
      : diff < 1e-6
        ? 'Both shifts have the same size (or same wait), so the weighted mean and the halfway point match.'
        : (n2 > n1
          ? `Lunch has more customers (${n2} vs ${n1}), so it pulls the weighted mean closer to ${fmt(m2)} min.`
          : `Morning has more customers (${n1} vs ${n2}), so it pulls the weighted mean closer to ${fmt(m1)} min.`);

    selLabel.textContent = sel === 0
      ? `Selected: Morning (${n1} people, ${fmt(m1)} min)`
      : `Selected: Lunch (${n2} people, ${fmt(m2)} min)`;

    chal.update({ n1, m1, n2, m2, wmean: wm, halfway: hw, randomLevels });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

// 10.2.7 Try it: when inputs move together.
// The learner moves card J's walk (drag the chart or use the slider) and nudges J's rent by 20 dollars.
// The sim shows the imaginary card on the B–F line, the extra walk and extra rent, and both slopes, live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = { wB: 10, rB: 1000, rF: 1100, wJ: 7, rJ: 1400 };
  let d = { ...START }, nudgedHalf = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const slider = h('input', { type: 'range', step: 0.25, style: { flex: '1 1 10rem' }, oninput: e => { d.wJ = +e.target.value; draw(); } });
  const walkLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: when inputs move together'),
    h('p', { class: 'sub' }, 'Cards B, F and J: area across, walk up. Drag up or down on the chart (or use the slider) to change J’s walk, and nudge J’s rent. Watch both slopes.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', { class: 'sim-note', style: { margin: 0 } }, 'J’s walk'), slider, walkLabel),
        h('div', { class: 'sim-row' },
          btn('J rent −20', () => nudge(-1)),
          btn('J rent +20', () => nudge(1), 'go'),
          btn('New data (random)', () => { newData(); draw(); }),
          btn('Start again', () => { d = { ...START }; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const num = x => fmt(r2(x)).replace('-', '−');
  const sgn = x => (x > 0 ? '+' : '') + num(x);
  const par = x => x < 0 ? `(${num(x)})` : num(x);
  const usd = n => (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('en-US');

  // F is always one area step and 2 minutes shorter than B; the imaginary card repeats that change once more.
  function solve() {
    const wF = d.wB - 2, lineW = 2 * wF - d.wB, lineR = 2 * d.rF - d.rB;
    const xw = d.wJ - lineW, xr = d.rJ - lineR;
    const bW = xw === 0 ? null : xr / xw;
    const bA = bW === null ? null : (d.rF - d.rB) + 2 * bW;
    return { wF, lineW, lineR, xw, xr, bW, bA };
  }
  function nudge(k) {
    d.rJ += 20 * k;
    if (k > 0 && Math.abs(solve().xw) === 0.5) nudgedHalf = true;
    draw();
  }
  function newData() {
    d.wB = rnd(9, 12);
    d.rB = 20 * rnd(45, 55);
    d.rF = d.rB + 20 * rnd(3, 7);
    const lineW = d.wB - 4;
    d.wJ = lineW + [-1, -0.5, 0.5, 1, 1.5][rnd(0, 4)];
    d.rJ = 2 * d.rF - d.rB + 20 * rnd(3, 15);
  }

  const chal = challenges(ch, [
    { text: 'Drag J’s walk below the imaginary card. What happens to the walk slope?',
      check: st => st.xw < 0,
      why: 'The slope flips sign: only J’s small extra walk and extra rent decide it, so it can say a longer walk lowers or raises rent.' },
    { text: 'Find J’s rent that makes the walk slope exactly 0.',
      check: st => st.bW === 0,
      why: 'Zero extra rent: J costs exactly what the imaginary card predicts, so the walk gets no dollars at all.' },
    { text: 'Make the slopes impossible to find.',
      check: st => st.xw === 0,
      why: 'J sits on the B–F line: zero extra walk, and you cannot divide by zero. Nothing can split the rent between area and walk.' },
    { text: 'Put J half a minute above the imaginary card, then press “J rent +20”. How far does the walk slope jump?',
      check: st => st.nudgedHalf,
      why: '20 dollars ÷ 0.5 minute = 40 per minute. The closer J sits to the line, the wilder each small change makes the slopes.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 40 : 56, X1 = VW - 16, BASE = 392, TOP = 30;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const ax = a => X0 + (a - 36) / 28 * (X1 - X0);
  const range = () => { const lw = d.wB - 4; return [lw - 3.5, d.wB + 1.5]; };
  const wy = w => { const [lo, hi] = range(); return BASE - (w - lo) / (hi - lo) * (BASE - TOP); };

  // drag anywhere on the chart: pointer height sets J's walk
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const move = e => {
    if (!dragging) return;
    const [lo, hi] = range(), lw = d.wB - 4, p = toSvg(e);
    const w = lo + (BASE - p.y) / (BASE - TOP) * (hi - lo);
    d.wJ = Math.max(lw - 3, Math.min(lw + 3, Math.round(w * 4) / 4));
    draw();
  };
  svg.addEventListener('pointerdown', e => { dragging = true; svg.setPointerCapture(e.pointerId); move(e); });
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = false; });

  const txt = (x, y, str, fill, size = 14, anchor = 'middle', weight = 700) =>
    s('text', { x, y, fill, 'font-size': size * F, 'font-weight': weight, 'text-anchor': anchor, 'font-family': 'Consolas' }, str);
  const dotEl = (x, y, col, dashed = false) => [
    s('circle', { cx: x, cy: y, r: 16, fill: col, 'fill-opacity': dashed ? 0.08 : 0.18, stroke: dashed ? col : 'none', 'stroke-dasharray': '4 4' }),
    s('circle', { cx: x, cy: y, r: 7, fill: dashed ? 'none' : col, stroke: col, 'stroke-width': 2 })];

  function draw() {
    const st = solve(), [lo, hi] = range(), lw = st.lineW;
    slider.min = lw - 3; slider.max = lw + 3; slider.value = d.wJ;
    walkLabel.textContent = `${num(d.wJ)} min`;
    const k = [];
    for (let w = Math.ceil(lo); w <= hi; w++) {
      const y = wy(w);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }), txt(X0 - 8, y + 4, w, C.muted, 13, 'end', 400));
    }
    for (const a of [40, 50, 60]) k.push(s('line', { x1: ax(a), x2: ax(a), y1: TOP, y2: BASE, stroke: C.line }), txt(ax(a), BASE + 22, a, C.muted, 13, 'middle', 400));
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
      txt(X1, BASE + 42, 'area (m²)', C.muted, 13, 'end', 400), txt(X0 + 4, TOP - 12, 'walk (min)', C.muted, 13, 'start', 400));
    // the B–F line: walk drops 2 minutes per 10 m²
    const lineAt = a => d.wB - 0.2 * (a - 40);
    k.push(s('line', { x1: ax(37), y1: wy(lineAt(37)), x2: ax(63), y2: wy(lineAt(63)), stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '8 6' }));
    // imaginary card and J
    const xJ = ax(60), yJ = wy(d.wJ), yX = wy(lw), onLine = st.xw === 0;
    if (!onLine) {
      const bx = xJ + 24;
      k.push(s('path', { d: `M${bx - 6} ${yX} H${bx} V${yJ} H${bx - 6}`, fill: 'none', stroke: C.amber, 'stroke-width': 2.5 }));
      if (!NARROW) k.push(txt(bx + 8, (yX + yJ) / 2 + 5, `${sgn(st.xw)} min`, C.amber, 13, 'start'));
    }
    k.push(...dotEl(xJ, yX, C.violet, true));
    const jAbove = d.wJ >= lw;
    k.push(txt(xJ, yX + (jAbove ? 34 : -26), `? ${usd(st.lineR)}`, C.violet, 13));
    [[40, d.wB, 'B', d.rB], [50, st.wF, 'F', d.rF]].forEach(([a, w, n, r]) => {
      k.push(...dotEl(ax(a), wy(w), C.cyan), txt(ax(a) + 20, wy(w) - 18, `${n} ${usd(r)}`, C.cyan, 14, 'start'));
    });
    const jc = onLine ? C.pink : C.cyan;
    k.push(...dotEl(xJ, yJ, jc), txt(xJ, yJ + (jAbove ? -26 : 34), `J ${usd(d.rJ)}`, jc, 14));
    svg.replaceChildren(...k);

    const lines = [
      `imaginary: walk ${num(lw)} min, rent ${st.lineR.toLocaleString('en-US')}`,
      `extra walk = ${num(d.wJ)} − ${num(lw)} = ${sgn(st.xw)}`,
      `extra rent = ${d.rJ.toLocaleString('en-US')} − ${st.lineR.toLocaleString('en-US')} = ${sgn(st.xr)}`];
    if (onLine) lines.push([`walk slope = ${num(st.xr)} ÷ 0 → no answer`, C.pink], ['area slope: cannot be split', C.pink]);
    else lines.push([`walk slope = ${num(st.xr)} ÷ ${par(st.xw)} = ${sgn(st.bW)} per min`, st.bW < 0 ? C.pink : C.amber],
      [`area slope = ${d.rF - d.rB} + 2 × ${par(st.bW)} = ${sgn(st.bA)} per 10 m²`, C.amber]);
    fbox(box, lines);
    note.textContent = onLine
      ? 'J sits on the B–F line: zero extra walk. Nothing can split the rent between area and walk.'
      : `Halfway from B to F the model always predicts ${usd((d.rB + d.rF) / 2)}, whatever the slopes: on the line, predictions stay steady.`;
    chal.update({ xw: st.xw, bW: st.bW === null ? null : r2(st.bW), nudgedHalf });
  }
  draw();
  return () => {};
}

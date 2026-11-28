// 20.1.7 Try it: Perplexity as an equivalent number of equally likely choices.
// Drag any token's loss stack up or down (or use the buttons) to change the model's
// chance for that target token, level the blocks to see the average token loss,
// and watch perplexity update live as equally likely word cards.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const ORANGE = '#fb923c';
  const MAX_BITS = Math.log2(1000); // ~9.9658 bits -> 0.1% chance, perplexity 1,000
  const START = [12.5, 50, 50, 12.5];
  const NEWSLETTERS = [
    ['opens', 'at', 'nine', '<end>'],
    ['closed', 'for', 'cleaning', '<end>'],
    ['starts', 'next', 'Monday', '<end>'],
    ['serves', 'soup', 'today', '<end>']
  ];

  let probs = START.slice();
  let targets = NEWSLETTERS[0];
  let sel = 0, level = 0, anim = 0, random = false, randomLevels = 0;

  const svg = s('svg', { viewBox: '0 0 700 460' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: loss and perplexity'),
    h('p', { class: 'sub' }, 'Each stack shows the loss (in bits) for one next-token prediction. Drag a stack up or down, or tap one and adjust its chance.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('÷2 chance (+1 bit)', () => scaleSel(0.5)),
          btn('×2 chance (−1 bit)', () => scaleSel(2)),
          btn('100%', () => setSel(100)),
          btn('50%', () => setSel(50)),
          btn('25%', () => setSel(25)),
          btn('12.5%', () => setSel(12.5)),
          btn('0.1%', () => setSel(0.1)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Level the blocks', () => go(1), 'go'),
          btn('Back to losses', () => go(0)),
          btn('New data (random)', newRandom),
          btn('Perfect (100%)', () => { probs = [100, 100, 100, 100]; random = false; changed(); }),
          btn('Untrained (0.1%)', () => { probs = [0.1, 0.1, 0.1, 0.1]; random = false; changed(); }),
          btn('Start again', () => { probs = START.slice(); targets = NEWSLETTERS[0]; random = false; sel = 0; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const clampP = p => Math.max(0.1, Math.min(100, p));
  const bitsOf = p => -Math.log2(clampP(p) / 100);
  const pOfBits = b => clampP(100 * Math.pow(2, -Math.max(0, Math.min(MAX_BITS, b))));
  const r2 = x => Math.round(x * 100) / 100;
  const r1 = x => Math.round(x * 10) / 10;
  const fmtP = p => p < 1 ? p.toFixed(1) : fmt(r1(p));
  const fmtPpl = x => x >= 100 ? String(Math.round(x)) : fmt(r2(x));

  function metrics() {
    const losses = probs.map(bitsOf);
    const total = losses.reduce((a, b) => a + b, 0);
    const avg = total / probs.length;
    const ppl = Math.pow(2, avg);
    return { losses, total, avg, ppl };
  }

  const chal = challenges(ch, [
    {
      text: 'Make the perplexity equal to 2 (so the average loss is 1 bit).',
      check: st => Math.abs(st.ppl - 2) < 0.04,
      why: 'Yes! An average loss of 1 bit gives perplexity 2^1 = 2, like choosing between 2 equally likely words.'
    },
    {
      text: 'Keep perplexity at 4, but use different chances from the lesson (12.5, 50, 50, 12.5).',
      check: st => Math.abs(st.ppl - 4) < 0.06 && !st.isStart,
      why: 'Right: any four losses that average to 2 bits (for example, 25% on every token) give the same perplexity of 4.'
    },
    {
      text: 'Give three tokens 100% chance, and one token 1% or less. Watch how far perplexity jumps.',
      check: st => st.probs.filter(p => p >= 99.5).length >= 3 && st.probs.some(p => p <= 1.05),
      why: 'One big surprise adds nearly 7 to 10 bits, pulling up the average loss and perplexity even when the other three tokens were certain.'
    },
    {
      text: 'Press “New data (random)” and then “Level the blocks”, twice. Is perplexity always 2 raised to the levelled height?',
      check: st => st.randomLevels >= 2,
      why: 'Always! Levelling gives the average token loss, and perplexity is always 2 raised to that average loss.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 36 : 54, X1 = VW - 14, BASE = 264, TOP = 26;
  const UNIT = (BASE - TOP) / 10;
  const SLOT = (X1 - X0) / 4;
  svg.setAttribute('viewBox', `0 0 ${VW} 460`);

  function changed() { cancelAnimationFrame(anim); level = 0; draw(); }
  function setSel(p) { probs[sel] = clampP(p); changed(); }
  function scaleSel(k) { probs[sel] = clampP(probs[sel] * k); changed(); }
  function newRandom() {
    const pool = [1, 3, 6.25, 12.5, 20, 25, 35, 50, 70, 85, 100];
    probs = probs.map(() => pool[rnd(0, pool.length - 1)]);
    targets = NEWSLETTERS[rnd(0, NEWSLETTERS.length - 1)];
    random = true;
    changed();
  }
  function go(target) {
    if (target === 1 && random && level < 0.5) randomLevels++;
    cancelAnimationFrame(anim);
    const from = level, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 850);
      level = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Pointer drag on loss stacks
  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > BASE + 38) return;
    const i = Math.floor((p.x - X0) / SLOT);
    if (i < 0 || i >= 4) return;
    sel = i; dragging = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const rawBits = Math.max(0, Math.min(MAX_BITS, (BASE - p.y) / UNIT));
    const snapped = rawBits > 9.6 ? MAX_BITS : Math.round(rawBits * 4) / 4;
    probs[dragging] = pOfBits(snapped);
    changed();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const { losses, total, avg, ppl } = metrics();
    const bw = Math.min(82, SLOT * 0.62);
    const k = [];

    // Gridlines (0 to 10 bits)
    for (let g = 0; g <= 10; g += 2) {
      const y = BASE - g * UNIT;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }
    k.push(s('text', { x: X0 - 8, y: TOP - 10, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'bits'));

    // 4 stacks of loss blocks
    losses.forEach((val, i) => {
      const hgt = val + (avg - val) * level;
      const cx = X0 + SLOT * (i + 0.5);
      const col = probs[i] <= 1.05 ? C.pink : (i === 3 ? ORANGE : C.cyan);
      if (i === sel) {
        k.push(s('rect', { x: cx - SLOT / 2 + 4, y: TOP - 6, width: SLOT - 8, height: BASE - TOP + 50, fill: '#ffffff', 'fill-opacity': .04, rx: 10 }));
      }
      const nBlocks = Math.ceil(hgt - 1e-9);
      for (let b = 0; b < nBlocks; b++) {
        const part = Math.min(1, hgt - b);
        k.push(s('rect', {
          x: cx - bw / 2,
          y: BASE - (b + part) * UNIT + 1.2,
          width: bw,
          height: Math.max(0, part * UNIT - 2.4),
          fill: col,
          'fill-opacity': .84,
          rx: 3
        }));
      }
      // Value on top of stack
      const yTop = BASE - hgt * UNIT - 7;
      k.push(s('text', { x: cx, y: Math.max(TOP + 8, yTop), fill: col, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${fmt(r2(hgt))}b`));
      // Token target & chance below baseline
      k.push(
        s('text', { x: cx, y: BASE + 20, fill: i === 3 ? ORANGE : C.ink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '→ ' + targets[i]),
        s('text', { x: cx, y: BASE + 38, fill: col, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmtP(probs[i]) + '%')
      );
    });

    // Dashed amber average loss line
    const ym = BASE - avg * UNIT;
    const pillW = NARROW ? 124 : 156;
    k.push(
      s('line', { x1: X0, x2: X1, y1: ym, y2: ym, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '9 7' }),
      s('rect', { x: X1 - pillW, y: Math.max(TOP, ym - 28), width: pillW, height: 24, rx: 12, fill: C.bg, stroke: C.amber }),
      s('text', { x: X1 - pillW / 2, y: Math.max(TOP + 16, ym - 12), fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `AVG ${fmt(r2(avg))} bits`)
    );

    // Lower panel: Perplexity as equally likely word cards
    const PY = 324, PH = 126;
    k.push(
      s('rect', { x: 10, y: PY, width: VW - 20, height: PH, rx: 12, fill: C.bg, stroke: C.line }),
      s('text', { x: VW / 2, y: PY + 24, fill: C.amber, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `PERPLEXITY = ${fmtPpl(ppl)}  (${fmtP(100 / ppl)}% EACH)`)
    );

    const eqN = Math.max(1, Math.round(ppl));
    if (eqN <= 16) {
      const cols = eqN <= 8 ? eqN : Math.ceil(eqN / 2);
      const rows = eqN <= 8 ? 1 : 2;
      const areaW = VW - 48, areaH = 78;
      const gap = 8;
      const cw = Math.min(NARROW ? 66 : 78, (areaW - (cols - 1) * gap) / cols);
      const chH = rows === 1 ? 56 : 34;
      const startY = PY + 38 + (areaH - (rows * chH + (rows - 1) * gap)) / 2;
      for (let idx = 0; idx < eqN; idx++) {
        const r = Math.floor(idx / cols), c = idx % cols;
        const inRow = r === rows - 1 ? eqN - r * cols : cols;
        const rowW = inRow * cw + (inRow - 1) * gap;
        const x = (VW - rowW) / 2 + c * (cw + gap);
        const y = startY + r * (chH + gap);
        k.push(
          s('rect', { x, y, width: cw, height: chH, rx: 7, fill: C.card, stroke: eqN === 1 ? C.green : C.cyan, 'stroke-width': 1.8 }),
          s('text', { x: x + cw / 2, y: y + chH / 2 + 5, fill: eqN === 1 ? C.green : C.cyan, 'font-size': (rows === 1 ? 13 : 11) * (NARROW ? 1 : 1), 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
            rows === 1 ? `#${idx + 1}` : String(idx + 1))
        );
      }
    } else {
      // Scale bar & dense dots for larger perplexities (up to 1,000)
      const dots = Math.min(60, Math.round(12 + 48 * Math.log10(ppl) / 3));
      const dCols = 20, dRows = Math.ceil(dots / dCols);
      const spX = (VW - 90) / dCols;
      for (let idx = 0; idx < dots; idx++) {
        const r = Math.floor(idx / dCols), c = idx % dCols;
        k.push(s('circle', {
          cx: 45 + (c + 0.5) * spX,
          cy: PY + 48 + r * 18,
          r: 4.5,
          fill: ppl > 100 ? C.pink : C.violet,
          'fill-opacity': .8
        }));
      }
      k.push(s('text', { x: VW / 2, y: PY + PH - 14, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `Equivalent to choosing fairly among ${fmtPpl(ppl)} words`));
    }

    svg.replaceChildren(...k);

    // Formula box
    const lossStr = losses.map(x => fmt(r2(x))).join(' + ');
    fbox(box, [
      `losses     = ${lossStr}`,
      `total      = ${fmt(r2(total))} bits`,
      `avg loss   = ${fmt(r2(total))} ÷ 4 = ${fmt(r2(avg))} bits`,
      [`perplexity = 2 ^ ${fmt(r2(avg))} = ${fmtPpl(ppl)}`, C.amber],
      [`equal share = 100% ÷ ${fmtPpl(ppl)} = ${fmtP(100 / ppl)}%`, C.green]
    ]);

    note.textContent = ppl <= 1.02
      ? 'Perfect: the model gives 100% to every target token, so loss is 0 bits and perplexity is 1.'
      : ppl >= 900
        ? 'Untrained: spreading 0.1% across all 1,000 tokens gives nearly 10 bits of loss and perplexity 1,000.'
        : level > 0.99
          ? `Levelled: every prediction shares the average loss (${fmt(r2(avg))} bits), giving perplexity ${fmtPpl(ppl)}.`
          : `As uncertain as choosing fairly among ${fmtPpl(ppl)} equally likely words (${fmtP(100 / ppl)}% each).`;

    selLabel.textContent = `Selected: → ${targets[sel]} (${fmtP(probs[sel])}%, ${fmt(r2(losses[sel]))} bits)`;

    const isStart = probs.every((p, i) => Math.abs(p - START[i]) < 0.05);
    chal.update({ ppl, avg, probs: probs.slice(), isStart, randomLevels });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

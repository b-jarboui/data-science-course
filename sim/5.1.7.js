// 5.1.7 Try it: multinomial counts.
// Tap any of the 5 ticket cards to change its kind (keeping total = 5), drag the chance bar
// to set urgent / normal / low probabilities (always summing to 1), simulate batches of 5 tickets,
// and watch the simulated hit rate and average counts settle toward the multinomial prediction.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const URG = '#ff7a45', NOR = C.cyan, LOW = C.violet;
  const COLS = [URG, NOR, LOW];
  const LET = ['U', 'N', 'L'];
  const NAMES = ['urgent', 'normal', 'low'];

  // State: 5 cards (0=urgent, 1=normal, 2=low), chances in twentieths summing to 20 (step = 0.05)
  const DEF_CARDS = [0, 1, 1, 2, 2];
  const DEF_W = [4, 8, 8]; // 0.20, 0.40, 0.40
  let cards = DEF_CARDS.slice();
  let w = DEF_W.slice();
  let runs = 0, hits = 0, sumCounts = [0, 0, 0], lastBatch = null, lastHit = false;
  let isRandom = false, anim = 0, pending = 0;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const lastRow = h('div', { class: 'sim-note', style: { margin: '0.45rem 0 0' } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: multinomial counts'),
    h('p', { class: 'sub' }, 'Tap any ticket card to switch its kind, or drag the two handles on the chance bar. Then draw batches of 5 tickets to test the model.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, lastRow,
        h('div', { class: 'sim-row' },
          btn('Draw 1 batch', () => { drawBatch(); draw(); }, 'go'),
          btn('Run 100 batches', () => runMany(100), 'go'),
          btn('Shuffle order', () => { shuffleCards(); draw(); }),
          btn('New data', () => { makeRandom(); draw(); }),
          btn('Start again', () => { resetAll(); draw(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const fact = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const getCounts = arr => { const c = [0, 0, 0]; arr.forEach(k => c[k]++); return c; };
  const probs = () => w.map(x => x / 20);
  const model = () => {
    const k = getCounts(cards), p = probs();
    const orders = fact(5) / (fact(k[0]) * fact(k[1]) * fact(k[2]));
    const oneOrder = Math.pow(p[0], k[0]) * Math.pow(p[1], k[1]) * Math.pow(p[2], k[2]);
    return { k, p, orders, oneOrder, prob: orders * oneOrder };
  };

  function clearTally() {
    cancelAnimationFrame(anim); pending = 0;
    runs = 0; hits = 0; sumCounts = [0, 0, 0]; lastBatch = null; lastHit = false;
  }
  function resetAll() {
    cards = DEF_CARDS.slice(); w = DEF_W.slice(); isRandom = false; clearTally();
  }
  function shuffleCards() {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = rnd(0, i); [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }
  function makeRandom() {
    const a = rnd(2, 12), b = rnd(2, Math.min(14, 18 - a)), c = 20 - a - b;
    w = [a, b, c];
    cards = Array.from({ length: 5 }, () => rnd(0, 2));
    isRandom = true;
    clearTally();
  }
  function drawBatch() {
    const p = probs(), target = getCounts(cards);
    const batch = [], c = [0, 0, 0];
    for (let i = 0; i < 5; i++) {
      const u = Math.random();
      const kind = u < p[0] ? 0 : u < p[0] + p[1] ? 1 : 2;
      batch.push(kind); c[kind]++;
    }
    runs++;
    for (let i = 0; i < 3; i++) sumCounts[i] += c[i];
    lastHit = c[0] === target[0] && c[1] === target[1] && c[2] === target[2];
    if (lastHit) hits++;
    lastBatch = batch;
  }
  function runMany(count) {
    pending += count;
    if (anim) return;
    const step = () => {
      const chunk = Math.min(pending, 8);
      for (let i = 0; i < chunk; i++) drawBatch();
      pending -= chunk;
      draw();
      if (pending > 0) anim = requestAnimationFrame(step);
      else anim = 0;
    };
    anim = requestAnimationFrame(step);
  }

  const chal = challenges(ch, [
    { text: 'Tap the cards to make all 5 tickets urgent. Notice what happens to normal and low.',
      check: st => st.k[0] === 5 && st.k[1] === 0 && st.k[2] === 0,
      why: 'When all 5 are urgent, normal and low must both drop to 0. The three counts always add up to 5.' },
    { text: 'Build a mix with exactly 5 orders (hint: 4 of one kind and 1 of another).',
      check: st => st.orders === 5,
      why: 'Yes! With 4 of one kind and 1 of another, you only pick which of the 5 slots holds the lone card: 5 orders.' },
    { text: 'Press “Start again”, then run at least 200 batches. Watch the simulated chance settle near 15.4%.',
      check: st => st.isDefault && st.runs >= 200,
      why: 'Across many batches, the real share of matches settles close to 15.4%, and the average counts settle near 1, 2 and 2.' },
    { text: 'Press “New data” for fresh random chances and a new mix, then run at least 100 batches.',
      check: st => st.isRandom && st.runs >= 100,
      why: 'It holds for any chances and any mix: orders times one order’s chance always predicts the long-run share.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 500 : 470, F = NARROW ? 1.12 : 1;
  const PAD = NARROW ? 14 : 24, BAR_W = VW - 2 * PAD;
  const CARD_Y = 32, CARD_H = NARROW ? 76 : 80;
  const BAR_Y = 168, BAR_H = 30;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  // Pointer interaction: drag chance handles OR tap a card
  let dragHandle = 0; // 1 or 2
  const toSvg = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    const x1 = PAD + (w[0] / 20) * BAR_W;
    const x2 = PAD + ((w[0] + w[1]) / 20) * BAR_W;
    if (Math.abs(pt.y - (BAR_Y + BAR_H / 2)) < 28) {
      const d1 = Math.abs(pt.x - x1), d2 = Math.abs(pt.x - x2);
      if (Math.min(d1, d2) < 28) {
        dragHandle = d1 <= d2 ? 1 : 2;
        svg.setPointerCapture(e.pointerId);
        return;
      }
    }
    if (pt.y >= CARD_Y - 6 && pt.y <= CARD_Y + CARD_H + 8) {
      const slotW = BAR_W / 5;
      const idx = Math.floor((pt.x - PAD) / slotW);
      if (idx >= 0 && idx < 5) {
        cards[idx] = (cards[idx] + 1) % 3;
        clearTally();
        draw();
      }
    }
  });
  svg.addEventListener('pointermove', e => {
    if (!dragHandle) return;
    const pt = toSvg(e);
    const pos = Math.round(((pt.x - PAD) / BAR_W) * 20);
    const split2 = w[0] + w[1];
    if (dragHandle === 1) {
      const s1 = Math.max(1, Math.min(18, pos));
      const s2 = Math.max(s1 + 1, Math.min(19, split2));
      w = [s1, s2 - s1, 20 - s2];
    } else {
      const s2 = Math.max(2, Math.min(19, pos));
      const s1 = Math.min(w[0], s2 - 1);
      w = [s1, s2 - s1, 20 - s2];
    }
    clearTally();
    draw();
  });
  svg.addEventListener('pointerup', () => { dragHandle = 0; });
  svg.addEventListener('pointercancel', () => { dragHandle = 0; });

  const pct = x => (x * 100).toFixed(1).replace(/\.0$/, '') + '%';
  const r5 = x => Number(x.toFixed(5));

  function draw() {
    const { k, p, orders, oneOrder, prob } = model();
    const els = [];

    // Band 1: 5 tappable ticket cards
    els.push(s('text', { x: PAD, y: 20, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      'TARGET MIX (TAP ANY CARD TO CHANGE ITS KIND)'));
    const slotW = BAR_W / 5, cw = Math.min(108, slotW - 10);
    cards.forEach((kind, i) => {
      const cx = PAD + slotW * (i + 0.5), col = COLS[kind];
      els.push(
        s('rect', { x: cx - cw / 2, y: CARD_Y, width: cw, height: CARD_H, rx: 10, fill: col, 'fill-opacity': 0.2, stroke: col, 'stroke-width': 2.5, style: 'cursor:pointer' }),
        s('text', { x: cx, y: CARD_Y + (NARROW ? 40 : 42), fill: col, 'font-size': (NARROW ? 26 : 28), 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', 'pointer-events': 'none' }, LET[kind]),
        s('text', { x: cx, y: CARD_Y + (NARROW ? 62 : 64), fill: C.ink, 'font-size': (NARROW ? 11 : 12), 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif', 'pointer-events': 'none' }, NAMES[kind])
      );
    });
    els.push(s('text', { x: VW / 2, y: CARD_Y + CARD_H + 22, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
      `${k[0]} urgent + ${k[1]} normal + ${k[2]} low = 5   (${orders} ${orders === 1 ? 'order' : 'orders'})`));

    // Band 2: Draggable 3-part probability bar (sums to 1)
    els.push(s('text', { x: PAD, y: BAR_Y - 10, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      'CHANCES PER TICKET (DRAG HANDLES · ALWAYS ADD TO 1)'));
    const w0 = p[0] * BAR_W, w1 = p[1] * BAR_W, w2 = p[2] * BAR_W;
    els.push(
      s('rect', { x: PAD, y: BAR_Y, width: w0, height: BAR_H, fill: URG, 'fill-opacity': 0.78, rx: 4 }),
      s('rect', { x: PAD + w0, y: BAR_Y, width: w1, height: BAR_H, fill: NOR, 'fill-opacity': 0.78 }),
      s('rect', { x: PAD + w0 + w1, y: BAR_Y, width: w2, height: BAR_H, fill: LOW, 'fill-opacity': 0.78, rx: 4 }),
      s('rect', { x: PAD, y: BAR_Y, width: BAR_W, height: BAR_H, fill: 'none', stroke: C.line, 'stroke-width': 2, rx: 5 })
    );
    [PAD + w0, PAD + w0 + w1].forEach(hx => {
      els.push(
        s('line', { x1: hx, x2: hx, y1: BAR_Y - 3, y2: BAR_Y + BAR_H + 3, stroke: C.ink, 'stroke-width': 2.5 }),
        s('circle', { cx: hx, cy: BAR_Y + BAR_H / 2, r: NARROW ? 11 : 10, fill: C.bg, stroke: C.ink, 'stroke-width': 2.5, style: 'cursor:ew-resize' })
      );
    });
    for (let i = 0; i < 3; i++) {
      const lx = PAD + (BAR_W / 6) * (2 * i + 1);
      els.push(s('text', { x: lx, y: BAR_Y + BAR_H + 20, fill: COLS[i], 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `${NAMES[i]} ${pct(p[i])}`));
    }

    // Divider
    const divY = BAR_Y + BAR_H + 34;
    els.push(s('line', { x1: PAD, x2: VW - PAD, y1: divY, y2: divY, stroke: C.line }));

    // Band 3: Left = Exact mix chance (Model vs Simulated), Right = Average counts per batch
    const midX = PAD + BAR_W * (NARROW ? 0.43 : 0.42);
    const topY = divY + 42, baseY = VH - 36, chartH = baseY - topY;

    // Left panel: Exact mix chance
    const lX0 = PAD, lX1 = midX - 14, lW = lX1 - lX0;
    const simRate = runs > 0 ? hits / runs : 0;
    const maxP = Math.min(1, Math.max(0.25, prob * 1.35, simRate * 1.25));
    els.push(
      s('text', { x: (lX0 + lX1) / 2, y: divY + 20, fill: C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'EXACT MIX CHANCE'),
      s('line', { x1: lX0, x2: lX1, y1: baseY, y2: baseY, stroke: C.line, 'stroke-width': 2 })
    );
    const bwL = Math.min(58, lW * 0.34);
    const mX = lX0 + lW * 0.28, sX = lX0 + lW * 0.72;
    const mH = Math.max(2, (prob / maxP) * chartH), sH = runs > 0 ? Math.max(2, (simRate / maxP) * chartH) : 0;
    const ym = baseY - (prob / maxP) * chartH;
    els.push(
      s('rect', { x: mX - bwL / 2, y: baseY - mH, width: bwL, height: mH, rx: 5, fill: C.amber, 'fill-opacity': 0.32, stroke: C.amber, 'stroke-width': 2 }),
      s('text', { x: mX, y: baseY - mH - 7, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, pct(prob)),
      s('text', { x: mX, y: baseY + 18, fill: C.amber, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'model')
    );
    if (runs > 0) {
      els.push(s('rect', { x: sX - bwL / 2, y: baseY - sH, width: bwL, height: sH, rx: 5, fill: C.green, 'fill-opacity': 0.75 }));
    }
    els.push(
      s('text', { x: sX, y: baseY - sH - 7, fill: runs > 0 ? C.green : C.muted, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, runs > 0 ? pct(simRate) : '—'),
      s('text', { x: sX, y: baseY + 18, fill: C.green, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'sim'),
      s('line', { x1: lX0, x2: lX1, y1: ym, y2: ym, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5' })
    );

    // Right panel: Average counts (0..5)
    const rX0 = midX + 14, rX1 = VW - PAD, rW = rX1 - rX0;
    els.push(
      s('text', { x: (rX0 + rX1) / 2, y: divY + 20, fill: C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'AVERAGE COUNTS (OUT OF 5)'),
      s('line', { x1: rX0, x2: rX1, y1: baseY, y2: baseY, stroke: C.line, 'stroke-width': 2 })
    );
    const bwR = Math.min(54, rW / 3 * 0.62);
    for (let i = 0; i < 3; i++) {
      const cx = rX0 + rW * ((i + 0.5) / 3), col = COLS[i];
      const exp = 5 * p[i], obs = runs > 0 ? sumCounts[i] / runs : 0;
      const yExp = baseY - (exp / 5) * chartH;
      const hObs = runs > 0 ? Math.max(2, (obs / 5) * chartH) : 0;
      if (runs > 0) {
        els.push(s('rect', { x: cx - bwR / 2, y: baseY - hObs, width: bwR, height: hObs, rx: 5, fill: col, 'fill-opacity': 0.72 }));
      }
      els.push(
        s('line', { x1: cx - bwR / 2 - 6, x2: cx + bwR / 2 + 6, y1: yExp, y2: yExp, stroke: C.ink, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }),
        s('text', { x: cx, y: Math.min(yExp, baseY - hObs) - 7, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          runs > 0 ? fmt(Math.round(obs * 100) / 100) : fmt(exp)),
        s('text', { x: cx, y: baseY + 18, fill: col, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `${LET[i]} (${fmt(exp)})`)
      );
    }

    svg.replaceChildren(...els);

    // Formula box
    fbox(box, [
      `counts:  ${k[0]} U + ${k[1]} N + ${k[2]} L = 5`,
      `orders:  5! ÷ (${k[0]}!·${k[1]}!·${k[2]}!) = ${orders}`,
      `1 order: ${fmt(p[0])}^${k[0]} × ${fmt(p[1])}^${k[1]} × ${fmt(p[2])}^${k[2]} = ${r5(oneOrder)}`,
      [`chance:  ${orders} × ${r5(oneOrder)} = ${pct(prob)}`, C.amber],
      [runs > 0 ? `sim:     ${hits} / ${runs} batches = ${pct(simRate)}` : 'sim:     press Draw or Run 100', runs > 0 ? C.green : C.muted]
    ]);

    note.textContent = runs > 0
      ? 'Dashed ticks show expected averages (5 × each chance). Watch the solid bars settle onto the dashed marks as you run more batches.'
      : 'Tap any card to change the target mix. Notice the three counts always add up to 5, and the three chances always add up to 1.';

    lastRow.textContent = lastBatch
      ? `Last batch: ${lastBatch.map(i => LET[i]).join(' ')}  (${lastHit ? '✓ exact match!' : 'different mix'}) · ${runs} batches run`
      : 'No batches drawn yet. Press “Draw 1 batch” or “Run 100 batches”.';

    const isDefault = k[0] === 1 && k[1] === 2 && k[2] === 2 && w[0] === 4 && w[1] === 8 && w[2] === 8;
    chal.update({ k, orders, runs, isDefault, isRandom });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

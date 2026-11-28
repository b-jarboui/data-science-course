// 6.3.3 Try it: Beta–binomial updating ("just add").
// The learner adjusts the prior Beta(a, b) and batch (failures f, passes p),
// taps charger icons to flip fail/pass, chains posteriors into new priors,
// draws random batches, and solves self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  let a = 2, b = 8, f = 3, p = 7;
  let chained = 0, randomAfterChain = 0;

  const logFact = n => { let t = 0; for (let i = 2; i <= n; i++) t += Math.log(i); return t; };
  const betaPdf = (x, aa, bb) => {
    if (x <= 0) return aa === 1 ? bb : 0;
    if (x >= 1) return bb === 1 ? aa : 0;
    const logB = logFact(aa - 1) + logFact(bb - 1) - logFact(aa + bb - 1);
    return Math.exp((aa - 1) * Math.log(x) + (bb - 1) * Math.log(1 - x) - logB);
  };
  const modeOf = (aa, bb) => {
    if (aa > 1 && bb > 1) return (aa - 1) / (aa + bb - 2);
    if (aa === 1 && bb > 1) return 0;
    if (bb === 1 && aa > 1) return 1;
    return null;
  };
  const pct = x => fmt(Math.round(x * 1000) / 10) + '%';

  const svg = s('svg', { viewBox: '0 0 700 430' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  function makeSlider(label, col, min, max, get, set) {
    const valEl = h('span', { style: { color: col, fontFamily: 'Consolas, monospace', fontWeight: 700, minWidth: '2.4ch', textAlign: 'right' } });
    const inp = h('input', {
      type: 'range', min, max, value: get(),
      style: { flex: '1 1 8rem', accentColor: col, minHeight: '36px' },
      oninput: e => { set(+e.target.value); draw(); }
    });
    const minus = btn('−', () => { set(Math.max(min, get() - 1)); draw(); }, 'ghost');
    const plus = btn('+', () => { set(Math.min(max, get() + 1)); draw(); }, 'ghost');
    minus.style.padding = '0 .65rem';
    plus.style.padding = '0 .65rem';
    const row = h('div', { class: 'sim-row', style: { marginTop: '.45rem' } },
      h('span', { style: { color: '#b2bdd9', minWidth: '9.5rem', fontSize: '.92rem' } }, label),
      minus, inp, plus, valEl);
    return {
      row,
      sync() {
        const v = get();
        if (v > +inp.max) inp.max = String(v);
        inp.value = String(v);
        valEl.textContent = String(v);
      }
    };
  }

  const slA = makeSlider('Prior failures (a)', C.cyan, 1, 50, () => a, v => { a = v; });
  const slB = makeSlider('Prior passes (b)', C.cyan, 1, 50, () => b, v => { b = v; });
  const slF = makeSlider('Batch failures (f)', C.pink, 0, 50, () => f, v => { f = v; });
  const slP = makeSlider('Batch passes (p)', C.green, 0, 50, () => p, v => { p = v; });

  function newRandomBatch() {
    const n = rnd(8, 20);
    const trueRate = rnd(10, 55) / 100;
    let nf = 0;
    for (let i = 0; i < n; i++) if (Math.random() < trueRate) nf++;
    f = nf;
    p = n - nf;
    if (chained > 0) randomAfterChain++;
    draw();
  }

  function chainNext() {
    if (f + p === 0) return;
    a = Math.min(100, a + f);
    b = Math.min(100, b + p);
    chained++;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Beta updating (just add)'),
    h('p', { class: 'sub' }, 'Change the blue prior Beta(a, b) or the batch counts, or tap any charger part below to flip fail and pass. Watch the green posterior update live.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        slA.row, slB.row, slF.row, slP.row,
        h('div', { class: 'sim-row' },
          btn('New batch (random)', newRandomBatch, 'go'),
          btn('Use posterior as next prior', chainNext),
          btn('Flat prior (1, 1)', () => { a = 1; b = 1; draw(); }),
          btn('Start again', () => { a = 2; b = 8; f = 3; p = 7; chained = 0; randomAfterChain = 0; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Keep the shop prior Beta(2, 8). Change the batch so the posterior mean reaches at least 35%.',
      check: st => st.a === 2 && st.b === 8 && st.batchN > 0 && st.postMean >= 0.35,
      why: 'Yes! Adding more failures pulls the green posterior hill and its mean to the right.'
    },
    {
      text: 'Make the prior much heavier than the batch (a + b ≥ 30, with a different batch rate) so the posterior mean stays within 4 percentage points of the prior.',
      check: st => st.a + st.b >= 30 && st.batchN >= 5 && Math.abs(st.priorMean - st.batchRate) >= 0.08 && Math.abs(st.postMean - st.priorMean) <= 0.0401,
      why: 'Right: like mixing two jugs of juice, the bigger jug pulls the mix closer to itself.'
    },
    {
      text: 'Press “Use posterior as next prior”, then press “New batch (random)” twice. Watch the green hill grow taller and narrower.',
      check: st => st.chained >= 1 && st.randomAfterChain >= 2,
      why: 'Each batch adds to the two shape numbers, so total evidence grows and you become surer.'
    },
    {
      text: 'Build a lopsided posterior hill where the mean and the peak are at least 4 percentage points apart.',
      check: st => st.postMode != null && Math.abs(st.postMean - st.postMode) >= 0.04,
      why: 'A long thin tail pulls the mean away from the peak — always say which summary you report.'
    }
  ]);

  // SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 430, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 24 : 36, X1 = VW - (NARROW ? 24 : 36), W = X1 - X0;
  const BASE = 284, TOP = 42, H = BASE - TOP;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const xOf = rate => X0 + rate * W;

  function curvePaths(aa, bb, maxY) {
    const N = 120;
    let dLine = '', dFill = `M ${xOf(0).toFixed(1)} ${BASE}`;
    for (let i = 0; i <= N; i++) {
      const r = i / N;
      const y = BASE - (betaPdf(r, aa, bb) / maxY) * H;
      const x = xOf(r);
      dLine += (i ? ' L ' : 'M ') + `${x.toFixed(1)} ${y.toFixed(1)}`;
      dFill += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    dFill += ` L ${xOf(1).toFixed(1)} ${BASE} Z`;
    return { dLine, dFill };
  }

  function draw() {
    slA.sync(); slB.sync(); slF.sync(); slP.sync();

    const pa = a + f, pb = b + p;
    const priorN = a + b, batchN = f + p, postN = pa + pb;
    const priorMean = a / priorN;
    const batchRate = batchN > 0 ? f / batchN : null;
    const postMean = pa / postN;
    const postMode = modeOf(pa, pb);

    // Common density scale so prior and posterior heights compare honestly
    let maxY = 1.2;
    for (let i = 0; i <= 100; i++) {
      const r = i / 100;
      maxY = Math.max(maxY, betaPdf(r, a, b), betaPdf(r, pa, pb));
    }
    maxY *= 1.12;

    const k = [];

    // Vertical grid lines & percent ticks
    for (let g = 0; g <= 100; g += 20) {
      const x = xOf(g / 100);
      k.push(
        s('line', { x1: x, x2: x, y1: TOP, y2: BASE, stroke: C.line, 'stroke-width': 1 }),
        s('text', { x, y: BASE + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g + '%')
      );
    }
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));

    // Prior hill (blue/cyan) and Posterior hill (green)
    const pr = curvePaths(a, b, maxY);
    const po = curvePaths(pa, pb, maxY);
    k.push(
      s('path', { d: pr.dFill, fill: C.cyan, 'fill-opacity': 0.14 }),
      s('path', { d: pr.dLine, fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }),
      s('path', { d: po.dFill, fill: C.green, 'fill-opacity': 0.20 }),
      s('path', { d: po.dLine, fill: 'none', stroke: C.green, 'stroke-width': 3 })
    );

    // Legend pills at top
    const legY = 18;
    k.push(
      s('circle', { cx: X0 + 8, cy: legY, r: 5, fill: C.cyan }),
      s('text', { x: X0 + 18, y: legY + 4, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `Prior Beta(${a},${b})`),
      s('circle', { cx: X0 + (NARROW ? 165 : 210), cy: legY, r: 5, fill: C.green }),
      s('text', { x: X0 + (NARROW ? 175 : 220), y: legY + 4, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `Post Beta(${pa},${pb})`)
    );

    // Vertical markers for prior mean, batch rate, posterior mean, and posterior peak
    const drawMarker = (rate, col, yTop, dash, rDot = 5) => {
      const x = xOf(rate);
      k.push(
        s('line', { x1: x, x2: x, y1: BASE, y2: yTop, stroke: col, 'stroke-width': 2, 'stroke-dasharray': dash }),
        s('circle', { cx: x, cy: BASE, r: rDot, fill: col })
      );
    };
    drawMarker(priorMean, C.cyan, BASE - (betaPdf(priorMean, a, b) / maxY) * H, '5 4', 4.5);
    if (batchRate != null) drawMarker(batchRate, C.amber, TOP + 24, '4 4', 4.5);
    drawMarker(postMean, C.green, BASE - (betaPdf(postMean, pa, pb) / maxY) * H, '6 4', 5.5);

    if (postMode != null) {
      const pxm = xOf(postMode), pym = BASE - (betaPdf(postMode, pa, pb) / maxY) * H;
      k.push(s('circle', { cx: pxm, cy: pym, r: 5, fill: C.violet, stroke: C.bg, 'stroke-width': 1.5 }));
    }

    // Compact comparison tag row just below ticks (y = 324)
    const tagRowY = 326;
    const tagStr = batchRate != null
      ? `Prior ${pct(priorMean)}  ·  Batch ${pct(batchRate)}  ·  Post ${pct(postMean)}`
      : `Prior ${pct(priorMean)}  ·  No batch yet  ·  Post ${pct(postMean)}`;
    k.push(s('text', { x: VW / 2, y: tagRowY, fill: C.ink, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, tagStr));

    // Interactive batch charger strip (y = 350..418)
    const stripY = 368;
    if (batchN === 0) {
      k.push(s('text', { x: VW / 2, y: stripY + 14, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'Batch is empty — raise f or p, or press “New batch (random)”.'));
    } else if (batchN <= 20) {
      const gap = Math.min(32, W / batchN);
      const cw = Math.min(24, gap * 0.78), chH = 22;
      const startX = VW / 2 - ((batchN - 1) * gap) / 2;
      k.push(s('text', { x: VW / 2, y: stripY - 14, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle' }, `Batch (${batchN} parts: ${f} fail, ${p} pass) — tap any part to flip`));
      for (let i = 0; i < batchN; i++) {
        const isFail = i < f;
        const col = isFail ? C.pink : C.green;
        const cx = startX + i * gap;
        const g = s('g', { style: 'cursor:pointer' },
          s('line', { x1: cx - cw * 0.22, x2: cx - cw * 0.22, y1: stripY + 4, y2: stripY - 1, stroke: col, 'stroke-width': 2 }),
          s('line', { x1: cx + cw * 0.22, x2: cx + cw * 0.22, y1: stripY + 4, y2: stripY - 1, stroke: col, 'stroke-width': 2 }),
          s('rect', { x: cx - cw / 2, y: stripY + 4, width: cw, height: chH, rx: 4, fill: col, 'fill-opacity': 0.28, stroke: col, 'stroke-width': 1.8 }),
          s('text', { x: cx, y: stripY + 20, fill: col, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, isFail ? '✕' : '✓')
        );
        g.addEventListener('click', () => {
          if (isFail) { f--; p++; } else { p--; f++; }
          draw();
        });
        k.push(g);
      }
    } else {
      const barY = stripY + 6, barH = 22;
      const failW = W * (f / batchN);
      k.push(
        s('text', { x: VW / 2, y: stripY - 10, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, `Large batch: ${f} failures, ${p} passes (${batchN} parts)`),
        s('rect', { x: X0, y: barY, width: failW, height: barH, rx: 4, fill: C.pink, 'fill-opacity': 0.72 }),
        s('rect', { x: X0 + failW, y: barY, width: W - failW, height: barH, rx: 4, fill: C.green, 'fill-opacity': 0.55 })
      );
    }

    svg.replaceChildren(...k);

    const modeLine = postMode != null
      ? [`post peak: ≈ ${pct(postMode)} (violet dot)`, C.violet]
      : ['post peak: flat (all rates equal)', C.muted];
    fbox(box, [
      [`prior:     Beta(${a}, ${b})   mean ${pct(priorMean)}`, C.cyan],
      [batchN > 0 ? `batch:     +${f} fail, +${p} pass (${pct(batchRate)})` : 'batch:     0 parts', C.amber],
      [`posterior: Beta(${a}+${f}, ${b}+${p}) = Beta(${pa}, ${pb})`, C.green],
      [`post mean: ${pa} ÷ ${postN} = ${pct(postMean)}`, C.green],
      modeLine
    ]);

    if (batchN === 0) {
      note.textContent = 'With no new parts yet, the posterior equals the prior.';
    } else {
      const heavier = priorN > batchN ? 'The prior jug is bigger, so the posterior stays closer to the prior.'
        : batchN > priorN ? 'The batch jug is bigger, so the posterior leans closer to the batch.'
        : 'The prior and batch have the same weight, so the posterior meets halfway between them.';
      note.textContent = `Prior (${priorN} parts) + batch (${batchN} parts) = ${postN} parts. ${heavier}`;
    }

    chal.update({ a, b, f, p, batchN, priorMean, batchRate: batchRate ?? priorMean, postMean, postMode, chained, randomAfterChain });
  }

  draw();
  return () => {};
}

// 5.1.5 Try it: Hypergeometric counts (sampling without replacement).
// Tap cards to change urgent tickets, adjust batch/draw size, simulate 100 audits at a time,
// compare with the binomial trap and a huge batch, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const ORG = '#fb923c';

  let N = 10, K = 3, n = 2, selK = 2;
  let cards = makeCards(N, K); // true = urgent (orange), false = not urgent (blue)
  let lastPicked = [];         // indices drawn in the most recent single audit
  let counts = new Array(n + 1).fill(0), trials = 0;
  let showBinom = false, huge = false;
  let randomBatch = false, ranOnThisRandom = false, randomRuns = 0;
  let anim = 0;

  function makeCards(total, urg) {
    return Array.from({ length: total }, (_, i) => i < urg);
  }

  function comb(a, b) {
    if (b < 0 || b > a) return 0;
    b = Math.min(b, a - b);
    let r = 1;
    for (let i = 1; i <= b; i++) r = r * (a - b + i) / i;
    return Math.round(r);
  }

  function logC(a, b) {
    b = Math.min(b, a - b);
    let out = 0;
    for (let i = 1; i <= b; i++) out += Math.log((a - b + i) / i);
    return out;
  }

  function hyperP(tot, urg, draw, k) {
    if (k < 0 || k > urg || k > draw || draw - k > tot - urg) return 0;
    if (tot <= 50) return comb(urg, k) * comb(tot - urg, draw - k) / comb(tot, draw);
    return Math.exp(logC(urg, k) + logC(tot - urg, draw - k) - logC(tot, draw));
  }

  function binomP(tot, urg, draw, k) {
    const p = urg / tot;
    return comb(draw, k) * Math.pow(p, k) * Math.pow(1 - p, draw - k);
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = a % b; a = b; b = t; }
    return a || 1;
  }

  function pct(p) {
    return (p * 100).toFixed(p < 0.001 && p > 0 ? 2 : 1) + '%';
  }

  const svg = s('svg', { viewBox: '0 0 700 460' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const statusLab = h('span', { class: 'sim-note', style: { margin: 0 } });
  const binomBtn = btn('Show binomial trap', () => { showBinom = !showBinom; draw(); });
  const hugeBtn = btn('Huge batch (×100)', () => { huge = !huge; resetTrials(); draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: drawing without putting back'),
    h('p', { class: 'sub' }, 'Tap any card to flip it between urgent (orange) and not urgent (blue). Tap a bar to inspect its formula, or run audits to watch the counts build up.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Batch −1', () => setN(N - 1)),
          btn('Batch +1', () => setN(N + 1)),
          btn('Draw −1', () => setDraw(n - 1)),
          btn('Draw +1', () => setDraw(n + 1)),
          statusLab),
        h('div', { class: 'sim-row' },
          btn('Draw 1 audit', () => drawOne(), 'go'),
          btn('Run 100 audits', () => runMany(100), 'go'),
          btn('New batch (random)', () => newRandom()),
          binomBtn,
          hugeBtn,
          btn('Start again', () => resetStart()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press “Run 100 audits” at least twice on the 10-ticket batch. Watch the simulated bars line up with the exact chances.',
      check: st => !st.huge && st.N === 10 && st.K === 3 && st.n === 2 && st.trials >= 200,
      why: 'Yes! With enough audits without replacement, the real counts settle right onto 7/15, 7/15, and 1/15.' },
    { text: 'Tap cards in the 10-ticket batch (draw 2) until the chance of 2 urgent tickets is exactly 1/3 (15/45).',
      check: st => !st.huge && st.N === 10 && st.n === 2 && st.K === 6,
      why: 'Right! With 6 urgent cards, C(6, 2) = 15 orange pairs out of 45, which is 15/45 = 1/3.' },
    { text: 'Press “New batch (random)” and then “Run 100 audits”, twice. Do the simulated bars still match the hypergeometric bars?',
      check: st => st.randomRuns >= 2,
      why: 'Every time! Whatever the batch size, urgent count, or draw size, counting good draws over all draws predicts the real results.' },
    { text: 'Turn on “Show binomial trap”, then press “Huge batch (×100)” to see what happens when the batch is huge.',
      check: st => st.showBinom && st.huge,
      why: 'Spot on! In a small batch of 10, not putting a card back lowers the chance from 9.0% to 6.7%. In a huge batch of 1000, one card barely changes the mix, so both answers are almost the same.' }
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 480 : 460, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function resetTrials() {
    cancelAnimationFrame(anim);
    counts = new Array(n + 1).fill(0);
    trials = 0;
    lastPicked = [];
  }

  function setN(next) {
    const clamped = Math.max(4, Math.min(18, next));
    if (clamped === N) return;
    if (clamped > N) {
      while (cards.length < clamped) cards.push(false);
    } else {
      cards.length = clamped;
    }
    N = clamped;
    K = cards.filter(Boolean).length;
    if (n > Math.min(6, N)) n = Math.min(6, N);
    if (selK > n) selK = n;
    randomBatch = false;
    resetTrials();
    draw();
  }

  function setDraw(next) {
    const clamped = Math.max(1, Math.min(Math.min(6, N), next));
    if (clamped === n) return;
    n = clamped;
    if (selK > n) selK = n;
    resetTrials();
    draw();
  }

  function toggleCard(idx) {
    if (huge) {
      K = (K + 1) % (N + 1);
      cards = makeCards(N, K);
    } else {
      cards[idx] = !cards[idx];
      K = cards.filter(Boolean).length;
    }
    randomBatch = false;
    resetTrials();
    draw();
  }

  function newRandom() {
    huge = false;
    N = rnd(6, 16);
    K = rnd(1, N - 1);
    n = rnd(2, Math.min(5, N - 1));
    selK = Math.min(K, n);
    cards = makeCards(N, K);
    // shuffle card positions for visual variety
    for (let i = cards.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      const t = cards[i]; cards[i] = cards[j]; cards[j] = t;
    }
    randomBatch = true;
    ranOnThisRandom = false;
    resetTrials();
    draw();
  }

  function resetStart() {
    N = 10; K = 3; n = 2; selK = 2;
    cards = makeCards(N, K);
    showBinom = false; huge = false;
    randomBatch = false; ranOnThisRandom = false;
    resetTrials();
    draw();
  }

  function sampleCount() {
    const effN = huge ? N * 100 : N;
    let remN = effN, remK = huge ? K * 100 : K, got = 0;
    for (let d = 0; d < n; d++) {
      if (Math.random() < remK / remN) { got++; remK--; }
      remN--;
    }
    return got;
  }

  function drawOne() {
    cancelAnimationFrame(anim);
    if (!huge) {
      const pool = Array.from({ length: N }, (_, i) => i);
      const picked = [];
      let got = 0;
      for (let d = 0; d < n; d++) {
        const j = rnd(0, pool.length - 1);
        const idx = pool.splice(j, 1)[0];
        picked.push(idx);
        if (cards[idx]) got++;
      }
      lastPicked = picked;
      counts[got]++;
      trials++;
    } else {
      lastPicked = [];
      counts[sampleCount()]++;
      trials++;
    }
    draw();
  }

  function runMany(total) {
    cancelAnimationFrame(anim);
    let left = total;
    lastPicked = [];
    const step = () => {
      const batch = Math.min(left, 10);
      for (let i = 0; i < batch; i++) {
        counts[sampleCount()]++;
        trials++;
      }
      left -= batch;
      if (left <= 0 && randomBatch && !ranOnThisRandom) {
        ranOnThisRandom = true;
        randomRuns++;
      }
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function draw() {
    const effN = huge ? N * 100 : N;
    const effK = huge ? K * 100 : K;
    binomBtn.className = 'sim-btn ' + (showBinom ? 'go' : '');
    hugeBtn.className = 'sim-btn ' + (huge ? 'go' : '');

    const el = [];
    const padX = NARROW ? 16 : 26;

    // --- TOP: BATCH OF TICKET CARDS ---
    const headTxt = huge
      ? `Huge batch: ${effN} tickets (${effK} urgent, ${effN - effK} not)`
      : `Batch: ${N} tickets (${K} urgent, ${N - K} not) · Tap a card to flip`;
    el.push(s('text', { x: padX, y: 24, fill: C.muted, 'font-size': 13.5 * F, 'font-family': 'Consolas' }, headTxt));

    if (!huge) {
      const perRow = NARROW ? (N <= 10 ? 5 : 6) : (N <= 10 ? N : Math.ceil(N / 2));
      const rows = Math.ceil(N / perRow);
      const areaW = VW - 2 * padX, areaH = 122;
      const gap = NARROW ? 7 : 8;
      const cw = Math.min(NARROW ? 62 : 56, (areaW - (perRow - 1) * gap) / perRow);
      const ch = Math.min(rows === 1 ? 82 : 54, (areaH - (rows - 1) * gap) / rows);
      const yStart = 38 + (areaH - (rows * ch + (rows - 1) * gap)) / 2;

      cards.forEach((isUrg, i) => {
        const r = Math.floor(i / perRow), c = i % perRow;
        const rowLen = r === rows - 1 ? N - r * perRow : perRow;
        const rowW = rowLen * cw + (rowLen - 1) * gap;
        const x = (VW - rowW) / 2 + c * (cw + gap);
        const y = yStart + r * (ch + gap);
        const col = isUrg ? ORG : C.cyan;
        const picked = lastPicked.includes(i);

        const g = s('g', { style: 'cursor:pointer' });
        g.addEventListener('click', () => toggleCard(i));
        g.append(
          s('rect', {
            x, y, width: cw, height: ch, rx: 7,
            fill: col, 'fill-opacity': picked ? 0.42 : 0.20,
            stroke: picked ? C.amber : col, 'stroke-width': picked ? 3 : 1.8
          }),
          s('rect', { x: x + 5, y: y + 5, width: cw - 10, height: 5, rx: 2, fill: col, 'fill-opacity': 0.9 }),
          s('text', {
            x: x + cw / 2, y: y + ch * 0.58, fill: C.ink,
            'font-size': (rows > 1 ? 13 : 15) * F, 'font-weight': 700,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, String(i + 1))
        );
        if (picked) {
          g.append(s('text', {
            x: x + cw / 2, y: y + ch - 6, fill: C.amber,
            'font-size': 10.5 * F, 'font-weight': 700,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, 'OUT'));
        }
        el.push(g);
      });
    } else {
      // Huge batch visual: 200 mini-dots representing the scaled batch (each dot = 5 tickets)
      const cols = 20, rows = 5, totalDots = cols * rows;
      const urgDots = Math.round((effK / effN) * totalDots);
      const bx0 = padX, bw = VW - 2 * padX, by0 = 40, bh = 112;
      el.push(s('rect', { x: bx0, y: by0, width: bw, height: bh, rx: 10, fill: C.bg, stroke: C.green, 'stroke-width': 1.5 }));
      const dx = (bw - 24) / cols, dy = (bh - 20) / rows;
      for (let i = 0; i < totalDots; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        const col = i < urgDots ? ORG : C.cyan;
        el.push(s('circle', {
          cx: bx0 + 12 + (c + 0.5) * dx, cy: by0 + 10 + (r + 0.5) * dy,
          r: Math.min(dx, dy) * 0.30, fill: col, 'fill-opacity': 0.85
        }));
      }
    }

    // --- MIDDLE LEGEND ---
    const legY = 182;
    let lx = padX;
    const addLeg = (col, label, dashed = false) => {
      if (dashed) {
        el.push(s('line', { x1: lx, x2: lx + 16, y1: legY - 4, y2: legY - 4, stroke: col, 'stroke-width': 3, 'stroke-dasharray': '4 3' }));
      } else {
        el.push(s('rect', { x: lx, y: legY - 10, width: 12, height: 12, rx: 3, fill: col, 'fill-opacity': 0.85 }));
      }
      el.push(s('text', { x: lx + 18, y: legY, fill: col, 'font-size': 12.5 * F, 'font-family': 'Consolas' }, label));
      lx += (label.length * 7.6 + 34) * F;
    };
    addLeg(C.cyan, 'Exact');
    if (trials > 0) addLeg(C.green, `Sim (${trials})`);
    if (showBinom) addLeg(C.pink, 'Binomial', true);

    // --- BOTTOM: PROBABILITY BAR CHART ---
    const X0 = NARROW ? 40 : 54, X1 = VW - 16, BASE = VH - 60, CTOP = 216;
    const hProbs = Array.from({ length: n + 1 }, (_, k) => hyperP(effN, effK, n, k));
    const bProbs = Array.from({ length: n + 1 }, (_, k) => binomP(effN, effK, n, k));
    const sProbs = Array.from({ length: n + 1 }, (_, k) => trials > 0 ? counts[k] / trials : 0);
    const maxP = Math.max(0.50, ...hProbs, ...(showBinom ? bProbs : [0]), ...sProbs) * 1.15;
    const yOf = p => BASE - (p / maxP) * (BASE - CTOP);

    // Grid lines
    const stepG = maxP > 0.8 ? 0.25 : 0.2;
    for (let g = 0; g <= maxP + 1e-9; g += stepG) {
      const y = yOf(g);
      if (y < CTOP - 10) continue;
      el.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${Math.round(g * 100)}%`)
      );
    }

    const slotW = (X1 - X0) / (n + 1);
    const barW = Math.min(NARROW ? 56 : 74, slotW * 0.56);

    for (let k = 0; k <= n; k++) {
      const cx = X0 + slotW * (k + 0.5);
      const hp = hProbs[k], bp = bProbs[k], sp = sProbs[k];
      const yH = yOf(hp), hH = Math.max(0, BASE - yH);
      const isSel = k === selK;
      const col = isSel ? ORG : C.cyan;

      const g = s('g', { style: 'cursor:pointer' });
      g.addEventListener('click', () => { selK = k; draw(); });

      if (isSel) {
        g.append(s('rect', {
          x: cx - slotW * 0.44, y: CTOP - 12, width: slotW * 0.88, height: BASE - CTOP + 14,
          rx: 8, fill: '#ffffff', 'fill-opacity': 0.04
        }));
      }

      // Exact hypergeometric bar
      g.append(s('rect', {
        x: cx - barW / 2, y: yH, width: barW, height: hH, rx: 4,
        fill: col, 'fill-opacity': isSel ? 0.78 : 0.58, stroke: col, 'stroke-width': isSel ? 2.2 : 1.4
      }));

      // Simulated empirical overlay bar
      if (trials > 0) {
        const yS = yOf(sp), hS = Math.max(0, BASE - yS);
        g.append(s('rect', {
          x: cx - barW * 0.24, y: yS, width: barW * 0.48, height: hS, rx: 3,
          fill: C.green, 'fill-opacity': 0.75, stroke: C.bg, 'stroke-width': 1
        }));
      }

      // Binomial trap marker
      if (showBinom) {
        const yB = yOf(bp);
        g.append(
          s('line', { x1: cx - barW * 0.62, x2: cx + barW * 0.62, y1: yB, y2: yB, stroke: C.pink, 'stroke-width': 3.2, 'stroke-dasharray': '5 3' }),
          s('circle', { cx: cx + barW * 0.62, cy: yB, r: 4, fill: C.pink })
        );
      }

      // Label above bar
      const topY = Math.min(yH, showBinom ? yOf(bp) : yH, trials > 0 ? yOf(sp) : yH) - 7;
      g.append(
        s('text', {
          x: cx, y: Math.max(CTOP - 4, topY), fill: isSel ? ORG : C.ink,
          'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, pct(hp)),
        s('text', {
          x: cx, y: BASE + 22, fill: isSel ? ORG : C.ink,
          'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, String(k))
      );
      el.push(g);
    }

    // Mean vertical dashed line
    const meanVal = n * effK / effN;
    const meanX = X0 + slotW * (meanVal + 0.5);
    el.push(
      s('line', { x1: meanX, x2: meanX, y1: CTOP - 4, y2: BASE, stroke: C.green, 'stroke-width': 2.2, 'stroke-dasharray': '6 5' }),
      s('text', { x: Math.min(X1 - 46, Math.max(X0 + 46, meanX)), y: CTOP - 10, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `mean ${fmt(meanVal)}`),
      s('text', { x: (X0 + X1) / 2, y: BASE + 44, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'urgent tickets in the audit (tap a bar to inspect)')
    );

    svg.replaceChildren(...el);

    // Formula box
    const hp = hProbs[selK], bp = bProbs[selK];
    const lines = [
      `N = ${effN}  K = ${effK}  n = ${n}  k = ${selK}`
    ];
    if (!huge && effN <= 30) {
      const good = comb(effK, selK) * comb(effN - effK, n - selK);
      const all = comb(effN, n);
      const g = gcd(good, all);
      const simp = g > 1 && good > 0 ? ` = ${good / g}/${all / g}` : '';
      lines.push(`good = C(${effK},${selK})×C(${effN - effK},${n - selK}) = ${good}`);
      lines.push(`all  = C(${effN},${n}) = ${all}`);
      lines.push([`P(k=${selK}) = ${good}/${all}${simp} (${pct(hp)})`, ORG]);
    } else {
      lines.push([`hypergeometric = ${pct(hp)}`, ORG]);
    }
    if (showBinom) {
      lines.push([`binomial trap  = ${pct(bp)}`, C.pink]);
    }
    lines.push([`mean = ${n} × ${effK}/${effN} = ${fmt(meanVal)}`, C.green]);
    fbox(box, lines);

    statusLab.textContent = `Draw ${n} of ${effN} (${effK} urgent)`;
    note.textContent = huge
      ? 'With a huge batch, removing one card barely changes the mix, so hypergeometric and binomial give almost the same answer.'
      : trials > 0
        ? `Ran ${trials} audit${trials === 1 ? '' : 's'} without replacement. Green bars show your simulated shares.`
        : 'Each draw removes a card without putting it back, so the chances shift after every pick.';

    chal.update({ N, K, n, selK, trials, showBinom, huge, randomRuns });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}

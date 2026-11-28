// 20.1.4 Try it: next-token prediction, causal masking, and iterative learning.
// Tap any position to inspect visible context, hidden future tokens, and the shifted target.
// Step or Play to train a miniature neural network live and watch the loss curve fall.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const ORANGE = '#fb923c';

  const PRESETS = {
    A: {
      name: 'Newsletter A (5)',
      tokens: ['Library', 'opens', 'at', 'nine', '<end>'],
      alts: [['closes', 'has'], ['on', 'early'], ['ten', 'noon'], ['am', 'today']]
    },
    B: {
      name: 'Newsletter B (4)',
      tokens: ['Pool', 'closed', 'today', '<end>'],
      alts: [['opens', 'is'], ['now', 'early'], ['again', 'too']]
    },
    C: {
      name: 'Newsletter C (3)',
      tokens: ['Exams', 'start', '<end>'],
      alts: [['end', 'begin'], ['soon', 'today']]
    },
    packed: {
      name: 'Packed block (12)',
      tokens: ['Library', 'opens', 'at', 'nine', '<end>', 'Pool', 'closed', 'today', '<end>', 'Exams', 'start', '<end>'],
      alts: [
        ['closes', 'has'], ['on', 'early'], ['ten', 'noon'], ['am', 'today'],
        ['Gym', 'Cafe'], ['opens', 'is'], ['now', 'early'], ['again', 'too'],
        ['Clubs', 'Classes'], ['end', 'begin'], ['soon', 'Monday']
      ]
    }
  };

  const RANDOM_BANK = [
    { tokens: ['Cafe', 'serves', 'hot', 'soup', '<end>'], alts: [['sells', 'makes'], ['fresh', 'warm'], ['tea', 'bread'], ['today', 'now']] },
    { tokens: ['Bus', 'leaves', 'at', 'eight', '<end>'], alts: [['stops', 'arrives'], ['on', 'near'], ['seven', 'nine'], ['sharp', 'daily']] },
    { tokens: ['Gym', 'closes', 'early', 'Friday', '<end>'], alts: [['opens', 'stays'], ['late', 'at'], ['today', 'soon'], ['night', 'too']] },
    { tokens: ['Art', 'club', 'meets', 'at', 'four', '<end>'], alts: [['class', 'show'], ['starts', 'opens'], ['on', 'in'], ['five', 'noon'], ['today', 'here']] },
    { tokens: ['Music', 'hall', 'opens', 'at', 'noon', '<end>'], alts: [['room', 'club'], ['closes', 'starts'], ['on', 'near'], ['nine', 'ten'], ['sharp', 'today']] },
    { tokens: ['Book', 'fair', 'starts', 'Monday', '<end>'], alts: [['club', 'sale'], ['ends', 'opens'], ['today', 'soon'], ['morning', 'early']] },
    { tokens: ['Lab', 'doors', 'lock', 'at', 'ten', '<end>'], alts: [['hours', 'rooms'], ['open', 'close'], ['near', 'by'], ['nine', 'eight'], ['sharp', 'nightly']] }
  ];

  let presetKey = 'A';
  let tokens = PRESETS.A.tokens.slice();
  let alts = PRESETS.A.alts.map(a => a.slice());
  let isRandom = false;
  let sel = 2; // start on "Library opens at -> nine" (nine / ten / noon)
  let mask = true;
  let lr = 0.6;
  let speed = 3; // steps per second
  let playing = false;
  let timer = null;
  let seed = 1;

  // Miniature 3-4-3 neural network trained with real backprop + cross-entropy loss (in bits)
  let W1, b1, W2, b2, step = 0, lossHist = [], lastStepInfo = null;

  function prng() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 4294967296) * 2 - 1;
  }

  function taskCount() { return tokens.length - 1; }
  function targetClass(p) { return p % 3; }

  // Deterministic unit-length 3D feature vector representing visible context tokens[0..p]
  function contextVec(p) {
    const M = taskCount(), c = targetClass(p);
    const a = (c * 2 * Math.PI) / 3 + 0.35;
    const x0 = Math.cos(a), x1 = Math.sin(a), x2 = M > 1 ? (p / (M - 1)) * 0.7 - 0.35 : 0;
    const norm = Math.hypot(x0, x1, x2) || 1;
    return [x0 / norm, x1 / norm, x2 / norm];
  }

  function candidatesFor(p) {
    const tc = targetClass(p), d = alts[p] || ['is', 'the'];
    const out = [null, null, null];
    out[tc] = tokens[p + 1];
    let di = 0;
    for (let c = 0; c < 3; c++) if (out[c] == null) out[c] = d[di++];
    return out;
  }

  function forward(p) {
    const x = contextVec(p);
    const hAct = [0, 0, 0, 0];
    for (let j = 0; j < 4; j++) {
      let z = b1[j];
      for (let i = 0; i < 3; i++) z += W1[i][j] * x[i];
      hAct[j] = Math.tanh(z);
    }
    const logits = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      let z = b2[c];
      for (let j = 0; j < 4; j++) z += W2[j][c] * hAct[j];
      logits[c] = z;
    }
    const mx = Math.max(...logits);
    const exps = logits.map(v => Math.exp(v - mx));
    const sum = exps[0] + exps[1] + exps[2];
    const probs = exps.map(e => e / sum);
    const tc = targetClass(p);
    const loss = -Math.log2(Math.max(1e-6, probs[tc]));
    return { x, hAct, probs, tc, loss };
  }

  function evalAll() {
    const M = taskCount();
    let total = 0;
    const outs = [];
    for (let p = 0; p < M; p++) {
      const f = forward(p);
      outs.push(f);
      total += f.loss;
    }
    return { outs, avgLoss: total / M };
  }

  function initModel(newSeed) {
    stopPlay();
    if (newSeed != null) seed = newSeed;
    else seed = 42 + tokens.length * 17;
    // Start with small mixed-sign weights so initial target chance is low (~20-30%) and high lr can overshoot
    W1 = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => 0.45 * prng()));
    b1 = [0, 0, 0, 0];
    W2 = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => 0.35 * prng()));
    b2 = [-0.25, -0.25, -0.25];
    step = 0;
    const ev = evalAll();
    lossHist = [ev.avgLoss];
    lastStepInfo = null;
  }

  function trainOneStep() {
    if (!mask) {
      step++;
      lossHist.push(0.015);
      lastStepInfo = { cheated: true, step };
      draw();
      return;
    }
    const M = taskCount();
    const before = evalAll();
    const oldSelProb = before.outs[sel].probs[before.outs[sel].tc];
    const oldLoss = before.avgLoss;

    const dW1 = Array.from({ length: 3 }, () => [0, 0, 0, 0]);
    const db1 = [0, 0, 0, 0];
    const dW2 = Array.from({ length: 4 }, () => [0, 0, 0]);
    const db2 = [0, 0, 0];

    for (let p = 0; p < M; p++) {
      const { x, hAct, probs, tc } = before.outs[p];
      const dz = probs.map((q, c) => q - (c === tc ? 1 : 0));
      for (let c = 0; c < 3; c++) {
        db2[c] += dz[c] / M;
        for (let j = 0; j < 4; j++) dW2[j][c] += (hAct[j] * dz[c]) / M;
      }
      for (let j = 0; j < 4; j++) {
        let dh = 0;
        for (let c = 0; c < 3; c++) dh += W2[j][c] * dz[c];
        const da = dh * (1 - hAct[j] * hAct[j]);
        db1[j] += da / M;
        for (let i = 0; i < 3; i++) dW1[i][j] += (x[i] * da) / M;
      }
    }

    const clamp = v => Math.max(-7, Math.min(7, v));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) W1[i][j] = clamp(W1[i][j] - lr * dW1[i][j]);
    for (let j = 0; j < 4; j++) b1[j] = clamp(b1[j] - lr * db1[j]);
    for (let j = 0; j < 4; j++) for (let c = 0; c < 3; c++) W2[j][c] = clamp(W2[j][c] - lr * dW2[j][c]);
    for (let c = 0; c < 3; c++) b2[c] = clamp(b2[c] - lr * db2[c]);

    step++;
    const after = evalAll();
    const newSelProb = after.outs[sel].probs[after.outs[sel].tc];
    lossHist.push(after.avgLoss);
    lastStepInfo = { cheated: false, step, oldSelProb, newSelProb, oldLoss, newLoss: after.avgLoss };
    draw();
  }

  function stopPlay() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (playBtn) playBtn.textContent = '▶ Play';
  }
  function startPlay() {
    stopPlay();
    playing = true;
    playBtn.textContent = '❚❚ Pause';
    timer = setInterval(() => {
      if (step >= 120) { stopPlay(); return; }
      trainOneStep();
    }, Math.round(1000 / speed));
  }
  function togglePlay() { playing ? stopPlay() : startPlay(); }

  function loadPreset(key) {
    presetKey = key; isRandom = false;
    tokens = PRESETS[key].tokens.slice();
    alts = PRESETS[key].alts.map(a => a.slice());
    sel = key === 'A' ? 2 : 0;
    initModel();
    draw();
  }

  function loadRandom() {
    const pool = RANDOM_BANK.filter(r => r.tokens.join(' ') !== tokens.join(' '));
    const pick = pool[rnd(0, pool.length - 1)];
    presetKey = 'random'; isRandom = true;
    tokens = pick.tokens.slice();
    alts = pick.alts.map(a => a.slice());
    sel = 0;
    initModel(Date.now() & 0xffff);
    draw();
  }

  // UI skeleton
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 560 : 500, F = NARROW ? 1.06 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const stepPill = pill('STEP 0', C.amber);
  const maskBtn = btn('Causal mask: ON', () => { mask = !mask; draw(); });
  const playBtn = btn('▶ Play', togglePlay, 'go');
  const lrVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const lrSlider = h('input', {
    type: 'range', min: '0.1', max: '4.5', step: '0.1', value: String(lr),
    oninput: e => { lr = +e.target.value; draw(); }
  });
  const spdVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const spdSlider = h('input', {
    type: 'range', min: '1', max: '10', step: '1', value: String(speed),
    oninput: e => { speed = +e.target.value; if (playing) startPlay(); draw(); }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: next-token prediction'),
    h('p', { class: 'sub' }, 'Tap any token position to see its shifted target and masked future words. Press Step or Play to train the neural network and watch its loss fall.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step (+1)', trainOneStep, 'go'),
          playBtn,
          btn('Reset', () => { initModel(); draw(); }),
          maskBtn,
          stepPill),
        h('div', { class: 'sim-row' },
          h('label', { class: 'sim-note', style: { margin: 0 } }, 'Learning rate '), lrSlider, lrVal,
          h('label', { class: 'sim-note', style: { margin: 0, marginLeft: '.4rem' } }, 'Speed '), spdSlider, spdVal),
        h('div', { class: 'sim-row' },
          btn('Newsletter A (5)', () => loadPreset('A')),
          btn('Newsletter B (4)', () => loadPreset('B')),
          btn('Newsletter C (3)', () => loadPreset('C')),
          btn('Packed block (12)', () => loadPreset('packed')),
          btn('New text (random)', loadRandom))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Press "Packed block (12)" and check the formula box. How many prediction tasks do 12 tokens give?',
      check: st => st.presetKey === 'packed' && st.tasks === 11,
      why: 'Right! Shifting 12 tokens by one leaves 12 − 1 = 11 input-target pairs.'
    },
    {
      text: 'Keep Causal mask ON and press Step or Play until the average loss drops below 0.5 bits.',
      check: st => st.mask && st.step >= 2 && st.loss < 0.5,
      why: 'Nice! Each step compares every prediction with its target and updates the weights, so loss falls.'
    },
    {
      text: 'Turn Causal mask OFF to see what happens when the network can peek at the future token.',
      check: st => !st.mask,
      why: 'Without causal masking, the network copies the future answer (99%) instead of learning from past words.'
    },
    {
      text: 'Turn Causal mask back ON, press "New text (random)", and train for at least 5 steps.',
      check: st => st.mask && st.isRandom && st.step >= 5 && st.loss < st.initLoss - 0.25,
      why: 'Always! Any ordinary text gives tokens − 1 self-made targets, and the model learns from all of them.'
    }
  ]);

  // Tap/click on token cards to pick active position
  let cardHits = [];
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    for (const hBox of cardHits) {
      if (p.x >= hBox.x && p.x <= hBox.x + hBox.w && p.y >= hBox.y && p.y <= hBox.y + hBox.h) {
        sel = hBox.pos;
        draw();
        return;
      }
    }
  });

  function draw() {
    const M = taskCount(), n = tokens.length;
    const ev = evalAll();
    const cur = ev.outs[sel];
    const cands = candidatesFor(sel);
    const activeProbs = mask ? cur.probs : cands.map((_, c) => c === cur.tc ? 0.99 : 0.005);
    const activeLoss = mask ? ev.avgLoss : 0.015;
    const k = [];
    cardHits = [];

    // --- BAND 1: Shifted Inputs & Targets token cards ---
    k.push(
      s('text', { x: 14, y: 20, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'INPUTS (tap a position)'),
      s('text', { x: VW - 14, y: 20, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `${n} tokens → ${M} tasks`)
    );

    // Show all tokens if n <= 6 (or <= 7 on laptop), otherwise show a clean 6-card window around sel + mini selector
    const maxVis = NARROW ? 5 : 6;
    let startIdx = 0, visCount = n;
    let stripOffY = 0;
    if (n > maxVis) {
      visCount = maxVis;
      startIdx = Math.max(0, Math.min(n - visCount, sel - 1));
      stripOffY = 22;
      // Compact 11-task quick selector strip
      const bw = (VW - 28) / M;
      for (let p = 0; p < M; p++) {
        const bx = 14 + p * bw;
        const on = p === sel;
        k.push(
          s('rect', { x: bx + 1.5, y: 27, width: bw - 3, height: 18, rx: 5, fill: on ? C.amber : '#151e38', stroke: on ? C.amber : C.line }),
          s('text', { x: bx + bw / 2, y: 40, fill: on ? '#0b1020' : C.muted, 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, String(p + 1))
        );
        cardHits.push({ x: bx, y: 25, w: bw, h: 22, pos: p });
      }
    }

    const padX = 14, gap = 6;
    const cw = (VW - padX * 2 - gap * (visCount - 1)) / visCount;
    const topY = 30 + stripOffY, botY = 90 + stripOffY, chH = 34;

    for (let j = 0; j < visCount; j++) {
      const idx = startIdx + j;
      const x = padX + j * (cw + gap);
      const tok = tokens[idx];
      const isFuture = idx > sel;
      const isEnd = tok === '<end>';
      const isActive = idx === sel;
      const fillCol = isFuture ? (mask ? '#120d1f' : '#261024') : (isActive ? '#142942' : '#0f1630');
      const strokeCol = isFuture ? C.pink : (isActive ? C.amber : (isEnd ? ORANGE : C.cyan));
      const textCol = isFuture ? C.pink : (isEnd ? ORANGE : C.cyan);

      // Upper row: Input token
      k.push(
        s('rect', { x, y: topY, width: cw, height: chH, rx: 7, fill: fillCol, stroke: strokeCol, 'stroke-width': isActive ? 2.5 : 1.5, 'stroke-dasharray': isFuture && mask ? '4 3' : null }),
        s('text', { x: x + cw / 2, y: topY + 21, fill: textCol, 'font-size': Math.min(14, cw / 5.4) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          isFuture && mask ? '✕ hidden' : tok)
      );
      if (idx < M) cardHits.push({ x, y: topY, w: cw, h: botY - topY + chH, pos: idx });

      // Lower row: Shifted target (for idx < M)
      if (idx < M) {
        const tgt = tokens[idx + 1], tEnd = tgt === '<end>';
        const tCol = isActive ? (tEnd ? ORANGE : C.green) : C.muted;
        k.push(
          s('rect', { x, y: botY, width: cw, height: chH, rx: 7, fill: isActive ? '#0f2622' : '#0b1020', stroke: tCol, 'stroke-width': isActive ? 2.5 : 1.2 }),
          s('text', { x: x + cw / 2, y: botY + 21, fill: tCol, 'font-size': Math.min(14, cw / 5.4) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, tgt)
        );
        if (isActive) {
          const cx = x + cw / 2;
          k.push(
            s('line', { x1: cx, y1: topY + chH + 2, x2: cx, y2: botY - 4, stroke: C.amber, 'stroke-width': 2.5 }),
            s('polygon', { points: `${cx},${botY - 1} ${cx - 5},${botY - 9} ${cx + 5},${botY - 9}`, fill: C.amber })
          );
        }
      } else {
        k.push(s('text', { x: x + cw / 2, y: botY + 21, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '(no target)'));
      }
    }

    // If causal mask is OFF and sel+1 is visible in the window, draw a pink "PEEK!" arc
    if (!mask && sel + 1 >= startIdx && sel + 1 < startIdx + visCount) {
      const fx = padX + (sel + 1 - startIdx) * (cw + gap) + cw / 2;
      const tx = padX + (sel - startIdx) * (cw + gap) + cw / 2;
      k.push(
        s('path', { d: `M ${fx} ${topY + chH} Q ${(fx + tx) / 2} ${botY - 6} ${tx + 12} ${botY}`, fill: 'none', stroke: C.pink, 'stroke-width': 2.4, 'stroke-dasharray': '5 4' }),
        s('text', { x: (fx + tx) / 2, y: topY + chH + 16, fill: C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'PEEK!')
      );
    }

    k.push(s('text', { x: 14, y: botY + chH + 15, fill: C.green, 'font-size': 11 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'TARGETS (shifted left by 1)'));

    // --- BAND 2: Miniature 3-4-3 Neural Network + Next-Token Chance Bars ---
    const netTop = botY + chH + 28;
    const netH = NARROW ? 142 : 148;
    const netX0 = 32, netX1 = NARROW ? VW * 0.45 : VW * 0.48;
    const layers = [3, 4, 3];
    const lxs = [netX0, (netX0 + netX1) / 2, netX1];
    const nodePos = (l, i) => {
      const cnt = layers[l], sp = netH / 3.4;
      const cy = netTop + netH / 2 + (i - (cnt - 1) / 2) * sp;
      return [lxs[l], cy];
    };
    const rNode = NARROW ? 13 : 15;

    // Weight lines
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      const a = nodePos(0, i), b = nodePos(1, j), w = W1[i][j], mag = Math.min(1, Math.abs(w) / 2);
      k.push(s('line', { x1: a[0] + rNode, y1: a[1], x2: b[0] - rNode, y2: b[1], stroke: w < 0 ? C.pink : C.cyan, 'stroke-width': 1 + 3.2 * mag, 'stroke-opacity': 0.28 + 0.65 * mag }));
    }
    for (let j = 0; j < 4; j++) for (let c = 0; c < 3; c++) {
      const a = nodePos(1, j), b = nodePos(2, c), w = W2[j][c], mag = Math.min(1, Math.abs(w) / 2);
      k.push(s('line', { x1: a[0] + rNode, y1: a[1], x2: b[0] - rNode, y2: b[1], stroke: w < 0 ? C.pink : C.cyan, 'stroke-width': 1 + 3.2 * mag, 'stroke-opacity': 0.28 + 0.65 * mag }));
    }

    // Neurons with live values inside
    const valsByL = [
      cur.x.map(v => v.toFixed(1)),
      cur.hAct.map(v => v.toFixed(1)),
      activeProbs.map(p => `${Math.round(p * 100)}`)
    ];
    for (let l = 0; l < 3; l++) {
      const col = l === 0 ? C.violet : (l === 1 ? C.cyan : C.amber);
      for (let i = 0; i < layers[l]; i++) {
        const [nx, ny] = nodePos(l, i);
        k.push(
          s('circle', { cx: nx, cy: ny, r: rNode, fill: C.card, stroke: col, 'stroke-width': 2 }),
          s('text', { x: nx, y: ny + 4, fill: C.ink, 'font-size': NARROW ? 9 : 10, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, valsByL[l][i])
        );
      }
    }
    k.push(s('text', { x: (netX0 + netX1) / 2, y: netTop + netH + 12, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'neural network (weights update live)'));

    // Next-token chance bars (right of network)
    const barX0 = NARROW ? VW * 0.54 : VW * 0.56;
    const barMaxW = VW - barX0 - 46;
    k.push(s('text', { x: barX0, y: netTop + 4, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      mask ? 'NEXT-TOKEN CHANCES' : 'COPIED ANSWER (MASK OFF)'));
    cands.forEach((word, c) => {
      const by = nodePos(2, c)[1] - 11;
      const pct = Math.round(activeProbs[c] * 100);
      const isTgt = c === cur.tc;
      const col = !mask && isTgt ? C.pink : (isTgt ? (word === '<end>' ? ORANGE : C.green) : C.muted);
      const wFill = Math.max(4, barMaxW * activeProbs[c]);
      k.push(
        s('text', { x: barX0, y: by - 2, fill: col, 'font-size': 11.5 * F, 'font-weight': isTgt ? 700 : 400, 'font-family': 'Consolas' },
          isTgt ? `${word} ★` : word),
        s('rect', { x: barX0, y: by + 3, width: barMaxW, height: 14, rx: 4, fill: '#0b1020', stroke: C.line }),
        s('rect', { x: barX0, y: by + 4, width: wFill, height: 12, rx: 3.5, fill: col, 'fill-opacity': 0.85 }),
        s('text', { x: barX0 + barMaxW + 6, y: by + 14, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${pct}%`)
      );
    });

    // --- BAND 3: Loss-versus-iteration curve ---
    const chTop = netTop + netH + 28, chBot = VH - 28;
    const chX0 = 46, chX1 = VW - 16, chW = chX1 - chX0, chHgt = chBot - chTop;
    const maxLoss = Math.max(2.6, ...lossHist);
    const maxStep = Math.max(15, lossHist.length - 1);
    k.push(
      s('rect', { x: chX0, y: chTop, width: chW, height: chHgt, rx: 6, fill: '#080d1a', stroke: C.line }),
      s('text', { x: chX0 + 8, y: chTop + 15, fill: C.muted, 'font-size': 11 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'LOSS vs STEP (bits — lower is better)'),
      s('text', { x: chX1 - 8, y: chTop + 15, fill: mask ? C.amber : C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `now: ${fmt(Math.round(activeLoss * 100) / 100)} bits`)
    );
    [0, 1, 2].forEach(v => {
      const y = chBot - (v / maxLoss) * (chHgt - 22);
      k.push(
        s('line', { x1: chX0, x2: chX1, y1: y, y2: y, stroke: C.line, 'stroke-dasharray': '3 4' }),
        s('text', { x: chX0 - 6, y: y + 4, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, String(v))
      );
    });
    const pts = lossHist.map((lv, idx) => {
      const px = chX0 + (idx / maxStep) * chW;
      const py = chBot - (Math.min(maxLoss, lv) / maxLoss) * (chHgt - 22);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    });
    if (pts.length > 1) {
      k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: mask ? C.amber : C.pink, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
    }
    const lastPt = pts[pts.length - 1].split(',');
    k.push(
      s('circle', { cx: +lastPt[0], cy: +lastPt[1], r: 4.5, fill: mask ? C.amber : C.pink }),
      s('text', { x: chX0, y: VH - 8, fill: C.muted, 'font-size': 10.5 * F, 'font-family': 'Consolas' }, 'step 0'),
      s('text', { x: chX1, y: VH - 8, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `step ${maxStep}`)
    );

    svg.replaceChildren(...k);

    // Update controls & formula box
    stepPill.textContent = `STEP ${step}`;
    maskBtn.textContent = mask ? 'Causal mask: ON' : 'Causal mask: OFF (peeking!)';
    maskBtn.style.borderColor = mask ? C.cyan : C.pink;
    maskBtn.style.color = mask ? C.ink : C.pink;
    lrVal.textContent = fmt(lr);
    spdVal.textContent = `${speed}/s`;

    const seen = tokens.slice(0, sel + 1).join(' ');
    const target = tokens[sel + 1];
    const lines = [
      `tasks  = ${n} − 1 = ${M} pairs`,
      [`pos ${sel + 1}  : "${seen}" → ${target}`, C.cyan]
    ];
    if (!mask) {
      lines.push(['mask   : OFF (peeking at future!)', C.pink]);
      lines.push(['chance : 99% (copied, not learned)', C.pink]);
    } else if (lastStepInfo && !lastStepInfo.cheated) {
      lines.push([`step ${lastStepInfo.step} : ${Math.round(lastStepInfo.oldSelProb * 100)}% → ${Math.round(lastStepInfo.newSelProb * 100)}% for ${target}`, C.green]);
      lines.push([`loss   : ${lastStepInfo.oldLoss.toFixed(2)} → ${lastStepInfo.newLoss.toFixed(2)} bits`, C.amber]);
    } else {
      lines.push([`chance : ${Math.round(activeProbs[cur.tc] * 100)}% for ${target}`, C.green]);
      lines.push([`loss   : ${activeLoss.toFixed(2)} bits  (lr = ${fmt(lr)})`, C.amber]);
    }
    fbox(box, lines);

    note.textContent = !mask
      ? 'Causal mask is OFF: the network sees the future token and copies it instead of learning from past words.'
      : lr >= 3.2
        ? 'High learning rate: watch the weights overshoot and the loss curve bounce instead of settling smoothly.'
        : 'Each training step runs all input-target pairs in parallel, hiding future tokens from every position.';

    chal.update({ presetKey, tasks: M, mask, step, loss: activeLoss, initLoss: lossHist[0], isRandom, lr });
  }

  initModel();
  draw();
  return () => stopPlay();
}

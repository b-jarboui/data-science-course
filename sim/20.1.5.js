// 20.1.5 Try it: Masked language modeling (learning from words on both sides).
// Interactive 12-token packed block, clickable masks, live neural network,
// probability bars, step-by-step gradient training, loss curve, and challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const BLOCKS = [
    {
      name: 'Campus newsletters (lesson block)',
      tokens: ['Library', 'opens', 'at', 'nine', '<end>', 'Pool', 'closed', 'today', '<end>', 'Exams', 'start', '<end>'],
      focus: 6,
      meta: {
        6: { cands: ['closed', 'opens', 'is', 'other'], pLeft: [0.20, 0.40, 0.30, 0.10], pBoth: [0.80, 0.15, 0.001, 0.049] },
        3: { cands: ['nine', 'ten', 'noon', 'other'], pLeft: [0.42, 0.26, 0.22, 0.10], pBoth: [0.50, 0.25, 0.20, 0.05] }
      }
    },
    {
      name: 'Random campus block A',
      tokens: ['Gym', 'opens', 'at', 'eight', '<end>', 'Lab', 'closed', 'today', '<end>', 'Clubs', 'meet', '<end>'],
      focus: 6,
      meta: {
        6: { cands: ['closed', 'opens', 'busy', 'other'], pLeft: [0.22, 0.38, 0.28, 0.12], pBoth: [0.82, 0.12, 0.02, 0.04] }
      }
    },
    {
      name: 'Random campus block B',
      tokens: ['Cafe', 'serves', 'hot', 'soup', '<end>', 'Pool', 'opens', 'early', '<end>', 'Bus', 'runs', '<end>'],
      focus: 6,
      meta: {
        6: { cands: ['opens', 'closed', 'is', 'other'], pLeft: [0.32, 0.34, 0.22, 0.12], pBoth: [0.78, 0.14, 0.03, 0.05] }
      }
    },
    {
      name: 'Random campus block C',
      tokens: ['Shop', 'closes', 'at', 'six', '<end>', 'Park', 'closed', 'today', '<end>', 'Games', 'begin', '<end>'],
      focus: 6,
      meta: {
        6: { cands: ['closed', 'opens', 'quiet', 'other'], pLeft: [0.20, 0.40, 0.28, 0.12], pBoth: [0.80, 0.14, 0.02, 0.04] }
      }
    },
    {
      name: 'Random campus block D',
      tokens: ['Hall', 'hosts', 'jazz', 'tonight', '<end>', 'Pool', 'closed', 'Monday', '<end>', 'Art', 'shows', '<end>'],
      focus: 6,
      meta: {
        6: { cands: ['closed', 'opens', 'is', 'other'], pLeft: [0.22, 0.38, 0.28, 0.12], pBoth: [0.79, 0.15, 0.02, 0.04] }
      }
    }
  ];

  const GENERIC_ALTS = ['opens', 'is', 'closed', 'early', 'today', 'at', 'nine', 'runs'];

  let blockIdx = 0;
  let share = 15; // percent
  let lr = 0.20;
  let speed = 3; // steps per second
  let mode = 'both'; // 'both' | 'left'
  let masked = new Set([3, 6]);
  let focus = 6;
  let w = [0, 0, 0, 0]; // logits for the 4 candidate outputs
  let step = 0;
  let history = [];
  let lastStep = null;
  let timer = null;

  // Challenge tracking
  let leftSteps = 0, bothSteps = 0, bounces = 0, usedRandom = false, randomSteps = 0;

  const block = () => BLOCKS[blockIdx];
  const validIndices = () => block().tokens.map((t, i) => (t === '<end>' ? -1 : i)).filter(i => i >= 0);

  function getTokenSpec(idx) {
    const b = block();
    if (b.meta[idx]) return b.meta[idx];
    const tok = b.tokens[idx];
    const alts = GENERIC_ALTS.filter(x => x !== tok).slice(0, 2);
    return {
      cands: [tok, alts[0], alts[1], 'other'],
      pLeft: [0.24, 0.36, 0.26, 0.14],
      pBoth: [0.80, 0.12, 0.03, 0.05]
    };
  }

  function contextFlags() {
    const toks = block().tokens;
    const hasLeft = focus > 0 && toks[focus - 1] !== '<end>' && !masked.has(focus - 1);
    const hasRight = mode === 'both' && focus < toks.length - 1 && toks[focus + 1] !== '<end>' && !masked.has(focus + 1);
    const leftWord = focus > 0 && toks[focus - 1] !== '<end>' ? toks[focus - 1] : '—';
    const rightWord = focus < toks.length - 1 && toks[focus + 1] !== '<end>' ? toks[focus + 1] : '—';
    return { hasLeft, hasRight, leftWord, rightWord };
  }

  function targetDist() {
    const spec = getTokenSpec(focus);
    const { hasLeft, hasRight } = contextFlags();
    if (hasLeft && hasRight) return spec.pBoth;
    if (hasLeft) return spec.pLeft;
    if (hasRight) return [0.62, 0.20, 0.10, 0.08];
    return [0.25, 0.25, 0.25, 0.25];
  }

  function softmax(z) {
    const mx = Math.max(...z);
    const ex = z.map(v => Math.exp(v - mx));
    const sm = ex.reduce((a, b) => a + b, 0);
    return ex.map(v => v / sm);
  }

  function crossEntropy(pStar, p) {
    let sum = 0;
    for (let k = 0; k < pStar.length; k++) {
      if (pStar[k] > 1e-6) sum -= pStar[k] * Math.log2(Math.max(1e-6, p[k]));
    }
    return sum;
  }

  function applyMaskShare() {
    const k = Math.max(1, Math.min(validIndices().length - 1, Math.round(12 * share / 100)));
    const pool = validIndices();
    const keep = block().focus;
    const picked = new Set([keep]);
    const preferred = [3, 1, 9, 10, 0, 2, 5, 7].filter(i => pool.includes(i) && i !== keep && i !== keep - 1 && i !== keep + 1);
    const fallback = pool.filter(i => !picked.has(i) && !preferred.includes(i));
    for (const idx of [...preferred, ...fallback]) {
      if (picked.size >= k) break;
      picked.add(idx);
    }
    masked = picked;
    focus = keep;
  }

  function resetModel(keepBlock = true) {
    stopPlay();
    if (!keepBlock) blockIdx = 0;
    w = [0, 0, 0, 0];
    step = 0;
    lastStep = null;
    const p0 = softmax(w);
    history = [{ step: 0, loss: crossEntropy(targetDist(), p0), mode }];
    draw();
  }

  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
    playBtn.className = 'sim-btn';
  }

  function togglePlay() {
    if (timer) { stopPlay(); return; }
    playBtn.textContent = 'Pause';
    playBtn.className = 'sim-btn go';
    timer = setInterval(doStep, Math.round(1000 / speed));
  }

  function doStep() {
    const pStar = targetDist();
    const pOld = softmax(w);
    const oldLoss = crossEntropy(pStar, pOld);
    const scale = 8 * lr;
    w = w.map((wk, k) => Math.max(-12, Math.min(12, wk - scale * (pOld[k] - pStar[k]))));
    const pNew = softmax(w);
    const newLoss = crossEntropy(pStar, pNew);
    step++;
    history.push({ step, loss: newLoss, mode });
    if (history.length > 60) history = history.slice(-60);

    if (mode === 'left') leftSteps++;
    else bothSteps++;
    if (usedRandom && mode === 'both') randomSteps++;
    if (newLoss > oldLoss + 0.03) bounces++;

    lastStep = {
      targetName: getTokenSpec(focus).cands[0],
      oldPct: Math.round(pOld[0] * 100),
      newPct: Math.round(pNew[0] * 100),
      oldLoss,
      newLoss,
      deltaLoss: newLoss - oldLoss
    };
    draw();
  }

  function toggleMask(i) {
    const toks = block().tokens;
    if (toks[i] === '<end>') return;
    if (masked.has(i)) {
      if (masked.size > 1) {
        masked.delete(i);
        if (focus === i) focus = [...masked][0];
      }
    } else {
      masked.add(i);
      focus = i;
    }
    draw();
  }

  // --- Build DOM ---
  const svg = s('svg', { viewBox: '0 0 700 540' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const playBtn = btn('Play', togglePlay);
  const bothBtn = btn('Both sides', () => { mode = 'both'; draw(); }, 'go');
  const leftBtn = btn('Left only', () => { mode = 'left'; draw(); });

  const shareVal = h('span', { style: { color: C.amber, fontFamily: 'Consolas, monospace', fontWeight: 700 } }, '15%');
  const shareInput = h('input', {
    type: 'range', min: 10, max: 50, step: 5, value: share,
    oninput: e => { share = +e.target.value; shareVal.textContent = `${share}%`; applyMaskShare(); draw(); }
  });

  const lrVal = h('span', { style: { color: C.cyan, fontFamily: 'Consolas, monospace', fontWeight: 700 } }, '0.20');
  const lrInput = h('input', {
    type: 'range', min: 0.05, max: 1.60, step: 0.05, value: lr,
    oninput: e => { lr = +e.target.value; lrVal.textContent = lr.toFixed(2); draw(); }
  });

  const speedVal = h('span', { style: { color: C.muted, fontFamily: 'Consolas, monospace', fontWeight: 700 } }, '3/s');
  const speedInput = h('input', {
    type: 'range', min: 1, max: 10, step: 1, value: speed,
    oninput: e => {
      speed = +e.target.value;
      speedVal.textContent = `${speed}/s`;
      if (timer) { clearInterval(timer); timer = setInterval(doStep, Math.round(1000 / speed)); }
    }
  });

  const knob = (label, input, valEl) => h('label', {
    style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem', fontSize: '.9rem', color: '#b2bdd9' }
  }, label, input, valEl);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: masked language modeling'),
    h('p', { class: 'sub' }, 'Tap any word card to cover or uncover it. Switch between Left only and Both sides, then step the network to see how training updates the chances and lowers the loss.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', doStep, 'go'),
          playBtn,
          btn('Reset', () => resetModel(true)),
          btn('New data (random)', () => {
            stopPlay();
            let next = blockIdx;
            while (next === blockIdx) next = rnd(1, BLOCKS.length - 1);
            blockIdx = next;
            usedRandom = true;
            randomSteps = 0;
            applyMaskShare();
            resetModel(true);
          })
        ),
        h('div', { class: 'sim-row' },
          bothBtn,
          leftBtn,
          knob('Mask share', shareInput, shareVal)
        ),
        h('div', { class: 'sim-row' },
          knob('Learning rate', lrInput, lrVal),
          knob('Speed', speedInput, speedVal)
        )
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  const chal = challenges(ch, [
    {
      text: 'Switch to “Left only” and press Step 3 times, then switch to “Both sides” and press Step 3 times. Watch how “closed” changes.',
      check: st => st.leftSteps >= 3 && st.bothSteps >= 3,
      why: 'Yes! With only “Pool”, the model prefers “opens” (40%). Adding “today” on the right pushes “closed” up toward 80%.'
    },
    {
      text: 'Set Mask share to 15% (2 targets) with “Both sides” and train until the loss drops below 1.0 bit.',
      check: st => st.share === 15 && st.mode === 'both' && st.loss < 1.0 && st.step >= 2,
      why: 'Right: 15% of 12 tokens gives about 2 targets, and using words on both sides brings the loss below 1 bit.'
    },
    {
      text: 'Make learning unstable: raise the learning rate above 1.0 and run steps until the loss jumps upward twice.',
      check: st => st.lr > 1.0 && st.bounces >= 2,
      why: 'Too large a learning rate overshoots the best weights, so the loss curve bounces up instead of settling smoothly.'
    },
    {
      text: 'Press “New data (random)”, set learning rate to 0.25 or lower, and train with “Both sides” for at least 5 steps.',
      check: st => st.usedRandom && st.lr <= 0.25 && st.mode === 'both' && st.randomSteps >= 5 && st.loss < 1.15,
      why: 'It holds on fresh newsletters too: seeing clues on both sides helps the network predict the hidden token.'
    }
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700;
  const VH = NARROW ? 660 : 540;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function draw() {
    bothBtn.className = 'sim-btn' + (mode === 'both' ? ' go' : '');
    leftBtn.className = 'sim-btn' + (mode === 'left' ? ' go' : '');

    const b = block();
    const toks = b.tokens;
    const spec = getTokenSpec(focus);
    const { hasLeft, hasRight, leftWord, rightWord } = contextFlags();
    const p = softmax(w);
    const pStar = targetDist();
    const loss = crossEntropy(pStar, p);
    const k = [];

    // 1) Packed 12-token block (clickable cards)
    const cols = NARROW ? 4 : 6;
    const padX = NARROW ? 10 : 14;
    const gapX = NARROW ? 6 : 8;
    const cardW = (VW - 2 * padX - (cols - 1) * gapX) / cols;
    const cardH = 34;
    const topY = 24;

    k.push(s('text', {
      x: padX, y: 15, fill: C.muted, 'font-size': 12, 'font-family': 'Consolas', 'font-weight': 700
    }, `${b.name.toUpperCase()}  ·  STEP ${step}  ·  ${masked.size} MASKED`));

    toks.forEach((tok, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = padX + c * (cardW + gapX);
      const y = topY + r * (cardH + 8);
      const isEnd = tok === '<end>';
      const isMask = masked.has(i);
      const isFocus = i === focus;
      const stroke = isFocus ? C.green : isMask ? C.amber : isEnd ? C.amber : C.cyan;
      const fill = isMask ? '#2c2210' : C.bg;

      const g = s('g', { style: isEnd ? '' : 'cursor:pointer' },
        s('rect', {
          x, y, width: cardW, height: cardH, rx: 7,
          fill, stroke, 'stroke-width': isFocus ? 2.6 : 1.5,
          'stroke-dasharray': isMask ? '5 3' : null
        }),
        s('text', {
          x: x + cardW / 2, y: y + 21,
          fill: isMask ? C.amber : isEnd ? C.amber : C.ink,
          'font-size': isMask ? 12 : 13, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, isMask ? (isFocus ? '[ ? ] ★' : '[ MASK ]') : tok)
      );
      if (!isEnd) g.addEventListener('click', () => toggleMask(i));
      k.push(g);
    });

    // 2) Neural network diagram (circles in layers, colored weights, live numbers)
    const netTop = NARROW ? 156 : 122;
    const netH = NARROW ? 164 : 210;
    const netX0 = NARROW ? 74 : 84;
    const netX2 = NARROW ? VW - 88 : 318;
    const netX1 = (netX0 + netX2) / 2;
    const nr = NARROW ? 15 : 16;

    const inY = [netTop + netH * 0.30, netTop + netH * 0.72];
    const hidY = [netTop + netH * 0.18, netTop + netH * 0.50, netTop + netH * 0.82];
    const outY = [0, 1, 2, 3].map(j => netTop + netH * (0.14 + j * 0.24));

    const xIn = [hasLeft ? 1 : 0, hasRight ? 1 : 0];
    const w01 = [[0.7, -0.4, 0.5], [0.6, 0.8, -0.5]];
    const hVal = [0, 1, 2].map(j => Math.tanh(xIn[0] * w01[0][j] + xIn[1] * w01[1][j]));

    // Section title
    k.push(s('text', {
      x: padX, y: netTop - 6, fill: C.cyan, 'font-size': 12, 'font-family': 'Consolas', 'font-weight': 700
    }, `NEURAL NETWORK (${mode === 'both' ? 'BOTH SIDES' : 'LEFT ONLY'})`));

    // Input -> Hidden lines
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        const active = xIn[i] > 0;
        const wt = w01[i][j];
        k.push(s('line', {
          x1: netX0 + nr, y1: inY[i], x2: netX1 - nr, y2: hidY[j],
          stroke: active ? (wt < 0 ? C.pink : C.cyan) : C.line,
          'stroke-width': active ? 1.5 + 2.5 * Math.abs(wt) : 1.2,
          'stroke-opacity': active ? 0.75 : 0.35
        }));
      }
    }
    // Hidden -> Output lines (styled by live learned weights w[j])
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const wt = (w[j] / 3) * (i === 0 ? 1 : i === 1 ? 0.8 : -0.5);
        const mag = Math.min(1, Math.abs(wt) + 0.15);
        k.push(s('line', {
          x1: netX1 + nr, y1: hidY[i], x2: netX2 - nr, y2: outY[j],
          stroke: wt < 0 ? C.pink : C.cyan,
          'stroke-width': 1.2 + 3.2 * mag,
          'stroke-opacity': 0.3 + 0.55 * mag
        }));
      }
    }

    // Input nodes + labels
    const inLabels = [leftWord, rightWord];
    for (let i = 0; i < 2; i++) {
      const on = xIn[i] > 0;
      k.push(
        s('text', {
          x: netX0 - nr - 8, y: inY[i] + 4,
          fill: on ? (i === 1 ? C.green : C.cyan) : C.muted,
          'font-size': 12, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas'
        }, inLabels[i]),
        s('circle', {
          cx: netX0, cy: inY[i], r: nr,
          fill: C.card, stroke: on ? (i === 1 ? C.green : C.violet) : C.line, 'stroke-width': 2.5
        }),
        s('text', {
          x: netX0, y: inY[i] + 4, fill: on ? C.ink : C.muted,
          'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, on ? '1' : '0')
      );
    }

    // Hidden nodes
    for (let j = 0; j < 3; j++) {
      k.push(
        s('circle', { cx: netX1, cy: hidY[j], r: nr, fill: C.card, stroke: C.cyan, 'stroke-width': 2.2 }),
        s('text', {
          x: netX1, y: hidY[j] + 4, fill: C.ink,
          'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, hVal[j].toFixed(1))
      );
    }

    // Output nodes
    for (let j = 0; j < 4; j++) {
      const pct = Math.round(p[j] * 100);
      const col = j === 0 ? C.green : C.amber;
      k.push(
        s('circle', { cx: netX2, cy: outY[j], r: nr, fill: C.card, stroke: col, 'stroke-width': j === 0 ? 2.6 : 2 }),
        s('text', {
          x: netX2, y: outY[j] + 4, fill: col,
          'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `${pct}`),
        s('text', {
          x: netX2 + nr + 7, y: outY[j] + 4, fill: j === 0 ? C.green : C.muted,
          'font-size': 12, 'font-weight': j === 0 ? 700 : 400, 'font-family': 'Consolas'
        }, spec.cands[j])
      );
    }

    // 3) Candidate probability bars
    const barLeft = NARROW ? 78 : 458;
    const barMaxW = NARROW ? VW - 146 : 178;
    const barTop = NARROW ? 348 : 138;
    const barGap = NARROW ? 28 : 44;
    const barH = NARROW ? 18 : 22;

    k.push(s('text', {
      x: NARROW ? padX : 396, y: barTop - 16, fill: C.amber,
      'font-size': 12, 'font-family': 'Consolas', 'font-weight': 700
    }, `PREDICTION FOR [ ? ] (TARGET: "${spec.cands[0]}")`));

    spec.cands.forEach((word, j) => {
      const y = barTop + j * barGap;
      const pct = Math.round(p[j] * 100);
      const bw = Math.max(3, p[j] * barMaxW);
      const col = j === 0 ? C.green : j === 1 ? C.amber : j === 2 ? C.cyan : C.muted;
      k.push(
        s('text', {
          x: barLeft - 8, y: y + barH * 0.72, fill: j === 0 ? C.green : C.ink,
          'font-size': 13, 'font-weight': j === 0 ? 700 : 400,
          'text-anchor': 'end', 'font-family': 'Consolas'
        }, word),
        s('rect', { x: barLeft, y, width: barMaxW, height: barH, rx: 4, fill: C.bg, stroke: C.line }),
        s('rect', { x: barLeft, y, width: bw, height: barH, rx: 4, fill: col, 'fill-opacity': 0.85 }),
        s('text', {
          x: barLeft + barMaxW + 8, y: y + barH * 0.72, fill: col,
          'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas'
        }, `${pct}%`)
      );
    });

    // 4) Loss-versus-iteration curve
    const cX0 = NARROW ? 46 : 56;
    const cX1 = VW - 18;
    const cY0 = NARROW ? 500 : 374;
    const cY1 = VH - 28;
    const maxLoss = Math.max(2.6, ...history.map(pt => pt.loss + 0.2));
    const maxStep = Math.max(12, history[history.length - 1]?.step || 12);
    const sx = st => cX0 + (st / maxStep) * (cX1 - cX0);
    const sy = lv => cY1 - (Math.min(maxLoss, lv) / maxLoss) * (cY1 - cY0);

    k.push(
      s('text', { x: cX0, y: cY0 - 10, fill: C.cyan, 'font-size': 12, 'font-family': 'Consolas', 'font-weight': 700 },
        `LOSS VS. ITERATION (CURRENT: ${loss.toFixed(2)} BITS)`),
      s('rect', { x: cX0, y: cY0, width: cX1 - cX0, height: cY1 - cY0, rx: 6, fill: C.bg, stroke: C.line })
    );

    [0, 1, 2].forEach(g => {
      if (g > maxLoss) return;
      const y = sy(g);
      k.push(
        s('line', {
          x1: cX0, x2: cX1, y1: y, y2: y,
          stroke: g === 1 ? C.green : C.line,
          'stroke-dasharray': g === 1 ? '6 5' : null,
          'stroke-opacity': g === 1 ? 0.55 : 0.7
        }),
        s('text', {
          x: cX0 - 6, y: y + 4, fill: g === 1 ? C.green : C.muted,
          'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas'
        }, `${g}`)
      );
    });

    if (history.length > 1) {
      const pts = history.map(pt => `${sx(pt.step).toFixed(1)},${sy(pt.loss).toFixed(1)}`).join(' ');
      k.push(s('polyline', { points: pts, fill: 'none', stroke: C.cyan, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
    }
    const lastPt = history[history.length - 1];
    if (lastPt) {
      k.push(s('circle', {
        cx: sx(lastPt.step), cy: sy(lastPt.loss), r: 4.5,
        fill: lastStep && lastStep.deltaLoss > 0.03 ? C.pink : C.amber
      }));
    }
    k.push(s('text', {
      x: (cX0 + cX1) / 2, y: VH - 8, fill: C.muted,
      'font-size': 11, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, `Iteration (step 0 to ${maxStep})`));

    svg.replaceChildren(...k);

    // Formula box
    const exactMask = 12 * share / 100;
    const fLines = [
      `selected = 12 × ${share}% = ${fmt(Math.round(exactMask * 10) / 10)} → ${masked.size} targets`,
      [`next-token targets on same block = 11`, C.muted],
      `step ${step} | ${mode === 'both' ? 'both sides' : 'left only'} | lr = ${lr.toFixed(2)}`
    ];
    if (lastStep) {
      const diffPct = lastStep.newPct - lastStep.oldPct;
      const signPct = diffPct >= 0 ? '+' : '';
      const signLoss = lastStep.deltaLoss >= 0 ? '+' : '';
      fLines.push([
        `${lastStep.targetName}: ${lastStep.oldPct}% → ${lastStep.newPct}% (${signPct}${diffPct}%)`,
        diffPct >= 0 ? C.green : C.pink
      ]);
      fLines.push([
        `loss: ${lastStep.oldLoss.toFixed(2)} → ${lastStep.newLoss.toFixed(2)} (${signLoss}${lastStep.deltaLoss.toFixed(2)} bits)`,
        lastStep.deltaLoss > 0.03 ? C.pink : C.amber
      ]);
    } else {
      fLines.push([`${spec.cands[0]} chance: ${Math.round(p[0] * 100)}%   loss: ${loss.toFixed(2)} bits`, C.amber]);
    }
    fbox(box, fLines);

    // Plain-English note
    if (lastStep && lastStep.deltaLoss > 0.03) {
      note.textContent = 'The loss jumped up! The learning rate is too big, so each update overshoots the best weights.';
    } else if (mode === 'left') {
      note.textContent = `Left only sees "${leftWord}" without "${rightWord}". Without the right-side clue, the loss cannot fall as low.`;
    } else if (!hasRight) {
      note.textContent = `The word on the right ("${rightWord}") is also masked or at a boundary, so only left context is reaching the network.`;
    } else {
      note.textContent = `Both "${leftWord}" and "${rightWord}" send signals into the network to predict "${spec.cands[0]}".`;
    }

    chal.update({
      leftSteps, bothSteps, share, mode, loss, step, lr, bounces, usedRandom, randomSteps
    });
  }

  applyMaskShare();
  resetModel(true);
  return () => stopPlay();
}

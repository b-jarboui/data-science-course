// 20.1.12 Try it: Mixture of experts & iterative load balancing.
// Drag router score bars for token "nine", switch active experts k (1..4), and run
// iterative load-balancing steps on an 8-token batch with live loss curve & knobs.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Exact lesson starting numbers: softmax(BASE_NINE) = [15%, 60%, 20%, 5%], outputs = [2, 4, 8, 6].
  // 8-token batch starts with first choices [1, 6, 1, 0] (E2=6, E4=0, fair share=2).
  const INIT_BATCH = [
    [0.405465, 1.791759, 0.693147, -0.693147], // 0: "nine"   -> E2
    [1.60, 0.70, 0.20, 0.10],                  // 1: "Library"-> E1
    [0.75, 1.35, 0.10, 0.20],                  // 2: "opens"  -> E2 (2nd E1)
    [0.20, 1.70, 0.40, 0.10],                  // 3: "at"     -> E2 (strong E2)
    [0.15, 1.25, 0.85, 0.25],                  // 4: "Pool"   -> E2 (2nd E3)
    [0.10, 1.25, 0.25, 0.70],                  // 5: "closed" -> E2 (2nd E4)
    [0.05, 1.10, 0.20, 0.75],                  // 6: "today"  -> E2 (2nd E4)
    [0.20, 0.65, 1.55, 0.15]                   // 7: "Exams"  -> E3
  ];
  const INIT_OUT = [2, 4, 8, 6];
  const EXP_W = [
    [[0.8, -0.4], [-0.6, 0.7], [0.5, -0.8]],
    [[-0.7, 0.9], [0.8, 0.5], [0.9, 0.6]],
    [[0.6, 0.5], [-0.8, 0.9], [-0.5, 0.9]],
    [[-0.9, -0.3], [0.4, -0.7], [0.6, -0.5]]
  ];

  let batch = INIT_BATCH.map(r => r.slice());
  let outputs = INIT_OUT.slice();
  let bias = [0, 0, 0, 0];
  let k = 2, alpha = 0.5, lr = 0.3, speed = 3;
  let step = 0, lossHist = [], bounced = false, lastStep = null;
  let playing = false, timer = null;
  const seenK = new Set([2]);

  const softmax = arr => {
    const m = Math.max(...arr), ex = arr.map(x => Math.exp(x - m));
    const sum = ex.reduce((a, b) => a + b, 0);
    return ex.map(x => x / sum);
  };
  const argmax = arr => {
    let best = 0;
    for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
    return best;
  };
  const batchCounts = () => {
    const c = [0, 0, 0, 0];
    for (let t = 0; t < batch.length; t++) {
      const z = batch[t].map((v, e) => v + bias[e]);
      c[argmax(z)]++;
    }
    return c;
  };
  const balLoss = counts => counts.reduce((acc, c) => acc + (c - 2) * (c - 2), 0) / 4;

  lossHist = [balLoss(batchCounts())];

  const svg = s('svg', { viewBox: '0 0 700 490' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const kBtns = [1, 2, 3, 4].map(n => btn(`k = ${n}`, () => { k = n; seenK.add(n); draw(); }, n === k ? 'go' : ''));
  const alphaVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const alphaIn = h('input', {
    type: 'range', min: '0', max: '2', step: '0.1', value: String(alpha),
    oninput: e => { alpha = +e.target.value; draw(); }
  });
  const lrVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const lrIn = h('input', {
    type: 'range', min: '0.1', max: '3.0', step: '0.1', value: String(lr),
    oninput: e => { lr = +e.target.value; draw(); }
  });
  const spdVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const spdIn = h('input', {
    type: 'range', min: '1', max: '8', step: '1', value: String(speed),
    oninput: e => { speed = +e.target.value; if (playing) { stopPlay(); startPlay(); } draw(); }
  });

  const playBtn = btn('Play', () => (playing ? stopPlay() : startPlay()));
  const stepBtn = btn('Step', () => doStep(), 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: mixture of experts & load balancing'),
    h('p', { class: 'sub' }, 'Drag any percentage bar to change the router’s score for “nine”, pick how many experts run (k), and press Step or Play to watch load balancing train the router on 8 tokens.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Active experts:'),
          ...kBtns),
        h('div', { class: 'sim-row' },
          stepBtn, playBtn,
          btn('New data (random)', () => newData()),
          btn('Reset', () => reset())),
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.4rem' } }, 'Balance cost', alphaIn, alphaVal),
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.4rem' } }, 'Learning rate', lrIn, lrVal),
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.4rem' } }, 'Speed', spdIn, spdVal))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Switch active experts to k = 1 and then to k = 4. Watch active work change from 25% to 100%.',
      check: st => st.seenK.has(1) && st.seenK.has(4),
      why: 'Yes! Running 1 of 4 experts uses 25% of the work, all 4 uses 100%, and top-2 uses 50%.'
    },
    {
      text: 'With k = 2, drag E3’s percentage bar above E2’s. Watch the combined output move closer to 8.',
      check: st => st.k === 2 && st.probs[2] > st.probs[1] && st.combined > 6,
      why: 'Right: giving Expert 3 a bigger share pulls the weighted sum toward Expert 3’s answer (8).'
    },
    {
      text: 'Keep balance cost above 0 and press Step or Play until all 4 experts share the 8 tokens evenly (2 each).',
      check: st => st.step > 0 && st.counts.every(c => c === 2),
      why: 'Balanced! Each step nudges the router away from overloaded experts until every expert gets 2 tokens.'
    },
    {
      text: 'Press Reset, then break load balancing over 6+ steps: set balance cost to 0 (stuck) OR learning rate to 2.5+ (bounces).',
      check: st => st.step >= 6 && ((st.alpha === 0 && st.loss > 0.5) || (st.lr >= 2.5 && st.bounced)),
      why: 'Exactly: with zero balance cost the overload never shrinks, and with a huge learning rate the router overshoots and bounces.'
    }
  ]);

  function stopPlay() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function startPlay() {
    stopPlay();
    playing = true;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      doStep();
      if (step >= 40) stopPlay();
    }, Math.round(1000 / speed));
  }
  function doStep() {
    const oldCounts = batchCounts();
    const oldLoss = balLoss(oldCounts);
    const oldB1 = bias[1];
    const scale = 1.6 * lr * alpha;
    const err = oldCounts.map(c => (c - 2) / 4);
    const delta = err.map(e => -scale * e);
    bias = bias.map((b, i) => b + delta[i]);
    step++;
    const newCounts = batchCounts();
    const newLoss = balLoss(newCounts);
    if (newLoss > oldLoss + 1e-6) bounced = true;
    lossHist.push(newLoss);
    lastStep = { step, oldCounts, newCounts, oldLoss, newLoss, oldB1, newB1: bias[1], dB1: delta[1] };
    draw();
  }
  function newData() {
    stopPlay();
    const hot = rnd(0, 3);
    batch = Array.from({ length: 8 }, (_, t) => {
      const row = [0, 1, 2, 3].map(() => (rnd(-8, 12)) / 10);
      if (t < 5) row[hot] += 0.9 + rnd(1, 5) / 10;
      return row;
    });
    outputs = [0, 1, 2, 3].map(() => rnd(1, 10));
    bias = [0, 0, 0, 0];
    step = 0; bounced = false; lastStep = null;
    lossHist = [balLoss(batchCounts())];
    draw();
  }
  function reset() {
    stopPlay();
    batch = INIT_BATCH.map(r => r.slice());
    outputs = INIT_OUT.slice();
    bias = [0, 0, 0, 0];
    k = 2; alpha = 0.5; lr = 0.3; speed = 3;
    alphaIn.value = String(alpha);
    lrIn.value = String(lr);
    spdIn.value = String(speed);
    step = 0; bounced = false; lastStep = null;
    lossHist = [balLoss(batchCounts())];
    draw();
  }

  // Responsive layout metrics
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 660 : 490;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const ROW_Y = [52, 112, 172, 232];
  const BAR_X0 = NARROW ? 74 : 182;
  const BAR_W = NARROW ? 118 : 144;

  // Drag any of the 4 percentage bars left/right to change token "nine"'s router score.
  let dragIdx = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.x < BAR_X0 - 12 || p.x > BAR_X0 + BAR_W + 12 || p.y < 24 || p.y > 260) return;
    let best = 0, bestD = 999;
    ROW_Y.forEach((y, i) => { const d = Math.abs(p.y - y); if (d < bestD) { bestD = d; best = i; } });
    if (bestD > 28) return;
    dragIdx = best;
    svg.setPointerCapture(e.pointerId);
    onDrag(e);
  });
  const onDrag = e => {
    if (dragIdx < 0) return;
    const p = toSvg(e);
    const frac = Math.max(0, Math.min(1, (p.x - BAR_X0) / BAR_W));
    const targetLogit = -2.2 + frac * 5.6;
    batch[0][dragIdx] = targetLogit - bias[dragIdx];
    draw();
  };
  svg.addEventListener('pointermove', onDrag);
  svg.addEventListener('pointerup', () => { dragIdx = -1; });

  function draw() {
    kBtns.forEach((b, i) => { b.className = 'sim-btn ' + (i + 1 === k ? 'go' : ''); });
    alphaVal.textContent = fmt(alpha);
    lrVal.textContent = fmt(lr);
    spdVal.textContent = speed + '/s';

    // Token "nine" routing
    const logitsNine = batch[0].map((v, i) => v + bias[i]);
    const probs = softmax(logitsNine);
    const order = [0, 1, 2, 3].sort((a, b) => probs[b] - probs[a]);
    const active = new Set(order.slice(0, k));
    const activeSum = [...active].reduce((acc, i) => acc + probs[i], 0);
    const shares = probs.map((p, i) => active.has(i) ? p / activeSum : 0);
    const combined = shares.reduce((acc, sh, i) => acc + sh * outputs[i], 0);

    const counts = batchCounts();
    const loss = balLoss(counts);

    const el = [];
    const expCols = [C.cyan, C.amber, C.cyan, C.violet];

    // Section title
    el.push(s('text', {
      x: NARROW ? 12 : 16, y: 18, fill: C.muted, 'font-size': NARROW ? 11.5 : 12.5,
      'font-family': 'Consolas, monospace'
    }, 'TOKEN "nine" → ROUTER (drag bars) → 4 EXPERTS → COMBINED'));

    // Token card (desktop only; on narrow, label above router)
    const rX0 = NARROW ? 20 : 100, rX1 = NARROW ? 56 : 152;
    if (!NARROW) {
      el.push(
        s('rect', { x: 14, y: 120, width: 64, height: 44, rx: 10, fill: C.bg, stroke: C.amber, 'stroke-width': 2 }),
        s('text', { x: 46, y: 147, fill: C.amber, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'nine'),
        s('line', { x1: 78, y1: 142, x2: rX0 - 10, y2: 142, stroke: C.amber, 'stroke-width': 2 })
      );
    }

    // Router neural network: 2 input circles -> 4 output circles
    const rInY = [108, 176];
    rInY.forEach(y0 => ROW_Y.forEach((y1, j) => {
      const on = active.has(j);
      el.push(s('line', {
        x1: rX0, y1: y0, x2: rX1, y2: y1,
        stroke: on ? C.amber : C.muted, 'stroke-width': on ? 2.2 : 1.2, 'stroke-opacity': on ? 0.8 : 0.25
      }));
    }));
    rInY.forEach(y0 => el.push(s('circle', { cx: rX0, cy: y0, r: 7, fill: C.card, stroke: C.violet, 'stroke-width': 2 })));
    ROW_Y.forEach((y1, j) => el.push(s('circle', {
      cx: rX1, cy: y1, r: 7, fill: C.card, stroke: active.has(j) ? C.amber : C.muted, 'stroke-width': 2
    })));
    el.push(s('text', {
      x: (rX0 + rX1) / 2, y: 262, fill: C.amber, 'font-size': 11.5, 'font-weight': 700,
      'text-anchor': 'middle', 'font-family': 'Consolas'
    }, 'ROUTER'));

    // Draggable percentage bars & 4 expert neural networks
    const exX0 = NARROW ? 204 : 352;
    const exW = NARROW ? 116 : 190;
    const combX = NARROW ? 364 : 646, combY = 142;

    ROW_Y.forEach((cy, i) => {
      const on = active.has(i);
      const col = on ? (i === order[0] ? C.amber : C.cyan) : C.muted;
      const pct = Math.round(probs[i] * 100);
      const shPct = Math.round(shares[i] * 100);

      // Connection router -> bar -> expert
      el.push(s('line', {
        x1: rX1 + 7, y1: cy, x2: BAR_X0, y2: cy,
        stroke: col, 'stroke-width': on ? 2.5 : 1.2, 'stroke-opacity': on ? 0.9 : 0.25
      }));
      el.push(s('line', {
        x1: BAR_X0 + BAR_W, y1: cy, x2: exX0, y2: cy,
        stroke: col, 'stroke-width': on ? 2.5 : 1.2, 'stroke-opacity': on ? 0.9 : 0.25
      }));

      // Interactive percentage bar
      el.push(s('rect', {
        x: BAR_X0, y: cy - 16, width: BAR_W, height: 32, rx: 7,
        fill: C.bg, stroke: on ? col : C.line, 'stroke-width': on ? 2 : 1.2, style: 'cursor:ew-resize'
      }));
      el.push(s('rect', {
        x: BAR_X0 + 2, y: cy - 14, width: Math.max(4, (BAR_W - 4) * probs[i]), height: 28, rx: 5,
        fill: col, 'fill-opacity': on ? 0.35 : 0.14, style: 'pointer-events:none'
      }));
      const label = on ? `E${i + 1} ${pct}% → ${shPct}%` : `E${i + 1} ${pct}% (off)`;
      el.push(s('text', {
        x: BAR_X0 + BAR_W / 2, y: cy + 5, fill: on ? C.ink : C.muted,
        'font-size': NARROW ? 11.5 : 13, 'font-weight': 700, 'text-anchor': 'middle',
        'font-family': 'Consolas', style: 'pointer-events:none'
      }, label));

      // Expert neural network frame (2 -> 2 -> 1 circles + weight lines)
      el.push(s('rect', {
        x: exX0, y: cy - 23, width: exW, height: 46, rx: 9,
        fill: C.bg, 'fill-opacity': on ? 0.85 : 0.35,
        stroke: on ? col : C.line, 'stroke-width': on ? 2 : 1, 'stroke-opacity': on ? 1 : 0.45
      }));
      const nx = [exX0 + 18, exX0 + exW * 0.48, exX0 + exW - 22];
      const ny0 = [cy - 11, cy + 11];
      const pat = EXP_W[i];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const w = pat[a][b];
        el.push(s('line', {
          x1: nx[0], y1: ny0[a], x2: nx[1], y2: ny0[b],
          stroke: w < 0 ? C.pink : C.cyan,
          'stroke-width': on ? 1.2 + Math.abs(w) * 1.8 : 1,
          'stroke-opacity': on ? 0.85 : 0.15
        }));
      }
      for (let a = 0; a < 2; a++) {
        const w = pat[2][a];
        el.push(s('line', {
          x1: nx[1], y1: ny0[a], x2: nx[2], y2: cy,
          stroke: w < 0 ? C.pink : C.cyan,
          'stroke-width': on ? 1.2 + Math.abs(w) * 1.8 : 1,
          'stroke-opacity': on ? 0.85 : 0.15
        }));
      }
      ny0.forEach(y => el.push(s('circle', {
        cx: nx[0], cy: y, r: 5.5, fill: C.card, stroke: on ? C.violet : C.muted,
        'stroke-width': 1.8, 'stroke-opacity': on ? 1 : 0.3
      })));
      ny0.forEach(y => el.push(s('circle', {
        cx: nx[1], cy: y, r: 5.5, fill: C.card, stroke: on ? expCols[i] : C.muted,
        'stroke-width': 1.8, 'stroke-opacity': on ? 1 : 0.3
      })));
      el.push(s('circle', {
        cx: nx[2], cy: cy, r: 12, fill: C.card, stroke: on ? col : C.muted,
        'stroke-width': on ? 2.2 : 1.2, 'stroke-opacity': on ? 1 : 0.3
      }));
      el.push(s('text', {
        x: nx[2], y: cy + 4.5, fill: on ? col : C.muted, 'font-size': 12.5, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas', 'fill-opacity': on ? 1 : 0.35
      }, outputs[i]));

      // Line from active expert to combined output
      if (on) {
        const contrib = shares[i] * outputs[i];
        el.push(s('line', {
          x1: exX0 + exW, y1: cy, x2: combX - 24, y2: combY,
          stroke: col, 'stroke-width': 2.5, 'stroke-opacity': 0.9
        }));
        const mx = (exX0 + exW + combX - 24) / 2, my = (cy + combY) / 2 - 5;
        if (!NARROW) {
          el.push(s('text', {
            x: mx, y: my, fill: col, 'font-size': 12, 'font-weight': 700,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, fmt(Math.round(contrib * 100) / 100)));
        }
      }
    });

    // Combined output circle
    el.push(
      s('circle', { cx: combX, cy: combY, r: 24, fill: C.bg, stroke: C.green, 'stroke-width': 3 }),
      s('text', {
        x: combX, y: combY + 6, fill: C.green, 'font-size': 16, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, fmt(Math.round(combined * 100) / 100)),
      s('text', {
        x: combX, y: combY + 40, fill: C.green, 'font-size': 11, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, 'OUTPUT')
    );

    // Divider line between MoE routing and Load Balancing panels
    el.push(s('line', { x1: 12, y1: 278, x2: VW - 12, y2: 278, stroke: C.line, 'stroke-width': 1.5 }));

    // Panel A: 8-token load bars
    const lbX0 = NARROW ? 34 : 26, lbW = NARROW ? 340 : 306;
    const lbTop = 314, lbBot = 448;
    const lbSlot = lbW / 4;
    const fairY = lbBot - (2 / 8) * (lbBot - lbTop);

    el.push(s('text', {
      x: lbX0, y: 298, fill: C.ink, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas'
    }, `8-TOKEN LOAD (STEP ${step})`));
    el.push(s('line', { x1: lbX0, y1: lbBot, x2: lbX0 + lbW, y2: lbBot, stroke: C.muted, 'stroke-width': 1.5 }));
    el.push(s('line', {
      x1: lbX0, y1: fairY, x2: lbX0 + lbW, y2: fairY,
      stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5'
    }));
    el.push(s('text', {
      x: lbX0 + lbW, y: fairY - 5, fill: C.amber, 'font-size': 11, 'font-weight': 700,
      'text-anchor': 'end', 'font-family': 'Consolas'
    }, 'fair = 2'));

    counts.forEach((cnt, i) => {
      const cx = lbX0 + lbSlot * (i + 0.5);
      const bh = (cnt / 8) * (lbBot - lbTop);
      const bw = lbSlot * 0.54;
      const col = cnt === 2 ? C.green : (cnt > 2 || cnt === 0 ? C.pink : C.cyan);
      if (cnt > 0) {
        el.push(s('rect', {
          x: cx - bw / 2, y: lbBot - bh, width: bw, height: bh, rx: 5,
          fill: col, 'fill-opacity': 0.8
        }));
      } else {
        el.push(s('rect', {
          x: cx - bw / 2, y: fairY, width: bw, height: lbBot - fairY, rx: 5,
          fill: 'none', stroke: C.pink, 'stroke-width': 1.6, 'stroke-dasharray': '4 4'
        }));
      }
      el.push(s('text', {
        x: cx, y: lbBot - bh - 6, fill: col, 'font-size': 13, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, cnt));
      el.push(s('text', {
        x: cx, y: lbBot + 18, fill: C.muted, 'font-size': 12.5, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, 'E' + (i + 1)));
    });

    // Panel B: Balance loss vs. iteration curve
    const lcX0 = NARROW ? 46 : 386, lcX1 = NARROW ? 378 : 680;
    const lcTop = NARROW ? 514 : 314, lcBot = NARROW ? 626 : 448;
    const maxStep = Math.max(10, lossHist.length - 1);
    const maxLoss = Math.max(6, ...lossHist);
    const lx = i => lcX0 + (i / maxStep) * (lcX1 - lcX0);
    const ly = v => lcBot - (v / maxLoss) * (lcBot - lcTop);

    el.push(s('text', {
      x: lcX0, y: lcTop - 16, fill: C.ink, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas'
    }, `BALANCE LOSS: ${fmt(Math.round(loss * 100) / 100)}`));

    [0, 3, 6].forEach(g => {
      const y = ly(g);
      el.push(
        s('line', { x1: lcX0, y1: y, x2: lcX1, y2: y, stroke: C.line }),
        s('text', { x: lcX0 - 6, y: y + 4, fill: C.muted, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    });
    el.push(
      s('line', { x1: lcX0, y1: lcTop, x2: lcX0, y2: lcBot, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: lcX0, y1: lcBot, x2: lcX1, y2: lcBot, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: (lcX0 + lcX1) / 2, y: lcBot + 18, fill: C.muted, 'font-size': 11.5, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'iteration (step)')
    );

    if (lossHist.length > 1) {
      const pts = lossHist.map((v, i) => `${lx(i).toFixed(1)},${ly(v).toFixed(1)}`).join(' ');
      el.push(s('polyline', { fill: 'none', stroke: bounced ? C.pink : C.cyan, 'stroke-width': 2.8, points: pts }));
    }
    const lastIdx = lossHist.length - 1;
    el.push(s('circle', {
      cx: lx(lastIdx), cy: ly(lossHist[lastIdx]), r: 4.5,
      fill: loss === 0 ? C.green : (bounced ? C.pink : C.amber)
    }));

    svg.replaceChildren(...el);

    // Formula box: live routing math + current iteration step numbers
    const activeList = order.slice(0, k);
    const terms = activeList.map(i => `${fmt(Math.round(shares[i] * 100))}%×${outputs[i]}`).join(' + ');
    const lines = [
      [`selected (k=${k}): ${activeList.map(i => 'E' + (i + 1)).join(', ')}`, C.amber],
      `output = ${terms}`,
      [`       = ${fmt(Math.round(combined * 100) / 100)}`, C.green],
      `work   = ${k} of 4 experts (${k * 25}%)`,
      '────────────────────────'
    ];
    if (lastStep) {
      const sgn = lastStep.dB1 >= 0 ? '+' : '';
      lines.push(
        [`step ${lastStep.step}: counts ${lastStep.oldCounts.join(',')} → ${lastStep.newCounts.join(',')}`, C.cyan],
        `E2 bias: ${fmt(Math.round(lastStep.oldB1 * 100) / 100)} (${sgn}${fmt(Math.round(lastStep.dB1 * 100) / 100)}) → ${fmt(Math.round(lastStep.newB1 * 100) / 100)}`,
        [`balance loss: ${fmt(Math.round(lastStep.oldLoss * 100) / 100)} → ${fmt(Math.round(lastStep.newLoss * 100) / 100)}`, lastStep.newLoss === 0 ? C.green : (lastStep.newLoss > lastStep.oldLoss ? C.pink : C.amber)]
      );
    } else {
      lines.push(
        `step 0: counts ${counts.join(', ')}`,
        [`balance loss = ${fmt(Math.round(loss * 100) / 100)} (fair = 2 each)`, loss === 0 ? C.green : C.pink]
      );
    }
    fbox(box, lines);

    // Plain-English live explanation
    if (alpha === 0 && step > 0 && loss > 0) {
      note.textContent = 'Balance cost is 0, so the router ignores overload and the loss stays flat.';
    } else if (bounced && lr >= 2.0) {
      note.textContent = 'Learning rate is too large: each update jumps past the fair share and bounces.';
    } else if (loss === 0) {
      note.textContent = 'Balanced! Every expert gets its fair share of 2 tokens from the 8-token batch.';
    } else {
      note.textContent = 'Top-k shares are rescaled to 100% and combined. Press Step or Play to watch load balancing even out the 8 tokens.';
    }

    chal.update({ k, seenK, probs, combined, step, counts, loss, alpha, lr, bounced });
  }

  draw();
  return () => stopPlay();
}

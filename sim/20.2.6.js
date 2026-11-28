// 20.2.6 Try it: RLHF policy updates and reward hacking.
// Step through RLHF iterations one by one or press Play, adjust reply rewards and learning rate,
// watch the average reward curve grow, and see reward hacking appear (and how fixing rewards stops it).
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BLUE = '#7aa7ff', ORANGE = '#fb923c';
  const COLS = [C.cyan, BLUE, C.pink, ORANGE];
  const LETTERS = ['A', 'B', 'C', 'D'];
  const LABELS = ['At six.', 'Correct, long', 'At nine.', 'At six! ×3'];
  const DEF_P = [0.40, 0.40, 0.15, 0.05];
  const DEF_R = [2.0, 0.5, -1.5, 3.0];

  const softmax = z => {
    const m = Math.max(...z);
    const ex = z.map(v => Math.exp(Math.max(-60, Math.min(60, v - m))));
    const sum = ex.reduce((a, b) => a + b, 0);
    return ex.map(x => x / sum);
  };
  const probsToLogits = p => {
    const z = p.map(v => Math.log(Math.max(1e-5, v)));
    const avgZ = z.reduce((a, b) => a + b, 0) / z.length;
    return z.map(v => v - avgZ);
  };
  const avgReward = (p, r) => p.reduce((a, v, i) => a + v * r[i], 0);
  const fmtPct = p => {
    const v = p * 100;
    return v < 10 && v >= 0.05 ? v.toFixed(1) + '%' : Math.round(v) + '%';
  };
  const sgn = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2);

  let startP = DEF_P.slice();
  let r = DEF_R.slice();
  let logits = probsToLogits(startP);
  let p = softmax(logits);
  let step = 0, lr = 1.0, speed = 8, sel = 3;
  let playing = false, timer = null, manualSteps = 0, usedRandom = false;
  let lastInfo = null;
  let history = [{ step: 0, avg: avgReward(p, r), leadD: p[3] > p[0] }];

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const lrVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, minWidth: '3.2ch' } }, '1.0');
  const spdVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, minWidth: '4.5ch' } }, '8/s');
  const playBtn = btn('Play', () => togglePlay());
  const lrSlider = h('input', {
    type: 'range', min: '0.2', max: '3.0', step: '0.1', value: '1.0',
    oninput: e => { lr = +e.target.value; lrVal.textContent = lr.toFixed(1); draw(); }
  });
  const spdSlider = h('input', {
    type: 'range', min: '1', max: '25', step: '1', value: '8',
    oninput: e => { speed = +e.target.value; spdVal.textContent = speed + '/s'; if (playing) restartTimer(); }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: RLHF learning loop'),
    h('p', { class: 'sub' }, 'Step through RLHF updates or press Play. Tap a reply to edit its reward, or drag a bar to change chances. Watch how the average reward curve grows — and what happens when a bad reply gets the highest reward.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stopPlay(); manualSteps++; doStep(); }, 'go'),
          playBtn,
          btn('Reset', () => resetToStep0()),
          btn('New data (random)', () => makeRandom()),
          btn('Start again', () => startAgain())),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Reward −0.5', () => bumpReward(-0.5)),
          btn('Reward +0.5', () => bumpReward(0.5)),
          selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem' } }, 'Learning rate', lrSlider, lrVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem' } }, 'Speed', spdSlider, spdVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const isDefaultRewards = () => r.every((v, i) => Math.abs(v - DEF_R[i]) < 1e-6);

  const chal = challenges(ch, [
    {
      text: 'Press Step 3 times from the start. Watch A climb while the average reward rises past 1.65.',
      check: st => st.manualSteps >= 3 && st.avg >= 1.65,
      why: 'Yes! Each step lifts replies with positive advantage (above average) and lowers replies below average.'
    },
    {
      text: 'With the lesson rewards, press Play and keep running. Can you watch D (“At six! ×3”) take over past 80%?',
      check: st => st.isDefR && st.p[3] >= 0.80,
      why: 'That is reward hacking: D has the highest reward (+3.0), so long training pushes almost every reply to D even though the answer is bad.'
    },
    {
      text: 'Tap reply D, lower its reward below A’s (for example to −1), press Reset, then Play until A passes 90% with D under 5%.',
      check: st => st.r[3] < st.r[0] && st.step >= 5 && st.p[0] >= 0.90 && st.p[3] < 0.05,
      why: 'When the reward model scores D honestly, RLHF lifts the brief correct reply A and keeps D near zero.'
    },
    {
      text: 'Press “New data (random)”, set Learning rate to 2.5 or higher, and Play for at least 10 steps.',
      check: st => st.usedRandom && st.lr >= 2.5 && st.step >= 10,
      why: 'With a bigger learning rate the policy moves faster, and RLHF always pushes toward whichever reply earns the highest reward.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 520 : 470, F = NARROW ? 1.1 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const ROW_TOP = 14, ROW_H = NARROW ? 62 : 55;
  const BAR_X = NARROW ? 46 : 220, BAR_W = NARROW ? 205 : 245;

  function doStep() {
    const oldP = p.slice();
    const oldAvg = avgReward(oldP, r);
    const adv = r.map(v => v - oldAvg);
    const delta = oldP.map((pv, i) => lr * pv * adv[i]);
    logits = logits.map((z, i) => z + delta[i]);
    const mz = logits.reduce((a, b) => a + b, 0) / logits.length;
    logits = logits.map(z => z - mz);
    p = softmax(logits);
    step++;
    const newAvg = avgReward(p, r);
    lastInfo = { oldP, newP: p.slice(), oldAvg, newAvg, adv, delta, lr };
    history.push({ step, avg: newAvg, leadD: p[3] > p[0] });
    if (history.length > 260) history = history.slice(-260);
    draw();
  }

  function stopPlay() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function restartTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => doStep(), Math.max(30, Math.round(1000 / speed)));
  }
  function togglePlay() {
    if (playing) { stopPlay(); return; }
    playing = true;
    playBtn.textContent = 'Pause';
    restartTimer();
  }

  function resetToStep0() {
    stopPlay();
    logits = probsToLogits(startP);
    p = softmax(logits);
    step = 0; lastInfo = null;
    history = [{ step: 0, avg: avgReward(p, r), leadD: p[3] > p[0] }];
    draw();
  }

  function startAgain() {
    stopPlay();
    startP = DEF_P.slice();
    r = DEF_R.slice();
    lr = 1.0; lrSlider.value = '1.0'; lrVal.textContent = '1.0';
    speed = 8; spdSlider.value = '8'; spdVal.textContent = '8/s';
    sel = 3; manualSteps = 0; usedRandom = false;
    resetToStep0();
  }

  function makeRandom() {
    stopPlay();
    const raw = [rnd(8, 50), rnd(8, 50), rnd(5, 35), rnd(4, 25)];
    const sum = raw.reduce((a, b) => a + b, 0);
    startP = raw.map(x => x / sum);
    r = [0, 1, 2, 3].map(() => (rnd(-4, 7) * 0.5));
    if (Math.max(...r) - Math.min(...r) < 1.0) r[rnd(0, 3)] += 2.0;
    usedRandom = true;
    resetToStep0();
  }

  function bumpReward(d) {
    r[sel] = Math.max(-3.0, Math.min(4.0, Math.round((r[sel] + d) * 10) / 10));
    if (step === 0) history[0] = { step: 0, avg: avgReward(p, r), leadD: p[3] > p[0] };
    draw();
  }

  // Pointer interaction: tap a row to select it; drag inside bar region to set its chance
  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  function setBarChance(idx, frac) {
    const target = Math.max(0.02, Math.min(0.94, frac));
    const cur = p.slice();
    const rest = 1 - cur[idx];
    const next = cur.map((v, i) => i === idx ? target : (rest > 1e-6 ? v * (1 - target) / rest : (1 - target) / 3));
    logits = probsToLogits(next);
    p = softmax(logits);
    if (step === 0) {
      startP = p.slice();
      history[0] = { step: 0, avg: avgReward(p, r), leadD: p[3] > p[0] };
    }
    draw();
  }
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    const idx = Math.floor((pt.y - ROW_TOP) / ROW_H);
    if (idx < 0 || idx > 3) return;
    sel = idx;
    if (pt.x >= BAR_X - 8 && pt.x <= BAR_X + BAR_W + 12) {
      stopPlay();
      dragging = idx;
      svg.setPointerCapture(e.pointerId);
      setBarChance(idx, (pt.x - BAR_X) / BAR_W);
    } else {
      draw();
    }
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const pt = toSvg(e);
    setBarChance(dragging, (pt.x - BAR_X) / BAR_W);
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const curAvg = avgReward(p, r);
    const adv = r.map(v => v - curAvg);
    const k = [];

    // 4 reply rows
    for (let i = 0; i < 4; i++) {
      const y = ROW_TOP + i * ROW_H, col = COLS[i];
      k.push(s('rect', {
        x: 6, y: y + 2, width: VW - 12, height: ROW_H - 6, rx: 10,
        fill: i === sel ? '#1a2548' : C.bg, stroke: i === sel ? col : C.line, 'stroke-width': i === sel ? 2 : 1
      }));
      const cy = y + ROW_H / 2 - 1;
      k.push(s('circle', { cx: 26, cy, r: 14, fill: C.card, stroke: col, 'stroke-width': 2 }),
        s('text', { x: 26, y: cy + 5, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, LETTERS[i]));

      if (NARROW) {
        k.push(s('text', { x: 48, y: y + 22, fill: C.ink, 'font-size': 13 * F, 'font-weight': 600 }, LABELS[i]));
        k.push(s('rect', { x: VW - 102, y: y + 8, width: 88, height: 21, rx: 6, fill: C.card, stroke: col }),
          s('text', { x: VW - 58, y: y + 23, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'R ' + (r[i] >= 0 ? '+' : '−') + Math.abs(r[i]).toFixed(1)));
        const by = y + 36, bh = 16;
        k.push(s('rect', { x: BAR_X, y: by - 1, width: Math.max(3, startP[i] * BAR_W), height: bh + 2, rx: 3, fill: C.muted, 'fill-opacity': 0.2, stroke: C.muted, 'stroke-opacity': 0.45 }),
          s('rect', { x: BAR_X, y: by, width: Math.max(3, p[i] * BAR_W), height: bh, rx: 3, fill: col, 'fill-opacity': 0.86 }),
          s('text', { x: BAR_X + BAR_W + 8, y: by + 13, fill: col, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, fmtPct(p[i])),
          s('text', { x: VW - 14, y: by + 13, fill: adv[i] >= 0 ? C.green : C.pink, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'adv ' + sgn(adv[i])));
      } else {
        k.push(s('text', { x: 48, y: cy + 5, fill: C.ink, 'font-size': 15, 'font-weight': 600 }, LABELS[i]));
        const by = cy - 10, bh = 20;
        k.push(s('rect', { x: BAR_X, y: by - 1.5, width: Math.max(3, startP[i] * BAR_W), height: bh + 3, rx: 4, fill: C.muted, 'fill-opacity': 0.18, stroke: C.muted, 'stroke-opacity': 0.45 }),
          s('rect', { x: BAR_X, y: by, width: Math.max(3, p[i] * BAR_W), height: bh, rx: 4, fill: col, 'fill-opacity': 0.86 }),
          s('text', { x: BAR_X + BAR_W + 10, y: cy + 5, fill: col, 'font-size': 15, 'font-weight': 700, 'font-family': 'Consolas' }, fmtPct(p[i])),
          s('rect', { x: 526, y: cy - 13, width: 72, height: 26, rx: 7, fill: C.card, stroke: col }),
          s('text', { x: 562, y: cy + 5, fill: col, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, (r[i] >= 0 ? '+' : '−') + Math.abs(r[i]).toFixed(1)),
          s('text', { x: 686, y: cy + 5, fill: adv[i] >= 0 ? C.green : C.pink, 'font-size': 13.5, 'text-anchor': 'end', 'font-family': 'Consolas' }, sgn(adv[i])));
      }
    }
    if (!NARROW) {
      k.push(s('text', { x: 562, y: 12, fill: C.amber, 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'REWARD'),
        s('text', { x: 686, y: 12, fill: C.muted, 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'ADVANTAGE'));
    }

    // Bottom curve: Average reward vs. step
    const CT = NARROW ? 276 : 250, CB = VH - 14;
    const CX0 = NARROW ? 46 : 56, CX1 = VW - 18, CY0 = CB - 26, CY1 = CT + 34;
    k.push(s('rect', { x: 6, y: CT, width: VW - 12, height: CB - CT, rx: 10, fill: C.bg, stroke: C.line }));
    k.push(s('text', { x: 18, y: CT + 21, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `STEP ${step}   AVG REWARD ${curAvg.toFixed(2)}`),
      s('text', { x: VW - 18, y: CT + 21, fill: p[3] > 0.5 && isDefaultRewards() ? ORANGE : C.muted, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        p[3] > 0.5 && isDefaultRewards() ? 'REWARD HACKING!' : 'AVG REWARD CURVE'));

    const minR = Math.min(-1, ...r, ...history.map(h0 => h0.avg)) - 0.3;
    const maxR = Math.max(3.2, ...r, ...history.map(h0 => h0.avg)) + 0.3;
    const maxStep = Math.max(10, history[history.length - 1].step);
    const minStep = history[0].step;
    const sx = st => CX0 + ((st - minStep) / Math.max(1, maxStep - minStep)) * (CX1 - CX0);
    const sy = val => CY0 - ((val - minR) / (maxR - minR)) * (CY0 - CY1);

    for (let g = Math.ceil(minR); g <= Math.floor(maxR); g++) {
      const gy = sy(g);
      if (gy < CY1 - 2 || gy > CY0 + 2) continue;
      k.push(s('line', { x1: CX0, x2: CX1, y1: gy, y2: gy, stroke: C.line }),
        s('text', { x: CX0 - 7, y: gy + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    }
    // Dashed ceiling lines for A and D rewards
    [0, 3].forEach(idx => {
      const gy = sy(r[idx]);
      k.push(s('line', { x1: CX0, x2: CX1, y1: gy, y2: gy, stroke: COLS[idx], 'stroke-opacity': 0.4, 'stroke-dasharray': '6 5' }));
    });
    k.push(s('line', { x1: CX0, x2: CX1, y1: CY0, y2: CY0, stroke: C.muted }),
      s('line', { x1: CX0, x2: CX0, y1: CY1, y2: CY0, stroke: C.muted }));
    k.push(s('text', { x: CX0, y: CY0 + 16, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, minStep),
      s('text', { x: CX1, y: CY0 + 16, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `step ${maxStep}`));

    for (let i = 1; i < history.length; i++) {
      const a = history[i - 1], b = history[i];
      k.push(s('line', {
        x1: sx(a.step), y1: sy(a.avg), x2: sx(b.step), y2: sy(b.avg),
        stroke: b.leadD && isDefaultRewards() ? ORANGE : C.amber, 'stroke-width': 3
      }));
    }
    const last = history[history.length - 1];
    k.push(s('circle', { cx: sx(last.step), cy: sy(last.avg), r: 5, fill: last.leadD && isDefaultRewards() ? ORANGE : C.amber }));
    svg.replaceChildren(...k);

    // Formula box: show exact numbers of the last iteration (or Step 0 preview)
    if (!lastInfo) {
      const nextDeltaA = lr * p[0] * adv[0];
      fbox(box, [
        [`step 0   avg reward = ${curAvg.toFixed(2)}`, C.amber],
        'advantage = reward − avg',
        `A ${sgn(adv[0])}  B ${sgn(adv[1])}`,
        `C ${sgn(adv[2])}  D ${sgn(adv[3])}`,
        [`next A Δ: ${fmt(lr)}×${p[0].toFixed(2)}×${sgn(adv[0])} = ${sgn(nextDeltaA)}`, C.cyan]
      ]);
    } else {
      const li = lastInfo;
      fbox(box, [
        [`step ${step}  (lr = ${fmt(li.lr)})`, C.amber],
        [`avg: ${li.oldAvg.toFixed(2)} → ${li.newAvg.toFixed(2)}`, C.green],
        [`A ${fmtPct(li.oldP[0])}→${fmtPct(li.newP[0])} (Δ ${sgn(li.delta[0])})`, COLS[0]],
        [`B ${fmtPct(li.oldP[1])}→${fmtPct(li.newP[1])} (Δ ${sgn(li.delta[1])})`, COLS[1]],
        [`C ${fmtPct(li.oldP[2])}→${fmtPct(li.newP[2])} (Δ ${sgn(li.delta[2])})`, COLS[2]],
        [`D ${fmtPct(li.oldP[3])}→${fmtPct(li.newP[3])} (Δ ${sgn(li.delta[3])})`, COLS[3]]
      ]);
    }

    note.textContent = p[3] > 0.5 && isDefaultRewards()
      ? 'Reward hacking! D earns +3.0, so the policy shifts almost every reply to “At six! At six! At six!” even though A is the better answer.'
      : 'Each step computes advantage = reward − average, changes each score by lr × chance × advantage, and uses softmax to get new chances.';
    selLabel.textContent = `Selected: Reply ${LETTERS[sel]} (reward ${(r[sel] >= 0 ? '+' : '−') + Math.abs(r[sel]).toFixed(1)})`;

    chal.update({ step, p: p.slice(), r: r.slice(), avg: curAvg, lr, manualSteps, usedRandom, isDefR: isDefaultRewards() });
  }

  draw();
  return () => stopPlay();
}

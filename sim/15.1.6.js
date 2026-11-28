// 15.1.6 Try it: contextual bandits.
// Learners arrive one by one; the app looks at the row for the learner's activity (studied today or not)
// and chooses Prompt A (quiz) or Prompt B (reminder). Step, Play / Pause, speed, Reset, New data,
// explore chance, tap a box to choose by hand, and a growing regret curve that compares
// the app that uses context with an app that ignores it. 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const ORANGE = '#fb923c';
  const ARMS = ['A', 'B'], ACOL = { A: C.cyan, B: ORANGE };
  const ROWS = [['Studied', 'today'], ['Did not', 'study']], RCOL = [C.violet, C.ink];
  const START_P = [{ A: 0.8, B: 0.6 }, { A: 0.2, B: 0.8 }];

  let truth = START_P.map(o => ({ ...o })), chapterRates = true;
  let H, blind, steps, ctxReg, blindReg, ctxHist, blindHist, next, last, manualWorse, usedNewData = false;
  let explorePct = 10, speed = 4, reveal = false, timer = null;

  const svg = s('svg', { viewBox: '0 0 700 520' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('Play', () => togglePlay());
  const revealBtn = btn('Reveal true rates', () => { reveal = !reveal; revealBtn.textContent = reveal ? 'Hide true rates' : 'Reveal true rates'; draw(); }, 'ghost');
  const expVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.violet, fontWeight: 700 } }, '10%');
  const expSlider = h('input', {
    type: 'range', min: 0, max: 100, step: 5, value: 10,
    style: { accentColor: C.violet, flex: '1 1 130px' },
    oninput: e => { explorePct = +e.target.value; expVal.textContent = explorePct + '%'; draw(); }
  });
  const spdVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } }, '4×');
  const spdSlider = h('input', {
    type: 'range', min: 1, max: 10, step: 1, value: 4,
    style: { accentColor: C.cyan, flex: '1 1 90px' },
    oninput: e => { speed = +e.target.value; spdVal.textContent = speed + '×'; if (timer) { stop(); start(); } }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: choose for the learner in front of you'),
    h('p', { class: 'sub' }, 'Four boxes, one for each kind of learner and each prompt. The glowing row is the next learner’s group. Press Step or Play to let the app choose, or tap a box in the glowing row to choose yourself.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); step(null); }, 'go'),
          playBtn,
          btn('Reset', () => reset(false)),
          btn('New data (random)', () => reset(true))),
        h('div', { class: 'sim-row' }, revealBtn),
        h('div', { class: 'sim-row', style: { justifyContent: 'space-between' } },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.5rem', flex: '1 1 220px', fontSize: '.92rem' } },
            'Explore chance:', expSlider, expVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.5rem', flex: '0 1 180px', fontSize: '.92rem' } },
            'Speed:', spdSlider, spdVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const sum = a => a.reduce((x, y) => x + y, 0);
  const rate = a => a.length ? sum(a) / a.length : 0;
  const pctStr = x => Math.round(x * 100) + '%';
  const sameBest = () => (truth[0].A >= truth[0].B) === (truth[1].A >= truth[1].B);

  const chal = challenges(ch, [
    { text: 'Press Step 4 times. Each time, watch which of the four boxes changes.',
      check: st => st.steps >= 4,
      why: 'Each result lands in one box only: the learner’s group and the chosen prompt. The other three estimates stay the same.' },
    { text: 'Tap a box in the glowing row to choose by hand. Pick the prompt that looks worse, 3 times.',
      check: st => st.manualWorse >= 3,
      why: 'That is exploring by hand: the prompt that looks worse gets new results, so an unlucky start can be corrected.' },
    { text: 'Set Explore chance between 5% and 20% and run at least 100 steps. Does the app that uses context miss fewer returns?',
      check: st => st.steps >= 100 && st.explorePct >= 5 && st.explorePct <= 20 && st.ctxReg < st.blindReg,
      why: 'Yes. It learns the best prompt for each group, so its regret curve grows more slowly than the one that ignores context.' },
    { text: 'Press “New data” until one prompt has the higher true rate in BOTH groups (use Reveal), then run 60 steps. Does context still help much?',
      check: st => st.usedNewData && st.sameBest && st.steps >= 60,
      why: 'Not much. When one prompt is best for everyone, ignoring the context already picks well. Context helps when the best action differs between situations.' },
  ]);

  // u: the learner’s chance of returning, e: the explore roll, pick: the random prompt when exploring
  const newLearner = () => ({ r: Math.random() < 0.5 ? 0 : 1, u: Math.random(), e: Math.random(), pick: Math.random() });

  function reset(randomNew) {
    stop();
    if (randomNew) {
      usedNewData = true; chapterRates = false;
      truth = [0, 1].map(() => {
        let a, b;
        do { a = rnd(10, 90) / 100; b = rnd(10, 90) / 100; } while (Math.abs(a - b) < 0.2);
        return { A: a, B: b };
      });
    }
    if (chapterRates) {
      // The chapter’s starting results: studied A 1/1, B 0/1; did not study A 0/1, B 1/1
      H = [{ A: [1], B: [0] }, { A: [0], B: [1] }];
      blind = { A: [1], B: [0] };
    } else {
      H = [0, 1].map(r => ({ A: [Math.random() < truth[r].A ? 1 : 0], B: [Math.random() < truth[r].B ? 1 : 0] }));
      const r0 = Math.random() < 0.5 ? 0 : 1, r1 = Math.random() < 0.5 ? 0 : 1;
      blind = { A: [Math.random() < truth[r0].A ? 1 : 0], B: [Math.random() < truth[r1].B ? 1 : 0] };
    }
    steps = 0; ctxReg = 0; blindReg = 0; ctxHist = [0]; blindHist = [0]; last = null; manualWorse = 0;
    next = newLearner();
    draw();
  }

  function pickArm(est, L) {
    if (L.e * 100 < explorePct) return { arm: L.pick < 0.5 ? 'A' : 'B', mode: 'explore' };
    return { arm: rate(est.A) >= rate(est.B) ? 'A' : 'B', mode: 'exploit' };   // a tie goes to A, as in the chapter
  }

  function step(manualArm) {
    const L = next, row = H[L.r];
    const c = manualArm ? { arm: manualArm, mode: 'you' } : pickArm(row, L);
    const other = c.arm === 'A' ? 'B' : 'A';
    const before = { A: rate(row.A), B: rate(row.B), retA: sum(row.A), nA: row.A.length, retB: sum(row.B), nB: row.B.length };
    if (manualArm && before[c.arm] < before[other]) manualWorse++;
    const p = truth[L.r][c.arm], reward = L.u < p ? 1 : 0;
    const oldRet = sum(row[c.arm]), oldN = row[c.arm].length;
    row[c.arm].push(reward);
    const best = Math.max(truth[L.r].A, truth[L.r].B);
    ctxReg += best - p;
    // The app that ignores context meets the same learner with the same rolls.
    const b = pickArm(blind, L), pb = truth[L.r][b.arm];
    blind[b.arm].push(L.u < pb ? 1 : 0);
    blindReg += best - pb;
    steps++; ctxHist.push(ctxReg); blindHist.push(blindReg);
    last = { r: L.r, arm: c.arm, mode: c.mode, reward, before, oldRet, oldN };
    next = newLearner();
    draw();
  }

  const stepMs = () => Math.round(980 - (speed - 1) * 98);
  function start() {
    if (timer) return;
    playBtn.textContent = 'Pause'; playBtn.classList.add('go');
    timer = setInterval(() => { if (steps >= 300) { stop(); return; } step(null); }, stepMs());
  }
  function stop() {
    if (!timer) return;
    clearInterval(timer); timer = null;
    playBtn.textContent = 'Play'; playBtn.classList.remove('go');
  }
  function togglePlay() { if (timer) stop(); else start(); }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 600 : 520, F = NARROW ? 1.08 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const LW = NARROW ? 70 : 104, GAP = 10, CELL_W = (VW - LW - 12 - GAP) / 2, CELL_H = NARROW ? 100 : 96;
  const GRID_Y = 72, rowY = r => GRID_Y + r * (CELL_H + GAP);
  const CHART_Y = GRID_Y + 2 * CELL_H + GAP + 14;

  function drawCell(k, r, arm) {
    const x = LW + (arm === 'A' ? 0 : CELL_W + GAP), y = rowY(r), w = CELL_W, col = ACOL[arm];
    const hist = H[r][arm], ret = sum(hist), n = hist.length, est = ret / n;
    const isLast = last && last.r === r && last.arm === arm;
    const g = s('g', { style: 'cursor:pointer' });
    g.addEventListener('click', () => { if (next.r !== r) return; stop(); step(arm); });
    g.append(s('rect', { x, y, width: w, height: CELL_H, rx: 12, fill: C.bg, stroke: isLast ? C.ink : col, 'stroke-width': isLast ? 2.6 : 1.6 }));

    // reward dots: the last 10 results in this box
    const shown = hist.slice(-10), sx = (w - 20) / 10, rad = Math.min(8, sx * 0.38);
    shown.forEach((v, i) => {
      const cx = x + 10 + (i + 0.5) * sx, cy = y + 20, dc = v ? C.green : C.muted;
      g.append(s('circle', { cx, cy, r: rad, fill: dc, 'fill-opacity': v ? 0.24 : 0.16, stroke: dc, 'stroke-width': 1.4 }),
        s('text', { x: cx, y: cy + 3.5, fill: dc, 'font-size': rad * 1.25, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v ? '✓' : '×'));
    });

    g.append(
      s('text', { x: x + 10, y: y + 52, fill: C.ink, 'font-size': 13.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${ret} / ${n}`),
      s('text', { x: x + w - 10, y: y + 52, fill: col, 'font-size': 14.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, pctStr(est)));

    // return-rate bar with a transparent uncertainty band
    const bx = x + 10, by = y + 62, bw = w - 20, bh = 14;
    const hw = Math.min(0.42, 0.42 / Math.sqrt(n)), lo = Math.max(0, est - hw), hi = Math.min(1, est + hw);
    g.append(
      s('rect', { x: bx, y: by, width: bw, height: bh, rx: 4, fill: C.card, stroke: C.line }),
      s('rect', { x: bx + lo * bw, y: by - 4, width: Math.max(8, (hi - lo) * bw), height: bh + 8, rx: 5, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-opacity': 0.45 }),
      s('rect', { x: bx, y: by, width: Math.max(est > 0 ? 4 : 0, est * bw), height: bh, rx: 4, fill: col, 'fill-opacity': 0.86 }));
    if (reveal) {
      const tx = bx + truth[r][arm] * bw;
      g.append(s('line', { x1: tx, x2: tx, y1: by - 6, y2: by + bh + 6, stroke: C.green, 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }),
        s('text', { x: x + w - 10, y: y + CELL_H - 4, fill: C.green, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `true ${pctStr(truth[r][arm])}`));
    }
    if (isLast) {
      g.append(s('text', { x: x + 10, y: y + CELL_H - 4, fill: last.reward ? C.green : C.muted, 'font-size': 11 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `${last.mode === 'you' ? 'YOU' : last.mode.toUpperCase()} ${last.reward ? '+1' : '0'}`));
    }
    k.push(g);
  }

  function draw() {
    const k = [];
    // next learner
    const nc = RCOL[next.r];
    k.push(s('circle', { cx: 22, cy: 22, r: 13, fill: nc, 'fill-opacity': 0.22 }), s('circle', { cx: 22, cy: 22, r: 6, fill: nc }),
      s('text', { x: 44, y: 27, fill: nc, 'font-size': 14.5 * F, 'font-weight': 700 }, `Next learner: ${next.r ? 'did not study' : 'studied today'}`),
      s('text', { x: VW - 10, y: 27, fill: C.amber, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `Step ${steps}`));

    // headers
    ARMS.forEach(a => {
      const x = LW + (a === 'A' ? 0 : CELL_W + GAP) + CELL_W / 2;
      k.push(s('text', { x, y: GRID_Y - 10, fill: ACOL[a], 'font-size': 14.5 * F, 'font-weight': 700, 'text-anchor': 'middle' }, a === 'A' ? 'A · quiz' : 'B · reminder'));
    });
    // glowing row for the next learner
    k.push(s('rect', { x: LW - 5, y: rowY(next.r) - 5, width: VW - LW - 2, height: CELL_H + 10, rx: 15, fill: C.amber, 'fill-opacity': 0.06, stroke: C.amber, 'stroke-width': 2.2 }));
    [0, 1].forEach(r => {
      ROWS[r].forEach((line, i) => k.push(s('text', { x: (LW - 8) / 2, y: rowY(r) + CELL_H / 2 - 4 + i * 17, fill: RCOL[r], 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle' }, line)));
      ARMS.forEach(a => drawCell(k, r, a));
    });

    // regret curves
    const top = CHART_Y, gx = 44, gy = top + 40, gw = VW - gx - 14, gh = VH - gy - 26;
    const maxStep = Math.max(40, steps), maxReg = Math.max(2, ctxReg * 1.15, blindReg * 1.15);
    const px = i => gx + i / maxStep * gw, py = v => gy + gh - v / maxReg * gh;
    k.push(s('rect', { x: 6, y: top, width: VW - 12, height: VH - top - 4, rx: 12, fill: C.bg, stroke: C.line }),
      s('text', { x: 18, y: top + 18, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700 }, 'Missed returns so far (cumulative regret)'),
      s('text', { x: 18, y: top + 34, fill: C.pink, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `uses context: ${ctxReg.toFixed(2)}`),
      s('text', { x: VW - 18, y: top + 34, fill: C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `ignores context: ${blindReg.toFixed(2)}`));
    for (let j = 0; j <= 4; j++) {
      const v = maxReg * j / 4, y = py(v);
      k.push(s('line', { x1: gx, x2: gx + gw, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.7 }),
        s('text', { x: gx - 6, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(Math.round(v * 10) / 10)));
    }
    const tick = Math.max(10, Math.ceil(maxStep / 4 / 10) * 10);
    for (let t = 0; t <= maxStep; t += tick) k.push(s('text', { x: px(t), y: gy + gh + 16, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, t));
    const pts = arr => arr.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
    if (steps > 0) {
      k.push(s('polyline', { points: pts(blindHist), fill: 'none', stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
        s('polyline', { points: pts(ctxHist), fill: 'none', stroke: C.pink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    k.push(s('circle', { cx: px(steps), cy: py(ctxReg), r: 4.5, fill: C.pink }));
    svg.replaceChildren(...k);

    // formula box: the numbers of this step
    const avgC = steps ? ctxReg / steps : 0, avgB = steps ? blindReg / steps : 0;
    if (!last) {
      fbox(box, [['step 0: one result in each box', C.ink],
        [`studied   A ${sum(H[0].A)}/${H[0].A.length}  B ${sum(H[0].B)}/${H[0].B.length}`, C.violet],
        [`no study  A ${sum(H[1].A)}/${H[1].A.length}  B ${sum(H[1].B)}/${H[1].B.length}`, C.ink],
        ['rate = returns ÷ choices', C.amber]]);
    } else {
      const b = last.before, grp = last.r ? 'no study' : 'studied', n2 = last.oldN + 1, r2 = last.oldRet + last.reward;
      fbox(box, [
        [`step ${steps}: learner ${last.r ? 'did not study' : 'studied today'}`, RCOL[last.r]],
        [`${grp}: A ${b.retA}/${b.nA} = ${pctStr(b.A)}  B ${b.retB}/${b.nB} = ${pctStr(b.B)}`, C.ink],
        [`choose ${last.arm} (${last.mode}) → reward ${last.reward}`, last.reward ? C.green : C.muted],
        [`${grp} · ${last.arm}: ${r2} ÷ ${n2} = ${pctStr(r2 / n2)}`, ACOL[last.arm]],
        [`avg regret/choice: ${avgC.toFixed(2)} vs ${avgB.toFixed(2)} blind`, C.amber]]);
    }

    if (steps === 0) note.textContent = 'The app looks only at the glowing row: the two estimates for this kind of learner. The dashed curve is an app that ignores context and keeps just two estimates.';
    else if (explorePct === 0) note.textContent = 'With 0% exploration the app never re-checks the prompt that looks worse in a group, so an unlucky start can stay stuck.';
    else if (steps >= 40 && ctxReg < blindReg) note.textContent = 'The pink curve grows more slowly: choosing for each kind of learner misses fewer returns than one choice for everyone.';
    else note.textContent = 'Each result updates only one box: the learner’s group and the chosen prompt.';

    chal.update({ steps, explorePct, manualWorse, ctxReg, blindReg, usedNewData, sameBest: sameBest() });
  }

  reset(false);
  return () => stop();
}

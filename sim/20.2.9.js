// 20.2.9 Try it: distillation — teaching a small student to imitate a teacher's soft labels.
// Drag the teacher's chance bars, step or play training iterations, adjust learning rate & speed,
// watch the KL loss curve grow, and solve 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const NAMES = ['"six"', '"6"', '"seven" (wrong)'];
  const SHORT = ['"six"', '"6"', '"seven"'];
  const LESSON_TEACHER = [70, 20, 10];

  let teacherPct = LESSON_TEACHER.slice(); // integers summing to 100
  let preset = 'lesson';                   // 'lesson' | 'hard' | 'custom' | 'random'
  let sel = 0;                             // selected choice for -5% / +5%
  let scores = [0, 0, 0];
  let stepCount = 0;
  let lr = 2.0;
  let speed = 3;                           // steps per second
  let timer = null;
  let lastStep = null;                     // { oldQ, diffs, deltas, newQ, oldKL, newKL }
  let history = [];                        // KL loss at each step
  let maxLossJump = 0;

  const softmax = z => {
    const m = Math.max(...z);
    const e = z.map(v => Math.exp(v - m));
    const sum = e.reduce((a, b) => a + b, 0);
    return e.map(v => v / sum);
  };
  const teacherProb = () => teacherPct.map(p => p / 100);
  const klDiv = (p, q) => {
    let sum = 0;
    for (let i = 0; i < p.length; i++) {
      if (p[i] > 1e-12) sum += p[i] * Math.log(p[i] / Math.max(q[i], 1e-12));
    }
    return Math.max(0, sum);
  };
  const fmtKL = x => x >= 0.1 ? x.toFixed(2) : (x >= 0.001 ? x.toFixed(3) : x.toFixed(4));
  const fmtSigned = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2);

  function stop() {
    if (timer !== null) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }

  function resetStudent() {
    stop();
    scores = [0, 0, 0];
    stepCount = 0;
    lastStep = null;
    maxLossJump = 0;
    history = [klDiv(teacherProb(), softmax(scores))];
    draw();
  }

  function setTeacherPct(i, newVal, newPreset = 'custom') {
    const val = Math.max(0, Math.min(100, Math.round(newVal)));
    const rem = 100 - val;
    const others = [0, 1, 2].filter(k => k !== i);
    const oSum = teacherPct[others[0]] + teacherPct[others[1]];
    const next = teacherPct.slice();
    next[i] = val;
    if (oSum > 0) {
      next[others[0]] = Math.round(rem * teacherPct[others[0]] / oSum);
      next[others[1]] = rem - next[others[0]];
    } else {
      next[others[0]] = Math.floor(rem / 2);
      next[others[1]] = rem - next[others[0]];
    }
    teacherPct = next;
    preset = newPreset;
    resetStudent();
  }

  function doStep() {
    const p = teacherProb();
    const oldQ = softmax(scores);
    const oldKL = klDiv(p, oldQ);
    const diffs = p.map((pi, i) => pi - oldQ[i]);
    const deltas = diffs.map(d => lr * d);
    scores = scores.map((z, i) => Math.max(-25, Math.min(25, z + deltas[i])));
    const newQ = softmax(scores);
    const newKL = klDiv(p, newQ);
    stepCount++;
    if (newKL - oldKL > maxLossJump) maxLossJump = newKL - oldKL;
    history.push(newKL);
    if (history.length > 60) history = history.slice(history.length - 60);
    lastStep = { oldQ, diffs, deltas, newQ, oldKL, newKL };
    draw();
  }

  function togglePlay() {
    if (timer !== null) { stop(); return; }
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      if (stepCount >= 120) { stop(); return; }
      doStep();
    }, Math.round(1000 / speed));
  }

  function newRandomTeacher() {
    const a = rnd(15, 75);
    const b = rnd(5, Math.max(5, 95 - a));
    const c = 100 - a - b;
    const arr = [a, b, c];
    // shuffle so any choice can be largest
    for (let i = 2; i > 0; i--) {
      const j = rnd(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    teacherPct = arr;
    preset = 'random';
    resetStudent();
  }

  // UI elements
  const svg = s('svg', { viewBox: '0 0 700 460' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const iterPill = pill('STEP 0', C.amber);
  const klPill = pill('KL LOSS 0.30', C.cyan);
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const lrVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } }, '2.0');
  const spdVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } }, '3/s');

  const lrSlider = h('input', {
    type: 'range', min: '0.2', max: '10', step: '0.2', value: String(lr),
    style: { flex: '1 1 110px', accentColor: C.amber },
    oninput: e => { lr = parseFloat(e.target.value); lrVal.textContent = lr.toFixed(1); draw(); },
  });
  const spdSlider = h('input', {
    type: 'range', min: '1', max: '10', step: '1', value: String(speed),
    style: { flex: '1 1 90px', accentColor: C.cyan },
    oninput: e => {
      speed = parseInt(e.target.value, 10);
      spdVal.textContent = `${speed}/s`;
      if (timer !== null) { stop(); togglePlay(); }
    },
  });

  const stepBtn = btn('Step', () => { stop(); doStep(); }, 'go');
  const playBtn = btn('Play', togglePlay);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: distillation step by step'),
    h('p', { class: 'sub' },
      'Drag any cyan teacher bar (or tap it and use −5% / +5%) to set the teacher’s chances. Press Step or Play to watch the smaller student learn to match them.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.55rem' } }, iterPill, klPill),
        svg,
        h('div', { class: 'sim-row' },
          stepBtn, playBtn,
          btn('Reset student', resetStudent),
          btn('New teacher (random)', newRandomTeacher)),
        h('div', { class: 'sim-row' },
          btn('Lesson (70 / 20 / 10)', () => { teacherPct = LESSON_TEACHER.slice(); preset = 'lesson'; resetStudent(); }),
          btn('Hard label (100 / 0 / 0)', () => { teacherPct = [100, 0, 0]; preset = 'hard'; resetStudent(); }),
          btn('−5%', () => setTeacherPct(sel, teacherPct[sel] - 5)),
          btn('+5%', () => setTeacherPct(sel, teacherPct[sel] + 5)),
          selLabel),
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', flex: '1 1 180px' } },
            'Learning rate:', lrSlider, lrVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', flex: '1 1 160px' } },
            'Speed:', spdSlider, spdVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'With the lesson teacher (70 / 20 / 10) and learning rate 2.0, press Step until KL loss drops below 0.01.',
      check: st => st.preset === 'lesson' && Math.abs(st.lr - 2) < 0.05 && st.step >= 2 && st.kl < 0.01,
      why: 'In just 2 steps the loss falls from 0.30 to 0.007, and the student already gives about 67%, 19% and 14%.',
    },
    {
      text: 'Can too big a learning rate break learning? Raise learning rate to 8.0 or higher, reset the student, then press Step or Play.',
      check: st => st.lr >= 8 && st.step >= 3 && st.maxLossJump > 0.02,
      why: 'Each step overshoots the teacher and bounces back and forth, so the KL loss jumps up instead of falling smoothly.',
    },
    {
      text: 'Drag the wrong answer "seven" up to at least 30% on the teacher, then train the student until KL loss is below 0.01.',
      check: st => st.teacherPct[2] >= 30 && st.step >= 1 && st.kl < 0.01,
      why: 'The student copied that 30%+ mistake too! Because distillation imitates the teacher, it inherits the teacher’s errors.',
    },
    {
      text: 'Press “New teacher (random)” and run Play (or Step) until the student matches it with KL loss below 0.005.',
      check: st => st.preset === 'random' && st.step >= 1 && st.kl < 0.005,
      why: 'Every time, changing each score by rate × (teacher − student) pulls the student’s bars onto the teacher’s soft labels.',
    },
  ]);

  // SVG layout (adapts for phone vs laptop)
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 500 : 460, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const BX0 = NARROW ? 82 : 120, BX1 = VW - (NARROW ? 56 : 74), BW = BX1 - BX0;
  const ROW_Y = NARROW ? [58, 134, 210] : [54, 126, 198];
  const BH = NARROW ? 24 : 23;

  // Loss curve box
  const CX0 = NARROW ? 48 : 66, CX1 = VW - 22;
  const CY0 = NARROW ? 454 : 420, CY1 = NARROW ? 300 : 280;

  // Pointer drag on teacher bars
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    for (let i = 0; i < 3; i++) {
      if (p.y >= ROW_Y[i] - 30 && p.y <= ROW_Y[i] + 34 && p.x >= BX0 - 20 && p.x <= BX1 + 30) {
        sel = i; dragging = i;
        svg.setPointerCapture(e.pointerId);
        onMove(e);
        return;
      }
    }
  });
  const onMove = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const pct = Math.max(0, Math.min(100, Math.round(((p.x - BX0) / BW) * 100)));
    setTeacherPct(dragging, pct);
  };
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const p = teacherProb();
    const q = softmax(scores);
    const kl = klDiv(p, q);
    const k = [];

    // Legend at top
    k.push(
      s('rect', { x: BX0, y: 10, width: 14, height: 12, rx: 2, fill: C.cyan, 'fill-opacity': 0.85 }),
      s('text', { x: BX0 + 20, y: 20, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700 }, 'Teacher (drag)'),
      s('rect', { x: BX0 + (NARROW ? 132 : 155), y: 10, width: 14, height: 12, rx: 2, fill: C.green, 'fill-opacity': 0.85 }),
      s('text', { x: BX0 + (NARROW ? 152 : 175), y: 20, fill: C.green, 'font-size': 13 * F, 'font-weight': 700 }, 'Student (learns)')
    );

    // Vertical grid lines (0%, 25%, 50%, 75%, 100%)
    for (const g of [0, 25, 50, 75, 100]) {
      const gx = BX0 + (g / 100) * BW;
      k.push(
        s('line', { x1: gx, x2: gx, y1: ROW_Y[0] - 26, y2: ROW_Y[2] + 34, stroke: C.line, 'stroke-dasharray': g ? '3 4' : '' }),
        s('text', { x: gx, y: ROW_Y[2] + 50, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${g}%`)
      );
    }

    // Three paired bars: Teacher (top) and Student (bottom)
    for (let i = 0; i < 3; i++) {
      const ry = ROW_Y[i];
      const tw = (teacherPct[i] / 100) * BW;
      const sw = q[i] * BW;
      if (i === sel) {
        k.push(s('rect', { x: 4, y: ry - 26, width: VW - 8, height: 58, rx: 8, fill: '#ffffff', 'fill-opacity': 0.04 }));
      }
      // Choice label
      k.push(s('text', {
        x: BX0 - 10, y: ry + 4, fill: i === 2 ? C.pink : C.ink,
        'font-size': (NARROW ? 13 : 15) * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas',
      }, NARROW ? SHORT[i] : NAMES[i]));

      // Teacher bar + drag handle
      k.push(
        s('rect', { x: BX0, y: ry - BH + 1, width: Math.max(2, tw), height: BH - 2, rx: 4, fill: C.cyan, 'fill-opacity': 0.82 }),
        s('circle', { cx: BX0 + tw, cy: ry - BH / 2, r: 7, fill: C.bg, stroke: C.cyan, 'stroke-width': 2.5 }),
        s('text', {
          x: BX0 + tw + 12, y: ry - BH / 2 + 4, fill: C.cyan,
          'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas',
        }, `${teacherPct[i]}%`)
      );

      // Student bar
      const sPct = Math.round(q[i] * 1000) / 10;
      k.push(
        s('rect', { x: BX0, y: ry + 4, width: Math.max(2, sw), height: BH - 2, rx: 4, fill: i === 2 && q[2] >= 0.25 ? C.pink : C.green, 'fill-opacity': 0.88 }),
        s('text', {
          x: BX0 + sw + 8, y: ry + BH / 2 + 7, fill: i === 2 && q[2] >= 0.25 ? C.pink : C.green,
          'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas',
        }, `${fmt(sPct)}%`)
      );
    }

    // KL Loss-versus-iteration curve
    const maxY = Math.max(0.35, ...history) * 1.12;
    const maxSteps = Math.max(8, history.length - 1);
    const gx = idx => CX0 + (idx / maxSteps) * (CX1 - CX0);
    const gy = val => CY0 - (val / maxY) * (CY0 - CY1);

    k.push(
      s('text', { x: CX0, y: CY1 - 12, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'KL LOSS BY STEP'),
      s('line', { x1: CX0, x2: CX1, y1: CY0, y2: CY0, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: CX0, x2: CX0, y1: CY1, y2: CY0, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: CX0 - 8, y: CY0 + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0'),
      s('text', { x: CX0 - 8, y: CY1 + 5, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, maxY.toFixed(2)),
      s('text', { x: CX1, y: CY0 + 18, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `step ${stepCount}`)
    );

    if (history.length > 1) {
      const pts = history.map((v, idx) => `${gx(idx).toFixed(1)},${gy(v).toFixed(1)}`).join(' ');
      k.push(s('polyline', { points: pts, fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    }
    history.forEach((v, idx) => {
      if (history.length <= 20 || idx === history.length - 1 || idx === 0) {
        k.push(s('circle', {
          cx: gx(idx), cy: gy(v), r: idx === history.length - 1 ? 5.5 : 3.2,
          fill: idx === history.length - 1 ? C.amber : C.cyan,
        }));
      }
    });

    svg.replaceChildren(...k);

    // Status pills
    iterPill.textContent = `STEP ${stepCount}`;
    klPill.textContent = `KL LOSS ${fmtKL(kl)}`;
    selLabel.textContent = `Selected: ${SHORT[sel]} (${teacherPct[sel]}%)`;

    // Formula box: show exact numbers of the last step (or initial state)
    if (!lastStep) {
      fbox(box, [
        ['Formula: Δscore = rate × (teacher − student)', C.amber],
        `Step 0 (start) · rate = ${lr.toFixed(1)}`,
        `Teacher: ${teacherPct[0]}% · ${teacherPct[1]}% · ${teacherPct[2]}%`,
        `Student: 33% · 33% · 33%  (scores 0, 0, 0)`,
        [`KL loss = ${fmtKL(kl)}`, C.amber],
      ]);
    } else {
      const { oldQ, diffs, deltas, newQ, oldKL, newKL } = lastStep;
      const lines = [
        [`Step ${stepCount} · rate = ${lr.toFixed(1)}`, C.amber],
        ...SHORT.map((nm, i) => [
          `${nm.padEnd(7)} ${lr.toFixed(1)}×(${p[i].toFixed(2)}−${oldQ[i].toFixed(2)}) = ${fmtSigned(deltas[i])}`,
          deltas[i] >= 0 ? C.green : C.pink,
        ]),
        `New chances: ${Math.round(newQ[0] * 100)}% · ${Math.round(newQ[1] * 100)}% · ${Math.round(newQ[2] * 100)}%`,
        [`KL loss: ${fmtKL(oldKL)} → ${fmtKL(newKL)}`, newKL > oldKL + 0.001 ? C.pink : C.amber],
      ];
      fbox(box, lines);
    }

    // Helpful plain-English note
    if (lastStep && lastStep.newKL > lastStep.oldKL + 0.005) {
      note.textContent = 'The loss jumped up! This learning rate is too big, so each step overshoots the teacher.';
    } else if (teacherPct[2] >= 25 && q[2] >= 0.22) {
      note.textContent = `Notice the student now gives the wrong answer "seven" ${Math.round(q[2] * 100)}% — it copies the teacher’s mistake too.`;
    } else if (preset === 'hard') {
      note.textContent = 'Hard label mode (100 / 0 / 0): the student pushes "6" down to 0%, losing the teacher’s hint that "6" is also reasonable.';
    } else if (kl < 0.005) {
      note.textContent = 'The student’s chances nearly match the teacher’s soft labels, so the score changes are almost zero.';
    } else {
      note.textContent = 'Press Step to see one update’s numbers, or Play to watch the student settle toward the teacher.';
    }

    chal.update({ preset, lr, step: stepCount, kl, maxLossJump, teacherPct: teacherPct.slice() });
  }

  resetStudent();
  return () => stop();
}

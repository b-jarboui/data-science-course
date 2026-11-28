// 20.2.10 Try it: advance one 100-step checkpoint at a time and test both skills.
// Mixed checkpoints at 100 and 200 are illustrative. The chapter gives the
// mixed score at 300 and all four announcement-only scores.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const CAMPUS = {
    only: [[3, 9], [7, 8], [9, 6], [9, 4]],
    mixed: [[3, 9], [7, 9], [9, 8], [9, 8]]
  };
  let data = CAMPUS, mode = 'only', checkpoint = 0, timer = null;
  let guess = '', testedPrediction = false, solvedMix = false;

  const svg = s('svg', {
    viewBox: '0 0 420 340', role: 'img', 'aria-label': 'Test results and wrong answers over training'
  });
  const box = h('div'), note = h('div', { class: 'sim-note', role: 'status' }), ch = h('div');
  const step = btn('Step (+100)', advance, 'go');
  const play = btn('Play', toggle);
  const reset = btn('Reset', resetRun);
  const speed = h('input', {
    id: 'forgetting-speed', type: 'range', min: '1', max: '5', step: '1', value: '2',
    oninput: () => {
      const running = timer !== null;
      stop();
      if (running) schedule();
      render();
    }
  });
  const speedValue = h('span', { class: 'sim-note', style: { margin: 0 } });
  const mix = h('select', {
    id: 'forgetting-mix', class: 'sim-btn',
    onchange: () => {
      mode = mix.value;
      resetRun();
    }
  }, h('option', { value: 'only' }, 'Announcements only'),
  h('option', { value: 'mixed' }, '4 announcements + 1 general example'));
  const prediction = h('select', {
    id: 'forgetting-prediction', class: 'sim-btn',
    onchange: () => { guess = prediction.value; render(); }
  }, h('option', { value: '' }, 'Choose a prediction'),
  h('option', { value: 'hold-fall' }, 'New stays the same, old falls'),
  h('option', { value: 'both-hold' }, 'Both stay the same'),
  h('option', { value: 'both-rise' }, 'Both rise'));
  const predictRow = h('div', { class: 'sim-row' },
    h('label', { for: 'forgetting-prediction' }, 'Predict the change from step 200 to 300'), prediction);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: keep earlier skills'),
    h('p', { class: 'sub' }, 'Choose the training examples, then compare the two tests every 100 learning steps. Each test has 10 questions.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' }, step, play, reset),
        h('div', { class: 'sim-row' },
          h('label', { for: 'forgetting-speed' }, 'Speed'), speed, speedValue),
        h('div', { class: 'sim-row' },
          h('label', { for: 'forgetting-mix' }, 'Training examples'), mix),
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Campus example', () => load(CAMPUS))),
        predictRow),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const tasks = challenges(ch, [
    {
      text: 'With announcements only, predict the change from step 200 to 300 before you reach 300.',
      check: state => state.testedPrediction,
      why: 'The new score stays the same while the old score falls, so the old test reveals the damage.'
    },
    {
      text: 'Mix the examples and train to step 300 with at most two fewer correct old answers than at the start.',
      check: state => state.solvedMix,
      why: 'Practising earlier skills keeps the fall in the old score small.'
    },
    {
      text: 'Train on announcements only and stop at the first checkpoint with the same new score as step 300.',
      check: state => state.mode === 'only' && state.checkpoint > 0 && state.checkpoint < 3
        && state.scores[state.checkpoint][0] === state.scores[3][0]
        && state.scores.slice(0, state.checkpoint).every(pair => pair[0] < state.scores[3][0]),
      why: 'At that checkpoint the model has reached its final new score and still answers more old questions correctly.'
    }
  ]);

  function stop() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }
  function schedule() {
    timer = setTimeout(() => {
      timer = null;
      advance(false);
      if (checkpoint < 3) schedule();
      render();
    }, 1800 / Number(speed.value));
  }
  function toggle() {
    if (timer !== null) stop();
    else if (checkpoint < 3) schedule();
    render();
  }
  function advance(manual = true) {
    if (manual) stop();
    if (checkpoint >= 3) return;
    checkpoint++;
    const scores = data[mode];
    if (checkpoint === 3) {
      if (mode === 'only' && guess === 'hold-fall'
          && scores[2][0] === scores[3][0] && scores[2][1] > scores[3][1]) {
        testedPrediction = true;
      }
      if (mode === 'mixed' && scores[0][1] - scores[3][1] <= 2) solvedMix = true;
    }
    if (manual) render();
  }
  function resetRun() {
    stop();
    checkpoint = 0;
    guess = '';
    prediction.value = '';
    render();
  }
  function load(next) {
    data = next;
    resetRun();
  }
  function newData() {
    const newStart = rnd(1, 4), oldStart = rnd(8, 10);
    const newEnd = rnd(8, 10), newMiddle = rnd(newStart + 1, newEnd - 1);
    const firstDrop = rnd(1, 2), secondDrop = rnd(1, 2), thirdDrop = rnd(1, 2);
    const mixedDrop = rnd(1, 2);
    load({
      only: [[newStart, oldStart], [newMiddle, oldStart - firstDrop],
        [newEnd, oldStart - firstDrop - secondDrop],
        [newEnd, oldStart - firstDrop - secondDrop - thirdDrop]],
      mixed: [[newStart, oldStart], [newMiddle, oldStart],
        [newEnd, oldStart - 1], [newEnd, oldStart - mixedDrop]]
    });
  }

  const text = (content, x, y, color = C.ink, size = 16, anchor = 'start') =>
    s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Segoe UI, Arial, sans-serif' }, content);
  const line = (x1, y1, x2, y2, stroke, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });

  function resultRow(title, score, y, color) {
    const result = [
      text(title, 20, y, color, 17),
      text(`${score} / 10`, 400, y, color, 17, 'end')
    ];
    for (let i = 0; i < 10; i++) {
      const x = 20 + i * 38, correct = i < score, cell = correct ? C.green : C.pink;
      result.push(s('rect', {
        x, y: y + 8, width: 34, height: 23, rx: 4, fill: cell, 'fill-opacity': 0.16, stroke: cell
      }), text(correct ? '✓' : '×', x + 17, y + 25, cell, 15, 'middle'));
    }
    return result;
  }

  function plot(scores) {
    const left = 43, right = 392, top = 174, bottom = 294;
    const x = i => left + i * (right - left) / 3;
    const y = n => bottom - (bottom - top) * n / 10;
    const elements = [
      text('Wrong answers out of 10', 20, 142, C.ink, 16),
      text('New skills', 105, 162, C.cyan, 14),
      text('Old skills', 235, 162, C.violet, 14),
      line(left, top, left, bottom, C.muted),
      line(left, bottom, right, bottom, C.muted),
      text('Training step', 217, 334, C.muted, 14, 'middle')
    ];
    [0, 5, 10].forEach(n => elements.push(
      line(left, y(n), right, y(n), C.line),
      text(String(n), left - 8, y(n) + 5, C.muted, 14, 'end')
    ));
    for (let i = 0; i <= 3; i++) {
      elements.push(text(String(i * 100), x(i), 314, C.muted, 14, 'middle'));
    }
    const history = scores.slice(0, checkpoint + 1);
    [C.cyan, C.violet].forEach((color, k) => {
      const points = history.map((pair, i) => [x(i), y(10 - pair[k])]);
      if (points.length > 1) {
        elements.push(s('polyline', {
          points: points.map(p => p.join(',')).join(' '), fill: 'none', stroke: color,
          'stroke-width': 3, 'stroke-linejoin': 'round',
          'stroke-dasharray': k ? '7 4' : null
        }));
      }
      points.forEach(([cx, cy]) => elements.push(s('circle', {
        cx, cy, r: k ? 5 : 3.5, fill: k ? C.card : color, stroke: color, 'stroke-width': 2
      })));
    });
    return elements;
  }

  const signed = n => n > 0 ? `+${n}` : String(n);

  function render() {
    const scores = data[mode], [newScore, oldScore] = scores[checkpoint];
    const [beforeNew, beforeOld] = scores[Math.max(0, checkpoint - 1)];
    const missedNew = 10 - newScore, missedOld = 10 - oldScore;
    const accuracy = oldScore * 10, lost = (scores[0][1] - oldScore) * 10;
    const running = timer !== null;
    step.disabled = checkpoint === 3;
    play.disabled = checkpoint === 3;
    play.textContent = running ? 'Pause' : 'Play';
    speedValue.textContent = `${speed.value} / 5`;
    prediction.disabled = checkpoint === 3 || mode === 'mixed';
    svg.setAttribute('aria-label', `Step ${checkpoint * 100}. New skills ${newScore} out of 10. Old skills ${oldScore} out of 10.`);
    svg.replaceChildren(
      ...resultRow('New skills', newScore, 24, C.cyan),
      ...resultRow('Old skills', oldScore, 77, C.violet),
      ...plot(scores)
    );

    const rows = [
      [`Learning step ${checkpoint * 100} / 300`, C.amber],
      [checkpoint ? `New: ${beforeNew} → ${newScore} (${signed(newScore - beforeNew)})` : `New: ${newScore} / 10`, C.cyan],
      [checkpoint ? `Old: ${beforeOld} → ${oldScore} (${signed(oldScore - beforeOld)})` : `Old: ${oldScore} / 10`, C.violet],
      `Wrong: ${missedNew} new, ${missedOld} old`,
      `Old accuracy = ${oldScore} ÷ 10 = ${accuracy}%`,
      `Old accuracy lost: ${lost} percentage points`
    ];
    fbox(box, rows);

    if (data === CAMPUS && mode === 'mixed' && checkpoint < 3) {
      note.textContent = 'The mixed scores at steps 100 and 200 are examples. The chapter gives the mixed result at step 300.';
    } else if (mode === 'only' && checkpoint === 3 && guess && guess !== 'hold-fall') {
      note.textContent = 'From step 200 to 300, the new score stayed the same and the old score fell.';
    } else {
      note.textContent = data === CAMPUS
        ? 'The curves count wrong answers on the two tests.'
        : 'These are random practice scores with the same pattern as the campus example.';
    }
    tasks.update({ testedPrediction, solvedMix, checkpoint, mode, scores });
  }

  render();
  return stop;
}

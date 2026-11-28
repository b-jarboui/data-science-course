// 17.1.7 Try it: change both routes with one shared weight.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const orange = '#fb923c';
  const colors = [C.cyan, C.violet];
  let corners = [1, 1];
  let weight = 2;
  let slopeDone = false, moveDone = false, prediction = '';
  let challengeIndex = 0;

  const picture = s('svg', { viewBox: '0 0 360 396', role: 'img' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const challengeHost = h('div');
  const feedback = h('p', { class: 'sim-note', 'aria-live': 'polite' });

  const cornerButtons = ['Left', 'Right'].map((side, i) =>
    btn(side, () => {
      corners[i] = 1 - corners[i];
      prediction = '';
      feedback.textContent = '';
      draw();
    }));
  const dial = h('input', {
    type: 'range', min: 0.5, max: 3, step: 0.25, value: 2,
    style: { width: '100%', minHeight: '44px', accentColor: C.amber },
    oninput: () => {
      weight = Number(dial.value);
      checkMove();
      draw();
    }
  });
  const dialLabel = h('span');

  function answerSelect(title, choices) {
    const field = h('select', {
      class: 'sim-btn',
      onchange: () => { feedback.textContent = ''; }
    }, h('option', { value: '' }, 'Choose an answer'),
    ...choices.map(([value, label]) => h('option', { value }, label)));
    const wrap = h('label', { class: 'sim-row' }, title, field);
    return { field, wrap };
  }

  const slopeAnswer = answerSelect('Shared slope', [['4', '+4'], ['8', '+8'], ['-8', '−8']]);
  const moveAnswer = answerSelect('Change in loss', [['rise', 'Rise'], ['fall', 'Fall'], ['same', 'Stay the same']]);
  const slopePanel = h('div', {}, slopeAnswer.wrap,
    h('div', { class: 'sim-row' }, btn('Check slope', checkSlope, 'go')));
  const movePanel = h('div', { hidden: true }, moveAnswer.wrap,
    h('div', { class: 'sim-row' }, btn('Record prediction', recordPrediction, 'go')));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it · One dial, two paths'),
    h('p', { class: 'sub' }, 'Tap either corner or move the shared weight. Both routes and the loss update as you go.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, picture,
        h('div', { class: 'sim-row' }, cornerButtons),
        h('label', { style: { display: 'block', marginTop: '.8rem', color: C.amber } }, dialLabel, dial),
        h('div', { class: 'sim-row' },
          btn('New data', () => {
            const tile = rnd(0, 3);
            corners = [Math.floor(tile / 2), tile % 2];
            clearPrediction();
            draw();
          }),
          btn('Reset', () => {
            corners = [1, 1];
            weight = 2;
            clearPrediction();
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost, slopePanel, movePanel, feedback)))));

  const chal = challenges(challengeHost, [
    {
      text: 'With the starting tile and weight 2, add the two route contributions and check your shared slope.',
      check: state => state.slopeDone,
      why: 'Each route contributes +4, so the slopes add to +8 at the shared weight.'
    },
    {
      text: 'At the starting tile and weight 2, predict whether the loss will rise or fall at weight 3, then move the slider to check.',
      check: state => state.moveDone,
      why: 'Both signals rise from 1 to 2, so the score falls to −3 and the loss rises from 4 to 16.'
    }
  ]);

  // The shared challenge widget owns navigation. Keep the answer controls
  // aligned with its active challenge after its buttons handle the click.
  function syncChallenge() {
    if (challengeIndex !== chal.index) feedback.textContent = '';
    challengeIndex = chal.index;
    slopePanel.hidden = challengeIndex !== 0;
    movePanel.hidden = challengeIndex !== 1;
    chal.update({ slopeDone, moveDone });
  }
  challengeHost.addEventListener('click', syncChallenge);

  const isBlueBlue = () => corners[0] === 1 && corners[1] === 1;
  const isStart = () => isBlueBlue() && weight === 2;
  const num = value => fmt(value).replace('-', '−');
  const signed = value => value > 0 ? `+${num(value)}` : num(value);

  function clearPrediction() {
    prediction = '';
    moveAnswer.field.value = '';
    slopeAnswer.field.value = '';
    feedback.textContent = '';
  }

  function checkSlope() {
    if (!isStart()) {
      feedback.textContent = 'Reset to the two blue corners and weight 2, then check the sum.';
    } else if (slopeAnswer.field.value === '8') {
      slopeDone = true;
      feedback.textContent = '';
      syncChallenge();
    } else if (slopeAnswer.field.value) {
      feedback.textContent = 'Both routes contribute +4. Add the two contributions at the dial.';
    } else {
      feedback.textContent = 'Choose a shared slope to check.';
    }
  }

  function recordPrediction() {
    if (!isStart()) {
      feedback.textContent = 'Reset to the two blue corners and weight 2 before recording your prediction.';
    } else if (!moveAnswer.field.value) {
      feedback.textContent = 'Choose what you think the loss will do.';
    } else {
      prediction = moveAnswer.field.value;
      feedback.textContent = 'Prediction recorded. Now move the shared weight to 3.';
    }
  }

  function checkMove() {
    if (challengeIndex !== 1 || !isBlueBlue() || weight !== 3 || moveDone) return;
    if (!prediction) {
      feedback.textContent = 'Move back to weight 2 to record a prediction first.';
    } else if (prediction === 'rise') {
      moveDone = true;
      feedback.textContent = '';
    } else {
      prediction = '';
      feedback.textContent = 'Both signals grew, moving the score farther from the target. The loss rose from 4 to 16. Return to 2 to try again.';
    }
  }

  function calculate() {
    const [left, right] = corners;
    const totals = [weight * left - right, weight * right - left];
    const signals = totals.map(total => Math.max(0, total));
    const score = 1 - signals[0] - signals[1];
    const target = Number(left === right);
    const error = score - target;
    const scoreSlope = 2 * error;
    const contributions = totals.map((total, i) => total > 0 ? -scoreSlope * corners[i] : 0);
    return {
      totals, signals, score, target, error, scoreSlope, contributions,
      loss: error ** 2,
      sharedSlope: contributions[0] + contributions[1]
    };
  }

  function drawPicture(st) {
    const nodes = [];
    const text = (x, y, str, fill = C.ink, size = 16) =>
      s('text', { x, y, fill, 'font-size': size, 'text-anchor': 'middle',
        'font-family': 'Consolas, monospace' }, str);
    const rect = (x, y, width, height, fill, stroke, rx = 0) =>
      s('rect', { x, y, width, height, fill, stroke, rx, 'stroke-width': 1.5 });

    function arrow(x1, y1, x2, y2, color) {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const bx = x2 - 8 * ux, by = y2 - 8 * uy;
      nodes.push(
        s('line', { x1, y1, x2: bx, y2: by, stroke: color, 'stroke-width': 2 }),
        s('polygon', {
          points: `${x2},${y2} ${bx - 4 * uy},${by + 4 * ux} ${bx + 4 * uy},${by - 4 * ux}`,
          fill: color
        }));
    }

    function card(cx, top, width, title, value, color) {
      nodes.push(rect(cx - width / 2, top, width, 49, C.bg, color, 8),
        text(cx, top + 18, title, color, 14),
        text(cx, top + 38, value, C.ink, 18));
    }

    const xs = [92, 268];
    for (let i = 0; i < corners.length; i++) {
      const cx = i === 0 ? 40 : 320;
      const color = corners[i] ? C.cyan : orange;
      nodes.push(corners[i]
        ? rect(cx - 12, 12, 24, 24, color, color, 2)
        : s('circle', { cx, cy: 24, r: 12, fill: color }));
      nodes.push(text(cx, 56, i === 0 ? 'Left' : 'Right', color, 14),
        text(cx, 75, num(corners[i]), color, 16));
    }

    card(180, 18, 144, 'Shared weight', num(weight), C.amber);
    xs.forEach((cx, i) => {
      const color = colors[i], total = st.totals[i];
      arrow(i === 0 ? 148 : 212, 67, cx, 104, color);
      nodes.push(rect(cx - 78, 104, 156, 72, C.bg, color, 8),
        text(cx, 124, i === 0 ? 'Left-only total' : 'Right-only total', color, 14),
        text(cx - 34, 154, signed(total), C.ink, 18));

      const zx = cx + 34, zy = 147, blockHeight = 6;
      for (let remaining = Math.abs(total), n = 0; remaining > 0; remaining -= 1, n++) {
        const fraction = Math.min(1, remaining);
        const y = total > 0 ? zy - (n + fraction) * blockHeight : zy + n * blockHeight;
        nodes.push(rect(zx - 9, y, 18, fraction * blockHeight, color, C.bg, 1));
      }
      nodes.push(s('line', { x1: zx - 16, y1: zy, x2: zx + 16, y2: zy, stroke: C.muted }),
        text(zx - 23, zy + 4, '0', C.muted, 12));

      arrow(cx, 176, cx, 198, color);
      card(cx, 198, 128, 'Gate signal', num(st.signals[i]), color);
      arrow(cx, 247, i === 0 ? 151 : 209, 275, color);
    });

    card(180, 275, 130, 'Score', num(st.score), C.green);
    arrow(180, 324, 180, 342, C.amber);
    card(180, 342, 164, 'Loss', num(st.loss), C.amber);

    picture.setAttribute('aria-label',
      `Left and right corners ${corners.join(' and ')}, shared weight ${num(weight)}, ` +
      `signals ${st.signals.map(num).join(' and ')}, score ${num(st.score)}, loss ${num(st.loss)}.`);
    picture.replaceChildren(...nodes);
  }

  function draw() {
    const st = calculate();
    const [left, right] = corners;
    const [leftSignal, rightSignal] = st.signals;
    const [leftSlope, rightSlope] = st.contributions;
    dial.value = String(weight);
    dialLabel.textContent = `Shared weight ${num(weight)}`;
    cornerButtons.forEach((button, i) => {
      button.textContent = `${i === 0 ? 'Left' : 'Right'} corner · ${corners[i] ? 'Blue' : 'Orange'}`;
      button.setAttribute('aria-label', `${button.textContent}. Tap to change color.`);
    });
    drawPicture(st);
    fbox(box, [
      [`Left total: ${num(weight)} × ${left} − ${right} = ${num(st.totals[0])}`, colors[0]],
      [`Right total: ${num(weight)} × ${right} − ${left} = ${num(st.totals[1])}`, colors[1]],
      `Score: 1 − ${num(leftSignal)} − ${num(rightSignal)} = ${num(st.score)}`,
      `Error: (${num(st.score)}) − ${st.target} = ${num(st.error)}`,
      [`Loss: (${num(st.error)}) × (${num(st.error)}) = ${num(st.loss)}`, C.amber],
      `Loss slope at score: ${signed(st.scoreSlope)}`,
      [`Left route: ${signed(leftSlope)}`, colors[0]],
      [`Right route: ${signed(rightSlope)}`, colors[1]],
      [`Shared slope: (${signed(leftSlope)}) + (${signed(rightSlope)}) = ${signed(st.sharedSlope)}`, C.green]
    ]);
    if (isBlueBlue() && weight === 1) {
      note.textContent = 'Both gates sit at their bend. The error is zero, so the squared loss is flat to first order.';
    } else if (isBlueBlue() && weight === 3) {
      note.textContent = 'The starting loss was 4. At weight 3, both gate signals are 2 and the loss is 16.';
    } else {
      note.textContent = 'A route contributes when its gate passes a change from the dial. Add the two contributions at the shared weight.';
    }
    syncChallenge();
  }

  draw();
  return () => challengeHost.removeEventListener('click', syncChallenge);
}

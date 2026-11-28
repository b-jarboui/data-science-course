// 17.1.5 Try it: follow the saved numbers from a tile to its loss.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const tiles = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const blue = '#60a5fa', orange = '#fb923c';
  let left = 1, right = 0, weight = 2;
  let locked = null, checked = false;

  const svg = s('svg', { viewBox: '0 0 360 442', role: 'img', 'aria-label': 'Computation graph' });
  const box = h('div');
  const challengeHost = h('div');
  const leftButton = btn('', () => { left = 1 - left; updateTile(); });
  const rightButton = btn('', () => { right = 1 - right; updateTile(); });
  const weightLabel = h('strong');
  const slider = h('input', {
    type: 'range', min: 0, max: 3, step: 1, value: 2,
    style: { width: '100%', minHeight: '44px', accentColor: C.cyan },
    oninput: event => {
      weight = Number(event.currentTarget.value);
      if (ch.index === 0 && isStartingTile() && weight === 3 && locked !== null) checked = true;
      draw();
    },
  });
  const pick = h('select', {
    'aria-label': 'Predicted loss at weight 3',
    style: { minHeight: '44px', color: C.ink, background: C.bg, border: '1px solid #536485', borderRadius: '.5rem' },
    onchange: () => { lock.disabled = pick.value === ''; },
  }, h('option', { value: '' }, 'Choose a loss'),
    [0, 1, 2, 4].map(n => h('option', { value: n }, n)));
  const feedback = h('div', { class: 'sim-note', role: 'status' });
  const lock = btn('Lock prediction', () => {
    locked = Number(pick.value);
    checked = false;
    draw();
  }, 'go');
  const prediction = h('div', { class: 'sim-row' }, pick, lock);
  const isStartingTile = () => left === 1 && right === 0;

  const ch = challenges(challengeHost, [
    {
      text: 'On the blue–orange tile, predict the loss at weight 3, then move the dial to 3.',
      check: st => st.checked && st.locked === st.loss && st.weight === 3 && st.startingTile,
      why: 'The score is −2 and the target is 0, so the loss is (−2) × (−2) = 4.',
    },
    {
      text: 'On the blue–orange tile, lower the left weight until the score hits the target.',
      check: st => st.startingTile && st.score === st.target && st.loss === 0,
      why: 'At weight 1, the score is 0 and matches the target, so squaring the error gives 0.',
    },
  ]);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: follow the loss'),
    h('p', { class: 'sub' }, 'Tap either corner to change its color, or move the left weight and follow the arrows to the loss.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, leftButton, rightButton),
        h('label', { style: { display: 'block', marginTop: '.8rem' } }, weightLabel, slider),
        h('div', { class: 'sim-row' },
          btn('New data', () => {
            [left, right] = tiles[rnd(0, tiles.length - 1)];
            updateTile();
          }, 'go'),
          btn('Reset', () => {
            [left, right] = tiles[2];
            weight = 2;
            updateTile();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeHost, prediction, feedback)))));

  function updateTile() {
    locked = null;
    checked = false;
    pick.value = '';
    draw();
  }

  function signed(n) {
    return n < 0 ? `−${Math.abs(n)}` : String(n);
  }

  function text(x, y, value, color, size, bold = false) {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'font-weight': bold ? 700 : 400,
      'font-family': 'Segoe UI, Arial, sans-serif', 'text-anchor': 'middle',
    }, value);
  }

  function node(x, y, title, value, color, kind) {
    const parts = [
      s('rect', { x: x - 49, y: y - 25, width: 98, height: 50, rx: 8, fill: C.card, stroke: color }),
      text(x, y - 6, title, C.ink, 13, true),
      text(x + (kind === 'corner' ? 9 : kind === 'total' ? -21 : 0), y + 15, signed(value), color, 16, true),
    ];
    if (kind === 'corner') {
      parts.push(value
        ? s('rect', { x: x - 16, y: y + 4, width: 11, height: 11, fill: color })
        : s('circle', { cx: x - 10, cy: y + 10, r: 5.5, fill: color }));
    }
    if (kind === 'total') {
      const zero = x + 13;
      parts.push(s('line', { x1: zero, x2: zero, y1: y + 2, y2: y + 19, stroke: C.muted }));
      for (let i = 0; i < Math.abs(value); i++) {
        const offset = value < 0 ? -9 - i * 8 : 2 + i * 8;
        parts.push(s('rect', { x: zero + offset, y: y + 6, width: 6, height: 10, rx: 1, fill: color }));
      }
    }
    return s('g', {}, parts);
  }

  function wire(points, color) {
    const [x, y] = points.at(-1), [px, py] = points.at(-2);
    const angle = Math.atan2(y - py, x - px);
    const wing = a => `${x - 7 * Math.cos(angle + a)},${y - 7 * Math.sin(angle + a)}`;
    return s('g', {},
      s('polyline', { points: points.map(p => p.join(',')).join(' '), fill: 'none', stroke: color, 'stroke-width': 1.5 }),
      s('polygon', { points: `${x},${y} ${wing(0.49)} ${wing(-0.49)}`, fill: color }));
  }

  function draw() {
    const leftProduct = weight * left;
    const rightProduct = -right;
    const leftTotal = leftProduct - right;
    const rightTotal = right - left;
    const leftGate = Math.max(0, leftTotal);
    const rightGate = Math.max(0, rightTotal);
    const score = 1 - leftGate - rightGate;
    const target = Number(left === right);
    const error = score - target;
    const loss = error ** 2;
    const leftColor = left ? blue : orange, rightColor = right ? blue : orange;

    svg.setAttribute('aria-label', `Computation graph. Left ${left}, right ${right}, left weight ${weight}, score ${score}, target ${target}, error ${error}, loss ${loss}.`);
    svg.replaceChildren(
      wire([[64, 62], [64, 86]], leftColor),
      wire([[180, 62], [180, 86]], rightColor),
      wire([[64, 12], [64, 4], [351, 4], [351, 111], [345, 111]], leftColor),
      wire([[229, 37], [238, 37], [238, 100], [247, 100]], rightColor),
      wire([[64, 136], [64, 160]], blue),
      wire([[180, 136], [90, 160]], orange),
      wire([[64, 210], [64, 234]], blue),
      wire([[296, 136], [296, 160]], C.violet),
      wire([[113, 259], [131, 259]], blue),
      wire([[296, 210], [204, 234]], C.violet),
      wire([[180, 284], [180, 308]], C.pink),
      wire([[296, 284], [205, 308]], C.green),
      wire([[180, 358], [180, 382]], C.amber),
      node(64, 37, 'Left corner', left, leftColor, 'corner'),
      node(180, 37, 'Right corner', right, rightColor, 'corner'),
      node(64, 111, `${left} × ${weight}`, leftProduct, blue),
      node(180, 111, `${right} × (−1)`, rightProduct, orange),
      node(64, 185, 'Left total', leftTotal, blue, 'total'),
      node(296, 111, 'Right total', rightTotal, C.violet, 'total'),
      node(64, 259, 'Left gate', leftGate, blue),
      node(296, 185, 'Right gate', rightGate, C.violet),
      node(180, 259, 'Score', score, C.pink),
      node(296, 259, 'Target', target, C.green),
      node(180, 333, 'Signed error', error, C.amber),
      node(180, 407, 'Loss', loss, C.violet),
    );

    fbox(box, [
      `Left total = ${leftProduct} − ${right} = ${signed(leftTotal)}`,
      `Right total = ${right} − ${left} = ${signed(rightTotal)}`,
      `Gates pass ${leftGate} and ${rightGate}`,
      [`Score = 1 − ${leftGate} − ${rightGate} = ${signed(score)}`, C.pink],
      [`Target = ${target} (${target ? 'match' : 'different'})`, C.green],
      [`Error = ${signed(score)} − ${target} = ${signed(error)}`, C.amber],
      [`Loss = (${signed(error)}) × (${signed(error)}) = ${loss}`, C.violet],
    ]);

    leftButton.textContent = `Left · ${left ? 'Blue (1)' : 'Orange (0)'}`;
    rightButton.textContent = `Right · ${right ? 'Blue (1)' : 'Orange (0)'}`;
    slider.value = String(weight);
    weightLabel.textContent = `Left weight · ${weight}`;

    ch.update({ checked, locked, weight, startingTile: isStartingTile(), score, target, loss });
    refreshPrediction();
  }

  function refreshPrediction() {
    const active = ch.index === 0;
    prediction.style.display = active ? '' : 'none';
    feedback.textContent = '';
    pick.disabled = lock.disabled = true;
    if (!active) return;
    if (!isStartingTile()) {
      feedback.textContent = 'Set the left corner to blue and the right corner to orange.';
    } else if (weight === 3) {
      if (!checked) feedback.textContent = 'Move the weight back below 3 to lock a prediction first.';
      else if (locked !== 4) feedback.textContent = 'The score is −2. Squaring that error gives 4. Move the dial back to try again.';
    } else {
      pick.disabled = false;
      lock.disabled = pick.value === '';
      if (locked !== null) feedback.textContent = `Prediction locked at ${locked}. Move the left weight to 3 to check.`;
    }
  }

  const afterNavigation = () => queueMicrotask(draw);
  challengeHost.addEventListener('click', afterNavigation);
  draw();
  return () => challengeHost.removeEventListener('click', afterNavigation);
}

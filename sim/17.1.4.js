// 17.1.4 Try it: follow a tile through the two layers.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const BLUE = '#62a5ff', ORANGE = '#ff9c57';
  const START = [1, 0];
  const names = ['Left', 'Right'];
  const colorName = n => n === 1 ? 'blue' : 'orange';
  const signed = n => n < 0 ? `−${Math.abs(n)}` : String(n);
  let tile = START.slice(), challengeIndex = 0;
  let pendingPass = false, followed = false, guess = null, feedback = '';

  const svg = s('svg', { viewBox: '0 0 360 330', role: 'img' });
  const box = h('div');
  const challengeHost = h('div');
  const response = h('div', { class: 'sim-note' });
  const status = h('div', { class: 'sim-note', role: 'status' });
  const cornerButtons = names.map((_, i) => btn('', () => flip(i)));
  const guesses = [0, 1].map(n => btn(String(n), () => {
    guess = n;
    followed = false;
    feedback = '';
    if (challengeIndex === 0) {
      if (!isMixed()) feedback = 'Set the left corner to blue and the right corner to orange first.';
      else if (n !== 0) feedback = 'The right-only total is −1. What does ReLU send out when the total is below zero?';
    }
    draw();
  }));
  const followButton = btn('Follow arrows', follow, 'go');

  const sim = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: follow a tile'),
    h('p', { class: 'sub' }, 'Change either corner to see what the two boxes send to the match score.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, ...cornerButtons,
          btn('New data', () => {
            const row = rnd(0, 3);
            setTile([Math.floor(row / 2), row % 2]);
          }),
          btn('Reset', () => setTile(START.slice())))),
      h('div', {},
        h('div', { class: 'sim-card', 'aria-live': 'polite' }, box),
        h('div', { class: 'sim-card' }, challengeHost,
          response, h('div', { class: 'sim-row' }, ...guesses, followButton), status))));
  root.append(sim);

  const chal = challenges(challengeHost, [
    {
      text: 'Set blue on the left and orange on the right. What leaves the right-only box?',
      check: st => st.mixed && st.guess === st.rightSignal,
      why: 'The right-only total is −1, so its ReLU gate sends out 0.',
    },
    {
      text: 'Start with blue–orange, turn the right corner blue, then predict the match score before you follow the arrows.',
      check: st => st.followed && st.guess === st.score,
      why: 'With two blue corners, both gates send 0, so the score box keeps its one block.',
    },
  ]);

  challengeHost.addEventListener('click', () => {
    if (challengeIndex === chal.index) return;
    challengeIndex = chal.index;
    pendingPass = false;
    followed = false;
    guess = null;
    feedback = '';
    draw();
  });

  function isMixed() {
    return tile[0] === 1 && tile[1] === 0;
  }

  function setTile(next, predict = false) {
    tile = next;
    pendingPass = predict;
    followed = false;
    guess = null;
    feedback = '';
    draw();
  }

  function flip(i) {
    const beginPrediction = challengeIndex === 1 && i === 1 && isMixed();
    const next = tile.slice();
    next[i] = 1 - next[i];
    setTile(next, beginPrediction);
  }

  function calculate() {
    const totals = [tile[0] - tile[1], tile[1] - tile[0]];
    const signals = totals.map(n => Math.max(0, n));
    return { totals, signals, score: 1 - signals[0] - signals[1] };
  }

  function follow() {
    if (!pendingPass || guess === null) return;
    const hit = guess === calculate().score;
    pendingPass = false;
    followed = true;
    feedback = hit ? '' : 'Both gates sent 0, so the starting block is still there. Set the right corner to orange, then blue, to try again.';
    draw();
  }

  function text(x, y, value, fill = C.ink, size = 15) {
    return s('text', {
      x, y, fill, 'font-size': size, 'font-weight': 700,
      'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif',
    }, value);
  }

  function rect(x, y, width, height, stroke, fill = C.bg, rx = 9) {
    return s('rect', { x, y, width, height, rx, stroke, fill });
  }

  function line(x1, y1, x2, y2, stroke = C.muted) {
    return s('line', { x1, y1, x2, y2, stroke, 'stroke-width': 1.8 });
  }

  function path(d, color) {
    return s('path', { d, stroke: color, 'stroke-width': 2, fill: 'none' });
  }

  function corner(x, value) {
    const color = value === 1 ? BLUE : ORANGE;
    const shape = value === 1
      ? rect(x - 9, 29, 18, 18, color, color, 2)
      : s('circle', { cx: x, cy: 38, r: 9, fill: color });
    return [shape, text(x, 65, String(value), color, 18)];
  }

  function drawPicture({ totals, signals, score }) {
    const gateWire = followed ? C.green : C.muted;
    const nodes = [
      s('title', {}, pendingPass
        ? `Left ${tile[0]}, right ${tile[1]}. Gates send ${signals.join(' and ')}. Match score awaits your prediction.`
        : `Left ${tile[0]}, right ${tile[1]}. Gates send ${signals.join(' and ')}. Match score ${score}.`),
      rect(116, 5, 128, 69, C.line),
      text(150, 22, 'Left'), text(210, 22, 'Right'),
      ...corner(150, tile[0]), ...corner(210, tile[1]),
      path('M180 74 V88 H90 V101 M180 88 H270 V101', C.cyan),
      path('M85 96 L90 101 L95 96 M265 96 L270 101 L275 96', C.cyan),
      path('M90 207 V220 H150 V237 M270 207 V220 H210 V237', gateWire),
      path('M145 232 L150 237 L155 232 M205 232 L210 237 L215 232', gateWire),
    ];

    [90, 270].forEach((x, i) => {
      const value = totals[i];
      const color = value < 0 ? C.pink : C.cyan;
      nodes.push(
        rect(x - 77, 101, 154, 106, C.line),
        text(x, 122, `${names[i]}-only`),
        text(x - 16, 154, `${tile[i]} − ${tile[1 - i]} = ${signed(value)}`, color),
        line(x + 36, 150, x + 57, 150),
        text(x + 64, 154, '0', C.muted, 11),
        rect(x - 55, 175, 110, 24, C.green),
        text(x, 192, `ReLU → ${signals[i]}`, C.green),
      );
      if (value !== 0) nodes.push(rect(x + 41, value > 0 ? 134 : 153, 11, 13, color, color, 1));
    });

    nodes.push(rect(91, 237, 178, 84, C.line), text(180, 260, 'Match score'));
    if (pendingPass) {
      nodes.push(text(180, 296, '?', C.amber, 24));
    } else {
      nodes.push(line(136, 289, 224, 289), text(180, 312, `Output  ${score}`, C.green, 18));
      if (score === 1) nodes.push(rect(166, 272, 28, 14, C.amber, C.amber, 2));
    }
    svg.replaceChildren(...nodes);
  }

  function draw() {
    const result = calculate();
    drawPicture(result);
    cornerButtons.forEach((button, i) => {
      const current = colorName(tile[i]);
      button.textContent = `${names[i]} is ${current}`;
      button.setAttribute('aria-label', `${names[i]} corner is ${current}. Change to ${colorName(1 - tile[i])}.`);
    });

    const [a, b] = result.signals;
    fbox(box, [
      [`Left-only gate  → ${a}`, C.cyan],
      [`Right-only gate → ${b}`, C.cyan],
      [`Match score = 1 − ${a} − ${b}`, C.ink],
      [pendingPass ? '= ?' : `= ${result.score}`, C.amber],
    ]);

    const predicting = challengeIndex === 1;
    response.textContent = !predicting ? 'Right-only signal'
      : pendingPass ? 'Predict the match score.'
      : 'Set blue on the left and orange on the right, then switch the right corner to blue.';
    guesses.forEach((button, n) => {
      button.disabled = predicting && !pendingPass;
      button.setAttribute('aria-pressed', String(n === guess));
      button.style.borderColor = n === guess ? C.cyan : '';
    });
    followButton.hidden = !predicting;
    followButton.disabled = !pendingPass || guess === null;
    status.textContent = feedback;
    chal.update({ mixed: isMixed(), guess, followed, rightSignal: b, score: result.score });
  }

  draw();
  return () => sim.remove();
}

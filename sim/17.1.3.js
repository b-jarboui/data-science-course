// 17.1.3 Try it: change either corner and follow the two clues to the score.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const ORANGE = '#fb923c', BLUE = '#60a5fa';
  const colors = [C.cyan, C.violet];
  const names = ['Left-only', 'Right-only'];
  const tiles = [[0, 0], [0, 1], [1, 0], [1, 1]];
  let selected = tiles[0], gated = true;
  const signed = n => n < 0 ? `−${-n}` : String(n);
  const colorName = n => n ? 'blue' : 'orange';
  const term = n => n < 0 ? `(${signed(n)})` : String(n);

  const svg = s('svg', { viewBox: '0 0 360 355', role: 'img' });
  const box = h('div', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const ch = h('div');

  function choose(tile) {
    selected = tile;
    draw();
  }

  const switches = ['Left', 'Right'].map((name, j) => btn(name, () => {
    const next = selected.slice();
    next[j] = 1 - next[j];
    choose(tiles.find(tile => tile[0] === next[0] && tile[1] === next[1]));
  }, 'go'));
  const gateButton = btn('ReLU gates on', () => {
    gated = !gated;
    draw();
  });
  const newData = btn('New data', () => {
    const others = tiles.filter(tile => tile !== selected);
    choose(others[rnd(0, others.length - 1)]);
  });
  const reset = btn('Reset', () => {
    gated = true;
    choose(tiles[0]);
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: two clues for a match'),
    h('p', { class: 'sub' }, 'Change either corner. Watch each box subtract the corner numbers and see what it sends to the match score.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, ...switches),
        h('div', { class: 'sim-row' }, gateButton, newData, reset)),
      h('div', {}, h('div', { class: 'sim-card' }, box), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Make a mixed tile where only the right-only box sends one.',
      check: st => st.left !== st.right && st.sent[0] === 0 && st.sent[1] === 1,
      why: 'The left difference is −1 and ReLU sends zero, while the right difference of 1 passes through.'
    },
    {
      text: 'Make a match with two blue corners and both boxes quiet.',
      check: st => st.left === 1 && st.right === 1 && st.sent.every(n => n === 0),
      why: 'Both boxes subtract one from one, so they each send zero and the match score stays at one.'
    },
    {
      text: 'Turn off ReLU and make a mixed tile that scores one.',
      check: st => !st.gated && st.left !== st.right && st.score === 1,
      why: 'The signed differences of 1 and −1 cancel, so subtracting them leaves the score at one.'
    }
  ]);

  function text(x, y, value, fill = C.ink, size = 15) {
    return s('text', {
      x, y, fill, 'font-size': size, 'text-anchor': 'middle',
      'font-family': 'Consolas, monospace'
    }, value);
  }

  function panel(x, y, width, height, stroke = C.line) {
    return s('rect', { x, y, width, height, rx: 10, fill: C.bg, stroke, 'stroke-width': 1.5 });
  }

  function corner(x, y, value) {
    return value
      ? s('rect', { x: x - 10, y: y - 10, width: 20, height: 20, rx: 1, fill: BLUE })
      : s('circle', { cx: x, cy: y, r: 10, fill: ORANGE });
  }

  function arrow(x1, y1, x2, y2, color) {
    return s('g', { fill: 'none', stroke: color, 'stroke-width': 1.8, 'stroke-linecap': 'round' },
      s('path', { d: `M ${x1} ${y1} L ${x2} ${y2} m -4 -5 l 4 5 l 4 -5` }));
  }

  function branch(x, j, total, output) {
    const color = colors[j];
    const zeroY = 173;
    const signColor = total < 0 ? C.pink : color;
    const signMark = total === 0
      ? text(x - 20, zeroY - 7, '0', color)
      : s('g', {},
        s('rect', {
          x: x - 44, y: total > 0 ? zeroY - 19 : zeroY + 3,
          width: 35, height: 16, rx: 2, fill: signColor
        }),
        text(x + 9, total > 0 ? zeroY - 6 : zeroY + 16, signed(total), signColor));
    return s('g', {},
      panel(x - 77, 111, 154, 145, color),
      text(x, 136, names[j], color, 17),
      s('line', { x1: x - 57, x2: x + 49, y1: zeroY, y2: zeroY, stroke: C.muted, 'stroke-dasharray': '4 3' }),
      text(x + 60, zeroY + 5, '0', C.ink, 12),
      signMark,
      text(x, 216, gated ? 'ReLU' : 'Gate off', C.ink, 13),
      s('rect', {
        x: x - 55, y: 224, width: 110, height: 24, rx: 5,
        fill: output === 0 ? C.bg : color, 'fill-opacity': output === 0 ? 1 : 0.17,
        stroke: output === 0 ? C.line : color
      }),
      text(x, 241, `Sends ${signed(output)}`, output === 0 ? C.ink : color, 14));
  }

  function draw() {
    const [left, right] = selected;
    const totals = [left - right, right - left];
    const sent = totals.map(total => gated ? Math.max(0, total) : total);
    const score = 1 - sent[0] - sent[1];
    const scoreColor = score ? C.green : C.amber;

    switches.forEach((button, j) => {
      const side = j === 0 ? 'Left' : 'Right';
      const current = colorName(selected[j]);
      button.textContent = `${side}: ${current}`;
      button.setAttribute('aria-label', `${side} corner is ${current}. Change to ${colorName(1 - selected[j])}.`);
    });
    gateButton.textContent = gated ? 'ReLU gates on' : 'ReLU gates off';
    gateButton.setAttribute('aria-label', 'ReLU gates');
    gateButton.setAttribute('aria-pressed', String(gated));

    svg.setAttribute('aria-label',
      `${colorName(left)} left corner and ${colorName(right)} right corner. Left-only sends ${sent[0]}. Right-only sends ${sent[1]}. Match score ${score}.`);
    svg.replaceChildren(
      panel(117, 14, 126, 70),
      corner(150, 38, left), corner(210, 38, right),
      text(150, 70, left, left ? BLUE : ORANGE),
      text(210, 70, right, right ? BLUE : ORANGE),
      arrow(132, 89, 90, 105, colors[0]), arrow(228, 89, 270, 105, colors[1]),
      branch(90, 0, totals[0], sent[0]), branch(270, 1, totals[1], sent[1]),
      arrow(90, 262, 126, 289, colors[0]), arrow(270, 262, 234, 289, colors[1]),
      panel(88, 294, 184, 45, scoreColor),
      text(180, 322, `Match score ${score}`, scoreColor, 18)
    );

    fbox(box, [
      [`Left-only:  ${left} − ${right} = ${signed(totals[0])}`, colors[0]],
      `  ${gated ? 'ReLU sends' : 'Sends'} ${signed(sent[0])}`,
      [`Right-only: ${right} − ${left} = ${signed(totals[1])}`, colors[1]],
      `  ${gated ? 'ReLU sends' : 'Sends'} ${signed(sent[1])}`,
      ['Match score', scoreColor],
      [`1 − ${term(sent[0])} − ${term(sent[1])} = ${score}`, scoreColor]
    ]);
    chal.update({ left, right, sent, score, gated });
  }

  draw();
}

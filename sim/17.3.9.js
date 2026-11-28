// 17.3.9 Try it: train the cutoff, then test the locked encoder on fresh tiles.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const CLEAN = Array(16).fill(4);
  const CHIPPED = CLEAN.map((v, i) => [6, 7, 10, 11].includes(i) ? 1 : v);
  const ORANGE = '#fb923c';
  const LIMIT = 12;
  const EXAMPLES = [
    { name: 'Clean example', base: CLEAN, chipped: false },
    { name: 'Chipped example', base: CHIPPED, chipped: true },
  ];

  function image(tile) {
    return tile.base.map((v, i) => tile.paint?.has(i) ? 1 : v);
  }

  function encode(values) {
    let strongest = { i: 0, left: values[0], right: values[1], score: 0 };
    values.forEach((left, i) => {
      if (i % 4 === 3) return;
      const right = values[i + 1];
      const score = Math.abs(left - right);
      if (score > strongest.score) strongest = { i, left, right, score };
    });
    return strongest;
  }

  const cleanScore = encode(CLEAN).score;
  const chipScore = encode(CHIPPED).score;
  const target = (cleanScore + chipScore) / 2;
  const error = value => Math.abs(value - target);
  const number = value => String(Number(value.toFixed(3)));
  const verdict = chipped => chipped ? 'Chipped' : 'Clean';
  const blank = () => ({ name: 'Fresh tile', base: CLEAN, chipped: false, paint: new Set() });
  const painted = () => ({ ...blank(), paint: new Set([1, 2, 5, 6]) });

  let fresh = blank();
  let selected = 0;
  let cutoff = 3.5;
  let history = [error(cutoff)];
  let last = null;
  let ran = false;
  let timer = null;

  const svg = s('svg', { viewBox: '0 0 360 286', role: 'group', 'aria-label': 'Tile, neural network, and training error' });
  const drawing = s('g', { 'aria-hidden': 'true', 'pointer-events': 'none' });
  const tiles = s('g', { role: 'group', 'aria-label': 'Editable fresh tile squares' });
  svg.append(drawing, tiles);
  const box = h('div');
  const note = h('div', { class: 'sim-note', role: 'status' });
  const challengeHost = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0 }, 'aria-live': 'polite' });

  const start = h('input', { type: 'range', min: 0, max: 4, step: 0.5, value: 3.5 });
  const rate = h('input', { type: 'range', min: 0.25, max: 2, step: 0.25, value: 0.5 });
  const speed = h('input', { type: 'range', min: 1, max: 5, step: 1, value: 2 });
  const startText = h('span');
  const rateText = h('span');
  const speedText = h('span');

  const choose = [
    btn('Clean example', () => select(0)),
    btn('Chipped example', () => select(1)),
    btn('Fresh tile', () => select(2)),
  ];
  const stepButton = btn('Step', () => { pause(); advance(); }, 'go');
  const playButton = btn('Play', toggle);
  const resetButton = btn('Reset', reset);
  const newButton = btn('New data', newData);
  const paintedButton = btn('Painted clean tile', () => {
    fresh = painted();
    select(2);
  });

  function control(name, input, value) {
    return h('label', { class: 'sim-row' }, h('span', {}, `${name} `, value), input);
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: transfer learning'),
    h('p', { class: 'sub' }, 'Train the cutoff using the two examples. Then test it on a fresh tile. Tap a fresh square to add or remove dark paint.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' }, ...choose),
        h('div', { class: 'sim-row' }, newButton, paintedButton),
        h('div', { class: 'sim-row' }, stepButton, playButton, resetButton, counter),
        control('Starting cutoff', start, startText),
        control('Learning rate', rate, rateText),
        control('Steps per second', speed, speedText)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    {
      text: 'Start at 3.5 with learning rate 0.5. Predict which way the cutoff moves, then press Step once.',
      check: st => st.iteration === 1 && st.cutoff === 2.5 && st.rate === 0.5,
      why: 'The cutoff moved down by 1 because half the gap from 3.5 to 1.5 is 1.',
    },
    {
      text: 'Start at 3.5 and reach zero error in one step by changing the learning rate.',
      check: st => st.iteration === 1 && st.loss === 0 && st.initial === 3.5,
      why: 'A learning rate of 1 moves the cutoff the whole way to the middle in one step.',
    },
    {
      text: 'Find a learning rate that keeps the error the same after two steps.',
      check: st => st.iteration >= 2 && st.loss === st.initialLoss && st.loss > 0,
      why: 'At learning rate 2, the cutoff crosses the middle and lands equally far away on every step.',
    },
    {
      text: 'Put the cutoff at 1.5 and find a fresh clean tile that the classifier calls chipped.',
      check: st => st.fresh && !st.actual && st.predicted && st.cutoff === 1.5,
      why: 'Dark paint makes a brightness jump of 3, so the locked encoder gives it the same score as a chip.',
    },
  ]);

  const TILE_X = 14;
  const TILE_Y = 34;
  const PITCH = 24;
  const cx = i => TILE_X + (i % 4) * PITCH;
  const cy = i => TILE_Y + Math.floor(i / 4) * PITCH;
  const hits = CLEAN.map((_, i) => {
    const hit = s('rect', {
      x: cx(i), y: cy(i), width: PITCH, height: PITCH, fill: 'transparent',
      role: 'button', tabindex: 0, style: 'cursor: pointer',
    });
    hit.addEventListener('click', () => togglePaint(i));
    hit.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      togglePaint(i);
    });
    return hit;
  });
  tiles.append(...hits);

  function select(index) {
    selected = index;
    draw();
  }

  function togglePaint(i) {
    if (selected !== 2 || fresh.base[i] === 1) return;
    if (fresh.paint.has(i)) fresh.paint.delete(i);
    else fresh.paint.add(i);
    draw();
  }

  function newData() {
    const base = CLEAN.slice();
    const chipped = rnd(0, 1) === 1;
    if (chipped) {
      const topLeft = 4 * rnd(0, 2) + rnd(0, 2);
      [0, 1, 4, 5].forEach(offset => { base[topLeft + offset] = 1; });
    }
    const paint = new Set();
    const available = base.flatMap((v, i) => v === 4 ? [i] : []);
    const count = rnd(0, 3);
    for (let i = 0; i < count; i++) {
      paint.add(available.splice(rnd(0, available.length - 1), 1)[0]);
    }
    fresh = { name: 'Fresh tile', base, chipped, paint };
    select(2);
  }

  function pause() {
    clearTimeout(timer);
    timer = null;
    ran = false;
    playButton.textContent = 'Play';
  }

  function reset() {
    pause();
    cutoff = Number(start.value);
    history = [error(cutoff)];
    last = null;
    draw();
  }

  function finished() {
    return history.length > LIMIT || history[history.length - 1] < 0.001;
  }

  function advance() {
    if (finished()) return;
    const old = cutoff;
    const change = Number(rate.value) * (target - old);
    cutoff = old + change;
    last = { old, change, before: error(old), after: error(cutoff) };
    history.push(last.after);
    if (finished()) pause();
    draw();
  }

  function schedule() {
    timer = setTimeout(() => {
      advance();
      if (ran) schedule();
    }, 1000 / Number(speed.value));
  }

  function toggle() {
    if (ran) {
      pause();
      return;
    }
    if (finished()) return;
    ran = true;
    playButton.textContent = 'Pause';
    schedule();
  }

  start.addEventListener('input', reset);
  rate.addEventListener('input', draw);
  speed.addEventListener('input', () => {
    if (ran) {
      clearTimeout(timer);
      schedule();
    }
    draw();
  });
  challengeHost.addEventListener('click', event => {
    if (event.target.closest('button')) draw();
  });

  const text = (value, x, y, fill = C.ink, size = 12, anchor = 'middle') =>
    s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, value);
  const line = (x1, y1, x2, y2, stroke = C.line, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });
  const circle = (x, y, r, stroke, fill = C.card) =>
    s('circle', { cx: x, cy: y, r, stroke, fill, 'stroke-width': 2 });

  function network(edge) {
    const columns = [139, 204, 266, 328];
    const mid = 79;
    const upper = 58;
    const lower = 100;
    const r = 14;
    const signed = edge.left - edge.right;
    return [
      s('rect', { x: 119, y: 33, width: 169, height: 91, rx: 8, fill: 'none', stroke: C.violet }),
      text('Locked encoder', 204, 24, C.violet),
      text('Cutoff', 328, 45, C.amber),
      line(columns[0] + r, upper, columns[1] - r, upper, C.cyan, 3),
      line(columns[0] + r, lower, columns[1] - r, upper, C.pink, 3),
      line(columns[0] + r, upper, columns[1] - r, lower, C.pink, 3),
      line(columns[0] + r, lower, columns[1] - r, lower, C.cyan, 3),
      line(columns[1] + r, upper, columns[2] - r, mid, C.muted, 2),
      line(columns[1] + r, lower, columns[2] - r, mid, C.muted, 2),
      line(columns[2] + r, mid, columns[3] - 19, mid, C.cyan, 2),
      ...[
        [columns[0], upper, edge.left, C.violet],
        [columns[0], lower, edge.right, C.violet],
        [columns[1], upper, signed, C.cyan],
        [columns[1], lower, -signed, C.cyan],
        [columns[2], mid, edge.score, C.amber],
        [columns[3], mid, number(cutoff), C.amber, 19],
      ].flatMap(([x, y, value, color, radius = r]) => [
        circle(x, y, radius, color), text(value, x, y + 4, C.ink, radius === r ? 13 : 10),
      ]),
    ];
  }

  function plot() {
    const left = 35;
    const right = 338;
    const top = 172;
    const bottom = 250;
    const x = i => left + (right - left) * i / LIMIT;
    const y = loss => bottom - (bottom - top) * loss / 3;
    return [
      text('Error: gap to the middle', left, 157, C.ink, 13, 'start'),
      ...[0, 1, 2, 3].flatMap(v => [
        line(left, y(v), right, y(v)),
        text(v, left - 9, y(v) + 4, C.muted, 11, 'end'),
      ]),
      line(left, top, left, bottom, C.muted),
      ...[0, 3, 6, 9, 12].map(i => text(i, x(i), bottom + 16, C.muted, 11)),
      text('Iteration', 186, 283, C.muted, 11),
      s('polyline', {
        points: history.map((loss, i) => `${x(i)},${y(loss)}`).join(' '),
        stroke: C.amber, 'stroke-width': 2, fill: 'none',
      }),
      ...history.map((loss, i) => s('circle', { cx: x(i), cy: y(loss), r: 3, fill: C.amber })),
    ];
  }

  function draw() {
    const tile = selected === 2 ? fresh : EXAMPLES[selected];
    const values = image(tile);
    const edge = encode(values);
    const predicted = edge.score > cutoff;
    const iteration = history.length - 1;

    choose.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    tiles.style.display = selected === 2 ? '' : 'none';
    hits.forEach((hit, i) => {
      const square = `Row ${Math.floor(i / 4) + 1}, column ${i % 4 + 1}`;
      hit.setAttribute('aria-label', `${square}, brightness ${values[i]}${tile.base[i] === 1 ? ', chip' : ''}`);
      hit.setAttribute('aria-pressed', String(Boolean(tile.paint?.has(i))));
      hit.setAttribute('aria-disabled', String(tile.base[i] === 1));
      hit.setAttribute('tabindex', tile.base[i] === 1 ? '-1' : '0');
    });
    drawing.replaceChildren(
      text(tile.name, 62, 24, C.ink, 11),
      ...values.flatMap((v, i) => [
        s('rect', { x: cx(i), y: cy(i), width: PITCH - 1, height: PITCH - 1, rx: 2,
          fill: v === 4 ? '#6dc3ca' : '#263050', stroke: C.line }),
        text(v, cx(i) + (PITCH - 1) / 2, cy(i) + 16, v === 4 ? C.bg : C.ink, 13),
      ]),
      s('rect', { x: cx(edge.i) - 1, y: cy(edge.i) - 1, width: 2 * PITCH + 1,
        height: PITCH + 1, rx: 3, fill: 'none', stroke: C.amber, 'stroke-width': 2 }),
      ...network(edge), ...plot(),
    );

    startText.textContent = start.value;
    rateText.textContent = rate.value;
    speedText.textContent = speed.value;
    counter.textContent = `Iteration ${iteration}`;
    stepButton.disabled = playButton.disabled = finished();

    const diff = edge.left - edge.right;
    const score = diff < 0
      ? `${edge.left} − ${edge.right} = ${diff}, size ${edge.score}`
      : `${edge.left} − ${edge.right} = ${edge.score}`;
    const rows = [
      `Biggest jump: ${score}`,
      [`${edge.score} ${predicted ? '>' : '≤'} ${number(cutoff)} → ${verdict(predicted)}`, predicted ? C.pink : C.cyan],
      `Middle: (${cleanScore} + ${chipScore}) ÷ 2 = ${target}`,
    ];
    if (last) {
      const sign = last.change < 0 ? '−' : '+';
      rows.push(
        `Step ${iteration}: ${number(last.old)} ${sign} ${number(Math.abs(last.change))} = ${number(cutoff)}`,
        [`Error: ${number(last.before)} → ${number(last.after)}`, C.amber],
      );
    } else {
      rows.push([`Starting error: ${number(history[0])}`, C.amber]);
    }
    fbox(box, rows);
    note.textContent = `Actual: ${verdict(tile.chipped)}. ${
      predicted === tile.chipped ? 'The prediction matches.' : 'The prediction misses.'
    }`;

    chal.update({
      iteration, cutoff, rate: Number(rate.value), initial: Number(start.value),
      initialLoss: history[0], loss: history[iteration], fresh: selected === 2,
      actual: tile.chipped, predicted,
    });
  }

  draw();
  return pause;
}

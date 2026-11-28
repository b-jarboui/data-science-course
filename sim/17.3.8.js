// 17.3.8 Try it: mirror and crop a tile, then train on either full view.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const TARGET = 100;
  const BRIGHT = '#347d91';
  const DARK = '#192645';
  const ORANGE = '#fb923c';
  const initialTile = { side: 'right', row: 1 };
  let tile = initialTile;
  let view = 'original';
  let weights = [100, 0];
  let iteration = 0;
  let history = [{ iteration, weights }];
  let last = null;
  let timer = null;

  const tileSvg = s('svg', { viewBox: '0 0 242 242', role: 'img' });
  const chartSvg = s('svg', { viewBox: '0 0 320 184', role: 'img' });
  const tilePanel = h('div', { style: { flex: '1 1 13rem', minWidth: 0, maxWidth: '19rem' } }, tileSvg);
  const chartPanel = h('div', { style: { flex: '1 1 16rem', minWidth: 0 } }, chartSvg);
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const counter = h('div', { class: 'sim-note', style: { margin: 0 }, 'aria-live': 'polite' });
  const challengePanel = h('div');

  const options = [
    ['original', btn('Original', () => select('original'))],
    ['mirror', btn('Mirror', () => select('mirror'), 'go')],
    ['crop', btn('Crop to 2 columns', () => select('crop'))],
  ];
  const stepButton = btn('Step', () => { pause(); step(); }, 'go');
  const playButton = btn('Play', togglePlay);
  const speed = h('input', {
    type: 'range', min: '1', max: '5', step: '1', value: '2',
    'aria-label': 'Speed', oninput: changeSpeed,
  });
  const rate = h('input', {
    type: 'range', min: '0', max: '250', step: '5', value: '50',
    'aria-label': 'Correction percent', oninput: () => { last = null; draw(); },
  });
  const rateValue = h('span');
  const speedValue = h('span');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: data augmentation'),
    h('p', { class: 'sub' }, 'Mirror a tile to move the chip. Train on the full tiles, then crop the original and see if its label still fits.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.65rem' } }, tilePanel, chartPanel),
        h('div', { class: 'sim-row' }, ...options.map(([, button]) => button), btn('New data', newData)),
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', reset), counter),
        h('div', { class: 'sim-row' }, h('label', {}, speedValue, ' ', speed)),
        h('div', { class: 'sim-row' }, h('label', {}, rateValue, ' ', rate))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const tasks = challenges(challengePanel, [
    {
      text: 'Mirror an original with a right chip, then press Step and make the error drop.',
      check: st => st.view === 'mirror' && st.last?.active === 1 && st.last.lossAfter < st.last.lossBefore,
      why: 'The mirrored chip is on the left, so one step can raise the left-chip weight and lower the error.',
    },
    {
      text: 'Crop an original with a right chip to columns 1 and 2 and check whether the label still fits.',
      check: st => st.view === 'crop' && st.darkCount === 0,
      why: 'The crop contains only bright pixels, so the original label “chipped” no longer fits.',
    },
    {
      text: 'Predict what fraction of the error would reach the target in one step, then reset on a left chip and try it.',
      check: st => st.iteration === 1 && st.last?.active === 1 && st.last.lossAfter === 0,
      why: 'Taking 100% of the error in this example moves the score from 0 straight to 100.',
    },
    {
      text: 'Reset on a left chip and find a correction that makes the error grow on the first step.',
      check: st => st.iteration === 1 && st.last?.active === 1 && st.last.lossAfter > st.last.lossBefore,
      why: 'Taking more than 200% of the error overshoots the target by more than the original gap.',
    },
  ]);

  function gridForView() {
    const grid = Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => {
      const chipRow = r === tile.row || r === tile.row + 1;
      const chipCol = tile.side === 'right' ? c >= 2 : c < 2;
      return chipRow && chipCol ? 1 : 4;
    }));
    if (view === 'mirror') return grid.map(row => row.slice().reverse());
    if (view === 'crop') return grid.map(row => row.slice(0, 2));
    return grid;
  }

  function hiddenValues(grid) {
    const [, left, right] = grid[tile.row];
    return [Math.max(0, left - right) / 3, Math.max(0, right - left) / 3];
  }

  const score = (hidden, w) => hidden[0] * w[0] + hidden[1] * w[1];
  const delay = () => 1650 / Number(speed.value);
  const number = value => Math.abs(value) >= 10000 ? value.toExponential(2) : fmt(value);

  function select(next) {
    if (view === next) return;
    pause();
    view = next;
    last = null;
    draw();
  }

  function pause() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function reset() {
    pause();
    weights = [100, 0];
    iteration = 0;
    history = [{ iteration, weights }];
    last = null;
    draw();
  }

  function newData() {
    const variants = ['left', 'right'].flatMap(side => [0, 1, 2].map(row => ({ side, row })));
    const choices = variants.filter(v => v.side !== tile.side || v.row !== tile.row);
    tile = choices[rnd(0, choices.length - 1)];
    view = 'original';
    reset();
  }

  function step() {
    if (view === 'crop') return;
    const hidden = hiddenValues(gridForView());
    const active = hidden.indexOf(1);
    const guess = score(hidden, weights);
    const error = TARGET - guess;
    const fraction = Number(rate.value) / 100;
    const change = error * fraction;
    const oldWeight = weights[active];
    const newWeight = oldWeight + change;
    if (!Number.isFinite(newWeight)) {
      pause();
      draw();
      return;
    }
    weights = weights.map((w, index) => index === active ? newWeight : w);
    const after = score(hidden, weights);
    const lossBefore = Math.abs(error), lossAfter = Math.abs(TARGET - after);
    last = { active, guess, error, fraction, change, oldWeight, newWeight, after, lossBefore, lossAfter };
    iteration++;
    history = [...history.slice(-11), { iteration, weights }];
    if (lossAfter < 0.005 || lossAfter > 1000 || fraction === 0) pause();
    draw();
  }

  function togglePlay() {
    if (view === 'crop') return;
    if (timer !== null) {
      pause();
      draw();
      return;
    }
    timer = setInterval(step, delay());
    step();
  }

  function changeSpeed() {
    if (timer !== null) {
      pause();
      timer = setInterval(step, delay());
    }
    draw();
  }

  function svgText(value, x, y, color = C.ink, size = 15, anchor = 'middle') {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace',
    }, value);
  }

  function drawTile(grid) {
    const width = grid[0].length;
    const title = { original: 'Original', mirror: 'Mirror', crop: 'Crop of original' }[view];
    const points = [];
    const x = c => 25 + 51 * c;
    const y = r => 30 + 51 * r;
    for (let c = 0; c < width; c++) points.push(svgText(c + 1, x(c) + 23, 20, C.muted));
    grid.forEach((row, r) => {
      points.push(svgText(r + 1, 15, y(r) + 29, C.muted));
      row.forEach((value, c) => {
        const bright = value === 4;
        points.push(s('rect', {
          x: x(c), y: y(r), width: 46, height: 46, rx: 4,
          fill: bright ? BRIGHT : DARK, stroke: bright ? C.cyan : C.violet,
        }), svgText(value, x(c) + 23, y(r) + 30, C.ink, 22));
      });
    });
    tileSvg.setAttribute('aria-label', `${title} tile. Rows ${grid.map(row => row.join(', ')).join(' / ')}.`);
    tileSvg.replaceChildren(...points);
  }

  function drawChart(hidden) {
    const errors = history.map(entry => Math.abs(TARGET - score(hidden, entry.weights)));
    const peak = Math.max(TARGET, ...errors);
    const x0 = 54, x1 = 302, y0 = 141, y1 = 34;
    const first = history[0].iteration;
    const x = i => x0 + (x1 - x0) * i / Math.max(5, errors.length - 1);
    const y = error => y0 - (y0 - y1) * (error / peak);
    const coord = errors.map((error, i) => [x(i), y(error)]);
    const elements = [svgText('Error on this tile', (x0 + x1) / 2, 19, C.amber, 16)];
    for (const level of [0, peak / 2, peak]) {
      elements.push(s('line', { x1: x0, y1: y(level), x2: x1, y2: y(level), stroke: C.line }),
        svgText(number(level), x0 - 7, y(level) + 4, C.muted, 13, 'end'));
    }
    elements.push(
      s('line', { x1: x0, y1, x2: x0, y2: y0, stroke: C.muted }),
      s('line', { x1: x0, y1: y0, x2: x1, y2: y0, stroke: C.muted }),
      s('polyline', { points: coord.map(point => point.join(',')).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 3 }),
      ...coord.map(([cx, cy]) => s('circle', { cx, cy, r: 3.4, fill: C.amber })),
      svgText(first, x0, y0 + 19, C.muted, 13),
      svgText('Training step', (x0 + x1) / 2, 180, C.muted, 14),
    );
    if (iteration > first) elements.push(svgText(iteration, x(errors.length - 1), y0 + 19, C.muted, 13));
    chartSvg.setAttribute('aria-label', `Error on this tile from step ${first} through step ${iteration}. Latest error ${number(errors.at(-1))}.`);
    chartSvg.replaceChildren(...elements);
  }

  function draw() {
    const grid = gridForView();
    const crop = view === 'crop';
    const darkCount = grid.flat().filter(pixel => pixel === 1).length;
    const correction = Number(rate.value);
    for (const [name, button] of options) button.setAttribute('aria-pressed', String(name === view));
    stepButton.disabled = crop;
    playButton.disabled = crop;
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    chartPanel.hidden = crop;
    counter.textContent = `Training steps ${iteration}`;
    rateValue.textContent = `Correction ${correction}%`;
    speedValue.textContent = `Speed ${speed.value} of 5`;
    drawTile(grid);

    if (crop) {
      fbox(box, [
        'Keep original columns 1 and 2',
        `Dark squares = ${darkCount}`,
        [darkCount ? 'Label “chipped” still fits' : 'Label “chipped” no longer fits', darkCount ? C.green : C.pink],
      ]);
      note.textContent = darkCount
        ? 'The crop still contains the chip.'
        : 'Every remaining square is bright. The crop removed the chip.';
    } else {
      const hidden = hiddenValues(grid);
      const guess = score(hidden, weights);
      drawChart(hidden);
      if (last) {
        const side = last.active === 0 ? 'Right' : 'Left';
        fbox(box, [
          `Step ${iteration} · old guess ${number(last.guess)}`,
          `Error = 100 − (${number(last.guess)}) = ${number(last.error)}`,
          [`Change = ${number(last.error)} × ${number(last.fraction)} = ${number(last.change)}`, ORANGE],
          `${side} weight = ${number(last.oldWeight)} + (${number(last.change)}) = ${number(last.newWeight)}`,
          [`New guess ${number(last.after)} · error size ${number(last.lossAfter)}`, C.amber],
        ]);
      } else {
        fbox(box, [
          'Label chipped · target 100',
          `Right neuron ${hidden[0]} · left neuron ${hidden[1]}`,
          [`${hidden[0]} × ${number(weights[0])} + ${hidden[1]} × ${number(weights[1])} = ${number(guess)}`, C.amber],
        ]);
      }
      note.textContent = 'The plot shows the size of the gap from 100 for the tile you are viewing.';
    }
    tasks.update({ view, darkCount, iteration, last });
  }

  draw();
  return pause;
}

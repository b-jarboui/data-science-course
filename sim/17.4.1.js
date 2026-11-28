// Try it: run a recurrent network one reading at a time with fixed weights.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [21, 22, 21, 23, 24];
  const TIMES = ['9:00', '9:10', '9:20', '9:30', '9:40'];
  const LAST = TIMES.length - 1;
  let readings = START.slice();
  let steps = 0;
  let timer = null;

  const num = v => String(Number(v.toFixed(6)));
  const picture = s('svg', { viewBox: '0 0 380 204', role: 'img', 'aria-label': 'Recurrent network and its values' });
  const chart = s('svg', { viewBox: '0 0 380 192', role: 'img', 'aria-label': 'Forecast loss by step' });
  const box = h('div');
  const challengePanel = h('div');
  const counter = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const keepLabel = h('span');
  const speedLabel = h('span');
  const keep = h('input', { type: 'range', min: 0, max: 1, step: 0.25, value: 0.5, oninput: draw });
  const speed = h('input', {
    type: 'range', min: 0.5, max: 3, step: 0.5, value: 1,
    oninput: () => {
      if (timer !== null) {
        stop();
        start();
      }
      draw();
    }
  });
  const stepButton = btn('Step', () => { stop(); advance(); }, 'go');
  const playButton = btn('Play', () => {
    if (timer === null) start();
    else stop();
    draw();
  });
  const readingLabels = TIMES.map(() => h('span'));
  const sliders = readings.map((v, i) => h('input', {
    type: 'range', min: 20, max: 30, step: 1, value: v,
    oninput: e => { readings[i] = Number(e.target.value); draw(); }
  }));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: a memory for readings'),
    h('p', { class: 'sub' }, 'Change Central’s temperatures or the share of the old state to keep. Press Step to use one reading and forecast the next.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, picture, counter,
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', () => { stop(); steps = 0; draw(); }),
          btn('New data', () => {
            stop();
            const next = readings.map(() => rnd(20, 30));
            if (next.every((v, i) => v === readings[i])) next[0] = 20 + (next[0] - 19) % 11;
            readings = next;
            sliders.forEach((slider, i) => { slider.value = readings[i]; });
            steps = 0;
            draw();
          })),
        h('div', { class: 'sim-row' },
          h('label', {}, keepLabel, h('br'), keep),
          h('label', {}, speedLabel, h('br'), speed)),
        h('div', { class: 'sim-row' },
          sliders.map((slider, i) => h('label', {}, readingLabels[i], h('br'), slider)))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, chart),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const exercises = challenges(challengePanel, [
    {
      text: 'Keep half the old state and make the state at 9:10 exactly 2.5.',
      check: st => st.keep === 0.5 && st.history[1]?.state === 2.5,
      why: 'Half the first state plus the second reading above 20 gives 2.5.'
    },
    {
      text: 'With some memory, make 9:00 and 9:20 match in temperature and differ in state.',
      check: st => st.keep > 0 && st.history.length >= 3
        && st.readings[0] === st.readings[2] && st.history[0].state !== st.history[2].state,
      why: 'The second state still contributes to the third state, so two equal readings can give different states.'
    },
    {
      text: 'Keep none of the old state and make matching 9:00 and 9:20 readings give the same state.',
      check: st => st.keep === 0 && st.history.length >= 3 && st.readings[0] === st.readings[2]
        && st.history[0].state === st.history[2].state,
      why: 'When the loop keeps zero, the state equals the current reading above 20.'
    }
  ]);
  challengePanel.addEventListener('click', e => {
    if (e.target.closest('.sim-ch-nav button')) draw();
  });

  function run(count) {
    let state = 0;
    return readings.slice(0, count).map((reading, i) => {
      const input = reading - 20;
      const old = state;
      const kept = Number(keep.value) * old;
      state = kept + input;
      const output = 0.5 * state;
      const forecast = 20 + output;
      const actual = readings[i + 1];
      const error = forecast - actual;
      const loss = 0.5 * error ** 2;
      return { i, input, old, kept, state, output, forecast, actual, error, loss };
    });
  }

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function advance() {
    steps = Math.min(LAST, steps + 1);
    if (steps === LAST) stop();
    draw();
  }

  function start() {
    if (steps === LAST) steps = 0;
    timer = setInterval(advance, 1000 / Number(speed.value));
  }

  const label = (x, y, value, color = C.ink, size = 15, extra = {}) => s('text', {
    x, y, fill: color, 'font-size': size, 'font-family': 'Consolas, monospace', 'text-anchor': 'middle', ...extra
  }, value);
  const seg = (x1, y1, x2, y2, stroke, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });

  function drawNetwork(row) {
    const xs = [58, 190, 322];
    const y = 88;
    const w = Number(keep.value);
    const loopColor = w === 0 ? C.muted : C.cyan;
    const nodes = [
      ['Input', row ? num(row.input) : '–', C.cyan],
      ['Hidden state', row ? num(row.state) : '0', C.violet],
      ['Forecast', row ? num(row.output) : '–', C.amber]
    ];
    const readingCards = readings.flatMap((reading, i) => {
      const x = 5 + i * 74;
      const active = row?.i === i;
      const target = row?.i + 1 === i;
      const color = active ? C.cyan : target ? C.amber : C.line;
      return [
        s('rect', { x, y: 151, width: 70, height: 44, rx: 7, fill: C.bg, stroke: color, 'stroke-width': active || target ? 2 : 1 }),
        label(x + 35, 168, TIMES[i], C.muted, 13),
        label(x + 35, 187, `${reading}°C`, target ? C.amber : C.cyan, 16)
      ];
    });
    const grid = [34, 72, 110, 148].map(gy => seg(6, gy, 374, gy, C.line));
    picture.replaceChildren(
      ...grid,
      seg(88, y, 160, y, C.cyan, 5.5),
      seg(220, y, 292, y, C.cyan, 3.5),
      s('path', {
        d: 'M 171 65 L 151 52 L 151 34 L 229 34 L 229 52 L 209 65 L 215 54 M 209 65 L 222 63',
        fill: 'none', stroke: loopColor, 'stroke-width': 1.5 + 4 * w
      }),
      label(124, 76, '×1', C.cyan, 14),
      label(190, 23, `Loop ×${num(w)}`, loopColor, 14),
      label(256, 76, '×0.5', C.cyan, 14),
      ...nodes.flatMap(([name, value, color], i) => [
        s('circle', { cx: xs[i], cy: y, r: 30, fill: C.bg, stroke: color, 'stroke-width': 2.5 }),
        label(xs[i], y + 5, value.length > 6 ? `≈${Number(Number(value).toFixed(3))}` : value,
          color, value.length > 4 ? 13 : 17),
        label(xs[i], 137, name, color)
      ]),
      ...readingCards
    );
  }

  function drawChart(history) {
    const x0 = 54, right = 362, top = 32, bottom = 139;
    const maximum = Math.max(1, Math.ceil(Math.max(0, ...history.map(row => row.loss))));
    const x = step => x0 + (right - x0) * (step - 1) / (LAST - 1);
    const y = value => bottom - (bottom - top) * value / maximum;
    const guides = [0, maximum / 2, maximum].flatMap(value => [
      seg(x0, y(value), right, y(value), C.line),
      label(x0 - 8, y(value) + 5, num(value), C.muted, 13, { 'text-anchor': 'end' })
    ]);
    const ticks = TIMES.slice(0, LAST).map((_, i) => label(x(i + 1), bottom + 19, i + 1, C.muted, 13));
    const points = history.map((row, i) => [x(i + 1), y(row.loss)]);
    const curve = s('polyline', { points: points.map(p => p.join(',')).join(' '),
      fill: 'none', stroke: C.amber, 'stroke-width': 2.5 });
    const dots = points.map(([cx, cy], i) => s('circle', {
      cx, cy, r: 4.5, fill: C.amber
    }, s('title', {}, `Step ${i + 1}, loss ${num(history[i].loss)}`)));
    chart.replaceChildren(label(x0, 20, 'Forecast loss', C.ink, 15, { 'text-anchor': 'start' }),
      ...guides, seg(x0, top, x0, bottom, C.muted), seg(x0, bottom, right, bottom, C.muted),
      ...ticks, curve, ...dots, label((x0 + right) / 2, 180, 'Step', C.muted, 13));
  }

  function draw() {
    const history = run(steps);
    const row = history[history.length - 1];
    const w = Number(keep.value);
    const next = run(1)[0];
    counter.textContent = `Step ${steps} of ${LAST}`;
    keepLabel.textContent = `Old state to keep: ${Math.round(w * 100)}%`;
    speedLabel.textContent = `Speed: ${speed.value}×`;
    readingLabels.forEach((item, i) => { item.textContent = `${TIMES[i]} · ${readings[i]}°C`; });
    stepButton.disabled = steps === LAST;
    playButton.textContent = timer !== null ? 'Pause' : steps === LAST ? 'Play again' : 'Play';
    drawNetwork(row);
    drawChart(history);
    if (row) {
      const lossSymbol = Number(num(row.loss)) === row.loss ? '=' : '≈';
      fbox(box, [
        `Reading at ${TIMES[row.i]}: ${readings[row.i]} − 20 = ${num(row.input)}`,
        `Old state kept: ${num(w)} × ${num(row.old)} = ${num(row.kept)}`,
        [`New state: ${num(row.kept)} + ${num(row.input)} = ${num(row.state)}`, C.violet],
        `Output: 0.5 × ${num(row.state)} = ${num(row.output)}`,
        [`Forecast for ${TIMES[row.i + 1]}: 20 + ${num(row.output)} = ${num(row.forecast)}°C`, C.amber],
        `Reading at ${TIMES[row.i + 1]}: ${row.actual}°C`,
        `Error: ${num(row.forecast)} − ${row.actual} = ${num(row.error)}°C`,
        `Loss: 0.5 × (${num(row.error)})² ${lossSymbol} ${num(row.loss)}`
      ]);
    } else {
      fbox(box, [
        'Hidden state starts at 0.',
        `Next reading: ${readings[0]} − 20 = ${num(next.input)}`,
        `Next state: ${num(w)} × 0 + ${num(next.input)} = ${num(next.state)}`,
        'Press Step to see the next forecast and its loss.'
      ]);
    }
    exercises.update({ history, keep: w, readings });
  }

  draw();
  return stop;
}

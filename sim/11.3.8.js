// 11.3.8 Try it. Each updated estimate becomes the next forecast for a steady demand level.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const LESSON_READINGS = [58, 48, 53, 49, 51, 49, 50, 52];
  const LESSON_SETTINGS = { start: 50, first: 58, initialVariance: 4, tillVariance: 12 };
  const settings = { ...LESSON_SETTINGS };
  let readings = LESSON_READINGS.slice();
  let estimate, variance, current, history, prediction, firstPrediction, beganWithPlay;
  let speed = 1, timer = null, playing = false;

  const svg = s('svg', { viewBox: '0 0 380 309', role: 'img' });
  const formula = h('div'), hint = h('div', { class: 'sim-note' }), challengeHost = h('div');
  const counter = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const nextReading = h('div', { class: 'sim-note' });
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', togglePlay);
  const predictForecast = btn('Closer to 50', () => predict('forecast'));
  const predictTill = btn('Closer to 58', () => predict('till'));

  function slider(name, min, max, value, onChange, increment = 1) {
    const readout = h('span', { 'aria-hidden': 'true' }, `${name} ${fmt(value)}`);
    const input = h('input', {
      type: 'range', min, max, step: increment, value, 'aria-label': name,
      style: { width: '100%', minHeight: '44px', accentColor: C.cyan },
      oninput: () => {
        const next = Number(input.value);
        update(next);
        onChange(next);
      }
    });
    const update = next => {
      input.value = next;
      readout.textContent = `${name} ${fmt(next)}${name === 'Speed' ? '×' : ''}`;
    };
    update(value);
    return { element: h('label', { style: { display: 'block' } }, readout, input), update };
  }

  const sliders = [
    ['start', 'Starting forecast', 36, 68],
    ['first', 'First till reading', 34, 72],
    ['initialVariance', 'Starting forecast variance', 1, 16],
    ['tillVariance', 'Assumed till variance', 0, 24]
  ].map(([key, label, min, max]) => ({
    key,
    ...slider(label, min, max, settings[key], value => {
      settings[key] = value;
      restart();
    })
  }));
  const speedSlider = slider('Speed', 0.5, 3, speed, value => {
    speed = value;
    if (playing) schedule();
  }, 0.5);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it — blend a forecast and a till reading'),
    h('p', { class: 'sub' },
      'Assume demand holds steady. Each updated estimate becomes the next forecast. Move a slider to restart with that setting.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, counter, nextReading,
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', restart),
          btn('New data', randomize), btn('Lesson data', restore)),
        speedSlider.element,
        ...sliders.map(control => control.element)),
      h('div', {},
        h('div', { class: 'sim-card' }, formula, hint),
        h('div', { class: 'sim-card' }, challengeHost,
          h('div', { class: 'sim-row' }, predictForecast, predictTill)))
    )
  ));

  const checker = challenges(challengeHost, [
    {
      text: 'On lesson data, predict whether the first update lands closer to 50 or 58, then press Play.',
      check: state => state.firstPrediction === 'forecast' && state.beganWithPlay && state.lessonStart,
      why: 'The forecast has the smaller variance, so the estimate moves only one quarter of the way toward 58.'
    },
    {
      text: 'Start with forecast variance 4 and till variance 12, then find the first update that brings expected loss to 2.',
      check: state => state.initialVariance === 4 && state.tillVariance === 12 &&
        state.history.slice(1).some(value => value <= 2 + 1e-9),
      why: 'The third reading is the first to bring expected loss down to 2.'
    },
    {
      text: 'Make the estimate copy two different till readings in a row.',
      check: state => state.tillVariance === 0 && state.copiedDifferentReadings,
      why: 'With till variance set to zero, the gain is 1 and every till reading becomes the estimate.'
    }
  ]);

  function at(index) {
    return index === 0 ? settings.first : readings[index];
  }

  function updateFor(forecast, forecastVariance, till) {
    const gap = till - forecast;
    // A till declared error-free is used directly, even after an earlier such reading.
    const gain = settings.tillVariance === 0 ? 1 : forecastVariance / (forecastVariance + settings.tillVariance);
    const move = gain * gap;
    return {
      forecast, forecastVariance, till, gap, gain, move,
      estimate: forecast + move,
      variance: forecastVariance * (1 - gain)
    };
  }

  function restart() {
    pause();
    estimate = settings.start;
    variance = settings.initialVariance;
    current = null;
    history = [variance];
    prediction = firstPrediction = null;
    beganWithPlay = false;
    render();
  }

  function setData(values, nextSettings) {
    readings = values;
    Object.assign(settings, nextSettings);
    sliders.forEach(control => control.update(settings[control.key]));
    restart();
  }

  function restore() {
    setData(LESSON_READINGS.slice(), LESSON_SETTINGS);
  }

  function randomize() {
    const demand = rnd(44, 60);
    const values = Array.from({ length: LESSON_READINGS.length }, () => demand + rnd(-6, 6));
    setData(values, { start: demand + rnd(-4, 4), first: values[0] });
  }

  function predict(choice) {
    prediction = choice;
    render();
  }

  function pause() {
    clearTimeout(timer);
    timer = null;
    playing = false;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      advance();
      if (playing) schedule();
    }, 1250 / speed);
  }

  function togglePlay() {
    if (playing) {
      pause();
      render();
      return;
    }
    if (history.length > readings.length) return;
    playing = true;
    advance();
    if (playing) schedule();
  }

  function step() {
    pause();
    advance();
  }

  function advance() {
    const index = history.length - 1;
    if (index >= readings.length) return;
    if (index === 0) {
      firstPrediction = prediction;
      beganWithPlay = playing;
    }
    current = updateFor(estimate, variance, at(index));
    estimate = current.estimate;
    variance = current.variance;
    history.push(variance);
    if (history.length > readings.length) pause();
    render();
  }

  const text = (x, y, content, fill = C.ink, anchor = 'start', size = 13) =>
    s('text', { x, y, fill, 'text-anchor': anchor, 'font-size': size, 'font-family': 'Consolas, monospace' }, content);
  const line = (x1, y1, x2, y2, stroke, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });
  const dot = (cx, cy, fill, stroke = fill, r = 5) =>
    s('circle', { cx, cy, r, fill, stroke, 'stroke-width': 2 });
  const numberResult = value => {
    const formatted = fmt(value);
    return `${Math.abs(value - Number(formatted)) < 1e-9 ? '=' : '≈'} ${formatted}`;
  };

  function drawPicture(values, iteration) {
    const { forecast, till } = values;
    const min = Math.min(44, forecast - 3, till - 3);
    const max = Math.max(64, forecast + 3, till + 3);
    const x = value => 22 + (value - min) / (max - min) * 336;
    const y = 62;
    const marks = [];
    for (let value = 5 * Math.ceil(min / 5); value <= max; value += 5) {
      marks.push(line(x(value), y - 4, x(value), y + 4, C.muted),
        text(x(value), y + 21, value, C.muted, 'middle', 12));
    }
    const estimateMarks = current ? [
      line(x(estimate), y - 24, x(estimate), y - 2, C.green, 1.5),
      dot(x(estimate), y - 26, C.green)
    ] : [];

    const plot = { left: 42, right: 352, top: 167, bottom: 266 };
    const scale = Math.max(2, Math.ceil(settings.initialVariance / 2) * 2);
    const ix = i => plot.left + i / readings.length * (plot.right - plot.left);
    const iy = loss => plot.bottom - loss / scale * (plot.bottom - plot.top);
    const ticks = [0, scale / 2, scale].flatMap(loss => [
      line(plot.left, iy(loss), plot.right, iy(loss), C.line),
      text(plot.left - 8, iy(loss) + 4, fmt(loss), C.muted, 'end', 12)
    ]);
    const iterationTicks = Array.from({ length: readings.length + 1 }, (_, i) =>
      text(ix(i), plot.bottom + 17, i, i === iteration ? C.green : C.muted, 'middle', 12));
    const lossPoints = history.map((loss, i) => `${ix(i)},${iy(loss)}`).join(' ');

    svg.replaceChildren(
      text(22, 19, 'North demand (cases)'),
      line(22, y, 358, y, C.line, 2),
      ...marks,
      line(x(forecast), y, x(till), y, C.ink, 2.5),
      dot(x(till), y, C.amber),
      dot(x(forecast), y, C.card, C.cyan),
      ...(forecast === till ? [dot(x(till), y, C.amber, C.amber, 2)] : []),
      ...estimateMarks,
      dot(25, 106, C.card, C.cyan, 4),
      text(35, 110, `Forecast ${fmt(forecast)}`, C.cyan, 'start', 12),
      dot(151, 106, C.amber, C.amber, 4),
      text(161, 110, `Till ${fmt(till)}`, C.amber, 'start', 12),
      ...(current ? [dot(247, 106, C.green, C.green, 4),
        text(257, 110, `Estimate ${fmt(estimate)}`, C.green, 'start', 12)] : []),
      text(22, 139, 'Expected loss'),
      text(22, 154, 'Estimate variance (cases²)', C.muted, 'start', 11),
      ...ticks, ...iterationTicks,
      line(plot.left, plot.top, plot.left, plot.bottom, C.muted),
      s('polyline', { points: lossPoints, fill: 'none', stroke: C.green, 'stroke-width': 2.5 }),
      ...history.map((loss, i) => dot(ix(i), iy(loss), C.green, C.green, i === iteration ? 4 : 2.5)),
      text((plot.left + plot.right) / 2, 301, 'Update', C.muted, 'middle', 12)
    );
    svg.setAttribute('aria-label', `Forecast ${fmt(forecast)} cases, till ${fmt(till)} cases. ${
      current ? `Estimate ${fmt(estimate)} cases. ` : ''
    }Expected loss ${fmt(variance)} cases squared after ${iteration} updates.`);
  }

  function render() {
    const iteration = history.length - 1;
    const complete = iteration === readings.length;
    const values = current ?? updateFor(estimate, variance, at(0));
    const { forecast, forecastVariance, till, gain, gap, move } = values;
    drawPicture(values, iteration);

    counter.textContent = `Update ${iteration} of ${readings.length}`;
    nextReading.textContent = complete ? 'All readings used.' : `Next till reading is ${at(iteration)} cases.`;
    stepButton.disabled = playButton.disabled = complete;
    playButton.textContent = playing ? 'Pause' : 'Play';
    const lessonStart = settings.start === 50 && settings.first === 58 &&
      settings.initialVariance === 4 && settings.tillVariance === 12;
    predictForecast.disabled = predictTill.disabled = iteration > 0 || !lessonStart;
    predictForecast.setAttribute('aria-pressed', String(prediction === 'forecast'));
    predictTill.setAttribute('aria-pressed', String(prediction === 'till'));

    const parts = [
      'Gap from forecast to till',
      `${fmt(till)} − ${fmt(forecast)} ${numberResult(gap)}`,
      'Gain from the two variances',
      settings.tillVariance === 0
        ? 'Gain = 1 with a perfect till'
        : `${fmt(forecastVariance)} ÷ (${fmt(forecastVariance)} + ${settings.tillVariance}) ${numberResult(gain)}`
    ];
    if (current) {
      parts.push(
        'Move = gain × gap',
        `${fmt(gain)} × (${fmt(gap)}) ${numberResult(move)}`,
        ['Updated estimate', C.green],
        [`${fmt(forecast)} + (${fmt(move)}) ${numberResult(estimate)} cases`, C.green],
        'Updated variance = old × (1 − gain)',
        `${fmt(forecastVariance)} × (1 − ${fmt(gain)}) ${numberResult(variance)}`
      );
    }
    fbox(formula, parts);
    if (current && lessonStart && firstPrediction === 'till') {
      hint.textContent = 'The first estimate was 52, closer to 50. Reset to try your prediction again.';
    } else if (settings.tillVariance === 0) {
      hint.textContent = 'A perfect-till assumption copies every reading and reports zero expected loss, even when the readings wobble.';
    } else if (prediction && !current) {
      hint.textContent = `Prediction recorded. Press Play to see whether the estimate lands closer to ${prediction === 'forecast' ? 50 : 58}.`;
    } else {
      hint.textContent = 'Expected loss is the filter’s estimate of its squared demand error, based on the variances you give it.';
    }

    const usedReadings = Array.from({ length: iteration }, (_, i) => at(i));
    checker.update({
      firstPrediction, beganWithPlay, lessonStart, history,
      initialVariance: settings.initialVariance, tillVariance: settings.tillVariance,
      copiedDifferentReadings: new Set(usedReadings).size > 1
    });
  }

  restart();
  return pause;
}

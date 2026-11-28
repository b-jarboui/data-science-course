// 12.3.1 Try it: change the prices or the line and see every loss update.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [10, 6, 8, 7, 3, 5];
  const CENTER = 6.5;
  const SLOPE = -1;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const signed = value => value > 0 ? `+${fmt(value)}` : value < 0 ? `−${fmt(-value)}` : '0';
  let prices = START.slice();
  let center = CENTER;
  let slope = SLOPE;
  let selected = 0;
  let activePointer = null;

  const W = 400;
  const LEFT = 42;
  const RIGHT = 380;
  const TOP = 28;
  const BASE = 234;
  const FIRST = LEFT + 25;
  const LAST = RIGHT - 25;
  const x = i => FIRST + i * (LAST - FIRST) / 5;
  const y = value => BASE - value * (BASE - TOP) / 12;
  const svg = s('svg', {
    viewBox: `0 0 ${W} 334`, role: 'img', 'aria-label': 'Bike prices, guesses and losses'
  });
  const box = h('div');
  const challengeHost = h('div');
  const selectedBike = h('select', {
    'aria-label': 'Choose a bike',
    style: { minHeight: '44px', font: 'inherit' },
    onchange: () => { selected = Number(selectedBike.value); draw(); }
  }, START.map((_, i) => h('option', { value: i }, `Bike ${i + 1}`)));
  const lossType = h('select', {
    'aria-label': 'Loss to use',
    style: { minHeight: '44px', font: 'inherit' },
    onchange: () => draw()
  }, h('option', { value: 'squared' }, 'Squared loss'),
  h('option', { value: 'absolute' }, 'Absolute loss'));

  const tiltReadout = h('span');
  const heightReadout = h('span');
  const tilt = h('input', {
    type: 'range', min: -1.5, max: 0.5, step: 0.25, value: SLOPE,
    'aria-label': 'Tilt the line',
    oninput: () => { slope = Number(tilt.value); draw(); }
  });
  const height = h('input', {
    type: 'range', min: 4, max: 8, step: 0.25, value: CENTER,
    'aria-label': 'Raise or lower the line',
    oninput: () => { center = Number(height.value); draw(); }
  });
  const controls = h('div', { class: 'sim-card' }, svg,
    h('div', { class: 'sim-row' }, selectedBike,
      btn('Lower price', () => changePrice(-0.25)), btn('Raise price', () => changePrice(0.25))),
    h('label', { class: 'sim-row' }, 'Tilt the line', tilt, tiltReadout),
    h('label', { class: 'sim-row' }, 'Raise or lower the line', height, heightReadout),
    h('label', { class: 'sim-row' }, 'Loss', lossType),
    h('div', { class: 'sim-row' }, btn('New data', newData, 'go'), btn('Reset', reset)));

  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: empirical risk'),
    h('p', { class: 'sub' },
      'Drag a cyan point to change a sale price, or choose a bike and use the price buttons. The yellow line shows the guesses.'),
    h('div', { class: 'sim-grid' }, controls,
      h('div', {}, h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeHost))));
  root.append(panel);

  const samePrices = values => values.every((value, i) => value === START[i]);
  const chal = challenges(challengeHost, [
    {
      text: 'Reset, then pick absolute loss to get a risk of about 1.33.',
      check: st => st.kind === 'absolute' && st.originalPrices && st.originalLine && st.total === 8,
      why: 'Adding the sizes of the six misses gives 8, so the average is 8 divided by 6.'
    },
    {
      text: 'Reset, then tilt the line until the squared-loss risk is above 2.',
      check: st => st.kind === 'squared' && st.originalPrices && st.center === CENTER &&
        st.slope !== SLOPE && st.risk > 2,
      why: 'Tilting the best line while keeping these sale prices fixed raises the average squared loss.'
    },
    {
      text: 'Reset, then move all six sale prices onto the yellow line to get a risk of 0.',
      check: st => st.kind === 'squared' && st.originalLine && st.total === 0,
      why: 'When every sale price equals its guess, every squared loss is zero.'
    }
  ]);

  function changePrice(delta) {
    prices[selected] = clamp(prices[selected] + delta, 0, 12);
    draw();
  }

  function newData() {
    const previous = prices;
    prices = START.map(() => rnd(2, 11));
    // Make the button change the data even if the random draw equals the current data.
    if (prices.every((value, i) => value === previous[i])) {
      prices[0] = prices[0] === 11 ? 10 : prices[0] + 1;
    }
    draw();
  }

  function reset() {
    prices = START.slice();
    center = CENTER;
    slope = SLOPE;
    selected = 0;
    tilt.value = SLOPE;
    height.value = CENTER;
    lossType.value = 'squared';
    draw();
  }

  function svgPoint(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(matrix.inverse());
  }

  function setPriceFromY(py) {
    const value = (BASE - py) * 12 / (BASE - TOP);
    prices[selected] = clamp(Math.round(value * 4) / 4, 0, 12);
    draw();
  }

  function pointerDown(event) {
    if (activePointer !== null || event.button !== 0) return;
    const p = svgPoint(event);
    if (!p || p.x < LEFT || p.x > RIGHT || p.y < TOP - 10 || p.y > BASE + 7) return;
    selected = clamp(Math.round((p.x - FIRST) * 5 / (LAST - FIRST)), 0, 5);
    activePointer = event.pointerId;
    svg.setPointerCapture(event.pointerId);
    if (Math.hypot(p.x - x(selected), p.y - y(prices[selected])) <= 13) draw();
    else setPriceFromY(p.y);
  }

  function pointerMove(event) {
    if (event.pointerId !== activePointer) return;
    const p = svgPoint(event);
    if (p) setPriceFromY(p.y);
  }

  function endPointer(event) {
    if (event.pointerId === activePointer) activePointer = null;
  }

  svg.addEventListener('pointerdown', pointerDown);
  svg.addEventListener('pointermove', pointerMove);
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('lostpointercapture', endPointer);

  const guessAt = i => center + slope * (i - 2.5);

  function measure() {
    const kind = lossType.value;
    const guesses = prices.map((_, i) => guessAt(i));
    const misses = prices.map((value, i) => value - guesses[i]);
    const losses = misses.map(value => kind === 'squared' ? value * value : Math.abs(value));
    const total = losses.reduce((a, b) => a + b, 0);
    return {
      kind, guesses, misses, losses, total, risk: total / prices.length, center, slope,
      originalPrices: samePrices(prices), originalLine: center === CENTER && slope === SLOPE
    };
  }

  const chartLine = (x1, y1, x2, y2, stroke, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round' });
  const label = (value, px, py, color = C.ink, size = 14, anchor = 'middle') =>
    s('text', {
      x: px, y: py, fill: color, 'font-size': size,
      'text-anchor': anchor, 'font-family': 'Consolas, monospace'
    }, value);
  const approximate = value => Number(fmt(value)) === value ? '= ' : '≈ ';

  function draw() {
    const state = measure();
    const marks = [];
    const px = x(selected);
    marks.push(
      s('rect', { x: px - 23, y: TOP, width: 46, height: BASE - TOP,
        fill: C.cyan, 'fill-opacity': 0.08, rx: 6 }),
      s('rect', { x: px - 23, y: BASE + 10, width: 46, height: 72,
        fill: C.cyan, 'fill-opacity': 0.08, rx: 6 }),
      label('Price ($100s)', LEFT, 17, C.muted, 14, 'start')
    );
    for (let value = 0; value <= 12; value += 2) {
      marks.push(chartLine(LEFT, y(value), RIGHT, y(value), value === 0 ? C.muted : C.line),
        label(value, LEFT - 8, y(value) + 4, C.muted, 13, 'end'));
    }
    marks.push(chartLine(LEFT, TOP, LEFT, BASE, C.muted),
      chartLine(FIRST, y(state.guesses[0]), LAST, y(state.guesses[5]), C.amber, 3),
      label('Age', LEFT, BASE + 26, C.muted, 13, 'end'),
      label('Miss', LEFT, BASE + 47, C.muted, 13, 'end'),
      label('Loss', LEFT, BASE + 69, C.muted, 13, 'end'));

    prices.forEach((value, i) => {
      const cx = x(i);
      const cy = y(value);
      const miss = state.misses[i];
      const color = miss < 0 ? C.pink : miss > 0 ? C.cyan : C.muted;
      if (miss !== 0) marks.push(chartLine(cx, y(state.guesses[i]), cx, cy, color, 3));
      marks.push(s('circle', {
        cx, cy, r: i === selected ? 13 : 9, fill: C.cyan, 'fill-opacity': 0.2
      }));
      marks.push(i === 2 || i === 5
        ? s('rect', { x: cx - 5, y: cy - 5, width: 10, height: 10, rx: 1, fill: C.cyan })
        : s('circle', { cx, cy, r: 5, fill: C.cyan }));
      marks.push(
        label(i + 1, cx, BASE + 26, i === selected ? C.cyan : C.ink),
        label(signed(miss), cx, BASE + 47, color, 13),
        label(`${approximate(state.losses[i]) === '≈ ' ? '≈' : ''}${fmt(state.losses[i])}`,
          cx, BASE + 69, C.green, 13)
      );
    });
    svg.replaceChildren(...marks);

    const guess = state.guesses[selected];
    const miss = state.misses[selected];
    const loss = state.losses[selected];
    const factor = miss < 0 ? `(${fmt(miss)})` : fmt(miss);
    const lossMath = state.kind === 'squared' ? `${factor} × ${factor}` : `|${fmt(miss)}|`;
    const totalRounded = approximate(state.total) === '≈ ';
    const exactRisk = Number(fmt(state.risk)) === state.risk;
    const divisor = prices.length;
    fbox(box, [
      `Bike ${selected + 1} · price ${fmt(prices[selected])} · guess ${fmt(guess)}`,
      `Miss = ${fmt(prices[selected])} − ${fmt(guess)} = ${signed(miss)}`,
      [`Loss = ${lossMath} ${approximate(loss)}${fmt(loss)}`, C.green],
      '',
      `All ${divisor} losses ${approximate(state.total)}${fmt(state.total)}`,
      `Empirical risk (${state.kind})`,
      [totalRounded ? `≈ ${fmt(state.risk)}`
        : `= ${fmt(state.total)} ÷ ${divisor} ${exactRisk ? '=' : '≈'} ${fmt(state.risk)}`, C.green]
    ]);
    selectedBike.value = String(selected);
    tiltReadout.textContent = `${signed(slope)} per year`;
    heightReadout.textContent = `${fmt(center)} at 3.5 years`;
    chal.update(state);
  }

  // Navigation can reveal a challenge that the current settings already satisfy.
  const checkCurrent = () => chal.update(measure());
  challengeHost.addEventListener('click', checkCurrent);
  draw();

  return () => {
    challengeHost.removeEventListener('click', checkCurrent);
    svg.removeEventListener('pointerdown', pointerDown);
    svg.removeEventListener('pointermove', pointerMove);
    svg.removeEventListener('pointerup', endPointer);
    svg.removeEventListener('pointercancel', endPointer);
    svg.removeEventListener('lostpointercapture', endPointer);
    if (activePointer !== null && svg.hasPointerCapture(activePointer)) {
      svg.releasePointerCapture(activePointer);
    }
    panel.remove();
  };
}

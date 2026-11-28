// 16.2.10 Try it: move the prediction time and see which published total it can use.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = { firstTime: 360, firstTotal: 34, arrival: 480, lateAmount: 8, secondTime: 510 };
  const MIN = 330, MAX = 570;
  let data = START, prediction = 420, moved = false;

  function clock(minutes) {
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  }

  const svg = s('svg', {
    viewBox: '0 0 400 228', role: 'img', 'aria-label': 'Tuesday morning sales publications and prediction',
  });
  const box = h('div', { role: 'status' });
  const challengePanel = h('div');
  const slider = h('input', {
    type: 'range', min: MIN, max: MAX, step: 5, value: prediction,
    style: { display: 'block', width: '100%', minHeight: '44px', margin: '0' },
    oninput: event => {
      prediction = Number(event.currentTarget.value);
      moved = true;
      draw();
    },
  });
  const timeLabel = h('span');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: What was known then?'),
    h('p', { class: 'sub' }, 'Move the prediction time. Watch which of Monday’s sales totals the Tuesday forecast can use.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('label', { style: { display: 'block', marginTop: '.6rem' } }, timeLabel, slider),
        h('div', { class: 'sim-row' }, btn('New data', newData), btn('Bakery example', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box), h('div', { class: 'sim-card' }, challengePanel))));

  const chal = challenges(challengePanel, [
    {
      text: 'Move the prediction to a time when only the first total is available.',
      check: state => state.moved && state.match === 'first',
      why: 'Only the first total had been published by that time.',
    },
    {
      text: 'Move the prediction to the time the late ticket arrives.',
      check: state => state.moved && state.prediction === state.arrival,
      why: 'The bakery has the late ticket, and it still uses the first total until it publishes the update.',
    },
    {
      text: 'Move the prediction to the exact time the second total is published.',
      check: state => state.moved && state.prediction === state.secondTime,
      why: 'The new total is available from the moment the bakery publishes it.',
    },
    {
      text: 'Move the prediction to a time before either total was published.',
      check: state => state.moved && state.match === 'none',
      why: 'Neither Monday sales total was available that early.',
    },
  ]);

  function newData() {
    const arrival = rnd(90, 98) * 5;
    data = { firstTime: START.firstTime, firstTotal: rnd(20, 55), arrival,
      lateAmount: rnd(2, 15), secondTime: arrival + rnd(2, 9) * 5 };
    draw();
  }

  function reset() {
    data = START;
    prediction = 420;
    moved = false;
    slider.value = String(prediction);
    draw();
  }

  const x = minutes => 35 + (minutes - MIN) / (MAX - MIN) * 330;
  const text = (value, px, py, size, color = C.ink) => s('text', {
    x: px, y: py, fill: color, 'font-size': size, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace',
  }, value);
  const line = (x1, y1, x2, y2, stroke, extra = {}) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': 2, ...extra });
  const dot = (cx, cy, fill, r = 5) => s('circle', { cx, cy, r, fill });

  function publication(px, time, total, name, selected, available) {
    const color = selected ? C.green : available ? C.cyan : C.muted;
    return [
      line(px, 79, x(time), 102, color),
      s('rect', { x: px - 76, y: 8, width: 152, height: 71, rx: 10, fill: C.bg,
        stroke: color, 'stroke-width': selected ? 3 : 1.5 }),
      text(name, px, 25, 14, color),
      text(`$${total}`, px, 49, 23),
      text(`Published ${clock(time)}`, px, 67, 14, color),
      dot(x(time), 102, color),
    ];
  }

  function draw() {
    const { firstTime, firstTotal, arrival, lateAmount, secondTime } = data;
    const secondTotal = firstTotal + lateAmount;
    const match = prediction >= secondTime ? 'second' : prediction >= firstTime ? 'first' : 'none';
    const markerX = x(prediction);
    const arrivalX = x(arrival);
    const ticks = [330, 420, 510, 570].flatMap(time => [
      line(x(time), 106, x(time), 112, C.muted),
      text(clock(time), x(time), 126, 13, C.ink),
    ]);
    svg.replaceChildren(
      s('title', {}, `Tuesday forecast at ${clock(prediction)} a.m.`),
      s('desc', {}, `Monday’s first total is $${firstTotal}, published Tuesday at ${clock(firstTime)} a.m. `
        + `The late ticket is $${lateAmount} and arrives at ${clock(arrival)} a.m. `
        + `Monday’s second total is $${secondTotal}, published at ${clock(secondTime)} a.m.`),
      line(x(MIN), 102, x(MAX), 102, C.muted),
      ...ticks,
      ...publication(89, firstTime, firstTotal, 'Monday total', match === 'first', prediction >= firstTime),
      ...publication(311, secondTime, secondTotal, 'Monday update', match === 'second', prediction >= secondTime),
      s('rect', { x: arrivalX - 3.5, y: 98.5, width: 7, height: 7, fill: C.amber, rx: 1 }),
      text(`Late ticket B: $${lateAmount} at ${clock(arrival)}`, 200, 150, 15, C.amber),
      line(x(MIN), 189, x(MAX), 189, C.line),
      line(markerX, 174, markerX, 189, C.violet),
      dot(markerX, 189, C.violet, 6),
      text(`Tuesday forecast at ${clock(prediction)}`, 200, 216, 17, C.ink));

    timeLabel.textContent = `Tuesday prediction time · ${clock(prediction)} a.m.`;
    slider.setAttribute('aria-valuetext', `${clock(prediction)} a.m.`);
    const rows = [`Tuesday forecast at ${clock(prediction)}`, `Monday $${firstTotal} published ${clock(firstTime)}`,
      `Monday $${secondTotal} published ${clock(secondTime)}`];
    if (match === 'none') {
      rows.push(['No total was available yet', C.amber]);
    } else {
      const amount = match === 'second' ? secondTotal : firstTotal;
      const published = match === 'second' ? secondTime : firstTime;
      rows.push([`Use $${amount} from ${clock(published)}`, C.green]);
    }
    fbox(box, rows);
    chal.update({ moved, prediction, arrival, secondTime, match });
  }

  draw();
}

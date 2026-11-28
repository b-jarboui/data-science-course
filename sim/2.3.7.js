// 2.3.7 Try it: shade the same city by total trips or by trips per resident.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [
    { name: 'North', trips: 8000, residents: 40000 },
    { name: 'Center', trips: 6000, residents: 10000 },
    { name: 'South', trips: 5000, residents: 25000 },
  ];
  const SHADES = ['#526e87', '#305673', '#10294d'];
  const BORDERS = [
    [[30, 46], [123, 43], [162, 57]],
    [[16, 115], [79, 103], [181, 114]],
    [[25, 180], [108, 191], [165, 178]],
    [[42, 247], [120, 255], [173, 236]],
  ];
  const LABEL_Y = [81, 148, 217];
  const copyStart = () => START.map(area => ({ ...area }));
  const rate = area => area.trips / area.residents;
  const integer = n => n.toLocaleString('en-US');
  const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
  const rateText = n => `${Number(n.toFixed(4)) === n ? '' : '≈ '}${decimal.format(n)}`;

  let areas = copyStart();
  let selected = 0;
  let mode = 'count';
  let randomData = false;
  const mapsSeen = new Set([mode]);

  const svg = s('svg', {
    viewBox: '0 0 360 273',
    role: 'img',
    'aria-label': 'City map and shade key',
  });
  const box = h('div');
  const note = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const challengeCard = h('div');
  const areaButtons = START.map(({ name }, i) => btn(name, () => {
    selected = i;
    draw();
  }));
  const countButton = btn('Show daily trips', () => showMap('count'));
  const rateButton = btn('Show trips per resident', () => showMap('rate'));

  const tripsOutput = h('output', { class: 'sim-note' });
  const residentsOutput = h('output', { class: 'sim-note' });
  const tripsInput = slider('Daily bus trips', 'trips', 1000, 12000, tripsOutput);
  const residentsInput = slider('Residents', 'residents', 5000, 50000, residentsOutput);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: maps and denominators'),
    h('p', { class: 'sub' }, 'Choose an area and change its daily trips or residents. Switch maps and use the key to read the shades.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Map measure', style: { marginTop: 0 } }, countButton, rateButton),
        svg,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Area to change' }, areaButtons),
        tripsInput.row,
        residentsInput.row,
        h('div', { class: 'sim-row' },
          btn('New data', () => {
            areas = START.map(({ name }) => ({
              name,
              trips: rnd(2, 24) * 500,
              residents: rnd(10, 100) * 500,
            }));
            randomData = true;
            dataChanged();
          }),
          btn('Reset', () => {
            areas = copyStart();
            selected = 0;
            mode = 'count';
            randomData = false;
            dataChanged();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeCard)))));

  const chal = challenges(challengeCard, [
    {
      text: 'Show trips per resident. Change only North’s residents until North is darkest.',
      check: st => st.mode === 'rate' && st.northAloneChanged && st.rateLeaders.join() === 'North',
      why: 'The same trips shared among fewer residents give North a higher rate.',
    },
    {
      text: 'Show trips per resident. Make two areas tie above 0.2 with different daily trip counts.',
      check: st => st.mode === 'rate' && st.hasNewTie,
      why: 'Two areas can have the same trips per resident when their trips and residents change in the same proportion.',
    },
    {
      text: 'Press New data. Find a set where each map has a different darkest area, and view both maps.',
      check: st => st.randomData && st.sawBoth && st.countLeaders.length === 1 &&
        st.rateLeaders.length === 1 && st.countLeaders[0] !== st.rateLeaders[0],
      why: 'One area has the most trips in total and a different area has the most trips per resident.',
    },
  ]);

  function slider(name, field, min, max, output) {
    const input = h('input', {
      type: 'range',
      min,
      max,
      step: 500,
      'aria-label': name,
      style: { width: '100%', minHeight: '44px', margin: 0 },
      oninput: () => {
        areas[selected][field] = Number(input.value);
        dataChanged();
      },
    });
    return { input, row: h('label', { class: 'sim-row' }, name, output, input) };
  }

  function dataChanged() {
    mapsSeen.clear();
    mapsSeen.add(mode);
    draw();
  }

  function showMap(next) {
    mode = next;
    mapsSeen.add(mode);
    draw();
  }

  function leaders(values) {
    const max = Math.max(...values);
    return areas.filter((_, i) => values[i] === max).map(area => area.name);
  }

  function state() {
    const northAloneChanged = areas.every((area, i) => area.trips === START[i].trips &&
      (i === 0 ? area.residents !== START[i].residents : area.residents === START[i].residents));
    const hasNewTie = areas.some((area, i) => rate(area) > 0.2 && areas.slice(i + 1).some(other =>
      area.trips !== other.trips && area.trips * other.residents === other.trips * area.residents));
    return {
      mode, randomData, northAloneChanged, hasNewTie,
      sawBoth: mapsSeen.size === 2,
      countLeaders: leaders(areas.map(area => area.trips)),
      rateLeaders: leaders(areas.map(rate)),
    };
  }

  function setPressed(button, pressed) {
    button.setAttribute('aria-pressed', String(pressed));
    button.classList.toggle('go', pressed);
  }

  const text = (x, y, value, options = {}) => s('text', {
    x, y, fill: C.ink, 'font-size': 15, 'font-family': 'Segoe UI, Arial, sans-serif', ...options,
  }, value);

  function draw() {
    const values = areas.map(mode === 'count' ? area => area.trips : rate);
    const domain = [...new Set(values)].sort((a, b) => a - b);
    const shade = value => SHADES[Math.round(2 * domain.indexOf(value) / Math.max(1, domain.length - 1))];
    const unit = mode === 'count' ? 'Daily trips' : 'Daily trips per resident';
    const valueText = mode === 'count' ? integer : rateText;

    const regions = areas.map(({ name }, i) => {
      const outline = [...BORDERS[i], ...BORDERS[i + 1].slice().reverse()];
      return s('g', {},
        s('polygon', {
          points: outline.map(([x, y]) => `${x},${y}`).join(' '),
          fill: shade(values[i]),
          stroke: i === selected ? C.amber : C.cyan,
          'stroke-width': i === selected ? 3 : 1.5,
          'stroke-linejoin': 'round',
        }),
        text(99, LABEL_Y[i] + 5, name, { 'text-anchor': 'middle', 'font-weight': 700 }));
    });
    const swatches = domain.map((value, i) => {
      const y = 108 + i * 37;
      return s('g', {},
        s('rect', { x: 204, y: y - 15, width: 28, height: 20, rx: 3, fill: shade(value), stroke: C.cyan }),
        text(243, y, valueText(value), { 'font-family': 'Consolas, monospace' }));
    });
    svg.setAttribute('aria-label', `${unit}. ${areas.map(({ name }, i) => `${name}: ${valueText(values[i])}`).join('. ')}.`);
    svg.replaceChildren(
      ...regions,
      text(204, 52, 'Key', { 'font-weight': 700 }),
      text(204, 74, unit, { fill: C.muted, 'font-size': 13 }),
      ...swatches,
    );

    const area = areas[selected];
    setPressed(countButton, mode === 'count');
    setPressed(rateButton, mode === 'rate');
    areaButtons.forEach((button, i) => setPressed(button, i === selected));
    tripsInput.input.value = area.trips;
    residentsInput.input.value = area.residents;
    tripsInput.input.setAttribute('aria-label', `${area.name} daily bus trips`);
    residentsInput.input.setAttribute('aria-label', `${area.name} residents`);
    tripsOutput.textContent = integer(area.trips);
    residentsOutput.textContent = integer(area.residents);

    const result = rateText(rate(area));
    fbox(box, [
      [area.name, C.cyan],
      `Daily trips: ${integer(area.trips)}`,
      `Residents: ${integer(area.residents)}`,
      `${integer(area.trips)} ÷ ${integer(area.residents)}`,
      [`${result.startsWith('≈') ? result : '= ' + result} daily trips per resident`, C.green],
    ]);

    const current = state();
    const darkest = mode === 'count' ? current.countLeaders : current.rateLeaders;
    const description = darkest.length === 3
      ? 'All three areas have the same shade.'
      : `Darkest ${darkest.length === 1 ? 'area' : 'areas'}: ${darkest.join(' and ')}.`;
    if (note.textContent !== description) note.textContent = description;
    chal.update(current);
  }

  const refreshChallenge = () => chal.update(state());
  challengeCard.addEventListener('click', refreshChallenge);
  draw();
  return () => challengeCard.removeEventListener('click', refreshChallenge);
}

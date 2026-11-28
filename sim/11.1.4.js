// 11.1.4 Try it: choose a date and see where a lag takes you.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const SPRING = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79,
  ];
  const WINTER = [40, 40, null, 0, 55, 70, 55];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let values = SPRING.slice();
  let mode = 'spring';
  let today = 12;
  let lag = 7;

  const svg = s('svg', { 'aria-hidden': 'true', style: 'touch-action: pan-y' });
  const box = h('div', { role: 'status', 'aria-live': 'polite' });
  const note = h('div', { class: 'sim-note' });
  const challengePanel = h('div');
  const dateValue = h('span');
  const lagValue = h('span');
  const sliderStyle = { width: '100%', minHeight: '36px', display: 'block', accentColor: C.cyan };
  const dateSlider = h('input', {
    type: 'range', min: 1, step: 1, style: sliderStyle, 'aria-label': 'Selected date',
    oninput: e => { today = Number(e.currentTarget.value) - 1; draw(); },
  });
  const lagSlider = h('input', {
    type: 'range', min: 1, step: 1, style: sliderStyle, 'aria-label': 'Lag in days',
    oninput: e => { lag = Number(e.currentTarget.value); draw(); },
  });
  const salesValue = h('span');
  const salesSlider = h('input', {
    type: 'range', min: 0, max: 110, step: 1, style: sliderStyle, 'aria-label': 'Loaves sold on the selected date',
    oninput: e => { values[today] = Number(e.currentTarget.value); draw(); },
  });
  const editPanel = h('label', {}, salesValue, salesSlider);

  const app = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: look back by date'),
    h('p', { class: 'sub' }, 'Pick a date in the picture or use the date slider. Change the lag to see which earlier date pairs with it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('label', {}, dateValue, dateSlider),
        h('label', {}, lagValue, lagSlider),
        editPanel,
        h('div', { class: 'sim-row' },
          btn('New data', randomize, 'go'),
          btn('Spring example', () => setExample('spring')),
          btn('Winter week', () => setExample('winter')))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengePanel))));
  root.append(app);

  const checks = challenges(challengePanel, [
    {
      text: 'In the spring example, choose lag 7 and find the Saturday that pairs 80 with 75.',
      check: st => st.mode === 'spring' && st.today === 19 && st.lag === 7 && st.current === 80 && st.earlier === 75,
      why: 'Week 3 Saturday pairs with Week 2 Saturday because those dates are seven days apart.',
    },
    {
      text: 'In the spring example, find a lag that gives exactly 14 pairs.',
      check: st => st.mode === 'spring' && st.count === 14,
      why: 'A lag of 14 days leaves the first 14 dates without an earlier partner, so 14 pairs remain.',
    },
    {
      text: 'In the winter week, pick Thursday and look back one day to the missing date.',
      check: st => st.mode === 'winter' && st.today === 3 && st.lag === 1 && st.earlier === null,
      why: 'Thursday’s sales are zero, and Wednesday’s sales are unknown, so Thursday has no lag 1 pair.',
    },
  ]);

  function setExample(next) {
    mode = next;
    values = (next === 'winter' ? WINTER : SPRING).slice();
    today = next === 'winter' ? 2 : 12;
    lag = next === 'winter' ? 1 : 7;
    draw();
  }

  function randomize() {
    mode = 'random';
    const start = rnd(24, 45);
    const weeklyIncrease = rnd(3, 8);
    const saturdayBoost = rnd(16, 25);
    const weekdayBoosts = [0, 1, 4, 7, 11, saturdayBoost, 13];
    values = SPRING.map((_, i) =>
      start + Math.floor(i / 7) * weeklyIncrease + weekdayBoosts[i % 7] + rnd(-3, 3));
    today = 12;
    lag = 7;
    draw();
  }

  const dateName = index => {
    const weekday = DAYS[index % 7];
    return mode === 'winter' ? weekday : `W${Math.floor(index / 7) + 1} ${weekday}`;
  };

  const WIDTH = 392, X0 = 63, SLOT = 45, TOP = 42, ROW = 55;
  const xAt = index => X0 + SLOT * (index % 7 + 0.5);
  const yAt = index => TOP + ROW * Math.floor(index / 7) + ROW / 2;
  const mono = 'Consolas, monospace';

  function text(x, y, str, fill = C.ink, size = 16, anchor = 'middle') {
    return s('text', {
      x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': mono,
      'dominant-baseline': 'middle', 'pointer-events': 'none',
    }, str);
  }

  function selectCell(e) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const local = p.matrixTransform(matrix.inverse());
    const col = Math.floor((local.x - X0) / SLOT);
    const row = Math.floor((local.y - TOP) / ROW);
    const index = row * 7 + col;
    if (col < 0 || col >= 7 || row < 0 || index >= values.length) return;
    today = index;
    draw();
  }
  svg.addEventListener('click', selectCell);

  function draw() {
    const previous = today - lag;
    const current = values[today];
    const earlier = previous < 0 ? undefined : values[previous];
    const count = values.filter((v, i) => i >= lag && v !== null && values[i - lag] !== null).length;
    const rows = values.length / 7;
    const height = TOP + ROW * rows + 14;
    svg.setAttribute('viewBox', `0 0 ${WIDTH} ${height}`);

    const parts = [];
    for (let j = 0; j < 7; j++) {
      parts.push(text(xAt(j), 24, DAYS[j], C.ink, 15));
    }
    for (let row = 0; row < rows; row++) {
      parts.push(text(X0 - 8, yAt(row * 7), mode === 'winter' ? 'Winter' : `Wk ${row + 1}`, C.ink, 13, 'end'));
    }
    values.forEach((v, i) => {
      const x = xAt(i), y = yAt(i);
      const color = i === today ? C.cyan : i === previous ? C.amber : C.line;
      const selected = i === today || i === previous;
      parts.push(s('rect', {
        x: x - 20, y: y - 23, width: 40, height: 46, rx: 7,
        fill: selected ? C.bg : C.card, stroke: color, 'stroke-width': selected ? 2 : 1,
        'stroke-dasharray': v === null ? '4 3' : null,
      }));
      parts.push(text(x, y + (selected ? 6 : 1), v === null ? '—' : String(v), v === null ? C.muted : C.ink, 17));
      if (selected) parts.push(text(x, y - 12, i === today ? 'today' : 'back', color, 10));
    });
    svg.replaceChildren(...parts);

    dateSlider.max = values.length;
    dateSlider.value = today + 1;
    dateSlider.setAttribute('aria-valuetext', dateName(today));
    lagSlider.max = mode === 'winter' ? 6 : 14;
    lagSlider.value = lag;
    lagSlider.setAttribute('aria-valuetext', `${lag} ${lag === 1 ? 'day' : 'days'}`);
    dateValue.textContent = `Selected date · ${dateName(today)}`;
    lagValue.textContent = `Lag · ${lag} ${lag === 1 ? 'day' : 'days'} back`;

    editPanel.hidden = mode === 'winter';
    if (mode !== 'winter') {
      salesSlider.value = current;
      salesValue.textContent = `Sales on ${dateName(today)} · ${current} loaves`;
    }

    const back = previous < 0 ? 'Before the notebook' : dateName(previous);
    const result = earlier === undefined ? 'no earlier date' : earlier === null ? 'unknown' : earlier;
    fbox(box, [
      [`Today (${dateName(today)}) = ${current === null ? 'unknown' : current}`, C.cyan],
      [`Lag ${lag} (${back}) = ${result}`, C.amber],
      [`${count} ${count === 1 ? 'pair' : 'pairs'} in the notebook`, C.green],
    ]);
    if (current === null) {
      note.textContent = 'This date stays in the calendar even though its sales are unknown.';
    } else if (earlier === undefined) {
      note.textContent = 'The earlier date falls before the notebook, so this date has no pair.';
    } else if (earlier === null) {
      note.textContent = 'The earlier date is in the calendar, but its sales were never recorded. Leave this pair out.';
    } else {
      note.textContent = 'The cyan box is the selected date. The amber box is the date that many days earlier.';
    }
    checks.update({ mode, today, lag, current, earlier, count });
  }

  draw();
  return () => {
    svg.removeEventListener('click', selectCell);
    app.remove();
  };
}

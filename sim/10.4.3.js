// 10.4.3 Try it: compare the same three clinic models on the same appointments.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [1, 1, 3, 5];
  const GROUPS = ['Reminder, morning', 'Reminder, afternoon', 'No reminder, morning', 'No reminder, afternoon'];
  const MODELS = [
    { name: 'A', parameters: 1, color: C.amber },
    { name: 'B', parameters: 2, color: C.cyan },
    { name: 'C', parameters: 4, color: C.pink },
  ];
  const MISSED = '#fb7185';
  let misses = START.slice();

  const svg = s('svg', { viewBox: '0 0 400 330', role: 'img', 'aria-label': 'Appointment dots and AIC bars' });
  const box = h('div');
  const result = h('div', { class: 'sim-note', role: 'status' });
  const challengePanel = h('div');

  const controls = GROUPS.map((group, i) => {
    const count = h('span', { 'aria-hidden': 'true' });
    const slider = h('input', {
      type: 'range', min: 0, max: 10, step: 1, 'aria-label': `${group}, missed appointments`,
      style: { width: '100%', minWidth: 0, minHeight: '44px', margin: 0, accentColor: MISSED },
      oninput: event => {
        misses[i] = Number(event.currentTarget.value);
        draw();
      },
    });
    const label = h('label', { style: { display: 'block' } },
      h('span', { style: { display: 'flex', justifyContent: 'space-between', gap: '.5rem' } }, group, count),
      slider);
    return { count, slider, label };
  });

  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: compare fit and fees'),
    h('p', { class: 'sub' }, 'Change how many appointments were missed in each group. All three models fit the same 40 appointments. The lowest AIC ranks first.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' },
          btn('New data', () => {
            misses = misses.map(() => {
              // Vary each group's miss chance, then simulate its ten appointments.
              const chance = rnd(5, 75);
              return Array.from({ length: 10 }, () => Number(rnd(1, 100) <= chance))
                .reduce((sum, value) => sum + value, 0);
            });
            draw();
          }, 'go'),
          btn('Reset', () => { misses = START.slice(); draw(); })),
        h('div', { style: { marginTop: '1rem' } }, controls.map(control => control.label))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, result),
        h('div', { class: 'sim-card' }, challengePanel))));
  root.append(panel);

  const tasks = challenges(challengePanel, [
    {
      text: 'Give all four groups the same number of misses and see which model ranks first.',
      check: state => state.winners.length === 1 && state.winners[0] === 'A'
        && state.misses.every(count => count === state.misses[0]),
      why: 'With the same miss rate in every group, the three models fit equally well and A pays the smallest fee.',
    },
    {
      text: 'Change the starting data so C has the shortest fit bar but B still ranks first.',
      check: state => state.winners.length === 1 && state.winners[0] === 'B'
        && state.scores[2].fit < Math.min(state.scores[0].fit, state.scores[1].fit)
        && state.misses.some((count, i) => count !== START[i]),
      why: 'C gains a little in fit, but that gain is smaller than its extra fee of four.',
    },
    {
      text: 'Keep exactly 10 misses overall and change their groups until C ranks first.',
      check: state => state.total === 10 && state.winners.length === 1 && state.winners[0] === 'C',
      why: 'The misses are uneven enough across groups for C’s better fit to cover its larger fee.',
    },
  ]);

  // The fitted miss chance in each group is its observed miss share.
  // A group with one outcome throughout contributes 0 to the deviance.
  function deviance(missed, count) {
    if (missed === 0 || missed === count) return 0;
    const share = missed / count;
    return -2 * (missed * Math.log(share) + (count - missed) * Math.log1p(-share));
  }

  function readState() {
    const [rm, ra, nm, na] = misses;
    const total = rm + ra + nm + na;
    const fits = [
      deviance(total, 40),
      deviance(rm + ra, 20) + deviance(nm + na, 20),
      misses.reduce((sum, count) => sum + deviance(count, 10), 0),
    ];
    const scores = MODELS.map((model, i) => {
      const fit = Math.round(10 * fits[i]);
      const fee = 2 * model.parameters;
      return { ...model, fit, fee, aic: fit + 10 * fee };
    });
    const lowest = Math.min(...scores.map(model => model.aic));
    const winners = scores.filter(model => model.aic === lowest).map(model => model.name);
    return { misses, total, scores, winners, lowest };
  }

  const tenth = value => (value / 10).toFixed(1);
  const label = (text, x, y, options = {}) => s('text', {
    x, y, fill: C.ink, 'font-size': 15, 'font-family': 'Segoe UI, Arial, sans-serif', ...options,
  }, text);

  function drawPicture(state) {
    const marks = [];
    const titles = ['Reminder AM', 'Reminder PM', 'No reminder AM', 'No reminder PM'];
    const mutedText = { fill: '#b2bdd9', 'font-size': 14 };
    state.misses.forEach((count, row) => {
      const y = 21 + 21 * row;
      marks.push(label(titles[row], 10, y + 5, mutedText));
      for (let i = 0; i < 10; i++) {
        const color = i < count ? MISSED : C.ink;
        const x = 144 + 20 * i;
        marks.push(
          s('circle', { cx: x, cy: y, r: 7, fill: color, 'fill-opacity': 0.13 }),
          s('circle', { cx: x, cy: y, r: 4.3, fill: color }),
        );
      }
      marks.push(label(`${count}/10`, 390, y + 5, { ...mutedText, 'text-anchor': 'end' }));
    });
    marks.push(label(`${state.total} missed · ${40 - state.total} kept`, 200, 109, {
      ...mutedText, 'text-anchor': 'middle',
    }));

    const BASE = 278;
    const UNIT = 2.02;
    const WIDTH = 64;
    const y = value => BASE - value * UNIT;
    for (const tick of [0, 20, 40, 60]) {
      marks.push(s('line', { x1: 37, x2: 388, y1: y(tick), y2: y(tick), stroke: '#455377' }),
        label(tick, 29, y(tick) + 5, { ...mutedText, 'text-anchor': 'end' }));
    }

    state.scores.forEach((model, i) => {
      const { name, fit, parameters, color, aic } = model;
      const x = 102 + 109 * i;
      const fitUnits = fit / 10;
      if (fit > 0) {
        marks.push(s('rect', {
          x: x - WIDTH / 2, y: y(fitUnits), width: WIDTH, height: fitUnits * UNIT,
          fill: color, 'fill-opacity': 0.78,
        }));
      }
      for (let j = 0; j < parameters; j++) {
        marks.push(s('rect', {
          x: x - WIDTH / 2, y: y(fitUnits + 2 * (j + 1)) + 0.35,
          width: WIDTH, height: 2 * UNIT - 0.7,
          fill: color, 'fill-opacity': 0.28, stroke: color, 'stroke-width': 0.65,
        }));
      }
      const columnText = { fill: color, 'text-anchor': 'middle', 'font-weight': 700 };
      marks.push(
        label(tenth(aic), x, y(aic / 10) - 8, columnText),
        label(`Model ${name}`, x, BASE + 22, columnText),
        label(`${tenth(fit)} fit`, x, BASE + 41, { ...mutedText, 'text-anchor': 'middle' }),
      );
    });
    svg.setAttribute('aria-label', `${state.total} of 40 appointments missed. ${
      state.scores.map(model => `Model ${model.name}, fit ${tenth(model.fit)}, fee ${model.fee}, AIC ${tenth(model.aic)}`).join('. ')
    }.`);
    svg.replaceChildren(...marks);
  }

  function draw() {
    const state = readState();
    drawPicture(state);
    controls.forEach(({ count, slider }, i) => {
      count.textContent = `${misses[i]} of 10`;
      slider.value = misses[i];
      slider.setAttribute('aria-valuetext', `${misses[i]} out of 10 missed`);
    });
    fbox(box, ['AIC = deviance + 2 × parameters',
      ...state.scores.map(model => [
        `${model.name}  ${tenth(model.fit)} + 2 × ${model.parameters} = ${tenth(model.aic)}`,
        model.color,
      ]),
    ]);
    const summary = state.winners.length === 1
      ? `Model ${state.winners[0]} has the lowest AIC, ${tenth(state.lowest)}.`
      : `Models ${state.winners.join(' and ')} share the lowest AIC to one decimal place.`;
    if (result.textContent !== summary) result.textContent = summary;
    tasks.update(state);
  }

  const checkCurrent = () => tasks.update(readState());
  challengePanel.addEventListener('click', checkCurrent);
  draw();
  return () => {
    challengePanel.removeEventListener('click', checkCurrent);
    panel.remove();
  };
}

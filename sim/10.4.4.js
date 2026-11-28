// 10.4.4 Try it: compare the same clinic models under AIC and BIC.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [1, 1, 3, 5];
  const groups = ['Reminder, morning', 'Reminder, afternoon', 'No reminder, morning', 'No reminder, afternoon'];
  const models = ['A', 'B', 'C'];
  const parameters = [1, 2, 4];
  const colors = [C.amber, C.cyan, C.pink];
  const scoreText = value => value.toFixed(1);
  let misses = START.slice();
  let copies = 1;
  let rule = 'AIC';
  let challengeState;

  const svg = s('svg', {
    viewBox: '0 0 400 300', role: 'img', 'aria-label': 'Model score bars'
  });
  const box = h('div');
  const note = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const tasks = h('div');
  const sizeLabel = h('span');
  const size = h('input', {
    type: 'range', min: 1, max: 20, step: 1, value: 1,
    style: { width: '100%', minHeight: '32px' },
    oninput: event => { copies = Number(event.currentTarget.value); draw(); }
  });
  const ruleButtons = ['AIC', 'BIC'].map(name => btn(name, () => { rule = name; draw(); }));
  const reports = groups.map(() => h('span'));

  function setCopies(value) {
    copies = value;
    size.value = String(value);
    draw();
  }

  const missControls = groups.map((group, i) => {
    const slider = h('input', {
      type: 'range', min: 0, max: 10, step: 1, value: misses[i],
      style: { width: '100%', minHeight: '32px' },
      oninput: event => { misses[i] = Number(event.currentTarget.value); draw(); }
    });
    return { slider, label: h('label', { style: { display: 'block' } }, `${group} · `, reports[i], slider) };
  });

  function setMisses(values) {
    misses = values.slice();
    missControls.forEach(({ slider }, i) => { slider.value = String(misses[i]); });
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: a fee that grows'),
    h('p', { class: 'sub' }, 'Grow the clinic record without changing the shares missed. Switch scoring rules and see which model has the lowest total.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Scoring rule' }, ...ruleButtons),
        h('label', { style: { display: 'block', marginTop: '.8rem' } }, sizeLabel, size),
        h('div', { class: 'sim-row' },
          btn('40 appointments', () => setCopies(1)),
          btn('400 appointments', () => setCopies(10))),
        h('div', { style: { marginTop: '1rem' } },
          h('p', { class: 'sim-note' }, 'Change how many out of every 10 appointments are missed.'),
          ...missControls.map(control => control.label)),
        h('div', { class: 'sim-row' },
          btn('New data', () => {
            const next = misses.map(() => rnd(0, 10));
            if (next.every((value, i) => value === misses[i])) next[0] = (next[0] + 1) % 11;
            setMisses(next);
          }, 'go'),
          btn('Reset clinic data', () => {
            copies = 1;
            size.value = '1';
            rule = 'AIC';
            setMisses(START);
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, tasks)))));

  const chal = challenges(tasks, [
    {
      text: 'Keep the clinic’s starting shares and grow the record to 400 appointments so AIC picks C.',
      check: st => st.original && st.n === 400 && st.rule === 'AIC' && st.aic === 'C',
      why: 'C gains 8.4 in fit and pays only 4 more than B under AIC.'
    },
    {
      text: 'Keep those 400 appointments and switch to BIC to see B win.',
      check: st => st.original && st.n === 400 && st.rule === 'BIC' && st.bic === 'B',
      why: 'Under BIC, C pays about 12 more than B for a fit gain of only 8.4.'
    },
    {
      text: 'Set all four groups to the same share missed so both rules pick A.',
      check: st => st.sameShares && st.aic === 'A' && st.bic === 'A',
      why: 'All three models fit equally well, so the single chance in A has the lowest fee.'
    }
  ]);
  tasks.addEventListener('click', () => chal.update(challengeState));

  function deviance(missed, count) {
    const kept = count - missed;
    const p = missed / count;
    const missLog = missed === 0 ? 0 : missed * Math.log(p);
    const keptLog = kept === 0 ? 0 : kept * Math.log1p(-p);
    return -2 * (missLog + keptLog);
  }

  function fittedDeviances() {
    const [a, b, c, d] = misses.map(value => value * copies);
    const perGroup = 10 * copies;
    return [
      deviance(a + b + c + d, 4 * perGroup),
      deviance(a + b, 2 * perGroup) + deviance(c + d, 2 * perGroup),
      [a, b, c, d].reduce((sum, missed) => sum + deviance(missed, perGroup), 0)
    ];
  }

  function winners(scores) {
    const lowest = Math.min(...scores);
    return models.filter((_, i) => Math.abs(scores[i] - lowest) < 1e-9);
  }

  function plot(deviances, fees, scores, lowest) {
    const base = 235;
    const max = Math.max(...deviances) + 4 * Math.max(2, Math.log(40 * copies));
    const scale = 177 / max;
    const parts = [
      s('text', { x: 75, y: 22, fill: C.ink, 'font-size': 16 }, 'Deviance'),
      s('rect', { x: 179, y: 10, width: 15, height: 13, rx: 2, fill: C.violet }),
      s('text', { x: 201, y: 22, fill: C.violet, 'font-size': 16 }, 'Fee'),
      s('line', { x1: 24, x2: 376, y1: base, y2: base, stroke: C.line, 'stroke-width': 2 })
    ];
    colors.forEach((color, i) => {
      parts.push(s('rect', { x: 23 + 16 * i, y: 10, width: 12, height: 13, rx: 2, fill: color }));
    });
    models.forEach((model, i) => {
      const x = 81 + 119 * i;
      const fitHeight = deviances[i] * scale;
      const feeHeight = fees[i] * scale;
      const scoreY = base - fitHeight - feeHeight;
      const isLowest = lowest.includes(model);
      const labelColor = isLowest ? C.green : C.ink;
      const lab = (label, y, fill, fontSize) => s('text', {
        x, y, fill, 'font-size': fontSize, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, label);
      if (fitHeight > 0) {
        parts.push(s('rect', {
          x: x - 29, y: base - fitHeight, width: 58, height: fitHeight, rx: 2,
          fill: colors[i], 'fill-opacity': 0.76
        }));
      }
      const feeBlock = feeHeight / parameters[i];
      const gap = Math.min(2, feeBlock * 0.18);
      for (let j = 0; j < parameters[i]; j++) {
        parts.push(s('rect', {
          x: x - 29, y: base - fitHeight - (j + 1) * feeBlock,
          width: 58, height: feeBlock - gap, rx: 1, fill: C.violet
        }));
      }
      parts.push(lab(scoreText(scores[i]), scoreY - 8, labelColor, 18),
        lab(`Model ${model}`, base + 25, colors[i], 17),
        lab(isLowest ? 'Lowest' : `${parameters[i]} ${parameters[i] === 1 ? 'chance' : 'chances'}`, base + 46, labelColor, 15));
    });
    svg.replaceChildren(...parts);
    svg.setAttribute('aria-label', `${rule} scores. ${models.map((model, i) => `Model ${model}: ${scoreText(scores[i])}`).join('. ')}. Lowest: ${lowest.join(' and ')}.`);
  }

  function draw() {
    const n = 40 * copies;
    const deviances = fittedDeviances();
    const logSize = Math.log(n);
    const aic = deviances.map((d, i) => d + 2 * parameters[i]);
    const bic = deviances.map((d, i) => d + logSize * parameters[i]);
    const aicWinners = winners(aic);
    const bicWinners = winners(bic);
    const useBic = rule === 'BIC';
    const fee = useBic ? logSize : 2;
    const scores = useBic ? bic : aic;
    const lowest = useBic ? bicWinners : aicWinners;
    const fees = parameters.map(k => k * fee);

    sizeLabel.textContent = `${n} appointments · ${10 * copies} in each group`;
    size.setAttribute('aria-valuetext', `${n} appointments`);
    reports.forEach((report, i) => {
      report.textContent = `${misses[i] * copies} / ${10 * copies} missed (${misses[i] * 10}%)`;
      missControls[i].slider.setAttribute('aria-valuetext', `${misses[i] * 10} percent missed`);
    });
    ruleButtons.forEach((button, i) => {
      const selected = useBic === (i === 1);
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('go', selected);
    });

    plot(deviances, fees, scores, lowest);
    const equation = useBic ? `log(${n}) ≈ ${logSize.toFixed(2)} each` : '2 per parameter';
    fbox(box, [
      `${rule} = deviance + fee`,
      [equation, C.violet],
      ...models.map((model, i) => [
        `${model}: ${scoreText(deviances[i])} + ${scoreText(fees[i])} ≈ ${scoreText(scores[i])}`,
        lowest.includes(model) ? C.green : colors[i]
      ])
    ]);
    note.textContent = `AIC lowest: ${aicWinners.join(' and ')}. BIC lowest: ${bicWinners.join(' and ')}. Totals use the values before rounding.`;
    challengeState = {
      n, rule, aic: aicWinners.join(''), bic: bicWinners.join(''),
      original: misses.every((value, i) => value === START[i]),
      sameShares: misses.every(value => value === misses[0])
    };
    chal.update(challengeState);
  }

  draw();
}

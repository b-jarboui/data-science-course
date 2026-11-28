// 13.3.5 Try it: spend a limited budget on human-confirmed labels.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const groups = ['Matte', 'Mixed', 'Shiny'];
  const colors = ['#60a5fa', '#fb923c'];
  const material = answer => answer === 1 ? 'Metal' : 'Plastic';
  const percent = p => `${Math.round(p * 100)}%`;
  const errorText = value => value.toFixed(3);
  const original = {
    counts: [[0, 7], [1, 2], [2, 3]],
    pool: [[0, 0], [1, 1], [1, 0], [2, 1], [2, 0]]
  };
  const checking = [[0, 0], [0, 0], [1, 0], [2, 1]];

  let data = original, counts, photos, history, steps, selected, last;
  let budget = 3, generation = 0, timer = null, playing = false;
  const board = h('div', { 'aria-label': 'Photos and predictions' });
  const counter = h('span', { class: 'sim-note', role: 'status' });
  const box = h('div'), checks = h('div');
  const graph = s('svg', { viewBox: '0 0 390 208', role: 'img', 'aria-label': 'Checking error by iteration' });
  const speed = h('input', {
    type: 'range', min: 0.5, max: 3, step: 0.5, value: 1,
    'aria-label': 'Play speed', oninput: () => {
      speedLabel.textContent = `${speed.value}×`;
      if (playing) schedule();
    }
  });
  const speedLabel = h('span', {}, '1×');
  const limit = h('select', {
    'aria-label': 'Labelling budget',
    onchange: () => { budget = Number(limit.value); reset(); }
  }, ...[1, 2, 3, 4, 5].map(value =>
    h('option', { value, selected: value === budget }, String(value))));
  const stepButton = btn('Step', () => advance(false), 'go');
  const playButton = btn('Play', togglePlay);
  const askButton = btn('Ask about selected photo', () => advance(true));
  const chartCaption = h('p', { class: 'sim-note' });

  const photoButtons = Array.from({ length: 5 }, (_, i) => {
    const button = btn('', () => { selected = i; draw(); });
    button.style.textAlign = 'left';
    button.style.width = '100%';
    return button;
  });
  board.append(...photoButtons.map(button => h('div', { class: 'sim-row' }, button)));
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: choose which photos to label'),
    h('p', { class: 'sub' },
      'Step asks about the photo closest to 50% metal. To choose a photo yourself, select it and ask the worker. The learning counts update after each answer.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, counter, board,
        h('div', { class: 'sim-row' }, stepButton, playButton, askButton),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Checks allowed ', limit),
          h('label', {}, 'Speed ', speed, ' ', speedLabel)),
        h('div', { class: 'sim-row' },
          btn('Reset', reset), btn('New data', newData), btn('Lesson data', () => { data = original; reset(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, graph, chartCaption),
        h('div', { class: 'sim-card' }, checks)))));

  const tasks = challenges(checks, [
    {
      text: 'With Lesson data, select the photo you think Step will ask about first, then press Step.',
      check: state => state.lesson && state.steps[0]?.index === 1 && state.steps[0]?.prediction === 1 && !state.steps[0]?.manual,
      why: 'U2 and U3 are equally close to 50%, and U2 comes first.'
    },
    {
      text: 'With Lesson data, use Step to add a correct answer that makes checking error rise.',
      check: state => state.lesson && state.steps.some(step => !step.manual && step.afterLoss > step.beforeLoss),
      why: 'U2 really is metal, and its label raises the metal prediction for the mixed checking photo, which is plastic.'
    },
    {
      text: 'Set the budget to 3, press New data, then use Play to spend all three checks.',
      check: state => !state.lesson && state.generation > 0 && state.budget === 3 &&
        state.steps.length === 3 && state.steps.every(step => step.auto),
      why: 'After every answer, the rule uses the updated predictions to choose its next question.'
    }
  ]);

  function chance(group) {
    const [metal, total] = counts[group];
    return metal / total;
  }

  function loss() {
    return checking.reduce((sum, [group, answer]) => sum + (chance(group) - answer) ** 2, 0) / checking.length;
  }

  function nextPhoto() {
    // Compare fractions by cross-multiplication to preserve exact ties.
    let best = null;
    for (const photo of photos) {
      if (photo.checked) continue;
      const [metal, total] = counts[photo.group];
      const distance = Math.abs(2 * metal - total);
      if (!best || distance * best.total < best.distance * total) {
        best = { photo, distance, total };
      }
    }
    return best?.photo;
  }

  function pause() {
    clearTimeout(timer);
    timer = null;
    playing = false;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => advance(false), 1200 / Number(speed.value));
  }

  function togglePlay() {
    if (playing) {
      pause();
      draw();
    } else {
      playing = true;
      advance(false);
    }
  }

  function reset() {
    pause();
    counts = data.counts.map(row => row.slice());
    photos = data.pool.map(([group, answer], index) => ({ index, group, answer, checked: false }));
    history = [loss()];
    steps = [];
    selected = null;
    last = null;
    draw();
  }

  function newData() {
    generation++;
    const totals = [rnd(4, 7), rnd(2, 4), rnd(2, 4)];
    const surfaces = [0, 1, 2, rnd(0, 2), rnd(0, 2)];
    for (let i = surfaces.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [surfaces[i], surfaces[j]] = [surfaces[j], surfaces[i]];
    }
    data = {
      counts: totals.map((total, group) => [rnd(0, total), total]),
      pool: surfaces.map(group => [group, rnd(0, 1)])
    };
    reset();
  }

  function advance(manual) {
    if (manual) pause();
    if (steps.length >= budget) return;
    const photo = manual ? photos[selected] : nextPhoto();
    if (!photo || photo.checked) return;
    const { group, answer, index } = photo;
    const [metal, total] = counts[group];
    const old = metal / total;
    const beforeLoss = history[history.length - 1];
    counts[group] = [metal + answer, total + 1];
    photo.checked = true;
    last = {
      index, group, answer, metal, total, old, current: chance(group),
      beforeLoss, afterLoss: loss(), manual, prediction: selected, auto: playing
    };
    steps.push(last);
    history.push(last.afterLoss);
    selected = null;
    if (steps.length >= budget) pause();
    if (playing) schedule();
    draw();
  }

  function chart() {
    const left = 49, right = 363, top = 34, base = 151;
    const ceiling = Math.max(0.2, Math.ceil(Math.max(...history) * 5) / 5);
    const x = i => left + i * (right - left) / budget;
    const y = value => base - value / ceiling * (base - top);
    const text = (value, a, b, fill = C.muted, anchor = 'middle') => s('text', {
      x: a, y: b, fill, 'text-anchor': anchor, 'font-family': 'Consolas', 'font-size': 16
    }, value);
    const parts = [text('Checking error', 10, 20, C.ink, 'start')];
    for (let i = 0; i <= 4; i++) {
      const value = ceiling * i / 4, height = y(value);
      parts.push(s('line', { x1: left, x2: right, y1: height, y2: height, stroke: C.line }),
        text(value.toFixed(2), left - 8, height + 5, C.muted, 'end'));
    }
    for (let i = 0; i <= budget; i++) parts.push(text(i, x(i), base + 23));
    parts.push(text('Worker answers added', (left + right) / 2, 199, C.ink));
    if (history.length > 1) {
      parts.push(s('polyline', {
        points: history.map((value, i) => `${x(i)},${y(value)}`).join(' '),
        fill: 'none', stroke: C.cyan, 'stroke-width': 3
      }));
    }
    history.forEach((value, i) => parts.push(s('circle', {
      cx: x(i), cy: y(value), r: 4.5, fill: i === history.length - 1 ? C.amber : C.cyan
    }, s('title', {}, `After ${i} answers: ${errorText(value)}`))));
    graph.replaceChildren(...parts);
    graph.setAttribute('aria-label', `Checking error by iteration: ${history.map(errorText).join(', ')}`);
    chartCaption.textContent = 'Error uses the same four separate checking photos each time.';
  }

  function draw() {
    const stopped = steps.length >= budget;
    counter.textContent = `Iteration ${steps.length} of ${budget} · ${12 + steps.length} labelled in the lesson example`;
    if (data !== original) {
      const labelled = counts.reduce((total, [, count]) => total + count, 0);
      counter.textContent = `Iteration ${steps.length} of ${budget} · ${labelled} labelled`;
    }

    photos.forEach(photo => {
      const button = photoButtons[photo.index];
      const id = `U${photo.index + 1}`, surface = groups[photo.group];
      button.disabled = stopped || playing || photo.checked;
      button.setAttribute('aria-pressed', String(selected === photo.index));
      button.style.borderColor = selected === photo.index ? C.amber : '';
      button.style.opacity = '1';
      if (photo.checked) {
        button.replaceChildren(`${id} · ${surface} · `,
          h('span', { style: { color: colors[photo.answer] } }, `✓ ${material(photo.answer)}`));
      } else {
        const p = chance(photo.group);
        const track = h('span', {
          'aria-hidden': true,
          style: { position: 'relative', display: 'block', marginTop: '0.35rem', height: '0.38rem', background: C.line }
        }, h('span', {
          style: { display: 'block', width: percent(p), height: '100%', background: C.cyan }
        }), h('span', {
          style: { position: 'absolute', left: '50%', top: '-2px', bottom: '-2px', width: '2px', background: C.amber }
        }));
        button.replaceChildren(`${id} · ${surface} · ${percent(p)} metal`, track);
      }
    });
    stepButton.disabled = stopped || playing;
    playButton.disabled = stopped;
    playButton.textContent = playing ? 'Pause' : 'Play';
    askButton.disabled = stopped || playing || selected === null;

    if (last) {
      const sign = last.current < last.old ? '−' : '+';
      const change = Math.abs(last.current - last.old) * 100;
      fbox(box, [
        [`U${last.index + 1} ✓ ${material(last.answer)}`, colors[last.answer]],
        `${groups[last.group]} metal prediction`,
        `Before: ${last.metal}/${last.total} = ${percent(last.old)}`,
        `Add: ${last.answer} metal / 1 photo`,
        `After: ${last.metal + last.answer}/${last.total + 1} = ${percent(last.current)}`,
        `Change: ${sign}${change.toFixed(1)} points`,
        [`Error: ${errorText(last.beforeLoss)} → ${errorText(last.afterLoss)}`,
          last.afterLoss > last.beforeLoss ? C.amber : C.green]
      ]);
    } else {
      fbox(box, [
        'Chance of metal = metal ÷ labelled',
        ...counts.map(([metal, total], group) => `${groups[group]}: ${metal}/${total} = ${percent(metal / total)}`),
        [`Starting error: ${errorText(history[0])}`, C.cyan]
      ]);
    }

    chart();
    tasks.update({ steps, budget, generation, lesson: data === original });
  }

  reset();
  return pause;
}

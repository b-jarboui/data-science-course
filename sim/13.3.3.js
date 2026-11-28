// 13.3.3 Try it: one material label plus a handling warning when it applies.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const colors = ['#60a5fa', '#fb923c', C.violet];
  const names = ['Plastic', 'Metal', 'Protect hands'];
  const examples = {
    J: { plastic: 20, warning: 90, material: 1, sharp: true },
    G: { plastic: 90, warning: 80, material: 0, sharp: true },
    K: { plastic: 10, warning: 20, material: 1, sharp: false },
  };

  let photo = 'J';
  let { plastic, warning } = examples.J;
  let threshold = 50;

  const art = s('svg', { viewBox: '0 0 400 294', role: 'img', 'aria-label': 'Photo, scores and selected labels' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const challengeHost = h('div');

  function slider(name, change) {
    const value = h('span', { style: { color: C.ink, fontWeight: '700' } });
    const input = h('input', {
      type: 'range', min: 0, max: 100, step: 1, 'aria-label': name,
      style: { width: '100%', minWidth: '0', minHeight: '44px', margin: '0', accentColor: C.cyan },
      oninput: event => {
        change(Number(event.target.value));
        draw();
      },
    });
    return {
      node: h('label', { style: { display: 'block', marginTop: '.55rem' } },
        h('span', { style: { display: 'flex', justifyContent: 'space-between', gap: '.5rem' } }, name, value),
        input),
      set(n) {
        input.value = n;
        value.textContent = `${n}%`;
      },
    };
  }

  const plasticInput = slider('Plastic score', n => { plastic = n; });
  const warningInput = slider('Protect hands score', n => { warning = n; });
  const thresholdInput = slider('Warning threshold', n => { threshold = n; });

  function pick(id) {
    photo = id;
    ({ plastic, warning } = examples[id]);
    threshold = 50;
    draw();
  }

  function randomScores() {
    photo = 'New item';
    plastic = rnd(0, 100);
    warning = rnd(0, 100);
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: give one item its labels'),
    h('p', { class: 'sub' }, 'Change the scores and the warning threshold. The Plastic and Metal scores share 100%.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, art,
        h('div', { class: 'sim-row' },
          btn('Photo J', () => pick('J')),
          btn('Photo G', () => pick('G')),
          btn('Photo K', () => pick('K')),
          btn('New data', randomScores, 'go')),
        plasticInput.node, warningInput.node, thresholdInput.node),
      h('div', {},
        h('div', { class: 'sim-card', 'aria-live': 'polite' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    {
      text: 'Give the item just the Plastic label.',
      check: state => state.plastic > state.metal && !state.addWarning,
      why: 'Plastic has the higher material score and the warning score is below the threshold.',
    },
    {
      text: 'Give the item Metal and Protect hands with a warning score that exactly reaches the threshold.',
      check: state => state.metal > state.plastic && state.addWarning && state.warning === state.threshold,
      why: 'A warning score equal to the threshold is enough to add Protect hands.',
    },
    {
      text: 'Set a Metal score and a Protect hands score that add up to 170%, then select both labels.',
      check: state => state.material === 1 && state.addWarning && state.metal + state.warning === 170,
      why: 'The Metal and Protect hands scores can add to 170% because they answer two questions.',
    },
  ]);

  function text(x, y, copy, color = C.ink, size = 16, anchor = 'start') {
    return s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Segoe UI, Arial, sans-serif', 'font-weight': 650 }, copy);
  }

  function symbol(i, x, y) {
    const fill = colors[i];
    if (i === 0) return s('circle', { cx: x, cy: y, r: 4, fill });
    if (i === 1) return s('rect', { x: x - 4, y: y - 4, width: 8, height: 8, fill });
    return s('polygon', { points: `${x},${y - 5} ${x - 5},${y + 4} ${x + 5},${y + 4}`, fill });
  }

  function tag(i, x, y) {
    const width = [82, 74, 132][i];
    return s('g', {},
      s('rect', { x, y, width, height: 27, rx: 13, fill: colors[i], 'fill-opacity': 0.13, stroke: colors[i] }),
      symbol(i, x + 12, y + 14),
      text(x + 22, y + 19, names[i], C.ink, 14));
  }

  function itemArt(item) {
    if (!item) {
      return s('path', { d: 'M 55 39 L 77 31 L 108 44 L 102 70 L 67 74 Z',
        fill: C.line, stroke: C.muted, 'stroke-width': 2 });
    }
    const color = colors[item.material];
    if (item.sharp) {
      return s('path', { d: 'M 44 67 L 52 47 L 70 43 L 83 48 L 107 32 L 103 47 L 122 40 L 113 66 L 89 73 Z',
        fill: item.material === 1 ? '#8e9cb9' : '#284b79', stroke: color, 'stroke-width': 2 });
    }
    return s('g', {},
      s('rect', { x: 67, y: 33, width: 35, height: 41, rx: 7, fill: '#677793', stroke: color, 'stroke-width': 2 }),
      s('path', { d: 'M 71 42 H 98 M 74 46 V 66', fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
  }

  function draw() {
    const metal = 100 - plastic;
    const material = plastic >= metal ? 0 : 1;
    const addWarning = warning >= threshold;
    const scores = [plastic, metal, warning];

    plasticInput.set(plastic);
    warningInput.set(warning);
    thresholdInput.set(threshold);

    const marks = [
      s('rect', { x: 5, y: 5, width: 390, height: 284, rx: 14, fill: C.bg, stroke: C.line }),
    ];
    for (let x = 26; x < 390; x += 24) {
      marks.push(s('line', { x1: x, x2: x, y1: 10, y2: 284, stroke: C.line, opacity: 0.36 }));
    }
    for (let y = 22; y < 284; y += 24) {
      marks.push(s('line', { x1: 10, x2: 390, y1: y, y2: y, stroke: C.line, opacity: 0.36 }));
    }

    const item = examples[photo];
    marks.push(
      s('rect', { x: 20, y: 21, width: 128, height: 67, rx: 8, fill: C.card,
        stroke: item ? colors[item.material] : C.muted }),
      text(29, 40, item ? photo : '?', C.ink, 16),
      itemArt(item),
      text(163, 42, item ? `Photo ${photo} · selected labels` : 'New item · selected labels', C.ink, 16),
      tag(material, 163, 51),
    );
    if (addWarning) marks.push(tag(2, 251, 51));

    const x0 = 23;
    const width = 354;
    scores.forEach((score, i) => {
      const y = 119 + i * 57;
      marks.push(
        symbol(i, x0 + 4, y - 5),
        text(x0 + 16, y, names[i], colors[i]),
        text(x0 + width, y, `${score}%`, C.ink, 17, 'end'),
        s('rect', { x: x0, y: y + 8, width, height: 11, rx: 5, fill: C.line }),
        s('rect', { x: x0, y: y + 8, width: width * score / 100, height: 11, rx: 5, fill: colors[i] }),
      );
    });

    const cutoffX = x0 + width * threshold / 100;
    const cutoffTextX = Math.min(322, Math.max(78, cutoffX));
    marks.push(
      s('line', { x1: cutoffX, x2: cutoffX, y1: 237, y2: 259, stroke: C.ink, 'stroke-width': 2 }),
      text(cutoffTextX, 278, `Threshold ${threshold}%`, C.ink, 14, 'middle'),
    );
    art.replaceChildren(...marks);
    art.setAttribute('aria-label', `${item ? `Photo ${photo}` : 'New item'}. Plastic ${plastic}%, Metal ${metal}%, Protect hands ${warning}%. Threshold ${threshold}%. Selected: ${names[material]}${addWarning ? ' and Protect hands' : ''}.`);

    const materialLine = plastic === metal
      ? `${plastic}% = ${metal}% · Plastic on a tie`
      : `${names[material]} ${scores[material]}% > ${scores[1 - material]}%`;
    const warningLine = `${warning}% ${addWarning ? '≥' : '<'} ${threshold}% · ${addWarning ? 'add warning' : 'no warning'}`;
    fbox(box, [[materialLine, colors[material]], [warningLine, colors[2]]]);
    note.textContent = 'The higher material score picks one material. The warning score answers its own question.';
    chal.update({ plastic, metal, warning, threshold, material, addWarning });
  }

  // Recheck the current scores when the learner opens another challenge.
  challengeHost.addEventListener('click', draw);
  draw();
  return () => challengeHost.removeEventListener('click', draw);
}

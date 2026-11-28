// 13.3.2 Try it: change the mix of practice photos.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BLUE = '#70baff';
  const ORANGE = '#ffad66';
  const original = { plastic: 9, metal: 3 };
  const validation = ['V1', 'V2', 'V3', 'V4'];
  let data = original;
  let mode = 'copy';
  let iteration = 0;
  let timer = null;

  const svg = s('svg', { viewBox: '0 0 360 346', role: 'img' });
  const box = h('div', { 'aria-live': 'polite' });
  const challengeArea = h('div');
  const progress = h('input', {
    type: 'range', min: 0, step: 1, value: 0,
    oninput: () => { pause(); iteration = Number(progress.value); draw(); }
  });
  const speed = h('input', {
    type: 'range', min: 1, max: 5, step: 1, value: 2,
    oninput: () => { if (timer !== null) { pause(); start(); } }
  });
  const copyButton = btn('Copy metal', () => choose('copy'));
  const removeButton = btn('Remove plastic', () => choose('remove'));
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', () => {
    if (timer === null) start();
    else pause();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: change the learning mix'),
    h('p', { class: 'sub' }, 'Copy metal photos or remove plastic photos. Use the slider or Step to change the learning pile. The four checking photos stay in their own panel.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, copyButton, removeButton),
        h('div', { class: 'sim-row' }, h('label', {}, 'Resampling steps ', progress), h('label', {}, 'Speed ', speed)),
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', () => choose(mode)),
          btn('New data', newData),
          btn('Lesson data', () => { data = original; choose('copy'); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeArea)))));

  const chal = challenges(challengeArea, [
    {
      text: 'With the lesson data, make the learning pile 40% metal by copying.',
      check: st => st.lesson && st.mode === 'copy' && st.metal === 6,
      why: 'One extra copy of each metal photo gives 6 metal entries out of 15.'
    },
    {
      text: 'Keep all nine plastic photos and make the lesson pile 50% metal.',
      check: st => st.lesson && st.plastic === 9 && st.metal === 9,
      why: 'Two rounds of copying balance the pile using the same three metal photos.'
    },
    {
      text: 'Balance the lesson pile by removing plastic photos. How many learning photos are left?',
      check: st => st.lesson && st.mode === 'remove' && st.plastic === 3,
      why: 'Three plastic and three metal photos make six learning entries. The four checking photos keep their original mix.'
    }
  ]);

  const gap = () => data.plastic - data.metal;
  const limit = () => mode === 'copy' ? Math.ceil(gap() / data.metal) : gap();

  function counts(i) {
    const added = mode === 'copy' ? Math.min(i * data.metal, gap()) : 0;
    const plastic = data.plastic - (mode === 'remove' ? i : 0);
    const metal = data.metal + added;
    const share = 100 * metal / (plastic + metal);
    return { plastic, metal, added, share, loss: (share - 50) ** 2 };
  }

  function pause() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function choose(next) {
    pause();
    mode = next;
    iteration = 0;
    draw();
  }

  function step() {
    if (iteration < limit()) iteration++;
    if (iteration === limit()) pause();
    draw();
  }

  function start() {
    if (iteration >= limit()) return;
    playButton.textContent = 'Pause';
    timer = setInterval(step, 1600 / Number(speed.value));
  }

  function newData() {
    const options = [];
    for (let plastic = 6; plastic <= 9; plastic++) {
      for (let metal = 2; metal <= 4; metal++) {
        if (plastic !== data.plastic || metal !== data.metal) options.push({ plastic, metal });
      }
    }
    data = options[rnd(0, options.length - 1)];
    choose(mode);
  }

  const label = (x, y, text, color = C.ink, size = 13, anchor = 'start') => s('text', {
    x, y, fill: color, 'font-size': size, 'font-family': 'Consolas, monospace', 'text-anchor': anchor
  }, text);

  const rect = (x, y, width, height, fill, stroke, rx = 5) =>
    s('rect', { x, y, width, height, fill, stroke, rx });

  function tile(id, i, y, metal, copy = false) {
    const x = 18 + i * 36;
    const color = metal ? ORANGE : BLUE;
    const marker = metal
      ? rect(x + 5, y + 20, 5, 5, color, color, 0)
      : s('circle', { cx: x + 7.5, cy: y + 22.5, r: 2.7, fill: color });
    return s('g', {}, rect(x, y, 31, 30, C.card, color),
      label(x + 15.5, y + 13.5, id, C.ink, 12, 'middle'),
      marker, label(x + 20, y + 26, copy ? 'copy' : '✓', color, copy ? 8 : 10, 'middle'));
  }

  function curve() {
    const x0 = 46, x1 = 334, y0 = 312, y1 = 263;
    const high = counts(0).loss;
    const points = Array.from({ length: iteration + 1 }, (_, i) => [
      x0 + (x1 - x0) * i / limit(), y0 - (y0 - y1) * counts(i).loss / high
    ]);
    return [
      label(18, 250, 'Balance loss by step', C.amber, 14),
      s('path', { d: `M ${x0} ${y1} V ${y0} H ${x1}`, fill: 'none', stroke: C.muted }),
      label(x0 - 5, y1 + 4, fmt(high), C.ink, 9, 'end'),
      label(x0 - 5, y0 + 4, '0', C.ink, 10, 'end'),
      label(x0, 331, '0', C.ink, 11, 'middle'),
      label(x1, 331, String(limit()), C.ink, 11, 'middle'),
      s('polyline', { points: points.map(p => p.join(',')).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 2 }),
      ...points.map(([cx, cy]) => s('circle', { cx, cy, r: 3.5, fill: C.amber }))
    ];
  }

  function draw() {
    const now = counts(iteration);
    const before = counts(Math.max(0, iteration - 1));
    const pIds = [...'ABCDEFGHI'].slice(0, now.plastic);
    const mIds = [...'JKLM'].slice(0, data.metal);
    const entries = mIds.flatMap((id, i) => [
      { id, copy: false },
      ...Array.from({ length: Math.floor((now.added + data.metal - 1 - i) / data.metal) }, () => ({ id, copy: true }))
    ]);
    svg.setAttribute('aria-label',
      `Step ${iteration}. Learning photos: ${now.plastic} plastic and ${now.metal} metal. Checking photos: 3 plastic and 1 metal. Balance loss: ${fmt(now.loss)}.`);
    svg.replaceChildren(
      rect(1, 1, 358, 344, C.bg, C.line, 9),
      label(18, 23, `Learning photos · Step ${iteration} of ${limit()}`, C.ink, 14),
      label(18, 44, `${now.plastic} plastic`, BLUE),
      ...pIds.map((id, i) => tile(id, i, 52, false)),
      label(18, 104, `${now.metal} metal`, ORANGE),
      ...entries.map(({ id, copy }, i) => tile(id, i, 111, true, copy)),
      rect(10, 156, 340, 72, C.card, C.violet, 8),
      label(18, 176, 'Checking photos · 3 plastic, 1 metal', C.violet),
      ...validation.map((id, i) => tile(id, i, 184, i === 3)),
      ...curve()
    );

    progress.max = limit();
    progress.value = iteration;
    progress.setAttribute('aria-valuetext', `Step ${iteration} of ${limit()}`);
    stepButton.disabled = iteration === limit();
    playButton.disabled = iteration === limit();
    copyButton.setAttribute('aria-pressed', String(mode === 'copy'));
    removeButton.setAttribute('aria-pressed', String(mode === 'remove'));

    const change = mode === 'copy'
      ? `Added ${now.metal - before.metal} metal ${now.metal - before.metal === 1 ? 'copy' : 'copies'}`
      : 'Removed 1 plastic photo';
    fbox(box, [
      ['Metal share = metal ÷ total', ORANGE],
      `${now.metal} ÷ ${now.plastic + now.metal} = ${fmt(now.share)}%`,
      iteration ? change : 'Starting mix',
      ...(iteration ? [`Metal share: ${fmt(before.share)}% → ${fmt(now.share)}%`] : []),
      ['Balance loss (distance from 50% squared)', C.amber],
      `(${fmt(now.share)} − 50)² ≈ ${fmt(now.loss)}`
    ]);
    chal.update({ lesson: data === original, mode, plastic: now.plastic, metal: now.metal });
  }

  draw();
  return pause;
}

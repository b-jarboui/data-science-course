// 20.1.1 Try it: change which campus pages the model reads.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [40, 20, 20, 20];
  const names = ['Newsletters', 'Club notices', 'Menus', 'Ads'];
  let source = START.slice();
  let tutoring = 4, selected = 0, dropAds = false, dropFree = false, random = false;

  const svg = s('svg', {
    viewBox: '0 0 360 280', role: 'img',
    'aria-label': 'Words kept and removed from each campus source',
  });
  const box = h('div', { 'aria-live': 'polite' });
  const note = h('p', { class: 'sim-note' });
  const challengePanel = h('div');
  const adButton = btn('Remove ads', () => { dropAds = !dropAds; draw(); });
  const freeButton = btn('Drop club pages with “free”', () => { dropFree = !dropFree; draw(); });
  const selectors = names.map((name, i) => btn(name, () => { selected = i; draw(); }));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: choose what the model reads'),
    h('p', { class: 'sub' }, 'Remove ads or drop club pages that contain “free”. Select a group to see its share of the words you keep.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Inspect a group' }, ...selectors),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Change which pages are kept' },
          adButton, freeButton, btn('New data', newData, 'go'), btn('Reset', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const tasks = challenges(challengePanel, [
    {
      text: 'With the lesson data, remove ads and select Newsletters to find their new share.',
      check: st => !st.random && st.selected === 0 && st.share === 50 && st.kept[0] === 40,
      why: 'The same 40,000 newsletter words are now half of the 80,000 kept words.',
    },
    {
      text: 'With the lesson data, drop club pages with “free” and select Club notices.',
      check: st => !st.random && st.selected === 1 && st.dropped[1] === 4,
      why: 'The rule removes 4,000 of the original 20,000 club words, including a free tutoring notice.',
    },
    {
      text: 'Press New data, then remove every ad while keeping the free tutoring notice.',
      check: st => st.random && st.kept[3] === 0 && st.dropped[1] === 0,
      why: 'Removing ads by source keeps the useful club pages that contain “free”.',
    },
  ]);

  // The kit redraws its navigation on click. Check the newly visible task
  // against the current data after its navigation handler has run.
  function checkTask() { tasks.update(state()); }
  challengePanel.addEventListener('click', checkTask);

  function reset() {
    source = START.slice();
    tutoring = 4;
    selected = 0;
    dropAds = false;
    dropFree = false;
    random = false;
    draw();
  }

  function newData() {
    const next = [rnd(24, 52), rnd(12, 33), rnd(10, 32), rnd(8, 30)];
    if (next.every((value, i) => value === source[i])) {
      next[0] = next[0] === 52 ? 24 : next[0] + 1;
    }
    source = next;
    tutoring = rnd(1, Math.floor(source[1] / 2));
    dropAds = false;
    dropFree = false;
    random = true;
    draw();
  }

  function state() {
    const dropped = [0, dropFree ? tutoring : 0, 0, dropAds ? source[3] : 0];
    const kept = source.map((amount, i) => amount - dropped[i]);
    const total = kept.reduce((sum, amount) => sum + amount, 0);
    return { dropped, kept, total, share: 100 * kept[selected] / total, selected, random };
  }

  const count = k => (k * 1000).toLocaleString('en-US');
  const svgText = (label, x, y, color, size = 13, anchor = 'start') => s('text', {
    x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
    'font-family': 'Segoe UI, Arial, sans-serif',
  }, label);

  function draw() {
    const st = state();
    const max = Math.ceil(Math.max(...source) / 10) * 10;
    const left = 105, width = 235;
    const scale = value => value * width / max;
    const marks = [
      s('rect', { x: 7, y: 11, width: 12, height: 12, rx: 2, fill: C.cyan }),
      svgText('Kept', 24, 22, C.ink),
      s('rect', { x: 84, y: 11, width: 12, height: 12, rx: 2, fill: C.pink }),
      svgText('Removed', 101, 22, C.ink),
      svgText('Words', left + width, 271, C.muted, 12, 'end'),
    ];

    for (let tick = 0; tick <= max; tick += 10) {
      const px = left + scale(tick);
      marks.push(
        s('line', { x1: px, x2: px, y1: 45, y2: 220, stroke: C.line }),
        svgText(tick ? `${tick}k` : '0', px, 240, C.muted, 12, 'middle'),
      );
    }

    source.forEach((amount, i) => {
      const y = 53 + i * 43;
      const keptWidth = scale(st.kept[i]);
      const droppedWidth = scale(st.dropped[i]);
      if (i === selected) {
        marks.push(s('rect', {
          x: 2, y: y - 7, width: 350, height: 36, rx: 7,
          fill: C.amber, 'fill-opacity': 0.08, stroke: C.amber, 'stroke-opacity': 0.55,
        }));
      }
      marks.push(svgText(names[i], 8, y + 15, i === selected ? C.amber : C.ink));
      if (keptWidth) {
        marks.push(s('rect', { x: left, y, width: keptWidth, height: 21, rx: 2, fill: C.cyan }));
      }
      if (droppedWidth) {
        marks.push(s('rect', {
          x: left + keptWidth, y, width: droppedWidth, height: 21, rx: 2, fill: C.pink,
        }));
      }
      marks.push(svgText(count(amount), left + scale(amount) - 4, y + 15, C.bg, 12, 'end'));
    });
    svg.replaceChildren(...marks);

    selectors.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === selected));
      button.classList.toggle('go', i === selected);
    });
    adButton.textContent = dropAds ? 'Restore ads' : 'Remove ads';
    freeButton.textContent = dropFree ? 'Restore club pages with “free”' : 'Drop club pages with “free”';

    const lines = [
      names[selected],
      `Words kept in group = ${count(st.kept[selected])}`,
      `Total words kept = ${count(st.total)}`,
      [`Share = ${count(st.kept[selected])} ÷ ${count(st.total)} × 100 = ${fmt(st.share)}%`, C.amber],
    ];
    if (selected === 1 && dropFree) {
      lines.push([`Club text lost = ${count(tutoring)} ÷ ${count(source[1])} × 100 = ${fmt(100 * tutoring / source[1])}%`, C.pink]);
    }
    fbox(box, lines);
    note.textContent = dropFree
      ? 'Removed club pages include a notice offering free tutoring.'
      : 'Kept club pages include a notice offering free tutoring.';
    tasks.update(st);
  }

  draw();
  return () => challengePanel.removeEventListener('click', checkTask);
}

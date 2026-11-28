// 20.1.2 Try it: compare exact matches and near-duplicates.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, fmt, challenges } = kit;
  const WORDS = 100;
  const TITLES = ['Library', 'Pool', 'Exams', 'Clubs', 'Sports'];
  const original = () => [
    ...Array.from({ length: 4 }, () => ({ welcome: true, day: 'Monday' })),
    ...TITLES.slice(0, 4).map(title => ({ title })),
  ];

  let files = original();
  let selected = 0;
  let mode = 'all';
  let protectTuesday = false;

  const grid = h('div', {
    role: 'group',
    'aria-label': 'Newsletter files',
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 8rem), 1fr))',
      gap: '0.5rem',
    },
  });
  const box = h('div');
  const note = h('div', { class: 'sim-note', role: 'status' });
  const challengePanel = h('div');
  const changeDay = btn('Change day', () => {
    const file = files[selected];
    file.day = file.day === 'Monday' ? 'Tuesday' : 'Monday';
    draw();
  });
  const addCopy = btn('Add a copy', () => {
    if (files.length >= 12) return;
    const source = files[selected];
    const copy = source.welcome ? source : files.find(file => file.welcome);
    files.push({ ...copy });
    selected = files.length - 1;
    draw(true);
  });
  const protection = h('input', {
    type: 'checkbox',
    onchange: event => {
      protectTuesday = event.target.checked;
      draw();
    },
    style: { width: '1.2rem', height: '1.2rem', accentColor: C.cyan },
  });
  const modeButtons = [
    ['all', 'Show all files'],
    ['exact', 'Keep one exact copy'],
    ['near', 'Remove near-duplicates'],
  ].map(([value, label]) => [value, btn(label, () => {
    mode = value;
    draw();
  })]);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: remove repeated newsletters'),
    h('p', { class: 'sub' },
      'Each file contains 100 words. Select a Welcome Week file and change its day to see which copies each check keeps.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, grid,
        h('div', { class: 'sim-row' }, changeDay, addCopy,
          btn('New data', newData),
          btn('Reset', () => reset(original()))),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Duplicate check' },
          modeButtons.map(([, button]) => button)),
        h('label', {
          class: 'sim-row',
          style: { minHeight: '44px', cursor: 'pointer' },
        }, protection, 'Keep one Tuesday version when the day matters')),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const tasks = challenges(challengePanel, [
    {
      text: 'Reset, then use exact matching to bring Welcome Week’s share down to 20%.',
      check: st => st.mode === 'exact' && st.kept === 5 && st.welcome === 1 && st.removed >= 1,
      why: 'One Welcome Week file out of five gives 100 of 500 words, or 20%.',
    },
    {
      text: 'Change just one Welcome Week file to Tuesday and use exact matching to get about 33%.',
      check: st => st.mode === 'exact' && st.tuesdays === 1 && st.kept === 6 && st.welcome === 2,
      why: 'The two versions differ by one word, so exact matching keeps both and they make up 200 of 600 words.',
    },
    {
      text: 'Keep the one-word change in the original files, then use the near-duplicate check to get back to 20%.',
      check: st => st.mode === 'near' && !st.protectTuesday && st.tuesdays === 1 &&
        st.kept === 5 && st.welcome === 1,
      why: 'The near-duplicate check groups the two versions because 99 of their 100 words match.',
    },
    {
      text: 'Use the near-duplicate check and keep both versions because the start day matters.',
      check: st => st.mode === 'near' && st.protectTuesday && st.tuesdays > 0 && st.welcome === 2,
      why: 'Keeping one file for each day preserves the different start dates while removing repeated copies.',
    },
  ]);

  function reset(nextFiles) {
    files = nextFiles;
    selected = 0;
    mode = 'all';
    protectTuesday = false;
    draw();
  }

  function newData() {
    const start = rnd(0, TITLES.length - 1);
    const distinct = rnd(2, TITLES.length - 1);
    const copies = rnd(2, 5);
    const hasChange = rnd(0, 1) === 1;
    const next = Array.from({ length: distinct }, (_, i) => ({
      title: TITLES[(start + i) % TITLES.length],
    }));
    for (let i = 0; i < copies; i++) {
      next.push({ welcome: true, day: i === copies - 1 && hasChange ? 'Tuesday' : 'Monday' });
    }
    for (let i = next.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [next[i], next[j]] = [next[j], next[i]];
    }
    if (JSON.stringify(next) === JSON.stringify(files)) next.reverse();
    reset(next);
  }

  function keptFiles() {
    const seen = new Set();
    const keepBothDays = mode === 'exact' || (mode === 'near' && protectTuesday);
    return files.map(file => {
      if (mode === 'all' || !file.welcome) return true;
      const key = keepBothDays ? file.day : 'Welcome week';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  let state;
  function draw(focusTile = false) {
    const kept = keptFiles();
    const count = kept.filter(Boolean).length;
    const welcome = files.filter((file, i) => file.welcome && kept[i]).length;
    const tuesdays = files.filter(file => file.day === 'Tuesday').length;
    const removed = files.length - count;
    const words = count * WORDS;
    const welcomeWords = welcome * WORDS;
    const percent = 100 * welcomeWords / words;
    const displayedPercent = Number.isInteger(percent) ? `${percent}%` : `about ${fmt(percent)}%`;

    const tiles = files.map((file, i) => {
      const active = i === selected;
      const color = !kept[i] ? C.pink : file.day === 'Tuesday' ? C.amber : file.welcome ? C.cyan : C.violet;
      const status = !kept[i] ? 'Removed' : mode === 'all' ? '100 words' : 'Kept · 100 words';
      const tile = btn('', () => {
        selected = i;
        draw(true);
      });
      tile.setAttribute('aria-pressed', String(active));
      Object.assign(tile.style, {
        display: 'grid',
        textAlign: 'left',
        gap: '0.2rem',
        padding: '0.55rem 0.65rem',
        borderColor: active ? C.ink : color,
        backgroundColor: kept[i] ? C.bg : C.card,
      });
      tile.replaceChildren(
        h('span', { style: { fontSize: '0.8rem', color: C.ink } }, `File ${i + 1}`),
        h('span', { style: { color } }, file.welcome ? 'Welcome week' : file.title),
        h('span', { style: { fontSize: '0.85rem' } }, file.welcome ? `Starts ${file.day}` : ''),
        h('span', { style: { fontSize: '0.8rem', color: kept[i] ? C.ink : C.pink } }, status),
      );
      return tile;
    });
    grid.replaceChildren(...tiles);
    if (focusTile) tiles[selected].focus();

    const file = files[selected];
    changeDay.disabled = !file.welcome;
    changeDay.textContent = file.welcome
      ? `Change to ${file.day === 'Monday' ? 'Tuesday' : 'Monday'}`
      : 'Change day';
    addCopy.disabled = files.length >= 12;
    addCopy.textContent = file.welcome ? 'Copy selected file' : 'Add Welcome Week copy';
    protection.checked = protectTuesday;
    for (const [value, button] of modeButtons) {
      button.setAttribute('aria-pressed', String(mode === value));
      button.classList.toggle('go', mode === value);
    }

    fbox(box, [
      `All kept words = ${count} × ${WORDS} = ${words}`,
      `Welcome Week = ${welcome} × ${WORDS} = ${welcomeWords}`,
      [`${welcomeWords} ÷ ${words} × 100 = ${displayedPercent}`, C.cyan],
    ]);
    if (mode === 'all') {
      note.textContent = `All ${files.length} files are included.`;
    } else if (mode === 'exact') {
      note.textContent = `${removed} removed. Exact matching keeps one file for each start day present.`;
    } else if (protectTuesday) {
      note.textContent = `${removed} removed. The start day is marked as important, so each version can stay.`;
    } else {
      note.textContent = `${removed} removed. Monday and Tuesday versions share 99 of 100 words, so the check keeps the first Welcome Week file.`;
    }

    state = { mode, protectTuesday, tuesdays, kept: count, welcome, removed };
    tasks.update(state);
  }

  challengePanel.addEventListener('click', () => tasks.update(state));
  draw();
}

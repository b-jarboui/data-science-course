// 21.1.10 Try it: change the catalog, then see what a checked request can return.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const BOOK = 'The Hobbit';
  const LOOKUP = 'check_catalog';
  const START = [true, false, false];
  let copies = START.slice();
  let tool = LOOKUP;
  let attempt = null;

  const svg = s('svg', {
    viewBox: '0 0 380 276',
    role: 'img',
    'aria-label': 'Catalog and request flow',
  });
  const slots = h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Book copies' });
  const catalogNote = h('div', { class: 'sim-note' });
  const box = h('div');
  const note = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const challengeCard = h('div');
  const titleInput = h('input', {
    type: 'text', value: BOOK, autocomplete: 'off',
    style: { width: 'min(100%, 16rem)', background: C.bg, color: C.ink },
    oninput: changed,
  });
  const lookupButton = btn(LOOKUP, () => chooseTool(LOOKUP));
  const unknownButton = btn('cancel_loan', () => chooseTool('cancel_loan'));

  const shell = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: check the catalog'),
    h('p', { class: 'sub' },
      'Tap a copy to move it on or off the shelf. Change the request and see what the app allows.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, slots, catalogNote,
        h('div', { class: 'sim-row' }, btn('New data', newData), btn('Reset', reset)),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Tool in the request' },
          lookupButton, unknownButton),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Title ', titleInput),
          btn('Clear title', () => { titleInput.value = ''; changed(); })),
        h('div', { class: 'sim-row' },
          btn('Check and run', run, 'go'),
          btn('Guess without lookup', guess))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeCard))));
  root.append(shell);

  const exercises = challenges(challengeCard, [
    {
      text: 'Put exactly two copies on the shelf, then run a lookup.',
      check: state => state?.kind === 'result' && state.onShelf === 2,
      why: 'The lookup counted two copies on the shelf and the answer used that count.',
    },
    {
      text: 'Choose cancel_loan and try to run it.',
      check: state => state?.kind === 'unknown-tool',
      why: 'The app stopped the request because only check_catalog is on its list.',
    },
    {
      text: 'Choose check_catalog, clear the title, then try to run it.',
      check: state => state?.kind === 'missing-title',
      why: 'The app stopped the lookup because it needs a book title.',
    },
    {
      text: 'Take every copy off the shelf, then guess without a lookup.',
      check: state => state?.kind === 'unverified' && state.onShelf === 0,
      why: 'The model claimed a copy was available, but the catalog showed zero and the app held the answer back.',
    },
  ]);

  const onShelfCount = () => copies.filter(Boolean).length;

  function validate() {
    if (tool !== LOOKUP) return { kind: 'unknown-tool', message: 'Tool is outside the list.' };
    if (!titleInput.value.trim()) return { kind: 'missing-title', message: 'Title is missing.' };
    return { kind: 'ready', message: 'The tool is listed and the title is non-empty text.' };
  }

  function changed() {
    attempt = null;
    draw();
  }

  function chooseTool(name) {
    tool = name;
    changed();
  }

  function run() {
    const check = validate();
    if (check.kind !== 'ready') {
      attempt = check;
    } else if (titleInput.value.trim().toLowerCase() !== BOOK.toLowerCase()) {
      attempt = { kind: 'no-match' };
    } else {
      attempt = { kind: 'result', copies: copies.length, onShelf: onShelfCount() };
    }
    draw();
  }

  function guess() {
    attempt = { kind: 'unverified', onShelf: onShelfCount() };
    draw();
  }

  function newData() {
    const oldShelf = onShelfCount();
    const options = [];
    for (let total = 2; total <= 6; total++) {
      for (let onShelf = 0; onShelf <= total; onShelf++) {
        if (total !== copies.length || onShelf !== oldShelf) options.push([total, onShelf]);
      }
    }
    const [total, onShelf] = options[rnd(0, options.length - 1)];
    copies = Array.from({ length: total }, (_, i) => i < onShelf);
    tool = LOOKUP;
    titleInput.value = BOOK;
    changed();
  }

  function reset() {
    copies = START.slice();
    tool = LOOKUP;
    titleInput.value = BOOK;
    changed();
  }

  function label(value, x, y, color = C.ink, size = 16, bold = false) {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'font-weight': bold ? 700 : 400,
      'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif',
    }, value);
  }

  function tile(x, y, name, detail, color) {
    return s('g', {},
      s('rect', { x, y, width: 153, height: 55, rx: 10, fill: C.card, stroke: color }),
      label(name, x + 76.5, y + 22, color, 16, true),
      label(detail, x + 76.5, y + 43, C.ink, 15));
  }

  function arrow(x1, y1, x2, y2, color) {
    const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
    const bx = x2 - dx * 6, by = y2 - dy * 6;
    return s('g', {},
      s('line', { x1, y1, x2: bx, y2: by, stroke: color, 'stroke-width': 2 }),
      s('polygon', {
        points: `${x2},${y2} ${bx + dy * 4},${by - dx * 4} ${bx - dy * 4},${by + dx * 4}`,
        fill: color,
      }));
  }

  function answerFor(onShelf, total) {
    if (onShelf === 0) return `No, none of the ${total} copies is on the shelf.`;
    if (onShelf === 1) return `Yes, 1 of the ${total} copies is on the shelf.`;
    return `Yes, ${onShelf} of the ${total} copies are on the shelf.`;
  }

  function draw() {
    const onShelf = onShelfCount();
    const check = validate();
    const ran = attempt?.kind === 'result' || attempt?.kind === 'no-match';
    const guessed = attempt?.kind === 'unverified';
    const ready = check.kind === 'ready';
    const statusColor = guessed ? C.pink : ready ? C.green : C.pink;
    const appStatus = guessed ? 'Holds the answer' : ran ? 'Ran the lookup'
      : ready ? 'Checks pass' : 'Check fails';
    const catalogStatus = attempt?.kind === 'result' ? `${attempt.onShelf} on the shelf`
      : ran ? 'No matching title' : '0 lookups';
    const answerStatus = attempt?.kind === 'result' ? 'Uses the result'
      : ran ? 'Reports no match' : guessed ? 'No source' : 'Waiting';

    const blocks = copies.map((available, i) => {
      const x = 190 + (i - (copies.length - 1) / 2) * 46;
      const color = available ? C.green : C.muted;
      return s('g', {},
        s('rect', { x: x - 16, y: 39, width: 32, height: 40, rx: 4, fill: C.bg, stroke: color, 'stroke-width': 2 }),
        label(i + 1, x, 65, color, 18, true),
        label(available ? 'Shelf' : 'Out', x, 99, color, 14));
    });
    svg.replaceChildren(
      label(BOOK, 190, 23, C.ink, 20, true),
      ...blocks,
      tile(10, 120, 'Model', guessed ? 'Writes a guess' : 'Writes a request', C.violet),
      tile(217, 120, 'App', appStatus, statusColor),
      tile(217, 207, 'Catalog lookup', catalogStatus, ran ? C.green : C.muted),
      tile(10, 207, 'Answer', answerStatus, ran ? C.green : guessed ? C.pink : C.muted),
      arrow(171, 147, 209, 147, guessed ? C.pink : C.cyan),
      ...(ran ? [arrow(293.5, 182, 293.5, 199, C.green), arrow(209, 234, 171, 234, C.green)] : []),
    );
    svg.setAttribute('aria-label',
      `${BOOK}. ${onShelf} of ${copies.length} on the shelf. App: ${appStatus}. Catalog: ${catalogStatus}. Answer: ${answerStatus}.`);

    if (slots.childElementCount !== copies.length) {
      slots.replaceChildren(...copies.map((_, i) => btn(`Copy ${i + 1}`, () => {
        copies[i] = !copies[i];
        changed();
      })));
    }
    copies.forEach((available, i) => {
      const button = slots.children[i];
      button.textContent = `Copy ${i + 1}: ${available ? 'Shelf' : 'Out'}`;
      button.setAttribute('aria-label', `Copy ${i + 1} on shelf`);
      button.setAttribute('aria-pressed', String(available));
      button.classList.toggle('go', available);
    });
    catalogNote.textContent = `${onShelf} on the shelf · ${copies.length} copies`;
    for (const [button, name] of [[lookupButton, LOOKUP], [unknownButton, 'cancel_loan']]) {
      button.classList.toggle('go', tool === name);
      button.setAttribute('aria-pressed', String(tool === name));
    }

    if (guessed) {
      fbox(box, [
        ['Model guess', C.violet],
        'Yes, The Hobbit is on the shelf.',
        ['Lookups run: 0', C.pink],
        ['Answer withheld: no tool result.', C.pink],
      ]);
      note.textContent = 'An availability claim needs a catalog result.';
    } else {
      const fields = { tool };
      if (titleInput.value !== '') fields.title = titleInput.value;
      const lines = [
        ...JSON.stringify(fields, null, 2).split('\n'),
        [`Validation: ${check.message}`, statusColor],
      ];
      if (attempt?.kind === 'result') {
        lines.push([`Result: {"copies": ${attempt.copies}, "on_shelf": ${attempt.onShelf}}`, C.green]);
        note.textContent = answerFor(attempt.onShelf, attempt.copies);
      } else if (attempt?.kind === 'no-match') {
        lines.push(['Result: no matching title', C.amber]);
        note.textContent = 'The request passed, but the catalog has no book by that title.';
      } else if (attempt) {
        lines.push(['Lookups run: 0', C.pink]);
        note.textContent = 'The app sends the reason back to the model.';
      } else {
        note.textContent = 'Press Check and run to try the current request.';
      }
      fbox(box, lines);
    }
    exercises.update(attempt);
  }

  draw();
  return () => shell.remove();
}

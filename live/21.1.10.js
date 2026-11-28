// 21.1.10 Tool calling. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const TOP = P ? 0.92 : 0.65;
  const BOTTOM = P ? -1.78 : -1.65;
  const DX = P ? 1.93 : 1.88;
  const W = P ? 2.83 : 2.76;
  const H = 1.48;
  const places = [
    [CX - DX, TOP, 0], [CX + DX, TOP, 0],
    [CX + DX, BOTTOM, 0], [CX - DX, BOTTOM, 0],
  ];

  const title = 'The Hobbit';
  const question = 'Is The Hobbit on the shelf right now?';
  const answer = 'Yes, one of the three copies is on the shelf.';
  const request = ['{"tool": "check_catalog",', ' "title": "The Hobbit"}'];
  const result = ['{"copies": 3,', ' "on_shelf": 1}'];
  const model = ['Model', 'Writes text', C.violet];
  const app = ['App', 'Runs the lookup', C.cyan];
  const catalog = ['Catalog', 'Book locations', C.cyan];
  let pictureNow = null;
  let boxNow = null;

  function rect(x, y, width, height, color, fill = C.card) {
    const r = new M.RoundedRectangle({
      width, height, cornerRadius: 0.13, color, strokeWidth: 2,
    });
    r.setFill(fill, 0.95);
    r.moveTo([x, y, 0]);
    return r;
  }

  function text(s, x, y, width, size, color = C.ink, mono = false, bold = false) {
    const t = T(s, size, color, mono, bold);
    if (t.getWidth() > width) t.scale(width / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function tile([label, detail, color = C.cyan], [x, y]) {
    const lines = Array.isArray(detail) ? detail : [detail];
    return new M.VGroup(
      rect(x, y, W, H, color),
      text(label, x, y + 0.39, W - 0.24, 20, color, false, true),
      ...lines.map((line, i) =>
        text(line, x, y - 0.24 + (lines.length - 1 - 2 * i) * 0.14, W - 0.24, 18)),
    );
  }

  // The row order is left to right at the top, then right to left at the bottom.
  function diagram(cards, links = []) {
    const nodes = cards.flatMap((card, i) => card ? [tile(card, places[i])] : []);
    const arrows = links.map(([from, to, color = C.cyan]) => {
      const [x, y] = places[from], [tx, ty] = places[to];
      const dx = Math.sign(tx - x), dy = Math.sign(ty - y);
      return new M.Arrow({
        start: [x + dx * (W / 2 + 0.08), y + dy * (H / 2 + 0.08), 0],
        end: [tx - dx * (W / 2 + 0.08), ty - dy * (H / 2 + 0.08), 0],
        color, strokeWidth: 3, buff: 0,
      });
    });
    return new M.VGroup(...nodes, ...arrows);
  }

  function book(x, y, color) {
    return new M.VGroup(
      rect(x, y, 0.57, 0.78, color, color),
      new M.Line({
        start: [x - 0.16, y - 0.29, 0], end: [x - 0.16, y + 0.29, 0],
        color: C.bg, strokeWidth: 2,
      }),
      new M.Line({
        start: [x - 0.06, y + 0.15, 0], end: [x + 0.17, y + 0.15, 0],
        color: C.bg, strokeWidth: 2,
      }),
    );
  }

  function guideAndShelf() {
    const guide = tile(['Library guide', 'Same six pages', C.ink], places[0]);
    const shelf = tile(['Library shelf', 'Books come and go', C.amber], places[1]);
    const pages = Array.from({ length: 6 }, (_, i) => {
      const x = CX + (i - 2.5) * 0.88;
      const color = i === 3 ? C.amber : i === 4 ? C.cyan : C.ink;
      return new M.VGroup(
        rect(x, BOTTOM, 0.72, 0.91, color),
        text(String(i + 1), x, BOTTOM, 0.55, 20, color, true, true),
      );
    });
    return new M.VGroup(guide, shelf, ...pages);
  }

  function inventory() {
    const zones = [
      { x: CX - DX, label: 'On the shelf', copies: [0], color: C.green },
      { x: CX + DX, label: 'Out on loan', copies: [-0.43, 0.43], color: C.muted },
    ];
    return new M.VGroup(
      text(title, CX, TOP, 4, 24, C.ink, false, true),
      ...zones.flatMap(({ x, label, copies, color }) => [
        rect(x, BOTTOM + 0.43, W, 1.81, color),
        text(label, x, BOTTOM + 0.99, W - 0.25, 19, color, false, true),
        ...copies.map(offset => book(x + offset, BOTTOM + 0.29, color)),
        new M.Line({
          start: [x - 0.98, BOTTOM - 0.17, 0], end: [x + 0.98, BOTTOM - 0.17, 0],
          color, strokeWidth: 3,
        }),
      ]),
    );
  }

  function formula(lines, color) {
    const width = P ? FW - 1.2 : 4.0;
    const size = P ? 22 : 21, spacing = P ? 0.34 : 0.38;
    const [x, y] = BOXP;
    const labels = lines.map(line => {
      const [value, ink] = Array.isArray(line) ? line : [line, C.ink];
      const t = T(value, size, ink, true);
      t._w = t.getWidth();
      if (t._w > width - 0.46) { t.scale((width - 0.46) / t._w); t._w = width - 0.46; }
      return t;
    });
    return new M.VGroup(
      rect(x, y, width, labels.length * spacing + 0.28, color),
      ...labels.map((t, i) => t.moveTo([
        x - width / 2 + 0.23 + t._w / 2,
        y + ((labels.length - 1) / 2 - i) * spacing, 0,
      ])),
    );
  }

  function swap(old, next) {
    const animations = [];
    if (old) animations.push(new M.FadeOut(old, { runTime: 0.22 }));
    if (next) animations.push(new M.FadeIn(next, { runTime: 0.30 }));
    return animations.length === 2
      ? [new M.LaggedStart(animations, { lagRatio: 1 })]
      : animations;
  }

  function beat(label, color, picture, lines) {
    const animations = [...showA(label, color, PILL)];
    if (picture !== undefined) {
      animations.push(...swap(pictureNow, picture));
      pictureNow = picture;
    }
    if (lines !== undefined) {
      const next = lines === null ? null : formula(lines, color);
      animations.push(...swap(boxNow, next));
      boxNow = next;
    }
    return play(...animations);
  }

  // 0–9: a live question, the catalog, and the tool description.
  await until(S(0));
  await beat('A VISITOR ASKS', C.amber,
    diagram([['Visitor', title, C.amber], ['Library shelf', 'Available right now?', C.cyan]]),
    ['Is The Hobbit on the', 'shelf right now?']);

  await until(S(1));
  await beat('AVAILABILITY CHANGES', C.amber, guideAndShelf(), null);

  await until(S(2));
  await beat('THE CATALOG HAS THE ANSWER', C.cyan,
    diagram([null, ['Catalog', 'Computer list', C.cyan],
      ['Location', 'Where each copy is', C.green], ['Title', title]], [[1, 2], [2, 3]]));

  await until(S(3));
  await beat('THE MODEL WRITES TEXT', C.violet,
    diagram([model, ['Text', 'Words on screen', C.violet], catalog], [[0, 1, C.violet]]),
    ['Catalog access', ['No direct access', C.amber]]);

  await until(S(4));
  await beat('THE APP GETS THE REQUEST', C.cyan,
    diagram([['Model', 'Writes a request', C.violet], ['App', 'Receives it']], [[0, 1]]) , null);

  await until(S(5));
  await beat('THE APP CONNECTS THEM', C.cyan,
    diagram([['Chat', 'Visitor and model', C.violet], ['App', 'Shows the chat'], catalog],
      [[0, 1], [1, 2]]));

  await until(S(6));
  await beat('THE APP SENDS THE TOOL LIST', C.violet,
    diagram([['Model', 'Reads the prompt', C.violet], ['App', 'Supplies the prompt']],
      [[1, 0, C.violet]]),
    ['Prompt', ['List of helpers', C.cyan], 'A description of each']);

  await until(S(7));
  await beat('CHECK CATALOG', C.cyan,
    diagram([['Tool list', 'check_catalog'], ['Input', 'A book title', C.violet],
      ['Lookup', 'Counts its copies', C.green], ['Catalog', 'Finds the book']],
      [[0, 1], [1, 2]]),
    [['check_catalog(title: text)', C.cyan]]);

  await until(S(8));
  await beat('TOOL', C.green,
    diagram([model, ['App', 'Uses the helper'], ['Tool', 'check_catalog', C.green]],
      [[0, 1, C.violet], [1, 2, C.green]]),
    ['A helper the model', 'can ask the app to use']);

  await until(S(9));
  await beat('FOLLOW THE QUESTION', C.amber,
    diagram([['Visitor', title, C.amber], model, ['App', 'Handles the request'], catalog],
      [[0, 1, C.amber]]), null);

  // 10–20: the validated request and the returned facts.
  await until(S(10));
  await beat('1 · READ THE QUESTION', C.violet,
    diagram([['Prompt', ['Visitor question', 'Tool list'], C.amber], ['Model', 'Reads both', C.violet]],
      [[0, 1, C.violet]]),
    ['Is The Hobbit on the', 'shelf right now?', 'check_catalog(title: text)']);

  await until(S(11));
  await beat('2 · WRITE A REQUEST', C.violet,
    diagram([['Model', 'Writes the fields', C.violet], ['Request', 'Ready for the app']],
      [[0, 1, C.violet]]), request);

  await until(S(12));
  await beat('A FILLED-IN FORM', C.violet,
    diagram([['Tool', 'check_catalog'], ['Title', title, C.violet]]));

  await until(S(13));
  await beat('3 · CHECK THE REQUEST', C.amber,
    diagram([['Request', 'Tool and title', C.violet], ['App', 'Checks first', C.amber],
      ['Catalog', 'Waiting', C.muted]], [[0, 1, C.amber]]),
    ['Tool on the list?', 'Title is non-empty text?']);

  await until(S(14));
  await beat('BOTH CHECKS PASS', C.green,
    diagram([['Tool name', 'On the list', C.green], ['Title', ['Present', 'Written as text'], C.green]]),
    [['Tool on the list? Yes', C.green], ['Non-empty text? Yes', C.green]]);

  await until(S(15));
  await beat('VALIDATION', C.green,
    diagram([['App', 'Checks the rules', C.amber], ['Request', 'Passes the checks', C.green]],
      [[0, 1, C.green]]),
    ['Check the request', 'before using it']);

  await until(S(16));
  await beat('4 · RUN THE LOOKUP', C.cyan,
    diagram([['App', 'Runs check_catalog'], ['Catalog', ['Looks up', title]]], [[0, 1]]),
    request);

  await until(S(17));
  await beat('5 · CATALOG RETURNS FACTS', C.green, inventory(), result);

  await until(S(18));
  await beat('6 · APP PASSES THE FACTS BACK', C.green,
    diagram([['Model', 'Receives the facts', C.violet], ['App', 'Passes the result'],
      ['Catalog', 'Returns the facts', C.green]], [[2, 1, C.green], [1, 0, C.green]]));

  await until(S(19));
  await beat('7 · MODEL WRITES THE ANSWER', C.green,
    diagram([['Tool result', ['3 copies', '1 on the shelf'], C.green], ['Model', 'Writes the answer', C.violet]],
      [[0, 1, C.green]]),
    ['Yes, one of the three', 'copies is on the shelf.']);

  await until(S(20));
  await beat('WHO DID WHAT?', C.cyan,
    diagram([['Model', 'Wrote the request', C.violet], ['App', ['Checked it', 'Ran the lookup']],
      ['Catalog', 'Returned the facts', C.green], ['Model', 'Explained the result', C.violet]],
      [[0, 1, C.violet], [1, 2]]), null);

  // 21–23: the waiter analogy.
  await until(S(21));
  await beat('FROM ORDER SLIP TO PLATE', C.amber,
    diagram([['Visitor', 'Places an order', C.amber], ['Waiter', 'Writes an order slip', C.violet],
      ['Kitchen', ['Checks the slip', 'Cooks the meal']], ['Waiter', 'Brings the plate', C.green]],
      [[0, 1, C.amber], [1, 2], [2, 3, C.green]]));

  await until(S(22));
  await beat('THE KITCHEN COOKS', C.cyan,
    diagram([['Waiter', 'Carries the slip', C.violet], ['Kitchen', 'Cooks the meal'],
      ['Waiter', 'Carries the plate', C.violet]], [[0, 1], [1, 2, C.green]]));

  await until(S(23));
  await beat('TOOL CALLING', C.green,
    diagram([['Model', 'Writes the request', C.violet], ['App', ['Checks it', 'Runs the tool']],
      ['Result', 'Comes back', C.green], ['Model', 'Uses the result', C.violet]],
      [[0, 1, C.violet], [1, 2], [2, 3, C.green]]));

  // 24–31: rejected requests and the rule for actions.
  await until(S(24));
  await beat('WHAT IF A CHECK FAILS?', C.amber,
    diagram([['Request', 'Ready to check', C.violet], ['App', 'Validation', C.amber],
      ['Catalog', 'Waiting', C.muted]], [[0, 1, C.amber]]));

  await until(S(25));
  await beat('TOOL OUTSIDE THE LIST', C.pink,
    diagram([['Requested', 'cancel_loan', C.pink], ['Tool list', 'check_catalog']]),
    ['{"tool": "cancel_loan"}', ['Tool on the list? No', C.pink]]);

  await until(S(26));
  await beat('THE APP REFUSES', C.pink,
    diagram([['Model', 'Gets an error', C.violet], ['App', 'Refuses the request', C.pink],
      ['Catalog', '0 lookups', C.muted]], [[1, 0, C.pink]]),
    [['That tool does not exist.', C.pink]]);

  await until(S(27));
  await beat('THE TITLE IS MISSING', C.pink,
    diagram([['Model', 'Gets an error', C.violet], ['App', 'Checks the title', C.pink],
      ['Catalog', '0 lookups', C.muted]], [[1, 0, C.pink]]),
    ['{"tool": "check_catalog"}', ['Title is missing.', C.pink]]);

  await until(S(28));
  await beat('A RENEWAL NEEDS PERMISSION', C.amber,
    diagram([['Visitor', 'Asks to renew a loan', C.violet], ['App', 'Checks permission', C.amber],
      ['Renewal', 'Only if allowed', C.muted]], [[0, 1, C.amber]]),
    ['May this visitor', 'renew this loan?']);

  await until(S(29));
  await beat('ONLY PASSING REQUESTS RUN', C.green,
    diagram([['Checks pass', 'App runs the request', C.green], ['Catalog', 'Receives it', C.green],
      ['App refuses', '0 lookups', C.pink], ['A check fails', 'App stops it', C.pink]],
      [[0, 1, C.green], [3, 2, C.pink]]), null);

  await until(S(30));
  await beat('A TOOL CALL IN FOUR PARTS', C.cyan,
    diagram([['Model request', 'Write the fields', C.violet], ['Validation', 'Check the rules', C.amber],
      ['App runs it', 'Call the tool'], ['Back to model', 'Return the result', C.green]],
      [[0, 1, C.violet], [1, 2], [2, 3, C.green]]));

  await until(S(31));
  await beat('LIVE FACTS AND REAL ACTIONS', C.green,
    diagram([['Live fact', 'Check the shelf', C.green], ['Real action', 'Renew a loan', C.cyan],
      ['App', 'Acts if allowed'], ['Catalog', 'Reports the location', C.green]],
      [[0, 3, C.green], [1, 2]]));

  // 32–37: the unsupported answer, the evidence check, and the recap.
  await until(S(32));
  await beat('TRAP · SKIPPING THE TOOL', C.pink,
    diagram([['Model', 'Answers directly', C.violet], ['Chat', 'Gets an answer', C.pink],
      ['Catalog', '0 lookups', C.muted]], [[0, 1, C.pink]]));

  await until(S(33));
  await beat('THE MODEL GUESSES', C.pink, undefined,
    ['Yes, The Hobbit', 'is on the shelf.']);

  await until(S(34));
  await beat('THE WORDS SOUND RIGHT', C.pink,
    diagram([['Answer', '“Yes”', C.violet], ['Tool result', 'Missing', C.pink]]),
    [['Availability is invented.', C.pink]]);

  await until(S(35));
  await beat('CHECK THE SOURCE', C.green,
    diagram([['Catalog result', ['3 copies', '1 on the shelf'], C.green],
      ['App', 'Checks the claim'], ['Answer', '1 on the shelf', C.green]],
      [[0, 1, C.green], [1, 2, C.green]]),
    ['“1 on the shelf” matches', ['on_shelf: 1', C.green]]);

  await until(S(36));
  await beat('WHEN SHOULD LOOKUPS STOP?', C.amber,
    diagram([['First lookup', 'Returns a result'], ['Next lookup', 'Uses that result'],
      ['Continue?', 'Decide when to stop', C.amber]], [[0, 1], [1, 2, C.amber]]), null);

  await until(S(37));
  await beat('TOOL CALLING', C.green,
    diagram([['Model', 'Writes the request', C.violet], ['App', ['Checks the request', 'Runs the tool']],
      ['Tool result', ['3 copies', '1 on the shelf'], C.green],
      ['Model', 'Answers from data', C.violet]],
      [[0, 1, C.violet], [1, 2], [2, 3, C.green]]),
    [answer.slice(0, 21), answer.slice(22)]);
}

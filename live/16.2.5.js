// 16.2.5 Columnar storage: read only what you need.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const tickets = [
    ['A', 'North', '9 a.m.', '$4'],
    ['B', 'North', '11 a.m.', '$8'],
    ['C', 'South', '10 a.m.', '$6'],
    ['D', 'South', 'Noon', '$10'],
    ['E', 'South', '2 p.m.', '$14'],
  ];
  const fields = ['Ticket ID', 'Shop', 'Time of sale', 'Amount'];
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const widths = [1.32, 1.36, 2.18, 1.26];
  const gap = 0.14;
  const width = widths.reduce((sum, w) => sum + w, 0) + gap * 3;
  const left = CX - width / 2;
  const xs = widths.map((w, i) =>
    left + widths.slice(0, i).reduce((sum, previous) => sum + previous + gap, 0) + w / 2);
  const headerY = P ? 1.25 : 0.96;
  const pitch = P ? 0.74 : 0.63;
  const y = i => headerY - (i + 1) * pitch;
  const bottom = y(4) - pitch / 2;
  const top = headerY + pitch / 2;
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const shopColor = i => i < 2 ? C.cyan : C.amber;
  const label = (text, x, yc, size = P ? 20 : 19, color = C.ink, mono = false) =>
    T(text, size, color, mono).moveTo([x, yc, 0]);

  function frame(x, yc, w, h, color = C.line, fill = 0, strokeWidth = 2) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth });
    r.setFill(C.card, fill);
    r.moveTo([x, yc, 0]);
    return r;
  }

  const layers = new Map();
  function change(key, parts = [], runTime = 0.48) {
    const animations = [];
    const previous = layers.get(key);
    if (previous) animations.push(new M.FadeOut(previous, { runTime }));
    if (parts.length) {
      const next = parts.length === 1 ? parts[0] : new M.VGroup(...parts);
      layers.set(key, next);
      animations.push(new M.FadeIn(next, { runTime }));
    } else {
      layers.delete(key);
    }
    return animations;
  }

  function fbox(lines, color = C.cyan, runTime = 0.48) {
    if (!lines.length) return change('box', [], runTime);
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;
    const texts = lines.map((row, i) => T(row, size, i === lines.length - 1 ? color : C.ink, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7;
    const ht = texts.length * lh + 0.4;
    const [x, yc] = BOXP;
    texts.forEach((t, i) => t.moveTo([x - wd / 2 + 0.35 + t.getWidth() / 2, yc + (texts.length - 1) * lh / 2 - i * lh, 0]));
    const group = new M.VGroup(frame(x, yc, wd, ht, color, 0.95), ...texts);
    const maxWidth = P ? FW - 1.2 : 4.0;
    if (wd > maxWidth) group.scale(maxWidth / wd);
    return change('box', [group], runTime);
  }

  function value(row, field, color = field === 1 ? shopColor(row) : C.ink) {
    return label(tickets[row][field], xs[field], y(row), P ? 20 : 19, color, field !== 1);
  }

  function ticket(row, mode) {
    const color = mode === 'extra' ? C.muted : shopColor(row);
    const parts = [frame(CX, y(row), width, pitch - 0.08, color, 0.92)];
    if (mode === 'closed') {
      parts.push(label(`Ticket ${tickets[row][0]}`, CX, y(row), 19, color));
    } else {
      fields.forEach((_, field) => {
        const ink = mode === 'extra' && field !== 3 ? C.muted
          : field === 3 && mode !== 'slip' ? C.green
          : field === 0 || field === 1 ? shopColor(row) : C.ink;
        parts.push(value(row, field, ink));
      });
    }
    return parts;
  }

  const ticketKey = row => `ticket${row}`;
  const showTickets = mode => tickets.flatMap((_, i) => change(ticketKey(i), ticket(i, mode)));
  const clearTickets = () => tickets.flatMap((_, i) => change(ticketKey(i)));
  const rowOutline = (row, color) => frame(CX, y(row), width + 0.06, pitch - 0.03, color, 0, 3);
  const colOutline = (field, color) =>
    frame(xs[field], (top + bottom) / 2, widths[field] + 0.04, top - bottom, color, 0, 3);
  const mark = parts => change('highlight', parts);

  function table() {
    const rule = (x1, y1, x2, y2) =>
      new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color: C.line, strokeWidth: 2 });
    const parts = [frame(CX, (top + bottom) / 2, width, top - bottom, C.muted, 0.88)];
    fields.forEach((field, j) => {
      parts.push(label(field, xs[j], headerY, 16, C.cyan));
      if (j < fields.length - 1) {
        const x = xs[j] + widths[j] / 2 + gap / 2;
        parts.push(rule(x, top - 0.07, x, bottom + 0.07));
      }
    });
    tickets.forEach((_, row) => {
      parts.push(rule(left + 0.04, y(row) + pitch / 2, left + width - 0.04, y(row) + pitch / 2));
      fields.forEach((_, field) => parts.push(value(row, field)));
    });
    return parts;
  }

  function block(field, open, color, revealed = 0, slots = false) {
    const height = open ? top - bottom : pitch;
    const parts = [
      frame(xs[field], top - height / 2, widths[field], height, color, 0.9),
      label(fields[field], xs[field], headerY, 16, color),
    ];
    if (open) {
      for (let row = 0; row < tickets.length; row++) {
        if (row < revealed) parts.push(value(row, field, field === 3 ? C.green : undefined));
        else if (slots) parts.push(label('—', xs[field], y(row), 17, C.muted, true));
      }
    }
    return parts;
  }

  const blockKey = field => `block${field}`;
  const setBlock = (field, open, color, revealed = 0, slots = false) =>
    change(blockKey(field), block(field, open, color, revealed, slots));
  const clearBlocks = () => fields.flatMap((_, i) => change(blockKey(i)));
  const allBlocks = (open, color, revealed = 0) =>
    fields.flatMap((_, i) => setBlock(i, open, color, revealed));

  function readAmount(row) {
    const amount = value(row, 3, C.green);
    const amounts = tickets.slice(0, row + 1).map(ticket => ticket[3]).join('  ');
    return [
      ...change(`slot${row}`, [amount], 0.30),
      ...change('highlight', [frame(xs[3], y(row), widths[3] - 0.16, pitch - 0.12, C.green)], 0.30),
      ...fbox(['Amounts read', amounts], C.green, 0.30),
    ];
  }

  function largeTable(selected) {
    const count = 8;
    const step = width / count;
    const parts = [label('Many columns', CX, headerY, 21, C.ink)];
    for (let i = 0; i < count; i++) {
      const x = left + step * (i + 0.5);
      const color = selected && i === 0 ? C.green : selected ? C.line : C.cyan;
      parts.push(frame(x, y(1.5), step - 0.1, 4 * pitch, color, 0.88));
      const sample = ['$4', '$6', '$10'];
      for (let row = 0; row <= 3; row++) {
        const mark = i === count - 1 ? '…' : row === 3 ? '⋮' : i === 0 ? sample[row] : '•';
        parts.push(label(mark, x, y(row), i === 0 && row < 3 ? 17 : 24, color));
      }
    }
    parts.push(label('Millions of sales', CX, y(4) - pitch * 0.25, 22, C.ink));
    return parts;
  }

  const SH = P ? 1.6 : 2.0, SW = P ? 2.8 : 3.4;
  await until(S(0));
  await play(...change('shops', [
    frame(CX - SH, y(0), SW, 1.2, C.cyan, 0.95),
    label('North', CX - SH, y(0), 32, C.cyan),
    frame(CX + SH, y(0), SW, 1.2, C.amber, 0.95),
    label('South', CX + SH, y(0), 32, C.amber),
  ]), ...say('OUR BAKERY'));

  await until(S(1)); await play(...say('MONDAY’S SALES'), ...fbox(['What was the', 'amount of each sale?']));
  await until(S(2)); await play(...fbox(['Need: amounts', 'Skip: shops and times'], C.amber));
  await until(S(3)); await play(...say('CAN WE READ JUST THE AMOUNTS?', C.amber));
  await until(S(4));
  await play(...change('shops'), ...fbox([]), ...say('MONDAY • FIVE SALES AFTER B ARRIVES'),
    ...change('slipSlots', tickets.map((_, i) => frame(CX, y(i), width - 0.06, pitch - 0.14, C.line))));

  await until(S(5)); await play(...change(ticketKey(0), ticket(0, 'slip')));
  await until(S(6)); await play(...change(ticketKey(1), ticket(1, 'slip')));
  await until(S(7)); await play(...change(ticketKey(2), ticket(2, 'slip')));
  await until(S(8)); await play(...change(ticketKey(3), ticket(3, 'slip')));
  await until(S(9)); await play(...change(ticketKey(4), ticket(4, 'slip')));

  await until(S(10)); await play(...clearTickets(), ...change('slipSlots'), ...change('table', table()), ...say('MONDAY’S SALES'));
  await until(S(11)); await play(...mark([rowOutline(0, C.amber)]), ...say('ONE SALE ACROSS', C.amber));
  await until(S(12)); await play(...say('ROW', C.amber));
  await until(S(13)); await play(...mark([colOutline(1, C.violet)]), ...say('ONE KIND OF INFORMATION DOWN', C.violet));
  await until(S(14)); await play(...say('COLUMN', C.violet));
  await until(S(15)); await play(...mark(fields.map((_, i) => colOutline(i, C.violet))), ...say('FOUR COLUMNS', C.violet));

  await until(S(16));
  await play(...mark([]), ...change('table'), ...showTickets('closed'), ...say('KEEP EACH SALE TOGETHER'));
  await until(S(17)); await play(...change(ticketKey(0), ticket(0, 'slip')));
  await until(S(18)); await play(...change(ticketKey(1), ticket(1, 'slip')));
  await until(S(19));
  await play(new M.LaggedStart(tickets.slice(2).flatMap((_, i) => change(ticketKey(i + 2), ticket(i + 2, 'slip'))),
    { lagRatio: 0.18, runTime: 1.32 }));
  await until(S(20)); await play(...say('ROW STORAGE'));
  await until(S(21));
  await play(...showTickets('read'), ...say('OPEN ALL FIVE BOXES', C.amber),
    ...fbox(['Boxes opened', '5 out of 5'], C.amber));
  await until(S(22)); await play(...showTickets('extra'), ...fbox(['Wanted: 5 amounts', 'Each box has other fields'], C.green));
  await until(S(23));
  await play(...showTickets('slip'), ...fbox([]), ...say('THE SAME FIVE SALES'));
  await until(S(24));
  await play(...clearTickets(), ...allBlocks(true, C.muted), ...say('ONE BOX FOR EACH KIND'));

  await until(S(25)); await play(...setBlock(0, true, C.cyan, 5), ...say('TICKET ID'));
  await until(S(26)); await play(...setBlock(1, true, C.cyan, 5), ...say('SHOP'));
  await until(S(27)); await play(...setBlock(2, true, C.cyan, 5), ...say('TIME OF SALE'));
  await until(S(28)); await play(...setBlock(3, true, C.cyan, 5), ...say('AMOUNT'));
  await until(S(29));
  await play(...mark(tickets.map((_, i) => rowOutline(i, C.violet))), ...say('SAME ORDER IN EVERY BOX', C.violet));
  await until(S(30)); await play(...mark([rowOutline(0, C.violet)]), ...say('FIRST IN EACH BOX • TICKET A', C.violet));
  await until(S(31)); await play(...mark([rowOutline(1, C.violet)]), ...say('SECOND IN EACH BOX • TICKET B', C.violet));
  await until(S(32)); await play(...mark([colOutline(1, C.amber)]), ...say('SAVED TOGETHER • DATA BLOCK', C.amber));
  await until(S(33)); await play(...mark([]), ...say('COLUMNAR STORAGE'));

  await until(S(34));
  await play(...allBlocks(false, C.muted), ...say('WHAT WERE MONDAY’S AMOUNTS?', C.amber));
  await until(S(35)); await play(...say('MONDAY’S FIVE TICKETS ARE SELECTED'));
  await until(S(36)); await play(...setBlock(3, false, C.green), ...say('STEP 1: FIND AMOUNT', C.green));
  await until(S(37)); await play(...setBlock(3, true, C.green), ...say('STEP 2: OPEN AMOUNT', C.green));
  await until(S(38));
  await play(...say('STEP 3: READ ONE AT A TIME', C.green),
    ...tickets.flatMap((_, i) => change(`slot${i}`, [label('—', xs[3], y(i), 17, C.muted, true)])));

  await until(S(39)); await play(...readAmount(0));
  await until(S(40)); await play(...readAmount(1));
  await until(S(41)); await play(...readAmount(2));
  await until(S(42)); await play(...readAmount(3));
  await until(S(43)); await play(...readAmount(4));

  await until(S(44));
  await play(...mark([]), ...say('ALL FIVE AMOUNTS', C.green));
  await until(S(45));
  await play(...say('ONE BLOCK READ • THREE SKIPPED', C.green), ...fbox(['Blocks read: 1', 'Blocks skipped: 3'], C.green));
  await until(S(46));
  await play(...clearBlocks(), ...tickets.flatMap((_, i) => change(`slot${i}`)),
    ...fbox([]), ...say('A MUCH LARGER SALES TABLE'), ...change('large', largeTable(false)));
  await until(S(47));
  await play(...change('large', largeTable(true)), ...say('READING FEWER COLUMNS CAN SAVE TIME', C.green));
  await until(S(48)); await play(...say('READ ONLY THE COLUMNS YOU NEED', C.green));

  await until(S(49));
  await play(...change('large'), ...allBlocks(false, C.cyan), ...say('WHAT IF WE NEED ALL FOUR FIELDS?', C.amber));
  await until(S(50));
  await play(...allBlocks(true, C.cyan, 5), ...say('OPEN ALL FOUR BLOCKS', C.amber),
    ...fbox(['Blocks read: 4', 'Blocks skipped: 0'], C.amber));
  await until(S(51));
  await play(...say('THE QUESTION CHANGES WHAT WE READ', C.violet),
    ...fbox(['Amounts only: 1 block', 'All fields: 4 blocks'], C.violet));
  await until(S(52));
  await play(...fields.flatMap((_, i) => setBlock(i, i === 3, i === 3 ? C.green : C.muted, i === 3 ? 5 : 0)),
    ...say('ONE KIND PER BLOCK • READ WHAT YOU NEED', C.green),
    ...fbox(['Monday’s amounts', '$4  $8  $6  $10  $14'], C.green));
}

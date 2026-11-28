// 16.2.4 Idempotent loads: count each sale only once.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const sales = {
    A: { shop: 'North', day: 'Monday', amount: 4 },
    B: { shop: 'North', day: 'Monday', amount: 8 },
    C: { shop: 'South', day: 'Monday', amount: 6 },
    D: { shop: 'South', day: 'Monday', amount: 10 },
    E: { shop: 'South', day: 'Monday', amount: 14 },
    F: { shop: 'North', day: 'Tuesday', amount: 8 },
  };
  const original = ['A', 'C', 'D', 'E'];
  const withB = [...original, 'B'];
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const IN = P ? [0, 0.6, 0] : [4.3, 1.02, 0];
  const WIDTH = P ? FW - 0.7 : 7.1;
  const HEADER_Y = P ? -0.3 : 0.94;
  const FIRST_Y = P ? -1.05 : 0.33;
  const PITCH = P ? 0.95 : 0.55;
  const XS = (P ? [-0.39, -0.15, 0.12, 0.38] : [-0.37, -0.13, 0.13, 0.37]).map(f => CX + f * WIDTH);
  const rowY = i => FIRST_Y - i * PITCH;
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 19 : 18);
  const money = n => `$${n}`;
  const saleColor = id => sales[id].shop === 'North' ? C.cyan : C.amber;
  const enter = (object, runTime = 0.45) => new M.FadeIn(object, { runTime });
  const leave = (object, runTime = 0.35) => new M.FadeOut(object, { runTime });

  function label(text, x, y, size, color = C.ink, mono = true, maxWidth = Infinity) {
    const t = T(text, size, color, mono);
    if (t.getWidth() > maxWidth) t.scale(maxWidth / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function frame(x, y, width, height, color, fillOpacity = 0, radius = 0.12) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: radius, color, strokeWidth: 2 });
    r.setFill(C.card, fillOpacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  let boxNow = null;
  function fbox(lines = [], color = C.cyan) {
    const animations = boxNow ? [leave(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return animations;
    const lh = P ? 0.37 : 0.34;
    const width = P ? FW - 1.2 : 4.25;
    const height = lines.length * lh + 0.28;
    const [x, y] = BOXP;
    const rows = lines.map((line, i) => {
      const [text, ink] = Array.isArray(line) ? line : [line, C.ink];
      return label(text, x, y + ((lines.length - 1) / 2 - i) * lh, P ? 21 : 18, ink, true, width - 0.46);
    });
    boxNow = new M.VGroup(frame(x, y, width, height, color, 0.95), ...rows);
    return [...animations, enter(boxNow)];
  }

  let heading = null;
  let saved = [];
  let incoming = null;
  let outline = null;

  function tableHeading(name) {
    const columns = [name, 'SHOP', 'SALE DAY', 'AMOUNT'];
    const rule = new M.Line({
      start: [CX - WIDTH / 2, HEADER_Y - 0.23, 0],
      end: [CX + WIDTH / 2, HEADER_Y - 0.23, 0],
      color: C.muted,
    });
    return new M.VGroup(rule, ...columns.map((text, i) =>
      label(text, XS[i], HEADER_Y, P ? 17 : 16, C.muted, true, WIDTH * 0.24)));
  }

  function row(id, i, blank = false, duplicate = false) {
    const { shop, day, amount } = sales[id];
    const y = rowY(i);
    const color = duplicate ? C.pink : saleColor(id);
    const card = frame(CX, y, WIDTH, P ? 0.66 : 0.46, blank ? C.line : color, 0.88);
    if (blank) return card;
    const fields = [id, shop, day, money(amount)];
    return new M.VGroup(card, ...fields.map((text, k) =>
      label(text, XS[k], y, P ? 23 : 18, k === 0 || k === 3 ? color : C.ink, true, WIDTH * (P ? 0.25 : 0.22))));
  }

  function setHeading(name) {
    const previous = heading;
    heading = tableHeading(name);
    return previous ? [leave(previous), enter(heading)] : [enter(heading)];
  }

  function showTable(ids, name = 'TICKET ID', blank = false) {
    const previous = saved;
    saved = ids.map((id, i) => row(id, i, blank));
    return [...previous.map(item => leave(item)), ...setHeading(name),
      new M.LaggedStart(saved.map(item => enter(item)), { lagRatio: 0.13, runTime: 0.75 })];
  }

  function hideTable() {
    const animations = [heading, ...saved].filter(Boolean).map(item => leave(item));
    heading = null;
    saved = [];
    return animations;
  }

  function reveal(id, i) {
    const previous = saved[i];
    saved[i] = row(id, i);
    return [leave(previous), enter(saved[i])];
  }

  function slip(id, x, y, width = 3.1) {
    const { shop, day, amount } = sales[id];
    const color = saleColor(id);
    return new M.VGroup(
      frame(x, y, width, 0.83, color, 0.94),
      label(`Ticket ${id} · ${money(amount)}`, x, y + 0.17, P ? 22 : 20, color, true, width - 0.25),
      label(`${shop} · ${day}`, x, y - 0.19, P ? 17 : 16, C.ink, false, width - 0.25),
    );
  }

  function receive(id) {
    const [x, y] = IN;
    incoming = new M.VGroup(
      slip(id, x, y),
      label('INCOMING', x, y + 0.59, 16, C.muted),
    );
    return enter(incoming);
  }

  function dismiss() {
    const animations = incoming ? [leave(incoming)] : [];
    incoming = null;
    return animations;
  }

  async function saveIncoming(id, duplicate = false, ...animations) {
    const i = saved.length;
    const ticket = incoming.submobjects[0].copy();
    const target = ticket.copy().moveTo([CX, rowY(i), 0]);
    await play(...dismiss(), enter(ticket, 0.12), ...animations);
    await play(new M.Transform(ticket, target, { runTime: 0.55 }));
    saved.push(row(id, i, false, duplicate));
    await play(leave(ticket, 0.22), enter(saved[i], 0.24));
  }

  function highlight(next = null) {
    const animations = outline ? [leave(outline)] : [];
    outline = next;
    return next ? [...animations, enter(next)] : animations;
  }

  function idColumn(color, includeHeading = false) {
    const top = includeHeading ? HEADER_Y + 0.17 : FIRST_Y + 0.25;
    const bottom = rowY(saved.length - 1) - 0.25;
    return frame(XS[0], (top + bottom) / 2, WIDTH * 0.23, top - bottom, color);
  }

  function idCell(i, color) {
    return frame(XS[0], rowY(i), WIDTH * 0.22, P ? 0.62 : 0.44, color);
  }

  function compare(leftId, rightId, leftName, rightName) {
    const dx = P ? 1.77 : 2.2;
    const y = P ? -0.36 : -0.52;
    const left = CX - dx, right = CX + dx;
    return new M.VGroup(
      slip(leftId, left, y), slip(rightId, right, y),
      label(leftName, left, y + 0.69, 17, C.muted, true, 3.1),
      label(rightName, right, y + 0.69, 17, C.muted, true, 3.1),
    );
  }

  // 0–3: shop sends, shop retries, and the Tuesday clock.
  const shopX = P ? -2.46 : -4.8, computerX = P ? 2.4 : 4.45;
  const northY = P ? 0.34 : 0.23, southY = northY - 1.06;
  const monitorY = (northY + southY) / 2;
  const shops = new M.VGroup(
    frame(shopX, northY, 1.72, 0.62, C.cyan, 0.9),
    frame(shopX, southY, 1.72, 0.62, C.amber, 0.9),
    label('North', shopX, northY, 21, C.cyan),
    label('South', shopX, southY, 21, C.amber),
  );
  const computer = new M.VGroup(
    frame(computerX, monitorY, 2.05, 1.59, C.muted, 0.85),
    label('Main computer', computerX, monitorY - 1.02, 19, C.ink, false, 2.8),
  );
  function sendSlip(x, y, color) {
    return new M.VGroup(
      frame(x, y, 1.2, 0.43, color, 0.95),
      label('Ticket', x, y, 17, color),
    );
  }
  const north = sendSlip(shopX + 1.51, northY, C.cyan);
  const south = sendSlip(shopX + 1.51, southY, C.amber);
  const retry = sendSlip(shopX + 1.51, northY, C.cyan);
  const send = (ticket, y, color, x = computerX) =>
    new M.Transform(ticket, sendSlip(x, y, color), { runTime: 0.85 });

  await until(S(0));
  await play(enter(shops), enter(computer), enter(north), enter(south), ...say('SHOPS SEND SALES TICKETS'));
  await play(send(north, northY, C.cyan), send(south, southY, C.amber));

  await until(S(1));
  await play(enter(retry), ...say('NORTH SENDS A TICKET AGAIN'));
  await play(send(retry, northY, C.cyan, computerX - 1.75));

  await until(S(2));
  await play(...say('COUNT EACH SALE ONCE?', C.amber));

  await until(S(3));
  await play(...[shops, computer, north, south, retry].map(item => leave(item)),
    ...say('TUESDAY · 6 A.M.'));

  // 4–17: set out Monday's tickets, load B, then put both copies side by side.
  await until(S(4));
  await play(...showTable(original, 'TICKET', true), ...say('4 SAVED MONDAY TICKETS'));

  await until(S(5));
  await play(...reveal('A', 0), ...say('TICKET A · $4'));

  await until(S(6));
  await play(...reveal('C', 1), ...say('TICKET C · $6', C.amber));

  await until(S(7));
  await play(...reveal('D', 2), ...say('TICKET D · $10', C.amber));

  await until(S(8));
  await play(...reveal('E', 3), ...say('TICKET E · $14', C.amber));

  await until(S(9));
  await play(...fbox(['$4 + $6 + $10 + $14', ['Monday total = $34', C.amber]], C.amber),
    ...say('ADD THE FOUR AMOUNTS', C.amber));

  await until(S(10));
  await play(receive('B'), ...say('TUESDAY · 8 A.M.'));

  await until(S(11));
  await saveIncoming('B', false, ...say('SAVE B AND ADD $8', C.green));
  await play(...fbox([['Monday total = $42', C.green]], C.green));

  await until(S(12));
  await play(...fbox(['$34 + $8 = $42', ['Monday total = $42', C.green]], C.green));

  await until(S(13));
  await play(...fbox(['Saved tickets = 5', ['Monday total = $42', C.green]], C.green),
    ...say('5 SAVED TICKETS', C.green));

  await until(S(14));
  await play(receive('B'), ...say('NORTH SENDS B AGAIN'));

  const copies = compare('B', 'B', 'SAVED COPY', 'SENT AGAIN');
  await until(S(15));
  await play(...hideTable(), ...dismiss(), ...fbox(), enter(copies), ...say('TWO COPIES OF TICKET B'));

  await until(S(16));
  await play(...fbox([['Same Monday sale · $8', C.cyan]]), ...say('BOTH SHOW THE SAME SALE'));

  await until(S(17));
  await play(...fbox([['New sales = 0', C.amber]], C.amber), ...say('ONE SALE, TWO COPIES', C.amber));

  // 18–25: one mark in the register, then one row for each ticket ID.
  function person(x, y, color) {
    const head = new M.Circle({ radius: 0.14, color });
    head.setFill(color, 1);
    head.moveTo([x, y + 0.29, 0]);
    const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color });
    body.setFill(color, 1);
    body.moveTo([x, y - 0.02, 0]);
    return new M.VGroup(head, body);
  }

  const classY = P ? -0.45 : -0.54;
  const studentX = CX - 0.8;
  const student = person(studentX, classY, C.cyan);
  const classroom = new M.VGroup(
    person(CX - 2.38, classY, C.amber),
    label('Teacher', CX - 2.38, classY - 0.41, 19, C.amber, false),
    label('Mia', studentX, classY - 0.41, 19, C.cyan, false),
    frame(CX + 1.68, classY, 2.85, 1.27, C.muted, 0.91),
    label('CLASS REGISTER', CX + 1.68, classY + 0.3, 16, C.muted),
    label('Mia', CX + 0.98, classY - 0.17, 20, C.ink, false),
  );
  const mark = label('✓ Present', CX + 2.0, classY - 0.17, 19, C.green, false, 1.95);

  await until(S(18));
  await play(leave(copies), ...fbox(), enter(classroom), enter(student),
    ...say('MARK THE STUDENT PRESENT', C.green));
  await play(enter(mark), ...fbox([['Students present = 1', C.green]], C.green));

  await until(S(19));
  await play(...say('MIA LEAVES AND RETURNS'),
    new M.Transform(student, person(studentX, classY - 1.3, C.cyan), { runTime: 0.7 }));
  await play(new M.Transform(student, person(studentX, classY, C.cyan), { runTime: 0.7 }));
  await play(...say('STILL ONE STUDENT', C.green), new M.Indicate(mark, { color: C.green, runTime: 0.6 }));

  await until(S(20));
  await play(leave(classroom), leave(student), leave(mark), ...fbox(), ...showTable(withB, 'TICKET'),
    ...say('SAME IDEA FOR SALES'));

  await until(S(21));
  await play(...setHeading('TICKET ID'), ...highlight(idColumn(C.cyan, true)), ...say('TICKET ID = SALE NAME'));

  await until(S(22));
  await play(...say('ONE ID PER SALE', C.green), ...highlight(idColumn(C.green, true)),
    ...fbox([['A   C   D   E   B', C.green], 'All five IDs are different'], C.green));

  await until(S(23));
  await play(receive('B'), ...highlight(idCell(4, C.cyan)), ...say('SAME TICKET ID ON RETRY'),
    ...fbox(['Saved copy: B', ['Sent again: B', C.cyan]]));

  await until(S(24));
  const storedB = saved.pop();
  await play(leave(storedB), ...highlight(), ...fbox(), ...say('LOADING = SAVING RECORDS'));
  await saveIncoming('B');

  await until(S(25));
  await play(receive('B'), ...highlight(idCell(4, C.green)), ...say('IDEMPOTENT LOAD', C.green),
    ...fbox(['Before retry: 5, $42', ['After retry:  5, $42', C.green]], C.green));
  await play(...dismiss());

  // 26–38: run the ID check on the first delivery and the retry.
  await until(S(26));
  await play(...highlight(), ...showTable(original), ...fbox(), ...say('BACK TO TUESDAY · 6 A.M.'));

  await until(S(27));
  await play(...fbox(['A + C + D + E', ['$4 + $6 + $10 + $14 = $34', C.amber]], C.amber),
    ...say('4 MONDAY TICKETS'));

  await until(S(28));
  await play(receive('B'), ...say('FIRST DELIVERY OF B'));

  await until(S(29));
  await play(...highlight(idColumn(C.amber)), ...say('IS B IN THE SAVED LIST?', C.amber));

  await until(S(30));
  await saveIncoming('B', false, ...highlight(), ...say('B IS NEW · SAVE IT', C.green));

  await until(S(31));
  await play(...fbox([['Saved tickets: 4 → 5', C.green]], C.green), ...say('ONE MORE SAVED TICKET', C.green));

  await until(S(32));
  await play(...fbox(['Saved tickets = 5', ['$34 + $8 = $42', C.green]], C.green), ...say('MONDAY TOTAL · $42', C.green));

  await until(S(33));
  await play(receive('B'), ...say('SECOND DELIVERY OF B'));

  await until(S(34));
  await play(...highlight(idColumn(C.amber)), ...say('CHECK THE SAVED IDS AGAIN', C.amber));

  await until(S(35));
  await play(...highlight(idCell(4, C.green)), ...say('B IS ALREADY SAVED', C.green));

  await until(S(36));
  await play(...dismiss(), ...say('SKIP THE SECOND COPY', C.green));

  await until(S(37));
  await play(...highlight(), ...fbox([['Saved tickets: 5 → 5', C.green]], C.green),
    ...say('STILL 5 SAVED TICKETS', C.green));

  await until(S(38));
  await play(...fbox(['Saved tickets = 5', ['Monday total: $42 → $42', C.green]], C.green),
    ...say('MONDAY TOTAL STAYS $42', C.green));

  // 39–43: write the two cases and mark the column that must be unique.
  await until(S(39));
  await play(...fbox(['1. …', '2. …']), ...say('THE RULE IN TWO LINES'));

  await until(S(40));
  await play(...fbox([['New ID → save and add amount', C.green], '2. …']),
    ...say('NEW ID · SAVE AND ADD', C.green));

  await until(S(41));
  await play(...fbox([['New ID → save and add amount', C.green], ['Saved ID → skip the copy', C.amber]]),
    ...say('SAVED ID · ADD $0', C.amber));

  await until(S(42));
  await play(...highlight(idColumn(C.cyan, true)), ...say('EACH SAVED ID APPEARS ONCE'));

  await until(S(43));
  await play(receive('B'), ...highlight(idCell(4, C.green)), ...say('RETRY WITHOUT COUNTING TWICE', C.green),
    ...fbox(['Saved tickets: 5 → 5', ['Monday total: $42 → $42', C.green]], C.green));
  await play(...dismiss());

  // 44–50: show the extra row and dollars, then compare equal prices.
  await until(S(44));
  await play(receive('B'), ...highlight(), ...say('WHAT IF WE SAVE B TWICE?', C.pink));
  await saveIncoming('B', true);

  await until(S(45));
  await play(...highlight(idCell(5, C.pink)), ...fbox([['Saved records: 5 → 6', C.pink]], C.pink),
    ...say('6 RECORDS FOR 5 SALES', C.pink));

  await until(S(46));
  await play(...fbox(['Saved records = 6', ['$42 + $8 = $50', C.pink]], C.pink), ...say('WRONG TOTAL · $50', C.pink));

  await until(S(47));
  await play(...fbox(['$50 − $42 = $8 too high', ['New sales = 0', C.pink]], C.pink),
    ...say('THE EXTRA $8 IS THE SAME SALE', C.pink));

  const equalPrices = compare('B', 'F', 'MONDAY SALE', 'TUESDAY SALE');
  await until(S(48));
  await play(...hideTable(), ...highlight(), enter(equalPrices),
    ...fbox([['$8 = $8', C.amber]], C.amber), ...say('DIFFERENT SALES CAN COST $8', C.amber));

  await until(S(49));
  await play(...fbox([['B and F are different IDs', C.green]], C.green), ...say('USE THE TICKET ID', C.green));

  await until(S(50));
  await play(leave(equalPrices), ...showTable(withB), receive('B'),
    ...highlight(idCell(4, C.green)), ...say('SAME TICKET · SAME RESULT', C.green),
    ...fbox(['Saved tickets: 5 → 5', ['Monday total: $42 → $42', C.green]], C.green));
  await play(...dismiss());
}

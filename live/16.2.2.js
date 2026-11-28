// 16.2.2 Event time: giving each sale to the right day.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);

  const tickets = {
    A: { shop: 'North', amount: 4 },
    B: { shop: 'North', amount: 8 },
    C: { shop: 'South', amount: 6 },
    D: { shop: 'South', amount: 10 },
    E: { shop: 'South', amount: 14 }
  };

  function text(label, x, y, size, color = C.ink, maxWidth = Infinity) {
    const t = T(label, size, color, true, true);
    if (t.getWidth() > maxWidth) t.scale(maxWidth / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(x, y, width, height, color, fill = C.card, opacity = 0.94) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.1, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function line(x1, y1, x2, y2, color = C.muted) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: 2 });
  }

  const appear = object => new M.FadeIn(object, { runTime: 0.3 });
  const vanish = object => new M.FadeOut(object, { runTime: 0.25 });
  const mark = (object, color = C.green) =>
    new M.Indicate(object, { color, scaleFactor: 1.04, runTime: 0.68 });
  const swap = (oldObjects, newObjects) => [...oldObjects.map(vanish), ...newObjects.map(appear)];

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const previous = boxNow;
    boxNow = null;
    if (lines.length) {
      const width = P ? FW - 1.2 : 4.0;
      const lh = P ? 0.43 : 0.4;
      const height = lines.length * lh + 0.34;
      const [x, y] = BOXP;
      const rows = lines.map((row, i) => {
        const [label, ink] = Array.isArray(row) ? row : [row, C.ink];
        return text(label, x, y + ((lines.length - 1) / 2 - i) * lh,
          P ? 20 : 19, ink, width - 0.38);
      });
      boxNow = new M.VGroup(rect(x, y, width, height, color), ...rows);
    }
    if (previous && boxNow) {
      return [new M.LaggedStart([vanish(previous), appear(boxNow)], {
        lagRatio: 1, runTime: 0.55
      })];
    }
    if (previous) return [vanish(previous)];
    return boxNow ? [appear(boxNow)] : [];
  }

  function slip(id, x, y, width = 1.1) {
    const { shop, amount } = tickets[id];
    const color = shop === 'North' ? C.cyan : C.amber;
    return new M.VGroup(
      rect(x, y, width + 0.08, 0.68, C.card, color, 0.2),
      rect(x, y, width, 0.6, color),
      text(`${id}  $${amount}`, x, y + 0.13, 18, color, width - 0.12),
      text(shop, x, y - 0.14, 15, C.ink, width - 0.12)
    );
  }

  function shop(name, x, color) {
    return new M.VGroup(
      rect(x, 0, 2.35, 1.28, color),
      line(x - 1.16, 0.23, x + 1.16, 0.23, color),
      text(name, x, 0.43, 20, color, 2.1),
      rect(x, -0.23, 0.32, 0.62, color),
      rect(x - 0.67, -0.16, 0.45, 0.36, color, color, 0.22),
      rect(x + 0.67, -0.16, 0.45, 0.36, color, color, 0.22)
    );
  }

  const IX = P ? 0 : 0, SX = P ? 1.45 : 2.3;
  const shops = [shop('North', IX - SX, C.cyan), shop('South', IX + SX, C.amber)];
  if (!P) shops.forEach(s => s.scale(1.5));
  const morning = text('Previous day’s sales total', IX, P ? -1.1 : -1.5, P ? 22 : 26, C.ink, 6.6);
  const late = text('A ticket arrives a day late', IX, P ? -1.88 : -2.4, P ? 20 : 24, C.amber, 6.6);

  await until(S(0)); await play(new M.LaggedStart(shops.map(appear), { lagRatio: 0.2 }), ...say('TWO BAKERY SHOPS'));
  await until(S(1)); await play(appear(morning), ...say('EVERY MORNING'));
  await until(S(2)); await play(appear(late), ...say('WHICH DAY GETS THE SALE?', C.amber));

  // The two rows share a time line. Tuesday has its own segment.
  const DX = P ? 1.18 : 1.27;
  const xAt = i => CX + (i - 2.5) * DX;
  const SALE_Y = P ? -0.7 : 0.42;
  const ARRIVAL_Y = P ? -4.3 : -1.44;
  const DAY_Y = P ? 0.7 : 1.35;
  const HOURS = ['9 am', '10 am', '11 am', 'Noon', '2 pm', '8 am'];

  function daySegment(tuesday) {
    const i = tuesday ? 5 : 0;
    const j = tuesday ? 5 : 4;
    const left = xAt(i) - 0.57;
    const right = xAt(j) + 0.57;
    return new M.VGroup(
      text(tuesday ? 'Tuesday' : 'Monday', (left + right) / 2, DAY_Y,
        20, C.ink, right - left),
      line(left, SALE_Y - 0.43, right, SALE_Y - 0.43),
      line(left, ARRIVAL_Y - 0.43, right, ARRIVAL_Y - 0.43)
    );
  }

  function rowLabels(sale, arrival) {
    const x = (xAt(0) + xAt(4)) / 2;
    return [
      text(sale, x, SALE_Y + 0.54, 17, C.cyan, 4.8),
      text(arrival, x, ARRIVAL_Y + 0.57, 17, C.green, 4.8)
    ];
  }

  function stamp(id, i, y) {
    const x = xAt(i);
    return new M.VGroup(
      slip(id, x, y),
      line(x, y - 0.36, x, y - 0.5),
      text(HOURS[i], x, y - 0.68, P ? 17 : 15, C.ink, DX - 0.08)
    );
  }

  function timeline(named = false) {
    const monday = daySegment(false);
    const tuesday = daySegment(true);
    const rows = named ? rowLabels('Event time', 'Arrival time') : rowLabels('Sale', 'Ticket arrives');
    const sales = [stamp('A', 0, SALE_Y), stamp('C', 1, SALE_Y), stamp('B', 2, SALE_Y)];
    const arrivals = [stamp('A', 0, ARRIVAL_Y), stamp('C', 1, ARRIVAL_Y),
      stamp('D', 3, ARRIVAL_Y), stamp('E', 4, ARRIVAL_Y), stamp('B', 5, ARRIVAL_Y)];
    return { monday, tuesday, rows, sales, arrivals };
  }

  let tl = timeline();
  await until(S(3)); await play(...swap([...shops, morning, late], [tl.monday, ...tl.rows]), ...say('MONDAY SALES'));
  await until(S(4)); await play(appear(tl.sales[0]), ...say('NORTH SELLS FOR $4'));
  await until(S(5)); await play(appear(tl.arrivals[0]), ...say('TICKET A ARRIVES AT 9 AM', C.green));
  await until(S(6)); await play(appear(tl.sales[1]), ...say('SOUTH SELLS FOR $6', C.amber));
  await until(S(7)); await play(appear(tl.arrivals[1]), ...say('TICKET C ARRIVES AT 10 AM', C.green));
  await until(S(8)); await play(appear(tl.sales[2]), ...say('NORTH SELLS FOR $8'));
  await until(S(9)); await play(...fbox([['North loses internet', C.amber], 'Ticket B is at North'], C.amber), ...say('INTERNET CONNECTION STOPS', C.amber));
  await until(S(10)); await play(mark(tl.sales[2], C.cyan), ...say('TICKET B STAYS AT NORTH'));
  await until(S(11)); await play(appear(tl.arrivals[2]), ...fbox([]), ...say('TICKET D ARRIVES AT NOON', C.amber));
  await until(S(12)); await play(appear(tl.arrivals[3]), ...say('TICKET E ARRIVES AT 2 PM', C.amber));
  await until(S(13)); await play(appear(tl.tuesday), ...say('MONDAY ENDS. TUESDAY BEGINS.'));
  await until(S(14)); await play(appear(tl.arrivals[4]), ...say('TICKET B ARRIVES AT 8 AM', C.green));
  await until(S(15)); await play(mark(tl.sales[2], C.cyan), mark(tl.arrivals[4]), ...say('ONE TICKET, TWO DAYS'));
  await until(S(16)); await play(mark(tl.sales[2], C.cyan), ...fbox(['Customer pays $8', ['Monday at 11 am', C.cyan]]), ...say('THE SALE IS ON MONDAY'));
  await until(S(17)); await play(mark(tl.arrivals[4]), ...fbox(['Computer receives B', ['Tuesday at 8 am', C.green]], C.green), ...say('THE TICKET ARRIVES ON TUESDAY', C.green));
  await until(S(18)); await play(...say('WHICH DAY GETS THE $8?', C.amber));

  function timelineObjects() {
    return [tl.monday, tl.tuesday, ...tl.rows, ...tl.sales, ...tl.arrivals];
  }

  function envelope(x, color, caption) {
    return new M.VGroup(
      rect(x, -0.1, 2.1, 1.14, color),
      line(x - 1.02, 0.42, x, -0.13, color),
      line(x, -0.13, x + 1.02, 0.42, color),
      text(caption, x, -1.05, 19, color, 3.1)
    );
  }
  const written = envelope(CX - 1.77, C.cyan, 'Monday · written');
  const received = envelope(CX + 1.77, C.green, 'Tuesday · received');

  await until(S(19)); await play(...swap(timelineObjects(), [written]), ...fbox([]), ...say('A LETTER ARRIVES LATE', C.amber));
  await until(S(20)); await play(appear(received), ...say('WRITTEN ONE DAY, RECEIVED ANOTHER'));
  await until(S(21));
  tl = timeline();
  await play(...swap([written, received], timelineObjects()), ...say('A SALE AND ITS TICKET CAN DIFFER'));

  await until(S(22)); await play(mark(tl.rows[0], C.cyan), mark(tl.rows[1]), ...say('TWO TIMES, TWO NAMES'));
  await until(S(23));
  const [eventLabel, arrivalLabel] = rowLabels('Event time', 'Arrival time');
  await play(...swap([tl.rows[0]], [eventLabel]), ...say('EVENT TIME: WHEN IT HAPPENS'));
  tl.rows[0] = eventLabel;

  await until(S(24)); await play(mark(tl.sales[2], C.cyan), ...say('THE EVENT IS THE SALE'));
  await until(S(25)); await play(...swap([tl.rows[1]], [arrivalLabel]), ...say('ARRIVAL TIME: WHEN IT IS RECEIVED', C.green));
  tl.rows[1] = arrivalLabel;

  await until(S(26)); await play(mark(tl.sales[2], C.cyan), ...fbox(['Ticket B event time', ['Monday at 11 am', C.cyan]]), ...say('WHEN THE SALE HAPPENS'));
  await until(S(27)); await play(mark(tl.arrivals[4]), ...fbox(['Ticket B arrival time', ['Tuesday at 8 am', C.green]], C.green), ...say('WHEN THE TICKET ARRIVES', C.green));

  // Two day spaces, with a gap where a newly received slip can wait.
  const DAY_DX = 2.16;
  const TOP = P ? 0.3 : 0.12;
  const ROW_PITCH = P ? 1.25 : 0.75;
  const LAST = TOP - 2 * ROW_PITCH;
  const TOTAL_Y = P ? -4.3 : -2.23;
  const dayX = tuesday => CX + (tuesday ? DAY_DX : -DAY_DX);
  const slotX = (tuesday, right) => dayX(tuesday) + (right ? 0.65 : -0.65);
  const headingsY = P ? 1.48 : 0.99;

  function daySpace(tuesday) {
    const x = dayX(tuesday);
    const top = headingsY + 0.34;
    const bottom = TOTAL_Y - 0.35;
    return new M.VGroup(
      rect(x, (top + bottom) / 2, 2.85, top - bottom, C.muted, C.card, 0.5),
      text(tuesday ? 'Tuesday' : 'Monday', x, headingsY, 22, C.ink, 2.5),
      line(x - 1.19, TOTAL_Y + 0.37, x + 1.19, TOTAL_Y + 0.37)
    );
  }

  function total(tuesday, dollars, color = C.ink) {
    return text(`Total  $${dollars}`, dayX(tuesday), TOTAL_Y, 20, color, 2.45);
  }

  const spaces = [daySpace(false), daySpace(true)];
  const four = ['A', 'C', 'D', 'E'].map((id, i) =>
    slip(id, slotX(false, i % 2 === 1), TOP - Math.floor(i / 2) * ROW_PITCH));
  const b = slip('B', CX, LAST);
  const bMonday = slip('B', slotX(false, true), LAST);
  const bTuesday = slip('B', slotX(true, false), LAST);
  const mon34 = total(false, 34);
  const tue0 = total(true, 0);
  const mon42 = total(false, 42, C.green);

  await until(S(28)); await play(...swap(timelineObjects(), spaces), ...fbox([]), ...say('ONE SPACE FOR EACH DAY'));
  await until(S(29)); await play(
    new M.LaggedStart(four.map(appear), { lagRatio: 0.2, runTime: 0.75 }),
    ...fbox(['Tuesday at 6 am', '4 Monday tickets received']),
    ...say('FOUR TICKETS IN MONDAY'));
  await until(S(30)); await play(mark(four[0]), mark(four[1]), ...fbox([['$4 + $6 = $10', C.green]]), ...say('START WITH TICKETS A AND C'));
  await until(S(31)); await play(mark(four[2]), ...fbox([['$10 + $10 = $20', C.green]]), ...say('ADD TICKET D'));
  await until(S(32)); await play(mark(four[3]), appear(mon34), ...fbox([['$20 + $14 = $34', C.green]]), ...say('ADD TICKET E'));
  await until(S(33)); await play(appear(b), ...fbox(['Tuesday at 8 am', ['Ticket B arrives', C.green]], C.green), ...say('THE COMPUTER RECEIVES TICKET B', C.green));
  await until(S(34)); await play(mark(b, C.cyan), ...fbox(['Read B’s event time', ['Monday at 11 am', C.cyan]]), ...say('READ THE TIME OF THE SALE'));
  await until(S(35)); await play(
    new M.Transform(b, bMonday, { runTime: 0.65 }), ...say('PUT TICKET B IN MONDAY'));
  await until(S(36)); await play(...swap([mon34], [mon42]), ...fbox([['$34 + $8 = $42', C.green]], C.green), ...say('MONDAY NOW TOTALS $42', C.green));
  await until(S(37)); await play(mark(mon42), ...say('TICKET B ADDS $8 TO MONDAY', C.green));
  await until(S(38)); await play(appear(tue0), ...fbox(['Ticket B’s share', ['Monday +$8  ·  Tuesday +$0', C.green]], C.green), ...say('TICKET B ADDS $0 TO TUESDAY', C.green));

  await until(S(39)); await play(...fbox(['Which day gets a sale?']), ...say('THE RULE'));
  await until(S(40)); await play(mark(b, C.cyan), ...fbox([['Sale day = day of event time', C.cyan]]), ...say('COUNT EACH SALE ON ITS SALE DAY'));
  await until(S(41)); await play(mark(mon42), ...fbox(['B arrives Tuesday', ['B counts toward Monday', C.green]], C.green), ...say('LATE TICKETS STILL COUNT ON SALE DAY'));
  await until(S(42)); await play(...fbox(['Arrival time for B', ['Tuesday at 8 am', C.green]], C.green), ...say('WHEN THE COMPUTER RECEIVES THE TICKET', C.green));

  // Recount the same tickets using the other timestamp.
  await until(S(43)); await play(
    vanish(mon42), vanish(tue0),
    new M.Transform(b, slip('B', CX, LAST), { runTime: 0.58 }),
    ...fbox(['What if we use arrival time?'], C.amber),
    ...say('TRY COUNTING BY ARRIVAL DAY', C.amber));
  const wrongMonday = total(false, 34, C.amber);
  const wrongTuesday = total(true, 8, C.amber);
  await until(S(44)); await play(appear(wrongMonday), ...fbox(['Monday should have $42', ['$42 − $34 = $8 too low', C.amber]], C.amber), ...say('MONDAY IS $8 TOO LOW', C.amber));
  await until(S(45)); await play(
    new M.Transform(b, bTuesday, { runTime: 0.62 }), appear(wrongTuesday),
    ...fbox(['Tuesday gets $8', ['B was a Monday sale', C.amber]], C.amber),
    ...say('TUESDAY GETS MONDAY’S $8', C.amber));
  await until(S(46)); await play(mark(wrongMonday, C.amber), mark(wrongTuesday, C.amber),
    ...fbox(['Monday: $34 instead of $42', 'Tuesday: $8 instead of $0'], C.amber),
    ...say('BOTH TOTALS ARE WRONG', C.amber));

  function recap(x, label, time, color) {
    const g = new M.VGroup(
      text(label, x, 0.64, 21, color, 3.4),
      slip('B', x, -0.18, 1.45),
      text(time, x, -0.99, 19, C.ink, 3.4)
    );
    if (P) { g.scale(1.25); g.shift([0, -1.4, 0]); }
    return g;
  }
  const eventRecap = recap(CX - 1.8, 'Event time', 'Monday at 11 am', C.cyan);
  const arrivalRecap = recap(CX + 1.8, 'Arrival time', 'Tuesday at 8 am', C.green);

  await until(S(47)); await play(
    ...swap([...spaces, ...four, b, wrongMonday, wrongTuesday], [eventRecap, arrivalRecap]),
    ...fbox([['Event time: sale happens', C.cyan], ['Arrival time: ticket arrives', C.green]]),
    ...say('ONE SALE, TWO TIMES'));
}

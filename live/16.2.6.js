// 16.2.6 Partitioning: skip the data you do not need.
// Beat i is sentence i in lesson.json.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.75, 0] : [CX, 1.85, 0];
  let BOXP = P ? [0, -5.65, 0] : [4.3, -0.3, 0];   // phone: card in the lower third, under the picture

  const tickets = [
    ['A', 'North', 'Monday', 4],
    ['B', 'North', 'Monday', 8],
    ['C', 'South', 'Monday', 6],
    ['D', 'South', 'Monday', 10],
    ['E', 'South', 'Monday', 14],
    ['F', 'North', 'Tuesday', 8],
    ['G', 'South', 'Tuesday', 12],
  ];
  const groups = [
    ['North', 'Monday', [0, 1]],
    ['South', 'Monday', [2, 3, 4]],
    ['North', 'Tuesday', [5]],
    ['South', 'Tuesday', [6]],
  ];
  const shopColor = shop => shop === 'North' ? C.cyan : C.amber;

  const say = (words, color = C.cyan) => showA(words, color, PILL, P ? 18 : 19);
  const fadeIn = (object, runTime = 0.38) => new M.FadeIn(object, { runTime });
  const fadeOut = (object, runTime = 0.32) => new M.FadeOut(object, { runTime });
  const pulse = (object, color = C.amber, runTime = 0.65) =>
    new M.Indicate(object, { color, scaleFactor: 1.035, runTime });
  const sequence = (animations, runTime, lagRatio = 0.25) =>
    new M.LaggedStart(animations, { runTime, lagRatio });

  function line(text, x, y, size, color, width, bold = false) {
    const label = T(text, size, color, true, bold);
    if (label.getWidth() > width) label.scale(width / label.getWidth());
    label.moveTo([x, y, 0]);
    return label;
  }

  function panel(x, y, width, height, color, fill = C.card, opacity = 0.92) {
    const box = new M.RoundedRectangle({
      width, height, cornerRadius: 0.12, color, strokeWidth: 2,
    });
    box.setFill(fill, opacity);
    box.moveTo([x, y, 0]);
    return box;
  }

  let boxNow = null;
  function fbox(rows, color = C.cyan) {
    const width = P ? Math.min(6.2, FW - 1.2) : 4.05;
    const height = rows.length === 1 ? 0.72 : 1.14;
    const [x, y] = BOXP;
    const frame = panel(x, y, width, height, color);
    const labels = rows.map((row, i) => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return line(text, x, y + ((rows.length - 1) / 2 - i) * 0.42,
        P ? 21 : 20, ink, width - 0.45, true);
    });
    const next = new M.VGroup(frame, ...labels);
    const animations = boxNow ? [fadeOut(boxNow), fadeIn(next)] : [fadeIn(next)];
    boxNow = next;
    return animations;
  }

  function clearBox() {
    const animations = boxNow ? [fadeOut(boxNow)] : [];
    boxNow = null;
    return animations;
  }

  function shopfront(shop, x) {
    const y = -0.68;
    const color = shopColor(shop);
    const roof = new M.Polygon({
      vertices: [[x - 1.25, y + 0.53, 0], [x, y + 1.17, 0], [x + 1.25, y + 0.53, 0]],
      color, strokeWidth: 2,
    });
    roof.setFill(color, 0.22);
    return new M.VGroup(
      panel(x, y, 2.25, 1.07, color),
      roof,
      line(shop, x, y, 26, color, 1.9, true),
    );
  }

  function savedSales() {
    return new M.VGroup(...['North', 'South'].flatMap((shop, column) => {
      const x = CX + (column - 0.5) * 3.15;
      const color = shopColor(shop);
      return [
        line(shop, x, 0.39, 23, color, 2, true),
        ...[0, 1, 2].map(i => panel(x, -0.14 - i * 0.49, 2.2, 0.32, color, color, 0.16)),
      ];
    }));
  }

  function slip(index, x, y, compact = false) {
    const [id, shop, day, amount] = tickets[index];
    const width = compact ? (P ? 0.99 : 0.98) : 1.56;
    const height = compact ? (P ? 1.15 : 0.78) : 1.12;
    const color = shopColor(shop);
    const pitch = height * 0.28;
    return new M.VGroup(
      panel(x, y, width, height, color, C.card),
      line(`${id}  $${amount}`, x, y + pitch, compact ? (P ? 18 : 17) : 22, color, width - 0.12, true),
      line(shop, x, y, compact ? (P ? 16 : 15) : 19, C.ink, width - 0.12),
      line(compact && P ? day.slice(0, 3) : day, x, y - pitch, compact ? (P ? 16 : 15) : 19, C.ink, width - 0.12),
    );
  }

  function flatSlip(i) {
    const column = i < 4 ? i - 1.5 : i - 5;
    return slip(i, CX + column * 1.72, i < 4 ? 0.66 : -0.77);
  }

  function stagedSlip(i) {
    if (!P) return slip(i, CX + (i - 3) * 1.045, -2.29, true);
    const column = i < 4 ? i - 1.5 : i - 5;
    return slip(i, CX + column * 1.16, i < 4 ? -2.95 : -4.25, true);
  }

  const drawerWidth = 3.45;
  const drawerHeight = P ? 2.3 : 1.28;
  function makeDrawers() {
    return groups.map(([shop, day, ids], i) => {
      const x = CX + (i % 2 === 0 ? -1 : 1) * 1.79;
      const y = i < 2 ? (P ? 1.45 : 0.70) : (P ? -0.95 : -0.72);
      const color = shopColor(shop);
      return {
        x, y, ids, color,
        frame: panel(x, y, drawerWidth, drawerHeight, color),
        label: line(`${shop} · ${day}`, x, y + drawerHeight / 2 - 0.23,
          P ? 20 : 18, color, drawerWidth - 0.25, true),
        status: null,
      };
    });
  }

  function drawerSlip(drawer, index, position) {
    const x = drawer.x + (position - (drawer.ids.length - 1) / 2) * 1.05;
    const y = drawer.y - (P ? 0.32 : 0.17);
    return slip(index, x, y, true);
  }

  function status(drawer, text, color = C.muted) {
    const animations = drawer.status ? [fadeOut(drawer.status)] : [];
    drawer.status = text
      ? line(text, drawer.x, drawer.y - 0.17, P ? 19 : 17, color, drawerWidth - 0.28, true)
      : null;
    if (drawer.status) animations.push(fadeIn(drawer.status));
    return animations;
  }

  // a NEW slip appears inside the drawer (added after the drawer, so it is drawn on top of the drawer fill:
  // no ghost text behind the drawer); the old slip below the cabinet goes.
  function place(drawer, current) {
    return drawer.ids.flatMap((i, p) => {
      const old = current[i];
      current[i] = drawerSlip(drawer, i, p);
      return [fadeOut(old, 0.3), new M.FadeIn(current[i], { runTime: 0.52, shift: [0, 0.25, 0] })];
    });
  }

  function reveal(drawer, current) {
    return drawer.ids.map((i, p) => {
      current[i] = drawerSlip(drawer, i, p);
      return fadeIn(current[i]);
    });
  }

  function outline(drawer, color) {
    const frame = panel(drawer.x, drawer.y, drawerWidth + 0.08, drawerHeight + 0.08, color, C.bg, 0);
    frame.setStrokeWidth(3);
    return frame;
  }

  const shops = new M.VGroup(shopfront('North', CX - 1.6), shopfront('South', CX + 1.6));
  const saved = savedSales();
  const current = tickets.map((_, i) => flatSlip(i));
  const bigBox = panel(CX, -0.10, 7.12, 2.88, C.muted, C.bg, 0);
  let drawers = makeDrawers();
  const open = () => drawers[0];
  let selectedOutline;

  await until(S(0));
  await play(fadeIn(shops), ...say('TWO BAKERY SHOPS'));
  await until(S(1));
  await play(...fbox(['North · Monday', ['Total sales?', C.amber]], C.amber));
  await until(S(2));
  await play(fadeOut(shops), fadeIn(saved), ...say('SAVED SALES FROM BOTH SHOPS'));
  await until(S(3));
  await play(...say('READ EVERY TICKET?', C.amber));
  await until(S(4));
  await play(fadeOut(saved), ...say('7 TICKETS · TUESDAY AFTER 11 A.M.'));

  for (let i = 0; i < tickets.length; i++) {
    await until(S(5 + i));
    await play(fadeIn(current[i]));
  }

  await until(S(12));
  await play(new M.Create(bigBox, { runTime: 0.55 }), ...say('ONE BOX'));
  await until(S(13));
  await play(sequence(current.map(object => pulse(object, C.amber, 0.41)), 1.9, 0.68),
    ...say('CHECK EVERY TICKET', C.amber));
  await play(...fbox(['North · Monday', ['7 tickets checked', C.amber]], C.amber));

  await until(S(14));
  await play(fadeOut(bigBox),
    ...current.map((object, i) => new M.Transform(object, stagedSlip(i), { runTime: 0.55 })),
    ...drawers.map(drawer => fadeIn(drawer.frame)),
    ...say('A CABINET WITH DRAWERS'));
  await until(S(15));
  await play(...say('LABELS TELL US WHAT BELONGS INSIDE'));
  await until(S(16));
  await play(...clearBox(), ...say('7 TICKETS INTO 4 DRAWERS'));
  await until(S(17));
  await play(fadeIn(drawers[0].label));
  await until(S(18));
  await play(...place(drawers[0], current));
  await until(S(19));
  await play(fadeIn(drawers[1].label));
  await until(S(20));
  await play(...place(drawers[1], current));
  await until(S(21));
  await play(fadeIn(drawers[2].label));
  await until(S(22));
  await play(...place(drawers[2], current));
  await until(S(23));
  await play(fadeIn(drawers[3].label));
  await until(S(24));
  await play(...place(drawers[3], current));

  await until(S(25));
  if (P) BOXP = [0, -3.55, 0];   // the slips under the cabinet are gone: card closer to the picture
  await play(sequence(current.map(object => pulse(object, C.green)), 1.1),
    ...say('ONE DRAWER FOR EACH TICKET', C.green));
  await until(S(26));
  await play(sequence(drawers.map(drawer => pulse(drawer.frame, C.violet)), 1.2),
    ...say('EACH GROUP IS A PARTITION', C.violet));
  await until(S(27));
  await play(...say('DIVIDING THE RECORDS IS PARTITIONING', C.violet));
  await until(S(28));
  await play(...fbox(['Group by shop', 'and day of sale'], C.violet),
    ...drawers.map(drawer => pulse(drawer.label, C.violet)));

  await until(S(29));
  await play(...current.map(object => fadeOut(object)),
    ...drawers.flatMap(drawer => status(drawer, 'Closed')),
    ...fbox(['North · Monday', ['Total sales?', C.amber]], C.amber),
    ...say('NORTH’S MONDAY SALES', C.amber));
  await until(S(30));
  await play(sequence(drawers.map(drawer => pulse(drawer.label)), 1.25),
    ...say('STEP 1 · CHECK THE LABELS'));
  await until(S(31));
  await play(pulse(open().label, C.green), ...status(open(), 'Matches both', C.green));
  await until(S(32));
  await play(pulse(drawers[1].label, C.pink), ...status(drawers[1], 'Wrong shop', C.pink));
  await until(S(33));
  await play(pulse(drawers[2].label, C.pink), ...status(drawers[2], 'Wrong day', C.pink));
  await until(S(34));
  await play(pulse(drawers[3].label, C.pink), ...status(drawers[3], 'Wrong shop and day', C.pink));

  await until(S(35));
  selectedOutline = outline(open(), C.green);
  await play(new M.Create(selectedOutline, { runTime: 0.42 }), ...status(open(), 'Open', C.green),
    ...say('STEP 2 · OPEN ONLY NORTH · MONDAY', C.green));
  await until(S(36));
  await play(...status(open(), null), ...reveal(open(), current),
    ...say('STEP 3 · READ 2 TICKETS', C.green));
  await until(S(37));
  await play(pulse(current[0], C.cyan), ...fbox(['North · Monday', ['Ticket A   $4', C.cyan]]));
  await until(S(38));
  await play(pulse(current[1], C.cyan), ...fbox(['North · Monday', ['Ticket B   $8', C.cyan]]));
  await until(S(39));
  await play(...fbox(['North · Monday', ['$4 + $8 = $12', C.amber]], C.amber));
  await until(S(40));
  await play(...say('NORTH’S MONDAY TOTAL IS $12', C.amber));
  await until(S(41));
  await play(sequence(drawers.slice(1).map(drawer => pulse(drawer.frame, C.muted)), 1.1),
    ...say('THE OTHER 3 PARTITIONS', C.muted));
  await until(S(42));
  await play(...drawers.slice(1).flatMap(drawer => status(drawer, 'Skipped')),
    ...fbox(['2 tickets read', ['3 partitions skipped', C.green]], C.green));
  await until(S(43));
  await play(...say('SKIPPING GROUPS IS PARTITION PRUNING', C.violet));

  // the archive: 18 labelled drawers (shop number + day), only one matches the question
  const SW = P ? 1.12 : 0.98, SH = P ? 1.25 : 0.72, SPX = P ? 1.22 : 1.1, SPY = P ? 1.5 : 0.9;
  const archive = Array.from({ length: 18 }, (_, i) => ({
    x: CX + (i % 6 - 2.5) * SPX,
    y: (P ? 1.4 : 0.68) - Math.floor(i / 6) * SPY,
  }));
  const days = ['Mon', 'Tue', 'Wed'];
  const shelfLab = i => [`Shop ${(i % 6) + 1}`, days[Math.floor(i / 6)]];
  const shelf = (i, color, fill, op, ink) => {
    const { x, y } = archive[i], [a, b] = shelfLab(i);
    const t1 = T(a, P ? 16 : 14, ink, false, true), t2 = T(b, P ? 16 : 14, ink, false);
    [t1, t2].forEach(t => { if (t.getWidth() > SW - 0.1) t.scale((SW - 0.1) / t.getWidth()); });
    t1.moveTo([x, y + SH * 0.18, 0]); t2.moveTo([x, y - SH * 0.2, 0]);
    return new M.VGroup(panel(x, y, SW, SH, color, fill, op), t1, t2);
  };
  const shelves = archive.map((_, i) => shelf(i, i % 2 === 0 ? C.cyan : C.amber, C.card, 0.92, C.ink));
  const match = 1;
  let archiveOutline;

  await until(S(44));
  await play(fadeOut(selectedOutline), ...clearBox(), ...current.slice(0, 2).map(object => fadeOut(object)),
    ...drawers.flatMap(drawer => [fadeOut(drawer.frame), fadeOut(drawer.label), ...status(drawer, null)]),
    sequence(shelves.map(object => fadeIn(object)), 1.15, 0.1),
    ...say('YEARS OF SALES · HUNDREDS OF SHOPS'));
  await until(S(45));
  archiveOutline = panel(archive[match].x, archive[match].y, SW + 0.1, SH + 0.1, C.green, C.bg, 0);
  archiveOutline.setStrokeWidth(3);
  await play(...shelves.flatMap((object, i) => i === match ? [] : [
    new M.Transform(object, shelf(i, C.line, C.card, 0.45, C.muted), { runTime: 0.45 }),
  ]), new M.Create(archiveOutline, { runTime: 0.45 }), ...fbox(['1 group read', ['17 groups skipped', C.green]], C.green),
    ...say('SKIP GROUPS THAT CANNOT MATCH', C.green));
  await until(S(46));
  await play(pulse(archiveOutline, C.green), ...say('FIND THE GROUPS YOU NEED', C.green));

  await until(S(47));
  drawers = makeDrawers();
  await play(fadeOut(archiveOutline), ...shelves.map(object => fadeOut(object)),
    ...drawers.flatMap(drawer => [fadeIn(drawer.frame), fadeIn(drawer.label), ...status(drawer, 'Closed')]),
    ...fbox(['Both shops · Both days', ['Total sales?', C.amber]], C.amber),
    ...say('BOTH SHOPS ACROSS BOTH DAYS', C.amber));
  await until(S(48));
  await play(...drawers.flatMap(drawer => [pulse(drawer.label, C.green), ...status(drawer, 'Matches', C.green)]),
    ...say('ALL 4 PARTITIONS MATCH', C.green));
  await until(S(49));
  await play(...drawers.flatMap(drawer => [...status(drawer, null), ...reveal(drawer, current)]),
    ...fbox(['4 partitions opened', ['0 partitions skipped', C.amber]], C.amber),
    ...say('EVERY PARTITION IS NEEDED', C.amber));
  await until(S(50));
  await play(sequence(drawers.map(drawer => pulse(drawer.label, C.violet)), 1.25),
    ...say('CHOOSE LABELS THAT FIT YOUR QUESTIONS', C.violet));

  await until(S(51));
  selectedOutline = outline(open(), C.green);
  await play(new M.Create(selectedOutline, { runTime: 0.42 }),
    ...current.slice(2).map(object => fadeOut(object)),
    ...drawers.slice(1).flatMap(drawer => status(drawer, 'Skipped')),
    ...fbox(['North · Monday', ['1 opened · 3 skipped', C.green]], C.green),
    ...say('LABEL THE GROUPS · SKIP WHAT YOU DON’T NEED', C.green));
}

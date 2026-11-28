// 2.1.1 Bar charts: counting by kind.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, until, play } = L;

  const cats = [
    { name: 'Borrow', count: 7, color: C.cyan },
    { name: 'Computer', count: 5, color: C.violet },
    { name: 'Study', count: 9, color: C.amber },
    { name: 'Event', count: 3, color: C.pink },
  ];
  const [borrow, computer, study, event] = cats;
  const total = cats.reduce((sum, cat) => sum + cat.count, 0);
  const sorted = [study, borrow, computer, event];
  const cut = 2;

  const cx = P ? 0 : -1.2;
  const pillPosition = [cx, P ? 3.3 : 1.85, 0];
  const cardPosition = P ? [0, -6.02, 0] : [4.65, -0.35, 0];
  const x0 = P ? -1.88 : -4.2;
  const step = P ? 0.518 : 0.62;
  const xAt = n => x0 + n * step;
  const rowY = P ? [1.45, -0.25, -1.95, -3.65] : [0.9, 0, -0.9, -1.8];
  const barHeight = P ? 0.72 : 0.50;
  const copyY = rowY[0] - barHeight - (P ? 0.24 : 0.16);
  const axisY = P ? -4.45 : -2.28;
  const topY = rowY[0] + barHeight / 2 + 0.18;
  const tickLabelY = axisY - (P ? 0.30 : 0.28);
  const labelGap = P ? 0.47 : 0.26;
  const countGap = P ? 0.22 : 0.28;
  const cardRowHeight = P ? 0.34 : 0.39;
  const cardPadding = 0.14;

  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2, z = 0) =>
    new M.Line({ start: [x1, y1, z], end: [x2, y2, z], color, strokeWidth });
  const fadeIn = (object, runTime = 0.25) => new M.FadeIn(object, { runTime });
  const fadeOut = (object, runTime = 0.25) => new M.FadeOut(object, { runTime });
  const lag = (animations, runTime, lagRatio = 0.12) =>
    new M.LaggedStart(animations, { lagRatio, runTime });

  let activePill = null;
  let activeCard = [];

  function hideOverlay(object) {
    object.opacity = 0;
    for (const part of object.submobjects || []) hideOverlay(part);
  }

  function removeOverlay(object) {
    hideOverlay(object);
    sc.remove(object);
  }

  function say(text, color = C.cyan) {
    if (activePill) removeOverlay(activePill);
    activePill = pill(text, color, P ? 18 : 17);
    activePill.moveTo(pillPosition);
    return fadeIn(activePill, 0.16);
  }

  function clearCard() {
    activeCard.forEach(removeOverlay);
    activeCard = [];
  }

  function cardBorder(width, height, y, color) {
    const border = new M.RoundedRectangle({
      width, height, cornerRadius: 0.16, color, strokeWidth: 2,
    });
    border.setFill(C.card, 0.95);
    border.moveTo([cardPosition[0], y, 0]);
    return border;
  }

  function card(lines, color = C.cyan) {
    clearCard();
    const texts = lines.map(entry => {
      const [text, ink] = Array.isArray(entry) ? entry : [entry, C.ink];
      return T(text, 19, ink, true);
    });
    const width = Math.max(...texts.map(text => text.getWidth())) + 0.54;
    const height = texts.length * cardRowHeight + 2 * cardPadding;
    const border = cardBorder(width, height, cardPosition[1], color);
    const left = cardPosition[0] - width / 2 + 0.27;
    const top = cardPosition[1] + (texts.length - 1) * cardRowHeight / 2;
    texts.forEach((text, index) => {
      text.moveTo([left + text.getWidth() / 2, top - index * cardRowHeight, 0]);
    });
    const group = new M.VGroup(border, ...texts);
    activeCard.push(group);
    return fadeIn(group, 0.18);
  }

  function outline(x, y, width, height, color) {
    const box = new M.RoundedRectangle({
      width, height, cornerRadius: 0.12, color, strokeWidth: 2,
    });
    box.setFill(C.card, 0);
    box.moveTo([x, y, 0]);
    return box;
  }

  function glow(point, color) {
    const halo = new M.Dot({ point, radius: P ? 0.21 : 0.23, color });
    halo.setFill(color, 0.22);
    const dot = new M.Dot({ point, radius: P ? 0.115 : 0.125, color });
    dot.setFill(color, 1);
    return new M.VGroup(halo, dot);
  }

  function makeLabel(cat, row) {
    const text = T(cat.name, P ? 18 : 21, cat.color);
    text.moveTo([x0 - labelGap - text.getWidth() / 2, rowY[row], 0]);
    return text;
  }

  function makeCount(cat, row) {
    const text = T(String(cat.count), P ? 20 : 21, cat.color, true);
    text.moveTo([xAt(cat.count) + countGap + text.getWidth() / 2, rowY[row], 0]);
    return text;
  }

  function barBetween(left, right, y, height, color, opacity = 0.84, strokeWidth = 2) {
    const bar = new M.Rectangle({ width: (right - left) * step, height, color, strokeWidth });
    bar.setFill(color, opacity);
    bar.moveTo([xAt((left + right) / 2), y, 0]);
    return bar;
  }

  function makeBar(cat, row, start = 0) {
    return barBetween(start, cat.count, rowY[row], barHeight, cat.color);
  }

  function makeTick(value, color = C.muted, emphasized = false) {
    const x = xAt(value);
    const size = P && value !== 0 && !emphasized ? 16 : 18;
    const text = T(String(value), size, color, true);
    text.moveTo([x, tickLabelY, 0]);
    return new M.VGroup(
      line(x, axisY - 0.07, x, axisY + 0.07, color),
      text,
    );
  }

  const gridAt = n => line(xAt(n), axisY, xAt(n), topY, C.line, 1, -0.04);
  const startAxis = (n, color) => line(xAt(n), axisY, xAt(n), topY, color, 2.5);
  const leftAxisParts = () => [
    line(xAt(0), axisY, xAt(cut), axisY, C.muted, 3),
    startAxis(0, C.muted),
    makeTick(0, C.green),
    makeTick(1),
  ];

  function pulse(object, color) {
    return new M.Flash(object, {
      color, flashRadius: P ? 0.15 : 0.17, lineLength: 0.08,
      numLines: 8, lineWidth: 2, runTime: 0.4,
    });
  }

  // 0–3: Set the scene, then represent each visitor with one dot.
  const libraryWidth = P ? 5.9 : 5.4;
  const wallTop = 0.75;
  const wallBottom = P ? -4.8 : -2.15;
  const roofTop = P ? 1.85 : 1.28;
  const wall = new M.Rectangle({
    width: libraryWidth, height: wallTop - wallBottom, color: C.line, strokeWidth: 2,
  });
  wall.setFill(C.card, 0.55);
  wall.moveTo([cx, (wallTop + wallBottom) / 2, 0]);
  const eaveLeft = cx - libraryWidth / 2 - 0.25;
  const eaveRight = cx + libraryWidth / 2 + 0.25;
  const building = new M.VGroup(
    wall,
    line(eaveLeft, wallTop, cx, roofTop, C.cyan, 3),
    line(cx, roofTop, eaveRight, wallTop, C.cyan, 3),
    line(eaveLeft, wallTop, eaveRight, wallTop, C.cyan, 2.5),
    line(eaveLeft, wallBottom, eaveRight, wallBottom, C.muted, 3),
    T('TOWN LIBRARY', P ? 18 : 19, C.muted, true)
      .moveTo([cx, wallBottom - 0.38, 0]),
  );

  await until(S(0));
  await play(fadeIn(building, 0.8), say('TOWN LIBRARY · SATURDAY'));

  const mix = [
    2, 0, 1, 2, 3, 0,
    1, 2, 0, 2, 0, 1,
    0, 3, 2, 1, 2, 0,
    2, 0, 2, 3, 1, 2,
  ];
  const jitterX = [
    0.14, -0.12, 0.08, -0.15, 0.11, -0.09,
    -0.11, 0.15, -0.07, 0.12, -0.14, 0.08,
    0.09, -0.14, 0.13, -0.08, 0.12, -0.13,
    -0.10, 0.13, -0.12, 0.09, -0.11, 0.14,
  ];
  const jitterY = [
    -0.10, 0.12, -0.08, 0.11, -0.13, 0.09,
    0.13, -0.09, 0.11, -0.12, 0.08, -0.10,
    -0.11, 0.10, -0.12, 0.13, -0.08, 0.11,
    0.10, -0.13, 0.12, -0.09, 0.11, -0.10,
  ];
  const people = mix.map((_, index) => {
    const x = cx + (index % 6 - 2.5) * (P ? 0.86 : 0.78);
    const y = (P ? 0.15 : 0.32) - Math.floor(index / 6) * (P ? 1.36 : 0.68);
    const head = new M.Circle({ radius: P ? 0.12 : 0.095, color: C.ink });
    head.setFill(C.ink, 0.92);
    head.moveTo([x, y + 0.19, 0]);
    const body = new M.Arc({
      radius: P ? 0.20 : 0.17, startAngle: 0, angle: Math.PI, color: C.ink,
    });
    body.setFill(C.ink, 0.92);
    body.moveTo([x, y - 0.07, 0]);
    return new M.VGroup(head, body);
  });

  await until(S(1));
  await play(lag(people.map(person => fadeIn(person, 0.55)), 1.5, 0.07),
    say(`${total} VISITORS ARRIVE`));

  await until(S(2));
  await play(say('WHICH REASON WAS MOST COMMON?', C.amber));

  const dotsByCategory = cats.map(() => []);
  const visitors = mix.map((category, index) => {
    const col = index % 6;
    const row = Math.floor(index / 6);
    const cat = cats[category];
    const categoryDots = dotsByCategory[category];
    const point = [
      (P ? xAt(5.4) : cx) + (col - 2.5) * (P ? 0.82 : 0.96) + jitterX[index],
      rowY[row] - (P ? 0.85 : 0.44) + jitterY[index],
      0,
    ];
    const destination = [xAt(categoryDots.length + 0.5), rowY[category], 0];
    const visitor = { cat, point, destination, mark: glow(point, C.ink) };
    categoryDots.push(visitor);
    return visitor;
  });

  await until(S(3));
  await play(
    fadeOut(building, 0.48),
    lag(people.map(person => fadeOut(person, 0.40)), 0.72, 0.03),
    lag(visitors.map(visitor => fadeIn(visitor.mark, 0.58)), 1.25, 0.045),
    say('ONE DOT FOR EACH VISITOR'),
  );

  const colourGroup = category => dotsByCategory[category].map(visitor =>
    new M.Transform(visitor.mark, glow(visitor.point, visitor.cat.color), { runTime: 0.65 }));

  await until(S(4));
  await play(...colourGroup(0), say('BORROW A BOOK · LIGHT BLUE', borrow.color));
  await until(S(5));
  await play(...colourGroup(1), say('USE A COMPUTER · PURPLE', computer.color));
  await until(S(6));
  await play(...colourGroup(2), say('STUDY · GOLD', study.color));
  await until(S(7));
  await play(...colourGroup(3), say('EVENT · PINK', event.color));

  await until(S(8));
  await play(say('MIXED TOGETHER: HARD TO COMPARE', C.muted));

  // 9–16: Sort two rows in each beat, then reveal each count on cue.
  const labels = cats.map(makeLabel);
  const counts = cats.map(makeCount);
  const guides = cats.map((cat, row) => {
    // Offset the guide below the glow so it cannot show through the halo.
    const y = rowY[row] - barHeight / 2 - 0.08;
    return line(x0, y, xAt(cat.count), y, C.line, 1.5, -0.04);
  });

  class SortDot extends M.Animation {
    constructor(visitor) {
      super(visitor.mark, { duration: 0.62 });
      this.from = visitor.point;
      this.to = visitor.destination;
    }

    interpolate(alpha) {
      const t = Math.max(0, Math.min(1, alpha));
      this.mobject.moveTo(this.from.map((value, i) => value + (this.to[i] - value) * t));
    }
  }

  function sortRows(rows, beat) {
    const duration = Math.max(0.2, Math.min(1.2, E(beat) - S(beat) - 0.08));
    return lag(
      rows.flatMap(row => dotsByCategory[row].map(visitor => new SortDot(visitor))),
      duration, 0.07,
    );
  }

  await until(S(9));
  await play(
    lag(labels.map(label => fadeIn(label)), 0.55),
    sortRows([0, 1], 9),
    say('SORT INTO ROWS BY COLOUR'),
  );

  await until(S(10));
  await play(sortRows([2, 3], 10), say('ONE ROW FOR EACH REASON'));

  await until(S(11));
  await play(
    ...guides.map(guide => fadeIn(guide)),
    say('COUNT EACH ROW, DOT BY DOT', C.amber),
  );

  const countRows = cats.map(cat => T(`${cat.name.padEnd(8)} · ${cat.count}`, 19, cat.color, true));
  const countCardWidth = Math.max(...countRows.map(text => text.getWidth())) + 0.54;
  const countCardTop = cardPosition[1] + cats.length * cardRowHeight / 2 + cardPadding;
  const countCardLeft = cardPosition[0] - countCardWidth / 2 + 0.27;
  countRows.forEach((text, index) => {
    text.moveTo([
      countCardLeft + text.getWidth() / 2,
      countCardTop - cardPadding - (index + 0.5) * cardRowHeight,
      0,
    ]);
  });

  let countBorder = null;
  function revealCount(category, beat) {
    const cat = cats[category];
    const duration = Math.max(0.2, Math.min(0.72, E(beat) - S(beat) - 0.08));
    const height = (category + 1) * cardRowHeight + 2 * cardPadding;
    const nextBorder = cardBorder(countCardWidth, height, countCardTop - height / 2, C.amber);
    let borderAnimation;
    if (countBorder) {
      borderAnimation = new M.Transform(countBorder, nextBorder, { runTime: 0.18 });
    } else {
      countBorder = nextBorder;
      activeCard.push(countBorder);
      borderAnimation = fadeIn(countBorder, 0.18);
    }

    const row = countRows[category];
    activeCard.push(row);
    return [
      lag(dotsByCategory[category].map(visitor => pulse(visitor.mark, cat.color)),
        duration, 0.30),
      fadeIn(counts[category], 0.20),
      lag([borderAnimation, fadeIn(row, 0.18)], 0.36, 1),
      say(`${cat.name.toUpperCase()} · ${cat.count}`, cat.color),
    ];
  }

  await until(S(12));
  await play(...revealCount(0, 12));
  await until(S(13));
  await play(...revealCount(1, 13));
  await until(S(14));
  await play(...revealCount(2, 14));
  await until(S(15));
  await play(...revealCount(3, 15));

  await until(S(16));
  await play(
    card([[`${cats.map(cat => cat.count).join(' + ')} = ${total}`, C.green]], C.green),
    say(`TOTAL = ${total} VISITORS`, C.green),
  );

  // 17–24: Name the categories, counts and scale.
  const widestLabel = Math.max(...labels.map(label => label.getWidth()));
  const categoriesBox = outline(
    x0 - labelGap - widestLabel / 2, (rowY[0] + rowY[3]) / 2,
    widestLabel + 0.28, rowY[0] - rowY[3] + 0.58, C.cyan,
  );
  const studyLabelBox = outline(
    x0 - labelGap - labels[2].getWidth() / 2, rowY[2],
    labels[2].getWidth() + 0.26, 0.55, study.color,
  );
  const studyCountBox = outline(
    xAt(study.count) + countGap + counts[2].getWidth() / 2, rowY[2],
    0.50, 0.55, study.color,
  );

  await until(S(17));
  await play(
    new M.Create(categoriesBox, { runTime: 0.55 }),
    card([['Category', C.cyan], 'a named group']),
    say('CATEGORY = ONE NAMED GROUP'),
  );

  await until(S(18));
  await play(fadeOut(categoriesBox), new M.Create(studyLabelBox, { runTime: 0.5 }),
    say('STUDY = ONE CATEGORY', study.color));

  await until(S(19));
  await play(fadeOut(studyLabelBox), new M.Create(studyCountBox, { runTime: 0.5 }),
    card([['Study', study.color], `${study.count} visitors`], study.color),
    say(`${study.count} VISITORS CAME TO STUDY`, study.color));

  await until(S(20));
  await play(fadeOut(studyCountBox),
    card([['Category · Study', study.color], [`Count    · ${study.count}`, C.green]], C.green),
    say('COUNT = HOW MANY IN A GROUP', C.green));

  const leftParts = leftAxisParts();
  const rightAxis = line(xAt(cut), axisY, xAt(10), axisY, C.muted, 3);
  const tick2 = makeTick(cut);
  const grid1 = gridAt(1);
  const grid2 = gridAt(cut);
  const rightTicks = Array.from({ length: 8 }, (_, index) => makeTick(index + 3));
  const rightGrids = Array.from({ length: 8 }, (_, index) => gridAt(index + 3));

  const reasonTitle = T('Reason for visiting', 18, C.muted);
  const titleLeft = Math.max(-FW / 2 + 0.26, x0 - labelGap - widestLabel);
  reasonTitle.moveTo([titleLeft + reasonTitle.getWidth() / 2, topY + 0.25, 0]);

  const unit = T('visitors', P ? 16 : 17, C.muted)
    .moveTo([xAt(10) - 0.37, axisY - (P ? 0.61 : 0.60), 0]);

  await until(S(21));
  await play(
    ...leftParts.map(part => fadeIn(part, 0.45)),
    new M.Create(rightAxis, { runTime: 0.55 }),
    lag([tick2, ...rightTicks].map(tick => fadeIn(tick)), 0.72, 0.13),
    fadeIn(reasonTitle),
    fadeIn(unit),
    card([['Scale starts at 0', C.cyan], 'like a ruler']),
    say('A RULER STARTING AT ZERO'),
  );

  const stepMark = line(xAt(0), axisY - 0.08, xAt(1), axisY - 0.08, C.amber, 4);

  await until(S(22));
  await play(
    ...[grid1, grid2, ...rightGrids].map(grid => fadeIn(grid)),
    new M.Create(stepMark, { runTime: 0.55 }),
    card([['1 step = 1 visitor', C.amber]], C.amber),
    say('EACH STEP = 1 VISITOR', C.amber),
  );

  await until(S(23));
  await play(
    fadeOut(stepMark),
    card([['Scale', C.cyan], 'the numbered line']),
    say('SCALE = THE NUMBERED LINE'),
  );

  const studyHighlight = outline(
    xAt(study.count / 2), rowY[2], study.count * step + 0.24, barHeight + 0.22,
    study.color,
  );

  await until(S(24));
  clearCard();
  await play(new M.Create(studyHighlight, { runTime: 0.55 }),
    say('LOOK AT THE STUDY ROW', study.color));

  // 25–33: Turn the dots into bars and sort the bars by count.
  const bars = cats.map((cat, row) => makeBar(cat, row));
  const endStudy = new M.DashedLine({
    start: [xAt(study.count), rowY[2] - barHeight / 2, 0],
    end: [xAt(study.count), axisY, 0], color: study.color,
  });

  await until(S(25));
  await play(
    fadeOut(studyHighlight),
    fadeOut(guides[2]),
    ...dotsByCategory[2].map(visitor => fadeOut(visitor.mark, 0.68)),
    new M.Create(bars[2], { runTime: 1.15 }),
    new M.Create(endStudy, { runTime: 0.85 }),
    card([['Study bar', study.color], `0 to ${study.count}`], study.color),
    say(`${study.count} DOTS BECOME ONE BAR`, study.color),
  );

  const otherRows = [0, 1, 3];

  await until(S(26));
  await play(
    fadeOut(endStudy),
    lag(otherRows.map(row => lag([
      fadeOut(guides[row]),
      ...dotsByCategory[row].map(visitor => fadeOut(visitor.mark, 0.58)),
      new M.Create(bars[row], { runTime: 0.82 }),
    ], 0.82, 0)), 1.48, 0.44),
    card(cats.map(cat => [`${cat.name.padEnd(8)} · 0 to ${cat.count}`, cat.color])),
    say('EACH BAR ENDS AT ITS COUNT'),
  );

  await until(S(27));
  await play(say('BAR LENGTH = COUNT', C.amber));

  await until(S(28));
  await play(
    card([['Bar chart', C.green], ['length = count', C.amber]], C.green),
    say('THIS IS A BAR CHART', C.green),
  );

  await until(S(29));
  await play(
    card([['Longest to shortest', C.amber], sorted.map(cat => cat.count).join(' > ')], C.amber),
    say('ORDER FROM LONGEST TO SHORTEST', C.amber),
  );

  const movedBars = [makeBar(borrow, 1), makeBar(computer, 2)];
  const movedLabels = [makeLabel(borrow, 1), makeLabel(computer, 2)];
  const movedCounts = [makeCount(borrow, 1), makeCount(computer, 2)];

  await until(S(30));
  await play(
    lag([
      lag([0, 1].flatMap(row => [
        fadeOut(bars[row]), fadeOut(labels[row]), fadeOut(counts[row]),
      ]), 0.25, 0),
      lag([
        new M.Transform(bars[2], makeBar(study, 0), { runTime: 0.70 }),
        new M.Transform(labels[2], makeLabel(study, 0), { runTime: 0.70 }),
        new M.Transform(counts[2], makeCount(study, 0), { runTime: 0.70 }),
      ], 0.70, 0),
      lag([...movedBars, ...movedLabels, ...movedCounts].map(item => fadeIn(item)), 0.25, 0),
    ], 1.20, 1),
    card(sorted.map(cat => [`${cat.name.padEnd(8)} · ${cat.count}`, cat.color]), C.amber),
    say('STUDY TOP · EVENT BOTTOM', C.amber),
  );

  await until(S(31));
  await play(pulse(counts[2], study.color), say(`STUDY WAS MOST COMMON (${study.count})`, study.color));

  await until(S(32));
  await play(say('COMPARE LENGTHS AT A GLANCE'));

  await until(S(33));
  await play(
    card([['Bar chart', C.green], 'compare counts'], C.green),
    say('COMPARE COUNTS BY CATEGORY', C.green),
  );

  // 34–39: Compare Study and Event on the zero-based scale.
  await until(S(34));
  await play(card([['Common trap', C.pink], 'cutting off zero'], C.pink),
    say('WATCH OUT FOR THE SCALE', C.pink));

  const realRatio = study.count / event.count;
  const studySpan = study.count - cut;
  const eventSpan = event.count - cut;
  const shownRatio = studySpan / eventSpan;

  function eventCopies(start, length, number) {
    return Array.from({ length: number }, (_, index) => {
      const from = start + length * index;
      const to = from + length;
      const block = barBetween(from + 0.025, to - 0.025, copyY, barHeight * 0.68,
        event.color, 0.72);
      const label = T(String(index + 1), P ? 18 : 17, event.color, true)
        .moveTo([xAt((from + to) / 2), copyY - barHeight * 0.34 - (P ? 0.24 : 0.14), 0]);
      return new M.VGroup(block, label);
    });
  }

  await until(S(35));
  await play(
    ...[...movedBars, ...movedLabels, ...movedCounts].map(item => fadeOut(item)),
    card([[`Study · ${study.count}`, study.color], [`Event · ${event.count}`, event.color]], C.amber),
    say(`STUDY ${study.count} · EVENT ${event.count}`, C.amber),
  );

  const fullCopies = eventCopies(0, event.count, realRatio);
  const matchEnd = new M.DashedLine({
    start: [xAt(study.count), rowY[0] - barHeight / 2, 0],
    end: [xAt(study.count), copyY - barHeight * 0.34, 0], color: study.color,
  });

  await until(S(36));
  await play(
    lag(fullCopies.map(copy => fadeIn(copy, 0.5)), 1.4, 0.65),
    new M.Create(matchEnd, { runTime: 1.0 }),
    say(`${realRatio} EVENT BARS = 1 STUDY BAR`, event.color),
  );

  await until(S(37));
  await play(
    card([['Real comparison', C.ink], [`${study.count} ÷ ${event.count} = ${realRatio}×`, C.green]], C.green),
    say(`STUDY IS ${realRatio}× AS LARGE`, C.green),
  );

  const cutLine = new M.DashedLine({
    start: [xAt(cut), axisY, 0], end: [xAt(cut), topY, 0], color: C.pink,
  });
  const cutShade = new M.Rectangle({
    width: cut * step, height: topY - axisY, color: C.pink, strokeWidth: 0,
  });
  cutShade.setFill(C.pink, 0.12);
  cutShade.moveTo([xAt(cut / 2), (axisY + topY) / 2, -0.03]);

  await until(S(38));
  await play(
    ...fullCopies.map(copy => fadeOut(copy)),
    fadeOut(matchEnd),
    fadeIn(cutShade),
    new M.Create(cutLine, { runTime: 0.55 }),
    say('CUTTING OFF THE SCALE', C.pink),
  );

  await until(S(39));
  await play(say('SAVE SPACE OR MAKE A GAP LOOK BIGGER', C.pink));

  // 40–47: Keep the cut pieces faint until the narration removes them.
  const croppedAxis = startAxis(cut, C.pink);
  const warningTick = makeTick(cut, C.pink, true);
  const cutPieces = [
    barBetween(0, cut, rowY[0], barHeight, study.color, 0.22, 0),
    barBetween(0, cut, rowY[3], barHeight, event.color, 0.22, 0),
  ];

  await until(S(40));
  sc.remove(tick2);
  sc.remove(grid2);
  await play(
    ...[...leftParts, grid1, cutLine].map(item => fadeOut(item)),
    fadeOut(cutShade, 0.40),
    new M.Transform(bars[2], makeBar(study, 0, cut), { runTime: 0.45 }),
    new M.Transform(bars[3], makeBar(event, 3, cut), { runTime: 0.45 }),
    ...cutPieces.map(piece => fadeIn(piece, 0.45)),
    new M.Create(croppedAxis, { runTime: 0.45 }),
    fadeIn(warningTick),
    card([[`Scale starts at ${cut}`, C.pink], '0 and 1 cut off'], C.pink),
    say(`SCALE STARTS AT ${cut}`, C.pink),
  );

  await until(S(41));
  await play(
    pulse(counts[2], study.color), pulse(counts[3], event.color),
    say(`COUNTS ARE STILL ${study.count} AND ${event.count}`, C.amber),
  );

  await until(S(42));
  await play(
    ...cutPieces.map(piece => fadeOut(piece, 0.65)),
    say(`BOTH BARS LOSE ${cut} STEPS`, C.pink),
  );

  const studySpanY = rowY[0] - barHeight / 2 - (P ? 0.32 : 0.23);
  const eventSpanY = rowY[3] + barHeight / 2 + (P ? 0.32 : 0.23);
  const spanLine = (end, y, color) => line(xAt(cut), y, xAt(end), y, color, 3);
  const studyMeasure = spanLine(study.count, studySpanY, study.color);
  const eventMeasure = spanLine(event.count, eventSpanY, event.color);

  await until(S(43));
  await play(
    new M.Create(studyMeasure, { runTime: 0.65 }),
    card([['Study bar', study.color], `${study.count} − ${cut} = ${studySpan} steps`], study.color),
    say(`STUDY BAR · ${studySpan} STEPS LONG`, study.color),
  );

  await until(S(44));
  await play(
    new M.Create(eventMeasure, { runTime: 0.55 }),
    card([[`Study · ${studySpan} steps`, study.color], [`Event · ${eventSpan} step`, event.color]], event.color),
    say(`EVENT BAR · ${eventSpan} STEP LONG`, event.color),
  );

  const shortCopies = eventCopies(cut, eventSpan, shownRatio);

  await until(S(45));
  await play(
    fadeOut(studyMeasure), fadeOut(eventMeasure),
    lag(shortCopies.map(copy => fadeIn(copy, 0.5)), 1.6, 0.38),
    say(`${shownRatio} SHORT EVENT BARS = 1 STUDY BAR`, event.color),
  );

  await until(S(46));
  await play(
    card([['Looks like', event.color], [`${studySpan} ÷ ${eventSpan} = ${shownRatio}×`, event.color]], event.color),
    say(`LOOKS ${shownRatio}× AS LONG`, event.color),
  );

  await until(S(47));
  await play(
    card([
      [`Looks · ${studySpan} ÷ ${eventSpan} = ${shownRatio}×`, event.color],
      [`Real  · ${study.count} ÷ ${event.count} = ${realRatio}×`, C.green],
    ], C.amber),
    say(`REAL GROUP IS STILL ${realRatio}× AS LARGE`, C.green),
  );

  // 48–50: Restore the zero baseline and the full sorted chart.
  const restoredLeft = [...leftAxisParts(), makeTick(cut)];
  const barClearance = barHeight / 2 + 0.02;
  const gridBreaks = [
    axisY,
    ...rowY.slice().reverse().flatMap(y => [y - barClearance, y + barClearance]),
    topY,
  ];
  const restoredGrids = [1, cut].map(n => {
    const x = xAt(n);
    // Leave a gap under each translucent bar so even a faint line cannot stripe it.
    const segments = [];
    for (let i = 0; i < gridBreaks.length; i += 2) {
      segments.push(line(x, gridBreaks[i], x, gridBreaks[i + 1], C.line, 1, -0.04));
    }
    return new M.VGroup(...segments);
  });
  const middleGridSegments = [1, cut].flatMap(n =>
    [rowY[1], rowY[2]].map(y =>
      line(xAt(n), y - barClearance, xAt(n), y + barClearance, C.line, 1, -0.04)));

  await until(S(48));
  sc.remove(warningTick);
  await play(
    ...shortCopies.map(copy => fadeOut(copy)),
    fadeOut(croppedAxis),
    ...[...restoredLeft, ...restoredGrids, ...middleGridSegments].map(item => fadeIn(item, 0.5)),
    new M.Transform(bars[2], makeBar(study, 0), { runTime: 1.15 }),
    new M.Transform(bars[3], makeBar(event, 3), { runTime: 1.15 }),
    card([['Scale back at 0', C.green], `${study.count} ÷ ${event.count} = ${realRatio}×`], C.green),
    say('BACK TO ZERO', C.green),
  );

  const zeroRing = new M.Circle({ radius: 0.19, color: C.green, strokeWidth: 3 });
  zeroRing.setFill(C.card, 0);
  zeroRing.moveTo([xAt(0), tickLabelY, 0]);

  await until(S(49));
  await play(new M.Create(zeroRing, { runTime: 0.65 }), say('CHECK THAT THE SCALE STARTS AT ZERO', C.green));

  await until(S(50));
  await play(
    fadeOut(zeroRing),
    ...middleGridSegments.map(segment => fadeOut(segment, 0.25)),
    ...[borrow, computer].flatMap((cat, index) => [
      fadeIn(makeBar(cat, index + 1), 0.6),
      fadeIn(makeLabel(cat, index + 1), 0.6),
      fadeIn(makeCount(cat, index + 1), 0.6),
    ]),
    card([['Bar chart', C.cyan], ['length = count', C.amber], ['start at 0', C.green]]),
    say('COMPARE GROUPS AT A GLANCE'),
  );
}

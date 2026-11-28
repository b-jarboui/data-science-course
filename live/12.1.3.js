// 12.1.3 Prediction time. Beat i follows sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, LINE_Y } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.45, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.55, 0] : [4.3, -0.3, 0];
  const cardX = P ? 0 : 4.3;
  const cardY = P ? -3.75 : -0.45;
  const cardWidth = P ? 6.65 : 4.35;
  const cardHeight = P ? 3.35 : 3.25;
  const say = (text, color = C.cyan) => showA(text, color, PILL);

  function textAt(text, x, y, size = 21, color = C.ink, width = FW - 1.2, mono = false) {
    const t = T(text, size, color, mono);
    const actualWidth = t.getWidth();
    if (actualWidth > width) t.scale(width / actualWidth);
    t.moveTo([x, y, 0]);
    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  }

  function dot(x, y, color, radius = 0.075) {
    const point = new M.Dot({ point: [x, y, 0], radius, color });
    point.setFill(color, 1);
    return point;
  }

  function panel(x, y, width, height, color = C.line) {
    const rect = new M.RoundedRectangle({ width, height, cornerRadius: 0.15, color, strokeWidth: 2 });
    rect.setFill(C.card, 0.95);
    rect.moveTo([x, y, 0]);
    return rect;
  }

  const visible = new Map();
  const fadeIn = m => new M.FadeIn(m, { runTime: 0.3 });
  const fadeOut = m => new M.FadeOut(m, { runTime: 0.3 });
  function replace(name, next = []) {
    const previous = visible.get(name) || [];
    visible.set(name, next);
    return [...previous.map(fadeOut), ...next.map(fadeIn)];
  }

  function formula(rows = []) {
    if (!rows.length) return replace('formula');
    const rowHeight = P ? (rows.length === 2 ? 0.72 : 0.66) : 0.38;
    const width = P ? 6.65 : 4.35;
    const height = P ? Math.max(2.45, rows.length * rowHeight + 0.82) : rows.length * rowHeight + 0.32;
    const [x, y] = BOXP;
    const labels = rows.map(([text, color], i) =>
      textAt(text, x, y + ((rows.length - 1) / 2 - i) * rowHeight, P ? 23 : 21, color, width - 0.5, true));
    return replace('formula', [new M.VGroup(
      panel(x, y, width, height, C.cyan), ...labels
    )]);
  }

  function phoneNote(heading, body, color = C.cyan, sub = '') {
    if (!P || !heading) return replace('phoneNote');
    const y = -3.55;
    const parts = [
      panel(0, y, 6.65, 2.45, color),
      textAt(heading, 0, y + (sub ? 0.66 : 0.44), 22, color, 6.1, true),
      textAt(body, 0, y + (sub ? 0.02 : -0.36), 22, C.ink, 6.1)
    ];
    if (sub) parts.push(textAt(sub, 0, y - 0.62, 20, C.muted, 6.1));
    return replace('phoneNote', [new M.VGroup(...parts)]);
  }

  function tiles(rows, y = -0.25) {
    if (P && rows.length === 3) {
      const width = 6.55, height = 1.85, y0 = 1.35, step = 2.45;
      return rows.map(([top, bottom], i) => {
        const ty = y0 - i * step;
        return new M.VGroup(
          panel(0, ty, width, height),
          textAt(top, 0, ty + 0.34, 25, C.ink, width - 0.5),
          textAt(bottom, 0, ty - 0.34, 22, C.cyan, width - 0.5, true)
        );
      });
    }
    if (P && rows.length === 2) {
      const width = 6.55, height = 1.75, y0 = -1.65, step = 2.15;
      return rows.map(([top, bottom], i) => {
        const ty = y0 - i * step;
        return new M.VGroup(
          panel(0, ty, width, height),
          textAt(top, 0, ty + 0.34, 25, C.ink, width - 0.5),
          textAt(bottom, 0, ty - 0.34, 21, C.cyan, width - 0.5, true)
        );
      });
    }
    if (P && rows.length === 1) {
      const width = 6.65, height = 2.85, ty = 0.3;
      const [top, bottom] = rows[0];
      return [new M.VGroup(
        panel(0, ty, width, height),
        textAt(top, 0, ty + 0.44, 32, C.ink, width - 0.5),
        textAt(bottom, 0, ty - 0.44, 28, C.cyan, width - 0.5, true)
      )];
    }
    const gap = 2.65;
    const width = gap - 0.2;
    return rows.map(([top, bottom], i) => {
      const x = (i - (rows.length - 1) / 2) * gap;
      return new M.VGroup(
        panel(x, y, width, 1.05),
        textAt(top, x, y + 0.2, 21, C.ink, width - 0.22),
        textAt(bottom, x, y - 0.2, 19, C.cyan, width - 0.22, true)
      );
    });
  }

  const Y = P ? 0.75 : LINE_Y;
  const span = P ? 6.85 : 7.0;
  const xDay = day => CX - span / 2 + (day + 59) * span / 90;
  const cut = xDay(0);
  const leftCenter = (xDay(-59) + cut) / 2;
  const rightCenter = (cut + xDay(31)) / 2;

  function axis() {
    const months = [[-59, 'Jan'], [-28, 'Feb'], [0, 'Mar'], [31, 'Apr']];
    const ticks = months.flatMap(([day, month]) => {
      const x = xDay(day);
      return [
        line(x, Y - 0.07, x, Y + 0.07),
        textAt(month, x, Y - 0.32, 19, C.ink, 0.8, true)
      ];
    });
    return new M.VGroup(line(xDay(-59), Y, xDay(31), Y), ...ticks);
  }

  function cutoff(label = '1 MAR') {
    return new M.VGroup(
      line(cut, Y - 0.09, cut, Y + (P ? 0.94 : 0.78), C.amber, 4),
      textAt(label, cut, Y + (P ? 1.22 : 1.04), 19, C.amber, P ? 3.65 : 3.4, true)
    );
  }

  function side(known) {
    const label = known ? 'ALREADY HAPPENED' : 'STILL THE FUTURE';
    const color = known ? C.cyan : C.muted;
    const center = known ? leftCenter : rightCenter;
    const width = known ? cut - xDay(-59) : xDay(31) - cut;
    return textAt(label, center, Y + 0.43, 19, color, width - 0.25, true);
  }

  function windowMark(start, end, label, color, y = Y - 0.78) {
    const a = xDay(start), b = xDay(end);
    return new M.VGroup(
      line(a, y, b, y, color, 3),
      line(a, y, a, y + 0.13, color),
      line(b, y, b, y + 0.13, color),
      textAt(label, (a + b) / 2, y - 0.29, 19, color, P ? 3.4 : 3.3, true)
    );
  }

  function eventKey() {
    // The source gives totals for the past window, without dates for its individual events.
    if (P) {
      const y = -3.55;
      return new M.VGroup(
        dot(xDay(-24), Y, C.cyan, 0.085), dot(xDay(-9), Y, C.cyan, 0.085), dot(xDay(-16), Y, C.violet, 0.085),
        panel(0, y, 6.65, 2.45, C.line),
        textAt('BEA’S ACTIVITY', 0, y + 0.68, 21, C.muted, 6.1, true),
        dot(-1.65, y + 0.04, C.cyan, 0.095),
        textAt('Music played', 0.2, y + 0.04, 23, C.cyan, 3.4),
        dot(-1.65, y - 0.6, C.violet, 0.095),
        textAt('Help request', 0.2, y - 0.6, 23, C.violet, 3.4)
      );
    }
    const y = Y + 0.48;
    return new M.VGroup(
      dot(xDay(-24), Y, C.cyan), dot(xDay(-9), Y, C.cyan), dot(xDay(-16), Y, C.violet),
      dot(CX - 2.75, y, C.cyan),
      textAt('Music played', CX - 1.66, y, 21, C.cyan, 1.9),
      dot(CX + 0.08, y, C.violet),
      textAt('Help request', CX + 1.2, y, 21, C.violet, 1.95)
    );
  }

  function laterEvent(day, label, color) {
    const x = xDay(day);
    if (P && label.includes(' · ')) {
      const [top, bottom] = label.split(' · ');
      return new M.VGroup(
        line(x, Y + 0.03, x, Y + 0.3, color),
        dot(x, Y + 0.3, color),
        textAt(top, 2.82, Y + 0.64, 19, color, 1.85),
        textAt(bottom, 2.82, Y + 0.28, 19, color, 1.85)
      );
    }
    return new M.VGroup(
      line(x, Y + 0.03, x, Y + 0.33, color),
      dot(x, Y + 0.33, color),
      textAt(label, rightCenter + 0.2, Y + 0.56, 19, color, 2.35)
    );
  }

  const rowOffsets = P ? [0.46, -0.04, -0.54, -1.2] : [0.44, -0.04, -0.52, -1.15];
  const featureNames = ['Music played', 'Help requests', 'Membership', 'Cancelled'];
  function cardBase() {
    return new M.VGroup(
      panel(cardX, cardY, cardWidth, cardHeight, C.line),
      textAt('BEA · 1 MAR', cardX, cardY + (P ? 1.32 : 1.27), 22, C.ink, cardWidth - 0.45, true),
      line(cardX - cardWidth / 2 + 0.24, cardY - (P ? 0.86 : 0.82),
        cardX + cardWidth / 2 - 0.24, cardY - (P ? 0.86 : 0.82), C.muted)
    );
  }

  function cardRow(i, value, color = C.cyan) {
    const y = cardY + rowOffsets[i];
    return new M.VGroup(
      textAt(featureNames[i], cardX - cardWidth * 0.235, y, 21, C.ink, cardWidth * 0.47),
      textAt(value, cardX + cardWidth * 0.265, y, 22, color, cardWidth * 0.4, true)
    );
  }

  function clearCard() {
    return [
      ...replace('card'), ...replace('cardHeading'),
      ...rowOffsets.flatMap((_, i) => replace(`row${i}`))
    ];
  }

  const renewals = [
    ['Ali', 'Jan', false], ['Bea', 'Jan', false], ['Chen', 'Jan', false],
    ['Ali', 'Feb', false], ['Bea', 'Feb', false], ['Chen', 'Feb', false], ['Farah', 'Feb', true],
    ['Ali', 'Mar', false], ['Bea', 'Mar', true], ['Chen', 'Mar', false], ['Dina', 'Mar', false],
    ['Ali', 'Apr', false], ['Chen', 'Apr', true], ['Dina', 'Apr', false],
    ['Ali', 'May', false], ['Dina', 'May', false], ['Eli', 'May', false],
    ['Ali', 'Jun', false], ['Dina', 'Jun', false], ['Eli', 'Jun', true]
  ];

  function renewalGrid() {
    const columns = P ? 4 : 5;
    const dx = P ? 1.73 : 2.34;
    const dy = P ? 1.12 : 0.82;
    const y0 = P ? 1.55 : 0.85;
    const entries = renewals.map(([name, month, cancelled], i) => {
      const x = (i % columns - (columns - 1) / 2) * dx;
      const y = y0 - Math.floor(i / columns) * dy;
      return new M.VGroup(
        textAt(`${name} ${month}`, x, y + 0.23, 19, C.ink, dx - 0.12, true),
        line(x - 0.54, y - 0.13, x + 0.54, y - 0.13),
        line(x, y - 0.26, x, y + 0.02, C.amber, 3),
        dot(x + 0.35, y - 0.13, cancelled ? C.pink : C.cyan, 0.058)
      );
    });
    const y = P ? -4.15 : -2.65;
    return new M.VGroup(...entries,
      dot(-2.12, y, C.cyan),
      textAt('Stayed', -1.47, y, 19, C.cyan, 0.95),
      dot(-0.04, y, C.pink),
      textAt('Cancelled', 0.92, y, 19, C.pink, 1.55)
    );
  }

  function snapshot(name, month, day, hours, help, y) {
    if (P) {
      const width = 6.65, height = 2.35;
      return new M.VGroup(
        panel(0, y, width, height),
        line(1.15, y - height * 0.36, 1.15, y + height * 0.36, C.amber, 3),
        textAt(`${name} · ${month}`, -1.09, y + 0.42, 24, C.cyan, 4.0),
        textAt(`${hours} h played · ${help} ${help === 1 ? 'request' : 'requests'}`,
          -1.09, y - 0.36, 20, C.ink, 4.0, true),
        textAt('CUTOFF', 2.24, y + 0.38, 16, C.muted, 1.8, true),
        textAt(day, 2.24, y - 0.2, 24, C.amber, 1.8, true)
      );
    }
    const x = -0.25;
    const width = 9.2;
    const height = 1.36;
    const tx = x - 1.9;
    return new M.VGroup(
      panel(x, y, width, height),
      line(x + 0.8, y - height * 0.35, x + 0.8, y + height * 0.35, C.amber, 3),
      textAt(`${name} · ${month}`, tx, y + 0.32, 22, C.cyan, 4.4),
      textAt(`${hours} h played · ${help} ${help === 1 ? 'request' : 'requests'}`,
        tx, y - 0.26, 20, C.ink, 4.4, true),
      textAt(day, x + 1.89, y, 21, C.amber, 1.8, true)
    );
  }

  function comparison(cards) {
    const width = P ? 6.65 : 5.45;
    const height = P ? 2.65 : 1.52;
    return cards.map(([heading, value, color], i) => {
      const x = P ? 0 : (i ? 3.0 : -3.0);
      const y = P ? 0.0 - i * 3.2 : -0.45;
      return new M.VGroup(
        panel(x, y, width, height, color),
        textAt(heading, x, y + (P ? 0.5 : 0.38), P ? 23 : 22, color, width - 0.5, true),
        textAt(value, x, y - (P ? 0.38 : 0.26), P ? 26 : 24, C.ink, width - 0.5)
      );
    });
  }

  await until(S(0));
  await play(...say('MUSIC APP · MONTHLY PLAN'), ...replace('main', tiles([
    ['January', 'RENEWS 1 JAN'],
    ['February', 'RENEWS 1 FEB'],
    ['March', 'RENEWS 1 MAR']
  ])));

  await until(S(1));
  await play(...say('SEND A DISCOUNT ON RENEWAL DAY', C.amber),
    ...replace('detail', [textAt('Discount offer', 0, P ? -5.25 : -1.65, 25, C.amber)]));

  await until(S(2));
  await play(...say('CANCEL IN THE NEXT 30 DAYS?', C.pink),
    ...replace('detail', [textAt('Cancel or stay?', 0, P ? -5.25 : -1.65, 25, C.ink)]));

  await until(S(3));
  await play(...say('PAST EXAMPLES TEACH THE RULE'),
    ...replace('main', tiles([['Ali · Jan', 'STAYED'], ['Bea · Feb', 'STAYED'], ['Chen · Mar', 'STAYED']])),
    ...replace('detail', [textAt('Past examples → learned rule', 0, P ? -5.25 : -1.65, 24, C.cyan)]));

  await until(S(4));
  await play(...say('WHEN DOES THE MODEL GUESS?', C.amber));

  await until(S(5));
  await play(...say('BEA’S MARCH RENEWAL'),
    ...replace('main', tiles([['Bea', '1 MARCH']], Y - 0.45)), ...replace('detail'),
    ...phoneNote('MARCH RENEWAL', 'One customer · Bea', C.cyan, 'Her monthly plan renews on 1 March'));

  await until(S(6));
  await play(...say('BEA’S TIMELINE'), ...replace('main', [axis()]),
    ...phoneNote('BEA’S TIMELINE', 'January on the left · April on the right', C.cyan, 'Time runs from left to right'));

  await until(S(7));
  await play(...say('DOTS MARK BEA’S ACTIVITY'), ...phoneNote(), ...replace('key', [eventKey()]));

  await until(S(8));
  await play(...say('RENEWAL DAY · 1 MARCH', C.amber),
    ...replace('key'), ...replace('cut', [cutoff()]),
    ...phoneNote('1 MARCH · RENEWAL DAY', 'The bright line marks renewal day', C.amber, 'One fixed moment on the timeline'));

  await until(S(9));
  await play(...say('SEND A DISCOUNT?', C.amber), ...phoneNote(),
    ...replace('detail', tiles([['Send', 'DISCOUNT'], ['Skip', 'DISCOUNT']], Y - 1.45)));

  await until(S(10));
  await play(...say('MAKE THE GUESS ON 1 MARCH', C.amber),
    ...replace('detail', [textAt('8 Mar is a week later', P ? 1.85 : rightCenter, Y - 0.98, 19, C.muted, 3.2)]),
    ...phoneNote('GUESS ON 1 MARCH', 'Decide on renewal day', C.amber, 'Not a week later on 8 March'));

  await until(S(11));
  await play(...say('BEFORE THE LINE'), ...replace('detail'), ...replace('past', [side(true)]),
    ...phoneNote('LEFT OF THE LINE', 'Already happened before 1 March', C.cyan, 'We can know these facts'));

  await until(S(12));
  await play(...say('AFTER THE LINE', C.violet), ...replace('future', [side(false)]),
    ...phoneNote('RIGHT OF THE LINE', 'Still the future on 1 March', C.violet, 'Nobody knows it yet'));

  await until(S(13));
  await play(...say('USE WHAT’S TO THE LEFT'), ...replace('future'),
    ...replace('knownLine', [line(xDay(-59), Y + 0.13, xDay(-1), Y + 0.13, C.cyan, 3)]),
    ...phoneNote('MODEL RULE', 'Look only to the left of 1 March', C.cyan, 'Only past facts may be used'));

  await until(S(14));
  await play(...say('PREDICTION TIME', C.amber), ...replace('cut', [cutoff('1 MAR · GUESS HERE')]),
    ...phoneNote('PREDICTION TIME', '1 March · when the model acts for real', C.amber, 'Every feature must be known here'));

  await until(S(15));
  await play(...say('FILL IN BEA’S CARD'), ...phoneNote(), ...replace('card', [cardBase()]));

  await until(S(16));
  await play(...say('CLUES AND THE ANSWER'),
    ...replace('cardHeading', [textAt('FEATURES', cardX, cardY + (P ? 0.92 : 0.89), P ? 18 : 17, C.cyan, cardWidth - 0.45, true)]),
    ...replace('row3', [cardRow(3, '—', C.violet)]),
    ...replace('detail', [textAt('Label = the answer', CX, Y - 1.5, 21, C.violet)]));

  await until(S(17));
  await play(...say('MUSIC IN THE PREVIOUS 30 DAYS'), ...replace('past'), ...replace('knownLine'), ...replace('detail'),
    ...replace('row0', [cardRow(0, '—')]), ...replace('before', [windowMark(-30, -1, 'Previous 30 days', C.cyan)]));

  await until(S(18));
  await play(...say('30 JAN TO 28 FEB'),
    ...replace('before', [windowMark(-30, -1, '30 Jan – 28 Feb', C.cyan)]));

  await until(S(19));
  await play(...say('STOP AT THE END OF 28 FEB', C.amber),
    ...replace('stop', [dot(xDay(-1), Y - 0.78, C.amber, 0.085)]));

  await until(S(20));
  await play(...say('2 HOURS PLAYED'), ...replace('row0', [cardRow(0, '2 hours')]));

  await until(S(21));
  await play(...say('1 HELP REQUEST IN THE SAME DAYS'),
    ...replace('row1', [cardRow(1, '1')]));

  await until(S(22));
  await play(...say('3 MONTHS AS A MEMBER'), ...replace('row2', [cardRow(2, '3 months')]));

  await until(S(23));
  await play(...say('FREEZE THE VALUES ON 1 MARCH', C.amber),
    ...replace('cardHeading', [textAt('FROZEN FEATURES', cardX, cardY + (P ? 0.92 : 0.89), P ? 18 : 17, C.amber, cardWidth - 0.45, true)]));

  await until(S(24));
  await play(...say('LOOK TO THE RIGHT', C.violet), ...replace('future', [side(false)]));

  await until(S(25));
  await play(...say('11 MAR · “HOW DO I CANCEL?”', C.violet), ...replace('future'),
    ...replace('event', [laterEvent(10, '11 Mar · Help', C.violet)]));

  await until(S(26));
  await play(...say('COUNT BOTH HELP REQUESTS?', C.violet),
    ...replace('detail', [textAt('1 + 1 = 2?', CX, Y - 1.55, 23, C.violet, 4.0, true)]));

  await until(S(27));
  await play(...say('THE CARD STILL SAYS 1', C.amber),
    ...replace('detail', [textAt('11 Mar comes after 1 Mar', CX, Y - 1.55, 21, C.amber, 6.0)]));

  await until(S(28));
  await play(...say('THAT CLUE IS MISSING ON 1 MAR', C.amber),
    ...replace('detail', [textAt('Help on 11 Mar is unavailable on 1 Mar', CX, Y - 1.55, 20, C.amber, 6.3)]));

  await until(S(29));
  await play(...say('HOURS PLAYED AFTER RENEWAL?', C.violet),
    ...replace('event'), ...replace('detail'),
    ...replace('after', [windowMark(1, 30, 'Next 30 days', C.violet, Y - 1.58)]));

  await until(S(30));
  await play(...say('LESS LISTENING MIGHT SIGNAL A CANCEL', C.violet),
    ...replace('detail', [textAt('Less listening → might cancel', CX, Y - (P ? 2.38 : 2.28), 20, C.violet, 6.2)]));

  await until(S(31));
  await play(...say('THOSE DAYS HAVEN’T HAPPENED', C.amber),
    ...replace('detail', [textAt('Hours after 1 Mar: unknown on 1 Mar', CX, Y - (P ? 2.38 : 2.28), 20, C.amber, 6.2)]));

  await until(S(32));
  await play(...say('KEEP ONLY THE FROZEN CLUES'),
    ...replace('detail'), ...replace('after'),
    ...replace('afterHours', [textAt('Future hours stay off the card', CX, Y - 1.53, 21, C.cyan, 6.2)]));

  await until(S(33));
  await play(...say('USE THE FUTURE FOR THE LABEL', C.violet), ...replace('afterHours'),
    ...replace('before'), ...replace('stop'),
    ...replace('after', [windowMark(1, 30, 'Label window', C.violet)]));

  await until(S(34));
  await play(...say('12 MAR · CANCELLED 11 DAYS LATER', C.pink),
    ...replace('event', [laterEvent(11, '12 Mar · Cancelled', C.pink)]),
    ...replace('row3', [cardRow(3, 'Yes', C.pink)]));

  await until(S(35));
  await play(...say('THE SHORT VERSION'), ...clearCard(),
    ...formula([['Prediction time', C.amber], ['1 Mar · make the guess', C.ink]]));

  await until(S(36));
  await play(...say('FEATURES COME FROM BEFORE'),
    ...replace('before', [windowMark(-30, -1, 'Before 1 Mar', C.cyan)]),
    ...formula([['Features', C.cyan], ['Known before the guess', C.ink]]));

  await until(S(37));
  await play(...say('THE LABEL COMES FROM AFTER', C.violet),
    ...formula([['Features · known before', C.cyan], ['Label · happened after', C.violet]]));

  await until(S(38));
  await play(...say('DO THIS FOR EVERY CARD'), ...formula(),
    ...replace('cut'), ...replace('before'), ...replace('after'), ...replace('event'),
    ...replace('main', tiles([['Ali', '1 JAN'], ['Bea', '1 MAR'], ['Eli', '1 JUN']])));

  await until(S(39));
  await play(...say('20 RENEWALS · 20 CUTOFFS', C.amber), ...replace('main', [renewalGrid()]));

  await until(S(40));
  await play(...say('EACH CARD HAS ITS OWN WINDOW'),
    ...replace('main', [snapshot('Ali', 'December', '1 JAN', 20, 0, P ? 0.55 : 0.55),
      snapshot('Eli', 'May', '1 JUN', 6, 1, P ? -2.35 : -1.2)]));

  await until(S(41));
  await play(...say('A SNAPSHOT OF WHAT WAS KNOWN', C.amber),
    ...replace('detail', [textAt('Each card stays as it was on its renewal day', 0,
      P ? -4.45 : -2.37, 21, C.amber, P ? 6.4 : 9.0)]));

  await until(S(42));
  await play(...say('WHY DOES THE CUTOFF MATTER?', C.amber));

  await until(S(43));
  await play(...say('SAME CLUES IN OLD DATA AND REAL USE'), ...replace('detail'),
    ...replace('main', comparison([
      ['PAST RENEWAL CARD', '2 hours · 1 help request', C.cyan],
      ['ON 1 MARCH', '2 hours · 1 help request', C.cyan]
    ])));

  await until(S(44));
  await play(...say('A FUTURE CLUE CAN INFLATE A SCORE', C.violet),
    ...replace('main', comparison([
      ['OLD DATA WITH A FUTURE CLUE', '“How do I cancel?”', C.violet],
      ['PAST GUESS', 'Predict cancel · appears right', C.violet]
    ])));

  await until(S(45));
  await play(...say('ON RENEWAL DAY THE CLUE IS MISSING', C.amber),
    ...replace('main', comparison([
      ['ON 1 MARCH', '11 Mar request is missing', C.amber],
      ['REAL GUESS', 'The rule loses its clue', C.pink]
    ])));

  await until(S(46));
  await play(...say('THE LATEST TABLE CAN BE MISLEADING', C.violet),
    ...replace('main', comparison([
      ['SAVED ON 1 MARCH', 'Bea · 1 help request', C.cyan],
      ['LATEST TABLE', 'Bea · help requests', C.violet]
    ])));

  await until(S(47));
  await play(...say('THE LATEST TABLE NOW SAYS 2', C.violet),
    ...replace('main', comparison([
      ['SAVED ON 1 MARCH', 'Bea · 1 help request', C.cyan],
      ['UPDATED AFTER 1 MARCH', 'Bea · 2 help requests', C.violet]
    ])));

  await until(S(48));
  await play(...say('COULD I KNOW IT ON RENEWAL DAY?', C.amber),
    ...replace('main', comparison([
      ['1 HELP REQUEST', 'Known by 1 March', C.cyan],
      ['2 HELP REQUESTS', 'Known after 1 March', C.violet]
    ])));

  await until(S(49));
  await play(...say('NEXT · A SIMPLE SCORE TO BEAT'),
    ...replace('main', [P ? new M.VGroup(
      panel(0, -1.85, 6.65, 4.8, C.amber),
      textAt('NEXT LESSON', 0, -0.35, 21, C.muted, 6.1, true),
      textAt('Score to beat', 0, -1.15, 30, C.amber, 6.1),
      line(-2.4, -2.25, 2.4, -2.25),
      line(0, -2.55, 0, -1.95, C.amber, 4),
      textAt('A simple baseline before the model', 0, -3.25, 21, C.ink, 6.1)
    ) : new M.VGroup(
      line(-2.6, -0.8, 2.6, -0.8),
      line(0, -1.02, 0, -0.57, C.amber, 4),
      textAt('Score to beat', 0, -0.22, 24, C.amber)
    )]));

  await until(S(50));
  await play(...say('USE ONLY WHAT YOU KNOW WHEN YOU ACT', C.amber),
    ...replace('main', [axis()]), ...replace('cut', [cutoff('1 MAR · GUESS HERE')]),
    ...replace('before', [windowMark(-30, -1, 'Known before 1 Mar', C.cyan)]),
    ...formula([['Freeze the features', C.amber], ['2 hours · 1 help request', C.cyan], ['3 months as a member', C.cyan]]));
}

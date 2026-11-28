// 12.1.1 Features and labels. Beat i is narration sentence i, zero-based.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.30, 0] : [4.25, -0.3, 0];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  // Each entry is [customer, hours, help requests, cancellation day if any].
  const renewals = [
    [['Ali', 20, 0], ['Bea', 12, 0], ['Chen', 15, 0]],
    [['Ali', 18, 0], ['Bea', 6, 1], ['Chen', 10, 0], ['Farah', 1, 0, 5]],
    [['Ali', 22, 1], ['Bea', 2, 1, 12], ['Chen', 7, 1], ['Dina', 3, 0]],
    [['Ali', 19, 0], ['Chen', 3, 2, 20], ['Dina', 9, 0]],
    [['Ali', 21, 0], ['Dina', 14, 0], ['Eli', 11, 0]],
    [['Ali', 20, 0], ['Dina', 16, 0], ['Eli', 6, 1, 25]],
  ];
  const rows = renewals.flatMap((month, i) => month.map(row => [months[i], ...row]));
  const bea = renewals[2][1];
  const elapsed = bea[3] - 1;
  const cancelled = rows.filter(row => row[4]).length;

  const label = (text, x, y, size = 20, color = C.ink, maxWidth = Infinity, mono = false, bold = false) => {
    const t = T(String(text), size, color, mono, bold);
    const width = t.getWidth();
    if (width > maxWidth) t.scale(maxWidth / width);
    t.moveTo([x, y, 0]);
    return t;
  };
  const frame = (x, y, width, height, color, fill = 0.92) => {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(C.card, fill);
    r.moveTo([x, y, 0]);
    return r;
  };
  const card = (text, x, y, width, color = C.cyan, size = 20, height = P ? 0.90 : 0.52) => new M.VGroup(
    frame(x, y, width, height, color),
    label(text, x, y, size, color, width - 0.22, false, true),
  );
  const line = (x1, y1, x2, y2, color = C.muted) => new M.Line({
    start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: 2,
  });
  const dot = (x, y, radius, color) => {
    const d = new M.Dot({ radius, color });
    d.setFill(color, 1);
    d.moveTo([x, y, 0]);
    return d;
  };

  const visible = new Map();
  function update(title, color, changes = {}, moving = []) {
    const animations = showA(title, color, PILL, 17);
    for (const [key, next] of Object.entries(changes)) {
      const previous = visible.get(key);
      if (previous && next && moving.includes(key)) {
        animations.push(new M.Transform(previous, next, { runTime: 0.55 }));
      } else {
        if (previous) animations.push(new M.FadeOut(previous, { runTime: 0.35 }));
        if (next) animations.push(new M.FadeIn(next, { runTime: 0.55 }));
        if (next) visible.set(key, next);
        else visible.delete(key);
      }
    }
    return play(...animations);
  }
  const clear = () => Object.fromEntries([...visible.keys()].map(key => [key, null]));

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19;
    const spacing = P ? 0.46 : 0.42;
    const [x, y] = BOXP;
    const maxWidth = P ? FW - 0.9 : 4.5;
    const pad = 0.56;
    const innerMax = maxWidth - pad;
    const items = lines.map((entry, i) => {
      const [text, ink] = Array.isArray(entry) ? entry : [entry, C.ink];
      const t = T(String(text), size, ink, true, false);
      const rawW = t.getWidth();
      const s = rawW > innerMax ? innerMax / rawW : 1;
      if (s < 1) t.scale(s);
      t.moveTo([x, y + ((lines.length - 1) / 2 - i) * spacing, 0]);
      return { t, w: rawW * s };
    });
    const width = Math.min(maxWidth, Math.max(...items.map(it => it.w)) + pad);
    const height = lines.length * spacing + 0.36;
    return new M.VGroup(frame(x, y, width, height, color), ...items.map(it => it.t));
  }

  const musicApp = () => (P ? new M.VGroup(
    frame(0, 0.00, 5.20, 5.20, C.cyan),
    label('♪', 0, 1.20, 88, C.cyan),
    label('Music app', 0, -0.30, 32, C.ink, 4.6, false, true),
    label('Monthly plan', 0, -1.20, 23, C.muted, 4.6),
    label('Pay every month', 0, -1.95, 19, C.cyan, 4.6),
  ) : new M.VGroup(
    frame(CX, -0.32, 2.20, 2.40, C.cyan),
    label('♪', CX, 0.04, 54, C.cyan),
    label('Music app', CX, -0.62, 22, C.ink, 1.85),
    label('Monthly plan', CX, -1.08, 17, C.muted, 1.85),
  ));

  const planDates = () => new M.VGroup(
    ...months.slice(0, 3).map((month, i) => card(
      `1 ${month}`,
      CX + (i - 1) * (P ? 2.30 : 1.53),
      P ? -3.45 : -1.96,
      P ? 2.05 : 1.20,
      C.cyan,
      P ? 22 : 19,
      P ? 0.78 : 0.52,
    )),
  );

  const notes = () => (P ? new M.VGroup(
    frame(0, -0.55, 6.00, 6.60, C.cyan),
    label('Renewal notes', 0, 1.95, 28, C.cyan, 5.4, false, true),
    ...[0, 1, 2, 3, 4, 5].flatMap(i => {
      const y = 1.00 - i * 0.80;
      return [dot(-2.25, y, 0.08, C.cyan), line(-1.90, y, 2.30, y, C.muted)];
    }),
  ) : new M.VGroup(
    frame(CX, -0.45, 3.4, 2.3, C.cyan),
    label('Renewal notes', CX, 0.33, 24, C.cyan),
    ...[0, 1, 2].flatMap(i => {
      const y = -0.21 - i * 0.42;
      return [dot(CX - 1.17, y, 0.045, C.cyan), line(CX - 0.96, y, CX + 1.18, y, C.muted)];
    }),
  ));

  const monthX = i => CX + (i - 2.5) * (P ? 1.24 : 1.12);
  const renewalY = i => (P ? 1.45 - i * 1.12 : 0.36 - i * 0.55);
  function calendarAxis() {
    const axisY = P ? -3.15 : -2.02;
    const headY = P ? 2.45 : 0.98;
    const tick = P ? 0.14 : 0.10;
    const parts = [
      line(monthX(0), axisY, monthX(5), axisY),
      ...months.flatMap((month, i) => [
        label(month, monthX(i), headY, P ? 21 : 20, C.ink, P ? 1.12 : 0.92, false, P),
        line(monthX(i), axisY - tick, monthX(i), axisY + tick),
      ]),
    ];
    if (P) parts.push(label('6 months: Jan → Jun', 0, -3.65, 17, C.muted, 6.8));
    return new M.VGroup(...parts);
  }
  function calendarCards(colored) {
    return new M.VGroup(...renewals.flatMap((month, i) => month.map(([name, , , day], j) =>
      card(
        name,
        monthX(i),
        renewalY(j),
        P ? 1.12 : 1.0,
        colored ? (day ? C.pink : C.cyan) : C.muted,
        P ? 20 : 19,
        P ? 0.84 : 0.42,
      ))));
  }

  const left = CX - (P ? 1.95 : 1.74);
  const right = CX + (P ? 1.95 : 1.74);
  const cardW = P ? 3.30 : 2.82;
  const trapW = P ? 3.30 : 2.93;
  const trapTopY = P ? 0.65 : -0.22;
  const trapBotY = P ? -1.15 : -1.10;
  const rightMidY = P ? -0.50 : -0.59;
  const winY = P ? -3.35 : -2.12;
  const winLabelY = P ? -3.85 : -2.48;
  const winSpan = P ? 3.55 : 3.10;

  function dayBoundary(leftTitle = 'Past', rightTitle = 'Future', leftColor = C.cyan, rightColor = C.pink) {
    return new M.VGroup(
      label(leftTitle, left, P ? 2.25 : 0.93, 21, leftColor, P ? 3.35 : 2.95, false, true),
      label(rightTitle, right, P ? 2.25 : 0.93, 21, rightColor, P ? 3.35 : 2.95, false, true),
      label('1 Mar', CX, P ? 2.90 : 1.23, P ? 19 : 16, C.amber, P ? 1.3 : 0.85, true, P),
      line(CX, P ? 2.48 : 0.96, CX, P ? -3.35 : -2.03, C.amber),
    );
  }
  function pastWindow() {
    const tick = P ? 0.14 : 0.09;
    return new M.VGroup(
      line(CX - winSpan, winY, CX, winY, C.cyan),
      line(CX - winSpan, winY - tick, CX - winSpan, winY + tick, C.cyan),
      line(CX, winY - tick, CX, winY + tick, C.amber),
      label('30 days before', CX - winSpan / 2, winLabelY, P ? 19 : 18, C.cyan, P ? 3.2 : 2.72),
    );
  }
  const futureX = day => CX + winSpan * day / 30;
  function futureWindow() {
    const tick = P ? 0.14 : 0.09;
    return new M.VGroup(
      line(CX, winY, futureX(30), winY, C.pink),
      line(futureX(30), winY - tick, futureX(30), winY + tick, C.pink),
      label('Day 30', futureX(30) - (P ? 0.30 : 0.12), winLabelY, P ? 18 : 17, C.pink, P ? 1.3 : 1.10, true),
    );
  }
  const beaFact = (text, y) => card(text, left, y, cardW, C.cyan);
  const outcome = (text, y = -1.25) => card(text, right, y, cardW, C.pink);

  function sortHeaders() {
    if (P) {
      return new M.VGroup(
        label('Features', 0, 2.70, 25, C.cyan, 4.5, false, true),
        line(-2.90, 2.32, 2.90, 2.32, C.cyan),
        label('Label', 0, -1.85, 25, C.pink, 4.5, false, true),
        line(-2.90, -2.23, 2.90, -2.23, C.pink),
      );
    }
    return new M.VGroup(
      label('Features', left, 0.93, 24, C.cyan, 2.65, false, true),
      label('Label', right, 0.93, 24, C.pink, 2.65, false, true),
      line(left - 1.35, 0.60, left + 1.35, 0.60, C.cyan),
      line(right - 1.35, 0.60, right + 1.35, 0.60, C.pink),
    );
  }
  const sortCard = (text, slot, color) => {
    const pos = P ? {
      u0: [0, 0.90], u1: [0, 0.00], u2: [0, -0.90],
      f0: [0, 1.68], f1: [0, 0.72], l0: [0, -3.00],
    } : {
      u0: [CX, -0.08], u1: [CX, -0.79], u2: [CX, -1.50],
      f0: [left, 0.10], f1: [left, -0.61], l0: [right, -0.25],
    };
    const [x, y] = pos[slot];
    return card(text, x, y, P ? 5.20 : 2.82, color, P ? 21 : 20, P ? 0.78 : 0.52);
  };
  const exampleFrame = () => (P
    ? frame(0, -0.30, 6.60, 6.80, C.violet, 0)
    : frame(CX, 0.08, 6.68, 2.46, C.violet, 0));

  function table(withLabel, withDates = false) {
    const count = withDates ? 6 : withLabel ? 5 : 4;
    const headings = withDates ? ['Name', 'Mon', 'Hours', 'Help', 'Left?', 'Date'] : ['Name', 'Mon', 'Hours', 'Help', 'Left?'];
    const colors = [C.muted, C.muted, C.cyan, C.cyan, C.pink, C.amber];
    if (P) {
      const width = 7.30;
      const offsets = withDates
        ? [-2.85, -1.68, -0.52, 0.62, 1.70, 2.85]
        : [-2.75, -1.40, 0.00, 1.35, 2.70];
      const widths = withDates
        ? [1.15, 0.95, 1.10, 0.95, 1.00, 1.20]
        : [1.30, 1.10, 1.30, 1.10, 1.30];
      const parts = [
        frame(0, -0.35, width, 7.05, C.line),
        line(-width / 2 + 0.12, 2.64, width / 2 - 0.12, 2.64, C.muted),
      ];
      for (let j = 0; j < count; j++) {
        parts.push(label(headings[j], offsets[j], 2.90, 17, colors[j], widths[j], false, true));
      }
      rows.forEach(([month, name, hours, help, day], i) => {
        const y = 2.38 - i * 0.315;
        const values = [name, month, hours, help, day ? 'yes' : 'no', day ? `${day} ${month}` : '—'];
        for (let j = 0; j < count; j++) {
          const color = j === 4 ? (day ? C.pink : C.cyan) : j === 5 ? (day ? C.amber : C.muted) : j >= 2 ? C.cyan : C.ink;
          parts.push(label(values[j], offsets[j], y, 16, color, widths[j], true));
        }
      });
      return new M.VGroup(...parts);
    }
    const width = withDates ? 3.96 : 3.34;
    const distance = withDates ? 2.04 : 1.78;
    const center = withDates ? -2.55 : CX;
    const offsets = withDates
      ? [-1.54, -0.92, -0.32, 0.29, 0.87, 1.54]
      : [-1.20, -0.59, 0.07, 0.64, 1.19];
    const widths = withDates
      ? [0.66, 0.48, 0.62, 0.50, 0.56, 0.68]
      : [0.76, 0.54, 0.69, 0.57, 0.70];
    return new M.VGroup(...[0, 1].flatMap(half => {
      const x = center + (half ? distance : -distance);
      const parts = [
        frame(x, -0.86, width, 3.65, C.line),
        line(x - width / 2 + 0.07, 0.51, x + width / 2 - 0.07, 0.51, C.muted),
      ];
      for (let j = 0; j < count; j++) {
        parts.push(label(headings[j], x + offsets[j], 0.76, 17, colors[j], widths[j], false, true));
      }
      rows.slice(half * 10, half * 10 + 10).forEach(([month, name, hours, help, day], i) => {
        const y = 0.34 - i * 0.31;
        const values = [name, month, hours, help, day ? 'yes' : 'no', day ? `${day} ${month}` : '—'];
        for (let j = 0; j < count; j++) {
          const color = j === 4 ? (day ? C.pink : C.cyan) : j === 5 ? (day ? C.amber : C.muted) : j >= 2 ? C.cyan : C.ink;
          parts.push(label(values[j], x + offsets[j], y, 16, color, widths[j], true));
        }
      });
      return parts;
    }));
  }

  const analogy = () => (P ? new M.VGroup(
    label('During the visit', 0, 2.65, 24, C.cyan, 6.2, false, true),
    card('Symptoms', 0, 1.60, 5.40, C.cyan, 26, 1.08),
    label('Clues you see now', 0, 0.65, 19, C.muted, 6.2),
    new M.Arrow({ start: [0, 0.15, 0], end: [0, -1.10, 0], color: C.amber }),
    label('Found later', 0, -1.70, 24, C.pink, 6.2, false, true),
    card('Illness', 0, -2.75, 5.40, C.pink, 26, 1.08),
    label('Answer learned later', 0, -3.70, 19, C.muted, 6.2),
  ) : new M.VGroup(
    label('During the visit', left, 0.93, 21, C.cyan, 2.90, false, true),
    label('Found later', right, 0.93, 21, C.pink, 2.90, false, true),
    card('Symptoms', left, -0.21, 2.72, C.cyan, 23, 0.67),
    card('Illness', right, -0.21, 2.72, C.pink, 23, 0.67),
    new M.Arrow({ start: [CX - 0.27, -0.21, 0], end: [CX + 0.27, -0.21, 0], color: C.muted }),
  ));

  const exampleRule = () => (P ? new M.VGroup(
    label('IF', 0, 2.45, 22, C.muted, 3, false, true),
    card('Fewer than 5 hours', 0, 1.40, 5.60, C.cyan, 25, 1.10),
    new M.Arrow({ start: [0, 0.55, 0], end: [0, -0.95, 0], color: C.amber }),
    label('THEN', 0, -1.50, 22, C.amber, 3, false, true),
    card('May cancel', 0, -2.55, 5.60, C.pink, 25, 1.10),
  ) : new M.VGroup(
    card('Fewer than 5 hours', CX, 0.42, 3.45, C.cyan, 23, 0.65),
    new M.Arrow({ start: [CX, 0.03, 0], end: [CX, -0.68, 0], color: C.amber }),
    card('May cancel', CX, -1.13, 3.45, C.pink, 23, 0.65),
  ));

  function newRenewal() {
    if (P) {
      return new M.VGroup(
        label('New renewal', 0, 2.75, 24, C.ink, 5, false, true),
        card('2 hours played', -1.85, 1.65, 3.30, C.cyan, 20, 0.90),
        card('1 help request', 1.85, 1.65, 3.30, C.cyan, 20, 0.90),
        new M.Arrow({ start: [0, 0.95, 0], end: [0, -0.25, 0], color: C.amber }),
        card('Guess: may cancel', 0, -1.00, 5.40, C.amber, 22, 0.94),
        card('Actual label: unknown', 0, -2.55, 5.40, C.muted, 21, 0.90),
      );
    }
    return new M.VGroup(
      label('New renewal', CX, 1.03, 23, C.ink, 4, false, true),
      card('2 hours played', left, 0.24, 2.82, C.cyan),
      card('1 help request', left, -0.49, 2.82, C.cyan),
      new M.Arrow({ start: [CX - 0.26, -0.15, 0], end: [CX + 0.26, -0.15, 0], color: C.amber }),
      card('Guess: may cancel', right, -0.15, 2.82, C.amber),
      card('Actual label: unknown', right, -1.17, 2.82, C.muted),
    );
  }

  await until(S(0));
  await update('A MONTHLY MUSIC PLAN', C.cyan, {
    app: musicApp(),
    formula: fbox(['Small music app', ['Customers pay every month', C.cyan]]),
  });

  await until(S(1));
  await update('RENEWAL DAY', C.cyan, {
    dates: planDates(),
    formula: fbox(['The plan starts again', ['on the 1st of the month', C.cyan]]),
  });

  await until(S(2));
  await update('SEND A DISCOUNT?', C.amber, {
    dates: null,
    offer: card('Send discount', CX, P ? -3.45 : -1.99, P ? 4.20 : 2.42, C.amber, P ? 24 : 20, P ? 0.82 : 0.52),
    formula: fbox([['Offer on renewal day', C.amber]], C.amber),
  });

  await until(S(3));
  await update('WILL THIS CUSTOMER CANCEL?', C.amber, {
    offer: null,
    formula: fbox(['Cancel within', ['the next 30 days?', C.amber]], C.amber),
  });

  await until(S(4));
  await update('LOOK AT PAST RENEWALS', C.cyan, {
    ...clear(),
    notes: notes(),
    formula: fbox(['Cannot ask customers', ['Learn from past renewals', C.cyan]]),
  });

  await until(S(5));
  await update('DATA = FACTS WRITTEN DOWN', C.cyan, {
    formula: fbox(['Who renewed?', 'What happened later?']),
  });

  await until(S(6));
  await update('JANUARY TO JUNE', C.cyan, {
    ...clear(),
    calendar: calendarAxis(),
    formula: fbox(['6 months of renewals', ['January to June', C.cyan]]),
  });

  await until(S(7));
  await update('ONE CARD = ONE RENEWAL', C.cyan, {
    renewals: calendarCards(false),
    formula: fbox(['One customer', 'on one renewal day']),
  });

  await until(S(8));
  await update('STAYED OR CANCELLED?', C.cyan, {
    renewals: calendarCards(true),
    formula: fbox([['Cyan = stayed', C.cyan], ['Pink = cancelled', C.pink]]),
  });

  await until(S(9));
  await update('20 RENEWALS', C.cyan, {
    formula: fbox([[`${cancelled} cancelled`, C.pink], [`${rows.length - cancelled} stayed`, C.cyan]]),
  });

  await until(S(10));
  await update('BEA • 1 MARCH', C.amber, {
    formula: fbox([['Bea', C.amber], '1 March renewal'], C.amber),
    focus: frame(monthX(2), renewalY(1), P ? 1.24 : 1.08, P ? 0.96 : 0.49, C.amber, 0),
  });

  await until(S(11));
  await update('RENEWAL DAY DIVIDES TIME', C.amber, {
    ...clear(),
    boundary: dayBoundary(),
    formula: fbox([['Left = past', C.cyan], ['Right = future', C.pink]], C.amber),
  });

  await until(S(12));
  await update('THE 30 DAYS BEFORE RENEWAL', C.cyan, {
    before: pastWindow(),
    formula: fbox(['30 days before 1 March', ['What Bea did', C.cyan]]),
  });

  await until(S(13));
  await update('2 HOURS PLAYED', C.cyan, {
    hours: beaFact(`${bea[1]} hours played`, P ? 1.05 : 0.12),
    formula: fbox([[`${bea[1]} hours played`, C.cyan], 'Very little listening']),
  });

  await until(S(14));
  await update('1 HELP REQUEST', C.cyan, {
    help: beaFact(`${bea[2]} help request`, P ? -0.50 : -0.59),
    formula: fbox([[`${bea[1]} hours played`, C.cyan], [`${bea[2]} help request`, C.cyan]]),
  });

  await until(S(15));
  await update('3 MONTHS AS A MEMBER', C.cyan, {
    tenure: beaFact('3 months as a member', P ? -2.05 : -1.30),
    formula: fbox([`${bea[1]} hours · ${bea[2]} help request`, ['3 months as a member', C.cyan]]),
  });

  await until(S(16));
  await update('LOOK INTO THE FUTURE →', C.pink, {
    after: futureWindow(),
    formula: fbox(['30 days after 1 March', ['Did Bea cancel?', C.pink]], C.pink),
  });

  await until(S(17));
  await update('BEA CANCELLED ON 12 MARCH', C.pink, {
    event: new M.VGroup(
      dot(futureX(elapsed), winY, P ? 0.13 : 0.10, C.pink),
      label(`Day ${elapsed}`, futureX(elapsed), winLabelY, P ? 18 : 17, C.pink, P ? 1.3 : 1.03, true),
      card('12 Mar: cancelled', right, P ? 0.50 : -0.35, cardW, C.pink),
    ),
    formula: fbox([['Cancelled 12 March', C.pink], [`${elapsed} days after renewal`, C.pink]], C.pink),
  });

  await until(S(18));
  await update('CANCELLED WITHIN 30 DAYS?', C.pink, {
    answer: outcome('Yes'),
    formula: fbox([[`Day ${elapsed} is within 30 days`, C.pink], ['Answer: yes, cancelled', C.pink]], C.pink),
  });

  await until(S(19));
  await update('TWO KINDS OF FACTS', C.violet, {
    boundary: dayBoundary('Known on the day', 'Learned later'),
    formula: fbox([['Left: known on 1 March', C.cyan], ['Right: learned later', C.pink]], C.violet),
  });

  await until(S(20));
  await update('THE CLUES', C.cyan, {
    boundary: dayBoundary('Clues known on 1 Mar', 'Learned later'),
    formula: fbox(['Known on renewal day', ['These facts are clues', C.cyan]]),
  });

  await until(S(21));
  await update('THE ANSWER', C.pink, {
    boundary: dayBoundary('Clues known on 1 Mar', 'Answer learned later'),
    formula: fbox(['Learned only later', ['The answer to guess', C.pink]], C.pink),
  });

  await until(S(22));
  await update('A NAME FOR EACH KIND', C.violet, {
    before: null,
    after: null,
    event: null,
    answer: outcome('Cancelled: yes', rightMidY),
    formula: fbox(['Two kinds of facts', ['Clues vs. answer', C.violet]], C.violet),
  });

  await until(S(23));
  await update('FEATURES', C.cyan, {
    boundary: dayBoundary('Features', 'Answer learned later'),
    formula: fbox([['Features = clues', C.cyan], 'Known on decision day']),
  });

  await until(S(24));
  await update('LABEL', C.pink, {
    boundary: dayBoundary('Features', 'Label'),
    formula: fbox([['Label = answer', C.pink], 'What we want to predict'], C.pink),
  });

  await until(S(25));
  await update('PREDICT = MAKE A CAREFUL GUESS', C.amber, {
    formula: fbox(['Use the clues now', ['Guess the answer', C.amber], ['before it arrives', C.amber]], C.amber),
  });

  await until(S(26));
  await update('AT THE DOCTOR', C.violet, {
    ...clear(),
    analogy: analogy(),
    formula: fbox([['Symptoms = features', C.cyan], ['Illness = label', C.pink]], C.violet),
  });

  await until(S(27));
  await update('SORT BEA’S RENEWAL FACTS', C.amber, {
    ...clear(),
    sort: sortHeaders(),
    hours: sortCard(`${bea[1]} hours played`, 'u0', C.muted),
    help: sortCard(`${bea[2]} help request`, 'u1', C.muted),
    answer: sortCard('Cancelled: yes', 'u2', C.muted),
    formula: fbox(['Bea · 1 March', ['Sort each fact', C.amber]], C.amber),
  });

  await until(S(28));
  await update('HOURS PLAYED → FEATURE', C.cyan, {
    hours: sortCard(`${bea[1]} hours played`, 'f0', C.cyan),
    formula: fbox(['Known on renewal day', [`${bea[1]} hours → feature`, C.cyan]]),
  }, ['hours']);

  await until(S(29));
  await update('HELP REQUESTS → FEATURE', C.cyan, {
    help: sortCard(`${bea[2]} help request`, 'f1', C.cyan),
    formula: fbox(['Known on renewal day', [`${bea[2]} help → feature`, C.cyan]]),
  }, ['help']);

  await until(S(30));
  await update('CANCELLED: YES → LABEL', C.pink, {
    answer: sortCard('Cancelled: yes', 'l0', C.pink),
    formula: fbox(['Learned only later', ['Cancelled: yes → label', C.pink]], C.pink),
  }, ['answer']);

  await until(S(31));
  await update('ONE EXAMPLE', C.violet, {
    example: exampleFrame(),
    formula: fbox(['One example', ['Bea’s 1 March renewal', C.violet]], C.violet),
  });

  await until(S(32));
  await update('TWO FEATURES IN THE TABLE', C.cyan, {
    ...clear(),
    table: table(false),
    formula: fbox([['Hours = hours played', C.cyan], ['Help = help requests', C.cyan]]),
  });

  await until(S(33));
  await update('20 EXAMPLES', C.violet, {
    table: table(true),
    formula: fbox([[`${rows.length} renewals`, C.violet], ['2 features per renewal', C.cyan], ['1 label per renewal', C.pink]], C.violet),
  });

  await until(S(34));
  await update('THE SHORT VERSION', C.violet, {
    formula: fbox([['example = features + label', C.violet]], C.violet),
  });

  await until(S(35));
  await update('ONE RENEWAL, ONE EXAMPLE', C.violet, {
    ...clear(),
    sort: sortHeaders(),
    hours: sortCard(`${bea[1]} hours played`, 'f0', C.cyan),
    help: sortCard(`${bea[2]} help request`, 'f1', C.cyan),
    answer: sortCard('Cancelled: yes', 'l0', C.pink),
    formula: fbox([['example = features + label', C.violet]], C.violet),
  });

  await until(S(36));
  await update('LEARN FROM MANY EXAMPLES', C.violet, {
    ...clear(),
    table: table(true),
    formula: fbox(['Computer learns from', [`${rows.length} examples`, C.violet]], C.violet),
  });

  await until(S(37));
  await update('LOOK FOR A RULE', C.amber, {
    formula: fbox([['Clues → rule → answer', C.amber]], C.amber),
  });

  await until(S(38));
  await update('A RULE BASED ON HOURS PLAYED', C.amber, {
    ...clear(),
    rule: exampleRule(),
    formula: fbox(['Example rule:', ['Few hours → may cancel', C.amber]], C.amber),
  });

  await until(S(39));
  await update('MODEL', C.green, {
    formula: fbox([['Model', C.green], 'A rule learned', 'from examples'], C.green),
  });

  await until(S(40));
  await update('GUESS ON A NEW RENEWAL DAY', C.amber, {
    ...clear(),
    prediction: newRenewal(),
    formula: fbox([['2 hours is fewer than 5', C.cyan], ['Prediction: may cancel', C.amber]], C.amber),
  });

  await until(S(41));
  await update('A QUESTION A COMPUTER CAN LEARN', C.violet, {
    formula: fbox(['Will this customer cancel?', ['Features → model', C.violet], ['→ prediction', C.violet]], C.violet),
  });

  await until(S(42));
  await update('A COMMON TRAP', C.amber, {
    ...clear(),
    table: table(true),
    formula: fbox([`${rows.length} renewals`, ['Watch for a common trap', C.amber]], C.amber),
  });

  await until(S(43));
  await update('ADD A CANCEL DATE COLUMN?', C.amber, {
    table: table(true, true),
    formula: fbox([['Date = cancel date', C.amber]], C.amber),
  });

  await until(S(44));
  await update('WHAT DID WE KNOW ON 1 MARCH?', C.amber, {
    ...clear(),
    boundary: dayBoundary('On renewal day', 'After renewal'),
    known: card('Cancel date: unknown', left, trapTopY, trapW, C.muted),
    formula: fbox(['Bea renews on 1 March', ['Cancel date:', C.amber], ['still unknown', C.amber]], C.amber),
  });

  await until(S(45));
  await update('THE DATE GIVES AWAY THE ANSWER', C.pink, {
    later: card('Cancel date: 12 Mar', right, trapTopY, trapW, C.pink),
    answer: card('Cancelled: yes', right, trapBotY, trapW, C.pink),
    formula: fbox([['Cancel date → answer', C.pink], 'It belongs to the future'], C.pink),
  });

  await until(S(46));
  await update('KNOWN ON RENEWAL DAY?', C.amber, {
    known: beaFact(`${bea[1]} hours played`, trapTopY),
    formula: fbox([['Hours: known 1 March', C.cyan], ['Cancel date: later', C.pink]], C.amber),
  });

  await until(S(47));
  await update('KEEP FUTURE FACTS OUT', C.amber, {
    boundary: dayBoundary('Clues available', 'Future facts'),
    help: beaFact(`${bea[2]} help request`, trapBotY),
    formula: fbox([['Use facts known', C.cyan], ['on renewal day', C.cyan]]),
  });

  await until(S(48));
  await update('FEATURES AND LABELS', C.violet, {
    ...clear(),
    sort: sortHeaders(),
    hours: sortCard(`${bea[1]} hours played`, 'f0', C.cyan),
    help: sortCard(`${bea[2]} help request`, 'f1', C.cyan),
    answer: sortCard('Cancelled: yes', 'l0', C.pink),
    formula: fbox([['Features: what you know', C.cyan], ['Label: what you predict', C.pink]], C.violet),
  });
}

export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Chapter 12.1 renewals: name, month, hours, cancelled.
  const R = [
    ['Ali', 'Jan', 20, 0], ['Ali', 'Feb', 18, 0], ['Ali', 'Mar', 22, 0],
    ['Ali', 'Apr', 19, 0], ['Ali', 'May', 21, 0], ['Ali', 'Jun', 20, 0],
    ['Bea', 'Jan', 12, 0], ['Bea', 'Feb', 6, 0], ['Bea', 'Mar', 2, 1],
    ['Chen', 'Jan', 15, 0], ['Chen', 'Feb', 10, 0], ['Chen', 'Mar', 7, 0],
    ['Chen', 'Apr', 3, 1], ['Farah', 'Feb', 1, 1],
    ['Dina', 'Mar', 3, 0], ['Dina', 'Apr', 9, 0], ['Dina', 'May', 14, 0],
    ['Dina', 'Jun', 16, 0], ['Eli', 'May', 11, 0], ['Eli', 'Jun', 6, 1],
  ];
  const TEST = [7, 12, 4, 17, 19];
  const VAL = [8, 11, 14, 5, 18];
  const TRAIN15 = R.map((_, i) => i).filter(i => !TEST.includes(i));
  const LEARN = TRAIN15.filter(i => !VAL.includes(i));
  const ok = (i, cutoff) => (R[i][2] < cutoff) === Boolean(R[i][3]);

  const CX = P ? 0 : -2.05;
  const PILL = P ? [0, 2.22, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.60, 0] : [4.88, -0.30, 0];
  const numberSize = P ? 18 : 15;
  const say = (s, color = C.cyan) => showA(s, color, PILL, 18);

  function grid(g, k, n) {
    const rows = Math.ceil(n / g.cols);
    return [
      g.cx + (k % g.cols - (g.cols - 1) / 2) * g.sx,
      g.cy + ((rows - 1) / 2 - Math.floor(k / g.cols)) * g.sy,
      0,
    ];
  }

  const setupGrid = P
    ? { cols: 5, w: 1.18, h: 1.26, sx: 1.42, sy: 1.70, cx: 0, cy: -1.82 }
    : { cols: 5, w: 1.06, h: 0.60, sx: 1.24, sy: 0.76, cx: CX, cy: -1.00 };
  const G15 = P
    ? { cols: 5, w: 1.44, h: 1.00, sx: 1.50, sy: 1.16, cx: 0, cy: -1.25 }
    : { cols: 5, w: 1.06, h: 0.70, sx: 1.14, sy: 0.84, cx: -3.95, cy: -0.22 };
  const G10 = P
    ? { cols: 5, w: 1.44, h: 0.98, sx: 1.50, sy: 1.11, cx: 0, cy: 0.16 }
    : { cols: 5, w: 1.04, h: 0.72, sx: 1.12, sy: 0.88, cx: -3.95, cy: 0.05 };

  // The phone rows share the validation cards' x positions.
  const VW = P ? 1.26 : 1.18;
  const VH = P ? 1.00 : 0.62;
  const vpos = k => P
    ? [0.58 + (k - 2) * 1.36, -2.02, 0]
    : [0.05, 0.50 - k * 0.72, 0];
  const mpos = (k, col) => P
    ? [vpos(k)[0], -3.02 - col * 0.86, 0]
    : [1.36 + col * 0.80, vpos(k)[1], 0];

  const TW = P ? 1.40 : 1.04;
  const TH = P ? 0.98 : 0.68;
  const TS = P ? 1.48 : 1.12;
  const boxC = P ? [0, -5.55, 0] : [-3.95, -2.20, 0];
  const tpos = k => [boxC[0] + (k - 2) * TS, boxC[1], 0];
  const boxW = 5 * TS + 0.16;
  const boxH = TH + (P ? 0.32 : 0.28);
  const HDR_Y = 1.15;

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.42 : 0.40;
    const rows = lines.map(line => Array.isArray(line) ? line : [line, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const indents = rows.map(([s]) => cw * (s.length - s.trimStart().length));
    const width = Math.max(...texts.map((t, i) => t.getWidth() + indents[i])) + 0.65;
    const height = rows.length * lh + 0.36;
    const frame = new M.RoundedRectangle({
      width, height, cornerRadius: 0.16, color, strokeWidth: 2,
    });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    const left = BOXP[0] - width / 2 + 0.32;
    const top = BOXP[1] + height / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      t.moveTo([left + indents[i] + t.getWidth() / 2, top - i * lh, 0]);
    });

    const group = new M.VGroup(frame, ...texts);
    const maxWidth = P ? FW - 0.8 : 3.85;
    if (width > maxWidth) group.scale(maxWidth / width);
    const animations = boxNow
      ? [new M.FadeOut(boxNow, { runTime: 0.45 })]
      : [];
    animations.push(new M.FadeIn(group, { runTime: 0.6 }));
    boxNow = group;
    return animations;
  }

  function fit(t, width) {
    const measured = t.getWidth();
    if (measured > width) t.scale(width / measured);
    return t;
  }

  function card(i, p, w, h, colored = true, hasMark = true) {
    const color = colored ? (R[i][3] ? C.pink : C.cyan) : C.muted;
    const fr = new M.RoundedRectangle({
      width: w, height: h, cornerRadius: 0.1, color, strokeWidth: 1.8,
    });
    fr.setFill(colored ? color : C.card, colored ? 0.14 : 0.95);
    fr.moveTo(p);

    const textX = p[0] - (hasMark ? (P ? 0.13 : 0.11) : 0);
    const nameWidth = hasMark ? w - (P ? 0.32 : 0.36) : w - 0.16;
    const t1 = fit(T(`${R[i][0]} ${R[i][1]}`, 15, C.ink), nameWidth);
    const t2 = T(`${R[i][2]} h`, numberSize, C.muted, true);
    if (!P) fit(t2, nameWidth);
    t1.moveTo([textX, p[1] + (P ? 0.22 : 0.14), 0.015]);
    t2.moveTo([textX, p[1] - (P ? 0.23 : 0.15), 0.015]);
    return { p, w, h, fr, t1, t2, all: [fr, t1, t2] };
  }

  function checkAt(x, y, color = C.green, s = 0.095) {
    return new M.VGroup(
      new M.Line({
        start: [x - s, y, 0.025], end: [x - s * 0.2, y - s * 0.8, 0.025],
        color, strokeWidth: 4,
      }),
      new M.Line({
        start: [x - s * 0.2, y - s * 0.8, 0.025], end: [x + s * 1.1, y + s * 1.1, 0.025],
        color, strokeWidth: 4,
      }),
    );
  }

  function crossAt(x, y, color = C.pink, s = 0.085) {
    return new M.VGroup(
      new M.Line({
        start: [x - s, y - s, 0.025], end: [x + s, y + s, 0.025],
        color, strokeWidth: 4,
      }),
      new M.Line({
        start: [x - s, y + s, 0.025], end: [x + s, y - s, 0.025],
        color, strokeWidth: 4,
      }),
    );
  }

  function markIn(c, good) {
    const x = c.p[0] + c.w / 2 - 0.18;
    return good ? checkAt(x, c.p[1] - 0.02) : crossAt(x, c.p[1]);
  }

  const markAt = (p, good) => good
    ? checkAt(p[0], p[1] - 0.02, C.green, 0.12)
    : crossAt(p[0], p[1], C.pink, 0.11);
  const fadeAll = (arr, runTime = 0.5) => new M.FadeOut(new M.VGroup(...arr), { runTime });
  const fadeInCards = (cards, runTime = 1.2) => new M.LaggedStart(
    cards.map(c => new M.FadeIn(new M.VGroup(...c.all), { runTime: 0.25 })),
    { lagRatio: 0.06, runTime },
  );
  const pulseChecks = (marks, renewals, cutoff, runTime) => new M.LaggedStart(
    marks.filter((_, k) => ok(renewals[k], cutoff))
      .map(mark => new M.Indicate(mark, { color: C.green, runTime: 0.4 })),
    { lagRatio: 0.65, runTime },
  );

  function ruleCard(cx, cy, w, color, who, line1, line2) {
    const fr = new M.RoundedRectangle({
      width: w, height: 2.35, cornerRadius: 0.18, color, strokeWidth: 2.2,
    });
    fr.setFill(C.card, 0.95);
    fr.moveTo([cx, cy, 0]);
    const head = new M.Circle({ radius: 0.14, color });
    head.setFill(color, 1);
    head.moveTo([cx, cy + 0.84, 0.01]);
    const body = new M.Arc({ radius: 0.24, startAngle: 0, angle: Math.PI, color });
    body.setFill(color, 1);
    body.moveTo([cx, cy + 0.50, 0.01]);
    const ttl = T(who, P ? 18 : 17, color, true, true);
    ttl.moveTo([cx, cy + 0.14, 0.01]);
    const l1 = fit(T(line1, P ? 19 : 18, C.ink, true, true), w - 0.45);
    l1.moveTo([cx, cy - 0.34, 0.01]);
    const l2 = fit(T(line2, P ? 18 : 16, C.muted, true, true), w - 0.45);
    l2.moveTo([cx, cy - 0.80, 0.01]);
    return { fr, base: [fr, head, body, ttl], lines: [l1, l2], all: [fr, head, body, ttl, l1, l2] };
  }

  const rcA = ruleCard(P ? 0 : -4.10, -0.55, P ? 6.4 : 3.2, C.amber,
    'TEAMMATE A', 'hours < 5 → cancel', 'hours ≥ 5 → stay');
  const rcB = ruleCard(0, P ? -3.75 : -0.55, P ? 6.4 : 3.2, C.violet,
    'TEAMMATE B', 'hours < 10 → cancel', 'hours ≥ 10 → stay');
  const orTag = pill('OR', C.ink, 17);
  orTag.moveTo(P ? [0, -2.15, 0] : [CX, -0.55, 0]);

  await until(S(0));
  await play(
    ...rcA.base.map(o => new M.FadeIn(o, { runTime: 0.6 })),
    ...rcB.base.map(o => new M.FadeIn(o, { runTime: 0.6 })),
    new M.FadeIn(orTag, { runTime: 0.6 }),
    ...say('TWO TEAMMATES, TWO RULES', C.violet),
    ...fbox(['which rule is better?'], C.violet),
  );
  await until(S(1));
  await play(
    ...rcA.lines.map(o => new M.FadeIn(o, { runTime: 0.5 })),
    new M.Indicate(rcA.fr, { color: C.amber, runTime: 0.8 }),
    ...say('RULE A: CANCEL BELOW 5 HOURS', C.amber),
    ...fbox([['A: hours < 5 → “cancel”', C.amber]], C.amber),
  );
  await until(S(2));
  await play(
    ...rcB.lines.map(o => new M.FadeIn(o, { runTime: 0.5 })),
    new M.Indicate(rcB.fr, { color: C.violet, runTime: 0.8 }),
    ...say('RULE B: CANCEL BELOW 10 HOURS', C.violet),
    ...fbox([['A: hours < 5  → “cancel”', C.amber], ['B: hours < 10 → “cancel”', C.violet]], C.violet),
  );
  await until(S(3));
  await play(
    new M.Indicate(rcA.fr, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(rcB.fr, { color: C.violet, runTime: 0.8 }),
    ...say('WHICH ONE GOES TO THE FINAL TEST?', C.ink),
  );

  // Start with the full deck. The bottom row goes into the locked box.
  const backs = R.map((_, k) => {
    const back = new M.RoundedRectangle({
      width: setupGrid.w, height: setupGrid.h,
      cornerRadius: 0.12, color: C.cyan, strokeWidth: 1.8,
    });
    back.setFill(C.card, 0.95);
    back.moveTo(grid(setupGrid, k, R.length));
    return back;
  });
  const setupDeck = new M.VGroup(...backs);
  const box = new M.RoundedRectangle({
    width: boxW, height: boxH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5,
  });
  box.setFill(C.card, 0.7);
  box.moveTo([boxC[0], boxC[1], -0.01]);
  const lid = new M.RoundedRectangle({
    width: boxW, height: boxH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5,
  });
  lid.setFill(C.card, 1);
  lid.moveTo([boxC[0], boxC[1], 0.05]);
  const lockT = T('TEST SET (5) · LOCKED', numberSize, C.amber, true, true);
  lockT.moveTo([boxC[0], boxC[1], 0.06]);

  await until(S(4));
  await play(
    new M.LaggedStart([
      fadeAll([...rcA.all, ...rcB.all, orTag], 0.4),
      new M.FadeIn(setupDeck, { runTime: 0.6 }),
    ], { lagRatio: 1 }),
    ...say('SET UP THE CHECK FROM THE START', C.muted),
    ...fbox([['all 20 renewal cards', C.cyan]], C.cyan),
  );
  await until(S(5));
  await play(
    ...backs.slice(TRAIN15.length).map(back => new M.FadeOut(back, { runTime: 0.45 })),
    new M.FadeIn(box, { runTime: 0.4 }),
    new M.FadeIn(lid, { runTime: 0.8 }),
    new M.FadeIn(lockT, { runTime: 0.8 }),
    ...say('5 TEST CARDS: LOCKED AWAY', C.amber),
    ...fbox(['test set: 5 cards', ['locked until the choice', C.amber]], C.amber),
  );

  const c15 = TRAIN15.map((i, k) => card(i, grid(G15, k, TRAIN15.length), G15.w, G15.h, true, false));
  await until(S(6));
  await play(
    new M.FadeOut(setupDeck, { runTime: 0.5 }),
    fadeInCards(c15, 1.6),
    ...say('15 LEARNING CARDS ON THE TABLE', C.cyan),
    ...fbox([['15 cards for learning', C.cyan], ['5 test cards locked', C.amber]], C.cyan),
  );

  const learn = LEARN.map((i, k) => card(i, grid(G10, k, LEARN.length), G10.w, G10.h));
  const learnLab = T('TRAINING (10)', numberSize, C.cyan, false, true);
  learnLab.moveTo(P ? [0, 1.60, 0] : [G10.cx, HDR_Y, 0]);
  await until(S(7));
  await play(
    fadeAll(c15.flatMap(c => c.all), 0.5),
    fadeInCards(learn, 1.0),
    new M.FadeIn(learnLab, { runTime: 0.6 }),
    ...say('10 TRAINING CARDS: FOR LEARNING', C.cyan),
  );

  const val = VAL.map((i, k) => card(i, vpos(k), VW, VH, true, false));
  const valLab = T('VALIDATION (5)', numberSize, C.amber, false, true);
  valLab.moveTo(P ? [0.58, -1.18, 0] : [0.05, HDR_Y, 0]);
  await until(S(8));
  await play(
    fadeInCards(val, 1.0),
    new M.FadeIn(valLab, { runTime: 0.6 }),
    ...say('5 MORE: A PILE FOR CHOOSING', C.amber),
    ...fbox([['learn:  10 cards', C.cyan], ['choose:  5 cards', C.amber]], C.amber),
  );
  await until(S(9));
  await play(
    new M.LaggedStart(
      val.map(c => new M.Indicate(c.fr, { color: C.amber, runTime: 0.4 })),
      { lagRatio: 0.2, runTime: 1.4 },
    ),
    ...say('A PRACTICE QUIZ TO COMPARE TWO WAYS', C.amber),
  );
  await until(S(10));
  await play(
    new M.Indicate(valLab, { color: C.amber, runTime: 1.0 }),
    ...say('PILE TO CHOOSE = VALIDATION SET', C.amber),
    ...fbox([['validation set', C.amber], 'the pile you use', 'to choose a rule'], C.amber),
  );
  await until(S(11));
  await play(
    new M.Indicate(learnLab, { color: C.cyan, runTime: 1.0 }),
    ...say('10 OF 20 = HALF', C.cyan),
    ...fbox([['training:   10 = ½', C.cyan]], C.cyan),
  );
  await until(S(12));
  await play(
    new M.Indicate(valLab, { color: C.amber, runTime: 1.0 }),
    ...say('5 OF 20 = A QUARTER', C.amber),
    ...fbox([['training:   10 = ½', C.cyan], ['validation:  5 = ¼', C.amber]], C.amber),
  );
  await until(S(13));
  await play(
    new M.Indicate(lockT, { color: C.pink, runTime: 1.0 }),
    ...say('5 LOCKED TEST CARDS = LAST QUARTER', C.pink),
    ...fbox([['training:   10 = ½', C.cyan], ['validation:  5 = ¼', C.amber], ['test:        5 = ¼', C.pink]], C.pink),
  );
  await until(S(14));
  await play(
    ...say('CUTOFF = WHERE THE ANSWER CHANGES', C.violet),
    ...fbox([['cutoff', C.violet], 'the number where', 'the answer changes'], C.violet),
  );
  await until(S(15));
  await play(
    ...say('AT OR ABOVE THE CUTOFF → STAY', C.cyan),
    ...fbox(['hours < cutoff → “cancel”', ['hours ≥ cutoff → “stay”', C.cyan]], C.violet),
  );

  const lm5 = learn.map((c, k) => markIn(c, ok(LEARN[k], 5)));
  await until(S(16));
  await play(
    new M.LaggedStart(
      lm5.map(m => new M.Create(m, { runTime: 0.25 })),
      { lagRatio: 0.12, runTime: 1.6 },
    ),
    ...say('5-HOUR RULE: 10 OF 10 RIGHT', C.amber),
    ...fbox(['training cards', ['5-hour rule:  10 / 10', C.amber]], C.amber),
  );

  const lm10 = learn.map((c, k) => markIn(c, ok(LEARN[k], 10)));
  await until(S(17));
  await play(
    fadeAll(lm5, 0.4),
    new M.LaggedStart(
      lm10.map(m => new M.Create(m, { runTime: 0.25 })),
      { lagRatio: 0.12, runTime: 1.4 },
    ),
    ...say('10-HOUR RULE: 9 OF 10 RIGHT', C.violet),
    ...fbox(['training cards', ['5-hour rule:  10 / 10', C.amber], ['10-hour rule:  9 / 10', C.violet]], C.violet),
  );

  const dk = LEARN.indexOf(15); // Dina April.
  await until(S(18));
  await play(
    new M.Indicate(learn[dk].t1, { color: C.pink, runTime: 1.0 }),
    new M.Indicate(learn[dk].t2, { color: C.pink, runTime: 1.0 }),
    ...say('DINA APRIL: 9 H → CANCEL, BUT SHE STAYED', C.pink),
    ...fbox(['Dina April: 9 h', '9 < 10 → “cancel”', ['real: stayed', C.pink]], C.pink),
  );

  const h5 = T('5 h', numberSize, C.amber, true, true);
  const h10 = T('10 h', numberSize, C.violet, true, true);
  [h5, h10].forEach((label, col) => {
    const [x, y] = mpos(0, col);
    label.moveTo(P ? [-3.36, y, 0] : [x, HDR_Y, 0]);
  });

  function validationOutline(col, winner = false) {
    const a = mpos(0, col);
    const b = mpos(VAL.length - 1, col);
    const color = winner ? C.green : col === 0 ? C.amber : C.violet;
    const width = P ? b[0] - a[0] + (winner ? 1.12 : 0.90) : (winner ? 0.68 : 0.56);
    const height = P ? (winner ? 0.72 : 0.58) : a[1] - b[1] + (winner ? 0.78 : 0.64);
    const outline = new M.RoundedRectangle({
      width, height, cornerRadius: 0.12, color, strokeWidth: winner ? 3.5 : 1.5,
    });
    outline.setFill(C.card, 0);
    outline.moveTo([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, winner ? 0.01 : 0]);
    return outline;
  }

  const guides = [validationOutline(0), validationOutline(1)];
  await until(S(19));
  await play(
    fadeAll(lm10, 0.4),
    ...guides.map(guide => new M.Create(guide, { runTime: 0.6 })),
    new M.FadeIn(h5, { runTime: 0.6 }),
    new M.FadeIn(h10, { runTime: 0.6 }),
    ...say(P ? 'TWO GUESS ROWS: 5 H AND 10 H' : 'TWO GUESS COLUMNS: 5 H AND 10 H', C.amber),
    ...fbox([['5 h  rule', C.amber], ['10 h rule', C.violet], 'on the 5 validation cards'], C.amber),
  );

  const vm = [5, 10].map((cutoff, col) => VAL.map((i, k) => markAt(mpos(k, col), ok(i, cutoff))));
  const reveal = (k, ...cols) => cols.map(col => new M.Create(vm[col][k], { runTime: 0.4 }));
  function desc(k) {
    const [name, month, hours, cancelled] = R[VAL[k]];
    return [
      `${name} ${month}: ${hours} h`,
      [`real: ${cancelled ? 'cancelled' : 'stayed'}`, cancelled ? C.pink : C.cyan],
    ];
  }
  const ind = k => [val[k].t1, val[k].t2].map(
    t => new M.Indicate(t, { color: C.amber, runTime: 0.8 }),
  );

  await until(S(20));
  await play(...ind(0), ...say('BEA MARCH: 2 H, CANCELLED', C.pink), ...fbox(desc(0), C.pink));
  await until(S(21));
  await play(...reveal(0, 0, 1), ...say('BOTH GUESS CANCEL: BOTH RIGHT', C.green));
  await until(S(22));
  await play(...ind(1), ...say('CHEN MARCH: 7 H, STAYED', C.cyan), ...fbox(desc(1), C.cyan));
  await until(S(23));
  await play(...reveal(1, 0), ...say('5-H RULE: 7 ≥ 5 → STAY. RIGHT', C.amber));
  await until(S(24));
  await play(...reveal(1, 1), ...say('10-H RULE: 7 < 10 → CANCEL. MISS', C.pink));
  await until(S(25));
  await play(...ind(2), ...say('DINA MARCH: 3 H, STAYED', C.cyan), ...fbox(desc(2), C.cyan));
  await until(S(26));
  await play(...reveal(2, 0, 1), ...say('BOTH GUESS CANCEL: BOTH MISS', C.pink));
  await until(S(27));
  await play(...ind(3), ...say('ALI JUNE: 20 H, STAYED', C.cyan), ...fbox(desc(3), C.cyan));
  await until(S(28));
  await play(...reveal(3, 0, 1), ...say('BOTH GUESS STAY: BOTH RIGHT', C.green));
  await until(S(29));
  await play(...ind(4), ...say('ELI MAY: 11 H, STAYED', C.cyan), ...fbox(desc(4), C.cyan));
  await until(S(30));
  await play(...reveal(4, 0, 1), ...say('BOTH GUESS STAY: BOTH RIGHT', C.green));

  const val5 = VAL.filter(i => ok(i, 5)).length;
  const val10 = VAL.filter(i => ok(i, 10)).length;
  const score5 = `5-hour rule:  ${val5} / ${VAL.length}`;
  const score10 = `10-hour rule: ${val10} / ${VAL.length}`;
  const tally = n => Array(n).fill('✓').join('   ');

  await until(S(31));
  await play(
    pulseChecks(vm[0], VAL, 5, 1.8),
    ...say('COUNT THE 5-H CHECKS', C.amber),
    ...fbox([['5-hour tally', C.amber], [tally(val5), C.green]], C.amber),
  );
  await until(S(32));
  await play(...say('5-H RULE: 4 OF 5', C.amber), ...fbox(['validation', [score5, C.amber]], C.amber));
  await until(S(33));
  await play(
    pulseChecks(vm[1], VAL, 10, 1.4),
    ...say('COUNT THE 10-H CHECKS', C.violet),
    ...fbox([[score5, C.amber], ['10-hour tally', C.violet], [tally(val10), C.green]], C.violet),
  );
  await until(S(34));
  await play(
    ...say('10-H RULE: 3 OF 5', C.violet),
    ...fbox(['validation', [score5, C.amber], [score10, C.violet]], C.violet),
  );

  const win = validationOutline(0, true);
  await until(S(35));
  await play(
    new M.FadeOut(guides[0], { runTime: 0.4 }),
    new M.Create(win, { runTime: 0.7 }),
    new M.Indicate(h5, { color: C.green, runTime: 1.0 }),
    ...say('CHOOSE THE 5-HOUR CUTOFF', C.green),
    ...fbox(['chosen rule:', ['hours < 5 → “cancel”', C.green]], C.green),
  );

  const tcards = TEST.map((i, k) => card(i, tpos(k), TW, TH, false));
  const testLab = T('TEST SET (5)', numberSize, C.amber, false, true);
  testLab.moveTo(P ? [0, -4.57, 0] : [boxC[0], -1.45, 0]);
  await until(S(36));
  await play(
    fadeAll([lid, lockT], 0.6),
    fadeInCards(tcards, 0.8),
    new M.FadeIn(testLab, { runTime: 0.6 }),
    ...say('CHOICE IS FINAL: OPEN THE TEST BOX', C.amber),
  );

  const tg = tcards.map((c, k) => {
    const color = R[TEST[k]][3] ? C.pink : C.cyan;
    const frame = new M.RoundedRectangle({
      width: c.w, height: c.h, cornerRadius: 0.1, color, strokeWidth: 2.4,
    });
    frame.setFill(color, 0.14);
    frame.moveTo([c.p[0], c.p[1], 0.005]);
    return frame;
  });
  await until(S(37));
  await play(
    new M.LaggedStart(
      tg.map(frame => new M.FadeIn(frame, { runTime: 0.3 })),
      { lagRatio: 0.2, runTime: 1.2 },
    ),
    ...say('SCORE ONLY THE CHOSEN RULE', C.amber),
    ...fbox(['test set', ['5-hour rule only', C.green]], C.amber),
  );

  const tm = tcards.map((c, k) => markIn(c, ok(TEST[k], 5)));
  await until(S(38));
  await play(
    new M.LaggedStart(
      tm.map(m => new M.Create(m, { runTime: 0.3 })),
      { lagRatio: 0.25, runTime: 1.2 },
    ),
    ...say('TEST: 4 OF 5 RIGHT', C.green),
    ...fbox(['test set', ['5-hour rule: 4 / 5', C.green]], C.green),
  );
  await until(S(39));
  await play(
    pulseChecks(tm, TEST, 5, 1.4),
    ...say('HOW THE CHOSEN RULE DOES ON UNSEEN CARDS', C.green),
  );
  await until(S(40));
  await play(
    new M.Indicate(valLab, { color: C.amber, runTime: 1.0 }),
    ...say('VALIDATION: CHOOSE. TEST: FINAL CHECK', C.amber),
    ...fbox([['validation → choose', C.amber], ['test → final check', C.pink]], C.amber),
  );
  await until(S(41));
  await play(
    new M.Indicate(box, { color: C.pink, runTime: 1.0 }),
    ...say('TRAP: CHOOSING WITH TEST SCORES', C.pink),
    ...fbox([['watch out:', C.pink], 'choose by test score', '→ the test helped choose'], C.pink),
  );
  await until(S(42));
  await play(
    ...say('THEN YOU NEED A FRESH TEST', C.pink),
    ...fbox(['a fair check of that choice', ['needs fresh test cards', C.pink]], C.pink),
  );
  await until(S(43));
  await play(
    new M.Indicate(learnLab, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(valLab, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(testLab, { color: C.pink, runTime: 0.8 }),
    new M.Indicate(box, { color: C.pink, runTime: 0.8 }),
    ...say('LEARN · CHOOSE · TEST', C.green),
    ...fbox([['1. learn on training', C.cyan], ['2. choose on validation', C.amber], ['3. score on test', C.pink]], C.green),
  );
}

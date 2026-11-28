// 11.3.7 State-space models. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, C, S, T, showA, until, play } = L;
  const readings = [48, 53, 49, 51, 49];
  const demand = 50;
  const CX = P ? 0.1 : -2.4;
  const SP = P ? 1.12 : 1.25;
  const LEVEL = P ? -1.95 : -0.5;
  const PITCH = P ? 0.85 : 0.5;
  const BASE = LEVEL - 3.0 * PITCH - 0.25;
  const PILL = P ? [0, 1.75, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.0, 0] : [4.45, -0.3, 0];
  const boxWidth = P ? 6.6 : 4.3;
  const boxHeight = 1.5;

  const point = (x, y) => [x, y, 0];
  const weekX = i => CX + (i - 2) * SP;
  const caseY = value => LEVEL + (value - demand) * PITCH;
  const left = weekX(0) - 0.6;
  const right = weekX(5) + 0.35;
  const line = (x1, y1, x2, y2, color, strokeWidth = 2) =>
    new M.Line({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth });
  const label = (s, x, y, color = C.ink, size = 20, mono = false) =>
    T(s, size, color, mono).moveTo(point(x, y));
  const fadeIn = object => new M.FadeIn(object, { runTime: 0.4 });
  const fadeOut = object => new M.FadeOut(object, { runTime: 0.3 });
  const draw = object => new M.Create(object, { runTime: 0.5 });
  const mark = (object, color) => new M.Indicate(object, { color, runTime: 0.6 });
  const say = (s, color = C.cyan) => showA(s, color, PILL);

  function arrow(x1, y1, x2, y2, color, w = 3) {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
    const h = 0.16, wing = 0.09;
    return new M.VGroup(
      line(x1, y1, x2, y2, color, w),
      line(x2, y2, x2 - h * ux + wing * uy, y2 - h * uy - wing * ux, color, w),
      line(x2, y2, x2 - h * ux - wing * uy, y2 - h * uy + wing * ux, color, w),
    );
  }

  // Formula card: one place, contents change.
  const box = new M.RoundedRectangle({
    width: boxWidth, height: boxHeight, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2,
  });
  box.setFill(C.card, 0.95);
  box.moveTo(BOXP);
  let boxNow = null;

  function fbox(rows) {
    const labels = rows.map(([s, color], i) => {
      const text = T(s, P ? 23 : 21, color, true);
      const width = text.getWidth();
      if (width > boxWidth - 0.42) text.scale((boxWidth - 0.42) / width);
      text.moveTo(point(BOXP[0], BOXP[1] + (0.5 * (rows.length - 1) - i) * 0.4));
      return text;
    });
    const next = new M.VGroup(...labels);
    const previous = boxNow;
    boxNow = next;
    if (!previous) return [fadeIn(box), fadeIn(next)];
    return [fadeOut(previous), fadeIn(next)];
  }

  // ---------- 0-2: the till and its two mistakes ----------
  const introY = P ? -0.6 : -0.2;
  function caseIcon(x, y, color = C.cyan) {
    const carton = new M.Rectangle({ width: 0.7, height: 0.62, color, strokeWidth: 2.5 });
    carton.setFill(color, 0.16);
    carton.moveTo(point(x, y));
    return new M.VGroup(carton, line(x - 0.35, y + 0.12, x + 0.35, y + 0.12, color, 1.5));
  }
  const iconX = P ? -1.7 : CX - 1.9;
  const tillX = P ? 1.5 : CX + 1.9;
  const caseIcons = [-1, 0, 1].map(k => caseIcon(iconX + k * 0.8, introY));
  const till = new M.RoundedRectangle({ width: 1.9, height: 1.1, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2.5 });
  till.setFill(C.card, 0.95);
  till.moveTo(point(tillX, introY));
  const intro = new M.VGroup(
    ...caseIcons,
    arrow(iconX + 1.35, introY, tillX - 1.05, introY, C.muted, 2.5),
    till,
    label('TILL', tillX, introY + 0.2, C.cyan, 24, true),
    label('count: 49', tillX, introY - 0.22, C.ink, 19, true),
    label('Cases', iconX, introY - 0.6, C.muted, 20),
  );

  const errY = P ? -2.6 : -2.0;
  const errA = P ? -1.75 : CX - 1.9;
  const errB = P ? 1.75 : CX + 1.9;
  const missIcon = caseIcon(errA, errY, C.pink);
  const missCross = new M.VGroup(
    line(errA - 0.3, errY - 0.28, errA + 0.3, errY + 0.28, C.pink, 4),
    line(errA - 0.3, errY + 0.28, errA + 0.3, errY - 0.28, C.pink, 4),
  );
  const twiceIcons = [caseIcon(errB - 0.2, errY + 0.12, C.amber), caseIcon(errB + 0.2, errY - 0.12, C.amber)];
  const errors = new M.VGroup(
    missIcon, missCross, label('missed: −1', errA, errY - 0.62, C.pink, 20, true),
    ...twiceIcons, label('scanned twice: +1', errB, errY - 0.62, C.amber, 20, true),
  );

  await until(S(0));
  await play(fadeIn(intro), ...say('NORTH: THE TILL COUNTS DEMAND'));

  await until(S(1));
  await play(fadeIn(errors), ...say('THE TILL COUNT CAN BE OFF', C.amber));

  await until(S(2));
  await play(mark(till, C.amber), ...say('DEMAND CHANGE OR TILL WOBBLE?', C.amber));

  // ---------- 3-8: five till readings ----------
  const ticks = [48, 50, 52].map(value => {
    const y = caseY(value);
    return new M.VGroup(
      line(left - 0.07, y, left + 0.07, y, C.muted),
      line(left, y, right, y, C.grid, 1),
      label(String(value), left - 0.32, y, C.muted, 18, true),
    );
  });
  const weeks = readings.map((_, i) => label(String(i + 1), weekX(i), BASE - 0.3, C.muted, 18, true));
  const axes = new M.VGroup(
    line(left, BASE, right, BASE, C.muted),
    line(left, BASE, left, caseY(53.6), C.muted),
    ...ticks, ...weeks,
    label('cases', left + 0.25, caseY(53.6) + 0.22, C.muted, 17),
    label('week', CX + 0.5 * SP, BASE - 0.66, C.muted, 17),
  );
  const dots = readings.map((value, i) => {
    const x = weekX(i);
    const y = caseY(value);
    const halo = new M.Dot({ point: point(x, y), radius: 0.22, color: C.cyan });
    halo.setFill(C.cyan, 0.17);
    const dot = new M.Dot({ point: point(x, y), radius: 0.1, color: C.cyan });
    return new M.VGroup(halo, dot, label(String(value), x + 0.42, y, C.cyan, 21, true));
  });

  await until(S(3));
  await play(fadeOut(intro), fadeOut(errors), fadeIn(axes), ...say('FIVE TILL READINGS'));
  await until(S(4)); await play(fadeIn(dots[0]), ...say('WEEK 1: 48'));
  await until(S(5)); await play(fadeIn(dots[1]), ...say('WEEK 2: 53'));
  await until(S(6)); await play(fadeIn(dots[2]), ...say('WEEK 3: 49'));
  await until(S(7)); await play(fadeIn(dots[3]), ...say('WEEK 4: 51'));
  await until(S(8)); await play(fadeIn(dots[4]), ...say('WEEK 5: 49'));

  // ---------- 9-13: a flap hides the true demand line ----------
  const stateLine = line(left + 0.08, LEVEL, weekX(4) + 0.4, LEVEL, C.amber, 4);
  const flapW = weekX(4) + 0.45 - left;
  const flapH = PITCH * 0.62;
  const flap = new M.RoundedRectangle({ width: flapW, height: flapH, cornerRadius: 0.08, color: C.muted, strokeWidth: 2 });
  flap.setFill(C.card, 1);
  flap.moveTo(point(left + flapW / 2 + 0.02, LEVEL));
  const flapText = label('HIDDEN FROM THE GROCER', left + flapW / 2, LEVEL, C.muted, P ? 17 : 17, true);
  const flapGroup = new M.VGroup(flap, flapText);
  const lineLabel = label('true: 50', (weekX(0) + weekX(1)) / 2, LEVEL - 0.3, C.amber, 18, true);

  await until(S(9));
  await play(fadeIn(stateLine), fadeIn(flapGroup), ...say('A FLAP HIDES SOMETHING', C.amber));

  await until(S(10));
  await play(
    new M.FadeOut(flapGroup, { shift: [0, 0.9, 0], runTime: 0.8 }),
    fadeIn(lineLabel),
    ...fbox([['True demand', C.amber], ['50 cases each week', C.ink]]),
    ...say('UNDER THE FLAP: A FLAT LINE AT 50', C.amber),
  );

  await until(S(11));
  await play(
    new M.LaggedStart(dots.map(d => mark(d, C.cyan)), { lagRatio: 0.2, runTime: 1.0 }),
    ...fbox([['Grocer sees: the dots', C.cyan], ['We also see: the line', C.amber]]),
    ...say('THE GROCER SEES ONLY THE DOTS'),
  );

  await until(S(12));
  await play(mark(stateLine, C.amber), ...fbox([['Latent', C.amber], ['real but hidden', C.ink]]), ...say('LATENT = REAL BUT HIDDEN', C.amber));

  await until(S(13));
  await play(mark(stateLine, C.amber), ...fbox([['State', C.amber], ['what the model tracks:', C.ink], ['true demand', C.amber]]),
    ...say('THE STATE IS TRUE DEMAND', C.amber));

  // ---------- 14-20: reading noise ----------
  const gapLine = i => line(weekX(i), LEVEL, weekX(i), caseY(readings[i]), C.violet, 4);
  const gapLines = readings.map((_, i) => gapLine(i));
  // a faded line keeps opacity 0, so every redraw uses a fresh line
  const redraw = i => { gapLines[i] = gapLine(i); return draw(gapLines[i]); };
  const gapText = ['−2', '+3', '−1', '+1', '−1'].map((s, i) =>
    label(s, weekX(i) - 0.36, (LEVEL + caseY(readings[i])) / 2, C.violet, 19, true));

  await until(S(14));
  await play(mark(dots[1], C.cyan), ...fbox([['Week 2', C.ink], ['till reading  53', C.cyan], ['true demand   50', C.amber]]),
    ...say('53 SITS ABOVE 50'));

  await until(S(15));
  await play(draw(gapLines[1]), fadeIn(gapText[1]), ...fbox([['53 − 50 = 3 cases', C.violet]]),
    ...say('THE GAP IS 3 CASES', C.violet));

  await until(S(16));
  await play(mark(gapLines[1], C.violet), ...fbox([['Reading noise', C.violet], ['a gap made by', C.ink], ['the till count', C.ink]]),
    ...say('READING NOISE', C.violet));

  const others = [0, 2, 3, 4];
  await until(S(17));
  await play(
    new M.LaggedStart(others.map(i => draw(gapLines[i])), { lagRatio: 0.2, runTime: 0.9 }),
    ...others.map(i => fadeIn(gapText[i])),
    ...fbox([['gaps, week by week', C.ink], ['−2  +3  −1  +1  −1', C.violet]]),
    ...say('SOME UP, SOME DOWN', C.violet),
  );

  await until(S(18));
  await play(...fbox([['48 + 53 + 49', C.cyan], ['+ 51 + 49 = 250', C.cyan]]), ...say('ADD THE FIVE READINGS'));

  await until(S(19));
  await play(...fbox([['250 ÷ 5', C.ink], ['= 50 cases per week', C.green]]), ...say('DIVIDE BY FIVE', C.green));

  await until(S(20));
  await play(mark(stateLine, C.amber), ...fbox([['+3 +1 up, −2 −1 −1 down', C.violet], ['they cancel: average 50', C.green], ['= the hidden line', C.amber]]),
    ...say('THE GAPS CANCEL', C.green));

  // ---------- 21-24: two rules ----------
  const stepArrows = [0, 1, 2, 3].map(i =>
    arrow(weekX(i) + 0.15, LEVEL + 0.2, weekX(i + 1) - 0.15, LEVEL + 0.2, C.amber, 3));
  await until(S(21));
  await play(
    ...gapLines.map(fadeOut), ...gapText.map(fadeOut),
    new M.LaggedStart(stepArrows.map(draw), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox([['Rule 1: the line', C.amber], ['week to week', C.ink]]),
    ...say('GIVE THE HIDDEN LINE A RULE', C.amber));

  // another possible line that moves a little (dashed)
  const altVals = [50, 50.5, 51, 50.5, 51];
  const altLine = new M.VGroup(...[0, 1, 2, 3].map(i => new M.DashedLine({
    start: point(weekX(i), caseY(altVals[i])), end: point(weekX(i + 1), caseY(altVals[i + 1])), color: C.amber,
  })));
  const altLabel = label('or: moves a little', weekX(3), caseY(51.5) + 0.12, C.amber, 18, true);
  await until(S(22));
  await play(fadeIn(altLine), fadeIn(altLabel),
    ...fbox([['the line can stay flat', C.amber], ['or move a little', C.amber], ['each week', C.ink]]),
    ...say('STAY FLAT OR MOVE A LITTLE', C.amber));

  await until(S(23));
  await play(fadeOut(altLine), fadeOut(altLabel),
    new M.LaggedStart([0, 1, 2, 3, 4].map(redraw), { lagRatio: 0.15, runTime: 1.0 }),
    ...fbox([['Rule 2: the dots', C.cyan], ['land above or below', C.ink], ['the line', C.amber]]),
    ...say('GIVE THE DOTS A SEPARATE RULE'));

  await until(S(24));
  await play(
    new M.LaggedStart([...stepArrows, ...gapLines].map(o => mark(o, C.green)), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox([['Rule 1: the line', C.amber], ['Rule 2: the dots', C.cyan], ['= state-space model', C.green]]),
    ...say('TWO RULES = STATE-SPACE MODEL', C.green));

  // ---------- 25-28: the two rules in words ----------
  await until(S(25));
  await play(...gapLines.map(fadeOut),
    new M.LaggedStart(stepArrows.map(a => mark(a, C.amber)), { lagRatio: 0.2, runTime: 1.0 }),
    ...fbox([['true demand this week', C.amber], ["= last week's demand", C.ink], ['+ a small change', C.ink]]),
    ...say('RULE 1: TRUE DEMAND', C.amber));

  await until(S(26));
  await play(...stepArrows.map(fadeOut),
    new M.LaggedStart([0, 1, 2, 3, 4].map(redraw), { lagRatio: 0.15, runTime: 0.9 }),
    ...fbox([['reading', C.cyan], ['= true demand this week', C.amber], ['+ reading noise', C.violet]]),
    ...say('RULE 2: A READING'));

  const across = arrow(weekX(0) + 0.15, LEVEL + 0.2, weekX(1) - 0.15, LEVEL + 0.2, C.amber, 6);
  await until(S(27));
  await play(...gapLines.map(fadeOut), draw(across),
    ...fbox([['Rule 1: week 1 → week 2', C.amber], ['50 → 50', C.amber]]),
    ...say('RULE 1: ALONG THE LINE, WEEK TO WEEK', C.amber));

  await until(S(28));
  await play(fadeOut(across), redraw(1), fadeIn(gapText[1]),
    ...fbox([['Rule 2: week 2', C.violet], ['50 + 3 = 53', C.violet]]),
    ...say('RULE 2: LINE TO DOT, SAME WEEK', C.violet));

  // ---------- 29-32: use and trap ----------
  const nextX = weekX(5);
  const extension = new M.DashedLine({
    start: point(weekX(4) + 0.4, LEVEL), end: point(nextX - 0.13, LEVEL), color: C.green,
  });
  const estimate = new M.Circle({ radius: 0.13, color: C.green, strokeWidth: 3 });
  estimate.setFill(C.bg, 1);
  estimate.moveTo(point(nextX, LEVEL));
  const next = new M.VGroup(
    extension, estimate,
    label('50', nextX, LEVEL - 0.35, C.green, 20, true),
    label('next', nextX, BASE - 0.3, C.green, 18),
  );

  await until(S(29));
  await play(fadeOut(gapLines[1]), fadeOut(gapText[1]), fadeOut(lineLabel), fadeIn(next),
    ...fbox([['estimate of hidden demand', C.green], ['250 ÷ 5 = 50', C.ink], ['order for 50', C.green]]),
    ...say('ESTIMATE DEMAND FOR THE NEXT ORDER', C.green));

  await until(S(30));
  await play(fadeOut(next), new M.LaggedStart([mark(dots[0], C.cyan), mark(dots[1], C.cyan)],
    { lagRatio: 0.45, runTime: 0.9 }),
    ...fbox([['the till count jumped', C.cyan], ['48 → 53', C.cyan], ['change the order? no', C.amber]]),
    ...say('TRAP: REORDER AT EVERY WOBBLE', C.amber));

  await until(S(31));
  await play(redraw(1), fadeIn(gapText[1]), mark(stateLine, C.amber),
    ...fbox([['till reading rose to 53', C.cyan], ['true demand stayed at 50', C.amber]]),
    ...say('DOT UP, DEMAND STEADY', C.amber));

  await until(S(32));
  await play(fadeOut(gapLines[1]), fadeOut(gapText[1]),
    ...[0, 1, 2, 3].map(i => fadeIn(stepArrows[i])),
    ...fbox([['Rule 1: hidden demand', C.amber], ['Rule 2: reading = demand', C.cyan], ['        + noise', C.violet]]),
    ...say('TWO RULES, ONE STATE-SPACE MODEL', C.green));
}

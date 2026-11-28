// 16.2.10 Point-in-time joins: use only what was known at the time.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6, BASE = P ? -4.2 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const TOP = P ? 0.65 : 0.95;
  const TOTAL_Y = P ? -2.98 : -1.50;
  const FORECAST_Y = P ? -1.43 : -0.08;
  const X6 = CX - 2.70, X7 = CX - 0.54, X8 = CX + 1.62, X830 = CX + 2.70;
  const TOTAL_W = 1.82, TOTAL_H = 0.88, FORECAST_H = 0.68;
  const say = (text, color = C.cyan) => showA(text, color, PILL);

  function label(text, size, color, x, y, mono = false) {
    return T(text, size, color, mono).moveTo([x, y, 0]);
  }

  function panel(x, y, width, height, color, opacity = 0.94) {
    const rect = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    rect.setFill(C.card, opacity);
    rect.moveTo([x, y, 0]);
    return rect;
  }

  function card(x, y, width, height, heading, value, color, hs = 15) {
    return new M.VGroup(
      panel(x, y, width, height, color),
      label(heading, hs, color, x, y + height * 0.22),
      label(value, 22, C.ink, x, y - height * 0.17, true));
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(line => Array.isArray(line) ? line : [line, C.ink]);
    const texts = rows.map(([text, ink]) => T(text, size, ink, true));
    const wd = Math.max(...texts.map(text => text.getWidth())) + 0.7;
    const ht = rows.length * lh + 0.4;
    const rect = panel(BOXP[0], BOXP[1], wd, ht, color);
    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((text, i) => text.moveTo([left + text.getWidth() / 2, top - i * lh, 0]));
    const box = new M.VGroup(rect, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) box.scale(maxw / wd);
    const animations = [new M.FadeIn(box)];
    if (boxNow) animations.push(new M.FadeOut(boxNow));
    boxNow = box;
    return animations;
  }

  const appear = (...items) => items.map(item => new M.FadeIn(item));
  const clear = (...items) => items.map(item => new M.FadeOut(item));

  function tick(x, time, color) {
    return new M.VGroup(
      new M.Dot({ point: [x, BASE, 0], radius: 0.075, color }),
      label(time, P ? 19 : 17, color, x, BASE - 0.32, true));
  }

  function ticket(id, shop, amount, slot) {
    const x = CX + (slot - 2) * 1.36;
    const color = shop === 'North' ? C.cyan : C.amber;
    return new M.VGroup(
      panel(x, TOP, 1.23, 0.74, color, 0.9),
      label(`${id} · ${shop}`, P ? 15 : 14, color, x, TOP + 0.17),
      label(amount, 21, C.ink, x, TOP - 0.13, true));
  }

  function published(x, amount, color) {
    return new M.VGroup(
      new M.Line({ start: [x, BASE + 0.09, 0], end: [x, TOTAL_Y - TOTAL_H / 2, 0], color, strokeWidth: 2 }),
      panel(x, TOTAL_Y, TOTAL_W, TOTAL_H, color),
      label(amount, 24, C.ink, x, TOTAL_Y - 0.14, true));
  }

  function forecast(x, time) {
    const w = P ? 2.3 : 2.12;
    return card(P ? Math.min(x, FW / 2 - w / 2 - 0.5) : x, FORECAST_Y, w, P ? 0.8 : FORECAST_H, 'Tuesday forecast', time, C.violet, P ? 17 : 15);
  }

  function join(from, to, color) {
    return new M.Arrow({
      start: [from, FORECAST_Y - FORECAST_H / 2, 0],
      end: [to, TOTAL_Y + TOTAL_H / 2, 0],
      color,
      strokeWidth: 3,
      buff: 0.06,
    });
  }

  function outline(x, color) {
    return panel(x, TOTAL_Y, TOTAL_W + 0.16, TOTAL_H + 0.14, color, 0);
  }

  // 0–4 The bakery, the earlier forecast, and Tuesday's time line.
  const north = card(CX - 1.48, P ? -0.25 : -0.55, 2.40, 0.98, 'Bakery shop', 'North', C.cyan);
  const south = card(CX + 1.48, P ? -0.25 : -0.55, 2.40, 0.98, 'Bakery shop', 'South', C.amber);
  const forecastDay = card(CX + 1.48, P ? -0.25 : -0.55, 2.40, 0.98, 'Sales forecast', 'Tuesday', C.violet);
  const history = card(CX - 1.48, P ? -0.25 : -0.55, 2.40, 0.98, 'Sales records', 'Past days', C.cyan);
  const replay = card(CX - 1.48, P ? -0.25 : -0.55, 2.40, 0.98, 'Review day', 'Wednesday', C.cyan);
  const oldForecast = card(CX + 1.48, P ? -0.25 : -0.55, 2.40, 0.98, 'Tuesday forecast', '7:00 a.m.', C.violet);
  const axis = new M.Line({
    start: [X6 - 0.42, BASE, 0], end: [X830 + 0.42, BASE, 0], color: C.muted, strokeWidth: 3,
  });
  const axisTitle = label('Tuesday morning', 17, C.muted, CX, BASE - 0.70);
  await until(S(0)); await play(...appear(north, south), ...say('ONE BAKERY, TWO SHOPS'));
  await until(S(1)); await play(...clear(north, south), ...appear(history, forecastDay), ...say('PAST SALES → SALES FORECAST', C.violet));
  await until(S(2)); await play(...clear(history, forecastDay), ...appear(replay, oldForecast), ...say('LOOK BACK AT TUESDAY’S FORECAST', C.violet));
  await until(S(3)); await play(new M.Indicate(oldForecast, { color: C.amber }), ...say('WHAT WAS KNOWN AT 7:00?', C.amber));
  await until(S(4)); await play(...clear(replay, oldForecast), new M.Create(axis), ...appear(axisTitle), ...say('TUESDAY MORNING'));

  // 5–15 Sales tickets, arrival, and the two published totals.
  const t6 = tick(X6, '6:00', C.cyan);
  const t7 = tick(X7, '7:00', C.violet);
  const t8 = tick(X8, '8:00', C.amber);
  const t830 = tick(X830, '8:30', C.green);
  const a = ticket('A', 'North', '$4', 0);
  const c = ticket('C', 'South', '$6', 1);
  const d = ticket('D', 'South', '$10', 2);
  const e = ticket('E', 'South', '$14', 3);
  const b = ticket('B', 'North', '$8', 4);
  const dawn = published(X6, '$34', C.cyan);
  const updated = published(X830, '$42', C.green);
  const mondayDawn = label('Monday sales', P ? 17 : 15, C.cyan, X6, TOTAL_Y + 0.19);
  const mondayUpdated = label('Monday sales', P ? 17 : 15, C.green, X830, TOTAL_Y + 0.19);
  const atSeven = forecast(X7, '7:00 a.m.');
  const atEightThirty = forecast(X830, '8:30 a.m.');

  const slotsQ = [0, 1, 2, 3].map(k => {
    const x = CX + (k - 2) * 1.36;
    return new M.VGroup(panel(x, TOP, 1.23, 0.74, C.muted, 0.5), label('?', 22, C.muted, x, TOP, true));
  });
  const pending = new M.VGroup(panel(X830, TOTAL_Y, TOTAL_W, TOTAL_H, C.muted, 0.5),
    label('$42', 24, C.muted, X830, TOTAL_Y - 0.14, true), label('not yet', P ? 16 : 15, C.muted, X830, TOTAL_Y + 0.19));
  await until(S(5)); await play(...appear(t6, ...slotsQ), ...say('6:00 · FOUR MONDAY TICKETS RECEIVED'));
  await until(S(6)); await play(...appear(a), ...say('TICKET A · $4'));
  await until(S(7)); await play(...appear(c), ...say('TICKET C · $6', C.amber));
  await until(S(8)); await play(...appear(d), ...say('TICKET D · $10', C.amber));
  await until(S(9)); await play(...appear(e), ...say('TICKET E · $14', C.amber));
  await until(S(10)); await play(
    new M.LaggedStart([a, c, d, e].map(slip => new M.Indicate(slip, { color: C.amber })),
      { lagRatio: 0.15, runTime: 1.4 }),
    ...fbox(['4 + 6 + 10 + 14', ['$34', C.amber]], C.amber),
    ...say('ADD THE FOUR TICKETS', C.amber));
  await until(S(11)); await play(...appear(dawn, mondayDawn), new M.Indicate(t6, { color: C.cyan }),
    ...fbox(['Published at 6:00', ['$34 available', C.cyan]]), ...say('$34 BECOMES AVAILABLE'));
  await until(S(12)); await play(...appear(t7, atSeven), ...say('7:00 · TUESDAY FORECAST', C.violet));
  await until(S(13)); await play(...appear(t8, b), ...say('8:00 · LATE TICKET B ARRIVES', C.amber));
  await until(S(14)); await play(new M.Indicate(b, { color: C.cyan }), ...appear(pending),
    ...fbox(['$34 + $8 = $42'], C.amber), ...say('ADD THE LATE TICKET', C.amber));
  await until(S(15)); await play(...clear(pending), ...appear(t830, updated, mondayUpdated),
    ...fbox(['Published at 8:30', ['$42 available', C.green]], C.green), ...say('$42 BECOMES AVAILABLE', C.green));

  // 16–23 Compare the records and picture the publication cutoff.
  const earlyPaper = card(CX - 1.56, TOP, 2.60, 0.72, 'Newspaper', '7:00 issue', C.cyan);
  const latePaper = card(CX + 1.56, TOP, 2.60, 0.72, 'Newspaper', 'Later issue', C.pink);
  await until(S(16)); await play(...clear(a, c, d, e, b, boxNow, ...slotsQ),
    new M.Indicate(dawn, { color: C.cyan }), new M.Indicate(updated, { color: C.green }),
    ...say('TWO PUBLISHED TOTALS'));
  boxNow = null;
  await until(S(17)); await play(new M.Indicate(mondayDawn, { color: C.cyan }), new M.Indicate(mondayUpdated, { color: C.green }), ...say('BOTH TOTALS DESCRIBE MONDAY'));
  await until(S(18)); await play(new M.Indicate(t6, { color: C.cyan }), new M.Indicate(t830, { color: C.green }),
    ...say('DIFFERENT PUBLICATION TIMES', C.amber));
  await until(S(19)); await play(new M.Indicate(atSeven, { color: C.violet }), ...say('WHICH TOTAL GOES WITH 7:00?', C.amber));
  await until(S(20)); await play(...appear(earlyPaper), ...say('READ THE PAPER AT 7:00'));
  await until(S(21)); await play(...appear(latePaper), ...say('THE LATER ISSUE IS STILL UNAVAILABLE', C.pink));
  await until(S(22)); await play(...clear(earlyPaper, latePaper), new M.Indicate(t7, { color: C.violet }),
    ...say('THE COMPUTER HAS THE SAME TIME LIMIT', C.violet));
  const earlyCheck = outline(X6, C.green), futureCheck = outline(X830, C.pink);
  await until(S(23)); await play(...appear(earlyCheck, futureCheck),
    ...fbox([['$34 available at 7:00', C.green], ['$42 comes later', C.pink]]),
    ...say('AT 7:00, USE $34', C.green));

  // 24–29 Give names to the feature, the connection, and the cutoff.
  const exampleLink = join(X7, X6, C.green);
  await until(S(24)); await play(...fbox(['Feature', 'Information for a prediction']), ...say('FEATURE', C.violet));
  await until(S(25)); await play(new M.Indicate(mondayDawn, { color: C.cyan }),
    ...fbox(['Our feature', ['Previous day’s sales total', C.cyan]]), ...say('PREVIOUS DAY’S SALES TOTAL'));
  await until(S(26)); await play(new M.Create(exampleLink), ...fbox(['Join', 'Connect separate records']),
    ...say('CONNECT THE TWO RECORDS', C.green));
  await until(S(27)); await play(new M.Indicate(t7, { color: C.violet }),
    ...fbox(['Point in time', ['Tuesday at 7:00 a.m.', C.violet]]), ...say('ONE PARTICULAR MOMENT', C.violet));
  await until(S(28)); await play(...fbox(['Point-in-time join', 'Use what was available then']),
    ...say('POINT-IN-TIME JOIN', C.green));
  await until(S(29)); await play(...clear(exampleLink, earlyCheck, futureCheck), ...fbox(['Forecast → sales total', 'Which total fits?']),
    ...say('MATCH THE FORECAST TO ITS TOTAL', C.amber));

  // 30–39 Work the join one step per sentence.
  await until(S(30)); await play(new M.Indicate(atSeven, { color: C.violet }),
    ...fbox(['1 · Find the prediction time']), ...say('STEP 1 · FIND THE PREDICTION TIME', C.violet));
  await until(S(31)); await play(new M.Indicate(t7, { color: C.violet }),
    ...fbox(['1 · Prediction time', ['Tuesday at 7:00 a.m.', C.violet]]));
  await until(S(32)); await play(new M.Indicate(mondayDawn, { color: C.cyan }), new M.Indicate(mondayUpdated, { color: C.green }),
    ...fbox(['2 · Match the sales day', ['Previous day = Monday', C.cyan]]), ...say('STEP 2 · FIND MONDAY’S TOTALS'));
  await until(S(33)); await play(new M.Indicate(dawn, { color: C.cyan }), new M.Indicate(updated, { color: C.green }),
    ...fbox(['2 · Monday sales totals', ['$34 and $42', C.cyan]]), ...say('TWO POSSIBLE TOTALS'));
  await until(S(34)); await play(new M.Indicate(t6, { color: C.cyan }), new M.Indicate(t830, { color: C.green }),
    ...fbox(['3 · Check publication times']), ...say('STEP 3 · CHECK WHEN EACH WAS PUBLISHED', C.amber));
  const before = outline(X6, C.green), after = outline(X830, C.pink);
  await until(S(35)); await play(...appear(before), new M.Indicate(t6, { color: C.green }),
    ...fbox(['$34 published at 6:00', ['6:00 before 7:00', C.green]], C.green), ...say('$34 WAS AVAILABLE', C.green));
  await until(S(36)); await play(...appear(after), new M.Indicate(t830, { color: C.pink }),
    ...fbox(['$42 published at 8:30', ['8:30 after 7:00', C.pink]], C.pink), ...say('$42 WAS STILL UNAVAILABLE', C.pink));
  await until(S(37)); await play(new M.Indicate(after, { color: C.pink }),
    ...fbox([['Leave out $42 at 7:00', C.pink]], C.pink), ...say('LEAVE OUT THE LATER TOTAL', C.pink));
  await until(S(38)); await play(new M.Indicate(before, { color: C.green }),
    ...fbox(['4 · Pick the latest', ['available total', C.green]], C.green), ...say('STEP 4 · PICK THE LATEST AVAILABLE TOTAL', C.green));
  const sevenLink = join(X7, X6, C.green);
  await until(S(39)); await play(...clear(before, after), new M.Create(sevenLink),
    ...fbox(['Tuesday 7:00 forecast', ['← Monday total of $34', C.green]], C.green), ...say('7:00 FORECAST USES $34', C.green));

  // 40–46 A new forecast at the publication time and the general rule.
  const newChoice = outline(X830, C.green);
  const laterLink = join(X830, X830, C.green);
  await until(S(40)); await play(...appear(atEightThirty), new M.Indicate(t830, { color: C.violet }),
    ...fbox(['New prediction time', ['Tuesday at 8:30 a.m.', C.violet]], C.violet), ...say('ANOTHER FORECAST AT 8:30', C.violet));
  await until(S(41)); await play(
    new M.LaggedStart([new M.Indicate(dawn, { color: C.green }), new M.FadeIn(newChoice)],
      { lagRatio: 0.22, runTime: 1.35 }),
    ...fbox(['Both totals are available', ['$42 was published later', C.green]], C.green),
    ...say('$42 IS THE MORE RECENT TOTAL', C.green));
  await until(S(42)); await play(...clear(newChoice), new M.Create(laterLink),
    ...fbox(['Tuesday 8:30 forecast', ['← Monday total of $42', C.green]], C.green), ...say('8:30 FORECAST USES $42', C.green));
  await until(S(43)); await play(...fbox(['One rule for both forecasts']), ...say('THE RULE'));
  await until(S(44)); await play(...fbox(['Latest matching total', ['Published by prediction time', C.green]], C.green),
    ...say('AVAILABLE AT OR BEFORE THE PREDICTION', C.green));
  await until(S(45)); await play(new M.Indicate(sevenLink, { color: C.green }),
    ...fbox(['Recreate the 7:00 record', ['Use the $34 known then', C.green]], C.green), ...say('RECREATE WHAT WAS KNOWN THEN'));
  await until(S(46)); await play(new M.Indicate(atSeven, { color: C.violet }), new M.Indicate(atEightThirty, { color: C.violet }),
    ...fbox(['Test with past records', ['Use each forecast’s own time', C.green]], C.green), ...say('TEST PREDICTIONS FAIRLY', C.green));

  // 47–52 Using a later revision leaks information into an earlier record.
  const leaked = join(X7, X830, C.pink);
  await until(S(47)); await play(...clear(laterLink, atEightThirty, sevenLink), new M.Indicate(updated, { color: C.pink }), new M.Create(leaked),
    ...fbox(['Always use the latest?', ['$42 is the latest saved total', C.pink]], C.pink), ...say('WHAT IF WE ALWAYS USE THE LATEST?', C.pink));
  await until(S(48)); await play(new M.Indicate(leaked, { color: C.pink }),
    ...fbox(['Tuesday 7:00 forecast', ['← $42 published at 8:30', C.pink]], C.pink), ...say('THE EARLIER FORECAST GETS $42', C.pink));
  await until(S(49)); await play(new M.Indicate(t7, { color: C.violet }), new M.Indicate(t830, { color: C.pink }),
    ...fbox(['At 7:00, only $34 was known', ['$42 was published later', C.pink]], C.pink), ...say('THE COMPUTER COULD ONLY KNOW $34 AT 7:00', C.pink));
  await until(S(50)); await play(new M.Indicate(leaked, { color: C.pink }),
    ...fbox(['Data leakage', ['Use information from later', C.pink]], C.pink), ...say('DATA LEAKAGE', C.pink));
  await until(S(51)); await play(new M.Indicate(atSeven, { color: C.pink }),
    ...fbox(['Extra information in a test', ['The method can look better', C.pink]], C.pink), ...say('LEAKAGE CAN MAKE A TEST MISLEADING', C.pink));
  await until(S(52)); await play(...clear(leaked), ...appear(atEightThirty),
    new M.Create(join(X7, X6, C.green)), new M.Create(join(X830, X830, C.green)),
    ...fbox(['Latest matching total', ['Published by prediction time', C.green]], C.green),
    ...say('MATCH EACH FORECAST TO WHAT WAS KNOWN THEN', C.green));
}

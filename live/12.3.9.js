// 12.3.9 Nested cross-validation: choose and test without mixing (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers: chapters/12.3.md.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const AGE = [1, 2, 3, 4, 5, 6], PRICE = [1000, 600, 800, 700, 300, 500], CARGO = [false, false, true, false, false, true];
  const LAMS = ['0.5', '2', '4', '8'];
  const ROUND = [{ win: 1, inner: '1.5', outer: '2.0' }, { win: 1, inner: '1.6', outer: '1.6' }, { win: 2, inner: '1.7', outer: '2.1' }];
  const CX = P ? 0 : -3.1;
  const PILL = P ? [0, 1.55, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.2, 0] : [3.6, 1.0, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // the six bikes in a row
  const BY = P ? 0.0 : 0.5, SPX = P ? 1.15 : 1.05;
  const bx = k => CX + (k - 2.5) * SPX;
  const bikes = AGE.map((_, k) => {
    let s;
    if (CARGO[k]) { s = new M.Square({ sideLength: 0.42, color: C.cyan, strokeWidth: 3 }); s.setFill(C.cyan, 0.3); }
    else { s = new M.Circle({ radius: 0.22, color: C.cyan, strokeWidth: 3 }); s.setFill(C.cyan, 0.3); }
    s.moveTo([bx(k), BY, 0]); return s;
  });
  const bNum = AGE.map((_, k) => { const t = T(String(k + 1), P ? 19 : 17, C.muted, true, true); t.moveTo([bx(k), BY + 0.45, 0]); return t; });
  const bAge = AGE.map((v, k) => { const t = T(v + ' yr', P ? 16 : 15, C.cyan, true); t.moveTo([bx(k), BY - 0.45, 0]); return t; });
  const bPrice = PRICE.map((v, k) => { const t = T('$' + v, P ? 16 : 15, C.amber, true); t.moveTo([bx(k), BY - (P ? 0.8 : 0.75), 0]); return t; });

  // 0-1 the two wishes
  await until(S(0)); await play(...fbox(['1. best settings', ['for the bike-price model', C.muted]], C.cyan), ...say('FIND THE BEST SETTINGS'));
  await until(S(1)); await play(...fbox(['1. best settings', ['2. how well it predicts', C.amber], ['   prices of NEW bikes', C.amber]], C.amber), ...say('AND: HOW GOOD ON NEW BIKES?', C.amber));

  // 2 six bikes
  await until(S(2)); await play(...unbox(), new M.LaggedStart(bikes.map((b, k) => new M.FadeIn(new M.VGroup(b, bNum[k], bAge[k], bPrice[k]))), { lagRatio: 0.15, runTime: 1.8 }),
    ...say('SIX BIKES: AGE AND PRICE'));

  // 3-7 four penalty weights
  const CHY = P ? -2.0 : -1.45, CHS = P ? 1.4 : 1.25;
  const chips = LAMS.map((s, i) => { const p = pill(s, C.violet, 18); p.moveTo([CX + (i - 1.5) * CHS, CHY, 0]); return p; });
  const chipT = T('penalty weights', P ? 17 : 15, C.violet); chipT.moveTo([CX, CHY + 0.5, 0]);
  await until(S(3)); await play(new M.FadeIn(chipT), ...say('COMPARE 4 PENALTY WEIGHTS', C.violet));
  await until(S(4)); await play(new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.3, runTime: 1.6 }));
  await until(S(5)); await play(...fbox(['test each penalty weight', ['with cross-validation', C.cyan]]), ...say('CROSS-VALIDATION SCORES EACH ONE'));
  await until(S(6)); await play(new M.Indicate(chips[1], { color: C.green }), ...fbox(['choose the penalty weight', ['with the smallest score', C.green]], C.green));
  await until(S(7)); await play(...fbox(['that winning score:', ['also a fair measure', C.pink], ['of the model?', C.pink]], C.pink), ...say('CAN THE WINNING SCORE ALSO GRADE IT?', C.pink));

  // 8-11 the student
  const bikeAll = [...bikes, ...bNum, ...bAge, ...bPrice, ...chips, chipT];
  const SY = P ? -0.6 : 0.0, SX = P ? -2.5 : CX - 2.4;
  const head = new M.Circle({ radius: 0.2, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([SX, SY + 0.5, 0]);
  const body = new M.Arc({ radius: 0.36, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([SX, SY, 0]);
  const ways = [0, 1, 2, 3].map(i => {
    const x = (P ? -0.6 : CX - 0.7) + (i % 2) * (P ? 2.0 : 1.95), y = SY + 0.55 - Math.floor(i / 2) * 0.75;
    const r = new M.RoundedRectangle({ width: 1.75, height: 0.55, cornerRadius: 0.1, color: C.violet, strokeWidth: 2 }); r.moveTo([x, y, 0]);
    const t = T(['flashcards', 'videos', 'notes', 'quizzes'][i], 17, C.violet, true); t.moveTo([x, y, 0]);
    return { r, t, x, y };
  });
  const paper = (label, color, x, y) => {
    const r = new M.Rectangle({ width: 1.9, height: 0.6, color, strokeWidth: 2 }); r.moveTo([x, y, 0]);
    const t = T(label, 17, color); t.moveTo([x, y, 0]); return [r, t];
  };
  const TPY = P ? -2.4 : -1.7;
  const practice = paper('practice test', C.amber, P ? -1.2 : CX - 1.1, TPY);
  const fresh = paper('fresh test', C.green, P ? 1.3 : CX + 1.5, TPY);
  await until(S(8)); await play(new M.FadeOut(new M.VGroup(...bikeAll)), ...unbox(), new M.FadeIn(new M.VGroup(head, body)),
    new M.LaggedStart(ways.map(w => new M.FadeIn(new M.VGroup(w.r, w.t))), { lagRatio: 0.2, runTime: 1.4 }), ...say('A STUDENT TRIES 4 WAYS TO STUDY', C.violet));
  await until(S(9)); await play(new M.FadeIn(new M.VGroup(...practice)), ...say('ONE PRACTICE TEST PICKS THE BEST WAY', C.amber));
  const luck = T('luck?', 18, C.pink, false, true); luck.moveTo([ways[1].x, ways[1].y + 0.5, 0]);
  await until(S(10)); await play(new M.Indicate(ways[1].t, { color: C.green }), new M.FadeIn(luck), ...say('WINNER: PARTLY LUCK ON THAT TEST', C.pink));
  await until(S(11)); await play(new M.FadeIn(new M.VGroup(...fresh)), new M.Indicate(fresh[1], { color: C.green }), ...say('A FRESH TEST TELLS THE TRUTH', C.green));
  await until(S(12)); await play(new M.FadeOut(new M.VGroup(head, body, ...ways.flatMap(w => [w.r, w.t]), ...practice, ...fresh, luck)),
    new M.FadeIn(new M.VGroup(...bikes, ...bNum, ...chips, chipT)), ...say('SAME IDEA FOR OUR BIKE MODEL'));

  // 13-18 three outer folds
  const fRect = (f, color, dashed, pad = 0) => {
    const x0 = bx(2 * f) - 0.48 + pad, x1 = bx(2 * f + 1) + 0.48 - pad, y0 = BY - 0.42 + pad, y1 = BY + 0.72 - pad;
    const mk = (a, b) => dashed ? new M.DashedLine({ start: a, end: b, color }) : new M.Line({ start: a, end: b, color, strokeWidth: 2 });
    return [mk([x0, y0, 0], [x1, y0, 0]), mk([x1, y0, 0], [x1, y1, 0]), mk([x1, y1, 0], [x0, y1, 0]), mk([x0, y1, 0], [x0, y0, 0])];
  };
  const folds = [0, 1, 2].map(f => fRect(f, C.amber, false));
  const fLab = [0, 1, 2].map(f => { const t = T('fold ' + (f + 1), P ? 16 : 15, C.amber); t.moveTo([(bx(2 * f) + bx(2 * f + 1)) / 2, BY - 0.62, 0]); return t; });
  await until(S(13)); await play(...fbox(['6 bikes → 3 folds', ['2 bikes in each', C.amber]], C.amber), ...say('3 FOLDS OF 2 BIKES', C.amber));
  for (let f = 0; f < 3; f++) {
    await until(S(14 + f));
    await play(new M.LaggedStart(folds[f].map(l => new M.Create(l)), { lagRatio: 0.15, runTime: 0.9 }), new M.FadeIn(fLab[f]),
      ...say(`FOLD ${f + 1}: BIKES ${2 * f + 1} AND ${2 * f + 2}`, C.amber));
  }
  await until(S(17)); await play(...fbox(['each fold: a separate test', ['it never helps choose', C.pink], ['the settings', C.pink]], C.amber), ...say('A SEPARATE TEST FOR EACH FOLD', C.amber));
  const outerT = fLab.map((_, f) => { const t = T('outer ' + (f + 1), P ? 16 : 15, C.amber, false, true); t.moveTo([(bx(2 * f) + bx(2 * f + 1)) / 2, BY - 0.62, 0]); return t; });
  await until(S(18)); await play(new M.FadeOut(new M.VGroup(...fLab)), new M.FadeIn(new M.VGroup(...outerT)), ...say('THESE ARE THE OUTER FOLDS', C.amber));

  // 19-21 inner folds, the name
  await until(S(19)); await play(...fbox(['inside each round:', ['another cross-validation', C.violet], ['chooses the settings', C.violet]], C.violet), ...say('A SECOND CROSS-VALIDATION INSIDE', C.violet));
  await until(S(20)); await play(...fbox(['smaller folds that', 'choose the settings', ['= inner folds', C.violet]], C.violet), ...say('INNER FOLDS', C.violet));
  await until(S(21)); await play(...fbox(['nested cross-validation:', ['cross-validation inside', C.green], ['cross-validation', C.green]], C.green), ...say('NESTED CROSS-VALIDATION', C.green));

  // the scoreboard
  const SBX = P ? 0 : 3.6, SBY = P ? -3.45 : -0.6, SDY = P ? 0.56 : 0.42;
  const SCOL = (P ? [-2.6, -0.9, 0.8, 2.5] : [-1.65, -0.55, 0.55, 1.65]).map(x => SBX + x);
  const sbCell = (s, c, r, color) => { const t = T(s, P ? 20 : 17, color, true, r < 0); t.moveTo([SCOL[c], SBY - (r + 1) * SDY, 0]); return t; };
  const sbHead = [['round', C.muted], ['wins', C.violet], ['inner', C.violet], ['outer', C.amber]].map(([s, col], c) => sbCell(s, c, -1, col));
  const sbRule = new M.Line({ start: [SCOL[0] - 0.55, SBY - 0.25 * SDY / 0.45 - 0.0, 0], end: [SCOL[3] + 0.55, SBY - 0.25, 0], color: C.line, strokeWidth: 2 });
  sbRule.moveTo([SBX, SBY - SDY / 2, 0]);
  const inChips = [];

  // 22-40 three rounds
  await until(S(22)); await play(...unbox(), new M.FadeIn(new M.VGroup(...sbHead)), new M.Create(sbRule), ...say('FOLLOW ALL 3 ROUNDS'));
  for (let r = 0; r < 3; r++) {
    const R = ROUND[r], base = r === 0 ? 23 : 26 + 5 * r;
    const rest = [0, 1, 2].filter(f => f !== r);
    const door = new M.RoundedRectangle({ width: bx(1) - bx(0) + 1.0, height: 1.2, cornerRadius: 0.06, color: C.amber, strokeWidth: 3 });
    door.setFill('#3a2c12', 1); door.moveTo([(bx(2 * r) + bx(2 * r + 1)) / 2, BY + 0.15, 0]);
    const knob = new M.Dot({ point: [(bx(2 * r) + bx(2 * r + 1)) / 2 + 0.6, BY + 0.1, 0], radius: 0.07, color: C.amber });
    const doorT = T('closed', 16, C.amber, false, true); doorT.moveTo([(bx(2 * r) + bx(2 * r + 1)) / 2 - 0.1, BY + 0.15, 0]);
    const inner = rest.map(f => fRect(f, C.violet, true, 0.08));
    // hide the outer fold
    await until(S(base));
    await play(new M.FadeIn(new M.VGroup(door, knob, doorT)), new M.FadeOut(new M.VGroup(...inChips)),
      ...fbox([`round ${r + 1}: hide bikes ${2 * r + 1}, ${2 * r + 2}`, ['behind a closed door', C.amber]], C.amber), ...say(`ROUND ${r + 1}: HIDE BIKES ${2 * r + 1} AND ${2 * r + 2}`, C.amber));
    inChips.length = 0;
    const sbR = sbCell(String(r + 1), 0, r, C.muted);
    if (r === 0) {
      await until(S(24)); await play(new M.LaggedStart(inner.flat().map(l => new M.Create(l)), { lagRatio: 0.06, runTime: 1.2 }), new M.FadeIn(sbR),
        ...fbox(['other 4 bikes →', ['2 inner folds of 2', C.violet]], C.violet));
      await until(S(25)); await play(new M.LaggedStart(chips.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.2, runTime: 1.2 }),
        ...fbox(['for each penalty weight:', ['inner fold A tests, then B', C.violet]], C.violet));
      await play(new M.LaggedStart(inner[0].map(l => new M.Indicate(l, { color: C.pink })), { lagRatio: 0.1, runTime: 1.0 }));
      await play(new M.LaggedStart(inner[1].map(l => new M.Indicate(l, { color: C.pink })), { lagRatio: 0.1, runTime: 1.0 }));
      await until(S(26)); await play(new M.LaggedStart(chips.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.25, runTime: 1.6 }),
        ...fbox(['mean inner score', ['for all 4 weights', C.violet]], C.violet), ...say('COMPARE THE 4 MEAN SCORES', C.violet));
    } else {
      await until(S(base + 1)); await play(new M.LaggedStart(inner.flat().map(l => new M.Create(l)), { lagRatio: 0.06, runTime: 1.2 }), new M.FadeIn(sbR),
        new M.LaggedStart(chips.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }),
        ...fbox(['inner cross-validation', ['on the other 4 bikes', C.violet], ['compares all 4 weights', C.violet]], C.violet));
    }
    // the winner
    const wi = R.win, wl = LAMS[wi];
    const wScore = T(R.inner, P ? 19 : 17, C.green, true, true); wScore.moveTo([CX + (wi - 1.5) * CHS, CHY - 0.48, 0]);
    inChips.push(wScore);
    const sbW = sbCell(wl, 1, r, C.violet), sbI = sbCell(R.inner, 2, r, C.violet);
    await until(S(r === 0 ? 27 : base + 2)); await play(new M.Indicate(chips[wi], { color: C.green }), new M.FadeIn(wScore), new M.FadeIn(sbW), new M.FadeIn(sbI),
      ...fbox([`winner: penalty ${wl}`, [`inner score = ${R.inner}`, C.green]], C.green), ...say(`WINNER: PENALTY ${wl}`, C.green));
    // refit on the 4 bikes
    const four = rest.flatMap(f => [bikes[2 * f], bikes[2 * f + 1]]);
    await until(S(r === 0 ? 28 : base + 3)); await play(new M.FadeOut(new M.VGroup(...inner.flat())),
      new M.LaggedStart(four.map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.4 }),
      ...fbox(['fit again on all 4 bikes', [`with penalty ${wl}`, C.violet]], C.cyan), ...say('FIT AGAIN ON THE 4 BIKES'));
    // open the door, test
    const sbO = sbCell(R.outer, 3, r, C.amber);
    const tested = [bikes[2 * r], bikes[2 * r + 1]];
    if (r === 0) {
      await until(S(29)); await play(new M.FadeOut(new M.VGroup(door, knob, doorT)), ...say('OPEN THE DOOR: PREDICT BIKES 1 AND 2', C.amber));
      await play(new M.LaggedStart(tested.map(b => new M.Flash(b, { color: C.amber })), { lagRatio: 0.3, runTime: 1.0 }));
      await until(S(30)); await play(new M.FadeIn(sbO), new M.Indicate(sbO, { color: C.amber }),
        ...fbox(['mean squared error', ['on bikes 1, 2 = 2.0', C.amber], ['= outer score 1', C.amber]], C.amber));
    } else {
      await until(S(base + 4)); await play(new M.FadeOut(new M.VGroup(door, knob, doorT)), new M.FadeIn(sbO),
        new M.LaggedStart(tested.map(b => new M.Flash(b, { color: C.amber })), { lagRatio: 0.3, runTime: 1.0 }),
        ...fbox([`test on bikes ${2 * r + 1}, ${2 * r + 2}`, [`outer score = ${R.outer}`, C.amber]], C.amber), ...say(`OUTER SCORE ${r + 1} = ${R.outer}`, C.amber));
    }
  }

  // 41-42 every bike had a turn
  await until(S(41)); await play(new M.FadeOut(new M.VGroup(...inChips)), new M.LaggedStart(folds.flat().map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.4, runTime: 1.8 }),
    ...unbox(), ...say('EVERY BIKE HAD A TURN BEHIND THE DOOR', C.amber));
  await until(S(42)); await play(...fbox(['bikes behind the door', ['never help choose', C.pink], ['that round\'s settings', C.pink]], C.pink), ...say('HIDDEN BIKES NEVER CHOOSE', C.pink));

  // 43-47 sums and means
  await until(S(43)); await play(...fbox([['inner: the winning scores', C.violet], ['outer: the separate tests', C.amber]]), ...say('INNER WINNERS vs OUTER TESTS'));
  const sumT = sbCell('sum', 0, 3, C.muted), meanT = sbCell('÷ 3', 0, 4, C.muted);
  const sIn = sbCell('4.8', 2, 3, C.violet), mIn = sbCell('1.6', 2, 4, C.violet);
  const sOut = sbCell('5.7', 3, 3, C.amber), mOut = sbCell('1.9', 3, 4, C.amber);
  await until(S(44)); await play(new M.FadeIn(sumT), new M.FadeIn(sIn), ...fbox(['inner: 1.5 + 1.6 + 1.7', ['= 4.8', C.violet]], C.violet));
  await until(S(45)); await play(new M.FadeIn(meanT), new M.FadeIn(mIn), ...fbox(['inner: 4.8 ÷ 3', ['= 1.6', C.violet]], C.violet));
  await until(S(46)); await play(new M.FadeIn(sOut), ...fbox(['outer: 2.0 + 1.6 + 2.1', ['= 5.7', C.amber]], C.amber));
  await until(S(47)); await play(new M.FadeIn(mOut), ...fbox(['outer: 5.7 ÷ 3', ['= 1.9', C.amber]], C.amber));

  // 48-51 the honest score, the formula, the gap
  await until(S(48)); await play(new M.Indicate(mOut, { color: C.amber }), ...fbox(['mean outer score:', ['grades the WHOLE', C.amber], ['choosing process', C.amber]], C.amber), ...say('A SEPARATE, HONEST GRADE', C.amber));
  await until(S(49)); await play(...fbox(['nested CV score', ['= sum of outer scores', C.amber], ['  ÷ number of outer folds', C.amber], ['= 5.7 ÷ 3 = 1.9', C.green]], C.green));
  await until(S(50)); await play(new M.Indicate(mIn, { color: C.pink }), ...say('INNER WINNERS LOOK BETTER', C.pink));
  await until(S(51)); await play(...fbox(['1.9 − 1.6 = 0.3', ['too hopeful by 0.3', C.pink]], C.pink));

  // 52-54 use, trap, recap
  await until(S(52)); await play(...fbox(['two jobs, never mixed:', ['choose settings', C.violet], ['measure performance', C.amber]], C.green), ...say('CHOOSE AND MEASURE WITHOUT MIXING', C.green));
  await until(S(53)); await play(...fbox(['never change settings', ['using outer results', C.pink]], C.pink), ...say('TRAP: OUTER TESTS MUST STAY SEPARATE', C.pink));
  await until(S(54)); await play(...fbox(['inner folds → choose', ['outer folds → test on', C.amber], ['   unseen bikes', C.amber]], C.green), ...say('RECAP: NESTED CROSS-VALIDATION', C.green));
}

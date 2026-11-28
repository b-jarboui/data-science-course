// 16.3.10 Differential privacy. Beat i is sentence i, starting at zero.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  // Phone: pill high, the two lists stacked (left list on top, right list below), formula card at the bottom.
  const PILL = P ? [0, 3.9, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.9, 0] : [4.3, -0.3, 0];
  const LEFT = P ? -100 : CX - 1.72, RIGHT = P ? 100 : CX + 1.72;
  function place(x, row) {
    if (!P) return [x, row, 0];
    if (x < -50) return [x + 100, row * 1.25 + 1.6, 0];
    if (x > 50) return [x - 100, row * 1.25 - 2.9, 0];
    return [x, row * 2.4 - 0.4, 0];
  }
  const SP = P ? 1.2 : 0.72, SW = P ? 1.05 : 0.64;
  const yesColor = C.green, noColor = C.violet;
  const answerColor = answer => answer === 'YES' ? yesColor : noColor;
  const visible = new Map();
  let boxNow = null;

  function label(text, x, row, size = 20, color = C.ink, width = 3.1) {
    const t = T(text, size, color, false, true);
    const scale = Math.min(1, width / t.getWidth());
    t.scale(scale);
    return t.moveTo(place(x, row));
  }

  function frame(x, row, width, height, color, fill = C.card, opacity = 0.94) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    return r.moveTo(place(x, row));
  }

  function tile(text, x, row, width, color, size = 19, height = 0.48) {
    return new M.VGroup(
      frame(x, row, width, height, color),
      label(text, x, row, size, color, width - 0.14)
    );
  }

  function parcel(name, route, stamp, x, row) {
    const routeColor = route === 'North' ? C.cyan : C.pink;
    const k = P ? 1.35 : 1;
    return new M.VGroup(
      frame(x, row, 2.96 * k, 0.61 * k, routeColor),
      label(name, x - 0.94 * k, row, P ? 21 : 20, C.ink, 0.88 * k),
      label(route, x - 0.12 * k, row, P ? 19 : 17, routeColor, 0.72 * k),
      label(stamp, x + 0.89 * k, row, P ? 19 : 18, stamp === 'Late' ? C.amber : C.ink, 0.93 * k)
    );
  }
  const big = g => { g.scale(1.3); return g; };
  const listBox = x => frame(x, -0.065, P ? 4.6 : 3.2, P ? 2.0 : 1.6, C.muted, C.card, 0.35);

  function put(key, object) {
    const previous = visible.get(key);
    const animations = previous ? [new M.FadeOut(previous, { runTime: 0.24 })] : [];
    if (object) {
      visible.set(key, object);
      animations.push(new M.FadeIn(object, { runTime: 0.42 }));
    } else {
      visible.delete(key);
    }
    return animations;
  }

  const clear = () => [...visible.keys()].flatMap(key => put(key));
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 19 : 18);

  function formula(lines = [], color = C.cyan) {
    const animations = boxNow ? [new M.FadeOut(boxNow, { runTime: 0.24 })] : [];
    boxNow = null;
    if (!lines.length) return animations;
    const lh = 0.42;
    const text = lines.map((line, i) => T(line, P ? 22 : 21, i === lines.length - 1 ? color : C.ink, true));
    const width = Math.max(...text.map(t => t.getWidth())) + 0.52;
    const height = lines.length * lh + 0.32;
    const rect = new M.RoundedRectangle({ width, height, cornerRadius: 0.15, color, strokeWidth: 2 });
    rect.setFill(C.card, 0.95);
    rect.moveTo(BOXP);
    text.forEach((t, i) => t.moveTo([
      BOXP[0] - width / 2 + 0.26 + t.getWidth() / 2,
      BOXP[1] + (text.length - 1) * lh / 2 - i * lh,
      0
    ]));
    boxNow = new M.VGroup(rect, ...text);
    boxNow.scale(Math.min(1, (P ? FW - 1.2 : 4.0) / width));
    animations.push(new M.FadeIn(boxNow, { runTime: 0.42 }));
    return animations;
  }

  function headers(left = 'Without Sage', right = 'With Sage') {
    return new M.VGroup(label(left, LEFT, 1.02), label(right, RIGHT, 1.02));
  }

  function truth(answer, x, row) {
    return tile(`True answer: ${answer}`, x, row, P ? 3.6 : 2.94, answerColor(answer), P ? 20 : 18);
  }

  function bagSlips(answers, x, row) {
    return new M.VGroup(...answers.map((answer, i) =>
      tile(answer, x + (i - 1.5) * SP, row, SW, answerColor(answer), P ? 19 : 16, P ? 0.6 : 0.48)
    ));
  }

  function bagPair() {
    return new M.VGroup(
      headers(),
      bagSlips(['YES', 'NO', 'NO', 'NO'], LEFT, 0.13),
      bagSlips(['YES', 'YES', 'YES', 'NO'], RIGHT, 0.13)
    );
  }

  function slipOutline(x, first, count, color) {
    return frame(x + (first + (count - 1) / 2 - 1.5) * SP, 0.13,
      (count - 1) * SP + SW + 0.05, P ? 0.74 : 0.62, color, C.bg, 0);
  }

  function countLabel(text, x, color) {
    return label(text, x, -0.59, 21, color);
  }

  function pairFactors(leftTitle, rightTitle, leftFactor, rightFactor) {
    return new M.VGroup(
      headers(leftTitle, rightTitle),
      tile(leftFactor, LEFT, 0.08, 2.82, C.amber),
      tile(rightFactor, RIGHT, 0.08, 2.82, C.green)
    );
  }

  function coins() {
    return new M.VGroup(...['HEADS', 'TAILS'].map((face, i) => {
      const x = i === 0 ? LEFT : RIGHT;
      const coin = new M.Circle({ radius: P ? 0.85 : 0.65, color: C.amber, strokeWidth: 3 });
      coin.setFill(C.card, 0.96);
      coin.moveTo(place(x, 0.28));
      return new M.VGroup(coin, label(face, x, 0.28, P ? 20 : 17, C.amber, P ? 1.45 : 1.12));
    }));
  }

  function coinAnswers() {
    return new M.VGroup(
      tile('YES', LEFT, -0.71, 1.6, yesColor),
      tile('NO', RIGHT, -0.71, 1.6, noColor)
    );
  }

  function methods(bagText, coinText) {
    return new M.VGroup(
      headers('Four-slip bag', 'Fair coin'),
      tile(bagText, LEFT, 0.15, 2.85, C.amber),
      tile(coinText, RIGHT, 0.15, 2.85, C.green)
    );
  }

  // 0–8: the question and two private lists.
  await until(S(0)); await play(...say('PRIVATE DELIVERY LIST'),
    ...put('nell', big(parcel('Nell', 'North', '', CX, 0.34))));
  await until(S(1)); await play(...say('LATE = MISSED THE PROMISED TIME', C.amber),
    ...put('nell', big(parcel('Nell', 'North', 'Late', CX, 0.34))));
  await until(S(2)); await play(...say('PUBLIC QUESTION'),
    ...put('question', tile('Were 2 or more parcels late?', CX, -0.55, 5.5, C.cyan, 23)));
  await until(S(3)); await play(...say('COULD THE ANSWER REVEAL SAGE?', C.pink),
    ...put('sage', big(parcel('Sage', 'South', '?', CX, -1.45))));
  await until(S(4)); await play(...clear(), ...say('TWO PRIVATE LISTS'), ...put('heads', headers()),
    ...put('listL', listBox(LEFT)), ...put('listR', listBox(RIGHT)),
    ...put('leftNell', parcel('Nell', 'North', 'Late', LEFT, 0.30)),
    ...put('rightNell', parcel('Nell', 'North', 'Late', RIGHT, 0.30)));
  await until(S(5)); await play(new M.Indicate(visible.get('leftNell'), { color: C.amber, runTime: 0.6 }),
    ...say('NELL IS THE ONLY LATE PARCEL', C.amber));
  await until(S(6)); await play(...put('rightSage', parcel('Sage', 'South', 'Late', RIGHT, -0.43)),
    ...say('ADD SAGE’S LATE PARCEL', C.pink));
  await until(S(7)); await play(...say('NELL IS THE SAME IN BOTH LISTS'),
    new M.Indicate(visible.get('leftNell'), { color: C.cyan, runTime: 0.6 }),
    new M.Indicate(visible.get('rightNell'), { color: C.cyan, runTime: 0.6 }));
  await until(S(8)); await play(...say('TRUE ANSWERS', C.amber), ...put('truths', new M.VGroup(
    truth('NO', LEFT, -1.37), truth('YES', RIGHT, -1.37)
  )));

  // 9–13: build the bag, then show one possible draw.
  const slipX = i => CX + (i - 1.5) * 1.42;
  const emptySlips = Array.from({ length: 4 }, (_, i) => tile('', slipX(i), 0.15, 1.22, C.muted, 19, 0.64));
  await until(S(9));
  const bag = frame(CX, 0.15, 6.21, 1.24, C.muted, C.card, 0.7);
  await play(...clear(), ...say('FOUR SLIPS IN THE BAG'), ...put('bag', bag),
    new M.LaggedStart(emptySlips.map(slip => new M.FadeIn(slip, { runTime: 0.28 })),
      { lagRatio: 0.27, runTime: 0.67 }));
  emptySlips.forEach((slip, i) => visible.set(`blank${i}`, slip));
  await until(S(10)); await play(...say('THREE KEEP THE TRUE ANSWER', C.green),
    ...emptySlips.slice(0, 3).flatMap((_, i) => [
      ...put(`blank${i}`), ...put(`rule${i}`, tile('KEEP', slipX(i), 0.15, 1.22, C.green, 19, 0.64))
    ]));
  await until(S(11)); await play(...say('ONE SWITCHES THE ANSWER', C.amber),
    ...put('blank3'), ...put('rule3', tile('SWITCH', slipX(3), 0.15, 1.22, C.amber, 17, 0.64)),
    ...formula(['NO → YES', 'YES → NO'], C.amber));
  await until(S(12)); await play(...say('EACH SLIP HAS THE SAME CHANCE'), ...formula(),
    ...put('chances', new M.VGroup(...emptySlips.map((_, i) =>
      label('1 in 4', slipX(i), -0.76, 18, C.cyan, 1.22)
    ))));
  await until(S(13)); await play(...say('DRAW ONE SLIP · SHARE ONLY ITS ANSWER'),
    ...put('chances'),
    new M.Indicate(visible.get('rule3'), { color: C.amber, runTime: 0.65 }),
    ...put('release', tile('Public answer: YES', CX, -1.07, 4.1, yesColor, 22)),
    ...formula(['Example: true answer NO', 'Draw SWITCH → share YES'], yesColor));

  // 14–24: compare the same public answer in each list.
  await until(S(14)); await play(...clear(), ...formula(), ...put('pair', bagPair()),
    ...say('COMPARE YES WITH YES', yesColor));
  await until(S(15)); await play(...put('leftMark', slipOutline(LEFT, 0, 1, yesColor)),
    ...put('leftCount', countLabel('1 out of 4', LEFT, yesColor)), ...say('YES WITHOUT SAGE', yesColor));
  await until(S(16)); await play(...put('rightMark', slipOutline(RIGHT, 0, 3, yesColor)),
    ...put('rightCount', countLabel('3 out of 4', RIGHT, yesColor)), ...say('YES WITH SAGE', yesColor));
  await until(S(17)); await play(...say('SAME TOTAL OF FOUR SLIPS'),
    ...formula(['Compare (3/4) to (1/4)', 'Divide the counts: 3 ÷ 1'], yesColor));
  await until(S(18)); await play(...say('DIVIDE THE YES COUNTS', yesColor), ...formula(['3 ÷ 1 = 3'], yesColor));
  await until(S(19)); await play(...say('YES IS 3 TIMES AS LIKELY WITH SAGE', yesColor),
    new M.Indicate(visible.get('rightCount'), { color: yesColor, runTime: 0.55 }));
  await until(S(20)); await play(...put('leftMark'), ...put('rightMark'),
    ...put('leftCount'), ...put('rightCount'), ...formula(), ...say('COMPARE NO WITH NO', noColor));
  await until(S(21)); await play(...put('leftMark', slipOutline(LEFT, 1, 3, noColor)),
    ...put('leftCount', countLabel('3 out of 4', LEFT, noColor)), ...say('NO WITHOUT SAGE', noColor));
  await until(S(22)); await play(...put('rightMark', slipOutline(RIGHT, 3, 1, noColor)),
    ...put('rightCount', countLabel('1 out of 4', RIGHT, noColor)), ...say('NO WITH SAGE', noColor));
  await until(S(23)); await play(...say('NO IS 3 TIMES AS LIKELY WITHOUT SAGE', noColor),
    ...formula(['(3/4) ÷ (1/4) = 3'], noColor));
  await until(S(24)); await play(...say('THREE IS THE FACTOR', C.amber), ...formula(['Factor = 3'], C.amber));

  // 25–31: a change that leaves the answer alone, then the worst case.
  await until(S(25)); await play(...clear(), ...formula(), ...say('ADD OAK, AN ON-TIME PARCEL'),
    ...put('oakPair', new M.VGroup(
      headers('Without Oak', 'With Oak'),
      parcel('Nell', 'North', 'Late', LEFT, 0.30),
      parcel('Nell', 'North', 'Late', RIGHT, 0.30),
      parcel('Oak', 'North', 'On time', RIGHT, -0.43),
      truth('NO', LEFT, -1.37), truth('NO', RIGHT, -1.37)
    )));
  await until(S(26)); await play(...clear(), ...say('SAME CHANCES ON BOTH LISTS', C.green),
    ...put('oakBags', new M.VGroup(
      headers('Without Oak', 'With Oak'),
      bagSlips(['YES', 'NO', 'NO', 'NO'], LEFT, 0.13),
      bagSlips(['YES', 'NO', 'NO', 'NO'], RIGHT, 0.13)
    )),
    ...formula(['YES: (1/4) ÷ (1/4) = 1', 'NO:  (3/4) ÷ (3/4) = 1'], C.green));
  await until(S(27)); await play(...clear(), ...formula(), ...say('ADD OR REMOVE ONE PARCEL'),
    ...put('cases', new M.VGroup(
      headers('True answer changes', 'True answer stays'),
      tile('NO ↔ YES', LEFT, 0.08, 2.75, C.amber),
      tile('NO ↔ NO or YES ↔ YES', RIGHT, 0.08, 2.98, C.green, 17)
    )));
  await until(S(28)); await play(...say('CHECK BOTH ANSWERS AND ALL PAIRS'),
    ...put('cases', pairFactors('True answer changes', 'True answer stays', 'YES: 3 · NO: 3', 'YES: 1 · NO: 1')),
    ...formula(['Use the largest factor'], C.amber));
  await until(S(29)); await play(...say('LARGEST FACTOR FOR THE BAG', C.amber),
    new M.Indicate(visible.get('cases').submobjects[1], { color: C.amber, runTime: 0.55 }),
    ...formula(['Largest factor = 3'], C.amber));
  await until(S(30)); await play(...say('DIFFERENTIAL PRIVACY'),
    ...formula(['One parcel · one answer', 'Factor is at most 3'], C.amber));
  const ruleTile = (text, i) => tile(text, slipX(i), 0.13, 1.22,
    text === 'KEEP' ? C.green : C.amber, text === 'KEEP' ? 19 : 17, 0.60);
  await until(S(31)); await play(...clear(), ...say('THE BAG GIVES A CLUE', C.amber),
    ...put('bagRule', new M.VGroup(...['KEEP', 'KEEP', 'KEEP', 'SWITCH'].map(ruleTile))),
    ...formula(['True answer: 3 out of 4'], C.amber));

  // 32–37: a coin gives the same chances on either list.
  await until(S(32)); await play(...clear(), ...formula(), ...say('FLIP A FAIR COIN WITHOUT THE LIST'),
    ...put('coin', coins()));
  await until(S(33)); await play(...say('HEADS GIVES YES · TAILS GIVES NO'), ...put('coinAnswers', coinAnswers()));
  await until(S(34)); await play(...say('SAME CHANCES ON EITHER LIST'),
    ...put('coinChances', new M.VGroup(
      label('1 in 2', LEFT, -1.34, 20, yesColor),
      label('1 in 2', RIGHT, -1.34, 20, noColor)
    )));
  await until(S(35)); await play(...say('DIVIDE A CHANCE BY ITSELF', C.green),
    ...formula(['(1/2) ÷ (1/2) = 1'], C.green));
  await until(S(36)); await play(...say('THE COIN GIVES NO CLUE ABOUT THE COUNT', C.green),
    ...formula(['Same chance with either list'], C.green));
  await until(S(37)); await play(...clear(), ...formula(), ...say('SMALLER FACTOR · LESS REVEALED', C.green),
    ...put('methods', methods('Factor 3', 'Factor 1')));

  // 38–43: express the factor as a privacy budget.
  await until(S(38)); await play(...say('PRIVACY BUDGET'),
    ...formula(['ε = epsilon'], C.violet));
  await until(S(39)); await play(...say('TAKE THE NATURAL LOG'),
    ...formula(['ε = ln(largest factor)'], C.violet));
  await until(S(40)); await play(...say('WHAT POWER OF e GIVES THE FACTOR?'),
    ...formula(['e raised to ε', '= largest factor'], C.violet));
  await until(S(41)); await play(...say('THE COIN’S EPSILON IS ZERO', C.green),
    ...put('methods', methods('Factor 3', 'Factor 1 · ε = 0')),
    ...formula(['e⁰ = 1', 'ε = ln(1) = 0'], C.green));
  await until(S(42)); await play(...say('THE BAG’S EPSILON IS ABOUT 1.10', C.amber),
    ...put('methods', methods('Factor 3 · ε ≈ 1.10', 'Factor 1 · ε = 0')),
    ...formula(['e raised to 1.10 ≈ 3', 'ε = ln(3) ≈ 1.10'], C.amber));
  await until(S(43)); await play(...clear(), ...say('SHARE A GROUP CLUE WITH A LIMIT'),
    ...put('summary', new M.VGroup(
      headers('Public answer', 'One private parcel'),
      tile('Were 2 or more late?', LEFT, 0.08, 3.08, C.cyan, 18),
      parcel('Sage', 'South', '', RIGHT, 0.08)
    )),
    ...formula(['Bag: one release', 'Largest factor = 3'], C.amber));

  // 44–46: separate draws can give a stronger clue.
  const publicYes = index => tile('YES', CX + (index - 1) * 1.55, 0.18, 1.30, yesColor, 22);
  await until(S(44)); await play(...clear(), ...formula(), ...say('ANOTHER DRAW ADDS ANOTHER ANSWER'),
    ...put('first', publicYes(0)), ...put('second', publicYes(1)));
  await until(S(45)); await play(...say('THREE SEPARATE YES ANSWERS GIVE A STRONGER CLUE', C.amber),
    ...put('third', publicYes(2)),
    ...put('clue', label('A stronger clue that Sage is on the list', CX, -0.78, 20, C.amber, 6.5)));
  await until(S(46)); await play(...clear(), ...say('ONE PARCEL CAN ONLY CHANGE THE CHANCES SO MUCH'),
    ...put('pair', bagPair()),
    ...put('yesChances', new M.VGroup(
      countLabel('YES 1/4 · NO 3/4', LEFT, C.ink),
      countLabel('YES 3/4 · NO 1/4', RIGHT, C.ink)
    )),
    ...formula(['Four-slip bag · one answer', 'Largest factor = 3'], C.amber));
}

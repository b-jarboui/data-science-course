// 13.2.11 Gradient boosting: learning through successive corrections.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const amounts = [10, 10, 10, 10, 2, 2, 2, 2];
  const questions = [
    { name: 'Steady income?', yes: [2, 3, 4, 5] },
    { name: 'Savings?', yes: [1, 3, 4, 6] },
    { name: 'Previous loan repaid?', yes: [1, 2, 4, 7] },
    { name: 'Requested reminders?', yes: [3, 4, 5, 7] },
  ];
  const guesses = [
    [6, 6, 6, 6, 6, 6, 6, 6],
    [4, 8, 8, 8, 8, 4, 4, 4],
    [6, 6, 10, 10, 6, 6, 2, 2],
    [8, 8, 8, 12, 4, 4, 4, 0],
    [9, 9, 7, 11, 3, 5, 3, 1],
    [8.5, 9.5, 7.5, 11.5, 3.5, 4.5, 2.5, 0.5],
  ];
  const losses = [16, 12, 8, 4, 3, 2.75];
  const cols = amounts.map((_, i) => i);
  const high = cols.slice(0, 4), low = cols.slice(4);
  const residuals = n => amounts.map((amount, i) => amount - guesses[n][i]);
  const signed = v => v > 0 ? `+${v}` : String(v).replace('-', '−');
  const yes = q => questions[q].yes.map(n => n - 1);
  const no = q => cols.filter(i => !yes(q).includes(i));
  const residualColor = v => v > 0 ? C.green : v < 0 ? C.pink : C.muted;

  const CX = P ? 0 : -2.6, SP = P ? 0.91 : 0.94;
  const BW = P ? 0.27 : 0.29, PITCH = P ? 0.17 : 0.12;
  const BASE = P ? -2.6 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.5, -0.43, 0];
  const side = P ? 0 : 4.3;
  const colx = i => CX + (i - 3.5) * SP;
  const stackX = (i, predicted) => colx(i) + (predicted ? 1 : -1) * SP * 0.18;
  const say = (s, color = C.cyan) => showA(s, color, PILL);

  function label(s, x, y, size = 18, color = C.ink, maxWidth = Infinity) {
    const t = T(String(s), size, color, true);
    if (t.getWidth() > maxWidth) t.scale(maxWidth / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(x, y, width, height, color, fill = C.card, opacity = 0.94) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function line(x, y, toX, toY, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: [x, y, 0], end: [toX, toY, 0], color, strokeWidth });
  }

  function arrow(x, y, toX, toY, color) {
    const angle = Math.atan2(toY - y, toX - x), head = 0.16;
    const tip = a => line(toX, toY, toX - head * Math.cos(a), toY - head * Math.sin(a), color, 3);
    return new M.VGroup(line(x, y, toX, toY, color, 3), tip(angle - 0.55), tip(angle + 0.55));
  }

  const layers = new Map();
  function swap(key, next = null, runTime = 0.36) {
    const old = layers.get(key);
    layers.set(key, next);
    return [
      ...(old ? [new M.FadeOut(old, { runTime })] : []),
      ...(next ? [new M.FadeIn(next, { runTime })] : []),
    ];
  }

  function fbox(lines, color = C.cyan) {
    const [x, y] = BOXP, size = P ? 22 : 21, lh = P ? 0.35 : 0.34;
    const limit = P ? FW - 0.8 : 4.6;
    // One shared scale; widths are tracked here because getWidth() ignores a later scale().
    const texts = lines.map(row => {
      const [s, c] = Array.isArray(row) ? row : [row, C.ink];
      return T(s, size, c, true);
    });
    const raw = texts.map(t => t.getWidth());
    const k = Math.min(1, (limit - 0.58) / Math.max(...raw));
    if (k < 1) texts.forEach(t => t.scale(k));
    const w = Math.max(...raw) * k + 0.58;
    const h = texts.length * lh + 0.28;
    texts.forEach((t, i) => t.moveTo([x - w / 2 + 0.29 + raw[i] * k / 2, y + ((texts.length - 1) / 2 - i) * lh, 0]));
    return swap('formula', new M.VGroup(rect(x, y, w, h, color), ...texts));
  }

  const hide = a => new M.FadeOut(a, { runTime: 0.34 });
  const reveal = a => new M.FadeIn(a, { runTime: 0.38 });
  const focus = (objects, color = C.amber) => objects.map(a => new M.Indicate(a, { color, runTime: 0.65 }));

  function card(i, value, y = BASE - 0.24) {
    const x = colx(i), marked = value !== undefined;
    const color = marked ? (value === 10 ? C.cyan : C.amber) : C.muted;
    const ys = marked ? y + 0.31 : y;
    const pieces = [rect(x, ys, SP - 0.11, marked ? 0.86 : 0.36, color),
      label(`#${i + 1}`, x, marked ? ys + 0.22 : ys, 17, C.ink, SP - 0.19)];
    if (marked) {
      const px = x - 0.16, py = ys - 0.17;
      const mark = value === 10
        ? new M.Circle({ radius: 0.095, color })
        : new M.Rectangle({ width: 0.17, height: 0.17, color });
      mark.setFill(color, 0.35);
      mark.moveTo([px, py, 0]);
      const glyph = value === 10
        ? [line(px - 0.05, py, px - 0.012, py - 0.038, color), line(px - 0.012, py - 0.038, px + 0.06, py + 0.044, color)]
        : [line(px - 0.05, py, px + 0.05, py, color)];
      pieces.push(mark, ...glyph, label(value, x + 0.14, py, 18, color, 0.32));
    }
    return new M.VGroup(...pieces);
  }

  function stack(i, amount, predicted) {
    const x = stackX(i, predicted), color = predicted ? C.violet : C.cyan;
    const blocks = Array.from({ length: Math.ceil(amount) }, (_, j) => {
      const part = Math.min(1, amount - j);
      const b = new M.Rectangle({ width: BW, height: PITCH * 0.76 * part, color, strokeWidth: 1 });
      b.setFill(color, 0.82);
      b.moveTo([x, BASE + (j + part / 2) * PITCH, 0]);
      return b;
    });
    const number = label(amount, x, BASE + amount * PITCH + 0.15, 17, color, SP * 0.36 - 0.015);
    return { group: new M.VGroup(...blocks, number), number };
  }

  const original = amounts.map((amount, i) => stack(i, amount, false));
  const numbered = cols.map(i => card(i));
  const displays = { actual: false, cards: false, legend: false };
  let predicted = [];
  let differences = [];

  function legend(withPrediction) {
    const y = P ? -0.16 : -0.40;
    const objs = withPrediction
      ? [label('■ Actual', CX - 1.24, y, 19, C.cyan), label('■ Predicted', CX + 1.24, y, 19, C.violet)]
      : [label('■ Actual repayment', CX, y, 19, C.cyan)];
    displays.legend = true;
    return swap('legend', new M.VGroup(...objs));
  }

  function actualStacks() {
    displays.actual = true;
    const floor = line(colx(0) - SP / 2, BASE, colx(7) + SP / 2, BASE, C.line);
    return [...swap('floor', floor), ...original.map(st => reveal(st.group))];
  }

  function appCards() {
    displays.cards = true;
    return numbered.map(reveal);
  }

  function predictionSlots() {
    predicted = cols.map(i => {
      const x = stackX(i, true);
      const number = label('?', x, BASE + 0.22, 17, C.violet);
      return { group: number, number };
    });
    return predicted.map(st => reveal(st.group));
  }

  function predict(values, which = cols) {
    return which.flatMap(i => {
      const next = stack(i, values[i], true), old = predicted[i];
      predicted[i] = next;
      return [...(old ? [hide(old.group)] : []), reveal(next.group)];
    });
  }

  function clearDifferences() {
    const out = differences.map(hide);
    differences = [];
    return out;
  }

  function showDifferences(values) {
    const out = clearDifferences();
    const y = BASE - (P ? 0.61 : 0.49);
    differences = values.map((v, i) => label(signed(v), colx(i), y, 19, residualColor(v), SP - 0.12));
    return [...out, ...differences.map(reveal)];
  }

  function clearStacks() {
    const out = [...clearDifferences(), ...predicted.map(st => hide(st.group))];
    predicted = [];
    if (displays.actual) out.push(...original.map(st => hide(st.group)), ...swap('floor'));
    if (displays.cards) out.push(...numbered.map(hide));
    if (displays.legend) out.push(...swap('legend'));
    displays.actual = displays.cards = displays.legend = false;
    return out;
  }

  function changeArrows(indices, up) {
    const color = up ? C.green : C.pink;
    const arrows = indices.map(i => {
      const x = colx(i), y = P ? -0.04 : -0.27;
      return arrow(x, y, x, y + (up ? 0.30 : -0.24), color);
    });
    return swap('arrows', new M.VGroup(...arrows));
  }

  function tree(q, branches = {}) {
    const top = P ? 1.60 : 1.45, bottom = P ? 0.61 : 0.61;
    const dist = P ? 1.61 : 1.02, width = P ? 2.82 : 1.88;
    const name = q == null ? 'One question' : questions[q].name;
    const parts = [
      rect(side, top, P ? 3.48 : 3.65, 0.37, C.violet),
      label(name, side, top, 19, C.violet, P ? 3.22 : 3.36),
    ];
    ['Yes', 'No'].forEach((answer, i) => {
      const x = side + (i ? dist : -dist), detail = branches[answer];
      const color = i ? C.pink : C.green;
      parts.push(line(side, top - 0.19, x, bottom + 0.29, color),
        rect(x, bottom, width, 0.57, color),
        label(detail ? `${answer} · ${detail.ids}` : answer, x, bottom + (detail ? 0.12 : 0), 16, color, width - 0.18));
      if (detail) parts.push(label(detail.text, x, bottom - 0.12, 16, C.ink, width - 0.18));
    });
    return swap('tree', new M.VGroup(...parts));
  }

  function branch(q, answer, text) {
    return { ids: (answer === 'Yes' ? yes(q) : no(q)).map(i => i + 1).join(' '), text };
  }

  const list = (v, indices) => indices.map(i => signed(v[i])).join('  ');
  const r0 = residuals(0), r1 = residuals(1), r2 = residuals(2);
  const q0yes = { Yes: branch(0, 'Yes', list(r0, yes(0))) };
  const q1yes = { Yes: branch(1, 'Yes', list(r1, yes(1))) };
  const corrections = (q, yup, nope) => ({
    Yes: branch(q, 'Yes', signed(yup)), No: branch(q, 'No', signed(nope)),
  });

  const GX = P ? -3.04 : 2.6, GY = P ? -5.06 : -3.35;
  const GW = P ? 6.08 : 4.2, GH = P ? 1.26 : 1.6;
  const chartX = i => GX + 0.19 + i * (GW - 0.30) / 5;
  const chartY = v => GY + v * GH / 16;
  const point = i => [chartX(i), chartY(losses[i]), 0];
  let lossPoints = [], segments = [];

  function chart() {
    const size = P ? 17 : 16;
    return swap('axes', new M.VGroup(
      label('Mean squared error', GX + GW / 2, GY + GH + 0.32, size, C.amber),
      line(GX, GY, GX + GW + 0.14, GY),
      line(GX, GY, GX, GY + GH + 0.15),
      ...losses.map((_, i) => label(i, chartX(i), GY - 0.2, size, C.muted)),
      label('Trees', GX + GW / 2, GY - 0.45, size, C.muted),
    ));
  }

  function pointAt(i) {
    const [x, y] = point(i);
    const dot = new M.Dot({ radius: 0.053, color: C.amber });
    dot.setFill(C.amber, 1);
    dot.moveTo([x, y, 0]);
    return new M.VGroup(dot, label(losses[i], x + 0.12, y + 0.2, 16, C.amber));
  }

  function plot(i) {
    const next = pointAt(i);
    lossPoints.push(next);
    if (i === 0) return [reveal(next)];
    const [x, y] = point(i - 1), [nx, ny] = point(i);
    const edge = line(x, y, nx, ny, C.amber, 3);
    segments.push(edge);
    return [new M.Create(edge, { runTime: 0.36 }), reveal(next)];
  }

  function hideChart() {
    const out = [...swap('axes'), ...lossPoints.map(hide), ...segments.map(hide)];
    lossPoints = [];
    segments = [];
    return out;
  }

  function application(x, y, title, detail, color = C.cyan) {
    return new M.VGroup(rect(x, y, 2.68, 1.06, color),
      label(title, x, y + 0.22, 19, color, 2.42),
      label(detail, x, y - 0.21, 20, C.ink, 2.42));
  }

  await until(S(0));
  await play(...swap('main', application(CX, P ? -0.06 : -0.34, 'New application', 'Repayment ?')), ...say('PREDICT REPAYMENT'));
  await until(S(1));
  let loanCards = cols.map(i => card(i, undefined, BASE + 1.12));
  await play(...swap('main'), new M.LaggedStart(loanCards.map(reveal), { lagRatio: 0.10, runTime: 1.15 }),
    ...say('EIGHT PAST APPLICATIONS'));
  function markLoans(indices) {
    return indices.flatMap(i => {
      const old = loanCards[i], next = card(i, amounts[i], BASE + 0.81);
      loanCards[i] = next;
      return [hide(old), reveal(next)];
    });
  }
  await until(S(2)); await play(...markLoans(high), ...say('APPLICATIONS 1–4 REPAID 10'));
  await until(S(3)); await play(...markLoans(low), ...say('APPLICATIONS 5–8 REPAID 2', C.amber));
  await until(S(4)); await play(...say('CAN SMALL CORRECTIONS HELP?', C.violet));

  await until(S(5));
  await play(...loanCards.map(hide), ...actualStacks(), ...appCards(), ...legend(false), ...say('ONE BLOCK = ONE UNIT'));
  await until(S(6)); await play(...predictionSlots(), ...legend(true), ...say('ADD A PREDICTION BESIDE EACH'));
  await until(S(7));
  await play(...predict(guesses[0]), ...fbox(['Total repaid = 48', ['Mean = 48 ÷ 8 = 6', C.violet]]), ...say('START WITH THE MEAN'));
  await until(S(8));
  await play(...focus(high.map(i => predicted[i].number)), ...fbox([['10 − 6 = 4 too low', C.green]]), ...say('FIRST FOUR: TOO LOW', C.green));
  await until(S(9));
  await play(...focus(low.map(i => predicted[i].number)), ...fbox([['6 − 2 = 4 too high', C.pink]]), ...say('LAST FOUR: TOO HIGH', C.pink));
  await until(S(10));
  await play(...showDifferences(r0), ...fbox(['Actual − predicted', '10 − 6 = +4', '2 − 6 = −4']), ...say('SUBTRACT TO FIND THE GAP'));
  await until(S(11));
  await play(...focus(differences, C.cyan), ...fbox([['Residual = actual − predicted', C.cyan]]), ...say('THE GAP IS THE RESIDUAL'));
  await until(S(12));
  await play(...focus(high.map(i => differences[i]), C.green), ...changeArrows(high, true), ...say('POSITIVE: RAISE THE PREDICTION', C.green));
  await until(S(13));
  await play(...focus(low.map(i => differences[i]), C.pink), ...changeArrows(low, false), ...say('NEGATIVE: LOWER THE PREDICTION', C.pink));

  function thermostat(n) {
    const y = P ? -0.13 : -0.56, x = i => CX + (i - 1.5) * 1.33;
    return new M.VGroup(label('Room temperature', CX, y + 0.68, 23, C.ink),
      line(x(0) - 0.35, y, x(3) + 0.35, y),
      ...[18, 19, 20, 21].flatMap((v, i) => [
        line(x(i), y - 0.10, x(i), y + 0.10, i <= n ? C.amber : C.muted),
        label(`${v}°`, x(i), y - 0.30, 21, i === n ? C.amber : C.muted),
        ...(i > 0 && i <= n ? [arrow(x(i - 1) + 0.17, y + 0.32, x(i) - 0.16, y + 0.32, C.amber)] : []),
      ]));
  }

  await until(S(14));
  await play(...clearStacks(), ...swap('arrows'), ...swap('formula'), ...swap('main', thermostat(0)),
    ...say('SMALL TEMPERATURE CHANGES', C.amber));
  for (let i = 1; i <= 3; i++) {
    await until(S(14) + i * 1.25);
    await play(...swap('main', thermostat(i)));
  }
  await until(S(15));
  await play(...swap('main'), ...actualStacks(), ...appCards(), ...legend(true), ...predict(guesses[0]),
    ...showDifferences(r0), ...tree(null), ...say('SMALL TREES SUGGEST CORRECTIONS', C.violet));
  await until(S(16)); await play(...say('GRADIENT BOOSTING', C.violet));
  await until(S(17));
  await play(...swap('tree'), ...fbox(['Square each residual', 'Then take the mean']), ...say('MEAN SQUARED ERROR', C.amber));
  await until(S(18));
  await play(...chart(), ...plot(0), ...fbox(['(+4)² = 16   (−4)² = 16', 'Eight squares of 16', ['Mean squared error = 16', C.amber]]),
    ...say('STARTING ERROR: 16', C.amber));

  // Tree 1: fit the current residuals, show both means, and update each branch.
  await until(S(19));
  await play(...tree(null), ...swap('formula'), ...say('TREE 1: ONE QUESTION', C.violet));
  await until(S(20));
  await play(...focus(differences, C.violet), ...fbox([['Target = current residual', C.violet]]), ...say('FIT THE RESIDUALS', C.violet));
  await until(S(21));
  await play(...tree(0), ...fbox(['Drop in mean squared error', 'A = 4   B = 4   C = 4', 'D = 0   Choose A']), ...say('STEADY INCOME WINS THE TIE', C.violet));
  await until(S(22));
  await play(...tree(0, q0yes), ...focus(yes(0).map(i => differences[i]), C.green),
    ...fbox(['Applications 2, 3, 4, 5', ['+4   +4   +4   −4', C.green]]), ...say('STEADY INCOME: YES', C.green));
  await until(S(23));
  await play(...fbox(['4 + 4 + 4 − 4 = 8', ['8 ÷ 4 = +2', C.green]]),
    ...tree(0, { Yes: branch(0, 'Yes', '+2') }), ...say('MEAN CORRECTION: +2', C.green));
  await until(S(24));
  await play(...tree(0, corrections(0, 2, -2)), ...focus(no(0).map(i => differences[i]), C.pink),
    ...fbox(['Applications 1, 6, 7, 8', '4 − 4 − 4 − 4 = −8', ['−8 ÷ 4 = −2', C.pink]]), ...say('STEADY INCOME: NO', C.pink));
  await until(S(25));
  await play(...clearDifferences(), ...predict(guesses[1], yes(0)),
    ...fbox([['6 + 2 = 8', C.green]]), ...say('ADD 2 TO THE YES GROUP', C.green));
  await until(S(26));
  await play(...predict(guesses[1], no(0)), ...fbox([['6 − 2 = 4', C.pink]]), ...say('SUBTRACT 2 FROM THE NO GROUP', C.pink));
  await until(S(27));
  await play(...plot(1), ...fbox([['Mean squared error: 16 → 12', C.amber]]), ...say('ERROR FALLS TO 12', C.amber));

  // Tree 2: calculate fresh residuals before choosing a split.
  await until(S(28));
  await play(...swap('tree'), ...fbox(['Compare actual and predicted']), ...focus([original[0].number, predicted[0].number]),
    ...say('COMPARE THE UPDATED PREDICTIONS'));
  await until(S(29));
  await play(...showDifferences(r1), ...fbox(['Actual − new prediction', 'App 1: 10 − 4 = +6', 'App 5:  2 − 8 = −6']), ...say('NEW RESIDUALS IN APPLICATION ORDER'));
  await until(S(30));
  await play(...tree(null), ...focus(differences, C.violet), ...fbox([['Target = new residual', C.violet]]), ...say('TREE 2 FITS THE NEW RESIDUALS', C.violet));
  await until(S(31));
  await play(...tree(1), ...swap('formula'), ...say('TREE 2 ASKS ABOUT SAVINGS', C.violet));
  await until(S(32));
  await play(...tree(1, q1yes), ...focus(yes(1).map(i => differences[i]), C.green),
    ...fbox(['Applications 1, 3, 4, 6', ['+6   +2   +2   −2', C.green]]), ...say('SAVINGS: YES', C.green));
  await until(S(33));
  await play(...tree(1, corrections(1, 2, -2)),
    ...fbox([['Yes: (6 + 2 + 2 − 2) ÷ 4 = +2', C.green], ['No:  (2 − 6 − 2 − 2) ÷ 4 = −2', C.pink]]),
    ...say('FIND THE MEAN FOR EACH GROUP'));
  await until(S(34));
  await play(...clearDifferences(), ...predict(guesses[2]), ...fbox(['New predictions, apps 1–8', ['6  6  10  10  6  6  2  2', C.violet]]),
    ...say('APPLY THE SAVINGS CORRECTIONS', C.violet));
  await until(S(35));
  await play(...plot(2), ...fbox([['Mean squared error: 12 → 8', C.amber]]), ...say('ERROR FALLS TO 8', C.amber));

  // Tree 3 and two faster rounds.
  await until(S(36));
  await play(...swap('tree'), ...fbox(['Actual − updated prediction']), ...focus([original[0].number, predicted[0].number]),
    ...say('SUBTRACT AGAIN'));
  await until(S(37));
  await play(...showDifferences(r2), ...fbox(['App 1: 10 − 6 = +4', 'App 3: 10 − 10 = 0', 'App 5:  2 − 6 = −4']),
    ...say('REMAINING RESIDUALS IN APPLICATION ORDER'));
  await until(S(38));
  await play(...tree(2), ...swap('formula'), ...say('TREE 3 ASKS ABOUT PREVIOUS REPAYMENT', C.violet));
  await until(S(39));
  await play(...tree(2, corrections(2, 2, -2)),
    ...fbox([['Yes: (4 + 4 + 0 + 0) ÷ 4 = +2', C.green], ['No:  (0 − 4 − 4 + 0) ÷ 4 = −2', C.pink]]),
    ...say('FIND BOTH MEAN CORRECTIONS'));
  await until(S(40));
  await play(...clearDifferences(), ...predict(guesses[3]),
    ...fbox(['New predictions, apps 1–8', ['8  8  8  12  4  4  4  0', C.violet]]), ...say('APPLY THE REPAYMENT CORRECTIONS', C.violet));
  await until(S(41));
  await play(...plot(3), ...fbox([['Mean squared error: 8 → 4', C.amber]]), ...say('ERROR FALLS TO 4', C.amber));

  await until(S(42));
  await play(...swap('tree'), ...showDifferences(residuals(3)), ...fbox(['Actual − updated prediction']),
    ...say('RECALCULATE, FIT, APPLY', C.violet));
  await until(S(42) + 0.95);
  await play(...tree(3, corrections(3, -1, 1)), ...fbox(['Tree 4 works on these gaps', 'Yes −1   No +1']));
  await until(S(42) + 1.75);
  await play(...clearDifferences(), ...predict(guesses[4]));
  await until(S(42) + 2.55);
  await play(...showDifferences(residuals(4)), ...fbox(['Actual − updated prediction']));
  await until(S(42) + 3.30);
  await play(...tree(0, corrections(0, 0.5, -0.5)), ...fbox(['Tree 5 works on the fresh gaps', 'Yes +0.5   No −0.5']));
  await until(S(42) + 4.15);
  await play(...clearDifferences(), ...predict(guesses[5]));

  await until(S(43));
  await play(...swap('tree'), ...swap('formula'), ...say('FOLLOW THE ERROR CURVE', C.amber),
    new M.LaggedStart(lossPoints.slice(0, 4).map(p => new M.Indicate(p, { color: C.amber, runTime: 0.6 })),
      { lagRatio: 0.85, runTime: 3.0 }));
  await until(S(43) + 4.0); await play(...plot(4));
  await until(S(43) + 5.2); await play(...plot(5));

  function hillside() {
    const coords = [[-3, 0.8], [-2, 0.61], [-1, 0.1], [0, -0.56], [1, -1.08], [2, -1.27], [3, -1.35]];
    const x = i => CX + coords[i][0], y = i => coords[i][1];
    const parts = coords.slice(1).map((_, i) => line(x(i), y(i), x(i + 1), y(i + 1), C.green, 4));
    const head = new M.Circle({ radius: 0.11, color: C.ink });
    head.setFill(C.ink, 0.9);
    head.moveTo([x(2), y(2) + 0.66, 0]);
    return new M.VGroup(...parts, head,
      line(x(2), y(2) + 0.55, x(2), y(2) + 0.25, C.ink, 3),
      line(x(2) - 0.18, y(2) + 0.42, x(2) + 0.17, y(2) + 0.42, C.ink, 3),
      line(x(2), y(2) + 0.25, x(2) - 0.11, y(2) + 0.03, C.ink, 3),
      line(x(2), y(2) + 0.25, x(2) + 0.13, y(2) - 0.05, C.ink, 3),
      arrow(x(2) + 0.28, y(2) + 0.17, x(4), y(4) + 0.19, C.amber),
      // Name the parts: height = loss, the amber arrow = downhill.
      label('High loss', x(0) + 0.2, y(0) + 0.45, 18, C.pink),
      label('Low loss', x(6) - 0.2, y(6) - 0.42, 18, C.green),
      label('Downhill: loss gets smaller', CX + 0.4, y(4) - 0.9, 18, C.amber));
  }

  // For application 1, use the round-one prediction of 4 and the actual amount of 10.
  const px = p => CX - 2.60 + 0.38 * p, py = loss => -2.02 + 0.053 * loss;
  function lossSlope() {
    const parts = [
      line(px(0), py(0), px(14.5), py(0)),
      line(px(0), py(0), px(0), py(53)),
      label('Loss', px(0) - 0.35, py(50), 18, C.muted),
      label('Prediction for application 1', px(7), py(0) - 0.57, 18, C.muted),
    ];
    for (const i of [4, 10]) {
      parts.push(line(px(i), py(0), px(i), py(0) - 0.08),
        label(i, px(i), py(0) - 0.22, 17, C.ink));
    }
    const value = p => (10 - p) ** 2 / 2;
    for (let i = 0; i < 28; i++) {
      const p = i / 2;
      parts.push(line(px(p), py(value(p)), px(p + 0.5), py(value(p + 0.5)), C.cyan, 3));
    }
    const dot = new M.Dot({ radius: 0.075, color: C.amber });
    dot.setFill(C.amber, 1);
    dot.moveTo([px(4), py(18), 0]);
    parts.push(line(px(2.3), py(28.2), px(5.7), py(7.8), C.amber, 3), dot,
      label('Slope here', px(3.3), py(33), 18, C.amber));
    return new M.VGroup(...parts);
  }

  await until(S(44)); await play(...clearStacks(), ...hideChart(), ...swap('main', hillside()), ...say('FIND THE DOWNHILL DIRECTION', C.green));
  await until(S(45));
  await play(...swap('main', lossSlope()), ...say('GRADIENT = SLOPE OF LOSS', C.amber));
  await until(S(46));
  await play(...swap('downhill', arrow(px(4.25), py(15), px(7.4), py(4.2), C.green)),
    ...say('NEGATIVE GRADIENT POINTS DOWNHILL', C.green));
  await until(S(47));
  await play(...fbox(['Fitting loss = ½ × error²', 'Negative gradient = residual', ['App 1: 10 − 4 = +6', C.green]], C.green),
    ...say('FOR THIS LOSS: FIT THE RESIDUAL', C.green));

  function flowRow(items, y, color) {
    const gap = P ? 2.30 : 2.38, width = 1.83;
    const x = i => CX + (i - 1) * gap;
    const parts = items.flatMap(([title, detail], i) => [
      rect(x(i), y, width, 0.78, color),
      label(title, x(i), y + 0.17, 18, color, width - 0.14),
      label(detail, x(i), y - 0.17, 17, C.ink, width - 0.14),
    ]);
    for (let i = 0; i < 2; i++) parts.push(arrow(x(i) + width / 2 + 0.04, y, x(i + 1) - width / 2 - 0.04, y, color));
    return new M.VGroup(...parts);
  }

  await until(S(48));
  await play(...swap('main', flowRow([['Current', 'app 1: 4'], ['New tree', 'adds 2'], ['Updated', 'app 1: 6']], P ? -0.18 : -0.58, C.violet)),
    ...swap('downhill'), ...swap('formula'), ...say('PUT THE UPDATE IN ONE RULE', C.violet));
  await until(S(49));
  await play(...fbox([['New prediction =', C.violet], 'current prediction + tree correction', ['App 1: 4 + 2 = 6', C.violet]]),
    ...say('ADD THE NEW TREE’S CORRECTION', C.violet));
  await until(S(50));
  await play(...swap('main', flowRow([['Mean', 'error 16'], ['Trees 1–3', 'error 4'], ['Trees 1–5', 'error 2.75']], P ? -0.18 : -0.58, C.green)),
    ...swap('formula'), ...say('SMALL TREES IMPROVE THE FIT TOGETHER', C.green));

  function compareMethods() {
    const y = P ? 0.80 : 0.58, first = y - 0.34, second = y - 0.96;
    const labels = [label('Bagging: fit trees separately', CX, y + 0.12, 20, C.cyan)];
    for (let i = 0; i < 3; i++) {
      const x = CX + (i - 1) * 2.25;
      labels.push(label(`Sample ${i + 1}`, x, first, 17, C.ink),
        arrow(x, first - 0.16, x, second + 0.16, C.cyan), label(`Tree ${i + 1}`, x, second, 18, C.cyan));
    }
    const by = P ? -1.62 : -1.90;
    labels.push(label('Boosting: fit each tree to the latest gaps', CX, by + 0.67, 19, C.violet, 7),
      flowRow([['Tree 1', 'updates mean'], ['Tree 2', 'fits gaps after 1'], ['Tree 3', 'fits gaps after 1+2']], by, C.violet));
    return new M.VGroup(...labels);
  }

  await until(S(51));
  await play(...swap('main', compareMethods()), ...say('EACH CORRECTION DEPENDS ON EARLIER TREES', C.violet));
  await until(S(52));
  await play(...swap('main'), ...actualStacks(), ...appCards(), ...legend(true), ...predict(guesses[3]),
    ...fbox(['Application 4 after tree 3', 'Loan amount = 10', ['Predicted repayment = 12', C.amber]]),
    ...say('APP 4: PREDICTED MORE THAN THE LOAN', C.amber));
  await until(S(52) + 1.25);
  await play(...focus([numbered[3], original[3].number, predicted[3].number], C.amber));

  await until(S(53));
  await play(...clearStacks(), ...swap('formula'),
    ...swap('main', new M.VGroup(
      application(CX - 1.60, P ? -0.14 : -0.45, 'Past applications', 'Error fell', C.cyan),
      application(CX + 1.60, P ? -0.14 : -0.45, 'New applications', 'Error unknown', C.amber))),
    ...say('A BETTER HISTORICAL FIT IS NO GUARANTEE', C.amber));
  await until(S(54));
  await play(...swap('main', flowRow([['Measure', 'current gaps'], ['Fit a tree', 'to those gaps'], ['Update', 'predictions']], P ? -0.18 : -0.58, C.violet)),
    ...fbox(['Repeat with the updated predictions', ['Training error: 16 → 2.75', C.amber]]),
    ...say('BOOSTING LEARNS ONE CORRECTION AT A TIME', C.violet));
}

// 13.2.2 Entropy: measuring how uncertain we are.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const ALL = [1, 2, 3, 4, 5, 6, 7, 8];
  const FULL = [1, 2, 3, 4], PART = [5, 6, 7, 8];
  const STEADY = [2, 3, 4, 5], OTHER = [1, 6, 7, 8], MATCH = [3, 4];
  // K enlarges the whole picture; the phone stacks pill, picture and formula box down the full height.
  const K = P ? 1.35 : 1.22;
  const CX = P ? 0 : -2.9, CY = P ? 0.55 : -0.45;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -3.55, 0] : [4.75, -0.3, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 18 : 19);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 21, lh = P ? 0.36 : 0.42;
    const rows = lines.map(line => Array.isArray(line) ? line : [line, C.ink]);
    const labels = rows.map(([text, ink]) => T(text, size, ink, true));
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.66;
    const height = rows.length * lh + 0.36;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    const left = BOXP[0] - width / 2 + 0.33;
    const top = BOXP[1] + (rows.length - 1) * lh / 2;
    labels.forEach((label, i) => label.moveTo([left + label.getWidth() / 2, top - i * lh, 0]));
    const next = new M.VGroup(frame, ...labels);
    const scale = Math.min(1, (P ? FW - 1.0 : 4.2) / width, (P ? 2.4 : 2.0) / height);
    if (scale < 1) {
      next.scale(scale);
      next.moveTo(BOXP);
    }
    const animations = [new M.FadeIn(next)];
    if (boxNow) animations.push(new M.FadeOut(boxNow));
    boxNow = next;
    return animations;
  }

  const point = (x, y) => [CX + x * K, CY + y * K, 0];
  function label(text, x, y, size = 20, color = C.ink, maxWidth = 6.2) {
    const item = T(text, size * K, color, true);
    if (item.getWidth() > maxWidth * K) item.scale(maxWidth * K / item.getWidth());
    item.moveTo(point(x, y));
    return item;
  }

  function tile(x, y, width, height, color, fill = 0, strokeWidth = 2) {
    const shape = new M.RoundedRectangle({ width: width * K, height: height * K, cornerRadius: 0.12 * K, color, strokeWidth });
    if (fill) shape.setFill(color, fill);
    shape.moveTo(point(x, y));
    return shape;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth });
  }

  const spread = (i, count, pitch) => (i - (count - 1) / 2) * pitch;
  const outcome = id => FULL.includes(id) ? 'FULL' : 'PARTIAL';
  const inkFor = id => FULL.includes(id) ? C.cyan : C.pink;

  function card(id, x, y, { hidden = false, neutral = false, marked = false } = {}) {
    const color = hidden ? C.violet : neutral ? C.muted : inkFor(id);
    const face = tile(x, y, 1.04, 0.76, color, 0.18);
    if (hidden || neutral) {
      return new M.VGroup(face, label(hidden ? '?' : String(id), x, y, 21, C.ink, 0.8));
    }
    const number = label(String(id), x, y + 0.15, 19, C.ink, 0.8);
    const kind = label(outcome(id), x, y - 0.18, 15, color, 0.9);
    const parts = [face, number, kind];
    if (marked) parts.push(tile(x, y, 1.16, 0.88, C.amber, 0, 3));
    return new M.VGroup(...parts);
  }

  function deck(ids, title, { neutral = false, mark = [], note } = {}) {
    const twoRows = ids.length > 4;
    const cards = ids.map((id, i) => {
      const x = spread(i % 4, Math.min(ids.length, 4), 1.37);
      const y = twoRows ? (i < 4 ? 0.52 : -0.52) : 0.04;
      return card(id, x, y, { neutral, marked: mark.includes(id) });
    });
    const parts = [label(title, 0, 1.49, 21, C.ink), ...cards];
    if (note) parts.push(label(note, 0, -1.51, 18, C.amber));
    return parts;
  }

  let pictureNow = [];
  function picture(parts) {
    const animations = pictureNow.filter(item => !parts.includes(item)).map(item => new M.FadeOut(item));
    animations.push(...parts.filter(item => !pictureNow.includes(item)).map(item => new M.FadeIn(item)));
    pictureNow = parts;
    return animations;
  }

  function withoutReplacementAnimation(parts) {
    const animations = pictureNow.map(item => new M.FadeOut(item));
    animations.push(new M.LaggedStart(parts.map(item => new M.FadeIn(item)), { lagRatio: 0.08, runTime: 1.3 }));
    pictureNow = parts;
    return animations;
  }

  function groupRow(ids, y, title, result) {
    // Title right-aligned with a clear gap before the first dot; dots never touch.
    // Phone: title above the dots (one row is too wide for the narrow frame).
    const x0 = P ? -2.0 : -0.6, pitch = 0.37;
    const name = label(title, 0, y, 17, C.ink, 2.1);
    if (P) name.moveTo(point(x0 - 0.13 + name.getWidth() / (2 * K), y + 0.36));
    else name.moveTo(point(x0 - 0.3 - name.getWidth() / (2 * K), y));
    const parts = [name];
    ids.forEach((id, i) => parts.push(tile(x0 + i * pitch, y, 0.25, 0.35, inkFor(id), 0.8)));
    if (result) {
      const item = label(result, 0, y, 18, C.amber, 1.6);
      item.moveTo(point(x0 + (ALL.length - 1) * pitch + 0.4 + item.getWidth() / (2 * K), y));
      parts.push(item);
    }
    return new M.VGroup(...parts);
  }

  function groupComparison(results = false) {
    return [
      groupRow(ALL, 1.02, '4 full / 4 partial', results ? '1 bit' : ''),
      groupRow(STEADY, 0, '3 full / 1 partial', results ? '≈ 0.811 bits' : ''),
      groupRow(MATCH, -1.02, '2 full / 0 partial', results ? '0 bits' : ''),
    ];
  }

  function probabilityStrip(share) {
    const cells = Array.from({ length: 4 }, (_, i) =>
      tile(spread(i, 4, 1.1), 0.12, 0.95, 0.74, i < share ? C.amber : C.muted, i < share ? 0.6 : 0.12));
    return [
      label('Share for one outcome', 0, 1.49, 21),
      ...cells,
      label(share === 2 ? '1 out of 2' : '1 out of 4', 0, -0.86, 21, C.amber),
    ];
  }

  // 0–6: see the eight applications, then draw a card without seeing its face.
  const originalTitle = 'All 8 applications';
  const neutral = deck(ALL, originalTitle, { neutral: true });
  await until(S(0));
  await play(...withoutReplacementAnimation(neutral), ...say('EIGHT PAST LOAN APPLICATIONS'));

  const original = deck(ALL, originalTitle, { note: '4 full / 4 partial' });
  await until(S(1));
  await play(...picture(original), ...say('FOUR OF EACH OUTCOME'));

  const bin = tile(0, 0, 6.3, 2.48, C.muted);
  await until(S(2));
  await play(...picture([...original, bin]), ...say('PUT ALL EIGHT CARDS IN THE BOX'));

  const backSpots = ALL.map((_, i) => [spread(i % 4, 4, 1.37), i < 4 ? 0.52 : -0.52]);
  const backs = backSpots.map(([x, y]) => card(null, x, y, { hidden: true }));
  const drawn = backs[3];
  const mixedOrder = [1, 5, 0, 6, 2, 7, 4];
  await until(S(3));
  await play(...picture([original[0], bin, ...backs]), ...say('TURN OVER, MIX, AND DRAW', C.violet));
  await play(new M.LaggedStart(backs.map((back, i) => {
    const [x, y] = backSpots[i];
    const target = i === 3 ? [0, -1.91] : backSpots[mixedOrder[i < 3 ? i : i - 1]];
    return new M.Transform(back, card(null, ...target, { hidden: true }), {
      pathArc: x < target[0] ? -0.45 : 0.45,
      runTime: 0.85,
    });
  }), { lagRatio: 0.06, runTime: 1.4 }));

  const unknown = [
    card(null, 0, 0.76, { hidden: true }),
    label('Full repayment?', -1.54, -0.52, 21, C.cyan, 2.74),
    label('Partial repayment?', 1.54, -0.52, 21, C.pink, 2.74),
  ];
  await until(S(4));
  await play(...picture(unknown), ...say('WHAT WILL THE CARD SHOW?', C.amber));

  await until(S(5));
  await play(...picture(original), ...say('BOTH OUTCOMES ARE EQUALLY LIKELY', C.amber));

  await until(S(6));
  await play(...say('HARD TO GUESS', C.violet), new M.Indicate(original.at(-1), { color: C.violet, runTime: 0.8 }));

  // 7–17: the source groups become progressively more predictable.
  await until(S(7));
  await play(...picture([
    groupRow(STEADY, 0.65, 'Yes'),
    groupRow(OTHER, -0.55, 'No'),
  ]), ...say('DOES THE BORROWER HAVE STEADY INCOME?', C.amber));

  const steadyTitle = 'Steady income: yes';
  await until(S(8));
  await play(...picture(deck(STEADY, steadyTitle, { neutral: true })), ...say('APPLICATIONS 2, 3, 4 AND 5'));

  const steady = deck(STEADY, steadyTitle, { note: '3 full / 1 partial' });
  await until(S(9));
  await play(...picture(steady), ...say('THREE FULL, ONE PARTIAL'));

  const steadyFull = deck(STEADY, steadyTitle, { mark: [2, 3, 4], note: 'Full repayment is more likely' });
  await until(S(10));
  await play(...picture(steadyFull), ...say('DRAW FROM THE YES GROUP', C.amber));

  await until(S(11));
  await play(...say('LESS UNCERTAIN', C.violet), new M.Indicate(steadyFull.at(-1), { color: C.violet, runTime: 0.8 }));

  const matchTitle = 'Applications 3 and 4';
  await until(S(12));
  await play(...picture(deck(MATCH, matchTitle, { neutral: true })), ...say('MAKE A TWO-CARD GROUP'));

  const matching = deck(MATCH, matchTitle, { note: '2 full / 0 partial' });
  await until(S(13));
  await play(...picture(matching), ...say('BOTH REPAID EVERYTHING'));

  await until(S(14));
  await play(...picture(deck(MATCH, matchTitle, { mark: MATCH, note: 'Either card shows full repayment' })),
    ...say('YOU KNOW THE OUTCOME', C.green));

  const comparison = groupComparison();
  await until(S(15));
  await play(...picture(comparison), ...say('EQUALLY MIXED, MOSTLY MATCHING, MATCHING'));

  const compareUnknown = comparison.map((row, i) =>
    label('?', 2.5, 1.02 - i * 1.02, 23, C.amber));
  await until(S(16));
  await play(...picture([...comparison, ...compareUnknown]), ...say('A NUMBER FOR UNCERTAINTY?', C.amber));

  await until(S(17));
  await play(...say('ENTROPY MEASURES UNCERTAINTY', C.violet));

  // 18–31: find the shares, connect a share to surprise, and average the surprises.
  await until(S(18));
  await play(...picture(original), ...say('HOW LIKELY IS EACH OUTCOME?', C.amber));

  await until(S(19));
  await play(...say('PROBABILITY IS A SHARE OF THE CARDS'),
    ...fbox(['cards with the outcome', '÷ all cards in the group']));

  const allFull = deck(ALL, originalTitle, { mark: FULL });
  const allPart = deck(ALL, originalTitle, { mark: PART });
  await until(S(20));
  await play(...picture(allFull), ...say('COUNT THE FULL REPAYMENTS'),
    ...fbox([['Full: 4 out of 8', C.cyan]]));

  await until(S(21));
  await play(...say('ONE HALF OF THE CARDS'), ...fbox([['Full: 4 ÷ 8 = ½ = 0.5', C.cyan]]));

  await until(S(22));
  await play(...picture(allPart), ...say('THE SAME SHARE FOR PARTIAL'),
    ...fbox([['Full: 4 ÷ 8 = 0.5', C.cyan], ['Partial: 4 ÷ 8 = 0.5', C.pink]]));

  const reveal = [
    card(null, 0, 0.84, { hidden: true }),
    label('Full', -1.31, -0.53, 20, C.cyan),
    label('Partial', 1.31, -0.53, 20, C.pink),
    line(-0.21, 0.4, -1.19, -0.25, C.cyan),
    line(0.21, 0.4, 1.19, -0.25, C.pink),
  ];
  await until(S(23));
  await play(...picture(reveal), ...say('HOW SURPRISING IS THE REVEAL?', C.violet));

  await until(S(24));
  await play(...picture(probabilityStrip(2)), ...say('AN OUTCOME THAT HAPPENS HALF THE TIME'),
    ...fbox(['Probability ½', ['Surprise = 1', C.amber]], C.amber));

  await until(S(25));
  await play(...picture([
    tile(-1.39, 0.2, 2.25, 0.76, C.cyan, 0.18),
    tile(1.39, 0.2, 2.25, 0.76, C.pink, 0.18),
    label('Full: ½', -1.39, 0.2, 22, C.cyan),
    label('Partial: ½', 1.39, 0.2, 22, C.pink),
  ]), ...say('ONE BIT FOR TWO EQUALLY LIKELY OUTCOMES'),
    ...fbox([['Surprise = 1 bit', C.amber]], C.amber));

  await until(S(26));
  await play(...picture(probabilityStrip(1)), ...say('AN OUTCOME THAT HAPPENS A QUARTER OF THE TIME'),
    ...fbox(['Probability ¼', ['Surprise = 2 bits', C.amber]], C.amber));

  await until(S(27));
  await play(...say('HALVE PROBABILITY, ADD ONE BIT', C.violet),
    ...fbox(['Probability: ½ → ¼', ['Surprise: 1 → 2 bits', C.amber]], C.amber));

  await until(S(28));
  await play(...picture(original), ...say('AVERAGE SURPRISE BEFORE YOU DRAW', C.violet),
    ...fbox([['Entropy = expected surprise', C.violet]], C.violet));

  await until(S(29));
  await play(...picture(allFull), ...say('HALF THE CARDS GIVE ONE BIT'),
    ...fbox([['Full: ½ of the cards × 1 bit', C.cyan]]));

  await until(S(30));
  await play(...picture(allPart), ...say('THE OTHER HALF ALSO GIVE ONE BIT'),
    ...fbox([['Full: ½ × 1 bit', C.cyan], ['Partial: ½ × 1 bit', C.pink]]));

  await until(S(31));
  await play(...picture(original), ...say('ADD THE TWO SHARES OF SURPRISE', C.green),
    ...fbox(['½ × 1 + ½ × 1', ['Entropy = 1 bit', C.green]], C.green));

  // 32–41: repeat the calculation for the steady-income and matching groups.
  await until(S(32));
  await play(...picture(steadyFull), ...say('BACK TO THE STEADY-INCOME GROUP'),
    ...fbox([['Full: 3 out of 4', C.cyan]]));

  const steadyProbabilities = [['Full: 3 ÷ 4 = 0.75', C.cyan], ['Partial: 1 ÷ 4 = 0.25', C.pink]];
  await until(S(33));
  await play(...picture(steady), ...say('THE TWO SHARES ARE DIFFERENT'), ...fbox(steadyProbabilities));

  await until(S(34));
  await play(...picture(steadyFull), ...say('MORE LIKELY MEANS LESS SURPRISING', C.violet));

  await until(S(35));
  await play(...fbox(['Full: probability 0.75', ['Surprise ≈ 0.415 bits', C.cyan]]),
    ...say('SURPRISE FOR FULL REPAYMENT'));

  const steadyPart = deck(STEADY, steadyTitle, { mark: [5], note: '1 partial out of 4 cards' });
  await until(S(36));
  await play(...picture(steadyPart), ...say('SURPRISE FOR PARTIAL REPAYMENT', C.pink),
    ...fbox(['Partial: probability 0.25', ['Surprise = 2 bits', C.pink]]));

  await until(S(37));
  await play(...picture(steadyFull), ...say('MULTIPLY FULL SURPRISE BY ITS SHARE'),
    ...fbox(['Full contribution', ['0.75 × 0.415 ≈ 0.311', C.cyan]]));

  await until(S(38));
  await play(...picture(steadyPart), ...say('MULTIPLY PARTIAL SURPRISE BY ITS SHARE', C.pink),
    ...fbox(['Partial contribution', ['0.25 × 2 = 0.5', C.pink]]));

  await until(S(39));
  await play(...picture(steady), ...say('ADD THE TWO CONTRIBUTIONS', C.green),
    ...fbox(['0.311 + 0.5', ['Entropy ≈ 0.811 bits', C.green]], C.green));

  await until(S(40));
  await play(...picture(matching), ...say('BOTH CARDS SHOW FULL REPAYMENT'),
    ...fbox([['Full: 2 out of 2', C.cyan]]));

  await until(S(41));
  await play(...say('NO SURPRISE IN EITHER CARD', C.green),
    ...fbox(['Surprise = 0 bits', ['Entropy = 0 bits', C.green]], C.green));

  // 42–48: put the arithmetic into a rule, then compare the three groups.
  await until(S(42));
  await play(...picture(comparison), ...say('A FORMULA FOR THE CALCULATION', C.violet),
    ...fbox(['Find each surprise', 'Multiply by its probability', 'Add the contributions'], C.violet));

  await until(S(43));
  await play(...picture(probabilityStrip(1)), ...say('BASE TWO COUNTS HALVINGS', C.violet),
    ...fbox(['1 → ½ → ¼', 'Two halvings to reach ¼', ['Surprise = −log₂(p)', C.violet]], C.violet));

  await until(S(44));
  await play(...picture(original), ...say('ADD THE PROBABILITY TERMS AND NEGATE', C.violet),
    ...fbox(['p = probability', ['H = −[p(full) log₂(p(full))', C.violet],
      ['    + p(partial) log₂(p(partial))]', C.violet]], C.violet));

  await until(S(45));
  await play(...picture(matching), ...say('A ZERO-PROBABILITY OUTCOME ADDS ZERO', C.violet),
    ...fbox([['Partial: 0 out of 2', C.pink], 'Probability = 0', ['Contribution = 0 bits', C.amber]]));

  const results = groupComparison(true);
  const resultBox = [['4 full / 4 partial: 1 bit', C.green],
    ['3 full / 1 partial: ≈ 0.811', C.amber], ['2 full / 0 partial: 0 bits', C.cyan]];
  await until(S(46));
  await play(...picture(results), ...say('ENTROPY FOR THE THREE GROUPS', C.green),
    ...fbox(resultBox, C.green));

  const left = -2.52, right = 2.62, bottom = -1.12, top = 0.94, middle = (left + right) / 2;
  const xFor = p => left + p * (right - left);
  const yFor = h => bottom + h * (top - bottom);
  const entropy = p => p === 0 || p === 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
  const curve = new M.VGroup(...Array.from({ length: 32 }, (_, i) => {
    const p = i / 32, q = (i + 1) / 32;
    return line(xFor(p), yFor(entropy(p)), xFor(q), yFor(entropy(q)), C.cyan, 4);
  }));
  const peak = new M.Dot({ point: point(middle, top), radius: 0.1, color: C.amber });
  const graph = [
    line(left, bottom, right, bottom), line(left, bottom, left, top),
    curve, peak,
    label('1 bit', left - 0.42, top, 17, C.muted, 0.79),
    label('0', left, bottom - 0.29, 17, C.muted),
    label('½', middle, bottom - 0.29, 19, C.amber),
    label('1', right, bottom - 0.29, 17, C.muted),
    label('Probability of full repayment', middle, bottom - 0.71, 17, C.ink),
  ];
  await until(S(47));
  await play(...picture(graph), ...say('HIGHEST WHEN THE OUTCOMES ARE EQUALLY LIKELY', C.amber),
    ...fbox(['Full: ½   Partial: ½', ['Highest entropy = 1 bit', C.amber]], C.amber));

  await until(S(48));
  await play(...picture(results), ...say('DECISION TREES MEASURE THE MIX IN EACH GROUP', C.violet),
    ...fbox(resultBox, C.green));

  // 49–53: agreement can mean either outcome, and a new card stays unknown.
  await until(S(49));
  await play(...picture(deck(PART, 'A group of partial repayments', { note: '0 full / 4 partial' })),
    ...say('AN ALL-PARTIAL GROUP ALSO HAS ZERO ENTROPY', C.pink),
    ...fbox([['Full: 0   Partial: 4', C.pink], ['Entropy = 0 bits', C.green]], C.green));

  const sameOutcome = [
    groupRow(MATCH, 0.65, 'All full', '0 bits'),
    groupRow(PART, -0.59, 'All partial', '0 bits'),
  ];
  await until(S(50));
  await play(...picture(sameOutcome), ...say('ZERO ENTROPY MEANS THE RECORDED OUTCOMES AGREE', C.green),
    ...fbox(['Within each group,', ['all the outcomes match', C.green]], C.green));

  await until(S(51));
  await play(...picture([
    label('Recorded applications', -1.35, 1.13, 20, C.ink, 2.95),
    card(3, -2.02, 0.04), card(4, -0.69, 0.04),
    line(0.35, -0.68, 0.35, 1.31, C.muted),
    label('New application', 1.81, 1.13, 20, C.ink, 2.45),
    card(null, 1.81, 0.04, { hidden: true }),
  ]), ...say('A NEW BORROWER’S OUTCOME IS STILL UNKNOWN', C.amber),
    ...fbox(['Recorded group: 0 bits', ['New outcome: unknown', C.amber]], C.amber));

  await until(S(52));
  await play(...picture([
    label('Which question should split the group?', 0, 1.34, 20),
    tile(0, 0.42, 5.5, 0.63, C.cyan, 0.12),
    label('Does the borrower have steady income?', 0, 0.42, 18, C.cyan, 5.2),
    tile(0, -0.5, 5.5, 0.63, C.pink, 0.12),
    label('Did the borrower request reminders?', 0, -0.5, 18, C.pink, 5.2),
  ]), ...say('NEXT: USE ENTROPY TO COMPARE QUESTIONS', C.violet),
    ...fbox([['Compare the groups each split makes', C.violet]], C.violet));

  await until(S(53));
  await play(...picture(results), ...say('MORE EVENLY MIXED MEANS MORE UNCERTAINTY', C.green),
    ...fbox([['Entropy measures uncertainty', C.green]], C.green));
}

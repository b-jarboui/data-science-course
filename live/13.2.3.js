// 13.2.3 Information gain: choosing a useful question.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  // Phone: pill on top, picture in the middle, formula box underneath (uses the full height).
  const PILL = P ? [0, 3.75, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.35, 0] : [4.3, -0.3, 0];
  const CARD_W = P ? 0.78 : 0.80;
  const HOME_Y = P ? 2.55 : 0.83;
  const HEAD_Y = P ? 1.05 : -0.40;
  const FIRST_Y = P ? 0.10 : -1.15;
  const COUNT_Y = P ? -2.45 : -3.10;
  const FULL = C.cyan;
  const PART = '#fb923c';

  const ids = [1, 2, 3, 4, 5, 6, 7, 8];
  const isFull = id => id <= 4;
  const reminders = [[3, 4, 5, 7], [1, 2, 6, 8]];
  const income = [[2, 3, 4, 5], [1, 6, 7, 8]];
  const tiny = [[1], [2, 3, 4, 5, 6, 7, 8]];
  const lane = side => CX + (side === 0 ? -1.78 : 1.78);
  const home = id => [CX + (id - 4.5) * (P ? 0.88 : 0.91), HOME_Y, 0];
  const spread = home;
  const say = (s, color = C.cyan) => showA(s, color, PILL, P ? 18 : 19);
  const fade = object => new M.FadeIn(object, { runTime: 0.35 });
  const out = object => new M.FadeOut(object, { runTime: 0.30 });
  const stagger = (animations, runTime = 0.85) =>
    new M.LaggedStart(animations, { lagRatio: 0.12, runTime });

  function label(s, size, color, x, y) {
    return T(s, size, color, true).moveTo([x, y, 0]);
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, rowHeight = 0.35;
    const texts = lines.map(line => {
      const [s, ink] = Array.isArray(line) ? line : [line, C.ink];
      return T(s, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.62;
    const height = texts.length * rowHeight + 0.24;
    const bg = new M.RoundedRectangle({ width, height, cornerRadius: 0.15, color, strokeWidth: 2 });
    bg.setFill(C.card, 0.95);
    bg.moveTo(BOXP);
    texts.forEach((t, i) => {
      t.moveTo([BOXP[0] - width / 2 + 0.31 + t.getWidth() / 2,
        BOXP[1] + ((texts.length - 1) / 2 - i) * rowHeight, 0]);
    });
    const group = new M.VGroup(bg, ...texts);
    const limit = P ? FW - 0.9 : 4.45;
    if (width > limit) group.scale(limit / width);
    group.moveTo(BOXP);
    const animations = boxNow ? [out(boxNow), fade(group)] : [fade(group)];
    boxNow = group;
    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];
    const animations = [out(boxNow)];
    boxNow = null;
    return animations;
  }

  function card(id, point, revealed) {
    const color = revealed ? (isFull(id) ? FULL : PART) : C.muted;
    // Every part is placed at absolute coordinates (no group moveTo), so the number stays on its card.
    const [px, py] = point;
    const shell = new M.RoundedRectangle({
      width: CARD_W, height: 0.58, cornerRadius: 0.10, color, strokeWidth: 2,
    });
    shell.setFill(C.card, 0.96);
    shell.moveTo([px, py, 0]);
    const number = label(String(id), P ? 21 : 20, C.ink, px + (revealed ? -0.17 : 0), py);
    if (!revealed) return new M.VGroup(shell, number);

    const marker = isFull(id)
      ? new M.Circle({ radius: 0.13, color, strokeWidth: 2 })
      : new M.Rectangle({ width: 0.24, height: 0.24, color, strokeWidth: 2 });
    marker.setFill(color, 0.95);
    marker.moveTo([px + 0.18, py, 0]);
    const sign = T(isFull(id) ? '✓' : '−', 15, C.bg, false, true).moveTo([px + 0.18, py, 0]);
    return new M.VGroup(shell, number, marker, sign);
  }

  const numbered = ids.map(id => card(id, spread(id), false));
  const cards = ids.map(id => card(id, spread(id), true));

  function move(group, destination) {
    return stagger(group.map((id, index) =>
      new M.Transform(cards[id - 1], card(id, destination(id, index), true), { runTime: 0.65 })));
  }

  function split(groups, side) {
    const group = groups[side];
    const columns = group.length > 4 ? 3 : 2;
    const pitch = P ? 0.79 : 0.65;
    return move(group, (_, index) => {
      const row = Math.floor(index / columns);
      const rowCount = Math.min(columns, group.length - row * columns);
      return [lane(side) + ((index % columns) - (rowCount - 1) / 2) * 0.89,
        FIRST_Y - row * pitch, 0];
    });
  }

  function branch(side, caption = side === 0 ? 'YES' : 'NO') {
    const x = lane(side);
    const line = new M.Line({
      start: [CX, HOME_Y - 0.36, 0], end: [x, HEAD_Y + 0.24, 0],
      color: C.muted, strokeWidth: 2,
    });
    return new M.VGroup(line, label(caption, P ? 19 : 18, C.ink, x, HEAD_Y));
  }

  function counts(group, x, y) {
    const full = group.filter(isFull).length;
    const partial = group.length - full;
    const a = T(`${full} full`, P ? 19 : 17, FULL, true), b = T(`${partial} partial`, P ? 19 : 17, PART, true);
    a.moveTo([x - 0.1 - a.getWidth() / 2, y, 0]);
    b.moveTo([x + 0.1 + b.getWidth() / 2, y, 0]);
    return new M.VGroup(a, b);
  }

  function emphasis(group, color) {
    return stagger(group.map(id =>
      new M.Indicate(cards[id - 1], { color, scaleFactor: 1.10, runTime: 0.55 })), 0.68);
  }

  let paths = [null, null];
  let totals = [null, null];
  let aside = [];

  function openPath(groups, side, caption) {
    paths[side] = branch(side, caption);
    return [fade(paths[side]), split(groups, side)];
  }

  function showCount(groups, side) {
    const animations = totals[side] ? [out(totals[side])] : [];
    totals[side] = counts(groups[side], lane(side), COUNT_Y);
    return [...animations, fade(totals[side])];
  }

  function clearSplit() {
    const animations = [...paths, ...totals].filter(Boolean).map(out);
    paths = [null, null];
    totals = [null, null];
    return animations;
  }

  function showAside(...objects) {
    const animations = [...aside.map(out), ...objects.map(fade)];
    aside = objects;
    return animations;
  }

  function uncertaintyRow(caption, value, valueText, y, color) {
    const trackX = CX + 0.40, width = 1.44;
    const track = new M.Rectangle({ width, height: 0.15, color: C.muted, strokeWidth: 1 });
    track.setFill(C.line, 0.8);
    track.moveTo([trackX, y, 0]);
    const bar = new M.Rectangle({ width: width * value, height: 0.15, color, strokeWidth: 0 });
    bar.setFill(color, 0.95);
    bar.moveTo([trackX - width / 2 + width * value / 2, y, 0]);
    return new M.VGroup(
      label(caption, 16, C.ink, CX - 1.43, y), track, bar,
      label(valueText, 16, color, CX + 2.10, y),
    );
  }

  // Introduce the applications, then compare the two ways of sorting them.
  await until(S(0));
  await play(stagger(numbered.map(fade)), ...say('8 PAST LOAN APPLICATIONS'));

  await until(S(1));
  await play(...numbered.map(out), stagger(cards.map(fade)),
    ...showAside(counts(ids, CX, HEAD_Y - 0.32)), ...say('REPAYMENT OUTCOMES'));

  await until(S(2));
  await play(move(ids, home), ...say('ALL 8 APPLICATIONS TOGETHER'));

  await until(S(3));
  await play(...say('GROUPS WITH EASIER OUTCOMES TO PREDICT', C.green));

  await until(S(4));
  await play(...say('WHICH QUESTION GOES FIRST?', C.amber));

  await until(S(5));
  await play(...showAside(label('Requested reminders? / Steady income?', P ? 19 : 18, C.ink, CX, HEAD_Y - 0.32)),
    ...say('COMPARE TWO QUESTIONS', C.amber));

  await until(S(6));
  await play(...showAside(), ...say('REQUESTED REPAYMENT REMINDERS?', C.amber));

  await until(S(7));
  await play(...openPath(reminders, 0));

  await until(S(8));
  await play(...showCount(reminders, 0));

  await until(S(9));
  await play(...openPath(reminders, 1));

  await until(S(10));
  await play(...showCount(reminders, 1));

  await until(S(11));
  await play(...showAside(counts(ids, CX, HOME_Y)), ...say('COMPARE WITH ALL 8'));

  await until(S(12));
  await play(...say('BOTH GROUPS ARE STILL EVENLY MIXED', C.violet),
    new M.Indicate(totals[0], { color: C.violet }), new M.Indicate(totals[1], { color: C.violet }));

  await until(S(13));
  await play(...say('REMINDERS DID NOT HELP HERE', C.amber));

  await until(S(14));
  await play(...showAside(), ...clearSplit(), move(ids, home), ...say('BACK TO ALL 8'));

  await until(S(15));
  await play(...say('STEADY INCOME?', C.green));

  await until(S(16));
  await play(...openPath(income, 0));

  await until(S(17));
  await play(...showCount(income, 0));

  await until(S(18));
  await play(...openPath(income, 1));

  await until(S(19));
  await play(...showCount(income, 1));

  await until(S(20));
  await play(emphasis([2, 3, 4], FULL), emphasis([6, 7, 8], PART),
    ...say('ONE OUTCOME IS MORE COMMON IN EACH GROUP'));

  await until(S(21));
  await play(...showAside(
    label('Yes → full is more likely', P ? 18 : 17, FULL, lane(0), HOME_Y),
    label('No → partial is more likely', P ? 18 : 17, PART, lane(1), HOME_Y)),
    ...say('EASIER TO PREDICT', C.green));

  // Measure the change for steady income, one term at a time.
  await until(S(22));
  await play(...showAside(), ...say('HOW MUCH UNCERTAINTY DID WE REMOVE?', C.violet));

  await until(S(23));
  await play(...say('ENTROPY MEASURES UNCERTAINTY', C.violet));

  await until(S(24));
  await play(...say('INFORMATION GAIN = REDUCTION IN ENTROPY', C.violet));

  await until(S(25));
  await play(...say('CALCULATE GAIN FOR STEADY INCOME', C.green));

  await until(S(26));
  await play(...clearSplit(), move(ids, home),
    ...showAside(counts(ids, CX, HEAD_Y - 0.32)),
    ...fbox(['Before splitting', ['Entropy = 1 bit', C.amber]], C.amber),
    ...say('BEFORE THE SPLIT'));

  await until(S(27));
  await play(...showAside(), ...openPath(income, 0), ...showCount(income, 0),
    ...say('AFTER THE SPLIT', C.green));

  await until(S(28));
  await play(...fbox(['Before: 1 bit', ['Yes: ≈ 0.811 bits', C.green]], C.green));

  await until(S(29));
  await play(...openPath(income, 1), ...showCount(income, 1),
    ...fbox(['Before: 1 bit', 'Yes: ≈ 0.811 bits', ['No:  ≈ 0.811 bits', C.green]], C.green));

  await until(S(30));
  await play(...say('FIND ONE NUMBER FOR BOTH GROUPS', C.violet));

  await until(S(31));
  await play(emphasis(ids, C.violet), ...say('EACH ORIGINAL CARD GETS AN EQUAL SAY', C.violet));

  await until(S(32));
  await play(emphasis(income[0], C.green), ...fbox(['Yes group', ['4 of 8 cards = ½', C.green]], C.green));

  await until(S(33));
  await play(...fbox(['Yes contribution', '½ × 0.811', ['≈ 0.4055 bits', C.green]], C.green));

  await until(S(34));
  await play(emphasis(income[1], C.violet),
    ...fbox(['Yes contribution ≈ 0.4055', ['No: 4 of 8 cards = ½', C.violet]], C.violet));

  await until(S(35));
  await play(...fbox(['Yes contribution ≈ 0.4055', 'No contribution: ½ × 0.811',
    ['≈ 0.4055 bits', C.violet]], C.violet));

  await until(S(36));
  await play(...fbox(['0.4055 + 0.4055', ['≈ 0.811 bits', C.green]], C.green));

  await until(S(37));
  await play(...say('WEIGHTED ENTROPY USES EACH GROUP’S SHARE', C.green),
    ...fbox(['Yes: 4/8 × 0.811', 'No:  4/8 × 0.811', ['Weighted entropy ≈ 0.811 bits', C.green]], C.green));

  await until(S(38));
  await play(...showAside(
    uncertaintyRow('Before', 1, '1 bit', HOME_Y + 0.28, C.amber),
    uncertaintyRow('After', 0.811, '≈ 0.811 bits', HOME_Y - 0.10, C.green)),
    ...say('COMPARE BEFORE AND AFTER'));

  await until(S(39));
  await play(...fbox(['Original − weighted', ['1 − 0.811', C.amber]], C.amber));

  await until(S(40));
  await play(...fbox(['1 − 0.811', ['Gain ≈ 0.189 bits', C.amber]], C.amber),
    ...say('STEADY INCOME REDUCES UNCERTAINTY', C.green));

  // Calculate the gain for reminders, then compare all four questions.
  await until(S(41));
  await play(...showAside(), ...clearBox(), ...clearSplit(),
    ...openPath(reminders, 0), ...openPath(reminders, 1),
    ...say('REQUESTED REPAYMENT REMINDERS?', C.amber));

  await until(S(42));
  await play(...showCount(reminders, 0), ...showCount(reminders, 1),
    ...fbox(['Yes: 1 bit', 'No:  1 bit']));

  await until(S(43));
  await play(...fbox(['½ × 1 + ½ × 1', ['Weighted entropy = 1 bit', C.green]], C.green));

  await until(S(44));
  await play(...fbox(['1 − 1', ['Gain = 0 bits', C.amber]], C.amber),
    ...say('REMINDERS REMOVE ZERO UNCERTAINTY', C.amber));

  await until(S(45));
  await play(...say('INFORMATION GAIN IN ONE LINE', C.violet));

  await until(S(46));
  await play(...fbox(['Information gain =', 'original entropy',
    ['− weighted entropy after splitting', C.violet]], C.violet));

  await until(S(47));
  await play(...say('COMPARE THE QUESTIONS', C.amber),
    ...fbox(['Steady income        ≈ 0.189', ['Savings              ≈ 0.189', C.amber],
      ['Previous repayment   ≈ 0.189', C.amber], 'Requested reminders    0'], C.amber));

  await until(S(48));
  await play(...say('A TIE GOES TO THE FIRST RECORDED QUESTION', C.amber),
    ...fbox([['A  Steady income        ≈ 0.189', C.amber], 'B  Savings              ≈ 0.189',
      'C  Previous repayment   ≈ 0.189', 'D  Requested reminders    0'], C.amber));

  await until(S(49));
  await play(...clearSplit(), ...openPath(income, 0), ...openPath(income, 1),
    ...fbox([['First split: steady income', C.green], 'Gain ≈ 0.189 bits'], C.green),
    ...say('CHOOSE STEADY INCOME', C.green));

  await until(S(50));
  await play(...showCount(income, 0), ...showCount(income, 1),
    ...say('CHOOSE A SPLIT THAT REDUCES UNCERTAINTY', C.green));

  // A hypothetical question on the same eight cards isolates one application.
  await until(S(51));
  await play(...clearBox(), ...clearSplit(), ...openPath(tiny, 0, '1 CARD'), ...openPath(tiny, 1, '7 CARDS'),
    ...showCount(tiny, 0), ...showCount(tiny, 1), ...say('IMAGINE A VERY UNEVEN SPLIT', C.violet));

  await until(S(52));
  await play(...say('EQUAL WEIGHTS MAKE THIS LOOK BETTER', C.amber),
    ...fbox(['If both groups had half the weight', '½ × 0 + ½ × 0.985',
      ['Weighted entropy ≈ 0.493 bits', C.amber]], C.amber));

  await until(S(53));
  await play(...say('USE EACH GROUP’S SHARE OF THE CARDS', C.green),
    ...fbox(['Use the group sizes', '1/8 × 0 + 7/8 × 0.985',
      ['Weighted entropy ≈ 0.862 bits', C.green]], C.green));

  await until(S(54));
  await play(...say('INFORMATION GAIN MEASURES UNCERTAINTY REMOVED', C.green),
    ...fbox(['1 bit before the split', '≈ 0.862 bits after weighting',
      ['Gain ≈ 0.138 bits', C.amber]], C.amber));
}

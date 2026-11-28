// 20.2.10 Catastrophic forgetting. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.5, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.75, 0] : [4.3, -0.3, 0];
  const BASE = P ? -4.2 : -2.35;
  const MID = P ? -1.2 : -0.55;
  // phone: spread the picture over the whole height
  const Y = d => MID + d * (P ? 1.9 : 1);
  const STEPS = [0, 100, 200, 300];
  const SCORES = [[3, 9], [7, 8], [9, 6], [9, 4]];
  const MIXED_END = [9, 8];

  const label = (s, x, y, color = C.ink, size = 21, mono = false) =>
    T(s, size, color, mono).moveTo([x, y, 0]);
  const fade = m => new M.FadeIn(m, { runTime: 0.32 });
  const out = m => new M.FadeOut(m, { runTime: 0.22 });
  const draw = m => new M.Create(m, { runTime: 0.45 });
  const line = (a, b, color, strokeWidth = 2) =>
    new M.Line({ start: [...a, 0], end: [...b, 0], color, strokeWidth });

  function rect(x, y, width, height, color, fill, opacity = 0.9) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    return r.moveTo([x, y, 0]);
  }

  let picture = [], boxNow = null;
  function swap(...next) {
    const animations = [...picture.map(out), ...next.map(fade)];
    picture = next;
    return animations;
  }

  function fbox(rows, color = C.cyan) {
    const animations = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!rows.length) return animations;

    const size = P ? 21 : 20, lh = P ? 0.36 : 0.4;
    const texts = rows.map(row => {
      const [s, c] = Array.isArray(row) ? row : [row, C.ink];
      return T(s, size, c, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const height = rows.length * lh + 0.22;
    const [x, y] = BOXP;
    const frame = rect(x, y, width, height, color, C.card, 0.95);
    texts.forEach((t, i) => t.moveTo([
      x - width / 2 + 0.28 + t.getWidth() / 2,
      y + ((texts.length - 1) / 2 - i) * lh,
      0
    ]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxWidth = P ? FW - 1.2 : 4.4;
    if (width > maxWidth) boxNow.scale(maxWidth / width).moveTo(BOXP);
    return [...animations, fade(boxNow)];
  }

  async function beat(i, caption, color, animations = []) {
    await until(S(i));
    await play(...animations, ...showA(caption, color, PILL, P ? 18 : 19));
  }

  function card(y, title, rows, color = C.cyan) {
    const height = 0.68 + 0.46 * rows.length;
    return new M.VGroup(
      rect(CX, y, P ? 6.6 : 6.8, height, color, C.card),
      label(title, CX, y + height / 2 - 0.3, color, 18, true),
      ...rows.map((s, i) => label(s, CX, y + height / 2 - 0.77 - i * 0.46))
    );
  }

  const announcement = () => card(Y(0.7), 'UNIVERSITY ANNOUNCEMENT', [
    'The library closes at six on Friday',
    'for cleaning.'
  ]);
  const oldExamples = () => card(Y(-1.19), 'EARLIER SKILLS', [
    'Translate a short sentence',
    'Add two numbers',
    'Write a line of a poem'
  ], C.violet);

  function questionSheet(title, y, color) {
    const items = Array.from({ length: 10 }, (_, i) => {
      const x = CX + (i - 4.5) * 0.58;
      return new M.VGroup(
        rect(x, y - 0.39, 0.48, 0.44, color, C.card),
        label(String(i + 1), x, y - 0.39, C.ink, 16, true)
      );
    });
    return new M.VGroup(label(title, CX, y + 0.22, color, 20, true), ...items);
  }

  const newSheet = () => questionSheet('NEW SKILLS · ANNOUNCEMENTS', Y(1.15), C.cyan);
  const oldSheet = () => questionSheet('OLD SKILLS · TRANSLATE · ADD · POEM', Y(-0.65), C.violet);

  // 0–11. Set up the two tests and take both before training.
  await beat(0, 'CAMPUS WRITING ASSISTANT', C.cyan, swap(announcement(),
    card(Y(-1.03), 'ASSISTANT', ['Learns to answer questions'], C.green)));
  await beat(1, 'SHORT, USEFUL ANSWERS', C.green, swap(announcement(),
    card(Y(-1.03), 'ASSISTANT', ['At six.'], C.green)));
  await beat(2, 'WHAT ABOUT EARLIER SKILLS?', C.violet, swap(announcement(), oldExamples()));
  await beat(3, 'TWO TESTS', C.amber, swap(
    card(Y(0.55), 'TEST 1', ['University announcements']),
    card(Y(-1.0), 'TEST 2', ['General tasks'], C.violet)
  ));
  await beat(4, '10 ANNOUNCEMENT QUESTIONS', C.cyan, swap(newSheet()));
  const waitAnswer = card(Y(-1.03), 'DEMONSTRATED ANSWER', ['?'], C.muted);
  await beat(5, 'ONE ANNOUNCEMENT QUESTION', C.cyan, swap(
    card(Y(0.65), 'QUESTION', ['When does the library', 'close on Friday?']), waitAnswer
  ));
  const demonstrated = card(Y(-1.03), 'DEMONSTRATED ANSWER', ['At six.'], C.green);
  await beat(6, 'THE ANSWER WE WANT', C.green, [out(waitAnswer), fade(demonstrated)]);
  picture = picture.filter(m => m !== waitAnswer);
  picture.push(demonstrated);
  await beat(7, 'NEW SKILLS TEST', C.cyan, swap(newSheet()));
  await beat(8, '10 EARLIER SKILLS QUESTIONS', C.violet, swap(newSheet(), oldSheet()));
  await beat(9, 'TRANSLATE · ADD · WRITE', C.violet, swap(newSheet(), oldExamples()));
  await beat(10, 'OLD SKILLS TEST', C.violet, swap(newSheet(), oldSheet()));
  await beat(11, 'TEST BOTH BEFORE TRAINING', C.amber, fbox([['Learning step 0', C.amber]]));

  function scoreRow(name, score, y, color, cells, active) {
    const parts = [label(name, CX - 1.22, y + 0.27, color, 20, true)];
    if (score == null) parts.push(label('? / 10', CX + 2.28, y + 0.27, C.muted, 23, true));
    if (score != null) {
      parts.push(label(`${score} / 10`, CX + 2.28, y + 0.27, active ? C.amber : color, 23, true));
    }
    if (cells && score != null) {
      for (let i = 0; i < 10; i++) {
        const x = CX + (i - 4.5) * 0.58;
        const correct = i < score, c = correct ? C.green : C.pink;
        parts.push(
          rect(x, y - 0.33, 0.49, 0.43, c, c, 0.18),
          label(correct ? '✓' : '×', x, y - 0.33, c, 19, true)
        );
      }
    }
    return new M.VGroup(...parts);
  }

  function scores(step, [newScore, oldScore], { cells = true, focus = -1, mixed = false } = {}) {
    const heading = mixed ? `STEP ${step} · MIXED EXAMPLES` : `LEARNING STEP ${step}`;
    const parts = [
      label(heading, CX, Y(1.58), C.amber, 18, true),
      scoreRow('NEW SKILLS', newScore, Y(0.61), C.cyan, cells, focus === 0),
      scoreRow('OLD SKILLS', oldScore, Y(-0.61), C.violet, cells, focus === 1)
    ];
    if (cells) {
      parts.push(
        label('✓ correct', CX - 1.23, Y(-1.57), C.green, 18),
        label('× wrong', CX + 1.23, Y(-1.57), C.pink, 18)
      );
    }
    return parts;
  }

  await beat(12, 'NEW SKILLS · 3 CORRECT', C.cyan, [
    ...swap(...scores(0, [SCORES[0][0], null], { cells: false, focus: 0 })), ...fbox([])
  ]);
  await beat(13, 'OLD SKILLS · 9 CORRECT', C.violet,
    swap(...scores(0, SCORES[0], { cells: false, focus: 1 })));
  await beat(14, 'GREEN IS CORRECT · PINK IS WRONG', C.green, swap(...scores(0, SCORES[0])));

  function music(practising) {
    return [
      card(Y(0.65), '♪ ONE SONG', [practising ? 'Practise every day' : 'Plays better ↑'], C.green),
      card(Y(-0.97), '♫ OTHER SONGS', [practising ? 'No practice' : 'May play worse ↓'], C.pink)
    ];
  }

  await beat(15, 'A MUSICIAN PRACTISES ONE SONG', C.amber, swap(...music(true)));
  await beat(16, 'ONE SONG IMPROVES', C.green, swap(...music(false)));
  await beat(17, 'A LANGUAGE MODEL CAN DO THE SAME', C.violet, swap(
    card(Y(0.65), 'NEW TASK', ['Answer announcement questions'], C.cyan),
    card(Y(-0.97), 'EARLIER TASKS', ['Translate · Add · Write'], C.violet)
  ));

  // 18–24. The network shows illustrative weights and signals.
  const edges = [
    [0, 0, 0, 0.5], [0, 0, 1, -0.3], [0, 1, 0, -0.2],
    [0, 1, 1, 0.7], [1, 0, 0, 0.6], [1, 1, 0, -0.4]
  ];
  const nodes = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]];
  const startValues = ['1', '0', '0.5', '0.2', '0.3'];
  let N, values = [];

  function network() {
    N = L.net({
      layers: [2, 2, 1], center: [CX, MID, 0],
      width: P ? 5.2 : 5.1, height: P ? 3.4 : 1.55, r: P ? 0.4 : 0.32
    });
    values = [];
    return [N.group, label('Example network', CX, Y(-1.45), C.muted, 17)];
  }

  function signals(numbers, color = C.ink) {
    return nodes.flatMap(([layer, index], k) => {
      if (numbers[k] == null) return [];
      const animations = N.value(layer, index, numbers[k], color);
      values[k] = animations[0].mobject;
      return animations;
    });
  }

  const weights = (changes = [0, 0, 0, 0, 0, 0]) =>
    edges.flatMap(([layer, from, to, w], k) => N.weight(layer, from, to, w + changes[k]));

  function leaveNetwork(...next) {
    const animations = [...values.filter(Boolean).map(out), ...swap(...next)];
    values = [];
    return animations;
  }

  function backward(layer) {
    const radius = P ? 0.4 : 0.32;
    return edges.filter(([l]) => l === layer).map(([l, i, j]) => {
      const [fromX, fromY] = N.pos(l + 1, j);
      const [toX, toY] = N.pos(l, i);
      const pulse = point => new M.Dot({ point, radius: 0.08, color: C.amber });
      const dot = pulse([fromX - radius, fromY, 0]);
      const target = pulse([toX + radius, toY, 0]);
      return { dot, animation: new M.Transform(dot, target, { runTime: 0.55 }) };
    });
  }

  async function backPass() {
    const right = backward(1), left = backward(0);
    await play(...right.map(p => p.animation));
    await play(...right.map(p => out(p.dot)), ...left.map(p => p.animation));
    await play(...left.map(p => out(p.dot)));
  }

  await beat(18, 'NEURONS IN CONNECTED COLUMNS', C.cyan, swap(...network()));
  await beat(19, 'EACH CONNECTION HAS A WEIGHT', C.amber, [
    ...weights(), ...fbox([['Example weight +0.5', C.cyan], ['Example weight −0.3', C.pink]])
  ]);
  await beat(20, 'EARLIER TRAINING SHAPES WEIGHTS', C.violet, [
    ...signals(startValues), ...fbox(['Translate · Add · Write'], C.violet)
  ]);
  await beat(21, 'TRAIN ON ANNOUNCEMENTS ONLY', C.cyan, fbox(['Announcement examples only']));

  const input = label('Library announcement', CX - 2.15, Y(1.43), C.cyan, 17);
  const answer = label('Answer · At nine.', CX + 2.15, Y(1.43), C.amber, 17);
  await beat(22, 'ANNOUNCEMENT IN · ANSWER OUT', C.cyan, [
    fade(input), ...signals(['1', '1', null, null, null], C.cyan),
    ...fbox(['Library closes at six', 'on Friday for cleaning.'])
  ]);
  picture.push(input);
  await play(...N.flow(0), ...signals([null, null, '0.3', '0.4', null]));
  await play(...N.flow(1), ...signals([null, null, null, null, '0.6'], C.amber), fade(answer));
  picture.push(answer);
  await beat(23, 'COMPARE ANSWER WITH EXAMPLE', C.pink, fbox([
    ['Model      At nine.', C.pink], ['Example    At six.', C.green], ['They differ: measure the loss', C.amber]
  ], C.pink));
  await beat(24, 'GRADIENTS GO BACK', C.amber, fbox(['Gradients move right to left'], C.amber));
  await backPass();
  await play(...weights([0.1, -0.1, 0.1, 0.1, 0.1, -0.1]), ...fbox([
    'One example weight', ['+0.5 → +0.6', C.cyan]
  ], C.violet));

  function trainingStrip(mixed = false) {
    const count = mixed ? 5 : 4;
    const cards = Array.from({ length: count }, (_, i) => {
      const x = CX + (i - (count - 1) / 2) * 1.22;
      const general = mixed && i === count - 1;
      const color = general ? C.violet : C.cyan;
      return new M.VGroup(
        rect(x, Y(-0.13), 1.05, 0.92, color, C.card),
        label(general ? 'General' : 'Campus', x, Y(-0.13), color, 15)
      );
    });
    return new M.VGroup(...cards, label(
      mixed ? '4 announcements + 1 general example' : 'University announcement examples',
      CX, Y(-0.97), C.muted, 18
    ));
  }

  function comparison(before, after, task) {
    const name = task ? 'Old skills' : 'New skills';
    const color = task ? C.violet : C.cyan;
    return fbox([name, [`${before} / 10 → ${after} / 10`, color]], color);
  }

  // 25–33. Reveal the new and old scores in separate beats.
  await beat(25, 'STEP 100 · REPEAT BOTH TESTS', C.amber, [
    ...leaveNetwork(newSheet(), oldSheet()), ...fbox([['100 learning steps', C.amber]])
  ]);
  await beat(26, 'NEW SKILLS RISE', C.cyan, [
    ...swap(...scores(100, [SCORES[1][0], null], { focus: 0 })),
    ...comparison(SCORES[0][0], SCORES[1][0], 0)
  ]);
  await beat(27, 'OLD SKILLS FALL', C.violet, [
    ...swap(...scores(100, SCORES[1], { focus: 1 })), ...comparison(SCORES[0][1], SCORES[1][1], 1)
  ]);
  await beat(28, '100 MORE STEPS · ANNOUNCEMENTS ONLY', C.cyan, [
    ...swap(trainingStrip()), ...fbox([['100 → 200 steps', C.amber]])
  ]);
  await beat(29, 'STEP 200 · NEW SKILLS RISE', C.cyan, [
    ...swap(...scores(200, [SCORES[2][0], null], { focus: 0 })),
    ...comparison(SCORES[1][0], SCORES[2][0], 0)
  ]);
  await beat(30, 'OLD SKILLS FALL AGAIN', C.violet, [
    ...swap(...scores(200, SCORES[2], { focus: 1 })), ...comparison(SCORES[1][1], SCORES[2][1], 1)
  ]);
  await beat(31, '100 MORE STEPS', C.amber, [
    ...swap(trainingStrip()), ...fbox([['200 → 300 steps', C.amber]])
  ]);
  await beat(32, 'STEP 300 · NEW SKILLS STAY AT 9', C.cyan, [
    ...swap(...scores(300, [SCORES[3][0], null], { focus: 0 })),
    ...comparison(SCORES[2][0], SCORES[3][0], 0)
  ]);
  await beat(33, 'OLD SKILLS FALL TO 4', C.violet, [
    ...swap(...scores(300, SCORES[3], { focus: 1 })), ...comparison(SCORES[2][1], SCORES[3][1], 1)
  ]);

  function graph({ focus = -1, hideOld = false, hideBefore = false, stop = false } = {}) {
    const left = CX - 2.55, right = CX + 2.87, bottom = BASE + 0.15;
    const top = P ? 0.42 : 0.3;
    const x = i => left + (right - left) * i / (STEPS.length - 1);
    const y = n => bottom + (top - bottom) * n / 10;
    const axes = [
      label('Correct answers out of 10', CX, top + 0.92, C.ink, 20),
      line([left, bottom], [left, top], C.muted),
      line([left, bottom], [right, bottom], C.muted),
      label('Training step', CX + 0.15, bottom - 0.55, C.muted, 17)
    ];
    for (const n of [0, 5, 10]) {
      axes.push(
        line([left, y(n)], [right, y(n)], C.line),
        label(String(n), left - 0.34, y(n), C.muted, 16, true)
      );
    }
    STEPS.forEach((step, i) => axes.push(label(String(step), x(i), bottom - 0.24, C.muted, 16, true)));
    if (stop) {
      axes.push(new M.DashedLine({ start: [x(2), bottom, 0], end: [x(2), top, 0], color: C.amber }));
    }

    const traces = [];
    for (const task of hideOld ? [0] : [0, 1]) {
      const taskColor = task ? C.violet : C.cyan;
      const color = focus < 0 || focus === task ? taskColor : C.muted;
      const lx = CX + (task ? 1.35 : -1.35);
      axes.push(line([lx - 1.2, top + 0.47], [lx - 0.8, top + 0.47], color, 5),
        label(task ? 'Old skills' : 'New skills', lx, top + 0.47, color, 18));
      const first = hideBefore && task === 1 ? 1 : 0;
      for (let i = first; i < STEPS.length; i++) {
        const score = SCORES[i][task];
        if (i > first) {
          traces.push(line([x(i - 1), y(SCORES[i - 1][task])], [x(i), y(score)], color, 4));
        }
        traces.push(new M.Dot({ point: [x(i), y(score), 0], radius: 0.075, color }));
      }
    }
    return { axes: new M.VGroup(...axes), traces };
  }

  function graphPicture(options) {
    const { axes, traces } = graph(options);
    return [axes, ...traces];
  }

  const full = graph();
  await beat(34, 'TWO TEST SCORES OVER TRAINING', C.amber, [
    ...swap(full.axes), ...fbox([]),
    new M.LaggedStart(full.traces.map(m => m instanceof M.Dot ? fade(m) : draw(m)),
      { lagRatio: 0.1, runTime: 1.25 })
  ]);
  picture.push(...full.traces);
  await beat(35, 'NEW SKILLS RISE, THEN LEVEL OFF', C.cyan, [
    ...swap(...graphPicture({ focus: 0 })), ...fbox([['3 → 7 → 9 → 9', C.cyan]])
  ]);
  await beat(36, 'OLD SKILLS KEEP FALLING', C.violet, [
    ...swap(...graphPicture({ focus: 1 })), ...fbox([['9 → 8 → 6 → 4', C.violet]], C.violet)
  ]);
  await beat(37, 'CATASTROPHIC FORGETTING', C.pink, [
    ...swap(...graphPicture()), ...fbox([['Earlier skills   9 → 4', C.pink]], C.pink)
  ]);

  await beat(38, 'WEIGHT CHANGES AFFECT BOTH TESTS', C.amber, [
    ...swap(...network()), ...weights([0.2, -0.1, 0.2, 0.15, 0.2, -0.15]),
    ...signals(['1', '1', '0.6', '0.5', '0.8']),
    ...fbox([['New skills   3 → 9', C.cyan], ['Old skills   9 → 4', C.violet]])
  ]);
  await beat(39, 'MEASURE THE LOSS OF OLD SKILLS', C.violet, [
    ...leaveNetwork(...scores(300, SCORES[3], { focus: 1 })), ...fbox(['Old skills before and after'], C.violet)
  ]);
  await beat(40, 'OLD SKILLS ACCURACY', C.violet, fbox([
    ['Old skills accuracy', C.violet], '= correct old answers', '  ÷ total questions'
  ], C.violet));
  await beat(41, 'OLD SKILLS ACCURACY FALLS', C.pink, fbox([
    'Before   9 ÷ 10 = 90%', 'After    4 ÷ 10 = 40%', ['Down 50 percentage points', C.pink]
  ], C.pink));
  await beat(42, 'HOW CAN WE KEEP EARLIER SKILLS?', C.amber, fbox([]));

  // 43–48. Restore the starting model and train with mixed examples.
  await beat(43, 'RESTORE THE STARTING WEIGHTS', C.amber, [
    ...swap(...network()), ...weights(), ...signals(startValues),
    ...fbox([['Step 0', C.amber], 'New 3 / 10 · Old 9 / 10'])
  ]);
  await beat(44, 'MIX OLD AND NEW EXAMPLES', C.green, [
    ...leaveNetwork(trainingStrip(true)), ...fbox([])
  ]);
  await beat(45, 'TRAIN AGAIN · WATCH BOTH TESTS', C.green, [
    ...swap(...network()), ...weights(), ...signals(startValues),
    ...fbox([['New skills test', C.cyan], ['Old skills test', C.violet]])
  ]);
  await play(...N.flow(0), ...signals(['1', '1', '0.3', '0.4', null]));
  await play(...N.flow(1), ...signals([null, null, null, null, '0.6'], C.amber),
    ...weights([0.1, 0, 0.1, 0.05, 0.1, 0]));
  await beat(46, 'STEP 300 · NEW SKILLS REACH 9', C.cyan, [
    ...leaveNetwork(...scores(300, [MIXED_END[0], null], { mixed: true, focus: 0 })),
    ...comparison(SCORES[0][0], MIXED_END[0], 0)
  ]);
  await beat(47, 'OLD SKILLS SCORE 8 OUT OF 10', C.violet, [
    ...swap(...scores(300, MIXED_END, { mixed: true, focus: 1 })),
    ...comparison(SCORES[0][1], MIXED_END[1], 1)
  ]);
  await beat(48, 'MIXING KEEPS MORE OLD SKILLS', C.green, fbox([
    'At step 300', ['Campus only   new 9 · old 4', C.pink], ['Mixed         new 9 · old 8', C.green]
  ], C.green));

  // 49–53. Compare stopping points and show what each missing test conceals.
  await beat(49, 'STOP EARLIER OR LIMIT WEIGHT CHANGES', C.amber, [
    ...swap(...graphPicture({ stop: true })), ...fbox([
      ['Stop at step 200', C.amber], 'Low-rank adaptation', 'limits weight changes'
    ], C.amber)
  ]);
  await beat(50, 'USE BOTH TESTS TO CHOOSE WHEN TO STOP', C.green, fbox([
    'Step 200   new 9 · old 6', 'Step 300   new 9 · old 4', ['200 keeps more old skills.', C.green]
  ], C.green));
  await beat(51, 'THE NEW SKILLS TEST HIDES THE DROP', C.cyan, [
    ...swap(...graphPicture({ hideOld: true })), ...fbox([['New skills   9 → 9', C.cyan], 'Old skills test missing'])
  ]);
  await beat(52, 'MEASURE OLD SKILLS BEFORE TRAINING', C.violet, [
    ...swap(...graphPicture({ hideBefore: true })), ...fbox(['Old skills before   ?', 'Old skills after    4 / 10'], C.violet)
  ]);
  await beat(53, 'LEARN NEW SKILLS · KEEP OLD SKILLS', C.green, [
    ...swap(...scores(300, MIXED_END, { mixed: true })),
    ...fbox([['Test both before training.', C.amber], 'Watch both scores.', 'Mix in earlier examples.'], C.green)
  ]);
}

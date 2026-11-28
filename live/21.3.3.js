// 21.3.3 Visual question answering. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];
  const names = ['Pond', 'Library', 'Lab building', 'Cafeteria', 'Main gate', 'Sports hall'];
  const colors = [C.violet, C.cyan, C.green, '#fb923c', C.ink, C.pink];
  const candidates = [1, 3, 5];
  const withoutMap = [0.5, 0.3, 0.2];
  const withMap = [0.05, 0.8, 0.15];
  const focus = [0.05, 0.05, 0.05, 0.45, 0.35, 0.05];
  const question = ['Which building is just', 'left of the main gate?'];
  const original = [0, 1, 2, 3, 4, 5];
  const swapped = [0, 1, 2, 5, 4, 3];

  const label = (str, x, y, size = 19, color = C.ink, mono = false) =>
    T(str, size, color, mono).moveTo([x, y, 0]);
  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  const rect = (x, y, width, height, color, opacity = 0, cornerRadius = 0.1) => {
    const r = new M.RoundedRectangle({ width, height, cornerRadius, color, strokeWidth: 2 });
    r.setFill(opacity ? color : C.bg, opacity);
    return r.moveTo([x, y, 0]);
  };
  const dot = (x, y, color, radius = 0.07) =>
    new M.Dot({ point: [x, y, 0], color, radius });
  const say = (str, color = C.cyan) => showA(str, color, PILL, P ? 19 : 17);
  const appear = object => new M.FadeIn(object, { runTime: 0.32 });
  const leave = object => new M.FadeOut(object, { runTime: 0.28 });
  const emphasis = (object, color) => new M.Indicate(object, { color, runTime: 0.6 });

  let boxNow = null;
  function fbox(lines = [], color = C.cyan) {
    const a = boxNow ? [leave(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;

    const size = P ? 22 : 21, lh = P ? 0.36 : 0.42;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const texts = rows.map(([str, ink]) => T(str, size, ink, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.62;
    const ht = rows.length * lh + 0.28;
    const left = BOXP[0] - wd / 2 + 0.31;
    const border = rect(...BOXP.slice(0, 2), wd, ht, color);
    border.setFill(C.card, 0.95);
    texts.forEach((t, i) => {
      t.moveTo([left + t.getWidth() / 2, BOXP[1] + (rows.length - 1) * lh / 2 - i * lh, 0]);
    });
    boxNow = new M.VGroup(border, ...texts);
    const maxw = P ? FW - 1.2 : 4;
    if (wd > maxw) boxNow.scale(maxw / wd);
    a.push(appear(boxNow));
    return a;
  }

  // Replace only the portion of the picture that changes on this beat.
  const picture = new Map();
  function put(key, ...objects) {
    const old = picture.get(key) || [];
    if (objects.length) picture.set(key, objects);
    else picture.delete(key);
    return [...old.map(leave), ...objects.map(appear)];
  }
  function clearPicture() {
    const a = [...picture.values()].flat().map(leave);
    picture.clear();
    return a;
  }

  const W = P ? 2.02 : 1.93, H = P ? 1.65 : 1.36;
  const patch = i => [CX + (i % 3 - 1) * W, BASE + (i < 3 ? 1.5 : 0.5) * H];
  function landmark(id, x, y) {
    const color = colors[id];
    if (id === 0) {
      return new M.VGroup(
        rect(x, y, 0.77, 0.31, color, 0.34, 0.15),
        line(x - 0.22, y + 0.04, x + 0.11, y + 0.04, color),
        line(x - 0.08, y - 0.06, x + 0.23, y - 0.06, color));
    }
    if (id === 4) {
      return new M.VGroup(
        line(x - 0.23, y - 0.08, x - 0.23, y + 0.13, color),
        line(x + 0.23, y - 0.08, x + 0.23, y + 0.13, color),
        line(x - 0.23, y + 0.13, x + 0.23, y + 0.13, color),
        line(x - 0.12, y + 0.07, x + 0.12, y + 0.07, color));
    }
    const parts = [rect(x, y, 0.76, 0.36, color, 0.2)];
    if (id === 1) {
      for (const dx of [-0.2, 0, 0.2]) parts.push(line(x + dx, y - 0.1, x + dx, y + 0.1, color));
    } else if (id === 2) {
      parts.push(line(x - 0.18, y, x + 0.18, y, color), line(x, y - 0.11, x, y + 0.11, color));
    } else if (id === 3) {
      for (const dx of [-0.19, 0.19]) parts.push(dot(x + dx, y, color, 0.055));
      parts.push(line(x - 0.19, y, x + 0.19, y, color));
    } else {
      parts.push(line(x, y - 0.17, x, y + 0.17, color), dot(x, y, color, 0.055));
    }
    return new M.VGroup(...parts);
  }
  function campus(order = original, route = false) {
    const cells = order.map((id, i) => {
      const [x, y] = patch(i);
      const gate = id === 4;
      return new M.VGroup(
        rect(x, y, W - 0.06, H - 0.06, C.grid, 0.13),
        landmark(id, gate && route ? x + 0.64 : x, gate ? BASE + 0.14 : y + 0.1),
        label(names[id], x, gate ? y + 0.07 : y - 0.29, P ? 17 : 16, colors[id]));
    });
    if (route) {
      const x = CX + 0.64, end = BASE + 1.5 * H;
      cells.push(new M.VGroup(
        line(x, BASE + 0.19, x, end, C.amber, 3),
        dot(x, end, C.amber, 0.05)));
    }
    return new M.VGroup(...cells);
  }
  function outline(i, color) {
    const [x, y] = patch(i);
    return rect(x, y, W - 0.13, H - 0.13, color);
  }
  function visitor() {
    const y = BASE - 0.28, x = CX + 0.18;
    return new M.VGroup(
      dot(x, y + 0.15, C.ink),
      line(x, y + 0.05, x, y - 0.12, C.ink),
      line(x, y - 0.06, x - 0.09, y - 0.19, C.ink),
      line(x, y - 0.06, x + 0.09, y - 0.19, C.ink),
      line(x, y + 0.03, x + 0.16, y + 0.04, C.ink),
      rect(x + 0.25, y + 0.06, 0.21, 0.14, C.green, 0.3, 0.035));
  }
  function tokens(vectors) {
    const sample = [0.9, 0.1, 0.4, 0.7];
    const tiles = original.map((id, i) => {
      const [x, y] = patch(i);
      const parts = [rect(x, y, W - 0.17, H - 0.16, colors[id], 0.11)];
      if (!vectors) {
        parts.push(landmark(id, x, y + 0.12),
          label(`Patch ${i + 1}`, x, y - 0.29, 17, colors[id], true));
      } else {
        parts.push(label(`Row ${i < 3 ? 1 : 2}, col ${i % 3 + 1}`, x, y + 0.33, 14, colors[id], true));
        for (let j = 0; j < 4; j++) {
          const bx = x + (j - 1.5) * 0.37;
          parts.push(rect(bx, y - 0.16, 0.31, 0.27, colors[id],
            id === 1 ? 0.12 + 0.58 * sample[j] : 0.18, 0.04));
          if (id === 1) parts.push(label(String(sample[j]), bx, y - 0.16, 11, C.ink, true));
        }
      }
      return new M.VGroup(...parts);
    });
    return new M.VGroup(...tiles);
  }

  const barX = i => CX + (i - 1) * (P ? 1.79 : 1.66) + 0.19;
  const barScale = P ? 3.65 : 3.12;
  function chart() {
    const parts = [];
    for (const v of [0, 0.5, 1]) {
      const y = BASE + v * barScale;
      parts.push(line(CX - 2.49, y, CX + 2.75, y, v ? C.grid : C.muted, v ? 1 : 2),
        label(String(v), CX - 2.85, y, 18, C.muted, true));
    }
    candidates.forEach((id, i) => parts.push(label(names[id], barX(i), BASE - 0.3, 17, colors[id])));
    return new M.VGroup(...parts);
  }
  function bar(i, value) {
    const x = barX(i), color = colors[candidates[i]], height = value * barScale;
    const body = new M.Rectangle({ width: 0.83, height, color, strokeWidth: 2 });
    body.setFill(color, 0.69);
    body.moveTo([x, BASE + height / 2, 0]);
    return new M.VGroup(body, label(String(value), x, BASE + height + 0.18, 16, color, true));
  }
  function winner(i, value, color) {
    const height = value * barScale;
    return rect(barX(i), BASE + (height + 0.25) / 2, 1.18, height + 0.39, color);
  }
  function weights(indices) {
    return indices.flatMap(i => {
      const [x, y] = patch(i), value = focus[i];
      const halo = outline(i, C.amber);
      halo.setStrokeOpacity(0.25 + 0.75 * value / 0.45);
      return [halo, label(value.toFixed(2), x, y + H / 2 - 0.22, 19,
        value > 0.05 ? C.amber : C.muted, true)];
    });
  }
  function cake() {
    const x = CX, y = P ? -1.48 : -0.85, r = P ? 1.18 : 1.22;
    const disk = new M.Circle({ radius: r, color: C.amber, strokeWidth: 3 });
    disk.setFill(C.amber, 0.26);
    disk.moveTo([x, y, 0]);
    return new M.VGroup(disk, ...[Math.PI / 2, Math.PI * 1.5, Math.PI * 0.1].map(a =>
      line(x, y, x + r * Math.cos(a), y + r * Math.sin(a), C.amber, 3)));
  }
  function inputPair(bars = true) {
    const y = BASE + 2.05, yb = BASE - 0.75;
    const extra = bars ? candidates.flatMap((id, i) => {
      const x = CX + (i - 1) * 1.45, h = withMap[i] * 1.0, color = colors[id];
      const r = new M.Rectangle({ width: 0.6, height: h, color, strokeWidth: 2 });
      r.setFill(color, 0.69); r.moveTo([x, yb + h / 2, 0]);
      return [r, label(String(withMap[i]), x, yb + h + 0.2, 17, color, true), label(names[id], x, yb - 0.25, 16, color)];
    }) : [label('?', CX, BASE + 0.2, 40, C.amber)];
    return new M.VGroup(...extra,
      rect(CX - 1.52, y, 2.18, 1.06, C.cyan, 0.12),
      rect(CX + 1.52, y, 2.18, 1.06, C.violet, 0.12),
      label('Campus map', CX - 1.52, y, 19, C.cyan),
      label('Question', CX + 1.52, y, 19, C.violet),
      label('+', CX, y, 23, C.ink),
      line(CX, y - 0.62, CX, y - 0.99, C.muted),
      label('Answer chances', CX, y - 1.31, 19, C.amber));
  }
  function pictureExamples() {
    return new M.VGroup(...['Map', 'Chart', 'Photo', 'Form'].map((name, i) => {
      const x = CX + (i % 2 ? 1.44 : -1.44);
      const y = BASE + (i < 2 ? 2.68 : 1.16);
      const z = y + 0.15, color = [C.cyan, C.green, C.pink, C.violet][i];
      const drawings = [
        [rect(x, z, 0.88, 0.51, color), line(x - 0.15, z - 0.24, x - 0.15, z + 0.24, color),
          line(x + 0.15, z - 0.24, x + 0.15, z + 0.24, color), line(x - 0.43, z, x + 0.43, z, color)],
        [0.19, 0.42, 0.28].map((h, j) => rect(x + (j - 1) * 0.24, z - 0.21 + h / 2, 0.17, h, color, 0.5, 0.025)),
        [rect(x, z, 0.88, 0.51, color), dot(x + 0.23, z + 0.13, color, 0.043),
          line(x - 0.4, z - 0.18, x - 0.12, z + 0.11, color), line(x - 0.12, z + 0.11, x + 0.19, z - 0.18, color)],
        [rect(x, z, 0.64, 0.56, color), ...[-0.13, 0, 0.13].map(dy =>
          line(x - 0.17, z + dy, x + 0.17, z + dy, color))],
      ];
      return new M.VGroup(rect(x, y, 2.55, 1.32, C.grid, 0.16),
        ...drawings[i], label(name, x, y - 0.38, 17, color));
    }));
  }
  function comparison(same = false) {
    const y = BASE + 2.05;
    const answer = same ? 'Library' : 'Cafeteria';
    const right = same ? C.cyan : colors[3];
    return new M.VGroup(
      rect(CX - 1.4, y, 2.35, 1.34, C.cyan, 0.1),
      rect(CX + 1.4, y, 2.35, 1.34, right, 0.1),
      label('Without map', CX - 1.4, y + 0.26, 16, C.muted),
      label('With map', CX + 1.4, y + 0.26, 16, C.muted),
      label('Library', CX - 1.4, y - 0.21, 22, C.cyan),
      label(answer, CX + 1.4, y - 0.21, 22, right));
  }

  // 0–4 The map and the visitor's question.
  await until(S(0)); await play(...put('map', campus(original, true)), ...put('visitor', visitor()), ...say('AT THE MAIN GATE'));
  await until(S(1)); await play(...say('ASK THE CAMPUS GUIDE'), ...fbox(question));
  await until(S(2)); await play(...put('mark', outline(4, C.ink)), ...say('BOTTOM ROW · MIDDLE', C.ink));
  await until(S(3)); await play(...put('mark', outline(4, C.ink), outline(3, colors[3])),
    ...say('JUST LEFT OF THE GATE', colors[3]), ...fbox([['Cafeteria', colors[3]]], colors[3]));
  await until(S(4)); await play(...clearPicture(), ...fbox(), ...put('inputs', inputPair(false)), ...say('HOW DOES THE MODEL ANSWER?'));

  // 5–14 The next word and a text-only guess.
  const wordY = BASE + 2.1;
  await until(S(5));
  await play(...clearPicture(), new M.LaggedStart([
    appear(label('The', CX - 1.7, wordY, 25)),
    appear(label('answer', CX - 0.55, wordY, 25)),
    appear(label('is', CX + 0.54, wordY, 25)),
    appear(label('…', CX + 1.6, wordY, 28, C.amber)),
  ].map((animation, i) => {
    picture.set(`word${i}`, [animation.mobject]);
    return animation;
  }), { lagRatio: 0.38, runTime: 1.4 }), ...say('ONE WORD AT A TIME'));
  await until(S(6)); await play(...put('options', new M.VGroup(...candidates.map((id, i) =>
    label(names[id], barX(i), wordY - 0.86, 17, colors[id])))),
    ...fbox(['Each possible next word', ['Chance: 0 to 1', C.amber]]), ...say('CHANCES FOR THE NEXT WORD'));
  await until(S(7)); await play(...clearPicture(), ...put('cake', cake()),
    ...fbox([['All chances add to 1', C.amber]]), ...say('ONE WHOLE CAKE', C.amber));
  await until(S(8)); await play(...clearPicture(), ...put('chart', chart()), ...say('QUESTION ONLY'), ...fbox(question));
  for (let i = 0; i < withoutMap.length; i++) {
    await until(S(9 + i)); await play(...put(`bar${i}`, bar(i, withoutMap[i])));
  }
  await until(S(12)); await play(...put('winner', winner(0, withoutMap[0], C.cyan)),
    ...say('TALLEST BAR: LIBRARY'), ...fbox([['Model says: Library', C.cyan]]));
  await until(S(13)); await play(...say('LIBRARY IS A COMMON GUESS', C.amber),
    ...fbox([['Guess: Library', C.cyan], ['Map answer: Cafeteria', colors[3]]], C.amber));
  await until(S(14)); await play(...say('A GUESS FROM HABIT', C.amber),
    ...fbox(['Question only', ['No campus map', C.amber]], C.amber));

  // 15–23 Give the model the same question after the map tokens.
  await until(S(15)); await play(...clearPicture(), ...put('tokens', tokens(false)),
    ...say('MAP FIRST, THEN QUESTION'), ...fbox(['1–6: Map tokens', 'Then the question']));
  await until(S(16)); await play(...put('tokens', tokens(true)), ...say('ONE TAGGED VECTOR PER PATCH'),
    ...fbox(['Tag = row and column', 'Vector = list of numbers']));
  await until(S(17)); await play(...clearPicture(), ...put('chart', chart()),
    ...say('WITH THE MAP'), ...fbox(question));
  for (const [beat, i] of [[18, 1], [19, 2], [20, 0]]) {
    await until(S(beat)); await play(...put(`bar${i}`, bar(i, withMap[i])));
  }
  await until(S(21)); await play(...put('winner', winner(1, withMap[1], colors[3])),
    ...say('TALLEST BAR: CAFETERIA', colors[3]),
    ...fbox(['0.8 + 0.15 + 0.05 = 1', ['Answer: Cafeteria', colors[3]]], colors[3]));
  await until(S(22)); await play(...clearPicture(), ...put('compare', comparison()),
    ...say('SAME QUESTION'), ...fbox(['Without map: Library', ['With map: Cafeteria', colors[3]]]));
  await until(S(23)); await play(...say('VISUAL QUESTION ANSWERING'), ...fbox(['Answer a question', 'about a picture']));

  // 24–33 Reveal the weights in the order the narration gives them.
  await until(S(24)); await play(...clearPicture(), ...put('map', campus()),
    ...say('WHERE DID THE MODEL LOOK?'), ...fbox([['A clue: attention', C.violet]], C.violet));
  await until(S(25)); await play(...say('SHARING OUT FOCUS', C.violet),
    ...fbox(['Next word: cafeteria', ['Focus over the 6 tokens', C.violet]], C.violet));
  await until(S(26)); await play(...say('BRIGHTER MEANS MORE FOCUS', C.amber),
    ...fbox([['Total focus = 1', C.amber]], C.amber));
  await until(S(27)); await play(...put('topWeights', ...weights([0, 1, 2])));
  await until(S(28)); await play(...put('cafeteriaWeight', ...weights([3])));
  await until(S(29)); await play(...put('gateWeight', ...weights([4])));
  await until(S(30)); await play(...put('sportsWeight', ...weights([5])));
  await until(S(31)); await play(...fbox(['Cafeteria + main gate', ['0.45 + 0.35 = 0.8', C.amber]], C.amber));
  await until(S(32));
  await play(...put('pair', rect(CX - W / 2, BASE + H / 2, W * 2 + 0.08, H + 0.08, C.amber)),
    ...say('80% ON TWO PATCHES', C.amber), ...fbox([['0.8 of 1 = 80%', C.amber]], C.amber));
  await until(S(33)); await play(...put('pair'), ...say('ATTENTION IS A CLUE', C.violet),
    ...fbox(['Focus highlights a region', ['Check by changing inputs', C.violet]], C.violet));

  // 34–38 Read the conditional chance, then show where it is useful.
  await until(S(34)); await play(...clearPicture(), ...put('inputs', inputPair()),
    ...say('CHANCE OF EACH ANSWER'), ...fbox(['Chance(answer |', '  picture and question)']));
  const rainY = BASE + 1.85;
  const clouds = new M.VGroup(
    ...[-0.56, 0, 0.56].map((dx, i) => {
      const cloud = new M.Circle({ radius: i === 1 ? 0.47 : 0.34, color: C.muted });
      cloud.setFill(C.muted, 0.68);
      return cloud.moveTo([CX + dx, rainY + 0.38, 0]);
    }),
    ...[-0.48, 0, 0.48].map(dx => line(CX + dx, rainY - 0.24, CX + dx - 0.12, rainY - 0.49, C.cyan)));
  await until(S(35)); await play(...put('inputs', clouds), ...say('GIVEN = ONCE WE KNOW'),
    ...fbox(['Chance(rain | dark sky)']));
  await until(S(36)); await play(...put('inputs', inputPair()), ...say('CONDITIONED ON BOTH'),
    ...fbox(['Chance(answer |', '  picture and question)']));
  await until(S(37)); await play(...clearPicture(), ...put('examples', pictureExamples()),
    ...say('ASK ABOUT A PICTURE'), ...fbox());
  await until(S(38)); await play(...clearPicture(), ...put('map', campus()),
    ...say('SHOW THE PICTURE AND ASK'), ...fbox(question));

  // 39–45 Test whether the answer follows changes to the picture.
  await until(S(39)); await play(...clearPicture(), ...put('chart', chart()),
    ...put('bar0', bar(0, withoutMap[0])), ...put('bar1', bar(1, withoutMap[1])),
    ...put('bar2', bar(2, withoutMap[2])), ...say('THE MODEL CAN GUESS', C.amber),
    ...fbox(['The model can use', 'text habits alone'], C.amber));
  const confident = label('“Library.”', CX, BASE + 1.94, 37, C.cyan);
  await until(S(40)); await play(...clearPicture(), ...put('answer', confident),
    ...say('CONFIDENCE CAN MISLEAD', C.amber), ...fbox(['The answer sounds sure.', 'Did it use the map?'], C.amber));
  await until(S(41)); await play(...clearPicture(), ...put('compare', comparison()),
    ...say('ASK WITH AND WITHOUT IT'), ...fbox(question));
  await until(S(42)); await play(...say('THE PICTURE CHANGED THE ANSWER', C.green),
    ...fbox([['Library → Cafeteria', C.green]], C.green));
  await until(S(43)); await play(...put('compare', comparison(true)), ...say('WHAT IF IT STAYS THE SAME?', C.amber),
    ...fbox(['Library → Library', ['Try changing the map', C.amber]], C.amber));
  const changedMap = campus(swapped);
  const changedPatch = outline(3, colors[5]);
  await until(S(44)); await play(...clearPicture(), ...put('map', changedMap),
    ...put('mark', changedPatch), ...say('CHANGE THE MAP AND ASK AGAIN'),
    ...fbox(['Same question', ['New answer: Sports hall', colors[5]]], colors[5]));
  await until(S(45)); await play(...clearPicture(), ...put('inputs', inputPair()), ...say('VISUAL QUESTION ANSWERING'),
    ...fbox(['Answer depends on', ['picture and question', C.green]], C.green));
}

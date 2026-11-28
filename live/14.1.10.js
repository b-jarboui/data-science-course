// 14.1.10 Cluster stability: will our groups appear again?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const stations = ['A', 'B', 'C', 'D', 'E', 'F'];
  const data = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const starts = [data[3], data[5]];
  const colors = [C.cyan, C.amber];
  const saved = ['–00001', '0–0001', '000–11'];

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.4, -0.3, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const at = (x, y) => [x, y, 0];
  const label = (text, x, y, size = 20, color = C.ink) =>
    T(String(text), size, color, true).moveTo(at(x, y));
  const line = (a, b, color = C.muted, strokeWidth = 1) =>
    new M.Line({ start: a, end: b, color, strokeWidth });
  const box = (x, y, width, height, color, opacity = 0) => {
    const rect = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    rect.setFill(C.card, opacity);
    return rect.moveTo(at(x, y));
  };
  const fadeIn = object => new M.FadeIn(object, { runTime: 0.28 });
  const fadeOut = object => new M.FadeOut(object, { runTime: 0.22 });
  const swap = (previous, next) => [
    ...(previous ? [fadeOut(previous)] : []),
    ...(next ? [fadeIn(next)] : []),
  ];

  let pictureNow = null;
  let formulaNow = null;
  let curveNow = null;
  function picture(next) {
    const animations = swap(pictureNow, next);
    pictureNow = next;
    return animations;
  }

  function fbox(lines, color = C.cyan) {
    let next = null;
    if (lines.length) {
      const [x, y] = BOXP;
      const step = P ? 0.44 : 0.42;
      const text = lines.map(row => {
        const [value, ink] = Array.isArray(row) ? row : [row, C.ink];
        return T(value, P ? 22 : 21, ink, true);
      });
      const width = Math.max(...text.map(t => t.getWidth())) + 0.56;
      const height = lines.length * step + 0.28;
      text.forEach((t, i) => t.moveTo(at(x - width / 2 + 0.28 + t.getWidth() / 2,
        y + (lines.length - 1) * step / 2 - i * step)));
      next = new M.VGroup(box(x, y, width, height, color, 0.95), ...text);
      const maxWidth = P ? FW - 1.0 : 5.0;
      if (width > maxWidth) next.scale(maxWidth / width);
    }
    const animations = swap(formulaNow, next);
    formulaNow = next;
    return animations;
  }

  // Equal axis units preserve the distances shown on the plot.
  // Phone: a big grid that fills the middle and lower part of the frame.
  const unit = P ? 0.68 : 0.47;
  const plotLeft = CX - 5 * unit;
  const plotBottom = P ? -4.6 : -2.18;
  const point = ([x, y]) => at(plotLeft + x * unit, plotBottom + y * unit);
  function grid() {
    const parts = [];
    for (let x = 0; x <= 10; x++) {
      parts.push(line(point([x, 0]), point([x, 7]), C.grid));
      if (x % 2 === 0) parts.push(label(x, point([x, 0])[0], plotBottom - (P ? 0.27 : 0.22), P ? 20 : 15, C.muted));
    }
    for (let y = 0; y <= 7; y++) {
      parts.push(line(point([0, y]), point([10, y]), C.grid));
      if (y > 0 && y % 2 === 0) parts.push(label(y, plotLeft - (P ? 0.28 : 0.25), point([0, y])[1], P ? 20 : 15, C.muted));
    }
    parts.push(line(point([0, 7]), point([0, 0]), C.muted, 2));
    parts.push(line(point([0, 0]), point([10, 0]), C.muted, 2));
    parts.push(label('Returns ↑', plotLeft + 0.72, point([0, 7])[1] + 0.24, P ? 21 : 18, C.ink));
    parts.push(label('Departures →', CX, plotBottom - (P ? 0.62 : 0.55), P ? 21 : 18, C.ink));
    return new M.VGroup(...parts);
  }

  let dots = Array(stations.length).fill(null);
  let dotState = '';
  function updateDots(state) {
    const animations = [];
    dots = data.map((xy, i) => {
      const old = dots[i];
      if (state[i] === dotState[i]) return old;
      if (state[i] === '–') {
        if (old) animations.push(fadeOut(old));
        return null;
      }
      const [x, y] = point(xy);
      const color = colors[state[i]] || C.ink;
      const glow = new M.Dot({ point: at(x, y), radius: 0.17, color });
      glow.setFill(color, 0.19);
      const mark = new M.Dot({ point: at(x, y), radius: 0.085, color });
      // letter up-left (D below) in white, clear of the centre diamonds that sit on D and F
      const off = [[-0.24, 0.22], [-0.24, 0.22], [-0.24, 0.22], [0, -0.3], [0.26, -0.2], [-0.3, 0.2]][i];
      const name = T(stations[i], P ? 22 : 18, C.ink, true, true).moveTo(at(x + off[0], y + off[1]));
      const next = new M.VGroup(glow, mark, name);
      animations.push(...swap(old, next));
      return next;
    });
    dotState = state;
    return animations;
  }

  let centres = [null, null];
  function diamond(xy, i) {
    const r = 0.21;
    const color = colors[i];
    const marker = new M.Polygon({
      vertices: [at(0, r), at(r, 0), at(0, -r), at(-r, 0)],
      color, strokeWidth: 3,
    });
    marker.setFill(color, 0.16);
    return marker.moveTo(point(xy));
  }
  function moveCentre(i, xy) {
    const next = diamond(xy, i);
    if (centres[i]) return [new M.Transform(centres[i], next, { runTime: 0.55 })];
    centres[i] = next;
    return [fadeIn(next)];
  }
  const resetCentres = () => starts.flatMap((xy, i) => moveCentre(i, xy));
  function clearPlot() {
    const animations = [...updateDots('––––––'), ...centres.filter(Boolean).map(fadeOut), ...loss([])];
    centres = [null, null];
    return animations;
  }

  // The small inertia chart was too small to read; the inertia is shown in the formula box instead.
  function loss(values) {
    let next = null;
    if (false && values.length) {
      const x = P ? -1.40 : 3.04;
      const y = P ? -5.00 : -2.66;
      const h = P ? 0.92 : 0.83;
      const p = (v, i) => at(x + 0.48 + i * 0.81, y + v / 45 * h);
      const parts = [
        line(at(x, y + h), at(x, y), C.muted),
        line(at(x, y), at(x + 2.45, y), C.muted),
        label('Inertia by round', x + 1.22, y + h + 0.20, 16, C.ink),
      ];
      for (let i = 0; i < values.length; i++) {
        if (i) parts.push(line(p(values[i - 1], i - 1), p(values[i], i), C.amber, 2));
        parts.push(new M.Dot({ point: p(values[i], i), radius: 0.055, color: C.amber }));
        parts.push(label(i + 1, p(0, i)[0], y - 0.16, 13, C.muted));
      }
      next = new M.VGroup(...parts);
    }
    const animations = swap(curveNow, next);
    curveNow = next;
    return animations;
  }

  // Phone: bigger cards and bag, placed lower so the frame is used down to the bottom.
  const K = P ? 1.4 : 1;
  function cards(letters, y, color = C.ink) {
    return Array.from(letters, (letter, i) => {
      const x = CX + (i - (letters.length - 1) / 2) * 0.82 * K;
      return new M.VGroup(box(x, y, 0.61 * K, 0.69 * K, color, 0.86), label(letter, x, y, P ? 30 : 23, color));
    });
  }
  function bag() {
    const y = P ? -3.0 : -0.65;
    const sack = new M.Polygon({
      vertices: [at(CX - 1.25 * K, y + 0.70 * K), at(CX + 1.25 * K, y + 0.70 * K),
        at(CX + 1.56 * K, y - 0.70 * K), at(CX + 1.15 * K, y - 1.08 * K),
        at(CX - 1.15 * K, y - 1.08 * K), at(CX - 1.56 * K, y - 0.70 * K)],
      color: C.violet,
    });
    sack.setFill(C.card, 0.95);
    return new M.VGroup(sack, label('BAG', CX, y - 0.48 * K, P ? 26 : 20, C.violet));
  }
  const CARDY = P ? -0.3 : 0.80;
  function drawCards(letters) {
    return new M.VGroup(bag(), ...cards(letters, CARDY, C.cyan));
  }
  function groups(blue, orange) {
    return new M.VGroup(...cards(blue, P ? -1.5 : 0.48, colors[0]), ...cards(orange, P ? -4.3 : -0.70, colors[1]));
  }

  // Three saved trials side by side, with station letters in their group colors.
  // Outlines track the same two stations across all three columns.
  function trialTable(pair = [], outcomes = false) {
    const top = P ? 1.6 : 1.10;
    const pitch = P ? 0.92 : 0.46;
    const left = CX - (P ? 3.3 : 2.34);
    const parts = [];
    stations.forEach((letter, i) => parts.push(label(letter, left, top - (i + 1) * pitch, P ? 23 : 19)));
    saved.forEach((state, j) => {
      const x = CX + (j - 1) * (P ? 2.05 : 1.66) + (P ? 0.4 : 0.28);
      parts.push(label(`Trial ${j + 1}`, x, top, P ? 22 : 19));
      stations.forEach((letter, i) => {
        const y = top - (i + 1) * pitch;
        const present = state[i] !== '–';
        const color = present ? colors[state[i]] : C.muted;
        parts.push(box(x, y, P ? 1.6 : 1.14, pitch * 0.84, pair.includes(i) ? C.ink : C.line, 0.91),
          label(present ? letter : '—', x, y, P ? 23 : 18, color));
      });
      if (pair.length) {
        const [a, b] = pair.map(i => state[i]);
        const present = a !== '–' && b !== '–';
        const text = !present ? 'missing' : outcomes ? (a === b ? 'together' : 'apart') : 'both here';
        const color = !present ? C.muted : outcomes && a !== b ? C.amber : C.green;
        parts.push(label(text, x, top - 7.1 * pitch, P ? 21 : 17, color));
      }
    });
    return new M.VGroup(...parts);
  }

  const d2 = ([x, y], [u, v]) => (x - u) ** 2 + (y - v) ** 2;
  function cluster(omit) {
    let current = starts;
    let previous = '';
    for (;;) {
      const groups = data.map((p, i) => i === omit ? '–' : d2(p, current[0]) <= d2(p, current[1]) ? '0' : '1');
      const state = groups.join('');
      if (state === previous) return state;
      previous = state;
      current = current.map((centre, k) => {
        const members = data.filter((_, i) => groups[i] === String(k));
        return members.length ? centre.map((_, axis) =>
          members.reduce((sum, p) => sum + p[axis], 0) / members.length) : centre;
      });
    }
  }

  const results = [...saved];
  const tallies = (a, b) => {
    const eligible = results.filter(row => row[a] !== '–' && row[b] !== '–');
    return [eligible.filter(row => row[a] === row[b]).length, eligible.length];
  };
  function rateTable(focus = null) {
    const pitch = P ? 1.0 : 0.62;
    const top = P ? 1.6 : 1.22;
    const left = CX - 3.5 * pitch;
    const parts = [];
    stations.forEach((letter, i) => {
      parts.push(label(letter, left + (i + 1) * pitch, top, P ? 23 : 18),
        label(letter, left, top - (i + 1) * pitch, P ? 23 : 18));
    });
    for (let a = 0; a < stations.length; a++) {
      for (let b = 0; b < stations.length; b++) {
        const x = left + (b + 1) * pitch;
        const y = top - (a + 1) * pitch;
        if (a >= b) {
          if (a === b) parts.push(label('—', x, y, P ? 20 : 16, C.muted));
          continue;
        }
        const [n, total] = tallies(a, b);
        const rate = Math.round(100 * n / total);
        const selected = focus?.[0] === a && focus?.[1] === b;
        const color = total ? (rate >= 80 ? C.cyan : C.amber) : C.muted;
        parts.push(box(x, y, pitch * 0.94, pitch * 0.84, selected ? C.ink : C.line, 0.95),
          label(total ? `${rate}%` : '—', x, y, P ? 20 : 16, color));
      }
    }
    parts.push(label(`${results.length} trials finished`, CX, top - 6.9 * pitch, P ? 22 : 18, C.ink));
    return new M.VGroup(...parts);
  }

  await until(S(0)); await play(...picture(groups('ABCDE', 'F')), ...say('SIX BICYCLE STATIONS'));
  await until(S(1)); await play(...picture(groups('BCDE', 'F')), ...say('WHAT IF A WERE MISSING?', C.amber));
  await until(S(2)); await play(...say('WOULD THE SAME GROUPS APPEAR?', C.violet));
  await until(S(3)); await play(...picture(grid()), ...updateDots('......'), ...say('DEPARTURES AND RETURNS'));
  await until(S(4)); await play(...resetCentres(), ...fbox([['Blue starts at D (7, 1)', C.cyan], ['Orange at F (9, 6)', C.amber]]), ...say('K-MEANS WITH TWO CENTRES'));
  await until(S(5)); await play(...updateDots('000001'), ...moveCentre(0, [4.2, 1.8]),
    ...fbox([['Blue: A B C D E', C.cyan], ['Orange: F', C.amber]]), ...say('THE CENTRES SETTLE'));
  await until(S(6)); await play(...loss([41.6, 41.6]), ...fbox(['Add every squared distance', ['to its group centre: 41.6', C.amber]]), ...say('FINAL INERTIA'));

  await until(S(7)); await play(...clearPlot(), ...picture(drawCards(stations)), ...fbox([]), ...say('ONE CARD PER STATION'));
  await until(S(7) + 1.35); await play(...picture(bag()));
  await until(S(8));
  await play(new M.Indicate(pictureNow, { color: C.violet, runTime: 0.55 }),
    ...say('SHAKE AND DRAW FIVE'), ...fbox(['Draw without replacement']));
  const drawn = cards(stations.slice(1), CARDY, C.cyan);
  await play(new M.LaggedStart(drawn.map(fadeIn), { lagRatio: 0.20, runTime: 1.05 }));
  await until(S(9));
  await play(...drawn.map(fadeOut), ...picture(new M.VGroup(...cards(stations.slice(1), P ? -3.6 : 0.25, C.cyan))),
    ...say('FIVE DIFFERENT STATIONS'), ...fbox([]));
  await until(S(10)); await play(...say('SUBSAMPLING', C.violet), ...fbox(['Original collection: 6', ['Smaller collection:  5', C.cyan]]));
  await until(S(11)); await play(...say('GROUP THE SMALLER COLLECTION'), ...picture(groups('BCDE', 'F')), ...fbox([]));
  await until(S(12)); await play(...say('CLUSTER STABILITY', C.green), ...fbox(['When the data changes,', 'do groups keep appearing?'], C.green));
  await until(S(13)); await play(...picture(drawCards(stations)), ...say('TRIAL 1'), ...fbox(['One complete check']));
  await until(S(14)); await play(...picture(drawCards(stations.slice(1))), ...fbox(['Draw: B C D E F', ['A is missing', C.amber]]));
  await until(S(15)); await play(...picture(grid()), ...updateDots('–.....'), ...resetCentres(),
    ...fbox([['Blue starts at (7, 1)', C.cyan], ['Orange at (9, 6)', C.amber]]));
  await until(S(16)); await play(...updateDots(saved[0]), ...say('TRIAL 1 · ROUND 1'),
    ...fbox([['Blue: B C D E', C.cyan], ['Orange: F', C.amber]]));
  await until(S(17)); await play(...moveCentre(0, [5, 2]), ...fbox([['Blue: (7, 1) → (5, 2)', C.cyan]]));
  await until(S(18)); await play(new M.Indicate(centres[1], { color: C.amber, runTime: 0.45 }),
    ...fbox([['Blue: (5, 2)', C.cyan], ['Orange stays at (9, 6)', C.amber]]));
  await until(S(19)); await play(...loss([28]), ...fbox([['Inertia = 28', C.amber]]));
  await until(S(20)); await play(...loss([28, 28]), ...say('TRIAL 1 · ROUND 2'),
    ...fbox(['Same groups and centres', ['Inertia still 28', C.amber]]));
  await until(S(21)); await play(...updateDots('......'), ...loss([]), ...say('TRIAL 1 SAVED', C.green),
    ...fbox([['Blue: B C D E', C.cyan], ['Orange: F', C.amber]]));

  await until(S(22)); await play(...updateDots('.–....'), ...say('TRIAL 2'),
    ...fbox(['Draw: A C D E F', ['B is missing', C.amber]]));
  await until(S(23)); await play(...resetCentres(), ...fbox([['Blue starts at (7, 1)', C.cyan], ['Orange at (9, 6)', C.amber]]));
  await until(S(24)); await play(...updateDots(saved[1]), ...say('TRIAL 2 · ROUND 1'),
    ...fbox([['Blue: A C D E', C.cyan], ['Orange: F', C.amber]]));
  await until(S(25)); await play(...moveCentre(0, [4.75, 1.75]),
    ...fbox([['Blue: (7, 1) → (4.75, 1.75)', C.cyan]]));
  await until(S(26)); await play(...loss([35.5]), ...fbox([['Orange stays at F', C.amber], ['Inertia = 35.5', C.amber]]));
  await until(S(27)); await play(...loss([35.5, 35.5]), ...say('TRIAL 2 · ROUND 2'),
    ...fbox(['Same groups and centres', ['Trial 2 saved', C.green]]));

  await until(S(28)); await play(...updateDots('...–..'), ...loss([]), ...say('TRIAL 3'),
    ...fbox(['Draw: A B C E F', ['D is missing', C.amber]]));
  await until(S(29)); await play(...resetCentres(),
    ...fbox([['Blue still starts at (7, 1)', C.cyan], ['Orange starts at F', C.amber]]));
  await until(S(30)); await play(...updateDots('000–01'), ...say('TRIAL 3 · ROUND 1'),
    ...fbox([['Blue: A B C E', C.cyan], ['Orange: F', C.amber]]));
  await until(S(31)); await play(...moveCentre(0, [3.5, 2]),
    ...fbox([['Blue: (7, 1) → (3.5, 2)', C.cyan]]));
  await until(S(32)); await play(...loss([31]), ...fbox([['Orange stays at F', C.amber], ['Inertia = 31', C.amber]]));

  const blueDistance = new M.DashedLine({ start: point(data[4]), end: point([3.5, 2]), color: C.cyan, strokeWidth: 2 });
  const orangeDistance = new M.DashedLine({ start: point(data[4]), end: point(starts[1]), color: C.amber, strokeWidth: 2 });
  await until(S(33)); await play(new M.Create(blueDistance, { runTime: 0.44 }), new M.Create(orangeDistance, { runTime: 0.44 }),
    ...say('TRIAL 3 · ROUND 2'), ...fbox([['E to blue: 4.50', C.cyan], ['E to orange: about 4.12', C.amber]]));
  await until(S(34)); await play(fadeOut(blueDistance), fadeOut(orangeDistance), ...updateDots(saved[2]),
    ...fbox([['Blue: A B C', C.cyan], ['Orange: E F', C.amber]]));
  await until(S(35)); await play(...moveCentre(0, [2, 2]), ...fbox([['Blue: (3.5, 2) → (2, 2)', C.cyan]]));
  await until(S(36)); await play(...moveCentre(1, [8.5, 4]), ...fbox([['Orange: (9, 6) → (8.5, 4)', C.amber]]));
  await until(S(37)); await play(...loss([31, 12.5]), ...fbox([['Inertia: 31 → 12.5', C.amber]]));
  await until(S(37) + 2.15); await play(...loss([31, 12.5, 12.5]), ...say('TRIAL 3 · ROUND 3'),
    ...fbox([['Inertia stays at 12.5', C.amber], ['Trial 3 saved', C.green]]));

  await until(S(38)); await play(...clearPlot(), ...picture(trialTable()), ...fbox([]), ...say('THREE FINISHED TRIALS'));
  await until(S(39)); await play(...picture(trialTable([2, 4])), ...say('PAIR: C AND E'),
    ...fbox(['Both present: 3 trials']));
  await until(S(40)); await play(...picture(trialTable([2, 4], true)),
    ...fbox([['Same group: 2 trials', C.green], 'Both present: 3 trials']));
  await until(S(41)); await play(...fbox(['2 ÷ 3 × 100', ['About 67%', C.green]]));
  await until(S(42)); await play(...picture(trialTable([4, 5], true)), ...say('PAIR: E AND F'),
    ...fbox(['1 ÷ 3 × 100', ['About 33%', C.amber]]));
  await until(S(43)); await play(...picture(trialTable([0, 2])), ...say('PAIR: A AND C'),
    ...fbox(['Both present: 2 trials']));
  await until(S(44)); await play(...picture(trialTable([0, 2], true)),
    ...fbox(['2 ÷ 2 × 100', ['100%', C.green]]));
  await until(S(45)); await play(...say('TOGETHER-RATE', C.green),
    ...fbox([['Together-rate for a pair', C.green]], C.green));
  await until(S(46)); await play(...fbox(['Trials in the same group', '÷ trials where both are present'], C.green));
  await until(S(47)); await play(...fbox(['Trials in the same group', '÷ trials where both are present', ['× 100 to get a percentage', C.green]], C.green));

  // Reproducible random draws keep the table identical when the viewer seeks.
  let seed = 14110;
  function randomOmission() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor(seed / 4294967296 * stations.length);
  }
  await until(S(48)); await play(...picture(drawCards(stations)), ...fbox([]), ...say('DRAW AND GROUP AGAIN'));
  for (let i = 0; i < 3; i++) {
    await until(S(48) + 0.75 + i * 1.1);
    const omit = randomOmission();
    const state = cluster(omit);
    results.push(state);
    await play(...picture(drawCards(stations.filter((_, j) => j !== omit))));
    await until(S(48) + 1.2 + i * 1.1);
    await play(...picture(groups(
      stations.filter((_, j) => state[j] === '0'),
      stations.filter((_, j) => state[j] === '1'),
    )));
  }

  await until(S(49)); await play(...picture(rateTable()), ...say('TABLE OF TOGETHER-RATES'));
  for (let i = 0; i < 5; i++) {
    await until(S(49) + 0.50 + i * 0.62);
    for (let j = 0; j < 6; j++) results.push(cluster(randomOmission()));
    await play(...picture(rateTable()));
  }
  await until(S(50));
  const [together, present] = tallies(0, 2);
  const rate = Math.round(100 * together / present);
  await play(...picture(rateTable([0, 2])), ...say('HIGH TOGETHER-RATES', C.green),
    ...fbox(['A and C', [`${together} ÷ ${present} × 100 = ${rate}%`, C.green]]));
  await until(S(51)); await play(...picture(groups('ABC', '')), ...say('A, B AND C KEEP GROUPING', C.green),
    ...fbox(['When present, these stations', 'keep sharing a group.'], C.green));
  await until(S(52)); await play(...say('WOULD THIS HELP PLAN SERVICES?', C.amber),
    ...fbox(['A group can keep appearing.', ['Check if it helps your plan.', C.amber]], C.amber));
  await until(S(53)); await play(...picture(rateTable([0, 2])), ...say('CLUSTER STABILITY', C.green),
    ...fbox(['Change the data, group again.', ['Count how often pairs', C.green], ['stay together.', C.green]], C.green));
}

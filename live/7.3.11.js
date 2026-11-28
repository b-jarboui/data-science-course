// lesson 7.3.11
// 7.3.11 Permutation test.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;

  const OLD = [1, 2, 3, 4, 7];
  const NEW = [5, 6, 8, 9, 10];
  const VALUES = Array.from({ length: 10 }, (_, i) => i + 1);

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 2.55, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const G = (...a) => new M.VGroup(...a.flat());

  function text(s, x, y, size = 20, c = C.ink, mono = false) {
    const t = T(String(s), size, c, mono);
    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(x, y, w, h, c, fill = 0, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w, height: h, cornerRadius: 0.07,
      color: c, strokeWidth: sw
    });
    r.setFill(c, fill);
    r.moveTo([x, y, 0]);
    return r;
  }

  const line = (a, b, c = C.muted, sw = 2) =>
    new M.Line({ start: a, end: b, color: c, strokeWidth: sw });

  let picture = null, boxNow = null;

  function scene(g) {
    const a = picture ? [new M.FadeOut(picture)] : [];
    if (g) a.push(new M.FadeIn(g));
    picture = g;
    return a;
  }

  function fbox(lines, color = C.cyan) {
    const lh = P ? 0.35 : 0.42;
    const ts = lines.map(r => {
      const [s, c] = Array.isArray(r) ? r : [r, C.ink];
      return T(s, P ? 21 : 20, c, true);
    });
    const w = Math.max(...ts.map(t => t.getWidth())) + 0.55;
    const r = rect(BOXP[0], BOXP[1], w, ts.length * lh + 0.3, color);
    r.setFill(C.card, 0.95);

    ts.forEach((t, i) => t.moveTo([
      BOXP[0] - w / 2 + 0.275 + t.getWidth() / 2,
      BOXP[1] + (ts.length - 1) * lh / 2 - i * lh, 0
    ]));

    const g = G(r, ts), maxw = P ? FW - 1.0 : 4.9;
    if (w > maxw) g.scale(maxw / w);

    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function ratingCard(v, x, y, c = C.muted) {
    return G(
      rect(x, y, 0.88, 0.92, c, 0.1),
      text(v, x, y + 0.1, 29, C.ink, true)
    );
  }

  function groupRows() {
    return G(
      OLD.map((v, i) =>
        ratingCard(v, CX + (i - 2) * 1.13, 0.55, C.amber)),
      NEW.map((v, i) =>
        ratingCard(v, CX + (i - 2) * 1.13, -1.0, C.cyan)),
      text('Old script', CX, 1.25, 20, C.amber),
      text('New script', CX, -1.78, 20, C.cyan)
    );
  }

  function meanBars() {
    const base = P ? -3.4 : -2.05;
    const h = P ? 0.44 : 0.31;
    const a = [
      line([CX - 2.9, base, 0], [CX + 2.9, base, 0])
    ];

    [3.4, 7.6].forEach((v, i) => {
      const x = CX + (i - 0.5) * 2.6;
      const c = i ? C.cyan : C.amber;
      a.push(
        rect(x, base + v * h / 2, 1.3, v * h, c, 0.75),
        text(v, x, base + v * h + 0.28, 27, c, true),
        text(i ? 'New mean' : 'Old mean', x, base - 0.35, 19, c)
      );
    });

    const x = CX + 0.05;
    const y1 = base + 3.4 * h, y2 = base + 7.6 * h;

    a.push(
      line([x, y1, 0], [x, y2, 0], C.violet, 3),
      line([x - 0.12, y1, 0], [x + 0.12, y1, 0], C.violet),
      line([x - 0.12, y2, 0], [x + 0.12, y2, 0], C.violet),
      text('4.2', x + 0.44, (y1 + y2) / 2, 22, C.violet, true)
    );

    return G(a);
  }

  // Fixed card coordinates. Only group stickers change position.
  const cardPos = v => [
    CX + ((v - 1) % 5 - 2) * 1.19,
    0.55 - Math.floor((v - 1) / 5) * 1.47,
    0
  ];

  function fixedCards() {
    return G(VALUES.map(v => {
      const [x, y] = cardPos(v);
      return ratingCard(v, x, y);
    }));
  }

  function sticker(v, old, lifted = false) {
    const [x, y] = cardPos(v);
    const c = old ? C.amber : C.cyan;
    const yy = y + (lifted ? 0.69 : -0.32);

    return G(
      rect(x, yy, 0.8, 0.3, c, 0.85, 1),
      text(old ? 'OLD' : 'NEW', x, yy, 15, C.bg, true)
    );
  }

  function labelledCards(old = OLD) {
    return G(
      fixedCards(),
      VALUES.map(v => sticker(v, old.includes(v)))
    );
  }

  // Exact enumeration, using integer gap numerators.
  // If old sum is s, new sum is 55-s:
  // new mean - old mean = (55-2s)/5.
  const allocations = [];

  for (let mask = 0; mask < 1024; mask++) {
    const old = VALUES.filter((_, i) => (mask >> i) & 1);
    if (old.length !== 5) continue;

    const oldSum = old.reduce((a, b) => a + b, 0);
    const newSum = 55 - oldSum;

    allocations.push({
      old,
      oldSum,
      newSum,
      numerator: newSum - oldSum,
      gap: (newSum - oldSum) / 5
    });
  }

  const examples = [3, -7, 11].map(n =>
    allocations.find(a => a.numerator === n));

  const actual = allocations.find(a =>
    a.old.every((v, i) => v === OLD[i]));

  const frequencies = new Map();

  allocations.forEach(a => {
    frequencies.set(a.numerator,
      (frequencies.get(a.numerator) || 0) + 1);
  });

  const bins = [...frequencies.entries()]
    .sort((a, b) => a[0] - b[0]);

  const maxFreq = Math.max(...frequencies.values());

  const BASE = P ? -3.65 : -2.05;
  const W = P ? 6.3 : 6.6;
  const X = v => CX + v / 5.4 * W / 2;
  const DOTP = (P ? 4.6 : 2.8) / maxFreq;
  const DOTR = Math.min(0.09, DOTP * 0.39, W / 100);

  function dot(gap, j, c = C.violet) {
    return new M.Dot({
      point: [X(gap), BASE + (j + 0.5) * DOTP, 0],
      radius: DOTR, color: c
    });
  }

  function axis() {
    const a = [
      line([X(-5.4), BASE, 0], [X(5.4), BASE, 0]),
      new M.DashedLine({
        start: [X(0), BASE, 0],
        end: [X(0), BASE + maxFreq * DOTP + 0.1, 0],
        color: C.muted
      })
    ];

    [-5, -4, -2, 0, 2, 4, 5].forEach(v => {
      a.push(
        line([X(v), BASE - 0.06, 0], [X(v), BASE + 0.06, 0]),
        text(v, X(v), BASE - 0.27, 15, C.muted, true)
      );
    });

    a.push(text('New mean − old mean', CX, BASE - 0.74, 18, C.muted));
    a.push(text('each dot = one shuffle', X(-3.2), BASE + (P ? 4.15 : 2.75), 16, C.muted));

    return G(a);
  }

  function distribution(tails = 0, mark = false) {
    const a = [axis()];

    bins.forEach(([numerator, n]) => {
      const gap = numerator / 5;
      const extreme =
        (tails >= 1 && numerator >= 21) ||
        (tails === 2 && numerator <= -21);

      for (let j = 0; j < n; j++) {
        a.push(dot(gap, j, extreme ? C.amber : C.violet));
      }
    });

    if (mark) {
      const y = BASE + (P ? 3.4 : 2.1);

      a.push(
        new M.DashedLine({
          start: [X(4.2), BASE, 0],
          end: [X(4.2), y, 0], color: C.cyan
        }),
        text('+4.2', X(4.2), y + 0.25, 20, C.cyan, true)
      );

      if (tails === 2) {
        a.push(
          new M.DashedLine({
            start: [X(-4.2), BASE, 0],
            end: [X(-4.2), y, 0], color: C.amber
          }),
          text('−4.2', X(-4.2), y + 0.25, 20, C.amber, true)
        );
      }
    }

    return G(a);
  }

  function allocationWall(both = false) {
    const sorted = allocations.slice()
      .sort((a, b) => a.numerator - b.numerator);

    return G(sorted.map((a, i) => {
      const extreme = a.numerator >= 21 ||
        (both && a.numerator <= -21);

      return rect(
        CX + (i % 18 - 8.5) * 0.35,
        1.07 - Math.floor(i / 18) * 0.23,
        0.27, 0.15,
        extreme ? C.amber : C.violet,
        extreme ? 0.95 : 0.24, 0
      );
    }));
  }

  // 0-6: observed difference in means.
  await until(S(0));
  await play(...scene(groupRows()),
    ...say('BACK TO THE TEN CUSTOMER RATINGS'));

  await until(S(1));
  await play(...fbox([['Old: 1, 2, 3, 4, 7', C.amber],
    ['New: 5, 6, 8, 9, 10', C.cyan]]));

  await until(S(2));
  await play(...say('THIS TIME: COMPARE THE MEANS', C.violet));

  await until(S(3));
  await play(...fbox(['Old sum = 17',
    ['17 ÷ 5 = 3.4', C.amber]]));

  await until(S(4));
  await play(...fbox(['New sum = 38',
    ['38 ÷ 5 = 7.6', C.cyan]]));

  await until(S(5));
  await play(...scene(meanBars()),
    ...fbox(['Difference in means',
      ['7.6 − 3.4 = 4.2', C.violet]]),
    ...say('OBSERVED GAP = 4.2', C.violet));

  await until(S(6));
  await play(...say('COULD LUCK ALONE PRODUCE THIS GAP?', C.amber));

  // 7-10: introduce the randomisation idea.
  await until(S(7));
  await play(...scene(labelledCards()),
    ...say('KEEP THE RATINGS FIXED'));

  await until(S(8));
  await play(...fbox(['Under the no-effect null',
    ['Ratings stay fixed', C.violet]]),
    ...say('IF THE SCRIPT MAKES NO DIFFERENCE', C.violet));

  await until(S(9));
  await play(...say('OLD AND NEW ARE JUST LABELS', C.amber));

  // The neutral rating cards remain fixed throughout the shuffles.
  // Each coloured sticker is its own on-screen object.
  let locations = [OLD.slice(), NEW.slice()];

  const stickers = locations.flatMap((row, k) =>
    row.map(v => sticker(v, k === 0)));

  await until(S(10));
  await play(...scene(fixedCards()),
    new M.LaggedStart(stickers.map(s => new M.FadeIn(s)),
      { lagRatio: 0.03, runTime: 0.5 }),
    ...say('PEEL OFF THE GROUP LABELS'));

  await play(new M.LaggedStart(stickers.map((s, i) => {
    const old = i < 5;
    const v = locations[old ? 0 : 1][i % 5];
    return new M.Transform(s, sticker(v, old, true));
  }), { lagRatio: 0.04, runTime: 0.65 }));

  function shuffleTo(oldValues) {
    const next = [
      oldValues.slice().sort((a, b) => a - b),
      VALUES.filter(v => !oldValues.includes(v))
    ];

    const animations = stickers.map((s, i) => {
      const old = i < 5;
      return new M.Transform(s, sticker(
        next[old ? 0 : 1][i % 5], old
      ), { pathArc: old ? 0.45 : -0.45 });
    });

    locations = next;

    return new M.LaggedStart(animations, {
      lagRatio: 0.04, runTime: 1.25
    });
  }

  // 11-13: three real, reproducible example shuffles.
  await until(S(11));
  await play(shuffleTo(examples[0].old),
    ...say('SHUFFLE FIVE AMBER AND FIVE CYAN LABELS'));

  await until(S(12));
  await play(...fbox(['Gap after each shuffle',
    ['mean(new) − mean(old)', C.violet]]),
    ...say('RECALCULATE THE SAME STATISTIC', C.violet));

  function exampleBox(a, n) {
    return fbox([
      `Shuffle ${n}`,
      `${a.newSum}/5 − ${a.oldSum}/5`,
      [`Gap = ${a.gap.toFixed(1)}`, C.cyan]
    ]);
  }

  await until(S(13));
  await play(...exampleBox(examples[0], 1),
    ...say('SHUFFLE 1: +0.6'));

  await until(S(13) + 2.6);
  await play(shuffleTo(examples[1].old),
    ...exampleBox(examples[1], 2),
    ...say('SHUFFLE 2: −1.4'));

  await until(S(13) + 5.3);
  await play(shuffleTo(examples[2].old),
    ...exampleBox(examples[2], 3),
    ...say('SHUFFLE 3: +2.2'));

  // 14-17: build the exact null distribution.
  const axisNow = axis();

  const sampleNumerators = new Set(examples.map(a => a.numerator));
  const firstDots = examples.map(a => dot(a.gap, 0, C.cyan));

  const stacks = bins.map(([numerator, n]) => {
    const start = sampleNumerators.has(numerator) ? 1 : 0;
    return G(Array.from({ length: n - start }, (_, j) =>
      dot(numerator / 5, j + start)));
  });

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...stickers)),
    ...scene(null),
    new M.FadeIn(axisNow),
    new M.LaggedStart(firstDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.16, runTime: 1.0 }),
    ...say('ONE SHUFFLED GAP = ONE DOT'));

  await play(new M.LaggedStart(
    stacks.map(g => new M.FadeIn(g)),
    { lagRatio: 0.035, runTime: 2.8 }
  ));

  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(axisNow, ...firstDots, ...stacks)),
    ...scene(distribution()),
    ...fbox(['Null distribution',
      ['Centred on zero', C.violet]]),
    ...say('THE GAPS THAT LUCK ALONE PRODUCES', C.violet));

  await until(S(16));
  await play(...fbox(['Choose 5 old labels out of 10',
    ['252 possible shuffles', C.violet]]),
    ...say('252 POSSIBLE SHUFFLES'));

  await until(S(17));
  await play(...say('A COMPUTER CAN TRY EVERY ONE', C.green));

  // 18-23: locate the observed statistic and both tails.
  await until(S(18));
  await play(...scene(distribution(0, true)),
    ...fbox(['Actual difference', [actual.gap.toFixed(1), C.cyan]]),
    ...say('MARK OUR REAL GAP: +4.2'));

  await until(S(19));
  await play(...scene(distribution(1, true)),
    ...fbox(['Gap ≥ +4.2',
      ['4 of 252 shuffles', C.amber]]),
    ...say('FOUR SHUFFLES IN THE RIGHT TAIL', C.amber));

  await until(S(20));
  await play(...scene(distribution(2, true)),
    ...fbox(['Gap ≤ −4.2',
      ['4 more shuffles', C.amber]]),
    ...say('FOUR IN THE OTHER TAIL TOO', C.amber));

  await until(S(21));
  await play(...scene(allocationWall(true)),
    ...fbox(['p = (4 + 4) / 252',
      ['p ≈ 0.032', C.green]]),
    ...say('8 EXTREME SHUFFLES OUT OF 252'));

  await until(S(22));
  await play(...scene(distribution(2, true)),
    ...fbox(['0.032 < 0.05',
      ['Reject the null', C.green]]),
    ...say('OUR REAL LABELLING IS UNUSUAL', C.green));

  await until(S(23));
  await play(...scene(labelledCards(examples[0].old)),
    ...say('PERMUTATION TEST = RESHUFFLE LABELS', C.violet));

  // 24-25: deterministic Monte Carlo demonstration.
  // Sampling with replacement from the valid 252 allocations.
  let seed = 73311;

  function rand() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const simulations = Array.from({ length: 1000 }, () =>
    allocations[Math.floor(rand() * allocations.length)]);

  const extremeN = simulations.filter(a =>
    Math.abs(a.numerator) >= 21).length;

  function monteCarlo() {
    const counts = new Map();

    simulations.forEach(a => {
      counts.set(a.numerator, (counts.get(a.numerator) || 0) + 1);
    });

    const max = Math.max(...counts.values());
    const base = P ? -3.3 : -1.95;
    const hh = P ? 4.2 : 2.7;

    const a = [line([X(-5.4), base, 0], [X(5.4), base, 0])];

    [...counts.entries()].forEach(([n, count]) => {
      const h = hh * count / max;
      const c = Math.abs(n) >= 21 ? C.amber : C.violet;

      a.push(rect(X(n / 5), base + h / 2,
        W / 10.8 * 0.32, h, c, 0.7, 1));
    });

    [-4, -2, 0, 2, 4].forEach(v =>
      a.push(text(v, X(v), base - 0.29, 16, C.muted, true)));

    a.push(text('1,000 randomly sampled shuffles',
      CX, base - 0.73, 17, C.muted));

    return G(a);
  }

  await until(S(24));
  await play(...fbox(['Bigger data',
    ['Too many shuffles to try all', C.amber]]),
    ...say('TOO MANY SHUFFLES TO TRY ALL', C.amber));

  await until(S(25));
  await play(...scene(monteCarlo()),
    ...fbox(['1,000 random shuffles',
      `${extremeN}/1000 = ${(extremeN / 1000).toFixed(3)}`,
      ['Exact p ≈ 0.032', C.green]]),
    ...say('OR TRY 1,000 RANDOM SHUFFLES'));

  // 26-32: recipe, flexibility and rank-test connection.
  await until(S(26));
  await play(...scene(distribution(2, true)),
    ...say('THE FORMULA IS THE RECIPE', C.violet));

  await until(S(27));
  await play(...fbox([['p = extreme shuffles', C.violet],
    '    ÷ all shuffles',
    ['Here: 8/252 ≈ 0.032', C.green]]));

  await until(S(28));
  await play(...scene(allocationWall(true)),
    ...say('WHAT SHARE OF NULL WORLDS IS AS EXTREME?'));

  await until(S(29));
  await play(...scene(G(
    ['Mean', 'Median', 'Share', 'Rank sum'].map((s, i) => {
      const x = CX + (i % 2 - 0.5) * 3.05;
      const y = 0.6 - Math.floor(i / 2) * 1.3;

      return G(
        rect(x, y, 2.8, 0.92, C.violet, 0.08),
        text(s, x, y, 23, C.violet)
      );
    })
  )), ...fbox(['Choose the statistic',
    ['Shuffle, then recompute it', C.green]]),
    ...say('MANY POSSIBLE COMPARISONS'));

  await until(S(30));
  await play(...scene(distribution(2, true)),
    ...say('THE DATA BUILD THEIR OWN NULL DISTRIBUTION', C.violet));

  await until(S(31));
  await play(...scene(labelledCards()),
    ...fbox(['Mann–Whitney',
      ['Permutation of ranks', C.violet]]),
    ...say('THE RANK TEST ALSO SHUFFLES LABELS', C.violet));

  await until(S(32));
  await play(...scene(G(
    rect(CX - 1.65, 0.1, 3.1, 1.9, C.cyan, 0.06),
    rect(CX + 1.65, 0.1, 3.1, 1.9, C.violet, 0.06),
    text('Mean-gap test', CX - 1.65, 0.6, 20, C.cyan),
    text('Rank-sum test', CX + 1.65, 0.6, 20, C.violet),
    text('8/252', CX - 1.65, -0.15, 28, C.cyan, true),
    text('8/252', CX + 1.65, -0.15, 28, C.violet, true),
    text('Here ratings equal ranks', CX, -1.35, 20, C.muted)
  )), ...say('HERE BOTH TESTS GIVE THE SAME p-VALUE'));

  // 33-38: exchangeability and valid shuffling.
  await until(S(33));
  await play(...scene(labelledCards()),
    ...say('TRAP: LABELS MUST BE EXCHANGEABLE', C.amber));

  await until(S(34));
  await play(...scene(labelledCards(examples[1].old)),
    ...fbox(['Exchangeable under the null',
      ['Swapping labels is valid', C.violet]]));

  await until(S(35));
  await play(...scene(labelledCards(examples[2].old)),
    ...say('RANDOM ASSIGNMENT MAKES SHUFFLING FAIR', C.green));

  function pairedExample(swapped = false) {
    const pairs = [
      ['A', 12, 9],
      ['B', 15, 11],
      ['C', 10, 11]
    ];

    return G(pairs.map(([id, old, now], i) => {
      const y = 0.9 - i * 1.02;
      const swap = swapped && i === 1;

      return G(
        rect(CX, y, 5.4, 0.86, C.muted, 0.03),
        text(id, CX - 2.25, y, 20, C.ink),
        text(old, CX - 0.9, y + 0.12, 24, C.ink, true),
        text(now, CX + 0.9, y + 0.12, 24, C.ink, true),
        text(swap ? 'After' : 'Before', CX - 0.9, y - 0.23,
          15, swap ? C.cyan : C.amber),
        text(swap ? 'Before' : 'After', CX + 0.9, y - 0.23,
          15, swap ? C.amber : C.cyan),
        text('↔', CX, y, 23, C.violet)
      );
    }));
  }

  await until(S(36));
  await play(...scene(pairedExample()),
    ...fbox(['Paired data',
      ['Swap within each pair only', C.amber]]),
    ...say('KEEP THE PAIRS TOGETHER', C.amber));

  await until(S(36) + 4.0);
  await play(...scene(pairedExample(true)),
    ...say('EXAMPLE: SWAP B’S BEFORE AND AFTER', C.violet));

  await until(S(37));
  await play(...scene(G(
    rect(CX - 1.65, 0.1, 3.1, 1.7, C.amber, 0.08),
    rect(CX + 1.65, 0.1, 3.1, 1.7, C.cyan, 0.08),
    text('Experienced agents', CX - 1.65, 0.45, 19, C.ink),
    text('Old script only', CX - 1.65, -0.24, 19, C.amber),
    text('Newer agents', CX + 1.65, 0.45, 19, C.ink),
    text('New script only', CX + 1.65, -0.24, 19, C.cyan),
    text('Experience is mixed up with script', CX, -1.25, 20, C.amber)
  )), ...fbox(['Other differences break',
    ['exchangeability', C.amber]]),
    ...say('GROUPS DIFFER IN OTHER WAYS: DO NOT SHUFFLE', C.amber));

  await until(S(38));
  await play(...scene(distribution(2, true)),
    ...fbox(['Observed gap = 4.2',
      ['p = 8/252 ≈ 0.032', C.green],
      'Reject the null']),
    ...say('PERMUTATION: HOW OFTEN DOES LUCK LOOK THIS EXTREME?', C.green));

  await until(E(38));
}

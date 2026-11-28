// 17.2.2 Epochs and shuffling. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 4.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.5, 0] : [4.3, -0.3, 0];
  const orange = '#fb923c';
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pt = (x, y) => [x, y, 0];
  const text = (s, x, y, color = C.ink, size = 18) => T(String(s), size, color, true).moveTo(pt(x, y));
  const rect = (x, y, w, h, color, fill = C.card, op = 0.96) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color, strokeWidth: 2 });
    r.setFill(fill, op); r.moveTo(pt(x, y)); return r;
  };
  const appear = (...o) => o.map(x => new M.FadeIn(x));
  const leave = (...o) => o.map(x => new M.FadeOut(x));

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const lh = 0.42;
    const rows = lines.map(r => Array.isArray(r) ? r : [r, C.ink]);
    const labels = rows.map(([s, c]) => T(s, P ? 21 : 20, c, true));
    const width = Math.max(...labels.map(l => l.getWidth())) + 0.65, height = rows.length * lh + 0.32;
    const [x, y] = BOXP;
    labels.forEach((l, i) => l.moveTo(pt(x - width / 2 + 0.325 + l.getWidth() / 2, y + ((rows.length - 1) / 2 - i) * lh)));
    const g = new M.VGroup(rect(x, y, width, height, color), ...labels);
    const maxW = P ? FW - 1.2 : 4;
    if (width > maxW) g.scale(maxW / width);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const count = (ep, up, used, col = C.cyan) => fbox([`epoch ${ep}`, [`updates: ${up}`, col], `cards used: ${used} of 10`], col);

  // two zones (left = to use, right = used), each 2 columns x 5 rows; one row = one pair
  const CW = P ? 0.85 : 0.55, CH = P ? 0.8 : 0.62;
  const zx = [[-6.3, -5.62], [0.6, 1.28]];
  const rowY = r => 1.2 - r * 0.82;
  // phone: each zone is a strip of 5 columns (one column = one pair), TO USE on top, USED at the bottom
  const colX = r => (r - 2) * 1.35, zoneY = [[2.95, 2.1], [-3.15, -4.0]];
  const slot = (side, s) => P ? [colX(Math.floor(s / 2)), zoneY[side][s % 2]] : [zx[side][s % 2], rowY(Math.floor(s / 2))];
  const cardAt = (d, [x, y], col = C.cyan) => new M.VGroup(rect(x, y, CW, CH, col, '#18233e'),
    T(String(d), P ? 30 : 24, C.ink, false, true).moveTo(pt(x, y)));
  const cards = Array.from({ length: 10 }, (_, d) => cardAt(d, slot(0, d)));
  const labY = rowY(4) - CH / 2 - 0.28;
  const zoneLab = P ? [text('TO USE', 0, 3.55, C.muted, 16), text('USED', 0, -2.53, C.green, 16)]
    : [text('TO USE', (zx[0][0] + zx[0][1]) / 2, labY, C.muted, 15), text('USED', (zx[1][0] + zx[1][1]) / 2, labY, C.green, 15)];
  const outline = (side, r, col = C.amber) => {
    if (P) { const o = new M.RoundedRectangle({ width: CW + 0.22, height: zoneY[side][0] - zoneY[side][1] + CH + 0.2, cornerRadius: 0.12, color: col, strokeWidth: 4 });
      o.moveTo(pt(colX(r), (zoneY[side][0] + zoneY[side][1]) / 2)); return o; }
    const x = (zx[side][0] + zx[side][1]) / 2;
    const o = new M.RoundedRectangle({ width: zx[side][1] - zx[side][0] + CW + 0.2, height: CH + 0.18, cornerRadius: 0.12, color: col, strokeWidth: 4 });
    o.moveTo(pt(x, rowY(r))); return o;
  };

  // network between the zones
  const N = net({ layers: [3, 4, 3], center: pt(P ? 0 : -2.6, P ? -0.3 : -0.45), width: P ? 5.2 : 3.4, height: P ? 2.8 : 2.4, r: P ? 0.22 : 0.16 });
  let ver = 0;
  const newWeights = () => { ver++; const a = [];
    for (let l = 0; l < 2; l++) N.edges[l].forEach((row, i) => row.forEach((_, j) => a.push(...N.weight(l, i, j, ((ver * 37 + i * 13 + j * 7 + l * 5) % 17) / 8 - 1))));
    return a; };
  async function learn(fast = false) {
    await play(...N.flow(0, C.amber));
    await play(...N.flow(1, C.amber));
    if (!fast) await play(...N.flow(1, orange), new M.Indicate(N.nodes[2][1], { color: C.pink }));
    await play(...newWeights());
  }
  async function moveRow(r, digits, side = 1) {
    await play(...digits.map((d, c) => new M.Transform(cards[d], cardAt(d, slot(side, 2 * r + c)), { pathArc: -0.5 })));
  }

  const parcel = (() => {
    const s = P ? 1.25 : 1, x = P ? 0 : CX, y = P ? 0.2 : -0.2;
    const box = rect(x, y, 4.2 * s, 2.8 * s, C.amber, '#3a2a17', 0.95);
    const lab = rect(x + 0.5 * s, y - 0.2 * s, 2.4 * s, 1.3 * s, C.ink, '#e8edf7', 1);
    const tape = rect(x, y + 1.15 * s, 4.2 * s, 0.35 * s, C.amber, '#5a4320', 1);
    const dig = T('4 0 7 1', P ? 40 : 36, C.bg, true, true).moveTo(pt(x + 0.5 * s, y - 0.2 * s));
    return new M.VGroup(box, tape, lab, dig);
  })();
  await until(S(0)); await play(...appear(parcel), ...say('READ DIGITS ON PARCEL LABELS'), ...fbox(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await play(...leave(parcel), new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.5 }), ...say('TEN TRAINING CARDS: 0 TO 9'), ...fbox(['10 training cards', ['digits 0 to 9', C.amber]]));
  await until(S(2)); await play(...say('LAST TIME: LEARN FROM A SMALL GROUP'));
  await until(S(3)); await play(...say('SMALL GROUP = MINI-BATCH', C.amber));
  await until(S(4)); await play(...say('DOES EVERY CARD TAKE PART?', C.pink));
  await until(S(5)); await play(...appear(zoneLab[0]), new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.08, runTime: 1.4 }), ...say('ALL TEN CARDS, IN ORDER'));
  await until(S(6)); await play(...appear(N.group), ...say('OUR NETWORK'));
  await until(S(7)); await play(...say('2 CARDS PER MINI-BATCH', C.amber), ...fbox([['batch size = 2', C.amber]], C.amber));

  // 8-16 first update
  let box = outline(0, 0);
  await until(S(8)); await play(new M.Create(box), ...say('CARDS 0 AND 1', C.amber));
  await until(S(9)); await play(...say('A PREDICTION FOR EACH PICTURE'));
  await play(...N.flow(0, C.amber)); await play(...N.flow(1, C.amber));
  await until(S(10)); await play(new M.Indicate(N.nodes[2][1], { color: C.pink }), ...say('LOSS: HOW WRONG?', C.pink));
  await until(S(11)); await play(...N.flow(1, orange), ...say('WORK BACKWARDS: GRADIENTS', orange));
  await play(...N.flow(0, orange));
  await until(S(12)); await play(...fbox(['gradient, card 0', 'gradient, card 1', ['mean gradient → change', orange]], orange));
  await until(S(13)); await play(...newWeights(), ...say('WEIGHTS CHANGE ONCE'));
  await until(S(14)); await play(...say('UPDATE = ONE TRAINING STEP', C.green), ...count(1, 1, 2, C.green));
  await until(S(15)); await play(new M.FadeOut(box), ...appear(zoneLab[1]), ...say('MOVE USED CARDS RIGHT'));
  await moveRow(0, [0, 1]);
  await until(S(16)); await play(...count(1, 1, 2), ...say('1 UPDATE • 2 CARDS'));

  // 17-26 the rest of the first epoch
  box = outline(0, 1);
  await until(S(17)); await play(new M.Create(box), ...say('CARDS 2 AND 3', C.amber));
  await until(S(18)); await play(...say('NEW WEIGHTS, FRESH PREDICTIONS'));
  await play(...N.flow(0, C.amber)); await play(...N.flow(1, C.amber));
  await until(S(19)); await play(...N.flow(1, orange), ...say('LOSS • GRADIENTS • UPDATE', orange));
  await play(...newWeights());
  await until(S(20)); await play(new M.FadeOut(box), ...count(1, 2, 4));
  await moveRow(1, [2, 3]);
  box = outline(0, 2);
  await until(S(21)); await play(new M.Create(box), ...say('CARDS 4 AND 5', C.amber));
  await until(S(22)); await learn(true);
  await play(new M.FadeOut(box));
  await moveRow(2, [4, 5]);
  await until(S(23)); await play(...count(1, 3, 6), ...say('6 CARDS USED'));
  await until(S(24)); await play(...say('A LITTLE FASTER', C.green));
  await until(S(25)); await play(...say('CARDS 6 AND 7: UPDATE 4', C.amber));
  await learn(true); await moveRow(3, [6, 7]);
  await play(...count(1, 4, 8));
  await until(S(26)); await play(...say('CARDS 8 AND 9: UPDATE 5', C.amber));
  await learn(true); await moveRow(4, [8, 9]);
  await play(...count(1, 5, 10, C.green));

  // 27-32 one epoch
  await until(S(27)); await play(new M.Indicate(zoneLab[0], { color: C.muted }), new M.Indicate(zoneLab[1], { color: C.green }), ...say('LOOK AT BOTH SIDES'));
  await until(S(28)); await play(new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.06, runTime: 1.4 }), ...say('LEFT: NONE  •  RIGHT: ALL TEN', C.green));
  await until(S(29)); await play(...say('EVERY CARD EXACTLY ONCE', C.green));
  await until(S(30)); await play(...say('ONE FULL PASS = AN EPOCH', C.amber), ...fbox([['epoch 1 done', C.amber], 'every card once'], C.amber));
  await until(S(31)); await play(...fbox([['epoch 1 done', C.amber], ['5 updates', C.green]], C.amber));
  await until(S(32)); await play(...say('ONE EPOCH IS OFTEN NOT ENOUGH', C.pink));

  // 33-42 second epoch, shuffled
  await until(S(33)); await play(...cards.map((c, d) => new M.Transform(c, cardAt(d, slot(0, d)), { pathArc: 0.5 })), ...say('CARDS BACK • KEEP THE WEIGHTS'));
  const order = [3, 0, 8, 1, 5, 2, 9, 4, 6, 7];
  await until(S(34)); await play(...say('MIX THE CARDS', C.violet), new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.05, runTime: 1.0 }));
  await play(...order.map((d, s) => new M.Transform(cards[d], cardAt(d, slot(0, s)), { pathArc: 1.2 })));
  await until(S(35)); await play(...say('RANDOM NEW ORDER = SHUFFLING', C.violet));
  const zoneBox = P ? new M.RoundedRectangle({ width: 6.6, height: 1.76, cornerRadius: 0.16, color: C.violet, strokeWidth: 4 })
    : new M.RoundedRectangle({ width: 1.75, height: 4.3, cornerRadius: 0.16, color: C.violet, strokeWidth: 4 });
  zoneBox.moveTo(P ? pt(0, 2.52) : pt((zx[0][0] + zx[0][1]) / 2, rowY(2)));
  await until(S(36)); await play(new M.Create(zoneBox), ...say('THE NEW ORDER', C.violet), ...fbox([['new order:', C.violet], '3 0 8 1 5 2 9 4 6 7'], C.violet));
  await play(new M.FadeOut(zoneBox));
  const pairs = [0, 1, 2, 3, 4].map(r => outline(0, r, C.violet));
  await until(S(37)); await play(new M.Create(pairs[0]), ...say('PAIRS: 3, 0 • 8, 1', C.violet));
  await play(new M.Create(pairs[1]));
  await until(S(38)); await play(new M.Create(pairs[2]), ...say('5, 2 • 9, 4', C.violet));
  await play(new M.Create(pairs[3]));
  await until(S(39)); await play(new M.Create(pairs[4]), ...say('LAST PAIR: 6, 7', C.violet));
  await until(S(40)); await play(...say('TRAIN IN THE NEW ORDER'), ...leave(...pairs), ...count(2, 0, 0));
  for (let r = 0; r < 3; r++) {
    await play(...N.flow(0, C.amber), ...newWeights());
    await moveRow(r, order.slice(2 * r, 2 * r + 2));
  }
  await until(S(41)); await play(...say('5 UPDATES • ALL TEN ONCE AGAIN', C.green));
  for (let r = 3; r < 5; r++) {
    await play(...N.flow(0, C.amber), ...newWeights());
    await moveRow(r, order.slice(2 * r, 2 * r + 2));
  }
  await until(S(42)); await play(...fbox([['2 epochs', C.green], ['10 updates in total', C.green], 'cards used: 10 of 10'], C.green));

  // 43-50 formula and meaning
  await until(S(43)); await play(...say('CARDS SPLIT EVENLY: A SHORT FORMULA', C.amber));
  await until(S(44)); await play(...fbox(['updates per epoch', '  = training cards', '    ÷ cards per batch'], C.amber));
  await until(S(45)); await play(...fbox(['updates per epoch', '  = 10 ÷ 2', ['  = 5', C.amber]], C.amber), ...say('10 ÷ 2 = 5', C.amber));
  await until(S(46)); await play(...say('EPOCHS COUNT FULL PASSES'));
  await until(S(47)); await play(...say('SHUFFLING: NEW GROUPS EACH PASS', C.violet), ...fbox([['epoch 1: 0,1  2,3  4,5 ...', C.cyan], ['epoch 2: 3,0  8,1  5,2 ...', C.violet]], C.violet));
  await until(S(48)); await play(...say('MORE EPOCHS ≠ ALWAYS BETTER', C.pink));
  await until(S(49)); await play(...say('CHECK THE LOSS ON NEW PICTURES', C.pink), ...fbox([['new pictures', C.pink], ['→ measure the loss', C.pink]], C.pink));
  await until(S(50)); await play(...say('EPOCH = EVERY CARD ONCE • SHUFFLE BEFORE NEXT', C.green),
    ...fbox(['epoch = every card once', ['shuffle before each pass', C.violet]], C.green));
}

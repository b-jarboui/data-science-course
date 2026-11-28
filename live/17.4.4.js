// 17.4.4 Gated recurrent units: choosing what to keep (script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const times = ['9:00', '9:10', '9:20'];
  const temperatures = [21, 22, 21];
  const readings = [1, 2, 1];
  const CX = P ? 0 : -2.6;
  const SIDE = 4.35;                                   // laptop: right-hand panel
  const PILL = [CX, P ? 3.55 : 1.85, 0];
  const BOXP = P ? [0, -5.55, 0] : [SIDE, 0.55, 0];
  const NOTEP = P ? [0, -3.95, 0] : [SIDE, -1.2, 0];
  const BARP = P ? [0, -4.75, 0] : [SIDE, -2.1, 0];
  const CARD_Y = P ? 2.35 : 0.93;
  const colx = i => CX + (i - 1) * (P ? 2.19 : 2.25);
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);

  const label = (text, size, color, x, y, mono = false) => T(text, size, color, mono).moveTo([x, y, 0]);
  const panel = (x, y, width, height, color, fill = C.card, opacity = 0.95) => {
    const shape = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    shape.setFill(fill, opacity);
    return shape.moveTo([x, y, 0]);
  };
  const fade = o => new M.FadeIn(o, { runTime: 0.28 });
  const out = o => new M.FadeOut(o, { runTime: 0.28 });
  const mark = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.42 });
  const cascade = a => new M.LaggedStart(a, { lagRatio: 0.12, runTime: 0.65 });

  let detail = null;
  function note(text, color = C.ink) {
    const next = text ? label(text, 24, color, NOTEP[0], NOTEP[1]) : null;
    const max = P ? FW - 0.8 : 4.9;
    if (next && next.getWidth() > max) next.scale(max / next.getWidth());
    const a = detail ? [out(detail)] : [];
    if (next) a.push(fade(next));
    detail = next;
    return a;
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 24 : 23, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = 0.44, height = rows.length * lh + 0.3;
    const [x, y] = BOXP;
    const frame = panel(x, y, width, height, color);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 0.9 : 4.9;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  // reading cards
  const cardFrames = times.map((_, i) => panel(colx(i), CARD_Y, 1.84, 0.92, C.cyan, C.cyan, 0.16));
  const cards = times.map((t, i) => new M.VGroup(cardFrames[i], label(t, 16, C.cyan, colx(i), CARD_Y + 0.22, true)));
  const cardValue = (s, i) => label(s, 24, C.ink, colx(i), CARD_Y - 0.19, true);
  const raw = temperatures.map((v, i) => cardValue(`${v}°C`, i));
  const inputs = readings.map((v, i) => cardValue(`+${v}°C`, i));
  let activeCard = null;
  function selectCard(i) {
    const o = panel(colx(i), CARD_Y, 1.97, 1.05, C.amber, C.card, 0);
    const a = activeCard ? [out(activeCard)] : [];
    a.push(fade(o)); activeCard = o; return a;
  }
  const SENSOR_Y = P ? -0.9 : -1.35;
  const sensor = new M.VGroup(
    panel(CX, SENSOR_Y, P ? 3.6 : 3.4, 0.92, C.cyan, C.cyan, 0.12),
    label('Sensor at Central', 20, C.cyan, CX, SENSOR_Y));

  await until(S(0));
  await play(cascade(cards.map(fade)), ...say('PLATFORM TEMPERATURES'), ...note('How do platform temperatures change?', C.cyan));

  await until(S(1));
  await play(fade(sensor), ...note('A sensor measures temperature'));

  await until(S(2));
  await play(mark(sensor, C.cyan), ...note('A new reading every 10 minutes'), ...say('CENTRAL  ·  EVERY 10 MINUTES'));

  await until(S(3));
  await play(out(sensor), fade(raw[0]), ...selectCard(0), ...note('9:00 → 21°C', C.cyan));

  await until(S(4));
  await play(fade(raw[1]), ...selectCard(1), ...note('9:10 → 22°C', C.cyan));

  await until(S(5));
  await play(fade(raw[2]), ...selectCard(2), ...note('9:20 → 21°C', C.cyan));

  await until(S(6));
  await play(out(activeCard), ...say('SUBTRACT 20 FROM EACH', C.amber), ...note('21 − 20 = 1   ·   22 − 20 = 2', C.amber));
  activeCard = null;

  await until(S(7));
  await play(...raw.map(out), ...inputs.map(fade), ...note('Degrees above 20:  1, 2, 1', C.cyan), ...say('1,  2,  1'));

  await until(S(8));
  await play(...say('KEEP ONLY THE LATEST, OR SOME OLD TOO?', C.amber),
    ...note('Latest reading only?  Or some earlier too?', C.amber));

  // network: inputs = old state, reading; hidden = update gate, candidate; output = new state
  const NET_Y = P ? -0.9 : -1.35;
  const R = P ? 0.5 : 0.36;
  const N = net({ layers: [2, 2, 1], center: [CX, NET_Y, 0], width: P ? 5.3 : 4.85, height: P ? 2.6 : 1.5, r: R });
  const node = (l, i) => N.nodes[l][i];
  const above = (l, i, text, color) => label(text, 16, color, N.pos(l, i)[0], N.pos(l, i)[1] + R + 0.22);
  const below = (l, i, text, color) => label(text, 16, color, N.pos(l, i)[0], N.pos(l, i)[1] - R - 0.22);

  await until(S(9));
  await play(cascade(N.nodes.flat().map(fade)), cascade(N.edges.flat(2).map(e => new M.Create(e, { runTime: 0.3 }))),
    ...say('A SMALL NETWORK', C.violet), ...note('Circles = neurons  ·  lines = weights', C.violet));

  const tagReading = below(0, 1, 'reading', C.cyan);
  await until(S(10));
  await play(fade(tagReading), mark(node(0, 1), C.cyan), ...N.flow(0, C.cyan), ...say('EACH READING ENTERS'),
    ...note('Each new reading enters', C.cyan));

  const tagOld = above(0, 0, 'old state', C.amber);
  const tagNew = below(2, 0, 'new state', C.amber);
  await until(S(11));
  await play(fade(tagNew), mark(node(2, 0)), ...N.flow(1), ...say('A NUMBER CARRIES OLD INFO', C.amber),
    ...note('One number carries earlier information', C.amber));

  await until(S(12));
  await play(...say('HIDDEN STATE', C.amber), ...note('Hidden state = the carried number', C.amber));

  await until(S(13));
  await play(mark(node(2, 0)), ...note('Before any reading: hidden state 0', C.amber));

  // cups
  const cupY = NET_Y;
  const cup = (x, frac, color, name) => {
    const w = 0.9, h = 1.2;
    const frame = new M.Rectangle({ width: w, height: h, color: C.ink, strokeWidth: 2 });
    frame.moveTo([x, cupY, 0]);
    const water = new M.Rectangle({ width: w - 0.08, height: Math.max(0.02, (h - 0.08) * frac), color, strokeWidth: 0 });
    water.setFill(color, 0.75);
    water.moveTo([x, cupY - h / 2 + 0.04 + (h - 0.08) * frac / 2, 0]);
    return new M.VGroup(frame, water, label(name, 16, C.ink, x, cupY - h / 2 - 0.28));
  };
  const cx3 = [colx(0), colx(1), colx(2)];
  const cupA = cup(cx3[0], 0.8, C.amber, 'cup A');
  const cupB = cup(cx3[2], 0.8, C.cyan, 'cup B');
  const plus = label('+', 30, C.ink, cx3[1], cupY);

  await until(S(14));
  await play(out(N.group), out(tagReading), out(tagNew),
    cascade([fade(cupA), fade(plus), fade(cupB)]),
    ...note('Mix two cups into one new cup', C.violet), ...say('MIX TWO CUPS INTO ONE', C.violet));

  const mixAll = cup(cx3[1], 0.8, C.cyan, 'all from B');
  await until(S(15));
  await play(out(plus), fade(mixAll), ...note('All from one cup  ·  or a share of each', C.violet));
  const mixHalf = cup(cx3[1], 0.4, C.amber, 'half + half');
  const topHalf = new M.Rectangle({ width: 0.82, height: (1.2 - 0.08) * 0.4, color: C.cyan, strokeWidth: 0 });
  topHalf.setFill(C.cyan, 0.75);
  topHalf.moveTo([cx3[1], cupY - 0.6 + 0.04 + (1.12) * 0.4 + (1.12) * 0.2, 0]);
  await until(S(15) + 2);
  await play(out(mixAll), fade(mixHalf), fade(topHalf));

  await until(S(16));
  await play(out(cupA), out(cupB), out(mixHalf), out(topHalf), fade(N.group), fade(tagNew), fade(tagReading),
    ...note('The network mixes numbers the same way'), ...say('THE NETWORK MIXES TOO'));
  await play(...N.value(2, 0, '0', C.amber));

  await until(S(17));
  await play(fade(tagOld), ...N.value(0, 0, '0', C.amber), mark(node(0, 0)), ...say('OLD STATE', C.amber),
    ...note('Top input circle = old state', C.amber));

  const tagCand = below(1, 1, 'candidate', C.cyan);
  await until(S(18));
  await play(mark(node(1, 1), C.cyan), ...say('A POSSIBLE NEW STATE'), ...note('A possible new state', C.cyan));

  await until(S(19));
  await play(fade(tagCand), ...say('CANDIDATE STATE'), ...note('Possible new state = candidate state', C.cyan));

  await until(S(20));
  await play(cascade(inputs.map(i => mark(i, C.cyan))), ...note('Candidates here: 1, 2, 1', C.cyan));

  const tagGate = above(1, 0, 'update gate', C.violet);
  await until(S(21));
  await play(mark(node(1, 0), C.violet), ...note('A gate picks the candidate’s share', C.violet), ...say('HOW MUCH TO USE?', C.violet));

  await until(S(22));
  await play(fade(tagGate), ...say('UPDATE GATE', C.violet), ...note('This gate = the update gate', C.violet));

  // share bar
  const barW = P ? 5.6 : 4.6;
  const shareBar = g => {
    const left = BARP[0] - barW / 2, y = BARP[1];
    const old = new M.Rectangle({ width: Math.max(0.02, barW * (1 - g)), height: 0.3, color: C.amber, strokeWidth: 0 });
    old.setFill(C.amber, 0.8); old.moveTo([left + barW * (1 - g) / 2, y, 0]);
    const cand = new M.Rectangle({ width: Math.max(0.02, barW * g), height: 0.3, color: C.cyan, strokeWidth: 0 });
    cand.setFill(C.cyan, 0.8); cand.moveTo([left + barW * (1 - g) + barW * g / 2, y, 0]);
    const parts = [old, cand];
    if (g < 1) parts.push(label(`old ${1 - g}`, 17, C.amber, left + barW * (1 - g) / 2, y - 0.36));
    if (g > 0) parts.push(label(`candidate ${g}`, 17, C.cyan, left + barW * (1 - g) + barW * g / 2, y - 0.36));
    return new M.VGroup(...parts);
  };
  let bar = null;
  const setBar = g => { const b = shareBar(g); const a = bar ? [out(bar)] : []; a.push(fade(b)); bar = b; return a; };
  const dropBar = () => { const a = bar ? [out(bar)] : []; bar = null; return a; };

  await until(S(23));
  await play(...note('Candidate share: from 0 to 1', C.violet), ...N.value(1, 0, '0.5', C.violet), ...setBar(0.5),
    ...say('CANDIDATE SHARE: 0 TO 1', C.violet));

  await until(S(24));
  await play(...N.value(1, 0, '0', C.violet), ...setBar(0), ...say('0 = NONE OF IT', C.violet),
    ...note('0: none of the candidate', C.violet));
  await until(S(24) + 1.8);
  await play(...N.value(1, 0, '1', C.violet), ...setBar(1), ...say('1 = ALL OF IT', C.violet),
    ...note('1: all of the candidate', C.violet));

  await until(S(25));
  await play(...N.value(1, 0, '0.5', C.violet), ...setBar(0.5), ...say('OLD SHARE + CANDIDATE SHARE = 1', C.amber),
    ...note('The two shares add to 1', C.amber));

  await until(S(26));
  await play(...dropBar(), ...say(P ? 'GATED RECURRENT UNIT' : 'GATED RECURRENT UNIT  ·  GRU', C.violet),
    ...note('Gated recurrent unit = GRU', C.violet));

  await until(S(27));
  await play(...note(''), ...fbox(['LSTM: forget gate + input gate', ['GRU: one update gate does both', C.violet]], C.violet),
    ...say('A SIMPLER COUSIN OF THE LSTM', C.violet));

  // reading 1
  await until(S(28));
  await play(...fbox([]), ...selectCard(0), ...N.value(0, 0, '0', C.amber), ...N.value(1, 0, '–', C.muted),
    ...N.value(2, 0, '?', C.amber), ...N.value(0, 1, '1', C.cyan), ...N.flow(0, C.cyan), ...N.value(1, 1, '1', C.cyan),
    ...say('9:00  ·  CANDIDATE = 1'), ...note('9:00: candidate 1', C.cyan));

  await until(S(29));
  await play(...N.value(1, 0, '1', C.violet), ...setBar(1), ...say('UPDATE GATE = 1', C.violet),
    ...note('Update gate = 1', C.violet));

  await until(S(30));
  await play(...note('0 × 0  +  1 × 1', C.amber), ...say('NONE OLD, ALL CANDIDATE'));

  await until(S(31));
  await play(...dropBar(), ...N.flow(1), ...N.value(2, 0, '1', C.amber), ...note('New state = 1', C.amber));
  await play(...N.value(0, 0, '1', C.amber), mark(node(0, 0)));

  // reading 2
  await until(S(32));
  await play(...selectCard(1), ...N.value(1, 0, '–', C.muted), ...N.value(2, 0, '?', C.amber),
    ...N.value(0, 1, '2', C.cyan), ...N.flow(0, C.cyan), ...N.value(1, 1, '2', C.cyan),
    ...note('9:10: candidate 2', C.cyan), ...say('9:10  ·  CANDIDATE = 2'));

  await until(S(33));
  await play(...N.value(1, 0, '1', C.violet), mark(node(1, 0), C.violet), ...setBar(1), ...say('UPDATE GATE = 1 AGAIN', C.violet),
    ...note('Update gate = 1 again', C.violet));

  await until(S(34));
  await play(...dropBar(), ...N.flow(1), ...N.value(2, 0, '2', C.amber), ...note('1 × 0  +  2 × 1 = 2', C.amber), ...say('OLD STATE REPLACED'));
  await play(...N.value(0, 0, '2', C.amber), mark(node(0, 0)));

  // reading 3
  await until(S(35));
  await play(...selectCard(2), ...N.value(1, 0, '–', C.muted), ...N.value(2, 0, '?', C.amber),
    ...N.value(0, 1, '1', C.cyan), ...N.flow(0, C.cyan), ...N.value(1, 1, '1', C.cyan),
    ...note('9:20: candidate 1', C.cyan), ...say('9:20  ·  CANDIDATE = 1'));

  await until(S(36));
  await play(...N.value(1, 0, '0.5', C.violet), ...setBar(0.5), ...say('UPDATE GATE = 0.5', C.violet),
    ...note('Update gate = 0.5', C.violet));

  await until(S(37));
  await play(mark(node(0, 0)), ...say('OLD STATE SHARE = 0.5', C.amber), ...note('Old state share = 1 − 0.5 = 0.5', C.amber));

  await until(S(38));
  await play(...dropBar(), mark(node(0, 0)), ...note('2 × 0.5 = 1', C.amber), ...say('HALF OF THE OLD STATE', C.amber));

  await until(S(39));
  await play(mark(node(1, 1), C.cyan), ...note('1 × 0.5 = 0.5', C.cyan), ...say('HALF OF THE CANDIDATE'));

  await until(S(40));
  await play(...note('1  +  0.5', C.amber), ...N.flow(1), ...say('JOIN THE TWO PARTS'));

  await until(S(41));
  await play(...N.value(2, 0, '1.5', C.amber), ...note('1 + 0.5 = 1.5', C.amber), ...say('NEW STATE = 1.5', C.amber));
  await play(...N.value(0, 0, '1.5', C.amber), mark(node(0, 0)));

  await until(S(42));
  await play(mark(node(0, 0)), mark(node(1, 1), C.cyan), ...say('OLD + NEW INFORMATION'),
    ...note('Earlier readings + the latest reading', C.amber));

  const hx = i => P ? CX + (i - 1.5) * 1.85 : SIDE + (i % 2 ? 1.1 : -1.1);
  const hy = i => P ? NOTEP[1] + 0.2 : NOTEP[1] + (i < 2 ? 0.75 : 0.25);
  const history = new M.VGroup(
    ...['start 0', '9:00  1', '9:10  2', '9:20  1.5'].map((s, i) => label(s, 19, C.amber, hx(i), hy(i), true)),
    label('LSTM cell was: 1, 3, 2.5', 18, C.muted, NOTEP[0], P ? NOTEP[1] - 0.4 : NOTEP[1] - 0.35, true));

  await until(S(43));
  await play(out(activeCard), ...note(''), ...say('THE STATE ACROSS THREE READINGS', C.amber));
  activeCard = null;
  await play(cascade(history.submobjects.slice(0, 4).map(fade)));

  await until(S(44));
  await play(fade(history.submobjects[4]), ...say('A DIFFERENT RULE FROM THE LSTM', C.amber));

  await until(S(45));
  await play(out(history), ...say('ONE SHORT FORMULA'), ...fbox([['GRU formula', C.violet]], C.violet));

  await until(S(46));
  await play(...fbox([['old share = 1 − gate', C.amber], '1 − 0.5 = 0.5']));

  await until(S(47));
  await play(...fbox([['old share = 1 − gate', C.amber], 'new = old × old share', ['    + candidate × gate', C.cyan], '= 2 × 0.5 + 1 × 0.5 = 1.5']));

  await until(S(48));
  await play(mark(node(1, 0), C.violet), ...say('TRAINING LEARNS GOOD SHARES', C.violet),
    ...note('Training learns useful shares', C.violet));

  await until(S(49));
  await play(...note('Real GRU: also a reset gate (left out here)', C.violet), ...say('ONE MORE GATE: RESET', C.violet));

  await until(S(50));
  await play(...note('Too much old: slow to react', C.pink), ...say('KEEP TOO MUCH?', C.pink));

  await until(S(51));
  await play(...note('Too little old: useful clues lost', C.pink), ...say('KEEP TOO LITTLE?', C.pink));

  await until(S(52));
  await play(...note('A gate chooses old vs new', C.violet), mark(node(1, 0), C.violet), ...say('A GATE CHOOSES OLD VS NEW', C.violet));
}

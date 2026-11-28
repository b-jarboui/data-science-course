// 20.2.3 Low-rank adaptation. Beat i follows sentence i of lesson.json.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.25, 0] : [4.6, -0.3, 0];
  const left = [1, 2, 0, 1];
  const top = [0.1, 0.2, 0.1, 0];
  const changes = left.map(a => top.map(b => Math.round(10 * a * b) / 10));
  const original = 0.5;
  const updated = original + changes[1][1];
  const pt = (x, y) => [x, y, 0];
  const fade = object => new M.FadeIn(object, { runTime: 0.45 });
  const out = object => new M.FadeOut(object, { runTime: 0.35 });
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 18 : 17);
  const mark = (object, color = C.amber) => new M.Indicate(object, { color, runTime: 0.7 });
  const reveal = objects => new M.LaggedStart(objects.map(fade), { lagRatio: 0.18, runTime: 0.95 });

  // a text that never runs wider than max; t.w = its real width after scaling
  function label(text, x, y, size = 22, color = C.ink, max = P ? 7 : 7.3, mono = false) {
    const t = T(String(text), size, color, mono);
    t.w = t.getWidth();
    if (t.w > max) { t.scale(max / t.w); t.w = max; }
    return t.moveTo(pt(x, y));
  }

  function rect(x, y, width, height, color, fill = C.card, opacity = 0.95) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.1, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    return r.moveTo(pt(x, y));
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const old = boxNow;
    boxNow = null;
    if (lines.length) {
      const size = P ? 22 : 20, lh = P ? 0.46 : 0.42;
      const max = P ? FW - 0.8 : 4.4;
      const texts = lines.map((line, i) => label(line, BOXP[0],
        BOXP[1] + ((lines.length - 1) / 2 - i) * lh, size,
        i === lines.length - 1 ? color : C.ink, max - 0.6, true));
      const width = Math.max(...texts.map(t => t.w)) + 0.6;
      boxNow = new M.VGroup(rect(BOXP[0], BOXP[1], width, lines.length * lh + 0.4, color), ...texts);
    }
    return [...(old ? [out(old)] : []), ...(boxNow ? [fade(boxNow)] : [])];
  }

  let picture = [];
  function replace(...objects) {
    const animations = [...picture.map(out), ...objects.map(fade)];
    picture = objects;
    return animations;
  }
  function add(...objects) {
    picture.push(...objects);
    return objects.map(fade);
  }
  function remove(...objects) {
    picture = picture.filter(object => !objects.includes(object));
    return objects.map(out);
  }

  function card(lines, x, y, width, color, size = 23) {
    const lh = P ? 0.44 : 0.4;
    return new M.VGroup(rect(x, y, width, lines.length * lh + 0.36, color),
      ...lines.map((text, i) => label(text, x, y + ((lines.length - 1) / 2 - i) * lh,
        i === 0 ? Math.min(size, 20) : size, i === 0 ? color : C.ink, width - 0.32)));
  }

  function cell(x, y, text, color, d, size = 20) {
    const block = rect(x, y, d - 0.045, d - 0.045, color);
    return text == null ? block : new M.VGroup(block, label(text, x, y, size, color, d - 0.12, true));
  }

  function grid(values, x, y, d, color, title, size = 20) {
    const w = values[0].length, h = values.length;
    const blocks = values.flatMap((row, i) => row.map((value, j) =>
      cell(x + (j - (w - 1) / 2) * d, y + ((h - 1) / 2 - i) * d, value, color, d, size)));
    if (title) blocks.push(label(title, x, y + h * d / 2 + 0.3, 20, color, P ? 6 : 3.4));
    return new M.VGroup(...blocks);
  }

  // 0–3 The long answer and the short answer.
  const W = P ? 7 : 7.4;
  const question = card(['Student', 'When does the library close on Friday?'], CX, P ? 1.4 : 0.52, W, C.violet);
  const longReply = card(['Assistant', 'Thanks for asking! The newsletter says',
    'the library will close at six this Friday', 'for cleaning.'], CX, P ? -1.3 : -1.25, W, C.cyan);
  const shortReply = card(['Assistant', 'At six.'], CX, P ? -1.3 : -0.95, W, C.green, 26);
  const startCard = card(['Campus writing assistant', 'Give shorter answers'], CX, P ? 1.2 : 0.4, 6.4, C.cyan);
  const lengths = new M.VGroup(
    label('long answer', CX - (P ? 0 : 0), P ? -0.6 : -0.75, 19, C.muted),
    rect(CX, P ? -1.25 : -1.2, P ? 6.6 : 6.6, 0.32, C.muted, C.muted, 0.35),
    label('short answer', CX, P ? -2.35 : -1.75, 19, C.green),
    rect(CX - (P ? 2.7 : 2.7), P ? -3.0 : -2.2, 1.2, 0.32, C.green, C.green, 0.5));
  await until(S(0)); await play(...say('CAMPUS WRITING ASSISTANT'), ...replace(startCard, lengths));
  await until(S(1)); await play(...replace(question), ...say('THE STUDENT ASKS', C.violet));
  await until(S(2)); await play(...add(longReply), ...say('THE LONG ANSWER'));
  await until(S(3)); await play(...remove(longReply), ...add(shortReply), ...say('TWO WORDS', C.green));

  // 4–10 The model as a network.
  const model = net({ layers: [3, 4, 2], center: pt(CX, P ? -0.9 : -0.95), width: P ? 5.6 : 6.1,
    height: P ? 5.0 : 2.6, r: P ? 0.36 : 0.31 });
  const sampleEdge = model.edges[0][0][0];
  const inTag = label('numbers in', model.pos(0, 0)[0], model.pos(0, 0)[1] + (P ? 0.75 : 0.6), 17, C.violet);
  await until(S(4)); await play(...replace(), ...say('INSIDE THE LANGUAGE MODEL'));
  await until(S(5)); await play(...add(model.group), ...say('COLUMNS OF NEURONS'));
  await until(S(6)); await play(mark(sampleEdge), ...say('EACH LINE HAS A WEIGHT', C.amber));
  await until(S(7));
  const inputs = [...model.value(0, 0, '1'), ...model.value(0, 1, '0'), ...model.value(0, 2, '1')];
  picture.push(...inputs.map(animation => animation.mobject), inTag);
  await play(...inputs, fade(inTag), ...model.flow(0), ...say('A WEIGHT MULTIPLIES THE NUMBER', C.amber));
  await until(S(8)); await play(...model.flow(1), ...say('WEIGHTS FROM EARLIER TRAINING'));
  await until(S(9)); await play(...say('TRAINING ALL WEIGHTS TAKES MEMORY', C.pink),
    ...fbox(['All weights change', 'All need training memory'], C.pink));
  await until(S(10)); await play(...fbox([]), ...say('CAN WE TRAIN FEWER NUMBERS?', C.green));

  // 11–18 Sixteen weights, a table, and a table of changes.
  const slice = net({ layers: [4, 4], center: pt(CX, P ? -0.9 : -0.85), width: P ? 4.8 : 4.7,
    height: P ? 5.0 : 2.9, r: 0.29 });
  const placeholders = Array.from({ length: 4 }, () => Array(4).fill('·'));
  const weightTable = grid(placeholders, CX, P ? -0.9 : -0.6, P ? 1.15 : 0.74, C.cyan, 'Original weights');
  const pd = P ? 0.66 : 0.59;
  const fpos = P ? [0, 1.0] : [CX - 1.73, -0.6];
  const dpos = P ? [0, -2.65] : [CX + 1.73, -0.6];
  const frozen = grid(placeholders, fpos[0], fpos[1], pd, C.cyan, 'Original weights (frozen)');
  const delta = grid(placeholders, dpos[0], dpos[1], pd, C.violet, 'Changes');
  const plus = label('+', P ? 0 : CX, P ? -0.6 : -0.6, 32, C.amber, 0.7, true);
  await until(S(11)); await play(...replace(slice.group), ...say('16 WEIGHTS BETWEEN TWO GROUPS'));
  await until(S(12)); await play(...replace(weightTable), ...say('4 ROWS × 4 COLUMNS'));
  await until(S(13)); await play(...say('MATRIX = TABLE OF NUMBERS'));
  await until(S(14)); await play(mark(weightTable, C.cyan), ...say('KEEP THE ORIGINAL WEIGHTS'));
  await until(S(15)); await play(...say('THE ORIGINAL WEIGHTS ARE FROZEN'));
  await until(S(16)); await play(...replace(frozen, delta), ...say('ADD A TABLE FOR CHANGES', C.violet));
  await until(S(17)); await play(mark(delta, C.violet), ...say('ONE CHANGE FOR EACH WEIGHT', C.violet));
  await until(S(18)); await play(...add(plus), ...say('ADD THE CHANGES DURING USE', C.amber));
  await until(S(19)); await play(...replace(), ...say('BUILD CHANGES FROM ONE PATTERN', C.violet));

  // 19–34 The multiplication table: left column times top row.
  const d = P ? 1.05 : 0.74, ox = P ? -2 * 1.05 : CX - 1.48, oy = P ? 0.6 : -0.03;
  const px = j => ox + (j + 1) * d, py = i => oy - i * d;
  const side = new M.VGroup(...left.map((a, i) => cell(ox, py(i), a, C.amber, d, 24)));
  const header = new M.VGroup(...top.map((b, j) => cell(px(j), oy + d, b, C.violet, d, 23)));
  const empty = new M.VGroup(...changes.flatMap((row, i) => row.map((_, j) =>
    cell(px(j), py(i), null, C.line, d))));
  const numbers = changes.map((row, i) => new M.VGroup(...row.map((value, j) =>
    label(value, px(j), py(i), 23, C.cyan, d - 0.1, true))));
  const frame = (x, y, width, height, color) => rect(x, y, width, height, color, C.bg, 0);
  const rowFrame = (i, color = C.amber) => frame(ox + 2 * d, py(i), 5 * d + 0.07, d + 0.05, color);
  const topFrame = frame(ox + 2.5 * d, oy + d, 4 * d + 0.06, d + 0.05, C.violet);
  const rowMarker = left.map((_, i) => rowFrame(i));
  const times = label('×', ox, oy + d, 25, C.amber, d, true);

  function rowStart(i) {
    return [...(i ? remove(rowMarker[i - 1]) : []), ...add(rowMarker[i]),
      ...say(`ROW ${i + 1}  ·  TOP ROW × ${left[i]}`, C.amber),
      ...fbox([`${left[i]} × (${top.join(', ')})`], C.amber)];
  }
  function rowResult(i) {
    picture.push(numbers[i]);
    return [reveal(numbers[i].submobjects),
      ...fbox([`${left[i]} × (${top.join(', ')})`, changes[i].join('   ')], C.cyan)];
  }

  await until(S(20)); await play(...add(side), ...say('FOUR NUMBERS DOWN', C.amber));
  await until(S(21)); await play(...add(header), ...say('FOUR NUMBERS ACROSS', C.violet));
  await until(S(22)); await play(...add(empty), ...say('8 NUMBERS BUILD ALL 16 CHANGES'));
  await until(S(23)); await play(...add(times, topFrame), ...say('MULTIPLY LEFT BY TOP', C.amber));
  await until(S(24)); await play(...rowStart(0));
  await until(S(25)); await play(...rowResult(0));
  await until(S(26)); await play(...rowStart(1));
  await until(S(27)); await play(...rowResult(1));
  await until(S(28)); await play(...rowStart(2));
  await until(S(29)); await play(...rowResult(2));
  await until(S(30)); await play(...rowStart(3));
  await until(S(31)); await play(...rowResult(3), ...add(rowFrame(0)));
  const matchingFirst = picture[picture.length - 1];
  await until(S(32)); await play(...remove(rowMarker[3], matchingFirst), ...fbox([]),
    mark(header, C.violet), ...say('EVERY ROW USES THE SAME PATTERN', C.violet));
  await until(S(33)); await play(...say('ONE INDEPENDENT PATTERN = RANK ONE', C.violet));
  await until(S(34)); await play(...say('LOW-RANK ADAPTATION · LoRA', C.green));

  // 35–42 One connection: row 2, column 2.
  const LC = P ? [0, 1.2] : [-3.9, -0.65];
  const link = net({ layers: [4, 4], center: pt(LC[0], LC[1]),
    width: P ? 4.0 : 2.65, height: P ? 3.0 : 2.9, r: 0.28 });
  const edge = link.edges[0][1][1];
  const inP = link.pos(0, 1), outP = link.pos(1, 1);
  const rowTag = label('row 2', inP[0] - 0.28 - 0.5, inP[1], 17, C.amber, 1.2);
  const colTag = label('column 2', outP[0] + 0.28 + 0.75, outP[1], 17, C.amber, 1.6);
  const tx = P ? 0 : 0.6;
  const cardPos = P ? [[-2.4, -2.4], [0, -2.4], [2.4, -2.4]] : [[tx, 0.75], [tx, -0.47], [tx, -1.69]];
  const cw = P ? 2.25 : 2.55;
  const weight = card(['Original', '0.5'], cardPos[0][0], cardPos[0][1], cw, C.cyan, 23);
  const change = card(['Change', '0.4'], cardPos[1][0], cardPos[1][1], cw, C.violet, 23);
  const used = card(['In use', '0.9'], cardPos[2][0], cardPos[2][1], cw, C.green, 23);
  await until(S(35)); await play(...replace(link.group), ...say('FOLLOW ONE CONNECTION'),
    mark(edge, C.amber));
  await until(S(36)); await play(...add(weight, rowTag, colTag), ...link.weight(0, 1, 1, original),
    ...say('FIND THE ORIGINAL WEIGHT'));
  await until(S(37)); await play(...say('FIND THE MATCHING CHANGE', C.violet), ...fbox(['2 × 0.2'], C.violet));
  await until(S(38)); await play(...add(change), ...fbox(['2 × 0.2 = 0.4'], C.violet));
  await until(S(39)); await play(...say('ADD ORIGINAL AND CHANGE', C.amber), ...fbox(['0.5 + 0.4'], C.amber));
  await until(S(40)); await play(...add(used), ...link.weight(0, 1, 1, updated),
    ...say('THE CONNECTION USES 0.9', C.green), ...fbox(['0.5 + 0.4 = 0.9'], C.green));
  await until(S(41)); await play(mark(weight, C.cyan), ...say('THE STORED ORIGINAL STAYS 0.5'));

  // L.net.flow runs forward. Move amber gradient pulses right to left on the same edges.
  const backward = [];
  for (let i = 0; i < 4; i++) {
    const a = link.pos(0, i), b = link.pos(1, 1);
    const dot = new M.Dot({ point: pt(b[0] - 0.3, b[1]), radius: 0.08, color: C.amber });
    const target = new M.Dot({ point: pt(a[0] + 0.3, a[1]), radius: 0.08, color: C.amber });
    backward.push({ dot, animation: new M.Transform(dot, target, { runTime: 1.0 }) });
  }
  await until(S(42));
  await play(...fbox([]), ...say('GRADIENTS GO BACK', C.amber),
    new M.LaggedStart(backward.map(pulse => pulse.animation), { lagRatio: 0.13, runTime: 1.5 }));
  await play(...backward.map(pulse => out(pulse.dot)));

  // 43–45 Train only the small column and row.
  const sd = P ? 0.62 : 0.6;
  const colX = P ? -1.3 : 0.0, rowY = P ? -1.7 : 0.9;
  const smallCol = grid(left.map(a => [a]), colX, rowY - sd * 2.5, sd, C.amber, null, 21);
  const smallRow = grid([top], colX + sd * 2.5, rowY, sd, C.violet, null, 21);
  const trainable = label('Train only these 8 numbers', P ? 0 : 1.2, P ? -1.0 : 1.48, 20, C.green, P ? 6 : 4);
  await until(S(43)); await play(...remove(weight, change, used), ...add(smallCol, smallRow, trainable),
    ...say('TRAIN ONLY THE COLUMN AND ROW', C.green));
  await until(S(44)); await play(...fbox(['new = original + change', '0.9 = 0.5 + 0.4'], C.green),
    ...say('NEW WEIGHT'));
  await until(S(45)); await play(...fbox(['change = left × top', '0.4 = 2 × 0.2'], C.violet),
    ...say('USE THE TWO MATCHING NUMBERS', C.violet));

  // 46 Eight numbers in place of sixteen.
  const blocks = (h, w) => Array.from({ length: h }, () => Array(w).fill(null));
  const bd = P ? 0.66 : 0.58;
  const allBlocks = grid(blocks(4, 4), P ? 0 : CX - 1.68, P ? 0.9 : -0.55, bd, C.muted, '16 original weights');
  const colB = P ? [-1.4, -2.75] : [CX + 0.65, -0.55];
  const columnBlocks = grid(blocks(4, 1), colB[0], colB[1], bd, C.amber);
  const rowBlocks = grid(blocks(1, 4), colB[0] + bd * 2.5, colB[1] + bd * 1.5, bd, C.violet);
  const eight = label('8 trainable numbers', P ? 0 : CX + 1.9, P ? -0.95 : 1.0, 20, C.green, 3.2);
  await until(S(46)); await play(...replace(allBlocks, columnBlocks, rowBlocks, eight),
    ...say('TRAIN 8 IN PLACE OF 16', C.green), ...fbox(['4 + 4 = 8', '4 × 4 = 16'], C.green));

  // 47–51 A real-size table.
  const gw = P ? 3.0 : 2.55, gx = P ? -1.6 : CX - 0.85, gy = P ? 0.3 : -0.61;
  const bigGrid = new M.VGroup(rect(gx, gy, gw, gw, C.cyan),
    ...[-0.34, -0.17, 0, 0.17, 0.34].flatMap(f => [
      new M.Line({ start: pt(gx + f * gw, gy - gw / 2), end: pt(gx + f * gw, gy + gw / 2), color: C.line }),
      new M.Line({ start: pt(gx - gw / 2, gy + f * gw), end: pt(gx + gw / 2, gy + f * gw), color: C.line })
    ]));
  const dims = label('4,096 × 4,096', gx, gy + gw / 2 + 0.4, 23, C.cyan, 3.4, true);
  const sx = P ? 0.55 : CX + 0.99;
  const strips = new M.VGroup(...Array.from({ length: 8 }, (_, i) =>
    rect(sx + i * 0.3, gy, 0.2, gw * 0.7, C.violet, C.violet, 0.35)));
  const rank = label('8 shared patterns', sx + 1.05, gy + gw / 2 + 0.4, 19, C.violet, 2.9);
  const barY = P ? -2.5 : -2.43, barW = P ? 6.6 : 5.2;
  const barX = CX - barW / 2;
  const bar = rect(CX, barY, barW, 0.26, C.cyan);
  const share = new M.Rectangle({ width: Math.max(0.03, barW / 256), height: 0.26, color: C.amber, strokeWidth: 0 });
  share.setFill(C.amber, 1);
  share.moveTo(pt(barX + Math.max(0.03, barW / 256) / 2, barY));
  const shareText = label('≈ 0.4% trainable', CX, barY - 0.42, 19, C.amber, 4.5, true);
  await until(S(47)); await play(...replace(bigGrid, dims), ...fbox([]), ...say('A MUCH LARGER WEIGHT TABLE'));
  await until(S(48)); await play(...fbox(['4,096 × 4,096', '16,777,216 weights']), ...say('NEARLY 17 MILLION WEIGHTS'));
  await until(S(49)); await play(...add(strips, rank), ...say('RANK EIGHT', C.violet),
    ...fbox(['2 × 4,096 × 8 = 65,536', '65,536 trainable numbers'], C.violet));
  await until(S(50)); await play(...add(bar, share, shareText), ...say('A SMALL SHARE OF THE TOTAL', C.amber),
    ...fbox(['65,536 ÷ 16,777,216', '≈ 0.4%'], C.amber));
  await until(S(51)); await play(...say('LESS MEMORY FOR TRAINING', C.green));

  // 52–54 The rank-one limit and the recap.
  const gy2 = P ? -2.0 : -0.6;
  const rankOne = grid(changes, P ? 0.9 : CX + 0.9, gy2, 0.64, C.cyan, 'Changes');
  const factors = grid(left.map(a => [a]), P ? -1.9 : CX - 1.77, gy2, 0.64, C.amber, 'Multipliers');
  const onePattern = grid([top], P ? 0.9 : CX, P ? 0.4 : 0.87, P ? 0.64 : 0.55, C.violet, P ? 'Shared row pattern' : null);
  const p1 = grid([[1, 1, 1, 0]], CX, P ? 0.3 : 0.38, P ? 0.9 : 0.7, C.violet, 'Pattern 1');
  const p2 = grid([[0, 0, 0, 1]], CX, P ? -2.4 : -1.02, P ? 0.9 : 0.7, C.green, 'Pattern 2');
  const keep = grid(placeholders, P ? 0 : CX - 1.58, P ? 0.9 : -0.85, 0.62, C.cyan, 'Frozen weights');
  const lpos = P ? [-1.4, -3.1] : [CX + 0.55, -0.85];
  const learnCol = grid(left.map(a => [a]), lpos[0], lpos[1], 0.6, C.amber, null, 21);
  const learnRow = grid([top], lpos[0] + 0.6 * 2.5, lpos[1] + 0.6 * 2.5, 0.6, C.violet, null, 21);
  const learn = label('Train the smaller tables', P ? 0 : CX + 1.7, P ? -0.95 : 1.15, 19, C.green, 3.6);
  await until(S(52)); await play(...replace(rankOne, factors, onePattern), ...fbox([]),
    ...say('RANK ONE SHARES ONE ROW PATTERN', C.violet));
  await until(S(53)); await play(...replace(p1, p2), ...say('MORE INDEPENDENT PATTERNS NEED HIGHER RANK', C.green));
  await until(S(54)); await play(...replace(keep, learnCol, learnRow, learn), ...say('LOW-RANK ADAPTATION', C.green),
    ...fbox(['Keep the original weights', 'Learn the changes from', 'smaller tables'], C.green));
}

// 17.2.5 Adam. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 4.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.75, 0] : [4.3, -0.3, 0];
  const orange = '#fb923c';
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pt = (x, y) => [x, y, 0];
  const text = (s, x, y, color = C.ink, size = 18) => T(String(s), size, color, true).moveTo(pt(x, y));
  const rect = (x, y, w, h, color, fill = C.card) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(fill, 0.96); r.moveTo(pt(x, y)); return r;
  };
  const line = (x1, y1, x2, y2, color = C.muted, w = 2) => new M.Line({ start: pt(x1, y1), end: pt(x2, y2), color, strokeWidth: w });
  const arrow = (x1, y1, x2, y2, color = C.amber) => new M.Arrow({ start: pt(x1, y1), end: pt(x2, y2), color, strokeWidth: 4, buff: 0 });
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
    const maxW = P ? FW - 1.0 : 4.4;
    if (width > maxW) g.scale(maxW / width);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // network with weights A and B
  const N = net({ layers: [3, 3, 2], center: pt(P ? 0 : -5.0, P ? 2.3 : 0.1), width: P ? 5.0 : 2.6, height: P ? 1.9 : 2.0, r: P ? 0.26 : 0.22 });
  const [a0x, a0y] = N.pos(0, 0), [a1x] = N.pos(1, 0), [b0y] = [N.pos(0, 2)[1]];
  const aTag = text('A', (a0x + a1x) / 2, a0y + 0.28, C.cyan, 20);
  const bTag = text('B', (a0x + a1x) / 2, b0y - 0.3, C.pink, 20);

  // memory table: rows A, B; columns 1st moment (gradients), 2nd moment (squares)
  const colX = P ? [-0.55, 1.85] : [-1.0, 0.75], rowY = P ? [-0.05, -1.15] : [0.6, -0.55];
  const BW = P ? 2.1 : 1.5, BH = P ? 0.9 : 0.8, labX = P ? -2.6 : -2.25, headY = P ? 0.7 : 1.25;
  const cells = [0, 1].map(r => [0, 1].map(c => rect(colX[c], rowY[r], BW, BH, c ? C.amber : C.violet)));
  const rowLab = [text('A', labX, rowY[0], C.cyan, 22), text('B', labX, rowY[1], C.pink, 22)];
  let head = [text('gradients', colX[0], headY, C.violet, 16), text('squares', colX[1], headY, C.amber, 16)];
  const vals = [[null, null], [null, null]];
  const setV = (r, c, v, col) => { const t = text(v, colX[c], rowY[r], col || (c ? C.amber : C.violet), P ? 26 : 24); const a = [new M.FadeIn(t)];
    if (vals[r][c]) a.push(new M.FadeOut(vals[r][c])); vals[r][c] = t; return a; };

  // bottom zone: step arrows and hills
  const x0 = P ? 2.9 : 1.3, sy = P ? [-2.65, -3.65] : [-1.75, -2.55], k = P ? 1.8 : 1.5;
  const steps = (la, lb, ta, tb) => new M.VGroup(
    arrow(x0, sy[0], x0 - la * k, sy[0], C.cyan), text('A', x0 + 0.3, sy[0], C.cyan, 20), text(ta, x0 - la * k / 2, sy[0] + 0.32, C.cyan, 17),
    arrow(x0, sy[1], x0 - lb * k, sy[1], C.pink), text('B', x0 + 0.3, sy[1], C.pink, 20), text(tb, x0 - lb * k / 2, sy[1] + 0.32, C.pink, 17));
  const hills = P
    ? new M.VGroup(line(-3.5, -2.9, -0.5, -1.9, C.cyan, 6), text('gentle hill', -2.0, -3.3, C.cyan, 18), line(0.6, -2.9, 2.9, -0.3, C.pink, 6), text('steep hill', 1.75, -3.3, C.pink, 18))
    : new M.VGroup(line(-6.6, -2.7, -4.9, -2.25, C.cyan, 5), text('gentle hill', -5.75, -2.95, C.cyan, 16), line(-4.4, -2.7, -3.4, -1.45, C.pink, 5), text('steep hill', -3.9, -2.95, C.pink, 16));

  const parcel = (() => {
    const s = P ? 1.5 : 1, x = P ? 0 : CX, y = P ? 0.6 : -0.3;
    const box = rect(x, y, 4.2 * s, 2.8 * s, C.amber, '#3a2a17');
    const lab = rect(x + 0.5 * s, y - 0.2 * s, 2.4 * s, 1.3 * s, C.ink, '#e8edf7');
    const tape = rect(x, y + 1.15 * s, 4.2 * s, 0.35 * s, C.amber, '#5a4320');
    const dig = T('4 0 7 1', P ? 40 : 36, C.bg, true, true).moveTo(pt(x + 0.5 * s, y - 0.2 * s));
    return new M.VGroup(box, tape, lab, dig);
  })();
  await until(S(0)); await play(...appear(parcel), ...say('READ DIGITS ON PARCEL LABELS'), ...fbox(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await play(...leave(parcel), ...appear(N.group), ...say('OUR NETWORK'), ...fbox(['two weights to watch:', ['A and B', C.amber]]));
  await until(S(2)); await play(...N.weight(0, 0, 0, 0.8), ...N.weight(0, 2, 2, 0.8), ...appear(aTag, bTag), ...say('WATCH WEIGHT A AND WEIGHT B'));
  await until(S(3)); await play(...N.flow(0, C.amber), ...say('SEND A MINI-BATCH OF PICTURES'));
  await play(...N.flow(1, C.amber));
  await until(S(4)); await play(...N.flow(1, orange), ...say('LOSS → WORK BACKWARDS → GRADIENTS', orange));
  await play(...N.flow(0, orange));
  await until(S(5)); await play(new M.Indicate(aTag, { color: C.cyan }), ...fbox([['gradient A = +2', C.cyan]]));
  await until(S(6)); await play(new M.Indicate(bTag, { color: C.pink }), ...fbox([['gradient A = +2', C.cyan], ['gradient B = +4', C.pink]]));
  let st = steps(0.7, 1.4, '2 × rate', '4 × rate');
  await until(S(7)); await play(...appear(st), ...say('SAME RATE: B MOVES TWICE AS FAR', C.pink));
  await until(S(8)); await play(...say('BIGGER GRADIENT ≠ BIGGER STEP IS BETTER', C.amber));
  await until(S(9)); await play(...leave(st), ...appear(hills), ...say('TWO HILLS: GENTLE AND STEEP'));
  await until(S(10)); await play(new M.Indicate(hills.submobjects[2], { color: C.pink }), ...say('STEEP HILL: SMALLER STEPS', C.pink));
  await until(S(11)); await play(...leave(hills), ...say('EACH WEIGHT ADJUSTS ITS OWN STEP?', C.violet));

  // 12-21 two memory boxes per weight
  await until(S(12)); await play(...appear(...cells.flat(), ...rowLab), ...say('TWO BOXES PER WEIGHT', C.violet));
  await until(S(13)); await play(...appear(head[0]), new M.Indicate(cells[0][0], { color: C.violet }), new M.Indicate(cells[1][0], { color: C.violet }), ...say('BOX 1: RECENT GRADIENTS (LIKE MOMENTUM)', C.violet));
  await until(S(14)); await play(...appear(head[1]), new M.Indicate(cells[0][1], { color: C.amber }), new M.Indicate(cells[1][1], { color: C.amber }), ...say('BOX 2: HOW LARGE, ANY DIRECTION', C.amber));
  await until(S(15)); await play(...fbox(['gradient × gradient'], C.amber));
  await until(S(16)); await play(...say('SQUARING', C.amber), ...fbox(['gradient × gradient', ['= gradient squared', C.amber]], C.amber));
  await until(S(17)); await play(...fbox([['2² = 2 × 2 = 4', C.cyan], ['4² = 4 × 4 = 16', C.pink]], C.amber));
  await until(S(18)); await play(...fbox([['(−2)² = 4', C.amber], 'negative → positive', ['(0² = 0)', C.muted]], C.amber));
  const head2 = [text('1st moment', colX[0], headY, C.violet, 16), text('2nd moment', colX[1], headY, C.amber, 16)];
  await until(S(19)); await play(...leave(...head), ...appear(...head2), ...say('FIRST MOMENT • SECOND MOMENT'));
  head = head2;
  await until(S(20)); await play(...fbox([['1st: recent gradients', C.violet], ['2nd: recent squares', C.amber]], C.violet));
  await until(S(21)); await play(...say('USE BOTH MOMENTS = ADAM', C.green));

  // 22-38 step 1
  await until(S(22)); await play(...setV(0, 0, '0'), ...setV(0, 1, '0'), ...setV(1, 0, '0'), ...setV(1, 1, '0'), ...say('ALL FOUR BOXES START AT 0'));
  await until(S(23)); await play(...fbox(['new box =', '  ½ × old number', '  + ½ × new number', ['(real Adam keeps more old;', C.muted], [' ½ keeps numbers simple)', C.muted]], C.violet));
  await until(S(24)); await play(...fbox([['learning rate = 0.1', C.green]], C.green));
  await until(S(25)); await play(...say('STEP 1: A GETS GRADIENT 2, SQUARE 4', C.cyan), ...fbox([['A: gradient 2, square 4', C.cyan]]));
  await until(S(26)); await play(...setV(0, 0, '1'), ...setV(0, 1, '2'), ...fbox(['½ × 0 + ½ × 2 = 1', '½ × 0 + ½ × 4 = 2'], C.cyan));
  await until(S(27)); await play(...say('B GETS GRADIENT 4, SQUARE 16', C.pink), ...fbox([['B: gradient 4, square 16', C.pink]], C.pink));
  await until(S(28)); await play(...setV(1, 0, '2'), ...setV(1, 1, '8'), ...fbox(['½ × 0 + ½ × 4 = 2', '½ × 0 + ½ × 16 = 8'], C.pink));
  await until(S(29)); await play(...say('STARTED AT 0: ONLY HALF SHOWS', C.amber));
  await until(S(30)); await play(...fbox(['correct the zero start:', ['divide by 0.5', C.amber]], C.amber));
  await until(S(31)); await play(...setV(0, 0, '2', C.green), ...setV(0, 1, '4', C.green), ...say('CORRECTED (GREEN)', C.green), ...fbox([['A: 1 ÷ 0.5 = 2', C.cyan], ['   2 ÷ 0.5 = 4', C.cyan]]));
  await until(S(32)); await play(...setV(1, 0, '4', C.green), ...setV(1, 1, '16', C.green), ...fbox([['A: 2 and 4', C.cyan], ['B: 2 ÷ 0.5 = 4', C.pink], ['   8 ÷ 0.5 = 16', C.pink]], C.pink));
  await until(S(33)); await play(...say('SQUARE ROOT: BACK TO A GRADIENT SIZE', C.amber));
  await until(S(34)); await play(...fbox(['square root of 4:', ['2 × 2 = 4  →  √4 = 2', C.amber]], C.amber));
  await until(S(35)); await play(...fbox([['√4 = 2', C.cyan], ['√16 = 4', C.pink]], C.amber));
  await until(S(36)); await play(...fbox([['A: 2 ÷ 2 = 1', C.cyan]]));
  await until(S(37)); await play(...fbox([['A: 2 ÷ 2 = 1', C.cyan], ['B: 4 ÷ 4 = 1', C.pink]], C.pink));
  st = steps(0.7, 0.7, '−0.1', '−0.1');
  await until(S(38)); await play(...appear(st), ...say('BOTH DECREASE BY ABOUT 0.1', C.green), ...fbox(['0.1 × 1 = 0.1', ['A and B: −0.1 each', C.green]], C.green));

  // 39-48 step 2
  await until(S(39)); await play(...leave(st), ...setV(0, 0, '1'), ...setV(0, 1, '2'), ...setV(1, 0, '2'), ...setV(1, 1, '8'), ...say('STEP 2 • BOXES KEEP THE RAW NUMBERS'),
    ...fbox(['boxes keep raw numbers:', ['A: 1, 2   B: 2, 8', C.violet]], C.violet));
  await until(S(40)); await play(...setV(0, 0, '1.5'), ...fbox([['A: ½ × 1 + ½ × 2 = 1.5', C.violet]], C.violet));
  await until(S(41)); await play(...setV(0, 1, '3'), ...fbox([['A: ½ × 1 + ½ × 2 = 1.5', C.violet], ['   ½ × 2 + ½ × 4 = 3', C.amber]], C.amber));
  await until(S(42)); await play(...setV(1, 0, '3'), ...fbox([['B: ½ × 2 + ½ × 4 = 3', C.violet]], C.violet));
  await until(S(43)); await play(...setV(1, 1, '12'), ...fbox([['B: ½ × 2 + ½ × 4 = 3', C.violet], ['   ½ × 8 + ½ × 16 = 12', C.amber]], C.amber));
  await until(S(44)); await play(...fbox(['started at 0, so after', '2 steps boxes hold', ['¾ = 0.75 of full size', C.amber]], C.amber), ...say('THREE QUARTERS = 0.75', C.amber));
  await until(S(45)); await play(...fbox(['correct the zero start:', ['divide by 0.75', C.amber]], C.amber));
  await until(S(46)); await play(...setV(0, 0, '2', C.green), ...setV(0, 1, '4', C.green), ...say('CORRECTED (GREEN)', C.green), ...fbox([['A: 1.5 ÷ 0.75 = 2', C.cyan], ['   3 ÷ 0.75 = 4', C.cyan]]));
  await until(S(47)); await play(...setV(1, 0, '4', C.green), ...setV(1, 1, '16', C.green), ...fbox([['B: 3 ÷ 0.75 = 4', C.pink], ['   12 ÷ 0.75 = 16', C.pink]], C.pink));
  st = steps(0.7, 0.7, '−0.1', '−0.1');
  await until(S(48)); await play(...appear(st), ...fbox([['A: 2 ÷ √4 = 1', C.cyan], ['B: 4 ÷ √16 = 1', C.pink], ['both: −0.1', C.green]], C.green), ...say('AGAIN BOTH ABOUT −0.1', C.green));

  // 49-54 formula and meaning
  await until(S(49)); await play(...say('THE RULE AS A FORMULA', C.amber));
  await until(S(50)); await play(...fbox(['new weight = old weight', '  − rate × corrected 1st', ['    ÷ √(corrected 2nd)', C.amber]], C.amber));
  await until(S(51)); await play(...fbox(['new weight = old weight', '  − rate × corrected 1st', ['    ÷ (√(corrected 2nd) + tiny)', C.amber], ['tiny > 0: never ÷ 0', C.muted]], C.amber));
  await until(S(52)); await play(...say('GOOD WHEN GRADIENT SIZES DIFFER A LOT', C.green));
  await until(S(53)); await play(...say('NO GUARANTEE: RATE TOO LARGE CAN HURT', C.pink));
  await until(S(54)); await play(...say('ADAM: OWN STEP SIZE FOR EACH WEIGHT', C.green),
    ...fbox([['1st moment: recent gradients', C.violet], ['2nd moment: their sizes', C.amber]], C.green));
}

// 17.2.4 Momentum. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 4.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.65, 0] : [4.3, -0.3, 0];
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

  // network, card stack, memory box
  const N = net({ layers: [3, 3, 2], center: pt(P ? 0.9 : CX + 0.8, P ? 1.85 : 0.15), width: P ? 4.6 : 3.6, height: P ? 2.2 : 1.6 });
  const [ax, ay] = N.pos(0, 0), [hx] = N.pos(1, 0);
  const aTag = text('A', (ax + hx) / 2, ay + 0.28, C.cyan, 20);
  const stackP = P ? [-3.0, 0.95] : [-6.3, -0.45];
  const stack = new M.VGroup(...[2, 1, 0].map(k => rect(stackP[0] + k * 0.08, stackP[1] + k * 0.08, 0.7, 0.8, C.cyan, '#18233e')),
    T('7', P ? 30 : 26, C.ink, false, true).moveTo(pt(stackP[0], stackP[1])));
  const memP = P ? [-2.9, ay] : [-5.6, ay];
  const memBox = rect(memP[0], memP[1], 1.5, 0.82, C.violet);
  const memLab = text('stored gradient', memP[0] + (P ? 0.1 : 0), memP[1] - 0.6, C.violet, 16);
  const memLink = new M.DashedLine({ start: pt(memP[0] + 0.78, memP[1]), end: pt(ax - 0.34, ay), color: C.violet });
  let memVal = null;
  const setMem = v => { const t = text(v, memP[0], memP[1], C.violet, 24); const a = [new M.FadeIn(t)]; if (memVal) a.push(new M.FadeOut(memVal)); memVal = t; return a; };

  // three gradient chips
  const chipY = P ? -0.65 : -1.6, chipX = k => (P ? 0 : CX) + (k - 1) * (P ? 2.5 : 2.45);
  const SL = [2, 2, -1];
  const chips = SL.map((s, k) => {
    const x = chipX(k), col = s > 0 ? C.cyan : C.pink, len = Math.abs(s) * 0.32;
    const cw = P ? 2.3 : 1.95, ch = P ? 1.25 : 0.95, dy = P ? 1.3 : 1;
    return new M.VGroup(rect(x, chipY, cw, ch, col),
      text(`batch ${k + 1}`, x, chipY + 0.27 * dy, C.muted, P ? 16 : 14),
      text(s > 0 ? `gradient +${s}` : `gradient −${-s}`, x - 0.0, chipY - 0.02, col, P ? 19 : 16),
      s > 0 ? arrow(x + len / 2, chipY - 0.3 * dy, x - len / 2, chipY - 0.3 * dy, col) : arrow(x - len / 2, chipY - 0.3 * dy, x + len / 2, chipY - 0.3 * dy, col));
  });

  // weight track (change from the start)
  const TY = P ? -3.0 : -2.85;
  const wx = c => P ? 2.7 + c * 8 : CX + 2 + c * 7;
  const track = new M.VGroup(line(wx(P ? 0.15 : 0.3), TY, wx(-0.75), TY, C.muted, 3),
    ...[[0, 'start'], [-0.2, '−0.2'], [-0.5, '−0.5']].flatMap(([c, s]) => [line(wx(c), TY - 0.08, wx(c), TY + 0.08), text(s, wx(c), TY - 0.32, C.muted, 16)]),
    text('weight A', wx(-0.66), TY + 0.36, C.muted, 16));
  const wdot = new M.Dot({ point: pt(wx(0), TY), radius: 0.12, color: C.amber });
  const mv = c => new M.Transform(wdot, new M.Dot({ point: pt(wx(c), TY), radius: 0.12, color: C.amber }));
  const stepArrow = (a, b, col = C.amber) => arrow(wx(a), TY + 0.38, wx(b), TY + 0.38, col);

  const parcel = (() => {
    const s = P ? 1.5 : 1, x = P ? 0 : CX, y = P ? 0.6 : -0.3;
    const box = rect(x, y, 4.2 * s, 2.8 * s, C.amber, '#3a2a17');
    const lab = rect(x + 0.5 * s, y - 0.2 * s, 2.4 * s, 1.3 * s, C.ink, '#e8edf7');
    const tape = rect(x, y + 1.15 * s, 4.2 * s, 0.35 * s, C.amber, '#5a4320');
    const dig = T('4 0 7 1', P ? 40 : 36, C.bg, true, true).moveTo(pt(x + 0.5 * s, y - 0.2 * s));
    return new M.VGroup(box, tape, lab, dig);
  })();
  await until(S(0)); await play(...appear(parcel), ...say('READ DIGITS ON PARCEL LABELS'), ...fbox(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await play(...leave(parcel), ...appear(stack, N.group), ...say('TRAINING CARDS + NETWORK'), ...fbox(['cards → network', ['one weight: A', C.amber]]));
  await until(S(2)); await play(...N.weight(0, 0, 0, 1), ...appear(aTag, track, wdot), ...say('WATCH WEIGHT A', C.amber));
  await until(S(3)); await play(new M.Indicate(stack, { color: C.cyan }), ...say('EACH MINI-BATCH → HOW TO CHANGE A'));
  await until(S(4)); await play(...N.flow(0, C.amber), ...say('LOSS, THEN WORK BACKWARDS → GRADIENT', orange));
  await play(...N.flow(1, C.amber));
  await play(...N.flow(0, orange));
  await until(S(5)); await play(...say('THREE MINI-BATCHES, THREE GRADIENTS'));
  await until(S(6)); await play(...appear(chips[0]));
  await until(S(7)); await play(...appear(chips[1]));
  await until(S(8)); await play(...appear(chips[2]));
  await until(S(9)); await play(new M.Indicate(chips[0], { color: C.cyan }), new M.Indicate(chips[1], { color: C.cyan }), ...say('GRADIENT + → DECREASE ←', C.cyan));
  await until(S(10)); await play(new M.Indicate(chips[2], { color: C.pink }), ...say('GRADIENT − → INCREASE →', C.pink));
  await until(S(11)); await play(...say('DIFFERENT BATCHES, DIFFERENT DIRECTIONS', C.amber));
  await until(S(12)); await play(...say('DIRECTION FLIPS = LESS SMOOTH', C.pink));
  await until(S(13)); await play(...say('THINK OF A HEAVY SHOPPING CART', C.amber));
  await until(S(14)); await play(...say('A SMALL PUSH BACK DOES NOT REVERSE IT', C.amber));
  await until(S(15)); await play(...say('REMEMBER RECENT DIRECTIONS?', C.violet));

  // 16-21 the memory box
  await until(S(16)); await play(...appear(memBox), new M.Create(memLink), ...say('A SMALL BOX BESIDE WEIGHT A', C.violet));
  await until(S(17)); await play(...appear(memLab), ...say('IT HOLDS THE STORED GRADIENT', C.violet));
  await until(S(18)); await play(...setMem('0'), ...fbox([['stored gradient = 0', C.violet]], C.violet));
  await until(S(19)); await play(...fbox(['each step: mix', [' old stored gradient', C.violet], [' + new gradient', C.cyan]], C.violet));
  await until(S(20)); await play(...fbox(['new stored =', [' ½ × old stored', C.violet], [' + ½ × new gradient', C.cyan]], C.violet), ...say('HALF OF EACH: EQUAL SHARES', C.violet));
  await until(S(21)); await play(...say('THIS IS MOMENTUM', C.violet));

  // 22-29 step 1
  await until(S(22)); await play(new M.Indicate(wdot, { color: C.amber }), ...say('ONE STEP AT A TIME'));
  await until(S(23)); await play(...fbox([['learning rate = 0.2', C.amber]], C.amber));
  await until(S(24)); await play(new M.Indicate(chips[0], { color: C.cyan }), ...say('STEP 1: NEW GRADIENT +2'), ...fbox(['learning rate = 0.2', ['new gradient = 2', C.cyan]]));
  await until(S(25)); await play(...fbox([['½ × 0 = 0', C.violet]], C.violet));
  await until(S(26)); await play(...fbox([['½ × 0 = 0', C.violet], ['½ × 2 = 1', C.cyan]], C.violet));
  await until(S(27)); await play(...fbox([['½ × 0 = 0', C.violet], ['½ × 2 = 1', C.cyan], ['0 + 1 = 1', C.amber]], C.violet), ...setMem('1'));
  await until(S(28)); await play(...fbox(['stored gradient = 1', ['1 × 0.2 = 0.2', C.amber]], C.amber));
  let a1 = stepArrow(0, -0.2);
  await until(S(29)); await play(new M.Create(a1), mv(-0.2), ...say('STORED + → DECREASE A BY 0.2', C.amber));

  // 30-36 step 2
  await until(S(30)); await play(new M.Indicate(chips[1], { color: C.cyan }), ...say('STEP 2: NEW GRADIENT +2'), ...fbox([['new gradient = 2', C.cyan]]));
  await until(S(31)); await play(...fbox([['½ × 1 = 0.5', C.violet]], C.violet));
  await until(S(32)); await play(...fbox([['½ × 1 = 0.5', C.violet], ['½ × 2 = 1', C.cyan]], C.violet));
  await until(S(33)); await play(...fbox([['½ × 1 = 0.5', C.violet], ['½ × 2 = 1', C.cyan], ['0.5 + 1 = 1.5', C.amber]], C.violet), ...setMem('1.5'));
  await until(S(34)); await play(...fbox(['stored gradient = 1.5', ['1.5 × 0.2 = 0.3', C.amber]], C.amber));
  const a2 = stepArrow(-0.2, -0.5);
  await until(S(35)); await play(new M.Create(a2), mv(-0.5), ...say('DECREASE A BY 0.3', C.amber));
  await until(S(36)); await play(new M.Indicate(a1, { color: C.violet }), ...say('STEP 1 WAS SMALL: MEMORY STARTED AT 0', C.violet),
    ...fbox([['step 1: ½ × 2 = 1 → −0.2', C.violet], ['  (stored started at 0)', C.violet], ['step 2: 1.5 → −0.3', C.green]], C.violet));

  // 37-44 step 3
  await until(S(37)); await play(new M.Indicate(chips[2], { color: C.pink }), ...say('STEP 3: NEW GRADIENT −1', C.pink), ...fbox([['new gradient = −1', C.pink]], C.pink));
  await until(S(38)); await play(...fbox([['½ × 1.5 = 0.75', C.violet]], C.violet));
  await until(S(39)); await play(...fbox([['½ × 1.5 = 0.75', C.violet], ['½ × (−1) = −0.5', C.pink]], C.violet));
  await until(S(40)); await play(...fbox([['½ × 1.5 = 0.75', C.violet], ['½ × (−1) = −0.5', C.pink], ['0.75 − 0.5 = 0.25', C.amber]], C.violet), ...setMem('0.25'));
  await until(S(41)); await play(...fbox(['stored gradient = 0.25', ['0.25 × 0.2 = 0.05', C.amber]], C.amber));
  const a3 = stepArrow(-0.5, -0.55);
  await until(S(42)); await play(new M.Create(a3), mv(-0.55), ...say('DECREASE A BY 0.05', C.amber));
  const ghost = stepArrow(-0.5, -0.3, C.pink);
  const ghostLab = text('no momentum: +0.2', wx(-0.4), TY - 0.68, C.pink, 16);
  await until(S(43)); await play(...leave(a1, a2), new M.Create(ghost), ...appear(ghostLab), ...say('WITHOUT MOMENTUM: +0.2 →', C.pink),
    ...fbox([['no momentum:  +0.2', C.pink], ['momentum:     −0.05', C.amber]], C.pink));
  await until(S(44)); await play(new M.Indicate(a3, { color: C.amber }), ...say('SAME DIRECTION, SMALLER STEP: HEAVY CART', C.amber));
  await until(S(45)); await play(...leave(ghost, ghostLab), ...say('MANY OPPOSITE GRADIENTS CAN REVERSE IT', C.violet));

  // 46 the network keeps learning
  await until(S(46)); await play(...say('FRESH LOSS AND GRADIENTS AFTER EACH UPDATE'));
  for (let k = 0; k < 2; k++) {
    await play(...N.flow(0, C.amber));
    await play(...N.flow(1, C.amber));
    await play(...N.weight(0, 1, k + 1, k ? -0.7 : 0.8), ...N.weight(1, k, 1, k ? 0.6 : -0.5), ...N.weight(0, 0, 0, k ? 0.9 : 0.95));
  }

  // 47-53 formulas and meaning
  await until(S(47)); await play(...say('TWO STEPS AS FORMULAS', C.amber));
  await until(S(48)); await play(...fbox([['new stored gradient =', C.violet], '  ½ × old stored', '  + ½ × new gradient'], C.violet));
  await until(S(49)); await play(...fbox(['new stored = ½ old + ½ new', ['new weight = old weight', C.amber], ['  − rate × new stored', C.amber]], C.amber));
  await until(S(50)); await play(...say('HELPS WHEN DIRECTIONS KEEP CHANGING', C.green));
  await until(S(51)); await play(...say('TOO MUCH MEMORY CAN OVERSHOOT', C.pink));
  await until(S(52)); await play(...say('KEEP WATCHING THE LOSS', C.amber));
  await until(S(53)); await play(...say('MOMENTUM = SMOOTHER STEPS', C.green),
    ...fbox(['remember recent gradients', ['→ fewer sudden turns', C.green]], C.green));
}

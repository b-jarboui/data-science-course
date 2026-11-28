// 17.2.3 Loss landscapes and saddle points. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 4.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.6, 0] : [4.3, -0.3, 0];
  const orange = '#fb923c';
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pt = (x, y) => [x, y, 0];
  const text = (s, x, y, color = C.ink, size = 18) => T(String(s), size, color, true).moveTo(pt(x, y));
  const line = (x1, y1, x2, y2, color = C.muted, w = 2) => new M.Line({ start: pt(x1, y1), end: pt(x2, y2), color, strokeWidth: w });
  const arrow = (x1, y1, x2, y2, color = C.green) => new M.Arrow({ start: pt(x1, y1), end: pt(x2, y2), color, strokeWidth: 4, buff: 0 });
  const dot = (x, y, color = C.ink, r = 0.09) => new M.Dot({ point: pt(x, y), radius: r, color });
  const appear = (...o) => o.map(x => new M.FadeIn(x));
  const leave = (...o) => o.map(x => new M.FadeOut(x));

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const lh = 0.42;
    const rows = lines.map(r => Array.isArray(r) ? r : [r, C.ink]);
    const labels = rows.map(([s, c]) => T(s, P ? 21 : 20, c, true));
    const width = Math.max(...labels.map(l => l.getWidth())) + 0.65, height = rows.length * lh + 0.32;
    const [x, y] = BOXP;
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.18, color, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(pt(x, y));
    labels.forEach((l, i) => l.moveTo(pt(x - width / 2 + 0.325 + l.getWidth() / 2, y + ((rows.length - 1) / 2 - i) * lh)));
    const g = new M.VGroup(r, ...labels);
    const maxW = P ? FW - 1.0 : 4.4;
    if (width > maxW) g.scale(maxW / width);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  const loss = (x, y) => 4 + x * x - y * y + y ** 4;
  const create = g => [new M.Create(g)];

  // 0-10 the network and two weights
  const N = net({ layers: [3, 4, 2], center: pt(CX, P ? 0.3 : -0.5), width: P ? 6.0 : 5.4, height: P ? 4.2 : 2.4 });
  const [a0x, a0y] = N.pos(0, 0), [a1x, a1y] = N.pos(1, 0), [b0x, b0y] = N.pos(0, 2), [b1x, b1y] = N.pos(1, 3);
  const xTag = text('x', (a0x + a1x) / 2, (a0y + a1y) / 2 + 0.3, C.cyan, 22);
  const yTag = text('y', (b0x + b1x) / 2, (b0y + b1y) / 2 - 0.32, C.pink, 22);

  const rect = (x, y, w, h, color, fill, op = 1) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color, strokeWidth: 2 }); r.setFill(fill, op); r.moveTo(pt(x, y)); return r; };
  const parcel = (() => {
    const s = P ? 1.5 : 1, x = P ? 0 : CX, y = P ? 0.4 : -0.3;
    const box = rect(x, y, 4.2 * s, 2.8 * s, C.amber, '#3a2a17', 0.95);
    const lab = rect(x + 0.5 * s, y - 0.2 * s, 2.4 * s, 1.3 * s, C.ink, '#e8edf7', 1);
    const tape = rect(x, y + 1.15 * s, 4.2 * s, 0.35 * s, C.amber, '#5a4320', 1);
    const dig = T('4 0 7 1', P ? 40 : 36, C.bg, true, true).moveTo(pt(x + 0.5 * s, y - 0.2 * s));
    return new M.VGroup(box, tape, lab, dig);
  })();
  await until(S(0)); await play(...appear(parcel), ...say('READ DIGITS ON PARCEL LABELS'), ...fbox(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await play(...say('EACH PREDICTION: HOW WRONG?', C.pink), ...fbox(['prediction vs answer', ['how wrong?', C.pink]], C.pink));
  await until(S(2)); await play(...say('LOSS = HOW WRONG', C.pink), ...fbox([['loss = how wrong', C.pink]], C.pink));
  await until(S(3)); await play(...say('CHANGE WEIGHTS → SMALLER LOSS', C.green), ...fbox(['change the weights', ['→ smaller loss', C.green]], C.green));
  await until(S(4)); await play(...say('WHAT IF THE GRADIENTS SAY “DON’T MOVE”?', C.amber));
  await until(S(5)); await play(...leave(parcel), ...appear(N.group), ...say('OUR NETWORK'));
  await until(S(6)); await play(...N.weight(0, 0, 0, 1), ...N.weight(0, 2, 3, 1), ...say('PICK TWO WEIGHTS • KEEP THE REST'));
  await until(S(7)); await play(new M.Indicate(N.edges[0][0][0], { color: C.cyan }), new M.Indicate(N.edges[0][2][3], { color: C.pink }), ...say('HOW FAR DOES EACH MOVE?'));
  await until(S(8)); await play(...appear(xTag, yTag), ...say('THE TWO CHANGES: x AND y'));
  await until(S(9)); await play(...fbox([['x = 0', C.cyan], ['y = 0', C.pink]]), ...say('BOTH START AT 0'));
  await until(S(10)); await play(...fbox([['x = 0', C.cyan], ['y = 0', C.pink], ['loss = 4', C.amber]], C.amber));

  // 11-16 the landscape map (top view): bright = high loss, dark = low loss
  const MC = P ? [0, 1.25] : [-4.7, -0.4], MS = P ? 4.4 : 3.3;
  const mx = x => MC[0] + x * MS / 2, my = y => MC[1] + y * MS / 2;
  const frame = new M.VGroup(line(mx(-1), my(-1), mx(1), my(-1)), line(mx(1), my(-1), mx(1), my(1)), line(mx(1), my(1), mx(-1), my(1)), line(mx(-1), my(1), mx(-1), my(-1)));
  const n = 12, cs = MS / n;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lo = hex('#0d2b4a'), hi = hex('#fbbf24');
  const mix = t => '#' + lo.map((c, i) => Math.round(c + (hi[i] - c) * t).toString(16).padStart(2, '0')).join('');
  const cells = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = -1 + (i + 0.5) * 2 / n, y = -1 + (j + 0.5) * 2 / n;
    const t = Math.max(0, Math.min(1, (loss(x, y) - 3.75) / 1.25));
    const sq = new M.Rectangle({ width: cs * 0.96, height: cs * 0.96, color: mix(t), strokeWidth: 0 }); sq.setFill(mix(t), 0.85); sq.moveTo(pt(mx(x), my(y)));
    cells.push(sq);
  }
  const axX = text('x →', mx(1) - 0.3, my(-1) - 0.27, C.cyan, 18), axY = text('y ↑', mx(-1) - 0.36, my(1) - 0.2, C.pink, 18);
  await until(S(11)); await play(...leave(N.group, xTag, yTag), ...create(frame), ...appear(axX, axY), ...say('A PICTURE OF THE LOSS'));
  await until(S(12)); await play(new M.LaggedStart(cells.map(c => new M.FadeIn(c)), { lagRatio: 0.004, runTime: 1.8 }), ...say('LAND WITH HILLS AND VALLEYS'));
  await until(S(13)); await play(...fbox([['bright = high loss', C.amber], ['dark   = low loss', C.cyan]], C.amber));
  const roam = dot(mx(0.6), my(-0.5), C.ink, 0.1);
  await until(S(14)); await play(...appear(roam), ...say('EACH SPOT = ONE PAIR OF WEIGHTS'));
  await play(new M.Transform(roam, dot(mx(-0.5), my(0.6), C.ink, 0.1)));
  await until(S(15)); await play(...leave(roam), ...say('A LOSS LANDSCAPE', C.amber));
  const me = dot(mx(0), my(0), C.ink, 0.11);
  await until(S(16)); await play(...appear(me), ...say('START AT THE CENTER: LOSS 4'), ...fbox(['x = 0, y = 0', ['loss = 4', C.amber]], C.amber));

  // 17-28 two tracks, with a side view
  const PC = P ? [0.2, -2.75] : [-0.5, -0.4], PW = P ? 6.2 : 3.2, PH = P ? 2.2 : 2.6;
  const px = o => PC[0] - PW / 2 + (o + 1) / 2 * PW, py = v => PC[1] - PH / 2 + (v - 3.7) / 1.3 * PH;
  const pAxes = new M.VGroup(line(px(-1), py(3.7), px(1), py(3.7)), line(px(0), py(3.7), px(0), py(5.0), C.line),
    text('loss', px(-1) + 0.3, py(5.0) + 0.05, C.muted, 16), text('−1', px(-1), py(3.7) - 0.25, C.muted, 16), text('0', px(0), py(3.7) - 0.25, C.muted, 16), text('1', px(1), py(3.7) - 0.25, C.muted, 16),
    text('change', px(0.5), py(3.7) - 0.25, C.muted, 16));
  const curve = (f, col) => { const segs = []; for (let k = 0; k < 40; k++) { const a = -1 + k / 20, b = a + 0.05; segs.push(line(px(a), py(f(a)), px(b), py(f(b)), col, 4)); } return new M.VGroup(...segs); };
  const cX = curve(o => loss(o, 0), C.cyan), cY = curve(o => loss(0, o), C.pink);
  const trackX = line(mx(-1), my(0), mx(1), my(0), C.cyan, 4), trackY = line(mx(0), my(-1), mx(0), my(1), C.pink, 4);
  const pdot = dot(px(0), py(4), C.ink, 0.09);
  const at = (x, y) => [new M.Transform(me, dot(mx(x), my(y), C.ink, 0.11))];
  const pat = (o, f, col = C.ink) => [new M.Transform(pdot, dot(px(o), py(f(o)), col, 0.09))];
  const fx = o => loss(o, 0), fy = o => loss(0, o);
  const tagX = text('track x', px(0.55), py(fx(1)) - 0.25, C.cyan, 16), tagY = text('track y', px(-0.55), py(3.7) - 0.58, C.pink, 16);

  await until(S(17)); await play(...create(trackX), ...create(pAxes), ...say('TRACK 1: ONLY x CHANGES', C.cyan));
  await play(...create(cX), ...appear(tagX, pdot));
  await until(S(18)); await play(...at(0.1, 0), ...pat(0.1, fx), ...fbox([['x = 0.1', C.cyan], 'y = 0'], C.cyan));
  await until(S(19)); await play(...fbox([['x = 0.1', C.cyan], 'y = 0', ['loss: 4 → 4.01 ↑', C.amber]], C.cyan));
  await until(S(20)); await play(...at(-0.1, 0), ...pat(-0.1, fx), ...fbox([['x = −0.1', C.cyan], 'y = 0'], C.cyan));
  await until(S(21)); await play(...fbox([['x = −0.1', C.cyan], 'y = 0', ['loss: 4 → 4.01 ↑', C.amber]], C.cyan));
  await until(S(22)); await play(new M.Indicate(cX, { color: C.cyan }), ...say('ALONG x: BOTTOM OF A VALLEY', C.cyan));
  await until(S(23)); await play(...at(0, 0), ...pat(0, fx), ...create(trackY), ...say('TRACK 2: ONLY y CHANGES', C.pink));
  await play(...create(cY), ...appear(tagY));
  await until(S(24)); await play(...at(0, 0.1), ...pat(0.1, fy), ...fbox(['x = 0', ['y = 0.1', C.pink]], C.pink));
  await until(S(25)); await play(...fbox(['x = 0', ['y = 0.1', C.pink], ['loss: 4 → 3.99 ↓', C.green]], C.pink));
  await until(S(26)); await play(...at(0, -0.1), ...pat(-0.1, fy), ...fbox(['x = 0', ['y = −0.1', C.pink]], C.pink));
  await until(S(27)); await play(...fbox(['x = 0', ['y = −0.1', C.pink], ['loss: 4 → 3.99 ↓', C.green]], C.pink));
  await until(S(28)); await play(new M.Indicate(cY, { color: C.pink }), ...say('ALONG y: TOP OF A HILL', C.pink));

  // 29-34 the saddle point
  await until(S(29)); await play(...at(0, 0), ...pat(0, fy), new M.Indicate(trackX, { color: C.cyan }), new M.Indicate(trackY, { color: C.pink }), ...say('BOTH TRACKS'));
  await until(S(30)); await play(...say('VALLEY ONE WAY • HILL THE OTHER', C.amber), ...fbox([['track x: valley', C.cyan], ['track y: hill', C.pink]]));
  await until(S(31)); await play(...say('SHAPE OF A HORSE SADDLE', C.amber));
  const sT = T('saddle point', P ? 17 : 16, C.ink, true);
  const sTx = mx(0.5), sTy = my(-0.5);
  const sTag = new M.VGroup(rect(sTx, sTy, sT.getWidth() + 0.3, 0.42, C.amber, C.card, 0.95), sT.moveTo(pt(sTx, sTy)));
  const sLine = line(sTx - 0.2, sTy + 0.21, mx(0) + 0.1, my(0) - 0.1, C.amber, 2);
  await until(S(32)); await play(...appear(sTag, sLine), new M.Flash(me, { color: C.amber }), ...say('A SADDLE POINT', C.amber));
  await until(S(33)); await play(...say('LOOK AT THE GRADIENTS AT THE CENTER'));
  await until(S(34)); await play(...fbox([['gradient x = 0', C.cyan], ['gradient y = 0', C.pink], ['but lower spots nearby!', C.green]], C.amber));

  // 35-38 learning gets stuck: loss per step stays at 4
  const sx = s => PC[0] - PW / 2 + s / 8 * PW, sy = v => PC[1] - PH / 2 + (v - 3.7) / 0.4 * PH;
  const sAxes = new M.VGroup(line(sx(0), sy(3.7), sx(8), sy(3.7)), line(sx(0), sy(3.7), sx(0), sy(4.1)),
    line(sx(0), sy(4), sx(8), sy(4), C.line), text('4', sx(0) - 0.22, sy(4), C.muted, 16), text('3.75', sx(0) - 0.4, sy(3.75), C.muted, 16),
    text('training step', sx(8) - 0.8, sy(3.7) - 0.27, C.muted, 16), text('loss', sx(0) + 0.32, sy(4.1) + 0.05, C.muted, 16));
  const stepPts = [];
  const flatPt = s => { const d = dot(sx(s), sy(4), C.amber, 0.07); stepPts.push(d); return d; };
  await until(S(35)); await play(...leave(pAxes, cX, cY, pdot, tagX, tagY), ...create(sAxes), ...say('GRADIENT DESCENT USES THE GRADIENTS'));
  await play(...appear(flatPt(0)));
  await until(S(36)); await play(...appear(flatPt(1)), new M.Flash(me, { color: C.muted }), ...fbox(['change = rate × 0', ['= 0 (no move)', C.muted]], C.muted));
  await until(S(37)); await play(...appear(flatPt(2)), ...say('STEP 2: STILL NO MOVE', C.muted));
  await until(S(38)); await play(new M.LaggedStart([3, 4, 5, 6].map(s => new M.FadeIn(flatPt(s))), { lagRatio: 0.3, runTime: 2 }), ...say('LOSS STAYS FLAT AT 4', C.muted));

  // 39-46 a small push along y
  await until(S(39)); await play(...at(0, 0.1), ...say('PUSH y TO 0.1', C.pink), ...fbox(['x = 0', ['y = 0.1', C.pink]], C.pink));
  await until(S(40)); await play(...fbox(['x = 0', ['y = 0.1', C.pink], ['loss ≈ 3.99', C.green]], C.green));
  let push = arrow(mx(0) + 0.25, my(0.1), mx(0) + 0.25, my(0.1) + 0.2 * MS / 2 * 1.5, C.green);
  await until(S(41)); await play(...create(push), ...fbox(['y = 0.1', 'loss ≈ 3.99', ['downhill push ≈ 0.20', C.green]], C.green));
  await until(S(42)); await play(...leave(push), ...at(0, 0.2), ...say('TRY y = 0.2', C.pink));
  await until(S(43)); await play(...fbox(['y = 0.2', ['loss ≈ 3.96', C.green]], C.green));
  push = arrow(mx(0) + 0.25, my(0.2), mx(0) + 0.25, my(0.2) + 0.37 * MS / 2 * 1.5, C.green);
  await until(S(44)); await play(...create(push), ...fbox(['y = 0.2', 'loss ≈ 3.96', ['downhill push ≈ 0.37', C.green]], C.green));
  await until(S(45)); await play(...leave(push), ...say('TRAINING CAN GO ON, DOWNHILL', C.green));
  const ys = [0.2]; for (let k = 0; k < 6; k++) { const y = ys[ys.length - 1]; ys.push(y + 0.3 * (2 * y - 4 * y ** 3)); }
  const gPts = ys.map((y, k) => dot(sx(k + 2), sy(loss(0, y)), C.green, 0.07));
  await until(S(46)); await play(...appear(gPts[0]), ...say('STEPS SHRINK NEAR THE VALLEY BOTTOM', C.green));
  for (let k = 1; k < ys.length; k++) await play(...at(0, ys[k]), ...appear(gPts[k]));
  await play(...fbox([`y: 0.2 → ${ys[ys.length - 1].toFixed(2)}`, [`loss: 3.96 → ${loss(0, ys[ys.length - 1]).toFixed(2)}`, C.green]], C.green));

  // 47-54 the formula and the lesson
  await until(S(47)); await play(...say('A FORMULA FOR THIS LANDSCAPE', C.amber));
  await until(S(48)); await play(...fbox(['loss = 4 + x²', '       − y² + y⁴'], C.amber));
  await until(S(49)); await play(...fbox(['loss = 4 + x² − y² + y⁴', ['squared: 0.1² = 0.1 × 0.1', C.cyan], ['       = 0.01', C.cyan]], C.amber));
  await until(S(50)); await play(...fbox(['loss = 4 + x² − y² + y⁴', ['4th power: 0.1⁴', C.pink], ['= 0.1×0.1×0.1×0.1', C.pink]], C.amber));
  await until(S(51)); await play(...say('ONLY OUR EXAMPLE, NOT EVERY NETWORK', C.muted));
  await until(S(52)); await play(new M.Indicate(sAxes, { color: C.muted }), ...say('MINI-BATCH CHANCE PUSHES IT OFF', C.amber),
    ...fbox(['real training:', 'each mini-batch is random', ['→ slows down, not stuck', C.green]], C.amber));
  await until(S(53)); await play(...say('TRAP: ZERO GRADIENT ≠ LOWEST LOSS', C.pink), ...fbox([['gradients = 0', C.pink], ['≠ smallest loss', C.pink]], C.pink));
  await until(S(54)); await play(new M.Indicate(sTag, { color: C.green }), ...say('SADDLE: ZERO GRADIENTS, LOWER SPOTS NEARBY', C.green),
    ...fbox(['saddle point', ['gradients = 0', C.amber], ['some ways go down', C.green]], C.green));
}

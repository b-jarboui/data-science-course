// 18.1.3 Self-supervised targets: the picture supplies its own answer.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const A = [4, 0, 4, 0], B = [0, 4, 0, 4], DA = [2, 2, 4, 0], DB = [2, 2, 0, 4];
  const CX = P ? 0 : -2.6;
  const PILL = [CX, P ? 2.45 : 1.85, 0];
  const BOXP = P ? [0, 3.58, 0] : [4.3, 0.5, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);
  const label = (text, size, color, x, y, mono = false) => T(text, size, color, mono).moveTo([x, y, 0]);
  const fade = o => new M.FadeIn(o, { runTime: 0.3 });
  const out = o => new M.FadeOut(o, { runTime: 0.3 });
  const mark = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.5 });
  const cascade = (a, rt = 0.8) => new M.LaggedStart(a, { lagRatio: 0.12, runTime: rt });
  // pulses leave their line behind in this engine: remove it right after the beat
  const trash = [];
  const go = async (...anims) => { await play(...anims); if (trash.length) { const g = trash.splice(0); await play(new M.FadeOut(new M.VGroup(...g), { runTime: 0.15 })); } };
  const fmt = n => String(Math.round(n * 10000) / 10000).replace('-', '−');
  const nv = n => fmt(Math.round(n * 100) / 100);
  const rect = (w, h, x, y, color, sw = 4) => new M.Rectangle({ width: w, height: h, color, strokeWidth: sw }).moveTo([x, y, 0]);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 20 : 19, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = 0.39, height = rows.length * lh + 0.26;
    const [x, y] = BOXP;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95); frame.moveTo([x, y, 0]);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 1.2 : 4;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  // a teaching picture: 4 values = 2 x 2 squares (TL, TR, BL, BR); 2 values = one row
  const grey = v => { const g = Math.round(14 + Math.max(0, Math.min(4, v)) / 4 * 230); const h = g.toString(16).padStart(2, '0'); return '#' + h + h + h; };
  function pic(vals, [x, y], s, size, showNums = true) {
    const off = vals.length === 2 ? [[-1, 0], [1, 0]] : [[-1, 1], [1, 1], [-1, -1], [1, -1]];
    const cells = [], nums = [];
    vals.forEach((v, k) => {
      const c = new M.Square({ sideLength: s, color: C.muted, strokeWidth: 2 });
      c.setFill(grey(v), 1); c.moveTo([x + off[k][0] * s / 2, y + off[k][1] * s / 2, 0]); cells.push(c);
      if (showNums) nums.push(label(nv(v), nv(v).length > 3 ? Math.max(P ? 15 : 12, size * 0.8) : size, v >= 2 ? C.bg : C.ink, x + off[k][0] * s / 2, y + off[k][1] * s / 2, true));
    });
    return { cells, nums, group: new M.VGroup(...cells, ...nums) };
  }

  // 0-1 museum photos, no descriptions
  const vase = (x, y, rb, tag) => {
    const card = new M.RoundedRectangle({ width: 1.5, height: 1.8, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
    card.setFill(C.card, 0.95); card.moveTo([x, y, 0]);
    const body = new M.Circle({ radius: rb, color: '#c08a5a', strokeWidth: 2 }); body.setFill('#c08a5a', 0.75); body.moveTo([x, y - 0.12, 0]);
    const neck = new M.Rectangle({ width: 0.22, height: 0.36, color: '#c08a5a', strokeWidth: 2 }); neck.setFill('#c08a5a', 0.75); neck.moveTo([x, y + rb + 0.02, 0]);
    const rim = new M.Rectangle({ width: 0.42, height: 0.08, color: '#c08a5a', strokeWidth: 2 }); rim.setFill('#c08a5a', 0.9); rim.moveTo([x, y + rb + 0.22, 0]);
    return new M.VGroup(card, body, neck, rim, label(tag, 16, C.muted, x, y - 0.72, true));
  };
  const photoPos = P ? [[-1.3, 0.55], [1.3, 0.55], [-1.3, -1.65], [1.3, -1.65]] : [[-4.5, -0.4], [-1.5, -0.4], [1.5, -0.4], [4.5, -0.4]];
  const photos = ['A', 'B', 'C', 'D'].map((t, i) => vase(photoPos[i][0], photoPos[i][1], [0.36, 0.3, 0.4, 0.32][i], t));

  await until(S(0));
  await go(cascade(photos.map(fade), 1.2), ...say('THOUSANDS OF PHOTOS, NO DESCRIPTIONS', C.muted));
  await until(S(1));
  await go(...say('LEARN WITHOUT CORRECT ANSWERS?', C.amber));

  // 2-7 the two pictures, the teacher's exercise
  const big = P ? 0.8 : 0.7;
  const pos = P ? { A: [-1.5, 0.2], B: [1.5, 0.2], T: [1.5, -2.2] } : { A: [-5.2, -0.4], B: [-2.4, -0.4], T: [0.3, -0.05] };
  const cA = pic(A, pos.A, big, 22), cB = pic(B, pos.B, big, 22);
  const above = (p, s, c, h = 2) => label(s, 16, c, p[0], p[1] + h * big / 2 + 0.32);
  const tA = above(pos.A, 'vessel A', C.muted), tB = above(pos.B, 'vessel B', C.muted);
  await until(S(2));
  await go(...photos.map(out), cascade([cA.group, tA, cB.group, tB].map(fade), 0.8), ...say('VESSEL A AND VESSEL B'));
  await until(S(3));
  await go(cascade(cA.nums.map(n => mark(n, C.cyan)), 1.2), ...say('A: 4, 0, 4, 0'));
  await until(S(4));
  await go(cascade(cB.nums.map(n => mark(n, C.cyan)), 1.2), ...say('B: 0, 4, 0, 4'));

  const cover = new M.Rectangle({ width: 2 * big + 0.14, height: big + 0.08, color: C.violet, strokeWidth: 2 });
  cover.setFill(C.violet, 1); cover.moveTo([pos.A[0], pos.A[1] + big / 2, 0]);
  await until(S(5));
  await go(fade(cover), ...say('A TEACHER COVERS PART: COMPLETE IT!', C.violet));
  await until(S(6));
  await go(new M.FadeOut(cover, { shift: [0, 0.6, 0], runTime: 0.6 }), mark(cA.group, C.green), ...say('REMOVE THE COVER: CHECK', C.green));
  await until(S(7));
  await go(...say('CAN THE COMPUTER DO THIS ITSELF?', C.amber));

  // 8-16 the computer makes its own exercise
  const dA = pic(DA, pos.B, big, 22, false), dnA = pic(DA, pos.B, big, 22).nums;
  const tD = above(pos.B, 'covered A', C.muted);
  await until(S(8));
  await go(out(cB.group), out(tB), fade(dA.group), fade(tD), ...say('COVER THE TOP ROW OF A', C.muted));
  await until(S(9));
  await go(cascade(dnA.map(fade), 0.8), ...say('GREY = BRIGHTNESS 2', C.muted));
  const tgt0 = pic([4, 0], pos.T, big, 22);
  const tT = above(pos.T, 'hidden copy', C.amber, 1);
  const tBox = rect(2 * big + 0.14, big + 0.12, pos.T[0], pos.T[1], C.amber);
  await until(S(10));
  await go(fade(tgt0.group), fade(tT), ...say('KEEP A COPY OF THE TOP ROW: 4, 0', C.amber));
  await until(S(11));
  await go(fade(tBox), ...say('TARGET = THE CORRECT ANSWER', C.amber));
  await until(S(12));
  await go(...say('NO VESSEL LABEL NEEDED', C.green));
  await until(S(13));
  await go(mark(dA.group, C.cyan), mark(tgt0.group), ...say('EXERCISE + ANSWER FROM THE PICTURE', C.cyan));
  await until(S(14));
  await go(...say('SELF-SUPERVISED LEARNING', C.green));
  await until(S(15));
  await go(...fbox(['supervised:', ['correct answers', C.cyan], ['guide learning', C.cyan]]));
  await until(S(16));
  await go(...fbox(['self-supervised:', ['answers made', C.green], ['from the data', C.green]], C.green));

  // 17-19 the network
  const R = P ? 0.32 : 0.34;
  const NC = P ? [0, -1.5, 0] : [CX, -0.5, 0];
  const NW = P ? 4.6 : 4.4, NH = 2.4;
  const N = net({ layers: [4, 1, 4], center: NC, width: NW, height: NH, r: R });
  const s0 = P ? 0.72 : 0.6, ns = P ? 18 : 15;
  // numbers inside neurons: 4-character values ('3.75') are shrunk to stay inside the circle
  const val = (l, i, s, col) => { const a = N.value(l, i, s, col); if (String(s).length > 3 && a[0].mobject) a[0].mobject.scale(0.85); return a; };
  const tg = P ? 17 : 15;
  const INP = P ? [-2.3, 0.95] : [CX - NW / 2 - 1.45, NC[1]];
  const OUTP = P ? [2.3, 0.95] : [CX + NW / 2 + 1.45, -1.35];
  const TGT = P ? [0, 0.95 + s0 / 2] : [CX + NW / 2 + 1.45, 0.3];
  const pulse = (l, col, backward) => {
    const ls = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => { const a = N.pos(l, i), b = N.pos(l + 1, j);
      const s = [a[0] + R, a[1], 0], e = [b[0] - R, b[1], 0];
      ls.push(new M.Line({ start: backward ? e : s, end: backward ? s : e, color: col, strokeWidth: 5 })); }));
    trash.push(...ls);
    return [new M.LaggedStart(ls.map(f => new M.ShowPassingFlash(f, { timeWidth: 0.4 })), { lagRatio: 0.08 })];
  };
  const fwd = (l, col = C.amber) => pulse(l, col, false), back = l => pulse(l, C.violet, true);

  await until(S(17));
  await go(...[cA.group, dA.group, tgt0.group].map(out), ...[...dnA, tA, tD, tT, tBox].map(out), ...fbox([]),
    cascade(N.nodes.flat().map(fade), 1.0), ...say('OUR NETWORK: 4 · 1 · 4'));
  await go(cascade(N.edges.flat(2).map(e => new M.Create(e, { runTime: 0.3 })), 1.2));

  let inPic = pic(DA, INP, s0, ns);
  const inTag = label('covered input', tg, C.muted, INP[0], INP[1] + s0 + 0.28);
  let tgtPic = pic([4, 0], TGT, s0, ns);
  const tgtTag = label('hidden target', tg, C.amber, TGT[0], TGT[1] + s0 / 2 + 0.28);
  await until(S(18));
  await go(fade(inPic.group), fade(inTag), fade(tgtPic.group), fade(tgtTag), ...DA.map((v, i) => N.value(0, i, String(v), C.violet)).flat(),
    ...fwd(0, C.violet), ...say('INPUT: 2, 2, 4, 0'));

  const tagY = P ? -3.42 : -2.25, wY = P ? -3.85 : -2.68;
  const encX = (N.pos(0, 0)[0] + N.pos(1, 0)[0]) / 2, decX = (N.pos(1, 0)[0] + N.pos(2, 0)[0]) / 2;
  const encTag = label('encoder', P ? 18 : 16, C.cyan, encX, tagY), decTag = label('decoder', P ? 18 : 16, C.amber, decX, tagY);
  let wTag = null;
  const setW = w => {
    const t = label('w = ' + fmt(w), P ? 18 : 16, C.amber, encX, wY, true);
    const a = wTag ? [out(wTag)] : []; a.push(fade(t)); wTag = t;
    [0, 1, 2, 3].forEach(i => a.push(...N.weight(0, i, 0, (i % 2 ? -1 : 1) * w)));
    return a;
  };
  await until(S(19));
  await go(fade(encTag), fade(decTag), ...setW(0), ...fbox([['w = 0 at the start', C.amber]]), ...say('ONE ADJUSTABLE WEIGHT w', C.amber));

  // 20-25 forward pass
  const colBox = (side, color) => rect(s0 + 0.12, 2 * s0 + 0.12, INP[0] + side * s0 / 2, INP[1], color);
  const boxL = colBox(-1, C.cyan), boxR = colBox(1, C.pink);
  await until(S(20));
  await go(fade(boxL), ...fbox(['left: 2 + 4 = 6']), ...say('INSIDE THE ENCODER'));
  await until(S(21));
  await go(out(boxL), fade(boxR), ...fbox(['left: 2 + 4 = 6', 'right: 2 + 0 = 2']));
  await until(S(22));
  await go(out(boxR), ...fbox(['left − right', ['6 − 2 = 4', C.amber]]));
  await until(S(23));
  await go(...fbox(['6 − 2 = 4', ['4 ÷ 4 = 1', C.amber]]));
  await until(S(24));
  await go(...fwd(0), ...N.value(1, 0, '0', C.amber), ...fbox(['1 × w = 1 × 0', ['middle = 0', C.amber]]));

  let outPic = null;
  const outTag = label('prediction', tg, C.amber, OUTP[0], P ? OUTP[1] + s0 + 0.28 : OUTP[1] - s0 - 0.28);
  const setOut = vals => {
    const p = pic(vals, OUTP, s0, ns);
    const a = outPic ? [out(outPic.group)] : [fade(outTag)]; a.push(fade(p.group)); outPic = p;
    vals.forEach((v, i) => a.push(...val(2, i, nv(v), C.amber)));
    return a;
  };
  await until(S(25));
  await go(...[0, 1, 2, 3].map(j => N.weight(1, 0, j, j % 2 ? -1 : 1)).flat(), ...fwd(1), ...setOut([2, 2, 2, 2]),
    ...fbox([['left: 2 + middle', C.cyan], ['right: 2 − middle', C.pink], ['all four = 2', C.amber]]), ...say('DECODER: ALL SQUARES 2', C.amber));

  // 26-31 loss only on the hidden squares
  const topBox = rect(2 * s0 + 0.14, s0 + 0.12, OUTP[0], OUTP[1] + s0 / 2, C.green);
  const tgtBox = rect(2 * s0 + 0.14, s0 + 0.12, TGT[0], TGT[1], C.green);
  await until(S(26));
  await go(fade(topBox), fade(tgtBox), ...say('CHECK ONLY THE 2 HIDDEN SQUARES', C.green));
  await until(S(27));
  await go(...fbox(['predicted top row: 2, 2', ['correct top row:   4, 0', C.amber]]));
  await until(S(28));
  await go(...fbox(['4 − 2 = 2', '0 − 2 = −2']), ...say('BOTH OFF BY 2', C.pink));
  await until(S(29));
  await go(...fbox(['2 × 2 = 4', '(−2) × (−2) = 4']), ...say('SQUARE BOTH DIFFERENCES'));
  await until(S(30));
  await go(...fbox(['(4 + 4) ÷ 2 = 4', ['loss = 4', C.pink]], C.pink), ...say('LOSS = 4', C.pink));
  await until(S(31));
  await go(...fbox(['vessel A: loss 4', ['vessel B: loss 4', C.pink]], C.pink));

  // 32-35 loss curve, slope, learning rate
  const CH = P ? { x: 0, y: -4.75, w: 5, h: 1.0 } : { x: 4.3, y: -1.95, w: 3.4, h: 1.3 };
  const x0 = CH.x - CH.w / 2, y0 = CH.y - CH.h / 2;
  const cp = (w, loss) => [x0 + 0.15 + w / 4 * (CH.w - 0.3), y0 + loss / 4 * CH.h, 0];
  const lossOf = w => (2 - w) * (2 - w);
  const curve = [];
  for (let k = 0; k < 40; k++) curve.push(new M.Line({ start: cp(k / 10, lossOf(k / 10)), end: cp((k + 1) / 10, lossOf((k + 1) / 10)), color: C.pink, strokeWidth: 3 }));
  const axes = new M.VGroup(
    new M.Line({ start: [x0, y0, 0], end: [x0 + CH.w, y0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [x0, y0, 0], end: [x0, y0 + CH.h + 0.1, 0], color: C.muted, strokeWidth: 2 }),
    label('loss', P ? 16 : 14, C.pink, x0 + 0.3, y0 + CH.h + 0.22), label('w', P ? 17 : 15, C.muted, x0 + CH.w + 0.18, y0, true),
    label('0', P ? 15 : 13, C.muted, cp(0, 0)[0], y0 - 0.2, true), label('2', P ? 15 : 13, C.muted, cp(2, 0)[0], y0 - 0.2, true), label('4', P ? 15 : 13, C.muted, cp(4, 0)[0], y0 - 0.2, true));
  const dot = new M.Dot({ point: cp(0, 4), radius: 0.08, color: C.amber });
  const moveDot = w => [new M.Transform(dot, new M.Dot({ point: cp(w, lossOf(w)), radius: 0.08, color: C.amber })),
    fade(new M.Dot({ point: cp(w, lossOf(w)), radius: 0.04, color: C.ink }))];
  await until(S(32));
  await go(out(topBox), out(tgtBox), new M.Create(axes), cascade(curve.map(c => new M.Create(c, { runTime: 0.1 })), 1.2), fade(dot),
    ...say('CHANGE w TO LOWER THE LOSS', C.amber));
  const tangent = new M.Line({ start: cp(0, 4), end: cp(0.6, 4 - 4 * 0.6), color: C.violet, strokeWidth: 4 });
  await until(S(33));
  await go(new M.Create(tangent), ...fbox([['at w = 0: slope = −4', C.violet]], C.violet), ...say('SLOPE OF THE LOSS CURVE', C.violet));
  await until(S(34));
  await go(out(tangent), ...fbox([['learning rate = 1/4', C.green]], C.green), ...say('LEARNING RATE = STEP SIZE', C.green));
  await until(S(35));
  await go(...back(1), ...fbox(['−4 × 1/4 = −1', 'new w = 0 − (−1)']));

  // 36-46 three slow steps
  await until(S(36));
  await go(...back(0), ...setW(1), ...moveDot(1), ...fbox([['w = 1', C.amber], 'middle = 1']), ...say('STEP 1', C.amber));
  await go(...fwd(0), ...N.value(1, 0, '1', C.amber));
  await until(S(37));
  await go(...fwd(1), ...setOut([3, 1, 3, 1]), ...say('PREDICTED TOP ROW: 3, 1', C.amber));
  await until(S(38));
  await go(...fbox(['4 − 3 = 1    0 − 1 = −1', ['loss: 4 → 1', C.pink]], C.pink));
  const steps = [
    { slope: -2, d: 0.5, w: 1.5, o: [3.5, 0.5, 3.5, 0.5], loss: 0.25, prev: 1, b: [39, 40, 41, 42] },
    { slope: -1, d: 0.25, w: 1.75, o: [3.75, 0.25, 3.75, 0.25], loss: 0.0625, prev: 0.25, b: [43, 44, 45, 46] },
  ];
  for (let k = 0; k < 2; k++) {
    const st = steps[k], [b1, b2, b3, b4] = st.b;
    await until(S(b1));
    await go(...back(1), ...fbox([`slope = ${fmt(st.slope)}`, `${fmt(st.slope)} × 1/4 = ${fmt(st.slope / 4)}`, [`w + ${fmt(st.d)}`, C.green]]), ...say('STEP ' + (k + 2), C.amber));
    await until(S(b2));
    await go(...back(0), ...setW(st.w), ...moveDot(st.w), ...fbox([`w = ${fmt(st.w)}`, ['middle = ' + fmt(st.w), C.amber]]));
    await go(...fwd(0), ...val(1, 0, nv(st.w), C.amber));
    await go(...fwd(1), ...setOut(st.o));
    await until(S(b3));
    await go(mark(outPic.group, C.amber), ...say(`PREDICTED TOP ROW: ${fmt(st.o[0])}, ${fmt(st.o[1])}`, C.amber));
    await until(S(b4));
    await go(...fbox([`each hidden square off by ${fmt(4 - st.o[0])}`, [`loss: ${fmt(st.prev)} → ${fmt(st.loss)}`, C.pink]], C.pink));
  }

  // 47 faster steps
  await until(S(47));
  await go(...say('MORE STEPS: w → 2, LOSS → 0', C.green));
  for (let k = 4; k <= 8; k++) {
    const w = 2 - 2 * Math.pow(0.5, k), loss = lossOf(w);
    await go(...setW(Math.round(w * 1000) / 1000), ...moveDot(w), ...val(1, 0, nv(w), C.amber), ...setOut([2 + w, 2 - w, 2 + w, 2 - w]),
      ...fbox([`step ${k}: w ≈ ${w.toFixed(3)}`, [`loss ≈ ${loss.toFixed(4)}`, C.pink]], C.pink));
  }

  // 48 at w = 2 both hidden rows are predicted
  await until(S(48));
  await go(...setW(2), ...moveDot(2), ...N.value(1, 0, '2', C.amber), ...setOut(A), ...fbox(['w = 2', ['A top row: 4, 0', C.green]]), ...say('AT w = 2: HIDDEN ROWS CORRECT', C.green));
  const inB = pic(DB, INP, s0, ns), tgtB = pic([0, 4], TGT, s0, ns);
  await until(S(48) + 2.4);
  await go(out(inPic.group), fade(inB.group), out(tgtPic.group), fade(tgtB.group), ...DB.map((v, i) => N.value(0, i, String(v), C.violet)).flat(),
    ...N.value(1, 0, '−2', C.amber), ...setOut(B), ...fbox(['w = 2', 'A top row: 4, 0', ['B top row: 0, 4', C.green]]));
  inPic = inB; tgtPic = tgtB;

  // 49-50 the loss formula uses only hidden squares
  await until(S(49));
  await go(...fbox(['loss = sum of', '(hidden − predicted)²', '÷ number of hidden squares'], C.pink), ...say('THE LOSS FORMULA', C.pink));
  const botBox = rect(2 * s0 + 0.14, s0 + 0.12, OUTP[0], OUTP[1] - s0 / 2, C.muted);
  const notIn = label('not in loss', P ? 17 : 15, C.muted, OUTP[0], P ? OUTP[1] - s0 - 0.25 : OUTP[1] - s0 - 0.55);
  await until(S(50));
  await go(fade(botBox), fade(notIn), ...say('VISIBLE SQUARES: NOT IN THE LOSS', C.muted));

  // 51-54
  const bottom = rect(2 * s0 + 0.12, s0 + 0.1, INP[0], INP[1] - s0 / 2, C.green);
  const topOut = rect(2 * s0 + 0.12, s0 + 0.1, OUTP[0], OUTP[1] + s0 / 2, C.green);
  await until(S(51));
  await go(out(botBox), out(notIn), fade(bottom), ...say('LEARNS HOW PARTS RELATE', C.green));
  await go(...fwd(0, C.green), fade(topOut));
  await until(S(52));
  await go(out(bottom), out(topOut), ...say('USEFUL REPRESENTATIONS, NO LABELS', C.green));
  await until(S(53));
  await go(...say('NO LINK TO THE HIDDEN PART: ONLY A GUESS', C.pink));
  await until(S(54));
  await go(mark(N.nodes[1][0], C.green), ...say('THE DATA MAKES ITS OWN EXERCISES', C.green));
}

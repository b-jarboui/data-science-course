// 18.1.2 Denoising autoencoders: rebuilding clean pictures from damaged ones.
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

  // a four-square teaching picture (TL, TR, BL, BR); brightness 0 = black, 4 = white
  const grey = v => { const g = Math.round(14 + Math.max(0, Math.min(4, v)) / 4 * 230); const h = g.toString(16).padStart(2, '0'); return '#' + h + h + h; };
  function pic(vals, [x, y], s, size, showNums = true) {
    const off = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
    const cells = [], nums = [];
    vals.forEach((v, k) => {
      const c = new M.Square({ sideLength: s, color: C.muted, strokeWidth: 2 });
      c.setFill(grey(v), 1); c.moveTo([x + off[k][0] * s / 2, y + off[k][1] * s / 2, 0]); cells.push(c);
      if (showNums) nums.push(label(nv(v), nv(v).length > 3 ? Math.max(P ? 15 : 12, size * 0.8) : size, v >= 2 ? C.bg : C.ink, x + off[k][0] * s / 2, y + off[k][1] * s / 2, true));
    });
    return { cells, nums, group: new M.VGroup(...cells, ...nums) };
  }

  // 0-1 museum photos with grey patches
  const vase = (x, y, rb, tag) => {
    const card = new M.RoundedRectangle({ width: 1.5, height: 1.8, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
    card.setFill(C.card, 0.95); card.moveTo([x, y, 0]);
    const body = new M.Circle({ radius: rb, color: '#c08a5a', strokeWidth: 2 }); body.setFill('#c08a5a', 0.75); body.moveTo([x, y - 0.12, 0]);
    const neck = new M.Rectangle({ width: 0.22, height: 0.36, color: '#c08a5a', strokeWidth: 2 }); neck.setFill('#c08a5a', 0.75); neck.moveTo([x, y + rb + 0.02, 0]);
    const rim = new M.Rectangle({ width: 0.42, height: 0.08, color: '#c08a5a', strokeWidth: 2 }); rim.setFill('#c08a5a', 0.9); rim.moveTo([x, y + rb + 0.22, 0]);
    const patch = new M.Rectangle({ width: 1.3, height: 0.62, color: grey(2), strokeWidth: 0 }); patch.setFill(grey(2), 1); patch.moveTo([x, y + 0.42, 0]);
    return new M.VGroup(card, body, neck, rim, patch, label(tag, 16, C.muted, x, y - 0.72, true));
  };
  const photoPos = P ? [[-1.3, 0.55], [1.3, 0.55], [-1.3, -1.65], [1.3, -1.65]] : [[-4.5, -0.4], [-1.5, -0.4], [1.5, -0.4], [4.5, -0.4]];
  const photos = ['A', 'B', 'C', 'D'].map((t, i) => vase(photoPos[i][0], photoPos[i][1], [0.36, 0.3, 0.4, 0.32][i], t));

  await until(S(0));
  await go(cascade(photos.map(fade), 1.2), ...say('GREY PATCHES COVER PARTS', C.muted));
  await until(S(1));
  await go(...say('RECOVER THE MISSING PARTS?', C.amber), ...fbox(['no one describes the vessels']));

  // 2-9 clean and damaged pictures
  const big = P ? 0.8 : 0.7;
  const pos = P ? { A: [-1.5, 0.2], B: [1.5, 0.2], dA: [-1.5, -2.6], dB: [1.5, -2.6] }
                : { A: [-5.6, -0.5], B: [-1.4, -0.5], dA: [-3.6, -0.5], dB: [0.6, -0.5] };
  const cA = pic(A, pos.A, big, 22, false), cB = pic(B, pos.B, big, 22, false);
  const nA = pic(A, pos.A, big, 22).nums, nB = pic(B, pos.B, big, 22).nums;
  const dA = pic(DA, pos.dA, big, 22, false), dB = pic(DB, pos.dB, big, 22, false);
  const ndA = pic(DA, pos.dA, big, 22).nums, ndB = pic(DB, pos.dB, big, 22).nums;
  const above = (p, s, c) => label(s, 16, c, p[0], p[1] + big + 0.32);
  const tA = above(pos.A, 'A', C.muted), tB = above(pos.B, 'B', C.muted);
  await until(S(2));
  await go(...photos.map(out), ...fbox([]), fade(cA.group), fade(cB.group), fade(tA), fade(tB), ...say('VESSEL A AND VESSEL B'));
  await until(S(3));
  await go(cascade(nA.map(fade), 1.4), ...say('A: 4, 0, 4, 0'));
  await until(S(4));
  await go(cascade(nB.map(fade), 1.4), ...say('B: 0, 4, 0, 4'));
  const rows = [pos.A, pos.B].flatMap(p => [rect(2 * big + 0.1, big + 0.06, p[0], p[1] + big / 2, C.cyan, 3), rect(2 * big + 0.1, big + 0.06, p[0], p[1] - big / 2, C.violet, 3)]);
  await until(S(5));
  await go(cascade(rows.map(fade), 0.8), ...say('TOP ROW = BOTTOM ROW', C.violet));
  await until(S(6));
  await go(...rows.map(out), fade(dA.group), fade(dB.group), ...say('GREY PATCH ON THE TOP ROW', C.muted));
  await until(S(7));
  await go(cascade(ndA.map(fade), 1.4), ...say('GREY = 2 · A: 2, 2, 4, 0'));
  await until(S(8));
  await go(cascade(ndB.map(fade), 1.4), ...say('B: 2, 2, 0, 4'));
  const tags = [above(pos.A, 'A clean', C.cyan), above(pos.B, 'B clean', C.cyan), above(pos.dA, 'A damaged', C.muted), above(pos.dB, 'B damaged', C.muted)];
  await until(S(9));
  await go(out(tA), out(tB), cascade(tags.map(fade), 0.8), ...say('ORIGINALS BESIDE DAMAGED'));
  await until(S(10));
  await go(...say('REPAIR, THEN COMPARE WITH THE ORIGINAL', C.amber));
  await until(S(11));
  await go(...say('TEACH A NETWORK THE SAME WAY', C.violet));
  const patches = [pos.dA, pos.dB].map(p => rect(2 * big + 0.12, big + 0.1, p[0], p[1] + big / 2, C.pink, 4));
  await until(S(12));
  await go(cascade(patches.map(fade), 0.6), ...say('NOISE = DAMAGE IN DATA', C.pink));
  await until(S(13));
  await go(...say('DENOISING = REMOVING NOISE', C.green));
  await until(S(14));
  await go(...patches.map(out), ...say('DENOISING AUTOENCODER', C.green));

  // 15-18 network, damaged input, clean target
  const R = P ? 0.32 : 0.34;
  const NC = P ? [0, -1.5, 0] : [CX, -0.5, 0];
  const NW = P ? 4.6 : 4.4, NH = 2.4;
  const N = net({ layers: [4, 1, 4], center: NC, width: NW, height: NH, r: R });
  const s0 = P ? 0.72 : 0.6, ns = P ? 18 : 15;
  // numbers inside neurons: 4-character values ('3.99') are shrunk to stay inside the circle
  const val = (l, i, s, col) => { const a = N.value(l, i, s, col); if (String(s).length > 3 && a[0].mobject) a[0].mobject.scale(0.85); return a; };
  const tg = P ? 17 : 15;
  const INP = P ? [-2.3, 0.95] : [CX - NW / 2 - 1.45, NC[1]];
  const OUTP = P ? [2.3, 0.95] : [CX + NW / 2 + 1.45, -1.35];
  const TGT = P ? [0, 0.95] : [CX + NW / 2 + 1.45, 0.45];
  const pulse = (l, col, backward) => {
    const ls = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => { const a = N.pos(l, i), b = N.pos(l + 1, j);
      const s = [a[0] + R, a[1], 0], e = [b[0] - R, b[1], 0];
      ls.push(new M.Line({ start: backward ? e : s, end: backward ? s : e, color: col, strokeWidth: 5 })); }));
    trash.push(...ls);
    return [new M.LaggedStart(ls.map(f => new M.ShowPassingFlash(f, { timeWidth: 0.4 })), { lagRatio: 0.08 })];
  };
  const fwd = (l, col = C.amber) => pulse(l, col, false), back = (l) => pulse(l, C.violet, true);

  await until(S(15));
  await go(...[cA, cB, dA, dB].map(p => out(p.group)), ...[...nA, ...nB, ...ndA, ...ndB, ...tags].map(out),
    cascade(N.nodes.flat().map(fade), 1.0), ...say('A FRESH NETWORK: 4 · 1 · 4'));
  await go(cascade(N.edges.flat(2).map(e => new M.Create(e, { runTime: 0.3 })), 1.2));

  let inPic = pic(DA, INP, s0, ns);
  const inTag = label('damaged input', tg, C.muted, INP[0], INP[1] + s0 + 0.28);
  await until(S(16));
  await go(fade(inPic.group), fade(inTag), ...DA.map((v, i) => N.value(0, i, String(v), C.violet)).flat(), ...fwd(0, C.violet), ...say('INPUT: THE DAMAGED PICTURE'));

  const tgtPic = pic(A, TGT, s0, ns);
  const tgtTag = label('target', tg, C.cyan, TGT[0], TGT[1] + s0 + 0.28);
  await until(S(17));
  await go(fade(tgtPic.group), fade(tgtTag), ...say('TARGET = THE CLEAN ORIGINAL', C.cyan));

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
  await until(S(18));
  await go(fade(encTag), fade(decTag), ...setW(0), ...fbox([['w = 0 again', C.amber]]), ...say('ONE ADJUSTABLE WEIGHT w', C.amber));

  // 19-26 forward pass
  const colBox = (side, color) => rect(s0 + 0.12, 2 * s0 + 0.12, INP[0] + side * s0 / 2, INP[1], color);
  const boxL = colBox(-1, C.cyan), boxR = colBox(1, C.pink);
  await until(S(19));
  await go(fade(boxL), ...fbox(['left: 2 + 4 = 6']), ...say('INSIDE THE ENCODER'));
  await until(S(20));
  await go(out(boxL), fade(boxR), ...fbox(['left: 2 + 4 = 6', 'right: 2 + 0 = 2']));
  await until(S(21));
  await go(out(boxR), ...fbox(['left − right', ['6 − 2 = 4', C.amber]]));
  await until(S(22));
  await go(...fbox(['6 − 2 = 4', ['4 ÷ 4 = 1', C.amber]]));
  await until(S(23));
  await go(...fwd(0), ...N.value(1, 0, '0', C.amber), ...fbox(['1 × w = 1 × 0', ['middle = 0', C.amber]]));

  let outPic = null;
  const outTag = label('rebuilt', tg, C.amber, OUTP[0], P ? OUTP[1] + s0 + 0.28 : OUTP[1] - s0 - 0.28);
  const setOut = vals => {
    const p = pic(vals, OUTP, s0, ns);
    const a = outPic ? [out(outPic.group)] : [fade(outTag)]; a.push(fade(p.group)); outPic = p;
    vals.forEach((v, i) => a.push(...val(2, i, nv(v), C.amber)));
    return a;
  };
  await until(S(24));
  await go(...[0, 2].map(j => N.weight(1, 0, j, 1)).flat(), ...fbox([['left: 2 + middle', C.cyan]]), ...say('THE DECODER', C.amber));
  await until(S(25));
  await go(...[1, 3].map(j => N.weight(1, 0, j, -1)).flat(), ...fbox([['left: 2 + middle', C.cyan], ['right: 2 − middle', C.pink]]));
  await until(S(26));
  await go(...fwd(1), ...setOut([2, 2, 2, 2]), ...say('REBUILT: ALL SQUARES 2', C.amber));

  // 27-31 loss against the clean target
  const cmp = [rect(2 * s0 + 0.16, 2 * s0 + 0.16, TGT[0], TGT[1], C.cyan), rect(2 * s0 + 0.16, 2 * s0 + 0.16, OUTP[0], OUTP[1], C.amber)];
  await until(S(27));
  await go(...cmp.map(fade), ...say('COMPARE WITH THE CLEAN PICTURE', C.cyan));
  await until(S(28));
  await go(...cmp.map(out), ...fbox(['4 − 2 = 2    0 − 2 = −2', '4 − 2 = 2    0 − 2 = −2']), ...say('EVERY SQUARE OFF BY 2', C.pink));
  await until(S(29));
  await go(...fbox(['2 × 2 = 4 each square', '16 ÷ 4 = 4', ['mean = 4', C.amber]]));
  await until(S(30));
  await go(...fbox([['loss = 4', C.pink]], C.pink), ...say('LOSS: HOW POORLY WE REBUILD', C.pink));
  await until(S(31));
  await go(...fbox(['vessel A: loss 4', 'vessel B: loss 4', ['both pictures: loss 4', C.pink]], C.pink));

  // 32-37 the loss curve over weights, slope, learning rate
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
  let dot = new M.Dot({ point: cp(0, 4), radius: 0.08, color: C.amber });
  const moveDot = w => { const d = new M.Dot({ point: cp(w, lossOf(w)), radius: 0.08, color: C.amber }); const trail = new M.Dot({ point: cp(w, lossOf(w)), radius: 0.04, color: C.ink });
    const a = [new M.Transform(dot, d), fade(trail)]; return a; };
  await until(S(32));
  await go(new M.Create(axes), cascade(curve.map(c => new M.Create(c, { runTime: 0.1 })), 1.2), fade(dot), ...say('LOSS FOR DIFFERENT WEIGHTS', C.pink));
  const tangent = new M.Line({ start: cp(0, 4), end: cp(0.6, 4 - 4 * 0.6), color: C.violet, strokeWidth: 4 });
  await until(S(33));
  await go(new M.Create(tangent), ...fbox([['at w = 0: slope = −4', C.violet]], C.violet), ...say('SLOPE OF THE CURVE', C.violet));
  await until(S(34));
  await go(...fbox(['slope below 0', ['→ increase w a little', C.green]], C.violet), ...say('MORE WEIGHT, LESS LOSS', C.green));
  await until(S(35));
  await go(out(tangent), ...fbox([['learning rate = 1/4', C.green]], C.green), ...say('LEARNING RATE = STEP SIZE', C.green));
  await until(S(36));
  await go(...back(1), ...fbox(['−4 × 1/4 = −1']), ...say('STEP 1', C.amber));
  await until(S(37));
  await go(...back(0), ...setW(1), ...moveDot(1), ...fbox(['w = 0 − (−1)', ['w = 1', C.amber]]));

  // 38-47 three slow steps
  const steps = [
    { w: 1, o: [3, 1, 3, 1], loss: 1, diff: 1 },
    { slope: -2, d: 0.5, w: 1.5, o: [3.5, 0.5, 3.5, 0.5], loss: 0.25, prev: 1 },
    { slope: -1, d: 0.25, w: 1.75, o: [3.75, 0.25, 3.75, 0.25], loss: 0.0625, prev: 0.25 },
  ];
  await until(S(38));
  await go(...fwd(0), ...N.value(1, 0, '1', C.amber), ...fbox(['1 × w = 1 × 1', ['middle = 1', C.amber]]));
  await go(...fwd(1), ...setOut(steps[0].o), ...say('REBUILT: 3, 1, 3, 1', C.amber));
  await until(S(39));
  await go(...fbox(['each square off by 1', ['loss: 4 → 1', C.pink]], C.pink));
  const beats = [[40, 41, 42, 43], [44, 45, 46, 47]];
  for (let k = 1; k < 3; k++) {
    const st = steps[k], [b1, b2, b3, b4] = beats[k - 1];
    await until(S(b1));
    await go(...back(1), ...fbox([`at w = ${fmt(steps[k - 1].w)}: slope = ${fmt(st.slope)}`, `${fmt(st.slope)} × 1/4 = ${fmt(st.slope / 4)}`, [`w + ${fmt(st.d)}`, C.green]]), ...say('STEP ' + (k + 1), C.amber));
    await until(S(b2));
    await go(...back(0), ...setW(st.w), ...moveDot(st.w), ...fbox([`w = ${fmt(st.w)}`, ['middle = ' + fmt(st.w), C.amber]]));
    await go(...fwd(0), ...val(1, 0, nv(st.w), C.amber));
    await until(S(b3));
    await go(...fwd(1), ...setOut(st.o), ...say('REBUILT: ' + st.o.map(fmt).join(', '), C.amber));
    await until(S(b4));
    await go(...fbox([`each square off by ${fmt(4 - st.o[0])}`, [`loss: ${fmt(st.prev)} → ${fmt(st.loss)}`, C.pink]], C.pink));
  }

  // 48 faster steps
  await until(S(48));
  await go(...say('MORE STEPS: w → 2, LOSS → 0', C.green));
  for (let k = 4; k <= 8; k++) {
    const w = 2 - 2 * Math.pow(0.5, k), m = w, loss = lossOf(w);
    await go(...setW(Math.round(w * 1000) / 1000), ...moveDot(w), ...val(1, 0, nv(m), C.amber), ...setOut([2 + m, 2 - m, 2 + m, 2 - m]),
      ...fbox([`step ${k}: w ≈ ${w.toFixed(3)}`, [`loss ≈ ${loss.toFixed(4)}`, C.pink]], C.pink));
  }

  // 49 formula
  await until(S(49));
  await go(...fbox(['loss = sum of', '(clean − rebuilt)²', '÷ number of squares'], C.pink), ...say('THE LOSS FORMULA', C.pink));

  // 50 at w = 2 both vessels come back clean
  await until(S(50));
  await go(...setW(2), ...moveDot(2), ...N.value(1, 0, '2', C.amber), ...setOut(A), ...fbox(['w = 2', ['A rebuilt: 4, 0, 4, 0', C.cyan]]), ...say('AT w = 2: CLEAN PICTURES', C.green));
  const inB = pic(DB, INP, s0, ns), tgtB = pic(B, TGT, s0, ns);
  await until(S(50) + 2.8);
  await go(out(inPic.group), fade(inB.group), out(tgtPic.group), fade(tgtB.group), ...DB.map((v, i) => N.value(0, i, String(v), C.violet)).flat(),
    ...N.value(1, 0, '−2', C.amber), ...setOut(B), ...fbox(['w = 2', 'A rebuilt: 4, 0, 4, 0', ['B rebuilt: 0, 4, 0, 4', C.cyan]]));
  inPic = inB;

  // 51 bottom row recovers the top row
  const bottom = rect(2 * s0 + 0.12, s0 + 0.1, INP[0], INP[1] - s0 / 2, C.green);
  const topOut = rect(2 * s0 + 0.12, s0 + 0.1, OUTP[0], OUTP[1] + s0 / 2, C.green);
  await until(S(51));
  await go(fade(bottom), ...say('BOTTOM ROW → MISSING TOP ROW', C.green));
  await go(fade(topOut));
  await until(S(52));
  await go(out(bottom), out(topOut), ...say('REPAIR + KEEP USEFUL INFORMATION', C.green));

  // 53 all grey: nothing to recover
  const allGrey = pic([2, 2, 2, 2], INP, s0, ns);
  await until(S(53));
  await go(out(inPic.group), fade(allGrey.group), ...[0, 1, 2, 3].map(i => N.value(0, i, '2', C.violet)).flat(), ...say('ALL GREY: WHICH VESSEL?', C.pink));
  await go(...fwd(0), ...N.value(1, 0, '0', C.amber), ...setOut([2, 2, 2, 2]), ...fbox(['all grey in', 'middle = 0', ['rebuilt: all 2', C.pink]], C.pink));
  await until(S(54));
  await go(mark(N.nodes[1][0], C.green), ...say('LEARN CLEAN FROM DAMAGED', C.green));
}

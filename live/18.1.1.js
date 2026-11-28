// 18.1.1 Autoencoders: learning to rebuild a picture.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play, net } = L;
  const A = [4, 0, 4, 0], B = [0, 4, 0, 4];
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
      if (showNums) nums.push(label(nv(v), nv(v).length > 3 ? size * 0.8 : size,v >= 2 ? C.bg : C.ink, x + off[k][0] * s / 2, y + off[k][1] * s / 2, true));
    });
    return { cells, nums, group: new M.VGroup(...cells, ...nums) };
  }

  // 0-1 museum photos
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
  await go(cascade(photos.map(fade), 1.2), ...say('MUSEUM: THOUSANDS OF POTTERY PHOTOS'));

  await until(S(1));
  await go(...say('DESCRIBE EACH WITH FEWER NUMBERS?', C.amber));
  await go(...fbox(['no labels given']));

  // 2-6 the two teaching pictures
  const big = P ? 0.9 : 0.8;
  const posA = P ? [-1.5, -0.6] : [-4.5, -0.4], posB = P ? [1.5, -0.6] : [-0.7, -0.4];
  const picA = pic([4, 0, 4, 0], posA, big, 24, false), picB = pic([0, 4, 0, 4], posB, big, 24, false);
  const numsA = pic(A, posA, big, 24).nums, numsB = pic(B, posB, big, 24).nums;
  const tagA = label('vessel A', 18, C.muted, posA[0], posA[1] + big + 0.35), tagB = label('vessel B', 18, C.muted, posB[0], posB[1] + big + 0.35);
  await until(S(2));
  await go(...photos.map(out), ...fbox([]), fade(picA.group), fade(picB.group), fade(tagA), fade(tagB), ...say('TWO TEACHING PICTURES: A AND B'));

  const SY = P ? -2.9 : -2.45, sx = P ? 0.85 : 0.75;
  const scale = [0, 1, 2, 3, 4].map(v => {
    const c = new M.Square({ sideLength: 0.45, color: C.muted, strokeWidth: 2 }); c.setFill(grey(v), 1); c.moveTo([CX + (v - 2) * sx + (P ? 0 : 1.9), SY, 0]);
    return new M.VGroup(c, label(String(v), 16, v >= 2 ? C.bg : C.ink, CX + (v - 2) * sx + (P ? 0 : 1.9), SY, true));
  });
  const scaleL = label('black', P ? 17 : 15, C.muted, CX + (P ? 0 : 1.9) - 2 * sx, SY - 0.45), scaleR = label('white', P ? 17 : 15, C.muted, CX + (P ? 0 : 1.9) + 2 * sx, SY - 0.45);
  await until(S(3));
  await go(cascade([...scale, scaleL, scaleR].map(fade)), ...say('4 SQUARES · BRIGHTNESS 0 TO 4'));

  await until(S(4));
  await go(cascade(numsA.map(fade), 1.6), ...say('A: 4, 0, 4, 0'));
  await until(S(5));
  await go(cascade(numsB.map(fade), 1.6), ...say('B: 0, 4, 0, 4'));

  await until(S(6));
  await go(mark(picA.group, C.cyan), mark(picB.group, C.cyan), ...say('DATA = THE BRIGHTNESS NUMBERS'));

  await until(S(7));
  await go(...say('4 NUMBERS → 1 NUMBER → REBUILD', C.amber));

  // 8-16 the network
  const R = P ? 0.32 : 0.34;
  const NC = P ? [0, -1.5, 0] : [CX, -0.5, 0];
  const NW = P ? 4.6 : 4.4, NH = P ? 2.4 : 2.4;
  const N = net({ layers: [4, 1, 4], center: NC, width: NW, height: NH, r: R });
  const s0 = P ? 0.66 : 0.6, ns = P ? 17 : 16;
  const INP = P ? [-2.3, 0.95] : [CX - NW / 2 - 1.45, NC[1]];
  const OUTP = P ? [2.3, 0.95] : [CX + NW / 2 + 1.45, NC[1]];
  // outline around one column of the input picture (never re-wrap the cells)
  const colBox = (side, color = C.amber) => {
    const r = new M.Rectangle({ width: s0 + 0.12, height: 2 * s0 + 0.12, color, strokeWidth: 4 });
    return r.moveTo([INP[0] + side * s0 / 2, INP[1], 0]);
  };
  const inPic = pic(A, INP, s0, ns);
  // forward signal: a bright pulse on fresh lines (the weight lines keep their colours)
  const fwd = (l, col = C.amber) => {
    const ls = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => { const a = N.pos(l, i), b = N.pos(l + 1, j);
      ls.push(new M.Line({ start: [a[0] + R, a[1], 0], end: [b[0] - R, b[1], 0], color: col, strokeWidth: 5 })); }));
    trash.push(...ls); return [new M.LaggedStart(ls.map(f => new M.ShowPassingFlash(f, { timeWidth: 0.4 })), { lagRatio: 0.08 })];
  };
  const inTag = label('original', P ? 17 : 15, C.muted, INP[0], INP[1] + s0 + 0.28);
  const outTag = label('rebuilt', P ? 17 : 15, C.amber, OUTP[0], OUTP[1] + s0 + 0.28);

  await until(S(8));
  await go(out(picA.group), out(picB.group), ...numsA.map(out), ...numsB.map(out), out(tagA), out(tagB),
    ...[...scale, scaleL, scaleR].map(out), cascade(N.nodes.flat().map(fade), 1.4), ...say('4 CIRCLES · 1 · 4 CIRCLES'));

  await until(S(9));
  await go(cascade(N.nodes.flat().map(n => mark(n, C.cyan)), 1.4), ...say('EACH CIRCLE = A NEURON'));

  await until(S(10));
  await go(cascade(N.edges.flat(2).map(e => new M.Create(e, { runTime: 0.4 })), 1.4), ...say('LINES CARRY NUMBERS · WEIGHTS'));

  await until(S(11));
  await go(...say('NEURAL NETWORK', C.violet));

  await until(S(12));
  await go(fade(inPic.group), fade(inTag), ...A.map((v, i) => N.value(0, i, String(v), C.violet)).flat(), ...say('INPUT: VESSEL A'));

  const tagY = P ? -3.42 : -2.25;
  const encTag = label('encoder: 4 → 1', P ? 18 : 16, C.cyan, (N.pos(0, 0)[0] + N.pos(1, 0)[0]) / 2, tagY);
  const decTag = label('decoder: 1 → 4', P ? 18 : 16, C.amber, (N.pos(1, 0)[0] + N.pos(2, 0)[0]) / 2, tagY);
  const neck = label('bottleneck', P ? 17 : 15, C.violet, N.pos(1, 0)[0], N.pos(1, 0)[1] + R + 0.42);
  await until(S(13));
  await go(fade(encTag), ...fwd(0, C.cyan), ...say('ENCODER: 4 NUMBERS → 1'));
  await until(S(14));
  await go(fade(decTag), ...fwd(1), ...say('DECODER: 1 → 4 NUMBERS', C.amber));
  await until(S(15));
  await go(fade(neck), mark(N.nodes[1][0], C.violet), ...say('BOTTLENECK = NARROW NECK', C.violet));
  await until(S(16));
  await go(...say('AUTOENCODER: REBUILDS ITS OWN INPUT', C.green));

  // 17-22 forward pass at w = 0
  const wY = P ? -3.95 : -2.68;
  let wTag = null;
  const setW = w => {
    const t = label('w = ' + fmt(w), P ? 18 : 16, C.amber, encTag.getCenter()[0], wY, true);
    const a = wTag ? [out(wTag)] : []; a.push(fade(t)); wTag = t;
    [0, 1, 2, 3].forEach(i => a.push(...N.weight(0, i, 0, (i % 2 ? -1 : 1) * w)));
    return a;
  };
  await until(S(17));
  await go(...setW(0), ...say('ONE ADJUSTABLE WEIGHT w', C.amber), ...fbox([['w = 0 at the start', C.amber]]));

  await until(S(18));
  const boxL = colBox(-1, C.cyan), boxR = colBox(1, C.pink);
  await go(fade(boxL), ...fbox(['left: 4 + 4 = 8']), ...say('INSIDE THE ENCODER'));
  await until(S(19));
  await go(out(boxL), fade(boxR), ...fbox(['left: 4 + 4 = 8', 'right: 0 + 0 = 0']));
  await until(S(20));
  await go(out(boxR), ...fbox(['left − right', ['8 − 0 = 8', C.amber]]));
  await until(S(21));
  await go(...fbox(['8 − 0 = 8', ['8 ÷ 4 = 2', C.amber]]));
  await until(S(22));
  await go(...fbox(['8 ÷ 4 = 2', '2 × w = 2 × 0', ['middle = 0', C.amber]]), ...N.value(1, 0, '0', C.amber), mark(N.nodes[1][0]));

  // 23-25 decoder
  let outPic = null;
  const setOut = (vals, oneDec = false) => {
    const shown = oneDec ? vals.map(v => Math.round(v * 10) / 10) : vals;
    const p = pic(shown, OUTP, s0, ns);
    const a = outPic ? [out(outPic.group)] : [fade(outTag)]; a.push(fade(p.group)); outPic = p;
    shown.forEach((v, i) => a.push(...N.value(2, i, oneDec ? v.toFixed(1) : nv(v), C.amber)));
    return a;
  };
  await until(S(23));
  await go(...fbox(['start: 2 for every square']), ...say('DECODER STARTS AT 2', C.amber));
  await until(S(24));
  await go(...[0, 1, 2, 3].map(j => N.weight(1, 0, j, j % 2 ? -1 : 1)).flat(), ...fbox([['left: 2 + middle', C.cyan], ['right: 2 − middle', C.pink]]));
  await until(S(25));
  await go(...fwd(1), ...setOut([2, 2, 2, 2]), ...fbox(['middle = 0', ['every square: 2', C.amber]]), ...say('REBUILT: ALL SQUARES 2', C.amber));

  // 26-31 loss
  await until(S(26));
  const cmpA = new M.Rectangle({ width: 2 * s0 + 0.16, height: 2 * s0 + 0.16, color: C.cyan, strokeWidth: 4 }).moveTo([INP[0], INP[1], 0]);
  const cmpB = new M.Rectangle({ width: 2 * s0 + 0.16, height: 2 * s0 + 0.16, color: C.amber, strokeWidth: 4 }).moveTo([OUTP[0], OUTP[1], 0]);
  await go(fade(cmpA), fade(cmpB), ...say('COMPARE SQUARE BY SQUARE'));
  await until(S(26) + 2.5);
  await go(out(cmpA), out(cmpB));
  await until(S(27));
  await go(...fbox(['4 − 2 = 2    0 − 2 = −2', '4 − 2 = 2    0 − 2 = −2']), ...say('EVERY SQUARE OFF BY 2', C.pink));
  await until(S(28));
  await go(...fbox(['2 × 2 = 4', '(−2) × (−2) = 4', ['4 for every square', C.amber]]), ...say('SQUARING: NUMBER × ITSELF'));
  await until(S(29));
  await go(...fbox(['4 + 4 + 4 + 4 = 16', '16 ÷ 4 = 4', ['mean = 4', C.amber]]));
  await until(S(30));
  await go(...fbox([['loss = 4', C.pink]], C.pink), ...say('LOSS = HOW POORLY WE REBUILD', C.pink));
  await until(S(31));
  await go(...fbox(['vessel A: loss 4', 'vessel B: loss 4', ['both pictures: loss 4', C.pink]], C.pink));

  // 32-36 slope and learning rate, loss chart
  const CH = P ? { x: 0, y: -5.3, w: 5, h: 1.2 } : { x: 4.3, y: -1.95, w: 3.4, h: 1.3 };
  const x0 = CH.x - CH.w / 2, y0 = CH.y - CH.h / 2;
  const cpt = (k, loss) => [x0 + 0.2 + k * (CH.w - 0.4) / 8, y0 + loss / 4 * CH.h, 0];
  const axes = new M.VGroup(
    new M.Line({ start: [x0, y0, 0], end: [x0 + CH.w, y0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [x0, y0, 0], end: [x0, y0 + CH.h + 0.1, 0], color: C.muted, strokeWidth: 2 }),
    label('loss', P ? 16 : 14, C.pink, x0 + 0.3, y0 + CH.h + 0.22), label('step', P ? 16 : 14, C.muted, x0 + CH.w - 0.25, y0 - 0.22));
  let lastPt = cpt(0, 4);
  const pt = (k, loss) => { const p = cpt(k, loss); const d = new M.Dot({ point: p, radius: 0.06, color: C.pink }); return d; };
  const seg = (k, loss) => { const p = cpt(k, loss); const l = new M.Line({ start: lastPt, end: p, color: C.pink, strokeWidth: 3 }); lastPt = p; return l; };

  await until(S(32));
  await go(...say('CHANGE w TO LOWER THE LOSS', C.amber), mark(wTag));
  await until(S(33));
  await go(new M.Create(axes), fade(pt(0, 4)), ...say('SLOPE = HOW FAST LOSS CHANGES', C.violet));
  await until(S(34));
  await go(...fbox(['at w = 0: slope = −8', ['→ increase w', C.green]], C.violet));
  await until(S(35));
  await go(...fbox([['learning rate = 1/16', C.green]], C.green), ...say('LEARNING RATE = STEP SIZE', C.green));
  await until(S(36));
  await go(...fbox(['new w = old w', '  − rate × slope']));

  // backward learning signal
  const back = (l, col = C.violet) => {
    const ls = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => { const a = N.pos(l, i), b = N.pos(l + 1, j);
      ls.push(new M.Line({ start: [b[0] - R, b[1], 0], end: [a[0] + R, a[1], 0], color: col, strokeWidth: 5 })); }));
    trash.push(...ls); return [new M.LaggedStart(ls.map(f => new M.ShowPassingFlash(f, { timeWidth: 0.4 })), { lagRatio: 0.08 })];
  };
  const steps = [
    { slope: -8, d: 0.5, w: 0.5, m: 1, o: [3, 1, 3, 1], loss: 1, prev: 4 },
    { slope: -4, d: 0.25, w: 0.75, m: 1.5, o: [3.5, 0.5, 3.5, 0.5], loss: 0.25, prev: 1 },
    { slope: -2, d: 0.125, w: 0.875, m: 1.75, o: [3.75, 0.25, 3.75, 0.25], loss: 0.0625, prev: 0.25 },
  ];
  const beats = [[37, 38, 39, 40], [41, 42, 43, 44], [45, 46, 47, 48]];
  for (let k = 0; k < 3; k++) {
    const st = steps[k], [b1, b2, b3, b4] = beats[k];
    const pw = k ? steps[k - 1].w : 0;
    await until(S(b1));
    if (k === 0) {
      await go(...back(1), ...fbox(['w = 0 − (1/16) × (−8)', '  = 0 + 0.5', ['w = 0.5', C.amber]]), ...say('STEP 1', C.amber));
      await go(...back(0), ...setW(st.w));
    } else {
      await go(...back(1), ...fbox([`slope = ${fmt(st.slope)}`, `w + ${fmt(st.d)}`]), ...say('STEP ' + (k + 1), C.amber));
    }
    await until(S(b2));
    if (k === 0) await go(...fwd(0), ...N.value(1, 0, nv(st.m), C.amber), ...fbox([`2 × ${fmt(st.w)} = ${fmt(st.m)}`, ['middle = ' + fmt(st.m), C.amber]]));
    else {
      await go(...back(0), ...setW(st.w), ...fbox([`w = ${fmt(pw)} + ${fmt(st.d)} = ${fmt(st.w)}`, ['middle = ' + fmt(st.m), C.amber]]));
      await go(...fwd(0), ...N.value(1, 0, nv(st.m), C.amber));
    }
    await until(S(b3));
    await go(...fwd(1), ...setOut(st.o), ...say('REBUILT: ' + st.o.map(fmt).join(', '), C.amber));
    await until(S(b4));
    const diff = fmt(4 - st.o[0]);
    await go(fade(seg(k + 1, st.loss)), fade(pt(k + 1, st.loss)),
      ...fbox([`each square off by ${diff}`, [`loss: ${fmt(st.prev)} → ${fmt(st.loss)}`, C.pink]], C.pink));
  }

  // 49 faster steps
  await until(S(49));
  await go(...say('MORE STEPS: w → 1, LOSS → 0', C.green));
  for (let k = 4; k <= 8; k++) {
    const w = 1 - Math.pow(0.5, k), m = 2 * w, loss = 4 * Math.pow(0.25, k);
    await go(...setW(Math.round(w * 1000) / 1000), ...N.value(1, 0, m.toFixed(1), C.amber), ...setOut([2 + m, 2 - m, 2 + m, 2 - m], true),
      fade(seg(k, loss)), fade(pt(k, loss)), ...fbox([`step ${k}: w ≈ ${w.toFixed(3)}`, [`loss ≈ ${loss.toFixed(4)}`, C.pink]], C.pink));
  }

  // 50 formula
  await until(S(50));
  await go(...fbox(['loss = sum of', '(target − rebuilt)²', '÷ number of squares'], C.pink), ...say('THE LOSS FORMULA', C.pink));

  // 51 at w = 1: A -> 2, B -> -2
  await until(S(51));
  await go(...setW(1), ...N.value(1, 0, '2', C.amber), ...setOut(A), ...fbox(['w = 1', ['A → middle 2', C.amber]]), ...say('AT w = 1: PERFECT REBUILD', C.green));
  const inB = pic(B, INP, s0, ns);
  await until(S(51) + 2.6);
  await go(out(inPic.group), fade(inB.group), ...B.map((v, i) => N.value(0, i, String(v), C.violet)).flat(), ...N.value(1, 0, '−2', C.amber),
    ...setOut(B), ...fbox(['w = 1', 'A → middle 2', ['B → middle −2', C.amber]]));

  await until(S(52));
  await go(mark(N.nodes[1][0], C.violet), ...say('REPRESENTATION: A SMALLER DESCRIPTION', C.violet));
  await until(S(53));
  await go(...say('GOOD REBUILD ≠ UNDERSTANDING', C.pink));
  await until(S(54));
  await go(mark(N.nodes[1][0], C.green), ...say('AUTOENCODER: LEARN BY REBUILDING', C.green));
}

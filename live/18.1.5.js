// 18.1.5 Embedding evaluation: testing what the frozen encoder learned.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const ORANGE = '#fb923c';
  const PILL = [CX, P ? 2.45 : 1.85, 0];
  const BOXP = P ? [0, 3.58, 0] : [5.2, 0.9, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);
  const label = (text, size, color, x, y, mono = false) => T(text, size, color, mono).moveTo([x, y, 0]);
  const fade = o => new M.FadeIn(o, { runTime: 0.3 });
  const out = o => new M.FadeOut(o, { runTime: 0.3 });
  const mark = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.5 });
  const cascade = (a, rt = 0.8) => new M.LaggedStart(a, { lagRatio: 0.12, runTime: rt });
  const trash = [];
  const go = async (...anims) => { await play(...anims); if (trash.length) { const g = trash.splice(0); await play(new M.FadeOut(new M.VGroup(...g), { runTime: 0.15 })); } };
  const fmt = n => String(Math.round(n * 10000) / 10000).replace('-', '−');
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
    const maxW = P ? FW - 1.2 : 3.5;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  const grey = v => { const g = Math.round(14 + Math.max(0, Math.min(4, v)) / 4 * 230); const h = g.toString(16).padStart(2, '0'); return '#' + h + h + h; };
  function pic(vals, [x, y], s, size) {
    const off = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
    const cells = vals.map((v, k) => { const c = new M.Square({ sideLength: s, color: C.muted, strokeWidth: 2 }); c.setFill(grey(v), 1); c.moveTo([x + off[k][0] * s / 2, y + off[k][1] * s / 2, 0]); return c; });
    const nums = vals.map((v, k) => label(String(v), size, v >= 2 ? C.bg : C.ink, x + off[k][0] * s / 2, y + off[k][1] * s / 2, true));
    return { cells: new M.VGroup(...cells), nums: new M.VGroup(...nums) };
  }

  // 0-1
  const vase = (x, y, rb, tag) => {
    const card = new M.RoundedRectangle({ width: 1.5, height: 1.8, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
    card.setFill(C.card, 0.95); card.moveTo([x, y, 0]);
    const body = new M.Circle({ radius: rb, color: '#c08a5a', strokeWidth: 2 }); body.setFill('#c08a5a', 0.75); body.moveTo([x, y - 0.12, 0]);
    const neck = new M.Rectangle({ width: 0.22, height: 0.36, color: '#c08a5a', strokeWidth: 2 }); neck.setFill('#c08a5a', 0.75); neck.moveTo([x, y + rb + 0.02, 0]);
    const rim = new M.Rectangle({ width: 0.42, height: 0.08, color: '#c08a5a', strokeWidth: 2 }); rim.setFill('#c08a5a', 0.9); rim.moveTo([x, y + rb + 0.22, 0]);
    return new M.VGroup(card, body, neck, rim, label(tag, 16, C.muted, x, y - 0.72, true));
  };
  const ph = P ? [[-1.3, 0.55], [1.3, 0.55], [-1.3, -1.65], [1.3, -1.65]] : [[-4.5, -0.4], [-1.5, -0.4], [1.5, -0.4], [4.5, -0.4]];
  const photos = ['A', 'B', 'C', 'D'].map((t, i) => vase(ph[i][0], ph[i][1], [0.36, 0.3, 0.4, 0.32][i], t));
  await until(S(0));
  await go(cascade(photos.map(fade), 1.2), ...say('SIMILAR PICTURES PLACED NEAR'));
  await until(S(1));
  await go(...say('DID IT LEARN SOMETHING USEFUL?', C.amber));

  // 2-10 the four teaching pictures
  const VALS = [[4, 0, 4, 0], [0, 4, 0, 4], [3, 1, 3, 1], [1, 3, 1, 3]], names = ['A', 'B', 'C', 'D'];
  const s = P ? 0.5 : 0.48, ns = P ? 16 : 15;
  const PX = P ? [[-2.55, 1.6], [-0.85, 1.6], [0.85, 1.6], [2.55, 1.6]] : [[-6.0, 1.3], [-6.0, 0.1], [-6.0, -1.1], [-6.0, -2.3]];
  const pics = VALS.map((v, i) => pic(v, PX[i], s, ns));
  const tagPos = i => P ? [PX[i][0], PX[i][1] - s - 0.22] : [PX[i][0] - s - 0.25, PX[i][1]];
  const tags = names.map((n, i) => label(n, 17, C.muted, ...tagPos(i), true));
  const sB = P ? 0.72 : 0.8, PXB = P ? [[-1.3, 0.75], [1.3, 0.75], [-1.3, -2.1], [1.3, -2.1]] : [[-4.5, -0.4], [-1.5, -0.4], [1.5, -0.4], [4.5, -0.4]];
  const bigPics = VALS.map((v, i) => pic(v, PXB[i], sB, 22));
  const bigTags = names.map((n, i) => label(n, 18, C.muted, PXB[i][0], PXB[i][1] - sB - 0.3, true));
  await until(S(2));
  await go(...photos.map(out), cascade(bigPics.map(p => fade(p.cells)), 0.8), cascade(bigTags.map(fade), 0.8), ...say('OUR FOUR TEACHING PICTURES'));
  for (let i = 0; i < 4; i++) {
    await until(S(3 + i));
    await go(fade(bigPics[i].nums), ...say(`VESSEL ${names[i]}: ${VALS[i].join(', ')}`));
  }
  const frame = (i, color) => rect(2 * s + 0.14, 2 * s + 0.14, PX[i][0], PX[i][1], color, 3);
  const bigFrame = (i, color) => rect(2 * sB + 0.16, 2 * sB + 0.16, PXB[i][0], PXB[i][1], color, 4);
  const learned = [bigFrame(0, C.violet), bigFrame(1, C.violet)], unseen = [bigFrame(2, C.muted), bigFrame(3, C.muted)];
  await until(S(7));
  await go(...learned.map(fade), ...say('LEARNED FROM A AND B', C.violet));
  await until(S(8));
  await go(...unseen.map(fade), ...say('C AND D: NEVER SEEN', C.muted));
  await until(S(9));
  await go(...say('TEST WITH NEW PICTURES', C.amber));
  await until(S(10));
  await go(...learned.map(out), ...unseen.map(out), ...say('TEST THE NETWORK THE SAME WAY', C.amber));
  // the pictures move to the side to make room for the network and the map
  await go(...bigPics.map(p => out(p.cells)), ...bigPics.map(p => out(p.nums)), ...bigTags.map(out),
    ...pics.map(p => fade(p.cells)), ...pics.map(p => fade(p.nums)), ...tags.map(fade));

  // 11-14 the frozen encoder
  const R = 0.4;
  const NC = P ? [0, -0.6, 0] : [-3.2, -0.45, 0];
  const N = net({ layers: [2, 2], center: NC, width: P ? 2.6 : 2.4, height: P ? 1.2 : 1.5, r: R });
  const LW = P ? 3.9 : 3.6, edgeX = NC[0] + LW / 2 + 0.12;
  const sideLabel = (text, y) => { const t = T(text, 16, C.muted); const w = t.getWidth(); return t.moveTo([Math.min(FW / 2 - w / 2 - 0.1, edgeX + w / 2), y, 0]); };
  const inNames = [label('x1', 16, C.cyan, N.pos(0, 0)[0], N.pos(0, 0)[1] + R + 0.2, true), label('x2', 16, C.amber, N.pos(0, 1)[0], N.pos(0, 1)[1] - R - 0.2, true)];
  const outNames = [sideLabel(P ? 'right/left' : 'across', N.pos(1, 0)[1]), sideLabel('up', N.pos(1, 1)[1])];
  await until(S(11));
  await go(cascade(N.nodes.flat().map(fade), 0.8), new M.Create(N.edges[0][0][0]), new M.Create(N.edges[0][1][1]), ...inNames.map(fade), ...outNames.map(fade), ...say('THE ENCODER FROM LESSON 18.1.4'));
  const mid = i => { const a = N.pos(0, i), b = N.pos(1, i); return [(a[0] + b[0]) / 2, a[1] + (i ? -0.22 : 0.22)]; };
  const wa = label('a = 4', 16, C.cyan, ...mid(0), true), wb = label('b = 0', 16, C.amber, ...mid(1), true);
  await until(S(12));
  await go(...N.weight(0, 0, 0, 1), ...N.weight(0, 1, 1, 0), fade(wa), fade(wb), ...say('a = 4, b = 0', C.amber));
  const lockR = rect(LW, P ? 2.25 : 2.5, NC[0], NC[1], C.violet, 2);
  const frozen = label('frozen', 17, C.violet, NC[0], NC[1] + (P ? 1.3 : 1.45));
  await until(S(13));
  await go(fade(lockR), ...fbox(['weights stay fixed', ['the whole lesson', C.violet]], C.violet), ...say('NO MORE LEARNING', C.violet));
  await until(S(14));
  await go(fade(frozen), ...say('FREEZING THE NETWORK', C.violet));

  // 15-22 run each picture
  const feat = [[0.5, 1], [-0.5, 1], [0.25, 0.5], [-0.25, 0.5]];
  const emb = feat.map(f => [4 * f[0], 0]);
  const u = P ? 0.95 : 0.9, MO = P ? [0, -3.2] : [1.9, -1.3];
  const mp = (x, y) => [MO[0] + x * u, MO[1] + y * u, 0];
  const gl = [];
  for (let x = -2; x <= 2; x++) { const l = new M.Line({ start: mp(x, -1), end: mp(x, 1), color: C.grid, strokeWidth: x === 0 ? 2 : 1 }); l.setStrokeOpacity(x === 0 ? 0.9 : 0.5); gl.push(l); }
  const axis = new M.Line({ start: mp(-2.6, 0), end: mp(2.6, 0), color: C.muted, strokeWidth: 2 });
  for (const y of [-1, 1]) { const l = new M.Line({ start: mp(-2.5, y), end: mp(2.5, y), color: C.grid, strokeWidth: 1 }); l.setStrokeOpacity(0.5); gl.push(l); }
  const ticks = [-2, -1, 0, 1, 2].map(x => label(fmt(x), 15, C.muted, mp(x, -1.3)[0], mp(x, -1.3)[1], true));
  const mapTitle = label('map', 16, C.muted, mp(2.3, 1.25)[0], mp(2.3, 1.25)[1]);
  let sel = null;
  const select = i => { const r = frame(i, C.amber); const a = sel ? [out(sel)] : []; a.push(fade(r)); sel = r; return a; };
  const fwd = () => { const ls = [0, 1].map(i => { const a = N.pos(0, i), b = N.pos(1, i); return new M.Line({ start: [a[0] + R, a[1], 0], end: [b[0] - R, b[1], 0], color: C.amber, strokeWidth: 5 }); });
    trash.push(...ls); return ls.map(f => new M.ShowPassingFlash(f, { timeWidth: 0.4 })); };
  const val = (l, i, s, col) => { const a = N.value(l, i, s, col); if (String(s).length > 4 && a[0].mobject) a[0].mobject.scale(0.8); return a; };
  const inVals = i => [...val(0, 0, fmt(feat[i][0]), C.cyan), ...val(0, 1, fmt(feat[i][1]), C.amber)];
  const outVals = i => [...fwd(), ...N.value(1, 0, fmt(emb[i][0]), C.ink), ...N.value(1, 1, '0', C.ink)];
  const dots = [null, null, null, null];
  const lbOff = i => [0, (i % 2 ? -1 : 1) * 0.34];
  const dotOf = (i, color, fillOp = 1) => {
    const p = mp(...emb[i]);
    const halo = new M.Dot({ point: p, radius: 0.18, color }); halo.setFill(color, 0.22);
    const d = new M.Dot({ point: p, radius: 0.09, color }); d.setFill(color, fillOp);
    const lb = label(names[i], 17, color, p[0] + lbOff(i)[0], p[1] + lbOff(i)[1], true);
    return new M.VGroup(halo, d, lb);
  };
  const putDot = (i, color) => { const g = dotOf(i, color); const a = dots[i] ? [out(dots[i])] : []; a.push(fade(g)); dots[i] = g; return a; };

  await until(S(15));
  await go(...select(0), ...inVals(0), ...fbox(['A: x1 = 0.5', '   x2 = 1']), ...say('PASS VESSEL A THROUGH'));
  await until(S(16));
  await go(...outVals(0), ...fbox(['4 × 0.5 = 2', '0 × 1 = 0', ['A → (2, 0)', C.amber]]));
  await until(S(17));
  await go(cascade(gl.map(l => new M.Create(l, { runTime: 0.3 })), 0.8), new M.Create(axis), ...ticks.map(fade), fade(mapTitle), ...putDot(0, C.ink), ...say('A: 2 UNITS RIGHT OF CENTRE'));
  await until(S(18));
  await go(...select(1), ...inVals(1), ...outVals(1), ...putDot(1, C.ink), ...fbox(['B: 4 × (−0.5) = −2', ['B → (−2, 0)', C.amber]]), ...say('B: 2 UNITS LEFT'));
  await until(S(19));
  await go(...select(2), ...inVals(2), ...fbox(['C: x1 = (3 − 1) ÷ 8 = 0.25', '   x2 = |3 − 1| ÷ 4 = 0.5']), ...say('NOW VESSEL C'));
  await until(S(20));
  await go(...outVals(2), ...fbox(['4 × 0.25 = 1', '0 × 0.5 = 0', ['C → (1, 0)', C.amber]]));
  await until(S(21));
  await go(...putDot(2, C.ink), ...say('C: 1 UNIT RIGHT'));
  await until(S(22));
  await go(...select(3), ...inVals(3), ...outVals(3), ...putDot(3, C.ink), ...fbox(['D: 4 × (−0.25) = −1', ['D → (−1, 0)', C.amber]]), ...say('D: 1 UNIT LEFT'));

  // 23-24 embeddings on a line
  await until(S(23));
  await go(out(sel), ...fbox(['A (2, 0)    B (−2, 0)', 'C (1, 0)    D (−1, 0)']), ...say('EMBEDDING = SMALLER DESCRIPTION', C.green));
  sel = null;
  await until(S(24));
  await go(mark(axis, C.green), ...say('ALL FOUR ON ONE LINE', C.green));

  // 25-29 labels for A and B
  await until(S(25));
  await go(...say('NEW INFORMATION: 2 LABELS', C.amber));
  await until(S(26));
  await go(...fbox([['A: Blue collection', C.cyan], ['B: Orange collection', ORANGE]]));
  await until(S(27));
  await go(...say('LABEL = WHICH GROUP', C.amber));
  const tagA = label('A', 17, C.cyan, ...tagPos(0), true), tagB = label('B', 17, ORANGE, ...tagPos(1), true);
  await until(S(28));
  await go(...putDot(0, C.cyan), ...putDot(1, ORANGE), out(tags[0]), fade(tagA), out(tags[1]), fade(tagB), ...say('A BLUE · B ORANGE', C.cyan));
  const q = [2, 3].map(i => label('?', 18, C.muted, mp(...emb[i])[0] + 0.3, mp(...emb[i])[1] + lbOff(i)[1], true));
  await until(S(29));
  await go(...q.map(fade), ...say('C AND D: LABELS STILL HIDDEN', C.muted));

  // 30-35 classifier and boundary
  await until(S(30));
  await go(...fbox(['rule: copy the label', 'of the nearest', 'labeled vessel']), ...say('A SIMPLE RULE', C.amber));
  await until(S(31));
  await go(...say('CLASSIFIER = A RULE THAT GROUPS', C.amber));
  const midDot = new M.Dot({ point: mp(0, 0), radius: 0.09, color: C.amber });
  await until(S(32));
  await go(fade(midDot), ...fbox(['(−2 + 2) ÷ 2 = 0', ['middle point = 0', C.amber]]));
  const boundary = new M.DashedLine({ start: mp(0, -1.05), end: mp(0, 1.05), color: C.amber, strokeWidth: 3 });
  await until(S(33));
  await go(new M.Create(boundary), ...say('DECISION BOUNDARY', C.amber));
  const sideB = label('Blue →', 16, C.cyan, mp(1.3, 1.22)[0], mp(1.3, 1.22)[1]), sideO = label('← Orange', 16, ORANGE, mp(-1.3, 1.22)[0], mp(-1.3, 1.22)[1]);
  await until(S(34));
  await go(fade(sideB), fade(sideO), ...fbox([['right of 0: Blue', C.cyan], ['left of 0: Orange', ORANGE]]));
  await until(S(35));
  await go(mark(wa, C.violet), mark(wb, C.violet), ...say('NO WEIGHT CHANGED', C.violet));

  // 36-41 test C and D
  const RY = P ? -5.0 : -1.75, RX = P ? 0 : 5.5;
  const rows = [null, null];
  const setRow = (k, text, color) => { const t = label(text, P ? 17 : 16, color, RX, RY - k * 0.42, true); const a = rows[k] ? [out(rows[k])] : []; a.push(fade(t)); rows[k] = t; return a; };
  let dl = null;
  const distLines = (i) => {
    const p = emb[i][0];
    const l1 = new M.Line({ start: mp(p, 0.45), end: mp(2, 0.45), color: C.cyan, strokeWidth: 4 });
    const t1 = label(fmt(Math.abs(2 - p)), 16, C.cyan, (mp(p, 0)[0] + mp(2, 0)[0]) / 2, mp(0, 0.65)[1], true);
    const l2 = new M.Line({ start: mp(p, -0.45), end: mp(-2, -0.45), color: ORANGE, strokeWidth: 4 });
    const t2 = label(fmt(Math.abs(p + 2)), 16, ORANGE, (mp(p, 0)[0] + mp(-2, 0)[0]) / 2, mp(0, -0.65)[1], true);
    const g = new M.VGroup(l1, t1, l2, t2); const a = dl ? [out(dl)] : []; a.push(fade(g)); dl = g; return a;
  };
  await until(S(36));
  await go(...select(2), mark(dots[2], C.amber), ...fbox(['test C:', 'first number = 1']), ...say('TEST VESSEL C'));
  await until(S(37));
  await go(...distLines(2), ...fbox([['C to A: 1 unit', C.cyan], ['C to B: 3 units', ORANGE]]));
  await until(S(38));
  await go(...setRow(0, 'C → predict Blue', C.cyan), ...say('A IS NEARER: PREDICT BLUE', C.cyan));
  await until(S(39));
  await go(out(dl), ...select(3), mark(dots[3], C.amber), ...fbox(['test D:', 'first number = −1']), ...say('TEST VESSEL D'));
  dl = null;
  await until(S(40));
  await go(...distLines(3), ...fbox([['D to A: 3 units', C.cyan], ['D to B: 1 unit', ORANGE]]));
  await until(S(41));
  await go(...setRow(1, 'D → predict Orange', ORANGE), ...say('B IS NEARER: PREDICT ORANGE', ORANGE));

  // 42-48 reveal and accuracy
  await until(S(42));
  await go(out(dl), out(sel), ...say('REVEAL THE REAL LABELS', C.amber));
  dl = null; sel = null;
  await until(S(43));
  await go(out(q[0]), ...putDot(2, C.cyan), ...setRow(0, 'C → Blue ✓ correct', C.green), ...say('C IS BLUE: CORRECT', C.green));
  await until(S(44));
  await go(out(q[1]), ...putDot(3, ORANGE), ...setRow(1, 'D → Orange ✓ correct', C.green), ...say('D IS ORANGE: CORRECT', C.green));
  await until(S(45));
  await go(...fbox(['2 correct predictions', 'from 2 test pictures']), ...say('2 OUT OF 2', C.green));
  await until(S(46));
  await go(...say('ACCURACY = SHARE CORRECT', C.green));
  await until(S(47));
  await go(...fbox(['accuracy =', '  correct ÷ total'], C.green));
  await until(S(48));
  await go(...fbox(['accuracy =', '  correct ÷ total', ['2 ÷ 2 = 1 = 100%', C.green]], C.green), ...say('100% ACCURACY', C.green));

  // 49-54
  await until(S(49));
  await go(...say('EMBEDDING EVALUATION', C.violet));
  await until(S(50));
  await go(mark(boundary, C.amber), ...say('EMBEDDINGS SEPARATE THE COLLECTIONS', C.green));
  await until(S(51));
  await go(...say('TEST AND COMPARE REPRESENTATIONS', C.cyan));
  await until(S(52));
  await go(...fbox(['2 tests ≠ proof', ['for thousands of photos', C.pink]], C.pink), ...say('TWO TESTS PROVE LITTLE', C.pink));
  await until(S(53));
  await go(...fbox(['need many more', 'unseen test pictures', ['with known labels', C.amber]], C.amber), ...say('MANY MORE TESTS NEEDED', C.amber));
  await until(S(54));
  await go(mark(lockR, C.violet), ...say('FROZEN EMBEDDINGS SOLVE A NEW TASK', C.violet));
}

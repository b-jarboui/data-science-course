// 18.1.4 Contrastive learning: matching views together, different vessels apart.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
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
    const parts = [];
    vals.forEach((v, k) => {
      const c = new M.Square({ sideLength: s, color: C.muted, strokeWidth: 2 });
      c.setFill(grey(v), 1); c.moveTo([x + off[k][0] * s / 2, y + off[k][1] * s / 2, 0]); parts.push(c);
    });
    vals.forEach((v, k) => parts.push(label(String(v), size, v >= 2 ? C.bg : C.ink, x + off[k][0] * s / 2, y + off[k][1] * s / 2, true)));
    return new M.VGroup(...parts);
  }

  // 0-2 photos of the same vessel can differ
  const vase = (x, y, rb, tag, patch) => {
    const card = new M.RoundedRectangle({ width: 1.5, height: 1.8, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
    card.setFill(C.card, 0.95); card.moveTo([x, y, 0]);
    const body = new M.Circle({ radius: rb, color: '#c08a5a', strokeWidth: 2 }); body.setFill('#c08a5a', 0.75); body.moveTo([x, y - 0.12, 0]);
    const neck = new M.Rectangle({ width: 0.22, height: 0.36, color: '#c08a5a', strokeWidth: 2 }); neck.setFill('#c08a5a', 0.75); neck.moveTo([x, y + rb + 0.02, 0]);
    const rim = new M.Rectangle({ width: 0.42, height: 0.08, color: '#c08a5a', strokeWidth: 2 }); rim.setFill('#c08a5a', 0.9); rim.moveTo([x, y + rb + 0.22, 0]);
    const parts = [card, body, neck, rim];
    if (patch) { const p = new M.Rectangle({ width: 1.3, height: 0.62, color: grey(2), strokeWidth: 0 }); p.setFill(grey(2), 1); p.moveTo([x, y + 0.42, 0]); parts.push(p); }
    parts.push(label(tag, 16, C.muted, x, y - 0.72, true));
    return new M.VGroup(...parts);
  };
  const ph = P ? [[-1.3, 0.55], [1.3, 0.55], [-1.3, -1.65], [1.3, -1.65]] : [[-4.5, -0.4], [-1.5, -0.4], [1.5, -0.4], [4.5, -0.4]];
  const photos = ['A', 'B', 'C', 'D'].map((t, i) => vase(ph[i][0], ph[i][1], [0.36, 0.3, 0.4, 0.32][i], t));
  await until(S(0));
  await go(cascade(photos.map(fade), 1.2), ...say('FIND SIMILAR PHOTOS, NO LABELS'));
  const twoA = P ? [vase(-1.3, -0.5, 0.36, 'A', false), vase(1.3, -0.5, 0.36, 'A', true)] : [vase(-3.6, -0.4, 0.36, 'A', false), vase(-1.6, -0.4, 0.36, 'A', true)];
  await until(S(1));
  await go(...photos.map(out), fade(twoA[0]), fade(twoA[1]), ...say('SAME VESSEL, DIFFERENT LOOK', C.amber));
  await until(S(2));
  await go(...say('WHICH DIFFERENCES MATTER?', C.violet));

  // 3-10 three pictures and the map
  const s = P ? 0.5 : 0.48, ns = P ? 16 : 15;
  const PX = P ? [[-2.2, 1.6], [0, 1.6], [2.2, 1.6]] : [[-6.0, 0.85], [-6.0, -0.5], [-6.0, -1.85]];
  const names = ['A', 'A′', 'B'], cols = [C.ink, C.violet, C.green];
  const pics = [pic([4, 0, 4, 0], PX[0], s, ns), pic([2, 2, 4, 0], PX[1], s, ns), pic([0, 4, 0, 4], PX[2], s, ns)];
  const tags = PX.map((p, i) => P ? label(names[i], 17, cols[i], p[0], p[1] - s - 0.22, true) : label(names[i], 17, cols[i], p[0] - s - 0.25, p[1], true));
  await until(S(3));
  await go(out(twoA[0]), out(twoA[1]), fade(pics[0]), fade(tags[0]), ...say('VESSEL A: 4, 0, 4, 0'));
  await until(S(4));
  await go(fade(pics[1]), fade(tags[1]), ...say('COVER THE TOP ROW: 2, 2, 4, 0', C.muted));
  await until(S(5));
  await go(mark(pics[0], C.violet), mark(pics[1], C.violet), ...say('TWO VIEWS OF THE SAME VESSEL', C.violet));
  await until(S(6));
  await go(fade(pics[2]), fade(tags[2]), ...say('VESSEL B: 0, 4, 0, 4', C.green));

  // the map
  const u = P ? 0.8 : 0.75, MO = P ? [0, -4.0] : [1.4, -1.7];
  const mp = (x, y) => [MO[0] + x * u, MO[1] + y * u, 0];
  const gl = [];
  for (let x = -2; x <= 2; x++) { const l = new M.Line({ start: mp(x, -0.5), end: mp(x, 2.5), color: C.grid, strokeWidth: x === 0 ? 2 : 1 }); l.setStrokeOpacity(x === 0 ? 1 : 0.7); gl.push(l); }
  for (let y = 0; y <= 2; y++) { const l = new M.Line({ start: mp(-2.5, y), end: mp(2.5, y), color: C.grid, strokeWidth: y === 0 ? 2 : 1 }); l.setStrokeOpacity(y === 0 ? 1 : 0.7); gl.push(l); }
  const mapTitle = label('map', 17, C.muted, mp(P ? 2.2 : -2.2, 2.3)[0], mp(P ? 2.2 : -2.2, 2.3)[1]);
  const ticks = [-2, 2].map(x => label(String(x).replace('-', '−'), 15, C.muted, mp(x, -0.3)[0] + 0.15, mp(x, -0.3)[1], true));
  await until(S(7));
  await go(cascade(gl.map(l => new M.Create(l, { runTime: 0.3 })), 1.0), fade(mapTitle), ...ticks.map(fade), ...say('PLACE PICTURES ON A MAP', C.cyan));
  const pc = i => PX[i];
  const link = (i, j, color) => new M.Line({ start: [pc(i)[0] + (P ? s * 1.1 : 0), pc(i)[1] - (P ? 0 : s * 1.05), 0],
    end: [pc(j)[0] - (P ? s * 1.1 : 0), pc(j)[1] + (P ? 0 : s * 1.05), 0], color, strokeWidth: 4 });
  const near = link(0, 1, C.green);
  const farL = P ? new M.ArcBetweenPoints({ start: [pc(0)[0], pc(0)[1] + s + 0.05, 0], end: [pc(2)[0], pc(2)[1] + s + 0.05, 0], angle: -0.6, color: C.pink, strokeWidth: 4 })
                 : new M.ArcBetweenPoints({ start: [pc(0)[0] + s + 0.05, pc(0)[1], 0], end: [pc(2)[0] + s + 0.05, pc(2)[1], 0], angle: 1.2, color: C.pink, strokeWidth: 4 });
  await until(S(8));
  await go(new M.Create(near), ...say('VIEWS OF A: CLOSE TOGETHER', C.green));
  await until(S(9));
  await go(new M.Create(farL), ...say('A AND B: FAR APART', C.pink));
  await until(S(10));
  await go(out(near), out(farL), ...say('CONTRASTIVE LEARNING', C.violet));

  // 11-18 two numbers per picture
  await until(S(11));
  await go(...say('A NETWORK GIVES 2 NUMBERS', C.cyan));
  await until(S(12));
  await go(...say('2 NUMBERS = A PLACE ON THE MAP', C.cyan));
  const feat = [[0.5, 1], [0.5, 0], [-0.5, 1]];
  const fpos = i => P ? [PX[i][0], PX[i][1] - s - 0.6] : [PX[i][0] + s + 0.6, PX[i][1]];
  const f1 = feat.map((f, i) => label(`x1 = ${fmt(f[0])}`, 15, C.cyan, fpos(i)[0], fpos(i)[1] + (P ? 0 : 0.17), true));
  const f2 = feat.map((f, i) => label(`x2 = ${fmt(f[1])}`, 15, C.amber, fpos(i)[0], fpos(i)[1] - (P ? 0.27 : 0.17), true));
  const bottomBox = i => rect(2 * s + 0.1, s + 0.08, PX[i][0], PX[i][1] - s / 2, C.cyan, 3);
  const topBox = i => rect(2 * s + 0.1, s + 0.08, PX[i][0], PX[i][1] + s / 2, C.amber, 3);
  const bb = [0, 1, 2].map(bottomBox), tb = [0, 1, 2].map(topBox);
  await until(S(13));
  await go(...bb.map(fade), ...fbox(['x1 = (bottom left', '  − bottom right) ÷ 8']));
  await until(S(14));
  await go(fade(f1[0]), fade(f1[1]), ...fbox(['A, A′: (4 − 0) ÷ 8', ['x1 = 0.5', C.cyan]]));
  await until(S(15));
  await go(fade(f1[2]), ...fbox(['B: (0 − 4) ÷ 8', ['x1 = −0.5', C.cyan]]));
  await until(S(16));
  await go(...bb.map(out), ...tb.map(fade), ...fbox(['x2 = difference of', '  the top squares', ['(always positive)', C.muted]], C.amber));
  await until(S(17));
  await go(...fbox(['x2 = difference ÷ 4'], C.amber));
  await until(S(18));
  await go(...tb.map(out), ...f2.map(fade), ...fbox(['A: |4 − 0| ÷ 4 = 1', 'B: |0 − 4| ÷ 4 = 1', ['A′: |2 − 2| ÷ 4 = 0', C.amber]], C.amber));

  // 19-24 the network: 2 inputs, 2 outputs, one weight each
  const R = P ? 0.3 : 0.3;
  const NC = P ? [0, -0.75, 0] : [-2.75, -0.45, 0];
  const N = net({ layers: [2, 2], center: NC, width: P ? 2.6 : 2.4, height: P ? 1.2 : 1.5, r: R });
  const outNames = [label(P ? 'right/left' : 'across', 15, C.muted, N.pos(1, 0)[0] + R + (P ? 0.6 : 0.45), N.pos(1, 0)[1], false),
                    label('up', 15, C.muted, N.pos(1, 1)[0] + R + 0.3, N.pos(1, 1)[1], false)];
  const inNames = [label('x1', 15, C.cyan, N.pos(0, 0)[0], N.pos(0, 0)[1] + R + 0.2, true), label('x2', 15, C.amber, N.pos(0, 1)[0], N.pos(0, 1)[1] - R - 0.2, true)];
  await until(S(19));
  await go(cascade(N.nodes.flat().map(fade), 0.8), ...inNames.map(fade), ...fbox([]), ...say('2 INPUTS · 2 OUTPUTS'));
  const ea = N.edges[0][0][0], eb = N.edges[0][1][1];
  const mid = (i) => { const a = N.pos(0, i), b = N.pos(1, i); return [(a[0] + b[0]) / 2, a[1] + (i || P ? -0.22 : 0.22)]; };
  const val = (l, i, s, col) => { const a = N.value(l, i, s, col); if (String(s).length > 3 && a[0].mobject) a[0].mobject.scale(0.85); return a; };
  let wa = null, wb = null;
  const setWeights = (a, b) => {
    const ta = label('a = ' + fmt(a), 15, C.cyan, mid(0)[0], mid(0)[1], true), tb2 = label('b = ' + fmt(b), 15, C.amber, mid(1)[0], mid(1)[1], true);
    const res = [...N.weight(0, 0, 0, a / 4), ...N.weight(0, 1, 1, b / 4), fade(ta), fade(tb2)];
    if (wa) res.push(out(wa), out(wb));
    wa = ta; wb = tb2; return res;
  };
  await until(S(20));
  await go(new M.Create(ea), new M.Create(eb),...say('ONE ADJUSTABLE WEIGHT PER LINE'));
  await until(S(21));
  await go(...setWeights(2, 2), ...say('a = 2, b = 2 · SAME NETWORK FOR ALL', C.amber));
  await until(S(22));
  await go(...fbox(['output 1 = a × x1', 'output 2 = b × x2']));
  await until(S(23));
  await go(fade(outNames[0]), ...fbox(['output 1:', ['move right (or left)', C.cyan]]));
  await until(S(24));
  await go(fade(outNames[1]), ...fbox(['output 2:', ['move up', C.amber]]));

  // 25-27 run each picture through the network
  const pts = [null, null, null];
  const ptOff = [[-0.25, 0.25], [0.28, -0.25], [-0.25, 0.25]];
  const point = (i, x, y) => {
    const p = mp(x, y);
    const halo = new M.Dot({ point: p, radius: 0.17, color: cols[i] }); halo.setFill(cols[i], 0.22);
    const d = new M.Dot({ point: p, radius: 0.08, color: cols[i] });
    const lb = label(names[i], 17, cols[i], p[0] + ptOff[i][0], p[1] + ptOff[i][1], true);
    return { halo, d, lb };
  };
  const placeAt = (i, x, y) => {
    const n = point(i, x, y), a = [];
    if (pts[i]) { a.push(new M.Transform(pts[i].halo, n.halo), new M.Transform(pts[i].d, n.d), out(pts[i].lb), fade(n.lb)); pts[i] = { halo: pts[i].halo, d: pts[i].d, lb: n.lb }; }
    else { a.push(fade(n.halo), fade(n.d), fade(n.lb)); pts[i] = n; }
    return a;
  };
  let sel = null;
  const select = i => { const r = rect(2 * s + 0.16, 2 * s + 0.16, PX[i][0], PX[i][1], cols[i], 3); const a = sel ? [out(sel)] : []; a.push(fade(r)); sel = r; return a; };
  const fwd = (col = C.amber) => {
    const ls = [0, 1].map(i => { const a = N.pos(0, i), b = N.pos(1, i); return new M.Line({ start: [a[0] + R, a[1], 0], end: [b[0] - R, b[1], 0], color: col, strokeWidth: 5 }); });
    trash.push(...ls); return ls.map(f => new M.ShowPassingFlash(f, { timeWidth: 0.4 }));
  };
  const back = () => {
    const ls = [0, 1].map(i => { const a = N.pos(0, i), b = N.pos(1, i); return new M.Line({ start: [b[0] - R, b[1], 0], end: [a[0] + R, a[1], 0], color: C.violet, strokeWidth: 5 }); });
    trash.push(...ls); return ls.map(f => new M.ShowPassingFlash(f, { timeWidth: 0.4 }));
  };
  const runPic = (i, a, b) => [...select(i), ...N.value(0, 0, fmt(feat[i][0]), C.cyan), ...N.value(0, 1, fmt(feat[i][1]), C.amber),
    ...fwd(), ...N.value(1, 0, fmt(a * feat[i][0]), C.ink), ...N.value(1, 1, fmt(b * feat[i][1]), C.ink), ...placeAt(i, a * feat[i][0], b * feat[i][1])];
  const aVals = (a, b) => [...N.value(0, 0, '0.5', C.cyan), ...N.value(0, 1, '1', C.amber),
    ...val(1, 0, fmt(Math.round(a * 50) / 100), C.ink), ...val(1, 1, fmt(Math.round(b * 100) / 100), C.ink)];
  await until(S(25));
  await go(...runPic(0, 2, 2), ...fbox(['A: 2 × 0.5 = 1', '   2 × 1 = 2', ['A at (1, 2)', C.ink]]));
  await until(S(26));
  await go(...runPic(1, 2, 2), ...fbox(['A′: 2 × 0.5 = 1', '    2 × 0 = 0', ['A′ at (1, 0)', C.violet]], C.violet));
  await until(S(27));
  await go(...runPic(2, 2, 2), ...fbox(['B: 2 × (−0.5) = −1', '   2 × 1 = 2', ['B at (−1, 2)', C.green]], C.green));

  // 28-34 distances and loss
  let dSame = null, dDiff = null;
  const distLines = (a, b) => {
    const A = [a * 0.5, b], A2 = [a * 0.5, 0], Bp = [-a * 0.5, b];
    const l1 = new M.Line({ start: mp(...A), end: mp(...A2), color: C.green, strokeWidth: 4 });
    const t1 = b < 0.5 ? label(fmt(b), 16, C.green, mp(...A)[0] + 0.5, mp(...A)[1] + 0.3, true) : label(fmt(b), 16, C.green, mp(...A)[0] + 0.32, (mp(...A)[1] + mp(...A2)[1]) / 2, true);
    const l2 = new M.Line({ start: mp(...Bp), end: mp(...A), color: C.pink, strokeWidth: 4 });
    const t2 = label(fmt(a), 16, C.pink, mp(0, b)[0], mp(0, b)[1] + 0.24, true);
    return [new M.VGroup(l1, t1), new M.VGroup(l2, t2)];
  };
  const setDist = (a, b, which = 3) => {
    const [n1, n2] = distLines(a, b), res = [];
    if (which & 1) { if (dSame) res.push(out(dSame)); res.push(fade(n1)); dSame = n1; }
    if (which & 2) { if (dDiff) res.push(out(dDiff)); res.push(fade(n2)); dDiff = n2; }
    return res;
  };
  await until(S(28));
  await go(...select(0), ...aVals(2, 2), ...setDist(2, 2, 1), ...fbox([['A to A′: 2 units', C.green]], C.green), ...say('SAME VESSEL: 2 APART', C.green));
  await until(S(29));
  await go(...setDist(2, 2, 2), ...fbox(['A to A′: 2 units', ['A to B: 2 units', C.pink]], C.pink), ...say('DIFFERENT VESSELS: 2 APART', C.pink));
  await until(S(30));
  await go(...fbox([['goal: A to A′ = 0', C.green], ['A to B: at least 4', C.pink]]), ...say('MEET · AT LEAST 4 APART', C.amber));
  await until(S(31));
  await go(...fbox(['A to A′ should be 0', ['but it is 2', C.green]], C.green));
  await until(S(32));
  await go(...fbox(['A to B should be ≥ 4', ['short by 4 − 2 = 2', C.pink]], C.pink));
  await until(S(33));
  await go(...fbox(['2 × 2 = 4', '2 × 2 = 4']), ...say('SQUARE BOTH', C.amber));

  const CH = P ? { x: 0, y: -5.05, w: 4, h: 0.5 } : { x: 5.35, y: -1.9, w: 2.4, h: 1.1 };
  const x0 = CH.x - CH.w / 2, y0 = CH.y - CH.h / 2;
  const cp = (k, loss) => [x0 + 0.15 + k * (CH.w - 0.3) / 8, y0 + loss / 8 * CH.h, 0];
  const axes = new M.VGroup(
    new M.Line({ start: [x0, y0, 0], end: [x0 + CH.w, y0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [x0, y0, 0], end: [x0, y0 + CH.h + 0.1, 0], color: C.muted, strokeWidth: 2 }),
    label('loss', 15, C.pink, x0 + 0.3, y0 + CH.h + 0.22), label('step', 15, C.muted, x0 + CH.w + 0.3, y0));
  let last = cp(0, 8);
  const addPt = (k, loss) => { const p = cp(k, loss); const l = new M.Line({ start: last, end: p, color: C.pink, strokeWidth: 3 }); last = p;
    return [fade(l), fade(new M.Dot({ point: p, radius: 0.05, color: C.pink }))]; };
  await until(S(34));
  await go(...fbox([['loss = 4 + 4 = 8', C.pink]], C.pink), new M.Create(axes), fade(new M.Dot({ point: cp(0, 8), radius: 0.05, color: C.pink })), ...say('LOSS = 8', C.pink));

  // 35-48 learning steps
  await until(S(35));
  await go(...say('A SLOPE FOR EACH WEIGHT', C.violet));
  await until(S(36));
  await go(...fbox([['slope for a = −4', C.cyan], ['slope for b = +4', C.amber]], C.violet));
  await until(S(37));
  await go(...fbox([['learning rate = 1/4', C.green]], C.green), ...say('LEARNING RATE = STEP SIZE', C.green));
  const steps = [
    { a: 3, b: 1, d: 1, loss: 2, beats: [38, 39, 40, 41, 42] },
    { a: 3.5, b: 0.5, d: 0.5, loss: 0.5, beats: [43, 44, 45] },
    { a: 3.75, b: 0.25, d: 0.25, loss: 0.125, beats: [46, 47, 48] },
  ];
  // step 1: slow, one beat per idea
  {
    const st = steps[0];
    await until(S(38));
    await go(...back(), ...fbox([['a: −4 × 1/4 = −1 → a + 1', C.cyan], ['b: 4 × 1/4 = 1 → b − 1', C.amber]]), ...say('STEP 1', C.amber));
    await until(S(39));
    await go(...setWeights(st.a, st.b), ...aVals(3, 1), ...placeAt(0, 1.5, 1), ...placeAt(1, 1.5, 0), ...placeAt(2, -1.5, 1), ...setDist(st.a, st.b), ...fbox([['a = 3', C.cyan], ['b = 1', C.amber]]));
    await until(S(40));
    await go(mark(dSame, C.green), ...fbox([['A to A′: 1 unit', C.green]], C.green), ...say('MATCHING VIEWS: CLOSER', C.green));
    await until(S(41));
    await go(mark(dDiff, C.pink), ...fbox(['A to A′: 1 unit', ['A to B: 3 units', C.pink]], C.pink), ...say('DIFFERENT VESSELS: FARTHER', C.pink));
    await until(S(42));
    await go(...addPt(1, 2), ...fbox(['1 × 1 + 1 × 1', ['loss = 2', C.pink]], C.pink));
  }
  for (let k = 1; k < 3; k++) {
    const st = steps[k], [b1, b2, b3] = st.beats;
    await until(S(b1));
    await go(...back(), ...fbox([[`a + ${fmt(st.d)}`, C.cyan], [`b − ${fmt(st.d)}`, C.amber]]), ...say('STEP ' + (k + 1), C.amber));
    await until(S(b2));
    await go(...setWeights(st.a, st.b), ...aVals(st.a, st.b), ...placeAt(0, st.a / 2, st.b), ...placeAt(1, st.a / 2, 0), ...placeAt(2, -st.a / 2, st.b), ...setDist(st.a, st.b), ...fbox([[`a = ${fmt(st.a)}`, C.cyan], [`b = ${fmt(st.b)}`, C.amber]]));
    await until(S(b3));
    await go(...addPt(k + 1, st.loss),
      ...fbox([[`A to A′: ${fmt(st.b)}`, C.green], [`A to B: ${fmt(st.a)}`, C.pink], [`loss = ${fmt(st.loss)}`, C.pink]], C.pink));
  }

  // 49 faster steps
  await until(S(49));
  await go(...say('MORE STEPS: a → 4, b → 0, LOSS → 0', C.green));
  for (let k = 4; k <= 8; k++) {
    const b = Math.pow(2, 1 - k), a = 4 - b, loss = 2 * b * b;
    await go(...setWeights(Math.round(a * 1000) / 1000, Math.round(b * 1000) / 1000), ...aVals(a, b), ...placeAt(0, a / 2, b), ...placeAt(1, a / 2, 0), ...placeAt(2, -a / 2, b),
      ...setDist(Math.round(a * 1000) / 1000, Math.round(b * 1000) / 1000), ...addPt(k, loss), ...fbox([`step ${k}: loss ≈ ${loss.toFixed(4)}`], C.pink));
  }

  // 50-54
  await until(S(50));
  await go(...fbox(['loss = (A to A′)²', '+ (shortfall from 4)²'], C.pink), ...say('THE LOSS FORMULA', C.pink));
  await until(S(51));
  await go(...setWeights(4, 0), ...aVals(4, 0), ...placeAt(0, 2, 0), ...placeAt(1, 2, 0), ...placeAt(2, -2, 0), ...(dSame ? [out(dSame)] : []), ...setDist(4, 0, 2),
    ...fbox([['a = 4, b = 0', C.amber], 'A and A′ meet at (2, 0)']), ...say('BOTH VIEWS OF A MEET', C.green));
  dSame = null;
  await until(S(52));
  await go(mark(pts[2].d, C.green), ...fbox(['A, A′ at (2, 0)', ['B at (−2, 0)', C.green]]), ...say('COMPARE AND FIND SIMILAR PICTURES', C.cyan));
  await until(S(53));
  await go(mark(wb, C.pink), ...say('HIDDEN DETAILS MAY BE IGNORED TOO', C.pink));
  await until(S(54));
  await go(...say('MATCHING TOGETHER, DIFFERENT APART', C.green));
}

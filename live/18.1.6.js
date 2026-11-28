// 18.1.6 Siamese networks: two encoders, one set of shared weights.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const ORANGE = '#fb923c';
  const CX = P ? 0 : -2.6;
  const PILL = [CX, P ? 2.45 : 1.85, 0];
  const BOXP = P ? [0, 3.58, 0] : [5.4, 1.0, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);
  const label = (text, size, color, x, y, mono = false) => T(text, P ? Math.max(15, size) : size, color, mono).moveTo([x, y, 0]);
  const fade = o => new M.FadeIn(o, { runTime: 0.3 });
  const out = o => new M.FadeOut(o, { runTime: 0.3 });
  const mark = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.5 });
  const cascade = (a, rt = 0.8) => new M.LaggedStart(a, { lagRatio: 0.12, runTime: rt });
  const trash = [];
  const go = async (...anims) => { await play(...anims); if (trash.length) { const g = trash.splice(0); await play(new M.FadeOut(new M.VGroup(...g), { runTime: 0.15 })); } };
  const r2 = v => Math.sign(v) * Math.round(Math.abs(v) * 100) / 100; // symmetric: 1.875 -> 1.88, -1.875 -> -1.88
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
    const maxW = P ? FW - 1.2 : 3.2;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  const grey = v => { const g = Math.round(14 + Math.max(0, Math.min(4, v)) / 4 * 230); const h = g.toString(16).padStart(2, '0'); return '#' + h + h + h; };
  function pic(vals, [x, y], s, size) {
    const off = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
    const parts = vals.map((v, k) => { const c = new M.Square({ sideLength: s, color: C.muted, strokeWidth: 2 }); c.setFill(grey(v), 1); c.moveTo([x + off[k][0] * s / 2, y + off[k][1] * s / 2, 0]); return c; });
    vals.forEach((v, k) => parts.push(label(String(v), size, v >= 2 ? C.bg : C.ink, x + off[k][0] * s / 2, y + off[k][1] * s / 2, true)));
    return new M.VGroup(...parts);
  }
  const V = { A: [4, 0, 4, 0], 'A′': [2, 2, 4, 0], B: [0, 4, 0, 4], C: [3, 1, 3, 1], D: [1, 3, 1, 3] };
  const F = { A: [0.5, 1], 'A′': [0.5, 0], B: [-0.5, 1], C: [0.25, 0.5], D: [-0.25, 0.5] };
  const COL = { A: C.cyan, 'A′': C.cyan, B: ORANGE, C: C.cyan, D: ORANGE };

  // 0-2 photos
  const vase = (x, y, rb, tag) => {
    const card = new M.RoundedRectangle({ width: 1.5, height: 1.8, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
    card.setFill(C.card, 0.95); card.moveTo([x, y, 0]);
    const body = new M.Circle({ radius: rb, color: '#c08a5a', strokeWidth: 2 }); body.setFill('#c08a5a', 0.75); body.moveTo([x, y - 0.12, 0]);
    const neck = new M.Rectangle({ width: 0.22, height: 0.36, color: '#c08a5a', strokeWidth: 2 }); neck.setFill('#c08a5a', 0.75); neck.moveTo([x, y + rb + 0.02, 0]);
    const rim = new M.Rectangle({ width: 0.42, height: 0.08, color: '#c08a5a', strokeWidth: 2 }); rim.setFill('#c08a5a', 0.9); rim.moveTo([x, y + rb + 0.22, 0]);
    return new M.VGroup(card, body, neck, rim, label(tag, 16, C.muted, x, y - 0.72, true));
  };
  const newPhoto = vase(0, P ? -0.5 : -0.4, 0.34, 'new');
  const ph = P ? [[-1.3, 0.55], [1.3, 0.55], [-1.3, -1.65], [1.3, -1.65]] : [[-4.5, -0.4], [-1.5, -0.4], [1.5, -0.4], [4.5, -0.4]];
  const photos = ['A', 'B', 'C', 'D'].map((t, i) => vase(ph[i][0], ph[i][1], [0.36, 0.3, 0.4, 0.32][i], t));
  await until(S(0));
  await go(fade(newPhoto), ...say('A NEW POTTERY PHOTO'));
  await until(S(1));
  await go(out(newPhoto), cascade(photos.map(fade), 1.0), ...say('FIND SIMILAR VESSELS', C.amber));
  await until(S(2));
  await go(...say('ONE NUMBER FOR THE DIFFERENCE?', C.violet));

  // 3-8 four pictures, pairs, the same ruler
  const big = P ? 0.55 : 0.55;
  const row = P ? [[-2.4, 0], [-0.8, 0], [0.8, 0], [2.4, 0]] : [[-5.4, -0.4], [-3.4, -0.4], [-1.4, -0.4], [0.6, -0.4]];
  const four = ['A', 'B', 'C', 'D'].map((n, i) => new M.VGroup(pic(V[n], row[i], big, 18), label(n, 16, COL[n], row[i][0], row[i][1] - big - 0.28, true)));
  await until(S(3));
  await go(...photos.map(out), cascade(four.map(fade), 1.0), ...say('VESSELS A, B, C AND D'));

  // two encoders, stacked
  const R = P ? 0.3 : 0.32;
  const EY = P ? [0.9, -1.3] : [0.65, -1.75];
  const EX = P ? 0.5 : -3.0, EW = P ? 2.2 : 2.2, EH = P ? 0.9 : 1.0;
  const NN = EY.map(y => net({ layers: [2, 2], center: [EX, y, 0], width: EW, height: EH, r: R }));
  const INX = P ? -2.6 : -5.5, ps = P ? 0.42 : 0.45;
  const inPics = [null, null], inTags = [null, null];
  const setIn = (k, name) => {
    const p = pic(V[name], [INX, EY[k]], ps, 13), t = label(name, 15, COL[name], INX - ps - 0.3, EY[k], true);
    const a = []; if (inPics[k]) a.push(out(inPics[k]), out(inTags[k]));
    a.push(fade(p), fade(t)); inPics[k] = p; inTags[k] = t; return a;
  };
  await until(S(4));
  await go(...four.map(out), ...setIn(0, 'A'), ...setIn(1, 'A′'), ...say('VESSEL A BESIDE ITS COVERED VIEW'));
  await until(S(5));
  await go(mark(inPics[0], C.cyan), mark(inPics[1], C.cyan), ...say('LOOK DIFFERENT · SAME VESSEL', C.cyan));
  await until(S(6));
  await go(...setIn(1, 'B'), ...say('A BESIDE B: A DIFFERENT VESSEL', ORANGE));
  // a ruler beside both pictures
  const rulerX = INX + ps + 0.45;
  const ruler = new M.VGroup(rect(0.22, EY[0] - EY[1] + 0.9, rulerX, (EY[0] + EY[1]) / 2, C.amber, 2),
    ...Array.from({ length: 9 }, (_, k) => new M.Line({ start: [rulerX - 0.11, EY[1] - 0.45 + k * (EY[0] - EY[1] + 0.9) / 8, 0], end: [rulerX + 0.02, EY[1] - 0.45 + k * (EY[0] - EY[1] + 0.9) / 8, 0], color: C.amber, strokeWidth: 2 })));
  await until(S(7));
  await go(fade(ruler), ...say('ONE RULER · SAME RULES FOR BOTH', C.amber));
  await until(S(8));
  await go(...say('COMPARE PICTURES WITH THE SAME RULES', C.amber));

  // 9-17 the Siamese network
  await until(S(9));
  await go(out(ruler), cascade(NN.flatMap(N => N.nodes.flat()).map(fade), 1.0), ...say('TWO COPIES OF OUR ENCODER'));
  const mid = (N, i) => { const a = N.pos(0, i), b = N.pos(1, i); return [(a[0] + b[0]) / 2, a[1] + (i ? -0.2 : 0.2)]; };
  let wl = [];
  const setWeights = (a, b) => {
    const res = [];
    wl.forEach(t => res.push(out(t))); wl = [];
    NN.forEach(N => {
      res.push(...N.weight(0, 0, 0, a / 4), ...N.weight(0, 1, 1, b / 4));
      const ta = label('a = ' + fmt(a), 13, C.cyan, ...mid(N, 0), true), tb = label('b = ' + fmt(b), 13, C.amber, ...mid(N, 1), true);
      wl.push(ta, tb); res.push(fade(ta), fade(tb));
    });
    return res;
  };
  await until(S(10));
  await go(...NN.flatMap(N => [new M.Create(N.edges[0][0][0]), new M.Create(N.edges[0][1][1])]), ...say('2 INPUTS · 2 OUTPUTS · 2 WEIGHTS'));
  const linkA = new M.DashedLine({ start: [EX - 0.62, NN[0].pos(0, 0)[1], 0], end: [EX - 0.62, NN[1].pos(0, 0)[1], 0], color: C.cyan, strokeWidth: 3 });
  const linkB = new M.DashedLine({ start: [EX + 0.62, NN[0].pos(0, 1)[1], 0], end: [EX + 0.62, NN[1].pos(0, 1)[1], 0], color: C.amber, strokeWidth: 3 });
  await until(S(11));
  await go(new M.Create(linkA), new M.Create(linkB), ...say('DOTTED LINES = SHARED WEIGHTS', C.violet));
  await until(S(12));
  await go(mark(NN[0].edges[0][0][0], C.cyan), mark(NN[1].edges[0][0][0], C.cyan), mark(linkA, C.cyan), ...say('ONE CHANGES → BOTH CHANGE', C.violet));
  await until(S(13));
  await go(mark(linkB, C.amber), ...say('SIAMESE NETWORK', C.violet));
  await until(S(14));
  await go(...NN.flatMap(N => [...N.value(1, 0, '?', C.ink), ...N.value(1, 1, '?', C.ink)]), ...say('EACH PICTURE → 2 NUMBERS = EMBEDDING', C.green));

  // the map
  const u = P ? 0.75 : 0.72, MO = P ? [0, -4.05] : [1.5, -1.45];
  const mp = (x, y) => [MO[0] + x * u, MO[1] + y * u, 0];
  const gl = [];
  for (let x = -2; x <= 2; x++) { const l = new M.Line({ start: mp(x, -0.5), end: mp(x, 2.5), color: C.grid, strokeWidth: x === 0 ? 2 : 1 }); l.setStrokeOpacity(x === 0 ? 0.9 : 0.5); gl.push(l); }
  for (let y = 0; y <= 2; y++) { const l = new M.Line({ start: mp(-2.5, y), end: mp(2.5, y), color: C.grid, strokeWidth: y === 0 ? 2 : 1 }); l.setStrokeOpacity(y === 0 ? 0.9 : 0.5); gl.push(l); }
  const mapTitle = label('map', 14, C.muted, mp(2.2, 2.35)[0], mp(2.2, 2.35)[1]);
  await until(S(15));
  await go(cascade(gl.map(l => new M.Create(l, { runTime: 0.3 })), 0.8), fade(mapTitle), ...say('BOTH ON THE MAP · MEASURE DISTANCE'));
  await until(S(16));
  await go(...say('SMALLER DISTANCE = MORE SIMILAR', C.green));
  await until(S(17));
  await go(...say('HOW DOES IT LEARN WHAT IS CLOSE?', C.amber));

  // dots on the map
  const dots = {};
  const dotOff = { A: [-0.25, 0.22], 'A′': [0.3, -0.22], B: [-0.25, 0.22], C: [0, 0.3], D: [0, 0.3] };
  const place = (name, x, y) => {
    const p = mp(x, y), col = COL[name];
    const halo = new M.Dot({ point: p, radius: 0.16, color: col }); halo.setFill(col, 0.22);
    const d = new M.Dot({ point: p, radius: 0.075, color: col }); if (name === 'A′') d.setFill(C.bg, 1);
    const lb = label(name, 14, col, p[0] + dotOff[name][0], p[1] + dotOff[name][1], true);
    const a = [];
    if (dots[name]) { a.push(new M.Transform(dots[name].halo, halo), new M.Transform(dots[name].d, d), out(dots[name].lb), fade(lb)); dots[name] = { halo: dots[name].halo, d: dots[name].d, lb }; }
    else { a.push(fade(halo), fade(d), fade(lb)); dots[name] = { halo, d, lb }; }
    return a;
  };
  const unplace = name => { const o = dots[name]; delete dots[name]; return o ? [out(o.halo), out(o.d), out(o.lb)] : []; };
  const pulse = (N, back) => {
    const ls = [0, 1].map(i => { const a = N.pos(0, i), b = N.pos(1, i), s0 = [a[0] + R, a[1], 0], e0 = [b[0] - R, b[1], 0];
      return new M.Line({ start: back ? e0 : s0, end: back ? s0 : e0, color: back ? C.violet : C.amber, strokeWidth: 5 }); });
    trash.push(...ls); return ls.map(f => new M.ShowPassingFlash(f, { timeWidth: 0.4 }));
  };
  const run = (k, name, a, b) => [...NN[k].value(0, 0, fmt(F[name][0]), C.cyan), ...NN[k].value(0, 1, fmt(F[name][1]), C.amber), ...pulse(NN[k], false),
    ...NN[k].value(1, 0, fmt(r2(a * F[name][0])), C.ink), ...NN[k].value(1, 1, fmt(r2(b * F[name][1])), C.ink)];

  // 18-28 training start: a = b = 2
  await until(S(18));
  await go(...setWeights(2, 2), ...setIn(1, 'A′'), ...say('START AGAIN: a = 2, b = 2', C.amber));
  await until(S(19));
  await go(...run(0, 'A', 2, 2), ...fbox(['upper: A', '→ (1, 2)']), ...say('A → UPPER ENCODER'));
  await until(S(20));
  await go(...run(1, 'A′', 2, 2), ...fbox(['lower: A′', '→ (1, 0)']), ...say('A′ → LOWER ENCODER'));
  await until(S(21));
  await go(...place('A', 1, 2), ...place('A′', 1, 0), ...fbox(['A at (1, 2)', 'A′ at (1, 0)']));
  let dS = null, dD = null;
  const setDist = (a, b, which = 3) => {
    const res = [];
    if (which & 1) {
      const g = new M.VGroup(new M.Line({ start: mp(a / 2, b), end: mp(a / 2, 0), color: C.green, strokeWidth: 4 }),
        label(fmt(b), 13, C.green, mp(a / 2, 0)[0] + 0.3, mp(0, b / 2)[1], true));
      if (dS) res.push(out(dS)); res.push(fade(g)); dS = g;
    }
    if (which & 2) {
      const g = new M.VGroup(new M.Line({ start: mp(-a / 2, b), end: mp(a / 2, b), color: C.pink, strokeWidth: 4 }),
        label(fmt(a), 13, C.pink, mp(0, b)[0], mp(0, b)[1] + 0.2, true));
      if (dD) res.push(out(dD)); res.push(fade(g)); dD = g;
    }
    return res;
  };
  await until(S(22));
  await go(...setDist(2, 2, 1), ...fbox([['same vessel: distance 2', C.green]], C.green));
  await until(S(23));
  await go(...setIn(1, 'B'), ...say('NOW A AND B, SAME TWO ENCODERS', ORANGE));
  await until(S(24));
  await go(...run(1, 'B', 2, 2), ...place('B', -1, 2), ...fbox(['A at (1, 2)', 'B at (−1, 2)']));
  await until(S(25));
  await go(...setDist(2, 2, 2), ...fbox([['same vessel: 2', C.green], ['different vessels: 2', C.pink]]));
  await until(S(26));
  await go(...fbox([['goal: A to A′ = 0', C.green], ['A to B ≥ 4', C.pink]]), ...say('MEET · AT LEAST 4 APART', C.amber));
  await until(S(27));
  await go(...fbox([['matching: 2', C.green], ['short of 4 by 2', C.pink]]));

  const CH = P ? { x: 0, y: -5.15, w: 4, h: 0.4 } : { x: 5.4, y: -1.9, w: 2.6, h: 1.0 };
  const x0 = CH.x - CH.w / 2, y0 = CH.y - CH.h / 2;
  const cp = (k, loss) => [x0 + 0.15 + k * (CH.w - 0.3) / 8, y0 + loss / 8 * CH.h, 0];
  const axes = new M.VGroup(new M.Line({ start: [x0, y0, 0], end: [x0 + CH.w, y0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [x0, y0, 0], end: [x0, y0 + CH.h + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    label('loss', 13, C.pink, x0 - 0.35, y0 + CH.h), label('step', 13, C.muted, x0 + CH.w - 0.2, y0 - 0.2));
  let last = cp(0, 8);
  const addPt = (k, loss) => { const p = cp(k, loss); const l = new M.Line({ start: last, end: p, color: C.pink, strokeWidth: 3 }); last = p;
    return [fade(l), fade(new M.Dot({ point: p, radius: 0.05, color: C.pink }))]; };
  await until(S(28));
  await go(new M.Create(axes), fade(new M.Dot({ point: cp(0, 8), radius: 0.05, color: C.pink })), ...fbox(['2 × 2 + 2 × 2', ['loss = 8', C.pink]], C.pink), ...say('LOSS = 8', C.pink));
  await until(S(29));
  await go(...fbox([['learning rate = 1/4', C.green]], C.green), ...say('SAME LEARNING RATE AS BEFORE', C.green));

  // 30-41 three slow steps; both encoders always get the same change
  const backBoth = () => [...pulse(NN[0], true), ...pulse(NN[1], true)];
  const steps = [
    { a: 3, b: 1, d: 1, loss: 2, prev: 8, beats: [30, 31, 32, 33] },
    { a: 3.5, b: 0.5, d: 0.5, loss: 0.5, prev: 2, beats: [34, 35, 36, 37] },
    { a: 3.75, b: 0.25, d: 0.25, loss: 0.125, prev: 0.5, beats: [38, 39, 40, 41] },
  ];
  for (let k = 0; k < 3; k++) {
    const st = steps[k], [b1, b2, b3, b4] = st.beats;
    await until(S(b1));
    await go(...backBoth(), ...fbox([[`a + ${fmt(st.d)}`, C.cyan], [`b − ${fmt(st.d)}`, C.amber]]), ...say('STEP ' + (k + 1) + ': BOTH ENCODERS CHANGE', C.amber));
    await until(S(b2));
    // new shared weights: BOTH encoders' outputs update at once (upper A, lower B)
    await go(...setWeights(st.a, st.b), ...run(0, 'A', st.a, st.b), ...run(1, 'B', st.a, st.b), mark(linkA, C.cyan), mark(linkB, C.amber), ...fbox([[`a = ${fmt(st.a)}`, C.cyan], [`b = ${fmt(st.b)}`, C.amber], 'in both encoders']));
    await until(S(b3));
    await go(...place('A', st.a / 2, st.b), ...place('A′', st.a / 2, 0), ...place('B', -st.a / 2, st.b), ...setDist(st.a, st.b),
      ...fbox([[`matching: ${fmt(st.b)}`, C.green], [`different: ${fmt(st.a)}`, C.pink]]));
    await until(S(b4));
    await go(...addPt(k + 1, st.loss), ...fbox([[`loss: ${fmt(st.prev)} → ${fmt(st.loss)}`, C.pink]], C.pink));
  }

  // 42-43 faster steps
  await until(S(42));
  await go(...say('MORE STEPS: a → 4, b → 0, LOSS → 0', C.green));
  for (let k = 4; k <= 8; k++) {
    const b = Math.pow(2, 1 - k), a = 4 - b, loss = 2 * b * b, ar = Math.round(a * 1000) / 1000, br = Math.round(b * 1000) / 1000;
    await go(...setWeights(ar, br), ...run(0, 'A', ar, br), ...run(1, 'B', ar, br), ...place('A', a / 2, b), ...place('A′', a / 2, 0), ...place('B', -a / 2, b), ...setDist(ar, br), ...addPt(k, loss),
      ...fbox([`step ${k}: loss ≈ ${loss.toFixed(4)}`], C.pink));
  }
  await until(S(43));
  await go(mark(linkA, C.cyan), mark(linkB, C.amber), ...say('SHARED WEIGHTS THE WHOLE TIME', C.violet));

  // 44-50 compare pictures at a = 4, b = 0
  await until(S(44));
  await go(...setWeights(4, 0), ...run(0, 'A', 4, 0), ...run(1, 'B', 4, 0), out(dS), out(dD), ...unplace('B'), ...place('A', 2, 0), ...place('A′', 2, 0), ...say('a = 4, b = 0: COMPARE PICTURES', C.amber),
    ...fbox(['upper: always A', 'lower: another picture']));
  dS = null; dD = null;
  let cmpLine = null;
  const compare = (name, x, k) => {
    const y = 0.45 + 0.4 * k;
    const g = new M.VGroup(new M.Line({ start: mp(x, y), end: mp(2, y), color: COL[name], strokeWidth: 3 }),
      label(fmt(2 - x), 13, COL[name], (mp(x, y)[0] + mp(2, y)[0]) / 2 + (x === 2 ? 0.25 : 0), mp(0, y)[1] + 0.17, true));
    const a = [fade(g)]; cmpLine = g; return a;
  };
  await until(S(45));
  await go(...setIn(1, 'A′'), ...run(0, 'A', 4, 0), ...run(1, 'A′', 4, 0), ...fbox(['A (2, 0) · A′ (2, 0)', [`distance = 0`, C.green]], C.green));
  const tableRows = [];
  const tRow = (text, color, k) => { const t = label(text, P ? 15 : 14, color, P ? -2.6 : mp(-2.4, 0)[0] + 0.45, (P ? -5.0 : -2.55) - k * 0.0, true); return t; };
  await until(S(46));
  await go(...setIn(1, 'C'), ...run(1, 'C', 4, 0), ...place('C', 1, 0), ...compare('C', 1, 0), ...fbox(['C at (1, 0)', ['A to C = 1', C.cyan]]));
  await until(S(47));
  await go(...setIn(1, 'D'), ...run(1, 'D', 4, 0), ...place('D', -1, 0), ...compare('D', -1, 1), ...fbox(['D at (−1, 0)', ['A to D = 3', ORANGE]]));
  await until(S(48));
  await go(...setIn(1, 'B'), ...run(1, 'B', 4, 0), ...place('B', -2, 0), ...compare('B', -2, 2), ...fbox(['B at (−2, 0)', ['A to B = 4', ORANGE]]));
  await until(S(49));
  await go(...fbox(['distance = larger − smaller', 'A to D: 2 − (−1) = 3']), ...say('ALL ON ONE LINE', C.cyan));
  await until(S(50));
  await go(...fbox(['A′ 0 · C 1 · D 3 · B 4', ['C is most like A', C.cyan]]), ...say('C IS CLOSEST TO A', C.cyan));

  // 51-54
  await until(S(51));
  await go(...fbox([['Siamese = the structure', C.violet], ['contrastive = how we teach', C.green]], C.violet), ...say('STRUCTURE VS TEACHING METHOD', C.violet));
  await until(S(52));
  await go(...say('FIND · COMPARE · SEARCH COLLECTIONS', C.green));
  await until(S(53));
  await go(...fbox(['small distance ≠', ['the same physical vessel', C.pink]], C.pink), ...say('NOT PROOF OF THE SAME VESSEL', C.pink));
  await until(S(54));
  await go(mark(linkA, C.cyan), mark(linkB, C.amber), ...say('SHARED WEIGHTS → COMPARE BY DISTANCE', C.violet));
}

// 19.2.10 Cross-attention: the decoder's query looks at the encoder's keys and values. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TC = { the: C.muted, red: '#ff7f6e', cup: C.amber, fell: C.violet };
  const TOK = ['the', 'red', 'cup', 'fell'];
  const KEY = [[0, 0, 0, 0], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]];
  const VAL = [[0, 0], [0, 2], [2, 0], [0, 0]];
  const Q = [2, 0, 0, 0];
  const RAW = KEY.map(k => k.reduce((s, x, i) => s + x * Q[i], 0));   // (0, 0, 2, 0)
  const SC = RAW.map(r => r / 2);                                     // (0, 0, 1, 0)
  const EX = SC.map(Math.exp), TOT = EX.reduce((a, b) => a + b, 0);
  const WT = EX.map(e => e / TOT);                                    // ≈ (0.175, 0.175, 0.475, 0.175)
  const OUT = [0, 1].map(j => VAL.reduce((s, v, i) => s + WT[i] * v[j], 0)); // ≈ (0.951, 0.350)
  const pct = v => (v * 100).toFixed(1) + '%';

  let cur = [];
  const keep = (...o) => { cur.push(...o.flat()); return o.flat(); };
  const swapCur = (a, b) => { const i = cur.indexOf(a); if (i >= 0) cur[i] = b; else cur.push(b); };
  const wipe = () => { const g = cur; cur = []; return g.length ? [new M.FadeOut(new M.VGroup(...g))] : []; };
  const fin = objs => objs.map(o => new M.FadeIn(o));
  const ind = (arr, color) => arr.map(o => new M.Indicate(o, { color }));
  const lag = (objs, rt = 1.2) => new M.LaggedStart(objs.map(o => new M.FadeIn(o)), { lagRatio: 0.15, runTime: rt });

  let boxNow = null;
  const BOX = P ? [0, -4.3, 0] : [0, -2.45, 0];
  function fbox(lines, color = C.cyan, at = BOX) {
    const size = P ? 18 : 18, lh = P ? 0.4 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.28;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const top = at[1] + ht / 2 - 0.14 - lh / 2;
    texts.forEach((t, i) => t.moveTo([at[0], top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = FW - 1.0; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOff = () => { const b = boxNow; boxNow = null; return b ? [new M.FadeOut(b)] : []; };
  function vec(vals, c, color = C.ink, o = {}) {
    const r = o.r ?? (P ? 0.14 : 0.17), g = o.g ?? (P ? 0.32 : 0.4), sz = o.sz ?? (P ? 11 : 13), n = vals.length;
    const at = j => [c[0] + (j - (n - 1) / 2) * g, c[1], 0];
    const circ = vals.map((_, j) => { const k = new M.Circle({ radius: r, color, strokeWidth: 2 }); k.setFill(C.card, 0.95); k.moveTo(at(j)); return k; });
    const txt = vals.map((v, j) => T(String(v), sz, C.ink, true).moveTo(at(j)));
    return { circ, txt, at, parts: () => [...circ, ...txt] };
  }
  const label = (s, x, y, c = C.muted, sz = P ? 13 : 15) => T(s, sz, c, true).moveTo([x, y, 0]);

  // ---- 0-6 the original sentence and the new sentence
  const PITCH = P ? 1.75 : 2.2, tx = k => (k - 1.5) * PITCH;
  const topY = P ? 1.5 : 0.9, botY = P ? -0.8 : -1.2;
  const toks = TOK.map((t, k) => pill(t, TC[t], P ? 18 : 20).moveTo([tx(k), topY, 0]));
  const itP = pill('it', C.green, P ? 18 : 20).moveTo([0, botY, 0]);
  const lab1 = label('original sentence', 0, topY - 0.6, C.muted), lab2 = label('new, shorter sentence', 0, botY - 0.6, C.green);
  await until(S(0)); await play(lag(keep(toks), 1.2), ...say('DESCRIBE A SENTENCE WITH FEWER WORDS'));
  await until(S(1)); await play(...ind(toks, C.cyan), ...say('the red cup fell'));
  await until(S(2)); await play(...fin(keep(itP)), ...say('THE NEW SENTENCE STARTS: it', C.green));
  await until(S(3)); await play(new M.Indicate(itP, { color: C.amber }), ...say('WHAT DOES it MEAN?', C.amber));
  await until(S(4)); await play(...ind(toks, C.cyan), ...say('ORIGINAL TOKENS AT THE TOP'));
  await until(S(5)); await play(new M.Indicate(itP, { color: C.green }), ...say('NEW TOKEN BELOW', C.green));
  await until(S(6)); await play(...fin(keep(lab1, lab2)), ...say('TWO SEPARATE SEQUENCES', C.violet));

  // ---- 7-9 a student writes a summary and looks back at the story
  const bookC = P ? [0, 1.0, 0] : [-3.0, -0.3, 0], stC = P ? [0, -2.0, 0] : [3.0, -0.6, 0];
  const pages = [-0.6, 0.6].map(dx => { const r = new M.Rectangle({ width: 1.2, height: 1.6, color: C.cyan, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo([bookC[0] + dx, bookC[1], 0]); return r; });
  const lines = [0, 1, 2, 3].flatMap(i => [-0.6, 0.6].map(dx => new M.Line({ start: [bookC[0] + dx - 0.38, bookC[1] + 0.45 - i * 0.3, 0], end: [bookC[0] + dx + 0.38, bookC[1] + 0.45 - i * 0.3, 0], color: C.muted, strokeWidth: 2 })));
  const head = new M.Circle({ radius: 0.17, color: C.green }); head.setFill(C.green, 1); head.moveTo([stC[0], stC[1] + 0.45, 0]);
  const body = new M.Arc({ radius: 0.32, startAngle: 0, angle: Math.PI, color: C.green }); body.setFill(C.green, 1); body.moveTo([stC[0], stC[1] + 0.05, 0]);
  const note = new M.Rectangle({ width: 1.0, height: 0.6, color: C.green, strokeWidth: 2 }); note.moveTo([stC[0], stC[1] - 0.55, 0]);
  const look = new M.DashedLine({ start: P ? [stC[0], stC[1] + 0.8, 0] : [stC[0] - 0.5, stC[1] + 0.3, 0], end: P ? [bookC[0], bookC[1] - 0.95, 0] : [bookC[0] + 1.35, bookC[1], 0], color: C.amber, strokeWidth: 3 });
  const bLab = label('story', bookC[0], bookC[1] + 1.05, C.cyan), sLab = label('short description', stC[0], stC[1] - 1.1, C.green);
  await until(S(7)); await play(...wipe(), ...fin(keep(pages, lines, head, body, note, bLab, sLab)), ...say('READ A STORY, WRITE A SHORT DESCRIPTION'));
  await until(S(8)); await play(new M.Create(look), ...say('LOOK BACK AT THE STORY', C.amber));
  keep(look);
  await until(S(9)); await play(...say('A MODEL: TWO CONNECTED NETWORKS'));

  // ---- 10-27 encoder network, keys, decoder query, cross links
  const RY = P ? [1.7, 0.95, 0.2, -0.55] : [0.9, 0.1, -0.7, -1.5];
  const ec = P ? [-2.55, (RY[0] + RY[3]) / 2, 0] : [-4.8, (RY[0] + RY[3]) / 2, 0];
  const EN = net({ layers: [4, 4], center: ec, width: P ? 0.9 : 2.2, height: RY[0] - RY[3], r: P ? 0.24 : 0.27 });
  EN.edges[0].forEach((row, i) => row.forEach((ln, j) => { if (i === j) { ln.setColor(C.cyan); ln.setStrokeWidth(4); ln.setStrokeOpacity(0.9); } else { ln.setColor(C.line); ln.setStrokeWidth(1); } }));
  TOK.forEach((t, i) => { EN.nodes[0][i].setColor(TC[t]); EN.nodes[0][i].setFill(C.card, 0.95); });
  const tokIn = TOK.map((t, i) => { const x = T(t, 15, TC[t], true), p0 = EN.pos(0, i); return x.moveTo([p0[0] - (P ? 0.24 : 0.27) - 0.1 - x.getWidth() / 2, p0[1], 0]); });
  // encoder outputs: one coloured vector per token (shown at sentence 17)
  const encOut = TOK.map((t, i) => { const c = new M.Circle({ radius: P ? 0.24 : 0.27, color: TC[t], strokeWidth: 3 }); c.setFill(TC[t], 0.45); c.moveTo(EN.pos(1, i)); return c; });
  const KX = P ? -0.85 : -2.3, VX = P ? 0.55 : -0.7, LX = P ? 0.95 : -0.2;
  const keys = KEY.map((k, i) => vec(k, [KX, RY[i], 0], C.amber));
  const vals = VAL.map((v, i) => vec(v, [VX, RY[i], 0], C.violet));
  const hdY = P ? 2.25 : 1.35;
  const encLab = label('ENCODER', ec[0], hdY, C.cyan), kLab = label('keys', KX, hdY, C.amber), vLab = label('values', VX, hdY, C.violet);
  const itC = P ? [2.9, -1.6, 0] : [3.6, -0.3, 0];
  const itN = new M.Circle({ radius: 0.32, color: C.green, strokeWidth: 3 }); itN.setFill(C.card, 0.95); itN.moveTo(itC);
  const itT = T('it', 16, C.green, true).moveTo(itC);
  const decLab = label('DECODER', itC[0], itC[1] + (P ? 0.6 : 0.65), C.green);
  const qC = P ? [0.5, -1.6, 0] : [3.6, -1.25, 0];
  const qv = vec(Q, qC, C.cyan);
  const qLab = label('query', qC[0], qC[1] - 0.38, C.cyan);
  const LS = LX + (P ? 0.9 : 1.2);
  const linkTo = (i, wv) => { const ln = new M.Line({ start: [LS, RY[i], 0], end: [itC[0] - (P ? 0.23 : 0.32), itC[1] + (P ? 0.23 : 0), 0], color: C.green, strokeWidth: 1.5 + 9 * wv }); ln.setStrokeOpacity(0.3 + 0.7 * wv); return ln; };
  const links = TOK.map((_, i) => linkTo(i, 0.15));
  await until(S(10)); await play(...wipe(), ...fin(keep(EN.group, tokIn)), ...say('NETWORK 1 READS THE SENTENCE'));
  await play(...EN.flow(0, C.cyan));
  await until(S(11)); await play(...fin(keep(encLab)), ...say('THE ENCODER', C.cyan));
  await until(S(12)); await play(...fin(keep(itN, itT)), ...say('NETWORK 2 WRITES, ONE TOKEN AT A TIME', C.green));
  await until(S(13)); await play(...fin(keep(decLab)), ...say('THE DECODER', C.green));
  await until(S(14)); await play(new M.Indicate(itN, { color: C.green }), ...say('THE DECODER NEEDS THE ENCODER\'S INFORMATION', C.green));
  await until(S(15)); await play(...say('SHARING BETWEEN 2 SEQUENCES = CROSS-ATTENTION', C.amber));
  await until(S(16)); await play(...EN.flow(0, C.cyan), new M.Flash(itN, { color: C.green }),...say('TWO NETWORKS OF CIRCLES'));
  await until(S(17)); await play(...fin(keep(encOut)), ...say('4 ENCODER VECTORS, ONE PER TOKEN'));
  await until(S(18)); await play(...fbox(['teaching example:', ['encoder outputs = the 4 original vectors', C.cyan]]));
  await until(S(19)); await play(...boxOff(), ...fin(keep(kLab, keys.flatMap(k => k.circ))), ...say('MAKE THE KEYS', C.amber));
  for (let i = 0; i < 4; i++) {
    await until(S(20 + i));
    await play(lag(keep(keys[i].txt), 0.7), new M.Indicate(encOut[i], { color: TC[TOK[i]] }), ...say(`KEY FOR ${TOK[i]} = ${KEY[i].join(', ')}`, C.amber));
  }
  await until(S(24)); await play(new M.Indicate(itN, { color: C.green }), ...say('NOW THE DECODER: it', C.green));
  await until(S(25)); await play(...fin(keep(qv.parts(), qLab)), ...say('QUERY = 2, 0, 0, 0', C.cyan));
  await until(S(26)); await play(new M.LaggedStart(links.map(l => new M.Create(l)), { lagRatio: 0.2, runTime: 1.6 }), ...say('LINK THE QUERY TO THE 4 KEYS', C.green));
  keep(links);
  await until(S(27)); await play(...say('QUERY: DECODER   KEYS: ENCODER', C.violet));

  // ---- 28-39 scores and attention weights
  const scoreAt = i => [LX + (P ? 0.45 : 0.6), RY[i], 0];
  let scoreT = [];
  const setScores = (strs, col) => { const nw = strs.map((s, i) => T(s, 15, col, true).moveTo(scoreAt(i))); const a = [...fin(nw), ...scoreT.map(t => new M.FadeOut(t))]; scoreT.forEach((t, i) => swapCur(t, nw[i])); scoreT = nw; return a; };
  const dot = i => `${KEY[i].map((k, j) => `${Q[j]}×${k}`).join(' + ')} = ${RAW[i]}`;
  await until(S(28)); await play(...fbox([['query (2, 0, 0, 0)', C.cyan], ['× each key, then add', C.amber]]), ...say('COMPARE THE QUERY WITH EACH KEY'));
  const showRaw = i => { const t = T(String(RAW[i]), 15, C.ink, true).moveTo(scoreAt(i)); scoreT[i] = t; keep(t); return [new M.FadeIn(t)]; };
  await until(S(29)); await play(...showRaw(0), ...fbox([['the:', C.muted], dot(0)]));
  await until(S(30)); await play(...showRaw(1), ...fbox([['red:', TC.red], dot(1)]));
  await until(S(31)); await play(...fbox([['cup:', TC.cup], '2×1 = 2, the rest give 0']));
  await until(S(32)); await play(...showRaw(2), ...fbox([['cup:', TC.cup], dot(2)]), ...say('SCORE FOR cup = 2', C.amber));
  await until(S(33)); await play(...showRaw(3), ...fbox([['fell:', TC.fell], dot(3)]));
  await until(S(34)); await play(...fbox(['divide each score by 2', ['2 = √4, 4 numbers in the query', C.muted]]), ...say('SCALE: ÷ 2'));
  await until(S(35)); await play(...setScores(SC.map(String), C.amber), ...fbox([['scaled scores: 0, 0, 1, 0', C.amber]]));
  await until(S(36)); await play(...fbox(['softmax: scores → shares', ['shares add up to 100%', C.muted]]), ...say('SOFTMAX', C.violet));
  await until(S(37)); await play(...setScores(WT.map(pct), C.green), new M.Indicate(scoreT[2], { color: C.amber }), ...say('cup ≈ 47.5%', C.amber));
  await until(S(38)); await play(...ind([scoreT[0], scoreT[1], scoreT[3]], C.green), ...say('EACH OTHER TOKEN ≈ 17.5%', C.green));
  const thick = links.map((ln, i) => new M.Transform(ln, linkTo(i, WT[i] * 1.6), { runTime: 1.4 }));
  await until(S(39)); await play(...thick, ...say('THE cup LINK GETS THICKER', C.amber));

  // ---- 40-47 values and the output
  await until(S(40)); await play(...boxOff(), ...fin(keep(vLab, vals.flatMap(v => v.circ))), ...say('THE ENCODER\'S VALUES', C.violet));
  await until(S(41)); await play(lag(keep(vals[0].txt, vals[1].txt), 0.8), ...say('the: 0, 0    red: 0, 2', C.violet));
  await until(S(42)); await play(lag(keep(vals[2].txt, vals[3].txt), 0.8), ...say('cup: 2, 0    fell: 0, 0', C.violet));
  const contrib = i => `${pct(WT[i])} × (${VAL[i].join(', ')}) ≈ (${VAL[i].map(v => (WT[i] * v).toFixed(3).replace(/^0\.000$/, '0')).join(', ')})`;
  await until(S(43)); await play(...ind(vals[2].circ, C.amber), ...fbox([[contrib(2), TC.cup]]));
  await until(S(44)); await play(...ind(vals[1].circ, TC.red), ...fbox([[contrib(2), TC.cup], [contrib(1), TC.red]]));
  await until(S(45)); await play(...fbox([[contrib(2), TC.cup], [contrib(1), TC.red], ['the, fell → (0, 0)', C.muted]]));
  const oC = P ? [2.6, -2.85, 0] : [5.6, -0.3, 0];
  const ov = vec(OUT.map(v => v.toFixed(3)), oC, C.green, { r: P ? 0.3 : 0.33, g: P ? 0.66 : 0.72, sz: P ? 11 : 12 });
  const oLab = P ? label('output', oC[0] - 1.45, oC[1], C.green) : label('output', oC[0], oC[1] + 0.55, C.green);
  const oLine = new M.Line({ start: P ? [itC[0], itC[1] - 0.32, 0] : [itC[0] + 0.32, itC[1], 0], end: P ? [itC[0], oC[1] + 0.3, 0] : [oC[0] - 0.75, oC[1], 0], color: C.green, strokeWidth: 3 });
  await until(S(46)); await play(new M.Create(oLine), ...fin(keep(ov.parts(), oLab)), ...fbox([['add: (0.951, 0) + (0, 0.350)', C.ink], ['= (0.951, 0.350)', C.green]], C.green));
  keep(oLine);
  await until(S(47)); await play(new M.Indicate(itN, { color: C.green }), ...ind(ov.circ, C.green), ...say('it NOW CARRIES INFORMATION FROM THE SENTENCE', C.green));

  // ---- 48-54 the formula and the idea
  await until(S(48)); await play(...say('OUR FAMILIAR ATTENTION FORMULA'));
  await until(S(49)); await play(...fbox([['output number =', C.green], 'sum of (attention weight × value number)'], C.green));
  await until(S(50)); await play(...fbox(['useful for: translating,', 'shortening a sentence'], C.cyan), ...say('TEXT FROM ANOTHER SEQUENCE'));
  await until(S(51)); await play(...fbox([['output = information', C.green], ['not the next token', C.pink]], C.pink), ...say('CAREFUL: NOT A PREDICTED TOKEN', C.pink));
  await until(S(52)); await play(...fbox([['self-attention:', C.cyan], 'Q, K, V from the SAME sequence'], C.cyan));
  await until(S(53)); await play(...fbox([['cross-attention:', C.amber], 'Q from the decoder', 'K, V from the encoder'], C.amber), new M.Indicate(qv.circ[0], { color: C.cyan }));
  await until(S(54)); await play(...ind(links, C.green), ...say('THE DECODER COLLECTS FROM THE ENCODER', C.green));
}

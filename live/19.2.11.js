// 19.2.11 Architecture families: encoder-only, decoder-only, encoder-decoder. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TC = { the: C.muted, red: '#ff7f6e', cup: C.amber, fell: C.violet };
  const TOK = ['the', 'red', 'cup', 'fell'];
  const UV = { the: [1, 0, 0, 0], red: [0, 1, 0, 0], cup: [0, 0, 1, 0], fell: [0, 0, 0, 1] };

  let cur = [];
  const keep = (...o) => { cur.push(...o.flat()); return o.flat(); };
  const wipe = () => { const g = cur; cur = []; return g.length ? [new M.FadeOut(new M.VGroup(...g))] : []; };
  const fin = objs => objs.map(o => new M.FadeIn(o));
  const ind = (arr, color) => arr.map(o => new M.Indicate(o, { color }));
  const lag = (objs, rt = 1.2) => new M.LaggedStart(objs.map(o => new M.FadeIn(o)), { lagRatio: 0.12, runTime: rt });

  let boxNow = null;
  const BOX = P ? [0, -3.2, 0] : [4.3, -0.4, 0];
  function fbox(lines, color = C.cyan, at = BOX) {
    const size = 18, lh = P ? 0.42 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.3;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const top = at[1] + ht / 2 - 0.15 - lh / 2;
    texts.forEach((t, i) => t.moveTo([at[0], top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.6; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOff = () => { const b = boxNow; boxNow = null; return b ? [new M.FadeOut(b)] : []; };
  const label = (s, x, y, c = C.muted, sz = P ? 15 : 16) => T(s, sz, c, true).moveTo([x, y, 0]);

  // attention picture: senders (left column) → receivers (right column); edges[0][i][j] = token j reads token i
  function panel(kind, c, wd, ht, r, fs) {
    const ed = kind === 'ed';
    const ec = ed ? [c[0] - wd * 0.22, c[1], 0] : c, nw = ed ? wd * 0.56 : wd;
    const N = net({ layers: [4, 4], center: ec, width: nw, height: ht, r });
    TOK.forEach((t, i) => [0, 1].forEach(l => { N.nodes[l][i].setColor(TC[t]); N.nodes[l][i].setFill(C.card, 0.95); }));
    const words = [0, 1].flatMap(l => TOK.map((t, i) => T(t, fs, TC[t], true).moveTo(N.pos(l, i))));
    N.edges[0].forEach((row, i) => row.forEach((ln, j) => { ln.setColor(C.cyan); ln.setStrokeWidth(2.5); if (kind === 'decM' && i > j) { ln.setColor(C.bg); ln.setStrokeWidth(0.5); } }));
    const out = { N, words, parts: [N.group, ...words], cross: [] };
    if (ed) {
      const ic = [c[0] + wd * 0.38, c[1], 0], rr = r * 1.2;
      const ci = new M.Circle({ radius: rr, color: C.green, strokeWidth: 3 }); ci.setFill(C.card, 0.95); ci.moveTo(ic);
      const ct = T('it', fs + 3, C.green, true).moveTo(ic);
      out.cross = [0, 1, 2, 3].map(i => { const p = N.pos(1, i); return new M.Line({ start: [p[0] + r, p[1], 0], end: [ic[0] - rr, ic[1], 0], color: C.amber, strokeWidth: 3.5 }); });
      out.it = ci; out.itT = ct; out.ic = ic; out.rr = rr;
      out.parts.push(ci, ct);
    }
    return out;
  }
  const hide = ln => { const c = ln.copy(); c.setColor(C.bg); c.setStrokeWidth(0.5); c.setStrokeOpacity(0); return new M.Transform(ln, c, { runTime: 1.2 }); };

  // ---- 0-5 one sentence, three tasks
  const PITCH = P ? 1.75 : 2.0, tx = k => (k - 1.5) * PITCH + (P ? 0 : 0.8);
  const sent = TOK.map((t, k) => pill(t, TC[t], P ? 18 : 20).moveTo([(k - 1.5) * PITCH, P ? 1.4 : 0.9, 0]));
  const TB = P ? [0, -1.4, 0] : [0, -1.3, 0];
  await until(S(0)); await play(lag(keep(sent), 1.2), ...say('3 TASKS FOR OUR SMALL MODEL'));
  await until(S(1)); await play(...ind(sent, C.cyan), ...say('SAME SENTENCE FOR EVERY TASK'));
  await until(S(2)); await play(...fbox([['1. what colour is the cup?', C.cyan]], C.cyan, TB));
  await until(S(3)); await play(...fbox([['1. what colour is the cup?', C.cyan], ['2. what is the next token?', C.violet]], C.cyan, TB));
  await until(S(4)); await play(...fbox([['1. what colour is the cup?', C.cyan], ['2. what is the next token?', C.violet], ['3. say it with fewer words', C.green]], C.cyan, TB));
  await until(S(5)); await play(...say('DIFFERENT WAYS TO SHARE INFORMATION', C.amber));

  // ---- 6-13 three copies, three students
  const RY = P ? [1.6, -0.3, -2.2] : [1.0, -0.3, -1.6];
  const copies = RY.map(y => TOK.map((t, k) => {
    const p = pill(t, TC[t], P ? 14 : 15).moveTo([tx(k), y, 0]);
    const g = 0.36, rr = 0.15;
    const cs = UV[t].flatMap((v, j) => { const x = tx(k) + (j - 1.5) * g, cy = y - 0.5; const c = new M.Circle({ radius: rr, color: TC[t], strokeWidth: 2 }); c.setFill(C.card, 0.95); c.moveTo([x, cy, 0]); return [c, T(String(v), 14, C.ink, true).moveTo([x, cy, 0])]; });
    return [p, ...cs];
  }));
  const taskLab = [['reads the whole sentence', C.cyan], ['continues, no future words', C.violet], ['writes a shorter version', C.green]]
    .map(([s, c], i) => P ? label(s, 0, RY[i] + 0.5, c, 16) : label(s, -5.0, RY[i] - 0.2, c, 17));
  await until(S(6)); await play(...wipe(), ...boxOff(), lag(keep(copies.flat(2)), 1.8), ...say('3 COPIES, SAME NUMBERS'));
  await until(S(7)); await play(...say('3 STUDENTS, SAME SENTENCE'));
  for (let i = 0; i < 3; i++) {
    await until(S(8 + i));
    await play(...fin(keep(taskLab[i])), ...ind(copies[i].map(c => c[0]), [C.cyan, C.violet, C.green][i]));
  }
  await until(S(11)); await play(...say('DIFFERENT NETWORK DESIGNS', C.amber));
  await until(S(12)); await play(...say('NETWORK DESIGN = ARCHITECTURE', C.amber));
  await until(S(13)); await play(...say('3 COMMON TRANSFORMER ARCHITECTURES', C.amber));

  // ---- 14-23 encoder-only: 16 connections
  const BIG = P ? [[0, 0.0, 0], 3.8, 3.0, 0.34, 14] : [[-1.6, -0.4, 0], 3.6, 2.7, 0.34, 15];
  const capT = (x, y, s, c) => label(s, x, y, c, 15);
  const capsFor = (c, ht) => [capT(c[0] - BIG[1] / 2, c[1] + ht / 2 + 0.55, 'gives', C.muted), capT(c[0] + BIG[1] / 2, c[1] + ht / 2 + 0.55, 'receives', C.muted)];
  const EP = panel('enc', BIG[0], BIG[1], BIG[2], BIG[3], BIG[4]);
  await until(S(14)); await play(...wipe(), ...fin(keep(EP.parts, capsFor(BIG[0], BIG[2]))), ...say('TASK 1: READ ALL 4 TOKENS TOGETHER'));
  await until(S(15)); await play(...EP.N.flow(0, C.cyan), ...say('EVERY TOKEN ← EVERY TOKEN, ITSELF TOO'));
  const into = (N, j, allowed = () => true) => N.edges[0].map(row => row[j]).filter((_, i) => allowed(i, j));
  await until(S(16)); await play(...ind(into(EP.N, 0), C.amber), new M.Indicate(EP.words[4], { color: C.amber }),...say('the ← ALL 4', C.amber));
  await until(S(17)); await play(new M.LaggedStart([1, 2, 3].map(j => new M.LaggedStart(ind(into(EP.N, j), C.amber), { lagRatio: 0.05 })), { lagRatio: 0.4, runTime: 2 }), ...say('red, cup, fell: THE SAME', C.amber));
  await until(S(18)); await play(new M.LaggedStart(EP.N.edges[0].flat().map(e => new M.Indicate(e, { color: C.cyan })), { lagRatio: 0.06, runTime: 2.6 }), ...say('4 LINES INTO EACH TOKEN'));
  await until(S(19)); await play(...fbox([['4 × 4 = 16', C.cyan], ['allowed connections', C.muted]]), ...say('16 ALLOWED CONNECTIONS'));
  await until(S(20)); await play(...ind([EP.N.edges[0][3][0], EP.N.edges[0][2][1], EP.N.edges[0][0][3]], C.green), ...say('EARLIER ↔ LATER: BOTH WAYS', C.green));
  await until(S(21)); await play(new M.Indicate(EP.N.edges[0][1][2], { color: TC.red }), new M.Indicate(EP.words[6], { color: TC.cup }),...fbox([['cup ← red', TC.red], ['the colour: red', C.ink]], C.amber), ...say('red + cup → THE COLOUR', TC.red));
  await until(S(22)); await play(...fbox([['ENCODER-ONLY', C.cyan], 'an encoder, no decoder']), ...say('ENCODER-ONLY'));
  await until(S(23)); await play(...say('GOOD FOR UNDERSTANDING TEXT, FINDING INFORMATION'));

  // ---- 24-36 decoder-only: causal mask, 10 connections
  const DP = panel('dec', BIG[0], BIG[1], BIG[2], BIG[3], BIG[4]);
  const allowed = (i, j) => i <= j;
  const blocked = DP.N.edges[0].flatMap((row, i) => row.filter((_, j) => i > j));
  await until(S(24)); await play(...wipe(), ...boxOff(), ...say('TASK 2: PREDICT THE NEXT TOKEN', C.violet));
  await until(S(25)); await play(...fin(keep(DP.parts, capsFor(BIG[0], BIG[2]))), ...say('SAME 4 TOKENS AGAIN', C.violet));
  await until(S(26)); await play(...blocked.map(hide), ...say('CAUSAL MASK: NO FUTURE TOKENS', C.pink));
  const cnt = [0, 1, 2, 3].map(j => { const p = DP.N.pos(1, j); return label(String(j + 1), p[0] + BIG[3] + 0.3, p[1], C.amber, P ? 15 : 17); });
  for (let j = 0; j < 4; j++) {
    await until(S(27 + j));
    await play(...ind(into(DP.N, j, allowed), C.amber), ...fin(keep(cnt[j])), ...say(`${TOK[j]} ← ${j + 1} TOKEN${j ? 'S' : ''}`, TC[TOK[j]]));
  }
  await until(S(31)); await play(...fbox([['1 + 2 + 3 + 4 = 10', C.violet], ['allowed connections', C.muted]], C.violet), ...say('10 ALLOWED', C.violet));
  await until(S(32)); await play(...fbox([['1 + 2 + 3 + 4 = 10', C.violet], ['16 − 10 = 6 blocked', C.pink]], C.violet), ...say('6 BLOCKED', C.pink));
  // staircase grid: row = receiver, column = giver
  const cell = P ? 0.36 : 0.38, GC = P ? [0, -3.1, 0] : [4.3, -0.4, 0];
  const grid = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const sq = new M.Square({ sideLength: cell * 0.9, color: i <= j ? C.cyan : C.muted, strokeWidth: 1.5 });
    sq.setFill(i <= j ? C.cyan : C.bg, i <= j ? 0.6 : 0.3); sq.moveTo([GC[0] + (i - 1.5) * cell, GC[1] + (1.5 - j) * cell, 0]); grid.push(sq);
  }
  const gl = label('staircase', GC[0], GC[1] + 2 * cell + 0.3, C.cyan, 14);
  await until(S(33)); await play(...boxOff(), new M.LaggedStart(grid.map(g => new M.FadeIn(g)), { lagRatio: 0.06, runTime: 1.8 }), new M.FadeIn(gl), ...say('THE STAIRCASE PATTERN'));
  keep(grid, gl);
  const downP = pill('→ down', C.green, P ? 15 : 16);
  const fp = DP.N.pos(1, 3); downP.moveTo([fp[0] + (P ? 1.3 : 1.5), fp[1] - (P ? 0.55 : 0.5), 0]);
  await until(S(34)); await play(...fin(keep(downP)), new M.Indicate(DP.words[7], { color: C.green }),...say('OUR BLOCK PREDICTS down AFTER fell', C.green));
  await until(S(35)); await play(...say('DECODER-ONLY: TEXT WITHOUT AN ENCODER', C.violet));
  await until(S(36)); await play(...say('GOOD FOR CONTINUING TEXT, ANSWERS', C.violet));

  // ---- 37-46 encoder-decoder
  const EDC = P ? [[0, 0.0, 0], 6.6, 3.0, 0.32, 13] : [[-1.2, -0.4, 0], 6.6, 2.7, 0.34, 15];
  const XP = panel('ed', EDC[0], EDC[1], EDC[2], EDC[3], EDC[4]);
  const encL = label('ENCODER (reads)', XP.N.pos(0, 0)[0] + (XP.N.pos(1, 0)[0] - XP.N.pos(0, 0)[0]) / 2, EDC[0][1] + EDC[2] / 2 + 0.55, C.cyan, 15);
  const decL = label('DECODER (writes)', XP.ic[0], XP.ic[1] + 0.75, C.green, 15);
  const EBX = P ? [0, -3.2, 0] : [4.8, -1.9, 0];
  await until(S(37)); await play(...wipe(), ...boxOff(), ...say('TASK 3: FEWER WORDS', C.green));
  await until(S(38)); await play(...fin(keep(XP.parts, encL, decL)), ...say('TWO NETWORKS: READ AND WRITE', C.green));
  await until(S(39)); await play(...XP.N.flow(0, C.cyan), ...fbox([['encoder: 16 allowed', C.cyan]], C.cyan, EBX));
  await until(S(40)); await play(new M.Flash(XP.it, { color: C.green }),...say('THE NEW SENTENCE STARTS: it', C.green));
  await until(S(41)); await play(...fbox([['encoder: 16 allowed', C.cyan], ['decoder: causal mask', C.violet], ['it ← it only', C.muted]], C.violet, EBX));
  await until(S(42)); await play(new M.LaggedStart(XP.cross.map(l => new M.Create(l)), { lagRatio: 0.25, runTime: 1.6 }), ...say('CROSS-ATTENTION: it ← ALL 4 ENCODER TOKENS', C.amber));
  keep(XP.cross);
  await until(S(43)); await play(...fbox([['1 query × 4 keys', C.amber], ['= 4 cross connections', C.amber]], C.amber, EBX));
  const itFell = pill('it fell', C.green, P ? 15 : 16).moveTo([XP.ic[0], XP.ic[1] - 0.85, 0]);
  await until(S(44)); await play(...fin(keep(itFell)), ...say('SHORTER SENTENCE: it fell', C.green));
  await until(S(45)); await play(...say('ENCODER-DECODER: BOTH NETWORKS', C.green));
  await until(S(46)); await play(...say('GOOD FOR TRANSLATING, SHORTENING TEXT', C.green));

  // ---- 47-54 three designs side by side
  const SM = P ? [[[0, 0.85, 0], 3.2], [[0, -2.25, 0], 3.2], [[0, -5.35, 0], 5.8]] : [[[-4.8, -0.2, 0], 2.5], [[-0.6, -0.2, 0], 2.5], [[4.0, -0.2, 0], 4.0]];
  const sh = P ? 1.9 : 2.0, sr = P ? 0.27 : 0.26, sf = P ? 13 : 13;
  const P1 = panel('enc', SM[0][0], SM[0][1], sh, sr, sf), P2 = panel('decM', SM[1][0], SM[1][1], sh, sr, sf), P3 = panel('ed', SM[2][0], SM[2][1], sh, sr, sf);
  const nameY = (c) => P ? c[1] + sh / 2 + 0.38 : c[1] + sh / 2 + 0.45;
  const names = [['encoder-only', C.cyan], ['decoder-only', C.violet], ['encoder-decoder', C.green]].map(([s, c], k) => label(s, SM[k][0][0], nameY(SM[k][0]), c, P ? 15 : 16));
  const cntY = c => P ? c[1] - sh / 2 - 0.38 : c[1] - sh / 2 - 0.5;
  const counts = [['4 × 4 = 16', C.cyan], ['1 + 2 + 3 + 4 = 10', C.violet], ['1 × 4 = 4', C.amber]].map(([s, c], k) => label(s, SM[k][0][0], cntY(SM[k][0]), c, P ? 16 : 17));
  await until(S(47)); await play(...wipe(), ...boxOff(), ...fin(keep(P1.parts, P2.parts, P3.parts, P3.cross, names)), ...say('3 DESIGNS SIDE BY SIDE'));
  await until(S(48)); await play(...fin(keep(counts[0])), ...ind(P1.N.edges[0].flat(), C.cyan));
  await until(S(49)); await play(...fin(keep(counts[1])), ...ind(P2.N.edges[0].flatMap((row, i) => row.filter((_, j) => i <= j)), C.violet));
  await until(S(50)); await play(...fin(keep(counts[2])), ...ind(P3.cross, C.amber));
  await until(S(51)); await play(...say('PATTERNS SHOW WHICH INFORMATION IS USED'));
  await until(S(52)); await play(...say('AN ARCHITECTURE DOES NOT GUARANTEE CORRECT ANSWERS', C.pink));
  await until(S(53)); await play(...say('THEY CAN DO MORE THAN THESE EXAMPLES', C.muted));
  await until(S(54)); await play(...ind(names, C.green), ...say('READS · GENERATES · ONE SEQUENCE FROM ANOTHER', C.green));
}

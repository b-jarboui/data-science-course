// 20.3.9 Quantization: round a group of weights to a coarse ruler with one shared scale (script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const W = [0.9, -0.4, 0.2, -0.7];
  const CX = P ? 0 : -2.6, LY = P ? 0.7 : 0.5, HALF = P ? 3.5 : 4.0, SZ = P ? 17 : 17;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const num = v => (v < -1e-9 ? '−' : '') + String(Math.round(Math.abs(v) * 10) / 10);
  let R = 1.2;                                  // the number line shows −R … R
  const wx = v => CX + v / R * HALF;

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // 0-2 a small computer, and a model too big for its memory
  const MOD = P ? { c: [0, 0.4, 0], w: 6.4, h: 1.8, cols: 18, rows: 5, gp: 0.33, gr: 0.3 }
    : { c: [CX, 0.55, 0], w: 4.6, h: 1.3, cols: 14, rows: 4, gp: 0.3, gr: 0.28 };
  const PC = P ? { c: [0, -2.6, 0], w: 4.6, h: 2.0, slot: [0, -2.3, 0], sw: 3.2, sh: 0.7 }
    : { c: [CX, -1.85, 0], w: 3.6, h: 1.5, slot: [CX, -1.6, 0], sw: 2.6, sh: 0.55 };
  const pcR = new M.RoundedRectangle({ width: PC.w, height: PC.h, cornerRadius: 0.16, color: C.muted, strokeWidth: 2 }); pcR.moveTo(PC.c);
  const slotR = new M.Rectangle({ width: PC.sw, height: PC.sh, color: C.violet, strokeWidth: 2 }); slotR.setFill(C.violet, 0.12); slotR.moveTo(PC.slot);
  const slotLab = T('memory', 18, C.violet); slotLab.moveTo(PC.slot);
  const pcLab = T('small computer', 18, C.muted); pcLab.moveTo([PC.c[0], PC.c[1] - PC.h / 2 + 0.3, 0]);
  await until(S(0)); await play(new M.FadeIn(pcR), new M.FadeIn(slotR), new M.FadeIn(slotLab), new M.FadeIn(pcLab), ...say('A SMALL, CHEAP COMPUTER'));

  const modelR = new M.RoundedRectangle({ width: MOD.w, height: MOD.h, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  modelR.setFill(C.cyan, 0.08); modelR.moveTo(MOD.c);
  const modelLab = T('model', 18, C.cyan, false, true);
  modelLab.moveTo(P ? [0, MOD.c[1] + MOD.h / 2 + 0.3, 0] : [CX - MOD.w / 2 - 0.55, MOD.c[1], 0]);
  const slotTop = PC.slot[1] + PC.sh / 2, modBot = MOD.c[1] - MOD.h / 2;
  const guides = [-1, 1].map(d => new M.DashedLine({ start: [PC.slot[0] + d * PC.sw / 2, slotTop, 0], end: [PC.slot[0] + d * PC.sw / 2, modBot, 0], color: C.violet }));
  await until(S(1));
  await play(new M.FadeIn(modelR), new M.FadeIn(modelLab), ...guides.map(g => new M.Create(g)), ...say('MODEL TOO BIG FOR THE MEMORY', C.pink));
  await play(new M.Indicate(modelR, { color: C.pink }));
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(...guides)), ...say('SMALLER, WITHOUT TRAINING AGAIN?', C.amber));

  // 3-5 the model is made of weights; a group of four
  const grid = [];
  for (let r = 0; r < MOD.rows; r++) for (let c = 0; c < MOD.cols; c++) {
    const b = new M.Rectangle({ width: MOD.gp * 0.7, height: MOD.gr * 0.7, color: C.cyan, strokeWidth: 1 }); b.setFill(C.cyan, 0.45);
    b.moveTo([MOD.c[0] + (c - (MOD.cols - 1) / 2) * MOD.gp, MOD.c[1] + ((MOD.rows - 1) / 2 - r) * MOD.gr, 0]);
    grid.push(b);
  }
  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(pcR, slotR, slotLab, pcLab)), new M.LaggedStart(grid.map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 1.8 }), ...fbox(['weights =', ['numbers it learned', C.cyan]]), ...say('WEIGHTS = NUMBERS IT LEARNED'));
  const four = grid.slice(0, 4);
  await until(S(4));
  four.forEach(b => { b.setFill(C.amber, 0.9); b.setColor(C.amber); });
  await play(new M.LaggedStart(four.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }), ...fbox([['a group of', C.amber], ['just 4 weights', C.amber]], C.amber), ...say('A GROUP OF JUST 4 WEIGHTS', C.amber));
  const nums = W.map((v, i) => { const t = T(num(v), 30, C.amber, true, true); t.moveTo([MOD.c[0] + (i - 1.5) * (P ? 1.7 : 1.5), P ? -1.8 : -1.4, 0]); return t; });
  for (let i = 0; i < 4; i++) {
    await until(S(5) + i * 1.45);
    await play(new M.FadeIn(nums[i]), ...(i ? [] : say('THE 4 WEIGHTS', C.amber)));
  }

  // 6 dots on a number line, zero in the middle
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(modelR, modelLab, ...grid, ...nums)), ...say('DOTS ON A LINE, 0 IN THE MIDDLE'));
  const line = new M.Line({ start: [wx(-R), LY, 0], end: [wx(R), LY, 0], color: C.muted, strokeWidth: 3 });
  const baseT = [-1, 0, 1].map(v => new M.Line({ start: [wx(v), LY - 0.08, 0], end: [wx(v), LY + 0.08, 0], color: C.muted }));
  const baseL = [-1, 0, 1].map(v => { const t = T(num(v), 16, C.muted, true); t.moveTo([wx(v), LY - 0.3, 0]); return t; });
  const dots = W.map(v => new M.Dot({ point: [wx(v), LY, 0], radius: 0.1, color: C.cyan }));
  const dlabs = W.map(v => { const t = T(num(v), SZ, C.cyan, true); t.moveTo([wx(v), LY + 0.48, 0]); return t; });
  await play(new M.Create(line), ...baseT.map(t => new M.FadeIn(t)), ...baseL.map(t => new M.FadeIn(t)),
    new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 1.4 }),
    new M.LaggedStart(dlabs.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 1.4 }));

  // 7-8 bits and patterns
  const BR = P ? { lx: -3.3, x0: -2.15, dx: 0.72, ys: [-1.3, -2.0, -2.7], size: 15 } : { lx: -6.1, x0: -4.9, dx: 0.8, ys: [-1.35, -1.95, -2.55], size: 17 };
  const bitRow = n => {
    const y = BR.ys[n - 1], lab = T(n === 1 ? '1 bit' : `${n} bits`, 17, C.muted); lab.moveTo([BR.lx, y, 0]);
    const tiles = Array.from({ length: 2 ** n }, (_, i) => { const t = T(i.toString(2).padStart(n, '0'), BR.size, C.cyan, true); t.moveTo([BR.x0 + i * BR.dx, y, 0]); return t; });
    return { lab, tiles };
  };
  const rows = [1, 2, 3].map(bitRow);
  const showRow = r => [new M.FadeIn(r.lab), new M.LaggedStart(r.tiles.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.0 })];
  await until(S(7)); await play(...showRow(rows[0]), ...say('A BIT = A SINGLE 0 OR 1'));
  await until(S(8)); await play(new M.LaggedStart(rows[0].tiles.map(t => new M.Indicate(t)), { lagRatio: 0.3, runTime: 0.9 }), ...fbox(['1 bit  → 2 patterns']), ...say('MORE BITS, MORE PATTERNS'));
  await until(S(8) + 1.7); await play(...showRow(rows[1]), ...fbox(['1 bit  → 2 patterns', '2 bits → 4 patterns']));
  await until(S(8) + 3.4); await play(...showRow(rows[2]), ...fbox(['1 bit  → 2 patterns', '2 bits → 4 patterns', ['3 bits → 8 patterns', C.amber]]));

  // 9-10 memory: 16 bits per weight, 64 in total
  const MX = P ? -2.4 : CX - 1.6, MY = P ? -1.3 : -1.35, MDY = P ? 0.3 : 0.26, CP = 0.2;
  const rowY = r => MY - r * MDY;
  const cellAt = (r, j, color) => { const b = new M.Rectangle({ width: CP * 0.75, height: MDY * 0.66, color, strokeWidth: 1 }); b.setFill(color, 0.82); b.moveTo([MX + (j + 0.5) * CP, rowY(r), 0]); return b; };
  const tag = (s, r, color, x = MX + 16 * CP + 0.5) => { const t = T(s, 16, color, true); t.moveTo([x, rowY(r), 0]); return t; };
  const totalLab = s => { const t = T(s, 20, C.amber, true, true); t.moveTo([MX + 16 * CP + 1.75, MY - 1.5 * MDY, 0]); return t; };
  let memRows = W.map((_, r) => Array.from({ length: 16 }, (_, j) => cellAt(r, j, C.cyan)));
  const memLabs = W.map((v, r) => { const t = T(num(v), 16, C.muted, true); t.moveTo([MX - 0.42, rowY(r), 0]); return t; });
  const tags16 = W.map((_, r) => tag('16 bits', r, C.muted));
  await until(S(9));
  await play(new M.FadeOut(new M.VGroup(...rows.flatMap(r => [r.lab, ...r.tiles]))), ...fbox(['1 weight = 16 bits']), ...say('16 BITS FOR EACH WEIGHT'));
  await play(...memLabs.map(t => new M.FadeIn(t)), ...tags16.map(t => new M.FadeIn(t)),
    new M.LaggedStart(memRows.map(row => new M.LaggedStart(row.map(b => new M.FadeIn(b)), { lagRatio: 0.1 })), { lagRatio: 0.2, runTime: 1.8 }));
  const total64 = totalLab('64 bits');
  await until(S(10)); await play(new M.FadeIn(total64), ...fbox(['4 weights × 16 bits', ['= 64 bits', C.amber]]), ...say('64 BITS IN TOTAL', C.amber));

  // 11-14 the idea, and a ruler with 3 bits: marks −3 … 3
  await until(S(11)); await play(...say('ROUND TO A COARSE RULER', C.amber));
  await until(S(12)); await play(...say('STORE ONLY WHICH MARK', C.amber));
  await until(S(13)); await play(...fbox(['3 bits → 8 patterns']), ...say('A RULER WITH 3 BITS', C.amber));
  const KS = [-3, -2, -1, 0, 1, 2, 3];
  const mtick = x => new M.Line({ start: [x, LY - 0.17, 0], end: [x, LY + 0.17, 0], color: C.amber, strokeWidth: 3 });
  const mlab = (k, x) => { const t = T(num(k), SZ, C.amber, true); t.moveTo([x, LY - 0.64, 0]); return t; };
  const val = v => { const t = T(num(v), SZ, C.ink, true); t.moveTo([wx(v), LY - 0.98, 0]); return t; };
  const ticks = KS.map(k => mtick(wx(k * 0.2)));
  let idx = KS.map(k => mlab(k, wx(k * 0.2)));
  await until(S(14));
  await play(new M.LaggedStart(ticks.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.4 }),
    new M.LaggedStart(idx.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox(['marks −3 … 3 = 7 marks', ['7 marks fit in 8 patterns', C.amber]]), ...say('7 MARKS: −3 TO 3', C.amber));

  // 15-18 one shared scale: mark 3 must land on 0.9, so scale = 0.3
  const bracket = (x0, x1) => new M.Line({ start: [x0, LY - 0.98, 0], end: [x1, LY - 0.98, 0], color: C.violet, strokeWidth: 4 });
  const brLabel = v => { const t = T('scale', 17, C.violet); t.moveTo([wx(v / 2), LY - 1.26, 0]); return t; };
  const br = bracket(wx(0), wx(0.2));
  let brLab = brLabel(0.2);
  await until(S(15)); await play(new M.Create(br), new M.FadeIn(brLab), ...say('ONE SHARED STEP: THE SCALE', C.violet));
  await until(S(16)); await play(new M.Indicate(dots[0], { color: C.amber }), new M.Indicate(dlabs[0], { color: C.amber }),
    new M.Indicate(ticks[6]), new M.Indicate(idx[6]), ...say('LARGEST 0.9: PUT MARK 3 ON IT', C.amber));
  const idx3 = KS.map(k => mlab(k, wx(k * 0.3))), brLab3 = brLabel(0.3);
  await until(S(17));
  await play(...KS.map((k, i) => new M.Transform(ticks[i], mtick(wx(k * 0.3)))), new M.Transform(br, bracket(wx(0), wx(0.3))),
    new M.FadeOut(new M.VGroup(...idx, brLab)), ...idx3.map(t => new M.FadeIn(t)), new M.FadeIn(brLab3),
    ...fbox(['3 × scale = 0.9', ['scale = 0.9 ÷ 3 = 0.3', C.amber]]), ...say('SCALE = 0.3', C.amber));
  idx = idx3; brLab = brLab3;
  await play(new M.Flash(dots[0], { color: C.amber }));
  const vals = KS.map(k => val(k * 0.3));
  await until(S(18)); await play(new M.FadeOut(new M.VGroup(br, brLab)), new M.LaggedStart(vals.map(v => new M.FadeIn(v)), { lagRatio: 0.3, runTime: 3.5 }), ...say('MARKS: −0.9 … 0.9'));

  // 19-23 round each weight to its nearest mark
  // amber dot = rounded value, pink bar = rounding error, pink number = its size
  function rounding(v, scale, q, labelled = true) {
    const code = Math.max(-q, Math.min(q, Math.round(v / scale)));
    const back = Math.round(code * scale * 10) / 10, err = Math.round(Math.abs(v - back) * 10) / 10;
    const rdot = new M.Dot({ point: [wx(back), LY, 0], radius: 0.07, color: C.amber });
    const seg = err > 0 ? new M.Line({ start: [wx(v), LY + 0.2, 0], end: [wx(back), LY + 0.2, 0], color: C.pink, strokeWidth: 5 }) : null;
    const lab = labelled ? T(num(err), 16, C.pink, true) : null;
    if (lab) lab.moveTo([wx((v + back) / 2), LY + 0.86, 0]);
    const parts = [rdot, seg, lab].filter(Boolean);
    const anims = [new M.FadeIn(rdot), ...(seg ? [new M.Create(seg)] : []), ...(lab ? [new M.FadeIn(lab)] : [])];
    return { code, back, err, seg, lab, rdot, parts, anims };
  }
  await until(S(19)); await play(...say('ROUND TO THE NEAREST MARK', C.amber));
  const r3 = [];
  for (let i = 0; i < 4; i++) {
    await until(S(20 + i));
    const r = rounding(W[i], 0.3, 3); r3.push(r);
    const flash = r.err ? [] : [new M.Flash(dots[i], { color: C.amber })];
    await play(...r.anims, ...flash, ...fbox([`${num(W[i])} → mark ${num(r.code)}`, `mark ${num(r.code)} = ${num(r.back)}`, [`error = ${num(r.err)}`, C.pink]]));
  }

  // 24-26 the error, its total, the storage
  const segs3 = r3.filter(r => r.seg).map(r => r.seg);
  await until(S(24)); await play(new M.LaggedStart(segs3.map(g => new M.Indicate(g, { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('ERROR = DISTANCE TO ROUNDED VALUE', C.pink));
  await until(S(25)); await play(new M.LaggedStart(r3.map(r => new M.Indicate(r.lab, { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }),
    ...fbox(['0 + 0.1 + 0.1 + 0.1', ['total error = 0.3', C.pink]]), ...say('TOTAL ERROR = 0.3', C.pink));
  await until(S(26));
  memRows.forEach(row => row.slice(0, 3).forEach(b => { b.setFill(C.amber, 0.9); b.setColor(C.amber); }));
  const tags3 = W.map((_, r) => tag(`mark ${num(r3[r].code)}`, r, C.amber, MX + 3 * CP + 0.6));
  const scaleRow = Array.from({ length: 16 }, (_, j) => cellAt(4, j, C.violet));
  const scaleLab = T('scale', 16, C.violet); scaleLab.moveTo([MX - 0.42, rowY(4), 0]);
  const scaleTag = tag('16 bits', 4, C.muted);
  const total28 = totalLab('28 bits');
  await play(new M.FadeOut(new M.VGroup(...memRows.flatMap(row => row.slice(3)), ...tags16, total64)), ...tags3.map(t => new M.FadeIn(t)),
    new M.LaggedStart(scaleRow.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.2 }), new M.FadeIn(scaleLab), new M.FadeIn(scaleTag), new M.FadeIn(total28),
    ...fbox(['4 marks × 3 bits = 12', '+ 16 for the scale', ['= 28 bits (was 64)', C.amber]]), ...say('28 BITS INSTEAD OF 64', C.amber));
  memRows = memRows.map(row => row.slice(0, 3));

  // 27-29 an even coarser ruler: 2 bits, marks −1, 0, 1, scale 0.9
  // the 2-bit storage is built while rounding: the old 3-bit marks and their total go now
  await until(S(27)); await play(new M.FadeOut(new M.VGroup(...r3.flatMap(r => r.parts), ...memRows.map(row => row[2]), ...tags3, total28)), ...fbox(['2 bits → 4 patterns']), ...say('EVEN COARSER: 2 BITS', C.amber));
  memRows = memRows.map(row => row.slice(0, 2));
  const tags2 = [];
  const gone = [0, 1, 5, 6];
  await until(S(28)); await play(new M.FadeOut(new M.VGroup(...gone.map(i => ticks[i]), ...gone.map(i => idx[i]), ...vals)),
    ...fbox(['2 bits → 4 patterns', ['3 marks: −1, 0, 1', C.amber]]), ...say('3 MARKS: −1, 0, 1', C.amber));
  const im = mlab(-1, wx(-0.9)), ip = mlab(1, wx(0.9)), vals2 = [-0.9, 0, 0.9].map(val);
  await until(S(29));
  await play(new M.Transform(ticks[2], mtick(wx(-0.9))), new M.Transform(ticks[4], mtick(wx(0.9))), new M.FadeOut(new M.VGroup(idx[2], idx[4])),
    new M.FadeIn(im), new M.FadeIn(ip), new M.LaggedStart(vals2.map(v => new M.FadeIn(v)), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['1 × scale = 0.9', ['scale = 0.9', C.amber]]), ...say('SCALE = 0.9', C.amber));

  // 30-33 round again
  const r2 = [];
  for (let i = 0; i < 4; i++) {
    await until(S(30 + i));
    const r = rounding(W[i], 0.9, 1); r2.push(r);
    const flash = r.err ? [] : [new M.Flash(dots[i], { color: C.amber })];
    tags2.push(tag(`mark ${num(r.code)}`, i, C.amber, MX + 2 * CP + 0.6));
    await play(...r.anims, ...flash, new M.FadeIn(tags2[i]), ...fbox([`${num(W[i])} → ${num(r.back)}`, [`error = ${num(r.err)}`, C.pink]]));
  }

  // 34-35 total error 0.8, storage 24 bits, the comparison
  await until(S(34)); await play(...fbox(['0 + 0.4 + 0.2 + 0.2', ['total error = 0.8', C.pink]]), ...say('TOTAL ERROR = 0.8', C.pink));
  await until(S(34) + 3.3);
  const total24 = totalLab('24 bits');
  await play(new M.FadeIn(total24),
    ...fbox(['4 marks × 2 bits = 8', '+ 16 for the scale', ['= 24 bits', C.amber]]));
  await until(S(35)); await play(...fbox(['3 bits: 28 bits', '  error 0.3', '2 bits: 24 bits', '  error 0.8', ['error × 2.7', C.pink]]), ...say('4 BITS SAVED, ~3× THE ERROR', C.pink));

  // 36-38 the name and the two formulas
  await until(S(36)); await play(new M.LaggedStart(r2.map(r => new M.Indicate(r.rdot, { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }), ...say('THIS IS QUANTIZATION', C.green));
  await until(S(37)); await play(...fbox(['stored mark =', ['  round(weight ÷ scale)', C.amber]], C.green), ...say('WEIGHT → STORED MARK', C.green));
  await until(S(38)); await play(...fbox(['stored mark =', ['  round(weight ÷ scale)', C.amber], 'approx. weight =', ['  mark × scale', C.green]], C.green), ...say('STORED MARK → WEIGHT', C.green));

  // 39-42 what it is for
  await until(S(39)); await play(...say('WHAT IS IT FOR?', C.violet));
  await until(S(40)); await play(new M.Indicate(total24, { color: C.green }), ...say('SMALLER MODEL, OFTEN FASTER', C.green));
  await until(S(41)); await play(new M.LaggedStart(r2.map(r => new M.Indicate(r.lab, { color: C.pink })), { lagRatio: 0.25, runTime: 1.4 }), ...say('PRICE: A MEASURED ROUNDING ERROR', C.pink));
  await until(S(42)); await play(...say('TEST IT: ANSWERS BARELY CHANGE', C.green));

  // 43-47 the trap: one unusual weight (3 instead of 0.9) stretches the scale to 1
  await until(S(43)); await play(...say('TRAP: ONE UNUSUAL WEIGHT', C.pink));
  await until(S(44));
  await play(new M.FadeOut(new M.VGroup(line, ...baseT, ...baseL, ...dots, ...dlabs, ticks[2], ticks[3], ticks[4], idx[3], im, ip, ...vals2,
    ...r2.flatMap(r => r.parts), ...memRows.flat(), ...memLabs, ...tags2, ...scaleRow, scaleLab, scaleTag, total24)),
    ...fbox(['weights: 3, −0.4, 0.2, −0.7']), ...say('WHAT IF 0.9 WERE 3?', C.pink));
  R = 3.3;
  const W2 = [3, -0.4, 0.2, -0.7];
  const line2 = new M.Line({ start: [wx(-R), LY, 0], end: [wx(R), LY, 0], color: C.muted, strokeWidth: 3 });
  const baseT2 = [-3, 0, 3].map(v => new M.Line({ start: [wx(v), LY - 0.08, 0], end: [wx(v), LY + 0.08, 0], color: C.muted }));
  const baseL2 = [-3, 0, 3].map(v => { const t = T(num(v), 15, C.muted, true); t.moveTo([wx(v), LY - 0.3, 0]); return t; });
  const dots2 = W2.map((v, i) => new M.Dot({ point: [wx(v), LY, 0], radius: 0.1, color: i ? C.cyan : C.pink }));
  const dlabs2 = W2.map((v, i) => { const t = T(num(v), SZ, i ? C.cyan : C.pink, true); t.moveTo([wx(v), LY + (i === 1 ? 0.84 : 0.48), 0]); return t; });
  await play(new M.Create(line2), ...baseT2.map(t => new M.FadeIn(t)),
    new M.LaggedStart(dots2.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 1.2 }),
    new M.LaggedStart(dlabs2.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 1.2 }));
  await play(new M.Flash(dots2[0], { color: C.pink }));
  const ticksB = KS.map(k => mtick(wx(k))), idxB = KS.map(k => mlab(k, wx(k)));
  await until(S(45));
  await play(new M.LaggedStart(ticksB.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.2 }),
    new M.LaggedStart(idxB.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox(['3 × scale = 3', ['scale = 1', C.amber]]), ...say('SCALE = 1', C.amber));
  const rB = [1, 2, 3].map(i => rounding(W2[i], 1, 3, false));
  await until(S(46)); await play(...rB[0].anims, ...rB[1].anims, ...fbox(['−0.4 → 0, error 0.4', '0.2 → 0, error 0.2']));
  await until(S(46) + 1.9); await play(...rB[2].anims, ...fbox(['−0.4 → 0, error 0.4', '0.2 → 0, error 0.2', '−0.7 → −1, error 0.3']));
  await until(S(47)); await play(new M.LaggedStart(rB.map(r => new M.Indicate(r.seg, { color: C.pink })), { lagRatio: 0.3, runTime: 1.5 }),
    ...fbox(['0.4 + 0.2 + 0.3', ['= 0.9 (before: 0.3)', C.pink]], C.pink), ...say('3× THE ERROR', C.pink));

  // 48-49 small groups, recap
  await until(S(48)); await play(new M.Indicate(dots2[0], { color: C.pink }), ...fbox([['each small group:', C.ink], ['its own scale', C.green]], C.green), ...say('SMALL GROUPS, EACH ITS OWN SCALE', C.green));
  await until(S(49)); await play(...fbox(['mark =', '  round(weight ÷ scale)', 'weight ≈ mark × scale', ['few values,', C.amber], ['one shared scale', C.amber]], C.green), ...say('FEW VALUES, ONE SCALE', C.green));
}

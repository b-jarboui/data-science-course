// 20.3.6 Nucleus sampling: keep the top tokens until their probabilities reach p (live version, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const A = [['at', 45], ['on', 30], ['soon', 15], ['late', 6], ['purple', 4]];
  const B = [['nine', 40], ['ten', 30], ['noon', 30]];
  const D = [['Monday', 80], ['time', 20]];
  const CX = P ? 0 : -2.6;
  const LX = P ? -2.45 : -5.5, BX = P ? -2.25 : -5.3, BL = P ? 4.5 : 4.4, BH = P ? 0.42 : 0.34;
  const ROW0 = P ? 1.15 : 1.1, RG = P ? 0.8 : 0.6, TY = P ? -3.2 : -2.3;
  const PILL = P ? [0, 1.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.3, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const rowY = j => ROW0 - j * RG, px = v => BX + v / 100 * BL;

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
    const maxw = P ? FW - 0.6 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function unbox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // chance bars: token name | glowing bar | percent
  function bar(v, y, color = C.violet, x = BX) {
    const w = Math.max(0.04, v / 100 * BL);
    const b = new M.Rectangle({ width: w, height: BH, color, strokeWidth: 1 }); b.setFill(color, 0.82); b.moveTo([x + w / 2, y, 0]);
    return b;
  }
  function word(s, j) { const t = T(s, 20, C.ink, true); t.moveTo([LX - t.getWidth() / 2, rowY(j), 0]); return t; }
  function pct(v, j) { const t = T(`${v}%`, 18, C.ink, true); t.moveTo([px(v) + 0.12 + t.getWidth() / 2, rowY(j), 0]); return t; }
  const rows = (list, color = C.violet, order) => list.map(([w, v], k) => {
    const j = order ? order[k] : k;
    return { w, v, j, lab: word(w, j), bar: bar(v, rowY(j), color), pct: pct(v, j) };
  });
  const parts = rs => rs.flatMap(r => [r.lab, r.bar, r.pct]);
  const tint = (r, color) => { r.bar.setFill(color, 0.82); r.bar.setColor(color); };
  const fadeAll = (ms, runTime = 1.2) => new M.LaggedStart(ms.map(m => new M.FadeIn(m)), { lagRatio: 0.15, runTime });

  // running-total bar with the target mark
  function frame() {
    const f = new M.Rectangle({ width: BL, height: BH + 0.1, color: C.muted, strokeWidth: 2 }); f.moveTo([BX + BL / 2, TY, 0]);
    const cap = T('running total', 19, C.muted); cap.moveTo([BX + cap.getWidth() / 2, TY + 0.5, 0]);
    return [f, cap];
  }
  function target(p) {
    const x = px(p), ln = new M.DashedLine({ start: [x, TY - 0.34, 0], end: [x, TY + 0.34, 0], color: C.amber });
    const t = T(`${p}%`, 19, C.amber, true); t.moveTo([x, TY - 0.55, 0]);
    return [ln, t];
  }
  let segs = [], run = 0;
  function add(r) {
    const s0 = bar(r.v, rowY(r.j), C.cyan), s1 = bar(r.v, TY, C.cyan, px(run));
    run += r.v; segs.push(s0);
    return new M.Transform(s0, s1);
  }
  const cutAt = j => new M.DashedLine({ start: [LX - 1.0, rowY(j) - RG / 2, 0], end: [px(100), rowY(j) - RG / 2, 0], color: C.amber });

  // 0-2 top-k keeps a fixed number; after "at" it dropped noon
  const k0 = rows(A, C.cyan); k0.slice(2).forEach(r => tint(r, C.pink));
  await until(S(0)); await play(fadeAll(parts(k0), 1.4), ...say('TOP-K: KEEP A FIXED NUMBER', C.violet), ...fbox(['top-k, k = 2', ['always keep 2 tokens', C.violet]], C.violet));
  const tk = rows(B, C.cyan); tint(tk[2], C.pink);
  await until(S(1)); await play(new M.FadeOut(new M.VGroup(...parts(k0))), fadeAll(parts(tk), 1.4), ...say('AFTER “…OPEN AT”: NOON DROPPED', C.pink),
    ...fbox(['after "…open at"', 'top-2 keeps nine, ten', ['noon 30% = ten 30%', C.pink]], C.pink));
  await until(S(1) + 2.6); await play(new M.Indicate(tk[1].bar, { color: C.amber }), new M.Indicate(tk[2].bar, { color: C.amber }));
  await until(S(2)); await play(...say('CAN THE KEPT NUMBER ADAPT?', C.amber));

  // 3-4 the idea: cover enough of the chance; target 75%
  let [fr, cap] = frame();
  await until(S(3)); tk.forEach(r => tint(r, C.violet));
  await play(...fbox(['keep the top tokens', ['until they add up', C.amber], ['to enough', C.amber]], C.amber), new M.Create(fr), new M.FadeIn(cap),
    ...say('KEEP TOP TOKENS UNTIL THEY ADD UP TO ENOUGH'));
  const [t75, l75] = target(75);
  await until(S(4)); await play(new M.Create(t75), new M.FadeIn(l75), ...say('TARGET: 75%', C.amber), ...fbox([['target = 75%', C.amber]], C.amber));

  // 5-7 first step: the bars, sorted
  const rA = rows(A, C.violet, [2, 0, 4, 3, 1]);
  await until(S(5)); await play(new M.FadeOut(new M.VGroup(...parts(tk))), fadeAll(parts(rA), 1.6), ...say('AFTER “THE LIBRARY WILL OPEN”'), ...fbox(['after "…will open"', ['target = 75%', C.amber]]));
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(...rA.flatMap(r => [r.lab, r.pct]))),
    ...rA.map((r, k) => new M.Transform(r.bar, bar(r.v, rowY(k)), { pathArc: 0.6 })), ...say('SORT: MOST LIKELY FIRST'));
  rA.forEach((r, k) => { r.j = k; r.lab = word(r.w, k); r.pct = pct(r.v, k); });
  await play(fadeAll(rA.flatMap(r => [r.lab, r.pct]), 0.8));
  await until(S(7)); await play(new M.LaggedStart(rA.map(r => new M.Indicate(r.bar, { color: C.amber })), { lagRatio: 0.6, runTime: Math.max(3, E(7) - S(7) - 0.4) }),
    ...say('AT 45 · ON 30 · SOON 15 · LATE 6 · PURPLE 4', C.muted));

  // 8-11 the running total, one token at a time
  await until(S(8)); await play(...say('ADD FROM THE TOP: RUNNING TOTAL', C.amber), ...fbox(['after "…will open"', ['running total = 0', C.amber], 'target = 75']));
  await until(S(9)); tint(rA[0], C.cyan);
  await play(add(rA[0]), ...fbox(['running total', ['45', C.amber], '45 < 75: not yet']), ...say('AT: 45 · NOT YET', C.amber));
  await until(S(10)); tint(rA[1], C.cyan);
  await play(add(rA[1]), ...fbox(['running total', ['45 + 30 = 75', C.amber], ['75 reaches 75', C.green]], C.green), ...say('ON: 75 · TARGET REACHED', C.green));
  await play(new M.Indicate(t75, { color: C.green }));
  const cut = cutAt(1);
  await until(S(11)); rA.slice(2).forEach(r => tint(r, C.pink));
  await play(new M.Create(cut), ...say('KEEP AT, ON · DROP SOON, LATE, PURPLE', C.pink));
  await until(S(11) + 2.6); await play(new M.FadeOut(new M.VGroup(...parts(rA.slice(2)))));

  // 12 share the kept chances again
  const p60 = pct(60, 0), p40 = pct(40, 1);
  await until(S(12));
  await play(new M.Transform(rA[0].bar, bar(60, rowY(0), C.cyan)), new M.Transform(rA[1].bar, bar(40, rowY(1), C.cyan)),
    new M.FadeOut(new M.VGroup(rA[0].pct, rA[1].pct, cut, ...segs)), new M.FadeIn(p60), new M.FadeIn(p40),
    ...say('SHARE AGAIN: 60% AND 40%'), ...fbox(['share again', '45 ÷ 75 = 60%', '30 ÷ 75 = 40%']));
  segs = []; run = 0;

  // 13-19 after "at": nine, ten, noon
  const rB = rows(B);
  await until(S(13)); await play(new M.FadeOut(new M.VGroup(rA[0].lab, rA[0].bar, p60, rA[1].lab, rA[1].bar, p40)),
    ...say('AFTER “…OPEN AT”: WHERE TOP-K FAILED', C.amber), ...fbox(['after "…open at"', ['target = 75%', C.amber]], C.amber));
  await play(fadeAll(parts(rB), 1.2));
  await until(S(14)); await play(new M.LaggedStart(rB.map(r => new M.Indicate(r.bar, { color: C.violet })), { lagRatio: 0.6, runTime: Math.max(1.5, E(14) - S(14) - 0.4) }), ...say('NINE 40 · TEN 30 · NOON 30', C.muted));
  await until(S(15)); tint(rB[0], C.cyan);
  await play(add(rB[0]), ...fbox(['running total', ['40', C.amber], '40 < 75: not yet']), ...say('NINE: 40 · NOT YET', C.amber));
  await until(S(16)); tint(rB[1], C.cyan);
  await play(add(rB[1]), ...fbox(['running total', ['40 + 30 = 70', C.amber], '70 < 75: not yet']), ...say('TEN: 70 · STILL NOT 75', C.amber));
  await until(S(17)); tint(rB[2], C.cyan);
  await play(add(rB[2]), ...fbox(['running total', ['70 + 30 = 100', C.amber], ['100 reaches 75', C.green]], C.green), ...say('NOON: 100 · REACHED', C.green));
  await play(new M.Indicate(t75, { color: C.green }));
  await until(S(18)); await play(new M.Indicate(rB[2].bar, { color: C.green }), ...say('KEEP ALL 3 · NOON SURVIVES', C.green));
  await until(S(19)); await play(...fbox(['share again', 'total = 100 already', ['40, 30, 30: no change', C.cyan]]), ...say('PROBABILITIES STAY 40 · 30 · 30'));

  // 20-24 after "on": Monday leads
  await until(S(20)); await play(new M.FadeOut(new M.VGroup(...parts(rB), ...segs)), ...say('AFTER “…OPEN ON”', C.amber),
    ...fbox(['after "…open on"', ['target = 75%', C.amber]], C.amber));
  segs = []; run = 0;
  const rD = rows(D);
  await until(S(21)); await play(fadeAll(parts(rD), 1.2), ...say('MONDAY 80 · TIME 20', C.muted));
  await until(S(22)); tint(rD[0], C.cyan);
  await play(add(rD[0]), ...fbox(['running total', ['80', C.amber], ['80 reaches 75', C.green]], C.green), ...say('MONDAY ALONE REACHES 75', C.green));
  await play(new M.Indicate(t75, { color: C.green }));
  const cut2 = cutAt(0);
  await until(S(23)); tint(rD[1], C.pink);
  await play(new M.Create(cut2), ...say('KEEP MONDAY · DROP TIME', C.pink));
  await until(S(23) + 2.0); await play(new M.FadeOut(new M.VGroup(...parts([rD[1]]))));
  const p100 = pct(100, 0);
  await until(S(24)); await play(new M.Transform(rD[0].bar, bar(100, rowY(0), C.cyan)), new M.FadeOut(new M.VGroup(rD[0].pct, cut2, ...segs)),
    new M.FadeIn(p100), ...fbox(['share again', ['80 ÷ 80 = 100%', C.cyan]]), ...say('MONDAY: 100%'));
  segs = []; run = 0;

  // 25-26 the three steps side by side: 2, then 3, then 1
  const COLX = P ? [-2.6, 0, 2.6] : [CX - 2.9, CX, CX + 2.9], CWD = P ? 2.15 : 2.5, CG = P ? 0.7 : 0.65;
  const HY = P ? 1.15 : 1.0, CY0 = P ? 0.45 : 0.35;
  const sets = [['after “open”', ['at 60%', 'on 40%']], ['after “at”', ['nine 40%', 'ten 30%', 'noon 30%']], ['after “on”', ['Monday 100%']]];
  const mkCols = () => sets.map(([head, kept], c) => {
    const x = COLX[c];
    const hd = T(head, 18, C.muted); hd.moveTo([x, HY, 0]);
    const cards = kept.flatMap((s, i) => {
      const y = CY0 - i * CG;
      const r = new M.RoundedRectangle({ width: CWD, height: 0.48, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 }); r.setFill(C.cyan, 0.12); r.moveTo([x, y, 0]);
      const t = T(s, 18, C.cyan, true); t.moveTo([x, y, 0]);
      return [r, t];
    });
    const cnt = T(`${kept.length} kept`, 22, C.amber, true); cnt.moveTo([x, CY0 - 2 * CG - 0.75, 0]);
    return { x, n: kept.length, hd, cards, cnt };
  });
  const cols = mkCols();
  await until(S(25)); await play(new M.FadeOut(new M.VGroup(rD[0].lab, rD[0].bar, p100, fr, cap, t75, l75)), ...fbox(['tokens kept:', ['2, then 3, then 1', C.amber]], C.amber), ...say('THREE STEPS SIDE BY SIDE'));
  await play(fadeAll(cols.flatMap(c => [c.hd, ...c.cards, c.cnt]), Math.max(2, E(25) - S(25) - 1.4)));
  await until(S(26)); await play(new M.Indicate(cols[1].cnt, { color: C.amber }), ...fbox(['spread out → more', ['one leads → fewer', C.violet]], C.violet), ...say('SPREAD OUT → MORE · ONE LEADS → FEWER', C.violet));
  await until(S(26) + 2.8); await play(new M.Indicate(cols[2].cnt, { color: C.amber }));

  // 27-32 the name and the rule
  const nuc = cols.map(c => {
    const r = new M.RoundedRectangle({ width: CWD + 0.25, height: (c.n - 1) * CG + 0.78, cornerRadius: 0.18, color: C.green, strokeWidth: 3 });
    r.moveTo([c.x, CY0 - (c.n - 1) * CG / 2, 0]); return r;
  });
  await until(S(27)); await play(new M.LaggedStart(nuc.map(r => new M.Create(r)), { lagRatio: 0.3, runTime: 1.6 }), ...say('NUCLEUS = THE CORE OF THE LIST', C.green));
  await until(S(28)); await play(...say('NUCLEUS SAMPLING = TOP-P SAMPLING', C.green));
  await until(S(29)); await play(...fbox([['p = 75%', C.amber], 'the target total'], C.amber), ...say('THE TARGET IS CALLED p', C.amber));
  await until(S(30)); await play(...fbox(['from the top, keep', 'the fewest tokens', 'whose probabilities', ['add up to at least p', C.amber]], C.amber),
    ...say('KEEP THE FEWEST THAT REACH p', C.amber));
  await until(S(31)); await play(...fbox(['1. keep the fewest', '   top tokens that', '   reach p', '2. share again', ['3. draw one token', C.amber]]),
    ...say('THEN SHARE AGAIN, AND DRAW', C.green));
  await until(S(32)); await play(new M.Indicate(nuc[0], { color: C.amber }), ...fbox(['running total: 45, 75', ['75 reaches p: stop', C.amber], 'kept: at, on'], C.amber),
    ...say('FEWEST = STOP AS SOON AS p IS REACHED', C.amber));

  // 33-35 compare with top-k: how many against how much
  const TLX = P ? -2.4 : CX - 2.4, TCX = k => (P ? -0.5 : CX - 0.6) + k * (P ? 1.65 : 1.4), TY0 = 0.9;
  const thead = [0, 1, 2].map(k => { const t = T(`step ${k + 1}`, 18, C.muted); t.moveTo([TCX(k), TY0, 0]); return t; });
  const rule = new M.Line({ start: [TLX - 0.9, TY0 - 0.35, 0], end: [TCX(2) + 0.6, TY0 - 0.35, 0], color: C.line, strokeWidth: 2 });
  const tcap = T('tokens kept at each step', 18, C.muted); tcap.moveTo([(TLX + TCX(2)) / 2, TY0 - 2.6, 0]);
  function trow(name, vals, y, color) {
    const n = T(name, 20, color, true); n.moveTo([TLX, y, 0]);
    return [n, ...vals.map((v, k) => { const t = T(String(v), 26, color, true); t.moveTo([TCX(k), y, 0]); return t; })];
  }
  const rk = trow('top-k', [2, 2, 2], TY0 - 0.9, C.violet), rn = trow('nucleus', [2, 3, 1], TY0 - 1.8, C.cyan);
  await until(S(33)); await play(new M.FadeOut(new M.VGroup(...cols.flatMap(c => [c.hd, ...c.cards, c.cnt]), ...nuc)), ...fbox(['how many tokens', ['does each keep?', C.violet]], C.violet),
    fadeAll([...thead, tcap], 0.9), new M.Create(rule), ...say('COMPARE WITH TOP-K', C.violet));
  await until(S(34)); await play(fadeAll(rk, 1.0), ...fbox(['top-k', ['keeps k = 2 tokens', C.violet]], C.violet), ...say('TOP-K FIXES HOW MANY', C.violet));
  await until(S(35)); await play(fadeAll(rn, 1.0), ...fbox(['nucleus keeps', ['75% of the', C.cyan], ['probability', C.cyan]]), ...say('NUCLEUS FIXES HOW MUCH PROBABILITY'));

  // 36-39 what it is for
  await until(S(36)); await play(...say('WHAT IS IT FOR?', C.green));
  await until(S(37)); await play(new M.Indicate(rn[2], { color: C.green }), ...say('UNSURE → VARIETY · SURE → FOCUS', C.green));
  await until(S(37) + 2.2); await play(new M.Indicate(rn[3], { color: C.green }));
  await until(S(38)); await play(...fbox(['chat assistants:', 'top-p, often with', ['temperature', C.amber]], C.green), ...say('A COMMON SETTING FOR CHAT ASSISTANTS', C.green));
  const rE = rows(A, C.cyan);
  await until(S(39)); await play(new M.FadeOut(new M.VGroup(...thead, rule, tcap, ...rk, ...rn)), fadeAll(parts(rE), 1.2),
    ...fbox([['p = 100%: keep all 5', C.cyan]]), ...say('p = 100% KEEPS EVERY TOKEN'));
  await until(S(39) + 2.8); rE.slice(2).forEach(r => tint(r, C.pink));
  await play(...fbox([['p = 100%: keep all 5', C.cyan], ['small p: keep 1 or 2', C.amber]]), ...say('SMALL p KEEPS THE TOP 1 OR 2', C.amber));

  // 40-44 the trap: p too high lets the tail back in
  await until(S(40)); rE.forEach(r => tint(r, C.violet)); await play(...unbox(), ...say('THE TRAP', C.pink));
  await until(S(41)); await play(...say('p STILL NEEDS CARE', C.pink));
  await until(S(42)); await play(new M.LaggedStart([new M.Indicate(rE[3].bar, { color: C.pink }), new M.Indicate(rE[4].bar, { color: C.pink })], { lagRatio: 0.5, runTime: 1.6 }),
    ...say('p TOO HIGH → THE TAIL CREEPS BACK', C.pink));
  [fr, cap] = frame();
  const [t99, l99] = target(99);
  await until(S(43)); rE.slice(0, 4).forEach(r => tint(r, C.cyan));
  await play(new M.FadeIn(fr), new M.FadeIn(cap), new M.Create(t99), new M.FadeIn(l99),
    new M.LaggedStart(rE.slice(0, 4).map(add), { lagRatio: 0.6, runTime: 3.0 }),
    ...fbox(['p = 99%', '45, 75, 90, 96', ['96: not yet 99', C.amber]], C.amber), ...say('p = 99%: STILL 96 AFTER LATE', C.amber));
  await until(S(44)); tint(rE[4], C.cyan);
  await play(add(rE[4]), ...fbox(['p = 99%', '96 + 4 = 100', ['all 5 kept, purple too', C.pink]], C.pink), ...say('PURPLE IS KEPT TOO', C.pink));
  await play(new M.Flash(rE[4].bar, { color: C.pink }));

  // 45-46 a wrong but confident model
  const hy = [{ lab: word('wrong', 0), bar: bar(85, rowY(0), C.cyan) }, { lab: word('right', 1), bar: bar(15, rowY(1), C.pink) }];
  const made = T('a made-up step', 18, C.muted); made.moveTo([BX + made.getWidth() / 2, rowY(2), 0]);
  await until(S(45)); await play(new M.FadeOut(new M.VGroup(...parts(rE), ...segs, fr, cap, t99, l99)),
    fadeAll([hy[0].lab, hy[0].bar, hy[1].lab, hy[1].bar, made], 1.2),
    ...fbox(['nucleus: 1 token', ['small, but wrong', C.pink]], C.pink), ...say('HIGH PROBABILITY ON A WRONG TOKEN', C.pink));
  await until(S(46)); await play(new M.Indicate(hy[0].bar, { color: C.pink }), ...say('IT CANNOT FIX THE PROBABILITIES', C.pink));

  // 47 recap
  await until(S(47)); await play(new M.FadeOut(new M.VGroup(hy[0].lab, hy[0].bar, hy[1].lab, hy[1].bar, made)),
    fadeAll(mkCols().flatMap(c => [c.hd, ...c.cards, c.cnt]), 1.4),
    ...fbox(['keep the fewest top', 'tokens that reach p,', 'share again, draw', ['kept: 2, then 3, then 1', C.green]], C.green),
    ...say('RECAP: THE KEPT SET ADAPTS', C.green));
}

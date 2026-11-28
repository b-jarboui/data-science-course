// 20.3.2 Greedy decoding: always take the most likely token (live lesson, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.4;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.7, 1.0, 0], LOW = P ? [0, -5.6, 0] : BOXP;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan, at = BOXP) {
    const BOXP = at;
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
    const maxw = P ? FW - 0.6 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };
  const fadeAll = (arr, runTime = 1.0, lagRatio = 0.08) => new M.LaggedStart(arr.map(o => new M.FadeIn(o)), { lagRatio, runTime });

  // token cards: one row, laid out for the full sentence so nothing moves when a card is added
  const PRE = ['The', 'library', 'will', 'open'];
  const ROW1 = P ? 1.2 : 1.0, ROW2 = P ? 0.3 : 0.1;
  function cards(tokens, y, color) {
    const size = P ? 19 : 21;
    const texts = tokens.map((s, i) => T(s, size, i < 4 ? C.ink : color));
    const ws = texts.map(t => t.getWidth() + 0.14), gap = 0.12;
    const tot = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1), k = Math.min(1, (P ? FW - 0.8 : 7.6) / tot);
    let x = CX - tot * k / 2;
    return texts.map((t, i) => {
      const r = new M.RoundedRectangle({ width: ws[i], height: 0.52, cornerRadius: 0.1, color: i < 4 ? C.muted : color, strokeWidth: 2 });
      r.setFill(C.card, 0.95);
      const g = new M.VGroup(r, t); if (k < 1) g.scale(k);
      g.moveTo([x + ws[i] * k / 2, y, 0]); x += (ws[i] + gap) * k;
      return g;
    });
  }

  // 0-2 last lesson: drawing by chance gives different answers
  const rowA = cards([...PRE, 'at', 'ten', '.'], ROW1, C.violet), rowB = cards([...PRE, 'at', 'nine', '.'], ROW2, C.violet);
  await until(S(0)); await play(fadeAll(rowA, 1.6, 0.15), ...fbox(['last lesson:', ['each token drawn', C.violet], ['at random', C.violet]], C.violet, LOW),
    ...say('LAST LESSON: EACH TOKEN DRAWN AT RANDOM', C.violet));
  await until(S(1)); await play(fadeAll(rowB, 1.2, 0.15), ...fbox(['run 1: … open at ten.', 'run 2: … open at nine.', ['different answers', C.pink]], C.pink, LOW),
    ...say('SAME QUESTION, ANOTHER ANSWER', C.violet));
  await play(new M.Indicate(rowA[5], { color: C.pink, runTime: 0.8 }), new M.Indicate(rowB[5], { color: C.pink, runTime: 0.8 }));
  await until(S(2)); await play(...say('THE SAME ANSWER EVERY TIME? HOW?', C.amber));

  // 3-11 greedy, one step at a time: chances as bars, take the tallest
  const row = cards([...PRE, 'at', 'nine', '.'], ROW1, C.cyan);
  await until(S(3)); await play(new M.FadeOut(new M.VGroup(...rowA, ...rowB)), ...clearBox(), fadeAll(row.slice(0, 4), 1.0, 0.12), ...say('PREFIX: “The library will open”'));

  const BX = P ? -2.3 : -4.6, BARU = P ? 9 : 6.5, BH = P ? 0.45 : 0.34;
  const BY = k => ROW1 - (P ? 1.1 : 0.9) - k * (P ? 1.0 : 0.6);
  const rect = (w, y, color) => { const r = new M.Rectangle({ width: w, height: BH, color, strokeWidth: 1 }); r.setFill(color, 0.8); r.moveTo([BX + w / 2, y, 0]); return r; };
  function bars(items, grown = false) {
    return items.map(([tok, p], k) => {
      const y = BY(k), lab = T(tok, P ? 20 : 21, C.ink);
      lab.moveTo([BX - 0.15 - lab.getWidth() / 2, y, 0]);
      const full = rect(p / 100 * BARU, y, C.violet);
      const pct = T(p + '%', P ? 18 : 19, C.violet, true); pct.moveTo([BX + p / 100 * BARU + 0.1 + pct.getWidth() / 2, y, 0]);
      return { lab, full, pct, bar: grown ? full : rect(0.04, y, C.violet) };
    });
  }
  const grow = b => [new M.Transform(b.bar, b.full, { runTime: 0.7 }), new M.FadeIn(b.pct, { runTime: 0.7 })];
  const paint = (b, color, op) => { b.bar.setColor(color); b.bar.setFill(color, op); };
  const pick = (set, k) => set.forEach((b, i) => paint(b, i === k ? C.cyan : C.pink, i === k ? 0.85 : 0.4));
  const tallest = b => [new M.Indicate(b.lab, { color: C.cyan, runTime: 0.8 }), new M.Indicate(b.bar, { color: C.cyan, runTime: 0.8 })];
  const drop = set => new M.FadeOut(new M.VGroup(...set.flatMap(b => [b.lab, b.bar, b.pct])));
  const append = i => new M.FadeIn(row[i], { shift: [0, 0.15, 0] });

  const set1 = bars([['at', 45], ['on', 30], ['soon', 15], ['late', 6], ['purple', 4]], true);
  await until(S(4)); await play(fadeAll(set1.flatMap(b => [b.lab, b.bar]), 1.2), ...say('5 POSSIBLE NEXT TOKENS: BAR = PROBABILITY', C.violet));
  for (let k = 0; k < 5; k++) {
    await until(S(5) + k * 1.25);
    await play(new M.FadeIn(set1[k].pct), new M.Indicate(set1[k].bar, { color: C.violet, runTime: 0.7 }));
  }
  await until(S(6)); pick(set1, 0);
  await play(...tallest(set1[0]), ...fbox(['greedy rule:', ['take the tallest bar', C.cyan]], C.cyan, LOW), ...say('NO DRAWING: TAKE THE TALLEST BAR, “at”'));

  const set2 = bars([['nine', 40], ['ten', 30], ['noon', 30]]);
  await until(S(7)); await play(append(4), drop(set1), ...say('ADD “at”, THEN NEW PROBABILITIES'));
  await play(fadeAll(set2.flatMap(b => [b.lab, b.bar]), 0.8));
  for (let k = 0; k < 3; k++) { await until(S(8) + k * 1.2); await play(...grow(set2[k])); }
  await until(S(9)); pick(set2, 0);
  await play(...tallest(set2[0]), ...say('TALLEST AGAIN: “nine”'));
  await play(append(5), drop(set2));

  const set3 = bars([['.', 70], ['tomorrow', 30]], true);
  await until(S(10)); await play(fadeAll(set3.flatMap(b => [b.lab, b.bar, b.pct]), 0.9), ...say('AFTER “at nine”: “.” 70%'));
  pick(set3, 0); await play(...tallest(set3[0]));
  await play(append(6), drop(set3));
  await until(S(11)); await play(new M.LaggedStart(row.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.8 }), ...say('“The library will open at nine.”'));

  // 12-14 the name, no looking ahead, repeatable
  await until(S(12)); await play(...say('GREEDY DECODING', C.green), ...fbox(['greedy decoding:', ['take the most likely', C.cyan], ['token at every step', C.cyan]], C.green, LOW));
  await until(S(13)); await play(new M.LaggedStart(row.slice(4).map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.3, runTime: 1.8 }), ...say('GRAB THE BEST NOW, NEVER LOOK AHEAD', C.amber));
  await until(S(14)); await play(...say('SAME QUESTION → SAME ANSWER', C.green), ...fbox(['run 1: … open at nine.', 'run 2: … open at nine.', ['same answer twice', C.green]], C.green, LOW));

  // 15-18 the tree: one column per step, one branch = one token and its chance
  await until(S(15)); await play(new M.FadeOut(new M.VGroup(...row)), ...clearBox(), ...say('THE CHOICES AS A TREE'));
  const TX = P ? [-3.65, -1.35, 1.25] : [-6.3, -2.9, 0.4];
  const RT = P ? 1.5 : 1.2, RG = P ? 0.74 : 0.5, ry = r => RT - r * RG;
  const NS = P ? 19 : 20, ES = P ? 17 : 17;
  function node(tok, x, y) {
    const d = new M.Dot({ point: [x, y, 0], radius: 0.06, color: C.ink });
    const t = T(tok, NS, C.ink), w = t.getWidth(); t.moveTo([x + 0.08 + w / 2, y, 0]);
    return { d, t, x, y, right: x + 0.08 + w };
  }
  // a branch: slanted part, then a short level part that carries the chance
  function edge(a, b, p) {
    const ex = b.x - (P ? 0.75 : 0.9);
    const l1 = new M.Line({ start: [a.right + 0.04, a.y, 0], end: [ex, b.y, 0], color: C.muted, strokeWidth: 2 });
    const l2 = new M.Line({ start: [ex, b.y, 0], end: [b.x - 0.1, b.y, 0], color: C.muted, strokeWidth: 2 });
    const lab = T(p + '%', ES, C.muted, true); lab.moveTo([(ex + b.x - 0.1) / 2, b.y + 0.17, 0]);
    return { l1, l2, lab };
  }
  const tint = (e, c) => { e.l1.setColor(c); e.l2.setColor(c); };
  const branch = (e, n) => new M.LaggedStart([new M.Create(e.l1), new M.Create(e.l2), new M.FadeIn(n.d), new M.FadeIn(n.t), new M.FadeIn(e.lab)], { lagRatio: 0.3 });

  const nOpen = node('open', TX[0], (ry(1) + ry(7)) / 2);
  const n1 = { at: node('at', TX[1], ry(1)), on: node('on', TX[1], (ry(3) + ry(4)) / 2), soon: node('soon', TX[1], ry(5)), late: node('late', TX[1], ry(6)), purple: node('purple', TX[1], ry(7)) };
  const n2 = { nine: node('nine', TX[2], ry(0)), ten: node('ten', TX[2], ry(1)), noon: node('noon', TX[2], ry(2)), Monday: node('Monday', TX[2], ry(3)), time: node('time', TX[2], ry(4)) };
  const E1 = { at: edge(nOpen, n1.at, 45), on: edge(nOpen, n1.on, 30), soon: edge(nOpen, n1.soon, 15), late: edge(nOpen, n1.late, 6), purple: edge(nOpen, n1.purple, 4) };
  const E2 = { nine: edge(n1.at, n2.nine, 40), ten: edge(n1.at, n2.ten, 30), noon: edge(n1.at, n2.noon, 30), Monday: edge(n1.on, n2.Monday, 80), time: edge(n1.on, n2.time, 20) };
  const heads = [T('step 1', P ? 18 : 18, C.muted, true), T('step 2', P ? 18 : 18, C.muted, true)];
  heads.forEach((t, i) => t.moveTo([TX[i + 1] + 0.4, ry(7) - 0.55, 0]));

  const allBranches = [...Object.keys(E1).map(k => [E1[k], n1[k]]), ...Object.keys(E2).map(k => [E2[k], n2[k]])];
  await until(S(16)); await play(new M.FadeIn(nOpen.d), new M.FadeIn(nOpen.t), new M.FadeIn(heads[0]), new M.FadeIn(heads[1]), ...say('STARTS AT “open”, GROWS TO THE RIGHT'));
  await play(new M.LaggedStart(allBranches.map(([e, n]) => branch(e, n)), { lagRatio: 0.25, runTime: 2.6 }), ...say('ONE COLUMN PER STEP'));
  await until(S(17)); await play(new M.LaggedStart(allBranches.map(([e]) => new M.Indicate(e.lab, { color: C.violet })), { lagRatio: 0.15, runTime: 2.0 }), ...say('EACH BRANCH = ONE TOKEN + ITS PROBABILITY'));
  await until(S(18)); tint(E1.at, C.cyan); tint(E2.nine, C.cyan);
  await play(new M.LaggedStart([n1.at.t, n2.nine.t].map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.5, runTime: 1.6 }), ...say('PATH = ONE BRANCH PER STEP'));

  // 19-27 the chance of a path: 100 imagined answers
  await until(S(19)); await play(...say('HOW LIKELY IS THE PATH “at nine”?', C.amber));
  const GS = P ? 0.21 : 0.27, GC = P ? [0, -5.75] : [4.7, -1.7], GR = P ? 0.07 : 0.085;
  const gp = i => [GC[0] + (i % 10 - 4.5) * GS, GC[1] + (4.5 - Math.floor(i / 10)) * GS, 0];
  const gdot = (i, color, op) => { const d = new M.Dot({ point: gp(i), radius: GR, color }); d.setFill(color, op); return d; };
  const grid = Array.from({ length: 100 }, (_, i) => gdot(i, C.muted, 0.5));
  const recolor = (from, to, color, op, runTime = 1.6) => new M.LaggedStart(grid.slice(from, to).map((d, j) => new M.Transform(d, gdot(from + j, color, op))), { lagRatio: 0.05, runTime });

  await until(S(20)); await play(fadeAll(grid, 1.6, 0.02), ...say('IMAGINE 100 ANSWERS, DRAWN AT RANDOM', C.violet));
  await until(S(21)); await play(recolor(0, 45, C.cyan, 0.45), ...fbox([['“at”: 45 out of 100', C.cyan]], C.cyan), ...say('ABOUT 45 OF 100 START WITH “at”'));
  await until(S(22)); await play(recolor(0, 18, C.green, 1), ...fbox([['“at”: 45 out of 100', C.cyan], ['“nine”: 40% of those 45', C.green]], C.green), ...say('OF THOSE 45: ABOUT 40% SAY “nine”', C.green));
  await until(S(23)); await play(new M.LaggedStart(grid.slice(0, 18).map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.1, runTime: 1.6 }), ...fbox(['40% of 45', ['= 18', C.green]], C.green));
  const p18 = T('18%', P ? 17 : 19, C.green, true); p18.moveTo([n2.nine.right + 0.1 + p18.getWidth() / 2, n2.nine.y, 0]);
  await until(S(24)); await play(new M.FadeIn(p18), ...fbox(['“at nine”: 18 of 100', ['= 18%', C.green]], C.green), ...say('“at nine”: ABOUT 18%', C.green));
  await until(S(25)); await play(...fbox(['probability of a path =', 'its step probabilities', ['multiplied together', C.amber]], C.amber), ...say('PATH = STEP PROBABILITIES MULTIPLIED', C.amber));
  await until(S(26)); await play(...fbox(['45% = 0.45', '40% = 0.4'], C.cyan), new M.Indicate(E1.at.lab, { color: C.cyan }), new M.Indicate(E2.nine.lab, { color: C.cyan }), ...say('PERCENT → DECIMAL'));
  await until(S(27)); await play(...fbox(['0.45 × 0.4 = 0.18', ['= 18%', C.green]], C.green), new M.Indicate(p18, { color: C.green }));

  // 28-35 the branch greedy skipped: on Monday, 24%
  await until(S(28)); tint(E1.on, C.amber);
  await play(new M.Indicate(n1.on.t, { color: C.amber }), new M.Indicate(E1.on.l2, { color: C.amber }), ...say('THE BRANCH GREEDY SKIPPED: “on”', C.amber));
  await until(S(29)); await play(recolor(45, 75, C.amber, 0.45), new M.Indicate(E1.on.lab, { color: C.amber }), new M.Indicate(E1.at.lab, { color: C.cyan }),
    ...fbox([['“on”: 30 out of 100', C.amber]], C.amber), ...say('“on” 30%  <  “at” 45%', C.amber));
  await until(S(30)); tint(E2.Monday, C.amber);
  await play(new M.LaggedStart([E2.Monday.lab, E2.time.lab].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.5, runTime: 1.6 }), ...say('AFTER “on”: Monday 80%, time 20%', C.amber));
  await until(S(31)); await play(recolor(45, 69, C.amber, 1), ...fbox(['“on”: 30 out of 100', ['80% of 30 = 24', C.amber]], C.amber));
  const p24 = T('24%', P ? 17 : 19, C.amber, true); p24.moveTo([n2.Monday.right + 0.1 + p24.getWidth() / 2, n2.Monday.y, 0]);
  await until(S(32)); await play(new M.FadeIn(p24), ...fbox(['“on Monday”: 24 of 100', ['= 24%', C.amber]], C.amber), ...say('“on Monday”: ABOUT 24%', C.amber));
  await until(S(33)); await play(...fbox(['“on Monday”  24%', '“at nine”    18%', ['24% > 18%', C.amber]], C.amber), new M.Indicate(p24, { color: C.amber }), ...say('24% BEATS 18%', C.amber));
  await until(S(34)); await play(new M.LaggedStart([n1.on.t, n2.Monday.t, p24].map(o => new M.Indicate(o, { color: C.amber })), { lagRatio: 0.4, runTime: 1.8 }), ...say('“on Monday” BEATS GREEDY’S “at nine”', C.amber));
  await until(S(35)); tint(E1.on, C.pink);
  await play(new M.Indicate(E1.on.lab, { color: C.pink }), new M.Indicate(n1.on.t, { color: C.pink }), ...say('“on” LOST STEP 1, SO GREEDY NEVER LOOKED', C.pink));

  // 36-39 what greedy decoding is for
  await until(S(36)); await play(new M.FadeOut(new M.VGroup(...grid)), ...clearBox(), ...say('WHAT IS GREEDY DECODING FOR?', C.green));
  await until(S(37)); await play(...fbox(['fast:', 'one choice per step,', 'never goes back'], C.green, LOW),
    new M.LaggedStart([n1.at.t, n2.nine.t].map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.5, runTime: 1.6 }), ...say('FAST', C.green));
  await until(S(38)); await play(...fbox(['repeatable:', 'same prefix →', 'same answer'], C.green, LOW), ...say('REPEATABLE', C.green));
  await until(S(39)); await play(...fbox(['short fact answers:', 'a date', 'yes or no'], C.green, LOW), ...say('GOOD FOR SHORT FACT ANSWERS', C.green));

  // 40-43 the trap
  await until(S(40)); await play(...clearBox(), ...say('THE TRAP', C.pink));
  await until(S(41)); await play(...fbox(['best first step: “at”', ['best whole path:', C.amber], ['“on Monday”', C.amber]], C.pink, LOW),
    new M.Indicate(E1.at.lab, { color: C.cyan }), new M.Indicate(p24, { color: C.amber }), ...say('BEST STEP ≠ BEST PATH', C.pink));
  await until(S(42)); await play(...fbox(['“on”      30%  weaker', ['“Monday”  80%  much', C.amber], ['          stronger', C.amber]], C.amber, LOW),
    new M.LaggedStart([E1.on.lab, E2.Monday.lab].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.5, runTime: 1.6 }), ...say('WEAKER FIRST, MUCH STRONGER SECOND', C.amber));
  await until(S(43)); [E1.soon, E1.late, E1.purple, E2.ten, E2.noon, E2.time].forEach(e => tint(e, C.pink));
  await play(new M.LaggedStart([E1.on, E1.soon, E1.late, E1.purple, E2.ten, E2.noon].map(e => new M.Indicate(e.l2, { color: C.pink })), { lagRatio: 0.2, runTime: 2.0 }),
    ...say('DROPPED BRANCHES: NEVER VISITED AGAIN', C.pink));

  // 44-45 next lesson and recap
  await until(S(44)); await play(new M.Indicate(n1.at.t, { color: C.violet }), new M.Indicate(n1.on.t, { color: C.violet }), ...say('NEXT: KEEP MORE THAN ONE PATH ALIVE', C.violet));
  await until(S(45)); await play(...fbox(['greedy decoding:', 'most likely token', ['fast and repeatable', C.green], ['can miss the best path', C.pink]], C.cyan, LOW), ...say('RECAP: GREEDY DECODING'));
}

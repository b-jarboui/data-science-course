// 20.3.3 Beam search: keep the best few paths (live lesson, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const FIRST = [['at', 45], ['on', 30], ['soon', 15], ['late', 6], ['purple', 4]];
  // [parent in FIRST, token, step chance %, whole-path chance %]
  const SECOND = [[0, 'nine', 40, 18], [0, 'ten', 30, 13.5], [0, 'noon', 30, 13.5], [1, 'Monday', 80, 24], [1, 'time', 20, 6]];
  const PILL = P ? [0, 3.75, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -4.45, 0] : [5.15, -0.3, 0];
  const PRE_Y = P ? 2.85 : -0.3;
  const Y1 = P ? [2.1, 1.55, 1.0, 0.45, -0.1] : [0.9, 0.3, -0.3, -0.9, -1.5];
  const Y2 = P ? [-1.0, -1.55, -2.1, -2.65, -3.2] : [1.1, 0.5, -0.1, -0.9, -1.5];
  const X1 = P ? -2.9 : -3.4, W1 = 1.1, X2 = P ? -2.6 : 0.95, W2 = P ? 1.9 : 1.15;
  const K = P ? 0.05 : 1 / 30, BH = 0.26, CH = 0.46, TS = 18, GAP = 0.2;
  const BX1 = X1 + W1 / 2 + 0.15, BX2 = X2 + W2 / 2 + 0.15;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

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
    const maxw = P ? FW - 0.8 : 3.9;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOut = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // token card, chance bar, colouring
  function card(s, w = 0, color = C.muted) {
    const t = T(s, TS, C.ink), width = Math.max(w, t.getWidth() + 0.3);
    const r = new M.RoundedRectangle({ width, height: CH, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    return { r, t, g: new M.VGroup(r, t), w: width, x: 0, y: 0 };
  }
  const place = (c, x, y) => { c.r.moveTo([x, y, 0]); c.t.moveTo([x, y, 0]); c.x = x; c.y = y; return c; };
  function bar(v, x0, y, color = C.muted) {
    const w = v * K, b = new M.Rectangle({ width: w, height: BH, color, strokeWidth: 1 });
    b.setFill(color, 0.82); b.moveTo([x0 + w / 2, y, 0]);
    const lab = T(`${v}%`, 17, C.ink, true); lab.moveTo([x0 + w + 0.14 + lab.getWidth() / 2, y, 0]);
    return { b, lab, g: new M.VGroup(b, lab), end: x0 + w + 0.2 + lab.getWidth() };
  }
  function tint(row, color) {
    row.c.r.setColor(color); row.c.r.setFill(color, 0.16);
    row.b.b.setColor(color); row.b.b.setFill(color, 0.82);
    if (row.e) row.e.setColor(color);
  }
  function row(words, y, cx = 0, color = C.cyan) {
    const cs = words.map(s => card(s, 0, color)), wd = cs.reduce((a, c) => a + c.w, 0) + GAP * (cs.length - 1);
    let x = cx - wd / 2;
    cs.forEach(c => { place(c, x + c.w / 2, y); x += c.w + GAP; });
    return cs;
  }
  const all = rows => rows.flatMap(r => [...r.parts, r.b.g]);

  // the step-1 column of the tree (built twice: worked example and trap)
  function stepOne() {
    const pre = card('The library will open', 0, C.cyan);
    place(pre, P ? 0 : -6.95 + pre.w / 2, PRE_Y);
    const rows = FIRST.map(([s, v], i) => {
      const c = place(card(s, W1), X1, Y1[i]), b = bar(v, BX1, Y1[i]);
      const e = P ? null : new M.Line({ start: [pre.x + pre.w / 2 + 0.05, PRE_Y, 0], end: [X1 - c.w / 2 - 0.05, Y1[i], 0], color: C.muted, strokeWidth: 2 });
      return { c, b, e, parts: e ? [e, c.g] : [c.g] };
    });
    return { pre, rows };
  }

  // 0-4 greedy's answer and the path it never saw
  const G1 = P ? 1.6 : 0.5, G2 = P ? 0.6 : -0.5;
  const gRow = row(['The library will open', 'at', 'nine', '.'], G1, -0.5);
  const mRow = [place(card('on', 0, C.pink), gRow[1].x, G2), place(card('Monday', 0, C.pink), gRow[2].x, G2)];
  const lx = gRow[3].x + gRow[3].w / 2 + 0.5;
  const g18 = T('18%', 20, C.amber, true, true); g18.moveTo([lx, G1, 0]);
  const g24 = T('24%', 20, C.amber, true, true); g24.moveTo([lx, G2, 0]);
  await until(S(0)); await play(new M.LaggedStart(gRow.map(c => new M.FadeIn(c.g)), { lagRatio: 0.3, runTime: 2.4 }), ...fbox(['greedy decoding:', 'one token per step', ['= one path', C.amber]], C.amber), ...say('GREEDY DECODING: ONE PATH'));
  await until(S(1)); await play(new M.FadeIn(g18), ...say('PROBABILITY OF THIS PATH: 18%', C.amber));
  await until(S(2)); await play(new M.LaggedStart([new M.FadeIn(mRow[0].g), new M.FadeIn(mRow[1].g), new M.FadeIn(g24)], { lagRatio: 0.4, runTime: 2.0 }), ...fbox(['“on Monday” 24%', ['greedy never saw it', C.pink]], C.pink), ...say('“ON MONDAY” 24%: GREEDY NEVER SAW IT', C.pink));
  await until(S(3)); await play(...say('CATCH IT WITHOUT CHECKING EVERY PATH?', C.amber));
  await until(S(4)); await play(...fbox(['idea:', ['keep the best 2 paths', C.green], ['at every step', C.green]], C.green), ...say('IDEA: KEEP THE BEST 2 PATHS AT EVERY STEP', C.green));

  // 5-8 step one: five tokens, keep the two tallest
  const one = stepOne();
  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(...gRow.map(c => c.g), ...mRow.map(c => c.g), g18, g24)), new M.FadeIn(one.pre.g),
    new M.LaggedStart(one.rows.flatMap(r => r.parts.map(x => new M.FadeIn(x))), { lagRatio: 0.25, runTime: 2.2 }), ...say('STEP 1: THE FIVE FIRST TOKENS'));
  await until(S(6)); await play(new M.LaggedStart(one.rows.map(r => new M.FadeIn(r.b.g)), { lagRatio: 0.75, runTime: E(6) - S(6) - 0.4 }));
  await until(S(7));
  tint(one.rows[0], C.cyan); tint(one.rows[1], C.cyan);
  await play(new M.LaggedStart(one.rows.slice(0, 2).map(r => new M.Indicate(r.c.g, { color: C.cyan })), { lagRatio: 0.5, runTime: 1.6 }), ...say('KEEP THE 2 TALLEST: AT, ON', C.cyan));
  await until(S(8));
  one.rows.slice(2).forEach(r => tint(r, C.pink));
  await play(new M.LaggedStart(one.rows.slice(2).map(r => new M.Indicate(r.c.g, { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('DROPPED: SOON, LATE, PURPLE', C.pink));

  // 9-12 step two: extend both kept paths
  const rows2 = SECOND.map(([p, s, step, v], i) => {
    const c = place(card(P ? `${FIRST[p][0]} ${s}` : s, W2), X2, Y2[i]), b = bar(v, BX2, Y2[i], C.amber);
    const e = P ? null : new M.Line({ start: [one.rows[p].b.end + 0.05, Y1[p], 0], end: [X2 - c.w / 2 - 0.05, Y2[i], 0], color: C.muted, strokeWidth: 2 });
    return { p, s, step, v, c, b, e, parts: e ? [e, c.g] : [c.g] };
  });
  await until(S(9)); await play(new M.LaggedStart(one.rows.slice(0, 2).map(r => new M.Indicate(r.c.g, { color: C.cyan })), { lagRatio: 0.5, runTime: 1.6 }), ...say('STEP 2: EXTEND EACH KEPT PATH BY 1 TOKEN'));
  await until(S(10)); await play(new M.LaggedStart(rows2.slice(0, 3).flatMap(r => r.parts.map(x => new M.FadeIn(x))), { lagRatio: 0.4, runTime: Math.max(1.5, E(10) - S(10) - 0.2) }), new M.Indicate(one.rows[0].c.g, { color: C.cyan }));
  await until(S(11)); await play(new M.LaggedStart(rows2.slice(3).flatMap(r => r.parts.map(x => new M.FadeIn(x))), { lagRatio: 0.4, runTime: Math.max(1.5, E(11) - S(11) - 0.2) }), new M.Indicate(one.rows[1].c.g, { color: C.cyan }));
  await until(S(12)); await play(new M.LaggedStart(rows2.map(r => new M.Indicate(r.c.g, { color: C.violet })), { lagRatio: 0.25, runTime: 2.5 }), ...say('5 CANDIDATES: PATHS STILL BEING JUDGED', C.violet));

  // 13-18 the chance of each whole path
  await until(S(13)); await play(...say('WHOLE PATH: MULTIPLY THE STEPS', C.amber), ...fbox(['path probability =', 'step 1 probability', ['× step 2 probability', C.amber]], C.amber));
  for (let i = 0; i < 5; i++) {
    await until(S(14 + i));
    const r = rows2[i], [tok, par] = FIRST[r.p];
    const a = (r.step / 100).toFixed(2), b = (par / 100).toFixed(2), prod = String(+(r.step * par / 10000).toFixed(4));
    await play(new M.FadeIn(r.b.g), new M.Indicate(one.rows[r.p].b.g, { color: C.amber }),
      ...fbox([`${tok} ${r.s}: ${r.step}% of ${par}%`, `${a} × ${b} = ${prod}`, [`= ${r.v}%`, C.amber]], C.amber));
  }

  // 19-22 sort, keep the best two again
  const order = [3, 0, 1, 2, 4];
  await until(S(19)); await play(new M.LaggedStart(order.map(i => new M.Indicate(rows2[i].b.g, { color: C.amber })), { lagRatio: 0.3, runTime: 2.4 }),
    ...fbox(['sorted, best first:', ['24, 18, 13.5, 13.5, 6', C.amber]], C.amber), ...say('SORT THE 5, KEEP THE BEST 2', C.cyan));
  await until(S(20)); tint(rows2[3], C.cyan);
  await play(new M.Indicate(rows2[3].c.g, { color: C.cyan }), ...fbox(['sorted, best first:', '24, 18, 13.5, 13.5, 6', ['1st: on Monday 24%', C.cyan]]));
  await until(S(21)); tint(rows2[0], C.cyan);
  await play(new M.Indicate(rows2[0].c.g, { color: C.cyan }), ...fbox(['24, 18, 13.5, 13.5, 6', ['1st: on Monday 24%', C.cyan], ['2nd: at nine   18%', C.cyan]]));
  await until(S(22));
  const out2 = [1, 2, 4].map(i => rows2[i]);
  out2.forEach(r => tint(r, C.pink));
  await play(new M.FadeOut(new M.VGroup(...all(out2)), { runTime: 1.6 }), ...say('DROPPED: AT TEN, AT NOON, ON TIME', C.pink));

  // 23-24 pick the best kept path
  await until(S(23)); await play(new M.LaggedStart([new M.Indicate(rows2[3].b.g, { color: C.amber }), new M.Indicate(rows2[0].b.g, { color: C.amber })], { lagRatio: 0.5, runTime: 1.8 }),
    ...fbox(['kept paths:', ['on Monday  24%', C.cyan], ['at nine    18%', C.cyan]]), ...say('STOP AFTER 2 STEPS: PICK THE BEST KEPT PATH', C.amber));
  await until(S(24));
  tint(one.rows[1], C.green); tint(rows2[3], C.green);
  await play(new M.Flash(rows2[3].c.g, { color: C.green }), new M.Indicate(one.rows[1].c.g, { color: C.green }), new M.Indicate(rows2[3].c.g, { color: C.green }),
    ...say('BEST: “ON MONDAY” 24%. FOUND IT', C.green));

  // 25-27 the name, the flashlight, the beam width
  await until(S(25)); await play(...say('THIS IS CALLED BEAM SEARCH', C.cyan));
  const [bx, by] = BOXP;
  const torch = new M.Rectangle({ width: 0.55, height: 0.26, color: C.muted, strokeWidth: 2 });
  torch.setFill(C.muted, 0.7); torch.moveTo([bx - 1.5, by + 0.45, 0]);
  const cone = new M.Polygon({ vertices: [[bx - 1.22, by + 0.52, 0], [bx + 1.5, by + 0.78, 0], [bx + 1.5, by + 0.12, 0], [bx - 1.22, by + 0.38, 0]], color: C.cyan, strokeWidth: 1 });
  cone.setFill(C.cyan, 0.18);
  const lit = [0.6, 0.3, 0, -0.3, -0.6].map((dy, i) => new M.Dot({ point: [bx + 1.3, by + dy, 0], radius: 0.09, color: i < 2 ? C.cyan : C.muted }));
  await until(S(26)); await play(...boxOut(), new M.FadeIn(torch), new M.FadeIn(cone),
    new M.LaggedStart(lit.map(d => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 1.4 }), ...say('A FLASHLIGHT LIGHTS ONLY A FEW PATHS', C.amber));
  await until(S(27)); await play(new M.LaggedStart(lit.slice(0, 2).map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.5, runTime: 1.4 }),
    new M.LaggedStart(one.rows.slice(0, 2).map(r => new M.Indicate(r.c.g, { color: C.cyan })), { lagRatio: 0.5, runTime: 1.4 }), ...say('BEAM WIDTH = PATHS KEPT = 2', C.cyan));

  // 28-29 the method in words
  await until(S(28)); await play(new M.FadeOut(new M.VGroup(torch, cone, ...lit)),
    ...fbox(['at every step:', '1. extend each path', '2. multiply the step', '   probabilities', ['3. keep the best few', C.cyan]]), ...say('EXTEND → MULTIPLY → KEEP THE BEST', C.cyan));
  await until(S(29)); await play(...fbox(['when the kept paths', 'reach an end token:', ['choose the highest', C.amber], ['probability', C.amber]], C.amber), ...say('AT THE END: PICK THE HIGHEST PROBABILITY', C.amber));

  // 30-32 two special cases
  await until(S(30)); await play(...say('TWO SPECIAL CASES', C.violet));
  await until(S(31)); await play(new M.LaggedStart([new M.Indicate(one.rows[0].c.g, { color: C.violet }), new M.Indicate(rows2[0].c.g, { color: C.violet })], { lagRatio: 0.5, runTime: 1.8 }),
    ...fbox(['beam width 1:', 'keep 1 path per step', ['= greedy decoding', C.violet]], C.violet), ...say('WIDTH 1 = GREEDY', C.violet));
  await until(S(32)); await play(...fbox(['huge beam width:', 'checks every path', ['far too slow', C.pink]], C.pink), ...say('HUGE WIDTH = TOO SLOW FOR REAL MODELS', C.pink));

  // 33-36 the work at step two
  const CY = P ? [0.7, -2.4] : [0.7, -0.8], DX = P ? -3.0 : -2.4, DS = P ? 1.2 : 0.9;
  function lane(title, words, y, color) {
    const t = T(title, 19, color, false, true);
    t.moveTo(P ? [-3.4 + t.getWidth() / 2, y + 0.62, 0] : [-4.6, y, 0]);
    const dots = words.map((w, i) => {
      const x = DX + i * DS, d = new M.Dot({ point: [x, y, 0], radius: 0.13, color });
      const l = T(w, 17, C.muted); l.moveTo([x, y - 0.42, 0]);
      return new M.VGroup(d, l);
    });
    const n = T(P ? String(words.length) : `${words.length} scored`, P ? 30 : 22, C.amber, true, true);
    n.moveTo([P ? 3.3 : 2.3, y, 0]);
    const ghost = words.map((w, i) => { const g = new M.Circle({ radius: 0.13, color: C.muted, strokeWidth: 2 }); g.moveTo([DX + i * DS, y, 0]); return g; });
    return { t, dots, n, ghost };
  }
  const gl = lane('greedy', ['nine', 'ten', 'noon'], CY[0], C.amber);
  const bl = lane('beam, width 2', ['nine', 'ten', 'noon', 'Monday', 'time'], CY[1], C.cyan);
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(one.pre.g, ...all(one.rows), ...all([rows2[0], rows2[3]]))), ...boxOut(),
    new M.FadeIn(gl.t), new M.FadeIn(bl.t), new M.FadeIn(new M.VGroup(...gl.ghost, ...bl.ghost)), ...say('COMPARE THE WORK AT STEP 2', C.amber));
  await until(S(34)); await play(new M.LaggedStart([...gl.dots.map(d => new M.FadeIn(d)), new M.FadeIn(gl.n)], { lagRatio: 0.35, runTime: 2.0 }), ...say('GREEDY: THE 3 BRANCHES AFTER “AT”', C.amber));
  await until(S(35)); await play(new M.LaggedStart([...bl.dots.map(d => new M.FadeIn(d)), new M.FadeIn(bl.n)], { lagRatio: 0.3, runTime: 1.8 }), ...say('BEAM, WIDTH 2: 5 CANDIDATES', C.cyan));
  await until(S(36)); await play(...fbox(['greedy: 3 scored', '        best 18%', ['beam:   5 scored', C.cyan], ['        best 24%', C.cyan]]), ...say('MORE WORK, BUT A BETTER ANSWER', C.green));

  // 37-39 what it is for
  await until(S(37)); await play(new M.FadeOut(new M.VGroup(gl.t, gl.n, bl.t, bl.n, ...gl.dots, ...bl.dots, ...gl.ghost, ...bl.ghost)), ...boxOut(), ...say('WHAT IS BEAM SEARCH FOR?', C.amber));
  const AY = P ? 1.2 : 0.3, AX = P ? 0 : -1.2;
  const ans = row(['The library will open', 'on', 'Monday'], AY, AX);
  await until(S(38)); await play(new M.LaggedStart(ans.map(c => new M.FadeIn(c.g)), { lagRatio: 0.3, runTime: 1.6 }),
    ...fbox(['best next token:', 'at 45%', ['best whole answer:', C.cyan], ['on Monday 24%', C.cyan]]), ...say('THE MOST LIKELY WHOLE ANSWER', C.cyan));
  await until(S(39)); await play(...say('ONE RIGHT OUTPUT: TRANSLATION, SHORT SUMMARY', C.green));

  // 40-44 the trap: a path dropped early never comes back
  const trap = stepOne();
  trap.rows.forEach((r, i) => tint(r, i < 2 ? C.cyan : C.pink));
  await until(S(40)); await play(new M.FadeOut(new M.VGroup(...ans.map(c => c.g))), ...boxOut(), new M.FadeIn(trap.pre.g),
    new M.FadeIn(new M.VGroup(...all(trap.rows))), ...say('THE TRAP', C.pink));
  await until(S(41)); await play(new M.LaggedStart(trap.rows.slice(2).map(r => new M.Indicate(r.c.g, { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('DROPPED EARLY = NEVER COMES BACK', C.pink));
  await until(S(42)); await play(new M.Indicate(trap.rows[2].b.g, { color: C.pink }), new M.Flash(trap.rows[2].c.g, { color: C.pink }),
    ...fbox(['soon: 15%', ['dropped at step 1', C.pink]], C.pink));
  const ghost = card(P ? 'soon → a great sentence?' : 'a great sentence?', 0, C.muted);
  const gx0 = P ? X1 - W1 / 2 : X2 - W2 / 2, gy = P ? -0.85 : Y1[2];
  place(ghost, gx0 + ghost.w / 2, gy);
  const dl = P ? null : new M.DashedLine({ start: [trap.rows[2].b.end + 0.05, Y1[2], 0], end: [gx0 - 0.05, gy, 0], color: C.muted });
  await until(S(43)); await play(...(dl ? [new M.Create(dl)] : []), new M.FadeIn(ghost.g), ...say('THE BEAM CANNOT SEE PAST IT', C.pink));
  await until(S(44)); tint(trap.rows[2], C.cyan);
  await play(new M.Indicate(trap.rows[2].c.g, { color: C.cyan }), ...fbox(['beam width 3:', 'keeps “soon” too', ['but scores more paths', C.amber]], C.amber), ...say('WIDER BEAM: LESS RISK, MORE WORK', C.amber));

  // 45-46 most likely is not always most useful
  await until(S(45)); await play(new M.FadeOut(new M.VGroup(trap.pre.g, ...all(trap.rows), ghost.g, ...(dl ? [dl] : []))), ...boxOut(), ...say('MOST LIKELY ≠ ALWAYS MOST USEFUL', C.amber));
  await until(S(46)); await play(...fbox(['very likely text:', 'is often dull,', ['or repeats itself', C.pink]], C.pink), ...say('LIKELY TEXT CAN BE DULL OR REPEAT', C.pink));

  // 47 recap
  const fin = row(['The library will open', 'on', 'Monday'], AY, AX);
  await until(S(47)); await play(new M.LaggedStart(fin.map(c => new M.FadeIn(c.g)), { lagRatio: 0.3, runTime: 1.6 }),
    ...fbox(['beam search: keep', 'the few most likely', 'partial answers', ['finds what greedy', C.cyan], ['decoding misses', C.cyan]]), ...say('RECAP: KEEP THE BEST FEW PATHS', C.green));
}

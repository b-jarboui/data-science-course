// 9.2.7 Learning rates: how big a step (live version of script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared data (chapters/9.2.md): middle rent held at 10, loss = 3 + 2 × (step price − 2)²,
// start at step price 0 (loss 11, derivative −8), so one step lands at 8 × learning rate.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const loss = s => 3 + 2 * (s - 2) ** 2, slope = s => 4 * (s - 2);
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.2, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.3, -0.3, 0];
  const GX0 = P ? -3.0 : CX - 2.9, GX1 = P ? 3.3 : CX + 2.9, GY0 = P ? -4.6 : -2.3, GY1 = P ? 1.3 : 1.15;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const num = v => String(v).replace('-', '−');

  const txt = (s, size, color, p, mono = false) => { const t = T(String(s), size, color, mono); t.moveTo(p); return t; };
  const line = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dash = (a, b, color = C.muted) => new M.DashedLine({ start: a, end: b, color });
  function glow(p, color = C.amber, r = 0.1) {
    const halo = new M.Dot({ point: p, radius: r * 2.6, color }); halo.setFill(color, 0.18);
    return new M.VGroup(halo, new M.Dot({ point: p, radius: r, color }));
  }
  function head(from, to, color, h = 0.16) {
    const dx = to[0] - from[0], dy = to[1] - from[1], n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
    return [-1, 1].map(sd => line(to, [to[0] - ux * h - sd * uy * h * 0.6, to[1] - uy * h + sd * ux * h * 0.6, 0], color, 3));
  }
  const arrow = (a, b, color) => new M.VGroup(line(a, b, color, 3), ...head(a, b, color, Math.min(0.16, 0.4 * Math.hypot(b[0] - a[0], b[1] - a[1]))));
  function outline(w, h, p, color) { const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 2 }); r.setFill(color, 0); r.moveTo(p); return r; }

  // one picture, one set of marks, one note, one formula box at a time
  const now = {};
  function put(key, g) {
    const a = []; if (now[key]) a.push(new M.FadeOut(now[key])); if (g) a.push(new M.FadeIn(g));
    now[key] = g; return a;
  }

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
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
    const k = Math.min(1, (P ? FW - 1.2 : 4.0) / wd, (P ? 1.6 : 3.6) / ht);
    if (k < 1) { g.scale(k); g.moveTo(BOXP); }
    return put('box', g);
  }

  // the U: loss over step price (middle rent held at 10)
  function graph(xmin, xmax, ymax, xticks, yticks) {
    const X = x => GX0 + (x - xmin) / (xmax - xmin) * (GX1 - GX0), Y = y => GY0 + y / ymax * (GY1 - GY0);
    const p = (x, y) => [X(x), Y(y), 0];
    const items = [line([GX0, GY0, 0], [GX1, GY0, 0], C.muted, 2.4), line([GX0, GY0, 0], [GX0, GY1, 0], C.muted, 2.4)];
    xticks.forEach(v => items.push(line([X(v), GY0 - 0.07, 0], [X(v), GY0 + 0.07, 0]), txt(num(v), 16, C.muted, [X(v), GY0 - 0.28, 0], true)));
    yticks.forEach(v => items.push(line([GX0 - 0.07, Y(v), 0], [GX0 + 0.07, Y(v), 0]), txt(num(v), 16, C.muted, [GX0 - 0.34, Y(v), 0], true)));
    items.push(txt('loss', 17, C.muted, [GX0 + 0.35, GY1 + 0.25, 0]), txt('step price', 17, C.muted, [(GX0 + GX1) / 2, GY0 - 0.56, 0]));
    const r = Math.sqrt((ymax - 3) / 2), a = Math.max(xmin, 2 - r), b = Math.min(xmax, 2 + r);
    for (let i = 0; i < 90; i++) { const x0 = a + (b - a) * i / 90, x1 = a + (b - a) * (i + 1) / 90; items.push(line(p(x0, loss(x0)), p(x1, loss(x1)), C.cyan, 3.5)); }
    return { X, Y, p, g: new M.VGroup(...items) };
  }
  const GA = () => graph(-0.3, 4.3, 12.5, [0, 1, 2, 3, 4], [3, 11]);
  const GB = () => graph(-0.5, 6.5, 42, [0, 2, 4, 6], [11, 35]);
  const GC = () => graph(-7, 7, 150, [-6, -4, -2, 0, 2, 4, 6], [35, 131]);

  // a jump along the step price: an arc from one point of the U to another
  function hop(G, s0, s1, color) {
    const a = G.p(s0, loss(s0)), b = G.p(s1, loss(s1));
    const lift = Math.min(P ? 0.8 : 0.6, 0.2 + 0.25 * Math.hypot(b[0] - a[0], b[1] - a[1]));
    const c = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + lift, 0];
    const q = t => [0, 1].map(k => (1 - t) ** 2 * a[k] + 2 * t * (1 - t) * c[k] + t * t * b[k]).concat(0);
    const parts = [];
    for (let i = 0; i < 24; i++) parts.push(line(q(i / 24), q((i + 1) / 24), color, 3));
    return new M.VGroup(...parts, ...head(q(0.9), b, color, 0.14));
  }
  const start = G => {
    const sl = Math.abs((G.Y(loss(0.01)) - G.Y(11)) / (G.X(0.01) - G.X(0)));
    return new M.VGroup(glow(G.p(0, 11)), txt('11', 18, C.amber, [G.X(0) + 0.15, G.Y(11) - 0.32 - sl * 0.30, 0], true));
  };
  function trial(G, s1, lab, color, off) {
    const b = G.p(s1, loss(s1));
    return new M.VGroup(start(G), hop(G, 0, s1, color), glow(b, color), txt(lab, 18, color, [b[0] + off[0], b[1] + off[1], 0], true));
  }
  const tan = (G, s, wl, wr, color) => line(G.p(s - wl, loss(s) - slope(s) * wl), G.p(s + wr, loss(s) + slope(s) * wr), color, 3.5);

  // arrows: the gradient and steps that are a fraction of it
  const LG = GX1 - GX0 - 0.8, AX = GX0 + 0.4;
  function stepArrows(rows) {
    const y0 = P ? 0.4 : 0.8, dy = P ? 1.0 : 0.75, items = [];
    rows.forEach(([fr, c, lab], k) => {
      const y = y0 - k * dy;
      items.push(arrow([AX, y, 0], [AX + fr * LG, y, 0], c));
      if (lab) { const t = T(lab, 17, c); t.moveTo([AX + t.getWidth() / 2, y + 0.3, 0]); items.push(t); }
    });
    return new M.VGroup(...items);
  }

  // table of the five learning rates tried
  const TRIALS = [['0.01', '0.08', '10.4', C.green], ['0.1', '0.8', '5.9', C.green], ['0.25', '2', '3', C.green], ['0.5', '4', '11', C.muted], ['0.75', '6', '35', C.pink]];
  const TX = [-1.9, 0, 1.9].map(d => CX + d * (P ? 1.25 : 1)), TY0 = P ? 0.7 : 1.0, TH = P ? 0.72 : 0.5;
  const rowY = k => TY0 - (k + 1) * TH;
  function table() {
    const items = ['learning rate', 'new step price', 'loss after 1 step'].map((s, j) => txt(s, 16, C.muted, [TX[j], TY0, 0]));
    items.push(line([TX[0] - 0.95, TY0 - TH / 2, 0], [TX[2] + 0.95, TY0 - TH / 2, 0], C.muted, 1.5));
    TRIALS.forEach(([r, s, l, c], k) => items.push(txt(r, 20, C.amber, [TX[0], rowY(k), 0], true), txt(s, 20, C.ink, [TX[1], rowY(k), 0], true), txt(l, 20, c, [TX[2], rowY(k), 0], true)));
    return new M.VGroup(...items);
  }

  // learning rates from 0 to 1: where the loss falls, where it grows
  function rateLine() {
    const y = P ? -1.2 : -0.5, R = r => GX0 + 0.4 + r * (GX1 - GX0 - 0.8);
    const items = [line([R(0), y, 0], [R(0.5), y, 0], C.green, 6), line([R(0.5), y, 0], [R(1), y, 0], C.pink, 6)];
    [0, 0.25, 0.5, 0.75, 1].forEach(v => items.push(line([R(v), y - 0.12, 0], [R(v), y + 0.12, 0], C.ink, 2), txt(num(v), 17, C.muted, [R(v), y - 0.4, 0], true)));
    TRIALS.forEach(([r, , , c]) => items.push(glow([R(+r), y + 0.4, 0], c === C.muted ? C.amber : c, 0.08)));
    items.push(txt('loss falls', 19, C.green, [R(0.25), y + 1.0, 0]), txt('loss grows', 19, C.pink, [R(0.75), y + 1.0, 0]), txt('learning rate', 17, C.muted, [R(0.5), y - 0.85, 0]));
    return new M.VGroup(...items);
  }

  // loss after each step as bars (same scale: 131 = tallest)
  function bars(vals, rate) {
    const xs = [-1.8, 0, 1.8].map(d => CX + d), w = P ? 1.1 : 1.0, top = GY1 - 0.45;
    const items = [line([CX - 2.8, GY0, 0], [CX + 2.8, GY0, 0], C.muted, 2)];
    vals.forEach(([v, lab], k) => {
      const h = Math.max(0.03, (top - GY0) * v / 131), col = k === 0 ? C.amber : v > 11 ? C.pink : C.green;
      const b = new M.Rectangle({ width: w, height: h, color: col, strokeWidth: 1 }); b.setFill(col, 0.8); b.moveTo([xs[k], GY0 + h / 2, 0]);
      items.push(b, txt(lab, 18, col, [xs[k], GY0 + h + 0.25, 0], true), txt(['start', 'step 1', 'step 2'][k], 16, C.muted, [xs[k], GY0 - 0.27, 0]));
    });
    items.push(txt(`loss after each step · learning rate ${rate}`, 16, C.muted, [CX, GY0 - 0.62, 0]));
    return new M.VGroup(...items);
  }

  // 0-2 why one tenth?
  await until(S(0)); await play(...put('pic', stepArrows([[1, C.muted, 'gradient'], [0.1, C.amber, 'step = one tenth']])),
    ...fbox(['step = 0.1 × gradient', ['why 0.1?', C.amber]], C.amber), ...say('LAST TIME: ONE TENTH OF THE GRADIENT'));
  await until(S(1)); await play(...put('pic', stepArrows([0.01, 0.1, 0.25, 0.5, 0.75].map(r => [r, C.amber]))), ...put('box', null), ...say('TRY OTHER STEP SIZES', C.amber));
  await until(S(2)); await play(...fbox([['middle rent = 10 (held)', C.muted], ['step price: moves', C.cyan]]), ...say('ONLY THE STEP PRICE MOVES'));

  // 3-6 the U, the derivative at 0, the rule
  let G = GA();
  await until(S(3)); await play(...put('pic', G.g),
    ...put('marks', new M.VGroup(start(G), glow(G.p(2, 3), C.green), txt('bottom: 3', 17, C.green, [G.X(2), G.Y(3) - 0.38, 0]))),
    ...fbox(['step price 0 → loss 11', ['step price 2 → loss 3', C.green]]), ...say('BACK ON THE U'));
  await until(S(4)); await play(...put('note', tan(G, 0, 0.15, 0.6, C.amber)), ...fbox(['step price = 0', ['derivative = −8', C.amber]], C.amber), ...say('DERIVATIVE AT 0 = −8', C.amber));
  await until(S(5)); await play(...fbox(['new step price =', '  old step price', '  − learning rate', ['    × derivative', C.amber]]), ...say('THE STEP RULE'));
  await until(S(6)); await play(...fbox(['new = 0 − rate × (−8)', ['    = rate × 8', C.amber]], C.amber), ...say('MINUS A MINUS IS A PLUS', C.amber));

  // 7-9 rate 0.01: a crawl
  await until(S(7)); await play(...put('note', txt('step = 0.01 × 8 = ?', 17, C.muted, [G.X(1.6), G.Y(11) + 0.3, 0])), ...put('marks', start(G)), ...fbox(['learning rate = 0.01'], C.amber), ...say('A TINY RATE: ONE HUNDREDTH', C.muted));
  await until(S(8)); await play(...put('note', null), ...put('marks', trial(G, 0.08, '10.4', C.muted, [0.5, -0.2])),
    ...fbox(['0.01 × 8 = 0.08', ['loss: 11 → about 10.4', C.amber]], C.amber), ...say('STEP PRICE → 0.08', C.muted));
  await until(S(9)); await play(new M.Indicate(now.marks, { color: C.muted }), ...fbox(['one step: 11 → 10.4', ['100+ steps to get close', C.muted]]), ...say('BARELY A CHANGE: A CRAWL', C.muted));

  // 10-12 rate 0.1: a good stride
  await until(S(10)); await play(...put('marks', start(G)), ...fbox(['learning rate = 0.1'], C.amber), ...say('LAST TIME: ONE TENTH', C.amber));
  await until(S(11)); await play(...put('marks', trial(G, 0.8, '5.9', C.green, [0.35, 0.35])),
    ...fbox(['0.1 × 8 = 0.8', ['loss: 11 → about 5.9', C.amber]], C.amber), ...say('STEP PRICE → 0.8', C.green));
  await until(S(12)); await play(new M.Indicate(now.marks, { color: C.green }), ...say('A GOOD STRIDE DOWNHILL', C.green));

  // 13-15 rate 0.25: lands on the bottom
  await until(S(13)); await play(...put('marks', start(G)), ...fbox(['learning rate = 0.25'], C.amber), ...say('NOW A QUARTER', C.amber));
  await until(S(14)); await play(...put('marks', trial(G, 2, '3', C.green, [0, -0.38])),
    ...fbox(['0.25 × 8 = 2', ['loss = 3: the lowest', C.green]], C.green), ...say('RIGHT AT THE BOTTOM', C.green));
  await until(S(15)); await play(new M.Flash(now.marks.submobjects[2].submobjects[1], { color: C.green }), ...say('A PERFECT LANDING IN ONE STEP', C.green));

  // 16-19 rate 0.5: over the valley, same height
  await until(S(16)); await play(...put('marks', start(G)), ...fbox(['learning rate = 0.5'], C.amber), ...say('NOW ONE HALF', C.amber));
  await until(S(17)); await play(...put('marks', trial(G, 4, '11', C.amber, [0.45, 0])),
    ...fbox(['0.5 × 8 = 4', ['loss = 11: where we started', C.amber]], C.amber), ...say('STEP PRICE → 4', C.amber));
  await until(S(18)); await play(...put('note', new M.VGroup(dash(G.p(0, 11), G.p(4, 11), C.pink), txt('same height', 17, C.pink, [G.X(2), G.Y(11) - 0.3, 0]))),
    ...say('OVER THE VALLEY, SAME HEIGHT', C.pink));
  await until(S(19)); await play(...fbox(['loss: 11 → 11', ['change = 0', C.pink]], C.pink), ...say('NO PROGRESS AT ALL', C.pink));

  // 20-24 rate 0.75: the loss goes up
  G = GB();
  await until(S(20)); await play(...put('note', null), ...put('pic', G.g), ...put('marks', start(G)), ...fbox(['learning rate = 0.75'], C.amber), ...say('NOW THREE QUARTERS', C.amber));
  await until(S(21)); await play(...put('marks', new M.VGroup(start(G), glow([G.X(6), GY0, 0], C.pink, 0.08), dash([G.X(6), GY0 + 0.15, 0], [G.X(6), G.Y(35) - 0.2, 0], C.pink), txt('loss ?', 18, C.pink, [G.X(6) - 0.6, (GY0 + G.Y(35)) / 2, 0]))), ...fbox(['0.75 × 8 = 6'], C.pink), ...say('STEP PRICE → 6', C.pink));
  await until(S(21) + 2.6); await play(...fbox(['step price = 6', '10 − 6, 10, 10 + 6', ['guesses: 4, 10, 16', C.amber]], C.amber), ...say('CHECK: THE GUESSES', C.amber));
  await until(S(22)); await play(...fbox(['guesses: 4, 10, 16', 'rents:   9, 11, 13', ['misses: −5, −1, +3', C.violet]], C.violet), ...say('MISS = GUESS − RENT', C.violet));
  await until(S(22) + 3.6); await play(...fbox(['misses: −5, −1, +3', ['squared: 25, 1, 9', C.amber]], C.amber));
  await until(S(23)); await play(...put('marks', trial(G, 6, '35', C.pink, [-0.5, -0.1])),
    ...fbox(['25 + 1 + 9 = 35', ['loss: 11 → 35', C.pink]], C.pink), ...say('THE LOSS WENT UP', C.pink));
  await until(S(24)); await play(new M.Indicate(now.marks, { color: C.pink }), ...say('A DOWNHILL STEP MADE IT WORSE', C.pink));

  // 25-26 the derivative at 6
  await until(S(25)); await play(...put('note', tan(G, 6, 0.6, 0.35, C.pink)), ...say('AT 6 THE U IS STEEP', C.pink));
  await until(S(26)); await play(...fbox(['4 × (6 − 2) = 4 × 4', ['derivative = +16', C.amber]], C.amber), ...say('DERIVATIVE AT 6 = +16', C.amber));

  // 27-29 the second jump: diverging
  function bounce(G, second) {
    const items = [start(G), hop(G, 0, 6, C.pink), glow(G.p(6, 35), C.pink)];
    if (second) items.push(hop(G, 6, -6, C.pink), glow(G.p(-6, 131), C.pink));
    else items.push(glow([G.X(-6), GY0, 0], C.pink, 0.08));
    return new M.VGroup(...items);
  }
  G = GC();
  await until(S(27)); await play(...put('note', null), ...put('pic', G.g), ...put('marks', bounce(G, false)),
    ...fbox(['0.75 × 16 = 12', ['6 − 12 = −6', C.pink]], C.pink), ...say('BACK BY 12: FROM 6 TO −6', C.pink));
  await until(S(28)); await play(...put('marks', bounce(G, true)), ...fbox(['loss at −6 = 131', ['11 → 35 → 131', C.pink]], C.pink), ...say('EACH JUMP LANDS HIGHER', C.pink));
  await until(S(29)); await play(new M.Indicate(now.marks, { color: C.pink }), ...fbox([['DIVERGING', C.pink], 'it bounces out of the valley'], C.pink), ...say('THIS IS CALLED DIVERGING', C.pink));

  // 30 the name
  await until(S(30)); await play(...put('pic', table()), ...put('marks', outline(1.6, 5 * TH + 0.1, [TX[0], (rowY(0) + rowY(4)) / 2, 0], C.amber)),
    ...fbox([['LEARNING RATE', C.amber], 'the fraction of the', 'derivative we step'], C.amber), ...say('THIS NUMBER: THE LEARNING RATE', C.amber));

  // 31-33 why a big step fails
  G = GA();
  const ring = new M.Circle({ radius: 0.32, color: C.amber, strokeWidth: 2 }); ring.setFill(C.amber, 0); ring.moveTo(G.p(0, 11));
  await until(S(31)); await play(...put('pic', G.g),
    ...put('marks', new M.VGroup(start(G), tan(G, 0, 0.15, 0.6, C.amber), ring, txt('near here', 17, C.amber, [G.X(0) + 1.0, G.Y(11) + 0.2, 0]))),
    ...fbox([['DERIVATIVE', C.amber], 'a local reading:', 'true near where you stand'], C.amber), ...say('WHY CAN A BIG STEP FAIL?', C.amber));
  await until(S(32)); await play(...put('marks', new M.VGroup(start(G), tan(G, 0, 0.15, 1.375, C.amber), hop(G, 0, 4, C.pink), glow(G.p(4, 11), C.pink))),
    ...fbox(['a big step trusts −8', ['past the bottom', C.pink], ['onto the other wall', C.pink]], C.pink), ...say('IT TRUSTS THE READING TOO FAR', C.pink));
  await until(S(33)); await play(...put('pic', rateLine()), ...put('marks', null),
    ...fbox(['below 0.5: loss falls', 'at 0.5: loss stays 11', ['above 0.5: loss grows', C.pink]], C.pink), ...say('ABOVE ONE HALF: LOSS GROWS', C.pink));

  // 34-35 training = repeated stepping (rate 0.1)
  G = GA();
  const walk = [0]; for (let k = 0; k < 6; k++) walk.push(walk[k] - 0.1 * slope(walk[k]));
  const steps = [glow(G.p(0, 11)), ...walk.slice(1).map((s, k) => new M.VGroup(hop(G, walk[k], s, C.green), glow(G.p(s, loss(s)), C.green, 0.08)))];
  await until(S(34)); await play(...put('pic', G.g), ...put('marks', null),
    ...fbox(P ? [['TRAINING', C.green], 'step, step, step…', 'the model learns its numbers'] : [['TRAINING', C.green], 'step, step, step…', 'the model learns', 'its numbers'], C.green), ...say('TRAINING = REPEATED STEPPING', C.green),
    new M.LaggedStart(steps.map(x => new M.FadeIn(x)), { lagRatio: 0.6, runTime: 4 }));
  now.marks = new M.VGroup(...steps); // only ever faded out
  await until(S(35)); await play(...fbox([['too small → slow', C.muted], ['about right → fast', C.green], ['too big → broken', C.pink]], C.amber), ...say('SLOW, FAST OR BROKEN', C.amber));

  // 36 in practice
  await until(S(36)); await play(...put('pic', table()),
    ...put('marks', new M.VGroup(outline(TX[2] - TX[0] + 1.9, TH * 0.9, [TX[1], rowY(2), 0], C.green), txt('largest that still goes down', 17, C.green, [CX, rowY(4) - TH * 0.9, 0]))),
    ...fbox(['try a few rates', ['keep the largest whose', C.green], ['loss still goes down', C.green]], C.green), ...say('LARGEST RATE THAT STILL GOES DOWN', C.green));

  // 37-38 the trap: a rising loss, and the fix
  await until(S(37)); await play(...put('pic', bars([[11, '11'], [35, '35'], [131, '131']], '0.75')), ...put('marks', null),
    ...fbox([['TRAP', C.amber], 'loss rising ≠ bad model', ['the step may be too big', C.pink]], C.amber), ...say('LOSS RISING? CHECK THE STEP', C.amber));
  await until(S(38)); await play(new M.Transform(now.pic, bars([[11, '11'], [5.88, '5.9'], [4.04, '4.0']], '0.1')),
    ...fbox(['learning rate 0.75 → 0.1', ['loss: 11 → 5.9 → 4.0', C.green]], C.green), ...say('LOWER THE LEARNING RATE', C.green));

  // 39-40 Try it
  G = GB();
  await until(S(39)); await play(...put('pic', G.g),
    ...put('marks', new M.VGroup(start(G), hop(G, 0, 0.08, C.muted), hop(G, 0, 2, C.green), glow(G.p(2, 3), C.green), hop(G, 0, 6, C.pink), glow(G.p(6, 35), C.pink))),
    ...fbox([['TRY IT', C.amber], 'slide the learning rate', 'press step'], C.amber), ...say('CRAWL, LAND OR BOUNCE', C.amber));
  await until(S(40)); await play(...put('marks', new M.VGroup(start(G), dash([GX0, G.Y(11), 0], [GX1, G.Y(11), 0], C.amber), txt('loss 11', 16, C.amber, [GX1 - 0.45, G.Y(11) + 0.25, 0]))),
    ...fbox([['CHALLENGE', C.amber], 'first step leaves the loss', 'at 11: which rate?'], C.amber), ...say('FIND THE RATE THAT STAYS AT 11', C.amber));

  // 41 recap
  await until(S(41)); await play(...put('marks', new M.VGroup(start(G), hop(G, 0, 0.8, C.green), glow(G.p(0.8, loss(0.8)), C.green), hop(G, 0, 6, C.pink), glow(G.p(6, 35), C.pink))),
    ...fbox([['LEARNING RATE', C.amber], 'sets the step size', ['too big: loss grows', C.pink]], C.amber), ...say('RECAP: THE STEP SIZE MATTERS', C.amber));
}

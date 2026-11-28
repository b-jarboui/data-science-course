// 9.2.6 Gradient descent: walking downhill on the loss map (live manim-web lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Data: chapters/9.2.md (fixed, used exactly).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 1.75, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const GOLD = C.amber, GREEN = C.green;
  const fmt = v => String(v).replace('-', '−');
  const add = (p, d) => [p[0] + d[0], p[1] + d[1], 0];
  const txt = (s, size, color, p, mono = true) => { const t = T(s, size, color, mono); t.moveTo(p); return t; };
  const ln = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dash = (a, b, color = C.muted, w = 2) => new M.DashedLine({ start: a, end: b, color, strokeWidth: w });
  const out = (...objs) => new M.FadeOut(new M.VGroup(...objs));
  function arrow(a, b, color = GOLD, w = 4) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, h = Math.min(0.17, len * 0.4);
    return new M.VGroup(ln(a, b, color, w),
      ln(b, [b[0] - ux * h - uy * h * 0.6, b[1] - uy * h + ux * h * 0.6, 0], color, w),
      ln(b, [b[0] - ux * h + uy * h * 0.6, b[1] - uy * h - ux * h * 0.6, 0], color, w));
  }
  function glow(p, color = GOLD, r = 0.11) {
    const halo = new M.Dot({ point: p, radius: r * 2.4, color }); halo.setFill(color, 0.2);
    return new M.VGroup(halo, new M.Dot({ point: p, radius: r, color }));
  }

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const ind = rows.map(([s]) => cw * (s.length - s.trimStart().length));
    const wd = Math.max(...texts.map((t, i) => t.getWidth() + ind[i])) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + ind[i] + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const k = Math.min(1, (P ? FW - 1.2 : 4.0) / wd, (P ? 2.0 : 3.6) / ht);
    if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // loss map: step price across, middle rent up, contour rings of loss = 2(s − 2)² + 3(m − 11)²
  const U = P ? 1.5 : 1.25, MY = P ? -2.35 : -0.75;
  const mp = (s, m) => [CX + (s - 0.9) * U, MY + (m - 10.5) * U, 0];
  const inMap = (s, m) => s >= -1.2 && s <= 3 && m >= 9 && m <= 12;
  const grad = ([s, m]) => [4 * (s - 2), 6 * (m - 11)];
  const upEnd = q => { const [a, b] = grad(q); return mp(q[0] + 0.1 * a, q[1] + 0.1 * b); };
  const PTS = Array.from({ length: 11 }, (_, k) => [2 - 2 * 0.6 ** k, 11 - 0.4 ** k]);
  const at = k => mp(...PTS[k]);
  const LEVELS = [0.14, 0.39, 1.11, 3.36, 11, 18];
  let rings = {};
  function mapPicture() {
    const [x0, y0] = mp(-1.2, 9), [x1, y1] = mp(3, 12), items = [];
    [-1, 0, 1, 2].forEach(s => items.push(ln(mp(s, 9), mp(s, 12), C.grid, 1)));
    [10, 11].forEach(m => items.push(ln(mp(-1.2, m), mp(3, m), C.grid, 1)));
    [-1, 0, 1, 2, 3].forEach(s => items.push(txt(fmt(s), 16, C.muted, [mp(s, 9)[0], y0 - 0.22, 0])));
    [9, 10, 11, 12].forEach(m => items.push(txt(String(m), 16, C.muted, [x0 - 0.3, mp(0, m)[1], 0])));
    items.push(ln([x0, y0, 0], [x1, y0, 0], C.muted, 2), ln([x0, y0, 0], [x0, y1, 0], C.muted, 2),
      ln([x0, y1, 0], [x1, y1, 0], C.muted, 1), ln([x1, y0, 0], [x1, y1, 0], C.muted, 1));
    items.push(txt('step price →', 16, C.muted, [CX, y0 - 0.5, 0], false), txt('middle rent ↑', 16, C.muted, [x0 + 0.7, y1 + 0.25, 0], false));
    rings = {};
    LEVELS.forEach(k => {
      const parts = [];
      for (let i = 0; i < 72; i++) {
        const a = 2 * Math.PI * i / 72, b = 2 * Math.PI * (i + 1) / 72;
        const s0 = 2 + Math.sqrt(k / 2) * Math.cos(a), m0 = 11 + Math.sqrt(k / 3) * Math.sin(a);
        const s1 = 2 + Math.sqrt(k / 2) * Math.cos(b), m1 = 11 + Math.sqrt(k / 3) * Math.sin(b);
        if (inMap(s0, m0) && inMap(s1, m1)) parts.push(ln(mp(s0, m0), mp(s1, m1), k === 11 ? '#9cdddc' : '#3f7f95', 1.6));
      }
      rings[k] = new M.VGroup(...parts); items.push(rings[k]);
    });
    items.push(glow(mp(2, 11), GREEN, 0.08), txt('bottom', 17, GREEN, add(mp(2, 11), [0.62, 0]), false));
    return new M.VGroup(...items);
  }
  const startRing = () => { const r = new M.Circle({ radius: 0.1, color: GOLD, strokeWidth: 2 }); r.moveTo(at(0)); return r; };

  // rent picture: size step across, rent (hundreds of dollars) up
  const RX = P ? 2.2 : 1.7, RB = P ? -4.5 : -2.35, RY = P ? 0.78 : 0.52;
  const rp = (x, r) => [CX + x * RX, RB + (r - 8) * RY, 0];
  const DOTC = [C.cyan, C.ink, C.pink], RENT = [9, 11, 13];
  function rentPicture() {
    const items = [ln(rp(-1.55, 8), rp(1.5, 8), C.muted, 2), ln(rp(-1.55, 8), rp(-1.55, 14.2), C.muted, 2)];
    [8, 10, 12, 14].forEach(r => items.push(txt(String(r), 15, C.muted, add(rp(-1.55, r), [-0.3, 0]))));
    ['small', 'middle', 'large'].forEach((n, k) => items.push(txt(n, 15, DOTC[k], add(rp(k - 1, 8), [0, -0.25]), false)));
    items.push(txt('size step', 15, C.muted, add(rp(0, 8), [0, -0.55]), false));
    items.push(txt('rent (hundreds of $)', 15, C.muted, add(rp(-1.55, 14.2), [1.1, 0.25]), false));
    RENT.forEach((r, k) => items.push(glow(rp(k - 1, r), DOTC[k], 0.1)));
    return new M.VGroup(...items);
  }
  const rentLine = (s, m, color = GOLD, w = 4) => ln(rp(-1.4, m - 1.4 * s), rp(1.4, m + 1.4 * s), color, w);

  // 0-1 the foggy hillside (side view)
  const HX = P ? 1.15 : 0.95, HY = P ? 1.3 : 0.9, HB = P ? -4.8 : -2.4;
  const hp = (x, y) => [CX + x * HX, HB + y * HY, 0], hill = x => 0.12 * (x - 2.2) ** 2;
  const groundG = new M.VGroup(...Array.from({ length: 24 }, (_, i) => { const a = -3 + i / 4, b = a + 0.25; return ln(hp(a, hill(a)), hp(b, hill(b)), C.ink, 3); }));
  const fog = [[2.1, 0.45, 2.0, 1.0], [1.3, 0.3, 1.6, 0.7], [2.2, 1.2, 1.8, 0.7]].map(([x, y, w, h]) => {
    const r = new M.RoundedRectangle({ width: w * HX, height: h * HY, cornerRadius: 0.25, color: C.muted, strokeWidth: 0 });
    r.setFill(C.muted, 0.35); r.moveTo(hp(x, y)); return r; });
  const fogLab = txt('valley floor?', 16, C.ink, hp(2.1, 1.85), false);
  const WX = -1, wp = add(hp(WX, hill(WX)), [0, 0.12]);
  const you = glow(wp, GOLD, 0.12), youLab = txt('you', 16, GOLD, add(wp, [0, 0.42]), false);
  await until(S(0));
  await play(new M.FadeIn(groundG), ...fog.map(f => new M.FadeIn(f)), new M.FadeIn(fogLab), new M.FadeIn(you), new M.FadeIn(youLab),
    ...say('YOU CANNOT SEE THE VALLEY FLOOR', C.muted));

  const d = [HX, 0.24 * (WX - 2.2) * HY], dl = Math.hypot(...d), u = [d[0] / dl, d[1] / dl];
  const upEndH = add(wp, [-u[0], -u[1]]), stEndH = add(wp, [u[0] * 0.55, u[1] * 0.55]);
  const upA = arrow(wp, upEndH, GOLD, 3.5), upALab = txt('steepest uphill', 15, GOLD, add(upEndH, [-0.1, 0.3]), false);
  const stA = arrow(wp, stEndH, GREEN, 4), stALab = txt('small step', 15, GREEN, add(stEndH, [0.5, 0.3]), false);
  await until(S(1));
  await play(new M.FadeIn(upA), new M.FadeIn(upALab), new M.FadeIn(stA), new M.FadeIn(stALab),
    ...fbox(['1. feel the steepest uphill', '2. small step the other way', ['3. repeat', GREEN]]), ...say('FEEL · STEP · REPEAT', GOLD));

  // 2-9 first step on the loss map
  let map = mapPicture();
  await until(S(2));
  await play(out(groundG, ...fog, fogLab, you, youLab, upA, upALab, stA, stALab), new M.FadeIn(map), ...say('ON OUR LOSS MAP'));

  const p0 = at(0), p1 = at(1);
  let ring0 = startRing(), walker = glow(p0, GOLD, 0.12);
  const l11 = txt('loss 11', 16, GOLD, add(p0, [-0.75, 0]));
  await until(S(3));
  await play(new M.FadeIn(ring0), new M.FadeIn(walker), new M.FadeIn(l11),
    ...fbox(['step price  = 0', 'middle rent = 10', ['loss = 11', GOLD]], GOLD), ...say('START: THE FLAT LINE', GOLD));

  const up1 = arrow(p0, upEnd(PTS[0]), GOLD, 4);
  const up1Lab = txt('(−8, −6)', 17, GOLD, add(p0, P ? [0.1, -1.0] : [0.05, -0.8]));
  await until(S(4));
  await play(new M.Create(up1), new M.FadeIn(up1Lab), ...fbox(['gradient = (−8, −6)', ['points uphill', GOLD]], GOLD), ...say('THE GRADIENT POINTS UPHILL', GOLD));

  let dn1 = arrow(p0, p1, GREEN, 4);
  const dnLab = txt('downhill', 15, GREEN, add([(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0], [-0.5, 0.3]), false);
  await until(S(5));
  await play(new M.Create(dn1), new M.FadeIn(dnLab),
    ...fbox(['opposite of (−8, −6)', ['step price goes up', C.cyan], ['middle rent goes up', C.violet]], GREEN), ...say('STEP THE OPPOSITE WAY', GREEN));

  await until(S(6));
  await play(new M.Indicate(dn1, { color: GREEN }), ...fbox(['step = one tenth of', '  each gradient number']), ...say('A SMALL STEP: ONE TENTH'));

  const pm = mp(0.8, 10);
  const c1 = arrow(p0, pm, C.cyan, 3), c2 = arrow(pm, p1, C.violet, 3);
  const c1Lab = txt('+0.8', 17, C.cyan, [(p0[0] + pm[0]) / 2, p0[1] - 0.36, 0]);
  const c2Lab = txt('+0.6', 17, C.violet, [pm[0] + 0.38, (pm[1] + p1[1]) / 2, 0]);
  await until(S(7));
  await play(new M.FadeOut(up1Lab), new M.FadeOut(dnLab), new M.FadeIn(c1), new M.FadeIn(c2), new M.FadeIn(c1Lab), new M.FadeIn(c2Lab),
    ...fbox([['8 ÷ 10 = 0.8', C.cyan], ['6 ÷ 10 = 0.6', C.violet]]));

  await until(S(8));
  await play(new M.Transform(walker, glow(pm, GOLD, 0.12)), ...fbox(['new step price', ['0 + 0.8 = 0.8', C.cyan]], C.cyan), ...say('STEP PRICE: 0 → 0.8', C.cyan));
  await until(S(9));
  await play(new M.Transform(walker, glow(p1, GOLD, 0.12)),
    ...fbox(['step price  = 0.8', ['middle rent = 10 + 0.6', C.violet], ['            = 10.6', C.violet]], C.violet), ...say('MIDDLE RENT: 10 → 10.6', C.violet));

  // 10-14 check the new line on the rent picture
  let rpic = rentPicture();
  const line1 = rentLine(0.8, 10.6);
  await until(S(10));
  await play(out(map, ring0, l11, up1, dn1, c1, c2, c1Lab, c2Lab, walker), new M.FadeIn(rpic), new M.Create(line1),
    ...fbox(['new line:', 'guess = 10.6 + 0.8 × size step']), ...say('CHECK THE NEW LINE', GOLD));
  const GUESS = [9.8, 10.6, 11.4], GOFF = [[-0.5, 0.05], [0.45, -0.28], [0.55, -0.1]];
  const gDots = GUESS.map((g, k) => new M.Dot({ point: rp(k - 1, g), radius: 0.08, color: GOLD }));
  const gLabs = GUESS.map((g, k) => txt(String(g), 15, GOLD, add(rp(k - 1, g), GOFF[k])));
  await until(S(10) + 2.6);
  await play(new M.LaggedStart(gDots.map((g, k) => new M.FadeIn(new M.VGroup(g, gLabs[k]))), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['guesses', ['9.8   10.6   11.4', GOLD]]));

  const segs = GUESS.map((g, k) => ln(rp(k - 1, g), rp(k - 1, RENT[k]), DOTC[k], 3));
  const mLabs = [['+0.8', 9.4, 0.42], ['−0.4', 10.8, -0.45], ['−1.6', 12.2, -0.5]].map(([s, r, dx], k) => txt(s, 15, DOTC[k], add(rp(k - 1, r), [dx, 0])));
  await until(S(11));
  await play(new M.LaggedStart(segs.map((s, k) => new M.FadeIn(new M.VGroup(s, mLabs[k]))), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['miss = guess − rent', ['+0.8   −0.4   −1.6', GOLD]]), ...say('THE MISSES'));

  const sqs = [], sqLabs = [];
  [[0.8, 1, '0.64'], [0.4, -1, '0.16'], [1.6, -1, '2.56']].forEach(([m, side, s], k) => {
    const a = m * RY, x = rp(k - 1, 8)[0], y0 = rp(0, Math.min(GUESS[k], RENT[k]))[1];
    const r = new M.Rectangle({ width: a, height: a, color: DOTC[k], strokeWidth: 2 });
    r.setFill(DOTC[k], 0.3); r.moveTo([x + side * a / 2, y0 + a / 2, 0]); sqs.push(r);
    const lx = k === 2 ? x - a / 2 : x + side * (a + 0.4);
    sqLabs.push(txt(s, 15, DOTC[k], [lx, y0 + a / 2, 0]));
  });
  await until(S(12));
  await play(out(...mLabs), new M.LaggedStart(sqs.map((q, k) => new M.FadeIn(new M.VGroup(q, sqLabs[k]))), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['squared misses', ['0.64   0.16   2.56', GOLD]]), ...say('SQUARE EACH MISS'));

  await until(S(13));
  await play(...fbox(['0.64 + 0.16 + 2.56', ['loss = 3.36', GOLD], ['(was 11)', C.muted]], GOLD), ...say('ONE STEP: LOSS 11 → ABOUT 3', GOLD));

  const flat = dash(rp(-1.4, 10), rp(1.4, 10), C.muted, 2.5);
  const beforeLab = txt('before', 15, C.muted, add(rp(1.15, 10), [0, -0.25]), false);
  const afterLab = txt('after', 15, GOLD, add(rp(1.15, 10.6 + 0.8 * 1.15), [-0.1, 0.32]), false);
  await until(S(14));
  await play(out(...sqs, ...sqLabs, ...segs), new M.Create(flat), new M.FadeIn(beforeLab), new M.FadeIn(afterLab),
    ...say('TILTED UP, CLOSER TO ALL 3 DOTS', GOLD));

  // 15-21 repeat from the new spot
  map = mapPicture(); ring0 = startRing(); dn1 = arrow(p0, p1, GREEN, 4); walker = glow(p1, GOLD, 0.12);
  await until(S(15));
  await play(out(rpic, line1, ...gDots, ...gLabs, flat, beforeLab, afterLab), new M.FadeIn(map), new M.FadeIn(ring0), new M.FadeIn(dn1), new M.FadeIn(walker),
    ...fbox(['now at (0.8, 10.6)', ['loss = 3.36', GOLD]]), ...say('REPEAT FROM THE NEW SPOT', GREEN));

  await until(S(16)); await play(...say('FEEL THE GROUND AGAIN', GOLD));
  const up2 = arrow(p1, upEnd(PTS[1]), GOLD, 4), up2Lab = txt('(−4.8, −2.4)', 16, GOLD, add(p1, [-1.2, 0.2]));
  await until(S(16) + 3.6);
  await play(new M.Create(up2), new M.FadeIn(up2Lab), ...fbox(['gradient now', ['(−4.8, −2.4)', GOLD]], GOLD));

  const ghost = arrow(p0, upEnd(PTS[0]), C.muted, 3), ghostLab = txt('(−8, −6)', 15, C.muted, add(p0, P ? [0.1, -1.0] : [0.05, -0.8]));
  await until(S(17));
  await play(new M.FadeIn(ghost), new M.FadeIn(ghostLab), new M.Indicate(up2, { color: GOLD }),
    ...fbox(['before: (−8, −6)', ['now:    (−4.8, −2.4)', GOLD], 'shorter arrow']), ...say('SHORTER: THE GROUND IS LESS STEEP', C.muted));

  const p2 = at(2), dn2 = arrow(p1, p2, GREEN, 4);
  await until(S(18));
  await play(new M.Create(dn2), ...fbox([['4.8 ÷ 10 = 0.48', C.cyan], ['2.4 ÷ 10 = 0.24', C.violet], 'add them, as before'], GREEN), ...say('ONE TENTH AGAIN', GREEN));

  await until(S(19));
  await play(out(up2, up2Lab, ghost, ghostLab), new M.Transform(walker, glow(p2, GOLD, 0.12)),
    ...fbox(['step price  = 0.8 + 0.48', ['            = 1.28', C.cyan], 'middle rent = 10.6 + 0.24', ['            = 10.84', C.violet]]),
    ...say('NOW AT (1.28, 10.84)', GOLD));

  await until(S(20));
  await play(new M.Indicate(rings[1.11], { color: GOLD }), ...fbox(['loss: 11 → 3.36 → 1.1', ['now about 1.1', GOLD]], GOLD), ...say('LOSS ≈ 1.1', GOLD));

  const dn3 = arrow(p2, at(3), GREEN, 3.5), dn4 = arrow(at(3), at(4), GREEN, 3.5);
  await until(S(21));
  await play(new M.FadeIn(dn3), new M.Transform(walker, glow(at(3), GOLD, 0.12)), ...fbox([['step 3: loss ≈ 0.4', GOLD]], GOLD), ...say('STEP 3: LOSS ≈ 0.4', GOLD));
  await until(S(21) + 2.7);
  await play(new M.FadeIn(dn4), new M.Transform(walker, glow(at(4), GOLD, 0.12)),
    ...fbox(['step 3: loss ≈ 0.4', ['step 4: loss ≈ 0.1', GOLD]], GOLD), ...say('STEP 4: LOSS ≈ 0.1', GOLD));

  // 22 the loss after each step, as bars
  const LOSSES = [11, 3.36, 1.11, 0.39, 0.14, 0.05, 0.02, 0.006, 0.002, 0.0008, 0.0003];
  const base = P ? -4.6 : -2.35, top = P ? 4.2 : 2.9, sp = P ? 0.62 : 0.44, bw = P ? 0.42 : 0.3;
  const barFrame = new M.VGroup(ln([CX - 5.6 * sp, base, 0], [CX + 5.6 * sp, base, 0], C.muted, 2),
    txt('step', 15, C.muted, [CX, base - 0.5, 0], false), txt('loss after each step', 15, C.muted, [CX, base + top + 0.4, 0], false));
  const bars = LOSSES.map((v, k) => {
    const x = CX + (k - 5) * sp, h = Math.max(0.02, top * v / 11);
    const b = new M.Rectangle({ width: bw, height: h, color: GOLD, strokeWidth: 1 }); b.setFill(GOLD, 0.8); b.moveTo([x, base + h / 2, 0]);
    const parts = [b, txt(String(k), 13, C.muted, [x, base - 0.22, 0])];
    if (k <= 3) parts.push(txt(String(v), 13, GOLD, [x, base + h + 0.2, 0]));
    if (k === 10) parts.push(txt('< 0.001', 13, GREEN, [x - 0.2, base + 0.3, 0]));
    return new M.VGroup(...parts);
  });
  await until(S(22));
  await play(out(map, ring0, dn1, dn2, dn3, dn4, walker), new M.FadeIn(barFrame),
    new M.LaggedStart(bars.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.8 }),
    ...fbox(['loss after 10 steps', ['≈ 0.0003', GREEN], 'less than 1/1000'], GREEN), ...say('AFTER 10 STEPS: LOSS < 0.001', GREEN));

  // 23 the line almost passes through all three dots
  rpic = rentPicture();
  const lineF = rentLine(...PTS[10]);
  await until(S(23));
  await play(out(barFrame, ...bars), new M.FadeIn(rpic), new M.Create(lineF),
    ...fbox([['step price  ≈ 1.99', C.cyan], ['middle rent ≈ 11.00', C.violet], 'almost 2 and 11']), ...say('THE LINE ALMOST HITS ALL 3 DOTS', GOLD));

  // 24 the whole walk: steps shrink on their own
  map = mapPicture(); ring0 = startRing(); walker = glow(at(10), GOLD, 0.12);
  const path = PTS.slice(0, 10).map((_, k) => arrow(at(k), at(k + 1), GREEN, 3.5));
  await until(S(24));
  await play(out(rpic, lineF), new M.FadeIn(map), new M.FadeIn(ring0),
    new M.LaggedStart([...path.map(a => new M.FadeIn(a)), new M.FadeIn(walker)], { lagRatio: 0.3, runTime: 2.2 }), ...say('THE STEPS GOT SHORTER ON THEIR OWN', GREEN));
  const ups = [0, 1, 2, 3].map(k => arrow(at(k), upEnd(PTS[k]), GOLD, 3));
  await until(S(24) + 3.4);
  await play(new M.LaggedStart(ups.map(a => new M.FadeIn(a)), { lagRatio: 0.3, runTime: 1.4 }), ...say('FLATTER GROUND → SHORTER GRADIENT', GOLD));

  // 25-29 names and the formula
  await until(S(25)); await play(...fbox(['gradient descent', ['descent = going down', GREEN]], GREEN), ...say('GRADIENT DESCENT', GREEN));
  await until(S(26)); await play(...fbox(['learning rate', ['= the fraction we used', C.muted], ['= 0.1  (one tenth)', GOLD]], GOLD), ...say('LEARNING RATE = 1/10', GOLD));
  await until(S(27)); await play(...fbox(['for each knob:', 'new value = old value', '  − learning rate', '    × partial derivative']), ...say('ONE RULE FOR EACH KNOB'));
  await until(S(28));
  await play(new M.LaggedStart(ups.map(a => new M.Indicate(a, { color: GOLD })), { lagRatio: 0.2, runTime: 1.6 }), ...say('READ THE UPHILL ARROW', GOLD));
  await until(S(28) + 2.4);
  await play(new M.LaggedStart(path.map(a => new M.Indicate(a, { color: GREEN })), { lagRatio: 0.1, runTime: 1.8 }), ...say('STEP A SMALL FRACTION THE OTHER WAY', GREEN));
  await until(S(29));
  await play(...fbox(['new value = old value', ['  − learning rate', GOLD], '    × partial derivative', ['minus: uphill → downhill', GOLD]], GOLD),
    ...say('THE MINUS SIGN TURNS UPHILL INTO DOWNHILL', GOLD));

  // 30-31 what it is for: models with many knobs
  const KC = P ? -2.2 : -0.6, KH = P ? 3.0 : 2.6;
  const k1 = P ? [-2.25, KC, 0] : [CX - 2.0, KC, 0], k2 = P ? [1.35, KC, 0] : [CX + 1.05, KC, 0];
  const card = (p, w, color) => { const r = new M.RoundedRectangle({ width: w, height: KH, cornerRadius: 0.18, color, strokeWidth: 2 }); r.setFill(C.card, 0.9); r.moveTo(p); return r; };
  const knob = (p, i) => { const c = new M.Circle({ radius: 0.16, color: C.muted, strokeWidth: 2 }); c.setFill(C.card, 1); c.moveTo(p);
    const a = 0.6 + i * 0.7; return new M.VGroup(c, ln(p, add(p, [0.13 * Math.cos(a), 0.13 * Math.sin(a)]), C.ink, 2.5)); };
  const kPic = new M.VGroup(card(k1, P ? 2.6 : 1.9, C.cyan), card(k2, P ? 4.1 : 3.8, C.violet),
    txt('rent line', 17, C.cyan, add(k1, [0, KH / 2 - 0.32]), false), txt('chatbot', 17, C.violet, add(k2, [0, KH / 2 - 0.32]), false),
    knob(add(k1, [-0.4, 0.05]), 0), knob(add(k1, [0.4, 0.05]), 1), txt('2 knobs', 18, C.muted, add(k1, [0, -KH / 2 + 0.3]), false));
  const sp2 = P ? 0.72 : 0.65, dials = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) dials.push(knob(add(k2, [(c - 2) * sp2, 0.45 - r * 0.5]), r * 5 + c + 2));
  const millions = txt('… millions of knobs', 18, C.violet, add(k2, [0, -KH / 2 + 0.3]), false);
  await until(S(30));
  await play(out(map, ring0, ...path, ...ups, walker), new M.FadeIn(kPic), new M.LaggedStart(dials.map(k => new M.FadeIn(k)), { lagRatio: 0.08, runTime: 1.4 }),
    ...fbox(['every model learns by', 'new = old', '  − learning rate × gradient']), ...say('RENT LINE … CHATBOT: ALL LEARN THIS WAY'));
  await until(S(31)); await play(new M.FadeIn(millions), ...say('TOO MANY SETTINGS TO TRY THEM ALL', C.violet));
  await until(S(31) + 3.0);
  await play(new M.LaggedStart(dials.map(k => new M.Indicate(k, { color: GOLD })), { lagRatio: 0.08, runTime: 1.6 }), ...say('BUT IT CAN FEEL THE SLOPE AND STEP', GOLD));

  // 32-34 the trap: it stops wherever the ground is flat
  const KX = P ? 1.15 : 0.95, KY = P ? 1.6 : 1.2, KB = P ? -2.4 : -0.9;
  const kp = (x, y) => [CX + x * KX, KB + y * KY, 0];
  const bowl = x => 0.27 * x * x - 1.46, dips = x => 0.06 * x ** 4 - 0.5 * x * x + 0.2 * x;
  const curve = f => new M.VGroup(...Array.from({ length: 48 }, (_, i) => { const a = -3 + i / 8, b = a + 0.125; return ln(kp(a, f(a)), kp(b, f(b)), C.cyan, 3.5); }));
  const onCurve = (f, x) => add(kp(x, f(x)), [0, 0.13]);
  const bowlC = curve(bowl), dipC = curve(dips);
  const bowlLab = txt('our bowl, seen from the side', 15, C.muted, kp(0, 1.3), false);
  const xs1 = [-2.6, -1.43, -0.79, -0.43, -0.24, -0.13];
  const balls = xs1.map((x, i) => glow(onCurve(bowl, x), GOLD, i === xs1.length - 1 ? 0.11 : 0.07));
  const flatD = dash(kp(-0.7, -1.46), kp(0.7, -1.46), C.ink, 2.5), flatLab = txt('flat: it stops', 15, C.ink, add(kp(0, -1.46), [0, -0.32]), false);
  await until(S(32));
  await play(out(kPic, ...dials, millions), new M.FadeIn(bowlC), new M.FadeIn(bowlLab),
    new M.LaggedStart(balls.map(b => new M.FadeIn(b)), { lagRatio: 0.4, runTime: 2.0 }),
    ...fbox(['it stops where', ['gradient = 0  (flat)', GOLD]], GOLD), ...say('A TRAP: IT STOPS WHERE IT IS FLAT', C.pink));
  await play(new M.Create(flatD), new M.FadeIn(flatLab));

  await until(S(33)); await play(new M.Indicate(balls[balls.length - 1], { color: GREEN }), ...say('OUR BOWL: ONE FLAT SPOT = THE BOTTOM', GREEN));
  const dipLab = txt('some loss maps: several dips', 15, C.muted, kp(0, 1.3), false);
  await until(S(33) + 2.6);
  await play(new M.ReplacementTransform(bowlC, dipC), out(...balls, flatD, flatLab, bowlLab), new M.FadeIn(dipLab), ...say('SOME LOSS MAPS HAVE SEVERAL DIPS', C.pink));

  const xs2 = [2.9, 2.5, 2.2, 2.03, 1.95];
  const balls2 = xs2.map((x, i) => glow(onCurve(dips, x), GOLD, i === xs2.length - 1 ? 0.11 : 0.07));
  await until(S(34));
  await play(new M.LaggedStart(balls2.map(b => new M.FadeIn(b)), { lagRatio: 0.4, runTime: 1.8 }), ...say('THE WALK STOPS IN THIS DIP', GOLD));
  const stuck = new M.Circle({ radius: 0.24, color: C.pink, strokeWidth: 2.5 }); stuck.moveTo(onCurve(dips, 1.95));
  const stuckLab = txt('stuck here', 15, C.pink, add(kp(1.93, dips(1.93)), [0, -0.4]), false);
  const low = glow(onCurve(dips, -2.13), GREEN, 0.09), lowLab = txt('lowest dip', 15, GREEN, add(kp(-2.13, dips(-2.13)), [0, -0.3]), false);
  await play(new M.Create(stuck), new M.FadeIn(stuckLab), new M.FadeIn(low), new M.FadeIn(lowLab), ...say('NOT THE LOWEST DIP', C.pink));

  // 35 learning rate size
  await until(S(35));
  await play(...fbox([['learning rate = 0.1', GOLD], 'its size matters a lot', ['→ next lesson', C.muted]], GOLD), ...say('HOW BIG A STEP? NEXT LESSON', GOLD));

  // 36-37 Try it
  map = mapPicture(); walker = glow(p0, GOLD, 0.12);
  await until(S(36));
  await play(out(dipC, dipLab, ...balls2, stuck, stuckLab, low, lowLab), new M.FadeIn(map), new M.FadeIn(walker),
    ...fbox(['Try it:', '[ STEP ] = one step', ['dot walks down the map', GOLD], ['rent line swings to dots', C.cyan]]), ...say('TRY IT: PRESS STEP'));
  const dnT = arrow(p0, p1, GREEN, 4);
  await until(S(36) + 2.8);
  await play(new M.Create(dnT), new M.Transform(walker, glow(p1, GOLD, 0.12)));

  const q0 = [-0.9, 11.8];
  const Q = Array.from({ length: 7 }, (_, k) => mp(2 + (q0[0] - 2) * 0.6 ** k, 11 + (q0[1] - 11) * 0.4 ** k));
  await until(S(37));
  await play(new M.FadeOut(dnT), new M.Transform(walker, glow(Q[0], GOLD, 0.12)),
    ...fbox(['new start', 'count the steps', ['until loss < 1', GREEN]], GREEN), ...say('NEW START: HOW MANY STEPS TO LOSS < 1?', GREEN));

  // 38 recap
  const qPath = PTS.slice(0, 6).map((_, k) => arrow(at(k), at(k + 1), GREEN, 3.5));
  const recapRing = startRing(), recapWalker = glow(at(6), GOLD, 0.12);
  await until(S(38));
  await play(new M.FadeOut(walker), new M.FadeIn(recapRing), new M.LaggedStart([...qPath.map(a => new M.FadeIn(a)), new M.FadeIn(recapWalker)], { lagRatio: 0.4, runTime: 2.0 }),
    ...fbox(['new = old', '  − learning rate × gradient', ['repeat until flat', GREEN]], GREEN), ...say('RECAP: SMALL STEPS AGAINST THE GRADIENT', GREEN));
}

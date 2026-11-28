// 14.1.7 Linkage rules: how far apart are two groups?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Laptop: station grid left, trees right. Phone: big grid first; from beat 32 a small grid on top and
// the complete-linkage tree below; from beat 42 the single-linkage tree replaces the small grid.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const data = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const names = 'ABCDEF';
  const blue = '#60a5fa', orange = '#fb923c', purple = C.violet;
  const dist = (a, b) => Math.hypot(data[a][0] - data[b][0], data[a][1] - data[b][1]);

  const fadeIn = (m, runTime = 0.4) => new M.FadeIn(m, { runTime });
  const fadeOut = (m, runTime = 0.3) => new M.FadeOut(m, { runTime });
  const create = (m, runTime = 0.6) => new M.Create(m, { runTime });
  const line = (start, end, color = C.muted, strokeWidth = 2) => new M.Line({ start, end, color, strokeWidth });
  const dashed = (start, end, color, strokeWidth = 2.5) => new M.DashedLine({ start, end, color, strokeWidth });
  const label = (s, x, y, size, color = C.ink, mono = true, bold = false) =>
    T(s, size, color, mono, bold).moveTo([x, y, 0]);

  // ---------- layout ----------
  const BIG = P ? { x0: -3.4, y0: -4.6, u: 0.68, small: false } : { x0: -6.6, y0: -3.0, u: 0.5, small: false };
  const SMALL = P ? { x0: -2.0, y0: -1.4, u: 0.4, small: true } : BIG;
  let lay = BIG;
  const pos = (i, ly = lay) => [ly.x0 + data[i][0] * ly.u, ly.y0 + data[i][1] * ly.u, 0];
  let PILL = P ? [0, 2.3, 0] : [-4.1, 1.75, 0];
  let BOXP = P ? [0, 3.55, 0] : [3.6, -0.3, 0];
  const say = (s, color = C.cyan) => showA(s, color, PILL, 18);

  let boxNow = null;
  function fbox(rows, color = C.cyan) {
    const size = P ? 23 : 21, lh = P ? 0.45 : 0.4;
    const texts = rows.map(r => Array.isArray(r) ? T(r[0], size, r[1], true) : T(r, size, C.ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.6;
    const height = rows.length * lh + 0.3;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo([BOXP[0] - width / 2 + 0.3 + t.getWidth() / 2,
      BOXP[1] + ((rows.length - 1) / 2 - i) * lh, 0]));
    const box = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 0.8 : 5.2;
    if (width > maxW) box.scale(maxW / width).moveTo(BOXP);
    const a = boxNow ? [fadeOut(boxNow), fadeIn(box)] : [fadeIn(box)];
    boxNow = box;
    return a;
  }
  const clearBox = () => { const a = boxNow ? [fadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---------- station grid ----------
  function makeAxes(ly) {
    const q = (x, y) => [ly.x0 + x * ly.u, ly.y0 + y * ly.u, 0];
    const parts = [];
    const num = P ? (ly.small ? 17 : 20) : 15;
    for (let x = 0; x <= 10; x++) {
      parts.push(line(q(x, 0), q(x, 7), x ? C.grid : C.muted, x ? 1 : 2));
      if (x % 2 === 0) parts.push(label(String(x), q(x, 0)[0], ly.y0 - (P ? 0.27 : 0.22), num, C.muted));
    }
    for (let y = 0; y <= 7; y++) {
      parts.push(line(q(0, y), q(10, y), y ? C.grid : C.muted, y ? 1 : 2));
      if (y > 0 && y % 2 === 0) parts.push(label(String(y), ly.x0 - (P ? 0.27 : 0.22), q(0, y)[1], num, C.muted));
    }
    const name = P ? (ly.small ? 17 : 20) : 17;
    parts.push(label(ly.small ? 'Departures →' : 'Departures per hour →', ly.x0 + 5 * ly.u, ly.y0 - (P ? (ly.small ? 0.55 : 0.62) : 0.55), name, C.ink, false));
    parts.push(label(ly.small ? '↑ Returns' : '↑ Returns per hour', ly.x0 + (ly.small ? 0.8 : 1.5), ly.y0 + 7 * ly.u + 0.25, name, C.ink, false));
    return new M.VGroup(...parts);
  }
  const offsets = [[-0.24, 0.22], [-0.24, 0.22], [-0.24, 0.22], [-0.22, -0.24], [0.26, -0.2], [0.26, 0.2]];
  function makeDot(i, color, ly = lay) {
    const p = pos(i, ly);
    const k = ly.small ? 0.8 : 1;
    const halo = new M.Dot({ point: p, radius: 0.17 * k, color });
    halo.setFill(color, 0.2);
    const dot = new M.Dot({ point: p, radius: 0.08 * k, color });
    dot.setFill(color, 1);
    const size = P ? (ly.small ? 19 : 22) : 18;
    const t = label(names[i], p[0] + offsets[i][0] * k, p[1] + offsets[i][1] * k, size, C.ink, true, true);
    return new M.VGroup(halo, dot, t);
  }
  const cols = data.map(() => C.ink);
  let axes = makeAxes(lay);
  let dots = data.map((_, i) => makeDot(i, C.ink));
  function seg(a, b, color, isDashed = false, width = 3.5) {
    const pa = pos(a), pb = pos(b);
    const d = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    const ux = (pb[0] - pa[0]) / d, uy = (pb[1] - pa[1]) / d, r = 0.14;
    const s = [pa[0] + ux * r, pa[1] + uy * r, 0], e = [pb[0] - ux * r, pb[1] - uy * r, 0];
    return isDashed ? dashed(s, e, color) : line(s, e, color, width);
  }
  function recolor(i, color) {
    if (cols[i] === color) return [];
    cols[i] = color;
    return [new M.Transform(dots[i], makeDot(i, color), { runTime: 0.5 })];
  }
  let temp = [];
  const clearTemp = () => { const a = temp.map(m => fadeOut(m)); temp = []; return a; };
  function showTemp(...objs) { temp.push(...objs); return objs.map(o => create(o, 0.5)); }
  const outlineGroup = (ids, color) => {
    const ps = ids.map(i => pos(i));
    const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]), pad = P ? 0.45 : 0.34;
    const w = Math.max(...xs) - Math.min(...xs) + 2 * pad, h = Math.max(...ys) - Math.min(...ys) + 2 * pad;
    return new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.2, color, strokeWidth: 2 })
      .moveTo([(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2, 0]);
  };

  // ---------- trees (two slots, same scale 0..10) ----------
  function slot(which) {
    if (which === 'B') return P
      ? { dax: -3.4, lx: i => -2.9 + i * 1.16, db: -6.0, ds: 0.31 }
      : { dax: -0.7, lx: i => -0.1 + i * 1.15, db: -3.1, ds: 0.29 };
    return P
      ? { dax: -3.4, lx: i => -2.9 + i * 1.16, db: -1.1, ds: 0.26 }
      : { dax: -6.75, lx: i => -6.15 + i * 0.85, db: -3.1, ds: 0.29 };
  }
  function treeAxes(sl, title) {
    const hy = h => sl.db + h * sl.ds;
    const parts = [line([sl.dax, hy(0), 0], [sl.dax, hy(10), 0], C.muted, 2),
      line([sl.dax, hy(0), 0], [sl.lx(5) + 0.35, hy(0), 0], C.muted, 2)];
    for (let h = 0; h <= 10; h += 2) {
      parts.push(line([sl.dax - 0.06, hy(h), 0], [sl.dax + 0.06, hy(h), 0], C.muted, 1.5));
      parts.push(label(String(h), sl.dax - 0.28, hy(h), P ? 17 : 15, C.muted));
    }
    parts.push(label(title, (sl.dax + sl.lx(5)) / 2, hy(10) + (P ? 0.42 : 0.38), P ? 18 : 16, C.ink, false));
    names.split('').forEach((n, i) => parts.push(label(n, sl.lx(i), sl.db - 0.3, P ? 21 : 18, C.ink, true, true)));
    return new M.VGroup(...parts);
  }
  // branch pieces for a tree: returns { pieces: [VGroup per merge] }
  function branches(sl, h) {
    const hy = v => sl.db + v * sl.ds;
    const X = i => sl.lx(i);
    const v = (x, a, b, c) => line([x, hy(a), 0], [x, hy(b), 0], c, 3);
    const hz = (x0, x1, y, c) => line([x0, hy(y), 0], [x1, hy(y), 0], c, 3);
    // tags sit just under their join line (inside the branch), where no higher branch rises
    const tag = (s, x, y, c, above = false) => label(s, x, hy(y) + (above ? 1 : -1) * (P ? 0.22 : 0.2), P ? 18 : 15, c);
    const abX = (X(0) + X(1)) / 2, deX = (X(3) + X(4)) / 2;
    const abcX = (abX + X(2)) / 2, defX = (deX + X(5)) / 2;
    const ab = [v(X(0), 0, h.ab, blue), v(X(1), 0, h.ab, blue), hz(X(0), X(1), h.ab, blue)];
    const de = [v(X(3), 0, h.de, orange), v(X(4), 0, h.de, orange), hz(X(3), X(4), h.de, orange)];
    const c = [v(X(2), 0, h.abc, blue), v(abX, h.ab, h.abc, blue), hz(abX, X(2), h.abc, blue)];
    const f = [v(X(5), 0, h.def, orange), v(deX, h.de, h.def, orange), hz(deX, X(5), h.def, orange)];
    const tp = [v(abcX, h.abc, h.top, C.cyan), v(defX, h.def, h.top, C.cyan), hz(abcX, defX, h.top, C.cyan)];
    if (h.tags) {
      ab.push(tag('1.41', abX, h.ab, blue));
      de.push(tag('1.41', deX, h.de, orange));
      c.push(tag(h.abc.toFixed(2), abcX, h.abc, blue));
      // right of F and above its join, clear of the cut line at 5 and of the top branch
      f.push(label(h.def.toFixed(2), X(5) + 0.42, hy(h.def) + (P ? 0.22 : 0.2), P ? 18 : 15, orange));
      tp.push(tag(h.top.toFixed(2), (abcX + defX) / 2, h.top, C.cyan, true));
    }
    return { ab: new M.VGroup(...ab), de: new M.VGroup(...de), c: new M.VGroup(...c), f: new M.VGroup(...f), top: new M.VGroup(...tp) };
  }
  function cutAt(sl, h) {
    const y = sl.db + h * sl.ds;
    return new M.VGroup(new M.DashedLine({ start: [sl.dax, y, 0], end: [sl.lx(5) + 0.35, y, 0], color: C.amber, strokeWidth: 3 }),
      label(`cut = ${h}`, sl.dax + (P ? 0.62 : 0.6), y + 0.22, P ? 18 : 16, C.amber, true, true));
  }
  function groupPills(sl, groups) {
    return new M.VGroup(...groups.map(([ids, color]) => {
      const xs = ids.map(i => sl.lx(i));
      return pill(ids.map(i => names[i]).join(''), color, P ? 17 : 15)
        .moveTo([(Math.min(...xs) + Math.max(...xs)) / 2, sl.db - (P ? 0.72 : 0.66), 0]);
    }));
  }
  const H = { ab: Math.SQRT2, de: Math.SQRT2 };
  const completeH = { ...H, abc: Math.sqrt(8), def: Math.sqrt(29), top: dist(0, 5), tags: true };
  const singleH = { ...H, abc: Math.SQRT2, def: Math.sqrt(17), top: Math.sqrt(20), tags: false };

  // ---------- intro signs ----------
  const signs = data.map((_, i) => {
    const x = P ? (i % 3 - 1) * 2.4 : (i % 3 - 1) * 1.5 - 4.1;
    const y = P ? (i < 3 ? -0.9 : -3.9) : (i < 3 ? 0.2 : -1.6);
    const s = P ? 1.0 : 0.75;
    const card = new M.RoundedRectangle({ width: 1.8 * s, height: 1.6 * s, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
    card.setFill(C.card, 0.95);
    card.moveTo([x, y, 0]);
    const wy = y - 0.12 * s;
    const w1 = new M.Circle({ radius: 0.2 * s, color: C.cyan, strokeWidth: 2 }).moveTo([x - 0.38 * s, wy, 0]);
    const w2 = new M.Circle({ radius: 0.2 * s, color: C.cyan, strokeWidth: 2 }).moveTo([x + 0.38 * s, wy, 0]);
    const b1 = line([x - 0.38 * s, wy, 0], [x + 0.05 * s, wy + 0.3 * s, 0], C.cyan);
    const b2 = line([x + 0.05 * s, wy + 0.3 * s, 0], [x + 0.38 * s, wy, 0], C.cyan);
    return new M.VGroup(card, w1, w2, b1, b2, label(`Station ${names[i]}`, x, y - 0.55 * s, P ? 21 : 17, C.ink, false));
  });

  // ================= beats =================
  await until(S(0));
  await play(new M.LaggedStart(signs.map(s => fadeIn(s)), { lagRatio: 0.12, runTime: 1 }), ...say('SIX BICYCLE STATIONS'));
  await until(S(1));
  await play(...say('JOIN TWO GROUPS OR NOT?', C.amber), ...fbox(['Are two groups similar', 'enough to join?'], C.amber));
  await until(S(2));
  await play(...signs.map(s => fadeOut(s)), ...clearBox(), fadeIn(axes),
    new M.LaggedStart(dots.map(d => fadeIn(d)), { lagRatio: 0.15, runTime: 1 }), ...say('THE SAME SIX STATIONS'));
  await until(S(3));
  await play(...[0, 1, 2].flatMap(i => recolor(i, blue)), ...say('BLUE GROUP: A, B, C', blue));
  await until(S(4));
  await play(...[3, 4].flatMap(i => recolor(i, orange)), ...say('ORANGE GROUP: D, E · F WHITE', orange));
  await until(S(5));
  await play(...showTemp(outlineGroup([0, 1, 2], blue), outlineGroup([3, 4], orange)),
    ...say('HOW FAR APART ARE THE GROUPS?', C.amber));
  await until(S(6));
  await play(...fbox(['Two stations:', 'one distance']));
  await until(S(7));
  await play(...showTemp(seg(0, 1, C.cyan)), ...fbox(['One straight line', ['A to B ≈ 1.41', C.cyan]]));
  await until(S(8));
  await play(...clearTemp(), ...showTemp(outlineGroup([0, 1, 2], blue), outlineGroup([3, 4], orange)),
    ...fbox([['Blue: 3 stations', blue], ['Orange: 2 stations', orange]]));
  const pairs = [[0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4]];
  const faint = pairs.map(([a, b]) => seg(a, b, C.muted, true));
  await until(S(9));
  await play(...showTemp(...faint), ...say('MANY POSSIBLE LINES'), ...fbox(['3 × 2 = 6 possible lines']));
  await until(S(10));
  await play(...say('TWO FAMILIES ON A PLAYGROUND'), ...fbox(['Blue family · orange family', 'Which two people do we use?']));
  await until(S(11));
  await play(new M.Indicate(faint[4], { color: C.green, runTime: 0.9 }), ...fbox([['The two closest people', C.green]], C.green));
  await until(S(12));
  await play(new M.Indicate(faint[1], { color: C.pink, runTime: 0.9 }), ...fbox([['The two farthest people', C.pink]], C.pink));
  await until(S(13));
  await play(...fbox(['Both are distances', 'between the two families']));
  await until(S(14));
  await play(...say('LINKAGE RULE', C.green), ...fbox(['Linkage rule =', 'how to measure the distance', 'between two groups'], C.green));

  // 15-22: the six distances, one at a time
  const shown = pairs.map(([a, b]) => seg(a, b, C.cyan, false, 2.5));
  const rowsAt = n => {
    const txt = pairs.map(([a, b]) => {
      const d = dist(a, b);
      const v = Number.isInteger(Math.round(d * 1000) / 1000) ? `= ${Math.round(d)}` : `≈ ${d.toFixed(2)}`;
      return `${names[a]}–${names[b]} ${v}`.padEnd(12);
    });
    const r = [0, 2, 4].map(k => (k < n ? txt[k] : ' '.repeat(12)) + (k + 1 < n ? txt[k + 1] : ''));
    return r;
  };
  await until(S(15));
  await play(...clearTemp(), ...showTemp(outlineGroup([0, 1, 2], blue), outlineGroup([3, 4], orange)),
    ...say('EVERY BLUE-TO-ORANGE LINE'), ...fbox(['Draw each line', 'and measure it']));
  for (let k = 0; k < 6; k++) {
    await until(S(16 + k));
    await play(create(shown[k], 0.5), ...fbox(rowsAt(k + 1)));
  }
  await until(S(22));
  await play(...say('SIX DISTANCES'), ...shown.map(s => new M.Indicate(s, { color: C.cyan, runTime: 0.6 })));

  // 23-31: single and complete linkage on this pair of groups
  const cd = seg(2, 3, C.green, false, 5), ae = seg(0, 4, C.pink, false, 5);
  await until(S(23));
  await play(create(cd, 0.6), ...say('SHORTEST LINE: C TO D', C.green));
  await until(S(24));
  await play(...say('SINGLE LINKAGE', C.green), ...fbox([['Single linkage:', C.green], 'use the shortest line'], C.green));
  await until(S(25));
  await play(new M.Indicate(cd, { color: C.green }), ...fbox([['Single linkage', C.green], ['distance ≈ 4.47', C.green]], C.green));
  await until(S(26));
  await play(create(ae, 0.6), ...say('LONGEST LINE: A TO E', C.pink));
  await until(S(27));
  await play(...say('COMPLETE LINKAGE', C.pink), ...fbox([['Complete linkage:', C.pink], 'use the longest line'], C.pink));
  await until(S(28));
  await play(new M.Indicate(ae, { color: C.pink }), ...fbox([['Complete linkage', C.pink], ['distance ≈ 7.07', C.pink]], C.pink));
  await until(S(29));
  await play(...say('JOIN ONLY IF DISTANCE ≤ 5', C.amber), ...fbox(['Rule: join when the', ['distance is 5 or less', C.amber]], C.amber));
  await until(S(30));
  await play(new M.Indicate(cd, { color: C.green }), ...fbox([['Single: 4.47 ≤ 5', C.green], ['→ the groups join', C.green]], C.green));
  await until(S(31));
  await play(new M.Indicate(ae, { color: C.pink }), ...fbox([['Complete: 7.07 > 5', C.pink], ['→ they stay apart', C.pink]], C.pink));

  // 32: complete linkage from six separate stations, with a tree
  const SB = slot('B');
  const cTree = branches(SB, completeH);
  await until(S(32));
  {
    const old = [axes, ...dots, ...temp, ...shown, cd, ae];
    temp = [];
    data.forEach((_, i) => { cols[i] = C.ink; });
    if (P) { lay = SMALL; PILL = [0, 2.35, 0]; BOXP = [0, 3.6, 0]; } else { BOXP = [3.6, 1.3, 0]; }
    axes = makeAxes(lay);
    dots = data.map((_, i) => makeDot(i, C.ink));
    await play(...old.map(m => fadeOut(m)), ...clearBox(), fadeIn(axes), ...dots.map(d => fadeIn(d)),
      fadeIn(treeAxes(SB, '↑ Merge distance · complete linkage')), ...say('COMPLETE LINKAGE · A WHOLE TREE', C.pink));
  }
  await until(S(33));
  await play(...showTemp(seg(0, 1, C.pink, true)), ...recolor(0, blue), ...recolor(1, blue), create(cTree.ab, 0.7),
    ...say('ROUND 1 · A + B', blue), ...fbox([['A + B join at 1.41', blue]], blue));
  await until(S(34));
  await play(...clearTemp(), ...showTemp(seg(3, 4, C.pink, true)), ...recolor(3, orange), ...recolor(4, orange), create(cTree.de, 0.7),
    ...say('ROUND 2 · D + E', orange), ...fbox([['D + E join at 1.41', orange]], orange));
  await until(S(35));
  await play(...clearTemp(), new M.Indicate(dots[2], { color: C.amber, runTime: 0.9 }), ...say('C HAS NOT JOINED YET', C.amber));
  await until(S(36));
  await play(...showTemp(seg(1, 2, C.green, true), seg(0, 2, C.pink, true)),
    ...fbox([['C to B ≈ 1.41', C.green], ['C to A ≈ 2.83', C.pink]]));
  await until(S(37));
  await play(...recolor(2, blue), create(cTree.c, 0.7), ...say('ROUND 3 · C JOINS AT 2.83', blue),
    ...fbox(['Complete linkage:', ['farthest pair A–C ≈ 2.83', C.pink]], C.pink));
  await until(S(38));
  await play(...clearTemp(), ...showTemp(seg(4, 5, C.green, true), seg(3, 5, C.pink, true)), ...recolor(5, orange),
    create(cTree.f, 0.7), ...say('ROUND 4 · F JOINS AT 5.39', orange),
    ...fbox([['F to E ≈ 4.12', C.green], ['F to D ≈ 5.39', C.pink]]));
  await until(S(39));
  await play(...fbox(['Use the farther station:', ['D, at 5.39', C.pink]], C.pink));
  await until(S(40));
  await play(...clearTemp(), ...showTemp(seg(0, 5, C.pink, true)), create(cTree.top, 0.8),
    ...say('ROUND 5 · ONE GROUP AT 9.43'), ...fbox(['ABC + DEF', 'join at 9.43']));
  await until(S(41));
  await play(...fbox(['Farthest pair:', ['A to F ≈ 9.43', C.pink]], C.pink));

  // 42-45: the two trees side by side, one cut at 5
  const SA = slot('A');
  const sTree = branches(SA, singleH);
  await until(S(42));
  await play(...clearTemp(), fadeOut(axes), ...dots.map(d => fadeOut(d)),
    fadeIn(treeAxes(SA, '↑ Merge distance · single linkage')),
    fadeIn(new M.VGroup(sTree.ab, sTree.de, sTree.c, sTree.f, sTree.top)),
    ...say('SINGLE TREE · COMPLETE TREE'), ...fbox([['Single: top join 4.47', C.green], ['Complete: top join 9.43', C.pink]]));
  const cuts = [cutAt(SA, 5), cutAt(SB, 5)];
  await until(S(43));
  await play(...cuts.map(c => create(c, 0.8)), ...say('CUT BOTH TREES AT 5', C.amber), ...fbox(['Cutting line at height 5'], C.amber));
  await until(S(44));
  await play(fadeIn(groupPills(SA, [[[0, 1, 2, 3, 4, 5], C.cyan]])), ...say('SINGLE: ONE GROUP', C.green),
    ...fbox([['Single linkage:', C.green], 'all joins are below 5', '→ 1 group']));
  await until(S(45));
  await play(fadeIn(groupPills(SB, [[[0, 1, 2], blue], [[3, 4], orange], [[5], purple]])),
    ...say('COMPLETE: THREE GROUPS', C.pink), ...fbox([['Complete linkage:', C.pink], ['ABC', blue], ['DE   ·   F alone', orange]]));

  // 46-53: formulas, uses, traps, recap
  await until(S(46));
  await play(...say('TWO SHORT FORMULAS'), ...fbox(['Group distance', 'for two groups']));
  await until(S(47));
  await play(...fbox([['Single linkage =', C.green], 'smallest station-to-station', 'distance between the groups'], C.green));
  await until(S(48));
  await play(...fbox([['Complete linkage =', C.pink], 'largest station-to-station', 'distance between the groups'], C.pink));
  await until(S(49));
  await play(...say('SINGLE: CHAINS OF SHORT STEPS', C.green), ...fbox(['Use single linkage for groups', 'linked by short steps'], C.green));
  await until(S(50));
  await play(...say('COMPLETE: TIGHT GROUPS', C.pink), ...fbox(['Use complete linkage when', 'every station must stay close'], C.pink));
  await until(S(51));
  await play(...say('CAREFUL: LONG CHAINS', C.amber), ...fbox(['Single linkage: chain ends', 'can be very different'], C.amber));
  await until(S(52));
  await play(...say('CAREFUL: ONE FAR STATION', C.amber), ...fbox(['Complete linkage: one far station', 'can keep similar groups apart'], C.amber));
  await until(S(53));
  await play(...say('CLOSEST OR FARTHEST CONNECTION'),
    ...fbox([['Single = closest connection', C.green], ['Complete = farthest connection', C.pink]]));
}
